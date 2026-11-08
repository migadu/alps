# WebAuthn and 2FA in ALPS

ALPS supports modern, hardware-backed two-factor authentication (2FA) through the WebAuthn standard. This includes support for platform authenticators (like TouchID, FaceID, Windows Hello) and cross-platform authenticators (like YubiKeys).

---

## 2FA Login Flow

The 2FA implementation in ALPS spans multiple steps to ensure security:

1. **Initial Authentication**: The user submits their username and password via `POST /session`. 
2. **Credential Validation**: ALPS validates the credentials against the upstream IMAP server. If successful, the server checks the IMAP METADATA (specifically the `webauthn` key) to see if the user has enrolled in 2FA.
3. **Pending State**: If 2FA is enabled, ALPS does **not** issue a standard session cookie. Instead, it:
   - Sets an `alps_2fa_pending` cookie containing a temporary session token.
   - Saves the user's login credentials temporarily in the IMAP Metadata (`2fa_login_credentials`).
   - Returns a JSON response with `requires_2fa: true`.
4. **Verification**: The frontend redirects the user to the WebAuthn verification prompt. The browser requests an assertion from the authenticator and posts it to `POST /webauthn/verify/finish`.
5. **Session Elevation**: Once verified, the backend elevates the session to a 2FA-authenticated state (`SetAuthenticated2FA(true)`). It then retrieves the temporarily stored credentials, issues the real `alps_session` cookie, generates the encrypted `alps_login_token` (for session restoration), and clears the pending cookies.

### Changing the Keys

Once an account has a security key, its keys can only be changed from a session that has passed the second factor: adding one (`/settings/2fa/begin` and `/finish`) and removing one (`/settings/2fa/credential/{id}/delete`) are otherwise refused with `403 two_factor_required`. The first key needs none, since there is none yet; enrolling it counts as passing the second factor for the session that does it.

Adding the first key turns the second factor on, and removing the last turns it off. Both are logged at info level, as sign-ins are: `security key added` and `security key removed`, with the `user`, `ip`, `session` and `agent`, the key's name (`key`) and `transports`, and the number of keys the account has afterwards (`keys`). The settings pane says, and the dialog that names a new key says again before it is saved, that signing in to the webmail asks for a key once one is added.

Whether a session needs the second factor is otherwise decided when it is opened. So that a session opened before the account enrolled a key does not keep full access, enrolling a key asks every other session of the account for it before it goes on (its next request is answered `401`, and signing in again asks for the key). Sessions live in each node's memory, so this reaches at once only the sessions on the node where the key was enrolled. For the others, a session that has not passed the second factor reads the account's `webauthn` record again from the IMAP server, at most once a minute while it is in use, and is asked for the key from the first read that finds one. A read that fails changes nothing and is tried again a minute later. A session that has passed the second factor, or already needs it, reads nothing.

In a cluster, the node where the key was enrolled also tells the other nodes over gossip, and the account's sessions there read the record on their next request instead of at the end of the minute. The message only prompts the read; the record decides. It starts with a tag byte (`0x02`) that no JSON text starts with, so a node that knows only rate-limit events, which are bare JSON, fails to decode it and drops it. If the message is lost or dropped, the minute still holds.

### Recovery Codes

A recovery code signs in once in the key's place, for when the key is not at hand: a passkey kept in another browser or on another computer, a hardware key left at home or lost. The session it opens has given the second factor, so it can add a new key and remove the old one, which is the way back without the operator.

- The first key comes with ten codes, in the answer that adds it (`recovery_codes` beside `success`), and the settings pane shows them once, to copy or download. A later key comes with none.
- A code is two groups of five letters and digits, from Crockford's base32 (no `i`, `l`, `o` or `u`). It is read as it may be written down: in capitals, with spaces or no dash, an `O` for a `0`, an `I` or `L` for a `1`.
- On the key's page, "Use a recovery code" sends one to `POST /webauthn/verify/recovery` (`{"code": "..."}`), with the pending sign-in's cookie, as the key's own answer goes. A code that works is spent, before the session is let in: if the record cannot be saved, the sign-in is refused (`503 keys_unavailable`) rather than leave the code usable again. Otherwise the answer is `success`, the `username` and `recovery_codes_left`, and the session is issued as after a key. A code that is wrong or already used is `400 wrong_code`; an empty one `400 code_required`.
- Codes can be guessed, as a key's signature cannot, so each try counts against the login rate limits for the account and the address it comes from, as a password does (`429 rate_limited`, with `Retry-After`).
- `POST /settings/2fa/recovery-codes` (`{"current_password": "..."}`) replaces them with ten new ones and answers with them, once. It takes what removing a key takes: a key (`409 no_security_key`), a session that has passed the second factor (`403 two_factor_required`) and the password (`400 password_required`, `403 wrong_password`, `429 rate_limited`). `GET /settings/2fa` says how many are left (`recoveryCodesLeft`) and whether this installation supports recovery (`recoveryCodesAvailable`).
- Removing the last key removes the record, and the codes with it. A first key added afterwards comes with new ones.
- A sign-in with a code is logged as `sign-in` with `"factor": "recovery code"` and `recovery_codes_left`, and a refused code as `sign-in failed` with `"reason": "recovery code refused"`. New codes are logged as `recovery codes created`. The codes themselves never reach the log.

