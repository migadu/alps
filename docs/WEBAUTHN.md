# WebAuthn and 2FA in ALPS

ALPS supports two-factor authentication (2FA) through the WebAuthn standard. Once an account has a security key, signing in to the webmail asks for it after the password. Platform authenticators (like Touch ID, Face ID, Windows Hello) and cross-platform authenticators (like YubiKeys) both work.

---

## Configuration

2FA depends on the `[webauthn]` section of the configuration (see [CONFIGURATION.md](CONFIGURATION.md#5-webauthn-webauthn)):

- `rpid` defaults to `localhost`, and ALPS logs a warning at startup when it is unset.
- `display_name` defaults to `Alps Webmail`.
- `origins` defaults to `["http://localhost:1323", "http://localhost:5173"]`.

In production, set `rpid` to the browser-facing hostname and `origins` to its exact origin (scheme included, no trailing slash), for example `rpid = "webmail.example.com"` and `origins = ["https://webmail.example.com"]`. Otherwise adding a key fails. Neither can be derived from a reverse proxy's forwarded headers, so a proxied deployment must set both.

At startup ALPS also checks each origin against `rpid`, the port aside. An origin whose host is neither `rpid` nor a name under it is logged as a warning, `WebAuthn: origin "<origin>" is outside rpid "<rpid>"; security-key enrolment will fail; set [webauthn] origins to the browser-facing origin`. That is what the localhost defaults give when `rpid` is set and `origins` is not. An origin without a host name, such as one written without its scheme, is logged as `WebAuthn: origin "<origin>" has no usable hostname; check [webauthn] origins`. Neither stops startup.

2FA also needs a store that keeps the account's record: an IMAP server that advertises METADATA or METADATA-SERVER, or the maildir provider (see [Storage Mechanism](#storage-mechanism)).

---

## 2FA Login Flow

Signing in to an account that has a security key takes these steps:

1. **Initial Authentication**: The user submits their username and password via `POST /session`.
2. **Credential Validation**: ALPS validates the credentials against the upstream IMAP server (or the maildir provider's passwd file). While it opens the session, it reads the account's WebAuthn record (see [Storage Mechanism](#storage-mechanism)). The sign-in asks for a second factor when the record has `enabled: true` and at least one credential. If the record cannot be read (for example, the mail server does not answer the request), the sign-in does not go ahead: it is answered `503` with `{"error": "Mail service temporarily unavailable", "code": "service_unavailable"}`.
3. **Pending State**: If the account asks for a second factor, ALPS does **not** issue the `alps_session` cookie. Instead, it:
   - Sets an `alps_2fa_pending` cookie carrying the pending session's token. It is HttpOnly, SameSite=Strict and Secure when the request is HTTPS (directly or through a trusted proxy), and it expires after 5 minutes (`Max-Age` 300).
   - Keeps the username and password in the pending session's memory (session data `2fa_login_credentials`), and the "Stay signed in after closing the browser" choice beside them (`2fa_kept_signed_in`). Nothing about the pending sign-in is written to IMAP METADATA.
   - Logs `sign-in awaits second factor` and returns `{"requires_2fa": true}`.
4. **Verification**: The frontend shows the key page, which first calls `POST /webauthn/verify/begin` with the pending cookie. It returns the assertion options and `recoveryCodesAvailable`, and each call replaces the challenge kept for the pending session. The browser runs `navigator.credentials.get`, and the page posts the assertion to `POST /webauthn/verify/finish`. ALPS requests user presence only (user verification "discouraged"), so it does not require a PIN or biometric.
5. **Session Elevation**: Once the key verifies, ALPS marks the session as having given the second factor and issues it as `alps_session`. That cookie lasts 30 days when "Stay signed in after closing the browser" was ticked at the password step, and is a browser-session cookie otherwise. When `[server] login_key` is set, ALPS also sets `alps_login_token`, which records that the second factor was given, so a session restored from it is not asked again (see [SESSIONS.md](SESSIONS.md)). Without `login_key` no login token is issued. ALPS clears `alps_2fa_pending` and the stored credentials, and saves the key's new signature count and flags to the record when they changed. It answers `{"success": true, "username": "..."}`.

The key or recovery-code step must finish within the 5 minutes the pending cookie lasts. After that, `/webauthn/verify/*` answers `401` and the page returns to the password form with a notice that the sign-in expired. The same happens when the pending session is gone, for example after a restart. The pending session lives in the memory of the node that accepted the password, as every session does, so in a cluster the key's requests must reach that node (see [CLUSTER.md](CLUSTER.md)).

`/webauthn/verify/begin` answers `401` when the pending sign-in is gone, `503` when the record cannot be read, and `400` when the account has no key. `/webauthn/verify/finish` answers `401` when the pending sign-in is gone, `400` when no challenge was issued, `503` when the record cannot be read, and `400 verification failed` for a refused key.

### Changing the Keys

Once an account has a security key, its keys can only be changed from a session that has passed the second factor: adding one (`/settings/2fa/begin` and `/finish`) and removing one (`/settings/2fa/credential/{id}/delete`) are otherwise refused with `403 two_factor_required`. The first key needs none, since there is none yet; enrolling it counts as passing the second factor for the session that does it. Adding a further key needs no password. Reading the keys (`GET /settings/2fa`) and adding one answer `503 keys_unavailable` when the record cannot be read or saved, and the session stays signed in.

Removing a key also takes the account's password. `POST /settings/2fa/credential/{id}/delete` takes `{"current_password": "..."}`, and an empty body counts as no password. `{id}` is the key's ID as `GET /settings/2fa` lists it (padded base64url, URL-encoded in the path). The second factor is checked before the password. Then the password is checked: `400 password_required`, `403 wrong_password`, or `429 rate_limited` with `Retry-After`, and each attempt counts against the login rate limits (see [RATELIMIT.md](RATELIMIT.md)). An unknown key is `404`. A record that cannot be read or saved is `503 keys_unavailable`. On an IMAP METADATA store, an update that cannot be started, or that loses to a competing one, is answered `503` as well, with the bodies listed in [What a conflict answers](WEBAUTHN_COORDINATION.md#what-a-conflict-answers).

Adding the first key turns the second factor on, and removing the last turns it off. Both are logged at info level, as sign-ins are: `security key added` and `security key removed`, with the `user`, `ip`, `session` and `agent`, the key's name (`key`) and `transports`, and the number of keys the account has afterwards (`keys`). The settings pane says, and the dialog that names a new key says again before it is saved, that signing in to the webmail asks for a key once one is added.

Whether a session needs the second factor is otherwise decided when it is opened. So that a session opened before the account enrolled a key does not keep full access, enrolling a key asks every other session of the account for it before it goes on (its next request is answered `401`, and signing in again asks for the key). Sessions live in each node's memory, so this reaches at once only the sessions on the node where the key was enrolled. For the others, a session that has not passed the second factor reads the account's WebAuthn record again from its store, at most once a minute while it is in use, and is asked for the key from the first read that finds one. A read that fails changes nothing and is tried again a minute later. A session that has passed the second factor, or already needs it, reads nothing.

In a cluster, the node where the key was enrolled also tells the other nodes over gossip, and the account's sessions there read the record on their next request instead of at the end of the minute. The message only prompts the read; the record decides. It starts with a tag byte (`0x02`) that no JSON text starts with, so a node that knows only rate-limit events, which are bare JSON, fails to decode it and drops it. If the message is lost or dropped, the minute still holds.

### Recovery Codes

A recovery code signs in once in the key's place, for when the key is not at hand: a passkey kept in another browser or on another computer, a hardware key left at home or lost. The session it opens has given the second factor, so it can add a new key and remove the old one, which is the way back without the operator.

- The first key comes with ten codes wherever recovery is available (see below), in the answer that adds it (`recovery_codes` beside `success`), and the settings pane shows them once, to copy or download. A later key comes with none. Where recovery is not available, the first key comes with no codes: `GET /settings/2fa` then reports `recoveryCodesAvailable: false`, and the settings pane says recovery codes are unavailable on this installation.
- A code is two groups of five letters and digits, from Crockford's base32 (no `i`, `l`, `o` or `u`). It is read as it may be written down: in capitals, with spaces or no dash, an `O` for a `0`, an `I` or `L` for a `1`.
- On the key's page, "Use a recovery code" sends one to `POST /webauthn/verify/recovery` (`{"code": "..."}`), with the pending sign-in's cookie, as the key's own answer goes. A code that works is spent, before the session is let in: if the record cannot be saved, the sign-in is refused (`503 keys_unavailable`) rather than leave the code usable again. Otherwise the answer is `success`, the `username` and `recovery_codes_left`, and the session is issued as after a key. A code that is wrong or already used is `400 wrong_code`; an empty one `400 code_required`. Where recovery is not available, the request is refused with `503 recovery_unavailable`.
- Codes can be guessed, as a key's signature cannot, so each try counts against the login rate limits for the account and the address it comes from, as a password does (`429 rate_limited`, with `Retry-After`).
- `POST /settings/2fa/recovery-codes` (`{"current_password": "..."}`) replaces them with ten new ones and answers with them, once. It takes what removing a key takes: a key (`409 no_security_key`), a session that has passed the second factor (`403 two_factor_required`) and the password (`400 password_required`, `403 wrong_password`, `429 rate_limited`). It also answers `503 recovery_unavailable` where recovery is not available, and `503 keys_unavailable` when the record cannot be read or the new codes cannot be saved. `GET /settings/2fa` says how many are left (`recoveryCodesLeft`) and whether this installation supports recovery (`recoveryCodesAvailable`).
- Removing the last key removes the record, and the codes with it. A first key added afterwards comes with new ones.
- A sign-in with a code is logged as `sign-in` with `"factor": "recovery code"` and `recovery_codes_left`, and a refused code as `sign-in failed` with `"reason": "recovery code refused"`. New codes are logged as `recovery codes created`. The codes themselves never reach the log.

Without `[cluster]`, recovery codes are always offered. With `[cluster]` enabled, ALPS offers them (issued with the first key, accepted at sign-in, renewable) only when the account's store is IMAP METADATA. Any IMAP server that advertises METADATA or METADATA-SERVER counts. ALPS cannot check that the backend gives fresh, complete, consistent subtree listings and atomic entry writes; the operator must ensure it (see [WebAuthn coordination](WEBAUTHN_COORDINATION.md)). In a cluster on maildir, or on an IMAP server without METADATA, recovery requests are refused with `503 recovery_unavailable` and no codes are issued.

On an IMAP METADATA store, standalone or clustered, ALPS keeps the record as versioned entries, so recovery works across ALPS instances without a separate database or backend extension. Each writer announces a uniquely named version before reading, writes its snapshot at that name, and confirms that version is still current before accepting a recovery code. A delayed write from a paused or failed node cannot overwrite a newer version. Abandoned proposals do not block a subsequent update; no lock expires or needs operator cleanup. Obsolete versions are pruned automatically, retaining the highest proposal and latest committed state.

All credential writers participate: recovery redemption and rotation, enrollment, deletion, trust changes, signature counters, and malformed-record cleanup. Competing updates can return `503`; retry the operation. A lost reply can leave a code consumed without a completed sign-in, so try another code in that case. The full protocol, assumptions, upgrade procedure and adversarial checks are described in [WebAuthn coordination](WEBAUTHN_COORDINATION.md).

**Upgrade every ALPS instance together before serving traffic.** Existing `/private/vendor/alps/webauthn` records bootstrap the new format automatically; after the first committed version, `/private/vendor/alps/webauthn-state/` is authoritative. An older binary reads only the legacy entry and must not share accounts with upgraded instances. This applies to standalone instances too. Do not roll back without restoring the newest committed state to the legacy entry during maintenance.

### When the Key Is Lost and the Codes Are Gone

An account whose keys are not at hand and whose codes are used up or lost cannot pass the second factor. IMAP and SMTP clients are not affected: this second factor protects the webmail.

For a versioned IMAP record, the operator resets the account by writing a **new committed deletion tombstone**, not by removing the legacy entry or clearing the version namespace:

1. Drain credential updates for the account on all ALPS instances. Read `/private/vendor/alps/webauthn-state` using `GETMETADATA (DEPTH infinity)`.
2. Choose a version number greater than every returned entry, formatted as 20 decimal digits, and a fresh 32-character lowercase hex ID. The new entry name is `/private/vendor/alps/webauthn-state/<number>-<id>`.
3. `SETMETADATA` that entry to `{"version":1,"committed":true,"data":null}`. Read the subtree again and confirm the new entry is greatest before reopening traffic; retry with a higher version if another writer raced it. Keep the tombstone and the existing version fence so a delayed old write cannot restore the keys.

Write the entry exactly in this form: while an entry under `webauthn-state/` is malformed, the account's record cannot be read, and its webmail sign-ins are refused with `503` until the entry is corrected or removed.

For the maildir provider, reset the account by removing the `webauthn` key from `alps_store.json` in the account's maildir directory. That directory is the expanded `[provider.maildir] path`, or `<home>/Maildir` from the passwd file when no path is set (see [MAILDIR.md](MAILDIR.md)). Keep the file valid JSON: ALPS cannot read the record, or the account's settings, from a file that does not parse. The versioned `webauthn-state` entries are not used with maildir.

The next sign-in reads the tombstone, or the missing key, as no security keys, asks for the password alone, and can enroll a new key, with new codes where recovery is available. Sessions already open retain the second factor they gave.

---

## Account Switching with 2FA

ALPS has an account switcher that moves between linked accounts without asking for their passwords (see [SESSIONS.md](SESSIONS.md)). An account with a security key still asks for its own second factor when it is switched to.

`POST /accounts/switch` into an account that has a security key, when trust does not waive it (see below), ends the current session at once and clears its cookie. It answers `{"requires_2fa": true}` and sets `alps_2fa_pending` for the target account for 5 minutes. The target account's key, or one of its recovery codes, completes the switch. Leaving the key page does not return to the account switched from: its session has already ended, and the browser goes back to the sign-in page.

So that a switch does not have to ask again, ALPS has a **"Trust Linked Accounts"** setting.

### How Trust Linked Accounts Works

Trust is turned on in Settings > 2FA / WebAuthn. Once the account has a security key, a "Trust Linked Accounts" group appears there. Tick "Allow switching to this account without 2FA" and confirm with the account's password. This tells ALPS that a switch into this account may skip its 2FA prompt under the conditions below.

The prompt is skipped only if **both** of the following conditions are met:
1. The **target** account has `trust_linked_accounts = true`, turned on under the rules below (`trust_linked_accounts_version` is set).
2. The **source** session (the account the user is switching *from*) is actively authenticated with 2FA (`IsAuthenticated2FA() == true`).

If these conditions are met, the server skips the WebAuthn challenge, immediately logs the user into the target account, and marks the new session as 2FA-authenticated as well.

Because trust waives the target account's own second factor, turning it on (`POST /settings/2fa/trust-linked-accounts` with `{"trust": true, "current_password": "..."}`) requires all of:
- at least one enrolled security key on the account (otherwise `409 no_security_key`);
- a session that has passed the second factor (otherwise `403 two_factor_required`);
- the account's current password, checked against the session's in constant time (`400 password_required`, `403 wrong_password`). Attempts count against the login rate limits (`429 rate_limited`, with `Retry-After`).

Turning it off (`{"trust": false}`) needs only a session. Either way, a record that cannot be read or saved is `503 keys_unavailable`.

Turning trust on stores `trust_linked_accounts_version` beside it, naming the rules it was turned on under. Trust stored without it was turned on before these rules, when any session of the account could turn it on, and is read as off: the settings show it unticked, switching accounts does not honour it, and the record's next save drops it. The owner turns it on again, as above, if they want it. There is no migration to run; each account's record is read this way from the first time an upgraded node reads it.

Every ALPS instance must be upgraded together before serving traffic (see [Recovery Codes](#recovery-codes)); mixing binaries is not supported.

> [!TIP]
> With trust on in the linked accounts, the key is asked for once, at the sign-in to the first account. Switching from that session to a linked account that trusts it does not ask again.

---

## Logging

When a key's signature count does not go up, ALPS logs `security key may have been copied` at warn level with `user`, `ip`, `session` and `key`. Keys that always report 0 are exempt. The sign-in still goes ahead, the key stays marked in the record, and the operator should follow it up.

The other 2FA lines are in the log table of [CONFIGURATION.md](CONFIGURATION.md#4-logging-logging):

- `sign-in awaits second factor`, when the password was accepted and the key is asked for.
- `sign-in` after the key, with `2fa: true`, `remember` and `factor: "security key"`, or after a recovery code with `factor: "recovery code"` and `recovery_codes_left`.
- `sign-in failed` with `reason: "second factor refused"`, `session` and `error`, or with `reason: "recovery code refused"` and `session`.
- `account switch awaits second factor`, and `account switch` with `2fa_trusted`.

Key changes and new recovery codes are logged as `security key added`, `security key removed` and `recovery codes created` (see [Changing the Keys](#changing-the-keys) and [Recovery Codes](#recovery-codes)).

---

## Storage Mechanism

ALPS is stateless and does not use a database. The WebAuthn record is kept in the account's own store:

- **IMAP with METADATA** (RFC 5464): private entries under `/private/vendor/alps/`, namely the legacy `webauthn` entry and the versioned entries under `webauthn-state/` (see [WebAuthn coordination](WEBAUTHN_COORDINATION.md)). The IMAP server must advertise METADATA or METADATA-SERVER.
- **Maildir**: the `webauthn` key of `alps_store.json` in the account's maildir directory (see [MAILDIR.md](MAILDIR.md)). The versioned entries are not used.
- **IMAP without METADATA**: ALPS logs, once per process, that it uses a transient store instead. That store lasts only as long as the session's IMAP connection. A security key added there is forgotten when that connection closes, so 2FA needs a server with METADATA (see [MAIL_SERVER.md](MAIL_SERVER.md)).

With IMAP METADATA, the greatest committed versioned entry is the account's record, and the legacy `/private/vendor/alps/webauthn` entry is read only until the first committed version exists.

The record is a JSON object containing:
- `enabled`: Boolean indicating if 2FA is active.
- `credentials`: An array of enrolled authenticators (storing the public key, credential ID, transport types, an assigned nickname and when the key was added).
- `trust_linked_accounts`: Boolean indicating if linked accounts can skip the 2FA prompt. It is only kept beside at least one credential: removing the last one removes the record, trust included, and a record without credentials is read as trusting no one.
- `trust_linked_accounts_version`: Present while trust is on, naming the rules it was turned on under (currently `1`: a key, the second factor and the password); omitted when trust is off. Trust without it is read as off.
- `recovery_codes`: The recovery codes not yet used, each as the hex SHA-256 of the code written without its dash, in lower case; omitted when there are none. The codes themselves are kept nowhere. A code is 50 random bits and is tried only against the login rate limits, so a plain hash is enough to keep it from being read back.

An instance that does not know `recovery_codes` must not serve the same accounts: every ALPS instance must be upgraded together before serving traffic (see [Recovery Codes](#recovery-codes)).
