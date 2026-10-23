import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageSyncService } from '../src/services/message-sync';

class Channel {
  static open = new Set<Channel>();
  static sent: any[] = [];
  static held: (() => void)[] | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  constructor(readonly name: string) { Channel.open.add(this); }
  postMessage(data: any) {
    Channel.sent.push(data);
    for (const peer of Channel.open) if (peer !== this && peer.name === this.name) {
      const copy = structuredClone(data);
      const deliver = () => { if (Channel.open.has(peer)) peer.onmessage?.({ data: copy } as MessageEvent); };
      if (Channel.held) Channel.held.push(deliver); else queueMicrotask(deliver);
    }
  }
  close() { Channel.open.delete(this); }
}

function locks() {
  let held = false;
  const queue: (() => void)[] = [];
  Object.defineProperty(navigator, 'locks', { configurable: true, value: {
    request(_name: string, options: { signal: AbortSignal }, callback: () => Promise<void>) {
      return new Promise<void>((resolve, reject) => {
        const grant = () => {
          if (options.signal.aborted) { reject(options.signal.reason); queue.shift()?.(); return; }
          held = true;
          Promise.resolve(callback()).then(resolve, reject).finally(() => { held = false; queue.shift()?.(); });
        };
        if (held) queue.push(grant); else grant();
      });
    },
  } });
}

