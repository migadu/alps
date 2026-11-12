# Local Maildir Provider

ALPS reaches mail through a pluggable provider interface (`provider.MailProvider`). The default and primary provider is IMAP, but ALPS also includes a native, local **Maildir provider** that reads and writes a Maildir on the local file system.

With it, ALPS runs on the same server as your local mail delivery agent (MDA) and needs no IMAP server. This suits single-server setups, testing environments, and small deployments where running an IMAP daemon is not worth it. Sending mail still needs an SMTP submission server (see [Sending Mail](#sending-mail)).

## Architecture & Features

The Maildir provider implements the following natively:
- **Direct Filesystem Access:** Reads and writes standard Maildir directories (`cur`, `new`, `tmp`) and Maildir++ folders (e.g., `.Sent`, `.Trash`). See [Maildir Layout](#maildir-layout).
- **File-based Flags:** Stores the standard mail flags as the info letters of each message's file name, as the Maildir format defines them. See [Flags](#flags).
- **Local Search:** Scans each message file for the query as a case-insensitive substring, reading it in 32 KiB chunks. See [Search](#search).
- **JSON Local Store:** Keeps what the IMAP provider keeps in IMAP METADATA (the account's ALPS settings, GPG keyring, linked accounts and security-key record) in a JSON file, `alps_store.json`, at the root of the user's maildir. See [The Settings File](#the-settings-file).
- **Dovecot-style Authentication:** Checks the login against a Dovecot-style `passwd` file. See [Password File Format](#password-file-format).

Some features of the IMAP provider are not available; see [Limitations](#limitations).

## Configuration

To enable the Maildir provider, edit your ALPS `config.toml`:

```toml
[provider]
# Switch the provider type from the default "imap" to "maildir"
type = "maildir"

[provider.maildir]
# Each user's own maildir (optional). The placeholders are replaced per login:
# %u - Replaced with the local part of the login (e.g., 'john' in 'john@example.com')
# %d - Replaced with the domain part (e.g., 'example.com')
# %n - Replaced with the full login ('john@example.com')
# When unset, each user's maildir is <home>/Maildir, from the passwd file.
path = "/var/vmail/%d/%u/Maildir"

# Path to the Dovecot-style passwd file for authentication (required)
auth_passwd_file = "/etc/dovecot/users"
```

`auth_passwd_file` is required: ALPS refuses to start when it is unset or empty, or when `[provider.maildir]` is missing. ALPS does not check at startup that the file exists. If it cannot be opened, sign-ins fail with a service error. `path` is optional. Both keys are listed in [CONFIGURATION.md](CONFIGURATION.md).

A service error, here and below, means that the sign-in is refused with `503` and the code `service_unavailable`, not as wrong credentials, and that the log line `sign-in failed` gives reason `error` and the cause.

### The Maildir Path

After placeholder expansion, `path` is each user's own maildir: the directory that holds `cur`, `new`, `tmp`, the `.Folder` directories and `alps_store.json`. ALPS adds nothing to it. Include `%n`, or `%u` together with `%d` when the logins span several domains, so that every account gets its own directory. A `path` without them makes all accounts share one maildir and one settings file.

For a login without `@`, `%u` and `%n` are the whole login and `%d` is empty. When `path` is set, a login whose local part is empty, or whose local part or domain contains `/` or `\` or is `.` or `..`, cannot sign in. The password is checked first, and with the right one the failure is reported as a service error, not as wrong credentials.

With `path` unset, each user's maildir is `<home>/Maildir`, where `<home>` is field 6 of the user's passwd entry, so every entry needs a home field. An entry without one cannot sign in, and the failure is reported as a service error. With `path` set, the home field is ignored.

### File Permissions

The user ALPS runs as needs read access to `auth_passwd_file` and nothing more. ALPS only reads it, so do not make it writable by ALPS. ALPS needs read, write and execute access to every user's maildir and the directories in it.

ALPS does every file operation as its own user and ignores the uid and gid in the passwd file. It creates a missing maildir (and its parents), new folders, and their `tmp`, `new` and `cur` with mode `0700`. Message files get `0666` less the umask, and `alps_store.json` gets `0600`. Run ALPS as the user that owns the mail store (the delivery user), or the MDA may be unable to deliver into folders ALPS created.

### Sending Mail

No IMAP server is needed, but sending still needs an SMTP submission server: `[smtp] server` is required at startup, whatever the provider. ALPS signs in to the submission server with AUTH PLAIN, using the same username and password the user signed in with, so the SMTP server must accept the credentials listed in `auth_passwd_file`. See [MAIL_SERVER.md](MAIL_SERVER.md) for how ALPS submits mail and [CONFIGURATION.md](CONFIGURATION.md) for the `[smtp]` keys.

### With the Multi Provider

The Maildir provider can also be a backend of the multi provider. Under `[provider.multi.domains."example.com"]`, set `type = "maildir"`, `auth_passwd_file` and optionally `path`: the same keys as `[provider.maildir]`. A `[[provider.multi.routes]]` entry or `[provider.multi.default]` can name a maildir backend the same way. Such an entry may also name its own `smtp`, which then replaces `[smtp] server` for that domain.

```toml
[provider.multi.domains."local.lan"]
type = "maildir"
auth_passwd_file = "/etc/dovecot/users"
```

The backend receives the login exactly as typed. A bare login that `default_domain` routes to the maildir domain is looked up in the passwd file under the bare name, and `%d` is empty for it. The domain is lowercased for routing but not for the passwd lookup, nor for `%d`.

## Password File Format

The `auth_passwd_file` uses the Dovecot `passwd` file syntax: one entry per line, with fields separated by `:`:

```text
user:password:uid:gid:gecos:home:shell:extra_fields
```

ALPS reads only the user (field 1), the password (field 2) and the home directory (field 6). The uid, gid and any extra Dovecot fields are ignored.

- Blank lines and lines starting with `#` are skipped.
- The first field is compared exactly, and case-sensitively, with the login as the user typed it. It need not be an email address.
- Only the first line whose user matches is tried.
- ALPS reads the file again on every sign-in and each time a session opens another connection to the mail provider, so changes take effect without a restart.

### Supported Password Schemes

The password field starts with a `{SCHEME}` tag. Scheme tags are case-insensitive. A password field without a tag is compared as plain text, so give every hashed entry its prefix. The following schemes are supported:
- `{CRYPT}`: bcrypt only, hashes beginning `$2a$`, `$2b$`, `$2x$` or `$2y$`, such as `{CRYPT}$2y$10$...`. This is the recommended scheme.
- `{PLAIN}`: cleartext. Not recommended for production. Because fields are separated by `:`, a `{PLAIN}` password cannot contain `:`.
- `{MD5}`, `{SHA256}`, `{SHA512}`: an unsalted digest of the password, written in hex (upper or lower case). ALPS's `{MD5}` is what Dovecot calls `{PLAIN-MD5}`. Dovecot stores `{SHA256}` and `{SHA512}` in base64 by default, and ALPS does not accept base64 digests, so convert such entries or switch them to `{CRYPT}` bcrypt. Unsalted digests are weak, so prefer bcrypt.

Not supported:
- under `{CRYPT}`, MD5-crypt (`$1$`), SHA256-crypt (`$5$`), SHA512-crypt (`$6$`) and DES crypt hashes;
- the tags `{BLF-CRYPT}`, `{SHA256-CRYPT}` and `{SHA512-CRYPT}` (a `{BLF-CRYPT}` bcrypt hash works once its tag is changed to `{CRYPT}`);
- salted and other schemes, such as `{SSHA*}`, `{SMD5}`, `{SHA}`, `{PLAIN-MD5}`, `{PBKDF2}`, `{ARGON2*}` and `{CRAM-MD5}`.

An entry in a scheme ALPS does not support can never sign in. The user sees invalid credentials, and the log records an ordinary failed sign-in for bad credentials without naming the scheme.

### Example `users` file

```text
# Format: <user>:<password>:<uid>:<gid>:<gecos>:<home>:<shell>:<extra_fields>
john@example.com:{CRYPT}$2y$10$2uL3.RGgAWu4nZeJ4OD6OO9N8/cuehuhn0EUvNUJJa5QzM5XA6uEK:1000:1000::/var/vmail/example.com/john::
alice@example.com:{SHA256}2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b:1000:1000::/var/vmail/example.com/alice::
bob@example.com:{PLAIN}supersecret:1000:1000::/var/vmail/example.com/bob::
```

John's and Alice's password is `secret`, and Bob's is `supersecret`. John's `{CRYPT}` bcrypt line is the recommended form. Alice's digest is the output of `printf %s 'secret' | sha256sum`.

> [!TIP]
> Of the uid, gid and home fields, ALPS uses only home (field 6), and only when the `path` option under `[provider.maildir]` is omitted or left empty. Each user's maildir is then `<home>/Maildir`: with the example above, John's is `/var/vmail/example.com/john/Maildir`. This suits setups that already record each user's home in the passwd file, since each user gets the location their entry names rather than one from a template. The uid and gid are ignored: ALPS accesses every maildir as its own process user (see [File Permissions](#file-permissions)).

## Maildir Layout

### Folders

INBOX is the maildir itself. Other folders are Maildir++ dot-directories with `.` as the hierarchy delimiter: `Archive.2024` is the directory `.Archive.2024`. Names are shown exactly as stored on disk, with no modified UTF-7 decoding, and folders ALPS creates are named in UTF-8. A name that is empty, starts or ends with `.`, or contains `..`, `/`, `\` or NUL is refused.

Maildir has no special-use attributes, so special folders are recognised by name: the web app treats `Drafts`, `Sent`, `Archive`/`Archives`, `Junk`/`Spam` and `Trash`/`Deleted Items` (any case) as special. When filing a sent copy, ALPS uses the folder named exactly `Sent`, and for a draft the folder named `Drafts`, or `Draft` when there is no `Drafts` (any case). A folder whose name only contains the word, such as `Presentations` or `Contract drafts`, is never used. When there is none, ALPS creates `Sent` or `Drafts` on the first save. Sent copies are stored as read, and drafts as read and `\Draft`.

Renaming a folder renames its subfolders with it: renaming `Archive` to `Old` moves `Archive.2024` to `Old.2024`. If any of the new names is taken, nothing is renamed.

### Flags

Flags are the info letters after `:2,` in the message file name: `S` = `\Seen`, `R` = `\Answered`, `F` = `\Flagged`, `T` = `\Deleted`, `D` = `\Draft`. Other letters on disk, such as `P` (passed) or keyword letters written by another program, are not shown. Adding or removing a flag keeps them, but the flags API's `set` action (its default when no action is given) replaces them. Tags (`$label1` to `$label5`) and other keywords cannot be stored with the Maildir provider: a flag change that names one is refused with HTTP 400 `{"error":"cannot"}`, and no message is changed.

### New Mail

ALPS writes to the maildir as well as reading it. Whenever it reads a folder, and loading the folder list reads every folder, it moves newly delivered files from `new/` into `cur/` as `<key>:2,`, dropping any info set at delivery. A message counts as unread while its file name lacks `S`. Messages ALPS stores (sent copies, drafts) are written in `tmp/` and moved into `cur/` once complete. A file in `cur/` whose name is not a message's, such as one without the `:2,` part, is skipped and logged as `skipping malformed message name`. It is not listed or counted, and the folder's other messages are listed as usual.

Changes made by other programs show up when ALPS next reads the folder from disk. A page of the message list that the session has cached is shown again while the folder's message and unread counts stay the same, so a change that leaves both as they were, such as a star set by another program, can take until that page leaves the cache to appear (`[cache] ttl_minutes`, 10 by default; see [CONFIGURATION.md](CONFIGURATION.md#3-caching-cache)).

### Symbolic Links

Every file and folder below the user's maildir, `alps_store.json` included, is opened beneath that maildir. A relative link that stays inside the maildir is followed. A symbolic link that leads out of the maildir is not followed, absolute links are not followed, and a folder that is itself a symbolic link is not listed. Links on the way to the configured maildir path itself are allowed.

## The Settings File

`alps_store.json` sits at the root of the user's maildir, beside `cur`, `new` and `tmp`. It holds what ALPS keeps in IMAP METADATA with the IMAP provider (see [ARCHITECTURE.md](ARCHITECTURE.md)):

- `base.settings`: the account's ALPS settings: preferences, identities, signature, folder order and the folders unsubscribed in ALPS.
- `gpg_keys`: the GPG keyring, a public key and an encrypted private key (see [GPG.md](GPG.md)).
- `linked_accounts`: linked accounts, their passwords encrypted with `login_key` (see [SESSIONS.md](SESSIONS.md)).
- `webauthn`: the security-key record (see [WEBAUTHN.md](WEBAUTHN.md)).

Back it up with the maildir, and keep it valid JSON if you edit it: while it does not parse, the account cannot sign in (a service error) and its settings cannot be read or saved. It holds no CardDAV or CalDAV configuration: those endpoints come from `[plugin.carddav]` / `[plugin.caldav]`, or from a domain's entry under `[provider.multi]` (see [CDAV.md](CDAV.md)).

When the user's maildir does not exist yet, the first write of the file creates it, with its parents, mode `0700`, so settings can be saved before the first delivery.

Each change rewrites the whole `alps_store.json` through `alps_store.json.tmp` (mode `0600`) and a rename, so a reader never sees a half-written file. Changes are serialised only within one ALPS process, so serve each maildir from a single ALPS instance.

With clustering enabled (`[cluster] enabled = true`, see [CLUSTER.md](CLUSTER.md)), recovery codes for security keys are not available to maildir accounts: `GET /settings/2fa` reports `recoveryCodesAvailable` false, a first key comes without codes, and the recovery endpoints answer `503 recovery_unavailable` (see [WEBAUTHN.md](WEBAUTHN.md)).

## Search

Search opens every message file in the current folder. It matches the whole query, as typed, as one case-insensitive substring of the stored message: headers and body as they are on disk, with no decoding of base64, quoted-printable or RFC 2047 encoded headers. The prefixes (`from:`, `to:`, `cc:`, `subject:`, `body:`, `header:`, `is:`), quoting and the AND of several terms described in [SEARCH.md](SEARCH.md) do not apply to the Maildir provider. The toolbar's Starred and Unread filters are sent as the queries `is:starred` and `is:unread`, so they are matched as text too and find nothing in practice. A query with a prefix and no value, such as `from:` or `body:""`, is refused with HTTP 400, as on an IMAP account. Searching all folders at once is not offered.

## Limitations

Not available with the Maildir provider:
- pushing new mail (`push_new_mail`): pages check for new mail at the user's check-mail interval instead (see [CONFIGURATION.md](CONFIGURATION.md#14-pushing-new-mail));
- storage quota display;
- folder sharing;
- threading of the message list by the server;
- searching all folders;
- sender authentication badges and BIMI logos: the Maildir provider does not read the messages' `Authentication-Results` fields, and has no counterpart of the IMAP provider's `authserv_ids`;
- folder subscriptions: every folder is listed as subscribed, and subscribing or unsubscribing has no effect.

With Settings > Reading & Composing > Message Sort Criteria at **Received Date** (the default), the message list and search results are ordered by each message's `Date` header. A message without a valid `Date` is placed by the delivery time at the start of its file name, and messages with the same date are ordered by file name. With **Folder Filing Date**, they are ordered by file name, which normally starts with the delivery time. The newest-first or oldest-first setting applies either way.
