import { createContext } from '@lit/context';
import { messageOperations } from '../services/message-operations';

export interface ComposerInstance {
  id: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  text?: string;
  html?: string;
  initialText?: string;
  initialHtml?: string;
  format?: 'html' | 'text';
  minimized?: boolean;
  expanded?: boolean;
  zIndex?: number;
  attachments?: any[];
  dirty?: boolean;
  draftUid?: string;
  draftMailbox?: string;
  inReplyTo?: string;
  isSending?: boolean;
  closing?: boolean;
}

export interface ComposeState {
  activeComposers: ComposerInstance[];
}

export class ComposeStore extends EventTarget {
  private state: ComposeState = {
    activeComposers: []
  };
  
  private saveTimeout: number | null = null;

  constructor() {
    super();
    this.state.activeComposers = this.loadDrafts();
  }

  private loadDrafts(): ComposerInstance[] {
    try {
      const stored = localStorage.getItem('alps_compose_drafts');
      if (stored) {
        const drafts: ComposerInstance[] = JSON.parse(stored);
        // Sanitize drafts: remove attachments that were interrupted during upload
        // Also reset isSending state, as any sending process was interrupted by the reload
        return drafts.map(draft => {
          const wasSending = draft.isSending;
          return {
            ...draft,
            attachments: draft.attachments?.filter(att => !att.uploading && att.uuid) || [],
            isSending: false,
            minimized: wasSending ? false : draft.minimized
          };
        });
      }
    } catch (e) {
      console.error('Failed to parse compose drafts from localStorage', e);
    }
    return [];
  }

  private saveDrafts() {
    try {
      localStorage.setItem('alps_compose_drafts', JSON.stringify(this.state.activeComposers));
    } catch (e) {
      console.error('Failed to save compose drafts to localStorage', e);
    }
  }

  private debouncedSaveDrafts() {
    if (this.saveTimeout !== null) {
      window.clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = window.setTimeout(() => {
      this.saveDrafts();
      this.saveTimeout = null;
    }, 500);
  }

  private notify() {
    this.dispatchEvent(new CustomEvent('change'));
  }

  get stateCopy(): ComposeState {
    return { ...this.state };
  }

  getComposer(id: string): ComposerInstance | undefined {
    return this.state.activeComposers.find(c => c.id === id);
  }

  getState(): ComposeState {
    return this.state;
  }

  openComposer(initialData?: Partial<ComposerInstance>) {
    if (initialData?.draftUid) {
      const existing = this.state.activeComposers.find(c => c.draftUid === initialData.draftUid);
      if (existing) {
        this.bringComposerToFront(existing.id);
        if (existing.minimized) {
          this.updateComposer(existing.id, { minimized: false });
        }
        return;
      }
    }

    const isMobile = window.innerWidth <= 768;

    if (isMobile && this.state.activeComposers.length >= 1) {
      const existingId = this.state.activeComposers[0].id;
      this.bringComposerToFront(existingId);
      return;
    }

    if (!isMobile && this.state.activeComposers.length >= 3) {
      return;
    }

    const id = 'composer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    let defaultFormat: 'html' | 'text' = 'html';
    let signature = '';
    try {
      const storedSettings = localStorage.getItem('alps_settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (parsed.composeFormat === 'text') {
          defaultFormat = 'text';
        }
        if (parsed.signature) {
          signature = parsed.signature;
        }
      }
    } catch (e) {}

    let initialText = initialData?.text || '';
    let initialHtml = initialData?.html || '';

    if (signature && !initialData?.draftUid) {
      const sigText = `-- \n${signature}`;
      const sigHtml = `<div class="alps-signature">-- <br>${signature.replace(/\n/g, '<br>')}</div>`;
      
      initialText = `\n\n${sigText}\n${initialText}`;
      if (initialHtml || initialData?.text) {
        initialHtml = `<br><br>${sigHtml}${initialHtml}`;
      } else {
        initialHtml = `<br><br>${sigHtml}`;
      }
    }

    const newComposer: ComposerInstance = {
      id,
      minimized: false,
      expanded: false,
      dirty: false,
      to: [],
      cc: [],
      bcc: [],
      subject: '',
      format: initialData?.format || defaultFormat,

      attachments: [],
      zIndex: 1000 + this.state.activeComposers.length,
      ...initialData,
      text: initialText,
      html: initialHtml,
      initialText: initialText,
      initialHtml: initialHtml
    };

    this.state = {
      ...this.state,
      activeComposers: [...this.state.activeComposers, newComposer]
    };
    this.saveDrafts();
    this.notify();
  }

