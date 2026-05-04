import { createContext } from '@lit/context';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { en } from '../i18n/en';
import type { TranslationDictionary } from '../i18n/en';

export class I18nStore extends EventTarget {
  private language: string = 'en';
  private dictionary: TranslationDictionary = en;

  constructor() {
    super();
  }

  async setLanguage(lang: string) {
    if (this.language === lang) return;
    this.language = lang;
    
    try {
      if (lang === 'en') {
        this.dictionary = en;
      } else {
        const locales = import.meta.glob(['../i18n/*.ts', '!../i18n/en.ts']);
        const importFn = locales[`../i18n/${lang}.ts`];
        if (importFn) {
          const module: any = await importFn();
          this.dictionary = module.default || module[lang];
        } else {
          throw new Error(`Locale file not found for ${lang}`);
        }
      }
    } catch (e) {
      console.error(`Failed to load language module for ${lang}`, e);
      // Fallback to English if missing
      this.dictionary = en;
    }

    this.dispatchEvent(new CustomEvent('change'));
  }

  getLanguage() {
    return this.language;
  }

  t(key: string): string {
    const keys = key.split('.');
    let result: any = this.dictionary;
    
    for (const k of keys) {
      if (result === undefined || result === null) {
        break;
      }
      result = result[k];
    }
    
    return typeof result === 'string' ? result : key;
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
