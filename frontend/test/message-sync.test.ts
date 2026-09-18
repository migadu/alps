/**
 * The mailbox listing, fetched in the foreground and polled in the background.
 *
 * Its whole difficulty is ordering: an answer for a folder the user has left
 * must never be shown, and a poll must never ask for a folder that was just
 * renamed or deleted.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageSyncService } from '../src/services/message-sync';

const listing = (mailbox: string) =>
  new Response(JSON.stringify({ Messages: [{ Mailbox: mailbox }], Total: 1 }), { status: 200, headers: { 'Content-Type': 'application/json' } });

let fetchMock: ReturnType<typeof vi.fn>;

function events(svc: MessageSyncService) {
  const seen: { type: string; detail: any }[] = [];
  for (const type of ['sync-start', 'sync-success', 'sync-error', 'mailbox-not-found', 'labels-success']) {
    svc.addEventListener(type, (e) => seen.push({ type, detail: (e as CustomEvent).detail }));
  }
  return seen;
}

const context = (svc: MessageSyncService) => ({ mailbox: (svc as any).currentMailbox, page: (svc as any).currentPage });

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('where the poll points', () => {
  it('follows a rename of the folder on screen, and of its parent', () => {
    const svc = new MessageSyncService();
    svc.setContext('Work', 0);
    svc.mailboxRenamed('Work', 'Jobs');
    expect(context(svc).mailbox).toBe('Jobs');

    svc.setContext('Work/2024', 3);
    svc.mailboxRenamed('Work', 'Jobs');
    expect(context(svc)).toEqual({ mailbox: 'Jobs/2024', page: 3 });
  });

  it('does not treat a shared prefix as a parent', () => {
    const svc = new MessageSyncService();
    svc.setContext('Workshop', 0);
    svc.mailboxRenamed('Work', 'Jobs');
    expect(context(svc).mailbox).toBe('Workshop');
  });

  it('falls back to the Inbox when the folder on screen, or its parent, is deleted', () => {
    const svc = new MessageSyncService();
    svc.setContext('Arch/2024', 4);
    svc.mailboxDeleted('Arch');
    expect(context(svc)).toEqual({ mailbox: 'INBOX', page: 0 });

    svc.setContext('Archive', 2);
    svc.mailboxDeleted('Arch');
    expect(context(svc)).toEqual({ mailbox: 'Archive', page: 2 });
  });
});

describe('fetch', () => {
  it('asks for the page, query and refresh it was given', async () => {
    fetchMock.mockResolvedValue(listing('INBOX'));
    const svc = new MessageSyncService();
    const pending = svc.fetch('[Gmail]/All Mail', 2, 'from:ada', true);
    await vi.runAllTimersAsync();
    await pending;
    expect(fetchMock.mock.calls[0][0]).toBe('/mailboxes/%255BGmail%255D%252FAll%2520Mail?page=2&query=from%3Aada&refresh=true');
  });

  it('announces the start and then the data', async () => {
    fetchMock.mockResolvedValue(listing('INBOX'));
    const svc = new MessageSyncService();
    const seen = events(svc);
    const pending = svc.fetch('INBOX', 0);
    await vi.runAllTimersAsync();
    await pending;
    expect(seen.map((e) => e.type)).toEqual(['sync-start', 'sync-success']);
    expect(seen[1].detail).toMatchObject({ background: false, data: { Total: 1 } });
  });

  it('shows only the answer for the folder asked for last', async () => {
    let releaseFirst!: (r: Response) => void;
    fetchMock
      .mockImplementationOnce(() => new Promise((resolve) => { releaseFirst = resolve; }))
      .mockResolvedValueOnce(listing('Archive'));
    const svc = new MessageSyncService();
    const seen = events(svc);
    const first = svc.fetch('INBOX', 0);
    const second = svc.fetch('Archive', 0);
    await vi.runAllTimersAsync();
    releaseFirst(listing('INBOX'));
    await vi.runAllTimersAsync();
    await Promise.all([first, second]);
    const successes = seen.filter((e) => e.type === 'sync-success');
    expect(successes.map((e) => e.detail.data.Messages[0].Mailbox)).toEqual(['Archive']);
  });

  it('reports a missing folder, an expired session and a failure distinctly', async () => {
    const svc = new MessageSyncService();
    const seen = events(svc);
    const authErrors: Event[] = [];
    const onAuth = (e: Event) => authErrors.push(e);
    window.addEventListener('auth-error', onAuth);

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));
    await svc.fetch('Gone', 0);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    await svc.fetch('INBOX', 0);
    fetchMock.mockRejectedValue(new TypeError('offline'));
    const failing = svc.fetch('INBOX', 0);
    await vi.runAllTimersAsync();
    await failing;

    window.removeEventListener('auth-error', onAuth);
    expect(seen.filter((e) => e.type !== 'sync-start').map((e) => e.type)).toEqual(['mailbox-not-found', 'sync-error']);
    expect(authErrors.length).toBeGreaterThan(0);
  });
});

describe('the background poll', () => {
  it('refreshes the Inbox\'s and the current folder\'s counts, then the listing', async () => {
    fetchMock.mockImplementation(async (url: string) => (url.includes('/status') ? new Response('{}', { status: 200 }) : listing('Work')));
    const svc = new MessageSyncService();
    const seen = events(svc);
    svc.setContext('Work', 1, 'ada');
    await (svc as any).backgroundSync();
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/INBOX/status', '/mailboxes/Work/status', '/mailboxes/Work?page=1&query=ada']);
    expect(seen.map((e) => e.type)).toEqual(['sync-success']);
    expect(seen[0].detail.background).toBe(true);
  });

  it('drops its answer when the user has since opened another folder', async () => {
    let releaseListing!: (r: Response) => void;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/status')) return Promise.resolve(new Response('{}', { status: 200 }));
      if (url.startsWith('/mailboxes/INBOX?')) return new Promise((resolve) => { releaseListing = resolve; });
      return Promise.resolve(listing('Archive'));
    });
    const svc = new MessageSyncService();
    const seen = events(svc);
    const poll = (svc as any).backgroundSync();
    await vi.advanceTimersByTimeAsync(0);
    const foreground = svc.fetch('Archive', 0);
    await vi.runAllTimersAsync();
    releaseListing(listing('INBOX'));
    await vi.runAllTimersAsync();
    await Promise.all([poll, foreground]);
    const shown = seen.filter((e) => e.type === 'sync-success').map((e) => e.detail.data.Messages[0].Mailbox);
    expect(shown).toEqual(['Archive']);
  });

  it('reports a folder that disappeared instead of failing quietly', async () => {
    fetchMock.mockImplementation(async (url: string) => (url.includes('/status') ? new Response('{}', { status: 200 }) : new Response('not found', { status: 404 })));
    const svc = new MessageSyncService();
    const seen = events(svc);
    svc.setContext('Gone', 0);
    await (svc as any).backgroundSync();
    expect(seen.map((e) => e.type)).toEqual(['mailbox-not-found']);
  });

  it('runs on its interval until stopped, and not at all for a zero interval', async () => {
    fetchMock.mockImplementation(async (url: string) => (url.includes('/status') ? new Response('{}', { status: 200 }) : listing('INBOX')));
    const svc = new MessageSyncService();
    svc.start(1);
    await vi.advanceTimersByTimeAsync(60_000);
    const afterOne = fetchMock.mock.calls.length;
    expect(afterOne).toBeGreaterThan(0);
    svc.stop();
    await vi.advanceTimersByTimeAsync(180_000);
    expect(fetchMock.mock.calls.length).toBe(afterOne);

    svc.start(0);
    await vi.advanceTimersByTimeAsync(600_000);
    expect(fetchMock.mock.calls.length).toBe(afterOne);
  });

  it('re-reads only the folder being viewed', () => {
    const svc = new MessageSyncService();
    const sync = vi.spyOn(svc, 'sync').mockImplementation(() => {});
    svc.setContext('Work', 0);
    svc.syncIfViewing('Archive');
    expect(sync).not.toHaveBeenCalled();
    svc.syncIfViewing('Work');
    expect(sync).toHaveBeenCalledTimes(1);
  });
});

/**
 * The folder list read on its own, for the verbs that change which folders
 * exist rather than what is inside one.
 */
