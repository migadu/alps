// Native unsupported-server behavior, zero-limit warnings, and forced colors.
// Supported quota answers are intercepted because the native stack lacks QUOTA.

import type { Page } from "@playwright/test";
import { expect, login, test } from "./fixtures";

const menu = (page: Page) => page.locator("user-profile-menu");

test("a mail server without quotas draws no storage, and logs no error", async ({ page }) => {
  const answered = page.waitForResponse((r) => new URL(r.url()).pathname === "/quota");
  await login(page);
  const response = await answered;
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ supported: false });

  // Closed: the avatar has no badge, and the button's name says nothing more.
  await expect(menu(page).locator(".storage-badge")).toHaveCount(0);
  const trigger = menu(page).locator('alps-icon-btn[title="Profile options"]');
  await expect(trigger).toBeVisible();

  // Open: Settings and Sign out, and no storage between them.
  await trigger.click();
  await expect(menu(page).getByRole("button", { name: "Sign Out" })).toBeVisible();
  const section = menu(page).locator("alps-storage-usage");
  await expect(section).toBeAttached();
  await expect(section.locator(".storage")).toHaveCount(0);
  await expect(section).toHaveText("");
  await expect(menu(page).locator("alps-popup > .dropdown-divider")).toHaveCount(1);
});

for (const used of [0, 10]) {
  test(`a zero storage limit warns even with ${used} bytes used`, async ({ page }) => {
    await page.route('**/quota', route => route.fulfill({ json: { supported: true, used, limit: 0 } }));
    await login(page);
    await expect(menu(page).locator('.storage-badge.critical')).toHaveText('!');
    const trigger = menu(page).getByRole('button', { name: /Profile options \(Mailbox 100% full/ });
    await trigger.click();
    await expect(menu(page).locator('alps-storage-usage .percent')).toHaveText('100%');
    expect(await menu(page).locator('alps-storage-usage .fill').evaluate(el => Number.isFinite(el.getBoundingClientRect().width))).toBe(true);
  });
}

test('the critical storage badge uses system foreground and background under forced colors', async ({ page }) => {
  await page.route('**/quota', route => route.fulfill({ json: { supported: true, used: 97, limit: 100 } }));
  await login(page);
  const badge = menu(page).locator('.storage-badge.critical');
  await expect(badge).toHaveText('!');
  await page.emulateMedia({ forcedColors: 'active' });
  const colors = await badge.evaluate(el => {
    const paint = (color: string) => {
      const probe = document.createElement('span');
      probe.style.color = color;
      document.body.append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };
    const style = getComputedStyle(el);
    return { fill: style.backgroundColor, text: style.color, canvas: paint('Canvas'), canvasText: paint('CanvasText') };
  });
  expect(colors.fill).toBe(colors.canvasText);
  expect(colors.text).toBe(colors.canvas);
});
