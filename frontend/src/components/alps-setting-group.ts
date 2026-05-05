import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('alps-setting-group')
export class AlpsSettingGroup extends LitElement {
  @property({ type: String }) label = '';
  @property({ type: String }) description = '';

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
      ${this.label ? html`<label class="setting-label">${this.label}</label>` : ''}
      ${this.description ? html`<div class="setting-description">${this.description}</div>` : ''}
      <div class="slot-container">
        <slot></slot>
      </div>
    `;
  }
}
