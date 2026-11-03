/**
 * The message list and the folder list keep their scroll position across a
 * tab switch.
 *
 * The mailbox page is kept for the session while Calendar, Contacts or Tasks
 * shows (app-root's `mailboxPage`), taken out of the document in between. A
 * browser drops the scroll offset of an element out of the document, so coming
 * back put both lists at the top. Each list now notes where it was scrolled
 * and goes back there when it is put back.
 *
 * jsdom lays nothing out and keeps no offsets, so a scrollTop that holds what
 * is written to it stands in, and the test zeroes it while the list is out, as
 * the browser does. The e2e spec (mailbox-return.spec.ts) is the real thing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, flush, mount, shadow } from './helpers/dom';
import '../src/components/message-list';
import '../src/components/folder-list';

type El = HTMLElement & Record<string, any> & { updateComplete: Promise<unknown> };

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});
const settingsStore = Object.assign(new EventTarget(), { getState: () => ({}), updateSettings: async () => {} });
const composeStore = Object.assign(new EventTarget(), { getState: () => ({}) });

/** A scroller whose offset is what was last written to it. */
function scrollable(scroller: HTMLElement) {
  let top = 0;
  Object.defineProperty(scroller, 'scrollTop', { configurable: true, get: () => top, set: (v: number) => { top = v; } });
  return {
    get top() { return top; },
    /** Where the user scrolled it, and the scroll event that says so. */
    scrollTo(value: number) {
      top = value;
      scroller.dispatchEvent(new Event('scroll'));
    },
    /** What a browser does to an element taken out of the document. */
    drop() { top = 0; },
  };
}

/** Out of the document while another tab shows, and back. */
async function switchAwayAndBack(el: El, scroller: ReturnType<typeof scrollable>) {
  el.remove();
  scroller.drop();
  document.body.appendChild(el);
  await el.updateComplete;
  await flush();
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ Verdicts: {}, Scope: '1' }), { status: 200 })));
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe('a list put back in the document', () => {
  it('shows the messages where the user left them', async () => {
    const messages = Array.from({ length: 30 }, (_, i) => ({
      UID: String(100 - i),
      Flags: ['\\Seen'],
      Envelope: { From: [{ Name: 'Ana', Mailbox: 'ana', Host: 'example.test' }], To: [], Cc: [], Subject: `message ${i}`, Date: '2026-09-01T10:00:00Z' },
    }));
    const el = await mount<El>('alps-message-list', { messages, currentMailbox: 'INBOX' });
    const rows = scrollable(shadow(el, '.list-content'));
    rows.scrollTo(240);

    await switchAwayAndBack(el, rows);
    expect(rows.top).toBe(240);
  });

  it('shows the folders where the user left them', async () => {
    const mailboxes = Array.from({ length: 30 }, (_, i) => ({ Name: `Folder ${i}`, Attrs: [], Delimiter: '/' }));
    const el = await mount<El>('alps-folder-list', { i18nStore, settingsStore, composeStore, mailboxes });
    const folders = scrollable(shadow(el, '.sidebar-content'));
    folders.scrollTo(180);

    await switchAwayAndBack(el, folders);
    expect(folders.top).toBe(180);
  });
});
