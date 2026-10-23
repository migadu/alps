// A message that styles itself for both colour schemes, read in either.
//
// Senders who support dark mode declare `color-scheme: light dark` and recolour
// their text in an `@media (prefers-color-scheme: dark)` block, trusting the
// client to paint a dark canvas behind it. The reader's frame answers that
// query from the operating system, whatever alps's own theme and whatever the
// frame is painted in: on a dark system the text turned white on the white
// alps paints. alps shows such a message in the scheme of the paint behind it,
// its light colours on white and its dark ones under the dark theme for message
// content.
//
// Only a browser can tell: jsdom neither evaluates media queries nor resolves
// colour schemes. Each test reads, inside the frame, the colour each piece of
// text is drawn in, and each image by the colour it draws, against the colour
// actually painted behind it: the nearest ancestor with a background, or else
// the frame's canvas. It holds the pair to the contrast body text needs.

import type { Locator, Page } from "@playwright/test";
import { deliver, expect, login, resetSettings, test, USER } from "./fixtures";

type Scheme = "light" | "dark";

/** An image of one colour, as a logo is drawn in one. */
const logo = (hex: string) =>
  `data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='80'%20height='20'%3E%3Crect%20width='80'%20height='20'%20fill='%23${hex}'/%3E%3C/svg%3E`;

/** The pattern such a message follows: transparent wrappers on the canvas, a
 * tinted panel, text recoloured for dark only in the media query (in
 * elements the dark theme for message content leaves alone too), a logo with
 * a white version for dark, and a colour that picks itself by the scheme in
 * use. Its scheme is declared on the root, important, as some senders do, and
 * again on the body and on a wrapper, which their contents inherit. */
const BOTH_SCHEMES = `<!doctype html>
<html>
<head>
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
  :root { color-scheme: light dark !important; supported-color-schemes: light dark; }
  body { color-scheme: light dark; }
  @media (prefers-color-scheme: dark) {
    .heading, .text p, .text strong { color: #FFFFFF !important; }
    .panel { background-color: #262626 !important; }
    :root .panel { background-color: rgba(255, 255, 255, 0.05) !important; }
    .panel p { color: #FFFFFF !important; }
  }
</style>
</head>
<body style="word-spacing: normal;">
  <div style="background: transparent; color-scheme: light dark;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="${logo("FFFFFF")}">
      <img src="${logo("191C1F")}" alt="Logo" width="80" height="20">
    </picture>
    <table role="presentation" width="100%" bgcolor="transparent">
      <tr><th class="heading" style="color: #191C1F;">Savings account</th></tr>
      <tr><td class="text"><p style="color: #191C1F;">The terms of your savings account are <strong style="color: #191C1F;">changing</strong>.</p></td></tr>
    </table>
    <div class="panel" style="background-color: #F4F5F6; padding: 12px;">
      <p style="color: #191C1F;">The new terms apply from the first of next month.</p>
    </div>
    <p style="color: light-dark(#191C1F, #FFFFFF);">Nothing changes until then.</p>
  </div>
</body>
</html>`;
/** What the frame shows of it: five pieces of text and the logo. */
const BOTH_SCHEMES_PARTS = 6;

/** An ordinary message: dark text, no word about colour schemes. */
const LIGHT_ONLY = `<!doctype html>
<html><body>
  <p style="color: #333333;">Minutes of Tuesday's meeting are attached.</p>
  <div style="background-color: #EEEEEE;"><p>Next meeting: Thursday.</p></div>
</body></html>`;

async function deliverHtml(subject: string, html: string): Promise<void> {
  await deliver({
    subject,
    raw: [
      "From: Ada Lovelace <ada@remote.test>",
      `To: ${USER.address}`,
      `Subject: ${subject}`,
      `Message-ID: <${subject.replace(/\W/g, "")}@remote.test>`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="utf-8"',
      "",
      html,
      "",
    ].join("\r\n"),
  });
}

const row = (page: Page, subject: string) => page.locator("alps-message-list .message-item").filter({ hasText: subject });
/** The reader's own frame, never a conversation card's. */
const readerFrame = (page: Page) => page.locator("alps-message-reader > .reader-body > .message-content iframe.reader-iframe");

