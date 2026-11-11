// The header's tabs, from the keyboard and to a screen reader.
//
// They were bare elements with a click handler: Tab never reached them, Enter
// had nothing to press, and the accessibility tree held text with no role and
// no word of which page was on screen. They are now links in a navigation
// landmark, the current one marked with aria-current. The unit tests
// (app-header.test.ts) hold the markup; this is the browser's own focus order,
// focus ring and new-tab handling.

import { expect, login, test } from "./fixtures";

test("Tab reaches the header's tabs and Enter follows one", async ({ page }) => {
  await login(page);
  const nav = page.locator("mailbox-page").getByRole("navigation", { name: "Apps" });
  const messages = nav.getByRole("link", { name: "Messages" });
  await expect(messages).toHaveAttribute("aria-current", "page");

  await messages.focus();
  await expect(messages).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(nav.getByRole("link", { name: "Contacts" })).toBeFocused();
  await page.keyboard.press("Tab");
  const calendar = nav.getByRole("link", { name: "Calendar" });
  await expect(calendar).toBeFocused();
  // Keyboard focus shows.
  expect(await calendar.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/calendar\//);
  // The calendar draws a header of its own, where Calendar is now the page.
  const calendarNav = page.locator("calendar-page").getByRole("navigation", { name: "Apps" });
  await expect(calendarNav.getByRole("link", { name: "Calendar" })).toHaveAttribute("aria-current", "page");
  await expect(calendarNav.getByRole("link", { name: "Messages" })).not.toHaveAttribute("aria-current", /.*/);
});

test("a header tab opens in a new browser tab when asked to", async ({ page }) => {
  await login(page);
  const tasks = page.locator("mailbox-page").getByRole("navigation", { name: "Apps" }).getByRole("link", { name: "Tasks" });

  const opened = page.context().waitForEvent("page");
  await tasks.click({ modifiers: ["ControlOrMeta"] });
  const tab = await opened;

  await expect(tab).toHaveURL(/#\/tasks/);
  // This tab stays where it was.
  await expect(page).toHaveURL(/#\/mailbox\//);
  await tab.close();
});

// Forced colours repaint a transparent underline too, so every tab drew the
// same one and none of them read as current.
test("under forced colours only the current tab is underlined", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await login(page);
  const nav = page.locator("mailbox-page").getByRole("navigation", { name: "Apps" });

  const underline = (name: string) =>
    nav.getByRole("link", { name }).evaluate((el) => getComputedStyle(el).borderBottomColor);
  const canvas = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement("span"));
    probe.style.color = "Canvas";
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  });
  for (const name of ["Contacts", "Calendar", "Tasks"]) expect(await underline(name)).toBe(canvas);
  expect(await underline("Messages")).not.toBe(canvas);
});
