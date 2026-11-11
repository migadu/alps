/**
 * Scrollbars in the theme's colours, everywhere and visibly.
 *
 * They were styled only through ::-webkit-scrollbar in the document's sheet,
 * which matches no element inside a shadow root, so every scroll area in a
 * component kept the browser's default, and Firefox, which has no such
 * pseudo-element, never had the theme's at all. The light thumb (#d1d5db) was
 * about 1.5:1 against white, and Migadu's about the same. A thumb needs 3:1
 * against what is behind it to show where the user has scrolled to (WCAG
 * 1.4.11). Browser test: e2e/scrollbars.spec.ts.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEME_BUNDLES } from '../src/store/themes';

const FRONTEND = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sheet = readFileSync(resolve(FRONTEND, 'src/index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** WCAG contrast between two #rrggbb colours. */
function contrast(a: string, b: string): number {
  const luminance = (color: string) => {
    const [r, g, blue] = color.slice(1).match(/../g)!.map((channel) => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * blue!;
  };
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** The thumb a rule gives when the theme sets none. */
const fallback = (selector: string) =>
  new RegExp(`${selector}\\s*\\{\\s*scrollbar-color:\\s*var\\(--scrollbar-thumb,\\s*(#[0-9a-f]{6})\\)\\s+transparent;\\s*\\}`, 'i').exec(sheet)?.[1];
const lightThumb = fallback(':root');
const darkThumb = fallback('\\.theme-dark');

describe('the scrollbar', () => {
  it('is coloured on the root and on the dark theme\'s body, which every shadow root inherits', () => {
    expect(lightThumb).toBeDefined();
    expect(darkThumb).toBeDefined();
  });

  it('keeps ::-webkit-scrollbar for browsers without scrollbar-color only', () => {
    const outside = sheet.replace(/@supports not \(scrollbar-color: auto\)\s*\{[\s\S]*?\n\}/, '');
    expect(sheet).toContain('@supports not (scrollbar-color: auto)');
    expect(outside).not.toContain('::-webkit-scrollbar');
  });
});

describe.each(Object.values(THEME_BUNDLES))('$id scrollbar thumb', (theme) => {
  it.each(['bg-primary', 'bg-secondary'] as const)('shows at 3:1 on %s', (surface) => {
    const thumb = theme.tokens?.['scrollbar-thumb'] ?? (theme.isDark ? darkThumb : lightThumb)!;
    expect(contrast(thumb, theme.colors[surface])).toBeGreaterThanOrEqual(3);
  });
});
