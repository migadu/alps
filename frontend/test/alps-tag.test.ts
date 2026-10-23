/**
 * A tag's name, written on its colour.
 *
 * The pill drew every name in white, at 90% opacity, on colours as light as
 * the Personal green: 2.3:1 at best, where text this small (10px) needs 4.5:1
 * (WCAG 1.4.3). None of the predefined colours reached it, nor did 188 of the
 * 360 hues a custom tag can have.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/alps-tag';
import { getTagColor } from '../src/utils/flags';
import { cleanup, mount, shadow, update } from './helpers/dom';
import { ruleMatches, rulesOf } from './helpers/styles';

afterEach(cleanup);

/** The sRGB channels, 0–255, of a colour written as hex, rgb() or hsl(). */
function channels(css: string): [number, number, number] {
  const hex = /^#([0-9a-f]{6})$/i.exec(css.trim());
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)) as [number, number, number];
  const short = /^#([0-9a-f]{3})$/i.exec(css.trim());
  if (short) return [0, 1, 2].map((i) => parseInt(short[1][i] + short[1][i], 16)) as [number, number, number];
  const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(css);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  const hsl = /^hsla?\(\s*([\d.]+)(?:deg)?[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i.exec(css);
  if (!hsl) throw new Error(`not a colour this test reads: ${css}`);
  const [h, s, l] = [Number(hsl[1]), Number(hsl[2]) / 100, Number(hsl[3]) / 100];
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
}

/** WCAG 2.x relative luminance and contrast ratio. */
function contrast(a: string, b: string): number {
  const luminance = (css: string) => {
    const [r, g, bl] = channels(css).map((c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** The rules of a tag's shadow root, parsed once: they do not change. */
const sheets = new WeakMap<HTMLElement, CSSStyleRule[]>();
function shadowRules(tag: HTMLElement): CSSStyleRule[] {
  let rules = sheets.get(tag);
  if (!rules) {
    rules = Array.from(tag.shadowRoot!.querySelectorAll('style')).flatMap((style) => rulesOf(style.textContent ?? ''));
    sheets.set(tag, rules);
  }
  return rules;
}

/**
 * How the pill is painted: its own style first, then the rules of its shadow
 * root that reach it, read by hand, as jsdom leaves a shadow root's rules out
 * of getComputedStyle.
 */
function paint(tag: HTMLElement) {
  const pill = shadow(tag, '.tag-pill');
  const rules = shadowRules(tag).filter((rule) => ruleMatches(pill, rule));
  const ruled = (property: string) => rules.map((rule) => rule.style.getPropertyValue(property)).filter(Boolean).at(-1) ?? '';
  return {
    text: pill.style.color || ruled('color'),
    background: pill.style.backgroundColor,
    opacity: Number(pill.style.opacity || ruled('opacity') || 1),
  };
}

describe('a tag pill', () => {
  it('writes the name at 4.5:1 or better on every predefined colour, fully opaque', async () => {
    const tag = await mount('alps-tag', { name: 'Tag' });
    for (const flag of ['$label1', '$label2', '$label3', '$label4', '$label5']) {
      await update(tag, { name: flag, color: getTagColor(flag) });
      const { text, background, opacity } = paint(tag);
      expect(contrast(text, background), `${flag}: ${text} on ${background}`).toBeGreaterThanOrEqual(4.5);
      // Faded, the pill takes on the page behind it, text and colour alike.
      expect(opacity, flag).toBe(1);
    }
  });

  it('writes the name at 4.5:1 or better on every hue a custom tag can have', async () => {
    // A custom tag's colour is its hue, hashed from its name, at 70% and 45%.
    expect(getTagColor('Invoices')).toMatch(/^hsl\(\d+, 70%, 45%\)$/);
    const tag = await mount('alps-tag', { name: 'Tag' });
    for (let hue = 0; hue < 360; hue++) {
      await update(tag, { color: `hsl(${hue}, 70%, 45%)` });
      const { text, background } = paint(tag);
      expect(contrast(text, background), `hue ${hue}: ${text} on ${background}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
