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

/** What the server holds: Ada's categories, and who is still there. */
let adaCategories: string[] = [];
let adaDeleted = false;
let bobDeleted = false;
/** Runs before a delete is answered; true refuses that card. */
let beforeDelete: ((path: string) => Promise<boolean>) | undefined;

const stored = () => [
  ...(adaDeleted ? [] : [{ ...ADA, categories: [...adaCategories] }]),
  ...(bobDeleted ? [] : [{ ...BOB, categories: [] }]),
];

beforeEach(() => {
  adaCategories = ['Work'];
  adaDeleted = false;
  bobDeleted = false;
  beforeDelete = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(contactsService, 'fetchContacts').mockImplementation(async () => ({ contacts: stored() }));
  vi.spyOn(contactsService, 'fetchContact').mockImplementation(async (path: string) => stored().find(c => c.path === path));
  // The real bulk delete, so its outcome is the service's own; one card at a
  // time is the stub.
  vi.spyOn(contactsService, 'deleteContact').mockImplementation(async (path: string) => {
    if (await beforeDelete?.(path)) throw new Error('refused');
    if (path === ADA.path) adaDeleted = true;
    if (path === BOB.path) bobDeleted = true;
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

  it('a delayed delete cannot close the card opened while it was pending', async () => {
    await follow(`#/contacts/all/${ADA.uid}`);
    const page = await open();
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    beforeDelete = async () => { await held; return false; };

    await send(page, 'alps-contact-view', 'delete');
    await send(page, 'ui-confirm', 'confirm');
    await follow(`#/contacts/all/${BOB.uid}`);
    await settle(page);
    expect(page.selectedContact?.path).toBe(BOB.path);
    release();
    await settle(page);

    expect(adaDeleted).toBe(true);
    expect(window.location.hash).toBe(`#/contacts/all/${BOB.uid}`);
    expect(page.selectedContact?.path).toBe(BOB.path);
  });

  it('a partial delete keeps the open card whose deletion was refused', async () => {
    await follow(`#/contacts/all/${ADA.uid}`);
    const page = await open();
    page.selectedContacts = new Set([ADA.path, BOB.path]);
    beforeDelete = async path => path === ADA.path;

    await send(page, 'alps-contact-view', 'delete');
    await send(page, 'ui-confirm', 'confirm');

    expect(adaDeleted).toBe(false);
    expect(bobDeleted).toBe(true);
    expect(window.location.hash).toBe(`#/contacts/all/${ADA.uid}`);
    expect(page.selectedContact?.path).toBe(ADA.path);
    expect(page.selectedContacts.size).toBe(0);
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
