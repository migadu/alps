/**
 * The linked accounts listed in the user menu and on the settings page.
 *
 * They are the signed-in account's, and signing out does not reload the page,
 * so the next user to sign in on the same tab must never be shown them.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LinkedAccountsStore } from '../src/store/linked-accounts-store';

const answer = (usernames: string[]) =>
  new Response(JSON.stringify({ accounts: usernames.map(username => ({ username })) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const names = (store: LinkedAccountsStore) => store.getAccounts().map(a => a.username);

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('across a sign-out', () => {
  it('forgets the accounts it read, so the next user\'s menu reads its own', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => answer(['ada@work.example'])));
    const store = new LinkedAccountsStore();
    await store.fetchAccounts();
    expect(names(store)).toEqual(['ada@work.example']);
    expect(store.isInitialized()).toBe(true);

    const changes = vi.fn();
    store.addEventListener('change', changes);
    window.dispatchEvent(new CustomEvent('session-cleared'));

    expect(names(store)).toEqual([]);
    // What the menu and the settings page ask before they fetch.
    expect(store.isInitialized()).toBe(false);
    expect(changes).toHaveBeenCalled();
  });

  it('drops a read that answers after the session it was made for has ended', async () => {
    let release!: () => void;
    vi.stubGlobal('fetch', vi.fn(async () => {
      await new Promise<void>(resolve => { release = resolve; });
      return answer(['ada@work.example']);
    }));
    const store = new LinkedAccountsStore();
    const read = store.fetchAccounts();
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));

    window.dispatchEvent(new CustomEvent('session-cleared'));
    release();
    await read;

    expect(names(store)).toEqual([]);
    expect(store.isInitialized()).toBe(false);
  });

  it('lets the next user\'s read finish while the previous user\'s is still out', async () => {
    const releases: (() => void)[] = [];
    const lists = [['ada@work.example'], ['grace@navy.example']];
    vi.stubGlobal('fetch', vi.fn(async () => {
      const list = lists.shift()!;
      await new Promise<void>(resolve => releases.push(resolve));
      return answer(list);
    }));
    const store = new LinkedAccountsStore();
    const previous = store.fetchAccounts();
    await vi.waitFor(() => expect(releases).toHaveLength(1));
    window.dispatchEvent(new CustomEvent('session-cleared'));

    const next = store.fetchAccounts();
    await vi.waitFor(() => expect(releases).toHaveLength(2));
    releases[0]();
    await previous;
    // The previous user's answer neither lands nor ends the next one's wait.
    expect(names(store)).toEqual([]);
    expect(store.isLoading()).toBe(true);

    releases[1]();
    await next;
    expect(names(store)).toEqual(['grace@navy.example']);
    expect(store.isLoading()).toBe(false);
  });
});
