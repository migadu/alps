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

### 1.3 Attachment Limits
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `max_attachment_mib` | Integer | `32` | Max attachment size per composer instance. |
| `max_session_attachment_mib` | Integer | `128` | Max total attachment size uploaded across all composers in a single session. |
| `max_global_attachment_mib` | Integer | `1024` | Max total attachment size stored on the server across all users. |

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
| `default_domain` | String | None | Fallback domain assumed if a user logs in with a username lacking `@domain`. |
| `template` | String | None | Server URL pattern containing `%d` (domain), `%u` (local part), or `%n` (full username). Both domain and local part are strictly validated to prevent injection and SSRF. |
| `template_domains` | Array of Strings | `[]` | Domain allowlist for template routing. Required when `template` is set: the template builds a server address out of the login, so an unlisted domain never matches and routing falls through to the next rule. |
| `autodiscover` | Boolean | `false` | Automatically look up RFC 6186 DNS SRV records for IMAP servers. |
| `autodiscover_domains` | Array of Strings | `[]` | Domain allowlist for autodiscovery. Required when `autodiscover = true` to prevent unauthenticated SSRF relays. |
| `domains` | Table | None | Map of domain strings to provider configurations (e.g. `[provider.multi.domains."example.com"]`). |
| `smtp`, `carddav`, `caldav`, `managesieve` | String | None | Set *inside* a `domains` entry, a `routes` entry or `default`: the endpoint logins that land there should use. Each takes the same URL form as its global counterpart. Omitted, that backend defers to the matching global setting. |
| `password` | Table | None | A sub-table of a backend (`[provider.multi.routes.password]`), replacing `[plugin.password.options]` for logins that land there. Replaced whole, not merged: separate backends mean separate admin APIs and credentials. |
| `routes` | Array of Tables | None | Grouped routes specifying `domains` list and provider configuration. |
| `default` | Table | None | Fallback provider configuration table when no domain match occurs. |

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
| `managesieve` | Email filtering support. | `upstream` |
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
