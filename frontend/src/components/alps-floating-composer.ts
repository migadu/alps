import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import {
  bareAddress, composeContext, draftContentKey, keptAfterSave, postedAttachments, recipientField, reconcileSavedAttachments, uploadGone,
} from '../store/compose-store';
import type { ComposerInstance, ComposeStore } from '../store/compose-store';
import { handleAttachClick, abortUpload, deleteAttachment, uploadFiles } from '../utils/attachment-utils';
import { messageOperations, MissingUploadsError } from '../services/message-operations';
import { ownAddress, readUserSettings } from '../store/settings-store';
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
import { Logger } from '../utils/logger';
import { appendReplyFields } from '../utils/reply-context';
import { registry } from '../plugin-registry';
const UNDO_TOAST_TIMEOUT_MS = 5000;

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
  @state() private isDragOver = false;

  private autoSaveTimer: number | null = null;
  /** The save on the wire, for a close or a discard to wait out. */
  private savingPromise: Promise<boolean> | null = null;
  /**
   * The draft the last save stored, by its UID and its content key as the
   * composer holds it once the answer is applied. `null` when that is not
   * known, as before the first save from this window, or after one that left
   * edits unsaved.
   */
  private storedDraft: { uid: string; key: string } | null = null;
  /** Set once a discard is under way: no save may store the draft again. */
  private discarding = false;
  /** The undo window of a send, and how to end it as Undo does. */
  private undoSendTimer: number | null = null;
  private cancelUndoSend: (() => void) | null = null;

  private _handleI18nChange = () => {
    this.requestUpdate();
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this._handleResize);
    window.addEventListener('dragover', this._handleWindowDragOver);
    window.addEventListener('dragleave', this._handleWindowDragLeave);
    window.addEventListener('alps-composer-drop', this._handleGlobalDropHandled as EventListener);
    this.composeStore?.addEventListener?.('change', this._handleStoreChange);
    this.updateComplete.then(() => {
      if (!this.isConnected) return;
      this.i18nStore?.addEventListener('change', this._handleI18nChange);
    });
    if ((this.instance.cc && this.instance.cc.length > 0)) this.showCc = true;
    if ((this.instance.bcc && this.instance.bcc.length > 0)) this.showBcc = true;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._handleResize);
    window.removeEventListener('dragover', this._handleWindowDragOver);
    window.removeEventListener('dragleave', this._handleWindowDragLeave);
    window.removeEventListener('alps-composer-drop', this._handleGlobalDropHandled as EventListener);
    this.composeStore?.removeEventListener?.('change', this._handleStoreChange);
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);
    this._clearAutoSave();
    // A send still in its undo window goes no further once the window is
    // gone. A sign-out takes it away, and the timer used to send the message
    // anyway, under whichever session was signed in by then.
    this._clearUndoSend();
  }

  /**
   * Follows this window's composer through the store. The shell passes a new
   * composer only when the set of windows changes, not for each keystroke,
   * so what was typed, and where the window sits, arrive here.
   */
  private _handleStoreChange = () => {
    const next = this.composeStore.getComposer(this.instance.id);
    // Saved by someone else, the sign-out flush: whether or not this window
    // hears how that save went, the server may hold a newer draft than the
    // one this window last stored, under a new UID.
    if (next?.isSaving && !this.isSaving) this.storedDraft = null;
    if (next && next !== this.instance) this.instance = next;
  };

  private _handleWindowDragOver = () => {
    // If window receives dragover, it means the drag is outside the composer
    // (since composer stops propagation of dragover)
    if (this.isDragOver) {
      this.isDragOver = false;
    }
  };

  private _handleWindowDragLeave = (e: DragEvent) => {
    // If relatedTarget is null, the drag left the browser window entirely
    if (e.relatedTarget === null && this.isDragOver) {
      this.isDragOver = false;
    }
  };

  private _handleGlobalDropHandled = () => {
    if (this.isDragOver) {
      this.isDragOver = false;
    }
  };

  firstUpdated() {
    void this._focusNewEditor();
  }

  /**
   * Puts the caret in a new window's editor as soon as the editor exists.
   *
   * The composer builds its editor in its own first update, which follows this
   * window's. A 100 ms timer stood in for that wait, and for those 100 ms focus
   * stayed on the button that opened the window: a letter typed then was lost,
   * and a space pressed that button again, opening a second composer or a
   * second reply.
   */
  private async _focusNewEditor() {
    const composer = this.composer as any;
    if (!composer) return;
    await composer.updateComplete;
    if (this.isConnected && composer.isConnected) composer.focusEditor?.();
  }

  private _clearAutoSave() {
    if (this.autoSaveTimer !== null) {
      window.clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private _clearUndoSend() {
    if (this.undoSendTimer !== null) {
      window.clearTimeout(this.undoSendTimer);
      this.undoSendTimer = null;
    }
    const cancel = this.cancelUndoSend;
    this.cancelUndoSend = null;
    cancel?.();
  }

  /**
   * Whether a send has to stop after an await: this window is gone, or its
   * composer has left the store, as a sign-out takes every composer. A
   * composer still in the store is given back, so it is not left sending.
   */
  private _sendCutShort(id: string): boolean {
    const current = this.composeStore.getComposer(id);
    if (this.isConnected && current) return false;
    if (current) this.composeStore.updateComposer(id, { isSending: false, minimized: false });
    return true;
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('instance') && this.instance.dirty && !this.instance.isSending && !this.instance.isSaving) {
      this._scheduleAutoSave();
    }
  }

  private _scheduleAutoSave() {
    this._clearAutoSave();
    if (this.discarding) return;
    this.autoSaveTimer = window.setTimeout(() => {
      this._saveDraft();
    }, 3000); // 3 seconds auto-save
  }

  /**
   * Saves the draft.
   *
   * Returns whether the message is SAFE — either stored on the server, or never
   * stored and so empty there is nothing to store. `false` means a save was
   * attempted and did not land, which is the one case where closing the window
   * would destroy what the user wrote. See `_handleCloseClick`.
   */
  private _saveDraft(): Promise<boolean> {
    // A save is already in flight; a second one now would race it.
    if (this.savingPromise) return Promise.resolve(false);
    const running = this._saveDraftWithoutGoneUploads().finally(() => {
      if (this.savingPromise === running) this.savingPromise = null;
    });
    this.savingPromise = running;
    return running;
  }

  /**
   * `_doSaveDraft`, and once more when the server no longer holds uploads the
   * save named, as after a session expired: those are listed as files to add
   * again, and the rest of the draft is saved without them. Every save used
   * to fail on them until the user removed them by hand. Twice at most: the
   * server names every upload it lacks at once, so a second refusal is one
   * more let go between the two requests, left to the next autosave.
   */
  private async _saveDraftWithoutGoneUploads(): Promise<boolean> {
    const id = this.instance.id;
    for (let attempt = 1; ; attempt++) {
      try {
        return await this._doSaveDraft();
      } catch (error) {
        if (!(error instanceof MissingUploadsError)) throw error;
        this._markUploadsGone(id, error.uuids);
        if (attempt === 2 || !this.isConnected || !this.composeStore.getComposer(id)) return false;
      }
    }
  }

  /**
   * Lists the attachments whose uploads the server no longer holds as files
   * to add again, and says so. They stay on screen under their names and are
   * sent with nothing, which also leaves the composer unsaved.
   */
  private _markUploadsGone(id: string, uuids: string[]) {
    const composer = this.composeStore.getComposer(id);
    if (!composer) return;
    const gone = new Set(uuids);
    let count = 0;
    const attachments = (composer.attachments || []).map(a => {
      if (!a.uuid || !gone.has(a.uuid)) return a;
      count++;
      return uploadGone(a);
    });
    if (count === 0) return;
    this.composeStore.updateComposer(id, { attachments });
    this._toastUploadsGone(count);
  }

  private _toastUploadsGone(count: number) {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        message: this.i18nStore?.t('composer.attachmentsGone', { count }),
        duration: 8000
      }
    }));
  }

  private async _doSaveDraft(): Promise<boolean> {
    const id = this.instance.id;
    const currentInstance = this.composeStore.getComposer(id) || this.instance;
    // `isSaving` in the store is the sign-out flush saving this draft, which a
    // second save beside it would race.
    if (currentInstance.isSending || currentInstance.isSaving || this.discarding) return false;

    // Check if we have anything to save
    const hasRecipient = (currentInstance.to?.length || 0) > 0 || (currentInstance.cc?.length || 0) > 0 || (currentInstance.bcc?.length || 0) > 0;
    const hasAttachments = (currentInstance.attachments && currentInstance.attachments.length > 0);
    const textIsJustInitial = currentInstance.text?.trim() === currentInstance.initialText?.trim();
    const hasContent = !textIsJustInitial || (currentInstance.subject?.trim().length || 0) > 0 || hasAttachments;
    // Only for a message never stored. A stored draft emptied to blank is
    // saved as it is: taken for nothing to lose, it stayed in Drafts with the
    // recipients, subject and text the user had removed, and Close took the
    // window away without a save. Saved, not deleted, so emptying the text
    // before writing it again loses nothing.
    if (!hasRecipient && !hasContent && !currentInstance.draftUid) {
      return true; // nothing to lose
    }

    // Already stored as it is. Each save rewrites the whole message on the
    // server, reading back every part the draft holds, so one that stores
    // nothing new is all cost: the timer an upload's progress armed fired
    // after that upload's own save, and stored the same draft again.
    const contentKey = draftContentKey(currentInstance);
    if (this.storedDraft && this.storedDraft.uid === currentInstance.draftUid && this.storedDraft.key === contentKey) {
      // An edit undone leaves the composer marked unsaved, with nothing to save.
      if (currentInstance.dirty) this.composeStore.updateComposer(id, { dirty: false });
      return true;
    }

    this.isSaving = true;
    // In the store too, so the sign-out flush leaves this draft to this save.
    this.composeStore.updateComposer(id, { isSaving: true });
    try {
      const sentUuids = (currentInstance.attachments || []).map(a => a.uuid).filter(Boolean);
      const bcc = this._bccRecipients(currentInstance);
      const formData = this._buildFormData(currentInstance, bcc);
      formData.append('save_as_draft', '1');

      // Not known again until this save is answered: one that fails or times
      // out may still have been stored by the server, under a new UID.
      this.storedDraft = null;
      const result = await messageOperations.saveDraft(formData);

      if (result) {
        const oldUid = this.instance.draftUid;
        // Optimistically update the UI before checking isConnected so Drafts folder updates instantly
        window.dispatchEvent(new CustomEvent('draft-autosaved', {
          detail: {
            oldUid,
            // A UID means something only in its mailbox, and a draft is on
            // screen outside Drafts too — a search of all mailboxes lists it.
            oldMailbox: this.instance.draftMailbox,
            newUid: result.uid,
            mailbox: result.mailbox,
            // The draft the request stored, as it posted it. The window as it
            // is now may hold edits made while the save was out, which are not
            // in this draft; they leave the composer dirty, and the next save
            // brings the row up to date. The recipients come from the same
            // snapshot, so the event describes one draft.
            subject: (currentInstance.subject || '').trim(),
            to: currentInstance.to,
            cc: currentInstance.cc,
            // The server confirms what it stored: unreadable Bcc is omitted.
            // Older servers fall back to the posted snapshot, including self.
            bcc: result.bcc ?? bcc,
            size: result.size,
            // A file the request carried: an upload still in flight is not in
            // this draft, and the quote's own images are not files.
            hasAttachments: (currentInstance.attachments || []).some(a => !a.inline && (a.uuid || a.partPath))
          }
        }));
      }

      if (!this.isConnected) {
        // The element went away mid-save. Whether the message is safe is still
        // decided by the server's answer, not by whether we are still on screen.
        return !!result;
      }

      if (result) {
        // Clean only if nothing changed while the request was out. What was
        // typed meanwhile is not in this draft, and marking it clean let a
        // close, which saves only a dirty composer, or a sign-out drop it.
        const latest = this.composeStore.getComposer(this.instance.id) || currentInstance;
        const updates: any = {
          dirty: draftContentKey(latest) !== contentKey,
          draftUid: result.uid,
          draftMailbox: result.mailbox
        };
        if (result.attachments) {
          // Entry by entry, from the composer as it is now. Each entry this
          // save carried becomes the part it is stored as, which the answer
          // names by the upload or the earlier part it came from; one picked
          // during the save is kept as it is. One removed during the save
          // stays removed, and leaves the composer unsaved, so the next save
          // stores the draft without it. Rebuilt from the answer, the list
          // had it back, and the next save and the send carried it again.
          updates.attachments = reconcileSavedAttachments(latest.attachments || [], currentInstance.attachments || [], result.attachments);
        }
        // Nor the quote's images a plain-text save left out: see keptAfterSave.
        const listed = updates.attachments ?? latest.attachments;
        const kept = listed && keptAfterSave(listed, currentInstance);
        if (kept !== listed) updates.attachments = kept;
        this.composeStore.updateComposer(this.instance.id, updates);

        // If the composer became dirty while saving, or new attachments were added, schedule another save
        const latestComposer = this.composeStore.getComposer(this.instance.id);
        this.storedDraft = latestComposer && !latestComposer.dirty
          ? { uid: result.uid, key: draftContentKey(latestComposer) }
          : null;
        const hasUnsavedAttachments = (latestComposer?.attachments || []).some(a => a.uuid && !sentUuids.includes(a.uuid));
        if (latestComposer?.dirty || hasUnsavedAttachments) {
          this._scheduleAutoSave();
        }
      }
      return !!result;
    } finally {
      this.isSaving = false;
      if (this.composeStore.getComposer(id)) this.composeStore.updateComposer(id, { isSaving: false });
    }
  }

  /** The Bcc the request stores, including the user's own address if enabled. */
  private _bccRecipients(currentInstance: ComposerInstance): string[] {
    const bcc = [...(currentInstance.bcc || [])];
    // `readUserSettings`, not a hand-parse of `alps_settings`: that key holds
    // only theme and layout values, so `bccMyself`, `loginUsername` and
    // `replyTo` were all undefined here and both settings were inert.
    {
      const parsed = readUserSettings();
      // The address, not the login: a bare login in Bcc stopped every send.
      const self = ownAddress(parsed);
      // Compared as addresses: a pill can hold `"Me" <me@…>` or another case, and
      // an exact string match added the sender to Bcc a second time.
      const mine = self ? bareAddress(self) : '';
      if (parsed.bccMyself && self && !bcc.some(addr => bareAddress(addr) === mine)) {
        bcc.push(self);
      }
    }
    return bcc;
  }

  private _buildFormData(currentInstance: ComposerInstance, bcc = this._bccRecipients(currentInstance)): FormData {
    const formData = new FormData();
    const to = currentInstance.to || [];
    const cc = currentInstance.cc || [];
    const replyToSetting = readUserSettings().replyTo;

    const text = currentInstance.text || '';
    const subject = (currentInstance.subject || '').trim();

    formData.append('to', recipientField(to));
    formData.append('cc', recipientField(cc));
    formData.append('bcc', recipientField(bcc));
    
    if (replyToSetting) {
      formData.append('reply_to', replyToSetting);
    }
    formData.append('subject', subject);
    formData.append('text', text);
    if (currentInstance.format === 'html' && currentInstance.html) {
      formData.append('html', currentInstance.html);
    }

    const attachments = postedAttachments(currentInstance);
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
    appendReplyFields(formData, currentInstance);

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
        if (this.isConnected && this.composer && (this.composer as any).focusEditor) {
          (this.composer as any).focusEditor(true);
        }
      }, 100);
    } else if (!this._wasActiveOnMousedown) {
      setTimeout(() => {
        if (this.isConnected && this.composer && (this.composer as any).focusEditor) {
          (this.composer as any).focusEditor(true);
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

  /**
   * Completes a close that was deferred while an upload finished.
   *
   * `_handleCloseClick` sets `closing: true` and returns when attachments are
   * still in flight; this runs when the last one settles. It used to be
   * `this._saveDraft().then(() => closeComposer(...))` — closing regardless of
   * whether the save landed, which is the message-loss bug e85d153 fixed on the
   * close button itself and missed here, on the path a user takes precisely
   * when their message has attachments worth waiting for.
   */
  private async _finishDeferredClose() {
    await this.savingPromise?.catch(() => false);
    if (this._keepOpenForMissingUploads()) return;
    if (await this._saveDraft()) {
      if (this._keepOpenForMissingUploads(false)) return;
      this.composeStore.closeComposer(this.instance.id);
      return;
    }
    // Take the window back out of its closing state, or it stays on screen
    // with no way to complete the gesture.
    this.composeStore.updateComposer(this.instance.id, { closing: false } as any);
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        message: this.i18nStore?.t('composer.draftSaveFailedKeepOpen')
          || 'Could not save this draft — the window stays open so nothing is lost',
        duration: 6000
      }
    }));
  }

  /**
   * A saved draft cannot store the Add again markers. Closing would remove
   * the only reminder that the message still needs a file, even after a
   * successful autosave of everything else.
   */
  private _keepOpenForMissingUploads(notify = true): boolean {
    const current = this.composeStore.getComposer(this.instance.id);
    const count = (current?.attachments || []).filter(a => a.missing).length;
    if (!count) return false;
    this.composeStore.updateComposer(this.instance.id, { closing: false, minimized: false });
    if (notify) this._toastUploadsGone(count);
    return true;
  }

  private async _handleCloseClick() {
    const hasUploading = (this.instance.attachments || []).some(a => a.uploading);
    if (hasUploading) {
      this.composeStore.updateComposer(this.instance.id, { closing: true } as any);
      return;
    }

    // AWAITED, and the close is conditional on it.
    //
    // This used to fire the save and close in the same tick. `closeComposer`
    // drops the composer from state and immediately persists the reduced list,
    // so a save that then failed — offline, a 500, a full mailbox — left the
    // message gone from the screen AND gone from localStorage, having never
    // reached the server. Total, silent loss of what the user wrote, on the
    // gesture they use to put a message aside for later.
    //
    // An autosave already on the wire is waited out first. Its answer decides
    // whether anything is left to save, and a second save beside it was
    // refused and reported as a failure while the first one was still running.
    // Then the store's answer, not the rendered property's, which lags it: a
    // save that has just landed may have left the composer dirty.
    await this.savingPromise?.catch(() => false);
    if (this._keepOpenForMissingUploads()) return;
    const current = this.composeStore.getComposer(this.instance.id) || this.instance;
    if (current.dirty) {
      const saved = await this._saveDraft();
      if (!saved) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            message: this.i18nStore?.t('composer.draftSaveFailedKeepOpen')
              || 'Could not save this draft — the window stays open so nothing is lost',
            duration: 6000
          }
        }));
        return;
      }
    }
    if (this._keepOpenForMissingUploads(false)) return;
    // The window stays on screen while Close saves it, and what was typed
    // meanwhile is not in that save. Closing once the save landed took the
    // newer text from the screen and from localStorage, and the server never
    // had it. So the window stays open with it, as for a user who changed
    // their mind: the autosave the save armed stores it, and Close again
    // saves it and closes. Saving it here instead would take the window away
    // mid-sentence, after as many saves as the typing took.
    //
    // A save that was sent leaves the composer dirty only for what changed
    // while it was out. A composer with nothing in it to save, blank and
    // never stored, is not sent, and stays the object it was, still marked
    // edited: the store replaces a composer on each update. That one closes.
    const latest = this.composeStore.getComposer(this.instance.id);
    if (latest !== current && latest?.dirty) return;
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

  private _toastDiscardFailed() {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        message: this.i18nStore?.t('composer.discardFailed')
          || 'The draft could not be deleted from the server and is still in Drafts.',
        duration: 5000
      }
    }));
  }

  private async _performDiscard(type: 'close' | 'delete' | null) {
    this.discarding = true;
    this._clearAutoSave();
    // A save already on the wire stores a new draft and deletes the one this
    // window knew. Deleting before it lands deleted the old draft and left the
    // new one in Drafts, after the user had discarded it. So the save is
    // waited out, and the draft to delete is read from the store, which that
    // save updates, not from the rendered property, which lags.
    await this.savingPromise?.catch(() => false);
    const current = this.composeStore.getComposer(this.instance.id) || this.instance;
    if (type === 'delete' && current.draftUid && current.draftMailbox) {
      const mailbox = current.draftMailbox;
      const uid = String(current.draftUid);
      try {
        // `deleteMessages` reports a refusal by RETURNING false; it only throws
        // on a network error, so the catch below was the smaller half of the
        // problem and the returned answer was discarded entirely. A draft the
        // server would not delete stays in Drafts while the user watches the
        // window close on it.
        const deleted = await messageOperations.deleteMessagesResult(mailbox, [uid]);
        // The re-sync the delete ends in takes the row off the list, but never
        // closes the reader, so a reader still showing this draft has to be told
        // (alps-message-reader's `_handleDraftDiscarded`).
        if (deleted.ok) {
          window.dispatchEvent(new CustomEvent('draft-discarded', { detail: { mailbox, uid } }));
        }
        // Quiet on `auth`: the shell is already showing the login screen.
        if (!deleted.ok && deleted.reason !== 'auth') this._toastDiscardFailed();
      } catch (e) {
        Logger.error('Failed to delete draft', e);
        this._toastDiscardFailed();
      }
    }

    if (current.attachments) {
      for (const att of current.attachments) {
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
      (this.composer as any).focusEditor(true);
    }

    const hasSelection = this.composer.hasSelection();
    const activeLink = this.composer.getActiveLink ? this.composer.getActiveLink() : null;

    if (activeLink) {
      this.linkPromptFields = [
        { id: 'url', label: this.i18nStore?.t('floatingComposer.linkUrl'), placeholder: this.i18nStore?.t('floatingComposer.linkUrlPlaceholder'), value: activeLink }
      ];
    } else {
      const selectedText = hasSelection && (this.composer as any).getSelectionText ? (this.composer as any).getSelectionText() : '';
      this.linkPromptFields = [
        { id: 'text', label: this.i18nStore?.t('floatingComposer.displayText'), placeholder: this.i18nStore?.t('floatingComposer.displayTextPlaceholder'), value: selectedText },
        { id: 'url', label: this.i18nStore?.t('floatingComposer.linkUrl'), placeholder: this.i18nStore?.t('floatingComposer.linkUrlPlaceholder') }
      ];
    }

    // Once, as the popup opens, which also clears what was typed the last time
    // it was open. Not bound in the template: a binding is re-applied by any
    // render of this window, and one mid-typing wiped the field. No field is
    // focused, so the editor keeps its visible selection.
    void this.updateComplete.then(() => {
      for (const field of this._linkPromptFieldElements()) {
        field.value = this.linkPromptFields.find(f => f.id === field.inputId)?.value || '';
      }
    });
  }

  private _linkPromptFieldElements() {
    return Array.from(this.shadowRoot?.querySelectorAll<HTMLElement & { inputId: string; value: string }>('#linkPopup alps-input') ?? []);
  }

  /**
   * What the link popup's fields hold, by field id.
   *
   * Read from the fields' `alps-input` elements. The `<input>` inside each is
   * in that element's own shadow root, where a query from here never reaches,
   * so reading those found nothing and Apply inserted no link at all.
   */
  private _linkPromptValues(): Record<string, string> {
    const values: Record<string, string> = {};
    for (const field of this._linkPromptFieldElements()) values[field.inputId] = field.value;
    return values;
  }

  private _handleLinkSubmit() {
    const popup = this.shadowRoot?.querySelector('#linkPopup') as AlpsPopup;
    if (popup) popup.close();

    if (!this.composer) return;

    const { text, url } = this._linkPromptValues();
    if (!url) return;

    if (this.instance.format === 'html' && (this.composer as any).editor) {
      const editor = (this.composer as any).editor;
      // Never over a selected quote: inserting replaces the selection.
      (this.composer as any).leaveSelectedNode?.();
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



  /**
   * Tab from the subject goes to the body.
   *
   * The formatting toolbar renders above the editor, so in document order it
   * sits between the two, and every one of its buttons is a tab stop: a plain
   * Tab landed on the first of them, and reaching the body took a dozen more.
   * The toolbar stays reachable with Shift+Tab from the body. `keepCaret`
   * puts the caret back where the user left it, as a native Tab into the
   * editor would.
   */
  private _handleSubjectKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    const composer = this.composer;
    if (!composer?.focusEditor) return;
    e.preventDefault();
    composer.focusEditor(true);
  };

  private async _handleSend() {
    // Captured once: the window may be gone, and its property with it, by the
    // time the countdown ends.
    const id = this.instance.id;
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
    // A file whose upload the server no longer holds would not go with the
    // message. It is added again, or removed to send without it.
    const gone = (this.instance.attachments || []).filter(a => a.missing).length;
    if (gone > 0) {
      this._toastUploadsGone(gone);
      return;
    }

    const text = this.instance.text || '';
    const to = this.instance.to || [];
    const cc = this.instance.cc || [];
    const bcc = this.instance.bcc || [];
    const allTo = [...to, ...cc, ...bcc];

    // No subject check. A message without one is valid mail, the server omits
    // the header when it is empty, and the Send button is enabled for it, so
    // refusing here left the window open with nothing on screen to say why.
    if (!text || allTo.length === 0) return;

    this._clearAutoSave();
    this.composeStore.updateComposer(id, { isSending: true, minimized: true });

    try {
      let undoFn: (() => void) | undefined;
      let sendNowFn: (() => void) | undefined;
      const sendPromise = new Promise<boolean>((resolve) => {
        let settled = false;
        // Once only: a toast's Undo pressed late must not end the countdown
        // of a later send from this window.
        const settle = (send: boolean) => {
          if (settled) return;
          settled = true;
          if (this.undoSendTimer !== null) window.clearTimeout(this.undoSendTimer);
          this.undoSendTimer = null;
          this.cancelUndoSend = null;
          resolve(send);
        };
        this.undoSendTimer = window.setTimeout(() => settle(true), UNDO_TOAST_TIMEOUT_MS);
        undoFn = () => settle(false);
        sendNowFn = () => settle(true);
        this.cancelUndoSend = undoFn;
      });

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: this.i18nStore?.t('composer.sending'),
          actionLabel: this.i18nStore?.t('composer.undo'),
          actionFn: () => {
            if (undoFn) undoFn();
          },
          // Dismissing the toast (X) skips the remaining delay and sends now.
          dismissFn: () => {
            if (sendNowFn) sendNowFn();
          },
          duration: UNDO_TOAST_TIMEOUT_MS
        }
      }));

      const shouldSend = await sendPromise;
      if (this._sendCutShort(id)) return;
      if (!shouldSend) {
        this.composeStore.updateComposer(id, { isSending: false, minimized: false });
        this.composeStore.bringComposerToFront(id);
        return;
      }

      // An autosave still on the wire stores a new draft and deletes the one
      // the send would name. Sent before it landed, the message was built on
      // the deleted draft, whose attachments it carries, and the new draft
      // stayed in Drafts beside the sent message.
      await this.savingPromise?.catch(() => false);
      if (this._sendCutShort(id)) return;

      // That save may have been refused over an upload the server no longer
      // holds, and listed the file as one to add again. Sent now, the message
      // would go without it.
      const goneNow = (this.composeStore.getComposer(id)?.attachments || []).filter(a => a.missing).length;
      if (goneNow > 0) {
        this.composeStore.updateComposer(id, { isSending: false, minimized: false });
        this.composeStore.bringComposerToFront(id);
        this._toastUploadsGone(goneNow);
        return;
      }

      // The store's composer, and no other. Falling back to the window's
      // property sent whatever that property held, which need not be the
      // message this send began with.
      const currentInstance = this.composeStore.getComposer(id)!;
      let finalFormData = this._buildFormData(currentInstance);

      // invokeHookSettled, NOT invokeHookAsync: a presend hook that throws has
      // not approved this send, it has failed to decide — and the only safe
      // reading of that is to stop. GPG's handlePresend returns the ENCRYPTED
      // FormData; if its rejection were swallowed, `finalFormData` would still
      // be the plaintext one built above and the message would go out in the
      // clear. (Under the old bare `Promise.all` the rejection propagated to
      // this method's catch, which aborted the send — so switching that to
      // allSettled without this would have turned a loud failure into a silent
      // plaintext send.)
      const { results: presendResults, failed: presendFailed } =
        await registry.invokeHookSettled('composer:presend', { composer: this, formData: finalFormData, instance: currentInstance });
      if (this._sendCutShort(id)) return;
      let abortSend = presendFailed > 0;
      for (const res of presendResults) {
        if (res instanceof FormData) finalFormData = res;
        else if (res === false) abortSend = true;
      }

      if (abortSend) {
        this.composeStore.updateComposer(id, { isSending: false, minimized: false });
        this.composeStore.bringComposerToFront(id);
        // A hook that threw refused nothing on purpose, so say so — an aborted
        // send with no explanation reads as the button not working.
        if (presendFailed > 0) {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: this.i18nStore?.t('composer.presendFailed'), duration: 5000 }
          }));
        }
        return;
      }

      // sendDraft THROWS for a refusal, which the catch below reports — but it
      // RETURNS false for a 401, and that answer was discarded. So an expired
      // session ran the composer:send hook (carddav saved every recipient as a
      // contact for a message that never went out) and closed the window. The
      // message itself is kept by compose-store on expiry; this must not act as
      // though it was sent.
      const sent = await messageOperations.sendDraft(finalFormData);
      if (!sent) {
        this.composeStore.updateComposer(id, { isSending: false });
        return;
      }

      // The server deleted the draft this message was saved as. The re-sync
      // takes its row off the list, but a reader showing it, on its own or as
      // a card in a conversation, is told as a discard tells it
      // (alps-message-reader's `_handleDraftDiscarded`): it stayed open on the
      // deleted draft, still offering Edit Draft.
      if (currentInstance.draftUid && currentInstance.draftMailbox) {
        window.dispatchEvent(new CustomEvent('draft-discarded', {
          detail: { mailbox: currentInstance.draftMailbox, uid: String(currentInstance.draftUid) }
        }));
      }

      registry.invokeHook('composer:send', { recipients: allTo });

      // Drafts is not read again for the draft the send deleted: the sync
      // sendDraft started re-reads the folder on screen, which is Drafts when
      // Drafts is open. A read of Drafts made here took the listing there, so
      // Drafts' rows went up under whatever folder was open, and polling read
      // Drafts after it.
      this.composeStore.closeComposer(id);
    } catch (err: any) {
      if (err instanceof MissingUploadsError) {
        // Nothing was sent. The window comes back with those files listed
        // as ones to add again; it is unsaved now, so the autosave stores
        // the rest of the draft without them.
        this.composeStore.updateComposer(id, { isSending: false, minimized: false, expanded: false });
        this._bringToFront();
        this._markUploadsGone(id, err.uuids);
        return;
      }
      Logger.error('Failed to send message:', err);
      // Bring back the composer window if it was minimized or hidden
      this.composeStore.updateComposer(id, { isSending: false, minimized: false, expanded: false });
      this._bringToFront();
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: this.i18nStore?.t('composer.sendError', { error: err.message }),
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
        if (this.isConnected && this.composer && (this.composer as any).focusEditor) {
          (this.composer as any).focusEditor();
        }
      }, 0);
    });
  }

  /** attachment-utils is not a component, so the translation is resolved here
   * and handed down. */
  private _attachmentsTooLarge(): string {
    return this.i18nStore?.t('composer.attachmentsTooLarge')
      || 'Attachments exceed the maximum allowed size.';
  }

  /** What the composer's files take of its budget. One to add again is held
   * by no upload, so it takes none: counted, adding it again could be refused
   * as too large. */
  private _attachedBytes(): number {
    return (this.instance.attachments || []).reduce((sum, a) => sum + (a.missing ? 0 : (a.size || 0)), 0);
  }

  private _handleAttachClick() {
    const maxBytes = (this.settingsStore?.getState()?.maxAttachmentMiB || 32) * 1024 * 1024;
    const currentBytes = this._attachedBytes();

    handleAttachClick(
      this.instance.id,
      maxBytes,
      currentBytes,
      ...this._getUploadCallbacks(),
      this._attachmentsTooLarge()
    );
  }

  private _startUpload(files: File[]) {
    const maxBytes = (this.settingsStore?.getState()?.maxAttachmentMiB || 32) * 1024 * 1024;
    const currentBytes = this._attachedBytes();
    
    uploadFiles(
      files,
      this.instance.id,
      maxBytes,
      currentBytes,
      ...this._getUploadCallbacks(),
      this._attachmentsTooLarge()
    );
  }

  private _getUploadCallbacks(): [
    (tempId: string, file: File) => void,
    (tempId: string, progress: number) => void,
    (tempId: string, uuids: string[]) => void,
    (tempId: string, err: any) => void
  ] {
    return [
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
        // A file added again takes the place of its entry listed as one to
        // add again, which would otherwise stay, and keep Send refused. The
        // entry is kept with it, for an upload that fails to give back.
        const again = currentAttachments.findIndex(a => a.missing && a.filename === file.name && (!a.size || a.size === file.size));
        const attachments = again === -1
          ? [...currentAttachments, newAttachment]
          : currentAttachments.map((a, i) => (i === again ? { ...newAttachment, _replaces: a } : a));
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
          delete newAtt._replaces;
          attachments[idx] = newAtt;
          this.composeStore.updateComposer(this.instance.id, { attachments });

          const latestComposer = this.composeStore.getComposer(this.instance.id);
          const stillUploading = (latestComposer?.attachments || []).some(a => a.uploading);
          // Saved once the last of the files picked together is in, as the
          // close waits for. A save per finished upload rewrote the whole
          // draft once per file, each time larger. The others' progress keeps
          // re-arming the autosave timer, so the draft is saved here, and the
          // timer saves it first only if the remaining uploads stall or fail.
          if (stillUploading) return;
          if (latestComposer?.closing) {
            void this._finishDeferredClose();
          } else {
            this._saveDraft();
          }
        }
      },
      (tempId, err) => {
        // onError
        Logger.error('Failed to upload attachment:', err);
        const composer = this.composeStore.getComposer(this.instance.id);
        const currentAttachments = composer?.attachments || [];
        const attachments = [...currentAttachments];
        const idx = attachments.findIndex(a => a._tempId === tempId);
        if (idx !== -1) {
          // A file being added again is still one to add again.
          const replaced = attachments[idx]._replaces;
          if (replaced) attachments[idx] = replaced;
          else attachments.splice(idx, 1);
          this.composeStore.updateComposer(this.instance.id, { attachments });
        }

        const latestComposer = this.composeStore.getComposer(this.instance.id);
        const stillUploading = (latestComposer?.attachments || []).some(a => a.uploading);
        if (latestComposer?.closing && !stillUploading) {
          void this._finishDeferredClose();
        } else if (!latestComposer?.closing) {
          // A toast, not `alert()`. This file already raises toasts for every
          // other failure, and a modal native dialog blocks the composer the
          // user is still working in.
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: {
              message: this.i18nStore?.t('floatingComposer.uploadFailed', { error: err.message || this.i18nStore?.t('floatingComposer.unknownError') }),
              duration: 6000
            }
          }));
        }
      }
    ];
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

  private _handleDragOver = (e: DragEvent) => {
    if (this.instance.isSending || this.instance.minimized) return;
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = true;
  };

  private _handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;
  };

  private _handleDrop = (e: DragEvent) => {
    if (this.instance.isSending || this.instance.minimized) return;
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;
    window.dispatchEvent(new CustomEvent('alps-composer-drop'));

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      this._startUpload(files);
    }
  };

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
      transition: box-shadow 0.2s, border-color 0.2s;
    }

    .drag-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.85);
      z-index: 60;
      display: flex;
      padding: 16px;
      pointer-events: auto;
    }

    .drag-overlay * {
      pointer-events: none;
    }

    .drag-drop-zone {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px dashed var(--accent-color, #005A9E);
      border-radius: 8px;
      color: var(--accent-color, #005A9E);
      font-size: 16px;
      font-weight: 500;
      background: rgba(0, 90, 158, 0.05);
    }

    .drag-drop-zone svg {
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      fill: currentColor;
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
      /* By class, not by title: the titles are translated, so a selector on the
         English title matched only in English, and on a phone in any other
         language the full-screen composer kept minimize and expand buttons it
         has no use for. */
      .header-actions .minimize-btn,
      .header-actions .expand-btn {
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

    if (isMobile) {
      this.style.width = '100%';
      this.style.height = '100dvh';
      this.style.left = '0';
      this.style.top = '0';
    } else {
      this.style.width = `${widthPx}px`;
      this.style.height = `${heightPx}px`;
      this.style.left = `${leftPx}px`;
      this.style.top = `${topPx}px`;
    }

    if (this.instance.minimized) {
      this.setAttribute('minimized', '');
    } else {
      this.removeAttribute('minimized');
    }

    return html`
      ${this.instance.expanded ? html`<div class="backdrop"></div>` : ''}
      
      ${this.showDiscardConfirm ? html`
        <ui-confirm
          heading=${this.i18nStore?.t('floatingComposer.discardDraftTitle')}
          message=${this.i18nStore?.t('floatingComposer.discardDraftMessage')}
          confirmText=${this.i18nStore?.t('floatingComposer.discard')}
          cancelText=${this.i18nStore?.t('general.cancel')}
          .isDanger=${true}
          @confirm=${this._confirmDiscard}
          @cancel=${this._cancelDiscard}
        ></ui-confirm>
      ` : ''}

      <div class="window-frame ${this.isDragOver ? 'drag-over' : ''}" 
           @mousedown=${this._bringToFront}
           @dragover=${this._handleDragOver}
           @drop=${this._handleDrop}>
        
        ${this.isDragOver && !this.instance.isSending ? html`
          <div class="drag-overlay" @dragleave=${this._handleDragLeave}>
            <div class="drag-drop-zone">
              <svg viewBox="0 0 256 256">
                <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216ZM128,112a8,8,0,0,0-8,8v44.69l-22.34-22.35a8,8,0,0,0-11.32,11.32l36,36a8,8,0,0,0,11.32,0l36-36a8,8,0,0,0-11.32-11.32L136,164.69V120A8,8,0,0,0,128,112Z"></path>
              </svg>
              <span>${this.i18nStore?.t('floatingComposer.dropFiles')}</span>
            </div>
          </div>
        ` : ''}

        ${this.instance.isSending ? html`
          <div class="sending-overlay">
            <alps-loader></alps-loader>
          </div>
        ` : ''}
        
        <div class="header" @click=${this._handleHeaderClick}>
          <div class="header-title">${this.instance.subject || this.i18nStore?.t('floatingComposer.newMessage')}</div>
          <div class="header-actions">
            ${this.isSaving ? html`<span class="saving-indicator">${this.i18nStore?.t('floatingComposer.saving')}</span>` : (this.instance.draftUid && !this.instance.dirty) ? html`<span class="saving-indicator">${this.i18nStore?.t('floatingComposer.autosaved')}</span>` : ''}
            <alps-icon-btn 
              class="minimize-btn"
              title="${this.instance.minimized ? this.i18nStore?.t('floatingComposer.restore') : this.i18nStore?.t('floatingComposer.minimize')}" 
              icon="${this.instance.minimized ? 'caretUp' : 'composerMinimize'}"
              @click=${(e: Event) => { e.stopPropagation(); this._toggleMinimize(); }}>
            </alps-icon-btn>
            <alps-icon-btn 
              class="expand-btn"
              title="${this.instance.expanded ? this.i18nStore?.t('floatingComposer.restore') : this.i18nStore?.t('floatingComposer.expand')}" 
              icon="${this.instance.expanded ? 'arrowsInSimple' : 'arrowsOutSimple'}"
              @click=${(e: Event) => { e.stopPropagation(); this._toggleExpand(); }}>
            </alps-icon-btn>
            <alps-icon-btn 
              title="${this.i18nStore?.t('floatingComposer.saveAndClose')}" 
              icon="x"
              @click=${(e: Event) => { e.stopPropagation(); this._handleCloseClick(); }}>
            </alps-icon-btn>
          </div>
        </div>

        <div class="content">
          <div class="field-row">
            <span class="field-label">${this.i18nStore?.t('floatingComposer.to')}</span>
            <alps-address-input 
              class="address-input"
              label=${this.i18nStore?.t('floatingComposer.to')}
              .addresses=${this.instance.to || []}
              @addresses-changed=${(e: CustomEvent) => this.composeStore.updateComposer(this.instance.id, { to: e.detail.addresses })}
              ?disabled=${this.instance.isSending}
            ></alps-address-input>
            ${!this.showCc || !this.showBcc ? html`
              <div class="cc-bcc-toggles">
                ${!this.showCc ? html`<span @click=${() => this.showCc = true}>${this.i18nStore?.t('floatingComposer.cc')}</span>` : ''}
                ${!this.showBcc ? html`<span @click=${() => this.showBcc = true}>${this.i18nStore?.t('floatingComposer.bcc')}</span>` : ''}
              </div>
            ` : ''}
          </div>

          ${this.showCc ? html`
            <div class="field-row">
              <span class="field-label">${this.i18nStore?.t('floatingComposer.cc')}</span>
              <alps-address-input 
                class="address-input"
                label=${this.i18nStore?.t('floatingComposer.cc')}
                .addresses=${this.instance.cc || []}
                @addresses-changed=${(e: CustomEvent) => this.composeStore.updateComposer(this.instance.id, { cc: e.detail.addresses })}
                ?disabled=${this.instance.isSending}
              ></alps-address-input>
            </div>
          ` : ''}

          ${this.showBcc ? html`
            <div class="field-row">
              <span class="field-label">${this.i18nStore?.t('floatingComposer.bcc')}</span>
              <alps-address-input 
                class="address-input"
                label=${this.i18nStore?.t('floatingComposer.bcc')}
                .addresses=${this.instance.bcc || []}
                @addresses-changed=${(e: CustomEvent) => this.composeStore.updateComposer(this.instance.id, { bcc: e.detail.addresses })}
                ?disabled=${this.instance.isSending}
              ></alps-address-input>
            </div>
          ` : ''}

          <div class="field-row">
            <input 
              dir="auto"
              class="field-input" 
              placeholder=${this.i18nStore?.t('floatingComposer.subject')} 
              .value=${this.instance.subject || ''}
              @input=${(e: any) => this.composeStore.updateComposer(this.instance.id, { subject: e.target.value })}
              @keydown=${this._handleSubjectKeydown}
              ?disabled=${this.instance.isSending}
            />
          </div>

          <div class="composer-wrapper">
            <alps-message-composer
              .isSending=${this.instance.isSending}
              .text=${this.instance.text || ''}
              .htmlText=${this.instance.html || ''}
              .format=${this.instance.format || 'html'}
              .quoteSource=${this.instance.quoteSource}
              @text-changed=${(e: CustomEvent) => this.composeStore.updateComposer(
                this.instance.id,
                { text: e.detail.text, html: e.detail.html },
                // An `initial` change is the composer's own, made as it opens:
                // the HTML part of a plain-text draft, or the paragraph the
                // editor adds after a quote. Neither is an edit.
                { edit: !e.detail.initial },
              )}
            ></alps-message-composer>
          </div>

          <alps-attachment-list
            .attachments=${
              // Inline parts are the quote's own images, carried so its cid:
              // references resolve. As chips the user would see files they never
              // attached. Removal looks the entry up in the full list, so the
              // filtered one is fine to hand over.
              (this.instance.attachments || []).filter((a: any) => !a.inline)
            }
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
                title=${this.i18nStore?.t('floatingComposer.toggleFormatting')} 
                icon="textAa"
                @click=${this._toggleFormat}>
              </alps-icon-btn>
              <alps-icon-btn 
                title=${this.i18nStore?.t('floatingComposer.attachFiles')} 
                icon="paperclip"
                @click=${this._handleAttachClick}>
              </alps-icon-btn>
              ${(this.instance.format || 'html') === 'html' ? html`
                <alps-popup id="linkPopup" align="left" position="top">
                  <alps-icon-btn slot="trigger" title=${this.i18nStore?.t('floatingComposer.insertLink')} icon="linkSimple" @mousedown=${(e: Event) => e.preventDefault()} @click=${this._handleLinkClick}></alps-icon-btn>
                  <div class="popup-form" @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._handleLinkSubmit(); }}>
                    ${this.linkPromptFields.map(f => html`
                      <div class="field-group">
                        <!-- A label's "for" cannot reach the input inside alps-input's shadow root, so a click on the label focuses the field here. -->
                        <label @click=${() => this._linkPromptFieldElements().find(field => field.inputId === f.id)?.focus()}>${f.label}</label>
                        <alps-input inputId=${f.id} label=${f.label} type="text" placeholder=${f.placeholder}></alps-input>
                      </div>
                    `)}
                    <div class="popup-actions">
                      <alps-button variant="text" @click=${() => (this.shadowRoot?.querySelector('#linkPopup') as AlpsPopup)?.close()}>${this.i18nStore?.t('general.cancel')}</alps-button>
                      <alps-button variant="normal" @click=${this._handleLinkSubmit}>${this.i18nStore?.t('floatingComposer.apply')}</alps-button>
                    </div>
                  </div>
                </alps-popup>
              ` : ''}
              
              ${registry.invokeHook('composer:toolbar', { composer: this, instance: this.instance })?.filter(Boolean)}
              
              <alps-emoji-selector-popup position="top" @emoji-selected=${(e: CustomEvent) => this.composer?.insertEmoji(e.detail.emoji)}>
                <alps-icon-btn slot="trigger" title=${this.i18nStore?.t('floatingComposer.insertEmoji')} icon="smiley"></alps-icon-btn>
              </alps-emoji-selector-popup>
            </div>
            <div class="send-actions">
              <alps-button variant="text" @click=${(e: Event) => { e.stopPropagation(); this._handleDiscardClick(); }}>
                ${this.i18nStore?.t('floatingComposer.discard')}
              </alps-button>
              <alps-button variant="primary" @click=${this._handleSend} ?disabled=${this.instance.isSending || !canSend}>
                ${this.i18nStore?.t('floatingComposer.send')}
              </alps-button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
