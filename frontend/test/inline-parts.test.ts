/**
 * The inline parts a reply or forward carries.
 *
 * The quote keeps the original's `cid:` images, and a `cid:` names a part of
 * the message it came in. The message's attachment rows leave those parts out,
 * as parts of the body, so they are read off its structure and carried: without
 * them the recipient gets a broken image where the original had a picture.
 * Only those: a file that names itself by Content-ID, as Exchange's do, is not
 * the body's, and carried unseen it went to the recipients again.
 */
import { describe, expect, it } from 'vitest';
import { inlinePartsOf } from '../src/utils/attachment-utils';
import { cidReferencesOf, sanitizeQuotedHTML } from '../src/utils/html-sanitizer';

/** A quote that shows the chart. */
const quote = '<p>chart below</p><img src="cid:chart@remote.test">';

const image = (extra: Record<string, unknown> = {}) => ({
  Type: 'IMAGE', Subtype: 'PNG', ID: '<chart@remote.test>', Encoding: 'BASE64', Size: 400,
  Params: { name: 'chart.png' },
  ...extra,
});

describe('inlinePartsOf', () => {
  it('carries every part the quote shows by Content-ID, numbered as the server numbers parts', () => {
    const structure = {
      Children: [
        { Children: [{ Type: 'text', Subtype: 'plain' }, { Type: 'text', Subtype: 'html' }] },
        image(),
        { Type: 'application', Subtype: 'pdf', Params: { name: 'report.pdf' } },
      ],
    };
    expect(inlinePartsOf(structure, quote)).toEqual([
      { name: 'chart.png', size: 291, type: 'image/png', partPath: '2', inline: true },
    ]);
  });

  it('numbers a nested part by its path, and a lone part as 1', () => {
    const nested = { Children: [{ Type: 'text', Subtype: 'html' }, { Children: [{ Type: 'text', Subtype: 'plain' }, image()] }] };
    expect(inlinePartsOf(nested, quote).map((part) => part.partPath)).toEqual(['2.2']);
    expect(inlinePartsOf(image(), quote).map((part) => part.partPath)).toEqual(['1']);
  });

  it('carries a part filed as an attachment that the quote shows by Content-ID', () => {
    // Outlook and Apple Mail give an inline image an attachment disposition.
    const filed = image({ Params: {}, Extended: { Disposition: { Value: 'attachment', Params: { filename: 'logo.png' } } } });
    expect(inlinePartsOf({ Children: [{ Type: 'text', Subtype: 'html' }, filed] }, quote)).toEqual([
      { name: 'logo.png', size: 291, type: 'image/png', partPath: '2', inline: true },
    ]);
  });

  it('leaves out a file that names itself by Content-ID, which the quote does not show', () => {
    // As Exchange files an ordinary attachment.
    const report = {
      Type: 'application', Subtype: 'pdf', ID: '<report@exchange.test>', Encoding: 'base64', Size: 400,
      Extended: { Disposition: { Value: 'attachment', Params: { filename: 'report.pdf' } } },
    };
    expect(inlinePartsOf({ Children: [{ Type: 'text', Subtype: 'html' }, report] }, quote)).toEqual([]);
    // Nor one with no disposition.
    expect(inlinePartsOf({ Children: [{ Type: 'text', Subtype: 'html' }, image()] }, '<p>no image</p>')).toEqual([]);
  });

  it('carries a part filed inline, whatever the quote shows', () => {
    // The server lists it as no attachment either: it is the body's.
    const inline = image({ Extended: { Disposition: { Value: 'INLINE' } } });
    expect(inlinePartsOf({ Children: [{ Type: 'text', Subtype: 'html' }, inline] }, '')).toEqual([
      { name: 'chart.png', size: 291, type: 'image/png', partPath: '2', inline: true },
    ]);
  });

  it('reads the Content-IDs the quote names as a browser reads them', () => {
    // In any case, with whitespace about the scheme, as a srcset candidate,
    // and as a cell's background.
    const parts = (ids: string[]) => ({ Children: [{ Type: 'text', Subtype: 'html' }, ...ids.map((id) => image({ ID: `<${id}>` }))] });
    const html = '<img src=" CID:a@x"><img srcset="https://cdn.test/b.png 1x, cid:b@x 2x"><table><tr><td background="cid:c@x">c</td></tr></table>';
    expect(inlinePartsOf(parts(['a@x', 'b@x', 'c@x', 'd@x']), html).map((part) => part.partPath)).toEqual(['2', '3', '4']);
  });

  it.each([
    '<p data-note="cid:report@x">Text</p>',
    '<p title="cid:report@x">Text</p>',
    '<img alt="cid:report@x">',
    '<p src="cid:report@x">Text</p>',
    '<p srcset="cid:report@x 1x" poster="cid:report@x">Text</p>',
  ])('does not carry a file named only by a non-resource quote attribute: %s', html => {
    const report = { Type: 'application', Subtype: 'pdf', ID: '<report@x>', Extended: { Disposition: { Value: 'attachment', Params: { filename: 'report.pdf' } } } };
    const quote = sanitizeQuotedHTML(html);
    expect(quote).toContain('cid:report@x');
    expect(inlinePartsOf({ Children: [{ Type: 'text', Subtype: 'html' }, report] }, quote)).toEqual([]);
  });

  it.each([
    '<img src=" CID:chart@x">',
    '<picture><source srcset="cid:chart@x 1x, https://remote.test/a.png 2x"></picture>',
    '<video poster="cid:chart@x"></video>',
    '<audio src="cid:chart@x"></audio>',
    '<table><tr><td background="cid:chart@x">Text</td></tr></table>',
    '<a href="cid:chart@x">Open the chart</a>',
    '<svg><image href="cid:chart@x"></image><use xlink:href="cid:chart@x"></use><filter><feImage href="cid:chart@x"></feImage></filter></svg>',
  ])('keeps actual resource and link references in retained quote markup: %s', html => {
    expect([...cidReferencesOf(sanitizeQuotedHTML(html))]).toEqual(['chart@x']);
  });

  it("reads a base64 part's size without its line breaks", () => {
    // The structure reports the encoded size, which counts the CRLF ending
    // every 76-character line; those are not data. A 128 KiB image read as
    // 131 KiB. The last line may end in a CRLF or not: the server leaves out
    // the one before the next boundary, which belongs to the boundary. Up to
    // two bytes over is the padding a size cannot tell apart.
    const sizes = [128 * 1024, 1000, 57 * 20, ...Array.from({ length: 301 }, (_, i) => i)];
    for (const bytes of sizes) {
      const lines = Buffer.alloc(bytes, 7).toString('base64').match(/.{1,76}/g) ?? [];
      const framings = {
        'as written': lines.join('\r\n'),
        'with a CRLF on its last line': lines.map((line) => `${line}\r\n`).join(''),
      };
      for (const [framing, encoded] of Object.entries(framings)) {
        const [part] = inlinePartsOf(image({ Size: encoded.length }), quote);
        const label = `${bytes} bytes ${framing}, in ${encoded.length} octets`;
        expect(part.size, label).toBeGreaterThanOrEqual(bytes);
        expect(part.size, label).toBeLessThanOrEqual(bytes + 2);
      }
    }
    // 57 bytes a line, twenty lines, each with its CRLF: 1560 octets, an exact
    // number of 78-octet lines.
    expect(inlinePartsOf(image({ Size: 1560 }), quote)[0].size).toBe(1140);
  });

  it('carries nothing for a message with no such part, or no structure', () => {
    expect(inlinePartsOf({ Children: [{ Type: 'text', Subtype: 'plain' }] }, quote)).toEqual([]);
    expect(inlinePartsOf(undefined, quote)).toEqual([]);
    expect(inlinePartsOf(null, quote)).toEqual([]);
  });
});
