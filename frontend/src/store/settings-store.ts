import { createContext } from '@lit/context';
import { THEME_BUNDLES } from './themes';
import { Logger } from '../utils/logger';

/**
 * Where the signed-in username is recorded for code that needs it before, or
 * outside, the settings store instance.
 *
 * The per-user settings live under `alps_settings_${username}`, which is
 * unreadable without already knowing the username — and the username itself is
 * one of the fields inside it. This key breaks that circle. It holds an address
 * the user typed into this browser themselves; nothing secret.
 */
const ACTIVE_USER_KEY = 'alps_active_user';


export type ThemeMode = 'light' | 'dark' | 'auto';
export type LayoutMode = 'vertical' | 'horizontal' | 'full';
export type DensityMode = 'loose' | 'normal' | 'compact' | 'ultra-compact';

export interface SettingsState {
  themeMode: ThemeMode;
  colorFamily: string;
  layoutMode: LayoutMode;
  densityMode: DensityMode;
  sidebarCollapsed: boolean;

  checkMailInterval: number;
  autoLogout: number;
  desktopNotifications: boolean;
  soundNotifications: boolean;

  name: string;
  signature: string;
  replyTo: string;
  bccMyself: boolean;

  messagesPerPage: number;
  preferredView: 'html' | 'text';
  markReadTimeout: number;
  showRemoteContent: 'always' | 'ask';
  composeFormat: 'html' | 'text';
  undoTimeout: number;

  language: string;
  hourFormat: '12' | '24';
  dateFormat: string;
  sortOrder: 'asc' | 'desc';
  messageSortCriteria: 'uid' | 'date';
  loginUsername?: string;
  maxAttachmentMiB: number;
  enableThreading: boolean;
  themeIframeContent: boolean;
  /** Pictures beside senders. A sender's verification is drawn either way. */
  showSenderAvatars: boolean;
  hasThreadCapability?: boolean;
  hasESearchCapability?: boolean;
  customMailboxOrder?: string[];
}

const DEFAULT_SETTINGS: SettingsState = {
  themeMode: 'auto',
  colorFamily: 'default',
  layoutMode: 'vertical',
  densityMode: 'compact',
  sidebarCollapsed: false,
  enableThreading: true,
  themeIframeContent: false,
  showSenderAvatars: true,
  
  checkMailInterval: 5,
  autoLogout: 30,
  desktopNotifications: false,
  soundNotifications: true,

  name: '',
  signature: '',
  replyTo: '',
  bccMyself: false,

  messagesPerPage: 50,
  preferredView: 'html',
  markReadTimeout: 0,
  showRemoteContent: 'ask',
  composeFormat: 'html',
  undoTimeout: 0,

  language: 'en',
  hourFormat: '24',
  dateFormat: 'YYYY-MM-DD',
  sortOrder: 'desc',
  messageSortCriteria: 'date',
  maxAttachmentMiB: 32,
  customMailboxOrder: []
};

export class SettingsStore extends EventTarget {
  private state: SettingsState;
  private initialFetchCompleted = false;
  /** The last read of the server record failed, so saving stays blocked until a
   * read succeeds; see _saveBackendSettings. */
  private settingsReadFailed = false;
  private rereadInFlight = false;
  /** Keys changed in this browser while the record could not be read. A re-read
   * keeps these over the server's values, then saves them. */
  private keysChangedUnread = new Set<string>();

