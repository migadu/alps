/**
 * A sheet the CSS parser cannot read goes through the patterns that stand in
 * for it, and has to come out as safe and as plain as one it can read.
 */
import { describe, expect, it, vi } from 'vitest';

// Every sheet unreadable: the parser throws, as it can on CSS it does not know.
vi.mock('css', async (importOriginal) => ({
  ...(await importOriginal<typeof import('css')>()),
  parse: () => { throw new Error('unreadable'); },
}));

import { sanitizeMessageHTML } from '../src/utils/html-sanitizer';

const sheet = (html: string) => {
  const out = sanitizeMessageHTML(html, { mailbox: 'INBOX', messageUid: '42', allowRemoteResources: false });
  return new DOMParser().parseFromString(out, 'text/html').querySelectorAll('style')[1]?.textContent ?? '';
};

describe('a sheet the parser cannot read', () => {
  it('loses the sender\'s colour schemes, and keeps the rest', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const css = sheet('<style>:root { color-scheme: light dark !important } p { colo\\72-scheme: dark; color: red }' +
        '.a { background: red; color-scheme: dark }</style>');
      expect(warn).toHaveBeenCalled();
      expect(css).not.toMatch(/scheme/);
      expect(css).toMatch(/p \{\s*color: red\s*\}/);
      expect(css).toMatch(/\.a \{ background: red;\s*\}/);
    } finally {
      warn.mockRestore();
    }
  });
});
