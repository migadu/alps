// Composing and sending.
//
// The composer is the only place in the application where a user creates
// state that does not exist on the server yet, and the send path has three
// moving parts no screenshot shows: a Send button gated on what the composer
// holds, a five-second undo window before the request is made at all, and a
// window that closes only once the server has answered. Every one of their
// failure modes looks the same from the outside — nothing happens — which is
// exactly what the console-error guard in the fixtures exists to catch.
//
// Every send here is addressed to the account's OWN address. The SMTP server
// records what was submitted and delivers it back, so a send is observable
// three ways: as the bytes that left, as the copy filed in Sent, and as mail
// arriving in the inbox.

import type { Locator, Page } from "@playwright/test";
import { expect, login, resetDav, test, toast, USER, waitForSent, type SentMessage } from "./fixtures";

/** The floating composer window. These tests keep at most one open. */
const composerOf = (page: Page) => page.locator("alps-floating-composer");

/**
 * The composer's footer buttons, by the words on them.
 *
 * `alps-button` renders a real `<button>`, and that inner button — not the
 * custom element — carries the disabled state and refuses a click, so a role
 * locator is what asserts the state a user meets. Selecting on `variant`
 * would pick a button by how it is painted.
 *
 * The `.send-actions` scope is load-bearing: the discard CONFIRMATION button
 * is also labelled "Discard", so an unscoped lookup is ambiguous the moment
 * that dialog is open. `exact` keeps "Send" from ever matching a longer label
 * that merely contains the word.
 */
const sendButton = (composer: Locator) =>
  composer.locator(".send-actions").getByRole("button", { name: "Send", exact: true });

const discardButton = (composer: Locator) =>
  composer.locator(".send-actions").getByRole("button", { name: "Discard", exact: true });

/** The destructive button in the "Discard Draft?" dialog — scoped to the dialog. */
const confirmDiscardButton = (composer: Locator) =>
  composer.locator("ui-confirm").getByRole("button", { name: "Discard", exact: true });

/** The toast that holds a send back for its undo window (`composer.sending`). */
const sendingToast = (page: Page) => toast(page, "Message is being sent");

/** The recipient pills of the composer, one per committed address. */
const pills = (composer: Locator) => composer.locator("alps-address-input .pill");

async function openComposer(page: Page): Promise<Locator> {
  await page.locator("alps-folder-list alps-create-button").click();
  const composer = composerOf(page);
  await expect(composer.locator(".window-frame")).toBeVisible();
  return composer;
}

/**
 * Types an address and commits it to a pill. Text left uncommitted in the input
 * is not a recipient, so the pill — not the typing — is the state that matters.
 */
async function addRecipient(composer: Locator, address: string): Promise<void> {
  const input = composer.locator("alps-address-input input").first();
  await input.fill(address);
  await input.press("Enter");
  await expect(pills(composer)).toContainText([address]);
}

/** Fills the subject and the rich-text body (the default compose format). */
async function fillMessage(composer: Locator, subject: string, body: string): Promise<void> {
  await composer.getByPlaceholder("Subject").fill(subject);
  const editor = composer.locator(".ProseMirror");
  await editor.click();
  await editor.pressSequentially(body);
  await expect(editor).toContainText(body);
}

/**
 * Sends and then skips the undo grace period: dismissing the toast means "send
 * now", not "cancel". A user who does nothing gets the same send five seconds
 * later; waiting it out would just make every test five seconds longer.
 */
async function sendNow(page: Page, composer: Locator): Promise<void> {
  await sendButton(composer).click();
  await expect(sendingToast(page)).toBeVisible();
  await sendingToast(page).locator(".dismiss-btn").click();
}

/** A header of a submitted message, unfolded, or null when it is absent. */
function header(message: SentMessage, name: string): string | null {
  const head = message.data.split(/\r?\n\r?\n/, 1)[0].replace(/\r?\n[ \t]+/g, " ");
  const line = head.split(/\r?\n/).find((l) => l.toLowerCase().startsWith(`${name.toLowerCase()}:`));
  return line === undefined ? null : line.slice(name.length + 1).trim();
}

/** The submission that carries `subject`, waited for. */
const sentWithSubject = (subject: string) => waitForSent((m) => header(m, "Subject") === subject, 20_000);

