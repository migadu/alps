/**
 * A star or delete across contacts that the server refuses, wholly or in part.
 *
 * The page's handlers are called on an element that is never connected, with
 * the service stubbed, so what is checked is what each outcome leaves on screen.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/carddav/frontend/contacts-page';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { CATEGORY_FAVORITES } from '../../plugins/carddav/frontend/constants';
import { HttpStatusError, outcomeUnknown } from '../src/utils/fetch-utils';
import { I18nStore } from '../src/store/i18n-store';

type Page = HTMLElement & Record<string, any>;

const card = (path: string, categories: string[] = []) => ({ path, name: path, email: `${path}@example.test`, categories });

function page(contacts: any[], selected: string[] = [], open: any = null): Page {
  const el = document.createElement('contacts-page') as Page;
  el.contacts = contacts;
  el.selectedContacts = new Set(selected);
  el.selectedContact = open;
  return el;
}

afterEach(() => vi.restoreAllMocks());

describe('starring contacts', () => {
  it('puts both panes back at once when no card took the star', async () => {
    const el = page([card('a'), card('b')], ['a', 'b']);
    el.selectedContact = null;
    const reread = vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 2, done: 0, failed: 2 });

    await el.handleToggleStarEvent();

    expect(el.contacts.map((c: any) => c.categories)).toEqual([[], []]);
    expect(reread).not.toHaveBeenCalled();
  });

  it('reverts the open card too', async () => {
    const open = card('a');
    const el = page([open], [], open);
    vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 1, done: 0, failed: 1 });

    await el.handleToggleStarEvent();

    expect(el.selectedContact.categories).toEqual([]);
    expect(el.contacts[0].categories).toEqual([]);
  });

  it('re-reads when some cards took the star, rather than un-starring them', async () => {
    const el = page([card('a'), card('b')], ['a', 'b']);
    const reread = vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 2, done: 1, failed: 1 });

    await el.handleToggleStarEvent();

    expect(reread).toHaveBeenCalledTimes(1);
    expect(el.contacts.map((c: any) => c.categories)).toEqual([[CATEGORY_FAVORITES], [CATEGORY_FAVORITES]]);
  });

  it('keeps the star when every card took it', async () => {
    const el = page([card('a')], ['a']);
    const reread = vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 1, done: 1, failed: 0 });

    await el.handleToggleStarEvent();

    expect(el.contacts[0].categories).toEqual([CATEGORY_FAVORITES]);
    expect(reread).not.toHaveBeenCalled();
  });
});

describe('deleting contacts', () => {
  it('keeps the selection and the list when nothing was deleted', async () => {
    const el = page([card('a'), card('b')], ['a', 'b']);
    const reread = vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
    vi.spyOn(contactsService, 'bulkDeleteContacts').mockResolvedValue({ total: 2, done: 0, failed: 2 });

    await el.confirmDelete();

    expect([...el.selectedContacts]).toEqual(['a', 'b']);
    expect(reread).not.toHaveBeenCalled();
  });

  it('keeps a selection built while the delete was on its way', async () => {
    // The open card was the target. The user ticked another while the request
    // was out, and the answer used to clear that too.
    const open = card('a');
    const el = page([open, card('b')], [], open);
    vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
    let answer!: (outcome: any) => void;
    vi.spyOn(contactsService, 'bulkDeleteContacts').mockReturnValue(new Promise(resolve => { answer = resolve; }));

    const deleting = el.confirmDelete();
    el.selectedContacts = new Set(['b']);
    answer({ total: 1, done: 1, failed: 0, deletedPaths: ['a'] });
    await deleting;

    expect(el.selectedContact).toBeNull();
    expect([...el.selectedContacts]).toEqual(['b']);
  });

  it('clears the selection and re-reads when any card went', async () => {
    const el = page([card('a'), card('b')], ['a', 'b']);
    const reread = vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
    vi.spyOn(contactsService, 'bulkDeleteContacts').mockResolvedValue({ total: 2, done: 1, failed: 1 });

    await el.confirmDelete();

    expect(el.selectedContacts.size).toBe(0);
    expect(reread).toHaveBeenCalledTimes(1);
  });
});

describe('a search that narrowed the list', () => {
  // The search kept the open card and the ticked ones, which need not be among
  // its matches. The gestures looked only in the matches, so on such a card
  // they wrote nothing and said nothing.
  const ada = card('ada', ['Friends']);
  const bob = card('bob');

  /** Searched for "bob": the list holds Bob, the whole book both. */
  function searched(selected: string[] = [], open: any = null): Page {
    const el = page([{ ...bob }], selected, open);
    el.filterQuery = 'bob';
    el.loadedQuery = 'bob';
    el.wholeBook = [{ ...ada }, { ...bob }];
    vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
    return el;
  }

  it('files the open card into a category', async () => {
    const el = searched([], { ...ada });
    const write = vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 1, done: 1, failed: 0 });

    await el.handleUpdateCategories(new CustomEvent('update-categories', { detail: { category: 'Work' } }));

    expect(write).toHaveBeenCalledWith([expect.objectContaining({ path: 'ada', categories: ['Friends', 'Work'] })]);
    expect(el.selectedContact.categories).toEqual(['Friends', 'Work']);
  });

  it('stars the open card, and the sidebar counts it', async () => {
    const el = searched([], { ...ada });
    const write = vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 1, done: 1, failed: 0 });

    await el.handleToggleStarEvent();

    expect(write).toHaveBeenCalledWith([expect.objectContaining({ path: 'ada', categories: ['Friends', CATEGORY_FAVORITES] })]);
    expect(el.selectedContact.categories).toEqual(['Friends', CATEGORY_FAVORITES]);
    expect(el.allContacts.find((c: any) => c.path === 'ada').categories).toContain(CATEGORY_FAVORITES);
  });

  it('says so when the open card refused the star', async () => {
    const el = searched([], { ...ada });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(contactsService, 'bulkUpdateCategories')
      .mockImplementation(async cards => ({ total: cards.length, done: 0, failed: cards.length }));
    const toasts: CustomEvent[] = [];
    const onToast = (e: Event) => toasts.push(e as CustomEvent);
    window.addEventListener('show-toast', onToast);

    await el.handleToggleStarEvent();
    window.removeEventListener('show-toast', onToast);

    expect(toasts).toHaveLength(1);
    expect(el.selectedContact.categories).toEqual(['Friends']);
  });

  it('knows whether ticked cards outside the matches are starred', () => {
    const el = searched(['ada', 'bob']);
    el.wholeBook = [card('ada', [CATEGORY_FAVORITES]), card('bob', [CATEGORY_FAVORITES])];
    el.contacts = [card('bob', [CATEGORY_FAVORITES])];
    expect(el.allSelectedStarred).toBe(true);
  });
});

