/**
 * Addresses that may not be the ones they look like.
 *
 * Letters from different alphabets can look the same, so `p<а>ypal.example`
 * with a Cyrillic `а` reads as a domain it is not. Such a domain is shown in
 * its A-label form (`xn--…`) and flagged, as is a local part that mixes
 * alphabets (its foreign letters marked), an address carrying hidden
 * direction controls, and a domain that cannot be checked at all. Plain ASCII
 * and an internationalized domain in one script are shown as they are, with
 * no warning: they imitate nothing.
 *
 * Only the display changes. A pill's title, the address a click writes to and
 * the address a reply goes to keep the spelling the message carried.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, type CSSResult, type LitElement } from 'lit';
import { cleanup, click, mount, record, shadow, shadowAll, text, waitFor } from './helpers/dom';
import { backgroundOf, backgroundsOf, ruleMatches, rulesOf } from './helpers/styles';
import { readSources } from './helpers/sources';
import { canonicalAddress, canonicalDomain, domainPresentation, isHighlyRestrictive, toUnicodeLabel } from '../src/utils/idn';
import {
  addressText, addressWarning, addressWarnings, canonicalRecipient, displayAddress, mixedScriptStyles,
} from '../src/utils/address-display';
import { recipientField, type ComposerInstance } from '../src/store/compose-store';
import { I18nStore } from '../src/store/i18n-store';
import { messageOperations } from '../src/services/message-operations';
import { en } from '../src/i18n/en';
import { da } from '../src/i18n/da';
import { de } from '../src/i18n/de';
import { es } from '../src/i18n/es';
import { fr } from '../src/i18n/fr';
import { it as itLocale } from '../src/i18n/it';
import { pt } from '../src/i18n/pt';
import { rs } from '../src/i18n/rs';
import { sr } from '../src/i18n/sr';
// Every component that renders addressText, for the shared-style check below,
// which names any it finds that is not imported here.
import '../src/components/alps-recipient-pill';
import '../src/components/alps-address-input';
import '../src/components/alps-thread-card';
import '../src/components/message-list';
import '../src/components/alps-floating-composer';

// The emoji picker builds its whole grid when it connects, which takes jsdom
// seconds per composer. Nothing here opens it.
vi.mock('unicode-emoji-picker', () => ({}));

/** CYRILLIC SMALL LETTER A, which looks exactly like the Latin `a`. */
const A = 'а';
const LOOKALIKE = `p${A}ypal.example`;
const LOOKALIKE_ASCII = 'xn--pypal-4ve.example';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const english = new I18nStore();

async function german(): Promise<I18nStore> {
  const store = new I18nStore();
  await store.setLanguage('de');
  return store;
}

/** A template rendered into a detached element, to read. */
function rendered(template: unknown): HTMLElement {
  const host = document.createElement('div');
  render(template, host);
  return host;
}

const warningOf = (address: string, i18n?: I18nStore) => rendered(addressWarning(address, i18n)).querySelector<HTMLElement>('.address-warning');

