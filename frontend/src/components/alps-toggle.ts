import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { motionStyles } from '../utils/motion';

export interface AlpsToggleOption {
  value: string;
  label: string;
}

let instances = 0;

/**
 * One choice among a few, drawn as a segmented switch.
 *
 * A radio group, not a row of buttons. The buttons marked the chosen option
 * with a class alone, so a screen reader heard four buttons and never which
 * one was selected. A radio per option says which is checked, and the arrow
 * keys move between them as in any radio group.
 */
@customElement('alps-toggle')
export class AlpsToggle extends LitElement {
  @property({ type: Array }) options: AlpsToggleOption[] = [];
  @property({ type: String }) value = '';
  /** The group's name for a screen reader: what the options choose. */
  @property({ type: String }) label = '';

  /** The radios' group. Each switch is a group of its own. */
  private readonly name = `alps-toggle-${++instances}`;

  static styles = [motionStyles, css`
    :host {
      display: inline-flex;
    }

    .group {
      display: flex;
      flex: 1;
      box-sizing: border-box;
      background-color: var(--bg-secondary, #f3f4f6);
      border-radius: 6px;
      padding: 2px;
      border: 1px solid var(--border-color, #e5e7eb);
    }

    label {
      position: relative;
      padding: 4px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      line-height: normal;
      text-align: center;
      color: var(--text-secondary, #4b5563);
      transition: all 0.2s;
    }

    label:has(:checked) {
      background-color: var(--bg-primary, #ffffff);
      color: var(--text-primary, #111827);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    label:has(:focus-visible) {
      outline: 2px solid var(--accent-color, #005A9E);
      outline-offset: 2px;
    }

    /* Out of sight, not out of reach: the radio still takes the focus and
       the keys, and the label is what shows. */
    input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      opacity: 0;
      cursor: pointer;
    }

    @media (forced-colors: active) {
      label:has(:checked) {
        forced-color-adjust: none;
        background-color: Highlight;
        color: HighlightText;
      }
    }

    :host([full-width]) {
      display: flex;
      width: 100%;
    }

    :host([full-width]) label {
      flex: 1;
    }
  `];

  render() {
    return html`
      <div class="group" role="radiogroup" aria-label=${this.label || nothing}>
        ${this.options.map(opt => html`
          <label>
            <input
              type="radio"
              name=${this.name}
              .value=${opt.value}
              .checked=${live(this.value === opt.value)}
              @change=${() => this._select(opt.value)}
            >${opt.label}
          </label>
        `)}
      </div>
    `;
  }

  private _select(val: string) {
    if (this.value !== val) {
      this.value = val;
      this.dispatchEvent(new CustomEvent('change', { detail: { value: val } }));
    }
  }
}
