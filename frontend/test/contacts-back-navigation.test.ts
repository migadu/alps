/**
 * The contacts page's own rewrites of its address.
 *
 * The page names the open category and card in the address,
 * `#/contacts/<category>/<card>`, and renders from it. Some writes are the
 * user going somewhere: a card or a category clicked, the pane closed. Others
 * correct the address the user is already on after a gesture changed what it
 * names: the open category renamed or deleted, the open card deleted or filed
 * out of the open category. Those were assigned too, so each left an entry
 * behind naming something no longer there. Back onto a renamed or deleted
 * category showed an empty list under a name the sidebar no longer had, and a
 * deleted card stayed in the address, where a reload or Back asked for a card
 * that is gone.
 *
 * The page is mounted against a stubbed service holding two cards, and the
 * history is jsdom's: `history.length`, and `history.back()` with the
 * `hashchange` it queues.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/carddav/frontend/contacts-page';
import '../../plugins/carddav/frontend/contact-view';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { cleanup, flush, mount } from './helpers/dom';

type Page = HTMLElement & Record<string, any>;

const ADA = { path: '/book/ada.vcf', uid: 'uA', name: 'Ada Lovelace' };
const BOB = { path: '/book/bob.vcf', uid: 'uB', name: 'Bob Barker' };

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };

/** What the server holds: Ada's categories, and whether she is still there. */
let adaCategories: string[] = [];
let adaDeleted = false;

const stored = () => [
  ...(adaDeleted ? [] : [{ ...ADA, categories: [...adaCategories] }]),
  { ...BOB, categories: [] },
];

beforeEach(() => {
  adaCategories = ['Work'];
  adaDeleted = false;
  vi.spyOn(contactsService, 'fetchContacts').mockImplementation(async () => ({ contacts: stored() }));
  vi.spyOn(contactsService, 'fetchContact').mockImplementation(async (path: string) => stored().find(c => c.path === path));
  vi.spyOn(contactsService, 'bulkDeleteContacts').mockImplementation(async (paths: string[]) => {
    if (paths.includes(ADA.path)) adaDeleted = true;
    return { total: paths.length, done: paths.length, failed: 0, deletedPaths: paths };
  });
  vi.spyOn(contactsService, 'bulkUpdateCategories').mockImplementation(async (cards: any[]) => {
    for (const card of cards) if (card.path === ADA.path) adaCategories = card.categories;
    return { total: cards.length, done: cards.length, failed: 0, etags: {} };
  });
  history.replaceState(null, '', '#/');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  history.replaceState(null, '', '#/');
});

/** Lets every queued `hashchange`, read and Lit update run out. */
async function settle(el: Page, ticks = 8): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    await flush();
    await el.updateComplete;
  }
}

/** A navigation the browser's way: a new entry, then the event, as a task. */
async function follow(hash: string): Promise<void> {
  const arrived = new Promise((resolve) => window.addEventListener('hashchange', resolve, { once: true }));
  window.location.hash = hash;
  await arrived;
}

/** The page as the shell mounts it: on whatever the address is now. */
async function open(): Promise<Page> {
  const page = await mount<Page>('contacts-page', { i18nStore });
  await settle(page);
  return page;
}

/** The browser's Back button, and whatever the page does about it. */
async function back(page: Page): Promise<void> {
  const arrived = new Promise((resolve) => window.addEventListener('hashchange', resolve, { once: true }));
  history.back();
  await arrived;
  await settle(page);
}

/** An event from one of the page's own children, as that child sends it. */
async function send(page: Page, selector: string, type: string, detail?: unknown): Promise<void> {
  const child = page.shadowRoot!.querySelector(selector);
  expect(child, `no ${selector}`).not.toBeNull();
  child!.dispatchEvent(new CustomEvent(type, { detail }));
  await settle(page);
}

