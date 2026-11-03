import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { ownAddress, settingsContext, SettingsStore } from '../store/settings-store';
import {
  identityAddress, identityProblem, MAX_IDENTITIES, MAX_IDENTITY_NAME, type Identity, type IdentityProblem,
} from '../utils/identities';
import { isolatedMailbox } from '../utils/bidi';
import type { UnsavedChanges } from './settings-window';
import './alps-setting-group';
import './alps-icon-btn';
import './alps-input';
import './alps-button';

/** Which entry the form edits: its place in the list, or a new one. */
type Editing = number | 'new';

/**
 * Settings › Identity › Sending addresses: the other addresses the user sends
 * from, which the composer's From menu offers beside the account's own.
 *
 * The list applies as it changes, as every setting in the window does: an
 * entry is added, changed or removed as its Save or its Remove is pressed.
 * Only what is typed in the form, before its Save, is unsaved, and the window
 * asks before a Close or another section takes that away (UnsavedChanges).
 *
 * What the form takes is what the server takes (checkIdentities): one bare
 * address, its domain written in A-label form, not the account's own address
 * and not one already in the list, and no more than twenty in all. A setting
 * the server refused would stay on screen here, saved nowhere.
 */
@customElement('alps-identities-settings')
export class AlpsIdentitiesSettings extends LitElement implements UnsavedChanges {
  @consume({ context: settingsContext, subscribe: true })
  settingsStore!: SettingsStore;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @state() private editing: Editing | null = null;
  @state() private draftName = '';
  @state() private draftAddress = '';
  @state() private problem: IdentityProblem | null = null;

  static styles = css`
    :host {
      display: block;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .identity {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-block: 6px;
      padding-inline: 12px 6px;
      background: var(--bg-secondary);
      border-radius: 8px;
    }

    .sender {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
      color: var(--text-primary);
    }

    .identity-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .problem {
      color: var(--danger-color, #dc2626);
      font-size: 13px;
    }

    .note {
      font-size: 13px;
      color: var(--text-muted);
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .add {
      align-self: flex-start;
    }
  `;

  private _handleI18nChange = () => this.requestUpdate();
  private _handleSettingsChange = () => this.requestUpdate();

  connectedCallback() {
    super.connectedCallback();
    this.i18nStore?.addEventListener('change', this._handleI18nChange);
    this.settingsStore?.addEventListener('change', this._handleSettingsChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);
    this.settingsStore?.removeEventListener('change', this._handleSettingsChange);
  }

  private get identities(): Identity[] {
    return this.settingsStore?.getState().identities ?? [];
  }

  /** What the form held when it opened, to tell an edit from none. */
  private get opened(): Identity {
    return typeof this.editing === 'number' ? this.identities[this.editing] ?? { name: '', address: '' } : { name: '', address: '' };
  }

  get hasUnsavedChanges(): boolean {
    if (this.editing === null) return false;
    const opened = this.opened;
    return this.draftName.trim() !== opened.name.trim() || this.draftAddress.trim() !== opened.address;
  }

  discardUnsavedChanges() {
    this.editing = null;
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.i18nStore?.t(key, params) ?? key;
  }

  private openForm(editing: Editing) {
    const opened = typeof editing === 'number' ? this.identities[editing] : undefined;
    this.editing = editing;
    this.draftName = opened?.name ?? '';
    this.draftAddress = opened?.address ?? '';
    this.problem = null;
    void this.updateComplete.then(() => this.shadowRoot?.querySelector<HTMLElement>('.identity-form alps-input')?.focus());
  }

  /** Closes the form, and puts the focus where it was opened from. */
  private closeForm() {
    const editing = this.editing;
    this.editing = null;
    this.problem = null;
    void this.updateComplete.then(() => this.focusAfter(typeof editing === 'number' ? editing : null));
  }

  /** Focus onto the Edit button of the entry at `index`, or onto Add when
   * there is none there: the button that opened the form, or the place of
   * an entry removed. */
  private focusAfter(index: number | null) {
    const rows = [...(this.shadowRoot?.querySelectorAll<HTMLElement>('.identity') ?? [])];
    const target = index !== null && rows.length > 0
      ? rows[Math.min(index, rows.length - 1)].querySelector('alps-icon-btn.edit')
      : this.shadowRoot?.querySelector('alps-button.add');
    target?.shadowRoot?.querySelector<HTMLElement>('button')?.focus();
  }

