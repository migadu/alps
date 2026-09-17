// What a message is not allowed to do to the page that renders it.
//
// These tests exist in the browser suite and nowhere else, because the property
// they check is enforced by the BROWSER: jsdom parses a `sandbox` attribute and
// then ignores it, so a jsdom test asserting "the script did not run" passes
// whether or not the attribute is there at all. Only a real engine can tell the
// containment working from the containment being absent.
//
// The threat is ordinary. A message body is bytes a stranger chose, rendered
// inside an authenticated session, on a page that holds the user's mail. If
// script ran there it would run with alps's origin, and with the session cookie
// every API call carries — which is the whole reason the reader renders HTML
// into a `srcdoc` frame sandboxed WITHOUT `allow-scripts`, and the reason
// `allow-same-origin`, which the reader keeps so it can size the frame to its
// content, is only safe alongside that refusal.
//
// The defence is layered: the sanitizer writes a `script-src 'none'` policy into
// the message document and removes what navigates or fetches on its own, and
// the frame refuses to run any script that is left. Each test below asserts
// the OUTCOME rather than one layer, so removing either is caught.

import type { Locator, Page } from "@playwright/test";
import { allowConsoleErrors, deliver, expect, login, test, USER } from "./fixtures";

/** The list row for a subject. */
function row(page: Page, subject: string): Locator {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

/**
 * The reader's own message frame. Anchored with `>` on the reader's body so a
 * conversation card's frame, which is a descendant of the reader too, can never
 * be the one under test.
 */
function frame(page: Page): Locator {
  return page.locator("alps-message-reader > .reader-body > .message-content iframe.reader-iframe");
}

/** Opens the message with `subject` and waits for its body frame. */
async function open(page: Page, subject: string): Promise<void> {
  await row(page, subject).locator(".message-subject").click();
  await expect(frame(page)).toBeVisible({ timeout: 15_000 });
}

/** Delivers an HTML message whose body is `html`. */
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

test.describe("the containment checks can actually detect execution", () => {
  test("the same payload DOES run when the sandbox permits scripts", async ({ page }) => {
    // A control, and the reason to trust every assertion below it.
    //
    // "The script did not run" passes trivially if the payload was never
    // capable of running, if the marker selector is wrong, or if the frame
    // never loaded — so on its own it is close to worthless as evidence. This
    // builds a frame the test itself controls, grants it `allow-scripts`, and
    // feeds it the SAME payload shape, on an alps page and so under the same
    // page Content-Security-Policy a `srcdoc` frame inherits. Seeing the marker
    // appear here proves the technique is sensitive; not seeing it in the
    // reader's frame is then a statement about the reader.
    //
    // Deliberately a throwaway frame on the login page: proving this by
    // loosening the real component would leave a genuine hole in the tree if
    // the run were interrupted.
    await page.goto("/#/login");
    const ran = await page.evaluate(async () => {
      const iframe = document.createElement("iframe");
      // `allow-scripts` WITHOUT `allow-same-origin`: the frame gets an opaque
      // origin, so the parent cannot read its document at all — which is why
      // the script reports back by message rather than by writing a marker
      // the parent then reads. Granting both here would work, but that exact
      // pair is the combination the HTML spec calls equivalent to removing
      // the sandbox, and it has no place in a test file about containment.
      iframe.setAttribute("sandbox", "allow-scripts");
      iframe.srcdoc =
        "<p id='safe'>This is the message.</p>" +
        "<script>" +
        "document.getElementById('safe').textContent = 'EXECUTED';" +
        "parent.postMessage(document.getElementById('safe').textContent, '*');" +
        "<\/script>";

      const heard = new Promise<string>((resolve) => {
        const onMessage = (event: MessageEvent) => {
          if (event.source !== iframe.contentWindow) return;
          window.removeEventListener("message", onMessage);
          resolve(String(event.data));
        };
        window.addEventListener("message", onMessage);
        setTimeout(() => resolve("NO MESSAGE"), 3000);
      });

      document.body.appendChild(iframe);
      const result = await heard;
      iframe.remove();
      return result;
    });

    expect(ran).toBe("EXECUTED");
  });
});

test.describe("a message cannot run code", () => {
  test("an inline script does not execute", async ({ page }) => {
    // The marker is written by the script itself. If it appears, script ran
    // inside an authenticated origin — which is the whole failure.
    const subject = `Inline script ${Date.now()}`;
    await deliverHtml(
      subject,
      `<p id="safe">This is the message.</p>
       <script>document.getElementById('safe').textContent = 'EXECUTED';</script>`,
    );
    await login(page);
    // Chromium logs the refusal to the console; that line IS the containment
    // working, and only appears under automation.
    allowConsoleErrors(page, /Blocked script execution/i);
    await open(page, subject);

    const body = frame(page).contentFrame().locator("body");
    await expect(body).toContainText("This is the message.");
    await expect(body).not.toContainText("EXECUTED");
  });

  test("an event handler attribute does not fire", async ({ page }) => {
    // `onerror` on a broken image is the classic delivery vector, because it
    // needs no `<script>` tag for a naive stripper to find.
    const subject = `Handler attribute ${Date.now()}`;
    await deliverHtml(
      subject,
      `<p id="safe">Ordinary text.</p>
       <img src="x" onerror="document.getElementById('safe').textContent='EXECUTED'">`,
    );
    await login(page);
    allowConsoleErrors(page, /Blocked script execution/i, /ERR_|Failed to load/i);
    await open(page, subject);

    const body = frame(page).contentFrame().locator("body");
    await expect(body).toContainText("Ordinary text.");
    await expect(body).not.toContainText("EXECUTED");
  });

  test("the frame is sandboxed, and never granted script permission", async ({ page }) => {
    // The attribute itself, stated as a contract. `allow-same-origin` appears
    // here and is only safe BECAUSE `allow-scripts` does not: granting both
    // is documented by the HTML spec as equivalent to removing the sandbox.
    const subject = `Sandbox attribute ${Date.now()}`;
    await deliverHtml(subject, "<p>Body</p>");
    await login(page);
    await open(page, subject);

    const sandbox = await frame(page).getAttribute("sandbox");
    // Present, not merely free of bad tokens: a frame with no sandbox attribute
    // at all has every permission.
    expect(sandbox).not.toBeNull();
    const tokens = (sandbox ?? "").split(/\s+/).filter(Boolean);
    expect(tokens).not.toContain("allow-scripts");
    expect(sandbox).not.toContain("allow-top-navigation");
    expect(sandbox).not.toContain("allow-forms");
  });

  test("the body is passed as srcdoc, never fetched as a URL", async ({ page }) => {
    // A `src` would be a navigation the sender controls, and would carry the
    // session's cookies to whatever it named.
    const subject = `Srcdoc only ${Date.now()}`;
    await deliverHtml(subject, "<p>Body</p>");
    await login(page);
    await open(page, subject);

    expect(await frame(page).getAttribute("src")).toBeNull();
    expect(await frame(page).getAttribute("srcdoc")).toBeTruthy();
  });

  test("a message cannot navigate the application away", async ({ page }) => {
    // Without `allow-top-navigation` the frame cannot move the top window, so
    // a meta refresh in a message is inert. If it were not, reading a message
    // could send the user to a credential-harvesting page that looks like
    // this one.
    const subject = `Redirect attempt ${Date.now()}`;
    await deliverHtml(
      subject,
      `<meta http-equiv="refresh" content="0; url=https://evil.test/">
       <p>Body</p>`,
    );
    const offsite: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).hostname === "evil.test") offsite.push(request.url());
    });

    await login(page);
    allowConsoleErrors(page, /Blocked|refused|Not allowed/i);
    await open(page, subject);

    // The message document is parsed and loaded: a refresh is acted on when
    // the parser meets it, and a zero-second one navigates as soon as the
    // document has finished loading.
    const doc = frame(page).contentFrame();
    await expect(doc.locator("body")).toContainText("Body");
    await expect
      .poll(() => frame(page).evaluate((el) => (el as HTMLIFrameElement).contentDocument?.readyState))
      .toBe("complete");
    // Then two rendering turns of the page, so a navigation queued at load
    // has had its chance to start before anything is concluded from its
    // absence — sequenced on the page's own event loop, not on a sleep.
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );

    // Still in the mailbox, on our own origin; the message is still the thing
    // in its frame; and nothing was ever asked of the address it named.
    expect(page.url()).toContain("#/mailbox");
    await expect(doc.locator("body")).toContainText("Body");
    expect(offsite).toEqual([]);
  });
});

