# Mail Filters and Auto-Reply

The `managesieve` plugin adds two tabs to **Settings**: **Filters** and **Auto-reply**. Both edit one Sieve script on the mail server over ManageSieve (RFC 5804): the account's active script. The mail server runs that script when it delivers a message. ALPS only reads and writes the script, and stores nothing about filters outside it: the state its editors need is kept in comments inside the script itself.

This document covers how the plugin is configured and connects, which script it edits, how the visual rules and the auto-reply are stored in that script, the raw editor, the Sieve extensions it needs, validation, and the routes. The plugin's code is in `plugins/managesieve`.

---

## 1. Configuration

The plugin reads `[plugin.managesieve]` in `config.toml`:

| Key | Type | Meaning |
| --- | --- | --- |
| `enabled` | bool | Load the plugin. |
| `server` | string (URL) | The global ManageSieve server. See [Connection Schemes](#connection-schemes). |

```toml
[plugin.managesieve]
enabled = true
server = "managesieve://mail.example.com:4190"
```

The full key reference is in [CONFIGURATION.md](CONFIGURATION.md#9-plugins-pluginname). At startup ALPS logs `Configured ManageSieve server: <url>`. A `server` it cannot parse, or one with a scheme it does not accept, stops ALPS from starting.

### Loading the Plugin

The plugin loads only when `[plugin.managesieve]` sets `server`, or a `[provider.multi]` backend names a `managesieve` endpoint. A section with neither leaves it out, and unless it says `enabled = false`, startup logs `ManageSieve enabled without a server or routed endpoint; plugin disabled`.

A `[plugin.managesieve]` section that says `enabled = false` keeps the plugin out. Once any `[plugin.*]` section sets `enabled = true`, so does a section that leaves `enabled` out, or having no section. ALPS then logs `Plugin "managesieve" is disabled` at startup. So with such sections set `enabled = true` here, as `config.example.toml` does. To switch filters off, set `enabled = false`.

A loaded plugin's tabs show for every user. When the plugin loaded for the endpoints that some backends name, a user with neither a global nor a per-domain server sees **Could not load the filters.** on the Filters tab and **Could not load the auto-reply.** on the Auto-reply tab, and each request is logged as `managesieve: failed to connect to the sieve server: ManageSieve server is not configured`.

### Connection Schemes

ALPS opens a plain TCP connection to the server and upgrades it with STARTTLS before it signs in. None of the schemes is implicit TLS, `managesieves://` included. The port is 4190 unless the URL names another one.

| `server` value | STARTTLS offered | STARTTLS not offered |
| --- | --- | --- |
| `managesieves://host[:port]`, `managesieve://host[:port]`, `sieve://host[:port]`, or a bare `host` | Used. The certificate is verified against the host in the URL. | Refused. ALPS does not sign in. |
| `managesieve+insecure://host[:port]`, `sieve+insecure://host[:port]` | Used, without certificate verification. | ALPS signs in over cleartext and logs `WARNING: ManageSieve connecting without TLS (insecure scheme); credentials are sent in cleartext`. |

Use a `+insecure` scheme only for a server on the same host or a trusted local network. Any other scheme is rejected. A value without a scheme is accepted only as a bare host name: `mail.example.com:4190` reads as an unknown scheme and is rejected, so write `managesieve://mail.example.com:4190`. Write an IPv6 address in brackets: `managesieve://[2001:db8::1]:4190`.

### Signing In

ALPS signs in with SASL PLAIN, using the username and password of the signed-in account (see [SESSIONS.md](SESSIONS.md)). The ManageSieve server must accept the login and password the user signed in to ALPS with. There is no separate set of credentials for filters.

Every request to the plugin opens a new connection and closes it when the request is done. The connection attempt times out after 15 seconds, and so does each command ALPS writes and each line it waits for from the server. A script the server sends as a literal has 30 seconds to arrive.

With `[server] debug = true`, ALPS logs the ManageSieve exchange through `[logging]`, as `protocol trace` lines at debug level (`protocol` `managesieve`), so only while `[logging] level` is debug. The `AUTHENTICATE` argument is written as `[REDACTED]`, but script contents can appear in full: a script ALPS uploads is always written out.

### Per-Domain Servers (multi)

There is no DNS SRV discovery for ManageSieve: ALPS uses only the servers named in the configuration. With the `multi` provider (see `[provider.multi]` in [CONFIGURATION.md](CONFIGURATION.md#providermulti)), a backend can name the ManageSieve server for the logins it serves with a `managesieve` key:

```toml
[[provider.multi.routes]]
domains = ["example.com", "example.org"]
type = "imap"
server = "imaps://imap.example.com:993"
managesieve = "managesieve://imap.example.com:4190"
```

For a login, ALPS takes the domain (the `default_domain` for a bare user name) and uses the `managesieve` key of the first of these that matches:

1. the `[provider.multi.domains."<domain>"]` entry,
2. a `[[provider.multi.routes]]` entry listing the domain,
3. `[provider.multi.default]`, for a domain no entry or route lists (domains reached by `template` or `autodiscover` included).

When the matching backend has no `managesieve` key, the global `[plugin.managesieve] server` applies. A per-domain URL takes the same schemes as the global one, and whether it may skip TLS comes only from its own scheme, never from the global server's. A per-domain URL ALPS cannot parse is logged, once for each such value (`managesieve: provider named an unusable server ...`), and the global server is used instead.

---

## 2. Which Script ALPS Edits

ManageSieve stores several named scripts per account and runs at most one of them, the active one. ALPS works on the active script only:

- **Reading.** ALPS reads the active script, whatever its name. A script made by another client or by an administrator is shown too. With no script active, the pages start empty.
- **Saving.** ALPS writes into the active script in place, under its existing name, and makes it active again.
- **No active script.** ALPS saves under the first of `alps-filters`, `alps-filters-2`, `alps-filters-3` and so on that is not stored yet or holds only whitespace, and activates it. A script that holds rules but was switched off, by another client or an administrator, is therefore not overwritten.
- **Other scripts.** ALPS never renames or deletes a script. It writes to a script that is not active only to reuse an empty `alps-filters` name as above, or to empty the script it has just switched off (below).
- **Empty content.** Saving empty or whitespace-only content switches every script off (`SETACTIVE ""`) and then overwrites the script that was active with an empty one. If the server refuses the empty write, that is only logged: filtering is off either way, and while that script still holds rules, the next save does not reuse it.

On the Filters page, saving with every rule removed, or with the raw editor emptied, sends empty content, and the toast reads **Rules deactivated.** When the script holds an auto-reply block, even one that is switched off, that block stays, so the saved script is not empty and stays active (see [The Auto-Reply Block](#the-auto-reply-block)). While that auto-reply is on, the toast reads **Rules saved and activated.** instead.

---

## 3. How the Rules and the Auto-Reply Are Stored

Both pages write plain Sieve, and each keeps what the user entered in a comment next to the Sieve it generates. The pages read that comment back rather than parsing Sieve.

### Visual Rules

The visual editor builds rules from conditions and actions:

| Condition | Comparisons | Sieve written |
| --- | --- | --- |
| Subject, From, To | contains, does not contain, is exactly, is not exactly | `header :contains` or `header :is`, with `not` for the negative forms |
| Body | the same four | `body :text :contains` or `body :text :is`, with `not` for the negative forms |
| Size | over, under | `size :over` or `size :under`, with a number and an optional `K`, `M` or `G`; any other value is written as `0` |

A rule with more than one condition matches when **all** of them match (`allof`) or when **any** of them does (`anyof`).

| Action | Sieve written |
| --- | --- |
| Move to folder | `fileinto :create "<folder>"` |
| Redirect to email | `redirect "<address>"` |
| Discard (Delete) | `discard` |
| Stop evaluating rules | `stop` |

The compiled script starts with the `require` its rules need: `fileinto` and `mailbox` for a move to a folder (`:create` comes from `mailbox`), and `body` for a body condition. The rules themselves follow a comment holding the editor's state, the rules as base64-encoded JSON:

```sieve
require ["fileinto", "mailbox"];

# ALPS_VISUAL_STATE: <base64 JSON>

if header :contains "Subject" "invoice" {
  fileinto :create "Invoices";
}
```

A rule with no condition or no action is kept in the state but writes no Sieve.

### When the Filters Page Opens the Raw Editor

The Filters page opens in the visual editor only when the script has an `# ALPS_VISUAL_STATE:` comment and the script still is what those rules compile to (the comment line and line-ending differences aside). Otherwise it opens in the raw editor, with the script as it is stored. That is the case for a script written by hand, one made by another client, and one changed in the raw editor. An empty script opens in the visual editor with no rules.

### The Auto-Reply Block

The auto-reply is a block in the same script, between two marker comments. The first holds the page's state, as base64-encoded JSON:

```sieve
# ALPS_AUTOREPLY: <base64 JSON>
require ["vacation", "date", "relational"];
if allof (currentdate :zone "+0100" :value "ge" "date" "2026-12-21", currentdate :zone "+0100" :value "le" "date" "2027-01-04") {
	vacation :days 7 :from "ada@example.com" :addresses ["ada@example.com"] :subject "Out of office" "I am away until 5 January.";
}
# ALPS_AUTOREPLY_END
```

- The block goes after the script's leading `require` commands, since Sieve allows `require` only before any other command. It carries its own `require`. When the last leading `require` shares its line with a command or a multi-line comment, or ends the script without a line break, ALPS adds one line break before the block; that is the only change it makes around the block.
- Without dates, the block requires only `vacation` and the `vacation` command stands without the `if`.
- Switched off, the block keeps only its two comment lines. The text is still in the state, so it is there when the auto-reply is switched back on.

The Filters page is given the script with the block taken out. Before saving, each page reads the stored script again and replaces only its own part: the Filters page saves its rules around the block as the server holds it now, and the Auto-reply page replaces the block and keeps the filters as they were written, a script the visual editor cannot read included. Of two saves made at the same moment, the later write wins.

Sieve does not allow two `vacation` actions in one script, so the pages keep them apart:

- While the auto-reply is on, the Filters page refuses to save filters that contain a `vacation` command of their own, with **The auto-reply is on. Switch it off under Auto-reply before the filters send a vacation reply of their own.**
- When the filters already contain a `vacation` command, the Auto-reply page shows a notice to remove it in the raw editor instead of its form.

---

## 4. The Raw Editor

The raw editor shows the script as Sieve text, with syntax highlighting. It has two buttons:

- **Validate** sends the text in the editor, without the auto-reply block, to `POST /managesieve/validate` and shows the result. Nothing is saved.
- **Save** sends the text, merged with the auto-reply block, to `PUT /managesieve/script`, which validates it too (see [Validation and Limits](#6-validation-and-limits)). A script that does not validate is not saved, and the stored one stays as it was.

The visual editor shows a **Raw Editor** button once there is at least one rule. It asks for confirmation and then opens the raw editor with the script the rules compile to, the `# ALPS_VISUAL_STATE:` comment included. The raw editor has no way back. The next time the page opens, it shows the visual editor only if the script still matches its rules (see [When the Filters Page Opens the Raw Editor](#when-the-filters-page-opens-the-raw-editor)).

An edit left unsaved on either page, and not discarded, is kept in the browser's memory until the page is shown again in the same session, and is put back only if that page's part of the stored script (the filters, or the auto-reply) has not changed since.

---

## 5. Sieve Extensions

The server lists the Sieve extensions it runs in its `SIEVE` capability. `GET /managesieve/script` returns that list as `extensions`, and validation allows only those extensions.

- **Auto-reply** works only when the server lists `vacation`. Otherwise the tab shows **This mail server does not offer automatic replies.** Start and end dates are offered only when the server also lists `date` and `relational`. Without them, dates stored earlier are dropped from the form, and the next save writes the reply without them.
- **Filters** does not check the list. The visual editor writes the `require` its rules need whatever the server lists, and a save the server's extensions do not cover is refused by validation, for example with `Invalid Sieve script: extension 'body' is not supported`.

ALPS's own check, with the go-sieve library, knows these extensions: `fileinto`, `envelope`, `encoded-character`, `comparator-i;octet`, `comparator-i;ascii-casemap`, `comparator-i;ascii-numeric`, `comparator-i;unicode-casemap`, `imap4flags`, `variables`, `relational`, `vacation`, `copy`, `regex`, `date`, `index`, `editheader`, `mailbox`, `subaddress` and `body`. A script that requires another extension the server lists, such as `include`, is left to the server: Save uploads it and the server accepts or refuses it, and Validate asks the server where it can (see [Validation and Limits](#6-validation-and-limits)). A script that requires an extension the server does not list is refused before it is sent.

---

## 6. Validation and Limits

`PUT /managesieve/script` and `POST /managesieve/validate` check the script first in ALPS, with the go-sieve library, before the script is sent, and then on the server: on `PUT` as the server stores it (`PUTSCRIPT`), and on `POST` with `CHECKSCRIPT`, which stores nothing. `CHECKSCRIPT` is sent only to a server that lists `VERSION` among its capabilities; on any other server, `POST` relies on ALPS's check alone. A `PUT` with empty or whitespace-only content is not checked: it switches filtering off (see [Which Script ALPS Edits](#2-which-script-alps-edits)).

- Only the extensions in the server's `SIEVE` capability are allowed. A server that lists none allows none.
- When a script requires an extension that go-sieve does not know but the server lists (see [Sieve Extensions](#5-sieve-extensions)), ALPS's check stops at that `require` and lets the script through, for the server to judge. Where `POST` cannot ask the server, it refuses such a script with `loadRequire: unsupported extension: <name>`.
- An invalid script is answered with 400 and `{"error": "Invalid Sieve script: ..."}`, followed by the library's message or the server's. A syntax error in the script's structure, or a command the library does not know, starts with its line and column, as in `3:1: LoadBlock: unsupported command: fileintoo`. An unsupported extension or an unexpected character is reported without a position. The server's message is passed on whole, on several lines when the server sends several. A server that answers `NO (TRYLATER)` has not refused the script: that answer is 500 `sieve_unavailable`, as in [Routes](#8-routes). The Filters page shows the message as it is.
- The parser's limits apply: at most 5000 tokens, and blocks and tests nested at most 15 deep.

Size limits:

- The request body of both routes is capped at 1 MiB. A larger body, or one that is not JSON, is answered with 400 and `{"error": "Invalid request payload"}`.
- ALPS reads a stored script of at most 1 MiB. A larger one cannot be read, and the page shows that it could not load.
- The server applies its own limits, such as a maximum script size, when ALPS uploads. A script the server refuses there is answered 400 with the server's message, as above.

The check for two `vacation` actions (see [The Auto-Reply Block](#the-auto-reply-block)) runs in the browser, before the upload.

---

## 7. The Auto-Reply

The Auto-reply page edits one reply:

| Field | Meaning |
| --- | --- |
| **Send an auto-reply** | Switches the reply on or off. Off, the block keeps the text but sends nothing. |
| **Subject** | Optional. Left empty, ALPS leaves out `:subject` and the server chooses the subject. |
| **Message** | The reply's text. Required while the reply is on. |
| **Start date**, **End date** | Optional; either end can be left open. Offered only when the server lists `date` and `relational`. |
| **Answer the same sender again after** | 1, 3, 7, 14 or 30 days (the `vacation` `:days`), 7 by default. A stored value outside that list is still shown. |

- **Address.** The reply is sent from, and answers for, the account's own address (`:from` and `:addresses`). When ALPS knows no address for the login, only a bare user name, both are left out and the server uses the account's address.
- **Dates.** A day runs from midnight to midnight in the browser's time zone. The server compares the dates at delivery with `currentdate`. Each date is written with a fixed offset from UTC, taken from the browser when the reply is saved: the start date with the offset at the midnight that begins it, the end date with the offset at the midnight that ends it. A start date after the end date is refused.
- **Status.** While the saved reply is on, the page says whether it is answering now, is scheduled to start, or has passed its end date.

---

## 8. Routes

| Method | Path | Request body | Success |
| --- | --- | --- | --- |
| `GET` | `/managesieve/script` | None | 200 `{"content": "<active script>", "extensions": ["fileinto", ...]}`. `content` is `""` when no script is active, and `extensions` is `[]` when the server lists none. |
| `PUT` | `/managesieve/script` | `{"content": "<script>"}` | 200 `{"message": "Script saved and activated successfully"}`, or `{"message": "Script deactivated successfully"}` for empty content. |
| `POST` | `/managesieve/validate` | `{"content": "<script>"}` | 200 `{"message": "Script is valid"}`. |

`PUT` and `POST` answer 400 with `{"error": "Invalid request payload"}` or `{"error": "Invalid Sieve script: ..."}` (see [Validation and Limits](#6-validation-and-limits)).

All three routes need a signed-in session; without one they answer 401. When ALPS cannot connect or sign in to the ManageSieve server, has no server for the login, or the server refuses a command, the route answers 500 with `{"error": "sieve_unavailable"}`, and the reason goes to the log only, as `managesieve: failed to <step>: <error>`. The exception is the server refusing the script itself, on upload or on `CHECKSCRIPT`: that is the 400 above, unless the refusal says `TRYLATER`.

---

## 9. Testing

The plugin's Go tests are in `plugins/managesieve`, and its frontend tests in `frontend/test/sieve-*.test.ts` and `frontend/test/auto-reply-settings.test.ts`. The browser tests `frontend/e2e/filters.spec.ts` and `frontend/e2e/auto-reply.spec.ts` run both pages against sora's ManageSieve server and check that the rules file mail and the auto-reply answers (see [E2E.md](E2E.md)).