describe('syncLabels', () => {
  const folders = (...names: string[]) =>
    new Response(JSON.stringify({ Mailboxes: names.map((Name) => ({ Name })) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  const named = (seen: { detail: any }[]) => seen.map((e) => e.detail.mailboxes.map((m: any) => m.Name));

  it('asks for the list alone and announces it on its own event', async () => {
    const svc = new MessageSyncService();
    const seen = events(svc);
    fetchMock.mockResolvedValueOnce(folders('INBOX', 'Jobs'));

    await svc.syncLabels();

    // No page, no query, no refresh: the whole request is the folder list.
    expect(fetchMock.mock.calls).toEqual([['/mailboxes', expect.anything()]]);
    // Not `sync-success`, which would carry this to the arrival chime and to
    // the list's own loaded/failed state. Not `sync-start` either: nothing is
    // waiting on it, so nothing should spin.
    expect(seen.map((e) => e.type)).toEqual(['labels-success']);
    expect(named(seen)).toEqual([['INBOX', 'Jobs']]);
  });

  it('leaves the poll pointed where it was', async () => {
    const svc = new MessageSyncService();
    svc.setContext('Archive', 3, 'from:ana');
    fetchMock.mockResolvedValueOnce(folders('INBOX'));

    await svc.syncLabels();

    // It read no messages, so it has no view to re-point and none to supersede.
    expect(context(svc)).toEqual({ mailbox: 'Archive', page: 3 });
    expect((svc as any).currentQuery).toBe('from:ana');
  });

  it('drops an answer that a later read has overtaken', async () => {
    const svc = new MessageSyncService();
    const seen = events(svc);
    let releaseFirst: (r: Response) => void = () => {};
    fetchMock
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { releaseFirst = resolve; }))
      .mockResolvedValueOnce(folders('INBOX', 'Jobs'));

    const first = svc.syncLabels();
    const second = svc.syncLabels();
    await second;
    releaseFirst(folders('INBOX', 'Work'));
    await first;

    // Rename twice in quick succession and the older tree must not land on top
    // of the newer one.
    expect(named(seen)).toEqual([['INBOX', 'Jobs']]);
  });

  it('says nothing to the page when the read fails', async () => {
    const svc = new MessageSyncService();
    const seen = events(svc);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

    await expect(svc.syncLabels()).resolves.toBeUndefined();

    // The verb that called this already told the user how it went. A stale
    // count in the sidebar until the next poll is the whole of the damage.
    expect(seen).toEqual([]);
  });

  it('reports an expired session the way every other read does', async () => {
    const svc = new MessageSyncService();
    const seen = events(svc);
    const authErrors: Event[] = [];
    const onAuth = (e: Event) => authErrors.push(e);
    window.addEventListener('auth-error', onAuth);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await svc.syncLabels();
    window.removeEventListener('auth-error', onAuth);

    // Twice over, as every mail read here does: `fetchWithTimeout` announces it
    // for the plugins' sake and the service announces it again. app-root's
    // handler is idempotent.
    expect(authErrors.length).toBeGreaterThan(0);
    expect(seen).toEqual([]);
  });
});
