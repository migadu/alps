# Search Functionality

Alps provides a powerful search mechanism for finding messages within your mailboxes. You can perform both broad searches across entire messages or target specific fields using search prefixes.

## Basic Search

By default, simply typing a word or phrase will perform a full-text search across the entire email. This means it searches both the **headers** (From, To, Cc, Subject, etc.) and the **message body**.

**Example:**
`urgent`
_Matches any email containing the word "urgent" anywhere in the message or headers._

## Prefix Search

You can narrow down your search to specific fields by using prefixes. A prefix is followed by a colon (`:`) and the term you want to search for.

Supported prefixes (case-insensitive) are:

- `from:` - Searches the sender's email address or name.
- `to:` - Searches the recipient's email address or name.
- `cc:` - Searches the carbon copy email addresses or names.
- `subject:` - Searches the subject line of the email.
- `body:` - Restricts the search specifically to the body of the message (excluding headers).

**Example:**
`from:alice subject:meeting`
_Matches emails sent by "alice" that have "meeting" in the subject line._

## Quoted Terms

If your search term contains spaces, you can wrap it in double quotes (`"`) to ensure the entire phrase is searched as a single unit. This works for both basic and prefix searches.

**Example:**
`subject:"urgent meeting notes" body:"hello world"`
_Matches emails with the exact subject "urgent meeting notes" and the exact phrase "hello world" in the body._

## Combining Searches

You can combine multiple prefixes and basic search terms in a single query. When multiple terms are provided, they are combined using an `AND` operator, meaning the message must match **all** the specified criteria.

**Example:**
`from:alice@example.com subject:project urgent`
_Matches emails from "alice@example.com" AND with "project" in the subject AND containing the word "urgent" anywhere in the message._
