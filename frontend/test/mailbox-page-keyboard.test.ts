/**
 * The arrow keys, pressed before anything in the list has focus.
 *
 * The list moves its cursor on keys pressed inside it, and opening a folder
 * from the sidebar leaves the focus on the page or on the folder's name,
 * neither of which the list hears, so ArrowDown did nothing until a row had
 * been clicked. The page now passes on an arrow that nothing else takes, and
 * only that: a field keeps its own. A folder's name in the sidebar is a
 * button that takes no arrows, so it passes them on too.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/mailbox-page';
import { cleanup, flush, mount, record, shadow, shadowAll, waitFor } from './helpers/dom';
import { messageSync } from '../src/services/message-sync';
import { messageOperations } from '../src/services/message-operations';
import { messageKey } from '../src/utils/message-key';

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
    showSenderAvatars: false,
    markReadTimeout: -1,
  };
  return Object.assign(new EventTarget(), {
    getState: () => state,
    updateSettings: async (updates: Record<string, unknown>) => { Object.assign(state, updates); },
  });
}

const message = (uid: number) => ({
  UID: String(uid),
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.test' }], To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (String(url).startsWith('/mailboxes/INBOX?')) {
      return new Response(JSON.stringify({
        Page: 0, Total: 2, MessagesPerPage: 50,
        Mailboxes: [{ Name: 'INBOX', Attrs: [] }],
        Messages: [message(9), message(8)],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  messageSync.stop();
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '#/');
});

const inInbox = (...uids: number[]) => uids.map(uid => messageKey('INBOX', uid));
const unread = (uid: number) => ({ ...message(uid), Flags: [] as string[] });
const listContent = (list: El) => shadow<HTMLElement>(list, '.list-content');

async function listed(page: El, messages: any[]) {
  page.messages = messages;
  await page.updateComplete;
  await shadow<El>(page, 'alps-message-list').updateComplete;
}

describe('mail action shortcuts', () => {
  it('marks a cursor row read explicitly, even when pressed again', async () => {
    const { page, list } = await shownInbox();
    await listed(page, [unread(9), unread(8)]);
    const flags = vi.spyOn(messageOperations, 'setFlag').mockResolvedValue({ ok: true });
    press(document.body, 'ArrowDown');

    expect(press(listContent(list), 'q').defaultPrevented).toBe(true);
    await waitFor(() => !page.shortcutProcessing);
    expect(shadowAll(list, '.message-item.unread')).toHaveLength(1);
    expect(page.selectedMessage).toBeNull();

    press(listContent(list), 'q');
    await waitFor(() => !page.shortcutProcessing);
    expect(flags.mock.calls).toEqual([
      ['INBOX', ['9'], ['\\Seen'], 'add'],
      ['INBOX', ['9'], ['\\Seen'], 'add'],
    ]);
    expect(shadowAll(list, '.message-item.unread')).toHaveLength(1);
  });

  it('uses checked messages before the cursor, including a mixed read selection', async () => {
    const { page, list } = await shownInbox();
    await listed(page, [unread(9), message(8)]);
    const flags = vi.spyOn(messageOperations, 'setFlag').mockResolvedValue({ ok: true });
    press(document.body, 'ArrowDown');
    page.selectedKeys = new Set(inInbox(8));
    await page.updateComplete;

    press(listContent(list), 'q');
    await waitFor(() => !page.shortcutProcessing);

    expect(flags).toHaveBeenCalledExactlyOnceWith('INBOX', ['8'], ['\\Seen'], 'add');
    expect(page.messages[0].Flags).toEqual([]);
    expect(page.messages[1].Flags).toEqual(['\\Seen']);
  });

  it('marks a collapsed conversation read, then only the focused child when expanded', async () => {
    const { page, list } = await shownInbox();
    await listed(page, [{ ...unread(9), ThreadCount: 2, SubMessages: [unread(4)] }, unread(8)]);
    const flags = vi.spyOn(messageOperations, 'setFlag').mockResolvedValue({ ok: true });
    press(document.body, 'ArrowDown');
    press(listContent(list), 'q');
    await waitFor(() => !page.shortcutProcessing);
    expect(flags).toHaveBeenLastCalledWith('INBOX', ['9', '4'], ['\\Seen'], 'add');

    list.expandedThreads = new Set(['9']);
    await list.updateComplete;
    press(listContent(list), 'ArrowDown');
    press(listContent(list), 'q');
    await waitFor(() => !page.shortcutProcessing);
    expect(flags).toHaveBeenLastCalledWith('INBOX', ['4'], ['\\Seen'], 'add');
  });

  it('archives the cursor conversation to the special-use folder and offers undo without checking it', async () => {
    const { page, list } = await shownInbox();
    await listed(page, [{ ...message(9), ThreadCount: 2, SubMessages: [message(4)] }, message(8)]);
    page.mailboxes = [{ Name: 'INBOX', Attrs: [] }, { Name: 'Filed', Attrs: ['\\Archive'] }];
    const moves = vi.spyOn(messageOperations, 'moveMessages')
      .mockResolvedValueOnce({ success: true, uidMapping: { '9': '109', '4': '104' } })
      .mockResolvedValueOnce({ success: true, uidMapping: { '109': '209', '104': '204' } });
    const toasts = record<CustomEvent>(window, 'show-toast');
    press(document.body, 'ArrowDown');

    expect(press(listContent(list), 'z').defaultPrevented).toBe(true);
    await waitFor(() => !page.shortcutProcessing);
    expect(moves).toHaveBeenCalledExactlyOnceWith('INBOX', ['9', '4'], 'Filed');
    expect(page.messages.map((msg: any) => msg.UID)).toEqual(['8']);
    expect(page.selectedKeys.size).toBe(0);
    expect(toasts.at(-1)!.detail.actionFn).toBeTypeOf('function');

    await toasts.at(-1)!.detail.actionFn();
    expect(moves).toHaveBeenLastCalledWith('Filed', ['104', '109'], 'INBOX');
    expect(page.selectedKeys.size).toBe(0);
  });

  it('uses whole-folder matching selections for both read and archive', async () => {
    const { page } = await shownInbox();
    page.selectAllMatching = true;
    page.selectedKeys = new Set(inInbox(9));
    page.excludedKeys = new Set(inInbox(8));
    page.totalMessages = 20;
    const flags = vi.spyOn(messageOperations, 'setFlagMatching').mockResolvedValue({ ok: true });
    const moves = vi.spyOn(messageOperations, 'moveMatching').mockResolvedValue({ success: true, count: 19 });

    press(document.body, 'q');
    await waitFor(() => !page.shortcutProcessing);
    expect(flags).toHaveBeenCalledExactlyOnceWith('INBOX', { query: '', except: ['8'] }, ['\\Seen'], 'add');

    press(document.body, 'z');
    await waitFor(() => !page.shortcutProcessing);
    expect(moves).toHaveBeenCalledExactlyOnceWith('INBOX', { query: '', except: ['8'] }, 'Archive');
    expect(page.selectionCount).toBe(0);
  });

  it('marks the open conversation read, including unread Sent replies, when focus is in the reader', async () => {
    const { page, list } = await shownInbox();
    await listed(page, [{ ...unread(9), ThreadCount: 3,
      SubMessages: [unread(4), { ...unread(3), Mailbox: 'Sent' }] }, unread(8)]);
    page.selectedMessage = page.messages[0];
    await page.updateComplete;
    const reader = shadow<El>(page, 'alps-message-reader');
    await reader.updateComplete;
    await waitFor(() => !reader.loading, 'the reader response');
    const flags = vi.spyOn(messageOperations, 'setFlag').mockResolvedValue({ ok: true });
    // Leave a different cursor behind, then interact with the open reader.
    press(listContent(list), 'ArrowDown');

    press(reader, 'q');
    await waitFor(() => !page.shortcutProcessing);
    expect(flags.mock.calls).toEqual([
      ['INBOX', ['9', '4'], ['\\Seen'], 'add'],
      ['Sent', ['3'], ['\\Seen'], 'add'],
    ]);
    expect(page.messages[1].Flags).toEqual([]);
    expect(page.selectedMessage.UID).toBe('9');
  });

  it('keeps the cursor on a row marked read while another message stays open', async () => {
    const { page, list } = await shownInbox();
    await listed(page, [message(9), unread(8)]);
    page.selectedMessage = page.messages[0];
    await page.updateComplete;
    await list.updateComplete;
    const flags = vi.spyOn(messageOperations, 'setFlag').mockResolvedValue({ ok: true });
    press(listContent(list), 'ArrowDown');
    await list.updateComplete;
    expect(focused(list)).toEqual(['message 8']);

    press(listContent(list), 'q');
    await waitFor(() => !page.shortcutProcessing);
    await page.updateComplete;
    await list.updateComplete;
    expect(focused(list)).toEqual(['message 8']);
    expect(page.selectedMessage.UID).toBe('9');

    press(listContent(list), 'q');
    await waitFor(() => !page.shortcutProcessing);
    expect(flags.mock.calls.map(call => call[1])).toEqual([['8'], ['8']]);
  });

  it('moves the cursor to the previous row after archiving the last row', async () => {
    const { page, list } = await shownInbox();
    const moves = vi.spyOn(messageOperations, 'moveMessages').mockResolvedValue({ success: true });
    press(document.body, 'ArrowDown');
    press(listContent(list), 'ArrowDown');
    await list.updateComplete;
    expect(focused(list)).toEqual(['message 8']);

    press(listContent(list), 'z');
    await waitFor(() => !page.shortcutProcessing);
    await page.updateComplete;
    await list.updateComplete;
    expect(focused(list)).toEqual(['message 9']);

    press(listContent(list), 'z');
    await waitFor(() => !page.shortcutProcessing);
    expect(moves.mock.calls.map(call => call[1])).toEqual([['8'], ['9']]);
  });

  it('keeps a key in an empty list from acting on an unrelated open reader', async () => {
    const { page, list } = await shownInbox();
    page.selectedMessage = page.messages[0];
    await page.updateComplete;
    await list.updateComplete;
    await listed(page, []);
    const flags = vi.spyOn(messageOperations, 'setFlag').mockResolvedValue({ ok: true });
    const moves = vi.spyOn(messageOperations, 'moveMessages').mockResolvedValue({ success: true });

    expect(press(listContent(list), 'q').defaultPrevented).toBe(false);
    expect(press(listContent(list), 'z').defaultPrevented).toBe(false);
    expect(flags).not.toHaveBeenCalled();
    expect(moves).not.toHaveBeenCalled();
    expect(page.selectedMessage.UID).toBe('9');
  });

  it('aligns an uninitialized cursor when the open message is listed later', async () => {
    const { page, list } = await shownInbox();
    await listed(page, []);
    page.selectedMessage = message(9);
    await page.updateComplete;
    await list.updateComplete;
    expect(focused(list)).toEqual([]);

    await listed(page, [message(9), message(8)]);
    expect(focused(list)).toEqual(['message 9']);
  });

  it('archives the open conversation only from the viewed folder, as its toolbar does', async () => {
    const { page, list } = await shownInbox();
    await listed(page, [{ ...message(9), ThreadCount: 3,
      SubMessages: [message(4), { ...message(3), Mailbox: 'Sent' }] }, message(8)]);
    page.selectedMessage = page.messages[0];
    await page.updateComplete;
    const reader = shadow<El>(page, 'alps-message-reader');
    await reader.updateComplete;
    await waitFor(() => !reader.loading, 'the reader response');
    const moves = vi.spyOn(messageOperations, 'moveMessages').mockResolvedValue({ success: true });
    press(listContent(list), 'ArrowDown');

    press(reader, 'z');
    await waitFor(() => !page.shortcutProcessing);
    expect(moves).toHaveBeenCalledExactlyOnceWith('INBOX', ['9', '4'], 'Archive');
    expect(page.selectedMessage).toBeNull();
  });

  it('leaves typing, modifiers, IME, repeats, disabled shortcuts and stale rows alone', async () => {
    const { page, list } = await shownInbox();
    page.selectedKeys = new Set(inInbox(9));
    const flags = vi.spyOn(messageOperations, 'setFlag').mockResolvedValue({ ok: true });
    const field = document.createElement('input');
    listContent(list).append(field);
    expect(press(field, 'q').defaultPrevented).toBe(false);
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true },
      { repeat: true }, { isComposing: true }, { keyCode: 229 }]) {
      expect(press(document.body, 'q', init).defaultPrevented).toBe(false);
    }
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', '');
    const child = document.createElement('span');
    editable.append(child);
    document.body.append(editable);
    expect(press(child, 'q').defaultPrevented).toBe(false);

    page.settingsStore.getState().keyboardShortcuts = false;
    expect(press(document.body, 'q').defaultPrevented).toBe(false);
    page.settingsStore.getState().keyboardShortcuts = true;
    page.loadingMessages = true;
    expect(press(document.body, 'q').defaultPrevented).toBe(false);
    page.loadingMessages = false;
    page.listedMailbox = 'Old';
    expect(press(document.body, 'q').defaultPrevented).toBe(false);
    page.listedMailbox = 'INBOX';
    window.history.replaceState(null, '', '#/settings/general');
    expect(press(document.body, 'q').defaultPrevented).toBe(false);
    await flush();
    expect(flags).not.toHaveBeenCalled();
  });

  it('does not archive in Archive, Trash or Drafts, identified by role', async () => {
    const { page } = await shownInbox();
    page.selectedKeys = new Set(inInbox(9));
    const moves = vi.spyOn(messageOperations, 'moveMessages').mockResolvedValue({ success: true });
    for (const role of ['Archive', 'Trash', 'Drafts']) {
      page.currentMailbox = page.listedMailbox = 'Special';
      page.mailboxes = [{ Name: 'Special', Attrs: [`\\${role}`] }];
      expect(press(document.body, 'z').defaultPrevented).toBe(false);
    }
    expect(moves).not.toHaveBeenCalled();
  });

  it('waits until the reader shows the newly opened message', async () => {
    const { page } = await shownInbox();
    const flags = vi.spyOn(messageOperations, 'setFlag').mockResolvedValue({ ok: true });
    page.selectedMessage = page.messages[0];
    expect(press(document.body, 'q').defaultPrevented).toBe(false);
    expect(flags).not.toHaveBeenCalled();
    await page.updateComplete;
  });

  it('does not queue a second action while a shortcut write is pending', async () => {
    const { page } = await shownInbox();
    page.selectedKeys = new Set(inInbox(9));
    let finish!: (result: { ok: true }) => void;
    const flags = vi.spyOn(messageOperations, 'setFlag').mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const moves = vi.spyOn(messageOperations, 'moveMessages').mockResolvedValue({ success: true });
    press(document.body, 'q');
    expect(press(document.body, 'q').defaultPrevented).toBe(false);
    expect(press(document.body, 'z').defaultPrevented).toBe(false);
    finish({ ok: true });
    await waitFor(() => !page.shortcutProcessing);
    expect(flags).toHaveBeenCalledTimes(1);
    expect(moves).not.toHaveBeenCalled();
  });

  it('reports a refused read write and keeps the row unread', async () => {
    const { page, list } = await shownInbox();
    await listed(page, [unread(9), message(8)]);
    vi.spyOn(messageOperations, 'setFlag').mockResolvedValue({ ok: false, reason: 'failed' });
    const toasts = record<CustomEvent>(window, 'show-toast');
    press(document.body, 'ArrowDown');
    press(listContent(list), 'q');
    await waitFor(() => !page.shortcutProcessing);
    expect(page.messages[0].Flags).toEqual([]);
    expect(toasts.at(-1)!.detail).toMatchObject({ message: 'toast.flagChangeFailed', type: 'error' });
  });

  it('restores a cursor row when archiving is refused', async () => {
    const { page, list } = await shownInbox();
    vi.spyOn(messageOperations, 'moveMessages').mockResolvedValue({ success: false, reason: 'failed' });
    const toasts = record<CustomEvent>(window, 'show-toast');
    press(document.body, 'ArrowDown');
    press(listContent(list), 'z');
    await waitFor(() => !page.shortcutProcessing);
    expect(page.messages.map((msg: any) => msg.UID)).toEqual(['9', '8']);
    expect(toasts.at(-1)!.detail).toMatchObject({ message: 'toast.moveFailed', type: 'error' });
  });
});

async function shownInbox(): Promise<{ page: El; list: El }> {
  const page = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
  await waitFor(() => page.messages?.length > 0 && !page.isSyncing, 'the first listing');
  const list = shadow<El>(page, 'alps-message-list');
  await list.updateComplete;
  return { page, list };
}

const focused = (list: El) => shadowAll(list, '.message-item.focused').map(r => r.querySelector('.message-subject')?.textContent?.trim());

function press(target: EventTarget, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('an arrow key with nothing focused', () => {
  it('lands on the first row, and the next one on the row after it', async () => {
    const { list } = await shownInbox();

    expect(press(document.body, 'ArrowDown').defaultPrevented).toBe(true);
    await list.updateComplete;
    expect(focused(list)).toEqual(['message 9']);

    // Focus is in the list now: the list hears the key itself.
    press(list.shadowRoot!.activeElement!, 'ArrowDown');
    await list.updateComplete;
    expect(focused(list)).toEqual(['message 8']);
  });

  it("is passed on from a folder's name in the sidebar, where opening a folder leaves the focus", async () => {
    const { page, list } = await shownInbox();
    const folders = shadow<El>(page, 'alps-folder-list');
    const inbox = shadow<HTMLElement>(folders, '.folder-item .folder-name');
    expect(inbox.getAttribute('role')).toBe('button');

    expect(press(inbox, 'ArrowDown').defaultPrevented).toBe(true);
    await list.updateComplete;
    expect(focused(list)).toEqual(['message 9']);
  });

  it('is left alone when it comes from a field, or with a modifier', async () => {
    const { list } = await shownInbox();
    const field = document.createElement('input');
    document.body.appendChild(field);

    expect(press(field, 'ArrowDown').defaultPrevented).toBe(false);
    expect(press(document.body, 'ArrowDown', { shiftKey: true }).defaultPrevented).toBe(false);
    await list.updateComplete;
    expect(focused(list)).toEqual([]);
  });
});
