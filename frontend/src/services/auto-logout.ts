import { MessageCache } from '../utils/message-cache';
import { Logger } from '../utils/logger';
import { clearSessionSettings } from '../store/settings-store';
import { setLoginNotice } from '../utils/login-notice';

const LAST_ACTIVITY_KEY = 'alps_last_active';
const SYNC_THROTTLE_MS = 3000;

/** localStorage throws in private-mode Safari and when storage is full or
 * disabled. The idle timer must not take the app down with it. */
function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — the in-memory clock still works, just not across tabs */
  }
}

function removeStored(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* see writeStored */
  }
}

class AutoLogoutService {
  /**
   * `keydown`, not `keypress`.
   *
   * `keypress` is deprecated and fires only for keys that PRODUCE A CHARACTER:
   * no Arrow, Tab, Escape, Backspace, Delete, Page Up/Down, or any modifier
   * combination. A user driving the message list from the keyboard — the way
   * this app's own arrow-key navigation is meant to be used — could therefore
   * be signed out mid-read while actively pressing keys.
   *
   * `keydown` fires for every key, which is the question being asked here:
   * is somebody there, not are they typing prose.
   *
   * We also listen to `wheel`, `pointerdown`, `pointermove`, `click`, `input`
   * and `focusin`, and register everything in the CAPTURE phase: `scroll` does
   * not bubble, so a bubble-phase listener on `document` never saw the user
   * scrolling the message list or the thread pane, and any component calling
   * `stopPropagation()` swallowed the rest.
   */
  private events = [
    'mousedown',
    'mousemove',
    'keydown',
    'scroll',
    'touchstart',
    'wheel',
    'pointerdown',
    'pointermove',
    'click',
    'input',
    'focusin',
  ];
  private logoutMinutes: number = 0;
  private lastActivity: number = Date.now();
  private lastSync: number = 0;
  private lastPing: number = Date.now();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  /** Resolves with how many dirty drafts could NOT be saved, when it knows. */
  public onBeforeLogout?: () => Promise<{ failed: number } | undefined>;

  public setLogoutTime(minutes: number) {
    const wasActive = this.logoutMinutes > 0;
    this.logoutMinutes = minutes;
    const isActive = this.logoutMinutes > 0;

    if (isActive && !wasActive) {
      this.attachEvents();
      this.startInterval();
    } else if (!isActive && wasActive) {
      this.detachEvents();
      this.clearInterval();
    } else if (isActive && wasActive) {
      this.recordActivity(); // reset on config change
    }
  }

  /**
   * Records activity, and mirrors it to the other tabs.
   *
   * Two tabs open on the same mailbox share one user, so they must share one
   * idle clock: without this, working in tab A does not stop tab B's timer, and
   * B signs the session out from under A.
   */
  public recordActivity = () => {
    const now = Date.now();
    this.lastActivity = now;
    if (window.location.hash === '#/login' || window.location.hash === '') {
      return;
    }
    if (now - this.lastSync >= SYNC_THROTTLE_MS) {
      this.lastSync = now;
      writeStored(LAST_ACTIVITY_KEY, String(now));
    }
  };

  private handleActivity = () => {
    this.recordActivity();
  };

