# Contacts & Calendars (CDAV)

ALPS is more than just a webmail client; it is a full Personal Information Management (PIM) suite. It achieves this by providing native **CardDAV (Contacts)** and **CalDAV (Calendar)** clients through its plugin system.

This document explains how these plugins operate, authenticate, and synchronize data.

---

## 1. Connections & Authentication

By default, ALPS connects to the administrator-configured DAV server using the
user's IMAP username and password. Existing installations with a unified backend
identity system keep this behavior.

When the corresponding plugin is enabled, **Settings → Calendar** and
**Settings → Contacts** let each mail account configure its own
connection independently:

- Leave **Server URL** blank to use the configured server, or enter a personal
  server URL. Without a configured default, a URL is required.
- Under **Authentication**, use the mail credentials or enter a separate
  username and password. Mail credentials are selected initially for an
  administrator-configured server. A personal server starts with separate
  credentials; choosing mail credentials sends the mail password to that server.
- **Save connection** checks authentication and discovers the user's DAV home
  before saving. A failed check leaves the previous saved connection intact.
- **Remove connection** appears after a personal connection has been saved.
  Confirming removal deletes its server and credentials; the configured server
  and mail credentials apply again when available. Without a default server,
  navigation disappears after removal. Save and removal results appear as toasts.

Saved passwords are never returned to the browser. An empty password field keeps
the saved password only while the server and username stay the same. Changing
either requires entering the password again.

Personal connections persist in the mail account's IMAP METADATA. Separate
passwords are encrypted with the administrator's `server.login_key`, which must
be configured to save them. Rotating that key requires re-entering saved DAV
passwords; ALPS does not fall back to the mail password when decryption fails,
and Settings asks for the password again instead of offering to keep it. The
same happens when the administrator's default server changes. A saved password
belongs to the mail account whatever the letter case it signs in with.
Usernames and password-configured status are public settings; passwords and
encrypted password records are excluded from ordinary settings and browser
storage.

ALPS uses HTTP Basic authentication over HTTPS, including with Radicale's
password authentication. A proxy exposing only an interactive browser SSO login
needs a DAV-compatible authentication path. DAV requests originate from the ALPS
backend, so the DAV server may be hosted on a different domain.

An enabled plugin always exposes its Settings section. Calendar and Tasks tabs,
or Contacts, appear once a default or personal endpoint is configured. An
unavailable server does not remove a configured connection's tabs. Disabled
plugins expose neither settings nor navigation.

---

## 2. Configuration & Discovery

Enable the plugins in `config.toml` with `[plugin.caldav] enabled = true` and/or
`[plugin.carddav] enabled = true`. Configure default server addresses in their
`server` entries, or use provider service routing for defaults per domain. A
default server is optional: users can set up personal endpoints in Settings.

### Supported Schemes
- `caldavs://` and `carddavs://` (Resolves to `https://`)
- `caldav+insecure://` and `carddav+insecure://` (Resolves to `http://` for local/trusted networks)

Personal URLs accept `https://`, `caldavs://` and `carddavs://`. They require an
explicit scheme and cannot contain credentials, a query, or a fragment. DAV
requests and redirects stay on the configured origin so credentials are not
sent to another server through a redirect or a discovered resource URL.

Because any signed-in user can enter a personal URL, ALPS connects to personal
servers over HTTPS only and refuses, when it connects and on every redirect,
addresses that are not public: loopback, private, link-local and similar
ranges. A mail account therefore cannot use the setting to reach services on
the network ALPS runs in. If your users keep DAV servers on a trusted intranet,
set `dav_allow_private_servers = true` in `[server]`: personal URLs may then
also use `http+insecure://`, `caldav+insecure://` and `carddav+insecure://`,
and any address. Personal connections that need this stop working, and are
offered for removal in Settings, while the option is off. Servers the
administrator configures are never restricted, including when a user supplies
separate credentials for them.

### CalDAV Auto-Discovery
If you provide a bare domain without a scheme (e.g., `caldav.example.com`), the CalDAV plugin will attempt standard WebDAV auto-discovery (`DiscoverContextURL`) using well-known URIs or SRV records to locate the correct endpoint automatically.

### Sanity Checks
On startup, ALPS will issue an `OPTIONS` HTTP request to the configured upstream URLs. If the server is unreachable, ALPS will log a warning but continue starting up.

---

## 3. Backend Architecture

The backend routes are powered by the excellent `github.com/emersion/go-webdav` library. 

### Home Set Caching
A common performance issue with WebDAV protocols is the "discovery tax". Finding a user's calendar typically requires three sequential XML `PROPFIND` requests:
1. Discover the Current User Principal.
2. Discover the Calendar/AddressBook Home Set.
3. List the available Calendars/AddressBooks.

Once a user's principal and home set paths are discovered, the backend caches
them by mail account and effective DAV connection. A server or credential change
uses a different cache identity and triggers discovery again. Each request uses
one connection snapshot for discovery, reads, writes, and scheduling. Connections
are read fresh from account storage so changes made in another session apply to
the next DAV request.

---

## 4. Frontend & Synchronization

The UI components are built as modular Web Components using Lit, residing in `plugins/caldav/frontend` and `plugins/carddav/frontend`.

### Background Polling
Because CalDAV and CardDAV do not generally support persistent, open push connections (like IMAP IDLE), ALPS relies on background polling to keep the UI in sync with the server.

Both plugins hook into the global `SettingsStore`. Users can configure their preferred "Sync Interval" in their ALPS Settings. The frontend then maintains `setInterval` loops that periodically ping the ALPS backend (which proxies the request to the upstream CDAV server) to fetch the latest events and vCards, updating the UI reactively without requiring a page refresh.
