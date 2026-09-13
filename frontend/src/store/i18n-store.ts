import { createContext } from '@lit/context';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { en as coreEn } from '../i18n/en';
import type { TranslationDictionary } from '../i18n/en';
import { Logger } from '../utils/logger';

function deepMerge(target: any, source: any): any {
  if (typeof target !== 'object' || target === null) return source;
  if (typeof source !== 'object' || source === null) return target;

  const output = { ...target };
  Object.keys(source).forEach(key => {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          if (!(key in target)) {
              output[key] = source[key];
          } else {
              output[key] = deepMerge(target[key], source[key]);
          }
      } else {
          output[key] = source[key];
      }
  });
  return output;
}

const pluginEnLocales = import.meta.glob('../../../plugins/*/frontend/i18n/en.ts', { eager: true });
let combinedEn = { ...coreEn };

for (const path in pluginEnLocales) {
  const module: any = pluginEnLocales[path];
  const pluginDict = module.default || module['en'] || {};
  combinedEn = deepMerge(combinedEn, pluginDict);
}

export const en = combinedEn as TranslationDictionary;

export class I18nStore extends EventTarget {
  private language: string = 'en';
  private dictionary: TranslationDictionary = en;

  constructor() {
    super();
    // The initial value matters as much as the changes: a session that never
    // switches language still needs the document to say which one it is in.
    this.applyDocumentLanguage();
  }

  /** Kept in one place so the initial value and every change agree. */
  private applyDocumentLanguage(): void {
    document.documentElement.lang = this.getIntlLanguage();
  }

  async setLanguage(lang: string) {
    if (this.language === lang) {
      return;
    }
    // Set BEFORE the await, so a concurrent call for the same language
    // short-circuits above instead of loading the chunk twice — and so a LATER
    // call for a different language wins: the fence after the load drops this
    // call's result if `language` has moved on by the time its chunk arrives.
    // Without it the dictionary is whichever chunk resolved LAST, which need
    // not be the one last asked for, and the document attribute set below would
    // then disagree with the text on screen. Two calls is the normal case, not
    // a rare one: app-root calls this at boot and again when settings resolve.
    this.language = lang;

    // Built into a LOCAL and committed after the fence, rather than assigned to
    // `this.dictionary` as it goes: a superseded call must not leave a
    // half-merged dictionary behind on its way to being discarded.
    let dictionary: TranslationDictionary = en;
    try {
      if (lang !== 'en') {
        let newDict: any = {};
        const locales = import.meta.glob(['../i18n/*.ts', '!../i18n/en.ts']);
        const importFn = locales[`../i18n/${lang}.ts`];
        if (importFn) {
          const module: any = await importFn();
          newDict = module.default || module[lang];
        } else {
          throw new Error(`Locale file not found for ${lang}`);
        }

        const pluginLocales = import.meta.glob(['../../../plugins/*/frontend/i18n/*.ts', '!../../../plugins/*/frontend/i18n/en.ts']);
        const pluginPromises = [];
        for (const path in pluginLocales) {
            if (path.endsWith(`/${lang}.ts`)) {
                pluginPromises.push((pluginLocales[path] as () => Promise<any>)());
            }
        }
        
        // allSettled, not all: one plugin whose locale chunk fails to load — a
        // network blip on a lazy import, a syntax error in one dictionary —
        // rejected here, and the outer catch then abandoned the ENTIRE language
        // change. So a single broken translation file meant nobody could switch
        // language at all, rather than one feature staying in English.
        const settled = await Promise.allSettled(pluginPromises);
        for (const outcome of settled) {
            if (outcome.status === 'rejected') {
                Logger.error('Failed to load a plugin dictionary', outcome.reason);
                continue;
            }
            const module = outcome.value;
            const pluginDict = module.default || (module as any)[lang] || {};
            newDict = deepMerge(newDict, pluginDict);
        }

        dictionary = newDict;
      }
    } catch (e) {
      Logger.error(`Failed to load language module for ${lang}`, e);
      // English TEXT — but the language the user chose is still the language
      // the page reports, so a failed chunk does not also mis-announce the UI.
      dictionary = en;
    }

    if (this.language !== lang) return;
    this.dictionary = dictionary;

    // The DOCUMENT's language, not just the dictionary's. `index.html` ships
    // `lang="en"` and nothing ever moved it, so a user reading alps in German
    // had every word announced by an English speech synthesiser — and
    // hyphenation, quotation marks and the spell-checker all followed the wrong
    // rules too. `getIntlLanguage` already resolved the BCP-47 tag for this,
    // including sr-Latn / sr-Cyrl; it just had no caller.
    this.applyDocumentLanguage();
    this.dispatchEvent(new CustomEvent('change'));
  }

