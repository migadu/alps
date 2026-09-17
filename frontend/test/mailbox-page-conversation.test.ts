/**
 * What the mail page does with a gesture from an open conversation.
 *
 * Two operands reach it from the reader besides its own (the checked rows, or
 * the open message). The conversation toolbar names every message of the
 * conversation in the folder being viewed, and a card's own menu names one
 * message together with its folder, because a conversation shows replies from
 * Sent and a UID means nothing outside its folder.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/mailbox-page';
import type { ReaderActionDetail } from '../src/components/message-reader';
import { messageSync } from '../src/services/message-sync';
import { cleanup, flush, mount, record, waitFor } from './helpers/dom';
import { messageKey } from '../src/utils/message-key';

type El = HTMLElement & Record<string, any>;

const SEEN = '\\Seen';

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

type Request = { url: string; method: string; body: any };
let requests: Request[] = [];
/** What the next move answers, by UID. */
let moveMapping: (uids: string[]) => Record<string, string> = (uids) =>
  Object.fromEntries(uids.map(uid => [uid, String(Number(uid) + 100)]));
let moveStatus = 200;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  // Every write ends in a re-read of the list, which is not what these tests
  // are about — and against this stub it answers "no such mailbox".
  vi.spyOn(messageSync, 'sync').mockImplementation(() => {});
  requests = [];
  moveStatus = 200;
  moveMapping = (uids) => Object.fromEntries(uids.map(uid => [uid, String(Number(uid) + 100)]));
  history.replaceState(null, '', '/#/mailbox/INBOX');
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    const u = String(url);
    const method = init.method || 'GET';
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    requests.push({ url: u, method, body });
    if (u.endsWith('/messages/move')) {
      return moveStatus === 200 ? json({ uidMapping: moveMapping(body.uids) }) : json({ error: 'nope' }, moveStatus);
    }
    if (u.endsWith('/messages/flag')) return json({ ok: true });
    if (method === 'DELETE') return json({ ok: true });
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// Read, both: the page's reader marks an unread message read as it opens it,
// and that write is not what these tests are about. Built fresh for every
// test, because the page changes the open message's flags in place.
let open: Record<string, any>;
const conversationRow = () => ({ UID: 5, Mailbox: 'INBOX', Flags: [SEEN], Envelope: { Subject: 'Engines' }, SubMessages: [open] });

async function page(mailbox = 'INBOX'): Promise<El> {
  open = { UID: 9, Mailbox: 'INBOX', Flags: [SEEN], Envelope: { Subject: 'Re: Engines' } };
  const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
  await waitFor(() => !!el.shadowRoot?.querySelector('alps-message-reader'), 'the reader');
  Object.assign(el, {
    currentMailbox: mailbox,
    mailboxes: MAILBOXES,
    messages: [conversationRow()],
    selectedMessage: open,
    selectedKeys: new Set(),
  });
  await el.updateComplete;
  requests = [];
  return el;
}

async function act(el: El, detail: ReaderActionDetail) {
  await el._handleReaderAction(new CustomEvent('action', { detail }));
  await flush();
}

const writes = () => requests.filter(r => r.method !== 'GET');

/** Where the page navigates. Recorded rather than followed: the stub cannot
 * serve the message a navigation opens, and the page would then go back to the
 * list on its own. */
function navigations(el: El): (string | null)[] {
  const seen: (string | null)[] = [];
  vi.spyOn(el, 'updateUrl').mockImplementation((...args: unknown[]) => { seen.push(args[2] as string | null); });
  return seen;
}

describe('the conversation toolbar\'s gestures', () => {
  it('file every message the reader names, and say how many', async () => {
    const el = await page();
    const toasts = record<CustomEvent>(window, 'show-toast');

    await act(el, { action: 'archive', uids: ['5', '9'] });

    expect(writes()).toEqual([
      { url: '/mailboxes/INBOX/messages/move', method: 'PUT', body: { uids: ['5', '9'], to: 'Archive' } },
    ]);
    expect(toasts.at(-1)!.detail.message).toBe('toast.messagesMovedToArchive');
    expect(el.selectedMessage).toBeNull();
  });

  it('undo all of it, and reopen the message that was being read', async () => {
    const el = await page();
    const toasts = record<CustomEvent>(window, 'show-toast');
    const went = navigations(el);
    await act(el, { action: 'delete', uids: ['5', '9'] });

    await toasts.at(-1)!.detail.actionFn();
    await flush();

    expect(writes().at(-1)).toEqual({
      url: '/mailboxes/Trash/messages/move', method: 'PUT', body: { uids: ['105', '109'], to: 'INBOX' },
    });
    expect(went).toEqual([null, '209']);
  });

  it('tag every message the reader names', async () => {
    const el = await page();

    await act(el, { action: 'addTag', folder: '$label1', uids: ['5', '9'] });

    expect(writes()).toEqual([{
      url: '/mailboxes/INBOX/messages/flag', method: 'PUT', body: { uids: ['5', '9'], flags: ['$label1'], action: 'add' },
    }]);
  });

  it('ask before deleting a conversation in Trash for good, as several messages', async () => {
    const el = await page('Trash');

    await act(el, { action: 'delete', uids: ['5', '9'] });
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('ui-confirm')!.getAttribute('message')).toBe('messageReader.deleteConfirmMultiple');
    expect(writes()).toEqual([]);

    await el._confirmDelete();
    expect(writes()).toEqual([{ url: '/mailboxes/Trash/messages', method: 'DELETE', body: { uids: ['5', '9'] } }]);
  });

  it('leave a gesture without names on the open message, as before', async () => {
    const el = await page();

    await act(el, { action: 'archive' });

    expect(writes()[0].body).toEqual({ uids: ['9'], to: 'Archive' });
  });
});

