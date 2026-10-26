/**
 * Links in plain-text bodies.
 *
 * A plain-text message is rendered as text, so before this nothing in it was
 * clickable. The finder decides what becomes a link, and the decisions that
 * matter are the edges: where a URL stops (a sentence's full stop, the paren
 * around it, the angle brackets of `<https://...>`), and what is not a link at
 * all. A wrong edge is a link to a page that does not exist.
 *
 * Two properties are security rather than taste: every href is built from a
 * scheme this file recognised, so no `javascript:` can come through, and the
 * body is never parsed as markup on the way to the screen.
 */
import { render } from "lit";
import { describe, expect, it } from "vitest";
import { findLinks, renderLinkedText } from "../src/utils/linkify";

/** The linked slices of `text`, as `[label, href]` pairs. */
function links(text: string): Array<[string, string]> {
  return findLinks(text).map((l) => [text.slice(l.start, l.end), l.href]);
}

describe("findLinks: web addresses", () => {
  it("links http and https URLs", () => {
    expect(links("see https://example.com/a?b=c#d and http://example.org")).toEqual([
      ["https://example.com/a?b=c#d", "https://example.com/a?b=c#d"],
      ["http://example.org", "http://example.org"],
    ]);
  });

  it("links a bare www. host over https", () => {
    expect(links("go to www.example.com/path today")).toEqual([
      ["www.example.com/path", "https://www.example.com/path"],
    ]);
  });

  it("leaves sentence punctuation outside the link", () => {
    expect(links("Read https://example.com/a. Then https://example.com/b, ok?")).toEqual([
      ["https://example.com/a", "https://example.com/a"],
      ["https://example.com/b", "https://example.com/b"],
    ]);
  });

  it("drops a closing paren that belongs to the sentence, keeps one that belongs to the URL", () => {
    expect(links("(see https://example.com/x)")).toEqual([["https://example.com/x", "https://example.com/x"]]);
    expect(links("https://en.wikipedia.org/wiki/Foo_(bar)")).toEqual([
      ["https://en.wikipedia.org/wiki/Foo_(bar)", "https://en.wikipedia.org/wiki/Foo_(bar)"],
    ]);
  });

  it("stops at the angle brackets of <https://...>", () => {
    expect(links("<https://example.com/x>")).toEqual([["https://example.com/x", "https://example.com/x"]]);
  });

  it("links URLs inside quoted reply lines", () => {
    expect(links("> https://example.com/q\n>> www.example.org")).toEqual([
      ["https://example.com/q", "https://example.com/q"],
      ["www.example.org", "https://www.example.org"],
    ]);
  });

  it("does not start a link mid-word or mid-host", () => {
    expect(links("xhttps://example.com")).toEqual([]);
    expect(links("awww.example.com")).toEqual([]);
    expect(links("cdn.www.example.com")).toEqual([]);
  });

  it("needs something after the scheme", () => {
    expect(links("the https:// prefix, the www. prefix")).toEqual([]);
  });

  it("never produces a script link", () => {
    const text = "javascript:alert(1) JAVASCRIPT://x data:text/html,<b>x</b> vbscript:x";
    expect(findLinks(text)).toEqual([]);
  });
});

describe("findLinks: email addresses", () => {
  it("links a bare address to mailto:", () => {
    expect(links("write to ada@example.com today")).toEqual([["ada@example.com", "mailto:ada@example.com"]]);
  });

  it("keeps the punctuation and brackets around an address outside it", () => {
    expect(links("Mail me (ada@example.com).")).toEqual([["ada@example.com", "mailto:ada@example.com"]]);
    expect(links("'ada@example.com'")).toEqual([["ada@example.com", "mailto:ada@example.com"]]);
    expect(links("Ada <ada@example.com>")).toEqual([["ada@example.com", "mailto:ada@example.com"]]);
  });

  it("percent-encodes the local part but keeps the @ literal", () => {
    expect(links("ada+news@example.com")).toEqual([["ada+news@example.com", "mailto:ada%2Bnews@example.com"]]);
  });

  it("accepts internationalized addresses", () => {
    expect(links("пример@пример.рф")).toEqual([["пример@пример.рф", "mailto:%D0%BF%D1%80%D0%B8%D0%BC%D0%B5%D1%80@пример.рф"]]);
    expect(links("ada@example.xn--p1ai")).toEqual([["ada@example.xn--p1ai", "mailto:ada@example.xn--p1ai"]]);
  });

  it("wants a dotted domain with a real top-level label", () => {
    expect(links("ada@localhost, @ada, ada@, ada@example.c0m, ada@-x.com")).toEqual([]);
  });

  it("links an address with an apostrophe whole, never just its tail", () => {
    // Stopping the scan at the apostrophe linked `connor@example.com`, a
    // different person, and that is who the composer opened to.
    expect(links("o'connor@example.com")).toEqual([["o'connor@example.com", "mailto:o'connor@example.com"]]);
  });

  it("leaves an address with unusual local-part characters unlinked rather than linking its tail", () => {
    // RFC 5322 allows `=`, `/`, `|`, `{` and friends in a local part. In text
    // they are mostly the `key=` before an address, so neither reading is
    // safe to link.
    expect(links("key=ada@example.com a/b@example.com x|y@example.com")).toEqual([]);
  });

  it("strips quotes and emphasis that wrap an address", () => {
    expect(links("`ada@example.com` *bob@example.com*")).toEqual([
      ["ada@example.com", "mailto:ada@example.com"],
      ["bob@example.com", "mailto:bob@example.com"],
    ]);
  });

  it("links no part of a local part or domain longer than RFC 5321 allows", () => {
    // Linking the last 64 characters of a 65-character run would invent an
    // address nobody wrote.
    const local64 = "a".repeat(64);
    expect(links(`${local64}@example.com`)).toEqual([[`${local64}@example.com`, `mailto:${local64}@example.com`]]);
    expect(links(`b${local64}@example.com`)).toEqual([]);
    const domain = `${"d".repeat(60)}.`.repeat(5) + "com"; // 308 characters
    expect(links(`ada@${domain}`)).toEqual([]);
  });

  it("reads www.name@host as an address, not a web link", () => {
    expect(links("www.ada@example.com")).toEqual([["www.ada@example.com", "mailto:www.ada@example.com"]]);
  });

  it("links an address whose domain starts with www as one address", () => {
    expect(links("ada@www.example.com")).toEqual([["ada@www.example.com", "mailto:ada@www.example.com"]]);
  });

  it("does not pull an address out of a URL that contains one", () => {
    expect(links("https://example.com/unsubscribe?e=ada@example.com")).toEqual([
      ["https://example.com/unsubscribe?e=ada@example.com", "https://example.com/unsubscribe?e=ada@example.com"],
    ]);
  });

  it("links an explicit mailto: URI with its query", () => {
    expect(links("mailto:ada@example.com?subject=Hi")).toEqual([
      ["mailto:ada@example.com?subject=Hi", "mailto:ada@example.com?subject=Hi"],
    ]);
  });
});