  constructor() {
    super();
    this.state = this.loadSettings();
    this.applyTheme();

    // Watch for system theme changes if set to auto
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.state.themeMode === 'auto') {
        this.applyTheme();
      }
    });

    window.addEventListener('session-cleared', () => {
      this.initialFetchCompleted = false;
      this.settingsReadFailed = false;
      this.keysChangedUnread.clear();
      this.state = this.loadSettings();
      this.applyTheme();
      this.notify();
    });

    window.addEventListener('user-logged-in', () => {
      this.initializeSession();
    });

    this.initializeSession();
  }

  private async initializeSession() {
    this.initialFetchCompleted = false;
    const isLoggedIn = document.cookie.split(';').some(c => c.trim().startsWith('alps_logged_in=1'));
    const hasLoginToken = document.cookie.split(';').some(c => c.trim().startsWith('alps_has_login_token=1'));
    
    if (!isLoggedIn && !hasLoginToken) {
      await this._fetchBackendSettings();
      return;
    }

    try {
      const response = await fetch('/session');
      if (response.ok) {
        const data = await response.json();
        const username = data.Username || data.username;
        if (username) {
          this.state = this.loadSettings(username);
          this.applyTheme();
          this.notify();
        }
      }
    } catch (e) {
      Logger.error('Failed to fetch session username during initialization', e);
    }

    // Now fetch backend settings (which will merge with the loaded user settings)
    await this._fetchBackendSettings();
  }

  private loadSettings(username?: string): SettingsState {
    const userKey = username ? `alps_settings_${username}` : null;
    const storedUser = userKey ? localStorage.getItem(userKey) : null;
    
    let userSettings: Partial<SettingsState> = {};
    if (storedUser) {
      try {
        userSettings = JSON.parse(storedUser);
      } catch (e) {
        Logger.error('Failed to parse user settings', e);
      }
    }

    const storedGlobal = localStorage.getItem('alps_settings');
    let globalSettings: Partial<SettingsState> = {};
    if (storedGlobal) {
      try {
        globalSettings = JSON.parse(storedGlobal);
      } catch (e) {
        Logger.error('Failed to parse global settings', e);
      }
    }

    // Merge default, global and user settings.
    // If username is specified, we inherit global settings (including language)
    // if the user doesn't have a user-specific value set yet.
    const mergedState: SettingsState = {
      ...DEFAULT_SETTINGS,
      themeMode: userSettings.themeMode ?? globalSettings.themeMode ?? DEFAULT_SETTINGS.themeMode,
      colorFamily: userSettings.colorFamily ?? globalSettings.colorFamily ?? DEFAULT_SETTINGS.colorFamily,
      layoutMode: userSettings.layoutMode ?? globalSettings.layoutMode ?? DEFAULT_SETTINGS.layoutMode,
      densityMode: userSettings.densityMode ?? globalSettings.densityMode ?? DEFAULT_SETTINGS.densityMode,
      enableThreading: userSettings.enableThreading ?? globalSettings.enableThreading ?? DEFAULT_SETTINGS.enableThreading,
      themeIframeContent: userSettings.themeIframeContent ?? globalSettings.themeIframeContent ?? DEFAULT_SETTINGS.themeIframeContent,
      showSenderAvatars: userSettings.showSenderAvatars ?? globalSettings.showSenderAvatars ?? DEFAULT_SETTINGS.showSenderAvatars,
      customMailboxOrder: userSettings.customMailboxOrder ?? globalSettings.customMailboxOrder ?? DEFAULT_SETTINGS.customMailboxOrder,
      language: userSettings.language ?? globalSettings.language ?? DEFAULT_SETTINGS.language,
      loginUsername: username
    };

    // Merge other user settings that might exist in userSettings
    if (storedUser) {
      Object.assign(mergedState, userSettings);
    }

    return mergedState;
  }

  private saveSettings() {
    const username = this.state.loginUsername;
    if (username) {
      // Save full settings to user-specific key
      localStorage.setItem(`alps_settings_${username}`, JSON.stringify(this.state));
      // And the pointer that lets `readUserSettings` find this record.
      try {
        const previous = localStorage.getItem(ACTIVE_USER_KEY);
        localStorage.setItem(ACTIVE_USER_KEY, username);
        if (previous !== username) {
          // Announced, because the identity is only known once `/settings` has
          // answered — which is AFTER `user-logged-in` fires. Anything keyed on
          // the signed-in user has to learn it here or not at all; see
          // compose-store's adoptSession.
          window.dispatchEvent(new CustomEvent('alps-active-user-changed'));
        }
      } catch (e) {
        Logger.error('Failed to record the active user', e);
      }
    }
    
    // Always save a minimized public dictionary (theme/language only) to global key for pre-login UI
    const globalSettings = {
      themeMode: this.state.themeMode,
      colorFamily: this.state.colorFamily,
      language: this.state.language,
      layoutMode: this.state.layoutMode,
      densityMode: this.state.densityMode,
      enableThreading: this.state.enableThreading,
      themeIframeContent: this.state.themeIframeContent,
      showSenderAvatars: this.state.showSenderAvatars
    };
    localStorage.setItem('alps_settings', JSON.stringify(globalSettings));
  }

  private notify() {
    this.dispatchEvent(new CustomEvent('change'));
  }

  getState(): SettingsState {
    return this.state;
  }

  async updateSettings(updates: Partial<SettingsState>) {
    const oldUsername = this.state.loginUsername;
    const newUsername = updates.loginUsername;
    
    if (newUsername !== undefined && newUsername !== oldUsername) {
      // Username changed or set!
      this.state = { ...this.loadSettings(newUsername), ...updates };
    } else {
      this.state = { ...this.state, ...updates };
    }

    this.saveSettings();
    
    if (updates.themeMode !== undefined || updates.colorFamily !== undefined) {
      this.applyTheme();
    }
    
    this.notify();

    const backendUpdates = { ...updates };
    delete backendUpdates.loginUsername;
    
    if (Object.keys(backendUpdates).length > 0) {
      if (this.settingsReadFailed) {
        for (const key of Object.keys(backendUpdates)) this.keysChangedUnread.add(key);
      }
      return this._saveBackendSettings(this.state);
    }
  }

  private async _fetchBackendSettings() {
    const isLoggedIn = document.cookie.split(';').some(c => c.trim().startsWith('alps_logged_in=1'));
    const hasLoginToken = document.cookie.split(';').some(c => c.trim().startsWith('alps_has_login_token=1'));
    
    if (!isLoggedIn && !hasLoginToken) {
      if (!window.location.hash.startsWith('#/login')) {
        window.dispatchEvent(new CustomEvent('auth-error'));
      }
      this.initialFetchCompleted = true;
      return;
    }

    let needBackendSave = false;
    let readOk = false;

    try {
      const response = await fetch('/settings');
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return;
      }
      if (response.ok) {
        const data = await response.json();
        readOk = true;
        const updates: Partial<SettingsState> = {};
        
        if (data.MaxAttachmentMiB !== undefined) {
          updates.maxAttachmentMiB = data.MaxAttachmentMiB;
        }

        if (data.HasThreadCapability !== undefined) {
          updates.hasThreadCapability = data.HasThreadCapability;
          if (data.HasThreadCapability === false) {
            updates.enableThreading = false;
          }
        }

        if (data.HasESearchCapability !== undefined) {
          updates.hasESearchCapability = data.HasESearchCapability;
        }

        if (data && data.Settings) {
          const s = data.Settings;
          
          if (s.ui) {
            const ui = s.ui;
            // Only update theme if backend has a non-default value or local storage doesn't have one
            // This prevents the backend's default "auto" from overriding user's local preference
            if (ui.themeMode && (ui.themeMode !== 'auto' || !this.state.themeMode || this.state.themeMode === 'auto')) {
              updates.themeMode = ui.themeMode as ThemeMode;
            }
            if (ui.colorFamily && (ui.colorFamily !== 'default' || !this.state.colorFamily || this.state.colorFamily === 'default')) {
              updates.colorFamily = ui.colorFamily;
            }
            if (ui.layoutMode) updates.layoutMode = ui.layoutMode as LayoutMode;
            if (ui.densityMode) updates.densityMode = ui.densityMode as DensityMode;
            if (ui.sidebarCollapsed !== undefined) updates.sidebarCollapsed = ui.sidebarCollapsed;
            if (ui.enableThreading !== undefined) updates.enableThreading = ui.enableThreading;
            if (ui.themeIframeContent !== undefined) updates.themeIframeContent = ui.themeIframeContent;
            if (ui.showSenderAvatars !== undefined) updates.showSenderAvatars = ui.showSenderAvatars;
            if (ui.customMailboxOrder !== undefined) updates.customMailboxOrder = ui.customMailboxOrder;
          }

          if (s.check_mail_interval !== undefined && s.check_mail_interval !== 0) updates.checkMailInterval = s.check_mail_interval;
          if (s.auto_logout !== undefined) updates.autoLogout = s.auto_logout;
          if (s.desktop_notifications !== undefined) updates.desktopNotifications = s.desktop_notifications;
          if (s.sound_notifications !== undefined) updates.soundNotifications = s.sound_notifications;
          if (s.from !== undefined) updates.name = s.from;
          if (s.signature !== undefined) updates.signature = s.signature;
          if (s.reply_to !== undefined) updates.replyTo = s.reply_to;
          if (s.bcc_myself !== undefined) updates.bccMyself = s.bcc_myself;
          if (s.messages_per_page !== undefined && s.messages_per_page !== 0) updates.messagesPerPage = s.messages_per_page;
          if (s.preferred_view !== undefined && s.preferred_view !== "") updates.preferredView = s.preferred_view;
          if (s.mark_read_timeout !== undefined) updates.markReadTimeout = s.mark_read_timeout;
          if (s.show_remote_content !== undefined && s.show_remote_content !== "") updates.showRemoteContent = s.show_remote_content;
          if (s.compose_format !== undefined && s.compose_format !== "") updates.composeFormat = s.compose_format;
          if (s.undo_timeout !== undefined) updates.undoTimeout = s.undo_timeout;
          if (s.language !== undefined && s.language !== "") updates.language = s.language;
          if (s.hour_format !== undefined && s.hour_format !== "") updates.hourFormat = s.hour_format;
          if (s.date_format !== undefined && s.date_format !== "") updates.dateFormat = s.date_format;
          if (s.sort_order !== undefined && s.sort_order !== "") updates.sortOrder = s.sort_order;
          if (s.message_sort_criteria !== undefined && s.message_sort_criteria !== "") updates.messageSortCriteria = s.message_sort_criteria;
          
          if (!s.language) {
            needBackendSave = true;
          }

          // What was changed here while the record could not be read wins over
          // the server's copy of those keys; everything else is the server's.
          for (const key of this.keysChangedUnread) {
            delete (updates as Record<string, unknown>)[key];
          }

          if (Object.keys(updates).length > 0) {
            this.state = { ...this.state, ...updates };
            this.saveSettings();
            this.applyTheme();
            this.notify();
          }
        }
      }
    } catch (e) {
      Logger.error('Failed to fetch backend settings', e);
    } finally {
      // Only a record actually READ unblocks saving. This was set on every exit,
      // failures included, and a save sends the WHOLE record: after one failed
      // read at sign-in (a 500, a moment offline) the next toggle PUT this
      // browser's state over every setting the account had saved elsewhere, and
      // on a browser that had never seen the account that state was the defaults.
      this.initialFetchCompleted = readOk;
      this.settingsReadFailed = !readOk;
    }

    if (readOk && this.keysChangedUnread.size > 0) {
      this.keysChangedUnread.clear();
      needBackendSave = true;
    }

    if (needBackendSave) {
      await this._saveBackendSettings(this.state);
    }
  }

  /**
   * Serializes the settings PUT, and always ends on the latest state.
   *
   * `updateSettings` calls this on EVERY change, and the whole record is sent
   * each time. Toggling quickly, or dragging a slider, therefore put several
   * full-state writes in flight at once — and the last response is not
   * necessarily the last request, so the server could settle on an older state
   * than the one on screen. The user then sees their change applied locally
   * (local state and localStorage are updated first) while the next sign-in
   * from another browser hands back the value they thought they had replaced.
   *
   * One request at a time. A change arriving mid-flight sets `savePending`
   * rather than racing, and the trailing save reads `this.state` fresh when it
   * runs, so intermediate values are coalesced away and the final write is
   * always the current one.
   */
  private saveInFlight = false;
  private savePending = false;

  private async _saveBackendSettings(state: SettingsState) {
    if (!this.initialFetchCompleted) {
      // A PUT replaces the whole record, so nothing is sent before the record has
      // been read. If that read failed, a change is the moment to try it again; a
      // successful re-read folds the server's values in and saves the result
      // itself.
      if (this.settingsReadFailed && !this.rereadInFlight) {
        this.rereadInFlight = true;
        try {
          await this._fetchBackendSettings();
        } finally {
          this.rereadInFlight = false;
        }
        if (!this.initialFetchCompleted) this.reportSaveFailure();
      }
      return;
    }
    if (this.saveInFlight) {
      this.savePending = true;
      return;
    }
    this.saveInFlight = true;
    try {
      await this._putBackendSettings(state);
    } finally {
      this.saveInFlight = false;
      if (this.savePending) {
        this.savePending = false;
        // Fresh read, not the `state` captured above: that argument is the
        // value as of an edit several keystrokes ago.
        void this._saveBackendSettings(this.state);
      }
    }
  }

  private async _putBackendSettings(state: SettingsState) {
    try {
      const response = await fetch('/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ui: {
            themeMode: state.themeMode,
            colorFamily: state.colorFamily,
            layoutMode: state.layoutMode,
            sidebarCollapsed: state.sidebarCollapsed,
            enableThreading: state.enableThreading,
            themeIframeContent: state.themeIframeContent,
            showSenderAvatars: state.showSenderAvatars,
            customMailboxOrder: state.customMailboxOrder
          },
          check_mail_interval: Number(state.checkMailInterval) || 0,
          auto_logout: Number(state.autoLogout) || 0,
          desktop_notifications: Boolean(state.desktopNotifications),
          sound_notifications: Boolean(state.soundNotifications),
          from: state.name,
          signature: state.signature,
          reply_to: state.replyTo,
          bcc_myself: Boolean(state.bccMyself),
          messages_per_page: Number(state.messagesPerPage) || 50,
          preferred_view: state.preferredView,
          mark_read_timeout: Number(state.markReadTimeout) || 0,
          show_remote_content: state.showRemoteContent,
          compose_format: state.composeFormat,
          undo_timeout: Number(state.undoTimeout) || 0,
          language: state.language,
          hour_format: state.hourFormat,
          date_format: state.dateFormat,
          sort_order: state.sortOrder,
          message_sort_criteria: state.messageSortCriteria
        })
      });
      
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return;
      }

      // `response.ok` was never consulted. A 400, a 413 or a 500 passed through
      // here in silence, so a setting the server refused stayed switched on in
      // the UI — local state and localStorage having been written first — until
      // the next sign-in somewhere else handed back the old value with no
      // explanation. The one write in this app the user watches most closely
      // was also the only one that could fail without saying so.
      if (!response.ok) {
        Logger.error('Failed to save backend settings', response.status);
        this.reportSaveFailure();
      }
    } catch (e) {
      Logger.error('Failed to save backend settings', e);
      this.reportSaveFailure();
    }
  }

  /** Announced on the window rather than returned, because `updateSettings` is
   * called from a dozen controls that do not await it. */
  private reportSaveFailure() {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        message: this.translate('settings.saveFailed', 'Could not save that setting — it may not survive signing out'),
        duration: 6000
      }
    }));
  }

  /**
   * The I18nStore, handed in by app-root at boot.
   *
   * alps provides stores through Lit context, which a store that is not a
   * component cannot consume — the same constraint that made
   * `attachment-utils` take its refusal string as a parameter. An explicit
   * setter is the honest version: no module-level singleton, and the fallback
   * below is a real fallback rather than the only path.
   */
  private i18n: { t(key: string): string } | null = null;

  setI18n(store: { t(key: string): string }) {
    this.i18n = store;
  }

  private translate(key: string, fallback: string): string {
    return this.i18n?.t(key) || fallback;
  }

  private applyTheme() {
    let isDark = false;
    if (this.state.themeMode === 'dark') {
      isDark = true;
    } else if (this.state.themeMode === 'auto') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
    }

    // Apply color family theme variables
    const themeKey = `${this.state.colorFamily}-${isDark ? 'dark' : 'light'}`;
    const theme = THEME_BUNDLES[themeKey] || THEME_BUNDLES[`default-${isDark ? 'dark' : 'light'}`];
    
    if (theme) {
      for (const [key, value] of Object.entries(theme.colors)) {
        document.documentElement.style.setProperty(`--${key}`, value);
      }
    }
  }
}

