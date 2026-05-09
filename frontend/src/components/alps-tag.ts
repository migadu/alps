import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('alps-tag')
export class AlpsTag extends LitElement {
  @property({ type: String }) name = '';
  @property({ type: String }) color = '';

  static styles = css`
    :host {
      display: inline-flex;
    }

    .tag-pill {
      display: inline-flex;
      align-items: center;
      padding: 0 10px 0 6px;
      height: 18px;
      border-radius: 4px 0 0 4px;
      font-size: 10px;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      max-width: 80px;
      line-height: 1;
      opacity: 0.9;
      clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%);
    }

    .tag-pill:hover {
      opacity: 1;
    }
  `;

  render() {
    return html`
      <div class="tag-pill" style="background-color: ${this.color}" title=${this.name}>
        ${this.name}
      </div>
    `;
  }
}