const started: MessageSyncService[] = [];
let fetchMock: ReturnType<typeof vi.fn>;
let state: Record<string, { total: number; unseen: number; uidnext: number; uidvalidity: number }>;
let username: string;
const successes = (svc: MessageSyncService) => {
  const seen: any[] = [];
  svc.addEventListener('sync-success', (e) => seen.push((e as CustomEvent).detail));
  return seen;
};
const service = () => { const svc = new MessageSyncService(); started.push(svc); return svc; };
const statusRequests = () => fetchMock.mock.calls.map((call) => call[0]).filter((url) => url.endsWith('/status'));
async function land(svc: MessageSyncService, mailbox = 'INBOX') {
  await svc.fetch(mailbox, 0, '', false, true);
  await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('BroadcastChannel', Channel);
  locks();
  username = 'ada@example.com';
  state = { INBOX: { total: 1, unseen: 1, uidnext: 2, uidvalidity: 7 }, Work: { total: 2, unseen: 0, uidnext: 3, uidvalidity: 8 } };
  fetchMock = vi.fn(async (url: string) => {
    const name = decodeURIComponent(url.split('/')[2].split(/[?\/]/)[0]);
    const counts = state[name];
    if (url.endsWith('/status')) return new Response(JSON.stringify(counts));
    const listed = (c: typeof counts) => ({ NumMessages: c.total, NumUnseen: c.unseen, UIDNext: c.uidnext, UIDValidity: c.uidvalidity });
    return new Response(JSON.stringify({ Username: username, Total: counts.total,
      Messages: [{ UID: String(counts.uidnext - 1), Envelope: { Subject: username } }],
      Mailbox: listed(counts), Inbox: listed(state.INBOX) }));
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(async () => {
  started.splice(0).forEach((svc) => svc.stop());
  await vi.advanceTimersByTimeAsync(0);
  Channel.open.clear(); Channel.sent = []; Channel.held = null;
  delete (navigator as any).locks;
  vi.unstubAllGlobals(); vi.useRealTimers();
});

describe('shared polling counts', () => {
  it('updates a continuously visible follower across many ticks with one status probe per mailbox and one announcer', async () => {
    const leader = service(), follower = service();
    await land(leader); await land(follower);
    const first = successes(leader), second = successes(follower);
    leader.start(1); follower.start(1);
    await vi.advanceTimersByTimeAsync(0);
    fetchMock.mockClear();
    state.INBOX = { ...state.INBOX, total: 3, unseen: 3, uidnext: 4 };
    await vi.advanceTimersByTimeAsync(20 * 60_000);
    expect(first.at(-1).data.Total).toBe(3);
    expect(second.at(-1).data.Total).toBe(3);
    expect(first.every((event) => event.announce)).toBe(true);
    expect(second.every((event) => event.announce === false)).toBe(true);
    expect(statusRequests()).toHaveLength(20);
    expect(Channel.sent.filter((m) => m.type === 'counts').every((m) => !('Messages' in m))).toBe(true);
  });

  it('checks the visible follower folder in the leader, including same-count arrivals and folder recreation', async () => {
    const leader = service(), follower = service();
    await land(leader); await land(follower, 'Work');
    const second = successes(follower);
    leader.start(1); follower.start(1);
    await vi.advanceTimersByTimeAsync(0);
    fetchMock.mockClear();
    state.Work.uidnext++;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(second.at(-1).data.Messages[0].UID).toBe('3');
    expect(statusRequests()).toEqual(['/mailboxes/INBOX/status', '/mailboxes/Work/status']);
    state.Work.uidvalidity++;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(second).toHaveLength(2);
    expect(second.at(-1).data.Mailbox.UIDValidity).toBe(9);
  });

  it('transfers leadership after stop and closes channels and queued lock requests', async () => {
    const leader = service(), follower = service(), stopped = service();
    await land(leader); await land(follower); await land(stopped);
    leader.start(1); stopped.start(1); follower.start(1);
    stopped.stop(); leader.stop();
    await vi.advanceTimersByTimeAsync(0);
    fetchMock.mockClear();
    state.INBOX.total++;
    const seen = successes(follower);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(statusRequests()).toHaveLength(1);
    expect(seen.at(-1).announce).toBe(true);
    expect(Channel.open.size).toBe(1);
  });

  it('rejects an old session counts message after direct sign-in, including the same account', async () => {
    const leader = service(), follower = service();
    await land(leader); await land(follower);
    leader.start(1); follower.start(1);
    await vi.advanceTimersByTimeAsync(0);
    const watch = Channel.sent.filter((m) => m.type === 'watch').at(-1);
    const stale = { type: 'counts', ...watch, mailbox: 'INBOX', counts: { ...state.INBOX, total: 99 }, inbox: state.INBOX };
    stale.type = 'counts';
    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username } }));
    await land(follower);
    fetchMock.mockClear();
    (follower as any).handlePollMessage({ data: stale });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).not.toHaveBeenCalled();
    (follower as any).handlePollMessage({ data: { ...stale, epoch: (follower as any).sessionEpoch, username: 'other@example.com' } });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not land a follower listing or broadcast leader counts from before a session change', async () => {
    const leader = service(), follower = service();
    await land(leader); await land(follower);
    leader.start(1); follower.start(1);
    await vi.advanceTimersByTimeAsync(0);
    state.INBOX.total++;
    let release!: (r: Response) => void;
    const answer = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => { release = resolve; }));
    await vi.advanceTimersByTimeAsync(60_000);
    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username: 'grace@example.com' } }));
    username = 'grace@example.com';
    const seen = successes(follower);
    release(new Response(JSON.stringify({ total: 99, unseen: 99 })));
    await vi.advanceTimersByTimeAsync(0);
    expect(seen).toEqual([]);
    fetchMock.mockImplementation(answer);
    await land(follower);
    expect(seen.at(-1).data.Username).toBe('grace@example.com');
  });

  it('pauses a hidden follower and checks and subscribes again when shown', async () => {
    const leader = service(), follower = service();
    await land(leader); await land(follower, 'Work');
    leader.start(1); follower.start(1);
    await vi.advanceTimersByTimeAsync(0);
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    fetchMock.mockClear();
    state.Work.total++;
    const seen = successes(follower);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(seen).toEqual([]);
    expect(statusRequests()).toEqual(['/mailboxes/INBOX/status']);
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(seen.at(-1).data.Total).toBe(3);
    state.Work.total++;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(seen.at(-1).data.Total).toBe(4);
    hidden.mockRestore();
  });

  it('drops a late follower listing after account change and never caches its old rows', async () => {
    const leader = service(), follower = service();
    await land(leader); await land(follower, 'Work');
    leader.start(1); follower.start(1);
    await vi.advanceTimersByTimeAsync(0);
    state.Work.total++;
    const normal = fetchMock.getMockImplementation()!;
    let release!: (r: Response) => void;
    fetchMock.mockImplementation((url: string) => url.startsWith('/mailboxes/Work?page=')
      ? new Promise<Response>((resolve) => { release = resolve; }) : normal(url));
    const seen = successes(follower);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(release).toBeTypeOf('function');
    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username: 'grace@example.com' } }));
    release(new Response(JSON.stringify({ Username: 'ada@example.com', Total: 99, Messages: [{ UID: 'private-old-account' }] })));
    await vi.advanceTimersByTimeAsync(0);
    expect(seen).toEqual([]);
    username = 'grace@example.com';
    fetchMock.mockImplementation(normal);
    await land(follower, 'INBOX');
    let finish!: (r: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; }));
    seen.length = 0;
    const back = follower.fetch('Work', 0, '', false, true);
    expect(seen).toEqual([]);
    finish(new Response(JSON.stringify({ Username: username, Messages: [], Total: 0 })));
    await back;
    expect(seen.at(-1).data.Total).toBe(0);
  });

  it('continues visible follower checks without BroadcastChannel and suppresses their announcements', async () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    const leader = service(), follower = service();
    await land(leader); await land(follower);
    leader.start(1); follower.start(1);
    const seen = successes(follower);
    state.INBOX.total++;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(seen.at(-1).data.Total).toBe(2);
    expect(seen.at(-1).announce).toBe(false);
  });

  it('selects one announcer through the channel when Web Locks are unavailable', async () => {
    delete (navigator as any).locks;
    const first = service(), second = service();
    await land(first); await land(second);
    first.start(1); second.start(1);
    await vi.advanceTimersByTimeAsync(0);
    const one = successes(first), two = successes(second);
    state.INBOX.total++;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(one.at(-1).data.Total).toBe(2);
    expect(two.at(-1).data.Total).toBe(2);
    expect([one.at(-1).announce, two.at(-1).announce].filter(Boolean)).toHaveLength(1);
  });

  it('keeps notifications enabled when acquiring a Web Lock fails', async () => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: {
      request: () => Promise.reject(new DOMException('Denied', 'SecurityError')),
    } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const svc = service(); await land(svc);
    svc.start(1);
    await vi.advanceTimersByTimeAsync(0);
    const seen = successes(svc);
    state.INBOX.total++;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(seen.at(-1).announce).toBe(true);
    vi.restoreAllMocks();
  });

  it('continues polling without Web Locks', async () => {
    delete (navigator as any).locks;
    const svc = service(); await land(svc);
    svc.start(1); state.INBOX.total++;
    const seen = successes(svc);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(seen.at(-1).data.Total).toBe(2);
    expect(seen.at(-1).announce).toBe(true);
  });
});