describe('which addresses are warned about', () => {
  it.each([
    ['plain ASCII', 'ada@example.com', 'ada@example.com'],
    ['digits and hyphens', 'user@abc-123.example', 'user@abc-123.example'],
    ['a German domain in A-label form', 'user@xn--bcher-kva.example', 'user@bücher.example'],
    ['a German domain as written', 'user@bücher.example', 'user@bücher.example'],
    ['the same in capitals', 'user@BÜCHER.example', 'user@bücher.example'],
    ['a Cyrillic domain', 'user@xn--e1afmkfd.xn--p1ai', 'user@пример.рф'],
    ['a Chinese domain', 'user@例子.广告', 'user@例子.广告'],
    ['one written with ideographic full stops', 'user@例子。广告', 'user@例子.广告'],
    ['Japanese, Han with Katakana', 'user@東京カタカナ.example', 'user@東京カタカナ.example'],
    ['Korean, Hangul with Han', 'user@한국漢.example', 'user@한국漢.example'],
    ['a local part in one other script', 'иван@example.com', 'иван@example.com'],
    ['a right-to-left local part', 'שלום@example.test', 'שלום@example.test'],
  ])('does not warn about %s, and shows it in Unicode', (_, address, shown) => {
    expect(addressWarnings(address)).toEqual([]);
    expect(displayAddress(address).text).toBe(shown);
    expect(warningOf(address)).toBeNull();
  });

  it.each([
    [`service@${LOOKALIKE}`, 'as written'],
    [`service@${LOOKALIKE_ASCII}`, 'in A-label form'],
    ['service@XN--PYPAL-4VE.EXAMPLE', 'in A-label form, in capitals'],
  ])('shows a domain that mixes alphabets, %s, %s, as its A-label and warns', (address) => {
    expect(displayAddress(address)).toEqual({
      text: `service@${LOOKALIKE_ASCII}`, ascii: `service@${LOOKALIKE_ASCII}`, warning: 'mixed-script-domain',
    });
  });

  it('warns about a local part that mixes alphabets, and keeps it as written', () => {
    expect(displayAddress(`p${A}ypal@example.com`)).toEqual({
      text: `p${A}ypal@example.com`, ascii: `p${A}ypal@example.com`, warning: 'mixed-script-local',
    });
  });

  it('lets Latin mix only with the scripts Chinese, Japanese and Korean are written with', () => {
    expect(isHighlyRestrictive('東京カタカナabc')).toBe(true);
    expect(isHighlyRestrictive('한국漢abc')).toBe(true);
    expect(isHighlyRestrictive(`p${A}ypal`)).toBe(false);
    expect(isHighlyRestrictive('αβγabc')).toBe(false);
    expect(isHighlyRestrictive('한국カタカナ')).toBe(false);
    // An invisible character is never decoration.
    expect(isHighlyRestrictive('pay​pal')).toBe(false);
  });

  it('decodes punycode only when it is the canonical spelling of its letters', () => {
    expect(toUnicodeLabel('xn--bcher-kva')).toBe('bücher');
    expect(toUnicodeLabel('example')).toBe('example');
    // Not punycode at all, an ASCII word dressed as an A-label, a code point
    // past the end of Unicode, and a label longer than DNS allows.
    for (const label of ['xn--zzzzzz', 'xn--abc-', 'xn--99999999999a', `xn--${'a'.repeat(60)}`]) {
      expect(toUnicodeLabel(label), label).toBe(label);
    }
  });

  it.each(['user@xn--zzzzzz.example', 'user@xn--abc-.example'])('shows %s, punycode that does not decode, as written, with no warning', (address) => {
    // Every character is the ASCII one it looks like, so it imitates nothing.
    expect(displayAddress(address)).toEqual({ text: address, ascii: address, warning: null });
    expect(rendered(addressText(address)).textContent).toBe(address);
  });

  it.each(['user@localhost', 'user@[192.0.2.1]', 'user@foo_bar.com', 'user@0x7f.1', 'user@1.2.3.4'])('shows the ASCII %s, which has no A-label, as written, with no warning', (address) => {
    expect(displayAddress(address)).toEqual({ text: address, ascii: address, warning: null });
  });

  it('does not read a numeric domain as the IPv4 address the URL parser makes of it', () => {
    expect(canonicalDomain('0x7f.1')).toBeNull();
    expect(canonicalDomain('example.com.')).toBe('example.com');
  });

  // The cases name the domain in words, not as itself: a bidi override in a
  // test title reverses the reporter's line.
  it.each([
    ['a non-ASCII letter and an underscore', 'user@bücher_buch.example'],
    ['Cyrillic and no dot', 'user@пример'],
    ['an invisible ASCII control', 'user@pay\u007fpal.com'],
    ['a circled letter the conversion maps to a plain one', 'user@ⓔxample.com'],
    ['a full-width letter the conversion maps to a plain one', 'user@ｅxample.com'],
  ])('calls a domain with %s unusual, and shows it as written', (_, address) => {
    expect(displayAddress(address)).toEqual({ text: address, ascii: address, warning: 'unusual-domain' });
  });

  it('lists every reason, the most telling first', () => {
    expect(addressWarnings(`p${A}ypal@bücher_buch.example`)).toEqual(['mixed-script-local', 'unusual-domain']);
    expect(addressWarnings(`p${A}y‮pal@example.test`)).toEqual(['directional-control', 'mixed-script-local']);
    expect(addressWarnings(`user‮@${LOOKALIKE}`)).toEqual(['directional-control', 'mixed-script-domain']);
    expect(addressWarnings(`p${A}ypal@${LOOKALIKE}`)).toEqual(['mixed-script-local', 'mixed-script-domain']);
  });

  const CONTROLS = [0x061c, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069];
  it.each(CONTROLS.map((code) => [code.toString(16).toUpperCase().padStart(4, '0'), code] as const))('warns about U+%s in either half, and isolates the address', (_hex, code) => {
    for (const address of [`user${String.fromCharCode(code)}@example.test`, `user@exa${String.fromCharCode(code)}mple.test`]) {
      // The control is the only reason: without it, each half is ordinary.
      expect(addressWarnings(address)).toEqual(['directional-control']);
      const isolate = rendered(addressText(address)).querySelector('bdi');
      expect(isolate?.getAttribute('dir')).toBe('ltr');
      expect(isolate?.textContent).toBe(address);
      expect(warningOf(address)?.textContent).toBe(`⚠ ${en.address.directionalControl}`);
    }
  });
});

