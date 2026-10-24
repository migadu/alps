/**
 * Which folder row is lit changes at once.
 *
 * The rows' background fade sat on the base rule, so the row losing `.active`
 * eased down over 150ms while the new one came up, and a folder switch showed
 * two rows lit, the old one reading as still selected. A CSS transition is
 * taken from the state being entered, so the resting and selected states must
 * carry none; only entering :hover fades. jsdom has no paint, so this reads
 * the rules themselves.
 */
import { describe, expect, it } from 'vitest';
import type { CSSResult } from 'lit';
import { FolderList } from '../src/components/folder-list';

/**
 * Every style rule of the folder list, @media blocks included, by selector.
 * Parsed through a <style> in the document, since jsdom builds no sheet for
 * one inside a shadow root.
 */
function rules(): Map<string, CSSStyleDeclaration[]> {
  const style = document.createElement('style');
  style.textContent = (FolderList.styles as CSSResult[]).map((part) => part.cssText).join('\n');
  document.head.appendChild(style);
  const out = new Map<string, CSSStyleDeclaration[]>();
  const visit = (list: CSSRuleList) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSStyleRule) {
        for (const selector of rule.selectorText.split(',').map((s) => s.trim())) {
          out.set(selector, [...(out.get(selector) ?? []), rule.style]);
        }
      } else if ('cssRules' in rule) {
        visit((rule as CSSGroupingRule).cssRules);
      }
    }
  };
  visit(style.sheet!.cssRules);
  style.remove();
  return out;
}

const transitions = (found: Map<string, CSSStyleDeclaration[]>, selector: string) =>
  (found.get(selector) ?? []).map((style) => style.getPropertyValue('transition')).filter(Boolean);

describe('folder rows', () => {
  it('light and unlight at once; only the hover fades', () => {
    const found = rules();
    expect(found.has('.folder-item')).toBe(true);

    expect(transitions(found, '.folder-item')).toEqual([]);
    expect(transitions(found, '.folder-item.active')).toEqual([]);
    expect(transitions(found, '.folder-item:hover')).toEqual(['background 0.15s']);
    // Hovering the selected row changes nothing it shows, so nothing fades.
    expect(transitions(found, '.folder-item.active:hover')).toEqual(['none']);
  });
});
