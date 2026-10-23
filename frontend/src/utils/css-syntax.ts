/**
 * Enough of the CSS tokenizer (CSS Syntax Level 3, section 4) to tell what a
 * sender's CSS will load, read the way a browser reads it.
 *
 * Looking for the text `url(` is not that. CSS lets a name be written with
 * escapes, so `u\rl(` and `\75 rl(` are both `url(` to a browser; a comment
 * ends a token wherever it stands; and a string can hold `url(` without
 * loading anything. The tokens here carry their names, strings and addresses
 * decoded, and their place in the text, so that a caller can drop a whole
 * declaration rather than rewrite a piece of one.
 */

export type CssTokenType =
  | 'ident' | 'function' | 'at-keyword' | 'hash' | 'string' | 'bad-string' | 'url' | 'bad-url'
  | 'number' | 'whitespace' | 'delim' | 'cdo' | 'cdc'
  | ':' | ';' | ',' | '(' | ')' | '[' | ']' | '{' | '}';

export interface CssToken {
  type: CssTokenType;
  /**
   * The name of an ident, function, at-keyword or hash, the contents of a
   * string, or the address of a url, escapes decoded; a number with its unit
   * decoded; otherwise the text itself.
   */
  value: string;
  /** Where the token lies in the text. Comments lie between tokens. */
  start: number;
  end: number;
}

const PUNCTUATION = new Set([':', ';', ',', '(', ')', '[', ']', '{', '}']);

