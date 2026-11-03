// Keyboard focus, as a browser paints it.
//
// alps-button took its outline away and put nothing back, so Tab moved an
// invisible cursor across every button. The fields show focus as an accent
// border and a shadow ring, and forced colors (Windows high contrast) drop the
// shadow and repaint the border in one system colour, so there a focused field
// looked like the others. focus-visible.test.ts reads the rules; this checks
// that a browser paints them, forced colors included.

import type { Locator, Page } from "@playwright/test";
import { expect, login, test } from "./fixtures";

/** Whether `target` has the focus, looking into shadow roots as the browser does. */
function hasFocus(target: Locator): Promise<boolean> {
  return target.evaluateAll((els) => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return els.some((el) => el === active || el.shadowRoot?.contains(active));
  });
}

/** Presses Tab until `target` has the focus, as a keyboard user would. */
async function tabTo(page: Page, target: Locator, what: string, presses = 40): Promise<void> {
  for (let i = 0; i < presses; i++) {
    if (await hasFocus(target)) return;
    await page.keyboard.press("Tab");
  }
  expect(await hasFocus(target), `Tab never reached ${what}`).toBe(true);
}

/**
 * The outline the focused element is painted with, looking into shadow roots.
 * Polled by the callers: these controls transition every property, the
 * outline among them, for 0.2s from the moment they take focus.
 */
function focusedOutline(page: Page) {
  return page.evaluate(() => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    const style = getComputedStyle(active!);
    return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
  });
}

/** The forced colors palette has no transparent: what is painted is a system colour. */
const PAINTED = { style: "solid", color: expect.not.stringMatching(/^rgba\(0, 0, 0, 0\)$/) };

test("the sign-in form shows where focus is under forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/#/login");

  await tabTo(page, page.locator("login-page .native-input").first(), "the address field");
  await expect.poll(() => focusedOutline(page), { message: "the field keeps an outline" }).toMatchObject(PAINTED);

  await tabTo(page, page.locator("login-page .submit-btn"), "the sign-in button");
  await expect.poll(() => focusedOutline(page), { message: "the button has one" }).toMatchObject(PAINTED);
});

test("an alps-button reached by Tab is ringed in the accent", async ({ page }) => {
  await login(page);
  await page.evaluate(() => { window.location.hash = "#/settings/accounts"; });
  const link = page.locator("settings-accounts alps-button").filter({ hasText: "Link Account" });
  await expect(link).toBeVisible();

  await tabTo(page, link, "Link Account");
  const accent = await link.evaluate((el) => {
    // The accent as this theme resolves it, read through a probe so it comes
    // back in the same rgb() form as the outline.
    const probe = document.createElement("span");
    probe.style.color = "var(--accent-color)";
    el.shadowRoot!.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect.poll(() => focusedOutline(page)).toEqual({ style: "solid", width: "2px", color: accent });
});
