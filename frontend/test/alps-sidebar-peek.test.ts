/**
 * The collapsed sidebar's hover overlay ("peek"), owned by alps-sidebar.
 *
 * Five pages used to keep their own copy of this logic, and the copies had
 * drifted: mail, settings and contacts opened the overlay the instant the
 * pointer crossed the strip, calendar and tasks waited; contacts and tasks
 * never closed it after a choice; mail's folder list ignored the close and
 * stayed expanded and clickable in the strip. The visible bug was in the
 * copies: clicking the footer's collapse button left the pointer inside the
 * sidebar, which still counted as hovered, so it collapsed straight into its
 * full-width overlay over the message list instead of collapsing.
 *
 * The rules pinned here:
 *
 *  - the overlay opens only after the pointer has rested on the strip for the
 *    hover-intent delay, so passing along the left edge opens nothing;
 *  - it closes after a short grace once the pointer leaves, and coming back
 *    within the grace keeps it open;
 *  - collapsing never opens it, even with the pointer inside; it takes a fresh
 *    entry to peek;
 *  - closePeek() (a choice made in the overlay) shuts it the same way, and
 *    every page that navigates from its sidebar calls it;
 *  - on mobile there is no strip and no overlay.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, shadow, shadowAll, update, waitFor } from './helpers/dom';
import { settleSidebar } from './helpers/sidebar';
import { readSources } from './helpers/sources';
import { PEEK_CLOSE_DELAY_MS, PEEK_OPEN_DELAY_MS, type AlpsSidebar } from '../src/components/alps-sidebar';
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

async function sidebar(props: Record<string, unknown> = {}) {
  return mount<AlpsSidebar>('alps-sidebar', { i18nStore, collapsed: true, ...props });
}

const enter = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('mouseenter'));
const leave = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('mouseleave'));

async function wait(el: AlpsSidebar, ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
  await el.updateComplete;
}

describe('the sidebar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('peek on hover', () => {
    it('opens only after the hover-intent delay', async () => {
      const el = await sidebar();
      enter(el);
      await wait(el, PEEK_OPEN_DELAY_MS - 1);
      expect(el.peeking).toBe(false);
      expect(el.hasAttribute('peeking')).toBe(false);
      expect(el.strip).toBe(true);

      await wait(el, 1);
      expect(el.peeking).toBe(true);
      expect(el.hasAttribute('peeking')).toBe(true);
      // What the contents read: open, it is no longer the strip.
      expect(el.strip).toBe(false);
    });

    it('opens nothing when the pointer only passes over the strip', async () => {
      const el = await sidebar();
      enter(el);
      await wait(el, PEEK_OPEN_DELAY_MS / 2);
      leave(el);
      await wait(el, PEEK_OPEN_DELAY_MS * 2);
      expect(el.peeking).toBe(false);
    });

    it('closes after a grace once the pointer leaves, and re-entry keeps it open', async () => {
      const el = await sidebar();
      enter(el);
      await wait(el, PEEK_OPEN_DELAY_MS);
      expect(el.peeking).toBe(true);

      leave(el);
      await wait(el, PEEK_CLOSE_DELAY_MS - 1);
      expect(el.peeking).toBe(true);
      enter(el);
      await wait(el, PEEK_CLOSE_DELAY_MS * 2);
      expect(el.peeking).toBe(true);

      leave(el);
      await wait(el, PEEK_CLOSE_DELAY_MS);
      expect(el.peeking).toBe(false);
      expect(el.strip).toBe(true);
    });

    it('never peeks while expanded', async () => {
      const el = await sidebar({ collapsed: false });
      enter(el);
      await wait(el, PEEK_OPEN_DELAY_MS * 2);
      expect(el.peeking).toBe(false);
    });

    it('never peeks on mobile', async () => {
      const el = await sidebar({ isMobile: true });
      enter(el);
      await wait(el, PEEK_OPEN_DELAY_MS * 2);
      expect(el.peeking).toBe(false);
    });
  });

  describe('collapsing with the pointer inside', () => {
    it('collapses instead of opening the overlay', async () => {
      // The pointer is on the footer's collapse button: inside the sidebar,
      // entered while it was expanded.
      const el = await sidebar({ collapsed: false });
      enter(el);
      await wait(el, PEEK_OPEN_DELAY_MS);

      await update(el, { collapsed: true });
      await wait(el, PEEK_OPEN_DELAY_MS * 2);
      expect(el.peeking).toBe(false);
      expect(el.hasAttribute('peeking')).toBe(false);
    });

    it('peeks again only after the pointer leaves and comes back', async () => {
      const el = await sidebar({ collapsed: false });
      enter(el);
      await update(el, { collapsed: true });

      leave(el);
      enter(el);
      await wait(el, PEEK_OPEN_DELAY_MS);
      expect(el.peeking).toBe(true);
    });

    it('closes an open overlay when the sidebar expands', async () => {
      const el = await sidebar();
      enter(el);
      await wait(el, PEEK_OPEN_DELAY_MS);
      expect(el.peeking).toBe(true);

      await update(el, { collapsed: false });
      expect(el.peeking).toBe(false);
    });
  });

  describe('closePeek()', () => {
    it('shuts the overlay and keeps it shut until a fresh entry', async () => {
      const el = await sidebar();
      enter(el);
      await wait(el, PEEK_OPEN_DELAY_MS);
      expect(el.peeking).toBe(true);

      el.closePeek();
      await el.updateComplete;
      expect(el.peeking).toBe(false);
      await wait(el, PEEK_OPEN_DELAY_MS * 2);
      expect(el.peeking).toBe(false);

      leave(el);
      enter(el);
      await wait(el, PEEK_OPEN_DELAY_MS);
      expect(el.peeking).toBe(true);
    });

    it('cancels a pending open', async () => {
      const el = await sidebar();
      enter(el);
      await wait(el, PEEK_OPEN_DELAY_MS / 2);
      el.closePeek();
      await wait(el, PEEK_OPEN_DELAY_MS * 2);
      expect(el.peeking).toBe(false);
    });
  });
});

describe('one implementation', () => {
  // Source pin: the pages pass `collapsed` in, and their contents read the
  // strip from the sidebar; none of them keeps a hover timer or listens for
  // the pointer itself again.
  const pages = Object.entries(readSources()).filter(([, source]) => /<alps-sidebar[\s>]/.test(source));
  const sidebarContents = Object.entries(readSources()).filter(([path]) => path.endsWith('contacts-categories.ts'));

  // Settings is not among them: it is a window with a fixed section list.
  it('covers the four pages with a sidebar', () => {
    expect(pages.map(([path]) => path).sort()).toEqual([
      'plugins/caldav/frontend/calendar-page.ts',
      'plugins/caldav/frontend/tasks-page.ts',
      'plugins/carddav/frontend/contacts-page.ts',
      'src/pages/mailbox-page.ts',
    ]);
  });

  it.each([...pages, ...sidebarContents])('%s keeps no hover logic of its own', (_path, source) => {
    expect(source).not.toMatch(/isSidebarHovered|suppressSidebarHover|hoverTimeout|handleSidebarMouse/);
    expect(source).not.toMatch(/@mouse(enter|leave)=/);
  });
});

/**
 * The pages, mounted. The overlay is opened by setting the sidebar's own
 * `peeking`, as its hover timer would; what is pinned is that each page shows
 * its content expanded while it peeks, and that a choice made in the overlay
 * shuts it and returns the content to the strip.
 */