export const settingsContext = createContext<SettingsStore>('settings-store');

export function activeUsername(): string | null {
  try {
    return localStorage.getItem(ACTIVE_USER_KEY);
  } catch {
    return null;
  }
}

/**
 * The settings that actually apply right now.
 *
 * Callers outside this module used to hand-parse `localStorage['alps_settings']`
 * for fields like `signature`, `composeFormat`, `bccMyself` and `replyTo` — and
 * that key has held only the seven theme/layout values of `globalSettings`
 * since settings were split per user. Every one of those reads resolved to
 * `undefined` and fell back to a default, so four settings the UI offers, the
 * backend stores and this store loads had no effect whatsoever.
 *
 * Reads the per-user record first and falls back to the global one, which is
 * still the right answer before anyone has signed in.
 */
export function readUserSettings(): Partial<SettingsState> {
  const global = (() => {
    try {
      const raw = localStorage.getItem('alps_settings');
      return raw ? (JSON.parse(raw) as Partial<SettingsState>) : {};
    } catch {
      return {};
    }
  })();

  const username = activeUsername();
  if (!username) return global;

  try {
    const raw = localStorage.getItem(`alps_settings_${username}`);
    if (!raw) return global;
    return { ...global, ...(JSON.parse(raw) as Partial<SettingsState>) };
  } catch {
    return global;
  }
}

