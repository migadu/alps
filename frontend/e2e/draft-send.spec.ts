// Sending a draft from its COMPOSER while the reader is showing it.
//
// Open a draft, Edit Draft, Send. The server sends the message and deletes
// the draft it was saved as, and the list re-syncs, which takes the row away
// but never closes the reader. So the deleted draft stayed open, still
// offering Edit Draft, beside a list that no longer held it. Discarding it
// closed the reader (draft-discard.spec.ts); sending it did not.

import type { Locator, Page } from "@playwright/test";
import { expect, login, test, toast, USER, waitForSent } from "./fixtures";

const composerOf = (page: Page) => page.locator("alps-floating-composer");

/** Scoped to the footer: the confirmation button is also labelled "Discard". */
const discardButton = (composer: Locator) =>
  composer.locator(".send-actions").getByRole("button", { name: "Discard", exact: true });
const confirmDiscardButton = (composer: Locator) =>
  composer.locator("ui-confirm").getByRole("button", { name: "Discard", exact: true });
const sendButton = (composer: Locator) =>
  composer.locator(".send-actions").getByRole("button", { name: "Send", exact: true });

function row(page: Page, subject: string) {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

async function openFolder(page: Page, title: string): Promise<void> {
  await page.locator(`alps-folder-list .folder-item[title="${title}"]`).click();
}

/** A save of the draft, answered: each one stores a new message. */
function draftSaved(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/messages" &&
      response.ok(),
  );
}

/** The composer's Bcc field. */
const bccField = (composer: Locator) => composer.locator('alps-address-input[label="Bcc"]');

/** Writes a draft addressed to the account itself, and Bcc if given, then Save & close. */
async function saveDraft(page: Page, subject: string, bcc?: string): Promise<void> {
  await page.locator("alps-folder-list alps-create-button").click();
  const composer = composerOf(page);
  await expect(composer.locator(".window-frame")).toBeVisible();
  const to = composer.locator("alps-address-input input").first();
  await to.fill(USER.address);
  await to.press("Enter");
  await expect(composer.locator("alps-address-input .pill")).toContainText([USER.address]);
  if (bcc) {
    await composer.locator(".cc-bcc-toggles span", { hasText: "Bcc" }).click();
    const field = bccField(composer).locator("input");
    await field.fill(bcc);
    await field.press("Enter");
    await expect(bccField(composer).locator(".pill")).toContainText([bcc]);
  }
  await composer.getByPlaceholder("Subject").fill(subject);
  const editor = composer.locator(".ProseMirror");
  await editor.click();
  await editor.pressSequentially("A draft that will be sent.");
  const saved = draftSaved(page);
  await composer.locator('alps-icon-btn[title="Save & close"]').click();
  await saved;
  await expect(composer).toHaveCount(0);
}

test.afterEach(async ({ page }) => {
  const composer = composerOf(page).first();
  if (!(await composer.locator(".window-frame").isVisible().catch(() => false))) return;
  await discardButton(composer).click({ timeout: 2_000 }).catch(() => {});
  await confirmDiscardButton(composer).click({ timeout: 2_000 }).catch(() => {});
});

test("sending from the composer closes the draft open in the reader", async ({ page }) => {
  const subject = `Send open draft ${Date.now()}`;
  await login(page);
  await saveDraft(page, subject);
  await openFolder(page, "Drafts");

  await row(page, subject).first().click();
  const reader = page.locator("alps-message-reader");
  await expect(reader).toContainText(subject);
  await reader.getByRole("button", { name: "Edit Draft" }).first().click();
  const composer = composerOf(page);
  await expect(composer.locator(".window-frame")).toBeVisible();

  // Send, and skip the undo window: dismissing the toast sends now.
  await sendButton(composer).click();
  const sending = toast(page, "Message is being sent");
  await expect(sending).toBeVisible();
  await sending.locator(".dismiss-btn").click();
  await expect(composer).toHaveCount(0, { timeout: 20_000 });

  await expect(row(page, subject)).toHaveCount(0);
  await expect(reader).not.toContainText(subject);
  await expect(reader).toContainText("Select a message to read");
  expect(page.url()).not.toContain("uid=");
});

