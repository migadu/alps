// A return to Contacts reuses its recent listing, and a slow background
// refresh leaves those rows usable. A browser click matters here: jsdom does
// not enforce pointer-events when a test calls an element's click method.

import { expect, login, resetDav, seedContact, test } from "./fixtures";

const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

test.afterEach(async ({ page }) => {
  await page.goto("about:blank");
  await resetDav();
});

test("returning to Contacts reuses its recent listing", async ({ page }) => {
  test.fail();
  const id = unique();
  const name = `Kept contact ${id}`;
  const email = `kept.${id}@example.test`;
  await seedContact({ uid: `kept-${id}`, name, email });
  await login(page);

  let listings = 0;
  page.on("request", request => {
    if (request.method() === "GET" && new URL(request.url()).pathname === "/contacts") listings++;
  });
  await page.locator('mailbox-page .nav-tab[title="Contacts"]').click();
  const row = page.locator("alps-contacts-list .contact-item", { hasText: name });
  await expect(row).toBeVisible();
  expect(listings).toBe(1);

  await page.locator('contacts-page .nav-tab[title="Messages"]').click();
  await expect(page.locator("contacts-page")).toHaveCount(0);
  await page.locator('mailbox-page .nav-tab[title="Contacts"]').click();
  await row.click();
  await expect(page.locator("alps-contact-view")).toContainText(email);

  expect(listings, "a quick return fetched the whole address book again").toBe(1);
});

test("a slow refresh keeps the loaded contacts selectable", async ({ page }) => {
  test.fail();
  const id = unique();
  const name = `Selectable contact ${id}`;
  const email = `selectable.${id}@example.test`;
  await seedContact({ uid: `selectable-${id}`, name, email });
  await login(page);
  await page.locator('mailbox-page .nav-tab[title="Contacts"]').click();
  const row = page.locator("alps-contacts-list .contact-item", { hasText: name });
  await expect(row).toBeVisible();

  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let sent!: () => void;
  const refreshing = new Promise<void>(resolve => { sent = resolve; });
  await page.route(/\/contacts(?:\?.*)?$/, async route => {
    sent();
    await held;
    await route.continue();
  });
  const response = page.waitForResponse(r => r.request().method() === "GET" && new URL(r.url()).pathname === "/contacts");
  const addedName = `Added during refresh ${id}`;
  try {
    await page.locator("contacts-page").getByRole("button", { name: "Refresh Contacts", exact: true }).click();
    await refreshing;
    await row.click({ timeout: 5_000 });
    await expect(page.locator("alps-contact-view")).toContainText(email);
    await seedContact({ uid: `added-${id}`, name: addedName, email: `added.${id}@example.test` });
  } finally {
    release();
    expect((await response).status()).toBe(200);
  }
  await expect(page.locator("alps-contacts-list .contact-item", { hasText: addedName })).toBeVisible();
  await expect(page.locator("alps-contact-view")).toContainText(email);
});
