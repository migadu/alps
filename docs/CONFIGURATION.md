# ALPS Configuration Reference

This document lists every configuration section and key ALPS reads, with its type, default and meaning. The configuration file uses the TOML format and is passed with `alps -config <path>`. [`config.example.toml`](../config.example.toml) is a commented example. The defaults below are what ALPS uses when a key is left out, and the example sets some keys to other values (for example `write_timeout_sec = 30`, and `output = "stderr"` and `format = "console"` in `[logging]`).

Keys and sections ALPS does not know are ignored without a warning, so a misspelt key (for example `write_timeout = 60`) silently keeps its default. Compare a configuration against `config.example.toml`. A known key with a value of the wrong type still stops startup, except inside a plugin's `options`, which are read leniently (see each option).

---

## 1. Server Configuration (`[server]`)
This section contains core settings for the ALPS HTTP server, session management, and limits.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `addr` | String | `":1323"` | The address and port on which the server listens. |
| `debug` | Boolean | `false` | Debug mode. It changes the defaults of `[logging] format` (to console) and `level` (to debug), so with neither set ALPS logs console text at debug level. It also turns on raw protocol traces that bypass `[logging]`: the IMAP exchange of every IMAP backend goes to stderr (OR-ed with `[provider.imap] debug`), and CalDAV and CardDAV requests and responses with their bodies and the ManageSieve exchanges go to stdout. With it, the HTTP server's TLS handshake errors are logged at debug level; without it they are dropped. The traces carry message content and other sensitive traffic, so keep `debug` off in production. |
| `trusted_proxies`| Array | `[]` | IPs or CIDR blocks of the reverse proxies in front of ALPS (e.g. `["127.0.0.1/32"]`). A bare IP means `/32` (IPv4) or `/128` (IPv6), blank entries are skipped, and any other entry that does not parse stops startup. Only from these peers does ALPS read `X-Forwarded-For` / `X-Real-IP` (the client address used by the rate limiter and the logs) and `X-Forwarded-Proto` / `X-Forwarded-Host` (the origin the CSRF check expects, and whether cookies are marked `Secure`). Must be set if behind a proxy — see [Running behind a reverse proxy](TLS.md#5-reverse-proxies). |
| `trusted_origins`| Array | `[]` | (Optional) Additional origins accepted by the CSRF check, in addition to the one ALPS derives from the request (e.g. `["https://webmail.example.com"]`). Use when the proxy cannot set `X-Forwarded-Proto`/`X-Forwarded-Host`. |
| `login_key` | String | None | (Optional) A Fernet key: 32 bytes, written in base64 (URL-safe or standard) or hex, as `Fernet.generate_key()` writes it (see `config.example.toml`). An invalid key stops startup (`invalid login key`). It encrypts the `alps_login_token` cookie, which restores a session after a restart of ALPS and is what "Stay signed in after closing the browser" keeps for 30 days. Linked accounts also require it: linking is refused without it, and the stored credentials of linked accounts are encrypted with it. Without it, no session survives a restart. Changing it ends every kept sign-in, and account links made under the old key stop working until the accounts are linked again. Every node serving the same hostname needs the same key. See [SESSIONS.md](SESSIONS.md). |
| `temp_dir` | String | `$TMPDIR`, else `/tmp` (Unix) | (Optional) Sets `TMPDIR` for the whole ALPS process at startup, so it moves everything that uses the system temp directory: attachment upload temp files (`multipart-*`) and the BIMI avatar cache (`alps-avatars`). ALPS does not create the directory at startup: create it beforehand, readable only by the user ALPS runs as. See [ATTACHMENTS.md](ATTACHMENTS.md). |
| `session_minutes` | Integer | `30` | The server's idle timeout, in minutes, for a session whose account has no Auto-logout time saved in its settings: a session that gets no request for that long ends with reason `idle`. The page does not read it. For such an account `GET /settings` answers `auto_logout` 30, so Settings shows 30 minutes, the page signs the user out after 30 minutes with no activity in any open tab, and the next save of any setting stores 30 for the account. A saved Auto-logout time (Never, 15, 30, 60, 120 or 360 minutes) replaces `session_minutes` and is capped only by `max_session_minutes`. 0 or a negative value means the default of 30. It is also the floor of `absolute_session_hours`. See [SESSIONS.md](SESSIONS.md#session-lifetime). |
| `max_session_minutes` | Integer | `0` (no cap) | The longest idle timeout a user can choose under Auto-logout: a longer choice is capped to it. "Never" becomes this value, or one year when it is unset. It does not bound a session's total life: that is `absolute_session_hours`. |
| `absolute_session_hours` | Integer | `168` (7 days) | The longest a session may live, however much it is used. It is floored at `session_minutes`. 0 or unset means the default, and any negative value (e.g. `-1`) disables the ceiling. A session that reaches it ends with reason `max-age`. |

### 1.1 HTTP Server Timeouts
These settings bound how long the server waits on a client, so slow or stalled connections do not hold its resources.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `read_timeout_sec` | Integer | `10` | Max time allowed to read the entire HTTP request, headers and body. An attachment upload that takes longer fails. |
| `write_timeout_sec` | Integer | `60` | Runs from the end of a request's headers to the end of its response, so it bounds an upload's body, the handling and the response together. The example config sets 30. For large attachments over slow links, raise both this and `read_timeout_sec`, or put a proxy in front that buffers request bodies. |
| `idle_timeout_sec` | Integer | `120` | Max time to wait for the next request when using HTTP keep-alive connections. |
| `imap_timeout_sec` | Integer | `30` | An alias of `[provider] timeout_sec`, used only when `[provider] type` is `"imap"` and `timeout_sec` is unset or 0. It is ignored for `"multi"` (set `[provider] timeout_sec` there) and for `"maildir"`. It bounds the TCP connect to the IMAP server (plus the TLS handshake for `imaps://`), and the wait for the server's answer to IDLE, DONE, ENABLE, NOTIFY, the STATUS after an IDLE, and the STATUS and UID lookup around an APPEND to a server without UIDPLUS. It does not bound LOGIN or ordinary commands. |
| `smtp_timeout_sec` | Integer | `30` | Bounds each SMTP command, and the wait for the server's answer after the message data, once the connection is open. Opening the connection (the TCP connect, and the TLS handshake for `smtps://`) has a fixed limit of 30 seconds of its own. For `smtp://`, the greeting, EHLO and STARTTLS run before this timeout is applied, under the SMTP library's 5-minute default. |

0 or a negative value in any of these keys means its default. The event stream (`GET /events`) lifts both the read and the write deadline for itself.

### 1.2 Session Limits
Caps the number of concurrent sessions, which bounds the memory the sessions hold.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `max_sessions` | Integer | `10000` | Max concurrent sessions on one node, across all users. At the limit a new sign-in is not refused: the least recently used session is ended with reason `evicted`. 0 keeps the default, and any negative value (e.g. `-1`) turns the cap off. |
| `max_sessions_per_user` | Integer | `10` | Max concurrent sessions of one user on one node. At the limit the user's least recently used session is ended with reason `evicted`. 0 keeps the default, and any negative value (e.g. `-1`) turns the cap off. |
| `background_connection` | Boolean | `true` | Each session opens a second mail connection, when first needed, for work the user is not waiting for (checks for new mail, sender verdicts, the search of Sent for a conversation's replies, draft saves, messages a conversation reads ahead), and closes it after a minute unused; the next such work opens it again and waits for its sign-in. A session opens no more than this one beside its own. A connection it gave up on mid-command (the browser went away) stays open until that command returns; meanwhile the session opens no background connection, but its own work does not wait for a busy one and opens its own connection beside it. If the mail server refuses the second one, for instance at its per-user connection limit, the work runs on the session's own connection and the session goes on; with `push_new_mail` on, the second connection stays open while a mail page is, which costs more than speed (see [Pushing new mail](#14-pushing-new-mail)). A session whose own connection is refused at the limit carries on with its background connection when the server says why with `[LIMIT]` (RFC 5530), as Sora does; a server that refuses with a bare `NO` ends the session. `false` keeps one connection per session. |
| `push_new_mail` | Boolean | `false` | While a mail page is open, its session waits on its background connection for the mail server's news of the Inbox (IMAP IDLE) and pushes it to the page over an event stream (`GET /events`, Server-Sent Events), which then checks at once rather than at its next check. Pushed are messages that arrive in the Inbox or leave it; flags, and the other folders, come with the checks, which keep running at the user's interval. One tab of a browser holds the stream and tells the others. Needs `background_connection`, a mail server with IDLE, and a browser that offers `navigator.locks`, which browsers do only in a secure context: a deployment served over plain HTTP, other than on `localhost`, gets no push. See [Pushing new mail](#14-pushing-new-mail) for what it costs and what a reverse proxy must allow. |
| `condstore` | Boolean | `false` | Each mail connection asks the server to number the changes to its messages (IMAP CONDSTORE, RFC 7162), and a page of a folder whose messages are all still there has only the flags that changed read again, so a star or a read in another client is listed at the next check. A server that does not list CONDSTORE is used as with `condstore` off. See [Numbered changes](#15-numbered-changes). |
| `push_subscribed_folders` | Boolean | `false` | With `push_new_mail` on, the session also asks the mail server, on the same background connection, for the news of the subscribed folders (IMAP NOTIFY, RFC 5465), and pushes it as it pushes the Inbox's: a folder on screen is checked at once, and the sidebar's counts of the others follow. Pushed are messages that arrive in a folder or leave it, as for the Inbox; flags, the folders not subscribed and searches come with the checks, which run a third as often while the stream carries the folders' news (every 15 minutes at the default 5). Needs a mail server with NOTIFY: without it, or where it refuses, the Inbox alone is pushed. No connection is added; the cost is the mail server's (see [Pushing new mail](#14-pushing-new-mail)). |

### 1.3 Attachment Limits
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `max_attachment_mib` | Integer | `32` | Max attachment size per composer instance. |
| `max_session_attachment_mib` | Integer | `128` | Max total attachment size uploaded across all composers in a single session. |
| `max_global_attachment_mib` | Integer | `1024` | Max total attachment size stored on the server across all users. |

0 or a negative value means the default, so none of these limits can be turned off. See [ATTACHMENTS.md](ATTACHMENTS.md) for how they are enforced.

### 1.4 Pushing new mail
`push_new_mail` is off by default, because of what it costs and what it asks of the network in front of ALPS:

- **Two IMAP connections for every open mail page.** Without push, a session's background connection closes after a minute unused, so a session mostly holds one. With push, every session with a mail page open holds two for as long as the page is open: its own and the background one, in IDLE on the Inbox. Every session connects from ALPS's one address, and mail servers count connections per user and address: Sora's example configuration allows `max_connections_per_user_per_ip = 5` (8 through its proxy), and `max_connections_per_ip = 200`, which, all ALPS's sessions coming from one address, is about 100 open mail pages across all users. So with push and the per-user limit, a user with mail open in two browsers holds four connections; a third signs in on the fifth and gets no push, its second connection refused; and a sign-in from a fourth is refused for the limit. ALPS gives way within a session (a session refused a connection of its own at the limit takes over its background connection), not across the sessions of an account: raise the per-user limits for ALPS's address, or keep push off.
- **The mail server works for every open page.** The server watches the Inbox for each connection in IDLE: Sora re-checks a mailbox in IDLE every 15 seconds (`idlePollInterval` in Sora's `server/imap/idle.go`), more work for each open session than the one status check every 5 minutes that a page makes by default. IDLE is begun again every 25 minutes: RFC 2177 asks clients to begin it again at least every 29, as a server may log off a client idle for 30 (RFC 3501 §5.4).
- **With `push_subscribed_folders`, the mail server watches every subscribed folder of every open page.** Sora's NOTIFY watch reads, every 15 seconds for each connection, the account's folder list and the counts of each subscribed folder (`notifyPollInterval` in Sora's `server/imap/notify.go`), more than the IDLE's look at the Inbox. It answers the NOTIFY with the counts of each folder it watches, once for each background connection. It tells of a flag set or cleared in a folder too, with the folder's counts unchanged, which ALPS passes over. When more than 100 folders changed between two looks it stops telling (`NOTIFICATIONOVERFLOW`); ALPS asks again at once, and the pages check, as when the stream comes up. A folder's first STATUS after the connection leaves it is checked against its last trustworthy UIDNEXT. If selected changes made that value unknown, ALPS checks conservatively once more; this can repeat a refresh, but does not miss an arrival balanced by an expunge.
- **The event stream is a long-lived HTTP request.** It stays open for as long as the page. A reverse proxy must not buffer it: ALPS answers with `Cache-Control: no-cache` and `X-Accel-Buffering: no`, which nginx honours; other proxies may need buffering turned off for `/events`. It must let the request stay open: ALPS writes a heartbeat (a comment line) every 20 seconds, which keeps it within the usual idle timeouts (nginx `proxy_read_timeout`, 60 s by default; HAProxy `timeout server`). ALPS's own `read_timeout_sec` and `write_timeout_sec` do not apply to it.
- **In a cluster the stream must reach the node holding the session**, as every request of the session already must, since that node holds its IMAP connections.
- **Only in a secure context.** One tab of a browser holds the stream, chosen with `navigator.locks`, which browsers offer only over HTTPS and on `localhost`: elsewhere no tab opens one, rather than every tab (browsers allow six HTTP/1.1 connections to a host, and a stream per tab would leave the tabs waiting for their own requests).

A failed or refused IDLE never signs anyone out: the pages check at their interval until it is back. It is tried again after a minute, then twice as long after each failure in a row, up to about half an hour.

### 1.5 Numbered changes
A session keeps the pages of a folder it has listed while the folder's counts (messages, unread, UIDVALIDITY and UIDNEXT) stay as they were read. Without `condstore`, a flag changed in another client that leaves the unread count as it was, such as a star, is not listed until the page expires (`ttl_minutes`); one that moves it, such as a message read, has every page of the folder read again in full.

With `condstore` on:

- **Each connection asks for it once.** Straight after sign-in, where the server lists CONDSTORE, ALPS sends `ENABLE CONDSTORE` (or, on a server without ENABLE, lets the first `STATUS` asking for `HIGHESTMODSEQ` turn it on). The server's own capability list is read: `IMAP4rev2` alone is not taken for CONDSTORE, which RFC 9051 does not include. QRESYNC is not turned on, even where the server lists it: under it the server reports messages taken out of the selected folder with `VANISHED`, which the IMAP client ALPS uses does not count down its messages for.
- **The counts carry the latest change.** The `STATUS` and `LIST-STATUS` ALPS sends ask for `HIGHESTMODSEQ` too, which costs no extra round trip, and `GET /mailboxes/{mbox}/status` answers it as `highestmodseq`. Change numbers are decimal strings in JSON, preserving the full 63-bit IMAP range through the browser; counts and UIDs remain numbers.
- **Only the flags are read again.** When the folder holds the messages a page was read with (the same UIDVALIDITY, as many messages, the same UIDNEXT) and only the change number moved, the next listing of the page sends one `UID FETCH <the page's messages> (FLAGS) (CHANGEDSINCE <the page's number>)` and lays what it answers over the page, instead of reading the page again. A read or a mark as unread keeps the folder's pages and the folder list; only the conversations held of the folder are dropped.
- **The pages notice.** A page reads its listing again when the change number moved, as it does when a count moves.
- **No STATUS for the selected folder while it is unchanged.** RFC 9051 asks a client not to send `STATUS` for the mailbox it has selected. A check of the folder selected on the connection it runs on, often the Inbox on the background connection, sends a `NOOP` and, in the same round trip, `UID FETCH 1:* (FLAGS) (CHANGEDSINCE <the number last read>)`. When the server tells of no message arriving or going and the `FETCH` answers none, the status read last stands; otherwise it is read with `STATUS`, which costs a second round trip. A flag change the server tells of on the `NOOP` is not relied on alone: the IMAP client may hand it on only after the `NOOP` has been answered, so the `FETCH` is what says it. `GET /mailboxes/{mbox}/status` with `with=` asks for its folders together: the selected one among them is checked this way, and the others with `STATUS`, all sent before the first answer is awaited.

What it costs: one round trip as each connection signs in, the session's own and its background one. A change made in ALPS moves the number too, so the check after it reads the page again, from the session and with that one `FETCH`.

---

## 2. Rate Limiting (`[server.rate_limit]`)
Limits how often passwords and recovery codes can be tried. The limits apply to sign-in and to every other check of an account's password or recovery code: the current password asked for by a password change and by changes to the second factor, recovery-code sign-ins, and the password given when linking another account. Each node counts on its own unless `[cluster]` is enabled. See [RATELIMIT.md](RATELIMIT.md) for what counts as an attempt and how lockouts work.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | Boolean | `true` | Enables or disables the rate limiter. Only `enabled = false` turns limiting off. |
| `ip_requests_per_minute` | Integer | `5` | Max attempts from one IP address in the last minute. Every recorded attempt counts: credentials accepted, credentials refused, or ended in an error (such as a mail server that cannot be reached). Reaching it refuses the address's further attempts with a wait of 60 seconds; it locks nothing. |
| `ip_requests_per_hour` | Integer | `20` | Max attempts from one IP address in the last hour whose credentials were refused. Successful attempts and attempts that ended in an error do not count, and a success from the address clears the count. Once the count has reached the limit, the address's next attempt is refused and locks the address out for `lockout_minutes`. |
| `username_fails_per_quarter`| Integer | `5` | Max refused attempts for one account in the last 15 minutes, from any address. Reaching it refuses the account's further attempts with a fixed wait of 15 minutes; it locks nothing. |
| `username_fails_per_hour` | Integer | `10` | Max refused attempts for one account in the last hour. Once it is reached, the account's next attempt is refused and locks the account out for `lockout_minutes`. A success for the account clears its failures and lifts its lockout. |
| `global_requests_per_second`| Integer | `100` | Max attempts recorded in the last second across all accounts and addresses: successes, refused credentials and errors alike, and in a cluster the attempts the other nodes report as well. Reaching it refuses every protected request with a wait of 1 second. |
| `lockout_minutes` | Integer | `15` | How long, in minutes, an address or an account stays locked out after reaching an hourly limit. |

Requests the limiter refuses are not counted in any tier, so retrying during a wait or a lockout does not extend it. A value of 0 or below in any of the integer keys, `lockout_minutes` included, keeps that key's default, so no single tier can be turned off.

---

## 3. Caching (`[cache]`)
Controls the application-level data cache.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | Boolean | `true` | Enables or disables caching. |
| `ttl_minutes` | Integer | `10` | Time-to-live for cached items before they expire. |
| `max_part_kib` | Integer | `1024` | The largest message part, in KiB, kept in the cache. A larger part (a large attachment, most often) is read from the mail server again each time it is asked for, rather than held in memory. The browser keeps its own copy, which it revalidates without the part being read again. |

0 or a negative value in `ttl_minutes` or `max_part_kib` means the default.

---

## 4. Logging (`[logging]`)
Configures output destination, format, and verbosity.

Each key has its default whether or not the others are set: an omitted `output` is stdout, an omitted `format` is console with `[server] debug` on and JSON otherwise, and an omitted `level` is debug with `debug` on and info otherwise. With no `[logging]` keys at all, ALPS therefore logs to stdout: JSON at `info`, or console text at `debug` when `[server] debug` is on.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `output` | String | `"stdout"` | Destination for log output: `"stdout"`, `"stderr"`, `"syslog"` (facility daemon, tag `alps`), or a file path like `"/var/log/alps.log"`. A file is created with mode 0644 in a directory that must already exist. A file that cannot be opened, or a syslog that cannot be reached, falls back to stderr. With a file path, ALPS reopens the file on `SIGHUP`, so a rotation tool such as newsyslog or logrotate can signal it after moving the file aside (see [OPERATIONS.md](OPERATIONS.md)). |
| `format` | String | `"json"`, or `"console"` when `[server] debug = true` | Log format. Exactly `"json"` gives JSON lines, for production. Any other value gives console text (key=value). |
| `level` | String | `"info"`, or `"debug"` when `[server] debug = true` | Minimum log severity: `"debug"`, `"info"`, `"warn"` (or `"warning"`), or `"error"`, in any case. An unknown value means info. |
| `access` | Boolean | `true` | Logs one `request` line per HTTP request at `info`: method, path (without the query string), status, bytes, `duration_ms`, client `ip` and, once signed in, `user` and `session`. |

What is logged about users, whatever `access` says:

| Message | Level | Fields |
| :--- | :--- | :--- |
| `sign-in` | info | `user`, `ip`, `session`, `2fa`, `remember`, `restored`, `agent` |
| `sign-in awaits second factor` | info | `user`, `ip`, `session` |
| `sign-in failed` | warn | `user`, `ip`, `reason` (`bad credentials`, `rate limited`, `connection limit`, `second factor refused`, `recovery code refused`, `error`), plus `agent`, `detail`, `session` or `error` |
| `session restored` | info | `user`, `ip`, `session` — a browser signed back in with its login token, e.g. after a restart |
| `session not restored` | warn | `user`, `ip`, `error` — a login token could not restore a session because the mail server failed (not because the password was refused) |
| `account switch` | info | `user`, `to`, `ip`, `session` (the new one), `2fa_trusted` |
| `account switch awaits second factor` | info | `user`, `to`, `ip`, `session` (the new one) |
| `session ended` | info | `user`, `session`, `duration`, `reason` (`sign-out`, `idle`, `max-age`, `switched`, `evicted`, `auth-error`, `mail-server-unavailable`) |

A `sign-in` completed with a second factor also carries `factor` (`security key` or `recovery code`, the latter with `recovery_codes_left`).

`session` is a short hash of the session token, which ties a session's lines together; the token itself is never logged. `ip` is the peer's address, or the client address forwarded by a proxy listed in `trusted_proxies`.

Not everything goes through `[logging]`. The protocol traces that `[server] debug` turns on go to stderr (IMAP) and stdout (CalDAV, CardDAV and ManageSieve), and the errors found before the log is opened go to stderr. Everything else follows `output`, `format` and `level`: the TLS manager's and the cluster's lines, the IMAP provider's warnings, and the notes the IMAP provider logs at debug level when debug is on.

---

## 5. WebAuthn (`[webauthn]`)
Settings required for WebAuthn (Two-Factor Authentication).

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `rpid` | String | `"localhost"` | Relying Party ID: the browser-facing hostname (e.g., `"webmail.example.com"`). When it is unset, ALPS warns at startup that 2FA works only from localhost. |
| `display_name` | String | `"Alps Webmail"` | The application name displayed during authentication. |
| `origins` | Array | `["http://localhost:1323", "http://localhost:5173"]` | Allowed origins (e.g., `["https://webmail.example.com"]`). Must include scheme, no trailing slash. |

Each key falls back to its default on its own, so setting `rpid` without `origins` keeps the localhost origins. Set both to the browser-facing hostname for any real deployment; neither can be derived from a reverse proxy's forwarded headers. See [WEBAUTHN.md](WEBAUTHN.md).

---

## 6. TLS Configuration (`[tls]`)
Handles Transport Layer Security for secure connections.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | Boolean | `false` | Enables TLS termination in ALPS. Leave it off behind a TLS-terminating reverse proxy. |
| `provider` | String | None (required when enabled) | Exactly `"file"` (manual certs) or `"letsencrypt"` (automatic ACME). Any other value, or none, stops startup. |
| `cert_file` | String | None | Path to the TLS certificate chain (required if provider is `"file"`). |
| `key_file` | String | None | Path to the TLS private key (required if provider is `"file"`). |

With `"file"`, the pair is read once at startup: a renewed certificate takes effect after a restart (`SIGHUP` only reopens the log file). Both providers accept TLS 1.2 and later. See [TLS.md](TLS.md).

### 6.1 Let's Encrypt (`[tls.letsencrypt]`)
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `email` | String | None (required) | Email address for ACME registration. Start-up fails without it. |
| `domains` | Array | None (required) | Domains to obtain certificates for; at least one is required. Only the listed domains get certificates, and a handshake naming an IP address is refused. |
| `default_domain` | String | The first entry of `domains` | (Optional) Domain used for connections that send no SNI. |
| `storage_provider`| String | `"s3"` | `"s3"`: certificates are shared through the `[tls.letsencrypt.s3]` bucket, with a local copy in `cache_dir`. The bucket must be reachable at startup, or ALPS does not start. `"file"`: `cache_dir` only, for a single node. Any other value stops startup. Because the default is `"s3"`, a single node without an S3 bucket must set `storage_provider = "file"`. With `[cluster]` enabled it must be `"s3"`. |
| `cache_dir` | String | `"cert-cache"`| Local filesystem cache directory for certificates. A relative path is relative to the working directory of the ALPS process. |
| `sync_interval_minutes`| Integer | `5` | How often a node uploads to S3 the certificates it could store only in `cache_dir` while S3 was failing. A check with nothing waiting for upload does nothing, so this interval is not how a node learns of a renewed certificate. A node looks for a certificate in S3 when it loads the certificate into memory (with no copy in `cache_dir`, or a copy already inside its renewal window) and when the certificate's renewal comes due; a copy inside its renewal window is compared with S3 at most once an hour (see [TLS.md](TLS.md#s3-storage-multi-node--cluster)). Applies only to `"s3"`; zero or a negative value means 5. |
| `acme_http_addr` | String | `":80"` | Address for the HTTP-01 challenge handler. Every node runs it, the followers of a cluster included. It answers other requests with 404 and does not redirect to HTTPS. |
| `directory_url` | String | `""` (Let's Encrypt production) | An ACME directory URL, such as Let's Encrypt staging. Any other URL than production gets its own `cache_dir`, suffixed with a hash of the URL, and its own S3 folder under `prefix`, named after the same hash (see [TLS.md](TLS.md#staging-directory-and-rsa-certificates)), so its certificates stay apart from production ones. |
| `warm_rsa_certs` | Boolean | `false` | Also pre-issue RSA certificates beside the ECDSA ones. |

### 6.2 Let's Encrypt S3 Storage (`[tls.letsencrypt.s3]`)
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `endpoint` | String | None (AWS S3) | S3-compatible endpoint (e.g., `"minio.example.com:9000"`). An endpoint without a scheme gets `https://`, and requests to it use path-style addressing. Leave it unset for AWS S3. |
| `bucket` | String | None | Name of the bucket to store certs. It is checked at startup, and ALPS does not start if it cannot be reached. |
| `access_key` | String | None | (Optional) S3 access key. Used only when `secret_key` is set too; otherwise the AWS default credential chain applies (environment, shared configuration, instance role). |
| `secret_key` | String | None | (Optional) S3 secret key. See `access_key`. |
| `region` | String | `us-east-1` with an `endpoint` | (Optional) S3 region. Without an `endpoint`, the AWS SDK resolves it on its own. |
| `prefix` | String | None | (Optional) Key prefix for storing objects (e.g., `"alps/"`). |

---

## 7. Cluster (`[cluster]`)
For any deployment of several ALPS nodes, not only one using Let's Encrypt. The cluster elects the leader that keeps the shared Let's Encrypt certificates issued and renewed, shares sign-in rate-limit events between the nodes (without it each node counts alone), and tells the other nodes when an account enrols a security key. With Let's Encrypt it requires `storage_provider = "s3"`. If the cluster cannot start, ALPS exits rather than running as a single node. In a cluster, recovery codes are offered only to accounts whose 2FA record is kept in the mail server's IMAP METADATA. See [CLUSTER.md](CLUSTER.md), [RATELIMIT.md](RATELIMIT.md) and [WEBAUTHN_COORDINATION.md](WEBAUTHN_COORDINATION.md).

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | Boolean | `false` | Enables cluster gossip protocol. |
| `node_id` | String | The host name | Must be unique per node. The member with the lexicographically smallest `node_id` is the leader, and that node takes the leadership whenever it rejoins. With Let's Encrypt, the leader issues and renews every domain's certificate ahead of need, and only the certificates the leader obtains are stored, in S3 and `cache_dir`; the followers read them from there. A follower places an ACME order of its own when it finds no certificate, or when its renewal comes due before the leader's renewed certificate is in S3. A certificate a follower obtains on a miss is served from memory and not stored; one it obtains at renewal is dropped, and the renewal is tried again 30 to 60 minutes later. Changing a node's `node_id` can move the leadership, so keep it stable. |
| `bind` | String | `"0.0.0.0"`| The IPv4 address to listen on for gossip, optionally written as `"IPv4:port"`, whose port then wins over `port`. With `0.0.0.0` the node advertises an automatically detected private IP; with a specific address it binds to and advertises that address. It is not an interface name, and host names and IPv6 addresses are not supported. |
| `port` | Integer | `7946` | Gossip protocol port, used over TCP and UDP. |
| `secret_key` | String | None (required) | Key that encrypts and authenticates the gossip: standard base64 that decodes to exactly 32 bytes (e.g. `openssl rand -base64 32`), the same on every node. Required unless `allow_insecure = true`. The environment variable `CLUSTER_SECRET_KEY`, when set, takes precedence over this value. |
| `allow_insecure` | Boolean | `false` | Permits gossip without `secret_key`, unencrypted and unauthenticated, for a fully trusted network only. |
| `peers` | Array | None | List of initial peer addresses (e.g., `["node2:7946", "node3:7946"]`). |

---

## 8. Provider & Servers
Configures the backend mail services.

### `[provider]`

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` | String | `"imap"` | Mail provider protocol (`"imap"`, `"maildir"`, or `"multi"`). |
| `timeout_sec` | Integer | `30` | Timeout of the IMAP backends, in seconds: the TCP connect (plus the TLS handshake for `imaps://`), and the wait for the server's answer to IDLE, DONE, ENABLE, NOTIFY, the STATUS after an IDLE, and the STATUS and UID lookup around an APPEND to a server without UIDPLUS. It does not bound LOGIN or ordinary commands. With `multi` it applies to every backend; `maildir` ignores it. For the `imap` provider, `[server] imap_timeout_sec` is used in its place when `timeout_sec` is unset or 0. |

A `[provider.<type>]` section matching `type` is required.

### `[provider.imap]`
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `server` | String | None | Direct URL to IMAP server (e.g. `"imaps://imap.example.com:993"`). Required, and must carry a scheme: `imaps://` (implicit TLS, default port 993), `imap://` (STARTTLS required, default port 143) or `imap+insecure://` (implies `insecure`). |
| `insecure` | Boolean | `false` | Allows a plaintext connection, with no TLS and no STARTTLS, on `imap://`, the same as the `imap+insecure://` scheme. The password then crosses the network in clear text. It has no effect on `imaps://`. It does not relax certificate verification, which is never turned off for IMAP: a server with a private CA needs that CA in the host's trust store (see [Environment variables](#11-environment-variables)). |
| `debug` | Boolean | `false` | Log the IMAP protocol exchange for this provider to stderr. OR-ed with `[server] debug`. Dumps message content and other sensitive traffic, so keep it off in production. |
| `authserv_ids` | Array | `[]` | Authserv-ids of the receiving mail servers whose `Authentication-Results` field is trusted for a message's verdict (e.g. `["mx.example.com"]`). Matched in any case. That verdict drives the sender's BIMI logo, the sender badge (verified on a DMARC or BIMI pass, failed on a failing DMARC, DKIM or SPF result with no pass) and the written warning shown above a message that failed. Empty means the topmost field is read, so a message the server did not stamp is judged by a field its sender wrote. |

### `[provider.maildir]`
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `auth_passwd_file`| String | None | Path to the Dovecot-style authentication password file. **Required**; startup fails without it. |
| `path` | String | None | (Optional) A pattern for each user's own maildir, not a root shared by all users. ALPS replaces `%u` (the local part, or the whole login when it has no `@`), `%d` (the domain, empty when the login has no `@`) and `%n` (the whole login), and the result is the user's maildir itself: the directory holding `cur`, `new`, `tmp`, the `.Folder` directories and `alps_store.json`. ALPS adds nothing to it, so include `%n`, or `%u` (together with `%d` when logins span several domains); otherwise several accounts share one maildir. When unset, each user's maildir is `<home>/Maildir`, with `<home>` from the user's entry in `auth_passwd_file`. See [MAILDIR.md](MAILDIR.md#the-maildir-path). |

### `[provider.multi]`
Routes incoming user logins across multiple email backends. Domain resolution priority:
1. **Explicit Domain Mapping**: `[provider.multi.domains."example.com"]` (any provider type like `imap` or `maildir`).
2. **Grouped Routes**: `[[provider.multi.routes]]` matching the domain from `domains = ["d1.com", "d2.com"]`.
3. **Template Pattern**: `template = "imaps://mail.%d:993"` where `%d` is replaced with the user's domain (also supports `%u` for the local part and `%n` for the whole login, checked as described under `template` below).
4. **RFC 6186 DNS Autodiscovery**: `autodiscover = true` queries `_imaps._tcp.<domain>` then `_imap._tcp.<domain>` SRV records for domains listed in `autodiscover_domains`. A target that resolves to a private, loopback or other non-public address is skipped (see the allowlist paragraph below).
5. **Default Fallback Provider**: `[provider.multi.default]` used if no previous rules match. When the template or autodiscovery applies to a domain, a failure there (a server that cannot be reached, a lookup that finds no usable record) ends the sign-in: routing does not go on to `default`.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `default_domain` | String | None | Fallback domain assumed if a user logs in with a username lacking `@domain`. The user still signs in with the bare username, but `username@default_domain` is the user's address: messages are sent from it and meetings are organized from it. |
| `template` | String | None | Server URL pattern containing `%d` (domain), `%u` (local part), or `%n` (full username). The domain must be a host name of dot-separated labels of lowercase letters, digits and inner hyphens (the login's domain is lowercased first). When the template holds `%u` or `%n`, the local part must be 1 to 128 ASCII characters with no space, control character or any of `: / ? # @ [ ] \ %`. A login that fails either check is refused as wrong credentials. |
| `template_domains` | Array of Strings | `[]` | Domain allowlist for template routing. Required when `template` is set: the template builds a server address out of the login, so an unlisted domain never matches and routing falls through to the next rule. |
| `autodiscover` | Boolean | `false` | Automatically look up RFC 6186 DNS SRV records for IMAP servers. |
| `autodiscover_domains` | Array of Strings | `[]` | Domain allowlist for autodiscovery. Required when `autodiscover = true`: the lookup lets a domain's DNS choose the server ALPS connects to, so an unlisted domain is never looked up and routing falls through to `default`. |
| `domains` | Table | None | Map of domain strings to provider configurations (e.g. `[provider.multi.domains."example.com"]`). |
| `smtp`, `carddav`, `caldav`, `managesieve` | String | None | Set *inside* a `domains` entry, a `routes` entry or `default`: the endpoint logins that land there should use. Each takes the same URL form as its global counterpart. Omitted, that backend defers to the matching global setting. |
| `password` | Table | None | A sub-table of a backend (`[provider.multi.routes.password]`), replacing `[plugin.password.options]` for logins that land there. Replaced whole, not merged: separate backends mean separate admin APIs and credentials. |
| `routes` | Array of Tables | None | Grouped routes specifying `domains` list and provider configuration. |
| `default` | Table | None | Fallback provider configuration table when no domain match occurs. |

Each `[provider.multi.domains."d"]`, each `[[provider.multi.routes]]` entry and `[provider.multi.default]` takes `type` (default `"imap"`) plus that provider's own keys: `server`, `insecure`, `debug` and `authserv_ids` for `imap`; `auth_passwd_file` and `path` for `maildir`. They also take the `smtp`, `carddav`, `caldav` and `managesieve` endpoints and a `password` sub-table. A `routes` entry without `domains`, or a `multi` section with none of `domains`, `routes`, `template`, `autodiscover` and `default`, stops startup. Backends reached through `template` or `autodiscover` are always IMAP, with no `authserv_ids`, `insecure` or `debug` of their own (only `[server] debug` applies), and the template must produce an `imaps://`, `imap://` or `imap+insecure://` URL. Each ALPS process caches the autodiscovery result for a domain: an answer for 15 minutes, a failed lookup for 30 seconds. `[provider] timeout_sec` applies to every backend.

A single IMAP server whose users sign in with bare usernames can be set up this way too, with only `default_domain` and a `[provider.multi.default]` naming the server, so that users send from an address rather than from their username. With the other providers a bare username stays the From address. The calendar then organizes from the first address the CalDAV server lists for the user (`calendar-user-address-set`), when it lists one.

Every backend a login touches follows the domain that chose its mail store, so a user does not read from one host and then send, sync contacts or calendars, edit filters or change a password somewhere unrelated. A backend that names no endpoint for a service defers to that service's global setting rather than borrowing one from an unrelated backend; domains reached by `template` or `autodiscover` have no entry of their own and fall to `default`, then to the global setting. With `type = "multi"`, the `caldav`, `carddav` and `managesieve` plugins load without a global `server` when some backend names their endpoint, provided `enabled` lets them through (see [Plugins](#9-plugins-pluginname)). A login whose backend names no endpoint for a service, with no global server, gets that service as not configured. `[smtp] server` stays required even when every backend names its own `smtp`.

The CalDAV endpoint named here must carry a scheme. Start-up can fall back to DNS discovery for the global `[plugin.caldav] server`, but a login must not cost a discovery round trip, so a per-backend endpoint without a scheme is refused and the global one stands.

Both allowlists accept an entry `"*"`, which matches every domain. With it, any login chooses the server ALPS connects to, through the template or its domain's DNS, so use it only on a deployment that untrusted users cannot reach. Loopback, private, link-local, multicast, broadcast and unspecified addresses, `0.0.0.0/8` and CGNAT (`100.64.0.0/10`) stay refused either way, and the check is made again against the address each connection reaches. A domain not on a list misses that rule, and routing goes on to the next one.


### `[smtp]`
Configures the SMTP server used for sending emails.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `server` | String | None (required) | SMTP server URI (e.g., `"smtps://smtp.example.com:465"`, `"smtps://[2001:db8::1]"`). Start-up fails without it, even when every `[provider.multi]` backend names its own `smtp`. It must carry a scheme: `smtps://` (implicit TLS, default port 465), `smtp://` (STARTTLS required, default port 587) or `smtp+insecure://` (plaintext, default port 587). Any host without a port, bracketed IPv6 included, gets these defaults. |
| `insecure` | Boolean | `false` | Allows a plaintext connection, with no TLS and no STARTTLS, on `smtp://`, the same as the `smtp+insecure://` scheme. The password then crosses the network in clear text. It has no effect on `smtps://`. Certificate verification is never turned off for SMTP. |

See [MAIL_SERVER.md](MAIL_SERVER.md) for what ALPS needs from the IMAP and SMTP servers.

---

## 9. Plugins (`[plugin.<name>]`)
Each plugin has a configuration section. Common properties:
- `enabled`: Boolean. It selects which plugins load (see below), and the `password` plugin loads only with `enabled = true`.
- `server`: URL of the backend service (used by CalDAV, CardDAV, ManageSieve).
- `options`: Map of plugin-specific settings.

Which plugins load is decided at startup in two steps:
1. **Each plugin is set up.** `base` and `gpg` always are, and `password` only when its section sets `enabled = true`. `caldav` and `carddav` are set up only when their section sets `server` or `enabled = true`, or a `[provider.multi]` backend names their endpoint. `managesieve` is set up only when its section sets `server` or a backend names a `managesieve` endpoint; `enabled = true` alone leaves it out, and startup logs `ManageSieve enabled without a server or routed endpoint; plugin disabled`. A `server` is parsed in this step, whether or not step 2 keeps the plugin, so one that does not parse stops startup either way (a `caldav` bare host whose DNS discovery fails leaves the plugin out instead, unless a backend names a `caldav` endpoint).
2. **The set-up plugins are filtered by `enabled`.** `base` always loads, whatever its section says. A plugin whose section does not set `enabled = true`, because it says `enabled = false` or leaves `enabled` out, does not load. A plugin without a section loads only while no section sets `enabled = true`: as soon as one does, those sections form an allow-list, and only `base` and the plugins whose own sections set `enabled = true` load. A plugin dropped here is logged as `Plugin "<name>" is disabled`.

Then:
- A `caldav` or `carddav` plugin loaded without a `server` (and without a `multi` endpoint for the login) fails each request as not configured, and so does `managesieve` for a login whose backend names no endpoint when another backend's endpoint loaded it. `config.example.toml` enables all three with their `server` lines commented out, so CalDAV and CardDAV load without an endpoint and ManageSieve stays off.
- The `password` plugin loads only with `[plugin.password] enabled = true`, which also turns on the allow-list of step 2, so a configuration with password change sets `enabled = true` for every other plugin it wants as well. Without it, Settings offers no Password page.

### Core Plugins
| Plugin Name | Description | Key Settings |
| :--- | :--- | :--- |
| `base` | Core email functionality. | None |
| `caldav` | Calendar support. | `server`, `options.week_start` |
| `carddav` | Contacts support. | `server` |
| `managesieve` | Email filters and the auto-reply (Sieve `vacation`). | `server` |
| `gpg` | End-to-End Encryption. | None |
| `password` | Password change, see below. | `enabled`, `options` |

### Endpoint Schemes (`server`)
- **caldav**: `caldavs://` or `https://` (HTTPS); `caldav+insecure://`, `http+insecure://` or `http://` (HTTP). A bare host name is resolved by CalDAV DNS discovery at startup, and if discovery fails the plugin is left out, with a log line, unless a `multi` backend names a `caldav` endpoint. A per-backend endpoint under `multi` must carry a scheme.
- **carddav**: `carddavs://` or `https://` (HTTPS); `carddav+insecure://`, `http+insecure://` or `http://` (HTTP). A scheme is required: a bare host stops startup.
- **managesieve**: `managesieves://`, `managesieve://`, `sieve://` or a bare host name all open a plain TCP connection (default port 4190) and require STARTTLS before authenticating; `managesieves://` is not implicit TLS. `managesieve+insecure://` or `sieve+insecure://` allow a connection without TLS, and skip certificate verification when STARTTLS is used. Any other scheme stops startup.

See [CDAV.md](CDAV.md) for contacts and calendars and [FILTERS.md](FILTERS.md) for filters and the auto-reply.

### CalDAV Options (`[plugin.caldav] options`)
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `week_start` | Integer or String | `1` | First day of the week for users who have not picked one in Settings: `0` (Sunday) or `1` (Monday), also as `"0"`, `"1"`, `"sunday"`, `"sun"`, `"monday"` or `"mon"` in any case. Any other value means 1. `first_day_of_week` is accepted as an alias when `week_start` is absent. |

No other plugin reads `options`, apart from `password`.

### Password Plugin (`[plugin.password]`)
Changes user passwords through an external HTTP API, or a command run on the ALPS host.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | Boolean | `false` | Toggle the password change feature. Without it, the plugin does not load: Settings has no Password page and there is no `/password/change` route. |

With `enabled = true`, a global options block that cannot run stops startup. A per-domain block (the `password` sub-table of a `[provider.multi]` backend) is checked when it is used. The HTTP request and the command each time out after 15 seconds. See [PASSWORD_CHANGE.md](PASSWORD_CHANGE.md).

#### `[plugin.password.options]`
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `endpoint` | String | None | API Endpoint URL (supports `{email}`, `{local}` and `{domain}`, described below, each escaped as a URL path segment). Set `endpoint` or `command`, not both. |
| `method` | String | `"POST"` | HTTP method, upper-cased. |
| `auth_type` | String | `"none"` | Authentication type (`"none"`, `"basic"`, `"bearer"`). An unknown value means none. |
| `username` | String | None | Basic auth username. |
| `password` | String | None | Basic auth password. |
| `token` | String | None | Bearer token. |
| `payload` | String | `"json"` | Payload format (`"json"`, `"form"`). `"form"` is matched in any case, and any other value means JSON. |
| `command` | Array | None | A program and its arguments on a Unix host, run in place of the HTTP request (supports `{email}`, `{local}`, `{domain}`). The program must be an absolute path to an executable file, with no placeholder in it. `{old_password}` and `{new_password}` are refused in the arguments. Cancellation and timeout stop its process group. See [Running a Command](PASSWORD_CHANGE.md#running-a-command). |
| `stdin` | String | `"{new_password}\n"` | What the command reads on standard input, the only place the passwords may appear (supports `{old_password}`, `{new_password}` and the above). Allowed only with `command`. |

`{email}` is the login exactly as the user signed in with it, which is the session's username, not an address worked out from it: a user who signs in with a bare username (for instance under `[provider.multi] default_domain`) gives that bare username. `{local}` is the part of the login before the first `@`, or the whole login when it has none, and `{domain}` the part after it, or empty.

#### `[plugin.password.options.payload_mapping]`
Optional, and used only with `endpoint`. Each entry is `<field sent> = "<internal variable>"`, where the internal variable is one of `username` (the same value as `{email}`), `local`, `domain`, `old_password` and `new_password`. For example `password = "new_password"` sends a field `password` holding the new password. Only mapped fields are sent in the JSON or form body, and an entry naming an unknown variable is dropped. Without a mapping the body is empty: `{}` in JSON, and no content in a form.

---

## 10. Branding (`[branding]`)
What a deployment changes about how ALPS looks. Without this section ALPS looks as it ships: the Alps theme and the edelweiss as its logo. These settings reach the browser inside the page itself, so the sign-in page is drawn branded from its first paint.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `default_theme` | String | `"alps"` | Colour theme for anyone who has not picked one: `"alps"`, `"migadu"`, `"nord"` or `"ocean"`. A theme picked in Settings stays that user's. Light or dark still follows each user's Theme Mode. |
| `logo` | String | The default theme's own logo, else the edelweiss | The logo in the edelweiss's place, on the sign-in page and in the header, and the icon of the browser tab and the home screen. A logo ALPS ships, by name: `"migadu"` (the Migadu mammoth, in the theme's colours), or `"alps"` for the edelweiss. Or a folder holding a favicon package: `favicon.svg`, `favicon-96x96.png`, `favicon.ico`, `apple-touch-icon.png`, `web-app-manifest-192x192.png` and `web-app-manifest-512x512.png`, the files RealFaviconGenerator writes, each at most 1 MiB. The page shows its `favicon.svg`. With `default_theme = "migadu"` the Migadu logo is shown unless this names another. |

ALPS refuses to start with a theme or built-in logo it does not know, or a favicon package missing a file.

---

## 11. Environment Variables
Everything else is set in the configuration file. These variables are read as well:

| Variable | Effect |
| :--- | :--- |
| `CLUSTER_SECRET_KEY` | When set, used in place of `[cluster] secret_key`. |
| `TMPDIR` | The temp directory when `[server] temp_dir` is unset. `temp_dir` sets it for the process. |
| The AWS SDK's own variables | Read by the S3 client of `[tls.letsencrypt.s3]`, through the AWS default configuration, for the credentials and region the file does not set. |
| `HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` | Go's standard proxy settings. They apply to the HTTP requests ALPS makes to the CalDAV and CardDAV servers, the password plugin's `endpoint`, Let's Encrypt and S3. ALPS's own fetches of remote content for messages (`GET /proxy`) and of BIMI logos never go through a proxy, and IMAP, SMTP and ManageSieve connect directly. |
| `SSL_CERT_FILE`, `SSL_CERT_DIR` | On Linux and the BSDs, Go reads the trusted CA certificates from these when they are set. They apply to the TLS connections ALPS opens to the IMAP, SMTP, ManageSieve, CalDAV and CardDAV servers. IMAP and SMTP always verify the server's certificate, so a server with a private CA needs that CA in the host's trust store. |

The password plugin's `command` gets none of these: it runs with `PATH` as its only environment variable.
