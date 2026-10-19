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
});
