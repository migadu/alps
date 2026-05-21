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
  }

  async setLanguage(lang: string) {
    if (this.language === lang) {
      return;
    }
    this.language = lang;
    
    try {
      if (lang === 'en') {
        this.dictionary = en;
      } else {
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
        
        const pluginModules = await Promise.all(pluginPromises);
        for (const module of pluginModules) {
            const pluginDict = module.default || (module as any)[lang] || {};
            newDict = deepMerge(newDict, pluginDict);
        }

        this.dictionary = newDict;
      }
    } catch (e) {
      Logger.error(`Failed to load language module for ${lang}`, e);
      // Fallback to English if missing
      this.dictionary = en;
    }

    this.dispatchEvent(new CustomEvent('change'));
  }

  getLanguage() {
    return this.language;
  }

  getIntlLanguage() {
    if (this.language === 'rs') return 'sr-Latn';
    if (this.language === 'sr') return 'sr-Cyrl';
    return this.language;
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
    
    if (typeof result !== 'string') {
      // Fallback to English
      let enResult: any = en;
      for (const k of keys) {
        if (enResult === undefined || enResult === null) {
          break;
        }
        enResult = enResult[k];
      }
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
