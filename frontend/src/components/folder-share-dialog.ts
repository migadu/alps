import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { mailboxOperations, SHARE_LEVELS, type FolderShare, type ShareLevel, type SharingRefusal } from '../services/mailbox-operations';
import { motionStyles } from '../utils/motion';
import type { AlpsInput } from './alps-input';
import './ui-modal';
import './ui-confirm';
import './alps-button';
import './alps-input';
import './alps-select';
import './alps-icon-btn';

/**
 * SHARING ONE FOLDER, over the mail server's access lists (IMAP ACL).
 *
 * Name a colleague by address, choose how much they get, see who already has
 * access and change or take it away. The levels are the server's words, not
 * rights letters: see plugins/base/sharing.go for what each gives. Who has
 * access stays the owner's to decide, so no level shares a folder on.
 *
 * WHAT THE SERVER SAYS IS WHAT IS SHOWN. A grant is never drawn before the
 * server took it: the list is read again after every change, taken or
 * refused, so a refused grant leaves no row, a level the server would not
 * change goes back to what it is, and a revoke that failed leaves the person
 * where they are.
 *
 * A list that could not be read is said to be that, not "shared with no
 * one": the owner would act on that sentence, sharing again or not taking
 * away an access that is still there.
 */
@customElement('alps-folder-share-dialog')
export class FolderShareDialog extends LitElement {
  @consume({ context: i18nContext, subscribe: true })
  @property({ attribute: false })
  i18nStore?: I18nStore;

  /** The folder, by its full name on the server. */
  @property({ type: String }) mailbox = '';
  /** The folder as the sidebar names it, for the heading. */
  @property({ type: String }) folderName = '';

  @state() private entries: FolderShare[] = [];
  @state() private loading = true;
  @state() private listFailed = false;
  @state() private address = '';
  @state() private level: ShareLevel = 'read_only';
  /** A grant is on its way. */
  @state() private busy = false;
  /** The person whose access is being changed or taken away. */
  @state() private changing: string | null = null;
  /** The person whose access waits on the confirmation to be taken away. */
  @state() private confirmingRevoke: FolderShare | null = null;
  @state() private error: string | null = null;

  @query('alps-input') private addressInput?: AlpsInput;

  static styles = [motionStyles, css`
    .intro {
      margin: 0 0 16px;
      color: var(--text-muted, #6b7280);
      font-size: 13px;
      line-height: 1.5;
    }
    .add {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: flex-end;
    }
    .add .address {
      flex: 1 1 200px;
      min-width: 0;
    }
    .add .level {
      flex: 0 1 190px;
      min-width: 0;
    }
    .field-label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary, #111827);
    }
    .error {
      margin: 10px 0 0;
      color: var(--error, #ef4444);
      font-size: 13px;
    }
    .access {
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px solid var(--border-color, #e5e7eb);
    }
    .access h4 {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted, #6b7280);
    }
    .access ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .share-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 40px;
    }
    .share-who {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      color: var(--text-primary, #111827);
    }
    .share-row alps-select {
      flex: 0 1 190px;
      min-width: 0;
    }
    .note {
      color: var(--text-muted, #6b7280);
      font-size: 13px;
      padding: 4px 0;
    }
  `];

  private t(key: string, params?: Record<string, string>): string {
    return this.i18nStore?.t(key, params) ?? key;
  }

  connectedCallback() {
    super.connectedCallback();
    void this.load();
  }

  firstUpdated() {
    // After the native dialog underneath has opened and can take the focus,
    // as ui-prompt focuses its field.
    setTimeout(() => this.addressInput?.focus(), 50);
  }

  /** Reads who has access, as the server has it now. */
  private async load() {
    const read = await mailboxOperations.readSharing(this.mailbox);
    this.loading = false;
    if (read.ok) {
      this.entries = read.entries;
      this.listFailed = false;
    } else {
      this.listFailed = true;
      if (read.reason !== 'auth' && read.reason !== 'failed') this.error = this.describe(read.reason);
    }
  }

  private levels(): { value: ShareLevel; label: string }[] {
    return SHARE_LEVELS.map(value => ({ value, label: this.levelLabel(value) }));
  }

  private levelLabel(level: ShareLevel | ''): string {
    switch (level) {
      case 'read_only': return this.t('folderShare.levelRead');
      case 'read_write': return this.t('folderShare.levelOrganise');
      case 'full': return this.t('folderShare.levelFull');
      default: return this.t('folderShare.levelCustom');
    }
  }

  /** Every refusal the server can answer, in the user's words. */
  private describe(reason: SharingRefusal): string {
    switch (reason) {
      case 'invalid_identifier': return this.t('folderShare.errorInvalidAddress');
      case 'self': return this.t('folderShare.errorSelf');
      case 'unknown_identifier': return this.t('folderShare.errorUnknown');
      case 'not_found': return this.t('folderShare.errorGone');
      case 'forbidden': return this.t('folderShare.errorForbidden');
      case 'refused':
      case 'invalid_level': return this.t('folderShare.errorRefused');
      default: return this.t('folderShare.errorGeneric');
    }
  }

