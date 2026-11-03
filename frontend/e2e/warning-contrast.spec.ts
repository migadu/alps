import { expect, login, resetSettings, test } from './fixtures';

test.afterEach(async ({ page }) => { await page.goto('about:blank'); await resetSettings(); });

test('warning text stays readable on the surfaces of every applied theme', async ({ page }) => {
  await login(page);
  for (const [family, light, dark] of [
    ['alps', '#ffffff', '#1f2937'], ['nord', '#eceff4', '#2e3440'],
    ['ocean', '#f8fafc', '#0f172a'], ['migadu', '#f5f9ff', '#0c1a3b'],
  ]) {
    for (const mode of ['light', 'dark']) {
      expect((await page.request.put('/settings', { data: { ui: { themeMode: mode, colorFamily: family } } })).ok()).toBe(true);
      await page.reload();
      await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--bg-primary'))).toBe(mode === 'light' ? light : dark);
      const ratios = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        const luminance = (color: string) => {
          const [r, g, b] = color.trim().slice(1).match(/../g)!.map(hex => {
            const value = parseInt(hex, 16) / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const warning = luminance(root.getPropertyValue('--warning'));
        return ['--bg-primary', '--bg-secondary', '--bg-tertiary'].map(surface => {
          const background = luminance(root.getPropertyValue(surface));
          return (Math.max(warning, background) + 0.05) / (Math.min(warning, background) + 0.05);
        });
      });
      for (const ratio of ratios) expect(ratio, `${family}-${mode}`).toBeGreaterThanOrEqual(4.5);
    }
  }
});
