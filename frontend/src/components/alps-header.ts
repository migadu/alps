import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MessageCache } from '../utils/message-cache';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { composeContext, ComposeStore } from '../store/compose-store';
import { clearSessionSettings } from '../store/settings-store';
import { setLoginNotice } from '../utils/login-notice';
import './user-profile-menu';
import './alps-icon-btn';
import { Logger } from '../utils/logger';

@customElement('alps-header')
export class AlpsHeader extends LitElement {
  @property({ type: String }) username = '';
  @property({ type: String }) currentTab = '';
  @property({ type: Boolean, reflect: true }) isMobile = false;
  @property({ type: Boolean, reflect: true }) scrolled = false;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @consume({ context: composeContext })
  composeStore!: ComposeStore;

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      this.i18nStore?.addEventListener('change', this._handleStoreChange);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleStoreChange);
  }

  private _handleStoreChange = () => {
    this.requestUpdate();
  };

  static styles = css`
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 57px;
      box-sizing: border-box;
      background: var(--bg-primary, #ffffff);
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      flex-shrink: 0;
      z-index: 20000;
      transition: box-shadow 0.2s ease;
    }

    :host([scrolled][ismobile]) {
      box-shadow: rgba(95, 95, 95, 0.1) 0 4px 4px -2px;
    }

    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      padding: 0 16px;
    }

    .left-section {
      display: flex;
      align-items: center;
      height: 100%;
      gap: 12px;
      flex-shrink: 0;
    }

    .center-section {
      flex: 1;
      display: flex;
      align-items: center;
      min-width: 0;
      margin: 0 24px;
    }

    :host([ismobile]) .center-section {
      margin: 0 8px;
    }

    .right-section {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }

    ::slotted([slot="center"]) {
      width: 100%;
    }
  `;

  private handleSettings() {
    window.location.hash = '/settings';
  }

  private async handleSignOut() {
    // Every step that can fail is isolated, because none of their failures is a
    // reason to stay signed in.
    //
    // This used to be one try block with the network call in the middle of it,
    // so a `DELETE /session` that threw — offline, or the server down — skipped
    // the cache wipe, the settings wipe, the `session-cleared` event, the notice
    // and the redirect. The user clicked Sign Out, watched nothing happen, and
    // was left sitting in a mailbox that still had their mail cached. On a
    // shared machine they may well walk away believing they signed out, which
    // is the outcome this button exists to prevent.
    //
    // The same fix auto-logout got in 6cdf808; this is the path a user takes
    // deliberately, and it was missed there.
    let draftsLost = 0;
    try {
      if (this.composeStore) {
        draftsLost = (await this.composeStore.saveAllDirtyDrafts()).failed;
      }
    } catch (err) {
      Logger.error('Could not save drafts before signing out', err);
    }

    // Ahead of the request: the login page is mounted by the redirect below and
    // reads its notice exactly once, so a notice set after a slow DELETE loses
    // the race.
    //
    // A draft that could not be saved is gone — the session ending takes the
    // local copy with it — so say so rather than let the user discover an empty
    // Drafts folder later.
    setLoginNotice(draftsLost > 0 ? 'signedOutDraftsLost' : 'signedOut');

    try {
      await fetch('/session', { method: 'DELETE' });
    } catch (err) {
      Logger.error('Sign-out request failed; ending the session locally anyway', err);
    }

    MessageCache.clear();
    clearSessionSettings();
    // compose-store listens for this and clears the drafts, aborting any upload
    // still in flight.
    window.dispatchEvent(new CustomEvent('session-cleared'));
    window.location.hash = '#/login'; // Return to login page
  }

  render() {
    return html`
      <div class="header-container">
        <div class="left-section">
          ${this.isMobile ? html`
            <alps-icon-btn 
              title=${this.i18nStore?.t('messageList.menu')} 
              @click=${() => this.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              icon="sidebar"
              style="--icon-size: 20px;"
            ></alps-icon-btn>
          ` : ''}
          <slot name="left"></slot>
        </div>

        <div class="center-section">
          <slot name="center"></slot>
        </div>

        <div class="right-section">
          <slot name="right-actions"></slot>
          ${this.username ? html`
            <user-profile-menu 
              .username=${this.username}
              .isMobile=${this.isMobile}
              .currentTab=${this.currentTab}
              @open-settings=${this.handleSettings}
              @sign-out=${this.handleSignOut}
            ></user-profile-menu>
          ` : ''}
        </div>
      </div>
    `;
  }
}
