# ALPS TLS Configuration Guide

ALPS provides built-in Transport Layer Security (TLS) termination, allowing you to serve the application securely over HTTPS without requiring an external reverse proxy (like Nginx or Caddy), though using one is still supported.

This document details the TLS capabilities in ALPS and how to configure them in your `config.toml`. Every key is also listed in [CONFIGURATION.md](CONFIGURATION.md#6-tls-configuration-tls).

## Table of Contents
1. [Overview](#1-overview)
2. [File Provider (Manual Certificates)](#2-file-provider-manual-certificates)
3. [Let's Encrypt Provider (Automatic Certificates)](#3-lets-encrypt-provider-automatic-certificates)
   - [Basic Setup (Single Node)](#basic-setup-single-node)
   - [Challenges and Ports](#challenges-and-ports)
   - [Issuance and Renewal](#issuance-and-renewal)
   - [Staging Directory and RSA Certificates](#staging-directory-and-rsa-certificates)
   - [S3 Storage (Multi-Node / Cluster)](#s3-storage-multi-node--cluster)
4. [Cluster Mode / Gossip Protocol](#4-cluster-mode--gossip-protocol)
5. [Reverse Proxies](#5-reverse-proxies)

---

## 1. Overview

To enable built-in TLS, you must configure the `[tls]` section in `config.toml` and set `enabled = true`.

ALPS supports two certificate providers:
- **`file`**: Use your own pre-generated certificates.
- **`letsencrypt`**: Request and renew certificates automatically using the ACME protocol.

```toml
[tls]
enabled = true
provider = "file" # or "letsencrypt"
```

`provider` has no default. With `enabled = true` it must be exactly `"file"` or `"letsencrypt"` (lowercase). A missing or different value stops startup with `unsupported tls provider`. Both providers accept TLS 1.2 and newer only.

> [!NOTE]
> With TLS enabled, `[server] addr` (default `":1323"`) is the HTTPS listener. ALPS opens other ports only in two cases:
> - With `provider = "letsencrypt"`, every node also listens on `acme_http_addr` (default `":80"`) for ACME HTTP-01 challenges (see [Challenges and Ports](#challenges-and-ports)).
> - With `[cluster] enabled = true`, ALPS binds the gossip port (default 7946, TCP and UDP).
>
> Ensure these ports are accessible. To serve port 443 as an unprivileged user, use port forwarding (e.g., forwarding 443 to 1323) or grant the process `CAP_NET_BIND_SERVICE`, as the shipped systemd unit (`dist/alps.service`) does.

ALPS does not redirect HTTP to HTTPS. With `provider = "file"`, nothing listens on port 80. With `provider = "letsencrypt"`, the `acme_http_addr` listener answers only ACME challenges and returns 404 for every other path. If plain-HTTP visitors should be redirected, the redirect has to come from something in front of ALPS (see [Passing ACME Challenges through a Proxy](#passing-acme-challenges-through-a-proxy)).

Whichever provider you use, a deployment served under a real hostname must also set `[webauthn] rpid` and `origins` (see [WebAuthn](#webauthn-behind-a-proxy)).

---

## 2. File Provider (Manual Certificates)

Use the `file` provider if you already have certificates (e.g., from a commercial CA, your own internal CA, or provisioned externally by Certbot).

```toml
[tls]
enabled = true
provider = "file"
cert_file = "/path/to/fullchain.pem"
key_file = "/path/to/privkey.pem"
```

- `cert_file`: The path to the complete certificate chain (server certificate + intermediate CA).
- `key_file`: The path to the private key.

Both are required. If either is unset (`cert_file and key_file required`) or the pair cannot be loaded (`load certificate: ...`), startup stops. Ensure the user running the ALPS process has read permissions for these files.

ALPS reads the pair once, at startup. A renewed certificate takes effect only after ALPS is restarted, so an external renewal must restart it (for example `systemctl restart alps` in a Certbot deploy hook). `systemctl reload alps` sends SIGHUP, which only reopens the log file and does not reload certificates (see [OPERATIONS.md](OPERATIONS.md)).

---

## 3. Let's Encrypt Provider (Automatic Certificates)

ALPS can request and renew its certificates from Let's Encrypt itself. It tries the TLS-ALPN-01 challenge first and the HTTP-01 challenge as the fallback.

### Basic Setup (Single Node)

For a single server deployment, ALPS can store the fetched certificates in a local directory. `storage_provider` defaults to `"s3"`, so a single node that should keep certificates on local disk must set `storage_provider = "file"`. Otherwise ALPS needs a reachable S3 bucket and exits at startup without one.

```toml
[server]
addr = ":443"                           # HTTPS; also answers TLS-ALPN-01 challenges

[tls]
enabled = true
provider = "letsencrypt"

[tls.letsencrypt]
email = "admin@example.com"             # ACME account contact (required)
domains = ["webmail.example.com"]       # Every hostname browsers use (required)
default_domain = "webmail.example.com"  # For SNI-less clients (default: first of domains)
storage_provider = "file"               # Local disk only (default: "s3")
cache_dir = "/var/lib/alps/cert-cache"  # Directory to store certificates (default: "cert-cache")
acme_http_addr = ":80"                  # HTTP-01 challenge listener (default: ":80")
```

- `email`: The ACME account contact address. Required: without it startup fails with `email required`.
- `domains`: List every hostname browsers use. At least one is required (`at least one domain required`). The list is an exact allowlist with no wildcards. Each name gets its own certificate, ordered on its own rather than as one multi-name certificate. A handshake whose SNI names a host that is not listed, or an IP address, gets no certificate and fails. A client that connects to an IP address normally sends no SNI, and is served the `default_domain` certificate (below).
- `default_domain`: Optional, and defaults to the first entry of `domains`. It is used for handshakes without SNI and must be one of the listed `domains`, otherwise those handshakes fail.
- `cache_dir`: Defaults to `"cert-cache"`, relative to the process's working directory. The shipped systemd unit sets no `WorkingDirectory` and uses `ProtectSystem=strict`, so a relative directory cannot be written there. Use an absolute path such as `/var/lib/alps/cert-cache`, make sure its parent exists and is writable by the `alps` user, and add that parent to the unit's `ReadWritePaths` (the line is there, commented out).

### Challenges and Ports

> [!IMPORTANT]
> Let's Encrypt validates TLS-ALPN-01 on port 443 and HTTP-01 on port 80.
> - TLS-ALPN-01 is answered on the HTTPS listener (`[server] addr`), which must be reachable from the internet as port 443. If port 443 does not reach ALPS, each issuance first spends a failed TLS-ALPN-01 attempt before HTTP-01.
> - HTTP-01 is answered on `acme_http_addr`, which must be reachable as port 80. Binding port 80 requires root or `CAP_NET_BIND_SERVICE` (the shipped systemd unit grants it). Otherwise configure a port forward from external port 80 to your `acme_http_addr`.

The HTTP-01 listener starts on every node that uses Let's Encrypt, on `":80"` when `acme_http_addr` is unset. If it cannot bind (port in use, or no `CAP_NET_BIND_SERVICE`), ALPS logs `ACME HTTP-01 handler error` and keeps running without it. HTTP-01 then cannot be answered by this node.

The listener answers only `/.well-known/acme-challenge/` requests and returns 404 for every other path. A challenge request must arrive with the `Host` header set to exactly one of `domains`, without a port, otherwise it is answered 403. A proxy or port forward in front of it must keep the original `Host`.

### Issuance and Renewal

A warm pass makes sure every listed domain has a certificate and requests one where none is stored.

- The first pass runs 60 to 120 seconds after startup, then every 12 hours, never more often than every 15 minutes, with 2 seconds between domains.
- A single node runs the passes itself. In a cluster only the leader runs them. A node checks every 15 seconds whether it has become leader, and runs a pass when it has.
- With S3 storage, a pass is put off while the node is pausing S3 after an error (30 seconds, see [S3 Storage](#s3-storage-multi-node--cluster)), and retried after that pause.

A handshake for a listed domain that has no certificate yet also starts issuance on demand. Once its ClientHello names a listed domain, that handshake has two minutes, separate from `[server] read_timeout_sec`, for the certificate to be found or ordered and for the rest of the handshake, so the first visit can wait out a slow order. The ClientHello itself, and the HTTP request after the handshake, keep the server's usual timeouts.

A node keeps a certificate in memory once it has loaded it, at the first handshake or warm pass that needs it. Its renewal comes due when the certificate has min(30 days, one third of its lifetime) left, or up to an hour after that. A renewal first reads the store again and takes a stored copy that is not yet due for renewal itself, instead of ordering a new one. A renewal that fails is tried again 30 to 60 minutes later, and the current certificate is served meanwhile.

At shutdown, after the HTTP drain of up to 30 seconds and up to 5 seconds for the sessions' cleanup, ALPS waits up to 5 seconds for the warm loop to stop and, with S3 storage, up to 10 seconds more for the sync worker. A shutdown therefore takes up to 40 seconds with `"file"` storage and up to 50 with S3, and up to 55 in a cluster, which adds up to 5 seconds for leaving it ([SIGINT and SIGTERM](OPERATIONS.md#sigint-and-sigterm)). The shipped systemd unit's `TimeoutStopSec=60` covers all of it (see [systemd](OPERATIONS.md#systemd-distalpsservice)).

### Staging Directory and RSA Certificates

- `directory_url` (string, default empty = Let's Encrypt production) selects the ACME directory, for example the Let's Encrypt staging directory `https://acme-staging-v02.api.letsencrypt.org/directory` for tests. Any non-production URL gets its own certificate store: `cache_dir` becomes `<cache_dir>-acme-<8 hex chars>`, and the S3 keys go into the folder `acme-<8 hex chars>/` under `prefix` (for example `alps/acme-<8 hex chars>/webmail.example.com` with `prefix = "alps/"`), so test certificates never mix with production ones. The hex characters are derived from the URL.
- `warm_rsa_certs` (bool, default false) also pre-issues the legacy RSA certificate for every domain, which doubles the certificates issued per domain. It is only needed for very old clients without ECDSA support. Without it, such a client still gets an RSA certificate, issued on demand at its first handshake.

### S3 Storage (Multi-Node / Cluster)

ALPS can store ACME certificates in S3-compatible object storage (e.g., AWS S3, MinIO), so that several instances share them. S3 storage alone does not coordinate the nodes: without `[cluster]`, each node acts as a single instance and runs its own warm passes and renewals, so several nodes can order the same certificate at about the same time. For several nodes, use `storage_provider = "s3"` together with `[cluster] enabled = true` (see [Cluster Mode](#4-cluster-mode--gossip-protocol)).

```toml
[tls.letsencrypt]
storage_provider = "s3"                 # The default
cache_dir = "/var/lib/alps/cert-cache"  # Local copy on each node (default: "cert-cache")
sync_interval_minutes = 5               # Retry interval for uploads that failed (default: 5)

[tls.letsencrypt.s3]
bucket = "alps-certs"                   # Required
region = "us-east-1"
prefix = "alps/"                        # Folder in the bucket (default: "", the root)
# endpoint = "minio.example.com:9000"   # Only for non-AWS S3 (MinIO, Backblaze B2, ...)
# access_key = "..."                    # Omit both to use the default AWS credential chain
# secret_key = "..."
```

- `bucket`: Required. At startup ALPS checks the bucket (up to 5 attempts within 10 seconds) and exits if it cannot reach it.
- `endpoint`: Optional for AWS, where the SDK resolves it. When set (MinIO, B2 and others), `https://` is added if no scheme is given, and path-style addressing is used.
- `region`: Defaults to `us-east-1` when an `endpoint` is set. Otherwise the AWS configuration or environment decides.
- `access_key` and `secret_key`: Used only when both are set. Otherwise the default AWS credential chain applies (environment, shared config files, instance or IAM role).
- `prefix`: The folder in the bucket for every S3 key. `"alps"` and `"alps/"` both mean the folder `alps/`. The default is empty, which stores keys at the bucket root.

When configured this way:
1. A node reads a certificate from its local `cache_dir` first. When there is no local copy, it asks S3 (5-second timeout) and saves what it finds locally.
2. New certificates are written to S3 first and then to local disk. If S3 fails, the certificate is kept locally and uploaded later. After an S3 error the node leaves S3 alone for 30 seconds.
3. `sync_interval_minutes` (zero or a negative value means 5) is how often a node retries uploading certificates it could store only on local disk while S3 was failing. Ticks with nothing pending do nothing. When it runs, it uploads local certificates that are missing or older in S3 and copies into `cache_dir` the S3 copies that expire later. The same comparison runs once at startup and after each warm pass. A copy adopted into `cache_dir` is served once the node next reads its store for that certificate.
4. Apart from these comparisons, a node does not poll S3 for renewed certificates. It reads the store for a certificate only when it loads it into memory and when its renewal comes due (see [Issuance and Renewal](#issuance-and-renewal)). If the `cache_dir` copy is then inside its renewal window, the node checks S3, at most once an hour per certificate, and switches to the S3 copy if that copy expires later.
5. ACME challenge tokens are stored in S3 only, never in `cache_dir`. Every node can answer both HTTP-01 and TLS-ALPN-01 from S3, so a validation can land on any node.

---

## 4. Cluster Mode / Gossip Protocol

Several nodes that use Let's Encrypt need `[cluster] enabled = true` as well as S3 storage. [Running Several ALPS Nodes](CLUSTER.md) covers the cluster itself: its keys, leader election, what else it carries, node-local state and session affinity, upgrades, and the settings every node must share. For certificates, the cluster means:

- Only the leader, the member with the lexicographically smallest `node_id`, runs warm passes, and only its certificate manager may store certificates, challenge tokens and the ACME account key. The other nodes read them from S3.
- With the cluster enabled and `provider = "letsencrypt"`, `storage_provider` must be `"s3"` (the default), otherwise startup fails. A cluster that cannot start stops ALPS, which does not fall back to running as a single node.
- No message about certificates goes over the cluster. Apart from the comparisons of `cache_dir` with S3, a node checks S3 for a renewed copy of a certificate only when it loads the certificate and when its renewal comes due, as [S3 Storage](#s3-storage-multi-node--cluster) describes.
- A follower that finds no certificate, or whose renewal comes due before the leader's renewed copy is in S3, orders one from Let's Encrypt itself. The store refuses what it obtains and its challenge tokens stay out of S3, so its validation succeeds only when Let's Encrypt's request reaches that follower.

[Certificates in a Cluster](CLUSTER.md#4-certificates-in-a-cluster) has the details, and the certificate settings every node must share.

---

## 5. Reverse Proxies

If you prefer to place ALPS behind a reverse proxy like Nginx, Caddy, or HAProxy, you should **disable** ALPS's built-in TLS and let the proxy handle it.

```toml
[tls]
enabled = false
```

### Forwarding the Browser-Facing Scheme and Host

When the proxy terminates TLS it speaks HTTPS to the browser but plain HTTP to ALPS. ALPS cannot see the browser's scheme from the connection alone, so **you must forward it** — otherwise ALPS derives `http://your.host` as the expected origin while the browser sends `Origin: https://your.host`, and every state-changing request (login, send, delete) is rejected:

```
CSRF: Origin mismatch: got "https://mail.example.org", expected "http://mail.example.org"
Request error: code=403, message=Invalid origin
```

The same information also decides whether session and login cookies get the `Secure` flag, so forwarding it is a security requirement, not just a convenience.

**Recommended — forward the headers and declare the proxy as trusted:**

**Nginx:**
```nginx
server {
    listen 443 ssl;
    server_name webmail.example.com;

    ssl_certificate     /etc/letsencrypt/live/webmail.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webmail.example.com/privkey.pem;

    # Uploads: max_attachment_mib + 1 MiB, and no less than 32 MiB.
    # Nginx's default of 1m rejects attachments over 1 MiB with 413.
    client_max_body_size 33m;

    location / {
        proxy_pass http://127.0.0.1:1323;
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-Proto $scheme;   # required: https
        proxy_set_header X-Forwarded-Host  $http_host;   # $host drops the port
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP         $remote_addr;
    }
}
```

**HAProxy:**
```haproxy
frontend https-in
    bind :443 ssl crt /etc/haproxy/certs/webmail.example.com.pem
    mode http

    option forwardfor                                           # X-Forwarded-For
    http-request set-header X-Forwarded-Proto https             # required
    http-request set-header X-Forwarded-Host  %[req.hdr(host)]
    http-request set-header X-Real-IP         %[src]

    default_backend alps

backend alps
    mode http
    server alps1 127.0.0.1:1323 check
```

Use `set-header`, not `add-header`: `set-header` drops any copy the client sent before writing its own. ALPS reads the first value of these headers, so the proxy's own value must be the only one. If the frontend also serves plain HTTP, derive the scheme instead of hardcoding it: `http-request set-header X-Forwarded-Proto %[ssl_fc,iif(https,http)]`.

**Caddy:**
```caddyfile
webmail.example.com {
    reverse_proxy 127.0.0.1:1323
}
```

No header directives are needed — `reverse_proxy` sets `X-Forwarded-Proto`, `X-Forwarded-Host` and `X-Forwarded-For` on its own, passes the original `Host` through, and Caddy obtains the certificate automatically. You still have to list the proxy in `trusted_proxies` below, or ALPS will ignore the headers Caddy sends.

Whichever proxy you use, declare it as trusted in `config.toml`:

```toml
[server]
addr = "127.0.0.1:1323"
# Only IPs listed here may set the X-Forwarded-* headers above. ALPS ignores
# them from every other peer, so list only your own proxies.
trusted_proxies = ["127.0.0.1/32", "::1/128"]
```

ALPS honors `X-Forwarded-Proto` and `X-Forwarded-Host` **only** when the immediate peer matches `trusted_proxies`. Setting the headers without `trusted_proxies` (or the reverse) has no effect.

If the proxy listens on a non-default port, `X-Forwarded-Host` must carry it (`webmail.example.com:8443`) — the browser includes the port in `Origin`, so a port-stripped value will not match. This is why the Nginx example uses `$http_host` rather than `$host`; HAProxy's `req.hdr(host)` and Caddy already preserve it.

When a request is rejected, the log line names the likely cause, e.g.:

```
CSRF: Origin mismatch: got "https://mail.example.org", expected "http://mail.example.org"
  (scheme differs and the peer 127.0.0.1 is not in trusted_proxies; behind a TLS-terminating
   proxy, forward X-Forwarded-Proto and list the proxy in trusted_proxies, or set trusted_origins)
```

**Alternative — pin the origin explicitly:**

If your proxy cannot set the forwarded headers, allowlist the browser-facing origin instead:

```toml
[server]
trusted_origins = ["https://webmail.example.com"]
```

The browser's `Origin` must match an entry exactly (scheme + host + port). Note that this covers only the CSRF check; without `X-Forwarded-Proto` from a trusted proxy, cookies are still issued without `Secure`, so prefer the forwarded-header setup where possible.

Do **not** work around the mismatch by rewriting the `Origin` header in the proxy (`proxy_set_header Origin http://$host;`). The CSRF check compares the `Origin` the browser sent with the expected origin, so the proxy must pass `Origin` through unchanged.

### Uploads, the Event Stream and Caching

- **Request body size.** Set the proxy's request-body limit to at least `max_attachment_mib` + 1 MiB, and no less than 32 MiB, the largest message body ALPS accepts. With the defaults that is 33 MiB, as in the Nginx example above. Nginx's own default of `client_max_body_size 1m` rejects every attachment upload over 1 MiB with 413 before ALPS sees it. See [ATTACHMENTS.md](ATTACHMENTS.md) for the attachment limits.
- **Event stream.** With `[server] push_new_mail` on, `GET /events` is an event stream that stays open as long as the page. A reverse proxy must not buffer it (ALPS sends `X-Accel-Buffering: no`, which Nginx honours). Its idle or read timeout (Nginx `proxy_read_timeout`, HAProxy `timeout server`) must be longer than ALPS's 20-second heartbeat. Push works only over HTTPS (or localhost) in the browser. In a cluster the stream must reach the node that holds the session.
- **Caching and compression.** ALPS sends the frontend's content-hashed bundles with `Cache-Control: public, max-age=31536000, immutable` and every other frontend file (including `index.html`) with `no-cache` plus an ETag. It gzips the frontend itself (`Vary: Accept-Encoding`), so the proxy does not need to compress or cache it.
- **Response headers.** Every answer carries `X-Alps-Build`, which open tabs use to offer a reload after an upgrade, so the proxy must pass it through. ALPS sets its own `Content-Security-Policy`, `X-Content-Type-Options` and `X-DNS-Prefetch-Control`, with a stricter sandboxed policy on some answers. A proxy should not replace these headers.
- **Health checks.** ALPS has no dedicated health endpoint. `GET /` returns the built-in `index.html` with 200 and needs no session, so it works as a liveness probe, but it says nothing about whether the IMAP server can be reached. Each probe writes an access-log line unless `[logging] access = false`.

### WebAuthn Behind a Proxy

WebAuthn (2FA with security keys) is bound to the browser-facing hostname and is **not** derived from forwarded headers. Every deployment served under a real hostname, behind a proxy or with built-in TLS, must set `rpid` (the hostname) and `origins` (the exact browser origins, with the port when it is not the default), or registration and verification will fail:

```toml
[webauthn]
rpid = "webmail.example.com"
origins = ["https://webmail.example.com"]
```

The defaults (`localhost`, `http://localhost:1323`, `http://localhost:5173`) work only for local development, and ALPS logs a warning at startup when `rpid` is unset. See [WEBAUTHN.md](WEBAUTHN.md).

### Passing ACME Challenges through a Proxy

This setup applies only when ALPS itself serves HTTPS (`[tls] enabled = true`, `provider = "letsencrypt"`) and another server holds port 80, for example to redirect plain-HTTP visitors. That server must forward `/.well-known/acme-challenge/` to ALPS's `acme_http_addr` (e.g., `127.0.0.1:8080`) with the original `Host` header. Port 443 must still reach ALPS directly, or through TCP passthrough, because ALPS terminates TLS and answers TLS-ALPN-01 there.

**Example Nginx Snippet:**
```nginx
server {
    listen 80;
    server_name webmail.example.com;

    location /.well-known/acme-challenge/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;   # the original Host, without a port
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```
In this scenario, configure ALPS:
```toml
[tls.letsencrypt]
acme_http_addr = "127.0.0.1:8080"
```
