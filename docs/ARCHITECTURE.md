# ALPS Architecture Overview

ALPS is a fast, modern, and uniquely stateless webmail and Personal Information Management (PIM) suite. Unlike traditional webmail clients that rely on sprawling SQL databases and complex background sync workers, ALPS is designed to sit as a lightweight, API-first abstraction layer directly on top of your existing IMAP and SMTP servers.

This document outlines the core architectural components, dependencies, and design philosophies of the system.

---

## 1. System Overview

At a high level, ALPS is composed of two main parts:
1. **The Backend**: A highly concurrent HTTP server written in Go that acts as an intelligent proxy, connection pool, and JSON API provider.
2. **The Frontend**: A Single Page Application (SPA) built using standard Web Components (via Lit) that communicates exclusively with the Backend API.

```mermaid
graph TD
    Browser[Web Browser / Lit Frontend] -->|JSON API + HTTP| Backend[ALPS Go Backend]
    Backend -->|IMAP (RFC 3501, 5464)| IMAPServer[Upstream IMAP Server]
    Backend -->|SMTP (RFC 5321)| SMTPServer[Upstream SMTP Server]
```

---

## 2. Backend Architecture

The Go backend is responsible for session management, protocol parsing, and serving the API and static assets.

### Connection Pooling & Session Management
Because establishing TLS connections to IMAP servers is computationally expensive and slow, ALPS maintains persistent connection pools. 
- When a user logs in, the `SessionManager` allocates a long-lived IMAP connection for them.
- All subsequent HTTP requests map to this in-memory `Session` via the `alps_session` cookie.
- If the server restarts, ALPS uses an encrypted `alps_login_token` to seamlessly and silently restore the session and reconnect to the upstream server without prompting the user.

### Provider Abstraction
To future-proof the codebase, ALPS defines a `provider.MailProvider` interface. The core routing logic never speaks IMAP directly. Instead, it calls methods like `ListMessages()` or `SearchMessages()` on the provider. Currently, the primary implementations are the `imap` provider (for network IMAP servers) and the native `maildir` provider (for direct local filesystem access). This abstraction makes it easy to integrate additional backends, such as JMAP, in the future.

### Plugin System
ALPS is modular. Beyond the `base` email features, additional capabilities like `caldav`, `carddav`, `managesieve`, and `gpg` are implemented as independent plugins. 
Plugins reside in the `plugins/` directory and encapsulate both their Go backend routes and their TypeScript/Lit frontend assets. They register themselves with the core router during startup.

---

## 3. Frontend Architecture

The ALPS frontend is a modern SPA designed for speed and modularity. 

### Web Components & Lit
ALPS abandons heavy virtual-DOM frameworks (like React or Vue) in favor of browser-native **Web Components** built with **Lit** (`lit.dev`).
- UI elements are encapsulated in isolated Shadow DOMs (e.g., `<alps-message-list>`, `<alps-floating-composer>`).
- This makes styling strictly scoped and prevents CSS bleed between complex views (like the calendar and the mail reader).

### Build System
The frontend is built and bundled using **Vite**. 
- Vite extracts all plugin assets dynamically.
- The compiled assets are then `//go:embed` into the final Go binary, allowing ALPS to be distributed as a single, statically linked executable with zero external dependencies.

### State Management
State is managed using `@lit/context` and lightweight reactive store singletons (e.g., `SettingsStore`, `ComposeStore`). When the underlying store data updates, Lit automatically triggers targeted re-renders in the subscribed components.

---

## 4. Stateless Persistence (IMAP METADATA)

Perhaps the most unique architectural decision in ALPS is the complete absence of a traditional database (no PostgreSQL, MySQL, or SQLite).

To persist user-specific data, ALPS leverages **IMAP METADATA (RFC 5464)**. This protocol extension allows clients to store arbitrary key-value data directly on the IMAP server, attached to the user's mailbox.

ALPS uses the `store` abstraction to read and write JSON payloads to the following IMAP Metadata keys:
- `alps.settings`: UI preferences, theme selections, composer defaults, and custom signatures.
- `alps.identities`: Configured sender aliases (custom From addresses).
- `alps.linked_accounts`: The usernames and encrypted passwords of linked accounts for fast switching.
- `webauthn`: Enrolled 2FA security keys and trust preferences.
- `plugins.*`: Plugin-specific configurations (e.g., CalDAV server URLs).

### Why IMAP Metadata?
1. **Zero Configuration**: Administrators do not need to set up, secure, or backup a database to run ALPS.
2. **Ultimate Portability**: A user's settings, aliases, and 2FA keys are bound to their email account, not the ALPS server. If an administrator migrates a user's mailbox from one IMAP server to another, their entire ALPS identity and configuration moves with them automatically.
3. **Data Sovereignty**: Users retain complete control over their configuration data alongside their emails.
