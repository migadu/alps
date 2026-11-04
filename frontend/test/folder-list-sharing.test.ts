/**
 * Folders shared between people, in the sidebar.
 *
 * Other people's folders, which the folder list says are in another
 * namespace (RFC 2342), are drawn in a section of their own, named after the
 * namespace's prefix, and what their menus offer is what the user's rights in
 * them allow (RFC 4314).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/folder-list';
import '../src/components/alps-folder-selector-popup';
import { acceptsDroppedMessages, findMailboxNameByRole, mailboxNamespace, mayInMailbox, nameInNamespace, specialMailboxName } from '../src/utils/folders';
import { cleanup, click, flush, mount, shadowAll } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});
const composeStore = Object.assign(new EventTarget(), { getState: () => ({}) });
const settingsStore = Object.assign(new EventTarget(), {
  recordRead: true,
  getState: () => ({ customMailboxOrder: [], unsubscribedFolders: [] }),
  updateSettings: async () => {},
});

const own = (Name: string, extra: Record<string, unknown> = {}) => ({ Name, Attrs: [] as string[], Delimiter: '/', Subscribed: true, ...extra });
const shared = (Name: string, Rights: string | undefined, extra: Record<string, unknown> = {}) =>
  own(Name, { Namespace: 'shared', NamespacePrefix: 'Shared/', ...(Rights === undefined ? {} : { Rights }), ...extra });

const SPECIAL = [own('INBOX'), own('Sent', { Attrs: ['\\Sent'] }), own('Trash', { Attrs: ['\\Trash'] })];

async function sidebar(mailboxes: unknown[], props: Record<string, unknown> = {}): Promise<El> {
  const el = await mount<El>('alps-folder-list', { i18nStore, settingsStore, composeStore, mailboxes, currentMailbox: 'INBOX', ...props });
  await flush();
  return el;
}

const row = (el: El, caption: string) => {
  const found = shadowAll(el, '.folder-item').find(r => r.getAttribute('title') === caption);
  expect(found, `no row captioned ${caption}`).toBeTruthy();
  return found!;
};
/** The words of a row's menu, by their keys; empty for a row with no menu. */
const menu = (el: El, caption: string) =>
  Array.from(row(el, caption).querySelectorAll('.dropdown-item .item-text')).map(item => item.textContent!.trim());
/** Every row of the sidebar, by caption, in order, with the section headings among them. */
const drawn = (el: El) =>
  shadowAll(el, '.folder-item, alps-sidebar-heading').map(node =>
    node.localName === 'alps-sidebar-heading' ? `# ${(node as El).heading}` : node.getAttribute('title') ?? '');

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('the shared folders section', () => {
  it('draws other people\'s folders under a heading of their own, named after the namespace\'s prefix', async () => {
    const el = await sidebar([
      ...SPECIAL,
      own('Work'),
      shared('Shared', undefined, { Attrs: ['\\Noselect', '\\HasChildren'] }),
      shared('Shared/Team', 'lrs'),
      shared('Shared/Board', 'lrs'),
    ]);
    expect(drawn(el)).toEqual([
      'folderList.inbox', 'folderList.sent', 'folderList.trash',
      '# folderList.title', 'Work',
      '# folderList.sharedFolders', 'Board', 'Team',
    ]);
  });

  it('draws another user\'s folders under their name, and opens one by its full name', async () => {
    const other = (Name: string, extra: Record<string, unknown> = {}) =>
      own(Name, { Namespace: 'other', NamespacePrefix: 'Other Users/', Rights: 'lrs', ...extra });
    const el = await sidebar([...SPECIAL, other('Other Users/bob', { Attrs: ['\\Noselect'] }), other('Other Users/bob/Plans')], {
      expandedFolders: new Set(['Other Users/bob']),
    });
    expect(drawn(el).slice(-3)).toEqual(['# folderList.sharedFolders', 'bob', 'Plans']);
    const picked: string[] = [];
    el.addEventListener('select-mailbox', (e: Event) => picked.push((e as CustomEvent).detail.name));
    await click(row(el, 'Plans'), el);
    expect(picked).toEqual(['Other Users/bob/Plans']);
  });

  it('draws no section without other people\'s folders', async () => {
    const el = await sidebar([...SPECIAL, own('Work')]);
    expect(drawn(el)).not.toContain('# folderList.sharedFolders');
  });

  it('gives no shared folder the role of one of the user\'s own', async () => {
    const mailboxes = [own('INBOX'), own('Sent'), shared('Shared/Sent', 'lrs', { Attrs: ['\\Sent'] }), shared('Shared/Trash', 'lrs', { Attrs: ['\\Trash'] })];
    expect(specialMailboxName('sent', mailboxes)).toBe('Sent');
    expect(findMailboxNameByRole('trash', mailboxes, 'Trash')).toBe('Trash');
    const el = await sidebar(mailboxes);
    expect(drawn(el).slice(-2)).toEqual(['Sent', 'Trash']);
    expect(drawn(el)).toContain('folderList.sent');
  });
});

