/**
 * How much of the mailbox's storage is used: a section of the account menu,
 * display only. Opening the menu and carrying the urgency on its avatar are
 * the menu's (user-profile-menu-storage.test.ts).
 *
 * Two states here are easy to render wrongly and impossible to notice:
 *
 *  - **No limit is not a zero limit.** A mail server without quotas, or with
 *    none on storage, holds as much as it is given. A bar drawn for it, at 0%
 *    or at any share, says something about the mailbox that is not so: the
 *    section draws nothing at all.
 *  - **The words and the warning must agree.** The percentage is rounded
 *    down, and the severity read from it: a mailbox 94.9% full reads "94%"
 *    and warns, rather than reading "95%" and not being critical.
 *
 * And the section stays quiet when it cannot read the figures: they are
 * informational, and a failed read must not take the menu with it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { messageSync } from '../src/services/message-sync';
import { fetchWithTimeout } from '../src/utils/fetch-utils';
import { I18nStore } from '../src/store/i18n-store';
import '../src/components/alps-storage-usage';
import type { StorageChange } from '../src/components/alps-storage-usage';
import { cleanup, flush, mount, record, shadow, shadowAll, text, waitFor } from './helpers/dom';

type Section = HTMLElement & { updateComplete: Promise<unknown>; refresh: (force?: boolean) => Promise<void> };

const MB = 1024 * 1024;

/** What GET /quota answers next: a body, a status, or a pending answer. */
let answer: () => Promise<Response>;
const fetchMock = vi.fn(async (url: RequestInfo | URL) => (String(url) === '/quota' ? answer() : new Response('{}', { status: 404 })));
const reads = () => fetchMock.mock.calls.filter(([url]) => String(url) === '/quota').length;

function quota(body: unknown, status = 200) {
  answer = async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
const limited = (used: number, limit: number) => quota({ supported: true, used, limit });

/** Mounts the section and lets its first read land. */
async function section(): Promise<Section> {
  const el = await mount<Section>('alps-storage-usage', { i18nStore: new I18nStore() });
  await settled(el, 1);
  return el;
}

/** Waits for the reads of the quota to number `count`, and the last to land. */
async function settled(el: Section, count: number) {
  await waitFor(() => reads() >= count, `read ${count} of the quota`);
  await flush();
  await flush();
  await el.updateComplete;
}

/** Mounts the section, recording every `storage-change` from the first. */
async function recorded(): Promise<{ el: Section; changes: CustomEvent<StorageChange>[] }> {
  const el = document.createElement('alps-storage-usage') as Section;
  (el as unknown as { i18nStore: I18nStore }).i18nStore = new I18nStore();
  const changes = record<CustomEvent<StorageChange>>(el, 'storage-change');
  document.body.appendChild(el);
  await settled(el, 1);
  return { el, changes };
}

const severity = (el: HTMLElement) => el.getAttribute('severity') ?? '';

beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
  limited(10 * MB, 100 * MB);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('with a storage limit', () => {
  it('shows what is used of the limit, and the share', async () => {
    limited(25 * MB, 100 * MB);
    const el = await section();
    expect(text(el, '.label')).toBe('25 MB of 100 MB used 25%');
  });

  it('isolates each size, for a right-to-left sentence around it', async () => {
    const el = await section();
    expect(shadowAll(el, '.used bdi').map((b) => b.textContent)).toEqual(['10 MB', '100 MB']);
  });

  it('draws the fill in proportion', async () => {
    limited(25 * MB, 100 * MB);
    const el = await section();
    expect(shadow(el, '.fill').style.width).toBe('25%');
  });

  it('stays neutral below the warning', async () => {
    limited(79, 100);
    const el = await section();
    expect(severity(el)).toBe('');
    expect(shadow(el, '.fill').className).not.toMatch(/warn|critical/);
  });

  it('warns from 80%', async () => {
    limited(80, 100);
    const el = await section();
    expect(severity(el)).toBe('warn');
    expect(shadow(el, '.fill').classList.contains('warn')).toBe(true);
  });

  it('is critical from 95%', async () => {
    limited(95, 100);
    const el = await section();
    expect(severity(el)).toBe('critical');
    expect(shadow(el, '.fill').classList.contains('critical')).toBe(true);
  });

  it('rounds the share down, so the words and the warning agree', async () => {
    limited(949, 1000);
    const el = await section();
    expect(text(el, '.percent')).toBe('94%');
    expect(severity(el)).toBe('warn');
  });

  it('shows a mailbox over its limit as full, not past it', async () => {
    // A limit lowered under what is stored leaves the mailbox over it, and a
    // fill wider than its track spills out of the menu.
    limited(150, 100);
    const el = await section();
    expect(shadow(el, '.fill').style.width).toBe('100%');
    expect(text(el, '.percent')).toBe('100%');
    expect(severity(el)).toBe('critical');
  });

  it('offers nothing to focus: the menu arrows over it', async () => {
    const el = await section();
    expect(shadowAll(el, 'button, a, [tabindex]')).toHaveLength(0);
  });
});

describe('without a storage limit', () => {
  it.each([
    ['a server without quotas', { supported: false }],
    ['quotas, none on storage', { supported: true }],
    ['a limit of 0', { supported: true, used: 10, limit: 0 }],
  ])('draws nothing for %s', async (_, body) => {
    quota(body);
    const { el, changes } = await recorded();
    expect(text(el)).toBe('');
    expect(shadowAll(el, '.track')).toHaveLength(0);
    expect(severity(el)).toBe('');
    expect(changes.at(-1)?.detail.shown ?? false).toBe(false);
  });

  it('does not ask a server without quotas again', async () => {
    // Its capabilities do not change under a session: news of mail, and
    // opening the menu, would each ask it for an answer it has given.
    quota({ supported: false });
    const el = await section();
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);
    messageSync.dispatchEvent(new CustomEvent('sync-success', { detail: {} }));
    await el.refresh(true);
    expect(reads()).toBe(1);
  });

  it('keeps asking a server whose quotas limit no storage, which may set a limit', async () => {
    quota({ supported: true });
    const el = await section();
    limited(50, 100);
    await el.refresh(true);
    await el.updateComplete;
    expect(text(el, '.percent')).toBe('50%');
  });
});

