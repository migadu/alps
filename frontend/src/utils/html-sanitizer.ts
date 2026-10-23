import * as cssParser from 'css';
import { asciiLower, cssTokens, cssUrls, loadsResource, withoutDeclarations } from './css-syntax';
import { encodeMailboxPath } from './folders';
import { applyAutoDirections, AUTO_DIRECTION_STYLES, getAuthoredDirection } from './content-direction';

export interface SanitizeOptions {
  mailbox: string;
  messageUid: string;
  allowRemoteResources: boolean;
  messageStructure?: any;
  onRemoteResourceBlocked?: () => void;
}

/** A 1×1 transparent GIF: what a blocked remote image becomes, so layout does
 * not collapse and `data-original-src` can still name what was refused. */
const BLOCKED_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * The URL as the URL parser has it before it reads a scheme (the WHATWG URL
 * Standard's basic URL parser, its first steps): C0 controls and spaces
 * stripped from both ends, and every tab, line feed and carriage return
 * removed wherever it stands. To a browser `ht\ttps://host` is
 * `https://host`, and so is `\x01https://host`.
 */
function urlInput(value: string): string {
  return value.replace(/^[\x00-\x20]+|[\x00-\x20]+$/g, '').replace(/[\t\n\r]/g, '');
}

/**
 * Does this URL cause a fetch to somewhere the sender controls?
 *
 * Read as the URL parser reads it (see urlInput). Trimming, as this used to,
 * left a tab or a line break inside the scheme and a control character
 * before it, and a URL a browser fetches from the sender was taken for a
 * local one, neither counted nor rewritten.
 *
 * The `//host/path` form matters as much as the absolute one: a browser
 * resolves it against the PAGE's scheme, so it is https in practice, and the
 * `startsWith('http')` checks this replaces saw neither prefix and let it
 * through entirely uncounted. In a URL of the page's scheme a backslash is a
 * slash to the parser, so `\\host/path` and `/\host/path` are the same.
 */
function isRemoteUrl(value: string): boolean {
  const url = urlInput(value).toLowerCase();
  return url.startsWith('http:') || url.startsWith('https:') || /^[\\/]{2}/.test(url);
}

/**
 * The URL as a browser reads its scheme: lower-cased, with every ASCII
 * whitespace and control character removed. A browser ignores those before
 * resolving a scheme, so `java\tscript:` is a live URL and ` cid:x` names a
 * part, and a check that only trims would miss both. This removes more than
 * the URL parser does, a space inside the URL as well, and so errs towards
 * finding the scheme it looks for: what the script and `cid:` checks, in both
 * sanitizers, want from it.
 */
function urlScheme(value: string): string {
  return value.toLowerCase().replace(/[^\x21-\x7e]/g, '');
}

/** Does this URL name a part of the message it came in? */
function isCidUrl(value: string): boolean {
  return urlScheme(value).startsWith('cid:');
}

/** The Content-ID a `cid:` URL names, with the same characters removed that
 * `urlScheme` removes, and the case kept: the id is compared exactly. */
function cidOf(value: string): string {
  return value.replace(/[^\x21-\x7e]/g, '').substring(4);
}

/**
 * The Content-IDs markup names in its `cid:` URLs, without angle brackets:
 * the parts of the message it came in that it shows or links to. Only an
 * attribute the element uses as a URL counts: a data attribute, a title or
 * an invalid src on a paragraph cannot make a reply carry an unseen file.
 * Read srcset candidate by candidate, as the display reads it.
 */
export function cidReferencesOf(html: string): Set<string> {
  const ids = new Set<string>();
  if (!html) return ids;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const el of Array.from(doc.querySelectorAll('*'))) {
    for (const { ids: named } of cidAttributesOf(el)) named.forEach((id) => ids.add(id));
  }
  return ids;
}

const CID_URL_ATTRIBUTES: Record<string, string[]> = {
  img: ['src', 'srcset'], source: ['src', 'srcset'],
  audio: ['src'], video: ['src', 'poster'], track: ['src'],
  a: ['href'], area: ['href'],
  body: ['background'], table: ['background'], thead: ['background'],
  tbody: ['background'], tfoot: ['background'], tr: ['background'],
  td: ['background'], th: ['background'],
};

/** The attributes of `el` that it uses as a URL and that name parts by `cid:`, with the Content-IDs each names. */
function cidAttributesOf(el: Element): { name: string; ids: string[] }[] {
  const tag = el.localName.toLowerCase();
  const attributes = new Set(CID_URL_ATTRIBUTES[tag] ?? []);
  if (el.namespaceURI === 'http://www.w3.org/2000/svg' && ['a', 'image', 'use', 'feimage'].includes(tag)) {
    attributes.add('href');
    attributes.add('xlink:href');
  }
  if (tag === 'input' && el.getAttribute('type')?.toLowerCase() === 'image') attributes.add('src');
  const found: { name: string; ids: string[] }[] = [];
  for (const name of attributes) {
    const value = el.getAttribute(name);
    if (value === null) continue;
    const urls = name === 'srcset' ? parseSrcset(value).map((c) => c.url) : [value];
    const ids = urls.filter(isCidUrl).map((url) => cidOf(url).replace(/^<|>$/g, ''));
    if (ids.length) found.push({ name, ids });
  }
  return found;
}

/**
 * The markup without what names a part of `ids` by `cid:`: an image or other
 * media element goes, and another element loses the attribute. For a quote
 * whose images' parts are gone, which would otherwise go out naming parts no
 * message holds.
 */
