/**
 * What the sidebar calls the special folders.
 *
 * A special folder's row is named by its slot, in the user's language, and by
 * the folder's own name only where that name is one the slot knows: a \Junk
 * called Spam says Spam. Looked up by any name, the table answered for names
 * every object has, and a row came out with neither caption nor icon.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/folder-list';
import { findMailboxNameByRole, mailboxRoleByName, type MailboxRole } from '../src/utils/folders';
import { getDestinationLabel, getMailboxLabel } from '../src/utils/ui';
import { cleanup, click, mount, record, shadowAll } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

const settingsStore = Object.assign(new EventTarget(), {
  getState: () => ({}),
  updateSettings: async () => {},
});

const composeStore = Object.assign(new EventTarget(), { getState: () => ({}) });

const mb = (Name: string, Attrs: string[] = []) => ({ Name, Attrs, Delimiter: '/' });

/** The caption of every row, in the order drawn. */
async function captions(mailboxes: unknown[]): Promise<string[]> {
  const el = await mount<El>('alps-folder-list', { i18nStore, settingsStore, composeStore, mailboxes });
  return shadowAll(el, '.folder-item').map(row => row.getAttribute('title') ?? '');
}

afterEach(() => cleanup());

describe('the sidebar names special folders', () => {
  it('by their slot, keeping Spam where the junk folder is called that', async () => {
    expect(await captions([mb('INBOX'), mb('Papierkorb', ['\\Trash']), mb('Spam', ['\\Junk'])]))
      .toEqual(['folderList.inbox', 'folderList.spam', 'folderList.trash']);
  });

  it('and draws an ordinary folder called after an Object property, without touching Object', async () => {
    const drawn = await captions([mb('INBOX'), mb('constructor'), mb('toString'), mb('__proto__')]);
    expect([...drawn].sort()).toEqual(['__proto__', 'constructor', 'folderList.inbox', 'toString']);
    expect(({} as Record<string, unknown>).mb).toBeUndefined();
  });

  it.each(['constructor', 'toString', '__proto__'])('when the folder carrying the role is called %s', async (name) => {
    expect(await captions([mb('INBOX'), mb(name, ['\\Trash'])])).toEqual(['folderList.inbox', 'folderList.trash']);
  });
});

/**
 * Which top-level folders the sidebar lists as special: the ones the actions
 * take for special, by name only where no folder carries the role. The sidebar
 * matched names exactly, case included, and knew no Exchange "Deleted Items",
 * so Delete filed mail into a folder called "trash" that the sidebar drew as
 * an ordinary one, under its raw name.
 */
describe('the sidebar decides a top-level folder\'s role as the actions do', () => {
  /** The rows drawn as special folders, which have no folder menu. */
  async function special(mailboxes: unknown[]): Promise<string[]> {
    const el = await mount<El>('alps-folder-list', { i18nStore, settingsStore, composeStore, mailboxes });
    return shadowAll(el, '.folder-item:not(.has-actions)').map(row => row.getAttribute('title') ?? '');
  }

  it.each([
    ['trash', 'trash', 'folderList.trash'],
    ['Deleted Items', 'trash', 'folderList.trash'],
    ['sent', 'sent', 'folderList.sent'],
    ['drafts', 'drafts', 'folderList.drafts'],
    ['ARCHIVES', 'archive', 'folderList.archive'],
    ['junk', 'junk', 'folderList.junk'],
  ])('a folder called %s, by name', async (name, role, caption) => {
    const mailboxes = [mb('INBOX'), mb(name), mb('Work')];
    expect(mailboxRoleByName(name, mailboxes)).toBe(role);
    expect(await special(mailboxes)).toEqual(['folderList.inbox', caption]);
    expect(await captions(mailboxes)).toEqual(['folderList.inbox', caption, 'Work']);
  });

  it('and not a folder called Trash once the server marks another \\Trash, below the top level too', async () => {
    const mailboxes = [mb('INBOX'), mb('Trash'), mb('[Gmail]', ['\\Noselect']), mb('[Gmail]/Trash', ['\\Trash'])];
    expect(findMailboxNameByRole('trash', mailboxes, 'Trash')).toBe('[Gmail]/Trash');
    expect(await special(mailboxes)).toEqual(['folderList.inbox']);
    expect(await captions(mailboxes)).toEqual(['folderList.inbox', '[Gmail]', 'Trash']);
  });

  // Listed as the server lists them: INBOX first, then by name, byte by byte.
  it.each([
    [['Spam', 'junk'], 'junk', 'Spam', 'folderList.spam'],
    [['Archives', 'archive'], 'archive', 'Archives', 'folderList.archive'],
    [['Deleted Items', 'trash'], 'trash', 'Deleted Items', 'folderList.trash'],
    [['Deleted Items', 'Trash'], 'trash', 'Deleted Items', 'folderList.trash'],
  ])('of two called %j, the one the actions file into', async (names, role, used, caption) => {
    const mailboxes = [mb('INBOX'), ...names.map(name => mb(name))];
    expect(findMailboxNameByRole(role as MailboxRole, mailboxes, '')).toBe(used);
    const el = await mount<El>('alps-folder-list', { i18nStore, settingsStore, composeStore, mailboxes });
    const selected = record<CustomEvent>(el, 'select-mailbox');
    const rows = shadowAll(el, '.folder-item');
    expect(rows.map(row => row.getAttribute('title'))).toEqual(['folderList.inbox', caption, names.find(name => name !== used)]);
    // The two special captions read alike: the row's click says which folder it is.
    await click(rows[1]);
    expect(selected.map(e => e.detail.name)).toEqual([used]);
    expect(rows[1].classList.contains('has-actions')).toBe(false);
    expect(rows[2].classList.contains('has-actions')).toBe(true);
  });
});

