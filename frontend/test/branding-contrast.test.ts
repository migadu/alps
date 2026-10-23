import { describe, expect, it } from 'vitest';
import { AlpsButton } from '../src/components/alps-button';
import { LoginPage } from '../src/pages/login-page';
import { THEME_BUNDLES } from '../src/store/themes';
import { rulesOf } from './helpers/styles';

/** WCAG relative luminance, using the colours the button's rules resolve to. */
function contrast(a: string, b: string): number {
  const luminance = (color: string) => {
    const hex = color.slice(1).replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3');
    const channels = color.startsWith('#')
      ? hex.match(/../g)!.map((channel) => parseInt(channel, 16))
      : color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    const [r, g, blue] = channels.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * blue!;
  };
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const buttons = [
  { name: 'primary', css: AlpsButton.styles.cssText, selector: ':host([variant="primary"]) button' },
  { name: 'sign-in', css: LoginPage.styles.cssText, selector: '.submit-btn' },
];

describe.each(['light', 'dark'])('Migadu %s buttons', (mode) => {
  for (const { name, css, selector } of buttons) {
    it.each([false, true])(`${name} text keeps 4.5:1 contrast (hover: %s)`, (hover) => {
      // Read the actual component rules: a theme-only colour check would miss
      // a button still painting itself in the sky-blue link accent. jsdom does
      // not apply shadow styles or :hover, so resolve these two rules directly.
      const rules = rulesOf(css);
      const base = rules.find((rule) => rule.selectorText === selector)!.style;
      const active = hover
        ? rules.find((rule) => rule.selectorText === `${selector}:hover:not(:disabled)`)!.style
        : base;
      const theme = THEME_BUNDLES[`migadu-${mode}`]!;
      const values: Record<string, string> = { ...theme.colors, ...theme.tokens };
      const resolve = (value: string): string => {
        const variable = /^var\(--([^,]+),\s*(.+)\)$/.exec(value);
        return variable ? values[variable[1]!] ?? variable[2]! : value;
      };
      const color = resolve(active.getPropertyValue('color') || base.getPropertyValue('color'));
      const background = resolve(active.getPropertyValue('background-color'));
      expect(color).toMatch(/^(?:#(?:fff|ffffff)|rgb\(255, 255, 255\))$/);
      expect(contrast(color, background), `${color} on ${background}`).toBeGreaterThanOrEqual(4.5);
    });
  }
});
