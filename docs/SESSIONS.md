# Session Management in ALPS

ALPS keeps no database. Each signed-in browser has a session in the memory of the ALPS process, and each session holds its own connection to the mail server. This document explains how ALPS opens, keeps and ends sessions, how a session is restored from the encrypted login token, how linked accounts and account switching work, and where the per-account state is kept.

---

## The Session Architecture

When a user signs in, ALPS creates a **Session** object in memory.

1. **Mail connections**: Each session holds its own connection to the mail provider (the IMAP server, or the maildir), opened at sign-in and kept while the session lasts. When the mail server drops it, the session opens another. No pool is shared between sessions. ALPS therefore does not sign in again or select the mailbox again on every HTTP request. Work the user is not waiting for (checks for new mail, sender verdicts, the search of Sent for a conversation's replies, draft saves, messages a conversation reads ahead) runs on a second connection, opened when first needed and closed after a minute unused, so that it does not hold up what the user opens. A session opens no more than this one beside its own. When the server will not open the second, that work runs on the first, and the session does not ask for the second again for five minutes. A connection given up on mid-command stays open until that command returns. Until then, the session's own work does not wait for a busy background connection, but opens its own beside it. The second connection is on unless `background_connection` is turned off; see [CONFIGURATION.md](CONFIGURATION.md). With `push_new_mail` on, the second connection also waits in IDLE on the Inbox while a mail page holds its event stream open, ends the wait for any background work and begins it again after, and tells the page of each message that arrives in the Inbox or leaves it. With `push_subscribed_folders` as well, and a mail server with NOTIFY, it also asks the server for the news of the subscribed folders, and tells the page of them too.
2. **SMTP**: No SMTP connection is kept open. Every send dials the submission server named by `[smtp] server` (`smtps://` for TLS, `smtp://` for STARTTLS, `smtp+insecure://` for plain), or the one the provider names for the account's domain. It says EHLO, authenticates with AUTH PLAIN using the session's credentials, runs the operation and sends QUIT. An attempt that fails on a lost connection or a temporary (4xx) reply is tried again on a fresh connection, up to 3 attempts in all, with pauses of 1 s and 2 s. Refused credentials, permanent (5xx) replies, and a connection lost while or after the message is written are not retried; the last could deliver the message twice. See [MAIL_SERVER.md](MAIL_SERVER.md).
3. **The Session Cookie**: ALPS issues an `alps_session` HTTP-only cookie to the user's browser. This cookie contains a unique, random token that maps the browser to the in-memory Session object on the server.
4. **Caching**: Each Session has its own cache for message lists, flags and message structure. It is not shared with other sessions.

### Cookies

| Cookie | Holds | Read by the page | Lifetime |
| --- | --- | --- | --- |
| `alps_session` | The token that names the in-memory session | No (HttpOnly) | 30 days when the user ticked "Stay signed in after closing the browser", otherwise until the browser closes |
| `alps_logged_in` | `1`, telling the page a session was issued | Yes | Same as `alps_session` |
| `alps_login_token` | The encrypted login token (only with `login_key`) | No (HttpOnly) | 30 days when the user ticked "Stay signed in after closing the browser", otherwise until the browser closes |
| `alps_has_login_token` | `1`, telling the page a login token was issued (it is also set at sign-in without `login_key`) | Yes | Same as `alps_login_token` |
| `alps_2fa_pending` | The token of a session waiting for its second factor | No (HttpOnly) | 5 minutes |

Every one of them has `Path=/` and `SameSite=Strict`. They carry `Secure` when the browser's connection is HTTPS: ALPS terminates TLS itself, or the immediate peer is listed in `[server] trusted_proxies` and sends `X-Forwarded-Proto: https`. Behind a TLS-terminating proxy that is not listed in `trusted_proxies`, all of these cookies are sent without `Secure`; see [Reverse Proxies in TLS.md](TLS.md#5-reverse-proxies).

---

## Session Lifetime

An in-memory session ends at the first of these:

1. **The idle window.** The session ends once no authenticated request has reached it for this long. Every authenticated request resets the window, including the ones an open page makes by itself, such as its checks for new mail and the requests of its idle timer (below). The window is the auto-logout time stored in the account's settings (`auto_logout` in `base.settings`; Settings offers Never, 15, 30, 60, 120 or 360 minutes), or `[server] session_minutes` (default 30) for an account whose settings hold none. It is read when the session opens. When Settings saves a new auto-logout time, the session it was saved through takes the new time at once; the account's other sessions keep the time they opened with. A stored time above `max_session_minutes` is capped to it. `max_session_minutes` defaults to 0, meaning no cap. "Never" gives `max_session_minutes`, or one year when no cap is set.
2. **The absolute ceiling**, `absolute_session_hours` (default 168, which is 7 days; any negative value, such as -1, disables it; never shorter than `session_minutes`). It ends a session however much it is used, including with "Never".
3. **The session caps**, `max_sessions` (default 10000) and `max_sessions_per_user` (default 10). A new session beyond either cap evicts the least recently used session (of all, or of that user). 0 keeps these defaults, and any negative value, such as -1, turns that cap off.

For an account whose settings hold no auto-logout time, `GET /settings` reports `auto_logout` 30, so Settings shows 30 minutes and the page's idle timer uses 30 minutes. Any save of the settings record, including a sort order or folder order changed outside Settings, writes the whole record and stores that 30 in it, and the sessions the account opens after that use it. As an idle window, `session_minutes` therefore applies only on the server, and only to an account whose settings hold no time, such as one that has not saved a setting yet. For such an account, an open page still signs out after 30 idle minutes; `session_minutes` decides how long the session lasts once no page sends it requests, for example after the tab is closed.

The page has an idle timer of its own. It counts the user's input (keys, pointer, touch and scrolling, inside message frames too), not requests, and the browser's tabs share one idle clock. While an auto-logout time is set, it requests `GET /session` at most every five minutes while the user is active, which keeps the session's idle window open, and once the user has been idle for the time shown in Settings, it saves the open drafts and signs out itself (`DELETE /session`). With "Never" the page does neither.

A session that ends at one of the three limits is restored from the login token on the browser's next request, if the browser holds a valid one (see [Session Restoration](#session-restoration)).

The log line `session ended` names the reason: `idle` and `max-age` for limits 1 and 2, `evicted` for limit 3, and otherwise `sign-out`, `switched`, `auth-error` or `mail-server-unavailable`. It is logged only for sessions that were issued to a browser, and not at shutdown.

All of these keys are in the `[server]` section; see [CONFIGURATION.md](CONFIGURATION.md).

---

## Signing Out

Besides the limits above, a session ends in these ways:

1. **Sign Out**, and the page's auto-logout timer, send `DELETE /session`. It closes the session and clears `alps_session`, `alps_logged_in`, `alps_login_token` and `alps_has_login_token`, even when no live session could be found.
2. **A password the mail server refuses** during any request closes the session and clears the same four cookies, and the request gets 401.
3. **A mail connection that cannot be opened again**, because the mail server cannot be reached or will not open another connection for the account, ends the in-memory session, but the browser keeps its cookies and the request gets 503 `{"error":"mail_server_unavailable"}`. If the browser holds a login token, a request made once the server is back restores the session from it.
4. **An account switch** closes the session it switches from (see [Account Switching](#account-switching)).

---

## Session Persistence (`login_key`)

Because ALPS stores Session objects in memory, **all sessions are lost if the ALPS server restarts**. To prevent users from being abruptly logged out during server updates or restarts, ALPS implements an encrypted session restoration mechanism. Without `login_key`, no session is restored, and account linking and switching are unavailable.

### The `alps_login_token`

If you configure a `login_key` in the `[server]` section of `config.toml`, ALPS writes a second cookie, `alps_login_token`, at every successful sign-in, whatever the sign-in box says (the box only sets the cookie's expiry). For an account that signs in with a security key, the token is written only once the key or a recovery code has been given, not at the password step.

The key is 32 random bytes, encoded as standard or URL-safe base64, or as 64 hexadecimal characters. One way to generate it:

```sh
openssl rand -base64 32
```

A value that does not decode to 32 bytes stops ALPS at startup with `Error generating options: invalid login key`.

The token is the JSON `{Version, Username, Password, Verified2FA, Persistent}`:
- `Version`: the token format, currently 1. A token with a version below 1 is read as one whose second factor was not given.
- `Username` and `Password`: the credentials the session is opened again with.
- `Verified2FA`: whether the sign-in gave its second factor.
- `Persistent`: the sign-in page's "Stay signed in after closing the browser" box (sent as the `remember-me` field).

**This payload is encrypted and signed with `login_key` (Fernet)**. It cannot be read or changed in the browser.

### Token Lifetime

A login token is refused 30 days after it was written, whether or not the box was ticked. Ordinary use does not extend it: a restore issues `alps_session` and `alps_logged_in` again (with a fresh 30-day expiry when kept) but leaves the token unchanged. A fresh token is written only by:
- a sign-in (`POST /session`, including one made from the token itself);
- giving the second factor at sign-in;
- enrolling a security key, when the browser already holds a valid token;
- a password change through the password plugin, when the token is for the same user (see [PASSWORD_CHANGE.md](PASSWORD_CHANGE.md));
- an account switch (see [Account Switching](#account-switching)).

A kept sign-in therefore lasts at most 30 days from the last of these. After that, once the in-memory session ends, the user signs in again.

### Session Restoration

ALPS tries a restore only when the browser sends an `alps_session` cookie that names no in-memory session (for example, the server restarted, or the session reached one of its limits). It reads `alps_login_token`, decrypts it with `login_key`, and the outcome is one of these:

1. **Success**: a new in-memory session is opened with the token's credentials, a new `alps_session` and `alps_logged_in` are issued with the token's persistence choice, any `alps_2fa_pending` cookie is cleared, and the request proceeds. The login token itself is not rewritten.
2. **Second factor needed**: the restored session goes through the same second-factor check as any other. If the token does not say the second factor was given and the account has a security key, the request gets 401, and the user signs in again with the password and the key.
3. **Password refused**: the mail server refuses the token's password. `alps_session`, `alps_logged_in`, `alps_login_token` and `alps_has_login_token` are cleared, and the request gets 401.
4. **Mail server unavailable**: the mail server cannot be reached, or a session cannot be opened for another reason (for example, the account's security-key record cannot be read). Every cookie is kept, the request gets 503 `{"error":"mail_server_unavailable"}`, and the next request tries again.
5. **No usable token**: there is no token, or it cannot be decrypted, or it is more than 30 days old. The session cookies are cleared along with an unusable token cookie, and the request gets 401.

Whatever the outcome, the public paths (`POST` and `DELETE /session`, `/webauthn/verify*` and plugin assets) still reach their handlers.

Separately, `POST /session` with an empty username and password signs in from the token. It keeps the token's persistence choice, goes through the login rate limits like a normal sign-in (see [RATELIMIT.md](RATELIMIT.md)), asks for the second factor unless the token records that it was given, and answers 400 `Missing credentials` when there is no usable token.

### Changing the Key

`login_key` encrypts two things: the login tokens, and the passwords stored in each account's `linked_accounts` entry. Login tokens expire 30 days after they were written. Linked-account credentials do not expire.

> [!WARNING]
> Rotating or changing `login_key` makes every login token unreadable, so users sign in again. It also makes every stored linked-account credential unreadable, so switching to a linked account fails. To repair a link, the user removes the linked account and adds it again (adding an account that is still listed is refused with `This account is already linked`). Removing it after a rotation cannot clear the copy stored in the other account and returns the warning `reverse_link_not_cleared`, but adding it again rewrites both sides.

### "Stay signed in after closing the browser"

The box on the sign-in page decides only whether the cookies that hold a session outlive the browser. Ticked, `alps_session`, `alps_login_token` and the two cookies the page reads beside them (`alps_logged_in`, `alps_has_login_token`) carry a 30-day expiry. Unticked, they are session cookies, and the browser drops them when it closes. The box is off unless the user ticks it.

It does not override auto-logout: with an auto-logout time set in Settings, an idle tab still signs itself out (`DELETE /session`, which clears all four cookies), whatever the box says.

The choice is kept in the login token, and every answer that issues these cookies again issues them the same way: a session restored from the token, and a switch to a linked account (see [Account Switching](#account-switching) for a switch made after the token has expired). A sign-in or a switch that waits for a security key carries the choice with its pending session, so the session issued once the key is given follows the box of that sign-in and no other.

---

## Running Several Nodes

Sessions live only in the memory of the node that created them. Nodes do not share them: cluster messages carry rate-limit events and news that an account enrolled a security key, never sessions.

Behind a load balancer, route each browser to the same node (session affinity), and give every node the same `login_key`. When a browser does reach another node, after a failover or a restart, that node can then restore a session from the login token. Without affinity, each move to another node opens a new session and a new mail-server connection, and issues a new `alps_session` cookie. A sign-in or account switch waiting for its security key exists only on the node that took the password, so its `/webauthn/verify/*` requests must reach that node. See [CLUSTER.md](CLUSTER.md) for the settings every node must share.

---

## Linked Accounts

Account linking requires `[server] login_key`. Without it, `POST /accounts` answers 400 `Account linking requires login key to be configured`.

Adding an account signs in to it with the password given. This counts against the login rate limits for that account and the client address, like a sign-in at the login form (see [RATELIMIT.md](RATELIMIT.md)).

A link is stored in both accounts: each account's `linked_accounts` entry holds the other account's username and its password, encrypted with `login_key`. A switch reads the target's credential from the current account's entry.

Removing a link also removes this account's entry from the other account. If that cannot be done, the link is still removed here, and the answer carries the warning `reverse_link_not_cleared`.

A password change through the password plugin re-encrypts this account's new password into every account it is linked to. If any could not be updated, the answer carries the warning `linked_accounts_not_refreshed` with a count.

---

## Account Switching

ALPS lets users link several accounts and switch between them. Because a session holds the mail connection of one account, a switch opens a new session:

1. The frontend requests an account switch via `POST /accounts/switch` with the target username.
2. The server reads the current account's `linked_accounts` entry from the mail server and decrypts the target's stored password with `login_key`.
3. It signs in to the target account, opening a new session. If that fails, the request fails and the current session stays open.
4. It decides whether the target account's security key is needed (see below).
5. It closes the current session in either case. Then it either issues the new account's cookies at once, or answers `requires_2fa` and issues them after the key is given.

The target account's security key is skipped only when both hold: the target account has "Trust Linked Accounts" turned on, as [WEBAUTHN.md](WEBAUTHN.md#account-switching-with-2fa) describes, and the session being switched from has itself given its second factor. Otherwise the switch waits for the target's key: the current session is closed at once and its `alps_session` and `alps_logged_in` cookies are cleared, an `alps_2fa_pending` cookie (5 minutes) is set for the target account's pending session, and the answer is `{"requires_2fa":true}`. The new account's session cookie and login token are issued only once its key or a recovery code is given within that window. Until then the browser keeps the login token of the account it switched from, if it held a valid one.

The switch takes the persistence choice from the browser's login token. If the browser holds a valid token, the new account's `alps_session`, `alps_logged_in` and login token follow the choice made at sign-in. A session can outlive its token: one restored on day 29, for example, can run up to `absolute_session_hours` more. If the token is no longer valid by the time of the switch, the switch clears it and issues the new account's cookies as browser-session cookies. A switch that completes at once then writes no login token. A switch that waits for the target's security key writes one, as a browser-session cookie, once the key or a recovery code is given.

Afterwards ALPS holds mail connections for this browser only for the account it switched to: that session's main connection and, when used, its background one. Linking, unlinking and a password change sign in to the other accounts briefly and close those sessions when done. While open, those sessions count against `max_sessions` and `max_sessions_per_user` like any other.

---

## User Information Persistence

ALPS keeps no database. An account's settings (`base.settings`, identities included), linked accounts (`linked_accounts`), security-key record (`webauthn`, and its versions under `webauthn-state/`) and GPG keyring (`gpg_keys`) are kept as IMAP METADATA entries under `/private/vendor/alps/`, or in `alps_store.json` with the maildir provider. [ARCHITECTURE.md](ARCHITECTURE.md#4-stateless-persistence-imap-metadata) lists what each entry holds and what happens on a server without METADATA, where nothing ALPS saves persists. Contacts and calendars stay on the CardDAV and CalDAV servers ([CDAV.md](CDAV.md)).

A move to another IMAP server keeps this state only if the migration copies the `/private/vendor/alps/` server annotations and the new server supports METADATA. Linked accounts then work only under the same `login_key`; otherwise users remove and add them again (see [Changing the Key](#changing-the-key)). Security keys work only under the same `[webauthn] rpid`, because a key is bound to the RP ID it was enrolled under (see [WEBAUTHN.md](WEBAUTHN.md)).
