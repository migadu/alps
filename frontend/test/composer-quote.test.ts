/**
 * A reply or forward keeps the original message's formatting in the HTML the
 * composer hands on to be saved and sent.
 *
 * The composer's editor drops markup its schema has no node or mark for, and
 * it rewrites the draft from that schema as soon as it opens. A quoted table
 * came out as run-together text, and fonts, colours, inline styles and images
 * were gone. Also guarded: a reopened draft keeps its quote, and the quote is
 * never live markup in our own page, where its remote images would load.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/alps-message-composer';
import type { AlpsMessageComposer } from '../src/components/alps-message-composer';
import { generateQuote } from '../src/utils/email-quote';
import { cleanup, mount, record } from './helpers/dom';

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

const message = {
  Envelope: {
    Subject: 'Engines',
    Date: '2024-01-05T14:07:00Z',
    From: [{ Name: 'Ada Lovelace', Mailbox: 'ada', Host: 'remote.test' }],
    To: [{ Mailbox: 'me', Host: 'example.test' }],
  },
};

// Some formatting the editor can represent (bold, italic, a link, a list, a
// coloured span) and some it cannot (a table, a font, styled blocks, an image).
const original =
  '<div style="font-family:Georgia,serif">' +
  '<p><b>Bold</b>, <i>italic</i> and <a href="https://example.test/notes">a link</a></p>' +
  '<ul><li>one</li><li>two</li></ul>' +
  '<table style="border-collapse:collapse"><tbody><tr><td style="background-color:#ffc">cell A</td><td>cell B</td></tr></tbody></table>' +
  '<p><span style="color:#c00">red</span> and <font color="#00c">blue</font></p>' +
  '<img src="https://cdn.example.test/logo.png" alt="logo">' +
  '</div>';

afterEach(cleanup);

const openComposer = (html: string) =>
  mount<AlpsMessageComposer>('alps-message-composer', { format: 'html', htmlText: html });

/** Types a line above everything else and returns what the composer reports. */
function typeLine(composer: AlpsMessageComposer, line: string) {
  const changes = record<CustomEvent>(composer, 'text-changed');
  composer.editor!.chain().insertContentAt(0, `<p>${line}</p>`).run();
  expect(changes.length, 'an edit reports the new content').toBeGreaterThan(0);
  return changes[changes.length - 1].detail as { text: string; html: string };
}

function expectFormattingKept(html: string) {
  const doc = parse(html);
  const quote = doc.querySelector('div.gmail_quote');
  expect(quote, 'the quote').not.toBeNull();
  expect(doc.querySelectorAll('table'), 'the original, quoted once').toHaveLength(1);
  expect(quote!.querySelector('b')?.textContent).toBe('Bold');
  expect(quote!.querySelector('i')?.textContent).toBe('italic');
  expect(quote!.querySelector('a')?.getAttribute('href')).toBe('https://example.test/notes');
  expect(Array.from(quote!.querySelectorAll('ul > li'), (li) => li.textContent)).toEqual(['one', 'two']);
  expect(Array.from(quote!.querySelectorAll('table td'), (td) => td.textContent)).toEqual(['cell A', 'cell B']);
  expect(quote!.querySelector('td')?.getAttribute('style')).toContain('background-color:#ffc');
  expect(quote!.querySelector('span')?.getAttribute('style')).toContain('color:#c00');
  expect(quote!.querySelector('font')?.getAttribute('color')).toBe('#00c');
  expect(quote!.querySelector('div[style]')?.getAttribute('style')).toContain('font-family:Georgia');
  expect(quote!.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example.test/logo.png');
}

describe('quoting into the composer', () => {
  it('keeps the original formatting of a reply, before and after typing', async () => {
    const { quotedHtml } = generateQuote('reply', message, 'plain body', original, true);
    const composer = await openComposer(quotedHtml);
    // Nothing typed yet: the editor rewrites the draft as it opens.
    expectFormattingKept(composer.messageHtml);

    const sent = typeLine(composer, 'Sounds good.');
    expectFormattingKept(sent.html);
    const doc = parse(sent.html);
    expect(doc.body.firstElementChild?.textContent).toBe('Sounds good.');
    expect(doc.querySelector('blockquote.gmail_quote')?.getAttribute('style')).toContain('border-left');
    // The text/plain part is the editor's text, so the quote belongs in it too.
    expect(sent.text).toContain('Sounds good.');
    expect(sent.text).toContain('cell A');
  });

  it('keeps the original formatting of a forward', async () => {
    const { quotedHtml } = generateQuote('forward', message, 'plain body', original, true);
    const sent = typeLine(await openComposer(quotedHtml), 'FYI');
    expectFormattingKept(sent.html);
    expect(parse(sent.html).querySelector('div.gmail_quote')?.textContent).toContain('Forwarded message');
  });

  it('keeps the quote whole when a saved draft is reopened', async () => {
    const { quotedHtml } = generateQuote('reply', message, 'plain body', original, true);
    const saved = typeLine(await openComposer(quotedHtml), 'Sounds good.').html;
    cleanup();

    const reopened = typeLine(await openComposer(saved), 'One more thing.');
    expectFormattingKept(reopened.html);
    expect(reopened.text).toContain('Sounds good.');
  });

  it('sanitizes the quote in a reopened draft as well', async () => {
    const draft =
      '<p>hi</p><div class="gmail_quote" data-alps-quote="">' +
      '<p>quoted</p><img src="https://cdn.example.test/a.png" onerror="steal()"><script>steal()</script></div>';
    const sent = parse(typeLine(await openComposer(draft), 'reply').html);
    expect(sent.querySelector('div.gmail_quote p')?.textContent).toBe('quoted');
    expect(sent.querySelector('img')?.getAttribute('onerror')).toBeNull();
    expect(sent.querySelector('script')).toBeNull();
  });

  it('shows the quote in a sandboxed frame with remote images blocked, not as markup in the page', async () => {
    const { quotedHtml } = generateQuote('reply', message, 'plain body', original, true);
    const composer = await openComposer(quotedHtml);
    const root = composer.shadowRoot!;
    expect(root.querySelector('.ProseMirror img, .ProseMirror table')).toBeNull();

    const frame = root.querySelector<HTMLIFrameElement>('.quoted-message iframe');
    expect(frame, 'the quote frame').not.toBeNull();
    expect(frame!.getAttribute('sandbox')).not.toContain('allow-scripts');
    const shown = parse(frame!.srcdoc);
    expect(shown.querySelector('td')?.textContent).toBe('cell A');
    expect(shown.querySelector('img')?.getAttribute('src')).toMatch(/^data:/);
  });
});
