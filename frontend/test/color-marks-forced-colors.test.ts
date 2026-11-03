/**
 * A colour mark survives forced colors.
 *
 * Several marks are a small shape drawn only by its background, in a colour
 * that is what the mark says: a tag's in the reader's tag menu, a task list's
 * in the Tasks sidebar and on each of its tasks, an event's calendar in the
 * list view and the event preview, and a calendar's on its checkbox, the
 * legend for its events. Forced colors (Windows high contrast) repaint every
 * background as the page, so each vanished there, and with it the one thing
 * it says. `forced-color-adjust: none` keeps the colour on the mark; it is a
 * swatch, and its colour is its content.
 *
 * Read from the sources: an element whose inline style paints it in a colour
 * from data must be drawn by a rule that keeps it, unless it is named by its
 * own text (listed below), where the colour only adds to the name.
 */
import { describe, expect, it } from 'vitest';
import { readSources } from './helpers/sources';

const SOURCES = readSources();

/** Every innermost rule in a source's css`` literals: [selectors, body]. */
function rules(src: string): [string[], string][] {
  const css = [...src.matchAll(/css`([\s\S]*?)`/g)]
    .map((m) => m[1].replace(/\$\{[^}]*\}/g, '0'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].split(',').map((s) => s.trim().replace(/\s+/g, ' ')), m[2]]);
}

/**
 * Painted in a colour from data, and named by their own text: a tag's pill,
 * and an event's chip, whose title is the chip. Keeping a whole chip's
 * colours would take the high contrast away from its text.
 */
const NAMED_BY_TEXT = new Set([
  'src/components/alps-tag.ts: tag-pill',
  'plugins/caldav/frontend/calendar-month-view.ts: event-chip',
  'plugins/caldav/frontend/calendar-time-grid.ts: event-chip',
  'plugins/caldav/frontend/calendar-time-grid.ts: time-event',
]);

/** Each element whose inline style sets its background, or a colour its rules
 * paint with, from data: its source and its first class. */
const painted = Object.entries(SOURCES).flatMap(([path, src]) =>
  [...src.matchAll(/style=(?:"[^"]*|\$\{[^\n]*?)(?:background(?:-color)?|--[\w-]*color)\s*:\s*\$\{/g)].map((m) => {
    const tag = src.slice(src.lastIndexOf('<', m.index!), m.index!);
    const cls = /class="\s*([\w-]+)/.exec(tag)?.[1] ?? '';
    return { path, cls, where: `${path}: ${cls}` };
  }),
);

describe('colour marks in forced colors', () => {
  it('found them, so an empty list cannot pass', () => {
    expect(painted.length).toBeGreaterThanOrEqual(10);
    expect(painted.every((p) => p.cls), painted.map((p) => p.where).join('\n')).toBe(true);
  });

  it('keep their colour', () => {
    const repainted = painted
      .filter(({ where }) => !NAMED_BY_TEXT.has(where))
      .filter(({ path, cls }) => !rules(SOURCES[path]).some(([selectors, body]) =>
        selectors.some((s) => s.endsWith(`.${cls}`)) && /forced-color-adjust:\s*none/.test(body)))
      .map(({ where }) => where);
    expect(repainted).toEqual([]);
  });

  it('the exceptions are still there to be excepted', () => {
    const found = new Set(painted.map((p) => p.where));
    for (const where of NAMED_BY_TEXT) expect(found, where).toContain(where);
  });

  it('a day with events keeps its mark in the mini calendar', () => {
    // Not a colour but a presence, drawn by a background all the same: it
    // takes the text's system colour there.
    const css = SOURCES['plugins/caldav/frontend/calendar-mini-month.ts'];
    expect(css).toMatch(/@media \(forced-colors: active\) \{\s*\.mini-day\.has-event \.day-num::after[^{]*\{[^}]*background-color: CanvasText/);
  });
});
