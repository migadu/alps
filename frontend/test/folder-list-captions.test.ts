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
