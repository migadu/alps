import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authenticateCredential, isWebAuthnSupported } from '../utils/webauthn-utils';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';


import '../components/alps-auth-card';

@customElement('login-webauthn-page')
export class LoginWebAuthnPage extends LitElement {
  static styles = css`
    .status {
      margin-bottom: 24px;
      padding: 8px 12px;
      border-radius: var(--radius-md, 6px);
      font-size: 14px;
      text-align: center;
    }
    
    .status.error {
      background: var(--color-error-muted);
      color: var(--color-error);
      border: 1px solid var(--color-error-muted);
    }
    
    .status.info {
      background: var(--color-info-muted);
      color: var(--color-info);
      border: 1px solid var(--color-info-muted);
    }
    
    .status.success {
      background: var(--color-success-muted);
      color: var(--color-success);
      border: 1px solid var(--color-success-muted);
    }
    

  `;

  @consume({ context: i18nContext })
  private i18nStore!: I18nStore;

  @state()
  private statusMessage = '';

  @state()
  private statusType: 'error' | 'info' | 'success' = 'info';

  @state()
  private isLoading = false;

  @state()
  private isSuccess = false;

  private _handleI18nChange = () => {
    this.requestUpdate();
  };

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      this.i18nStore?.addEventListener('change', this._handleI18nChange);
    });
    
    if (!isWebAuthnSupported()) {
      this.statusMessage = this.i18nStore?.t('webauthn.not_supported');
      this.statusType = 'error';
    } else {
      // Auto-trigger the WebAuthn prompt shortly after DOM mounts
      setTimeout(() => {
        this._handleVerify();
      }, 300);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);
  }

  private async _handleVerify() {
    this.isLoading = true;
    this.statusMessage = this.i18nStore?.t('webauthn.requesting');
    this.statusType = 'info';

    try {
      // 1. Begin authentication
      const beginResponse = await fetch('/webauthn/verify/begin', { method: 'POST' });
      if (!beginResponse.ok) {
        throw new Error(this.i18nStore?.t('webauthn.errors.begin_failed'));
      }

      const credentialRequestOptions = await beginResponse.json();

      if (!credentialRequestOptions || !credentialRequestOptions.publicKey) {
        throw new Error(this.i18nStore?.t('webauthn.errors.invalid_options'));
      }

      // 2. Authenticate via browser
      this.statusMessage = this.i18nStore?.t('webauthn.waiting_for_key');
      const credential = await authenticateCredential(credentialRequestOptions);

      // 3. Finish authentication
      this.statusMessage = this.i18nStore?.t('webauthn.verifying');
      const finishResponse = await fetch('/webauthn/verify/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential)
      });

      const result = await finishResponse.json();

      if (result.success) {
        this.statusMessage = this.i18nStore?.t('webauthn.success');
        this.statusType = 'success';
        this.isSuccess = true;

        // Complete the login flow
        setTimeout(() => {
          // The cookies are set, we need to reload the page to ensure the app recognizes them
          // Redirect directly to inbox to avoid going back to login
          window.location.href = '/#/mailbox/INBOX';
        }, 1000);
      } else {
        throw new Error(this.i18nStore?.t('webauthn.errors.verification_failed'));
      }
    } catch (err: any) {
      this.statusMessage = err.message || this.i18nStore?.t('webauthn.errors.general');
      this.statusType = 'error';
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <alps-auth-card
        icon="fingerprint"
        title="${this.i18nStore?.t('webauthn.title')}"
        subtitle="${this.i18nStore?.t('webauthn.instruction')}"
        style="--auth-card-icon-color: var(--accent-color, #2563eb); --auth-card-icon-size: 64px;"
      >
        ${this.statusMessage ? html`
          <div class="status ${this.statusType}">
            ${this.statusMessage}
          </div>
        ` : ''}
        
        <alps-button 
          variant="primary"
          full-width
          style="height: 36px; margin-top: 4px;"
          @click=${this._handleVerify} 
          ?disabled=${this.isLoading || this.isSuccess || !isWebAuthnSupported()}
          ?spinning=${this.isLoading}
        >
          ${this.isLoading ? (this.i18nStore?.t('webauthn.verifying_btn')) : (this.i18nStore?.t('webauthn.verify_btn'))}
        </alps-button>
        
        <alps-button 
          variant="text"
          full-width
          style="height: 36px; margin-top: 8px;"
          @click=${() => window.location.hash = '#/login'}
        >
          ← ${this.i18nStore?.t('webauthn.back_to_login')}
        </alps-button>
      </alps-auth-card>
    `;
  }
}
