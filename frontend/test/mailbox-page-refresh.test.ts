/**
 * The reads that are not navigations: the check-for-new-mail button, and the
 * re-read that follows a move or a delete.
 *
 * Both were the same foreground read a folder switch does. Every row faded to
 * half opacity for at least 200ms, and every row was then re-rendered from a
 * freshly parsed answer, whether or not anything in the folder had moved. The
 * check asks the way the poll asks now — counts first, the page only after —
 * and the re-read after a write announces itself quietly; neither repaints a
 * listing that came back the same.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/mailbox-page';
import { cleanup, mount, shadow, update, waitFor } from './helpers/dom';
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

const message = (uid: number) => ({
  UID: String(uid),
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.test' }], To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

let urls: string[];

/** The reads the check is about: the sender verdicts the list asks for on its own are not one. */
const listingReads = () => urls.filter((url) => !url.includes('/verdicts'));

/** A mailbox whose counts never move, so the check has nothing to report. */
function quietMailbox(messages = [message(9), message(8)]) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    urls.push(url);
    if (url.includes('/status')) return new Response('{}', { status: 200 });
    if (url.startsWith('/mailboxes/')) {
      return new Response(JSON.stringify({
        Username: 'ada@example.com',
        Page: 0,
        Total: messages.length,
        MessagesPerPage: 50,
        Mailboxes: [{ Name: 'INBOX', Total: messages.length, Unseen: 0 }],
        Messages: messages,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('{}', { status: 404 });
  }));
}

/**
 * A read that fails without a retry: `fetchWithTimeout` replays a dropped
 * connection over more than a second, which a test would only spend waiting.
 * An answer that is not the JSON it claims fails once, in the same place.
 */
function truncatedAnswer() {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    urls.push(url);
    if (url.includes('/status')) return new Response('{}', { status: 200 });
    return new Response('{"Messages":', { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
}

/** A mounted page showing the Inbox, with the first read landed. */
async function shownInbox(): Promise<El> {
  const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
  await waitFor(() => !!el.shadowRoot?.querySelector('alps-message-list') && el.messages?.length > 0 && !el.isSyncing, 'the first listing');
  urls = [];
  return el;
}

beforeEach(() => {
  urls = [];
  vi.spyOn(console, 'error').mockImplementation(() => {});
  quietMailbox();
});

afterEach(() => {
  messageSync.stop();
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('pressing check for new mail', () => {
  it('turns the chip without dimming the rows', async () => {
    const el = await shownInbox();
    const list = shadow<El>(el, 'alps-message-list');

    list.dispatchEvent(new CustomEvent('refresh'));
    expect(el.isSyncing).toBe(true);
    expect(el.loadingMessages).toBe(false);

    // Held all the way to the answer, not merely at the moment of the press.
    let dimmed = false;
    await waitFor(() => { dimmed ||= el.loadingMessages; return !el.isSyncing; }, 'the check to end');
    expect(dimmed).toBe(false);
  });

  it('asks the counts, and never re-lists the folder from IMAP', async () => {
    const el = await shownInbox();
    shadow<El>(el, 'alps-message-list').dispatchEvent(new CustomEvent('refresh'));
    await waitFor(() => !el.isSyncing, 'the check to end');
    expect(listingReads()).toEqual(['/mailboxes/INBOX/status', '/mailboxes/INBOX?page=0']);
  });

  it('ends the spin when the check fails, which a poll leaves turning', async () => {
    const el = await shownInbox();
    truncatedAnswer();

    shadow<El>(el, 'alps-message-list').dispatchEvent(new CustomEvent('refresh'));
    await waitFor(() => !el.isSyncing, 'the check to end');
    // The rows stand, as after any background failure, and nothing claims the
    // folder could not be read.
    expect(el.messages.length).toBe(2);
    expect(el.listLoadFailed).toBe(false);
  });

  it('is the foreground read again after a load that failed', async () => {
    truncatedAnswer();
    const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
    await waitFor(() => el.listLoadFailed, 'the failed load');

    urls = [];
    quietMailbox();
    shadow<El>(el, 'alps-message-list').dispatchEvent(new CustomEvent('refresh'));
    expect(el.loadingMessages).toBe(true);
    await waitFor(() => !el.isSyncing, 'the read to end');
    expect(listingReads()).toEqual(['/mailboxes/INBOX?page=0&refresh=true']);
  });
});

describe('the listing already on screen', () => {
  it('is kept, rows and all, when the answer came back the same', async () => {
    const el = await shownInbox();
    const shown = el.messages;

    shadow<El>(el, 'alps-message-list').dispatchEvent(new CustomEvent('refresh'));
    await waitFor(() => !el.isSyncing, 'the check to end');

    // The same array, so Lit re-renders no row: a freshly parsed copy of the
    // same mail is still a change to every row template.
    expect(el.messages).toBe(shown);
  });

  it('is kept for the open message too, whose flags did not move', async () => {
    const el = await shownInbox();
    await update(el, { selectedMessage: el.messages[0] });
    const open = el.selectedMessage;

    shadow<El>(el, 'alps-message-list').dispatchEvent(new CustomEvent('refresh'));
    await waitFor(() => !el.isSyncing, 'the check to end');

    expect(el.selectedMessage).toBe(open);
  });

  it('gives way to the answer when mail arrived', async () => {
    const el = await shownInbox();
    const shown = el.messages;
    quietMailbox([message(10), message(9), message(8)]);

    shadow<El>(el, 'alps-message-list').dispatchEvent(new CustomEvent('refresh'));
    await waitFor(() => !el.isSyncing, 'the check to end');

    expect(el.messages).not.toBe(shown);
    expect(el.messages.map((m: any) => m.UID)).toEqual(['10', '9', '8']);
  });

  it('gives way to a star set in another client, which moves no count', async () => {
    const el = await shownInbox();
    await update(el, { selectedMessage: el.messages[0] });
    const starred = { ...message(9), Flags: ['\\Seen', '\\Flagged'] };
    quietMailbox([starred, message(8)]);

    shadow<El>(el, 'alps-message-list').dispatchEvent(new CustomEvent('refresh'));
    await waitFor(() => !el.isSyncing, 'the check to end');

    expect(el.messages[0].Flags).toEqual(['\\Seen', '\\Flagged']);
    // The reader draws the star from the open message's own flags, so it is
    // handed the ones that moved.
    expect(el.selectedMessage.Flags).toEqual(['\\Seen', '\\Flagged']);
  });
});

describe('the re-read after a move or a delete', () => {
  it('reads the folder in full, and does not dim the rows for it', async () => {
    const el = await shownInbox();

    messageSync.sync();
    expect(el.isSyncing).toBe(true);
    expect(el.loadingMessages).toBe(false);

    let dimmed = false;
    await waitFor(() => { dimmed ||= el.loadingMessages; return !el.isSyncing; }, 'the sync to end');
    expect(dimmed).toBe(false);
    // In full: a write elsewhere moves counts on folders the probe never asks
    // about, and they are drawn from this answer's mailbox list.
    expect(listingReads()).toEqual(['/mailboxes/INBOX?page=0&refresh=true']);
  });

  it('lands on the page being viewed, not only on the first', async () => {
    const el = await shownInbox();
    await update(el, { currentPage: 2 });
    messageSync.setContext('INBOX', 2, '');
    quietMailbox([message(10)]);

    messageSync.sync();
    await waitFor(() => !el.isSyncing, 'the sync to end');

    expect(el.messages.map((m: any) => m.UID)).toEqual(['10']);
  });
});
