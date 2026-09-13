/**
 * The earlier messages of an expanded thread: the list carries no verdict for
 * them, so the list asks, and draws a logo only where the answer allows one.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, click, mount, shadow, shadowAll, update, waitFor } from './helpers/dom';
import '../src/components/message-list';

const brand = { Name: 'Brand', Mailbox: 'news', Host: 'brand.test' };
const LOGO = '/bimi/avatar?domain=brand.test';

const row = (uid: string, extra: Record<string, unknown> = {}) => ({
  UID: uid,
  Flags: ['\\Seen'],
  Envelope: { From: [brand], To: [], Cc: [], Subject: 'launch', Date: '2026-09-01T10:00:00Z' },
  ...extra,
});

const thread = () =>
  row('3', { HasBimiPotential: true, ThreadCount: 3, ThreadUIDs: ['1', '2', '3'], SubMessages: [row('1'), row('2')] });

const avatarSrcs = (el: HTMLElement) => shadowAll(el, 'alps-avatar').map((a) => (a as unknown as { src: string }).src);

function stubVerdicts(verdicts: Record<string, { HasBimiPotential: boolean; HasBimiFailed: boolean }>) {
  const calls: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (String(url).includes('/verdicts')) calls.push(String(url));
    return new Response(JSON.stringify({ Verdicts: verdicts }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  cleanup();
});

describe('verdicts for the earlier messages of a thread', () => {
  it('asks nothing for a collapsed thread', async () => {
    const calls = stubVerdicts({});
    const el = await mount('alps-message-list', { messages: [thread()], currentMailbox: 'INBOX', totalMessages: 1 });
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toEqual([]);
    expect(avatarSrcs(el)).toEqual([LOGO]);
  });

  it('asks when the thread is expanded, and draws a logo only for a message that passed', async () => {
    const calls = stubVerdicts({
      '1': { HasBimiPotential: true, HasBimiFailed: false },
      '2': { HasBimiPotential: false, HasBimiFailed: true },
    });
    const el = await mount('alps-message-list', { messages: [thread()], currentMailbox: 'INBOX', totalMessages: 1 });

    click(shadow(el, '.caret-col'));
    await waitFor(() => avatarSrcs(el).length === 3 && avatarSrcs(el).filter(Boolean).length === 2, 'the expanded thread with its verdicts');

    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('/verdicts?uids=1,2');
    const srcs = avatarSrcs(el);
    expect(srcs[0]).toBe(LOGO);
    expect(srcs.slice(1).sort()).toEqual(['', LOGO]);
  });

  it('asks again when the list reloads, and keeps no answer for another mailbox', async () => {
    const calls = stubVerdicts({ '1': { HasBimiPotential: true, HasBimiFailed: false }, '2': { HasBimiPotential: true, HasBimiFailed: false } });
    const el = await mount('alps-message-list', { messages: [thread()], currentMailbox: 'INBOX', totalMessages: 1 });
    click(shadow(el, '.caret-col'));
    await waitFor(() => calls.length === 1 && avatarSrcs(el).filter(Boolean).length === 3, 'the first answer');

    await update(el, { messages: [thread()] });
    await waitFor(() => calls.length === 2, 'a second request after the reload');

    // Archive's answer never arrives: until it does, its rows must not wear
    // INBOX's.
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    await update(el, { currentMailbox: 'Archive', messages: [thread()] });
    expect(avatarSrcs(el)).toHaveLength(3);
    expect(avatarSrcs(el).filter(Boolean)).toHaveLength(1);
  });
});
