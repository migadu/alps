/**
 * The i18n store: document language, plural selection, and language switches
 * that race.
 *
 * alps's Serbian codes are its own: `rs` is the Cyrillic dictionary and `sr` the
 * Latin one, so the Intl tags are rs -> sr-Cyrl and sr -> sr-Latn.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nController, I18nStore } from '../src/store/i18n-store';

async function withLanguage(lang: string): Promise<I18nStore> {
  const store = new I18nStore();
  await store.setLanguage(lang);
  return store;
}

beforeEach(() => {
  document.documentElement.lang = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('document language', () => {
  it('is set when the store is created', () => {
    new I18nStore();
    expect(document.documentElement.lang).toBe('en');
  });

  it('follows a change, using the script-qualified tag for Serbian', async () => {
    const store = new I18nStore();
    for (const [lang, tag] of [['de', 'de'], ['rs', 'sr-Cyrl'], ['sr', 'sr-Latn'], ['pt', 'pt']]) {
      await store.setLanguage(lang);
      expect(document.documentElement.lang, lang).toBe(tag);
      expect(store.getIntlLanguage(), lang).toBe(tag);
    }
  });

  it('still moves when the dictionary cannot be loaded, and the text falls back to English', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const store = await withLanguage('xx');
    expect(store.getLanguage()).toBe('xx');
    expect(document.documentElement.lang).toBe('xx');
    expect(store.t('general.cancel')).toBe('Cancel');
  });
});

describe('switching language', () => {
  it('ends on the language asked for last, whichever dictionary loads first', async () => {
    const store = new I18nStore();
    const german = (await withLanguage('de')).t('general.cancel');
    const french = (await withLanguage('fr')).t('general.cancel');
    expect(german).not.toBe(french);

    await Promise.all([store.setLanguage('de'), store.setLanguage('fr')]);
    expect(store.getLanguage()).toBe('fr');
    expect(store.t('general.cancel')).toBe(french);
    expect(document.documentElement.lang).toBe('fr');
  });

  it('announces a change, and not a repeat of the current language', async () => {
    const store = new I18nStore();
    const heard = vi.fn();
    store.addEventListener('change', heard);
    await store.setLanguage('de');
    await store.setLanguage('de');
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('merges the plugins\' dictionaries into every language', async () => {
    const en = new I18nStore();
    const de = await withLanguage('de');
    expect(en.t('calendar.loadFailed')).not.toBe('calendar.loadFailed');
    expect(de.t('calendar.loadFailed')).not.toBe('calendar.loadFailed');
    expect(de.t('calendar.loadFailed')).not.toBe(en.t('calendar.loadFailed'));
  });
});

describe('lookup', () => {
  it('returns the key for a path no dictionary defines', () => {
    expect(new I18nStore().t('nothing.here')).toBe('nothing.here');
    expect(new I18nStore().t('general')).toBe('general');
  });

  it('inserts a parameter literally, even one that looks like a replacement pattern', () => {
    // String.replace reads $& and $' in a replacement string; a folder named
    // "a$&b" came out as "a{folder}b" through the chained-replace idiom.
    const store = new I18nStore();
    expect(store.t('messageList.emptyMailboxTitle', { folder: "a$&b$'c" })).toBe("Empty a$&b$'c");
  });

  it('interpolates every parameter it is given and leaves unknown ones visible', () => {
    const store = new I18nStore();
    expect(store.t('toast.messagesMovedToFolder', { count: 2, folder: 'Work' })).toBe('2 messages moved to Work');
    expect(store.t('toast.messagesMovedToFolder', { count: 2 })).toBe('2 messages moved to {folder}');
  });
});

describe('plurals', () => {
  it('keeps English to its two forms', () => {
    const store = new I18nStore();
    expect(store.t('toast.draftsDiscarded', { count: 1 })).toBe('1 draft discarded');
    expect(store.t('toast.draftsDiscarded', { count: 2 })).toBe('2 drafts discarded');
    expect(store.t('toast.draftsDiscarded', { count: 0 })).toBe('0 drafts discarded');
  });

  it('picks one, few and other in Cyrillic Serbian', async () => {
    const rs = await withLanguage('rs');
    for (const count of [1, 21, 101]) expect(rs.t('toast.draftsDiscarded', { count }), String(count)).toBe(`${count} нацрт одбачен`);
    for (const count of [2, 3, 4, 22, 34]) expect(rs.t('toast.draftsDiscarded', { count }), String(count)).toBe(`${count} нацрта одбачена`);
    for (const count of [5, 11, 12, 14, 100]) expect(rs.t('toast.draftsDiscarded', { count }), String(count)).toBe(`${count} нацрта одбачено`);
  });

  it('picks the same forms in Latin Serbian', async () => {
    const sr = await withLanguage('sr');
    expect(sr.t('toast.messagesMovedToFolder', { count: 1, folder: 'Posao' })).toBe('1 poruka premeštena u Posao');
    expect(sr.t('toast.messagesMovedToFolder', { count: 3, folder: 'Posao' })).toBe('3 poruke premeštene u Posao');
    expect(sr.t('toast.messagesMovedToFolder', { count: 9, folder: 'Posao' })).toBe('9 poruka premešteno u Posao');
  });

  it('falls back to other for a form the locale does not spell out', async () => {
    const de = await withLanguage('de');
    const other = de.t('toast.draftsDiscarded', { count: 7 }).replace('7', '3');
    expect(de.t('toast.draftsDiscarded', { count: 3 })).toBe(other);
  });

  it('uses other, not the key, when a caller forgets the count', () => {
    expect(new I18nStore().t('toast.draftsDiscarded')).toBe('{count} drafts discarded');
  });
});

describe('I18nController', () => {
  it('re-renders its host on a change while connected, and not after', async () => {
    const store = new I18nStore();
    const host = { addController: vi.fn(), requestUpdate: vi.fn() };
    const controller = new I18nController(host as any, store);
    expect(host.addController).toHaveBeenCalledWith(controller);

    controller.hostConnected();
    await store.setLanguage('de');
    expect(host.requestUpdate).toHaveBeenCalledTimes(1);

    controller.hostDisconnected();
    await store.setLanguage('fr');
    expect(host.requestUpdate).toHaveBeenCalledTimes(1);
  });
});
