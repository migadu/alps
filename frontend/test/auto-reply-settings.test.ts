/**
 * Settings → Auto-reply, and the Filters page beside it.
 *
 * Both edit the account's one active Sieve script, each its own part of it, so
 * what these pin is that a save from either page re-reads the script and puts
 * the other part back unchanged — and that the auto-reply page offers nothing
 * the server cannot run, and never a form over a script it could not read.
 *
 * No i18n provider is mounted, so the page shows its dictionary keys and the
 * assertions name them.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, record, shadow, shadowAll, text, waitFor } from './helpers/dom';
import {
  compileAutoReply,
  DEFAULT_AUTO_REPLY,
  mergeAutoReply,
  type AutoReply,
} from '../../plugins/managesieve/frontend/auto-reply';
import { managesieveService, TwoVacationsError } from '../../plugins/managesieve/frontend/managesieve-service';
import '../../plugins/managesieve/frontend/auto-reply-page';
import '../../plugins/managesieve/frontend/raw-editor';

type El = HTMLElement & Record<string, any>;

const ADDRESS = 'alice@example.test';
const ALL = ['fileinto', 'vacation', 'date', 'relational'];
const FILTERS = 'require "fileinto";\nif header :contains "Subject" "invoice" { fileinto "Receipts"; }\n';
/** Filters that send a vacation reply of their own, as another client writes them. */
const OWN_VACATION = 'require "vacation";\nvacation :days 3 "Written elsewhere.";\n';
const i18nStore = {
  t: (key: string) => key,
  getIntlLanguage: () => 'en',
  addEventListener: () => {},
  removeEventListener: () => {},
};
const settingsStore = { getState: () => ({ loginUsername: ADDRESS }) };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** The script the server holds, and what it advertises. */
let stored: string;
let extensions: string[];
let getStatus: number;
let puts: string[];

