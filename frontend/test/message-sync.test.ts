/**
 * The mailbox listing, fetched in the foreground and polled in the background.
 *
 * Its whole difficulty is ordering: an answer for a folder the user has left
 * must never be shown, and a poll must never ask for a folder that was just
 * renamed or deleted.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageSyncService } from '../src/services/message-sync';
import { messageKey } from '../src/utils/message-key';

const listing = (mailbox: string) =>
  new Response(JSON.stringify({ Messages: [{ Mailbox: mailbox }], Total: 1 }), { status: 200, headers: { 'Content-Type': 'application/json' } });

let fetchMock: ReturnType<typeof vi.fn>;

function events(svc: MessageSyncService) {
  const seen: { type: string; detail: any }[] = [];
  for (const type of ['sync-start', 'sync-success', 'sync-error', 'sync-unchanged', 'mailbox-not-found', 'labels-success']) {
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

  it('stamps the answer with the folder it was read from', async () => {
    fetchMock.mockResolvedValue(listing('[Gmail]/Sent Mail'));
    const svc = new MessageSyncService();
    const seen = events(svc);
    const pending = svc.fetch('[Gmail]/Sent Mail', 0);
    await vi.runAllTimersAsync();
    await pending;
    expect(seen.find((e) => e.type === 'sync-success')!.detail.data.ListedMailbox).toBe('[Gmail]/Sent Mail');
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

  it('reports a server error as a failure, not as an empty folder', async () => {
    // A 500 with a JSON body, as the server answers when its IMAP connection
    // fails. Announced as data, it had no Messages, and the page emptied the
    // folder on screen.
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'failed to list messages' }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
    const svc = new MessageSyncService();
    const seen = events(svc);
    const failing = svc.fetch('INBOX', 0);
    await vi.runAllTimersAsync();
    await failing;
    expect(seen.filter((e) => e.type !== 'sync-start').map((e) => e.type)).toEqual(['sync-error']);
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

  it('stamps its answer with the folder it read, not the one the context names by then', async () => {
    let releaseListing!: (r: Response) => void;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/status')) return Promise.resolve(new Response('{}', { status: 200 }));
      return new Promise((resolve) => { releaseListing = resolve; });
    });
    const svc = new MessageSyncService();
    const seen = events(svc);
    svc.setContext('Work', 0);
    const poll = (svc as any).backgroundSync();
    await vi.advanceTimersByTimeAsync(0);
    svc.setContext('Sent', 0);
    releaseListing(listing('Work'));
    await poll;
    expect(seen.find((e) => e.type === 'sync-success')!.detail.data.ListedMailbox).toBe('Work');
  });

  it('leaves the rows on screen when the server answers with an error', async () => {
    fetchMock.mockImplementation(async (url: string) => (url.includes('/status')
      ? new Response('{}', { status: 200 })
      : new Response(JSON.stringify({ error: 'failed to list messages' }), { status: 502, headers: { 'Content-Type': 'application/json' } })));
    const svc = new MessageSyncService();
    const seen = events(svc);
    svc.setContext('INBOX', 0);
    // A 502 is retried after a pause before it counts.
    const poll = (svc as any).backgroundSync();
    await vi.runAllTimersAsync();
    expect(await poll).toBe(false);
    expect(seen.map((e) => e.type)).toEqual([]);
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

describe.each(['session-cleared', 'user-logged-in'])('across %s', (event) => {
  it('drops a folder list read for the session that ended', async () => {
    const svc = new MessageSyncService();
    const seen = events(svc);
    let release: (r: Response) => void = () => {};
    fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => { release = resolve; }));

    // A rename re-reads the folder list, and the user signs out before it answers.
    const read = svc.syncLabels();
    window.dispatchEvent(new CustomEvent(event));
    release(new Response(JSON.stringify({ Mailboxes: [{ Name: 'INBOX' }, { Name: 'Payroll' }] }), { status: 200 }));
    await read;

    // The next user's mail page listens on this same service.
    expect(seen).toEqual([]);
  });

  it('drops a listing read for the session that ended, and holds no rows for the next', async () => {
    const svc = new MessageSyncService();
    const seen = events(svc);
    let release: (r: Response) => void = () => {};
    fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => { release = resolve; }));

    const read = svc.fetch('INBOX', 0, '', false, true);
    window.dispatchEvent(new CustomEvent(event));
    release(listing('INBOX'));
    await read;

    expect(seen.map((e) => e.type)).toEqual(['sync-start']);
    expect((svc as any).listed).toBe(false);
  });
});

it('never paints or caches a previous account listing or labels after direct sign-in', async () => {
  const svc = new MessageSyncService();
  const seen = events(svc);
  let oldListing!: (r: Response) => void;
  let oldLabels!: (r: Response) => void;
  fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => { oldListing = resolve; }))
    .mockImplementationOnce(() => new Promise<Response>((resolve) => { oldLabels = resolve; }));
  const listingRead = svc.fetch('Archive', 0, '', false, true);
  const labelsRead = svc.syncLabels();
  window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username: 'grace@example.com' } }));
  oldListing(new Response(JSON.stringify({ Username: 'ada@example.com', Messages: [{ UID: '1', Envelope: { Subject: 'Private Ada payroll' } }], Total: 1 })));
  oldLabels(new Response(JSON.stringify({ Mailboxes: [{ Name: 'Private Ada payroll' }] })));
  await Promise.all([listingRead, labelsRead]);
  expect(seen.map((e) => e.type)).toEqual(['sync-start']);

  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ Username: 'grace@example.com', Total: 0, Messages: [] })));
  await svc.fetch('INBOX', 0, '', false, true);
  seen.length = 0;
  let release!: (r: Response) => void;
  fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => { release = resolve; }));
  const back = svc.fetch('Archive', 0, '', false, true);
  expect(seen.map((e) => e.type)).toEqual(['sync-start']);
  release(new Response(JSON.stringify({ Total: 0, Messages: [] })));
  await back;
  expect(seen.at(-1)?.detail.data).toMatchObject({ Total: 0, Messages: [] });
  expect(seen.at(-1)?.detail.data.Mailboxes).toBeUndefined();
});

describe('the check-for-new-mail button', () => {
  /** A landed foreground read, which is what a check checks against. */
  async function landed(svc: MessageSyncService, mailbox = 'INBOX', page = 0, query = '') {
    fetchMock.mockResolvedValue(listing(mailbox));
    const pending = svc.fetch(mailbox, page, query);
    await vi.runAllTimersAsync();
    await pending;
    fetchMock.mockReset();
  }

  const quiet = () => fetchMock.mockImplementation(async (url: string) =>
    (url.includes('/status') ? new Response('{}', { status: 200 }) : listing('Work')));

  it('asks the counts first and never re-lists the folder from IMAP', async () => {
    const svc = new MessageSyncService();
    await landed(svc, 'Work');
    quiet();
    await svc.check('Work', 0);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/INBOX/status', '/mailboxes/Work/status', '/mailboxes/Work?page=0']);
  });

  it('asks no counts of a search of all mailboxes, of which the server has none', async () => {
    const svc = new MessageSyncService();
    await landed(svc, '*', 0, 'looms');
    quiet();
    await svc.check('*', 0, 'looms');
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/INBOX/status', '/mailboxes/*?page=0&query=looms']);
  });

  it('announces itself in the background, so the rows do not dim', async () => {
    const svc = new MessageSyncService();
    await landed(svc, 'Work');
    const seen = events(svc);
    quiet();
    await svc.check('Work', 0);
    expect(seen.map((e) => e.type)).toEqual(['sync-start', 'sync-success']);
    expect(seen.every((e) => e.detail.background === true)).toBe(true);
  });

  it('ends out loud when the re-read fails, which a poll does not', async () => {
    const svc = new MessageSyncService();
    await landed(svc, 'Work');
    const seen = events(svc);
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/status')) return new Response('{}', { status: 200 });
      throw new TypeError('offline');
    });
    const checking = svc.check('Work', 0);
    await vi.runAllTimersAsync();
    await checking;
    expect(seen.map((e) => e.type)).toEqual(['sync-start', 'sync-error']);
    expect(seen[1].detail.background).toBe(true);
  });

  it('ends out loud when only the counts fail', async () => {
    const svc = new MessageSyncService();
    await landed(svc);
    const seen = events(svc);
    fetchMock.mockRejectedValue(new TypeError('offline'));
    const checking = svc.check('INBOX', 0);
    await vi.runAllTimersAsync();
    await checking;
    expect(seen.map((e) => e.type)).toEqual(['sync-start', 'sync-error']);
  });

  it('is a foreground fetch when no read of the view has landed', async () => {
    const svc = new MessageSyncService();
    const seen = events(svc);
    fetchMock.mockResolvedValue(listing('INBOX'));
    const pending = svc.check('INBOX', 0);
    await vi.runAllTimersAsync();
    await pending;
    expect(seen[0].detail.background).toBe(false);
    expect(fetchMock.mock.calls[0][0]).toBe('/mailboxes/INBOX?page=0&refresh=true');
  });

  it('is a foreground fetch after a load that failed', async () => {
    const svc = new MessageSyncService();
    fetchMock.mockRejectedValue(new TypeError('offline'));
    const failing = svc.fetch('Work', 0);
    await vi.runAllTimersAsync();
    await failing;
    fetchMock.mockReset();

    const seen = events(svc);
    fetchMock.mockResolvedValue(listing('Work'));
    const pending = svc.check('Work', 0);
    await vi.runAllTimersAsync();
    await pending;
    expect(seen[0].detail.background).toBe(false);
  });

  it('is a foreground fetch for a view other than the one held', async () => {
    const svc = new MessageSyncService();
    await landed(svc, 'Work', 0, 'ada');
    const seen = events(svc);
    fetchMock.mockResolvedValue(listing('Work'));
    const pending = svc.check('Work', 0);
    await vi.runAllTimersAsync();
    await pending;
    expect(seen[0].detail.background).toBe(false);
  });

  it('is a foreground fetch from a later page, which lands on the first', async () => {
    const svc = new MessageSyncService();
    await landed(svc, 'Work', 3);
    const seen = events(svc);
    fetchMock.mockResolvedValue(listing('Work'));
    const pending = svc.check('Work', 0);
    await vi.runAllTimersAsync();
    await pending;
    expect(seen[0].detail.background).toBe(false);
    expect(fetchMock.mock.calls[0][0]).toBe('/mailboxes/Work?page=0&refresh=true');
    expect(context(svc)).toEqual({ mailbox: 'Work', page: 0 });
  });
});

describe('the re-read after a write', () => {
  // Not a refresh: the server has already dropped what the write changed, and
  // read the counts of the folders it touched. A refresh dropped its folder
  // list and every folder's counts on top, and read them all again.
  it('reads the folder without a refresh, and asks the page not to dim for it', async () => {
    fetchMock.mockResolvedValue(listing('Work'));
    const svc = new MessageSyncService();
    svc.setContext('Work', 2, 'ada');
    const seen = events(svc);

    svc.sync();
    await vi.runAllTimersAsync();

    // The counts first, as the poll asks them: a refresh also caught mail that
    // arrived meanwhile, and a folder whose counts moved is read again.
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/INBOX/status', '/mailboxes/Work/status', '/mailboxes/Work?page=2&query=ada']);
    expect(seen.map((e) => e.type)).toEqual(['sync-start', 'sync-success']);
    expect(seen.every((e) => e.detail.quiet === true && e.detail.background === false)).toBe(true);
  });

  it('skips the 200ms the dim is held for, which it does not raise', async () => {
    // A fresh answer per call: a Response's body is read once.
    fetchMock.mockImplementation(async () => listing('Work'));
    const svc = new MessageSyncService();
    const seen = events(svc);

    svc.sync();
    await vi.advanceTimersByTimeAsync(0);
    expect(seen.map((e) => e.type)).toEqual(['sync-start', 'sync-success']);

    // The same answer, read as a navigation, is still held back for the floor.
    const navigating = events(svc);
    const pending = svc.fetch('Work', 0);
    await vi.advanceTimersByTimeAsync(0);
    expect(navigating.map((e) => e.type)).toEqual(['sync-start']);
    await vi.runAllTimersAsync();
    await pending;
    expect(navigating.map((e) => e.type)).toEqual(['sync-start', 'sync-success']);
  });

  it('is made once for the writes of one gesture, when they are done', async () => {
    fetchMock.mockImplementation(async () => listing('Work'));
    const svc = new MessageSyncService();
    svc.setContext('Work', 0);

    let finish!: () => void;
    const gesture = svc.afterWrites(async () => {
      svc.sync();
      svc.sync();
      await new Promise<void>((resolve) => { finish = resolve; });
      svc.sync();
      return 'filed';
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).not.toHaveBeenCalled();

    finish();
    expect(await gesture).toBe('filed');
    await vi.runAllTimersAsync();
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/INBOX/status', '/mailboxes/Work/status', '/mailboxes/Work?page=0']);
  });

  it('is not made for writes that asked for none, and is made when one fails', async () => {
    fetchMock.mockImplementation(async () => listing('Work'));
    const svc = new MessageSyncService();
    svc.setContext('Work', 0);

    await svc.afterWrites(async () => {});
    await vi.runAllTimersAsync();
    expect(fetchMock).not.toHaveBeenCalled();

    await expect(svc.afterWrites(async () => {
      svc.sync();
      throw new Error('refused');
    })).rejects.toThrow('refused');
    await vi.runAllTimersAsync();
    expect(fetchMock.mock.calls.map((c) => c[0]).filter((url) => url.includes('?page='))).toEqual(['/mailboxes/Work?page=0']);
  });

  it('is a refresh when a write that failed part of the way asked for one', async () => {
    fetchMock.mockImplementation(async () => listing('Work'));
    const svc = new MessageSyncService();
    svc.setContext('Work', 0);

    await svc.afterWrites(async () => {
      svc.sync();
      svc.sync({ refresh: true });
      svc.sync();
    });
    await vi.runAllTimersAsync();
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/Work?page=0&refresh=true']);

    svc.sync({ refresh: true });
    await vi.runAllTimersAsync();
    expect(fetchMock.mock.calls.map((c) => c[0]).at(-1)).toBe('/mailboxes/Work?page=0&refresh=true');
  });
});

describe('listings kept in memory', () => {
  const page = (mailbox: string, uids: string[], mailboxes: any[] = [{ Name: mailbox }]) =>
    new Response(JSON.stringify({ Mailboxes: mailboxes, Messages: uids.map((UID) => ({ UID, Flags: [] })), Total: uids.length }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });

  /** Reads INBOX, then Archive, so the INBOX listing is one kept. */
  async function keptInbox(svc: MessageSyncService) {
    fetchMock.mockResolvedValueOnce(page('INBOX', ['1'], [{ Name: 'INBOX', Unseen: 1 }]));
    fetchMock.mockResolvedValueOnce(page('Archive', ['7'], [{ Name: 'INBOX', Unseen: 0 }]));
    const first = svc.fetch('INBOX', 0);
    await vi.runAllTimersAsync();
    await first;
    const second = svc.fetch('Archive', 0);
    await vi.runAllTimersAsync();
    await second;
  }

  it('shows a view read before at once, without the dim, then its answer', async () => {
    const svc = new MessageSyncService();
    await keptInbox(svc);
    const seen = events(svc);
    let answer!: (r: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { answer = resolve; }));

    const back = svc.fetch('INBOX', 0);
    expect(seen.map((e) => e.type)).toEqual(['sync-start', 'sync-success']);
    expect(seen[0].detail).toMatchObject({ background: false, quiet: true });
    expect(seen[1].detail).toMatchObject({ background: false, quiet: true, kept: true });
    expect(seen[1].detail.data.Messages.map((m: any) => m.UID)).toEqual(['1']);
    expect(seen[1].detail.data.ListedMailbox).toBe('INBOX');
    // With the folder list the latest answer carried, not the one kept with it.
    expect(seen[1].detail.data.Mailboxes).toEqual([{ Name: 'INBOX', Unseen: 0 }]);

    answer(page('INBOX', ['2', '1']));
    await vi.runAllTimersAsync();
    await back;
    expect(seen.map((e) => e.type)).toEqual(['sync-start', 'sync-success', 'sync-success']);
    expect(seen[2].detail.data.Messages.map((m: any) => m.UID)).toEqual(['2', '1']);
    expect(fetchMock.mock.calls.at(-1)![0]).toBe('/mailboxes/INBOX?page=0');
  });

  it('sends one listing at a time, and a newer one takes the place of one waiting', async () => {
    const svc = new MessageSyncService();
    const seen = events(svc);
    let answer!: (r: Response) => void;
    fetchMock
      .mockImplementationOnce(() => new Promise((resolve) => { answer = resolve; }))
      .mockResolvedValue(page('Trash', ['5']));

    const reads = [svc.fetch('INBOX', 0), svc.fetch('Archive', 0), svc.fetch('Trash', 0)];
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/INBOX?page=0']);

    answer(page('INBOX', ['1']));
    await vi.runAllTimersAsync();
    await Promise.all(reads);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/INBOX?page=0', '/mailboxes/Trash?page=0']);
    const shown = seen.filter((e) => e.type === 'sync-success').map((e) => e.detail.data.ListedMailbox);
    expect(shown).toEqual(['Trash']);
  });

  it('keeps a flag changed on screen in the view kept', async () => {
    const svc = new MessageSyncService();
    await keptInbox(svc);
    window.dispatchEvent(new CustomEvent('external-message-flags-changed', {
      detail: { keys: [messageKey('INBOX', '1')], flag: '\\Seen', action: 'add' },
    }));
    const seen = events(svc);
    fetchMock.mockImplementationOnce(() => new Promise(() => {}));
    void svc.fetch('INBOX', 0);
    expect(seen[1].detail.data.Messages[0].Flags).toEqual(['\\Seen']);
  });

  it('keeps nothing past a write, a refresh, other listing settings or a sign-out', async () => {
    // What is asked after the two reads is never answered.
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const kept = async (svc: MessageSyncService, before: () => void) => {
      await keptInbox(svc);
      before();
      const seen = events(svc);
      void svc.fetch('INBOX', 0);
      return seen.some((e) => e.detail?.kept);
    };
    expect(await kept(new MessageSyncService(), () => {})).toBe(true);

    const written = new MessageSyncService();
    expect(await kept(written, () => written.sync())).toBe(false);

    const sorted = new MessageSyncService();
    sorted.setListingSettings('desc');
    expect(await kept(sorted, () => sorted.setListingSettings('asc'))).toBe(false);

    const signedOut = new MessageSyncService();
    expect(await kept(signedOut, () => window.dispatchEvent(new CustomEvent('session-cleared')))).toBe(false);

    const refreshed = new MessageSyncService();
    await keptInbox(refreshed);
    const seen = events(refreshed);
    void refreshed.fetch('INBOX', 0, '', true);
    expect(seen.some((e) => e.detail?.kept)).toBe(false);
  });

  it('keeps nothing past a rename or a delete of a folder, a sign-in, or an autosave in the folder', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const kept = async (before: (svc: MessageSyncService) => void) => {
      const svc = new MessageSyncService();
      await keptInbox(svc);
      before(svc);
      const seen = events(svc);
      void svc.fetch('INBOX', 0);
      return seen.some((e) => e.detail?.kept);
    };
    expect(await kept((svc) => svc.mailboxRenamed('Work', 'Jobs'))).toBe(false);
    expect(await kept((svc) => svc.mailboxDeleted('Work'))).toBe(false);
    expect(await kept(() => window.dispatchEvent(new CustomEvent('user-logged-in', { detail: {} })))).toBe(false);
    expect(await kept(() => window.dispatchEvent(new CustomEvent('draft-autosaved', { detail: { mailbox: 'INBOX' } })))).toBe(false);
    expect(await kept(() => window.dispatchEvent(new CustomEvent('draft-autosaved', { detail: { mailbox: 'Drafts' } })))).toBe(true);
  });

  it('drops a folder that answers that it is gone', async () => {
    const svc = new MessageSyncService();
    await keptInbox(svc);
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 404 }));
    const gone = svc.fetch('INBOX', 0);
    await vi.runAllTimersAsync();
    await gone;

    fetchMock.mockImplementation(() => new Promise(() => {}));
    const seen = events(svc);
    void svc.fetch('INBOX', 0);
    expect(seen.some((e) => e.detail?.kept)).toBe(false);
  });

  it('keeps the 30 views read last, and hands each out as a copy of its own', async () => {
    const svc = new MessageSyncService();
    fetchMock.mockImplementation(async (url: string) => page(String(url), ['1']));
    for (let n = 0; n <= 30; n++) {
      const read = svc.fetch(`F${n}`, 0);
      await vi.runAllTimersAsync();
      await read;
    }
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const shown = (mailbox: string) => {
      const seen = events(svc);
      void svc.fetch(mailbox, 0);
      return seen.find((e) => e.detail?.kept)?.detail.data;
    };
    expect(shown('F0')).toBeUndefined();
    const first = shown('F1');
    expect(first.Messages.map((m: any) => m.UID)).toEqual(['1']);
    first.Messages.push({ UID: '2' });
    first.Messages[0].Flags.push('\\Flagged');
    const again = shown('F1');
    expect(again.Messages).toEqual([{ UID: '1', Flags: [] }]);
  });

  /**
   * A view shown from memory can be used at once, while its quiet re-read is
   * out, and the server reads a write sent then after that listing.
   */
  describe('a change made while its listing is out', () => {
    async function heldRead(svc: MessageSyncService) {
      let answer!: (r: Response) => void;
      fetchMock.mockImplementationOnce(() => new Promise((resolve) => { answer = resolve; }));
      const seen = events(svc);
      const read = svc.fetch('INBOX', 0);
      await vi.advanceTimersByTimeAsync(0);
      return {
        seen,
        async land(response: Response) {
          answer(response);
          await vi.runAllTimersAsync();
          await read;
          return seen.filter((e) => e.type === 'sync-success').at(-1)!.detail.data;
        },
      };
    }

    it('is played over the answer, which is shown and not kept', async () => {
      const svc = new MessageSyncService();
      await keptInbox(svc);
      const read = await heldRead(svc);
      window.dispatchEvent(new CustomEvent('external-message-flags-changed', {
        detail: { keys: [messageKey('INBOX', '1')], flag: '\\Flagged', action: 'add' },
      }));
      const shown = await read.land(page('INBOX', ['2', '1']));
      expect(shown.Messages.map((m: any) => [m.UID, m.Flags])).toEqual([['2', []], ['1', ['\\Flagged']]]);

      // The view kept is the one the star was patched into.
      fetchMock.mockImplementation(() => new Promise(() => {}));
      const seen = events(svc);
      void svc.fetch('INBOX', 0);
      expect(seen[1].detail.data.Messages.map((m: any) => [m.UID, m.Flags])).toEqual([['1', ['\\Flagged']]]);
    });

    it('takes the rows a write took out off the answer, unless they are put back', async () => {
      const svc = new MessageSyncService();
      await keptInbox(svc);
      const read = await heldRead(svc);
      svc.rowsTakenOut([messageKey('INBOX', '1')]);
      const shown = await read.land(page('INBOX', ['2', '1']));
      expect(shown.Messages.map((m: any) => m.UID)).toEqual(['2']);
      expect(shown.Total).toBe(1);

      const again = await heldRead(svc);
      const putBack = svc.rowsTakenOut([messageKey('INBOX', '2')]);
      putBack();
      expect((await again.land(page('INBOX', ['2', '1']))).Messages.map((m: any) => m.UID)).toEqual(['2', '1']);
    });

    it('keeps no answer read under the listing settings before', async () => {
      const svc = new MessageSyncService();
      svc.setListingSettings('desc');
      const read = await heldRead(svc);
      svc.setListingSettings('asc');
      await read.land(page('INBOX', ['1']));

      fetchMock.mockImplementation(() => new Promise(() => {}));
      const seen = events(svc);
      void svc.fetch('INBOX', 0);
      expect(seen.some((e) => e.detail?.kept)).toBe(false);
    });

    it('is not played over an answer sent after it', async () => {
      const svc = new MessageSyncService();
      await keptInbox(svc);
      const held = await heldRead(svc);
      svc.rowsTakenOut([messageKey('INBOX', '1')]);
      await held.land(page('INBOX', ['1']));

      fetchMock.mockResolvedValueOnce(page('INBOX', ['1']));
      const seen = events(svc);
      const read = svc.fetch('INBOX', 0, '', true);
      await vi.runAllTimersAsync();
      await read;
      expect(seen.filter((e) => e.type === 'sync-success').at(-1)!.detail.data.Messages.map((m: any) => m.UID)).toEqual(['1']);
    });
  });
});

