/**
 * The user's own address, where the login is not one.
 *
 * Some IMAP servers sign users in with a plain user name, and the multi
 * provider takes one under its default_domain. The server works out the
 * address at sign-in, and the browser used the login all the same wherever it
 * needed the user's address: "BCC myself" added `ada` to Bcc, which no send
 * survives, and Reply All and the list did not know the user's own address.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup, flush, installMatchMedia, installResizeObserver, installScrollIntoView, mount, shadowAll, waitFor,
} from './helpers/dom';
import { SettingsStore, ownAddress } from '../src/store/settings-store';
import { ComposeStore, type ComposerInstance } from '../src/store/compose-store';
import { messageOperations } from '../src/services/message-operations';
import { messageSync } from '../src/services/message-sync';
import { MessageCache } from '../src/utils/message-cache';
import '../src/components/alps-floating-composer';
import '../src/components/message-reader';
import '../src/components/message-list';
import '../src/pages/mailbox-page';

// See floating-composer-send.test.ts: the picker builds its grid on connect.
vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const LOGIN = 'ada';
const ADDRESS = 'ada@example.com';

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

/** A browser signed in as the bare login, the record holding what is given. */
function signIn(settings: Record<string, unknown> = {}) {
  localStorage.setItem('alps_active_user', LOGIN);
  localStorage.setItem(`alps_settings_${LOGIN}`, JSON.stringify({ loginUsername: LOGIN, loginAddress: ADDRESS, ...settings }));
}

/** A settings store holding `state`, as the components consume one. */
function settingsStore(state: Record<string, unknown>) {
  return Object.assign(new EventTarget(), {
    getState: () => state,
    updateSettings: vi.fn(async (updates: Record<string, unknown>) => { Object.assign(state, updates); }),
  });
}

const person = (Mailbox: string, Name = '') => ({ Name, Mailbox, Host: 'example.com' });

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
});

afterEach(() => {
  messageSync.stop();
  window.dispatchEvent(new CustomEvent('session-cleared'));
  cleanup();
  MessageCache.clear();
  localStorage.clear();
  document.cookie = 'alps_logged_in=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the address the server gives', () => {
  it('is kept beside the login when the session names the user', async () => {
    document.cookie = 'alps_logged_in=1; path=/';
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === '/session') return json({ Username: LOGIN, Address: ADDRESS });
      if (url === '/settings') return json({ Settings: {} });
      return new Response('{}', { status: 404 });
    }));
    const store = new SettingsStore();
    await vi.waitFor(() => expect(store.getState().loginAddress).toBe(ADDRESS));
    expect(store.getState().loginUsername).toBe(LOGIN);
    expect(ownAddress(store.getState())).toBe(ADDRESS);
  });

  it.each([undefined, 'bob@example.net'])(
    'uses only the new account address after login, with cached address %s', async (cachedAddress) => {
      document.cookie = 'alps_logged_in=1; path=/';
      vi.stubGlobal('fetch', vi.fn(async (url: string) => json(url === '/session'
        ? { Username: LOGIN, Address: ADDRESS }
        : { Settings: { language: 'en' } })));
      const store = new SettingsStore();
      await vi.waitFor(() => expect(store.recordRead).toBe(true));
      expect(ownAddress(store.getState())).toBe(ADDRESS);
      if (cachedAddress) {
        localStorage.setItem('alps_settings_bob', JSON.stringify({ loginAddress: cachedAddress }));
      }

      window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username: 'bob' } }));

      expect(store.getState().loginUsername).toBe('bob');
      expect(ownAddress(store.getState())).toBe(cachedAddress ?? 'bob');
      await vi.waitFor(() => expect(store.recordRead).toBe(true));
      expect(JSON.parse(localStorage.getItem('alps_settings_bob')!).loginAddress).toBe(cachedAddress);
    },
  );

  it('clears the address when a different username is applied without one', async () => {
    const store = new SettingsStore();
    await store.updateSettings({ loginUsername: LOGIN, loginAddress: ADDRESS });

    await store.updateSettings({ loginUsername: 'bob' });

    expect(store.getState().loginAddress).toBeUndefined();
    expect(ownAddress(store.getState())).toBe('bob');
    expect(JSON.parse(localStorage.getItem('alps_settings_bob')!).loginAddress).toBeUndefined();
  });

  it('clears a cached resolved address when a session reply omits Address', async () => {
    document.cookie = 'alps_logged_in=1; path=/';
    localStorage.setItem('alps_settings_bob', JSON.stringify({ loginAddress: 'obsolete@example.net' }));
    vi.stubGlobal('fetch', vi.fn(async (url: string) => json(url === '/session'
      ? { Username: 'bob' }
      : { Settings: { language: 'en' } })));
    const store = new SettingsStore();
    await vi.waitFor(() => expect(store.recordRead).toBe(true));

    expect(store.getState().loginAddress).toBeUndefined();
    expect(ownAddress(store.getState())).toBe('bob');
    expect(JSON.parse(localStorage.getItem('alps_settings_bob')!).loginAddress).toBeUndefined();
  });

  it('clears the previous address when a new session names only its login', async () => {
    document.cookie = 'alps_logged_in=1; path=/';
    let session: Record<string, string> = { Username: LOGIN, Address: ADDRESS };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => json(url === '/session'
      ? session : { Settings: { language: 'en' } })));
    const store = new SettingsStore();
    await vi.waitFor(() => expect(store.recordRead).toBe(true));
    expect(ownAddress(store.getState())).toBe(ADDRESS);
    session = { Username: 'bob' };

    window.dispatchEvent(new CustomEvent('user-logged-in'));

    await vi.waitFor(() => expect(store.getState().loginUsername).toBe('bob'));
    expect(store.getState().loginAddress).toBeUndefined();
    expect(ownAddress(store.getState())).toBe('bob');
  });

  it('clears a previously resolved address when a folder reply omits Address', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).startsWith('/mailboxes/') && !String(url).includes('/verdicts')
      ? json({ Username: LOGIN, Page: 0, Total: 0, MessagesPerPage: 50, Mailboxes: [{ Name: 'INBOX', Total: 0, Unseen: 0 }], Messages: [] })
      : new Response('{}', { status: 404 }))));
    const store = settingsStore({ layoutMode: 'vertical', densityMode: 'compact', sortOrder: 'desc', messagesPerPage: 50, checkMailInterval: 0, loginUsername: LOGIN, loginAddress: ADDRESS });
    await mount<El>('mailbox-page', { i18nStore, settingsStore: store, composeStore: new EventTarget() });

    await waitFor(() => store.getState().loginAddress === undefined, 'the login fallback from the listing');
    expect(ownAddress(store.getState())).toBe(LOGIN);
  });

  it('is kept when a folder listing names the user', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).startsWith('/mailboxes/') && !String(url).includes('/verdicts')
      ? json({ Username: LOGIN, Address: ADDRESS, Page: 0, Total: 0, MessagesPerPage: 50, Mailboxes: [{ Name: 'INBOX', Total: 0, Unseen: 0 }], Messages: [] })
      : new Response('{}', { status: 404 }))));
    const store = settingsStore({ layoutMode: 'vertical', densityMode: 'compact', sortOrder: 'desc', messagesPerPage: 50, checkMailInterval: 0, loginUsername: LOGIN });
    await mount<El>('mailbox-page', { i18nStore, settingsStore: store, composeStore: new EventTarget() });
    await waitFor(() => store.getState().loginAddress === ADDRESS, 'the address from the listing');
  });

  it('stands in for the login only once given', () => {
    expect(ownAddress({ loginUsername: LOGIN })).toBe(LOGIN);
    expect(ownAddress({ loginUsername: LOGIN, loginAddress: ADDRESS })).toBe(ADDRESS);
    expect(ownAddress(undefined)).toBe('');
  });
});

