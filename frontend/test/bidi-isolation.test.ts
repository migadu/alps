/**
 * A display name or an address cannot reorder the text around it.
 *
 * A name is whatever the sender wrote, and an RFC 2047 encoded word can carry
 * a direction override such as U+202E. Shown as plain text beside an address
 * or another name, it reversed the rest of the line: the address after it,
 * every recipient after it, the next sender in a list row. Each name is now
 * in an isolate of its own direction, and each address in a left-to-right
 * one, so a Hebrew or Arabic local part does not put the domain first.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/alps-recipient-pill';
import '../src/components/alps-address-input';
import '../src/components/message-list';
import '../src/components/alps-thread-card';
import { cleanup, mount, shadow, shadowAll } from './helpers/dom';

const OVERRIDE = 'Pay‮ments';

/** Every isolate in the element's shadow root, as `[text, dir]`. */
const isolates = (el: HTMLElement) => shadowAll<HTMLElement>(el, 'bdi').map((node) => [node.textContent, node.getAttribute('dir')]);

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('a recipient pill', () => {
  it('isolates the name in its own direction and the address left to right', async () => {
    const el = await mount('alps-recipient-pill', { name: OVERRIDE, address: 'ada@example.test' });
    expect(isolates(el)).toEqual([[OVERRIDE, null], ['ada@example.test', 'ltr']]);
  });

  it.each(['ada@example.test', 'שלום@example.test'])('keeps an address with no name, %s, left to right', async (address) => {
    const el = await mount('alps-recipient-pill', { address });
    expect(isolates(el)).toEqual([[address, 'ltr']]);
  });
});

describe('the address field', () => {
  it('isolates a pill showing a name, and one showing a bare address', async () => {
    const el = await mount('alps-address-input', { addresses: [`"${OVERRIDE}" <ada@example.test>`, 'bob@example.test'] });
    const pills = shadowAll<HTMLElement>(el, '.pill-addr');
    expect([...pills[0].querySelectorAll('bdi')].map((node) => [node.textContent, node.getAttribute('dir')])).toEqual([[OVERRIDE, null]]);
    expect([...pills[1].querySelectorAll('bdi')].map((node) => [node.textContent, node.getAttribute('dir')])).toEqual([['bob@example.test', 'ltr']]);
  });

  it('isolates the name and the address of a suggestion', async () => {
    const el = await mount('alps-address-input', { suggestions: [{ name: OVERRIDE, address: 'ada@example.test' }] });
    const row = shadow(el, '.suggestions-dropdown .item-text');
    expect([...row.querySelectorAll('bdi')].map((node) => [node.textContent, node.getAttribute('dir')]))
      .toEqual([[OVERRIDE, null], ['ada@example.test', 'ltr']]);
  });
});

describe('a list row', () => {
  it('isolates each sender from the next', async () => {
    const message = {
      UID: '1',
      Flags: ['\\Seen'],
      Envelope: {
        From: [{ Name: OVERRIDE, Mailbox: 'ada', Host: 'example.test' }, { Name: '', Mailbox: 'carol', Host: 'example.test' }],
        To: [], Cc: [], Subject: 'Hello', Date: '2026-09-01T10:00:00Z',
      },
    };
    const el = await mount('alps-message-list', { messages: [message], currentMailbox: 'INBOX', totalMessages: 1, showSenderAvatars: false });
    const sender = shadow(el, '.message-sender');
    expect([...sender.querySelectorAll('bdi')].map((node) => [node.textContent, node.getAttribute('dir')]))
      .toEqual([[OVERRIDE, null], ['carol@example.test', 'ltr']]);
    expect(sender.textContent?.replace(/\s+/g, ' ').trim()).toBe(`${OVERRIDE}, carol@example.test`);
  });
});

describe('a thread card', () => {
  const item = (from: unknown) => ({
    message: { UID: '7', Flags: ['\\Seen'], Envelope: { From: [from], To: [], Cc: [], Subject: 'Offer', Date: '2026-09-01T10:00:00Z' } },
    content: 'hello', mimeType: 'text/plain', loading: false, attachments: [], rawMessageHtml: '', hasHtml: false,
    hasText: true, activeBanners: [], allowRemoteResources: false, hasRemoteResources: false, isSent: false,
    mailbox: 'INBOX', expanded: false,
  });

  it('keeps the address under a name left to right', async () => {
    const el = await mount('alps-thread-card', { item: item({ Name: OVERRIDE, Mailbox: 'news', Host: 'brand.test' }), mailbox: 'INBOX' });
    expect(shadow(el, '.thread-card-sender-name').getAttribute('dir')).toBe('auto');
    expect(shadow(el, '.thread-card-sender-address bdi').getAttribute('dir')).toBe('ltr');
  });

  it('keeps an address standing in for a name left to right', async () => {
    const el = await mount('alps-thread-card', { item: item({ Mailbox: 'שלום', Host: 'brand.test' }), mailbox: 'INBOX' });
    const heading = shadow(el, '.thread-card-sender-name bdi');
    expect(heading.getAttribute('dir')).toBe('ltr');
    expect(heading.textContent).toBe('שלום@brand.test');
  });
});
