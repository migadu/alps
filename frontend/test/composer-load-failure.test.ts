/**
 * When the message window cannot be loaded.
 *
 * The composer window's module is fetched on the first compose, or ahead of
 * it when the app is idle. In a build, a fetch that fails is answered by
 * Vite's preload helper with nothing once app-update has handled its error
 * event, so the load looked done: pressing Compose drew no window and said
 * nothing, and each press left one more composer in the store and on disk,
 * drawn nowhere, which also held app-update's own reload back. Here the
 * module defines nothing, as such a load settles.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/app-root';
import * as appUpdate from '../src/services/app-update';
import { cleanup, mount, waitFor } from './helpers/dom';

vi.mock('../src/components/alps-floating-composer', () => ({}));

type El = HTMLElement & Record<string, any>;

const USER = 'ada@example.com';
const DRAFTS = `alps_compose_drafts_${USER}`;
const NOTICE = 'The message window could not be loaded.';

const notices = (root: El) =>
  (Array.from(root.shadowRoot!.querySelectorAll('alps-toast')) as El[]).filter(t => t.message?.startsWith(NOTICE));
const composers = (root: El) => root.composeStore.getState().activeComposers;
const onDisk = () => JSON.parse(localStorage.getItem(DRAFTS) ?? '[]');

beforeEach(() => {
  document.cookie = 'alps_logged_in=1';
  localStorage.setItem('alps_active_user', USER);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
});

afterEach(() => {
  cleanup();
  document.cookie = 'alps_logged_in=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('when the message window cannot be loaded', () => {
  it('says so on Compose, and leaves no composer drawn nowhere', async () => {
    const root = await mount<El>('app-root');

    root.composeStore.openComposer();
    await waitFor(() => notices(root).length === 1, 'the notice');

    expect(notices(root)[0].message).toBe(`${NOTICE} Check your connection, then reload. Messages you are writing are kept.`);
    expect(notices(root)[0].actionLabel).toBe('Reload');
    expect(composers(root)).toEqual([]);
    expect(onDisk()).toEqual([]);

    // Pressed again, as a user does when nothing happened: still one notice,
    // and still nothing kept that cannot be shown.
    root.composeStore.openComposer();
    root.composeStore.openComposer();
    await waitFor(() => composers(root).length === 0, 'the composers given up');
    expect(notices(root)).toHaveLength(1);
  });

  it('keeps the drafts restored at start-up, and says the window could not be loaded', async () => {
    localStorage.setItem(DRAFTS, JSON.stringify([
      { id: 'c1', subject: 'Engines', text: 'Notes', to: [], cc: [], bcc: [], attachments: [], dirty: true },
    ]));
    const root = await mount<El>('app-root');

    await waitFor(() => notices(root).length === 1, 'the notice');
    expect(composers(root).map((c: any) => c.subject)).toEqual(['Engines']);
    expect(onDisk().map((c: any) => c.subject)).toEqual(['Engines']);
  });

  it('reloads from the notice, writing the composers to disk first', async () => {
    localStorage.setItem(DRAFTS, JSON.stringify([
      { id: 'c1', subject: 'Engines', text: 'Notes', to: [], cc: [], bcc: [], attachments: [], dirty: true },
    ]));
    let written: unknown = null;
    const reload = vi.spyOn(appUpdate, 'reloadForMissingPage').mockImplementation(() => {
      written = onDisk();
    });
    const root = await mount<El>('app-root');
    await waitFor(() => notices(root).length === 1, 'the notice');
    // A change the debounced write has not reached yet.
    root.composeStore.updateComposer('c1', { subject: 'Engines and looms' });

    notices(root)[0].onAction();

    expect(reload).toHaveBeenCalledTimes(1);
    expect((written as any[]).map(c => c.subject)).toEqual(['Engines and looms']);
  });

  it('stays when the composers cannot be written, and says so', async () => {
    // Reloaded all the same, the restored draft would come back as the disk
    // held it before, or not at all.
    localStorage.setItem(DRAFTS, JSON.stringify([
      { id: 'c1', subject: 'Engines', text: 'Notes', to: [], cc: [], bcc: [], attachments: [], dirty: true },
    ]));
    const reload = vi.spyOn(appUpdate, 'reloadForMissingPage').mockImplementation(() => {});
    const root = await mount<El>('app-root');
    await waitFor(() => notices(root).length === 1, 'the notice');
    root.composeStore.updateComposer('c1', { subject: 'Engines and looms' });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); });

    notices(root)[0].onAction();

    expect(reload).not.toHaveBeenCalled();
    await waitFor(() => (Array.from(root.shadowRoot!.querySelectorAll('alps-toast')) as El[])
      .some(t => t.message === 'Could not save this draft — the window stays open so nothing is lost'), 'the word that it stays');
  });
});
