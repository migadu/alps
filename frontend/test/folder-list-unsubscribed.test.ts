/**
 * Folders unsubscribed here, behind a More row.
 *
 * The folder menu's Unsubscribe writes to the IMAP subscription list, and the
 * sidebar used to ignore it: the row stayed where it was, and only the menu's
 * wording changed. A top-level folder unsubscribed here now sits behind More
 * at the end of the list, for as long as the server lists it unsubscribed.
 *
 * Here, not anywhere: the server's list also holds the folders unsubscribed in
 * other clients, and every folder a server that does not subscribe on CREATE
 * made unsubscribed. alps keeps its own list of the folders unsubscribed
 * through its menu, with the account's settings, and only those go.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/folder-list';
import { mailboxOperations } from '../src/services/mailbox-operations';
import { reportsSubscriptions } from '../src/utils/folders';
import {
  MAX_UNSUBSCRIBED_FOLDERS,
  MAX_UNSUBSCRIBED_FOLDERS_BYTES,
  capUnsubscribedFolders,
  confirmUnsubscribed,
  forgetUnsubscribedTree,
  renameUnsubscribedTree,
  settleUnsubscribedFolders,
  withUnsubscribedFolder,
  withoutUnsubscribedFolder,
} from '../src/utils/unsubscribed-folders';
import { cleanup, click, flush, mount, shadowAll, update, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});
const composeStore = Object.assign(new EventTarget(), { getState: () => ({}) });

/** As much of the settings store as the sidebar uses, keeping the list and
 * announcing a change as the real one does. */
function settings(unsubscribedFolders: string[] = [], { recordRead = true } = {}) {
  const store = Object.assign(new EventTarget(), {
    state: { customMailboxOrder: [] as string[], unsubscribedFolders },
    recordRead,
    /** Every list written, in order. */
    saved: [] as string[][],
    getState: () => store.state,
    updateSettings: async (updates: Record<string, any>) => {
      store.state = { ...store.state, ...updates };
      if (updates.unsubscribedFolders) store.saved.push(updates.unsubscribedFolders);
      store.dispatchEvent(new CustomEvent('change'));
    },
  });
  return store;
}

/** A listed folder, subscribed unless it says otherwise. */
const mb = (Name: string, opts: { attrs?: string[]; subscribed?: boolean } = {}) =>
  ({ Name, Attrs: opts.attrs ?? [], Delimiter: '/', Subscribed: opts.subscribed ?? true });
const off = (Name: string, attrs: string[] = []) => mb(Name, { attrs, subscribed: false });

const SPECIAL = [
  mb('INBOX'),
  mb('Sent', { attrs: ['\\Sent'] }),
  mb('Trash', { attrs: ['\\Trash'] }),
];

async function sidebar(mailboxes: unknown[], store = settings(), props: Record<string, unknown> = {}): Promise<El> {
  const el = await mount<El>('alps-folder-list', {
    i18nStore, settingsStore: store, composeStore, mailboxes, currentMailbox: 'INBOX', ...props,
  });
  // The settings listener goes on after the first render.
  await flush();
  return el;
}

/** Every folder row drawn, by caption, the More row left out. */
const drawn = (el: El) =>
  shadowAll(el, '.folder-item:not(.more-row)').map(row => row.getAttribute('title') ?? '');
