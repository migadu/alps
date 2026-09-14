import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bimiAvatarUrlFor,
  mayShowBimiLogo,
  formatDateList,
  formatFullDate,
  formatSize,
  getAvatarColor,
  getAvatarInitials,
  getBimiAvatarUrl,
  getMailboxLabel,
} from '../src/utils/ui';
import { readSources } from './helpers/sources';

describe('formatSize', () => {
  it('reads a non-positive, NaN or infinite count as 0 B', () => {
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(-5)).toBe('0 B');
    expect(formatSize(NaN)).toBe('0 B');
    expect(formatSize(Infinity)).toBe('0 B');
  });

  it('rounds a fractional byte count instead of indexing below the unit list', () => {
    expect(formatSize(0.5)).toBe('1 B');
  });

  it('steps through every unit', () => {
    expect(formatSize(1)).toBe('1 B');
    expect(formatSize(1023)).toBe('1023 B');
    expect(formatSize(1024)).toBe('1 KB');
    expect(formatSize(1024 ** 2)).toBe('1 MB');
    expect(formatSize(1024 ** 3)).toBe('1 GB');
    expect(formatSize(1024 ** 4)).toBe('1 TB');
    expect(formatSize(5 * 1024 ** 4)).toBe('5 TB');
    expect(formatSize(1024 ** 5)).toBe('1 PB');
  });

  it('carries into the next unit when rounding reaches 1024', () => {
    // 1048575 B is in the KB band by logarithm but rounds to 1024 KB.
    expect(formatSize(1024 ** 2 - 1)).toBe('1 MB');
    expect(formatSize(1024 ** 3 - 1)).toBe('1 GB');
    expect(formatSize(1024 ** 4 - 1)).toBe('1 TB');
  });

  it('stays on the largest unit past it, rather than printing "undefined"', () => {
    expect(formatSize(5000 * 1024 ** 5)).toBe('5000 PB');
  });
});

describe('getMailboxLabel', () => {
  const i18n = { t: (key: string) => `<${key}>` } as any;

  it('names the standard folders through the dictionary', () => {
    expect(getMailboxLabel('INBOX', i18n)).toBe('<folderList.inbox>');
    expect(getMailboxLabel('Archives', i18n)).toBe('<folderList.archive>');
    expect(getMailboxLabel('Junk', i18n)).toBe('<folderList.junk>');
  });

  it('splits on the delimiter the server reported', () => {
    expect(getMailboxLabel('Work/Clients/Acme', undefined, '/')).toBe('Acme');
    expect(getMailboxLabel('INBOX.Receipts', undefined, '.')).toBe('Receipts');
  });

  it('keeps a dot that is part of the name on a slash-delimited server', () => {
    // The sidebar splits on the server's delimiter; splitting on any dot here
    // named the same folder "2" in the header.
    expect(getMailboxLabel('Invoices v1.2', undefined, '/')).toBe('Invoices v1.2');
    expect(getMailboxLabel('Clients/acme.com', undefined, '/')).toBe('acme.com');
  });

  it('falls back to either delimiter when the caller does not know it', () => {
    expect(getMailboxLabel('Work/Acme')).toBe('Acme');
    expect(getMailboxLabel('INBOX.Receipts')).toBe('Receipts');
  });

  it('answers an empty name with an empty label', () => {
    expect(getMailboxLabel('')).toBe('');
  });
});

describe('getBimiAvatarUrl', () => {
  it('asks for no logo without a domain', () => {
    expect(getBimiAvatarUrl('')).toBe('');
  });

  it('asks for no logo for a freemail domain, in any case', () => {
    for (const domain of ['gmail.com', 'GMAIL.COM', 'outlook.com', 'proton.me', 'icloud.com']) {
      expect(getBimiAvatarUrl(domain), domain).toBe('');
    }
  });

  it('asks the backend for any other domain, lower-cased and encoded', () => {
    expect(getBimiAvatarUrl('acme.corp')).toBe('/bimi/avatar?domain=acme.corp');
    expect(getBimiAvatarUrl('GitHub.com')).toBe('/bimi/avatar?domain=github.com');
    expect(getBimiAvatarUrl('a&b.test')).toBe('/bimi/avatar?domain=a%26b.test');
  });
});

describe('mayShowBimiLogo', () => {
  const at = (Host: string) => ({ Mailbox: 'news', Host });

  it('is yes for a single From at a domain a logo is asked for', () => {
    expect(mayShowBimiLogo({ Envelope: { From: [at('brand.test')] } })).toBe(true);
  });

  it('is no for freemail, several From addresses, none, or an incomplete address', () => {
    for (const msg of [
      { Envelope: { From: [at('gmail.com')] } },
      { Envelope: { From: [at('brand.test'), at('other.test')] } },
      { Envelope: { From: [] } },
      { Envelope: { From: [{ Host: 'brand.test' }] } },
      { Envelope: { From: [{ Mailbox: 'news' }] } },
      { Envelope: {} },
      null,
    ]) {
      expect(mayShowBimiLogo(msg), JSON.stringify(msg)).toBe(false);
    }
  });
});