  private saveForm(e?: Event) {
    e?.preventDefault();
    const editing = this.editing;
    if (editing === null) return;
    const others = this.identities.filter((_, i) => i !== editing);
    const problem = identityProblem(this.draftAddress, ownAddress(this.settingsStore.getState()), others);
    if (problem) {
      this.problem = problem;
      return;
    }
    const identity: Identity = {
      name: [...this.draftName.trim()].slice(0, MAX_IDENTITY_NAME).join(''),
      address: identityAddress(this.draftAddress)!,
    };
    const identities = editing === 'new'
      ? [...this.identities, identity]
      : this.identities.map((existing, i) => (i === editing ? identity : existing));
    void this.settingsStore.updateSettings({ identities });
    this.closeForm();
  }

  private removeAt(index: number) {
    if (this.editing !== null) this.editing = null;
    void this.settingsStore.updateSettings({ identities: this.identities.filter((_, i) => i !== index) });
    void this.updateComplete.then(() => this.focusAfter(this.identities.length > 0 ? index : null));
  }

  private onFormKeydown = (e: KeyboardEvent) => {
    // The form's, not the window's: Escape there closes the form and leaves
    // the window open (SettingsWindow lets a key that was handled go).
    if (e.key !== 'Escape') return;
    e.preventDefault();
    this.closeForm();
  };

  private problemText(problem: IdentityProblem): string {
    switch (problem) {
      case 'own': return this.t('settings.identity.identityOwn');
      case 'duplicate': return this.t('settings.identity.identityDuplicate');
      default: return this.t('settings.identity.identityInvalid');
    }
  }

  private renderForm() {
    const accountName = this.settingsStore?.getState().name?.trim();
    return html`
      <form class="identity-form" novalidate @submit=${this.saveForm} @keydown=${this.onFormKeydown}>
        <label class="field">
          ${this.t('settings.identity.identityName')}
          <alps-input
            type="text"
            label=${this.t('settings.identity.identityName')}
            .value=${this.draftName}
            placeholder=${accountName || this.t('settings.placeholderName')}
            @input=${(e: Event) => { this.draftName = (e.target as HTMLInputElement).value; }}
          ></alps-input>
        </label>
        <label class="field">
          ${this.t('settings.identity.identityAddress')}
          <alps-input
            type="email"
            label=${this.t('settings.identity.identityAddress')}
            autocomplete="off"
            .value=${this.draftAddress}
            @input=${(e: Event) => { this.draftAddress = (e.target as HTMLInputElement).value; this.problem = null; }}
          ></alps-input>
        </label>
        ${this.problem ? html`<div class="problem" role="alert">${this.problemText(this.problem)}</div>` : nothing}
        <div class="actions">
          <alps-button variant="primary" @click=${this.saveForm}>${this.t('general.save')}</alps-button>
          <alps-button variant="text" @click=${() => this.closeForm()}>${this.t('general.cancel')}</alps-button>
        </div>
      </form>
    `;
  }

  render() {
    const identities = this.identities;
    const accountName = this.settingsStore?.getState().name?.trim() ?? '';
    const full = identities.length >= MAX_IDENTITIES;
    return html`
      <alps-setting-group label=${this.t('settings.identity.identities')} description=${this.t('settings.identity.identitiesDesc')}>
        ${identities.length > 0 ? html`
          <ul aria-label=${this.t('settings.identity.identities')}>
            ${identities.map((identity, index) => this.editing === index ? html`<li>${this.renderForm()}</li>` : html`
              <li class="identity">
                <span class="sender">${isolatedMailbox({ name: identity.name || accountName, email: identity.address })}</span>
                <alps-icon-btn
                  class="edit"
                  ?disabled=${this.editing !== null}
                  icon="pen"
                  title=${this.t('settings.identity.editIdentity', { address: identity.address })}
                  @click=${() => this.openForm(index)}
                ></alps-icon-btn>
                <alps-icon-btn
                  class="remove"
                  ?disabled=${this.editing !== null}
                  icon="trash"
                  title=${this.t('settings.identity.removeIdentity', { address: identity.address })}
                  @click=${() => this.removeAt(index)}
                ></alps-icon-btn>
              </li>
            `)}
          </ul>
        ` : nothing}
        ${this.editing === 'new' ? this.renderForm() : html`
          <alps-button class="add" variant="normal" icon="plusBold" ?disabled=${full || this.editing !== null} @click=${() => this.openForm('new')}>
            ${this.t('settings.identity.addIdentity')}
          </alps-button>
        `}
        ${full ? html`<div class="note">${this.t('settings.identity.identitiesFull', { count: MAX_IDENTITIES })}</div>` : nothing}
      </alps-setting-group>
    `;
  }
}
