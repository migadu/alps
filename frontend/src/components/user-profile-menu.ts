import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { settingsContext, SettingsStore } from '../store/settings-store';
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
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary, #111827);
      user-select: none;
    }

    .item-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 768px) {
      .user-name-text {
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

  private _handleStoreChange = () => {
    this.requestUpdate();
  };

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      this.i18nStore?.addEventListener('change', this._handleStoreChange);
      this.settingsStore?.addEventListener('change', this._handleStoreChange);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleStoreChange);
    this.settingsStore?.removeEventListener('change', this._handleStoreChange);
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

  render() {
    const displayName = this.settingsStore?.getState().name || this.username;
    
    return html`
      <div class="user-profile">
        <div class="user-info">
          <alps-avatar .name=${displayName} .size=${20}></alps-avatar>
          <span class="user-name-text">${displayName}</span>
        </div>
        <alps-popup align="right">
          <alps-icon-btn
            slot="trigger"
            .icon=${'dotsThreeVertical'}
            title=${this.i18nStore?.t('userMenu.profileOptions')}
          ></alps-icon-btn>
          
          <div class="dropdown-header">
          ${this.username}
        </div>
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
