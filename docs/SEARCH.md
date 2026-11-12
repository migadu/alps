# Search Functionality

ALPS lets you search the messages of a folder. You can search the whole message, or target specific fields with search prefixes. On an IMAP account ALPS turns your query into IMAP search criteria, and the mail server does the matching. Which capabilities ALPS uses on the server, and what it does without them, is in [Mail Server Requirements](MAIL_SERVER.md).

The syntax on this page applies to IMAP accounts. A Maildir account matches differently (see [Maildir Accounts](#maildir-accounts)).

## Basic Search

Words typed next to each other without a prefix are sent to the mail server together, as one IMAP `TEXT` search key. RFC 3501 defines `TEXT` as the string appearing in the message's **header** or **body**, so a plain search covers both.

ALPS does no matching of its own on an IMAP account. The mail server decides which header fields and body parts are covered and how a term matches: RFC 3501 asks for a case-insensitive substring, while a server with a full-text word index may match whole words.

**Example:**
`urgent`
_Matches the emails in which the mail server finds "urgent", in the headers or in the body._

Some servers index message bodies in the background after delivery (Sora is one). On those, a word in the body of a message that just arrived may not be found for a short while, even though the message is already listed and its subject can be found.

## Prefix Search

You can narrow down your search to specific fields by using prefixes. A prefix is followed by a colon (`:`) and the term you want to search for.

Supported prefixes (case-insensitive) are:

- `from:` - Searches the From header: the sender's name and address. Sent as an IMAP `FROM` search.
- `to:` - Searches the To header (IMAP `TO`).
- `cc:` - Searches the Cc header (IMAP `CC`).
- `subject:` - Searches the Subject header (IMAP `SUBJECT`).
- `body:` - Restricts the search to the body of the message, excluding headers (IMAP `BODY`).
- `is:` - Filters by message state. `is:starred` and `is:flagged` find flagged (starred) messages (IMAP `FLAGGED`). `is:unread` finds unread messages (IMAP `UNSEEN`). The value is case-insensitive, and any other `is:` value is ignored, with no warning.
- `header:` - `header:Field:value` searches the named header field for the value, for example `header:In-Reply-To:"<id@example.com>"`. It is sent as an IMAP `HEADER` search, or as the `FROM`, `TO`, `CC`, `BCC` or `SUBJECT` key when the field is one of those. Double quotes around the value are removed, so the value may contain spaces. A `header:` term without a second colon (no `Field:value`) is ignored.

These searches are evaluated by the mail server, as the plain words are. The server also decides which header fields `header:` can search. Sora, for example, finds nothing for fields other than From, To, Cc, Bcc, Reply-To, Subject, Message-ID, In-Reply-To and References.

**Example:**
`from:alice subject:meeting`
_Matches emails whose From header contains "alice" and whose subject contains "meeting"._

Write the value directly after the colon, with no space: `from:alice`, not `from: alice`. A query is split into terms at spaces outside double quotes. So `from: alice` is a `from:` term with an empty value plus the plain word `alice`, and is refused as described below.

A word with a colon that is not one of these prefixes, such as `10:30` or a link, is searched for as it is written.

Every prefix requires a non-empty value. Queries such as `from:`, `from: alice`, `body:""` and `header:X-Custom:` are refused with HTTP 400 (`Search terms require a value.`), and the list reads **Could not load this folder.** A bulk action on all the results of such a query is refused the same way, before anything is changed. An empty query still means the whole folder.

### Starred and Unread Buttons

The **Filter by starred** and **Filter by unread** buttons in the list toolbar set the search to exactly `is:starred` or `is:unread`. This replaces any search in progress, and clicking the active button clears the search. To combine a filter with text, type both, for example `is:unread invoice`.

## Quoted Terms

Plain words typed next to each other are already sent as one search string, quoted or not: `hello world` and `"hello world"` both search for "hello world". Quotes matter in three cases:

- A prefixed value that contains spaces must be quoted: `subject:"urgent meeting notes"`. Unquoted, `subject:urgent meeting` means subject "urgent" AND text "meeting".
- A quoted phrase becomes its own term, separate from the plain words around it: `hello "big deal" world` gives three terms, combined with AND.
- Quoting text that looks like a prefix searches it as plain text: `"from:bob"`.

The surrounding quotes are not part of the search. A phrase whose closing quote is missing runs to the end of the query. So does a prefixed value whose closing quote is missing, such as `subject:"weekly report` or `header:Subject:"weekly report`, and its opening quote is dropped in the same way.

**Example:**
`subject:"urgent meeting notes" body:"hello world"`
_Matches emails whose Subject contains "urgent meeting notes" and whose body contains "hello world"._

Under RFC 3501 matching is case-insensitive and by substring, so a subject of "Re: urgent meeting notes (v2)" matches too. The mail server decides whether a body phrase must appear word for word or only needs all of its words. Sora's word index, for example, matches the words in any order.

## Combining Searches

You can combine multiple prefixes and basic search terms in a single query. Prefixed terms and quoted phrases are combined using an `AND` operator, meaning the message must match **all** the specified criteria. There is no `OR` or `NOT` syntax, and a leading `-` is searched as text.

Plain words typed next to each other are not separate terms: they go to the server as one search string, so `urgent invoice` searches for "urgent invoice". A server that matches substrings (RFC 3501) then needs the words together and in that order, while a server with a word index may accept them anywhere. To require each word on its own, quote each one (`"urgent" "invoice"`) or put a prefixed term between them.

An `is:` value other than `starred`, `flagged` or `unread`, and a `header:` term without `Field:value`, add no condition.

**Example:**
`from:alice@example.com subject:project urgent`
_Matches emails from "alice@example.com" AND with "project" in the subject AND containing "urgent" anywhere in the message._

## Searching All Folders

A search covers only the folder on screen. When the mail server supports `MULTISEARCH` (RFC 7377), the search-results banner offers a **Search All** button. It runs the same query across every folder the mail server lists as subscribed. Unsubscribed folders are not searched.

The results appear under "All Folders" as one flat list, not grouped into conversations, and each row shows the name of the folder it is in. They are ordered by message date (the Date header, or the arrival time when that is missing) following the list's sort order, newest first by default. The offer to select every match ("Select all … in …") is not made there, and **Clear search** returns to the Inbox.

On a server without `MULTISEARCH` there is no Search All button. The all-folders view (`#/mailbox/*`), opened from its URL on such a server, is refused with HTTP 400 `{"error":"cannot"}`, and the list reads **Could not load this folder.**

## How Results Are Listed

With **Use threading** on (Settings > Reading & Composing) and a mail server that supports `THREAD`, search results are grouped into conversations built only from the matching messages. Use threading defaults to on when the server supports `THREAD`.

The results are a flat list instead when threading is off, when the server has no `THREAD` support, when the folder holds more than 10,000 messages, or when the server refuses the `THREAD` command.

Results follow the list's sort order, newest first by default. A flat list is ordered by message date when the server supports `SORT`, and by arrival (UID) order when it does not.

## When the Mail Server Limits Searches

Each search is an IMAP command sent to the mail server. ALPS never answers a search from its listing cache, since only listings without a query are cached, so running a search again reflects what the server can find now. The page may show the rows it last had for the same search at once, and replaces them with the server's answer when that arrives.

If the server refuses a search for its own rate limit (`NO [LIMIT]`, RFC 5530), ALPS answers the listing request with HTTP 429 and `{"error":"search_rate_limited"}`. When the refusal names a wait (`wait 42s`), ALPS also adds a `Retry-After` header and `"retry_after"` in seconds. The list then reads "The mail server is limiting searches right now. Try again in a moment."

A listing without a query does not get this answer when the server refuses its `SORT` or `SEARCH`: ALPS lists the folder by message number instead.

Nor does a listing whose session has to sign in to the mail server again and is refused because the account holds as many connections as the server allows, with no background connection to carry on with. The session then ends, and the listing, with a query or without, gets 503 `{"error":"mail_server_unavailable"}`, as every request does then (see [MAIL_SERVER.md](MAIL_SERVER.md#5-when-the-server-says-limit)).

This limit is the mail server's. ALPS's own rate limits are described in [Rate Limiting](RATELIMIT.md).

## The Query in the URL

The query is carried in the page URL as `q` (`#/mailbox/<folder>?q=...`), so reloading the page runs the same search again. The page sends it to the backend as the `query` parameter of the folder listing, `GET /mailboxes/<folder>?page=<n>&query=...`.

## Maildir Accounts

With the Maildir provider (see [Local Maildir Provider](MAILDIR.md)), the whole query, prefixes and quote characters included, is matched as one case-insensitive substring of each stored message file, headers and body as stored. Encoded headers and bodies (RFC 2047 words, base64, quoted-printable) are not decoded first.

Prefixes, quotes and AND are therefore not interpreted. The Starred and Unread toolbar filters (`is:starred`, `is:unread`) find nothing in practice, and Search All is not offered. A prefix with an empty value, such as `from:`, is still refused with HTTP 400, as on an IMAP account.
