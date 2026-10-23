import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { composeContext, ComposeStore } from '../store/compose-store';
import { reloadForMissingPage } from '../services/app-update';
import './alps-button.js';

/**
 * Shown in place of a page whose module could not be fetched (see
 * loadComponent): what happened, a reload, and the way back to Messages.
 *
 * Without it the page's element stayed undefined, and the screen blank: a
 * plugin page draws its own navigation, so there was none either. A reload is
 * the one way to fetch the module again, and with a composer open nothing
 * reloads by itself. Here the user asks for it, and what they were writing is
 * written to disk first, to open again after it.
 */
@customElement('alps-page-load-error')
export class AlpsPageLoadError extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      box-sizing: border-box;
      height: 100%;
      min-height: 240px;
      padding: 24px;
      text-align: center;
      color: var(--text-primary);
      background: var(--bg-primary);
    }

    .title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .hint {
      margin: 4px 0 0;
      color: var(--text-muted);
      font-size: 14px;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .persist-error {
      margin: 0;
      color: var(--error, #ef4444);
    }

    a {
      color: var(--accent-color);
      font-size: 14px;
    }
  `;

  @consume({ context: i18nContext })
  private i18nStore?: I18nStore;

  @consume({ context: composeContext })
  private composeStore?: ComposeStore;

  @state() private persistFailed = false;

  private _handleI18nChange = () => this.requestUpdate();

  connectedCallback() {
    super.connectedCallback();
    this.i18nStore?.addEventListener('change', this._handleI18nChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);
  }

  private _reload() {
    this.persistFailed = this.composeStore?.persistNow() === false;
    if (this.persistFailed) return;
    reloadForMissingPage();
  }

  render() {
    return html`
      <div role="alert">
        <h2 class="title">${this.i18nStore?.t('general.pageLoadFailed')}</h2>
        <p class="hint">${this.i18nStore?.t('general.pageLoadFailedHint')}</p>
      </div>
      ${this.persistFailed ? html`<p class="persist-error" role="alert">${this.i18nStore?.t('composer.draftSaveFailedKeepOpen')}</p>` : ''}
      <div class="actions">
        <alps-button variant="primary" @click=${this._reload}>${this.i18nStore?.t('update.reload')}</alps-button>
        <a href="#/mailbox/INBOX">${this.i18nStore?.t('navigation.messages')}</a>
      </div>
    `;
  }
}
