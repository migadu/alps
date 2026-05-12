# ALPS Configuration Reference

This document provides a comprehensive overview of all configuration options and sections available in ALPS, as defined in `config.example.toml`. The configuration file uses the TOML format.

---

## 1. Server Configuration (`[server]`)
This section contains core settings for the ALPS HTTP server, session management, and limits.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `addr` | String | `":1323"` | The address and port on which the server listens. |
| `debug` | Boolean | `true` | Enables debug mode. When `true`, logging level defaults to "debug" and console formatting is used. |
| `trusted_proxies`| Array | `[]` | Array of IPs/CIDR blocks to trust `X-Forwarded-For` and `X-Real-IP` headers from (e.g. `["127.0.0.1/32"]`). Must be set if behind a proxy. |
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
| `type` | String | `"imap"` | Mail provider protocol (`"imap"` or `"maildir"`). |
| `options` | Map | None | Provider-specific custom options. |

### `[provider.imap]`
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `server` | String | None | Direct URL to IMAP server (e.g. `"imaps://imap.example.com:993"`). |
| `insecure` | Boolean | `false` | Allow connections without strict TLS validation. |

### `[provider.maildir]`
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `path` | String | None | Path to the Maildir root directory. |
| `auth_passwd_file`| String | None | Path to the Dovecot-style authentication password file. |

### `[smtp]`
Configures the SMTP server used for sending emails.
| Option | Type | Description |
| :--- | :--- | :--- |
| `server` | String | SMTP server URI (e.g., `"smtps://smtp.example.com:465"`). |
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
