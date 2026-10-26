/**
 * Links in a plain-text body, in the reader and on a conversation's cards.
 *
 * A plain-text body was one text binding in a `<pre>`, so a URL or an address
 * in it could not be clicked, and a `mailto:` link in an HTML body opened the
 * system's mail program. Both places a body is shown link the same things: a
 * message opened alone and the same message in its conversation do not differ
 * in what can be clicked. `linkify.test.ts` and `mailto.test.ts` cover the
 * finder and the parser; this pins the wiring.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import '../src/components/alps-thread-card';
import {
  cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount, shadow, shadowAll, waitFor,
} from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';

type El = HTMLElement & Record<string, any>;

const BODY = 'See https://example.com/a, or write to ada@example.com.\nNot markup: <b>bold</b>';

const message = {
  UID: '7', Mailbox: 'INBOX', Flags: ['\\Seen'],
  Envelope: {
    Subject: 'Engines', Date: '2026-09-01T10:00:00Z',
    From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.com' }],
    To: [{ Name: '', Mailbox: 'me', Host: 'example.com' }], Cc: [],
  },
};

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });
function settingsStore() {
  const state = { enableThreading: false, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true };
  return Object.assign(new EventTarget(), { getState: () => state });
}
const composeStore = () => Object.assign(new EventTarget(), { openComposer: vi.fn() });

/** A plain primary click, as a user's, that crosses the shadow root. */
function click(node: Element): MouseEvent {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, button: 0 });
  node.dispatchEvent(event);
  return event;
}

/**
 * Runs the component's frame `load` handler over a frame holding one `mailto:`
 * link, and clicks it. jsdom does not load `srcdoc`, so the frame is filled by
 * hand and the handler is called the way its `@load` binding calls it.
 */
function clickMailtoInLoadedFrame(el: El): MouseEvent {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.body.innerHTML = '<a href="mailto:ada@example.com?subject=Engines">Ada</a>';
  el.onIframeLoad({ target: iframe } as unknown as Event);
  const view = iframe.contentWindow as unknown as typeof window;
  const event = new view.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  doc.querySelector('a')!.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
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
      if (u.includes('/messages/7/raw')) return new Response(BODY);
      return new Response('{}', { status: 404 });
    }));
  });

  async function reader() {
    const compose = composeStore();
    const el = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore(), i18nStore, composeStore: compose,
      mailbox: 'INBOX', mailboxes: [{ Name: 'INBOX', Attrs: [] }], messages: [message], message,
    });
    await waitFor(() => !!el.shadowRoot?.querySelector('pre.reader-preformatted'), 'the plain-text body');
    return { el, compose };
  }

  it('links the web and email addresses of a plain-text body, and keeps the rest text', async () => {
    const { el } = await reader();
    const links = shadowAll<HTMLAnchorElement>(el, 'pre.reader-preformatted a');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['https://example.com/a', 'mailto:ada@example.com']);
    expect(links[0].getAttribute('target')).toBe('_blank');
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
    expect(shadow(el, 'pre.reader-preformatted').textContent).toBe(BODY);
    expect(shadowAll(el, 'pre.reader-preformatted b')).toHaveLength(0);
  });

  it('opens its composer for an address in the body', async () => {
    const { el, compose } = await reader();
    const event = click(shadow(el, 'pre.reader-preformatted a[href^="mailto:"]'));
    expect(event.defaultPrevented).toBe(true);
    expect(compose.openComposer).toHaveBeenCalledWith({ to: ['ada@example.com'], cc: [] }, { signature: 'below' });
  });

  it('leaves a web link to the browser', async () => {
    const { el, compose } = await reader();
    const web = shadow(el, 'pre.reader-preformatted a[href^="https:"]');
    // jsdom would otherwise try to navigate.
    web.addEventListener('click', (e) => e.preventDefault());
    click(web);
    expect(compose.openComposer).not.toHaveBeenCalled();
  });

  it('opens its composer for a mailto: link in an HTML body', async () => {
    const { el, compose } = await reader();
    expect(clickMailtoInLoadedFrame(el).defaultPrevented).toBe(true);
    expect(compose.openComposer).toHaveBeenCalledWith(
      { to: ['ada@example.com'], cc: [], subject: 'Engines' }, { signature: 'below' });
  });
});

describe("a conversation's card", () => {
  const item = (mimeType: string, content: string) => ({
    message, content, mimeType, loading: false, attachments: [],
    rawMessageHtml: mimeType === 'text/html' ? content : '', hasHtml: mimeType === 'text/html', hasText: mimeType === 'text/plain',
    activeBanners: [], allowRemoteResources: false, hasRemoteResources: false, isSent: false, mailbox: 'INBOX', expanded: true,
  });

  it('links the web and email addresses of a plain-text body, and keeps the rest text', async () => {
    const el = await mount<El>('alps-thread-card', { i18nStore, item: item('text/plain', BODY), mailbox: 'INBOX' });
    const links = shadowAll<HTMLAnchorElement>(el, 'pre.reader-preformatted a');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['https://example.com/a', 'mailto:ada@example.com']);
    expect(links[0].getAttribute('target')).toBe('_blank');
    expect(shadow(el, 'pre.reader-preformatted').textContent).toBe(BODY);
    expect(shadowAll(el, 'pre.reader-preformatted b')).toHaveLength(0);
  });

  it('opens the composer for an address in the body', async () => {
    const compose = composeStore();
    const el = await mount<El>('alps-thread-card', { i18nStore, composeStore: compose, item: item('text/plain', BODY), mailbox: 'INBOX' });
    const event = click(shadow(el, 'pre.reader-preformatted a[href^="mailto:"]'));
    expect(event.defaultPrevented).toBe(true);
    expect(compose.openComposer).toHaveBeenCalledWith({ to: ['ada@example.com'], cc: [] }, { signature: 'below' });
  });

  it('opens the composer for a mailto: link in an HTML body', async () => {
    const compose = composeStore();
    const el = await mount<El>('alps-thread-card', {
      i18nStore, settingsStore: settingsStore(), composeStore: compose, item: item('text/html', '<p>x</p>'), mailbox: 'INBOX',
    });
    expect(clickMailtoInLoadedFrame(el).defaultPrevented).toBe(true);
    expect(compose.openComposer).toHaveBeenCalledWith(
      { to: ['ada@example.com'], cc: [], subject: 'Engines' }, { signature: 'below' });
  });
});
