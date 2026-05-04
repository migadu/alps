import { LitElement, html, css } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';
import 'unicode-emoji-picker';
import './alps-popup';

@customElement('alps-emoji-selector-popup')
export class AlpsEmojiSelectorPopup extends LitElement {
  @property({ type: String }) position: 'top' | 'bottom' = 'bottom';
  @query('alps-popup') popup!: any;

  static styles = css`
    :host {
      display: inline-block;
    }

    .selector-container {
      display: flex;
      flex-direction: column;
      width: 320px;
      height: 400px;
    }

    unicode-emoji-picker {
      width: 100%;
      height: 100%;
      --fill-color: var(--bg-primary, #ffffff);
      --text-color: var(--text-primary, #111827);
      --box-shadow: none;
      --border-radius: 0;
      
      /* Theme mappings */
      --filters-border-color: var(--border-color, #e5e7eb);
      --filter-fill-color-hover: var(--hover-color, #f3f4f6);
      --content-scrollbar-thumb-fill-color: var(--border-color, #e5e7eb);
      --content-scrollbar-thumb-fill-color-hover: var(--text-muted, #6b7280);
      --filter-active-marker-border-color: var(--accent-color, #005A9E);
      --title-bar-fill-color: var(--bg-primary, #ffffff);
      --search-input-border-color: var(--border-color, #e5e7eb);
      --search-input-border-color-hover: var(--accent-color, #005A9E);
      --emoji-border-color-hover: var(--hover-color, #f3f4f6);
      
      font-size: 16px;
    }

    /* Target specific parts of the picker to hide the top/bottom borders that popup might have */
  `;

  private _handleEmojiPick(e: any) {
    const emoji = e.detail.emoji;
    if (this.popup) this.popup.close();
    this.dispatchEvent(new CustomEvent('emoji-selected', {
      detail: { emoji },
      bubbles: true,
      composed: true
    }));
  }

  private _handlePopupToggle() {
    // Popup opened
  }

  render() {
    return html`
      <alps-popup align="left" position="${this.position}" @click=${this._handlePopupToggle}>
        <slot name="trigger" slot="trigger"></slot>
        <div class="selector-container" @click=${(e: Event) => e.stopPropagation()}>
          <unicode-emoji-picker
            filters-position="top"
            @emoji-pick=${this._handleEmojiPick}
          ></unicode-emoji-picker>
        </div>
      </alps-popup>
    `;
  }
}
