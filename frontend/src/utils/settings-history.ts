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
  /** The actual history entry beneath this window. Null for a direct load;
   * omitted only by older entries. Its identity distinguishes Back from an
   * unrelated navigation to the same URL. */
  origin?: string | null;
}

/** The key in `history.state`. Namespaced: the rest of the state is not ours. */
const STATE_KEY = 'alpsSettings';
const PAGE_KEY = 'alpsPageEntry';
export const BACKGROUND_CHANGED_EVENT = 'settings-background-changed';

/** Identity of a non-Settings history entry, retained by silent rewrites. */
export function pageEntryId(state: unknown = history.state): string | null {
  const id = (state as Record<string, unknown> | null)?.[PAGE_KEY];
  return typeof id === 'string' ? id : null;
}

/** Mark the page before Settings can be opened over it. A hash navigation
 * creates another entry; a silent replace keeps this one's identity. */
export function ensurePageEntry(): string {
  const state = history.state && typeof history.state === 'object' ? { ...history.state } : {};
  const id = pageEntryId(state) ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
  if (state[PAGE_KEY] !== id || STATE_KEY in state) {
    delete state[STATE_KEY];
    history.replaceState({ ...state, [PAGE_KEY]: id }, '', window.location.href);
  }
  return id;
}

/** The Settings entry the browser is on, or null when nobody stamped one. */
export function settingsEntry(state: unknown = history.state): SettingsEntry | null {
  const entry = (state as Record<string, unknown> | null)?.[STATE_KEY] as Partial<SettingsEntry> | undefined;
  if (!entry || typeof entry.depth !== 'number') return null;
  const background = typeof entry.background === 'string' ? entry.background : null;
  const origin = entry.origin;
  return { depth: entry.depth, background, ...(origin === null || typeof origin === 'string' ? { origin } : {}) };
}

/**
 * The entry a navigation INTO Settings has just reached, from the hash it left
 * and that hash's own entry. From a page: one step back to it. From another
 * section: one step deeper over the same page, or over nothing after a direct
 * load.
 */
export function nextSettingsEntry(previousHash: string, previous: SettingsEntry | null, origin?: string | null): SettingsEntry {
  if (isSettingsHash(previousHash)) {
    return previous
      ? { ...previous, depth: previous.depth + 1 }
      : { depth: 1, background: null, ...(origin === undefined ? {} : { origin: null }) };
  }
  return { depth: 1, background: previousHash && previousHash !== '#' ? previousHash : '#/', ...(origin === undefined ? {} : { origin }) };
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

/** A live page can change beneath Settings: a draft gets another UID, a
 * folder disappears, or a pending search completes. Keep its canonical route
 * without replacing the window's URL. The shell reconciles the actual old
 * history entry when Back reaches it, identified by origin rather than URL. */
export function updateSettingsBackground(hash: string): boolean {
  if (!isSettingsHash(window.location.hash)) return false;
  const entry = settingsEntry() ?? { depth: 0, background: null, origin: null };
  // A write begun on a page already left must not replace another page now
  // beneath Settings. Every supported writer stays within its own route.
  const family = (route: string) => route.replace(/^#\/?/, '').split(/[/?]/)[0] || 'mailbox';
  if (family(entry.background ?? '#/') !== family(hash)) return true;
  if (entry.background !== hash) {
    stampSettingsEntry({ ...entry, background: hash });
    window.dispatchEvent(new CustomEvent(BACKGROUND_CHANGED_EVENT));
  }
  return true;
}
