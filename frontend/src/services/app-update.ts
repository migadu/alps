import { Logger } from '../utils/logger';

/**
 * Picking up an upgrade in a tab that is already open.
 *
 * A mail client is the extreme case of the long-lived tab: people leave it
 * open for days, and nothing in a normal session fetches index.html again.
 * Two things go wrong when the server is upgraded under one of those tabs.
 *
 * 1. STALE CODE. The document keeps running the bundle it loaded, against a
 *    server that has moved on. The server names the frontend it serves on
 *    every answer (`X-Alps-Build`), and {@link noteVersion} compares. Noticing
 *    costs no request of its own: the mail poll, the message list and every
 *    flag change already carry the answer back.
 *
 * 2. A MISSING CHUNK. The server serves only its own build's files, and a
 *    lazily imported chunk is named by a hash of its content. After an
 *    upgrade, the first such import in an old tab asks for a file that no
 *    longer exists, and {@link installAppUpdate} catches that.
 *
 * WHEN it acts is the whole design. A reload closes composers and drops
 * whatever was typed since the last draft save, so a pending update waits for
 * a moment that costs nothing (the tab having been in the background for half
 * an hour), or for a broken chunk to prove the tab cannot go on.
 *
 * And it ASKS, through the app's ordinary toast, raised by the shell from
 * {@link UPDATE_AVAILABLE_EVENT}. That serves the tab that is in use all day
 * and never goes quiet, which for a mail client is the ordinary case. Taking
 * it is the user's choice, which is why {@link applyUpdate} reloads even with
 * a composer open, and the automatic paths never do.
 */

/** How long the tab must have been hidden before a reload is free. */
const QUIET_HIDDEN_MS = 30 * 60 * 1000;

/** The header the server names its frontend build in. */
export const BUILD_HEADER = 'X-Alps-Build';

/**
 * Announced on `window` when a newer build is seen, at most once per document;
 * the shell raises its toast from it.
 *
 * Announced to a VISIBLE tab only. What reveals an upgrade to an idle tab is
 * usually the background mail poll, which arrives while the tab is hidden,
 * where a toast plays to an empty room and spends the one offer. A change seen
 * while hidden is held for the next return to the foreground instead.
 *
 * Once, because the toast is transient and the automatic paths are the
 * backstop: raising it again on the next answer would be a nag.
 */
export const UPDATE_AVAILABLE_EVENT = 'app-update-available';

/**
 * How long a chunk-failure reload holds off the next one. Without it, an
 * import that is broken in the NEW build too would reload forever.
 */
const CHUNK_RELOAD_KEY = 'alps-update-chunk-reload';
const CHUNK_RELOAD_COOLDOWN_MS = 60 * 1000;

/**
 * How long taking an update holds off the next offer.
 *
 * An offer that survives its own reload is a loop, not information: the user
 * did what was asked and was asked again. That happens while two servers of
 * different builds answer in turn, mid-upgrade behind a load balancer. The
 * offer is DEFERRED, not dropped: a later answer retries once the cooldown has
 * passed, so an upgrade that lands minutes after a taken one is still offered.
 *
 * Kept in sessionStorage, so it survives the reload it describes and means
 * nothing to any other tab.
 */
const TAKEN_KEY = 'alps-update-taken';
const TAKEN_COOLDOWN_MS = 10 * 60 * 1000;

function readSession(key: string): number {
  try {
    const at = Number(sessionStorage.getItem(key) ?? 0);
    return Number.isFinite(at) ? at : 0;
  } catch {
    return 0;
  }
}

function writeSession(key: string, value: number): void {
  try {
    sessionStorage.setItem(key, String(value));
  } catch {
    // Private mode, or a full quota. Losing the note only costs a loop guard.
  }
}

function within(key: string, ms: number): boolean {
  const at = readSession(key);
  return at > 0 && Date.now() - at < ms;
}

/**
 * Whether a cache may replay this answer without asking the server. A cache
 * stores headers wholesale, so a build named on such an answer may be an old
 * one speaking from the cache, and a freshly loaded tab would be offered the
 * build it is already running. `no-cache` forces revalidation, so it does not
 * count.
 */
function cacheableAnswer(headers: Headers): boolean {
  const cc = (headers.get('Cache-Control') ?? '').toLowerCase();
  if (cc.includes('no-store') || cc.includes('no-cache')) return false;
  if (cc.includes('immutable')) return true;
  const m = /(?:^|[\s,])(?:s-maxage|max-age)\s*=\s*(\d+)/.exec(cc);
  return m !== null && Number(m[1]) > 0;
}

/** The build this document is running: whatever the first answer named. */
let seenBuild: string | null = null;

/** A newer build is live and has not been picked up yet. */
let pending = false;

/**
 * A build CHANGE was actually seen. A missing chunk sets {@link pending} too,
 * but a failed fetch must never grow into an offer, so only this makes one.
 */
