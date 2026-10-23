// The collapsed sidebar strip shows every page's icon column, in one place.
//
// Collapsed, a sidebar keeps its content as it is and slides it behind the main
// view: `.sidebar-scroll-content` stays 215px wide and moves left as the
// sidebar narrows. The strip that remains is 64px, and what should be in it is
// each row's icon. One slide for every sidebar did not do that, because the
// icon does not sit at the same place in every row: mail's rows lead with the
// expander column for nested folders, the others start with the icon. The
// slide that put mail's icons in the strip pushed Contacts', Calendar's,
// Tasks' and Settings' icons under the main view.
//
// Geometry needs a real browser (jsdom has no layout), so this lives here: the
// first row's icon on every page sits wholly inside the strip, at the same x.

import type { Page } from "@playwright/test";
import { allowConsoleErrors, expect, login, test } from "./fixtures";

const PAGES: { name: string; route: string; icon: string }[] = [
  { name: "Mail", route: "/#/mailbox/INBOX", icon: "alps-folder-list .folder-item .folder-icon" },
  { name: "Contacts", route: "/#/contacts", icon: "alps-contacts-categories .category-item .category-icon svg" },
  { name: "Calendar", route: "/#/calendar", icon: "calendar-page .calendar-item .calendar-checkbox" },
  { name: "Tasks", route: "/#/tasks", icon: "tasks-page .smart-list svg" },
  { name: "Settings", route: "/#/settings/general", icon: "settings-page alps-category-item .category-icon" },
];

/** Docks or collapses the desktop sidebar with its footer button, and waits
 * for the width to settle. The state is a saved preference, so a spec cannot
 * assume the one it starts in. */
async function setDocked(page: Page, docked: boolean) {
  const sidebar = page.locator("alps-sidebar.desktop-sidebar").first();
  await expect(sidebar).toBeVisible();
  const isDocked = async () => !(await sidebar.evaluate((el) => el.hasAttribute("collapsed")));
  if ((await isDocked()) !== docked) await sidebar.locator(".collapse-btn").click();
  // Off the sidebar: resting on the strip opens the peek overlay, which is
  // full width while the sidebar is still collapsed.
  await page.mouse.move(900, 400);
  await expect.poll(isDocked).toBe(docked);
  await expect.poll(async () => {
    const width = (await sidebar.boundingBox())?.width ?? 0;
    return docked ? width > 100 : width === 64;
  }).toBe(true);
}

/** The first row icon's box and the strip's width, once the slide has settled. */
async function iconInStrip(page: Page, entry: (typeof PAGES)[number]) {
  await page.goto(entry.route);
  const icon = page.locator(entry.icon).first();
  await expect(icon).toBeAttached();
  const sidebar = page.locator("alps-sidebar.desktop-sidebar").first();
  // The collapse animates width (0.2s): wait until the strip is its final width.
  await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(64);
  await page.waitForTimeout(250);
  const strip = (await sidebar.boundingBox())!;
  const box = (await icon.boundingBox())!;
  return { start: box.x - strip.x, end: box.x + box.width - strip.x, strip: strip.width };
}

test("the collapsed strip shows every page's icons, in the same place", async ({ page }) => {
  // Moving between five pages in a few seconds aborts the previous page's fetches.
  allowConsoleErrors(page, /Failed to fetch|aborted/i);
  await login(page);
  await setDocked(page, false);
  try {
    // Every page measured before any is judged, so a failure names them all.
    const icons: Record<string, { start: number; end: number; strip: number }> = {};
    for (const entry of PAGES) icons[entry.name] = await iconInStrip(page, entry);
    const seen = JSON.stringify(Object.fromEntries(Object.entries(icons).map(([name, i]) => [name, [Math.round(i.start), Math.round(i.end)]])));
    for (const [name, { start, end, strip }] of Object.entries(icons)) {
      expect(start, `${name}: the icon's start is inside the strip (${seen})`).toBeGreaterThanOrEqual(0);
      expect(end, `${name}: the icon's end is inside the strip (${seen})`).toBeLessThanOrEqual(strip);
      expect(Math.abs(start - icons.Mail.start), `${name} starts its icons where Mail does (${seen})`).toBeLessThanOrEqual(1);
    }
  } finally {
    // Collapsed is a saved preference: leave it docked, as every other spec
    // expects, whether or not the assertions above held.
    await page.goto("/#/mailbox/INBOX");
    await setDocked(page, true);
  }
});

test("a sidebar at its narrowest docked width has not slid", async ({ page }) => {
  // The slide is for the strip. Docked, however narrow, every column stays in
  // view: in mail that includes the expander carets of nested folders.
  await login(page);
  await setDocked(page, true);
  const sidebar = page.locator("alps-sidebar.desktop-sidebar").first();
  // The width a drag to the minimum leaves, set the way the drag sets it.
  const setWidth = (width: number) =>
    page.locator("mailbox-page").first().evaluate(async (el, w) => {
      const pageEl = el as HTMLElement & { sidebarWidth: number; updateComplete: Promise<unknown> };
      pageEl.sidebarWidth = w;
      await pageEl.updateComplete;
    }, width);
  await setWidth(150);
  await expect.poll(async () => Math.round((await sidebar.boundingBox())?.width ?? 0)).toBe(150);
  const slid = await page
    .locator("alps-folder-list .sidebar-scroll-content")
    .first()
    .evaluate((el) => getComputedStyle(el).marginInlineStart);
  expect(slid).toBe("0px");

  // Back to the default width for the next spec.
  await setWidth(250);
});
