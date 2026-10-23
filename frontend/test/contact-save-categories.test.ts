/**
 * What a save of the contact editor says about the card's categories, and
 * about a field it had cleared.
 *
 * The editor has no field for categories: the toolbar's star and category
 * picker write them on their own. But the form held the categories it was
 * opened with, joined into one string, and every save sent them back, split at
 * their commas. A star made while editing was put back by the next keystroke,
 * and a category whose name held a comma became two.
 */
import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ContextProvider } from '@lit/context';
import { i18nContext, type I18nStore } from '../src/store/i18n-store';
import '../../plugins/carddav/frontend/contacts-page';
import '../../plugins/carddav/frontend/contact-view';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { cleanup, flush, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en', addEventListener() {}, removeEventListener() {} };
const card = { path: '/book/grace.vcf', uid: 'uG', name: 'Grace Hopper', email: 'grace@example.test', etag: 'v1', categories: ['Navy'], url: 'https://work.example' };

beforeEach(() => {
  vi.spyOn(contactsService, 'fetchContacts').mockResolvedValue({ contacts: [card] } as any);
  vi.spyOn(contactsService, 'fetchContact').mockResolvedValue({ ...card });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  history.replaceState(null, '', '#/contacts/all');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  history.replaceState(null, '', '#/');
});

// The page fades its first-load spinner on a timer that outlives it.
afterAll(() => new Promise<void>((resolve) => setTimeout(resolve, 150)));

async function settle(el: El, ticks = 8): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    await flush();
    await el.updateComplete;
  }
}

async function contactsPage(): Promise<El> {
  // The page's own components take their labels from the context.
  const root = document.createElement('div');
  new ContextProvider(root, { context: i18nContext, initialValue: i18nStore as unknown as I18nStore });
  document.body.appendChild(root);
  const el = document.createElement('contacts-page') as El;
  root.appendChild(el);
  await settle(el);
  return el;
}

function view(el: El): El {
  return el.shadowRoot!.querySelector('alps-contact-view') as El;
}

async function toolbarButton(el: El, title: string): Promise<El> {
  await view(el).updateComplete;
  return Array.from(view(el).shadowRoot!.querySelectorAll('alps-icon-btn')).find((b) => (b as El).title === title) as El;
}

async function type(el: El, placeholder: string, value: string): Promise<void> {
  await view(el).updateComplete;
  const host = Array.from(view(el).shadowRoot!.querySelectorAll('alps-input')).find((f) => (f as El).placeholder === placeholder) as El;
  await host.updateComplete;
  const input = host.shadowRoot!.querySelector('input')!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await settle(el);
}

it('leaves the categories to the toolbar, so a star made while editing stays', async () => {
  vi.spyOn(contactsService, 'bulkUpdateCategories').mockResolvedValue({ total: 1, done: 1, failed: 0, uncertain: 0, etags: { [card.path]: 'v2' } } as any);
  const edit = vi.spyOn(contactsService, 'updateContact').mockResolvedValue({ ok: 'true', path: card.path, etag: 'v3' });
  const el = await contactsPage();
  await el.selectContact(el.contacts[0], false);
  await settle(el);
  (await toolbarButton(el, 'contacts.editContact')).click();
  await settle(el);

  (await toolbarButton(el, 'contacts.toggleStar')).click();
  await settle(el);
  await type(el, 'contacts.nickname', 'Amazing Grace');
  await waitFor(() => edit.mock.calls.length > 0, 'the autosave', 2000);

  const sent = edit.mock.calls[0][1];
  expect(sent).toMatchObject({ nickname: 'Amazing Grace', etag: 'v2' });
  expect(sent).not.toHaveProperty('categories');
  expect(el.selectedContact.categories).toEqual(['Navy', 'Favorites']);
});

it('creates a contact in a category whose name holds a comma', async () => {
  const create = vi.spyOn(contactsService, 'createContact').mockResolvedValue({ ok: 'true', path: '/book/new.vcf', etag: 'v1' });
  const el = await contactsPage();
  el.selectedCategory = 'Clients, EMEA';
  el.handleCreateNew();
  await settle(el);
  await type(el, 'contacts.name', 'Ada Lovelace');
  await waitFor(() => create.mock.calls.length > 0, 'the create', 2000);

  expect(create.mock.calls[0][0].categories).toEqual(['Clients, EMEA']);
});

// The page shows the preferred copy of a field. Cleared, that copy goes, and
// the server's next copy is the preferred one, which the page never showed;
// a value typed into the empty field must not take its place. So each changed
// field says what the page last held for it.
it('says what each changed field held before, an emptied one too', async () => {
  const edit = vi.spyOn(contactsService, 'updateContact')
    .mockResolvedValueOnce({ ok: 'true', path: card.path, etag: 'v2' })
    .mockResolvedValue({ ok: 'true', path: card.path, etag: 'v3' });
  const el = await contactsPage();
  await el.selectContact(el.contacts[0], false);
  await settle(el);

  await el.handleSave({ ...el.selectedContact, url: '' });
  await el.handleSave({ ...el.selectedContact, url: 'https://new.example' });

  expect(edit.mock.calls[0][1]).toMatchObject({ changed_fields: ['url'], changed_from: { url: 'https://work.example' } });
  expect(edit.mock.calls[1][1]).toMatchObject({ changed_fields: ['url'], changed_from: { url: '' }, etag: 'v2' });
});
