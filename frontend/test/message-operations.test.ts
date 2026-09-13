/**
 * The message verbs: flag, delete, move, copy, save and send.
 *
 * Each reports what actually happened — including how much of a large
 * selection committed before a refusal — because the callers decide from it
 * whether to revert an optimistic paint, stay quiet on an expired session, or
 * re-read a list that is now wrong.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BATCH_MAX_UIDS, MessageOperationsService } from '../src/services/message-operations';
import { messageSync } from '../src/services/message-sync';

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const htmlPage = (status: number) => new Response('<html>Bad gateway</html>', { status, headers: { 'Content-Type': 'text/html' } });
const uids = (n: number) => Array.from({ length: n }, (_, i) => String(i + 1));
const bodyOf = (call: unknown[]) => JSON.parse((call[1] as RequestInit).body as string);

const ops = new MessageOperationsService();
let fetchMock: ReturnType<typeof vi.fn>;
let sync: ReturnType<typeof vi.spyOn>;
let authErrors: Event[];
const onAuth = (e: Event) => authErrors.push(e);

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  sync = vi.spyOn(messageSync, 'sync').mockImplementation(() => {});
  authErrors = [];
  window.addEventListener('auth-error', onAuth);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  window.removeEventListener('auth-error', onAuth);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('setFlag', () => {
  it('writes in chunks no larger than the server accepts, in order', async () => {
    fetchMock.mockImplementation(async () => json(200, { ok: 'true' }));
    const result = await ops.setFlag('INBOX', uids(BATCH_MAX_UIDS * 2 + 1), ['\\Seen'], 'add');
    expect(result).toEqual({ ok: true, applied: BATCH_MAX_UIDS * 2 + 1 });
    expect(fetchMock.mock.calls.map((c) => bodyOf(c).uids.length)).toEqual([BATCH_MAX_UIDS, BATCH_MAX_UIDS, 1]);
    expect(fetchMock.mock.calls[0][0]).toBe('/mailboxes/INBOX/messages/flag');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PUT' });
    expect(bodyOf(fetchMock.mock.calls[0])).toMatchObject({ flags: ['\\Seen'], action: 'add' });
  });

  it('addresses a mailbox whose name contains a slash as one path segment', async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    await ops.setFlag('[Gmail]/All Mail', ['1'], ['\\Flagged'], 'add');
    expect(fetchMock.mock.calls[0][0]).toBe('/mailboxes/%255BGmail%255D%252FAll%2520Mail/messages/flag');
  });

  it('stops at a refusal and says how much had already committed', async () => {
    fetchMock.mockResolvedValueOnce(json(200, {})).mockResolvedValueOnce(json(500, { error: 'server_error' }));
    const result = await ops.setFlag('INBOX', uids(BATCH_MAX_UIDS * 3), ['\\Seen'], 'add');
    expect(result).toMatchObject({ ok: false, reason: 'failed', applied: BATCH_MAX_UIDS });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('tells a refused keyword apart from a failure, naming it', async () => {
    fetchMock.mockResolvedValue(json(400, { error: 'unsupported_flags', rejected: ['receipts'] }));
    expect(await ops.setFlag('INBOX', ['1'], ['receipts'], 'add')).toMatchObject({ ok: false, reason: 'unsupported', rejected: ['receipts'] });
  });

  it('reports an expired session as such', async () => {
    fetchMock.mockResolvedValue(json(401));
    expect(await ops.setFlag('INBOX', ['1'], ['\\Seen'], 'add')).toMatchObject({ ok: false, reason: 'auth' });
    expect(authErrors.length).toBeGreaterThan(0);
  });

  it('survives an error page that is not JSON, and a dropped connection', async () => {
    fetchMock.mockResolvedValueOnce(htmlPage(502));
    expect(await ops.setFlag('INBOX', ['1'], ['\\Seen'], 'add')).toMatchObject({ ok: false, reason: 'failed' });
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect(await ops.setFlag('INBOX', ['1'], ['\\Seen'], 'add')).toMatchObject({ ok: false, reason: 'failed' });
  });

  it('sends nothing for an empty selection', async () => {
    expect(await ops.setFlag('INBOX', [], ['\\Seen'], 'add')).toEqual({ ok: false, reason: 'empty' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('read state', () => {
  it('returns a new, read message only when the write succeeded', async () => {
    const message = { UID: 5, Flags: ['\\Flagged'] };
    fetchMock.mockResolvedValueOnce(json(200, {}));
    const read = await ops.markAsRead('INBOX', message);
    expect(read).not.toBe(message);
    expect(read.Flags).toEqual(['\\Flagged', '\\Seen']);
    expect(message.Flags).toEqual(['\\Flagged']);

    fetchMock.mockResolvedValueOnce(json(500, {}));
    expect(await ops.markAsRead('INBOX', message)).toBe(message);
  });

  it('does not write for a message already read, or one without a UID', async () => {
    const seen = { UID: 5, Flags: ['\\Seen'] };
    expect(await ops.markAsRead('INBOX', seen)).toBe(seen);
    expect(await ops.markAsRead('INBOX', {})).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('marks many read or unread with the right action', async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    expect(await ops.markMessagesAsRead('INBOX', ['1', '2'])).toBe(true);
    expect(await ops.markMessagesAsUnread('INBOX', ['1'])).toBe(true);
    expect(fetchMock.mock.calls.map((c) => bodyOf(c).action)).toEqual(['add', 'remove']);
    expect(await ops.markMessagesAsRead('INBOX', [])).toBe(false);
  });
});

describe('deleting', () => {
  it('deletes in chunks and re-reads the list once', async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    expect(await ops.deleteMessagesResult('Trash', uids(BATCH_MAX_UIDS + 1))).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE' });
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it('re-reads after a refusal only if an earlier chunk had committed', async () => {
    fetchMock.mockResolvedValueOnce(json(500, {}));
    expect(await ops.deleteMessagesResult('Trash', uids(3))).toEqual({ ok: false, reason: 'failed' });
    expect(sync).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce(json(200, {})).mockResolvedValueOnce(json(500, {}));
    await ops.deleteMessagesResult('Trash', uids(BATCH_MAX_UIDS + 1));
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it('keeps the boolean form a boolean, so a failure can never read as truthy', async () => {
    fetchMock.mockResolvedValueOnce(json(500, {})).mockResolvedValueOnce(json(401));
    expect(await ops.deleteMessages('Trash', ['1'])).toBe(false);
    expect(await ops.deleteMessagesResult('Trash', ['1'])).toEqual({ ok: false, reason: 'auth' });
  });
});

describe('moving and copying', () => {
  it('merges the UID mapping from every chunk, then re-reads once', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { uidMapping: { '1': '10' } }))
      .mockResolvedValueOnce(json(200, { uidMapping: { [String(BATCH_MAX_UIDS + 1)]: '20' } }));
    const result = await ops.moveMessages('INBOX', uids(BATCH_MAX_UIDS + 1), 'Archive');
    expect(result).toEqual({ success: true, uidMapping: { '1': '10', [String(BATCH_MAX_UIDS + 1)]: '20' } });
    expect(bodyOf(fetchMock.mock.calls[0]).to).toBe('Archive');
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it('treats a successful move with no JSON body as a success', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 200 }));
    expect(await ops.moveMessages('INBOX', ['1'], 'Archive')).toEqual({ success: true, uidMapping: {} });
  });

  it('reports why a move or a copy did not happen', async () => {
    fetchMock.mockResolvedValueOnce(json(401));
    expect(await ops.moveMessages('INBOX', ['1'], 'Archive')).toEqual({ success: false, reason: 'auth' });
    fetchMock.mockResolvedValueOnce(json(500, {}));
    expect(await ops.copyMessages('INBOX', ['1'], 'Archive')).toEqual({ success: false, reason: 'failed' });
    expect(await ops.copyMessages('INBOX', [], 'Archive')).toEqual({ success: false, reason: 'empty' });
  });
});

describe('saving and sending', () => {
  it('reads the saved draft\'s location back', async () => {
    fetchMock.mockResolvedValue(json(200, { draft_uid: '7', draft_mailbox: 'Drafts', draft_size: 12, attachments: [] }));
    const form = new FormData();
    expect(await ops.saveDraft(form)).toEqual({ uid: '7', mailbox: 'Drafts', size: 12, attachments: [] });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: form });
  });

  it('answers null for a draft that was not saved, for whatever reason', async () => {
    fetchMock.mockResolvedValueOnce(json(401)).mockResolvedValueOnce(json(500, {})).mockRejectedValueOnce(new TypeError('offline'));
    expect(await ops.saveDraft(new FormData())).toBeNull();
    expect(await ops.saveDraft(new FormData())).toBeNull();
    expect(await ops.saveDraft(new FormData())).toBeNull();
  });

  it('re-reads the list after a send', async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    expect(await ops.sendDraft(new FormData())).toBe(true);
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it('answers false for an expired session instead of throwing', async () => {
    fetchMock.mockResolvedValue(json(401));
    expect(await ops.sendDraft(new FormData())).toBe(false);
  });

  it('throws the server\'s own reason, and a status when the body is not JSON', async () => {
    fetchMock.mockResolvedValueOnce(json(500, { error: '550 5.1.1 recipient rejected' }));
    await expect(ops.sendDraft(new FormData())).rejects.toThrow('550 5.1.1 recipient rejected');
    fetchMock.mockResolvedValueOnce(htmlPage(502));
    await expect(ops.sendDraft(new FormData())).rejects.toThrow('Failed to send message (502)');
  });
});