describe('how a warned address is shown', () => {
  it('marks each letter from the other alphabet, with the cue its own class', () => {
    const host = rendered(addressText(`p${A}yp${A}l@example.com`));
    const marks = [...host.querySelectorAll('mark')];
    expect(marks.map((m) => m.textContent)).toEqual([A, A]);
    expect(marks.map((m) => m.className)).toEqual(['mixed-script', 'mixed-script']);
    expect(host.querySelector('bdi')?.getAttribute('dir')).toBe('ltr');
    expect(host.textContent).toBe(`p${A}yp${A}l@example.com`);
  });

  it('keeps the marks beside a direction warning, and marks no control', () => {
    const host = rendered(addressText(`p${A}y‮pal@example.test`));
    expect([...host.querySelectorAll('mark')].map((m) => m.textContent)).toEqual([A]);
  });

  it('marks nothing in a domain, which shows the A-label instead', () => {
    const host = rendered(addressText(`service@${LOOKALIKE}`));
    expect(host.querySelector('mark')).toBeNull();
    expect(host.textContent).toBe(`service@${LOOKALIKE_ASCII}`);
  });

  it('labels the warning with a glyph and the first reason', () => {
    expect(warningOf(`p${A}ypal@example.com`, english)?.textContent).toBe(`⚠ ${english.t('address.mixedScript')}`);
    expect(warningOf('user@bücher_buch.example', english)?.textContent).toBe(`⚠ ${english.t('address.unusualDomain')}`);
  });
});

/**
 * The tooltip says something true in every case: it explains each reason in
 * words, and names the A-label only where the domain was written otherwise.
 */
