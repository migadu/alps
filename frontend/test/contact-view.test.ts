/**
 * The open contact card.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount, record, shadowAll, waitFor } from './helpers/dom';
import '../../plugins/carddav/frontend/contact-view';

type View = HTMLElement & Record<string, any>;

const originalZone = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalZone;
  cleanup();
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

type Part = 'day' | 'month' | 'year';

const LABELS: Record<Part, string> = {
  day: 'contacts.birthdayDay',
  month: 'contacts.birthdayMonth',
  year: 'contacts.birthdayYear',
};

async function editing(birthday: string, { dateFormat = 'YYYY-MM-DD', language = 'en' } = {}): Promise<View> {
  const el = await mount<View>('alps-contact-view', {
    i18nStore: {
      t: (key: string) => key,
      getLanguage: () => language,
      getIntlLanguage: () => language,
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    settingsStore: { getState: () => ({ dateFormat }) },
    contact: { name: 'Ada Lovelace', email: 'ada@example.com', birthday, path: '/card/ada.vcf' },
    isEditing: true,
  });
  await el.updateComplete;
  return el;
}

/** The birthday's fields, found by the names they are announced by. */
function birthdayFields(el: View): View[] {
  return shadowAll<View>(el, 'alps-select, alps-input').filter(f => Object.values(LABELS).includes(f.label));
}

function field(el: View, part: Part): View | undefined {
  return birthdayFields(el).find(f => f.label === LABELS[part]);
}

/** What the birthday's fields show. */
function shown(el: View): Record<Part, string | undefined> {
  return { day: field(el, 'day')?.value, month: field(el, 'month')?.value, year: field(el, 'year')?.value };
}

/** Sets one of the birthday's fields as the user does, in its own control. */
async function set(el: View, part: Part, value: string): Promise<void> {
  const host = field(el, part);
  expect(host, `the birthday's ${part} field`).toBeDefined();
  await host!.updateComplete;
  const control = host!.shadowRoot!.querySelector('select, input') as HTMLInputElement | HTMLSelectElement;
  control.value = value;
  control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? 'change' : 'input'));
  await el.updateComplete;
}

describe('the birthday in the editor', () => {
  it('shows a birthday without a year as its day and month, and no year', async () => {
    for (const raw of ['--1031', '--10-31', '0000-10-31']) {
      expect(shown(await editing(raw)), raw).toEqual({ day: '31', month: '10', year: '' });
      cleanup();
    }
  });

  it('shows a date in the basic form, or with a time, as its day, month and year', async () => {
    expect(shown(await editing('19851031'))).toEqual({ day: '31', month: '10', year: '1985' });
    cleanup();
    expect(shown(await editing('1953-10-15T02:00:00Z'))).toEqual({ day: '15', month: '10', year: '1953' });
  });

  it('sends a birthday it was not asked to change back as the card wrote it', async () => {
    for (const raw of ['--1031', '19851031', 'circa 1800']) {
      const el = await editing(raw);
      const saves = record<CustomEvent>(el, 'save');
      const note = shadowAll<HTMLTextAreaElement>(el, 'textarea')[0];
      note.value = 'Met at the conference';
      note.dispatchEvent(new Event('input'));
      await waitFor(() => saves.length > 0, 'the autosave', 2000);
      expect(saves[0].detail.birthday, raw).toBe(raw);
      cleanup();
    }
  });

  it('writes a day and a month without a year as a date without one', async () => {
    const el = await editing('');
    expect(shown(el)).toEqual({ day: '', month: '', year: '' });
    await set(el, 'month', '10');
    await set(el, 'day', '31');
    expect(el.editForm.birthday).toBe('--1031');
    await set(el, 'year', '1985');
    expect(el.editForm.birthday).toBe('1985-10-31');
    await set(el, 'year', '');
    expect(el.editForm.birthday).toBe('--1031');
    // 29 February is a birthday without a year.
    await set(el, 'month', '2');
    await set(el, 'day', '29');
    expect(el.editForm.birthday).toBe('--0229');
  });

  it('changes a birthday without a year without giving it one', async () => {
    const el = await editing('--1031');
    await set(el, 'day', '30');
    expect(el.editForm.birthday).toBe('--1030');
  });

  it('keeps the stored birthday while its fields make no date', async () => {
    const el = await editing('1985-10-31');
    await set(el, 'year', '198');
    await set(el, 'day', '');
    expect(el.editForm.birthday).toBe('1985-10-31');
    await set(el, 'year', '1985');
    await set(el, 'month', '2');
    await set(el, 'day', '30');
    expect(el.editForm.birthday).toBe('1985-10-31');
    await set(el, 'day', '');
    await set(el, 'month', '');
    await set(el, 'year', '');
    expect(el.editForm.birthday).toBe('');
  });

  it('puts its fields in the order of the date format', async () => {
    const order = async (dateFormat: string) => {
      const fields = birthdayFields(await editing('1985-10-31', { dateFormat }));
      cleanup();
      return fields.map(f => (Object.keys(LABELS) as Part[]).find(p => LABELS[p] === f.label));
    };
    expect(await order('YYYY-MM-DD')).toEqual(['year', 'month', 'day']);
    expect(await order('MM/DD/YYYY')).toEqual(['month', 'day', 'year']);
    expect(await order('DD.MM.YYYY')).toEqual(['day', 'month', 'year']);
  });

  it('names the months in the language of the page', async () => {
    const month = field(await editing('1985-10-31', { language: 'de' }), 'month')!;
    expect(month.options.find((o: { value: string }) => o.value === '10')?.label).toBe('Oktober');
  });
});
