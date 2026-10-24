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

Whether a session needs the second factor is otherwise decided when it is opened. So that a session opened before the account enrolled a key does not keep full access, enrolling a key asks every other session of the account for it before it goes on (its next request is answered `401`, and signing in again asks for the key). Sessions live in each node's memory, so this reaches at once only the sessions on the node where the key was enrolled. For the others, a session that has not passed the second factor reads the account's `webauthn` record again from the IMAP server, at most once a minute while it is in use, and is asked for the key from the first read that finds one. A read that fails changes nothing and is tried again a minute later. A session that has passed the second factor, or already needs it, reads nothing.

In a cluster, the node where the key was enrolled also tells the other nodes over gossip, and the account's sessions there read the record on their next request instead of at the end of the minute. The message only prompts the read; the record decides. It starts with a tag byte (`0x02`) that no JSON text starts with, so a node that knows only rate-limit events, which are bare JSON, fails to decode it and drops it. If the message is lost or dropped, the minute still holds.

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
