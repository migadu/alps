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
import { settingsContext, SettingsStore } from '../src/store/settings-store';
import '../src/components/settings-window';
import { MessageCache } from '../src/utils/message-cache';
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
const settingsState = { ...new SettingsStore().getState(), loginUsername: ADDRESS };
const settingsStore = Object.assign(new EventTarget(), { getState: () => settingsState });

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

  it('does not re-keep the old account edit when sign-out precedes disconnection', async () => {
    stored = mergeAutoReply(reply(), FILTERS);
    const left = await openPage();
    await typeMessage(left, 'Private reply from the old account.');
    window.dispatchEvent(new CustomEvent('session-cleared'));
    left.remove();

    const nextAccount = await openPage();
    expect(textarea(nextAccount).value).toBe('Back soon.');
  });

  it('keeps newer typing if a save finishes after leaving', async () => {
    stored = mergeAutoReply(reply(), FILTERS);
    const left = await openPage();
    await typeMessage(left, 'Sent to the server.');
    let finish!: () => void;
    const waiting = new Promise<void>(resolve => { finish = resolve; });
    const { managesieveService } = await import('../../plugins/managesieve/frontend/managesieve-service');
    vi.spyOn(managesieveService, 'saveAutoReply').mockImplementation(async value => {
      await waiting;
      stored = mergeAutoReply(reply(value), FILTERS);
    });
    const saving = left.save();
    await typeMessage(left, 'Newer typing, still unsaved.');
    left.remove();
    finish();
    await saving;

    const back = await openPage();
    expect(textarea(back).value).toBe('Newer typing, still unsaved.');
    expect(saveButton(back).hasAttribute('disabled')).toBe(false);
  });

  it('keeps newer typing when Forward restores it before the old save finishes', async () => {
    stored = mergeAutoReply(reply(), FILTERS);
    const left = await openPage();
    await typeMessage(left, 'Sent to the server.');
    let finish!: () => void;
    const waiting = new Promise<void>(resolve => { finish = resolve; });
    const { managesieveService } = await import('../../plugins/managesieve/frontend/managesieve-service');
    vi.spyOn(managesieveService, 'saveAutoReply').mockImplementation(async value => {
      await waiting;
      stored = mergeAutoReply(reply(value), FILTERS);
    });
    const saving = left.save();
    await typeMessage(left, 'Newer typing, still unsaved.');
    left.remove();
    const middle = await openPage();
    expect(textarea(middle).value).toBe('Newer typing, still unsaved.');
    finish();
    await saving;
    middle.remove();
    const back = await openPage();
    expect(textarea(back).value).toBe('Newer typing, still unsaved.');
    expect(saveButton(back).hasAttribute('disabled')).toBe(false);
  });

  it('re-reads a stale response that was fetched before the pending save completed', async () => {
    stored = reply();
    const left = await openPage();
    await typeMessage(left, 'Sent to the server.');
    const { managesieveService } = await import('../../plugins/managesieve/frontend/managesieve-service');
    const previous = await managesieveService.fetchAutoReply();
    let finishSave!: () => void;
    const savingGate = new Promise<void>(resolve => { finishSave = resolve; });
    vi.spyOn(managesieveService, 'saveAutoReply').mockImplementation(async value => {
      await savingGate;
      stored = reply(value);
    });
    const saving = left.save();
    await typeMessage(left, 'Typing after the sent snapshot.');
    left.remove();
    let finishRead!: (value: typeof previous) => void;
    const readingGate = new Promise<typeof previous>(resolve => { finishRead = resolve; });
    const fetchReply = vi.spyOn(managesieveService, 'fetchAutoReply').mockReturnValueOnce(readingGate);
    const visiting = openPage();
    await waitFor(() => fetchReply.mock.calls.length > 0, 'the next visit to read');
    finishSave();
    await saving;
    finishRead(previous);
    const back = await visiting;
    expect(textarea(back).value).toBe('Typing after the sent snapshot.');
    expect(back.stored.message).toBe('Sent to the server.');
  });

  it('uses a fresh server baseline after an external change back to an earlier reply', async () => {
    const original = mergeAutoReply(reply(), FILTERS);
    stored = original;
    const left = await openPage();
    const { managesieveService } = await import('../../plugins/managesieve/frontend/managesieve-service');
    vi.spyOn(managesieveService, 'saveAutoReply').mockImplementation(async value => {
      stored = mergeAutoReply(reply(value), FILTERS);
    });
    await typeMessage(left, 'A successful own save.');
    await left.save();
    left.remove();
    stored = original;
    const changed = await openPage();
    await typeMessage(changed, 'Typed over the fresh server reply.');
    changed.remove();
    const back = await openPage();
    expect(textarea(back).value).toBe('Typed over the fresh server reply.');
  });

  it('does not retain a previous account after the no-reload second-factor switch teardown', async () => {
    stored = reply();
    const left = await openPage();
    await typeMessage(left, 'Old account private reply.');
    MessageCache.clear(); // The linked-account second-factor switch uses this path.
    left.remove();
    const next = await openPage();
    expect(textarea(next).value).toBe('Back soon.');
  });

  it('leaves an edit available when a transient visit fails to load', async () => {
    stored = reply();
    const left = await openPage();
    await typeMessage(left, 'Kept through a failed read.');
    left.remove();
    const { managesieveService } = await import('../../plugins/managesieve/frontend/managesieve-service');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchReply = vi.spyOn(managesieveService, 'fetchAutoReply').mockRejectedValueOnce(new Error('offline'));
    const failed = await openPage();
    expect(failed.loadFailed).toBe(true);
    failed.remove();
    fetchReply.mockRestore();
    const back = await openPage();
    expect(textarea(back).value).toBe('Kept through a failed read.');
  });

  it('keeps the draft after a refused save and an unguarded exit', async () => {
    stored = reply();
    const left = await openPage();
    await typeMessage(left, 'Still unsaved after a failed write.');
    const { managesieveService } = await import('../../plugins/managesieve/frontend/managesieve-service');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(managesieveService, 'saveAutoReply').mockRejectedValue(new Error('write refused'));
    await left.save();
    left.remove();
    const back = await openPage();
    expect(textarea(back).value).toBe('Still unsaved after a failed write.');
    expect(saveButton(back).hasAttribute('disabled')).toBe(false);
  });

  it('does not let an old session save rebase the next account retained edit', async () => {
    stored = reply();
    const left = await openPage();
    await typeMessage(left, 'Old account save.');
    let finish!: () => void;
    const gate = new Promise<void>(resolve => { finish = resolve; });
    const { managesieveService } = await import('../../plugins/managesieve/frontend/managesieve-service');
    vi.spyOn(managesieveService, 'saveAutoReply').mockImplementation(async () => { await gate; });
    const saving = left.save();
    window.dispatchEvent(new CustomEvent('session-cleared'));
    left.remove();
    const next = await openPage();
    await typeMessage(next, 'The next account private edit.');
    next.remove();
    finish();
    await saving;
    const back = await openPage();
    expect(textarea(back).value).toBe('The next account private edit.');
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

  for (const visual of [false, true]) {
    it(`does not restore ${visual ? 'visual' : 'raw'} edits over an unrelated server change`, async () => {
      stored = visual ? RULES : FILTERS;
      const left = await openFilters();
      if (visual) {
        const editor = shadow<El>(left, 'alps-visual-editor');
        await editor.updateComplete;
        editor.dispatchEvent(new CustomEvent('state-changed', { detail: { state: { rules: [] } } }));
      } else left.handleRawScriptChange({ detail: { script: FILTERS + '# retained edit\n' } });
      await left.updateComplete;
      left.remove();
      stored = visual ? RULES.replace('invoice', 'external change') : FILTERS + '# external change\n';
      const next = await openFilters();
      expect(next.script).toBe(stored);
      expect(next.hasUnsavedChanges).toBe(false);
    });

    it(`does not re-keep ${visual ? 'visual' : 'raw'} filters after session teardown`, async () => {
      stored = visual ? RULES : FILTERS;
      const left = await openFilters();
      if (visual) {
        const editor = shadow<El>(left, 'alps-visual-editor');
        await editor.updateComplete;
        editor.dispatchEvent(new CustomEvent('state-changed', { detail: { state: { rules: [] } } }));
      } else left.handleRawScriptChange({ detail: { script: FILTERS + '# old account\n' } });
      await left.updateComplete;
      window.dispatchEvent(new CustomEvent('session-cleared'));
      left.remove();
      const next = await openFilters();
      expect(next.script).toBe(stored);
      expect(next.hasUnsavedChanges).toBe(false);
    });

    it(`keeps newer ${visual ? 'visual' : 'raw'} edits if a save finishes after Back`, async () => {
      stored = visual ? RULES : FILTERS;
      const left = await openFilters();
      const { managesieveService } = await import('../../plugins/managesieve/frontend/managesieve-service');
      let finish!: () => void;
      const waiting = new Promise<void>(resolve => { finish = resolve; });
      vi.spyOn(managesieveService, 'saveScript').mockImplementation(async script => {
        await waiting;
        stored = script;
        return { autoReplyOn: false };
      });
      let saving: Promise<unknown>;
      if (visual) {
        const rules = { rules: [] };
        left.handleVisualStateChange({ detail: { state: rules } });
        await left.updateComplete;
        saving = left.saveVisual();
        left.handleVisualStateChange({ detail: { state: SieveCompiler.extractVisualState(RULES) } });
      } else {
        const editor = shadow<El>(left, 'alps-raw-editor');
        editor.script = FILTERS + '# sent\n';
        left.handleRawScriptChange({ detail: { script: editor.script } });
        saving = editor.save();
        editor.script += '# newer typing\n';
        left.handleRawScriptChange({ detail: { script: editor.script } });
      }
      await left.updateComplete;
      const expected = visual ? left.visualState : left.script;
      left.remove();
      finish();
      await saving;
      const back = await openFilters();
      expect(visual ? back.visualState : back.script).toEqual(expected);
      expect(back.hasUnsavedChanges).toBe(true);
    });
  }
});

