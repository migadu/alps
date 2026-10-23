/**
 * A new contact, typed into while its first autosave creates it.
 *
 * Add Contact opens the editor on a contact the server does not hold yet. The
 * first autosave creates it, and the page then gives the open contact the
 * path the server answered. The editor took the new path for another card
 * and filled its form again from the open contact, which holds the form as
 * it was when the create was sent: whatever was typed while the create was on
 * its way disappeared from the form.
 *
 * And the create looked for a card with the same address first, and answered
 * with that card's path, without its version or its fields. The page then
 * edited that card, with no version to check against: every later autosave
 * of the new contact was refused (400), or, from a form whose emails carried
 * no positions, written over the other card.
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

beforeEach(() => {
  vi.spyOn(contactsService, 'fetchContacts').mockResolvedValue({ contacts: [] } as any);
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

/** The editor's field with this placeholder, as the user sees it. */
async function field(el: El, placeholder: string): Promise<HTMLInputElement> {
  await view(el).updateComplete;
  const host = Array.from(view(el).shadowRoot!.querySelectorAll('alps-input')).find((f) => (f as El).placeholder === placeholder) as El;
  await host.updateComplete;
  return host.shadowRoot!.querySelector('input')!;
}

async function type(el: El, placeholder: string, value: string): Promise<void> {
  const input = await field(el, placeholder);
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await settle(el);
}

it('keeps what was typed while the first autosave created the contact', async () => {
  let created!: (answer: any) => void;
  const create = vi.spyOn(contactsService, 'createContact').mockReturnValue(new Promise((resolve) => { created = resolve; }) as any);
  const edit = vi.spyOn(contactsService, 'updateContact').mockResolvedValue({ ok: 'true', path: '/book/new.vcf', etag: 'v2' });
  const el = await contactsPage();

  el.handleCreateNew();
  await settle(el);
  await type(el, 'contacts.name', 'Ada');
  await waitFor(() => create.mock.calls.length === 1, 'the create', 2000);
  // Typed on while the create is on its way.
  await type(el, 'contacts.name', 'Ada Lovelace');
  created({ ok: 'true', path: '/book/new.vcf', etag: 'v1' });
  await settle(el);

  expect((await field(el, 'contacts.name')).value).toBe('Ada Lovelace');
  expect(view(el).editForm).toMatchObject({ name: 'Ada Lovelace', path: '/book/new.vcf' });
  await waitFor(() => edit.mock.calls.length > 0, 'the next autosave', 2000);
  expect(edit.mock.calls.at(-1)![0]).toBe('/book/new.vcf');
  expect(edit.mock.calls.at(-1)![1]).toMatchObject({ name: 'Ada Lovelace', etag: 'v1' });
});

it('creates the contact it was asked to, whoever else has its address', async () => {
  const create = vi.spyOn(contactsService, 'createContact').mockResolvedValue({ ok: 'true', path: '/book/new.vcf', etag: 'v1' });
  const el = await contactsPage();

  el.handleCreateNew();
  await settle(el);
  await type(el, 'contacts.email', 'ada@example.test');
  await waitFor(() => create.mock.calls.length === 1, 'the create', 2000);

  expect(create.mock.calls[0][0]).toMatchObject({ allow_duplicate: true });
});
