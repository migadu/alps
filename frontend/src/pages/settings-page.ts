import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { settingsContext, SettingsStore } from '../store/settings-store';
import type { SettingsState } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon } from '../utils/ui';
import '../components/alps-header';
import '../components/alps-sidebar';
import '../components/alps-category-item';

import { registry } from '../plugin-registry';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

type SettingsCategory = 'general' | 'identity' | 'reading' | 'appearance' | 'localization' | string;

@customElement('settings-page')
export class SettingsPage extends LitElement {
  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @state() private currentCategory: SettingsCategory = 'general';
  @state() private settingsState!: SettingsState;
  @state() private isMobile = window.innerWidth <= 768;
  @state() private mobileSidebarOpen = false;
  @state() private username = '';
  @state() private isScrolled = false;
  @state() private enabledPlugins: string[] = [];

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      overflow: hidden;
      font-size: 14px;
    }

    .settings-title {
      font-weight: 500;
      font-size: 16px;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
    }

    .app-container {
      display: flex;
      flex: 1;
      min-height: 0;
      width: 100%;
      position: relative;
    }

    alps-sidebar.desktop-sidebar {
      width: 250px;
      flex-shrink: 0;
      border-right: 1px solid var(--border-color);
    }

    alps-sidebar::part(sidebar) {
      padding-top: 8px;
    }

    .main-view {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: var(--bg-primary);
    }

    select {
      width: 100%;
      box-sizing: border-box;
      padding: var(--input-padding, 8px 12px);
      border: 1px solid var(--border-color);
      border-radius: var(--input-radius, 6px);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-size: var(--input-font-size, 14px);
      outline: none;
    }

    select:focus, input:focus, textarea:focus {
      border-color: var(--accent-color, #2563eb);
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }

    input[type="text"], input[type="password"], input[type="number"], textarea {
      width: 100%;
      box-sizing: border-box;
      padding: var(--input-padding, 8px 12px);
      border: 1px solid var(--border-color);
      border-radius: var(--input-radius, 6px);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-size: var(--input-font-size, 14px);
      outline: none;
      font-family: var(--font-base);
    }

    textarea {
      min-height: 80px;
      resize: vertical;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--text-primary);
      font-weight: 500;
    }

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    svg.icon {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .header-icon-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      padding: 4px;
    }
    
    .header-icon-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .back-btn {
      gap: 6px;
      font-weight: 500;
      color: var(--text-primary);
      transition: color 0.2s;
    }
  `;

  private _handleResize = () => {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.mobileSidebarOpen = false;
    }
  };

  private _handleScroll = (e: Event) => {
    const target = e.target as HTMLElement;
    this.isScrolled = target.scrollTop > 0;
  };

  async connectedCallback() {
    super.connectedCallback();
    this.settingsStore.addEventListener('change', this._handleSettingsChange);
    this.i18nStore?.addEventListener('change', this._handleI18nChange);
    window.addEventListener('resize', this._handleResize);
    this._syncState();

    try {
      const response = await fetch('/session');
      if (response.ok) {
        const data = await response.json();
        if (data.Username) this.username = data.Username;
        if (data.EnabledPlugins) this.enabledPlugins = data.EnabledPlugins;
      }
    } catch (e) {
      console.error('Failed to fetch username in settings', e);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.settingsStore.removeEventListener('change', this._handleSettingsChange);
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);
    window.removeEventListener('resize', this._handleResize);
  }

  private _handleSettingsChange = () => {
    this._syncState();
  };

  private _handleI18nChange = () => {
    this.requestUpdate();
  };

  private _syncState() {
    this.settingsState = { ...this.settingsStore.getState() };
  }

  private getCategoryLabel(category: string) {
    switch (category) {
      case 'general': return this.i18nStore?.t('settings.categories.general');
      case 'identity': return this.i18nStore?.t('settings.categories.identity');
      case 'reading': return this.i18nStore?.t('settings.categories.reading');
      case 'appearance': return this.i18nStore?.t('settings.categories.appearance');
      case 'localization': return this.i18nStore?.t('settings.categories.localization');
      default: 
        const pluginTab = registry.getSettingsTabs().find(t => t.id === category);
        if (pluginTab) {
          return this.i18nStore?.t(pluginTab.labelKey) || pluginTab.labelKey;
        }
        return category;
    }
  }

  private selectCategory(category: SettingsCategory) {
    this.currentCategory = category;
    if (this.isMobile) {
      this.mobileSidebarOpen = false;
    }
  }

  private async handleUpdate(e: Event, key: keyof SettingsState) {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    let val: any = target.value;

    if (target.type === 'checkbox') {
      val = (target as HTMLInputElement).checked;
      
      if (key === 'desktopNotifications' && val === true) {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            val = false; // Revert if permission denied
            (target as HTMLInputElement).checked = false;
          }
        } else if ('Notification' in window && Notification.permission === 'denied') {
          val = false;
          (target as HTMLInputElement).checked = false;
          // Optionally show a toast that permission is blocked
        }
      }
    } else if (target.type === 'number' || ['checkMailInterval', 'autoLogout', 'messagesPerPage', 'markReadTimeout', 'undoTimeout'].includes(key)) {
      val = parseInt(target.value, 10);
      if (isNaN(val)) val = 0;
    }

    this.settingsStore.updateSettings({ [key]: val } as any);
  }

  render() {
    return html`
      <alps-header 
        .username=${this.username}
        .isMobile=${this.isMobile}
        .scrolled=${this.isScrolled}
        currentTab="settings"
        @toggle-sidebar=${() => this.mobileSidebarOpen = !this.mobileSidebarOpen}
      >
        <div slot="left" class="header-left">
          ${!this.isMobile ? html`
            <button class="header-icon-btn back-btn" @click=${() => window.location.hash = ''} title=${this.i18nStore?.t('messageReader.back')}>
              ${renderIcon('arrowLeft')} ${this.i18nStore?.t('messageReader.back')}
            </button>
          ` : ''}
        </div>
        <div slot="center" class="settings-title">${this.i18nStore?.t('settings.title')} / ${this.getCategoryLabel(this.currentCategory)}</div>
      </alps-header>
      <div class="app-container">
        <alps-sidebar
          class="${this.isMobile ? 'mobile-sidebar' : 'desktop-sidebar'} ${this.mobileSidebarOpen ? 'open' : ''}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
          @close-sidebar=${() => this.mobileSidebarOpen = false}
        >
          <alps-category-item 
            ?active=${this.currentCategory === 'general'}
            @click=${() => this.selectCategory('general')}
            icon="gear"
          >
            ${this.i18nStore?.t('settings.categories.general')}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.currentCategory === 'identity'}
            @click=${() => this.selectCategory('identity')}
            icon="user"
          >
            ${this.i18nStore?.t('settings.categories.identity')}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.currentCategory === 'reading'}
            @click=${() => this.selectCategory('reading')}
            icon="bookOpen"
          >
            ${this.i18nStore?.t('settings.categories.reading')}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.currentCategory === 'appearance'}
            @click=${() => this.selectCategory('appearance')}
            icon="palette"
          >
            ${this.i18nStore?.t('settings.categories.appearance')}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.currentCategory === 'localization'}
            @click=${() => this.selectCategory('localization')}
            icon="globe"
          >
            ${this.i18nStore?.t('settings.categories.localization')}
          </alps-category-item>
          ${registry.getSettingsTabs()
            .filter(tab => this.enabledPlugins.includes(tab.id))
            .map(tab => html`
            <alps-category-item 
              ?active=${this.currentCategory === tab.id}
              @click=${() => this.selectCategory(tab.id)}
              .icon=${tab.icon}
            >
              ${this.i18nStore?.t(tab.labelKey)}
            </alps-category-item>
          `)}
        </alps-sidebar>
        
        <div class="main-view" @scroll=${this._handleScroll}>
          ${!this.settingsState ? html`<div>${this.i18nStore?.t('settings.loading')}</div>` : html`
            ${this.currentCategory === 'general' ? this.renderGeneral() : ''}
            ${this.currentCategory === 'identity' ? this.renderIdentity() : ''}
            ${this.currentCategory === 'reading' ? this.renderReading() : ''}
            ${this.currentCategory === 'appearance' ? this.renderAppearance() : ''}
            ${this.currentCategory === 'localization' ? this.renderLocalization() : ''}
            ${registry.getSettingsTabs()
                .filter(tab => tab.id === this.currentCategory && this.enabledPlugins.includes(tab.id))
                .map(tab => html`${unsafeHTML(`<${tab.component}></${tab.component}>`)}`)
            }
          `}
        </div>
      </div>
    `;
  }

  renderGeneral() {
    return html`
        <alps-setting-group label="${this.i18nStore?.t('settings.general.checkMailInterval')}" description="${this.i18nStore?.t('settings.general.checkMailIntervalDesc')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'checkMailInterval')} .value=${this.settingsState.checkMailInterval.toString()}>
            <option value="1">${this.i18nStore?.t('settings.general.everyMinute')}</option>
            <option value="5">${this.i18nStore?.t('settings.general.every5Minutes')}</option>
            <option value="15">${this.i18nStore?.t('settings.general.every15Minutes')}</option>
            <option value="30">${this.i18nStore?.t('settings.general.every30Minutes')}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.general.autoLogout')}" description="${this.i18nStore?.t('settings.general.autoLogoutDesc')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'autoLogout')} .value=${this.settingsState.autoLogout.toString()}>
            <option value="0">${this.i18nStore?.t('settings.general.never')}</option>
            <option value="15">${this.i18nStore?.t('settings.general.minutes15')}</option>
            <option value="30">${this.i18nStore?.t('settings.general.minutes30')}</option>
            <option value="60">${this.i18nStore?.t('settings.general.hour1')}</option>
            <option value="120">${this.i18nStore?.t('settings.general.hours2')}</option>
            <option value="360">${this.i18nStore?.t('settings.general.hours6')}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.desktopNotifications} 
                   @change=${(e: Event) => this.handleUpdate(e, 'desktopNotifications')}>
            ${this.i18nStore?.t('settings.general.desktopNotifications')}
          </label>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.soundNotifications} 
                   @change=${(e: Event) => this.handleUpdate(e, 'soundNotifications')}>
            ${this.i18nStore?.t('settings.general.soundNotifications')}
          </label>
        </alps-setting-group>
    `;
  }

  renderIdentity() {
    return html`
        <alps-setting-group label="${this.i18nStore?.t('settings.identity.displayName')}" description="${this.i18nStore?.t('settings.identity.displayNameDesc')}">
          <input type="text" .value=${this.settingsState.name || ''} @change=${(e: Event) => this.handleUpdate(e, 'name')} placeholder="${this.i18nStore?.t('settings.placeholderName')}">
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.identity.signature')}" description="${this.i18nStore?.t('settings.identity.signatureDesc')}">
          <textarea @change=${(e: Event) => this.handleUpdate(e, 'signature')} .value=${this.settingsState.signature || ''}></textarea>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.identity.replyTo')}" description="${this.i18nStore?.t('settings.identity.replyToDesc')}">
          <input type="text" .value=${this.settingsState.replyTo || ''} @change=${(e: Event) => this.handleUpdate(e, 'replyTo')} placeholder="${this.i18nStore?.t('settings.placeholderReplyTo')}">
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.bccMyself} 
                   @change=${(e: Event) => this.handleUpdate(e, 'bccMyself')}>
            ${this.i18nStore?.t('settings.identity.bccMyself')}
          </label>
        </alps-setting-group>
    `;
  }

  renderReading() {
    return html`
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.messagesPerPage')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'messagesPerPage')} .value=${this.settingsState.messagesPerPage.toString()}>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.preferredView')}" description="${this.i18nStore?.t('settings.reading.preferredViewDesc')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'preferredView')} .value=${this.settingsState.preferredView}>
            <option value="html">${this.i18nStore?.t('settings.reading.html')}</option>
            <option value="text">${this.i18nStore?.t('settings.reading.plainText')}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.showRemoteContent')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'showRemoteContent')} .value=${this.settingsState.showRemoteContent}>
            <option value="ask">${this.i18nStore?.t('settings.reading.alwaysAsk')}</option>
            <option value="always">${this.i18nStore?.t('settings.reading.alwaysLoad')}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.markReadTimeout')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'markReadTimeout')} .value=${this.settingsState.markReadTimeout.toString()}>
            <option value="0">${this.i18nStore?.t('settings.reading.markReadImmediately')}</option>
            <option value="1">${this.i18nStore?.t('settings.reading.markRead1s')}</option>
            <option value="3">${this.i18nStore?.t('settings.reading.markRead3s')}</option>
            <option value="5">${this.i18nStore?.t('settings.reading.markRead5s')}</option>
            <option value="10">${this.i18nStore?.t('settings.reading.markRead10s')}</option>
            <option value="-1">${this.i18nStore?.t('settings.reading.markReadNever')}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.composeFormat')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'composeFormat')} .value=${this.settingsState.composeFormat}>
            <option value="html">${this.i18nStore?.t('settings.reading.richText')}</option>
            <option value="text">${this.i18nStore?.t('settings.reading.plainText')}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.messageSortCriteria')}" description="${this.i18nStore?.t('settings.reading.messageSortCriteriaDesc')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'messageSortCriteria')} .value=${this.settingsState.messageSortCriteria}>
            <option value="date">${this.i18nStore?.t('settings.reading.sortDate')}</option>
            <option value="uid">${this.i18nStore?.t('settings.reading.sortUid')}</option>
          </select>
        </alps-setting-group>
    `;
  }

  renderAppearance() {
    return html`
        
        <alps-setting-group label="${this.i18nStore?.t('settings.appearance.colorTheme')}" description="${this.i18nStore?.t('settings.appearance.colorThemeDesc')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'colorFamily')} .value=${this.settingsState.colorFamily}>
            <option value="default">Default Alps</option>
            <option value="nord">Nord</option>
            <option value="ocean">Ocean</option>
          </select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t('settings.appearance.themeMode')}" description="${this.i18nStore?.t('settings.appearance.themeModeDesc')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'themeMode')} .value=${this.settingsState.themeMode}>
            <option value="light">${this.i18nStore?.t('settings.appearance.light')}</option>
            <option value="dark">${this.i18nStore?.t('settings.appearance.dark')}</option>
            <option value="auto">${this.i18nStore?.t('settings.appearance.systemAuto')}</option>
          </select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t('settings.appearance.layoutMode')}" description="${this.i18nStore?.t('settings.appearance.layoutModeDesc')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'layoutMode')} .value=${this.settingsState.layoutMode}>
            <option value="vertical">${this.i18nStore?.t('settings.appearance.vertical')}</option>
            <option value="horizontal">${this.i18nStore?.t('settings.appearance.horizontal')}</option>
            <option value="full">${this.i18nStore?.t('settings.appearance.fullScreen')}</option>
          </select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t('settings.appearance.listDensity')}" description="${this.i18nStore?.t('settings.appearance.listDensityDesc')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'densityMode')} .value=${this.settingsState.densityMode}>
            <option value="loose">${this.i18nStore?.t('settings.appearance.loose')}</option>
            <option value="normal">${this.i18nStore?.t('settings.appearance.normal')}</option>
            <option value="compact">${this.i18nStore?.t('settings.appearance.compact')}</option>
            <option value="ultra-compact">${this.i18nStore?.t('settings.appearance.ultraCompact')}</option>
          </select>
        </alps-setting-group>
    `;
  }

  renderLocalization() {
    return html`
        <alps-setting-group label="${this.i18nStore?.t('settings.localization.language')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'language')} .value=${this.settingsState.language}>
            <option value="en">${this.i18nStore?.t('settings.localization.english')}</option>
            <option value="de">${this.i18nStore?.t('settings.localization.german')}</option>
            <option value="it">${this.i18nStore?.t('settings.localization.italian')}</option>
            <option value="es">${this.i18nStore?.t('settings.localization.spanish')}</option>
            <option value="rs">${this.i18nStore?.t('settings.localization.serbian')}</option>
            <option value="sr">${this.i18nStore?.t('settings.localization.serbianLatin')}</option>
            <option value="fr">${this.i18nStore?.t('settings.localization.french')}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.localization.timeFormat')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'hourFormat')} .value=${this.settingsState.hourFormat}>
            <option value="12">${this.i18nStore?.t('settings.localization.format12h')}</option>
            <option value="24">${this.i18nStore?.t('settings.localization.format24h')}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.localization.dateFormat')}">
          <select @change=${(e: Event) => this.handleUpdate(e, 'dateFormat')} .value=${this.settingsState.dateFormat}>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD.MM.YYYY">DD.MM.YYYY</option>
          </select>
        </alps-setting-group>
    `;
  }
}
