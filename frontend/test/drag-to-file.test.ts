/**
 * Filing mail by dragging it onto a folder in the sidebar.
 *
 * Three parts, each pinned on its own: what a drag out of the list carries
 * (a row, a conversation, or the checked rows), which folder rows take it and
 * how they say so, and what the page does with a drop — the Move to picker's
 * move, with its undo, or a copy with Alt held.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-list';
import '../src/components/folder-list';
import '../src/pages/mailbox-page';
import { acceptsDroppedMessages } from '../src/utils/folders';
import { MESSAGE_DRAG_TYPE, readMessageDrag } from '../src/utils/message-drag';
import { messageSync } from '../src/services/message-sync';
import { messageKey } from '../src/utils/message-key';
import { cleanup, flush, mount, record, shadowAll, update, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

/** What jsdom lacks: a DataTransfer that keeps what is set on it. */
class FakeDataTransfer {
  data: Record<string, string> = {};
  types: string[] = [];
  effectAllowed = 'none';
  dropEffect = 'none';
  setDragImage = vi.fn();
  setData(type: string, value: string) {
    this.data[type] = value;
    if (!this.types.includes(type)) this.types.push(type);
  }
  getData(type: string) {
    return this.data[type] ?? '';
  }
}

/** A drag event, which jsdom cannot construct either. */
function dragEvent(type: string, init: { data?: FakeDataTransfer; altKey?: boolean; ctrlKey?: boolean; relatedTarget?: Node | null } = {}) {
  const e = new Event(type, { bubbles: true, cancelable: true, composed: true });
  Object.defineProperties(e, {
    dataTransfer: { value: init.data ?? null },
    altKey: { value: !!init.altKey },
    ctrlKey: { value: !!init.ctrlKey },
    relatedTarget: { value: init.relatedTarget ?? null },
  });
  return e as DragEvent;
}

/** A drag of messages as the list starts one. */
function carrying(keys: string[], selection = false) {
  const data = new FakeDataTransfer();
  data.setData(MESSAGE_DRAG_TYPE, JSON.stringify({ keys, selection }));
  return data;
}

const mb = (Name: string, Attrs: string[] = []) => ({ Name, Attrs, Delimiter: '/' });

