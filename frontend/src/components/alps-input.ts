import { LitElement, html, css, nothing } from 'lit';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { consume } from '@lit/context';
import { customElement, property, state } from 'lit/decorators.js';
import { renderIcon } from '../utils/ui';
import { focusOnLabelClick } from '../utils/label-focus';
import { motionStyles } from '../utils/motion';
import { isComposingKey } from '../utils/active-element';

/** Values written left to right whatever the interface language: addresses,
 * passwords, numbers, dates. */
const LTR_INPUT_TYPES = new Set([
  'password', 'email', 'url', 'number', 'tel',
  'date', 'datetime-local', 'time', 'month', 'week',
]);

@customElement('alps-input')
export class AlpsInput extends LitElement {
  // Consumed rather than passed in, as alps-pagination does: this primitive is
  // used from many places, and its own labels were English in every locale.
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  private _handleI18nChange = () => this.requestUpdate();

  @property({ type: String }) type = 'text';
  /** The direction of the VALUE; the icon and the action button follow the
   * interface. Empty means left to right for the types above and the text's
   * own direction otherwise. */
  @property({ type: String, attribute: 'input-dir' }) inputDir: 'auto' | 'ltr' | 'rtl' | '' = '';
  @property({ type: String }) value = '';
  @property({ type: String }) placeholder = '';
  @property({ type: Boolean }) required = false;
  @property({ type: String }) autocomplete = '';
  @property({ type: String }) inputId = '';
  /**
   * The field's accessible name, given to the input as its aria-label.
   *
   * A `<label for>` outside this element cannot name the input: `for` looks
   * for the id in the label's own tree, and the input is in this shadow root.
   * So a form passes the text of its label here as well.
   */
  @property({ type: String }) label = '';
  @property({ type: String }) icon = '';
  @property({ type: Boolean }) clearable = false;
  @property({ type: Boolean }) autofocus = false;

  @state() private showPassword = false;

  static styles = [motionStyles, css`
    :host {
      display: block;
      width: 100%;
      position: relative;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      --input-leading-space: 12px;
      --input-trailing-space: 12px;
    }

    input {
      width: 100%;
      height: 36px;
      padding-block: 0;
      padding-left: var(--input-leading-space);
      padding-right: var(--input-trailing-space);
      background: var(--alps-input-bg, var(--bg-primary, #ffffff));
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--input-radius, 6px);
      color: var(--text-primary, #111827);
      font-family: var(--font-base, 'Inter', sans-serif);
      font-size: var(--input-font-size, 14px);
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }

    /* Room for the icon and the action button, on the sides the INTERFACE
       puts them. Taken from the host's direction, not the input's: the input
       carries its value's direction, and logical padding there would put an
       address's room on the wrong side of a right-to-left field. */
    :host(:dir(rtl)) input {
      padding-left: var(--input-trailing-space);
      padding-right: var(--input-leading-space);
    }

    .has-left-icon { --input-leading-space: 36px; }
    .has-right-icon { --input-trailing-space: 36px; }

    /* An empty left-to-right field still shows the interface's placeholder,
       on the interface's side. */
    :host(:dir(rtl)) input[dir='ltr']:placeholder-shown {
      text-align: right;
    }

    /* The transparent outline paints nothing here; forced colors, which drop
       the border colour and the shadow, give it a system colour. */
    input:focus {
      border-color: var(--accent-color, #005A9E);
      box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
      outline: 2px solid transparent;
    }

    input::placeholder {
      color: var(--text-muted, #9ca3af);
    }

    .icon-left {
      position: absolute;
      inset-inline-start: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      color: var(--text-muted, #9ca3af);
      pointer-events: none;
    }

    .icon-left svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .action-btn {
      position: absolute;
      inset-inline-end: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      color: var(--text-muted, #9ca3af);
      cursor: pointer;
      background: transparent;
      border: none;
      padding: 0;
      border-radius: 4px;
      transition: color 0.2s ease, background 0.2s ease;
      outline: none;
    }

    .action-btn:focus-visible {
      outline: 2px solid var(--accent-color, #005A9E);
      outline-offset: 2px;
    }

    .action-btn:hover {
      color: var(--text-primary, #111827);
      background: var(--bg-tertiary, #f3f4f6);
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
  `];

  /** The inner input's own `input` is composed, and reaches whoever listens
   * on this element after the value is taken here: one for each key, so none
   * is sent of its own. */
  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
  }

  /** `change` when the value is committed, as a native input says it: what
   * saves on `change` (the settings' display name and Reply-To) must not save
   * every keystroke. The inner input's own is not composed, and stops at the
   * shadow root. */
  private handleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  private togglePassword() {
    this.showPassword = !this.showPassword;
  }

  private handleClear() {
    this.value = '';
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('clear', { bubbles: true, composed: true }));
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !isComposingKey(e)) {
      const form = this.closest('form');
      if (form) {
        e.preventDefault();
        form.requestSubmit();
      }
    }
  }

  public checkValidity(): boolean {
    const input = this.shadowRoot?.querySelector('input');
    return input ? input.checkValidity() : true;
  }

  public reportValidity(): boolean {
    const input = this.shadowRoot?.querySelector('input');
    return input ? input.reportValidity() : true;
  }

  public focus() {
    const input = this.shadowRoot?.querySelector('input');
    if (input) input.focus();
  }

  /** Stops the watch for a click on this field's label (see focusOnLabelClick). */
  private stopLabelWatch: (() => void) | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.i18nStore?.addEventListener('change', this._handleI18nChange);
    this.stopLabelWatch = focusOnLabelClick(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);
    this.stopLabelWatch?.();
    this.stopLabelWatch = null;
  }

  render() {
    const isPasswordType = this.type === 'password';
    const currentType = isPasswordType && this.showPassword ? 'text' : this.type;
    const effectiveIcon = this.icon || (this.type === 'email' ? 'at' : '');
    const inputDir = this.inputDir || (LTR_INPUT_TYPES.has(this.type) ? 'ltr' : 'auto');

    return html`
      <div class="input-wrapper ${effectiveIcon ? 'has-left-icon' : ''} ${(isPasswordType || this.clearable) && this.value ? 'has-right-icon' : ''}">
        ${effectiveIcon ? html`
          <span class="icon-left">
            ${renderIcon(effectiveIcon)}
          </span>
        ` : ''}

        <input 
          id=${this.inputId || ''}
          type=${currentType} 
          dir=${inputDir}
          .value=${this.value}
          placeholder=${this.placeholder}
          aria-label=${this.label || nothing}
          ?required=${this.required}
          ?autofocus=${this.autofocus}
          autocomplete=${this.autocomplete}
          @input=${this.handleInput}
          @change=${this.handleChange}
          @keydown=${this.handleKeyDown}
        />

        ${isPasswordType && this.value ? html`
          <button 
            type="button" 
            class="action-btn" 
            @click=${this.togglePassword}
            title=${this.showPassword ? (this.i18nStore?.t('general.hidePassword') || 'Hide password') : (this.i18nStore?.t('general.showPassword') || 'Show password')}
            tabindex="-1"
          >
            ${renderIcon(this.showPassword ? 'eyeSlash' : 'eye')}
          </button>
        ` : this.clearable && this.value ? html`
          <button 
            type="button" 
            class="action-btn" 
            @click=${this.handleClear}
            title=${this.i18nStore?.t('general.clear') || 'Clear'}
            tabindex="-1"
          >
            ${renderIcon('x')}
          </button>
        ` : ''}
      </div>
    `;
  }
}
