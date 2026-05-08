import { LitElement, html, css, render } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { linkedAccountsContext, LinkedAccountsStore } from '../store/linked-accounts-store';
import './alps-avatar';
import { popupStyles } from './alps-popup';
import './alps-popup';
import './alps-icon-btn';
import { renderIcon } from '../utils/ui';

@customElement('user-profile-menu')
export class UserProfileMenu extends LitElement {
  @property({ type: String }) username = '';
  @property({ type: Boolean }) isMobile = false;
  @property({ type: String }) currentTab = 'messages';

  static styles = [
    popupStyles,
    css`
    :host {
      display: block;
      position: relative;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary, #111827);
      user-select: none;
    }

    .user-text-container {
      display: flex;
      flex-direction: column;
      max-width: 180px;
    }

    .user-name-text {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }

    .user-address-text {
      font-size: 12px;
      font-weight: 400;
      color: var(--text-secondary, #6b7280);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
      margin-top: 2px;
    }

    .item-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 768px) {
      .user-text-container {
        display: none;
      }
      
      .user-info {
        gap: 0;
      }
    }
  `];



  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @consume({ context: linkedAccountsContext })
  linkedAccountsStore!: LinkedAccountsStore;

  private _handleStoreChange = () => {
    this.requestUpdate();
  };

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      this.i18nStore?.addEventListener('change', this._handleStoreChange);
      this.settingsStore?.addEventListener('change', this._handleStoreChange);
      this.linkedAccountsStore?.addEventListener('change', this._handleStoreChange);
      if (this.linkedAccountsStore && !this.linkedAccountsStore.isInitialized()) {
        this.linkedAccountsStore.fetchAccounts();
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleStoreChange);
    this.settingsStore?.removeEventListener('change', this._handleStoreChange);
    this.linkedAccountsStore?.removeEventListener('change', this._handleStoreChange);
  }

  private _closePopup() {
    const popup = this.shadowRoot?.querySelector('alps-popup') as any;
    if (popup) popup.close();
  }

  private _handleSettings() {
    this._closePopup();
    this.dispatchEvent(new CustomEvent('open-settings', { bubbles: true, composed: true }));
  }

  private _handleSignOut() {
    this._closePopup();
    this.dispatchEvent(new CustomEvent('sign-out', { bubbles: true, composed: true }));
  }

  private _handleTabChange(tab: string) {
    this._closePopup();
    if (tab === 'messages') {
      window.location.hash = '#/';
    }
    this.dispatchEvent(new CustomEvent('change-tab', { detail: { tab }, bubbles: true, composed: true }));
  }

  private async _handleSwitchAccount(username: string) {
    this._closePopup();
    
    // Create fade-in overlay
    const overlayContainer = document.createElement('div');
    document.body.appendChild(overlayContainer);
    
    render(html`
      <style>
        @keyframes global-spin { to { transform: rotate(360deg); } }
        .switch-overlay svg { width: 100%; height: 100%; fill: currentColor; }
      </style>
      <div id="switch-account-overlay" class="switch-overlay" style="position: fixed; inset: 0; background-color: var(--bg-primary, #ffffff); z-index: 999999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease-in;">
        <div style="display: inline-flex; width: 32px; height: 32px; animation: global-spin 1s linear infinite; color: var(--accent-color, #2563eb);">
          ${renderIcon('edelweiss')}
        </div>
      </div>
    `, overlayContainer);

    const overlayDiv = overlayContainer.querySelector('#switch-account-overlay') as HTMLElement;
    
    // Trigger transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (overlayDiv) overlayDiv.style.opacity = '1';
      });
    });

    // Wait for fade in to complete
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const response = await this.linkedAccountsStore.switchAccount(username);
      if (response.requires_2fa) {
         window.location.hash = '#/login/webauthn';
         // Remove overlay so webauthn page is visible
         if (overlayDiv) overlayDiv.style.opacity = '0';
         setTimeout(() => overlayContainer.remove(), 300);
      } else {
         localStorage.removeItem('alps_settings');
         sessionStorage.clear();
         window.location.reload();
      }
    } catch (e: any) {
      if (overlayDiv) overlayDiv.style.opacity = '0';
      setTimeout(() => overlayContainer.remove(), 300);
      
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: e.message || this.i18nStore?.t('linkedAccounts.switchError'),
          duration: 5000
        }
      }));
    }
  }

  render() {
    const displayName = this.settingsStore?.getState().name || this.username;
    
    return html`
      <div class="user-profile">
        <div class="user-info">
          <alps-avatar .name=${displayName} .size=${28}></alps-avatar>
          <div class="user-text-container">
            <span class="user-name-text">${displayName}</span>
            <span class="user-address-text">${this.username}</span>
          </div>
        </div>
        <alps-popup align="right">
          <alps-icon-btn
            slot="trigger"
            .icon=${'dotsThreeVertical'}
            title=${this.i18nStore?.t('userMenu.profileOptions')}
          ></alps-icon-btn>
          
          ${(() => {
            const accounts = this.linkedAccountsStore?.getAccounts() || [];
            if (accounts.length === 0) return '';
            return html`
              ${accounts.map(account => html`
                <button class="dropdown-item" @click="${() => this._handleSwitchAccount(account.username)}">
                  <alps-avatar .name=${account.display_name || account.username} .size=${16} style="margin-right: 4px;"></alps-avatar>
                  <span class="item-text" style="font-weight: 500;" title="${account.username}">${account.display_name || account.username}</span>
                </button>
              `)}
              <div class="dropdown-divider"></div>
            `;
          })()}
          
          <button class="dropdown-item ${this.currentTab === 'messages' ? 'active' : ''}" @click="${() => this._handleTabChange('messages')}">
            ${renderIcon('envelopeSimple')} <span class="item-text">${this.i18nStore?.t('navigation.messages')}</span>
          </button>
          <button class="dropdown-item ${this.currentTab === 'contacts' ? 'active' : ''}" @click="${() => this._handleTabChange('contacts')}">
            ${renderIcon('users')} <span class="item-text">${this.i18nStore?.t('navigation.contacts')}</span>
          </button>
          <button class="dropdown-item ${this.currentTab === 'calendar' ? 'active' : ''}" @click="${() => this._handleTabChange('calendar')}">
            ${renderIcon('calendarBlank')} <span class="item-text">${this.i18nStore?.t('navigation.calendar')}</span>
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item ${this.currentTab === 'settings' ? 'active' : ''}" @click="${this._handleSettings}">
            ${renderIcon('gear')} <span class="item-text">${this.i18nStore?.t('userMenu.settings')}</span>
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click="${this._handleSignOut}">
            ${renderIcon('signOut')} <span class="item-text">${this.i18nStore?.t('userMenu.signOut')}</span>
          </button>
        </alps-popup>
      </div>
    `;
  }
}
