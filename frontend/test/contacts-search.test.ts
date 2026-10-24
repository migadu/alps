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

describe('a category renamed or removed during a search', () => {
  // During a search the cards carrying the category are read from the whole
  // book before any is written. The page moved first: a rename put the address
  // and the open category on the new name, a removal went to All Contacts, and
  // either rewrote the user's own list of categories in storage. When that
  // read failed, the write threw, or every card refused the change, no card
  // had changed. After a rename the page sat on a name no card carried, over
  // an empty list; after a removal every card still carried a category the
  // stored list had dropped.
  const USER = 'ann@example.test';
  const KEY = `alps_contacts_categories_${USER}`;
  const ownCategories = () => JSON.parse(localStorage.getItem(KEY) || '[]');

  /** What the toasts said: with this dictionary, their keys. */
  let toasts: string[] = [];
  const onToast = (e: Event) => toasts.push((e as CustomEvent).detail.message);

  /** `category` open, kept in the user's own list too, and searched for "ann". */
  async function searchedForAnnIn(category: string): Promise<Page> {
    localStorage.setItem('alps_active_user', USER);
    localStorage.setItem(KEY, JSON.stringify([category]));
    history.replaceState(null, '', `#/contacts/${category}`);
    const page = await mount<Page>('contacts-page', { i18nStore });
    await settle(page);
    await send(page, 'app-header', 'search-submit', { value: 'ann' });
    expect(page.filterQuery).toBe('ann');
    expect(page.selectedCategory).toBe(category);
    listings = [];
    return page;
  }

  /** Work open, carried by Ann and Bob, and searched for "ann". */
  async function workSearchedForAnn(): Promise<Page> {
    const page = await searchedForAnnIn('Work');
    expect(shown(page), 'the search narrowed the list').toEqual([ANN.path]);
    return page;
  }

  async function rename(page: Page, category = 'Work'): Promise<void> {
    await send(page, 'alps-contacts-categories', 'rename-category', { category });
    await send(page, 'ui-prompt', 'submit', { name: 'Clients' });
  }

  async function remove(page: Page, category = 'Work'): Promise<void> {
    await send(page, 'alps-contacts-categories', 'delete-category', { category });
    await send(page, 'ui-confirm', 'confirm');
  }

  /** Nothing on the page has moved off `category`. */
  function stillOn(page: Page, category = 'Work') {
    expect(window.location.hash).toBe(`#/contacts/${category}`);
    expect(page.selectedCategory).toBe(category);
    expect(page.addedCategories).toEqual([category]);
    expect(ownCategories()).toEqual([category]);
  }

  const refuseEvery = () => vi.spyOn(contactsService, 'bulkUpdateCategories')
    .mockImplementation(async (cards: any[]) => ({ total: cards.length, done: 0, failed: cards.length, uncertain: 0, etags: {} }));

  const takeOne = () => vi.spyOn(contactsService, 'bulkUpdateCategories')
    .mockImplementation(async (cards: any[]) => ({ total: cards.length, done: 1, failed: cards.length - 1, uncertain: 0, etags: {} }));

  beforeEach(() => {
    toasts = [];
    window.addEventListener('show-toast', onToast);
  });

  afterEach(() => {
    window.removeEventListener('show-toast', onToast);
    localStorage.removeItem('alps_active_user');
    localStorage.removeItem(KEY);
  });

  for (const [gesture, act, oneFailed, failed] of [
    ['a rename', rename, 'contacts.categoryRenameOneFailed', 'contacts.categoryRenameFailed'],
    ['a removal', remove, 'contacts.categoryDeleteOneFailed', 'contacts.categoryDeleteFailed'],
  ] as const) {
    it(`${gesture} that could not read the book leaves the category where it was`, async () => {
      const page = await workSearchedForAnn();
      const write = vi.spyOn(contactsService, 'bulkUpdateCategories');
      bookFails = true;

      await act(page);

      expect(write).not.toHaveBeenCalled();
      stillOn(page);
      expect(listings, 'the whole book was asked for').toContain('');
      expect(toasts).toEqual([oneFailed]);
    });

    it(`${gesture} that every card refused leaves the category where it was`, async () => {
      const page = await workSearchedForAnn();
      const write = refuseEvery();

      await act(page);

      expect(write).toHaveBeenCalledTimes(1);
      stillOn(page);
      expect(toasts).toEqual([failed]);
    });

    it(`${gesture} whose write threw leaves the category where it was`, async () => {
      const page = await workSearchedForAnn();
      const write = vi.spyOn(contactsService, 'bulkUpdateCategories').mockRejectedValue(new Error('offline'));

      await act(page);

      expect(write).toHaveBeenCalledTimes(1);
      stillOn(page);
      expect(toasts).toEqual([failed]);
    });

    it(`${gesture} of a category kept only on this page stays put when the book could not be read`, async () => {
      // No card may carry it, and only the book can say so.
      const page = await searchedForAnnIn('Later');
      bookFails = true;

      await act(page, 'Later');

      stillOn(page, 'Later');
      expect(listings, 'the whole book was asked for').toContain('');
      expect(toasts).toEqual([oneFailed]);
    });
  }

  it('a rename moves the page to the new name once a card carries it, though another refused', async () => {
    const page = await workSearchedForAnn();
    takeOne();

    await rename(page);

    expect(window.location.hash).toBe('#/contacts/Clients');
    expect(page.selectedCategory).toBe('Clients');
    expect(ownCategories()).toEqual(['Clients']);
    // One of the two cards refused.
    expect(toasts).toEqual(['contacts.categoryRenameFailed']);
  });

  it('a removal goes to All Contacts once a card has let go of it, though another refused', async () => {
    const page = await workSearchedForAnn();
    takeOne();

    await remove(page);

    expect(window.location.hash).toBe('#/contacts/all');
    expect(page.selectedCategory).toBe('');
    expect(page.addedCategories).toEqual([]);
    expect(ownCategories()).toEqual([]);
    expect(toasts).toEqual(['contacts.categoryDeleteFailed']);
  });

  it('a category kept only on this page is renamed once the book shows no card carries it', async () => {
    const page = await searchedForAnnIn('Later');
    const write = vi.spyOn(contactsService, 'bulkUpdateCategories');

    await rename(page, 'Later');

    expect(listings, 'the whole book was asked for').toContain('');
    expect(write).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/contacts/Clients');
    expect(page.selectedCategory).toBe('Clients');
    expect(page.addedCategories).toEqual(['Clients']);
    expect(ownCategories()).toEqual(['Clients']);
    expect(toasts).toEqual([]);
  });

  it('a category kept only on this page is removed once the book shows no card carries it', async () => {
    const page = await searchedForAnnIn('Later');
    const write = vi.spyOn(contactsService, 'bulkUpdateCategories');

    await remove(page, 'Later');

    expect(listings, 'the whole book was asked for').toContain('');
    expect(write).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/contacts/all');
    expect(page.selectedCategory).toBe('');
    expect(page.addedCategories).toEqual([]);
    expect(ownCategories()).toEqual([]);
    expect(toasts).toEqual([]);
  });
});
