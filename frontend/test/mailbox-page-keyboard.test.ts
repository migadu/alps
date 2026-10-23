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
import { cleanup, mount, shadow, shadowAll, waitFor } from './helpers/dom';
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
    showSenderAvatars: false,
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
