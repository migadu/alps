/**
 * Opening a message is one request for it: the server's answer carries the
 * text of the part it chose, and the reader shows that.
 *
 * The answer used to name the part and nothing more, and the reader asked for
 * the part's text again with `/raw?part=`. The server answers a session's
 * requests one at a time, so the body waited for a second turn on the
 * session's IMAP connection behind whatever else was queued there.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import { cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount, waitFor } from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';

type El = HTMLElement & Record<string, any>;

const message = {
  UID: '5',
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: {
    Subject: 'Engines',
    Date: '2026-09-01T10:00:00Z',
    From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'remote.test' }],
    To: [{ Name: '', Mailbox: 'me', Host: 'example.test' }],
    Cc: [],
    MessageID: '5@remote.test',
  },
};

function settingsStore(preferredView: 'html' | 'text') {
  const state = { enableThreading: true, preferredView, showRemoteContent: 'never', showSenderAvatars: true };
  return Object.assign(new EventTarget(), { getState: () => state });
}

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

let asked: string[];
/** The server's answer to the reader's `?view=` request. */
let answer: Record<string, unknown>;

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  asked = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = String(url);
    asked.push(u);
    if (u.includes('/thread')) return json({ Messages: [message] });
    if (u.includes('/raw')) return new Response('read again with /raw', { status: 200 });
    if (u.includes('?view=')) return json(answer);
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  cleanup();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function openMessage(preferredView: 'html' | 'text'): Promise<El> {
  const el = await mount<El>('alps-message-reader', {
    settingsStore: settingsStore(preferredView),
    i18nStore,
    composeStore: new EventTarget(),
    mailbox: 'INBOX',
    mailboxes: [{ Name: 'INBOX', Attrs: [] }],
    messages: [message],
    message,
  });
  await waitFor(() => !el.loading && !!el.content, 'the body to be shown');
  return el;
}

const rawReads = () => asked.filter(url => url.includes('/raw'));

describe('opening a message', () => {
  it('shows the HTML the answer carries, without asking for it again', async () => {
    answer = {
      Message: message, Part: { Path: [2], MIMEType: 'text/html' }, Attachments: [],
      HasHTML: true, HasText: true, Body: '<p>The <b>engine</b> runs.</p>',
    };
    const el = await openMessage('html');

    expect(el.mimeType).toBe('text/html');
    expect(el.content).toContain('<b>engine</b>');
    // Sanitized, as the HTML /raw served was: the frame it is shown in is
    // given a document with its own Content-Security-Policy.
    expect(el.content).toContain('Content-Security-Policy');
    expect(rawReads()).toEqual([]);
  });

  it('shows the text the answer carries, without asking for it again', async () => {
    answer = {
      Message: message, Part: { Path: [1], MIMEType: 'text/plain' }, Attachments: [],
      HasHTML: false, HasText: true, Body: 'The engine runs.',
    };
    const el = await openMessage('text');

    expect(el.mimeType).toBe('text/plain');
    expect(el.content).toBe('The engine runs.');
    expect(rawReads()).toEqual([]);
  });

  it('asks for the body when the answer does not carry it', async () => {
    // The server leaves the text out when it cannot decode it; /raw then
    // answers as it always did.
    answer = {
      Message: message, Part: { Path: [1], MIMEType: 'text/plain' }, Attachments: [],
      HasHTML: false, HasText: true,
    };
    const el = await openMessage('text');

    expect(el.content).toBe('read again with /raw');
    expect(rawReads()).toEqual(['/mailboxes/INBOX/messages/5/raw?part=1']);
  });

  it.each([[null], [[]]])('asks for the one part of a single-part message as part 1, when the answer gives it the path %j', async (Path) => {
    // The server names the whole message, with no path, when its one part is
    // not the text it looks for first. The reader asked /raw for "part=null"
    // or "part=", which is refused, and showed no text.
    answer = {
      Message: message, Part: { Path, MIMEType: 'text/plain' }, Attachments: [],
      HasHTML: false, HasText: true,
    };
    const el = await openMessage('text');

    expect(el.content).toBe('read again with /raw');
    expect(rawReads()).toEqual(['/mailboxes/INBOX/messages/5/raw?part=1']);
  });
});
