/**
 * Add event on a phone.
 *
 * On a phone the calendar's sidebar is a drawer over the page, and Add event
 * is in it. The button opened the event editor and left the drawer open, so
 * once the event was saved or the editor closed, the drawer was still over
 * the calendar, with the new event behind it. New task and Compose close
 * their drawers as they open their editors, and Add event now does as well.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-page';
import type { AlpsSidebar } from '../src/components/alps-sidebar';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { cleanup, flush, mount, shadow, update, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.location.hash = '';
});

async function calendarPage(): Promise<El> {
  window.location.hash = '#/calendar/month/2026-09';
  vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({
    calendars: [{ name: 'Work', description: '', path: '/cal/work/' }],
  });
  vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
  vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
  const el = await mount<El>('calendar-page', { i18nStore });
  await waitFor(() => el.loading === false, 'the calendar to load');
  return el;
}

async function settle(el: El): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await flush();
    await el.updateComplete;
  }
}

describe('Add event', () => {
  it('on a phone, closes the drawer as it opens the event editor', async () => {
    const el = await calendarPage();
    await update(el, { isMobile: true });
    shadow(el, 'app-header').dispatchEvent(new CustomEvent('toggle-sidebar'));
    await el.updateComplete;
    const bar = shadow<AlpsSidebar>(el, 'alps-sidebar');
    expect(bar.isOpen).toBe(true);

    shadow(el, 'alps-sidebar alps-create-button').click();
    await settle(el);

    expect(shadow<El>(el, 'calendar-event-modal').open).toBe(true);
    // The drawer stayed open behind the editor, and over the calendar once
    // the editor was gone.
    expect(bar.isOpen).toBe(false);
    expect(bar.classList.contains('open')).toBe(false);
  });
});
