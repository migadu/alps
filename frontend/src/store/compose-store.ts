import { createContext } from '@lit/context';
import { messageOperations } from '../services/message-operations';
import { activeUsername, readUserSettings } from './settings-store';
import { abortUploads } from '../utils/attachment-utils';
import { Logger } from '../utils/logger';

/**
 * Where a user's unsent drafts are kept, scoped to WHOSE they are.
 *
 * They were kept under one shared `alps_compose_drafts` key, and nothing
 * removed it at sign-out — so the next person to sign in on this browser, or
 * the next linked account switched into, had the previous user's unsent
 * message restored into their composer: recipients, subject and body. Same
 * shape the settings store already uses for its per-user record.
 */
const draftsKeyFor = (username: string) => `alps_compose_drafts_${username}`;

/** The pre-scoping key. Read once, to delete: its contents cannot be attributed
 * to anyone, and handing them to whoever signs in next is the bug being fixed. */
const LEGACY_DRAFTS_KEY = 'alps_compose_drafts';

/** The mailbox inside a recipient pill, lower-cased: `"Me" <me@example.com>` and
 * `ME@example.com` are both `me@example.com`. For comparing two spellings of one
 * address, which an exact string match cannot do. */
export const bareAddress = (addr: string): string => {
  let rawEmail = addr.trim();
  if (rawEmail.endsWith('>')) {
    const startObj = rawEmail.lastIndexOf('<');
    if (startObj !== -1) {
      rawEmail = rawEmail.substring(startObj + 1, rawEmail.length - 1);
    }
  }
  return rawEmail.trim().toLowerCase();
};

const isBlockedAddress = (addr: string): boolean => {
  const lowerEmail = bareAddress(addr);
  return lowerEmail.startsWith('noreply') || 
         lowerEmail.startsWith('no-reply') || 
         lowerEmail.startsWith('mailer-daemon');
};

const filterAddresses = (addrs?: string[]): string[] | undefined => {
  if (!addrs) return addrs;
  return addrs.filter(addr => !isBlockedAddress(addr));
};

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
  [key: string]: any;
}

export interface ComposeState {
  activeComposers: ComposerInstance[];
}

export class ComposeStore extends EventTarget {
  private state: ComposeState = {
    activeComposers: []
  };
  
  private saveTimeout: number | null = null;

  /** Whose drafts are currently loaded. `null` before sign-in, and again after
   * sign-out — in which case nothing is persisted at all, rather than persisted
   * somewhere shared. */
  private username: string | null = null;

  constructor() {
    super();
    // Unattributable, so it is removed rather than adopted.
    try {
      localStorage.removeItem(LEGACY_DRAFTS_KEY);
    } catch { /* storage blocked; nothing to remove from */ }

    window.addEventListener('session-cleared', this.handleSessionCleared);
    // BOTH events, and the second is the one that actually carries the answer.
    //
    // `user-logged-in` fires the moment POST /session returns, and the identity
    // is not known then: the settings store is only just starting its own
    // `/settings` fetch, and `alps_active_user` is written when that lands. So
    // adopting on `user-logged-in` alone read a null username and stopped
    // there — drafts were neither restored on sign-in nor persisted for the
    // rest of the session, because `saveDrafts` returns early without one, and
    // nothing else re-ran this until a page reload.
    window.addEventListener('user-logged-in', this.adoptSession);
    window.addEventListener('alps-active-user-changed', this.adoptSession);
    this.adoptSession();
  }

  /**
   * Loads the signed-in user's drafts, and carries across anything opened
   * before we knew who they were.
   *
   * Only for the anonymous-to-known transition: a second identity signing in
   * must not inherit the first's windows, which is the whole point of the
   * scoping.
   */
  private adoptSession = () => {
    const username = activeUsername();
    if (username === this.username) return;

    const carried = this.username === null ? this.state.activeComposers : [];
    this.username = username;
    const restored = username ? this.loadDrafts(username) : [];
    this.state.activeComposers = username ? [...restored, ...carried] : [];
    this.notify();
  };

  /**
   * Sign-out: the drafts leave the screen AND the disk. Expiry — a
   * `session-cleared` carrying `reason: 'expired'` — the screen only.
   *
   * Cancelling the debounced writer is not tidiness — it is the difference
   * between erasing and appearing to. A save armed moments before the logout
   * would otherwise fire afterwards and write the composers straight back out,
   * restoring on disk exactly what this just removed.
   *
   * In-memory state is cleared BEFORE touching storage, because a browser with
   * site data blocked throws on the localStorage ACCESS rather than on the
   * operation — so the one path whose job is to leave nothing behind would
   * abort before emptying the composers, on precisely the locked-down or shared
   * machine where it matters.
   */
  private handleSessionCleared = (event?: Event) => {
    if (this.saveTimeout !== null) {
      window.clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    // An expired session is the same user, about to sign back in — not a
    // departure. Drafts are keyed by username, so keeping them cannot hand them to
    // anyone else on this browser; deleting them was simply data loss. Flush what
    // is on screen FIRST, while the identity is still known, so edits inside the
    // debounce window survive too — for a send interrupted by the 401 that is the
    // whole message. loadDrafts already drops half-finished uploads and resets
    // isSending on the way back in.
    const expired = (event as CustomEvent | undefined)?.detail?.reason === 'expired';
    if (expired) this.saveDrafts();
    const key = this.username && !expired ? draftsKeyFor(this.username) : null;
    this.username = null;
    // An upload still streaming would otherwise finish (or 401) into a composer
    // that no longer exists, and deposit its bytes in a server-side session that
    // is being torn down.
    for (const c of this.state.activeComposers) abortUploads(c.attachments || []);
    this.state.activeComposers = [];
    this.notify();
    if (key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        Logger.error('Failed to clear compose drafts', e);
      }
    }
  };

