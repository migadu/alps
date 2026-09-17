/**
 * A collapsed thread is one row for the whole conversation, so its star is the
 * conversation's: lit while any message in it is starred. It used to show its
 * newest message's star alone, so a star put on an older message — from the
 * open conversation, or before the reply arrived — vanished from the list the
 * moment the thread collapsed over it.
 *
 * The row also says what it stands for when its star is pressed, because only
 * the list knows which threads are collapsed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, record, shadowAll, update } from './helpers/dom';
import '../src/components/message-list';

const TAG = 'alps-message-list';
type El = HTMLElement & Record<string, any>;

const FLAGGED = '\\Flagged';

const message = (uid: string, flags: string[]) => ({
  UID: uid,
  Flags: flags,
  Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.com' }], To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

const thread = (rootFlags: string[], subFlags: string[]) => ({
  ...message('9', rootFlags),
  SubMessages: [message('5', subFlags)],
});

const rowFor = (el: El, uid: string) =>
  shadowAll(el, '.message-item').find(r => r.textContent?.includes(`message ${uid}`))!;

const starOf = (row: Element) => row.querySelector('.star-btn') as HTMLElement;

async function list(rootFlags: string[], subFlags: string[]): Promise<El> {
  return mount<El>(TAG, { messages: [thread(rootFlags, subFlags)], currentMailbox: 'INBOX', totalMessages: 1 });
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('a thread row\'s star', () => {
  it('is lit while collapsed over a starred older message', async () => {
    const el = await list(['\\Seen'], ['\\Seen', FLAGGED]);

    expect(rowFor(el, '9').classList).toContain('starred');
    expect(starOf(rowFor(el, '9')).classList).toContain('starred');
  });

  it('is out when none of it is starred', async () => {
    const el = await list(['\\Seen'], ['\\Seen']);

    expect(rowFor(el, '9').classList).not.toContain('starred');
  });

  it('is only its own once expanded, beside the older message\'s own row', async () => {
    const el = await list(['\\Seen'], ['\\Seen', FLAGGED]);
    await update(el, { expandedThreads: new Set(['9']) });

    expect(rowFor(el, '9').classList).not.toContain('starred');
    expect(rowFor(el, '5').classList).toContain('starred');
  });

  it('says it stands for the whole thread when pressed collapsed', async () => {
    const el = await list(['\\Seen'], ['\\Seen', FLAGGED]);
    const pressed = record<CustomEvent>(el, 'toggle-star-message');

    starOf(rowFor(el, '9')).click();

    expect(pressed).toHaveLength(1);
    expect(String(pressed[0].detail.message.UID)).toBe('9');
    expect(pressed[0].detail.messages.map((m: any) => String(m.UID))).toEqual(['9', '5']);
  });

  it('says it stands for one message when pressed expanded, on either row', async () => {
    const el = await list(['\\Seen'], ['\\Seen']);
    await update(el, { expandedThreads: new Set(['9']) });
    const pressed = record<CustomEvent>(el, 'toggle-star-message');

    starOf(rowFor(el, '9')).click();
    starOf(rowFor(el, '5')).click();

    expect(pressed.map(e => e.detail.messages.map((m: any) => String(m.UID)))).toEqual([['9'], ['5']]);
  });
});
