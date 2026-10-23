# ALPS Configuration Reference

This document provides a comprehensive overview of all configuration options and sections available in ALPS, as defined in `config.example.toml`. The configuration file uses the TOML format.

---

## 1. Server Configuration (`[server]`)
This section contains core settings for the ALPS HTTP server, session management, and limits.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `addr` | String | `":1323"` | The address and port on which the server listens. |
| `debug` | Boolean | `true` | Enables debug mode. When `true`, logging level defaults to "debug" and console formatting is used. |
| `trusted_proxies`| Array | `[]` | Array of IPs/CIDR blocks to trust `X-Forwarded-For`, `X-Real-IP`, `X-Forwarded-Proto` and `X-Forwarded-Host` headers from (e.g. `["127.0.0.1/32"]`). Must be set if behind a proxy — see [Running behind a reverse proxy](TLS.md#5-reverse-proxies). |
| `trusted_origins`| Array | `[]` | (Optional) Additional origins accepted by the CSRF check, in addition to the one ALPS derives from the request (e.g. `["https://webmail.example.com"]`). Use when the proxy cannot set `X-Forwarded-Proto`/`X-Forwarded-Host`. |
| `login_key` | String | None | (Optional) Fernet key for encrypting user credentials in browser cookies. Enables "remember me" functionality and session restoration across server restarts. Changing this key invalidates all persisted sessions. |
| `temp_dir` | String | OS Default | (Optional) Directory for temporary file uploads and processing. |
| `session_minutes` | Integer | `30` | Duration of user sessions in minutes without activity. |
| `max_session_minutes` | Integer | `1440` | Maximum absolute duration of a session (e.g., 24 hours), capping user preferences. |

### 1.1 HTTP Server Timeouts
These settings protect the server against slow client attacks and resource exhaustion.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `read_timeout_sec` | Integer | `10` | Max time allowed to read the entire HTTP request (headers + body). |
| `write_timeout_sec` | Integer | `30` | Max time allowed to write the HTTP response. Set higher if handling large attachments. |
| `idle_timeout_sec` | Integer | `120` | Max time to wait for the next request when using HTTP keep-alive connections. |
| `imap_timeout_sec` | Integer | `30` | IMAP server connection and login timeout. |
| `smtp_timeout_sec` | Integer | `30` | SMTP operation timeout to prevent blocking on stuck operations. |

### 1.2 Session Limits
Controls the maximum concurrent sessions to prevent memory exhaustion and abuse.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `max_sessions` | Integer | `10000` | Global max concurrent sessions across all users. `0` means unlimited. |
| `max_sessions_per_user` | Integer | `10` | Max concurrent sessions allowed per user. `0` means unlimited. |
| `background_connection` | Boolean | `true` | Each session opens a second mail connection, when first needed, for work the user is not waiting for (checks for new mail, sender verdicts, the search of Sent for a conversation's replies, draft saves, messages a conversation reads ahead), and closes it after a minute unused; the next such work opens it again and waits for its sign-in. A session opens no more than this one beside its own. A connection it gave up on mid-command (the browser went away) stays open until that command returns, as before; meanwhile the session opens no background connection, but its own work does not wait for a busy one and opens its own connection beside it. If the mail server refuses the second one, for instance at its per-user connection limit, the work runs on the session's own connection and the session goes on; with `push_new_mail` on, the second connection stays open while a mail page is, which costs more than speed (see [Pushing new mail](#14-pushing-new-mail)). A session whose own connection is refused at the limit carries on with its background connection when the server says why with `[LIMIT]` (RFC 5530), as Sora does; a server that refuses with a bare `NO` ends the session. `false` keeps one connection per session. |
| `push_new_mail` | Boolean | `false` | While a mail page is open, its session waits on its background connection for the mail server's news of the Inbox (IMAP IDLE) and pushes it to the page over an event stream (`GET /events`, Server-Sent Events), which then checks at once rather than at its next check. Pushed are messages that arrive in the Inbox or leave it; flags, and the other folders, come with the checks at the user's interval, which go on as before. One tab of a browser holds the stream and tells the others. Needs `background_connection`, a mail server with IDLE, and a browser that offers `navigator.locks`, which browsers do only in a secure context: a deployment served over plain HTTP, other than on `localhost`, gets no push. See [Pushing new mail](#14-pushing-new-mail) for what it costs and what a reverse proxy must allow. |

### 1.3 Attachment Limits
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `max_attachment_mib` | Integer | `32` | Max attachment size per composer instance. |
| `max_session_attachment_mib` | Integer | `128` | Max total attachment size uploaded across all composers in a single session. |
| `max_global_attachment_mib` | Integer | `1024` | Max total attachment size stored on the server across all users. |

### 1.4 Pushing new mail
`push_new_mail` is off by default, because of what it costs and what it asks of the network in front of ALPS:

- **Two IMAP connections for every open mail page.** Without push, a session's background connection closes after a minute unused, so a session mostly holds one. With push, every session with a mail page open holds two for as long as the page is open: its own and the background one, in IDLE on the Inbox. Every session connects from ALPS's one address, and mail servers count connections per user and address: Sora's example configuration allows `max_connections_per_user_per_ip = 5` (8 through its proxy), and `max_connections_per_ip = 200`, which, all ALPS's sessions coming from one address, is about 100 open mail pages across all users. So with push and the per-user limit, a user with mail open in two browsers holds four connections; a third signs in on the fifth and gets no push, its second connection refused; and a sign-in from a fourth is refused for the limit. ALPS gives way within a session (a session refused a connection of its own at the limit takes over its background connection), not across the sessions of an account: raise the per-user limits for ALPS's address, or keep push off.
- **The mail server works for every open page.** The server watches the Inbox for each connection in IDLE: Sora re-checks a mailbox in IDLE every 15 seconds (`idlePollInterval` in Sora's `server/imap/idle.go`), more work for each open session than the one status check every 5 minutes that a page makes by default. IDLE is begun again every 25 minutes: RFC 2177 asks clients to begin it again at least every 29, as a server may log off a client idle for 30 (RFC 3501 §5.4).
- **The event stream is a long-lived HTTP request.** It stays open for as long as the page. A reverse proxy must not buffer it: ALPS answers with `Cache-Control: no-cache` and `X-Accel-Buffering: no`, which nginx honours; other proxies may need buffering turned off for `/events`. It must let the request stay open: ALPS writes a heartbeat (a comment line) every 20 seconds, which keeps it within the usual idle timeouts (nginx `proxy_read_timeout`, 60 s by default; HAProxy `timeout server`). ALPS's own `read_timeout_sec` and `write_timeout_sec` do not apply to it.
- **In a cluster the stream must reach the node holding the session**, as every request of the session already must, since that node holds its IMAP connections.
- **Only in a secure context.** One tab of a browser holds the stream, chosen with `navigator.locks`, which browsers offer only over HTTPS and on `localhost`: elsewhere no tab opens one, rather than every tab (browsers allow six HTTP/1.1 connections to a host, and a stream per tab would leave the tabs waiting for their own requests).

A failed or refused IDLE never signs anyone out: the pages check at their interval until it is back. It is tried again after a minute, then twice as long after each failure in a row, up to about half an hour.

---

## 2. Rate Limiting (`[server.rate_limit]`)
Protects the login endpoints from brute force attacks.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | Boolean | `true` | Enables or disables the rate limiter. |
| `ip_requests_per_minute` | Integer | `5` | Max login attempts from a single IP per minute. |
| `ip_requests_per_hour` | Integer | `20` | Max login attempts from a single IP per hour. Triggers IP lockout. |
| `username_fails_per_quarter`| Integer | `5` | Max failed login attempts per username per 15 minutes. |
| `username_fails_per_hour` | Integer | `10` | Max failed login attempts per username per hour. Triggers username lockout. |
| `global_requests_per_second`| Integer | `100` | Max login requests across all users and IPs globally per second. |
| `lockout_minutes` | Integer | `15` | Duration (in minutes) an IP or username remains blocked after hitting hourly limits. |

---

## 3. Caching (`[cache]`)
Controls the application-level data cache.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | Boolean | `true` | Enables or disables caching. |
| `ttl_minutes` | Integer | `10` | Time-to-live for cached items before they expire. |

---

## 4. Logging (`[logging]`)
Configures output destination, format, and verbosity.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `output` | String | `"stderr"` | Destination for log output (`"stdout"`, `"stderr"`, `"syslog"`, or a file path like `"/var/log/alps.log"`). |
| `format` | String | `"console"`| Log format: `"json"` (structured, for production) or `"console"` (human-readable). |
| `level` | String | `"info"` | Minimum log severity: `"debug"`, `"info"`, `"warn"`, or `"error"`. |
| `access` | Boolean | `true` | Logs one `request` line per HTTP request at `info`: method, path (without the query string), status, bytes, `duration_ms`, client `ip` and, once signed in, `user` and `session`. |

What is logged about users, whatever `access` says:

| Message | Level | Fields |
| :--- | :--- | :--- |
| `sign-in` | info | `user`, `ip`, `session`, `2fa`, `remember`, `restored`, `agent` |
| `sign-in awaits second factor` | info | `user`, `ip`, `session` |
| `sign-in failed` | warn | `user`, `ip`, `reason` (`bad credentials`, `rate limited`, `second factor refused`, `error`), plus `agent`, `detail`, `session` or `error` |
| `session restored` | info | `user`, `ip`, `session` — a browser signed back in with its login token, e.g. after a restart |
| `account switch` | info | `user`, `to`, `ip`, `session` (the new one), `2fa_trusted` |
| `account switch awaits second factor` | info | `user`, `to`, `ip`, `session` (the new one) |
| `session ended` | info | `user`, `session`, `duration`, `reason` (`sign-out`, `idle`, `max-age`, `switched`, `evicted`, `auth-error`, `mail-server-unavailable`) |

`session` is a short hash of the session token, which ties a session's lines together; the token itself is never logged. `ip` is the peer's address, or the client address forwarded by a proxy listed in `trusted_proxies`.

---

## 5. WebAuthn (`[webauthn]`)
Settings required for WebAuthn (Two-Factor Authentication).

| Option | Type | Description |
| :--- | :--- | :--- |
| `rpid` | String | Relying Party ID (usually the domain, e.g., `"webmail.example.com"`). |
| `display_name` | String | The application name displayed during authentication (e.g., `"Alps Webmail"`). |
| `origins` | Array | Allowed origins (e.g., `["https://webmail.example.com"]`). Must include scheme, no trailing slash. |

---

## 6. TLS Configuration (`[tls]`)
Handles Transport Layer Security for secure connections.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | Boolean | `false` | Enables TLS termination. |
| `provider` | String | None | TLS provider type: `"file"` (manual certs) or `"letsencrypt"` (automatic ACME). |
| `cert_file` | String | None | Path to the TLS certificate (required if provider is `"file"`). |
| `key_file` | String | None | Path to the TLS private key (required if provider is `"file"`). |

### 6.1 Let's Encrypt (`[tls.letsencrypt]`)
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `email` | String | None | Email address for ACME registration. |
| `domains` | Array | None | List of domains to obtain certificates for. |
| `default_domain` | String | None | (Optional) Fallback domain for SNI-less connections. |
| `storage_provider`| String | `"s3"` | Where certificates are stored. |
| `cache_dir` | String | `"cert-cache"`| Local filesystem cache directory for certificates. |
| `sync_interval_minutes`| Integer | `5` | Sync interval for S3 fallback cache. |
| `acme_http_addr` | String | `":80"` | Address for HTTP-01 challenge handler. |

### 6.2 Let's Encrypt S3 Storage (`[tls.letsencrypt.s3]`)
| Option | Type | Description |
| :--- | :--- | :--- |
| `endpoint` | String | S3 compatible endpoint (e.g., `"s3.amazonaws.com"`). |
| `bucket` | String | Name of the bucket to store certs. |
| `access_key` | String | (Optional) S3 Access Key. Uses IAM if omitted. |
| `secret_key` | String | (Optional) S3 Secret Key. |
| `region` | String | (Optional) S3 Region. |
| `prefix` | String | (Optional) Key prefix for storing objects (e.g., `"alps/"`). |

---

## 7. Cluster (`[cluster]`)
Required when using Let's Encrypt with S3 storage across multiple ALPS nodes.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | Boolean | `false` | Enables cluster gossip protocol. |
| `bind` | String | `"0.0.0.0"`| Address or interface to bind the cluster listener to. |
| `port` | Integer | `7946` | Gossip protocol port. |
| `secret_key` | String | None | Base64-encoded 32-byte key for cluster encryption. |
| `peers` | Array | None | List of initial peer addresses (e.g., `["node2:7946", "node3:7946"]`). |

---

## 8. Provider & Servers
Configures the backend mail services.

### `[provider]`

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` | String | `"imap"` | Mail provider protocol (`"imap"`, `"maildir"`, or `"multi"`). |
| `timeout_sec` | Integer | `30` | Provider connect timeout in seconds. For the `imap` provider this supersedes the legacy `[server] imap_timeout_sec`, which is still honoured when `timeout_sec` is unset. |

A `[provider.<type>]` section matching `type` is required.

### `[provider.imap]`
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `server` | String | None | Direct URL to IMAP server (e.g. `"imaps://imap.example.com:993"`). Required, and must carry a scheme: `imaps://` (implicit TLS, default port 993), `imap://` (default port 143) or `imap+insecure://` (implies `insecure`). |
| `insecure` | Boolean | `false` | Allow connections without strict TLS validation. |
| `debug` | Boolean | `false` | Log the IMAP protocol exchange for this provider. OR-ed with `[server] debug`. Dumps message content and credentials-adjacent traffic, so keep it off in production. |
| `authserv_ids` | Array | `[]` | Authserv-ids of the receiving mail servers whose `Authentication-Results` header is trusted for a message's DMARC verdict, which decides whether a sender's BIMI logo is shown (e.g. `["mx.example.com"]`). Matched in any case. Empty means the topmost header is read, so a message the server did not stamp is judged by a header its sender wrote. |

### `[provider.maildir]`
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `auth_passwd_file`| String | None | Path to the Dovecot-style authentication password file. **Required**; startup fails without it. |
| `path` | String | None | Path to the Maildir root directory. Optional: when unset, each user's maildir is taken from the home directory in `auth_passwd_file` (`<home>/Maildir`). Supports the `%u` (local part), `%d` (domain) and `%n` (full username) placeholders. |

### `[provider.multi]`
Routes incoming user logins across multiple email backends. Domain resolution priority:
1. **Explicit Domain Mapping**: `[provider.multi.domains."example.com"]` (any provider type like `imap` or `maildir`).
2. **Grouped Routes**: `[[provider.multi.routes]]` matching the domain from `domains = ["d1.com", "d2.com"]`.
3. **Template Pattern**: `template = "imaps://mail.%d:993"` where `%d` is replaced with the user's domain (also supports `%u` for local part and `%n` for username, validated against RFC rules).
4. **RFC 6186 DNS Autodiscovery**: `autodiscover = true` queries `_imaps._tcp.<domain>` then `_imap._tcp.<domain>` SRV records for domains listed in `autodiscover_domains`. Private/loopback IP targets are strictly blocked to prevent SSRF.
5. **Default Fallback Provider**: `[provider.multi.default]` used if no previous rules match. If a domain matches an explicit template or autodiscover rule, errors are returned directly and do not fail open.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `default_domain` | String | None | Fallback domain assumed if a user logs in with a username lacking `@domain`. The user still signs in with the bare username, but `username@default_domain` is the user's address: messages are sent from it and meetings are organized from it. |
| `template` | String | None | Server URL pattern containing `%d` (domain), `%u` (local part), or `%n` (full username). Both domain and local part are strictly validated to prevent injection and SSRF. |
| `template_domains` | Array of Strings | `[]` | Domain allowlist for template routing. Required when `template` is set: the template builds a server address out of the login, so an unlisted domain never matches and routing falls through to the next rule. |
| `autodiscover` | Boolean | `false` | Automatically look up RFC 6186 DNS SRV records for IMAP servers. |
| `autodiscover_domains` | Array of Strings | `[]` | Domain allowlist for autodiscovery. Required when `autodiscover = true` to prevent unauthenticated SSRF relays. |
| `domains` | Table | None | Map of domain strings to provider configurations (e.g. `[provider.multi.domains."example.com"]`). |
| `smtp`, `carddav`, `caldav`, `managesieve` | String | None | Set *inside* a `domains` entry, a `routes` entry or `default`: the endpoint logins that land there should use. Each takes the same URL form as its global counterpart. Omitted, that backend defers to the matching global setting. |
| `password` | Table | None | A sub-table of a backend (`[provider.multi.routes.password]`), replacing `[plugin.password.options]` for logins that land there. Replaced whole, not merged: separate backends mean separate admin APIs and credentials. |
| `routes` | Array of Tables | None | Grouped routes specifying `domains` list and provider configuration. |
| `default` | Table | None | Fallback provider configuration table when no domain match occurs. |

A single IMAP server whose users sign in with bare usernames can be set up this way too, with only `default_domain` and a `[provider.multi.default]` naming the server, so that users send from an address rather than from their username. With the other providers a bare username stays the From address. The calendar then organizes from the first address the CalDAV server lists for the user (`calendar-user-address-set`), when it lists one.

Every backend a login touches follows the domain that chose its mail store, so a user does not read from one host and then send, sync contacts or calendars, edit filters or change a password somewhere unrelated. A backend that names no endpoint for a service defers to that service's global setting rather than borrowing one from an unrelated backend; domains reached by `template` or `autodiscover` have no entry of their own and fall to `default`, then to the global setting. When per-domain endpoints are configured in `multi`, service plugins (`carddav`, `caldav`, `managesieve`) initialize automatically even if their global `server` option is omitted, with unrouted logins treating unnamed services as disabled.

The CalDAV endpoint named here must carry a scheme. Start-up can fall back to DNS discovery for the global `[plugin.caldav] server`, but a login must not cost a discovery round trip, so a per-backend endpoint without a scheme is refused and the global one stands.

Both allowlists accept the single entry `"*"` to match every domain. That turns the dynamic routes back into an open relay: any login makes the server connect to a host the login chose, so use it only on a deployment that is not reachable by untrusted users. Private, loopback, link-local, `0.0.0.0/8`, and CGNAT targets stay blocked either way, and the block is re-checked against the address each connection actually reaches. An unallowlisted domain simply misses the rule and routing proceeds to `default`.


### `[smtp]`
Configures the SMTP server used for sending emails.
| Option | Type | Description |
| :--- | :--- | :--- |
| `server` | String | SMTP server URI (e.g., `"smtps://smtp.example.com:465"`, `"smtps://[2001:db8::1]"`). Bracketed IPv6 hosts without an explicit port automatically receive port 465 (smtps) or 587 (smtp). |
| `insecure` | Boolean | Allow connections without strict TLS validation. |

---

## 9. Plugins (`[plugin.<name>]`)
Each plugin has a configuration section. If no sections exist, all plugins default to enabled.
Common properties:
- `enabled`: Boolean to toggle the plugin.
- `upstream`: URI for backend services (used by CalDAV, CardDAV, ManageSieve).
- `options`: Map of plugin-specific settings.

### Core Plugins
| Plugin Name | Description | Key Settings |
| :--- | :--- | :--- |
| `base` | Core email functionality. | `enabled=true` |
| `caldav` | Calendar support. | `upstream`, `default_view` |
| `carddav` | Contacts support. | `upstream`, `default_view` |
| `managesieve` | Email filters and the auto-reply (Sieve `vacation`). | `upstream` |
| `gpg` | End-to-End Encryption. | `enabled=true` |

### Password Plugin (`[plugin.password]`)
Enables external HTTP API calls for user password changes.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | Boolean | `false` | Toggle the password change feature. |

#### `[plugin.password.options]`
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `endpoint` | String | None | API Endpoint URL (Supports `{email}`, `{local}`, `{domain}` variables). |
| `method` | String | `"POST"` | HTTP method. |
| `auth_type` | String | `"none"` | Authentication type (`"none"`, `"basic"`, `"bearer"`). |
| `username` | String | None | Basic auth username. |
| `password` | String | None | Basic auth password. |
| `token` | String | None | Bearer token. |
| `payload` | String | `"json"` | Payload format (`"json"`, `"form"`). |

#### `[plugin.password.options.payload_mapping]`
Maps internal variables (`username`, `local`, `domain`, `old_password`, `new_password`) to the expected JSON or Form fields in the HTTP request payload.

---

## 10. Branding (`[branding]`)
What a deployment changes about how ALPS looks. Without this section ALPS looks as it ships: the Alps theme and the edelweiss as its logo. These settings reach the browser inside the page itself, so the sign-in page is drawn branded from its first paint.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `default_theme` | String | `"alps"` | Colour theme for anyone who has not picked one: `"alps"`, `"migadu"`, `"nord"` or `"ocean"`. A theme picked in Settings stays that user's. Light or dark still follows each user's Theme Mode. |
| `logo` | String | The default theme's own logo, else the edelweiss | The logo in the edelweiss's place, on the sign-in page and in the header, and the icon of the browser tab and the home screen. A logo ALPS ships, by name: `"migadu"` (the Migadu mammoth, in the theme's colours), or `"alps"` for the edelweiss. Or a folder holding a favicon package: `favicon.svg`, `favicon-96x96.png`, `favicon.ico`, `apple-touch-icon.png`, `web-app-manifest-192x192.png` and `web-app-manifest-512x512.png`, the files RealFaviconGenerator writes, each at most 1 MiB. The page shows its `favicon.svg`. With `default_theme = "migadu"` the Migadu logo is shown unless this names another. |

ALPS refuses to start with a theme or built-in logo it does not know, or a favicon package missing a file.
