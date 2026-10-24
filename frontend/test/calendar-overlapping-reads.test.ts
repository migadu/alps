/**
 * Reads of the calendar that overlap.
 *
 * The page reads its calendars and the events of the view on screen on every
 * navigation, on the periodic refresh and after a save, and two of those can
 * be in flight at once. Nothing tied an answer to the view that asked for it,
 * so whichever answered last was drawn: an earlier week that answered late
 * replaced the week on screen. And `loading` was cleared by whichever read
 * finished first, while the read for the view on screen was still running.
 *
 * Only the latest read writes the events, the calendars and `loading`. The
 * reads are held open here and answered in the order each test needs.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-page';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { cleanup, flush, mount, shadow, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };

/** A read of the events, held open until the test answers it with one event. */
interface Held {
  start: Date;
  answer: (summary: string) => void;
}

const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];
const summaries = (el: El) => el.events.map((event: any) => event.summary);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.location.hash = '';
});

/** The week of 7 September 2026, its first read answered. */
async function weekPage(): Promise<{ el: El; held: Held[] }> {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const held: Held[] = [];
  vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({
    calendars: [{ name: 'Work', description: '', path: '/cal/work/' }],
  });
  vi.spyOn(calendarService, 'fetchEvents').mockImplementation((start: Date) => new Promise((resolve) => {
    held.push({
      start,
      answer: (summary) => resolve({
        events: [{
          uid: summary, summary, start: start.toISOString(), end: start.toISOString(),
          path: `/cal/work/${summary}.ics`, calendarPath: '/cal/work/',
        }],
      }),
    });
  }));
  vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
  window.location.hash = '#/calendar/week/2026-09-07';
  const el = await mount<El>('calendar-page', { i18nStore });
  await waitFor(() => held.length === 1, 'the first read');
  held[0].answer('first week');
  await waitFor(() => el.loading === false, 'the first week');
  return { el, held };
}

/** Steps to the next week, as its button does, and waits for its read to be asked. */
async function nextWeek(el: El, held: Held[]): Promise<void> {
  const asked = held.length;
  el.changeDate(1);
  await waitFor(() => held.length === asked + 1, 'the next week\'s read');
}

/** Lets an answer run through the page. */
async function settle(el: El): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await flush();
    await el.updateComplete;
  }
}

describe('reads that overlap', () => {
  it('draws the week on screen when an earlier week answers last', async () => {
    const { el, held } = await weekPage();
    await nextWeek(el, held);
    await nextWeek(el, held);
    expect(held.map((read) => ymd(read.start))).toEqual([[2026, 9, 7], [2026, 9, 14], [2026, 9, 21]]);

    held[2].answer('third week');
    await waitFor(() => el.loading === false, 'the third week');
    expect(summaries(el)).toEqual(['third week']);

    held[1].answer('second week');
    await settle(el);
    expect(window.location.hash).toBe('#/calendar/week/2026-09-21');
    expect(summaries(el)).toEqual(['third week']);
  });

  it('keeps loading until the read for the week on screen answers', async () => {
    const { el, held } = await weekPage();
    await nextWeek(el, held);
    await nextWeek(el, held);

    held[1].answer('second week');
    await settle(el);
    expect(el.loading).toBe(true);
    expect(summaries(el)).toEqual(['first week']);

    held[2].answer('third week');
    await waitFor(() => el.loading === false, 'the third week');
    expect(summaries(el)).toEqual(['third week']);
  });
});

/**
 * A calendar deleted while a read is in flight. The read was made stale only
 * when the calendar's box was checked, since only then did the delete read the
 * calendar again: a calendar unchecked in the sidebar came back from the
 * earlier read, which still listed it, until the next refresh.
 */
describe('a calendar deleted during a read', () => {
  const work = { name: 'Work', description: '', path: '/cal/work/' };
  const trips = { name: 'Trips', description: '', path: '/cal/trips/' };
  const paths = (el: El) => el.calendars.map((calendar: any) => calendar.path);

  /** Work and Trips, the calendars read once; each later listing is held open. */
  async function twoCalendars(): Promise<{ el: El; listings: Array<(calendars: object[]) => void> }> {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const listings: Array<(calendars: object[]) => void> = [];
    vi.spyOn(calendarService, 'fetchCalendars').mockImplementation(() => new Promise((resolve) => {
      listings.push((calendars) => resolve({ calendars }));
    }));
    vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
    vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
    vi.spyOn(calendarService, 'deleteCalendar').mockResolvedValue(undefined);
    window.location.hash = '#/calendar/month/2026-09';
    const el = await mount<El>('calendar-page', { i18nStore });
    await waitFor(() => listings.length === 1, 'the first read');
    listings[0]([work, trips]);
    await waitFor(() => el.loading === false, 'the calendars');
    return { el, listings };
  }

  it('keeps an unchecked calendar deleted when a refresh from before the delete answers last', async () => {
    const { el, listings } = await twoCalendars();
    // Trips unchecked, then a refresh whose answer will still list it.
    el.toggleCalendar(trips.path);
    shadow(el, 'alps-icon-btn[icon="arrowsClockwise"]').click();
    await waitFor(() => listings.length === 2, 'the refresh');

    el.handleDeleteCalendar(trips);
    void el._executeDeleteCalendar();
    await waitFor(() => paths(el).length === 1, 'the delete');

    listings[1]([work, trips]);
    await settle(el);
    expect(paths(el)).toEqual([work.path]);

    // The delete reads the calendars again, and that read ends the loading.
    await waitFor(() => listings.length === 3, 'the read after the delete');
    listings[2]([work]);
    await waitFor(() => el.loading === false, 'the read after the delete');
    expect(paths(el)).toEqual([work.path]);
  });
});
