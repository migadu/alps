/**
 * A message runs the way its author wrote it, whatever the interface's
 * language.
 *
 * Mail in Arabic, Hebrew or Persian was laid out left to right like the rest
 * of the page: a plain-text body, a subject and a sender's name each took the
 * page's direction, so a right-to-left line was left-aligned and its
 * punctuation landed at the wrong end.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import '../src/components/alps-thread-card';
import '../src/components/message-list';
import '../src/pages/print-page';
import {
  cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount, shadow, shadowAll, update, waitFor,
} from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';

type El = HTMLElement & Record<string, any>;

const ARABIC = 'مرحبًا بالعالم';

const envelope = {
  Subject: ARABIC,
  Date: '2026-09-01T10:00:00Z',
  From: [{ Name: 'سارة', Mailbox: 'sara', Host: 'example.com' }],
  To: [{ Name: '', Mailbox: 'me', Host: 'example.com' }],
  Cc: [],
};
const message = { UID: '7', Mailbox: 'INBOX', Flags: ['\\Seen'], Envelope: envelope };

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });
function settingsStore() {
  const state = { enableThreading: false, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true };
  return Object.assign(new EventTarget(), { getState: () => state });
}

/** The component's own stylesheet, as text. */
function stylesOf(tag: string): string {
  const styles = (customElements.get(tag) as unknown as { styles: unknown }).styles;
  return [styles].flat(Infinity).map((s) => (s as { cssText: string }).cssText).join('\n');
}

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the reader', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const u = String(url);
      if (/\/messages\/7\?view=/.test(u)) {
        return new Response(JSON.stringify({ Message: message, Part: { Path: [1], MIMEType: 'text/plain' }, HasText: true, Attachments: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (u.includes('/messages/7/raw')) return new Response(`${ARABIC}\nHello`);
      return new Response('{}', { status: 404 });
    }));
  });

  it('lays out each paragraph of a plain-text body by its own first letter', async () => {
    const el = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore(), i18nStore, composeStore: new EventTarget(),
      mailbox: 'INBOX', mailboxes: [{ Name: 'INBOX', Attrs: [] }], messages: [message], message,
    });
    await waitFor(() => !!el.shadowRoot?.querySelector('pre.reader-preformatted'), 'the plain-text body');
    expect(shadow(el, 'pre.reader-preformatted').getAttribute('dir')).toBe('auto');
    expect(stylesOf('alps-message-reader')).toMatch(/\.reader-preformatted\s*\{[^}]*unicode-bidi:\s*plaintext/);
  });

  it('isolates the subject and gives the sender name its own direction', async () => {
    const el = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore(), i18nStore, composeStore: new EventTarget(),
      mailbox: 'INBOX', mailboxes: [{ Name: 'INBOX', Attrs: [] }], messages: [message], message,
    });
    await waitFor(() => !!el.shadowRoot?.querySelector('.reader-subject'), 'the header');
    expect(shadow(el, '.reader-subject bdi').textContent).toBe(ARABIC);
    expect(shadow(el, '.reader-sender-name').getAttribute('dir')).toBe('auto');
  });
});

describe('a thread card', () => {
  const item = (expanded: boolean) => ({
    message, content: `${ARABIC}\nHello`, mimeType: 'text/plain', loading: false, attachments: [],
    rawMessageHtml: '', hasHtml: false, hasText: true, activeBanners: [],
    allowRemoteResources: false, hasRemoteResources: false, isSent: false, mailbox: 'INBOX', expanded,
  });

  it('gives a plain-text body, the snippet and the sender name their own direction', async () => {
    const collapsed = await mount<El>('alps-thread-card', { item: item(false), mailbox: 'INBOX' });
    expect(shadow(collapsed, '.thread-card-snippet').getAttribute('dir')).toBe('auto');
    expect(shadow(collapsed, '.thread-card-sender-name').getAttribute('dir')).toBe('auto');

    const expanded = await mount<El>('alps-thread-card', { item: item(true), mailbox: 'INBOX' });
    expect(shadow(expanded, 'pre.reader-preformatted').getAttribute('dir')).toBe('auto');
    expect(stylesOf('alps-thread-card')).toMatch(/\.reader-preformatted\s*\{[^}]*unicode-bidi:\s*plaintext/);
  });
});

describe('the message list', () => {
  it.each(['loose', 'ultra-compact'])('gives each subject its own direction in the %s list', async (densityMode) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    const el = await mount<El>('alps-message-list', {
      messages: [message], currentMailbox: 'INBOX', totalMessages: 1, showSenderAvatars: false, densityMode,
    });
    const subjects = shadowAll(el, '.message-subject');
    expect(subjects).toHaveLength(1);
    expect(subjects[0].getAttribute('dir')).toBe('auto');
  });
});

describe('the print page', () => {
  it('prints a plain-text body and the subject in their own direction', async () => {
    const el = await mount<El>('print-page', { settingsStore: settingsStore(), i18nStore });
    await update(el, { loading: false, error: '', message, content: `${ARABIC}\nHello`, mimeType: 'text/plain' });
    const body = shadow(el, '.print-body pre');
    expect(body.getAttribute('dir')).toBe('auto');
    expect(body.style.unicodeBidi).toBe('plaintext');
    expect(shadow(el, '.print-header h2 bdi').textContent).toBe(ARABIC);
  });
});