describe('the pages', () => {
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

  /** Lets the page render and the sidebar's strip state reach its content. */
  async function settle(page: El): Promise<void> {
    await page.updateComplete;
    await settleSidebar(shadow<AlpsSidebar>(page, 'alps-sidebar'));
  }

  /** Opens the overlay the way the sidebar's hover timer does, and lets the content follow. */
  async function peek(page: El): Promise<AlpsSidebar> {
    const bar = shadow<AlpsSidebar>(page, 'alps-sidebar');
    bar.peeking = true;
    await settle(page);
    return bar;
  }

  /** Whether `host`'s sidebar content is drawn as the strip. */
  const strip = (host: El) => shadow(host, '.sidebar-wrapper').classList.contains('collapsed');

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.startsWith('/mailboxes/')) {
        return new Response(JSON.stringify({
          Username: 'ada@example.com', Page: 0, Total: 0, MessagesPerPage: 50,
          Mailboxes: [{ Name: 'INBOX', Total: 0, Unseen: 0 }, { Name: 'Archive', Total: 0, Unseen: 0 }],
          Messages: [],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
  });

  afterEach(() => {
    messageSync.stop();
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.location.hash = '';
  });

  it('mail: picking a folder shuts the overlay and puts the folder list back in the strip', async () => {
    const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
    await waitFor(() => !!el.shadowRoot?.querySelector('alps-folder-list'), 'the folder list');
    const folders = shadow<El>(el, 'alps-folder-list');
    await settle(el);
    expect(strip(folders)).toBe(true);

    const bar = await peek(el);
    expect(strip(folders)).toBe(false);

    folders.dispatchEvent(new CustomEvent('select-mailbox', { detail: { name: 'Archive' } }));
    await settle(el);
    expect(bar.peeking).toBe(false);
    // The folder list used to stay expanded, undimmed and clickable in the
    // strip until the pointer left.
    expect(strip(folders)).toBe(true);
  });

  it('contacts: picking a category shuts the overlay', async () => {
    vi.spyOn(contactsService, 'fetchContacts').mockResolvedValue({ contacts: [] } as never);
    const el = await mount<El>('contacts-page', { i18nStore, settingsStore: settingsStore() });
    const categories = shadow<El>(el, 'alps-contacts-categories');
    await settle(el);
    expect(strip(categories)).toBe(true);

    const bar = await peek(el);
    expect(strip(categories)).toBe(false);

    categories.dispatchEvent(new CustomEvent('select-category', { detail: { category: 'Family' } }));
    await settle(el);
    expect(bar.peeking).toBe(false);
    expect(strip(categories)).toBe(true);
  });

  it('tasks: picking a list shuts the overlay', async () => {
    window.location.hash = '#/tasks';
    vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
    const el = await mount<El>('tasks-page', { i18nStore, settingsStore: settingsStore() });
    await settle(el);
    expect(strip(el)).toBe(true);

    const bar = await peek(el);
    expect(strip(el)).toBe(false);

    shadow(el, '.smart-list[data-list="today"]').click();
    await settle(el);
    expect(bar.peeking).toBe(false);
    expect(strip(el)).toBe(true);
  });

  describe('calendar: picking a day in the mini calendar', () => {
    async function calendarPage(): Promise<El> {
      window.location.hash = '#/calendar/month/2026-09';
      vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars: [] });
      vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
      vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
      const el = await mount<El>('calendar-page', { i18nStore, settingsStore: settingsStore() });
      await waitFor(() => el.loading === false, 'the calendar to load');
      await settle(el);
      return el;
    }

    /** Clicks the 17th of the month the mini calendar shows. */
    async function pickThe17th(el: El) {
      const mini = shadow<El>(shadow<El>(el, 'alps-sidebar-calendar'), 'calendar-mini-month');
      const day = shadowAll<HTMLElement>(mini, '.mini-day')
        .find((cell) => !cell.style.opacity && cell.textContent?.trim() === '17');
      expect(day, 'the 17th in the mini calendar').toBeDefined();
      day!.click();
      await settle(el);
    }

    it('shuts the overlay', async () => {
      const el = await calendarPage();
      expect(strip(el)).toBe(true);

      const bar = await peek(el);
      expect(strip(el)).toBe(false);

      await pickThe17th(el);
      expect(window.location.hash).toBe('#/calendar/day/2026-09-17');
      // The day view opened under an overlay that stayed until the pointer left.
      expect(bar.peeking).toBe(false);
      expect(strip(el)).toBe(true);
    });

    it('on a phone, closes the drawer', async () => {
      const el = await calendarPage();
      await update(el, { isMobile: true });
      shadow(el, 'app-header').dispatchEvent(new CustomEvent('toggle-sidebar'));
      await el.updateComplete;
      const bar = shadow<AlpsSidebar>(el, 'alps-sidebar');
      expect(bar.isOpen).toBe(true);

      await pickThe17th(el);
      expect(window.location.hash).toBe('#/calendar/day/2026-09-17');
      // The drawer stayed open over the day view and had to be closed by hand.
      expect(bar.isOpen).toBe(false);
      expect(bar.classList.contains('open')).toBe(false);
    });
  });
});
