/**
 * The `auto` language: the dictionary nearest the browser's languages.
 *
 * `auto` is a setting, not a language. The store resolves it, and everything
 * the store reports is the resolved language: getLanguage, which the calendar
 * sends with an invitation for the server to write it in, the document's
 * `lang` and `dir`, and the plural rules.
 *
 * alps's Serbian codes are its own: `rs` is the Cyrillic dictionary and `sr`
 * the Latin one, the opposite of what the browser's tags suggest.
 */
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nStore, SUPPORTED_LANGUAGES, detectBrowserLanguage, resolveLanguage } from '../src/store/i18n-store';
import { de } from '../src/i18n/de';
import { fr } from '../src/i18n/fr';
import { zhHans } from '../src/i18n/zh-Hans';
import { zhHant } from '../src/i18n/zh-Hant';

function withLanguages(languages: string[], language = languages[0] ?? '') {
  vi.stubGlobal('navigator', { ...navigator, languages, language });
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
});

describe('the languages alps speaks', () => {
  it('are the dictionaries present, so a new one is detected without more', () => {
    const files = readdirSync(resolve(__dirname, '../src/i18n')).map((name) => name.replace(/\.ts$/, ''));
    expect([...SUPPORTED_LANGUAGES].sort()).toEqual(files.sort());
  });
});

describe('detectBrowserLanguage', () => {
  it('matches a language by its primary subtag', () => {
    withLanguages(['de-DE', 'de', 'en-US']);
    expect(detectBrowserLanguage()).toBe('de');
    for (const [tag, code] of [['fr-CA', 'fr'], ['es-MX', 'es'], ['it-CH', 'it'], ['pt-PT', 'pt'], ['da-DK', 'da'], ['ar-EG', 'ar']]) {
      withLanguages([tag]);
      expect(detectBrowserLanguage(), tag).toBe(code);
    }
  });

  it("walks the browser's list in the reader's order, past what alps cannot serve", () => {
    withLanguages(['fa-IR', 'de-AT', 'fr']);
    expect(detectBrowserLanguage()).toBe('de');
  });

  it('falls back to the single navigator.language when the list is empty', () => {
    withLanguages([], 'pt-PT');
    expect(detectBrowserLanguage()).toBe('pt');
  });

  it('falls back to English when alps has none of them', () => {
    withLanguages(['fa-IR', 'he-IL']);
    expect(detectBrowserLanguage()).toBe('en');
    withLanguages([], '');
    expect(detectBrowserLanguage()).toBe('en');
  });

  it('reads Serbian in the Latin script, and the old sh tag, in sr', () => {
    for (const tag of ['sr-Latn', 'sr-Latn-RS', 'sh', 'sh-RS']) {
      withLanguages([tag]);
      expect(detectBrowserLanguage(), tag).toBe('sr');
    }
  });

  it('reads Cyrillic, a bare sr and a region alone in rs', () => {
    for (const tag of ['sr-Cyrl', 'sr-Cyrl-RS', 'sr', 'sr-RS']) {
      withLanguages([tag]);
      expect(detectBrowserLanguage(), tag).toBe('rs');
    }
  });

  it('does not hand Croatian or Bosnian the Serbian dictionary', () => {
    withLanguages(['hr-HR', 'bs']);
    expect(detectBrowserLanguage()).toBe('en');
  });

  it('never takes a tag for one of alps\'s own Serbian codes', () => {
    // `rs` is a country, not a language: no browser means Serbian by it.
    withLanguages(['rs']);
    expect(detectBrowserLanguage()).toBe('en');
  });

  it.each([
    ['zh-CN', 'zh-Hans'], ['zh-SG', 'zh-Hans'], ['zh', 'zh-Hans'],
    ['zh-Hans', 'zh-Hans'], ['zh-Hans-TW', 'zh-Hans'], ['ZH-hANS-cN', 'zh-Hans'],
    ['zh-TW', 'zh-Hant'], ['zh-HK', 'zh-Hant'], ['zh-MO', 'zh-Hant'],
    ['zh-Hant', 'zh-Hant'], ['zh-Hant-CN', 'zh-Hant'], ['ZH-hANT-hK', 'zh-Hant'],
    ['pt-BR', 'pt-BR'], ['PT-br', 'pt-BR'], ['pt-Latn-BR', 'pt-BR'], ['pt-BR-u-nu-latn', 'pt-BR'],
    ['pt', 'pt'], ['pt-PT', 'pt'], ['pt-AO', 'pt'],
    ['ja-JP', 'ja'], ['ko-KR', 'ko'], ['ru-RU', 'ru'], ['hi-IN', 'hi'], ['id-ID', 'id'], ['tr-TR', 'tr'],
  ])('reads %s in %s', (tag, code) => {
    withLanguages([tag]);
    expect(detectBrowserLanguage()).toBe(code);
  });

  it('reads Chinese by its script first, then by its region', () => {
    for (const [tag, code] of [
      ['zh', 'zh-Hans'], ['zh-CN', 'zh-Hans'], ['zh-SG', 'zh-Hans'], ['zh-CN-u-nu-hanidec', 'zh-Hans'],
      ['zh-Hans-TW', 'zh-Hans'], ['zh-TW', 'zh-Hant'], ['zh-Hant-CN', 'zh-Hant'],
    ]) {
      withLanguages([tag]);
      expect(detectBrowserLanguage(), tag).toBe(code);
    }
  });

  it('passes over a Chinese alps has no dictionary for, rather than read it in the other script', () => {
    const traditionalOnly = SUPPORTED_LANGUAGES.filter((code) => code !== 'zh-Hans');
    withLanguages(['zh-CN', 'ja-JP']);
    expect(detectBrowserLanguage(traditionalOnly)).toBe('ja');
    withLanguages(['zh-Hans-TW']);
    expect(detectBrowserLanguage(traditionalOnly)).toBe('en');
    const simplifiedOnly = SUPPORTED_LANGUAGES.filter((code) => code !== 'zh-Hant');
    withLanguages(['zh-TW', 'ko-KR']);
    expect(detectBrowserLanguage(simplifiedOnly)).toBe('ko');
    withLanguages(['zh-Hant-CN']);
    expect(detectBrowserLanguage(simplifiedOnly)).toBe('en');
  });

  it('keeps the first preference it can serve ahead of later ones', () => {
    withLanguages(['fa', 'zh-Hant-HK', 'ja-JP', 'pt-BR']);
    expect(detectBrowserLanguage()).toBe('zh-Hant');
  });

  it('passes over a tag that is no tag', () => {
    withLanguages(['zh_not_a_tag', 'pt_foo', '', 'ja-JP']);
    expect(detectBrowserLanguage()).toBe('ja');
  });
});