/**
 * The system's colour scheme, and alps's theme as the user would leave it in
 * this browser.
 */
async function setUp(page: Page, system: Scheme, theme: Scheme): Promise<void> {
  await page.emulateMedia({ colorScheme: system });
  await page.addInitScript((theme) => {
    // Only alps's own page: not the message frame, nor the blank page a test
    // leaves for, which has no storage to write.
    if (window !== window.top || !location.protocol.startsWith("http")) return;
    localStorage.setItem("alps_settings", JSON.stringify({ themeMode: theme }));
  }, theme);
  // Settings are read once the mailbox is up, and none is changed before.
  const read = page.waitForResponse((r) => new URL(r.url()).pathname === "/settings" && r.request().method() === "GET");
  await login(page);
  await read;
  if (theme === "dark") await expect(page.locator("body")).toHaveClass(/theme-dark/);
  else await expect(page.locator("body")).not.toHaveClass(/theme-dark/);
}

/**
 * Turns on "Apply theme to HTML messages content", which the account keeps
 * on the server, and goes back to the inbox.
 */
async function themeMessageContent(page: Page): Promise<void> {
  await page.goto("/#/settings/reading");
  const toggle = page.getByLabel("Apply theme to HTML messages content");
  const saved = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/settings" && r.request().method() === "PUT" && r.ok(),
  );
  await toggle.check();
  await saved;
  await page.goto("/#/mailbox/INBOX");
}

/** Opens the message and waits until its frame has loaded and been laid out. */
async function open(page: Page, subject: string): Promise<Locator> {
  await row(page, subject).locator(".message-subject").click();
  const frame = readerFrame(page);
  await expect(frame).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(() => frame.evaluate((el) => (el as HTMLIFrameElement).contentDocument?.readyState))
    .toBe("complete");
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  return frame;
}

type Reading = { what: string; color: string; background: string; contrast: number };

/**
 * Each piece of text in the frame, and each image, with the colour it is drawn
 * in, the colour painted behind it, and the contrast between the two. An image
 * here is one of {@link logo}'s, read by the colour of the version shown.
 *
 * Behind it is the nearest ancestor whose background is opaque, with the
 * translucent ones on the way laid over it. Past the frame's root that is the
 * canvas, which shows the page behind the frame, so the walk goes on from the
 * frame element through the page, out of each shadow root by its host, and
 * ends on white, the page's own canvas.
 */
function readings(frame: Locator): Promise<Reading[]> {
  return frame.evaluate((iframe) => {
    type RGBA = [number, number, number, number];
    const parse = (value: string): RGBA => {
      const n = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n.length > 3 ? n[3] : 1];
    };
    const hex = (value: string): RGBA => [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)).concat(1) as RGBA;
    const over = (top: RGBA, under: RGBA): RGBA => {
      const a = top[3];
      return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1) as RGBA;
    };
    const luminance = ([r, g, b]: RGBA) => {
      const channel = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const css = ([r, g, b]: RGBA) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    const parentOf = (el: Element): Element | null => {
      if (el.parentElement) return el.parentElement;
      const root = el.getRootNode();
      if (root instanceof ShadowRoot) return root.host;
      // Out of the frame's document, into the page that holds it.
      return el.ownerDocument.defaultView?.frameElement ?? null;
    };
    // Each element's style as its own document computes it.
    const style = (el: Element) => el.ownerDocument.defaultView!.getComputedStyle(el);
    const behind = (el: Element): RGBA => {
      const layers: RGBA[] = [];
      for (let at: Element | null = el; at; at = parentOf(at)) {
        const layer = parse(style(at).backgroundColor);
        if (layer[3] === 0) continue;
        layers.push(layer);
        if (layer[3] === 1) break;
      }
      return layers.reduceRight<RGBA>((under, top) => over(top, under), [255, 255, 255, 1]);
    };
    const reading = (what: string, drawn: RGBA, el: Element) => {
      const background = behind(el);
      const color = over(drawn, background);
      const [light, dark] = [luminance(color), luminance(background)].sort((a, b) => b - a);
      return {
        what,
        color: css(color),
        background: css(background),
        contrast: Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100,
      };
    };

    const doc = (iframe as HTMLIFrameElement).contentDocument!;
    const ownText = (el: Element) =>
      Array.from(el.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join("").trim();
    const texts = Array.from(doc.body.querySelectorAll("*"))
      .filter((el) => ownText(el))
      .map((el) => reading(`"${ownText(el)}"`, parse(style(el).color), el));
    const images = Array.from(doc.body.querySelectorAll("img")).map((img) => {
      const fill = /fill='#([0-9a-f]{6})'/i.exec(decodeURIComponent(img.currentSrc))?.[1] ?? "000000";
      return reading(`the image "${img.alt}"`, hex(fill), img);
    });
    return [...texts, ...images];
  });
}

