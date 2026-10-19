/**
 * The settings store.
 *
 * A save sends only what changed in this browser, so another browser's
 * changes to the rest of the record survive it. It sends nothing before the
 * server's copy has been read, keeps a change that could not be saved for the
 * next save, and ends on the latest value when changes arrive faster than
 * saves complete.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsStore, activeUsername, clearSessionSettings, readUserSettings } from '../src/store/settings-store';

const USER = 'ada@example.com';
const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status });

type Handler = (init?: RequestInit) => Response | Promise<Response>;

function serve(table: Record<string, Handler>) {
  const calls: { key: string; body?: any }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`;
    calls.push({ key, body: init?.body ? JSON.parse(init.body as string) : undefined });
    const handler = table[key];
    if (!handler) throw new Error(`unexpected request ${key}`);
    return handler(init);
  }));
  return calls;
}

function clearCookies() {
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0].trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}

const signedIn = () => {
  document.cookie = 'alps_logged_in=1; path=/';
};

const record = (type: string) => {
  const seen: CustomEvent[] = [];
  const listener = (e: Event) => seen.push(e as CustomEvent);
  window.addEventListener(type, listener);
  listeners.push([type, listener]);
  return seen;
};
const listeners: [string, EventListener][] = [];

beforeEach(() => {
  localStorage.clear();
  clearCookies();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  for (const [type, listener] of listeners.splice(0)) window.removeEventListener(type, listener);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  clearCookies();
  localStorage.clear();
  document.body.className = '';
});

describe('signing in', () => {
  it('reads the account\'s record and applies it, remembering whose it is', async () => {
    signedIn();
    const changed = record('alps-active-user-changed');
    serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { MaxAttachmentMiB: 20, Settings: { signature: 'Ada', language: 'de', messages_per_page: 25 } }),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect(store.getState().signature).toBe('Ada'));
    expect(store.getState()).toMatchObject({ loginUsername: USER, language: 'de', messagesPerPage: 25, maxAttachmentMiB: 20 });
    expect(activeUsername()).toBe(USER);
    expect(JSON.parse(localStorage.getItem(`alps_settings_${USER}`)!).signature).toBe('Ada');
    expect(changed).toHaveLength(1);
  });

  it('turns threading off when the server cannot thread', async () => {
    signedIn();
    serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { HasThreadCapability: false, Settings: { language: 'en' } }),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect(store.getState().hasThreadCapability).toBe(false));
    expect(store.getState().enableThreading).toBe(false);
  });

  it('applies the account\'s choice about sender avatars, and saves a change to it', async () => {
    signedIn();
    const calls = serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { language: 'en', ui: { showSenderAvatars: false } } }),
      'PUT /settings': () => json(200, {}),
    });
    const store = new SettingsStore();
    expect(store.getState().showSenderAvatars).toBe(true);
    await vi.waitFor(() => expect(store.getState().showSenderAvatars).toBe(false));
    await vi.waitFor(() => expect((store as any).initialFetchCompleted).toBe(true));

    await store.updateSettings({ showSenderAvatars: true });
    const put = calls.find((c) => c.key === 'PUT /settings')!.body;
    expect(put).toEqual({ ui: { showSenderAvatars: true } });
  });

  it('applies the account\'s choice about weekStart, and saves a change to it', async () => {
    signedIn();
    const calls = serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { language: 'en', week_start: 0 } }),
      'PUT /settings': () => json(200, {}),
    });
    const store = new SettingsStore();
    expect(store.getState().weekStart).toBe(1);
    await vi.waitFor(() => expect(store.getState().weekStart).toBe(0));
    await vi.waitFor(() => expect((store as any).initialFetchCompleted).toBe(true));

    await store.updateSettings({ weekStart: 1 });
    const put = calls.find((c) => c.key === 'PUT /settings')!.body;
    expect(put).toEqual({ week_start: 1 });
  });

  it('saves Monday, not NaN, when weekStart is not a number', async () => {
    signedIn();
    const calls = serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { language: 'en', week_start: 0 } }),
      'PUT /settings': () => json(200, {}),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect(store.getState().weekStart).toBe(0));
    await vi.waitFor(() => expect((store as any).initialFetchCompleted).toBe(true));

    await store.updateSettings({ weekStart: undefined as any });
    const put = calls.find((c) => c.key === 'PUT /settings')!.body;
    expect(put).toEqual({ week_start: 1 });
  });

  it('normalizes invalid week_start from server to Monday (1)', async () => {
    signedIn();
    serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { language: 'en', week_start: 5 } }),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect((store as any).initialFetchCompleted).toBe(true));
    expect(store.getState().weekStart).toBe(1);
  });

  it('saves nothing when it has only read the account\'s record', async () => {
    signedIn();
    const calls = serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { signature: 'Ada', language: 'de' } }),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect((store as any).initialFetchCompleted).toBe(true));
    await Promise.resolve();
    expect(calls.map((c) => c.key)).toEqual(['GET /session', 'GET /settings']);
  });

  it('gives an account without a language this browser\'s, and sends nothing else', async () => {
    signedIn();
    localStorage.setItem('alps_settings', JSON.stringify({ language: 'fr', layoutMode: 'horizontal' }));
    const calls = serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { signature: 'Ada' } }),
      'PUT /settings': () => json(200, {}),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect(calls.some((c) => c.key === 'PUT /settings')).toBe(true));
    expect(calls.filter((c) => c.key === 'PUT /settings').map((c) => c.body)).toEqual([{ language: 'fr' }]);
    expect(store.getState()).toMatchObject({ signature: 'Ada', language: 'fr' });
  });

  it('sends the shell to sign-in when there is no session at all', async () => {
    const authErrors = record('auth-error');
    const calls = serve({});
    new SettingsStore();
    await vi.waitFor(() => expect(authErrors.length).toBeGreaterThan(0));
    expect(calls).toHaveLength(0);
  });

  it('restores account settings on login right after logout without page reload', async () => {
    // 1. Initial sign-in with custom settings
    signedIn();
    serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { from: 'Ada Lovelace', auto_logout: 0, signature: 'Ada' } }),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect(store.getState().name).toBe('Ada Lovelace'));
    expect(store.getState().autoLogout).toBe(0);

    // 2. User logs out
    clearSessionSettings();
    window.dispatchEvent(new CustomEvent('session-cleared'));

    // Verify state was cleared to defaults
    expect(store.getState().name).toBe('');
    expect(store.getState().autoLogout).toBe(30);
    expect(store.getState().loginUsername).toBeUndefined();

    // 3. User logs back in (login-page.ts does not include detail and initializeSession runs)
    signedIn();
    serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { from: 'Ada Lovelace', auto_logout: 0, signature: 'Ada' } }),
    });
    window.dispatchEvent(new CustomEvent('user-logged-in'));

    // Wait for backend settings to arrive
    await vi.waitFor(() => expect(store.getState().name).toBe('Ada Lovelace'));

    // 4. Simulate mailbox sync updating loginUsername when message sync completes
    await store.updateSettings({ loginUsername: USER });

    // 5. Verify settings were not wiped out by updateSettings loading from empty localStorage
    expect(store.getState().name).toBe('Ada Lovelace');
    expect(store.getState().autoLogout).toBe(0);
    expect(store.getState().loginUsername).toBe(USER);
    expect(activeUsername()).toBe(USER);
  });

  it('restores account settings on 2FA login after logout without page reload', async () => {
    // 1. Initial sign-in with custom settings
    signedIn();
    serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { from: 'Ada Lovelace', auto_logout: 0, signature: 'Ada' } }),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect(store.getState().name).toBe('Ada Lovelace'));
    expect(store.getState().autoLogout).toBe(0);

    // 2. User logs out
    clearSessionSettings();
    window.dispatchEvent(new CustomEvent('session-cleared'));

    // Verify state was cleared to defaults
    expect(store.getState().name).toBe('');
    expect(store.getState().autoLogout).toBe(30);
    expect(store.getState().loginUsername).toBeUndefined();

    // 3. User completes 2FA verification, which dispatches user-logged-in with username
    signedIn();
    serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { from: 'Ada Lovelace', auto_logout: 0, signature: 'Ada' } }),
    });
    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username: USER } }));

    // Settings must be restored from server without needing a page reload
    await vi.waitFor(() => expect(store.getState().name).toBe('Ada Lovelace'));
    expect(store.getState().autoLogout).toBe(0);
    expect(store.getState().loginUsername).toBe(USER);
    expect(activeUsername()).toBe(USER);
  });

  it('immediately applies cached user settings over defaults on user-logged-in before server responds', () => {
    // Save user settings directly in localStorage
    localStorage.setItem(`alps_settings_${USER}`, JSON.stringify({
      name: 'Ada Lovelace',
      autoLogout: 0,
      signature: 'Ada',
    }));

    const store = new SettingsStore();
    // Simulate cleared session (logout)
    window.dispatchEvent(new CustomEvent('session-cleared'));
    expect(store.getState().name).toBe('');
    expect(store.getState().autoLogout).toBe(30);

    // Dispatch user-logged-in with username; user settings must override empty defaults immediately
    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username: USER } }));
    expect(store.getState().name).toBe('Ada Lovelace');
    expect(store.getState().autoLogout).toBe(0);
    expect(store.getState().loginUsername).toBe(USER);
  });

  it('does not wipe out backend settings when updateSettings is called with loginUsername', async () => {
    signedIn();
    serve({
      'GET /settings': () => json(200, { Settings: { from: 'Ada Lovelace', auto_logout: 0, signature: 'Ada' } }),
    });
    const store = new SettingsStore();
    // Simulate backend settings fetched while loginUsername is still undefined
    await (store as any)._fetchBackendSettings();
    expect(store.getState().name).toBe('Ada Lovelace');
    expect(store.getState().autoLogout).toBe(0);

    // Now mailbox-page sets loginUsername
    await store.updateSettings({ loginUsername: USER });

    // The name and autoLogout must NOT be wiped out to defaults!
    expect(store.getState().name).toBe('Ada Lovelace');
    expect(store.getState().autoLogout).toBe(0);
    expect(store.getState().loginUsername).toBe(USER);
  });
});

describe('a read that answers into the next session', () => {
  /**
   * Signing out and in again does not reload the page, so a read of the
   * session or the record that is still out at that moment answers after it.
   * Its answer is the previous account's.
   */
  const OTHER = 'grace@example.com';
  const settle = async () => {
    for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  };

  /**
   * Holds the first read of `/settings`, which is the store's own at sign-in,
   * until the test releases it, and answers the rest with `later`. The stores
   * of earlier tests still listen on the window, so the later reads are not
   * all this store's and are not counted.
   */
  function heldFirstRead(later: () => Response | Promise<Response>) {
    let release!: (r: Response) => void;
    let reads = 0;
    const calls = serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => (++reads === 1 ? new Promise<Response>((resolve) => { release = resolve; }) : later()),
      'PUT /settings': () => json(200, {}),
    });
    return { calls, reads: () => reads, release: (r: Response) => release(r) };
  }

  const signOut = () => {
    clearSessionSettings();
    window.dispatchEvent(new CustomEvent('session-cleared'));
  };

  const adasRecord = () => json(200, { Settings: { from: 'Ada Lovelace', signature: 'Ada', reply_to: 'ada@example.org', language: 'en', ui: { themeMode: 'dark' } } });
  const gracesRecord = () => json(200, { Settings: { from: 'Grace Hopper', signature: 'Grace', language: 'en' } });

  it('does not bring the signed-out account\'s settings back', async () => {
    signedIn();
    const read = heldFirstRead(gracesRecord);
    const store = new SettingsStore();
    await vi.waitFor(() => expect(read.reads()).toBe(1));

    signOut();
    read.release(adasRecord());
    await settle();

    expect(store.getState()).toMatchObject({ name: '', signature: '', themeMode: 'auto' });
    expect(store.getState().loginUsername).toBeUndefined();
    // Not even the look of the page, which the sign-in page would have worn.
    expect(JSON.parse(localStorage.getItem('alps_settings') ?? '{}').themeMode).not.toBe('dark');
    expect(document.body.classList.contains('theme-dark')).toBe(false);
  });

  it('does not put the previous account\'s settings into the next account\'s', async () => {
    signedIn();
    const read = heldFirstRead(gracesRecord);
    const store = new SettingsStore();
    await vi.waitFor(() => expect(read.reads()).toBe(1));

    signOut();
    signedIn();
    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username: OTHER } }));
    await vi.waitFor(() => expect(store.getState().name).toBe('Grace Hopper'));

    read.release(adasRecord());
    await settle();

    expect(store.getState()).toMatchObject({ loginUsername: OTHER, name: 'Grace Hopper', signature: 'Grace', replyTo: '', themeMode: 'auto' });
    expect(JSON.parse(localStorage.getItem(`alps_settings_${OTHER}`)!)).toMatchObject({ name: 'Grace Hopper', signature: 'Grace', replyTo: '' });
    // Nothing of it went to the server under the next account's name either.
    expect(read.calls.filter((c) => c.key === 'PUT /settings')).toEqual([]);
  });

  it('does not let the previous session\'s read stand in for the next one\'s', async () => {
    // The previous read lands while the next session's is still out: it must
    // not mark the next account's record as read, which would let a change go
    // out before that record is in.
    signedIn();
    const next: ((r: Response) => void)[] = [];
    const read = heldFirstRead(() => new Promise<Response>((resolve) => { next.push(resolve); }));
    const store = new SettingsStore();
    await vi.waitFor(() => expect(read.reads()).toBe(1));

    signOut();
    signedIn();
    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username: OTHER } }));
    await vi.waitFor(() => expect(next.length).toBeGreaterThan(0));
    read.release(adasRecord());
    await settle();

    expect((store as any).initialFetchCompleted).toBe(false);
    for (const release of next) release(gracesRecord());
    await vi.waitFor(() => expect((store as any).initialFetchCompleted).toBe(true));
    expect(store.getState().name).toBe('Grace Hopper');
  });

  it('does not put the previous username back after a sign-in with a second factor', async () => {
    signedIn();
    let releaseSession!: (r: Response) => void;
    let sessionReads = 0;
    serve({
      'GET /session': () => (++sessionReads === 1 ? new Promise<Response>((resolve) => { releaseSession = resolve; }) : json(200, { Username: OTHER })),
      'GET /settings': () => gracesRecord(),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect(sessionReads).toBe(1));

    // The second factor's page announces the account it signed in.
    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username: OTHER } }));
    await vi.waitFor(() => expect(store.getState().name).toBe('Grace Hopper'));

    releaseSession(json(200, { Username: USER }));
    await settle();

    expect(store.getState().loginUsername).toBe(OTHER);
    expect(activeUsername()).toBe(OTHER);
    expect(localStorage.getItem(`alps_settings_${USER}`)).toBeNull();
  });

  it('does not send the next session to sign-in for the previous one\'s 401', async () => {
    signedIn();
    const authErrors = record('auth-error');
    const read = heldFirstRead(gracesRecord);
    const store = new SettingsStore();
    await vi.waitFor(() => expect(read.reads()).toBe(1));

    signOut();
    signedIn();
    window.dispatchEvent(new CustomEvent('user-logged-in'));
    await vi.waitFor(() => expect(store.getState().name).toBe('Grace Hopper'));

    read.release(json(401));
    await settle();

    expect(authErrors).toHaveLength(0);
  });
});

