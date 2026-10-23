/**
 * Going back to a folder shows what it held at once, from memory, while the
 * server is asked again.
 *
 * Every folder switch waited for the server, and dimmed the rows it was about
 * to replace for at least 200ms, even when the server answered from its own
 * cache: the browser kept nothing but the view on screen.
 */
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import '../src/pages/mailbox-page';
import { cleanup, flush, mount, waitFor } from './helpers/dom';
import { messageSync } from '../src/services/message-sync';
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
  };
  return Object.assign(new EventTarget(), {
    getState: () => state,
    updateSettings: async (updates: Record<string, unknown>) => {
      Object.assign(state, updates);
    },
  });
}

const message = (mailbox: string, uid: number) => ({
  UID: String(uid),
  Mailbox: mailbox,
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.test' }], To: [], Cc: [], Subject: `${mailbox} ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

/** What the server holds. The writes change it, and a listing reads it as it is sent. */
let server: Record<string, any[]>;

let listings: string[];
/** While set, the next listing of this folder is held until `release` is called. */
let holdNext: string | null;
let release: () => void;
/**
 * The listing being held. The server reads a session's requests one at a
 * time, so a write sent meanwhile waits for it.
 */
let reading: Promise<void> | null;
/** A write held at the server; subsequent listings wait behind it. */
let writing: { pause: Promise<void>; release: () => void; refuse: boolean } | null;

function holdWrite(refuse: boolean): () => void {
  let release!: () => void;
  const pause = new Promise<void>((resolve) => { release = resolve; });
  writing = { pause, release, refuse };
  return release;
}

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  server = { INBOX: [message('INBOX', 9), message('INBOX', 8)], Archive: [message('Archive', 3)] };
  listings = [];
  holdNext = null;
  release = () => {};
  reading = null;
  writing = null;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    const u = new URL(String(url), 'http://alps.test');
    const write = u.pathname.match(/^\/mailboxes\/([^/]+)\/messages\/(flag|move)$/);
    if (write && init.method === 'PUT') {
      if (reading) await reading;
      if (writing) {
        const held = writing;
        await held.pause;
        if (writing === held) writing = null;
        if (held.refuse) return new Response(JSON.stringify({ error: 'refused' }), { status: 403 });
      }
      const mailbox = decodeURIComponent(decodeURIComponent(write[1]));
      const body = JSON.parse(String(init.body));
      const named = (m: any) => body.uids.includes(m.UID);
      if (write[2] === 'flag') {
        for (const m of server[mailbox].filter(named)) {
          m.Flags = body.action === 'add' ? [...m.Flags, ...body.flags] : m.Flags.filter((f: string) => !body.flags.includes(f));
        }
        return json({});
      }
      server[body.to] = [...(server[body.to] ?? []), ...server[mailbox].filter(named)];
      server[mailbox] = server[mailbox].filter((m) => !named(m));
      return json({ ok: true, uidMapping: {} });
    }
    const match = u.pathname.match(/^\/mailboxes\/([^/]+)$/);
    if (!match) return new Response('{}', { status: 200 });
    if (writing) await writing.pause;
    const mailbox = decodeURIComponent(decodeURIComponent(match[1]));
    listings.push(mailbox);
    const messages = JSON.parse(JSON.stringify(server[mailbox] ?? []));
    if (holdNext === mailbox) {
      holdNext = null;
      reading = new Promise<void>((r) => (release = () => { reading = null; r(); }));
      await reading;
    }
    return new Response(JSON.stringify({
      Username: 'ada@example.com',
      Page: 0,
      Total: messages.length,
      MessagesPerPage: 50,
      Mailboxes: [{ Name: 'INBOX', Total: 2, Unseen: 0 }, { Name: 'Archive', Total: 1, Unseen: 0 }],
      Messages: messages,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
});

afterEach(() => {
  // A listing a failed test left held would hold every listing after it.
  release();
  writing?.release();
  messageSync.stop();
  cleanup();
  window.dispatchEvent(new CustomEvent('session-cleared'));
  history.replaceState(null, '', '#/mailbox/INBOX');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function open(el: El, mailbox: string) {
  location.hash = `#/mailbox/${mailbox}`;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  await el.updateComplete;
}

const subjects = (el: El) => (el.messages ?? []).map((m: any) => m.Envelope.Subject);

describe('going back to a folder', () => {
  it('shows its rows at once, without dimming them, and asks the server again', async () => {
    history.replaceState(null, '', '#/mailbox/INBOX');
    const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
    await waitFor(() => subjects(el).length === 2 && !el.isSyncing, 'the Inbox');
    await open(el, 'Archive');
    await waitFor(() => subjects(el).join() === 'Archive 3' && !el.loadingMessages, 'Archive');

    holdNext = 'INBOX';
    server.INBOX = [message('INBOX', 10), ...server.INBOX];
    let dimmed = false;
    await open(el, 'INBOX');
    dimmed ||= el.loadingMessages;
    expect(subjects(el)).toEqual(['INBOX 9', 'INBOX 8']);
    await waitFor(() => listings.at(-1) === 'INBOX', 'the Inbox asked again');
    expect(subjects(el)).toEqual(['INBOX 9', 'INBOX 8']);

    release();
    await waitFor(() => { dimmed ||= el.loadingMessages; return subjects(el).length === 3; }, 'the answer');
    expect(subjects(el)).toEqual(['INBOX 10', 'INBOX 9', 'INBOX 8']);
    expect(dimmed).toBe(false);
    expect(listings).toEqual(['INBOX', 'Archive', 'INBOX']);
  });

  it('is not shown from memory once the order has changed', async () => {
    history.replaceState(null, '', '#/mailbox/INBOX');
    const settings = settingsStore();
    const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settings, composeStore: new EventTarget() });
    await waitFor(() => subjects(el).length === 2 && !el.isSyncing, 'the Inbox');
    await open(el, 'Archive');
    await waitFor(() => subjects(el).join() === 'Archive 3' && !el.loadingMessages, 'Archive');

    await settings.updateSettings({ sortOrder: 'asc' });
    settings.dispatchEvent(new Event('change'));
    await waitFor(() => !el.isSyncing, 'the settings applied');
    holdNext = 'INBOX';
    await open(el, 'INBOX');
    expect(subjects(el)).toEqual(['Archive 3']);
    release();
    await waitFor(() => subjects(el).length === 2, 'the Inbox read again');
  });

  it('reads the view on screen again, quietly, once a listing setting is saved', async () => {
    // Settings is a window over this page: the page is no longer torn down
    // and read again on the way back from it, so a change to threading or the
    // page size has to re-read the rows the page is showing. Not on the
    // change itself: the server lists by the account's record, which has the
    // new value only once the save has landed.
    history.replaceState(null, '', '#/mailbox/INBOX');
    const settings = settingsStore();
    const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settings, composeStore: new EventTarget() });
    await waitFor(() => subjects(el).length === 2 && !el.isSyncing, 'the Inbox');
    const before = listings.length;

    await settings.updateSettings({ enableThreading: false });
    settings.dispatchEvent(new Event('change'));
    await flush();
    await flush();
    expect(listings.slice(before)).toEqual([]);

    let dimmed = false;
    settings.dispatchEvent(new CustomEvent('saved', { detail: { keys: ['enableThreading'] } }));
    await waitFor(() => { dimmed ||= el.loadingMessages; return listings.length > before && !el.isSyncing; }, 'the Inbox read again');
    expect(listings.slice(before)).toEqual(['INBOX']);
    expect(dimmed).toBe(false);

    // A saved setting no listing is read under reads nothing.
    settings.dispatchEvent(new CustomEvent('saved', { detail: { keys: ['densityMode'] } }));
    await flush();
    await flush();
    expect(listings.slice(before)).toEqual(['INBOX']);
  });
});

/**
 * Shown from memory, a view's rows can be used at once, while its quiet
 * re-read is out. The server reads a write sent then after that listing, whose
 * answer shows the rows as they were before it.
 */
describe('a change to a view shown from memory, while it is read again', () => {
  it.each([false, true])('keeps removed rows out of cached views while a write is held, then reads its outcome (refused=%s)', async (refused) => {
    history.replaceState(null, '', '#/mailbox/INBOX');
    const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
    await waitFor(() => subjects(el).length === 2 && !el.isSyncing, 'the Inbox');
    await open(el, 'Archive');
    await waitFor(() => subjects(el).join() === 'Archive 3' && !el.isSyncing, 'Archive');
    await open(el, 'INBOX');
    await waitFor(() => subjects(el).length === 2 && !el.isSyncing, 'the Inbox read again');

    const finishWrite = holdWrite(refused);
    el.selectedKeys = new Set([messageKey('INBOX', '9')]);
    await el.updateComplete;
    const filing = el._handleReaderAction(new CustomEvent('action', { detail: { action: 'archive' } }));
    await flush();
    expect(subjects(el)).toEqual(['INBOX 8']);

    const kept: string[] = [];
    const note = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail.kept) kept.push(detail.data.ListedMailbox);
    };
    messageSync.addEventListener('sync-success', note);
    onTestFinished(() => messageSync.removeEventListener('sync-success', note));
    await open(el, 'Archive');
    await open(el, 'INBOX');
    // Both server reads wait behind the write. The removed row must not be
    // published from memory during either navigation.
    expect(kept).toEqual([]);
    expect(subjects(el)).toEqual(['INBOX 8']);

    finishWrite();
    await filing;
    const expected = refused ? ['INBOX 9', 'INBOX 8'] : ['INBOX 8'];
    await waitFor(() => !el.isSyncing && subjects(el).join() === expected.join(), 'the final listing, including a refused row');
    expect(server.INBOX.map((m) => m.Envelope.Subject)).toEqual(expected);
    expect(listings.filter((mailbox) => mailbox === 'INBOX').length).toBeGreaterThanOrEqual(3);
  });

  async function inboxFromMemory(): Promise<El> {
    history.replaceState(null, '', '#/mailbox/INBOX');
    const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
    await waitFor(() => subjects(el).length === 2 && !el.isSyncing, 'the Inbox');
    await open(el, 'Archive');
    await waitFor(() => subjects(el).join() === 'Archive 3' && !el.loadingMessages, 'Archive');
    holdNext = 'INBOX';
    await open(el, 'INBOX');
    expect(subjects(el)).toEqual(['INBOX 9', 'INBOX 8']);
    await waitFor(() => !!reading, 'the Inbox asked again');
    return el;
  }

  it('keeps a star set then, on screen and in the view kept', async () => {
    const el = await inboxFromMemory();
    const row = el.messages[0];
    const star = el._handleListToggleStar(new CustomEvent('toggle-star-message', { detail: { message: row, messages: [row] } }));
    await flush();
    expect(el.messages[0].Flags).toContain('\\Flagged');

    release();
    await star;
    await waitFor(() => !el.isSyncing, 'the answer');
    await flush();
    expect(server.INBOX[0].Flags).toContain('\\Flagged');
    expect(el.messages[0].Flags).toContain('\\Flagged');

    await open(el, 'Archive');
    await waitFor(() => subjects(el).join() === 'Archive 3' && !el.isSyncing, 'Archive');
    holdNext = 'INBOX';
    await open(el, 'INBOX');
    expect(el.messages[0].Flags).toContain('\\Flagged');
    release();
  });

  it('does not bring back a row filed away then', async () => {
    const el = await inboxFromMemory();
    const shown: string[][] = [];
    const note = () => shown.push(subjects(el));
    messageSync.addEventListener('sync-success', note);
    onTestFinished(() => messageSync.removeEventListener('sync-success', note));
    el.selectedKeys = new Set([messageKey('INBOX', '9')]);
    await el.updateComplete;
    const filing = el._handleReaderAction(new CustomEvent('action', { detail: { action: 'archive' } }));
    await flush();
    expect(subjects(el)).toEqual(['INBOX 8']);

    release();
    await filing;
    await waitFor(() => listings.filter((l) => l === 'INBOX').length === 3 && !el.isSyncing, "the write's re-read");
    await flush();
    expect(shown.filter((rows) => rows.includes('INBOX 9'))).toEqual([]);
    expect(subjects(el)).toEqual(['INBOX 8']);
  });
});
