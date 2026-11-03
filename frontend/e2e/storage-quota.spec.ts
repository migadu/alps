// How much of the mailbox's storage is used, in the account menu.
//
// The mail server of this stack keeps no quotas: it does not list QUOTA. So
// what can be seen here is the other half, which a jsdom test cannot show
// against a real server: the menu asks, the server says plainly that there
// is nothing to show, and nothing is drawn, no badge, no bar, no 0% for a
// mailbox without a limit, and nothing is logged as an error (the fixture
// fails the test on any). The figures and the warnings are covered by the
// unit tests, against answers with a limit.

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
