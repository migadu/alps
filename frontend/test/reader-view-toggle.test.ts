/**
 * The Plaintext and HTML toggles, while a read of the same message is out.
 *
 * Each toggle reads the bodies in hand again in the other view, and the two
 * reads of one card could finish in either order. A late HTML pass wrote its
 * fields into the card one at a time and painted the reader with them, over
 * the Plaintext the user had switched to since.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import { cleanup, flush, installMatchMedia, installResizeObserver, installScrollIntoView, mount, waitFor } from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';
import { registry } from '../src/plugin-registry';

type El = HTMLElement & Record<string, any>;

const message = {
  UID: '5',
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: { Subject: 'Engines', Date: '2026-09-01T10:00:00Z', From: [{ Name: '', Mailbox: 'charles', Host: 'example.com' }], To: [], Cc: [], MessageID: 'five@example.com' },
};

function settingsStore() {
  const state = { enableThreading: true, preferredView: 'html', showRemoteContent: 'never', showSenderAvatars: true };
  return Object.assign(new EventTarget(), { getState: () => state });
}

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

/** Lets the HTML pass that is being held through the content hook. */
let releaseHtml: (() => void) | null;
let holdHtml: boolean;
const hook = async (payload: { isHtml: boolean; content: string }) => {
  if (payload.isHtml && holdHtml) await new Promise<void>(resolve => { releaseHtml = resolve; });
  return payload.content;
};

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
  releaseHtml = null;
  holdHtml = false;
  registry.registerHook('reader:content', hook);
  // Both views read already, so the toggles go to the cache and the only
  // thing that can hold a read up is the hook.
  MessageCache.set('INBOX', '5', 'html', {
    Message: message, Part: { Path: [2], MIMEType: 'text/html' }, Attachments: [],
    RawHtml: '<p>html body <img src="https://tracker.example/p.gif"></p>', HasHTML: true, HasText: true,
  });
  MessageCache.set('INBOX', '5', 'text', {
    Message: message, Part: { Path: [1], MIMEType: 'text/plain' }, Attachments: [],
    RawText: 'plain text body', HasHTML: true, HasText: true,
  });
});

afterEach(() => {
  releaseHtml?.();
  const handlers = registry.hooks.get('reader:content') ?? [];
  registry.hooks.set('reader:content', handlers.filter(entry => entry.handler !== hook));
  cleanup();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const open = () => mount<El>('alps-message-reader', {
  settingsStore: settingsStore(),
  i18nStore,
  composeStore: new EventTarget(),
  mailbox: 'INBOX',
  mailboxes: [{ Name: 'INBOX', Attrs: [] }],
  messages: [message],
  message,
});

describe('switching to Plaintext while the HTML read is out', () => {
  it('shows the text, and the HTML read that lands after it changes nothing', async () => {
    holdHtml = true;
    const el = await open();
    await waitFor(() => releaseHtml !== null, 'the HTML read to reach the content hook');

    await el._handleAction('showPlaintext');
    expect(el.mimeType).toBe('text/plain');
    expect(el.content).toBe('plain text body');

    releaseHtml!();
    await flush();
    await el.updateComplete;
    expect(el.mimeType).toBe('text/plain');
    expect(el.content).toBe('plain text body');
    expect(el.threadItems.map((item: any) => item.mimeType)).toEqual(['text/plain']);
  });
});

describe("switching a card to Plaintext while the card's HTML read is out", () => {
  it('keeps the text when the HTML read lands after it', async () => {
    holdHtml = true;
    const el = await open();
    await waitFor(() => releaseHtml !== null, 'the HTML read to reach the content hook');

    // The card's own menu, which does not wait for the read it starts.
    el._handleActionForItem('showPlaintext', el.threadItems[0]);
    await waitFor(() => el.content === 'plain text body', 'the text');

    releaseHtml!();
    await flush();
    await el.updateComplete;
    expect(el.mimeType).toBe('text/plain');
    expect(el.content).toBe('plain text body');
    expect(el.threadItems[0].content).toBe('plain text body');
  });
});

describe('a body switched from HTML to Plaintext', () => {
  it('no longer offers to load remote content it does not have', async () => {
    const el = await open();
    await waitFor(() => el.mimeType === 'text/html' && !el.loading, 'the HTML body');
    expect(el.hasRemoteResources).toBe(true);

    await el._handleAction('showPlaintext');
    expect(el.content).toBe('plain text body');
    expect(el.hasRemoteResources).toBe(false);
    expect(el.threadItems[0].hasRemoteResources).toBe(false);
  });
});
