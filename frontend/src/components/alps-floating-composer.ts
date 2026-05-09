import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { composeContext } from '../store/compose-store';
import type { ComposerInstance, ComposeStore } from '../store/compose-store';
import { handleAttachClick, abortUpload, deleteAttachment } from '../utils/attachment-utils';
import { messageOperations } from '../services/message-operations';
import { messageSync } from '../services/message-sync';
import './alps-address-input.js';
import './alps-message-composer.js';
import './alps-button.js';
import './alps-attachment-list';
import './alps-loader';
import './alps-input.js';
import './ui-confirm.js';
import './alps-popup.js';
import { AlpsPopup } from './alps-popup.js';
import './alps-attachment-list.js';
import './alps-emoji-selector-popup.js';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { settingsContext, SettingsStore } from '../store/settings-store';
const UNDO_TOAST_TIMEOUT_MS = 10000;

@customElement('alps-floating-composer')
export class AlpsFloatingComposer extends LitElement {
  @consume({ context: composeContext })
  composeStore!: ComposeStore;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @property({ type: Object }) instance!: ComposerInstance;
  @property({ type: Number }) index: number = 0;
  @property({ type: Number }) totalOpen: number = 1;
  @property({ type: Number }) totalMinimized: number = 0;
  @property({ type: Number }) openIndex: number = 0;
  @property({ type: Number }) minimizedIndex: number = 0;

  @state() private showCc = false;
  @state() private showBcc = false;
  @state() private showDiscardConfirm = false;
  @state() private pendingDiscardType: 'close' | 'delete' | null = null;
  @state() private windowWidth = window.innerWidth;
  @state() private windowHeight = window.innerHeight;
  @state() private isSaving = false;

