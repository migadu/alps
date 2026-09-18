/**
 * Checking a thread's row.
 *
 * A collapsed thread is ONE row for the whole conversation, so its checkbox
 * stands for every message in it. It used to stand for the newest alone, and a
 * gesture from the selection bar then handled that one message and left the
 * rest of the thread where it was, under a row that looked handled. Expanded,
 * every message has a row of its own, and the top row is its own message.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, record, shadow, shadowAll, update } from './helpers/dom';
import { messageKey } from '../src/utils/message-key';
import '../src/components/message-list';

const TAG = 'alps-message-list';
type El = HTMLElement & Record<string, any>;

const message = (uid: string) => ({
  UID: uid,
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.com' }], To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

/** A thread of three under row 9, and a message on its own. */
const listing = () => [
  { ...message('9'), ThreadCount: 3, SubMessages: [message('4'), message('5')] },
  message('7'),
];

const rowFor = (el: El, uid: string) =>
  shadowAll(el, '.message-item').find(r => r.textContent?.includes(`message ${uid}`))!;
const boxFor = (el: El, uid: string) => rowFor(el, uid).querySelector<HTMLInputElement>('.message-checkbox')!;

/** The selection as the page hears it, sorted. */
const sorted = (keys: Iterable<string>) => Array.from(keys).sort();

/** The keys of messages listed in the Inbox, which is where these are. */
const inInbox = (...uids: string[]) => uids.map(uid => messageKey('INBOX', uid));

/** The selection is set once the list is up: showing a folder clears it. */
async function list(props: Record<string, unknown> = {}): Promise<El> {
  const el = await mount<El>(TAG, { messages: listing(), currentMailbox: 'INBOX', totalMessages: 2 });
  return Object.keys(props).length ? update(el, props) : el;
}

async function check(el: El, uid: string) {
  rowFor(el, uid).querySelector<HTMLElement>('.checkbox-col')!.click();
  await el.updateComplete;
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('a collapsed thread\'s checkbox', () => {
  it('checks every message of the thread, and tells the page so', async () => {
    const el = await list();
    const heard = record<CustomEvent>(el, 'selection-changed');

    await check(el, '9');

    expect(sorted(heard.at(-1)!.detail.selectedKeys)).toEqual(inInbox('4', '5', '9'));
    expect(boxFor(el, '9').checked).toBe(true);
    expect(boxFor(el, '9').indeterminate).toBe(false);
    expect(rowFor(el, '9').classList).toContain('active');
  });

  it('clears all of it when all of it is checked', async () => {
    const el = await list({ selectedMessages: new Set(inInbox('4', '5', '9', '7')) });

    await check(el, '9');

    expect(sorted(el.selectedMessages)).toEqual(inInbox('7'));
    expect(boxFor(el, '9').checked).toBe(false);
  });

  it('says so when only part of the thread is checked, and fills on a click', async () => {
    const el = await list({ selectedMessages: new Set(inInbox('4')) });

    expect(boxFor(el, '9').checked).toBe(false);
    expect(boxFor(el, '9').indeterminate).toBe(true);

    await check(el, '9');

    expect(sorted(el.selectedMessages)).toEqual(inInbox('4', '5', '9'));
    expect(boxFor(el, '9').indeterminate).toBe(false);
  });

  it('answers its own change event the same way', async () => {
    const el = await list();
    const box = boxFor(el, '9');

    box.checked = true;
    box.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;

    expect(sorted(el.selectedMessages)).toEqual(inInbox('4', '5', '9'));
  });

  it('is what Space checks', async () => {
    const el = await list();
    el.focusedIndex = 0;

    el.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }));
    await el.updateComplete;

    expect(sorted(el.selectedMessages)).toEqual(inInbox('4', '5', '9'));
  });
});

describe('an expanded thread', () => {
  it('checks its top row\'s own message alone', async () => {
    const el = await list();
    await update(el, { expandedThreads: new Set(['9']) });

    await check(el, '9');

    expect(sorted(el.selectedMessages)).toEqual(inInbox('9'));
    expect(boxFor(el, '9').checked).toBe(true);
    expect(boxFor(el, '5').checked).toBe(false);
  });

  it('checks an older message by its own row', async () => {
    const el = await list();
    await update(el, { expandedThreads: new Set(['9']) });

    await check(el, '5');

    expect(sorted(el.selectedMessages)).toEqual(inInbox('5'));
    expect(boxFor(el, '9').checked).toBe(false);
    expect(boxFor(el, '9').indeterminate).toBe(false);
  });
});

describe('select all', () => {
  it('takes every message on the page, inside collapsed threads too', async () => {
    const el = await list();
    const all = shadow<HTMLInputElement>(el, '.select-all-checkbox');

    all.checked = true;
    all.dispatchEvent(new Event('change'));
    await el.updateComplete;

    expect(sorted(el.selectedMessages)).toEqual(inInbox('4', '5', '7', '9'));
    expect(shadow<HTMLInputElement>(el, '.select-all-checkbox').checked).toBe(true);
  });

  it('is not checked while a message inside a collapsed thread is not', async () => {
    const el = await list({ selectedMessages: new Set(inInbox('9', '7')) });

    expect(shadow<HTMLInputElement>(el, '.select-all-checkbox').checked).toBe(false);
  });
});
