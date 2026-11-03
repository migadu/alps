/** Native modal dialogs in their opening order, including dialogs in shadow roots. */
const layers: HTMLDialogElement[] = [];
export const MODAL_LAYERS_CHANGED = 'alps-modal-layers-changed';

export function modalOpened(dialog: HTMLDialogElement): void {
  if (layers.includes(dialog)) return;
  layers.push(dialog);
  window.dispatchEvent(new Event(MODAL_LAYERS_CHANGED));
}

export function modalClosed(dialog: HTMLDialogElement | null | undefined): void {
  const index = dialog ? layers.indexOf(dialog) : -1;
  if (index === -1) return;
  layers.splice(index, 1);
  window.dispatchEvent(new Event(MODAL_LAYERS_CHANGED));
}

export function topModal(): HTMLDialogElement | undefined {
  return layers.findLast(dialog => dialog.isConnected && dialog.open);
}
