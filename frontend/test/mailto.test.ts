/**
 * `mailto:` links open alps's composer.
 *
 * A `mailto:` in a message went to whatever handler the browser or the
 * operating system had registered, which is usually some other mail program,
 * or nothing. The parser is RFC 6068, narrowed: a link in someone else's mail
 * may suggest visible recipients, a subject and a body, all of which the user
 * sees before sending, and nothing else (no Bcc, no attachments, no
 * In-Reply-To).
 *
 * The click handler takes over exactly the clicks it should: a plain primary
 * click on a `mailto:` it can parse. A modified click still reaches the system
 * handler, and a link it cannot parse is left to the browser rather than
 * swallowed.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/alps-message-composer';
import type { AlpsMessageComposer } from '../src/components/alps-message-composer';
import { interceptMailtoClicks, mailtoComposerData, openMailtoFromClick, parseMailto } from '../src/utils/mailto';
import { cleanup, mount } from './helpers/dom';

afterEach(cleanup);

describe('parseMailto', () => {
  it('reads the recipients from the path', () => {
    expect(parseMailto('mailto:ada@example.com,bob@example.com')).toEqual({
      to: ['ada@example.com', 'bob@example.com'],
      cc: [],
    });
  });

  it('reads to, cc, subject and body from the query', () => {
    expect(
      parseMailto('mailto:ada@example.com?to=bob@example.com&cc=carol@example.com&subject=Hi%20there&body=Line%201%0D%0ALine%202'),
    ).toEqual({
      to: ['ada@example.com', 'bob@example.com'],
      cc: ['carol@example.com'],
      subject: 'Hi there',
      body: 'Line 1\nLine 2',
    });
  });

  it('never prefills Bcc', () => {
    // The one recipient the others never see: a sender's link could copy
    // the sender on the user's reply to someone else, unnoticed.
    expect(parseMailto('mailto:ada@example.com?bcc=eve@example.com&BCC=eve2@example.com')).toEqual({
      to: ['ada@example.com'],
      cc: [],
    });
  });

  it('keeps a comma inside quotes in one recipient', () => {
    expect(parseMailto('mailto:%22last%2Cfirst%22@example.com,bob@example.com')?.to).toEqual([
      '"last,first"@example.com',
      'bob@example.com',
    ]);
    expect(parseMailto('mailto:?cc=%22Doe%2C%20Jo%22%20%3Cjo@example.com%3E,%22a%5C%22%2Cb%22@example.com')?.cc).toEqual([
      '"Doe, Jo" <jo@example.com>',
      '"a\\",b"@example.com',
    ]);
  });

  it('allows a link with no recipient', () => {
    expect(parseMailto('mailto:?subject=Share')).toEqual({ to: [], cc: [], subject: 'Share' });
  });

  it('is case-insensitive in the scheme and field names', () => {
    expect(parseMailto('MAILTO:ada@example.com?SUBJECT=x')?.subject).toBe('x');
  });

  it('keeps + literal, as RFC 6068 says', () => {
    expect(parseMailto('mailto:ada+news@example.com?subject=a+b')).toMatchObject({
      to: ['ada+news@example.com'],
      subject: 'a+b',
    });
  });

  it('decodes percent-encoded addresses', () => {
    expect(parseMailto('mailto:ada%2Bnews@example.com')?.to).toEqual(['ada+news@example.com']);
  });

  it('ignores every other header field', () => {
    const parsed = parseMailto('mailto:ada@example.com?attach=/etc/passwd&in-reply-to=%3Cx%40y%3E&from=eve@example.com');
    expect(parsed).toEqual({ to: ['ada@example.com'], cc: [] });
  });

  it('takes the first of a repeated subject', () => {
    expect(parseMailto('mailto:?subject=one&subject=two')?.subject).toBe('one');
  });

  it('returns null for anything that is not a well-formed mailto:', () => {
    expect(parseMailto('https://example.com')).toBeNull();
    expect(parseMailto('javascript:alert(1)')).toBeNull();
    expect(parseMailto('mailto:ada@example.com?subject=%E0%A4%A')).toBeNull();
  });
});

describe('mailtoComposerData', () => {
  it('hands the body over in both formats, escaped for HTML', () => {
    const data = mailtoComposerData({ to: ['ada@example.com'], cc: [], subject: 'S', body: '<b>1</b>\n2\n\n3' });
    expect(data).toEqual({
      to: ['ada@example.com'],
      cc: [],
      subject: 'S',
      text: '<b>1</b>\n2\n\n3',
      html: '<p style="white-space: pre-wrap">&lt;b&gt;1&lt;/b&gt;<br>2</p><p style="white-space: pre-wrap">3</p>',
    });
  });

  it('keeps the body as it was written through the rich editor', async () => {
    // The editor's parser collapses runs of spaces and drops leading ones,
    // and the editor's text is the message's text/plain part.
    const body = 'Dear team,\n\n    indented line\nspaced   out  words\n  - item';
    const { html } = mailtoComposerData({ to: [], cc: [], body });
    const composer = await mount<AlpsMessageComposer>('alps-message-composer', { format: 'html', text: body, htmlText: html });
    expect(composer.editor!.getText()).toBe(body);
  });
});

describe('openMailtoFromClick', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function link(href: string): HTMLAnchorElement {
    const a = document.createElement('a');
    a.href = href;
    a.innerHTML = '<span>label</span>';
    document.body.appendChild(a);
    return a;
  }

  function click(target: Element, init: MouseEventInit = {}): MouseEvent {
    const view = target.ownerDocument.defaultView as typeof window;
    const event = new view.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
    target.dispatchEvent(event);
    return event;
  }

  const composer = () => ({ openComposer: vi.fn() });

  it('opens the composer for a plain click, even on a child of the link', () => {
    const store = composer();
    const a = link('mailto:ada@example.com?subject=Hi');
    document.addEventListener('click', (e) => openMailtoFromClick(e, store), { once: true });
    const event = click(a.querySelector('span')!);
    expect(event.defaultPrevented).toBe(true);
    expect(store.openComposer).toHaveBeenCalledWith(
      { to: ['ada@example.com'], cc: [], subject: 'Hi' },
      { signature: 'below' },
    );
  });

  it.each([['metaKey'], ['ctrlKey'], ['shiftKey'], ['altKey']])('leaves a %s click to the browser', (key) => {
    const store = composer();
    const a = link('mailto:ada@example.com');
    document.addEventListener('click', (e) => openMailtoFromClick(e, store), { once: true });
    const event = click(a, { [key]: true });
    expect(event.defaultPrevented).toBe(false);
    expect(store.openComposer).not.toHaveBeenCalled();
  });

  it('leaves web links and mailto: links it cannot parse to the browser', () => {
    const store = composer();
    for (const href of ['https://example.com', 'mailto:?subject=%E0%A4%A']) {
      const a = link(href);
      document.addEventListener('click', (e) => openMailtoFromClick(e, store), { once: true });
      expect(click(a).defaultPrevented).toBe(false);
    }
    expect(store.openComposer).not.toHaveBeenCalled();
  });

  it('does nothing when there is no composer to open', () => {
    const a = link('mailto:ada@example.com');
    document.addEventListener('click', (e) => openMailtoFromClick(e, undefined), { once: true });
    expect(click(a).defaultPrevented).toBe(false);
  });
});

describe('interceptMailtoClicks', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it("routes a mailto: click inside an HTML message's frame to the composer", () => {
    // The frame's document is another realm: an `instanceof Element` test
    // against this window's Element would be false for everything in it.
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.body.innerHTML = '<a href="mailto:ada@example.com?body=hello">write</a><a href="https://example.com">web</a>';

    const store = { openComposer: vi.fn() };
    interceptMailtoClicks(iframe, () => store);

    const view = iframe.contentWindow as unknown as typeof window;
    const [mail, web] = Array.from(doc.querySelectorAll('a'));
    const mailClick = new view.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    mail.dispatchEvent(mailClick);
    const webClick = new view.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    web.dispatchEvent(webClick);

    expect(mailClick.defaultPrevented).toBe(true);
    expect(webClick.defaultPrevented).toBe(false);
    expect(store.openComposer).toHaveBeenCalledTimes(1);
    expect(store.openComposer).toHaveBeenCalledWith(
      { to: ['ada@example.com'], cc: [], text: 'hello', html: '<p style="white-space: pre-wrap">hello</p>' },
      { signature: 'below' },
    );
  });
});
