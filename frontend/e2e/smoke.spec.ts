// Does the application load, sign in, and show mail?
//
// The narrowest proof that the harness works and the application runs. If
// this fails, nothing else in the suite means anything.

import { deliver, expect, login, signIn, test, USER } from "./fixtures";

test("the login page loads", async ({ page }) => {
  await page.goto("/#/login");
  await expect(page.locator("app-root")).toBeAttached();
  await expect(page.locator('login-page input[type="password"]')).toBeVisible();
});

test("signing in reaches the mailbox", async ({ page }) => {
  // `signIn`, not `login`: this test IS the password flow, and `login` would
  // reuse a session instead of exercising it.
  await signIn(page);
  await expect(page).toHaveURL(/#\/mailbox\/INBOX/);
});

test("a delivered message appears in the list", async ({ page }) => {
  const subject = `Smoke ${Date.now()}`;
  await deliver({ subject, body: "Hello from the smoke test." });

  await login(page);
  const row = page.locator("alps-message-list").getByText(subject);
  await expect(row).toBeVisible();
  // The sender's display name, not the address: proof the parsed From header
  // reaches the row.
  await expect(page.locator("alps-message-list").getByText("Ada Lovelace").first()).toBeVisible();
});

test("the signed-in address is shown", async ({ page }) => {
  await login(page);
  await expect(page.getByText(USER.address).first()).toBeAttached();
});
