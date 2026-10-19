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
});
