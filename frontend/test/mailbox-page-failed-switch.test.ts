/**
 * A folder, a page or a search that failed to load says so.
 *
 * The rows on screen are left up, dimmed, while another view loads, so the
 * switch does not flash empty. When that read failed, the dim was lifted and
 * the rows stayed: the previous folder's or page's messages, undimmed, under
 * the new folder's name and address, with no error and nothing to retry. The
 * list only says a load failed when it has no rows, and it still had the old
 * ones.
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
    messagesPerPage: 2,
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

const MAILBOXES = [
  { Name: 'INBOX', Total: 4, Unseen: 0, Attributes: [] },
  { Name: 'Sent', Total: 1, Unseen: 0, Attributes: ['\\Sent'] },
  { Name: 'Drafts', Total: 1, Unseen: 0, Attributes: ['\\Drafts'] },
];

const message = (uid: number) => ({
  UID: String(uid),
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.test' }], To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

/** Every listing the page asked for, in order. */
let listings: string[] = [];

/**
 * The Inbox's first page answers; any other listing fails. The failure is an
 * answer that is not the JSON it claims, which fails once and at once:
 * `fetchWithTimeout` replays a dropped connection for over a second.
 */
function onlyTheInboxAnswers() {
  listings = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.includes('/status') || url.includes('/verdicts')) return new Response('{}', { status: 200 });
    if (url.startsWith('/mailboxes/')) listings.push(url);
    if (url.startsWith('/mailboxes/INBOX?page=0') && !url.includes('query=')) {
      return new Response(JSON.stringify({
        Username: 'ada@example.com',
        Page: 0,
        Total: 4,
        MessagesPerPage: 2,
        Mailboxes: MAILBOXES,
        Messages: [message(9), message(8)],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.startsWith('/mailboxes/')) {
      return new Response('{"Messages":', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('{}', { status: 404 });
  }));
}

const subjects = (el: El) => {
  const list = shadow<El>(el, 'alps-message-list');
  return shadowAll(list, '.message-item .message-subject').map((node) => node.textContent?.trim());
};

/** A mounted page showing the Inbox's first page. */
async function shownInbox(): Promise<El> {
  const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
  await waitFor(() => !!el.shadowRoot?.querySelector('alps-message-list') && el.messages?.length > 0 && !el.isSyncing, 'the first listing');
  await el.updateComplete;
  expect(subjects(el)).toEqual(['message 9', 'message 8']);
  return el;
}

/**
 * Goes to `hash` and waits for its read to fail.
 *
 * Waited for by what lasts: the request, as the stub saw it, and then the
 * failure. Not the dim between them, which the page holds for 200ms only when
 * the read is quicker than that. A read that took longer, on a loaded
 * machine, raised and lowered it between two checks, and a wait for it never
 * ended.
 */
async function failedSwitch(el: El, hash: string) {
  const asked = listings.length;
  location.hash = hash;
  await waitFor(() => listings.length > asked, 'the read to be sent');
  await waitFor(() => !el.loadingMessages && el.listLoadFailed, 'the read to fail');
  await el.updateComplete;
  const list = shadow<El>(el, 'alps-message-list');
  await list.updateComplete;
  return list;
}

beforeEach(() => {
  history.replaceState(null, '', '#/mailbox/INBOX');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  onlyTheInboxAnswers();
});

afterEach(() => {
  messageSync.stop();
  cleanup();
  history.replaceState(null, '', '#/mailbox/INBOX');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('a view that failed to load', () => {
  it.each([
    ['another folder', '#/mailbox/Sent'],
    ['another page', '#/mailbox/INBOX?p=1'],
    ['a search', '#/mailbox/INBOX?q=report'],
  ])('is %s that says it could not be read, not the rows before it', async (_what, hash) => {
    const el = await shownInbox();

    const list = await failedSwitch(el, hash);

    expect(subjects(el)).toEqual([]);
    expect(shadowAll(list, '.empty-state.load-error')).toHaveLength(1);
    expect(shadowAll(list, '.list-content.loading-overlay')).toHaveLength(0);
  });

  it('is read again on Try again', async () => {
    const el = await shownInbox();
    const list = await failedSwitch(el, '#/mailbox/Sent');
    const reads: string[] = [];
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      reads.push(url);
      return new Response('{"Messages":', { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    shadow<HTMLElement>(list, '.empty-state.load-error alps-button').click();
    await waitFor(() => reads.some((url) => url.startsWith('/mailboxes/Sent?')), 'the read again');
  });

  // Try again is the check-for-new button's event, and that one turns back to
  // the first page, where new mail is. After a failed page change it listed
  // page 0 under the address of the page that failed, and Next, which asks for
  // that address, then changed nothing.
  it('is the page that failed, read again on Try again', async () => {
    const el = await shownInbox();
    const list = await failedSwitch(el, '#/mailbox/INBOX?p=1');
    const reads: string[] = [];
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      if (url.includes('/status') || url.includes('/verdicts')) return new Response('{}', { status: 200 });
      reads.push(url);
      const page = url.startsWith('/mailboxes/INBOX?page=1') ? 1 : 0;
      return new Response(JSON.stringify({
        Username: 'ada@example.com',
        Page: page,
        Total: 4,
        MessagesPerPage: 2,
        Mailboxes: MAILBOXES,
        Messages: page === 1 ? [message(7), message(6)] : [message(9), message(8)],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    shadow<HTMLElement>(list, '.empty-state.load-error alps-button').click();
    await waitFor(() => reads.length > 0 && !el.loadingMessages && el.messages?.length > 0, 'the read again');
    await el.updateComplete;

    expect(reads).toEqual(['/mailboxes/INBOX?page=1&refresh=true']);
    expect(location.hash).toBe('#/mailbox/INBOX?p=1');
    expect(subjects(el)).toEqual(['message 7', 'message 6']);
  });

  // A draft saved while Drafts could not be read matched no row, and was put
  // in as one: the error went, and the folder looked as if it held only that
  // draft.
  it('still says so after a draft is saved into it', async () => {
    const el = await shownInbox();
    const list = await failedSwitch(el, '#/mailbox/Drafts');

    window.dispatchEvent(new CustomEvent('draft-autosaved', {
      detail: { oldUid: null, oldMailbox: null, newUid: 31, mailbox: 'Drafts', subject: 'Plans', hasAttachments: false, size: 120 },
    }));
    await el.updateComplete;
    await list.updateComplete;

    expect(subjects(el)).toEqual([]);
    expect(shadowAll(list, '.empty-state.load-error')).toHaveLength(1);
  });
});

describe('a re-read of the view on screen that fails', () => {
  it('leaves its rows, which are still that view\'s', async () => {
    const el = await shownInbox();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"Messages":', { status: 200, headers: { 'Content-Type': 'application/json' } })));

    messageSync.fetch('INBOX', 0, '', false);
    await waitFor(() => !el.loadingMessages && el.listLoadFailed, 'the read to fail');
    await el.updateComplete;

    expect(subjects(el)).toEqual(['message 9', 'message 8']);
  });

  it('leaves a search\'s rows, which are still that search\'s', async () => {
    const el = await shownInbox();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/status') || url.includes('/verdicts')) return new Response('{}', { status: 200 });
      if (url.startsWith('/mailboxes/INBOX?page=0&query=report')) {
        return new Response(JSON.stringify({
          Username: 'ada@example.com', Page: 0, Total: 1, MessagesPerPage: 2, Mailboxes: MAILBOXES,
          Messages: [message(7)],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{"Messages":', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
    location.hash = '#/mailbox/INBOX?q=report';
    await waitFor(() => el.filterQuery === 'report' && !el.loadingMessages && !el.isSyncing && el.messages?.length === 1, 'the search');
    await el.updateComplete;
    expect(subjects(el)).toEqual(['message 7']);

    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"Messages":', { status: 200, headers: { 'Content-Type': 'application/json' } })));
    messageSync.fetch('INBOX', 0, 'report', false);
    await waitFor(() => !el.loadingMessages && el.listLoadFailed, 'the read to fail');
    await el.updateComplete;

    expect(subjects(el)).toEqual(['message 7']);
  });
});
