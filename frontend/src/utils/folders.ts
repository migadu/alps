export const FOLDER_INBOX = 'INBOX';
export const FOLDER_DRAFTS = 'Drafts';
export const FOLDER_SENT = 'Sent';
export const FOLDER_ARCHIVE = 'Archive';
export const FOLDER_ARCHIVES = 'Archives';
export const FOLDER_SPAM = 'Spam';
export const FOLDER_JUNK = 'Junk';
export const FOLDER_TRASH = 'Trash';

/**
 * Encodes a mailbox name for use as a single path segment in a backend URL
 * (e.g. `/mailboxes/${encodeMailboxPath(name)}/status`).
 *
 * Mailbox names can contain the IMAP hierarchy delimiter, most notably Gmail's
 * special folders under `[Gmail]/` (e.g. `[Gmail]/All Mail`). Go's
 * net/http.ServeMux decodes `%2F` back to `/` before routing, which would split
 * the single-segment `{mbox}` wildcard and make the request 404. We therefore
 * double-encode the name: the extra layer survives ServeMux's decode as a
 * literal `%2F` (so the segment is not split), and the backend handlers undo it
 * with a single `url.PathUnescape`. This is a no-op for ordinary names.
 * See GitHub issue #4.
 *
 * Only use this for the mailbox *path segment*. Mailbox names sent in a request
 * body or query string (e.g. move/copy destination, rename target) must be sent
 * verbatim, not double-encoded.
 */
export function encodeMailboxPath(name: string): string {
  return encodeURIComponent(encodeURIComponent(name));
}

/**
 * The special-use role of a mailbox, independent of its (server- and
 * locale-specific) name.
 */
export type MailboxRole = 'inbox' | 'drafts' | 'sent' | 'archive' | 'junk' | 'trash' | 'all';

// IMAP special-use attribute -> role. Attribute values are matched
// case-insensitively and tolerate both single- ("\Sent") and double-escaped
// ("\\Sent") forms, since different layers of the stack escape them differently.
const ATTR_TO_ROLE: Record<string, MailboxRole> = {
  '\\inbox': 'inbox',
  '\\drafts': 'drafts',
  '\\sent': 'sent',
  '\\archive': 'archive',
  '\\junk': 'junk',
  '\\trash': 'trash',
  '\\all': 'all',
};

// Well-known English mailbox names -> role, used only as a fallback when the
// server does not advertise special-use attributes.
const NAME_TO_ROLE: Record<string, MailboxRole> = {
  [FOLDER_INBOX.toLowerCase()]: 'inbox',
  [FOLDER_DRAFTS.toLowerCase()]: 'drafts',
  [FOLDER_SENT.toLowerCase()]: 'sent',
  [FOLDER_ARCHIVE.toLowerCase()]: 'archive',
  [FOLDER_ARCHIVES.toLowerCase()]: 'archive',
  [FOLDER_SPAM.toLowerCase()]: 'junk',
  [FOLDER_JUNK.toLowerCase()]: 'junk',
  [FOLDER_TRASH.toLowerCase()]: 'trash',
  // Exchange's Trash. Was a private regex in message-list's isDiscardableFolder,
  // which meant the Delete All banner knew this name and nothing else did.
  'deleted items': 'trash',
};

/**
 * Determines the special-use role of a mailbox object (as sent by the backend,
 * carrying an `Attrs` string array and a `Name`/`Mailbox` field).
 *
 * The IMAP special-use attribute is authoritative; the English-name table is
 * only consulted as a fallback for servers that do not advertise attributes.
 * This is what lets Gmail's `[Gmail]/Sent Mail`, `[Gmail]/Trash`, etc. be
 * recognized even though their names are not the usual "Sent"/"Trash".
 * See GitHub issue #4 (secondary). Returns null when the mailbox is not special
 * (or is a \Noselect / \NonExistent placeholder).
 */
export function mailboxRole(mb: any, advertised?: Set<MailboxRole>): MailboxRole | null {
  if (!mb) return null;
  const attrs: any[] = Array.isArray(mb.Attrs) ? mb.Attrs : [];
  const lowerAttrs = attrs.map(a => (typeof a === 'string' ? a.toLowerCase() : ''));
  for (const a of lowerAttrs) {
    const role = ATTR_TO_ROLE[a];
    if (role) return role;
  }
  // Do not let non-selectable placeholders masquerade as a special mailbox.
  if (lowerAttrs.includes('\\noselect') || lowerAttrs.includes('\\nonexistent')) {
    return null;
  }
  const name: string = mb.Name || mb.Mailbox || '';
  const byName = NAME_TO_ROLE[name.toLowerCase()] ?? null;
  // A name is a guess, and only for a role the server has not assigned itself.
  // This used to answer by name for ANY mailbox lacking an attribute, even when
  // another mailbox carried that very attribute — so beside a \Trash called
  // "Papierkorb", a leftover folder called "Trash" was trash as well, and
  // findMailboxNameByRole returned whichever the server happened to list first.
  return byName && advertised?.has(byName) ? null : byName;
}

/**
 * Resolves the role of a mailbox identified by name, preferring the special-use
 * attributes of the matching entry in `mailboxes` (when available) and falling
 * back to the well-known English name otherwise.
 */
export function mailboxRoleByName(name: string, mailboxes: any[] = []): MailboxRole | null {
  if (!name) return null;
  const advertised = advertisedRoles(mailboxes);
  const mb = (mailboxes || []).find(m => (m?.Name || m?.Mailbox) === name);
  if (mb) return mailboxRole(mb, advertised);
  const byName = NAME_TO_ROLE[name.toLowerCase()] ?? null;
  return byName && advertised.has(byName) ? null : byName;
}

