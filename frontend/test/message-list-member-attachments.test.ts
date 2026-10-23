/**
 * A threaded listing carries the older messages of each conversation with
 * their flags and envelope, not their structure, so the list cannot tell from
 * it whether one has attachments. Expanded, the thread asks the server for its
 * conversation, once, and shows each older message's paperclip from that.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, click, mount, shadowAll, waitFor } from './helpers/dom';
import '../src/components/message-list';

const TAG = 'alps-message-list';
type El = HTMLElement & Record<string, any>;

const message = (uid: string) => ({
  UID: uid,
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.com' }], To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

const structure = { Type: 'multipart', Subtype: 'mixed' };

const rowFor = (el: El, uid: string) =>
  shadowAll(el, '.message-item').find(r => r.textContent?.includes(`message ${uid}`))!;
const paperclip = (row: Element) => row.querySelector('.attachment-col .indicator-icon');

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async (url: string) => {
    if (String(url).endsWith('/messages/9/thread')) {
      return new Response(JSON.stringify({
        Messages: [
          { ...message('5'), HasAttachments: true, BodyStructure: structure },
          { ...message('9'), HasAttachments: false, BodyStructure: structure },
        ],
      }), { status: 200 });
    }
    return new Response('{}', { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const threadCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/thread')).length;

describe('an expanded thread', () => {
  it('shows an older message\'s attachments, asked for once', async () => {
    const thread = { ...message('9'), BodyStructure: structure, SubMessages: [message('5')] };
    const el = await mount<El>(TAG, { messages: [thread], currentMailbox: 'INBOX', totalMessages: 1 });

    const caret = () => rowFor(el, '9').querySelector('.caret-col')!;
    await click(caret(), el);
    await waitFor(() => !!rowFor(el, '5') && !!paperclip(rowFor(el, '5')), 'the older message\'s paperclip');
    expect(paperclip(rowFor(el, '9'))).toBeNull();

    await click(caret(), el);
    await click(caret(), el);
    await waitFor(() => !!rowFor(el, '5'), 'the older message\'s row again');
    expect(threadCalls()).toBe(1);
  });

  it('asks for nothing when its older messages carry their structure', async () => {
    const thread = { ...message('9'), BodyStructure: structure, SubMessages: [{ ...message('5'), BodyStructure: structure }] };
    const el = await mount<El>(TAG, { messages: [thread], currentMailbox: 'INBOX', totalMessages: 1 });

    await click(rowFor(el, '9').querySelector('.caret-col')!, el);
    await waitFor(() => !!rowFor(el, '5'), 'the older message\'s row');
    expect(threadCalls()).toBe(0);
  });
});
