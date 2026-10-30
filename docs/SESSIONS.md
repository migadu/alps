# Session Management in ALPS

ALPS is designed as an ultra-fast, stateless webmail interface. To achieve its speed, it maintains a persistent connection pool to the upstream IMAP and SMTP servers. This document explains how ALPS manages these connections, handles user sessions, and persists state without requiring a database.

---

## The Session Architecture

When a user logs in, ALPS creates a **Session** object in memory. 

1. **Connection Pooling**: The Session holds a dedicated connection to the upstream IMAP server. This means ALPS doesn't need to re-authenticate or re-select mailboxes on every HTTP request, making navigation incredibly fast. Work the user is not waiting for (checks for new mail, sender verdicts, the search of Sent for a conversation's replies, draft saves, messages a conversation reads ahead) runs on a second connection, opened when first needed and closed after a minute unused, so that it does not hold up what the user opens. A session opens no more than this one beside its own (a connection given up on mid-command stays open until that command returns, as before, and the session's own work does not wait for a busy background connection then, but opens its own beside it); when the server will not open the second, that work runs on the first. See `background_connection` in [CONFIGURATION.md](CONFIGURATION.md). With `push_new_mail` on, the second connection also waits in IDLE on the Inbox while a mail page holds its event stream open, ends the wait for any background work and begins it again after, and tells the page of each message that arrives in the Inbox or leaves it. With `push_subscribed_folders` as well, and a mail server with NOTIFY, it also asks the server for the news of the subscribed folders, and tells the page of them too.
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

### "Keep me signed in"
The box on the sign-in page decides whether the cookies that hold a session outlive the browser. Ticked, `alps_session`, `alps_login_token` and the two cookies the page reads beside them (`alps_logged_in`, `alps_has_login_token`) carry a 30-day expiry. Unticked, they are session cookies, and the browser drops them when it closes. The box is off unless the user ticks it.

The choice is kept in the login token, and every answer that issues these cookies again issues them the same way: a session restored from the token, and a switch to a linked account. A sign-in or a switch that waits for a security key carries the choice with its pending session, so the session issued once the key is given follows the box of that sign-in and no other.

---

## Account Switching

ALPS allows users to link multiple accounts and switch between them seamlessly. Because ALPS requires an active IMAP connection for every account, switching accounts involves specific session orchestration:

1. The frontend requests an account switch via `POST /accounts/switch`.
2. The server extracts the stored password for the target linked account (retrieved securely from IMAP Metadata).
3. The server validates 2FA requirements (checking the `trust_linked_accounts` setting to see if it can safely bypass the WebAuthn prompt).
4. If successful, the server **closes** the current in-memory Session and disconnects from the IMAP server.
5. It opens a **new** Session for the target account, connecting to the new IMAP mailbox.
6. The server overwrites the `alps_session` and `alps_login_token` cookies in the user's browser with the new account's tokens, kept or not as the "Keep me signed in" box was at sign-in.

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
