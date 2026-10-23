/**
 * The open contact card.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../../plugins/carddav/frontend/contact-view';

type View = HTMLElement & Record<string, any>;

const originalZone = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalZone;
});

function view(birthday: string, dateFormat = 'MM/DD/YYYY'): View {
  const el = document.createElement('alps-contact-view') as View;
  el.settingsStore = { getState: () => ({ dateFormat }) };
  el.contact = { name: 'Ada Lovelace', birthday };
  return el;
}

describe('the birthday', () => {
  it('is the day the card names, west of UTC too', () => {
    // A date with no time read as UTC midnight is the evening before here.
    process.env.TZ = 'America/New_York';
    expect(new Date('1990-05-15T00:00:00Z').getTimezoneOffset()).toBeGreaterThan(0);

    expect(view('1990-05-15').formattedBirthday).toBe('05/15/1990');
    expect(view('1990-05-15', 'YYYY-MM-DD').formattedBirthday).toBe('1990-05-15');
  });

  it('reads the vCard basic form, with no dashes', () => {
    process.env.TZ = 'America/New_York';
    expect(view('19900515', 'DD.MM.YYYY').formattedBirthday).toBe('15.05.1990');
  });

  it('is the day and month alone when the card gives no year', () => {
    // `--1031` (RFC 6350) and `--10-31`, which many address books export.
    // Chromium's Date reads `--10-31` as 31 October 2001 and `--1031` as
    // 1 January 1031.
    for (const raw of ['--10-31', '--1031', '--1031T2200', '0000-10-31']) {
      expect(view(raw, 'YYYY-MM-DD').formattedBirthday).toBe('10-31');
      expect(view(raw, 'MM/DD/YYYY').formattedBirthday).toBe('10/31');
      expect(view(raw, 'DD.MM.YYYY').formattedBirthday).toBe('31.10.');
    }
    expect(view('--0229', 'DD.MM.YYYY').formattedBirthday).toBe('29.02.');
  });

  it('is shown as written when it is no date the card could name', () => {
    // A year alone, or a month alone, is a vCard date too, and is not the
    // first of a month.
    for (const raw of ['1985', '1985-04', '--10', '--1345', 'circa 1800']) {
      expect(view(raw, 'YYYY-MM-DD').formattedBirthday).toBe(raw);
    }
  });

  it('is the date a date-time names, whatever the time', () => {
    // 02:00 UTC is the evening before in New York: the birthday is the date
    // written, not moved into the reader's zone.
    process.env.TZ = 'America/New_York';
    expect(view('1953-10-15T02:00:00Z', 'YYYY-MM-DD').formattedBirthday).toBe('1953-10-15');
    expect(view('19531015T020000Z', 'DD.MM.YYYY').formattedBirthday).toBe('15.10.1953');
  });

  it('takes a year below 100 for that year, not for 19xx', () => {
    expect(view('0050-10-31', 'YYYY-MM-DD').formattedBirthday).toBe('50-10-31');
  });
});
