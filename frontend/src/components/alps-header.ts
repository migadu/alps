import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MessageCache } from '../utils/message-cache';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { composeContext, ComposeStore } from '../store/compose-store';
import './user-profile-menu';
import './alps-icon-btn';

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
      if (this.composeStore) {
        await this.composeStore.saveAllDirtyDrafts();
      }
      await fetch('/session', { method: 'DELETE' });
      MessageCache.clear();
      localStorage.removeItem('alps_settings');
      window.dispatchEvent(new CustomEvent('session-cleared'));
      window.location.hash = '#/login'; // Return to login page
    } catch (err) {
      console.error('Failed to sign out', err);
    }
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
