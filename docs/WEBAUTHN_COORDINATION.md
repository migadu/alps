# Credential updates across Alps instances

Recovery uses only standard [IMAP METADATA](https://www.rfc-editor.org/rfc/rfc5464.html). There is no Alps database, Sora-specific command, distributed lease, or dependency on gossip membership. The backend must provide atomic entry replacements and fresh, complete subtree reads: a write acknowledged before a read starts must be visible to that reader. Stale replicas and truncated listings cannot safely supply this contract.

## Representation

Each update writes one private entry under `/private/vendor/alps/webauthn-state/`. Its name is a 20-digit increasing number followed by a random 128-bit ID. Names provide a total order even if two nodes choose the same number. Its JSON envelope has format `version: 1`, `committed`, and `data` (the credential record or `null` for a deletion). `applied` retains up to 32 incorporated mutation IDs; it proves that a concurrent writer preserved an earlier mutation. Losing that proof after a long pause causes a refusal, never an inferred success.

Readers use the greatest **committed** entry. An uncommitted proposal does not hide the last committed state. Before any committed version exists, readers fall back to the original `webauthn` entry. A committed `null` tombstone prevents that fallback after deletion.

## Update order

1. Read the subtree and choose a number above every existing proposal or snapshot. Publish a uniquely named, uncommitted proposal.
2. Read the newest committed record **after** publishing the proposal; apply the credential operation to that record.
3. Write the resulting snapshot at the proposal's own name. Credential writes are not automatically replayed after a lost reply.
4. Read the whole subtree fresh. Authenticate a recovery session only after its committed version is also the greatest proposal.

A later proposal might have abandoned its operation, or incorporated this mutation in another snapshot. The writer can publish a newer proposal and revalidate the still-current state. It may copy a newer snapshot only if its mutation ID appears in that snapshot's ancestry; it preserves that entire newer state. Otherwise it returns a conflict. Rescues are bounded, so contention returns `503` instead of spinning indefinitely.

The version name is never reused for a different request. There is no mutable "current version" pointer for a delayed request to overwrite.

## Why a spent code stays spent

A successful redemption has already persisted the consumed code before its final fresh validation. A writer with a greater proposal published **before** that validation would make the validation fail. Any greater proposal published **after** it must read the consumed state (or a subsequent state that preserves it) before constructing its snapshot. Older delayed writes land at lower names and cannot become the current state. The same ordering protects rotation and all other credential updates from stale snapshots.

An ancestry rescue preserves later state rather than rewriting the writer's original snapshot. For example, if node B consumes a second code using node A's provisional consumption, node A can confirm its included mutation while preserving both consumptions. Two competing removals of the same code from an older record have different mutation IDs; neither can claim inclusion in the other's independent snapshot.

This is optimistic coordination, not a promise that every contending request succeeds. An interrupted request can consume a code without opening its session, as can a lost successful response. The user can try another code. No session is accepted merely because a write might have succeeded.

## Failure recovery and storage bounds

No proposal is a lock. A new node reads the maximum number, publishes a higher proposal, and continues immediately after an abandoned proposal or a lost reply. If the failed node's old command eventually reaches the backend, its lower version is obsolete.

Pruning retains the greatest proposal and greatest committed snapshot, including tombstones. A deletion targets only a named entry already known to be below a retained fence. A delayed write can recreate an obsolete entry, but cannot make it current; a later update prunes it again. Version names bypass connection and session caches, so pruning does not leave an unbounded cache of deleted names.

## Deployment and rollback

Upgrade all Alps writers for an account together, with old instances drained before new instances serve traffic. The first versioned mutation automatically imports the legacy credential record; the old entry remains as bootstrap data but is no longer authoritative. Old binaries do not understand the new namespace and must not serve the same accounts during a rolling deployment.

For a rollback, drain all writers and export the newest committed envelope's `data` to the legacy entry (remove the legacy entry if `data` is null). Do not restart older binaries with stale legacy credentials. Before switching forward again, import the authoritative legacy data as a new committed version above the retained fence during maintenance; do not silently reuse the older versioned snapshot. Operator reset instructions are in [WEBAUTHN.md](WEBAUTHN.md).

## Verification

- Forced HTTP interleavings between separate server/session managers cover duplicate redemption, rotation, trust changes, enrollment, deletion, signature counters, ancestor adoption, and unknown delayed writes.
- Core tests cover a paused writer, an abandoned proposal, a delayed write after a fresh node progresses, deletion tombstones, and bounded pruning.
- `python3 scripts/model-recovery-versions.py` exhaustively explores bounded two- and three-node schedules, including pruning and rescue. It also detects unsafe variants without final fence validation or with a credential read before proposal publication. This bounded model complements testing; it is not a proof for arbitrary executions.
- `E2E_CLUSTER=1 scripts/e2e.sh e2e/cluster-recovery.spec.ts e2e/settings-security.spec.ts` starts two separate Alps processes with gossip enabled against one Sora backend. It races native recovery requests and injects standard METADATA entries representing an abandoned proposal and delayed stale write. No backend code changes are required.
