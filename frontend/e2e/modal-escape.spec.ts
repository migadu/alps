// A modal that may not be dismissed stays up through Escape.
//
// ui-modal refused Escape by cancelling the dialog's `cancel` event. The
// browser lets a page refuse a close request only once per user activation,
// and Escape is none, so the second Escape in a row closed the dialog anyway:
// the offline modal's card stayed drawn, without its backdrop, and the page
// behind it took the keyboard again. Only a browser has that rule; jsdom has
// no close requests at all.

import { allowConsoleErrors, expect, login, test } from "./fixtures";

test("the offline modal stays modal through repeated Escapes", async ({ page, context }) => {
  // The app's own connectivity checks fail while the network is off.
  allowConsoleErrors(page, /ERR_INTERNET_DISCONNECTED/, /Background sync failed/);
  await login(page);
  const search = page.locator("app-header alps-input input").first();
  // The page has been used before the connection drops, as it always has.
  await search.click();

  await context.setOffline(true);
  const dialog = page.locator("ui-modal").filter({ hasText: "Connection Lost" }).locator("dialog");
  await expect(dialog).toBeVisible();

  for (let press = 0; press < 3; press++) await page.keyboard.press("Escape");

  await expect.poll(() => dialog.evaluate((el) => el.matches(":modal"))).toBe(true);
  // Nothing behind it can take the focus.
  expect(await search.evaluate((el) => { (el as HTMLElement).focus(); return el.matches(":focus"); })).toBe(false);

  await context.setOffline(false);
  await expect(dialog).toHaveCount(0, { timeout: 20_000 });
});
