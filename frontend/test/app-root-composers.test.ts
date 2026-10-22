/**
 * The composer windows the shell draws, one per open composer.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/app-root';
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
