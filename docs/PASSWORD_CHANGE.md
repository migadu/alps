# Password Change Plugin

ALPS provides a built-in mechanism to proxy password change requests to an external HTTP API. This allows ALPS to integrate with various backend identity providers or mail server management interfaces, offering users a seamless way to update their credentials directly from the ALPS settings page.

## How It Works

1. The user navigates to the **Settings** > **Security** section in the ALPS web interface.
2. The user inputs their current password and their new password.
3. ALPS intercepts the request and forwards it to the configured external HTTP endpoint according to your configuration (`config.toml`).
4. If the upstream server responds with a success status code (HTTP 200-399), ALPS assumes the password has been changed.
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

## Error Handling

- If the upstream endpoint returns an HTTP 4xx or 5xx error, ALPS will relay a failure message to the user, and their session password will remain unchanged.
- If the upstream endpoint returns a success status but ALPS fails to verify the new password against the IMAP server, ALPS will prompt the user to log in again manually.
