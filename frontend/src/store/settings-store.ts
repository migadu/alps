import { createContext } from '@lit/context';
import { THEME_BUNDLES } from './themes';
import { Logger } from '../utils/logger';

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
  hasThreadCapability?: boolean;
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
    }
    
    // Always save a minimized public dictionary (theme/language only) to global key for pre-login UI
    const globalSettings = {
      themeMode: this.state.themeMode,
      colorFamily: this.state.colorFamily,
      language: this.state.language,
      layoutMode: this.state.layoutMode,
      densityMode: this.state.densityMode,
      enableThreading: this.state.enableThreading,
      themeIframeContent: this.state.themeIframeContent
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

    try {
      const response = await fetch('/settings');
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return;
      }
      if (response.ok) {
        const data = await response.json();
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
      this.initialFetchCompleted = true;
    }

    if (needBackendSave) {
      await this._saveBackendSettings(this.state);
    }
  }

  private async _saveBackendSettings(state: SettingsState) {
    if (!this.initialFetchCompleted) {
      return;
    }
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
      }
    } catch (e) {
      Logger.error('Failed to save backend settings', e);
    }
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

export function clearSessionSettings() {
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
      
      localStorage.setItem('alps_settings', JSON.stringify(preserved));
    } catch (e) {
      Logger.error('Failed to clear and preserve global settings', e);
      localStorage.removeItem('alps_settings');
    }
  }

  // Clear client-side authentication cookies to avoid loop requests on session expiry/restart
  const cookieSuffix = '; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict' + (window.location.protocol === 'https:' ? '; Secure' : '');
  document.cookie = 'alps_logged_in=' + cookieSuffix;
  document.cookie = 'alps_has_login_token=' + cookieSuffix;
}
