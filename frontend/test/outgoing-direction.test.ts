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
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sanitizeQuotedHTML } from '../src/utils/html-sanitizer';
import { generateQuote } from '../src/utils/email-quote';
import type { AlpsMessageComposer } from '../src/components/alps-message-composer';
import '../src/components/alps-message-composer';
import '../src/components/alps-floating-composer';
import type { ComposerInstance } from '../src/store/compose-store';
import { cleanup, mount, record } from './helpers/dom';

// See floating-composer-send.test.ts: the picker's grid is slow to build and
// nothing here opens it.
vi.mock('unicode-emoji-picker', () => ({}));

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');
const openComposer = (htmlText: string) =>
  mount<AlpsMessageComposer>('alps-message-composer', { format: 'html', htmlText });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Pastes as a user would. jsdom has no ClipboardEvent for ProseMirror's paste path. */
function paste(composer: AlpsMessageComposer, how: 'html' | 'text', content: string) {
  vi.stubGlobal('ClipboardEvent', class extends Event {
    clipboardData = { getData: () => '' };
  });
  try {
    if (how === 'html') composer.editor!.view.pasteHTML(content);
    else composer.editor!.view.pasteText(content);
  } finally {
    vi.unstubAllGlobals();
  }
}

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

describe('a quote in the composer', () => {
  for (const [text, direction] of [['Hello', 'ltr'], ['مرحبًا', 'rtl']] as const) {
    for (const html of [false, true]) {
      it(`goes out ${direction}, its ${html ? 'HTML' : 'text'} quote bar on its own physical edge`, async () => {
        const result = generateQuote('reply', null, text,
          html ? `<div dir="auto"><p dir="auto">${text}</p></div>` : null, html);
        const composer = await openComposer(result.quotedHtml);
        composer.editor!.commands.insertContent('Reply');
        const quote = parse(composer.htmlText).querySelector('blockquote')!;
        expect(quote.dir).toBe(direction);
        const side = direction === 'rtl' ? 'right' : 'left';
        expect(quote.style.getPropertyValue(`border-${side}`)).toBe('1px solid rgb(204, 204, 204)');
        expect(quote.style.getPropertyValue(`padding-${side}`)).toBe('1ex');
        expect(quote.style.getPropertyValue(`margin-${side}`)).toBe('0.8ex');
        expect(quote.style.cssText).not.toMatch(/(?:margin|padding|border)-inline/);
      });
    }
  }

  for (const [text, direction] of [['Hello', 'ltr'], ['مرحبًا', 'rtl']] as const) {
    it(`keeps an indent on an editable ${direction} quote removable after saving and reopening`, async () => {
      const selectQuote = (composer: AlpsMessageComposer) => {
        let quotePosition: number | null = null;
        composer.editor!.state.doc.descendants((node, position) => {
          if (node.type.name === 'blockquote' && quotePosition === null) quotePosition = position;
        });
        expect(quotePosition).not.toBeNull();
        // Into the quoted paragraph, past the blockquote and paragraph tokens.
        composer.editor!.commands.setTextSelection(quotePosition! + 2);
      };
      const { quotedHtml } = generateQuote('reply', null, text, null, false);
      const composer = await openComposer(quotedHtml);
      selectQuote(composer);
      composer.editor!.commands.indent();
      const saved = composer.htmlText;
      const side = direction === 'rtl' ? 'right' : 'left';
      expect(parse(saved).querySelector('blockquote')!.style.getPropertyValue(`margin-${side}`)).toBe('40px');

      cleanup();
      const reopened = await openComposer(saved);
      selectQuote(reopened);
      expect(reopened.editor!.getAttributes('blockquote').indent).toBe(40);
      reopened.editor!.commands.outdent();

      const quote = parse(reopened.htmlText).querySelector('blockquote')!;
      expect(reopened.editor!.getAttributes('blockquote').indent).toBe(0);
      expect(quote.style.getPropertyValue(`margin-${side}`)).toBe('0.8ex');
      expect(quote.style.getPropertyValue(`border-${side}`)).toBe('1px solid rgb(204, 204, 204)');
      expect(quote.style.getPropertyValue(`padding-${side}`)).toBe('1ex');
      expect(quote.outerHTML).not.toContain('40px');
    });
  }
});

