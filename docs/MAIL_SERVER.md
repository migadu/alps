# Mail Server Requirements

ALPS keeps no mail of its own. It reads and files mail on an IMAP server, keeps its per-account records on that server as IMAP METADATA, and sends through an SMTP submission server. This document says what ALPS needs from those two servers: how it connects and signs in, which IMAP capabilities it uses and what it does without each one, which folders it files into, how it handles a server's `[LIMIT]` refusals, and how a message is submitted and filed.

The configuration keys named here are described in [CONFIGURATION.md](CONFIGURATION.md): the IMAP server under [`[provider.imap]`](CONFIGURATION.md#providerimap), per-domain servers under [`[provider.multi]`](CONFIGURATION.md#providermulti), and the submission server under [`[smtp]`](CONFIGURATION.md#smtp).

The IMAP sections apply to the `imap` provider and to `multi` backends of type `imap`. The `maildir` provider needs no IMAP server (see [MAILDIR.md](MAILDIR.md)), but it still sends through SMTP.

---

## 1. IMAP Connection and Sign-In

`[provider.imap] server` must carry one of these schemes:

| Scheme | Transport | Default port |
| --- | --- | --- |
| `imaps://` | Implicit TLS | 993 |
| `imap://` | STARTTLS, always. The connection fails if the server does not upgrade it. | 143 |
| `imap+insecure://` | Plaintext, no TLS | 143 |

`[provider.imap] insecure = true` makes `imap://` plaintext as well. It does not relax certificate checks, and it never changes `imaps://`. TLS certificates are checked against the host's system roots.

`[provider] timeout_sec` (default 30 seconds) bounds the TCP connect, with the TLS handshake for `imaps://`, and the wait for a few of the server's answers, which [CONFIGURATION.md](CONFIGURATION.md#provider) lists. `LOGIN` and the other commands are not bounded by it: there the IMAP client waits at most 30 seconds for each response, a fixed limit that no key changes. For the `imap` provider, `[server] imap_timeout_sec` is used when `timeout_sec` is unset.

ALPS signs in with the IMAP `LOGIN` command, sending the username and password the user typed on the sign-in page. It does not use `AUTHENTICATE` (SASL) or OAuth, so the server must accept `LOGIN` on the connection ALPS opens, which for `imap://` is after STARTTLS. The server's answer decides what the sign-in gets:

| Answer to `LOGIN` | ALPS answers the sign-in with |
| --- | --- |
| `OK` | The session, or the request for a second factor |
| `NO` without one of the codes below | 401 `{"error":"Failed to login"}`: wrong username or password |
| `NO [UNAVAILABLE]`, `NO [SERVERBUG]`, `BAD`, or a lost connection | 503 `{"error":"Mail service temporarily unavailable","code":"service_unavailable"}` |
| `NO [LIMIT]` | 503 `{"error":"connection_limit"}`: the account holds as many connections as the server allows |

Only the plain `NO` counts as a failed attempt for the username in ALPS's own sign-in limits (see [RATELIMIT.md](RATELIMIT.md#limits-set-by-the-mail-server)).

Each session keeps its own IMAP connection, and by default opens a second one for background work when it first has some, closing it once it has gone unused for a minute. With `push_new_mail` on, that second connection stays open while a mail page is open. While a command the session gave up on is still running, the session can hold a third for a moment. Every connection comes from ALPS's own address, so the server's per-user and per-address connection limits must leave room for them. See [SESSIONS.md](SESSIONS.md#the-session-architecture), and `background_connection` and `push_new_mail` in [CONFIGURATION.md](CONFIGURATION.md#12-session-limits).

---

## 2. METADATA: Where ALPS Keeps Its Records

ALPS has no database. It keeps an account's settings (identities among them), linked accounts, security keys and recovery codes, and GPG keyring on the IMAP server as server METADATA (RFC 5464). These are entries on mailbox `""`, all under `/private/vendor/alps/`. ALPS uses this store when the server lists `METADATA` or `METADATA-SERVER`. [ARCHITECTURE.md](ARCHITECTURE.md#4-stateless-persistence-imap-metadata) lists the entries and what each one holds.

ALPS does not check for METADATA at startup. On a server without it, ALPS still starts and signs users in, but each IMAP connection gets a store of its own, in memory:

- Settings (identities included), linked accounts and security keys last only as long as that one connection. A reconnect or a new sign-in starts empty again, and the session's background connection does not see them.
- ALPS logs this once per process: `alps/provider: IMAP server doesn't support the METADATA extension, using transient store instead`.
- Two-factor sign-in with security keys needs METADATA, since a key added without it is not kept. In a cluster, recovery codes also need the METADATA store. See [WEBAUTHN.md](WEBAUTHN.md#storage-mechanism) and [WEBAUTHN_COORDINATION.md](WEBAUTHN_COORDINATION.md), which also say how ALPS lists the versioned entries.

Use a server without METADATA only for trying ALPS out.

---

## 3. IMAP Capabilities

ALPS needs an IMAP4rev1 (RFC 3501) or IMAP4rev2 (RFC 9051) server. It uses each capability below when the server lists it, and falls back as shown when the server does not.

| Capability | What ALPS uses it for | Without it |
| --- | --- | --- |
| `METADATA` or `METADATA-SERVER` (RFC 5464) | The per-account records (section 2) | The records last for one connection only |
| `UIDPLUS` (RFC 4315) | The new UID of a saved draft (APPENDUID) and of moved or copied messages (COPYUID), and `UID EXPUNGE`, which removes only the messages being deleted | Before each APPEND, ALPS reads the folder's UIDNEXT with STATUS and then finds the new copy by its Message-ID. A permanent delete ends with a plain `EXPUNGE`, which removes every message in that folder marked `\Deleted`, including ones another client marked and could still undelete. |
| `MOVE` (RFC 6851) | Moving messages between folders | COPY, then the same delete as above, with its plain `EXPUNGE` when the server also lacks UIDPLUS |
| `SORT` (RFC 5256) | Listing by message date | Flat listings and searches sorted by date come back in UID order, the order mail was filed in. Threaded listings are dated by ALPS from the message envelopes. |
| `THREAD=REFS`, `THREAD=REFERENCES` or `THREAD=ORDEREDSUBJECT` (REFERENCES and ORDEREDSUBJECT: RFC 5256) | Conversations, built with the first algorithm the server lists in the order REFS, REFERENCES, ORDEREDSUBJECT | Flat listings only |
| `MULTISEARCH` (RFC 7377) | Search All: one search across all subscribed folders | No Search All button. A search of `*` is refused with HTTP 400. `ESEARCH` (RFC 4731) alone is not enough. |
| `LIST-EXTENDED` (RFC 5258) or `LIST-STATUS` (RFC 5819) | Folders and subscriptions in one `LIST ... RETURN (SUBSCRIBED)`, with the counts as well under LIST-STATUS | A plain LIST followed by an LSUB. A server that lists these but answers `RETURN` with `BAD` gets a plain LIST from then on, for as long as that connection is open. |
| `NAMESPACE` (RFC 2342) | Telling other users' and shared folders from the user's own. The sidebar shows them under "Shared folders". | Every folder counts as the user's own, and only top-level folders are looked at for Sent and Drafts (section 4) |
| `ACL` (RFC 4314) | Folder sharing, and `MYRIGHTS` on other people's folders, so that only the actions the user may take are offered there | No sharing. Other people's folders are shown without the actions that need a right. |
| `QUOTA` (RFC 9208) | The storage meter in the account menu | No meter |
| `PREVIEW` (RFC 8970) | A line of each message's text under its subject in the list. A listing asks `PREVIEW (LAZY)`, so the server answers only the previews it has at hand; the page then asks for the rest in the background (`GET /mailboxes/{mbox}/previews`). Each preview is asked for once per session. | No previews |
| `BINARY` (RFC 3516) | Message parts fetched with `BINARY.PEEK`, decoded by the server | Parts are fetched as stored and decoded by ALPS. A part the server refuses as BINARY is fetched as stored as well. |
| `IDLE` (RFC 2177) | Only with `push_new_mail = true`: arrivals in and removals from the Inbox pushed to open pages | Pages check for mail at the user's check-mail interval |
| `NOTIFY` (RFC 5465) | Only with `push_subscribed_folders = true` as well: news of the subscribed folders | Only the Inbox is pushed |
| `CONDSTORE` (RFC 7162), through `ENABLE` (RFC 5161) where listed | Only with `condstore = true`: a page whose messages are all still there has only its changed flags read again | A page is read again in full when the folder's counts change. A flag change that leaves the counts as they were, such as a star set in another client, shows once the cached page expires. |

### Off Unless Configured

IDLE, NOTIFY and CONDSTORE are not used until the operator turns them on in `[server]`:

- **IDLE** (or a server that lists IMAP4rev2) is used only with `push_new_mail = true`, which is off by default, and with `background_connection` on, which is the default. ALPS then waits in IDLE on the Inbox on the session's background connection.
- **NOTIFY** is used only with `push_subscribed_folders = true` as well as `push_new_mail`.
- **CONDSTORE** is used only with `condstore = true`. ALPS turns it on with `ENABLE CONDSTORE` where the server lists ENABLE. Otherwise the first STATUS that asks for HIGHESTMODSEQ turns it on. **QRESYNC** is never enabled, even where the server lists it.

What each one costs and asks of the network is in [CONFIGURATION.md](CONFIGURATION.md#14-pushing-new-mail) (push) and [CONFIGURATION.md](CONFIGURATION.md#15-numbered-changes) (CONDSTORE).

### What IMAP4rev2 Counts For

A server that lists `IMAP4rev2` counts as having the capabilities that IMAP4rev2 includes. Of the ones ALPS uses, that is NAMESPACE, UIDPLUS, ENABLE, IDLE, LIST-EXTENDED, LIST-STATUS and MOVE. It does not count as having CONDSTORE, SORT, THREAD, MULTISEARCH, BINARY, ACL, QUOTA, NOTIFY or METADATA, so a server must list those itself. A server that lists QRESYNC counts as having CONDSTORE.

### Threading and Sorting

Use threading (Settings > Reading & Composing) is on by default when the server lists one of the THREAD algorithms. Without one, every listing is flat. A listing is also flat when:

- the folder holds more than 10,000 messages. Such a folder is never threaded, and without a search query it is listed by message number instead of with SORT.
- the server refuses the `THREAD` command (`NO` or `BAD`). ALPS lists the folder flat and logs the refusal once per IMAP connection and folder.

Messages are listed by message date unless the user picks the order mail arrived in the folder. A date order needs SORT for flat lists, as the table above says.

### Searching All Folders

With `MULTISEARCH`, the search-results banner offers **Search All**. ALPS sends one `ESEARCH IN (subscribed)`, so unsubscribed folders are not searched. See [SEARCH.md](SEARCH.md#searching-all-folders) for the query syntax and how the results are listed.

### Folder Sharing (ACL)

**Share…** appears on a folder of the user's own when the server lists ACL and its NAMESPACE answer has an other-users namespace, since without one nobody the folder is shared with could reach it. On a folder in another namespace, it appears when the user holds the administer right `a` there.

The dialog offers three levels:

| Level | Shown as | Rights granted (RFC 4314) |
| --- | --- | --- |
| `read_only` | Can read | `lrs` |
| `read_write` | Can read and organise | `lrswite` |
| `full` | Full access | `lrswipkxte` |

None of them grants the administer right `a`, so a person a folder is shared with cannot share it further. Rights that match none of the levels, set by another client, are shown as "Custom access". The person is named by one email address, with no display name or angle brackets. `anyone`, identifiers that start with `-`, and the user's own address are refused.

The routes are `GET /mailboxes/{mbox}/sharing` (the user's rights and the other people with access), `PUT /mailboxes/{mbox}/sharing/{identifier}` with `{"level": "..."}`, and `DELETE /mailboxes/{mbox}/sharing/{identifier}`. Their errors are 501 `not_supported` (no ACL), 400 `invalid_identifier`, `self` or `invalid_level`, 404 `unknown_identifier` (the server does not know that person), and 422 `refused` (the server answered `BAD`, or `NO` without a response code).

### Storage Quota (QUOTA)

`GET /quota` sends `GETQUOTAROOT INBOX` and answers the usage and limit, in bytes, of the quota root that limits `STORAGE` and is fullest as a share of its limit. A STORAGE limit of 0 counts as full. The account menu shows the meter, warns from 80% ("Mailbox N% full"), and turns critical from 95% ("new mail may be refused").

---

## 4. Special-Use Folders

ALPS never creates special folders. The account must already have them.

**Filed by the backend.** ALPS stores each sent copy in Sent and each draft in Drafts. It finds them in a `LIST` of the user's own folders (not other people's, and not `\Noselect` placeholders):

- A folder carrying the special-use attribute, `\Sent` or `\Drafts` (RFC 6154), is used first.
- Otherwise ALPS takes a folder by name, compared in any case after the personal namespace prefix (such as `INBOX.`): `Sent` for Sent, `Draft` or `Drafts` for Drafts.
- Without NAMESPACE, only top-level folders are looked at.

Without a Sent folder, a send gets an error after the message has already gone (section 7). Without a Drafts folder, draft saves fail.

**Used by the page.** Delete moves messages into Trash, Archive into Archive, and Report spam into Junk. The page finds those folders, and draws Sent, Drafts and the others in the sidebar, by the attributes `\Trash`, `\Archive`, `\Junk`, `\Sent`, `\Drafts` and `\All`. For a role no folder of the user's own carries as an attribute, it matches the whole folder name in any case: `Trash` or `Deleted Items`, `Archive` or `Archives`, `Junk` or `Spam`, `Sent`, `Drafts`. When no folder has the role, the action names a folder called `Trash`, `Archive` or `Junk`, and the server refuses the move if that folder does not exist. Folders in other people's namespaces never take a role.

A server that marks its folders with special-use attributes avoids every name guess.

---

## 5. When the Server Says `[LIMIT]`

ALPS treats a `NO [LIMIT]` (RFC 5530) as the server asking it to back off, not as a failure of the request:

- **Sign-in.** A `LOGIN` refused with `[LIMIT]` gets 503 `{"error":"connection_limit"}`, and the sign-in page says that too many connections are open to the account (section 1).
- **A session's own connection.** When a session has to reconnect and the server refuses it with `[LIMIT]`, a session that holds a background connection carries on with that one rather than ending. A session without one ends, and so does a session whose reconnect the server refuses with a bare `NO`. See `background_connection` in [CONFIGURATION.md](CONFIGURATION.md#12-session-limits).
- **Searches.** A search with a query whose SEARCH, SORT or ESEARCH the server refuses with `[LIMIT]` gets HTTP 429 `{"error":"search_rate_limited"}`. When the refusal's text names a wait, as `wait 42s` or `wait 1m5s`, ALPS adds `Retry-After` and `"retry_after"` in seconds. A refused THREAD does not get this answer: the results are listed flat instead. Nor does a listing, with a query or without, whose session ends because its reconnect was refused at the limit (the bullet above): it gets 503 `{"error":"mail_server_unavailable"}`, as every request does then.
- **Listings.** A folder listing without a query is never refused this way. When the server refuses its SORT or SEARCH, ALPS lists the folder by message number, and a refused THREAD gives a flat list.

See [SEARCH.md](SEARCH.md#when-the-mail-server-limits-searches) for what the user sees and [RATELIMIT.md](RATELIMIT.md#limits-set-by-the-mail-server) for how these differ from ALPS's own rate limits.

---

## 6. SMTP Submission

`[smtp] server` is required whatever the provider, `maildir` and `multi` included. Without it ALPS exits at startup with `no SMTP server specified in config file ([smtp] server)`.

| Scheme | Transport | Default port |
| --- | --- | --- |
| `smtps://` | Implicit TLS | 465 |
| `smtp://` | STARTTLS, required. The send fails if the server does not offer it. | 587 |
| `smtp+insecure://` | Plaintext, no TLS | 587 |

These ports apply to any host written without a port, a bracketed IPv6 address included. `[smtp] insecure = true` makes `smtp://` plaintext, including the `smtp://` URLs that `multi` names per domain. It does not relax certificate checks, and it never changes `smtps://`. TLS certificates are checked against the host's system roots. Over plaintext, the user's password crosses the network unencrypted.

ALPS keeps no SMTP connection open. For each send it:

1. Connects. For `smtp://` it reads the greeting, says EHLO and upgrades with STARTTLS.
2. Says `EHLO localhost`, or `HELO` if the server answers EHLO with 500 or 502.
3. Authenticates with `AUTH PLAIN`, using the same username and password the user signed in with. ALPS sends it without checking the server's EHLO list, so the submission server must accept AUTH PLAIN and those credentials on that connection, which for `smtp://` is after STARTTLS.
4. Sends `MAIL FROM` with the address chosen in From (the account's own address or an identity, see section 8), one `RCPT TO` for each To, Cc and Bcc recipient, and the message. It then sends `QUIT`.

Because `MAIL FROM` is the chosen From address, the submission server must let the login send as each of its identities' addresses.

**Timeouts.** The TCP connect, and for `smtps://` the TLS handshake, have a fixed limit of 30 seconds. `[server] smtp_timeout_sec` (default 30) then limits each command and the server's answer to the message. For `smtp://`, the greeting, the first EHLO and STARTTLS happen before that and use the SMTP client library's default of 5 minutes.

**Retries.** A send is tried up to 3 times in all, with pauses of 1 second and then 2 seconds, and on a fresh connection each time. It is tried again only after a failed connection or a temporary (4xx) reply. These are not tried again:

- refused credentials, which is any error reply to AUTH, 4xx included. The send gets 403 `{"error":"Forbidden"}`.
- a permanent (5xx) reply.
- a connection lost after the message was written, since the server may already have it, and a second attempt could deliver it twice.
- a send whose browser request has already gone away. Each attempt checks this before `MAIL FROM`.

Calendar invitations that ALPS mails itself (iMIP) are submitted the same way (see [CDAV.md](CDAV.md)).

### Per-Domain SMTP Under `multi`

With the `multi` provider, each `[provider.multi.domains."<domain>"]` table, each `[[provider.multi.routes]]` entry and `[provider.multi.default]` can set `smtp = "..."`, with the same schemes. A login is routed by its domain, or by `default_domain` when it has none. A backend that names no `smtp` uses the global `[smtp] server`. A login that no domain table or route names, such as one reached through `template` or `autodiscover`, takes the `smtp` of `[provider.multi.default]`, and the global server when that names none. See [CONFIGURATION.md](CONFIGURATION.md#providermulti).

---

## 7. How a Message Is Sent

1. **The From is checked.** The server writes the From header itself, from the account's address or one of its identities (section 8).
2. **The message is submitted** over SMTP as in section 6. It goes out without a Bcc header; the Bcc recipients are only in the SMTP envelope.
3. **A reply marks the original.** The message replied to is flagged `\Answered`. If that fails, the failure is logged and the send still counts as done.
4. **ALPS files the sent copy itself.** It stores the message as submitted, flagged `\Seen`, with IMAP `APPEND` into the account's Sent folder (section 4). After a network error during the APPEND, ALPS does not store the copy again: on another connection it looks in Sent for the copy by its Message-ID and carries on when it is there. When it is not, the filing counts as failed, since the first APPEND may still complete.
5. **The draft is removed.** When the message was sent from a draft, that draft is deleted.

If no Sent folder exists, or filing the copy or removing the draft fails, the send is answered with an error (`failed to save message to Sent mailbox: ...`) even though the message has already gone.

Because ALPS files the sent copy over IMAP, the submission server should not also save a copy of each submitted message into Sent, or every sent message appears there twice.

Drafts are saved the same way, with `APPEND` into Drafts, flagged `\Seen` and `\Draft`, and with their Bcc header kept. The draft being replaced is then deleted, which on a server without UIDPLUS means a plain `EXPUNGE` (section 3). See [ATTACHMENTS.md](ATTACHMENTS.md) for how a draft save handles its attachments.

---

## 8. From Addresses and Identities

The account's own address is the login when it contains an `@`. Under `multi`, a bare login is completed with `default_domain`. Otherwise the login itself is the address. A message from it goes out under the display name in Settings > Identity.

**Identities** are the other addresses a user sends from, such as aliases. They are listed under Settings > Identity > Sending addresses, and are kept as the `identities` list in the account's `base.settings` record (section 2), not in an entry of their own. Each settings save checks them:

- at most 20 identities.
- a name of at most 256 characters. An empty name means the account's display name is used.
- an address of at most 254 characters, written as one bare address, with no display name and no angle brackets.
- not the account's own address, and no address twice (compared in any case).

**The composer's From menu** appears once the account has an identity, and offers the account's own address and each identity.

**The server's check.** When a message is sent or a draft saved, the composer names only the address. The server builds the From from it and accepts only the account's address or an identity. If the session's copy of the settings does not hold the address, the server reads the record again from the IMAP server first, in case another browser has just added it. Any other address gets 403 `{"code":"sender_not_allowed"}`.

**The mail server has the final say.** ALPS does not decide which addresses a login may send from; the submission server does. When it refuses an identity for good, the composer is told `sender_not_allowed` so that the user can pick another From. A permanent refusal of `MAIL FROM` counts, and so does a later permanent refusal with an enhanced status code of 5.1.7 or 5.1.8, or with the text "sender address rejected". A refusal of the account's own address is reported as a failed send.

**Reply-To and Bcc myself** are per-account settings in the same record:

- `reply_to`: the composer adds the account's Reply-To only when sending from the account's own address, never from an identity. The server refuses a Reply-To that is not a valid address.
- `bcc_myself`: the composer adds the account's own address to Bcc when sending or saving a draft, unless it is already there.
