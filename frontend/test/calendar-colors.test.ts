/**
 * The colour a calendar is drawn in.
 *
 * A calendar's colour is kept on its server, where every client reads it. The
 * pages drew each calendar in a colour worked out from its path instead, so a
 * calendar was one colour here and another in every other client. They now
 * draw the colour the server holds, and work one out only for a calendar that
 * has none.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-page';
import '../../plugins/caldav/frontend/tasks-page';
import { calendarService, getCalendarColor, type CalendarData, type EventData } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService, type TaskData } from '../../plugins/caldav/frontend/tasks-service';
import { cleanup, mount, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };
const work: CalendarData = { name: 'Work', description: '', path: '/cal/work/', color: '#123456' };
const trips: CalendarData = { name: 'Trips', description: '', path: '/cal/trips/' };
const event = (uid: string, calendarPath: string): EventData => ({
  uid, summary: uid, start: '2026-09-10T09:00:00Z', end: '2026-09-10T10:00:00Z', path: `${calendarPath}${uid}.ics`, calendarPath,
});
const task = (uid: string, calendarPath: string): TaskData => ({
  uid, title: uid, due: '2026-09-11T00:00:00Z', allDay: true, status: 'needs-action', path: `${calendarPath}${uid}.ics`, calendarPath, etag: 'v1',
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.location.hash = '';
});

describe('the colour of a calendar', () => {
  it('is the one its server holds, on the calendar page, for the calendar, its events and its tasks', async () => {
    vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars: [work, trips] });
    vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [event('standup', work.path), event('flight', trips.path)] });
    vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [task('report', work.path)], calendars: [], failedCalendars: 0 });
    window.location.hash = '#/calendar/month/2026-09';
    const el = await mount<El>('calendar-page', { i18nStore });
    await waitFor(() => el.loading === false && el.events.length === 3, 'the first read');

    const calendars = Object.fromEntries(el.calendars.map((c: CalendarData) => [c.name, c.color]));
    expect(calendars).toEqual({ Work: '#123456', Trips: getCalendarColor(trips.path) });
    const drawn = Object.fromEntries(el.events.map((e: EventData) => [e.uid, e.color]));
    expect(drawn).toEqual({ standup: '#123456', report: '#123456', flight: getCalendarColor(trips.path) });
  });

  it('is the one its server holds, on the tasks page, for the list and its tasks', async () => {
    vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({
      tasks: [task('report', work.path), task('pack', trips.path)],
      calendars: [work, trips],
      failedCalendars: 0,
    });
    const el = await mount<El>('tasks-page', { i18nStore });
    await waitFor(() => el.tasks.length === 2, 'the first read');

    const lists = Object.fromEntries(el.lists.map((l: CalendarData) => [l.name, l.color]));
    expect(lists).toEqual({ Work: '#123456', Trips: getCalendarColor(trips.path) });
    const drawn = Object.fromEntries(el.tasks.map((t: TaskData) => [t.uid, t.color]));
    expect(drawn).toEqual({ report: '#123456', pack: getCalendarColor(trips.path) });

    // A task changed on the page keeps its list's colour.
    el.handleSaved(new CustomEvent('saved', { detail: { task: { ...task('report', work.path), title: 'Report' }, created: false } }));
    expect(el.tasks.find((t: TaskData) => t.uid === 'report').color).toBe('#123456');
  });
});
