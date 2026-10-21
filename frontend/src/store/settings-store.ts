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
  weekStart: number;
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
  /**
   * The folders unsubscribed from here, oldest first, which the sidebar puts
   * behind More while the server still lists them unsubscribed. The server
   * caps the list, and refuses a save past the caps with every setting it
   * carries; see utils/unsubscribed-folders, which keeps it within them.
   */
  unsubscribedFolders: string[];
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
  weekStart: 1,
  sortOrder: 'desc',
  messageSortCriteria: 'date',
  maxAttachmentMiB: 32,
  customMailboxOrder: [],
  unsubscribedFolders: []
};

type ServerField = { ui?: true; name: string; value: (s: SettingsState) => unknown };

/**
 * Where each setting is kept in the account's record on the server.
 *
 * A save sends only the settings that changed, each under its name here. It
 * used to send the whole record, which put this browser's copy of every other
 * setting over whatever another browser had saved since this one loaded, so
 * the last browser to change anything undid the others' changes. Settings not
 * listed stay in this browser: the sidebar's state, and what the server
 * reports rather than keeps.
 */
const SERVER_FIELDS: { [K in keyof SettingsState]?: ServerField } = {
  themeMode: { ui: true, name: 'themeMode', value: s => s.themeMode },
  colorFamily: { ui: true, name: 'colorFamily', value: s => s.colorFamily },
  layoutMode: { ui: true, name: 'layoutMode', value: s => s.layoutMode },
  // Read from the account's record at sign-in, and never saved to it until now.
  densityMode: { ui: true, name: 'densityMode', value: s => s.densityMode },
  enableThreading: { ui: true, name: 'enableThreading', value: s => s.enableThreading },
  themeIframeContent: { ui: true, name: 'themeIframeContent', value: s => s.themeIframeContent },
  showSenderAvatars: { ui: true, name: 'showSenderAvatars', value: s => s.showSenderAvatars },
  customMailboxOrder: { ui: true, name: 'customMailboxOrder', value: s => s.customMailboxOrder },
  unsubscribedFolders: { ui: true, name: 'unsubscribedFolders', value: s => s.unsubscribedFolders },
  checkMailInterval: { name: 'check_mail_interval', value: s => Number(s.checkMailInterval) || 0 },
  autoLogout: { name: 'auto_logout', value: s => Number(s.autoLogout) || 0 },
  desktopNotifications: { name: 'desktop_notifications', value: s => Boolean(s.desktopNotifications) },
  soundNotifications: { name: 'sound_notifications', value: s => Boolean(s.soundNotifications) },
  name: { name: 'from', value: s => s.name },
  signature: { name: 'signature', value: s => s.signature },
  replyTo: { name: 'reply_to', value: s => s.replyTo },
  bccMyself: { name: 'bcc_myself', value: s => Boolean(s.bccMyself) },
  messagesPerPage: { name: 'messages_per_page', value: s => Number(s.messagesPerPage) || 50 },
  preferredView: { name: 'preferred_view', value: s => s.preferredView },
  markReadTimeout: { name: 'mark_read_timeout', value: s => Number(s.markReadTimeout) || 0 },
  showRemoteContent: { name: 'show_remote_content', value: s => s.showRemoteContent },
  composeFormat: { name: 'compose_format', value: s => s.composeFormat },
  undoTimeout: { name: 'undo_timeout', value: s => Number(s.undoTimeout) || 0 },
  language: { name: 'language', value: s => s.language },
  hourFormat: { name: 'hour_format', value: s => s.hourFormat },
  dateFormat: { name: 'date_format', value: s => s.dateFormat },
  // Only 0 (Sunday) and 1 (Monday) exist; anything else, including the NaN
  // that ?? would let through, saves as the Monday default.
  weekStart: { name: 'week_start', value: s => (Number(s.weekStart) === 0 ? 0 : 1) },
  sortOrder: { name: 'sort_order', value: s => s.sortOrder },
  messageSortCriteria: { name: 'message_sort_criteria', value: s => s.messageSortCriteria },
};

