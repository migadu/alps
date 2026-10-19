/**
 * Plain text that becomes the HTML editor's content.
 *
 * The composer turns text into paragraphs, one a line, when a plain-text
 * message is switched to HTML and when a draft with no HTML part is reopened
 * in an HTML composer. The lines went in as markup: `<b>` turned the rest of
 * the line bold, and `a<b` or an address in angle brackets vanished.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/alps-message-composer';
import type { AlpsMessageComposer } from '../src/components/alps-message-composer';
import { cleanup, mount, update } from './helpers/dom';

const TEXT = 'if a<b and c>d\nAda <ada@example.com> & <b>co</b>';

afterEach(cleanup);

/** The editor's paragraphs, as text, and whether any markup came of them. */
function paragraphs(composer: AlpsMessageComposer) {
  const html = composer.editor!.getHTML();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return {
    lines: Array.from(doc.querySelectorAll('p'), (p) => p.textContent),
    marks: doc.querySelectorAll('b, strong').length,
  };
}

describe('plain text in the HTML editor', () => {
  it('reads as typed when a plain-text message is switched to HTML', async () => {
    const composer = await mount<AlpsMessageComposer>('alps-message-composer', { format: 'text', text: '' });
    await update(composer, { text: TEXT });
    await update(composer, { format: 'html' });
    expect(paragraphs(composer)).toEqual({ lines: TEXT.split('\n'), marks: 0 });
  });

  it('reads as typed when a draft with no HTML part opens in HTML', async () => {
    const composer = await mount<AlpsMessageComposer>('alps-message-composer', { format: 'html', text: TEXT, htmlText: '' });
    expect(paragraphs(composer)).toEqual({ lines: TEXT.split('\n'), marks: 0 });
  });
});
