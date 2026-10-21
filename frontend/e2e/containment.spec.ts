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

/** The reader's remote-content banner, which carries "Load remote content". */
function remoteBanner(page: Page): Locator {
  return page.locator("alps-message-reader .message-content alps-banner", { hasText: "remote content" });
}

/** A 1×1 GIF, what the routed proxy answers with. */
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

/**
 * Routes the sender's host and the proxy. A request straight to the sender is
 * recorded and refused; one through the proxy is recorded by the address it
 * names and answered with a GIF. Routed rather than watched: a request the
 * frame's policy refuses is still reported as a request, and only one that
 * reaches the network is routed.
 */
async function watchRemote(page: Page): Promise<{ direct: string[]; proxied: string[] }> {
  const remote = { direct: [] as string[], proxied: [] as string[] };
  await page.route(
    (url) => url.hostname === "tracker.remote.test",
    (route) => {
      remote.direct.push(route.request().url());
      return route.abort();
    },
  );
  await page.route(
    (url) => url.pathname === "/proxy",
    (route) => {
      remote.proxied.push(new URL(route.request().url()).searchParams.get("url") ?? "");
      return route.fulfill({ status: 200, contentType: "image/gif", body: GIF });
    },
  );
  return remote;
}

/**
 * Waits for the message frame to finish loading, and then two rendering
 * turns, so a fetch its styles start after load has had its chance to go out
 * before its absence is concluded.
 */
