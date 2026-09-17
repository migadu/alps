/**
 * What the mail page writes from a search across every folder.
 *
 * The view is "*", which is not a folder: every write names the folder its
 * message is in, one write per folder, since a UID means nothing outside its
 * own and such a search lists several folders' messages. Every gesture used to
 * be sent to "*", which the server cannot select, so none of them worked.
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

function settingsStore(overrides: Record<string, unknown> = {}) {
  const state: Record<string, unknown> = {
    layoutMode: 'vertical',
    densityMode: 'compact',
    sortOrder: 'desc',
    messagesPerPage: 50,
    checkMailInterval: 0,
    loginUsername: 'ada@example.com',
    enableThreading: true,
    markReadTimeout: -1,
    ...overrides,
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
  { Name: 'Projects', Attrs: [] },
];

type Request = { url: string; method: string; body: any };
let requests: Request[] = [];
/** Folders whose writes the server refuses. */
let refusing = new Set<string>();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** A move's new UIDs, the next free ones: from 101, and never twice. */
let lastUid = 100;
const shifted = (uids: string[]) => Object.fromEntries(uids.map(uid => [uid, String(++lastUid)]));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(messageSync, 'sync').mockImplementation(() => {});
  requests = [];
  refusing = new Set();
  lastUid = 100;
  history.replaceState(null, '', '/#/mailbox/INBOX');
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    const u = String(url);
    const method = init.method || 'GET';
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    requests.push({ url: u, method, body });
    const folder = decodeURIComponent(u.split('/')[2] ?? '');
    if (method !== 'GET' && refusing.has(folder)) return json({ error: 'nope' }, 500);
    if (u.endsWith('/messages/move') || u.endsWith('/messages/copy')) return json({ ok: true, uidMapping: shifted(body.uids) });
    if (u.endsWith('/messages/flag')) return json({ ok: true });
    if (method === 'DELETE') return json({ ok: true });
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  history.replaceState(null, '', '/#/mailbox/INBOX');
});

const row = (mailbox: string, uid: string, flags: string[] = [SEEN]) =>
  ({ UID: uid, Mailbox: mailbox, Flags: flags, Envelope: { Subject: `${mailbox} ${uid}` } });

/** INBOX 5 and Sent 5 share a UID; Archive 8 is where Archive would file it. */
const results = () => [row('INBOX', '5'), row('Sent', '5'), row('Sent', '6'), row('Archive', '8'), row('Trash', '3')];

async function search(settings: Record<string, unknown> = {}): Promise<El> {
  const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(settings), composeStore: new EventTarget() });
  await waitFor(() => !!el.shadowRoot?.querySelector('alps-message-reader'), 'the reader');
  Object.assign(el, {
    currentMailbox: '*',
    mailboxes: MAILBOXES,
    messages: results(),
    selectedMessage: null,
    selectedKeys: new Set(),
  });
  await el.updateComplete;
  requests = [];
  return el;
}

async function checked(el: El, ...keys: [string, string][]) {
  el.selectedKeys = new Set(keys.map(([mailbox, uid]) => messageKey(mailbox, uid)));
  await el.updateComplete;
}

async function act(el: El, detail: ReaderActionDetail) {
  await el._handleReaderAction(new CustomEvent('action', { detail }));
  await flush();
}

const writes = () => requests.filter(r => r.method !== 'GET');
const flagsOf = (el: El, mailbox: string, uid: string) =>
  el.messages.find((m: any) => m.Mailbox === mailbox && m.UID === uid).Flags;

