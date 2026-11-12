# Contacts & Calendars (CDAV)

Besides mail, ALPS shows contacts, calendars and tasks. It reads and writes them on CardDAV and CalDAV servers through two plugins:

- **caldav** provides the **Calendar** tab, the **Tasks** tab (the VTODOs kept in the same calendars), and an invitation banner above a message in the reader when the message has a calendar part.
- **carddav** provides the **Contacts** tab and address suggestions in the composer, and it saves the recipients of sent mail to the address book. The gpg plugin also looks up recipients' keys through it (see [GPG.md](GPG.md)).

When a plugin is turned off, the frontend drops its routes, tabs and hooks together: without caldav there is no Calendar, no Tasks and no invitation banner.

This document explains how these plugins are configured, how they authenticate, and how they read and write data.

---

## 1. Authentication (Passthrough)

ALPS sends every CalDAV and CardDAV request it makes for a user with HTTP Basic auth. The credentials are the login name and password the user signed in to ALPS with, whichever mail provider checked them: IMAP, the maildir passwd file (see [MAILDIR.md](MAILDIR.md)) or a multi backend. ALPS does not ask for a separate set of credentials for calendars and contacts, so the DAV server must accept Basic auth for that same login.

Use TLS endpoints (`https://`, `caldavs://`, `carddavs://`). With `http://`, `http+insecure://` or a `+insecure` scheme, the password crosses the network unencrypted. Certificates are checked against the system's trust store; there is no option to skip that check.

---

## 2. Configuration & Discovery

Configure the endpoints in `[plugin.caldav]` and `[plugin.carddav]` in `config.toml`. Each section takes:

| Key | Type | Meaning |
| --- | --- | --- |
| `enabled` | bool | Load the plugin. |
| `server` | string (URL) | The global DAV endpoint. |
| `options` | table | Plugin options (see [Options](#options)). |

There is no `[upstreams]` section, and ALPS ignores unknown tables without a warning. The full key reference is in [CONFIGURATION.md](CONFIGURATION.md).

```toml
[plugin.caldav]
enabled = true
server = "https://dav.example.com/"

[plugin.carddav]
enabled = true
server = "https://dav.example.com/"
```

### Loading the Plugins
A DAV plugin whose section sets `enabled = true` loads, with or without a `server`. Without a section, it loads when a `[provider.multi]` backend names its endpoint (see [Per-Domain Endpoints](#per-domain-endpoints-multi-provider)), as long as no `[plugin.*]` section sets `enabled = true`.

A section that does not set `enabled = true`, because it says `enabled = false` or leaves `enabled` out, keeps its plugin out even when it sets `server`, and once any `[plugin.*]` section sets `enabled = true`, so does having no section. Such a plugin is dropped at startup and logged as `Plugin "caldav" is disabled`. So set `enabled = true` in `[plugin.caldav]` and `[plugin.carddav]` as `config.example.toml` does (and in every other plugin you use), and give each DAV plugin either a `server` or per-domain endpoints in the multi provider.

A loaded plugin's tabs show for every user. A user with neither a global nor a per-domain endpoint gets an error on every request (`CalDAV server is not configured`, `CardDAV server is not configured`).

### Supported Schemes
| Section | TLS | Plain HTTP |
| --- | --- | --- |
| `[plugin.caldav]` | `https://`, `caldavs://` | `http://`, `http+insecure://`, `caldav+insecure://` |
| `[plugin.carddav]` | `https://`, `carddavs://` | `http://`, `http+insecure://`, `carddav+insecure://` |

`caldavs://` and `carddavs://` become `https://`; the `+insecure` schemes become `http://`. A plugin does not understand the other plugin's scheme: `caldavs://` in `[plugin.carddav]` does not work.

A bare host name with no scheme, port or path (`example.com`) is a discovery request in `[plugin.caldav]` and a startup error in `[plugin.carddav]`. A host name and port with no scheme (`dav.example.com:8443`) is not refused at startup, but the startup `OPTIONS` check fails and so does every request. Always write a full URL, with the port where it is not the default (`https://dav.example.com:8443/`).

### Per-Domain Endpoints (multi provider)
With the `multi` provider, each `[provider.multi.domains."<domain>"]`, `[[provider.multi.routes]]` and `[provider.multi.default]` table can also set `caldav =` and `carddav =`:

```toml
[[provider.multi.routes]]
domains = ["domain1.com", "domain2.com"]
type = "imap"
server = "imaps://imap.sharedmail.com:993"
caldav = "https://dav.sharedmail.com"
carddav = "https://dav.sharedmail.com"
```

- That endpoint serves every login the table matches.
- A login whose domain matches no `domains` or `routes` entry uses the `default` table's.
- A table that names no endpoint uses the global `[plugin.caldav]` / `[plugin.carddav]` `server`, never another table's.
- These values must be full URLs with a scheme. A value without a scheme, or one that does not parse, is logged once for each such value (`caldav: provider named an unusable server ... (using the configured one)`, carddav likewise) and the global server is used.
- Per-domain endpoints are neither discovered nor probed at startup.

Under `multi`, a plugin without a global `server` loads when its section sets `enabled = true`, or, with no section, when some backend names its endpoint (see [Loading the Plugins](#loading-the-plugins)).

### CalDAV Auto-Discovery
When `[plugin.caldav]` `server` is a bare domain (for example `example.com`), ALPS runs DNS discovery once at startup (RFC 6764):

1. It looks up the SRV record `_caldavs._tcp.example.com` and connects over `https` to the first record's target and port.
2. The path is the `path=` value of the TXT record at `_caldavs._tcp.example.com`, or `/.well-known/caldav` when there is none.

Without that SRV record discovery fails: ALPS logs `caldav: failed to discover CalDAV server: ...` and does not load the CalDAV plugin, so Calendar, Tasks and the invitation banner are all missing. When a `[provider.multi]` backend names a `caldav` endpoint, the plugin loads all the same, without a global server: users whose backend names one keep their calendars, and the others get `CalDAV server is not configured`. There is no plain-HTTP discovery and no direct `/.well-known/caldav` probe of the domain. Per-domain `caldav` endpoints never use discovery and must be full URLs.

### CardDAV Has No Auto-Discovery
`[plugin.carddav]` `server` must be a full URL with a scheme. A bare host name such as `carddav.example.com` stops ALPS at startup with:

```
failed to load plugins: CardDAV server requires a scheme (https://, http+insecure://), got: //carddav.example.com
```

### Sanity Checks
At startup each DAV plugin sends one unauthenticated `OPTIONS` request, with a 10-second timeout, to its global `server` (for CalDAV, the discovered URL). Any 2xx, 401, 404 or 405 answer counts as reachable. Anything else, or no answer, is logged as `caldav: failed to connect to CalDAV server ... (continuing anyway)` (carddav likewise) and startup continues, after a delay of up to 10 seconds per plugin. Per-domain endpoints from the multi provider are not probed.

### Options
`[plugin.caldav]` takes one option:

```toml
[plugin.caldav]
options = { week_start = 0 }
```

`week_start` sets the default first day of the week for users who have not chosen one in Settings > Localization > First Day of the Week. It accepts `0` or `"sunday"`/`"sun"` for Sunday, and `1` or `"monday"`/`"mon"` for Monday. Any other value means Monday, which is also the default (`1`). `first_day_of_week` is accepted as an alias.

`[plugin.carddav]` reads no options.

### Debug Output
With `[server] debug = true`, both DAV plugins write every CalDAV/CardDAV request and response to standard output, bodies included, with the `Authorization` header redacted. The output holds users' events and contacts, so keep `debug` off in production.

---

## 3. Backend Architecture

The backend does not proxy DAV. The frontend calls the plugins' JSON routes, and the backend turns each call into `PROPFIND`, `REPORT`, `GET`, `PUT`, `DELETE`, `MKCALENDAR`, `PROPPATCH` or `OPTIONS` requests to the user's DAV server (and `POST` where a server refuses `MKCALENDAR` or `PROPPATCH`, see [below](#address-books-and-calendars)).

The go-webdav library (`github.com/migadu/go-webdav` v1.0.0, Migadu's fork of `github.com/emersion/go-webdav`) handles discovery, the principal and home-set `PROPFIND`s, collection listing, `REPORT` queries and reading single objects (`GET`). Writes of events, tasks and contacts, and every delete, go through ALPS's own `internal/davsave`. Calendar create (`MKCALENDAR`), rename (`PROPPATCH`) and the scheduling requests (`OPTIONS` on the calendar home, a `PROPFIND` for the principal's addresses) are built in `plugins/caldav`.

### Routes
CalDAV:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`, `POST` | `/calendar/calendars` | List calendars; create one. |
| `PATCH`, `DELETE` | `/calendar/calendars/{path}` | Rename a calendar; delete it. |
| `GET`, `POST` | `/calendar/events` | List events (`start`, `end`, `query`); create one. |
| `POST` | `/calendar/events/{path}/edit` | Save an event. |
| `DELETE` | `/calendar/events/{path}` | Delete an event. |
| `POST` | `/calendar/events/{path}/respond`, `/calendar/tasks/{path}/respond` | Answer an invitation already in the calendar. |
| `GET`, `POST` | `/calendar/tasks` | List tasks; create one. |
| `POST` | `/calendar/tasks/{path}/edit`, `/calendar/tasks/{path}/complete` | Save a task; tick it off or back on. |
| `DELETE` | `/calendar/tasks/{path}` | Delete a task. |
| `GET` | `/calendar/invitation` | Read the calendar part of a message (`mailbox`, `uid`). |
| `POST` | `/calendar/invitation/respond`, `/calendar/invitation/apply` | Answer an invitation; apply an update, cancellation, reply or published event. |

CardDAV:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/contacts` | List contacts (optional `?query=`). |
| `GET` | `/contacts/{path}` | Read one contact. |
| `POST` | `/contacts/create` | Create a contact. |
| `POST` | `/contacts/{path}/edit`, `/contacts/{path}/categories` | Save a contact; change its categories. |
| `DELETE` | `/contacts/{path}` | Delete a contact. |

### Writes and Conflicts
- An edit is a `PUT` with `If-Match` carrying the ETag that was read, when the ETag is strong. A weak ETag is not sent.
- ALPS also checks the ETag the editor was opened at, so a change saved elsewhere meanwhile is refused with HTTP 412 `changed elsewhere since it was opened`.
- A contact created in the contact editor is written with `If-None-Match: *`. New events and tasks are unconditional `PUT`s.
- Deletes of events, tasks, calendars and contacts are unconditional. An event, task or contact that is already gone counts as deleted; a calendar must still be in the user's list, or the delete is refused with HTTP 403.
- A cancellation applied from a message (see [Invitations in Mail](#invitations-in-mail)) deletes the calendar's copy with `If-Match`, at the version that was read.

### Home Set Caching
Finding a user's collections takes three `PROPFIND` requests:
1. Discover the current-user principal.
2. Discover the calendar or address book home set.
3. List the calendars or address books in it.

On a login's first CalDAV or CardDAV request, ALPS runs steps 1 and 2 and caches the home-set path in memory in that ALPS process, keyed by login name. Every later request still runs step 3 (one `PROPFIND`) before it queries the collections.

The cache has no expiry and is not cleared at sign-out. When step 3 fails, the request fails and the login's cached home set is dropped, so the next request runs steps 1 and 2 again and finds a home set that has moved on the server. Otherwise the cache is emptied only when it grows past 1000 logins or the process restarts. Each cluster node keeps its own (see [CLUSTER.md](CLUSTER.md)). CalDAV also caches each login's scheduling capability and addresses for 10 minutes (see [section 5](#5-scheduling-invitations-and-tasks)).

### Address Books and Calendars
CardDAV uses only the first address book the server lists in the user's home set. Other address books are never shown or written to. If there are none, every contacts request fails with `carddav: no address book found`. ALPS never creates an address book, so the server must provision one per account.

CalDAV shows every calendar in the home set, and an empty home is valid. Users can:

- create calendars (`MKCALENDAR`, or `POST` when the server answers 405 or 501). The Tasks tab creates lists restricted to VTODO, and if the server refuses the restriction with 403 the list is created without it;
- rename them (`PROPPATCH`, or `POST` when the server answers 405 or 501);
- delete them. A calendar whose path ends in `/default` cannot be deleted from ALPS.

---

## 4. Frontend & Synchronization

The UI components are Lit web components in `plugins/caldav/frontend` and `plugins/carddav/frontend`.

### Background Polling
CalDAV and CardDAV have no push connection like IMAP IDLE, so the pages poll. There is no separate sync interval. While the Calendar, Tasks or Contacts page is open, it reloads its data every **Check mail interval** minutes, the mail setting in Settings > General (1, 5, 15 or 30 minutes; default 5).

Leaving the page stops its timer, so nothing refreshes calendars, tasks or contacts while the user is in Mail. Coming back loads fresh data.

### Address Suggestions and Saved Recipients
With carddav on, every To, Cc and Bcc recipient of a sent message is saved to the user's first address book. A recipient whose address is already in it (matched ignoring case) is left alone.

As the user types an address in the composer, it suggests contacts whose name (`FN`) or email (`EMAIL`) matches the text.

### Calendar Search
Calendar search looks only at events from 3 months before to 3 months after today, whatever range is on screen. It matches the text against each event's title, description and location, ignoring case, so events outside that window are never found. Without a search, events are read for the requested range, or the current month when none is given.

---

## 5. Scheduling, Invitations and Tasks

### Who Sends Invitations
Who sends invitations and replies depends only on the CalDAV server:

- If the calendar home's `DAV` header (from an `OPTIONS` request) lists `calendar-auto-schedule` (RFC 6638), ALPS only writes the calendar and the server delivers the invitations and replies.
- Otherwise ALPS mails them itself as iMIP (RFC 6047), through the user's own SMTP submission server and as the user, so calendar mail needs working SMTP submission (see [MAIL_SERVER.md](MAIL_SERVER.md)).

A server that does not answer counts as not scheduling. The answer is cached per login for 10 minutes.

The user's own addresses are their address (the sign-in address, or a bare sign-in name completed with the multi provider's `default_domain`) plus the principal's `calendar-user-address-set`. A user who signs in with a bare name organizes as that name completed with `default_domain`, or else as the first `calendar-user-address-set` entry.

A meeting can have at most 200 guests. Removing an event that has ended notifies nobody, and neither does a change to one that leaves it in the past; a change that moves it to a time still to come is sent as usual. An invitation to an event that has ended cannot be answered.

### Invitations in Mail
A message with a calendar part (`text/calendar`, `application/ics` or an `.ics` attachment, up to 1 MiB) gets a banner in the reader. The banner lets the user accept, mark tentative or decline, or apply an update, and lists up to 5 busy events that overlap the invitation. It is served by `GET /calendar/invitation`, `POST /calendar/invitation/respond` and `POST /calendar/invitation/apply`.

- The message is always read from the user's mailbox.
- An invitation or cancellation for a meeting the user organizes changes nothing and sends nothing.
- When the message comes from the organizer (an update or cancellation) or from the attendee (a reply to the user's meeting), and the receiving mail server's authentication checks did not fail it, it is applied as soon as it is opened, unless the event has ended. With a server that schedules on its own, replies are left to the server. Set `authserv_ids` in `[provider.imap]` (or in each IMAP backend under `multi`) so that ALPS reads your own mail server's verdict (see [CONFIGURATION.md](CONFIGURATION.md)).
- Anything else, including a published (`PUBLISH`) event, waits for the user.

### Tasks
Tasks are the VTODOs in the same calendars, served at `GET`/`POST /calendar/tasks`, `POST /calendar/tasks/{path}/edit`, `/complete` and `/respond`, and `DELETE /calendar/tasks/{path}`. Without the caldav plugin there are no tasks.