  private handleStorage = (e: StorageEvent) => {
    if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
      const stamp = Number(e.newValue);
      if (Number.isFinite(stamp) && stamp > this.lastActivity) {
        this.lastActivity = stamp;
      }
    }
  };

  private attachEvents() {
    this.lastSync = 0;
    this.events.forEach(event => {
      document.addEventListener(event, this.handleActivity, { capture: true, passive: true });
    });
    window.addEventListener('storage', this.handleStorage);
    this.recordActivity();
  }

  private detachEvents() {
    this.lastSync = 0;
    this.events.forEach(event => {
      document.removeEventListener(event, this.handleActivity, { capture: true });
    });
    window.removeEventListener('storage', this.handleStorage);
  }

  /**
   * Bridges interaction events from sandboxed message viewer / attachment
   * iframes to the activity tracker. Events inside an iframe do not bubble to
   * the parent `document`, so reading a long message — which is where a user
   * actually spends their time — counted as idle and signed them out mid-read.
   */
  public trackIframe(iframe: HTMLIFrameElement) {
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      this.events.forEach(event => {
        doc.addEventListener(event, this.handleActivity, { capture: true, passive: true });
      });
    } catch {
      // Cross-origin iframe or inaccessible document
    }
  }

  private startInterval() {
    this.clearInterval();
    // Check every 30 seconds if we've passed the threshold
    this.checkInterval = setInterval(() => this.checkTimeout(), 30000);
  }

  private clearInterval() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private checkTimeout() {
    if (this.logoutMinutes <= 0) return;

    // Don't auto-logout if we're already at the login screen
    if (window.location.hash === '#/login' || window.location.hash === '') {
      this.recordActivity();
      return;
    }

    // A tab that was in the background missed the `storage` events another tab
    // wrote, so read the shared stamp before deciding this session is idle.
    let effectiveLastActivity = this.lastActivity;
    const stored = Number(readStored(LAST_ACTIVITY_KEY));
    if (Number.isFinite(stored) && stored > effectiveLastActivity) {
      effectiveLastActivity = stored;
      this.lastActivity = stored;
    }

    const msSinceActive = Date.now() - effectiveLastActivity;
    const timeoutMs = this.logoutMinutes * 60 * 1000;

    if (msSinceActive >= timeoutMs) {
      this.logout();
    } else {
      // If user was active recently and it's been more than 5 minutes since last ping
      if (msSinceActive < 5 * 60 * 1000 && Date.now() - this.lastPing > 5 * 60 * 1000) {
        this.pingBackend();
      }
    }
  }

  private async pingBackend() {
    this.lastPing = Date.now();
    try {
      // Silent fetch to keep backend session alive
      await fetch('/session');
    } catch (err) {
      // Ignore ping errors
    }
  }

  /**
   * Puts the watch back after a sign-out.
   *
   * Explicit rather than a `setLogoutTime(this.logoutMinutes)` call, which is
   * what this used to do and which did nothing: that method acts only on a
   * TRANSITION, and the configured value has not changed — so it took the
   * "already active" branch, reset the activity clock and returned, leaving the
   * interval cleared and the listeners detached by `logout()` above.
   *
   * The service is a module singleton that outlives a login, so the effect was
   * that auto-logout fired at most ONCE per page load: sign back in without
   * reloading and the session was never timed out again. Silent, and the
   * feature is a security control.
   *
   * Re-arming immediately is safe even though the browser is now on `#/login`:
   * `checkTimeout` returns early there and keeps the clock fresh, so the watch
   * only starts counting once the user is back inside the app.
   */
  private rearm() {
    this.lastActivity = Date.now();
    this.lastPing = Date.now();
    this.lastSync = 0;
    if (this.logoutMinutes > 0) {
      this.attachEvents();
      this.startInterval();
    }
  }

  private async logout() {
    this.clearInterval();
    this.detachEvents();

    let draftsLost = 0;
    if (this.onBeforeLogout) {
      try {
        draftsLost = (await this.onBeforeLogout())?.failed ?? 0;
      } catch (err) {
        Logger.error('Failed to run onBeforeLogout hook', err);
      }
    }

    try {
      removeStored(LAST_ACTIVITY_KEY);

      // Ahead of the request, not after it: the login page is mounted by the
      // cookie going away and reads its notice exactly once, so a notice set
      // after a slow DELETE races that read and shows nothing.
      // The same distinction the Sign Out button makes: a draft that could not be
      // saved is gone once the session ends, so say so. This always reported plain
      // inactivity and threw the count away.
      setLoginNotice(draftsLost > 0 ? 'inactivitySignedOutDraftsLost' : 'inactivitySignedOut');

      // The network call is the only step here that can fail, and its failure
      // must not carry away the local ones. One 500, or a tab that is offline
      // when the idle timer fires, used to skip the cache and settings wipe, the
      // `session-cleared` event, the redirect AND the re-arm below — leaving the
      // user sitting in a mailbox this client has already decided is over.
      //
      // The safe direction when the server cannot be told is to sign out anyway.
      try {
        await fetch('/session', { method: 'DELETE' });
      } catch (err) {
        Logger.error('Sign-out request failed; ending the session locally anyway', err);
      }

      MessageCache.clear();
      clearSessionSettings();
      window.dispatchEvent(new CustomEvent('session-cleared'));
      window.location.hash = '#/login';
    } catch (err) {
      Logger.error('Failed to auto sign out', err);
    } finally {
      // Unconditional, because the watch was torn down at the top of this
      // method: any path that leaves without re-arming leaves the idle timeout
      // disabled for the rest of the page load. A security control that stops
      // enforcing and says nothing is the one outcome it may not produce.
      this.rearm();
    }
  }
}

export const autoLogoutService = new AutoLogoutService();