describe('a write whose outcome is unknown', () => {
  // A timeout, a lost connection or a 5xx says nothing about what the server
  // did. The page rolled every such failure back as if it were a refusal, so
  // a star or a delete that was made behind a lost response showed undone
  // until the next read of the list.
  const lost = () => new TypeError('Failed to fetch');
  const refused = () => new HttpStatusError(403, 'Forbidden');

  for (const [name, failure, rereads] of [['lost', lost, true], ['refused', refused, false]] as const) {
    it(`a single star, ${name}: ${rereads ? 're-reads the card and shows what was stored' : 'keeps the rollback without a read'}`, async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const open = card('a');
      const el = page([open], [], { ...open });
      vi.spyOn(contactsService, 'updateCategories').mockRejectedValue(failure());
      const reread = vi.spyOn(contactsService, 'fetchContact').mockResolvedValue({ ...open, categories: [CATEGORY_FAVORITES], etag: 'v2' });

      await el.handleToggleStar(new Event('click'), open);
      await vi.waitFor(() => expect(reread).toHaveBeenCalledTimes(rereads ? 1 : 0));
      await Promise.resolve();

      expect(el.contacts[0].categories.includes(CATEGORY_FAVORITES)).toBe(rereads);
      expect(el.selectedContact.categories.includes(CATEGORY_FAVORITES)).toBe(rereads);
      if (rereads) expect(el.contacts[0].etag).toBe('v2');
    });
  }

  it('a single star: a re-read overtaken by a newer change to the card is dropped', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const open = card('a');
    const el = page([open]);
    vi.spyOn(contactsService, 'updateCategories').mockRejectedValue(lost());
    let answer!: (stored: any) => void;
    vi.spyOn(contactsService, 'fetchContact').mockReturnValue(new Promise(resolve => { answer = resolve; }));

    await el.handleToggleStar(new Event('click'), open);
    el.contacts = [{ ...open, categories: ['Work'] }];
    answer({ ...open, categories: [CATEGORY_FAVORITES] });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(el.contacts[0].categories).toEqual(['Work']);
  });

  it('a star across cards that may have been written re-reads after the rollback', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const el = page([card('a'), card('b')], ['a', 'b']);
    const reread = vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 2, done: 0, failed: 2, uncertain: 1 });

    await el.handleToggleStarEvent();

    expect(el.contacts.map((c: any) => c.categories)).toEqual([[], []]);
    expect(reread).toHaveBeenCalledTimes(1);
  });

  it('a delete re-reads, and lets go of only the cards that went', async () => {
    const el = page([card('a'), card('b')], ['a', 'b']);
    const reread = vi.spyOn(el, 'fetchContacts').mockImplementation(async () => { el.contacts = [card('b')]; });
    vi.spyOn(contactsService, 'bulkDeleteContacts').mockResolvedValue({ total: 2, done: 0, failed: 2, uncertain: 2 });

    await el.confirmDelete();

    expect(reread).toHaveBeenCalledTimes(1);
    expect([...el.selectedContacts]).toEqual(['b']);
  });

  it('a delete whose re-read fails too keeps the selection and the open card', async () => {
    const open = card('a');
    const el = page([open], [], { ...open });
    vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
    vi.spyOn(contactsService, 'bulkDeleteContacts').mockResolvedValue({ total: 1, done: 0, failed: 1, uncertain: 1 });

    await el.confirmDelete();

    expect(el.selectedContact?.path).toBe('a');
  });
});