describe("the warning's tooltip", () => {
  const DIRECTION = () => english.t('address.directionalControlTooltip');
  const MIXED = () => english.t('address.mixedScriptTooltip');
  const UNUSUAL = () => english.t('address.unusualDomainTooltip');
  const ASCII = () => english.t('address.mixedScriptAscii', { domain: LOOKALIKE, ascii: LOOKALIKE_ASCII });

  it.each([
    ['a mixed-script local part before an unusual domain', `p${A}ypal@bücher_buch.example`, () => [MIXED(), UNUSUAL()], 'address.mixedScript'],
    ['a direction control in a mixed-script local part', `p${A}y‮pal@example.test`, () => [DIRECTION(), MIXED()], 'address.directionalControl'],
    ['a direction control before an unusual domain', 'user‮@bücher_buch.example', () => [DIRECTION(), UNUSUAL()], 'address.directionalControl'],
    ['a direction control before a mixed-script domain', `user‮@${LOOKALIKE}`, () => [DIRECTION(), MIXED(), ASCII()], 'address.directionalControl'],
  ])('lists each reason for %s, under the first one\'s label', (_, address, lines, label) => {
    const warning = warningOf(address, english)!;
    expect(warning.title).toBe(lines().join('\n'));
    expect(warning.textContent).toBe(`⚠ ${english.t(label)}`);
    // A caller with no store gets the same words, in English.
    expect(warningOf(address)!.title).toBe(lines().join('\n'));
  });

  it.each([
    ['a mixed-script local part', `p${A}ypal@example.com`, () => [MIXED()]],
    ['a mixed-script local part and domain', `p${A}ypal@${LOOKALIKE}`, () => [MIXED(), ASCII()]],
    ['a mixed-script domain', `service@${LOOKALIKE}`, () => [MIXED(), ASCII()]],
    ['a mixed-script domain already in A-label form', `service@${LOOKALIKE_ASCII}`, () => [MIXED()]],
    ['its A-label in capitals', 'service@XN--PYPAL-4VE.EXAMPLE', () => [MIXED()]],
    ['an unusual domain', 'user@bücher_buch.example', () => [UNUSUAL()]],
  ])('names each reason for %s once, and the A-label only where it says something new', (_, address, lines) => {
    expect(warningOf(address, english)!.title).toBe(lines().join('\n'));
  });

  it('explains in words, not placeholders', () => {
    for (const key of ['address.directionalControlTooltip', 'address.mixedScriptTooltip', 'address.unusualDomainTooltip']) {
      expect(english.t(key)).not.toMatch(/\{\w+\}/);
    }
    // An unusual domain may mix nothing, so its words do not say it does.
    expect(english.t('address.unusualDomainTooltip')).not.toMatch(/alphabet/i);
  });
});

describe('the words, in every language', () => {
  const LOCALES = { da, de, es, fr, it: itLocale, pt, rs, sr } as Record<string, any>;

  it.each(Object.keys(LOCALES))('%s has its own words for every warning', (code) => {
    for (const key of Object.keys(en.address) as (keyof typeof en.address)[]) {
      const translated = LOCALES[code].address?.[key];
      expect(translated, `${code} address.${key}`).toBeTypeOf('string');
      expect(translated, `${code} address.${key}`).not.toBe(en.address[key]);
    }
  });

  it('says the label and the tooltip in the reader\'s language', async () => {
    const store = await german();
    const warning = warningOf(`service@${LOOKALIKE}`, store)!;
    expect(warning.textContent).toBe(`⚠ ${de.address!.mixedScript}`);
    expect(warning.title).toBe(`${de.address!.mixedScriptTooltip}\n${store.t('address.mixedScriptAscii', { domain: LOOKALIKE, ascii: LOOKALIKE_ASCII })}`);
    expect(warning.title).not.toContain(en.address.mixedScriptTooltip);
  });
});

/**
 * The cue is one fact, so it has one look. Styled in each shadow root on its
 * own, the same warning looked different in each place, and a bare `<mark>`
 * left to the browser is a fixed yellow in every theme.
 */