  updateComposer(id: string, updates: Partial<ComposerInstance>) {
    const composers = this.state.activeComposers.map(c => {
      if (c.id !== id) return c;
      
      let isDirtyUpdate = false;
      if ('subject' in updates && updates.subject !== c.subject) isDirtyUpdate = true;
      if ('to' in updates && JSON.stringify(updates.to || []) !== JSON.stringify(c.to || [])) isDirtyUpdate = true;
      if ('cc' in updates && JSON.stringify(updates.cc || []) !== JSON.stringify(c.cc || [])) isDirtyUpdate = true;
      if ('bcc' in updates && JSON.stringify(updates.bcc || []) !== JSON.stringify(c.bcc || [])) isDirtyUpdate = true;
      if ('attachments' in updates && updates.attachments !== c.attachments) isDirtyUpdate = true;

      if (!isDirtyUpdate && !c.dirty) {
        if ('text' in updates || 'html' in updates) {
          const newText = 'text' in updates ? updates.text || '' : c.text || '';
          const initialText = c.initialText || '';
          if (newText.trim() !== initialText.trim()) {
            isDirtyUpdate = true;
          }
        }
      } else if (!isDirtyUpdate && c.dirty) {
         // if it's already dirty, check if the change should keep it dirty or if they deleted everything back to initial
         // We could revert dirty to false here if they erase their work, 
         // but let's just keep it dirty if it was already dirty unless we explicitly pass dirty: false
      }

      const newDirty = 'dirty' in updates ? updates.dirty : (isDirtyUpdate ? true : c.dirty);
      return { ...c, ...updates, dirty: newDirty };
    });
    this.state = { ...this.state, activeComposers: composers };
    this.debouncedSaveDrafts();
    this.notify();
  }

  closeComposer(id: string) {
    this.state = {
      ...this.state,
      activeComposers: this.state.activeComposers.filter(c => c.id !== id)
    };
    this.saveDrafts();
    this.notify();
  }

  discardDraft(id: string) {
    const composer = this.state.activeComposers.find(c => c.id === id);
    if (composer && composer.draftUid && composer.draftMailbox) {
      // Import and call messageOperations without waiting, so the UI closes immediately
      messageOperations.deleteMessages(composer.draftMailbox!, [String(composer.draftUid)]);
    }
    this.closeComposer(id);
  }

  clearAllComposers() {
    this.state = { ...this.state, activeComposers: [] };
    this.saveDrafts();
    this.notify();
  }

  async saveAllDirtyDrafts() {
    const dirtyComposers = this.state.activeComposers.filter(c => c.dirty);
    if (dirtyComposers.length > 0) {
      for (const composer of dirtyComposers) {
        const hasRecipient = (composer.to?.length || 0) > 0 || (composer.cc?.length || 0) > 0 || (composer.bcc?.length || 0) > 0;
        const textIsJustInitial = composer.text?.trim() === composer.initialText?.trim();
        const hasContent = !textIsJustInitial || (composer.subject?.trim().length || 0) > 0;
        if (!hasRecipient && !hasContent && !(composer.attachments && composer.attachments.length > 0)) continue;

        const formData = new FormData();
        let bcc = [...(composer.bcc || [])];
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

        formData.append('to', (composer.to || []).join(', '));
        formData.append('cc', (composer.cc || []).join(', '));
        formData.append('bcc', bcc.join(', '));
        if (replyToSetting) {
          formData.append('reply_to', replyToSetting);
        }
        formData.append('subject', (composer.subject || '').trim());
        formData.append('text', composer.text || '');
        if (composer.html && composer.format === 'html') {
          formData.append('html', composer.html);
        }
        formData.append('save_as_draft', '1');

        const attachments = composer.attachments || [];
        const uuids = attachments.map(a => a.uuid).filter(Boolean).join(',');
        if (uuids) formData.append('attachment-uuids', uuids);
        
        const prev = attachments.map(a => a.partPath).filter(Boolean).join(',');
        if (prev) formData.append('prev_attachments', prev);

        if (composer.draftMailbox) formData.append('draft_mailbox', composer.draftMailbox);
        if (composer.draftUid) formData.append('draft_uid', composer.draftUid);

        await messageOperations.saveDraft(formData);
      }
    }
    this.state = { ...this.state, activeComposers: [] };
    this.saveDrafts();
    this.notify();
  }

  bringComposerToFront(id: string) {
    let maxZ = 1000;
    this.state.activeComposers.forEach(c => {
      if (c.zIndex && c.zIndex > maxZ) maxZ = c.zIndex;
    });

    this.updateComposer(id, { zIndex: maxZ + 1 });
    // updateComposer already handles debouncedSaveDrafts and notify
  }
}

export const composeContext = createContext<ComposeStore>('compose-store');
