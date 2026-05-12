# [alps]

[![GoDoc](https://godoc.org/github.com/migadu/alps?status.svg)](https://godoc.org/github.com/migadu/alps)

A simple and extensible webmail.

> **Note**: This repository is a continuation of our previous instance hosted at [SourceHut (git.sr.ht/~migadu/alps)](https://git.sr.ht/~migadu/alps).

## Requirements

- **Go**: Version 1.25.0 or later is required (for building/development).
- **IMAP Server**: ALPS sits on top of an existing IMAP server and requires the following capabilities:
  - `IMAP4rev1` (RFC 3501)
  - `METADATA` (RFC 5464) - **Strictly required** for persisting ALPS settings, WebAuthn keys, and identities.
  - `UIDPLUS` (RFC 4315) - Strongly recommended for reliable message tracking and movement.
  - `IDLE` (RFC 2177) - Recommended for real-time email push notifications.
- **SMTP Server**: Required for sending outgoing messages.

## Usage

All configuration is provided via a TOML configuration file. A comprehensive example can be found in `config.example.toml`. Copy this file to `config.toml` and edit it to suit your needs.

Run the alps backend server:

    go run ./cmd/alps -config config.toml

See [docs/CLI.md](docs/CLI.md) for more information on the CLI options.

### Frontend Interface

The webmail interface is a single-page application. The compiled frontend assets (including all plugins) are checked into the repository under `frontend/dist` and are embedded directly into the Go binary (`//go:embed all:frontend/dist`). 

**You do not need to compile the frontend to run ALPS.** It works out of the box.

However, if you are making changes to the UI or plugins, you will need to recompile it:

    cd frontend
    npm install
    npm run build

For frontend development, use the Vite dev server:

    cd frontend
    npm run dev

## Documentation

Dive deeper into how ALPS works:
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Configuration Guide](docs/CONFIGURATION.md)
- [Session Management & Persistence](docs/SESSIONS.md)
- [WebAuthn & 2FA](docs/WEBAUTHN.md)
- [Contacts & Calendars (CardDAV/CalDAV)](docs/CDAV.md)
- [Rate Limiting & Security](docs/RATELIMIT.md)
- [Attachment Handling](docs/ATTACHMENTS.md)
- [Plugin System](docs/PLUGINS.md)
- [TLS & SSL Configuration](docs/TLS.md)

## AI Assistance Policy

In compliance with NLnet's policies and our own project standards, the use of Generative AI (GenAI) in this project is strictly **assistive**.

- **Permitted Uses**: GenAI tools may be used to assist with boilerplate code generation, writing tests, formatting documentation, or explaining logic.
- **Prohibited Uses**: GenAI should not be used in a generative capacity for high-level architecture decisions or core code quality design. Purely AI-generated outputs without substantial human intellectual contribution are not accepted.
- **Accountability**: Human contributors remain fully accountable for the accuracy, originality, security, and FLOSS license compatibility of all submitted work.
- **Contributor Expectations**: We expect contributors to adhere to these same principles. When submitting patches or pull requests, please disclose any substantive use of GenAI that materially affected the output (e.g., in your commit messages or PR descriptions).


## Contributing

Send patches via [GitHub Pull Requests], report bugs on the [issue tracker].

## Supported by

<p align="left">
  <a href="https://nlnet.nl/">
    <img src="https://nlnet.nl/logo/banner.svg" alt="NLnet foundation logo" height="50" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://migadu.com/">
    <img src="https://migadu.com/svg/logo.svg" alt="Migadu logo" height="50" />
  </a>
</p>
