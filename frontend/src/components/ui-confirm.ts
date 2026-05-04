import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { modalButtonStyles } from './ui-modal';
import './ui-modal';
import './alps-button';

@customElement('ui-confirm')
export class UIConfirm extends LitElement {
  // eslint-disable-next-line lit/no-native-attributes
  @property({ type: String }) title: string = 'Confirm';
  @property({ type: String }) message: string = 'Are you sure?';
  @property({ type: String }) confirmText: string = 'Confirm';
  @property({ type: String }) cancelText: string = 'Cancel';
  @property({ type: String }) secondaryText?: string;
  @property({ type: Boolean }) isDanger: boolean = false;
  @property({ type: Boolean }) dismissible: boolean = false;

  static styles = [modalButtonStyles];

  private _handleCancel(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
  }

  private _handleSecondary(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('secondary', { bubbles: true, composed: true }));
  }

  private _handleConfirm(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <ui-modal 
        .title=${this.title}
        .isDanger=${this.isDanger}
        .dismissible=${this.dismissible}
        @cancel=${this._handleCancel}
      >
        <slot>${this.message}</slot>
        <alps-button slot="actions" variant="text" @click=${this._handleCancel}>${this.cancelText}</alps-button>
        ${this.secondaryText ? html`<alps-button slot="actions" variant="text" @click=${this._handleSecondary}>${this.secondaryText}</alps-button>` : ''}
        <alps-button slot="actions" variant=${this.isDanger ? 'danger' : 'normal'} @click=${this._handleConfirm}>
          ${this.confirmText}
        </alps-button>
      </ui-modal>
    `;
  }
}