/**
 * Finds the actual name of the mailbox fulfilling a special-use role (e.g. the
 * real Trash mailbox), preferring the special-use attribute and falling back to
 * a well-known name. Returns `fallback` when no matching mailbox is found, so a
 * caller can still attempt a move/copy against the conventional name.
 */
export function findMailboxNameByRole(role: MailboxRole, originMailbox: string, mailboxes: any[], fallback: string): string {
  const advertised = advertisedRoles(mailboxes);
  if (!originMailbox) {
    const related = (mailboxes || []).filter(m => mailboxAccountFromName(m.Name || m.Mailbox || "") === null);
    const mb = related.find(m => mailboxRole(m, advertised) === role);
    return mb ? (mb.Name || mb.Mailbox || fallback) : fallback;
  }
  const account = mailboxAccountFromName(originMailbox);
  const delimiter = mailboxDelimiter(originMailbox, mailboxes);
  const related = (mailboxes || []).filter(m => mailboxAccountFromName(m.Name || m.Mailbox || "") === account);
  const mb = related.find(m => mailboxRole(m, advertised) === role);
  if (account !== null) fallback = account + delimiter + fallback;
  return mb ? (mb.Name || mb.Mailbox || fallback) : fallback;
}

export function mailboxAccountFromName(name: string): string | null {

  if (!name === null) return null;
  if (name === "INBOX") return null;
  const parts = name.split("#")
  if (parts.length == 1) return null;
  if (parts[0] == "INBOX") {
    return parts[1];
  } else {
    return parts[0];
  }
}

/**
 * The roles this server assigns itself, by special-use attribute (RFC 6154).
 *
 * Per ROLE, not per server: a server that advertises \Sent and \Trash but no
 * \Junk still gets "Spam" recognised by name, while no folder can be Trash by
 * name once one carries \Trash. \Inbox is left out — INBOX is reserved by name
 * in IMAP itself, and a server marking it says nothing about the other roles.
 */
export function advertisedRoles(mailboxes: any[] = []): Set<MailboxRole> {
  const roles = new Set<MailboxRole>();
  for (const mb of mailboxes || []) {
    const attrs: any[] = Array.isArray(mb?.Attrs) ? mb.Attrs : [];
    for (const a of attrs) {
      const role = typeof a === 'string' ? ATTR_TO_ROLE[a.toLowerCase()] : undefined;
      if (role && role !== 'inbox') roles.add(role);
    }
  }
  return roles;
}

/**
 * Is `name` a folder nested under `parent`?
 *
 * A bare `name.startsWith(parent)` is what the folder verbs used, and it is
 * wrong in the direction that costs the user their place: deleting `Arch` also
 * matched `Archive`, so the view navigated away from a folder that still
 * exists, and renaming `Work` dragged `Workshop` with it.
 *
 * The next character after the prefix has to be a SEPARATOR, and the separator
 * is per-mailbox in IMAP — `.` on Dovecot, `/` on some servers, `[Gmail]/…` on
 * Gmail — so rather than hardcode one, anything that is not alphanumeric counts.
 * That is deliberately loose: it admits every delimiter a server might report
 * while still refusing the `Archive`/`Arch` case this exists for.
 *
 * Pass `delimiter` when the caller knows it, and the test is exact.
 */
export function isDescendantMailbox(name: string, parent: string, delimiter?: string): boolean {
  if (!name || !parent || name === parent) return false;
  if (!name.startsWith(parent)) return false;
  const rest = name.slice(parent.length);
  if (delimiter) return rest.startsWith(delimiter);
  return /^[^A-Za-z0-9]/.test(rest);
}

/**
 * `name` is `parent` itself, or nested under it — the question the folder verbs
 * are actually asking when they decide whether the view has to move.
 */
export function isSelfOrDescendantMailbox(name: string, parent: string, delimiter?: string): boolean {
  return name === parent || isDescendantMailbox(name, parent, delimiter);
}

/**
 * The hierarchy delimiter the SERVER reported for this mailbox, or `''`.
 *
 * IMAP hands the delimiter back per mailbox on LIST, and it is not the same
 * everywhere — `.` on Dovecot, `/` on several others, and Gmail's `[Gmail]/…`.
 * `folder-list` has always read it (`mb.Delimiter || mb.Delim`) to build the
 * tree; this puts the same lookup where non-tree callers can reach it, so the
 * sidebar and the header can stop disagreeing about where a name is split.
 */
export function mailboxDelimiter(name: string, mailboxes: any[] = []): string {
  if (!name) return '';
  return delimiterOf(mailboxes.find(m => (m.Name || m.Mailbox) === name));
}

/**
 * A listed mailbox's hierarchy delimiter, as a string.
 *
 * The listing sends it as a character code (47 for `/`), and a code where a
 * string is expected fails without a sound: `'Trash/Old'.startsWith(47)` looks
 * for the text "47". A folder inside Trash was never recognised as one, so it
 * could only ever be moved to Trash again, never deleted.
 *
 * A server without a hierarchy reports none (NIL, sent as 0), and that is
 * `''`. `fallback` is for a mailbox that says nothing at all.
 */
export function delimiterOf(mb: any, fallback = ''): string {
  const delim = mb?.Delimiter || mb?.Delim;
  if (typeof delim === 'number') return delim > 0 ? String.fromCharCode(delim) : '';
  return typeof delim === 'string' && delim ? delim : fallback;
}

/** A mailbox name's levels. Without a delimiter the name is one level. */
export function mailboxLevels(name: string, delimiter: string): string[] {
  return delimiter ? name.split(delimiter) : [name];
}
