/**
 * Quoting a message into a reply or a forward.
 *
 * The risk is not script in our own page: it is that replying makes the user a
 * carrier. The sender's markup rides the reply to whoever it goes to — a
 * tracking pixel the reader refused re-armed under the user's name — and the
 * sender's display name, subject and addresses are interpolated into markup.
 */
import { describe, expect, it } from 'vitest';
import { escapeHtml, sanitizeQuotedHTML } from '../src/utils/html-sanitizer';
import { formatAddrs, generateQuote } from '../src/utils/email-quote';

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

describe('sanitizeQuotedHTML', () => {
  it('removes active content and keeps the text', () => {
    const doc = parse(sanitizeQuotedHTML(
      '<p>hi</p><script>fetch("//evil")</script><style>body{display:none}</style>' +
      '<iframe src="https://evil.test"></iframe><form action="https://evil.test"></form>' +
      '<link rel="stylesheet" href="https://evil.test/s.css"><base href="https://evil.test/">',
    ));
    for (const tag of ['script', 'style', 'iframe', 'form', 'link', 'base']) expect(doc.querySelector(tag), tag).toBeNull();
    expect(doc.body.textContent).toContain('hi');
  });

  it('removes event handlers, which the next client would run', () => {
    const img = parse(sanitizeQuotedHTML('<img src="https://cdn.test/a.png" onerror="steal()" ONLOAD="x()">')).querySelector('img')!;
    expect(img.getAttribute('onerror')).toBeNull();
    expect(img.getAttribute('onload')).toBeNull();
  });

  it('removes script-bearing URLs, including ones hidden behind control characters', () => {
    for (const href of ['javascript:alert(1)', 'java\tscript:alert(1)', ' JavaScript:alert(1)', 'vbscript:x', 'data:text/html,<script>x</script>']) {
      const a = parse(sanitizeQuotedHTML(`<a href="${href.replace(/"/g, '&quot;')}">x</a>`)).querySelector('a')!;
      expect(a.getAttribute('href'), href).toBeNull();
    }
  });

  it('removes url() from inline styles but keeps the formatting', () => {
    const out = sanitizeQuotedHTML('<div style="color:#c00;background:url(https://tracker.test/p.gif)">x</div>');
    expect(out).not.toContain('tracker.test');
    expect(parse(out).querySelector('div')?.getAttribute('style')).toContain('color:#c00');
  });

  it('leaves remote image and link addresses exactly as written', () => {
    // Rewriting them for display would send the recipient URLs into our origin.
    const doc = parse(sanitizeQuotedHTML('<img src="https://cdn.test/logo.png?v=2"><a href="https://example.test/x">link</a>'));
    expect(doc.querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/logo.png?v=2');
    expect(doc.querySelector('a')?.getAttribute('href')).toBe('https://example.test/x');
  });

  it('returns a fragment, and nothing for nothing', () => {
    expect(sanitizeQuotedHTML('<p>hi</p>').toLowerCase()).not.toContain('<body');
    expect(sanitizeQuotedHTML('')).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes everything that can open markup or an attribute', () => {
    expect(escapeHtml(`<img src=x onerror="a('b')">&`)).toBe('&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
  });

  it('escapes an ampersand once', () => {
    expect(escapeHtml('a &lt; b')).toBe('a &amp;lt; b');
  });
});

describe('generateQuote', () => {
  const message = (envelope: Record<string, unknown> = {}) => ({
    Envelope: {
      Subject: 'Engines',
      Date: '2024-01-05T14:07:00Z',
      From: [{ Name: 'Ada Lovelace', Mailbox: 'ada', Host: 'remote.test' }],
      To: [{ Name: '', Mailbox: 'me', Host: 'example.test' }],
      Cc: [{ Mailbox: 'bob', Host: 'example.test' }],
      ReplyTo: [],
      ...envelope,
    },
  });

  it('formats addresses with and without a display name', () => {
    expect(formatAddrs([{ Name: 'Ada', Mailbox: 'ada', Host: 'remote.test' }, { Mailbox: 'bob', Host: 'x.test' }])).toEqual([
      'Ada <ada@remote.test>', 'bob@x.test',
    ]);
    expect(formatAddrs(undefined as any)).toEqual([]);
  });

  it('prefixes the subject once', () => {
    expect(generateQuote('reply', message(), '', null, false).subject).toBe('Re: Engines');
    expect(generateQuote('reply', message({ Subject: 'RE: Engines' }), '', null, false).subject).toBe('RE: Engines');
    expect(generateQuote('forward', message(), '', null, false).subject).toBe('Fwd: Engines');
    expect(generateQuote('forward', message({ Subject: 'FWD: Engines' }), '', null, false).subject).toBe('FWD: Engines');
  });

  it('replies to Reply-To when there is one, otherwise to the sender', () => {
    expect(generateQuote('reply', message(), '', null, false).to).toEqual(['Ada Lovelace <ada@remote.test>']);
    const listed = message({ ReplyTo: [{ Name: 'List', Mailbox: 'list', Host: 'remote.test' }] });
    expect(generateQuote('reply', listed, '', null, false).to).toEqual(['List <list@remote.test>']);
  });

  it('replies to all without repeating an address', () => {
    const quote = generateQuote('replyAll', message({ To: [{ Name: 'Ada Lovelace', Mailbox: 'ada', Host: 'remote.test' }, { Mailbox: 'me', Host: 'example.test' }] }), '', null, false);
    expect(quote.to).toEqual(['Ada Lovelace <ada@remote.test>', 'me@example.test']);
    expect(quote.cc).toEqual(['bob@example.test']);
  });

  it('addresses a forward to nobody', () => {
    const quote = generateQuote('forward', message(), '', null, false);
    expect(quote.to).toEqual([]);
    expect(quote.cc).toEqual([]);
  });

  it('quotes the text body line by line under an attribution', () => {
    const { quotedText } = generateQuote('reply', message(), 'one\ntwo', null, false);
    expect(quotedText).toContain('Ada Lovelace wrote:');
    expect(quotedText.endsWith('\n> one\n> two')).toBe(true);
  });

  it('heads a forward with the original sender, subject and recipients', () => {
    const { quotedText } = generateQuote('forward', message(), 'body', null, false);
    expect(quotedText).toContain('Forwarded message');
    expect(quotedText).toContain('From: Ada Lovelace <ada@remote.test>');
    expect(quotedText).toContain('Subject: Engines');
    expect(quotedText).toContain('To: me@example.test');
  });

  it('escapes a hostile display name and subject in every HTML branch', () => {
    const hostile = message({
      Subject: '<script>alert(1)</script>',
      From: [{ Name: '<img src=x onerror=alert(1)>', Mailbox: 'ada', Host: 'remote.test' }],
    });
    for (const [type, hasHtml] of [['reply', true], ['forward', true], ['reply', false], ['forward', false]] as const) {
      const { quotedHtml } = generateQuote(type, hostile, 'body', '<p>body</p>', hasHtml);
      const doc = parse(quotedHtml);
      expect(doc.querySelector('img'), `${type}/${hasHtml}`).toBeNull();
      expect(doc.querySelector('script'), `${type}/${hasHtml}`).toBeNull();
      expect(quotedHtml, `${type}/${hasHtml}`).toContain('&lt;img');
    }
  });

  it('sanitizes the quoted HTML body', () => {
    const { quotedHtml } = generateQuote('reply', message(), '', '<p>hi</p><script>x()</script><img src="https://cdn.test/a.png" onerror="y()">', true);
    const doc = parse(quotedHtml);
    expect(doc.querySelector('script')).toBeNull();
    expect(doc.querySelector('img')?.getAttribute('onerror')).toBeNull();
    expect(doc.querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/a.png');
  });

  it('escapes a text body before turning its lines into breaks', () => {
    const { quotedHtml } = generateQuote('reply', message(), '<b>not markup</b>\nline two', null, false);
    expect(parse(quotedHtml).querySelector('blockquote b')).toBeNull();
    expect(quotedHtml).toContain('&lt;b&gt;not markup&lt;/b&gt;<br>line two');
  });

  it('falls back to the text body when HTML is claimed but missing', () => {
    const { quotedHtml } = generateQuote('reply', message(), 'plain', null, true);
    expect(quotedHtml).toContain('plain');
  });

  it('names an unknown sender rather than throwing', () => {
    const { quotedText } = generateQuote('reply', message({ From: undefined }), 'x', null, false);
    expect(quotedText).toContain('Unknown Sender wrote:');
    expect(() => generateQuote('reply', {}, '', null, false)).not.toThrow();
  });
});
