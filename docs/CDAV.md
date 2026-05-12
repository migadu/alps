# Contacts & Calendars (CDAV)

ALPS is more than just a webmail client; it is a full Personal Information Management (PIM) suite. It achieves this by providing native **CardDAV (Contacts)** and **CalDAV (Calendar)** clients through its plugin system.

This document explains how these plugins operate, authenticate, and synchronize data.

---

## 1. Authentication (Passthrough)

ALPS assumes a unified backend identity system (such as LDAP, Active Directory, or an integrated mail server stack). 

When ALPS communicates with your upstream CalDAV and CardDAV servers, it **reuses the user's IMAP credentials**. It does not prompt the user for a separate set of credentials for calendars and contacts. This ensures a seamless, single-sign-on experience for the end user.

---

## 2. Configuration & Discovery

To enable the plugins, you must configure the upstream server addresses in your `config.toml` file under the `[upstreams]` or `[plugin.caldav]` sections.

### Supported Schemes
- `caldavs://` and `carddavs://` (Resolves to `https://`)
- `caldav+insecure://` and `carddav+insecure://` (Resolves to `http://` for local/trusted networks)

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

To eliminate this latency, ALPS implements an aggressive **Home Set Cache**. Once a user's principal and home set paths are discovered, the backend caches the path strings in memory associated with the `Session` username. Subsequent API requests skip directly to querying the calendar/address book data.

---

## 4. Frontend & Synchronization

The UI components are built as modular Web Components using Lit, residing in `plugins/caldav/frontend` and `plugins/carddav/frontend`.

### Background Polling
Because CalDAV and CardDAV do not generally support persistent, open push connections (like IMAP IDLE), ALPS relies on background polling to keep the UI in sync with the server.

Both plugins hook into the global `SettingsStore`. Users can configure their preferred "Sync Interval" in their ALPS Settings. The frontend then maintains `setInterval` loops that periodically ping the ALPS backend (which proxies the request to the upstream CDAV server) to fetch the latest events and vCards, updating the UI reactively without requiring a page refresh.