const isNewline = (c: string) => c === '\n' || c === '\r' || c === '\f';
const isWhitespace = (c: string) => c === ' ' || c === '\t' || isNewline(c);
const isDigit = (c: string) => c >= '0' && c <= '9';
const isHexDigit = (c: string) => isDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
const isIdentStart = (c: string) =>
  (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '\0' || c.charCodeAt(0) >= 0x80;
const isIdentChar = (c: string) => isIdentStart(c) || isDigit(c) || c === '-';
/** A control character that is not whitespace: it spoils an unquoted url(). */
const isNonPrintable = (c: string) => {
  const code = c.charCodeAt(0);
  return (code >= 0x01 && code <= 0x08) || code === 0x0b || (code >= 0x0e && code <= 0x1f) || code === 0x7f;
};
/** A NUL reads as U+FFFD, as CSS's input stream replaces it. */
const decoded = (c: string) => (c === '\0' ? '�' : c);

/** Names compare ASCII case-insensitively, and no other way. */
export const asciiLower = (name: string) => name.replace(/[A-Z]/g, (c) => c.toLowerCase());

/** A function name without its vendor prefix: `-webkit-image-set` is `image-set`. */
const unprefixed = (name: string) => asciiLower(name).replace(/^-[a-z]+-(?=.)/, '');

/** The tokens of `css`, as a browser's tokenizer produces them. */
export function cssTokens(css: string): CssToken[] {
  const tokens: CssToken[] = [];
  let i = 0;
  const at = (k: number): string => css[k] ?? '';

  /** A backslash starts an escape unless a line break follows it. */
  const isEscape = (k: number) => at(k) === '\\' && !isNewline(at(k + 1));
  const startsName = (k: number) =>
    at(k) === '-'
      ? isIdentStart(at(k + 1)) || at(k + 1) === '-' || isEscape(k + 1)
      : isIdentStart(at(k)) || isEscape(k);
  const startsNumber = (k: number) => {
    let c = at(k);
    if (c === '+' || c === '-') c = at(++k);
    return isDigit(c) || (c === '.' && isDigit(at(k + 1)));
  };

  /**
   * One escaped code point, from the backslash on: up to six hex digits and
   * one whitespace after them, or the next character as itself.
   */
  const consumeEscape = (): string => {
    i++;
    const c = at(i);
    if (c === '') return '�';
    if (!isHexDigit(c)) {
      i++;
      return decoded(c);
    }
    let hex = '';
    while (hex.length < 6 && isHexDigit(at(i))) hex += css[i++];
    if (at(i) === '\r' && at(i + 1) === '\n') i += 2;
    else if (isWhitespace(at(i))) i++;
    const code = parseInt(hex, 16);
    return code === 0 || (code >= 0xd800 && code <= 0xdfff) || code > 0x10ffff ? '�' : String.fromCodePoint(code);
  };

  const consumeName = (): string => {
    let name = '';
    for (;;) {
      if (isIdentChar(at(i))) name += decoded(css[i++]);
      else if (isEscape(i)) name += consumeEscape();
      else return name;
    }
  };

  const consumeString = (quote: string): [CssTokenType, string] => {
    let text = '';
    i++;
    for (;;) {
      const c = at(i);
      if (c === '') return ['string', text];
      if (c === quote) {
        i++;
        return ['string', text];
      }
      // An unescaped line break ends the string unclosed, and is not part of it.
      if (isNewline(c)) return ['bad-string', text];
      if (c !== '\\') {
        text += decoded(c);
        i++;
        continue;
      }
      const next = at(i + 1);
      if (next === '') i++;
      // An escaped line break continues the string and adds nothing to it.
      else if (isNewline(next)) i += next === '\r' && at(i + 2) === '\n' ? 3 : 2;
      else text += consumeEscape();
    }
  };

  /** What is left of a broken url(), through its closing parenthesis. */
  const consumeBadUrl = (): [CssTokenType, string] => {
    for (;;) {
      const c = at(i);
      if (c === '') break;
      if (c === ')') {
        i++;
        break;
      }
      if (isEscape(i)) consumeEscape();
      else i++;
    }
    return ['bad-url', ''];
  };

  /** An unquoted url(), from after its parenthesis. */
  const consumeUrl = (): [CssTokenType, string] => {
    let url = '';
    while (isWhitespace(at(i))) i++;
    for (;;) {
      const c = at(i);
      if (c === '') return ['url', url];
      if (c === ')') {
        i++;
        return ['url', url];
      }
      if (isWhitespace(c)) {
        while (isWhitespace(at(i))) i++;
        if (at(i) === '') return ['url', url];
        if (at(i) === ')') {
          i++;
          return ['url', url];
        }
        return consumeBadUrl();
      }
      if (c === '"' || c === "'" || c === '(' || isNonPrintable(c)) return consumeBadUrl();
      if (c === '\\') {
        if (!isEscape(i)) return consumeBadUrl();
        url += consumeEscape();
        continue;
      }
      url += decoded(c);
      i++;
    }
  };

  const consumeIdentLike = (): [CssTokenType, string] => {
    const name = consumeName();
    if (at(i) !== '(') return ['ident', name];
    i++;
    if (asciiLower(name) !== 'url') return ['function', name];
    // A quoted address makes `url(` a function like any other, with a string in it.
    while (isWhitespace(at(i)) && isWhitespace(at(i + 1))) i++;
    const next = isWhitespace(at(i)) ? at(i + 1) : at(i);
    if (next === '"' || next === "'") return ['function', name];
    return consumeUrl();
  };

  const consumeNumber = (): string => {
    const from = i;
    if (at(i) === '+' || at(i) === '-') i++;
    while (isDigit(at(i))) i++;
    if (at(i) === '.' && isDigit(at(i + 1))) {
      i++;
      while (isDigit(at(i))) i++;
    }
    if ((at(i) === 'e' || at(i) === 'E')
      && (isDigit(at(i + 1)) || ((at(i + 1) === '+' || at(i + 1) === '-') && isDigit(at(i + 2))))) {
      i += isDigit(at(i + 1)) ? 1 : 2;
      while (isDigit(at(i))) i++;
    }
    const number = css.slice(from, i);
    if (startsName(i)) return number + consumeName();
    if (at(i) === '%') {
      i++;
      return `${number}%`;
    }
    return number;
  };

  while (i < css.length) {
    if (at(i) === '/' && at(i + 1) === '*') {
      const close = css.indexOf('*/', i + 2);
      i = close === -1 ? css.length : close + 2;
      continue;
    }
    const start = i;
    const c = css[i];
    let type: CssTokenType;
    let value = c;
    if (isWhitespace(c)) {
      while (isWhitespace(at(i))) i++;
      type = 'whitespace';
      value = ' ';
    } else if (c === '"' || c === "'") {
      [type, value] = consumeString(c);
    } else if (c === '#' && (isIdentChar(at(i + 1)) || isEscape(i + 1))) {
      i++;
      type = 'hash';
      value = consumeName();
    } else if (startsNumber(i)) {
      type = 'number';
      value = consumeNumber();
    } else if (css.startsWith('<!--', i)) {
      i += 4;
      type = 'cdo';
      value = '<!--';
    } else if (css.startsWith('-->', i)) {
      i += 3;
      type = 'cdc';
      value = '-->';
    } else if (startsName(i)) {
      [type, value] = consumeIdentLike();
    } else if (c === '@' && startsName(i + 1)) {
      i++;
      type = 'at-keyword';
      value = consumeName();
    } else {
      i++;
      type = PUNCTUATION.has(c) ? (c as CssTokenType) : 'delim';
    }
    tokens.push({ type, value, start, end: i });
  }
  return tokens;
}

/** The closing token a function or an opening bracket waits for, if `token` is one. */
function closerOf(token: CssToken): CssTokenType | null {
  if (token.type === 'function' || token.type === '(') return ')';
  if (token.type === '[') return ']';
  if (token.type === '{') return '}';
  return null;
}

/**
 * The declarations of a style attribute, as offsets: the text between its
 * semicolons. A semicolon inside a string, a url(), a function or a bracket
 * belongs to the value around it, as it does to a browser, which is why
 * `url(data:image/png;base64,…)` is one declaration and not two.
 */
function cssDeclarations(style: string): Array<[number, number]> {
  const declarations: Array<[number, number]> = [];
  const closers: CssTokenType[] = [];
  let start = 0;
  for (const token of cssTokens(style)) {
    const closer = closerOf(token);
    if (closer) closers.push(closer);
    else if (token.type === closers[closers.length - 1]) closers.pop();
    else if (token.type === ';' && closers.length === 0) {
      declarations.push([start, token.start]);
      start = token.end;
    }
  }
  declarations.push([start, style.length]);
  return declarations;
}

const trimCss = (text: string) => text.replace(/^[ \t\n\r\f]+|[ \t\n\r\f]+$/g, '');

/**
 * The style attribute without the declarations `drop` picks, the rest as the
 * sender wrote them. The style itself, unchanged, when `drop` picks none.
 *
 * Kept declarations are not trimmed: a string a line break left unclosed ends
 * at that line break, and without it the string would run on into the next
 * declaration.
 */
export function withoutDeclarations(style: string, drop: (declaration: string) => boolean): string {
  const kept: string[] = [];
  let dropped = false;
  for (const [start, end] of cssDeclarations(style)) {
    const declaration = style.slice(start, end);
    if (drop(declaration)) dropped = true;
    else if (trimCss(declaration)) kept.push(declaration);
  }
  return dropped ? trimCss(kept.join(';')) : style;
}

/** Functions whose bare strings are addresses, as in `image-set("a.png" 1x)`. */
const IMAGE_FUNCTIONS = new Set(['image', 'image-set']);

/**
 * Every address in `css` a browser would fetch, decoded: each url(), the
 * string of a quoted `url("…")` or `src("…")`, the strings of an `image()` or
 * `image-set()`, and the sheet an `@import` names. A namespace's URL is a
 * name, not a fetch, and is left out.
 */
export function cssUrls(css: string): string[] {
  const tokens = cssTokens(css).filter((token) => token.type !== 'whitespace');
  const urls: string[] = [];
  for (let k = 0; k < tokens.length; k++) {
    const token = tokens[k];
    const next = tokens[k + 1];
    if (token.type === 'url') {
      urls.push(token.value);
    } else if (token.type === 'function') {
      const name = unprefixed(token.value);
      if ((name === 'url' || name === 'src') && next?.type === 'string') {
        urls.push(next.value);
      } else if (IMAGE_FUNCTIONS.has(name)) {
        // Its own arguments only: a string inside a nested function is that
        // function's, and the loop reaches it there.
        const closers: CssTokenType[] = [')'];
        for (let j = k + 1; j < tokens.length && closers.length > 0; j++) {
          const inner = tokens[j];
          const closer = closerOf(inner);
          if (closer) closers.push(closer);
          else if (inner.type === closers[closers.length - 1]) closers.pop();
          else if (inner.type === 'string' && closers.length === 1) urls.push(inner.value);
        }
      }
    } else if (token.type === 'at-keyword') {
      const name = asciiLower(token.value);
      if (name === 'import' && next?.type === 'string') urls.push(next.value);
      else if (name === 'namespace') {
        while (k + 1 < tokens.length && tokens[k + 1].type !== ';') k++;
      }
    }
  }
  return urls;
}

/**
 * What makes a client load or run something, by name: every function that
 * takes an image or an address, `@import`, and old Internet Explorer's
 * `expression()` and `behavior`. A vendor-prefixed name contains the plain
 * one, so `-webkit-image-set(` and `-moz-element(` match too.
 */
const LOADS = /(?:url|src|image|image-set|cross-fade|element|expression)\s*\(|@import|(?:^|[^\w-])(?:-ms-)?behavior\s*:/i;

/**
 * Where the url() at `tokens[k]` ends, if it names an element of the document
 * the style is in, as `url(#gradient)` does; -1 if it is not one. CSS reads a
 * url() whose address starts with `#` as such a reference whatever the
 * document's base URL (CSS Values 4, the "local url flag"), so it fetches
 * nothing. Written as a url token or as `url(` holding one string, as a
 * browser reads them, and no other way.
 */
function localReferenceEnd(tokens: CssToken[], k: number): number {
  const token = tokens[k];
  if (token.type === 'url') return token.value.startsWith('#') ? k : -1;
  if (token.type !== 'function' || asciiLower(token.value) !== 'url') return -1;
  let j = k + 1;
  while (tokens[j]?.type === 'whitespace') j++;
  if (tokens[j]?.type !== 'string' || !tokens[j].value.startsWith('#')) return -1;
  j++;
  while (tokens[j]?.type === 'whitespace') j++;
  return tokens[j]?.type === ')' ? j : -1;
}

/**
 * Could this CSS make a client load or run anything at all, whatever the
 * address and however leniently the client reads it?
 *
 * Read from the tokens with every name decoded, every string emptied and every
 * comment taken out, so a comment cannot split a name from a client that joins
 * the halves again, and a space before the parenthesis does not hide one from
 * a client that tolerates it. A string is only text unless one of these
 * functions holds it, and the function is enough to find.
 *
 * A url() that names an element of the same document, `url(#gradient)`, is
 * not a load: an SVG paint, filter, mask, clip path or marker takes one.
 */
export function loadsResource(css: string): boolean {
  const tokens = cssTokens(css);
  let text = '';
  for (let k = 0; k < tokens.length; k++) {
    const local = localReferenceEnd(tokens, k);
    if (local !== -1) {
      text += ' ';
      k = local;
      continue;
    }
    const token = tokens[k];
    switch (token.type) {
      case 'function': text += `${token.value}(`; break;
      case 'at-keyword': text += `@${token.value}`; break;
      case 'hash': text += `#${token.value}`; break;
      case 'url':
      case 'bad-url': text += 'url()'; break;
      case 'string':
      case 'bad-string': text += '""'; break;
      default: text += token.value;
    }
  }
  return LOADS.test(text);
}
