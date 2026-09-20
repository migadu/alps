/**
 * A gesture over a whole folder.
 *
 * The page holds one listing of it, so the folder cannot be sent as a list of
 * UIDs: the list goes stale while it is read, and a folder can hold more
 * messages than a request can carry. What travels is what the user is looking
 * at — the folder and the listing's query — with the rows they unchecked named
 * as exceptions, and the server searches the folder itself.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/mailbox-page';
import type { ReaderActionDetail } from '../src/components/message-reader';
import { messageSync } from '../src/services/message-sync';
import { messageKey } from '../src/utils/message-key';
import { cleanup, flush, mount, record, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const SEEN = '\\Seen';
const FLAGGED = '\\Flagged';

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
    messagesPerPage: 2,
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
  { Name: 'Trash', Attrs: ['\\Trash'] },
  { Name: 'Projects', Attrs: [] },
];

type Request = { url: string; method: string; body: any };
let requests: Request[] = [];
let refuse = false;
/** How many messages the server says the folder holds for the write. */
let wrote = 5;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(messageSync, 'sync').mockImplementation(() => {});
  requests = [];
  refuse = false;
  wrote = 5;
  history.replaceState(null, '', '/#/mailbox/INBOX');
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    const u = String(url);
    const method = init.method || 'GET';
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    requests.push({ url: u, method, body });
    if (method === 'GET') return new Response('{}', { status: 404 });
    if (refuse) return json({ error: 'nope' }, 500);
    if (u.endsWith('/messages/move') || u.endsWith('/messages/copy')) {
      return json({ ok: true, count: wrote, uidMapping: { '1': '101', '2': '102' } });
    }
    return json({ ok: true, count: wrote });
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  history.replaceState(null, '', '/#/mailbox/INBOX');
});

const row = (uid: string, flags: string[] = [SEEN]) =>
  ({ UID: uid, Mailbox: 'INBOX', Flags: flags, Envelope: { Subject: `message ${uid}` } });

/** The Inbox holds five messages; this page of it shows two. */
async function page(filterQuery = ''): Promise<El> {
  const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
  await waitFor(() => !!el.shadowRoot?.querySelector('alps-message-reader'), 'the reader');
  Object.assign(el, {
    currentMailbox: 'INBOX',
    mailboxes: MAILBOXES,
    messages: [row('1'), row('2')],
    totalMessages: 5,
    messagesPerPage: 2,
    filterQuery,
    selectedMessage: null,
  });
  el.selectAllInFolder();
  await el.updateComplete;
  requests = [];
  return el;
}

async function act(el: El, detail: ReaderActionDetail) {
  await el._handleReaderAction(new CustomEvent('action', { detail }));
  await flush();
}

const writes = () => requests.filter(r => r.method !== 'GET');
const inInbox = (...uids: string[]) => uids.map(uid => messageKey('INBOX', uid));

describe('selecting the folder', () => {
  it('counts every message in it, not the page', async () => {
    const el = await page();

    expect(el.selectionCount).toBe(5);
    expect(el.shadowRoot!.querySelector('alps-message-reader')!.selectedCount).toBe(5);
  });

  it('checks the rows this page shows, and the ones the next page brings', async () => {
    const el = await page();
    expect([...el.selectedKeys].sort()).toEqual(inInbox('1', '2'));

    messageSync.dispatchEvent(new CustomEvent('sync-success', {
      detail: { background: false, data: { Messages: [row('3'), row('4')], Total: 5, Page: 1 } },
    }));
    await el.updateComplete;

    expect([...el.selectedKeys].sort()).toEqual(inInbox('3', '4'));
    expect(el.selectionCount).toBe(5);
  });

  it('ends when the query does, because the query is what it is made of', async () => {
    const el = await page();
    history.replaceState(null, '', '/#/mailbox/INBOX?q=engines');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await el.updateComplete;

    expect(el.selectAllMatching).toBe(false);
    expect(el.selectionCount).toBe(0);
  });
});

