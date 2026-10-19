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
import { cleanup, mount, shadowAll } from './helpers/dom';

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
