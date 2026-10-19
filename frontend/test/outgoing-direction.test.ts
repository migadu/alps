/**
 * A reply or forward quotes the original the way the original runs, and says
 * so in terms the recipient's mail client keeps.
 *
 * A quote took the reply's direction: an English answer to Arabic mail laid
 * the original out left to right, with its bar on the left, and quoting a
 * fragment of a document that set its direction on <html> or <body> lost it.
 * Gmail, Outlook and Yahoo drop logical CSS properties from mail they
 * receive, so the side of the bar is written as a physical one.
 */
import { describe, expect, it } from 'vitest';
import { sanitizeQuotedHTML } from '../src/utils/html-sanitizer';
import { generateQuote } from '../src/utils/email-quote';

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

describe('quoting a fragment of a document', () => {
  it('keeps the direction and language the document set', () => {
    const output = parse(sanitizeQuotedHTML('<html lang="ar" dir="rtl"><body><p>رسالة أصلية</p></body></html>'));
    expect(output.body.firstElementChild?.getAttribute('dir')).toBe('rtl');
    expect(output.body.firstElementChild?.getAttribute('lang')).toBe('ar');
    expect(output.body.textContent).toBe('رسالة أصلية');
  });

  it("puts the body's direction ahead of the document's", () => {
    const output = parse(sanitizeQuotedHTML('<html dir="rtl"><body dir="ltr"><p>English original</p></body></html>'));
    expect(output.body.firstElementChild?.getAttribute('dir')).toBe('ltr');
  });

  it.each([
    '<html dir="rtl"><body style="direction:ltr"><p>English</p></body></html>',
    '<html dir="rtl"><body dir="rtl" style="direction:ltr"><p>English</p></body></html>',
    '<html dir="rtl" style="direction:ltr"><body><p>English</p></body></html>',
    '<html DIR="RTL"><body dir="LTR"><p>English</p></body></html>',
  ])('lets an inline direction override a dir on the same element: %s', (markup) => {
    const output = parse(sanitizeQuotedHTML(markup));
    expect(output.body.firstElementChild?.getAttribute('dir')).toBe('ltr');
  });

  it('adds nothing to a document that sets no direction', () => {
    expect(sanitizeQuotedHTML('<p>hi</p>')).toBe('<p>hi</p>');
  });
});

describe('the generated quote', () => {
  for (const [text, direction] of [['Hello', 'ltr'], ['مرحبًا', 'rtl']] as const) {
    for (const html of [false, true]) {
      it(`quotes ${direction} ${html ? 'HTML' : 'text'} with its bar on its own physical edge`, () => {
        const { quotedHtml } = generateQuote('reply', null, text,
          html ? `<div dir="auto"><p dir="auto">${text}</p></div>` : null, html);
        const quote = parse(quotedHtml).querySelector('blockquote')!;
        expect(quote.dir).toBe(direction);
        const side = direction === 'rtl' ? 'right' : 'left';
        const other = direction === 'rtl' ? 'left' : 'right';
        expect(quote.style.getPropertyValue(`border-${side}`)).toBe('1px solid rgb(204, 204, 204)');
        expect(quote.style.getPropertyValue(`padding-${side}`)).toBe('1ex');
        expect(quote.style.getPropertyValue(`margin-${side}`)).toBe('0.8ex');
        expect(quote.style.getPropertyValue(`border-${other}`)).toBe('');
        expect(quote.style.cssText).not.toMatch(/(?:margin|padding|border)-inline/);
        // The attribution line is ours, in English, so it stays left to right.
        expect(parse(quotedHtml).querySelector('.gmail_attr')?.getAttribute('dir')).toBe('ltr');
      });
    }
  }

  it("follows the direction the original set, even when its letters point the other way", () => {
    const { quotedHtml } = generateQuote('reply', null, 'Hello',
      '<html dir="rtl"><body><p>Hello</p></body></html>', true);
    const quote = parse(quotedHtml).querySelector('blockquote')!;
    expect(quote.dir).toBe('rtl');
    expect(quote.style.borderRight).toContain('1px solid');
    expect(quote.style.borderLeft).toBe('');
  });

  it.each(['reply', 'forward'] as const)('lets the %s quote around the original take its direction', (type) => {
    for (const html of ['<p>مرحبًا</p>', null]) {
      const { quotedHtml } = generateQuote(type, null, 'مرحبًا', html, html !== null);
      expect(parse(quotedHtml).querySelector('div.gmail_quote')?.getAttribute('dir')).toBe('auto');
    }
  });
});
