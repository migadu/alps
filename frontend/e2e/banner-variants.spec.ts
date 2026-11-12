import { expect, login, test } from './fixtures';

for (const [mode, background, text] of [
  ['light', '#ffffff', '#111827'],
  ['dark', '#111827', '#f9fafb'],
] as const) {
  test(`error banners use a distinct surface and border in ${mode} mode`, async ({ page }) => {
    await login(page);
    const colors = await page.evaluate(async ({ background, text }) => {
      await customElements.whenDefined('alps-banner');
      const values: Record<string, { background: string; border: string; width: string }> = {};
      for (const variant of ['info', 'warning', 'error']) {
        const banner = document.createElement('alps-banner') as HTMLElement & { updateComplete: Promise<unknown> };
        banner.setAttribute('variant', variant);
        banner.style.setProperty('--bg-primary', background);
        banner.style.setProperty('--text-primary', text);
        banner.textContent = `${variant}: the request could not be completed`;
        document.body.appendChild(banner);
        await banner.updateComplete;
        const style = getComputedStyle(banner.shadowRoot!.querySelector('.banner')!);
        values[variant] = { background: style.backgroundColor, border: style.borderInlineStartColor, width: style.borderInlineStartWidth };
        banner.remove();
      }
      return values;
    }, { background, text });
    expect(colors.error.background).not.toBe(colors.info.background);
    expect(colors.error.border).not.toBe(colors.warning.border);
    expect(colors.error.width).toBe('3px');
  });
}

test('error banners honor semantic surface, border and text tokens', async ({ page }) => {
  await login(page);
  const colors = await page.evaluate(async () => {
    await customElements.whenDefined('alps-banner');
    const banner = document.createElement('alps-banner') as HTMLElement & { updateComplete: Promise<unknown> };
    banner.setAttribute('variant', 'error');
    banner.style.cssText = '--error-surface: rgb(255, 230, 230); --error-border: rgb(153, 27, 27); --error-text: rgb(127, 29, 29)';
    banner.textContent = 'This operation failed.';
    document.body.appendChild(banner);
    await banner.updateComplete;
    const style = getComputedStyle(banner.shadowRoot!.querySelector('.banner')!);
    const colors = { background: style.backgroundColor, border: style.borderInlineStartColor, text: style.color };
    banner.remove();
    return colors;
  });
  expect(colors).toEqual({ background: 'rgb(255, 230, 230)', border: 'rgb(153, 27, 27)', text: 'rgb(127, 29, 29)' });
});
