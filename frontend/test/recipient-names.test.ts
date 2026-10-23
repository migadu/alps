/**
 * A recipient whose name holds a comma, a quote or a backslash.
 *
 * The composer sends each recipient field as one string, its recipients
 * joined by commas, and the server reads it as an address list. A name is
 * part of that syntax: written bare, "Lovelace, Ada" is two recipients, the
 * first with no address, and the message could be neither sent nor saved as
 * a draft. Wherever a recipient is written from a name and an address, the
 * name is quoted when it holds such a character, and a quote or a backslash
 * in it is escaped.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount, shadow, shadowAll,
} from './helpers/dom';
import { registry } from '../src/plugin-registry';
import { formatAddrs, generateQuote } from '../src/utils/email-quote';
import { parseWrittenAddress, writtenAddress } from '../src/utils/address-display';
import { MessageCache } from '../src/utils/message-cache';
import '../src/components/alps-address-input';
import '../src/components/message-reader';
import '../../plugins/carddav/frontend/contact-view';
import { addressOfPerson, personFromAddress } from '../../plugins/caldav/frontend/calendar-service';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

/**
 * Answers the reader's read of a message with a text body. Edit draft opens
 * a draft only from its body, and refuses one it could not read.
 */
function answerBodies() {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (/\/messages\/\d+\?view=/.test(String(url))
    ? new Response(JSON.stringify({ Part: { Path: [1], MIMEType: 'text/plain' }, Body: 'Notes', HasText: true }), { status: 200 })
    : new Response('{}', { status: 404 }))));
}

const person = (Name: string, Mailbox: string) => ({ Name, Mailbox, Host: 'example.test' });

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  registry.hooks = new Map();
  registry.enabledPlugins = null;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('a recipient written from an envelope', () => {
  it.each(['=?x?q?a?=', '=?UTF-8?Q?Ada?=', 'Ada =? Test', '=?oops'])(
    'quotes the literal encoded-word-like name %s without interpreting it', (name) => {
      const recipient = writtenAddress(name, 'ada@example.test');
      expect(recipient).toBe(`"${name}" <ada@example.test>`);
      expect(parseWrittenAddress(recipient)).toEqual({ name, email: 'ada@example.test' });
    },
  );

  it('quotes a name that holds a comma, a quote, a backslash or another special', () => {
    expect(formatAddrs([
      person('Lovelace, Ada', 'ada'),
      person('Jane "JJ" Doe', 'jj'),
      person('Back\\slash', 'slash'),
      person('Hopper; Grace', 'grace'),
      person('Charles <the elder>', 'charles'),
      person('Ada Lovelace', 'ada'),
      person('', 'bob'),
    ])).toEqual([
      '"Lovelace, Ada" <ada@example.test>',
      '"Jane \\"JJ\\" Doe" <jj@example.test>',
      '"Back\\\\slash" <slash@example.test>',
      '"Hopper; Grace" <grace@example.test>',
      '"Charles <the elder>" <charles@example.test>',
      'Ada Lovelace <ada@example.test>',
      'bob@example.test',
    ]);
  });

  it('answers a sender named "Lovelace, Ada" with the name in quotes', () => {
    const message = {
      Envelope: {
        Subject: 'Engines',
        From: [person('Lovelace, Ada', 'ada')],
        To: [person('Me', 'me')],
        Cc: [person('Hopper, Grace', 'grace')],
      },
    };
    const quote = generateQuote('replyAll', message, 'Hello', null, false, 'YYYY-MM-DD', '24', ['me@example.test']);
    expect(quote.to).toEqual(['"Lovelace, Ada" <ada@example.test>']);
    expect(quote.cc).toEqual(['"Hopper, Grace" <grace@example.test>']);
  });

  it('reopens a draft with its recipients written the same way', async () => {
    const draft = {
      UID: '7',
      Mailbox: 'Drafts',
      Flags: ['\\Seen', '\\Draft'],
      Envelope: {
        Subject: 'Engines',
        Date: '2026-09-02T10:00:00Z',
        From: [person('', 'me')],
        To: [person('Lovelace, Ada', 'ada'), person('', 'bob')],
        Cc: [person('Jane "JJ" Doe', 'jj')],
        Bcc: [person('Hopper, Grace', 'grace')],
      },
    };
    const state = { enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true };
    answerBodies();
    const composeStore = { openComposer: vi.fn() };
    const el = await mount<El>('alps-message-reader', {
      settingsStore: Object.assign(new EventTarget(), { getState: () => state }),
      i18nStore,
      composeStore,
      mailbox: 'Drafts',
      mailboxes: [],
      messages: [draft],
      message: draft,
    });

    await el._handleEditDraft();

    expect(composeStore.openComposer).toHaveBeenCalledWith(expect.objectContaining({
      to: ['"Lovelace, Ada" <ada@example.test>', 'bob@example.test'],
      cc: ['"Jane \\"JJ\\" Doe" <jj@example.test>'],
      bcc: ['"Hopper, Grace" <grace@example.test>'],
    }));
  });
});

