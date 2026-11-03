/**
 * A toast nobody can see is a toast nobody was told about.
 *
 * Most of what alps reports, it reports as a toast: a move with its Undo, a
 * draft that could not be saved, a send that failed, a calendar that did not
 * load. None of it reached a screen reader. alps-toast has no live region,
 * and the shell had none either, so each message was there only for someone
 * looking at that corner of the screen.
 *
 * The shell reads them out from two regions that are always in the page: a
 * live region has to exist before its text changes, and a toast is created
 * with its text. A failure (`type: 'error'`) interrupts; anything else waits
 * its turn. Several callers already said which of their toasts were failures,
 * and the shell dropped it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/app-root';
import { cleanup, mount, waitFor } from './helpers/dom';
import { readSources } from './helpers/sources';

// See floating-composer-send.test.ts: the picker builds its grid on connect.
vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const SOURCES = readSources();
const APP_ROOT = SOURCES['src/components/app-root.ts'];

const region = (root: El, role: 'status' | 'alert') =>
  root.shadowRoot!.querySelector(`.toast-announce[role="${role}"]`)?.textContent?.trim() ?? '';

function toast(detail: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('show-toast', { detail }));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('toast announcements', () => {
  it('has both regions in the page before any toast', async () => {
    const root = await mount<El>('app-root');
    for (const role of ['status', 'alert'] as const) {
      const live = root.shadowRoot!.querySelector(`.toast-announce[role="${role}"]`);
      expect(live, role).not.toBeNull();
      expect(live!.getAttribute('aria-live')).toBe(role === 'status' ? 'polite' : 'assertive');
      expect(live!.textContent!.trim()).toBe('');
    }
  });

  it('hides them without taking them out of the accessibility tree', () => {
    // display: none and visibility: hidden both remove the node from that
    // tree, the one thing a live region cannot afford.
    const rule = /\.toast-announce\s*\{([\s\S]*?)\}/.exec(APP_ROOT);
    expect(rule).toBeTruthy();
    expect(rule![1]).not.toMatch(/display:\s*none|visibility:\s*hidden/);
    expect(rule![1]).toMatch(/clip-path:\s*inset\(50%\)/);
  });

  it('keeps them outside the route view, which goes inert under Settings', async () => {
    const root = await mount<El>('app-root');
    const shadow = root.shadowRoot!;
    expect(shadow.querySelectorAll('.toast-announce')).toHaveLength(2);
    expect(shadow.querySelector('.route-view .toast-announce')).toBeNull();
  });

  it('reads a failure out at once', async () => {
    const root = await mount<El>('app-root');
    toast({ message: 'Could not save this draft', type: 'error' });
    await waitFor(() => region(root, 'alert') === 'Could not save this draft', 'the assertive region');
    expect(region(root, 'status')).toBe('');
  });

  it('reads a second toast that says the same again', async () => {
    // A live region speaks when its content changes. The same words set again
    // change nothing, so the second "Message moved to Trash" went unsaid.
    const root = await mount<El>('app-root');
    const textOf = () => [...root.shadowRoot!.querySelector('[role="status"]')!.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
    toast({ message: 'Message moved to Trash' });
    await waitFor(() => region(root, 'status') === 'Message moved to Trash', 'the first toast');
    const first = textOf();
    toast({ message: 'Message moved to Trash' });
    await waitFor(() => textOf() !== first, 'the second toast drawn anew');
    expect(region(root, 'status')).toBe('Message moved to Trash');
  });

  it('reads anything else out in turn', async () => {
    const root = await mount<El>('app-root');
    toast({ message: 'Message moved to Trash', actionLabel: 'Undo', actionFn: () => {} });
    await waitFor(() => region(root, 'status') === 'Message moved to Trash', 'the polite region');
    expect(region(root, 'alert')).toBe('');
  });

  it('reads a toast named by its key in the language shown', async () => {
    const root = await mount<El>('app-root');
    toast({ i18nKey: 'general.pageLoadFailed', type: 'error' });
    await waitFor(() => region(root, 'alert') !== '', 'the assertive region');
    expect(region(root, 'alert')).toBe(root.i18nStore.t('general.pageLoadFailed'));
  });

  it('reads the newest of several', async () => {
    const root = await mount<El>('app-root');
    toast({ message: 'Older' });
    toast({ message: 'Newer' });
    await waitFor(() => region(root, 'status') === 'Newer', 'the newest toast');
  });

  it('says nothing more about a toast on its way out', async () => {
    // `show` false is the 0.3s exit; reading it again as it leaves would say
    // every message twice.
    const root = await mount<El>('app-root');
    toast({ message: 'Leaving' });
    await waitFor(() => region(root, 'status') === 'Leaving', 'the toast');
    root.shadowRoot!.querySelector('alps-toast')!.dispatchEvent(new CustomEvent('dismiss'));
    await root.updateComplete;
    expect(region(root, 'status')).toBe('');
  });
});

/**
 * What says it is a failure.
 *
 * Read from the sources: a toast whose message names a failure (a key or a
 * fallback that says failed, error, could not, a conflict, someone not told)
 * is raised as `type: 'error'`, so a new one written like the old ones is
 * not read out as news.
 */
describe('failure toasts', () => {
  const FAILURE = /Failed|failed|Error\b|error\b|[Cc]ould not|Conflict|notTold|endBeforeStart|mismatch|Mismatch|fillAll|folderExists|attachmentsGone|notFound|NotFound/;

  /** Each `show-toast` detail, and each call of a component's own toast helper. */
  const raised = Object.entries(SOURCES).flatMap(([path, src]) => [
    ...[...src.matchAll(/new CustomEvent\('show-toast',\s*\{\s*detail:\s*\{[\s\S]*?\}\s*,?\s*\}\)\)/g)].map((m) => ({ path, text: m[0] })),
    ...[...src.matchAll(/this\.(?:toast|showGlobalToast)\((?!type|message|key|e\.detail)[^;]*;/g)].map((m) => ({ path, text: m[0] })),
  ]);

  it('found the toasts, so an empty list cannot pass', () => {
    expect(raised.length).toBeGreaterThan(50);
  });

  it('are raised as errors', () => {
    const quiet = raised
      .filter(({ text }) => FAILURE.test(text.replace(/\/\/.*$/gm, '')) && !/'error'/.test(text))
      .map(({ path, text }) => `${path}: ${text.replace(/\s+/g, ' ').slice(0, 120)}`);
    expect(quiet).toEqual([]);
  });

  it('carry their type through the mail page, which relays the lists’ toasts', () => {
    const page = SOURCES['src/pages/mailbox-page.ts'];
    expect(page).toMatch(/_relayToast = \(e: CustomEvent\) => \{\s*this\.showGlobalToast\([^;]*e\.detail\.type\)/);
    expect(page).toMatch(/detail: \{ message, actionLabel, actionFn, duration, type \}/);
  });
});
