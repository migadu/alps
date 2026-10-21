import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { composeContext, ComposeStore } from '../store/compose-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { addressText, addressWarning, mixedScriptStyles } from '../utils/address-display';

@customElement('alps-recipient-pill')
export class RecipientPill extends LitElement {
  @consume({ context: composeContext })
  composeStore!: ComposeStore;

  /** For the warning beside a lookalike address, the pill's one string. */
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @property({ type: String }) name = '';
  @property({ type: String }) address = '';

  connectedCallback() {
    super.connectedCallback();
    this.i18nStore?.addEventListener('change', this._handleI18nChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);
  }

  private _handleI18nChange = () => this.requestUpdate();

  static styles = [mixedScriptStyles, css`
    :host {
      display: inline;
    }
    
    .recipient-link {
      display: inline;
      color: var(--text-color);
      text-decoration: none;
      cursor: pointer;
    }

    .recipient-link:hover {
      text-decoration: underline;
    }

    .recipient-name {
      font-weight: 500;
    }

    .recipient-address {
      color: var(--text-muted);
    }
  `];

  private handleClick() {
    this.composeStore.openComposer({ to: [this.address] });
  }

  render() {
    let displayName = this.name;
    if (displayName === this.address) {
      displayName = '';
    }

    // The name and the address each in an isolate, so a direction override
    // in either cannot reverse the other, or the recipients listed after it.
    // The address is shown as it should be read, and warned about when it may
    // not be the one it looks like; the title and a click keep it as written.
    const text = addressText(this.address);
    const warning = addressWarning(this.address, this.i18nStore);
    if (displayName) {
      return html`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          <bdi class="recipient-name">${displayName}</bdi>
          <span class="recipient-address">&lt;${text}&gt;</span>${warning}
        </a>
      `;
    } else {
      return html`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          ${text}${warning}
        </a>
      `;
    }
  }
}
