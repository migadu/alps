// Message previews: the list shows the start of each message's text under its
// subject, as sora gives it (FETCH PREVIEW), with quoted text left out.
//
// Previews are opt-in: E2E_PREVIEW=1 and a PREVIEW-capable SORA_DIR run the
// positive case. Otherwise the list shows none and asks for none. An explicit
// opt-in against an unsupported server must fail the positive case.

import { deliver, expect, login, test } from "./fixtures";

const previewsOn = process.env.E2E_PREVIEW === "1";

test("the list shows a message's preview under its subject", async ({ page }) => {
  test.skip(!previewsOn, "sora runs without previews");
  const subject = `preview ${Date.now()}`;
  await deliver({ subject, body: "Lunch at noon on Friday?\r\n\r\n> the message before\r\n" });
  await login(page);

  const item = page.locator("alps-message-list .message-item").filter({ hasText: subject });
  await expect(item.locator(".message-preview")).toHaveText("Lunch at noon on Friday?");
  await expect(item.locator(".message-preview")).toHaveAttribute("dir", "auto");
});

test("a server without previews leaves the list as it was", async ({ page }) => {
  test.skip(previewsOn, "sora runs with previews");
  const asked: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/previews")) asked.push(request.url());
  });
  const subject = `no preview ${Date.now()}`;
  await deliver({ subject, body: "Lunch at noon on Friday?\r\n" });
  await login(page);

  const item = page.locator("alps-message-list .message-item").filter({ hasText: subject });
  await expect(item).toBeVisible();
  await expect(item.locator(".message-preview")).toHaveCount(0);
  expect(asked).toEqual([]);
});
