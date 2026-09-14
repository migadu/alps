/**
 * Verdicts arrive after the list: listings carry none, because a mail server
 * reads the header from each stored message. The list asks in batches, one
 * request at a time, only about messages that could show a logo, and once.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, click, mount, shadow, shadowAll, update, waitFor } from './helpers/dom';
import { VERDICT_BATCH, type AuthVerdict } from '../src/services/auth-verdicts';
import { encodeMailboxPath } from '../src/utils/folders';
import '../src/components/message-list';

const TAG = 'alps-message-list';
const LOGO = '/bimi/avatar?domain=brand.test';
const pass: AuthVerdict = { HasBimiPotential: true, HasBimiFailed: false };
const fail: AuthVerdict = { HasBimiPotential: false, HasBimiFailed: true };

const sender = (host = 'brand.test') => ({ Name: 'Brand', Mailbox: 'news', Host: host });
const row = (uid: number | string, extra: Record<string, unknown> = {}, from: unknown[] = [sender()]) => ({
  UID: String(uid),
  Flags: ['\\Seen'],
  Envelope: { From: from, To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
  ...extra,
});
const rows = (n: number) => Array.from({ length: n }, (_, i) => row(i + 1));

const avatarSrcs = (el: HTMLElement) => shadowAll(el, 'alps-avatar').map((a) => (a as unknown as { src: string }).src);
const logos = (el: HTMLElement) => avatarSrcs(el).filter(Boolean).length;

/** Stands in for the verdicts endpoint; every other request answers empty. `hold` delays each answer. */
function verdictServer(
  verdict: (uid: string, mailbox: string) => AuthVerdict | undefined = (uid) => (Number(uid) % 2 ? pass : fail),
  scope = () => '1',
  hold: () => Promise<void> = () => Promise.resolve(),
) {
  const asked: string[][] = [];
  const mailboxes: string[] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(String(url), 'http://alps.test');
    if (!u.pathname.endsWith('/verdicts')) return new Response('{}', { status: 200 });
    const uids = u.searchParams.get('uids')!.split(',');
    const mailbox = u.pathname.split('/')[2];
    asked.push(uids);
    mailboxes.push(mailbox);
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((r) => setTimeout(r, 2));
    await hold();
    inFlight--;
    const Verdicts: Record<string, AuthVerdict> = {};
    for (const uid of uids) {
      const v = verdict(uid, mailbox);
      if (v) Verdicts[uid] = v;
    }
    return new Response(JSON.stringify({ Verdicts, Scope: scope() }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
  return { asked, mailboxes, maxInFlight: () => maxInFlight };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  cleanup();
});

describe('verdicts after the list', () => {
  it('shows the list first, then asks in batches, one request at a time', async () => {
    const server = verdictServer();
    const el = await mount(TAG, { messages: rows(25), currentMailbox: 'INBOX', totalMessages: 25 });
    expect(avatarSrcs(el)).toEqual(Array(25).fill(''));

    await waitFor(() => server.asked.flat().length === 25 && logos(el) === 13, 'every verdict answered');

    const batches = Array.from({ length: Math.ceil(25 / VERDICT_BATCH) }, (_, i) => Math.min(VERDICT_BATCH, 25 - i * VERDICT_BATCH));
    expect(server.asked.map((b) => b.length)).toEqual(batches);
    expect(server.maxInFlight()).toBe(1);
    expect(avatarSrcs(el)).toEqual(Array.from({ length: 25 }, (_, i) => ((i + 1) % 2 ? LOGO : '')));
  });

  it('asks in batches small enough that opening a folder waits about a second', () => {
    // A batch of older messages can take about a third of a second per message
    // on the mail server, and a folder opened meanwhile waits for it.
    expect(VERDICT_BATCH).toBeLessThanOrEqual(3);
  });

  it('a reload while verdicts are being asked for waits its turn', async () => {
    const server = verdictServer();
    const el = await mount(TAG, { messages: rows(25), currentMailbox: 'INBOX', totalMessages: 25 });
    await update(el, { messages: rows(30), totalMessages: 30 });

    await waitFor(() => server.asked.flat().length === 30, 'every message asked about');
    expect(server.maxInFlight()).toBe(1);
    expect(new Set(server.asked.flat()).size).toBe(30);
  });

  it("asks nothing while a folder's list is loading, and asks once it has loaded", async () => {
    const server = verdictServer();
    const el = await mount(TAG, { messages: rows(2), currentMailbox: 'INBOX', totalMessages: 2, loading: true });
    await new Promise((r) => setTimeout(r, 20));
    expect(server.asked).toEqual([]);

    await update(el, { loading: false });
    await waitFor(() => server.asked.flat().length === 2 && logos(el) === 1, 'the answers once the list loaded');
  });

  it('a list requested while verdicts are asked for waits for one batch, and the rest follows it', async () => {
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    const server = verdictServer(() => pass, () => '1', () => held);
    const n = 3 * VERDICT_BATCH;
    const el = await mount(TAG, { messages: rows(n), currentMailbox: 'INBOX', totalMessages: n });
    await waitFor(() => server.asked.length === 1, 'the first batch asked');

    await update(el, { loading: true });
    release();
    await waitFor(() => logos(el) === VERDICT_BATCH, "the first batch's answers");
    await new Promise((r) => setTimeout(r, 20));
    expect(server.asked).toHaveLength(1);

    await update(el, { loading: false });
    await waitFor(() => server.asked.flat().length === n && logos(el) === n, 'the rest once the list loaded');
    expect(new Set(server.asked.flat()).size).toBe(n);
    expect(server.maxInFlight()).toBe(1);
  });

  it("does not ask about the previous folder's rows while the new folder's list loads", async () => {
    const server = verdictServer(() => pass);
    const inbox = rows(2).map((m) => ({ ...m, Mailbox: 'INBOX' }));
    const el = await mount(TAG, { messages: inbox, currentMailbox: 'INBOX', totalMessages: 2 });
    await waitFor(() => logos(el) === 2, "INBOX's answers");

    await update(el, { currentMailbox: 'Archive' });
    await new Promise((r) => setTimeout(r, 20));
    expect(server.asked).toHaveLength(1);
    expect(avatarSrcs(el)).toEqual(['', '']);

    const archive = [row(7), row(8)].map((m) => ({ ...m, Mailbox: 'Archive' }));
    await update(el, { messages: archive, totalMessages: 2 });
    await waitFor(() => server.asked.length === 2 && logos(el) === 2, "Archive's answers");
    expect(server.mailboxes).toEqual([encodeMailboxPath('INBOX'), encodeMailboxPath('Archive')]);
    expect(server.asked[1]).toEqual(['7', '8']);
  });

  it('asks a search across mailboxes about each message in its own mailbox', async () => {
    const server = verdictServer((_uid, mailbox) => (mailbox === encodeMailboxPath('INBOX') ? pass : fail));
    const el = await mount(TAG, {
      messages: [{ ...row(1), Mailbox: 'INBOX' }, { ...row(2), Mailbox: 'Lists/Brand news' }],
      currentMailbox: '*',
      totalMessages: 2,
    });
    await waitFor(() => server.asked.length === 2, 'both mailboxes asked');
    expect([...server.mailboxes].sort()).toEqual([encodeMailboxPath('INBOX'), encodeMailboxPath('Lists/Brand news')].sort());
    await waitFor(() => logos(el) === 1, "the INBOX message's logo");
    expect(avatarSrcs(el)).toEqual([LOGO, '']);
  });

  it('asks nothing about a message that could not show a logo', async () => {
    const server = verdictServer();
    await mount(TAG, {
      messages: [
        row(1, {}, [sender('gmail.com')]),
        row(2, {}, [sender(), { Mailbox: 'other', Host: 'brand.test' }]),
        row(3, {}, [{ Name: 'No address' }]),
      ],
      currentMailbox: 'INBOX',
      totalMessages: 3,
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(server.asked).toEqual([]);
  });

  it('a reload asks only about new messages, and keeps the answers it has meanwhile', async () => {
    const server = verdictServer();
    const el = await mount(TAG, { messages: rows(3), currentMailbox: 'INBOX', totalMessages: 3 });
    await waitFor(() => logos(el) === 2, 'the first answers');

    await update(el, { messages: rows(5), totalMessages: 5 });
    expect(logos(el)).toBe(2);
    await waitFor(() => server.asked.flat().length === 5 && logos(el) === 3, 'the new messages answered');
    expect(server.asked[server.asked.length - 1]).toEqual(['4', '5']);
  });

  it("starts over when the mailbox's UIDs name other messages", async () => {
    let scope = 'A';
    const server = verdictServer(() => (scope === 'A' ? pass : fail), () => scope);
    const el = await mount(TAG, { messages: rows(2), currentMailbox: 'INBOX', totalMessages: 2 });
    await waitFor(() => logos(el) === 2, "scope A's answers");

    scope = 'B';
    await update(el, { messages: rows(3), totalMessages: 3 });
    await waitFor(() => server.asked.length === 3 && logos(el) === 0, "scope B's answers for every message");
    expect(server.asked[1]).toEqual(['3']);
    expect([...server.asked[2]].sort()).toEqual(['1', '2']);
  });

  it("asks about an expanded thread's earlier messages when it is expanded", async () => {
    const server = verdictServer((uid) => (uid === '2' ? fail : pass));
    const thread = row(3, { ThreadCount: 3, ThreadUIDs: ['1', '2', '3'], SubMessages: [row(1), row(2)] });
    const el = await mount(TAG, { messages: [thread], currentMailbox: 'INBOX', totalMessages: 1 });
    await waitFor(() => logos(el) === 1, "the thread row's answer");
    expect(server.asked).toEqual([['3']]);

    click(shadow(el, '.caret-col'));
    await waitFor(() => avatarSrcs(el).length === 3 && logos(el) === 2, 'the expanded thread with its answers');
    expect(server.asked).toEqual([['3'], ['1', '2']]);
    expect(avatarSrcs(el)[0]).toBe(LOGO);
    expect(avatarSrcs(el).slice(1).sort()).toEqual(['', LOGO]);
  });

  it("keeps no answer for another mailbox while that mailbox's request is open", async () => {
    verdictServer(() => pass);
    const el = await mount(TAG, { messages: rows(1), currentMailbox: 'INBOX', totalMessages: 1 });
    await waitFor(() => logos(el) === 1, "INBOX's answer");

    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    await update(el, { currentMailbox: 'Archive', messages: rows(1) });
    expect(avatarSrcs(el)).toEqual(['']);
  });

  it('a failed request leaves initials, and the next reload asks again', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 403 })));
    const el = await mount(TAG, { messages: rows(1), currentMailbox: 'INBOX', totalMessages: 1 });
    await new Promise((r) => setTimeout(r, 20));
    expect(avatarSrcs(el)).toEqual(['']);

    const server = verdictServer(() => pass);
    await update(el, { messages: rows(1) });
    await waitFor(() => logos(el) === 1, 'the answer after the reload');
    expect(server.asked).toEqual([['1']]);
  });
});