/** WCAG's minimum for body text. */
const READABLE = 4.5;

/**
 * Waits for every part of the frame to read against what is behind it: a
 * picture picks its source again a moment after its media changes. What is
 * still unreadable is what the failure shows.
 */
async function expectReadable(frame: Locator, parts: number): Promise<void> {
  await expect.poll(async () => (await readings(frame)).length, "every part was measured").toBe(parts);
  await expect
    .poll(async () => (await readings(frame)).filter((reading) => reading.contrast < READABLE), "parts below 4.5:1")
    .toEqual([]);
}

test.beforeAll(async () => {
  // A record another spec left behind would decide the theme instead of this
  // browser's choice.
  await resetSettings();
});

for (const system of ["light", "dark"] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`a message styled for both schemes is readable on a ${system} system in alps's ${theme} theme`, async ({ page }) => {
      const subject = `Both schemes ${system} ${theme} ${Date.now()}`;
      await deliverHtml(subject, BOTH_SCHEMES);
      await setUp(page, system, theme);

      await expectReadable(await open(page, subject), BOTH_SCHEMES_PARTS);
    });

    test(`a message with no colour scheme stays readable on a ${system} system in alps's ${theme} theme`, async ({ page }) => {
      const subject = `One scheme ${system} ${theme} ${Date.now()}`;
      await deliverHtml(subject, LIGHT_ONLY);
      await setUp(page, system, theme);

      await expectReadable(await open(page, subject), 2);
    });
  }
}

test.describe("with message content themed", () => {
  // The setting is kept on the server, and every later spec would inherit it.
  test.afterEach(async ({ page }) => {
    await page.goto("about:blank");
    await resetSettings();
    await page.request.delete("/session");
  });

  for (const system of ["light", "dark"] as const) {
    test(`a message styled for both schemes is readable on a ${system} system in alps's dark theme, with message content themed`, async ({ page }) => {
      const subject = `Both schemes themed ${system} ${Date.now()}`;
      await deliverHtml(subject, BOTH_SCHEMES);
      await setUp(page, system, "dark");
      await themeMessageContent(page);

      const frame = await open(page, subject);
      // The theme is laid over the frame once it has loaded.
      await expect
        .poll(() => frame.evaluate((el) => !!(el as HTMLIFrameElement).contentDocument?.getElementById("dark-mode-override")))
        .toBe(true);
      await expectReadable(frame, BOTH_SCHEMES_PARTS);
    });
  }
});

test("a message styled for both schemes prints readably on a dark system", async ({ page }) => {
  const subject = `Both schemes printed ${Date.now()}`;
  await deliverHtml(subject, BOTH_SCHEMES);
  await setUp(page, "dark", "dark");
  await open(page, subject);
  const uid = await page.locator("alps-message-reader").evaluate((el) => (el as HTMLElement & { message: { UID: number } }).message.UID);

  // The print page is a sheet of white, and its frame answers the same query.
  await page.emulateMedia({ media: "print", colorScheme: "dark" });
  await page.goto(`/#/print?mailbox=INBOX&uid=${uid}`);
  const frame = page.locator("print-page iframe.print-iframe");
  await expect(frame).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(() => frame.evaluate((el) => (el as HTMLIFrameElement).contentDocument?.readyState))
    .toBe("complete");
  await expectReadable(frame, BOTH_SCHEMES_PARTS);
});
