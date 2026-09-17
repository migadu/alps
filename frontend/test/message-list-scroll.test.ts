/**
 * Where the list scrolls to. It brings the open message into view when another
 * is opened, and not when the page hands down a fresh copy of the same one, as
 * it does on every sync. The check-for-new-mail button brings new mail into
 * view, and leaves the list where it was when nothing new came.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, flush, mount, shadow, shadowAll, update } from './helpers/dom';
import '../src/components/message-list';

const TAG = 'alps-message-list';

const row = (uid: number, flags: string[] = ['\\Seen']) => ({
  UID: String(uid),
  Flags: flags,
  Envelope: { From: [{ Name: 'Ana', Mailbox: 'ana', Host: 'example.test' }], To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

/** Newest first, as the server lists them by default. */
const rows = (...uids: number[]) => uids.map((uid) => row(uid));

/** Past the 50ms the list waits before scrolling to the open message. */
const pastScrollDelay = () => new Promise((resolve) => setTimeout(resolve, 80));

/** jsdom lays nothing out; a scrollTop that holds what is written to it stands in. */
function scrollable(el: HTMLElement, at: number) {
  const content = shadow(el, '.list-content');
  let top = at;
  Object.defineProperty(content, 'scrollTop', { configurable: true, get: () => top, set: (v: number) => { top = v; } });
  return { get top() { return top; } };
}

/** What the page does for the button: loads, then answers with a listing. */
async function checkForNew(el: HTMLElement, answer: unknown[] | null) {
  const refreshed = vi.fn();
  el.addEventListener('refresh', refreshed, { once: true });
  shadow(el, '.list-header alps-icon-btn[icon="arrowsClockwise"]').click();
  expect(refreshed).toHaveBeenCalledOnce();
  await update(el, { loading: true });
  await update(el, answer ? { messages: answer, loading: false } : { loading: false });
  await pastScrollDelay();
}

let scrolledTo: Element[];

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ Verdicts: {}, Scope: '1' }), { status: 200 })));
  scrolledTo = [];
  vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(function (this: Element) {
    scrolledTo.push(this);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  cleanup();
});

describe('scrolling to the open message', () => {
  it('scrolls to a message when it is opened', async () => {
    const messages = rows(9, 8, 7, 6, 5);
    const el = await mount(TAG, { messages, currentMailbox: 'INBOX' });
    await update(el, { selectedMessage: messages[3] });
    await pastScrollDelay();
    expect(scrolledTo).toEqual([shadow(el, '.message-item.active')]);
  });

  it('does not scroll back to it when handed a fresh copy of the same message', async () => {
    const messages = rows(9, 8, 7, 6, 5);
    const el = await mount(TAG, { messages, currentMailbox: 'INBOX', selectedMessage: messages[3] });
    await pastScrollDelay();
    scrolledTo = [];
    await update(el, { selectedMessage: { ...messages[3], Flags: ['\\Seen', '\\Flagged'] } });
    await pastScrollDelay();
    expect(scrolledTo).toEqual([]);
  });
});

describe('the check-for-new-mail button', () => {
  it('scrolls to the top when new mail arrived there, not back to the open message', async () => {
    const messages = rows(9, 8, 7, 6, 5);
    const el = await mount(TAG, { messages, currentMailbox: 'INBOX', selectedMessage: messages[3] });
    await pastScrollDelay();
    scrolledTo = [];
    const list = scrollable(el, 300);

    const answer = rows(10, 9, 8, 7, 6);
    await checkForNew(el, answer);
    // The page's fresh copy of the open message, as its sync handler makes.
    await update(el, { selectedMessage: { ...answer[4] } });
    await pastScrollDelay();

    expect(list.top).toBe(0);
    expect(scrolledTo).toEqual([]);
  });

  it('counts a reply, which gives its thread a new highest UID', async () => {
    const thread = { ...row(9), SubMessages: [row(4)] };
    const el = await mount(TAG, { messages: [thread, ...rows(8, 7)], currentMailbox: 'INBOX' });
    const list = scrollable(el, 300);
    await checkForNew(el, [{ ...row(11), SubMessages: [row(4), row(9)] }, ...rows(8, 7)]);
    expect(list.top).toBe(0);
  });

  it('stays put when nothing new came', async () => {
    const el = await mount(TAG, { messages: rows(9, 8, 7, 6, 5), currentMailbox: 'INBOX' });
    const list = scrollable(el, 300);
    await checkForNew(el, rows(9, 8, 7, 6, 5));
    expect(list.top).toBe(300);
    expect(scrolledTo).toEqual([]);
  });

  it('stays put when older mail moves up from the next page after a delete', async () => {
    const el = await mount(TAG, { messages: rows(9, 8, 7, 6, 5), currentMailbox: 'INBOX' });
    const list = scrollable(el, 300);
    await checkForNew(el, rows(9, 8, 6, 5, 4));
    expect(list.top).toBe(300);
    expect(scrolledTo).toEqual([]);
  });

  it('scrolls to new mail listed below the first row, as oldest-first lists it', async () => {
    const el = await mount(TAG, { messages: rows(5, 6, 7), currentMailbox: 'INBOX', sortOrder: 'asc' });
    const list = scrollable(el, 0);
    await checkForNew(el, rows(5, 6, 7, 8));
    expect(scrolledTo).toEqual([shadowAll(el, '.message-item')[3]]);
    expect(list.top).toBe(0);
  });

  it('forgets a check that failed, so a later sync does not scroll', async () => {
    const el = await mount(TAG, { messages: rows(9, 8, 7), currentMailbox: 'INBOX' });
    const list = scrollable(el, 300);
    await checkForNew(el, null);
    await update(el, { messages: rows(10, 9, 8) });
    await flush();
    expect(list.top).toBe(300);
    expect(scrolledTo).toEqual([]);
  });
});
