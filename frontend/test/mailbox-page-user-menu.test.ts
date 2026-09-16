/**
 * The user menu on the mail page.
 *
 * The header draws it only once it has a username, and the mail page used to
 * learn that from nothing but a folder listing that succeeded. A listing that
 * failed — an account whose inbox had never received mail was one — left the
 * mail page with no menu, and so no way to sign out, while Calendar and
 * Contacts, which read the signed-in user from the session, showed it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/mailbox-page';
import { cleanup, mount, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const USER = 'ada@example.com';

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

/** A settings store that knows the signed-in user once the session has said so. */
function settingsStore(loginUsername?: string) {
  const state: Record<string, unknown> = {
    layoutMode: 'vertical',
    densityMode: 'compact',
    sortOrder: 'desc',
    messagesPerPage: 50,
    checkMailInterval: 0,
    loginUsername,
  };
  const store = Object.assign(new EventTarget(), {
    getState: () => state,
    updateSettings: async (updates: Record<string, unknown>) => {
      Object.assign(state, updates);
    },
    sessionAnswered: (username: string) => {
      state.loginUsername = username;
      store.dispatchEvent(new Event('change'));
    },
  });
  return store;
}

/** The header's user menu, three shadow roots down, or null while it is not drawn. */
const userMenu = (page: El): El | null =>
  page.shadowRoot?.querySelector('app-header')?.shadowRoot?.querySelector('alps-header')?.shadowRoot?.querySelector<El>('user-profile-menu') ?? null;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  // The listing fails the way it did for an inbox with nothing on disk yet.
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).startsWith('/mailboxes/')
    ? new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    : new Response('{}', { status: 404 }))));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the user menu on the mail page', () => {
  it('is drawn for the signed-in user when the listing fails', async () => {
    const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(USER), composeStore: new EventTarget() });
    await waitFor(() => el.loadingMessages === false, 'the listing to fail', 2000);
    await waitFor(() => userMenu(el)?.username === USER, 'the user menu');
    expect(userMenu(el)?.username).toBe(USER);
  });

  it('appears when the session names the user after the page is already up', async () => {
    const store = settingsStore();
    const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: store, composeStore: new EventTarget() });
    await waitFor(() => el.loadingMessages === false, 'the listing to fail', 2000);
    expect(userMenu(el)).toBeNull();
    store.sessionAnswered(USER);
    await waitFor(() => userMenu(el)?.username === USER, 'the user menu');
  });
});
