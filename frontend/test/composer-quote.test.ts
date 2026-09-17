/**
 * A reply or forward keeps the original message's formatting in the HTML the
 * composer hands on to be saved and sent.
 *
 * The composer's editor drops markup its schema has no node or mark for, and
 * it rewrites the draft from that schema as soon as it is edited. A quoted
 * table came out as run-together text, and fonts, colours, inline styles and
 * images were gone. Also guarded: a reopened draft keeps its quote, the quote
 * is never live markup in our own page, where its remote images would load,
 * and the ways an editor can lose or replace a block it does not look inside:
 * a Delete beside it, a link or emoji inserted over it, a copy, a paste.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/alps-message-composer';
import { AlpsMessageComposer } from '../src/components/alps-message-composer';
import { generateQuote } from '../src/utils/email-quote';
import * as readerUtils from '../src/utils/reader-utils';
import { cleanup, mount, record } from './helpers/dom';

vi.mock('../src/utils/reader-utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/utils/reader-utils')>();
  return { ...original, applyThemeToIframe: vi.fn(original.applyThemeToIframe) };
});

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

afterEach(() => {
  cleanup();
  vi.mocked(readerUtils.applyThemeToIframe).mockClear();
});

const openComposer = (html: string, props: Record<string, unknown> = {}) =>
  mount<AlpsMessageComposer>('alps-message-composer', { format: 'html', htmlText: html, ...props });

const reply = () => generateQuote('reply', message, 'plain body', original, true).quotedHtml;
const forward = () => generateQuote('forward', message, 'plain body', original, true).quotedHtml;

/** Types a line above everything else and returns what the composer reports. */
function typeLine(composer: AlpsMessageComposer, line: string) {
  const changes = record<CustomEvent>(composer, 'text-changed');
  composer.editor!.chain().insertContentAt(0, `<p>${line}</p>`).run();
  expect(changes.length, 'an edit reports the new content').toBeGreaterThan(0);
  return changes[changes.length - 1].detail as { text: string; html: string };
}

/**
 * Presses a key in the editor the way a keyboard does. Not the editor's
 * `keyboardShortcut` command: that replays only the document steps a binding
 * makes, and a binding that selects makes none.
 */
function press(composer: AlpsMessageComposer, key: string) {
  composer.editor!.view.dom.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

/** The quote in the editor's document, and where it starts. */
function quoteNode(composer: AlpsMessageComposer) {
  let found: { pos: number; size: number } | null = null;
  composer.editor!.state.doc.descendants((node, pos) => {
    if (node.type.name === 'quotedMessage') found = { pos, size: node.nodeSize };
    return !found;
  });
  return found as { pos: number; size: number } | null;
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
  it('keeps the original formatting of a reply, images included', async () => {
    const composer = await openComposer(reply());
    // Nothing typed yet: the draft is the quote generateQuote built, untouched.
    expect(composer.htmlText).toBe(reply());

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
    const sent = typeLine(await openComposer(forward()), 'FYI');
    expectFormattingKept(sent.html);
    expect(parse(sent.html).querySelector('div.gmail_quote')?.textContent).toContain('Forwarded message');
  });

  it('keeps the quote whole when a saved draft is reopened', async () => {
    const saved = typeLine(await openComposer(forward()), 'Sounds good.').html;
    cleanup();

    const reopened = typeLine(await openComposer(saved), 'One more thing.');
    expectFormattingKept(reopened.html);
    expect(reopened.text).toContain('Sounds good.');
  });

  it('keeps the whitespace between the original\'s elements', async () => {
    // The editor's string path deletes every newline-only text node before
    // parsing, so `Total:</b>\n<span>$5` went out as `Total:$5`.
    const draft =
      '<p>hi</p><div class="gmail_quote" data-alps-quote="">' +
      '<p><b>Total:</b>\n<span>$5</span></p><pre><span>c</span>\n<span>d</span></pre></div>';
    const sent = parse(typeLine(await openComposer(draft), 'reply').html);
    expect(sent.querySelector('div.gmail_quote p')?.textContent).toBe('Total:\n$5');
    expect(sent.querySelector('div.gmail_quote pre')?.textContent).toBe('c\nd');
  });

  it('does not serialize the quote through the editor on every edit', async () => {
    const composer = await openComposer(forward());
    typeLine(composer, 'FYI');
    // The editor's own HTML holds a placeholder; the quote is spliced in from
    // the document, so an edit does not re-serialize or re-parse the original.
    expect(composer.editor!.getHTML()).not.toContain('cell A');
    expect(composer.editor!.getHTML()).toContain('data-alps-quote-slot');
    expect(composer.htmlText).toContain('cell A');
    expect(composer.htmlText).not.toContain('data-alps-quote-slot');
  });
});

