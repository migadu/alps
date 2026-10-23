/**
 * The list is read again once after a write the user makes, however many
 * folders the write went to, and the read does not ask the server to drop its
 * caches.
 *
 * Every folder's write re-read the list on its own, with `refresh=true`: the
 * server then dropped its folder list and every folder's counts, and read them
 * all again, besides the pages the write had already dropped. Archiving from
 * a search across every folder made one such read per folder, and each was a
 * search of every folder again.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/mailbox-page';
import type { ReaderActionDetail } from '../src/components/message-reader';
import { messageKey } from '../src/utils/message-key';
import { messageSync } from '../src/services/message-sync';
import { ALL_MAILBOXES } from '../src/utils/folders';
import { cleanup, flush, mount, record, waitFor } from './helpers/dom';

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
    enableThreading: true,
    markReadTimeout: -1,
  };
  return Object.assign(new EventTarget(), {
    getState: () => state,
    updateSettings: async (updates: Record<string, unknown>) => {
      Object.assign(state, updates);
    },
  });
}

const MAILBOXES = [
  { Name: 'INBOX', Attrs: [] },
  { Name: 'Archive', Attrs: ['\\Archive'] },
  { Name: 'Sent', Attrs: ['\\Sent'] },
  { Name: 'Trash', Attrs: ['\\Trash'] },
];

const row = (mailbox: string, uid: string) =>
  ({ UID: uid, Mailbox: mailbox, Flags: ['\\Seen'], Envelope: { Subject: `${mailbox} ${uid}` } });

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

let requests: { url: string; method: string }[] = [];
let lastUid = 100;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  requests = [];
  lastUid = 100;
  history.replaceState(null, '', '/#/mailbox/INBOX');
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    const u = String(url);
    const method = init.method || 'GET';
    requests.push({ url: u, method });
    if (u.endsWith('/messages/move')) {
      const body = JSON.parse(String(init.body));
      return json({ ok: true, uidMapping: Object.fromEntries(body.uids.map((uid: string) => [uid, String(++lastUid)])) });
    }
    if (method === 'DELETE' && u.endsWith('/messages')) {
      return json({ ok: 'true', count: JSON.parse(String(init.body)).uids.length });
    }
    if (method === 'GET' && /^\/mailboxes\/[^/]+\?page=/.test(u)) {
      return json({ Mailboxes: MAILBOXES, Messages: [row('INBOX', '7')], Total: 1, Page: 0, MessagesPerPage: 50 });
    }
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  history.replaceState(null, '', '/#/mailbox/INBOX');
});

const listingReads = () => requests.filter(r => r.method === 'GET' && /^\/mailboxes\/[^/]+\?page=/.test(r.url)).map(r => r.url);
const statusReads = () => requests.filter(r => r.url.endsWith('/status')).map(r => r.url);
const writes = () => requests.filter(r => r.method !== 'GET').map(r => `${r.method} ${r.url}`);

async function searchAcrossFolders(): Promise<El> {
  const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
  await waitFor(() => !!el.shadowRoot?.querySelector('alps-message-reader'), 'the reader');
  await waitFor(() => listingReads().length > 0, 'the first listing');
  await flush();
  Object.assign(el, {
    currentMailbox: ALL_MAILBOXES,
    mailboxes: MAILBOXES,
    messages: [row('INBOX', '5'), row('Sent', '5'), row('Sent', '6'), row('Trash', '3')],
    selectedMessage: null,
    selectedKeys: new Set(),
  });
  // The search the rows came from, which the re-read reads again.
  messageSync.setContext(ALL_MAILBOXES, 0, 'ada');
  await el.updateComplete;
  requests = [];
  return el;
}

async function settled() {
  await waitFor(() => listingReads().length > 0, 'the re-read');
  await new Promise(r => setTimeout(r, 50));
  await flush();
}

async function act(el: El, detail: ReaderActionDetail) {
  await el._handleReaderAction(new CustomEvent('action', { detail }));
  await flush();
}

describe('the re-read after a write', () => {
  it('happens once for a write that went to two folders, without dropping the server caches', async () => {
    const el = await searchAcrossFolders();
    el.selectedKeys = new Set([messageKey('INBOX', '5'), messageKey('Sent', '6')]);
    await el.updateComplete;

    await act(el, { action: 'archive' });
    await settled();

    expect(writes()).toEqual([
      'PUT /mailboxes/INBOX/messages/move',
      'PUT /mailboxes/Sent/messages/move',
    ]);
    expect(listingReads()).toEqual(['/mailboxes/*?page=0&query=ada']);
    // The Inbox's counts are asked first; a search across every folder has
    // none of its own to ask.
    expect(statusReads()).toEqual(['/mailboxes/INBOX/status']);
  });

  it('happens once for a Delete that is for good in one folder and a move to Trash in another', async () => {
    const el = await searchAcrossFolders();
    el.selectedKeys = new Set([messageKey('INBOX', '5'), messageKey('Trash', '3')]);
    await el.updateComplete;

    await act(el, { action: 'delete' });
    await el._confirmDelete();
    await settled();

    expect(writes()).toEqual([
      'DELETE /mailboxes/Trash/messages',
      'PUT /mailboxes/INBOX/messages/move',
    ]);
    expect(listingReads()).toEqual(['/mailboxes/*?page=0&query=ada']);
  });

  it('happens once for the undo of a move from two folders', async () => {
    const el = await searchAcrossFolders();
    const toasts = record<CustomEvent>(window, 'show-toast');
    el.selectedKeys = new Set([messageKey('INBOX', '5'), messageKey('Sent', '6')]);
    await el.updateComplete;
    await act(el, { action: 'archive' });
    await settled();
    requests = [];

    const undo = toasts.map(t => t.detail.actionFn).find(f => typeof f === 'function');
    expect(undo).toBeTypeOf('function');
    await undo();
    await settled();

    expect(writes()).toEqual([
      'PUT /mailboxes/Archive/messages/move',
      'PUT /mailboxes/Archive/messages/move',
    ]);
    expect(listingReads()).toEqual(['/mailboxes/*?page=0&query=ada']);
  });
});
