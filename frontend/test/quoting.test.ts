/**
 * Quoting a message into a reply or a forward.
 *
 * The risk is not script in our own page: it is that replying makes the user a
 * carrier. The sender's markup rides the reply to whoever it goes to — a
 * tracking pixel the reader refused re-armed under the user's name — and the
 * sender's display name, subject and addresses are interpolated into markup.
 */
import { describe, expect, it } from 'vitest';
import { escapeHtml, sanitizeQuotedHTML, stripCssUrls } from '../src/utils/html-sanitizer';
import { QUOTE_ATTRIBUTE, formatAddrs, generateQuote } from '../src/utils/email-quote';

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

describe('sanitizeQuotedHTML', () => {
  it('removes active content and keeps the text', () => {
    const doc = parse(sanitizeQuotedHTML(
      '<p>hi</p><script>fetch("//evil")</script><style>body{display:none}</style>' +
      '<iframe src="https://evil.test"></iframe><form action="https://evil.test"></form>' +
      '<link rel="stylesheet" href="https://evil.test/s.css"><base href="https://evil.test/">',
    ));
    for (const tag of ['script', 'style', 'iframe', 'form', 'link', 'base']) expect(doc.querySelector(tag), tag).toBeNull();
    expect(doc.body.textContent).toContain('hi');
  });

  it('removes event handlers, which the next client would run', () => {
    const img = parse(sanitizeQuotedHTML('<img src="https://cdn.test/a.png" onerror="steal()" ONLOAD="x()">')).querySelector('img')!;
    expect(img.getAttribute('onerror')).toBeNull();
    expect(img.getAttribute('onload')).toBeNull();
  });

  it('removes script-bearing URLs, including ones hidden behind control characters', () => {
    for (const href of ['javascript:alert(1)', 'java\tscript:alert(1)', ' JavaScript:alert(1)', 'vbscript:x', 'data:text/html,<script>x</script>']) {
      const a = parse(sanitizeQuotedHTML(`<a href="${href.replace(/"/g, '&quot;')}">x</a>`)).querySelector('a')!;
      expect(a.getAttribute('href'), href).toBeNull();
    }
  });

  it('removes url() from inline styles but keeps the formatting', () => {
    const out = sanitizeQuotedHTML('<div style="color:#c00;background:url(https://tracker.test/p.gif)">x</div>');
    expect(out).not.toContain('tracker.test');
    expect(parse(out).querySelector('div')?.getAttribute('style')).toContain('color:#c00');
  });

  it('leaves remote image and link addresses exactly as written', () => {
    // Rewriting them for display would send the recipient URLs into our origin.
    const doc = parse(sanitizeQuotedHTML('<img src="https://cdn.test/logo.png?v=2"><a href="https://example.test/x">link</a>'));
    expect(doc.querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/logo.png?v=2');
    expect(doc.querySelector('a')?.getAttribute('href')).toBe('https://example.test/x');
  });

  it('returns a fragment, and nothing for nothing', () => {
    expect(sanitizeQuotedHTML('<p>hi</p>').toLowerCase()).not.toContain('<body');
    expect(sanitizeQuotedHTML('')).toBe('');
  });

  it('removes frames, framesets and applets, and survives a document that was only a frameset', () => {
    const doc = parse(sanitizeQuotedHTML(
      '<svg><frame src="https://evil.test"></frame><frameset></frameset></svg><applet code="Evil.class"></applet><p>ok</p>',
    ));
    expect(doc.querySelectorAll('frame, frameset, applet')).toHaveLength(0);
    expect(doc.body.textContent).toContain('ok');
    // Such a document has no body once its frameset is gone.
    expect(sanitizeQuotedHTML('<frameset><frame src="https://evil.test"></frameset>')).toBe('');
  });

  it('removes script-bearing URLs from formaction, xlink:href and poster', () => {
    const doc = parse(sanitizeQuotedHTML(
      '<button formaction="javascript:alert(1)">go</button>' +
      '<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>' +
      '<video poster="javascript:alert(1)"></video>',
    ));
    expect(doc.querySelector('button')?.getAttribute('formaction')).toBeNull();
    expect(doc.querySelector('a')?.getAttribute('xlink:href')).toBeNull();
    expect(doc.querySelector('video')?.getAttribute('poster')).toBeNull();
  });

  describe('SVG animations', () => {
    // An animation changes the attribute it names once the document is shown,
    // after every URL check has read that attribute as written.
    const script = 'javascript:alert(1)';
    const svgNames = (html: string) => [...parse(html).querySelectorAll('svg *')].map((el) => el.localName);

    for (const animation of [
      `<animate attributeName="href" values="${script}"/>`,
      `<animate attributeName="href" from="${script}" to="${script}"/>`,
      `<animate attributeName="href" by="${script}"/>`,
      `<set attributeName="href" to="${script}"/>`,
      `<set attributeName="xlink:href" to="${script}"/>`,
      `<animate attributeName="xlink:href" values="${script}"/>`,
      `<animateMotion attributeName="href" values="${script}"/>`,
      `<animateTransform attributeName="href" values="${script}"/>`,
      `<animateColor attributeName="href" values="${script}"/>`,
      `<SET attributeName="href" to="${script}"/>`,
      '<discard href="#link"/>',
    ]) {
      it(`removes ${animation}, and keeps the link it was in`, () => {
        const out = sanitizeQuotedHTML(`<svg><a id="link">${animation}<text y="20">Open</text></a></svg>`);
        expect(svgNames(out)).toEqual(['a', 'text']);
        expect(out).not.toMatch(/javascript:/i);
        expect(parse(out).querySelector('text')?.textContent).toBe('Open');
      });
    }

    it('removes one aimed at its link from elsewhere, one inside another, and one outside an svg', () => {
      const out = sanitizeQuotedHTML(
        `<svg><a id="link"><text>Open</text></a><set href="#link" attributeName="href" to="${script}"/>` +
        `<animateMotion dur="1s"><mpath href="#path"/><set attributeName="href" to="${script}"/></animateMotion></svg>` +
        `<p>after</p><set attributeName="href" to="${script}"></set>`,
      );
      expect(svgNames(out)).toEqual(['a', 'text']);
      expect(out).not.toMatch(/javascript:|<set|<animate/i);
      expect(parse(out).body.textContent).toContain('after');
    });

    it('removes one inside a template, along with the template', () => {
      // A template's contents are a fragment of their own, which no check of
      // the document reaches: a handler in there went out untouched too.
      const out = sanitizeQuotedHTML(
        `<p>ok</p><template><svg><a><set attributeName="href" to="${script}"/><text>x</text></a></svg>` +
        '<img src="x" onerror="alert(1)"></template>',
      );
      expect(out).not.toMatch(/template|javascript:|onerror/i);
      expect(parse(out).body.textContent).toBe('ok');
    });

    it('keeps an SVG that only draws', () => {
      const svg = '<svg width="20" height="20"><rect width="20" height="20" fill="#c00"></rect><text y="15">A</text></svg>';
      expect(sanitizeQuotedHTML(svg)).toBe(svg);
    });
  });

  describe('content another client parses differently', () => {
    // The quote is parsed here with scripting disabled, so what a <noscript>
    // holds is markup to it, and checked as markup. A recipient's client that
    // runs script reads it as text up to the first `</noscript>`, wherever
    // that stands, and what follows is markup no check here has seen. This
    // test document runs script, so it reads the quote as such a client does.
    const asReadWithScripting = (html: string) => {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div;
    };

    for (const fallback of [
      '<noscript><!-- </noscript><b id="live">x</b><img src="x" onerror="alert(1)"> --></noscript>',
      '<noscript><p title="</noscript><b id=live>x</b><img src=x onerror=alert(1)>">fallback</p></noscript>',
      '<noscript><noscript><p title="</noscript></noscript><b id=live>x</b>">fallback</p></noscript></noscript>',
    ]) {
      it(`removes ${fallback}`, () => {
        const out = sanitizeQuotedHTML(`<p>Body</p>${fallback}<p>After</p>`);
        expect(out).toBe('<p>Body</p><p>After</p>');
        expect(asReadWithScripting(out).querySelector('#live')).toBeNull();
      });
    }

    it('removes noembed and noframes, whose text goes out as written', () => {
      // A client that knows them shows neither; one that does not may take
      // their text for markup.
      const out = sanitizeQuotedHTML(
        '<p>Body</p><noembed><b id="live">x</b></noembed><noframes><img src=x onerror=alert(1)></noframes><p>After</p>',
      );
      expect(out).toBe('<p>Body</p><p>After</p>');
    });

    it('keeps the text of xmp and plaintext as text, escaped', () => {
      expect(sanitizeQuotedHTML('<p>Body</p><xmp><b id="live">x</b> & y</xmp><p>After</p>'))
        .toBe('<p>Body</p><pre>&lt;b id="live"&gt;x&lt;/b&gt; &amp; y</pre><p>After</p>');
      // A plaintext runs to the end of the document, whatever follows it.
      expect(sanitizeQuotedHTML('<p>Body</p><plaintext><img src=x onerror=alert(1)></body>'))
        .toBe('<p>Body</p><pre>&lt;img src=x onerror=alert(1)&gt;&lt;/body&gt;</pre>');
    });

    it('keeps markup that parses the same everywhere as written', () => {
      const html = '<p title="a b">Body</p><!-- a comment --><pre>&lt;code&gt;</pre><textarea>&lt;/textarea&gt;</textarea>';
      expect(sanitizeQuotedHTML(html)).toBe(html);
    });
  });

  describe('SVG attributes that take a url()', () => {
    // A presentation attribute is CSS, and a url() in one that names another
    // document is a fetch in the recipient's client, as one in a style is.
    for (const name of ['fill', 'stroke', 'filter', 'mask', 'clip-path', 'marker-start', 'marker-mid', 'marker-end', 'cursor']) {
      it(`removes a url() to another document from ${name}, and keeps the drawing`, () => {
        const out = sanitizeQuotedHTML(`<svg><rect width="10" ${name}="url(https://tracker.test/p.svg#p)"></rect></svg>`);
        expect(out).toBe('<svg><rect width="10"></rect></svg>');
      });
    }

    for (const value of [
      'u\\rl(https://tracker.test/p.svg#p)',
      '\\75 rl(//tracker.test/p.svg#p) #c00',
      'url (https://tracker.test/p.svg#p)',
      'u/**/rl(https://tracker.test/p.svg#p)',
      'url(paint.svg#p)',
      'url(data:image/svg+xml;base64,PHN2Zy8+#p)',
      'url(cid:paint@sender.test#p)',
      'url(" #p")',
      "image-set('https://tracker.test/c.png' 1x), auto",
    ]) {
      it(`removes ${value}`, () => {
        const out = sanitizeQuotedHTML(`<svg><rect width="10" fill="${value.replace(/"/g, '&quot;')}" stroke="#c00"></rect></svg>`);
        expect(out).toBe('<svg><rect width="10" stroke="#c00"></rect></svg>');
      });
    }

    it('keeps a reference to an element of the quote', () => {
      const svg =
        '<svg><defs><linearGradient id="g"></linearGradient></defs>' +
        '<rect fill="url(#g)" stroke="url(\'#g\') #c00" filter="URL( #f )" clip-path="\\75 rl(#c)" cursor="pointer"></rect></svg>';
      expect(sanitizeQuotedHTML(svg)).toBe(svg);
    });

    it('keeps one in the style of an SVG element, and removes a url() to another document there', () => {
      const style = parse(sanitizeQuotedHTML(
        '<svg><rect style="fill: url(#g); stroke: url(https://tracker.test/p.svg#s); ' +
        'cursor: \\75 rl(https://tracker.test/c.png), auto; opacity: 0.5"></rect></svg>',
      )).querySelector('rect')?.getAttribute('style');
      expect(style).toBe('fill: url(#g); opacity: 0.5');
    });
  });

  it('removes a srcset whose script URL is any candidate, not only the first', () => {
    const img = parse(sanitizeQuotedHTML(
      '<img srcset="https://cdn.test/w_800,c_limit/a.png 1x, javascript:alert(1) 2x">',
    )).querySelector('img')!;
    expect(img.getAttribute('srcset')).toBeNull();
  });

  it('keeps a srcset of ordinary candidates as written', () => {
    const srcset = 'https://cdn.test/w_800,c_limit/a.png 1x, data:image/png;base64,iVBORw0KGgo= 2x';
    expect(parse(sanitizeQuotedHTML(`<img srcset="${srcset}">`)).querySelector('img')?.getAttribute('srcset')).toBe(srcset);
  });

  it('removes a url() with a parenthesis inside its quotes, and nothing after it', () => {
    const style = parse(sanitizeQuotedHTML(
      '<div style=\'background-image: url("https://tracker.test/img?(1)"); color: red\'>x</div>',
    )).querySelector('div')?.getAttribute('style') ?? '';
    expect(style).not.toContain('tracker.test');
    // Left behind, `")` opens a CSS string that swallows the rest of the style.
    expect(style).not.toContain('")');
    expect(style).toContain('color: red');
  });

  it('removes a url() continued over an escaped line break', () => {
    const out = sanitizeQuotedHTML('<div style=\'background-image: url("https://tracker.test/a\\\nb.png"); color: red\'>x</div>');
    expect(out).not.toContain('tracker.test');
    expect(out).toContain('color: red');
  });

  describe('an inline declaration that loads something', () => {
    // A browser decodes escapes before it reads a name, so `u\rl(` is `url(`;
    // a lenient client may also join a name across a comment or skip a space
    // before the parenthesis. Each goes with its declaration, whatever it
    // names: the recipient's client would fetch it, or run it.
    const style = (html: string) => parse(sanitizeQuotedHTML(html)).querySelector('div')?.getAttribute('style') ?? null;

    for (const value of [
      'u\\rl(https://tracker.test/p.gif)',
      '\\75 rl(https://tracker.test/p.gif)',
      '\\000055RL("https://tracker.test/p.gif")',
      'url (https://tracker.test/p.gif)',
      'u/**/rl(https://tracker.test/p.gif)',
      'url/**/(https://tracker.test/p.gif)',
      'image-set("https://tracker.test/p.gif" 1x)',
      '-webkit-image-set("https://tracker.test/p.gif" 1x)',
      '\\69mage-set("https://tracker.test/p.gif" 1x)',
      'image("https://tracker.test/p.gif")',
      'cross-fade(url(https://tracker.test/a.gif), url(https://tracker.test/b.gif), 50%)',
      'element(#tracker-test)',
      '-moz-element(#tracker-test)',
      'ex/**/pression(alert("tracker.test"))',
    ]) {
      it(`goes whole: ${value}`, () => {
        const out = style(`<div style='color: #c00; background: ${value}; margin: 0'>x</div>`);
        expect(out).toBe('color: #c00; margin: 0');
      });
    }

    it('goes whole as a behavior or an @import too', () => {
      expect(style("<div style='b\\65havior: url(https://tracker.test/x.htc); color: #c00'>x</div>")).toBe('color: #c00');
      expect(style("<div style='color: #c00; @import \"https://tracker.test/s.css\"'>x</div>")).toBe('color: #c00');
    });

    it('takes the style attribute with it when nothing else is left', () => {
      expect(style('<div style="background: \\75 rl(https://tracker.test/p.gif)">x</div>')).toBeNull();
    });
  });

  it('keeps an inline style that loads nothing exactly as written, escapes and all', () => {
    const css = 'font-family: \\5B8B\\4F53, "\\5FAE\\8F6F\\96C5\\9ED1"; quotes: "\\201C" "\\201D"; content: "url(x)"; scroll-behavior: smooth';
    expect(parse(sanitizeQuotedHTML(`<q style='${css}'>x</q>`)).querySelector('q')?.getAttribute('style')).toBe(css);
  });

  it('keeps cid: and data: images as written', () => {
    const gif = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    const images = parse(sanitizeQuotedHTML(`<img src="cid:logo@sender.test"><img src="${gif}"><img srcset="${gif} 2x">`))
      .querySelectorAll('img');
    expect([...images].map((img) => img.getAttribute('src') ?? img.getAttribute('srcset'))).toEqual([
      'cid:logo@sender.test', gif, `${gif} 2x`,
    ]);
  });
});

describe('stripCssUrls', () => {
  it('removes url() in every form CSS writes it', () => {
    for (const url of [
      'url(https://tracker.test/p.gif)',
      'url( "https://tracker.test/p.gif" )',
      "url('https://tracker.test/p.gif?(1)')",
      'URL("https://tracker.test/a\\"b.gif")',
    ]) {
      const out = stripCssUrls(`color: red; background: ${url}; margin: 0`);
      expect(out, url).not.toContain('tracker.test');
      expect(out, url).toContain('color: red');
      expect(out, url).toContain('margin: 0');
    }
  });

  it('removes an unclosed url() to the end of the value, as CSS closes it there', () => {
    for (const style of ['color: red; background: url("https://tracker.test/p.gif', 'color: red; background: url(https://tracker.test/p.gif']) {
      const out = stripCssUrls(style);
      expect(out, style).not.toContain('tracker.test');
      expect(out, style).toContain('color: red');
    }
  });

  it('removes a url() written with escapes, with the declaration it is in', () => {
    expect(stripCssUrls('color: red; background: #fff \\75 rl(https://tracker.test/p.gif) no-repeat; margin: 0')).toBe('color: red; margin: 0');
  });

  it('keeps a url() inside a string, which is only text', () => {
    const style = 'font-family: "url(https://tracker.test/p.gif)"';
    expect(stripCssUrls(style)).toBe(style);
  });

  it('returns a style with nothing to remove unchanged', () => {
    const style = ' color: red;;  border-left: 1px solid #ccc ';
    expect(stripCssUrls(style)).toBe(style);
  });
});

describe('escapeHtml', () => {
  it('escapes everything that can open markup or an attribute', () => {
    expect(escapeHtml(`<img src=x onerror="a('b')">&`)).toBe('&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
  });

  it('escapes an ampersand once', () => {
    expect(escapeHtml('a &lt; b')).toBe('a &amp;lt; b');
  });
});

describe('generateQuote', () => {
  const message = (envelope: Record<string, unknown> = {}) => ({
    Envelope: {
      Subject: 'Engines',
      Date: '2024-01-05T14:07:00Z',
      From: [{ Name: 'Ada Lovelace', Mailbox: 'ada', Host: 'remote.test' }],
      To: [{ Name: '', Mailbox: 'me', Host: 'example.test' }],
      Cc: [{ Mailbox: 'bob', Host: 'example.test' }],
      ReplyTo: [],
      ...envelope,
    },
  });

  it('formats addresses with and without a display name', () => {
    expect(formatAddrs([{ Name: 'Ada', Mailbox: 'ada', Host: 'remote.test' }, { Mailbox: 'bob', Host: 'x.test' }])).toEqual([
      'Ada <ada@remote.test>', 'bob@x.test',
    ]);
    expect(formatAddrs(undefined as any)).toEqual([]);
  });

  it('prefixes the subject once', () => {
    expect(generateQuote('reply', message(), '', null, false).subject).toBe('Re: Engines');
    expect(generateQuote('reply', message({ Subject: 'RE: Engines' }), '', null, false).subject).toBe('RE: Engines');
    expect(generateQuote('forward', message(), '', null, false).subject).toBe('Fwd: Engines');
    expect(generateQuote('forward', message({ Subject: 'FWD: Engines' }), '', null, false).subject).toBe('FWD: Engines');
  });

  it('replies to Reply-To when there is one, otherwise to the sender', () => {
    expect(generateQuote('reply', message(), '', null, false).to).toEqual(['Ada Lovelace <ada@remote.test>']);
    const listed = message({ ReplyTo: [{ Name: 'List', Mailbox: 'list', Host: 'remote.test' }] });
    expect(generateQuote('reply', listed, '', null, false).to).toEqual(['List <list@remote.test>']);
  });

  it('replies to all without repeating an address', () => {
    const quote = generateQuote('replyAll', message({ To: [{ Name: 'Ada Lovelace', Mailbox: 'ada', Host: 'remote.test' }, { Mailbox: 'me', Host: 'example.test' }] }), '', null, false);
    expect(quote.to).toEqual(['Ada Lovelace <ada@remote.test>', 'me@example.test']);
    expect(quote.cc).toEqual(['bob@example.test']);
  });

  describe("the user's own addresses", () => {
    const quote = (type: 'reply' | 'replyAll', envelope: Record<string, unknown>, self = ['ME@example.test']) =>
      generateQuote(type, message(envelope), '', null, false, undefined, undefined, self);

    it('are left out of a Reply All, in To and in Cc', () => {
      const q = quote('replyAll', {
        To: [{ Name: 'Me', Mailbox: 'me', Host: 'example.test' }, { Mailbox: 'grace', Host: 'remote.test' }],
        Cc: [{ Mailbox: 'bob', Host: 'example.test' }, { Mailbox: 'me', Host: 'EXAMPLE.test' }],
      });
      expect(q.to).toEqual(['Ada Lovelace <ada@remote.test>', 'grace@remote.test']);
      expect(q.cc).toEqual(['bob@example.test']);
    });

    it('are matched however the setting spells them', () => {
      const q = quote('replyAll', {}, ['"Me" <me@example.test>']);
      expect(q.to).toEqual(['Ada Lovelace <ada@remote.test>']);
    });

    it('turn a reply to my own message into one to its recipients', () => {
      const sent = { From: [{ Name: 'Me', Mailbox: 'me', Host: 'example.test' }], To: [{ Mailbox: 'grace', Host: 'remote.test' }] };
      expect(quote('reply', sent).to).toEqual(['grace@remote.test']);
      const all = quote('replyAll', sent);
      expect(all.to).toEqual(['grace@remote.test']);
      expect(all.cc).toEqual(['bob@example.test']);
    });

    it('move Cc up when my message had nobody else in To', () => {
      const q = quote('replyAll', { From: [{ Mailbox: 'me', Host: 'example.test' }], To: [{ Mailbox: 'me', Host: 'example.test' }] });
      expect(q.to).toEqual(['bob@example.test']);
      expect(q.cc).toEqual([]);
    });

    it('still answer a message I sent only to myself', () => {
      const q = quote('reply', { From: [{ Mailbox: 'me', Host: 'example.test' }], To: [{ Mailbox: 'me', Host: 'example.test' }] });
      expect(q.to).toEqual(['me@example.test']);
    });
  });

  it('addresses a forward to nobody', () => {
    const quote = generateQuote('forward', message(), '', null, false);
    expect(quote.to).toEqual([]);
    expect(quote.cc).toEqual([]);
  });

  it('quotes the text body line by line under an attribution', () => {
    const { quotedText } = generateQuote('reply', message(), 'one\ntwo', null, false);
    expect(quotedText).toContain('Ada Lovelace wrote:');
    expect(quotedText.endsWith('\n> one\n> two')).toBe(true);
  });

  it('heads a forward with the original sender, subject and recipients', () => {
    const { quotedText } = generateQuote('forward', message(), 'body', null, false);
    expect(quotedText).toContain('Forwarded message');
    expect(quotedText).toContain('From: Ada Lovelace <ada@remote.test>');
    expect(quotedText).toContain('Subject: Engines');
    expect(quotedText).toContain('To: me@example.test');
  });

  it('escapes a hostile display name and subject in every HTML branch', () => {
    const hostile = message({
      Subject: '<script>alert(1)</script>',
      From: [{ Name: '<img src=x onerror=alert(1)>', Mailbox: 'ada', Host: 'remote.test' }],
    });
    for (const [type, hasHtml] of [['reply', true], ['forward', true], ['reply', false], ['forward', false]] as const) {
      const { quotedHtml } = generateQuote(type, hostile, 'body', '<p>body</p>', hasHtml);
      const doc = parse(quotedHtml);
      expect(doc.querySelector('img'), `${type}/${hasHtml}`).toBeNull();
      expect(doc.querySelector('script'), `${type}/${hasHtml}`).toBeNull();
      expect(quotedHtml, `${type}/${hasHtml}`).toContain('&lt;img');
    }
  });

  it('sanitizes the quoted HTML body', () => {
    const { quotedHtml } = generateQuote('reply', message(), '', '<p>hi</p><script>x()</script><img src="https://cdn.test/a.png" onerror="y()">', true);
    const doc = parse(quotedHtml);
    expect(doc.querySelector('script')).toBeNull();
    expect(doc.querySelector('img')?.getAttribute('onerror')).toBeNull();
    expect(doc.querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/a.png');
  });

  const illustrated =
    '<p>chart</p><img src=" CID:chart@x"><img src="https://cdn.remote.test/logo.png">' +
    '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="drawn">';

  it("keeps the original's images in a reply as in a forward, as every client does", () => {
    // The inline parts travel with either (see inlinePartsOf), and a remote
    // image is the recipient's client's to show or block, as for any message.
    for (const type of ['reply', 'replyAll', 'forward'] as const) {
      const doc = parse(generateQuote(type, message(), 'chart', illustrated, true).quotedHtml);
      expect(Array.from(doc.querySelectorAll('img'), (img) => img.getAttribute('src')), type).toEqual([
        ' CID:chart@x',
        'https://cdn.remote.test/logo.png',
        'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
      ]);
    }
  });

  it('marks an HTML quote for the composer to keep whole, and nothing else', () => {
    for (const type of ['reply', 'forward'] as const) {
      const marked = parse(generateQuote(type, message(), 'body', '<p>quoted body</p>', true).quotedHtml).querySelectorAll(`[${QUOTE_ATTRIBUTE}]`);
      expect(marked, type).toHaveLength(1);
      expect(marked[0].textContent, type).toContain('quoted body');
    }
    // A text body quoted as HTML is paragraphs and breaks, which the editor keeps.
    expect(generateQuote('reply', message(), 'body', null, false).quotedHtml).not.toContain(QUOTE_ATTRIBUTE);
  });

  it('escapes a text body before turning its lines into breaks', () => {
    const { quotedHtml } = generateQuote('reply', message(), '<b>not markup</b>\nline two', null, false);
    expect(parse(quotedHtml).querySelector('blockquote b')).toBeNull();
    expect(quotedHtml).toContain('&lt;b&gt;not markup&lt;/b&gt;<br>line two');
  });

  it('falls back to the text body when HTML is claimed but missing', () => {
    const { quotedHtml } = generateQuote('reply', message(), 'plain', null, true);
    expect(quotedHtml).toContain('plain');
  });

  it('names an unknown sender rather than throwing', () => {
    const { quotedText } = generateQuote('reply', message({ From: undefined }), 'x', null, false);
    expect(quotedText).toContain('Unknown Sender wrote:');
    expect(() => generateQuote('reply', {}, '', null, false)).not.toThrow();
  });
});