describe('explicit Discard in the Settings window', () => {
  for (const kind of ['auto-reply', 'raw filters', 'visual filters']) {
    it(`does not retain discarded ${kind}`, async () => {
      stored = kind === 'auto-reply' ? reply() : kind === 'raw filters' ? FILTERS : RULES;
      const root = document.createElement('div');
      new ContextProvider(root, { context: i18nContext, initialValue: i18nStore as unknown as I18nStore });
      new ContextProvider(root, { context: settingsContext, initialValue: settingsStore as any });
      document.body.appendChild(root);
      const win = document.createElement('settings-window') as El;
      root.appendChild(win);
      await win.updateComplete;
      const tag = kind === 'auto-reply' ? 'alps-auto-reply-page' : 'alps-managesieve-page';
      const section = document.createElement(tag) as El;
      shadow(win, '.settings-content-wrapper').appendChild(section);
      await section.updateComplete;
      await waitFor(() => !section.loading && !section.isLoading, 'the section to load');
      await section.updateComplete;
      if (kind === 'auto-reply') section.edit({ message: 'Explicitly discarded reply.' });
      else if (kind === 'raw filters') section.handleRawScriptChange({ detail: { script: FILTERS + '# discarded\n' } });
      else {
        const editor = shadow<El>(section, 'alps-visual-editor');
        await editor.updateComplete;
        editor.dispatchEvent(new CustomEvent('state-changed', { detail: { state: { rules: [] } } }));
      }
      await section.updateComplete;
      expect(section.hasUnsavedChanges).toBe(true);
      win.addEventListener('settings-close', () => win.remove());
      shadow<HTMLElement>(win, '.close-btn').click();
      await win.updateComplete;
      shadow<El>(win, 'ui-confirm').dispatchEvent(new CustomEvent('confirm'));
      expect(win.isConnected).toBe(false);

      const back = document.createElement(tag) as El;
      root.appendChild(back);
      await back.updateComplete;
      await waitFor(() => !back.loading && !back.isLoading, 'the section to reload');
      await back.updateComplete;
      expect(back.hasUnsavedChanges).toBe(false);
      if (kind === 'auto-reply') expect(back.draft.message).toBe('Back soon.');
      if (kind === 'raw filters') expect(back.script).toBe(FILTERS);
      if (kind === 'visual filters') expect(back.visualState).toEqual(SieveCompiler.extractVisualState(RULES));
    });
  }
});
