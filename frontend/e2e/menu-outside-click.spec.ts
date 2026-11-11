import { expect, login, test } from './fixtures';

// A menu is a popover: a click outside it closes it and still lands. It was a
// modal dialog over the whole window, which took that click for itself, so
// reaching anything else with a menu open took two clicks.

const accountMenu = (page: import('@playwright/test').Page) => page.locator('user-profile-menu alps-popup');
const accountButton = (page: import('@playwright/test').Page) =>
  page.locator('user-profile-menu alps-icon-btn[slot="trigger"] button');

test('a click on a folder with a menu open closes the menu and opens the folder', async ({ page }) => {
  await login(page);
  await accountButton(page).click();
  await expect(accountMenu(page)).toHaveAttribute('open', '');
  // The button a screen reader reaches says the menu is open.
  await expect(accountButton(page)).toHaveAttribute('aria-expanded', 'true');

  await page.locator('alps-folder-list .folder-item[title="Archive"]').click();
  await expect(page).toHaveURL(/#\/mailbox\/Archive/);
  await expect(accountMenu(page)).not.toHaveAttribute('open', '');
  await expect(accountButton(page)).toHaveAttribute('aria-expanded', 'false');
});

test('a click on another button with a menu open presses it', async ({ page }) => {
  await login(page);
  await accountButton(page).click();
  await expect(accountMenu(page)).toHaveAttribute('open', '');

  await page.locator('mailbox-page alps-icon-btn[title="Create Folder"]').click();
  await expect(page.locator('alps-folder-list ui-prompt input')).toBeVisible();
  await expect(accountMenu(page)).not.toHaveAttribute('open', '');
});

test('a second click on the trigger closes the menu, and a third opens it', async ({ page }) => {
  await login(page);
  await accountButton(page).click();
  await expect(accountMenu(page)).toHaveAttribute('open', '');
  await accountButton(page).click();
  await expect(accountMenu(page)).not.toHaveAttribute('open', '');
  await accountButton(page).click();
  await expect(accountMenu(page)).toHaveAttribute('open', '');
});

test('Escape from the Order submenu returns focus to its trigger in the parent menu', async ({ page }) => {
  await login(page);
  // A user folder has the Order submenu; a second folder leaves a move enabled.
  const names = [`e2e-menu-order-${Date.now()}-a`, `e2e-menu-order-${Date.now()}-b`];
  try {
    for (const name of names) expect((await page.request.post('/mailboxes', { form: { name } })).ok()).toBe(true);
    await page.reload();
    const folder = page.locator(`alps-folder-list .folder-item[title="${names[0]}"]`);
    await folder.hover();
    await folder.locator('.kebab-btn button').click();
    const menu = folder.locator('alps-popup').first();
    const submenu = menu.locator('alps-popup');
    const trigger = submenu.locator('button[slot="trigger"]');
    await trigger.hover();
    await expect(submenu).toHaveAttribute('open', '');
    await submenu.locator('button:not([slot]):not([disabled])').first().focus();
    await page.keyboard.press('Escape');
    await expect(submenu).not.toHaveAttribute('open', '');
    await expect(menu).toHaveAttribute('open', '');
    await expect(trigger).toBeFocused();
  } finally {
    for (const name of names) await page.request.delete(`/mailboxes/${encodeURIComponent(encodeURIComponent(name))}`).catch(() => null);
  }
});

test('an abandoned trigger press does not swallow a later keyboard open', async ({ page }) => {
  await login(page);
  await accountButton(page).click();
  const box = await accountButton(page).boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(700, 500);
  await page.mouse.up();
  await page.keyboard.press('Escape');
  await expect(accountMenu(page)).not.toHaveAttribute('open', '');
  await accountButton(page).focus();
  await page.keyboard.press('Enter');
  await expect(accountMenu(page)).toHaveAttribute('open', '');
});
