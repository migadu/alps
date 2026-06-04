# ALPS TLS Configuration Guide

ALPS provides built-in Transport Layer Security (TLS) termination, allowing you to serve the application securely over HTTPS without requiring an external reverse proxy (like Nginx or Caddy), though using one is still supported.

This document details the TLS capabilities in ALPS and how to configure them in your `config.toml`.

## Table of Contents
1. [Overview](#overview)
2. [File Provider (Manual Certificates)](#file-provider-manual-certificates)
3. [Let's Encrypt Provider (Automatic Certificates)](#lets-encrypt-provider-automatic-certificates)
   - [Basic Setup](#basic-setup)
   - [S3 Storage (Multi-Node / Cluster)](#s3-storage-multi-node--cluster)
4. [Cluster Mode / Gossip Protocol](#cluster-mode--gossip-protocol)
5. [Reverse Proxies](#reverse-proxies)

---

## 1. Overview

To enable built-in TLS, you must configure the `[tls]` section in `config.toml` and set `enabled = true`.

ALPS supports two certificate providers:
- **`file`**: Use your own pre-generated SSL certificates.
- **`letsencrypt`**: Automatically request, renew, and manage certificates using the ACME protocol.

```toml
[tls]
enabled = true
provider = "file" # or "letsencrypt"
```

> [!NOTE]
> Even when TLS is enabled, ALPS will only bind to the address specified in `[server].addr`. Ensure this port is accessible, or use port forwarding (e.g., forwarding 443 to 1323) if running as an unprivileged user.

---

## 2. File Provider (Manual Certificates)

Use the `file` provider if you already have SSL certificates (e.g., from a commercial CA, your own internal CA, or provisioned externally by Certbot).

```toml
[tls]
enabled = true
provider = "file"
cert_file = "/path/to/fullchain.pem"
key_file = "/path/to/privkey.pem"
```

- `cert_file`: The path to the complete certificate chain (server certificate + intermediate CA).
- `key_file`: The path to the private key.

Ensure the user running the ALPS process has read permissions for these files.

---

## 3. Let's Encrypt Provider (Automatic Certificates)

ALPS can seamlessly manage TLS certificates for you via Let's Encrypt. It uses the HTTP-01 challenge or TLS-ALPN-01 challenge.

### Basic Setup (Single Node)

For a single server deployment, ALPS will store the fetched certificates in a local filesystem cache.

```toml
[tls]
enabled = true
provider = "letsencrypt"

[tls.letsencrypt]
email = "admin@example.com"             # Important for expiration notices
domains = ["webmail.example.com"]       # Domains to request certificates for
default_domain = "webmail.example.com"  # Fallback for SNI-less clients
storage_provider = "file"               # Use local file cache
cache_dir = "cert-cache"                # Directory to store certificates
acme_http_addr = ":80"                  # Address to listen on for HTTP-01 challenges
```

> [!IMPORTANT]
> The HTTP-01 challenge requires Let's Encrypt to be able to reach your server on port `80`. If ALPS binds `acme_http_addr = ":80"`, you must ensure ALPS can bind to port 80 (requires root/CAP_NET_BIND_SERVICE) or configure a port forward from external port 80 to your `acme_http_addr`.

### S3 Storage (Multi-Node / Cluster)

If you run multiple instances of ALPS behind a load balancer, they need to share certificates to avoid hitting Let's Encrypt's strict rate limits. ALPS supports storing ACME certificates in an S3-compatible object storage (e.g., AWS S3, MinIO).

```toml
[tls.letsencrypt]
storage_provider = "s3"
cache_dir = "cert-cache"               # Fallback cache on the local disk
sync_interval_minutes = 5              # How often to sync the local cache with S3

[tls.letsencrypt.s3]
endpoint = "s3.amazonaws.com"
bucket = "alps-certs"
region = "us-east-1"
prefix = "alps/"
# access_key = "..." # Omit if using IAM Roles / Instance profiles
# secret_key = "..."
```

When configured this way:
1. ALPS will attempt to load the certificate from S3.
2. If it is renewing a certificate, it uploads the new cert to S3.
3. Other ALPS nodes will periodically sync from S3 to their local `cache_dir` to ensure they have the latest certificates.

---

## 4. Cluster Mode / Gossip Protocol

To make certificate synchronization across multiple nodes instantaneous (rather than waiting for the `sync_interval_minutes`), you can enable ALPS's internal cluster gossip protocol.

When an ALPS node successfully renews a Let's Encrypt certificate and uploads it to S3, it will broadcast a message over the gossip protocol to all other nodes. The receiving nodes will immediately flush their old certificates from memory and fetch the new one from S3.

```toml
[cluster]
enabled = true
bind = "0.0.0.0"                        # Interface to bind the gossip listener
port = 7946                             # Gossip port (ensure firewall allows UDP/TCP 7946)
secret_key = "your-base64-secret-key"   # Generate via: openssl rand -base64 32
peers = ["10.0.0.2:7946", "10.0.0.3:7946"] # Addresses of other ALPS nodes
```

- **`secret_key`**: Symmetrically encrypts the cluster traffic so no rogue nodes can join.
- **`peers`**: Provide a list of known nodes. The cluster will auto-discover the rest once connected to a single active peer.

---

## 5. Reverse Proxies

If you prefer to place ALPS behind a reverse proxy like Nginx, Caddy, or HAProxy, you should **disable** ALPS's built-in TLS and let the proxy handle it.

```toml
[tls]
enabled = false
```

### Passing ACME Challenges through a Proxy

If you still want ALPS to manage its own Let's Encrypt certificates but it sits behind a proxy, you must route the ACME HTTP-01 challenges to ALPS's `acme_http_addr` (e.g., `:8080`).

**Example Nginx Snippet:**
```nginx
server {
    listen 80;
    server_name webmail.example.com;

    location /.well-known/acme-challenge/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
    }
}
```
In this scenario, configure ALPS:
```toml
[tls.letsencrypt]
acme_http_addr = ":8080"
```
