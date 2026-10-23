/**
 * A threaded listing carries the older messages of each conversation with
 * their flags and envelope, not their structure, so the list cannot tell from
 * it whether one has attachments. Expanded, the thread asks the server for its
 * conversation, once, and shows each older message's paperclip from that.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, click, flush, mount, shadowAll, waitFor } from './helpers/dom';
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

it("forgets an older account's thread metadata when the same folder and UIDs return", async () => {
  const thread = () => ({ ...message('9'), BodyStructure: structure, SubMessages: [message('5')] });
  const el = await mount<El>(TAG, { messages: [thread()], currentMailbox: 'INBOX', totalMessages: 1, showSenderAvatars: false });
  const caret = () => rowFor(el, '9').querySelector('.caret-col')!;
  await click(caret(), el);
  await waitFor(() => !!paperclip(rowFor(el, '5')), "the first account's paperclip");
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ Messages: [{ ...message('5'), HasAttachments: false }] }), { status: 200 }));
  window.dispatchEvent(new Event('user-logged-in'));
  el.messages = [thread()];
  await flush();
  await click(caret(), el);
  await click(caret(), el);
  expect(threadCalls()).toBe(2);
  await waitFor(() => !!rowFor(el, '5') && !paperclip(rowFor(el, '5')), "the new account's row without the old attachment");
});

it("ignores a previous visit's late answer after the same folder is opened again", async () => {
  let releaseOld!: (response: Response) => void;
  let inboxReads = 0;
  fetchMock.mockImplementation(async (url: string) => {
    if (String(url).endsWith('/INBOX/messages/9/thread') && ++inboxReads === 1) {
      return await new Promise<Response>(resolve => { releaseOld = resolve; });
    }
    const mailbox = String(url).includes('/Archive/') ? 'Archive' : 'INBOX';
    return new Response(JSON.stringify({ Messages: [{ ...message('5'), Mailbox: mailbox, HasAttachments: false }] }), { status: 200 });
  });
  const thread = (mailbox: string) => ({ ...message('9'), Mailbox: mailbox, BodyStructure: structure, SubMessages: [{ ...message('5'), Mailbox: mailbox }] });
  const el = await mount<El>(TAG, { messages: [thread('INBOX')], currentMailbox: 'INBOX', totalMessages: 1, showSenderAvatars: false });
  const caret = () => rowFor(el, '9').querySelector('.caret-col')!;
  await click(caret(), el);
  await waitFor(() => !!releaseOld, "the first visit's held answer");
  for (const mailbox of ['Archive', 'INBOX']) {
    el.currentMailbox = mailbox;
    el.messages = [thread(mailbox)];
    await flush();
    await click(caret(), el);
    await click(caret(), el);
    await flush();
  }
  expect(inboxReads).toBe(2);
  releaseOld(new Response(JSON.stringify({ Messages: [{ ...message('5'), HasAttachments: true }] }), { status: 200 }));
  await flush();
  await flush();
  expect(paperclip(rowFor(el, '5'))).toBeNull();
});

it('drops attachment metadata when the listed folder has another UIDVALIDITY', async () => {
  const thread = () => ({ ...message('9'), BodyStructure: structure, SubMessages: [message('5')] });
  const el = await mount<El>(TAG, { messages: [thread()], currentMailbox: 'INBOX', listedUIDValidity: 41, totalMessages: 1, showSenderAvatars: false });
  const caret = () => rowFor(el, '9').querySelector('.caret-col')!;
  await click(caret(), el);
  await waitFor(() => !!paperclip(rowFor(el, '5')), 'the original folder attachment');
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ Messages: [{ ...message('5'), HasAttachments: false }] }), { status: 200 }));
  el.listedUIDValidity = 42;
  el.messages = [thread()];
  await flush();
  await click(caret(), el);
  await click(caret(), el);
  expect(threadCalls()).toBe(2);
  await waitFor(() => !!rowFor(el, '5') && !paperclip(rowFor(el, '5')), 'the recreated folder row');
});


it('retries a refused conversation on the next expansion', async () => {
  fetchMock.mockResolvedValueOnce(new Response('{}', { status: 403 }));
  const el = await mount<El>(TAG, {
    messages: [{ ...message('9'), BodyStructure: structure, SubMessages: [message('5')] }],
    currentMailbox: 'INBOX', totalMessages: 1, showSenderAvatars: false,
  });
  const caret = () => rowFor(el, '9').querySelector('.caret-col')!;
  await click(caret(), el);
  await flush();
  expect(paperclip(rowFor(el, '5'))).toBeNull();
  await click(caret(), el);
  await click(caret(), el);
  await waitFor(() => !!paperclip(rowFor(el, '5')), 'the retried conversation attachment');
  expect(threadCalls()).toBe(2);
});

it("does not let an old failure erase the new visit's pending request", async () => {
  let rejectOld!: (error: Error) => void;
  let releaseNew!: (response: Response) => void;
  let inboxReads = 0;
  fetchMock.mockImplementation(async (url: string) => {
    if (String(url).includes('/INBOX/')) {
      inboxReads++;
      if (inboxReads === 1) return await new Promise<Response>((_, reject) => { rejectOld = reject; });
      return await new Promise<Response>(resolve => { releaseNew = resolve; });
    }
    return new Response(JSON.stringify({ Messages: [] }), { status: 200 });
  });
  const thread = (mailbox: string) => ({ ...message('9'), Mailbox: mailbox, BodyStructure: structure, SubMessages: [{ ...message('5'), Mailbox: mailbox }] });
  const el = await mount<El>(TAG, { messages: [thread('INBOX')], currentMailbox: 'INBOX', totalMessages: 1, showSenderAvatars: false });
  const caret = () => rowFor(el, '9').querySelector('.caret-col')!;
  await click(caret(), el);
  await waitFor(() => !!rejectOld, 'the old pending request');
  for (const mailbox of ['Archive', 'INBOX']) {
    el.currentMailbox = mailbox;
    el.messages = [thread(mailbox)];
    await flush();
  }
  await waitFor(() => !!releaseNew, 'the new pending request');
  rejectOld(new Error('the old read failed'));
  await flush();
  await click(caret(), el);
  await click(caret(), el);
  const reads = inboxReads;
  releaseNew(new Response(JSON.stringify({ Messages: [] }), { status: 200 }));
  await flush();
  expect(reads).toBe(2);
});

it('starts a new read when a retained expanded list reconnects after an unfinished read', async () => {
  let releaseOld!: (response: Response) => void;
  fetchMock.mockImplementationOnce(async () => await new Promise<Response>(resolve => { releaseOld = resolve; }));
  const el = await mount<El>(TAG, {
    messages: [{ ...message('9'), BodyStructure: structure, SubMessages: [message('5')] }],
    currentMailbox: 'INBOX', totalMessages: 1, showSenderAvatars: false,
  });
  await click(rowFor(el, '9').querySelector('.caret-col')!, el);
  await waitFor(() => !!releaseOld, 'the unfinished read');
  const parent = el.parentElement!;
  el.remove();
  releaseOld(new Response(JSON.stringify({ Messages: [{ ...message('5'), HasAttachments: false }] }), { status: 200 }));
  await flush();
  parent.append(el);
  await flush();
  await waitFor(() => !!paperclip(rowFor(el, '5')), 'the reconnected conversation attachment');
  expect(threadCalls()).toBe(2);
});
