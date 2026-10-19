/**
 * What the mail page's lists report reaches the toast stack.
 *
 * Both lists report through a bubbling `toast` event, and the page turns it
 * into the app's `show-toast`. It did so for the folder list only, so
 * everything the message list reported — emptying Trash or Junk, and whether
 * that worked — was never shown.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/mailbox-page';
import { cleanup, flush, mount, record, waitFor } from './helpers/dom';
import { messageSync } from '../src/services/message-sync';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

function settingsStore() {
  const state: Record<string, unknown> = {
    layoutMode: 'vertical',
    densityMode: 'compact',
    sortOrder: 'desc',
    messagesPerPage: 50,
    checkMailInterval: 0,
    loginUsername: 'ada@example.com',
  };
  return Object.assign(new EventTarget(), {
    getState: () => state,
    updateSettings: async (updates: Record<string, unknown>) => {
      Object.assign(state, updates);
    },
  });
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('toasts from the mail page', () => {
  for (const list of ['alps-message-list', 'alps-folder-list']) {
    it(`shows what ${list} reports`, async () => {
      const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
      await waitFor(() => !!el.shadowRoot?.querySelector(list), list);
      const shown = record<CustomEvent>(window, 'show-toast');

      el.shadowRoot!.querySelector(list)!.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', message: 'Mailbox emptied successfully.' },
        bubbles: true,
        composed: true,
      }));

      expect(shown.map(e => e.detail.message)).toEqual(['Mailbox emptied successfully.']);
    });
  }
});

describe('what a toast calls a folder', () => {
  /** Spanish captions, and every other key with the folder it was given. */
  const spanish = Object.assign(new EventTarget(), {
    t: (key: string, params?: Record<string, unknown>) => {
      const captions: Record<string, string> = {
        'folderList.inbox': 'Entrada',
        'folderList.junk': 'No deseado',
        'folderList.trash': 'Papelera',
        'folderList.archive': 'Archivo',
      };
      if (captions[key]) return captions[key];
      return params && 'folder' in params ? `${key}: ${params.folder}` : key;
    },
    getLanguage: () => 'es',
    getIntlLanguage: () => 'es',
  });

  const MAILBOXES = [
    { Name: 'INBOX', Attrs: [], Delimiter: '/' },
    { Name: 'Bulk', Attrs: ['\\Junk'], Delimiter: '/' },
    { Name: 'Bin', Attrs: ['\\Trash'], Delimiter: '/' },
    { Name: 'Saved', Attrs: ['\\Archive'], Delimiter: '/' },
    { Name: 'Work/Receipts', Attrs: [], Delimiter: '/' },
  ];

  const row = (uid: string) => ({ UID: uid, Mailbox: 'INBOX', Flags: ['\\Seen'], Envelope: { Subject: `message ${uid}` } });

  /** The Inbox with one message open, on a server that answers every write. */
  async function reading(): Promise<El> {
    vi.spyOn(messageSync, 'sync').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
      const body = typeof init.body === 'string' ? JSON.parse(init.body) : {};
      if (String(url).endsWith('/messages/move')) {
        return new Response(JSON.stringify({ uidMapping: Object.fromEntries(body.uids.map((uid: string) => [uid, `9${uid}`])) }), { status: 200 });
      }
      if (String(url).endsWith('/messages/copy')) return new Response('{}', { status: 200 });
      return new Response('{}', { status: 404 });
    }));
    const el = await mount<El>('mailbox-page', { i18nStore: spanish, settingsStore: settingsStore(), composeStore: new EventTarget() });
    await waitFor(() => !!el.shadowRoot?.querySelector('alps-message-list'), 'the message list');
    const open = row('1');
    Object.assign(el, { currentMailbox: 'INBOX', mailboxes: MAILBOXES, messages: [open, row('2')], selectedMessage: open });
    await el.updateComplete;
    return el;
  }

  async function said(detail: Record<string, unknown>): Promise<string[]> {
    const el = await reading();
    const shown = record<CustomEvent>(window, 'show-toast');
    await el._handleReaderAction(new CustomEvent('action', { detail }));
    await flush();
    return shown.map(e => e.detail.message);
  }

  it('names each special folder as the sidebar does, whatever the server calls it', async () => {
    expect(await said({ action: 'reportSpam' })).toEqual(['toast.messageMovedToFolder: No deseado']);
    expect(await said({ action: 'notSpam' })).toEqual(['toast.messageMovedToFolder: Entrada']);
    expect(await said({ action: 'delete' })).toEqual(['toast.messageMovedToFolder: Papelera']);
    expect(await said({ action: 'archive' })).toEqual(['toast.messageMovedToFolder: Archivo']);
  });

  it('names a folder picked for a move or a copy as its row in the picker did', async () => {
    expect(await said({ action: 'copyTo', folder: 'Bin' })).toEqual(['toast.messageCopiedToFolder: Papelera']);
    expect(await said({ action: 'moveTo', folder: 'Saved' })).toEqual(['toast.messageMovedToFolder: Archivo']);
    // Whole, as the picker lists it: "Receipts" alone could be either of two.
    expect(await said({ action: 'moveTo', folder: 'Work/Receipts' })).toEqual(['toast.messageMovedToFolder: Work/Receipts']);
  });
});