describe('saving', () => {
  it('never replaces the server record after failing to read it', async () => {
    signedIn();
    let reads = 0;
    const calls = serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => (++reads === 1 ? json(500) : json(200, { Settings: { from: 'Ada Lovelace', signature: 'server', language: 'de' } })),
      'PUT /settings': () => json(200, {}),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect(reads).toBe(1));
    await Promise.resolve();

    await store.updateSettings({ signature: 'typed here' });
    await vi.waitFor(() => expect(calls.some((c) => c.key === 'PUT /settings')).toBe(true));

    expect(calls.map((c) => c.key)).toEqual(['GET /session', 'GET /settings', 'GET /settings', 'PUT /settings']);
    const put = calls.find((c) => c.key === 'PUT /settings')!.body;
    // The change made while the record could not be read wins, and is all that
    // is sent; the rest is the server's.
    expect(put).toEqual({ signature: 'typed here' });
    expect(store.getState()).toMatchObject({ signature: 'typed here', name: 'Ada Lovelace', language: 'de' });
  });

  it('keeps a change local, and says so, when the record still cannot be read', async () => {
    signedIn();
    const toasts = record('show-toast');
    const calls = serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(500),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect(calls.filter((c) => c.key === 'GET /settings')).toHaveLength(1));
    await Promise.resolve();

    await store.updateSettings({ signature: 'typed here' });
    expect(store.getState().signature).toBe('typed here');
    expect(calls.some((c) => c.key === 'PUT /settings')).toBe(false);
    expect(toasts).toHaveLength(1);
  });

  it('reports a save the server refused', async () => {
    signedIn();
    const toasts = record('show-toast');
    serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { language: 'en' } }),
      'PUT /settings': () => json(500),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect(store.getState().loginUsername).toBe(USER));
    await vi.waitFor(() => expect((store as any).initialFetchCompleted).toBe(true));
    await store.updateSettings({ bccMyself: true });
    expect(toasts).toHaveLength(1);
  });

  it('sends only what changed, so another browser\'s changes survive', async () => {
    signedIn();
    const calls = serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { language: 'en', signature: 'Ada' } }),
      'PUT /settings': () => json(200, {}),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect((store as any).initialFetchCompleted).toBe(true));

    await store.updateSettings({ bccMyself: true });
    await store.updateSettings({ densityMode: 'loose' });
    await store.updateSettings({ customMailboxOrder: ['INBOX', 'Work'] });

    expect(calls.filter((c) => c.key === 'PUT /settings').map((c) => c.body)).toEqual([
      { bcc_myself: true },
      { ui: { densityMode: 'loose' } },
      { ui: { customMailboxOrder: ['INBOX', 'Work'] } },
    ]);
  });

  it('sends nothing for what did not change, or what the server does not keep', async () => {
    signedIn();
    const calls = serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { language: 'en', signature: 'Ada' } }),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect((store as any).initialFetchCompleted).toBe(true));

    await store.updateSettings({ signature: 'Ada' });
    await store.updateSettings({ sidebarCollapsed: true });
    await store.updateSettings({ customMailboxOrder: [] });

    expect(store.getState().sidebarCollapsed).toBe(true);
    expect(calls.map((c) => c.key)).toEqual(['GET /session', 'GET /settings']);
  });

  it('sends a change the server refused with the next one', async () => {
    signedIn();
    let puts = 0;
    const calls = serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { language: 'en' } }),
      'PUT /settings': () => (++puts === 1 ? json(503) : json(200, {})),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect((store as any).initialFetchCompleted).toBe(true));

    await store.updateSettings({ signature: 'Ada' });
    await store.updateSettings({ replyTo: 'ada@example.org' });

    expect(calls.filter((c) => c.key === 'PUT /settings').map((c) => c.body)).toEqual([
      { signature: 'Ada' },
      { signature: 'Ada', reply_to: 'ada@example.org' },
    ]);
  });

  it('sends one save at a time and ends on the latest value', async () => {
    signedIn();
    const releases: (() => void)[] = [];
    const calls = serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { language: 'en' } }),
      'PUT /settings': () => new Promise((resolve) => releases.push(() => resolve(json(200, {})))),
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect((store as any).initialFetchCompleted).toBe(true));

    void store.updateSettings({ messagesPerPage: 10 });
    await vi.waitFor(() => expect(releases).toHaveLength(1));
    void store.updateSettings({ messagesPerPage: 20 });
    void store.updateSettings({ messagesPerPage: 30 });
    await Promise.resolve();
    expect(calls.filter((c) => c.key === 'PUT /settings')).toHaveLength(1);

    releases[0]();
    await vi.waitFor(() => expect(releases).toHaveLength(2));
    releases[1]();
    const puts = calls.filter((c) => c.key === 'PUT /settings');
    expect(puts.map((c) => c.body.messages_per_page)).toEqual([10, 30]);
  });
});

