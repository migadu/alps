// Editing a contact, through the real stack.
//
// Opening a contact shows the list's copy of it at once and reads the whole
// card. This stack's CardDAV server answers the listing with only the
// properties asked for, as RFC 6352 allows, so that copy holds no note, URL,
// birthday or address: Edit pressed before the read answered filled the
// form from it, and the first save wrote the card back without them.

import { expect, login, readContact, resetDav, seedContact, test } from "./fixtures";

const run = Date.now();

test.afterEach(async () => {
  await resetDav();
});

test("an edit started before the card is read keeps the card's other fields", async ({ page }) => {
  const name = `Hopper E2E ${run}`;
  const uid = `e2e-hopper-${run}`;
  await seedContact({
    uid,
    name,
    email: `hopper.${run}@example.test`,
    lines: ["NOTE:Wrote the first compiler", "URL:https://navy.example", "BDAY:1906-12-09", "ADR;TYPE=HOME:;;1 Main St;Springfield;IL;62701;USA"],
  });
  await login(page);

  // The read of the open card is held until Edit has been pressed.
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/contacts\/[^/?]+$/, async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await held;
    await route.continue();
  });

  await page.goto("/#/contacts");
  await page.locator("alps-contacts-list .contact-item", { hasText: name }).click();
  const view = page.locator("alps-contact-view");
  await view.locator('alps-icon-btn[title="Edit Contact"]').click();
  release();

  const saved = page.waitForResponse((r) => r.request().method() === "POST" && /\/contacts\/.+\/edit/.test(r.url()));
  await view.locator('input[placeholder="Nickname"]').fill("Amazing Grace");
  expect((await saved).status()).toBe(200);

  const card = (await readContact(uid)) ?? "";
  expect(card).toContain("NICKNAME:Amazing Grace");
  expect(card).toContain("NOTE:Wrote the first compiler");
  expect(card).toContain("URL:https://navy.example");
  expect(card).toContain("BDAY:1906-12-09");
  expect(card).toMatch(/^ADR/m);
});

test("a new contact keeps what was typed during its first save, beside a card with its address", async ({ page }) => {
  // The first autosave of a new contact creates it. The editor filled its
  // form again when the path came back, losing what was typed meanwhile; and
  // a create of an address another card held answered with that card, so the
  // next autosaves edited it without a version and were refused.
  const address = `ada.${run}@example.test`;
  const uid = `e2e-ada-${run}`;
  await seedContact({ uid, name: `Ada Known ${run}`, email: address });
  await login(page);

  // The create is held until the name has been typed.
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let sent!: () => void;
  const creating = new Promise<void>((resolve) => {
    sent = resolve;
  });
  await page.route(/\/contacts\/create$/, async (route) => {
    sent();
    await held;
    await route.continue();
  });

  await page.goto("/#/contacts");
  await page.locator("alps-contacts-categories alps-create-button").click();
  const view = page.locator("alps-contact-view");
  await view.locator('input[placeholder="Email"]').fill(address);
  await creating;
  const name = view.locator('input[placeholder="Name"]');
  await name.fill(`Ada New ${run}`);
  const edited = page.waitForResponse((r) => r.request().method() === "POST" && /\/contacts\/.+\/edit/.test(r.url()));
  release();

  expect((await edited).status()).toBe(200);
  await expect(name).toHaveValue(`Ada New ${run}`);
  await expect(page.locator("alps-contacts-list .contact-item", { hasText: `Ada New ${run}` })).toBeVisible();
  expect(await readContact(uid)).toContain(`FN:Ada Known ${run}`);
});
