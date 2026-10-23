import { html, css, LitElement } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { settingsContext, SettingsStore } from '../store/settings-store';
import type { SettingsState } from '../store/settings-store';
import { themeFamily } from '../store/themes';
import { i18nContext, I18nStore, intlTag } from '../store/i18n-store';
import { renderIcon } from '../utils/ui';
import { deepActiveElement } from '../utils/active-element';
import './alps-category-item';
import './alps-icon-btn';
import './alps-input';
import './alps-select';
import './alps-setting-group';
import './settings-accounts';
import './alps-webauthn-settings';
import './ui-confirm';

import { loadComponent, registry } from '../plugin-registry';
import './alps-page-load-error';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

/**
 * The window's z-index: under every composer, whose own start at 1000
 * (compose-store), and over the page it was opened from, which the shell puts
 * in a stacking context of its own at 0 while the window is open (so the
 * page's header, at 20000 inside it, is covered too). A composer opened over
 * Settings therefore floats above it, as it floated over the Settings page.
 */
export const SETTINGS_WINDOW_Z = 900;

/** The phone layout's width, the one the rest of the app switches at. */
const MOBILE_MAX_WIDTH = 768;

/**
 * What a section edited in place, with a Save of its own, declares: the
 * window asks it before a Close, an Escape or another section would unmount
 * its draft (`SettingsWindow.leave`). Sections that apply as they change have
 * nothing to declare.
 */
export interface UnsavedChanges {
  readonly hasUnsavedChanges: boolean;
}

/**
 * Settings: a window over the page it was opened from.
 *
 * The composer's frame and title bar, as one large centred window over a
 * dimmed app, with two columns: the section list and the section. It replaced
 * a full-screen page whose Back button went to the Inbox whatever the user had
 * been reading; the page beneath now stays mounted, dimmed and inert, and
 * closing the window shows it as it was.
 *
 * NOT MODAL. Composers float above it, as they floated over the page, so a
 * draft half-written when the user went to fix their signature is still there
 * to finish. That is why this is a positioned window rather than a
 * `showModal()` dialog, which would put it above them and make them inert.
 *
 * THE URL IS THE SHELL'S. The section is a property `app-root` reads off
 * `#/settings/<section>`, and this window asks for another one, or to close,
 * by event (`settings-category`, `settings-close`). Only the shell knows the
 * history entry the window is on (`utils/settings-history`): choosing a
 * section replaces it, so Back closes the window rather than walking back
 * through every section visited.
 *
 * Every setting applies as it changes, which is what lets the Appearance
 * section restyle the mail behind the window live; the sections whose forms
 * write to the server (the filters, the auto-reply) keep their own Save.
 */
@customElement('settings-window')
export class SettingsWindow extends LitElement {
  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  /** The section the URL names; '' for none, which is the section list on a
   *  phone and General on a desktop. */
  @property({ type: String }) category = '';
  @state() private settingsState!: SettingsState;
  @state() private isMobile = window.innerWidth <= MOBILE_MAX_WIDTH;

  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: ${SETTINGS_WINDOW_Z};
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* The composer's backdrop when it is expanded: the page beneath, dimmed. */
    .backdrop {
      position: absolute;
      inset: 0;
      background: var(--modal-backdrop, rgba(255, 255, 255, 0.8));
    }

    /* The composer's frame, rounded on all four corners as an expanded one is. */
    .window-frame {
      position: relative;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      width: min(960px, calc(100vw - 48px));
      height: min(860px, calc(100vh - 48px));
      height: min(860px, calc(100dvh - 48px));
      background: var(--bg-primary);
      border-radius: 8px;
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    /* The composer's title bar, without its Minimize and Expand. */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 6px 6px 10px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      color: var(--text-color);
    }

