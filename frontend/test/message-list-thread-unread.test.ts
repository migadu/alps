/**
 * A collapsed thread is one row for the whole conversation, so it reads as
 * unread while any message in it is. It used to show its newest message's state
 * alone, so an older message marked unread from the conversation left no trace
 * on the list once the reader closed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, shadowAll, update } from './helpers/dom';
import '../src/components/message-list';

const TAG = 'alps-message-list';
type El = HTMLElement & Record<string, any>;

const message = (uid: string, flags: string[]) => ({
  UID: uid,
  Flags: flags,
  Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.com' }], To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

const thread = (rootFlags: string[], subFlags: string[]) => ({
  ...message('9', rootFlags),
  SubMessages: [message('5', subFlags)],
});

const rowFor = (el: El, uid: string) =>
  shadowAll(el, '.message-item').find(r => r.textContent?.includes(`message ${uid}`))!;

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('a thread row', () => {
  it('is unread while collapsed over an unread older message', async () => {
    const el = await mount<El>(TAG, { messages: [thread(['\\Seen'], [])], currentMailbox: 'INBOX', totalMessages: 1 });

    expect(rowFor(el, '9').classList).toContain('unread');
  });

  it('is read when all of it is', async () => {
    const el = await mount<El>(TAG, { messages: [thread(['\\Seen'], ['\\Seen'])], currentMailbox: 'INBOX', totalMessages: 1 });

    expect(rowFor(el, '9').classList).not.toContain('unread');
  });

  it('says only its own state once expanded, beside the older message\'s own row', async () => {
    const el = await mount<El>(TAG, { messages: [thread(['\\Seen'], [])], currentMailbox: 'INBOX', totalMessages: 1 });
    await update(el, { expandedThreads: new Set(['9']) });

    expect(rowFor(el, '9').classList).not.toContain('unread');
    expect(rowFor(el, '5').classList).toContain('unread');
  });
});
