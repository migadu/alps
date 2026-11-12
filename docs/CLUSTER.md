# Running Several ALPS Nodes

ALPS keeps no database, so several ALPS processes can serve the same mail server side by side behind a load balancer. This document covers what those nodes share and what they do not: the gossip cluster that `[cluster]` turns on, how nodes are restarted and upgraded, how Let's Encrypt certificates work across nodes, which state stays in one node's memory and the session affinity that follows from it, and the settings every node must share. Every key is also listed in [CONFIGURATION.md](CONFIGURATION.md#7-cluster-cluster).

## Table of Contents
1. [What the Cluster Carries](#1-what-the-cluster-carries)
2. [Configuration](#2-configuration)
3. [Startup, Membership and Shutdown](#3-startup-membership-and-shutdown)
4. [Certificates in a Cluster](#4-certificates-in-a-cluster)
5. [Node-Local State and Session Affinity](#5-node-local-state-and-session-affinity)
6. [Settings Every Node Must Share](#6-settings-every-node-must-share)
7. [Checking the Cluster](#7-checking-the-cluster)

---

## 1. What the Cluster Carries

With `[cluster] enabled = true` (default `false`), the ALPS nodes join one gossip cluster. It carries three things:

1. **Leader election.** The leader is the member with the lexicographically smallest `node_id`. Names are compared as plain strings, so `node-10` sorts before `node-2`. Each node works out the leader again every second and whenever a node joins or leaves. A node that sees no other member is its own leader. Only Let's Encrypt uses the leader (see [Certificates in a Cluster](#4-certificates-in-a-cluster)), and nothing else in ALPS depends on which node leads.
2. **Login rate-limit events.** With rate limiting on (the default), every attempt a node records (a success, refused credentials or an error) is sent to all the other nodes, so the limits and lockouts apply across the whole cluster. A node can receive the same event more than once, but it counts it only once. See [RATELIMIT.md](RATELIMIT.md#cluster-synchronization).
3. **Security-key enrolment notices.** When an account enrols a security key on one node, that node tells the others. The account's sessions on those nodes then read the account's WebAuthn record on their next request. Without the notice they would wait for their periodic read, which a session in use makes at most once a minute. The notice only prompts the read, and the record on the mail server decides. If a notice is lost, the periodic read still finds the key. See [WEBAUTHN.md](WEBAUTHN.md).

The cluster carries nothing else:

- Sessions, uploaded attachments and event streams stay on the node that holds them (see [Node-Local State](#5-node-local-state-and-session-affinity)).
- Certificates are not sent over the cluster, and no message goes out when a certificate is issued or renewed. The nodes share certificates through S3.
- Changes to an account's security keys and recovery codes stay consistent through IMAP METADATA, not through the cluster (see [WEBAUTHN_COORDINATION.md](WEBAUTHN_COORDINATION.md)). With `[cluster]` enabled, recovery codes are offered only when the account's store is IMAP METADATA (see [WEBAUTHN.md](WEBAUTHN.md)).

Several nodes can also run without `[cluster]`. Each one then acts as a standalone instance. It counts rate limits on its own, its sessions learn of a key enrolled on another node only from their own periodic read, and with Let's Encrypt it runs its own warm passes and renewals. A node uses a certificate it finds in a shared S3 store, but nothing stops several nodes from requesting the same certificate at about the same time. Several nodes that use Let's Encrypt therefore need `[cluster]`.

---

## 2. Configuration

```toml
[cluster]
enabled = true
node_id = "node-1"                          # Unique per node (default: the hostname)
bind = "10.0.0.1"                           # This node's IP address (default: "0.0.0.0")
port = 7946                                 # Gossip port, TCP and UDP (default: 7946)
secret_key = "base64-encoded-32-byte-key"   # Generate: openssl rand -base64 32
peers = ["10.0.0.2:7946", "10.0.0.3:7946"]  # The other ALPS nodes
# allow_insecure = false                    # Only for a fully trusted private network
```

| Key | Type | Default | Meaning |
| :--- | :--- | :--- | :--- |
| `enabled` | Boolean | `false` | Joins this node to the gossip cluster. |
| `node_id` | String | The hostname | This node's name. Must be unique and stable, because it decides which node leads. |
| `bind` | String | `"0.0.0.0"` | The IPv4 or IPv6 address to listen on for gossip. `"IP:port"` (`"[IPv6]:port"`) is also accepted, and its port overrides `port`. Anything else stops startup. |
| `port` | Integer | `7946` | The gossip port, on TCP and UDP. 0 also means 7946. |
| `secret_key` | String | None | Standard base64 of exactly 32 bytes. Required unless `allow_insecure = true`. `CLUSTER_SECRET_KEY` takes precedence. |
| `allow_insecure` | Boolean | `false` | Lets the cluster run without a secret key. |
| `peers` | Array of strings | None | The other nodes, as `"host:port"`, or `"host"` for this node's `port`. Joined at startup and every 30 seconds; a literal IP address already among this node's members is skipped. |

### `secret_key` and `CLUSTER_SECRET_KEY`

The key encrypts and authenticates all gossip traffic (AES-256). Every node must use the same one. It must be standard base64 that decodes to exactly 32 bytes. One way to generate it:

```sh
openssl rand -base64 32
```

When the `CLUSTER_SECRET_KEY` environment variable is set, ALPS uses it instead of `secret_key`. This keeps the key out of the config file. A value that does not decode to 32 bytes stops ALPS at startup with `failed to decode cluster secret key`.

Nodes with different keys do not form one cluster. To change the key, give every node the new key and restart them all. Until then, the nodes that have the new key and those that still have the old one form separate clusters, and each cluster elects its own leader.

### `allow_insecure`

Without a secret key, the cluster does not start and ALPS exits, unless `allow_insecure = true` (see [Startup](#3-startup-membership-and-shutdown)). With `allow_insecure = true` and no key, gossip runs unencrypted and unauthenticated, and ALPS logs a warning at startup. Set it only on a fully trusted private network.

### `node_id`

`node_id` defaults to the hostname. It must be different on every node and should stay the same across restarts, because the node with the smallest `node_id` is the leader. Whenever that node is a member, it leads. When it stops, the node with the next smallest name takes over, and when it rejoins, it takes leadership back.

### `bind` and `port`

`bind` takes an IPv4 or IPv6 address, not a hostname or an interface name. It can carry a port (`"10.0.0.1:7946"`, or `"[2001:db8::1]:7946"` for IPv6), which then overrides `port`. A value that is not an address, with or without a port, stops startup with an error that starts with `cluster.bind:`, and so does a port outside 1 to 65535 (the one `bind` carries, or else `port`). The node listens for gossip on that port over both TCP and UDP, and every node must be able to reach every other node's gossip port over both.

With a specific address, the node also advertises that address to its peers. With `0.0.0.0` or `::`, the node advertises a private address of the host, detected automatically. If the host has no private address, the cluster cannot start, and ALPS exits. Set `bind` to the address the peers can reach when the host has no private address, or when it has more than one.

### `peers`

List the other nodes as `"host:port"` (`"[2001:db8::2]:7946"` for IPv6). The host may be a name or an IP address. Without a port, a peer uses this node's own `port`. A node tries to join its peers at startup. A peer that is not up yet is not an error: ALPS logs a warning and starts anyway. Once a node reaches any one member, it learns about the rest of the cluster.

Every 30 seconds, a node tries its configured peers again, skipping a literal IP address and port already among its members. A host name is always retried through memberlist's own DNS lookup, which can discover several nodes behind one name. Finding one of those nodes in the current membership must not hide the others. Until a peer answers, a node that reaches no one is its own leader. Because a node looks for every peer it does not see, two sides of a network split that each still have several nodes find each other again once the network heals. ALPS uses `peers` for nothing else. List all the other nodes, so that a node can find its way back to the cluster whichever of them is up.

A peer listed by an address that is not the one it advertises, for example a public address when the node advertises a private one, never counts as a member. A join that adds no members, whether through such an address or a host name, is logged at debug level only. `cluster rejoined peers` is logged at info level only when membership grows. List each node by the address it advertises: the address the other nodes log for it in `node joined cluster`.

---

## 3. Startup, Membership and Shutdown

ALPS starts the cluster before it starts the TLS manager and the HTTP server. With `[cluster]` enabled, any of these stops ALPS with exit status 1:

- a `bind` that is not an IP address with an optional port, or a port outside 1 to 65535 (see [`bind` and `port`](#bind-and-port));
- no secret key, and `allow_insecure` not set;
- a key that does not decode to 32 bytes;
- a gossip port that cannot be bound;
- with `bind = "0.0.0.0"` or `"::"`, no private address to advertise.

A bad `bind` or port is found when the configuration is read, before the log is open, and is written to standard error (`Error generating options: cluster.bind: ...`). For the others, ALPS logs the reason to its `[logging]` output, in a line that starts with `failed to initialize cluster`, or `failed to decode cluster secret key` for a bad key. ALPS does not fall back to running as a standalone node. A standalone node would issue Let's Encrypt certificates on its own.

A node whose startup fails after it has joined, at the server setup, WebAuthn, TLS or the HTTP listener, leaves the cluster before it exits, as at a shutdown (below), so the other nodes see it leave rather than detect a failure.

With `[tls] enabled = true`, `provider = "letsencrypt"` and the cluster enabled, `storage_provider` must be `"s3"` (the default). `"file"` stops startup, because each node's `cache_dir` is its own, so the followers would have no source of certificates (see [Certificates in a Cluster](#4-certificates-in-a-cluster)).

On SIGINT or SIGTERM, ALPS first stops serving HTTP, waiting up to 30 seconds for open requests. It then stops the certificate manager, which with Let's Encrypt takes up to 5 seconds, or up to 15 with S3 storage, and closes its sessions, waiting up to 5 seconds for their cleanup. Last, it leaves the cluster, waiting up to 5 seconds for the leave to go out, so the other nodes see it leave and do not have to detect a failure. A node with Let's Encrypt, which in a cluster always uses S3, therefore takes up to 55 seconds to stop, and one without it up to 40 seconds ([SIGINT and SIGTERM](OPERATIONS.md#sigint-and-sigterm)). A node that is killed drops out of the cluster once the others' failure detection notices it is gone. In both cases the remaining nodes work out the leader again. With Let's Encrypt, the new leader takes over the certificate warm passes (see [Certificates in a Cluster](#4-certificates-in-a-cluster)). [OPERATIONS.md](OPERATIONS.md) covers signals and what a restart loses.

### Restarting and Upgrading

Nodes that keep the same ALPS binary can be restarted one at a time, to apply a configuration change for example. The other nodes go on serving, and with the same `login_key` on every node, the browsers of the restarted node are restored on whichever node they reach (see [A Request on Another Node](#a-request-on-another-node)). A change to one of the [settings every node must share](#6-settings-every-node-must-share) takes effect node by node, so the nodes disagree on it until the last one has restarted. A new `secret_key` needs every node restarted (see [`secret_key`](#secret_key-and-cluster_secret_key)).

A new ALPS binary is not rolled out node by node: every node is upgraded together. Stop all the nodes that run the old binary, and start the new ones only once every old one has exited. Mixing binaries is not supported (see [Recovery Codes](WEBAUTHN.md#recovery-codes) and [Deployment and rollback](WEBAUTHN_COORDINATION.md#deployment-and-rollback)).

The nodes can stop and start in any order, and no node has to go first. Leadership is worked out from the members' names, not handed over: the node with the smallest `node_id` leads whenever it is a member, so it leads again as soon as it has joined the others, whichever node started first. Until a node has joined the others it is its own leader, which is why the first certificate warm pass waits 60 to 120 seconds after startup (see [The leader issues](#the-leader-issues)). The sessions of the old nodes end with them. With `login_key` set and unchanged, the browsers are restored from their login token on the new nodes, and without it every user signs in again ([What a Restart Loses](OPERATIONS.md#2-what-a-restart-loses)).

---

## 4. Certificates in a Cluster

This section applies to `[tls] provider = "letsencrypt"`. With `provider = "file"`, each node loads its own `cert_file` and `key_file`, and the cluster plays no part in certificates. [TLS.md](TLS.md) covers both providers, the challenges and the S3 settings.

### The leader issues

Only the leader runs the certificate warm passes, and only the leader's certificate manager can store the certificates it obtains, so the certificates in S3 are issued and renewed by the leader.

- The first pass runs 60 to 120 seconds after startup (chosen at random), then every 12 hours. A node that becomes leader runs one as soon as it notices, and it checks for that every 15 seconds. Passes are never less than 15 minutes apart. The startup delay leaves time for the nodes to find each other, since a node that has not yet joined the others is its own leader.
- Each pass makes sure every domain in `domains` has a certificate (ECDSA, plus RSA when `warm_rsa_certs` is set) and requests one where none is stored. It checks leadership again before each domain and stops if this node is no longer the leader. After the domains, it compares its `cache_dir` with S3, as every node does at startup (see below). The leader renews a certificate it holds when the certificate enters its renewal window ([Issuance and Renewal](TLS.md#issuance-and-renewal)).
- A pass is put off while the node is pausing S3 after an error (30 seconds), and runs at the next 15-second check after that pause.

With the cluster enabled, only the leader's certificate manager may store or delete entries in the certificate store: certificates, challenge tokens and the ACME account key. A follower's attempt to store one is refused and logged as `cluster cache: certificate request BLOCKED - not cluster leader (leader will handle it)`. The comparison with S3 that every node makes at startup is separate from this and runs on followers too.

### Followers read S3

A follower gets certificates from S3 in three ways:

1. **On a local miss.** When a handshake needs a certificate that the node does not hold in memory and that is not in its `cache_dir`, the node reads it from S3 (5-second timeout) and keeps a local copy.
2. **When its renewal comes due.** A node keeps a certificate in memory once it has loaded it, and reads the store for it again only when its renewal comes due, within an hour of the certificate entering the last third of its lifetime (at most its last 30 days). The node then reads its `cache_dir` copy and, while that copy is inside the window, checks S3 (at most once an hour per certificate). It switches to the S3 copy if that copy expires later. A node that loads a certificate already inside that window, after a restart for example, makes the same check when it loads it.
3. **At startup.** Every node, leader or follower, compares its `cache_dir` with S3 once. It uploads local certificates that S3 lacks or holds an older copy of, and it copies into `cache_dir` the S3 copies that expire later. A copy adopted this way is served once the node next reads its store for that certificate.

A follower that finds no certificate on disk or in S3, or whose renewal comes due before the leader's renewed copy is in S3, orders one from Let's Encrypt itself, as a single node would. It orders with the ACME account key the leader stored in S3. Until the leader has stored one, in a new cluster for example, the follower's order fails, and so does the handshake that needed it. The store refuses what the follower obtains (the `BLOCKED` line above), and its challenge tokens do not reach S3, so the validation succeeds only when Let's Encrypt's request reaches that follower. What happens next depends on why the follower ordered:

- **On a miss**, the follower keeps the certificate it obtained in its memory only and serves it until that certificate's renewal comes due. It then reads the store again and takes the leader's copy from S3 if that copy is not yet due for renewal itself. Otherwise the renewal goes on as in the next case.
- **At a renewal**, the follower does not use a certificate the store refused. The renewal counts as failed and is tried again 30 to 60 minutes later, each try reading the store first, while the follower keeps serving its current certificate. The follower switches to the leader's copy once one of these tries finds it in S3.

Apart from these reads, a follower does not look in S3 for certificates. `sync_interval_minutes` (default 5) is how often a node checks whether certificates it could store only locally, while S3 was unreachable, still need uploading. A follower stores no certificates, so it normally has nothing to upload.

### Challenges on any node

Every node runs the ACME HTTP-01 handler on `acme_http_addr` (default `":80"`) and answers TLS-ALPN-01 on its HTTPS listener ([Challenges and Ports](TLS.md#challenges-and-ports)). The leader publishes its challenge tokens to S3 only, never to `cache_dir`, and every node reads them from there. Let's Encrypt's validation request can therefore reach any node, wherever the load balancer sends it.

### Requirements

- `storage_provider = "s3"` (the default). ALPS enforces this at startup.
- The same S3 bucket and `prefix` on every node, so the followers read what the leader stores.
- The same `domains` on every node. The leader warms the domains in its own list, and each node answers handshakes only for the domains in its own list.
- The same `directory_url` on every node. A non-production directory gets its own `cache_dir` and S3 prefix (see the staging section of [TLS.md](TLS.md#staging-directory-and-rsa-certificates)).

---

## 5. Node-Local State and Session Affinity

Each node keeps the following in its own memory (and, for uploads, its own temp directory). None of it is shared with the other nodes:

- each session, with its IMAP connections and its cache ([SESSIONS.md](SESSIONS.md));
- the session's uploaded attachments ([ATTACHMENTS.md](ATTACHMENTS.md));
- a sign-in waiting for its security key, and any WebAuthn sign-in or enrolment in progress ([WEBAUTHN.md](WEBAUTHN.md));
- the session's `/events` stream, when `push_new_mail` is on ([CONFIGURATION.md](CONFIGURATION.md#14-pushing-new-mail)).

The rate-limit counts are in memory too. The cluster keeps them in step between nodes, but they are never written anywhere ([RATELIMIT.md](RATELIMIT.md#where-the-state-lives)).

### Session affinity

The load balancer must send every request from a browser to the node that signed it in. This is called session affinity, or sticky sessions. Use an affinity cookie that the load balancer sets itself, or source-IP affinity. ALPS issues a new `alps_session` value at sign-in, at a session restore and at an account switch. Affinity keyed on that cookie's value would have to follow those changes.

### A request on another node

When a request reaches a node that does not hold its session (after a failover or a restart, or without affinity), one of two things happens:

- **With `login_key` set**, and the same on every node, the node decrypts the `alps_login_token` cookie and opens a separate new session for the user, with a new `alps_session` cookie. The new session keeps the token's "Stay signed in after closing the browser" choice and its second-factor state, and it signs in to IMAP again. It starts without the old session's uploads, ceremonies and event stream. At its next save or send, the composer lists the missing files to add again ([ATTACHMENTS.md](ATTACHMENTS.md)). A security-key sign-in or enrolment begun on the other node has to start over. The old session stays on its node until it ends at one of its limits. A browser that keeps moving between nodes opens a new session on every move. See [Session Restoration](SESSIONS.md#session-restoration).
- **Without `login_key`**, or when this node's `login_key` differs, no session can be restored. The node clears the browser's session cookies (and, when its `login_key` differs, the login token it cannot decrypt) and answers 401, so the user signs in again. The browser no longer holds its old session either, so it is signed out on its original node too.

---

## 6. Settings Every Node Must Share

Must be the same on every node:

- **`[server] login_key`**, so that any node can restore a session from the login token. It also encrypts the credentials stored for linked accounts and the separate CalDAV and CardDAV passwords users save, so account switching and those connections need the same key on every node ([SESSIONS.md](SESSIONS.md#session-persistence-login_key)).
- **`[webauthn] rpid` and `origins`.** A security key is bound to the RP ID it was enrolled under. `origins` must list every browser-facing origin the load balancer serves ([WEBAUTHN.md](WEBAUTHN.md)).
- **`[cluster] secret_key`** (or `CLUSTER_SECRET_KEY`), and a gossip port that every other node can reach over TCP and UDP.
- **`[server.rate_limit]`.** Each node applies its own values to the shared counts ([RATELIMIT.md](RATELIMIT.md#cluster-synchronization)).
- **The mail server settings** (`[provider]` and `[smtp]`), and the plugins with their servers (`[plugin.<name>]`), so that a session on any node reaches the same servers and offers the same features. `[server] dav_allow_private_servers` belongs here too: a node without it refuses the users' own DAV connections that need it ([CDAV.md](CDAV.md#personal-servers)).
- **With Let's Encrypt**: `domains`, `directory_url`, and the same S3 bucket and prefix (see [Requirements](#requirements)).

Must differ on every node:

- **`node_id`**: unique per node. The default, the hostname, is fine when every host has its own name.

May differ per node: `bind`, `peers` (each node lists the others) and `[server] addr`. When the load balancer is an HTTP proxy, list it in `[server] trusted_proxies` on every node, so that each node sees the browser's address and scheme. The rate limits count per address (see the Reverse Proxies section of [TLS.md](TLS.md), and [RATELIMIT.md](RATELIMIT.md#client-addresses-behind-a-proxy)).

---

## 7. Checking the Cluster

ALPS has no status endpoint for the cluster. Its state shows in the log:

- `cluster started`, once at startup, with `node_name`, `bind_addr`, `bind_port`, `advertise_addr` (empty with `bind = "0.0.0.0"`, since the detected address is not shown), `advertise_port`, `members`, `leader` and `is_leader`;
- `gossip encryption enabled (AES-256)`, or a warning that it is disabled when the cluster runs without a key under `allow_insecure`;
- `failed to join some peers (may be first node)` when no listed peer answered at startup, and `cluster rejoined peers` when a later attempt found nodes this node did not see;
- `node joined cluster` and `node left cluster`, with the node's name and address;
- `cluster leader changed`, with `old_leader`, `new_leader` and `is_leader`;
- with Let's Encrypt, `TLS certificate cache wrapped with cluster-aware leader gating` at startup.

These lines, and those of the certificate manager, go through `[logging]` like the rest of the log: to its `output`, in its `format`, and only when their level reaches its `level`.
