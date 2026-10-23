/**
 * A plugin page whose module could not be fetched.
 *
 * A plugin's page loads when it is first shown, and the shell shows its
 * element by tag straight away, for the module to define. When the fetch
 * failed (a server restarting, a moment offline) the element stayed
 * undefined: the page was blank, with no word of why and no way back, and
 * while a composer was open no reload came to replace it. Showing the page
 * again did not help either. A browser keeps a failed import in the
 * document's module map, and importing the same module again rejects at once
 * without asking the server, so only a new document fetches it anew. Each
 * load here rejects, as the browser's does.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/app-root';
import { registry } from '../src/plugin-registry';
import * as appUpdate from '../src/services/app-update';
import { cleanup, flush, mount, waitFor } from './helpers/dom';

// See floating-composer-send.test.ts: the picker builds its grid on connect.
vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const USER = 'ada@example.com';
let tags = 0;

/** A plugin page whose module the browser cannot import, and its load. */
function brokenPage() {
  const component = `broken-page-${++tags}`;
  const path = `/${component}/*`;
  const load = vi.fn(() => Promise.reject(new TypeError('Failed to fetch dynamically imported module')));
  registry.registerRoute({ path, component, load });
  return { component, hash: `#/${component}/`, load };
}

const notice = (root: El) => root.shadowRoot!.querySelector('alps-page-load-error') as El | null;
const windows = (root: El) => root.shadowRoot!.querySelectorAll('alps-floating-composer');

beforeEach(() => {
  document.cookie = 'alps_logged_in=1';
  localStorage.setItem('alps_active_user', USER);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
});

afterEach(() => {
  cleanup();
  registry.routes = [];
  document.cookie = 'alps_logged_in=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  localStorage.clear();
  window.location.hash = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('a plugin page whose module could not be fetched', () => {
  it('says so, with a reload and the way back to Messages, and keeps the composer open', async () => {
    const page = brokenPage();
    window.location.hash = page.hash;
    const root = await mount<El>('app-root');
    root.composeStore.openComposer({ subject: 'Engines' });

    await waitFor(() => !!notice(root), 'the notice that the page could not be loaded');
    await notice(root)!.updateComplete;
    const shown = notice(root)!.shadowRoot!;
    expect(shown.querySelector('[role="alert"]')?.textContent).toContain('This page could not be loaded.');
    expect(shown.querySelector('alps-button')?.textContent?.trim()).toBe('Reload');
    expect(shown.querySelector('a')?.getAttribute('href')).toBe('#/mailbox/INBOX');
    expect(shown.querySelector('a')?.textContent?.trim()).toBe('Messages');
    expect(root.shadowRoot!.querySelector(page.component)).toBeNull();
    await waitFor(() => windows(root).length === 1, 'the composer, still open');
  });

  it('is not imported again each time it is shown, which would fetch nothing', async () => {
    const page = brokenPage();
    window.location.hash = page.hash;
    const root = await mount<El>('app-root');
    await waitFor(() => page.load.mock.calls.length === 1, 'the import');
    await flush();

    // Settings, a window over the page: the page is drawn again beneath it,
    // and again once it closes.
    window.location.hash = '#/settings';
    await waitFor(() => !!root.shadowRoot!.querySelector('settings-window'), 'Settings over the page');
    window.location.hash = page.hash;
    await waitFor(() => !root.shadowRoot!.querySelector('settings-window'), 'the page again');
    await flush();

    expect(page.load).toHaveBeenCalledTimes(1);
    expect(notice(root)).not.toBeNull();
  });

  it('reloads when asked, writing what was just typed in a composer to disk first', async () => {
    const reload = vi.spyOn(appUpdate, 'reloadForMissingPage').mockImplementation(() => {});
    const page = brokenPage();
    window.location.hash = page.hash;
    const root = await mount<El>('app-root');
    const store = root.composeStore;
    store.openComposer({ subject: 'Engines' });
    store.updateComposer(store.getState().activeComposers[0].id, { text: 'Dear Ada' });
    await waitFor(() => !!notice(root), 'the notice');
    await notice(root)!.updateComplete;

    (notice(root)!.shadowRoot!.querySelector('alps-button') as HTMLElement).click();

    expect(reload).toHaveBeenCalledTimes(1);
    // Within the half second the store waits before it writes, as a reload
    // straight after typing comes.
    expect(JSON.parse(localStorage.getItem(`alps_compose_drafts_${USER}`)!)).toEqual([
      expect.objectContaining({ subject: 'Engines', text: 'Dear Ada' }),
    ]);
  });

  it('keeps the only live edit when recovery storage fails, and reloads after storage recovers', async () => {
    const reload = vi.spyOn(appUpdate, 'reloadForMissingPage').mockImplementation(() => {});
    const page = brokenPage();
    window.location.hash = page.hash;
    const root = await mount<El>('app-root');
    const store = root.composeStore;
    store.openComposer({ subject: 'Engines', text: 'Stored earlier' });
    store.persistNow();
    await waitFor(() => !!notice(root), 'the failed-page notice');
    await notice(root)!.updateComplete;
    const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is full', 'QuotaExceededError');
    });
    const id = store.getState().activeComposers[0].id;
    store.updateComposer(id, { text: 'Only live edit', dirty: true });

    (notice(root)!.shadowRoot!.querySelector('alps-button') as HTMLElement).click();
    await notice(root)!.updateComplete;

    expect(reload).not.toHaveBeenCalled();
    expect(store.getComposer(id)).toMatchObject({ text: 'Only live edit', dirty: true });
    expect(JSON.parse(localStorage.getItem(`alps_compose_drafts_${USER}`)!)[0].text).toBe('Stored earlier');
    expect(notice(root)!.shadowRoot!.querySelector('.persist-error')?.textContent).toBe(root.i18nStore.t('composer.draftSaveFailedKeepOpen'));

    writes.mockRestore();
    (notice(root)!.shadowRoot!.querySelector('alps-button') as HTMLElement).click();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(`alps_compose_drafts_${USER}`)!)[0].text).toBe('Only live edit');
  });
});
