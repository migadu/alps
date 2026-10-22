/**
 * Which style rules reach an element, matched by hand.
 *
 * jsdom does not resolve a shadow root's stylesheet in `getComputedStyle`, so a
 * question about how something is PAINTED has to read the rules itself. jsdom
 * does parse a `<style>` element into a CSSOM, `@supports` and `@media` blocks
 * included, and `Element.matches` answers the selector half.
 *
 * That is not the cascade: no specificity, no inheritance, and every `@media`
 * block counted as if it applied. So the questions these can answer honestly
 * are of the form "does ANY rule that paints X reach this node".
 */

/** Every style rule under `rules`, flattened out of its grouping rules. */
function flatten(rules: CSSRuleList, out: CSSStyleRule[] = []): CSSStyleRule[] {
  for (const rule of Array.from(rules)) {
    if ('selectorText' in rule) out.push(rule as CSSStyleRule);
    const nested = (rule as Partial<CSSGroupingRule>).cssRules;
    if (nested?.length) flatten(nested, out);
  }
  return out;
}

/** CSS text as rules, parsed through a throwaway `<style>` in the document. */
export function rulesOf(cssText: string): CSSStyleRule[] {
  const style = document.createElement('style');
  style.textContent = cssText;
  document.head.append(style);
  try {
    return flatten(style.sheet!.cssRules);
  } finally {
    style.remove();
  }
}

/** False, not a throw, for what jsdom cannot evaluate (`:host`, `::slotted`,
 * pseudo-elements): none of those can match an element inside the shadow root. */
export function ruleMatches(node: Element, rule: CSSStyleRule): boolean {
  try {
    return node.matches(rule.selectorText);
  } catch {
    return false;
  }
}

/** The background a rule sets, shorthand or longhand, or "" for none. */
export function backgroundOf(rule: CSSStyleRule): string {
  return rule.style.getPropertyValue('background') || rule.style.getPropertyValue('background-color');
}

/**
 * Every background a rule in `el`'s shadow root would give `node`.
 *
 * Read from the `<style>` elements, which is where lit puts `static styles`
 * under jsdom (it has no `adoptedStyleSheets`), one element per shared sheet.
 * Their TEXT, reparsed: jsdom builds no `.sheet` for a `<style>` inside a
 * shadow root, so reading `.sheet` finds no rules at all and every "no rule
 * paints this" assertion passes.
 */
export function backgroundsOf(el: HTMLElement, node: Element): string[] {
  return Array.from(el.shadowRoot?.querySelectorAll('style') ?? [])
    .flatMap((style) => rulesOf(style.textContent ?? ''))
    .filter((rule) => ruleMatches(node, rule))
    .map(backgroundOf)
    .filter(Boolean);
}
