// Toasts as a screen reader meets them.
//
// The shell reads every toast out from two live regions that are always in
// the page: a failure from an alert, anything else from a status. Hidden as
// they are, they must stay in the accessibility tree, which only a browser
// builds; toast-announcements.test.ts covers which region gets what.

import { allowConsoleErrors, expect, login, test } from "./fixtures";

test("a failure is read out as an alert, and news as a status", async ({ page }) => {
  await login(page);

  // A folder that is not there: the list says so as a failure. Its listing
  // is refused with a 404, which Chromium logs.
  allowConsoleErrors(page, /status of 404/);
  await page.evaluate(() => { window.location.hash = "#/mailbox/e2e-no-such-folder"; });
  await expect(page.getByRole("alert").filter({ hasText: "Mailbox not found" })).toBeAttached();

  // News, raised through the event every part of alps raises toasts with.
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "Three messages moved to Archive" } }));
  });
  await expect(page.getByRole("status").filter({ hasText: "Three messages moved to Archive" })).toBeAttached();
  // Read out, never seen: the toast itself is what is on screen.
  await expect(page.locator("alps-toast").filter({ hasText: "Three messages moved to Archive" })).toBeVisible();
});
