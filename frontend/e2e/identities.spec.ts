// Sending from another address.
//
// Settings › Identity keeps the other addresses the user sends from, and the
// composer offers them in a From row. What leaves is the proof: the message
// the SMTP server accepted says From that address, under its name, and was
// submitted with it as the envelope sender. The test stack's SMTP server
// refuses any sender at not-yours.test, as a mail server refuses an address
// the login may not send as, and that refusal has to reach the user as one
// about the From, with the message still on screen.

import type { Locator, Page } from "@playwright/test";
import { allowConsoleErrors, expect, login, resetDav, resetSettings, test, toast, USER, waitForSent, type SentMessage } from "./fixtures";

test.afterEach(async ({ page }) => {
  // A composer left open would file its draft into the shared mailbox.
  const composer = page.locator("alps-floating-composer").first();
  if (await composer.locator(".window-frame").isVisible().catch(() => false)) {
    await composer.locator(".send-actions").getByRole("button", { name: "Discard", exact: true }).click({ timeout: 2_000 }).catch(() => {});
    await composer.locator("ui-confirm").getByRole("button", { name: "Discard", exact: true }).click({ timeout: 2_000 }).catch(() => {});
  }
  await page.goto("about:blank");
  await resetSettings();
});

// The recipients of a sent message are saved as contacts.
test.afterAll(async () => {
  await resetDav();
});

/** The Sending addresses group of Settings › Identity. */
const addresses = (page: Page) => page.locator("alps-identities-settings");

/** Opens Settings › Identity once the account's settings have been read:
 * nothing is saved before then. */
async function openIdentity(page: Page): Promise<void> {
  const read = page.waitForResponse((r) => new URL(r.url()).pathname === "/settings" && r.request().method() === "GET");
  await login(page);
  expect((await read).ok(), "the account's settings could not be read").toBe(true);
  await page.goto("/#/settings/identity");
  await expect(addresses(page).getByRole("button", { name: "Add address" })).toBeVisible();
}

/** Adds an address under Sending addresses, and waits for the server to keep it. */
async function addAddress(page: Page, name: string, address: string): Promise<void> {
  await addresses(page).getByRole("button", { name: "Add address" }).click();
  // The form opens with the focus in its first field, the name.
  await page.keyboard.type(name);
  await addresses(page).getByLabel("Email address").fill(address);
  const saved = page.waitForResponse((r) => new URL(r.url()).pathname === "/settings" && r.request().method() === "PUT" && r.ok());
  await addresses(page).getByLabel("Email address").press("Enter");
  await saved;
  await expect(addresses(page).locator(".identity").filter({ hasText: address })).toContainText(name);
}

async function compose(page: Page, subject: string): Promise<Locator> {
  await page.locator("settings-window .close-btn").click();
  await page.locator("alps-folder-list alps-create-button").click();
  const composer = page.locator("alps-floating-composer");
  await expect(composer.locator(".window-frame")).toBeVisible();
  const input = composer.locator("alps-address-input input").first();
  await input.fill(USER.address);
  await input.press("Enter");
  await composer.getByPlaceholder("Subject").fill(subject);
  const editor = composer.locator(".ProseMirror");
  await editor.click();
  await editor.pressSequentially("Sent from another address.");
  return composer;
}

async function sendNow(page: Page, composer: Locator): Promise<void> {
  await composer.locator(".send-actions").getByRole("button", { name: "Send", exact: true }).click();
  const sending = toast(page, "Message is being sent");
  await expect(sending).toBeVisible();
  await sending.locator(".dismiss-btn").click();
}

/** A header of a submitted message, unfolded. */
function header(message: SentMessage, name: string): string | null {
  const head = message.data.split(/\r?\n\r?\n/, 1)[0].replace(/\r?\n[ \t]+/g, " ");
  const line = head.split(/\r?\n/).find((l) => l.toLowerCase().startsWith(`${name.toLowerCase()}:`));
  return line === undefined ? null : line.slice(name.length + 1).trim();
}

test("a message is sent from an address added under Identity", async ({ page }) => {
  const subject = `From another address ${Date.now()}`;
  await openIdentity(page);
  await addAddress(page, "Ada at the Engine", "engines@work.test");

  const composer = await compose(page, subject);
  const from = composer.getByRole("combobox", { name: "From" });
  // A new message starts from the account.
  await expect(from).toHaveValue(USER.address);
  await from.selectOption("engines@work.test");
  await sendNow(page, composer);

  const sent = await waitForSent((m) => header(m, "Subject") === subject, 20_000);
  expect(sent.from).toBe("engines@work.test");
  expect(header(sent, "From")).toMatch(/^"?Ada at the Engine"? <engines@work\.test>$/);
  await expect(composer).toHaveCount(0);
});

test("a From the mail server refuses is said as such, and the message stays", async ({ page }) => {
  const subject = `From a refused address ${Date.now()}`;
  await openIdentity(page);
  await addAddress(page, "Not Mine", "ada@not-yours.test");

  const composer = await compose(page, subject);
  await composer.getByRole("combobox", { name: "From" }).selectOption("ada@not-yours.test");
  // The refusal is a 403, which the browser logs as a failed request.
  allowConsoleErrors(page, /403/, /Failed to send message/);
  await sendNow(page, composer);

  await expect(toast(page, "You cannot send from this address. Choose another From address.")).toBeVisible();
  await expect(composer.locator(".window-frame")).toBeVisible();
  await expect(composer.getByPlaceholder("Subject")).toHaveValue(subject);
  await expect(composer.getByRole("combobox", { name: "From" })).toBeFocused();
});
