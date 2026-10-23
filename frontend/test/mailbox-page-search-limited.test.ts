/**
 * A search the mail server refused for its rate limit says so.
 *
 * Sora refuses searches with NO [LIMIT] once the account's search budget is
 * used up, and the server answers such a search with 429. The page said what
 * it says of any failed read, "Could not load this folder", of a folder it
 * had just shown, as if something were broken: the server only asked to slow
 * down. It says that now, with Try again as before.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/mailbox-page';
import { ContextProvider } from '@lit/context';
import { cleanup, shadow, shadowAll, waitFor } from './helpers/dom';
import { messageSync } from '../src/services/message-sync';
import { i18nContext, type I18nStore } from '../src/store/i18n-store';

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
 * The Inbox's first page answers; a search for "report" is refused for the
 * rate limit, and any other listing fails with a 500.
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
    if (url.includes('query=report')) {
      return new Response(JSON.stringify({ error: 'search_rate_limited', retry_after: 42 }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '42' },
      });
    }
    if (url.startsWith('/mailboxes/')) {
      return new Response('{"error":"An internal error occurred"}', { status: 500, headers: { 'Content-Type': 'application/json' } });
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
  // The list takes its dictionary from the context, as under the app's root.
  const root = document.createElement('div');
  new ContextProvider(root, { context: i18nContext, initialValue: i18nStore as unknown as I18nStore });
  document.body.appendChild(root);
  const el = document.createElement('mailbox-page') as El;
  Object.assign(el, { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
  root.appendChild(el);
  await el.updateComplete;
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

describe('a search refused for the rate limit', () => {
  it('says the mail server is limiting searches, not that the folder could not be loaded', async () => {
    const el = await shownInbox();
    const list = await failedSwitch(el, '#/mailbox/INBOX?q=report');

    expect(shadow<HTMLElement>(list, '.empty-state.load-error > div').textContent?.trim()).toBe('messageList.searchLimited');
    // Try again is still offered.
    expect(shadowAll(list, '.empty-state.load-error alps-button')).toHaveLength(1);
  });

  it('leaves any other failure said as one', async () => {
    const el = await shownInbox();
    const list = await failedSwitch(el, '#/mailbox/Sent');

    expect(shadow<HTMLElement>(list, '.empty-state.load-error > div').textContent?.trim()).toBe('messageList.loadError');
  });
});