test("a draft reopened from Drafts keeps its Bcc, and is sent to them without naming them", async ({ page }) => {
  // A draft was stored without its Bcc. Reopened from Drafts it had none,
  // and was sent without the Bcc recipients the user had added.
  const subject = `Send draft with Bcc ${Date.now()}`;
  const hidden = "hidden@remote.test";
  await login(page);
  await saveDraft(page, subject, hidden);
  await openFolder(page, "Drafts");

  await row(page, subject).first().click();
  const reader = page.locator("alps-message-reader");
  await expect(reader).toContainText(subject);
  await reader.getByRole("button", { name: "Edit Draft" }).first().click();
  const composer = composerOf(page);
  await expect(composer.locator(".window-frame")).toBeVisible();
  await expect(bccField(composer).locator(".pill")).toContainText([hidden]);

  await sendButton(composer).click();
  const sending = toast(page, "Message is being sent");
  await expect(sending).toBeVisible();
  await sending.locator(".dismiss-btn").click();
  await expect(composer).toHaveCount(0, { timeout: 20_000 });

  const sent = await waitForSent((m) => m.data.includes(`Subject: ${subject}`), 20_000);
  expect(sent.recipients).toContain(hidden);
  expect(sent.data).not.toContain(hidden);
});

test("an autosaved draft keeps changed and cleared Bcc when edited again without reloading Drafts", async ({ page }) => {
  const subject = `Cached draft Bcc ${Date.now()}`;
  await login(page);
  await openFolder(page, "Drafts");
  const marker = `same-document-${Date.now()}`;
  await page.evaluate(value => { (window as any).reviewDocument = value; }, marker);
  await saveDraft(page, subject, "first-hidden@remote.test");

  await row(page, subject).click();
  const reader = page.locator("alps-message-reader");
  const edit = reader.getByRole("button", { name: "Edit Draft" }).first();
  await edit.click();
  let previousUid = "";
  for (const hidden of ["second-hidden@remote.test", ""]) {
    const composer = composerOf(page);
    await expect(bccField(composer).locator(".pill")).toContainText([hidden ? "first-hidden@remote.test" : "second-hidden@remote.test"]);
    await bccField(composer).locator(".pill .pill-remove").click();
    if (hidden) {
      await bccField(composer).locator("input").fill(hidden);
      await bccField(composer).locator("input").press("Enter");
    }
    const saved = draftSaved(page);
    await composer.locator('alps-icon-btn[title="Save & close"]').click();
    const response = await saved;
    const answer = await response.json();
    expect(answer.draft_uid).toBeTruthy();
    expect(String(answer.draft_uid)).not.toBe(previousUid);
    previousUid = String(answer.draft_uid);
    await expect(composer).toHaveCount(0);
    await expect(row(page, subject)).toHaveCount(1);
    await expect(row(page, subject)).not.toContainText("hidden@remote.test");
    await edit.click();
    if (hidden) await expect(bccField(composerOf(page)).locator(".pill")).toContainText([hidden]);
    else await expect(bccField(composerOf(page)).locator(".pill")).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).reviewDocument)).toBe(marker);
  }
});

test("an unreadable Bcc stays in the open composer but is not reported as stored in the draft row", async ({ page }) => {
  const subject = `Unreadable draft Bcc ${Date.now()}`;
  await login(page);
  await openFolder(page, "Drafts");
  await page.locator("alps-folder-list alps-create-button").click();
  const composer = composerOf(page);
  await expect(composer.locator(".window-frame")).toBeVisible();
  await composer.locator(".cc-bcc-toggles span", { hasText: "Bcc" }).click();
  const input = bccField(composer).locator("input");
  await input.fill("hidden@remote.test;");
  await input.press("Enter");
  const saved = draftSaved(page);
  await composer.getByPlaceholder("Subject").fill(subject);
  const answer = await (await saved).json();

  expect(answer.draft_bcc).toEqual([]);
  await expect(row(page, subject)).toHaveCount(1);
  expect(await page.locator("mailbox-page").evaluate((el, title) =>
    (el as any).messages.find((m: any) => m.Envelope.Subject === title).Envelope.Bcc, subject)).toEqual([]);
  await expect(bccField(composer).locator(".pill")).toContainText(["hidden@remote.test;"]);
});
