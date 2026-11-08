/**
 * The Filters page over rules that were edited by hand in the raw editor.
 *
 * Switching to the raw editor hands it the script the rules compile to, and
 * that script carries the rules themselves in a comment. A user who wrote
 * their own rule there and saved left that comment in place, so the page took
 * the script for the visual editor's on the next visit: it showed the rules
 * as they were before the switch, and the raw editor reached from there
 * showed what those compile to. The script that was saved, and that runs,
 * could not be seen or edited, and a save from either editor replaced it.
 *
 * The i18n store answers with the dictionary keys.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextProvider } from '@lit/context';
import { cleanup, shadow, waitFor } from './helpers/dom';
import { i18nContext, type I18nStore } from '../src/store/i18n-store';
import { SieveCompiler } from '../../plugins/managesieve/frontend/sieve-compiler';
import { compileAutoReply, DEFAULT_AUTO_REPLY, mergeAutoReply } from '../../plugins/managesieve/frontend/auto-reply';
import '../../plugins/managesieve/frontend/managesieve-page';

type El = HTMLElement & Record<string, any>;

/** What the raw editor is handed after New Rule and a switch, untouched. */
const COMPILED = SieveCompiler.compile({
  rules: [{
    id: 'new',
    matchType: 'all',
    conditions: [{ field: 'Subject', operator: 'contains', value: '' }],
    actions: [{ type: 'fileinto', value: 'INBOX' }],
  }],
});

/** That text with its rule replaced by one written by hand, and saved. */
const HAND_EDITED = COMPILED.slice(0, COMPILED.indexOf('if ')) + [
  'if header :contains "subject" ["lottery"] {',
  '    discard;',
  '    stop;',
  '}',
  '',
].join('\n');

const AUTO_REPLY = compileAutoReply({ ...DEFAULT_AUTO_REPLY, enabled: true, subject: 'Away', message: 'Back soon.' });

const i18nStore = {
  t: (key: string) => key,
  getIntlLanguage: () => 'en',
  addEventListener: () => {},
  removeEventListener: () => {},
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let stored: string;
let puts: string[];

beforeEach(() => {
  puts = [];
  vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    if (String(url) === '/mailboxes/INBOX') return json(200, { Mailboxes: [] });
    if (String(url) !== '/managesieve/script') throw new Error(`unexpected request to ${String(url)}`);
    if ((init?.method ?? 'GET') === 'PUT') {
      puts.push(JSON.parse(String(init!.body)).content);
      return json(200, { message: 'ok' });
    }
    return json(200, { content: stored, extensions: ['fileinto', 'mailbox', 'vacation'] });
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** The Filters page, inside an i18n provider, once it has read the script. */
async function openFilters(): Promise<El> {
  const root = document.createElement('div');
  new ContextProvider(root, { context: i18nContext, initialValue: i18nStore as unknown as I18nStore });
  document.body.appendChild(root);
  const el = document.createElement('alps-managesieve-page') as El;
  root.appendChild(el);
  await el.updateComplete;
  await waitFor(() => !el.shadowRoot!.querySelector('alps-loader'), 'the script to be read');
  await el.updateComplete;
  return el;
}

describe('the Filters page, over rules edited by hand', () => {
  it('opens the raw editor on the script as it was saved', async () => {
    stored = HAND_EDITED;
    const el = await openFilters();

    expect(el.shadowRoot!.querySelector('alps-visual-editor')).toBeNull();
    const raw = shadow<El>(el, 'alps-raw-editor');
    expect(raw.script).toBe(HAND_EDITED);
    // Nothing to save: it is what the server holds.
    expect(raw.hasUnsavedChanges).toBe(false);
    expect(puts).toEqual([]);
  });

  it('does so beside an auto-reply, which is kept out of the text', async () => {
    stored = mergeAutoReply(AUTO_REPLY, HAND_EDITED);
    const el = await openFilters();

    expect(el.shadowRoot!.querySelector('alps-visual-editor')).toBeNull();
    expect(shadow<El>(el, 'alps-raw-editor').script).toBe(HAND_EDITED);
  });

  it('still opens rules the visual editor wrote, unedited, in the visual editor', async () => {
    for (const script of [COMPILED, mergeAutoReply(AUTO_REPLY, COMPILED)]) {
      stored = script;
      const el = await openFilters();

      expect(el.shadowRoot!.querySelector('alps-raw-editor')).toBeNull();
      expect(shadow<El>(el, 'alps-visual-editor').state).toEqual(SieveCompiler.extractVisualState(COMPILED));
      cleanup();
    }
  });
});
