/**
 * Picking up an upgrade in a tab that is already open.
 *
 * Every test is one of three questions: does it notice, does it wait, and does
 * it offer. The module keeps what it has seen in module state, so each test
 * takes a fresh copy.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const QUIET_HIDDEN_MS = 30 * 60 * 1000;

let reload: ReturnType<typeof vi.fn>;

/** Listeners the module under test installed, removed after each test so an
 * earlier copy of it cannot act on a later test's window. */
let installed: Array<{ target: EventTarget; type: string; fn: EventListenerOrEventListenerObject }> = [];

function trackListeners(target: EventTarget) {
  const original = target.addEventListener.bind(target);
  vi.spyOn(target, 'addEventListener').mockImplementation((type, fn, opts) => {
    if (fn) installed.push({ target, type, fn });
    original(type, fn, opts);
  });
}

async function load() {
  vi.resetModules();
  return import('../src/services/app-update');
}

/** An answer naming (or not naming) the build the server serves. */
function answer({ build, cacheControl }: { build?: string; cacheControl?: string } = {}): Response {
  const headers = new Headers();
  if (build) headers.set('X-Alps-Build', build);
  if (cacheControl) headers.set('Cache-Control', cacheControl);
  return new Response(null, { headers });
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

/** A composer on screen, reported the way the shell reports it. */
function openComposer(mod: { registerBusyProbe: (probe: (() => boolean) | null) => void }) {
  mod.registerBusyProbe(() => true);
}

beforeEach(() => {
  reload = vi.fn();
  Object.defineProperty(window, 'location', {
    value: { hash: '', reload },
    configurable: true,
    writable: true,
  });
  installed = [];
  trackListeners(window);
  trackListeners(document);
  sessionStorage.clear();
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  for (const { target, type, fn } of installed) target.removeEventListener(type, fn);
  vi.useRealTimers();
});

describe('detection', () => {
  it('takes the first build it sees as the one it is running', async () => {
    const { noteVersion, updatePending } = await load();
    noteVersion(answer({ build: 'b1' }));
    noteVersion(answer({ build: 'b1' }));
    expect(updatePending()).toBe(false);
  });

  it('notices a new build without acting on it', async () => {
    const { noteVersion, updatePending } = await load();
    noteVersion(answer({ build: 'b1' }));
    noteVersion(answer({ build: 'b2' }));
    expect(updatePending()).toBe(true);
    // An answer just arrived, so someone is using the app.
    expect(reload).not.toHaveBeenCalled();
  });

  it('ignores an answer that names no build', async () => {
    const { noteVersion, updatePending } = await load();
    noteVersion(answer({ build: 'b1' }));
    noteVersion(answer({}));
    expect(updatePending()).toBe(false);
  });

  it('ignores a build named on an answer a cache may replay', async () => {
    const { noteVersion, updatePending } = await load();
    noteVersion(answer({ build: 'b2' }));
    noteVersion(answer({ build: 'b1', cacheControl: 'private, max-age=3600' }));
    noteVersion(answer({ build: 'b1', cacheControl: 'public, immutable' }));
    expect(updatePending()).toBe(false);
  });

  it('does not let a cached replay set the baseline', async () => {
    const mod = await load();
    mod.noteVersion(answer({ build: 'b0', cacheControl: 'max-age=604800' }));
    mod.noteVersion(answer({ build: 'b2' }));
    mod.noteVersion(answer({ build: 'b2' }));
    expect(mod.updatePending()).toBe(false);
  });

  it('trusts an answer that must be revalidated', async () => {
    const mod = await load();
    mod.noteVersion(answer({ build: 'b1', cacheControl: 'no-cache, max-age=60' }));
    mod.noteVersion(answer({ build: 'b2', cacheControl: 'no-store' }));
    expect(mod.updatePending()).toBe(true);
  });

  it('trusts an answer a cache may keep but never serve unasked', async () => {
    const mod = await load();
    mod.noteVersion(answer({ build: 'b1', cacheControl: 'private, max-age=0' }));
    mod.noteVersion(answer({ build: 'b2', cacheControl: 'private, max-age=0' }));
    expect(mod.updatePending()).toBe(true);
  });

  it('is fed by every API answer, but not from the dev server', async () => {
    const mod = await load();
    const { fetchWithTimeout } = await import('../src/utils/fetch-utils');
    let build = 'b1';
    vi.stubGlobal('fetch', vi.fn(async () => answer({ build })));

    vi.stubEnv('DEV', true);
    await fetchWithTimeout('/mailboxes');
    build = 'b2';
    await fetchWithTimeout('/mailboxes');
    expect(mod.updatePending()).toBe(false);

    vi.stubEnv('DEV', false);
    await fetchWithTimeout('/mailboxes');
    build = 'b3';
    await fetchWithTimeout('/mailboxes');
    expect(mod.updatePending()).toBe(true);
  });
});

describe('the quiet moment', () => {
  async function pending() {
    const mod = await load();
    mod.installAppUpdate();
    mod.noteVersion(answer({ build: 'b1' }));
    mod.noteVersion(answer({ build: 'b2' }));
    return mod;
  }

  it('reloads a tab that has been in the background for half an hour', async () => {
    vi.useFakeTimers();
    await pending();
    setHidden(true);
    vi.advanceTimersByTime(QUIET_HIDDEN_MS - 1000);
    expect(reload).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(reload).toHaveBeenCalled();
  });

  it('leaves a briefly hidden tab alone', async () => {
    vi.useFakeTimers();
    await pending();
    setHidden(true);
    vi.advanceTimersByTime(60_000);
    setHidden(false);
    vi.advanceTimersByTime(QUIET_HIDDEN_MS);
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads on return when the background timer never ran', async () => {
    // A frozen tab's timers do not fire; coming back after a long absence is
    // the backstop.
    vi.useFakeTimers();
    await pending();
    setHidden(true);
    vi.setSystemTime(Date.now() + QUIET_HIDDEN_MS + 1000);
    setHidden(false);
    expect(reload).toHaveBeenCalled();
  });

  it('waits while a composer is open', async () => {
    vi.useFakeTimers();
    const mod = await pending();
    openComposer(mod);
    setHidden(true);
    vi.advanceTimersByTime(QUIET_HIDDEN_MS);
    vi.setSystemTime(Date.now() + QUIET_HIDDEN_MS);
    setHidden(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not reload a tab that never saw a new build', async () => {
    vi.useFakeTimers();
    const mod = await load();
    mod.installAppUpdate();
    mod.noteVersion(answer({ build: 'b1' }));
    setHidden(true);
    vi.advanceTimersByTime(QUIET_HIDDEN_MS);
    expect(reload).not.toHaveBeenCalled();
  });

  it('arms the quiet moment for a document that starts hidden', async () => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    const mod = await load();
    mod.installAppUpdate();
    mod.noteVersion(answer({ build: 'b1' }));
    mod.noteVersion(answer({ build: 'b2' }));
    vi.advanceTimersByTime(QUIET_HIDDEN_MS);
    expect(reload).toHaveBeenCalled();
  });
});

describe('a chunk the server no longer has', () => {
  function chunkFails(): Event {
    const event = new Event('vite:preloadError', { cancelable: true });
    window.dispatchEvent(event);
    return event;
  }

  it('reloads, because what was asked for cannot load otherwise', async () => {
    const mod = await load();
    mod.installAppUpdate();
    expect(chunkFails().defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalled();
    expect(mod.updatePending()).toBe(true);
  });

  it('reloads once, not in a loop', async () => {
    const first = await load();
    first.installAppUpdate();
    chunkFails();
    expect(reload).toHaveBeenCalledTimes(1);

    for (const { target, type, fn } of installed) target.removeEventListener(type, fn);
    const next = await load();
    next.installAppUpdate();
    chunkFails();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads again once the cooldown has passed', async () => {
    vi.useFakeTimers();
    const first = await load();
    first.installAppUpdate();
    chunkFails();

    for (const { target, type, fn } of installed) target.removeEventListener(type, fn);
    vi.setSystemTime(Date.now() + 61_000);
    const next = await load();
    next.installAppUpdate();
    chunkFails();
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('goes ahead once the shell says nothing is open', async () => {
    const mod = await load();
    mod.installAppUpdate();
    mod.registerBusyProbe(() => false);
    chunkFails();
    expect(reload).toHaveBeenCalled();
  });

  it('still waits for an open composer', async () => {
    const mod = await load();
    mod.installAppUpdate();
    openComposer(mod);
    chunkFails();
    expect(reload).not.toHaveBeenCalled();
    expect(mod.updatePending()).toBe(true);
  });
});

describe('the offer', () => {
  /** What the shell listens for to raise its toast. */
  function announcements(mod: { UPDATE_AVAILABLE_EVENT: string }): () => number {
    let count = 0;
    const listener = () => {
      count += 1;
    };
    window.addEventListener(mod.UPDATE_AVAILABLE_EVENT, listener);
    return () => count;
  }

  it('announces a newer build exactly once', async () => {
    const mod = await load();
    const seen = announcements(mod);
    mod.noteVersion(answer({ build: 'b1' }));
    mod.noteVersion(answer({ build: 'b2' }));
    mod.noteVersion(answer({ build: 'b3' }));
    mod.noteVersion(answer({ build: 'b3' }));
    expect(seen()).toBe(1);
  });

  it('says nothing about the build it is already running', async () => {
    const mod = await load();
    const seen = announcements(mod);
    mod.noteVersion(answer({ build: 'b1' }));
    mod.noteVersion(answer({ build: 'b1' }));
    expect(seen()).toBe(0);
  });

  it('never grows a missing chunk into an offer', async () => {
    // An import can fail without an upgrade behind it.
    const mod = await load();
    mod.installAppUpdate();
    const seen = announcements(mod);
    mod.noteVersion(answer({ build: 'b1' }));
    openComposer(mod);
    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
    mod.noteVersion(answer({ build: 'b1' }));
    expect(seen()).toBe(0);
    expect(mod.updatePending()).toBe(true);
  });

  it('stops offering once a tab has reloaded for one', async () => {
    const first = await load();
    first.applyUpdate();
    expect(reload).toHaveBeenCalled();

    const next = await load();
    const seen = announcements(next);
    next.noteVersion(answer({ build: 'b2' }));
    next.noteVersion(answer({ build: 'b3' }));
    expect(seen()).toBe(0);
    // Pending all the same: the automatic paths still pick it up.
    expect(next.updatePending()).toBe(true);
  });

  it('defers a held offer rather than spending it', async () => {
    vi.useFakeTimers();
    const first = await load();
    first.applyUpdate();

    const next = await load();
    const seen = announcements(next);
    next.noteVersion(answer({ build: 'b2' }));
    next.noteVersion(answer({ build: 'b3' }));
    expect(seen()).toBe(0);

    vi.setSystemTime(Date.now() + 11 * 60 * 1000);
    next.noteVersion(answer({ build: 'b3' }));
    expect(seen()).toBe(1);
  });

  it('reloads on request even mid-composition, because the user asked', async () => {
    const mod = await load();
    openComposer(mod);
    mod.applyUpdate();
    expect(reload).toHaveBeenCalled();
  });

  it('holds the offer while the tab is hidden and raises it on return', async () => {
    vi.useFakeTimers();
    const mod = await load();
    mod.installAppUpdate();
    const seen = announcements(mod);
    setHidden(true);
    mod.noteVersion(answer({ build: 'b1' }));
    mod.noteVersion(answer({ build: 'b2' }));
    expect(seen()).toBe(0);
    vi.advanceTimersByTime(60_000);
    setHidden(false);
    expect(seen()).toBe(1);
    setHidden(true);
    setHidden(false);
    expect(seen()).toBe(1);
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads instead of offering when the return follows a long absence', async () => {
    vi.useFakeTimers();
    const mod = await load();
    mod.installAppUpdate();
    const seen = announcements(mod);
    setHidden(true);
    mod.noteVersion(answer({ build: 'b1' }));
    mod.noteVersion(answer({ build: 'b2' }));
    vi.setSystemTime(Date.now() + QUIET_HIDDEN_MS + 1000);
    setHidden(false);
    expect(reload).toHaveBeenCalled();
    expect(seen()).toBe(0);
  });
});
