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
import { sanitizeMessageHTML, showColorScheme, type SanitizeOptions } from '../src/utils/html-sanitizer';
import { cssUrls } from '../src/utils/css-syntax';

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

/** The sources a policy lists for one directive. */
function sourcesOf(policy: string, directive: string): string[] {
  const match = new RegExp(`(?:^|;)\\s*${directive}\\s+([^;]+)`).exec(policy);
  return match ? match[1].trim().split(/\s+/) : [];
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

  it('lets images, media and fonts load from this message\'s parts and inline data, not the whole origin', () => {
    const policy = csp('<p>hi</p>');
    const parts = `${window.location.origin}/mailboxes/INBOX/messages/42/raw`;
    for (const directive of ['img-src', 'media-src', 'font-src']) {
      expect(sourcesOf(policy, directive), directive).toEqual([parts, 'data:', 'blob:', 'cid:']);
    }
  });

  it('lets the proxy in only once the reader has allowed remote content', () => {
    const policy = (html: string) => attr(allowed(html), 'meta[http-equiv="Content-Security-Policy"]', 'content');
    for (const directive of ['img-src', 'media-src', 'font-src']) {
      expect(sourcesOf(csp('<p>hi</p>'), directive), directive).not.toContain(`${window.location.origin}/proxy`);
      expect(sourcesOf(policy('<p>hi</p>'), directive), directive).toContain(`${window.location.origin}/proxy`);
      expect(sourcesOf(policy('<p>hi</p>'), directive), directive).not.toContain(window.location.origin);
    }
  });

  it('names the parts by the very URL an inline image is pointed at, mailbox encoding and all', () => {
    const structure = { Children: [{ MIMEType: 'text' }, { ID: '<logo@sender.test>' }] };
    const out = blocked('<img src="cid:logo@sender.test">', { mailbox: '[Gmail]/All Mail', messageStructure: structure });
    const image = new URL(attr(out, 'img', 'src'), window.location.origin);
    const policy = attr(out, 'meta[http-equiv="Content-Security-Policy"]', 'content');
    // A source with a path matches the path and ignores the query.
    expect(sourcesOf(policy, 'img-src')).toContain(`${image.origin}${image.pathname}`);
  });

  it('names no parts for a document that is not a stored message', () => {
    const out = sanitizeMessageHTML('<p>hi</p>', { mailbox: '', messageUid: '', allowRemoteResources: false });
    expect(sourcesOf(attr(out, 'meta[http-equiv="Content-Security-Policy"]', 'content'), 'img-src')).toEqual(['data:', 'blob:', 'cid:']);
  });

  // The sanitizer counts and rewrites only absolute and `//` URLs, so these
  // are left as the sender wrote them, and only the policy keeps the browser
  // from fetching them through our own proxy with remote content blocked.
  const relativeProxy = '/proxy?url=https%3A%2F%2Ftracker.test%2Funique';
  for (const html of [
    `<img src="${relativeProxy}">`,
    `<img srcset="${relativeProxy} 2x">`,
    `<div style="background:url('${relativeProxy}')">body</div>`,
    `<style>body { background: image-set('${relativeProxy}' 1x) }</style>`,
    `<svg><image href="${relativeProxy}" /></svg>`,
    `<video><source src="${relativeProxy}"></video>`,
  ]) {
    it(`does not let a sender's relative proxy URL load with remote content blocked: ${html}`, () => {
      const policy = csp(html);
      for (const directive of ['img-src', 'media-src', 'font-src']) {
        const sources = sourcesOf(policy, directive);
        expect(sources, directive).not.toContain(window.location.origin);
        expect(sources, directive).not.toContain(`${window.location.origin}/proxy`);
        expect(sources.filter((source) => source.startsWith(window.location.origin)), directive).toEqual([
          `${window.location.origin}/mailboxes/INBOX/messages/42/raw`,
        ]);
      }
    });
  }

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

describe('SVG animations', () => {
  // The frame's policy and sandbox refuse a script URL however it got into a
  // link; the animations go all the same, since they change attributes after
  // every check here has read them.
  const svgNames = (html: string) => [...parse(html).querySelectorAll('svg *')].map((el) => el.localName);

  for (const animation of [
    '<animate attributeName="href" values="javascript:alert(1)"/>',
    '<set attributeName="href" to="javascript:alert(1)"/>',
    '<set attributeName="xlink:href" from="javascript:alert(1)" by="javascript:alert(1)"/>',
    '<animateMotion dur="1s"/>',
    '<animateTransform attributeName="transform" type="rotate" to="90"/>',
    '<animateColor attributeName="fill" to="red"/>',
    '<discard href="#link"/>',
  ]) {
    it(`removes ${animation}, and keeps the link it was in`, () => {
      const out = blocked(`<svg><a id="link">${animation}<text y="20">Open</text></a></svg>`);
      expect(svgNames(out)).toEqual(['a', 'text']);
      expect(parse(out).querySelector('text')?.textContent).toBe('Open');
    });
  }

  it('keeps an SVG that only draws', () => {
    const out = blocked('<svg width="20" height="20"><rect width="20" height="20" fill="#c00"/><text y="15">A</text></svg>');
    expect(svgNames(out)).toEqual(['rect', 'text']);
    expect(attr(out, 'rect', 'fill')).toBe('#c00');
  });
});

describe('SVG attributes that take a url()', () => {
  // A presentation attribute is CSS, one property each, and a url() in it
  // that names another document fetches that document: a paint server, a
  // filter, a mask, a clip path, a marker, a cursor image. Uncounted, a
  // message whose only remote content was in a drawing showed no banner, and
  // the policy refused the fetch.
  const url = 'https://tracker.test/paint.svg#p';
  const names = ['fill', 'stroke', 'filter', 'mask', 'clip-path', 'marker-start', 'marker-mid', 'marker-end', 'cursor'];
  for (const name of names) {
    const html = `<svg><rect width="10" height="10" ${name}="url(${url})"/></svg>`;

    it(`counts a remote url() in ${name}, and blocks it`, () => {
      expect(countBlocked(html)).toBe(1);
      expect(attr(blocked(html), 'rect', name)).toMatch(/^url\(data:image\/gif;base64,[^)]*\)$/);
      expect(blocked(html)).not.toContain('tracker.test');
    });

    it(`sends a remote url() in ${name} through the proxy once allowed`, () => {
      expect(countBlocked(html, true)).toBe(1);
      expect(attr(allowed(html), 'rect', name)).toBe(`url("/proxy?url=${encodeURIComponent(url)}")`);
    });
  }

  for (const value of [
    `u\\rl(${url})`,
    `\\75 rl(${url}) #c00`,
    'url(h\\74tps://tracker.test/paint.svg#p)',
    'url("\\2f\\2ftracker.test/paint.svg#p")',
  ]) {
    it(`counts ${value}, which the rewrite cannot reach, and removes it with its attribute`, () => {
      const html = `<svg><rect width="10" fill='${value}' stroke="#c00"/></svg>`;
      expect(countBlocked(html)).toBe(1);
      expect(countBlocked(html, true)).toBe(1);
      for (const out of [blocked(html), allowed(html)]) {
        expect(out).not.toContain('tracker.test');
        expect(attr(out, 'rect', 'stroke')).toBe('#c00');
        expect(parse(out).querySelector('rect')?.hasAttribute('fill')).toBe(false);
      }
    });
  }

  it('counts a cursor image named in an image-set(), and removes it', () => {
    const html = '<svg><rect width="10" cursor="image-set(\'https://tracker.test/c.png\' 1x), auto"/></svg>';
    expect(countBlocked(html)).toBe(1);
    expect(parse(blocked(html)).querySelector('rect')?.hasAttribute('cursor')).toBe(false);
  });

  it('keeps references to elements of the message, and counts nothing', () => {
    const html =
      '<svg><defs><linearGradient id="g"></linearGradient><filter id="f"></filter><mask id="m"></mask>' +
      '<clipPath id="c"></clipPath><marker id="a"></marker></defs>' +
      '<rect fill="url(#g)" stroke="url(\'#g\') #c00" filter="url(#f)" mask="URL( #m )" clip-path="url(#c)" ' +
      'marker-start="url(#a)" marker-mid="url(#a)" marker-end="url(#a)" cursor="pointer"></rect></svg>';
    const rect = parse(html).querySelector('rect')!.outerHTML;
    for (const out of [blocked(html), allowed(html)]) expect(parse(out).querySelector('rect')?.outerHTML).toBe(rect);
    expect(countBlocked(html)).toBe(0);
    expect(countBlocked(html, true)).toBe(0);
  });

  it('leaves a data: cursor and a cid: reference to the policy, as it leaves such an image', () => {
    const cursor = 'url(data:image/png;base64,iVBORw0KGgo=), auto';
    const html = `<svg><rect cursor="${cursor}" fill="url(cid:paint@sender.test#p)"></rect></svg>`;
    expect(attr(blocked(html), 'rect', 'cursor')).toBe(cursor);
    expect(attr(blocked(html), 'rect', 'fill')).toBe('url(cid:paint@sender.test#p)');
    expect(countBlocked(html)).toBe(0);
  });

  it('reads the same properties in the style of an SVG element', () => {
    const html =
      `<svg><rect style="fill: url(#g); stroke: url(${url}); cursor: u\\rl(https://tracker.test/c.png), auto"></rect></svg>`;
    expect(countBlocked(html)).toBe(1);
    const style = attr(blocked(html), 'rect', 'style');
    expect(style).toMatch(/^fill: url\(#g\); stroke: url\(data:image\/gif;base64,[^)]*\)$/);
    expect(withoutProxied(allowed(html))).not.toContain('tracker.test');
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

  it('treats a protocol-relative address as remote, and proxies it with the page\'s scheme', () => {
    // A browser resolves //host/path against the page's scheme; the proxy
    // fetches only an address that has one.
    expect(attr(blocked('<img src="//tracker.test/p.gif">'), 'img', 'src')).toMatch(PIXEL);
    expect(attr(allowed('<img src="//cdn.test/a.png">'), 'img', 'src'))
      .toBe(`/proxy?url=${encodeURIComponent(`${window.location.protocol}//cdn.test/a.png`)}`);
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

describe('addresses read as the URL parser reads them', () => {
  // Before it reads a scheme, a browser strips C0 controls and spaces from
  // both ends of an address and removes every tab and line break inside it,
  // and in an http(s) URL it reads a backslash as a slash. Judged as written,
  // each of these was a local address: neither counted nor rewritten, so the
  // policy refused a fetch the reader was never told of.
  const written: [string, string][] = [
    ['a tab inside the scheme', 'ht&#9;tps://tracker.test/p.gif'],
    ['a line feed before it', '&#10;https://tracker.test/p.gif'],
    ['a carriage return between the slashes', 'https:/&#13;/tracker.test/p.gif'],
    ['a control character before it', '&#1;https://tracker.test/p.gif'],
    ['a control character and a space after it', 'https://tracker.test/p.gif&#31; '],
    ['an upper-case scheme with a tab in it', 'HT&#9;TP://tracker.test/p.gif'],
    ['two backslashes for the slashes', '\\\\tracker.test/p.gif'],
    ['a slash and a backslash', '/\\tracker.test/p.gif'],
    ['a line feed between the slashes', '/&#10;/tracker.test/p.gif'],
  ];
  /** The address an allowed image was handed to the proxy with. */
  const proxiedAddress = (src: string) => decodeURIComponent(src.replace(/^\/proxy\?url=/, ''));

  for (const [how, src] of written) {
    it(`blocks and counts an image with ${how}`, () => {
      const html = `<img src="${src}">`;
      expect(attr(blocked(html), 'img', 'src')).toMatch(PIXEL);
      expect(countBlocked(html)).toBe(1);
      expect(countBlocked(html, true)).toBe(1);
    });

    it(`hands the proxy the address the browser reads in an image with ${how}`, () => {
      const proxiedSrc = attr(allowed(`<img src="${src}">`), 'img', 'src');
      expect(proxiedSrc).toMatch(/^\/proxy\?url=/);
      expect(proxiedAddress(proxiedSrc)).toMatch(/^https?:\/\/tracker\.test\/p\.gif$/);
    });
  }

  it('reads a srcset candidate, a poster, a media source and a stylesheet the same way', () => {
    const html =
      '<img srcset="&#1;https://tracker.test/a.gif 2x"><video poster="ht&#9;tps://tracker.test/p.jpg">' +
      '<source src="&#10;//tracker.test/v.mp4"></video><link rel="stylesheet" href="\\\\tracker.test/s.css">';
    expect(countBlocked(html)).toBe(4);
    expect(blocked(html)).not.toContain('tracker.test');
    expect(withoutProxied(allowed(html))).not.toContain('tracker.test');
  });

  it('reads an address in CSS the same way', () => {
    // `\\\\` in CSS is two backslashes, a scheme-relative address to the URL parser.
    const html = "<p style=\"color: #c00; background: url('\\\\\\\\tracker.test/p.gif')\">x</p>";
    expect(countBlocked(html)).toBe(1);
    expect(attr(blocked(html), 'p', 'style')).toBe('color: #c00');
  });

  it('leaves a local address with a tab or a space in it alone', () => {
    const html = '<img src="/assets/lo&#9;go.png"><img src=" /assets/logo.png"><img src="&#9;cid:logo@sender.test">';
    expect(countBlocked(html)).toBe(0);
    expect([...parse(blocked(html)).querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual([
      '/assets/lo\tgo.png', ' /assets/logo.png', '\tcid:logo@sender.test',
    ]);
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
    const relative = encodeURIComponent(`${window.location.protocol}//cdn.test/c.png`);
    expect(srcset).toBe(`/local.png 1x, /proxy?url=https%3A%2F%2Fcdn.test%2Fb.png 2x, /proxy?url=${relative} 640w`);
  });

  it('keeps a comma inside a candidate URL, as an image CDN or a data: URL writes one', () => {
    const srcset = attr(allowed(
      '<img srcset="https://cdn.test/fetch/w_1456,c_limit,f_auto/pic.jpg 1456w, ' +
      'https://cdn.test/fetch/w_800,c_limit/pic.jpg 800w, data:image/png;base64,iVBORw0KGgo= 1x">',
    ), 'img', 'srcset');
    expect(srcset).toBe([
      `/proxy?url=${encodeURIComponent('https://cdn.test/fetch/w_1456,c_limit,f_auto/pic.jpg')} 1456w`,
      `/proxy?url=${encodeURIComponent('https://cdn.test/fetch/w_800,c_limit/pic.jpg')} 800w`,
      'data:image/png;base64,iVBORw0KGgo= 1x',
    ].join(', '));
  });

  it('ends a candidate at a comma that ends its URL', () => {
    const srcset = attr(allowed('<img srcset="https://cdn.test/a.png, https://cdn.test/b.png 2x">'), 'img', 'srcset');
    expect(srcset).toBe(`/proxy?url=${encodeURIComponent('https://cdn.test/a.png')}, /proxy?url=${encodeURIComponent('https://cdn.test/b.png')} 2x`);
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
      ['an @keyframes', `<style>@keyframes k { from { background: url(${url}); } }</style>`],
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

  it('leaves a data: url() and an SVG fragment alone, whatever the reader chose', () => {
    const gif = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    const html =
      `<style>p { background: url(${gif}) } rect { fill: url(#g) }</style>` +
      `<p style="background: url('${gif}') no-repeat">a</p><svg><rect style="fill: url(#g)"/></svg>`;
    for (const out of [blocked(html), allowed(html)]) {
      expect(out).toContain(`background: url(${gif})`);
      expect(out).toContain('fill: url(#g)');
      expect(attr(out, 'p', 'style')).toBe(`background: url('${gif}') no-repeat`);
      expect(attr(out, 'rect', 'style')).toBe('fill: url(#g)');
    }
    expect(countBlocked(html)).toBe(0);
    expect(countBlocked(html, true)).toBe(0);
  });
});

describe('remote addresses in CSS written so that a pattern misses them', () => {
  // A browser decodes escapes before it reads a name or an address, and
  // fetches the plain strings of an image-set(), so each of these loads as
  // surely as a plain url(). The rewrite finds the usual spelling; what it
  // cannot reach goes with its declaration, and is counted.
  const url = 'https://tracker.example/p.gif';
  for (const value of [
    `u\\rl(${url})`,
    `\\75 rl(${url})`,
    `\\000055RL("${url}")`,
    'url(h\\74tps://tracker.example/p.gif)',
    'url("\\2f\\2ftracker.example/p.gif")',
    `image-set("${url}" 1x)`,
    `-webkit-image-set("${url}" 1x, "${url}" 2x)`,
  ]) {
    const cases: [string, string][] = [
      ['a style attribute', `<p style='color: #c00; background: ${value}'>x</p>`],
      ['a style block', `<style>p { color: #c00; background: ${value} }</style><p>x</p>`],
      ['an @font-face', `<style>@font-face { font-family: x; src: ${value} }</style><p style="color: #c00">x</p>`],
    ];
    for (const [where, html] of cases) {
      it(`counts ${value} in ${where}, and keeps the rest of the style`, () => {
        expect(countBlocked(html)).toBeGreaterThan(0);
        expect(countBlocked(html, true)).toBeGreaterThan(0);
        expect(blocked(html)).toMatch(/color: #c00/);
        expect(allowed(html)).toMatch(/color: #c00/);
      });

      it(`does not leave ${value} in ${where}, blocked or allowed`, () => {
        expect(blocked(html)).not.toContain('tracker.example');
        expect(withoutProxied(allowed(html))).not.toContain('tracker.example');
      });
    }
  }

  it('drops a sheet whose @import is written with escapes, which the parser takes for a selector', () => {
    const html = `<style>@\\69mport url(${url}); p { color: red }</style><p>x</p>`;
    expect(countBlocked(html)).toBeGreaterThan(0);
    expect(blocked(html)).not.toContain('tracker.example');
    expect(withoutProxied(allowed(html))).not.toContain('tracker.example');
  });

  it('removes an @import whose address is written with escapes, and counts it', () => {
    const html = '<style>@import "\\2f\\2ftracker.example/s.css"; p { color: red }</style>';
    expect(countBlocked(html)).toBeGreaterThan(0);
    const out = allowed(html);
    expect(out).not.toContain('@import');
    expect(out).toMatch(/color:\s*red/);
  });

  it('leaves a url( that a browser does not read as one', () => {
    // A space before the parenthesis, or a comment inside the name, makes
    // something else of it: nothing is fetched, so nothing is counted.
    const html = `<p style="background: url (${url})">a</p><p style="background: u/**/rl(${url})">b</p>`;
    expect(countBlocked(html)).toBe(0);
  });

  it('keeps styles that use escapes for text, and counts nothing', () => {
    const html =
      '<style>q::before { content: "\\201C" } p { font-family: \\5B8B\\4F53, "\\5FAE\\8F6F\\96C5\\9ED1" }</style>' +
      '<p style=\'font-family: \\5B8B\\4F53; color: #c00\'>x</p><q style=\'quotes: "\\201C" "\\201D"\'>y</q>';
    for (const out of [blocked(html), allowed(html)]) {
      expect(out).toContain('content: "\\201C"');
      expect(out).toContain('font-family: \\5B8B\\4F53, "\\5FAE\\8F6F\\96C5\\9ED1"');
      expect(attr(out, 'p', 'style')).toBe('font-family: \\5B8B\\4F53; color: #c00');
      expect(attr(out, 'q', 'style')).toBe('quotes: "\\201C" "\\201D"');
    }
    expect(countBlocked(html)).toBe(0);
  });

  it('keeps a namespace rule, whose URL is a name and not a fetch', () => {
    const html = '<style>@namespace svg url(http://www.w3.org/2000/svg); p { color: red }</style>';
    expect(countBlocked(html)).toBe(0);
    expect(blocked(html)).toMatch(/color:\s*red/);
  });
});

describe('the background attribute', () => {
  // A body, table, row or cell paints itself with the image its `background`
  // names, fetched as an img's src is. Unread, a remote one went uncounted,
  // and the policy refused it with no banner.
  const cases: [string, string][] = [
    ['body', '<body background="https://tracker.test/bg.gif"><p>x</p></body>'],
    ['table', '<table background="https://tracker.test/bg.gif"><tr><td>x</td></tr></table>'],
    ['tr', '<table><tr background="https://tracker.test/bg.gif"><td>x</td></tr></table>'],
    ['td', '<table><tr><td background="//tracker.test/bg.gif">x</td></tr></table>'],
    ['th', '<table><tr><th background="ht&#9;tps://tracker.test/bg.gif">x</th></tr></table>'],
  ];
  for (const [tag, html] of cases) {
    it(`counts a remote background on a ${tag}, and blocks it`, () => {
      expect(countBlocked(html)).toBe(1);
      expect(attr(blocked(html), tag, 'background')).toMatch(PIXEL);
      expect(blocked(html)).not.toContain('tracker.test');
    });

    it(`sends a remote background on a ${tag} through the proxy once allowed`, () => {
      expect(countBlocked(html, true)).toBe(1);
      expect(attr(allowed(html), tag, 'background')).toMatch(/^\/proxy\?url=https?%3A%2F%2Ftracker\.test%2Fbg\.gif$/);
    });
  }

  it('points a cid: background at the part carrying that Content-ID, as it does an image', () => {
    const structure = { Children: [{ MIMEType: 'text' }, { ID: '<bg@sender.test>' }] };
    const html = '<body background="cid:bg@sender.test"><table background=" CID:bg@sender.test"><tr><td>x</td></tr></table></body>';
    const out = blocked(html, { messageStructure: structure });
    expect(attr(out, 'body', 'background')).toBe('/mailboxes/INBOX/messages/42/raw?part=2');
    expect(attr(out, 'table', 'background')).toBe('/mailboxes/INBOX/messages/42/raw?part=2');
    expect(countBlocked(html)).toBe(0);
  });

  it('leaves a local, a data: or an unresolvable cid: background alone, uncounted', () => {
    const gif = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    const html =
      `<table background="${gif}"><tr><td background="/assets/bg.gif">x</td>` +
      '<td background="cid:missing@sender.test">y</td></tr></table>';
    const out = blocked(html);
    expect(attr(out, 'table', 'background')).toBe(gif);
    expect([...parse(out).querySelectorAll('td')].map((td) => td.getAttribute('background'))).toEqual([
      '/assets/bg.gif', 'cid:missing@sender.test',
    ]);
    expect(countBlocked(html)).toBe(0);
  });

  it('keeps an ordinary table as written, and counts nothing', () => {
    const table =
      '<table width="100%" bgcolor="#eeeeee" cellpadding="4"><tbody><tr>' +
      '<td align="center" style="color: #c00">x</td></tr></tbody></table>';
    for (const out of [blocked(table), allowed(table)]) {
      expect(parse(out).querySelector('table')?.outerHTML).toBe(table);
    }
    expect(countBlocked(table)).toBe(0);
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

  it('resolves a cid: written with leading whitespace, as a browser reads it', () => {
    // The quote path and the reader disagreed on this: a ` cid:` the quoting
    // sanitizer recognised, this one did not, and a part the forward carried
    // showed as a broken image.
    expect(attr(blocked('<img src=" cid:logo@sender.test">', { messageStructure: structure }), 'img', 'src')).toContain('part=2');
  });

  it('leaves an unresolvable cid: alone, uncounted, with or without a structure', () => {
    expect(attr(blocked('<img src="cid:missing@sender.test">', { messageStructure: structure }), 'img', 'src')).toBe('cid:missing@sender.test');
    expect(attr(blocked('<img src="cid:missing@sender.test">'), 'img', 'src')).toBe('cid:missing@sender.test');
    expect(countBlocked('<img src="cid:logo@sender.test">')).toBe(0);
  });
});

// The frame answers `prefers-color-scheme` from the system, not from the
// colours it is painted in, so a message styled for both schemes is shown in
// the scheme of its paint: the light one on the sanitizer's white, the dark
// one under the reader's dark theme for message content. jsdom evaluates no
// media query and drops the importance of a `color-scheme`, so what is pinned
// here is what the frame is handed; the browser suite
// (e2e/color-scheme.spec.ts) measures what it paints.
describe('colour schemes', () => {
  const queries = (css: string | null) => [...(css ?? '').matchAll(/@media\s*([^{]+?)\s*\{/g)].map((m) => m[1]);
  /** The sender's sheets as the frame gets them: the media queries shown, and those kept for each scheme. */
  const sheets = (doc: Document) =>
    [...doc.querySelectorAll('style')].slice(1).map((sheet) => ({
      media: sheet.getAttribute('media'),
      shown: queries(sheet.textContent),
      light: queries(sheet.getAttribute('data-alps-css-light')),
      dark: queries(sheet.getAttribute('data-alps-css-dark')),
    }));
  const BOTH = '<style>@media (prefers-color-scheme: dark) { p { color: #fff !important } }' +
    '@media (prefers-color-scheme: light) { p { color: #111 } }</style><p>hi</p>';
  const LIGHT = ['(width < 0)', '(width >= 0)'];
  const DARK = ['(width >= 0)', '(width < 0)'];

  it('shows a sheet that asks for a scheme in its light version, and keeps its dark one', () => {
    expect(sheets(parse(blocked(BOTH)))).toEqual([{ media: null, shown: LIGHT, light: LIGHT, dark: DARK }]);
  });

  it('switches a sheet, and back, to the scheme the frame is painted in', () => {
    const doc = parse(blocked(BOTH));
    showColorScheme(doc, 'dark');
    expect(sheets(doc).map((sheet) => sheet.shown)).toEqual([DARK]);
    showColorScheme(doc, 'light');
    expect(sheets(doc).map((sheet) => sheet.shown)).toEqual([LIGHT]);
  });

  it('keeps the rest of the query, the rules inside, and the sheet\'s own media', () => {
    const html = '<style media="screen">@media only screen and (prefers-color-scheme: dark) { .text p { color: #FFFFFF !important } }' +
      '@media not all and (prefers-color-scheme: light) { .panel { background: #262626 } }</style>';
    const doc = parse(blocked(html));
    expect(sheets(doc)).toEqual([{
      media: 'screen',
      shown: ['only screen and (width < 0)', 'not all and (width >= 0)'],
      light: ['only screen and (width < 0)', 'not all and (width >= 0)'],
      dark: ['only screen and (width >= 0)', 'not all and (width < 0)'],
    }]);
    expect(blocked(html)).toMatch(/\.text p\s*\{\s*color:\s*#FFFFFF !important;?\s*\}/);
  });

  it('reads the feature as a browser does: in capitals, with escapes or comments, nested, and never in a string', () => {
    const html = '<style>@supports (display: grid) { @media ( PREFERS-COLOR-SCHEME:Dark ) { p { color: #fff } } }' +
      '@media (prefers-color-sch\\65me: d\\61rk) { b { color: #fff } } @media (prefers-color-scheme:/**/dark) { i { color: #fff } }' +
      'q::after { content: "(prefers-color-scheme: dark)" }</style>';
    const [sheet] = sheets(parse(blocked(html)));
    expect(sheet.shown).toEqual(['(width < 0)', '(width < 0)', '(width < 0)']);
    expect(sheet.dark).toEqual(['(width >= 0)', '(width >= 0)', '(width >= 0)']);
    expect(blocked(html)).toContain('content: "(prefers-color-scheme: dark)"');
  });

  it('reads a feature the end of the text closes, as a browser does', () => {
    const doc = parse(blocked('<picture><source media="(prefers-color-scheme: dark" srcset="cid:white-logo"><img src="cid:dark-logo"></picture>'));
    expect(doc.querySelector('picture source')?.getAttribute('media')).toBe('(width < 0)');
    showColorScheme(doc, 'dark');
    expect(doc.querySelector('picture source')?.getAttribute('media')).toBe('(width >= 0)');
  });

  it('switches the media attribute of a sheet and of a picture\'s source', () => {
    const doc = parse(blocked('<style media="screen and (prefers-color-scheme: dark)">p { color: #fff }</style>' +
      '<picture><source media="(prefers-color-scheme: dark)" srcset="cid:white-logo"><img src="cid:dark-logo"></picture>'));
    const media = () => [doc.querySelector('style[media]'), doc.querySelector('picture source')].map((el) => el?.getAttribute('media'));
    expect(media()).toEqual(['screen and (width < 0)', '(width < 0)']);
    showColorScheme(doc, 'dark');
    expect(media()).toEqual(['screen and (width >= 0)', '(width >= 0)']);
  });

  it('leaves every other query alone, and keeps nothing for a switch', () => {
    const html = '<style>@media (max-width: 600px) { p { font-size: 12px } } @media print { p { color: #000 } }</style>' +
      '<picture><source media="(min-width: 800px)" srcset="cid:wide"><img src="cid:narrow"></picture>';
    const doc = parse(blocked(html));
    expect(sheets(doc)).toEqual([{ media: null, shown: ['(max-width: 600px)', 'print'], light: [], dark: [] }]);
    showColorScheme(doc, 'dark');
    expect(doc.querySelector('picture source')?.getAttribute('media')).toBe('(min-width: 800px)');
  });

  it('ignores the markers a sender writes, so a switch changes only what the sanitizer marked', () => {
    const doc = parse(blocked('<style data-alps-css-dark="p { color: red }">p { color: blue }</style>' +
      '<picture><source media="print" data-alps-media-dark="all" srcset="cid:a"><img src="cid:b"></picture>'));
    showColorScheme(doc, 'dark');
    expect(doc.querySelectorAll('style')[1].textContent).toMatch(/color:\s*blue/);
    expect(doc.querySelector('picture source')?.getAttribute('media')).toBe('print');
  });

  it('adds no element: a sheet among table rows or a wrapper\'s paragraphs leaves their positions as they were', () => {
    // `tr:nth-child(odd)` stripes and `p + p` spacing count siblings.
    const sheet = '<style>@media (prefers-color-scheme: dark) { tr, p { color: #fff } }</style>';
    const doc = parse(blocked(`<table><tbody>${sheet}<tr><td>a</td></tr><tr><td>b</td></tr></tbody></table>` +
      `<div class="wrap">${sheet}<p>a</p><p>b</p></div>`));
    expect([doc.querySelector('tbody'), doc.querySelector('.wrap')].map((el) => el?.childElementCount)).toEqual([3, 3]);
  });

  it('checks the dark version as it checks the light one: a remote url() and a colour scheme in it go', () => {
    const html = '<style>@media (prefers-color-scheme: dark) { p { background-image: u\\72l(https://tracker.example/d.gif); color-scheme: dark } }</style>';
    const dark = parse(blocked(html)).querySelectorAll('style')[1].getAttribute('data-alps-css-dark');
    expect(dark).toMatch(/@media \(width >= 0\)/);
    expect(cssUrls(dark ?? '').filter((url) => url.includes('tracker.example'))).toEqual([]);
    expect(dark).not.toMatch(/color-scheme/);
    expect(countBlocked(html)).toBeGreaterThan(0);
  });

  it('leaves a query inside a string alone, so the string still ends where it did', () => {
    // A line break ends a string; a rewrite that took it with the query would
    // close the string elsewhere, and what it held would be read as CSS.
    const html = '<style>p { a: "(prefers-color-scheme:\ndark)"; background-image: u\\72l(https://tracker.example/pixel.gif); b: "z"; }' +
      '@media (prefers-color-scheme: dark) { p { background-image: u\\72l(https://tracker.example/dark.gif) } }</style><p>hi</p>';
    const doc = parse(blocked(html));
    const versions = [...doc.querySelectorAll('style')]
      .flatMap((style) => [style.textContent, style.getAttribute('data-alps-css-light'), style.getAttribute('data-alps-css-dark')]);
    expect(versions.flatMap((css) => cssUrls(css ?? '')).filter((url) => url.includes('tracker.example'))).toEqual([]);
    expect(countBlocked(html)).toBeGreaterThan(0);
  });

  it('removes the sender\'s colour schemes, in sheets and in style attributes', () => {
    const doc = parse(blocked('<style>:root { color-scheme: light dark !important } .card { colo\\72-scheme: dark; color: red }</style>' +
      '<div style="color-scheme: light dark; color: blue">hi</div>'));
    expect(doc.querySelectorAll('style')[1].textContent).not.toMatch(/scheme/);
    expect(doc.querySelectorAll('style')[1].textContent).toMatch(/color:\s*red/);
    expect(doc.querySelector('div')?.getAttribute('style')).toBe('color: blue');
  });

  it('puts the document\'s root in the light scheme, and switches it', () => {
    // A `light-dark()` colour and the system colours follow the scheme, which
    // a sender's `color-scheme: light dark` would let a dark system decide.
    // The sender's declarations are removed (above, and in
    // html-sanitizer-fallback.test.ts); that the root's is important is a
    // backstop no test reaches, and jsdom drops it.
    const doc = parse(blocked('<meta name="color-scheme" content="light dark"><p style="color: light-dark(#111, #fff)">hi</p>'));
    expect(doc.documentElement.style.getPropertyValue('color-scheme')).toBe('light');
    showColorScheme(doc, 'dark');
    expect(doc.documentElement.style.getPropertyValue('color-scheme')).toBe('dark');
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
