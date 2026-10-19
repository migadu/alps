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
import '../src/pages/print-page';
import { cleanup, mount, shadow, shadowAll, text, update } from './helpers/dom';
import { generateQuote } from '../src/utils/email-quote';

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

describe('the print page', () => {
  const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });
  const settingsStore = Object.assign(new EventTarget(), { getState: () => ({ showRemoteContent: 'never' }) });
  const print = async (from: unknown) => {
    const el = await mount<HTMLElement & Record<string, any>>('print-page', { settingsStore, i18nStore });
    return update(el, {
      loading: false, error: '', content: 'body', mimeType: 'text/plain',
      message: {
        UID: '7',
        Envelope: {
          Subject: 'Hello', Date: '2026-09-01T10:00:00Z', From: [from],
          To: [{ Name: OVERRIDE, Mailbox: 'ada', Host: 'example.test' }, { Name: '', Mailbox: 'bob', Host: 'example.test' }],
          Cc: [{ Name: 'Carol', Mailbox: 'carol', Host: 'example.test' }],
        },
      },
    });
  };

  it('prints the recipients with their angle brackets, each name and address isolated', async () => {
    const el = await print({ Name: 'Ada', Mailbox: 'ada', Host: 'example.test' });
    expect(text(el, '.print-to-row')).toContain(`${OVERRIDE} <ada@example.test>, bob@example.test`);
    expect(text(el, '.print-to-row')).not.toContain('&lt;');
    expect(text(el, '.print-cc')).toContain('Carol <carol@example.test>');
    expect([...shadow(el, '.print-to-row').querySelectorAll('bdi')].map((node) => [node.textContent, node.getAttribute('dir')]))
      .toEqual([[OVERRIDE, null], ['ada@example.test', 'ltr'], ['bob@example.test', 'ltr'], ['Carol', null], ['carol@example.test', 'ltr']]);
  });

  it("isolates the sender's name and address", async () => {
    const el = await print({ Name: OVERRIDE, Mailbox: 'ada', Host: 'example.test' });
    const line = shadow(el, '.print-meta-row > div');
    expect([...line.querySelectorAll('bdi')].map((node) => [node.textContent, node.getAttribute('dir')]))
      .toEqual([[OVERRIDE, null], ['ada@example.test', 'ltr']]);
    expect(line.textContent?.replace(/\s+/g, ' ').trim()).toBe(`${OVERRIDE} <ada@example.test>`);
  });

  it('prints a sender with no name once, left to right', async () => {
    const el = await print({ Name: '', Mailbox: 'ada', Host: 'example.test' });
    const line = shadow(el, '.print-meta-row > div');
    expect(line.textContent?.replace(/\s+/g, ' ').trim()).toBe('ada@example.test');
    expect(line.querySelector('bdi')?.getAttribute('dir')).toBe('ltr');
  });
});

describe('the quote header', () => {
  const message = (from: Record<string, string>, to: Record<string, string>[] = []) => ({
    Envelope: { Subject: 'Engines', Date: '2024-01-05T14:07:00Z', From: [from], To: to, Cc: [] },
  });
  const bodyText = (html: string) => new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';

  it('keeps right-to-left letters in a quoted name', () => {
    const name = 'שלום مرحبا';
    const q = generateQuote('reply', message({ Name: name, Mailbox: 'ada', Host: 'remote.test' }), 'body', null, false);
    expect(q.quotedText).toContain(`${name} wrote:`);
    expect(q.quotedHtml).toContain(`${name} wrote:`);
  });

  it.each(['reply', 'replyAll', 'forward'] as const)('drops direction controls from the names in a %s header, not from its recipients', (type) => {
    const name = 'Pay\u202e\u2069ments';
    const original = message({ Name: name, Mailbox: 'ada', Host: 'remote.test' }, [{ Name: 'Ali\u202ece', Mailbox: 'alice', Host: 'example.test' }]);
    for (const html of [null, '<p>original body</p>']) {
      const q = generateQuote(type, original, 'original body', html, html !== null);
      expect(q.quotedText).not.toMatch(/\p{Bidi_Control}/u);
      expect(q.quotedHtml).not.toMatch(/\p{Bidi_Control}/u);
      expect(q.quotedText).toContain('Payments');
      if (type === 'forward') expect(q.quotedText).toContain('Alice <alice@example.test>');
      else expect(q.to).toContain(`${name} <ada@remote.test>`);
    }
    expect(original.Envelope.From[0].Name).toBe(name);
  });

  it.each(['reply', 'replyAll', 'forward'] as const)('drops direction controls from the addresses in a %s header, not from where it goes', (type) => {
    const original = message({ Name: 'Ada', Mailbox: 'ada\u202e', Host: 'remote.test' },
      [{ Name: 'Bob', Mailbox: 'bob\u2067', Host: 'remote.test' }, { Name: 'Carol', Mailbox: 'carol', Host: 'remote.test' }]);
    for (const html of [null, '<p>original body</p>']) {
      const q = generateQuote(type, original, 'original body', html, html !== null);
      expect(q.quotedText).not.toMatch(/\p{Bidi_Control}/u);
      expect(q.quotedHtml).not.toMatch(/\p{Bidi_Control}/u);
      if (type === 'forward') {
        expect(q.quotedText).toContain('From: Ada <ada@remote.test>');
        expect(q.quotedText).toContain('To: Bob <bob@remote.test>, Carol <carol@remote.test>');
        expect(bodyText(q.quotedHtml)).toContain('To: Bob <bob@remote.test>, Carol <carol@remote.test>');
      } else {
        expect(q.to).toContain('Ada <ada\u202e@remote.test>');
        if (type === 'replyAll') expect(q.to).toContain('Bob <bob\u2067@remote.test>');
      }
    }
  });
});

