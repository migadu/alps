/**
 * What the pager says it is showing.
 *
 * The range used to be computed from an ASSUMED page length —
 * `(currentPage + 1) * itemsPerPage` — so any page that came back short
 * numbered itself as if the missing rows were there. Threading makes that
 * ordinary rather than exotic: the server pages thread GROUPS, and a group
 * whose representative the FETCH did not return is dropped from the page.
 * The count now describes the rows actually on screen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, shadow, text, update } from './helpers/dom';
import '../src/components/alps-pagination';
import '../src/components/message-list';
import { AlpsPagination } from '../src/components/alps-pagination';

const TAG = 'alps-pagination';
const DASH = '–';

/** The pager's text, which lives in its own shadow root inside the list's. */
const pagerText = (list: HTMLElement) => text(shadow(list, 'alps-pagination'), '.pagination-text');

/** A page of n listed rows, as the server hands them down. */
const rows = (n: number) => Array.from({ length: n }, (_, i) => ({
  UID: String(1000 - i),
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Ana', Mailbox: 'ana', Host: 'example.test' }], To: [], Cc: [], Subject: `message ${i}`, Date: '2026-09-01T10:00:00Z' },
}));

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ Verdicts: {}, Scope: '1' }), { status: 200 })));
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe('the range it names', () => {
  it('ends the range at the last row it has, not at a full page', async () => {
    // Page two of 200, holding 37 rows rather than the 50 it asked for.
    const el = await mount(TAG, {
      currentPage: 1, itemsPerPage: 50, currentCount: 37, totalItems: 200,
    });
    expect(text(el, '.pagination-text')).toBe(`51${DASH}87 of 200`);
  });

  it('does not run past the total on the last page', async () => {
    const el = await mount(TAG, {
      currentPage: 3, itemsPerPage: 50, currentCount: 20, totalItems: 170,
    });
    expect(text(el, '.pagination-text')).toBe(`151${DASH}170 of 170`);
  });

  it('states a folder total when the one page is the whole folder', async () => {
    const el = await mount(TAG, {
      currentPage: 0, itemsPerPage: 50, currentCount: 12, totalItems: 12,
    });
    expect(text(el, '.pagination-text')).toBe('12 total');
  });

  it('calls a search a count of results, not a claim about the folder', async () => {
    const el = await mount(TAG, {
      currentPage: 0, itemsPerPage: 50, currentCount: 12, totalItems: 12, isSearch: true,
    });
    expect(text(el, '.pagination-text')).toBe('12 results');
  });

  it('shows a bare range when nobody counted the whole of it', async () => {
    // totalItems 0 beside rows on screen means "not counted", and "of 0" would
    // be a claim the caller never made.
    const el = await mount(TAG, {
      currentPage: 1, itemsPerPage: 50, currentCount: 50, totalItems: 0,
    });
    expect(text(el, '.pagination-text')).toBe(`51${DASH}100`);
  });

  it('says nothing is there when the page is empty', async () => {
    const el = await mount(TAG, { currentPage: 0, itemsPerPage: 50, currentCount: 0, totalItems: 0 });
    expect(text(el, '.pagination-text')).toBe('0 messages');
  });
});

describe('while the next page is loading', () => {
  /**
   * The rows are left on screen while the next page is fetched — the list
   * shows them under an overlay rather than flashing empty. So the page
   * number and the rows disagree for the length of the request, and the
   * pager must not compose a claim out of the two halves and then correct
   * itself when the answer lands.
   */
  it('keeps naming the page the rows came from, not the one being fetched', async () => {
    const el = await mount('alps-message-list', {
      messages: rows(50),
      listedPage: 0,
      currentPage: 0,
      totalMessages: 200,
      messagesPerPage: 50,
      currentMailbox: 'INBOX',
    });
    expect(pagerText(el)).toBe(`1${DASH}50 of 200`);

    // Next pressed: the hash moved, the fetch is out, the old rows are still up.
    await update(el, { currentPage: 1, loading: true });
    expect(pagerText(el)).toBe(`1${DASH}50 of 200`);

    // The answer: 37 rows, and the page they belong to, in one update.
    await update(el, { messages: rows(37), listedPage: 1, loading: false });
    expect(pagerText(el)).toBe(`51${DASH}87 of 200`);
  });
});

describe('the arrows', () => {
  it('disables Previous on the first page and Next on the last', async () => {
    const first = await mount(TAG, {
      currentPage: 0, itemsPerPage: 50, currentCount: 50, totalItems: 120,
    });
    expect(shadow(first, 'alps-icon-btn[icon="caretLeft"]').hasAttribute('disabled')).toBe(true);
    expect(shadow(first, 'alps-icon-btn[icon="caretRight"]').hasAttribute('disabled')).toBe(false);

    const last = await mount(TAG, {
      currentPage: 2, itemsPerPage: 50, currentCount: 20, totalItems: 120,
    });
    expect(shadow(last, 'alps-icon-btn[icon="caretLeft"]').hasAttribute('disabled')).toBe(false);
    expect(shadow(last, 'alps-icon-btn[icon="caretRight"]').hasAttribute('disabled')).toBe(true);
  });
});

describe('where it sits', () => {
  /**
   * jsdom lays nothing out, so the stylesheet itself is the only witness. The
   * count belongs beside the arrows at the end of the toolbar: stretching the
   * host and centring the text inside it put the two halves of one control at
   * opposite ends of the free space.
   */
  it('is sized by its content and pushed to the end, with the text beside the arrows', () => {
    // Comments out first: they talk ABOUT the layout this once rendered,
    // and an assertion that reads them is matching prose, not rules.
    const css = AlpsPagination.styles.toString().replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
    expect(css).toContain('margin-left: auto');
    expect(css).not.toContain('margin: 0 auto');
    expect(css).not.toMatch(/:host \{[^}]*flex: 1/);
  });
});
