/**
 * What is drawn over the page, in opening order, including what lives in
 * shadow roots: the native modal dialogs, and the open menus, which are
 * popovers. A toast goes into the topmost (modal-portal.ts): inside a modal
 * so the page's inertness does not reach it, inside a menu so pressing it is
 * a click in the menu, which does not close it.
 */
const layers: HTMLElement[] = [];
export const MODAL_LAYERS_CHANGED = 'alps-modal-layers-changed';

export function modalOpened(layer: HTMLElement): void {
  if (layers.includes(layer)) return;
  layers.push(layer);
  window.dispatchEvent(new Event(MODAL_LAYERS_CHANGED));
}

export function modalClosed(layer: HTMLElement | null | undefined): void {
  const index = layer ? layers.indexOf(layer) : -1;
  if (index === -1) return;
  layers.splice(index, 1);
  window.dispatchEvent(new Event(MODAL_LAYERS_CHANGED));
}

/** A popover is a layer while it is registered; a dialog while it is also open. */
export function topModal(): HTMLElement | undefined {
  return layers.findLast(layer => layer.isConnected && (!(layer instanceof HTMLDialogElement) || layer.open));
}
