/**
 * An edit started before the open card's full read has answered.
 *
 * Opening a contact shows the list's copy of it at once and reads the whole
 * card. The list's copy holds only what the listing returned: against a
 * server that answers the listing with just the properties asked for, no
 * note, address, birthday or URL. Edit pressed before the read answered
 * filled the form from that copy, the read's answer did not refill it, and
 * the first save wrote the card back without them.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextProvider } from '@lit/context';
import { i18nContext, type I18nStore } from '../src/store/i18n-store';
import '../../plugins/carddav/frontend/contacts-page';
import '../../plugins/carddav/frontend/contact-view';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { cleanup, flush, record, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en', addEventListener() {}, removeEventListener() {} };

// The list's copy, as a server answering only FN, EMAIL, TEL and UID gives it.
const row = { path: '/book/grace.vcf', uid: 'uG', name: 'Grace Hopper', email: 'grace@example.test', etag: 'v1' };
// The whole card, as the read of the open card gives it.
const full = { ...row, note: 'Wrote the first compiler', address: '1 Main St, Springfield', birthday: '1906-12-09', url: 'https://navy.example' };

beforeEach(() => {
  vi.spyOn(contactsService, 'fetchContacts').mockResolvedValue({ contacts: [row] } as any);
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

/** A page showing the list, the full read of a card answered by `read`. */
async function page(read: () => Promise<any>): Promise<El> {
  vi.spyOn(contactsService, 'fetchContact').mockImplementation(read);
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

async function pressEdit(el: El): Promise<void> {
  await view(el).updateComplete;
  const pen = Array.from(view(el).shadowRoot!.querySelectorAll('alps-icon-btn')).find((b) => (b as El).title === 'contacts.editContact') as El;
  pen.click();
  await settle(el);
}

/** Types a nickname and waits for the autosave. */
async function typeNickname(el: El, saved: ReturnType<typeof vi.spyOn>): Promise<any> {
  await view(el).updateComplete;
  const nickname = Array.from(view(el).shadowRoot!.querySelectorAll('alps-input')).find((f) => (f as El).placeholder === 'contacts.nickname') as El;
  await nickname.updateComplete;
  const input = nickname.shadowRoot!.querySelector('input')!;
  input.value = 'Amazing Grace';
  input.dispatchEvent(new Event('input'));
  await waitFor(() => saved.mock.calls.length > 0, 'the autosave', 2000);
  return saved.mock.calls[0][1];
}

describe('Edit pressed before the open card has been read', () => {
  it('ignores an older read after switching away and reopening the same card', async () => {
    const reads: Array<(card: any) => void> = [];
    const el = await page(() => new Promise((resolve) => { reads.push(resolve); }));
    const other = { path: '/book/ada.vcf', uid: 'uA', name: 'Ada', etag: 'v1' };
    void el.selectContact(row, false); await settle(el);
    void el.selectContact(other, false); await settle(el);
    void el.selectContact(row, false); await settle(el);
    reads[0]({ ...full, note: 'Old read', etag: 'v0' }); await settle(el);
    await pressEdit(el);
    expect(el.isEditing).toBe(false);
    reads[2]({ ...full, note: 'Current read', etag: 'v2' }); await settle(el);
    expect(el.isEditing).toBe(true);
    expect(view(el).editForm.note).toBe('Current read');
    reads[1](other); await settle(el);
    expect(el.selectedContact.etag).toBe('v2');
  });

  it('does not carry an old Edit gesture into a reopened card', async () => {
    const reads: Array<(card: any) => void> = [];
    const el = await page(() => new Promise((resolve) => { reads.push(resolve); }));
    const other = { path: '/book/ada.vcf', uid: 'uA', name: 'Ada', etag: 'v1' };
    const toasts = record<CustomEvent>(window, 'show-toast');
    void el.selectContact(row, false); await settle(el); await pressEdit(el);
    void el.selectContact(other, false); await settle(el);
    void el.selectContact(row, false); await settle(el);
    reads[0](full); await settle(el);
    reads[2]({ ...full, etag: 'v2' }); await settle(el);
    expect(el.isEditing).toBe(false);
    expect(toasts).toHaveLength(0);
    reads[1](other); await settle(el);
  });

  it('opens the editor on the card as read, and saves all of it', async () => {
    let answer!: (card: any) => void;
    const el = await page(() => new Promise((resolve) => { answer = resolve; }));
    const saved = vi.spyOn(contactsService, 'updateContact').mockResolvedValue({ ok: 'true', path: row.path, etag: 'v2' } as any);

    void el.selectContact(el.contacts[0], false);
    await settle(el);
    await pressEdit(el);
    answer(full);
    await settle(el);
    expect(el.isEditing).toBe(true);

    const sent = await typeNickname(el, saved);
    expect(sent.nickname).toBe('Amazing Grace');
    expect({ note: sent.note, address: sent.address, birthday: sent.birthday, url: sent.url })
      .toEqual({ note: full.note, address: full.address, birthday: full.birthday, url: full.url });
  });

  it('reads the card again when its first read failed, and says so when that fails too', async () => {
    const read = vi.fn<() => Promise<any>>().mockRejectedValue(new Error('offline'));
    const el = await page(read);
    const toasts = record<CustomEvent>(window, 'show-toast');

    void el.selectContact(el.contacts[0], false);
    await settle(el);
    await pressEdit(el);
    expect(el.isEditing).toBe(false);
    expect(read).toHaveBeenCalledTimes(2);
    expect(toasts.map((t) => t.detail.message)).toEqual(['contacts.loadFailed']);

    read.mockResolvedValue(full);
    await pressEdit(el);
    expect(el.isEditing).toBe(true);
    expect(view(el).editForm.note).toBe(full.note);
  });

  it("waits again for a card opened again, whose copy is the list's once more", async () => {
    const reads: Array<(card: any) => void> = [];
    const other = { path: '/book/ada.vcf', uid: 'uA', name: 'Ada Lovelace', email: 'ada@example.test', etag: 'v1' };
    vi.mocked(contactsService.fetchContacts).mockResolvedValue({ contacts: [row, other] } as any);
    const el = await page(() => new Promise((resolve) => { reads.push(resolve); }));
    const [grace, ada] = el.contacts;

    void el.selectContact(grace, false);
    await settle(el);
    reads[0](full);
    await settle(el);
    void el.selectContact(ada, false);
    await settle(el);
    void el.selectContact(grace, false);
    await settle(el);
    await pressEdit(el);
    expect(el.isEditing).toBe(false);
    reads[2](full);
    await settle(el);
    expect(el.isEditing).toBe(true);
    expect(view(el).editForm.note).toBe(full.note);
  });

  it('opens at once, with no second read, on a card already read', async () => {
    const read = vi.fn<() => Promise<any>>().mockResolvedValue(full);
    const el = await page(read);

    void el.selectContact(el.contacts[0], false);
    await settle(el);
    await pressEdit(el);
    expect(el.isEditing).toBe(true);
    expect(read).toHaveBeenCalledTimes(1);
    expect(view(el).editForm.note).toBe(full.note);
  });
});
