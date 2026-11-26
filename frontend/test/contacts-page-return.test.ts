/**
 * app-root keeps the Contacts page and reconnects it when its tab is reopened.
 * A recent address book should be reused, including a successfully empty one;
 * a refresh of an existing book should leave its rows usable while it waits.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/carddav/frontend/contacts-page';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { endBoot } from '../src/utils/boot-splash';
import { HttpStatusError } from '../src/utils/fetch-utils';
import { cleanup, flush, mount, shadow, waitFor } from './helpers/dom';

type Page = HTMLElement & Record<string, any>;
type List = HTMLElement & { updateComplete: Promise<unknown> };

const ADA = { path: '/book/ada.vcf', uid: 'ada', etag: 'v1', name: 'Ada Lovelace', categories: ['Work'] };
const BOB = { path: '/book/bob.vcf', uid: 'bob', etag: 'v1', name: 'Bob Barker', categories: [] };
const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };

let now: number;

function settingsStore(checkMailInterval?: number) {
  const state = { checkMailInterval, loginUsername: 'ada@example.test', densityMode: 'compact' };
  return Object.assign(new EventTarget(), { getState: () => state });
}

beforeEach(() => {
  now = Date.parse('2026-11-26T12:00:00Z');
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  vi.spyOn(contactsService, 'fetchContacts').mockResolvedValue({ contacts: [ADA, BOB] });
  vi.spyOn(contactsService, 'fetchContact').mockImplementation(async path => ({ ...(path === ADA.path ? ADA : BOB) }));
  endBoot();
  history.replaceState(null, '', '#/contacts/all');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  history.replaceState(null, '', '#/');
});

async function render(page: Page): Promise<void> {
  await page.updateComplete;
  await shadow<List>(page, 'alps-contacts-list').updateComplete;
  await flush();
}

async function open(checkMailInterval?: number): Promise<Page> {
  const page = await mount<Page>('contacts-page', { i18nStore, settingsStore: settingsStore(checkMailInterval) });
  await waitFor(() => !page.loading, 'the first contact listing');
  await render(page);
  return page;
}

function leave(page: Page): void {
  page.remove();
  history.replaceState(null, '', '#/calendar');
}

async function returnTo(page: Page, hash = '#/contacts/all'): Promise<void> {
  history.replaceState(null, '', hash);
  document.body.appendChild(page);
  await render(page);
}

function holdNextRead() {
  let release!: (value: { contacts: typeof ADA[] }) => void;
  const pending = new Promise<{ contacts: typeof ADA[] }>(resolve => { release = resolve; });
  vi.mocked(contactsService.fetchContacts).mockImplementationOnce(() => pending);
  return (contacts = [ADA, BOB]) => release({ contacts });
}

async function useExistingRow(page: Page): Promise<void> {
  const list = shadow<List>(page, 'alps-contacts-list');
  const content = shadow<HTMLElement>(list, '.list-content');
  expect(content.style.pointerEvents).not.toBe('none');
  expect(content.style.opacity).toBe('1');
  shadow<HTMLElement>(list, '.contact-item').click();
  await waitFor(() => page.selectedContact?.path === ADA.path, 'the existing card to open');
}

describe('returning to Contacts', () => {
  it('reuses a recent book for five minutes by default and follows the new address', async () => {
    const page = await open();
    leave(page);
    now += 4 * 60_000;

    await returnTo(page, '#/contacts/Work');

    expect(contactsService.fetchContacts).toHaveBeenCalledTimes(1);
    expect(page.selectedCategory).toBe('Work');
    await useExistingRow(page);
  });

  it('uses the configured check-mail interval as the freshness window', async () => {
    const page = await open(15);
    leave(page);
    now += 6 * 60_000;

    await returnTo(page);

    expect(contactsService.fetchContacts).toHaveBeenCalledTimes(1);
  });

  it('also reuses a successfully empty address book', async () => {
    vi.mocked(contactsService.fetchContacts).mockResolvedValue({ contacts: [] });
    const page = await open();
    leave(page);

    await returnTo(page);

    expect(contactsService.fetchContacts).toHaveBeenCalledTimes(1);
    expect(page.contacts).toEqual([]);
    expect(shadow<List>(page, 'alps-contacts-list').shadowRoot!.querySelector('.empty-state')).not.toBeNull();
  });

  it('retries a first load that failed', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(contactsService.fetchContacts).mockRejectedValueOnce(new Error('offline'));
    const page = await open();
    expect(error).toHaveBeenCalledTimes(1);
    leave(page);

    await returnTo(page);
    await waitFor(() => !page.loading && page.contacts.length === 2, 'the retried listing');

    expect(contactsService.fetchContacts).toHaveBeenCalledTimes(2);
  });

  it('refreshes an old book without dimming or disabling its existing rows', async () => {
    const page = await open(1);
    leave(page);
    now += 60_001;
    const release = holdNextRead();

    await returnTo(page);
    expect(contactsService.fetchContacts).toHaveBeenCalledTimes(2);
    await useExistingRow(page);

    release();
    await waitFor(() => !page.loading, 'the return refresh');
    expect(page.selectedContact?.path).toBe(ADA.path);
  });

  it('settles an abandoned refresh when a recent book is reused on return', async () => {
    const page = await open();
    const release = holdNextRead();
    shadow<List>(page, 'alps-contacts-list').dispatchEvent(new CustomEvent('refresh'));
    await render(page);
    leave(page);

    await returnTo(page);

    expect(contactsService.fetchContacts).toHaveBeenCalledTimes(2);
    expect(page.loading).toBe(false);
    await useExistingRow(page);
    release([{ ...ADA, name: 'An abandoned response' }]);
    await render(page);
    expect(page.contacts[0].name).toBe(ADA.name);
  });
});

describe('refreshing a loaded contact list', () => {
  it('accepts a refreshed card after a definitively refused star is rolled back', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(contactsService, 'updateCategories').mockRejectedValue(new HttpStatusError(403, 'refused'));
    const page = await open();
    const release = holdNextRead();
    const list = shadow<List>(page, 'alps-contacts-list');
    list.dispatchEvent(new CustomEvent('refresh'));
    await render(page);

    shadow<HTMLElement>(list, '.star-btn').click();
    await waitFor(() => errors.mock.calls.length === 1 && !page.contacts[0].categories.includes('Favorites'), 'the refused star to roll back');
    release([{ ...ADA, name: 'Ada changed elsewhere', etag: 'v2' }, BOB]);
    await waitFor(() => !page.loading, 'the refreshed card');
    await render(page);

    expect(page.contacts[0]).toMatchObject({ name: 'Ada changed elsewhere', categories: ['Work'], etag: 'v2' });
    expect(shadow<HTMLElement>(list, '.star-btn').classList.contains('starred')).toBe(false);
  });

  it('keeps a star and its new version when an older listing arrives after the write', async () => {
    const write = vi.spyOn(contactsService, 'updateCategories').mockResolvedValue({ ok: 'true', path: ADA.path, etag: 'v2' });
    const page = await open();
    const release = holdNextRead();
    const list = shadow<List>(page, 'alps-contacts-list');
    list.dispatchEvent(new CustomEvent('refresh'));
    await render(page);

    shadow<HTMLElement>(list, '.star-btn').click();
    await waitFor(() => page.contacts[0].etag === 'v2', 'the saved star');
    expect(write).toHaveBeenCalledWith(ADA.path, ['Work', 'Favorites']);

    release([ADA, { ...BOB, name: 'Bob changed elsewhere' }]);
    await waitFor(() => !page.loading, 'the older listing');
    await render(page);

    expect(page.contacts[0]).toMatchObject({ categories: ['Work', 'Favorites'], etag: 'v2' });
    expect(shadow<HTMLElement>(list, '.star-btn').classList.contains('starred')).toBe(true);
    expect(page.contacts[1].name).toBe('Bob changed elsewhere');
  });

  it('keeps an optimistic star when the older listing arrives before the write finishes', async () => {
    let finishWrite!: (value: { ok: string; path: string; etag: string }) => void;
    const writing = new Promise<{ ok: string; path: string; etag: string }>(resolve => { finishWrite = resolve; });
    const write = vi.spyOn(contactsService, 'updateCategories').mockReturnValue(writing);
    const page = await open();
    const release = holdNextRead();
    const list = shadow<List>(page, 'alps-contacts-list');
    list.dispatchEvent(new CustomEvent('refresh'));
    await render(page);

    shadow<HTMLElement>(list, '.star-btn').click();
    expect(write).toHaveBeenCalledWith(ADA.path, ['Work', 'Favorites']);
    release([ADA, { ...BOB, name: 'Bob changed elsewhere' }]);
    await waitFor(() => !page.loading, 'the older listing');
    await render(page);

    expect(page.contacts[0]).toMatchObject({ categories: ['Work', 'Favorites'], etag: 'v1' });
    expect(shadow<HTMLElement>(list, '.star-btn').classList.contains('starred')).toBe(true);
    expect(page.contacts[1].name).toBe('Bob changed elsewhere');

    finishWrite({ ok: 'true', path: ADA.path, etag: 'v2' });
    await waitFor(() => page.contacts[0].etag === 'v2', 'the saved version');
    expect(page.contacts[0].categories).toEqual(['Work', 'Favorites']);
  });

  it('still blocks old rows while a different search is being answered', async () => {
    const page = await open();
    const release = holdNextRead();

    shadow(page, 'app-header').dispatchEvent(new CustomEvent('search-submit', { detail: { value: 'Ada' } }));
    await render(page);

    const list = shadow<List>(page, 'alps-contacts-list');
    expect(shadow<HTMLElement>(list, '.list-content').style.pointerEvents).toBe('none');
    release([ADA]);
    await waitFor(() => !page.loading, 'the search result');
    await render(page);
    await useExistingRow(page);
  });

  it('keeps rows usable during an explicit refresh', async () => {
    const page = await open();
    const release = holdNextRead();

    shadow<List>(page, 'alps-contacts-list').dispatchEvent(new CustomEvent('refresh'));
    await render(page);

    expect(contactsService.fetchContacts).toHaveBeenCalledTimes(2);
    await useExistingRow(page);
    release();
    await waitFor(() => !page.loading, 'the manual refresh');
  });

  it('keeps rows usable during a scheduled refresh', async () => {
    const intervals = vi.spyOn(globalThis, 'setInterval');
    const page = await open(1);
    const poll = intervals.mock.calls.find(([, delay]) => delay === 60_000)?.[0];
    expect(typeof poll).toBe('function');
    const release = holdNextRead();

    (poll as () => void)();
    await render(page);

    expect(contactsService.fetchContacts).toHaveBeenCalledTimes(2);
    await useExistingRow(page);
    release();
    await waitFor(() => !page.loading, 'the scheduled refresh');
  });
});
