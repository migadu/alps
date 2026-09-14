/**
 * The calendar page's navigation: reading a link, stepping by a period, and
 * which day a view switch lands on.
 *
 * The methods are called on an element that is never connected, so nothing is
 * fetched; navigation is observed through the hash it writes.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-page';

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

  it('completes a bare calendar link to the current view and date', () => {
    const el = page(new Date(2024, 6, 4), 'week');
    expect(read(el, '#/calendar')).toBe(false);
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