const FOLDERS = [
  mb('INBOX'),
  mb('Drafts', ['\\Drafts']),
  mb('Sent', ['\\Sent']),
  mb('Archive', ['\\Archive']),
  mb('Junk', ['\\Junk']),
  mb('Trash', ['\\Trash']),
  mb('Work'),
  mb('Old', ['\\Noselect']),
  mb('Old/2025'),
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('which folders take dropped mail', () => {
  const takes = (name: string, viewing = 'INBOX', mailboxes: any[] = FOLDERS) =>
    acceptsDroppedMessages(mailboxes.find(m => m.Name === name), mailboxes, viewing);

  it('takes any folder that can hold mail, the special ones included', () => {
    for (const name of ['INBOX', 'Archive', 'Junk', 'Trash', 'Work', 'Old/2025']) {
      expect(takes(name, 'Work' === name ? 'INBOX' : 'Work'), name).toBe(true);
    }
  });

  it('refuses the folder on screen, where a move changes nothing', () => {
    expect(takes('INBOX', 'INBOX')).toBe(false);
    expect(takes('Work', 'Work')).toBe(false);
    // A search across every folder is no folder of its own.
    expect(takes('Work', '*')).toBe(true);
  });

  it('refuses what cannot hold a message', () => {
    expect(takes('Old')).toBe(false);
    expect(acceptsDroppedMessages(mb('Gone', ['\\NonExistent']), FOLDERS, 'INBOX')).toBe(false);
    // A path segment drawn only because a deeper folder is named through it.
    expect(acceptsDroppedMessages(undefined, FOLDERS, 'INBOX')).toBe(false);
  });

  it('refuses Drafts and Sent by role, whatever they are called', () => {
    expect(takes('Drafts')).toBe(false);
    expect(takes('Sent')).toBe(false);
    const localized = [mb('INBOX'), mb('Entwürfe', ['\\Drafts']), mb('Gesendet', ['\\Sent'])];
    expect(takes('Entwürfe', 'INBOX', localized)).toBe(false);
    expect(takes('Gesendet', 'INBOX', localized)).toBe(false);
  });

  it('lets a folder that is only CALLED Drafts or Sent take mail beside the real ones', () => {
    const mine = [mb('INBOX'), mb('Entwürfe', ['\\Drafts']), mb('Gesendet', ['\\Sent']), mb('Drafts'), mb('Sent')];
    expect(takes('Drafts', 'INBOX', mine)).toBe(true);
    expect(takes('Sent', 'INBOX', mine)).toBe(true);
  });

  it('goes by name on a server that marks no folder at all', () => {
    const plain = [mb('INBOX'), mb('Drafts'), mb('Sent'), mb('Work')];
    expect(takes('Drafts', 'INBOX', plain)).toBe(false);
    expect(takes('Sent', 'INBOX', plain)).toBe(false);
    expect(takes('Work', 'INBOX', plain)).toBe(true);
  });
});

describe('a drag out of the message list', () => {
  const message = (uid: string, Mailbox = 'INBOX') => ({
    UID: uid,
    Mailbox,
    Flags: ['\\Seen'],
    Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.com' }], To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
  });
  /** A conversation of three under row 9, and a message on its own. */
  const listing = () => [
    { ...message('9'), ThreadCount: 3, SubMessages: [message('4'), message('5')] },
    message('7'),
  ];
  const rowFor = (el: El, uid: string) =>
    shadowAll(el, '.message-item').find(r => r.textContent?.includes(`message ${uid}`))!;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
  });

  async function list(props: Record<string, unknown> = {}): Promise<El> {
    const el = await mount<El>('alps-message-list', { messages: listing(), currentMailbox: 'INBOX', totalMessages: 2 });
    return Object.keys(props).length ? update(el, props) : el;
  }

  function drag(el: El, uid: string) {
    const data = new FakeDataTransfer();
    rowFor(el, uid).dispatchEvent(dragEvent('dragstart', { data }));
    return { data, carried: readMessageDrag(data as unknown as DataTransfer) };
  }

  it('carries one message, and offers both a move and a copy', async () => {
    const el = await list();
    const { data, carried } = drag(el, '7');
    expect(carried).toEqual({ keys: [messageKey('INBOX', '7')], selection: false });
    expect(data.effectAllowed).toBe('copyMove');
    expect(data.getData('text/plain')).toBe('message 7');
    expect(data.setDragImage).toHaveBeenCalled();
  });

  it('carries a collapsed conversation as every message in it', async () => {
    const el = await list();
    const { carried } = drag(el, '9');
    expect([...carried!.keys].sort()).toEqual([messageKey('INBOX', '4'), messageKey('INBOX', '5'), messageKey('INBOX', '9')].sort());
    expect(carried!.selection).toBe(false);
  });

  it('carries the messages of a search each under its own folder', async () => {
    const el = await list({ currentMailbox: '*', messages: [message('3', 'Work'), message('3', 'INBOX')] });
    const first = shadowAll(el, '.message-item')[0];
    const data = new FakeDataTransfer();
    first.dispatchEvent(dragEvent('dragstart', { data }));
    expect(readMessageDrag(data as unknown as DataTransfer)!.keys).toEqual([messageKey('Work', '3')]);
  });

  it('carries the checked rows when it starts on one of them', async () => {
    const el = await list({ selectedMessages: new Set([messageKey('INBOX', '7'), messageKey('INBOX', '4')]) });
    const { carried } = drag(el, '7');
    expect(carried!.selection).toBe(true);
    expect([...carried!.keys].sort()).toEqual([messageKey('INBOX', '4'), messageKey('INBOX', '7')].sort());
  });

  it('carries only its own row when it starts on one that is not checked', async () => {
    const el = await list({ selectedMessages: new Set([messageKey('INBOX', '7')]) });
    const { carried } = drag(el, '9');
    expect(carried!.selection).toBe(false);
    expect(carried!.keys).not.toContain(messageKey('INBOX', '7'));
  });

  it('dims what it carries until the drop, which reaches the window though the row has gone', async () => {
    const el = await list();
    drag(el, '7');
    await el.updateComplete;
    expect(rowFor(el, '7').classList).toContain('is-dragging');
    expect(rowFor(el, '9').classList).not.toContain('is-dragging');

    window.dispatchEvent(dragEvent('drop'));
    await el.updateComplete;
    expect(rowFor(el, '7').classList).not.toContain('is-dragging');
  });

  it('brings a row back from Undo at full strength', async () => {
    const el = await list();
    drag(el, '7');
    // The move took the row off the list, and nothing ended the drag…
    await update(el, { messages: listing().slice(0, 1) });
    // …and the undo puts it back.
    await update(el, { messages: listing() });
    expect(rowFor(el, '7').classList).not.toContain('is-dragging');
  });

  it('lets go of the window when the list leaves the page mid-drag', async () => {
    const el = await list();
    const removed = vi.spyOn(window, 'removeEventListener');
    drag(el, '7');
    el.remove();
    const gone = removed.mock.calls.map(([type]) => type);
    expect(gone).toContain('drop');
    expect(gone).toContain('dragend');
  });

  it('is not offered on a phone, where the sidebar is shut', async () => {
    const el = await list({ isMobile: true });
    expect(rowFor(el, '7').getAttribute('draggable')).toBe('false');
    const desk = await list();
    expect(rowFor(desk, '7').getAttribute('draggable')).toBe('true');
  });
});