  private close() {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  /**
   * Gives the address in the field the level beside it.
   *
   * An address already on the list, whatever its case, is that person: their
   * level is changed, under the identifier the server keeps for them, rather
   * than a second entry made beside it.
   */
  private async grant() {
    const typed = this.address.trim();
    if (!typed || this.busy) return;
    // One address, whole: a name, a second address or a word like "anyone"
    // is no one person to share with, and the server would only refuse it.
    if (!/^[^\s@,;<>]+@[^\s@,;<>]+$/.test(typed)) {
      this.error = this.t('folderShare.errorInvalidAddress');
      return;
    }
    const identifier = this.entries.find(e => e.identifier.toLowerCase() === typed.toLowerCase())?.identifier ?? typed;
    // As the form stood when Share was pressed: the level stays live while
    // the request is out.
    const level = this.level;
    this.busy = true;
    this.error = null;
    try {
      const outcome = await mailboxOperations.shareMailbox(this.mailbox, identifier, level);
      if (outcome.ok) {
        this.address = '';
      } else if (outcome.reason !== 'auth') {
        this.error = this.describe(outcome.reason);
      }
      await this.load();
    } finally {
      this.busy = false;
    }
  }

  private async changeLevel(entry: FolderShare, level: ShareLevel) {
    if (level === entry.level || this.changing) return;
    this.changing = entry.identifier;
    this.error = null;
    try {
      const outcome = await mailboxOperations.shareMailbox(this.mailbox, entry.identifier, level);
      if (!outcome.ok && outcome.reason !== 'auth') this.error = this.describe(outcome.reason);
      await this.load();
    } finally {
      this.changing = null;
    }
  }

  private async revoke(entry: FolderShare) {
    this.changing = entry.identifier;
    this.error = null;
    try {
      const outcome = await mailboxOperations.unshareMailbox(this.mailbox, entry.identifier);
      if (!outcome.ok && outcome.reason !== 'auth') this.error = this.describe(outcome.reason);
      await this.load();
    } finally {
      this.changing = null;
      // The row and its button are gone: the focus goes back to the form
      // rather than to the page behind the dialog.
      await this.updateComplete;
      this.addressInput?.focus();
    }
  }

  private renderEntries() {
    if (this.loading) return html`<div class="note" role="status">${this.t('folderShare.loading')}</div>`;
    if (this.listFailed && this.entries.length === 0) {
      return html`<div class="note error" role="alert">${this.t('folderShare.listFailed')}</div>`;
    }
    if (this.entries.length === 0) return html`<div class="note">${this.t('folderShare.noneYet')}</div>`;
    return html`
      <ul>
        ${this.entries.map(entry => {
          // A level another client gave is shown as what it is, and stays
          // until one of these is chosen in its place.
          const options = entry.level === ''
            ? [{ value: '', label: this.levelLabel(''), disabled: true }, ...this.levels()]
            : this.levels();
          return html`
            <li class="share-row">
              <div class="share-who" title=${entry.identifier}><bdi dir="ltr">${entry.identifier}</bdi></div>
              <alps-select
                label=${this.t('folderShare.levelFor', { who: entry.identifier })}
                .value=${live(entry.level)}
                .options=${options}
                ?disabled=${this.changing !== null}
                @change=${(e: Event) => this.changeLevel(entry, (e.target as HTMLSelectElement).value as ShareLevel)}
              ></alps-select>
              <alps-icon-btn
                class="revoke"
                icon="trash"
                title=${this.t('folderShare.revokeFor', { who: entry.identifier })}
                ?disabled=${this.changing !== null}
                @click=${() => { this.confirmingRevoke = entry; }}
              ></alps-icon-btn>
            </li>
          `;
        })}
      </ul>
    `;
  }

  render() {
    return html`
      <ui-modal
        .heading=${this.t('folderShare.title', { folder: this.folderName || this.mailbox })}
        .dismissible=${!this.busy}
        width="520px"
        @cancel=${() => this.close()}
      >
        <p class="intro">${this.t('folderShare.intro')}</p>
        <div class="add">
          <div class="address">
            <label class="field-label" for="share-address">${this.t('folderShare.address')}</label>
            <alps-input
              id="share-address"
              type="email"
              input-dir="ltr"
              autocomplete="email"
              label=${this.t('folderShare.address')}
              .value=${this.address}
              @input=${(e: Event) => { this.address = (e.target as HTMLInputElement).value; this.error = null; }}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                void this.grant();
              }}
            ></alps-input>
          </div>
          <div class="level">
            <label class="field-label" for="share-level">${this.t('folderShare.level')}</label>
            <alps-select
              id="share-level"
              label=${this.t('folderShare.level')}
              .value=${this.level}
              .options=${this.levels()}
              @change=${(e: Event) => { this.level = (e.target as HTMLSelectElement).value as ShareLevel; }}
            ></alps-select>
          </div>
          <alps-button
            class="grant"
            variant="primary"
            ?disabled=${this.busy || this.address.trim() === ''}
            ?spinning=${this.busy}
            @click=${() => this.grant()}
          >${this.t('folderShare.grant')}</alps-button>
        </div>
        ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : nothing}

        <section class="access" aria-labelledby="access-heading">
          <h4 id="access-heading">${this.t('folderShare.currentAccess')}</h4>
          ${this.renderEntries()}
        </section>

        <alps-button slot="actions" variant="normal" ?disabled=${this.busy} @click=${() => this.close()}>${this.t('folderShare.done')}</alps-button>
      </ui-modal>

      ${this.confirmingRevoke ? html`
        <ui-confirm
          heading=${this.t('folderShare.revokeTitle')}
          message=${this.t('folderShare.revokeMessage', { who: this.confirmingRevoke.identifier, folder: this.folderName || this.mailbox })}
          confirmText=${this.t('folderShare.revoke')}
          .isDanger=${true}
          @confirm=${() => {
            const entry = this.confirmingRevoke!;
            this.confirmingRevoke = null;
            void this.revoke(entry);
          }}
          @cancel=${() => { this.confirmingRevoke = null; }}
        ></ui-confirm>
      ` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'alps-folder-share-dialog': FolderShareDialog;
  }
}