/**
 * A special folder below the top level. Only top-level folders were asked for
 * a role, so Gmail's [Gmail]/Sent Mail, and INBOX.Sent on a server that keeps
 * every folder under the Inbox, were drawn as ordinary folders: the folder
 * icon and the server's name, whatever alps's language, while Delete filed
 * mail into [Gmail]/Trash. They stay where they are, under their parent, and
 * are drawn as what they are, one folder per role, as at the top level.
 */
describe('the sidebar draws a special folder below the top level as one', () => {
  /** Every row, as its caption and the icon it draws. */
  async function rows(mailboxes: unknown[], expanded: string[]): Promise<[string, string][]> {
    const el = await mount<El>('alps-folder-list', {
      i18nStore, settingsStore, composeStore, mailboxes, expandedFolders: new Set(expanded),
    });
    return shadowAll(el, '.folder-item').map(row => [
      row.getAttribute('title') ?? '',
      (row.querySelector('.folder-icon use')?.getAttribute('href') ?? '').split('#')[1],
    ]);
  }

  it('in Gmail\'s [Gmail] group, by special-use attribute, keeping their folder menu', async () => {
    const gmail = [
      mb('INBOX'),
      mb('[Gmail]', ['\\Noselect', '\\HasChildren']),
      mb('[Gmail]/All Mail', ['\\All']),
      mb('[Gmail]/Drafts', ['\\Drafts']),
      mb('[Gmail]/Important', ['\\Important']),
      mb('[Gmail]/Sent Mail', ['\\Sent']),
      mb('[Gmail]/Spam', ['\\Junk']),
      mb('[Gmail]/Starred', ['\\Flagged']),
      mb('[Gmail]/Trash', ['\\Trash']),
    ];
    expect(await rows(gmail, ['[Gmail]'])).toEqual([
      ['folderList.inbox', 'tray'],
      ['[Gmail]', 'folder'],
      ['All Mail', 'folder'],
      ['folderList.drafts', 'fileText'],
      ['Important', 'folder'],
      ['folderList.sent', 'paperPlaneTilt'],
      ['folderList.spam', 'warningDiamond'],
      ['Starred', 'folder'],
      ['folderList.trash', 'trash'],
    ]);
    const el = await mount<El>('alps-folder-list', {
      i18nStore, settingsStore, composeStore, mailboxes: gmail, expandedFolders: new Set(['[Gmail]']),
    });
    const sent = shadowAll(el, '.folder-item').find(row => row.getAttribute('title') === 'folderList.sent');
    expect(sent?.classList.contains('has-actions')).toBe(true);
  });

  it('under the Inbox, and only by attribute there, as the actions decide', async () => {
    const dotted = (Name: string, Attrs: string[] = []) => ({ Name, Attrs, Delimiter: '.' });
    const courier = [
      dotted('INBOX', ['\\HasChildren']),
      dotted('INBOX.Archive', ['\\Archive']),
      dotted('INBOX.Drafts'),
      dotted('INBOX.Sent', ['\\Sent']),
      dotted('INBOX.Trash', ['\\Trash']),
    ];
    expect(await rows(courier, ['INBOX'])).toEqual([
      ['folderList.inbox', 'tray'],
      ['folderList.archive', 'archiveBox'],
      ['Drafts', 'folder'],
      ['folderList.sent', 'paperPlaneTilt'],
      ['folderList.trash', 'trash'],
    ]);
  });

  it('once per role: the second folder carrying it keeps its own name', async () => {
    const dotted = (Name: string, Attrs: string[] = []) => ({ Name, Attrs, Delimiter: '.' });
    const dovecot = [
      dotted('INBOX', ['\\HasChildren']),
      dotted('INBOX.Sent', ['\\Sent']),
      dotted('INBOX.Sent Messages', ['\\Sent']),
    ];
    expect(findMailboxNameByRole('sent', dovecot, '')).toBe('INBOX.Sent');
    expect(await rows(dovecot, ['INBOX'])).toEqual([
      ['folderList.inbox', 'tray'],
      ['folderList.sent', 'paperPlaneTilt'],
      ['Sent Messages', 'folder'],
    ]);
  });

  it('and not where a top-level folder holds the role', async () => {
    const mailboxes = [mb('INBOX'), mb('Trash', ['\\Trash']), mb('Work'), mb('Work/Trash', ['\\Trash'])];
    expect(findMailboxNameByRole('trash', mailboxes, '')).toBe('Trash');
    expect(await rows(mailboxes, ['Work'])).toEqual([
      ['folderList.inbox', 'tray'],
      ['folderList.trash', 'trash'],
      ['Work', 'folder'],
      ['Trash', 'folder'],
    ]);
    // Even listed before it: the top-level folder keeps the slot.
    const first = [mb('INBOX'), mb('Projects'), mb('Projects/Trash', ['\\Trash']), mb('Trash', ['\\Trash'])];
    expect(await rows(first, ['Projects'])).toEqual([
      ['folderList.inbox', 'tray'],
      ['folderList.trash', 'trash'],
      ['Projects', 'folder'],
      ['Trash', 'folder'],
    ]);
  });

  it('while at the top level a second folder of a role stays ordinary', async () => {
    expect(await rows([mb('INBOX'), mb('Junk'), mb('Spam')], [])).toEqual([
      ['folderList.inbox', 'tray'],
      ['folderList.junk', 'warningDiamond'],
      ['Spam', 'folder'],
    ]);
  });
});

