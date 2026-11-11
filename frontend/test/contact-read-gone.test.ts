/**
 * A contact opened after another device deleted it.
 *
 * Opening a contact shows the list's copy of it at once and reads the whole
 * card. A card deleted elsewhere since the list was read is not there to read:
 * the server answered 500, the page logged an error, and it went on showing a
 * contact that no longer exists. The read's 404 now closes the card, says it
 * was deleted on another device, and reads the list again.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextProvider } from '@lit/context';
import { i18nContext, type I18nStore } from '../src/store/i18n-store';
import { HttpStatusError } from '../src/utils/fetch-utils';
import '../../plugins/carddav/frontend/contacts-page';
import '../../plugins/carddav/frontend/contact-view';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { cleanup, flush, record } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en', addEventListener() {}, removeEventListener() {} };

const grace = { path: '/book/grace.vcf', uid: 'uG', name: 'Grace Hopper', email: 'grace@example.test', etag: 'v1' };
const ada = { path: '/book/ada.vcf', uid: 'uA', name: 'Ada Lovelace', email: 'ada@example.test', etag: 'v1' };

let errors: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.spyOn(contactsService, 'fetchContacts').mockResolvedValue({ contacts: [grace, ada] } as any);
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
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

/** A page showing the list, each card's full read answered by `read`. */
async function page(read: (path: string) => Promise<any>): Promise<El> {
  vi.spyOn(contactsService, 'fetchContact').mockImplementation(read);
  const root = document.createElement('div');
  new ContextProvider(root, { context: i18nContext, initialValue: i18nStore as unknown as I18nStore });
  document.body.appendChild(root);
  const el = document.createElement('contacts-page') as El;
  root.appendChild(el);
  await settle(el);
  return el;
}

const gone = () => Promise.reject(new HttpStatusError(404, 'Failed to fetch contact: Not Found'));

describe('a contact whose card is gone when it is read', () => {
  it('closes, says it was deleted on another device, and the list is read again', async () => {
    const el = await page(gone);
    const toasts = record<CustomEvent>(window, 'show-toast');
    const listReads = (contactsService.fetchContacts as unknown as ReturnType<typeof vi.spyOn>).mock.calls.length;
    history.replaceState(null, '', '#/contacts/all/uG');

    await el.selectContact(grace, false);
    await settle(el);

    expect(el.selectedContact).toBeNull();
    expect(window.location.hash).toBe('#/contacts/all');
    expect(toasts.map((t) => t.detail.message)).toEqual(['contacts.deletedElsewhere']);
    expect((contactsService.fetchContacts as unknown as ReturnType<typeof vi.spyOn>).mock.calls.length).toBeGreaterThan(listReads);
    expect(errors).not.toHaveBeenCalled();
  });

  it('leaves a contact opened since alone', async () => {
    let refuseGrace!: (error: Error) => void;
    const el = await page((path) => path === grace.path
      ? new Promise((_, reject) => { refuseGrace = reject; })
      : Promise.resolve(ada));
    const toasts = record<CustomEvent>(window, 'show-toast');

    // Each opened as the page opens a card: its address first.
    history.replaceState(null, '', '#/contacts/all/uG');
    void el.selectContact(grace, false); await settle(el);
    history.replaceState(null, '', '#/contacts/all/uA');
    void el.selectContact(ada, false); await settle(el);
    refuseGrace(new HttpStatusError(404, 'Failed to fetch contact: Not Found')); await settle(el);

    expect(el.selectedContact?.path).toBe(ada.path);
    expect(toasts).toHaveLength(0);
    expect(errors).not.toHaveBeenCalled();
  });
});
