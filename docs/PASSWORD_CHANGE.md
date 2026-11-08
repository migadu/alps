# Password Change Plugin

ALPS provides a built-in mechanism to proxy password change requests to an external HTTP API, or to run a program on the ALPS host for mail servers that offer a command line tool instead (see [Running a Command](#running-a-command)). This allows ALPS to integrate with various backend identity providers or mail server management interfaces, offering users a seamless way to update their credentials directly from ALPS Settings.

## How It Works

1. The user opens **Settings** > **Password** in the ALPS web interface.
2. The user inputs their current password and their new password.
3. ALPS checks the current password, then forwards the request to the configured external HTTP endpoint, or runs the configured command, according to your configuration (`config.toml`).
4. If the upstream server responds with a success status code (HTTP 200-399), or the command exits with status 0, ALPS assumes the password has been changed.
5. ALPS then gracefully reconnects the user's active IMAP connection and updates their session with the new password. This ensures the user is not unexpectedly logged out and can continue working seamlessly.

## Configuration

To enable the password change feature, you must configure the `[plugin.password]` and `[plugin.password.options]` sections in your `config.toml` file.

```toml
[plugin.password]
# Enable the password change feature (default: false)
enabled = true

[plugin.password.options]
# Endpoint URL to send the password change request to.
# Supports the following interpolation variables: 
# {email}  - The user's full email address (e.g. user@example.com)
# {local}  - The local part of the email address (e.g. user)
# {domain} - The domain part of the email address (e.g. example.com)
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

# Payload Mapping Configuration
# Maps internal ALPS variables to custom payload fields.
# [plugin.password.options.payload_mapping]
# custom_old_pass_key = "old_password"
# custom_new_pass_key = "new_password"
```

## Payload Formats

The external endpoint will receive the request body in one of two formats, depending on the `payload` configuration setting. The fields submitted in the request must be explicitly defined using the `[plugin.password.options.payload_mapping]` block.

The keys in the mapping represent the field names sent to the external API, and the values represent the internal ALPS variables. The following internal variables are available:
* `username`: The full email address of the user changing their password.
* `local`: The local part of the user's email address.
* `domain`: The domain part of the user's email address.
* `old_password`: The current password provided by the user.
* `new_password`: The new password provided by the user.

**Only** the mapped fields will be submitted.

### 1. JSON (`payload = "json"`)
Assuming a mapping of `email="username"`, `password="old_password"`, and `new_password="new_password"`, requests will have the `Content-Type: application/json` header.
```json
{
  "email": "user@example.com",
  "password": "currentPassword123",
  "new_password": "newSecurePassword456"
}
```

### 2. Form (`payload = "form"`)
Assuming the same mapping as above, requests will have the `Content-Type: application/x-www-form-urlencoded` header.
```text
email=user%40example.com&password=currentPassword123&new_password=newSecurePassword456
```

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
- Arguments may carry `{email}`, `{local}` and `{domain}`. They may not carry the passwords, because the arguments of a running program are visible to every user on the host. An argument starting with a placeholder is checked after expansion, including any empty leading placeholders: if it would begin with a dash, the change is refused so it is never read as an option. Fixed option prefixes such as `--user={email}` are allowed.
- The passwords reach the program on standard input. `stdin` must be a string and sets what it reads; it may carry `{email}`, `{local}`, `{domain}`, `{old_password}` and `{new_password}`. Its default, `"{new_password}\n"`, suits tools that prompt for the new password. A password holding a line break is refused, as it would end the line early.
- Exit status 0 means the password was changed. Any other status is shown to the user as a refused change, and the start of what the program wrote on standard error goes to the ALPS log, with the passwords masked. Standard output is discarded.
- Commands require a Unix host. The program runs as the user ALPS runs as, with an environment holding only `PATH`, in its own process group. While the command is running, a cancelled request or the 15-second timeout stops that group, including children a wrapper starts. Password-changing work must stay in that group and run as a user ALPS can signal. A helper that changes users or detaches must manage its own child cancellation; a bare privilege-changing command cannot provide this guarantee. If ALPS cannot run the tool with these permissions, use a service through the HTTP backend or a helper that owns and cancels its privileged children.
- ALPS refuses to start when `[plugin.password.options]` names a command that could not run as written: a program that is relative, missing or not executable, a password among the arguments, or both `endpoint` and `command`. A block routed per domain under `provider.multi` may name a command too; it is checked each time it is used, and refused then.

## Error Handling

- If the upstream endpoint returns an HTTP 4xx or 5xx error, ALPS will relay a failure message to the user, and their session password will remain unchanged.
- If the command exits with a non-zero status, cannot be started, or runs past its 15 seconds, ALPS reports a refused change or an unavailable service to the user, and their session password remains unchanged.
- If the upstream endpoint returns a success status but ALPS fails to verify the new password against the IMAP server, ALPS will prompt the user to log in again manually.