/**
 * Opens a folder by its EXACT name. `.folder-item` carries the displayed name
 * in `title`, and matching on that is the only safe form: filtering rows by
 * text would also match a user folder whose name merely contains it.
 */
async function openFolder(page: Page, title: string): Promise<void> {
  await page.locator(`alps-folder-list .folder-item[title="${title}"]`).click();
}

/**
 * Abandons a composer that holds content, the way a user does. Also stops the
 * three-second autosave from filing a draft into the mailbox every other spec
 * shares.
 */
async function discardDraft(composer: Locator): Promise<void> {
  await discardButton(composer).click();
  await confirmDiscardButton(composer).click();
  await expect(composer).toHaveCount(0);
}

/**
 * A test that fails with a composer still open leaves its autosave running,
 * and three seconds later that files a draft into the shared mailbox. Cleaning
 * up here rather than only on the happy path keeps one failure from leaving
 * litter behind it. Entirely best-effort: this must never turn a passing test
 * red, nor mask the real failure with one of its own.
 */
test.afterEach(async ({ page }) => {
  const composer = composerOf(page).first();
  if (!(await composer.locator(".window-frame").isVisible().catch(() => false))) return;
  // A blank composer discards without asking, so the confirmation click is
  // allowed to find nothing.
  await discardButton(composer)
    .click({ timeout: 2_000 })
    .catch(() => {});
  await confirmDiscardButton(composer)
    .click({ timeout: 2_000 })
    .catch(() => {});
});

// A sent message's recipients are saved to the address book as contacts, which
// every later spec would otherwise inherit.
test.afterAll(async () => {
  await resetDav();
});

test("the composer opens blank and the close button takes it away", async ({ page }) => {
  await login(page);
  const composer = await openComposer(page);

  // Until a subject names it, the window is titled "New Message".
  await expect(composer.locator(".header-title")).toHaveText("New Message");
  await expect(composer.getByPlaceholder("Subject")).toHaveValue("");
  await expect(pills(composer)).toHaveCount(0);
  // Nothing to send: no recipient, no body.
  await expect(sendButton(composer)).toBeDisabled();

  await composer.locator('alps-icon-btn[title="Save & close"]').click();
  await expect(composer).toHaveCount(0);
});

test("the subject names the window, and discarding asks before throwing it away", async ({ page }) => {
  const subject = `Compose discard ${Date.now()}`;
  await login(page);
  const composer = await openComposer(page);

  await composer.getByPlaceholder("Subject").fill(subject);
  // The title tracks the subject: that is how a minimized composer is told
  // apart from the other two a user is allowed to have open at once.
  await expect(composer.locator(".header-title")).toHaveText(subject);

  await discardButton(composer).click();
  // Discard deletes the saved draft outright, so it must never be a single
  // click away from typed content.
  const dialog = composer.locator("ui-confirm");
  await expect(dialog.getByText("Discard Draft?")).toBeVisible();
  await expect(dialog.getByText("Are you sure you want to discard this draft?")).toBeVisible();
  await expect(composer.locator(".window-frame")).toBeVisible();

  await confirmDiscardButton(composer).click();
  await expect(composer).toHaveCount(0);
});

test("Send stays disabled until there is a recipient", async ({ page }) => {
  const subject = `Compose no-recipient ${Date.now()}`;
  await login(page);
  const composer = await openComposer(page);
  await fillMessage(composer, subject, "A body with nobody to send it to.");

  // A subject and a body are not enough. The dangerous outcome here is not a
  // server error, it is a click that quietly does nothing at all — so assert
  // both that the control refuses and that a real click on it changes nothing.
  await expect(sendButton(composer)).toBeDisabled();
  await sendButton(composer).click({ force: true });

  // A send that had started would collapse this composer to its title bar
  // behind a spinner, hiding and locking every field, and finally close it.
  // So the end state that proves the click was refused is a composer still
  // showing what was typed and still editable — which the recipient below
  // then exercises for real, against fields a send would have disabled.
  await expect(composer.getByPlaceholder("Subject")).toBeVisible();
  await expect(composer.getByPlaceholder("Subject")).toHaveValue(subject);

  await addRecipient(composer, USER.address);
  await expect(sendButton(composer)).toBeEnabled();

  await discardDraft(composer);
});