describe('what the composer will not take as a quote', () => {
  it('sanitizes the quote in a reopened draft as well', async () => {
    const draft =
      '<p>hi</p><div class="gmail_quote" data-alps-quote="">' +
      '<p>quoted</p><img src="https://cdn.example.test/a.png" onerror="steal()"><script>steal()</script></div>';
    const sent = parse(typeLine(await openComposer(draft), 'reply').html);
    expect(sent.querySelector('div.gmail_quote p')?.textContent).toBe('quoted');
    expect(sent.querySelector('img')?.getAttribute('onerror')).toBeNull();
    expect(sent.querySelector('script')).toBeNull();
  });

  it('ignores an html= attribute on the marked element', async () => {
    // The node's `html` attribute is set by its parse rule, which sanitizes.
    // Left to the editor, a literal `html="…"` on the element was read too,
    // raw, and won over the rule's value.
    const draft =
      '<p>hi</p><div class="gmail_quote" data-alps-quote="" html="&lt;img src=x onerror=steal()&gt;&lt;script&gt;steal()&lt;/script&gt;">' +
      '<p>quoted</p></div>';
    const sent = parse(typeLine(await openComposer(draft), 'reply').html);
    expect(sent.querySelector('div.gmail_quote p')?.textContent).toBe('quoted');
    expect(sent.querySelector('img')).toBeNull();
    expect(sent.querySelector('script')).toBeNull();
  });

  it('pastes a quote as ordinary content, never as a block with its references', async () => {
    const composer = await openComposer('<p>hi</p>');
    // Copied out of a forward: a cid: image whose part this composer does not
    // hold. Copied out of the reader: the reader's own rewrite of one.
    const pasted =
      '<div class="gmail_quote" data-alps-quote=""><p>quoted</p><img src="cid:chart@remote.test"></div>' +
      '<div data-alps-quote-slot=""></div>' +
      '<p><img src="/mailboxes/INBOX/messages/42/raw?part=2" data-original-src="https://t.example/p.gif"></p>';
    composer.editor!.commands.setTextSelection(composer.editor!.state.doc.content.size - 1);
    // jsdom has no ClipboardEvent, which the editor's paste path constructs.
    vi.stubGlobal('ClipboardEvent', class extends Event {
      clipboardData = { getData: () => '' };
    });
    try {
      composer.editor!.view.pasteHTML(pasted);
    } finally {
      vi.unstubAllGlobals();
    }

    expect(quoteNode(composer)).toBeNull();
    const sent = composer.editor!.getHTML();
    expect(sent).toContain('quoted');
    expect(sent).not.toContain('<img');
    expect(sent).not.toContain('data-alps-quote');
  });
});

describe('editing beside the quote', () => {
  it('selects the quote on a Delete or Backspace beside it, and deletes it on the next', async () => {
    const composer = await openComposer(reply());
    const editor = composer.editor!;
    typeLine(composer, 'Above');
    const { pos } = quoteNode(composer)!;

    // Delete at the end of the paragraph above.
    editor.commands.setTextSelection(pos - 1);
    press(composer, 'Delete');
    expect(editor.state.selection.from).toBe(pos);
    expect(quoteNode(composer), 'the first press only selects').not.toBeNull();
    press(composer, 'Delete');
    expect(quoteNode(composer), 'the second press deletes').toBeNull();

    // Backspace at the start of the paragraph below.
    cleanup();
    const again = await openComposer(reply() + '<p>Below</p>');
    const below = quoteNode(again)!;
    again.editor!.commands.setTextSelection(below.pos + below.size + 1);
    press(again, 'Backspace');
    expect(again.editor!.state.selection.from).toBe(below.pos);
    expect(quoteNode(again)).not.toBeNull();
    press(again, 'Backspace');
    expect(quoteNode(again)).toBeNull();
  });

  it('puts an emoji, or what the link dialog inserts, beside a selected quote and not in its place', async () => {
    const composer = await openComposer(reply());
    const editor = composer.editor!;
    editor.commands.setNodeSelection(quoteNode(composer)!.pos);
    expect(composer.hasSelection(), 'a selected quote is not text to link').toBe(false);

    // Nothing follows the quote, so a paragraph is made for the emoji.
    composer.insertEmoji('🙂');
    expect(quoteNode(composer)).not.toBeNull();
    expect(composer.htmlText).toContain('🙂');

    // The link dialog leaves the selected quote the same way before it inserts,
    // and drops the link from the stored marks after, as the floating composer does.
    editor.commands.setNodeSelection(quoteNode(composer)!.pos);
    composer.leaveSelectedNode();
    editor.chain().focus()
      .insertContent('<a href="https://example.test/more">see below</a>')
      .command(({ tr, dispatch }) => {
        if (dispatch) tr.removeStoredMark(editor.schema.marks.link);
        return true;
      })
      .run();
    expect(quoteNode(composer)).not.toBeNull();
    const link = parse(composer.htmlText).querySelector("a[href='https://example.test/more']");
    expect(link?.textContent).toBe('see below');
  });

  it('copies the quote as the markup it is', async () => {
    const composer = await openComposer(forward());
    const editor = composer.editor!;
    editor.commands.selectAll();
    const copied = editor.view.serializeForClipboard(editor.state.selection.content());
    // The editor's own HTML holds a placeholder for the quote; a copy holds
    // the quote, for whatever it is pasted into.
    expect(Array.from(copied.dom.querySelectorAll('table td'), (td) => td.textContent)).toEqual(['cell A', 'cell B']);
    expect(copied.dom.querySelector('[data-alps-quote-slot]')).toBeNull();
    expect(copied.text).toContain('cell A');
  });
});

