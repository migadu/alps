/**
 * The Filters page over a script it could not read.
 *
 * A save writes the whole filter set, so an editor offered after a failed
 * read is an editor over nothing: it showed no rules, as for an account that
 * has none, and a rule added and saved there replaced every filter the server
 * held. The page says the read failed instead, and offers to try again.
 *
 * The i18n store answers with the dictionary keys, so the assertions name
 * them.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextProvider } from '@lit/context';
import { cleanup, shadow, text, waitFor } from './helpers/dom';
import { i18nContext, type I18nStore } from '../src/store/i18n-store';
import { SieveCompiler } from '../../plugins/managesieve/frontend/sieve-compiler';
import '../../plugins/managesieve/frontend/managesieve-page';

type El = HTMLElement & Record<string, any>;

/** A rule as the visual editor writes it, so the page opens it in that editor. */
const RULES = SieveCompiler.compile({
  rules: [{
    id: 'invoices',
    matchType: 'all',
    conditions: [{ field: 'Subject', operator: 'contains', value: 'invoice' }],
    actions: [{ type: 'fileinto', value: 'Receipts' }],
  }],
});
const i18nStore = {
  t: (key: string) => key,
  getIntlLanguage: () => 'en',
  addEventListener: () => {},
  removeEventListener: () => {},
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let getStatus: number;
let reads: number;
let puts: string[];

beforeEach(() => {
  getStatus = 200;
  reads = 0;
  puts = [];
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    if (String(url) === '/mailboxes/INBOX') return json(200, { Mailboxes: [] });
    if (String(url) !== '/managesieve/script') throw new Error(`unexpected request to ${String(url)}`);
    if ((init?.method ?? 'GET') === 'PUT') {
      puts.push(JSON.parse(String(init!.body)).content);
      return json(200, { message: 'ok' });
    }
    reads++;
    if (getStatus !== 200) return json(getStatus, { error: 'sieve_unavailable' });
    return json(200, { content: RULES, extensions: ['fileinto'] });
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** The Filters page, inside an i18n provider, once it has read the script or failed to. */
async function openFilters(): Promise<El> {
  const root = document.createElement('div');
  new ContextProvider(root, { context: i18nContext, initialValue: i18nStore as unknown as I18nStore });
  document.body.appendChild(root);
  const el = document.createElement('alps-managesieve-page') as El;
  root.appendChild(el);
  // The first render shows the loader, which goes once the read has settled.
  await el.updateComplete;
  await waitFor(() => !el.shadowRoot!.querySelector('alps-loader'), 'the script to be read');
  await el.updateComplete;
  return el;
}

describe('the Filters page, when the script cannot be read', () => {
  it('offers no editor to save from, and says the filters could not be loaded', async () => {
    getStatus = 500;
    const el = await openFilters();

    expect(el.shadowRoot!.querySelector('alps-visual-editor')).toBeNull();
    expect(el.shadowRoot!.querySelector('alps-raw-editor')).toBeNull();
    expect(text(el)).toContain('managesieve.loadError');
    expect(puts).toEqual([]);
  });

  it('reads the script again when asked, and then shows the rules it holds', async () => {
    getStatus = 500;
    const el = await openFilters();

    getStatus = 200;
    const retry = shadow<El>(el, '.load-error alps-button');
    expect(retry.textContent?.trim()).toBe('managesieve.loadErrorRetry');
    retry.click();
    await waitFor(() => !!el.shadowRoot!.querySelector('alps-visual-editor'), 'the rules to load');

    expect(reads).toBe(2);
    expect(text(el)).not.toContain('managesieve.loadError');
    expect(shadow<El>(el, 'alps-visual-editor').state.rules).toHaveLength(1);
  });
});