describe('a change the server has not taken', () => {
  const UNSAVED = `alps_unsaved_settings_${USER}`;
  const stored = () => JSON.parse(localStorage.getItem(UNSAVED) ?? 'null');

  /** Signs in to a record holding `signature`, with saves answered by `put`. */
  async function signIn(signature: string, put: () => Response | Promise<Response>) {
    signedIn();
    const calls = serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(200, { Settings: { language: 'en', signature } }),
      'PUT /settings': put,
    });
    const store = new SettingsStore();
    await vi.waitFor(() => expect((store as any).initialFetchCompleted).toBe(true));
    return { store, calls };
  }

  const puts = (calls: { key: string; body?: any }[]) => calls.filter((c) => c.key === 'PUT /settings').map((c) => c.body);

  it('is still set after a reload, and is sent then', async () => {
    const before = await signIn('server', () => json(503));
    await before.store.updateSettings({ signature: 'typed here' });
    expect(stored()).toEqual({ signature: { value: 'typed here', base: 'server' } });

    // The reload: the record still holds what the change was made from.
    const after = await signIn('server', () => json(200, {}));
    await vi.waitFor(() => expect(puts(after.calls)).toEqual([{ signature: 'typed here' }]));
    expect(after.store.getState().signature).toBe('typed here');
    await vi.waitFor(() => expect(stored()).toBeNull());
  });

  it('gives way to a value another browser has saved for it since', async () => {
    const before = await signIn('server', () => json(503));
    await before.store.updateSettings({ signature: 'typed here' });

    const after = await signIn('from the phone', () => json(200, {}));
    await Promise.resolve();
    expect(after.store.getState().signature).toBe('from the phone');
    expect(puts(after.calls)).toEqual([]);
    expect(stored()).toBeNull();
  });

  it('stands when it was made before the record could be read', async () => {
    // Nothing is known of what it was changed from, so nothing can say it has
    // been overtaken.
    signedIn();
    serve({
      'GET /session': () => json(200, { Username: USER }),
      'GET /settings': () => json(500),
    });
    const before = new SettingsStore();
    await vi.waitFor(() => expect((before as any).settingsReadFailed).toBe(true));
    await before.updateSettings({ signature: 'typed here' });
    expect(stored()).toEqual({ signature: { value: 'typed here' } });

    const after = await signIn('from the phone', () => json(200, {}));
    await vi.waitFor(() => expect(puts(after.calls)).toEqual([{ signature: 'typed here' }]));
    expect(after.store.getState().signature).toBe('typed here');
  });

  it('is forgotten once it is saved, so the next load takes the record as it is', async () => {
    const before = await signIn('server', () => json(200, {}));
    await before.store.updateSettings({ signature: 'typed here' });
    expect(stored()).toBeNull();

    const after = await signIn('from the phone', () => json(200, {}));
    await Promise.resolve();
    expect(after.store.getState().signature).toBe('from the phone');
    expect(puts(after.calls)).toEqual([]);
  });

  it('stays unsaved while a save of an older value is answered', async () => {
    const releases: ((r: Response) => void)[] = [];
    const { store } = await signIn('server', () => new Promise<Response>((resolve) => releases.push(resolve)));

    void store.updateSettings({ messagesPerPage: 10 });
    await vi.waitFor(() => expect(releases).toHaveLength(1));
    void store.updateSettings({ messagesPerPage: 30 });
    releases[0](json(200, {}));
    await vi.waitFor(() => expect(releases).toHaveLength(2));
    // The save that landed carried 10, so 30 is still this browser's to send.
    expect(stored()).toEqual({ messagesPerPage: { value: 30, base: 10 } });

    releases[1](json(200, {}));
    await vi.waitFor(() => expect(stored()).toBeNull());
  });

  it('is not carried into the next sign-in', async () => {
    const before = await signIn('server', () => json(503));
    await before.store.updateSettings({ signature: 'typed here' });

    clearSessionSettings();
    window.dispatchEvent(new CustomEvent('session-cleared'));
    expect(stored()).toBeNull();

    const after = await signIn('server', () => json(200, {}));
    await Promise.resolve();
    expect(after.store.getState().signature).toBe('server');
    expect(puts(after.calls)).toEqual([]);
  });

  it('is not one when the setting is set to the value it already has', async () => {
    const { store, calls } = await signIn('server', () => json(503));
    await store.updateSettings({ signature: 'server' });
    expect(stored()).toBeNull();
    expect(puts(calls)).toEqual([]);
  });
});