describe('a folder menu, by the rights on the folder', () => {
  it('offers nothing a reader may not do in a folder shared with them', async () => {
    const el = await sidebar([...SPECIAL, shared('Shared/Team', 'lrs')]);
    const items = menu(el, 'Team');
    expect(items).toContain('folderList.unsubscribe');
    for (const key of ['folderList.createSubfolder', 'folderList.rename', 'folderList.delete']) {
      expect(items, key).not.toContain(key);
    }
  });

  it('offers what the rights allow: subfolders with k, rename and delete with x', async () => {
    const el = await sidebar([...SPECIAL, shared('Shared/Team', 'lrswipkxtea'), shared('Shared/Notes', 'lrsk')]);
    expect(menu(el, 'Team')).toEqual(expect.arrayContaining(['folderList.createSubfolder', 'folderList.rename', 'folderList.delete']));
    const notes = menu(el, 'Notes');
    expect(notes).toContain('folderList.createSubfolder');
    expect(notes).not.toContain('folderList.rename');
    expect(notes).not.toContain('folderList.delete');
  });

  it('offers a folder of the user\'s own everything', async () => {
    const el = await sidebar([...SPECIAL, own('Work')]);
    expect(menu(el, 'Work')).toEqual(expect.arrayContaining(['folderList.createSubfolder', 'folderList.rename', 'folderList.delete']));
  });

  it('deletes a shared folder outright rather than moving it into the user\'s own Trash', async () => {
    const el = await sidebar([...SPECIAL, shared('Shared/Team', 'lrswipkxtea'), own('Work')]);
    const deleteOf = (caption: string) => Array.from(row(el, caption).querySelectorAll<HTMLButtonElement>('.dropdown-item')).find(b => b.textContent!.includes('folderList.delete'))!;
    await click(deleteOf('Team'), el);
    expect(el.shadowRoot!.querySelector('ui-confirm')!.getAttribute('heading')).toBe('folderList.deleteFolder');
    el.showDeleteConfirm = false;
    await el.updateComplete;
    await click(deleteOf('Work'), el);
    expect(el.shadowRoot!.querySelector('ui-confirm')!.getAttribute('heading')).toBe('folderList.moveToTrash');
  });
});

describe('filing into a folder shared with the user', () => {
  it('takes a drop or a move only where the user may insert (i)', async () => {
    const mailboxes = [...SPECIAL, shared('Shared/Team', 'lrs'), shared('Shared/Inbox', 'lrswi'), own('Work')];
    expect(acceptsDroppedMessages(mailboxes[3], mailboxes, 'INBOX')).toBe(false);
    expect(acceptsDroppedMessages(mailboxes[4], mailboxes, 'INBOX')).toBe(true);
    expect(acceptsDroppedMessages(mailboxes[5], mailboxes, 'INBOX')).toBe(true);

    const picker = await mount<El>('alps-folder-selector-popup', { i18nStore, mailboxes, currentMailbox: 'INBOX' });
    const offered = shadowAll(picker, '.folder-item, .folder-option, button').map(b => b.textContent!.trim());
    expect(offered.some(t => t.includes('Shared/Inbox'))).toBe(true);
    expect(offered.some(t => t.includes('Shared/Team'))).toBe(false);
  });
});

describe('the folder list\'s word on whose a folder is', () => {
  it('reads the namespace, the rights and the name after the prefix', () => {
    expect(mailboxNamespace(own('Work'))).toBeNull();
    expect(mailboxNamespace(shared('Shared/Team', 'lrs'))).toBe('shared');
    expect(mailboxNamespace(own('x', { Namespace: 'elsewhere' }))).toBeNull();
    expect(mayInMailbox(own('Work'), 'x')).toBe(true);
    expect(mayInMailbox(undefined, 'x')).toBe(true);
    expect(mayInMailbox(shared('Shared/Team', 'lrs'), 'r')).toBe(true);
    expect(mayInMailbox(shared('Shared/Team', 'lrs'), 'x')).toBe(false);
    // Another's folder whose rights are not known allows nothing.
    expect(mayInMailbox(shared('Shared/Team', undefined), 'i')).toBe(false);
    expect(nameInNamespace(shared('Shared/Team/Q3', 'lrs'))).toBe('Team/Q3');
    expect(nameInNamespace(shared('Shared', undefined))).toBe('');
    expect(nameInNamespace(own('Shared/Team'))).toBe('Shared/Team');
  });
});
