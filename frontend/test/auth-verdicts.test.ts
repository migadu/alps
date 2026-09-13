/**
 * Asking for the verdicts of messages, which listings do not carry.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAuthVerdicts, VERDICT_CHUNK } from '../src/services/auth-verdicts';
import { encodeMailboxPath } from '../src/utils/folders';

const answer = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchAuthVerdicts', () => {
  it('asks about the UIDs of one mailbox and reads the answers and their scope', async () => {
    const fetchMock = vi.fn(async () => answer({ Verdicts: { '1': { HasBimiPotential: true, HasBimiFailed: false }, '2': { HasBimiFailed: true } }, Scope: '7' }));
    vi.stubGlobal('fetch', fetchMock);

    const { verdicts, scope } = await fetchAuthVerdicts('Lists/Brand news', ['1', '2', '3']);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe(`/mailboxes/${encodeMailboxPath('Lists/Brand news')}/verdicts?uids=1,2,3`);
    expect([...verdicts]).toEqual([
      ['1', { HasBimiPotential: true, HasBimiFailed: false }],
      ['2', { HasBimiPotential: false, HasBimiFailed: true }],
    ]);
    expect(scope).toBe('7');
  });

  it('asks in chunks the backend accepts', async () => {
    const asked: string[][] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      asked.push(new URL(String(url), 'http://alps.test').searchParams.get('uids')!.split(','));
      return answer({ Verdicts: {}, Scope: '7' });
    }));
    const uids = Array.from({ length: VERDICT_CHUNK * 2 + 50 }, (_, i) => String(i + 1));

    await fetchAuthVerdicts('INBOX', uids);

    expect(asked.map((chunk) => chunk.length)).toEqual([VERDICT_CHUNK, VERDICT_CHUNK, 50]);
    expect(asked.flat()).toEqual(uids);
  });

  it('refuses chunks answered under different scopes', async () => {
    let scope = 0;
    vi.stubGlobal('fetch', vi.fn(async () => answer({ Verdicts: {}, Scope: String(++scope) })));
    const uids = Array.from({ length: VERDICT_CHUNK + 1 }, (_, i) => String(i + 1));
    await expect(fetchAuthVerdicts('INBOX', uids)).rejects.toThrow();
  });

  it('reads anything but true as no, and a missing scope as none', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => answer({ Verdicts: { '1': { HasBimiPotential: 'yes', HasBimiFailed: 1 }, '2': null } })));
    const { verdicts, scope } = await fetchAuthVerdicts('INBOX', ['1', '2']);
    expect(verdicts.get('1')).toEqual({ HasBimiPotential: false, HasBimiFailed: false });
    expect(verdicts.get('2')).toEqual({ HasBimiPotential: false, HasBimiFailed: false });
    expect(scope).toBe('');
  });

  it('throws when the request is refused', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => answer({ error: 'no' }, 403)));
    await expect(fetchAuthVerdicts('INBOX', ['1'])).rejects.toThrow();
  });
});
