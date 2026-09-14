/**
 * Special-use folder resolution.
 *
 * The IMAP special-use attribute is authoritative. English names are a
 * fallback for servers that advertise none, and only for a role no mailbox has
 * claimed by attribute — beside a \Trash called "Papierkorb", a leftover folder
 * called "Trash" is an ordinary folder, or Delete moves mail into it.
 */
import { describe, expect, it } from 'vitest';
import {
  advertisedRoles,
  encodeMailboxPath,
  findMailboxNameByRole,
  isDescendantMailbox,
  isSelfOrDescendantMailbox,
  mailboxDelimiter,
  mailboxRole,
  mailboxRoleByName,
} from '../src/utils/folders';

const mb = (Name: string, Attrs: string[] = [], extra: Record<string, unknown> = {}) => ({ Name, Attrs, ...extra });

describe('mailboxRole', () => {
  it('reads the special-use attribute, whatever the folder is called', () => {
    expect(mailboxRole(mb('[Gmail]/Trash', ['\\HasNoChildren', '\\Trash']))).toBe('trash');
    expect(mailboxRole(mb('Envoyés', ['\\Sent']))).toBe('sent');
    expect(mailboxRole(mb('All Mail', ['\\All']))).toBe('all');
  });

  it('matches the attribute case-insensitively', () => {
    expect(mailboxRole(mb('Bin', ['\\TRASH']))).toBe('trash');
  });

  it('falls back to a well-known English name when there is no attribute', () => {
    expect(mailboxRole(mb('Trash'))).toBe('trash');
    expect(mailboxRole(mb('spam'))).toBe('junk');
    expect(mailboxRole(mb('Deleted Items'))).toBe('trash');
    expect(mailboxRole(mb('Archives'))).toBe('archive');
  });

  it('accepts the name under Mailbox as well as Name', () => {
    expect(mailboxRole({ Mailbox: 'Drafts', Attrs: [] })).toBe('drafts');
  });

  it('does not let a name claim a role the server gave to another mailbox', () => {
    expect(mailboxRole(mb('Trash'), new Set(['trash']))).toBeNull();
    // Per role: a server that marks Trash still gets Spam recognised by name.
    expect(mailboxRole(mb('Spam'), new Set(['trash']))).toBe('junk');
  });

  it('gives a placeholder that cannot be selected no role', () => {
    expect(mailboxRole(mb('Trash', ['\\Noselect']))).toBeNull();
    expect(mailboxRole(mb('Sent', ['\\NonExistent']))).toBeNull();
  });

  it('gives an ordinary folder no role', () => {
    expect(mailboxRole(mb('Receipts'))).toBeNull();
    expect(mailboxRole(mb('Trash receipts'))).toBeNull();
    expect(mailboxRole(undefined)).toBeNull();
  });
});

describe('advertisedRoles', () => {
  it('collects the roles carried by attributes, leaving out INBOX', () => {
    const roles = advertisedRoles([mb('INBOX', ['\\Inbox']), mb('Bin', ['\\Trash']), mb('Receipts')]);
    expect([...roles]).toEqual(['trash']);
  });

  it('is empty for a server that advertises nothing', () => {
    expect(advertisedRoles([mb('Trash'), mb('Sent')]).size).toBe(0);
    expect(advertisedRoles().size).toBe(0);
  });
});

describe('mailboxRoleByName', () => {
  const localized = [mb('INBOX'), mb('Papierkorb', ['\\Trash']), mb('Gesendet', ['\\Sent'])];

  it('finds a localized special folder by its attribute', () => {
    expect(mailboxRoleByName('Papierkorb', localized)).toBe('trash');
  });

  it('refuses the English name when another mailbox holds that role', () => {
    expect(mailboxRoleByName('Trash', [...localized, mb('Trash')])).toBeNull();
    expect(mailboxRoleByName('Trash', localized)).toBeNull();
  });

  it('still guesses by name when nothing is known about the server', () => {
    expect(mailboxRoleByName('Trash')).toBe('trash');
  });

  it('answers null for no name', () => {
    expect(mailboxRoleByName('', localized)).toBeNull();
  });
});

describe('findMailboxNameByRole', () => {
  it('names the mailbox carrying the attribute even when a lookalike is listed first', () => {
    const list = [mb('Trash'), mb('Papierkorb', ['\\Trash'])];
    expect(findMailboxNameByRole('trash', list, 'Trash')).toBe('Papierkorb');
  });

  it('reads the Mailbox field too', () => {
    expect(findMailboxNameByRole('trash', [{ Mailbox: 'Corbeille', Attrs: ['\\Trash'] }], 'Trash')).toBe('Corbeille');
  });

  it('falls back to the conventional name when nothing matches', () => {
    expect(findMailboxNameByRole('archive', [mb('INBOX')], 'Archive')).toBe('Archive');
  });
});

describe('nesting', () => {
  it('does not treat a shared prefix as nesting', () => {
    expect(isDescendantMailbox('Archive', 'Arch')).toBe(false);
    expect(isDescendantMailbox('Workshop', 'Work')).toBe(false);
  });

  it('accepts any non-alphanumeric separator when the delimiter is unknown', () => {
    expect(isDescendantMailbox('Arch/2024', 'Arch')).toBe(true);
    expect(isDescendantMailbox('Arch.2024', 'Arch')).toBe(true);
  });

  it('is exact when the delimiter is known', () => {
    expect(isDescendantMailbox('Arch.2024', 'Arch', '.')).toBe(true);
    expect(isDescendantMailbox('Arch.2024', 'Arch', '/')).toBe(false);
  });

  it('does not call a folder its own descendant, but does count it as self', () => {
    expect(isDescendantMailbox('Arch', 'Arch')).toBe(false);
    expect(isSelfOrDescendantMailbox('Arch', 'Arch')).toBe(true);
    expect(isSelfOrDescendantMailbox('Arch/x', 'Arch', '/')).toBe(true);
    expect(isSelfOrDescendantMailbox('Archive', 'Arch')).toBe(false);
  });

  it('refuses empty names', () => {
    expect(isDescendantMailbox('', 'Arch')).toBe(false);
    expect(isDescendantMailbox('Arch/x', '')).toBe(false);
  });
});

describe('mailboxDelimiter', () => {
  it('reads the delimiter the server reported for that mailbox', () => {
    const list = [mb('Work', [], { Delimiter: '/' }), mb('INBOX.Old', [], { Delim: '.' })];
    expect(mailboxDelimiter('Work', list)).toBe('/');
    expect(mailboxDelimiter('INBOX.Old', list)).toBe('.');
  });

  it('answers empty for an unknown mailbox', () => {
    expect(mailboxDelimiter('Nope', [mb('Work', [], { Delimiter: '/' })])).toBe('');
    expect(mailboxDelimiter('')).toBe('');
  });
});

describe('encodeMailboxPath', () => {
  it('survives one decode before routing without exposing a slash', () => {
    const once = decodeURIComponent(encodeMailboxPath('[Gmail]/All Mail'));
    expect(once).not.toContain('/');
    expect(decodeURIComponent(once)).toBe('[Gmail]/All Mail');
  });

  it('leaves an ordinary name alone', () => {
    expect(encodeMailboxPath('INBOX')).toBe('INBOX');
  });
});