describe('the bulk outcome', () => {
  it('counts what was written as well as what was refused, and what may have been written', async () => {
    vi.spyOn(contactsService, 'deleteContact')
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new HttpStatusError(403, 'refused'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await contactsService.bulkDeleteContacts(['a', 'b', 'c', 'd'])).toEqual({
      total: 4, done: 2, failed: 2, uncertain: 1, deletedPaths: ['a', 'd'],
    });
  });

  it('tells a refusal from a failure that says nothing of what was done', () => {
    expect(outcomeUnknown(new HttpStatusError(403, 'Forbidden'))).toBe(false);
    expect(outcomeUnknown(new HttpStatusError(412, 'Precondition Failed'))).toBe(false);
    expect(outcomeUnknown(new HttpStatusError(408, 'Request Timeout'))).toBe(true);
    expect(outcomeUnknown(new HttpStatusError(500, 'Internal Server Error'))).toBe(true);
    expect(outcomeUnknown(new TypeError('Failed to fetch'))).toBe(true);
    expect(outcomeUnknown(new DOMException('The operation was aborted.', 'AbortError'))).toBe(true);
  });

  it('keeps the status of a refused delete', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 403, statusText: 'Forbidden' })));
    try {
      await expect(contactsService.deleteContact('a')).rejects.toMatchObject({ status: 403 });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

/**
 * What the refusal toast says. The counts went in as {failed} and {total},
 * and the noun beside them could only be right for one number. Then the total
 * picked the plural form, but the subject of the sentence is the number that
 * failed, and the verb agrees with it: one card of five "konnte" not be
 * deleted in German, where the toast said "konnten". So the failed number is
 * the plural key's {count}, each language words "of {total}" so that nothing
 * has to agree with it, and a write aimed at one card says so without "1 of
 * 1". One path passed no numbers at all and showed the placeholders themselves.
 */
describe('the refusal toast', () => {
  async function toastFrom(language: string, act: (el: Page) => Promise<void>, contacts = [card('a'), card('b')]) {
    const el = page(contacts, contacts.map((c) => c.path));
    el.i18nStore = new I18nStore();
    await el.i18nStore.setLanguage(language);
    vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
    const shown: string[] = [];
    const listen = (e: Event) => shown.push((e as CustomEvent).detail.message);
    window.addEventListener('show-toast', listen);
    try {
      await act(el);
    } finally {
      window.removeEventListener('show-toast', listen);
    }
    return shown;
  }

  const five = () => ['a', 'b', 'c', 'd', 'e'].map((path) => card(path, ['Work']));

  it('counts a partial delete', async () => {
    vi.spyOn(contactsService, 'bulkDeleteContacts').mockResolvedValue({ total: 2, done: 1, failed: 1 });
    expect(await toastFrom('en', (el) => el.confirmDelete())).toEqual(['1 of 2 contacts could not be deleted.']);
  });

  it('agrees with the number that failed, not with the total', async () => {
    const delete1of5 = vi.spyOn(contactsService, 'bulkDeleteContacts').mockResolvedValue({ total: 5, done: 4, failed: 1 });
    expect(await toastFrom('de', (el) => el.confirmDelete(), five())).toEqual(['1 von 5 Kontakten konnte nicht gelöscht werden.']);
    expect(await toastFrom('es', (el) => el.confirmDelete(), five())).toEqual(['No se pudo eliminar 1 de 5 contactos.']);
    delete1of5.mockResolvedValue({ total: 5, done: 3, failed: 2 });
    expect(await toastFrom('de', (el) => el.confirmDelete(), five())).toEqual(['2 von 5 Kontakten konnten nicht gelöscht werden.']);
  });

  it('agrees with the number that failed on a category rename, removal or update too', async () => {
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 5, done: 4, failed: 1 });
    const shown = [
      ...await toastFrom('de', (el) => {
        el.categoryToRename = 'Work';
        return el.handleRenameCategorySubmit(new CustomEvent('x', { detail: { name: 'Office' } }));
      }, five()),
      ...await toastFrom('de', (el) => {
        el.categoryToDelete = 'Work';
        return el.handleDeleteCategorySubmit();
      }, five()),
      ...await toastFrom('de', (el) => el.handleUpdateCategories(new CustomEvent('x', { detail: { category: 'Home' } })), five()),
    ];
    expect(shown).toEqual([
      '1 von 5 Kontakten konnte nicht aktualisiert werden, die Kategorie wurde nur teilweise umbenannt.',
      '1 von 5 Kontakten konnte nicht aktualisiert werden, die Kategorie wurde nur teilweise entfernt.',
      '1 von 5 Kontakten konnte nicht aktualisiert werden.',
    ]);
  });

  it('agrees in Serbian with each of the three forms of the number that failed', async () => {
    const outcome = vi.spyOn(contactsService, 'bulkDeleteContacts');
    const shown: string[] = [];
    for (const failed of [1, 2, 5]) {
      outcome.mockResolvedValue({ total: 5, done: 5 - failed, failed });
      shown.push(...await toastFrom('sr', (el) => el.confirmDelete(), five()));
    }
    expect(shown).toEqual([
      'Nije bilo moguće obrisati 1 kontakt od ukupno 5.',
      'Nije bilo moguće obrisati 2 kontakta od ukupno 5.',
      'Nije bilo moguće obrisati 5 kontakata od ukupno 5.',
    ]);
  });

  it('says a failure on the one card a write was aimed at without "1 of 1"', async () => {
    vi.spyOn(contactsService, 'bulkDeleteContacts').mockResolvedValue({ total: 1, done: 0, failed: 1 });
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 1, done: 0, failed: 1 });
    const one = () => [card('a', ['Work'])];
    const shown = [
      ...await toastFrom('en', (el) => el.confirmDelete(), one()),
      ...await toastFrom('en', (el) => el.handleUpdateCategories(new CustomEvent('x', { detail: { category: 'Home' } })), one()),
      ...await toastFrom('en', (el) => {
        el.categoryToRename = 'Work';
        return el.handleRenameCategorySubmit(new CustomEvent('x', { detail: { name: 'Office' } }));
      }, one()),
      ...await toastFrom('en', (el) => {
        el.categoryToDelete = 'Work';
        return el.handleDeleteCategorySubmit();
      }, one()),
    ];
    expect(shown).toEqual([
      'The contact could not be deleted.',
      'The contact could not be updated.',
      'A contact could not be updated, so the category was only partly renamed.',
      'A contact could not be updated, so the category was only partly removed.',
    ]);
  });

  it('says a rename that could not read the address book without counting cards', async () => {
    // During a search the cards carrying the category are read from the
    // server, and when that read fails there is nothing to count.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(contactsService, 'fetchContacts').mockRejectedValue(new Error('offline'));
    const shown = await toastFrom('en', (el) => {
      el.filterQuery = 'a';
      el.categoryToRename = 'Work';
      return el.handleRenameCategorySubmit(new CustomEvent('x', { detail: { name: 'Office' } }));
    }, [card('a', ['Work'])]);
    expect(shown).toEqual(['A contact could not be updated, so the category was only partly renamed.']);
  });

  it('counts the contacts a star across a selection could not update', async () => {
    // The page passed the numbers, but the message was the one-contact
    // sentence in every language.
    const outcome = vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 5, done: 3, failed: 2 });
    expect(await toastFrom('en', (el) => el.handleToggleStarEvent(), five())).toEqual(['2 of 5 contacts could not be updated.']);
    outcome.mockResolvedValue({ total: 5, done: 4, failed: 1 });
    expect(await toastFrom('de', (el) => el.handleToggleStarEvent(), five())).toEqual(['1 von 5 Kontakten konnte nicht aktualisiert werden.']);
    outcome.mockResolvedValue({ total: 5, done: 3, failed: 2 });
    expect(await toastFrom('sr', (el) => el.handleToggleStarEvent(), five())).toEqual(['Nije bilo moguće ažurirati 2 kontakta od ukupno 5.']);
  });

  it('says a star the one card it was aimed at refused without "1 of 1"', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 1, done: 0, failed: 1 });
    vi.spyOn(contactsService, 'updateCategories').mockRejectedValue(new HttpStatusError(412, 'changed elsewhere'));
    const shown = [
      ...await toastFrom('en', (el) => el.handleToggleStarEvent(), [card('a')]),
      // The star on a row of the list.
      ...await toastFrom('en', (el) => el.handleToggleStar(new Event('click'), el.contacts[0]), [card('a')]),
    ];
    expect(shown).toEqual(['The contact could not be updated.', 'The contact could not be updated.']);
  });

  it('names the numbers when a star across a selection fails outright', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockRejectedValue(new Error('offline'));
    expect(await toastFrom('en', (el) => el.handleToggleStarEvent())).toEqual(['2 of 2 contacts could not be updated.']);
  });

  it('names the numbers when a category change fails outright', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockRejectedValue(new Error('offline'));
    const shown = await toastFrom('en', (el) => el.handleUpdateCategories(new CustomEvent('x', { detail: { category: 'Work' } })));
    expect(shown).toEqual(['2 of 2 contacts could not be updated.']);
  });
});