describe('the cue has one look everywhere', () => {
  it('paints the mark from the theme\'s warning colour, and styles nothing but the cue and its label', () => {
    const rules = rulesOf(mixedScriptStyles.cssText);
    expect(new Set(rules.map((r) => r.selectorText))).toEqual(new Set(['mark.mixed-script', '.address-warning']));
    for (const rule of rules.filter((r) => r.selectorText === 'mark.mixed-script')) {
      expect(backgroundOf(rule)).toContain('var(--warning');
      expect(rule.style.getPropertyValue('color')).toBe('inherit');
    }
  });

  it('spaces, sizes and isolates the label in the shared style', () => {
    const label = rulesOf(mixedScriptStyles.cssText).find((r) => r.selectorText === '.address-warning')!;
    expect(label.style.getPropertyValue('margin-inline-start')).not.toBe('');
    expect(label.style.getPropertyValue('font-size')).not.toBe('');
    // A direction control in the address before it cannot reorder its words.
    expect(label.style.getPropertyValue('unicode-bidi')).toBe('isolate');
    expect(warningOf(`p${A}ypal@example.com`)!.textContent!.startsWith('⚠')).toBe(true);
  });

  // Found by scanning, not listed: a new consumer is covered the day it calls
  // addressText, rather than the day someone remembers this test.
  const consumers = Object.entries(readSources())
    .filter(([file, source]) => !file.endsWith('/utils/address-display.ts') && /\baddressText\(/.test(source));

  it('found the components that render addressText', () => {
    expect(consumers.map(([file]) => file).sort()).toEqual(expect.arrayContaining([
      'src/components/alps-address-input.ts',
      'src/components/alps-recipient-pill.ts',
      'src/components/alps-thread-card.ts',
      'src/components/message-list.ts',
    ]));
  });

  it.each(consumers)('%s includes the shared style and paints the cue nowhere else', (file, source) => {
    const tag = /@customElement\(\s*['"]([^'"]+)['"]\s*\)/.exec(source)?.[1];
    expect(tag, `${file} declares no custom element`).toBeTruthy();
    const element = customElements.get(tag!) as unknown as typeof LitElement | undefined;
    expect(element, `<${tag}> is not registered: import ${file} at the top of this test`).toBeTruthy();
    expect(element!.elementStyles).toContain(mixedScriptStyles);

    const own = element!.elementStyles
      .filter((sheet) => sheet !== mixedScriptStyles)
      .flatMap((sheet) => rulesOf((sheet as CSSResult).cssText));
    const cue = document.createElement('mark');
    cue.className = 'mixed-script';
    expect(own.filter((rule) => ruleMatches(cue, rule) && backgroundOf(rule)).map((rule) => rule.cssText)).toEqual([]);
    // Rules that NAME the label, so a universal reset is not taken for an
    // opinion about it.
    const label = document.createElement('span');
    label.className = 'address-warning';
    expect(own.filter((rule) => rule.selectorText.includes('address-warning') && ruleMatches(label, rule)).map((rule) => rule.cssText)).toEqual([]);
  });
});

describe('a recipient pill in the reader', () => {
  it.each([`service@${LOOKALIKE}`, `service@${LOOKALIKE_ASCII}`])('shows %s as its A-label, warns, and keeps the address in its title', async (address) => {
    const el = await mount('alps-recipient-pill', { address, name: 'Payments', i18nStore: english });
    expect(text(el, '.recipient-address')).toBe(`<service@${LOOKALIKE_ASCII}>`);
    expect(shadow(el, '.address-warning').textContent).toBe(`⚠ ${english.t('address.mixedScript')}`);
    expect(shadow(el, 'a').title).toBe(address);
  });

  it('marks a lookalike letter, and writes to the address as it came', async () => {
    const openComposer = vi.fn();
    const address = `p${A}ypal@example.com`;
    const el = await mount('alps-recipient-pill', { address, composeStore: { openComposer } });
    expect(shadow(el, 'mark').textContent).toBe(A);
    // No store: the English words.
    expect(shadow(el, '.address-warning').textContent).toBe(`⚠ ${en.address.mixedScript}`);
    await click(shadow(el, 'a'), el);
    expect(openComposer).toHaveBeenCalledWith({ to: [address] });
  });

  it.each(['user@xn--bcher-kva.example', 'user@xn--e1afmkfd.xn--p1ai', 'user@localhost'])('shows %s with no warning', async (address) => {
    const el = await mount('alps-recipient-pill', { address });
    expect(shadowAll(el, '.address-warning')).toHaveLength(0);
    expect(shadowAll(el, 'mark')).toHaveLength(0);
  });

  it('follows a language change while it is on screen', async () => {
    const store = new I18nStore();
    const el = await mount('alps-recipient-pill', { address: `p${A}ypal@example.com`, i18nStore: store });
    const label = () => shadow(el, '.address-warning').textContent;
    expect(label()).toBe(`⚠ ${en.address.mixedScript}`);
    await store.setLanguage('de');
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(label()).toBe(`⚠ ${de.address!.mixedScript}`);
  });
});

describe('the address field in the composer', () => {
  it('marks a lookalike letter in a pill', async () => {
    const el = await mount('alps-address-input', { addresses: [`p${A}ypal@example.com`] });
    expect(shadow(el, '.pill mark').textContent).toBe(A);
    expect(shadowAll(el, '.pill .address-warning')).toHaveLength(1);
  });

  it('shows a named pill\'s lookalike address beside the name, without changing what it holds', async () => {
    const pill = `Payments <service@${LOOKALIKE}>`;
    const el = await mount<HTMLElement & { addresses: string[] }>('alps-address-input', { addresses: [pill], i18nStore: english });
    expect(text(el, '.pill-addr')).toContain('Payments');
    expect(text(el, '.pill-addr')).toContain(`service@${LOOKALIKE_ASCII}`);
    // Named as typed, beside its A-label.
    expect(shadow(el, '.pill .address-warning').title).toBe(`${english.t('address.mixedScriptTooltip')}\n${english.t('address.mixedScriptAscii', { domain: LOOKALIKE, ascii: LOOKALIKE_ASCII })}`);
    expect(shadow(el, '.pill').title).toBe(pill);
    expect(el.addresses).toEqual([pill]);
  });

  it('shows a named pill with an ordinary address by its name alone', async () => {
    const el = await mount('alps-address-input', { addresses: ['"Ada" <ada@xn--bcher-kva.example>'] });
    expect(text(el, '.pill-addr')).toBe('Ada');
    expect(shadowAll(el, '.address-warning')).toHaveLength(0);
  });

  it('warns about a lookalike suggestion before it becomes a pill', async () => {
    const el = await mount('alps-address-input', { suggestions: [{ name: 'Payments', address: `service@${LOOKALIKE}` }, { name: 'Ada', address: 'ada@example.com' }] });
    const rows = shadowAll(el, '.suggestions-dropdown .item-text');
    expect(rows[0].textContent).toContain(`service@${LOOKALIKE_ASCII}`);
    expect(rows[0].querySelector('.address-warning')?.textContent).toBe(`⚠ ${en.address.mixedScript}`);
    expect(rows[1].querySelector('.address-warning')).toBeNull();
  });

  it('says it in the reader\'s language', async () => {
    const store = await german();
    const el = await mount('alps-address-input', { addresses: [`p${A}ypal@bücher_buch.example`], i18nStore: store });
    const warning = shadow(el, '.address-warning');
    expect(warning.textContent).toBe(`⚠ ${de.address!.mixedScript}`);
    expect(warning.title).toBe(`${de.address!.mixedScriptTooltip}\n${de.address!.unusualDomainTooltip}`);
  });
});

describe('a thread card', () => {
  const item = (from: unknown) => ({
    message: { UID: '7', Flags: ['\\Seen'], Envelope: { From: [from], To: [], Cc: [], Subject: 'Offer', Date: '2026-09-01T10:00:00Z' } },
    content: 'hello', mimeType: 'text/plain', loading: false, attachments: [], rawMessageHtml: '', hasHtml: false,
    hasText: true, activeBanners: [], allowRemoteResources: false, hasRemoteResources: false, isSent: false,
    mailbox: 'INBOX', expanded: false,
  });
  const card = (from: unknown, i18nStore: I18nStore = english) => mount('alps-thread-card', { item: item(from), mailbox: 'INBOX', i18nStore });

  it('shows a lookalike domain under the name as its A-label, and warns', async () => {
    const el = await card({ Name: 'Payments', Mailbox: 'service', Host: LOOKALIKE });
    expect(text(el, '.thread-card-sender-address')).toBe(`service@${LOOKALIKE_ASCII}`);
    expect(text(el, '.thread-card-sender')).toContain(english.t('address.mixedScript'));
    // The title keeps the address as the message carries it.
    expect(shadow(el, '.thread-card-sender').getAttribute('title')).toBe(`Payments <service@${LOOKALIKE}>`);
  });

  it('paints the marked letters from the theme\'s warning colour', async () => {
    const el = await card({ Name: 'Payments', Mailbox: `p${A}ypal`, Host: 'example.com' });
    expect(backgroundsOf(el, shadow(el, '.thread-card-sender-address mark')).join(' | ')).toContain('--warning');
  });

  it('marks a lookalike address that stands in for a name', async () => {
    const el = await card({ Mailbox: `p${A}ypal`, Host: 'example.com' });
    expect(shadow(el, '.thread-card-sender-name mark').textContent).toBe(A);
    expect(shadowAll(el, '.address-warning')).toHaveLength(1);
  });

  it('warns about nothing for a plain ASCII domain the check cannot convert', async () => {
    const el = await card({ Name: 'Cron', Mailbox: 'root', Host: 'localhost' });
    expect(text(el, '.thread-card-sender-address')).toBe('root@localhost');
    expect(shadowAll(el, '.address-warning')).toHaveLength(0);
  });

  it('calls a non-ASCII domain it cannot convert unusual, not mixed', async () => {
    const el = await card({ Name: 'Books', Mailbox: 'user', Host: 'bücher_buch.example' });
    expect(text(el, '.thread-card-sender-address')).toBe('user@bücher_buch.example');
    expect(text(el, '.thread-card-sender')).toContain(english.t('address.unusualDomain'));
    expect(text(el, '.thread-card-sender')).not.toContain(english.t('address.mixedScript'));
  });

  it('says it in the reader\'s language', async () => {
    const el = await card({ Name: 'Payments', Mailbox: 'service', Host: LOOKALIKE }, await german());
    expect(text(el, '.thread-card-sender')).toContain(de.address!.mixedScript);
    expect(text(el, '.thread-card-sender')).not.toContain(en.address.mixedScript);
  });
});

describe('a list row', () => {
  const row = (from: unknown) => ({
    UID: '1', Flags: ['\\Seen'],
    Envelope: { From: [from], To: [], Cc: [], Subject: 'Hello', Date: '2026-09-01T10:00:00Z' },
  });
  const list = (from: unknown, i18nStore: I18nStore = english) =>
    mount('alps-message-list', { messages: [row(from)], currentMailbox: 'INBOX', totalMessages: 1, showSenderAvatars: false, i18nStore });

  it('shows a lookalike address beside the sender\'s name, and warns', async () => {
    const el = await list({ Name: 'Payments', Mailbox: 'service', Host: LOOKALIKE });
    // No space before the label: its margin is the gap.
    expect(text(el, '.message-sender')).toBe(`Payments <service@${LOOKALIKE_ASCII}>⚠ ${english.t('address.mixedScript')}`);
    expect(shadow(el, '.message-sender span').title).toBe(`service@${LOOKALIKE}`);
  });

  it('shows a sender with an ordinary address by name alone', async () => {
    const el = await list({ Name: 'Ada', Mailbox: 'ada', Host: 'xn--bcher-kva.example' });
    expect(text(el, '.message-sender')).toBe('Ada');
  });

  it('warns about nothing for a plain ASCII domain the check cannot convert', async () => {
    const el = await list({ Name: 'Cron', Mailbox: 'root', Host: 'localhost' });
    expect(text(el, '.message-sender')).toBe('Cron');
  });

  it('calls a non-ASCII domain it cannot convert unusual, not mixed', async () => {
    const el = await list({ Name: 'Books', Mailbox: 'user', Host: 'bücher_buch.example' });
    expect(text(el, '.message-sender')).toContain('user@bücher_buch.example');
    expect(text(el, '.message-sender')).toContain(english.t('address.unusualDomain'));
    expect(text(el, '.message-sender')).not.toContain(english.t('address.mixedScript'));
  });

  it('paints a marked letter from the theme\'s warning colour', async () => {
    const el = await list({ Name: '', Mailbox: `p${A}ypal`, Host: 'example.com' });
    expect(backgroundsOf(el, shadow(el, '.message-sender mark')).join(' | ')).toContain('--warning');
  });

  it('says it in the reader\'s language', async () => {
    const el = await list({ Name: 'Payments', Mailbox: 'service', Host: LOOKALIKE }, await german());
    expect(text(el, '.message-sender')).toContain(de.address!.mixedScript);
    expect(text(el, '.message-sender')).not.toContain(en.address.mixedScript);
  });
});

describe('what the composer sends', () => {
  it.each([
    ['ada@bücher.example', 'ada@xn--bcher-kva.example'],
    ['José <José@Bücher.Example>', 'José <José@xn--bcher-kva.example>'],
    ['"Lovelace, Ada" <ada@bücher.example>', '"Lovelace, Ada" <ada@xn--bcher-kva.example>'],
    [`service@${LOOKALIKE}`, `service@${LOOKALIKE_ASCII}`],
  ])('sends %s with its domain in A-label form', (pill, sent) => {
    expect(canonicalRecipient(pill)).toBe(sent);
  });

  it.each([
    'ada@example.com',
    'Ada <ada@example.com>',
    // Nothing to convert, or nothing that converts as written: the server judges.
    'root@localhost',
    'user@ⓔxample.com',
    'user@bücher_buch.example',
  ])('sends %s as typed', (pill) => {
    expect(canonicalRecipient(pill)).toBe(pill);
  });

  it('converts the domain of one plain address, and nothing that is not one', () => {
    expect(canonicalAddress('José@Bücher.Example')).toBe('José@xn--bcher-kva.example');
    for (const address of ['ada lovelace@example.com', 'ada@bob@example.com', '@example.com', 'ada@localhost', 'ada@\u24d4xample.com', 'ada\u202e@example.com']) {
      expect(canonicalAddress(address), address).toBeNull();
    }
  });

  it('joins a field as the server splits it', () => {
    expect(recipientField(['ada@bücher.example', 'bob@example.com'])).toBe('ada@xn--bcher-kva.example, bob@example.com');
    expect(recipientField(undefined)).toBe('');
  });

  it('posts the A-label and leaves the pill as typed', async () => {
    const instance: ComposerInstance = { id: 'c1', to: ['Ada <ada@bücher.example>'], cc: ['bob@bücher.example'], subject: 'Hi', text: 'Hello', format: 'text' };
    const composeStore = {
      getState: () => ({ activeComposers: [instance] }),
      getComposer: (id: string) => (id === instance.id ? instance : undefined),
      updateComposer: vi.fn(),
      bringComposerToFront: vi.fn(),
      closeComposer: vi.fn(),
    };
    const i18nStore = { t: (key: string) => key, addEventListener: () => {}, removeEventListener: () => {} };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const sendDraft = vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const toasts = record<CustomEvent>(window, 'show-toast');

    const el = await mount('alps-floating-composer', { instance, composeStore, i18nStore });
    await click(shadow(el, '.send-actions alps-button[variant="primary"]'), el);
    await waitFor(() => toasts.length > 0, 'the undo toast');
    toasts[0].detail.dismissFn();
    await waitFor(() => sendDraft.mock.calls.length > 0, 'the send');

    const form = sendDraft.mock.calls[0][0] as FormData;
    expect(form.get('to')).toBe('Ada <ada@xn--bcher-kva.example>');
    expect(form.get('cc')).toBe('bob@xn--bcher-kva.example');
    expect(instance.to).toEqual(['Ada <ada@bücher.example>']);
  });
});

describe('the domain as read', () => {
  it('converts each label on its own', () => {
    expect(domainPresentation(`mail.${LOOKALIKE}`)).toEqual({
      text: `mail.${LOOKALIKE_ASCII}`, ascii: `mail.${LOOKALIKE_ASCII}`, warning: 'mixed-script-domain',
    });
    expect(domainPresentation('mail.xn--bcher-kva.example').text).toBe('mail.bücher.example');
  });
});
