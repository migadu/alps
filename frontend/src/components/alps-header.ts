import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MessageCache } from '../utils/message-cache';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { composeContext, ComposeStore } from '../store/compose-store';
import { clearSessionSettings } from '../store/settings-store';
import { setLoginNotice } from '../utils/login-notice';
import { DraftFlushError } from '../utils/draft-flush-error';
import './user-profile-menu';
import './alps-icon-btn';
import './ui-confirm';
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

  /**
   * A sign-out held back by drafts the server does not have, waiting for the
   * user to choose. Staying keeps the windows open; signing out anyway keeps
   * the drafts on this device for this account's next sign-in.
   */
  @state() private unsavedDraftsFailure: DraftFlushError | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      if (!this.isConnected) return;
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
    try {
      await this.composeStore?.saveAllDirtyDrafts();
    } catch (err) {
      // A draft the server does not have is the user's to decide about. It
      // used to be lost with the session, and the login screen said so
      // afterwards, when nothing could be done about it any more.
      this.unsavedDraftsFailure = err instanceof DraftFlushError ? err : new DraftFlushError();
      return;
    }
    await this.endSession('signedOut');
  }

  /** The user chose to leave with drafts the server does not have. */
  private confirmSignOutWithUnsavedDrafts = async () => {
    const failure = this.unsavedDraftsFailure;
    this.unsavedDraftsFailure = null;
    if (!failure) return;
    // Before the session ends: ending it is what erases the stored drafts.
    failure.keepRecoveryCopy();
    await this.endSession('signedOutDraftsKept');
  };

  private cancelSignOutWithUnsavedDrafts = () => {
    this.unsavedDraftsFailure = null;
  };

  private async endSession(notice: 'signedOut' | 'signedOutDraftsKept') {
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
    //
    // The notice goes ahead of the request: the login page is mounted by the
    // redirect below and reads its notice exactly once, so a notice set after
    // a slow DELETE loses the race.
    setLoginNotice(notice);

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
      ${this.unsavedDraftsFailure ? html`
        <ui-confirm
          title=${this.i18nStore?.t('userMenu.unsavedDraftsTitle')}
          message=${this.i18nStore?.t('userMenu.unsavedDraftsMessage')}
          confirmText=${this.i18nStore?.t('userMenu.signOutAnyway')}
          cancelText=${this.i18nStore?.t('general.cancel')}
          .isDanger=${true}
          @confirm=${this.confirmSignOutWithUnsavedDrafts}
          @cancel=${this.cancelSignOutWithUnsavedDrafts}
        ></ui-confirm>
      ` : ''}
      <div class="header-container">
        <div class="left-section">
          ${this.isMobile ? html`
            <alps-icon-btn 
              title=${this.i18nStore?.t('messageList.menu')} 
              @click=${() => this.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              icon="sidebar"
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