describe('bimiAvatarUrlFor', () => {
  const ada = { Name: 'Ada', Mailbox: 'ada', Host: 'Brand.Test' };
  const bob = { Mailbox: 'bob', Host: 'other.test' };
  const passed = (from: any[] = [ada]) => ({ HasBimiPotential: true, Envelope: { From: from, To: [bob] } });

  it('draws the logo beside the From of a message that passed DMARC', () => {
    expect(bimiAvatarUrlFor(passed(), ada)).toBe('/bimi/avatar?domain=brand.test');
    expect(bimiAvatarUrlFor(passed(), { Mailbox: 'ADA', Host: 'brand.test' })).toBe('/bimi/avatar?domain=brand.test');
  });

  it('draws none for a message that did not pass', () => {
    for (const msg of [
      { Envelope: { From: [ada] } },
      { HasBimiPotential: false, Envelope: { From: [ada] } },
      { HasBimiFailed: true, Envelope: { From: [ada] } },
      null,
      undefined,
    ]) {
      expect(bimiAvatarUrlFor(msg, ada), JSON.stringify(msg)).toBe('');
    }
  });

  it('draws none beside a recipient, or another address at the brand', () => {
    expect(bimiAvatarUrlFor(passed([bob]), ada)).toBe('');
    expect(bimiAvatarUrlFor(passed(), bob)).toBe('');
    expect(bimiAvatarUrlFor(passed(), { Mailbox: 'support', Host: 'brand.test' })).toBe('');
    expect(bimiAvatarUrlFor(passed(), {})).toBe('');
  });

  it('draws none for several From addresses, or none', () => {
    expect(bimiAvatarUrlFor(passed([ada, bob]), ada)).toBe('');
    expect(bimiAvatarUrlFor(passed([]), ada)).toBe('');
    expect(bimiAvatarUrlFor({ HasBimiPotential: true }, ada)).toBe('');
  });

  it('is the only way a component asks for a logo', () => {
    const sources = readSources();
    const direct = Object.keys(sources).filter(
      (path) => path !== 'src/utils/ui.ts' && /\bgetBimiAvatarUrl\s*\(/.test(sources[path]),
    );
    expect(direct).toEqual([]);
    for (const path of ['src/components/message-list.ts', 'src/components/message-reader.ts', 'src/components/alps-thread-card.ts']) {
      expect(sources[path], path).toMatch(/\bbimiAvatarUrlFor\(/);
    }
  });

  it('still asks for nothing from a freemail domain', () => {
    const gmail = { Mailbox: 'ada', Host: 'gmail.com' };
    expect(bimiAvatarUrlFor(passed([gmail]), gmail)).toBe('');
  });
});

describe('avatars', () => {
  it('takes the initials of a name', () => {
    expect(getAvatarInitials('Ada Lovelace', 'ada@example.com')).toBe('AL');
    expect(getAvatarInitials('ada', 'ada@example.com')).toBe('AD');
  });

  it('falls back to the address, then to a placeholder', () => {
    expect(getAvatarInitials('', 'bob@example.com')).toBe('BO');
    expect(getAvatarInitials('', '')).toBe('??');
  });

  it('gives an identifier the same palette colour every time', () => {
    const colour = getAvatarColor('ada@example.com');
    expect(getAvatarColor('ada@example.com')).toBe(colour);
    expect(colour).toMatch(/^#[0-9a-f]{6}$/);
    expect(getAvatarColor('')).toBe('#78909c');
  });
});

describe('dates', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes the full date in the chosen order', () => {
    const date = new Date(2024, 0, 5, 14, 7);
    expect(formatFullDate(date, 'YYYY-MM-DD')).toMatch(/^2024-01-05 /);
    expect(formatFullDate(date, 'MM/DD/YYYY')).toMatch(/^01\/05\/2024 /);
    expect(formatFullDate(date, 'DD.MM.YYYY')).toMatch(/^05\.01\.2024 /);
    expect(formatFullDate('')).toBe('');
  });

  it('shows only the time for a message from today', () => {
    vi.useFakeTimers({ now: new Date(2024, 5, 15, 12, 0) });
    const label = formatDateList(new Date(2024, 5, 15, 9, 30));
    expect(label).not.toContain('2024');
    expect(label).toMatch(/\d{1,2}.\d{2}/);
  });

  it('writes a date from another year in the chosen order', () => {
    vi.useFakeTimers({ now: new Date(2024, 5, 15, 12, 0) });
    const date = new Date(2019, 2, 4, 8, 0);
    expect(formatDateList(date, 'YYYY-MM-DD')).toBe('2019-03-04');
    expect(formatDateList(date, 'MM/DD/YYYY')).toBe('03/04/2019');
    expect(formatDateList(date, 'DD.MM.YYYY')).toBe('04.03.2019');
  });

  it('leaves the year off an earlier date this year', () => {
    vi.useFakeTimers({ now: new Date(2024, 5, 15, 12, 0) });
    expect(formatDateList(new Date(2024, 1, 2))).not.toContain('2024');
  });
});
