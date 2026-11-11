import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { activeUsername, settingsContext, SettingsStore } from '../store/settings-store';
import type { UnsavedChanges } from './settings-window';

type Service = 'caldav' | 'carddav';

interface ConnectionSettings {
  server: string;
  default_server: string;
  use_mail_credentials: boolean;
  username: string;
  password_configured: boolean;
  configured: boolean;
  can_save: boolean;
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
  @state() private showPassword = false;
  @state() private loading = true;
  @state() private submitting = false;
  @state() private error = '';
  @state() private status = '';

  private generation = 0;
  private account = '';
  private controller: AbortController | null = null;
  private mailCredentialsChosenForServer = false;

  static styles = css`
    :host { display: block; max-width: 600px; color: var(--text-primary); }
    h3 { margin-block: 0 0.5rem; font-size: 1rem; font-weight: 500; }
    p { margin-block: 0 1rem; }
    .description, .hint { color: var(--text-muted); font-size: 0.8125rem; line-height: 1.5; }
    form, fieldset { display: flex; flex-direction: column; gap: 1rem; }
    fieldset { min-inline-size: 0; border: 0; padding: 0; margin: 0; }
    legend { padding: 0; margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 500; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; }
    label { font-size: 0.875rem; }
    input:not([type='checkbox']) {
      box-sizing: border-box; inline-size: 100%; min-block-size: 48px;
      padding: 0.5rem 0.75rem; border: 1px solid var(--border-color);
      border-radius: var(--input-radius, 6px); background: var(--bg-primary);
      color: var(--text-primary); font: inherit; font-size: max(1rem, 1em);
    }
    input:focus-visible, button:focus-visible {
      outline: 2px solid var(--accent-color, #2563eb); outline-offset: 2px;
    }
    .check { display: flex; gap: 0.5rem; align-items: center; min-block-size: 48px; }
    input[type='checkbox'] { inline-size: 1rem; block-size: 1rem; accent-color: var(--accent-color, #2563eb); }
    .check label { display: flex; align-items: center; min-block-size: 48px; cursor: pointer; }
    .password-field { display: flex; align-items: center; gap: 0.5rem; }
    .password-field input { min-inline-size: 0; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    button {
      min-block-size: 48px; padding: 0.5rem 1rem; border: 1px solid var(--border-color);
      border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary);
      font: inherit; font-size: 0.875rem; cursor: pointer;
    }
    button[type='submit'] { background: var(--accent-color, #2563eb); border-color: transparent; color: white; }
    button:disabled { opacity: 0.6; cursor: default; }
    .error { color: var(--danger-color, #dc2626); font-size: 0.875rem; }
    .status { font-size: 0.875rem; }
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
    this.showPassword = false;
    const password = this.shadowRoot?.querySelector<HTMLInputElement>('[name="password"]');
    if (password) password.value = '';
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
    return ++this.generation;
  }

  private current(generation: number): boolean {
    return this.isConnected && generation === this.generation;
  }

  private clear() {
    this.saved = null;
    this.server = this.username = this.password = this.error = this.status = '';
    this.useMailCredentials = true;
    this.showPassword = false;
    this.loading = true;
    this.submitting = false;
    this.mailCredentialsChosenForServer = false;
  }

  private apply(settings: ConnectionSettings) {
    const useMailCredentials = (settings.server || settings.default_server)
      ? settings.use_mail_credentials : false;
    // Pick the public fields rather than retaining the server's entire reply.
    this.saved = {
      server: settings.server, default_server: settings.default_server,
      use_mail_credentials: useMailCredentials, username: settings.username,
      password_configured: settings.password_configured, configured: settings.configured,
      can_save: settings.can_save,
    };
    this.server = settings.server;
    this.username = settings.username;
    this.useMailCredentials = useMailCredentials;
    this.password = '';
    this.showPassword = false;
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
      if (!response.ok) throw new SettingsError(data?.error ?? 'dav_unavailable');
      if (!data || typeof data.server !== 'string' || typeof data.default_server !== 'string'
        || typeof data.username !== 'string' || typeof data.use_mail_credentials !== 'boolean'
        || typeof data.password_configured !== 'boolean' || typeof data.configured !== 'boolean'
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
    this.error = this.status = '';
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
    this.error = this.status = '';
  };

  private onCredentialsChanged = (event: Event) => {
    this.useMailCredentials = (event.target as HTMLInputElement).checked;
    this.mailCredentialsChosenForServer = this.useMailCredentials;
    this.password = '';
    this.showPassword = false;
    this.error = this.status = '';
  };

  private save = async (event: SubmitEvent) => {
    event.preventDefault();
    if (this.submitting || !this.saved) return;
    const form = event.currentTarget as HTMLFormElement;
    if (!form.reportValidity()) return;
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

  private reset = async () => {
    if (this.submitting || this.loading) return;
    await this.mutate('DELETE');
  };

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
    this.error = this.status = '';
    try {
      const settings = await this.request(method, generation, body);
      if (!settings || !this.current(generation)) return;
      this.apply(settings);
      this.status = method === 'PUT' ? 'settings.dav.saved'
        : settings.default_server ? 'settings.dav.resetDone' : 'settings.dav.removed';
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
    const id = `dav-${this.service}`;
    return html`
      <h3 id="${id}-title">${this.t(`settings.dav.${this.service}`)}</h3>
      <p class="description">${this.t('settings.dav.description')}</p>
      ${this.loading ? html`<p role="status">${this.t('settings.loading')}</p>` : nothing}
      ${this.error ? html`<p class="error" role="alert" tabindex="-1">${this.t(this.error)}</p>` : nothing}
      ${!this.loading && !this.saved ? html`
        <div class="actions">
          <button type="button" ?disabled=${this.submitting} @click=${this.load}>${this.t('settings.dav.retry')}</button>
          <button type="button" ?disabled=${this.submitting} @click=${this.reset}>${this.t('settings.dav.remove')}</button>
        </div>
      ` : nothing}
      ${this.saved ? html`
        <form action="/settings/dav/${this.service}" method="post" aria-labelledby="${id}-title" @submit=${this.save}>
          <fieldset ?disabled=${this.submitting}>
            <legend>${this.t('settings.dav.connection')}</legend>
            <div class="field">
              <label for="${id}-server">${this.t('settings.dav.server')}</label>
              <input id="${id}-server" name="server" type="url" .value=${this.server}
                placeholder="https://dav.example.com/" ?required=${!this.saved.default_server}
                maxlength="2048" autocomplete="url" autocorrect="off" autocapitalize="none" spellcheck="false"
                aria-describedby="${id}-server-hint" @input=${this.onInput}>
              <span class="hint" id="${id}-server-hint">${this.saved.default_server
                ? html`${this.t('settings.dav.defaultServer')} <bdi dir="ltr">${this.saved.default_server}</bdi>`
                : this.t('settings.dav.serverRequired')}</span>
            </div>
            <div class="check">
              <input id="${id}-mail" name="use_mail_credentials" type="checkbox"
                .checked=${this.useMailCredentials} @change=${this.onCredentialsChanged}>
              <label for="${id}-mail">${this.t('settings.dav.useMailCredentials')}</label>
            </div>
            ${!this.saved.can_save ? html`<p class="hint">${this.t('settings.dav.keyRequired')}</p>` : nothing}
            ${!this.useMailCredentials ? html`
              <div class="field">
                <label for="${id}-username">${this.t('settings.dav.username')}</label>
                <input id="${id}-username" name="username" type="text" .value=${this.username}
                  required maxlength="1024" autocomplete="section-${this.service} username"
                  autocorrect="off" autocapitalize="none" spellcheck="false" @input=${this.onInput}>
              </div>
              <div class="field">
                <label for="${id}-password">${this.t('settings.dav.password')}</label>
                <div class="password-field">
                  <input id="${id}-password" name="password" type=${this.showPassword ? 'text' : 'password'}
                    .value=${this.password} ?required=${this.needsPassword} maxlength="4096"
                    autocomplete="section-${this.service} current-password" aria-describedby="${id}-password-hint"
                    @input=${this.onInput}>
                  <button type="button" aria-pressed=${this.showPassword}
                    aria-controls="${id}-password" @click=${() => { this.showPassword = !this.showPassword; }}>
                    ${this.t(this.showPassword ? 'general.hidePassword' : 'general.showPassword')}
                  </button>
                </div>
                <span class="hint" id="${id}-password-hint">${this.t(this.needsPassword
                  ? 'settings.dav.enterPassword' : 'settings.dav.passwordConfigured')}</span>
              </div>
            ` : nothing}
            <div class="actions">
              <button type="submit">${this.t(this.submitting ? 'settings.dav.saving' : 'settings.dav.save')}</button>
              <button type="button" @click=${this.reset}>${this.t(this.saved.default_server ? 'settings.dav.reset' : 'settings.dav.remove')}</button>
            </div>
          </fieldset>
        </form>
      ` : nothing}
      <p class="status" role="status">${this.status ? this.t(this.status) : ''}</p>
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
