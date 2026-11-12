# Operating ALPS

ALPS runs as a single process with no database. Sessions live in its memory, each account's state lives on the mail server, and only a few files are written to local disk. This document is the operator's runbook: the signals ALPS handles and how it shuts down, what a restart loses and how to upgrade, what ALPS writes to disk and where, the service files shipped in `dist/`, how to check the version, the startup order and exit status, and the outbound connections the host must allow. Building ALPS is covered in the [README](https://github.com/migadu/alps/blob/main/README.md#building), and every configuration key is listed in [CONFIGURATION.md](CONFIGURATION.md).

## Table of Contents
1. [Signals and Graceful Shutdown](#1-signals-and-graceful-shutdown)
2. [What a Restart Loses](#2-what-a-restart-loses)
3. [What ALPS Writes to Disk](#3-what-alps-writes-to-disk)
4. [Service Files](#4-service-files)
5. [Checking the Version](#5-checking-the-version)
6. [Startup and Exit Status](#6-startup-and-exit-status)
7. [Outbound Connections](#7-outbound-connections)

---

## 1. Signals and Graceful Shutdown

ALPS handles SIGHUP, SIGINT and SIGTERM. SIGHUP reopens the log file. SIGINT and SIGTERM shut ALPS down.

ALPS starts handling these signals only once it has started its HTTP listener, the last step of the [Startup Order](#startup-order). Before that, each of the three ends the process at once, without the steps below.

### SIGHUP

When `[logging] output` is a file path, ALPS opens the same path again and closes the old descriptor. A rotation tool such as newsyslog or logrotate can therefore move the file aside and then signal ALPS, and ALPS goes on writing to a new file under the old name. ALPS logs `SIGHUP: log file reopened`. If the file cannot be opened again, ALPS keeps writing to the old descriptor and logs `SIGHUP: <error>`.

SIGHUP does nothing else:

- It does not reload the configuration. Restart ALPS to apply a change to `config.toml`.
- It does not reload TLS certificates. With `[tls] provider = "file"`, ALPS reads `cert_file` and `key_file` once, at startup, so a renewed certificate takes a restart ([TLS.md](TLS.md#2-file-provider-manual-certificates)).
- With `output` set to `stdout`, `stderr` or `syslog`, or when the log file could not be opened at startup and ALPS fell back to stderr, there is no file to reopen. ALPS logs `SIGHUP: no log file to reopen`.

### SIGINT and SIGTERM

Either signal starts a graceful shutdown, which takes these steps in order:

1. **HTTP.** The listener on `[server] addr` closes, and with Let's Encrypt so does the ACME HTTP-01 listener on `acme_http_addr`, so new connections are refused, and idle keep-alive connections are closed. Open `/events` streams are ended. Requests in progress on both listeners get up to 30 seconds together to finish. The connections of a request still running after that are closed, and ALPS logs `HTTP server shutdown: context deadline exceeded`.
2. **Sessions.** Every session is told to close. Each one releases its mail connections and its uploaded attachment files in the background, and ALPS waits up to 5 seconds in all for that to finish, for sessions evicted just before the shutdown as well. If the cleanup takes longer, ALPS logs `Session shutdown timed out waiting for cleanup` and goes on, so some upload files can be left in the temp directory (see [Attachment Uploads](#attachment-uploads)). No `session ended` line is logged for these sessions.
3. **Background jobs and plugins.** The rate limiter's cleanup and the hourly job scheduler stop. Then each loaded plugin is closed, once; the shipped plugins have nothing to release.
4. **Let's Encrypt.** With `[tls] provider = "letsencrypt"`, the certificate warm loop stops, waiting up to 5 seconds for it. With S3 storage, the certificate sync worker also stops, waiting up to 10 seconds.
5. **Cluster.** With `[cluster] enabled = true`, the node announces that it is leaving, waits up to 5 seconds for that to go out (not at all when no other node is up), and stops gossip ([CLUSTER.md](CLUSTER.md#3-startup-membership-and-shutdown)).
6. ALPS exits with status 0.

A shutdown therefore takes up to 35 seconds without Let's Encrypt and `[cluster]`. Let's Encrypt adds up to 5 seconds, or up to 15 with S3 storage, and `[cluster]` up to 5 more. With both, which means S3 storage, a shutdown takes up to 55 seconds. ALPS logs no line of its own for the start or the end of a shutdown, only the HTTP line above when the 30 seconds run out. With S3 storage, the certificate manager logs `stopping certificate sync worker` and then `certificate sync worker stopped gracefully` (or `certificate sync worker stop timed out`).

Once a shutdown has begun, further SIGINT, SIGTERM and SIGHUP signals are ignored, so a second SIGTERM does not make it end sooner. Only SIGKILL, or SIGQUIT (which prints a stack trace and exits with status 2), ends it sooner.

### Killed or Crashed

SIGKILL, a crash or a power loss skips all of the above. Requests in progress fail. A cluster node does not announce that it is leaving, and the other nodes notice it is gone through their failure detection. Upload files stay in the temp directory.

---

## 2. What a Restart Loses

ALPS keeps sessions, and everything tied to them, in the memory of the process. A restart or a crash loses:

- **Every session**, with its mail connections and its cache ([SESSIONS.md](SESSIONS.md)). A browser comes back without the password only when `[server] login_key` is set and unchanged, and the browser still sends its `alps_session` cookie and a valid `alps_login_token` (one written at most 30 days earlier). ALPS then opens a new session from the token on the browser's first request (see [Session Restoration](SESSIONS.md#session-restoration)). Without `login_key`, every user signs in again after a restart.
- **Uploaded attachments** not yet sent or saved in a draft. The composer's next save or send is refused with 409 `missing_attachments`, and the composer lists the files to add again ([ATTACHMENTS.md](ATTACHMENTS.md)).
- **Sign-ins waiting for a security key or recovery code**, and security-key enrolments in progress. They have to start over ([WEBAUTHN.md](WEBAUTHN.md)).
- **Open event streams** (`/events`, with `push_new_mail`).
- **Rate-limit counts and lockouts** ([RATELIMIT.md](RATELIMIT.md#where-the-state-lives)).
- **In-memory caches**: the CalDAV and CardDAV home sets and CalDAV's scheduling details for each connection ([CDAV.md](CDAV.md#home-set-caching)), and the `multi` provider's autodiscovery answers.

A restart keeps:

- everything on the mail server: the mail, and the per-account state ALPS stores in IMAP METADATA, such as settings, security keys and linked accounts ([ARCHITECTURE.md](ARCHITECTURE.md));
- the files listed in [What ALPS Writes to Disk](#3-what-alps-writes-to-disk): the Let's Encrypt certificate cache (and the S3 store), the log file, and the BIMI logo cache unless the temp directory is private to the service.

A changed `login_key` makes every login token unreadable, so after such a restart every user signs in again. It also makes the stored linked-account credentials, and the separate CalDAV and CardDAV passwords users saved in Settings, unreadable (see [Changing the Key](SESSIONS.md#changing-the-key)).

### Restarts and Upgrades

The nodes of a cluster that keep the same binary can be restarted one at a time, to apply a configuration change for example. With the same `login_key` on every node, the browsers of a restarted node are restored on whichever node they reach ([CLUSTER.md](CLUSTER.md#5-node-local-state-and-session-affinity)).

A new ALPS binary is not rolled out one node at a time. Every ALPS instance that serves the same accounts, in a cluster or standalone, is upgraded together: stop all the instances that run the old binary, wait until each has exited, then start the new ones. Mixing binaries is not supported ([Recovery Codes](WEBAUTHN.md#recovery-codes)). The new nodes of a cluster can start in any order, and none has to go first ([Restarting and Upgrading](CLUSTER.md#restarting-and-upgrading)). The upgrade ends every session, as any restart does. With `login_key` set and unchanged, browsers are restored from their login token on the new instances.

---

## 3. What ALPS Writes to Disk

| What | Where | Mode | Removed |
| :--- | :--- | :--- | :--- |
| Attachment upload files, `multipart-<random>` | The temp directory | 0600 | When the upload request is refused, or once the attachments stored from the file are sent, saved in a draft, removed, evicted, or dropped when their session ends. A file left behind by a crash or a kill, once it is more than 7 days old, by an hourly job. |
| BIMI logo cache | `<temp directory>/alps-avatars/` | Directory 0755, files 0644 | Entries older than 7 days, by an hourly job |
| Let's Encrypt certificate cache | `[tls.letsencrypt] cache_dir` (default `cert-cache`) | Directory 0700, files 0600 | Challenge tokens once used. Certificates and the account key never. |
| Log file | `[logging] output`, when it is a file path | 0644 | Never by ALPS |
| Maildir settings, `alps_store.json` | Each user's maildir (maildir provider only) | 0600 | Never by ALPS |

The modes are applied before the umask. ALPS writes nothing else to disk. Sessions, caches, pending sign-ins and rate-limit counts are kept in memory only, and ALPS writes no pid file of its own. The maildir provider also writes the mail itself under each user's maildir ([MAILDIR.md](MAILDIR.md)).

### The Temp Directory

ALPS's temp directory is `[server] temp_dir` when that is set, otherwise `$TMPDIR`, otherwise `/tmp`. ALPS applies `temp_dir` by setting `TMPDIR` for its own process at startup.

ALPS does not create the temp directory at startup. Until it exists, every upload request whose files add up to more than 32 KiB is refused with 500 `upload_storage_failed`, and ALPS logs `upload multipart: ...` with the cause. The first BIMI logo lookup does create it, with mode 0755, as the parent of `alps-avatars`. Create the directory before starting ALPS, owned by the user ALPS runs as and closed to other users, for example:

```sh
install -d -o alps -g alps -m 700 /var/lib/alps/tmp
```

```toml
[server]
temp_dir = "/var/lib/alps/tmp"
```

Do not share the temp directory with other users or programs: only the user ALPS runs as should be able to write to it. Either set `temp_dir` to a directory of ALPS's own, or run ALPS with a private `/tmp`, as the shipped systemd unit does with `PrivateTmp=true` (see its [caveats](#caveats-systemd)).

### Attachment Uploads

An upload request (`POST /attachments`) keeps its file parts in memory while they fit in a 32 KiB allowance for the whole request. Every other file part of the request is written to one temporary file, `multipart-<random>` (mode 0600), in the temp directory. The request body is capped at `max_attachment_mib` + 1 MiB, and ALPS deletes older uploads to stay within `max_session_attachment_mib` and `max_global_attachment_mib` (defaults 128 and 1024 MiB). Leave room in the temp directory above `max_global_attachment_mib`.

The file is removed once every attachment stored from it is gone: sent, saved in a draft, removed by the user, evicted to make room under the budgets, or dropped when its session ends ([ATTACHMENTS.md](ATTACHMENTS.md#the-temporary-directory)).

`multipart-*` files left behind by a crash, a kill, or a shutdown that ended before every session's cleanup had run are removed by an hourly job once they are more than 7 days old. The job keeps the files of the uploads ALPS still holds ([ATTACHMENTS.md](ATTACHMENTS.md#4-the-temp-file-sweeper)). No upload survives a restart, so while ALPS is stopped every `multipart-*` file in its own temp directory is a leftover and can be deleted. With `PrivateTmp=true`, systemd removes them when the service stops.

### The BIMI Logo Cache

Sender logos fetched for [BIMI](#bimi-logos) are cached in `<temp directory>/alps-avatars`, which the first lookup creates with mode 0755. Each entry is named after the SHA-256 of `<selector>:<domain>` and has one of three extensions:

- `.svg`: the logo, with script removed;
- `.neg`: the domain has no usable logo;
- `.retry`: the lookup or the fetch failed. The domain is looked up again on the first request after 5 minutes.

An hourly job, first run one hour after startup, deletes every entry older than 7 days, logos included, so each domain is looked up again about once a week. The directory can be deleted at any time, and ALPS fills it again as logos are asked for.

### The Let's Encrypt Certificate Cache

With `[tls] provider = "letsencrypt"`, certificates are kept in `[tls.letsencrypt] cache_dir`. The default, `"cert-cache"`, is relative to the process's working directory, which is `/` under both shipped service files, so set an absolute path. ALPS creates the directory with mode 0700 (at startup with S3 storage, at the first write with `"file"` storage) and writes its files with mode 0600. It holds the ACME account key and each certificate with its private key.

- With `storage_provider = "file"`, it is the only copy. Keep it across restarts. It also holds the challenge tokens of an issuance in progress, which are removed once used.
- With `storage_provider = "s3"` (the default), it is a local copy of the S3 store. If it cannot be created, ALPS logs `cannot create fallback directory - fallback cache disabled, using S3-only` and keeps certificates in S3 only.
- With a non-production `directory_url`, ALPS appends `-acme-<8 hex digits>` to the directory name, so that staging certificates never mix with production ones (see [TLS.md](TLS.md#staging-directory-and-rsa-certificates)).

### The Log File

A `[logging] output` path is opened for appending, and created with mode 0644 when it is missing. Its directory must already exist. If the file cannot be opened, ALPS writes `Failed to open log file ...` to standard error and logs there instead. ALPS never rotates or truncates the file: rotate it with newsyslog or logrotate, and have the tool send SIGHUP after moving it. The log holds user names and client addresses, and, at level debug with `[server] debug` or `[provider.imap] debug` on, the protocol traces with message, contact and calendar content, so keep it in a directory that only the ALPS user and administrators can read.

The cluster's and the certificate manager's lines ([CLUSTER.md](CLUSTER.md#7-checking-the-cluster)), the warnings of the IMAP provider, such as the one for a server without METADATA, and the protocol traces that `[server] debug` turns on go through `[logging]` like every other line. The traces are `protocol trace` lines at debug level, so they appear only while `level` is debug ([CONFIGURATION.md](CONFIGURATION.md#1-server-configuration-server)).

---

## 4. Service Files

`dist/` holds a systemd unit and a FreeBSD rc.d script. Both run `/usr/local/bin/alps` as user `alps`, which must exist. Build the binary as the [README](https://github.com/migadu/alps/blob/main/README.md#building) describes (`make build` writes `build/alps`, `make build-linux` and `make build-freebsd` write `build/alps-linux-amd64` and `build/alps-freebsd-amd64`) and install it as `/usr/local/bin/alps`. The configuration file holds secrets such as `login_key`, so make it readable by the `alps` user and not by other users.

### systemd (`dist/alps.service`)

Install, enable and start:

```sh
cp dist/alps.service /etc/systemd/system/alps.service
systemctl daemon-reload
systemctl enable alps
systemctl start alps
```

The unit runs `/usr/local/bin/alps -config /etc/alps/config.toml` as user and group `alps`. With the default `[logging]` output, the log lines go to the journal: `journalctl -u alps -f`. Its other settings:

| Setting | Value | Effect |
| :--- | :--- | :--- |
| `ExecReload` | `/bin/kill -HUP $MAINPID` | `systemctl reload alps` sends SIGHUP. |
| `KillSignal`, `KillMode` | `SIGTERM`, `mixed` | `systemctl stop alps` sends SIGTERM to ALPS, and SIGKILL to whatever is left once `TimeoutStopSec` has passed. |
| `TimeoutStopSec` | `60` | How long systemd waits for ALPS to stop: longer than the longest shutdown, 55 seconds with Let's Encrypt on S3 and `[cluster]`. |
| `Restart`, `RestartSec` | `on-failure`, `5` | ALPS is started again 5 seconds after it exits with a non-zero status or is killed by a signal such as SIGKILL. |
| `LimitNOFILE` | `65536` | Open file limit. Each session usually holds one or two mail connections. |
| `AmbientCapabilities`, `CapabilityBoundingSet` | `CAP_NET_BIND_SERVICE` | Lets ALPS listen on ports below 1024, such as 443 and 80. |
| `NoNewPrivileges` | `true` | ALPS and its child processes cannot gain privileges. |
| `ProtectSystem` | `strict` | The whole file system is read-only for ALPS, except the paths in `ReadWritePaths` and its private `/tmp` and `/var/tmp`. |
| `ProtectHome` | `true` | `/home`, `/root` and `/run/user` are hidden from ALPS. |
| `PrivateTmp` | `true` | ALPS gets its own `/tmp` and `/var/tmp`. |
| `ReadWritePaths` | Commented out | No writable paths beyond the private temp directories. |

#### Caveats (systemd)

- **Reload is not a configuration reload.** `systemctl reload alps` sends SIGHUP, which only reopens a log file, as the unit's comment says. Use `systemctl restart alps` to apply a configuration change or a renewed certificate.
- **Writable paths.** Under `ProtectSystem=strict`, only the private `/tmp` and `/var/tmp` can be written. The unit sets no `WorkingDirectory`, so the default `cache_dir` resolves to `/cert-cache`, which cannot be written. Set an absolute `cache_dir` and list a directory that holds it in `ReadWritePaths`. List there as well the directory of a log file, a `temp_dir` outside `/tmp` and `/var/tmp`, and, with the maildir provider, the maildirs. Each path in `ReadWritePaths` must exist before the service starts.
- **Home directories.** `ProtectHome=true` hides `/home`, so the maildir provider cannot reach maildirs there, such as the `<home>/Maildir` default for passwd entries whose home is under `/home`. Set `ProtectHome=false` in a drop-in for such a setup.
- **Private temp directory.** With `PrivateTmp=true`, ALPS's `/tmp` is its own, and systemd deletes it when the service stops, so the BIMI logo cache and any leftover upload files go with every restart. A directory under the host's `/tmp` or `/var/tmp` is not visible to ALPS, so a `temp_dir` there does not exist for it. With this unit, leave `temp_dir` unset, or point it outside `/tmp` and `/var/tmp` and list it in `ReadWritePaths`.
- **Restart loop.** A configuration error makes ALPS exit with status 1, and `Restart=on-failure` starts it again 5 seconds later, each time. A broken configuration shows in `journalctl -u alps` as the same startup error, repeated.

A drop-in for a single node with Let's Encrypt certificates on local disk:

```sh
install -d -o alps -g alps -m 700 /var/lib/alps
systemctl edit alps
```

```ini
[Service]
ReadWritePaths=/var/lib/alps
```

```toml
[tls.letsencrypt]
storage_provider = "file"   # the default is "s3"
cache_dir = "/var/lib/alps/cert-cache"
```

Then run `systemctl restart alps`.

### FreeBSD rc.d (`dist/alps`)

Install, enable and start:

```sh
cp dist/alps /usr/local/etc/rc.d/alps
chmod +x /usr/local/etc/rc.d/alps
sysrc alps_enable=YES
service alps start
```

The script reads these `rc.conf` variables:

| Variable | Default | Meaning |
| :--- | :--- | :--- |
| `alps_enable` | `NO` | Starts ALPS at boot. |
| `alps_user` | `alps` | The user ALPS runs as. |
| `alps_group` | `alps` | The group that owns the log directory and `/var/run/alps`. |
| `alps_config` | `/usr/local/etc/alps/config.toml` | Passed to ALPS as `-config`. |
| `alps_logdir` | `/var/log/alps` | The directory of `alps.log`. |

rc.subr starts daemon(8) as `alps_user`, and daemon(8) runs ALPS:

```sh
daemon -c -f -H -P /var/run/alps/daemon.pid -o ${alps_logdir}/alps.log -p /var/run/alps/alps.pid /usr/local/bin/alps -config ${alps_config}
```

daemon(8) appends ALPS's standard output and standard error to `alps.log`, writes ALPS's pid to `/var/run/alps/alps.pid` and its own to `/var/run/alps/daemon.pid`, and reopens `alps.log` when it receives SIGHUP (`-H`). `service alps stop` and `status` use `alps.pid`, checked against `/usr/local/bin/alps`. Before each start, the script creates `alps_logdir` and `/var/run/alps` with mode 750, owned by `alps_user:alps_group`. With the default `[logging]` output, every log line goes to `alps.log`: `tail -f /var/log/alps/alps.log`.

#### Caveats (FreeBSD)

- **Reload is not a configuration reload.** `service alps reload` sends SIGHUP to ALPS, as the script's comments say. ALPS then reopens only a log file it opened itself through `[logging] output`. It does not reopen daemon(8)'s `alps.log`, and it does not reload the configuration. Use `service alps restart` to apply a configuration change.
- **Log rotation.** daemon(8), not ALPS, holds `alps.log` open, so newsyslog must send SIGHUP to the pid in `/var/run/alps/daemon.pid` after moving it. The script's comments give an entry for `/etc/newsyslog.conf.d/alps.conf`:

  ```
  /var/log/alps/alps.log alps:alps 640 7 * @T00 JC /var/run/alps/daemon.pid 1
  ```

  A log file set in `[logging] output` is rotated the other way: newsyslog sends SIGHUP to ALPS itself, at `/var/run/alps/alps.pid`.
- **Working directory.** `daemon -c` runs ALPS in `/`, so a relative `cache_dir` resolves under `/`. Set an absolute `cache_dir` in a directory the `alps` user can write.
- **Temp directory.** Unless `TMPDIR` or `temp_dir` says otherwise, ALPS uses the shared `/tmp`. Set `temp_dir` to a directory of ALPS's own (see [The Temp Directory](#the-temp-directory)).

---

## 5. Checking the Version

```sh
alps -version
```

prints `alps <version> (<commit>) built at <date>` and exits with status 0.

The three values are set when the binary is linked. `make build`, `make install`, `make build-linux` and `make build-freebsd` pass them with `-ldflags -X main.version=... -X main.commit=... -X main.date=...`:

- `version`: the output of `git describe --tags --always --dirty --match='v*'`, or `dev` outside a git checkout;
- `commit`: the output of `git rev-parse --short HEAD`, or `unknown`;
- `date`: the build time in UTC, as `YYYY-MM-DDTHH:MM:SSZ`.

Each can be given on the make command line instead, for example `make build VERSION=v1.2.3`. A plain `go build ./cmd/alps`, `go install` or `go run` sets none of them, and the binary prints `alps unknown (unknown) built at unknown`.

ALPS does not log its version at startup, and no HTTP endpoint reports it. Every response carries an `X-Alps-Build` header, but that header names the frontend build, not the binary: it is the first 16 hex digits of the SHA-256 of the `index.html` ALPS serves, which is the embedded frontend's with the `[branding]` settings (`default_theme`, `logo`) written into it. With a favicon package as `logo`, the `index.html` also carries a fingerprint of the package's files, so the header changes when any of those files changes too (ALPS reads them at startup). It changes when `frontend/dist` or those settings change, so two binaries built with the same frontend and run with the same `[branding]` and favicon files send the same value. The web app uses it to notice that a newer frontend is being served. To read it:

```sh
curl -sI http://localhost:1323/ | grep -i x-alps-build
```

---

## 6. Startup and Exit Status

### Startup Order

ALPS starts in this order:

1. It reads and checks the configuration, and sets `TMPDIR` from `[server] temp_dir`.
2. It opens the log, and logs a warning for each configuration key it does not know (`Unknown configuration key: ... (ignored)`, see [CONFIGURATION.md](CONFIGURATION.md)).
3. With `[cluster] enabled = true`, it starts gossip and tries to join `peers` ([CLUSTER.md](CLUSTER.md#3-startup-membership-and-shutdown)).
4. It sets up the server (the SMTP server URL and the mail provider) and loads the plugins. Here a `[plugin.caldav] server` without a scheme is discovered through DNS, and the global CalDAV and CardDAV `server` each get one `OPTIONS` request, with a 10-second timeout ([CDAV.md](CDAV.md#sanity-checks)).
5. It sets up WebAuthn.
6. With `[tls] enabled = true`, it loads the certificate pair, or sets up Let's Encrypt. With S3 storage, it first checks that the bucket can be reached, for up to 10 seconds. With Let's Encrypt, it then starts the ACME HTTP-01 listener on `acme_http_addr`. A listener that cannot bind is logged as `ACME HTTP-01 handler error` and does not stop ALPS.
7. It logs `Starting server on <addr>` and starts the HTTP or HTTPS listener on `[server] addr`.

### Exit Status

| Status | When |
| :--- | :--- |
| `0` | `-version`, `-h`, or the end of a shutdown after SIGINT or SIGTERM. |
| `1` | `-config` is missing; the configuration cannot be read, parsed or validated; or a startup step fails: the cluster, the server setup (the mail provider, the SMTP server URL, a plugin), WebAuthn, TLS (including an S3 bucket that cannot be reached), or the listener on `[server] addr` (for example, when the address is already in use). Also when that listener fails later. |
| `2` | An unknown flag. ALPS prints its usage. Go also exits with status 2 after an unrecovered panic or on SIGQUIT, and prints the trace on standard error. |

Errors found before the log is opened, such as `Error: -config flag is required`, `Error loading config file: ...` and `Error generating options: ...`, are written to standard error. Later fatal errors go to the `[logging]` output. Under the systemd unit, standard error goes to the journal. Under the FreeBSD script, it goes to `alps.log`.

---

## 7. Outbound Connections

ALPS connects to the services it is configured for, and two features fetch from any host on the internet: the remote-content proxy and BIMI logos. Users can also enter CalDAV and CardDAV servers of their own in Settings, which ALPS then connects to. The host's firewall must allow:

| Destination | When | Protocol |
| :--- | :--- | :--- |
| The IMAP server (under `multi`, the server for each domain or route) | At sign-in, and for the life of each session (usually one or two connections per session, see [SESSIONS.md](SESSIONS.md)) | IMAP, as `[provider.imap] server` says ([MAIL_SERVER.md](MAIL_SERVER.md)) |
| The SMTP submission server (under `multi`, a domain's own `smtp`) | Each send | SMTP, as `[smtp] server` says |
| The ManageSieve server | With the `managesieve` plugin, for each filter and auto-reply request | ManageSieve, 15-second connect timeout ([FILTERS.md](FILTERS.md)) |
| The CalDAV and CardDAV servers | With the `caldav` and `carddav` plugins: one `OPTIONS` request to each global `server` at startup, then as the user works | HTTP or HTTPS ([CDAV.md](CDAV.md)) |
| The CalDAV and CardDAV servers users enter in Settings | When a user saves a connection, then as the user works | HTTPS, at public addresses only; with `dav_allow_private_servers`, also HTTP and any address ([CDAV.md](CDAV.md#personal-servers)) |
| The password-change endpoint | With `[plugin.password]` and an `endpoint`, for each change | HTTP or HTTPS, 15-second timeout ([PASSWORD_CHANGE.md](PASSWORD_CHANGE.md)) |
| Let's Encrypt | With `provider = "letsencrypt"`: `https://acme-v02.api.letsencrypt.org/directory`, or `directory_url` | HTTPS ([TLS.md](TLS.md)) |
| S3 | With `storage_provider = "s3"`: the S3 `endpoint`, or AWS S3 when none is set | HTTPS, or HTTP for an `http://` endpoint |
| The other ALPS nodes | With `[cluster]`: each peer's gossip port (default 7946) | TCP and UDP ([CLUSTER.md](CLUSTER.md)) |
| DNS | Every host name above, and the TXT and SRV lookups listed [below](#dns-lookups) | DNS |
| Any public web host | Remote content through `/proxy`, and BIMI logos | HTTP and HTTPS, on any port a URL names |

Inbound traffic is covered in [TLS.md](TLS.md): the HTTPS listener, the ACME challenges, the settings for a reverse proxy in front of ALPS, and health checks (see [Uploads, the Event Stream and Caching](TLS.md#uploads-the-event-stream-and-caching)).

### The Remote-Content Proxy

`GET /proxy?url=<absolute http or https URL>` fetches a resource for the message view. Only signed-in sessions can use it.

The web app sends a message's remote images, CSS `url()` references, fonts and `srcset` candidates through the proxy, and only when remote content is allowed for that message. Each user chooses under Settings > Reading & Composing > Show Remote Content: **Always ask** (the default) or **Always load**. With Always ask, remote resources stay blocked until the user clicks **Load remote content** for the message. No configuration key turns the proxy off for everyone.

How ALPS fetches:

- A GET with a 20-second overall timeout: 10 seconds to connect, 10 seconds for the TLS handshake and 15 seconds to the response headers. It follows at most 5 redirects, each to an `http` or `https` URL, and opens a new connection for every request.
- An answer other than 200, or a fetch that fails, is answered with 502.
- Only `image/*`, `font/*`, `text/css`, `application/font*` and `application/x-font*` pass. Any other type is answered with 400. A declared `Content-Length` over 5 MiB is answered with 400, and any other body is cut off at 5 MiB.
- The resource is served with `Content-Security-Policy: default-src 'none'; sandbox`, `X-Content-Type-Options: nosniff` and `Content-Disposition: attachment`, so that it never runs as a page of ALPS's own.

### BIMI Logos

`GET /bimi/avatar?domain=<domain>[&selector=<selector>]` answers with a sender's BIMI logo. `selector` defaults to `default`, and the web app sends none. Only signed-in sessions can use it.

The web app asks for a logo only for a message with a single From address that the receiving mail server passed under DMARC or BIMI (`dmarc=pass` or `bimi=pass`), as its `Authentication-Results` field says (see `authserv_ids` in [CONFIGURATION.md](CONFIGURATION.md)), and asks for the domain of that From address. It never asks for a built-in list of 20 freemail domains, such as `gmail.com` and `outlook.com`, and asks only while the user's Settings > Appearance > Show sender avatars is on (the default).

ALPS then checks, in order:

1. The TXT record at `_dmarc.<domain>` must be a DMARC record with `p=quarantine` or `p=reject`. ALPS reads that exact name only, with no fallback to the organisational domain.
2. The TXT record at `<selector>._bimi.<domain>` must be a `v=BIMI1` record whose `l=` URL starts with `https://`.
3. ALPS fetches the logo, with a 5-second overall timeout, and reads at most the first 1 MiB. It removes script from the SVG before caching and serving it, as `image/svg+xml` with the same `Content-Security-Policy` and `X-Content-Type-Options` headers as the proxy.

A DNS or network failure, a timeout, or a 5xx, 408 or 429 answer from the logo host is tried again after 5 minutes. Any other outcome without a logo is cached as "no logo" for up to 7 days (see [The BIMI Logo Cache](#the-bimi-logo-cache)). A domain without a logo is answered with 404. Answers carry `Cache-Control: public, max-age=86400`, or `no-store` while a retry is pending.

### The Address Check

The proxy and the BIMI fetch connect only to public addresses. At connection time, for the first request and for every redirect, ALPS checks the address the host name resolved to and refuses loopback, private (RFC 1918 and `fc00::/7`), unspecified, link-local and multicast addresses, as well as `0.0.0.0/8`, `100.64.0.0/10` (carrier-grade NAT), `192.0.0.0/24`, `198.18.0.0/15` and `240.0.0.0/4`. A resource on such an address, an intranet image server for example, does not load through the proxy (502), and a BIMI logo on one counts as no logo.

The same check, with the same ranges, guards two other kinds of connection whose destination a user's input decides:

- the CalDAV and CardDAV servers users enter in Settings, unless `[server] dav_allow_private_servers` is on ([CDAV.md](CDAV.md#personal-servers));
- the IMAP servers the `multi` provider finds for a login through `template` or `autodiscover`, before connecting and again on the address each connection reaches ([CONFIGURATION.md](CONFIGURATION.md#providermulti)).

### HTTP Proxies

The proxy and the BIMI fetch use no HTTP proxy: `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` are ignored for them. Nor do the requests to the CalDAV and CardDAV servers users enter in Settings, while `dav_allow_private_servers` is off. They resolve names through the host's resolver and connect directly. A host whose outbound web traffic has to pass an HTTP proxy cannot load remote content or BIMI logos, nor reach such servers. It needs direct outbound HTTP and HTTPS, and DNS.

The other HTTP clients (CalDAV and CardDAV for the administrator's servers, and for the users' own when `dav_allow_private_servers` is on, the startup `OPTIONS` checks, the password endpoint, ACME and S3) use Go's standard proxy settings, so `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` do apply to them. IMAP, SMTP, ManageSieve and gossip are direct TCP connections (and UDP for gossip), which no HTTP proxy carries.

### DNS Lookups

Besides resolving host names, ALPS makes these lookups itself:

- For BIMI logos: TXT `_dmarc.<domain>` and `<selector>._bimi.<domain>`.
- At startup, for a `[plugin.caldav] server` given without a scheme: SRV `_caldavs._tcp.<domain>`, and the TXT record of the same name for the path ([CDAV.md](CDAV.md#caldav-auto-discovery)). If discovery fails, the CalDAV plugin loads without a global server.
- At sign-in, with `[provider.multi] autodiscover = true` and a domain listed in `autodiscover_domains`: SRV `_imaps._tcp.<domain>`, then `_imap._tcp.<domain>`. An answer is kept for 15 minutes, and a lookup that fails or finds no usable record for 30 seconds ([CONFIGURATION.md](CONFIGURATION.md)).
