/**
 * What the reader asks the server for first, and how much of it at once.
 *
 * The server answers what the user waits for one request per session at a
 * time — on the session's own IMAP connection, under a lock — so the reader's
 * order IS the reader's latency. Two things followed from that, and both are
 * pinned here: the opened message's body is asked for before its conversation,
 * and the bodies nobody asked for are read one at a time. Those reads are
 * marked as background work, which the server does on the session's
 * background connection; a session without one (turned off, or refused by the
 * mail server) does them on its own, behind the rest.
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
/** The requests sent as ones nobody waits for, which the server does aside. */
let background: string[];
/** Body reads held open, so what the reader does NEXT is visible. */
let release: Map<string, () => void>;
/** Test-owned reads, including conversation work a completed body starts. */
let pendingReads: Set<Promise<unknown>>;

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
  background = [];
  release = new Map();
  pendingReads = new Set();
  const prototype = customElements.get('alps-message-reader')!.prototype as El;
  for (const method of ['fetchItemBody', 'loadConversation']) {
    const read = prototype[method];
    vi.spyOn(prototype, method).mockImplementation(function (this: El, ...args: any[]) {
      const running = read.apply(this, args) as Promise<unknown>;
      pendingReads.add(running);
      const finished = () => { pendingReads.delete(running); };
      void running.then(finished, finished);
      return running;
    });
  }

  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    asked.push(u);
    if (new Headers(init?.headers).has('X-Alps-Background')) background.push(u);
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

async function settleReaderReads() {
  // Disconnect before releasing: no more queued members may start. A released
  // metadata response can still decode and ask for /raw; keep this test's fetch
  // stub installed until those reads and their follow-on conversation settle.
  cleanup();
  MessageCache.clear();
  for (const resolve of release.values()) resolve();
  while (pendingReads.size) await Promise.allSettled([...pendingReads]);
}

afterEach(async () => {
  await settleReaderReads();
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

  it('reads the members nobody asked for in the background, and the opened message not', async () => {
    await openConversation();
    await waitFor(() => release.has('10'), 'the opened message to be read');
    release.get('10')!();
    await waitFor(() => asked.some(url => url.includes('/messages/10/raw')), 'the opened message\'s text');
    await waitFor(() => bodyReads().length > 1, 'the first member to be read');

    // The server reads these on the session's second connection, so the
    // message the user opens next does not wait behind them.
    const member = /\/messages\/(\d+)\?view=/.exec(bodyReads()[1])![1];
    release.get(member)!();
    await waitFor(() => asked.some(url => url.includes(`/messages/${member}/raw`)), 'the member\'s text');
    const readsOf = (uid: string) => (url: string) =>
      url.includes(`/messages/${uid}?`) || url.includes(`/messages/${uid}/raw`);
    expect(background.filter(readsOf(member))).toHaveLength(2);
    expect(background.filter(readsOf('10'))).toEqual([]);
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

it('waits for released metadata to finish decoding before teardown restores the fetch stub', async () => {
  const fetch = vi.mocked(globalThis.fetch).getMockImplementation()!;
  let finishMetadata!: () => void;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, init);
    if (String(url).includes('/messages/1?view=')) {
      const parse = response.json.bind(response);
      response.json = () => new Promise((resolve, reject) => {
        finishMetadata = () => { void parse().then(resolve, reject); };
      });
    }
    return response;
  }));
  await openConversation();
  await waitFor(() => release.has('10'), 'the open message');
  release.get('10')!();
  await waitFor(() => release.has('1'), 'the first member');
  release.get('1')!();
  await waitFor(() => !!finishMetadata, 'the pending metadata decode');

  let settled = false;
  const settling = settleReaderReads().then(() => { settled = true; });
  try {
    await Promise.resolve();
    expect(settled).toBe(false);
  } finally {
    finishMetadata();
    await settling;
    // Release the held response even when the assertion fails, so this
    // regression's own teardown cannot hang or leak into another test.
    while (pendingReads.size) await Promise.allSettled([...pendingReads]);
  }

  // The old stub served the final raw request. It cannot enter the next
  // test's recorder and turn that test's metadata/raw pair into three reads.
  expect(asked.filter(url => url.includes('/messages/1/raw'))).toHaveLength(1);
  expect(pendingReads.size).toBe(0);
});

/**
 * The teardown above, pinned from outside: the test before calls
 * settleReaderReads() itself, so it would still pass if afterEach stopped
 * calling it.
 *
 * The first test leaves a member's metadata decoding past its own end, with
 * nothing of its own to wait for it; the second then waits out whatever the
 * first left running, and finds that none of it asked this test's stub for
 * anything. Without afterEach's settleReaderReads() the decode finishes in the
 * second test, and its /raw read (with the members queued after it) lands in
 * that test's recorder, which is how #377 counted three background reads of a
 * member instead of two.
 *
 * The two run in order, as a file's tests do: the second, run alone (with -t),
 * finds nothing left and passes either way.
 */
