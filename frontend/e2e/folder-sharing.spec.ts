// Sharing a folder with a colleague, over the IMAP server's access lists
// (RFC 4314).
//
// sora shares the folders under its shared namespace, Shared/, with the other
// accounts of the domain; a folder of an account's own cannot be shared there.
// So the owner's folder is made under Shared/, as another client would, and
// shared from its menu at read level. The colleague then finds it among their
// shared folders, opens it and reads the message in it, and may do nothing a
// reader may not. Once the owner takes the access away, the folder is gone
// from the colleague's list.
//
// The colleague is the test's own page, whose console is watched: a reader in
// a folder they may only read must meet no refusal there.

import type { Locator, Page } from "@playwright/test";
import { createAccount, deleteAccount, deliver, expect, mailboxElsewhere, signInAs, test } from "./fixtures";

const PASSWORD = "folder-sharing-e2e-password";

function folder(page: Page, caption: string): Locator {
  return page.locator(`alps-folder-list .folder-item[title="${caption}"]`);
}

/** Opens a folder's menu: its button shows only while the row is hovered. */
async function openFolderMenu(page: Page, caption: string): Promise<Locator> {
  const row = folder(page, caption);
  await row.hover();
  await row.locator("alps-icon-btn.kebab-btn").click();
  return row.locator("button.dropdown-item");
}

/** The folder list as the server has it now, drawn afresh. */
async function relist(page: Page): Promise<void> {
  expect((await page.request.get("/mailboxes/INBOX?refresh=true")).ok()).toBe(true);
  await page.goto("/#/mailbox/INBOX");
  await page.reload();
  await expect(folder(page, "Trash")).toBeVisible();
}

test("a folder shared at read level is read by the colleague, and gone from their list once access is removed", async ({ page, browser }) => {
  const stamp = Date.now();
  const owner = `sharing-owner-${stamp}@example.test`;
  const colleague = `sharing-colleague-${stamp}@example.test`;
  const name = `Team-${stamp}`;
  const subject = `Quarterly plans ${stamp}`;
  await createAccount({ address: owner, password: PASSWORD });
  await createAccount({ address: colleague, password: PASSWORD });
  const elsewhere = await browser.newContext();
  try {
    await mailboxElsewhere("create", `Shared/${name}`, { address: owner, password: PASSWORD });
    await deliver({ subject, to: owner, recipient: owner, mailbox: `Shared/${name}`, body: "The plans are attached." });

    // The owner shares it.
    const ownerPage = await elsewhere.newPage();
    await signInAs(ownerPage, owner, PASSWORD);
    await expect(ownerPage.locator("alps-folder-list alps-sidebar-heading.shared-heading")).toContainText("Shared folders");
    await (await openFolderMenu(ownerPage, name)).filter({ hasText: "Share…" }).click();
    const dialog = ownerPage.locator("alps-folder-share-dialog");
    await expect(dialog.getByRole("heading", { name: `Share "${name}"` })).toBeVisible();
    await expect(dialog.getByText("Not shared with anyone yet.")).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "Email address" })).toBeFocused();
    await dialog.getByRole("textbox", { name: "Email address" }).fill(colleague);
    await expect(dialog.getByRole("combobox", { name: "Access", exact: true })).toHaveValue("read_only");
    await dialog.getByRole("button", { name: "Share", exact: true }).click();
    const level = dialog.getByRole("combobox", { name: `Access for ${colleague}` });
    await expect(level).toHaveValue("read_only");
    await expect(dialog.getByRole("textbox", { name: "Email address" })).toHaveValue("");

    // The colleague finds it among their shared folders and reads it.
    const other = page;
    await signInAs(other, colleague, PASSWORD);
    await expect(other.locator("alps-folder-list alps-sidebar-heading.shared-heading")).toContainText("Shared folders");
    await expect(folder(other, name)).toBeVisible();
    const offered = await openFolderMenu(other, name);
    await expect(offered.filter({ hasText: /^\s*Unsubscribe|Subscribe\s*$/ })).toHaveCount(1);
    for (const verb of ["Rename", "Delete", "Create subfolder", "Share…"]) {
      await expect(offered.filter({ hasText: verb }), verb).toHaveCount(0);
    }
    await other.keyboard.press("Escape");
    await folder(other, name).click();
    await expect(other).toHaveURL(new RegExp(`#/mailbox/Shared%2F${name}`));
    const message = other.locator("alps-message-list .message-item").filter({ hasText: subject });
    await expect(message).toBeVisible();
    await message.click();
    await expect(other.locator("alps-message-reader > .reader-body").getByText("The plans are attached.")).toBeVisible();

    // The owner takes the access away.
    await dialog.getByRole("button", { name: `Remove access for ${colleague}` }).click();
    const confirm = dialog.locator("ui-confirm");
    await expect(confirm.getByText(`${colleague} will lose access to "${name}" at once.`, { exact: false })).toBeVisible();
    await confirm.getByRole("button", { name: "Remove access", exact: true }).click();
    await expect(dialog.getByText("Not shared with anyone yet.")).toBeVisible();
    await expect(level).toHaveCount(0);
    await dialog.getByRole("button", { name: "Done", exact: true }).click();
    await expect(dialog).toHaveCount(0);

    // And the colleague's list no longer has it.
    await relist(other);
    await expect(folder(other, name)).toHaveCount(0);
    await expect(other.locator("alps-folder-list alps-sidebar-heading.shared-heading")).toHaveCount(0);
  } finally {
    await elsewhere.close();
    await deleteAccount(colleague);
    await deleteAccount(owner);
  }
});