  private loadDrafts(username: string): ComposerInstance[] {
    try {
      const stored = localStorage.getItem(draftsKeyFor(username));
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
      Logger.error('Failed to parse compose drafts from localStorage', e);
    }
    return [];
  }

  private saveDrafts() {
    // No identity, no key that could safely be written — so nothing is
    // persisted, rather than persisted where the next user would find it.
    if (!this.username) return;
    try {
      localStorage.setItem(draftsKeyFor(this.username), JSON.stringify(this.state.activeComposers));
    } catch (e) {
      Logger.error('Failed to save compose drafts to localStorage', e);
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
    // Through the store's own reader. Parsing `alps_settings` by hand here
    // could never find these: that key holds only the seven theme/layout values
    // the settings store calls `globalSettings`, so `composeFormat` and
    // `signature` were both always undefined and both settings were inert.
    const userSettings = readUserSettings();
    if (userSettings.composeFormat === 'text') {
      defaultFormat = 'text';
    }
    if (userSettings.signature) {
      signature = userSettings.signature;
    }

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
      subject: '',
      format: initialData?.format || defaultFormat,

      attachments: [],
      zIndex: 1000 + this.state.activeComposers.length,
      ...initialData,
      to: filterAddresses(initialData?.to) || [],
      cc: filterAddresses(initialData?.cc) || [],
      bcc: filterAddresses(initialData?.bcc) || [],
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
    if (updates.to) updates.to = filterAddresses(updates.to);
    if (updates.cc) updates.cc = filterAddresses(updates.cc);
    if (updates.bcc) updates.bcc = filterAddresses(updates.bcc);

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
      // Deliberately not awaited, so the window closes at once. But the result
      // is no longer thrown away: a refused delete leaves the draft sitting in
      // the Drafts folder while the user has been shown it disappearing, and
      // they find it again only by going to look.
      void messageOperations
        .deleteMessagesResult(composer.draftMailbox, [String(composer.draftUid)])
        .then(result => {
          // Quiet on `auth`: the shell is already showing the login screen.
          if (!result.ok && result.reason !== 'auth') this.reportDiscardFailed();
        });
    }
    this.closeComposer(id);
  }

  /** Announced on the window: this store has no i18n context, and the toast
   * host does, so the key is resolved there. */
  private reportDiscardFailed() {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { i18nKey: 'composer.discardFailed', duration: 5000 }
    }));
  }

  /**
   * Takes the composer windows off the screen WITHOUT touching what is on disk.
   *
   * The only caller is `login-page`'s connectedCallback, which runs every time
   * the login screen mounts — including on an ordinary boot redirect, when
   * `app-root` finds no auth cookie and sends the browser to `#/login`. That
   * redirect dispatches no `session-cleared`, so this store still knows whose
   * drafts it holds.
   *
   * It used to call `saveDrafts()` here, which then wrote the emptied list over
   * that user's stored drafts. So a session cookie quietly expiring was enough
   * to destroy every unsent draft the user had: they reload, get bounced to the
   * login screen, sign back in, and the composers are gone.
   *
   * Persisting is the sign-out path's job, and it already does it properly —
   * `handleSessionCleared` removes the key outright, after aborting uploads.
   * Here, memory only.
   */
  clearAllComposers() {
    this.state = { ...this.state, activeComposers: [] };
    this.notify();
  }

  /**
   * Saves every dirty composer, and reports how many could NOT be saved.
   *
   * The result used to be discarded and `activeComposers` emptied regardless:
   *
   *     await messageOperations.saveDraft(formData);   // result ignored
   *     …
   *     this.state = { ...this.state, activeComposers: [] };
   *     this.saveDrafts();
   *
   * The only caller is sign-out, which then dispatches `session-cleared` and
   * deletes the drafts key outright. So a draft that failed to reach the server
   * — offline, a 500, a full mailbox — was destroyed in the same breath, from
   * the screen, from localStorage and from the server all at once, silently.
   * This is the third place this exact mistake lived; the other two were the
   * close button (e85d153) and the deferred close (63c1515).
   *
   * A local session that is ending cannot keep the draft, so the honest answer
   * is not to silently keep going: the count travels back and the caller tells
   * the user on the login screen they are about to land on.
   */
  async saveAllDirtyDrafts(): Promise<{ failed: number }> {
    let failed = 0;
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
        {
          // Same correction as the composer defaults above: `bccMyself`,
          // `loginUsername` and `replyTo` all live in the per-user record, never
          // in `alps_settings`, so "BCC myself" and a custom Reply-To silently
          // did nothing on every message sent.
          const sendSettings = readUserSettings();
          const self = sendSettings.loginUsername;
          if (sendSettings.bccMyself && self && !bcc.some(addr => bareAddress(addr) === bareAddress(self))) {
            bcc.push(self);
          }
          if (sendSettings.replyTo) {
            replyToSetting = sendSettings.replyTo;
          }
        }

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

        if (!(await messageOperations.saveDraft(formData))) failed++;
      }
    }
    this.state = { ...this.state, activeComposers: [] };
    this.saveDrafts();
    this.notify();
    return { failed };
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