describe('resolveLanguage', () => {
  it('is the browser\'s language for auto, and for no setting at all', () => {
    withLanguages(['de-AT']);
    expect(resolveLanguage('auto')).toBe('de');
    expect(resolveLanguage(undefined)).toBe('de');
    expect(resolveLanguage('')).toBe('de');
  });

  it('is the language chosen, whatever the browser prefers', () => {
    withLanguages(['de-AT']);
    expect(resolveLanguage('fr')).toBe('fr');
    expect(resolveLanguage('rs')).toBe('rs');
    expect(resolveLanguage('en')).toBe('en');
  });
});

describe('the store under auto', () => {
  it('starts in English, and shows the browser\'s language once set to auto', async () => {
    withLanguages(['de-AT', 'en']);
    const store = new I18nStore();
    expect(store.getLanguage()).toBe('en');
    expect(document.documentElement.lang).toBe('en');

    await store.setLanguage('auto');

    expect(store.getLanguage()).toBe('de');
    expect(store.getIntlLanguage()).toBe('de');
    expect(document.documentElement.lang).toBe('de');
    expect(store.t('general.cancel')).toBe(de.general.cancel);
  });

  it('never reports auto, even when the browser\'s language is English', async () => {
    withLanguages(['fa-IR']);
    const store = new I18nStore();
    const heard = vi.fn();
    store.addEventListener('change', heard);

    await store.setLanguage('auto');

    expect(store.getLanguage()).toBe('en');
    expect(store.getIntlLanguage()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    // English was already on screen: nothing to load or announce.
    expect(heard).not.toHaveBeenCalled();
  });

  it('tags Serbian by its script and writes Arabic right to left', async () => {
    const store = new I18nStore();
    withLanguages(['sr-Latn-RS']);
    await store.setLanguage('auto');
    expect([store.getLanguage(), document.documentElement.lang]).toEqual(['sr', 'sr-Latn']);
    withLanguages(['sr-RS']);
    await store.setLanguage('auto');
    expect([store.getLanguage(), document.documentElement.lang]).toEqual(['rs', 'sr-Cyrl']);
    withLanguages(['ar-SA']);
    await store.setLanguage('auto');
    expect([store.getLanguage(), document.documentElement.dir]).toEqual(['ar', 'rtl']);
  });

  it('shows a mainland browser Simplified Chinese, and a Taiwanese one Traditional', async () => {
    const store = new I18nStore();
    withLanguages(['zh-CN']);
    await store.setLanguage('auto');
    expect([store.getLanguage(), document.documentElement.lang]).toEqual(['zh-Hans', 'zh-Hans']);
    expect(store.t('general.save')).toBe(zhHans.general.save);
    withLanguages(['zh-TW']);
    await store.setLanguage('auto');
    expect([store.getLanguage(), document.documentElement.lang]).toEqual(['zh-Hant', 'zh-Hant']);
    expect(store.t('general.save')).toBe(zhHant.general.save);
  });

  it('picks the plural forms of the language shown', async () => {
    withLanguages(['sr-Cyrl']);
    const store = new I18nStore();
    await store.setLanguage('auto');
    expect(store.t('toast.draftsDiscarded', { count: 3 })).toBe('3 нацрта одбачена');
  });

  it('treats auto and the language it stands for as the same choice', async () => {
    withLanguages(['de-DE']);
    const store = new I18nStore();
    await store.setLanguage('auto');
    const heard = vi.fn();
    store.addEventListener('change', heard);

    // Settings reach the store on every change, the theme's too.
    await store.setLanguage('auto');
    await store.setLanguage('de');

    expect(heard).not.toHaveBeenCalled();
  });

  it('ends on a language chosen while the browser\'s is still loading', async () => {
    withLanguages(['de-DE']);
    const store = new I18nStore();
    await Promise.all([store.setLanguage('auto'), store.setLanguage('fr')]);
    expect(store.getLanguage()).toBe('fr');
    expect(store.t('general.cancel')).toBe(fr.general.cancel);
    expect(document.documentElement.lang).toBe('fr');
  });
});
