/**
 * Resolving the direction of message content: the first branch with an
 * explicit direction or a strong letter decides, as `dir="auto"` does, and a
 * direction this code derived is never mistaken for one the author wrote.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  applyAutoDirections, AUTO_DIRECTION_ATTRIBUTE, createDirectionResolver,
  getAuthoredDirection, getAuthoredStyle,
} from '../src/utils/content-direction';

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

describe('native first-meaningful-branch direction resolution', () => {
  interface Branch { text?: string; direction?: 'ltr' | 'rtl' | 'auto'; children?: Branch[] }

  it.each([
    ['مرحبًا', 'rtl'], ['Hello', 'ltr'], ['שלום', 'rtl'],
    ['123 مرحبًا', 'rtl'], ['123 Hello', 'ltr'], ['123 (45)', null], ['  ', null],
  ] as const)('resolves %s without script-specific character tests', (text, expected) => {
    const resolve = createDirectionResolver<Branch>((node) => node);
    expect(resolve({ text })).toBe(expected);
  });

  it('skips neutral prefixes and resolves arbitrarily nested automatic branches', () => {
    let branch: Branch = { text: 'مرحبًا' };
    for (let i = 0; i < 40; i++) branch = { direction: 'auto', children: [{ text: '123 ' }, branch] };
    expect(createDirectionResolver<Branch>((node) => node)(branch)).toBe('rtl');
  });

  it('keeps the first explicit branch ahead of later opposing text and caches the pass', () => {
    let reads = 0;
    const resolve = createDirectionResolver<Branch>((node) => { reads++; return node; });
    const root: Branch = { children: [{ direction: 'rtl', text: 'English' }, { text: 'Hello' }] };
    expect(resolve(root)).toBe('rtl');
    const firstReads = reads;
    expect(resolve(root)).toBe('rtl');
    expect(reads).toBe(firstReads);
  });

  it('uses native automatic direction without :dir support and removes its probe', () => {
    const nativeMatches = Element.prototype.matches;
    const nativeStyle = getComputedStyle;
    const children = [...document.documentElement.children];
    const selector = vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, value) {
      if (value.includes(':dir(')) throw new DOMException('Unsupported pseudo-class', 'SyntaxError');
      return nativeMatches.call(this, value);
    });
    // jsdom has no layout, so its own :dir() answer stands in for the
    // computed direction a browser would report.
    const styles = vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((element) => {
      expect(element.isConnected).toBe(true);
      expect((element as HTMLElement).hidden).toBe(true);
      const result = nativeStyle(element);
      Object.defineProperty(result, 'direction', {
        value: nativeMatches.call(element, ':dir(rtl)') ? 'rtl' : 'ltr',
      });
      return result;
    });
    try {
      const resolve = createDirectionResolver<Branch>((node) => node);
      expect(resolve({ text: '123 مرحبًا' })).toBe('rtl');
      expect(resolve({ text: 'Hello' })).toBe('ltr');
      expect(resolve({ text: '123' })).toBeNull();
      expect([...document.documentElement.children]).toEqual(children);
    } finally {
      selector.mockRestore();
      styles.mockRestore();
    }
  });

});

describe('authored and derived directions', () => {
  it.each([
    ['<div DIR="RTL"></div>', 'rtl'],
    ['<div dir="rtl" style="direction: ltr"></div>', 'ltr'],
    ['<div dir="auto" style="direction: rtl" data-alps-auto-direction="rtl"></div>', 'auto'],
    ['<div dir="auto" style="direction: ltr" data-alps-auto-direction="rtl"></div>', 'ltr'],
    ['<div dir="auto" style="direction: rtl" data-alps-auto-direction="invalid"></div>', 'rtl'],
  ] as const)('distinguishes authored formatting in %s', (markup, expected) => {
    expect(getAuthoredDirection(parse(markup).body.firstElementChild as HTMLElement)).toBe(expected);
  });

  it('strips only matching generated direction when preserving an authored style', () => {
    const el = parse('<blockquote dir="auto" style="color:red; direction:rtl; margin-top:4px" data-alps-auto-direction="rtl"></blockquote>').body.firstElementChild as HTMLElement;
    const style = getAuthoredStyle(el)!;
    expect(style).toContain('color: red');
    expect(style).toContain('margin-top: 4px');
    expect(style).not.toContain('direction');
    expect(el.style.direction).toBe('rtl');
  });
});

describe('automatic container annotations', () => {
  it('propagates through nested quotes and lists without a depth limit', () => {
    const doc = parse('<body dir="auto"><div dir="auto"><blockquote dir="auto"><ul dir="auto"><li dir="auto"><blockquote dir="auto"><p dir="auto">مرحبًا</p></blockquote></li></ul></blockquote></div></body>');
    applyAutoDirections(doc);
    for (const el of doc.querySelectorAll('body, div, blockquote, ul, li')) {
      expect(el.getAttribute(AUTO_DIRECTION_ATTRIBUTE), el.tagName).toBe('rtl');
      expect((el as HTMLElement).style.direction).toBe('');
    }
  });

  it('preserves explicit list directions and inline author styles', () => {
    const doc = parse('<ul dir="rtl"><li dir="ltr">English</li></ul><ol style="direction:rtl"><li dir="ltr">English</li></ol><ul dir="auto" style="direction:ltr"><li dir="rtl">مرحبًا</li></ul>');
    const before = doc.body.innerHTML;
    applyAutoDirections(doc, true);
    expect(doc.body.innerHTML).toBe(before);
  });

  it('recalculates outgoing automatic styles after an edit without freezing auto', () => {
    const doc = parse('<blockquote dir="auto" style="color:red"><p dir="auto">مرحبًا</p></blockquote>');
    const quote = doc.querySelector('blockquote')!;
    applyAutoDirections(doc, true);
    expect(quote.style.direction).toBe('rtl');
    expect(quote.dir).toBe('auto');
    expect(getAuthoredDirection(quote)).toBe('auto');
    quote.querySelector('p')!.textContent = 'Hello';
    applyAutoDirections(doc, true);
    expect(quote.style.direction).toBe('ltr');
    expect(quote.style.color).toBe('red');
    expect(quote.dir).toBe('auto');
  });

  it('cleans derived formatting when an explicit direction replaces auto', () => {
    const doc = parse('<ul dir="auto"><li dir="auto"><p dir="auto">مرحبًا</p></li></ul>');
    applyAutoDirections(doc, true);
    const list = doc.querySelector('ul')!;
    list.dir = 'ltr';
    applyAutoDirections(doc, true);
    expect(list.style.direction).toBe('');
    expect(list.getAttribute(AUTO_DIRECTION_ATTRIBUTE)).toBeNull();
    expect(list.dir).toBe('ltr');
  });

  it('ignores stylesheet text and whitespace before actual content', () => {
    const doc = parse('<body dir="auto">123<style>div { color:red }</style><div dir="auto"><p dir="auto">مرحبًا</p></div></body>');
    applyAutoDirections(doc);
    expect(doc.body.getAttribute(AUTO_DIRECTION_ATTRIBUTE)).toBe('rtl');
  });

  it('skips inline directional isolates and quote attribution headers when resolving container direction', () => {
    const doc = parse(
      '<blockquote id="q" dir="auto"><p dir="auto"><bdi dir="ltr">dev@example.com</bdi> <span dir="ltr">[v2.1]</span> مرحبًا</p></blockquote>'
      + '<div id="fwd" class="gmail_quote" dir="auto"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------</div><br><p>رسالة عربية</p></div>',
    );
    applyAutoDirections(doc);
    expect(doc.getElementById('q')?.getAttribute(AUTO_DIRECTION_ATTRIBUTE)).toBe('rtl');
    expect(doc.getElementById('fwd')?.getAttribute(AUTO_DIRECTION_ATTRIBUTE)).toBe('rtl');
  });

  it.each([
    ['ltr', 'Hello', 'مرحبًا', 'ltr'],
    ['rtl', 'Hello', 'مرحبًا', 'ltr'],
    ['ltr', 'مرحبًا', 'Hello', 'rtl'],
    ['rtl', 'مرحبًا', 'Hello', 'rtl'],
  ])('includes text in a CSS-only %s span when resolving %s', (styleDirection, leadingText, trailingText, expected) => {
    const doc = parse(`<blockquote dir="auto"><p dir="auto"><span style="direction:${styleDirection}">${leadingText}</span> ${trailingText}</p></blockquote>`);
    applyAutoDirections(doc);
    expect(doc.querySelector('blockquote')?.getAttribute(AUTO_DIRECTION_ATTRIBUTE)).toBe(expected);
    expect(doc.querySelector('span')?.getAttribute('dir')).toBeNull();
    expect(doc.querySelector('span')?.style.direction).toBe(styleDirection);
  });

  it('does not override an unlabelled list that inherits an explicit ancestor direction', () => {
    const doc = parse('<div dir="rtl"><ul id="inherited"><li>Alps</li><li>العربية</li></ul></div>');
    applyAutoDirections(doc);
    expect(doc.getElementById('inherited')?.getAttribute(AUTO_DIRECTION_ATTRIBUTE)).toBeNull();
  });

  it.each([
    ['rtl', 'English'], ['ltr', 'مرحبًا'],
  ])('leaves unlabelled lists inheriting stylesheet %s unchanged', (direction, text) => {
    for (const inline of [false, true]) {
      const doc = parse(`<style>.authored { direction:${direction} }</style><div class="authored"><ul><li>${text}</li></ul><ol><li>${text}</li></ol></div>`);
      const lists = [...doc.querySelectorAll('ul, ol')];
      const before = lists.map(list => list.outerHTML);
      applyAutoDirections(doc, inline);
      expect(lists.map(list => list.outerHTML)).toEqual(before);
    }
  });

  it.each([
    ['dir="rtl"', 'rtl', 'English'],
    ['style="direction:rtl"', 'rtl', 'English'],
    ['dir="ltr"', 'ltr', 'مرحبًا'],
    ['style="direction:ltr"', 'ltr', 'مرحبًا'],
  ])('keeps unlabelled lists under %s independent of automatic items', (parentAttributes, parentDirection, text) => {
    const doc = parse(`<div ${parentAttributes}><ul><li dir="auto"><p dir="auto">${text}</p></li></ul><ol><li dir="auto"><p dir="auto">${text}</p></li></ol><ul dir="auto"><li dir="auto"><p dir="auto">${text}</p></li></ul></div>`);
    applyAutoDirections(doc, true);
    for (const list of doc.querySelectorAll<HTMLElement>('ul:not([dir]), ol:not([dir])')) {
      expect(list.getAttribute(AUTO_DIRECTION_ATTRIBUTE)).toBeNull();
      expect(list.style.direction).toBe('');
    }
    const inferred = parentDirection === 'rtl' ? 'ltr' : 'rtl';
    expect(doc.querySelector('ul[dir="auto"]')?.getAttribute(AUTO_DIRECTION_ATTRIBUTE)).toBe(inferred);
    for (const item of doc.querySelectorAll('li')) {
      expect(item.getAttribute(AUTO_DIRECTION_ATTRIBUTE)).toBe(inferred);
    }
  });
});
