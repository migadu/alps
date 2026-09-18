/**
 * Checking rows in a search across every folder.
 *
 * Such a search lists messages from several folders, and a UID is unique only
 * within its own: INBOX and Sent can each hold a message 5. The list checked
 * rows by UID alone, so checking one checked both, and what it told the page
 * could not say which folder either was in.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, record, shadow, shadowAll, update } from './helpers/dom';
import { messageKey } from '../src/utils/message-key';
import '../src/components/message-list';

const TAG = 'alps-message-list';
type El = HTMLElement & Record<string, any>;

const message = (mailbox: string, uid: string) => ({
  UID: uid,
  Mailbox: mailbox,
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.com' }], To: [], Cc: [], Subject: `${mailbox} ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

/** Two messages 5, in different folders, and one more. */
const results = () => [message('INBOX', '5'), message('Sent', '5'), message('Sent', '6')];

const rowFor = (el: El, subject: string) =>
  shadowAll(el, '.message-item').find(r => r.textContent?.includes(subject))!;
const boxFor = (el: El, subject: string) => rowFor(el, subject).querySelector<HTMLInputElement>('.message-checkbox')!;
const sorted = (keys: Iterable<string>) => Array.from(keys).sort();

async function search(props: Record<string, unknown> = {}): Promise<El> {
  const el = await mount<El>(TAG, { messages: results(), currentMailbox: '*', filterQuery: 'engines', totalMessages: 3 });
  return Object.keys(props).length ? update(el, props) : el;
}

async function check(el: El, subject: string) {
  rowFor(el, subject).querySelector<HTMLElement>('.checkbox-col')!.click();
  await el.updateComplete;
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('a search across every folder', () => {
  it('draws every row, though two carry the same UID', async () => {
    const el = await search();

    expect(shadowAll(el, '.message-item')).toHaveLength(3);
  });

  it('checks one row of two with the same UID, and tells the page its folder', async () => {
    const el = await search();
    const heard = record<CustomEvent>(el, 'selection-changed');

    await check(el, 'INBOX 5');

    expect(sorted(heard.at(-1)!.detail.selectedKeys)).toEqual([messageKey('INBOX', '5')]);
    expect(boxFor(el, 'INBOX 5').checked).toBe(true);
    expect(boxFor(el, 'Sent 5').checked).toBe(false);
    expect(rowFor(el, 'Sent 5').classList).not.toContain('active');
  });

  it('selects every row, each in its own folder', async () => {
    const el = await search();
    const all = shadow<HTMLInputElement>(el, '.select-all-checkbox');

    all.checked = true;
    all.dispatchEvent(new Event('change'));
    await el.updateComplete;

    expect(sorted(el.selectedMessages)).toEqual(sorted([
      messageKey('INBOX', '5'), messageKey('Sent', '5'), messageKey('Sent', '6'),
    ]));
    expect(shadow<HTMLInputElement>(el, '.select-all-checkbox').checked).toBe(true);
  });

  it('is not all selected while the other message 5 is not', async () => {
    const el = await search({ selectedMessages: new Set([messageKey('INBOX', '5'), messageKey('Sent', '6')]) });

    expect(shadow<HTMLInputElement>(el, '.select-all-checkbox').checked).toBe(false);
  });

  it('keeps a checked row that is still listed when the other message 5 goes', async () => {
    const el = await search({ selectedMessages: new Set([messageKey('INBOX', '5'), messageKey('Sent', '5')]) });
    const heard = record<CustomEvent>(el, 'selection-changed');

    await update(el, { messages: [message('Sent', '5'), message('Sent', '6')] });

    expect(sorted(heard.at(-1)!.detail.selectedKeys)).toEqual([messageKey('Sent', '5')]);
  });

  it('marks the open message\'s row alone', async () => {
    const el = await search({ selectedMessage: message('Sent', '5') });

    expect(rowFor(el, 'Sent 5').classList).toContain('active');
    expect(rowFor(el, 'INBOX 5').classList).not.toContain('active');
  });
});
