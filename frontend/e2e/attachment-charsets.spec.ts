// Downloads keep a text file's original bytes. Its preview still has to decode
// the MIME charset, including charsets outside the browser's TextDecoder list
// and UTF-16 whose byte order is selected by its BOM.

import { deliver, expect, login, test, USER } from "./fixtures";

for (const file of [
  {
    name: "Windows-1252",
    charset: "windows-1252",
    bytes: [0x43, 0x61, 0x66, 0xe9, 0x20, 0x80],
    text: "Café €",
  },
  {
    name: "IBM850",
    charset: "IBM850",
    bytes: [0x43, 0x61, 0x66, 0x82],
    text: "Café",
  },
  {
    name: "UTF-16 with a big-endian BOM",
    charset: "UTF-16",
    bytes: [0xfe, 0xff, 0x00, 0x43, 0x00, 0x61, 0x00, 0x66, 0x00, 0xe9],
    text: "Café",
  },
  {
    name: "UTF-16 with a little-endian BOM",
    charset: "UTF-16",
    bytes: [0xff, 0xfe, 0x43, 0x00, 0x61, 0x00, 0x66, 0x00, 0xe9, 0x00],
    text: "Café",
  },
]) {
  test(`an attachment in ${file.name} keeps its downloaded bytes and readable preview`, async ({ page }) => {
    const subject = `Attachment charset ${file.name} ${Date.now()}`;
    const boundary = `charset-${Date.now()}`;
    const bytes = Buffer.from(file.bytes);
    await deliver({
      subject,
      raw: [
        "From: Ada Lovelace <ada@remote.test>",
        `To: ${USER.address}`,
        `Subject: ${subject}`,
        `Message-ID: <charset-${Date.now()}@remote.test>`,
        `Date: ${new Date().toUTCString()}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        "The file is attached.",
        `--${boundary}`,
        `Content-Type: text/plain; charset=${file.charset}; name="notes.txt"`,
        'Content-Disposition: attachment; filename="notes.txt"',
        "Content-Transfer-Encoding: base64",
        "",
        bytes.toString("base64"),
        `--${boundary}--`,
        "",
      ].join("\r\n"),
    });

    await login(page);
    await page.locator("alps-message-list .message-item").filter({ hasText: subject }).locator(".message-subject").click();
    const attachments = page.locator("alps-message-reader alps-attachment-list.desktop-attachments");
    const link = attachments.locator("a.attachment-chip");
    await expect(link).toHaveAttribute("download", "notes.txt");
    const href = (await link.getAttribute("href"))!;
    const download = await page.request.get(href);
    expect(download.status(), `GET ${href}`).toBe(200);
    expect(await download.body()).toEqual(bytes);

    await attachments.getByRole("button", { name: "Preview", exact: true }).click();
    const preview = page.locator("alps-attachment-preview");
    await expect(preview.locator(".file-title")).toHaveText("notes.txt");
    await expect(preview.locator(".line-text")).toHaveText(file.text);
  });
}
