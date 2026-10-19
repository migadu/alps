/**
 * Back leaves the calendar and the tasks page.
 *
 * The Calendar and Tasks tabs set a bare `#/calendar` or `#/tasks`, which is a
 * history entry like any navigation. Each page then completed that address
 * with its view. It did so by ASSIGNING the hash, which is a navigation of its
 * own: a second entry on top of the bare one. Back returned to the bare entry,
 * whose `hashchange` ran the same completion and pushed the view back on top,
 * so Back could never get past the page.
 *
 * Completing the address is not a place the user went, so it must not be an
 * entry. What the user does inside the page (another view, another date,
 * another list) still is.
 *
 * These drive jsdom's model of the session history: `history.length`, and
 * `history.back()` with the `hashchange` it queues.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-page';
import '../../plugins/caldav/frontend/tasks-page';
import '../src/components/app-header';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { registry } from '../src/plugin-registry';
import { cleanup, flush, mount } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };

// The header draws its tabs from the registry; the plugin's index, which
// registers them, is not what is under test.
registry.registerNavTab({ id: 'calendar', pluginId: 'caldav', labelKey: 'navigation.calendar', order: 20 });
registry.registerNavTab({ id: 'tasks', pluginId: 'caldav', labelKey: 'navigation.tasks', order: 30 });

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars: [] });
  vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
  vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
  history.replaceState(null, '', '#/');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  history.replaceState(null, '', '#/');
});

const pad = (n: number) => String(n).padStart(2, '0');
const thisMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
};

/** Lets every queued `hashchange`, read and Lit update run out. */
async function settle(el: El, ticks = 6): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    await flush();
    await el.updateComplete;
  }
}

/** A navigation the browser's way: a new entry, then the event, as a task. */
async function follow(hash: string): Promise<void> {
  const arrived = new Promise((resolve) => window.addEventListener('hashchange', resolve, { once: true }));
  window.location.hash = hash;
  await arrived;
}

/** The page as the shell mounts it: on whatever the address is now. */
async function open(tag: string): Promise<El> {
  const el = await mount<El>(tag, { i18nStore });
  await settle(el);
  return el;
}

/** The browser's Back button, and whatever the page does about it. */
async function back(el: El): Promise<void> {
  const arrived = new Promise((resolve) => window.addEventListener('hashchange', resolve, { once: true }));
  history.back();
  await arrived;
  await settle(el);
}

describe('a calendar opened from its tab', () => {
  it('completes its address in place, without a history entry of its own', async () => {
    await follow('#/calendar');
    // Counted after the tab's navigation: a push also drops the entries ahead
    // of it, which earlier cases' Backs leave behind.
    const before = history.length;
    await open('calendar-page');

    expect(window.location.hash).toBe(`#/calendar/month/${thisMonth()}`);
    // The tab's navigation is the one entry. The completion is not a second.
    expect(history.length).toBe(before);
  });

  it('is left by one Back', async () => {
    await follow('#/calendar');
    const page = await open('calendar-page');

    await back(page);
    expect(window.location.hash).toBe('#/');
  });
});

describe('a bare #/calendar already in the history', () => {
  // An entry an earlier build left behind, still in an open tab's history.
  // Back lands on it with the calendar on screen.
  it('is completed in place, so Back does not push the calendar forward again', async () => {
    await follow('#/calendar');
    await follow('#/calendar/month/2026-03');
    const page = await open('calendar-page');

    await back(page);
    expect(window.location.hash).toBe('#/calendar/month/2026-03');

    await back(page);
    expect(window.location.hash).toBe('#/');
  });
});

describe("the user's own moves inside the calendar", () => {
  // The fix must not reach these: another view or date is a place the user
  // went, and Back is how they return from it.
  it('stay history entries Back walks through', async () => {
    await follow('#/calendar/week/2026-03-09');
    const page = await open('calendar-page');

    const toggle = page.shadowRoot!.querySelector('alps-toggle')!;
    toggle.dispatchEvent(new CustomEvent('change', { detail: { value: 'month' } }));
    await settle(page);
    expect(window.location.hash).toBe('#/calendar/month/2026-03');

    await back(page);
    expect(window.location.hash).toBe('#/calendar/week/2026-03-09');
    expect(page.viewMode).toBe('week');
  });
});

describe('a tasks page opened from its tab', () => {
  it('completes its address in place, and is left by one Back', async () => {
    await follow('#/tasks');
    const before = history.length;
    const page = await open('tasks-page');

    expect(window.location.hash).toBe('#/tasks/all');
    expect(history.length).toBe(before);

    await back(page);
    expect(window.location.hash).toBe('#/');
  });

  it('takes a list name it does not have the same way', async () => {
    await follow('#/tasks/someday?q=milk');
    const page = await open('tasks-page');
    expect(window.location.hash).toBe('#/tasks/all?q=milk');
    expect([page.selectedList, page.searchQuery]).toEqual(['all', 'milk']);

    await back(page);
    expect(window.location.hash).toBe('#/');
  });

  it("keeps the user's own move to another list an entry", async () => {
    await follow('#/tasks');
    const page = await open('tasks-page');

    page.navigate('today', '', '');
    await settle(page);
    expect(window.location.hash).toBe('#/tasks/today');

    await back(page);
    expect(window.location.hash).toBe('#/tasks/all');
    expect(page.selectedList).toBe('all');

    await back(page);
    expect(window.location.hash).toBe('#/');
  });
});
