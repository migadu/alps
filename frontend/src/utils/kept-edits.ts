// Edits a page keeps in memory for its next visit, as the shell asks about
// them.
//
// The Filters and Auto-reply sections keep an unsaved edit when they go, for
// when they are opened again (managesieve's `UnsavedEdit`). It lives only in
// this tab's memory, so app-update's automatic reloads (a tab hidden for half
// an hour, a page whose module the server no longer has) threw it away as
// surely as they would an open composer. The shell's busy probe asks here,
// and those reloads wait.
//
// A registry rather than an import, because the edits are a plugin's and the
// shell knows no plugin.

interface EditKeeper {
  /** Whether an edit of this session is kept for a later visit. */
  readonly hasKeptEdit: boolean;
}

const keepers = new Set<EditKeeper>();

/** Adds a holder of kept edits to those the shell asks. */
export function registerEditKeeper(keeper: EditKeeper): void {
  keepers.add(keeper);
}

/** Whether any edit is kept for a later visit. */
export function anyEditKept(): boolean {
  for (const keeper of keepers) {
    if (keeper.hasKeptEdit) return true;
  }
  return false;
}
