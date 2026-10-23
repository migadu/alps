/**
 * Where the Settings window closes to.
 *
 * Settings is a window over the page it was opened from, with a URL of its own
 * (`#/settings/<section>`). Close, Escape and the browser's Back all have to
 * land on that page as it was: the folder, the open message, the search. The
 * page stays mounted beneath the window, so the only thing to get right is the
 * history, and the entry Settings is on carries what that takes, in its
 * `history.state`:
 *
 *  - `background`: the hash of the page beneath. The shell draws that page from
 *    it, which is how a reload of Settings still shows the folder the window was
 *    opened over, and the header beneath names its tab from it.
 *  - `depth`: how many entries back that page is. Choosing a section REPLACES
 *    the entry, so it is normally 1. A navigation from one section to another
 *    by URL pushes, and Close must walk back over it rather than land on the
 *    previous section.
 *
 * Per entry, in the entry's own state, rather than in a variable of the shell:
 * Back and Forward move between entries, and the browser restores each one's
 * state with it, so the depth is right wherever the user has walked to.
 *
 * A direct load of `#/settings/x` is the one entry with nothing behind it. The
 * shell draws the mailbox beneath it, and Close replaces the entry with the
 * Inbox's URL.
 */
import { isSettingsHash } from './routes';

export interface SettingsEntry {
  /** Entries back to the page beneath; see the module doc. */
  depth: number;
  /** That page's hash, or null when nothing is behind (a direct load). */
  background: string | null;
}

/** The key in `history.state`. Namespaced: the rest of the state is not ours. */
const STATE_KEY = 'alpsSettings';

/** The Settings entry the browser is on, or null when nobody stamped one. */
export function settingsEntry(state: unknown = history.state): SettingsEntry | null {
  const entry = (state as Record<string, unknown> | null)?.[STATE_KEY] as Partial<SettingsEntry> | undefined;
  if (!entry || typeof entry.depth !== 'number') return null;
  const background = typeof entry.background === 'string' ? entry.background : null;
  return { depth: entry.depth, background };
}

/**
 * The entry a navigation INTO Settings has just reached, from the hash it left
 * and that hash's own entry. From a page: one step back to it. From another
 * section: one step deeper over the same page, or over nothing after a direct
 * load.
 */
export function nextSettingsEntry(previousHash: string, previous: SettingsEntry | null): SettingsEntry {
  if (isSettingsHash(previousHash)) {
    return previous
      ? { depth: previous.depth + 1, background: previous.background }
      : { depth: 1, background: null };
  }
  return { depth: 1, background: previousHash && previousHash !== '#' ? previousHash : '#/' };
}

/** Writes `entry` onto the current history entry, keeping its URL and the rest
 * of its state. `replaceState` fires no `hashchange`, so nothing re-routes. */
export function stampSettingsEntry(entry: SettingsEntry): void {
  const state = (history.state && typeof history.state === 'object') ? history.state : {};
  history.replaceState({ ...state, [STATE_KEY]: entry }, '', window.location.href);
}

/**
 * The hash of the page on screen: the browser's, or, while Settings is open,
 * the page beneath it. Null under a direct load of Settings, where the page
 * beneath is the mailbox drawn without a hash of its own.
 */
export function pageHash(): string | null {
  const hash = window.location.hash;
  if (!isSettingsHash(hash)) return hash;
  return settingsEntry()?.background ?? null;
}
