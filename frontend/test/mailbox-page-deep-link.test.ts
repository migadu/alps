/**
 * A message the address names, and the page does not list, is read once.
 *
 * Opened from a link, or after it moved off the page, the page asks the
 * server for the message so that the reader has one to show. It asked without
 * the view the reader shows, and kept nothing of the answer, so the reader
 * asked for the same message again the moment it was given it: two round
 * trips to the server for one message. The answer carries the body, so the
 * page's one read is all the reader needs.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextProvider } from '@lit/context';
import '../src/pages/mailbox-page';
import { cleanup, waitFor } from './helpers/dom';
import { messageSync } from '../src/services/message-sync';
import { settingsContext } from '../src/store/settings-store';
import { MessageCache } from '../src/utils/message-cache';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

function settingsStore(preferredView: 'html' | 'text') {
  const state: Record<string, unknown> = {
    layoutMode: 'vertical',
    densityMode: 'compact',
    sortOrder: 'desc',
    messagesPerPage: 50,
    checkMailInterval: 0,
    loginUsername: 'ada@example.com',
    enableThreading: false,
    markReadTimeout: -1,
    preferredView,
    showRemoteContent: 'never',
  };
  return Object.assign(new EventTarget(), {
    getState: () => state,
    updateSettings: async (updates: Record<string, unknown>) => {
      Object.assign(state, updates);
    },
  });
}

const row = (uid: number, subject = `message ${uid}`) => ({
  UID: String(uid),
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: {
    From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.test' }],
    To: [{ Name: '', Mailbox: 'me', Host: 'example.test' }],
    Cc: [],
    Subject: subject,
    Date: '2026-09-01T10:00:00Z',
    MessageID: `${uid}@example.test`,
  },
});

/** The message the address names: in the Inbox, not on its first page. */
const linked = row(42, 'Engines');

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

let asked: string[];
/** What the server answers for message 42, by the view asked for. */
let answers: Record<string, Record<string, unknown>>;
/** Holds the next answer for message 42 until it resolves. */
let holdNextRead: Promise<void> | null;

/** The requests for message 42 itself: its conversation and its parts are other questions. */
const readsOfTheMessage = () => asked.filter((url) => /^\/mailboxes\/INBOX\/messages\/42(\?|$)/.test(url));
const rawReads = () => asked.filter((url) => url.includes('/raw'));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  asked = [];
  holdNextRead = null;
  answers = {
    html: {
      Message: linked, Part: { Path: [2], MIMEType: 'text/html' }, Attachments: [],
      HasHTML: true, HasText: true, Body: '<p>The <b>engine</b> runs.</p><iframe src="https://example.test/frame"></iframe>',
    },
    text: {
      Message: linked, Part: { Path: [1], MIMEType: 'text/plain' }, Attachments: [],
      HasHTML: true, HasText: true, Body: 'The engine runs.',
    },
  };
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = String(url);
    asked.push(u);
    if (u.includes('/status') || u.includes('/verdicts')) return json({});
    if (u.includes('/thread')) return json({ Messages: [linked] });
    if (u.includes('/raw')) return new Response('read again with /raw', { status: 200 });
    if (u.startsWith('/mailboxes/INBOX/messages/42')) {
      const held = holdNextRead;
      holdNextRead = null;
      if (held) await held;
      const view = new URL(u, 'http://alps.test').searchParams.get('view') || 'html';
      return json(answers[view]);
    }
    if (u.startsWith('/mailboxes/INBOX?')) {
      return json({
        Username: 'ada@example.com', Page: 0, Total: 2, MessagesPerPage: 50,
        Mailboxes: [{ Name: 'INBOX', Total: 3, Unseen: 0, Attributes: [] }],
        Messages: [row(9), row(8)],
      });
    }
    return new Response('{}', { status: 404 });
  }));
  history.replaceState(null, '', '#/mailbox/INBOX?uid=42');
});

afterEach(() => {
  messageSync.stop();
  cleanup();
  MessageCache.clear();
  history.replaceState(null, '', '#/mailbox/INBOX');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Mounts the page at the address and waits for the reader to show message 42's body. */
async function openedFromTheLink(preferredView: 'html' | 'text'): Promise<El> {
  // Provided as the app provides it, so that the reader inside the page, which
  // takes its settings from the context, shows the view the page was told of.
  const settings = settingsStore(preferredView);
  const host = document.createElement('div');
  new ContextProvider(host, { context: settingsContext, initialValue: settings as any });
  document.body.appendChild(host);
  const el = document.createElement('mailbox-page') as El;
  Object.assign(el, { i18nStore, settingsStore: settings, composeStore: new EventTarget() });
  host.appendChild(el);
  await el.updateComplete;
  await waitFor(() => el.selectedMessage?.UID === '42', 'the linked message to be opened');
  let reader: El | null = null;
  await waitFor(() => {
    reader = el.shadowRoot?.querySelector('alps-message-reader') as El | null;
    return !!reader && !reader.loading && !!reader.content;
  }, 'the reader to show its body');
  return reader!;
}

describe('a message the address names, not on the page', () => {
  it('is read once, and shown as HTML from that read', async () => {
    const reader = await openedFromTheLink('html');

    expect(readsOfTheMessage()).toEqual(['/mailboxes/INBOX/messages/42?view=html']);
    expect(rawReads()).toEqual([]);
    expect(reader.mimeType).toBe('text/html');
    // Kept as the HTML it is, and so sanitized: kept as text, it would be
    // shown as it came, frame and all.
    expect(reader.rawMessageHtml).toBe(answers.html.Body);
    expect(reader.content).toContain('<b>engine</b>');
    expect(reader.content).not.toContain('<iframe');
  });

  it('is read once in the plain-text view, when that is the one the reader shows', async () => {
    const reader = await openedFromTheLink('text');

    expect(readsOfTheMessage()).toEqual(['/mailboxes/INBOX/messages/42?view=text']);
    expect(rawReads()).toEqual([]);
    expect(reader.mimeType).toBe('text/plain');
    expect(reader.content).toBe('The engine runs.');
  });

  it('is read again by the reader when the answer leaves its text out', async () => {
    // The server leaves the text out when it cannot decode it. Nothing is
    // kept of such an answer, and the reader reads the message as it would
    // any other, /raw and all, rather than showing a cached message with no
    // body.
    delete answers.text.Body;
    const reader = await openedFromTheLink('text');

    expect(readsOfTheMessage()).toEqual(['/mailboxes/INBOX/messages/42?view=text', '/mailboxes/INBOX/messages/42?view=text']);
    expect(rawReads()).toEqual(['/mailboxes/INBOX/messages/42/raw?part=1']);
    expect(reader.content).toBe('read again with /raw');
  });

  it('is not kept when the cache was emptied while it was asked for', async () => {
    // The cache is emptied when a session ends, and an answer that lands
    // after that is the previous user's mail. The page does not keep it for
    // the next user, so here the reader, finding nothing kept, reads the
    // message for itself.
    let release!: () => void;
    holdNextRead = new Promise<void>((resolve) => { release = resolve; });
    const opened = openedFromTheLink('html');
    await waitFor(() => readsOfTheMessage().length === 1, 'the page to ask for the message');
    MessageCache.clear();
    release();
    await opened;

    expect(readsOfTheMessage()).toEqual(['/mailboxes/INBOX/messages/42?view=html', '/mailboxes/INBOX/messages/42?view=html']);
  });
});
