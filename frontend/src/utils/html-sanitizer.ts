import * as cssParser from 'css';
import { encodeMailboxPath } from './folders';

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

function proxied(url: string): string {
  return `/proxy?url=${encodeURIComponent(url.trim())}`;
}

/** The rewritten value for a single-URL attribute, or null to leave it be. */
function rewriteSingleUrl(value: string, options: SanitizeOptions): string | null {
  if (!isRemoteUrl(value)) return null;
  if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
  return options.allowRemoteResources ? proxied(value) : BLOCKED_PIXEL;
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
  const candidates = value.split(',').map((c) => c.trim()).filter(Boolean);
  if (candidates.length === 0) return null;

  let sawRemote = false;
  const rewritten = candidates.map((candidate) => {
    // The URL runs to the first whitespace; anything after it is the descriptor.
    const split = candidate.search(/\s/);
    const url = split === -1 ? candidate : candidate.slice(0, split);
    const descriptor = split === -1 ? '' : candidate.slice(split);
    if (!isRemoteUrl(url)) return candidate;
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
            const importRule = rule as cssParser.Import;
            // `(?:https?:)?\/\/` for the same reason as everywhere else in this
            // file: a protocol-relative `@import "//host/x.css"` fetches just
            // like an absolute one.
            if (importRule.import && importRule.import.match(/(?:https?:)?\/\//i)) {
              // Counted, and REMOVED whether or not the reader opted in — the
              // treatment `<link rel="stylesheet">` gets in sanitizeMessageHTML,
              // for the same reason: `style-src 'unsafe-inline'` governs
              // `@import` as much as `<link>`, so the `/proxy?url=…` rewrite
              // this used to make on opt-in produced an import the browser
              // refused, left in the sheet looking handled. Opting in cannot
              // bring a remote sheet back; it can only stop pretending to.
              if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
              rules.splice(i, 1);
              continue;
            }
          }
          else if (rule.type === 'font-face') {
            const fontRule = rule as cssParser.FontFace;
            if (fontRule.declarations) {
              let hasRemoteFont = false;
              for (const dec of fontRule.declarations) {
                if (dec.type === 'declaration' && (dec as cssParser.Declaration).value?.match(urlRegex)) {
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
            for (const dec of rule.declarations) {
              if (dec.type === 'declaration' && dec.value && dec.value.match(urlRegex)) {
                dec.value = replaceUrl(dec.value);
              }
            }
          }
          if (rule.rules) {
            walkRules(rule.rules);
          }
        }
      };

      walkRules(ast.stylesheet.rules);
      return cssParser.stringify(ast);
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

  return modified;
}

export function sanitizeMessageHTML(rawHtml: string, options: SanitizeOptions): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Strip everything that fetches or renders on its own, BEFORE the base/CSP/style
  // this function injects go in — so the strip cannot remove our own tags, and the
  // tags removed here cannot smuggle a remote fetch past the img-src rules below.
  // The reader/print iframes are sandboxed WITHOUT allow-scripts, so this is a
  // privacy control (a framed remote page, an @font-face or link[preload] beacon,
  // a meta refresh that navigates the pane), not the XSS boundary — that is the
  // CSP and the sandbox.
  doc.querySelectorAll('iframe, object, embed, frame, frameset, applet, meta[http-equiv]').forEach(el => el.remove());
  // Only real stylesheet links survive; preload/prefetch/dns-prefetch/preconnect
  // are fetches dressed as links.
  doc.querySelectorAll('link').forEach(link => {
    if ((link.getAttribute('rel') || '').toLowerCase() !== 'stylesheet') link.remove();
  });

  const base = doc.createElement('base');
  base.target = '_blank';
  doc.head.prepend(base);

  const csp = doc.createElement('meta');
  csp.httpEquiv = 'Content-Security-Policy';
  // Default-deny: without `default-src 'none'` an iframe/object/@font-face/link
  // still reaches the network even with images "blocked", which is a read
  // receipt by another name. `style-src 'unsafe-inline'` keeps sender CSS working
  // (its url()s are already rewritten to the proxy or blocked below).
  csp.content = `default-src 'none'; img-src ${window.location.origin} data: blob: cid:; media-src ${window.location.origin} data: blob: cid:; style-src 'unsafe-inline'; font-src ${window.location.origin} data:; script-src 'none'; object-src 'none'; frame-src 'none'; child-src 'none'; form-action 'none'; base-uri 'none';`;
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
    blockquote[type='cite'] { margin: 0 0 0 0.8ex; border-left: 1px #ccc solid; padding-left: 1ex; }
    img { max-width: 100%; height: auto; }
  `;
  doc.head.prepend(style);

  const images = doc.querySelectorAll('img');
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (!src) return;

    if (src.toLowerCase().startsWith('cid:')) {
      const cid = src.substring(4);
      if (options.messageStructure) {
        const partPath = findPartPathByCID(options.messageStructure, cid);
        if (partPath) {
          img.src = `/mailboxes/${encodeMailboxPath(options.mailbox)}/messages/${options.messageUid}/raw?part=${partPath}`;
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
    let styleAttr = el.getAttribute('style');
    if (styleAttr && styleAttr.match(urlRegex)) {
      if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
      if (!options.allowRemoteResources) {
        styleAttr = styleAttr.replace(urlRegex, `url(${BLOCKED_PIXEL})`);
      } else {
        styleAttr = styleAttr.replace(urlRegex, (_match, quote, url) => {
          const q = quote || '"';
          return `url(${q}${proxied(url)}${q})`;
        });
      }
      el.setAttribute('style', styleAttr);
    }
  });

  return doc.documentElement.outerHTML;
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
 * What this exists to stop is subtler than an XSS in our own page. It is that
 * replying makes our user a CARRIER: the sender's markup rides their reply out
 * to whoever they answer. The tracking pixel is the sharp case — the reader
 * blocks remote images precisely so a sender cannot learn the mail was read,
 * and quoting the tag unmodified re-arms it in the outgoing copy, under our
 * user's name.
 *
 * So: remove what executes or fetches on the recipient's behalf, and change
 * nothing else. Remote `src` URLs are left EXACTLY as the sender wrote them —
 * rewriting them is the display concern this function exists to avoid.
 *
 * Returns a fragment (body innerHTML), not a document — the caller embeds it.
 */
export function sanitizeQuotedHTML(rawHtml: string): string {
  if (!rawHtml) return '';
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');

  // Active content. `style` goes too: quoted CSS escapes the blockquote and
  // restyles the reply around it, and its url() values fetch just like an img.
  doc
    .querySelectorAll('script, style, link, iframe, object, embed, form, meta, base')
    .forEach((el) => el.remove());

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
      if (name === 'href' || name === 'src' || name === 'srcset' || name === 'action') {
        // Browsers ignore ASCII whitespace and control characters before
        // resolving a scheme, so `java\tscript:` is a live URL. Compare with
        // all of them removed rather than trusting a trim.
        const scheme = attr.value.toLowerCase().replace(/[^\x21-\x7e]/g, '');
        if (scheme.startsWith('javascript:') || scheme.startsWith('vbscript:') || scheme.startsWith('data:text/html')) {
          el.removeAttribute(attr.name);
        }
      }
    }
    // Inline styles survive as formatting, but not as a fetch: a url() in a
    // style attribute loads on render exactly like an img src does.
    const style = el.getAttribute('style');
    if (style && /url\s*\(/i.test(style)) {
      el.setAttribute('style', style.replace(/url\s*\([^)]*\)/gi, ''));
    }
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
