import { expect, login, test, toast } from './fixtures';

for (const layer of ['menu', 'modal', 'nested modal']) {
  test(`a toast above a ${layer} can be pressed without closing it`, async ({ page }) => {
    await login(page);
    await page.evaluate(kind => {
      const root = document.querySelector('app-root')!.shadowRoot!;
      const popup = document.createElement('alps-popup');
      popup.id = 'toast-menu';
      popup.innerHTML = '<button slot="trigger">Test menu</button><button>Choice</button>';
      root.append(popup);
      if (kind !== 'modal') (popup as HTMLElement & { open(): void }).open();
      if (kind !== 'menu') {
        const modal = document.createElement('ui-modal');
        modal.id = 'toast-dialog';
        modal.setAttribute('heading', 'Test dialog');
        modal.textContent = 'Dialog content';
        (kind === 'nested modal' ? popup : root).append(modal);
      }
    }, layer);
    const top = layer === 'menu' ? page.locator('#toast-menu dialog') : page.locator('#toast-dialog dialog');
    await expect(top).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('show-toast', { detail: {
      message: 'Take this back', actionLabel: 'Undo', duration: 10000,
      actionFn: () => { (window as any).__toastUndo = true; },
    } })));
    await toast(page, 'Take this back').getByRole('button', { name: 'Undo', exact: true }).click();
    expect(await page.evaluate(() => (window as any).__toastUndo)).toBe(true);
    await expect(top).toBeVisible();
  });
}
