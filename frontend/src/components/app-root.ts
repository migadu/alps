import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from '../router';
import { registry } from '../plugin-registry';

// Import pages
import '../pages/login-page';
import '../pages/mailbox-page';
import '../pages/settings-page';
import '../pages/original-message-page';
import '../pages/print-page';
import '../pages/login-webauthn-page';

// Compose imports
import { provide } from '@lit/context';
import './alps-floating-composer';
import './toast-notification';
import './ui-modal';
import { composeContext, ComposeStore } from '../store/compose-store';
import type { ComposerInstance } from '../store/compose-store';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { linkedAccountsContext, linkedAccountsStore } from '../store/linked-accounts-store';
import { autoLogoutService } from '../services/auto-logout';
import { clearSessionSettings } from '../store/settings-store';
import { setLoginNotice } from '../utils/login-notice';

const DEFAULT_TOAST_TIMEOUT_MS = 3000;

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

  @state() private toasts: ToastItem[] = [];
  private toastIdCounter = 0;

  @state() private isOffline: boolean = !navigator.onLine;
  @state() private offlineCountdown: number = 0;
  private offlineInterval: number | null = null;

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      height: 100dvh;
      width: 100vw;
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

  connectedCallback() {
    super.connectedCallback();
    
    // Initial auth check to prevent loading mailbox components if we are clearly not logged in
    const isLoggedIn = document.cookie.split(';').some(c => c.trim().startsWith('alps_logged_in=1')) ||
                       document.cookie.split(';').some(c => c.trim().startsWith('alps_has_login_token=1'));

    if (!isLoggedIn && !window.location.hash.startsWith('#/login')) {
      window.location.hash = '#/login';
    }

    this.composeStore.addEventListener('change', this._handleComposeChange);
    this.settingsStore.addEventListener('change', this._handleSettingsChange);
    this.activeComposers = this.composeStore.getState().activeComposers;
    
    // Initialize auto-logout
    const autoLogoutTime = this.settingsStore.getState().autoLogout ?? 0;
    autoLogoutService.setLogoutTime(autoLogoutTime);
    autoLogoutService.onBeforeLogout = async () => {
      await this.composeStore.saveAllDirtyDrafts();
    };

    // Initialize language
    const initialLang = this.settingsStore.getState().language ?? 'en';
    this.i18nStore.setLanguage(initialLang);

    window.addEventListener('auth-error', this._handleAuthError);
    window.addEventListener('show-toast', this._handleShowToast as EventListener);
    window.addEventListener('beforeunload', this._handleBeforeUnload);
    window.addEventListener('online', this._handleOnlineEvent);
    window.addEventListener('offline', this._handleOfflineEvent);
    window.addEventListener('network-error', this._handleNetworkError);
    window.addEventListener('dragover', this._handleGlobalDragOver);
    window.addEventListener('drop', this._handleGlobalDrop);
    window.addEventListener('plugins-updated', this._handlePluginsUpdated as EventListener);

    if (this.isOffline) {
      this._handleOfflineEvent();
    }

    // Fetch enabled plugins
    if (isLoggedIn) {
      this._fetchSessionData();
    }
  }

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
    window.removeEventListener('show-toast', this._handleShowToast as EventListener);
    window.removeEventListener('beforeunload', this._handleBeforeUnload);
    window.removeEventListener('online', this._handleOnlineEvent);
    window.removeEventListener('offline', this._handleOfflineEvent);
    window.removeEventListener('network-error', this._handleNetworkError);
    window.removeEventListener('dragover', this._handleGlobalDragOver);
    window.removeEventListener('drop', this._handleGlobalDrop);
    window.removeEventListener('plugins-updated', this._handlePluginsUpdated as EventListener);
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
    sessionStorage.clear();
    clearSessionSettings();
    window.dispatchEvent(new CustomEvent('session-cleared'));
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
      message: e.detail.message,
      actionLabel: e.detail.actionLabel || '',
      actionFn: e.detail.actionFn,
      dismissFn: e.detail.dismissFn,
      timeout: e.detail.duration || DEFAULT_TOAST_TIMEOUT_MS,
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

  private _handleComposeChange = () => {
    this.activeComposers = this.composeStore.getState().activeComposers;
  };

  private _handleSettingsChange = () => {
    const settings = this.settingsStore.getState();
    autoLogoutService.setLogoutTime(settings.autoLogout ?? 0);
    this.i18nStore.setLanguage(settings.language ?? 'en');
  };

  private mailboxPageTemplate = html`<mailbox-page></mailbox-page>`;

  private getRoutes() {
    const baseRoutes: Record<string, () => any> = {
      '/': () => this.mailboxPageTemplate,
      '/login': () => html`<login-page></login-page>`,
      '/mailbox/*': () => this.mailboxPageTemplate,
      '/settings': () => html`<settings-page category="general"></settings-page>`,
      '/settings/*': () => {
         const hash = window.location.hash;
         const match = hash.match(/^#\/settings\/?(.*)$/);
         const category = match && match[1] ? match[1].split('?')[0] : 'general';
         return html`<settings-page .category=${category}></settings-page>`;
      },
      '/original': () => html`<original-message-page></original-message-page>`,
      '/print': () => html`<print-page></print-page>`,
      '/login/webauthn': () => html`<login-webauthn-page></login-webauthn-page>`,
    };

    registry.getRoutes().forEach(route => {
      let cachedEl: HTMLElement | null = null;
      baseRoutes[route.path] = () => {
        if (!cachedEl) {
          cachedEl = document.createElement(route.component);
        }
        return cachedEl;
      };
    });

    return baseRoutes;
  }

  private router = new Router(
    this.getRoutes(),
    () => html`<div>404 Not Found</div>`,
    () => this.requestUpdate()
  );

  render() {
    const totalOpen = this.activeComposers.filter(c => !c.minimized).length;
    const totalMinimized = this.activeComposers.filter(c => c.minimized).length;
    let openIndex = 0;
    let minimizedIndex = 0;

    return html`
      ${this.router.render()}
      
      ${this.activeComposers.map((composer, index) => {
        const isMinimized = composer.minimized;
        const currentOpenIndex = isMinimized ? 0 : openIndex++;
        const currentMinimizedIndex = isMinimized ? minimizedIndex++ : 0;

        return html`
          <alps-floating-composer
            .instance=${composer}
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

      ${this.isOffline ? html`
        <ui-modal title=${this.i18nStore.t('offline.title')} .dismissible=${false} width="400px">
          <div style="text-align: center; padding: 16px 0;">
            <svg style="width: 48px; height: 48px; color: var(--text-muted, #9ca3af); margin-bottom: 16px; fill: currentColor;">
              <use href="/assets/icons/sprite.svg?v=7#wifiSlash"></use>
            </svg>
            <div style="font-weight: 500; font-size: 16px; margin-bottom: 8px; color: var(--text-primary, #111827);">
              ${this.i18nStore.t('offline.description')}
            </div>
            <div style="color: var(--text-secondary, #4b5563); font-size: 14px;">
              ${this.i18nStore.t('offline.tryingAgain').replace('{seconds}', this.offlineCountdown.toString())}
            </div>
          </div>
        </ui-modal>
      ` : ''}
    `;
  }
}
