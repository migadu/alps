import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { sidebarStripContext } from './alps-sidebar-strip';
import './alps-button';

@customElement('alps-create-button')
export class AlpsCreateButton extends LitElement {
  /** Its small form, in the collapsed strip: read from the sidebar above it
   *  rather than passed in by each page. Reflected, because the small form is
   *  styled off the attribute. */
  @consume({ context: sidebarStripContext, subscribe: true })
  @property({ type: Boolean, reflect: true }) collapsed = false;
  @property({ type: String }) icon = 'plus';
  @property({ type: String }) text = '';
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) title = '';

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .create-btn {
      width: 100%;
      height: 36px;
      font-size: 14px;
      overflow: hidden;
      --btn-padding: 8px 16px;
      --btn-gap: 8px;
      transition: all 0.2s ease;
    }

    .create-btn::part(button) {
      width: 100%;
      height: 100%;
    }

    :host([collapsed]) .create-btn {
      --btn-padding: 8px;
      --btn-gap: 0px;
    }

    .create-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: max-width 0.2s ease, opacity 0.2s ease, margin 0.2s ease;
      max-width: 150px;
      opacity: 1;
      display: inline-block;
    }

    :host([collapsed]) .create-text {
      max-width: 0;
      opacity: 0;
      margin-left: 0;
    }
  `;

  render() {
    return html`
      <alps-button 
        variant="primary"
        icon="${this.icon}"
        class="create-btn"
        ?disabled=${this.disabled}
        title="${this.title}"
        @click=${() => {
          // Fire a general click event since we intercept it here
          // The parent listens to @click on the host element automatically.
        }}
      >
        <span class="create-text"><slot>${this.text}</slot></span>
      </alps-button>
    `;
  }
}
