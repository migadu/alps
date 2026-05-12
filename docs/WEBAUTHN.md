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

---

## Account Switching with 2FA

ALPS features an account switcher that allows users to rapidly move between linked accounts without entering passwords. 2FA introduces a unique challenge here: if you switch into an account that has 2FA enabled, you must prove physical presence again.

To improve usability, ALPS implements a **"Trust Linked Accounts"** setting.

### How Trust Linked Accounts Works

If a user enables "Trust Linked Accounts" in their Security Settings, they are instructing ALPS to conditionally bypass the 2FA prompt during an account switch.

The bypass only occurs if **both** of the following conditions are met:
1. The **target** account has `trust_linked_accounts = true`.
2. The **source** session (the account the user is switching *from*) is actively authenticated with 2FA (`IsAuthenticated2FA() == true`).

If these conditions are met, the server skips the WebAuthn challenge, immediately logs the user into the target account, and marks the new session as 2FA-authenticated as well.

> [!TIP]
> This creates a seamless "single sign-on" experience across linked ALPS accounts. You only need to touch your YubiKey or fingerprint reader once when logging into your primary account.

---

## Storage Mechanism

ALPS is stateless and does not use a database. All WebAuthn data is persisted directly to the user's mailbox using **IMAP METADATA** (RFC 5464).

The `webauthn` metadata key stores a JSON payload containing:
- `enabled`: Boolean indicating if 2FA is active.
- `trust_linked_accounts`: Boolean indicating if linked accounts can bypass 2FA.
- `credentials`: An array of enrolled authenticators (storing the public key, credential ID, transport types, and an assigned nickname).
