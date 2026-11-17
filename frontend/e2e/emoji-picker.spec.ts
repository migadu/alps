// The composer's emoji picker. The unit tests stand the picker in with a stub,
// so only a browser shows that it is defined, lists emoji, and puts the one
// picked into the message.

import { expect, login, test } from "./fixtures";

test("an emoji picked in the composer goes into the message", async ({ page }) => {
  await login(page);
  await page.locator("alps-folder-list alps-create-button").click();
  const composer = page.locator("alps-floating-composer");
  const editor = composer.locator(".ProseMirror");
  await expect(editor).toBeVisible();

  await composer.locator('alps-icon-btn[title="Insert Emoji"]').click();
  const emoji = composer.locator("unicode-emoji-picker").getByRole("button", { name: "😃", exact: true });
  await emoji.click();

  await expect(editor).toContainText("😃");
  await expect(composer.locator("unicode-emoji-picker")).toBeHidden();

  await composer.locator(".send-actions").getByRole("button", { name: "Discard", exact: true }).click();
  await composer.locator("ui-confirm").getByRole("button", { name: "Discard", exact: true }).click();
  await expect(composer).toHaveCount(0);
});
