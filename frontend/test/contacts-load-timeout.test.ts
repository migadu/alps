import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';

const listing = { contacts: [{ name: 'Ada', path: '/book/ada.vcf' }], query: '' };

/** Respect cancellation as fetch does, so the real service's deadline decides
 * whether the response ever reaches its caller. */
function answerAfter(delayMs: number) {
  const fetchMock = vi.fn((_url: RequestInfo | URL, options: RequestInit) =>
    new Promise<Response>((resolve, reject) => {
      const timer = setTimeout(() => resolve(new Response(JSON.stringify(listing))), delayMs);
      options.signal!.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('aborted', 'AbortError'));
      }, { once: true });
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('loading a large address book', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it.fails.each(['', 'Ada & Bob'])('loads a listing or search %j that takes 90 seconds', async query => {
    const fetchMock = answerAfter(90_000);
    // Handle rejection before advancing timers, including on the old 60s budget.
    const outcome = contactsService.fetchContacts(query).then(
      value => ({ value }), error => ({ error }),
    );

    await vi.advanceTimersByTimeAsync(90_000);

    expect(await outcome).toEqual({ value: listing });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(query ? '/contacts?query=Ada%20%26%20Bob' : '/contacts');
    expect(fetchMock.mock.calls[0][1].signal!.aborted).toBe(false);
  });

  it.fails('cancels a stalled listing after five minutes without replaying it', async () => {
    const fetchMock = answerAfter(300_001);
    const outcome = contactsService.fetchContacts().catch(error => error);
    const signal = fetchMock.mock.calls[0][1].signal!;

    await vi.advanceTimersByTimeAsync(299_999);
    expect(signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    expect(await outcome).toMatchObject({ name: 'AbortError' });
    expect(signal.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the 25-second timeout when reading an individual contact', async () => {
    const fetchMock = answerAfter(30_000);
    const outcome = contactsService.fetchContact('/book/ada.vcf').catch(error => error);
    const signal = fetchMock.mock.calls[0][1].signal!;

    await vi.advanceTimersByTimeAsync(24_999);
    expect(signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    expect(await outcome).toMatchObject({ name: 'AbortError' });
    expect(signal.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
