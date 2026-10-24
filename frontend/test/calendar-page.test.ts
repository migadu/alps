/**
 * The calendar page's navigation: reading a link, stepping by a period, and
 * which day a view switch lands on.
 *
 * The methods are called on an element that is never connected, so nothing is
 * fetched; navigation is observed through the hash it writes.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-page';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { I18nStore } from '../src/store/i18n-store';
import { cleanup, mount, shadow, waitFor } from './helpers/dom';

type Page = HTMLElement & { currentDate: Date; viewMode: string; searchQuery: string };

function page(date: Date, mode = 'month'): Page {
  const el = document.createElement('calendar-page') as Page;
  el.currentDate = date;
  el.viewMode = mode;
  return el;
}

const call = (el: Page, method: string, ...args: unknown[]) => (el as any)[method](...args);
const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];

afterEach(() => {
  window.location.hash = '';
  vi.useRealTimers();
});

describe('stepping by a period', () => {
  const step = (date: Date, mode: string, offset: number) => {
    window.location.hash = '';
    call(page(date, mode), 'changeDate', offset);
    return window.location.hash;
  };

  it('moves a month without skipping one from the end of a long month', () => {
    expect(step(new Date(2024, 0, 31), 'month', 1)).toBe('#/calendar/month/2024-02');
    expect(step(new Date(2024, 2, 31), 'month', -1)).toBe('#/calendar/month/2024-02');
    expect(step(new Date(2024, 11, 15), 'month', 1)).toBe('#/calendar/month/2025-01');
  });

  it('moves a year from the 29th of February', () => {
    expect(step(new Date(2024, 1, 29), 'year', 1)).toBe('#/calendar/year/2025');
  });

  it('moves a week or a day across month and year ends', () => {
    expect(step(new Date(2024, 8, 29), 'week', 1)).toBe('#/calendar/week/2024-10-06');
    expect(step(new Date(2024, 11, 31), 'day', 1)).toBe('#/calendar/day/2025-01-01');
  });
});

describe('reading a link', () => {
  const read = (el: Page, hash: string) => {
    window.location.hash = hash;
    return call(el, 'parseHash');
  };

  it('opens the month linked to, from the last day of a longer month', () => {
    const el = page(new Date(2024, 0, 31));
    expect(read(el, '#/calendar/month/2024-04')).toBe(true);
    expect(ymd(el.currentDate)).toEqual([2024, 4, 1]);
  });

  it('opens the day linked to, from the 31st', () => {
    const el = page(new Date(2024, 0, 31), 'month');
    expect(read(el, '#/calendar/day/2024-02-15')).toBe(true);
    expect(el.viewMode).toBe('day');
    expect(ymd(el.currentDate)).toEqual([2024, 2, 15]);
  });

  it('reads a year and a search query', () => {
    const el = page(new Date(2024, 5, 10));
    expect(read(el, '#/calendar/year/2030?q=team%20sync')).toBe(true);
    expect(el.viewMode).toBe('year');
    expect(el.currentDate.getFullYear()).toBe(2030);
    expect(el.searchQuery).toBe('team sync');
  });

  it('reports no change for a link to what is already shown, or one that is not the calendar\'s', () => {
    const el = page(new Date(2024, 0, 1));
    expect(read(el, '#/calendar/month/2024-01')).toBe(false);
    expect(read(el, '#/mailbox/INBOX')).toBe(false);
  });

  it('ignores a view it does not have', () => {
    const el = page(new Date(2024, 0, 1));
    read(el, '#/calendar/decade/2024-01');
    expect(el.viewMode).toBe('month');
  });

  it('completes a bare calendar link to the current view and date, in place', () => {
    const el = page(new Date(2024, 6, 4), 'week');
    window.location.hash = '#/calendar';
    const before = history.length;
    // Nothing on screen changes, so there is nothing to fetch.
    expect(call(el, 'parseHash')).toBe(false);
    expect(window.location.hash).toBe('#/calendar/week/2024-07-04');
    // The tab's link is the entry; the completion is not a second one.
    expect(history.length).toBe(before);
  });

  it('asks for a fetch when completing a bare link ends a search', () => {
    // replaceState fires no hashchange, so the answer is the only thing that
    // makes the caller load what the completed address shows.
    const el = page(new Date(2024, 6, 4), 'week');
    el.searchQuery = 'standup';
    expect(read(el, '#/calendar')).toBe(true);
    expect(window.location.hash).toBe('#/calendar/week/2024-07-04');
  });
});

describe('switching view', () => {
  const switchTo = (el: Page, mode: string) => {
    window.location.hash = '';
    call(el, 'setViewMode', mode);
    return window.location.hash;
  };

  it('lands on today when the period being left contains it', () => {
    vi.useFakeTimers({ now: new Date(2024, 8, 20, 9) });
    // A month hash anchors the date to the 1st, which is not a day anyone chose.
    expect(switchTo(page(new Date(2024, 8, 1), 'month'), 'day')).toBe('#/calendar/day/2024-09-20');
    expect(switchTo(page(new Date(2024, 8, 18), 'week'), 'day')).toBe('#/calendar/day/2024-09-20');
    expect(switchTo(page(new Date(2024, 0, 1), 'year'), 'week')).toBe('#/calendar/week/2024-09-20');
  });

  it('keeps the anchor for a period the user navigated to', () => {
    vi.useFakeTimers({ now: new Date(2024, 8, 20, 9) });
    expect(switchTo(page(new Date(2024, 2, 1), 'month'), 'day')).toBe('#/calendar/day/2024-03-01');
    expect(switchTo(page(new Date(2024, 2, 1), 'month'), 'year')).toBe('#/calendar/year/2024');
  });

  it('opens a picked date in day view', () => {
    const el = page(new Date(2024, 8, 1), 'month');
    window.location.hash = '';
    call(el, 'handleDateSelected', new Date(2024, 8, 17));
    expect(window.location.hash).toBe('#/calendar/day/2024-09-17');
  });
});

describe('the Today button', () => {
  it('opens today in Day view, whatever view is on screen', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 14, 10, 0));
    for (const [date, mode] of [[new Date(2025, 0, 5), 'month'], [new Date(2024, 5, 1), 'year'], [new Date(2026, 8, 7), 'week'], [new Date(2026, 1, 2), 'day']] as const) {
      window.location.hash = '';
      call(page(date, mode), 'goToToday');
      expect(window.location.hash).toBe('#/calendar/day/2026-09-14');
    }
  });
});

describe('week start dynamic change', () => {
  it('refetches data when weekStart changes while on week view', () => {
    const el = page(new Date(2024, 8, 18), 'week') as any;
    let fetched = 0;
    el.fetchData = () => { fetched++; return Promise.resolve(); };
    let weekStartVal = 1;
    el.settingsStore = {
      getState: () => ({ weekStart: weekStartVal }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    if (typeof el.connectedCallback === 'function') {
      // simulate connection or initialize lastWeekStart
      el._lastWeekStart = 1;
    }
    call(el, '_handleSettingsChange');
    expect(fetched).toBe(0);

    // weekStart changed from 1 (Monday) to 0 (Sunday)
    weekStartVal = 0;
    call(el, '_handleSettingsChange');
    expect(fetched).toBe(1);
  });

  it('does not refetch data when weekStart changes while on month or day view', () => {
    const el = page(new Date(2024, 8, 18), 'month') as any;
    let fetched = 0;
    el.fetchData = () => { fetched++; return Promise.resolve(); };
    let weekStartVal = 1;
    el.settingsStore = {
      getState: () => ({ weekStart: weekStartVal }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    el._lastWeekStart = 1;
    weekStartVal = 0;
    call(el, '_handleSettingsChange');
    expect(fetched).toBe(0);
  });
});

/**
 * The delete confirmations speak the user's language. Their messages were
 * English literals in the page template, under a title and buttons that were
 * already translated.
 */
