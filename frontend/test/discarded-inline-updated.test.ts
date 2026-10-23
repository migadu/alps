import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/alps-message-composer';
import { generateQuote } from '../src/utils/email-quote';
import { withoutCidReferences } from '../src/utils/html-sanitizer';
import { cleanup, mount, update } from './helpers/dom';

afterEach(cleanup);

describe('a committed text save loses only its discarded resources', () => {
  it('retains other srcset candidates and the image source', () => {
    const html = '<img src="cid:kept" srcset="cid:gone 1x, https://cdn.test/photo 2x">';
    const result = withoutCidReferences(html, new Set(['gone']));
    const img = new DOMParser().parseFromString(result, 'text/html').querySelector('img');
    expect(img?.getAttribute('src')).toBe('cid:kept');
    expect(img?.getAttribute('srcset')).toBe('https://cdn.test/photo 2x');
  });

  it('retains a video source when only its poster image was discarded', () => {
    const result = withoutCidReferences('<video src="https://cdn.test/movie" poster="cid:gone"></video>', new Set(['gone']));
    const video = new DOMParser().parseFromString(result, 'text/html').querySelector('video');
    expect(video?.getAttribute('src')).toBe('https://cdn.test/movie');
    expect(video?.hasAttribute('poster')).toBe(false);
  });

  it('never restores an unavailable CID image through Undo', async () => {
    const quote = generateQuote('reply', { Envelope: { Subject: 'Photo', From: [{ Mailbox: 'ada', Host: 'remote.test' }] } }, 'Photo', '<p>Photo</p><img src="cid:gone">', true);
    const el = await mount<HTMLElement & Record<string, any>>('alps-message-composer', {
      format: 'html', text: quote.quotedText, htmlText: quote.quotedHtml,
    });
    el.editor.chain().insertContentAt(1, 'New words.').run();
    await update(el, { discardedInlineIds: ['gone'] });
    expect(el.messageHtml).not.toContain('cid:gone');
    el.editor.commands.undo();
    expect(el.messageHtml).not.toContain('cid:gone');
  });
});