describe('a folder row under a drag', () => {
  const i18nStore = Object.assign(new EventTarget(), {
    t: (key: string) => key,
    getLanguage: () => 'en',
    getIntlLanguage: () => 'en',
  });
  const settingsStore = Object.assign(new EventTarget(), { getState: () => ({}), updateSettings: async () => {} });
  const composeStore = Object.assign(new EventTarget(), { getState: () => ({}) });

  async function sidebar(props: Record<string, unknown> = {}): Promise<El> {
    return mount<El>('alps-folder-list', {
      i18nStore, settingsStore, composeStore, mailboxes: FOLDERS, currentMailbox: 'INBOX',
      expandedFolders: new Set(['Old']), ...props,
    });
  }
  /** A row by the caption it is drawn with (special folders by their slot). */
  const rowFor = (el: El, title: string) =>
    shadowAll(el, '.folder-item').find(r => r.getAttribute('title') === title)!;

  async function over(el: El, title: string, init: Parameters<typeof dragEvent>[1] = {}) {
    const e = dragEvent('dragover', { data: carrying([messageKey('INBOX', '1')]), ...init });
    rowFor(el, title).dispatchEvent(e);
    await el.updateComplete;
    return e;
  }

  it('lights the folder a drop would file into, and lets the drop happen', async () => {
    const el = await sidebar();
    const e = await over(el, 'Work');
    expect(e.defaultPrevented).toBe(true);
    expect(e.dataTransfer!.dropEffect).toBe('move');
    expect(rowFor(el, 'Work').classList).toContain('drop-target');
    expect(rowFor(el, 'Work').classList).not.toContain('drop-copy');
  });

  it('shows a copy while Alt is held, and a move again once it is let go', async () => {
    const el = await sidebar();
    const copy = await over(el, 'Work', { altKey: true });
    expect(copy.dataTransfer!.dropEffect).toBe('copy');
    expect(rowFor(el, 'Work').classList).toContain('drop-copy');
    await over(el, 'Work');
    expect(rowFor(el, 'Work').classList).not.toContain('drop-copy');
  });

  it.each([
    ['the folder on screen', 'folderList.inbox'],
    ['Drafts', 'folderList.drafts'],
    ['Sent', 'folderList.sent'],
    ['a \\Noselect folder', 'Old'],
  ])('refuses %s', async (_what, title) => {
    const el = await sidebar();
    const e = await over(el, title);
    expect(e.defaultPrevented).toBe(false);
    expect(rowFor(el, title).classList).not.toContain('drop-target');
  });

  it('takes no notice of a drag that is not of messages', async () => {
    const el = await sidebar();
    const file = new FakeDataTransfer();
    file.setData('Files', '');
    const e = await over(el, 'Work', { data: file });
    expect(e.defaultPrevented).toBe(false);
    expect(rowFor(el, 'Work').classList).not.toContain('drop-target');
  });

  it('takes nothing while collapsed to the strip', async () => {
    const el = await sidebar({ collapsed: true });
    const e = await over(el, 'Work');
    expect(e.defaultPrevented).toBe(false);
  });

  it('goes dark when the drag leaves it, but not for its own caption', async () => {
    const el = await sidebar();
    await over(el, 'Work');
    const row = rowFor(el, 'Work');
    row.dispatchEvent(dragEvent('dragleave', { relatedTarget: row.querySelector('.folder-name') }));
    await el.updateComplete;
    expect(row.classList).toContain('drop-target');
    row.dispatchEvent(dragEvent('dragleave', { relatedTarget: rowFor(el, 'folderList.archive') }));
    await el.updateComplete;
    expect(row.classList).not.toContain('drop-target');
  });

  it.each([
    ['Escape', () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))],
    ['a drag that ends elsewhere', () => window.dispatchEvent(dragEvent('dragend'))],
  ])('goes dark on %s', async (_what, end) => {
    const el = await sidebar();
    await over(el, 'Work');
    end();
    await el.updateComplete;
    expect(rowFor(el, 'Work').classList).not.toContain('drop-target');
  });

  it('hands the page the folder, the messages, and whether to copy', async () => {
    const el = await sidebar();
    const dropped = record<CustomEvent>(el, 'drop-messages');
    await over(el, 'folderList.trash');
    const keys = [messageKey('INBOX', '1'), messageKey('INBOX', '2')];
    const e = dragEvent('drop', { data: carrying(keys, true), altKey: true });
    rowFor(el, 'folderList.trash').dispatchEvent(e);
    await el.updateComplete;

    expect(e.defaultPrevented).toBe(true);
    expect(dropped).toHaveLength(1);
    // The folder's own name: the caption is the sidebar's, the MOVE is IMAP's.
    expect(dropped[0].detail).toEqual({ folder: 'Trash', copy: true, keys, selection: true });
    expect(rowFor(el, 'folderList.trash').classList).not.toContain('drop-target');
  });

  it('hands over nothing dropped on a folder that refuses it', async () => {
    const el = await sidebar();
    const dropped = record<CustomEvent>(el, 'drop-messages');
    rowFor(el, 'folderList.drafts').dispatchEvent(dragEvent('drop', { data: carrying([messageKey('INBOX', '1')]) }));
    expect(dropped).toHaveLength(0);
  });

  it('lets go of the window when it leaves the page with a folder lit', async () => {
    const el = await sidebar();
    await over(el, 'Work');
    const removed = vi.spyOn(window, 'removeEventListener');
    el.remove();
    const gone = removed.mock.calls.map(([type]) => type);
    expect(gone).toEqual(expect.arrayContaining(['dragend', 'drop', 'keydown']));
  });
});

