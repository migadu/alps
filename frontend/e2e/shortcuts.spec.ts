// Keys typed into something above the mailbox belong to that thing.
//
// The mailbox's own keys live on the message list: the arrows move its
// focused row, Enter opens that row, Space selects it. Above the list sit the
// surfaces that take keys of their own — a composer and its fields, a modal
// dialog, the attachment preview (which takes Escape and the arrows at the
// window, ahead of everything else, for as long as it is up) and the dropdown
// menus (which take the arrows, Enter and Space inside their dialog, and leave
// a space typed into a field inside them alone; see utils/active-element.ts).
//
// What these tests hold is that a key a user types into one of those surfaces
// does not act on anything behind it, and that the mailbox answers its keys
// again once the surface is gone. Only a browser can show that: it needs real
// focus, real shadow roots and a window that renders before focus arrives in
// it.

import type { Locator, Page } from "@playwright/test";
import { deliver, expect, login, test, USER } from "./fixtures";

const unique = () => Math.random().toString(36).slice(2);

/**
 * Typed text with a space in it. A space is what a focused BUTTON takes as a
 * click, so text typed while focus is still on the button that opened a window
 * does not merely go missing: it presses that button again.
 */
const TYPED = "two words";

const composers = (page: Page) => page.locator("alps-floating-composer");

