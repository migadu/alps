import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { renderIcon } from '../utils/ui';

@customElement('alps-nav-buttons')
export class AlpsNavButtons extends LitElement {
    @property({ type: String }) label = 'Today';

    static styles = css`
        :host {
            display: inline-flex;
        }

        .nav-buttons {
            display: flex;
            align-items: center;
        }

        .nav-buttons button {
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            padding: 6px 12px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary, #111827);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 30px;
            box-sizing: border-box;
            transition: background-color 0.2s;
        }

        .nav-buttons button svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        .nav-buttons button:first-child {
            border-radius: 6px 0 0 6px;
        }
        
        .nav-buttons button:last-child {
            border-radius: 0 6px 6px 0;
            border-left: none;
        }
        
        .nav-buttons button:nth-child(2) {
            border-left: none;
            padding-left: 16px;
            padding-right: 16px;
        }

        @media (hover: hover) {
            .nav-buttons button:hover {
                background-color: var(--bg-secondary, #f3f4f6);
            }
        }
    `;

    private handlePrevious() {
        this.dispatchEvent(new CustomEvent('previous', { bubbles: true, composed: true }));
    }

    private handleNext() {
        this.dispatchEvent(new CustomEvent('next', { bubbles: true, composed: true }));
    }

    private handleCenter() {
        this.dispatchEvent(new CustomEvent('center', { bubbles: true, composed: true }));
    }

    render() {
        return html`
            <div class="nav-buttons">
                <button @click=${this.handlePrevious} aria-label="Previous">
                    ${renderIcon('caretLeft')}
                </button>
                <button @click=${this.handleCenter}>
                    ${this.label}
                </button>
                <button @click=${this.handleNext} aria-label="Next">
                    ${renderIcon('caretRight')}
                </button>
            </div>
        `;
    }
}
