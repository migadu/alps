# Password Change Plugin

ALPS provides a built-in mechanism to proxy password change requests to an external HTTP API, or to run a program on the ALPS host for mail servers that offer a command line tool instead (see [Running a Command](#running-a-command)). This allows ALPS to integrate with various backend identity providers or mail server management interfaces, so that users can change their password from ALPS Settings.

## How It Works

1. The user opens **Settings** > **Password** in the ALPS web interface.
2. The user enters their current password and their new password, the new one twice. Settings checks that the two copies match before it sends anything.
3. ALPS checks the current password (see [Checking the Current Password](#checking-the-current-password)), then forwards the request to the configured external HTTP endpoint, or runs the configured command, according to your configuration (`config.toml`).
4. If the endpoint's final response has a status below 400 (see [Redirects](#redirects)), or the command exits with status 0, ALPS takes the password as changed.
5. ALPS then brings the session up to date with the new password, so the user stays signed in (see [After a Change](#after-a-change)).

### Checking the Current Password

ALPS checks the current password against the password this session holds: the one it signed in with, or the one set by an earlier change in this session. The check is local and contacts no server.

The check counts against the login rate limits the same way a sign-in does (see [RATELIMIT.md](RATELIMIT.md#protected-endpoints)). When the limits refuse it, for the account, the client address or the whole server, the answer is 429 with code `rate_limited`, the wait in seconds as `retry_after` in the body and, when it is above zero, in a `Retry-After` header. No backend is contacted, and the refused check is not recorded. A check the limits let through is recorded as a sign-in is: a right current password as a successful login, and a wrong one as a failed login for the account and the client address, answered 403 `current_password_incorrect`.

### After a Change

After the backend reports success, ALPS opens a new mail connection with the new password. If that works, the new connection and password become the session's. If the browser holds a login token for this account, ALPS re-issues it with the new password, keeping its "Stay signed in after closing the browser" choice and its second-factor state (see [SESSIONS.md](SESSIONS.md)).

ALPS also rewrites the copy of this account's password that each linked account stores (see [SESSIONS.md](SESSIONS.md#linked-accounts)). Each one that cannot be updated is logged. If some linked accounts cannot be updated, the answer is 200 with `"warning": "linked_accounts_not_refreshed"` and a `count` of the accounts that were not updated, and Settings shows "Your password has been changed. Some linked accounts could not be updated." If ALPS cannot read this account's list of linked accounts at all, it logs that, and the answer carries no warning.

This applies to both backends. If the endpoint or the command reports success but ALPS cannot open a mail connection with the new password, the answer is still 200, with code `reauthenticate`, and Settings shows "Your password has been changed. Please sign in again." ALPS does not sign the user out. The session keeps its old password, and neither the login token nor the linked accounts are updated.

## Configuration

To enable the password change feature, you must configure the `[plugin.password]` and `[plugin.password.options]` sections in your `config.toml` file. Every key is also listed in [CONFIGURATION.md](CONFIGURATION.md#password-plugin-pluginpassword).

```toml
[plugin.password]
# Enable the password change feature (default: false)
enabled = true

[plugin.password.options]
# Endpoint URL to send the password change request to.
# Supports the following interpolation variables:
# {email}  - The login exactly as the user entered it (e.g. user@example.com)
# {local}  - The part of the login before the first "@" (e.g. user)
# {domain} - The part of the login after the first "@" (e.g. example.com)
endpoint = "https://api.example.com/users/{local}/password"

# HTTP method to use (default: POST)
method = "POST"

# Authentication type for the upstream request
# Options: "none", "basic", "bearer" (default: "none")
auth_type = "basic"

# Username and password for "basic" authentication
username = "admin"
password = "supersecretpassword"

# Token for "bearer" authentication
# token = "your_bearer_token"

# Payload format for the request body
# Options: "json", "form" (default: "json")
payload = "json"

# Payload mapping (optional): the fields the body carries, each one named
# after the field sent and set to an internal ALPS variable. Without it the
# body is {} for JSON, or empty for a form.
# [plugin.password.options.payload_mapping]
# custom_old_pass_key = "old_password"
# custom_new_pass_key = "new_password"
```

- `[plugin.password] enabled = true` is required. Without it the plugin does not load, and Settings has no Password tab (see [The Change Endpoint](#the-change-endpoint)).
- Values put into `endpoint` are escaped for a URL path segment. "/", "?", ";", "," and spaces are escaped, but "@", "+", "&" and "=" are left as they are. Put the placeholders in the path, not in the query string. A login with no "@" gives the whole login as `{local}` and an empty `{domain}`.
- `method` is sent in upper case.
- `auth_type = "basic"` sends HTTP Basic authentication with `username` and `password`. `auth_type = "bearer"` sends `Authorization: Bearer <token>`. Any other value, `"none"` included, sends no Authorization header.
- ALPS gives the request 15 seconds, redirects included (see [Error Handling](#error-handling)).

## Payload Formats

The external endpoint receives the request body in one of two formats, depending on the `payload` setting: `form`, in any case, sends a form, and any other value sends JSON. The body carries only the fields named in the `[plugin.password.options.payload_mapping]` table. The table is optional: without it, the body is `{}` for JSON or empty for a form, with the same `Content-Type` header.

The keys in the mapping represent the field names sent to the external API, and the values represent the internal ALPS variables. The following internal variables are available:
* `username`: The login exactly as the user entered it, the same value as `{email}`. When users sign in with their full address, this is their email address.
* `local`: The part of the login before the first "@", or the whole login when it has no "@".
* `domain`: The part of the login after the first "@", or empty when the login has no "@".
* `old_password`: The current password provided by the user.
* `new_password`: The new password provided by the user.

This holds even when `provider.multi`'s `default_domain` completed the login to choose the backend: a user who signs in as `jdoe` gives `jdoe` as both `username` and `local`, and an empty `domain`.

Each mapping value must be exactly one of `username`, `local`, `domain`, `old_password` or `new_password`. A field with any other value is left out of the request without any message, so a mapping cannot send a constant. Nothing checks the mapping at startup.

The examples below use a mapping of `email="username"`, `password="old_password"` and `new_password="new_password"`. The fields are sent sorted by name.

### 1. JSON (`payload = "json"`)
Requests have the `Content-Type: application/json` header, and the body is sent on one line.
```json
{"email":"user@example.com","new_password":"newSecurePassword456","password":"currentPassword123"}
```

### 2. Form (`payload = "form"`)
Requests have the `Content-Type: application/x-www-form-urlencoded` header.
```text
email=user%40example.com&new_password=newSecurePassword456&password=currentPassword123
```

## Redirects

ALPS goes by the final response. Its HTTP client follows redirects, up to 10. After a 301, 302 or 303 the request is repeated as a GET with no body. After a 307 or 308 it is repeated with the same method and body. Any final status below 400 counts as a successful change, including a 3xx with no `Location` header. More than 10 redirects is a failed request (502 `password_service_unavailable`). Point `endpoint` at the URL that performs the change, not one that redirects.

## Running a Command

Some mail servers change passwords with a command line tool rather than an HTTP API. Set `command` in place of `endpoint`, and ALPS runs that program on its own host:

```toml
[plugin.password.options]
# maddy reads the new password from standard input when -p is left out.
command = ["/usr/local/bin/maddy", "creds", "password", "{email}"]

# What the program reads on standard input (default: the new password on a
# line of its own).
# stdin = "{new_password}\n"
```

- `command` is a list: the program first, as an absolute path, then each of its arguments. ALPS runs the program directly, never through a shell, so each entry reaches it as exactly one argument, whatever the user's address or password contains. Quotes, `$VAR`, `|` and other shell syntax are passed on as they are; wrap the tool in a script if you need a shell.
- Arguments may carry `{email}`, `{local}` and `{domain}`, with the values described under [Payload Formats](#payload-formats). They may not carry the passwords, because the arguments of a running program are visible to every user on the host. An argument starting with a placeholder is checked after expansion, including any empty leading placeholders: if it would begin with a dash, the change is refused with 400 `password_change_rejected` and the program is not run, so the argument is never read as an option. Fixed option prefixes such as `--user={email}` are allowed.
- The passwords reach the program on standard input. `stdin` must be a string and sets what it reads; it may carry `{email}`, `{local}`, `{domain}`, `{old_password}` and `{new_password}`. Its default, `"{new_password}\n"`, suits tools that prompt for the new password. `stdin = ""` does not mean empty input: it means that default. Every placeholder that `stdin` uses is checked, the address parts included. If its value holds a carriage return, line feed or NUL, the change is refused with 400 `password_change_rejected` and the program is not run.
- Exit status 0 means the password was changed. Exit status 1 or above is shown to the user as a refused change. A program ended by a signal or by the 15-second timeout is shown as an unavailable service. Whenever a run fails, ALPS logs the first 4 KiB of what the program wrote on standard error, with both passwords masked. Standard output is discarded.
- Commands require a Unix host. The program runs as the user ALPS runs as, with an environment holding only `PATH`, in its own process group. While the command is running, a cancelled request or the 15-second timeout stops that group, including children a wrapper starts. Password-changing work must stay in that group and run as a user ALPS can signal. A helper that changes users or detaches must manage its own child cancellation; a bare privilege-changing command cannot provide this guarantee. If ALPS cannot run the tool with these permissions, use a service through the HTTP backend or a helper that owns and cancels its privileged children.
- ALPS checks the command when it starts (see [Checks at Startup](#checks-at-startup)) and again on every change. A block routed per domain under `provider.multi` may name a command too (see [Per-Domain Backends](#per-domain-backends)).

## Checks at Startup

With `[plugin.password] enabled = true`, ALPS refuses to start when the global `[plugin.password.options]` block does any of the following:
- sets `command` to something other than a non-empty list of strings;
- sets `command` with a `stdin` that is not a string;
- sets a non-empty `stdin` without `command`;
- sets `command` on a host that is not Unix;
- sets both `endpoint` and `command`;
- puts any placeholder in the program path, the first entry;
- names a program that is relative, missing, not a regular file or has no execute bit set (for owner, group or others);
- puts `{old_password}` or `{new_password}` in an argument.

The same checks run again on every change, so a program that is removed or loses its execute bits after ALPS started is refused then (see [Error Handling](#error-handling)). A program with an execute bit set that still does not let the user ALPS runs as execute it passes these checks, and fails when it is run as a program that could not be started (502).

The HTTP options are not checked at startup. A block with neither `endpoint` nor `command` starts, and every change then fails with 502 `password_service_unavailable`. An `endpoint` that is not a valid URL, or a `method` that is not a valid HTTP method, also starts, and every change then fails with a 500 error.

## Per-Domain Backends

Under `provider.multi`, a backend can carry its own password block. It goes at `[provider.multi.domains."<domain>".password]`, or at `[provider.multi.routes.password]` placed directly under its own `[[provider.multi.routes]]`, or at `[provider.multi.default.password]`. The default block is used for every login that no domains entry or route names.

```toml
[[provider.multi.routes]]
domains = ["domain1.com", "domain2.com"]
type = "imap"
server = "imaps://imap.sharedmail.com:993"

# Binds to the route declared above it.
[provider.multi.routes.password]
endpoint = "https://admin.sharedmail.com/api/webmail/mailboxes"
auth_type = "basic"
username = "..."
password = "..."
payload = "json"

[provider.multi.routes.password.payload_mapping]
email = "username"
password = "old_password"
new_password = "new_password"
```

For logins on that backend, the block replaces `[plugin.password.options]` entirely. Nothing is merged in from the global block: not `endpoint`, `method`, `auth_type`, `username`, `password`, `token`, `payload` or `payload_mapping`. A routed block without `payload_mapping` therefore sends no fields. A backend with no password block uses the global options. `[plugin.password] enabled = true` is still required.

A routed block may set `command` and `stdin` as the global one does. It is not checked at startup. If it fails the checks when it is used, the change is answered 500 `password_service_unavailable` and the log says "Password change is misconfigured". The rest of `provider.multi` is described in [CONFIGURATION.md](CONFIGURATION.md#providermulti).

## The Change Endpoint

The Settings page calls `POST /password/change`, which needs a signed-in session. The request is JSON `{"old_password": "...", "password": "..."}` with `Content-Type: application/json`, or the form fields `old_password` and `password`. A success is one of three 200 answers:
- `{"message":"Password successfully changed","code":"password_changed"}`
- `{"message":"Password changed, but please log in again","code":"reauthenticate"}`
- `{"message":"Password successfully changed","warning":"linked_accounts_not_refreshed","count":N}`

Errors are `{"error": ..., "code": ...}` with the codes listed under [Error Handling](#error-handling); a 429 also carries `retry_after`. Malformed JSON is 400 `{"error":"invalid_json"}`, and a JSON body over the size limit is 413 `{"error":"payload_too_large"}`.

The route and the Settings > Password tab exist only while the password plugin is loaded, and it loads only with `[plugin.password] enabled = true`. Without it, `GET /session` does not list `password` in `EnabledPlugins` and answers `PasswordChangeEnabled` false, Settings offers no Password tab, and there is no `/password/change` route. Because a `[plugin.*]` section with `enabled = true` means only the enabled plugins load, `base` and every other plugin wanted need `enabled = true` as well (see [CONFIGURATION.md](CONFIGURATION.md#9-plugins-pluginname)).

## Error Handling

The session password stays unchanged in every case below.

### Before Any Backend Is Involved

Some answers come from ALPS before any backend is involved:
- 500 `password_service_unavailable`: the option block in use fails its checks at request time. The block is the global one or one routed per domain. The log says "Password change is misconfigured: <reason>". This also covers a global command whose program was removed or lost its execute bits after ALPS started.
- 400 `{"error":"invalid_json"}`: a malformed JSON body.
- 400 `password_required`: either password is empty.
- 429 `rate_limited`, with `Retry-After`: the login limits are reached.
- 403 `current_password_incorrect`: the current password is wrong.

### HTTP Endpoint

- If the endpoint's final status is 400 or above, ALPS reports a refused change or an unavailable service to the user. The upstream's status goes to the ALPS log, as "Password change failed, status <code>: <body>" with the upstream's whole response body; the browser gets ALPS's own status. A 401 or 403 means ALPS's `username`, `password` or `token` were not accepted, so it is reported as an unavailable service (`502 password_service_unavailable`), as is a 5xx. Any other 4xx is a refused change (`400 password_change_rejected`).
- If the request fails, ALPS logs "Password change HTTP request failed: <error>" and answers 502 `password_service_unavailable`. A request fails when the endpoint cannot be reached, a connection or TLS error occurs, there are more than 10 redirects, or no answer arrives within 15 seconds.

### Command

ALPS logs "Password change command failed for <login>: <error>", with the masked standard error when the program ran, and answers as follows:
- Exit status 1 or above: 400 `password_change_rejected`.
- The program could not be started, or was ended by a signal: 502 `password_service_unavailable`.
- Still running after 15 seconds: its process group is killed, and the answer is 504 `password_service_unavailable`.
- An argument that starts with a placeholder and would begin with a dash once filled in, or a value used in `stdin` that holds CR, LF or NUL: 400 `password_change_rejected`, and the program is not run.

A program that is missing or has no execute bit at request time is caught earlier, by the checks on the option block: the answer is 500 `password_service_unavailable` and the log says "Password change is misconfigured" (see [Before Any Backend Is Involved](#before-any-backend-is-involved)).

### What Settings Shows

Settings shows "Password changes are temporarily unavailable. Please try again later." for every 5xx answer, "Too many attempts. Please try again later." for a 429, "That password is not right." for a wrong current password, and "Could not change your password. Please try again." for a refused change.

### When the New Password Does Not Work

If the backend reports success but ALPS cannot open a mail connection with the new password, the change is answered 200 `reauthenticate` and the user is asked to sign in again (see [After a Change](#after-a-change)).
