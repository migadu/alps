/**
 * The conversation of an opened message is asked for only when it can have
 * other members.
 *
 * Every message opened asked for /thread once its body had come: a THREAD
 * over the folder and a search through Sent, which the message's inline
 * images waited behind. A message the listing threaded alone, which the user
 * has not answered and which answers no other, has no one else to find.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import { cleanup, flush, installMatchMedia, installResizeObserver, installScrollIntoView, mount, waitFor } from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';

type El = HTMLElement & Record<string, any>;

const row = (extra: Record<string, unknown> = {}, envelope: Record<string, unknown> = {}) => ({
  UID: '7',
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  ThreadCount: 1,
  Envelope: {
    Subject: 'Engines',
    Date: '2026-09-01T10:00:00Z',
    From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'remote.test' }],
    To: [{ Name: '', Mailbox: 'me', Host: 'example.test' }],
    Cc: [],
    MessageID: '7@remote.test',
    ...envelope,
  },
  ...extra,
});

function settingsStore() {
  const state = { enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true };
  return Object.assign(new EventTarget(), { getState: () => state });
}

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

let asked: string[];

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  asked = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    asked.push(String(url));
    if (String(url).includes('/thread')) {
      return new Response(JSON.stringify({ Messages: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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

/** Opens the row, its body read as the session holds it, and answers whether the conversation was asked for. */
async function asksForConversation(message: any, read: Record<string, unknown> = {}): Promise<boolean> {
  MessageCache.set('INBOX', '7', 'text', {
    Message: { ...message, ...read }, Part: { Path: [1], MIMEType: 'text/plain' }, Attachments: [],
    RawText: 'The engine runs on cards.', HasHTML: false, HasText: true,
  });
  const el = await mount<El>('alps-message-reader', {
    settingsStore: settingsStore(),
    i18nStore,
    composeStore: { openComposer: vi.fn() },
    mailbox: 'INBOX',
    mailboxes: [{ Name: 'INBOX', Attrs: [] }],
    messages: [message],
    message,
  });
  await waitFor(() => !el.loading && el.content === 'The engine runs on cards.', 'the body');
  for (let i = 0; i < 5; i++) await flush();
  return asked.some(url => url.includes('/messages/7/thread'));
}

describe("an opened message's conversation", () => {
  it('is not asked for when the listing threaded it alone, unanswered, answering nothing', async () => {
    expect(await asksForConversation(row())).toBe(false);
  });

  it('is asked for when the listing threaded it with others', async () => {
    expect(await asksForConversation(row({ ThreadCount: 2 }))).toBe(true);
  });

  it('is asked for when the user answered it, as the answer is in Sent', async () => {
    expect(await asksForConversation(row({ Flags: ['\\Seen', '\\Answered'] }))).toBe(true);
  });

  it('is asked for when it answers another message', async () => {
    expect(await asksForConversation(row({}, { InReplyTo: '6@remote.test' }))).toBe(true);
  });

  it('is asked for when its read brings References', async () => {
    expect(await asksForConversation(row(), { References: ['6@remote.test'] })).toBe(true);
  });

  it('is asked for when the listing did not thread', async () => {
    expect(await asksForConversation(row({ ThreadCount: undefined }))).toBe(true);
  });
});

// A failed read has not established that the message has no References.
// Other readable members must still be found while the opened body fails.
describe('a singleton whose body could not be read', () => {
  for (const failure of ['metadata', 'raw body'] as const) {
    it(`still reads its conversation after a failed ${failure} read`, async () => {
      const message = row();
      vi.stubGlobal('fetch', vi.fn(async (url: string) => {
        const path = String(url);
        asked.push(path);
        if (path.includes('/thread')) return new Response(JSON.stringify({ Messages: [message] }), { status: 200 });
        if (failure === 'raw body' && path.includes('?view=')) {
          return new Response(JSON.stringify({ Message: message, Part: { Path: [1], MIMEType: 'text/plain' }, HasText: true }), { status: 200 });
        }
        return new Response('read failed', { status: 500 });
      }));
      const el = await mount<El>('alps-message-reader', {
        settingsStore: settingsStore(), i18nStore, composeStore: { openComposer: vi.fn() }, mailbox: 'INBOX',
        mailboxes: [{ Name: 'INBOX', Attrs: [] }], messages: [message], message,
      });
      await waitFor(() => !el.loading && el.loadFailed, 'the failed opened-body read');
      for (let i = 0; i < 5; i++) await flush();
      expect(el.loadFailed).toBe(true);
      expect(asked.some(path => path.includes('/messages/7/thread'))).toBe(true);
    });
  }
});
