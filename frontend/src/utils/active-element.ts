/**
 * `<input>` types where a space is a CHARACTER. Every other type (radio,
 * checkbox, button, file, the pickers) takes a space as activation, which is why
 * "is it a field" is the wrong question to ask.
 */
const SPACE_IS_TEXT = new Set(['', 'text', 'search', 'url', 'email', 'password', 'tel', 'number']);

/** Whether this element would consume a space bar as typed text. */
export function consumesSpaceAsText(el: Element | null): boolean {
  if (!el) return false;
  if ((el as HTMLElement).isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'TEXTAREA') return true;
  // A space opens a native select rather than typing into it, but it is still
  // the browser's key to handle.
  if (tag === 'SELECT') return true;
  if (tag === 'INPUT') return SPACE_IS_TEXT.has(((el as HTMLInputElement).type || '').toLowerCase());
  const role = el.getAttribute('role');
  return role === 'textbox' || role === 'searchbox';
}

/**
 * Multi-line text entry, where Enter is a newline and the arrows move between
 * lines. Narrower than consumesSpaceAsText on purpose: a single-line field can
 * give the arrows away to the menu around it.
 */
export function isMultilineTextEntry(el: Element | null): boolean {
  if (!el) return false;
  return el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
}
