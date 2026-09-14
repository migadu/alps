/**
 * The message sanitizer.
 *
 * The backend does not sanitize message HTML, so what makes a message safe to
 * show is decided here and by the sandboxed iframe it lands in. Scripts are
 * stopped by the injected CSP and the sandbox rather than by stripping, so these
 * tests check that those controls are present — and that every way markup can
 * fetch from the sender is counted, because the "load remote content" banner
 * depends on it, and is then either blocked or sent through the proxy.
 */
import { describe, expect, it } from 'vitest';
import { sanitizeMessageHTML, type SanitizeOptions } from '../src/utils/html-sanitizer';

const BASE: SanitizeOptions = { mailbox: 'INBOX', messageUid: '42', allowRemoteResources: false };
const blocked = (html: string, extra: Partial<SanitizeOptions> = {}) => sanitizeMessageHTML(html, { ...BASE, ...extra });
const allowed = (html: string, extra: Partial<SanitizeOptions> = {}) =>
  sanitizeMessageHTML(html, { ...BASE, allowRemoteResources: true, ...extra });
const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');
const attr = (html: string, selector: string, name: string) => parse(html).querySelector(selector)?.getAttribute(name) ?? '';
const PIXEL = /^data:image\/gif;base64,/;

function countBlocked(html: string, allowRemoteResources = false): number {
  let n = 0;
  sanitizeMessageHTML(html, { ...BASE, allowRemoteResources, onRemoteResourceBlocked: () => { n += 1; } });
  return n;
}

