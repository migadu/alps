import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { modalButtonStyles } from './ui-modal';
import './alps-button';

export interface PromptField {
  id: string;
  label: string;
  value?: string;
  type?: string;
  placeholder?: string;
  autofocus?: boolean;
}

@customElement('ui-prompt')
export class UIPrompt extends LitElement {
  @property({ type: String }) title: string = 'Prompt';
  @property({ type: Array }) fields: PromptField[] = [];
  @property({ type: String }) confirmText: string = 'Apply';
  @property({ type: String }) cancelText: string = 'Cancel';

  @state() private values: Record<string, string> = {};

  static styles = [
    modalButtonStyles,
    css`
      .field-group {
        margin-bottom: 16px;
      }
      .field-group:last-child {
        margin-bottom: 0;
      }
      .field-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--text-primary, #111827);
      }
      .field-input {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 12px;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 4px;
        font-size: 14px;
        color: var(--text-primary, #111827);
        background-color: var(--bg-primary, #ffffff);
        font-family: inherit;
      }
      .field-input:focus {
        outline: none;
        border-color: var(--accent-color, #2563eb);
      }
    `
  ];

  connectedCallback() {
    super.connectedCallback();
    const initialValues: Record<string, string> = {};
    for (const f of this.fields) {
      initialValues[f.id] = f.value || '';
    }
    this.values = initialValues;
  }

  firstUpdated() {
    // Need a small timeout to allow the native <dialog> underneath to render and become focusable
    setTimeout(() => {
      const inputToFocus = this.shadowRoot?.querySelector('input[autofocus]') as HTMLInputElement | null;
      if (inputToFocus) {
        inputToFocus.focus();
      } else {
        const firstInput = this.shadowRoot?.querySelector('input') as HTMLInputElement | null;
        if (firstInput) firstInput.focus();
      }
    }, 50);
  }

  private _handleInput(e: Event, id: string) {
    const el = e.target as HTMLInputElement;
    this.values = { ...this.values, [id]: el.value };
  }

  private _handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._handleSubmit();
    }
  }

  private _handleCancel() {
    this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
  }

  private _handleSubmit() {
    this.dispatchEvent(new CustomEvent('submit', { 
      detail: this.values,
      bubbles: true, 
      composed: true 
    }));
  }

  render() {
    return html`
      <ui-modal 
        .title=${this.title}
        @cancel=${this._handleCancel}>
        
        <div class="prompt-form">
          ${this.fields.map(f => html`
            <div class="field-group">
              <label class="field-label" for=${f.id}>${f.label}</label>
              <input 
                id=${f.id}
                class="field-input"
                type=${f.type || 'text'}
                placeholder=${f.placeholder || ''}
                .value=${this.values[f.id] || ''}
                ?autofocus=${f.autofocus}
                @input=${(e: Event) => this._handleInput(e, f.id)}
                @keydown=${this._handleKeyDown}
              />
            </div>
          `)}
        </div>
        
        <alps-button slot="actions" variant="text" @click=${this._handleCancel}>${this.cancelText}</alps-button>
        <alps-button slot="actions" variant="normal" @click=${this._handleSubmit}>${this.confirmText}</alps-button>
      </ui-modal>
    `;
  }
}
