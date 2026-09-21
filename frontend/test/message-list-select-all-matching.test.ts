/**
 * The offer to take a whole folder.
 *
 * The header checkbox reaches as far as the page it is drawn over. A folder
 * holds more than that, so once every row on the page is checked the list
 * offers the rest of the folder — and, once the offer is taken, says what is
 * selected and how to stop.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, record, shadow, shadowAll, update } from './helpers/dom';
import { messageKey } from '../src/utils/message-key';
import '../src/components/message-list';

const TAG = 'alps-message-list';
type El = HTMLElement & Record<string, any>;

const message = (uid: string) => ({
  UID: uid,
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.com' }], To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

const page = () => [message('1'), message('2')];
const inInbox = (...uids: string[]) => uids.map(uid => messageKey('INBOX', uid));

/** The banner offering, or reporting, a whole-folder selection. */
function banner(el: El): HTMLElement | undefined {
  return shadowAll(el, 'alps-banner').find(b =>
    /messageList\.(allOnPageSelected|allMatchingSelected)/.test(b.textContent ?? '')) as HTMLElement | undefined;
}

const bannerButton = (el: El) => banner(el)?.querySelector('alps-button') as HTMLElement | undefined;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

/** A folder of five, two of them listed. */
async function list(props: Record<string, unknown> = {}): Promise<El> {
  const el = await mount<El>(TAG, { i18nStore, messages: page(), currentMailbox: 'INBOX', totalMessages: 5 });
  return Object.keys(props).length ? update(el, props) : el;
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('the offer', () => {
  it('is not made until every row on the page is checked', async () => {
    const el = await list({ selectedMessages: new Set(inInbox('1')) });

    expect(banner(el)).toBeUndefined();
  });

  it('is made once they are, and names the folder\'s own total', async () => {
    const el = await list({ selectedMessages: new Set(inInbox('1', '2')) });

    expect(banner(el)!.textContent).toContain('messageList.allOnPageSelected');
    expect(bannerButton(el)!.textContent).toContain('messageList.selectAllMatching');
  });

  it('is not made when the page already holds the whole folder', async () => {
    const el = await list({ selectedMessages: new Set(inInbox('1', '2')), totalMessages: 2 });

    expect(banner(el)).toBeUndefined();
  });

  it('is not made in a search across every folder, which is not a folder', async () => {
    const el = await list({ currentMailbox: '*', selectedMessages: new Set(inInbox('1', '2')) });

    expect(banner(el)).toBeUndefined();
  });

  it('is taken by its button, which asks the page for the folder', async () => {
    const el = await list({ selectedMessages: new Set(inInbox('1', '2')) });
    const asked = record<CustomEvent>(el, 'select-all-matching');

    bannerButton(el)!.click();

    expect(asked).toHaveLength(1);
  });
});

describe('once the folder is selected', () => {
  const whole = { selectAllMatching: true, matchingCount: 5, selectedMessages: new Set(inInbox('1', '2')) };

  it('the banner says how many are selected, and offers the way out', async () => {
    const el = await list(whole);

    expect(banner(el)!.textContent).toContain('messageList.allMatchingSelected');
    expect(bannerButton(el)!.textContent).toContain('messageList.clearSelection');
  });

  it('that way out is taken by the button', async () => {
    const el = await list(whole);
    const cleared = record<CustomEvent>(el, 'clear-selection');

    bannerButton(el)!.click();

    expect(cleared).toHaveLength(1);
  });

  it('and by the header checkbox, which ends the whole selection rather than this page of it', async () => {
    const el = await list(whole);
    const cleared = record<CustomEvent>(el, 'clear-selection');
    const changed = record<CustomEvent>(el, 'selection-changed');
    const all = shadow<HTMLInputElement>(el, '.select-all-checkbox');
    expect(all.checked).toBe(true);

    all.checked = false;
    all.dispatchEvent(new Event('change'));

    expect(cleared).toHaveLength(1);
    expect(changed).toHaveLength(0);
  });
});