describe('what the composer sends', () => {
  for (const [text, direction] of [['Hello', 'ltr'], ['مرحبًا', 'rtl']] as const) {
    it(`sends a ${direction} indent as a physical margin, still an indent once reopened`, async () => {
      const composer = await openComposer(`<p dir="auto">${text}</p>`);
      composer.editor!.commands.setTextSelection(1);
      composer.editor!.commands.indent();
      expect(parse(composer.editor!.getHTML()).querySelector('p')!.style.marginInlineStart).toBe('40px');
      const paragraph = parse(composer.htmlText).querySelector('p')!;
      expect(paragraph.style.marginInlineStart).toBe('');
      expect(direction === 'rtl' ? paragraph.style.marginRight : paragraph.style.marginLeft).toBe('40px');
      expect(direction === 'rtl' ? paragraph.style.marginLeft : paragraph.style.marginRight).toBe('');

      const saved = composer.htmlText;
      cleanup();
      const reopened = await openComposer(saved);
      reopened.editor!.commands.setTextSelection(1);
      expect(reopened.editor!.getAttributes('paragraph').indent).toBe(40);
      reopened.editor!.commands.outdent();
      expect(parse(reopened.htmlText).querySelector('p')!.style.cssText).not.toMatch(/margin-(?:left|right|inline-start)/);
    });
  }

  it('saves a direction for each paragraph, the ones its author set included', async () => {
    const composer = await openComposer('<p dir="rtl">مرحبًا</p><p dir="ltr">English</p>');
    const changes = record<CustomEvent>(composer, 'text-changed');
    composer.editor!.commands.insertContentAt(0, '<p>Another English paragraph</p>');
    const paragraphs = [...parse(changes.at(-1)!.detail.html).querySelectorAll('p')];
    expect(paragraphs.find((p) => p.textContent === 'مرحبًا')?.dir).toBe('rtl');
    expect(paragraphs.find((p) => p.textContent === 'English')?.dir).toBe('ltr');
    expect(paragraphs.find((p) => p.textContent === 'Another English paragraph')?.dir).toBe('auto');
    expect(composer.editor!.view.dom.getAttribute('dir')).toBe('auto');
  });

  it.each([
    ['<div style="direction:rtl"><p>Alps مرحبًا</p></div>', 'rtl'],
    ['<p dir="rtl" style="direction:ltr">Alps مرحبًا</p>', 'ltr'],
    ['<div dir="rtl"><div style="direction:ltr"><p>Alps مرحبًا</p></div></div>', 'ltr'],
    ['<div style="direction:rtl"><p dir="auto">Alps مرحبًا</p></div>', 'auto'],
    ['<p DIR="RTL">Alps مرحبًا</p>', 'rtl'],
    ['<ol dir="ltr"><li dir="rtl">English</li></ol>', 'rtl'],
  ])('keeps the nearest direction an author set when opening %s', async (markup, direction) => {
    const composer = await openComposer(markup);
    expect(parse(composer.editor!.getHTML()).querySelector('p')?.dir).toBe(direction);
  });

  it('lays out an automatic quote by its content, and keeps it automatic when its HTML is read back', async () => {
    const composer = await openComposer('<blockquote dir="auto"><p dir="auto">مرحبًا</p></blockquote>');
    const liveQuote = composer.editor!.view.dom.querySelector('blockquote') as HTMLElement;
    expect(liveQuote.getAttribute('data-alps-auto-direction')).toBe('rtl');
    expect(liveQuote.style.direction).toBe('rtl');
    composer.editor!.commands.setContent(composer.editor!.view.dom.innerHTML);
    expect(parse(composer.editor!.getHTML()).querySelector('blockquote')?.dir).toBe('auto');
  });

  it.each(['html', 'text', 'enter'] as const)("gives a line added by %s a quote's fixed direction, kept once reopened", async (method) => {
    const composer = await openComposer('<blockquote style="direction:rtl"><p>مرحبا</p></blockquote>');
    const editor = composer.editor!;
    editor.commands.setTextSelection(2 + 'مرحبا'.length);
    if (method === 'enter') {
      editor.commands.keyboardShortcut('Enter');
      editor.commands.insertContent('Second line 2.1!');
    } else if (method === 'html') {
      paste(composer, 'html', '<p>First line.</p><p>Second line 2.1!</p>');
    } else {
      paste(composer, 'text', 'First line.\nSecond line 2.1!');
    }
    const saved = composer.htmlText;
    const paragraphs = [...parse(saved).querySelectorAll<HTMLParagraphElement>('blockquote > p')];
    expect(paragraphs.map((p) => p.dir)).toEqual(['rtl', 'rtl']);
    expect(paragraphs[1]?.textContent).toBe('Second line 2.1!');
    expect(editor.view.dom.querySelectorAll('blockquote > p')[1]?.getAttribute('dir')).toBe('rtl');

    cleanup();
    const reopened = await openComposer(saved);
    expect([...parse(reopened.editor!.getHTML()).querySelectorAll<HTMLParagraphElement>('blockquote > p')].map((p) => p.dir)).toEqual(['rtl', 'rtl']);
  });

  it('leaves a pasted paragraph marked automatic automatic inside a fixed quote', async () => {
    const composer = await openComposer('<blockquote style="direction:rtl"><p>مرحبا</p></blockquote>');
    composer.editor!.commands.setTextSelection(2 + 'مرحبا'.length);
    paste(composer, 'html', '<p>First line.</p><p dir="auto">Second line 2.1!</p>');
    const saved = composer.htmlText;
    expect([...parse(saved).querySelectorAll<HTMLParagraphElement>('blockquote > p')].map((p) => p.dir)).toEqual(['rtl', 'auto']);
    cleanup();
    const reopened = await openComposer(saved);
    expect([...parse(reopened.editor!.getHTML()).querySelectorAll<HTMLParagraphElement>('blockquote > p')].map((p) => p.dir)).toEqual(['rtl', 'auto']);
  });

  it('lets the plain-text body and the subject take the direction of what is typed', async () => {
    const composer = await mount<AlpsMessageComposer>('alps-message-composer', { format: 'text', text: 'مرحبًا' });
    expect(composer.shadowRoot!.querySelector('textarea')?.dir).toBe('auto');

    vi.spyOn(console, 'error').mockImplementation(() => {});
    const instance: ComposerInstance = { id: 'c1', to: [], subject: 'مرحبًا', text: '', format: 'text' };
    const floating = await mount<HTMLElement>('alps-floating-composer', {
      instance,
      composeStore: {
        getState: () => ({ activeComposers: [instance] }),
        getComposer: () => instance,
        updateComposer: vi.fn(),
        bringComposerToFront: vi.fn(),
        closeComposer: vi.fn(),
      },
      i18nStore: { t: (key: string) => key, addEventListener: () => {}, removeEventListener: () => {} },
    });
    const subject = [...floating.shadowRoot!.querySelectorAll<HTMLInputElement>('input.field-input')]
      .find((input) => input.placeholder === 'floatingComposer.subject');
    expect(subject?.dir).toBe('auto');
    vi.restoreAllMocks();
  });
});
