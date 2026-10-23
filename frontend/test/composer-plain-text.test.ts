/**
 * Plain text that becomes the HTML editor's content.
 *
 * The composer turns text into paragraphs when a plain-text message is
 * switched to HTML and when a draft with no HTML part is reopened in an HTML
 * composer. The lines went in as markup: `<b>` turned the rest of the line
 * bold, and `a<b` or an address in angle brackets vanished.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/alps-message-composer';
import type { AlpsMessageComposer } from '../src/components/alps-message-composer';
import { cleanup, mount, record, update } from './helpers/dom';

const TEXT = 'if a<b and c>d\nAda <ada@example.com> & <b>co</b>';

afterEach(cleanup);

/** The editor's lines, as text, and whether any markup came of them. */
function paragraphs(composer: AlpsMessageComposer) {
  const html = composer.editor!.getHTML();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return {
    lines: composer.editor!.getText().split('\n'),
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

describe('plain text switched to HTML', () => {
  // As the textarea holds a message with a signature: the separator is dash,
  // dash, space (RFC 3676 §4.3), which a recipient's client looks for.
  const MESSAGE = 'Hi Ada,\nthe figures are in.\n\n\nBest,\n\n-- \nGrace\n  Analytical Engines\n';

  it('keeps the signature separator and the lines as written, in both parts', async () => {
    const composer = await mount<AlpsMessageComposer>('alps-message-composer', { format: 'text', text: '' });
    await update(composer, { text: MESSAGE });
    const sent: { text: string; html: string }[] = [];
    composer.addEventListener('text-changed', (e) => sent.push((e as CustomEvent).detail));
    await update(composer, { format: 'html' });

    // The text/plain part is the editor's text: the separator keeps its space,
    // and no blank line comes between lines that had none.
    expect(composer.editor!.getText()).toBe(MESSAGE);
    expect(sent.at(-1)?.text).toBe(MESSAGE);
    // In the HTML part the separator ends a line, not a paragraph, as in the
    // signature an HTML message is given.
    expect(sent.at(-1)?.html).toContain('-- <br>');
  });

  it('keeps them when a draft with no HTML part opens in HTML', async () => {
    const composer = await mount<AlpsMessageComposer>('alps-message-composer', { format: 'html', text: MESSAGE, htmlText: '' });
    expect(composer.editor!.getText()).toBe(MESSAGE);
    expect(composer.editor!.getHTML()).toContain('-- <br>');
  });

  // A draft saved as plain text reopens with no HTML part. One line of it is
  // already the editor's text, whether the editor read it as text or as
  // markup, so an HTML part has to be made even though the text matches.
  it('gives a reopened one-line draft its HTML part', async () => {
    const composer = await mount<AlpsMessageComposer>('alps-message-composer', { format: 'text', text: 'Hi Ada', htmlText: '' });
    const sent = record<CustomEvent>(composer, 'text-changed');
    await update(composer, { format: 'html' });

    expect(composer.messageHtml).toContain('>Hi Ada</p>');
    // The compose window saves and sends what this event tells it.
    expect(sent.at(-1)?.detail).toEqual({ text: 'Hi Ada', html: composer.messageHtml });

    await update(composer, { format: 'text' });
    expect(composer.messageText).toBe('Hi Ada');
  });

  it('keeps the HTML part a draft reopened as plain text already has', async () => {
    const html = '<p><strong>Hi</strong> Ada</p>';
    const composer = await mount<AlpsMessageComposer>('alps-message-composer', { format: 'text', text: 'Hi Ada', htmlText: html });
    await update(composer, { format: 'html' });

    expect(composer.messageHtml).toBe(html);
    expect(composer.editor!.getHTML()).toContain('<strong>Hi</strong>');
  });
});