describe('local records', () => {
  it('starts from the browser-wide preferences before anyone signs in', () => {
    serve({});
    localStorage.setItem('alps_settings', JSON.stringify({ language: 'fr', themeMode: 'dark' }));
    const store = new SettingsStore();
    expect(store.getState()).toMatchObject({ language: 'fr', themeMode: 'dark', messagesPerPage: 50 });
    expect(document.body.classList.contains('theme-dark')).toBe(true);
  });

  it('reads the signed-in user\'s record over the browser-wide one', () => {
    localStorage.setItem('alps_settings', JSON.stringify({ language: 'fr', themeMode: 'dark' }));
    expect(readUserSettings()).toEqual({ language: 'fr', themeMode: 'dark' });
    localStorage.setItem('alps_active_user', USER);
    localStorage.setItem(`alps_settings_${USER}`, JSON.stringify({ language: 'de', signature: 'Ada' }));
    expect(readUserSettings()).toEqual({ language: 'de', themeMode: 'dark', signature: 'Ada' });
    localStorage.setItem(`alps_settings_${USER}`, '{broken');
    expect(readUserSettings()).toEqual({ language: 'fr', themeMode: 'dark' });
  });

  it('forgets the account on sign-out but keeps the look of the page', () => {
    localStorage.setItem('alps_settings', JSON.stringify({ themeMode: 'dark', language: 'fr', layoutMode: 'full', showSenderAvatars: false, signature: 'should not be here' }));
    localStorage.setItem('alps_active_user', USER);
    localStorage.setItem(`alps_settings_${USER}`, JSON.stringify({ signature: 'Ada' }));
    signedIn();
    document.cookie = 'alps_has_login_token=1; path=/';

    clearSessionSettings();
    expect(JSON.parse(localStorage.getItem('alps_settings')!)).toEqual({ themeMode: 'dark', language: 'fr', layoutMode: 'full', showSenderAvatars: false });
    expect(localStorage.getItem('alps_active_user')).toBeNull();
    expect(localStorage.getItem(`alps_settings_${USER}`)).toBeNull();
    expect(document.cookie).not.toContain('alps_logged_in=1');
    expect(document.cookie).not.toContain('alps_has_login_token=1');
  });

  it('keeps the sign-in cookies when switching accounts', () => {
    signedIn();
    clearSessionSettings(false);
    expect(document.cookie).toContain('alps_logged_in=1');
  });
});
