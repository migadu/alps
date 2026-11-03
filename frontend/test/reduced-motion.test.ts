/**
 * Motion the user asked not to see.
 *
 * `prefers-reduced-motion` is an operating system setting, and for some people
 * a medical one. Nothing in alps consulted it: not the forty-odd components
 * that slide, fade and resize, not the composer moving itself, and not the
 * smooth scroll that brings the opened message into view.
 *
 * Two halves, because one cannot reach both. A rule in index.css reaches the
 * document but not a component's styles, which live in a shadow root its
 * selectors do not enter; so every component that moves composes motionStyles.
 * The scripted scrolls go through scrollOptions.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CSSResult } from 'lit';
import { readSources } from './helpers/sources';
import { motionStyles, prefersReducedMotion, scrollOptions } from '../src/utils/motion';
import '../src/components/alps-icon-btn';
import '../src/components/toast-notification';
import '../../plugins/carddav/frontend/contacts-page';

const SOURCES = readSources();
const SHEET = SOURCES['src/utils/motion.ts'];
const INDEX_CSS = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../src/index.css'), 'utf8');

const MOVES = /\b(?:transition|animation)\s*:/;

/** Answers the reduced-motion query, and only that one. */
function withReducedMotion(reduce: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: /prefers-reduced-motion/.test(query) ? reduce : false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('scrolling', () => {
  it('reads the setting rather than assuming', () => {
    withReducedMotion(true);
    expect(prefersReducedMotion()).toBe(true);
    withReducedMotion(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it('drops the smooth scroll when asked', () => {
    withReducedMotion(true);
    expect(scrollOptions({ behavior: 'smooth', block: 'center' })).toEqual({ behavior: 'auto', block: 'center' });
  });

  it('keeps it when not', () => {
    withReducedMotion(false);
    expect(scrollOptions({ behavior: 'smooth', block: 'center' })).toEqual({ behavior: 'smooth', block: 'center' });
  });

  it('leaves a scroll that was never smooth as it was', () => {
    withReducedMotion(true);
    const plain: ScrollIntoViewOptions = { block: 'nearest' };
    expect(scrollOptions(plain)).toBe(plain);
  });

  it('is never smooth outside the helper', () => {
    const smooth: string[] = [];
    for (const [path, src] of Object.entries(SOURCES)) {
      for (const m of src.matchAll(/scrollIntoView\(\s*\{[^}]*behavior:\s*'smooth'/g)) smooth.push(`${path}: ${m[0]}`);
      if (/scroll-behavior:\s*smooth/.test(src)) smooth.push(`${path}: scroll-behavior: smooth`);
    }
    expect(smooth).toEqual([]);
  });
});

describe('the document', () => {
  it('carries the rule the shadow roots cannot get', () => {
    expect(INDEX_CSS).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(INDEX_CSS).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });

  it('keeps the account-switch spinner, drawn in the document, turning', () => {
    // An inline animation loses to the !important reset unless it is exempt.
    const overlay = SOURCES['src/components/user-profile-menu.ts'];
    expect(overlay).toMatch(/class="spinner" style="[^"]*animation:[^"]*infinite/);
    expect(INDEX_CSS).toMatch(/\.spinner,[\s\S]{0,200}animation-iteration-count:\s*infinite/);
  });
});

/** Shared sheets that move, by the name they are exported under. */
const MOVING_SHEETS = Object.values(SOURCES).flatMap((src) =>
  [...src.matchAll(/export const (\w+) = css`([\s\S]*?)`/g)].filter((m) => MOVES.test(m[2])).map((m) => m[1]),
);

/** The `static styles` of a source, up to the end of its list or its sheet. */
function stylesOf(src: string): string | null {
  const at = /static styles\s*=\s*/.exec(src);
  if (!at) return null;
  const rest = src.slice(at.index + at[0].length);
  if (rest.startsWith('css`')) return 'css`';
  return rest.slice(0, rest.search(/css`|\];/) + 4);
}

/** Every component that moves: in its own source, or by a moving sheet it composes. */
const moving = Object.entries(SOURCES).filter(([, src]) => {
  const styles = stylesOf(src);
  if (styles === null) return false;
  return (src.includes('css`') && MOVES.test(src)) || MOVING_SHEETS.some((name) => new RegExp(`\\b${name}\\b`).test(styles));
});

describe('the components', () => {
  it('found the moving ones, so an empty list cannot pass', () => {
    expect(MOVING_SHEETS).toEqual(expect.arrayContaining(['modalButtonStyles', 'popupStyles', 'sidebarLayoutStyles']));
    expect(moving.length).toBeGreaterThan(40);
  });

  it('every one composes the shared sheet, first', () => {
    const missing = moving.filter(([, src]) => !/^\[\s*motionStyles\s*,/.test(stylesOf(src)!)).map(([path]) => path);
    expect(missing).toEqual([]);
  });

  it('reaches the host, which moves itself in several of them', () => {
    // `*` in a shadow root does not match its host, and app-root, which draws
    // the composer (it moves and resizes itself) and the toasts (they slide),
    // has no sheet of its own to reach them with.
    expect(SHEET).toMatch(/:host,\s*\*,/);
  });

  it('is in the styles lit adopts, nested lists included', () => {
    // contacts-page composes other pages' whole lists; lit flattens them.
    for (const tag of ['alps-icon-btn', 'alps-toast', 'contacts-page']) {
      const adopted = (customElements.get(tag) as unknown as { elementStyles: CSSResult[] }).elementStyles;
      expect(adopted, tag).toContain(motionStyles);
    }
  });
});

describe('a spinner', () => {
  /** Every infinite animation: where it is, what it is on, and its period. */
  const spinners = Object.entries(SOURCES).flatMap(([path, src]) => {
    if (path === 'src/utils/motion.ts') return [];
    return [...src.matchAll(/animation:\s*[\w-]+\s+([\d.]+)s[^;"]*infinite/g)].map((m) => {
      const before = src.slice(Math.max(0, m.index! - 400), m.index!);
      // Inside a style attribute, the element's own tag; else the rule's selector.
      const tag = /<[^<>]*style="[^"]*$/.exec(before)?.[0];
      const selector = [...before.matchAll(/([.#:][^{};]*)\{[^{}]*$/g)].pop()?.[1].trim() ?? '';
      return { path, seconds: Number(m[1]), tag, selector };
    });
  });

  it('found them all', () => {
    // Nine in stylesheets, and one inline on the account-switch overlay.
    expect(spinners.filter((s) => !s.tag).length).toBeGreaterThanOrEqual(9);
    expect(spinners.filter((s) => s.tag).length).toBeGreaterThanOrEqual(1);
  });

  it('keeps turning, because a stopped one reads as a hung page', () => {
    // Matched against the element the animation is ON. animation-* is not
    // inherited, so an exempt container leaves its moving child on the reset
    // unless the exemption names its descendants too.
    const descendants = /\.spinner \*/.test(SHEET) && /\.spinning \*/.test(SHEET);
    const frozen = spinners
      .filter(({ tag, selector }) => {
        if (tag) return !/class="[^"]*\b(?:spinner|spinning)\b|data-motion="essential"/.test(tag);
        const on = selector.split(/[\s>]+/).pop() ?? '';
        if (/spinner|spinning|data-motion/.test(on)) return false;
        return !(descendants && /\.spinner\b|\.spinning\b|data-motion/.test(selector));
      })
      .map(({ path, tag, selector }) => `${path}: ${tag ?? selector}`);
    expect(frozen).toEqual([]);
    expect(SHEET).toMatch(/\.spinner,[\s\S]{0,200}animation-iteration-count:\s*infinite/);
  });

  it('turns no faster than the slowest one does without the setting', () => {
    const exempt = Number(/\.spinner,[\s\S]*?animation-duration:\s*([\d.]+)s/.exec(SHEET)?.[1]);
    const document = Number(/\.spinner,[\s\S]*?animation-duration:\s*([\d.]+)s/.exec(INDEX_CSS)?.[1]);
    const slowest = Math.max(...spinners.map((s) => s.seconds));
    expect(exempt).toBeGreaterThanOrEqual(slowest);
    expect(document).toBe(exempt);
  });

  it('is slowed, and a transition shortened rather than removed', () => {
    // A transition that never runs never fires transitionend.
    expect(SHEET).toMatch(/transition-duration:\s*0\.01ms/);
    expect(SHEET).not.toMatch(/transition:\s*none/);
  });
});
