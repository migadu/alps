import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon, getMailboxLabel } from '../utils/ui';
import './alps-header';
import './alps-input';
import './alps-icon-btn';

@customElement('app-header')
export class AppHeader extends LitElement {
  @property({ type: String }) username = '';
  @property({ type: String }) currentTab = 'messages';
  @property({ type: Boolean }) isMobile = false;
  @property({ type: String }) currentMailbox = '';
  @property({ type: String }) searchQuery = '';
  @property({ type: Boolean }) scrolled = false;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

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
      width: 100%;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
    }

    .logo svg {
      width: 28px;
      height: 28px;
    }

    .nav-tabs {
      display: flex;
      height: 100%;
      gap: 8px;
    }

    .nav-tab {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 12px;
      color: var(--text-secondary, #4b5563);
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .nav-tab:hover {
      color: var(--text-primary, #111827);
    }

    .nav-tab.active {
      color: var(--accent-color, #2563eb);
      border-bottom-color: var(--accent-color, #2563eb);
    }

    .header-left-slot {
      display: flex;
      align-items: center;
      height: 100%;
      gap: 12px;
    }

    alps-input {
      flex: 1;
      --alps-input-bg: var(--bg-secondary, #f9fafb);
    }
  `;
  private handleTabClick(tab: string) {
    this.currentTab = tab;
    this.dispatchEvent(new CustomEvent('change-tab', { detail: { tab } }));
  }

  render() {
    return html`
      <alps-header 
        .username=${this.username} 
        .isMobile=${this.isMobile} 
        .currentTab=${this.currentTab}
        .scrolled=${this.scrolled}
        @toggle-sidebar=${() => this.dispatchEvent(new CustomEvent('toggle-sidebar'))}
      >
        <div slot="left" class="header-left-slot">
          ${!this.isMobile ? html`
            <div class="logo" title="Alps">
              ${renderIcon('edelweiss')}
            </div>
            <div class="nav-tabs">
              <div 
                class="nav-tab ${this.currentTab === 'messages' ? 'active' : ''}"
                @click=${() => this.handleTabClick('messages')}
                title=${this.i18nStore?.t('navigation.messages')}
              >
                ${this.i18nStore?.t('navigation.messages')}
              </div>
              <div 
                class="nav-tab ${this.currentTab === 'contacts' ? 'active' : ''}"
                @click=${() => this.handleTabClick('contacts')}
                title=${this.i18nStore?.t('navigation.contacts')}
              >
                ${this.i18nStore?.t('navigation.contacts')}
              </div>
              <div 
                class="nav-tab ${this.currentTab === 'calendar' ? 'active' : ''}"
                @click=${() => this.handleTabClick('calendar')}
                title=${this.i18nStore?.t('navigation.calendar')}
              >
                ${this.i18nStore?.t('navigation.calendar')}
              </div>
            </div>
          ` : ''}
        </div>

        <alps-input 
          slot="center"
          icon="magnifyingGlass"
          ?clearable=${true}
          .value=${this.searchQuery}
          .placeholder=${this.currentMailbox ? getMailboxLabel(this.currentMailbox, this.i18nStore) : (this.i18nStore?.t('search.placeholder'))}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              this.dispatchEvent(new CustomEvent('search-submit', {
                detail: { value: (e.target as HTMLInputElement).value },
                bubbles: true,
                composed: true
              }));
            }
          }}
          @clear=${() => {
            this.dispatchEvent(new CustomEvent('search-submit', {
              detail: { value: '' },
              bubbles: true,
              composed: true
            }));
          }}
        ></alps-input>

        <div slot="right-actions">
          ${this.isMobile ? html`
            <alps-icon-btn 
              title=${this.i18nStore?.t('messageList.compose')} 
              @click=${() => this.dispatchEvent(new CustomEvent('compose', { bubbles: true, composed: true }))}
              icon="pen"
              style="--icon-size: 20px;"
            ></alps-icon-btn>
          ` : ''}
        </div>
      </alps-header>
    `;
  }
}