let changeSeen = false;

/** The document's one offer has been made, or is held for the foreground. */
let announced = false;

/** The taken-cooldown hold has been logged; retries stay quiet. */
let holdLogged = false;

/** An offer noticed while hidden, held for the next return to the foreground. */
let announceWhenVisible = false;

/** When the tab went to the background, or null while it is visible. */
let hiddenSince: number | null = null;
let hiddenTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Read the served build off an answer. Called from the one request path the
 * app's API calls share, so every call feeds it.
 *
 * Never throws, and never touches the body.
 */
export function noteVersion(response: Response): void {
  const build = response.headers.get(BUILD_HEADER);
  // Absent when the server has no frontend of its own to name. Silence is "no
  // information", never "no update".
  if (!build || cacheableAnswer(response.headers)) return;

  if (seenBuild === null) {
    seenBuild = build;
    return;
  }

  if (build !== seenBuild && !changeSeen) {
    changeSeen = true;
    pending = true;
    Logger.info(`A new build is served (${seenBuild} → ${build}).`);
  }

  // Retried on every answer until it is made, which is what lets the
  // taken-cooldown defer the offer instead of spending it.
  if (!changeSeen || announced) return;
  if (within(TAKEN_KEY, TAKEN_COOLDOWN_MS)) {
    if (!holdLogged) {
      holdLogged = true;
      Logger.warn('Not offering it yet: this tab already reloaded for an update.');
    }
    return;
  }
  announced = true;
  if (document.hidden) {
    announceWhenVisible = true;
    return;
  }
  window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT));
}

/** True when a newer build is live and has not been picked up. */
export function updatePending(): boolean {
  return pending;
}

/**
 * Start watching for a moment to apply a pending update, and for a chunk the
 * server no longer has. Called once from main.ts.
 */
export function installAppUpdate(): void {
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('vite:preloadError', onPreloadError);
  // A document can START hidden (a restored session, a tab opened in the
  // background), and no visibilitychange will say so. Without this the
  // quiet-moment timer is never armed for exactly the quietest tab.
  if (document.hidden) onVisibilityChange();
}

/**
 * Is the user in the middle of something a reload would destroy?
 *
 * Asked of the shell rather than read off the DOM: the composers render inside
 * app-root's shadow root, where a document query cannot see them. Until the
 * shell has answered, nothing it owns can be open.
 */
let busyProbe: (() => boolean) | null = null;

/** The shell's answer to whether a reload would lose something. */
export function registerBusyProbe(probe: (() => boolean) | null): void {
  busyProbe = probe;
}

function busy(): boolean {
  return busyProbe !== null && busyProbe();
}

function onVisibilityChange(): void {
  if (document.hidden) {
    hiddenSince = Date.now();
    // Background timers are throttled, not stopped, and half an hour is past
    // any throttle. Coming back clears it; the visible branch below is the
    // backstop for a frozen tab.
    if (hiddenTimer) clearTimeout(hiddenTimer);
    hiddenTimer = setTimeout(() => {
      if (pending && !busy()) reload();
    }, QUIET_HIDDEN_MS);
    return;
  }

  if (hiddenTimer) clearTimeout(hiddenTimer);
  hiddenTimer = null;
  const awayFor = hiddenSince === null ? 0 : Date.now() - hiddenSince;
  hiddenSince = null;
  // Back after a long absence: the view is stale anyway and nothing has been
  // started yet, the cheapest visible reload there is.
  if (pending && awayFor >= QUIET_HIDDEN_MS && !busy()) {
    reload();
    return;
  }
  if (announceWhenVisible) {
    announceWhenVisible = false;
    window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT));
  }
}

/**
 * A lazily imported chunk the server no longer has.
 *
 * The one case where reloading is the LESS disruptive option: what the user
 * just asked for cannot load at all. `preventDefault` stops Vite rethrowing the
 * error handled here. It still waits for an open composer, and is not
 * announced: an import can fail without an upgrade behind it, and telling
 * someone a new version exists on the strength of a failed fetch would be
 * untrue.
 */
function onPreloadError(event: Event): void {
  event.preventDefault();
  Logger.warn('A lazily loaded chunk is missing; the server was likely upgraded.');
  pending = true;
  if (busy() || within(CHUNK_RELOAD_KEY, CHUNK_RELOAD_COOLDOWN_MS)) return;
  writeSession(CHUNK_RELOAD_KEY, Date.now());
  reload();
}

/**
 * Take the update now, because the user asked for it. The one path that does
 * not wait for an open composer: the wait exists so the app never reloads out
 * from under someone, and here the someone is asking.
 */
export function applyUpdate(): void {
  writeSession(TAKEN_KEY, Date.now());
  reload();
}

function reload(): void {
  window.location.reload();
}