describe('when the figures cannot be read', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('draws nothing rather than throwing', async () => {
    quota({ error: 'server_error' }, 500);
    const el = await section();
    expect(text(el)).toBe('');
  });

  it('keeps the figures it had', async () => {
    const el = await section();
    quota({ error: 'forbidden' }, 403);
    await el.refresh(true);
    await el.updateComplete;
    expect(text(el, '.label')).toBe('10 MB of 100 MB used 10%');
  });

  it('reads again a minute later, not at every folder opened', async () => {
    quota({ error: 'forbidden' }, 403);
    const el = await section();
    messageSync.dispatchEvent(new CustomEvent('sync-success', { detail: {} }));
    expect(reads()).toBe(1);

    limited(50, 100);
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);
    messageSync.dispatchEvent(new CustomEvent('sync-success', { detail: {} }));
    await settled(el, 2);
    expect(text(el, '.percent')).toBe('50%');
  });
});

describe('refreshing', () => {
  it('reads once on mount', async () => {
    await section();
    expect(reads()).toBe(1);
  });

  it('waits for the page’s own requests before its first read', async () => {
    // The figures are for the avatar, and nobody waits on them; a mail
    // server without background connections answers them on the
    // connection the page's listing needs.
    let release!: () => void;
    const listing = new Promise<Response>((resolve) => { release = () => resolve(new Response('{}')); });
    fetchMock.mockImplementationOnce(() => listing);
    const pending = fetchWithTimeout('/mailboxes/INBOX');
    const el = await mount<Section>('alps-storage-usage', { i18nStore: new I18nStore() });
    await flush();
    expect(reads()).toBe(0);

    release();
    await pending;
    await settled(el, 1);
    expect(reads()).toBe(1);
  });

  it('reads again on news of mail once the figures are a minute old', async () => {
    const el = await section();
    limited(90, 100);
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);
    messageSync.dispatchEvent(new CustomEvent('sync-success', { detail: {} }));
    await settled(el, 2);
    expect(text(el, '.percent')).toBe('90%');
  });

  it.each(['inbox-counts', 'folder-counts'])('counts %s as news of mail', async (type) => {
    const el = await section();
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);
    messageSync.dispatchEvent(new CustomEvent(type, { detail: {} }));
    await settled(el, 2);
  });

  it('does not read again on news within the minute', async () => {
    await section();
    messageSync.dispatchEvent(new CustomEvent('sync-success', { detail: {} }));
    await flush();
    expect(reads()).toBe(1);
  });

  it('takes a listing shown from memory for no news', async () => {
    await section();
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);
    messageSync.dispatchEvent(new CustomEvent('sync-success', { detail: { kept: true } }));
    await flush();
    expect(reads()).toBe(1);
  });

  it('reads whatever the figures’ age when forced, as the menu does when it opens', async () => {
    const el = await section();
    await el.refresh(true);
    expect(reads()).toBe(2);
  });

  it('asks once for two reads at the same time', async () => {
    const el = await section();
    await Promise.all([el.refresh(true), el.refresh(true)]);
    expect(reads()).toBe(2);
  });

  it('stops listening once removed', async () => {
    // The header, and the menu in it, is drawn again for every page: a
    // listener kept would read the quota once per page ever shown.
    const el = await section();
    el.remove();
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);
    messageSync.dispatchEvent(new CustomEvent('sync-success', { detail: {} }));
    await flush();
    expect(reads()).toBe(1);
  });
});

describe('urgency', () => {
  it('is announced with the share, and whether there are figures', async () => {
    limited(85, 100);
    const { changes } = await recorded();
    expect(changes.at(-1)?.detail).toEqual({ severity: 'warn', percent: 85, shown: true });
  });

  it('is announced again only when it changes', async () => {
    limited(10, 100);
    const { el, changes } = await recorded();
    const before = changes.length;
    await el.refresh(true);
    await el.updateComplete;
    expect(changes).toHaveLength(before);

    limited(96, 100);
    await el.refresh(true);
    await el.updateComplete;
    expect(changes.slice(before).map((e) => e.detail.severity)).toEqual(['critical']);
  });
});