export function withoutCidReferences(html: string, ids: ReadonlySet<string>): string {
  if (!html || !ids.size) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  let changed = false;
  for (const el of Array.from(doc.querySelectorAll('*'))) {
    for (const { name, ids: named } of cidAttributesOf(el)) {
      if (!named.some((id) => ids.has(id))) continue;
      changed = true;
      if (['img', 'source', 'input', 'video', 'audio', 'track', 'image'].includes(el.localName.toLowerCase())) {
        el.remove();
        break;
      }
      el.removeAttribute(name);
    }
  }
  return changed ? doc.body.innerHTML : html;
}

/**
 * The same question in the CSS grammar: a `url()` whose target is remote.
 *
 * ONE definition, because there were four — this pattern was written out three
 * separate times with `https?:\/\/` hardcoded, plus a fourth spelling in the
 * `@font-face` test — and when one of them learned about the protocol-relative
 * `//host/path` form, none of the others would have. A
 * `url(//tracker.example/p.gif)` in a `<style>` block, a `style=""` attribute,
 * an `@import` or an `@font-face` was therefore never counted, so the reader
 * was never offered the chance to block it.
 *
 * `(?:https?:)?\/\/` is the scheme half of `isRemoteUrl` in regex form. It is
 * built fresh per use because these are `/g` and carry `lastIndex`.
 */
