/**
 * A message body as plain text, and as a one-line preview.
 *
 * Both run over what a stranger sent, on paths that render for every row, so
 * neither may throw or leak markup — and the preview has to produce SOMETHING,
 * because a blank line is indistinguishable from a rendering failure.
 */
import { describe, expect, it, vi } from 'vitest';

// The module bridges iframe activity into auto-logout; not under test here.
vi.mock('../src/services/auto-logout', () => ({ autoLogoutService: { trackIframe: () => {} } }));

import { extractSnippet, htmlToPlainText } from '../src/utils/reader-utils';

const STORED = "the server's own snippet";
const PROMPT = 'Click to expand';
const snippet = (content: string, mimeType = 'text/plain') => extractSnippet(content, mimeType, STORED, PROMPT);

describe('htmlToPlainText', () => {
  it('returns nothing for nothing', () => {
    expect(htmlToPlainText('')).toBe('');
  });

  it('keeps the text and drops the tags', () => {
    expect(htmlToPlainText('<p>Hello <b>there</b></p>')).toBe('Hello there');
  });

  it('turns line breaks and block elements into new lines', () => {
    expect(htmlToPlainText('one<br>two')).toBe('one\ntwo');
    expect(htmlToPlainText('<p>one</p><p>two</p>')).toBe('one\ntwo');
  });

  it('keeps inline elements on one line', () => {
    expect(htmlToPlainText('<span>one</span><span>two</span>')).toBe('onetwo');
  });

  it('flattens a table row by row', () => {
    const lines = htmlToPlainText('<table><tr><td>a</td></tr><tr><td>b</td></tr></table>').split('\n').filter(Boolean);
    expect(lines).toEqual(['a', 'b']);
  });

  it('drops the head, scripts and styles', () => {
    expect(htmlToPlainText('<html><head><title>Ignore</title></head><body>Body</body></html>')).toBe('Body');
    expect(htmlToPlainText('<style>.x{color:red}</style><script>alert(1)</script><p>Body</p>')).toBe('Body');
  });

  it('collapses the blank lines nested blocks produce', () => {
    expect(htmlToPlainText('<div><div><div><p>Hello</p></div></div></div>')).toBe('Hello');
    expect(htmlToPlainText('<p>one</p><div></div><div></div><div></div><p>two</p>')).not.toMatch(/\n{3,}/);
  });

  it('survives malformed markup', () => {
    expect(htmlToPlainText('<p>unclosed <b>bold')).toContain('unclosed bold');
  });

  it('parses without running anything', () => {
    // A DOMParser document is inert; innerHTML on a live node would fire onerror.
    const hook = vi.fn();
    (window as any).__readerUtilsHook = hook;
    htmlToPlainText('<img src=x onerror="window.__readerUtilsHook()">');
    expect(hook).not.toHaveBeenCalled();
    delete (window as any).__readerUtilsHook;
  });
});

describe('extractSnippet', () => {
  describe('choosing a source', () => {
    it('uses the stored snippet before the body has arrived', () => {
      expect(snippet('')).toBe(STORED);
    });

    it('uses the prompt when there is neither body nor stored snippet', () => {
      expect(extractSnippet('', 'text/plain', '', PROMPT)).toBe(PROMPT);
      expect(extractSnippet('<img src="x.png">', 'text/html', '', PROMPT)).toBe(PROMPT);
    });

    it('prefers the body once it has arrived', () => {
      expect(snippet('The actual message text')).toBe('The actual message text');
    });

    it('falls back, tidied, when the body holds no readable text', () => {
      expect(extractSnippet('<img src="x.png">', 'text/html', 'line one\nline two', PROMPT)).toBe('line one line two');
    });
  });

  describe('plain text', () => {
    it('flattens line breaks and runs of whitespace', () => {
      expect(snippet('first line\nsecond line')).toBe('first line second line');
      expect(snippet('first\r\nsecond')).toBe('first second');
      expect(snippet('lots     of \t space')).toBe('lots of space');
    });

    it('keeps comparison signs that are not markup', () => {
      expect(snippet('if a < b and c > d')).toBe('if a < b and c > d');
    });
  });

  describe('HTML', () => {
    it('shows the text, not the markup', () => {
      expect(snippet('<p>Hello <b>there</b></p>', 'text/html')).toBe('Hello there');
    });

    it('recognises HTML under the wrong type, and a fragment with no leading tag', () => {
      expect(snippet('<p>Hello</p>', 'text/plain')).toBe('Hello');
      expect(snippet('Hello <b>there</b>', 'text/plain')).toBe('Hello there');
    });

    it('drops styles and scripts', () => {
      expect(snippet('<style>.x{color:red}</style><p>Body</p>', 'text/html')).toBe('Body');
      expect(snippet('<script>var x=1</script><p>Body</p>', 'text/html')).toBe('Body');
    });

    it('keeps words apart across blocks, line breaks and cells', () => {
      expect(snippet('<p>one</p><p>two</p>', 'text/html')).toBe('one two');
      expect(snippet('one<br>two', 'text/html')).toBe('one two');
      expect(snippet('<table><tr><td>one</td><td>two</td></tr></table>', 'text/html')).toBe('one two');
    });

    it('never leaks a tag', () => {
      expect(snippet('<div onclick="x()"><p>Hello</p></div>', 'text/html')).not.toMatch(/[<>]/);
    });
  });

  describe('length', () => {
    it('truncates past a hundred characters and says so', () => {
      const preview = snippet('x'.repeat(500));
      expect(preview).toHaveLength(103);
      expect(preview.endsWith('...')).toBe(true);
    });

    it('does not add the ellipsis at exactly the limit', () => {
      expect(snippet('x'.repeat(100))).toBe('x'.repeat(100));
    });

    it('measures the text, not the markup around it', () => {
      expect(snippet(`<div class="${'c'.repeat(300)}"><p>Hello</p></div>`, 'text/html')).toBe('Hello');
    });
  });
});
