/**
 * Keys the input method takes.
 *
 * Someone typing Chinese, Japanese or Korean picks a conversion candidate with
 * Enter, and drops one with Escape. Each handler that acted on Enter acted on
 * that one too: a form built from alps-input submitted, a search ran and a
 * folder was named while the text was still being composed. Such a key comes
 * with `isComposing` set, or in Safari with the key code 229 (isComposingKey,
 * active-element.test.ts); the dialogs, the recipient field, the share dialog,
 * the identity form and the Settings window have their own cases beside their
 * other tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/alps-input';
import '../src/components/app-header';
import { cleanup, mount, record, shadow } from './helpers/dom';
import { readSources } from './helpers/sources';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

const enter = (init: KeyboardEventInit = {}) =>
  new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true, ...init });

const COMPOSING: KeyboardEventInit[] = [{ isComposing: true }, { keyCode: 229 }];

afterEach(cleanup);

describe('a form built from alps-input', () => {
  async function form() {
    const el = document.createElement('form');
    const submits: Event[] = [];
    el.addEventListener('submit', (e) => { e.preventDefault(); submits.push(e); });
    const field = document.createElement('alps-input') as El;
    el.append(field);
    document.body.append(el);
    await field.updateComplete;
    return { field: shadow<HTMLInputElement>(field, 'input'), submits };
  }

  it('submits on Enter', async () => {
    const { field, submits } = await form();
    const press = enter();
    field.dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
    expect(submits).toHaveLength(1);
  });

  it('does not submit on the Enter that picks a candidate', async () => {
    const { field, submits } = await form();
    for (const init of COMPOSING) {
      const press = enter(init);
      field.dispatchEvent(press);
      expect(press.defaultPrevented).toBe(false);
    }
    expect(submits).toHaveLength(0);
  });
});

describe('the header search', () => {
  it('searches on Enter, and not on the Enter that picks a candidate', async () => {
    const el = await mount<El>('app-header', { i18nStore });
    const searches = record<CustomEvent>(el, 'search-submit');
    const box = shadow<El>(el, 'alps-input');
    box.value = '文件';
    for (const init of COMPOSING) box.dispatchEvent(enter(init));
    expect(searches).toHaveLength(0);
    box.dispatchEvent(enter());
    expect(searches.map((e) => e.detail.value)).toEqual(['文件']);
  });
});

describe('every handler that acts on Enter', () => {
  // Handlers on a text field, which must leave the IME its keys, and the
  // ones on a button, a row or a list, which no composition reaches. A new
  // handler belongs in one or the other.
  const TEXT_FIELDS = [
    'src/components/alps-address-input.ts',
    'src/components/alps-floating-composer.ts',
    'src/components/alps-input.ts',
    'src/components/alps-message-composer.ts',
    'src/components/alps-popup.ts',
    'src/components/app-header.ts',
    'src/components/folder-share-dialog.ts',
    'src/components/ui-prompt.ts',
    'plugins/carddav/frontend/contact-view.ts',
  ];
  const NOT_TEXT = [
    'src/components/alps-category-item.ts',
    'src/components/folder-list.ts',
    'src/components/message-list.ts',
    'plugins/caldav/frontend/calendar-mini-month.ts',
    'plugins/caldav/frontend/calendar-page.ts',
    'plugins/caldav/frontend/tasks-list.ts',
    'plugins/carddav/frontend/contacts-categories.ts',
    'plugins/carddav/frontend/contacts-list.ts',
  ];
  const sources = readSources();
  const handling = Object.keys(sources).filter((path) => /\.key\s*[!=]==\s*'Enter'|case 'Enter'/.test(sources[path])).sort();

  it('is accounted for', () => {
    expect(handling).toEqual([...TEXT_FIELDS, ...NOT_TEXT].sort());
  });

  it('leaves the IME its keys where it handles a text field', () => {
    expect(TEXT_FIELDS.filter((path) => !/isComposingKey\(e\)/.test(sources[path]))).toEqual([]);
  });
});
