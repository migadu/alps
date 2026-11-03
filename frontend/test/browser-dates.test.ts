/**
 * The `auto` time and date formats: the browser's clock and the browser's
 * date.
 *
 * Read through stubs of `Intl` and `Date` rather than the runner's own locale:
 * an assertion that holds only under en-US says nothing about the Croatian
 * browser that writes `15. 06. 2022.`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  dateFieldOrder,
  detectBrowserHourFormat,
  forgetBrowserHourFormat,
  formatDateList,
  formatDateOnly,
  formatDayMonth,
  formatFullDate,
  resolveHourFormat,
} from '../src/utils/ui';

/** An `Intl.DateTimeFormat` that resolves `hourCycle`, and formats 13:00 as
 * `formatted` for an engine that resolves none. */
function withHourCycle(hourCycle: string | undefined, formatted = '') {
  const fake = { resolvedOptions: () => ({ hourCycle }), format: () => formatted };
  return vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((function () { return fake; }) as any);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  forgetBrowserHourFormat();
});

describe('the browser\'s clock', () => {
  it('is 12-hour for an h11 or h12 cycle', () => {
    withHourCycle('h12');
    expect(detectBrowserHourFormat()).toBe('12');
    withHourCycle('h11');
    expect(detectBrowserHourFormat()).toBe('12');
  });

  it('is 24-hour for an h23 or h24 cycle', () => {
    withHourCycle('h23');
    expect(detectBrowserHourFormat()).toBe('24');
    withHourCycle('h24');
    expect(detectBrowserHourFormat()).toBe('24');
  });

  it('is whether 13:00 keeps its 13, where no cycle resolves', () => {
    withHourCycle(undefined, '13');
    expect(detectBrowserHourFormat()).toBe('24');
    withHourCycle(undefined, '1 PM');
    expect(detectBrowserHourFormat()).toBe('12');
  });

  it('is 24-hour when Intl cannot answer', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((function () { throw new Error('no ICU'); }) as any);
    expect(detectBrowserHourFormat()).toBe('24');
  });
});

describe('resolveHourFormat', () => {
  it('keeps a clock chosen in Settings', () => {
    withHourCycle('h12');
    expect(resolveHourFormat('24')).toBe('24');
    withHourCycle('h23');
    expect(resolveHourFormat('12')).toBe('12');
  });

  it('is the browser\'s clock for auto, and for no setting', () => {
    withHourCycle('h12');
    expect(resolveHourFormat('auto')).toBe('12');
    expect(resolveHourFormat(undefined)).toBe('12');
  });

  it('asks the browser once per page, since the list asks for every row', () => {
    const asked = withHourCycle('h12');
    expect(resolveHourFormat('auto')).toBe('12');
    asked.mockClear();
    withHourCycle('h23');
    expect(resolveHourFormat('auto')).toBe('12');
    expect(asked).not.toHaveBeenCalled();
    forgetBrowserHourFormat();
    expect(resolveHourFormat('auto')).toBe('24');
  });
});

describe('formatDateOnly', () => {
  const date = new Date(2022, 5, 15, 14, 30);

  it('writes the formats a user can choose', () => {
    expect(formatDateOnly(date, 'YYYY-MM-DD')).toBe('2022-06-15');
    expect(formatDateOnly(date, 'MM/DD/YYYY')).toBe('06/15/2022');
    expect(formatDateOnly(date, 'DD.MM.YYYY')).toBe('15.06.2022');
  });

  it('writes auto as the browser\'s own numeric date', () => {
    expect(formatDateOnly(date, 'auto')).toBe(date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }));
    expect(formatDateOnly(date)).toBe(formatDateOnly(date, 'auto'));
    // Not a lookup that a name on Object's prototype could answer.
    expect(formatDateOnly(date, 'toString')).toBe(formatDateOnly(date, 'auto'));
  });

  it('keeps a date that the browser writes with spaces in it whole', () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('15. 06. 2022.');
    expect(formatDateOnly(date, 'auto')).toBe('15. 06. 2022.');
    expect(formatFullDate(date, 'auto', '24').startsWith('15. 06. 2022. ')).toBe(true);
  });
});

