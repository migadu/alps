import { isComposingKey } from './active-element';
import { topModal } from './modal-layers';

/** Character commands belong to the page only when no editing surface owns the key. */
export function characterShortcutAllowed(e: KeyboardEvent): boolean {
  if (e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey || isComposingKey(e) || topModal()) return false;
  return !e.composedPath().some(node => {
    if (!(node instanceof HTMLElement)) return false;
    if (node.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'reset', 'image'].includes((node as HTMLInputElement).type)) return true;
    if (['TEXTAREA', 'SELECT', 'DIALOG', 'ALPS-FLOATING-COMPOSER',
      'ALPS-ATTACHMENT-PREVIEW', 'SETTINGS-WINDOW'].includes(node.tagName)) return true;
    // The path includes editable ancestors, including across shadow boundaries.
    if (node.isContentEditable || (node.hasAttribute('contenteditable') && node.getAttribute('contenteditable') !== 'false')) return true;
    return ['textbox', 'searchbox', 'combobox', 'menu', 'listbox', 'dialog', 'spinbutton', 'slider'].includes(node.getAttribute('role') ?? '');
  });
}