describe('a read still running when its test ends', () => {
  /** The reads the first test left running, kept for the second to wait out. */
  let leftRunning: Set<Promise<unknown>> | null = null;

  it('leaves a member decoding past the end of its test', async () => {
    const fetch = vi.mocked(globalThis.fetch).getMockImplementation()!;
    let decoding = false;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      const response = await fetch(url, init);
      if (String(url).includes('/messages/1?view=')) {
        const parse = response.json.bind(response);
        // Decoded a moment after this test has returned: past its end, and
        // before any slow machine would have reached the next test's checks.
        response.json = () => {
          decoding = true;
          return new Promise((resolve, reject) => setTimeout(() => { void parse().then(resolve, reject); }, 20));
        };
      }
      return response;
    }));
    await openConversation();
    await waitFor(() => release.has('10'), 'the open message');
    release.get('10')!();
    await waitFor(() => release.has('1'), 'the first member');
    release.get('1')!();
    await waitFor(() => decoding, 'the member to be decoding');

    leftRunning = pendingReads;
    expect(leftRunning.size).toBeGreaterThan(0);
  });

  it("lets nothing it left running reach the next test's stub", async () => {
    // Waited out as they stand. Not until the set is empty: a read finishing
    // now takes itself out of THIS test's set, not the first one's.
    if (leftRunning) await Promise.allSettled([...leftRunning]);
    await flush();

    expect(asked).toEqual([]);
  });
});

describe('an answer that lands after the reader has gone', () => {
  /**
   * The reads here are held open and released at teardown, which is what a
   * page coming down looks like: the element is removed and the request it was
   * waiting on answers anyway. Applying that answer repaints a reader with no
   * screen — its thread cards render, read `window`, and in a torn-down
   * environment there is no window to read. That surfaced as an unhandled
   * rejection in roughly a third of full runs, failing the suite's exit code
   * while every test passed.
   */
  it('does not paint a body released after the element was removed', async () => {
    const el = await openConversation();
    await waitFor(() => release.has('10'), 'the opened message to be read');
    expect(el.content).toBe('');

    el.remove();
    // The server answers regardless — it was already reading when we left.
    release.get('10')!();
    await flush();
    await flush();

    // The body reached the item object, which is nobody's screen. What must
    // not happen is the reader adopting it and repainting for it.
    expect(el.content).toBe('');
    expect(el.loading).toBe(true);
  });

  it('does not cache a body that answers after its user signed out', async () => {
    // The cache keys name no user, so a body written after the sign-out is
    // there for whoever signs in next on this tab and opens the same message.
    // Only the event, not `MessageCache.clear()`: an expired session empties
    // sessionStorage wholesale and dispatches nothing else.
    const el = await openConversation();
    await waitFor(() => release.has('10'), 'the opened message to be read');

    sessionStorage.clear();
    window.dispatchEvent(new CustomEvent('session-cleared', { detail: { reason: 'expired' } }));
    el.remove();
    release.get('10')!();
    await flush();
    await flush();

    expect(MessageCache.get('INBOX', '10', 'text')).toBeNull();
  });

  it('caches a body that answers while its user is still signed in', async () => {
    await openConversation();
    await waitFor(() => release.has('10'), 'the opened message to be read');
    release.get('10')!();
    await waitFor(() => MessageCache.get('INBOX', '10', 'text') !== null, 'the body to be cached');
  });

  it('does not resolve a conversation that lands after the element was removed', async () => {
    // This one needs the CONVERSATION held rather than the body: the shared
    // mock answers /thread at once, and then it has landed long before the
    // element goes.
    let answerThread: (() => void) | null = null;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const u = String(url);
      asked.push(u);
      if (/\/thread/.test(u)) {
        await new Promise<void>(resolve => { answerThread = resolve; });
        return json({ Messages: [...unread, opened] });
      }
      if (u.includes('/raw')) return new Response('the body', { status: 200 });
      const view = /\/messages\/(\d+)\?view=/.exec(u);
      if (view) return bodyOf([opened, ...unread].find(m => m.UID === view[1])!);
      return new Response('{}', { status: 404 });
    }));

    const el = await openConversation();
    await waitFor(() => answerThread !== null, 'the conversation to be asked for');

    el.remove();
    answerThread!();
    await flush();
    await flush();

    expect(el._conversation).toBeNull();
  });
});
