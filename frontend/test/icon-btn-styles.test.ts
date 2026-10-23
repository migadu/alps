/**
 * What an icon button is styled with (source pin).
 *
 * alps-icon-btn takes its padding from --btn-icon-padding and its icon's size
 * from --btn-icon-size. The sidebar's collapse button, the thread card's
 * buttons, the folder carets and menus, the new-folder and new-category
 * buttons and several in the calendar were given --btn-padding, which only
 * alps-button reads, and --icon-size, which nothing reads. Those declarations
 * did nothing: every one of those buttons was drawn at the defaults, while the
 * source said otherwise.
 *
 * So every custom property set on an alps-icon-btn, by its own style attribute
 * or by a rule aimed at it, is one its styles read. alps-button and
 * alps-create-button read --btn-padding, and what is set on them is not
 * looked at here.
 */
import { describe, expect, it } from 'vitest';
import { readSources } from './helpers/sources';

const sources = readSources();

/** The custom properties alps-icon-btn's own styles read. */
const reads = new Set(
  [...sources['src/components/alps-icon-btn.ts'].matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]),
);

/** The custom properties a list of declarations sets. */
const setIn = (declarations: string): string[] =>
  [...declarations.matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:/g)].map((m) => m[1]);

/**
 * Each `<alps-icon-btn …>` opening tag in a source. Read up to the `>` that
 * ends it rather than to the first `>`, which is as often the arrow of an
 * `@click=${() => …}` before the style attribute.
 */
function iconButtonTags(source: string): string[] {
  const tags: string[] = [];
  for (const m of source.matchAll(/<alps-icon-btn\b/g)) {
    let depth = 0;
    let quote = '';
    let i = m.index! + m[0].length;
    for (; i < source.length; i++) {
      const c = source[i];
      if (quote) {
        if (c === quote) quote = '';
      } else if (c === '$' && source[i + 1] === '{') {
        depth++;
        i++;
      } else if (depth > 0 && c === '{') {
        depth++;
      } else if (depth > 0 && c === '}') {
        depth--;
      } else if (depth === 0 && (c === '"' || c === "'")) {
        quote = c;
      } else if (depth === 0 && c === '>') {
        break;
      }
    }
    tags.push(source.slice(m.index!, i + 1));
  }
  return tags;
}

/** Every custom property a source sets on an icon button, as `property (where)`. */
function setOnIconButtons(source: string): string[] {
  const found: string[] = [];
  const classes = new Set<string>();
  for (const tag of iconButtonTags(source)) {
    const style = /\sstyle="([^"]*)"/.exec(tag)?.[1] ?? '';
    for (const property of setIn(style)) found.push(`${property} (style attribute)`);
    const names = /\sclass="([^"]*)"/.exec(tag)?.[1] ?? '';
    for (const name of names.split(/\s+/)) if (/^[\w-]+$/.test(name)) classes.add(name);
  }
  // The rules in the component's stylesheets whose subject is an icon button:
  // the element itself, or a class put on one in this file.
  for (const sheet of source.matchAll(/css`([\s\S]*?)`/g)) {
    const text = sheet[1].replace(/\/\*[\s\S]*?\*\//g, '');
    for (const rule of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const aimed = rule[1].split(',').some((selector) => {
        const subject = selector.trim().split(/[\s>+~]+/).pop() ?? '';
        return /^alps-icon-btn(?![\w-])/.test(subject)
          || [...classes].some((name) => new RegExp(`\\.${name}(?![\\w-])`).test(subject));
      });
      if (!aimed) continue;
      for (const property of setIn(rule[2])) found.push(`${property} (${rule[1].trim()})`);
    }
  }
  return found;
}

describe('icon buttons are styled with what alps-icon-btn reads', () => {
  it('reads its padding and its icon size from the --btn-icon-* properties', () => {
    expect(reads).toContain('--btn-icon-padding');
    expect(reads).toContain('--btn-icon-size');
    expect(reads).not.toContain('--btn-padding');
    expect(reads).not.toContain('--icon-size');
  });

  it('finds the icon buttons it checks, and what is set on them', () => {
    const toast = setOnIconButtons(sources['src/components/toast-notification.ts']);
    expect(toast).toContain('--btn-icon-size (style attribute)');
    expect(Object.values(sources).flatMap(iconButtonTags).length).toBeGreaterThan(40);
  });

  it('sets no property on one that it does not read', () => {
    const unread = Object.entries(sources).flatMap(([path, source]) =>
      setOnIconButtons(source)
        .filter((entry) => !reads.has(entry.split(' ')[0]))
        .map((entry) => `${path}: ${entry}`),
    );
    expect(unread).toEqual([]);
  });
});
