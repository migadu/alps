// Scrollbars in the theme's colours, inside components too.
//
// They were styled only through ::-webkit-scrollbar in the document's sheet,
// which matches no element inside a shadow root: the message list, the
// reader, the folder list and every other scroll area in a component kept the
// browser's default, and Firefox had none of the theme's at all. The colour is
// now scrollbar-color on the root, which every shadow root inherits. Its
// contrast against each theme is held in test/scrollbar-contrast.test.ts.

import { expect, login, test } from "./fixtures";

for (const theme of ["light", "dark"] as const) {
  test(`a scroll area inside a component takes the ${theme} theme's scrollbar colour`, async ({ page }) => {
    await page.addInitScript((theme) => {
      if (window !== window.top || !location.protocol.startsWith("http")) return;
      localStorage.setItem("alps_settings", JSON.stringify({ themeMode: theme }));
    }, theme);
    await login(page);
    if (theme === "dark") await expect(page.locator("body")).toHaveClass(/theme-dark/);

    const colours = await page.locator("alps-message-list").evaluate((list) => {
      // The list's own scroll area, in its shadow root.
      const scroller = [...(list.shadowRoot?.querySelectorAll<HTMLElement>("*") ?? [])]
        .find((el) => ["auto", "scroll"].includes(getComputedStyle(el).overflowY));
      return {
        found: Boolean(scroller),
        inShadowRoot: scroller ? scroller.getRootNode() !== document : false,
        scroller: scroller ? getComputedStyle(scroller).scrollbarColor : "",
        body: getComputedStyle(document.body).scrollbarColor,
      };
    });
    expect(colours.found).toBe(true);
    expect(colours.inShadowRoot).toBe(true);
    expect(colours.scroller).not.toBe("auto");
    expect(colours.scroller).toBe(colours.body);
  });
}