const moreRow = (el: El) => el.shadowRoot!.querySelector<HTMLButtonElement>('button.more-row');
const row = (el: El, caption: string) => {
  const found = shadowAll(el, '.folder-item').find(r => r.getAttribute('title') === caption);
  expect(found, `no row captioned ${caption}`).toBeTruthy();
  return found!;
};
/** A verb in a row's menu, by its caption's key. */
const menuItem = (el: El, caption: string, key: string) => {
  const found = Array.from(row(el, caption).querySelectorAll<HTMLButtonElement>('.dropdown-item'))
    .find(b => b.textContent?.includes(key));
  expect(found, `no ${key} in the menu of ${caption}`).toBeTruthy();
  return found!;
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('a folder unsubscribed here', () => {
  it('goes behind More while the server lists it unsubscribed, and comes out when More is opened', async () => {
    const el = await sidebar([...SPECIAL, mb('Work'), off('Old'), mb('Zeta')], settings(['Old']));
    expect(drawn(el)).toContain('Work');
    expect(drawn(el)).not.toContain('Old');
    const more = moreRow(el)!;
    expect(more.getAttribute('aria-expanded')).toBe('false');
    expect(more.textContent).toContain('folderList.more');
    // After every folder still in the list, the subscribed ones included.
    const rows = shadowAll(el, '.folder-item');
    expect(rows.indexOf(more)).toBe(rows.length - 1);

    await click(more, el);
    expect(drawn(el).at(-1)).toBe('Old');
    expect(moreRow(el)!.getAttribute('aria-expanded')).toBe('true');
    expect(moreRow(el)!.textContent).toContain('folderList.less');

    await click(moreRow(el)!, el);
    expect(drawn(el)).not.toContain('Old');
  });

  it('takes its subfolders with it, subscribed or not', async () => {
    const el = await sidebar(
      [...SPECIAL, off('Old'), mb('Old/Clients'), off('Old/Clients/2019')],
      settings(['Old']),
      { expandedFolders: new Set(['Old', 'Old/Clients']) },
    );
    expect(drawn(el)).not.toContain('Clients');
    await click(moreRow(el)!, el);
    expect(drawn(el)).toEqual(expect.arrayContaining(['Old', 'Clients', '2019']));
  });

  it('nested, stays under its parent', async () => {
    const el = await sidebar(
      [...SPECIAL, mb('Work'), off('Work/Archive 2019')],
      settings(['Work/Archive 2019']),
      { expandedFolders: new Set(['Work']) },
    );
    expect(drawn(el)).toContain('Archive 2019');
    expect(moreRow(el)).toBeNull();
  });

  it('keeps More open while it is the folder on screen, or holds it', async () => {
    const mailboxes = [...SPECIAL, off('Old'), off('Old/Clients')];
    const inIt = await sidebar(mailboxes, settings(['Old']), { currentMailbox: 'Old' });
    expect(moreRow(inIt)!.getAttribute('aria-expanded')).toBe('true');
    expect(drawn(inIt)).toContain('Old');

    const beneath = await sidebar(mailboxes, settings(['Old']), { currentMailbox: 'Old/Clients' });
    expect(moreRow(beneath)!.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('a folder unsubscribed only on the server', () => {
  it('stays in the list: unsubscribed in another client, or created where a folder is not subscribed', async () => {
    const el = await sidebar([...SPECIAL, mb('Work'), off('Elsewhere'), off('Made here in 2024')]);
    expect(drawn(el)).toEqual(expect.arrayContaining(['Work', 'Elsewhere', 'Made here in 2024']));
    expect(moreRow(el)).toBeNull();
  });
});

describe('a folder subscribed again elsewhere', () => {
  it('is back in the list, and its entry is dropped', async () => {
    const store = settings(['Old', 'Gone']);
    const el = await sidebar([...SPECIAL, mb('Old'), mb('Work')], store);
    expect(drawn(el)).toContain('Old');
    expect(moreRow(el)).toBeNull();
    // A folder the listing does not show keeps its entry.
    await waitFor(() => store.state.unsubscribedFolders.length === 1, 'the entry dropped');
    expect(store.state.unsubscribedFolders).toEqual(['Gone']);

    // So unsubscribing it in that other client later leaves it here.
    await update(el, { mailboxes: [...SPECIAL, off('Old'), mb('Work')] });
    expect(drawn(el)).toContain('Old');
    expect(moreRow(el)).toBeNull();
  });

  it('keeps its entry until the account\'s settings have been read', async () => {
    // Worked out from this browser's copy, the list would be saved over the
    // account's once the record arrived.
    const store = settings(['Old'], { recordRead: false });
    await sidebar([...SPECIAL, mb('Old')], store);
    await flush();
    expect(store.saved).toEqual([]);

    store.recordRead = true;
    store.dispatchEvent(new CustomEvent('change'));
    await waitFor(() => store.saved.length === 1, 'the entry dropped');
    expect(store.state.unsubscribedFolders).toEqual([]);
  });
});

describe('the folder menu', () => {
  it('Unsubscribe puts the folder on the list and behind More; Subscribe takes it off and back', async () => {
    const setSubscribed = vi.spyOn(mailboxOperations, 'setSubscribed').mockResolvedValue({ ok: true });
    const store = settings();
    const el = await sidebar([...SPECIAL, mb('Work'), mb('Home')], store);

    await click(menuItem(el, 'Work', 'folderList.unsubscribe'), el);
    expect(setSubscribed).toHaveBeenLastCalledWith('Work', false);
    expect(store.state.unsubscribedFolders).toEqual(['Work']);

    // The listing that follows the UNSUBSCRIBE.
    await update(el, { mailboxes: [...SPECIAL, off('Work'), mb('Home')] });
    expect(drawn(el)).not.toContain('Work');
    await click(moreRow(el)!, el);

    await click(menuItem(el, 'Work', 'folderList.subscribe'), el);
    expect(setSubscribed).toHaveBeenLastCalledWith('Work', true);
    expect(store.state.unsubscribedFolders).toEqual([]);
    await update(el, { mailboxes: [...SPECIAL, mb('Work'), mb('Home')] });
    expect(drawn(el)).toContain('Work');
    expect(moreRow(el)).toBeNull();
  });

  it('Unsubscribe is not undone by a listing read before it', async () => {
    vi.spyOn(mailboxOperations, 'setSubscribed').mockResolvedValue({ ok: true });
    const store = settings();
    const el = await sidebar([...SPECIAL, mb('Work')], store);

    await click(menuItem(el, 'Work', 'folderList.unsubscribe'), el);
    // Still the listing from before, with Work subscribed.
    await update(el, { mailboxes: [...SPECIAL, mb('Work')] });
    await flush();
    expect(store.state.unsubscribedFolders).toEqual(['Work']);

    // Borne out, and only then subscribed again elsewhere.
    await update(el, { mailboxes: [...SPECIAL, off('Work')] });
    expect(drawn(el)).not.toContain('Work');
    await update(el, { mailboxes: [...SPECIAL, mb('Work')] });
    await waitFor(() => store.state.unsubscribedFolders.length === 0, 'the entry dropped');
    expect(drawn(el)).toContain('Work');
  });

  it('an Unsubscribe the server refused writes nothing', async () => {
    vi.spyOn(mailboxOperations, 'setSubscribed').mockResolvedValue({ ok: false, reason: 'failed' });
    const store = settings();
    const el = await sidebar([...SPECIAL, mb('Work')], store);
    await click(menuItem(el, 'Work', 'folderList.unsubscribe'), el);
    expect(store.saved).toEqual([]);
  });
});

describe('renaming and deleting here', () => {
  const mailboxes = [...SPECIAL, off('Old'), off('Old/2019'), off('Older'), mb('Work')];
  const entries = () => ['Old', 'Old/2019', 'Older'];

  it('a rename carries the entries of the folder and of every folder under it, and so does its Undo', async () => {
    vi.spyOn(mailboxOperations, 'renameMailbox').mockResolvedValue('ok');
    const store = settings(entries());
    const el = await sidebar(mailboxes, store);
    const toasts: CustomEvent[] = [];
    el.addEventListener('toast', e => toasts.push(e as CustomEvent));
    await click(moreRow(el)!, el);

    await click(menuItem(el, 'Old', 'folderList.rename'), el);
    el.shadowRoot!.querySelector('ui-prompt')!.dispatchEvent(new CustomEvent('submit', { detail: { name: 'Archive' } }));
    await waitFor(() => store.saved.length === 1, 'the rename written');
    // Not Older, which only shares the prefix.
    expect(store.state.unsubscribedFolders).toEqual(['Archive', 'Archive/2019', 'Older']);

    await toasts.at(-1)!.detail.actionFn();
    expect(store.state.unsubscribedFolders).toEqual(entries());
  });

  it('a move to Trash drops them', async () => {
    vi.spyOn(mailboxOperations, 'renameMailbox').mockResolvedValue('ok');
    const store = settings(entries());
    const el = await sidebar(mailboxes, store);
    await click(moreRow(el)!, el);

    await click(menuItem(el, 'Old', 'folderList.delete'), el);
    el.shadowRoot!.querySelector('ui-confirm')!.dispatchEvent(new CustomEvent('confirm'));
    await waitFor(() => store.saved.length === 1, 'the move written');
    expect(store.state.unsubscribedFolders).toEqual(['Older']);
  });

  it('a delete drops them', async () => {
    vi.spyOn(mailboxOperations, 'deleteMailbox').mockResolvedValue(true);
    const store = settings(['Trash/Old', 'Trash/Old/2019', 'Older']);
    const el = await sidebar(
      [...SPECIAL, off('Trash/Old'), off('Trash/Old/2019'), off('Older')],
      store,
      { expandedFolders: new Set(['Trash']) },
    );

    await click(menuItem(el, 'Old', 'folderList.delete'), el);
    el.shadowRoot!.querySelector('ui-confirm')!.dispatchEvent(new CustomEvent('confirm'));
    await waitFor(() => store.saved.length === 1, 'the delete written');
    expect(store.state.unsubscribedFolders).toEqual(['Older']);
  });

  it('a folder created under the name of one deleted elsewhere does not inherit its entry', async () => {
    vi.spyOn(mailboxOperations, 'createMailbox').mockResolvedValue('ok');
    const store = settings(['Old', 'Older']);
    const el = await sidebar([...SPECIAL, off('Older')], store);
    el.triggerCreateFolder();
    await update(el, {});
    el.shadowRoot!.querySelector('ui-prompt')!.dispatchEvent(new CustomEvent('submit', { detail: { name: 'Old' } }));
    await waitFor(() => store.saved.length === 1, 'the create written');
    expect(store.state.unsubscribedFolders).toEqual(['Older']);
  });
});

describe('what never goes behind More', () => {
  it('the Inbox and the special-use folders, unsubscribed here or not', async () => {
    const el = await sidebar([
      off('INBOX'),
      off('Sent', ['\\Sent']),
      off('Papierkorb', ['\\Trash']),
      off('Archive', ['\\Archive']),
      mb('Work'),
    ], settings(['INBOX', 'Sent', 'Papierkorb', 'Archive']));
    expect(drawn(el)).toEqual(expect.arrayContaining([
      'folderList.inbox', 'folderList.sent', 'folderList.archive', 'folderList.trash', 'Work',
    ]));
    expect(moreRow(el)).toBeNull();
  });

  it('a container that holds them, such as Gmail\'s', async () => {
    const el = await sidebar([
      mb('INBOX'),
      off('[Gmail]', ['\\Noselect']),
      off('[Gmail]/Sent Mail', ['\\Sent']),
      off('[Gmail]/Trash', ['\\Trash']),
      mb('Work'),
    ], settings(['[Gmail]']));
    expect(drawn(el)).toContain('[Gmail]');
    expect(moreRow(el)).toBeNull();
  });
});

describe('a listing that says nothing about subscriptions', () => {
  it('is recognised: no folder subscribed reads as no answer', () => {
    expect(reportsSubscriptions([off('INBOX'), off('Work')])).toBe(false);
    expect(reportsSubscriptions([{ Name: 'INBOX', Attrs: [] }])).toBe(false);
    expect(reportsSubscriptions([])).toBe(false);
    expect(reportsSubscriptions([mb('INBOX'), off('Work')])).toBe(true);
  });

  it('leaves every folder where it is, those unsubscribed here included', async () => {
    const el = await sidebar(
      [off('INBOX'), off('Sent', ['\\Sent']), off('Work'), off('Old'), off('Old/Clients')],
      settings(['Old']),
      { expandedFolders: new Set(['Old']) },
    );
    expect(drawn(el)).toEqual(expect.arrayContaining(['Work', 'Old', 'Clients']));
    expect(moreRow(el)).toBeNull();
  });

  it('nor when the listing carries no subscription field at all', async () => {
    const el = await sidebar([{ Name: 'INBOX', Attrs: [] }, { Name: 'Old', Attrs: [] }], settings(['Old']));
    expect(drawn(el)).toContain('Old');
    expect(moreRow(el)).toBeNull();
  });
});

describe('the list', () => {
  it('holds each folder once, at its latest place', () => {
    expect(withUnsubscribedFolder(['Old', 'Work'], 'Old')).toEqual(['Work', 'Old']);
    expect(capUnsubscribedFolders(['Old', 'Work', 'Old', ''])).toEqual(['Work', 'Old']);
    expect(withoutUnsubscribedFolder(['Old', 'Old/2019', 'Work'], 'Old')).toEqual(['Old/2019', 'Work']);
  });

  it('keeps the newest folders that fit the server\'s caps', () => {
    const names = Array.from({ length: MAX_UNSUBSCRIBED_FOLDERS + 5 }, (_, i) => `Folder ${i}`);
    const capped = capUnsubscribedFolders(names);
    expect(capped).toHaveLength(MAX_UNSUBSCRIBED_FOLDERS);
    expect(capped[0]).toBe('Folder 5');
    expect(capped.at(-1)).toBe(`Folder ${MAX_UNSUBSCRIBED_FOLDERS + 4}`);

    // Counted in UTF-8 bytes, as the server counts them: each of these takes
    // just over half of what the list may, though under a quarter in letters.
    const half = 'ш'.repeat(MAX_UNSUBSCRIBED_FOLDERS_BYTES / 4);
    expect(capUnsubscribedFolders(['Old', `${half}1`, `${half}2`])).toEqual(['Old', `${half}2`]);
    // A name too long to fit at all does not take the older ones with it.
    expect(capUnsubscribedFolders(['Old', 'x'.repeat(MAX_UNSUBSCRIBED_FOLDERS_BYTES + 1)])).toEqual(['Old']);
  });

  it('follows a rename, and forgets a folder gone, by the server\'s delimiter', () => {
    const list = ['Work', 'Work.Old', 'Workshop', 'Home'];
    expect(renameUnsubscribedTree(list, 'Work', 'Jobs', '.')).toEqual(['Jobs', 'Jobs.Old', 'Workshop', 'Home']);
    expect(forgetUnsubscribedTree(list, 'Work', '.')).toEqual(['Workshop', 'Home']);
  });

  it('drops a folder listed subscribed, unless it was only just unsubscribed here', () => {
    const listing = [mb('INBOX'), mb('Old'), mb('Fresh'), off('Kept')];
    expect(settleUnsubscribedFolders(['Old', 'Fresh', 'Kept', 'Gone'], listing, new Set(['Fresh'])))
      .toEqual(['Fresh', 'Kept', 'Gone']);

    const unconfirmed = new Set(['Fresh', 'Kept']);
    confirmUnsubscribed(unconfirmed, listing);
    expect([...unconfirmed]).toEqual(['Fresh']);
  });
});
