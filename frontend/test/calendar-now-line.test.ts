/**
 * The now-line in the day and week grids: a rule at the current time of day,
 * drawn in today's column only.
 *
 * Each of these fails quietly in a browser:
 *  - A line in every column reads as a gridline, and with today outside the
 *    days shown there must be no line at all rather than one clamped to an edge.
 *  - The line moves because `now` is state fed by an interval. Without the
 *    interval the line is stale, which looks right for the rest of the hour.
 *  - Today and the line's position come from the same clock, so at midnight the
 *    line moves to the next column in one render instead of lingering at the
 *    bottom of yesterday.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nStore } from '../src/store/i18n-store';
import '../../plugins/caldav/frontend/calendar-time-grid';

const AUGUST_20 = new Date(2026, 7, 20);
const AUGUST_21 = new Date(2026, 7, 21);

type Updatable = HTMLElement & { updateComplete: Promise<unknown> };

/** Mounts the grid and waits for its render only: a setTimeout-based settle
 * would never resolve under fake timers. */
async function mount(days: Date[]): Promise<Updatable> {
  const el = document.createElement('calendar-time-grid') as Updatable;
  Object.assign(el, { i18nStore: new I18nStore(), days, events: [] });
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function lines(el: Updatable): HTMLElement[] {
  return [...el.shadowRoot!.querySelectorAll('.now-line')] as HTMLElement[];
}

/** The index of the day column a line sits in. */
function columnOf(line: HTMLElement, el: Updatable): number {
  const columns = [...el.shadowRoot!.querySelectorAll('.time-column')];
  return columns.indexOf(line.closest('.time-column')!);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('the now-line', () => {
  it("sits in today's column at the current time, 48px per hour", async () => {
    vi.setSystemTime(new Date(2026, 7, 20, 9, 30));
    const el = await mount([AUGUST_20, AUGUST_21]);

    const [line, ...extra] = lines(el);
    expect(extra).toHaveLength(0);
    expect(columnOf(line, el)).toBe(0);
    expect(line.style.top).toBe(`${9.5 * 48}px`);
  });

  it('is not drawn when today is not among the days', async () => {
    vi.setSystemTime(new Date(2026, 7, 19, 9, 30));
    const el = await mount([AUGUST_20, AUGUST_21]);

    expect(lines(el)).toHaveLength(0);
  });

  it('moves as the clock ticks', async () => {
    vi.setSystemTime(new Date(2026, 7, 20, 9, 30));
    const el = await mount([AUGUST_20]);

    vi.advanceTimersByTime(30 * 60_000);
    await el.updateComplete;

    expect(lines(el)[0].style.top).toBe(`${10 * 48}px`);
  });

  it('crosses into the next column at midnight, and the header follows', async () => {
    vi.setSystemTime(new Date(2026, 7, 20, 23, 59));
    const el = await mount([AUGUST_20, AUGUST_21]);
    expect(columnOf(lines(el)[0], el)).toBe(0);

    vi.advanceTimersByTime(2 * 60_000);
    await el.updateComplete;

    const [line, ...extra] = lines(el);
    expect(extra).toHaveLength(0);
    expect(columnOf(line, el)).toBe(1);
    const marked = [...el.shadowRoot!.querySelectorAll('.time-grid-day-number')].map((n) => n.classList.contains('today'));
    expect(marked).toEqual([false, true]);
  });

  it("takes today's column from the line's own clock between ticks", async () => {
    vi.setSystemTime(new Date(2026, 7, 20, 23, 59, 30));
    const el = await mount([AUGUST_20, AUGUST_21]);

    // Midnight has passed but the minute tick has not fired yet, and something
    // else makes the grid render.
    vi.setSystemTime(new Date(2026, 7, 21, 0, 0, 10));
    (el as unknown as { events: unknown[] }).events = [];
    await el.updateComplete;

    const [line, ...extra] = lines(el);
    expect(extra).toHaveLength(0);
    expect(columnOf(line, el)).toBe(0);
    const marked = [...el.shadowRoot!.querySelectorAll('.time-grid-day-number')].map((n) => n.classList.contains('today'));
    expect(marked).toEqual([true, false]);
  });

  it("marks today in the header even when the day passed in is not at midnight", async () => {
    vi.setSystemTime(new Date(2026, 7, 20, 9, 30));
    const el = await mount([new Date(2026, 7, 20, 14, 0)]);

    expect(el.shadowRoot!.querySelector('.time-grid-day-number')!.classList.contains('today')).toBe(true);
  });

  it('stops ticking when the grid is removed', async () => {
    vi.setSystemTime(new Date(2026, 7, 20, 9, 30));
    await mount([AUGUST_20]);

    document.body.innerHTML = '';
    expect(vi.getTimerCount()).toBe(0);
  });
});
