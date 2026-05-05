import { createContext } from '@lit/context';
import { THEME_BUNDLES } from './themes';

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
}

const DEFAULT_SETTINGS: SettingsState = {
  themeMode: 'auto',
  colorFamily: 'default',
  layoutMode: 'vertical',
  densityMode: 'compact',
  sidebarCollapsed: false,
  
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
  markReadTimeout: 3,
  showRemoteContent: 'ask',
  composeFormat: 'html',
  undoTimeout: 0,

  language: 'en',
  hourFormat: '24',
  dateFormat: 'YYYY-MM-DD',
  sortOrder: 'desc',
  messageSortCriteria: 'date',
  maxAttachmentMiB: 32
};

export class SettingsStore extends EventTarget {
  private state: SettingsState;

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
      this.state = this.loadSettings();
      this.applyTheme();
      this.notify();
    });

    window.addEventListener('user-logged-in', () => {
      this._fetchBackendSettings();
    });

    this._fetchBackendSettings();
  }

  private loadSettings(): SettingsState {
    const stored = localStorage.getItem('alps_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings() {
    localStorage.setItem('alps_settings', JSON.stringify(this.state));
  }

  private notify() {
    this.dispatchEvent(new CustomEvent('change'));
  }

  getState(): SettingsState {
    return this.state;
  }

  async updateSettings(updates: Partial<SettingsState>) {
    this.state = { ...this.state, ...updates };
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
    // Avoid unnecessary API calls if we are clearly not logged in
    const isLoggedIn = document.cookie.split(';').some(c => c.trim().startsWith('alps_logged_in=1'));
    const hasLoginToken = document.cookie.split(';').some(c => c.trim().startsWith('alps_has_login_token=1'));
    
    if (!isLoggedIn && !hasLoginToken) {
      if (!window.location.hash.startsWith('#/login')) {
        window.dispatchEvent(new CustomEvent('auth-error'));
      }
      return;
    }

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

        if (data && data.Settings) {
          const s = data.Settings;
          
          if (s.ui) {
            const ui = s.ui;
            if (ui.themeMode) updates.themeMode = ui.themeMode as ThemeMode;
            if (ui.colorFamily) updates.colorFamily = ui.colorFamily;
            if (ui.layoutMode) updates.layoutMode = ui.layoutMode as LayoutMode;
            if (ui.densityMode) updates.densityMode = ui.densityMode as DensityMode;
            if (ui.sidebarCollapsed !== undefined) updates.sidebarCollapsed = ui.sidebarCollapsed;
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
          
          if (Object.keys(updates).length > 0) {
            this.state = { ...this.state, ...updates };
            this.saveSettings();
            this.applyTheme();
            this.notify();
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch backend settings', e);
    }
  }

  private async _saveBackendSettings(state: SettingsState) {
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
            densityMode: state.densityMode,
            sidebarCollapsed: state.sidebarCollapsed
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
      console.error('Failed to save backend settings', e);
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
