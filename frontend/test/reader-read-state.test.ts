/**
 * The reader shows a message read or unread as the list has it, whatever the
 * body read that brought its text said.
 *
 * Reading a body leaves \Seen alone on the server, so a read's answer carries
 * the read state from before the page's own mark-as-read. That write can land
 * while the read is still out, and a read is cached for half an hour, to be
 * served to every reopen. Merged over the open message, the answer's flags
 * put back the unread: the toolbar offered "Mark as read" on a message the
 * page had just marked read.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import {
  cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount, waitFor,
} from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';
import { messageKey } from '../src/utils/message-key';

type El = HTMLElement & Record<string, any>;

const message = (flags: string[]) => ({
  UID: '7',
  Mailbox: 'INBOX',
  Flags: flags,
  Envelope: {
    Subject: 'Minutes',
    Date: '2026-10-01T10:00:00Z',
    From: [{ Name: '', Mailbox: 'ada', Host: 'example.com' }],
    To: [],
    Cc: [],
    MessageID: 'minutes@example.com',
  },
});

function settingsStore() {
  const state = { enableThreading: false, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: false };
  return Object.assign(new EventTarget(), { getState: () => state });
}

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

/** The flags the server has for the message when its body is read. */
let serverFlags: string[];
let bodyReads: number;
/** Set to hold the next body read open until the test lets it go. */
let held: Promise<void> | null;

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  serverFlags = [];
  bodyReads = 0;
  held = null;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = String(url);
    if (u.includes('/raw')) return new Response('the body', { status: 200 });
    if (/\/messages\/7\?view=/.test(u)) {
      bodyReads++;
      // As the server has them when it is asked: a write that lands while the
      // answer is on its way is not in it.
      const flags = [...serverFlags];
      if (held) await held;
      return json({ Message: message(flags), Part: { Path: [1], MIMEType: 'text/plain' }, HasText: true, Attachments: [] });
    }
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  cleanup();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const open = (msg: ReturnType<typeof message>) => mount<El>('alps-message-reader', {
  settingsStore: settingsStore(),
  i18nStore,
  composeStore: new EventTarget(),
  mailbox: 'INBOX',
  mailboxes: [{ Name: 'INBOX', Attrs: [] }],
  messages: [msg],
  message: msg,
});

const bodyShown = (el: El) => el.content === 'the body' && !el.loading;

/** What the page does when its mark-as-read write has landed. */
function pageMarksRead(el: El) {
  const read = message(['\\Seen']);
  el.messages = [read];
  el.message = read;
  window.dispatchEvent(new CustomEvent('external-message-flags-changed', {
    detail: { keys: [messageKey('INBOX', '7')], flag: '\\Seen', action: 'add' },
  }));
}

describe('the read state the reader shows', () => {
  it('stays read when the page marks the message read while its body is being read', async () => {
    let release!: () => void;
    held = new Promise<void>(resolve => { release = resolve; });
    const el = await open(message([]));
    await waitFor(() => bodyReads === 1, 'the body read to be asked for');

    pageMarksRead(el);
    await el.updateComplete;
    expect(el.readToggleMarksRead).toBe(false);

    release();
    await waitFor(() => bodyShown(el), 'the read to land');
    await el.updateComplete;

    expect(el.message.Flags).toContain('\\Seen');
    expect(el.threadItems[0].message.Flags).toContain('\\Seen');
    expect(el.readToggleMarksRead).toBe(false);
  });

  it('is read on a reopen of a message marked read since its body was cached', async () => {
    const first = await open(message([]));
    await waitFor(() => bodyShown(first), 'the first read');
    expect(MessageCache.get('INBOX', '7', 'text')).toBeTruthy();
    cleanup();

    const again = await open(message(['\\Seen']));
    await waitFor(() => bodyShown(again), 'the reopened message');
    await again.updateComplete;

    expect(bodyReads).toBe(1);
    expect(again.message.Flags).toContain('\\Seen');
    expect(again.readToggleMarksRead).toBe(false);
  });

  it('is unread on a reopen of a message marked unread since its body was cached', async () => {
    serverFlags = ['\\Seen'];
    const first = await open(message(['\\Seen']));
    await waitFor(() => bodyShown(first), 'the first read');
    cleanup();

    const again = await open(message([]));
    await waitFor(() => bodyShown(again), 'the reopened message');
    await again.updateComplete;

    expect(bodyReads).toBe(1);
    expect(again.message.Flags).not.toContain('\\Seen');
    expect(again.readToggleMarksRead).toBe(true);
  });
});
