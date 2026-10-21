/**
 * Messages dragged out of the list onto a folder in the sidebar.
 *
 * The list writes what is being dragged into the drag's data under a type of
 * its own, and the folder list reads it back on the drop. A type nothing else
 * uses is what tells a drag of messages from a file or a stretch of selected
 * text crossing the sidebar, which must not light a folder up.
 */
export const MESSAGE_DRAG_TYPE = 'application/x-alps-messages';

export interface MessageDrag {
  /** The messages, by messageKey, so each names the folder it is in. */
  keys: string[];
  /**
   * Whether these are the checked rows. The page then acts on its selection,
   * as the selection bar's Move to does, which also covers a selection of the
   * whole folder that the keys of one page cannot describe.
   */
  selection: boolean;
}

/** Whether the drag over an element is one of messages from the list. */
export function carriesMessages(data: DataTransfer | null | undefined): boolean {
  return !!data && Array.from(data.types ?? []).includes(MESSAGE_DRAG_TYPE);
}

/** What a drag of messages carries, or null when it carries nothing usable. */
export function readMessageDrag(data: DataTransfer | null | undefined): MessageDrag | null {
  if (!carriesMessages(data)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(data!.getData(MESSAGE_DRAG_TYPE));
  } catch {
    return null;
  }
  const drag = parsed as Partial<MessageDrag> | null;
  if (!drag || !Array.isArray(drag.keys) || !drag.keys.every(key => typeof key === 'string')) return null;
  return { keys: drag.keys, selection: drag.selection === true };
}

/**
 * Whether a drop copies rather than moves: Alt, which is Option on a Mac, and
 * Ctrl, the copy modifier of a drag on Windows and Linux.
 */
export function dropCopies(e: { altKey: boolean; ctrlKey: boolean }): boolean {
  return e.altKey || e.ctrlKey;
}