type ServerKey = keyof typeof SERVER_FIELDS;

const isServerKey = (key: string): key is ServerKey => key in SERVER_FIELDS;

/** `keys` of `state`, as `PUT /settings` takes them. */
function serverFields(state: SettingsState, keys: Iterable<ServerKey>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const key of keys) {
    const field = SERVER_FIELDS[key]!;
    if (field.ui) {
      const ui = (body.ui ??= {}) as Record<string, unknown>;
      ui[field.name] = field.value(state);
    } else {
      body[field.name] = field.value(state);
    }
  }
  return body;
}

/** `key`'s value in the account's record as `GET /settings` gives it. */
function recordValue(record: Record<string, any>, key: ServerKey): unknown {
  const field = SERVER_FIELDS[key]!;
  return field.ui ? record.ui?.[field.name] : record[field.name];
}

/** Settings are JSON by construction, so their JSON is their identity. */
function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * A change made in this browser that the server is not known to have taken.
 *
 * `base` is the setting's value in the account's record when the change was
 * made, which is what lets a later load tell "nobody else has touched this"
 * from "another browser has saved its own value since". It is missing when
 * the record had not been read.
 */
interface Unsaved {
  value: unknown;
  base?: unknown;
}

/** How long a save that failed waits before it is tried again, by attempt; the
 * last one repeats. A server that names its own wait (`Retry-After`) is
 * believed when it asks for longer. */
const RETRY_DELAYS_MS = [5_000, 30_000, 120_000, 300_000];

/** How a save ended: taken; refused, which the same request would be again;
 * worth another try, after the wait the server asked for if it named one; or
 * answered after its session ended, which is nobody's business now. */
type SaveOutcome = 'saved' | 'refused' | 'ended' | { retryAfterMs: number | null };

/** `Retry-After` in milliseconds: seconds, or a date. */
function retryAfterMs(response: Response): number | null {
  const header = response.headers.get('Retry-After');
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(header);
  return Number.isNaN(at) ? null : Math.max(0, at - Date.now());
}

/** Not under the `alps_settings_` prefix, which is followed by a username. */
const unsavedKeyFor = (username: string) => `alps_unsaved_settings_${username}`;

function readUnsaved(username: string): Map<ServerKey, Unsaved> {
  const unsaved = new Map<ServerKey, Unsaved>();
  try {
    const stored = localStorage.getItem(unsavedKeyFor(username));
    const parsed: unknown = stored ? JSON.parse(stored) : null;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const [key, entry] of Object.entries(parsed)) {
        if (isServerKey(key) && entry && typeof entry === 'object' && 'value' in entry) {
          unsaved.set(key, entry as Unsaved);
        }
      }
    }
  } catch (e) {
    Logger.error('Failed to read unsaved settings', e);
  }
  return unsaved;
}

