/**
 * The inline parts a reply or forward carries.
 *
 * The quote keeps the original's `cid:` images, and a `cid:` names a part of
 * the message it came in. The message's attachment rows leave those parts out,
 * as parts of the body, so they are read off its structure and carried: without
 * them the recipient gets a broken image where the original had a picture.
 */
import { describe, expect, it } from 'vitest';
import { inlinePartsOf } from '../src/utils/attachment-utils';

const image = (extra: Record<string, unknown> = {}) => ({
  Type: 'IMAGE', Subtype: 'PNG', ID: '<chart@remote.test>', Encoding: 'BASE64', Size: 400,
  Params: { name: 'chart.png' },
  ...extra,
});

describe('inlinePartsOf', () => {
  it('carries every part with a Content-ID, numbered as the server numbers parts', () => {
    const structure = {
      Children: [
        { Children: [{ Type: 'text', Subtype: 'plain' }, { Type: 'text', Subtype: 'html' }] },
        image(),
        { Type: 'application', Subtype: 'pdf', Params: { name: 'report.pdf' } },
      ],
    };
    expect(inlinePartsOf(structure)).toEqual([
      { name: 'chart.png', size: 300, type: 'image/png', partPath: '2', inline: true },
    ]);
  });

  it('numbers a nested part by its path, and a lone part as 1', () => {
    const nested = { Children: [{ Type: 'text', Subtype: 'html' }, { Children: [{ Type: 'text', Subtype: 'plain' }, image()] }] };
    expect(inlinePartsOf(nested).map((part) => part.partPath)).toEqual(['2.2']);
    expect(inlinePartsOf(image()).map((part) => part.partPath)).toEqual(['1']);
  });

  it('carries a part filed as an attachment, which still names itself by Content-ID', () => {
    // Outlook and Apple Mail give an inline image an attachment disposition.
    const filed = image({ Params: {}, Extended: { Disposition: { Value: 'attachment', Params: { filename: 'logo.png' } } } });
    expect(inlinePartsOf({ Children: [{ Type: 'text', Subtype: 'html' }, filed] })).toEqual([
      { name: 'logo.png', size: 300, type: 'image/png', partPath: '2', inline: true },
    ]);
  });

  it('carries nothing for a message with no such part, or no structure', () => {
    expect(inlinePartsOf({ Children: [{ Type: 'text', Subtype: 'plain' }] })).toEqual([]);
    expect(inlinePartsOf(undefined)).toEqual([]);
    expect(inlinePartsOf(null)).toEqual([]);
  });
});
