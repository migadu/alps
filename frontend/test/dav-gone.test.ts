/**
 * Writes to an event or a task that another device has deleted.
 *
 * An edit, a tick or an answer is made to what the page last read. Deleted
 * elsewhere since, it is not there to write: the server answered 500, and the
 * page said the save had failed and logged the failure. The server now answers
 * 404, and the page says it was deleted on another device and reads the
 * calendar or the list again, as it does for a version saved elsewhere. An
 * editor stays open, so what was typed is not lost with it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-event-modal';
import '../../plugins/caldav/frontend/task-modal';
import '../../plugins/caldav/frontend/tasks-page';
import '../../plugins/caldav/frontend/calendar-page';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService, type TaskData } from '../../plugins/caldav/frontend/tasks-service';
import { HttpStatusError } from '../src/utils/fetch-utils';
import { cleanup, mount, record, shadow } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };
const gone = () => new HttpStatusError(404, 'Not Found');

const event = {
  uid: 'standup', summary: 'Standup', path: '/cal/work/standup.ics', calendarPath: '/cal/work/',
  start: '2026-09-14T09:00:00.000Z', end: '2026-09-14T10:00:00.000Z', allDay: false, etag: 'v4',
};
const rent: TaskData = {
  uid: 'rent', title: 'rent', allDay: true, due: '2026-09-15T00:00:00Z', status: 'needs-action',
  path: '/cal/work/rent.ics', calendarPath: '/cal/work/', etag: 'rent-v1',
};

let errors: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  window.location.hash = '';
});

describe('an editor whose event or task was deleted elsewhere', () => {
  it('says so of an event, stays open, and has the page re-read', async () => {
    vi.spyOn(calendarService, 'updateEvent').mockRejectedValue(gone());
    const el = await mount<El>('calendar-event-modal', {
      i18nStore, calendars: [{ name: 'Work', description: '', path: '/cal/work/' }], event, open: true,
    });
    const toasts = record<CustomEvent>(window, 'show-toast');
    const rereads = record(el, 'conflict');

    await el.handleSave();

    expect(toasts.map(t => t.detail.message)).toEqual(['calendar.deletedElsewhere']);
    expect([rereads.length, el.open]).toEqual([1, true]);
    expect(errors).not.toHaveBeenCalled();
  });

  it('says so of a task, stays open, and has the page re-read', async () => {
    vi.spyOn(tasksService, 'updateTask').mockRejectedValue(gone());
    const el = await mount<El>('task-modal', {
      i18nStore, lists: [{ name: 'Work', description: '', path: '/cal/work/' }], task: rent, open: true,
    });
    const toasts = record<CustomEvent>(window, 'show-toast');
    const rereads = record(el, 'conflict');

    await el.handleSave();

    expect(toasts.map(t => t.detail.message)).toEqual(['tasks.deletedElsewhere']);
    expect([rereads.length, el.open]).toEqual([1, true]);
    expect(errors).not.toHaveBeenCalled();
  });
});

describe('a task ticked on the tasks page after it was deleted elsewhere', () => {
  it('says so, and the list is read again', async () => {
    const el = document.createElement('tasks-page') as El;
    Object.assign(el, { i18nStore, tasks: [rent], loadedScope: 'active', lists: [{ name: 'Work', description: '', path: '/cal/work/' }] });
    const reread = vi.spyOn(el, 'fetchTasks').mockResolvedValue(undefined as never);
    vi.spyOn(tasksService, 'completeTask').mockRejectedValue(gone());
    const toasts = record<CustomEvent>(window, 'show-toast');

    await el.handleToggleComplete(rent, true);

    expect(toasts.map(t => t.detail.message)).toEqual(['tasks.deletedElsewhere']);
    expect(reread).toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  });
});

describe('the calendar page, for what was deleted elsewhere', () => {
  async function calendarPage() {
    vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars: [{ name: 'Work', description: '', path: '/cal/work/' }] });
    const events = vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
    vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [rent], calendars: [], failedCalendars: 0 });
    window.location.hash = '#/calendar/month/2026-09';
    const el = await mount<El>('calendar-page', { i18nStore });
    await vi.waitFor(() => expect(el.loading).toBe(false));
    return { el, events };
  }

  it('says an event answered was deleted, and reads the calendar again', async () => {
    const { el, events } = await calendarPage();
    vi.spyOn(calendarService, 'respondToEvent').mockRejectedValue(gone());
    const toasts = record<CustomEvent>(window, 'show-toast');
    const before = events.mock.calls.length;

    shadow(el, '.calendar-body').dispatchEvent(new CustomEvent('respond-event', { detail: { event, status: 'accepted' }, bubbles: true, composed: true }));

    await vi.waitFor(() => expect(events.mock.calls.length).toBe(before + 1));
    expect(toasts.map(t => t.detail.message)).toEqual(['calendar.deletedElsewhere']);
    expect(errors).not.toHaveBeenCalled();
  });

  it('says a task ticked from its chip was deleted, and reads the calendar again', async () => {
    const { el, events } = await calendarPage();
    vi.spyOn(tasksService, 'completeTask').mockRejectedValue(gone());
    const toasts = record<CustomEvent>(window, 'show-toast');
    const before = events.mock.calls.length;

    shadow(el, '.calendar-body').dispatchEvent(new CustomEvent('complete-task', { detail: { task: rent }, bubbles: true, composed: true }));

    await vi.waitFor(() => expect(events.mock.calls.length).toBe(before + 1));
    expect(toasts.map(t => t.detail.message)).toEqual(['tasks.deletedElsewhere']);
    expect(errors).not.toHaveBeenCalled();
  });
});
