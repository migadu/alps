import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { composeContext, ComposeStore } from '../store/compose-store';
import { i18nContext, I18nStore } from '../store/i18n-store';


import '../components/alps-auth-card';
import '../components/alps-input';

@customElement('login-page')
export class LoginPage extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  static styles = css`
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

    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }
  `;

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

    // Validate custom inputs
    const inputs = this.shadowRoot?.querySelectorAll('alps-input');
    if (inputs) {
      for (const input of Array.from(inputs)) {
        if (typeof (input as any).reportValidity === 'function') {
          if (!(input as any).reportValidity()) {
            return;
          }
        }
      }
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
      <alps-auth-card 
        icon="edelweiss" 
        title="Alps" 
        subtitle="${this.i18nStore?.t('login.subtitle')}">
        
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

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <alps-input 
              type="email" 
              inputId="username" 
              placeholder="${this.i18nStore?.t('login.emailPlaceholder')}"
              .value=${this.username}
              @input=${(e: Event) => this.username = (e.target as HTMLInputElement).value}
              ?required=${true}
              autocomplete="username"
            ></alps-input>
          </div>
          <div class="form-group">
            <alps-input 
              type="password" icon="key"
              inputId="password" 
              placeholder="${this.i18nStore?.t('login.passwordPlaceholder')}"
              .value=${this.password}
              @input=${(e: Event) => this.password = (e.target as HTMLInputElement).value}
              ?required=${true}
              autocomplete="current-password"
            ></alps-input>
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
          <alps-button 
            type="submit" 
            variant="primary" 
            full-width
            style="height: 36px; margin-top: 4px;"
            ?disabled=${this.isSubmitting || this.isRateLimited}
            ?spinning=${this.isSubmitting}>
            ${this.isRateLimited ? `Wait ${this.formatRetryTime(this.retryAfter)}` : 'Sign In'}
          </alps-button>
        </form>
      </alps-auth-card>
    `;
  }
}