/**
 * Polling: one tab polls, a poll that finds nothing new reads nothing more,
 * and a tab that comes back into view catches up.
 *
 * Every tab polled on its own, all on the session's one connection to the
 * mail server, and every poll read the listing again, a search included,
 * whatever the counts it had just asked for said.
 */
describe('polling', () => {
  /** A server whose folders hold `counts`, listed at them. */
  function server(counts: { total: number; unseen: number }) {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/status')) return new Response(JSON.stringify(counts), { status: 200 });
      const status = { NumMessages: counts.total, NumUnseen: counts.unseen };
      return new Response(JSON.stringify({ Messages: [], Total: counts.total, Mailbox: status, Inbox: status }), { status: 200 });
    });
  }

  const listingsAsked = () => fetchMock.mock.calls.map((c) => String(c[0])).filter((url) => url.includes('?page='));

  /** navigator.locks, as far as the poll uses it: one holder per name, the rest wait in turn. */
  function installLocks() {
    vi.stubGlobal('BroadcastChannel', class {
      onmessage = null;
      postMessage() {}
      close() {}
    });
    const held = new Set<string>();
    const waiting = new Map<string, (() => void)[]>();
    const locks = {
      request(name: string, options: any, callback?: () => Promise<void>) {
        if (!callback) callback = options;
        return new Promise<void>((resolve, reject) => {
          const grant = () => {
            held.add(name);
            Promise.resolve(callback!()).then(resolve, reject).finally(() => {
              held.delete(name);
              waiting.get(name)?.shift()?.();
            });
          };
          if (!held.has(name)) grant();
          else waiting.set(name, [...(waiting.get(name) ?? []), grant]);
        });
      },
    };
    Object.defineProperty(navigator, 'locks', { value: locks, configurable: true });
    return locks;
  }

  const started: MessageSyncService[] = [];
  const service = () => {
    const svc = new MessageSyncService();
    started.push(svc);
    return svc;
  };

  afterEach(() => {
    started.splice(0).forEach((svc) => svc.stop());
    delete (navigator as any).locks;
  });

  async function landed(svc: MessageSyncService, mailbox: string, query = '') {
    const pending = svc.fetch(mailbox, 0, query);
    // Past the 200ms a foreground read holds its dim for; not every timer,
    // which a poll's interval never runs out of.
    await vi.advanceTimersByTimeAsync(500);
    await pending;
  }

  it('does not read the listing, or run a search again, when the counts are the ones it was read at', async () => {
    server({ total: 2, unseen: 1 });
    const svc = service();
    await landed(svc, 'Work', 'ada');
    fetchMock.mockClear();

    svc.start(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/INBOX/status', '/mailboxes/Work/status']);

    server({ total: 3, unseen: 2 });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(listingsAsked()).toEqual(['/mailboxes/Work?page=0&query=ada']);
  });

  /** A server that numbers its changes: its listing and its check carry the latest one's number. */
  function numberingServer(counts: { total: number; unseen: number; modseq: number }) {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/status')) {
        return new Response(JSON.stringify({ total: counts.total, unseen: counts.unseen, highestmodseq: counts.modseq }), { status: 200 });
      }
      const status = { NumMessages: counts.total, NumUnseen: counts.unseen, HighestModSeq: counts.modseq };
      return new Response(JSON.stringify({ Messages: [], Total: counts.total, Mailbox: status, Inbox: status }), { status: 200 });
    });
  }

  it('reads the listing again when only the change number moved, as a star in another client moves it', async () => {
    const counts = { total: 2, unseen: 1, modseq: 7 };
    numberingServer(counts);
    const svc = service();
    await landed(svc, 'Work');
    fetchMock.mockClear();

    svc.start(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(listingsAsked()).toEqual([]);

    counts.modseq = 8;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(listingsAsked()).toEqual(['/mailboxes/Work?page=0']);
  });

  it('takes a listing that numbers no change and a check that names none for the same counts', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/status')) return new Response(JSON.stringify({ total: 2, unseen: 1 }), { status: 200 });
      const status = { NumMessages: 2, NumUnseen: 1, HighestModSeq: 0 };
      return new Response(JSON.stringify({ Messages: [], Total: 2, Mailbox: status, Inbox: status }), { status: 200 });
    });
    const svc = service();
    await landed(svc, 'Work');
    fetchMock.mockClear();

    svc.start(1);
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(listingsAsked()).toEqual([]);
  });

  it('polls from the one tab that holds the poll lock, and from the next once that one stops', async () => {
    installLocks();
    server({ total: 2, unseen: 1 });
    const first = service();
    const second = service();
    first.start(1);
    second.start(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(listingsAsked()).toHaveLength(1);

    first.stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(listingsAsked()).toHaveLength(2);
  });

  it('checks a tab come back into view whose mail is over a minute old, and does not chime for it there', async () => {
    const locks = installLocks();
    void locks.request('alps-mail-poll', () => new Promise<void>(() => {}));
    server({ total: 2, unseen: 1 });
    const svc = service();
    svc.start(1);
    await landed(svc, 'INBOX');
    fetchMock.mockClear();
    const seen = events(svc);

    await vi.advanceTimersByTimeAsync(30_000);
    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).not.toHaveBeenCalled();

    server({ total: 3, unseen: 2 });
    await vi.advanceTimersByTimeAsync(31_000);
    // Not polled: another tab holds the poll.
    expect(fetchMock).not.toHaveBeenCalled();
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/INBOX/status', '/mailboxes/INBOX?page=0']);
    expect(seen.map((e) => e.type)).toEqual(['sync-success']);
    expect(seen[0].detail).toMatchObject({ background: true, announce: false });
  });

  it('ends a check that finds nothing new without reading the listing', async () => {
    server({ total: 2, unseen: 1 });
    const svc = service();
    await landed(svc, 'INBOX');
    fetchMock.mockClear();
    const seen = events(svc);

    await svc.check('INBOX', 0);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/INBOX/status']);
    expect(seen.map((e) => e.type)).toEqual(['sync-start', 'sync-unchanged']);
  });

  // The check leaves its end to the poll that took its place, and that poll
  // found nothing new: the chip it started span until the counts next moved.
  it('ends a check overtaken by a poll that finds nothing new', async () => {
    server({ total: 2, unseen: 1 });
    const svc = service();
    await landed(svc, 'INBOX');
    svc.start(1);
    const answer = fetchMock.getMockImplementation()!;
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    fetchMock.mockImplementationOnce(async (url: string) => { await held; return answer(url); });
    const seen = events(svc);

    const checking = svc.check('INBOX', 0);
    await vi.advanceTimersByTimeAsync(60_000);
    release();
    await checking;
    expect(listingsAsked()).toHaveLength(1);
    expect(seen.map((e) => e.type)).toEqual(['sync-start', 'sync-unchanged']);
  });

  // Unchanged counts do not prove an unchanged listing: a star set elsewhere,
  // or a match the server had not indexed yet when the counts moved. Read
  // past the server's caches, which kept the page about as long.
  it('reads the listing again once it is as old as the server keeps it, though the counts match', async () => {
    server({ total: 2, unseen: 1 });
    const svc = service();
    await landed(svc, 'Work', 'ada');
    fetchMock.mockClear();

    svc.start(5);
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(listingsAsked()).toEqual([]);
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(listingsAsked()).toEqual(['/mailboxes/Work?page=0&query=ada&refresh=true']);
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(listingsAsked()).toHaveLength(1);
  });

  // A listing lands some way into the poll that asked for it, after the status
  // checks and its own round trip. Measured from there, the poll ten minutes
  // on found it a moment short of ten minutes old, and a view was read again
  // every fifteen minutes.
  it('reads the listing again every ten minutes at the default interval, though each read takes time', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const status = { NumMessages: 2, NumUnseen: 1 };
      if (url.includes('/status')) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return new Response(JSON.stringify({ total: 2, unseen: 1 }), { status: 200 });
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
      return new Response(JSON.stringify({ Messages: [], Mailbox: status, Inbox: status }), { status: 200 });
    });
    const svc = service();
    await landed(svc, 'Work');
    fetchMock.mockClear();

    svc.start(5);
    // A second more, for the poll's own requests.
    await vi.advanceTimersByTimeAsync(10 * 60_000 + 1000);
    expect(listingsAsked()).toHaveLength(1);
    // From the poll's own read on, as in a tab left open.
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(listingsAsked()).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(listingsAsked()).toEqual(Array(3).fill('/mailboxes/Work?page=0&refresh=true'));
  });

  // A timer can fire late, and a view opened between two polls is read off
  // their beat: the poll nearest ten minutes on reads it again, not the first
  // one past them.
  it('reads the listing again at the poll nearest ten minutes after it landed', async () => {
    server({ total: 2, unseen: 1 });
    const svc = service();
    svc.start(5);
    await vi.advanceTimersByTimeAsync(60_000);
    await landed(svc, 'Work');
    fetchMock.mockClear();

    await vi.advanceTimersByTimeAsync(4 * 60_000);
    expect(listingsAsked()).toEqual([]);
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(listingsAsked()).toEqual(['/mailboxes/Work?page=0&refresh=true']);
  });

  // The slack is for polls on the timer. The button is pressed at any moment,
  // and with half of a thirty-minute interval it read a listing seconds old
  // again, past the server's caches, for an answer of "nothing".
  it('lets the check-for-new-mail button read nothing more over a listing under ten minutes old, whatever the interval', async () => {
    server({ total: 2, unseen: 1 });
    const svc = service();
    svc.start(30);
    await landed(svc, 'INBOX');
    await vi.advanceTimersByTimeAsync(5000);
    fetchMock.mockClear();

    await svc.check('INBOX', 0);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/INBOX/status']);
  });

  it('lets a tab come back into view read nothing more over a listing under ten minutes old, whatever the interval', async () => {
    server({ total: 2, unseen: 1 });
    for (const minutes of [15, 30]) {
      const svc = service();
      svc.start(minutes);
      await landed(svc, 'INBOX');
      await vi.advanceTimersByTimeAsync(3 * 60_000);
      fetchMock.mockClear();

      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(1000);
      expect(fetchMock.mock.calls.map((c) => c[0]), `polling every ${minutes} minutes`).toEqual(['/mailboxes/INBOX/status']);
      svc.stop();
    }
  });

  it('reads the listing when only the Inbox moved, with another folder on screen', async () => {
    let inbox = { total: 2, unseen: 1 };
    const work = { total: 5, unseen: 0 };
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/mailboxes/INBOX/status') return new Response(JSON.stringify(inbox), { status: 200 });
      if (url.includes('/status')) return new Response(JSON.stringify(work), { status: 200 });
      return new Response(JSON.stringify({
        Messages: [],
        Mailbox: { NumMessages: work.total, NumUnseen: work.unseen },
        Inbox: { NumMessages: inbox.total, NumUnseen: inbox.unseen },
      }), { status: 200 });
    });
    const svc = service();
    await landed(svc, 'Work');
    fetchMock.mockClear();

    svc.start(1);
    inbox = { total: 3, unseen: 2 };
    await vi.advanceTimersByTimeAsync(60_000);
    expect(listingsAsked()).toEqual(['/mailboxes/Work?page=0']);
  });

  it('runs a search across every folder again on every poll, as it has no counts to go by', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/status')) return new Response(JSON.stringify({ total: 2, unseen: 1 }), { status: 200 });
      return new Response(JSON.stringify({
        Messages: [],
        Mailbox: { Mailbox: '*' },
        Inbox: { NumMessages: 2, NumUnseen: 1 },
      }), { status: 200 });
    });
    const svc = service();
    await landed(svc, '*', 'ada');
    fetchMock.mockClear();

    svc.start(1);
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(listingsAsked()).toHaveLength(2);
  });

  it('checks once for a tab come back into view, though it hears both visibilitychange and focus', async () => {
    const locks = installLocks();
    void locks.request('alps-mail-poll', () => new Promise<void>(() => {}));
    server({ total: 2, unseen: 1 });
    const svc = service();
    svc.start(1);
    await landed(svc, 'Work');
    await vi.advanceTimersByTimeAsync(61_000);
    fetchMock.mockClear();

    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/INBOX/status', '/mailboxes/Work/status']);
  });

  it('does not announce what the check-for-new-mail button finds in a tab that does not poll', async () => {
    const locks = installLocks();
    void locks.request('alps-mail-poll', () => new Promise<void>(() => {}));
    server({ total: 2, unseen: 1 });
    const svc = service();
    svc.start(1);
    await landed(svc, 'INBOX');
    const seen = events(svc);

    server({ total: 3, unseen: 2 });
    await svc.check('INBOX', 0);
    expect(seen.map((e) => e.type)).toEqual(['sync-start', 'sync-success']);
    expect(seen[1].detail).toMatchObject({ background: true, announce: false });
  });

  it('announces what the check-for-new-mail button finds when no tab polls', async () => {
    installLocks();
    server({ total: 2, unseen: 1 });
    const svc = service();
    svc.start(0);
    await landed(svc, 'INBOX');
    const seen = events(svc);

    server({ total: 3, unseen: 2 });
    await svc.check('INBOX', 0);
    expect(seen[1].detail).toMatchObject({ background: true, announce: true });
  });

  it('polls from this tab when the poll lock cannot be had', async () => {
    Object.defineProperty(navigator, 'locks', {
      value: { request: () => Promise.reject(new DOMException('denied', 'SecurityError')) },
      configurable: true,
    });
    server({ total: 2, unseen: 1 });
    const svc = service();
    await landed(svc, 'INBOX');
    fetchMock.mockClear();

    svc.start(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/mailboxes/INBOX/status']);
  });
});