All reads and changes to the credential record share a per-account lock on a standalone server. Code redemption, code rotation, key enrollment and deletion, trust changes, signature-counter updates, and malformed-record cleanup therefore cannot overwrite one another with a stale copy. The login rate limit is checked after taking the lock, so queued guesses are checked against earlier failures. Other accounts can proceed independently.

**Recovery codes require exactly one alps process writing an account's records.** IMAP METADATA has no compare-and-swap, and gossip cannot atomically consume a code across nodes. When clustering is configured, alps does not issue recovery codes and refuses both redemption and rotation with `503 recovery_unavailable`; the settings explain that recovery is unavailable and key verification does not offer it. Previously issued codes are refused there too. Security-key sign-in remains available. Disabling gossip in a multi-process deployment does not make recovery codes safe: such deployments must not use recovery codes until shared atomic storage is supported. Run the operator recovery procedure below when keys are unavailable in a cluster.

The maildir settings store also serializes writes across store instances within a process, so a concurrent preference write cannot overwrite a credential update in its shared settings file.

### When the Key Is Lost and the Codes Are Gone

An account whose keys are not at hand and whose codes are used up or lost cannot pass the second factor, and so cannot sign in to the webmail. (IMAP and SMTP clients are not affected: the second factor is the webmail's.) The operator turns the second factor off by removing the account's record, the server metadata entry `/private/vendor/alps/webauthn`, with the mail server's own administration tools (for Dovecot, `doveadm mailbox metadata unset`).

alps reads the record again at every sign-in, so nothing needs restarting: the next sign-in asks for the password alone, and the user can then add a key again, which comes with new codes. Sessions open at the time keep the second factor they gave.

---

## Account Switching with 2FA

ALPS features an account switcher that allows users to rapidly move between linked accounts without entering passwords. 2FA introduces a unique challenge here: if you switch into an account that has 2FA enabled, you must prove physical presence again.

To improve usability, ALPS implements a **"Trust Linked Accounts"** setting.

### How Trust Linked Accounts Works

If a user enables "Trust Linked Accounts" in their Security Settings, they are instructing ALPS to conditionally bypass the 2FA prompt during an account switch.

The bypass only occurs if **both** of the following conditions are met:
1. The **target** account has `trust_linked_accounts = true`, turned on under the rules below (`trust_linked_accounts_version` is set).
2. The **source** session (the account the user is switching *from*) is actively authenticated with 2FA (`IsAuthenticated2FA() == true`).

If these conditions are met, the server skips the WebAuthn challenge, immediately logs the user into the target account, and marks the new session as 2FA-authenticated as well.

Because trust waives the target account's own second factor, turning it on (`POST /settings/2fa/trust-linked-accounts` with `{"trust": true, "current_password": "..."}`) requires all of:
- at least one enrolled security key on the account (otherwise `409 no_security_key`);
- a session that has passed the second factor (otherwise `403 two_factor_required`);
- the account's current password, checked against the session's in constant time (`400 password_required`, `403 wrong_password`). Attempts count against the login rate limits (`429 rate_limited`, with `Retry-After`).

Turning it off (`{"trust": false}`) needs only a session.

Turning trust on stores `trust_linked_accounts_version` beside it, naming the rules it was turned on under. Trust stored without it was turned on before these rules, when any session of the account could turn it on, and is read as off: the settings show it unticked, switching accounts does not honour it, and the record's next save drops it. The owner turns it on again, as above, if they want it. There is no migration to run; each account's record is read this way from the first time an upgraded node reads it.

During a rolling deploy, nodes not yet upgraded still honour trust without the mark, until they are upgraded; upgraded nodes never do. A node not yet upgraded does not know the mark, so a record it saves, for instance when a key is added there, loses it: trust turned on during the deploy may have to be turned on once more afterwards.

> [!TIP]
> This creates a seamless "single sign-on" experience across linked ALPS accounts. You only need to touch your YubiKey or fingerprint reader once when logging into your primary account.

---

## Storage Mechanism

ALPS is stateless and does not use a database. All WebAuthn data is persisted directly to the user's mailbox using **IMAP METADATA** (RFC 5464).

The `webauthn` metadata key stores a JSON payload containing:
- `enabled`: Boolean indicating if 2FA is active.
- `trust_linked_accounts`: Boolean indicating if linked accounts can bypass 2FA. It is only kept beside at least one credential: removing the last one removes the record, trust included, and a record without credentials is read as trusting no one.
- `trust_linked_accounts_version`: Present while trust is on, naming the rules it was turned on under (currently `1`: a key, the second factor and the password). Trust without it is read as off.
- `credentials`: An array of enrolled authenticators (storing the public key, credential ID, transport types, and an assigned nickname).
- `recovery_codes`: The recovery codes not yet used, each as the hex SHA-256 of the code written without its dash, in lower case. The codes themselves are kept nowhere. A code is 50 random bits and is tried only against the login rate limits, so a plain hash is enough to keep it from being read back.

During a rolling deploy, a node not yet upgraded does not know `recovery_codes`, so a record it saves, for instance when a key is added there, loses them: the settings then say there are none, and new ones can be created.
