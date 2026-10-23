import { html, css, LitElement, nothing } from 'lit';
import { renderIcon } from '../utils/ui';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { Router } from '../router';
import { loadComponent, PLUGIN_LOAD_FAILED_EVENT, registry, resetComponentLoadFailures } from '../plugin-registry';
import './alps-page-load-error';

// Import pages
import '../pages/login-page';
import '../pages/mailbox-page';
import '../pages/original-message-page';
import '../pages/print-page';
import '../pages/login-webauthn-page';

// Compose imports
import { provide } from '@lit/context';
// NOT imported statically: the composer window carries the rich-text editor and
// the emoji table, which together outweigh everything else the app loads. See
// `ensureComposerLoaded` — it is fetched on the first compose, and prefetched
// once the app goes idle so that first compose does not wait on the network.
import './toast-notification';
import './ui-modal';
import './settings-window';
import './alps-attachment-preview';
import { composeContext, ComposeStore } from '../store/compose-store';
import type { ComposerInstance } from '../store/compose-store';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { linkedAccountsContext, linkedAccountsStore } from '../store/linked-accounts-store';
import { autoLogoutService } from '../services/auto-logout';
import { clearSessionSettings } from '../store/settings-store';
import { setLoginNotice } from '../utils/login-notice';
import { signedOutOnPurpose } from '../utils/signed-out';
import { applyUpdate, registerBusyProbe, reloadForMissingPage, reloadMissingPageWhenIdle, UPDATE_AVAILABLE_EVENT } from '../services/app-update';
import { Logger } from '../utils/logger';
import { isSettingsHash, settingsCategoryOf, settingsHash } from '../utils/routes';
import { BACKGROUND_CHANGED_EVENT, ensurePageEntry, nextSettingsEntry, pageEntryId, settingsEntry, stampSettingsEntry, type SettingsEntry } from '../utils/settings-history';

const DEFAULT_TOAST_TIMEOUT_MS = 3000;
/** Long enough to be read and acted on; the automatic paths catch a missed one. */
const UPDATE_TOAST_MS = 15000;
/** A busy app should not hold the composer back forever. */
const COMPOSER_PREFETCH_TIMEOUT_MS = 3000;
/** What the browsers without requestIdleCallback wait instead. */
const COMPOSER_PREFETCH_DELAY_MS = 1500;

/**
 * The route-table keys that are never the page beneath the Settings window:
 * the screens before a session, the pages opened in a tab of their own, and
 * Settings itself. A history entry naming one of them draws the mailbox.
 */
const NEVER_BENEATH = new Set(['/login', '/login/webauthn', '/settings', '/settings/*', '/original', '/print']);

