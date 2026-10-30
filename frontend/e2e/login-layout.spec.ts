// The sign-in form's "stay signed in" box when its label wraps.
//
// The label grew from "Keep me signed in" to "Stay signed in after closing the
// browser", so on a phone it wraps in most languages. The row was a centred
// flex line whose checkbox could shrink, and a wrapped label squeezed the box
// narrower than it was tall and floated it between the two lines. jsdom has no
// layout, so this is measured here.

import { expect, test } from "./fixtures";

test.use({ viewport: { width: 360, height: 760 } });

test("the stay-signed-in box stays square and sits on the label's first line", async ({ page }) => {
  // The sign-in page speaks the language this browser last used, kept for it
  // before any account is signed in.
  await page.addInitScript(() => {
    if (window !== window.top || !location.protocol.startsWith("http")) return;
    localStorage.setItem("alps_settings", JSON.stringify({ language: "de" }));
  });
  await page.goto("/#/login");
  const label = page.locator(".checkbox-group label");
  const box = label.locator('input[type="checkbox"]');
  await expect(label).toContainText("Browsers");

  const b = (await box.boundingBox())!;
  const l = (await label.boundingBox())!;
  // "normal" has no number; the 1.2 it usually means is close enough here.
  const lineHeight = await label.evaluate((el) => {
    const style = getComputedStyle(el);
    const px = parseFloat(style.lineHeight);
    return Number.isFinite(px) ? px : parseFloat(style.fontSize) * 1.2;
  });

  // The case under test: the label really does wrap at this width.
  expect(l.height, "the label wraps onto a second line").toBeGreaterThan(lineHeight * 1.5);
  expect(b.width, "the box keeps its width").toBeCloseTo(16, 0);
  expect(b.height, "the box keeps its height").toBeCloseTo(16, 0);
  // Within the first line, not centred on the whole wrapped block.
  expect(b.y, "the box starts on the first line").toBeGreaterThanOrEqual(l.y - 1);
  expect(b.y + b.height, "the box ends on the first line").toBeLessThanOrEqual(l.y + lineHeight + 1);
});
