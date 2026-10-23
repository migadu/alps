// A click on a field's label puts the focus in the field.
//
// alps's fields draw their control in a shadow root of their own, which a
// <label> cannot point into, and the settings draw their labels in another.
// Whether a click on a label reaches its field is a matter of event dispatch
// and focus across those roots, which only a browser answers; the unit tests
// (label-click.test.ts) cover each of the three ways a label is placed.
//
// Each click starts with the focus nowhere, and none of them may write
// anything: a label focuses, and opens, ticks and sends nothing.

import type { Locator, Page } from "@playwright/test";
import { expect, login, resetSieve, test } from "./fixtures";

test.afterEach(async () => {
  await resetSieve();
});

/** Whether `field` has the focus, looking into shadow roots as the browser does. */
function hasFocus(field: Locator): Promise<boolean> {
  return field.evaluate((target) => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active === target;
  });
}

/** Clicks `label` with the focus nowhere, and expects it to land in `field`. */
async function clickLabel(page: Page, label: Locator, field: Locator, what: string) {
  await page.evaluate(() => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    (active as HTMLElement | null)?.blur?.();
  });
  await label.click();
  expect(await hasFocus(field), `a click on the label "${what}" focuses its field`).toBe(true);
}

/** Every request that would change something, while `run` runs. */
async function writesDuring(page: Page, run: () => Promise<void>): Promise<string[]> {
  const writes: string[] = [];
  const watch = (request: { method(): string; url(): string }) => {
    if (request.method() !== "GET") writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
  };
  page.on("request", watch);
  try {
    await run();
  } finally {
    page.off("request", watch);
  }
  return writes;
}

test("a click on a setting's label focuses its field", async ({ page }) => {
  await login(page);

  // A setting's label, and a date's label wrapped around its field.
  await page.goto("/#/settings/autoreply");
  const auto = page.locator("alps-auto-reply-page");
  await expect(auto.locator("alps-input.start input")).toBeVisible({ timeout: 15_000 });
  const subject = auto.locator("alps-setting-group").filter({ has: page.locator("alps-input.subject") });
  expect(await writesDuring(page, async () => {
    await clickLabel(page, auto.locator(".dates label .field-label", { hasText: "Start date" }), auto.locator("alps-input.start input"), "Start date");
    await clickLabel(page, auto.locator(".dates label .field-label", { hasText: "End date" }), auto.locator("alps-input.end input"), "End date");
    await clickLabel(page, subject.locator("label.setting-label"), auto.locator("alps-input.subject input"), "Subject");
  })).toEqual([]);

  // An input and a native <textarea> under a setting's label.
  await page.goto("/#/settings/identity");
  const win = page.locator("settings-window");
  await expect(win.locator("textarea")).toBeVisible({ timeout: 15_000 });
  const group = (has: string) => win.locator("alps-setting-group").filter({ has: page.locator(has) }).first();
  expect(await writesDuring(page, async () => {
    await clickLabel(page, group("alps-input").locator("label.setting-label"), group("alps-input").locator("alps-input input"), "Display Name");
    await clickLabel(page, group("textarea").locator("label.setting-label"), win.locator("textarea"), "Signature");
  })).toEqual([]);
});

test("a click on a label in the event and task editors focuses its field, and Tab goes on from there", async ({ page }) => {
  await login(page);

  await page.goto("/#/calendar");
  await page.locator("calendar-page alps-create-button").filter({ hasText: "Add Event" }).click();
  const event = page.locator("calendar-event-modal");
  const row = (label: string) => event.locator(".form-group").filter({ has: page.locator(`label:text-is("${label}")`) }).first();
  await expect(row("Summary").locator("alps-input input")).toBeVisible();

  const writes = await writesDuring(page, async () => {
    await clickLabel(page, row("Guests").locator("label"), row("Guests").locator("alps-address-input input"), "Guests");
    await clickLabel(page, row("Repeat").locator("label"), row("Repeat").locator("alps-select select"), "Repeat");
    await clickLabel(page, row("Description").locator("label"), row("Description").locator("textarea"), "Description");
    await clickLabel(page, row("Summary").locator("label"), row("Summary").locator("alps-input input"), "Summary");
    // The keyboard goes on from the field the label focused, to the next one.
    await page.keyboard.press("Tab");
    expect(await hasFocus(row("Guests").locator("alps-address-input input")), "Tab from Summary reaches Guests").toBe(true);
  });
  expect(writes).toEqual([]);
  // Nothing was saved or closed along the way.
  await expect(event.locator("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(event.locator("dialog")).toHaveCount(0);

  await page.goto("/#/tasks");
  await page.locator("tasks-page alps-create-button").first().click();
  const task = page.locator("task-modal");
  await expect(task.locator("alps-input.title-input input")).toBeVisible();
  const taskWrites = await writesDuring(page, async () => {
    await clickLabel(page, task.locator('label[for="task-priority"]'), task.locator("alps-select.priority-select select"), "Priority");
    await clickLabel(page, task.locator('label[for="task-title"]'), task.locator("alps-input.title-input input"), "Title");
  });
  expect(taskWrites).toEqual([]);
  await expect(task.locator("dialog")).toBeVisible();
});
