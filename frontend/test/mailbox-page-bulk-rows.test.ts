/**
 * What the list does WHILE a bulk write runs.
 *
 * The server takes a session's requests one at a time, and a bulk move or
 * delete is one request per folder over everything checked — seconds, or
 * longer. Until the answer came back nothing on screen moved: the rows stayed,
 * the boxes stayed checked, and the only sign of work was a spinner in the
 * reading pane, which a narrow layout does not show. The sensible reading of
 * that is that the press missed, and the sensible response is to press again.
 *
 * So the rows leave with the gesture and the write reconciles afterwards. Two
 * things follow, and both are pinned here: the SELECTION goes with the rows,
 * because the list keeps only checked keys it still lists; and a refusal has to
 * put back exactly what stayed, still checked, since that is the state a user
 * needs to try again.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/mailbox-page';
import type { ReaderActionDetail } from '../src/components/message-reader';
import { messageSync } from '../src/services/message-sync';
import { messageKey } from '../src/utils/message-key';
import { cleanup, flush, mount, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const SEEN = '\\Seen';
const TAG = '$label1';

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
    updateSettings: async (updates: Record<string, unknown>) => { Object.assign(state, updates); },
  });
}

const MAILBOXES = [
  { Name: 'INBOX', Attrs: [] },
  { Name: 'Archive', Attrs: ['\\Archive'] },
  { Name: 'Trash', Attrs: ['\\Trash'] },
];

type Request = { url: string; method: string; body: any };
let requests: Request[] = [];
/** Folders whose writes the server refuses. */
let refusing = new Set<string>();
/** Set while a write is to be held open, so the state DURING it is visible. */
let hold: (() => void) | null = null;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(messageSync, 'sync').mockImplementation(() => {});
  requests = [];
  refusing = new Set();
  hold = null;
  history.replaceState(null, '', '/#/mailbox/INBOX');
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    const u = String(url);
    const method = init.method || 'GET';
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    requests.push({ url: u, method, body });
    if (method !== 'GET' && hold) await new Promise<void>(resolve => { hold = resolve; });
    const folder = decodeURIComponent(u.split('/')[2] ?? '');
    if (method !== 'GET' && refusing.has(folder)) return json({ error: 'nope' }, 500);
    if (u.endsWith('/messages/move')) return json({ ok: true, uidMapping: Object.fromEntries(body.uids.map((uid: string) => [uid, String(Number(uid) + 100)])) });
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

const row = (uid: string, flags: string[] = [SEEN]) =>
  ({ UID: uid, Mailbox: 'INBOX', Flags: flags, Envelope: { Subject: `message ${uid}` } });

/** The Inbox, listed, with nothing checked yet. */
async function inbox(messages = [row('1'), row('2'), row('3')]): Promise<El> {
  const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
  await waitFor(() => !!el.shadowRoot?.querySelector('alps-message-list'), 'the message list');
  Object.assign(el, {
    currentMailbox: 'INBOX',
    mailboxes: MAILBOXES,
    messages,
    totalMessages: messages.length,
    selectedMessage: null,
    selectedKeys: new Set(),
  });
  await el.updateComplete;
  requests = [];
  return el;
}

async function checked(el: El, ...uids: string[]) {
  el.selectedKeys = new Set(uids.map(uid => messageKey('INBOX', uid)));
  await el.updateComplete;
  await flush();
}

/** Runs a gesture and waits for it to finish. */
async function act(el: El, detail: ReaderActionDetail) {
  await el._handleReaderAction(new CustomEvent('action', { detail }));
  await flush();
}

/** Starts a gesture and leaves the server holding its request. */
function start(el: El, detail: ReaderActionDetail): Promise<void> {
  hold = () => {};
  const done = el._handleReaderAction(new CustomEvent('action', { detail }));
  return done;
}

/** Lets the held write answer, and waits for the gesture to end. */
async function release(done: Promise<void>) {
  await waitFor(() => typeof hold === 'function', 'the write to reach the server');
  const resolve = hold!;
  hold = null;
  resolve();
  await done;
  await flush();
}

const subjects = (el: El) => el.messages.map((m: any) => m.Envelope.Subject);
const writes = () => requests.filter(r => r.method !== 'GET');
const flagsOf = (el: El, uid: string) => el.messages.find((m: any) => m.UID === uid)?.Flags ?? [];

