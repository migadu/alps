/**
 * The pages that fill the window are not scroll containers.
 *
 * A host with `overflow: hidden` still is one. The mail page's content runs a
 * pixel past its host, and a scrollIntoView() or focus() on anything at that
 * edge (opening a message, moving down the list with the arrows) scrolled the
 * whole page by it, cutting off the top of the header until the next
 * navigation. `overflow: clip` cuts the same and cannot be scrolled; `hidden`
 * stays before it for a browser that does not know `clip`.
 */
import { describe, expect, it } from 'vitest';
import { readSources } from './helpers/sources';

const sources = readSources();

/** The declarations of the first `:host` rule in a file's styles. */
function hostRule(path: string): string {
  const source = sources[path];
  expect(source, path).toBeDefined();
  const rule = /:host\s*\{([^}]*)\}/.exec(source);
  expect(rule, `${path} has a :host rule`).not.toBeNull();
  return rule![1];
}

describe('page hosts', () => {
  it.each([
    'src/pages/mailbox-page.ts',
    'plugins/carddav/frontend/contacts-page.ts',
  ])('%s clips its overflow rather than hiding it', (path) => {
    const rule = hostRule(path).replace(/\/\*[\s\S]*?\*\//g, '');
    const hidden = rule.indexOf('overflow: hidden;');
    const clip = rule.indexOf('overflow: clip;');
    expect(clip).toBeGreaterThan(-1);
    expect(hidden === -1 || hidden < clip).toBe(true);
  });
});
