/**
 * A contact written after another device deleted it.
 *
 * An edit and a category change each read the card before writing it, and a
 * card deleted elsewhere since the page read it answered 500. The autosave
 * took that for a write that may have happened and told the user to refresh;
 * a star counted it as unconfirmed. The server now answers 404, and the page
 * says the contact was deleted on another device, takes it out of the list,
 * and keeps an open form as typed until the edit is cancelled.
 *
 * The page is driven through its handlers on an element that is never
 * connected, with the service stubbed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/carddav/frontend/contacts-page';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { CATEGORY_FAVORITES } from '../../plugins/carddav/frontend/constants';
import { HttpStatusError } from '../src/utils/fetch-utils';
import { cleanup, record } from './helpers/dom';

type Page = HTMLElement & Record<string, any>;

const gone = () => new HttpStatusError(404, 'Not Found');
const grace = () => ({ path: '/book/grace.vcf', uid: 'uG', name: 'Grace', email: 'grace@example.test', categories: [] as string[], etag: 'v1' });
const ada = () => ({ path: '/book/ada.vcf', uid: 'uA', name: 'Ada', email: 'ada@example.test', categories: [] as string[], etag: 'a1' });

let errors: ReturnType<typeof vi.spyOn>;
let listReads: ReturnType<typeof vi.spyOn>;

function contactsPage(open: any, editing: boolean): Page {
  const el = document.createElement('contacts-page') as Page;
  el.i18nStore = { t: (key: string) => key };
  el.contacts = [open, ada()];
  el.selectedContact = open;
  el.selectedContacts = new Set();
  el.isEditing = editing;
  listReads = vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
  return el;
}

const messages = (toasts: CustomEvent[]) => toasts.map((t) => t.detail.message);

beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  history.replaceState(null, '', '#/contacts/all/uG');
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  history.replaceState(null, '', '#/');
});

describe('an edit of a contact deleted elsewhere', () => {
  it('says so once, keeps the form as typed, and sends nothing more', async () => {
    const el = contactsPage(grace(), true);
    const toasts = record<CustomEvent>(window, 'show-toast');
    const update = vi.spyOn(contactsService, 'updateContact').mockRejectedValue(gone());

    await el.handleSave({ path: '/book/grace.vcf', name: 'Grace Hopper', categories: '' });
    await el.handleSave({ path: '/book/grace.vcf', name: 'Grace Brewster Hopper', categories: '' });

    expect(update).toHaveBeenCalledTimes(1);
    expect(messages(toasts)).toEqual(['contacts.editDeletedElsewhere']);
    // The form stays open over what was typed; only the list lets the card go.
    expect(el.isEditing).toBe(true);
    expect(el.selectedContact?.path).toBe('/book/grace.vcf');
    expect(el.contacts.map((c: any) => c.path)).toEqual(['/book/ada.vcf']);
    expect(listReads).toHaveBeenCalled();
    expect(el.saving).toBe(false);
    expect(errors).not.toHaveBeenCalled();
  });

  it('closes the card when the edit is cancelled, without reading it again', async () => {
    const el = contactsPage(grace(), true);
    vi.spyOn(contactsService, 'updateContact').mockRejectedValue(gone());
    const reread = vi.spyOn(contactsService, 'fetchContact');
    await el.handleSave({ path: '/book/grace.vcf', name: 'Grace Hopper', categories: '' });

    el.handleCancelEdit();

    expect(el.isEditing).toBe(false);
    expect(el.selectedContact).toBeNull();
    expect(window.location.hash).toBe('#/contacts/all');
    expect(reread).not.toHaveBeenCalled();
  });

  it('is told of a card missing from the list read after an unanswered save', async () => {
    const el = contactsPage(grace(), true);
    const toasts = record<CustomEvent>(window, 'show-toast');
    vi.spyOn(contactsService, 'updateContact').mockRejectedValue(new HttpStatusError(502, 'Bad Gateway'));
    vi.spyOn(contactsService, 'fetchContacts').mockResolvedValue({ contacts: [ada()] });

    await el.handleSave({ path: '/book/grace.vcf', name: 'Grace Hopper', categories: '' });

    expect(messages(toasts)).toEqual(['contacts.updateOneUnconfirmed', 'contacts.editDeletedElsewhere']);
    expect(el.isEditing).toBe(true);
    expect(el.selectedContact?.name).toBe('Grace');
  });
});

describe('a star on a contact deleted elsewhere', () => {
  it('in the list says it was deleted, and takes the row out', async () => {
    const open = ada();
    const el = contactsPage(open, false);
    el.contacts = [grace(), open];
    const toasts = record<CustomEvent>(window, 'show-toast');
    vi.spyOn(contactsService, 'updateCategories').mockRejectedValue(gone());

    await el.handleToggleStar(new Event(''), el.contacts[0]);

    expect(messages(toasts)).toEqual(['contacts.deletedElsewhere']);
    expect(el.contacts.map((c: any) => c.path)).toEqual(['/book/ada.vcf']);
    expect(el.selectedContact?.path).toBe('/book/ada.vcf');
    expect(listReads).toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  });

  it('on the open card closes it', async () => {
    const el = contactsPage(grace(), false);
    const toasts = record<CustomEvent>(window, 'show-toast');
    vi.spyOn(contactsService, 'updateCategories').mockRejectedValue(gone());

    await el.handleToggleStarEvent();

    expect(messages(toasts)).toEqual(['contacts.deletedElsewhere']);
    expect(el.selectedContact).toBeNull();
    expect(window.location.hash).toBe('#/contacts/all');
    expect(el.contacts.map((c: any) => c.path)).toEqual(['/book/ada.vcf']);
  });

  it('across a selection counts the deleted apart from the refused, and keeps the rest', async () => {
    const el = contactsPage(grace(), false);
    el.selectedContacts = new Set(['/book/grace.vcf', '/book/ada.vcf']);
    const toasts = record<CustomEvent>(window, 'show-toast');
    vi.spyOn(contactsService, 'updateCategories').mockImplementation(async (path: string) => {
      if (path === '/book/grace.vcf') throw gone();
      return { ok: 'true', path, etag: 'a2' };
    });

    await el.handleToggleStarEvent();

    expect(messages(toasts)).toEqual(['contacts.deletedElsewhereCount']);
    expect(el.contacts.map((c: any) => [c.path, c.etag, c.categories])).toEqual([['/book/ada.vcf', 'a2', [CATEGORY_FAVORITES]]]);
    expect([...el.selectedContacts]).toEqual(['/book/ada.vcf']);
  });
});

describe('a category set on a contact deleted elsewhere', () => {
  it('says it was deleted, and closes the open card', async () => {
    const el = contactsPage(grace(), false);
    const toasts = record<CustomEvent>(window, 'show-toast');
    vi.spyOn(contactsService, 'updateCategories').mockRejectedValue(gone());

    await el.handleUpdateCategories(new CustomEvent('update-categories', { detail: { category: 'Friends' } }));

    expect(messages(toasts)).toEqual(['contacts.deletedElsewhere']);
    expect(el.selectedContact).toBeNull();
    expect(el.contacts.map((c: any) => c.path)).toEqual(['/book/ada.vcf']);
  });
});
