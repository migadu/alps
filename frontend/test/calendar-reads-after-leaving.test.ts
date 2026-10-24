/**
 * Reads of the calendar that answer after the page is left.
 *
 * The page reads its calendars, events and tasks when it opens, on a
 * navigation and on the periodic refresh, and a read can still be in flight
 * when the user goes on to Mail or Settings. Leaving removed the page's
 * listeners and its timer but left that read the latest one, so it still
 * wrote its answer into the page that was gone and, when it failed, said so
 * in a toast over whatever page was on screen by then.
 *
 * Leaving ends the page's reads. The page itself is kept, and shown again on
 * the way back, where it reads afresh. The reads are held open here and
 * answered after the page has gone.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-page';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { cleanup, flush, mount, record, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };

/** A request held open until the test answers it, or fails it. */
interface Held {
  resolve: (value: any) => void;
  reject: (err: Error) => void;
}

const work = { calendars: [{ name: 'Work', description: '', path: '/cal/work/' }] };
const noTasks = { tasks: [], calendars: [], failedCalendars: 0 };

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.location.hash = '';
});

/** The calendar page, its first read of the calendars and of the tasks held open. */
async function openCalendar() {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const calendars: Held[] = [];
  const tasks: Held[] = [];
  vi.spyOn(calendarService, 'fetchCalendars').mockImplementation(() => new Promise((resolve, reject) => {
    calendars.push({ resolve, reject });
  }));
  const events = vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
  vi.spyOn(tasksService, 'fetchTasks').mockImplementation(() => new Promise((resolve, reject) => {
    tasks.push({ resolve, reject });
  }));
  window.location.hash = '#/calendar/month/2026-09';
  const el = await mount<El>('calendar-page', { i18nStore });
  await waitFor(() => calendars.length === 1 && tasks.length === 1, 'the first read');
  return { el, calendars, tasks, events };
}

/** Lets an answer run through the page. */
async function settle(): Promise<void> {
  for (let i = 0; i < 3; i++) await flush();
}

describe('a read that answers after the page is left', () => {
  it('says nothing when it fails', async () => {
    const { el, calendars, tasks } = await openCalendar();
    const toasts = record<CustomEvent>(window, 'show-toast');

    el.remove();
    tasks[0].reject(new Error('offline'));
    calendars[0].reject(new Error('offline'));
    await settle();

    expect(toasts.map((toast) => toast.detail.message)).toEqual([]);
  });

  it('writes nothing into the page, and asks for no events', async () => {
    const { el, calendars, tasks, events } = await openCalendar();

    el.remove();
    tasks[0].resolve(noTasks);
    calendars[0].resolve(work);
    await settle();

    expect(el.calendars).toEqual([]);
    expect(events).not.toHaveBeenCalled();
  });

  it('leaves the page to read afresh, and finish loading, when it is shown again', async () => {
    const { el, calendars, tasks } = await openCalendar();
    const toasts = record<CustomEvent>(window, 'show-toast');

    el.remove();
    document.body.appendChild(el);
    await waitFor(() => calendars.length === 2 && tasks.length === 2, 'the read on return');

    // The read left behind fails after the page is back: it is not the
    // page's read any more, and neither says so nor ends the loading.
    tasks[0].reject(new Error('offline'));
    calendars[0].reject(new Error('offline'));
    await settle();
    expect(toasts).toEqual([]);
    expect(el.loading).toBe(true);

    tasks[1].resolve(noTasks);
    calendars[1].resolve(work);
    await waitFor(() => el.loading === false, 'the read on return to answer');
    expect(el.calendars.map((c: any) => c.name)).toEqual(['Work']);
  });
});

/**
 * A save that finishes after the page is left. A save reads the calendar
 * again when it succeeds; started from a page no longer on screen, that read
 * reported its own failure over the page the user had gone to. The save's
 * failure is still the user's to hear about.
 */
describe('a save that finishes after the page is left', () => {
  /** The calendar page, read once, with a new calendar's save held open. */
  async function savingCalendar() {
    const page = await openCalendar();
    page.tasks[0].resolve(noTasks);
    page.calendars[0].resolve(work);
    await waitFor(() => page.el.loading === false, 'the first read');
    let save!: Held;
    vi.spyOn(calendarService, 'createCalendar').mockImplementation(() => new Promise((resolve, reject) => {
      save = { resolve, reject };
    }));
    page.el.promptMode = 'add';
    void page.el.handlePromptSubmit(new CustomEvent('submit', { detail: { name: 'Trips' } }));
    await waitFor(() => save !== undefined, 'the save');
    return { ...page, save: () => save };
  }

  it('reads nothing for the page, so no failure of that read is reported', async () => {
    const { el, calendars, tasks, save } = await savingCalendar();
    const toasts = record<CustomEvent>(window, 'show-toast');

    el.remove();
    save().resolve({ ok: 'created', path: '/cal/trips/' });
    await settle();
    // Any read the save started fails, as it would offline.
    for (const read of [...calendars.slice(1), ...tasks.slice(1)]) read.reject(new Error('offline'));
    await settle();

    expect(toasts.map((toast) => toast.detail.message)).toEqual([]);
    expect(calendars).toHaveLength(1);
  });

  it('still says when the save itself fails', async () => {
    const { el, save } = await savingCalendar();
    const toasts = record<CustomEvent>(window, 'show-toast');

    el.remove();
    save().reject(new Error('offline'));
    await settle();

    expect(toasts.map((toast) => toast.detail.message)).toEqual(['calendar.saveCalendarFailed']);
  });
});
