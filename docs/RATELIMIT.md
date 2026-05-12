# ALPS Rate Limiting

ALPS includes a robust, multi-tier rate limiter designed to protect the authentication endpoints from brute force attacks, credential stuffing, and volumetric denial-of-service.

## Tiers of Protection

The rate limiter operates on three distinct levels. A login request must pass all three checks to proceed.

### 1. Global Rate Limits
Protects the server from being overwhelmed by a massive volume of requests, regardless of the source IP or target username.
- **Metric**: Total login requests per second across all users.
- **Config Option**: `global_requests_per_second` (Default: 100)

### 2. IP-Based Rate Limits
Tracks all login attempts originating from a single IP address to stop single bad actors.
- **Metric**: Total login attempts (both successful and failed).
- **Per-Minute Limit**: `ip_requests_per_minute` (Default: 5). If exceeded, the IP receives an HTTP 429 response.
- **Per-Hour Limit**: `ip_requests_per_hour` (Default: 20). If exceeded, the IP is placed in a hard lockout.

*Note: ALPS respects `X-Forwarded-For` and `X-Real-IP` headers to accurately identify client IPs when deployed behind a proxy.*

### 3. Username-Based Rate Limits
Tracks *failed* login attempts against specific user accounts to prevent targeted brute-forcing. 
- **Metric**: Failed login attempts per username.
- **Per-15-Minutes Limit**: `username_fails_per_quarter` (Default: 5). 
- **Per-Hour Limit**: `username_fails_per_hour` (Default: 10). If exceeded, the username is placed in a hard lockout.

*Note: A successful login immediately clears all recorded failures for that username, unlocking the account.*

---

## Lockouts

When an hourly limit is breached (either by IP or by Username), a hard lockout is enforced.
- **Config Option**: `lockout_minutes` (Default: 15)

During a lockout, any further requests matching the blocked IP or Username are immediately rejected with an HTTP 429 Too Many Requests response, until the lockout duration expires.

---

## Cluster Synchronization

If ALPS is running in a multi-node cluster (with the gossip protocol enabled), rate limit events are synchronized across the entire cluster in real-time.

1. When a node processes a login attempt, it records it locally and broadcasts a `RateLimitEvent` payload over the gossip network.
2. Other nodes receive the event and increment their own global, IP, and username counters.
3. If a user successfully logs in on Node A, Node A broadcasts the success event. Node B receives this and immediately clears the user's failure count, ensuring the user is not accidentally locked out on Node B.

This design prevents attackers from bypassing rate limits by round-robining their brute-force requests across multiple ALPS nodes behind a load balancer.

---

## Configuration Example

Rate limiting is configured within `config.toml` under the `[server.rate_limit]` section.

```toml
[server]
# Enable this if ALPS is behind a proxy to safely read X-Forwarded-For headers
trusted_proxies = ["127.0.0.1/32", "::1/128", "10.0.0.0/8"]

[server.rate_limit]
enabled = true
ip_requests_per_minute = 5
ip_requests_per_hour = 20
username_fails_per_quarter = 5
username_fails_per_hour = 10
global_requests_per_second = 100
lockout_minutes = 15
```

> [!WARNING]
> If you are hosting ALPS behind a reverse proxy (like Nginx or HAProxy), you **must** configure the `trusted_proxies` array in the `[server]` section with the IP addresses or CIDR blocks of your proxies. Only then will ALPS securely identify client IPs from the `X-Forwarded-For` or `X-Real-IP` headers.
> 
> Conversely, if ALPS is directly exposed to the internet (e.g. using the built-in TLS Let's Encrypt feature), leave `trusted_proxies` empty or commented out. Otherwise, attackers could bypass rate limits by spoofing these headers!