describe('a card\'s own verbs', () => {
  it('download the named message from its own folder', async () => {
    const el = await page();
    const hrefs: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      hrefs.push(this.getAttribute('href') ?? '');
    });

    await act(el, { action: 'downloadMessage', uid: '7', mailbox: 'Sent' });

    expect(hrefs).toEqual(['/mailboxes/Sent/messages/7/raw']);
  });

  it('show the original of the named message', async () => {
    const el = await page();
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);

    await act(el, { action: 'showOriginal', uid: '7', mailbox: 'Sent' });

    expect(opened).toHaveBeenCalledWith('#/original?mailbox=Sent&uid=7', '_blank');
  });

  it('mark the named message unread, and go back to the list', async () => {
    const el = await page();

    await act(el, { action: 'markUnread', uid: '5', mailbox: 'INBOX' });

    expect(writes()).toEqual([{
      url: '/mailboxes/INBOX/messages/flag', method: 'PUT', body: { uids: ['5'], flags: [SEEN], action: 'remove' },
    }]);
    expect(el.selectedMessage).toBeNull();
  });

  describe('Delete', () => {
    it('moves the named message to Trash, says so, and keeps the conversation open', async () => {
      const el = await page();
      const toasts = record<CustomEvent>(window, 'show-toast');
      const done = vi.fn();

      await act(el, { action: 'delete', uid: '5', mailbox: 'INBOX', done });

      expect(writes()).toEqual([{ url: '/mailboxes/INBOX/messages/move', method: 'PUT', body: { uids: ['5'], to: 'Trash' } }]);
      expect(done).toHaveBeenCalledWith(true);
      expect(el.selectedMessage).toBe(open);
      expect(toasts.at(-1)!.detail.message).toBe('toast.messageMovedToTrash');
    });

    it('beats a checked row: the card names what it deletes', async () => {
      const el = await page();
      el.selectedKeys = new Set([messageKey('INBOX', '42')]);

      await act(el, { action: 'delete', uid: '5', mailbox: 'INBOX', done: vi.fn() });

      expect(writes()[0].body).toEqual({ uids: ['5'], to: 'Trash' });
    });

    it('moves a reply from Sent out of Sent', async () => {
      const el = await page();

      await act(el, { action: 'delete', uid: '7', mailbox: 'Sent', done: vi.fn() });

      expect(writes()[0].url).toBe('/mailboxes/Sent/messages/move');
    });

    it('undoes into the conversation on screen, which is read again', async () => {
      const el = await page();
      const toasts = record<CustomEvent>(window, 'show-toast');
      const reader = el.shadowRoot!.querySelector('alps-message-reader') as El;
      const reload = vi.spyOn(reader, 'reloadConversation').mockImplementation(() => {});
      await act(el, { action: 'delete', uid: '7', mailbox: 'Sent', done: vi.fn() });

      await toasts.at(-1)!.detail.actionFn();
      await flush();

      expect(writes().at(-1)).toEqual({ url: '/mailboxes/Trash/messages/move', method: 'PUT', body: { uids: ['107'], to: 'Sent' } });
      expect(reload).toHaveBeenCalled();
    });

    it('stays on the conversation when the message being read goes', async () => {
      const el = await page();
      const went = navigations(el);

      await act(el, { action: 'delete', uid: '9', mailbox: 'INBOX', nextUid: '5', done: vi.fn() });

      expect(went).toEqual(['5']);
    });

    it('goes back to the list when nothing of the conversation is left here', async () => {
      const el = await page();

      await act(el, { action: 'delete', uid: '9', mailbox: 'INBOX', done: vi.fn() });

      expect(el.selectedMessage).toBeNull();
    });

    it('says when it did not happen, and leaves the card', async () => {
      const el = await page();
      const toasts = record<CustomEvent>(window, 'show-toast');
      const done = vi.fn();
      moveStatus = 500;

      await act(el, { action: 'delete', uid: '5', mailbox: 'INBOX', done });

      expect(done).toHaveBeenCalledWith(false);
      expect(toasts.at(-1)!.detail.message).toBe('toast.moveFailed');
    });

    it('asks first where a move to Trash would change nothing, and deletes from that folder', async () => {
      const el = await page('Trash');
      const done = vi.fn();

      await act(el, { action: 'delete', uid: '5', mailbox: 'Trash', done });
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('ui-confirm')!.getAttribute('message')).toBe('messageReader.deleteConfirmSingle');
      expect(done).not.toHaveBeenCalled();

      await el._confirmDelete();

      expect(writes()).toEqual([{ url: '/mailboxes/Trash/messages', method: 'DELETE', body: { uids: ['5'] } }]);
      expect(done).toHaveBeenCalledWith(true);
      expect(el.selectedMessage).toBe(open);
    });
  });
});

