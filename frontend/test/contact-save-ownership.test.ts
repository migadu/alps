/**
 * Each autosave belongs to the card it was made for.
 *
 * A save read the open contact when its request answered, and the page's one
 * queue held only the newest form, whichever card it was for. A create that
 * answered after another contact had been opened gave that contact the new
 * card's name, path and version; a form whose half-second autosave fired
 * after another contact had been opened was saved over that contact; a form
 * queued for one card was dropped for another's; and a save queued under one
 * account could be sent under the next.
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
const bob = { path: '/book/bob.vcf', uid: 'uB', name: 'Bob Babbage', email: 'bob@example.test', etag: 'b1' };
const ada = { path: '/book/ada.vcf', uid: 'uA', name: 'Ada Lovelace', email: 'ada@example.test', etag: 'a1' };

beforeEach(() => {
  localStorage.setItem('alps_active_user', 'grace@example.test');
  vi.spyOn(contactsService, 'fetchContacts').mockResolvedValue({ contacts: [{ ...ada }, { ...bob }] } as any);
  vi.spyOn(contactsService, 'fetchContact').mockImplementation(async (path: string) => ({ ...(path === bob.path ? bob : ada) }));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  history.replaceState(null, '', '#/contacts/all');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
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

async function type(el: El, placeholder: string, value: string): Promise<void> {
  await view(el).updateComplete;
  const host = Array.from(view(el).shadowRoot!.querySelectorAll('alps-input')).find((f) => (f as El).placeholder === placeholder) as El;
  await host.updateComplete;
  const input = host.shadowRoot!.querySelector('input')!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await settle(el);
}

/** Opens a contact as a click on its row does. */
async function open(el: El, path: string): Promise<void> {
  await el.selectContact(el.contacts.find((c: any) => c.path === path), false);
  await settle(el);
}

it('gives a create that answers late to its own card, not to the one opened meanwhile', async () => {
  let created!: (answer: any) => void;
  const create = vi.spyOn(contactsService, 'createContact').mockReturnValue(new Promise((resolve) => { created = resolve; }) as any);
  const el = await contactsPage();

  el.handleCreateNew();
  await settle(el);
  await type(el, 'contacts.name', 'Grace Hopper');
  await waitFor(() => create.mock.calls.length === 1, 'the create', 2000);
  await open(el, bob.path);
  created({ ok: 'true', path: '/book/grace.vcf', etag: 'g1' });
  await settle(el);

  expect(el.selectedContact).toMatchObject({ path: bob.path, name: bob.name, etag: bob.etag });
  expect(el.contacts.find((c: any) => c.uid === bob.uid)).toMatchObject({ path: bob.path, name: bob.name, etag: bob.etag });
  expect(el.contacts.find((c: any) => c.path === '/book/grace.vcf')).toMatchObject({ name: 'Grace Hopper', etag: 'g1' });
});

it('saves a form whose autosave was still waiting to its own card when another is opened', async () => {
  const create = vi.spyOn(contactsService, 'createContact').mockResolvedValue({ ok: 'true', path: '/book/grace.vcf', etag: 'g1' });
  const edit = vi.spyOn(contactsService, 'updateContact').mockResolvedValue({ ok: 'true', path: bob.path, etag: 'b2' });
  const el = await contactsPage();

  el.handleCreateNew();
  await settle(el);
  await type(el, 'contacts.name', 'Grace Hopper');
  // Bob opened before the half second after the keystroke has passed.
  await open(el, bob.path);
  await new Promise((resolve) => setTimeout(resolve, 700));
  await settle(el);

  expect(edit).not.toHaveBeenCalled();
  expect(create).toHaveBeenCalledTimes(1);
  expect(create.mock.calls[0][0]).toMatchObject({ name: 'Grace Hopper' });
  expect(el.selectedContact).toMatchObject({ path: bob.path, name: bob.name });
});

it('keeps a form queued for each card, and saves each to its own', async () => {
  let answered!: (answer: any) => void;
  const edit = vi.spyOn(contactsService, 'updateContact')
    .mockReturnValueOnce(new Promise((resolve) => { answered = resolve; }) as any)
    .mockImplementation(async (path: string) => ({ ok: 'true', path, etag: path === ada.path ? 'a3' : 'b2' }));
  const el = await contactsPage();
  await open(el, ada.path);

  const saving = el.handleSave({ ...ada, note: 'First' });
  el.handleSave({ ...ada, note: 'Second' });
  await open(el, bob.path);
  el.handleSave({ ...bob, note: 'Bob' });
  answered({ ok: 'true', path: ada.path, etag: 'a2' });
  await saving;

  expect(edit.mock.calls.map(([path, sent]) => [path, sent.note, sent.etag])).toEqual([
    [ada.path, 'First', 'a1'],
    [ada.path, 'Second', 'a2'],
    [bob.path, 'Bob', 'b1'],
  ]);
  expect(el.selectedContact).toMatchObject({ path: bob.path, note: 'Bob', etag: 'b2' });
  expect(el.contacts.find((c: any) => c.path === ada.path)).toMatchObject({ note: 'Second', etag: 'a3' });
});

it('sends nothing queued, and paints nothing late, once another account is signed in', async () => {
  let answered!: (answer: any) => void;
  const edit = vi.spyOn(contactsService, 'updateContact')
    .mockReturnValueOnce(new Promise((resolve) => { answered = resolve; }) as any)
    .mockResolvedValue({ ok: 'true', path: ada.path, etag: 'a3' });
  const el = await contactsPage();
  await open(el, ada.path);

  const saving = el.handleSave({ ...ada, note: 'First' });
  el.handleSave({ ...ada, note: 'Second' });
  localStorage.setItem('alps_active_user', 'other@example.test');
  answered({ ok: 'true', path: ada.path, etag: 'a2' });
  await saving;

  expect(edit).toHaveBeenCalledTimes(1);
  expect(el.contacts.find((c: any) => c.path === ada.path)).toMatchObject({ etag: 'a1' });
});
