# Alps Webmail

A simple and extensible webmail.

## Requirements

- **Go**: the module needs Go 1.25.0 or later (`go 1.25.0` in `go.mod`) and names `toolchain go1.26.5`. With the default `GOTOOLCHAIN=auto`, an older `go` command (Go 1.21 or later) downloads go1.26.5 and builds with it. go1.26.5 carries the standard-library security fixes for the mail-parsing, TLS and HTTP paths, so build releases with go1.26.5 or later. With `GOTOOLCHAIN=local`, the local toolchain builds ALPS whenever it is Go 1.25.0 or later, whether or not its standard library has those fixes.
- **Node.js and npm**: needed only to rebuild `frontend/dist`, to run the Vite dev server, and to run the frontend unit and browser tests. Building or running ALPS itself does not need them. Use Node.js 20 (20.19 or later), 22 (22.12 or later), or 24 and later: Vite 8 and rolldown, as locked in `frontend/package-lock.json`, declare `^20.19.0 || >=22.12.0`, and Vitest 4 declares `^20.0.0 || ^22.0.0 || >=24.0.0`.
- **Platform**: ALPS builds on Linux, macOS, the BSDs and Windows. On Windows, `[logging] output = "syslog"` falls back to stderr, and the password plugin's `command` backend is refused, since it needs a Unix host.
- **Mail store**: chosen with `[provider] type`.
  - `"imap"` (the default) uses an existing IMAP server.
  - `"maildir"` reads a local Maildir and needs no IMAP server (see [Local Maildir Provider](docs/MAILDIR.md)).
  - `"multi"` routes each login by its domain to an imap or maildir backend: one named for that domain or group of domains, a server URL template, RFC 6186 SRV records (`_imaps._tcp`, then `_imap._tcp`), or a default backend. Templates and SRV lookups apply only to the domains on their allowlists. Per backend, multi can also name the SMTP, CardDAV, CalDAV and ManageSieve servers and the password-change settings.
