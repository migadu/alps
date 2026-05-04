import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { composeContext, ComposeStore } from '../store/compose-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon } from '../utils/ui';

@customElement('login-page')
export class LoginPage extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  static styles = css`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      background: var(--bg-secondary, #f9fafb);
      position: relative;
    }

    .card {
      position: relative;
      z-index: 1;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      padding: 32px;
      border-radius: var(--radius-lg, 8px);
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      width: 100%;
      max-width: 360px;
      color: var(--text-primary, #111827);
    }

    .logo-container {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;
    }

    .logo-container svg {
      width: 40px;
      height: 40px;
    }

    h1 {
      margin-top: 0;
      margin-bottom: 4px;
      text-align: center;
      font-family: var(--font-heading, 'Inter', sans-serif);
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary, #111827);
    }

    p.subtitle {
      text-align: center;
      color: var(--text-secondary, #4b5563);
      margin-bottom: 24px;
      font-size: 14px;
    }

    .form-group {
      margin-bottom: 16px;
      position: relative;
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

    input {
      width: 100%;
      height: 36px;
      padding: 0 12px;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--input-radius, 6px);
      color: var(--text-primary, #111827);
      font-family: var(--font-base, 'Inter', sans-serif);
      font-size: var(--input-font-size, 14px);
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }

    input:focus {
      border-color: var(--accent-color, #005A9E);
      box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
    }

    input::placeholder {
      color: var(--text-muted, #9ca3af);
    }

    button {
      width: 100%;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 16px;
      background: var(--accent-color, #2563eb);
      color: white;
      border: none;
      border-radius: var(--btn-radius, 6px);
      font-family: var(--font-base, 'Inter', sans-serif);
      font-weight: 500;
      font-size: var(--btn-font-size, 14px);
      cursor: pointer;
      margin-top: 4px;
      transition: background 0.2s ease, transform 0.1s ease;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }

    button:hover:not(:disabled) {
      background: var(--accent-hover, #1d4ed8);
    }

    button:active:not(:disabled) {
      transform: scale(0.98);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      display: inline-flex;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      position: absolute;
      top: calc(50% - 12px);
      left: calc(50% - 12px);
      color: #fff;
    }

    .spinner svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-container {
      background: #fef2f2;
      border: 1px solid #fecaca;
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

    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }

    .btn-text {
      transition: opacity 0.2s;
    }
    
    .btn-text.hidden {
      opacity: 0;
    }

    .tfa-warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: var(--radius-md, 6px);
      padding: 16px;
      margin-bottom: 24px;
      text-align: center;
    }

    .tfa-warning p {
      color: #b45309;
      font-size: 14px;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }

    .tfa-warning strong {
      color: #92400e;
    }

    .back-to-login-btn {
      margin-top: 8px;
      background: transparent;
      border: 1px solid #d97706;
      color: #d97706;
      box-shadow: none;
    }

    .back-to-login-btn:hover:not(:disabled) {
      background: #fef3c7;
    }
  `;

  @state() private username = '';
  @state() private password = '';
  @state() private rememberMe = false;
  @state() private error = '';
  @state() private isSubmitting = false;
  @state() private requires2FA = false;
  @state() private retryAfter = 0; // Seconds until retry allowed
  @state() private isRateLimited = false;

  private retryCountdownInterval?: ReturnType<typeof setInterval>;

  @consume({ context: composeContext, subscribe: true })
  composeStore!: ComposeStore;

  connectedCallback() {
    super.connectedCallback();
    if (this.composeStore) {
      this.composeStore.clearAllComposers();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
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
          this.requires2FA = true;
          this.isSubmitting = false;
        } else {
          window.dispatchEvent(new CustomEvent('user-logged-in'));
          window.location.hash = '/mailbox/INBOX';
        }
      } else {
        // Check if this is a rate limiting error (HTTP 429)
        if (response.status === 429 && data.retry_after) {
          this.error = data.error || 'Too many login attempts';
          this.startRetryCountdown(data.retry_after);
        } else {
          this.error = data.error || 'Login failed. Please check your credentials.';
          this.isRateLimited = false;
        }
        this.isSubmitting = false;
      }
    } catch (err) {
      this.error = 'Network error occurred. Please try again.';
      this.isSubmitting = false;
      this.isRateLimited = false;
    }
  }

  render() {
    return html`
      <div class="card">
        <div class="logo-container">
          ${renderIcon('edelweiss')}
        </div>
        <h1>Alps</h1>
        <p class="subtitle">${this.i18nStore?.t('login.subtitle')}</p>
        
        ${this.error ? html`
          <div class="error-container">
            <p class="error-text">
              ${this.error}
              ${this.isRateLimited && this.retryAfter > 0 ? html`
                <br><strong>Please wait ${this.formatRetryTime(this.retryAfter)}</strong>
              ` : ''}
            </p>
          </div>
        ` : ''}

        ${this.requires2FA ? html`
          <div class="tfa-warning">
            <p><strong>Two-Factor Authentication Required</strong></p>
            <p>WebAuthn/2FA is not yet supported in the new frontend interface. Please disable 2FA to log in, or wait for the update.</p>
            <button type="button" class="back-to-login-btn" @click=${() => this.requires2FA = false}>
              Go Back
            </button>
          </div>
        ` : html`
          <form @submit=${this.handleSubmit}>
            <div class="form-group">
              <input 
                type="text" 
                id="username" 
                placeholder="${this.i18nStore?.t('login.emailPlaceholder')}"
                .value=${this.username}
                @input=${(e: Event) => this.username = (e.target as HTMLInputElement).value}
                required 
                autocomplete="username"
              />
            </div>
            <div class="form-group">
              <input 
                type="password" 
                id="password" 
                placeholder="${this.i18nStore?.t('login.passwordPlaceholder')}"
                .value=${this.password}
                @input=${(e: Event) => this.password = (e.target as HTMLInputElement).value}
                required 
                autocomplete="current-password"
              />
            </div>
            <div class="checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  .checked=${this.rememberMe}
                  @change=${(e: Event) => this.rememberMe = (e.target as HTMLInputElement).checked}
                />
                Keep me signed in
              </label>
            </div>
            <button type="submit" ?disabled=${this.isSubmitting || this.isRateLimited}>
              <span class="btn-text ${this.isSubmitting ? 'hidden' : ''}">
                ${this.isRateLimited ? `Wait ${this.formatRetryTime(this.retryAfter)}` : 'Sign In'}
              </span>
              ${this.isSubmitting ? html`<div class="spinner">${renderIcon('edelweiss')}</div>` : ''}
            </button>
          </form>
        `}
      </div>
    `;
  }
}
