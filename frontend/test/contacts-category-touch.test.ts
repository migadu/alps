/**
 * A contacts category's menu on a touch screen.
 *
 * The menu (Rename, Delete) is shown while its row is hovered, under
 * `(hover: hover)`, or holds the keyboard. A touch screen does neither: it has
 * no hover, and a tap leaves no :focus-visible. So no category could be
 * renamed or deleted there. The selected category now shows its menu on a
 * screen without hover, as the folder list's open folder does on a phone.
 *
 * jsdom evaluates no media query and paints nothing, so this reads the rules
 * a touch screen applies and asks which rows they show a menu on. The browser
 * test e2e/contacts-touch.spec.ts taps through the menu with touch emulated.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { CSSResult } from 'lit';
import { AlpsContactsCategories } from '../../plugins/carddav/frontend/contacts-categories';
import { CATEGORY_FAVORITES } from '../../plugins/carddav/frontend/constants';
import { cleanup, mount, shadowAll } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

/** The style rules inside the categories' `@media (hover: none)` blocks. */
function touchRules(): CSSStyleRule[] {
  const style = document.createElement('style');
  style.textContent = (AlpsContactsCategories.styles as CSSResult[]).map((part) => part.cssText).join('\n');
  document.head.appendChild(style);
  try {
    return Array.from(style.sheet!.cssRules)
      .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && /\(hover:\s*none\)/.test(rule.conditionText))
      .flatMap((rule) => Array.from(rule.cssRules))
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);
  } finally {
    style.remove();
  }
}

/** Whether a touch screen's rules show the menu of the row named `name`. */
function menuShownByTouch(el: El, name: string): boolean {
  const row = shadowAll(el, '.category-item').find((r) => r.querySelector('.category-name')?.textContent === name);
  const actions = row?.querySelector('.category-actions');
  if (!actions) return false;
  return touchRules().some((rule) => actions.matches(rule.selectorText) && rule.style.getPropertyValue('display') === 'flex');
}

afterEach(() => cleanup());

describe("a contacts category's menu on a touch screen", () => {
  it('is shown on the selected category, and only there', async () => {
    const el = await mount<El>('alps-contacts-categories', {
      i18nStore,
      contacts: [{ uid: '1', categories: ['Chess', 'Go'] }],
      uniqueCategories: ['Chess', 'Go', CATEGORY_FAVORITES],
      selectedCategory: 'Chess',
    });

    expect(menuShownByTouch(el, 'Chess')).toBe(true);
    expect(menuShownByTouch(el, 'Go')).toBe(false);
  });
});
