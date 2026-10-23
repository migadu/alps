/**
 * A decorative icon is not a button, and a contacts category is picked with a
 * control of its own.
 *
 * Each category row began with its icon drawn as an `alps-icon-btn`, which is
 * always a real <button>. The row hid it from the mouse with
 * `pointer-events: none`, but Tab still stopped on it, a screen reader read it
 * as a "button" with no name, and it was the only way to pick a category from
 * the keyboard: the row itself was not focusable, and Enter on the icon only
 * worked because its click bubbled up to the row. The selection summaries of
 * the reader and the contact card drew their icon the same way.
 *
 * The icons are now drawn with renderIcon(). Each row's icon and name are its
 * button: one Tab stop, named by the category, operated with Enter and Space.
 * Not the whole row, which also holds a category's menu: a button may not
 * contain other controls, and a screen reader may hide what one does.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../../plugins/carddav/frontend/contacts-categories';
import '../../plugins/carddav/frontend/contact-view';
import '../src/components/message-reader';
import { CATEGORY_ALL_CONTACTS, CATEGORY_FAVORITES } from '../../plugins/carddav/frontend/constants';
import { cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount, record, shadow, shadowAll } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string, params?: Record<string, unknown>) => (params?.count !== undefined ? `${key} ${params.count}` : key),
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/** Every element under `root` that Tab can stop on, looking into shadow roots as the browser does. */
function tabStops(root: Element): Element[] {
  const found: Element[] = [];
  const walk = (el: Element) => {
    if (el.matches(FOCUSABLE)) found.push(el);
    if (el.shadowRoot) Array.from(el.shadowRoot.children).forEach(walk);
    Array.from(el.children).forEach(walk);
  };
  walk(root);
  return found;
}

const describeStop = (el: Element) => el.outerHTML.slice(0, 120);

function key(target: Element, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
});

afterEach(cleanup);

describe('the contacts category rows', () => {
  async function categories(): Promise<El> {
    return mount<El>('alps-contacts-categories', {
      i18nStore,
      contacts: [
        { uid: '1', categories: ['Work'] },
        { uid: '2', categories: ['Work', CATEGORY_FAVORITES] },
      ],
      uniqueCategories: ['Work'],
    });
  }

  const rows = (el: El) => shadowAll<HTMLElement>(el, '.category-item');
  const controls = (el: El) => shadowAll<HTMLElement>(el, '.category-item .category-control');

  it('draw their icon as decoration, not as a Tab stop', async () => {
    const el = await categories();
    expect(rows(el)).toHaveLength(3);
    for (const row of rows(el)) {
      const icon = row.querySelector('.category-icon');
      expect(icon, 'every row still shows its icon').not.toBeNull();
      expect(tabStops(icon!).map(describeStop)).toEqual([]);
    }
  });

  it('each have one button, named by the category, with its count as the description', async () => {
    const el = await categories();
    expect(controls(el)).toHaveLength(3);
    const described = (control: HTMLElement) =>
      el.shadowRoot!.getElementById(control.getAttribute('aria-describedby') ?? '')?.textContent?.trim();
    expect(controls(el).map(control => ({
      role: control.getAttribute('role'),
      tabIndex: control.tabIndex,
      name: control.getAttribute('aria-label'),
      count: described(control),
    }))).toEqual([
      { role: 'button', tabIndex: 0, name: 'contacts.allContacts', count: '2' },
      { role: 'button', tabIndex: 0, name: 'contacts.favorites', count: '1' },
      { role: 'button', tabIndex: 0, name: 'Work', count: '2' },
    ]);
    // The row itself is no control: it holds the menu of a category of the user's own.
    expect(rows(el).map(row => row.getAttribute('role'))).toEqual([null, null, null]);
  });

  it('keep the menu out of the button', async () => {
    const el = await categories();
    const work = controls(el)[2];
    expect(rows(el)[2].querySelector('.kebab-btn'), "the Work row has its menu").not.toBeNull();
    expect(tabStops(work)).toEqual([work]);
  });

  it('mark the category on screen as the current one', async () => {
    const el = await categories();
    const current = () => controls(el).map(control => control.getAttribute('aria-current'));
    expect(current()).toEqual(['true', null, null]);
    el.selectedCategory = 'Work';
    await el.updateComplete;
    expect(current()).toEqual([null, null, 'true']);
  });

  it.each(['Enter', ' '])('pick their category with %j', async (name) => {
    const el = await categories();
    const picked = record<CustomEvent>(el, 'select-category');
    const [all, favorites, work] = controls(el);

    const event = key(work, name);
    key(favorites, name);
    key(all, name);

    expect(picked.map(e => e.detail.category)).toEqual(['Work', CATEGORY_FAVORITES, CATEGORY_ALL_CONTACTS]);
    // Space would otherwise also scroll the sidebar.
    expect(event.defaultPrevented).toBe(true);
  });

  it('leave other keys, and keys meant for the menu beside them, alone', async () => {
    const el = await categories();
    const picked = record<CustomEvent>(el, 'select-category');
    const work = controls(el)[2];

    key(work, 'a');
    key(shadow(el, '.category-item .kebab-btn'), 'Enter');

    expect(picked).toEqual([]);
  });
});

describe('the selection summaries', () => {
  it('the reader draws its envelope as decoration', async () => {
    const settingsStore = Object.assign(new EventTarget(), {
      getState: () => ({ enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true }),
    });
    const el = await mount<El>('alps-message-reader', { i18nStore, settingsStore, selectedCount: 3 });
    const summary = shadow(el, '.empty-reader-state');
    expect(tabStops(summary).map(describeStop)).toEqual([]);
    expect(summary.querySelector('.icon'), 'the summary still shows its icon').not.toBeNull();
  });

  it('the contact card draws its people icon as decoration', async () => {
    const settingsStore = { getState: () => ({ dateFormat: 'MM/DD/YYYY' }) };
    const el = await mount<El>('alps-contact-view', { i18nStore, settingsStore, selectedCount: 3 });
    const summary = shadow(el, '.empty-state');
    expect(tabStops(summary).map(describeStop)).toEqual([]);
    expect(summary.querySelector('.icon'), 'the summary still shows its icon').not.toBeNull();
  });
});
