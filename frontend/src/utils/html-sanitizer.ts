import * as cssParser from 'css';
import { cssUrls, loadsResource, withoutDeclarations } from './css-syntax';
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
 * Does this URL cause a fetch to somewhere the sender controls?
 *
 * The `//host/path` form matters as much as the absolute one: a browser
 * resolves it against the PAGE's scheme, so it is https in practice, and the
 * `startsWith('http')` checks this replaces saw neither prefix and let it
 * through entirely uncounted.
 */
function isRemoteUrl(value: string): boolean {
  const url = value.trim().toLowerCase();
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
}

/**
 * The URL as a browser reads its scheme: lower-cased, with every ASCII
 * whitespace and control character removed. A browser ignores those before
 * resolving a scheme, so `java\tscript:` is a live URL and ` cid:x` names a
 * part, and a check that only trims would miss both. Every scheme test in this
 * file goes through here, so the two sanitizers cannot disagree about one.
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

function proxied(url: string): string {
  return `/proxy?url=${encodeURIComponent(url.trim())}`;
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

  let modified = cssText;
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

  const images = doc.querySelectorAll('img');
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (!src) return;

    if (isCidUrl(src)) {
      const cid = cidOf(src);
      if (options.messageStructure) {
        const partPath = findPartPathByCID(options.messageStructure, cid);
        if (partPath) {
          img.src = `${partsPath}?part=${partPath}`;
        }
      }
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

  const styleTags = doc.querySelectorAll('style');
  styleTags.forEach(styleTag => {
    if (styleTag.textContent) {
      styleTag.textContent = processCSS(styleTag.textContent, options);
    }
  });

  const urlRegex = REMOTE_URL_IN_CSS();
  const elementsWithStyle = doc.querySelectorAll('[style]');
  elementsWithStyle.forEach(el => {
    const original = el.getAttribute('style') ?? '';
    let styleAttr = original;
    if (styleAttr.match(urlRegex)) {
      if (!options.allowRemoteResources) {
        styleAttr = styleAttr.replace(urlRegex, `url(${BLOCKED_PIXEL})`);
      } else {
        styleAttr = styleAttr.replace(urlRegex, (_match, quote, url) => {
          const q = quote || '"';
          return `url(${q}${proxied(url)}${q})`;
        });
      }
    }
    // What the rewrite could not reach goes with its declaration, as in a
    // style block.
    styleAttr = withoutDeclarations(styleAttr, namesRemote);
    if (styleAttr === original) return;
    if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
    if (styleAttr) el.setAttribute('style', styleAttr);
    else el.removeAttribute('style');
  });

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
 * style comes back as written when it has none.
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
      if (isScript) el.removeAttribute(attr.name);
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