- **IMAP Server**: for the imap provider and for multi backends of type imap. ALPS signs in with `LOGIN`, using the username and password typed on the sign-in page. In short (the full capability matrix, and what ALPS does without each capability, is in [Mail Server Requirements](docs/MAIL_SERVER.md#3-imap-capabilities)):
  - `IMAP4rev1` (RFC 3501) or `IMAP4rev2` (RFC 9051).
  - `METADATA` or `METADATA-SERVER` (RFC 5464) - **Required.** ALPS has no database: it keeps each account's settings (identities included), security keys and recovery codes, linked accounts and GPG keyring on the server, under `/private/vendor/alps/`. Without METADATA, ALPS still starts and signs users in, but keeps that data in memory for one IMAP connection only, so none of it persists. Use such a server only for trying ALPS out.
  - `UIDPLUS` (RFC 4315) - Strongly recommended. Without it, a permanent delete ends with a plain `EXPUNGE`, which also removes messages that another client has marked `\Deleted` in that folder.
  - `MOVE` (RFC 6851) - Recommended. Without it, a move is a COPY followed by the same delete.
  - Optional, used when the server lists them: `THREAD=REFS`, `THREAD=REFERENCES` or `THREAD=ORDEREDSUBJECT` (conversations), `SORT`, `MULTISEARCH` (Search All, across the subscribed folders), `LIST-EXTENDED`/`LIST-STATUS`, `NAMESPACE`, `ACL` (folder sharing), `QUOTA` (storage meter), `PREVIEW` (message previews in the list) and `BINARY`. Off unless configured: `IDLE` is used only with `[server] push_new_mail = true`, `NOTIFY` only with `push_subscribed_folders = true` as well, and `CONDSTORE` only with `condstore = true`. All three keys default to false.
  - A server that lists `IMAP4rev2` counts as having UIDPLUS, MOVE, IDLE, ENABLE, NAMESPACE, LIST-EXTENDED and LIST-STATUS.
- **SMTP Server**: Required. ALPS refuses to start without `[smtp] server`, even with the maildir or multi provider. Give it as `smtps://host[:port]` (implicit TLS, default port 465), `smtp://host[:port]` (STARTTLS, default 587) or `smtp+insecure://host[:port]` (no TLS). ALPS submits with the signed-in user's own credentials (AUTH PLAIN). The multi provider can name a different SMTP server per backend. See [SMTP Submission](docs/MAIL_SERVER.md#6-smtp-submission).
- **Optional services**:
  - A CardDAV server (contacts) and a CalDAV server (calendars), set with `[plugin.carddav]` / `[plugin.caldav]` `server` or per backend by the multi provider (see [Contacts & Calendars](docs/CDAV.md)).
  - A ManageSieve server (filters and auto-reply), set with `[plugin.managesieve]` `server` or per backend. Its connection must be upgraded with STARTTLS unless the URL is `managesieve+insecure://` or `sieve+insecure://` (see [Mail Filters and Auto-Reply](docs/FILTERS.md)).
  - For password change, an HTTP endpoint or a local command, with `[plugin.password]` `enabled = true` (see [Password Change](docs/PASSWORD_CHANGE.md)).

  `base` always loads. A plugin whose `[plugin.<name>]` section does not set `enabled = true` does not load, and once any section sets `enabled = true`, neither does a plugin without a section. CardDAV and CalDAV load with `enabled = true` even without a server, and then fail their requests as not configured for a login whose multi backend names no server of its own. ManageSieve loads only with a `server`, or when a multi backend names one. The [Configuration Guide](docs/CONFIGURATION.md#9-plugins-pluginname) has the full rules.

## Usage

All configuration is provided via a TOML configuration file, named by the required `-config` flag (`--config` also works). A comprehensive example can be found in `config.example.toml`. The [Configuration Guide](docs/CONFIGURATION.md) describes every key, and the few environment variables ALPS also reads: `CLUSTER_SECRET_KEY`, for one, takes precedence over `[cluster] secret_key` when set (see [Running Several Nodes](docs/CLUSTER.md)). Copy the example to `config.toml` and edit it to suit your needs. In particular:

- Keep `[server] debug` off (the default) in production. With it on, ALPS writes the IMAP exchange to stderr and the CardDAV, CalDAV and ManageSieve exchanges to stdout, message, contact and calendar content included.
- Point `[provider.imap] server` and `[smtp] server` at your own mail servers, since the example uses Migadu's.
- Set `[webauthn] rpid` to the public hostname and `origins` to its origin (for example `https://webmail.example.com`). Unset, they default to localhost, and security keys work only from localhost.
- The example ships `enabled = true` for CardDAV, CalDAV and ManageSieve with no server: CardDAV and CalDAV then load and fail every request, and ManageSieve stays off. Set a server for each one you run, or set `enabled = false` for the others.

Run the alps backend server:

    go run ./cmd/alps -config config.toml

ALPS listens on `[server] addr`, default `:1323`. `alps -version` prints the version, commit and build date.

### Building

    make build

`make build` (the default target) writes `build/alps` with the version, commit and date stamped in for `alps -version`. It does not rebuild the frontend: the binary embeds `frontend/dist` as it is at compile time. The other targets:

- `make build-linux` and `make build-freebsd` cross-compile static amd64 binaries (`CGO_ENABLED=0`) to `build/alps-linux-amd64` and `build/alps-freebsd-amd64`.
- `make install` runs `go install`.
- `make build-frontend` runs `npm install` and `npm run build` in `frontend`, which rebuilds `frontend/dist` (see below).
- `make test`, `make test-coverage` and `make test-e2e` run the tests (see [Running the tests](#running-the-tests)).
- `make clean` removes `build/`, and `make help` lists the targets.

`./run.sh` rebuilds `frontend/dist` and then runs `go run ./cmd/alps --config config.toml`. It does not run `npm install`, so run that in `frontend` once first.

### Running as a service

`dist/alps.service` (systemd, config at `/etc/alps/config.toml`) and `dist/alps` (FreeBSD rc.d, config at `/usr/local/etc/alps/config.toml`) run `/usr/local/bin/alps -config <path>` as user `alps`. Their reload (`systemctl reload alps`, `service alps reload`) sends SIGHUP. SIGHUP reopens the log file when `[logging] output` is a file path, and does not reload the configuration; restart ALPS to apply configuration changes. SIGINT or SIGTERM ends open event streams and shuts down gracefully. Requests in progress get up to 30 seconds to finish, and the sessions' cleanup up to 5 more. With Let's Encrypt on S3 storage and `[cluster]`, stopping the certificate workers and leaving the cluster can add up to 20 seconds after that, so a shutdown takes up to 55 seconds. The shipped systemd unit's `TimeoutStopSec=60` covers it. [Operating ALPS](docs/OPERATIONS.md) covers each [shutdown step](docs/OPERATIONS.md#1-signals-and-graceful-shutdown), the service files and their stop timeout, restarts, and what ALPS writes to disk.

### Frontend Interface

The webmail interface is a single-page application. The compiled frontend assets (including all plugins) are checked into the repository under `frontend/dist` and are embedded directly into the Go binary (`//go:embed all:frontend/dist`).

**You do not need to compile the frontend to run ALPS.** It works out of the box.

However, if you are making changes to the UI or plugins, you will need to recompile it:

    cd frontend
    npm install
    npm run build

`npm run build` (or `make build-frontend`) rewrites `frontend/dist` but does not rebuild the Go binary. ALPS embeds `frontend/dist` when the Go binary is compiled, so rebuild the binary afterwards (`make build`). `go run` and `./run.sh` recompile every time. `frontend/dist` is tracked, so a change to the UI or to a plugin's frontend should include the rebuilt `frontend/dist`.

For frontend development, run the backend (`go run ./cmd/alps -config config.toml`, on its default `:1323`), then use the Vite dev server in a second terminal:

    cd frontend
    npm install
    npm run dev

Open http://localhost:5173. The Vite dev server forwards the API paths to http://localhost:1323, and the default WebAuthn origins already include http://localhost:5173, so no extra configuration is needed. Through the dev server, configured branding does not appear, because Vite serves its own `index.html`.

## Running the tests

ALPS has three test tiers:

- Go tests: `go test ./...` (or `make test`).
- Frontend unit tests (Vitest): `cd frontend && npm install && npm test`, which typechecks the tests first.
- Browser tests: `scripts/e2e.sh` (or `make test-e2e`), which needs PostgreSQL with the `pg_trgm` and `btree_gin` extensions, a sora checkout (default `../sora`) and Playwright's Chromium (see [Testing](docs/E2E.md)). It rebuilds `frontend/dist` first, unless `E2E_SKIP_BUILD=1` is set.

The repository has no CI, so run these yourself before opening a pull request.

## Documentation

Dive deeper into how ALPS works.

### Setting up and running

- [Example Configuration](config.example.toml): the commented example configuration, with each option's default
- [Configuration Guide](docs/CONFIGURATION.md): every config section and key, with its type, default and meaning
- [Mail Server Requirements](docs/MAIL_SERVER.md): what ALPS needs from, and uses on, the IMAP and SMTP servers
- [Local Maildir Provider](docs/MAILDIR.md): the local Maildir provider and its passwd file
- [TLS & SSL Configuration](docs/TLS.md): certificate files, Let's Encrypt, S3 certificate storage, reverse proxies
- [Running Several Nodes](docs/CLUSTER.md): the gossip cluster, certificates in a cluster, node-local state and session affinity, and the settings every node must share
- [Operating ALPS](docs/OPERATIONS.md): signals and shutdown, restarts, files on disk, the shipped service files, outbound connections
- [Rate Limiting & Security](docs/RATELIMIT.md): rate-limit tiers, lockouts and cluster sync

### Features

- [Session Management & Persistence](docs/SESSIONS.md): sessions, `login_key` and the `alps_login_token` cookie, "Stay signed in after closing the browser", account switching
- [WebAuthn & 2FA](docs/WEBAUTHN.md): two-factor sign-in with security keys, recovery codes, trusting linked accounts, and where it is stored
- [WebAuthn Coordination Across Instances](docs/WEBAUTHN_COORDINATION.md): how credential updates stay consistent across several ALPS instances
- [Contacts & Calendars (CardDAV/CalDAV)](docs/CDAV.md): contacts and calendars through CardDAV and CalDAV
- [Mail Filters and Auto-Reply](docs/FILTERS.md): the ManageSieve plugin, its visual rules, auto-reply and raw Sieve editor
- [OpenPGP Encryption](docs/GPG.md): the GPG plugin, its keyring, and how recipient keys are found
- [Password Change](docs/PASSWORD_CHANGE.md): the password change plugin, through an HTTP endpoint or a command
- [Attachment Handling](docs/ATTACHMENTS.md): attachment lifecycle, quotas, eviction and cleanup
- [Search Syntax](docs/SEARCH.md): the search syntax
- [Localization and RTL](docs/LOCALIZATION.md): languages, adding a dictionary, how a language is picked, right-to-left layout, date and time settings

### Development

- [Architecture Overview](docs/ARCHITECTURE.md): backend, frontend, providers, plugins, and how ALPS keeps its state in IMAP METADATA
- [Plugin System](docs/PLUGINS.md): plugin structure, and how to write a plugin's backend and frontend
- [Testing (Go, frontend, browser)](docs/E2E.md): the three test tiers and the browser test harness

## AI Assistance Policy

In compliance with NLnet's policies and our own project standards, the use of Generative AI (GenAI) in this project is strictly **assistive**.

- **Permitted Uses**: GenAI tools may be used to assist with boilerplate code generation, writing tests, formatting documentation, or explaining logic.
- **Prohibited Uses**: GenAI should not be used in a generative capacity for high-level architecture decisions or core code quality design. Purely AI-generated outputs without substantial human intellectual contribution are not accepted.
- **Accountability**: Human contributors remain fully accountable for the accuracy, originality, security, and FLOSS license compatibility of all submitted work.
- **Contributor Expectations**: We expect contributors to adhere to these same principles. When submitting patches or pull requests, please disclose any substantive use of GenAI that materially affected the output (e.g., in your commit messages or PR descriptions).


## Contributing

Send patches and/or GitHub Pull Requests, report bugs on the issue tracker.

Before sending a change, run the Go tests and the frontend unit tests, and for changes to UI flows also the browser suite (see [Running the tests](#running-the-tests)). Changes to the frontend should include the rebuilt `frontend/dist`.
