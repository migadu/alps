// Motion the user asked not to see, as a browser applies it.
//
// The rule has to reach into every component's shadow root, and the host
// too where no parent's sheet reaches it. A spinner has to keep turning: the
// refresh buttons stop spinning on `animationiteration`, which fires only
// between iterations, so one frozen after a single turn would never stop.
// reduced-motion.test.ts reads the stylesheets; this checks what Chromium
// computes from them.

import type { Locator } from "@playwright/test";
import { expect, login, test } from "./fixtures";

/** The longest of an element's transition durations, in seconds. */
function longestTransition(target: Locator): Promise<number> {
  return target.evaluate((el) =>
    Math.max(...getComputedStyle(el).transitionDuration.split(",").map((d) => parseFloat(d))),
  );
}

test("components and their hosts stop moving, and a spinner keeps turning", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);

  // A transition inside a shadow root: every alps-button's, Compose's here.
  const inner = page.locator("alps-create-button alps-button button").first();
  await expect(inner).toBeVisible();
  expect(await longestTransition(inner)).toBeLessThan(0.001);

  const refresh = page.locator("alps-message-list alps-icon-btn[title='Check for new messages']");
  await refresh.click();
  const icon = refresh.locator("button.spinning svg");
  await expect(icon).toBeAttached();
  expect(await icon.evaluate((el) => getComputedStyle(el).animationIterationCount)).toBe("infinite");
  // One turn, then the check is over and the button stops, as it does
  // without the setting.
  await expect(refresh.locator("button.spinning")).toHaveCount(0, { timeout: 10_000 });

  // A host transition, in a parent that has none of its own to compose the
  // sheet for: Settings' section rows, whose background fades.
  await page.evaluate(() => { window.location.hash = "#/settings/appearance"; });
  const row = page.locator("settings-window alps-category-item").first();
  await expect(row).toBeVisible();
  expect(await longestTransition(row)).toBeLessThan(0.001);
});
