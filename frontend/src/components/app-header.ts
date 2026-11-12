import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { registry } from '../plugin-registry';
import { getMailboxLabel } from '../utils/ui';
import { isComposingKey } from '../utils/active-element';
import { matchesTabRoute } from '../utils/routes';
import { pageHash } from '../utils/settings-history';
import { logoStyles, renderLogo } from '../utils/branding';
import './alps-header';
import './alps-input';
import './alps-icon-btn';
import { motionStyles } from '../utils/motion';

@customElement('app-header')
export class AppHeader extends LitElement {
  @property({ type: String }) username = '';
  @property({ type: String }) currentTab = 'messages';
  @property({ type: Boolean }) isMobile = false;
  @property({ type: String }) currentMailbox = '';
  /** The folder list, so the placeholder names `currentMailbox` as the
   * sidebar does: by its role, and split where the server splits it. */
  @property({ type: Array }) mailboxes: any[] = [];
  @property({ type: String }) searchQuery = '';
  @property({ type: Boolean }) scrolled = false;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      if (!this.isConnected) return;
      this.i18nStore?.addEventListener('change', this._handleStoreChange);
    });
    window.addEventListener('hashchange', this._handleHashChange);
    window.addEventListener('plugins-updated', this._handleStoreChange as EventListener);
    this._handleHashChange();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleStoreChange);
    window.removeEventListener('hashchange', this._handleHashChange);
    window.removeEventListener('plugins-updated', this._handleStoreChange as EventListener);
  }

  private _handleStoreChange = () => {
    this.requestUpdate();
  };

  private _handleHashChange = () => {
    // The page this header belongs to. Settings is a window OVER a page, not a
    // tab: under it the hash is the window's, and the page is the one it was
    // opened from. Unknown under a direct load of Settings, which draws the
    // mailbox, and so the tab stays what it was.
    const hash = pageHash();
    if (hash === null) return;
    if (matchesTabRoute(hash, 'contacts')) {
      this.currentTab = 'contacts';
    } else {
      const pluginTab = registry.getNavTabs().find(tab => matchesTabRoute(hash, tab.id));
      if (pluginTab) {
        this.currentTab = pluginTab.id;
      } else {
        this.currentTab = 'messages';
      }
    }
  };

  static styles = [motionStyles, logoStyles, css`
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

    .logo svg,
    .logo img.logo {
      width: 28px;
      height: 28px;
    }

    nav {
      height: 100%;
    }

    .nav-tabs {
      display: flex;
      height: 100%;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .nav-tabs li {
      display: flex;
    }

    .nav-tab {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 12px;
      color: var(--text-secondary, #4b5563);
      font-weight: 500;
      font-size: 14px;
      text-decoration: none;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .nav-tab:hover {
      color: var(--text-primary, #111827);
    }

    /* Keyboard focus, in the accent. Drawn inside the tab, which fills the
       header's height and so has no room outside. */
    .nav-tab:focus-visible {
      outline: 2px solid var(--accent-color, #005A9E);
      outline-offset: -2px;
    }

    .nav-tab[aria-current='page'] {
      color: var(--accent-color, #2563eb);
      border-bottom-color: var(--accent-color, #2563eb);
    }

    /* Forced colours repaint every tab's underline, the transparent ones too,
       in one colour, so every tab looked current. Only the current one keeps
       it, in the system's highlight. */
    @media (forced-colors: active) {
      .nav-tab {
        border-bottom-color: Canvas;
      }

      .nav-tab[aria-current='page'] {
        border-bottom-color: Highlight;
      }
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
  `];
  private handleTabClick(e: MouseEvent, tab: string) {
    // A click that asks for another tab or window is the browser's: the link
    // opens the page there.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    // A plugin tab clicked on its own page goes nowhere. Its bare `#/<tab>` is
    // the page the user is already on under another spelling: setting it was
    // a history entry, which the page then completed in place to the very
    // view beneath it, so the history held that address twice and the first
    // Back appeared to do nothing.
    if (matchesTabRoute(window.location.hash, tab)) return;
    this.currentTab = tab;
    this.dispatchEvent(new CustomEvent('change-tab', { detail: { tab } }));
    if (tab === 'messages') {
        if (!window.location.hash.startsWith('#/mailbox/')) {
            window.location.hash = '#/';
        }
    } else {
        window.location.hash = '#/' + tab;
    }
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
            <div class="logo">
              ${renderLogo()}
            </div>
            <!-- Links, so Tab reaches them and a screen reader hears where
                 they go and which is the page on screen. -->
            <nav aria-label=${this.i18nStore?.t('navigation.label') || 'Apps'}>
              <ul class="nav-tabs" role="list">
                <li>
                  <a
                    class="nav-tab"
                    href="#/"
                    aria-current=${this.currentTab === 'messages' ? 'page' : nothing}
                    @click=${(e: MouseEvent) => this.handleTabClick(e, 'messages')}
                    title=${this.i18nStore?.t('navigation.messages')}
                  >${this.i18nStore?.t('navigation.messages')}</a>
                </li>
                ${registry.getNavTabs().map(tab => html`
                  <li>
                    <a
                      class="nav-tab"
                      href="#/${tab.id}"
                      aria-current=${this.currentTab === tab.id ? 'page' : nothing}
                      @click=${(e: MouseEvent) => this.handleTabClick(e, tab.id)}
                      title=${this.i18nStore?.t(tab.labelKey) || tab.id}
                    >${this.i18nStore?.t(tab.labelKey) || tab.id}</a>
                  </li>
                `)}
              </ul>
            </nav>
          ` : ''}
        </div>

        <alps-input 
          slot="center"
          icon="magnifyingGlass"
          ?clearable=${true}
          .value=${this.searchQuery}
          .placeholder=${this.currentTab === 'contacts' ? (this.i18nStore?.t('contacts.title') || 'Contacts') : this.currentTab === 'calendar' ? (this.i18nStore?.t('calendar.title') || 'Search Calendar') : this.currentTab === 'tasks' ? this.i18nStore?.t('tasks.title') : (this.currentMailbox ? getMailboxLabel(this.currentMailbox, this.i18nStore, this.mailboxes) : (this.i18nStore?.t('search.placeholder')))}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter' && !isComposingKey(e)) {
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
        </div>
      </alps-header>
    `;
  }
}
