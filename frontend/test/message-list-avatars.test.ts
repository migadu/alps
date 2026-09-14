/**
 * Sender avatars are a preference. Off, the list draws none and asks the mail
 * server for no verdicts, since a verdict only picks the logo an avatar shows.
 * The ultra-compact list draws no avatars either, so it asks for none.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, flush, mount, shadowAll, update, waitFor } from './helpers/dom';
import '../src/components/message-list';

const TAG = 'alps-message-list';

const row = (uid: number) => ({
  UID: String(uid),
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Brand', Mailbox: 'news', Host: 'brand.test' }], To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
});
const list = { messages: [row(1), row(2)], currentMailbox: 'INBOX', totalMessages: 2 };

/** Answers every verdict request with a pass, and records the UIDs asked about. */
function verdictServer() {
  const asked: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(String(url), 'http://alps.test');
    if (!u.pathname.endsWith('/verdicts')) return new Response('{}', { status: 200 });
    const uids = u.searchParams.get('uids')!.split(',');
    asked.push(...uids);
    const Verdicts = Object.fromEntries(uids.map((uid) => [uid, { HasBimiPotential: true, HasBimiFailed: false }]));
    return new Response(JSON.stringify({ Verdicts, Scope: '1' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
  return asked;
}

async function settle() {
  for (let i = 0; i < 10; i++) await flush();
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  cleanup();
});

describe('sender avatars in the list', () => {
  it('draws none and asks for no verdicts when turned off', async () => {
    const asked = verdictServer();
    const el = await mount(TAG, { ...list, showSenderAvatars: false });
    await settle();
    expect(shadowAll(el, '.avatar-stack')).toHaveLength(0);
    expect(shadowAll(el, 'alps-avatar')).toHaveLength(0);
    expect(asked).toEqual([]);
  });

  it('draws them, and asks for their verdicts, once turned back on', async () => {
    const asked = verdictServer();
    const el = await mount(TAG, { ...list, showSenderAvatars: false });
    await settle();
    await update(el, { showSenderAvatars: true });
    await waitFor(() => asked.length === 2 && shadowAll(el, 'alps-avatar').length === 2, 'avatars and their verdicts');
  });

  it('asks for no verdicts in the ultra-compact list, and does once the list has avatars again', async () => {
    const asked = verdictServer();
    const el = await mount(TAG, { ...list, densityMode: 'ultra-compact' });
    await settle();
    expect(asked).toEqual([]);
    await update(el, { densityMode: 'compact' });
    await waitFor(() => asked.length === 2, 'verdicts for the compact list');
  });
});
