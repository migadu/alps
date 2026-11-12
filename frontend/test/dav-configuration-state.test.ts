import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-page';
import '../../plugins/caldav/frontend/tasks-page';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { HttpStatusError } from '../src/utils/fetch-utils';
import { cleanup, mount, record } from './helpers/dom';

type Page = HTMLElement & Record<string, any>;
const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };
const unconfigured = () => new HttpStatusError(409, 'caldav_not_configured');

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  window.location.hash = '';
});

it.each(['calendars', 'events', 'tasks'] as const)('preserves the unconfigured code when reading %s', async resource => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'caldav_not_configured' }), { status: 409 })));
  const read = resource === 'calendars' ? calendarService.fetchCalendars()
    : resource === 'events' ? calendarService.fetchEvents(new Date(), new Date()) : tasksService.fetchTasks();
  await expect(read).rejects.toMatchObject({ status: 409, message: 'caldav_not_configured' });
});

it.each(['calendar-page', 'tasks-page'])('shows a persistent quiet unconfigured notice on %s and clears it after configuration', async component => {
  const calendars = vi.spyOn(calendarService, 'fetchCalendars').mockRejectedValue(unconfigured());
  vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
  const tasks = vi.spyOn(tasksService, 'fetchTasks').mockRejectedValue(unconfigured());
  const toasts = record<CustomEvent>(window, 'show-toast');
  window.location.hash = component === 'calendar-page' ? '#/calendar/month/2026-09' : '#/tasks/all';
  const page = await mount<Page>(component, { i18nStore });
  await vi.waitFor(() => expect(page.loading).toBe(false));
  await page.updateComplete;
  const notice = page.shadowRoot!.querySelector('alps-banner[role="status"]');
  expect(notice?.textContent).toContain('calendar.notConfigured');
  expect(toasts).toEqual([]);
  expect(console.error).not.toHaveBeenCalled();

  calendars.mockResolvedValue({ calendars: [] });
  tasks.mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
  await (component === 'calendar-page' ? page.fetchData() : page.fetchTasks());
  await page.updateComplete;
  expect(page.shadowRoot!.querySelector('alps-banner[role="status"]')).toBeNull();
});