describe("the page's own rewrites of the address", () => {
  it('renaming the open category keeps one entry', async () => {
    await follow('#/contacts/Work');
    const page = await open();
    const before = history.length;

    await send(page, 'alps-contacts-categories', 'rename-category', { category: 'Work' });
    await send(page, 'ui-prompt', 'submit', { name: 'Clients' });

    expect(window.location.hash).toBe('#/contacts/Clients');
    expect(page.selectedCategory).toBe('Clients');
    expect(history.length).toBe(before);

    // Not onto #/contacts/Work, a category that is no longer there.
    await back(page);
    expect(window.location.hash).toBe('#/');
  });

  it('deleting the open category keeps one entry', async () => {
    await follow('#/contacts/Work');
    const page = await open();
    const before = history.length;

    await send(page, 'alps-contacts-categories', 'delete-category', { category: 'Work' });
    await send(page, 'ui-confirm', 'confirm');

    expect(window.location.hash).toBe('#/contacts/all');
    expect(page.selectedCategory).toBe('');
    expect(history.length).toBe(before);

    await back(page);
    expect(window.location.hash).toBe('#/');
  });

  it('deleting the open card leaves its address for the list, in place', async () => {
    await follow(`#/contacts/all/${ADA.uid}`);
    const page = await open();
    expect(page.selectedContact?.path).toBe(ADA.path);
    const before = history.length;

    await send(page, 'alps-contact-view', 'delete');
    await send(page, 'ui-confirm', 'confirm');

    expect(page.selectedContact).toBeNull();
    // A reload of the old address would ask for a card that is gone.
    expect(window.location.hash).toBe('#/contacts/all');
    expect(history.length).toBe(before);

    await back(page);
    expect(window.location.hash).toBe('#/');
  });

  it('filing the open card out of the open category moves to All in place', async () => {
    // The page follows the card to a list that still holds it. The user asked
    // for a category change, not to go anywhere, and the old address named the
    // card under a category it no longer carries.
    await follow(`#/contacts/Work/${ADA.uid}`);
    const page = await open();
    expect(page.selectedContact?.path).toBe(ADA.path);
    const before = history.length;

    await send(page, 'alps-contact-view', 'update-categories', { category: 'Work' });

    expect(adaCategories).toEqual([]);
    expect(window.location.hash).toBe(`#/contacts/all/${ADA.uid}`);
    expect(history.length).toBe(before);
    // What the hashchange used to bring: the list the address now names, with
    // the card still open in it.
    expect(page.selectedCategory).toBe('');
    expect(page.selectedContact?.path).toBe(ADA.path);

    await back(page);
    expect(window.location.hash).toBe('#/');
  });
});

describe("the user's own moves on the page", () => {
  // These stay entries: another card, another category or the pane closed is
  // a place the user went, and Back is how they return.
  it('a click on another card stays an entry Back returns through', async () => {
    await follow(`#/contacts/all/${ADA.uid}`);
    const page = await open();
    const before = history.length;

    const bob = page.contacts.find((c: any) => c.path === BOB.path);
    await send(page, 'alps-contacts-list', 'select-contact', { contact: bob });
    expect(window.location.hash).toBe(`#/contacts/all/${BOB.uid}`);
    expect(history.length).toBe(before + 1);

    await back(page);
    expect(window.location.hash).toBe(`#/contacts/all/${ADA.uid}`);
    expect(page.selectedContact?.path).toBe(ADA.path);
  });

  it('another category stays an entry too', async () => {
    await follow(`#/contacts/all/${ADA.uid}`);
    const page = await open();

    await send(page, 'alps-contacts-categories', 'select-category', { category: 'Work' });
    expect(window.location.hash).toBe('#/contacts/Work');

    await back(page);
    expect(window.location.hash).toBe(`#/contacts/all/${ADA.uid}`);
    expect(page.selectedContact?.path).toBe(ADA.path);
  });

  it('closing the card stays an entry too', async () => {
    await follow(`#/contacts/all/${ADA.uid}`);
    const page = await open();

    await send(page, 'alps-contact-view', 'close');
    expect(window.location.hash).toBe('#/contacts/all');
    expect(page.selectedContact).toBeNull();

    await back(page);
    expect(window.location.hash).toBe(`#/contacts/all/${ADA.uid}`);
    expect(page.selectedContact?.path).toBe(ADA.path);
  });
});
