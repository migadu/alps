/**
 * Calendar date logic: the week's first day, month grids, which day an event
 * belongs to, and where a timed event sits in the day.
 *
 * Most of what went wrong here depended on the time zone — a skipped midnight
 * in Santiago, a spring-forward Sunday in New York, an all-day event read as
 * UTC midnight west of Greenwich — so the tests set the zone rather than
 * inheriting the machine's.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, record, shadowAll } from './helpers/dom';
import { I18nStore } from '../src/store/i18n-store';
import { getCalendarColor, isAllDayEvent, weekStart, type EventData } from '../../plugins/caldav/frontend/calendar-service';
import '../../plugins/caldav/frontend/calendar-month-view';
import '../../plugins/caldav/frontend/calendar-mini-month';
import '../../plugins/caldav/frontend/calendar-time-grid';
import '../../plugins/caldav/frontend/calendar-list-view';

const originalZone = process.env.TZ;
const inZone = (zone: string) => {
  process.env.TZ = zone;
};

afterEach(() => {
  process.env.TZ = originalZone;
  vi.useRealTimers();
  cleanup();
});

const event = (over: Partial<EventData>): EventData => ({
  uid: 'u', summary: 'Event', start: '', end: '', path: '/cal/u.ics', calendarPath: '/cal/', ...over,
});

const i18n = new I18nStore();
const dayNumber = (cell: Element) => cell.querySelector('.date-number, .day-num')?.textContent?.trim();

describe('calendar helpers', () => {
  it('starts every week on its Monday at midnight, Sundays included', () => {
    inZone('Europe/Belgrade');
    for (let day = 2; day <= 8; day++) {
      const start = weekStart(new Date(2024, 8, day, 15, 30));
      expect([start.getFullYear(), start.getMonth(), start.getDate(), start.getHours()], `September ${day}`).toEqual([2024, 8, 2, 0]);
    }
    const sunday = weekStart(new Date(2024, 8, 1, 9));
    expect([sunday.getMonth(), sunday.getDate()]).toEqual([7, 26]);
  });

  it('does not move the date it is given', () => {
    const date = new Date(2024, 8, 8, 12);
    weekStart(date);
    expect(date.getDate()).toBe(8);
  });

  it('calls an event all-day only when the server says so', () => {
    expect(isAllDayEvent({ allDay: true })).toBe(true);
    expect(isAllDayEvent({ allDay: false })).toBe(false);
    expect(isAllDayEvent({})).toBe(false);
  });

  it('gives a calendar the same colour every time', () => {
    expect(getCalendarColor('/calendars/work/')).toBe(getCalendarColor('/calendars/work/'));
    expect(getCalendarColor('/calendars/work/')).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('month view', () => {
  const monthView = (date: Date, events: EventData[] = []) => mount('calendar-month-view', { date, events, i18nStore: i18n });
  const cells = (el: HTMLElement) => shadowAll(el, '.month-cell');
  const inMonth = (el: HTMLElement) => cells(el).filter((c) => !c.classList.contains('other-month'));
  const withEvents = (el: HTMLElement) => inMonth(el).filter((c) => c.querySelector('.event-chip')).map(dayNumber);

  it('lays out whole Monday-first weeks around the month', async () => {
    inZone('Europe/Belgrade');
    const february = await monthView(new Date(2021, 1, 10));
    expect(cells(february)).toHaveLength(28);
    expect(dayNumber(cells(february)[0])).toBe('1');

    const september = await monthView(new Date(2024, 8, 10));
    expect(cells(september)).toHaveLength(42);
    expect(cells(september).slice(0, 6).map(dayNumber)).toEqual(['26', '27', '28', '29', '30', '31']);
    expect(dayNumber(cells(september)[6])).toBe('1');
  });

  it('keeps every day of the month where the clocks skip midnight', async () => {
    // Santiago moved to summer time at 00:00 on 8 September 2024.
    inZone('America/Santiago');
    const el = await monthView(new Date(2024, 8, 10));
    expect(inMonth(el).map(dayNumber)).toEqual(Array.from({ length: 30 }, (_, i) => String(i + 1)));
  });

  it('still highlights today after a skipped midnight', async () => {
    inZone('America/Santiago');
    vi.useFakeTimers({ now: new Date(2024, 8, 20, 12) });
    const el = await monthView(new Date(2024, 8, 20));
    expect(shadowAll(el, '.date-number.today').map((n) => n.textContent?.trim())).toEqual(['20']);
  });

  it('puts an all-day event on its own date west of UTC', async () => {
    inZone('America/New_York');
    const el = await monthView(new Date(2024, 8, 10), [
      event({ allDay: true, start: '2024-09-08T00:00:00Z', end: '2024-09-09T00:00:00Z' }),
    ]);
    expect(withEvents(el)).toEqual(['8']);
  });

  it('shows a timed event on every day it touches, but not on a day it merely ends at midnight', async () => {
    inZone('Europe/Belgrade');
    const el = await monthView(new Date(2024, 8, 10), [
      event({ uid: 'a', start: '2024-09-03T22:00:00', end: '2024-09-04T00:00:00' }),
      event({ uid: 'b', start: '2024-09-10T22:00:00', end: '2024-09-12T02:00:00' }),
    ]);
    expect(withEvents(el)).toEqual(['3', '10', '11', '12']);
  });

  it('shows four events in a cell and counts the rest', async () => {
    inZone('Europe/Belgrade');
    const busy = Array.from({ length: 6 }, (_, i) => event({ uid: String(i), start: `2024-09-15T0${i}:00:00`, end: `2024-09-15T0${i}:30:00` }));
    const el = await monthView(new Date(2024, 8, 10), busy);
    const cell = inMonth(el).find((c) => dayNumber(c) === '15')!;
    expect(cell.querySelectorAll('.event-chip')).toHaveLength(4);
    expect(cell.textContent).toContain(i18n.t('calendar.moreEvents', { count: 2 }));
  });

  it('offers an all-day event from a day cell', async () => {
    inZone('Europe/Belgrade');
    const el = await monthView(new Date(2024, 8, 10));
    const created = record<CustomEvent>(el, 'create-event');
    (inMonth(el).find((c) => dayNumber(c) === '15') as HTMLElement).click();
    expect(created).toHaveLength(1);
    expect(created[0].detail.allDay).toBe(true);
    expect(created[0].detail.date.getDate()).toBe(15);
  });
});

describe('mini month', () => {
  it('counts its cells the same way, marks event days and weekends, and reports a pick', async () => {
    inZone('America/Santiago');
    const el = await mount('calendar-mini-month', {
      year: 2024, month: 8, i18nStore: i18n,
      events: [event({ allDay: true, start: '2024-09-18T00:00:00Z', end: '2024-09-19T00:00:00Z' })],
    });
    const days = shadowAll(el, '.mini-day');
    expect(days).toHaveLength(42);
    const current = days.filter((d) => !(d.getAttribute('style') || '').includes('opacity'));
    expect(current.map(dayNumber)).toEqual(Array.from({ length: 30 }, (_, i) => String(i + 1)));
    expect(current.filter((d) => d.classList.contains('has-event')).map(dayNumber)).toEqual(['18']);
    expect(current.filter((d) => d.classList.contains('weekend')).map(dayNumber).slice(0, 2)).toEqual(['1', '7']);

    const picked = record<CustomEvent>(el, 'date-selected');
    (current[4] as HTMLElement).click();
    expect(picked[0].detail.date.getDate()).toBe(5);
  });
});

describe('time grid', () => {
  const grid = (days: Date[], events: EventData[]) => mount('calendar-time-grid', { days, events, i18nStore: i18n });
  const placement = (popup: Element) => {
    const style = popup.getAttribute('style') || '';
    return { top: parseFloat(/top:\s*([\d.]+)px/.exec(style)![1]), height: parseFloat(/height:\s*([\d.]+)px/.exec(style)![1]) };
  };

  it('sizes a timed event by the wall clock on a spring-forward day', async () => {
    // 01:00 to 04:00 on 10 March 2024 in New York is two real hours and three on the clock.
    inZone('America/New_York');
    const el = await grid([new Date(2024, 2, 10)], [event({ start: '2024-03-10T01:00:00', end: '2024-03-10T04:00:00' })]);
    expect(shadowAll(el, '.time-event-popup').map(placement)).toEqual([{ top: 48, height: 144 }]);
  });

  it('clips an event that crosses midnight to each day it is on', async () => {
    inZone('Europe/Belgrade');
    const el = await grid([new Date(2024, 8, 10), new Date(2024, 8, 11)], [event({ start: '2024-09-10T23:00:00', end: '2024-09-11T01:00:00' })]);
    const [first, second] = shadowAll(el, '.time-column').map((col) => placement(col.querySelector('.time-event-popup')!));
    expect(first.top).toBe(23 * 48);
    expect(first.top + first.height).toBeLessThanOrEqual(24 * 48);
    expect(second).toEqual({ top: 0, height: 48 });
  });

  it('keeps a very short event visible', async () => {
    inZone('Europe/Belgrade');
    const el = await grid([new Date(2024, 8, 10)], [event({ start: '2024-09-10T10:00:00', end: '2024-09-10T10:05:00' })]);
    expect(placement(shadowAll(el, '.time-event-popup')[0]).height).toBe(20);
  });

  it('keeps all-day events out of the hour columns', async () => {
    inZone('Europe/Belgrade');
    const el = await grid([new Date(2024, 8, 10)], [event({ allDay: true, start: '2024-09-10T00:00:00Z', end: '2024-09-11T00:00:00Z' })]);
    expect(shadowAll(el, '.time-event-popup')).toHaveLength(0);
  });

  it('asks for a timed event from an hour, even the midnight row', async () => {
    inZone('Europe/Belgrade');
    const el = await grid([new Date(2024, 8, 10)], []);
    const created = record<CustomEvent>(el, 'create-event');
    const column = shadowAll(el, '.time-column')[0];
    column.dispatchEvent(new MouseEvent('click', { clientY: 10, bubbles: true }));
    column.dispatchEvent(new MouseEvent('click', { clientY: 100, bubbles: true }));
    expect(created.map((e) => [e.detail.allDay, e.detail.date.getHours()])).toEqual([[false, 0], [false, 2]]);
  });
});

describe('list view', () => {
  it('lists an all-day event under its own date west of UTC, labelled all day', async () => {
    inZone('America/New_York');
    const el = await mount('calendar-list-view', {
      i18nStore: i18n,
      events: [event({ allDay: true, start: '2024-09-08T00:00:00Z', end: '2024-09-09T00:00:00Z' })],
    });
    expect(shadowAll(el, '.date-day').map((d) => d.textContent?.trim())).toEqual(['8']);
    expect(shadowAll(el, '.date-time')[0].textContent?.trim()).toBe(i18n.t('calendar.allDay'));
  });

  it('sorts events by start, and says when there are none', async () => {
    inZone('Europe/Belgrade');
    const el = await mount('calendar-list-view', {
      i18nStore: i18n,
      events: [
        event({ uid: 'b', summary: 'Later', start: '2024-09-12T10:00:00', end: '2024-09-12T11:00:00' }),
        event({ uid: 'a', summary: 'Sooner', start: '2024-09-02T10:00:00', end: '2024-09-02T11:00:00' }),
      ],
    });
    expect(shadowAll(el, '.event-title').map((t) => t.textContent?.trim())).toEqual(['Sooner', 'Later']);
    const empty = await mount('calendar-list-view', { i18nStore: i18n, events: [] });
    expect(shadowAll(empty, '.no-results')[0].textContent?.trim()).toBe(i18n.t('calendar.noResults'));
  });
});

describe('declined invitations', () => {
  const declined = (over: Partial<EventData>) => event({ summary: 'Declined', role: 'attendee', status: 'declined', ...over });
  const accepted = (over: Partial<EventData>) => event({ summary: 'Accepted', role: 'attendee', status: 'accepted', ...over });
  const marked = (els: Element[]) => Object.fromEntries(els.map((e) => [e.textContent?.trim(), e.classList.contains('declined')]));

  it('stay in view in every calendar view, but read as not happening', async () => {
    inZone('Europe/Belgrade');
    const timed = [
      declined({ uid: 'd', start: '2024-09-10T10:00:00', end: '2024-09-10T11:00:00' }),
      accepted({ uid: 'a', start: '2024-09-10T12:00:00', end: '2024-09-10T13:00:00' }),
    ];
    const allDay = [
      declined({ uid: 'dd', summary: 'Declined day', allDay: true, start: '2024-09-10T00:00:00Z', end: '2024-09-11T00:00:00Z' }),
      accepted({ uid: 'ad', summary: 'Accepted day', allDay: true, start: '2024-09-10T00:00:00Z', end: '2024-09-11T00:00:00Z' }),
    ];

    const month = await mount('calendar-month-view', { date: new Date(2024, 8, 10), events: [...timed, ...allDay], i18nStore: i18n });
    expect(marked(shadowAll(month, '.event-chip'))).toEqual({ 'Declined': true, 'Accepted': false, 'Declined day': true, 'Accepted day': false });

    const grid = await mount('calendar-time-grid', { days: [new Date(2024, 8, 10)], events: [...timed, ...allDay], i18nStore: i18n });
    expect(marked(shadowAll(grid, '.time-event'))).toEqual({ 'Declined': true, 'Accepted': false });
    expect(marked(shadowAll(grid, '.event-chip'))).toEqual({ 'Declined day': true, 'Accepted day': false });

    const list = await mount('calendar-list-view', { events: timed, i18nStore: i18n });
    expect(shadowAll(list, '.event-item').map((e) => [e.querySelector('.event-title')?.textContent?.trim(), e.classList.contains('declined')]))
      .toEqual([['Declined', true], ['Accepted', false]]);
  });
});
