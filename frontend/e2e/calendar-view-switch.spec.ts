// The calendar's view switch, in a real browser.
//
// The switch drew Day, Week, Month and Year as four buttons and marked the
// one shown with a class alone, so a screen reader never heard which view was
// selected. It is a radio group now. The unit tests (alps-toggle.test.ts) pin
// the radios jsdom can model; this is the browser's accessibility tree, its
// arrow keys and the phone's full-width switch.

import { expect, login, test } from "./fixtures";

test("the view switch is a radio group that says which view is shown", async ({ page }) => {
  await login(page);
  await page.goto("/#/calendar/week/2026-03-09");

  const views = page.locator("calendar-page").getByRole("radiogroup", { name: "View" });
  await expect(views).toBeVisible({ timeout: 15_000 });
  await expect(views.getByRole("radio")).toHaveCount(4);
  await expect(views.getByRole("radio", { name: "Week", exact: true })).toBeChecked();
  for (const other of ["Day", "Month", "Year"]) {
    await expect(views.getByRole("radio", { name: other, exact: true })).not.toBeChecked();
  }

  // The arrow keys move between the views, as in any radio group.
  await views.getByRole("radio", { name: "Week", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/calendar\/month\/2026-03$/);
  await expect(views.getByRole("radio", { name: "Month", exact: true })).toBeChecked();
  await expect(views.getByRole("radio", { name: "Month", exact: true })).toBeFocused();

  // A week opened from a month is one of that month's weeks.
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/#\/calendar\/week\/2026-03-\d{2}$/);
  await expect(views.getByRole("radio", { name: "Week", exact: true })).toBeChecked();
});

test("on a phone the view switch fills its bar and still switches the view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto("/#/calendar/month/2026-06");

  const bar = page.locator("calendar-page .mobile-bottom-actions");
  const views = bar.getByRole("radiogroup", { name: "View" });
  await expect(views).toBeVisible({ timeout: 15_000 });
  await expect(views.getByRole("radio", { name: "Month", exact: true })).toBeChecked();

  const barBox = await bar.boundingBox();
  const switchBox = await bar.locator("alps-toggle").boundingBox();
  expect(barBox && switchBox, "the bar and its switch are laid out").toBeTruthy();
  expect(Math.abs(switchBox!.width - barBox!.width), "the switch spans the bar").toBeLessThanOrEqual(1);

  await views.getByRole("radio", { name: "Day", exact: true }).check();
  await expect(page).toHaveURL(/#\/calendar\/day\/2026-06-\d{2}$/);
  await expect(views.getByRole("radio", { name: "Day", exact: true })).toBeChecked();
});
