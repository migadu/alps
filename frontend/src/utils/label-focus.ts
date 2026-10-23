/**
 * A click on a field's label puts the focus in the field.
 *
 * alps-input, alps-select and alps-address-input draw their control in a
 * shadow root of their own, and are not elements a <label> can point at: the
 * browser gives a click on a label wrapped around one, or on one whose `for`
 * names it, to nothing, and the focus stayed where it was. So each field
 * watches its own tree for such a click and takes the focus itself, as a
 * native field would. It only focuses: the click opens, ticks and sends
 * nothing more than it did.
 *
 * The watch is in the capture phase, as the browser's own labels do not
 * depend on the click reaching the top of the tree: the composer's link
 * bubble stops every click inside it from going further.
 *
 * Returns what stops the watching.
 */
export function focusOnLabelClick(field: HTMLElement): () => void {
  const root = field.getRootNode() as Document | ShadowRoot;
  const onClick = (e: Event) => {
    const target = e.target;
    // A click in the field itself, inside a label around it, is the field's own.
    if (!(target instanceof Element) || field.contains(target)) return;
    const label = target.closest('label');
    if (!label) return;
    // As for a native label, a click on another control inside it is that
    // control's alone.
    const control = target.closest('button, a[href], input, select, textarea');
    if (control && label.contains(control)) return;
    // A label with `for` is the label of what it names alone, and one without
    // is the label of what it holds.
    const isItsLabel = label.htmlFor ? label.htmlFor === field.id : label.contains(field);
    if (isItsLabel) field.focus();
  };
  root.addEventListener('click', onClick, true);
  return () => root.removeEventListener('click', onClick, true);
}
