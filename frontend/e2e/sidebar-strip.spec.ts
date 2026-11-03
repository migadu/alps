// The collapsed sidebar strip shows every page's icon column, in one place.
//
// Collapsed, a sidebar keeps its content as it is and slides it behind the main
// view: `.sidebar-scroll-content` stays 215px wide and moves left as the
// sidebar narrows. The strip that remains is 64px, and what should be in it is
// each row's icon. One slide for every sidebar did not do that, because the
// icon does not sit at the same place in every row: mail's rows lead with the
// expander column for nested folders, the others start with the icon. The
// slide that put mail's icons in the strip pushed Contacts', Calendar's and
// Tasks' icons under the main view. (Settings had one too; it is a window now,
// with a fixed section list.)
//
// Geometry needs a real browser (jsdom has no layout), so this lives here: the
// first row's icon on every page sits wholly inside the strip, at the same x.

import type { Locator, Page } from "@playwright/test";
import { allowConsoleErrors, deliver, expect, login, removeContact, seedContact, setDocked, test } from "./fixtures";

const PAGES: { name: string; route: string; icon: string }[] = [
  { name: "Mail", route: "/#/mailbox/INBOX", icon: "alps-folder-list .folder-item .folder-icon" },
  { name: "Contacts", route: "/#/contacts", icon: "alps-contacts-categories .category-item .category-icon svg" },
  { name: "Calendar", route: "/#/calendar", icon: "calendar-page .calendar-item .calendar-checkbox" },
  { name: "Tasks", route: "/#/tasks", icon: "tasks-page .smart-list svg" },
];

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
  // Moving between four pages in a few seconds aborts the previous page's fetches.
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
  await dragToNarrowest(page, sidebar);
  try {
    // The narrowest docked width, SIDEBAR_WIDTH_MIN.
    expect(Math.round((await sidebar.boundingBox())!.width)).toBe(180);
    const slid = await page
      .locator("alps-folder-list .sidebar-scroll-content")
      .first()
      .evaluate((el) => getComputedStyle(el).marginInlineStart);
    expect(slid).toBe("0px");
  } finally {
    // Back to the default width for the next spec.
    await restoreWidth(page, "mailbox-page");
  }
});

/** Drags the sidebar's edge to 130px, between the strip's snap (120px) and the
 *  narrowest docked width, where a drag stops. */
async function dragToNarrowest(page: Page, sidebar: Locator): Promise<void> {
  const edge = (await sidebar.locator(".sidebar-resizer").boundingBox())!;
  const start = (await sidebar.boundingBox())!;
  const x = edge.x + edge.width / 2;
  const y = edge.y + 300;
  // The first load's splash fades out over the page: press once the edge is
  // what a press there reaches.
  await expect.poll(() => page.evaluate(([px, py]) => {
    let el = document.elementFromPoint(px, py);
    while (el?.shadowRoot) {
      const inner = el.shadowRoot.elementFromPoint(px, py);
      if (!inner || inner === el) break;
      el = inner;
    }
    return el?.classList.contains("sidebar-resizer") ?? false;
  }, [x, y])).toBe(true);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(start.x + 130, y, { steps: 8 });
  await page.mouse.up();
  await page.mouse.move(900, 400);
  await expect.poll(async () => Math.round((await sidebar.boundingBox())!.width)).toBeLessThan(start.width);
}

/** Sets the page's sidebar back to its default width. A plugin page is kept
 *  while another tab is shown, and would come back narrow. */
async function restoreWidth(page: Page, host: string): Promise<void> {
  await page.locator(host).first().evaluate(async (el) => {
    const pageEl = el as HTMLElement & { sidebarWidth: number; updateComplete: Promise<unknown> };
    pageEl.sidebarWidth = 250;
    await pageEl.updateComplete;
  });
}

/** A folder and a contacts category named longer than any narrow sidebar is wide. */
const LONG = "e2e-narrow-a-name-longer-than-the-sidebar";

/**
 * What sits at a row's inline end, its count and its menu, and what has to
 * fit beside the names, on each page. `hover` is a row whose menu shows on
 * hover.
 */
const NARROW: { name: string; route: string; host: string; ends: string; hover: (page: Page) => Locator; names: string }[] = [
  {
    name: "Mail",
    route: "/#/mailbox/INBOX",
    host: "mailbox-page",
    ends: "alps-folder-list .folder-item:visible, alps-folder-list .folder-badge:visible, alps-folder-list .folder-actions:visible",
    hover: (page) => page.locator(`alps-folder-list .folder-item[title^="${LONG}"]`),
    names: `alps-folder-list .folder-item[title^="${LONG}"] .folder-name`,
  },
  {
    name: "Contacts",
    route: "/#/contacts",
    host: "contacts-page",
    ends: "alps-contacts-categories .category-item:visible, alps-contacts-categories .category-badge:visible, alps-contacts-categories .category-actions:visible",
    hover: (page) => page.locator("alps-contacts-categories .category-item", { hasText: LONG }),
    names: `alps-contacts-categories .category-item:has-text("${LONG}") .category-name`,
  },
  {
    name: "Calendar",
    route: "/#/calendar/month/2026-06",
    host: "calendar-page",
    ends: "calendar-page .calendar-item:visible, calendar-page .calendar-actions:visible, alps-sidebar-calendar alps-icon-btn:visible, calendar-mini-month .mini-day:visible",
    hover: (page) => page.locator("calendar-page .calendar-item:not(.tasks-toggle)").first(),
    names: "",
  },
  {
    name: "Tasks",
    route: "/#/tasks/all",
    host: "tasks-page",
    ends: "tasks-page .nav-item:visible, tasks-page .nav-item .count:visible",
    hover: (page) => page.locator("tasks-page .nav-item").first(),
    names: "",
  },
];

