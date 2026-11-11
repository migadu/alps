import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { activeUsername, settingsContext, SettingsStore } from '../store/settings-store';
import type { UnsavedChanges } from './settings-window';
import type { AlpsInput } from './alps-input';
import './alps-input';
import './alps-button';
import './alps-setting-group';
import './ui-confirm';

type Service = 'caldav' | 'carddav';

interface ConnectionSettings {
  server: string;
  default_server: string;
  use_mail_credentials: boolean;
  username: string;
  password_configured: boolean;
  configured: boolean;
  personal_configured: boolean;
  can_save: boolean;
}

interface Removal {
  generation: number;
  account: string;
}

class SettingsError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

/**
 * The DAV connection belongs to the signed-in mail account. Only the public
 * description is read back: passwords are sent once and never enter the
 * ordinary settings store (which persists its whole state in localStorage).
 *
 * Each open/read/save has an identity of its own. Leaving the section or
 * changing accounts cancels the request and makes its eventual answer inert.
 */
export class DavConnectionSettings extends LitElement implements UnsavedChanges {
  @consume({ context: i18nContext }) i18nStore!: I18nStore;
  @consume({ context: settingsContext, subscribe: true }) settingsStore!: SettingsStore;

  protected service: Service = 'caldav';
  @state() private saved: ConnectionSettings | null = null;
  @state() private server = '';
  @state() private useMailCredentials = true;
  @state() private username = '';
  @state() private password = '';
  @state() private loading = true;
  @state() private submitting = false;
  @state() private error = '';
  @state() private removal: Removal | null = null;
  @state() private unreadablePersonal = false;

  private generation = 0;
  private account = '';
  private controller: AbortController | null = null;
  private mailCredentialsChosenForServer = false;

