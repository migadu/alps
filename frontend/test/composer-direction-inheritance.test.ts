/**
 * A block pasted or typed into a quote whose direction is fixed keeps that
 * direction, at every level, when the draft is saved, sent and reopened.
 *
 * Only a paragraph directly inside the quote used to inherit it: a pasted
 * heading or list, or a list nested in one, went out automatic and was laid
 * out by its own first letter instead. A block marked dir="auto" keeps
 * following its own content.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AlpsMessageComposer } from '../src/components/alps-message-composer';
import '../src/components/alps-message-composer';
import { cleanup, mount } from './helpers/dom';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function directions(markup: string, selector: string) {
  const body = new DOMParser().parseFromString(markup, 'text/html').body;
  return [...body.querySelectorAll<HTMLElement>(selector)].map((element) => element.dir);
}

async function checkImportPasteAndReopen(
  direction: 'ltr' | 'rtl', markup: string, selector: string, expected: string[],
) {
  const seed = direction === 'rtl' ? 'مرحبا' : 'Hello';
  const quote = (content: string) => `<blockquote dir="${direction}"><p>${seed}</p>${content}</blockquote>`;
  const imported = await mount<AlpsMessageComposer>('alps-message-composer', {
    format: 'html', htmlText: quote(markup),
  });
  expect(directions(imported.editor!.getHTML(), selector), 'initial import').toEqual(expected);
  cleanup();

  const composer = await mount<AlpsMessageComposer>('alps-message-composer', {
    format: 'html', htmlText: quote(''),
  });
  composer.editor!.commands.setTextSelection(2 + seed.length);
  // Exercise ProseMirror's contextual paste parser in jsdom.
  vi.stubGlobal('ClipboardEvent', class extends Event {
    clipboardData = { getData: () => '' };
  });
  composer.editor!.view.pasteHTML(`<p>First line.</p>${markup}`);
  expect(directions(composer.editor!.view.dom.innerHTML, selector), 'live paste').toEqual(expected);
  const saved = composer.htmlText;
  expect(directions(saved, selector), 'outgoing HTML').toEqual(expected);
  cleanup();

  const reopened = await mount<AlpsMessageComposer>('alps-message-composer', {
    format: 'html', htmlText: saved,
  });
  expect(directions(reopened.editor!.getHTML(), selector), 'reopened draft').toEqual(expected);
}

describe('pasted blocks inherit their authored destination direction', () => {
  for (const direction of ['ltr', 'rtl'] as const) {
    const text = direction === 'rtl' ? 'Second line 2.1!' : 'السطر الثاني 2.1!';

    it(`keeps an unlabelled heading in an authored ${direction} quote`, async () => {
      await checkImportPasteAndReopen(direction, `<h2>${text}</h2>`, 'blockquote h2', [direction]);
    });

    for (const tag of ['ul', 'ol']) {
      it(`keeps unlabelled ${tag} items and nested lists in an authored ${direction} quote`, async () => {
        const markup = `<${tag}><li><p>${text}</p><ul><li><p>${text}</p></li></ul></li></${tag}>`;
        await checkImportPasteAndReopen(direction, markup,
          'blockquote :is(ul, ol, li, li p)', Array(6).fill(direction));
      });
    }

    it(`preserves an explicitly automatic heading in an authored ${direction} quote`, async () => {
      await checkImportPasteAndReopen(direction, `<h2 dir="auto">${text}</h2>`, 'blockquote h2', ['auto']);
    });

    it(`resets inherited ${direction} at an explicitly automatic nested list item`, async () => {
      const markup = `<ul><li><p>${text}</p></li><li dir="auto"><p>${text}</p><h2>${text}</h2><ol><li><p>${text}</p></li></ol></li></ul>`;
      await checkImportPasteAndReopen(direction, markup,
        'blockquote :is(ul, ol, li, li p, h2)',
        [direction, direction, direction, 'auto', 'auto', 'auto', 'auto', 'auto', 'auto']);
    });
  }
});
