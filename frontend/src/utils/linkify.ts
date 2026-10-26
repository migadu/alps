import { html, type TemplateResult } from 'lit';

/**
 * A link found in plain text: the `[start, end)` slice of the text it covers,
 * and the href it opens. `href` is always built here from a recognised scheme
 * (`http:`, `https:` or `mailto:`), never copied from a sender-chosen prefix, so
 * a body cannot smuggle a `javascript:` link through this path.
 */
export interface TextLink {
  start: number;
  end: number;
  href: string;
  kind: 'url' | 'email';
}

// Where a link can begin. Each hit is only a candidate: the scan below decides
// how far it reaches and whether it is a link at all. The lookbehind keeps a
// scheme or `www.` from starting one mid-word or mid-host (`xhttps://`,
// `awww.`, `cdn.www.example.com`, `ada@www.example.com`).
const ANCHOR = /(?<![\p{L}\p{N}._%+@/-])(?:https?:\/\/|www\.|mailto:)|@/giu;

// A URL runs to the first of these. `<` and `>` end it so the RFC 3986
// appendix C form `<https://example.com>` links the address without the
// brackets.
const URL_STOP = /[\s<>"`\u0000-\u001f\u007f]/u;

// Punctuation that ends a sentence far more often than it ends a URL.
const TRAILING_PUNCT = new Set(['.', ',', ';', ':', '!', '?', "'", '*']);
const CLOSERS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

// RFC 5321 caps the local part at 64 octets and the domain at 255; DNS caps a
// host name at 253. A run longer than that is not an address or a host, and
// linking its last 64 characters would invent one.
const MAX_LOCAL = 64;
const MAX_DOMAIN = 255;
const MAX_HOST = 253;

// RFC 5322 atext, plus the dots between atoms. The scan takes the whole run so
// that it never links a suffix: `o'connor@example.com` is one address, and
// stopping at the apostrophe would hand the composer `connor@example.com`.
const LOCAL_CHAR = /[\p{L}\p{N}!#$%&'*+/=?^_`{|}~.-]/u;
// Legal in a local part, but in running text far more often the `key=`, `/` or
// `|` just before an address than part of it. An address containing one is left
// unlinked rather than guessed at.
const LOCAL_UNUSUAL = /[!#$&*/=?^`{|}~]/;
const LEADING_WRAPPER = "'`*.";
const DOMAIN_CHAR = /[\p{L}\p{N}.-]/u;
const TLD = /^(?:\p{L}{2,}|xn--[a-z0-9-]+)$/iu;

function isDomain(domain: string): boolean {
  const labels = domain.split('.');
  if (labels.length < 2) return false;
  if (labels.some(l => l === '' || l.startsWith('-') || l.endsWith('-'))) return false;
  return TLD.test(labels[labels.length - 1]);
}

/**
 * Drops trailing sentence punctuation and unbalanced closing brackets. The
 * brackets are counted once, so a URL followed by thousands of `)` costs one
 * pass, not one per paren.
 */
function trimUrlEnd(text: string, start: number, end: number): number {
  const count: Record<string, number> = { '(': 0, ')': 0, '[': 0, ']': 0, '{': 0, '}': 0 };
  for (let i = start; i < end; i++) {
    if (text[i] in count) count[text[i]]++;
  }
  while (end > start) {
    const ch = text[end - 1];
    if (TRAILING_PUNCT.has(ch)) {
      end--;
      continue;
    }
    // `https://en.wikipedia.org/wiki/Foo_(bar)` keeps its paren; the one
    // closing `(see https://example.com)` does not.
    const opener = CLOSERS[ch];
    if (opener && count[ch] > count[opener]) {
      count[ch]--;
      end--;
      continue;
    }
    break;
  }
  return end;
}

/** The address around the `@` at `at`, or null when there is none. */
function scanEmail(text: string, at: number, floor: number): { start: number; end: number } | null {
  let start = at;
  while (start > floor && at - start <= MAX_LOCAL) {
    let previous = start - 1;
    const unit = text.charCodeAt(previous);
    // Read a Unicode character, rather than splitting a supplementary letter
    // and linking only the address suffix after its surrogate pair.
    if (unit >= 0xdc00 && unit <= 0xdfff && previous > floor) {
      const high = text.charCodeAt(previous - 1);
      if (high >= 0xd800 && high <= 0xdbff) previous--;
    }
    if (!LOCAL_CHAR.test(text.slice(previous, start))) break;
    start = previous;
  }
  if (at - start > MAX_LOCAL) return null;
  // Quotes, emphasis and full stops at the front of the run are the
  // sentence's, not the address's: `'ada@example.com'`, `*ada@example.com*`,
  // `...ada@example.com`. No real address starts with one.
  while (start < at && LEADING_WRAPPER.includes(text[start])) start++;
  const local = text.slice(start, at);
  if (local === '' || local.endsWith('.') || LOCAL_UNUSUAL.test(local)) return null;

  let end = at + 1;
  while (end < text.length && end - at - 1 <= MAX_DOMAIN) {
    const ch = String.fromCodePoint(text.codePointAt(end)!);
    if (!DOMAIN_CHAR.test(ch)) break;
    end += ch.length;
  }
  if (end - at - 1 > MAX_DOMAIN) return null;
  while (end > at + 1 && (text[end - 1] === '.' || text[end - 1] === '-')) end--;
  if (!isDomain(text.slice(at + 1, end))) return null;
  return { start, end };
}

/**
 * Whether the host after `www.` (from `from` up to `limit`) is a dotted name
 * rather than an address's local part. Reads at most {@link MAX_HOST}
 * characters, so a rejected candidate costs a bounded amount.
 */
function isWwwHost(text: string, from: number, limit: number): boolean {
  let end = from;
  while (end < limit && !'/?#'.includes(text[end])) {
    // `www.ada@example.com` is an address whose local part starts with "www."
    // — left to the `@` the anchor finds next.
    if (text[end] === '@') return false;
    if (++end - from > MAX_HOST) return false;
  }
  while (end > from && (TRAILING_PUNCT.has(text[end - 1]) || text[end - 1] in CLOSERS)) end--;
  return text.slice(from, end).includes('.');
}

/**
 * Finds the web addresses and email addresses in a plain-text body.
 *
 * Recognises `http://` and `https://` URLs, bare `www.` hosts (opened as
 * `https://`), `mailto:` URIs with their RFC 6068 query, and bare addresses.
 *
 * Runs in time linear in the text, because plain-text bodies are not capped
 * (one too large to inline is fetched whole and rendered whole) and the text
 * is the sender's: a body built to make this slow freezes the reader. So no
 * character is scanned twice. The end of the run a candidate sits in is
 * computed once per run and shared by every candidate in it; a rejected
 * candidate costs a bounded amount; and the bracket count for trimming is
 * taken once per accepted link, whose text no later candidate revisits.
 */
export function findLinks(text: string): TextLink[] {
  const links: TextLink[] = [];
  const anchor = new RegExp(ANCHOR.source, ANCHOR.flags);
  let floor = 0;

  // The first URL stop at or after a position. Every position in
  // [runFrom, runEnd) has the same answer, which is what is cached.
  let runFrom = -1;
  let runEnd = -1;
  const stopAfter = (i: number): number => {
    if (i >= runFrom && i < runEnd) return runEnd;
    let e = i;
    while (e < text.length && !URL_STOP.test(text[e])) e++;
    runFrom = i;
    runEnd = e;
    return e;
  };

  let m: RegExpExecArray | null;
  while ((m = anchor.exec(text)) !== null) {
    const start = m.index;
    const hit = m[0].toLowerCase();

    if (hit === '@') {
      const found = scanEmail(text, start, floor);
      if (!found) continue;
      const local = text.slice(found.start, start);
      const domain = text.slice(start + 1, found.end);
      // RFC 6068 §2: the `@` stays literal; everything else that is not
      // URI-safe in the local part is percent-encoded.
      links.push({ ...found, href: `mailto:${encodeURIComponent(local)}@${domain}`, kind: 'email' });
      floor = anchor.lastIndex = found.end;
      continue;
    }

    const after = start + hit.length;
    const stop = stopAfter(start);
    if (after >= stop) continue;

    if (hit === 'www.') {
      if (!isWwwHost(text, after, stop)) continue;
    } else if (hit !== 'mailto:' && !/[\p{L}\p{N}\[]/u.test(text[after])) {
      continue;
    }

    const end = trimUrlEnd(text, start, stop);
    // Only `mailto:` can trim down to its bare scheme (`mailto:.`), and then
    // the rest of the run was punctuation, with no candidate left in it.
    if (end <= after) continue;
    const label = text.slice(start, end);
    links.push({
      start,
      end,
      href: hit === 'www.' ? `https://${label}` : label,
      kind: hit === 'mailto:' ? 'email' : 'url',
    });
    floor = anchor.lastIndex = end;
  }
  return links;
}

/**
 * A plain-text body as Lit template parts with its links made clickable.
 *
 * Text stays text: every slice, including the visible part of each link, goes
 * through a Lit text binding, so nothing in the body is ever parsed as markup.
 * Web links open a new context with no opener and no referrer, as the HTML
 * sanitizer arranges for links in HTML mail. `mailto:` links carry no target —
 * the reader intercepts a plain click on one and opens our composer (see
 * `utils/mailto.ts`), and a modified click falls through to the browser.
 */
export function renderLinkedText(text: string): string | Array<string | TemplateResult> {
  // A card re-renders on every star, label or flag change, and the body is the
  // same string each time; a body can be megabytes. Remembered by value, a few
  // bodies deep, because a conversation shows several cards at once.
  const cached = rendered.get(text);
  if (cached !== undefined) return cached;
  const parts = buildLinkedText(text);
  if (rendered.size >= RENDER_CACHE_SIZE) rendered.delete(rendered.keys().next().value as string);
  rendered.set(text, parts);
  return parts;
}

const RENDER_CACHE_SIZE = 32;
const rendered = new Map<string, string | Array<string | TemplateResult>>();

function buildLinkedText(text: string): string | Array<string | TemplateResult> {
  const links = findLinks(text);
  if (links.length === 0) return text;
  const parts: Array<string | TemplateResult> = [];
  let pos = 0;
  for (const link of links) {
    if (link.start > pos) parts.push(text.slice(pos, link.start));
    const label = text.slice(link.start, link.end);
    parts.push(link.kind === 'url'
      ? html`<a href=${link.href} target="_blank" rel="noopener noreferrer">${label}</a>`
      : html`<a href=${link.href}>${label}</a>`);
    pos = link.end;
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return parts;
}
