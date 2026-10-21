/**
 * Reading a sender's CSS as a browser reads it.
 *
 * The sanitizers decide what a style loads from what these functions find, so
 * a name the tokenizer fails to decode is a fetch nobody sees, and a string or
 * comment it misreads is a declaration dropped, or kept, by mistake.
 */
import { describe, expect, it } from 'vitest';
import { cssTokens, cssUrls, loadsResource, withoutDeclarations } from '../src/utils/css-syntax';

const significant = (css: string) =>
  cssTokens(css).filter((token) => token.type !== 'whitespace').map((token) => [token.type, token.value]);

describe('cssTokens', () => {
  it('decodes a hex escape of one to six digits, and one whitespace after it', () => {
    expect(significant('\\75 rl(x)')).toEqual([['url', 'x']]);
    expect(significant('\\000075rl(x)')).toEqual([['url', 'x']]);
    expect(significant('\\75\\72\\6c(x)')).toEqual([['url', 'x']]);
    // A line break written as CR LF is one whitespace.
    expect(significant('\\75\r\nrl(x)')).toEqual([['url', 'x']]);
    // Only one: a second space ends the name.
    expect(significant('\\75  rl')).toEqual([['ident', 'u'], ['ident', 'rl']]);
  });

  it('decodes a backslash before any other character as that character', () => {
    expect(significant('u\\rl(x)')).toEqual([['url', 'x']]);
    expect(significant('\\u\\r\\l(x)')).toEqual([['url', 'x']]);
    expect(significant('\\@import')).toEqual([['ident', '@import']]);
  });

  it('reads a name case-insensitively, but only in ASCII', () => {
    expect(significant('\\55 RL(x)')).toEqual([['url', 'x']]);
    expect(significant('URL(x)')).toEqual([['url', 'x']]);
  });

  it('decodes zero, a surrogate or a code point out of range as U+FFFD', () => {
    expect(significant('a\\0 b \\d800 c \\110000')).toEqual([['ident', 'a\uFFFDb'], ['ident', '\uFFFDc'], ['ident', '\uFFFD']]);
  });

  it('decodes escapes in an address and in a string', () => {
    expect(significant('url(h\\74tps://t.test/x)')).toEqual([['url', 'https://t.test/x']]);
    expect(significant('"\\201C" \'a\\"b\'')).toEqual([['string', '\u201C'], ['string', 'a"b']]);
  });

  it('continues a string over an escaped line break, and ends it at a bare one', () => {
    expect(significant('"a\\\nb" "c\\\r\nd"')).toEqual([['string', 'ab'], ['string', 'cd']]);
    expect(significant('"a\nb')).toEqual([['bad-string', 'a'], ['ident', 'b']]);
  });

  it('does not take a backslash before a line break outside a string as an escape', () => {
    expect(significant('u\\\nrl(x)')).toEqual([['ident', 'u'], ['delim', '\\'], ['function', 'rl'], ['ident', 'x'], [')', ')']]);
  });

  it('ends a token at a comment, and reads no comment inside a string or a url()', () => {
    expect(significant('u/**/rl(x)')).toEqual([['ident', 'u'], ['function', 'rl'], ['ident', 'x'], [')', ')']]);
    expect(significant('"/*" url(/*x*/y) "*/"')).toEqual([['string', '/*'], ['url', '/*x*/y'], ['string', '*/']]);
    expect(significant('a /* unclosed url(x)')).toEqual([['ident', 'a']]);
  });

  it('reads a quoted address as a url() function holding a string', () => {
    expect(significant('url( "x" )')).toEqual([['function', 'url'], ['string', 'x'], [')', ')']]);
  });

  it('reads a broken url() through its closing parenthesis', () => {
    expect(significant('url(a b) c')).toEqual([['bad-url', ''], ['ident', 'c']]);
    expect(significant('url(a"b\\)c) d')).toEqual([['bad-url', ''], ['ident', 'd']]);
  });

  it('reads a number with its unit as one token', () => {
    expect(significant('1url(x) 2.5e3px 50% -1\\70 x')).toEqual([
      ['number', '1url'], ['(', '('], ['ident', 'x'], [')', ')'], ['number', '2.5e3px'], ['number', '50%'], ['number', '-1px'],
    ]);
  });

  it('places each token in the text', () => {
    const css = 'a /* c */ b';
    expect(cssTokens(css).map((token) => css.slice(token.start, token.end))).toEqual(['a', ' ', ' ', 'b']);
  });
});