describe('checked rows from several folders', () => {
  it('are starred in their own folders, and only they are painted', async () => {
    const el = await search();
    await checked(el, ['INBOX', '5'], ['Sent', '6']);

    await act(el, { action: 'star' });

    expect(writes()).toEqual([
      { url: '/mailboxes/INBOX/messages/flag', method: 'PUT', body: { uids: ['5'], flags: [FLAGGED], action: 'add' } },
      { url: '/mailboxes/Sent/messages/flag', method: 'PUT', body: { uids: ['6'], flags: [FLAGGED], action: 'add' } },
    ]);
    expect(flagsOf(el, 'INBOX', '5')).toContain(FLAGGED);
    expect(flagsOf(el, 'Sent', '6')).toContain(FLAGGED);
    expect(flagsOf(el, 'Sent', '5')).not.toContain(FLAGGED);
  });

  it('are marked read in one write per folder', async () => {
    const el = await search();
    el.messages = [row('INBOX', '5', []), row('Sent', '5', []), row('Sent', '6', [])];
    await checked(el, ['INBOX', '5'], ['Sent', '5'], ['Sent', '6']);

    await act(el, { action: 'markUnread' });

    expect(writes().map(w => [w.url, w.body.uids, w.body.action])).toEqual([
      ['/mailboxes/INBOX/messages/flag', ['5'], 'add'],
      ['/mailboxes/Sent/messages/flag', ['5', '6'], 'add'],
    ]);
  });

  it('are tagged in their own folders', async () => {
    const el = await search();
    await checked(el, ['INBOX', '5'], ['Sent', '5']);

    await act(el, { action: 'addTag', folder: '$label2' });

    expect(writes().map(w => w.url)).toEqual(['/mailboxes/INBOX/messages/flag', '/mailboxes/Sent/messages/flag']);
    expect(writes().every(w => !w.url.includes('%2A'))).toBe(true);
  });

  it('are archived from each folder, except what Archive already holds', async () => {
    const el = await search();
    await checked(el, ['INBOX', '5'], ['Sent', '5'], ['Archive', '8']);
    const toasts = record<CustomEvent>(window, 'show-toast');

    await act(el, { action: 'archive' });

    expect(writes()).toEqual([
      { url: '/mailboxes/INBOX/messages/move', method: 'PUT', body: { uids: ['5'], to: 'Archive' } },
      { url: '/mailboxes/Sent/messages/move', method: 'PUT', body: { uids: ['5'], to: 'Archive' } },
    ]);
    expect(toasts.at(-1)!.detail.message).toBe('toast.messagesMovedToArchive');
    expect(el.selectedKeys.size).toBe(0);
  });

  it('go back each to its own folder on undo, and are checked again', async () => {
    const el = await search();
    await checked(el, ['INBOX', '5'], ['Sent', '5']);
    const toasts = record<CustomEvent>(window, 'show-toast');
    await act(el, { action: 'archive' });
    requests = [];

    await toasts.at(-1)!.detail.actionFn();
    await flush();

    expect(writes()).toEqual([
      { url: '/mailboxes/Archive/messages/move', method: 'PUT', body: { uids: ['101'], to: 'INBOX' } },
      { url: '/mailboxes/Archive/messages/move', method: 'PUT', body: { uids: ['102'], to: 'Sent' } },
    ]);
    expect([...el.selectedKeys].sort()).toEqual([messageKey('INBOX', '103'), messageKey('Sent', '104')].sort());
  });

  it('are moved from every folder that allows it, and the rest stay checked', async () => {
    const el = await search();
    await checked(el, ['INBOX', '5'], ['Sent', '6']);
    refusing.add('INBOX');
    const toasts = record<CustomEvent>(window, 'show-toast');

    await act(el, { action: 'moveTo', folder: 'Projects' });

    expect(writes().map(w => w.url)).toEqual(['/mailboxes/INBOX/messages/move', '/mailboxes/Sent/messages/move']);
    expect([...el.selectedKeys]).toEqual([messageKey('INBOX', '5')]);
    expect(toasts.map(t => t.detail.message)).toEqual(['toast.messagesMovedToFolder', 'toast.moveFailed']);
  });

  it('are copied from each folder', async () => {
    const el = await search();
    await checked(el, ['INBOX', '5'], ['Sent', '5']);

    await act(el, { action: 'copyTo', folder: 'Projects' });

    expect(writes()).toEqual([
      { url: '/mailboxes/INBOX/messages/copy', method: 'PUT', body: { uids: ['5'], to: 'Projects' } },
      { url: '/mailboxes/Sent/messages/copy', method: 'PUT', body: { uids: ['5'], to: 'Projects' } },
    ]);
    expect(el.selectedKeys.size).toBe(2);
  });

  describe('Delete', () => {
    it('moves them to Trash from their own folders', async () => {
      const el = await search();
      await checked(el, ['INBOX', '5'], ['Sent', '5']);

      await act(el, { action: 'delete' });

      expect(writes().map(w => [w.url, w.body])).toEqual([
        ['/mailboxes/INBOX/messages/move', { uids: ['5'], to: 'Trash' }],
        ['/mailboxes/Sent/messages/move', { uids: ['5'], to: 'Trash' }],
      ]);
      expect(el.showDeleteConfirm).toBe(false);
    });

    it('asks first about a message already in Trash, and does nothing before the answer', async () => {
      const el = await search();
      await checked(el, ['INBOX', '5'], ['Trash', '3']);

      await act(el, { action: 'delete' });
      await el.updateComplete;

      expect(writes()).toEqual([]);
      expect(el.shadowRoot!.querySelector('ui-confirm')!.getAttribute('message')).toBe('messageReader.deleteConfirmSingle');
    });

    it('deletes that one for good and moves the rest to Trash once confirmed', async () => {
      const el = await search();
      await checked(el, ['INBOX', '5'], ['Trash', '3']);
      const toasts = record<CustomEvent>(window, 'show-toast');
      await act(el, { action: 'delete' });

      await el._confirmDelete();
      await flush();

      expect(writes()).toEqual([
        { url: '/mailboxes/Trash/messages', method: 'DELETE', body: { uids: ['3'] } },
        { url: '/mailboxes/INBOX/messages/move', method: 'PUT', body: { uids: ['5'], to: 'Trash' } },
      ]);
      expect(toasts.map(t => t.detail.message)).toEqual(['toast.messagePermanentlyDeleted', 'toast.messagesMovedToTrash']);
      expect(el.selectedKeys.size).toBe(0);
    });

    it('does nothing at all when the question is declined', async () => {
      const el = await search();
      await checked(el, ['INBOX', '5'], ['Trash', '3']);
      await act(el, { action: 'delete' });

      el._cancelDelete();
      await flush();

      expect(writes()).toEqual([]);
      expect(el.selectedKeys.size).toBe(2);
    });
  });
});

