/**
 * What the Copy/Move to picker calls each destination.
 *
 * It listed raw IMAP names: "INBOX", "[Gmail]/Trash", a \Junk called "Junk",
 * all untranslated beside a sidebar that names them in the user's language.
 * A special folder is now named as the sidebar names it, and any other
 * folder by its whole path, which is what tells two "Receipts" apart in a
 * list without the tree.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/alps-folder-selector-popup';
import { cleanup, mount, record, shadow, shadowAll } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const german = Object.assign(new EventTarget(), {
  t: (key: string) => ({
    'folderList.inbox': 'Eingang',
    'folderList.junk': 'Junk',
    'folderList.trash': 'Papierkorb',
  } as Record<string, string>)[key] ?? key,
  getLanguage: () => 'de',
  getIntlLanguage: () => 'de',
});

const mb = (Name: string, Attrs: string[] = []) => ({ Name, Attrs, Delimiter: '/' });

const MAILBOXES = [
  mb('INBOX'),
  mb('[Gmail]/Trash', ['\\Trash']),
  mb('Bulk', ['\\Junk']),
  mb('Trash'),
  mb('Clients/Receipts'),
  mb('Vendors/Receipts'),
];

async function picker(currentMailbox = 'Clients/Receipts'): Promise<El> {
  return mount<El>('alps-folder-selector-popup', { i18nStore: german, mailboxes: MAILBOXES, currentMailbox });
}

const rows = (el: El) => shadowAll(el, '.folder-name').map(row => row.textContent?.trim());

async function filter(el: El, value: string) {
  const input = shadow<HTMLInputElement>(el, '.search-input');
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await el.updateComplete;
}

afterEach(() => cleanup());

describe('the destinations offered', () => {
  it('name a special folder as the sidebar does, and any other by its whole path', async () => {
    const el = await picker();
    // The folder on screen is left out; a folder that only spells "Trash",
    // beside the server's own, is an ordinary one.
    expect(rows(el)).toEqual(['Eingang', 'Papierkorb', 'Junk', 'Trash', 'Vendors/Receipts']);
  });

  it('are found by what they are called or by their name on the server', async () => {
    const el = await picker();
    await filter(el, 'papier');
    expect(rows(el)).toEqual(['Papierkorb']);
    await filter(el, 'gmail');
    expect(rows(el)).toEqual(['Papierkorb']);
  });

  it('hand on the folder itself, not its caption', async () => {
    const el = await picker();
    const picked = record<CustomEvent>(el, 'folder-selected');
    shadowAll<HTMLButtonElement>(el, '.folder-item').find(row => row.textContent?.includes('Papierkorb'))!.click();
    expect(picked.map(e => e.detail.folderName)).toEqual(['[Gmail]/Trash']);
  });
});
