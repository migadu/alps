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

  it('clears the selection and re-reads when any card went', async () => {
    const el = page([card('a'), card('b')], ['a', 'b']);
    const reread = vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
    vi.spyOn(contactsService, 'bulkDeleteContacts').mockResolvedValue({ total: 2, done: 1, failed: 1 });

    await el.confirmDelete();

    expect(el.selectedContacts.size).toBe(0);
    expect(reread).toHaveBeenCalledTimes(1);
  });
});

describe('the bulk outcome', () => {
  it('counts what was written as well as what was refused', async () => {
    vi.spyOn(contactsService, 'deleteContact')
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('refused'))
      .mockResolvedValueOnce(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await contactsService.bulkDeleteContacts(['a', 'b', 'c'])).toEqual({ total: 3, done: 2, failed: 1 });
  });
});
