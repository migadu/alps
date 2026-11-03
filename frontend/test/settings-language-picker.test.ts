/**
 * The language picker's options say which language each is written in.
 *
 * Each option names its language in its own words ("Deutsch", "Српски
 * (ћирилица)"), and an option with no `lang` of its own inherits the page's,
 * so a screen reader on a page in English read "Deutsch" with English rules.
 * The tag comes from the same helper as the document's, so alps's swapped
 * Serbian codes come out as sr-Cyrl for `rs` and sr-Latn for `sr`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'lit';
import '../src/components/alps-select';
import '../src/components/settings-window';
import { I18nStore, intlTag } from '../src/store/i18n-store';
import { cleanup, mount } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const options = (select: Element) =>
  [...select.shadowRoot!.querySelectorAll('option')].map((o) => [o.value, o.getAttribute('lang'), o.textContent?.trim()]);

let host: HTMLElement | null = null;

afterEach(() => {
  cleanup();
  host?.remove();
  host = null;
});

describe('alps-select', () => {
  it('marks an option with the language it is given, and leaves the rest to the page', async () => {
    const el = await mount<El>('alps-select', {
      value: 'a',
      options: [{ value: 'a', label: 'Deutsch', lang: 'de' }, { value: 'b', label: 'Other' }],
    });
    expect(options(el)).toEqual([['a', 'de', 'Deutsch'], ['b', null, 'Other']]);
  });
});

describe('the language picker', () => {
  it('tags every language with its own, Serbian by script', async () => {
    const i18nStore = new I18nStore();
    await i18nStore.setLanguage('en');
    const page = document.createElement('settings-window') as El;
    Object.assign(page, { i18nStore, settingsState: { language: 'en' } });
    host = document.createElement('div');
    document.body.appendChild(host);
    render(page.renderLocalization(), host);
    const select = host.querySelector('alps-select') as El;
    await select.updateComplete;

    expect(options(select)).toEqual([
      // Auto is a word of the page's own language, so it carries no lang.
      ['auto', null, 'Auto (Browser default)'],
      ['en', 'en', 'English'],
      ['de', 'de', 'Deutsch'],
      ['it', 'it', 'Italiano'],
      ['es', 'es', 'Español'],
      ['rs', 'sr-Cyrl', 'Српски (ћирилица)'],
      ['sr', 'sr-Latn', 'Srpski (latinica)'],
      ['fr', 'fr', 'Français'],
      ['pt', 'pt-PT', 'Português (Portugal)'],
      ['pt-BR', 'pt-BR', 'Português (Brasil)'],
      ['da', 'da', 'Dansk'],
      ['ru', 'ru', 'Русский'],
      ['tr', 'tr', 'Türkçe'],
      ['id', 'id', 'Bahasa Indonesia'],
      ['hi', 'hi', 'हिन्दी'],
      ['ja', 'ja', '日本語'],
      ['ko', 'ko', '한국어'],
      ['zh-Hans', 'zh-Hans', '简体中文'],
      ['zh-Hant', 'zh-Hant', '繁體中文'],
      ['ar', 'ar', 'العربية'],
    ]);
  });

  it('offers the browser\'s own first, for the language, the time and the date', async () => {
    const i18nStore = new I18nStore();
    await i18nStore.setLanguage('de');
    const page = document.createElement('settings-window') as El;
    Object.assign(page, { i18nStore, settingsState: { language: 'auto', hourFormat: 'auto', dateFormat: 'auto', weekStart: 1 } });
    host = document.createElement('div');
    document.body.appendChild(host);
    render(page.renderLocalization(), host);
    const [language, time, date, week] = [...host.querySelectorAll('alps-select')] as El[];
    for (const select of [language, time, date]) {
      await select.updateComplete;
      expect(options(select)[0], select.label).toEqual(['auto', null, 'Automatisch (Browser-Standard)']);
      expect(select.shadowRoot!.querySelector('select')!.value, select.label).toBe('auto');
    }
    await week.updateComplete;
    expect(options(week).map(([value]) => value)).toEqual(['1', '0']);
  });

  it('takes the tag from the helper the document language uses', async () => {
    const store = new I18nStore();
    for (const code of ['rs', 'sr', 'de']) {
      await store.setLanguage(code);
      expect(store.getIntlLanguage(), code).toBe(intlTag(code));
    }
  });
});
