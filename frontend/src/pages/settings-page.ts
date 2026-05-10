import { html, css, LitElement } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { settingsContext, SettingsStore } from '../store/settings-store';
import type { SettingsState } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon } from '../utils/ui';
import '../components/alps-header';
import '../components/alps-sidebar';
import '../components/alps-category-item';
import '../components/settings-accounts';
import '../components/alps-webauthn-settings';

import { registry } from '../plugin-registry';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Logger } from '../utils/logger';

@customElement('settings-page')
export class SettingsPage extends LitElement {
  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @property({ type: String }) category = 'general';
  @state() private settingsState!: SettingsState;
  @state() private isMobile = window.innerWidth <= 768;
  @state() private mobileSidebarOpen = false;
  @state() private username = '';
  @state() private isScrolled = false;
  @state() private enabledPlugins: string[] = [];
  @state() private sidebarWidth = 250;
  @state() private sidebarCollapsed = false;
  @state() private isSidebarDragging = false;
  @state() private isSidebarHovered = false;
  private hoverTimeout: any = null;
  @state() private suppressSidebarHover = false;

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

    .app-container.dragging {
      user-select: none;
      pointer-events: none;
    }

    alps-sidebar.desktop-sidebar {
      width: var(--sidebar-width, 250px);
      flex-shrink: 0;
      transition: width 0.2s, z-index 0s 0.2s;
      position: relative;
      z-index: 20;
    }

    alps-sidebar.desktop-sidebar[collapsed]:hover {
      transition: width 0.2s, z-index 0s 0s;
    }

    .app-container.dragging alps-sidebar.desktop-sidebar {
      transition: none;
    }

    .app-container.collapsed {
      --sidebar-width: 64px;
    }

    .app-container.collapsed .main-view {
      box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
      z-index: 25;
      border-left: 1px solid var(--border-color);
      position: relative;
    }

    .sidebar-wrapper {
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-color: transparent;
    }

    .sidebar-wrapper.collapsed .sidebar-content {
      opacity: 0.5;
      overflow-y: hidden;
    }

    .sidebar-scroll-content {
      width: calc(max(100%, 215px));
      margin-left: calc(min(0px, (100% - 215px) * 50 / 167));
    }

    .sidebar-wrapper.collapsed alps-category-item {
      border-radius: 6px 0 0 6px;
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 0;
    }

    alps-sidebar::part(sidebar) {
      padding-top: 0;
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
      Logger.error('Failed to fetch username in settings', e);
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
    this.sidebarCollapsed = this.settingsState.sidebarCollapsed || false;
  }

  private getCategoryLabel(category: string) {
    switch (category) {
      case 'general': return this.i18nStore?.t('settings.categories.general');
      case 'identity': return this.i18nStore?.t('settings.categories.identity');
      case 'webauthn': return this.i18nStore?.t('settings.categories.webauthn');
      case 'accounts': return this.i18nStore?.t('settings.categories.accounts');
      case 'reading': return this.i18nStore?.t('settings.categories.reading');
      case 'appearance': return this.i18nStore?.t('settings.categories.appearance');
      case 'localization': return this.i18nStore?.t('settings.categories.localization');
      default: 
        const pluginTab = registry.getSettingsTabs().find(t => t.id === category);
        if (pluginTab) {
          return this.i18nStore?.t(pluginTab.labelKey);
        }
        return category;
    }
  }