/**
 * The page names a folder as the sidebar draws it: the header above the list,
 * the search box and the toasts call a folder what its row is called.
 *
 * They decided by the folder's role alone. So of two folders with one role,
 * the second, which the sidebar draws under its own name, was captioned as
 * the special folder when opened (INBOX.Sent Messages read "Sent", the
 * "Trash" beside an Exchange "Deleted Items" read as the Trash in any
 * language), and [Gmail]/Spam was "Junk" above the list while its row said
 * "Spam": that check compared the whole path, not the folder's own name.
 */
describe('the page names every folder as the sidebar draws it', () => {
  const dotted = (Name: string, Attrs: string[] = []) => ({ Name, Attrs, Delimiter: '.' });
  const listings: [string, ReturnType<typeof mb>[]][] = [
    ['Gmail', [
      mb('INBOX'),
      mb('[Gmail]', ['\\Noselect', '\\HasChildren']),
      mb('[Gmail]/All Mail', ['\\All']),
      mb('[Gmail]/Drafts', ['\\Drafts']),
      mb('[Gmail]/Sent Mail', ['\\Sent']),
      mb('[Gmail]/Spam', ['\\Junk']),
      mb('[Gmail]/Trash', ['\\Trash']),
    ]],
    ["Dovecot's stock two Sent folders", [
      dotted('INBOX', ['\\HasChildren']),
      dotted('INBOX.Sent', ['\\Sent']),
      dotted('INBOX.Sent Messages', ['\\Sent']),
    ]],
    ['a second Trash below a top-level one', [mb('INBOX'), mb('Trash', ['\\Trash']), mb('Work'), mb('Work/Trash', ['\\Trash'])]],
    ['a second Trash listed before the top-level one', [mb('INBOX'), mb('Projects'), mb('Projects/Trash', ['\\Trash']), mb('Trash', ['\\Trash'])]],
    ['Deleted Items and Trash, by name', [mb('INBOX'), mb('Deleted Items'), mb('Trash')]],
    ['Junk and Spam, by name', [mb('INBOX'), mb('Junk'), mb('Spam')]],
    ['Archive and Archives, by name', [mb('INBOX'), mb('Archive'), mb('Archives')]],
  ];

  it.each(listings)('%s', async (_, mailboxes) => {
    const el = await mount<El>('alps-folder-list', {
      i18nStore, settingsStore, composeStore, mailboxes,
      expandedFolders: new Set(['INBOX', '[Gmail]', 'Work', 'Projects']),
    });
    const selected = record<CustomEvent>(el, 'select-mailbox');
    const named: [string, string][] = [];
    for (const row of shadowAll(el, '.folder-item:not(.no-select)')) {
      await click(row);
      const name = selected.at(-1)!.detail.name;
      named.push([row.getAttribute('title')!, getMailboxLabel(name, i18nStore as any, mailboxes)]);
    }
    expect(named.length).toBe(mailboxes.filter(m => !m.Attrs.includes('\\Noselect')).length);
    for (const [row, caption] of named) expect(caption).toBe(row);
  });

  it('and so does a list of destinations, a second folder of a role by its path', () => {
    const [, dovecot] = listings[1];
    expect(getDestinationLabel('INBOX.Sent', i18nStore as any, dovecot)).toBe('folderList.sent');
    expect(getDestinationLabel('INBOX.Sent Messages', i18nStore as any, dovecot)).toBe('INBOX.Sent Messages');
    const [, gmail] = listings[0];
    expect(getDestinationLabel('[Gmail]/Spam', i18nStore as any, gmail)).toBe('folderList.spam');
  });
});
