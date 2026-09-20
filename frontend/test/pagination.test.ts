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
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount, shadow, text } from './helpers/dom';
import '../src/components/alps-pagination';
import { AlpsPagination } from '../src/components/alps-pagination';

const TAG = 'alps-pagination';
const DASH = '–';

afterEach(() => cleanup());

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