describe('the open message', () => {
  async function opened(el: El, mailbox: string, uid: string) {
    el.selectedMessage = el.messages.find((m: any) => m.Mailbox === mailbox && m.UID === uid);
    await el.updateComplete;
    requests = [];
  }

  it('is named in the URL with its folder, and that message is the one opened', async () => {
    const el = await search();

    el.selectMessage(el.messages[1]);
    expect(window.location.hash).toBe('#/mailbox/*?uid=5&in=Sent');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    await waitFor(() => !!el.selectedMessage, 'the message opened');
    expect(el.selectedMessage.Mailbox).toBe('Sent');
  });

  it('is named without a folder where a folder is viewed', async () => {
    const el = await search();
    el.currentMailbox = 'INBOX';
    el.messages = [row('INBOX', '5')];

    el.selectMessage(el.messages[0]);

    expect(window.location.hash).toBe('#/mailbox/INBOX?uid=5');
  });

  it('is starred in its own folder', async () => {
    const el = await search();
    await opened(el, 'Sent', '5');

    await act(el, { action: 'star' });

    expect(writes()).toEqual([
      { url: '/mailboxes/Sent/messages/flag', method: 'PUT', body: { uids: ['5'], flags: [FLAGGED], action: 'add' } },
    ]);
    expect(flagsOf(el, 'Sent', '5')).toContain(FLAGGED);
    expect(flagsOf(el, 'INBOX', '5')).not.toContain(FLAGGED);
  });

  it('is archived from its own folder, and undo opens it again there', async () => {
    const el = await search();
    await opened(el, 'Sent', '5');
    const toasts = record<CustomEvent>(window, 'show-toast');
    // Recorded rather than followed: the stub cannot serve the message a
    // navigation opens, and the page would then go back to the list on its own.
    const went: unknown[][] = [];
    vi.spyOn(el, 'updateUrl').mockImplementation((...args: unknown[]) => { went.push(args); });
    await act(el, { action: 'archive' });
    expect(writes()).toEqual([{ url: '/mailboxes/Sent/messages/move', method: 'PUT', body: { uids: ['5'], to: 'Archive' } }]);

    await toasts.at(-1)!.detail.actionFn();
    await flush();

    expect(writes().at(-1)).toEqual({ url: '/mailboxes/Archive/messages/move', method: 'PUT', body: { uids: ['101'], to: 'Sent' } });
    expect(went.at(-1)).toEqual(['*', 0, '102', undefined, 'Sent']);
  });

  it('is downloaded from its own folder', async () => {
    const el = await search();
    await opened(el, 'Sent', '6');
    const hrefs: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      hrefs.push(this.getAttribute('href') ?? '');
    });

    await act(el, { action: 'downloadMessage' });

    expect(hrefs).toEqual(['/mailboxes/Sent/messages/6/raw']);
  });

  it('is marked read in its own folder as it opens', async () => {
    const el = await search({ markReadTimeout: 0 });
    el.messages = [row('INBOX', '5'), row('Sent', '5', [])];

    el._scheduleMarkAsRead(el.messages[1]);
    await waitFor(() => writes().length > 0, 'the read write');

    expect(writes()).toEqual([
      { url: '/mailboxes/Sent/messages/flag', method: 'PUT', body: { uids: ['5'], flags: [SEEN], action: 'add' } },
    ]);
  });
});

describe('a star from the list', () => {
  it('is written to the row\'s own folder', async () => {
    const el = await search();

    await el._handleListToggleStar(new CustomEvent('toggle-star-message', { detail: { message: el.messages[1] } }));

    expect(writes()).toEqual([
      { url: '/mailboxes/Sent/messages/flag', method: 'PUT', body: { uids: ['5'], flags: [FLAGGED], action: 'add' } },
    ]);
    expect(flagsOf(el, 'Sent', '5')).toContain(FLAGGED);
    expect(flagsOf(el, 'INBOX', '5')).not.toContain(FLAGGED);
  });
});