describe('a recipient picked from the suggestions', () => {
  type AddressInput = El & { addresses: string[] };

  async function suggest(name: string): Promise<AddressInput> {
    vi.useFakeTimers();
    registry.registerHook('composer:suggest', async () => [{ name, address: 'jj@example.test' }]);
    const el = await mount<AddressInput>('alps-address-input', { i18nStore });
    const input = shadow<HTMLInputElement>(el, 'input');
    input.value = 'jj';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await vi.advanceTimersByTimeAsync(300);
    await el.updateComplete;
    return el;
  }

  const caption = (el: El) => shadow(el, '.pill .pill-addr').textContent?.trim();

  it('quotes an encoded-word-like contact name and shows it literally', async () => {
    const el = await suggest('=?x?q?a?=');
    shadow<HTMLButtonElement>(el, '.dropdown-item').click();
    await el.updateComplete;

    expect(el.addresses).toEqual(['"=?x?q?a?=" <jj@example.test>']);
    expect(caption(el)).toBe('=?x?q?a?=');
  });

  it('escapes a quote in the name, and the pill shows the name as written', async () => {
    const el = await suggest('Jane "JJ" Doe');
    shadow<HTMLButtonElement>(el, '.dropdown-item').click();
    await el.updateComplete;

    expect(el.addresses).toEqual(['"Jane \\"JJ\\" Doe" <jj@example.test>']);
    expect(caption(el)).toBe('Jane "JJ" Doe');
  });

  it('escapes a backslash in the name, picked with the keyboard', async () => {
    const el = await suggest('Back\\slash, J.');
    const input = shadow<HTMLInputElement>(el, 'input');
    for (const key of ['ArrowDown', 'Enter']) {
      input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }));
      await el.updateComplete;
    }

    expect(el.addresses).toEqual(['"Back\\\\slash, J." <jj@example.test>']);
    expect(caption(el)).toBe('Back\\slash, J.');
    expect(shadowAll(el, '.pill')).toHaveLength(1);
  });

  it('gives a guest picked from them the name as written', async () => {
    // The event and task editors take guests from the same field, and save
    // each pill as a guest's address and name.
    for (const name of ['Jane "JJ" Doe', 'Back\\slash']) {
      const el = await suggest(name);
      shadow<HTMLButtonElement>(el, '.dropdown-item').click();
      await el.updateComplete;
      expect(personFromAddress(el.addresses[0])).toEqual({ email: 'jj@example.test', name });
      cleanup();
      registry.hooks = new Map();
    }
  });
});

describe('a guest already on an event', () => {
  it('keeps a backslash in the name through the guest field', () => {
    const pill = addressOfPerson({ email: 'slash@example.test', name: 'Back\\slash' });
    expect(pill).toBe('"Back\\\\slash" <slash@example.test>');
    expect(personFromAddress(pill)).toEqual({ email: 'slash@example.test', name: 'Back\\slash' });
  });
});

describe('a contact written to from its card', () => {
  it('addresses the contact under its name, quoted and escaped', async () => {
    const composeStore = { openComposer: vi.fn() };
    const el = await mount<El>('alps-contact-view', {
      i18nStore,
      composeStore,
      settingsStore: { getState: () => ({}) },
      contact: { name: 'Lovelace, Ada "Countess"', emails: [{ value: 'ada@example.test' }] },
    });

    shadow<HTMLAnchorElement>(el, 'a[href^="mailto:"]').click();

    expect(composeStore.openComposer).toHaveBeenCalledWith({ to: ['"Lovelace, Ada \\"Countess\\"" <ada@example.test>'] });
  });
});
