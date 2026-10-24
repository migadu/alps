// Calendars made, renamed and deleted from the Calendar page, through the real
// stack.
//
// The unit tests drive the sidebar against a stubbed calendar service. Here the
// caldav plugin sends what it sends a real server, an MKCALENDAR, a PROPPATCH
// of the display name and a DELETE of the collection, and the sidebar shows
// what the CalDAV server lists afterwards. So the prompt, the plugin's routes,
// the server's answers and the read after each agree, or this fails.

import type { Locator, Page } from "@playwright/test";
import { expect, login, readCalendarObject, resetDav, seedEvent, test } from "./fixtures";

const run = Date.now();

test.afterEach(async () => {
  // Drops the calendars made here along with their events: every other spec
  // expects the one calendar an account starts with.
  await resetDav();
});

/** The sidebar's row for the calendar named `name`. */
function calendarRow(page: Page, name: string): Locator {
  return page.locator("calendar-page .calendars-list .calendar-item:not(.tasks-toggle)", { hasText: name });
}

/** Opens a calendar's menu in the sidebar and picks `entry` from it. */
async function fromMenu(row: Locator, entry: string): Promise<void> {
  // The menu is display: none until its row is hovered.
  await row.hover();
  await row.getByRole("button", { name: "More options" }).click();
  await row.locator("button.dropdown-item").filter({ hasText: entry }).click();
}

test("a calendar made in the sidebar takes events, and is renamed and deleted", async ({ page }) => {
  const name = `E2E Trips ${run}`;
  const renamed = `E2E Journeys ${run}`;
  const summary = `E2E Flight ${run}`;
  await login(page);
  // The event below is dated in June 2026, so the month on screen is that one.
  await page.goto("/#/calendar/month/2026-06");
  // The account's own calendar, listed by the first read.
  await expect(calendarRow(page, "Calendar")).toBeVisible({ timeout: 15_000 });

  await page.locator('calendar-page alps-icon-btn[title="Add Calendar"]').click();
  const prompt = page.locator("calendar-page ui-prompt");
  await prompt.locator("input").fill(name);
  const made = page.waitForResponse(
    (res) => res.request().method() === "POST" && new URL(res.url()).pathname === "/calendar/calendars",
  );
  await prompt.getByRole("button", { name: "Save", exact: true }).click();
  expect((await made).status(), "the server made the calendar").toBe(200);
  const row = calendarRow(page, name);
  await expect(row).toBeVisible();
  // Checked as it is made, so that the events added to it show.
  await expect(row.getByRole("checkbox")).toBeChecked();

  await page.locator("calendar-page alps-create-button").click();
  const modal = page.locator("calendar-page calendar-event-modal");
  await modal.getByLabel("Summary", { exact: true }).fill(summary);
  // Offered beside the account's own calendar, now that there are two.
  await modal.getByLabel("Calendar", { exact: true }).selectOption({ label: name });
  await modal.getByLabel("All Day").check();
  await modal.getByLabel("Start Date").fill("2026-06-16");
  await modal.getByLabel("End Date").fill("2026-06-16");
  await modal.getByRole("button", { name: "Save", exact: true }).click();
  const chip = page.locator("calendar-month-view .event-chip", { hasText: summary });
  await expect(chip).toBeVisible();
  // Filed in the new calendar: its box hides the event and shows it again.
  await row.getByRole("checkbox").click();
  await expect(chip).toHaveCount(0);
  await row.getByRole("checkbox").click();
  await expect(chip).toBeVisible();

  await fromMenu(row, "Rename");
  await expect(prompt.locator("input")).toHaveValue(name);
  await prompt.locator("input").fill(renamed);
  await prompt.getByRole("button", { name: "Save", exact: true }).click();
  const renamedRow = calendarRow(page, renamed);
  await expect(renamedRow).toBeVisible();
  await expect(calendarRow(page, name)).toHaveCount(0);
  // A rename changes the name, not the calendar: its box and its event stay.
  await expect(renamedRow.getByRole("checkbox")).toBeChecked();
  await expect(chip).toBeVisible();

  await fromMenu(renamedRow, "Delete");
  const confirm = page.locator("calendar-page ui-confirm");
  await expect(confirm).toContainText(renamed);
  await confirm.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(calendarRow(page, renamed)).toHaveCount(0);
  await expect(chip).toHaveCount(0);

  // Gone from the server, not only from the page.
  await page.reload();
  await expect(calendarRow(page, "Calendar")).toBeVisible({ timeout: 15_000 });
  await expect(calendarRow(page, renamed)).toHaveCount(0);
  await expect(chip).toHaveCount(0);
});

test("an existing event stays in its calendar, and the editor does not offer another", async ({ page }) => {
  const uid = `e2e-kept-${run}`;
  const summary = `E2E Kept ${run}`;
  const other = `E2E Elsewhere ${run}`;
  await seedEvent({ uid, summary, dtstart: "20260616T090000Z", dtend: "20260616T100000Z" });
  await login(page);
  await page.goto("/#/calendar/month/2026-06");
  await expect(calendarRow(page, "Calendar")).toBeVisible({ timeout: 15_000 });

  // A second calendar, so that the editor shows its calendar picker.
  await page.locator('calendar-page alps-icon-btn[title="Add Calendar"]').click();
  const prompt = page.locator("calendar-page ui-prompt");
  await prompt.locator("input").fill(other);
  await prompt.getByRole("button", { name: "Save", exact: true }).click();
  await expect(calendarRow(page, other)).toBeVisible();

  const chip = page.locator("calendar-month-view .event-chip", { hasText: summary });
  await chip.click();
  await page.locator("calendar-month-view calendar-event-preview alps-icon-btn.edit-btn").filter({ visible: true }).first().click();
  const modal = page.locator("calendar-page calendar-event-modal");
  const picker = modal.getByLabel("Calendar", { exact: true });
  // The server keeps an event in its calendar when it is saved. The picker
  // could be changed all the same, and the change was ignored, unannounced.
  await expect(picker).toBeDisabled();
  await expect(picker.locator("option:checked")).toHaveText("Calendar");

  await modal.getByLabel("Location", { exact: true }).fill("Room 4");
  await modal.getByRole("button", { name: "Save", exact: true }).click();
  await expect(modal.locator("dialog")).toHaveCount(0);
  // Saved where it was, and shown with the other calendar hidden.
  expect(await readCalendarObject(uid)).toContain("LOCATION:Room 4");
  await calendarRow(page, other).getByRole("checkbox").click();
  await expect(chip).toBeVisible();
});
