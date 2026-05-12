# Local Maildir Provider

ALPS features a pluggable storage backend abstraction (`provider.MailProvider`). While the default and primary backend is IMAP, ALPS also includes a native, local **Maildir provider**. 

This provider is designed to allow ALPS to run directly on the same server as your local mail delivery agent (MDA), completely bypassing the need for a network IMAP server. This is particularly useful for single-server setups, testing environments, or minimalist deployments where maintaining an IMAP daemon is unnecessary overhead.

## Architecture & Features

The Maildir provider implements the following capabilities natively:
- **Direct Filesystem Access:** Reads standard Maildir directories (`cur`, `new`, `tmp`) and subfolders (e.g., `.Sent`, `.Trash`).
- **File-based Flags:** Syncs standard mail flags directly to the filesystem following the Maildir++ specification.
- **Fast Local Search:** Implements a direct byte-stream scanner across local files, chunking the reads for low-memory overhead.
- **JSON Local Store:** Emulates IMAP METADATA persistence (used for storing CardDAV/CalDAV configuration and web app preferences) via a safe, atomic local JSON file (`alps_store.json`) stored at the root of the Maildir.
- **Dovecot Authentication:** Includes point-of-entry authentication by parsing standard Dovecot `passwd` files.

## Configuration

To enable the Maildir provider, edit your ALPS `config.toml`:

```toml
[provider]
# Switch the provider type from the default "imap" to "maildir"
type = "maildir"

[provider.maildir]
# Path to the base maildir directory.
# You can use the standard variables:
# %u - Replaced with the local part of the email address (e.g., 'john' in 'john@example.com')
# %d - Replaced with the domain part (e.g., 'example.com')
# %n - Replaced with the full username ('john@example.com')
path = "/var/vmail/%d/%u/Maildir"

# Path to the Dovecot-style passwd file for authentication
auth_passwd_file = "/etc/dovecot/users"
```

> [!NOTE]
> Ensure the system user running the ALPS binary has adequate filesystem permissions (read/write/execute) over both the `auth_passwd_file` and the target Maildir directories defined in the `path`.

## Password File Format

The `auth_passwd_file` utilizes a standard Dovecot `passwd` file syntax. The parser maps an exact email address to its hashed password. 

### Supported Password Schemes
The Maildir provider securely verifies hashes. The following schemes are supported:
- `{PLAIN}` (Cleartext - Not recommended for production)
- `{CRYPT}` (Supports bcrypt variations like `$2y$`, `$2a$`, `$2b$`)
- `{MD5}`
- `{SHA256}`
- `{SHA512}`

### Example `users` file

```text
# Format: <username>:<password_hash>:<uid>:<gid>::<home_dir>::
john@example.com:{CRYPT}$2a$10$w3vH2P01Z/EIf7Y9Vw4QTuFj4YqN7tPqT/q1B6WfC/uY5s4N5n5fO:1000:1000::/var/vmail/example.com/john::
alice@example.com:{SHA256}e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855:1000:1000::/var/vmail/example.com/alice::
bob@example.com:{PLAIN}supersecret:1000:1000::/var/vmail/example.com/bob::
```

> [!TIP]
> The `uid`, `gid`, and `home_dir` fields in the password file are parsed during authentication. If the `path` option under `[provider.maildir]` in your `config.toml` is omitted or left empty, ALPS will automatically fallback to using `home_dir/Maildir`. Using this fallback is a highly recommended approach for multi-user setups, as it allows each user to have distinct, explicitly defined Maildir locations without relying on a rigid templated path.
