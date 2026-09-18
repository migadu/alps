// Discarding a draft from its COMPOSER while the reader is showing it.
//
// Open a draft, Edit Draft, Discard in the compose window. The composer
// deletes the draft and the list re-syncs, which takes the row away but never
// closes the reader. So the deleted draft stayed open beside a list that no
// longer held it.
//
// In a browser because the fact it turns on is a UID only the IMAP server
// hands out: every save of a draft stores a new message and deletes the one
// before, so "the draft on screen" and "the draft the composer discards" are
// the same message only if the page followed each save — and in a search of
// all mailboxes, where the view is `*` and not a mailbox, it did not.

import type { Locator, Page } from "@playwright/test";
import { expect, login, test } from "./fixtures";

const composerOf = (page: Page) => page.locator("alps-floating-composer");

/** Scoped to the footer: the confirmation button is also labelled "Discard". */
const discardButton = (composer: Locator) =>
  composer.locator(".send-actions").getByRole("button", { name: "Discard", exact: true });
const confirmDiscardButton = (composer: Locator) =>
  composer.locator("ui-confirm").getByRole("button", { name: "Discard", exact: true });

function row(page: Page, subject: string) {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

async function openFolder(page: Page, title: string): Promise<void> {
  await page.locator(`alps-folder-list .folder-item[title="${title}"]`).click();
}

/** A word that exists nowhere else in the mailbox — see search.spec.ts. */
function token(): string {
  return `zq${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6).padEnd(4, "x")}`;
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

/** Writes a draft the way a user does: compose, then Save & close. */
async function saveDraft(page: Page, subject: string): Promise<void> {
  await page.locator("alps-folder-list alps-create-button").click();
  const composer = composerOf(page);
  await expect(composer.locator(".window-frame")).toBeVisible();
  await composer.getByPlaceholder("Subject").fill(subject);
  const editor = composer.locator(".ProseMirror");
  await editor.click();
  await editor.pressSequentially("A draft that will be thrown away.");
  const saved = draftSaved(page);
  await composer.locator('alps-icon-btn[title="Save & close"]').click();
  await saved;
  await expect(composer).toHaveCount(0);
}

/** Opens the listed draft in the reader and then in the composer. */
async function editDraft(page: Page, subject: string): Promise<Locator> {
  await row(page, subject).first().click();
  const reader = page.locator("alps-message-reader");
  await expect(reader).toContainText(subject);
  await reader.getByRole("button", { name: "Edit Draft" }).first().click();
  const composer = composerOf(page);
  await expect(composer.locator(".window-frame")).toBeVisible();
  return composer;
}

/** Changes the subject and waits for the save that stores it. */
async function editSubject(page: Page, composer: Locator, subject: string): Promise<void> {
  const saved = draftSaved(page);
  await composer.getByPlaceholder("Subject").fill(subject);
  await saved;
}

async function discard(composer: Locator): Promise<void> {
  await discardButton(composer).click();
  await confirmDiscardButton(composer).click();
  await expect(composer).toHaveCount(0);
}

/** The reader is showing nothing: its empty state, and not the draft. */
async function expectReaderClosed(page: Page, subject: string): Promise<void> {
  const reader = page.locator("alps-message-reader");
  await expect(reader).not.toContainText(subject);
  await expect(reader).toContainText("Select a message to read");
  expect(page.url()).not.toContain("uid=");
}

test.afterEach(async ({ page }) => {
  const composer = composerOf(page).first();
  if (!(await composer.locator(".window-frame").isVisible().catch(() => false))) return;
  await discardButton(composer).click({ timeout: 2_000 }).catch(() => {});
  await confirmDiscardButton(composer).click({ timeout: 2_000 }).catch(() => {});
});

test("discarding from the composer closes the draft open in the reader", async ({ page }) => {
  const subject = `Discard open draft ${token()}`;
  await login(page);
  await saveDraft(page, subject);
  await openFolder(page, "Drafts");

  const composer = await editDraft(page, subject);
  await discard(composer);

  await expect(row(page, subject)).toHaveCount(0);
  await expectReaderClosed(page, subject);
});

test("and still does once a save has given the draft a new UID", async ({ page }) => {
  const subject = `Discard edited draft ${token()}`;
  await login(page);
  await saveDraft(page, subject);
  await openFolder(page, "Drafts");

  const composer = await editDraft(page, subject);
  await editSubject(page, composer, `${subject} edited`);
  await expect(row(page, `${subject} edited`)).toHaveCount(1);

  await discard(composer);

  await expect(row(page, subject)).toHaveCount(0);
  await expectReaderClosed(page, subject);
});

test("and when the draft was opened from a search of all mailboxes", async ({ page }) => {
  const word = token();
  const subject = `Discard found draft ${word}`;
  await login(page);
  await saveDraft(page, subject);

  const box = page.locator("app-header alps-input input");
  await box.fill(word);
  await box.press("Enter");
  await page.locator("alps-message-list alps-banner").getByRole("button", { name: "Search All" }).click();
  await expect(row(page, subject)).toHaveCount(1);

  const composer = await editDraft(page, subject);
  // Saving over a draft opened here deleted from the view, `*`, which is no
  // mailbox: the save failed after storing its copy, and said so.
  await editSubject(page, composer, `${subject} edited`);

  await discard(composer);

  await expectReaderClosed(page, subject);
  // And nothing of it is left behind in Drafts.
  await openFolder(page, "Drafts");
  await expect(row(page, subject)).toHaveCount(0);
});
