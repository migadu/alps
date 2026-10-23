import { describe, expect, it } from 'vitest';
import { cidReferencesOf, withoutCidReferences } from '../src/utils/html-sanitizer';
import { discardedInlineAfterSave } from '../src/store/compose-store';

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
    const saved = { id: 'a', format: 'text' as const, html: '<img src="cid:old">', attachments: [{ partPath: '2', inline: true }] };
    const latest = { ...saved, format: 'html' as const, html: '<b>new words</b><img src="cid:old"><img src="cid:new">' };
    expect(discardedInlineAfterSave(latest, saved)).toEqual({ html: '<b>new words</b><img><img src="cid:new">', discardedInlineIds: ['old'] });
    expect(discardedInlineAfterSave(latest, { ...saved, format: 'html' })).toEqual({});
    expect(discardedInlineAfterSave(latest, { ...saved, attachments: [] })).toEqual({});
  });
});
