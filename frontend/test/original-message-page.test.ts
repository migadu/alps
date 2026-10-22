/**
 * The original-message page shows From and To with each name and address in
 * an isolate of its own.
 *
 * They were joined into `Name <address>, …` strings in one table cell, so a
 * direction override in a display name, which an RFC 2047 encoded word can
 * carry, reversed its own address and every recipient after it.
 *
 * postal-mime is replaced here by what it reports for such a message: under
 * jsdom it reads no headers at all.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/original-message-page';
import { cleanup, mount, shadowAll, waitFor } from './helpers/dom';

const OVERRIDE = 'Pay‮ments';

vi.mock('postal-mime', () => ({
  default: class {
    async parse() {
      return {
        headers: [],
        from: { name: OVERRIDE, address: 'ada@example.test' },
        to: [
          { name: 'Bob', address: 'bob@example.test' },
          { name: '', address: 'carol@example.test' },
          { name: 'Team', group: [{ name: 'Dan', address: 'dan@example.test' }] },
        ],
        subject: 'Hello',
        messageId: '<1@example.test>',
        date: '2026-09-01T10:00:00.000Z',
      };
    }
  },
}));

afterEach(() => {
  cleanup();
  window.location.hash = '';
  vi.unstubAllGlobals();
});

const isolated = (cell: Element) => [...cell.querySelectorAll('bdi')].map((node) => [node.textContent, node.getAttribute('dir')]);

describe('the original message page', () => {
  it('isolates each name and address in From and To', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('raw message', { status: 200 })));
    window.location.hash = '#/original?mailbox=INBOX&uid=7';
    const el = await mount<HTMLElement>('original-message-page', {
      i18nStore: Object.assign(new EventTarget(), { t: (key: string) => key }),
    });
    await waitFor(() => !!el.shadowRoot?.querySelector('.metadata-table'), 'the headers');

    const cells = shadowAll(el, '.metadata-table td');
    const from = cells.find((cell) => cell.textContent?.includes('ada@example.test'))!;
    const to = cells.find((cell) => cell.textContent?.includes('bob@example.test'))!;
    expect(isolated(from)).toEqual([[OVERRIDE, null], ['ada@example.test', 'ltr']]);
    expect(isolated(to)).toEqual([
      ['Bob', null], ['bob@example.test', 'ltr'], ['carol@example.test', 'ltr'], ['Dan', null], ['dan@example.test', 'ltr'],
    ]);
    expect(to.textContent?.replace(/\s+/g, ' ').trim())
      .toBe('Bob <bob@example.test>, carol@example.test, Dan <dan@example.test>');
  });
});