test.describe("what a message may still do", () => {
  test("ordinary markup renders as markup", async ({ page }) => {
    // The containment must not be achieved by refusing to render HTML at all;
    // that would be a different bug with the same test outcome.
    const subject = `Rich formatting ${Date.now()}`;
    await deliverHtml(subject, "<p>Regards,<br><strong>Ada</strong> and <em>friends</em></p>");
    await login(page);
    await open(page, subject);

    const body = frame(page).contentFrame().locator("body");
    await expect(body.locator("strong")).toHaveText("Ada");
    await expect(body.locator("em")).toHaveText("friends");
  });

  test("the frame grows to fit its content", async ({ page }) => {
    // Layout, so unreachable in jsdom, where every rect is zero. A frame stuck
    // at its initial height shows one line of a long message and scrolls
    // inside itself — which reads as the message being truncated.
    const subject = `Long body ${Date.now()}`;
    await deliverHtml(
      subject,
      `<div>${Array.from({ length: 40 }, (_, i) => `<p>Paragraph ${i}.</p>`).join("")}</div>`,
    );
    await login(page);
    await open(page, subject);

    await expect
      .poll(async () => (await frame(page).boundingBox())?.height ?? 0, { timeout: 10_000 })
      .toBeGreaterThan(200);
  });
});
