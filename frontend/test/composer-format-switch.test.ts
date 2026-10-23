/**
 * A reply or a forward switched between plain text and HTML.
 *
 * Its HTML holds the original as one quote block, and its text the same
 * original as `> ` lines. The two never read alike, so the switch to HTML took
 * every reply for one whose text had been edited, and rebuilt the HTML from
 * the text: the quote block, its tables, fonts and cid: images, became plain
 * `> ` paragraphs before the user had typed a character. The switch back to
 * plain text announced nothing, and the window went on saving and sending the
 * text it last heard.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/alps-message-composer';
import type { AlpsMessageComposer } from '../src/components/alps-message-composer';
import { generateQuote } from '../src/utils/email-quote';
import { cleanup, mount, record, update } from './helpers/dom';

const message = {
  Envelope: {
    Subject: 'Engines',
    Date: '2026-09-01T10:00:00Z',
    From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'remote.test' }],
    To: [{ Mailbox: 'me', Host: 'example.test' }],
  },
};
const original = '<p>The <b>figures</b> are in.</p><table><tbody><tr><td>cell A</td></tr></tbody></table>';
const reply = () => generateQuote('reply', message, 'The figures are in.\ncell A', original, true);

/** A reply opened in plain text, as the compose window opens one. */
async function plainReply(): Promise<{ composer: AlpsMessageComposer; text: string }> {
  const { quotedText, quotedHtml } = reply();
  const composer = await mount<AlpsMessageComposer>('alps-message-composer', {
    format: 'text', text: quotedText, htmlText: quotedHtml, initialText: quotedText,
  });
  return { composer, text: quotedText };
}

const quoteKept = (composer: AlpsMessageComposer) => ({
  block: composer.editor!.getHTML().includes('data-alps-quote-slot'),
  table: composer.messageHtml.includes('<td>cell A</td>'),
  lines: composer.messageHtml.includes('&gt; '),
});

afterEach(cleanup);

describe('a reply in plain text switched to HTML', () => {
  it('keeps its quote whole when nothing was typed', async () => {
    const { composer } = await plainReply();

    await update(composer, { format: 'html' });

    expect(quoteKept(composer)).toEqual({ block: true, table: true, lines: false });
  });

  it('keeps its quote whole under what was typed above it', async () => {
    const { composer, text } = await plainReply();
    await update(composer, { text: `Agreed.${text}` });
    const sent = record<CustomEvent>(composer, 'text-changed');

    await update(composer, { format: 'html' });

    expect(composer.editor!.getText().startsWith('Agreed.')).toBe(true);
    expect(quoteKept(composer)).toEqual({ block: true, table: true, lines: false });
    // An edit, announced as one.
    expect(sent.at(-1)?.detail).toEqual({ text: composer.messageText, html: composer.messageHtml });
  });

  it('is made from its text when the quote itself was changed', async () => {
    const { composer, text } = await plainReply();
    await update(composer, { text: text.replace('are in', 'are late') });

    await update(composer, { format: 'html' });

    expect(composer.messageHtml).toContain('are late');
    expect(composer.editor!.getHTML()).not.toContain('data-alps-quote-slot');
  });
});

describe('a new message in plain text switched to HTML', () => {
  // It opens with the signature, its HTML made beside the text. Written
  // above the signature and switched, it is made from the text, which keeps
  // the lines as typed: the HTML the signature opened with has its blank
  // lines in another form.
  it('keeps the lines and the signature as typed', async () => {
    const opening = '\n\n-- \nGrace\n';
    const composer = await mount<AlpsMessageComposer>('alps-message-composer', {
      format: 'text', text: opening, htmlText: '<br><br><div class="alps-signature">-- <br>Grace</div>', initialText: opening,
    });
    await update(composer, { text: `Hi Ada,\nthe figures are in.${opening}` });

    await update(composer, { format: 'html' });

    expect(composer.editor!.getText()).toBe('Hi Ada,\nthe figures are in.\n\n-- \nGrace\n');
  });
});

describe('an HTML message switched to plain text', () => {
  it('announces the text it now holds', async () => {
    const { quotedText, quotedHtml } = reply();
    const composer = await mount<AlpsMessageComposer>('alps-message-composer', { format: 'html', text: quotedText, htmlText: quotedHtml });
    const sent = record<CustomEvent>(composer, 'text-changed');

    await update(composer, { format: 'text' });

    expect(composer.messageText).toBe(composer.editor!.getText());
    expect(sent.at(-1)?.detail).toEqual({ text: composer.messageText, html: composer.messageHtml });
  });

  it('switched back untouched, is the HTML it was', async () => {
    const { quotedText, quotedHtml } = reply();
    const composer = await mount<AlpsMessageComposer>('alps-message-composer', { format: 'html', text: quotedText, htmlText: quotedHtml });
    const html = composer.messageHtml;

    await update(composer, { format: 'text' });
    await update(composer, { format: 'html' });

    expect(composer.messageHtml).toBe(html);
  });
});

describe('a plain-text draft opened in plain text', () => {
  // Its editor, which the switch to HTML shows, read the text as markup:
  // `a<b` and an address in angle brackets vanished, and `<b>` turned bold.
  const TEXT = 'if a<b and c>d\nAda <ada@example.com> & <b>co</b>';

  it('is held as its text, and shown so once switched to HTML', async () => {
    const composer = await mount<AlpsMessageComposer>('alps-message-composer', { format: 'text', text: TEXT, htmlText: '', initialText: TEXT });
    expect(composer.editor!.getText()).toBe(TEXT);

    await update(composer, { format: 'html' });

    expect(composer.editor!.getText()).toBe(TEXT);
    expect(new DOMParser().parseFromString(composer.messageHtml, 'text/html').querySelectorAll('b, strong')).toHaveLength(0);
  });
});
