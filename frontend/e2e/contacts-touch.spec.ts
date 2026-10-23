// The contacts page on a touch screen.
//
// A category's menu (Rename, Delete) is shown while its row is hovered or
// holds the keyboard. A touch screen does neither: it has no hover, and a tap
// focuses the category's button without :focus-visible. Only a real browser
// with touch as its pointer shows which rules apply.

import { expect, login, test } from "./fixtures";

const run = Date.now();

// A tablet: wide enough for the categories to stay beside the list, with
// touch as its only pointer.
test.use({ viewport: { width: 1024, height: 768 }, isMobile: true, hasTouch: true });

test("a category can be renamed and deleted by touch", async ({ page }) => {
  const category = `Chess E2E ${run}`;
  const renamed = `Go E2E ${run}`;
  await login(page);
  await page.goto("/#/contacts");
  expect(await page.evaluate(() => matchMedia("(hover: none)").matches), "the page sees no pointer that hovers").toBe(true);

  const sidebar = page.locator("alps-contacts-categories");
  await page.getByRole("button", { name: "Create Category" }).tap();
  const prompt = page.locator("ui-prompt");
  await prompt.getByRole("textbox", { name: "Category Name" }).fill(category);
  await prompt.getByRole("button", { name: "Create" }).tap();

  await sidebar.getByRole("button", { name: category, exact: true }).tap();
  const row = sidebar.locator(".category-item", { hasText: category });
  const menu = row.getByRole("button", { name: "More options" });
  await expect(menu).toBeVisible();
  await menu.tap();
  await row.getByRole("button", { name: "Rename" }).tap();
  await prompt.getByRole("textbox", { name: "Category Name" }).fill(renamed);
  await prompt.getByRole("button", { name: "Rename" }).tap();
  await expect(sidebar.getByRole("button", { name: renamed, exact: true })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: category, exact: true })).toHaveCount(0);

  const renamedRow = sidebar.locator(".category-item", { hasText: renamed });
  await sidebar.getByRole("button", { name: renamed, exact: true }).tap();
  await renamedRow.getByRole("button", { name: "More options" }).tap();
  await renamedRow.getByRole("button", { name: "Delete" }).tap();
  await page.locator("contacts-page ui-confirm").getByRole("button", { name: "Delete", exact: true }).tap();
  await expect(sidebar.getByRole("button", { name: renamed, exact: true })).toHaveCount(0);
});
