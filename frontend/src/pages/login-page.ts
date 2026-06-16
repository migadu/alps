import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { composeContext, ComposeStore } from '../store/compose-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon } from '../utils/ui';
import { takeLoginNotice, type LoginNotice } from '../utils/login-notice';

import '../components/alps-auth-card';
import '../components/alps-input';
import '../components/alps-button';
import '../components/alps-loader';
import '../components/alps-icon-btn';

@customElement('login-page')
export class LoginPage extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  static styles = css`
    .form-group {
      margin-bottom: 16px;
      position: relative;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .native-input {
      width: 100%;
      height: 36px;
      padding: 0 12px;
      background: var(--alps-input-bg, var(--bg-primary, #ffffff));
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--input-radius, 6px);
      color: var(--text-primary, #111827);
      font-family: var(--font-base, 'Inter', sans-serif);
      font-size: var(--input-font-size, 14px);
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }

    .has-left-icon .native-input {
      padding-left: 36px;
    }

    .native-input:focus {
      border-color: var(--accent-color, #005A9E);
      box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
    }

    .native-input::placeholder {
      color: var(--text-muted, #9ca3af);
    }

    .icon-left {
      position: absolute;
      left: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      color: var(--text-muted, #9ca3af);
      pointer-events: none;
    }

    .icon-left svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }

    .checkbox-group label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 14px;
      color: var(--text-secondary, #4b5563);
      user-select: none;
    }

    .checkbox-group input[type="checkbox"] {
      width: 16px;
      height: 16px;
      margin: 0;
      margin-right: 8px;
      cursor: pointer;
      accent-color: var(--accent-color, #2563eb);
    }

    .error-container {
      border-radius: var(--radius-md, 6px);
      padding: 8px 12px;
      margin-bottom: 24px;
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }

    .error-text {
      color: var(--error, #ef4444);
      font-size: 14px;
      margin: 0;
      text-align: center;
    }

    .notice-container {
      border-radius: var(--radius-md, 6px);
      padding: 8px 12px;
      margin-bottom: 24px;
      background: var(--bg-tertiary, rgba(0, 0, 0, 0.04));
      border: 1px solid var(--border-color, #e5e7eb);
    }

    .notice-text {
      color: var(--text-secondary, #4b5563);
      font-size: 14px;
      margin: 0;
      text-align: center;
    }

    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }

    .submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 36px;
      margin-top: 4px;
      gap: 8px;
      background-color: var(--accent-color, #3b82f6);
      color: #ffffff;
      border: 1px solid transparent;
      border-radius: var(--btn-radius, 4px);
      font-family: inherit;
      font-size: var(--btn-font-size, 14px);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }

    .submit-btn:hover:not(:disabled) {
      background-color: var(--accent-hover, #2563eb);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .submit-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .spinner {
      animation: spin 1s linear infinite;
      display: flex;
      width: 18px;
      height: 18px;
    }

    .spinner svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
  `;

  @state() private notice: LoginNotice | null = null;
  @state() private username = '';
  @state() private password = '';
  @state() private rememberMe = false;
  @state() private error = '';
  @state() private isSubmitting = false;
  @state() private retryAfter = 0; // Seconds until retry allowed
  @state() private isRateLimited = false;

  private retryCountdownInterval?: ReturnType<typeof setInterval>;

  @consume({ context: composeContext, subscribe: true })
  composeStore!: ComposeStore;

  private _handleI18nChange = () => {
    this.requestUpdate();
  };

  connectedCallback() {
    super.connectedCallback();
    this.notice = takeLoginNotice();
    this.updateComplete.then(() => {
      this.i18nStore?.addEventListener('change', this._handleI18nChange);
    });
    if (this.composeStore) {
      this.composeStore.clearAllComposers();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);
    if (this.retryCountdownInterval) {
      clearInterval(this.retryCountdownInterval);
    }
  }

  private startRetryCountdown(seconds: number) {
    this.retryAfter = seconds;
    this.isRateLimited = true;

    // Clear any existing countdown
    if (this.retryCountdownInterval) {
      clearInterval(this.retryCountdownInterval);
    }

    // Update countdown every second
    this.retryCountdownInterval = setInterval(() => {
      this.retryAfter--;
      if (this.retryAfter <= 0) {
        this.isRateLimited = false;
        if (this.retryCountdownInterval) {
          clearInterval(this.retryCountdownInterval);
          this.retryCountdownInterval = undefined;
        }
      }
    }, 1000);
  }

  private formatRetryTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (this.isSubmitting) return;

    // Validate native inputs
    const form = this.shadowRoot?.querySelector('form');
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    this.error = '';
    this.isSubmitting = true;

    try {
      // Small artificial delay to show off the premium animation
      await new Promise(resolve => setTimeout(resolve, 600));

      const payload = {
        username: this.username,
        password: this.password,
        "remember-me": this.rememberMe ? "on" : ""
      };

      const response = await fetch('/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires_2fa) {
          window.location.hash = '/login/webauthn';
          this.isSubmitting = false;
        } else {
          window.dispatchEvent(new CustomEvent('user-logged-in'));
          window.location.hash = '/mailbox/INBOX';
        }
      } else {
        // Check if this is a rate limiting error (HTTP 429)
        if (response.status === 429 && data.retry_after) {
          this.error = data.error || this.i18nStore?.t('login.tooManyAttempts');
          this.startRetryCountdown(data.retry_after);
        } else {
          this.error = data.error || this.i18nStore?.t('login.loginFailed');
          this.isRateLimited = false;
        }
        this.isSubmitting = false;
      }
    } catch (err) {
      this.error = this.i18nStore?.t('login.networkError');
      this.isSubmitting = false;
      this.isRateLimited = false;
    }
  }

  render() {
    return html`
      <alps-auth-card 
        icon="edelweiss" 
        title="Alps" 
        subtitle="${this.i18nStore?.t('login.subtitle')}">

        ${this.notice && !this.error ? html`
          <div class="notice-container">
            <p class="notice-text">${this.i18nStore?.t(`login.${this.notice}`)}</p>
          </div>
        ` : ''}

        ${this.error ? html`
          <div class="error-container">
            <p class="error-text">
              ${this.error}
              ${this.isRateLimited && this.retryAfter > 0 ? html`
                <br><strong>${this.i18nStore?.t('login.pleaseWait')} ${this.formatRetryTime(this.retryAfter)}</strong>
              ` : ''}
            </p>
          </div>
        ` : ''}

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <div class="input-wrapper has-left-icon">
              <span class="icon-left">${renderIcon('at')}</span>
              <input 
                type="text" 
                id="username" 
                name="username"
                class="native-input"
                placeholder="${this.i18nStore?.t('login.emailPlaceholder')}"
                .value=${this.username}
                @input=${(e: Event) => this.username = (e.target as HTMLInputElement).value}
                required
                autocomplete="username"
              />
            </div>
          </div>
          <div class="form-group">
            <div class="input-wrapper has-left-icon">
              <span class="icon-left">${renderIcon('key')}</span>
              <input 
                type="password" 
                id="password" 
                name="password"
                class="native-input"
                placeholder="${this.i18nStore?.t('login.passwordPlaceholder')}"
                .value=${this.password}
                @input=${(e: Event) => this.password = (e.target as HTMLInputElement).value}
                required
                autocomplete="current-password"
              />
            </div>
          </div>
          <div class="checkbox-group">
            <label>
              <input 
                type="checkbox" 
                .checked=${this.rememberMe}
                @change=${(e: Event) => this.rememberMe = (e.target as HTMLInputElement).checked}
              />
              ${this.i18nStore?.t('login.keepMeSignedIn')}
            </label>
          </div>
          <button 
            type="submit" 
            class="submit-btn"
            ?disabled=${this.isSubmitting || this.isRateLimited}>
            ${this.isSubmitting ? html`<alps-loader style="--loader-size: 16px;"></alps-loader>` : ''}
            <span>${this.isRateLimited ? `${this.i18nStore?.t('login.wait')} ${this.formatRetryTime(this.retryAfter)}` : this.i18nStore?.t('login.signIn')}</span>
          </button>
        </form>
      </alps-auth-card>
    `;
  }
}
