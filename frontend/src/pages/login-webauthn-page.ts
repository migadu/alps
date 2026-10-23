import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authenticateCredential, InvalidOptionsError, isWebAuthnSupported } from '../utils/webauthn-utils';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { setLoginNotice } from '../utils/login-notice';


import '../components/alps-auth-card';

/** A POST's answer, with its body read as JSON: `null` when it was not JSON,
 * as from a proxy's error page. */
interface Answer {
  ok: boolean;
  status: number;
  body: any;
}

/** Null when there was no answer at all: offline, or a dropped connection. */
async function post(url: string, init: RequestInit = {}): Promise<Answer | null> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, method: 'POST' });
  } catch {
    return null;
  }
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { ok: response.ok, status: response.status, body };
}

/** The server, or a proxy in front of it, could not answer: not a verdict on
 * the key. */
const isOutage = (answer: Answer) => answer.status >= 500 || (answer.ok && answer.body === null);

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
    
    /* The theme defines --error / --success / --accent-color. There has never
       been a --color-* family, nor any -muted variant, so every declaration in
       this block resolved to nothing: the status banner on the second-factor
       screen — the element that tells the user whether their security key
       worked — rendered with no background, no border and inherited text. */
    .status.error {
      background: color-mix(in srgb, var(--error, #ef4444) 12%, transparent);
      color: var(--error, #ef4444);
      border: 1px solid color-mix(in srgb, var(--error, #ef4444) 30%, transparent);
    }
    
    .status.info {
      background: color-mix(in srgb, var(--accent-color, #2563eb) 12%, transparent);
      color: var(--accent-color, #2563eb);
      border: 1px solid color-mix(in srgb, var(--accent-color, #2563eb) 30%, transparent);
    }
    
    .status.success {
      background: color-mix(in srgb, var(--success, #16a34a) 12%, transparent);
      color: var(--success, #16a34a);
      border: 1px solid color-mix(in srgb, var(--success, #16a34a) 30%, transparent);
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

  /**
   * The password was accepted; the pending sign-in it left behind has expired
   * or is gone, so there is no key left to check. Back to the password, with
   * a word on why.
   */
  private _backToPassword() {
    try {
      sessionStorage.removeItem('pending_2fa_username');
      sessionStorage.removeItem('pending_2fa_is_switch');
    } catch {}
    setLoginNotice('secondFactorExpired');
    window.location.hash = '#/login';
  }

  /**
   * One run of the ceremony: options from the server, the key, the server's
   * verdict on it.
   *
   * An outage is told apart from a verdict. Neither answer's status was
   * checked before its body was read, so an outage the server reported as
   * JSON read as a refused key, "Verification failed", to someone whose key
   * works; a proxy's HTML error page showed the parser's SyntaxError; and a
   * dropped connection showed the browser's "Failed to fetch". An outage now
   * says so and stays here, where Verify runs the ceremony again without the
   * password being asked for twice.
   */
  private async _handleVerify() {
    this.isLoading = true;
    this.statusMessage = this.i18nStore?.t('webauthn.requesting');
    this.statusType = 'info';

    try {
      // 1. Begin authentication
      const begin = await post('/webauthn/verify/begin');
      if (begin === null) throw new Error(this.i18nStore?.t('login.networkError'));
      if (begin.status === 401) return this._backToPassword();
      if (isOutage(begin)) throw new Error(this.i18nStore?.t('webauthn.errors.unavailable'));
      if (!begin.ok) {
        throw new Error(this.i18nStore?.t('webauthn.errors.begin_failed'));
      }

      const credentialRequestOptions = begin.body;

      if (!credentialRequestOptions || !credentialRequestOptions.publicKey) {
        throw new Error(this.i18nStore?.t('webauthn.errors.invalid_options'));
      }

      // 2. Authenticate via browser
      this.statusMessage = this.i18nStore?.t('webauthn.waiting_for_key');
      const credential = await authenticateCredential(credentialRequestOptions);

      // 3. Finish authentication
      this.statusMessage = this.i18nStore?.t('webauthn.verifying');
      const finish = await post('/webauthn/verify/finish', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential)
      });
      if (finish === null) throw new Error(this.i18nStore?.t('login.networkError'));
      if (finish.status === 401) return this._backToPassword();
      if (isOutage(finish)) throw new Error(this.i18nStore?.t('webauthn.errors.unavailable'));

      const result = finish.body;

      if (finish.ok && result?.success) {
        this.statusMessage = this.i18nStore?.t('webauthn.success');
        this.statusType = 'success';
        this.isSuccess = true;

        let isSwitch = false;
        try {
          isSwitch = sessionStorage.getItem('pending_2fa_is_switch') === '1';
          sessionStorage.removeItem('pending_2fa_is_switch');
        } catch {}

        let username = result.username;
        if (!username) {
          try {
            username = sessionStorage.getItem('pending_2fa_username') || '';
            sessionStorage.removeItem('pending_2fa_username');
          } catch {}
        } else {
          try {
            sessionStorage.removeItem('pending_2fa_username');
          } catch {}
        }

        // Complete the login flow
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('user-logged-in', {
            detail: { username }
          }));
          window.location.hash = '/mailbox/INBOX';
          if (isSwitch && typeof window.location.reload === 'function') {
            try {
              window.location.reload();
            } catch {}
          }
        }, 500);
      } else {
        throw new Error(this.i18nStore?.t('webauthn.errors.verification_failed'));
      }
    } catch (err: any) {
      // The browser's words are English whatever the language here (Chrome's
      // for a cancelled prompt even link to the WebAuthn specification). A
      // prompt cancelled or timed out is a key that was not used, and Verify
      // asks for it again; any other browser error is told as a general
      // error, in the user's language. Options that cannot be decoded are
      // told as options without a publicKey are.
      if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') {
        this.statusMessage = this.i18nStore?.t('webauthn.errors.cancelled');
      } else if (err instanceof InvalidOptionsError) {
        this.statusMessage = this.i18nStore?.t('webauthn.errors.invalid_options');
      } else if (err instanceof DOMException) {
        this.statusMessage = this.i18nStore?.t('webauthn.errors.general');
      } else {
        this.statusMessage = err.message || this.i18nStore?.t('webauthn.errors.general');
      }
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