describe('while a bulk write runs', () => {
  it('takes the checked rows off the list, and the selection with them', async () => {
    const el = await inbox();
    await checked(el, '1', '3');

    const done = start(el, { action: 'archive' });
    await flush();

    // Before the server has said anything: the rows the gesture was about are
    // gone, and the count went with them.
    expect(subjects(el)).toEqual(['message 2']);
    expect(el.totalMessages).toBe(1);
    // Nothing had to clear the selection. The list keeps only checked keys it
    // still lists, so removing the rows empties it and folds the bulk bar away.
    expect(el.selectedKeys.size).toBe(0);

    await release(done);
    expect(subjects(el)).toEqual(['message 2']);
  });

  it('paints flags before the server answers', async () => {
    const el = await inbox([row('1', []), row('2', [])]);
    await checked(el, '1');

    const done = start(el, { action: 'markUnread' });
    await flush();

    expect(flagsOf(el, '1')).toContain(SEEN);
    expect(flagsOf(el, '2')).not.toContain(SEEN);
    await release(done);
    expect(flagsOf(el, '1')).toContain(SEEN);
  });

  it('turns away the second press, because there is nothing checked to repeat', async () => {
    const el = await inbox();
    await checked(el, '1', '3');

    const done = start(el, { action: 'archive' });
    await flush();
    // The press a user makes when nothing seems to have happened. It used to
    // queue a second full write behind the first on a connection that takes
    // one at a time. Nothing guards against it explicitly: the selection went
    // with the rows, so the gesture has nothing to act on and falls through.
    await act(el, { action: 'archive' });
    expect(writes()).toHaveLength(1);

    await release(done);
    expect(writes()).toHaveLength(1);
  });
});

describe('a bulk write the server refuses', () => {
  it('puts the rows back, still checked', async () => {
    const el = await inbox();
    refusing.add('INBOX');
    await checked(el, '1', '3');

    const done = start(el, { action: 'archive' });
    await flush();
    // Gone first, on the same optimism as any other bulk write: the put-back
    // is only about what happens when the server disagrees.
    expect(subjects(el)).toEqual(['message 2']);
    await release(done);

    // Where they were, in the order they were in — and checked, which is the
    // state the user needs to try them again. A bare re-read of the folder
    // brings the rows back but not the selection.
    expect(subjects(el)).toEqual(['message 1', 'message 2', 'message 3']);
    expect(el.totalMessages).toBe(3);
    expect([...el.selectedKeys].sort()).toEqual([messageKey('INBOX', '1'), messageKey('INBOX', '3')].sort());
  });

  it('puts back only the flags it moved', async () => {
    // Message 2 already carries the tag, so adding it changed nothing about it.
    // Reverting the whole set with the opposite operation would have taken the
    // tag off a message the write never touched.
    const el = await inbox([row('1'), row('2', [SEEN, TAG])]);
    refusing.add('INBOX');
    await checked(el, '1', '2');

    await act(el, { action: 'addTag', tags: [TAG] });

    expect(flagsOf(el, '1')).not.toContain(TAG);
    expect(flagsOf(el, '2')).toContain(TAG);
  });
});

describe('a thread checked in part', () => {
  /** One row standing for three messages, and a message on its own. */
  const listing = () => [{ ...row('9'), SubMessages: [row('4'), row('5')] }, row('7')];

  /**
   * TWO, because a threaded listing is counted in conversations: the server
   * pages thread groups and answers len(groups) as its total. These four
   * messages are two of them.
   */
  const LISTED = 2;

  it('keeps the row, because the rest of it was not acted on', async () => {
    const el = await inbox(listing());
    el.totalMessages = LISTED;
    // Expanded, each message of a thread has a row of its own and can be
    // checked alone. Here that is the face.
    await checked(el, '9');

    const done = start(el, { action: 'archive' });
    await flush();

    // The row stands until the listing re-forms it around another message.
    // Dropping it would have taken 4 and 5 off the screen — messages the user
    // never checked — for as long as the write ran.
    expect(subjects(el)).toEqual(['message 9', 'message 7']);
    expect(el.messages[0].SubMessages.map((m: any) => m.UID)).toEqual(['4', '5']);
    // The conversation is still in the folder, so the count does not move.
    expect(el.totalMessages).toBe(LISTED);
    await release(done);
  });

  it('takes the whole row when every message in it is checked', async () => {
    const el = await inbox(listing());
    el.totalMessages = LISTED;
    // Collapsed, the checkbox stands for the whole conversation, so this is
    // what an ordinary bulk gesture over a thread looks like.
    await checked(el, '9', '4', '5');

    const done = start(el, { action: 'archive' });
    await flush();

    expect(subjects(el)).toEqual(['message 7']);
    // ONE conversation gone, not the three messages under it: the count is in
    // the same units the server keeps it in, and the next listing agrees.
    expect(el.totalMessages).toBe(LISTED - 1);
    await release(done);
  });
});

describe('a permanent delete', () => {
  it('takes the rows out too, and puts them back when it is refused', async () => {
    const el = await inbox();
    el.currentMailbox = 'Trash';
    el.messages = el.messages.map((m: any) => ({ ...m, Mailbox: 'Trash' }));
    await el.updateComplete;
    el.selectedKeys = new Set([messageKey('Trash', '1')]);
    await el.updateComplete;

    // The confirmation is the gesture here: a delete for good asks first.
    await act(el, { action: 'delete' });
    expect(el.showDeleteConfirm).toBe(true);

    refusing.add('Trash');
    hold = () => {};
    const done = el._confirmDelete();
    await flush();
    // Gone the moment the confirmation is answered, not when the server
    // finishes going through them.
    expect(subjects(el)).toEqual(['message 2', 'message 3']);

    await release(done);
    expect(subjects(el)).toEqual(['message 1', 'message 2', 'message 3']);
    expect([...el.selectedKeys]).toEqual([messageKey('Trash', '1')]);
  });
});