beforeEach(() => {
  stored = '';
  extensions = ALL;
  getStatus = 200;
  puts = [];
  vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    if (String(url) !== '/managesieve/script') throw new Error(`unexpected request to ${String(url)}`);
    if ((init?.method ?? 'GET') === 'PUT') {
      const { content } = JSON.parse(String(init!.body));
      puts.push(content);
      stored = content;
      return json(200, { message: 'ok' });
    }
    if (getStatus !== 200) return json(getStatus, { error: 'sieve_unavailable' });
    return json(200, { content: stored, extensions });
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const block = (overrides: Partial<AutoReply> = {}) =>
  compileAutoReply({ ...DEFAULT_AUTO_REPLY, enabled: true, subject: 'Away', message: 'Back soon.', ...overrides }, { address: ADDRESS });

describe('the Filters page\'s script', () => {
  it('is shown without the auto-reply', async () => {
    stored = mergeAutoReply(block(), FILTERS);
    expect((await managesieveService.fetchScript()).content).toBe(FILTERS);
  });

  it('is saved around the auto-reply the server holds now', async () => {
    stored = mergeAutoReply(block(), FILTERS);
    const edited = FILTERS.replace('invoice', 'receipt');
    await managesieveService.saveScript(edited);
    expect(puts).toEqual([mergeAutoReply(block(), edited)]);
  });

  it('is saved as it is when there is no auto-reply', async () => {
    stored = FILTERS;
    await managesieveService.saveScript('keep;\n');
    expect(puts).toEqual(['keep;\n']);
  });

  // RFC 5230 makes two vacation actions in one run an error, and the script
  // check here does not catch it: uploaded, it fails at delivery.
  it('is refused when it sends a vacation of its own while the auto-reply is on', async () => {
    stored = mergeAutoReply(block(), FILTERS);
    await expect(managesieveService.saveScript(OWN_VACATION)).rejects.toBeInstanceOf(TwoVacationsError);
    expect(puts).toEqual([]);
  });

  it('may send a vacation of its own while the auto-reply is off', async () => {
    stored = mergeAutoReply(block({ enabled: false }), FILTERS);
    await managesieveService.saveScript(OWN_VACATION);
    expect(puts).toEqual([mergeAutoReply(block({ enabled: false }), OWN_VACATION)]);
  });

  it('says why in the raw editor, in words of its own', async () => {
    stored = mergeAutoReply(block(), FILTERS);
    const toasts = record<CustomEvent>(window, 'show-toast');
    const el = await mount<El>('alps-raw-editor', { i18nStore, stored: FILTERS, script: OWN_VACATION });
    shadow<El>(el, 'alps-button[variant="primary"]').click();
    await waitFor(() => toasts.length > 0, 'the refusal');
    expect(toasts[0].detail).toMatchObject({ message: 'managesieve.toast.autoReplyOn', type: 'error' });
    expect(puts).toEqual([]);
  });
});

/** Mounts the page and waits for it to have read the script. */
async function openPage(): Promise<El> {
  const el = await mount<El>('alps-auto-reply-page', { i18nStore, settingsStore });
  await waitFor(() => !el.shadowRoot!.querySelector('alps-loader'), 'the script to load');
  await el.updateComplete;
  return el;
}

const checkbox = (el: El) => el.shadowRoot!.querySelector<HTMLInputElement>('input[type="checkbox"]');
const field = (el: El, name: string) => shadow<El>(el, `alps-input.${name}`);
const textarea = (el: El) => shadow<HTMLTextAreaElement>(el, 'textarea');
const saveButton = (el: El) => shadow<El>(el, 'alps-button[variant="primary"]');

async function type(el: El, target: El | HTMLTextAreaElement, value: string): Promise<void> {
  target.value = value;
  target.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await el.updateComplete;
}

async function save(el: El): Promise<void> {
  saveButton(el).click();
  await waitFor(() => !el.saving, 'the save');
  await el.updateComplete;
}

describe('the auto-reply page', () => {
  it('refuses, in words of its own, when the server offers no vacation', async () => {
    extensions = ['fileinto', 'date', 'relational'];
    const el = await openPage();
    expect(text(el)).toContain('managesieve.autoReply.unsupported');
    expect(checkbox(el)).toBeNull();
  });

  it('offers dates only when the server can check them', async () => {
    extensions = ['vacation'];
    let el = await openPage();
    expect(checkbox(el)).not.toBeNull();
    expect(shadowAll(el, 'alps-input.start, alps-input.end')).toHaveLength(0);
    cleanup();

    extensions = ['vacation', 'date'];
    el = await openPage();
    expect(shadowAll(el, 'alps-input.start, alps-input.end')).toHaveLength(0);
    cleanup();

    extensions = ALL;
    el = await openPage();
    expect(shadowAll(el, 'alps-input.start, alps-input.end')).toHaveLength(2);
  });

  it('shows the stored reply as it was saved', async () => {
    stored = mergeAutoReply(block({ start: '2026-10-20', end: '2026-10-30', days: 3 }), FILTERS);
    const el = await openPage();
    expect(checkbox(el)!.checked).toBe(true);
    expect(field(el, 'subject').value).toBe('Away');
    expect(textarea(el).value).toBe('Back soon.');
    expect(field(el, 'start').value).toBe('2026-10-20');
    expect(field(el, 'end').value).toBe('2026-10-30');
    expect(shadow<El>(el, 'alps-select').value).toBe('3');
    // As loaded, nothing is unsaved.
    expect(saveButton(el).hasAttribute('disabled')).toBe(true);
  });

  it('drops dates the server no longer checks, and offers to save without them', async () => {
    stored = mergeAutoReply(block({ start: '2026-10-20', end: '2026-10-30' }), FILTERS);
    extensions = ['vacation'];
    const el = await openPage();
    expect(saveButton(el).hasAttribute('disabled')).toBe(false);
    await save(el);
    expect(puts).toEqual([mergeAutoReply(block(), FILTERS)]);
  });

  it('saves the reply from the account\'s address, and keeps the filters', async () => {
    stored = FILTERS;
    const el = await openPage();
    checkbox(el)!.click();
    await el.updateComplete;
    await type(el, field(el, 'subject'), 'Away');
    await type(el, textarea(el), 'Back soon.');
    await save(el);

    expect(puts).toEqual([mergeAutoReply(block(), FILTERS)]);
    expect(puts[0]).toContain(`:from "${ADDRESS}"`);
  });

  it('switched off, keeps the text and stops the reply', async () => {
    stored = mergeAutoReply(block(), FILTERS);
    const el = await openPage();
    checkbox(el)!.click();
    await el.updateComplete;
    await save(el);

    expect(puts).toEqual([mergeAutoReply(block({ enabled: false }), FILTERS)]);
    expect(puts[0]).not.toMatch(/^\s*vacation\b/m);
  });

  // The text of a reply that is off is kept for next time, and can be edited
  // and saved while it stays off. That save turns nothing off, and a toast
  // saying it did reads as though the reply had been on until then.
  it('says it was turned off only when it was on', async () => {
    const toasts = record<CustomEvent>(window, 'show-toast');
    stored = mergeAutoReply(block({ enabled: false }), FILTERS);
    let el = await openPage();
    await type(el, textarea(el), 'Back next week.');
    await save(el);
    expect(puts).toEqual([mergeAutoReply(block({ enabled: false, message: 'Back next week.' }), FILTERS)]);
    expect(toasts.map(t => t.detail.message)).toEqual(['managesieve.autoReply.saved']);
    cleanup();

    stored = mergeAutoReply(block(), FILTERS);
    el = await openPage();
    checkbox(el)!.click();
    await el.updateComplete;
    await save(el);
    expect(toasts.map(t => t.detail.message)).toEqual(['managesieve.autoReply.saved', 'managesieve.autoReply.turnedOff']);
  });

  it('refuses to switch on without a message', async () => {
    const el = await openPage();
    checkbox(el)!.click();
    await el.updateComplete;
    await save(el);
    expect(puts).toEqual([]);
    expect(text(el)).toContain('managesieve.autoReply.errors.emptyMessage');
  });

  it('refuses a start after the end', async () => {
    const el = await openPage();
    checkbox(el)!.click();
    await el.updateComplete;
    await type(el, textarea(el), 'Back soon.');
    await type(el, field(el, 'start'), '2026-10-30');
    await type(el, field(el, 'end'), '2026-10-20');
    await save(el);
    expect(puts).toEqual([]);
    expect(text(el)).toContain('managesieve.autoReply.errors.invalidWindow');
  });

  it('offers no form over a script it could not read', async () => {
    getStatus = 500;
    const el = await openPage();
    expect(text(el)).toContain('managesieve.autoReply.errors.loadError');
    expect(checkbox(el)).toBeNull();
  });

  it('leaves a vacation the filters send themselves to the filters', async () => {
    stored = OWN_VACATION;
    const el = await openPage();
    expect(text(el)).toContain('managesieve.autoReply.ownVacation');
    expect(checkbox(el)).toBeNull();
  });

  it('saves around the filters as they are at the save, not as they were when it opened', async () => {
    stored = mergeAutoReply(block(), FILTERS);
    const el = await openPage();
    // Edited in another tab meanwhile.
    const edited = FILTERS.replace('invoice', 'receipt');
    stored = mergeAutoReply(block(), edited);
    await type(el, field(el, 'subject'), 'Away again');
    await save(el);
    expect(puts).toEqual([mergeAutoReply(block({ subject: 'Away again' }), edited)]);
  });

  it('switches nothing on when the filters have gained a vacation of their own since it opened', async () => {
    stored = FILTERS;
    const el = await openPage();
    stored = OWN_VACATION;
    checkbox(el)!.click();
    await el.updateComplete;
    await type(el, textarea(el), 'Back soon.');
    await save(el);
    expect(puts).toEqual([]);
    expect(text(el)).toContain('managesieve.autoReply.ownVacation');
    expect(text(el)).not.toContain('managesieve.autoReply.errors.saveError');
    expect(checkbox(el)).toBeNull();
  });
});
