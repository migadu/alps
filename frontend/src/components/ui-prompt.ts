import { LitElement, html, css } from 'lit';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { customElement, property, state } from 'lit/decorators.js';
import { modalButtonStyles } from './ui-modal';
import './alps-button';
import './alps-input';
import type { AlpsInput } from './alps-input';

export interface PromptField {
  id: string;
  label: string;
  value?: string;
  type?: string;
  placeholder?: string;
  autofocus?: boolean;
  autocomplete?: string;
  /**
   * Checked when the prompt is submitted: an answer is the field's error, and
   * the prompt keeps it instead of submitting. So a value the owner would only
   * refuse never leaves the dialog.
   */
  validate?: (value: string, values: Record<string, string>) => string | null | undefined;
}

@customElement('ui-prompt')
export class UIPrompt extends LitElement {
  // Consumed for the button fallbacks: this dialog is used from many places, and
  // wherever a caller passed no text its buttons were English in every locale.
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @property({ type: String }) title: string = 'Prompt';
  @property({ type: Array }) fields: PromptField[] = [];
  @property({ type: String }) confirmText: string = '';
  @property({ type: String }) cancelText: string = '';
  /**
   * Set by the owner while it acts on a submit.
   *
   * The prompt stays mounted until its owner takes it down, and that owner is
   * usually awaiting a network call first — so between the click and the answer
   * the confirm button sat there live. Clicking twice, or holding Enter, sent
   * the request twice: two folders created, or a rename racing itself.
   */
  @property({ type: Boolean }) busy: boolean = false;
  /**
   * Errors to show under fields, by field id: the owner's answer to a submit
   * it refused, such as a wrong password, which keeps the prompt open.
   *
   * Taken when the object changes, and a field's error goes once the user
   * types in it. An owner should therefore hand over a new object only when a
   * new refusal arrives, not one built afresh on each of its renders, which
   * would bring back an error the user had already typed past.
   */
  @property({ type: Object }) errors: Record<string, string> = {};
  /** A destructive commit: styled as ui-confirm's `isDanger` is. */
  @property({ type: Boolean }) isDanger: boolean = false;

  @state() private values: Record<string, string> = {};
  @state() private fieldErrors: Record<string, string> = {};

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
        margin-top: 8px;
      }
      .field-error {
        margin-top: 6px;
        font-size: 13px;
        color: var(--error, #ef4444);
      }
    `
  ];

  /** The field ids and initial values that `values` was last seeded from. */
  private seededFrom: string | null = null;

  willUpdate(changedProperties: Map<string, any>) {
    // Re-seeded only when the fields' ids or initial values actually differ.
    // Every owner passes `.fields=${[{ … }]}` inline, a new array on each of its
    // renders, and Lit compares properties by identity, so seeding on every
    // `fields` change reset what the user had typed whenever the owner re-rendered
    // for any reason. The folder list does on every mailbox poll, so a folder name
    // being typed could vanish mid-word.
    if (changedProperties.has('fields')) {
      // NUL and SOH as separators: neither occurs in an id or an initial value,
      // so two different field sets cannot produce the same seed.
      const seed = this.fields.map(f => `${f.id}\u0000${f.value ?? ''}`).join('\u0001');
      if (seed !== this.seededFrom) {
        this.seededFrom = seed;
        const initialValues: Record<string, string> = {};
        for (const f of this.fields) {
          initialValues[f.id] = f.value || '';
        }
        this.values = initialValues;
      }
    }
    if (changedProperties.has('errors')) {
      this.fieldErrors = { ...this.fieldErrors, ...(this.errors || {}) };
    }
  }

  firstUpdated() {
    // Need a small timeout to allow the native <dialog> underneath to render and become focusable
    setTimeout(() => {
      const inputToFocus = this.shadowRoot?.querySelector('alps-input[autofocus]') as any;
      if (inputToFocus && typeof inputToFocus.focus === 'function') {
        inputToFocus.focus();
      } else {
        const firstInput = this.shadowRoot?.querySelector('alps-input') as any;
        if (firstInput && typeof firstInput.focus === 'function') firstInput.focus();
      }
    }, 50);
  }

  private _handleInput(e: Event, id: string) {
    const el = e.target as HTMLInputElement;
    this.values = { ...this.values, [id]: el.value };
    if (this.fieldErrors[id]) {
      this.fieldErrors = { ...this.fieldErrors, [id]: '' };
    }
  }

  /**
   * A click on a field's label focuses the field, as `for` would have. `for`
   * cannot reach the input inside alps-input's shadow root.
   */
  private _focusField(id: string) {
    const fields = Array.from(this.shadowRoot?.querySelectorAll<AlpsInput>('alps-input') ?? []);
    fields.find(field => field.inputId === id)?.focus();
  }

  private _handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._handleSubmit();
    }
  }

  /**
   * Guards the gap before the owner can react.
   *
   * `busy` is a property the owner sets, and it cannot be set until the owner
   * has HEARD the submit — which is at least a microtask away, and in practice
   * a render. Two clicks inside that gap both see `busy === false`. This local
   * latch closes it, and is released when the owner clears `busy` or the
   * component is torn down.
   */
  @state() private submitted: boolean = false;

  private _handleCancel() {
    if (this.busy) return;
    this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
  }

  private _handleSubmit() {
    if (this.busy || this.submitted) return;
    const refused: Record<string, string> = {};
    for (const f of this.fields) {
      const error = f.validate?.(this.values[f.id] || '', this.values);
      if (error) refused[f.id] = error;
    }
    if (Object.keys(refused).length > 0) {
      this.fieldErrors = { ...this.fieldErrors, ...refused };
      return;
    }
    this.submitted = true;
    this.dispatchEvent(new CustomEvent('submit', { 
      detail: this.values,
      bubbles: true, 
      composed: true 
    }));
  }

  updated(changed: Map<string, any>) {
    // The owner finished (or never started): let the form be used again. An
    // owner that answers with an error is finished with that submit too, even
    // one that refused it without ever setting `busy`.
    if ((changed.has('busy') && !this.busy) || changed.has('errors')) this.submitted = false;
  }

  render() {
    return html`
      <ui-modal 
        .title=${this.title}
        .isDanger=${this.isDanger}
        .dismissible=${!this.busy}
        @cancel=${this._handleCancel}>
        
        <div class="prompt-form">
          ${this.fields.map(f => html`
            <div class="field-group">
              <label class="field-label" @click=${() => this._focusField(f.id)}>${f.label}</label>
              <alps-input 
                inputId=${f.id}
                label=${f.label}
                class="field-input"
                type=${f.type || 'text'}
                placeholder=${f.placeholder || ''}
                autocomplete=${f.autocomplete || ''}
                .value=${this.values[f.id] || ''}
                ?autofocus=${f.autofocus}
                @input=${(e: Event) => this._handleInput(e, f.id)}
                @keydown=${this._handleKeyDown}
              ></alps-input>
              ${this.fieldErrors[f.id] ? html`<div class="field-error" role="alert">${this.fieldErrors[f.id]}</div>` : ''}
            </div>
          `)}
        </div>
        
        <alps-button slot="actions" variant="text" ?disabled=${this.busy} @click=${this._handleCancel}>${this.cancelText || this.i18nStore?.t('general.cancel') || 'Cancel'}</alps-button>
        <alps-button slot="actions" variant=${this.isDanger ? 'danger' : 'normal'} ?disabled=${this.busy || this.submitted} @click=${this._handleSubmit}>${this.confirmText || this.i18nStore?.t('general.save') || 'Save'}</alps-button>
      </ui-modal>
    `;
  }
}