describe('the page, given a drop', () => {
  const i18nStore = Object.assign(new EventTarget(), {
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
    getLanguage: () => 'en',
    getIntlLanguage: () => 'en',
  });
  function settingsStore() {
    const state: Record<string, unknown> = {
      layoutMode: 'vertical', densityMode: 'compact', sortOrder: 'desc', messagesPerPage: 50,
      checkMailInterval: 0, loginUsername: 'ada@example.com', enableThreading: true, markReadTimeout: -1,
    };
    return Object.assign(new EventTarget(), {
      getState: () => state,
      updateSettings: async (updates: Record<string, unknown>) => { Object.assign(state, updates); },
    });
  }

  type Request = { url: string; method: string; body: any };
  let requests: Request[] = [];
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(messageSync, 'sync').mockImplementation(() => {});
    requests = [];
    history.replaceState(null, '', '/#/mailbox/INBOX');
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
      const u = String(url);
      const method = init.method || 'GET';
      const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
      requests.push({ url: u, method, body });
      if (u.endsWith('/messages/move')) {
        return json({ ok: true, uidMapping: Object.fromEntries(body.uids.map((uid: string) => [uid, String(Number(uid) + 100)])) });
      }
      if (u.endsWith('/messages/copy')) return json({ ok: true });
      return new Response('{}', { status: 404 });
    }));
  });

  afterEach(() => history.replaceState(null, '', '/#/mailbox/INBOX'));

  const row = (uid: string, Mailbox = 'INBOX') => ({ UID: uid, Mailbox, Flags: ['\\Seen'], Envelope: { Subject: `message ${uid}` } });

  async function inbox(messages: any[] = [row('1'), row('2'), row('3')]): Promise<El> {
    const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
    await waitFor(() => !!el.shadowRoot?.querySelector('alps-folder-list'), 'the folder list');
    Object.assign(el, {
      currentMailbox: 'INBOX', mailboxes: FOLDERS, messages, totalMessages: messages.length,
      selectedMessage: null, selectedKeys: new Set(),
    });
    await el.updateComplete;
    requests = [];
    return el;
  }

  /** A drop as the folder list hands it up, and the work it starts. */
  async function drop(el: El, detail: { folder: string; copy?: boolean; keys: string[]; selection?: boolean }) {
    el.shadowRoot!.querySelector('alps-folder-list')!.dispatchEvent(new CustomEvent('drop-messages', {
      detail: { copy: false, selection: false, ...detail }, bubbles: true, composed: true,
    }));
    await waitFor(() => requests.some(r => r.method !== 'GET'), 'the write');
    await flush();
    await flush();
  }

  const writes = () => requests.filter(r => r.method !== 'GET');
  const subjects = (el: El) => el.messages.map((m: any) => m.Envelope.Subject);

  it('moves a dragged row there, takes it off the list, and offers to put it back', async () => {
    const el = await inbox();
    const toasts = record<CustomEvent>(window, 'show-toast');
    await drop(el, { folder: 'Work', keys: [messageKey('INBOX', '2')] });

    expect(writes()).toEqual([{ url: '/mailboxes/INBOX/messages/move', method: 'PUT', body: { uids: ['2'], to: 'Work' } }]);
    expect(subjects(el)).toEqual(['message 1', 'message 3']);
    const said = toasts.at(-1)!.detail;
    expect(said.message).toContain('toast.messageMovedToFolder');
    expect(said.actionLabel).toBe('mailboxPage.undo');

    requests = [];
    await said.actionFn();
    expect(writes()).toEqual([{ url: '/mailboxes/Work/messages/move', method: 'PUT', body: { uids: ['102'], to: 'INBOX' } }]);
    // Back unchecked, as it left: it was never part of a selection.
    expect(el.selectedKeys.size).toBe(0);
  });

  it('copies with Alt held, leaving the row where it is', async () => {
    const el = await inbox();
    const toasts = record<CustomEvent>(window, 'show-toast');
    await drop(el, { folder: 'Work', copy: true, keys: [messageKey('INBOX', '2')] });

    expect(writes()).toEqual([{ url: '/mailboxes/INBOX/messages/copy', method: 'PUT', body: { uids: ['2'], to: 'Work' } }]);
    expect(subjects(el)).toEqual(['message 1', 'message 2', 'message 3']);
    expect(toasts.at(-1)!.detail.message).toContain('toast.messageCopiedToFolder');
  });

  it('moves a conversation one folder at a time, and leaves alone what is already there', async () => {
    const el = await inbox([row('1', 'INBOX'), row('8', 'Archive'), row('4', 'Work')]);
    el.currentMailbox = '*';
    await el.updateComplete;
    requests = [];
    await drop(el, { folder: 'Work', keys: [messageKey('INBOX', '1'), messageKey('Archive', '8'), messageKey('Work', '4')] });

    expect(writes().map(w => [w.url, w.body.uids])).toEqual([
      ['/mailboxes/INBOX/messages/move', ['1']],
      ['/mailboxes/Archive/messages/move', ['8']],
    ]);
  });

  it('keeps the open message open when another row is dragged away', async () => {
    const el = await inbox();
    el.selectedMessage = row('1');
    await el.updateComplete;
    await drop(el, { folder: 'Work', keys: [messageKey('INBOX', '3')] });
    expect(el.selectedMessage?.UID).toBe('1');
  });

  it('closes the open message when it is the one dragged away', async () => {
    const el = await inbox();
    el.selectedMessage = row('1');
    await el.updateComplete;
    await drop(el, { folder: 'Work', keys: [messageKey('INBOX', '1')] });
    expect(el.selectedMessage).toBeNull();
  });

  it('acts on the checked rows as the selection bar does', async () => {
    const el = await inbox();
    el.selectedKeys = new Set([messageKey('INBOX', '1'), messageKey('INBOX', '3')]);
    await el.updateComplete;
    const toasts = record<CustomEvent>(window, 'show-toast');
    await drop(el, { folder: 'Junk', keys: [messageKey('INBOX', '1'), messageKey('INBOX', '3')], selection: true });

    expect(writes()).toEqual([{ url: '/mailboxes/INBOX/messages/move', method: 'PUT', body: { uids: ['1', '3'], to: 'Junk' } }]);
    expect(subjects(el)).toEqual(['message 2']);
    expect(toasts.at(-1)!.detail.message).toContain('toast.messagesMovedToFolder');
  });

  it('files nothing in a folder that refuses a drop', async () => {
    const el = await inbox();
    for (const folder of ['Drafts', 'Sent', 'INBOX', 'Old']) {
      el.shadowRoot!.querySelector('alps-folder-list')!.dispatchEvent(new CustomEvent('drop-messages', {
        detail: { folder, copy: false, keys: [messageKey('INBOX', '1')], selection: false }, bubbles: true, composed: true,
      }));
    }
    await flush();
    expect(writes()).toEqual([]);
    expect(subjects(el)).toEqual(['message 1', 'message 2', 'message 3']);
  });
});