test("docked at its narrowest, every sidebar shortens its names and keeps its counts and menus in view", async ({ page }) => {
  allowConsoleErrors(page, /Failed to fetch|aborted/i);
  const stamp = Date.now();
  const folder = `${LONG}-${stamp}`;
  const contact = `e2e-narrow-${stamp}`;
  await deliver({ subject: `Narrow ${stamp}` });
  await seedContact({ uid: contact, name: "Narrow Sidebar", email: "narrow@example.test", lines: [`CATEGORIES:${LONG}`] });
  await login(page);
  const headers = { Origin: new URL(page.url()).origin };
  expect((await page.request.post("/mailboxes", { headers, form: { name: folder } })).ok()).toBe(true);
  await page.reload();
  await setDocked(page, true);
  try {
    for (const entry of NARROW) {
      await page.goto(entry.route);
      const sidebar = page.locator("alps-sidebar.desktop-sidebar").first();
      await expect(entry.hover(page)).toBeVisible();
      await dragToNarrowest(page, sidebar);
      try {
        await entry.hover(page).hover();
        const edge = await sidebar.locator("aside.sidebar").evaluate((el) => {
          const box = el.getBoundingClientRect();
          return box.right - parseFloat(getComputedStyle(el).borderInlineEndWidth);
        });
        const ends = await page.locator(entry.ends).evaluateAll((els) =>
          els.map((el) => ({ what: `${el.className} ${(el.textContent ?? "").trim().slice(0, 20)}`, end: el.getBoundingClientRect().right })));
        expect(ends.length, `${entry.name}: rows to measure`).toBeGreaterThan(0);
        const outside = ends.filter((e) => e.end > edge + 0.5);
        expect(outside, `${entry.name}: what ends past the sidebar's edge at ${Math.round(edge)}px`).toEqual([]);
        if (entry.names) {
          const name = page.locator(entry.names).first();
          expect(await name.evaluate((el) => el.scrollWidth > el.clientWidth), `${entry.name}: the long name is shortened`).toBe(true);
        }
      } finally {
        await page.mouse.move(900, 400);
        await restoreWidth(page, entry.host);
      }
    }
  } finally {
    await page.goto("/#/mailbox/INBOX");
    await page.request.delete(`/mailboxes/${encodeURIComponent(encodeURIComponent(folder))}`).catch(() => null);
    await removeContact(contact).catch(() => null);
  }
});

test("out of the strip, the content keeps the strip's width while the sidebar widens, then follows the sidebar's", async ({ page }) => {
  // A docked sidebar narrower than the strip's 215px of content, collapsed
  // and expanded again. Let go at once, the rows reflowed through every
  // width from the strip's up, each count setting off from beside its icon.
  await login(page);
  await setDocked(page, true);
  const sidebar = page.locator("alps-sidebar.desktop-sidebar").first();
  await dragToNarrowest(page, sidebar);
  try {
    const docked = await page.locator("alps-folder-list .sidebar-scroll-content").first().evaluate((el) => el.getBoundingClientRect().width);
    await setDocked(page, false);
    const samples = await page.locator("mailbox-page").first().evaluate(async (pageEl) => {
      const list = pageEl.shadowRoot!.querySelector("alps-folder-list")!;
      const content = list.shadowRoot!.querySelector("alps-sidebar-content")!;
      const scroll = list.shadowRoot!.querySelector(".sidebar-scroll-content")!;
      const expand = pageEl.shadowRoot!.querySelector("alps-sidebar")!.shadowRoot!.querySelector(".collapse-btn")!.shadowRoot!.querySelector("button")!;
      const seen: { after: number | null; width: number }[] = [];
      expand.click();
      const start = performance.now();
      let gone: number | null = null;
      while (performance.now() - start < 700) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const now = performance.now();
        if (gone === null && !content.hasAttribute("strip")) gone = now;
        seen.push({ after: gone === null ? null : Math.round(now - gone), width: Math.round(scroll.getBoundingClientRect().width) });
      }
      return seen;
    });
    const widening = samples.filter((s) => s.after !== null && s.after < 150);
    expect(widening.length, JSON.stringify(samples)).toBeGreaterThan(0);
    expect(widening.every((s) => s.width >= 215), `while the sidebar widens: ${JSON.stringify(widening)}`).toBe(true);
    expect(docked, "docked, the content is narrower than the strip's").toBeLessThan(215);
    expect(samples.at(-1)!.width, `once it has: ${JSON.stringify(samples.slice(-3))}`).toBe(Math.round(docked));
  } finally {
    await setDocked(page, true);
    await restoreWidth(page, "mailbox-page");
  }
});