describe('a gesture over the folder', () => {
  it('marks every message read in one request, and paints the rows on screen', async () => {
    const el = await page();
    el.messages = [row('1', []), row('2', [])];
    await el.updateComplete;

    await act(el, { action: 'markUnread' });

    expect(writes()).toEqual([{
      url: '/mailboxes/INBOX/messages/flag',
      method: 'PUT',
      body: { all: true, query: '', except: [], flags: [SEEN], action: 'add' },
    }]);
    expect(el.messages.every((m: any) => m.Flags.includes(SEEN))).toBe(true);
  });

  it('carries the listing\'s query, so it takes what the user is looking at', async () => {
    const el = await page('is:unread');

    await act(el, { action: 'addTag', folder: '$label1' });

    expect(writes()[0].body).toEqual({ all: true, query: 'is:unread', except: [], flags: ['$label1'], action: 'add' });
  });

  it('names the rows unchecked since as exceptions, and counts them off', async () => {
    const el = await page();
    // As the list reports it: row 1 unchecked, row 2 still checked.
    el.takeSelection(new Set(inInbox('2')));
    await el.updateComplete;
    expect(el.selectionCount).toBe(4);

    await act(el, { action: 'star' });

    expect(writes()[0].body).toEqual({ all: true, query: '', except: ['1'], flags: [FLAGGED], action: 'add' });
  });

  it('keeps an exception made on a page the user has left', async () => {
    const el = await page();
    el.takeSelection(new Set(inInbox('2')));
    messageSync.dispatchEvent(new CustomEvent('sync-success', {
      detail: { background: false, data: { Messages: [row('3'), row('4')], Total: 5, Page: 1 } },
    }));
    await el.updateComplete;

    await act(el, { action: 'star' });

    expect(writes()[0].body.except).toEqual(['1']);
    // A flag write leaves the selection standing, so the next gesture takes
    // the same messages; only filing them away ends it.
    expect(el.selectionCount).toBe(4);
  });

  it('archives the folder, says how many the server took, and offers to undo it', async () => {
    const el = await page();
    const toasts = record<CustomEvent>(window, 'show-toast');

    await act(el, { action: 'archive' });

    expect(writes()).toEqual([{
      url: '/mailboxes/INBOX/messages/move',
      method: 'PUT',
      body: { all: true, query: '', except: [], to: 'Archive' },
    }]);
    expect(toasts.at(-1)!.detail.message).toBe('toast.messagesMovedToArchive');
    expect(el.selectAllMatching).toBe(false);
    expect(el.selectionCount).toBe(0);

    await toasts.at(-1)!.detail.actionFn();
    await flush();
    expect(writes().at(-1)).toEqual({
      url: '/mailboxes/Archive/messages/move', method: 'PUT', body: { uids: ['101', '102'], to: 'INBOX' },
    });
  });

  it('offers no undo when the server sent no new UIDs for it', async () => {
    const el = await page();
    const toasts = record<CustomEvent>(window, 'show-toast');
    vi.stubGlobal('fetch', vi.fn(async () => json({ ok: true, count: 4000 })));

    await act(el, { action: 'archive' });

    expect(toasts.at(-1)!.detail.actionFn).toBeUndefined();
  });

  it('moves the folder to Trash for a Delete, without asking', async () => {
    const el = await page();

    await act(el, { action: 'delete' });

    expect(writes()).toEqual([{
      url: '/mailboxes/INBOX/messages/move', method: 'PUT', body: { all: true, query: '', except: [], to: 'Trash' },
    }]);
    expect(el.showDeleteConfirm).toBe(false);
  });

  it('copies the folder', async () => {
    const el = await page();

    await act(el, { action: 'copyTo', folder: 'Projects' });

    expect(writes()).toEqual([{
      url: '/mailboxes/INBOX/messages/copy', method: 'PUT', body: { all: true, query: '', except: [], to: 'Projects' },
    }]);
  });

  it('says when the server refused, and keeps the selection', async () => {
    const el = await page();
    const toasts = record<CustomEvent>(window, 'show-toast');
    refuse = true;

    await act(el, { action: 'archive' });

    expect(toasts.at(-1)!.detail.message).toBe('toast.moveFailed');
    expect(el.selectionCount).toBe(5);
  });
});

describe('deleting a whole folder for good', () => {
  async function inTrash(): Promise<El> {
    const el = await page();
    Object.assign(el, { currentMailbox: 'Trash', messages: [{ ...row('1'), Mailbox: 'Trash' }, { ...row('2'), Mailbox: 'Trash' }] });
    el.selectAllInFolder();
    await el.updateComplete;
    requests = [];
    return el;
  }

  it('asks first, and does nothing before the answer', async () => {
    const el = await inTrash();

    await act(el, { action: 'delete' });
    await el.updateComplete;

    expect(writes()).toEqual([]);
    expect(el.shadowRoot!.querySelector('ui-confirm')!.getAttribute('message')).toBe('messageReader.deleteConfirmMultiple');
  });

  it('deletes every message the folder holds once confirmed', async () => {
    const el = await inTrash();
    const toasts = record<CustomEvent>(window, 'show-toast');
    await act(el, { action: 'delete' });

    await el._confirmDelete();
    await flush();

    expect(writes()).toEqual([{
      url: '/mailboxes/Trash/messages', method: 'DELETE', body: { all: true, query: '', except: [] },
    }]);
    expect(toasts.at(-1)!.detail.message).toBe('toast.messagesPermanentlyDeleted');
    expect(el.selectionCount).toBe(0);
  });

  it('does nothing at all when the question is declined', async () => {
    const el = await inTrash();
    await act(el, { action: 'delete' });

    el._cancelDelete();
    await flush();

    expect(writes()).toEqual([]);
    expect(el.selectionCount).toBe(5);
  });
});