describe('the quote frame', () => {
  it('is sandboxed, out of the tab order, and shows the quote with remote images blocked', async () => {
    const composer = await openComposer(forward());
    const root = composer.shadowRoot!;
    expect(root.querySelector('.ProseMirror img, .ProseMirror table')).toBeNull();

    const frame = root.querySelector<HTMLIFrameElement>('.quoted-message iframe');
    expect(frame, 'the quote frame').not.toBeNull();
    expect(frame!.getAttribute('sandbox')).not.toContain('allow-scripts');
    expect(frame!.getAttribute('tabindex')).toBe('-1');
    const shown = parse(frame!.srcdoc);
    expect(shown.querySelector('td')?.textContent).toBe('cell A');
    expect(shown.querySelector('img')?.getAttribute('src')).toMatch(/^data:/);
  });

  it("shows a reply's or forward's inline images from the original's own parts, and sends their cid: references", async () => {
    const html = '<p>chart below</p><img src="cid:chart@remote.test" alt="chart">';
    // The part carrying the Content-ID, as IMAP describes the message; a part
    // filed as an attachment still carries its Content-ID and still resolves.
    const structure = { Children: [{ Type: 'text', Subtype: 'html' }, { ID: '<chart@remote.test>', Extended: { Disposition: { Value: 'attachment' } } }] };
    for (const type of ['reply', 'forward'] as const) {
      const { quotedHtml } = generateQuote(type, message, 'chart below', html, true);
      const composer = await openComposer(quotedHtml, { quoteSource: { mailbox: 'INBOX', uid: '42', structure } });

      const frame = composer.shadowRoot!.querySelector<HTMLIFrameElement>('.quoted-message iframe');
      expect(parse(frame!.srcdoc).querySelector('img')?.getAttribute('src'), type).toBe('/mailboxes/INBOX/messages/42/raw?part=2');
      expect(parse(typeLine(composer, 'FYI').html).querySelector('img')?.getAttribute('src'), type).toBe('cid:chart@remote.test');
      cleanup();
    }
  });

  it("is re-themed when the settings change, as the reader's frames are", async () => {
    const settings = new EventTarget() as EventTarget & { getState: () => { themeIframeContent: boolean } };
    const state = { themeIframeContent: true };
    settings.getState = () => state;
    const composer = await openComposer(forward(), { settingsStore: settings });
    const frame = composer.shadowRoot!.querySelector<HTMLIFrameElement>('.quoted-message iframe')!;
    vi.mocked(readerUtils.applyThemeToIframe).mockClear();

    state.themeIframeContent = false;
    settings.dispatchEvent(new Event('change'));

    expect(readerUtils.applyThemeToIframe).toHaveBeenCalledWith(frame, false);
  });

  it("carries the editor's own selection and cursor rules, which it no longer injects into the page", async () => {
    await openComposer(forward());
    // Injected into document.head, the editor's stylesheet never reaches this
    // shadow root: a selected quote showed the native selection's tint over
    // its frame, and a gap cursor beside it had no caret.
    expect(document.head.querySelector('style[data-tiptap-style]')).toBeNull();
    const css = (AlpsMessageComposer.styles as { cssText: string }[]).map((s) => s.cssText).join('\n');
    expect(css).toContain('.ProseMirror-hideselection *::selection');
    expect(css).toContain('.ProseMirror-gapcursor:after');
    expect(css).toContain('.ProseMirror-selectednode');
  });
});

describe('a text-only original', () => {
  it('is quoted as an editable blockquote that keeps its class and its bar', async () => {
    const { quotedHtml } = generateQuote('reply', message, 'line one\nline two', null, false);
    const composer = await openComposer(quotedHtml);
    expect(quoteNode(composer), 'editable, so it can be trimmed').toBeNull();

    const sent = parse(typeLine(composer, 'Agreed.').html);
    const quote = sent.querySelector('blockquote');
    expect(quote?.getAttribute('class')).toBe('gmail_quote');
    expect(quote?.getAttribute('style')).toContain('border-left');
    expect(quote?.textContent).toContain('line one');
    expect(sent.body.textContent).toContain('Ada Lovelace wrote:');
  });
});
