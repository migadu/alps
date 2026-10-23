/**
 * Picking a day in a mini calendar.
 *
 * The mini month announces a pick with a bubbling, composed `date-selected`.
 * The sidebar's calendar sent a second one of its own and did not stop the
 * first, so the calendar page heard every day picked in the sidebar twice.
 * The first set the hash; the second found it already set and read the
 * calendar at once, and the `hashchange` read it again.
 *
 * A pick is one `date-selected` and one read, from the sidebar as from the
 * year view, whose mini months the page hears directly.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-page';
import '../../plugins/caldav/frontend/alps-sidebar-calendar';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { cleanup, flush, mount, record, shadow, shadowAll, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.location.hash = '';
});

/** The 17th of the month a mini month shows. */
function the17th(mini: El): HTMLElement {
  const day = shadowAll<HTMLElement>(mini, '.mini-day')
    .find((cell) => !cell.style.opacity && cell.textContent?.trim() === '17');
  expect(day, 'the 17th in the mini calendar').toBeDefined();
  return day!;
}

/** Lets a pick, its hash change and any read it starts run through the page. */
async function settle(el: El): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await flush();
    await el.updateComplete;
  }
}

describe('picking a day in a mini calendar', () => {
  it('is one date-selected from the sidebar calendar', async () => {
    const sidebar = await mount<El>('alps-sidebar-calendar', { i18nStore, selectedDate: new Date(2026, 8, 3) });
    const mini = shadow<El>(sidebar, 'calendar-mini-month');
    await mini.updateComplete;
    const picked = record<CustomEvent>(sidebar, 'date-selected');

    the17th(mini).click();

    expect(picked.map((e) => (e.detail.date as Date).getDate())).toEqual([17]);
  });

  describe('on the calendar page', () => {
    async function calendarPage(hash: string) {
      window.location.hash = hash;
      const calendars = vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars: [] });
      const events = vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
      vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
      const el = await mount<El>('calendar-page', { i18nStore });
      await waitFor(() => el.loading === false, 'the calendar to load');
      await settle(el);
      calendars.mockClear();
      events.mockClear();
      return { el, calendars, events };
    }

    it('reads the calendar once for a day picked in the sidebar', async () => {
      const { el, calendars, events } = await calendarPage('#/calendar/month/2026-09');
      const mini = shadow<El>(shadow<El>(el, 'alps-sidebar-calendar'), 'calendar-mini-month');

      the17th(mini).click();
      await waitFor(() => window.location.hash === '#/calendar/day/2026-09-17', 'the day view');
      await waitFor(() => el.loading === false, 'the day to load');
      await settle(el);

      // It was read twice: at once, the second event finding the hash
      // already set, and again on the hash change.
      expect(calendars).toHaveBeenCalledTimes(1);
      expect(events).toHaveBeenCalledTimes(1);
      expect(el.viewMode).toBe('day');
      expect(el.currentDate.getDate()).toBe(17);
    });

    it('reads the calendar once for a day picked in the year view', async () => {
      const { el, calendars, events } = await calendarPage('#/calendar/year/2026');
      const september = shadowAll<El>(shadow<El>(el, 'calendar-year-view'), 'calendar-mini-month')[8];
      await september.updateComplete;

      the17th(september).click();
      await waitFor(() => window.location.hash === '#/calendar/day/2026-09-17', 'the day view');
      await waitFor(() => el.loading === false, 'the day to load');
      await settle(el);

      expect(calendars).toHaveBeenCalledTimes(1);
      expect(events).toHaveBeenCalledTimes(1);
      expect(el.viewMode).toBe('day');
    });
  });
});
