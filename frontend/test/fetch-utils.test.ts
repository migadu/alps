import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { encodePathParam, fetchWithTimeout } from '../src/utils/fetch-utils';
import { encodeMailboxPath } from '../src/utils/folders';

describe('encodePathParam', () => {
  it('encodes twice, so the decode before routing leaves the slash encoded', () => {
    expect(encodePathParam('[Gmail]/All Mail')).toBe('%255BGmail%255D%252FAll%2520Mail');
    const afterRouting = decodeURIComponent(encodePathParam('Work/Clients'));
    expect(afterRouting).toBe('Work%2FClients');
    expect(afterRouting).not.toContain('/');
  });

  it('round-trips through both decodes', () => {
    for (const value of ['Work/Clients', 'a b', 'ünïcødé', '100%', 'a+b', 'x?y#z', 'addressbook/abc.vcf']) {
      expect(decodeURIComponent(decodeURIComponent(encodePathParam(value))), value).toBe(value);
    }
  });

  it('leaves an ordinary name alone', () => {
    expect(encodePathParam('INBOX')).toBe('INBOX');
  });

  it('agrees with the mailbox path encoder', () => {
    for (const value of ['INBOX', '[Gmail]/Sent Mail', 'Déjà vu']) {
      expect(encodeMailboxPath(value)).toBe(encodePathParam(value));
    }
  });
});

describe('fetchWithTimeout', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let networkErrors: Event[];
  let authErrors: Event[];
  const onNetwork = (e: Event) => networkErrors.push(e);
  const onAuth = (e: Event) => authErrors.push(e);
  const answer = (status: number) => new Response(null, { status });

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    networkErrors = [];
    authErrors = [];
    window.addEventListener('network-error', onNetwork);
    window.addEventListener('auth-error', onAuth);
  });

  afterEach(() => {
    window.removeEventListener('network-error', onNetwork);
    window.removeEventListener('auth-error', onAuth);
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('retries a GET that met a 502, 503 or 504, and returns what followed', async () => {
    for (const status of [502, 503, 504]) {
      fetchMock.mockReset();
      networkErrors.length = 0;
      fetchMock.mockResolvedValueOnce(answer(status)).mockResolvedValueOnce(answer(200));
      const pending = fetchWithTimeout('/mailboxes');
      await vi.runAllTimersAsync();
      expect((await pending).status, String(status)).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      // A blip that healed itself must not raise the offline banner.
      expect(networkErrors).toHaveLength(0);
    }
  });

  it('gives up after two retries and announces the outage once', async () => {
    fetchMock.mockImplementation(async () => answer(503));
    const pending = fetchWithTimeout('/mailboxes');
    await vi.runAllTimersAsync();
    expect((await pending).status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(networkErrors).toHaveLength(1);
  });

  it('releases each refused attempt and gives the next its own signal', async () => {
    const signals: AbortSignal[] = [];
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      signals.push(init.signal!);
      return answer(signals.length === 1 ? 503 : 200);
    });
    const pending = fetchWithTimeout('/mailboxes');
    await vi.runAllTimersAsync();
    await pending;
    expect(signals).toHaveLength(2);
    expect(signals[0]).not.toBe(signals[1]);
    expect(signals[0].aborted).toBe(true);
  });

  it('never replays a request with side effects', async () => {
    // A replayed POST could send a message or apply a move twice.
    for (const method of ['POST', 'post', 'PUT', 'DELETE']) {
      fetchMock.mockReset();
      networkErrors.length = 0;
      fetchMock.mockResolvedValue(answer(503));
      const response = await fetchWithTimeout('/messages', { method });
      expect(response.status, method).toBe(503);
      expect(fetchMock, method).toHaveBeenCalledTimes(1);
      expect(networkErrors, method).toHaveLength(1);
    }
  });

  it('retries a dropped connection', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(answer(200));
    const pending = fetchWithTimeout('/mailboxes');
    await vi.runAllTimersAsync();
    expect((await pending).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(networkErrors).toHaveLength(0);
  });

  it('rethrows a connection that stays down, after announcing it once', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const pending = fetchWithTimeout('/mailboxes');
    const outcome = expect(pending).rejects.toBeInstanceOf(TypeError);
    await vi.runAllTimersAsync();
    await outcome;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(networkErrors).toHaveLength(1);
  });

  it('does not replay a request that timed out', async () => {
    // The caller has already waited the whole budget; a replay would multiply it.
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    );
    const pending = fetchWithTimeout('/slow', {}, 1000);
    const outcome = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(1000);
    await outcome;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(networkErrors).toHaveLength(1);
  });

  it('announces an expired session and still hands the 401 back', async () => {
    fetchMock.mockResolvedValue(answer(401));
    const response = await fetchWithTimeout('/calendar/events');
    expect(response.status).toBe(401);
    expect(authErrors).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('says nothing for an ordinary success or refusal', async () => {
    fetchMock.mockResolvedValueOnce(answer(200)).mockResolvedValueOnce(answer(404));
    await fetchWithTimeout('/a');
    await fetchWithTimeout('/b');
    expect(networkErrors).toHaveLength(0);
    expect(authErrors).toHaveLength(0);
  });

  it('keeps the deadline running while the body is read', async () => {
    // Headers can arrive and the body then stall; the budget covers both.
    let signal: AbortSignal | undefined;
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      signal = init.signal!;
      return answer(200);
    });
    await fetchWithTimeout('/big', {}, 1000);
    expect(signal!.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(999);
    expect(signal!.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(signal!.aborted).toBe(true);
  });
});
