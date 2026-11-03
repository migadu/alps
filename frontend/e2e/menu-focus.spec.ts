import { expect, login, test } from './fixtures';

for (const close of ['Escape', 'Enter', 'Space'] as const) {
  test(`a keyboard menu closed with ${close} returns focus to its trigger`, async ({ page }) => {
    await login(page);
    await page.evaluate(() => {
      const popup = document.createElement('alps-popup');
      popup.id = 'focus-menu';
      popup.innerHTML = '<button slot="trigger" id="focus-trigger">Menu</button><button id="focus-choice">Choose</button>';
      popup.querySelector('#focus-choice')!.addEventListener('click', () => (popup as HTMLElement & { close(): void }).close());
      const after = document.createElement('button');
      after.id = 'after-menu';
      after.textContent = 'After menu';
      document.body.append(popup, after);
    });
    const trigger = page.locator('#focus-trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#focus-choice')).toBeVisible();
    if (close !== 'Escape') await page.locator('#focus-choice').focus();
    await page.keyboard.press(close);
    await expect(page.locator('#focus-menu')).not.toHaveAttribute('open', '');
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#after-menu')).toBeFocused();
  });
}