describe('the delete confirmations', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  async function germanPage() {
    vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars: [{ name: 'Arbeit', description: '', path: '/cal/work/' }], scheduling: 'email' });
    vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
    vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 } as any);
    const i18nStore = new I18nStore();
    await i18nStore.setLanguage('de');
    const el = await mount<any>('calendar-page', { i18nStore });
    await waitFor(() => el.calendars.length === 1, 'the calendars to load');
    return el;
  }

  /** What the dialog shows: its message is the fallback content of its slot. */
  async function shown(el: any) {
    const confirm = shadow<any>(el, 'ui-confirm');
    await confirm.updateComplete;
    return { heading: confirm.heading, message: confirm.shadowRoot.querySelector('slot:not([name])').textContent.trim() };
  }

  it('asks before deleting a calendar, naming it exactly as typed', async () => {
    const el = await germanPage();
    call(el, 'handleDeleteCalendar', { name: 'Q&A <team> "x"', path: '/cal/work/' });
    await el.updateComplete;
    expect(await shown(el)).toEqual({
      heading: 'Kalender löschen',
      message: 'Möchten Sie den Kalender "Q&A <team> "x"" wirklich löschen?',
    });
  });

  it('asks before deleting an event, or a task from the calendar, each by its own name', async () => {
    const el = await germanPage();
    el.eventToDelete = { uid: 'e', summary: 'Review', start: '2026-09-16T08:00:00Z', end: '2026-09-16T09:00:00Z', path: '/cal/work/e.ics' };
    await el.updateComplete;
    expect(await shown(el)).toEqual({ heading: 'Ereignis löschen', message: 'Möchten Sie dieses Ereignis wirklich löschen?' });

    const task = { uid: 't', summary: 'Report', path: '/cal/work/t.ics' };
    el.eventToDelete = { ...task, task };
    await el.updateComplete;
    expect(await shown(el)).toEqual({ heading: 'Aufgabe löschen', message: 'Möchten Sie diese Aufgabe wirklich löschen?' });
  });
});
