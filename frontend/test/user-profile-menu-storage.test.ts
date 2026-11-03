/**
 * Storage in the account menu.
 *
 * The figures are a section of the menu, on every page, above Sign out. What
 * a section inside a menu cannot do is be seen while the menu is closed, and
 * a mailbox about to refuse mail must not say so only from in there: the
 * avatar carries a badge from 80%, a larger one marked "!" from 95%, and the
 * menu's button says the same in its name, which is what a screen reader
 * reads when focus lands on it. The badge is not told apart by colour alone.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/user-profile-menu';
import { I18nStore } from '../src/store/i18n-store';
import { cleanup, flush, mount, shadow, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

let body: unknown = { supported: true, used: 10, limit: 100 };
const fetchMock = vi.fn(async (url: RequestInfo | URL) => (String(url) === '/quota'
  ? new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
  : new Response('{}', { status: 404 })));
const reads = () => fetchMock.mock.calls.filter(([url]) => String(url) === '/quota').length;

const store = (extra: Record<string, unknown> = {}) => Object.assign(new EventTarget(), extra);

/** The menu, with its section's first read landed. */
async function menu(): Promise<El> {
  const el = await mount<El>('user-profile-menu', {
    i18nStore: new I18nStore(),
    settingsStore: store({ getState: () => ({ name: 'Ada' }) }),
    linkedAccountsStore: store({ getAccounts: () => [], isInitialized: () => true, fetchAccounts: () => {} }),
    username: 'ada@example.com',
  });
  await waitFor(() => reads() > 0, 'the first read of the quota');
  await flush();
  await flush();
  await section(el).updateComplete;
  await el.updateComplete;
  return el;
}

const section = (el: El) => shadow<El>(el, 'alps-storage-usage');
const badge = (el: El) => el.shadowRoot!.querySelector<HTMLElement>('.storage-badge');
const trigger = (el: El) => shadow<El>(el, 'alps-icon-btn[slot="trigger"]');
/** The popup's children in order, by what they are. */
const layout = (el: El) => [...shadow(el, 'alps-popup').children]
  .filter((n) => n.getAttribute('slot') !== 'trigger')
  .map((n) => n.localName === 'alps-storage-usage' ? 'storage'
    : n.classList.contains('dropdown-divider') ? '—'
      : n.querySelector('.item-text')?.textContent?.trim());

beforeEach(() => {
  body = { supported: true, used: 10, limit: 100 };
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the storage section', () => {
  it('is in the menu, above Sign out, with a divider of its own', async () => {
    const el = await menu();
    expect(layout(el)).toEqual(['Settings', '—', 'storage', '—', 'Sign Out']);
  });

  it('withdraws with its divider when there is no limit to show', async () => {
    body = { supported: false };
    const el = await menu();
    expect(layout(el)).toEqual(['Settings', '—', 'storage', 'Sign Out']);
  });

  it('reads fresh figures when the menu opens', async () => {
    const el = await menu();
    const before = reads();
    shadow<El>(el, 'alps-popup').open();
    await waitFor(() => reads() > before, 'a read on opening');
  });
});

describe('the urgency, while the menu is closed', () => {
  it.each([0, 10])('warns about prohibited storage with usage %s and a zero limit', async used => {
    body = { supported: true, used, limit: 0 };
    const el = await menu();
    expect(badge(el)?.textContent?.trim()).toBe('!');
    expect(trigger(el).title).toContain('Mailbox 100% full');
  });

  it('shows nothing while storage is fine', async () => {
    const el = await menu();
    expect(badge(el)).toBeNull();
    expect(trigger(el).title).toBe('Profile options');
  });

  it('shows nothing for a mailbox without a limit', async () => {
    body = { supported: true };
    const el = await menu();
    expect(badge(el)).toBeNull();
    expect(trigger(el).title).toBe('Profile options');
  });

  it('badges the avatar from 80%, and says so in the button’s name', async () => {
    body = { supported: true, used: 85, limit: 100 };
    const el = await menu();
    expect(badge(el)?.classList.contains('critical')).toBe(false);
    expect(badge(el)?.textContent?.trim()).toBe('');
    expect(trigger(el).title).toBe('Profile options (Mailbox 85% full)');
  });

  it('marks the badge from 95%, and says that mail may be refused', async () => {
    body = { supported: true, used: 97, limit: 100 };
    const el = await menu();
    expect(badge(el)?.classList.contains('critical')).toBe(true);
    // Larger and marked, not only another colour.
    expect(badge(el)?.textContent?.trim()).toBe('!');
    expect(trigger(el).title).toBe('Profile options (Mailbox 97% full: new mail may be refused)');
  });

  it('leaves the badge to the button for assistive technology', async () => {
    // The badge is not focusable; read as well, the state would be said twice.
    body = { supported: true, used: 85, limit: 100 };
    const el = await menu();
    expect(badge(el)?.getAttribute('aria-hidden')).toBe('true');
    expect(badge(el)?.title).toBe('Mailbox 85% full');
  });

  it('goes once the mailbox has room again', async () => {
    body = { supported: true, used: 97, limit: 100 };
    const el = await menu();
    body = { supported: true, used: 40, limit: 100 };
    await section(el).refresh(true);
    await section(el).updateComplete;
    await el.updateComplete;
    expect(badge(el)).toBeNull();
    expect(trigger(el).title).toBe('Profile options');
  });
});
