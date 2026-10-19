import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { composeContext, ComposeStore } from '../store/compose-store';
import { isolatedEmail } from '../utils/bidi';

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

    // The name and the address each in an isolate, so a direction override
    // in either cannot reverse the other, or the recipients listed after it.
    if (displayName) {
      return html`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          <bdi class="recipient-name">${displayName}</bdi>
          <span class="recipient-address">&lt;${isolatedEmail(this.address)}&gt;</span>
        </a>
      `;
    } else {
      return html`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          ${isolatedEmail(this.address)}
        </a>
      `;
    }
  }
}
