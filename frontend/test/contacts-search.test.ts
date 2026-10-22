/**
 * Searching the contacts page, and leaving the search.
 *
 * A search is answered by the server: the page sets `filterQuery` and reads
 * the list with it, so under a search `this.contacts` is the server's answer
 * to that query and nothing more. Ending the search has to read again. The
 * banner's "clear search" did; a category clicked in the sidebar cleared the
 * query and read nothing, so the box said there was no search while the list
 * went on showing the old query's matches.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/carddav/frontend/contacts-page';
import '../../plugins/carddav/frontend/contact-view';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { CATEGORY_ALL_CONTACTS } from '../../plugins/carddav/frontend/constants';
import { cleanup, flush, mount } from './helpers/dom';

type Page = HTMLElement & Record<string, any>;

/** Ann and Bob are filed under Work, Cal under Home. Only Ann matches "ann". */
const ANN = { path: '/book/ann.vcf', uid: 'uA', name: 'Ann Smith', categories: ['Work'] };
const BOB = { path: '/book/bob.vcf', uid: 'uB', name: 'Bob Barker', categories: ['Work'] };
const CAL = { path: '/book/cal.vcf', uid: 'uC', name: 'Cal Jones', categories: ['Home'] };
const BOOK = [ANN, BOB, CAL];

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };

/** Every listing the page asked for, by its query ('' for none). */
let listings: string[] = [];
/** When set, a read with this query waits for `release`. */
let holdQuery: string | null = null;
let release: () => void = () => {};
/** When set, a read of the whole book fails. */
let bookFails = false;

beforeEach(() => {
  listings = [];
  holdQuery = null;
  bookFails = false;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(contactsService, 'fetchContacts').mockImplementation(async (query = '') => {
    listings.push(query);
    if (query && query === holdQuery) await new Promise<void>(resolve => { release = resolve; });
    if (!query && bookFails) throw new Error('offline');
    const cards = query ? BOOK.filter(c => c.name.toLowerCase().includes(query.toLowerCase())) : BOOK;
    return { contacts: cards.map(c => ({ ...c, categories: [...c.categories] })) };
  });
  history.replaceState(null, '', '#/contacts/all');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  history.replaceState(null, '', '#/');
});

async function settle(el: Page, ticks = 8): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    await flush();
    await el.updateComplete;
  }
}

const child = (page: Page, selector: string): Page => {
  const found = page.shadowRoot!.querySelector<Page>(selector);
  expect(found, `no ${selector}`).not.toBeNull();
  return found!;
};

async function send(page: Page, selector: string, type: string, detail?: unknown): Promise<void> {
  child(page, selector).dispatchEvent(new CustomEvent(type, { detail }));
  await settle(page);
}

/** The rows the list draws: its own filters over the page's `contacts`. */
const shown = (page: Page) => child(page, 'alps-contacts-list').getFilteredContacts().map((c: any) => c.path);

/** The page on #/contacts/all, searched for "ann" from the header's box. */
async function searchedForAnn(): Promise<Page> {
  const page = await mount<Page>('contacts-page', { i18nStore });
  await settle(page);
  await send(page, 'app-header', 'search-submit', { value: 'ann' });
  expect(shown(page), 'the search narrowed the list').toEqual([ANN.path]);
  listings = [];
  return page;
}

describe('a category clicked during a search', () => {
  it('lists the whole category, from a listing without the query', async () => {
    const page = await searchedForAnn();

    await send(page, 'alps-contacts-categories', 'select-category', { category: 'Work' });

    expect(window.location.hash).toBe('#/contacts/Work');
    expect(page.filterQuery).toBe('');
    // Bob is filed under Work and did not match the search: he was missing.
    expect(shown(page)).toEqual([ANN.path, BOB.path]);
    expect(listings).toEqual(['']);
  });

  it('lists the whole book for All Contacts, though the address does not change', async () => {
    const page = await searchedForAnn();

    await send(page, 'alps-contacts-categories', 'select-category', { category: CATEGORY_ALL_CONTACTS });

    expect(window.location.hash).toBe('#/contacts/all');
    expect(shown(page)).toEqual([ANN.path, BOB.path, CAL.path]);
  });

  it('reads nothing when there was no search', async () => {
    const page = await mount<Page>('contacts-page', { i18nStore });
    await settle(page);
    listings = [];

    await send(page, 'alps-contacts-categories', 'select-category', { category: 'Work' });

    expect(shown(page)).toEqual([ANN.path, BOB.path]);
    expect(listings).toEqual([]);
  });
});

describe("the banner's clear search", () => {
  it('lists the whole book again', async () => {
    const page = await searchedForAnn();

    await send(page, 'alps-contacts-list', 'clear-search');

    expect(page.filterQuery).toBe('');
    expect(shown(page)).toEqual([ANN.path, BOB.path, CAL.path]);
    expect(listings).toEqual(['']);
  });
});

describe('reads that answer out of order', () => {
  it('paint only the newest: a search ended before it answered stays ended', async () => {
    const page = await mount<Page>('contacts-page', { i18nStore });
    await settle(page);
    holdQuery = 'ann';

    await send(page, 'app-header', 'search-submit', { value: 'ann' });
    await send(page, 'alps-contacts-categories', 'select-category', { category: CATEGORY_ALL_CONTACTS });
    expect(shown(page)).toEqual([ANN.path, BOB.path, CAL.path]);

    release();
    await settle(page);

    expect(page.filterQuery).toBe('');
    expect(shown(page)).toEqual([ANN.path, BOB.path, CAL.path]);
    expect(page.loading).toBe(false);
  });
});

describe('the sidebar during a search', () => {
  /** What the sidebar lists, as `name count`. */
  const sidebar = async (page: Page) => {
    const categories = child(page, 'alps-contacts-categories');
    // It reads its dictionary from context, which this page is mounted without.
    categories.i18nStore = i18nStore;
    categories.requestUpdate();
    await categories.updateComplete;
    return Array.from(categories.shadowRoot!.querySelectorAll('.category-item')).map(item =>
      `${item.querySelector('.category-name')!.textContent!.trim()} ${item.querySelector('.category-badge')?.textContent?.trim() ?? ''}`.trim());
  };

  it('describes the whole book, not the matches', async () => {
    const page = await searchedForAnn();
    await settle(page);

    // Home is carried only by Cal, who does not match "ann"; Work has two cards.
    expect(await sidebar(page)).toEqual(['contacts.allContacts 3', 'contacts.favorites 0', 'Home 1', 'Work 2']);
    // The category picker offers what the sidebar does.
    expect(child(page, 'alps-contact-view').uniqueCategories).toEqual(['Home', 'Work']);
  });

  it('counts an edit made during the search', async () => {
    const page = await searchedForAnn();
    vi.spyOn(contactsService, 'updateCategories').mockResolvedValue({ ok: 'true', path: ANN.path });

    await page.handleToggleStar(new Event('click'), page.contacts[0]);
    await settle(page);

    expect(await sidebar(page)).toContain('contacts.favorites 1');
    expect(await sidebar(page)).toContain('Work 2');
  });

  it('keeps the book it had when the read beside the search fails', async () => {
    const page = await mount<Page>('contacts-page', { i18nStore });
    await settle(page);
    bookFails = true;

    await send(page, 'app-header', 'search-submit', { value: 'ann' });

    expect(shown(page), 'the search itself still answered').toEqual([ANN.path]);
    expect(await sidebar(page)).toEqual(['contacts.allContacts 3', 'contacts.favorites 0', 'Home 1', 'Work 2']);
  });
});
