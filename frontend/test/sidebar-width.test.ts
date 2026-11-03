/**
 * The narrowest docked sidebar is the same on every page, and fits a row.
 *
 * A docked sidebar's content follows its width (sidebarLayoutStyles), so the
 * narrowest docked width decides what is left of a name beside a row's icon
 * and count. Each page stopped a drag at 150px, contacts with the number
 * written inline, and there the names were down to their first letters:
 * "In…" for the Inbox beside its count, "All Co…" and "Favori…" in Contacts.
 * A drag that ends short of the strip's snap now stops at SIDEBAR_WIDTH_MIN
 * on all four pages. (The rows themselves, measured: e2e/sidebar-strip.spec.ts.)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, shadow, waitFor } from './helpers/dom';
import { readSources } from './helpers/sources';
import { SIDEBAR_WIDTH_MIN, type AlpsSidebar } from '../src/components/alps-sidebar';
import '../src/pages/mailbox-page';
import '../../plugins/carddav/frontend/contacts-page';
import '../../plugins/caldav/frontend/tasks-page';
import '../../plugins/caldav/frontend/calendar-page';
import { messageSync } from '../src/services/message-sync';
import { SettingsStore } from '../src/store/settings-store';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

/** The defaults, with the sidebar docked. */
function settingsStore() {
  const state: Record<string, unknown> = {
    ...new SettingsStore().getState(),
    checkMailInterval: 0,
    loginUsername: 'ada@example.com',
    sidebarCollapsed: false,
  };
  return Object.assign(new EventTarget(), {
    getState: () => state,
    updateSettings: async (updates: Record<string, unknown>) => {
      Object.assign(state, updates);
      // As the real store does, so that the pages read the change.
      (settings as EventTarget).dispatchEvent(new Event('change'));
    },
  });
}

let settings: ReturnType<typeof settingsStore>;

const PAGES: [string, () => Promise<El>][] = [
  ['mail', () => mount<El>('mailbox-page', { i18nStore, settingsStore: settings, composeStore: new EventTarget() })],
  ['contacts', () => {
    vi.spyOn(contactsService, 'fetchContacts').mockResolvedValue({ contacts: [] } as never);
    return mount<El>('contacts-page', { i18nStore, settingsStore: settings });
  }],
  ['tasks', () => {
    window.location.hash = '#/tasks';
    vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
    return mount<El>('tasks-page', { i18nStore, settingsStore: settings });
  }],
  ['calendar', () => {
    window.location.hash = '#/calendar/month/2026-09';
    vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars: [] });
    vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
    vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
    return mount<El>('calendar-page', { i18nStore, settingsStore: settings });
  }],
];

beforeEach(() => {
  settings = settingsStore();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })));
});

afterEach(() => {
  messageSync.stop();
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.location.hash = '';
});

/** Ends a drag of the sidebar's edge at `width`, as alps-sidebar reports it. */
async function dragTo(page: El, width: number): Promise<AlpsSidebar> {
  const bar = shadow<AlpsSidebar>(page, 'alps-sidebar');
  bar.dispatchEvent(new CustomEvent('sidebar-resize', { detail: { newWidth: width, clientX: width } }));
  await page.updateComplete;
  await bar.updateComplete;
  return bar;
}

describe('a drag of the sidebar\'s edge', () => {
  it('stops docked sidebars at a width that fits a row', () => {
    expect(SIDEBAR_WIDTH_MIN).toBe(180);
  });

  it.each(PAGES)('%s: stops at the narrowest docked width short of the strip, and snaps to the strip below it', async (_name, open) => {
    const page = await open();
    await waitFor(() => !!page.shadowRoot?.querySelector('alps-sidebar'), 'the sidebar');

    let bar = await dragTo(page, 130);
    expect(bar.collapsed).toBe(false);
    expect(bar.width).toBe(SIDEBAR_WIDTH_MIN);

    bar = await dragTo(page, SIDEBAR_WIDTH_MIN + 20);
    expect(bar.width).toBe(SIDEBAR_WIDTH_MIN + 20);

    bar = await dragTo(page, 119);
    await waitFor(() => bar.collapsed, 'the strip');
  });
});

describe('the narrowest docked width is written once (source pin)', () => {
  const pages = Object.entries(readSources()).filter(([, source]) => /@sidebar-resize=/.test(source));

  it('finds the four pages with a sidebar', () => {
    expect(pages.map(([path]) => path).sort()).toEqual([
      'plugins/caldav/frontend/calendar-page.ts',
      'plugins/caldav/frontend/tasks-page.ts',
      'plugins/carddav/frontend/contacts-page.ts',
      'src/pages/mailbox-page.ts',
    ]);
  });

  it.each(pages)('%s clamps with SIDEBAR_WIDTH_MIN and keeps no number of its own', (_path, source) => {
    expect(source).toContain('SIDEBAR_WIDTH_MIN');
    expect(source).not.toMatch(/const SIDEBAR_WIDTH_MIN\b/);
    expect(source).not.toMatch(/Math\.max\(newWidth, \d+\)/);
  });
});
