// A colour mark under forced colors, as Chromium paints it.
//
// Forced colors (Windows high contrast) repaint backgrounds as the page and
// borders in a system colour. A calendar's checkbox is drawn in the
// calendar's colour, the legend for its events, and lost it there; the
// colour marks now keep theirs (color-marks-forced-colors.test.ts reads the
// rules). This checks what the browser computes: the same colours with and
// without forced colors.

import type { Locator } from "@playwright/test";
import { expect, login, test } from "./fixtures";

function paint(box: Locator) {
  return box.evaluate((el) => {
    const style = getComputedStyle(el);
    return { border: style.borderTopColor, fill: style.backgroundColor };
  });
}

test("a calendar's checkbox keeps its colour under forced colors", async ({ page }) => {
  await login(page);
  await page.goto("/#/calendar/month/2026-06");
  const box = page.locator("calendar-page .calendar-item:not(.tasks-toggle) .calendar-checkbox.checked").first();
  await expect(box).toBeVisible();
  const normal = await paint(box);
  // A colour of its own, not nothing: the case under test.
  expect(normal.fill).not.toBe("rgba(0, 0, 0, 0)");

  await page.emulateMedia({ forcedColors: "active" });
  await expect.poll(() => paint(box)).toEqual(normal);
});
