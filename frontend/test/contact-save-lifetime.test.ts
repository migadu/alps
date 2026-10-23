import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ContextProvider } from '@lit/context';
import { i18nContext, type I18nStore } from '../src/store/i18n-store';
import '../../plugins/carddav/frontend/contacts-page';
import '../../plugins/carddav/frontend/contact-view';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { cleanup, flush, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;
const bob = { path: '/book/bob.vcf', uid: 'bob', etag: 'b1', name: 'Bob', email: 'bob@example.test' };
const i18nStore = { t: (key: string) => key, getLanguage: () => 'en', addEventListener() {}, removeEventListener() {} };

beforeEach(() => {
  vi.spyOn(contactsService, 'fetchContacts').mockResolvedValue({ contacts: [bob] } as any);
  vi.spyOn(contactsService, 'fetchContact').mockImplementation(async () => ({ ...bob }) as any);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  history.replaceState(null, '', '#/contacts/all');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); history.replaceState(null, '', '#/'); });
afterAll(() => new Promise<void>((resolve) => setTimeout(resolve, 150)));
async function settle(el: El) { for (let i = 0; i < 8; i++) { await flush(); await el.updateComplete; } }
async function page(): Promise<El> {
  const root = document.createElement('div');
  new ContextProvider(root, { context: i18nContext, initialValue: i18nStore as unknown as I18nStore });
  document.body.appendChild(root);
  const el = document.createElement('contacts-page') as El;
  root.appendChild(el); await settle(el); return el;
}
async function type(el: El, value: string) {
  const view = el.shadowRoot!.querySelector('alps-contact-view') as El;
  await view.updateComplete;
  const host = Array.from(view.shadowRoot!.querySelectorAll('alps-input')).find((f) => (f as El).placeholder === 'contacts.name') as El;
  await host.updateComplete;
  const input = host.shadowRoot!.querySelector('input')!;
  input.value = value; input.dispatchEvent(new Event('input')); await settle(el);
}
it('a delayed create updates its own row without replacing the newly opened card', async () => {
  let finish!: (answer: any) => void;
  const create = vi.spyOn(contactsService, 'createContact').mockReturnValue(new Promise(resolve => { finish = resolve; }) as any);
  const el = await page();
  el.handleCreateNew(); await settle(el); await type(el, 'Ada');
  await waitFor(() => create.mock.calls.length === 1, 'create', 2000);
  await el.selectContact(bob, false); await settle(el);
  expect(el.selectedContact).toMatchObject(bob);
  finish({ ok: 'true', path: '/book/ada.vcf', etag: 'a1' }); await settle(el);
  expect(el.selectedContact).toMatchObject(bob);
  expect(el.contacts.find((c: any) => c.path === bob.path)).toMatchObject(bob);
  expect(el.contacts.find((c: any) => c.path === '/book/ada.vcf')).toMatchObject({ name: 'Ada', etag: 'a1' });
});

it('keeps queued edits for both cards and uses each card\'s successful ETag', async () => {
  let finish!: (answer: any) => void;
  vi.spyOn(contactsService, 'createContact').mockReturnValue(new Promise(resolve => { finish = resolve; }) as any);
  const edit = vi.spyOn(contactsService, 'updateContact').mockImplementation(async (path) => ({ ok: 'true', path, etag: path === bob.path ? 'b2' : 'a2' }));
  const el = await page();
  el.handleCreateNew(); await settle(el);
  const creating = el.handleSave({ ...el.selectedContact, name: 'Ada' });
  await el.handleSave({ ...el.selectedContact, name: 'Ada Lovelace' });
  await el.selectContact(bob, false); await settle(el);
  await el.handleSave({ ...bob, name: 'Robert' });
  finish({ ok: 'true', path: '/book/ada.vcf', etag: 'a1' });
  await creating; await settle(el);
  expect(edit.mock.calls.map(([path, data]) => [path, data.name, data.etag])).toEqual([
    ['/book/ada.vcf', 'Ada Lovelace', 'a1'], [bob.path, 'Robert', 'b1'],
  ]);
  expect(el.selectedContact).toMatchObject({ ...bob, name: 'Robert', etag: 'b2' });
  expect(el.contacts.find((c: any) => c.path === '/book/ada.vcf')).toMatchObject({ name: 'Ada Lovelace', etag: 'a2' });
});

it.each(['disconnect', 'account change'])('does not send queued writes or paint a late result after %s', async (ending) => {
  let finish!: (answer: any) => void;
  vi.spyOn(contactsService, 'createContact').mockReturnValue(new Promise(resolve => { finish = resolve; }) as any);
  const edit = vi.spyOn(contactsService, 'updateContact').mockResolvedValue({ ok: 'true', path: '/book/ada.vcf', etag: 'a2' });
  const el = await page();
  el.handleCreateNew(); await settle(el);
  const creating = el.handleSave({ ...el.selectedContact, name: 'Ada' });
  await el.handleSave({ ...el.selectedContact, name: 'Ada Lovelace' });
  if (ending === 'disconnect') el.remove();
  else window.dispatchEvent(new Event('alps-active-user-changed'));
  finish({ ok: 'true', path: '/book/ada.vcf', etag: 'a1' });
  await creating;
  expect(edit).not.toHaveBeenCalled();
  expect(el.selectedContact.isTemporary).toBe(true);
  expect(el.contacts.some((c: any) => c.path === '/book/ada.vcf')).toBe(false);
});

it('sends a previous editor\'s pending debounce to its own card', async () => {
  const edit = vi.spyOn(contactsService, 'updateContact').mockResolvedValue({ ok: 'true', path: bob.path, etag: 'b2' });
  const create = vi.spyOn(contactsService, 'createContact').mockResolvedValue({ ok: 'true', path: '/book/ada.vcf', etag: 'a1' });
  const el = await page();
  el.handleCreateNew(); await settle(el); await type(el, 'Ada');
  await el.selectContact(bob, false); await settle(el);
  await new Promise(resolve => setTimeout(resolve, 600));
  expect(edit).not.toHaveBeenCalled();
  expect(create).toHaveBeenCalledTimes(1);
  expect(create.mock.calls[0][0]).toMatchObject({ name: 'Ada', allow_duplicate: true });
  expect(el.selectedContact).toMatchObject(bob);
});

it('does not send an old editor\'s pending debounce under another account', async () => {
  const create = vi.spyOn(contactsService, 'createContact').mockResolvedValue({ ok: 'true', path: '/book/ada.vcf', etag: 'a1' });
  const el = await page();
  let username = 'ada@example.test';
  const settings = { getState: () => ({ loginUsername: username }), addEventListener() {}, removeEventListener() {} };
  el.settingsStore = settings;
  const view = el.shadowRoot!.querySelector('alps-contact-view') as El;
  view.settingsStore = settings;
  el.handleCreateNew(); await settle(el); await type(el, 'Ada');
  username = 'bob@example.test';
  window.dispatchEvent(new Event('alps-active-user-changed'));
  await new Promise(resolve => setTimeout(resolve, 600));
  expect(create).not.toHaveBeenCalled();
});
