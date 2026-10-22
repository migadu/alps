/**
 * Select All on the contacts list ticks the rows on screen, and shows ticked
 * when they all are.
 *
 * It compared the selection with every contact loaded, so in a category view
 * it never showed ticked and could not clear the selection. And the page
 * ticked every card in the category, including the ones the starred filter
 * hid, which a Delete then removed unseen.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/carddav/frontend/contacts-list';
import '../../plugins/carddav/frontend/contacts-page';
import { CATEGORY_FAVORITES } from '../../plugins/carddav/frontend/constants';
import { cleanup, mount, record, shadow, update } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };

const card = (path: string, categories: string[] = []) => ({ path, name: path, email: `${path}@example.test`, categories });
const ada = card('ada', [CATEGORY_FAVORITES, 'Work']);
const bob = card('bob', ['Work']);
const cal = card('cal', ['Home']);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('the list header checkbox', () => {
  const list = (props: Record<string, unknown>) =>
    mount<El>('alps-contacts-list', { i18nStore, contacts: [ada, bob, cal], selectedContacts: new Set(), ...props });
  const box = (el: El) => shadow<HTMLInputElement>(el, '.select-all-checkbox');

  it('ticks only the rows the starred filter shows', async () => {
    const el = await list({ showOnlyStarred: true });
    const events = record<CustomEvent>(el, 'select-all');

    box(el).checked = true;
    box(el).dispatchEvent(new Event('change'));

    expect(events.map(e => e.detail)).toEqual([{ checked: true, paths: ['ada'] }]);
  });

  it('ticks only the rows of the open category and the search', async () => {
    const el = await list({ selectedCategory: 'Work', filterQuery: 'bo' });
    const events = record<CustomEvent>(el, 'select-all');

    box(el).checked = true;
    box(el).dispatchEvent(new Event('change'));

    expect(events[0].detail.paths).toEqual(['bob']);
  });

  it('shows ticked when every row on screen is, and not before', async () => {
    const el = await list({ selectedCategory: 'Work', selectedContacts: new Set(['ada']) });
    expect(box(el).checked).toBe(false);

    await update(el, { selectedContacts: new Set(['ada', 'bob']) });
    expect(box(el).checked).toBe(true);
  });

  it('leaves out a new card not yet saved', async () => {
    const el = await list({ contacts: [{ name: 'New', categories: [], isTemporary: true }, bob] });
    const events = record<CustomEvent>(el, 'select-all');

    box(el).checked = true;
    box(el).dispatchEvent(new Event('change'));

    expect(events[0].detail.paths).toEqual(['bob']);
  });
});

describe('the page', () => {
  function page(fields: Record<string, unknown> = {}): El {
    const el = document.createElement('contacts-page') as El;
    Object.assign(el, { contacts: [ada, bob, cal], selectedContacts: new Set(), ...fields });
    return el;
  }
  const selectAll = (el: El, detail: Record<string, unknown>) =>
    el.handleSelectAll(new CustomEvent('select-all', { detail }));

  it('ticks the rows the list names', () => {
    const el = page();
    selectAll(el, { checked: true, paths: ['bob'] });
    expect([...el.selectedContacts]).toEqual(['bob']);
  });

  it('keeps to the starred filter when the list names no rows', () => {
    const el = page({ selectedCategory: 'Work', showOnlyStarred: true });
    selectAll(el, { checked: true });
    expect([...el.selectedContacts]).toEqual(['ada']);
  });

  it('clears the selection', () => {
    const el = page({ selectedContacts: new Set(['ada', 'bob']) });
    selectAll(el, { checked: false, paths: ['ada', 'bob'] });
    expect(el.selectedContacts.size).toBe(0);
  });
});