describe('BCC myself', () => {
  it('adds the address, not the login, to a message sent', async () => {
    signIn({ bccMyself: true });
    const instance: ComposerInstance = { id: 'c1', to: ['grace@example.org'], subject: 'Engines', text: 'Notes', format: 'text' };
    const composeStore = {
      getState: () => ({ activeComposers: [instance] }),
      getComposer: () => instance,
      updateComposer: vi.fn(),
      bringComposerToFront: vi.fn(),
      closeComposer: vi.fn(),
    };
    const el = await mount<El>('alps-floating-composer', { instance, composeStore, i18nStore });

    expect((el._buildFormData(instance) as FormData).get('bcc')).toBe(ADDRESS);
  });

  it('adds the address, not the login, to a draft saved on the way out', async () => {
    signIn({ bccMyself: true });
    const store = new ComposeStore();
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '1', mailbox: 'Drafts' });
    store.openComposer({ subject: 'Engines' });
    for (const c of store.getState().activeComposers) store.updateComposer(c.id, { dirty: true });
    await store.saveAllDirtyDrafts();

    expect((saveDraft.mock.calls[0][0] as FormData).get('bcc')).toBe(ADDRESS);
  });
});

describe('Reply All', () => {
  it('is not addressed to the user', async () => {
    const message = {
      UID: '7',
      Mailbox: 'INBOX',
      Flags: ['\\Seen'],
      Envelope: { Subject: 'Engines', Date: '2026-09-01T10:00:00Z', From: [person('grace', 'Grace')], To: [person('ada', 'Ada'), person('bob')], Cc: [] },
    };
    // A body to answer: one that cannot be read is answered with nothing.
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (/\/messages\/7\?view=/.test(String(url))
      ? new Response(JSON.stringify({ Part: { Path: [1], MIMEType: 'text/plain' }, Body: 'Notes', HasText: true }), { status: 200 })
      : new Response('{}', { status: 404 }))));
    const composeStore = { openComposer: vi.fn() };
    const el = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore({ enableThreading: true, preferredView: 'text', showRemoteContent: 'never', loginUsername: LOGIN, loginAddress: ADDRESS }),
      i18nStore,
      composeStore,
      mailbox: 'INBOX',
      mailboxes: [],
      messages: [message],
      message,
    });

    await el._handleAction('replyAll');

    const opened = composeStore.openComposer.mock.calls[0][0];
    expect([...opened.to, ...(opened.cc ?? [])]).toEqual(['Grace <grace@example.com>', 'bob@example.com']);
  });
});

describe('the list', () => {
  it('does not name the user among a message\'s people', async () => {
    const row = {
      UID: '7',
      Flags: ['\\Seen'],
      Envelope: { Subject: 'Engines', Date: '2026-09-01T10:00:00Z', From: [person('grace', 'Grace')], To: [person('ada', 'Ada')], Cc: [] },
    };
    const el = await mount<El>('alps-message-list', {
      messages: [row],
      currentMailbox: 'INBOX',
      totalMessages: 1,
      showSenderAvatars: false,
      settingsStore: settingsStore({ loginUsername: LOGIN, loginAddress: ADDRESS }),
    });
    await flush();

    expect(shadowAll(el, '.message-sender span').map(s => s.getAttribute('title'))).toEqual(['grace@example.com']);
  });
});