// clearSessionSettings resets cached per-account settings to defaults (preserving
// cross-account UI preferences). By default it also clears the client-side auth
// detection cookies, which is what logout / session-expiry callers want. Account
// switching must pass clearAuthCookies=false: the switch response already installed
// a valid session for the new account, and deleting alps_logged_in / alps_has_login_token
// here would make the reloaded SPA believe it is logged out and bounce to #/login.
export function clearSessionSettings(clearAuthCookies: boolean = true) {
  const stored = localStorage.getItem('alps_settings');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const preserved: Partial<SettingsState> = {};
      
      if (parsed.themeMode) preserved.themeMode = parsed.themeMode;
      if (parsed.colorFamily) preserved.colorFamily = parsed.colorFamily;
      if (parsed.language) preserved.language = parsed.language;
      if (parsed.layoutMode) preserved.layoutMode = parsed.layoutMode;
      if (parsed.densityMode) preserved.densityMode = parsed.densityMode;
      if (parsed.enableThreading !== undefined) preserved.enableThreading = parsed.enableThreading;
      if (parsed.themeIframeContent !== undefined) preserved.themeIframeContent = parsed.themeIframeContent;
      if (parsed.showSenderAvatars !== undefined) preserved.showSenderAvatars = parsed.showSenderAvatars;
      
      localStorage.setItem('alps_settings', JSON.stringify(preserved));
    } catch (e) {
      Logger.error('Failed to clear and preserve global settings', e);
      localStorage.removeItem('alps_settings');
    }
  }

  // The per-user record and the pointer to it go with the session. Leaving them
  // meant the next person to use this browser had the previous user's address
  // and preferences sitting in storage — and, before the compose store was
  // scoped, their unsent drafts alongside.
  try {
    const username = localStorage.getItem(ACTIVE_USER_KEY);
    if (username) localStorage.removeItem(`alps_settings_${username}`);
    localStorage.removeItem(ACTIVE_USER_KEY);
  } catch (e) {
    Logger.error('Failed to clear the per-user settings record', e);
  }

  if (!clearAuthCookies) {
    return;
  }

  // Clear client-side authentication cookies to avoid loop requests on session expiry/restart
  const cookieSuffix = '; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict' + (window.location.protocol === 'https:' ? '; Secure' : '');
  document.cookie = 'alps_logged_in=' + cookieSuffix;
  document.cookie = 'alps_has_login_token=' + cookieSuffix;
}