describe('a flag change the reader reports', () => {
  it('reaches a thread\'s other rows, which the list draws on their own', async () => {
    const el = await page();
    const told = record<CustomEvent>(window, 'external-message-flags-changed');

    el.updateLocalMessageFlags([messageKey('INBOX', '9')], SEEN, 'remove');

    expect(el.messages[0].SubMessages[0].Flags).not.toContain(SEEN);
    expect(el.messages[0].Flags).toEqual([SEEN]);
    expect(told).toHaveLength(1);
  });
});

describe('a checked thread row', () => {
  // The list checks a collapsed thread as every message in it: the row's own
  // (5) and the one filed under it (9).
  async function checked(flags: { row: string[]; under: string[] }, uids = ['5', '9']): Promise<El> {
    const el = await page();
    Object.assign(el, {
      messages: [{ ...conversationRow(), Flags: flags.row, SubMessages: [{ ...open, Flags: flags.under }] }],
      selectedMessage: null,
      selectedKeys: new Set(uids.map(uid => messageKey('INBOX', uid))),
    });
    await el.updateComplete;
    requests = [];
    return el;
  }

  it('is unread while any of it is, so the selection bar offers to mark it read', async () => {
    const el = await checked({ row: [SEEN], under: [] });

    expect(el.allSelectedUnread).toBe(true);

    await act(el, { action: 'markUnread' });

    expect(writes()).toEqual([
      { url: '/mailboxes/INBOX/messages/flag', method: 'PUT', body: expect.objectContaining({ uids: ['5', '9'], action: 'add' }) },
    ]);
    expect(el.messages[0].SubMessages[0].Flags).toContain(SEEN);
  });

  it('is read when all of it is', async () => {
    const el = await checked({ row: [SEEN], under: [SEEN] });

    expect(el.allSelectedUnread).toBe(false);
  });

  it('does not make a read row beside it unread', async () => {
    const el = await checked({ row: [SEEN], under: [] });
    el.messages = [...el.messages, { UID: 12, Mailbox: 'INBOX', Flags: [SEEN], Envelope: { Subject: 'Alone' } }];
    el.selectedKeys = new Set(['5', '9', '12'].map(uid => messageKey('INBOX', uid)));

    expect(el.allSelectedUnread).toBe(false);
  });

  it('is starred, and tagged, only when every message in it is', async () => {
    const partly = await checked({ row: [SEEN, '\\Flagged', '$label1'], under: [SEEN] });
    expect(partly.allSelectedStarred).toBe(false);
    expect(partly.commonSelectedTags).toEqual([]);

    const wholly = await checked({ row: [SEEN, '\\Flagged', '$label1'], under: [SEEN, '\\Flagged', '$label1'] });
    expect(wholly.allSelectedStarred).toBe(true);
    expect(wholly.commonSelectedTags).toEqual(['$label1']);
  });

  it('is filed whole', async () => {
    const el = await checked({ row: [SEEN], under: [SEEN] });
    const toasts = record<CustomEvent>(window, 'show-toast');

    await act(el, { action: 'archive' });

    expect(writes()).toEqual([
      { url: '/mailboxes/INBOX/messages/move', method: 'PUT', body: { uids: ['5', '9'], to: 'Archive' } },
    ]);
    expect(toasts.at(-1)!.detail.message).toBe('toast.messagesMovedToArchive');
    expect(el.selectedKeys.size).toBe(0);
  });
});