/** The route path of a hash: no `#`, no query, `/` for none. */
function routePath(hash: string): string {
  return (hash.replace(/^#/, '') || '/').split('?')[0];
}

interface ToastItem {
  id: number;
  message: string;
  actionLabel?: string;
  actionFn?: () => void;
  dismissFn?: () => void;
  timeout: number;
  show: boolean;
}

@customElement('app-root')
export class AppRoot extends LitElement {
  @provide({ context: composeContext })
  composeStore = new ComposeStore();

  @provide({ context: settingsContext })
  settingsStore = new SettingsStore();

  @provide({ context: i18nContext })
  i18nStore = new I18nStore();

  @provide({ context: linkedAccountsContext })
  linkedAccountsStore = linkedAccountsStore;

  @state() private activeComposers: ComposerInstance[] = [];
  @state() private composerReady = false;

  @state() private toasts: ToastItem[] = [];
  @state() private attachmentPreview: { attachments: any[]; mailbox: string; messageUid: string; index: number } | null = null;
  private toastIdCounter = 0;

  @state() private isOffline: boolean = !navigator.onLine;
  @state() private offlineCountdown: number = 0;
  private offlineInterval: number | null = null;

  static styles = css`
    /* The offline modal's glyph. It was a hand-written <use> pointing at the
       sprite with its OWN cache-busting query — ?v=7, where renderIcon uses
       ?v=11 — so the browser treated it as a second 64 KB resource that nothing
       else in the app ever requests. Which made the one icon shown BECAUSE the
       network is down the one icon guaranteed not to be in cache: a fresh
       fetch, while offline, that cannot succeed. */
    .offline-icon {
      color: var(--text-muted, #9ca3af);
      margin-bottom: 16px;
    }
    .offline-icon .icon {
      width: 48px;
      height: 48px;
      fill: currentColor;
    }

    :host {
      display: block;
      height: 100vh;
      height: 100dvh;
      width: 100vw;
    }

    /* The routed page's wrapper: no box of its own, so every page lays out
       exactly as it did as the host's child. Beneath the Settings window it
       takes one, to be a stacking context at 0: everything the page stacks,
       its header at 20000 included, then sits under the window (900) and the
       composers above that. Only then, because outside Settings a docked
       composer must stay under the page's own header. */
    .route-view {
      display: contents;
    }
    .route-view.behind-window {
      display: block;
      position: relative;
      z-index: 0;
      height: 100%;
    }

    .toast-stack {
      position: fixed;
      bottom: 24px;
      left: 24px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 8px;
      z-index: 50000;
      pointer-events: none;
    }
  `;

  constructor() {
    super();
    // The router hears `hashchange` only while this shell is in the document:
    // Lit connects and disconnects it with the shell. The field initializers
    // have run by now, so the router exists.
    this.addController(this.router);
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Initial auth check to prevent loading mailbox components if we are clearly not logged in
    const isLoggedIn = document.cookie.split(';').some(c => c.trim().startsWith('alps_logged_in=1')) ||
                       document.cookie.split(';').some(c => c.trim().startsWith('alps_has_login_token=1'));

    if (!isLoggedIn && !window.location.hash.startsWith('#/login')) {
      window.location.hash = '#/login';
    }

    // The settings store reports a failed save as a toast and needs the active
    // dictionary to do it. It is not a component, so it cannot consume the Lit
    // context the rest of the app reads i18n through.
    this.settingsStore.setI18n(this.i18nStore);

    this.composeStore.addEventListener('change', this._handleComposeChange);
    this.settingsStore.addEventListener('change', this._handleSettingsChange);
    // Through the handler, not a bare read: a composer restored before this
    // point still needs its module fetched, and only the handler asks for it.
    this._handleComposeChange();
    
    // Initialize auto-logout
    const autoLogoutTime = this.settingsStore.getState().autoLogout ?? 0;
    autoLogoutService.setLogoutTime(autoLogoutTime);
    // Throws for drafts it could not store, so auto-logout can keep them on
    // this device and say so, as the Sign Out button does.
    autoLogoutService.onBeforeLogout = () => this.composeStore.saveAllDirtyDrafts();

    // Initialize language
    const initialLang = this.settingsStore.getState().language ?? 'en';
    this.i18nStore.setLanguage(initialLang);

    window.addEventListener('auth-error', this._handleAuthError);
    window.addEventListener('session-cleared', this._handleSessionCleared);
    window.addEventListener(BACKGROUND_CHANGED_EVENT, this._handleBackgroundChanged);
    window.addEventListener('show-toast', this._handleShowToast as EventListener);
    window.addEventListener('beforeunload', this._handleBeforeUnload);
    window.addEventListener('online', this._handleOnlineEvent);
    window.addEventListener('offline', this._handleOfflineEvent);
    window.addEventListener('network-error', this._handleNetworkError);
    window.addEventListener('dragover', this._handleGlobalDragOver);
    window.addEventListener('drop', this._handleGlobalDrop);
    window.addEventListener('plugins-updated', this._handlePluginsUpdated as EventListener);
    window.addEventListener(PLUGIN_LOAD_FAILED_EVENT, this._handlePluginLoadFailed);
    window.addEventListener('open-attachment-preview', this._handleOpenAttachmentPreview as EventListener);
    window.addEventListener(UPDATE_AVAILABLE_EVENT, this._handleUpdateAvailable);
    // A reload waits while a composer is open. Asked of this element because
    // the composers render inside its shadow root, out of a document query's reach.
    registerBusyProbe(() => this.composeStore.getState().activeComposers.length > 0);

    if (this.isOffline) {
      this._handleOfflineEvent();
    }

    // Fetch enabled plugins
    if (isLoggedIn) {
      this._fetchSessionData();
    }
  }

  private _handleOpenAttachmentPreview = (e: CustomEvent) => {
    const { attachments, mailbox, messageUid, index } = e.detail ?? {};
    if (!Array.isArray(attachments) || attachments.length === 0) return;
    this.attachmentPreview = { attachments, mailbox, messageUid, index: index ?? 0 };
  };

  private _handlePluginsUpdated = () => {
    this.requestUpdate();
  };

  private async _fetchSessionData() {
    try {
      const response = await fetch('/session');
      if (response.ok) {
        const data = await response.json();
        if (data.EnabledPlugins) {
          registry.setEnabledPlugins(data.EnabledPlugins);
        }
      }
    } catch (e) {
      console.error('Failed to fetch session data', e);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.composeStore.removeEventListener('change', this._handleComposeChange);
    this.settingsStore.removeEventListener('change', this._handleSettingsChange);
    window.removeEventListener('auth-error', this._handleAuthError);
    window.removeEventListener('session-cleared', this._handleSessionCleared);
    window.removeEventListener(BACKGROUND_CHANGED_EVENT, this._handleBackgroundChanged);
    window.removeEventListener('show-toast', this._handleShowToast as EventListener);
    window.removeEventListener('open-attachment-preview', this._handleOpenAttachmentPreview as EventListener);
    window.removeEventListener('beforeunload', this._handleBeforeUnload);
    window.removeEventListener('online', this._handleOnlineEvent);
    window.removeEventListener('offline', this._handleOfflineEvent);
    window.removeEventListener('network-error', this._handleNetworkError);
    window.removeEventListener('dragover', this._handleGlobalDragOver);
    window.removeEventListener('drop', this._handleGlobalDrop);
    window.removeEventListener('plugins-updated', this._handlePluginsUpdated as EventListener);
    window.removeEventListener(PLUGIN_LOAD_FAILED_EVENT, this._handlePluginLoadFailed);
    window.removeEventListener(UPDATE_AVAILABLE_EVENT, this._handleUpdateAvailable);
    registerBusyProbe(null);
    this._stopOfflineCountdown();
  }

  private _handleGlobalDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  private _handleGlobalDrop = (e: DragEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('alps-composer-drop'));
  };

  private _handleAuthError = () => {
    // The echo of a sign-out, not an expiry: the reads still in flight when the
    // session ends are refused after the sign-out has set its own notice, and
    // the login page may already have read it (see signed-out.ts).
    if (signedOutOnPurpose()) return;
    sessionStorage.clear();
    clearSessionSettings();
    // An EXPIRY, not a sign-out, and the two must not be the same event. This
    // dispatched the bare sign-out signal, so compose-store deleted every unsent
    // draft from storage the moment any request came back 401 — including the
    // send the user had just pressed, whose message was destroyed before
    // sendDraft returned. 7487097 closed that loss on the boot redirect; this was
    // the same loss through the door left open. Sign-out and idle auto-logout
    // still dispatch it bare, and still clear.
    window.dispatchEvent(new CustomEvent('session-cleared', { detail: { reason: 'expired' } }));
    setLoginNotice('sessionExpired');
    window.location.hash = '#/login';
  };

  private _verifyConnectivity = async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    try {
      const res = await fetch('/site.webmanifest', { method: 'HEAD', cache: 'no-store' });
      if (res.status === 502 || res.status === 503 || res.status === 504) return false;
      return true;
    } catch (e) {
      return false;
    }
  };

  private _handleOnlineEvent = async () => {
    if (await this._verifyConnectivity()) {
      this.isOffline = false;
      this._stopOfflineCountdown();
    } else {
      this._handleOfflineEvent();
    }
  };

  private _verifyingNetworkError = false;

  // The synthetic 'network-error' event fires whenever a single request fails
  // (502/503/504, timeout, or interrupted fetch). That is not proof the browser
  // is offline: a submission such as sign-in or saving a Sieve script can briefly
  // busy the upstream IMAP/ManageSieve session and make a concurrent request fail
  // transiently. Confirm with a lightweight probe before showing the modal so we
  // don't flash "disconnected" on these false positives. The browser's native
  // 'offline' event is authoritative and still bypasses this check.
  private _handleNetworkError = async () => {
    if (this.isOffline || this._verifyingNetworkError) return;
    this._verifyingNetworkError = true;
    try {
      if (!(await this._verifyConnectivity())) {
        this._handleOfflineEvent();
      }
    } finally {
      this._verifyingNetworkError = false;
    }
  };

  private _handleOfflineEvent = () => {
    if (!this.isOffline) {
      this.isOffline = true;
      this.offlineCountdown = 10;
      this._startOfflineCountdown();
    }
  };

  private _isPinging = false;

  private _startOfflineCountdown() {
    this._stopOfflineCountdown();
    this.offlineInterval = window.setInterval(async () => {
      if (this.offlineCountdown > 1) {
        this.offlineCountdown--;
      } else {
        this.offlineCountdown = 10;
        if (this._isPinging) return;
        
        this._isPinging = true;
        try {
          if (await this._verifyConnectivity()) {
            this.isOffline = false;
            this._stopOfflineCountdown();
          }
        } finally {
          this._isPinging = false;
        }
      }
    }, 1000);
  }

  private _stopOfflineCountdown() {
    if (this.offlineInterval !== null) {
      clearInterval(this.offlineInterval);
      this.offlineInterval = null;
    }
  }

  private _handleShowToast = (e: CustomEvent) => {
    const id = ++this.toastIdCounter;
    const newToast: ToastItem = {
      id,
      // `i18nKey` lets a caller that has no i18n context of its own — a store,
      // a plain module — name the string instead of resolving it. Resolved
      // here, where the dictionary is.
      message: e.detail.message
        ?? (e.detail.i18nKey ? this.i18nStore?.t(e.detail.i18nKey) : undefined)
        ?? '',
      actionLabel: e.detail.actionLabel || '',
      actionFn: e.detail.actionFn,
      dismissFn: e.detail.dismissFn,
      timeout: e.detail.duration ?? DEFAULT_TOAST_TIMEOUT_MS,
      show: false,
    };
    
    this.toasts = [...this.toasts, newToast];

    // Trigger animation after render
    requestAnimationFrame(() => {
      this.toasts = this.toasts.map(t => t.id === id ? { ...t, show: true } : t);
    });
  };

  private _handleDismissToast(id: number) {
    this.toasts = this.toasts.map(t => t.id === id ? { ...t, show: false } : t);
    
    // Wait for the CSS transition (0.3s) before completely removing from DOM
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 300);
  };

  private _handleBeforeUnload = (e: BeforeUnloadEvent) => {
    const isSending = this.activeComposers.some(c => c.isSending);
    if (isSending) {
      e.preventDefault();
      return 'You have a message currently sending. Are you sure you want to leave?';
    }
  };

  /** A newer build is served: offered through the same toast as everything else. */
  private _handleUpdateAvailable = () => {
    this._handleShowToast(new CustomEvent('show-toast', {
      detail: {
        i18nKey: 'update.available',
        actionLabel: this.i18nStore?.t('update.reload'),
        actionFn: applyUpdate,
        duration: UPDATE_TOAST_MS,
      },
    }));
  };

  firstUpdated() {
    // Warm the composer once the app has settled, so the button that opens it
    // answers instantly while the first paint never waited on it. Idle time
    // only — a prefetch that competes with the message list has moved the cost
    // rather than removed it.
    const prefetch = () => {
      // The idle callback can outlive this shell, a test's included, and a
      // shell no longer in the document has no composer to warm.
      if (!this.isConnected) return;
      void this.ensureComposerLoaded().catch(() => {});
    };
    const idle = (window as any).requestIdleCallback;
    if (typeof idle === 'function') {
      idle(prefetch, { timeout: COMPOSER_PREFETCH_TIMEOUT_MS });
    } else {
      window.setTimeout(prefetch, COMPOSER_PREFETCH_DELAY_MS);
    }
  }

  private _handlePluginLoadFailed = () => {
    this._handleShowToast(new CustomEvent('show-toast', {
      detail: {
        i18nKey: 'general.pageLoadFailed',
        actionLabel: this.i18nStore.t('general.backToMail'),
        actionFn: () => { window.location.hash = '#/mailbox/INBOX'; },
        // Stay until dismissed: the failed page contains no navigation of its own.
        duration: 0,
      },
    }));
  };

  /**
   * The composer window's module, fetched at most once.
   *
   * Held as the PROMISE rather than a boolean, so that composers opened while
   * the fetch is still in flight — a restored draft and a click, say — all wait
   * on the one request instead of racing to start their own.
   */
  private composerModule: Promise<unknown> | null = null;

  /** The composer window's module failed to load in this document. */
  private composerFailed = false;

  /** The notice that the window could not be loaded, while it is up. */
  private composerFailureToast: number | null = null;

  /**
   * Loads the composer window's module, and rejects when it cannot be had.
   *
   * It cannot when the import rejects, and when it settles without defining
   * the window: in a build, Vite's preload helper answers a failed import with
   * nothing once app-update has handled its error event. That answer was taken
   * for the module, and kept, so the window was never drawn and nothing said
   * so. A module that failed is not imported again: the browser keeps a failed
   * import in the document's module map, and only a reload fetches it anew
   * (see _composerUnavailable).
   */
  private ensureComposerLoaded(): Promise<unknown> {
    if (this.composerFailed) return Promise.reject(new Error('The composer could not be loaded'));
    if (!this.composerModule) {
      this.composerModule = (async () => {
        await import('./alps-floating-composer');
        if (!customElements.get('alps-floating-composer')) {
          throw new Error('The composer module did not define its window');
        }
        this.composerReady = true;
      })().catch((err) => {
        this.composerModule = null;
        this.composerFailed = true;
        Logger.error('Failed to load the composer', err);
        throw err;
      });
    }
    return this.composerModule;
  }

  /**
   * Composers are waiting for a window that cannot be loaded.
   *
   * One opened with nothing in it yet, never edited and never stored, is
   * closed: drawn nowhere, it was kept all the same, a new one for each press
   * of Compose, and as open composers they held app-update's own reload back.
   * One that holds the user's writing, a draft restored as the app started,
   * stays, on screen nowhere but on disk, and opens again after a reload. The
   * notice says what happened, once while it is up, and its Reload writes the
   * composers to disk first. With none left, app-update's own reload for the
   * missing chunk goes ahead, as it does when the last composer closes.
   */
  private _composerUnavailable() {
    for (const composer of this.composeStore.getState().activeComposers) {
      if (!composer.dirty && !composer.draftUid) this.composeStore.closeComposer(composer.id);
    }
    if (this.toasts.some(t => t.id === this.composerFailureToast)) return;
    this._handleShowToast(new CustomEvent('show-toast', {
      detail: {
        message: `${this.i18nStore.t('composer.windowLoadFailed')} ${this.i18nStore.t('general.pageLoadFailedHint')}`,
        actionLabel: this.i18nStore.t('update.reload'),
        actionFn: () => {
          // Kept open rather than reloaded over composers it could not write.
          if (!this.composeStore.persistNow()) {
            this._handleShowToast(new CustomEvent('show-toast', {
              detail: { i18nKey: 'composer.draftSaveFailedKeepOpen', duration: 6000 },
            }));
            return false;
          }
          reloadForMissingPage();
        },
        // Until dismissed: without the window there is nothing else to say so.
        duration: 0,
      },
    }));
    this.composerFailureToast = this.toastIdCounter;
  }

  /**
   * Whether the windows this shell draws, or where it puts them, changed.
   *
   * Every keystroke in a composer is a store change, and reassigning the list
   * for each one re-rendered the whole shell while the user typed. A window
   * follows its own composer through the store (see the floating composer's
   * `_handleStoreChange`), so the shell needs only what decides the windows:
   * which there are, which are minimized and sending, and what is unsaved.
   */
  private _hasStructuralComposeChange(prev: ComposerInstance[], next: ComposerInstance[]): boolean {
    if (prev.length !== next.length) return true;
    return next.some((b, i) => {
      const a = prev[i];
      return a.id !== b.id ||
        !!a.minimized !== !!b.minimized ||
        !!a.isSending !== !!b.isSending ||
        !!a.dirty !== !!b.dirty ||
        (!!b.minimized && (a.subject ?? '') !== (b.subject ?? ''));
    });
  }

  private _handleComposeChange = () => {
    const composers = this.composeStore.getState().activeComposers;
    if (composers.length > 0) {
      this.ensureComposerLoaded().catch(() => this._composerUnavailable());
    } else {
      reloadMissingPageWhenIdle();
    }
    if (this._hasStructuralComposeChange(this.activeComposers, composers)) {
      this.activeComposers = composers;
    }
  };

  private _handleSettingsChange = () => {
    const settings = this.settingsStore.getState();
    autoLogoutService.setLogoutTime(settings.autoLogout ?? 0);
    this.i18nStore.setLanguage(settings.language ?? 'en');
  };

  /**
   * The mailbox page, kept for the session as the plugin pages are.
   *
   * It was a template, and a template swapped out for Calendar is torn down:
   * coming back built a new page that started from nothing — no folders, no
   * rows, a spinner over a full listing of the folder the user had just left.
   * The kept element comes back with all of that on screen and refreshes it
   * quietly (see mailbox-page's connectedCallback).
   *
   * Dropped when the session ends, so the next sign-in, which may be someone
   * else's, starts from a fresh page rather than the last user's mail.
   */
  private mailboxPage: HTMLElement | null = null;
  private pluginPages = new Map<string, HTMLElement>();

  private getMailboxPage(): HTMLElement {
    return (this.mailboxPage ??= document.createElement('mailbox-page'));
  }

  private _handleSessionCleared = () => {
    this.mailboxPage = null;
    this.pluginPages.clear();
  };

  private getRoutes() {
    const baseRoutes: Record<string, () => any> = {
      '/': () => this.getMailboxPage(),
      '/login': () => html`<login-page></login-page>`,
      '/mailbox/*': () => this.getMailboxPage(),
      // Settings is a window over the page it was opened from (see
      // `settingsWindow`), so its routes render THAT page.
      '/settings': () => this.backgroundView(),
      '/settings/*': () => this.backgroundView(),
      '/original': () => html`<original-message-page></original-message-page>`,
      '/print': () => html`<print-page></print-page>`,
      '/login/webauthn': () => html`<login-webauthn-page></login-webauthn-page>`,
    };

    registry.getRoutes().forEach(route => {
      baseRoutes[route.path] = () => {
        // A page whose module could not be fetched says so, rather than
        // leaving its undefined element on screen, blank.
        if (!loadComponent(route, () => this.requestUpdate())) {
          return html`<alps-page-load-error></alps-page-load-error>`;
        }
        let cachedEl = this.pluginPages.get(route.path);
        if (!cachedEl) {
          cachedEl = document.createElement(route.component);
          this.pluginPages.set(route.path, cachedEl);
        }
        return cachedEl;
      };
    });

    return baseRoutes;
  }

  private loadFailurePath: string | null = null;
  private router = new Router(
    this.getRoutes(),
    () => html`<div>404 — ${this.i18nStore.t('general.notFound')}</div>`,
    (event) => {
      const path = this.router.currentPath;
      if (path !== this.loadFailurePath) {
        this.loadFailurePath = path;
        resetComponentLoadFailures();
      }
      this.trackSettingsEntry(event);
      this.requestUpdate();
    }
  );

  /**
   * The page beneath the Settings window: the one its history entry says it
   * was opened from (`utils/settings-history`), through the same route table
   * and so the same element (the kept mailbox page, a plugin page's cached
   * element) the page already had, which is what keeps its state. The mailbox
   * when there is none to draw: a direct load, or a page that is never beneath.
   */
  private backgroundView() {
    const background = settingsEntry()?.background ?? null;
    if (background !== null) {
      const path = routePath(background);
      const key = this.router.matchKey(path);
      if (key !== null && !NEVER_BENEATH.has(key)) return this.router.render(path);
    }
    return this.getMailboxPage();
  }

  /** The hash the shell last routed, for `trackSettingsEntry`; null until the
   * first route. */
  private lastHash: string | null = null;
  private lastPageEntryId: string | null = null;
  /** The stamp of the Settings entry last routed, or null if it was a page. */
  private lastSettingsEntry: SettingsEntry | null = null;

  /**
   * The history bookkeeping a navigation INTO Settings needs, run on every
   * route: a freshly pushed Settings entry is stamped with the page it was
   * opened over and its depth (`nextSettingsEntry`). An entry reached by Back
   * or Forward already carries its own, which the browser restored with it.
   * Before the re-render, which draws the page from the stamp.
   *
   * The first route only notes where the shell starts: a Settings URL loaded
   * directly has no page behind it, and a reloaded entry keeps its stamp.
   */
  private trackSettingsEntry(event?: HashChangeEvent) {
    let hash = window.location.hash;
    // oldURL is the actual address left, including a silent autosave or page
    // normalization since the last hashchange. lastHash alone can be stale.
    const previous = event?.oldURL ? new URL(event.oldURL).hash : this.lastHash;
    const departing = this.lastSettingsEntry;
    if (!isSettingsHash(hash)) {
      // Only reconcile the actual underlying entry. A login, a link to a
      // different page, or even a new entry with the old URL is its own move.
      if (isSettingsHash(previous ?? '') && departing?.origin
          && pageEntryId() === departing.origin && departing.background
          && hash !== departing.background) {
        history.replaceState(history.state, '', departing.background);
        hash = window.location.hash;
      }
      this.lastHash = hash;
      this.lastSettingsEntry = null;
      this.lastPageEntryId = ensurePageEntry();
      return;
    }
    let entry = settingsEntry();
    if (!entry && previous !== null) {
      entry = nextSettingsEntry(previous, departing, this.lastPageEntryId);
      stampSettingsEntry(entry);
    } else if (entry?.origin && entry.origin === departing?.origin
        && isSettingsHash(previous ?? '') && entry.background !== departing.background) {
      // Back/Forward between URL-chosen sections keeps their own depth, but
      // not an obsolete background route from before a draft replacement.
      entry = { ...entry, background: departing.background };
      stampSettingsEntry(entry);
    } else if (entry?.origin && entry.origin === this.lastPageEntryId
        && previous !== null && !isSettingsHash(previous) && entry.background !== previous) {
      // Forward can first reach an older Settings section skipped by Close's
      // go(-depth). Its underlying entry now carries the canonical new URL.
      entry = { ...entry, background: previous };
      stampSettingsEntry(entry);
    }
    this.lastHash = hash;
    this.lastSettingsEntry = entry;
  }

  private _handleBackgroundChanged = () => {
    this.lastSettingsEntry = settingsEntry();
    this.requestUpdate();
  };

  /**
   * A section chosen in the Settings window: the entry is REPLACED, stamp and
   * all, so Back closes the window rather than walking back through every
   * section visited. `replaceState` fires no `hashchange`, so the re-render is
   * asked for here.
   */
  private _handleSettingsCategory = (e: CustomEvent<{ category: string }>) => {
    history.replaceState(history.state, '', settingsHash(e.detail.category));
    this.lastHash = window.location.hash;
    this.requestUpdate();
  };

  /**
   * Close, or Escape: back to the page beneath, the way Back would go. A
   * stamped entry walks back over its depth, and the page sees its own URL
   * again, unchanged. A direct load has no entry behind it, and is replaced
   * with the Inbox's, whose `hashchange` re-routes.
   */
  private _closeSettings = () => {
    const entry = settingsEntry();
    if (entry?.background && entry.depth > 0 && entry.origin !== null) {
      history.go(-entry.depth);
      return;
    }
    window.location.replace(entry?.background ?? '#/');
  };

  /** The Settings window, while the URL names it. */
  private settingsWindow() {
    if (!isSettingsHash(window.location.hash)) return nothing;
    return html`
      <settings-window
        .category=${settingsCategoryOf(window.location.hash)}
        @settings-category=${this._handleSettingsCategory}
        @settings-close=${this._closeSettings}
      ></settings-window>
    `;
  }

  render() {
    const totalOpen = this.activeComposers.filter(c => !c.minimized).length;
    const totalMinimized = this.activeComposers.filter(c => c.minimized).length;
    let openIndex = 0;
    let minimizedIndex = 0;

    // Settings, over the page: the page stays the same element, dimmed (the
    // window's backdrop) and inert, in a stacking context of its own at 0, so
    // its header (20000 inside it) is under the window and the composers.
    const view = this.router.render();
    const settings = this.settingsWindow();
    const behind = settings !== nothing;

    return html`
      <div class="route-view ${behind ? 'behind-window' : ''}" ?inert=${behind}>${view}</div>
      ${settings}

      <!-- Keyed by composer: a window's element is that composer's for its
           whole life. By position, closing the first of three handed the
           second window's element to the third composer, and a send counting
           down in it went on to send the wrong message. -->
      ${!this.composerReady ? '' : repeat(this.activeComposers, (composer) => composer.id, (composer, index) => {
        const isMinimized = composer.minimized;
        const currentOpenIndex = isMinimized ? 0 : openIndex++;
        const currentMinimizedIndex = isMinimized ? minimizedIndex++ : 0;

        return html`
          <alps-floating-composer
            .instance=${this.composeStore.getComposer(composer.id) ?? composer}
            .index=${index}
            .totalOpen=${totalOpen}
            .totalMinimized=${totalMinimized}
            .openIndex=${currentOpenIndex}
            .minimizedIndex=${currentMinimizedIndex}
          ></alps-floating-composer>
        `;
      })}
      
      <div class="toast-stack">
        ${this.toasts.map(toast => html`
          <alps-toast
            .show=${toast.show}
            .message=${toast.message}
            .actionLabel=${toast.actionLabel}
            .onAction=${toast.actionFn}
            .onDismiss=${toast.dismissFn}
            .timeout=${toast.timeout}
            @dismiss=${() => this._handleDismissToast(toast.id)}
          ></alps-toast>
        `)}
      </div>

      ${this.attachmentPreview ? html`
        <alps-attachment-preview
          .attachments=${this.attachmentPreview.attachments}
          .mailbox=${this.attachmentPreview.mailbox}
          .messageUid=${this.attachmentPreview.messageUid}
          .activeIndex=${this.attachmentPreview.index}
          @close=${() => { this.attachmentPreview = null; }}
        ></alps-attachment-preview>
      ` : ''}

      ${this.isOffline ? html`
        <ui-modal heading=${this.i18nStore.t('offline.title')} .dismissible=${false} width="400px">
          <div style="text-align: center; padding: 16px 0;">
            <div class="offline-icon">${renderIcon('wifiSlash')}</div>
            <div style="font-weight: 500; font-size: 16px; margin-bottom: 8px; color: var(--text-primary, #111827);">
              ${this.i18nStore.t('offline.description')}
            </div>
            <div style="color: var(--text-secondary, #4b5563); font-size: 14px;">
              ${this.i18nStore.t('offline.tryingAgain', { count: this.offlineCountdown })}
            </div>
          </div>
        </ui-modal>
      ` : ''}
    `;
  }
}