  private autoSaveTimer: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this._handleResize);
    if ((this.instance.cc && this.instance.cc.length > 0)) this.showCc = true;
    if ((this.instance.bcc && this.instance.bcc.length > 0)) this.showBcc = true;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._handleResize);
    this._clearAutoSave();
  }

  firstUpdated() {
    setTimeout(() => {
      if (this.composer && (this.composer as any).focusEditor) {
        (this.composer as any).focusEditor();
      }
    }, 100);
  }

  private _clearAutoSave() {
    if (this.autoSaveTimer !== null) {
      window.clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('instance') && this.instance.dirty && !this.instance.isSending) {
      this._scheduleAutoSave();
    }
  }

  private _scheduleAutoSave() {
    this._clearAutoSave();
    this.autoSaveTimer = window.setTimeout(() => {
      this._saveDraft();
    }, 3000); // 3 seconds auto-save
  }

  private async _saveDraft() {
    const currentInstance = this.composeStore.getComposer(this.instance.id) || this.instance;
    if (currentInstance.isSending || this.isSaving) return;

    // Check if we have anything to save
    const hasRecipient = (currentInstance.to?.length || 0) > 0 || (currentInstance.cc?.length || 0) > 0 || (currentInstance.bcc?.length || 0) > 0;
    const hasAttachments = (currentInstance.attachments && currentInstance.attachments.length > 0);
    const textIsJustInitial = currentInstance.text?.trim() === currentInstance.initialText?.trim();
    const hasContent = !textIsJustInitial || (currentInstance.subject?.trim().length || 0) > 0 || hasAttachments;
    if (!hasRecipient && !hasContent) {
      return;
    }

    this.isSaving = true;
    try {
      const sentUuids = (currentInstance.attachments || []).map(a => a.uuid).filter(Boolean);
      const formData = this._buildFormData(currentInstance);
      formData.append('save_as_draft', '1');

      const result = await messageOperations.saveDraft(formData);

      if (result) {
        const oldUid = this.instance.draftUid;
        // Optimistically update the UI before checking isConnected so Drafts folder updates instantly
        window.dispatchEvent(new CustomEvent('draft-autosaved', {
          detail: {
            oldUid,
            newUid: result.uid,
            mailbox: result.mailbox,
            subject: this.instance.subject,
            to: this.instance.to,
            cc: this.instance.cc,
            bcc: this.instance.bcc,
            size: result.size,
            hasAttachments: (this.instance.attachments && this.instance.attachments.length > 0)
          }
        }));
      }

      if (!this.isConnected) {
        return;
      }

      if (result) {
        // Mark as clean and update draft properties silently without triggering another auto-save
        const updates: any = {
          dirty: false,
          draftUid: result.uid,
          draftMailbox: result.mailbox
        };
        if (result.attachments) {
          const unsavedAttachments = (currentInstance.attachments || []).filter(a => {
            if (a._tempId) return true; // Still uploading
            if (a.uuid && !sentUuids.includes(a.uuid)) return true; // Uploaded but not included in this save
            return false;
          });
          updates.attachments = [...result.attachments, ...unsavedAttachments];
        }
        this.composeStore.updateComposer(this.instance.id, updates);

        // If the composer became dirty while saving, or new attachments were added, schedule another save
        const latestComposer = this.composeStore.getComposer(this.instance.id);
        const hasUnsavedAttachments = (latestComposer?.attachments || []).some(a => a.uuid && !sentUuids.includes(a.uuid));
        if (latestComposer?.dirty || hasUnsavedAttachments) {
          this._scheduleAutoSave();
        }
      }
    } finally {
      this.isSaving = false;
    }
  }

  private _buildFormData(currentInstance: ComposerInstance): FormData {
    const formData = new FormData();
    const to = currentInstance.to || [];
    const cc = currentInstance.cc || [];
    let bcc = [...(currentInstance.bcc || [])];
    
    let replyToSetting = '';
    try {
      const storedSettings = localStorage.getItem('alps_settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (parsed.bccMyself && parsed.loginUsername) {
          if (!bcc.includes(parsed.loginUsername)) {
            bcc.push(parsed.loginUsername);
          }
        }
        if (parsed.replyTo) {
          replyToSetting = parsed.replyTo;
        }
      }
    } catch (e) {}

    const text = currentInstance.text || '';
    const subject = (currentInstance.subject || '').trim();

    formData.append('to', to.join(', '));
    formData.append('cc', cc.join(', '));
    formData.append('bcc', bcc.join(', '));
    
    if (replyToSetting) {
      formData.append('reply_to', replyToSetting);
    }
    formData.append('subject', subject);
    formData.append('text', text);
    if (currentInstance.format === 'html' && currentInstance.html) {
      formData.append('html', currentInstance.html);
    }

    const attachments = currentInstance.attachments || [];
    const uuids = attachments.map(a => a.uuid).filter(Boolean).join(',');
    if (uuids) {
      formData.append('attachment-uuids', uuids);
    }
    const prev = attachments.map(a => a.partPath).filter(Boolean).join(',');
    if (prev) {
      formData.append('prev_attachments', prev);
    }

    if (currentInstance.draftMailbox) {
      formData.append('draft_mailbox', currentInstance.draftMailbox);
    }
    if (currentInstance.draftUid) {
      formData.append('draft_uid', currentInstance.draftUid);
    }
    if (currentInstance.inReplyTo) {
      formData.append('in_reply_to', currentInstance.inReplyTo);
    }

    return formData;
  }

  private _handleResize = () => {
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;
  };

  private get composer(): any {
    return this.shadowRoot!.querySelector('alps-message-composer');
  }

  private _toggleMinimize() {
    this.composeStore.updateComposer(this.instance.id, {
      minimized: !this.instance.minimized,
      expanded: false
    });
  }

  private _wasActiveOnMousedown = false;

  private _handleHeaderClick() {
    this.composeStore.bringComposerToFront(this.instance.id);
    if (this.instance.minimized) {
      this.composeStore.updateComposer(this.instance.id, { minimized: false });
      setTimeout(() => {
        if (this.composer && (this.composer as any).focusEditor) {
          (this.composer as any).focusEditor();
        }
      }, 100);
    } else if (!this._wasActiveOnMousedown) {
      setTimeout(() => {
        if (this.composer && (this.composer as any).focusEditor) {
          (this.composer as any).focusEditor();
        }
      }, 100);
    }
  }

  private _toggleExpand() {
    this.composeStore.updateComposer(this.instance.id, {
      expanded: !this.instance.expanded,
      minimized: false
    });
  }

  private _handleCloseClick() {
    const hasUploading = (this.instance.attachments || []).some(a => a.uploading);
    if (hasUploading) {
      this.composeStore.updateComposer(this.instance.id, { closing: true } as any);
      return;
    }

    if (this.instance.dirty) {
      this._saveDraft();
    }
    this.composeStore.closeComposer(this.instance.id);
  }

  private _handleDiscardClick() {
    this._clearAutoSave();

    const isSaved = !!this.instance.draftUid;
    const isDirty = this.instance.dirty;

    const hasRecipient = (this.instance.to?.length || 0) > 0 || (this.instance.cc?.length || 0) > 0 || (this.instance.bcc?.length || 0) > 0;
    const hasAttachments = (this.instance.attachments && this.instance.attachments.length > 0);
    const textIsJustInitial = this.instance.text?.trim() === this.instance.initialText?.trim();
    const hasContent = !textIsJustInitial || (this.instance.subject?.trim().length || 0) > 0 || hasAttachments;
    const isBlank = !hasRecipient && !hasContent;

    // The only condition under which we do not ask for confirmation is if 
    // the message is completely blank and not saved.
    if (!isBlank || isSaved || isDirty) {
      this.pendingDiscardType = 'delete';
      this.showDiscardConfirm = true;
    } else {
      this._performDiscard('delete');
    }
  }

  private async _confirmDiscard() {
    this.showDiscardConfirm = false;
    const type = this.pendingDiscardType;
    this.pendingDiscardType = null;
    this._performDiscard(type);
  }

  private async _performDiscard(type: 'close' | 'delete' | null) {
    if (type === 'delete' && this.instance.draftUid && this.instance.draftMailbox) {
      try {
        await messageOperations.deleteMessages(this.instance.draftMailbox, [String(this.instance.draftUid)]);
      } catch (e) {
        console.error('Failed to delete draft', e);
      }
    }

    if (this.instance.attachments) {
      for (const att of this.instance.attachments) {
        if (att._tempId) abortUpload(att._tempId);
        else if (att.uuid) deleteAttachment(att.uuid);
      }
    }

    this.composeStore.closeComposer(this.instance.id);
  }

  private _cancelDiscard() {
    this.showDiscardConfirm = false;
    this.pendingDiscardType = null;
    if (this.instance.dirty) {
      this._scheduleAutoSave();
    }
  }

  private _bringToFront() {
    const composers = this.composeStore.getState().activeComposers;
    let maxZ = 1000;
    composers.forEach(c => {
      if (c.zIndex && c.zIndex > maxZ) maxZ = c.zIndex;
    });
    this._wasActiveOnMousedown = (this.instance.zIndex || 0) >= maxZ;

    this.composeStore.bringComposerToFront(this.instance.id);
  }

  @state() private linkPromptFields: any[] = [];

  private _handleLinkClick() {
    if (!this.composer) return;

    // Explicitly restore focus to the editor so the selection doesn't visually disappear,
    // mirroring how formatting buttons (like Bold) work.
    if ((this.composer as any).focusEditor) {
      (this.composer as any).focusEditor();
    }

    const hasSelection = this.composer.hasSelection();
    const activeLink = this.composer.getActiveLink ? this.composer.getActiveLink() : null;

    if (activeLink) {
      this.linkPromptFields = [
        { id: 'url', label: 'Link URL', placeholder: 'https://example.com', value: activeLink }
      ];
    } else {
      const selectedText = hasSelection && (this.composer as any).getSelectionText ? (this.composer as any).getSelectionText() : '';
      this.linkPromptFields = [
        { id: 'text', label: 'Display Text', placeholder: 'My Website', value: selectedText },
        { id: 'url', label: 'Link URL', placeholder: 'https://example.com' }
      ];
    }

    // reset values to match fields
    setTimeout(() => {
      const inputs = this.shadowRoot?.querySelectorAll('#linkPopup input') as NodeListOf<HTMLInputElement>;
      inputs.forEach(input => {
        const field = this.linkPromptFields.find(f => f.id === input.id);
        input.value = field?.value || '';
      });
      // Do not auto-focus the input, allowing the editor to potentially keep its visual selection
    }, 50);
  }

  private _handleLinkSubmit() {
    const popup = this.shadowRoot?.querySelector('#linkPopup') as AlpsPopup;
    if (popup) popup.close();

    if (!this.composer) return;

    const inputs = this.shadowRoot?.querySelectorAll('#linkPopup input') as NodeListOf<HTMLInputElement>;
    const values: Record<string, string> = {};
    inputs.forEach(input => values[input.id] = input.value);

    const { text, url } = values;
    if (!url) return;

    if (this.instance.format === 'html' && (this.composer as any).editor) {
      const editor = (this.composer as any).editor;
      if (text) {
        editor.chain().focus()
          .insertContent(`<a href="${url}">${text}</a>`)
          .command(({ tr, dispatch }: any) => {
            if (dispatch) {
              if (editor.schema.marks.link) {
                tr.removeStoredMark(editor.schema.marks.link);
              }
            }
            return true;
          })
          .run();
      } else {
        const endPos = editor.state.selection.to;
        editor.chain().focus()
          .setLink({ href: url })
          .setTextSelection(endPos)
          .command(({ tr, dispatch }: any) => {
            if (dispatch) {
              if (editor.schema.marks.link) {
                tr.removeStoredMark(editor.schema.marks.link);
              }
            }
            return true;
          })
          .run();
      }
    } else {
      // Plain text mode
      if (text) {
        this.composer.insertFormatting('', `[${text}](${url})`);
      } else {
        this.composer.insertFormatting('[', `](${url})`);
      }
    }
  }



  private async _handleSend() {
    const hasUploading = (this.instance.attachments || []).some(a => a.uploading);
    if (hasUploading) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: this.i18nStore?.t('composer.attachmentsWait'),
          duration: 3000
        }
      }));
      return;
    }

    const text = this.instance.text || '';
    const to = this.instance.to || [];
    const cc = this.instance.cc || [];
    const bcc = this.instance.bcc || [];
    const allTo = [...to, ...cc, ...bcc];
    const subject = (this.instance.subject || '').trim();

    if (!text || allTo.length === 0 || !subject) return;

    this._clearAutoSave();
    this.composeStore.updateComposer(this.instance.id, { isSending: true, minimized: true });

    try {
      let undoFn: (() => void) | undefined;
      const sendPromise = new Promise<boolean>((resolve) => {
        let timeoutId = window.setTimeout(() => {
          resolve(true);
        }, UNDO_TOAST_TIMEOUT_MS);

        undoFn = () => {
          window.clearTimeout(timeoutId);
          resolve(false);
        };
      });

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: this.i18nStore?.t('composer.sending'),
          actionLabel: this.i18nStore?.t('composer.undo'),
          actionFn: () => {
            if (undoFn) undoFn();
          },
          duration: UNDO_TOAST_TIMEOUT_MS
        }
      }));

      const shouldSend = await sendPromise;
      if (!shouldSend) {
        this.composeStore.updateComposer(this.instance.id, { isSending: false, minimized: false });
        this.composeStore.bringComposerToFront(this.instance.id);
        return;
      }

      const currentInstance = this.composeStore.getComposer(this.instance.id) || this.instance;
      const formData = this._buildFormData(currentInstance);
      await messageOperations.sendDraft(formData);

      if (currentInstance.draftMailbox) {
        messageSync.fetch(currentInstance.draftMailbox, 0, '', false);
      }

      this.composeStore.closeComposer(this.instance.id);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      // Bring back the composer window if it was minimized or hidden
      this.composeStore.updateComposer(this.instance.id, { isSending: false, minimized: false, expanded: false });
      this._bringToFront();
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: this.i18nStore?.t('composer.sendError')?.replace('{error}', err.message),
          duration: 5000
        }
      }));
    }
  }

  private _toggleFormat() {
    const newFormat = (this.instance.format || 'html') === 'html' ? 'text' : 'html';
    this.composeStore.updateComposer(this.instance.id, { format: newFormat });

    // Wait for the render cycle to complete and the new format to be applied
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (this.composer && (this.composer as any).focusEditor) {
          (this.composer as any).focusEditor();
        }
      }, 0);
    });
  }

  private _handleAttachClick() {
    const maxBytes = (this.settingsStore?.getState()?.maxAttachmentMiB || 32) * 1024 * 1024;
    const currentBytes = (this.instance.attachments || []).reduce((sum, a) => sum + (a.size || 0), 0);

    handleAttachClick(
      this.instance.id,
      maxBytes,
      currentBytes,
      (tempId, file) => {
        // onFileAdded
        const composer = this.composeStore.getComposer(this.instance.id);
        const currentAttachments = composer?.attachments || [];
        const newAttachment = {
          _tempId: tempId,
          filename: file.name,
          size: file.size,
          uploading: true,
          progress: 0
        };
        const attachments = [...currentAttachments, newAttachment];
        this.composeStore.updateComposer(this.instance.id, { attachments });
      },
      (tempId, progress) => {
        // onProgress
        const composer = this.composeStore.getComposer(this.instance.id);
        const currentAttachments = composer?.attachments || [];
        const attachments = [...currentAttachments];
        const idx = attachments.findIndex(a => a._tempId === tempId);
        if (idx !== -1) {
          attachments[idx] = { ...attachments[idx], progress };
          this.composeStore.updateComposer(this.instance.id, { attachments });
        }
      },
      (tempId, uuids) => {
        // onComplete
        const composer = this.composeStore.getComposer(this.instance.id);
        const currentAttachments = composer?.attachments || [];
        const attachments = [...currentAttachments];
        const idx = attachments.findIndex(a => a._tempId === tempId);
        if (idx !== -1) {
          const newAtt = { ...attachments[idx], uuid: uuids[0] };
          delete newAtt.uploading;
          delete newAtt.progress;
          delete newAtt._tempId;
          attachments[idx] = newAtt;
          this.composeStore.updateComposer(this.instance.id, { attachments });

          const latestComposer = this.composeStore.getComposer(this.instance.id);
          const stillUploading = (latestComposer?.attachments || []).some(a => a.uploading);
          if (latestComposer?.closing && !stillUploading) {
            this._saveDraft().then(() => {
              this.composeStore.closeComposer(this.instance.id);
            });
          } else {
            this._saveDraft();
          }
        }
      },
      (tempId, err) => {
        // onError
        console.error('Failed to upload attachment:', err);
        const composer = this.composeStore.getComposer(this.instance.id);
        const currentAttachments = composer?.attachments || [];
        const attachments = [...currentAttachments];
        const idx = attachments.findIndex(a => a._tempId === tempId);
        if (idx !== -1) {
          attachments.splice(idx, 1);
          this.composeStore.updateComposer(this.instance.id, { attachments });
        }

        const latestComposer = this.composeStore.getComposer(this.instance.id);
        const stillUploading = (latestComposer?.attachments || []).some(a => a.uploading);
        if (latestComposer?.closing && !stillUploading) {
          this._saveDraft().then(() => {
            this.composeStore.closeComposer(this.instance.id);
          });
        } else if (!latestComposer?.closing) {
          alert('Failed to upload attachment: ' + (err.message || 'Unknown error'));
        }
      }
    );
  }

  private _removeAttachment(index: number) {
    const attachments = [...(this.instance.attachments || [])];
    const removed = attachments.splice(index, 1)[0];
    if (removed?._tempId) {
      abortUpload(removed._tempId);
    } else if (removed?.uuid) {
      deleteAttachment(removed.uuid);
    }
    this.composeStore.updateComposer(this.instance.id, { attachments });
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      position: fixed;
      transition: top 0.3s cubic-bezier(0.2, 0, 0, 1), left 0.3s cubic-bezier(0.2, 0, 0, 1), right 0.3s cubic-bezier(0.2, 0, 0, 1), bottom 0.3s cubic-bezier(0.2, 0, 0, 1), width 0.3s cubic-bezier(0.2, 0, 0, 1), height 0.3s cubic-bezier(0.2, 0, 0, 1);
    }

    ui-confirm, alps-popup {
      position: relative;
      z-index: 100;
    }
    
    .popup-form {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 240px;
      text-align: left;
    }
    .popup-form .field-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .popup-form label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
    }
    .popup-form input {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 8px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-family: inherit;
      font-size: 13px;
    }
    .popup-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }

    .window-frame {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: var(--bg-primary);
      border-radius: 8px 8px 0 0;      
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      border: 1px solid var(--border-color);
      overflow: hidden;
      position: relative;
      z-index: 1;
    }

    :host([expanded]) .window-frame,
    :host([minimized]) .window-frame {
      border-radius: 8px;
    }

    .sending-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
    }

    .spinner {
      display: inline-flex;
      width: 32px;
      height: 32px;
      animation: spin 1s linear infinite;
      color: var(--accent-color, #005A9E);
    }

    .spinner svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .backdrop {
      display: block;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--modal-backdrop, rgba(255, 255, 255, 0.8));
      z-index: 0;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    :host([expanded]) .backdrop {
      opacity: 1;
      pointer-events: auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 6px 6px 10px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      color: var(--text-color);
      cursor: pointer;
      user-select: none;
    }

    .header-title {
      font-weight: 500;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .header-actions {
      display: flex;
      gap: 4px;
    }

    .content {
      display: flex;
      flex-direction: column;
      flex: 1;
      background: var(--bg-primary);
      min-height: 0;
    }

    :host([minimized]) .content {
      display: none;
    }

    .field-row {
      display: flex;
      align-items: center;
      padding: 4px 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .field-label {
      color: var(--text-muted);
      font-size: 14px;
      width: 40px;
    }

    .cc-bcc-toggles {
      display: flex;
      gap: 8px;
      color: var(--text-muted);
      font-size: 13px;
    }

    .cc-bcc-toggles span {
      cursor: pointer;
    }

    .cc-bcc-toggles span:hover {
      text-decoration: underline;
    }

    .field-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      background: transparent;
      padding: 8px 0;
      color: var(--text-color);
    }

    .address-input {
      flex: 1;
    }

    .toolbar-actions {
      display: flex;
      gap: 4px;
    }

    .send-actions {
      display: flex;
      gap: 8px;
    }

    .remove-attachment-btn {
      padding: 0;
    }

    .send-row {
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-color);
    }

    .attachments-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 16px 0;
    }

    .saving-indicator {
      font-size: 12px;
      color: var(--text-muted, #666);
      margin-right: 8px;
      align-self: center;
    }

    .composer-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    @media (max-width: 768px) {
      .window-frame {
        border-radius: 0;
      }
      .content {
        display: flex !important;
      }
      .header-actions alps-icon-btn[title="Minimize"],
      .header-actions alps-icon-btn[title="Expand"] {
        display: none;
      }
    }
  `;

  render() {
    if (this.instance.closing) {
      return html`<style>:host { display: none !important; }</style>`;
    }

    const hasRecipient = (this.instance.to?.length || 0) > 0 || (this.instance.cc?.length || 0) > 0 || (this.instance.bcc?.length || 0) > 0;
    const canSend = hasRecipient && (this.instance.text?.trim().length || 0) > 0;

    const minimizeWidth = 260;
    const gap = 16;
    const composerWidth = 470;

    let rightOffset: number;
    let bottomOffset: number;

    if (this.instance.minimized) {
      rightOffset = 24;
      bottomOffset = 24 + (this.minimizedIndex * 40); // 40px is minimized height
    } else {
      const reservedSpace = this.totalMinimized > 0 ? minimizeWidth + gap : 0;
      rightOffset = 24 + reservedSpace + (this.openIndex * (composerWidth + gap));
      bottomOffset = 0;

      const requiredWidth = 24 + reservedSpace + (this.totalOpen * composerWidth);
      if (requiredWidth > this.windowWidth && this.totalOpen > 1) {
        const availableWidth = this.windowWidth - composerWidth - 48 - reservedSpace;
        const overlapGap = availableWidth > 0 ? availableWidth / (this.totalOpen - 1) : 32;
        rightOffset = 24 + reservedSpace + (this.openIndex * Math.min(overlapGap, composerWidth));
      }
    }

    let topPx, leftPx, widthPx, heightPx;
    const isMobile = this.windowWidth <= 768;

    if (this.showDiscardConfirm) {
      // Temporarily boost z-index so the modal overlay covers the app header (z-index: 20000)
      this.style.zIndex = '30000';
      if (isMobile) {
        widthPx = this.windowWidth;
        heightPx = this.windowHeight;
        leftPx = 0;
        topPx = 0;
        this.removeAttribute('expanded');
      } else if (this.instance.expanded) {
        widthPx = Math.min(this.windowWidth * 0.85, 800);
        heightPx = this.windowHeight * 0.8;
        leftPx = (this.windowWidth - widthPx) / 2;
        topPx = (this.windowHeight - heightPx) / 2;
        this.setAttribute('expanded', '');
      } else {
        widthPx = this.instance.minimized ? minimizeWidth : composerWidth;
        heightPx = this.instance.minimized ? 40 : 500;
        leftPx = this.windowWidth - rightOffset - widthPx;
        topPx = this.windowHeight - bottomOffset - heightPx;
        this.removeAttribute('expanded');
      }
    } else if (isMobile) {
      widthPx = this.windowWidth;
      heightPx = this.windowHeight;
      leftPx = 0;
      topPx = 0;
      this.style.zIndex = '30000';
      this.removeAttribute('expanded');
    } else if (this.instance.expanded) {
      widthPx = Math.min(this.windowWidth * 0.85, 800);
      heightPx = this.windowHeight * 0.8;
      leftPx = (this.windowWidth - widthPx) / 2;
      topPx = (this.windowHeight - heightPx) / 2;

      this.style.zIndex = '30000';
      this.setAttribute('expanded', '');
    } else {
      widthPx = this.instance.minimized ? minimizeWidth : composerWidth;
      heightPx = this.instance.minimized ? 40 : 500;
      leftPx = this.windowWidth - rightOffset - widthPx;
      topPx = this.windowHeight - bottomOffset - heightPx;

      this.style.zIndex = `${this.instance.zIndex || 1000}`;
      this.removeAttribute('expanded');
    }

    this.style.width = `${widthPx}px`;
    this.style.height = `${heightPx}px`;
    this.style.left = `${leftPx}px`;
    this.style.top = `${topPx}px`;

    if (this.instance.minimized) {
      this.setAttribute('minimized', '');
    } else {
      this.removeAttribute('minimized');
    }

    return html`
      ${this.instance.expanded ? html`<div class="backdrop"></div>` : ''}
      
      ${this.showDiscardConfirm ? html`
        <ui-confirm
          title="Discard Draft?"
          message="Are you sure you want to discard this draft? This action cannot be undone."
          confirmText="Discard"
          cancelText="Cancel"
          .isDanger=${true}
          @confirm=${this._confirmDiscard}
          @cancel=${this._cancelDiscard}
        ></ui-confirm>
      ` : ''}

      <div class="window-frame" @mousedown=${this._bringToFront}>
        ${this.instance.isSending ? html`
          <div class="sending-overlay">
            <alps-loader></alps-loader>
          </div>
        ` : ''}
        
        <div class="header" @click=${this._handleHeaderClick}>
          <div class="header-title">${this.instance.subject || 'New Message'}</div>
          <div class="header-actions">
            ${this.isSaving ? html`<span class="saving-indicator">Saving...</span>` : (this.instance.draftUid && !this.instance.dirty) ? html`<span class="saving-indicator">Autosaved</span>` : ''}
            <alps-icon-btn 
              title="${this.instance.minimized ? 'Restore' : 'Minimize'}" 
              icon="${this.instance.minimized ? 'caretUp' : 'composerMinimize'}"
              @click=${(e: Event) => { e.stopPropagation(); this._toggleMinimize(); }}>
            </alps-icon-btn>
            <alps-icon-btn 
              title="${this.instance.expanded ? 'Restore' : 'Expand'}" 
              icon="${this.instance.expanded ? 'arrowsInSimple' : 'arrowsOutSimple'}"
              @click=${(e: Event) => { e.stopPropagation(); this._toggleExpand(); }}>
            </alps-icon-btn>
            <alps-icon-btn 
              title="Save & close" 
              icon="x"
              @click=${(e: Event) => { e.stopPropagation(); this._handleCloseClick(); }}>
            </alps-icon-btn>
          </div>
        </div>

        <div class="content">
          <div class="field-row">
            <span class="field-label">To</span>
            <alps-address-input 
              class="address-input"
              .addresses=${this.instance.to || []}
              @addresses-changed=${(e: CustomEvent) => this.composeStore.updateComposer(this.instance.id, { to: e.detail.addresses })}
              ?disabled=${this.instance.isSending}
            ></alps-address-input>
            ${!this.showCc || !this.showBcc ? html`
              <div class="cc-bcc-toggles">
                ${!this.showCc ? html`<span @click=${() => this.showCc = true}>Cc</span>` : ''}
                ${!this.showBcc ? html`<span @click=${() => this.showBcc = true}>Bcc</span>` : ''}
              </div>
            ` : ''}
          </div>

          ${this.showCc ? html`
            <div class="field-row">
              <span class="field-label">Cc</span>
              <alps-address-input 
                class="address-input"
                .addresses=${this.instance.cc || []}
                @addresses-changed=${(e: CustomEvent) => this.composeStore.updateComposer(this.instance.id, { cc: e.detail.addresses })}
                ?disabled=${this.instance.isSending}
              ></alps-address-input>
            </div>
          ` : ''}

          ${this.showBcc ? html`
            <div class="field-row">
              <span class="field-label">Bcc</span>
              <alps-address-input 
                class="address-input"
                .addresses=${this.instance.bcc || []}
                @addresses-changed=${(e: CustomEvent) => this.composeStore.updateComposer(this.instance.id, { bcc: e.detail.addresses })}
                ?disabled=${this.instance.isSending}
              ></alps-address-input>
            </div>
          ` : ''}

          <div class="field-row">
            <input 
              class="field-input" 
              placeholder="Subject" 
              .value=${this.instance.subject || ''}
              @input=${(e: any) => this.composeStore.updateComposer(this.instance.id, { subject: e.target.value })}
              ?disabled=${this.instance.isSending}
            />
          </div>

          <div class="composer-wrapper">
            <alps-message-composer
              .isSending=${this.instance.isSending}
              .text=${this.instance.text || ''}
              .htmlText=${this.instance.html || ''}
              .format=${this.instance.format || 'html'}
              @text-changed=${(e: CustomEvent) => this.composeStore.updateComposer(this.instance.id, { text: e.detail.text, html: e.detail.html })}
            ></alps-message-composer>
          </div>

          <alps-attachment-list
            .attachments=${this.instance.attachments || []}
            .removable=${true}
            .composerMode=${true}
            @remove-attachment=${(e: CustomEvent) => {
        const idx = (this.instance.attachments || []).indexOf(e.detail.attachment);
        if (idx !== -1) this._removeAttachment(idx);
      }}
          ></alps-attachment-list>

          <div class="send-row">
            <div class="toolbar-actions">
              <alps-icon-btn 
                ?active=${(this.instance.format || 'html') === 'html'} 
                title="Toggle Formatting Options" 
                icon="textAa"
                @click=${this._toggleFormat}>
              </alps-icon-btn>
              <alps-icon-btn 
                title="Attach Files" 
                icon="paperclip"
                @click=${this._handleAttachClick}>
              </alps-icon-btn>
              ${(this.instance.format || 'html') === 'html' ? html`
                <alps-popup id="linkPopup" align="left" position="top">
                  <alps-icon-btn slot="trigger" title="Insert Link" icon="linkSimple" @mousedown=${(e: Event) => e.preventDefault()} @click=${this._handleLinkClick}></alps-icon-btn>
                  <div class="popup-form" @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._handleLinkSubmit(); }}>
                    ${this.linkPromptFields.map(f => html`
                      <div class="field-group">
                        <label for=${f.id}>${f.label}</label>
                        <alps-input inputId=${f.id} type="text" placeholder=${f.placeholder}></alps-input>
                      </div>
                    `)}
                    <div class="popup-actions">
                      <alps-button variant="text" @click=${() => (this.shadowRoot?.querySelector('#linkPopup') as AlpsPopup)?.close()}>Cancel</alps-button>
                      <alps-button variant="normal" @click=${this._handleLinkSubmit}>Apply</alps-button>
                    </div>
                  </div>
                </alps-popup>
              ` : ''}
              
              <alps-emoji-selector-popup position="top" @emoji-selected=${(e: CustomEvent) => this.composer?.insertEmoji(e.detail.emoji)}>
                <alps-icon-btn slot="trigger" title="Insert Emoji" icon="smiley"></alps-icon-btn>
              </alps-emoji-selector-popup>
            </div>
            <div class="send-actions">
              <alps-button variant="text" @click=${(e: Event) => { e.stopPropagation(); this._handleDiscardClick(); }}>
                Discard
              </alps-button>
              <alps-button variant="primary" @click=${this._handleSend} ?disabled=${this.instance.isSending || !canSend}>
                Send
              </alps-button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
