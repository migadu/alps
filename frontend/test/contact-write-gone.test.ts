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
  localStorage.removeItem('alps_active_user');
  history.replaceState(null, '', '#/');
});

describe('an edit of a contact deleted elsewhere', () => {
  it('ignores an old form debounce flushed after navigating away from the missing card', async () => {
    const el = contactsPage(grace(), true);
    const source = el.selectedContact;
    const update = vi.spyOn(contactsService, 'updateContact');
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 1, done: 0, failed: 1, gonePaths: [source.path] });
    await el.handleToggleStarEvent();
    vi.spyOn(contactsService, 'fetchContact').mockResolvedValue(ada());
    await el.selectContact(ada(), false);

    await el.handleSave({ ...source, name: 'Old form still typing' }, source);

    expect(update).not.toHaveBeenCalled();
  });

  it('does not put back an older successful save after the toolbar found its card deleted', async () => {
    const el = contactsPage(grace(), true);
    let finish!: (saved: any) => void;
    vi.spyOn(contactsService, 'updateContact').mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const saving = el.handleSave({ ...el.selectedContact, name: 'Grace Hopper' });
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 1, done: 0, failed: 1, gonePaths: ['/book/grace.vcf'] });
    await el.handleToggleStarEvent();
    finish({ ok: 'true', path: '/book/grace.vcf', etag: 'v2' });
    await saving;

    expect(el.contacts.map((c: any) => c.path)).toEqual(['/book/ada.vcf']);
    expect(el.isEditing).toBe(true);
  });

  it('does not send its queued autosave after a toolbar action found the card gone', async () => {
    const el = contactsPage(ada(), true);
    el.contacts = [grace(), ada()];
    let finish!: (saved: any) => void;
    const update = vi.spyOn(contactsService, 'updateContact')
      .mockReturnValueOnce(new Promise(resolve => { finish = resolve; }))
      .mockRejectedValue(gone());
    const saving = el.handleSave({ ...el.selectedContact, name: 'Ada Lovelace' });
    el.selectedContact = el.contacts[0];
    await el.handleSave({ ...el.selectedContact, name: 'Grace Hopper' });
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 1, done: 0, failed: 1, gonePaths: ['/book/grace.vcf'] });
    await el.handleToggleStarEvent();
    vi.spyOn(contactsService, 'fetchContact').mockResolvedValue(ada());
    await el.selectContact(ada(), false);
    finish({ ok: 'true', path: '/book/ada.vcf', etag: 'a2' });
    await saving;

    expect(update.mock.calls.map(([path]) => path)).toEqual(['/book/ada.vcf']);
  });

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
  it('leaves a different card opened and edited while its result waited', async () => {
    const el = contactsPage(grace(), false);
    let finish!: (outcome: any) => void;
    vi.spyOn(contactsService, 'bulkUpdateCategories').mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const starring = el.handleToggleStarEvent();
    const current = { ...ada(), name: 'Typed on Ada' };
    el.selectedContact = current;
    el.isEditing = true;
    finish({ total: 1, done: 0, failed: 1, uncertain: 0, gonePaths: ['/book/grace.vcf'] });
    await starring;

    expect(el.selectedContact).toBe(current);
    expect(el.isEditing).toBe(true);
    expect(el.gonePath).not.toBe('/book/ada.vcf');
  });

  it('ignores a missing-card result from the previous account', async () => {
    const el = contactsPage(grace(), false);
    let refuse!: (error: unknown) => void;
    vi.spyOn(contactsService, 'updateCategories').mockReturnValue(new Promise((_, reject) => { refuse = reject; }));
    const toasts = record<CustomEvent>(window, 'show-toast');
    const starring = el.handleToggleStar(new Event(''), el.selectedContact);
    localStorage.setItem('alps_active_user', 'another@example.test');
    refuse(gone());
    await starring;

    expect(toasts).toHaveLength(0);
    expect(listReads).not.toHaveBeenCalled();
    expect(el.selectedContact?.path).toBe('/book/grace.vcf');
  });

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

describe('toolbar results that outlive their account', () => {
  it.each(['star', 'category', 'rename category', 'delete category'])('ignores the old %s result', async (action) => {
    const el = contactsPage({ ...grace(), categories: ['Friends'] }, false);
    let finish!: (outcome: any) => void;
    const bulk = vi.spyOn(contactsService, 'bulkUpdateCategories').mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const toasts = record<CustomEvent>(window, 'show-toast');
    let writing: Promise<void>;
    if (action === 'star') writing = el.handleToggleStarEvent();
    else if (action === 'category') writing = el.handleUpdateCategories(new CustomEvent('x', { detail: { category: 'Work' } }));
    else if (action === 'rename category') {
      el.categoryToRename = 'Friends';
      writing = el.handleRenameCategorySubmit(new CustomEvent('x', { detail: { name: 'Work' } }));
    } else {
      el.categoryToDelete = 'Friends';
      writing = el.handleDeleteCategorySubmit();
    }
    await vi.waitFor(() => expect(bulk).toHaveBeenCalledTimes(1));
    localStorage.setItem('alps_active_user', 'another@example.test');
    const current = { ...grace(), name: 'Another account card' };
    el.selectedContact = current;
    el.contacts = [current];
    finish({ total: 1, done: 0, failed: 1, gonePaths: [current.path] });
    await writing!;

    expect(el.selectedContact).toBe(current);
    expect(el.contacts).toEqual([current]);
    expect(toasts).toHaveLength(0);
    expect(listReads).not.toHaveBeenCalled();
  });
});

describe('the card read again after cancelling a conflict', () => {
  it.each(['disconnect', 'account change', 'stored identity'])('ignores the late missing-card read after %s', async (ending) => {
    const el = contactsPage(grace(), false);
    let refuse!: (error: unknown) => void;
    vi.spyOn(contactsService, 'fetchContact').mockReturnValue(new Promise((_, reject) => { refuse = reject; }));
    const toasts = record<CustomEvent>(window, 'show-toast');
    const rereading = el.rereadOpenContact();
    if (ending === 'disconnect') el.disconnectedCallback();
    else if (ending === 'account change') el.handleSaveOwnerChange();
    else localStorage.setItem('alps_active_user', 'another@example.test');
    refuse(gone());
    await rereading;

    expect(toasts).toHaveLength(0);
    expect(listReads).not.toHaveBeenCalled();
    expect(el.selectedContact?.path).toBe('/book/grace.vcf');
  });

  it('leaves a reopened form alone when the old read finds it missing', async () => {
    const el = contactsPage(grace(), false);
    let refuse!: (error: unknown) => void;
    vi.spyOn(contactsService, 'fetchContact')
      .mockReturnValueOnce(new Promise((_, reject) => { refuse = reject; }))
      .mockResolvedValueOnce(ada())
      .mockResolvedValueOnce(grace());
    const rereading = el.rereadOpenContact();
    await el.selectContact(ada(), false);
    await el.selectContact(grace(), false);
    el.isEditing = true;
    const current = el.selectedContact;
    refuse(gone());
    await rereading;

    expect(el.selectedContact).toBe(current);
    expect(el.isEditing).toBe(true);
  });
});