const REMOTE_URL_IN_CSS = () => /url\(\s*(['"]?)((?:https?:)?\/\/[^'"\)]+)\1\s*\)/gi;

/** The same for `@import`, which may or may not wrap its target in `url()`. */
const REMOTE_IMPORT_IN_CSS = () =>
  /@import\s+(?:url\(\s*)?(['"]?)((?:https?:)?\/\/[^'"\)]+)\1\s*\)?\s*;?/gi;

/**
 * Does this CSS fetch from somewhere the sender controls, however it is
 * written?
 *
 * The two patterns above find a remote `url()` as it is usually written, so
 * that it can be rewritten in place. A browser also fetches one written with
 * escapes (`u\rl(…)`, `\75 rl(…)`, an address spelled `h\74tps:`), the plain
 * strings of an `image-set()`, and an `@import` named that way, and neither
 * pattern sees those. This reads the CSS as a browser does (see css-syntax.ts)
 * and is asked after the rewrite, so what it still finds is what the rewrite
 * could not reach: the declaration holding it is dropped and counted.
 */
function namesRemote(css: string): boolean {
  return cssUrls(css).some((url) => isRemoteUrl(urlScheme(url)));
}

/**
 * The proxy's address for a remote URL. The proxy is handed the URL the
 * browser would have fetched, resolved against this page as the frame
 * resolves it: it fetches an absolute http or https URL and nothing else, so
 * the address as written, a `//host/path` or a tab in the scheme, was refused.
 */
function proxied(url: string): string {
  let absolute: string;
  try {
    absolute = new URL(url, document.baseURI).href;
  } catch {
    absolute = urlInput(url);
  }
  return `/proxy?url=${encodeURIComponent(absolute)}`;
}

/**
 * SVG's animation elements. An `<animate>` or a `<set>` changes an attribute
 * of the element it animates while the document is shown: its
 * `attributeName` can be `href`, and its `values`, `from`, `to` or `by` a
 * script URL, so a link written as harmless becomes one that runs script when
 * clicked. Every URL check in this file reads the attribute as written, and
 * never sees that. `animateMotion`, `animateTransform` and SVG 1.1's
 * `animateColor` animate the same way, and `discard` removes an element on a
 * timer. None of them is content.
 *
 * Matched by name in any case and namespace. One outside `<svg>` does nothing
 * here, but a client that parses the markup differently may file it inside.
 */
const SVG_ANIMATIONS = new Set(['animate', 'animatecolor', 'animatemotion', 'animatetransform', 'discard', 'set']);

function removeSvgAnimations(doc: Document): void {
  for (const el of Array.from(doc.querySelectorAll('*'))) {
    if (SVG_ANIMATIONS.has(el.localName.toLowerCase())) el.remove();
  }
}

/**
 * SVG's presentation attributes that take a url(): the paint server of a
 * `fill` or a `stroke`, the element a `filter`, `mask`, `clip-path` or marker
 * applies, and the image a `cursor` shows. Each is CSS, read as a declaration
 * of its property is, escapes and all, and a url() in it that names another
 * document fetches that document.
 */
const SVG_URL_ATTRIBUTES = new Set([
  'fill', 'stroke', 'filter', 'mask', 'clip-path', 'marker-start', 'marker-mid', 'marker-end', 'cursor',
]);

/**
 * Inline CSS with each remote url() sent through the proxy or to a blank
 * pixel, and with what that rewrite cannot reach taken out by `settle`. The
 * new CSS, counted once, when anything changed; null when nothing did.
 */
function rewriteInlineCss(css: string, options: SanitizeOptions, settle: (css: string) => string): string | null {
  const rewritten = settle(css.replace(REMOTE_URL_IN_CSS(), (_match, quote, url) => {
    if (!options.allowRemoteResources) return `url(${BLOCKED_PIXEL})`;
    const q = quote || '"';
    return `url(${q}${proxied(url)}${q})`;
  }));
  if (rewritten === css) return null;
  if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
  return rewritten;
}

/** The rewritten value for a single-URL attribute, or null to leave it be. */
function rewriteSingleUrl(value: string, options: SanitizeOptions): string | null {
  if (!isRemoteUrl(value)) return null;
  if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
  return options.allowRemoteResources ? proxied(value) : BLOCKED_PIXEL;
}

/**
 * The candidates of a `srcset`, read as a browser reads them (the WHATWG
 * "parse a srcset attribute" steps).
 *
 * A candidate's URL runs to the first whitespace, and a comma inside it is
 * part of it: image CDNs put commas in their paths (`/w_1456,c_limit/pic.jpg`)
 * and a `data:` URL has one before its payload. Only a comma that ends the URL
 * token, or one after the descriptors, separates candidates. Splitting the
 * whole value on commas cut such a URL in two, and the browser was handed a
 * broken image and a relative URL that was never in the message.
 */
function parseSrcset(value: string): Array<{ url: string; descriptor: string }> {
  const candidates: Array<{ url: string; descriptor: string }> = [];
  const isSpace = (ch: string) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f';
  let i = 0;
  while (i < value.length) {
    while (i < value.length && (isSpace(value[i]) || value[i] === ',')) i++;
    if (i >= value.length) break;

    const start = i;
    while (i < value.length && !isSpace(value[i])) i++;
    let url = value.slice(start, i);

    let descriptor = '';
    if (url.endsWith(',')) {
      // A URL that ends in commas has no descriptors: the commas end it.
      url = url.replace(/,+$/, '');
    } else {
      // Descriptors run to the next comma outside parentheses.
      const from = i;
      let inParens = false;
      while (i < value.length) {
        const ch = value[i];
        if (ch === '(') inParens = true;
        else if (ch === ')') inParens = false;
        else if (ch === ',' && !inParens) break;
        i++;
      }
      const raw = value.slice(from, i).trim();
      if (raw) descriptor = ` ${raw}`;
      i++;
    }
    if (url) candidates.push({ url, descriptor });
  }
  return candidates;
}

/**
 * The same for a `srcset`, which is a COMMA-SEPARATED list of
 * `<url> <descriptor>` pairs, so it cannot go through the single-URL path
 * without collapsing every candidate but one.
 *
 * Descriptors (`2x`, `640w`) are preserved: dropping them would change which
 * candidate the browser picks even when every URL is fine.
 */
function rewriteSrcset(value: string, options: SanitizeOptions): string | null {
  const candidates = parseSrcset(value);
  if (candidates.length === 0) return null;

  let sawRemote = false;
  const rewritten = candidates.map(({ url, descriptor }) => {
    if (!isRemoteUrl(url)) return `${url}${descriptor}`;
    sawRemote = true;
    return options.allowRemoteResources ? `${proxied(url)}${descriptor}` : BLOCKED_PIXEL;
  });

  if (!sawRemote) return null;
  if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
  // Blocked: one pixel, not a list of identical pixels with descriptors that
  // would have the browser pick between copies of the same nothing.
  return options.allowRemoteResources ? rewritten.join(', ') : BLOCKED_PIXEL;
}

function findPartPathByCID(structure: any, cid: string, currentPath: string = ''): string | null {
  if (!structure) return null;

  const cleanCid = cid.replace(/^<|>$/g, '');
  if (structure.ID && structure.ID.replace(/^<|>$/g, '') === cleanCid) {
    return currentPath || '1';
  }

  if (structure.Children && Array.isArray(structure.Children)) {
    for (let i = 0; i < structure.Children.length; i++) {
      const nextPath = currentPath ? `${currentPath}.${i + 1}` : `${i + 1}`;
      const found = findPartPathByCID(structure.Children[i], cid, nextPath);
      if (found) return found;
    }
  }
  return null;
}

/** The colour scheme a message is shown in: the one its frame is painted in. */
export type ColorScheme = 'light' | 'dark';

/**
 * The media queries of a sheet or a `media` attribute as they read in
 * `scheme`, whatever the system's: asking for that scheme matches everything,
 * and asking for the other matches nothing.
 *
 * The frame a message is shown in answers `prefers-color-scheme` from the
 * operating system, not from the colours alps paints it in or from alps's
 * theme. A sender who supports dark mode recolours the text in an `@media
 * (prefers-color-scheme: dark)` block and leaves the dark canvas to the
 * client, so on a dark system the text turned white on the white alps paints.
 * A message is therefore shown in the scheme of the paint behind it: on white
 * in its light colours, the way a light system shows it, and under the
 * reader's dark theme for message content in its dark ones. A picture's
 * source goes the same way, so a white logo is not put on white.
 *
 * The feature is found in the tokens, as a browser reads it: written with
 * escapes or with comments between its parts, never inside a string, and
 * closed by the end of the text when its parenthesis is not. It is replaced
 * with a condition on the width, which a viewport always meets or never
 * does, so a query around the feature, `screen and …` or `not …`, still
 * reads as it did. The text comes back as it was when it asks for neither
 * scheme.
 */
function inScheme(css: string, scheme: ColorScheme): string {
  // The name is spelled out, in any case, or written with escapes; a sheet
  // with neither is not read at all.
  if (!css.includes('\\') && !/prefers-color-scheme/i.test(css)) return css;
  const tokens = cssTokens(css).filter((token) => token.type !== 'whitespace');
  let out = '';
  let from = 0;
  for (let k = 0; k + 3 < tokens.length; k++) {
    if (tokens[k].type !== '(') continue;
    const [name, colon, value] = [tokens[k + 1], tokens[k + 2], tokens[k + 3]];
    const close = tokens[k + 4];
    const asked = asciiLower(value.value);
    if (name.type !== 'ident' || asciiLower(name.value) !== 'prefers-color-scheme' || colon.type !== ':'
      || value.type !== 'ident' || (asked !== 'light' && asked !== 'dark') || (close && close.type !== ')')) continue;
    out += css.slice(from, tokens[k].start) + (asked === scheme ? '(width >= 0)' : '(width < 0)');
    from = close ? close.end : value.end;
    k += 4;
  }
  return out + css.slice(from);
}

/** Does this declaration set `color-scheme`? Its name is read decoded, as a browser reads it. */
function setsColorScheme(declaration: string): boolean {
  const name = cssTokens(declaration).find((token) => token.type !== 'whitespace');
  return name?.type === 'ident' && asciiLower(name.value) === 'color-scheme';
}

/**
 * A sheet without its `color-scheme` declarations, found in the tokens: the
 * name, a colon, and the value up to the `;` or `}` that ends it at its own
 * depth. For a sheet the parser cannot read; one it can loses them rule by
 * rule (see processCSS).
 */
function withoutColorSchemes(css: string): string {
  const tokens = cssTokens(css);
  let out = '';
  let from = 0;
  for (let k = 0; k < tokens.length; k++) {
    if (tokens[k].type !== 'ident' || asciiLower(tokens[k].value) !== 'color-scheme') continue;
    let j = k + 1;
    while (tokens[j]?.type === 'whitespace') j++;
    if (tokens[j]?.type !== ':') continue;
    let depth = 0;
    for (j++; j < tokens.length; j++) {
      const type = tokens[j].type;
      if (type === '(' || type === '[' || type === '{' || type === 'function') depth++;
      else if (depth > 0 && (type === ')' || type === ']' || type === '}')) depth--;
      else if (depth === 0 && (type === ';' || type === '}')) break;
    }
    out += css.slice(from, tokens[k].start);
    from = tokens[j]?.type === ';' ? tokens[j].end : (tokens[j]?.start ?? css.length);
    k = j - 1;
  }
  return out + css.slice(from);
}

/**
 * Where a sheet keeps its text, and an element the `media` it takes, in each
 * scheme; an empty `media` is none.
 */
const SCHEME_CSS = { light: 'data-alps-css-light', dark: 'data-alps-css-dark' } as const;
const SCHEME_MEDIA = { light: 'data-alps-media-light', dark: 'data-alps-media-dark' } as const;
const SCHEME_MARKERS = [...Object.values(SCHEME_CSS), ...Object.values(SCHEME_MEDIA)];

/**
 * Shows a message that sanitizeMessageHTML prepared in `scheme`. Each sheet
 * that asks for a colour scheme takes the text written for it, and each sheet
 * and picture source the media, and the document is put in that scheme:
 * inline and important on its root, which every element inherits, as the
 * sanitizer removed the sender's own `color-scheme` declarations. Its
 * `light-dark()` colours and the system colours follow.
 *
 * The sanitizer shows a message in the light scheme, as it paints the frame
 * white; whatever paints the frame dark shows it in the dark one with it.
 */
export function showColorScheme(doc: Document, scheme: ColorScheme): void {
  doc.documentElement.style.setProperty('color-scheme', scheme, 'important');
  doc.querySelectorAll(`style[${SCHEME_CSS[scheme]}]`).forEach(sheet => {
    const css = sheet.getAttribute(SCHEME_CSS[scheme]) ?? '';
    if (sheet.textContent !== css) sheet.textContent = css;
  });
  doc.querySelectorAll(`[${SCHEME_MEDIA[scheme]}]`).forEach(el => {
    const media = el.getAttribute(SCHEME_MEDIA[scheme]);
    if (media) el.setAttribute('media', media);
    else el.removeAttribute('media');
  });
}

function processCSS(cssText: string, options: SanitizeOptions): string {
  if (!cssText) return cssText;

  // The finished sheet, read once more as a browser reads it. The parser
  // below matches CSS with regular expressions and decodes no escapes, so
  // what it takes for a selector can be an `@import` to a browser:
  // `@\69mport` is one. A sheet that would still fetch from the sender after
  // everything below is dropped whole.
  const settled = (css: string): string => {
    if (!namesRemote(css)) return css;
    if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
    return '';
  };

  try {
    const ast = cssParser.parse(cssText, { silent: true });
    if (ast && ast.stylesheet && ast.stylesheet.rules) {
      const urlRegex = REMOTE_URL_IN_CSS();
      const replaceUrl = (val: string) => {
        return val.replace(urlRegex, (_match, quote, url) => {
          if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
          if (!options.allowRemoteResources) {
            return `url(${BLOCKED_PIXEL})`;
          } else {
            const q = quote || '"';
            return `url(${q}${proxied(url)}${q})`;
          }
        });
      };

      const walkRules = (rules: Array<any>) => {
        for (let i = rules.length - 1; i >= 0; i--) {
          const rule = rules[i];

          if (['rule', 'font-face', 'page', 'keyframe'].includes(rule.type) && !rule.declarations) {
            rule.declarations = [];
          }
          if (['rule', 'page'].includes(rule.type) && !rule.selectors) {
            rule.selectors = [];
          }
          if (rule.type === 'keyframe' && !rule.values) {
            rule.values = [];
          }

          if (rule.type === 'import') {
            // REMOVED whatever it names and whether or not the reader opted
            // in — the treatment `<link rel="stylesheet">` gets in
            // sanitizeMessageHTML, for the same reason: `style-src
            // 'unsafe-inline'` governs `@import` as much as `<link>`, and
            // matches no URL, so no import can load, not even through the
            // proxy. The `/proxy?url=…` rewrite this used to make on opt-in
            // produced an import the browser refused, left in the sheet
            // looking handled. Opting in cannot bring a remote sheet back; it
            // can only stop pretending to. A remote one is still counted.
            const importRule = rule as cssParser.Import;
            if (namesRemote(`@import ${importRule.import ?? ''};`) && options.onRemoteResourceBlocked) {
              options.onRemoteResourceBlocked();
            }
            rules.splice(i, 1);
            continue;
          }
          else if (rule.type === 'font-face') {
            const fontRule = rule as cssParser.FontFace;
            if (fontRule.declarations) {
              let hasRemoteFont = false;
              for (const dec of fontRule.declarations) {
                if (dec.type === 'declaration' && namesRemote((dec as cssParser.Declaration).value ?? '')) {
                  if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
                  hasRemoteFont = true;
                }
              }
              if (hasRemoteFont && !options.allowRemoteResources) {
                rules.splice(i, 1);
                continue;
              }
            }
          }

          if (rule.declarations) {
            for (let d = rule.declarations.length - 1; d >= 0; d--) {
              const dec = rule.declarations[d];
              if (dec.type !== 'declaration' || !dec.value) continue;
              // The scheme is the frame's to decide (see showColorScheme).
              if (setsColorScheme(dec.property ?? '')) {
                rule.declarations.splice(d, 1);
                continue;
              }
              if (dec.value.match(urlRegex)) {
                dec.value = replaceUrl(dec.value);
              }
              // What the rewrite could not reach goes with its declaration.
              if (namesRemote(dec.value)) {
                if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
                rule.declarations.splice(d, 1);
              }
            }
          }
          if (rule.rules) {
            walkRules(rule.rules);
          }
          // An @keyframes keeps its frames apart from `rules`, and a url() in
          // one fetches like any other.
          if (rule.keyframes) {
            walkRules(rule.keyframes);
          }
        }
      };

      walkRules(ast.stylesheet.rules);
      return settled(cssParser.stringify(ast));
    }
  } catch (err) {
    console.warn('AST CSS parsing failed, falling back to regex sanitizer', err);
  }

  let modified = withoutColorSchemes(cssText);
  const importRegex = REMOTE_IMPORT_IN_CSS();
  const urlRegex = REMOTE_URL_IN_CSS();

  if (modified.match(importRegex) || modified.match(urlRegex)) {
    if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();

    // A remote `@import` goes whatever the reader chose — see the AST branch
    // above for why the opt-in rewrite it used to get here was inert.
    modified = modified.replace(importRegex, '');
    if (!options.allowRemoteResources) {
      modified = modified.replace(/@font-face\s*\{[^{}]*\}/gi, (match) => {
        if (/url\(\s*['"]?(?:https?:)?\/\//i.test(match)) return '';
        return match;
      });
      modified = modified.replace(urlRegex, `url(${BLOCKED_PIXEL})`);
    } else {
      modified = modified.replace(urlRegex, (_match, quote, url) => {
        return `url(${quote}${proxied(url)}${quote})`;
      });
    }
  }

  return settled(modified);
}

/**
 * Does a stylesheet in the message set the direction of the document itself?
 * Only a rule that targets `<html>` or `<body>` counts: a direction on some
 * element inside says nothing about the rest of the message.
 */
function hasDocumentDirectionRule(doc: Document): boolean {
  const matchesDocument = (selector: string): boolean => {
    try { return doc.documentElement.matches(selector) || doc.body.matches(selector); }
    catch { return false; }
  };
  const containsDirection = (rules: any[]): boolean => rules.some((rule) =>
    (rule.type === 'rule'
      && rule.selectors?.some(matchesDocument)
      && rule.declarations?.some((declaration: any) => declaration.property?.toLowerCase() === 'direction'))
    || (Array.isArray(rule.rules) && containsDirection(rule.rules)),
  );
  return [...doc.querySelectorAll('style')].some((sheet) => {
    if (!/\bdirection\s*:/i.test(sheet.textContent ?? '')) return false;
    try { return containsDirection(cssParser.parse(sheet.textContent ?? '', { silent: true }).stylesheet?.rules ?? []); }
    catch { return false; }
  });
}

export function sanitizeMessageHTML(rawHtml: string, options: SanitizeOptions): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // A message runs the way its author wrote it, not the way this page does.
  // One that sets no direction for itself takes the direction of its first
  // letter, so a message in Arabic is laid out right to left whatever the
  // interface's language. A direction the author did set is kept.
  const authoredDirection = doc.documentElement.hasAttribute('dir') || doc.body.hasAttribute('dir')
    || doc.documentElement.style.direction || doc.body.style.direction
    || hasDocumentDirectionRule(doc);
  if (!authoredDirection) {
    doc.body.dir = 'auto';
  }

  // Strip everything that fetches or renders on its own, BEFORE the base/CSP/style
  // this function injects go in — so the strip cannot remove our own tags, and the
  // tags removed here cannot smuggle a remote fetch past the img-src rules below.
  // The reader/print iframes are sandboxed WITHOUT allow-scripts, so this is a
  // privacy control (a framed remote page, an @font-face or link[preload] beacon,
  // a meta refresh that navigates the pane), not the XSS boundary — that is the
  // CSP and the sandbox.
  //
  // A <noscript> stays, unlike in a quote (see sanitizeQuotedHTML): without
  // allow-scripts the frame runs no script either, so it parses one as this
  // parser did, and shows the markup that was checked here.
  doc.querySelectorAll('iframe, object, embed, frame, frameset, applet, meta[http-equiv]').forEach(el => el.remove());
  // The frame's policy refuses a script URL however it got into a link, and
  // its sandbox would refuse it without the policy. An animation still goes:
  // it sets attributes after every check here has read them.
  removeSvgAnimations(doc);
  // Only real stylesheet links survive; preload/prefetch/dns-prefetch/preconnect
  // are fetches dressed as links.
  doc.querySelectorAll('link').forEach(link => {
    if ((link.getAttribute('rel') || '').toLowerCase() !== 'stylesheet') link.remove();
  });

  const base = doc.createElement('base');
  base.target = '_blank';
  doc.head.prepend(base);

  // Where this message's inline parts are served from: a `cid:` image below is
  // pointed here, with the part in the query.
  const partsPath = `/mailboxes/${encodeMailboxPath(options.mailbox)}/messages/${options.messageUid}/raw`;

  const csp = doc.createElement('meta');
  csp.httpEquiv = 'Content-Security-Policy';
  // Default-deny: without `default-src 'none'` an iframe/object/@font-face/link
  // still reaches the network even with images "blocked", which is a read
  // receipt by another name. `style-src 'unsafe-inline'` keeps sender CSS working
  // (its url()s are already rewritten to the proxy or blocked below).
  //
  // Resources load from this message's own parts, and from the proxy only once
  // the reader has allowed remote content; never from the whole origin. Only
  // absolute and `//` URLs count as remote, so a sender who writes a relative
  // `/proxy?url=https://tracker…` in an image, a srcset, a CSS url() or an SVG
  // image is neither counted nor rewritten, and an origin-wide source let the
  // browser fetch it through our own proxy with remote content blocked. A
  // source with a path matches that path whatever the query, so the parts URL
  // covers every part of this message and no other message's.
  const resourceSources = [
    ...(options.messageUid ? [new URL(partsPath, window.location.origin).href] : []),
    ...(options.allowRemoteResources ? [`${window.location.origin}/proxy`] : []),
    'data:', 'blob:', 'cid:',
  ].join(' ');
  csp.content = `default-src 'none'; img-src ${resourceSources}; media-src ${resourceSources}; style-src 'unsafe-inline'; font-src ${resourceSources}; script-src 'none'; object-src 'none'; frame-src 'none'; child-src 'none'; form-action 'none'; base-uri 'none';`;
  doc.head.prepend(csp);

  const style = doc.createElement('style');
  style.textContent = `
    body { margin: 0; padding: 24px; box-sizing: border-box; font: 14px -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; overflow-x: auto; word-wrap: break-word; background-color: #ffffff; color: #000000; }
    @media (max-width: 768px) { body { padding: 16px !important; } }
    html:not(.x), body:not(.x) { height: auto !important; }
    p:first-child { margin-top: 0; }
    p:last-child { margin-bottom: 0; }
    a[href] { color: #3781b8; text-decoration: none; }
    a[href]:hover { text-decoration: underline; }
    blockquote[type='cite'] { margin: 0; margin-inline-start: 0.8ex; border-inline-start: 1px #ccc solid; padding-inline-start: 1ex; }
    ${AUTO_DIRECTION_STYLES}
    img { max-width: 100%; height: auto; }
  `;
  doc.head.prepend(style);

  /** Where the part a `cid:` URL names is served from; null when there is no such part. */
  const partUrl = (value: string): string | null => {
    const partPath = options.messageStructure ? findPartPathByCID(options.messageStructure, cidOf(value)) : null;
    return partPath ? `${partsPath}?part=${partPath}` : null;
  };

  const images = doc.querySelectorAll('img');
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (!src) return;

    if (isCidUrl(src)) {
      const part = partUrl(src);
      if (part) img.src = part;
    } else if (isRemoteUrl(src)) {
      if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
      if (!options.allowRemoteResources) {
        img.setAttribute('data-original-src', src);
        img.src = BLOCKED_PIXEL;
        img.style.height = '0';
        img.style.width = '0';
      } else {
        img.src = proxied(src);
      }
    }
  });

  // Every OTHER way markup names a remote image.
  //
  // The pass above only ever looked at `img[src]`, which left `srcset`, a
  // `<picture>`'s `<source>`, and a video `poster` neither counted nor
  // rewritten. The injected CSP still blocks the fetch (so this was never a
  // tracking leak), but nothing called `onRemoteResourceBlocked`, so the "load
  // remote images" banner could stay hidden for a message that has them, and a
  // reader who opted in got broken images with no way to tell why. Silent AND
  // unfixable by the user is the combination worth closing.
  for (const el of Array.from(doc.querySelectorAll('img[srcset], source[srcset], video[poster], source[src]'))) {
    for (const attr of ['srcset', 'poster', 'src'] as const) {
      const value = el.getAttribute(attr);
      if (!value) continue;
      // `img[src]` is the pass above's business; do not double-handle it.
      if (attr === 'src' && el.tagName.toLowerCase() === 'img') continue;
      const rewritten =
        attr === 'srcset'
          ? rewriteSrcset(value, options)
          : rewriteSingleUrl(value, options);
      if (rewritten !== null) el.setAttribute(attr, rewritten);
    }
  }

  // The `background` attribute of a body, table, row or cell is an image
  // source as surely as an img's src: the browser fetches it and paints the
  // element with it. It was never read, so a background on another host went
  // uncounted, and the frame's policy refused it with no banner. It is an
  // image here: a part it names is pointed at, and a remote one is counted,
  // and blocked or sent through the proxy.
  doc.querySelectorAll('[background]').forEach(el => {
    const value = el.getAttribute('background') ?? '';
    const rewritten = isCidUrl(value) ? partUrl(value) : rewriteSingleUrl(value, options);
    if (rewritten !== null) el.setAttribute('background', rewritten);
  });

  // An external stylesheet is REMOVED, opted in or not.
  //
  // This used to rewrite it to `/proxy?url=…` on the opt-in branch, and that
  // rewrite could never take effect: the CSP injected a few lines above sets
  // `style-src 'unsafe-inline'` and nothing else, and `'unsafe-inline'` is not a
  // source expression that matches URLs. No external sheet loads under it — not
  // from the sender's host, not from ours through the proxy. So the link stayed
  // in the document looking handled while the sheet was never applied.
  //
  // The refusal is still COUNTED. Opting in cannot bring this particular
  // resource back, but a message that wanted to fetch a stylesheet from the
  // sender is exactly what the banner exists to report, and staying silent about
  // it would hide a tracking fetch rather than decline it.
  doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    const href = link.getAttribute('href');
    if (href && isRemoteUrl(href)) {
      if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
      link.remove();
    }
  });

  // Every link in a message opens a new context, because <base target="_blank">
  // above says so — and the sandbox carries allow-popups-to-escape-sandbox, so
  // that context is NOT sandboxed. Modern browsers already imply noopener for
  // target=_blank, but a sender can opt back in by writing rel="opener", and
  // nothing here was reading rel at all.
  //
  // With an opener handle the attacker's page cannot READ this window
  // cross-origin, but location is one of the few properties it may WRITE: it
  // can navigate the reader iframe to a page of its choosing while the user is
  // away in the other tab. They come back to the mail client with its own
  // message pane replaced — inside our chrome, which is what makes it work.
  //
  // noreferrer is the second half: without it the click sends this app's URL to
  // whoever the sender linked, which is a read receipt that survives blocking
  // images.
  //
  // Set rather than appended, so a sender's own rel cannot contribute to it.
  doc.querySelectorAll('a[href]').forEach(anchor => {
    anchor.setAttribute('rel', 'noopener noreferrer');
  });

  // Each sheet and `media` attribute that asks for a colour scheme is written
  // out for both schemes (see inScheme), from the sender's text, before any
  // check here reads it; each version of a sheet then goes through every
  // check, whole. The sheet keeps both texts and is shown in the light one
  // (see showColorScheme below), as the frame is painted white. It stays one
  // element, so a selector that counts siblings matches as the sender wrote
  // it. Markers the sender wrote would choose what a change of scheme
  // switches, and go first.
  doc.querySelectorAll(SCHEME_MARKERS.map((name) => `[${name}]`).join(', ')).forEach(el => {
    for (const name of SCHEME_MARKERS) el.removeAttribute(name);
  });
  // A `media` attribute holds media queries too: a sheet's, or the one that
  // picks a picture's source.
  doc.querySelectorAll('[media]').forEach(el => {
    const media = el.getAttribute('media') ?? '';
    const light = inScheme(media, 'light');
    if (light === media) return;
    el.setAttribute(SCHEME_MEDIA.light, light);
    el.setAttribute(SCHEME_MEDIA.dark, inScheme(media, 'dark'));
  });
  doc.querySelectorAll('style').forEach(sheet => {
    const css = sheet.textContent;
    if (!css) return;
    const light = inScheme(css, 'light');
    if (light === css) {
      sheet.textContent = processCSS(css, options);
      return;
    }
    const shown = processCSS(light, options);
    sheet.setAttribute(SCHEME_CSS.light, shown);
    sheet.setAttribute(SCHEME_CSS.dark, processCSS(inScheme(css, 'dark'), options));
    sheet.textContent = shown;
  });

  // The scheme is the frame's to decide, and a `color-scheme` the sender set
  // on an element would let the system decide it for everything inside. Those
  // in sheets go in processCSS.
  doc.querySelectorAll('[style]').forEach(el => {
    const style = el.getAttribute('style') ?? '';
    const kept = withoutDeclarations(style, setsColorScheme);
    if (kept === style) return;
    if (kept) el.setAttribute('style', kept);
    else el.removeAttribute('style');
  });

  doc.querySelectorAll('[style]').forEach(el => {
    // What the rewrite could not reach goes with its declaration, as in a
    // style block.
    const style = rewriteInlineCss(el.getAttribute('style') ?? '', options, (css) => withoutDeclarations(css, namesRemote));
    if (style === null) return;
    if (style) el.setAttribute('style', style);
    else el.removeAttribute('style');
  });

  // SVG's presentation attributes are CSS too, one property each, and were
  // never read: a paint server, filter or cursor image on another host went
  // uncounted, and the frame's policy refused it with no banner. A remote
  // url() in one is rewritten as in a style, and one the rewrite cannot reach
  // takes the attribute with it. `url(#gradient)` names an element of this
  // document, and stays as any address does that is not remote.
  const svgUrlAttributes = [...SVG_URL_ATTRIBUTES];
  doc.querySelectorAll(svgUrlAttributes.map((name) => `[${name}]`).join(', ')).forEach(el => {
    for (const name of svgUrlAttributes) {
      const value = el.getAttribute(name);
      if (!value) continue;
      const rewritten = rewriteInlineCss(value, options, (css) => (namesRemote(css) ? '' : css));
      if (rewritten === null) continue;
      if (rewritten) el.setAttribute(name, rewritten);
      else el.removeAttribute(name);
    }
  });

  showColorScheme(doc, 'light');
  applyAutoDirections(doc);
  return doc.documentElement.outerHTML;
}

/** Does this URL run script, or a document that can, when it is followed? */
function isScriptUrl(value: string): boolean {
  const scheme = urlScheme(value);
  return scheme.startsWith('javascript:') || scheme.startsWith('vbscript:') || scheme.startsWith('data:text/html');
}

/** The attributes that hold a single URL to follow or load. */
const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'formaction', 'xlink:href', 'poster']);

/**
 * The style without the declarations that would load something: a `url()`,
 * an `image-set()` or any other function that takes an image or an address,
 * an `@import`, or old Internet Explorer's `expression()` and `behavior`. The
 * style comes back as written when it has none. A `url(#gradient)` loads
 * nothing: it names an element of the document the style is in, and an SVG
 * drawing's paint, filter, mask, clip path or marker stays with it.
 *
 * They are found as a browser reads CSS, escapes decoded and comments taken
 * out (see css-syntax.ts): matching the text `url(` missed `u\rl(` and
 * `\75 rl(`, which a browser reads as `url(`. And they go whole, because
 * cutting a value short is how a pattern that stopped at the first `)` of
 * `url("https://x.test/img?(1)")` left `")` behind, a CSS string that
 * swallowed the rest of the declaration.
 */
export function stripCssUrls(style: string): string {
  return withoutDeclarations(style, loadsResource);
}

/**
 * Strips executable content from HTML about to be QUOTED into a draft.
 *
 * Deliberately NOT {@link sanitizeMessageHTML}. That one builds a document for
 * display in our own iframe: it wraps the body in a CSP, injects a stylesheet,
 * rewrites `cid:` references into `/mailboxes/:mailbox/messages/:uid/raw?part=…`
 * URLs, and proxies or blocks remote images. Every one of those is right for
 * showing a message to its reader and wrong for one we are about to SEND — the
 * rewritten URLs point into our own origin and need the reader's session
 * cookie, so the recipient would get broken images and a look at our internal
 * URL shape.
 *
 * What this exists to stop is subtler than an XSS in our own page (the composer
 * never makes the quote live markup here: it shows it in a script-less sandboxed
 * frame, through the display sanitizer). It is that replying makes our user a
 * CARRIER: the sender's markup rides their reply out to whoever they answer,
 * and whatever executes in it does so under our user's name.
 *
 * So: remove what executes, remove the stylesheets, and change nothing else.
 * The images stay, as every mail client keeps them: a reply quotes the
 * original as the recipient saw it, and the recipient's client shows or blocks
 * its remote images as it does for any message. That a tracking pixel in the
 * original is a tracking pixel in the quote is the trade-off of quoting at
 * all; the reader's block protects the reader, not the reply's recipients.
 * A `<style>` block goes because quoted CSS escapes the quote and restyles the
 * reply around it, and an inline declaration that loads something, a `url()`
 * however it is written, goes with it: it fetches without being content.
 *
 * A `cid:` image names a part of the message it came in, which is why a reply
 * or forward carries the original's inline parts (see inlinePartsOf).
 *
 * Returns a fragment (body innerHTML), not a document — the caller embeds it.
 */
export function sanitizeQuotedHTML(rawHtml: string): string {
  if (!rawHtml) return '';
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');

  // Active content. `style` goes too: quoted CSS escapes the blockquote and
  // restyles the reply around it, and its url() values fetch just like an img.
  // A `template` holds its contents apart from the document, where no check
  // below reaches them, so they would go out exactly as the sender wrote them.
  doc
    .querySelectorAll('script, style, link, iframe, object, embed, frame, frameset, applet, form, meta, base, template')
    .forEach((el) => el.remove());
  removeSvgAnimations(doc);

  // Content another client parses differently. This parser runs no script, so
  // it reads what a <noscript> holds as markup, and the checks below see
  // markup. A recipient's client that runs script reads it as text up to the
  // first `</noscript>`, wherever that stands, in a comment or an attribute
  // value as well, and takes what follows for markup nothing here checked. A
  // <noembed> or <noframes> holds text, which goes out as written, markup
  // characters and all, for a client that does not know the element to read
  // as markup; a client that does never shows it. All three are fallback for
  // a client that lacks something, and go whole.
  doc.querySelectorAll('noscript, noembed, noframes').forEach((el) => el.remove());
  // An <xmp> or a <plaintext> shows its text as text, and that text goes out
  // as written too. A <pre> shows the same, and goes out escaped.
  for (const el of Array.from(doc.querySelectorAll('xmp, plaintext'))) {
    const pre = doc.createElement('pre');
    pre.textContent = el.textContent;
    el.replaceWith(pre);
  }

  for (const el of Array.from(doc.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      // Event handlers are the whole reason a parsed-but-inert document is not
      // already safe: nothing has run HERE, but the recipient's client will run
      // it there.
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        continue;
      }
      // Every attribute a click or a load follows as a URL. A srcset is a
      // list, and a script URL can be any of its candidates, not just the
      // first.
      const isScript = name === 'srcset'
        ? parseSrcset(attr.value).some((candidate) => isScriptUrl(candidate.url))
        : URL_ATTRIBUTES.has(name) && isScriptUrl(attr.value);
      if (isScript) {
        el.removeAttribute(attr.name);
        continue;
      }
      // SVG's presentation attributes are CSS, and a url() in one that names
      // another document is a fetch, as one in a style is: the attribute goes
      // as such a declaration goes. `url(#gradient)` names an element of the
      // quote itself, and stays.
      if (SVG_URL_ATTRIBUTES.has(name) && loadsResource(attr.value)) {
        el.removeAttribute(attr.name);
        continue;
      }
      // A table or a cell paints itself with the image its `background`
      // names: a remote one is a fetch that is not content, and goes as a
      // background in a style goes. A `cid:` one names a part the reply
      // carries, and stays.
      if (name === 'background' && isRemoteUrl(attr.value)) el.removeAttribute(attr.name);
    }
    // Inline styles survive as formatting, not as a fetch: see the docstring.
    const style = el.getAttribute('style');
    const formatting = style && stripCssUrls(style);
    if (formatting !== style) {
      if (formatting) el.setAttribute('style', formatting);
      else el.removeAttribute('style');
    }
  }

  // A frameset document has no body once its frameset is gone.
  if (!doc.body) return '';
  // A fragment has no <html> or <body> to carry the direction and language
  // the original set there, so they move to a wrapper. Without it an Arabic
  // original quoted into an English reply was laid out left to right.
  const direction = getAuthoredDirection(doc.body) ?? getAuthoredDirection(doc.documentElement);
  if (direction) {
    const wrapper = doc.createElement('div');
    wrapper.dir = direction;
    const language = doc.body.getAttribute('lang') ?? doc.documentElement.getAttribute('lang');
    if (language) wrapper.lang = language;
    wrapper.innerHTML = doc.body.innerHTML;
    return wrapper.outerHTML;
  }
  return doc.body.innerHTML;
}

/**
 * Escapes a sender-controlled string for interpolation into HTML.
 *
 * The quote header in `email-quote.ts` builds markup out of the display name,
 * address, subject and recipient list of the message being answered. All four
 * come from the sender. A display name containing `<` broke the header; one
 * containing a tag injected it into the draft.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