describe("findLinks: cost", () => {
  // The body is the sender's, and this runs synchronously in render: a body
  // built to be slow freezes the reader. Each case below was seconds long when
  // trimming re-split the URL per closing bracket and every rejected candidate
  // re-scanned the rest of its run. Linear, each takes milliseconds.
  const budget = (fn: () => void) => {
    const t0 = performance.now();
    fn();
    return performance.now() - t0;
  };

  it("trims a URL followed by thousands of closing brackets in one pass", () => {
    const text = `https://example.com/${")".repeat(50_000)}`;
    expect(budget(() => expect(links(text)).toEqual([["https://example.com/", "https://example.com/"]]))).toBeLessThan(500);
  });

  it("does not rescan a run for every rejected candidate in it", () => {
    expect(budget(() => findLinks("http://:".repeat(20_000)))).toBeLessThan(500);
    expect(budget(() => findLinks("www.a@,".repeat(20_000)))).toBeLessThan(500);
    expect(budget(() => findLinks("mailto:,".repeat(20_000)))).toBeLessThan(500);
  });

  it("stays linear on text that is almost an address everywhere", () => {
    // A megabyte of local-part characters: an unbounded backward scan from
    // each `@` (or a regex that retries every start) is quadratic here.
    const text = `${"a".repeat(500_000)}@${"b".repeat(500_000)}`;
    const t0 = performance.now();
    findLinks(text);
    findLinks("a@".repeat(250_000));
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});

describe("renderLinkedText", () => {
  function rendered(text: string): HTMLElement {
    const host = document.createElement("pre");
    render(renderLinkedText(text), host);
    return host;
  }

  it("returns the text itself when there is nothing to link", () => {
    expect(renderLinkedText("plain words")).toBe("plain words");
  });

  it("keeps every character of the body, in order", () => {
    const text = "Hi,\nsee https://example.com/a. Or mail ada@example.com!\n";
    expect(rendered(text).textContent).toBe(text);
  });

  it("opens web links in a new context with no opener and no referrer", () => {
    const a = rendered("go https://example.com").querySelector("a")!;
    expect(a.getAttribute("href")).toBe("https://example.com");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("gives mailto links no target, so a plain click can be routed to the composer", () => {
    const a = rendered("ada@example.com").querySelector("a")!;
    expect(a.getAttribute("href")).toBe("mailto:ada@example.com");
    expect(a.hasAttribute("target")).toBe(false);
  });

  it("never parses the body as markup", () => {
    const host = rendered('<img src=x onerror=alert(1)> https://example.com/"><b>x</b>');
    expect(host.querySelectorAll("img, b")).toHaveLength(0);
    expect(host.querySelectorAll("a")).toHaveLength(1);
    expect(host.querySelector("a")!.getAttribute("href")).toBe("https://example.com/");
  });
});

it('keeps supplementary Unicode letters in the whole address instead of linking a different recipient', () => {
  const local = '𐐀ada@example.com';
  const domain = 'ada@example.com𐐀';
  expect(links(local)).toEqual([[local, `mailto:${encodeURIComponent('𐐀ada')}@example.com`]]);
  expect(links(domain)).toEqual([[domain, `mailto:${domain}`]]);
});
