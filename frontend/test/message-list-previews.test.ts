/**
 * Message previews under the subject. A listing carries the previews the mail
 * server had to hand and marks the rest PreviewPending; the list asks for
 * those after it shows, a few at a time in the background, and draws each in
 * its own direction.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, flush, mount, shadowAll, update, waitFor } from './helpers/dom';
import '../src/components/message-list';
import { PREVIEW_BATCH } from '../src/services/message-previews';

const TAG = 'alps-message-list';

const row = (uid: number, extra: Record<string, unknown> = {}) => ({
  UID: String(uid),
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.test' }], To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
  ...extra,
});

/** Answers preview requests with "text <uid>" (or as answer says), and records each request's UIDs. */
function previewServer(answer: (uids: string[]) => object = (uids) => ({
  Previews: Object.fromEntries(uids.map((uid) => [uid, `text ${uid}`])), Scope: '1', Supported: true,
})) {
  const requests: string[][] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(String(url), 'http://alps.test');
    if (!u.pathname.endsWith('/previews')) return new Response('{}', { status: 200 });
    const uids = u.searchParams.get('uids')!.split(',');
    requests.push(uids);
    return new Response(JSON.stringify(answer(uids)), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
  return requests;
}

async function settle() {
  for (let i = 0; i < 10; i++) await flush();
}

const previewTexts = (el: Element) => shadowAll(el, '.message-preview').map((p) => p.textContent?.trim());

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  cleanup();
});

describe('message previews in the list', () => {
  it('draws the previews a listing carries, in their own direction, and asks for none', async () => {
    const requests = previewServer();
    const el = await mount(TAG, {
      messages: [row(1, { Preview: 'Lunch at noon?' }), row(2, { Preview: 'שלום לכולם' })],
      currentMailbox: 'INBOX', totalMessages: 2, showSenderAvatars: false,
    });
    await settle();
    expect(previewTexts(el)).toEqual(['Lunch at noon?', 'שלום לכולם']);
    for (const p of shadowAll(el, '.message-preview')) expect(p.getAttribute('dir')).toBe('auto');
    expect(requests).toEqual([]);
  });

  it('asks for pending previews in small batches and draws them', async () => {
    const requests = previewServer();
    const count = PREVIEW_BATCH * 2 + 1;
    const messages = Array.from({ length: count }, (_, i) => row(i + 1, { PreviewPending: true }));
    const el = await mount(TAG, { messages, currentMailbox: 'INBOX', totalMessages: count, showSenderAvatars: false });
    await waitFor(() => previewTexts(el).length === count, 'every pending preview drawn');
    expect(requests.every((uids) => uids.length <= PREVIEW_BATCH)).toBe(true);
    expect(requests.flat().sort()).toEqual(messages.map((m) => m.UID).sort());
  });

  it('does not ask again in the same folder for a preview the server did not give', async () => {
    const requests = previewServer((uids) => ({ Previews: {}, Scope: '1', Supported: true }));
    const el = await mount(TAG, { messages: [row(1, { PreviewPending: true })], currentMailbox: 'INBOX', totalMessages: 1, showSenderAvatars: false });
    await waitFor(() => requests.length === 1, 'the first request');
    await update(el, { messages: [row(1, { PreviewPending: true })] });
    await settle();
    expect(requests).toHaveLength(1);
    expect(previewTexts(el)).toEqual([]);
  });

  it('stops asking once the server says it has no previews', async () => {
    const requests = previewServer(() => ({ Previews: {}, Scope: '', Supported: false }));
    const el = await mount(TAG, { messages: [row(1, { PreviewPending: true })], currentMailbox: 'INBOX', totalMessages: 1, showSenderAvatars: false });
    await waitFor(() => requests.length === 1, 'the first request');
    await update(el, { messages: [row(1, { PreviewPending: true }), row(2, { PreviewPending: true })] });
    await settle();
    expect(requests).toHaveLength(1);
  });

  it('asks for nothing and draws nothing in the ultra-compact list', async () => {
    const requests = previewServer();
    const el = await mount(TAG, {
      messages: [row(1, { Preview: 'Lunch at noon?' }), row(2, { PreviewPending: true })],
      currentMailbox: 'INBOX', totalMessages: 2, showSenderAvatars: false, densityMode: 'ultra-compact',
    });
    await settle();
    expect(requests).toEqual([]);
    expect(previewTexts(el)).toEqual([]);
  });
});
