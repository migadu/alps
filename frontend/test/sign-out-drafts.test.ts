/**
 * Signing out with drafts the server does not have.
 *
 * Sign-out saves the open drafts first. One the server could not store
 * (offline, a 500, a send still in its undo window) used to be lost with the
 * session, and the login screen could only say so afterwards. Now Sign Out
 * asks first, and keeps the draft on this device if the user goes ahead; the
 * idle sign-out never waits for an answer, and keeps it too.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/alps-header';
import '../src/components/alps-floating-composer';
import { ComposeStore } from '../src/store/compose-store';
import { messageOperations } from '../src/services/message-operations';
import { autoLogoutService } from '../src/services/auto-logout';
import { DraftFlushError } from '../src/utils/draft-flush-error';
import { takeLoginNotice } from '../src/utils/login-notice';
import { cleanup, mount, record } from './helpers/dom';

// See floating-composer-send.test.ts: the picker builds its grid on connect.
vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const USER = 'ada@example.com';
const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });
const stores: ComposeStore[] = [];
const storedDrafts = () => JSON.parse(localStorage.getItem(`alps_compose_drafts_${USER}`) ?? 'null');

function signedIn(): ComposeStore {
  localStorage.setItem('alps_active_user', USER);
  localStorage.setItem(`alps_settings_${USER}`, JSON.stringify({ loginUsername: USER }));
  const store = new ComposeStore();
  stores.push(store);
  store.openComposer({ subject: 'Engines', to: ['charles@example.com'] });
  store.updateComposer(store.getState().activeComposers[0].id, { text: 'written offline' });
  return store;
}

const signOutRequests = () =>
  vi.mocked(fetch).mock.calls.filter(([url, init]) => url === '/session' && init?.method === 'DELETE');

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
  history.replaceState(null, '', '/#/mailbox/INBOX');
});

afterEach(() => {
  cleanup();
  for (const store of stores.splice(0)) {
    const s = store as any;
    window.removeEventListener('session-cleared', s.handleSessionCleared);
    window.removeEventListener('user-logged-in', s.adoptSession);
    window.removeEventListener('alps-active-user-changed', s.adoptSession);
    if (s.saveTimeout !== null) window.clearTimeout(s.saveTimeout);
  }
  autoLogoutService.onBeforeLogout = undefined;
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Sign Out with a draft the server refused', () => {
  async function header(composeStore: ComposeStore) {
    const el = await mount<El>('alps-header', { username: USER, i18nStore, composeStore });
    await el.handleSignOut();
    await el.updateComplete;
    return el;
  }

  it('asks first, and stays signed in with the window open on Cancel', async () => {
    vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue(null);
    const store = signedIn();
    const cleared = record(window, 'session-cleared');
    const el = await header(store);

    const asked = el.shadowRoot!.querySelector('ui-confirm');
    expect(asked?.getAttribute('heading')).toBe('userMenu.unsavedDraftsTitle');
    expect(asked?.getAttribute('confirmText')).toBe('userMenu.signOutAnyway');

    asked!.dispatchEvent(new CustomEvent('cancel'));
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('ui-confirm')).toBeNull();
    expect(signOutRequests()).toHaveLength(0);
    expect(cleared).toHaveLength(0);
    expect(store.getState().activeComposers.map(c => c.subject)).toEqual(['Engines']);
  });

  it('signs out on Confirm, and keeps the draft on this device for the next sign-in', async () => {
    vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue(null);
    const store = signedIn();
    const el = await header(store);

    el.shadowRoot!.querySelector('ui-confirm')!.dispatchEvent(new CustomEvent('confirm'));
    await vi.waitFor(() => expect(window.location.hash).toBe('#/login'));

    expect(signOutRequests()).toHaveLength(1);
    expect(store.getState().activeComposers).toEqual([]);
    expect(storedDrafts().map((c: any) => c.text)).toEqual(['written offline']);
    expect(takeLoginNotice()).toBe('signedOutDraftsKept');
  });

  it('signs out at once when every draft is stored, and erases the copy on disk', async () => {
    vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts' });
    const store = signedIn();
    const el = await header(store);

    expect(el.shadowRoot!.querySelector('ui-confirm')).toBeNull();
    expect(signOutRequests()).toHaveLength(1);
    expect(storedDrafts()).toBeNull();
    expect(takeLoginNotice()).toBe('signedOut');
  });
});

describe('the idle sign-out with a draft the server refused', () => {
  it('goes ahead, keeps the draft on this device, and says so', async () => {
    vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue(null);
    const store = signedIn();
    autoLogoutService.onBeforeLogout = () => store.saveAllDirtyDrafts();

    await (autoLogoutService as any).logout();

    expect(signOutRequests()).toHaveLength(1);
    expect(store.getState().activeComposers).toEqual([]);
    expect(storedDrafts().map((c: any) => c.text)).toEqual(['written offline']);
    expect(takeLoginNotice()).toBe('inactivitySignedOutDraftsKept');
    expect(window.location.hash).toBe('#/login');
  });

  it('signs out plainly when the drafts were stored', async () => {
    autoLogoutService.onBeforeLogout = async () => {};
    await (autoLogoutService as any).logout();
    expect(takeLoginNotice()).toBe('inactivitySignedOut');
  });

  it('is not held back by a failure that keeps nothing', async () => {
    autoLogoutService.onBeforeLogout = async () => { throw new DraftFlushError(); };
    await (autoLogoutService as any).logout();
    expect(signOutRequests()).toHaveLength(1);
    expect(window.location.hash).toBe('#/login');
  });
});

describe('a draft its window is saving at sign-out', () => {
  it('is left to that save, not saved a second time beside it', async () => {
    // Two saves of one draft each store a new copy and delete the one they
    // started from, so one of the two copies would be left behind in Drafts.
    let land!: (answer: unknown) => void;
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft')
      .mockImplementationOnce(() => new Promise(resolve => { land = resolve; }) as any);
    const store = signedIn();
    const [instance] = store.getState().activeComposers;
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    const saving = el._saveDraft();
    await expect(store.saveAllDirtyDrafts()).rejects.toBeInstanceOf(DraftFlushError);
    land({ uid: '8', mailbox: 'Drafts' });
    await saving;

    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(store.getState().activeComposers).toHaveLength(1);
    expect(store.getComposer(instance.id)).toMatchObject({ isSaving: false, draftUid: '8' });
  });
});
