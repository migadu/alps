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
import { CATEGORY_FAVORITES } from '../../plugins/carddav/frontend/constants';
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

describe('a rename or removal of the open category, once its cards are written', () => {
  // The page leaves the old name only after the cards carrying it are
  // written, and the user can open a card, begin editing it or go to another
  // category in the meantime. A rewrite to the bare list would close the card
  // and throw the edit away. A card open in the category when the change
  // began now stays open too, and like one open under All Contacts it must
  // show what was written for it: shown as it was opened, an edit saved from
  // it would put the old name back.

  /** Holds every category write until the returned function is called. */
  function holdWrites(): () => void {
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockImplementation(async (cards: any[]) => {
      await held;
      for (const card of cards) if (card.path === ADA.path) adaCategories = card.categories;
      return { total: cards.length, done: cards.length, failed: 0, uncertain: 0, etags: {} };
    });
    return () => release();
  }

  async function rename(page: Page): Promise<void> {
    await send(page, 'alps-contacts-categories', 'rename-category', { category: 'Work' });
    await send(page, 'ui-prompt', 'submit', { name: 'Clients' });
  }

  async function remove(page: Page): Promise<void> {
    await send(page, 'alps-contacts-categories', 'delete-category', { category: 'Work' });
    await send(page, 'ui-confirm', 'confirm');
  }

  for (const [gesture, act, after, list] of [
    ['a rename', rename, 'Clients', 'Clients'],
    ['a removal', remove, '', 'all'],
  ] as const) {
    it(`a card opened and edited while ${gesture} is written stays open and in edit`, async () => {
      await follow('#/contacts/Work');
      const page = await open();
      const release = holdWrites();

      await act(page);
      const ada = page.contacts.find((c: any) => c.path === ADA.path);
      await send(page, 'alps-contacts-list', 'select-contact', { contact: ada });
      await send(page, 'alps-contact-view', 'edit');
      expect(page.selectedContact?.path).toBe(ADA.path);
      expect(page.isEditing).toBe(true);
      release();
      await settle(page);

      expect(window.location.hash).toBe(`#/contacts/${list}/${ADA.uid}`);
      expect(page.selectedCategory).toBe(after);
      expect(page.selectedContact?.path).toBe(ADA.path);
      expect(page.isEditing).toBe(true);
    });

    it(`another category opened while ${gesture} is written is where the user stays`, async () => {
      await follow('#/contacts/Work');
      const page = await open();
      const release = holdWrites();

      await act(page);
      await send(page, 'alps-contacts-categories', 'select-category', { category: CATEGORY_FAVORITES });
      release();
      await settle(page);

      expect(adaCategories, 'the write landed').toEqual(after ? [after] : []);
      expect(window.location.hash).toBe(`#/contacts/${CATEGORY_FAVORITES}`);
      expect(page.selectedCategory).toBe(CATEGORY_FAVORITES);
    });

    for (const [where, address] of [['the category', 'Work'], ['All Contacts', 'all']] as const) {
      it(`a card open in ${where} shows ${gesture} once written, and an edit saved from it keeps it`, async () => {
        await follow(`#/contacts/${address}/${ADA.uid}`);
        const page = await open();
        expect(page.selectedContact?.categories).toEqual(['Work']);
        // The write answers Ada's new version, as the server does.
        vi.mocked(contactsService.bulkUpdateCategories).mockImplementation(async (cards: any[]) => {
          for (const card of cards) if (card.path === ADA.path) adaCategories = card.categories;
          return { total: cards.length, done: cards.length, failed: 0, uncertain: 0, etags: { [ADA.path]: '"2"' } };
        });
        const update = vi.spyOn(contactsService, 'updateContact').mockImplementation(async (_path: string, payload: any) => {
          // An edit that says nothing of the categories leaves the card's.
          if (payload.categories !== undefined) adaCategories = payload.categories;
          return { path: ADA.path, etag: '"3"' };
        });
        const written = after ? [after] : [];

        await act(page);
        expect(window.location.hash).toBe(`#/contacts/${address === 'all' ? 'all' : list}/${ADA.uid}`);
        expect(page.selectedContact?.path).toBe(ADA.path);
        expect(page.selectedContact.categories).toEqual(written);

        // Edit, and a change of name saved from the form.
        await send(page, 'alps-contact-view', 'edit');
        const view = page.shadowRoot!.querySelector('alps-contact-view') as any;
        await send(page, 'alps-contact-view', 'save', { ...view.editForm, name: 'Ada King' });

        expect(update).toHaveBeenCalledTimes(1);
        expect(update.mock.calls[0][1]).toMatchObject({ name: 'Ada King', etag: '"2"' });
        expect(update.mock.calls[0][1]).not.toHaveProperty('categories');
        expect(adaCategories, 'the card on the server').toEqual(written);
        expect(page.selectedContact.categories).toEqual(written);
      });
    }
  }
});

describe('a category kept only on this page, with a new card open in it', () => {
  // The new card is filed under the open category and is not saved, so it
  // has no path and nothing to write. Now that the page moves only once a
  // card has taken the change, counted as a card carrying the category it
  // would be the one card to write: the service would write nothing and
  // report nothing done, and the rename or removal would stop there, with no
  // word said.
  const USER = 'ada@example.test';
  const KEY = `alps_contacts_categories_${USER}`;
  const ownCategories = () => JSON.parse(localStorage.getItem(KEY) || '[]');

  /** Later, kept only in the user's own list, open with a new card in it. */
  async function newCardInLater(): Promise<Page> {
    localStorage.setItem('alps_active_user', USER);
    localStorage.setItem(KEY, JSON.stringify(['Later']));
    await follow('#/contacts/Later');
    const page = await open();
    await send(page, 'alps-contacts-categories', 'create-contact');
    expect(page.selectedContact?.isTemporary).toBe(true);
    expect(page.selectedContact.categories).toEqual(['Later']);
    return page;
  }

  /** The service's own bulk write, over a stubbed write of one card. */
  const realBulkWrite = () => {
    vi.mocked(contactsService.bulkUpdateCategories).mockRestore();
    return vi.spyOn(contactsService, 'updateCategories').mockResolvedValue({ ok: 'true', path: '' });
  };

  afterEach(() => {
    localStorage.removeItem('alps_active_user');
    localStorage.removeItem(KEY);
  });

  it('is renamed at once', async () => {
    const page = await newCardInLater();
    const write = realBulkWrite();

    await send(page, 'alps-contacts-categories', 'rename-category', { category: 'Later' });
    await send(page, 'ui-prompt', 'submit', { name: 'Soon' });

    expect(write).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/contacts/Soon');
    expect(page.selectedCategory).toBe('Soon');
    expect(page.addedCategories).toEqual(['Soon']);
    expect(ownCategories()).toEqual(['Soon']);
  });

  it('is removed at once', async () => {
    const page = await newCardInLater();
    const write = realBulkWrite();

    await send(page, 'alps-contacts-categories', 'delete-category', { category: 'Later' });
    await send(page, 'ui-confirm', 'confirm');

    expect(write).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/contacts/all');
    expect(page.selectedCategory).toBe('');
    expect(page.addedCategories).toEqual([]);
    expect(ownCategories()).toEqual([]);
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
