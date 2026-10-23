import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/** The fields a setting holds, its own or alps's. */
const FIELDS = 'alps-input, alps-select, alps-address-input, input:not([type="hidden"]), select, textarea';

@customElement('alps-setting-group')
export class AlpsSettingGroup extends LitElement {
  @property({ type: String }) label = '';
  @property({ type: String }) description = '';

  /**
   * A click on the label puts the focus in the setting's field.
   *
   * The label is in this shadow root, and the field is slotted in from
   * outside it: no `for` reaches across, so a click on it did nothing. The
   * field is the group's own first one, not one in a group inside this one,
   * which has a label of its own.
   */
  private focusField = () => {
    const field = [...this.querySelectorAll<HTMLElement>(FIELDS)].find((f) => f.closest('alps-setting-group') === this);
    field?.focus();
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 600px;
      margin-bottom: 36px;
    }

    .setting-label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .setting-description {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
      line-height: 1.4;
      margin-bottom: 12px;
    }

    .slot-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `;

  render() {
    return html`
      ${this.label ? html`<label class="setting-label" @click=${this.focusField}>${this.label}</label>` : ''}
      ${this.description ? html`<div class="setting-description">${this.description}</div>` : ''}
      <div class="slot-container">
        <slot></slot>
      </div>
    `;
  }
}
