/**
 * The collapsed sidebar strip is inert, not only dimmed.
 *
 * The strip shows each sidebar's content dimmed with `pointer-events: none`
 * (sidebarLayoutStyles): the mouse cannot use it until the strip peeks open.
 * The keyboard still could. Tab walked into mail's folder carets, the tasks
 * lists, the mini-month's buttons and the contacts category icons, several of
 * them clipped past the strip's 64px edge, and Enter used them. `inert` takes
 * the same subtree away from the keyboard and the accessibility tree.
 *
 * The strip's Create button lives OUTSIDE the dimmed content and is meant to
 * work there, so it must stay outside the inert subtree; the footer's expand
 * button is in the sidebar's own shadow root, outside it by construction. A
 * mobile drawer is never the strip, so it is never inert.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, shadow, update, waitFor } from './helpers/dom';
import { readSources } from './helpers/sources';
import { SettingsStore } from '../src/store/settings-store';
import '../src/components/folder-list';
import '../src/pages/settings-page';
import '../../plugins/carddav/frontend/contacts-categories';
import '../../plugins/caldav/frontend/tasks-page';
import '../../plugins/caldav/frontend/calendar-page';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

/** The defaults, with the sidebar collapsed to its strip. */
function settingsStore() {
  const state: Record<string, unknown> = {
    ...new SettingsStore().getState(),
    checkMailInterval: 0,
    loginUsername: 'ada@example.com',
    sidebarCollapsed: true,
  };
  return Object.assign(new EventTarget(), {
    getState: () => state,
    updateSettings: async (updates: Record<string, unknown>) => {
      Object.assign(state, updates);
    },
  });
}

const content = (el: El) => shadow(el, '.sidebar-content');
const inert = (el: El) => content(el).hasAttribute('inert');
const createIsLive = (el: El) => shadow(el, 'alps-create-button').closest('[inert]') === null;

/** Sets page state the way its own handlers do, and waits for the render. */
async function set(el: El, patch: Record<string, unknown>) {
  Object.assign(el, patch);
  await el.updateComplete;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.location.hash = '';
});

describe('every dimmed sidebar content is inert in the strip (source pin)', () => {
  // A sidebar added later inherits the dimming from sidebarLayoutStyles by
  // using this class; it must not forget the half the keyboard needs.
  const tags = Object.entries(readSources())
    .filter(([path]) => !path.endsWith('/components/alps-sidebar.ts'))
    .flatMap(([path, source]) =>
      [...source.matchAll(/<[a-z-]+\s+class="sidebar-content"[^>]*>/g)].map((m) => [path, m[0]] as const),
    );

  it('finds the five containers', () => {
    expect(tags.map(([path]) => path).sort()).toEqual([
      'plugins/caldav/frontend/calendar-page.ts',
      'plugins/caldav/frontend/tasks-page.ts',
      'plugins/carddav/frontend/contacts-categories.ts',
      'src/components/folder-list.ts',
      'src/pages/settings-page.ts',
    ]);
  });

  it.each(tags)('%s', (_path, tag) => {
    expect(tag).toMatch(/\?inert=\$\{/);
  });
});

describe('mail (alps-folder-list)', () => {
  const list = (collapsed: boolean) => mount<El>('alps-folder-list', { i18nStore, mailboxes: [], collapsed });

  it('is inert in the strip, with Compose still live', async () => {
    const el = await list(true);
    expect(inert(el)).toBe(true);
    expect(createIsLive(el)).toBe(true);
  });

  it('is live when expanded or peeking (the page passes collapsed=false then)', async () => {
    const el = await list(false);
    expect(inert(el)).toBe(false);
  });
});

describe('contacts (alps-contacts-categories)', () => {
  it('is inert in the strip and live when it peeks, with Create still live', async () => {
    const el = await mount<El>('alps-contacts-categories', { i18nStore, sidebarCollapsed: true, isMobile: false, sidebarPeeking: false });
    expect(inert(el)).toBe(true);
    expect(createIsLive(el)).toBe(true);

    await update(el, { sidebarPeeking: true });
    expect(inert(el)).toBe(false);
  });

  it('is live on mobile, whatever the saved setting says', async () => {
    const el = await mount<El>('alps-contacts-categories', { i18nStore, sidebarCollapsed: true, isMobile: true });
    expect(inert(el)).toBe(false);
  });
});

describe('tasks (tasks-page)', () => {
  it('is inert in the strip and live when it peeks or on mobile, with Create still live', async () => {
    window.location.hash = '#/tasks';
    vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
    const el = await mount<El>('tasks-page', { i18nStore, settingsStore: settingsStore() });
    expect(inert(el)).toBe(true);
    expect(content(el).querySelector('.smart-list')).not.toBeNull();
    expect(createIsLive(el)).toBe(true);

    await set(el, { sidebarPeeking: true });
    expect(inert(el)).toBe(false);

    await set(el, { sidebarPeeking: false, isMobile: true });
    expect(inert(el)).toBe(false);
  });
});

describe('calendar (calendar-page)', () => {
  it('is inert in the strip (calendars, menus and the mini-month) and live when it peeks or on mobile', async () => {
    vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars: [] });
    vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
    vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
    window.location.hash = '#/calendar/month/2026-08';
    const el = await mount<El>('calendar-page', { i18nStore });
    await waitFor(() => !el.loading, 'the first read');
    expect(inert(el)).toBe(false);

    await set(el, { sidebarCollapsed: true });
    expect(inert(el)).toBe(true);
    expect(content(el).querySelector('alps-sidebar-calendar')).not.toBeNull();
    expect(createIsLive(el)).toBe(true);

    await set(el, { sidebarPeeking: true });
    expect(inert(el)).toBe(false);

    await set(el, { sidebarPeeking: false, isMobile: true });
    expect(inert(el)).toBe(false);
  });
});

describe('settings (settings-page)', () => {
  it('is inert in the strip and live when it peeks or on mobile', async () => {
    const el = await mount<El>('settings-page', { i18nStore, settingsStore: settingsStore() });
    expect(inert(el)).toBe(true);

    await set(el, { sidebarPeeking: true });
    expect(inert(el)).toBe(false);

    await set(el, { sidebarPeeking: false, isMobile: true });
    expect(inert(el)).toBe(false);
  });
});