describe('formatFullDate', () => {
  const date = new Date(2022, 5, 15, 14, 30);

  it('is the date and then the time', () => {
    const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    for (const format of ['auto', 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD.MM.YYYY']) {
      expect(formatFullDate(date, format, '24'), format).toBe(`${formatDateOnly(date, format)} ${time}`);
    }
  });

  it('writes the time on the browser\'s clock under auto', () => {
    const time = vi.spyOn(Date.prototype, 'toLocaleTimeString');
    withHourCycle('h12');
    formatFullDate(date, 'auto', 'auto');
    expect(time).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ hour12: true }));
    forgetBrowserHourFormat();
    withHourCycle('h23');
    formatFullDate(date, 'auto', 'auto');
    expect(time).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ hour12: false }));
  });
});

describe('formatDateList', () => {
  it('writes another year in the format chosen', () => {
    vi.useFakeTimers({ now: new Date(2024, 5, 15, 12, 0) });
    const past = new Date(2022, 5, 15, 14, 30);
    expect(formatDateList(past, 'YYYY-MM-DD', '24')).toBe('2022-06-15');
    expect(formatDateList(past, 'MM/DD/YYYY', '24')).toBe('06/15/2022');
    expect(formatDateList(past, 'DD.MM.YYYY', '24')).toBe('15.06.2022');
  });

  it('writes another year under auto in the browser\'s short form', () => {
    vi.useFakeTimers({ now: new Date(2024, 5, 15, 12, 0) });
    const past = new Date(2022, 5, 15, 14, 30);
    expect(formatDateList(past, 'auto', 'auto')).toBe(past.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }));
  });

  it('writes a time today on the browser\'s clock under auto', () => {
    const time = vi.spyOn(Date.prototype, 'toLocaleTimeString');
    withHourCycle('h12');
    formatDateList(new Date(), 'auto', 'auto');
    expect(time).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ hour12: true }));
  });
});

describe('a day without its year', () => {
  it('is the chosen format without its year', () => {
    expect(formatDayMonth(10, 31, 'YYYY-MM-DD')).toBe('10-31');
    expect(formatDayMonth(10, 31, 'MM/DD/YYYY')).toBe('10/31');
    expect(formatDayMonth(10, 31, 'DD.MM.YYYY')).toBe('31.10.');
  });

  it('is the browser\'s day and month under auto, 29 February included', () => {
    const asked = vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('29. 02.');
    expect(formatDayMonth(2, 29, 'auto')).toBe('29. 02.');
    const day = asked.mock.contexts[0] as Date;
    expect([day.getMonth(), day.getDate()]).toEqual([1, 29]);
    expect(asked).toHaveBeenLastCalledWith(undefined, { month: '2-digit', day: '2-digit' });
  });
});

describe('dateFieldOrder', () => {
  it('is the order of the format chosen', () => {
    expect(dateFieldOrder('YYYY-MM-DD')).toEqual(['year', 'month', 'day']);
    expect(dateFieldOrder('MM/DD/YYYY')).toEqual(['month', 'day', 'year']);
    expect(dateFieldOrder('DD.MM.YYYY')).toEqual(['day', 'month', 'year']);
  });

  it('is the order the browser writes a date in under auto', () => {
    const parts = (...types: string[]) => types.flatMap((type, i) => (i ? [{ type: 'literal', value: '/' }, { type, value: '1' }] : [{ type, value: '1' }]));
    for (const order of [['month', 'day', 'year'], ['day', 'month', 'year'], ['year', 'month', 'day']]) {
      vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((function () { return { formatToParts: () => parts(...order) }; }) as any);
      expect(dateFieldOrder('auto')).toEqual(order);
      vi.restoreAllMocks();
    }
  });
});