    .header-title {
      font-weight: 500;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .settings-layout {
      display: flex;
      flex: 1;
      min-height: 0;
      color: var(--text-primary);
      font-size: 14px;
    }

    .sections {
      flex: 0 0 220px;
      box-sizing: border-box;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 0;
      border-right: 1px solid var(--border-color);
    }

    .main-view {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
      padding: 24px 32px;
      background: var(--bg-primary);
    }

    .settings-content-wrapper {
      max-width: 640px;
      margin: 0 auto;
    }

    .category-title {
      margin: 0 0 24px;
      font-family: var(--font-heading);
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .back-to-sections {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 12px;
      padding: 4px 8px 4px 4px;
      border: none;
      border-radius: 6px;
      background: none;
      color: var(--text-primary);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }
    .back-to-sections:hover {
      background: var(--hover-color);
    }
    .back-to-sections svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    /* A phone shows the whole screen, one column at a time: the list, or one
       section. */
    @media (max-width: ${MOBILE_MAX_WIDTH}px) {
      .window-frame {
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        border: none;
        border-radius: 0;
      }
      .sections {
        flex: 1;
        border-right: none;
      }
      .main-view {
        padding: 16px;
      }
    }

    select:focus, input:focus, textarea:focus {
      border-color: var(--accent-color, #2563eb);
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }

    textarea {
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
  `;

  /** Where focus was when the window opened, to give back when it closes. */
  private previouslyFocused: Element | null = null;

  private _handleResize = () => {
    this.isMobile = window.innerWidth <= MOBILE_MAX_WIDTH;
  };

  /**
   * Escape closes the window, unless the key is somebody else's.
   *
   * On the DOCUMENT, not the window, because focus is not always inside it:
   * a click on the dimmed page leaves it on the body. What is excluded is
   * what Escape already means something to: an open dialog or menu anywhere
   * on the key's path (a confirm, a dropdown: one press closes THAT, and must
   * not take the window with it), and a composer floating above this window.
   */
  private onDocumentKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    for (const node of e.composedPath()) {
      if (node instanceof HTMLDialogElement && node.open) return;
      if (node instanceof HTMLElement && node.localName === 'alps-floating-composer') return;
    }
    e.preventDefault();
    this.requestClose();
  };

  /** Which sections exist is the session's answer: a direct #/settings load
   * draws before app-root has read which plugins are enabled. */
  private handlePluginsUpdated = () => {
    this.requestUpdate();
  };

  /** The section to show: the one asked for, or General on a desktop when
   * none is. */
  private get shownCategory(): string {
    return this.category || (this.isMobile ? '' : 'general');
  }

  connectedCallback() {
    super.connectedCallback();
    // Before anything here can move it.
    this.previouslyFocused = deepActiveElement();
    document.addEventListener('keydown', this.onDocumentKeydown);
    this.settingsStore.addEventListener('change', this._handleSettingsChange);
    this.i18nStore?.addEventListener('change', this._handleI18nChange);
    window.addEventListener('resize', this._handleResize);
    window.addEventListener('plugins-updated', this.handlePluginsUpdated);
    this._syncState();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.onDocumentKeydown);
    this.settingsStore.removeEventListener('change', this._handleSettingsChange);
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);
    window.removeEventListener('resize', this._handleResize);
    window.removeEventListener('plugins-updated', this.handlePluginsUpdated);
    // Cleared first: this element can be re-connected, and a stale target from
    // a previous open is worse than none.
    const target = this.previouslyFocused as HTMLElement | null;
    this.previouslyFocused = null;
    if (target?.isConnected) target.focus?.();
  }

  /**
   * Focus moves in, onto the current section (or the way back to the list,
   * on a phone showing one section), so the keyboard starts where the eye
   * does. Unless it is already inside: a click that landed first wins.
   */
  protected firstUpdated() {
    const root = this.shadowRoot!;
    if (root.activeElement) return;
    const target = root.querySelector('alps-category-item[active]')
      ?? root.querySelector('.back-to-sections')
      ?? root.querySelector('alps-category-item');
    (target as HTMLElement | null)?.focus();
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

  /** Asks the shell for `category`; '' is the section list on a phone. The
   * section already open is no move at all. */
  private selectCategory(category: string) {
    if (category === this.shownCategory) return;
    this.leave(() => this.dispatchEvent(new CustomEvent('settings-category', {
      detail: { category },
      bubbles: true,
      composed: true,
    })));
  }

  private requestClose() {
    this.leave(() => this.dispatchEvent(new CustomEvent('settings-close', { bubbles: true, composed: true })));
  }

  /** A move away from the open section, held while the user is asked whether
   * to drop its unsaved changes; see `leave`. */
  @state() private pendingLeave: (() => void) | null = null;

  /**
   * Leaves the open section, by `action`: at once, or once the user agrees to
   * drop what it has not saved.
   *
   * Every setting applies as it changes, except where a section has a form
   * with its own Save (the filters, the auto-reply). Such a section says so
   * with `hasUnsavedChanges` (see `UnsavedChanges`), and a Close, an Escape or
   * another section asks first. The browser's Back cannot be asked: it has
   * already gone when anything hears it.
   *
   * The field being typed in is committed first. The signature, the display
   * name and the reply-to save on `change`, which a field fires as it loses
   * focus; Escape would otherwise remove it while it still had focus, and the
   * last thing typed into it would be gone.
   */
  private leave(action: () => void) {
    const active = deepActiveElement();
    if (active instanceof HTMLElement && (active.localName === 'input' || active.localName === 'textarea' || active.isContentEditable)) {
      active.blur();
    }
    const wrapper = this.shadowRoot?.querySelector('.settings-content-wrapper');
    const unsaved = [...(wrapper?.children ?? [])].some((section) => (section as Partial<UnsavedChanges>).hasUnsavedChanges === true);
    if (unsaved) {
      this.pendingLeave = action;
      return;
    }
    action();
  }

  private confirmLeave = () => {
    const action = this.pendingLeave;
    this.pendingLeave = null;
    action?.();
  };

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
    } else if (target.type === 'number' || ['checkMailInterval', 'autoLogout', 'messagesPerPage', 'markReadTimeout', 'undoTimeout', 'weekStart'].includes(key)) {
      val = parseInt(target.value, 10);
      if (isNaN(val)) val = 0;
    }

    this.settingsStore.updateSettings({ [key]: val } as any);
  }

  private renderSection(id: string, icon: string, label: string | undefined, category: string) {
    return html`
      <alps-category-item
        ?active=${category === id}
        @click=${() => this.selectCategory(id)}
        .icon=${icon}
      >${label}</alps-category-item>`;
  }

  private renderSections(category: string) {
    const t = (key: string) => this.i18nStore?.t(key);
    return html`
      <nav class="sections">
        ${this.renderSection('general', 'gear', t('settings.categories.general'), category)}
        ${this.renderSection('reading', 'bookOpen', t('settings.categories.reading'), category)}
        ${this.renderSection('appearance', 'palette', t('settings.categories.appearance'), category)}
        ${this.renderSection('localization', 'globe', t('settings.categories.localization'), category)}
        ${this.renderSection('identity', 'user', t('settings.categories.identity'), category)}
        ${this.renderSection('accounts', 'users', t('settings.categories.accounts'), category)}
        ${this.renderSection('webauthn', 'fingerprint', t('settings.categories.webauthn'), category)}
        ${registry.getSettingsTabs().map(tab => this.renderSection(tab.id, tab.icon, t(tab.labelKey), category))}
      </nav>
    `;
  }

  private renderContent(category: string) {
    if (!this.settingsState) return html`<div>${this.i18nStore?.t('settings.loading')}</div>`;
    return html`
      ${category === 'general' ? this.renderGeneral() : ''}
      ${category === 'identity' ? this.renderIdentity() : ''}
      ${category === 'accounts' ? html`<settings-accounts></settings-accounts>` : ''}
      ${category === 'webauthn' ? html`<alps-webauthn-settings></alps-webauthn-settings>` : ''}
      ${category === 'reading' ? this.renderReading() : ''}
      ${category === 'appearance' ? this.renderAppearance() : ''}
      ${category === 'localization' ? this.renderLocalization() : ''}
      ${registry.getSettingsTabs()
          .filter(tab => tab.id === category)
          .map(tab => loadComponent(tab, () => this.requestUpdate())
            ? html`${unsafeHTML(`<${tab.component}></${tab.component}>`)}`
            : html`<alps-page-load-error></alps-page-load-error>`)
      }
    `;
  }

  render() {
    const category = this.shownCategory;
    // A phone shows one column: the list until a section is chosen, then the
    // section with a way back to the list.
    const showSections = !this.isMobile || category === '';
    const showContent = category !== '';
    const t = (key: string) => this.i18nStore?.t(key) ?? '';
    const title = t('settings.title');
    return html`
      ${this.pendingLeave ? html`
        <ui-confirm
          heading=${t('settings.unsavedTitle')}
          message=${t('settings.unsavedMessage')}
          confirmText=${t('settings.discard')}
          cancelText=${t('settings.keepEditing')}
          .isDanger=${true}
          @confirm=${this.confirmLeave}
          @cancel=${() => { this.pendingLeave = null; }}
        ></ui-confirm>
      ` : ''}
      <div class="backdrop"></div>
      <div class="window-frame" role="dialog" aria-label=${title}>
        <div class="header">
          <div class="header-title">${title}</div>
          <alps-icon-btn
            class="close-btn"
            title=${t('general.close')}
            icon="x"
            @click=${() => this.requestClose()}
          ></alps-icon-btn>
        </div>
        <div class="settings-layout">
          ${showSections ? this.renderSections(category) : ''}
          ${showContent ? html`
            <main class="main-view">
              <div class="settings-content-wrapper">
                ${this.isMobile ? html`
                  <button class="back-to-sections" @click=${() => this.selectCategory('')}>
                    ${renderIcon('arrowLeft')} ${title}
                  </button>` : ''}
                <h1 class="category-title">${this.getCategoryLabel(category)}</h1>
                ${this.renderContent(category)}
              </div>
            </main>` : ''}
        </div>
      </div>
    `;
  }

  renderGeneral() {
    return html`
        <alps-setting-group label="${this.i18nStore?.t('settings.general.checkMailInterval')}" description="${this.i18nStore?.t('settings.general.checkMailIntervalDesc')}">
          <alps-select label="${this.i18nStore?.t('settings.general.checkMailInterval')}" @change=${(e: Event) => this.handleUpdate(e, 'checkMailInterval')} .value=${this.settingsState.checkMailInterval.toString()}
            .options=${[
            {value: "1", label: this.i18nStore?.t('settings.general.everyMinute') || "1"},
            {value: "5", label: this.i18nStore?.t('settings.general.every5Minutes') || "5"},
            {value: "15", label: this.i18nStore?.t('settings.general.every15Minutes') || "15"},
            {value: "30", label: this.i18nStore?.t('settings.general.every30Minutes') || "30"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.general.autoLogout')}" description="${this.i18nStore?.t('settings.general.autoLogoutDesc')}">
          <alps-select label="${this.i18nStore?.t('settings.general.autoLogout')}" @change=${(e: Event) => this.handleUpdate(e, 'autoLogout')} .value=${this.settingsState.autoLogout.toString()}
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
          <alps-input label="${this.i18nStore?.t('settings.identity.displayName')}" type="text" icon="user" .value=${this.settingsState.name || ''} @change=${(e: Event) => this.handleUpdate(e, 'name')} placeholder="${this.i18nStore?.t('settings.placeholderName')}"></alps-input>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.identity.signature')}" description="${this.i18nStore?.t('settings.identity.signatureDesc')}">
          <!-- Named by its setting: the label above is in alps-setting-group's
               shadow root, which no label can reach out of. -->
          <textarea aria-label=${this.i18nStore?.t('settings.identity.signature') ?? ''} @change=${(e: Event) => this.handleUpdate(e, 'signature')} .value=${this.settingsState.signature || ''}></textarea>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.identity.replyTo')}" description="${this.i18nStore?.t('settings.identity.replyToDesc')}">
          <alps-input label="${this.i18nStore?.t('settings.identity.replyTo')}" type="email" .value=${this.settingsState.replyTo || ''} @change=${(e: Event) => this.handleUpdate(e, 'replyTo')} placeholder="${this.i18nStore?.t('settings.placeholderReplyTo')}"></alps-input>
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
          <alps-select label="${this.i18nStore?.t('settings.reading.messagesPerPage')}" @change=${(e: Event) => this.handleUpdate(e, 'messagesPerPage')} .value=${this.settingsState.messagesPerPage.toString()}
            .options=${[
            {value: "25", label: "25"},
            {value: "50", label: "50"},
            {value: "100", label: "100"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.enableThreading && this.settingsState.hasThreadCapability !== false} 
                   ?disabled=${this.settingsState.hasThreadCapability === false}
                   @change=${(e: Event) => this.handleUpdate(e, 'enableThreading')}>
            ${this.i18nStore?.t('settings.reading.enableThreading')}
            ${this.settingsState.hasThreadCapability === false ? html`
              <span style="font-size: 12px; color: var(--text-muted); font-weight: normal; margin-left: 4px;">
                (${this.i18nStore?.t('settings.reading.threadingNotSupported')})
              </span>
            ` : ''}
          </label>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.preferredView')}" description="${this.i18nStore?.t('settings.reading.preferredViewDesc')}">
          <alps-select label="${this.i18nStore?.t('settings.reading.preferredView')}" @change=${(e: Event) => this.handleUpdate(e, 'preferredView')} .value=${this.settingsState.preferredView}
            .options=${[
            {value: "html", label: this.i18nStore?.t('settings.reading.html') || "html"},
            {value: "text", label: this.i18nStore?.t('settings.reading.plainText') || "text"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.themeIframeContent} 
                   @change=${(e: Event) => this.handleUpdate(e, 'themeIframeContent')}>
            ${this.i18nStore?.t('settings.reading.themeIframeContent')}
          </label>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.showRemoteContent')}">
          <alps-select label="${this.i18nStore?.t('settings.reading.showRemoteContent')}" @change=${(e: Event) => this.handleUpdate(e, 'showRemoteContent')} .value=${this.settingsState.showRemoteContent}
            .options=${[
            {value: "ask", label: this.i18nStore?.t('settings.reading.alwaysAsk') || "ask"},
            {value: "always", label: this.i18nStore?.t('settings.reading.alwaysLoad') || "always"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.markReadTimeout')}">
          <alps-select label="${this.i18nStore?.t('settings.reading.markReadTimeout')}" @change=${(e: Event) => this.handleUpdate(e, 'markReadTimeout')} .value=${this.settingsState.markReadTimeout.toString()}
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
          <alps-select label="${this.i18nStore?.t('settings.reading.composeFormat')}" @change=${(e: Event) => this.handleUpdate(e, 'composeFormat')} .value=${this.settingsState.composeFormat}
            .options=${[
            {value: "html", label: this.i18nStore?.t('settings.reading.richText') || "html"},
            {value: "text", label: this.i18nStore?.t('settings.reading.plainText') || "text"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.reading.messageSortCriteria')}" description="${this.i18nStore?.t('settings.reading.messageSortCriteriaDesc')}">
          <alps-select label="${this.i18nStore?.t('settings.reading.messageSortCriteria')}" @change=${(e: Event) => this.handleUpdate(e, 'messageSortCriteria')} .value=${this.settingsState.messageSortCriteria}
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
          <alps-select label="${this.i18nStore?.t('settings.appearance.colorTheme')}" @change=${(e: Event) => this.handleUpdate(e, 'colorFamily')} .value=${themeFamily(this.settingsState.colorFamily)}
            .options=${[
            {value: "alps", label: "Alps"},
            {value: "migadu", label: "Migadu"},
            {value: "nord", label: "Nord"},
            {value: "ocean", label: "Ocean"}
          ]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t('settings.appearance.themeMode')}" description="${this.i18nStore?.t('settings.appearance.themeModeDesc')}">
          <alps-select label="${this.i18nStore?.t('settings.appearance.themeMode')}" @change=${(e: Event) => this.handleUpdate(e, 'themeMode')} .value=${this.settingsState.themeMode}
            .options=${[
            {value: "light", label: this.i18nStore?.t('settings.appearance.light') || "light"},
            {value: "dark", label: this.i18nStore?.t('settings.appearance.dark') || "dark"},
            {value: "auto", label: this.i18nStore?.t('settings.appearance.systemAuto') || "auto"}
          ]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t('settings.appearance.layoutMode')}" description="${this.i18nStore?.t('settings.appearance.layoutModeDesc')}">
          <alps-select label="${this.i18nStore?.t('settings.appearance.layoutMode')}" @change=${(e: Event) => this.handleUpdate(e, 'layoutMode')} .value=${this.settingsState.layoutMode}
            .options=${[
            {value: "vertical", label: this.i18nStore?.t('settings.appearance.vertical') || "vertical"},
            {value: "horizontal", label: this.i18nStore?.t('settings.appearance.horizontal') || "horizontal"},
            {value: "full", label: this.i18nStore?.t('settings.appearance.fullScreen') || "full"}
          ]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t('settings.appearance.listDensity')}" description="${this.i18nStore?.t('settings.appearance.listDensityDesc')}">
          <alps-select label="${this.i18nStore?.t('settings.appearance.listDensity')}" @change=${(e: Event) => this.handleUpdate(e, 'densityMode')} .value=${this.settingsState.densityMode}
            .options=${[
            {value: "loose", label: this.i18nStore?.t('settings.appearance.loose') || "loose"},
            {value: "normal", label: this.i18nStore?.t('settings.appearance.normal') || "normal"},
            {value: "compact", label: this.i18nStore?.t('settings.appearance.compact') || "compact"},
            {value: "ultra-compact", label: this.i18nStore?.t('settings.appearance.ultraCompact') || "ultra-compact"}
          ]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group description="${this.i18nStore?.t('settings.appearance.showSenderAvatarsDesc')}">
          <label class="checkbox-label">
            <input type="checkbox"
                   ?checked=${this.settingsState.showSenderAvatars}
                   @change=${(e: Event) => this.handleUpdate(e, 'showSenderAvatars')}>
            ${this.i18nStore?.t('settings.appearance.showSenderAvatars')}
          </label>
        </alps-setting-group>
    `;
  }

  renderLocalization() {
    return html`
        <alps-setting-group label="${this.i18nStore?.t('settings.localization.language')}">
          <!-- Each language is named in its own words and marked with its own
               language, so a screen reader reads "Deutsch" in German rather
               than in the language of the page around it. -->
          <alps-select label="${this.i18nStore?.t('settings.localization.language')}" @change=${(e: Event) => this.handleUpdate(e, 'language')} .value=${this.settingsState.language}
            .options=${[
            {value: "en", lang: intlTag("en"), label: this.i18nStore?.t('settings.localization.english') || "en"},
            {value: "de", lang: intlTag("de"), label: this.i18nStore?.t('settings.localization.german') || "de"},
            {value: "it", lang: intlTag("it"), label: this.i18nStore?.t('settings.localization.italian') || "it"},
            {value: "es", lang: intlTag("es"), label: this.i18nStore?.t('settings.localization.spanish') || "es"},
            {value: "rs", lang: intlTag("rs"), label: this.i18nStore?.t('settings.localization.serbian') || "rs"},
            {value: "sr", lang: intlTag("sr"), label: this.i18nStore?.t('settings.localization.serbianLatin') || "sr"},
            {value: "fr", lang: intlTag("fr"), label: this.i18nStore?.t('settings.localization.french') || "fr"},
            {value: "pt", lang: intlTag("pt"), label: this.i18nStore?.t('settings.localization.portuguese') || "pt"},
            {value: "da", lang: intlTag("da"), label: this.i18nStore?.t('settings.localization.danish') || "da"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.localization.timeFormat')}">
          <alps-select label="${this.i18nStore?.t('settings.localization.timeFormat')}" @change=${(e: Event) => this.handleUpdate(e, 'hourFormat')} .value=${this.settingsState.hourFormat}
            .options=${[
            {value: "12", label: this.i18nStore?.t('settings.localization.format12h') || "12"},
            {value: "24", label: this.i18nStore?.t('settings.localization.format24h') || "24"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.localization.dateFormat')}">
          <alps-select label="${this.i18nStore?.t('settings.localization.dateFormat')}" @change=${(e: Event) => this.handleUpdate(e, 'dateFormat')} .value=${this.settingsState.dateFormat}
            .options=${[
            {value: "YYYY-MM-DD", label: "YYYY-MM-DD"},
            {value: "MM/DD/YYYY", label: "MM/DD/YYYY"},
            {value: "DD.MM.YYYY", label: "DD.MM.YYYY"}
          ]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t('settings.localization.weekStart')}">
          <alps-select label="${this.i18nStore?.t('settings.localization.weekStart')}" @change=${(e: Event) => this.handleUpdate(e, 'weekStart')} .value=${String(this.settingsState.weekStart ?? 1)}
            .options=${[
            {value: "1", label: this.i18nStore?.t('settings.localization.monday') || "Monday"},
            {value: "0", label: this.i18nStore?.t('settings.localization.sunday') || "Sunday"}
          ]}>
          </alps-select>
        </alps-setting-group>
    `;
  }
}
