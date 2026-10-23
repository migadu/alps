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

  it('keeps the page when the composers cannot be written, and says so', async () => {
    // Reloaded all the same, they would open again from what the disk held
    // before, or not at all.
    localStorage.setItem('alps_active_user', 'ada@example.com');
    const reload = vi.spyOn(appUpdate, 'applyUpdate').mockImplementation(() => {});
    const root = await mount<El>('app-root');
    const store = root.composeStore;
    store.openComposer({ subject: 'Engines' });
    store.updateComposer(store.getState().activeComposers[0].id, { subject: 'Engines and looms' });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); });

    window.dispatchEvent(new CustomEvent(appUpdate.UPDATE_AVAILABLE_EVENT));
    await waitFor(() => !!root.shadowRoot!.querySelector('alps-toast'), 'the offer');
    const offer = root.shadowRoot!.querySelector('alps-toast') as El;
    await offer.updateComplete;
    (offer.shadowRoot!.querySelector('alps-button') as HTMLElement).click();

    expect(reload).not.toHaveBeenCalled();
    await waitFor(() => (Array.from(root.shadowRoot!.querySelectorAll('alps-toast')) as El[])
      .some(t => t.message === 'Could not save this draft — the window stays open so nothing is lost'), 'the word that it stays');
  });

  it('keeps the drafts the login screen preserved when its Reload is pressed there', async () => {
    // Signed out by an expired cookie: the login screen clears the windows from
    // memory and leaves their copy on disk for the next sign-in. The Reload
    // wrote the empty list over it.
    localStorage.setItem('alps_active_user', 'ada@example.com');
    localStorage.setItem('alps_compose_drafts_ada@example.com', JSON.stringify([
      { id: 'c1', subject: 'Engines', text: 'Notes', to: [], cc: [], bcc: [], attachments: [], dirty: true },
    ]));
    const reload = vi.spyOn(appUpdate, 'applyUpdate').mockImplementation(() => {});
    const root = await mount<El>('app-root');
    await waitFor(() => !!root.shadowRoot!.querySelector('login-page'), 'the login screen');
    await waitFor(() => root.composeStore.getState().activeComposers.length === 0, 'the windows cleared');

    window.dispatchEvent(new CustomEvent(appUpdate.UPDATE_AVAILABLE_EVENT));
    await waitFor(() => !!root.shadowRoot!.querySelector('alps-toast'), 'the offer');
    const offer = root.shadowRoot!.querySelector('alps-toast') as El;
    await offer.updateComplete;
    (offer.shadowRoot!.querySelector('alps-button') as HTMLElement).click();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem('alps_compose_drafts_ada@example.com')!).map((c: any) => c.subject)).toEqual(['Engines']);
  });
});
