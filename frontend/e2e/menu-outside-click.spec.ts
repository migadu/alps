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
