// Back leaves Calendar and Tasks, in a real browser.
//
// The Calendar and Tasks tabs set a bare `#/calendar` or `#/tasks`, and each
// page completes that address with its view. It did so by assigning the hash:
// a second history entry above the tab's, and Back onto the bare one ran the
// completion again and pushed the view forward, so Back could never leave the
// page. The unit tests (calendar-back-navigation.test.ts) drive jsdom's model
// of the session history; this is the browser's own, with the shell, the
// plugin chunks and the tabs all real.

import { expect, login, test } from "./fixtures";

const CALENDAR_VIEW = /#\/calendar\/month\/\d{4}-\d{2}$/;
const INBOX = /#\/mailbox\/INBOX$/;

test("Back leaves a calendar opened from its tab", async ({ page }) => {
  await login(page);
  await page.locator('.nav-tab[title="Calendar"]').click();
  await expect(page).toHaveURL(CALENDAR_VIEW);

  await page.goBack();
  await expect(page).toHaveURL(INBOX);
});

test("Back walks through the user's own moves inside the calendar", async ({ page }) => {
  // Another view is a place the user went, so it stays an entry: one Back
  // returns to the view it left, the next one leaves the calendar.
  await login(page);
  await page.locator('.nav-tab[title="Calendar"]').click();
  await expect(page).toHaveURL(CALENDAR_VIEW);

  await page.locator("calendar-page alps-toggle").getByRole("button", { name: "Week", exact: true }).click();
  await expect(page).toHaveURL(/#\/calendar\/week\/\d{4}-\d{2}-\d{2}$/);

  await page.goBack();
  await expect(page).toHaveURL(CALENDAR_VIEW);
  await page.goBack();
  await expect(page).toHaveURL(INBOX);
});

test("the Calendar tab clicked on the calendar adds no entry", async ({ page }) => {
  // Its bare `#/calendar` was an entry above the view on screen, completed in
  // place to that same view: the address twice, and a first Back that did
  // nothing.
  await login(page);
  await page.locator('.nav-tab[title="Calendar"]').click();
  await expect(page).toHaveURL(CALENDAR_VIEW);
  const view = page.url();

  await page.locator('calendar-page .nav-tab[title="Calendar"]').click();
  await expect(page).toHaveURL(view);

  await page.goBack();
  await expect(page).toHaveURL(INBOX);
});

test("Back leaves Tasks opened from its tab", async ({ page }) => {
  await login(page);
  await page.locator('.nav-tab[title="Tasks"]').click();
  await expect(page).toHaveURL(/#\/tasks\/all$/);

  await page.goBack();
  await expect(page).toHaveURL(INBOX);
});
