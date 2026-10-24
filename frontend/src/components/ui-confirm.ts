import { LitElement, html } from 'lit';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { customElement, property } from 'lit/decorators.js';
import { modalButtonStyles } from './ui-modal';
import './ui-modal';
import './alps-button';

@customElement('ui-confirm')
export class UIConfirm extends LitElement {
  // Consumed for the button fallbacks: this dialog is used from many places, and
  // wherever a caller passed no text its buttons were English in every locale.
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  /** The heading, passed on to ui-modal; not HTML's `title` (see there). */
  @property({ type: String }) heading: string = 'Confirm';
  @property({ type: String }) message: string = 'Are you sure?';
  @property({ type: String }) confirmText: string = 'Confirm';
  @property({ type: String }) cancelText: string = '';
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
        .heading=${this.heading}
        .isDanger=${this.isDanger}
        .dismissible=${this.dismissible}
        .bodyDescribes=${true}
        @cancel=${this._handleCancel}
      >
        <slot>${this.message}</slot>
        <alps-button slot="actions" variant="text" @click=${this._handleCancel}>${this.cancelText || this.i18nStore?.t('general.cancel') || 'Cancel'}</alps-button>
        ${this.secondaryText ? html`<alps-button slot="actions" variant="text" @click=${this._handleSecondary}>${this.secondaryText}</alps-button>` : ''}
        <alps-button slot="actions" variant=${this.isDanger ? 'danger' : 'normal'} @click=${this._handleConfirm}>
          ${this.confirmText}
        </alps-button>
      </ui-modal>
    `;
  }
}