  private selectCategory(category: string) {
    window.location.hash = `/settings/${category}`;
    if (this.isMobile) {
      this.mobileSidebarOpen = false;
    }
    if (this.sidebarCollapsed && !this.isMobile) {
      this.suppressSidebarHover = true;
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
        <div slot="center" class="settings-title">${this.i18nStore?.t('settings.title')} / ${this.getCategoryLabel(this.category)}</div>
      </alps-header>
      <div class="app-container ${this.sidebarCollapsed && !this.isMobile ? 'collapsed' : ''} ${this.isSidebarDragging ? 'dragging' : ''}" style="${!this.sidebarCollapsed && !this.isMobile ? `--sidebar-width: ${this.sidebarWidth}px;` : ''}">
        <alps-sidebar
          class="${this.isMobile ? 'mobile-sidebar' : 'desktop-sidebar'} ${this.mobileSidebarOpen ? 'open' : ''}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
          .isHovered=${this.isSidebarHovered}
          .suppressHover=${this.suppressSidebarHover}
          .width=${this.sidebarWidth}
          .hideFooterDivider=${true}
          .collapsed=${this.sidebarCollapsed && !this.isMobile}
          @sidebar-resize=${(e: CustomEvent) => {
            const newWidth = e.detail.newWidth;
            if (newWidth < 120) {
              if (!this.sidebarCollapsed) this.settingsStore.updateSettings({ sidebarCollapsed: true });
              this.sidebarWidth = 250;
            } else {
              if (this.sidebarCollapsed) this.settingsStore.updateSettings({ sidebarCollapsed: false });
              this.sidebarWidth = Math.min(Math.max(newWidth, 150), 500);
            }
          }}
          @drag-start=${() => this.isSidebarDragging = true}
          @drag-end=${() => this.isSidebarDragging = false}
          @toggle-collapse=${() => this.settingsStore.updateSettings({ sidebarCollapsed: !this.sidebarCollapsed })}
          @mouseenter=${() => {
            if (this.hoverTimeout) {
              clearTimeout(this.hoverTimeout);
              this.hoverTimeout = null;
            }
            this.isSidebarHovered = true;
            this.suppressSidebarHover = false;
          }}
          @mouseleave=${() => {
            this.hoverTimeout = setTimeout(() => {
              this.isSidebarHovered = false;
            }, 300);
          }}
          @close-sidebar=${() => this.mobileSidebarOpen = false}
        >
          <div class="sidebar-wrapper ${this.sidebarCollapsed && (!this.isSidebarHovered || this.suppressSidebarHover) && !this.isMobile ? 'collapsed' : ''}">
            <div class="sidebar-content">
              <div class="sidebar-scroll-content">
                <alps-category-item 
            ?active=${this.category === 'general'}
            @click=${() => this.selectCategory('general')}
            icon="gear"
          >
            ${this.i18nStore?.t('settings.categories.general')}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.category === 'identity'}
            @click=${() => this.selectCategory('identity')}
            icon="user"
          >
            ${this.i18nStore?.t('settings.categories.identity')}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.category === 'accounts'}
            @click=${() => this.selectCategory('accounts')}
            icon="users"
          >
            ${this.i18nStore?.t('settings.categories.accounts')}
          </alps-category-item>
          ${registry.getSettingsTabs()
            .filter(tab => this.enabledPlugins.includes(tab.id))
            .map(tab => html`
            <alps-category-item 
              ?active=${this.category === tab.id}
              @click=${() => this.selectCategory(tab.id)}
              .icon=${tab.icon}
            >
              ${this.i18nStore?.t(tab.labelKey)}
            </alps-category-item>
          `)}
          <alps-category-item 
            ?active=${this.category === 'webauthn'}
            @click=${() => this.selectCategory('webauthn')}
            icon="fingerprint"
          >
            ${this.i18nStore?.t('settings.categories.webauthn')}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.category === 'reading'}
            @click=${() => this.selectCategory('reading')}
            icon="bookOpen"
          >
            ${this.i18nStore?.t('settings.categories.reading')}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.category === 'appearance'}
            @click=${() => this.selectCategory('appearance')}
            icon="palette"
          >
            ${this.i18nStore?.t('settings.categories.appearance')}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.category === 'localization'}
            @click=${() => this.selectCategory('localization')}
            icon="globe"
          >
            ${this.i18nStore?.t('settings.categories.localization')}
          </alps-category-item>
              </div>
            </div>
          </div>
        </alps-sidebar>
        
        <div class="main-view" @scroll=${this._handleScroll}>
          ${!this.settingsState ? html`<div>${this.i18nStore?.t('settings.loading')}</div>` : html`
            ${this.category === 'general' ? this.renderGeneral() : ''}
            ${this.category === 'identity' ? this.renderIdentity() : ''}
            ${this.category === 'accounts' ? html`<settings-accounts></settings-accounts>` : ''}
            ${this.category === 'webauthn' ? html`<alps-webauthn-settings></alps-webauthn-settings>` : ''}
            ${this.category === 'reading' ? this.renderReading() : ''}
            ${this.category === 'appearance' ? this.renderAppearance() : ''}
            ${this.category === 'localization' ? this.renderLocalization() : ''}
            ${registry.getSettingsTabs()
                .filter(tab => tab.id === this.category && this.enabledPlugins.includes(tab.id))
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
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'checkMailInterval')} .value=${this.settingsState.checkMailInterval.toString()}
            .options=${[
            {value: "1", label: this.i18nStore?.t('settings.general.everyMinute') || "1"},
            {value: "5", label: this.i18nStore?.t('settings.general.every5Minutes') || "5"},
            {value: "15", label: this.i18nStore?.t('settings.general.every15Minutes') || "15"},
            {value: "30", label: this.i18nStore?.t('settings.general.every30Minutes') || "30"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.general.autoLogout')}" description="${this.i18nStore?.t('settings.general.autoLogoutDesc')}">
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'autoLogout')} .value=${this.settingsState.autoLogout.toString()}
            .options=${[
            {value: "0", label: this.i18nStore?.t('settings.general.never') || "0"},
            {value: "15", label: this.i18nStore?.t('settings.general.minutes15') || "15"},
            {value: "30", label: this.i18nStore?.t('settings.general.minutes30') || "30"},
            {value: "60", label: this.i18nStore?.t('settings.general.hour1') || "60"},
            {value: "120", label: this.i18nStore?.t('settings.general.hours2') || "120"},
            {value: "360", label: this.i18nStore?.t('settings.general.hours6') || "360"}
          ]}>
          </alps-select>
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
          <alps-input type="text" icon="user" .value=${this.settingsState.name || ''} @change=${(e: Event) => this.handleUpdate(e, 'name')} placeholder="${this.i18nStore?.t('settings.placeholderName')}"></alps-input>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.identity.signature')}" description="${this.i18nStore?.t('settings.identity.signatureDesc')}">
          <textarea @change=${(e: Event) => this.handleUpdate(e, 'signature')} .value=${this.settingsState.signature || ''}></textarea>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.identity.replyTo')}" description="${this.i18nStore?.t('settings.identity.replyToDesc')}">
          <alps-input type="email" .value=${this.settingsState.replyTo || ''} @change=${(e: Event) => this.handleUpdate(e, 'replyTo')} placeholder="${this.i18nStore?.t('settings.placeholderReplyTo')}"></alps-input>
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
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'messagesPerPage')} .value=${this.settingsState.messagesPerPage.toString()}
            .options=${[
            {value: "25", label: "25"},
            {value: "50", label: "50"},
            {value: "100", label: "100"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.preferredView')}" description="${this.i18nStore?.t('settings.reading.preferredViewDesc')}">
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'preferredView')} .value=${this.settingsState.preferredView}
            .options=${[
            {value: "html", label: this.i18nStore?.t('settings.reading.html') || "html"},
            {value: "text", label: this.i18nStore?.t('settings.reading.plainText') || "text"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.showRemoteContent')}">
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'showRemoteContent')} .value=${this.settingsState.showRemoteContent}
            .options=${[
            {value: "ask", label: this.i18nStore?.t('settings.reading.alwaysAsk') || "ask"},
            {value: "always", label: this.i18nStore?.t('settings.reading.alwaysLoad') || "always"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.markReadTimeout')}">
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'markReadTimeout')} .value=${this.settingsState.markReadTimeout.toString()}
            .options=${[
            {value: "0", label: this.i18nStore?.t('settings.reading.markReadImmediately') || "0"},
            {value: "1", label: this.i18nStore?.t('settings.reading.markRead1s') || "1"},
            {value: "3", label: this.i18nStore?.t('settings.reading.markRead3s') || "3"},
            {value: "5", label: this.i18nStore?.t('settings.reading.markRead5s') || "5"},
            {value: "10", label: this.i18nStore?.t('settings.reading.markRead10s') || "10"},
            {value: "-1", label: this.i18nStore?.t('settings.reading.markReadNever') || "-1"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.composeFormat')}">
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'composeFormat')} .value=${this.settingsState.composeFormat}
            .options=${[
            {value: "html", label: this.i18nStore?.t('settings.reading.richText') || "html"},
            {value: "text", label: this.i18nStore?.t('settings.reading.plainText') || "text"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.messageSortCriteria')}" description="${this.i18nStore?.t('settings.reading.messageSortCriteriaDesc')}">
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'messageSortCriteria')} .value=${this.settingsState.messageSortCriteria}
            .options=${[
            {value: "date", label: this.i18nStore?.t('settings.reading.sortDate') || "date"},
            {value: "uid", label: this.i18nStore?.t('settings.reading.sortUid') || "uid"}
          ]}>
          </alps-select>
        </alps-setting-group>
    `;
  }

  renderAppearance() {
    return html`
        
        <alps-setting-group label="${this.i18nStore?.t('settings.appearance.colorTheme')}" description="${this.i18nStore?.t('settings.appearance.colorThemeDesc')}">
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'colorFamily')} .value=${this.settingsState.colorFamily}
            .options=${[
            {value: "default", label: "Alps"},
            {value: "nord", label: "Nord"},
            {value: "ocean", label: "Ocean"}
          ]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t('settings.appearance.themeMode')}" description="${this.i18nStore?.t('settings.appearance.themeModeDesc')}">
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'themeMode')} .value=${this.settingsState.themeMode}
            .options=${[
            {value: "light", label: this.i18nStore?.t('settings.appearance.light') || "light"},
            {value: "dark", label: this.i18nStore?.t('settings.appearance.dark') || "dark"},
            {value: "auto", label: this.i18nStore?.t('settings.appearance.systemAuto') || "auto"}
          ]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t('settings.appearance.layoutMode')}" description="${this.i18nStore?.t('settings.appearance.layoutModeDesc')}">
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'layoutMode')} .value=${this.settingsState.layoutMode}
            .options=${[
            {value: "vertical", label: this.i18nStore?.t('settings.appearance.vertical') || "vertical"},
            {value: "horizontal", label: this.i18nStore?.t('settings.appearance.horizontal') || "horizontal"},
            {value: "full", label: this.i18nStore?.t('settings.appearance.fullScreen') || "full"}
          ]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t('settings.appearance.listDensity')}" description="${this.i18nStore?.t('settings.appearance.listDensityDesc')}">
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'densityMode')} .value=${this.settingsState.densityMode}
            .options=${[
            {value: "loose", label: this.i18nStore?.t('settings.appearance.loose') || "loose"},
            {value: "normal", label: this.i18nStore?.t('settings.appearance.normal') || "normal"},
            {value: "compact", label: this.i18nStore?.t('settings.appearance.compact') || "compact"},
            {value: "ultra-compact", label: this.i18nStore?.t('settings.appearance.ultraCompact') || "ultra-compact"}
          ]}>
          </alps-select>
        </alps-setting-group>
    `;
  }

  renderLocalization() {
    return html`
        <alps-setting-group label="${this.i18nStore?.t('settings.localization.language')}">
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'language')} .value=${this.settingsState.language}
            .options=${[
            {value: "en", label: this.i18nStore?.t('settings.localization.english') || "en"},
            {value: "de", label: this.i18nStore?.t('settings.localization.german') || "de"},
            {value: "it", label: this.i18nStore?.t('settings.localization.italian') || "it"},
            {value: "es", label: this.i18nStore?.t('settings.localization.spanish') || "es"},
            {value: "rs", label: this.i18nStore?.t('settings.localization.serbian') || "rs"},
            {value: "sr", label: this.i18nStore?.t('settings.localization.serbianLatin') || "sr"},
            {value: "fr", label: this.i18nStore?.t('settings.localization.french') || "fr"},
            {value: "pt", label: this.i18nStore?.t('settings.localization.portuguese') || "pt"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.localization.timeFormat')}">
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'hourFormat')} .value=${this.settingsState.hourFormat}
            .options=${[
            {value: "12", label: this.i18nStore?.t('settings.localization.format12h') || "12"},
            {value: "24", label: this.i18nStore?.t('settings.localization.format24h') || "24"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.localization.dateFormat')}">
          <alps-select @change=${(e: Event) => this.handleUpdate(e, 'dateFormat')} .value=${this.settingsState.dateFormat}
            .options=${[
            {value: "YYYY-MM-DD", label: "YYYY-MM-DD"},
            {value: "MM/DD/YYYY", label: "MM/DD/YYYY"},
            {value: "DD.MM.YYYY", label: "DD.MM.YYYY"}
          ]}>
          </alps-select>
        </alps-setting-group>
    `;
  }
}
