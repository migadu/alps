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

    .code-label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary, #111827);
    }

    /* As the login form's fields. A code is written left to right in every
       language. */
    .code-input {
      width: 100%;
      height: 36px;
      padding: 0 12px;
      background: var(--alps-input-bg, var(--bg-primary, #ffffff));
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--input-radius, 6px);
      color: var(--text-primary, #111827);
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: var(--input-font-size, 14px);
      box-sizing: border-box;
      outline: none;
    }

    .code-input:focus {
      border-color: var(--accent-color, #005A9E);
      box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
      outline: 2px solid transparent;
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

  /** The key is not at hand, and a recovery code is given in its place. */
  @state()
  private usingCode = false;

  @state()
  private recoveryCodesAvailable = true;

  @state()
  private code = '';

  @state()
  private codeBusy = false;

  private _handleI18nChange = () => {
    this.requestUpdate();
  };

  /** The ceremony the page starts by itself, until it runs or is not needed. */
  private _autoVerify: ReturnType<typeof setTimeout> | undefined;
  private _completeLogin: ReturnType<typeof setTimeout> | undefined;
  private _verification: AbortController | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      if (this.isConnected) this.i18nStore?.addEventListener('change', this._handleI18nChange);
    });
    
    if (!isWebAuthnSupported()) {
      this.statusMessage = this.i18nStore?.t('webauthn.not_supported');
      this.statusType = 'error';
    } else {
      // Auto-trigger the WebAuthn prompt shortly after DOM mounts
      this._autoVerify = setTimeout(() => {
        this._handleVerify();
      }, 300);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._cancelVerification();
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);
  }

  /** Leaving cancels the native prompt and makes even an uncancellable old
   * answer inert. Reconnecting the same page may start a fresh ceremony. */
  private _cancelVerification() {
    clearTimeout(this._autoVerify);
    clearTimeout(this._completeLogin);
    this._verification?.abort();
    this._verification = null;
    this.isLoading = false;
    this.isSuccess = false;
  }

  private _backToLogin() {
    this._cancelVerification();
    window.location.hash = '#/login';
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
    this._backToLogin();
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
   *
   * One ceremony at a time. Each `begin` replaces the challenge the server
   * keeps for the session, so a second ceremony made the first one's
   * assertion fail against the wrong challenge, and the browser showed only
   * one of the two prompts. A click on Verify within the 300 ms before the
   * automatic start did exactly that, since the button is disabled only
   * while a ceremony runs. Whichever starts first, the other does nothing.
   */
  private async _handleVerify() {
    clearTimeout(this._autoVerify);
    if (!this.isConnected || this.isLoading || this.isSuccess) return;
    const verification = new AbortController();
    this._verification = verification;
    const current = () => this.isConnected && this._verification === verification && !verification.signal.aborted;
    this.isLoading = true;
    this.statusMessage = this.i18nStore?.t('webauthn.requesting');
    this.statusType = 'info';

    try {
      // 1. Begin authentication
      const begin = await post('/webauthn/verify/begin', { signal: verification.signal });
      if (!current()) return;
      if (begin === null) throw new Error(this.i18nStore?.t('login.networkError'));
      if (begin.status === 401) return this._backToPassword();
      if (isOutage(begin)) throw new Error(this.i18nStore?.t('webauthn.errors.unavailable'));
      if (!begin.ok) {
        throw new Error(this.i18nStore?.t('webauthn.errors.begin_failed'));
      }

      const credentialRequestOptions = begin.body;
      this.recoveryCodesAvailable = begin.body?.recoveryCodesAvailable !== false;

      if (!credentialRequestOptions || !credentialRequestOptions.publicKey) {
        throw new Error(this.i18nStore?.t('webauthn.errors.invalid_options'));
      }

      // 2. Authenticate via browser
      this.statusMessage = this.i18nStore?.t('webauthn.waiting_for_key');
      const credential = await authenticateCredential({ ...credentialRequestOptions, signal: verification.signal });
      if (!current()) return;

      // 3. Finish authentication
      this.statusMessage = this.i18nStore?.t('webauthn.verifying');
      const finish = await post('/webauthn/verify/finish', {
        signal: verification.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential)
      });
      if (!current()) return;
      if (finish === null) throw new Error(this.i18nStore?.t('login.networkError'));
      if (finish.status === 401) return this._backToPassword();
      if (isOutage(finish)) throw new Error(this.i18nStore?.t('webauthn.errors.unavailable'));

      const result = finish.body;

      if (finish.ok && result?.success) {
        this._signedIn(result, current);
      } else {
        throw new Error(this.i18nStore?.t('webauthn.errors.verification_failed'));
      }
    } catch (err: any) {
      if (!current()) return;
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
      if (current()) this.isLoading = false;
    }
  }

  /**
   * The second factor was given, with the key or a recovery code: on to the
   * mailbox, as the sign-in or account switch that waited for it meant.
   * `current` says whether the page is still the one that gave it.
   */
  private _signedIn(result: any, current: () => boolean) {
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
    this._completeLogin = setTimeout(() => {
      if (!current()) return;
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
  }

  /**
   * The key is not at hand: a recovery code stands in for it. The ceremony
   * under way is cancelled, as leaving the page cancels it.
   */
  private _useCode() {
    this._cancelVerification();
    this.usingCode = true;
    this.statusMessage = '';
    this.updateComplete.then(() => this.renderRoot.querySelector<HTMLInputElement>('#recovery-code')?.focus());
  }

  /** Back to the key, with a new ceremony. */
  private _useKey() {
    this.usingCode = false;
    this.code = '';
    this.statusMessage = '';
    this._handleVerify();
  }

  private _codeError(key: string) {
    this.statusMessage = this.i18nStore?.t(key);
    this.statusType = 'error';
  }

  /**
   * Gives the code typed in the key's place. The server takes it as written
   * down, in capitals or with spaces, and spends it. A refusal is said here,
   * where another code can be typed: a wrong or used code as one, a throttle
   * and an outage in their own words.
   */
  private async _submitCode(e?: Event) {
    e?.preventDefault();
    if (this.codeBusy || this.isSuccess) return;
    const code = this.code.trim();
    if (!code) return this._codeError('webauthn.recovery.code_required');

    this.codeBusy = true;
    this.statusMessage = this.i18nStore?.t('webauthn.verifying');
    this.statusType = 'info';
    try {
      const answer = await post('/webauthn/verify/recovery', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (!this.isConnected || !this.usingCode) return;
      if (answer === null) return this._codeError('login.networkError');
      if (answer.status === 401) return this._backToPassword();
      if (answer.status === 429) return this._codeError('webauthn.errors.rate_limited');
      if (answer.body?.error === 'recovery_unavailable') return this._codeError('webauthn.recovery.unavailable');
      if (isOutage(answer)) return this._codeError('webauthn.errors.unavailable');
      if (answer.ok && answer.body?.success) return this._signedIn(answer.body, () => this.isConnected);
      this._codeError(answer.body?.error === 'code_required' ? 'webauthn.recovery.code_required' : 'webauthn.recovery.wrong_code');
    } finally {
      this.codeBusy = false;
    }
  }

  private _renderCode() {
    return html`
      <form @submit=${this._submitCode}>
        <label class="code-label" for="recovery-code">${this.i18nStore?.t('webauthn.recovery.code_label')}</label>
        <input
          id="recovery-code"
          class="code-input"
          type="text"
          dir="ltr"
          autocomplete="one-time-code"
          autocapitalize="none"
          spellcheck="false"
          .value=${this.code}
          ?disabled=${this.isSuccess}
          @input=${(e: Event) => this.code = (e.target as HTMLInputElement).value}
        />
      </form>

      <alps-button
        variant="primary"
        full-width
        style="height: 36px; margin-top: 16px;"
        @click=${() => this._submitCode()}
        ?disabled=${this.codeBusy || this.isSuccess}
        ?spinning=${this.codeBusy}
      >
        ${this.i18nStore?.t('login.signIn')}
      </alps-button>

      <alps-button
        variant="text"
        full-width
        style="height: 36px; margin-top: 8px;"
        @click=${this._useKey}
        ?disabled=${this.codeBusy || this.isSuccess}
      >
        ${this.i18nStore?.t('webauthn.recovery.use_key')}
      </alps-button>
    `;
  }

  render() {
    return html`
      <alps-auth-card
        icon="fingerprint"
        title="${this.i18nStore?.t('webauthn.title')}"
        subtitle="${this.i18nStore?.t(this.usingCode ? 'webauthn.recovery.instruction' : 'webauthn.instruction')}"
        style="--auth-card-icon-color: var(--accent-color, #2563eb); --auth-card-icon-size: 64px;"
      >
        ${this.statusMessage ? html`
          <div class="status ${this.statusType}">
            ${this.statusMessage}
          </div>
        ` : ''}
        
        ${this.usingCode ? this._renderCode() : html`
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

          <!-- The way in when the key is not at hand. Offered while a
               ceremony runs too: the browser's prompt may wait for a key
               that never comes. -->
          ${this.recoveryCodesAvailable ? html`
          <alps-button
            variant="text"
            full-width
            style="height: 36px; margin-top: 8px;"
            @click=${this._useCode}
            ?disabled=${this.isSuccess}
          >
            ${this.i18nStore?.t('webauthn.use_recovery_code')}
          </alps-button>
          ` : ''}
        `}
        
        <alps-button 
          variant="text"
          full-width
          style="height: 36px; margin-top: 8px;"
          @click=${this._backToLogin}
        >
          ← ${this.i18nStore?.t('webauthn.back_to_login')}
        </alps-button>
      </alps-auth-card>
    `;
  }
}