async function frameSettled(page: Page): Promise<void> {
  await expect
    .poll(() => frame(page).evaluate((el) => (el as HTMLIFrameElement).contentDocument?.readyState))
    .toBe("complete");
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
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
    // The image is refused by the message's policy, which only lets in its
    // own parts: the error event fires all the same.
    allowConsoleErrors(page, /Blocked script execution/i, /ERR_|Failed to load|Content Security Policy/i);
    await open(page, subject);

    const body = frame(page).contentFrame().locator("body");
    await expect(body).toContainText("Ordinary text.");
    await expect(body).not.toContainText("EXECUTED");
  });

  test("an SVG animation cannot turn a link into script", async ({ page }) => {
    // An animation sets the link's address while the message is shown, after
    // the sanitizer has read it. The frame's policy and sandbox would each
    // refuse the script it names; the animation itself never reaches the
    // frame, so the link is left with no address at all and a click does
    // nothing.
    const subject = `SVG animation ${Date.now()}`;
    const script = "javascript:document.getElementById('safe').textContent='EXECUTED'";
    await deliverHtml(
      subject,
      `<p id="safe">This is the message.</p>
       <svg width="200" height="40"><a id="link">
         <set attributeName="href" to="${script}"/>
         <animate attributeName="href" values="${script}" dur="1s" fill="freeze"/>
         <rect width="200" height="40" fill="#36c"/>
       </a></svg>`,
    );
    await login(page);
    await open(page, subject);

    const doc = frame(page).contentFrame();
    await expect(doc.locator("body")).toContainText("This is the message.");
    const link = await frame(page).evaluate((el) => {
      const inner = (el as HTMLIFrameElement).contentDocument;
      const anchor = inner?.querySelector<SVGAElement>("a#link");
      return { animations: inner?.querySelectorAll("set, animate").length, href: anchor?.href.animVal ?? null };
    });
    expect(link).toEqual({ animations: 0, href: "" });

    await doc.locator("rect").click();
    // Two rendering turns, so a navigation the click queued has had its
    // chance to run before its absence is concluded.
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    await expect(doc.locator("body")).toContainText("This is the message.");
    await expect(doc.locator("body")).not.toContainText("EXECUTED");
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

test.describe("a message cannot fetch around the remote-content block", () => {
  test("a relative proxy URL fetches nothing, and the message's own image still loads", async ({ page }) => {
    // The sanitizer counts and rewrites absolute and `//` URLs only, so a
    // relative `/proxy?url=…` reaches the frame as the sender wrote it. Under a
    // policy that let in the whole origin, the browser fetched the tracker
    // through alps's own proxy while remote content was blocked. The inline
    // image is the control: the policy that refuses the proxy still has to let
    // the message's own parts in.
    const subject = `Relative proxy ${Date.now()}`;
    const proxy = "/proxy?url=https%3A%2F%2Ftracker.remote.test%2Fopen.gif";
    const boundary = "alps-e2e-relative-proxy";
    const html =
      "<p>Body</p>" +
      '<img src="cid:logo@remote.test" alt="logo">' +
      `<img src="${proxy}&amp;via=img" alt="pixel">` +
      `<img srcset="${proxy}&amp;via=srcset 2x" alt="pixel">` +
      `<div style="width:10px;height:10px;background:url('${proxy}&amp;via=css')"></div>` +
      `<style>body { background: image-set('${proxy}&via=image-set' 1x) }</style>` +
      `<svg width="10" height="10"><image href="${proxy}&amp;via=svg" width="10" height="10"/></svg>`;
    await deliver({
      subject,
      raw: [
        "From: Ada Lovelace <ada@remote.test>",
        `To: ${USER.address}`,
        `Subject: ${subject}`,
        `Message-ID: <relativeproxy${Date.now()}@remote.test>`,
        `Date: ${new Date().toUTCString()}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/related; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        "Content-Type: text/html; charset=utf-8",
        "",
        html,
        "",
        `--${boundary}`,
        'Content-Type: image/png; name="logo.png"',
        'Content-Disposition: inline; filename="logo.png"',
        "Content-ID: <logo@remote.test>",
        "Content-Transfer-Encoding: base64",
        "",
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "",
        `--${boundary}--`,
        "",
      ].join("\r\n"),
    });
    // Routed rather than watched: a request the policy refuses is still
    // reported as a request, and only one that reaches the network is routed.
    const proxied: string[] = [];
    await page.route(
      (url) => url.pathname === "/proxy",
      (route) => {
        proxied.push(route.request().url());
        return route.fulfill({ status: 404 });
      },
    );

    await login(page);
    // Each refused fetch is a console line: the policy doing its job.
    allowConsoleErrors(page, /Content Security Policy/i);
    await open(page, subject);

    await expect
      .poll(() =>
        frame(page).evaluate((el) => {
          const doc = (el as HTMLIFrameElement).contentDocument;
          const logo = doc?.querySelector<HTMLImageElement>('img[alt="logo"]');
          return doc?.readyState === "complete" && logo?.complete ? logo.naturalWidth : 0;
        }),
      )
      .toBeGreaterThan(0);
    // Two rendering turns, so a fetch the styles start after load has had
    // its chance to go out before its absence is concluded.
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    expect(proxied).toEqual([]);
  });
});

test.describe("a message cannot hide remote content from the banner", () => {
  test("a CSS address written with escapes is counted, and fetches nothing", async ({ page }) => {
    // A browser reads `\75 rl(` and `u\rl(` as `url(`, and fetches the plain
    // strings of an image-set(). Uncounted, a message whose only remote
    // content was written that way showed no banner, so the reader was never
    // told it had any. The policy refused the fetches all the same, each one
    // a console error, which this test does not allow.
    const subject = `Escaped CSS ${Date.now()}`;
    const tracker = "https://tracker.remote.test";
    await deliverHtml(
      subject,
      `<style>p { background: u\\rl(${tracker}/block.gif) }</style>
       <p>Body</p>
       <div style="width:10px;height:10px;background:\\75 rl(${tracker}/attribute.gif)"></div>
       <div style="width:10px;height:10px;background-image:image-set('${tracker}/set.gif' 1x)"></div>`,
    );
    const fetched: string[] = [];
    await page.route(
      (url) => url.hostname === "tracker.remote.test",
      (route) => {
        fetched.push(route.request().url());
        return route.abort();
      },
    );

    await login(page);
    await open(page, subject);

    await expect(frame(page).contentFrame().locator("body")).toContainText("Body");
    await expect(
      page.locator("alps-message-reader .message-content alps-banner", { hasText: "remote content" }),
    ).toBeVisible();
    await expect
      .poll(() => frame(page).evaluate((el) => (el as HTMLIFrameElement).contentDocument?.readyState))
      .toBe("complete");
    // Two rendering turns, so a fetch the styles start after load has had
    // its chance to go out before its absence is concluded.
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    expect(fetched).toEqual([]);
  });

  test("an image address with a tab in its scheme is counted, and loads through the proxy as the browser reads it", async ({ page }) => {
    // A browser removes a tab from an address before it reads the scheme, so
    // this is an https image to it. Taken for a local one, it was neither
    // counted, so no banner, nor rewritten, so the frame's policy refused it:
    // a console error, which this test does not allow.
    const subject = `Tab in address ${Date.now()}`;
    await deliverHtml(
      subject,
      '<p>Body</p><img src="ht&#9;tps://tracker.remote.test/tab.gif" width="10" height="10" alt="pixel">',
    );
    const remote = await watchRemote(page);

    await login(page);
    await open(page, subject);
    await expect(frame(page).contentFrame().locator("body")).toContainText("Body");
    await expect(remoteBanner(page)).toBeVisible();
    await frameSettled(page);
    expect(remote).toEqual({ direct: [], proxied: [] });

    await remoteBanner(page).locator("alps-button").click();
    await expect.poll(() => remote.proxied).toEqual(["https://tracker.remote.test/tab.gif"]);
    expect(remote.direct).toEqual([]);
  });

  test("a url() in an SVG attribute is counted, and loads only through the proxy", async ({ page }) => {
    // An SVG presentation attribute is CSS, and a url() in it that names
    // another document fetches it: here a cursor image, and a paint server
    // whose fallback colour is drawn while it is not loaded. Neither was
    // read, so neither was counted, and the frame's policy refused the
    // cursor: a console error, which this test does not allow.
    const subject = `SVG paint ${Date.now()}`;
    await deliverHtml(
      subject,
      '<p>Body</p><svg width="40" height="40"><rect id="shape" width="40" height="40" ' +
        'fill="url(https://tracker.remote.test/paint.svg#p) #c00" ' +
        'cursor="url(https://tracker.remote.test/cursor.png), auto"/></svg>',
    );
    const remote = await watchRemote(page);

    await login(page);
    await open(page, subject);
    const doc = frame(page).contentFrame();
    await expect(doc.locator("body")).toContainText("Body");
    await expect(remoteBanner(page)).toBeVisible();
    await doc.locator("#shape").hover();
    await frameSettled(page);
    expect(remote).toEqual({ direct: [], proxied: [] });

    await remoteBanner(page).locator("alps-button").click();
    await doc.locator("#shape").hover();
    await expect.poll(() => remote.proxied).toContain("https://tracker.remote.test/cursor.png");
    expect(remote.direct).toEqual([]);
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