/** The output with every proxied URL removed, so a host left in it is one the browser would fetch directly. */
const withoutProxied = (html: string) => html.replace(/\/proxy\?url=[^"')\s,]+/g, '');

describe('the injected policy', () => {
  const csp = (html: string) => attr(blocked(html), 'meta[http-equiv="Content-Security-Policy"]', 'content');

  it('is default-deny and forbids scripts, frames, objects, forms and base changes', () => {
    const policy = csp('<p>hi</p>');
    for (const directive of [
      "default-src 'none'", "script-src 'none'", "object-src 'none'", "frame-src 'none'",
      "child-src 'none'", "form-action 'none'", "base-uri 'none'", "style-src 'unsafe-inline'",
    ]) {
      expect(policy, directive).toContain(directive);
    }
  });

  it('lets images and media load only from this origin and inline data', () => {
    const policy = csp('<p>hi</p>');
    expect(policy).toContain(`img-src ${window.location.origin} data: blob: cid:`);
    expect(policy).toContain(`media-src ${window.location.origin} data: blob: cid:`);
  });

  it('comes before any of the sender\'s markup', () => {
    // A meta CSP governs only what follows it.
    const out = blocked('<p>hi</p>');
    expect(out.indexOf('Content-Security-Policy')).toBeLessThan(out.indexOf('<p>hi</p>'));
  });

  it('opens links in a new context rather than in the reader', () => {
    expect(attr(blocked('<a href="https://example.test">x</a>'), 'base', 'target')).toBe('_blank');
  });
});

describe('elements that fetch or render on their own', () => {
  it('removes frames, objects, embeds and applets', () => {
    const doc = parse(blocked(
      '<iframe src="https://evil.test/a"></iframe><object data="https://evil.test/b"></object>' +
      '<embed src="https://evil.test/c"><applet code="x"></applet><p>hi</p>',
    ));
    for (const tag of ['iframe', 'object', 'embed', 'applet']) expect(doc.querySelector(tag), tag).toBeNull();
    expect(doc.querySelector('p')?.textContent).toBe('hi');
  });

  it('removes a sender\'s meta refresh, leaving only the injected policy', () => {
    const doc = parse(blocked('<meta http-equiv="refresh" content="0;url=https://evil.test"><p>hi</p>'));
    const metas = [...doc.querySelectorAll('meta[http-equiv]')].map((m) => m.getAttribute('http-equiv'));
    expect(metas).toEqual(['Content-Security-Policy']);
  });

  it('drops links that are fetches dressed as links, even when remote content is allowed', () => {
    const doc = parse(allowed(
      '<link rel="preload" href="https://evil.test/f.woff"><link rel="prefetch" href="https://evil.test/x">' +
      '<link rel="dns-prefetch" href="//evil.test">',
    ));
    expect(doc.querySelectorAll('link')).toHaveLength(0);
  });

  it('removes a remote stylesheet whatever the reader chose, and still counts it', () => {
    // style-src 'unsafe-inline' matches no URL, so no external sheet can load:
    // proxying it would only leave a link that looks handled.
    const html = '<link rel="stylesheet" href="https://cdn.test/s.css"><p>hi</p>';
    expect(parse(allowed(html)).querySelector('link')).toBeNull();
    expect(countBlocked(html, true)).toBe(1);
  });

  it('removes a remote @import whatever the reader chose, and keeps the rest of the sheet', () => {
    const html = '<style>@import url("https://cdn.test/s.css"); @import "//cdn.test/t.css"; p { color: red }</style>';
    const out = allowed(html);
    expect(out).not.toContain('@import');
    expect(out).not.toContain('cdn.test');
    expect(out).toMatch(/color:\s*red/);
    expect(countBlocked(html, true)).toBeGreaterThan(0);
  });

  it('keeps an inline style that only formats', () => {
    expect(attr(blocked('<p style="color:red">hi</p>'), 'p', 'style')).toContain('color:red');
  });
});

describe('remote images', () => {
  it('blocks one by default, keeping the original address for later', () => {
    const out = blocked('<img src="https://tracker.test/pixel.gif">');
    expect(attr(out, 'img', 'src')).toMatch(PIXEL);
    expect(attr(out, 'img', 'data-original-src')).toBe('https://tracker.test/pixel.gif');
    expect(attr(out, 'img', 'style')).toMatch(/height:\s*0/);
  });

  it('counts each one, so the reader can be offered to load them', () => {
    expect(countBlocked('<img src="https://a.test/1.gif"><img src="http://b.test/2.gif">')).toBe(2);
  });

  it('sends an allowed image through the proxy, never directly', () => {
    expect(attr(allowed('<img src="https://cdn.test/a.png">'), 'img', 'src')).toBe('/proxy?url=https%3A%2F%2Fcdn.test%2Fa.png');
  });

  it('treats a protocol-relative address as remote', () => {
    // A browser resolves //host/path against the page's scheme.
    expect(attr(blocked('<img src="//tracker.test/p.gif">'), 'img', 'src')).toMatch(PIXEL);
    expect(attr(allowed('<img src="//cdn.test/a.png">'), 'img', 'src')).toBe('/proxy?url=%2F%2Fcdn.test%2Fa.png');
    expect(countBlocked('<img src="//tracker.test/p.gif">')).toBe(1);
  });

  it('leaves local and inline images alone', () => {
    const gif = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    const out = blocked(`<img src="/assets/logo.png"><img src="${gif}">`);
    const imgs = parse(out).querySelectorAll('img');
    expect(imgs[0].getAttribute('src')).toBe('/assets/logo.png');
    expect(imgs[1].getAttribute('src')).toBe(gif);
    expect(countBlocked(`<img src="/assets/logo.png"><img src="${gif}">`)).toBe(0);
  });
});

describe('addresses outside img[src]', () => {
  it('replaces a blocked srcset with a single pixel', () => {
    const out = blocked('<img srcset="https://tracker.test/p.gif 1x, https://tracker.test/p2.gif 2x">');
    expect(attr(out, 'img', 'srcset')).toMatch(PIXEL);
    expect(out).not.toContain('tracker.test');
    expect(countBlocked('<img srcset="https://tracker.test/p.gif 1x">')).toBe(1);
  });

  it('proxies every remote candidate of an allowed srcset, keeping descriptors and local candidates', () => {
    const srcset = attr(allowed('<img srcset="/local.png 1x, https://cdn.test/b.png 2x, //cdn.test/c.png 640w">'), 'img', 'srcset');
    expect(srcset).toBe('/local.png 1x, /proxy?url=https%3A%2F%2Fcdn.test%2Fb.png 2x, /proxy?url=%2F%2Fcdn.test%2Fc.png 640w');
  });

  it('rewrites a picture source, a video poster and a media source', () => {
    const html =
      '<picture><source srcset="https://cdn.test/a.webp"><img src="https://cdn.test/a.png"></picture>' +
      '<video poster="https://cdn.test/p.jpg"><source src="https://cdn.test/v.mp4"></video>';
    const out = allowed(html);
    expect(attr(out, 'picture source', 'srcset')).toContain('/proxy?url=');
    expect(attr(out, 'video', 'poster')).toContain('/proxy?url=');
    expect(attr(out, 'video source', 'src')).toContain('/proxy?url=');
    // A blocked <img> keeps its address in data-original-src, which fetches nothing.
    expect(blocked(html).replace(/data-original-src="[^"]*"/g, '')).not.toContain('cdn.test');
    expect(countBlocked(html)).toBe(4);
  });
});

describe('remote addresses in CSS', () => {
  for (const url of ['https://tracker.example/p.gif', '//tracker.example/p.gif']) {
    const cases: [string, string][] = [
      ['a style block', `<style>body { background: url(${url}); }</style>`],
      ['a style attribute', `<p style="background: url(${url})">x</p>`],
      ['an @import', `<style>@import url("${url}");</style>`],
      ['an @font-face', `<style>@font-face { font-family: x; src: url(${url}); }</style>`],
      ['a stylesheet link', `<link rel="stylesheet" href="${url}">`],
    ];
    for (const [where, html] of cases) {
      it(`counts ${url} in ${where}`, () => {
        expect(countBlocked(html)).toBeGreaterThan(0);
      });

      it(`does not leave ${url} in ${where} while blocked`, () => {
        expect(blocked(html)).not.toContain('tracker.example');
      });

      it(`fetches ${url} in ${where} only through the proxy when allowed`, () => {
        expect(withoutProxied(allowed(html))).not.toContain('tracker.example');
      });
    }
  }

  it('leaves a relative url() and a cid: url() alone', () => {
    const html = '<p style="background: url(/local/x.gif)">a</p><p style="background: url(cid:logo@sender.test)">b</p>';
    const out = blocked(html);
    expect(out).toContain('/local/x.gif');
    expect(out).toContain('cid:logo@sender.test');
    expect(countBlocked(html)).toBe(0);
  });
});

describe('inline images', () => {
  const structure = { Children: [{ MIMEType: 'text' }, { ID: '<logo@sender.test>' }] };

  it('points cid: at the part carrying that Content-ID', () => {
    const out = blocked('<img src="cid:logo@sender.test">', { messageStructure: structure });
    expect(attr(out, 'img', 'src')).toBe('/mailboxes/INBOX/messages/42/raw?part=2');
  });

  it('matches with or without the angle brackets, and whatever the scheme\'s case', () => {
    const bare = { Children: [{ MIMEType: 'text' }, { ID: 'logo@sender.test' }] };
    expect(attr(blocked('<img src="cid:logo@sender.test">', { messageStructure: bare }), 'img', 'src')).toContain('part=2');
    expect(attr(blocked('<img src="CID:logo@sender.test">', { messageStructure: structure }), 'img', 'src')).toContain('part=2');
  });

  it('numbers a nested part by its path', () => {
    const nested = { Children: [{ MIMEType: 'text' }, { Children: [{ MIMEType: 'text' }, { ID: '<a@b.test>' }] }] };
    expect(attr(blocked('<img src="cid:a@b.test">', { messageStructure: nested }), 'img', 'src')).toContain('part=2.2');
  });

  it('encodes the mailbox as a single path segment', () => {
    const out = blocked('<img src="cid:logo@sender.test">', { mailbox: '[Gmail]/All Mail', messageStructure: structure });
    expect(attr(out, 'img', 'src')).toBe('/mailboxes/%255BGmail%255D%252FAll%2520Mail/messages/42/raw?part=2');
  });

  it('leaves an unresolvable cid: alone, uncounted, with or without a structure', () => {
    expect(attr(blocked('<img src="cid:missing@sender.test">', { messageStructure: structure }), 'img', 'src')).toBe('cid:missing@sender.test');
    expect(attr(blocked('<img src="cid:missing@sender.test">'), 'img', 'src')).toBe('cid:missing@sender.test');
    expect(countBlocked('<img src="cid:logo@sender.test">')).toBe(0);
  });
});

describe('links', () => {
  it('hands the opened page no opener and no referrer, overriding the sender', () => {
    // The reader iframe allows popups to escape the sandbox; an opener handle
    // could navigate the reader while the user is away in the other tab.
    const doc = parse(blocked('<a href="https://a.test" rel="opener">x</a><a href="https://b.test">y</a>'));
    expect([...doc.querySelectorAll('a')].map((a) => a.getAttribute('rel'))).toEqual(['noopener noreferrer', 'noopener noreferrer']);
  });
});

describe('robustness', () => {
  it('does not throw on malformed markup', () => {
    for (const input of ['', '<<<', '<div><span></div>', '<img src=', '&#x26;#x26;', '<style>@media {</style>']) {
      expect(() => blocked(input), input).not.toThrow();
    }
  });
});