  static styles = css`
    :host { display: block; }
    .hint { color: var(--text-muted); font-size: 13px; line-height: 1.4; }
    .checkbox-label {
      display: flex; align-items: center; gap: 8px; cursor: pointer;
      color: var(--text-primary); font-weight: 500;
    }
    input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .error { color: var(--danger-color, #dc2626); font-size: 13px; margin-block: 0 16px; }
    bdi { overflow-wrap: anywhere; }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.settingsStore?.addEventListener('change', this.onAccountChanged);
    this.i18nStore?.addEventListener('change', this.onLanguageChanged);
    window.addEventListener('alps-active-user-changed', this.onAccountChanged);
    window.addEventListener('session-cleared', this.onSessionCleared);
    window.addEventListener('user-logged-in', this.onLogin);
    this.account = this.currentAccount();
    void this.load();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.settingsStore?.removeEventListener('change', this.onAccountChanged);
    this.i18nStore?.removeEventListener('change', this.onLanguageChanged);
    window.removeEventListener('alps-active-user-changed', this.onAccountChanged);
    window.removeEventListener('session-cleared', this.onSessionCleared);
    window.removeEventListener('user-logged-in', this.onLogin);
    if (this.submitting) this.invalidateDAVPages();
    this.invalidate();
    this.password = '';
    const password = this.shadowRoot?.querySelector<AlpsInput>('alps-input[name="password"]');
    if (password) {
      password.value = '';
      const input = password.shadowRoot?.querySelector('input');
      if (input) input.value = '';
    }
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.i18nStore?.t(key, params) ?? key;
  }

  private currentAccount(): string {
    return this.settingsStore?.getState().loginUsername ?? activeUsername() ?? '';
  }

  private onLanguageChanged = () => this.requestUpdate();
  private onAccountChanged = () => {
    const account = this.currentAccount();
    if (account === this.account) return;
    this.account = account;
    void this.load();
  };
  private onSessionCleared = () => {
    this.invalidate();
    this.account = '';
    this.clear();
  };
  private onLogin = (event: Event) => {
    this.account = (event as CustomEvent).detail?.username ?? this.currentAccount();
    void this.load();
  };

  private invalidate(): number {
    this.controller?.abort();
    this.controller = null;
    this.removal = null;
    return ++this.generation;
  }

  private current(generation: number): boolean {
    return this.isConnected && generation === this.generation;
  }

  private clear() {
    this.saved = null;
    this.server = this.username = this.password = this.error = '';
    this.useMailCredentials = true;
    this.loading = true;
    this.submitting = false;
    this.mailCredentialsChosenForServer = false;
    this.unreadablePersonal = false;
  }

  private apply(settings: ConnectionSettings) {
    this.unreadablePersonal = false;
    const useMailCredentials = (settings.server || settings.default_server)
      ? settings.use_mail_credentials : false;
    // Pick the public fields rather than retaining the server's entire reply.
    this.saved = {
      server: settings.server, default_server: settings.default_server,
      use_mail_credentials: useMailCredentials, username: settings.username,
      password_configured: settings.password_configured, configured: settings.configured,
      personal_configured: settings.personal_configured,
      can_save: settings.can_save,
    };
    this.server = settings.server;
    this.username = settings.username;
    this.useMailCredentials = useMailCredentials;
    this.password = '';
    this.mailCredentialsChosenForServer = false;
  }

  private async request(method: 'GET' | 'PUT' | 'DELETE', generation: number, body?: object): Promise<ConnectionSettings | null> {
    const controller = new AbortController();
    this.controller = controller;
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(`/settings/dav/${this.service}`, {
        method, signal: controller.signal, credentials: 'same-origin',
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      });
      if (!this.current(generation)) return null;
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        throw new SettingsError('dav_session_ended');
      }
      const data = await response.json().catch(() => null);
      if (!this.current(generation)) return null;
      if (!response.ok) {
        // Only the server can distinguish a known corrupt saved record from
        // a failed read. The former still needs a way to remove the override.
        if (method === 'GET' && data?.personal_configured === true) this.unreadablePersonal = true;
        throw new SettingsError(data?.error ?? 'dav_unavailable');
      }
      if (!data || typeof data.server !== 'string' || typeof data.default_server !== 'string'
        || typeof data.username !== 'string' || typeof data.use_mail_credentials !== 'boolean'
        || typeof data.password_configured !== 'boolean' || typeof data.configured !== 'boolean'
        || typeof data.personal_configured !== 'boolean'
        || typeof data.can_save !== 'boolean') throw new SettingsError('dav_unavailable');
      return data as ConnectionSettings;
    } finally {
      clearTimeout(timeout);
      if (this.controller === controller) this.controller = null;
    }
  }

  private errorKey(error: unknown): string {
    const codes: Record<string, string> = {
      dav_invalid_server: 'invalidServer', dav_credentials_required: 'credentialsRequired',
      dav_password_required: 'passwordRequired', dav_login_key_required: 'keyRequired',
      dav_auth_failed: 'authFailed', dav_session_ended: 'sessionEnded',
    };
    return `settings.dav.${error instanceof SettingsError ? codes[error.code] ?? 'unavailable' : 'unavailable'}`;
  }

  private async load() {
    const generation = this.invalidate();
    this.clear();
    try {
      const settings = await this.request('GET', generation);
      if (settings && this.current(generation)) this.apply(settings);
    } catch (error) {
      if (this.current(generation)) this.error = this.errorKey(error);
    } finally {
      if (this.current(generation)) this.loading = false;
    }
  }

  get hasUnsavedChanges(): boolean {
    return !!this.saved && (this.server.trim() !== this.saved.server
      || this.useMailCredentials !== this.saved.use_mail_credentials
      || (!this.useMailCredentials && (this.username.trim() !== this.saved.username || this.password !== '')));
  }

  discardUnsavedChanges() {
    if (this.submitting) this.invalidateDAVPages();
    this.invalidate();
    if (this.saved) this.apply(this.saved);
    this.submitting = false;
    this.error = '';
  }

  /** A retained password is valid only for the identity it was saved for. */
  private get needsPassword(): boolean {
    return !this.saved?.password_configured || this.server.trim() !== this.saved.server
      || this.username.trim() !== this.saved.username;
  }

  private onInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.name === 'server') {
      this.server = input.value;
      // A new destination must not silently receive the mail password. The
      // user can explicitly choose that after entering their personal URL.
      if (this.server.trim() && this.server.trim() !== this.saved?.server && !this.mailCredentialsChosenForServer) {
        this.useMailCredentials = false;
      }
    }
    if (input.name === 'username') this.username = input.value;
    if (input.name === 'password') this.password = input.value;
    this.error = '';
  };

  private onCredentialsChanged = (event: Event) => {
    this.useMailCredentials = (event.target as HTMLInputElement).checked;
    this.mailCredentialsChosenForServer = this.useMailCredentials;
    this.password = '';
    this.error = '';
  };

  private save = async (event: SubmitEvent) => {
    event.preventDefault();
    if (this.submitting || !this.saved) return;
    const form = event.currentTarget as HTMLFormElement;
    if (!form.reportValidity()) return;
    // Shared inputs live in their own shadow roots and are not associated
    // with this form, so its native validation cannot see their constraints.
    for (const input of form.querySelectorAll<AlpsInput>('alps-input')) {
      if (input.reportValidity()) continue;
      input.focus();
      return;
    }
    if (!this.useMailCredentials && !this.saved.can_save) {
      this.error = 'settings.dav.keyRequired';
      return;
    }
    const body = {
      server: this.server.trim(), use_mail_credentials: this.useMailCredentials,
      username: this.useMailCredentials ? '' : this.username.trim(),
      ...(!this.useMailCredentials && this.password ? { password: this.password } : {}),
    };
    await this.mutate('PUT', body);
  };

  private askRemove = () => {
    if (this.submitting || this.loading || !this.hasPersonalConnection || this.removal) return;
    this.removal = { generation: this.generation, account: this.account };
  };

  private confirmRemove = async (removal: Removal) => {
    if (this.removal !== removal || !this.current(removal.generation)
      || removal.account !== this.account || removal.account !== this.currentAccount()
      || !this.hasPersonalConnection || this.submitting) return;
    this.removal = null;
    await this.mutate('DELETE');
  };

  private get hasPersonalConnection(): boolean {
    return this.saved?.personal_configured === true || this.unreadablePersonal;
  }

  private invalidateDAVPages() {
    // A lost/cancelled reply does not prove the server did not save. Retained
    // editors must not carry the previous connection's objects into a newly
    // saved account. No configured flag is guessed; the shell reads /session.
    window.dispatchEvent(new CustomEvent('dav-connections-updated', {
      detail: { service: this.service },
    }));
  }

  private async mutate(method: 'PUT' | 'DELETE', body?: object) {
    const generation = this.invalidate();
    this.submitting = true;
    this.error = '';
    try {
      const settings = await this.request(method, generation, body);
      if (!settings || !this.current(generation)) return;
      this.apply(settings);
      const success = method === 'PUT' ? 'settings.dav.saved'
        : settings.default_server ? 'settings.dav.resetDone' : 'settings.dav.removed';
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.t(success) } }));
      window.dispatchEvent(new CustomEvent('dav-connections-updated', {
        detail: { service: this.service, configured: settings.configured },
      }));
    } catch (error) {
      if (!this.current(generation)) return;
      const refused = error instanceof SettingsError && [
        'dav_invalid_server', 'dav_credentials_required', 'dav_password_required',
        'dav_login_key_required', 'dav_auth_failed', 'dav_session_ended',
      ].includes(error.code);
      if (!refused) this.invalidateDAVPages();
      this.error = this.errorKey(error);
      void this.updateComplete.then(() => {
        if (this.current(generation)) this.shadowRoot?.querySelector<HTMLElement>('[role="alert"]')?.focus();
      });
    } finally {
      if (this.current(generation)) this.submitting = false;
    }
  }

  render() {
    const removal = this.removal;
    return html`
      ${removal ? html`
        <ui-confirm
          heading=${this.t('settings.dav.remove')}
          message=${this.t('settings.dav.removeConfirm')}
          confirmText=${this.t('settings.dav.remove')}
          cancelText=${this.t('general.cancel')}
          .isDanger=${true}
          .dismissible=${true}
          @confirm=${() => this.confirmRemove(removal)}
          @cancel=${() => { if (this.removal === removal) this.removal = null; }}
        ></ui-confirm>
      ` : nothing}
      ${this.loading ? html`<p role="status">${this.t('settings.loading')}</p>` : nothing}
      ${this.error ? html`<p class="error" role="alert" tabindex="-1">${this.t(this.error)}</p>` : nothing}
      ${!this.loading && !this.saved ? html`
        <div class="actions">
          <alps-button variant="normal" ?disabled=${this.submitting} @click=${this.load}>${this.t('settings.dav.retry')}</alps-button>
          ${this.unreadablePersonal ? html`
            <alps-button class="remove" type="button" variant="danger" ?disabled=${this.submitting} @click=${this.askRemove}>
              ${this.t('settings.dav.remove')}
            </alps-button>
          ` : nothing}
        </div>
      ` : nothing}
      ${this.saved ? html`
        <form action="/settings/dav/${this.service}" method="post"
          aria-label=${this.t(`settings.dav.${this.service}`)} @submit=${this.save}>
          <alps-setting-group label=${this.t('settings.dav.server')} description=${this.t('settings.dav.serverRequired')}>
            <alps-input name="server" type="url" icon="globe" label=${this.t('settings.dav.server')}
              .value=${this.server} ?required=${!this.saved.default_server} ?disabled=${this.submitting}
              maxlength="2048" autocomplete="url" placeholder="https://dav.example.com/" @input=${this.onInput}
            ></alps-input>
            ${this.saved.default_server ? html`
              <span class="hint">${this.t('settings.dav.defaultServer')} <bdi dir="ltr">${this.saved.default_server}</bdi></span>
            ` : nothing}
          </alps-setting-group>
          <alps-setting-group>
            <label class="checkbox-label">
              <input name="use_mail_credentials" type="checkbox" .checked=${this.useMailCredentials}
                ?disabled=${this.submitting} @change=${this.onCredentialsChanged}>
              ${this.t('settings.dav.useMailCredentials')}
            </label>
            ${!this.saved.can_save ? html`<span class="hint">${this.t('settings.dav.keyRequired')}</span>` : nothing}
          </alps-setting-group>
          ${!this.useMailCredentials ? html`
            <alps-setting-group label=${this.t('settings.dav.username')}>
              <alps-input name="username" type="text" icon="at" label=${this.t('settings.dav.username')}
                .value=${this.username} required ?disabled=${this.submitting} maxlength="1024"
                autocomplete="section-${this.service} username" @input=${this.onInput}
              ></alps-input>
            </alps-setting-group>
            <alps-setting-group label=${this.t('settings.dav.password')}
              description=${this.t(this.needsPassword ? 'settings.dav.enterPassword' : 'settings.dav.passwordConfigured')}>
              <alps-input name="password" type="password" icon="key" label=${this.t('settings.dav.password')}
                .value=${this.password} ?required=${this.needsPassword} ?disabled=${this.submitting} maxlength="4096"
                autocomplete="section-${this.service} current-password" @input=${this.onInput}
              ></alps-input>
            </alps-setting-group>
          ` : nothing}
          <div class="actions">
            <alps-button type="submit" variant="primary" ?disabled=${this.submitting} ?spinning=${this.submitting}>
              ${this.t(this.submitting ? 'settings.dav.saving' : 'settings.dav.save')}
            </alps-button>
            ${this.saved.personal_configured ? html`
              <alps-button class="remove" type="button" variant="danger" ?disabled=${this.submitting} @click=${this.askRemove}>
                ${this.t('settings.dav.remove')}
              </alps-button>
            ` : nothing}
          </div>
        </form>
      ` : nothing}
    `;
  }
}

@customElement('alps-caldav-settings')
export class CalDAVSettings extends DavConnectionSettings {
  protected service: Service = 'caldav';
}

@customElement('alps-carddav-settings')
export class CardDAVSettings extends DavConnectionSettings {
  protected service: Service = 'carddav';
}
