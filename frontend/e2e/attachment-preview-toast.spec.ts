// A toast shown while the attachment preview is open can be pressed, in a
// real browser.
//
// The preview is a modal dialog: the browser draws it above everything else
// in the page and makes the rest inert. The toasts were drawn beneath it, so
// the undo of a send that was still counting down when the user opened an
// attachment sat behind the preview, and its Undo could not be pressed. The
// toasts now move into the preview while it is open. The unit test
// (toast-over-preview.test.ts) holds where they are drawn and their deadline;
// only a browser has a top layer and an inert page to press through.

import type { Locator, Page } from "@playwright/test";
import { deliver, expect, login, sentMessages, test, toast, USER } from "./fixtures";

const unique = () => Math.random().toString(36).slice(2, 8);

/** A message with a body and one image attachment, dot.png: the preview
 * opens for an attachment it can show. */
async function deliverWithImage(subject: string): Promise<void> {
  const boundary = "alps-preview-toast-boundary";
  // A 1x1 PNG.
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
    "A picture.",
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
  await deliver({ subject, raw });
}

/** Opens the message in the reader. */
async function openMessage(page: Page, subject: string): Promise<void> {
  await page.locator("alps-message-list .message-item").filter({ hasText: subject }).locator(".message-subject").click();
  await expect(page.locator("alps-message-reader pre.reader-preformatted")).toContainText("A picture.");
}

/** Opens the open message's attachment in the preview. */
async function previewAttachment(page: Page): Promise<Locator> {
  await page
    .locator("alps-message-reader alps-attachment-list.desktop-attachments")
    .getByRole("button", { name: "Preview", exact: true })
    .click();
  const preview = page.locator("alps-attachment-preview");
  await expect(preview.locator(".file-title")).toHaveText("dot.png");
  return preview;
}

test("a toast raised while the preview is open is drawn over it, and its button works", async ({ page }) => {
  const subject = `Preview toast ${unique()}`;
  await deliverWithImage(subject);
  await login(page);
  await openMessage(page, subject);
  const preview = await previewAttachment(page);

  // Any toast with an action, as a plugin or a store raises one.
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: {
        message: "Something to take back",
        actionLabel: "Undo",
        actionFn: () => { (window as unknown as { __undone: boolean }).__undone = true; },
        duration: 10_000,
      },
    }));
  });
  const raised = toast(page, "Something to take back");
  await raised.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(raised).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __undone?: boolean }).__undone)).toBe(true);
  // The preview is still there: the press was the toast's, not the backdrop's.
  await expect(preview).toHaveCount(1);
});

test("a send's Undo, still counting down when the preview opens, takes the send back", async ({ page }) => {
  const subject = `Preview toast ${unique()}`;
  const outgoing = `Preview undo ${unique()}`;
  await deliverWithImage(subject);
  await login(page);
  await openMessage(page, subject);

  await page.locator("alps-folder-list alps-create-button").click();
  const composer = page.locator("alps-floating-composer");
  const to = composer.locator("alps-address-input input").first();
  await to.fill(USER.address);
  await to.press("Enter");
  await composer.getByPlaceholder("Subject").fill(outgoing);
  const body = composer.locator(".ProseMirror");
  await body.click();
  await body.pressSequentially("Never sent.");
  await composer.locator(".send-actions").getByRole("button", { name: "Send", exact: true }).click();
  const sending = toast(page, "Message is being sent");
  await expect(sending).toBeVisible();

  // Within the send's five seconds.
  const preview = await previewAttachment(page);
  await sending.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(sending).toHaveCount(0);

  // A send taken back gives the window back, open and editable; a send that
  // went out would have closed it.
  await page.keyboard.press("Escape");
  await expect(preview).toHaveCount(0);
  await expect(composer.getByPlaceholder("Subject")).toHaveValue(outgoing);
  await expect(composer.locator(".send-actions").getByRole("button", { name: "Send", exact: true })).toBeEnabled();
  expect((await sentMessages()).filter((m) => m.data.includes(outgoing))).toEqual([]);

  // Abandoned, so its autosave files no draft into the shared mailbox.
  await composer.locator(".send-actions").getByRole("button", { name: "Discard", exact: true }).click();
  await composer.locator("ui-confirm").getByRole("button", { name: "Discard", exact: true }).click();
  await expect(composer).toHaveCount(0);
});
