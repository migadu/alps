/**
 * The settings store.
 *
 * A save sends the WHOLE record, so the store must never save before it has
 * read the server's copy — or one failed read at sign-in overwrites every
 * setting the account had with this browser's defaults. And it must end on the
 * latest value when changes arrive faster than saves complete.
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

  it('applies the account\'s choice about sender avatars, and saves it with the rest', async () => {
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
    expect(put.ui.showSenderAvatars).toBe(true);
  });

  it('sends the shell to sign-in when there is no session at all', async () => {
    const authErrors = record('auth-error');
    const calls = serve({});
    new SettingsStore();
    await vi.waitFor(() => expect(authErrors.length).toBeGreaterThan(0));
    expect(calls).toHaveLength(0);
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
    // The change made while the record could not be read wins; the rest is the server's.
    expect(put).toMatchObject({ signature: 'typed here', from: 'Ada Lovelace', language: 'de' });
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
