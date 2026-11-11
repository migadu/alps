// The page can be pinch-zoomed.
//
// The viewport declared `maximum-scale=1.0, user-scalable=0`, which Chrome on
// Android honours, so nothing in alps could be zoomed there. The page now
// declares no limit; on iOS, which ignores the limit for the user's own pinch,
// the app adds `maximum-scale=1` at boot so Safari does not zoom into a
// focused 14px field (unit tests: test/viewport.test.ts).

import { expect, test } from "./fixtures";

const viewport = (page: import("@playwright/test").Page) =>
  page.locator('meta[name="viewport"]').getAttribute("content");

test.describe("on Android", () => {
  test.use({
    userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
    viewport: { width: 412, height: 915 },
    hasTouch: true,
    isMobile: true,
  });

  test("the viewport sets no limit on zoom", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("app-root")).toBeAttached();
    expect(await viewport(page)).toBe("width=device-width, initial-scale=1.0");
  });
});

test.describe("on an iPhone", () => {
  test.use({
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test("the app caps the scale at boot, which iOS applies to field focus only", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => viewport(page)).toBe("width=device-width, initial-scale=1.0, maximum-scale=1");
  });
});
