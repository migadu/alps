# Credential updates across ALPS instances

ALPS keeps each account's WebAuthn record (security keys, recovery codes, trust in linked accounts; see [WEBAUTHN.md](WEBAUTHN.md)) in the account's IMAP METADATA, or in another store where there is none ([below](#where-the-protocol-applies)). When several ALPS instances serve the same accounts, two of them can change the same record at the same time. This document describes how those changes stay consistent, on which stores, and what the operator has to provide.

Coordination uses only standard [IMAP METADATA](https://www.rfc-editor.org/rfc/rfc5464.html). There is no ALPS database, Sora-specific command, distributed lease, or dependency on gossip membership. The backend must provide atomic entry replacements and fresh, complete, consistent subtree snapshots: a write acknowledged before a read starts must be visible to that reader. Stale replicas, truncated listings, and a listing that tears across concurrent publication/pruning cannot safely supply this contract. Sora reads the subtree in one database query.

## Where the protocol applies

Every change to the account's WebAuthn record goes through one code path, `Session.WithWebAuthnRecord`: enrolling a key, removing a key, turning trust in linked accounts on or off, saving a key's signature count and flags after a key sign-in, replacing the recovery codes, spending a recovery code, and malformed-record cleanup.

That path uses the versioned protocol below only when the account's store can list a METADATA subtree. That means the IMAP provider (directly or under `multi`), on a server that advertises `METADATA` or `METADATA-SERVER`. ALPS checks nothing further. It lists the `/private/vendor/alps/webauthn-state` subtree, and treats a listing the server reports as truncated as an error. ALPS cannot detect a stale, partial or torn listing, or a write that is not applied atomically: the operator must make sure the IMAP server keeps the contract above. [MAIL_SERVER.md](MAIL_SERVER.md) lists what else ALPS needs from the IMAP server.

Two stores keep the record in the single `webauthn` entry instead, coordinated only by the per-instance account lock ([below](#within-one-instance)):

- the maildir provider, whose entries are in `alps_store.json` ([MAILDIR.md](MAILDIR.md));
- the per-connection in-memory store ALPS uses for an IMAP server without METADATA.

With `[cluster] enabled = true` ([CLUSTER.md](CLUSTER.md), [CONFIGURATION.md](CONFIGURATION.md#7-cluster-cluster)) on either of these stores, recovery codes are switched off:

- The first key comes without codes.
- `recoveryCodesAvailable` is `false` in `GET /settings/2fa` and in the `POST /webauthn/verify/begin` answer.
- `POST /webauthn/verify/recovery` and `POST /settings/2fa/recovery-codes` answer `503 {"error":"recovery_unavailable"}`.

Without `[cluster]`, recovery codes are offered on every store. Several instances that serve the same accounts should use an IMAP server with METADATA.

## Within one instance

`WithWebAuthnRecord` holds an in-memory lock for the account during the whole read-modify-write, so one instance's credential operations on an account never interleave. The lock is keyed by the session's address, or by its login name when no address is known, in lower case. Plain reads do not take it. On a METADATA store the lock only reduces contention, and the versioned protocol arbitrates between instances. On the other stores the lock is the only coordination.

## Representation

Each update writes one private entry under `/private/vendor/alps/webauthn-state/`. Its name is a 20-digit increasing number followed by a random 128-bit ID. Names provide a total order even if two nodes choose the same number. Its JSON envelope has format `version: 1`, `committed`, and `data` (the credential record or `null` for a deletion). A request's mutation ID is the name of its first proposal, and it stays the same when a rescue (below) writes at a newer name. `applied` retains up to 32 incorporated mutation IDs; it proves that a concurrent writer preserved an earlier mutation. Losing that proof after a long pause causes a refusal, never an inferred success.

Readers use the greatest **committed** entry. An uncommitted proposal does not hide the last committed state. Before any committed version exists, readers fall back to the original `/private/vendor/alps/webauthn` entry. A committed `null` tombstone prevents that fallback after deletion.

A malformed entry in the subtree makes the whole listing unreadable, and pruning does not remove it. Until it is corrected or removed, the account's webmail sign-ins and credential changes answer `503`.

## Update order

1. List the subtree. Remove every entry except the greatest one and the greatest committed snapshot (see [pruning](#failure-recovery-and-storage-bounds)). Publish an uncommitted proposal with a number above every listed proposal or snapshot.
2. List the subtree again, **after** publishing the proposal, and read the newest committed record from it; apply the credential operation to that record. If this listing no longer contains the request's own proposal, the read fails with a version conflict and no snapshot is written. That happens when a later operation pruned the proposal because a higher one already existed.
3. Write the resulting snapshot at the proposal's own name. Credential writes are not automatically replayed after a lost reply.
4. List the whole subtree fresh. The write succeeds only when its own name is both the greatest entry and the greatest committed snapshot. A recovery session is authenticated only after that.

Step 1 runs for every operation that goes through `WithWebAuthnRecord`, before it reads the record, including operations that end without a write. Those are a key sign-in that is refused or changes no counter or flag, a refused recovery code, and a refused enrollment, key removal, code rotation or trust change. An uncommitted proposal as the greatest entry is therefore normal, and on its own it does not mean a writer was abandoned. Plain reads publish nothing: the checks at sign-in and during a session of whether the account has a key, the trust check on an account switch, `GET /settings/2fa`, `POST /settings/2fa/begin` and `POST /webauthn/verify/begin`. The one exception is a read that finds a record needing malformed-record cleanup, which goes through `WithWebAuthnRecord` like any other change.

A later proposal might have abandoned its operation, or incorporated this mutation in another snapshot. If the greatest committed snapshot is still the writer's own, or lists the writer's mutation ID in `applied`, the writer publishes a newer proposal and checks that condition again on a fresh listing. It then writes the greatest committed snapshot's data at the new name, with that snapshot's `applied` list plus its own mutation ID, so it preserves that entire newer state. Otherwise it returns a conflict. A request writes at most 8 snapshots; one that has not validated by then also returns a conflict.

The version name is never reused for a different request. There is no mutable "current version" pointer for a delayed request to overwrite.

### What a conflict answers

A conflict ends the request without a change, and the client retries it. Recovery sign-ins, code rotation and key removal answer `503 {"error":"keys_unavailable"}`. Enrollment and trust changes answer `503` "security keys unavailable; retry the operation" (a conflict at the read, step 2, currently answers `500` there instead). After a key sign-in, a conflict while saving the key's signature count is only logged, and the sign-in succeeds. No endpoint answers `409` for a conflict: on these endpoints `409` only means `no_security_key`.

## Why a spent code stays spent

A successful redemption has already persisted the consumed code before its final fresh validation. A writer with a greater proposal published **before** that validation would make the validation fail. Any greater proposal published **after** it must read the consumed state (or a subsequent state that preserves it) before constructing its snapshot. Older delayed writes land at lower names, below the redemption's committed snapshot, and cannot become the current state. The same ordering keeps every validated change, of any kind, from being undone by a stale snapshot.

Of the two sign-ins, only a recovery-code sign-in waits for the fence: its session opens only after the spent code's snapshot validates. After a security-key sign-in, ALPS saves the key's new signature count, clone mark and flags, and only when one of them changed. If that save fails, including on a version conflict, ALPS logs `WebAuthn verify: failed to save the key's signature count` and the sign-in still succeeds.

An ancestry rescue preserves later state rather than rewriting the writer's original snapshot. For example, if node B consumes a second code using node A's provisional consumption, node A can confirm its included mutation while preserving both consumptions. Two competing removals of the same code from an older record have different mutation IDs; neither can claim inclusion in the other's independent snapshot.

This is optimistic coordination, not a promise that every contending request succeeds. An interrupted request can consume a code without opening its session, as can a lost successful response. The user can try another code. No session is accepted merely because a write might have succeeded.

## Failure recovery and storage bounds

No proposal is a lock. A new node reads the maximum number, publishes a higher proposal, and continues immediately after an abandoned proposal or a lost reply. If the failed node's old command eventually reaches the backend after a higher snapshot has committed, its lower version is obsolete.

Pruning keeps only the greatest entry (proposal or snapshot) and the greatest committed snapshot, including tombstones. A deletion targets only a named entry already known to be below a retained entry. So pruning can also remove a proposal that is still in flight above the newest committed snapshot. If that writer's snapshot then lands, or a failed node's delayed write lands, before any higher snapshot commits, it becomes the greatest committed entry. Readers see it until a higher snapshot commits, and that higher snapshot need not include it. The delayed writer's own request succeeds only when one of its snapshots validates, at its first name or after a rescue ([above](#update-order)). A delayed snapshot that lands below the newest committed snapshot never becomes current, and a later update prunes it again.

A validated change is never lost. Every proposal above it was published after its validation, so each one read a state that already included it.

Version names bypass connection and session caches, so pruning does not leave an unbounded cache of deleted names.

## Deployment and rollback

Upgrade all ALPS writers for an account together, with old instances drained before new instances serve traffic. The first versioned mutation reads the legacy `/private/vendor/alps/webauthn` entry and commits the result as a snapshot. The legacy entry stays as it is, as bootstrap data, but is no longer authoritative once a committed snapshot exists. Old binaries do not understand the new namespace and must not serve the same accounts during a rolling deployment.

For a rollback, drain all writers and export the newest committed envelope's `data` to the legacy entry (remove the legacy entry if `data` is null). Do not restart older binaries with stale legacy credentials. Before switching forward again, import the authoritative legacy data as a new committed version above the retained fence during maintenance; do not silently reuse the older versioned snapshot, which upgraded instances would otherwise keep reading. Operator reset instructions are in [WEBAUTHN.md](WEBAUTHN.md#when-the-key-is-lost-and-the-codes-are-gone).

## Verification

The core tests and the cross-node HTTP tests run against in-memory stores that model one linearizable METADATA namespace. Run the Go commands below from the repository root.

- Core tests are in `auth_record_version_test.go` (`TestCredentialVersions_*`); run them with `go test -run TestCredentialVersions .`. They cover a same-code race with exactly one winner, a paused writer, an unknown delayed write, a crash after the proposal, pruning that keeps the tombstone, and rejection of a committed entry without `data`.
- Forced HTTP interleavings between two independent servers on one shared METADATA store are in `plugins/base/http_recovery_cluster_test.go` (`TestHTTP_Cluster*`, `TestHTTP_CrossNode*`). Run them with `go test -run 'TestHTTP_Cluster|TestHTTP_CrossNode' ./plugins/base`. They cover duplicate redemption, rotation, trust changes, enrollment, deletion, signature counters, ancestor adoption, unknown delayed writes, legacy migration where a deletion tombstone never falls back, and an enrollment over a malformed legacy record. The same pattern also runs `TestHTTP_ClusterDoesNotIssueRecoveryCodes` from `plugins/base/http_recovery_race_test.go`, the case of a cluster on a store without METADATA. That file also holds the single-instance races. Those tests use the maildir provider, whose record is the single `webauthn` entry.
- `python3 scripts/model-recovery-versions.py` runs on Python 3.9 or later. It exhaustively explores two bounded cases, both with pruning: two nodes with up to two attempts each (including rescue), and three nodes with one attempt each (no rescue). Every modelled node redeems the same code. As negative controls, it checks that two unsafe variants are caught: one without the final fence validation, and one that reads the record before publishing its proposal. This bounded model complements testing; it is not a proof for arbitrary executions.

The browser suite runs against Sora over standard IMAP ([E2E.md](E2E.md)). Sora advertises METADATA, so every security-key spec (`e2e/settings-security.spec.ts`) already uses the versioned protocol through one ALPS process.

`E2E_CLUSTER=1 scripts/e2e.sh e2e/cluster-recovery.spec.ts e2e/settings-security.spec.ts` starts a second ALPS process, turns on `[cluster]` in both, and runs the two specs. `cluster-recovery.spec.ts` races recovery requests across the two processes. It also injects standard METADATA entries that stand for an abandoned proposal and a delayed stale write. No backend code changes are required. The two ALPS processes share no memory, only Sora and the rest of the test stack. Without `E2E_CLUSTER=1`, `cluster-recovery.spec.ts` is skipped. [E2E.md](E2E.md#running-the-browser-tests) describes `E2E_CLUSTER`, the ports it needs and how spec paths are given.
