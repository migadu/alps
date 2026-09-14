/**
 * Which keys a focused element owns.
 *
 * alps-popup turns Space and Enter into a click and takes the arrows for menu
 * navigation. Keystrokes from slotted fields bubble to it, so asking "is this a
 * field?" is not enough: a space typed into a link field was swallowed, while a
 * checkbox still needs Space as activation.
 */
import { describe, expect, it } from 'vitest';
import { consumesSpaceAsText, isMultilineTextEntry } from '../src/utils/active-element';

const input = (type?: string) => {
  const el = document.createElement('input');
  if (type !== undefined) el.type = type;
  return el;
};

const editable = () => {
  // jsdom does not implement isContentEditable.
  const el = document.createElement('div');
  Object.defineProperty(el, 'isContentEditable', { value: true });
  return el;
};

describe('consumesSpaceAsText', () => {
  it('is true for inputs that type a space', () => {
    for (const type of ['text', 'search', 'url', 'email', 'password', 'tel', 'number']) {
      expect(consumesSpaceAsText(input(type)), type).toBe(true);
    }
    expect(consumesSpaceAsText(input())).toBe(true);
  });

  it('is false for inputs that take Space as activation', () => {
    for (const type of ['checkbox', 'radio', 'button', 'submit', 'file', 'color']) {
      expect(consumesSpaceAsText(input(type)), type).toBe(false);
    }
  });

  it('is true for a textarea, a select, and editable content', () => {
    expect(consumesSpaceAsText(document.createElement('textarea'))).toBe(true);
    expect(consumesSpaceAsText(document.createElement('select'))).toBe(true);
    expect(consumesSpaceAsText(editable())).toBe(true);
  });

  it('honours an ARIA text role', () => {
    const box = document.createElement('div');
    box.setAttribute('role', 'textbox');
    expect(consumesSpaceAsText(box)).toBe(true);
    box.setAttribute('role', 'searchbox');
    expect(consumesSpaceAsText(box)).toBe(true);
  });

  it('is false for a button, a menu item, or nothing', () => {
    expect(consumesSpaceAsText(document.createElement('button'))).toBe(false);
    const item = document.createElement('div');
    item.setAttribute('role', 'menuitem');
    expect(consumesSpaceAsText(item)).toBe(false);
    expect(consumesSpaceAsText(null)).toBe(false);
  });
});

describe('isMultilineTextEntry', () => {
  it('is true only where Enter makes a new line', () => {
    expect(isMultilineTextEntry(document.createElement('textarea'))).toBe(true);
    expect(isMultilineTextEntry(editable())).toBe(true);
  });

  it('leaves a single-line field to submit on Enter', () => {
    // Falsy rather than false: without isContentEditable in jsdom the check
    // reads undefined, where a browser reads false.
    expect(isMultilineTextEntry(input('text'))).toBeFalsy();
    expect(isMultilineTextEntry(document.createElement('select'))).toBeFalsy();
    expect(isMultilineTextEntry(null)).toBe(false);
  });
});
