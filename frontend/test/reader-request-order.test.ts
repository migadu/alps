/**
 * What the reader asks the server for first, and how much of it at once.
 *
 * The server answers one request per session at a time — it holds a single IMAP
 * connection under a lock — so the reader's order IS the reader's latency. Two
 * things followed from that, and both are pinned here: the opened message's
 * body is asked for before its conversation, and the bodies nobody asked for
 * are read one at a time.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import {
  cleanup, flush, installMatchMedia, installResizeObserver, installScrollIntoView, mount, waitFor,
} from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';

type El = HTMLElement & Record<string, any>;

const envelope = (subject: string, date: string) => ({
  Subject: subject,
  Date: date,
  From: [{ Name: '', Mailbox: 'charles', Host: 'example.com' }],
  To: [],
  Cc: [],
});

/** The open message: read, so opening the conversation is not about it. */
const opened = {
  UID: '10',
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: { ...envelope('Engines', '2026-09-09T10:00:00Z'), MessageID: 'ten@example.com' },
};

/** Members nobody has read: the conversation opens them, so it fetches them. */
const unread = [1, 2, 3, 4].map(uid => ({
  UID: String(uid),
  Mailbox: 'INBOX',
  Flags: [],
  Envelope: { ...envelope(`Re: Engines ${uid}`, `2026-09-0${uid}T10:00:00Z`), MessageID: `${uid}@example.com` },
}));

/**
 * A message from elsewhere, with a conversation of its own — one message, read.
 * Opening it is a switch AWAY from the conversation under test, which is the
 * only thing the last test here is about.
 */
const elsewhere = {
  UID: '99',
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: { ...envelope('Looms', '2026-09-10T10:00:00Z'), MessageID: 'looms@example.com' },
};

function settingsStore() {
  const state = { enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true };
  return Object.assign(new EventTarget(), { getState: () => state });
}

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

let asked: string[];
/** Body reads held open, so what the reader does NEXT is visible. */
let release: Map<string, () => void>;

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

/** The `?view=` read of one message: its metadata and a text part. */
const bodyOf = (msg: any) =>
  json({ Message: msg, Part: { Path: [1], MIMEType: 'text/plain' }, HasText: true, Attachments: [] });

const bodyReads = () => asked.filter(url => /\/messages\/\d+\?view=/.test(url));

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  asked = [];
  release = new Map();

  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = String(url);
    asked.push(u);
    // Per message, not one answer for every ask. A single shared conversation
    // made the reader read THIS conversation's members after a switch to a
    // message outside it — correctly, because the mock had just said they were
    // that message's conversation too — and the test then counted those reads
    // as a queue it had failed to drop.
    const thread = /\/messages\/(\d+)\/thread/.exec(u);
    if (thread) return json({ Messages: thread[1] === elsewhere.UID ? [elsewhere] : [...unread, opened] });
    if (u.includes('/raw')) return new Response('the body', { status: 200 });
    const view = /\/messages\/(\d+)\?view=/.exec(u);
    if (view) {
      const msg = [opened, ...unread].find(m => m.UID === view[1])!;
      // Held until the test lets it go.
      await new Promise<void>(resolve => release.set(view[1], resolve));
      return bodyOf(msg);
    }
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  for (const resolve of release.values()) resolve();
  cleanup();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function openConversation(): Promise<El> {
  const el = await mount<El>('alps-message-reader', {
    settingsStore: settingsStore(),
    i18nStore,
    composeStore: new EventTarget(),
    mailbox: 'INBOX',
    mailboxes: [{ Name: 'INBOX', Attrs: [] }, { Name: 'Sent', Attrs: ['\\Sent'] }],
    messages: [{ ...opened, SubMessages: unread }],
    message: opened,
  });
  return el;
}

describe('opening a conversation', () => {
  it('does not ask for the conversation until the opened message has come back', async () => {
    await openConversation();
    await waitFor(() => release.has('10'), 'the opened message to be read');
    await flush();

    // Held open, so the conversation read must still be waiting: issuing it
    // alongside is what put the opened message behind it.
    expect(asked.filter(url => url.includes('/thread'))).toHaveLength(0);

    release.get('10')!();
    await waitFor(() => asked.some(url => url.includes('/thread')), 'the conversation read');
  });

  it('reads the conversation even when the opened message could not be read', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const u = String(url);
      asked.push(u);
      if (u.includes('/thread')) return json({ Messages: [...unread, opened] });
      // A refusal rather than a dropped connection: `fetchWithTimeout` replays
      // those over more than a second, which this test would only spend waiting.
      return new Response('no such message', { status: 404 });
    }));

    await openConversation();
    await waitFor(() => asked.some(url => url.includes('/thread')), 'the conversation read');
  });

  it('reads the unread members one at a time', async () => {
    await openConversation();
    // The opened message's body first, so the conversation can be answered.
    await waitFor(() => release.has('10'), 'the opened message to be read');
    release.get('10')!();
    await waitFor(() => bodyReads().length > 1, 'the first member to be read');

    // Four unread members, one read in flight.
    expect(bodyReads()).toHaveLength(2);

    const first = /\/messages\/(\d+)\?view=/.exec(bodyReads()[1])![1];
    release.get(first)!();
    await waitFor(() => bodyReads().length > 2, 'the next member to be read');
    expect(bodyReads()).toHaveLength(3);
  });

  it('drops what is left to read when another message is opened', async () => {
    const el = await openConversation();
    await waitFor(() => release.has('10'), 'the opened message to be read');
    release.get('10')!();
    await waitFor(() => bodyReads().length > 1, 'the first member to be read');

    /** The reads of THIS conversation: the message opened instead is not one. */
    const members = () => bodyReads().filter(url => !url.includes(`/messages/${elsewhere.UID}?`));
    // One member in flight, three still queued behind it.
    const readSoFar = members();
    expect(readSoFar).toHaveLength(2);

    el.messages = [elsewhere];
    el.message = elsewhere;
    await flush();

    // Let the member that was in flight finish: the queue behind it is gone, so
    // the conversation left behind stops competing with the one on screen.
    for (const resolve of release.values()) resolve();
    await flush();
    await flush();
    // Named reads, not a count. Counting both sides included the switch's own
    // read on one side and excluded it on the other, so a member that WAS read
    // after the switch cancelled it out and the test passed — until a second
    // one leaked and it failed, on timing, about once in three runs.
    expect(members()).toEqual(readSoFar);
  });
});
