/**
 * An unsaved Auto-reply or Filters edit survives leaving the page.
 *
 * Both pages have a Save of their own, and the settings page makes them anew
 * each time it shows them. Leaving with an edit unsaved, by the browser's
 * Back or any other way, dropped it without a word, and coming back, Forward
 * included, showed the server's copy again. The edit is now kept for the
 * page's next visit, still unsaved: unless the server's copy changed in the
 * meantime, or the session ended.
 *
 * No i18n provider answers with words, so the assertions name keys.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextProvider } from '@lit/context';
import { cleanup, mount, shadow, waitFor } from './helpers/dom';
import { i18nContext, type I18nStore } from '../src/store/i18n-store';
import { compileAutoReply, DEFAULT_AUTO_REPLY, mergeAutoReply, type AutoReply } from '../../plugins/managesieve/frontend/auto-reply';
import { SieveCompiler } from '../../plugins/managesieve/frontend/sieve-compiler';
import '../../plugins/managesieve/frontend/auto-reply-page';
import '../../plugins/managesieve/frontend/managesieve-page';

type El = HTMLElement & Record<string, any>;

const ADDRESS = 'alice@example.test';
const FILTERS = 'require "fileinto";\nif header :contains "Subject" "invoice" { fileinto "Receipts"; }\n';
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
const settingsStore = { getState: () => ({ loginUsername: ADDRESS }) };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** The script the server holds, and every script saved. */
let stored: string;
let puts: string[];

beforeEach(() => {
  stored = '';
  puts = [];
  vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    if (String(url) === '/mailboxes/INBOX') return json(200, { Mailboxes: [] });
    if ((init?.method ?? 'GET') === 'PUT') {
      puts.push(JSON.parse(String(init!.body)).content);
      return json(200, { message: 'ok' });
    }
    return json(200, { content: stored, extensions: ['fileinto', 'vacation', 'date', 'relational'] });
  }));
});

afterEach(() => {
  cleanup();
  // What the pages kept is the session's, and each test is one.
  window.dispatchEvent(new CustomEvent('session-cleared'));
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const reply = (overrides: Partial<AutoReply> = {}) =>
  compileAutoReply({ ...DEFAULT_AUTO_REPLY, enabled: true, subject: 'Away', message: 'Back soon.', ...overrides }, { address: ADDRESS });

describe('the auto-reply page, left with an edit unsaved', () => {
  async function openPage(): Promise<El> {
    const el = await mount<El>('alps-auto-reply-page', { i18nStore, settingsStore });
    await waitFor(() => !el.shadowRoot!.querySelector('alps-loader'), 'the script to load');
    await el.updateComplete;
    return el;
  }
  const textarea = (el: El) => shadow<HTMLTextAreaElement>(el, 'textarea');
  const saveButton = (el: El) => shadow<El>(el, 'alps-button[variant="primary"]');
  async function typeMessage(el: El, value: string) {
    textarea(el).value = value;
    textarea(el).dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;
  }

  it('shows it again on the next visit, still unsaved', async () => {
    stored = mergeAutoReply(reply(), FILTERS);
    const left = await openPage();
    await typeMessage(left, 'Out until Monday.');
    left.remove();

    const back = await openPage();
    expect(textarea(back).value).toBe('Out until Monday.');
    expect(saveButton(back).hasAttribute('disabled')).toBe(false);
    expect(puts).toEqual([]);
  });

  it('does not lay it over a reply the server has changed since', async () => {
    stored = mergeAutoReply(reply(), FILTERS);
    const left = await openPage();
    await typeMessage(left, 'Out until Monday.');
    left.remove();
    stored = mergeAutoReply(reply({ message: 'Saved from another tab.' }), FILTERS);

    const back = await openPage();
    expect(textarea(back).value).toBe('Saved from another tab.');
    expect(saveButton(back).hasAttribute('disabled')).toBe(true);
  });

  it('forgets it when the session ends', async () => {
    stored = mergeAutoReply(reply(), FILTERS);
    const left = await openPage();
    await typeMessage(left, 'Out until Monday.');
    left.remove();
    window.dispatchEvent(new CustomEvent('session-cleared'));

    const back = await openPage();
    expect(textarea(back).value).toBe('Back soon.');
  });
});

describe('the Filters page, left with an edit unsaved', () => {
  async function openFilters(): Promise<El> {
    const root = document.createElement('div');
    new ContextProvider(root, { context: i18nContext, initialValue: i18nStore as unknown as I18nStore });
    document.body.appendChild(root);
    const el = document.createElement('alps-managesieve-page') as El;
    root.appendChild(el);
    await el.updateComplete;
    await waitFor(() => !el.shadowRoot!.querySelector('alps-loader'), 'the script to load');
    await el.updateComplete;
    return el;
  }

  it('shows a raw script again on the next visit, still unsaved', async () => {
    stored = FILTERS;
    const left = await openFilters();
    const editor = shadow<El>(left, 'alps-raw-editor');
    const typed = FILTERS.replace('Receipts', 'Invoices');
    const area = shadow<HTMLTextAreaElement>(editor, 'textarea');
    area.value = typed;
    area.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await left.updateComplete;
    left.remove();

    const back = await openFilters();
    const again = shadow<El>(back, 'alps-raw-editor');
    await again.updateComplete;
    expect(again.script).toBe(typed);
    expect(shadow<El>(again, 'alps-button[variant="primary"]').hasAttribute('disabled')).toBe(false);
    expect(puts).toEqual([]);
  });

  it('shows changed rules again on the next visit, still unsaved', async () => {
    stored = RULES;
    const left = await openFilters();
    await waitFor(() => !!left.shadowRoot!.querySelector('alps-visual-editor'), 'the rules');
    const editor = shadow<El>(left, 'alps-visual-editor');
    editor.dispatchEvent(new CustomEvent('state-changed', { detail: { state: { rules: [] } } }));
    await left.updateComplete;
    left.remove();

    const back = await openFilters();
    await waitFor(() => !!back.shadowRoot!.querySelector('alps-visual-editor'), 'the rules');
    const again = shadow<El>(back, 'alps-visual-editor');
    await again.updateComplete;
    expect(back.visualState).toEqual({ rules: [] });
    expect(again.isDirty).toBe(true);
    expect(puts).toEqual([]);
  });
});
