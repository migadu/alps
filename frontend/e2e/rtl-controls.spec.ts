import { expect, login, resetSettings, test } from './fixtures';

test.afterEach(async ({ page }) => {
  await page.goto('about:blank');
  await resetSettings();
  await page.request.delete('/session');
});

test('input icons keep their space when the value and interface have different directions', async ({ page }) => {
  await login(page);
  await page.goto('/#/settings/identity');
  await expect(page.locator('settings-window alps-input').first()).toBeVisible();
  const rows = await page.evaluate(async () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;left:400px;top:200px;width:300px;z-index:99999';
    const field = document.createElement('alps-input') as HTMLElement & {
      icon: string; value: string; updateComplete: Promise<unknown>;
    };
    field.icon = 'user';
    wrapper.append(field);
    document.body.append(wrapper);
    const result = [];
    for (const dir of ['ltr', 'rtl', 'ltr']) {
      wrapper.dir = dir;
      for (const value of ['Ada', 'مرحبا']) {
        field.value = value;
        await field.updateComplete;
        const input = field.shadowRoot!.querySelector('input')!;
        // The field animates its padding for 200ms after a direction change.
        // Inspect the settled layout, rather than the first transition frame.
        await new Promise(requestAnimationFrame);
        await Promise.all(input.getAnimations().map((animation) => animation.finished));
        const style = getComputedStyle(input);
        result.push({ dir, value, left: style.paddingLeft, right: style.paddingRight });
      }
    }
    wrapper.remove();
    return result;
  });
  for (const row of rows) {
    expect.soft(row.left, JSON.stringify(row)).toBe(row.dir === 'rtl' ? '12px' : '36px');
    expect.soft(row.right, JSON.stringify(row)).toBe(row.dir === 'rtl' ? '36px' : '12px');
  }
});

test('popup arrows stay beside their trigger after logical anchors resolve to screen sides', async ({ page }) => {
  await login(page);
  const rows = await page.evaluate(async () => {
    await customElements.whenDefined('alps-popup');
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;left:500px;top:350px;z-index:99999';
    document.body.append(wrapper);
    const rows = [];
    for (const dir of ['ltr', 'rtl']) {
      wrapper.dir = dir;
      for (const [position, align] of [['bottom', 'start'], ['top', 'end'], ['inline-start', 'top'], ['inline-end', 'top']]) {
        const popup = document.createElement('alps-popup') as HTMLElement & {
          position: string; align: string; openState: boolean; updateComplete: Promise<unknown>;
        };
        popup.position = position!;
        popup.align = align!;
        popup.innerHTML = '<button slot="trigger" style="width:60px;height:30px">Menu</button><div style="width:200px;height:80px">Contents</div>';
        wrapper.append(popup);
        await popup.updateComplete;
        popup.openState = true;
        await popup.updateComplete;
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        const content = popup.shadowRoot!.querySelector('.popup-content') as HTMLElement;
        const arrow = getComputedStyle(content, '::before');
        const trigger = popup.shadowRoot!.querySelector('.trigger')!.getBoundingClientRect();
        const rect = content.getBoundingClientRect();
        const horizontal = content.classList.contains('position-left') || content.classList.contains('position-right');
        const side = content.classList.contains('position-left') ? 'right' : 'left';
        rows.push({ dir, position, horizontal,
          arrowEdge: horizontal ? arrow.getPropertyValue(side) : '',
          distance: horizontal ? 0 : Math.abs(rect.left + parseFloat(arrow.left) + parseFloat(arrow.borderLeftWidth) - (trigger.left + trigger.width / 2)),
        });
        popup.remove();
      }
    }
    wrapper.remove();
    return rows;
  });
  for (const row of rows) {
    if (row.horizontal) expect.soft(row.arrowEdge, JSON.stringify(row)).toBe('-6px');
    else expect.soft(row.distance, JSON.stringify(row)).toBeLessThanOrEqual(2);
  }
});
