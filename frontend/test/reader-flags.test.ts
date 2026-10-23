/**
 * The reader shows a message's flags as they are now, not as a read found them.
 *
 * A read of a message's body also brings the server's description of the
 * message, flags included, and that description is cached with the body for
 * half an hour. Spread over the message the reader was handed, those flags won:
 * a message starred since it was first opened reopened unstarred, and the star
 * button then did the opposite of what it showed. A flag changed while a read
 * was out was undone the same way when the read came back, since the server
 * had read the flags before the change.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import {
  cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount, waitFor,
} from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';
import { messageKey } from '../src/utils/message-key';

type El = HTMLElement & Record<string, any>;

const envelope = (subject: string, id: string) => ({
  Subject: subject,
  Date: '2026-10-01T10:00:00Z',
  From: [{ Name: '', Mailbox: 'ada', Host: 'example.com' }],
  To: [],
  Cc: [],
  MessageID: id,
});

const message = (flags: string[] | null) => ({
  UID: '7',
  Mailbox: 'INBOX',
  Flags: flags,
  Envelope: envelope('Minutes', 'minutes@example.com'),
});

/** A reply in the same conversation, unread, so the conversation reads it ahead. */
const reply = (flags: string[]) => ({
  UID: '3',
  Mailbox: 'INBOX',
  Flags: flags,
  Envelope: envelope('Re: Minutes', 'reply@example.com'),
});

function settingsStore(enableThreading = false) {
  const state = { enableThreading, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: false };
  return Object.assign(new EventTarget(), { getState: () => state });
}

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

const bodyOf = (msg: unknown) =>
  json({ Message: msg, Part: { Path: [1], MIMEType: 'text/plain' }, HasText: true, Attachments: [] });

/** The flags the server holds for each message, read when the server is asked. */
let serverFlags: Record<string, string[] | null>;
let bodyReads: Record<string, number>;
/** Body reads held open until the test lets them go, by UID. */
let holds: Map<string, Promise<void>>;

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  serverFlags = { '7': ['\\Seen'], '3': [] };
  bodyReads = {};
  holds = new Map();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = String(url);
    if (u.includes('/raw')) return new Response('the body', { status: 200 });
    if (/\/messages\/\d+\/thread/.test(u)) return json({ Messages: [reply(serverFlags['3'] ?? []), message(serverFlags['7'])] });
    const view = /\/messages\/(\d+)\?view=/.exec(u);
    if (view) {
      const uid = view[1];
      bodyReads[uid] = (bodyReads[uid] ?? 0) + 1;
      // Taken when the server is asked, as a server would: a flag changed while
      // the answer is on its way is not in it.
      const flags = serverFlags[uid];
      await holds.get(uid);
      return bodyOf(uid === '7' ? message(flags) : reply(flags ?? []));
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

/** Holds UID's next body read until the returned function is called. */
function hold(uid: string): () => void {
  let release!: () => void;
  holds.set(uid, new Promise<void>(resolve => { release = resolve; }));
  return release;
}

const open = (msg: Record<string, unknown>, extra: Record<string, unknown> = {}) => mount<El>('alps-message-reader', {
  settingsStore: settingsStore(),
  i18nStore,
  composeStore: new EventTarget(),
  mailbox: 'INBOX',
  mailboxes: [{ Name: 'INBOX', Attrs: [] }],
  messages: [msg],
  message: msg,
  ...extra,
});

/** The toolbar's star button, as the user sees it. */
const starIcon = (el: El) =>
  el.shadowRoot!.querySelector<HTMLElement & { icon: string }>('alps-icon-btn[title="messageReader.star"]')?.icon;

const bodyShown = (el: El) => el.content === 'the body' && !el.loading;

const starred = (key: string, flag: string) => window.dispatchEvent(new CustomEvent('external-message-flags-changed', {
  detail: { keys: [key], flag, action: 'add' },
}));

describe('the flags the reader shows', () => {
  it('are the ones a reopened message has now, not the ones its cached read had', async () => {
    const first = await open(message(['\\Seen']));
    await waitFor(() => bodyShown(first), 'the first read');
    expect(MessageCache.get('INBOX', '7', 'text')).toBeTruthy();
    cleanup();

    // Starred since, in the message list or in another client.
    const again = await open(message(['\\Seen', '\\Flagged']));
    await waitFor(() => bodyShown(again), 'the reopened message');
    await again.updateComplete;

    expect(bodyReads['7']).toBe(1);
    expect(again.message.Flags).toContain('\\Flagged');
    expect(starIcon(again)).toBe('starFourFill');
  });

  it('are none when the message has lost every flag since its read was cached', async () => {
    // The server sends a message with no flags as `Flags: null`. Read as
    // "unknown", it let the cached read's flags back in.
    serverFlags['7'] = ['\\Seen', '\\Flagged'];
    const first = await open(message(['\\Seen', '\\Flagged']));
    await waitFor(() => bodyShown(first), 'the first read');
    cleanup();

    const again = await open(message(null));
    await waitFor(() => bodyShown(again), 'the reopened message');
    await again.updateComplete;

    expect(bodyReads['7']).toBe(1);
    expect(again.message.Flags ?? []).not.toContain('\\Flagged');
    expect(again.message.Flags ?? []).not.toContain('\\Seen');
    expect(starIcon(again)).toBe('starFour');
  });

  it('keep a flag changed while the body was being read', async () => {
    const release = hold('7');
    const el = await open(message(['\\Seen']));
    await waitFor(() => bodyReads['7'] === 1, 'the body read to be asked for');

    // Starred from the message list while the read is out; the answer was read
    // before that.
    starred(messageKey('INBOX', '7'), '\\Flagged');
    serverFlags['7'] = ['\\Seen', '\\Flagged'];
    await el.updateComplete;
    expect(starIcon(el)).toBe('starFourFill');

    release();
    await waitFor(() => bodyShown(el), 'the read to land');
    await el.updateComplete;

    expect(el.message.Flags).toContain('\\Flagged');
    expect(starIcon(el)).toBe('starFourFill');
  });

  it('keep a flag given to another message of the conversation while its body was being read', async () => {
    // The reply's card is replaced, not edited, when the flag arrives, so the
    // read that started before it holds the old card: the card in the card list
    // is the one that counts.
    const release = hold('3');
    const opened = message(['\\Seen']);
    const el = await open({ ...opened, SubMessages: [reply([])] }, { settingsStore: settingsStore(true), message: opened });
    await waitFor(() => bodyReads['3'] === 1, 'the reply to be read ahead');

    starred(messageKey('INBOX', '3'), '\\Flagged');
    serverFlags['3'] = ['\\Flagged'];
    await el.updateComplete;

    release();
    const card = () => (el.threadItems as any[]).find(i => String(i.message?.UID) === '3');
    await waitFor(() => !!card() && card().content === 'the body' && !card().loading, 'the reply to land');

    expect(card().message.Flags).toContain('\\Flagged');
  });
});