  getLanguage() {
    return this.language;
  }

  /**
   * The BCP-47 tag for the active language.
   *
   * The two Serbian codes are alps's OWN, and they are the opposite way round
   * from what the tag names suggest: settings-page offers `rs` under the label
   * `serbian` ("Српски") and `sr` under `serbianLatin` ("Srpski (Latinica)"),
   * and the dictionaries match — rs.ts is 96% Cyrillic, sr.ts is 99% Latin.
   *
   * This mapped them the other way, which cost nothing while the method had no
   * callers. Wiring it to `<html lang>` and `Intl.PluralRules` is what made it
   * matter: it would have stamped `sr-Latn` on the Cyrillic dictionary and
   * `sr-Cyrl` on the Latin one, telling a screen reader to read Cyrillic text
   * with Latin rules.
   */
  getIntlLanguage() {
    if (this.language === 'rs') return 'sr-Cyrl';
    if (this.language === 'sr') return 'sr-Latn';
    return this.language;
  }

  /**
   * Cached per language — constructing one is not free and `t()` runs on every
   * render of every component.
   */
  private pluralRules: Intl.PluralRules | null = null;
  private pluralRulesFor = '';

  /**
   * Which CLDR plural form a count takes in the ACTIVE language.
   *
   * English and German have two (one/other); Serbian has three, and its
   * boundaries are not where an English speaker expects: `one` covers 1, 21, 31
   * — anything ending in 1 but not 11 — and `few` covers 2–4, 22–24. A single
   * string written in the plural was right for 5 and wrong for 1 and for 2.
   * Intl.PluralRules knows every one of those rules; it needs the right tag,
   * which is why this goes through getIntlLanguage (corrected for alps's own
   * Serbian codes in e72417c).
   */
  private pluralForm(count: number): string {
    const lang = this.getIntlLanguage();
    if (this.pluralRulesFor !== lang || !this.pluralRules) {
      this.pluralRules = new Intl.PluralRules(lang);
      this.pluralRulesFor = lang;
    }
    return this.pluralRules.select(count);
  }

  /**
   * A plural entry is an object of forms rather than a string. Pick the form for
   * params.count, falling back to `other` for a form the locale does not spell
   * out (es/fr/it/pt `many` reads the same as `other`).
   *
   * Without a numeric count, `other` — not the object. Otherwise the lookup
   * below finds no string, falls through English the same way, and hands the
   * caller the KEY, so a call site that forgot to pass the count would render
   * "toast.draftsDiscarded" rather than a wrongly-numbered sentence.
   */
  private pickPluralForm(entry: any, params?: Record<string, any>): any {
    if (!entry || typeof entry !== 'object') return entry;
    const form = typeof params?.count === 'number' ? this.pluralForm(params.count) : 'other';
    const picked = entry[form] ?? entry.other;
    return typeof picked === 'string' ? picked : entry;
  }

  t(key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let result: any = this.dictionary;
    
    for (const k of keys) {
      if (result === undefined || result === null) {
        break;
      }
      result = result[k];
    }
    result = this.pickPluralForm(result, params);
    
    if (typeof result !== 'string') {
      // Fallback to English
      let enResult: any = en;
      for (const k of keys) {
        if (enResult === undefined || enResult === null) {
          break;
        }
        enResult = enResult[k];
      }
      enResult = this.pickPluralForm(enResult, params);
      result = typeof enResult === 'string' ? enResult : key;
    }
    
    if (typeof result === 'string' && params) {
      return result.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }
    
    return result;
  }
}

export const i18nContext = createContext<I18nStore>('i18n-store');

export class I18nController implements ReactiveController {
  private host: ReactiveControllerHost;
  private store: I18nStore;
  private _boundOnChange: () => void;

  constructor(host: ReactiveControllerHost, store: I18nStore) {
    (this.host = host).addController(this);
    this.store = store;
    this._boundOnChange = () => this.host.requestUpdate();
  }

  hostConnected() {
    this.store.addEventListener('change', this._boundOnChange);
  }

  hostDisconnected() {
    this.store.removeEventListener('change', this._boundOnChange);
  }
}
