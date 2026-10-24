import { describe, expect, it } from 'vitest';
import { cidReferencesOf, withoutCidReferences } from '../src/utils/html-sanitizer';
import { discardedInlineAfterSave, reconcileSavedAttachments } from '../src/store/compose-store';

describe('inline resources discarded by a text save', () => {
  it('removes only the discarded URLs across supported resource and link attributes', () => {
    const html = '<table background="CID:lost"><tr><td>kept table</td></tr></table>' +
      '<img src="cid:lost" srcset="cid:lost 1x, cid:kept 2x, https://cdn.test/w_1,c_limit/image 3x">' +
      '<video poster="cid:lost"></video><a href="cid:lost">link text</a>' +
      '<svg><image href="cid:lost"/><use xlink:href="cid:kept"/></svg>' +
      '<img src="data:image/png;base64,AAAA"><p title="cid:lost" data-note="cid:lost">words</p>';
    const result = withoutCidReferences(html, new Set(['lost']));
    expect([...cidReferencesOf(result)]).toEqual(['kept']);
    const doc = new DOMParser().parseFromString(result, 'text/html');
    expect(doc.querySelector('td')?.textContent).toBe('kept table');
    expect(doc.querySelector('a')?.textContent).toBe('link text');
    expect(doc.querySelector('img')?.getAttribute('srcset')).toBe('cid:kept 2x, https://cdn.test/w_1,c_limit/image 3x');
    expect(doc.querySelector('img[src^="data:"]')).not.toBeNull();
    expect(doc.querySelector('p')?.getAttribute('title')).toBe('cid:lost');
  });

  it('preserves exact markup when no reference names a discarded part', () => {
    const html = '<img src="cid:kept" ><strong>spacing untouched</strong>';
    expect(withoutCidReferences(html, new Set(['lost']))).toBe(html);
  });

  it('does not remove new resources or references after HTML saves', () => {
    const saved = { id: 'a', format: 'text' as const, html: '<img src="cid:old">', attachments: [{ partPath: '2', inline: true, contentId: 'old' }] };
    const latest = { ...saved, format: 'html' as const, html: '<b>new words</b><img src="cid:old"><img src="cid:new">' };
    expect(discardedInlineAfterSave(latest, saved)).toEqual({ html: '<b>new words</b><img><img src="cid:new">', discardedInlineIds: ['old'] });
    expect(discardedInlineAfterSave(latest, { ...saved, format: 'html' })).toEqual({});
    expect(discardedInlineAfterSave(latest, { ...saved, attachments: [] })).toEqual({});
  });
});


describe('the identities of discarded inline parts', () => {
  const html = '<img src="cid:image"><a href="cid:file">Download report</a>';
  const file = { name: 'report.txt', partPath: '3' };
  const image = { name: 'chart.png', partPath: '2', inline: true, contentId: 'image' };
  const saved = { id: 'a', format: 'text' as const, html, attachments: [file, image] };

  it('keeps a retained normal attachment link when an inline image was omitted', () => {
    expect(discardedInlineAfterSave(saved, saved)).toEqual({
      html: '<img><a href="cid:file">Download report</a>', discardedInlineIds: ['image'],
    });
  });

  it('carries the stable Content-ID through draft part-path renumbering', () => {
    const mapped = reconcileSavedAttachments([image], [image], [{ name: 'chart.png', inline: true, partPath: '1.2', source: { partPath: '2' } }]);
    expect(mapped).toEqual([{ name: 'chart.png', inline: true, partPath: '1.2', contentId: 'image' }]);
  });

  it('uses readback structure to distinguish kept files in legacy descriptors', () => {
    const legacy = { ...saved, attachments: [file, { ...image, contentId: undefined }] };
    expect(discardedInlineAfterSave(legacy, legacy, { structure: { Children: [{ Type: 'text', Subtype: 'plain' }, { ID: '<file>' }] } })).toEqual({
      html: '<img><a href="cid:file">Download report</a>', discardedInlineIds: ['image'],
    });
  });

  it('uses original paths for a legacy composer that has never been saved', () => {
    const legacy = { ...saved, attachments: [file, { ...image, contentId: undefined }], quoteSource: { mailbox: 'INBOX', uid: '1', structure: { Children: [{}, { ID: '<image>' }, { ID: '<file>' }] } } };
    expect(discardedInlineAfterSave(legacy, legacy)).toMatchObject({ discardedInlineIds: ['image'] });
  });

  it('does not guess CID identity from renumbered legacy paths after readback failure', () => {
    const legacy = { ...saved, draftUid: '9', draftMailbox: 'Drafts', attachments: [file, { ...image, partPath: '1.2', contentId: undefined }], quoteSource: { mailbox: 'INBOX', uid: '1', structure: { Children: [{ ID: '<file>' }] } } };
    expect(discardedInlineAfterSave(legacy, legacy)).toEqual({});
  });
});
