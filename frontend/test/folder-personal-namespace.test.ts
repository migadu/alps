import { describe, expect, it } from 'vitest';
import { findMailboxNameByRole, mailboxRole, specialMailboxName, type MailboxRole } from '../src/utils/folders';

describe('personal namespace special folders', () => {
  const entries: [MailboxRole, string][] = [['sent', 'Sent'], ['drafts', 'Draft'], ['trash', 'Deleted'], ['junk', 'Spam'], ['archive', 'Archives']];
  const mailboxes = entries.map(([, name]) => ({ Name: `INBOX.${name}`, Attrs: [], Delimiter: '.', NamespacePrefix: 'INBOX.' }));

  it.each(entries)('resolves %s consistently for captions and actions', (role, name) => {
    expect(mailboxRole(mailboxes.find(m => m.Name === `INBOX.${name}`))).toBe(role);
    expect(findMailboxNameByRole(role, mailboxes, 'missing')).toBe(`INBOX.${name}`);
    expect(specialMailboxName(role, mailboxes)).toBe(`INBOX.${name}`);
  });

  it('does not promote a nested name or a folder from another namespace', () => {
    expect(mailboxRole({ Name: 'INBOX.Projects.Trash', NamespacePrefix: 'INBOX.', Attrs: [] })).toBeNull();
    expect(mailboxRole({ Name: 'Shared/Trash', Namespace: 'shared', NamespacePrefix: 'Shared/', Attrs: [] })).toBeNull();
  });

  it('recognizes the backend aliases at the top level too', () => {
    expect(mailboxRole({ Name: 'Draft', Attrs: [] })).toBe('drafts');
    expect(mailboxRole({ Name: 'Deleted', Attrs: [] })).toBe('trash');
  });
});
