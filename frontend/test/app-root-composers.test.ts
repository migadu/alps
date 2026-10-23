/**
 * The composer windows the shell draws, one per open composer.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/app-root';
import * as appUpdate from '../src/services/app-update';
import { cleanup, mount, waitFor } from './helpers/dom';

// See floating-composer-send.test.ts: the picker builds its grid on connect.
vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const windows = (root: El) => Array.from(root.shadowRoot!.querySelectorAll('alps-floating-composer')) as El[];

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('composer windows', () => {
  it('keep their element when another window closes', async () => {
    // Drawn by position, closing the first of three handed the second
    // window's element to the third composer: a send counting down there
    // went on to send the third message and left the second one sending.
    const root = await mount<El>('app-root');
    const store = root.composeStore;
    for (const subject of ['X', 'A', 'C']) store.openComposer({ subject });
    // Element identity is independent of how long the first lazy import
    // takes on a cold transform cache.
    await root.ensureComposerLoaded();
    await waitFor(() => windows(root).length === 3, 'three windows');
    const [, a, c] = windows(root);

    store.closeComposer(store.getState().activeComposers[0].id);
    await root.updateComplete;

    expect(windows(root)).toEqual([a, c]);
    expect(a.instance.subject).toBe('A');
    expect(c.instance.subject).toBe('C');
  });

  it('are drawn again for a change of shape, not for every keystroke', async () => {
    // Each keystroke is a store change, and each one re-rendered the whole
    // shell, the page under the windows included, while the user typed.
    const root = await mount<El>('app-root');
    const store = root.composeStore;
    store.openComposer({ subject: 'Engines', to: ['ada@example.com'] });
    await waitFor(() => windows(root).length === 1, 'the window');
    const [win] = windows(root);
    const id = store.getState().activeComposers[0].id;
    store.updateComposer(id, { text: 'D' });
    await root.updateComplete;

    const render = vi.spyOn(root, 'render');
    store.updateComposer(id, { text: 'Dear Ada' });
    store.updateComposer(id, { subject: 'Engines, again' });
    store.bringComposerToFront(id);
    await root.updateComplete;
    await win.updateComplete;

    expect(render).not.toHaveBeenCalled();
    // The window follows its composer by itself.
    expect(win.instance).toBe(store.getComposer(id));
    expect(win.instance.text).toBe('Dear Ada');

    store.updateComposer(id, { minimized: true });
    await root.updateComplete;
    expect(render).toHaveBeenCalled();
    expect(windows(root)).toEqual([win]);
    expect(win.instance.minimized).toBe(true);
  });
});

describe('the composer warmed while the app is idle', () => {
  let idle: Array<() => void>;

  beforeEach(() => {
    idle = [];
    vi.stubGlobal('requestIdleCallback', vi.fn((callback: () => void) => idle.push(callback)));
  });

  it('is not fetched for a shell that has left the document', async () => {
    const root = await mount<El>('app-root');
    expect(idle).toHaveLength(1);
    const load = vi.spyOn(root, 'ensureComposerLoaded').mockResolvedValue(undefined);
    root.remove();

    idle.forEach(callback => callback());

    expect(load).not.toHaveBeenCalled();
    expect(root.composerReady).toBe(false);
  });

  it('is fetched for a shell still on screen', async () => {
    const root = await mount<El>('app-root');
    const load = vi.spyOn(root, 'ensureComposerLoaded').mockResolvedValue(undefined);

    idle.forEach(callback => callback());

    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe('the update offer', () => {
  it('writes what was just typed to disk before its Reload', async () => {
    // The store writes half a second after the last change, and Reload,
    // pressed within it, took that much of what was typed with it.
    localStorage.setItem('alps_active_user', 'ada@example.com');
    let onDisk: string | null = null;
    const reload = vi.spyOn(appUpdate, 'applyUpdate').mockImplementation(() => {
      onDisk = localStorage.getItem('alps_compose_drafts_ada@example.com');
    });
    const root = await mount<El>('app-root');
    const store = root.composeStore;
    store.openComposer({ subject: 'Engines' });
    store.updateComposer(store.getState().activeComposers[0].id, { subject: 'Engines and looms' });

    window.dispatchEvent(new CustomEvent(appUpdate.UPDATE_AVAILABLE_EVENT));
    await waitFor(() => !!root.shadowRoot!.querySelector('alps-toast'), 'the offer');
    const offer = root.shadowRoot!.querySelector('alps-toast') as El;
    await offer.updateComplete;
    (offer.shadowRoot!.querySelector('alps-button') as HTMLElement).click();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(JSON.parse(onDisk!).map((c: any) => c.subject)).toEqual(['Engines and looms']);
  });

  it('Reload on the login screen leaves its preserved local drafts intact', async () => {
    document.cookie = 'alps_logged_in=1; path=/';
    history.replaceState(null, '', '#/mailbox/INBOX');
    localStorage.setItem('alps_active_user', 'ada@example.com');
    vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(
      url === '/session' ? { Username: 'ada@example.com', EnabledPlugins: [] }
        : url === '/settings' ? { Settings: { language: 'en' } }
        : { Messages: [], Total: 0, Mailboxes: [] },
    )));
    let onDisk: string | null = null;
    const reload = vi.spyOn(appUpdate, 'applyUpdate').mockImplementation(() => {
      onDisk = localStorage.getItem('alps_compose_drafts_ada@example.com');
    });
    try {
      const root = await mount<El>('app-root');
      const store = root.composeStore;
      store.openComposer({ subject: 'Keep this draft' });
      window.location.hash = '#/login';
      await waitFor(() => !!root.shadowRoot!.querySelector('login-page') && !store.getState().activeComposers.length, 'the login screen to clear the windows');
      expect(JSON.parse(localStorage.getItem('alps_compose_drafts_ada@example.com')!).map((c: any) => c.subject)).toEqual(['Keep this draft']);

      window.dispatchEvent(new CustomEvent(appUpdate.UPDATE_AVAILABLE_EVENT));
      await waitFor(() => !!root.shadowRoot!.querySelector('alps-toast'), 'the offer');
      const offer = root.shadowRoot!.querySelector('alps-toast') as El;
      await offer.updateComplete;
      (offer.shadowRoot!.querySelector('alps-button') as HTMLElement).click();
      window.dispatchEvent(new Event('pagehide'));

      expect(reload).toHaveBeenCalledTimes(1);
      expect(JSON.parse(onDisk!).map((c: any) => c.subject)).toEqual(['Keep this draft']);
      expect(JSON.parse(localStorage.getItem('alps_compose_drafts_ada@example.com')!).map((c: any) => c.subject)).toEqual(['Keep this draft']);
    } finally {
      document.cookie = 'alps_logged_in=; path=/; max-age=0';
      history.replaceState(null, '', '#/');
    }
  });

  it('keeps the page when the composers cannot be written, and says so', async () => {
    // Reloaded all the same, they would open again from what the disk held
    // before, or not at all.
    localStorage.setItem('alps_active_user', 'ada@example.com');
    const reload = vi.spyOn(appUpdate, 'applyUpdate').mockImplementation(() => {});
    const root = await mount<El>('app-root');
    const store = root.composeStore;
    store.openComposer({ subject: 'Engines' });
    store.updateComposer(store.getState().activeComposers[0].id, { subject: 'Engines and looms' });
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); });

    window.dispatchEvent(new CustomEvent(appUpdate.UPDATE_AVAILABLE_EVENT));
    await waitFor(() => !!root.shadowRoot!.querySelector('alps-toast'), 'the offer');
    const offer = root.shadowRoot!.querySelector('alps-toast') as El;
    await offer.updateComplete;
    await waitFor(() => offer.show, 'the visible offer');
    (offer.shadowRoot!.querySelector('alps-button') as HTMLElement).click();

    expect(reload).not.toHaveBeenCalled();
    await waitFor(() => (Array.from(root.shadowRoot!.querySelectorAll('alps-toast')) as El[])
      .some(t => t.message === 'Could not save this draft — the window stays open so nothing is lost'), 'the word that it stays');
    await root.updateComplete;
    await offer.updateComplete;
    expect(offer.show).toBe(true);

    // The same real button is still available once storage can accept the copy.
    storage.mockRestore();
    (offer.shadowRoot!.querySelector('alps-button') as HTMLElement).click();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem('alps_compose_drafts_ada@example.com')!).map((c: any) => c.subject)).toEqual(['Engines and looms']);
  });
});