test("sending submits the message, files it in Sent and closes the composer", async ({ page }) => {
  const subject = `Compose send ${Date.now()}`;
  const body = "Sent by the compose-send browser test.";
  await login(page);
  const composer = await openComposer(page);
  await addRecipient(composer, USER.address);
  await fillMessage(composer, subject, body);

  await sendNow(page, composer);

  // The composer closes only after the server has answered. One that vanished
  // on click would take an unsent message with it, and the user would never
  // know.
  await expect(composer).toHaveCount(0, { timeout: 20_000 });

  // What actually left: from the signed-in account, to exactly the one
  // recipient, carrying the body that was typed.
  const sent = await sentWithSubject(subject);
  expect(sent.recipients).toEqual([USER.address]);
  expect(sent.from).toBe(USER.address);
  expect(header(sent, "To")).toContain(USER.address);
  expect(sent.data).toContain(body);

  await openFolder(page, "Sent");
  await expect(page.locator("alps-message-list").getByText(subject).first()).toBeVisible({ timeout: 20_000 });
});

test("a message sent to your own address comes back to the inbox", async ({ page }) => {
  const subject = `Compose loopback ${Date.now()}`;
  await login(page);
  const composer = await openComposer(page);
  await addRecipient(composer, USER.address);
  await fillMessage(composer, subject, "This one goes all the way around.");

  await sendNow(page, composer);
  await expect(composer).toHaveCount(0, { timeout: 20_000 });

  // Still on the inbox. Sending to yourself is a real delivery, so the message
  // has to arrive through the inbound path — a Sent copy alone would prove
  // only that the message was filed, not that it was sent.
  await expect(page.locator("alps-message-list").getByText(subject).first()).toBeVisible({ timeout: 20_000 });
});

test("Undo cancels the send and gives the composer back intact", async ({ page }) => {
  const subject = `Compose undo ${Date.now()}`;
  const body = "This one should never leave.";
  await login(page);
  const composer = await openComposer(page);
  await addRecipient(composer, USER.address);
  await fillMessage(composer, subject, body);

  await sendButton(composer).click();
  await expect(sendingToast(page)).toBeVisible();
  // By NAME. The toast also carries a dismiss (X) control, and dismissing is
  // the opposite of undoing — it sends immediately instead of cancelling. A
  // selector that took "the toast's button" would send the message this test
  // exists to prove never leaves, and still look green.
  await sendingToast(page).getByRole("button", { name: "Undo", exact: true }).click();

  // The composer is minimized and locked while the undo window runs, so undo
  // is only worth anything if it hands back a window the user can still edit
  // with everything they typed still in it.
  await expect(sendingToast(page)).toHaveCount(0);
  await expect(composer.getByPlaceholder("Subject")).toBeVisible();
  await expect(composer.getByPlaceholder("Subject")).toHaveValue(subject);
  await expect(pills(composer)).toContainText([USER.address]);
  await expect(composer.locator(".ProseMirror")).toContainText(body);
  await expect(sendButton(composer)).toBeEnabled();

  await discardDraft(composer);
});

test("sending without a subject is not silently swallowed", async ({ page }) => {
  // A message without a subject is legal mail. Whatever the composer does
  // with one, it must be visible: an enabled Send whose click does nothing
  // at all — no message, no draft, no explanation — is the failure. Here the
  // answer is to send it, and the server leaves the Subject header out.
  const body = `A message that never got a subject line ${Date.now()}.`;
  await login(page);
  const composer = await openComposer(page);
  await addRecipient(composer, USER.address);
  const editor = composer.locator(".ProseMirror");
  await editor.click();
  await editor.pressSequentially(body);
  await expect(editor).toContainText(body);

  await expect(sendButton(composer)).toBeEnabled();
  await sendNow(page, composer);
  await expect(composer).toHaveCount(0, { timeout: 20_000 });

  const sent = await waitForSent((m) => m.data.includes(body), 20_000);
  expect(sent.recipients).toEqual([USER.address]);
  expect(header(sent, "Subject")).toBeNull();
});