/** One row of the message list, by subject. */
function listRow(page: Page, subject: string) {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

/** Rows the list holds as selected: what a Space on the focused row adds to. */
function selectedRows(page: Page) {
  return page.locator("alps-message-list input.message-checkbox:checked");
}

/**
 * What has focus, looking through shadow roots, as `tag.class.class`.
 * `document.activeElement` alone stops at the first shadow host.
 */
function deepFocus(page: Page): Promise<string> {
  return page.evaluate(() => {
    let el = document.activeElement;
    while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
    return el ? [el.tagName.toLowerCase(), ...Array.from(el.classList)].join(".") : "";
  });
}

/**
 * Opens the message by clicking its row, which also puts focus in the list —
 * the one place the mailbox's keys work — with that row as its focused row.
 * Returns the URL of the open message, to prove later that nothing opened
 * another one.
 */
async function openFromList(page: Page, row: Locator, body: string): Promise<string> {
  await row.locator(".message-subject").click();
  await expect(page.locator("alps-message-reader pre.reader-preformatted")).toContainText(body);
  await expect(row).toHaveClass(/focused/);
  await expect(page).toHaveURL(/uid=\d+/);
  return page.url();
}

/**
 * Nothing behind the surface moved: the same message is open, the list's
 * focused row is still that message, and nothing got selected.
 */
async function expectMailboxUntouched(page: Page, row: Locator, openedAt: string, body: string): Promise<void> {
  expect(page.url(), "another message was opened from behind").toBe(openedAt);
  await expect(page.locator("alps-message-reader pre.reader-preformatted")).toContainText(body);
  await expect(row, "the list's focused row moved from behind").toHaveClass(/focused/);
  await expect(selectedRows(page), "a message was selected from behind").toHaveCount(0);
}

/**
 * The list answers its keys again: with focus back in it, ArrowDown moves the
 * focused row off the open message. This is also what makes the negative
 * checks above mean something — the same key, reaching the list, visibly
 * moves it.
 */
async function expectListAnswersKeys(page: Page, row: Locator, message: string): Promise<void> {
  await row.locator(".message-subject").click();
  await expect(row).toHaveClass(/focused/);
  await page.keyboard.press("ArrowDown");
  await expect(row, message).not.toHaveClass(/focused/);
}

/**
 * Abandons every open draft the way a user does, so the shared mailbox keeps
 * no litter and the autosave never fires into a closing page.
 */
async function discardAll(page: Page): Promise<void> {
  for (let open = await composers(page).count(); open > 0; open--) {
    const composer = composers(page).first();
    await composer.locator(".send-actions").getByRole("button", { name: "Discard", exact: true }).click();
    // A draft with anything in it asks first; a blank one just closes.
    const confirm = composer.locator("ui-confirm").getByRole("button", { name: "Discard", exact: true });
    await expect(async () => {
      if (await confirm.isVisible()) await confirm.click();
      await expect(composers(page)).toHaveCount(open - 1, { timeout: 500 });
    }).toPass({ timeout: 10_000 });
  }
}

/** A plain-text message with a body the reader shows, delivered to the account. */
async function deliverGuarded(subject: string): Promise<void> {
  await deliver({ subject, body: "Guard body." });
}

/**
 * A message ahead of the one under test, so the list always has a row for
 * ArrowDown to move to — even on a fresh account where these are the only
 * messages.
 */
async function deliverNeighbour(): Promise<void> {
  await deliver({ subject: `Shortcuts neighbour ${unique()}` });
}

test.afterEach(async ({ page }) => {
  await discardAll(page).catch(() => {});
});

// The editor holds focus by the time the window is on screen. Until it does,
// focus is on the button that opened the window: a letter typed then is lost,
// and a space clicks that button again and opens a second composer.
test("typing the moment a composer opens is text, not a click on Compose", async ({ page }) => {
  await login(page);

  await page.locator("alps-folder-list alps-create-button").click();
  const composer = composers(page).first();
  await expect(composer.locator(".window-frame")).toBeVisible();

  // No click into a field first: the point is the gap between the window
  // appearing and focus arriving in it.
  await page.keyboard.type(TYPED);

  // One window. A space that reached the Compose button behind it would have
  // opened a second.
  await expect(composers(page)).toHaveCount(1);
  // And the letters are in the draft rather than lost.
  await expect(composer.locator(".ProseMirror")).toContainText(TYPED);
});

// As above, for a reply: a stray key on the Reply button behind the window
// would answer the same message twice, and a lost letter changes the reply.
test("typing the moment a reply opens is text, not a second reply", async ({ page }) => {
  const subject = `Shortcuts reply ${unique()}`;
  await deliverGuarded(subject);
  await login(page);

  await openFromList(page, listRow(page, subject), "Guard body.");

  // Reply, which is where a user is most likely to start typing immediately —
  // and where a stray key on the Reply button behind the window answers the
  // same message twice.
  await page.locator("alps-message-reader").getByRole("button", { name: "Reply", exact: true }).click();
  const composer = composers(page).first();
  await expect(composer.locator(".window-frame")).toBeVisible();
  await page.keyboard.type(TYPED);

  await expect(composers(page)).toHaveCount(1);
  await expect(composer.locator(".ProseMirror")).toContainText(TYPED);
});

test("typing in a reply's fields never reaches the mailbox behind it", async ({ page }) => {
  const subject = `Shortcuts fields ${unique()}`;
  await deliverNeighbour();
  await deliverGuarded(subject);
  await login(page);

  const row = listRow(page, subject);
  const openedAt = await openFromList(page, row, "Guard body.");

  await page.locator("alps-message-reader").getByRole("button", { name: "Reply", exact: true }).click();
  const composer = composers(page).first();
  await expect(composer.locator(".window-frame")).toBeVisible();
  // The window moves focus into its editor on its own, a moment after it
  // appears (the defect above); clicking into a field before that would have
  // the click overruled mid-typing. So this waits for it.
  await expect.poll(() => deepFocus(page)).toContain("ProseMirror");

  // Every key the list binds, typed where the user is writing.
  const listKeys = async (field: Locator) => {
    await field.press("Space");
    await field.press("ArrowDown");
    await field.press("ArrowUp");
  };

  // The subject line: a plain <input>.
  const subjectField = composer.getByPlaceholder("Subject", { exact: true });
  await subjectField.click();
  await subjectField.press("End");
  await subjectField.pressSequentially(TYPED);
  await listKeys(subjectField);
  await expect(subjectField).toHaveValue(new RegExp(`${TYPED} $`));

  // The rich-text body, whose contenteditable div is not an <input> at all,
  // and where Enter is a new line.
  const editor = composer.locator(".ProseMirror");
  await editor.click();
  await editor.pressSequentially(TYPED);
  await editor.press("Enter");
  await editor.pressSequentially("next line");
  await listKeys(editor);
  await expect(editor).toContainText(TYPED);
  await expect(editor).toContainText("next line");

  // A field inside a menu: the link form sits in a dropdown whose dialog
  // takes Space as "activate". Typed into its text field, a space is text.
  await composer.getByRole("button", { name: "Insert Link", exact: true }).click();
  const linkText = composer.locator("#linkPopup input#text");
  await expect(linkText).toBeVisible();
  // The form fills its fields a moment after opening, which can overwrite
  // what was typed before that; so the typing is retried until it stands.
  await expect(async () => {
    await linkText.fill("");
    await linkText.pressSequentially(TYPED);
    await expect(linkText).toHaveValue(TYPED, { timeout: 500 });
  }).toPass({ timeout: 10_000 });
  await page.keyboard.press("Escape");
  await expect(linkText).toBeHidden();

  await expect(composers(page)).toHaveCount(1);
  await expectMailboxUntouched(page, row, openedAt, "Guard body.");
  // An open composer does not mute the list either.
  await expectListAnswersKeys(page, row, "the composer kept the keyboard from the list");
});

/**
 * One layer up: a modal dialog is on screen, and the keys must not act on the
 * mailbox behind it.
 *
 * `ui-modal` is a native `<dialog>` opened with `showModal()`, so the page
 * behind it is inert to the mouse; the keyboard is the part a key handler
 * outside the dialog could still hear. The new-folder prompt stands in for
 * every dialog: it is a plain `ui-modal`, reachable with a message open.
 */
test("a dialog above the mailbox owns the keyboard", async ({ page }) => {
  const subject = `Shortcuts dialog ${unique()}`;
  await deliverNeighbour();
  await deliverGuarded(subject);
  await login(page);

  const row = listRow(page, subject);
  const openedAt = await openFromList(page, row, "Guard body.");

  await page.locator("mailbox-page").getByRole("button", { name: "Create Folder", exact: true }).click();
  const dialog = page.locator("alps-folder-list ui-prompt dialog.modal-dialog");
  await expect(dialog).toBeVisible();
  const name = page.locator("alps-folder-list ui-prompt input");
  await expect(name).toBeVisible();

  // The list's movement keys, then text: the dialog keeps both.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => deepFocus(page)).toMatch(/^input\b/);
  await page.keyboard.type(TYPED);
  await expect(name).toHaveValue(TYPED);
  await expect(dialog, "the dialog took a key meant for it and closed").toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  // Escape cancels: nothing was created.
  await expect(page.locator(`alps-folder-list .folder-item[title="${TYPED}"]`)).toHaveCount(0);

  await expectMailboxUntouched(page, row, openedAt, "Guard body.");
  await expectListAnswersKeys(page, row, "the dialog never gave the keyboard back");
});

/**
 * The same shape for the attachment preview.
 *
 * It is not a `ui-modal`: it paints its own full-window overlay and listens
 * for its keys on the window, in the capture phase, so that the arrows it uses
 * never reach the list underneath. That listener is also the risk — one that
 * outlived the preview would swallow Escape for the whole app.
 */
test("the attachment preview owns the keyboard while it is up", async ({ page }) => {
  const subject = `Shortcuts preview ${unique()}`;
  const boundary = "alps-shortcut-boundary";
  // A 1x1 PNG: the preview only opens for an attachment it can show.
  const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const raw = [
    "From: Ada Lovelace <ada@remote.test>",
    `To: ${USER.address}`,
    `Subject: ${subject}`,
    `Message-ID: <${unique()}@remote.test>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    "Guard body.",
    "",
    `--${boundary}`,
    'Content-Type: image/png; name="dot.png"',
    "Content-Transfer-Encoding: base64",
    'Content-Disposition: attachment; filename="dot.png"',
    "",
    png,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
  await deliverNeighbour();
  await deliver({ subject, raw });
  await login(page);

  const row = listRow(page, subject);
  const openedAt = await openFromList(page, row, "Guard body.");

  await page
    .locator("alps-message-reader alps-attachment-list.desktop-attachments")
    .getByRole("button", { name: "Preview", exact: true })
    .click();
  const preview = page.locator("alps-attachment-preview");
  await expect(preview).toHaveCount(1);
  await expect(preview.locator(".file-title")).toHaveText("dot.png");

  // A key the list uses, then the preview's own arrows, which it takes even
  // with a single attachment.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowLeft");
  await expect(preview, "a key meant for the preview closed it").toHaveCount(1);
  await expect(preview.locator(".file-title")).toHaveText("dot.png");

  await page.keyboard.press("Escape");
  await expect(preview).toHaveCount(0);
  await expectMailboxUntouched(page, row, openedAt, "Guard body.");

  // Escape belongs to the rest of the app again: a menu closes on it. A
  // capture listener left behind would take the key before the menu's dialog
  // ever saw it.
  await page.locator("alps-message-reader alps-icon-btn.more-btn").click();
  const entry = page.locator("alps-message-reader").getByRole("button", { name: "Forward", exact: true });
  await expect(entry).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(entry, "the preview never gave Escape back").toBeHidden();

  await expectListAnswersKeys(page, row, "the preview never gave the keyboard back");
});

/**
 * And the last surface of the shape: an open dropdown menu.
 *
 * `alps-popup` shows a click-triggered menu with `showModal()`, exactly as a
 * dialog does, and moves focus between its entries on the arrows — the same
 * keys the list uses to move between messages.
 */
test("an open dropdown menu owns the keyboard", async ({ page }) => {
  const subject = `Shortcuts menu ${unique()}`;
  await deliverNeighbour();
  await deliverGuarded(subject);
  await login(page);

  const row = listRow(page, subject);
  const openedAt = await openFromList(page, row, "Guard body.");

  await page.locator("alps-message-reader alps-icon-btn.more-btn").click();
  const entry = page.locator("alps-message-reader").getByRole("button", { name: "Forward", exact: true });
  await expect(entry).toBeVisible();

  // The menu takes the arrows: focus walks its entries.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => deepFocus(page)).toContain("dropdown-item");
  await expect(entry, "a key meant for the menu closed it").toBeVisible();

  await page.keyboard.press("Escape");
  await expect(entry).toBeHidden();
  await expectMailboxUntouched(page, row, openedAt, "Guard body.");

  // And the keyboard comes BACK. This half matters as much as the other: a
  // menu that kept the keys after closing would leave the list deaf to them,
  // silently, with nothing on screen to explain why.
  await expectListAnswersKeys(page, row, "the menu never gave the keyboard back");
});