export class SettingsStore extends EventTarget {
  private state: SettingsState;
  private initialFetchCompleted = false;
  /** The last read of the server record failed, so saving stays blocked until a
   * read succeeds; see _saveBackendSettings. */
  private settingsReadFailed = false;
  private rereadInFlight = false;
  /** Settings changed in this browser that the server has not yet taken. A read
   * of the record keeps these over the server's values, and a save sends them
   * and nothing else.
   *
   * Kept in localStorage as well ({@link unsavedKeyFor}), and a setting leaves
   * only when a save that carried its current value is answered. It lived in
   * memory alone, so a save that failed, or one cut off by closing the tab,
   * was lost on reload: the next read let the server's value win, and the
   * change was undone in the browser that made it. */
  private unsaved = new Map<ServerKey, Unsaved>();
  /** The account's record as last read, and as since saved, in this session. */
  private record: Record<string, any> | null = null;
  /** The retry of a save that failed, if one is waiting, and how many saves
   * have failed in a row; see {@link retryLater}. */
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;
  /**
   * Moves when a session ends and when another begins. Signing out and in
   * again does not reload the page, so a read of `/session` or `/settings`
   * still out at that moment answers into the next session: it put the
   * previous account's name, signature and reply-to into the next account's
   * settings and saved them under its name, or the previous username back
   * into the store. A read takes this before it asks, and applies its answer
   * only if it has not moved.
   */
  private epoch = 0;

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
      this.epoch++;
      this.initialFetchCompleted = false;
      this.settingsReadFailed = false;
      this.unsaved.clear();
      this.record = null;
      this.cancelRetry();
      this.failures = 0;
      this.state = this.loadSettings();
      this.applyTheme();
      this.notify();
    });

    window.addEventListener('user-logged-in', (e: Event) => {
      const username = (e as CustomEvent).detail?.username;
      this.epoch++;
      this.cancelRetry();
      this.failures = 0;
      this.initializeSession(username);
    });

    // Back online is the best moment there is to retry: whatever the back-off
    // had worked up to, its reason has probably just gone.
    window.addEventListener('online', () => {
      if (this.unsaved.size === 0 || !this.initialFetchCompleted) return;
      this.cancelRetry();
      void this._saveBackendSettings();
    });

    this.initializeSession();
  }

  private async initializeSession(knownUsername?: string) {
    const epoch = this.epoch;
    this.initialFetchCompleted = false;
    this.record = null;

    if (knownUsername) {
      this.state.loginUsername = knownUsername;
      try {
        const previous = localStorage.getItem(ACTIVE_USER_KEY);
        localStorage.setItem(ACTIVE_USER_KEY, knownUsername);
        if (previous !== knownUsername) {
          window.dispatchEvent(new CustomEvent('alps-active-user-changed'));
        }
      } catch (e) {
        Logger.error('Failed to record the active user', e);
      }
      const userSettings = this.loadSettings(knownUsername);
      this.state = { ...this.state, ...userSettings, loginUsername: knownUsername };
      this.adoptUnsaved(knownUsername);
      this.applyTheme();
      this.notify();
    }

    const isLoggedIn = document.cookie.split(';').some(c => c.trim().startsWith('alps_logged_in=1'))
      || !!this.state.loginUsername
      || !!activeUsername();
    const hasLoginToken = document.cookie.split(';').some(c => c.trim().startsWith('alps_has_login_token=1'));
    
    if (!isLoggedIn && !hasLoginToken) {
      await this._fetchBackendSettings();
      return;
    }

    if (!knownUsername) {
      try {
        const response = await fetch('/session');
        if (epoch !== this.epoch) return;
        if (response.ok) {
          const data = await response.json();
          if (epoch !== this.epoch) return;
          const username = data.Username || data.username;
          if (username) {
            this.state.loginUsername = username;
            try {
              const previous = localStorage.getItem(ACTIVE_USER_KEY);
              localStorage.setItem(ACTIVE_USER_KEY, username);
              if (previous !== username) {
                window.dispatchEvent(new CustomEvent('alps-active-user-changed'));
              }
            } catch (e) {
              Logger.error('Failed to record the active user', e);
            }
            const userSettings = this.loadSettings(username);
            this.state = { ...this.state, ...userSettings, loginUsername: username };
            this.adoptUnsaved(username);
            this.applyTheme();
            this.notify();
          }
        }
      } catch (e) {
        Logger.error('Failed to fetch session username during initialization', e);
      }
    }

    // Now fetch backend settings (which will merge with the loaded user settings)
    await this._fetchBackendSettings();
  }

  /**
   * Takes up what `username` left unsaved in this browser: a save that failed,
   * or a tab closed before one was answered. The read that follows decides
   * which of it still stands, and sends that.
   */
  private adoptUnsaved(username: string) {
    const stored = readUnsaved(username);
    if (stored.size === 0) return;
    const state = this.state as unknown as Record<string, unknown>;
    for (const [key, entry] of stored) {
      if (this.unsaved.has(key)) continue;
      this.unsaved.set(key, entry);
      state[key] = entry.value;
    }
    this.saveSettings();
  }

  /**
   * Writes the unsaved settings through to localStorage, minus `forgotten`.
   *
   * Read, changed and written rather than overwritten: another tab of the same
   * user keeps its own unsaved settings under the same key, and only that tab
   * may remove them.
   */
  private storeUnsaved(forgotten: ServerKey[] = []) {
    const username = this.state.loginUsername;
    if (!username) return;
    const stored = readUnsaved(username);
    for (const key of forgotten) stored.delete(key);
    for (const [key, entry] of this.unsaved) stored.set(key, entry);
    try {
      if (stored.size === 0) {
        localStorage.removeItem(unsavedKeyFor(username));
      } else {
        localStorage.setItem(unsavedKeyFor(username), JSON.stringify(Object.fromEntries(stored)));
      }
    } catch (e) {
      Logger.error('Failed to record unsaved settings', e);
    }
  }

  /** `key` has been changed here, and the server has yet to take it. A setting
   * already unsaved keeps its base: that is still the last value the record
   * was seen to hold. */
  private markUnsaved(key: ServerKey) {
    const value = this.state[key];
    const entry = this.unsaved.get(key);
    if (entry) {
      entry.value = value;
    } else if (this.record) {
      this.unsaved.set(key, { value, base: recordValue(this.record, key) ?? null });
    } else {
      this.unsaved.set(key, { value });
    }
  }

  /**
   * Drops the unsaved settings the account's record has moved past, and
   * re-bases the rest on it.
   *
   * An unsaved change can be seconds old (a reload after a failed save) or
   * weeks old (a laptop opened again), and this browser cannot tell which.
   * What it can tell is whether the record still holds the value the change
   * was made from. If it does, nobody has touched the setting since and the
   * change stands. If it holds anything else, another browser has saved that
   * setting since, or this one's save landed and only its answer was lost,
   * and either way the record's value is the newer one.
   */
  private yieldToRecord(record: Record<string, any>) {
    if (this.unsaved.size === 0) return;
    const superseded: ServerKey[] = [];
    for (const [key, entry] of this.unsaved) {
      const current = recordValue(record, key) ?? null;
      if ('base' in entry && !sameValue(current, entry.base)) {
        superseded.push(key);
      } else {
        entry.base = current;
      }
    }
    for (const key of superseded) this.unsaved.delete(key);
    this.storeUnsaved(superseded);
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
    const username = this.state.loginUsername || activeUsername();
    if (username) {
      if (!this.state.loginUsername) {
        this.state.loginUsername = username;
      }
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
    
    // Username changed or set: the change applies over that user's record.
    const before = newUsername !== undefined && newUsername !== oldUsername
      ? (oldUsername === undefined
          ? { ...this.loadSettings(newUsername), ...this.state }
          : this.loadSettings(newUsername))
      : this.state;
    this.state = { ...before, ...updates };

    this.saveSettings();
    
    if (updates.themeMode !== undefined || updates.colorFamily !== undefined) {
      this.applyTheme();
    }
    
    this.notify();

    // Only what the server keeps, and only what this call changed: a control
    // that sets the value it already shows has nothing to say to the server.
    const changed = Object.keys(updates).filter(
      (key): key is ServerKey => isServerKey(key)
        && JSON.stringify(before[key]) !== JSON.stringify(this.state[key]),
    );
    if (changed.length > 0) {
      for (const key of changed) this.markUnsaved(key);
      this.storeUnsaved();
      return this._saveBackendSettings();
    }
  }

  private async _fetchBackendSettings() {
    const isLoggedIn = document.cookie.split(';').some(c => c.trim().startsWith('alps_logged_in=1'))
      || !!this.state.loginUsername
      || !!activeUsername();
    const hasLoginToken = document.cookie.split(';').some(c => c.trim().startsWith('alps_has_login_token=1'));
    
    if (!isLoggedIn && !hasLoginToken) {
      if (!window.location.hash.startsWith('#/login')) {
        window.dispatchEvent(new CustomEvent('auth-error'));
      }
      this.initialFetchCompleted = true;
      return;
    }

    const epoch = this.epoch;
    let needLanguage = false;
    let readOk = false;

    try {
      const response = await fetch('/settings');
      // Ahead of the 401 too: the previous session's refusal is no reason to
      // send the next one to the sign-in page.
      if (epoch !== this.epoch) return;
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (epoch !== this.epoch) return;
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
            // Missing is empty: the server leaves an empty list out of the
            // record, and this browser's copy is older than the record.
            updates.unsubscribedFolders = Array.isArray(ui.unsubscribedFolders)
              ? ui.unsubscribedFolders.filter((name: unknown): name is string => typeof name === 'string')
              : [];
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
          if (s.week_start !== undefined) updates.weekStart = Number(s.week_start) === 0 ? 0 : 1;
          if (s.sort_order !== undefined && s.sort_order !== "") updates.sortOrder = s.sort_order;
          if (s.message_sort_criteria !== undefined && s.message_sort_criteria !== "") updates.messageSortCriteria = s.message_sort_criteria;
          
          // An account that has never saved a language gets the one this
          // browser shows, so that another browser signs in to it in the same
          // language. Only the language: this used to save the whole record, so
          // a read that came back short put this browser's settings over the
          // account's.
          if (!s.language) {
            needLanguage = true;
          }

          // What was changed here and not yet saved wins over the server's copy
          // of those keys, unless the server's copy has moved since; everything
          // else is the server's.
          this.record = s;
          this.yieldToRecord(s);
          for (const key of this.unsaved.keys()) {
            delete (updates as Record<string, unknown>)[key];
          }

          if (Object.keys(updates).length > 0) {
            const currentUsername = this.state.loginUsername || activeUsername();
            this.state = { ...this.state, ...updates };
            if (currentUsername && !this.state.loginUsername) {
              this.state.loginUsername = currentUsername;
            }
            this.saveSettings();
            this.applyTheme();
            this.notify();
          }
        }
      }
    } catch (e) {
      Logger.error('Failed to fetch backend settings', e);
    } finally {
      // Only a record actually READ unblocks saving: a change made before it is
      // kept here, and is saved over the server's values once they are in. A
      // read for an ended session says nothing about the current one's record.
      if (epoch === this.epoch) {
        this.initialFetchCompleted = readOk;
        this.settingsReadFailed = !readOk;
      }
    }
    if (epoch !== this.epoch) return;

    if (needLanguage && !this.unsaved.has('language')) {
      this.markUnsaved('language');
      this.storeUnsaved();
    }
    if (readOk && this.unsaved.size > 0) {
      await this._saveBackendSettings();
    }
  }

  /**
   * Sends the unsaved settings, one request at a time, ending on the latest
   * values.
   *
   * `updateSettings` calls this on EVERY change. Toggling quickly, or dragging a
   * slider, used to put several writes in flight at once, and the last response
   * is not necessarily the last request, so the server could settle on an older
   * value than the one on screen.
   *
   * A change arriving mid-flight sets `savePending` rather than racing, and the
   * trailing save reads the values when it runs, so intermediate values are
   * coalesced away. A setting stays unsaved until a save that carried its
   * current value is answered, so a save that fails leaves its settings for
   * the next one, and so does a reload. The next one is not left to the next
   * change, which may never come: a save that failed is tried again by
   * itself ({@link retryLater}).
   */
  private saveInFlight = false;
  private savePending = false;

  private async _saveBackendSettings() {
    if (!this.initialFetchCompleted) {
      // Nothing is sent before the record has been read: the read would put the
      // server's values over the ones on screen, and a server that could not
      // answer it will hardly take a write. If that read failed, a change is the
      // moment to try it again; a successful re-read keeps the unsaved changes
      // and saves them itself.
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
    const keys = [...this.unsaved.keys()];
    if (keys.length === 0) return;
    const epoch = this.epoch;
    const body = serverFields(this.state, keys);
    const sent = new Map(keys.map(key => [key, this.state[key]]));
    this.saveInFlight = true;
    try {
      const outcome = await this._putBackendSettings(body, epoch);
      // An answer for a session that has ended is not this one's to act on.
      if (outcome === 'ended' || epoch !== this.epoch) return;
      if (outcome === 'saved') {
        this.failures = 0;
        this.cancelRetry();
        this.noteSaved(body);
      } else if (outcome !== 'refused') {
        // Said once for a run of failures, not once for every retry of it.
        if (this.failures === 0) this.reportSaveFailure();
        this.retryLater(outcome.retryAfterMs);
        return;
      } else {
        this.reportSaveFailure();
      }
      // Taken, or refused outright, which the same values would be again.
      // A refused setting kept unsaved went with every later save and had it
      // refused too, and, now that unsaved settings outlive a reload, with
      // every load as well.
      const settled: ServerKey[] = [];
      for (const key of keys) {
        const entry = this.unsaved.get(key);
        if (!entry) continue;
        if (sameValue(this.state[key], sent.get(key))) {
          settled.push(key);
        } else if (outcome === 'saved' && this.record) {
          // Changed again while the save was out: the value it carried is
          // now the record's, and the one the newer change is made from.
          entry.base = recordValue(this.record, key) ?? null;
        }
      }
      for (const key of settled) this.unsaved.delete(key);
      this.storeUnsaved(settled);
    } finally {
      this.saveInFlight = false;
      if (this.savePending) {
        this.savePending = false;
        void this._saveBackendSettings();
      }
    }
  }

  /**
   * Tries a failed save again, later and by itself.
   *
   * The change is on screen already, and nothing tells the user it is not on
   * the server, so nothing should depend on their happening to change another
   * setting. Backed off, because the usual reason is a server or a network
   * that is down.
   */
  private retryLater(retryAfterMs: number | null) {
    this.cancelRetry();
    if (this.unsaved.size === 0) return;
    const backoff = RETRY_DELAYS_MS[Math.min(this.failures, RETRY_DELAYS_MS.length - 1)];
    this.failures++;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this._saveBackendSettings();
    }, Math.max(backoff, retryAfterMs ?? 0));
  }

  private cancelRetry() {
    if (!this.retryTimer) return;
    clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  /** What a save put in the account's record, which is now the value a change
   * to those settings is made from. */
  private noteSaved(body: Record<string, any>) {
    if (!this.record) return;
    for (const [name, value] of Object.entries(body)) {
      if (name === 'ui') {
        this.record.ui = { ...(this.record.ui ?? {}), ...value };
      } else {
        this.record[name] = value;
      }
    }
  }

  /** How the save ended; see {@link SaveOutcome}. */
  private async _putBackendSettings(body: Record<string, unknown>, epoch: number): Promise<SaveOutcome> {
    try {
      const response = await fetch('/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      if (epoch !== this.epoch) return 'ended';
      
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return 'ended';
      }

      // `response.ok` was never consulted. A 400, a 413 or a 500 passed through
      // here in silence, so a setting the server refused stayed switched on in
      // the UI — local state and localStorage having been written first — until
      // the next sign-in somewhere else handed back the old value with no
      // explanation. The one write in this app the user watches most closely
      // was also the only one that could fail without saying so.
      if (!response.ok) {
        Logger.error('Failed to save backend settings', response.status);
        // Worth another try: a server in trouble, a timeout, a rate limit. Not
        // worth one: a refusal of these values, too large or malformed, which
        // the same request would get again.
        const transient = response.status >= 500 || response.status === 408 || response.status === 429;
        return transient ? { retryAfterMs: retryAfterMs(response) } : 'refused';
      }
      return 'saved';
    } catch (e) {
      // No answer at all: offline, or the connection dropped.
      Logger.error('Failed to save backend settings', e);
      return epoch === this.epoch ? { retryAfterMs: null } : 'ended';
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
  // scoped, their unsent drafts alongside. So do the changes the server never
  // took: they are the same record's.
  try {
    const username = localStorage.getItem(ACTIVE_USER_KEY);
    if (username) localStorage.removeItem(`alps_settings_${username}`);
    if (username) localStorage.removeItem(unsavedKeyFor(username));
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
