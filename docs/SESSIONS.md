# Session Management in ALPS

ALPS is designed as an ultra-fast, stateless webmail interface. To achieve its speed, it maintains a persistent connection pool to the upstream IMAP and SMTP servers. This document explains how ALPS manages these connections, handles user sessions, and persists state without requiring a database.

---

## The Session Architecture

When a user logs in, ALPS creates a **Session** object in memory. 

1. **Connection Pooling**: The Session holds a dedicated connection (or pool of connections) to the upstream IMAP server. This means ALPS doesn't need to re-authenticate or re-select mailboxes on every HTTP request, making navigation incredibly fast.
2. **The Session Cookie**: ALPS issues an `alps_session` HTTP-only cookie to the user's browser. This cookie contains a unique, random token that maps the browser to the in-memory Session object on the server.
3. **Caching**: Each Session has its own isolated cache for message lists, flags, and structural metadata, ensuring fast reads and preventing cross-user data leaks.

---

## Session Persistence (`login_key`)

Because ALPS stores Session objects in memory, **all sessions are lost if the ALPS server restarts**. To prevent users from being abruptly logged out during server updates or restarts, ALPS implements an encrypted session restoration mechanism.

### The `alps_login_token`
If you configure a `login_key` in the `[server]` section of `config.toml` (a base64-encoded 32-byte Fernet key), ALPS will issue a second cookie upon successful login called `alps_login_token`.

This cookie contains a JSON payload with the user's:
- Username
- Password
- 2FA Verification Status
- Persistent ("Remember Me") flag

**This payload is securely encrypted and signed using the Fernet `login_key`**. It cannot be read or tampered with by the user.

### Session Restoration
When a user makes a request to ALPS:
1. The server checks the `alps_session` cookie.
2. If the in-memory Session is missing (e.g., the server restarted or the session expired due to inactivity), ALPS intercepts the request.
3. It reads the `alps_login_token` cookie, decrypts it using the `login_key`, and extracts the credentials.
4. It silently creates a **new** in-memory Session using those credentials, restoring the user's WebAuthn 2FA status along the way.
5. The request proceeds as if nothing happened.

> [!WARNING]
> If you rotate or change the `login_key` in your configuration, all previously issued `alps_login_token` cookies will become invalid, forcing all users to log in manually again.

---

## Account Switching

ALPS allows users to link multiple accounts and switch between them seamlessly. Because ALPS requires an active IMAP connection for every account, switching accounts involves specific session orchestration:

1. The frontend requests an account switch via `POST /accounts/switch`.
2. The server extracts the stored password for the target linked account (retrieved securely from IMAP Metadata).
3. The server validates 2FA requirements (checking the `trust_linked_accounts` setting to see if it can safely bypass the WebAuthn prompt).
4. If successful, the server **closes** the current in-memory Session and disconnects from the IMAP server.
5. It opens a **new** Session for the target account, connecting to the new IMAP mailbox.
6. The server overwrites the `alps_session` and `alps_login_token` cookies in the user's browser with the new account's tokens.

This design ensures that ALPS only maintains active IMAP connections for the account the user is *currently* viewing, minimizing upstream server load.

---

## User Information Persistence

ALPS is entirely stateless. It does not use PostgreSQL, MySQL, or SQLite to store user preferences, contacts, calendars, or settings.

Instead, all user data is persisted directly to the user's email account using **IMAP METADATA** (RFC 5464).

When ALPS needs to save user info, it writes to specific metadata keys on the upstream IMAP server:
- `alps.settings`: UI preferences, themes, signatures.
- `alps.identities`: Configured sender aliases.
- `alps.linked_accounts`: Linked account usernames and encrypted passwords.
- `webauthn`: 2FA authenticators and security preferences.

This means a user's ALPS state is entirely portable. If you migrate the user's mailbox to another IMAP server, their ALPS settings, 2FA keys, and linked accounts move with them automatically.
