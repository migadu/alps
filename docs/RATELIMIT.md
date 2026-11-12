# ALPS Rate Limiting

ALPS includes a multi-tier rate limiter that limits how often passwords and recovery codes can be tried. It slows down and then stops repeated password guesses, against one account or from one address, and keeps a flood of sign-in attempts from reaching the mail server. It guards the sign-in form and the other requests that check a password or a recovery code, listed under [Protected Endpoints](#protected-endpoints).

## Tiers of Protection

The rate limiter checks three levels, in this order. A request must pass every check to proceed. The username tier applies only to a request that names an account.

### 1. Global Rate Limits
Protects the server from a large volume of sign-in attempts, regardless of the source IP or target username.
- **Metric**: Attempts recorded in the last second across all accounts and addresses. Recorded attempts are successes, refused credentials and errors, at every protected endpoint. Requests the limiter refuses are not counted, and neither are sign-in requests that end up without both a username and a password (from the form or from `alps_login_token`). In a cluster every node also counts the attempts its peers report, so the value is one budget for the whole cluster, not a per-node figure.
- **Config Option**: `global_requests_per_second` (Default: 100)
- **Response**: Once the limit is reached, every protected request is refused with HTTP 429 and `Retry-After: 1`. On `POST /session` the refusal also carries `"code": "server_busy"`, which no other refusal carries, so the sign-in page says the service is busy rather than that the user tried too often.

### 2. IP-Based Rate Limits
Tracks the attempts that come from a single IP address. Each address has two counts.
- **Per-Minute Limit**: `ip_requests_per_minute` (Default: 5). Counts every attempt recorded from the address in the last minute: successful ones, ones whose credentials were refused, and ones that ended in an error instead of an answer to the credentials (mail server unreachable or unable to check them, or the account at its connection limit). Once it is reached, further attempts from the address are refused with HTTP 429 and a wait of 60 seconds.
- **Per-Hour Limit**: `ip_requests_per_hour` (Default: 20). Counts only the attempts from the address whose credentials were refused in the last hour. Successful attempts and attempts that ended in an error do not count, and a success from the address clears the count. Once the count has reached the limit, the address's next attempt is refused and locks the address out for `lockout_minutes` (see [Lockouts](#lockouts)).

Requests the limiter itself refuses are counted in neither. Users who share one address, such as an office or a NAT, share both counts: their successful sign-ins add to the per-minute count but never lock the address out.

*Note: Behind a reverse proxy, ALPS takes the client's address from `X-Forwarded-For` or `X-Real-IP` only when the proxy is listed in `[server] trusted_proxies`. See [Client Addresses Behind a Proxy](#client-addresses-behind-a-proxy).*

### 3. Username-Based Rate Limits
Tracks *failed* attempts for each user account, to limit repeated guesses at one account's password.
- **Metric**: Refused attempts per account, whatever address they come from.
- **Per-15-Minutes Limit**: `username_fails_per_quarter` (Default: 5). Once an account has that many refused attempts in the last 15 minutes, further attempts for the account are refused with HTTP 429 and a fixed wait of 15 minutes (`Retry-After: 900`), whatever the age of those failures. This refusal arms no lockout and clears no count.
- **Per-Hour Limit**: `username_fails_per_hour` (Default: 10). Once an account has that many refused attempts in the last hour, the next attempt for it is refused and locks the account out for `lockout_minutes`. Only this limit locks an account.

*Note: A successful attempt for an account clears the account's recorded failures and any lockout of the account. That covers a sign-in, a correct current-password confirmation, an accepted recovery code, and a successful link of that account. It happens on the node that records the success and on every node that receives its cluster event. The success also clears the hourly failure count of the address it came from. It leaves the address's per-minute count and any lockout of the address unchanged. While an account is locked, its own attempts are refused before the password is checked, so the user has to wait for the lockout to end.*

---

## What Counts as an Attempt

A protected request that gets past the limiter and has its credentials checked ends in one of three outcomes, and each is recorded differently:

| Outcome | Global count | Address per-minute count | Address hourly count | Account failures |
|---|---|---|---|---|
| Success (credentials accepted) | +1 | +1 | cleared | cleared, and any account lockout lifted |
| Credentials refused | +1 | +1 | +1 | +1 |
| Error | +1 | +1 | unchanged | unchanged |

Only a refusal of the credentials counts as a failed attempt. A sign-in can end in an error instead: the mail server cannot be reached, says it cannot check the credentials (an IMAP `NO [UNAVAILABLE]` or `NO [SERVERBUG]`), or answers `[LIMIT]` because the account already holds as many connections as it may. The same goes for a sign-in whose password was accepted but whose security-key record cannot be read (see [WEBAUTHN.md](WEBAUTHN.md)). Such an attempt counts towards the global and per-minute address limits only. It adds nothing to the address's hourly count or the account's failure counts, and it clears none of them. A user who keeps trying through a mail-server outage therefore does not lock their account. Linking an account treats a backend or metadata error the same way. Under the `multi` provider, a username for which no mail server is configured (no route matches and there is no default provider) is a refusal of the credentials, while a failed autodiscovery lookup is an error.

Requests the limiter refuses are not recorded at all.

---

## Lockouts

When an hourly limit has been reached (either by IP or by Username), the next attempt is refused and arms a hard lockout.
- **Config Option**: `lockout_minutes` (Default: 15)

During a lockout, every protected request from the locked address, or for the locked account, is refused with an HTTP 429 Too Many Requests response until the lockout duration expires. Refused requests are not recorded, so retrying during a lockout does not extend it. Arming an address lockout clears that address's counts, and arming an account lockout clears that account's failures, so a lockout does not re-arm by itself when it expires.

The per-minute and per-15-minute limits lock nothing. They refuse with a fixed wait and let attempts through again once fewer than the limit fall within their window.

---

## Responses

When the limiter refuses `POST /session`, ALPS answers HTTP 429 with a `Retry-After` header in whole seconds, rounded up, and the JSON body `{"error": "<English reason>", "retry_after": <seconds>}`. The global limit adds `"code": "server_busy"`. The wait depends on what refused the request:

| Refused by | Wait |
|---|---|
| Global limit | 1 s |
| Address per-minute limit | 60 s |
| Account per-15-minute limit | 900 s |
| Lockout of the address or the account | the time the lockout has left, which is the full `lockout_minutes` on the request that arms it |

The sign-in page counts down the wait and keeps Sign in disabled until it ends. It uses `retry_after`, or the `Retry-After` header when that is missing, or 60 s when both are missing. For `server_busy` it says the service could not sign the user in just now; for every other refusal, that there were too many login attempts.

The other protected endpoints answer with bodies of their own (see the table below).

---

## Protected Endpoints

The same limiter, counts and lockouts guard these requests as well as the sign-in form. A correct answer counts as a success and a wrong one as a failure. A lockout of the account or of the address blocks all of them. Each refusal is HTTP 429 with `Retry-After`, in whole seconds rounded up, so a lockout with less than a second left still says 1.

| Request | Counted against | 429 body |
|---|---|---|
| `POST /session`, including a request without credentials that signs in from the `alps_login_token` cookie (see [SESSIONS.md](SESSIONS.md)) | the account signing in, or the account in the token | `{"error": <reason>, "retry_after": n}`, plus `"code": "server_busy"` for the global limit |
| `POST /accounts`: linking another account | the account being linked, from the requesting address | `{"error": <reason>, "retry_after": n}` |
| `POST /webauthn/verify/recovery`: an accepted recovery code is a success, a refused one a failure (see [WEBAUTHN.md](WEBAUTHN.md)) | the account signing in | `{"error": "rate_limited", "retry_after": n}` |
| The current-password confirmation asked when removing a security key (`POST /settings/2fa/credential/{id}/delete`), when turning on trust for linked accounts (`POST /settings/2fa/trust-linked-accounts`) and when generating recovery codes (`POST /settings/2fa/recovery-codes`) | the session's account | `{"error": "rate_limited", "retry_after": n}` |
| The password plugin's current-password check (`POST /password/change`, see [PASSWORD_CHANGE.md](PASSWORD_CHANGE.md)) | the session's account | `{"error": <reason>, "code": "rate_limited", "retry_after": n}` |

When linking, an account that is already linked counts as a success. A link refused before the password is tried, such as linking the signed-in account to itself, records nothing.

---

## Limits Set by the Mail Server

Two refusals look similar but do not come from `[server.rate_limit]` (see [MAIL_SERVER.md](MAIL_SERVER.md) for how ALPS handles `[LIMIT]`):

- A sign-in the mail server refuses with `[LIMIT]`, because the account holds as many connections as it may, is not a refused password. ALPS records it as an error (global and per-minute address counts only) and answers HTTP 503 `{"error": "connection_limit"}`. The sign-in page then says that too many connections are open to the account, instead of asking for the password again.
- The HTTP 429 `{"error": "search_rate_limited"}` a search can get is the mail server's own limit passed on by ALPS, with the server's wait as `Retry-After` (and `retry_after`) when it names one. The limiter does not count it.

---

## Cluster Synchronization

With `[cluster] enabled = true` (see [CLUSTER.md](CLUSTER.md), and the `[cluster]` section of [CONFIGURATION.md](CONFIGURATION.md)), rate limit events are shared with every node of the cluster.

1. When a node records an attempt (a success, refused credentials or an error), it sends it to the other nodes as a JSON `RateLimitEvent` with a unique ID. Each event goes directly to every member and is also gossiped, so a node can receive it more than once; the node applies each event once, by its ID.
2. The receiving node counts the event in its global and per-address windows. A failure is also added to the address's hourly count and the account's failure counts. An error counts as an attempt only.
3. If a user signs in successfully on Node A, Node A sends the success event. Node B clears the address's hourly failure count and the account's failures, and lifts any lockout of the account on Node B. A lockout of the address is left as it is.
4. Events older than 2 hours are ignored, and timestamps ahead of the receiver's clock are taken as now.

Lockouts themselves are not sent: each node locks an address or an account when its own synchronized counts reach a limit. Each node applies its own `[server.rate_limit]` values to those counts, so give every node the same values. Delivery is best effort, so attempts spread across nodes count towards the same limits once their events arrive.

---

## Where the State Lives

Counts and lockouts are kept in memory in each ALPS process and never written anywhere. Restarting a node clears them. In a cluster, peers do not resend past attempts, so a restarted node counts only the attempts it records or receives from then on. A sweep every 5 minutes forgets recorded attempts older than 2 hours, which is longer than any limit's window.

---

## Configuration Example

Rate limiting is configured within `config.toml` under the `[server.rate_limit]` section (see [CONFIGURATION.md](CONFIGURATION.md) for the full reference).

```toml
[server]
# List your reverse proxies here; leave it out when clients connect to ALPS directly
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

`enabled` (default `true`) turns the whole limiter on or off. With `enabled = false` no request is limited anywhere: sign-in, linking, recovery codes and password confirmations. Every other key takes a positive integer. Leaving a key out, or setting it to 0 or below, keeps its default, so a single tier cannot be turned off by itself. Without a `[server.rate_limit]` section the limiter is on with every default.

> [!WARNING]
> If you are hosting ALPS behind a reverse proxy (like Nginx or HAProxy), you **must** list the IP addresses or CIDR blocks of your proxies in the `trusted_proxies` array of the `[server]` section. Without it, every request carries the proxy's own address, and all users share one address's counts. See [Client Addresses Behind a Proxy](#client-addresses-behind-a-proxy).

---

## Client Addresses Behind a Proxy

Forwarded headers are read only when the connection comes from an address in `[server] trusted_proxies`. Any other peer is identified by the address of its connection, whatever headers it sends. From a trusted peer:

1. `X-Forwarded-For` is read from right to left, skipping addresses in `trusted_proxies`, and the first address not in the list is the client. An entry that is not an IP address ends the walk.
2. `X-Real-IP` is used only when `X-Forwarded-For` gives no such address.
3. When neither gives one, the proxy's own address is used.

Without `trusted_proxies`, every request through a proxy carries the proxy's own address. All users then share one per-address budget and one hourly failure count: by default 5 attempts a minute for the whole site, and 20 refused attempts in an hour, with no success in between, lock everyone out.

List each proxy as an address or a CIDR block. A bare address is taken as `/32` (IPv4) or `/128` (IPv6). An entry that does not parse stops ALPS at startup with `Error generating options: invalid trusted_proxies IP/CIDR ...` and exit status 1. List only addresses that belong to your own proxies. A server that clients reach directly needs no entries.

Have each proxy set `X-Forwarded-For` itself, either by appending the client's address (nginx: `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`) or by replacing the header with it. ALPS reads `X-Real-IP` only when `X-Forwarded-For` gives no address. [TLS.md](TLS.md) has complete proxy examples in its Reverse Proxies section.

The same list decides whether ALPS trusts `X-Forwarded-Proto` and `X-Forwarded-Host` for the CSRF origin check and `X-Forwarded-Proto` for the `Secure` flag on its cookies, and which client address the logs and the access log record. It matters whether or not rate limiting is enabled.

---

## Logging

At startup ALPS logs the values in effect (the lockout duration is not shown):

```
Rate limiting enabled: IP=<n>/min, <n>/hour | User=<n>/15min, <n>/hour | Global=<n>/sec
```

The limiter logs these lines:

- `Rate limit: IP <ip> exceeded per-minute limit (<n>/<limit>)`
- `IP <ip> locked out for <d> after <n> failed attempts in 1 hour`
- `Username <user> locked out for <d> after <n> failed attempts in 1 hour`

Each sign-in the limiter refuses is logged at warn level as `sign-in failed` with `reason=rate limited`, the user, the client address, and the refusal in `detail`. The other endpoints log their own refusals:

- `Linked accounts: linking <user> rate limited`
- `WebAuthn: password confirmation rate limited for <user>`
- `WebAuthn: recovery code rate limited for <user>`
- `Password change: current password check rate limited for <user>`
