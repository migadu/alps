import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { composeContext, ComposeStore } from '../store/compose-store';

@customElement('alps-recipient-pill')
export class RecipientPill extends LitElement {
  @consume({ context: composeContext })
  composeStore!: ComposeStore;

  @property({ type: String }) name = '';
  @property({ type: String }) address = '';

  static styles = css`
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
  `;

  private handleClick() {
    this.composeStore.openComposer({ to: [this.address] });
  }

  render() {
    let displayName = this.name;
    if (displayName === this.address) {
      displayName = '';
    }

    if (displayName) {
      return html`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          <span class="recipient-name">${displayName}</span>
          <span class="recipient-address">&lt;${this.address}&gt;</span>
        </a>
      `;
    } else {
      return html`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          ${this.address}
        </a>
      `;
    }
  }
}
