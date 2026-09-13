import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MailboxOperationsService } from '../src/services/mailbox-operations';
import { messageSync } from '../src/services/message-sync';

const answer = (status: number) => new Response(null, { status });
const ops = new MailboxOperationsService();
let fetchMock: ReturnType<typeof vi.fn>;
let authErrors: Event[];
const onAuth = (e: Event) => authErrors.push(e);

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(messageSync, 'sync').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  authErrors = [];
  window.addEventListener('auth-error', onAuth);
});

afterEach(() => {
  window.removeEventListener('auth-error', onAuth);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('creating and renaming', () => {
  it('tells a name that is taken apart from a failure', async () => {
    fetchMock.mockResolvedValueOnce(answer(200)).mockResolvedValueOnce(answer(409)).mockResolvedValueOnce(answer(500));
    expect(await ops.createMailbox('Work/Clients')).toBe('ok');
    expect(await ops.createMailbox('Work')).toBe('exists');
    expect(await ops.createMailbox('Work')).toBe('failed');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/mailboxes');
    expect(init).toMatchObject({ method: 'POST', body: 'name=Work%2FClients' });
    expect(messageSync.sync).toHaveBeenCalledTimes(1);
  });

  it('fails an expired session or a dropped connection without throwing', async () => {
    fetchMock.mockResolvedValueOnce(answer(401)).mockRejectedValueOnce(new TypeError('offline'));
    expect(await ops.createMailbox('Work')).toBe('failed');
    expect(authErrors.length).toBeGreaterThan(0);
    expect(await ops.createMailbox('Work')).toBe('failed');
  });

  it('points the poll at the new name before re-reading', async () => {
    // The re-read asks for whatever mailbox the sync service holds, and the
    // old name no longer exists on the server.
    const renamed = vi.spyOn(messageSync, 'mailboxRenamed');
    fetchMock.mockResolvedValue(answer(200));
    expect(await ops.renameMailbox('Work', 'Jobs')).toBe('ok');
    expect(fetchMock.mock.calls[0][0]).toBe('/mailboxes/Work/rename');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ new_name: 'Jobs' });
    expect(renamed).toHaveBeenCalledWith('Work', 'Jobs');
    expect(renamed.mock.invocationCallOrder[0]).toBeLessThan((messageSync.sync as any).mock.invocationCallOrder[0]);
  });

  it('leaves the poll alone when the rename is refused', async () => {
    const renamed = vi.spyOn(messageSync, 'mailboxRenamed');
    fetchMock.mockResolvedValue(answer(409));
    expect(await ops.renameMailbox('Work', 'Jobs')).toBe('exists');
    expect(renamed).not.toHaveBeenCalled();
  });
});

describe('deleting and emptying', () => {
  it('moves the poll off a deleted folder before re-reading', async () => {
    const deleted = vi.spyOn(messageSync, 'mailboxDeleted');
    fetchMock.mockResolvedValue(answer(200));
    expect(await ops.deleteMailbox('[Gmail]/Old')).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe('/mailboxes/%255BGmail%255D%252FOld');
    expect(deleted).toHaveBeenCalledWith('[Gmail]/Old');
    expect(deleted.mock.invocationCallOrder[0]).toBeLessThan((messageSync.sync as any).mock.invocationCallOrder[0]);
  });

  it('answers false for a refused delete or empty', async () => {
    fetchMock.mockResolvedValueOnce(answer(500)).mockResolvedValueOnce(answer(403)).mockResolvedValueOnce(answer(401));
    expect(await ops.deleteMailbox('Work')).toBe(false);
    expect(await ops.emptyMailbox('Archive')).toBe(false);
    expect(await ops.emptyMailbox('Trash')).toBe(false);
    expect(authErrors.length).toBeGreaterThan(0);
  });

  it('empties a folder with a POST and re-reads', async () => {
    fetchMock.mockResolvedValue(answer(200));
    expect(await ops.emptyMailbox('Trash')).toBe(true);
    expect(fetchMock.mock.calls[0]).toEqual(['/mailboxes/Trash/empty', expect.objectContaining({ method: 'POST' })]);
    expect(messageSync.sync).toHaveBeenCalledTimes(1);
  });
});

describe('subscriptions', () => {
  it('uses the verb asked for and says why it failed', async () => {
    fetchMock.mockResolvedValueOnce(answer(200)).mockResolvedValueOnce(answer(401)).mockResolvedValueOnce(answer(500)).mockRejectedValueOnce(new TypeError('offline'));
    expect(await ops.setSubscribed('Work', true)).toEqual({ ok: true });
    expect(await ops.setSubscribed('Work', false)).toEqual({ ok: false, reason: 'auth' });
    expect(await ops.setSubscribed('Work', false)).toEqual({ ok: false, reason: 'failed' });
    expect(await ops.setSubscribed('Work', true)).toEqual({ ok: false, reason: 'failed' });
    expect(fetchMock.mock.calls.slice(0, 2).map((c) => c[0])).toEqual(['/mailboxes/Work/subscribe', '/mailboxes/Work/unsubscribe']);
  });
});