describe('cssUrls', () => {
  it('finds every address a browser fetches, decoded', () => {
    expect(cssUrls('background: url(a) , url("b") , URL( \'c\' ) , \\75 rl(d) , u\\rl("e")')).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(cssUrls('src: url(h\\74tps://t.test/f.woff) format("woff")')).toEqual(['https://t.test/f.woff']);
    expect(cssUrls('content: src("g")')).toEqual(['g']);
  });

  it('finds the plain strings of image() and image-set(), prefixed or not, and no other string', () => {
    expect(cssUrls('image-set("a" 1x, url(b) 2x, "c" type("image/webp") 3x)').sort()).toEqual(['a', 'b', 'c']);
    expect(cssUrls('-webkit-image-set("a" 1x) image("b") \\69mage-set("c" 1x)')).toEqual(['a', 'b', 'c']);
    expect(cssUrls('cross-fade(url(a), "b") content: "url(c)" font-family: "d"')).toEqual(['a']);
  });

  it('finds the sheet an @import names, but not the URL that names a namespace', () => {
    expect(cssUrls('@import "a.css"; @import url(b.css); @\\69mport "c.css";')).toEqual(['a.css', 'b.css', 'c.css']);
    expect(cssUrls('@namespace svg url(http://www.w3.org/2000/svg); p { background: url(x) }')).toEqual(['x']);
  });

  it('finds nothing in a broken url(), which a browser does not fetch', () => {
    expect(cssUrls('background: url(a b)')).toEqual([]);
  });
});

describe('withoutDeclarations', () => {
  const dropUrls = (declaration: string) => cssUrls(declaration).length > 0;

  it('drops the declarations picked, and keeps the rest as written', () => {
    expect(withoutDeclarations('color: red; background: url(x); margin : 0 ', dropUrls)).toBe('color: red; margin : 0');
    expect(withoutDeclarations('background: url(x)', dropUrls)).toBe('');
  });

  it('returns the style unchanged when none is picked', () => {
    const style = ' color: red;;  margin: 0; ';
    expect(withoutDeclarations(style, dropUrls)).toBe(style);
  });

  it('does not split a value at a semicolon inside a url(), a string, a function or a bracket', () => {
    const style = 'background: url(data:image/png;base64,AAAA); content: "a;b"; x: f(a;b) [c;d]; color: red';
    const kept: string[] = [];
    withoutDeclarations(style, (declaration) => {
      kept.push(declaration.trim());
      return false;
    });
    expect(kept).toEqual(['background: url(data:image/png;base64,AAAA)', 'content: "a;b"', 'x: f(a;b) [c;d]', 'color: red']);
  });

  it('keeps the line break that ends an unclosed string, so the string cannot run on', () => {
    // Without it, the string would close at the quote that opens the third
    // declaration's string and take what follows for CSS.
    const out = withoutDeclarations('a: "x\n; b: url(y); c: "; background: url(z) ;"', dropUrls);
    expect(out).toBe('a: "x\n; c: "; background: url(z) ;"');
    expect(cssUrls(out)).toEqual([]);
  });

  it('takes a comment as part of the declaration it is in', () => {
    expect(withoutDeclarations('color: red /* ; */; background: url(x)', dropUrls)).toBe('color: red /* ; */');
  });
});

describe('loadsResource', () => {
  for (const css of [
    'background: url(x)',
    'background: url("x")',
    'background: u\\rl(x)',
    'background: \\75 rl(x)',
    'background: \\000055RL(x)',
    'background: url (x)',
    'background: url/**/(x)',
    'background: u/**/rl(x)',
    'background: 1url(x)',
    'background: url(a b)',
    'background-image: image-set("x" 1x)',
    'background-image: -webkit-image-set("x" 1x)',
    'background-image: image("x")',
    'background-image: cross-fade(url(a), url(b), 50%)',
    'background-image: -webkit-cross-fade(url(a), url(b), 50%)',
    'background: element(#a)',
    'background: -moz-element(#a)',
    'background: src("x")',
    'width: expression(alert(1))',
    'width: ex/**/pression(alert(1))',
    'behavior: url(x.htc)',
    'b\\65havior: x',
    '-ms-behavior: x',
    '@import "x.css"',
  ]) {
    it(`finds a load in ${css}`, () => {
      expect(loadsResource(css)).toBe(true);
    });
  }

  for (const css of [
    'color: red',
    'content: "\\201C"',
    'content: "url(x)"',
    'font-family: \\5B8B\\4F53, "\\5FAE\\8F6F\\96C5\\9ED1", sans-serif',
    'font-family: "Image Set", "Element Sans"',
    'background: linear-gradient(red, blue)',
    'scroll-behavior: smooth',
    'overscroll-behavior: contain',
    'list-style-image: none',
    'width: calc(100% - 2px)',
  ]) {
    it(`finds no load in ${css}`, () => {
      expect(loadsResource(css)).toBe(false);
    });
  }
});
