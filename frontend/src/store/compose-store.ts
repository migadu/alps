import { createContext } from '@lit/context';
import { messageOperations, MissingUploadsError } from '../services/message-operations';
import { activeUsername, ownAddress, readUserSettings } from './settings-store';
import { abortUploads } from '../utils/attachment-utils';
import { Logger } from '../utils/logger';
import { appendReplyFields } from '../utils/reply-context';
import { escapeHtml } from '../utils/html-sanitizer';
import { DraftFlushError } from '../utils/draft-flush-error';
import { canonicalRecipient } from '../utils/address-display';

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

/**
 * A recipient field as a send or a draft save posts it, each address's domain
 * in its A-label form (see canonicalRecipient). The pills keep what was typed.
 */
export const recipientField = (addrs?: string[]): string => (addrs || []).map(canonicalRecipient).join(', ');

/**
 * What a draft save stores of a composer: the message, not where its window
 * sits or how far an upload has got. Two composers with the same key would
 * save the same draft.
 */
export const draftContentKey = (c: ComposerInstance): string => JSON.stringify([
  c.subject, c.to, c.cc, c.bcc, c.text, c.format, c.html,
  (c.attachments || []).map(a => [a._tempId, a.uuid, a.partPath, a.filename]),
]);

/**
 * An attachment whose upload the server no longer holds, as one the user has
 * to add again: shown with its name, and sent with nothing, so a save or a
 * send no longer names an upload that is gone.
 */
export const uploadGone = (att: any): any => {
  const gone = { ...att, missing: true };
  delete gone.uuid;
  return gone;
};

/**
 * Apply a save's source mapping to the attachments still in the composer.
 * Uploads are consumed and old part paths are replaced on every save, even
 * when edits made during the request leave the composer open and dirty.
 * Keep additions and removals made while the request was out.
 */
export const reconcileSavedAttachments = (latest: any[], sent: any[], stored: any[]): any[] => {
  const sourceKey = (a: any): string | undefined => a.uuid ? `uuid:${a.uuid}` : a.partPath ? `part:${a.partPath}` : undefined;
  const sentKeys = new Set(sent.map(sourceKey));
  const storedFrom = new Map<string, any>();
  for (const { source, ...part } of stored) {
    const key = source && sourceKey(source);
    if (key) storedFrom.set(key, part);
  }
  return latest.map(a => {
    const key = sourceKey(a);
    return (key && sentKeys.has(key) && storedFrom.get(key)) || a;
  });
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

/**
 * The message a quote's `cid:` images belong to, so the composer can show
 * them: a forwarded original, or the draft a forward was saved into. A reply
 * quotes no such images, since it carries none of the original's parts.
 */
export interface QuoteSource {
  mailbox: string;
  uid: string;
  structure?: unknown;
}

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
  quoteSource?: QuoteSource;
  dirty?: boolean;
  draftUid?: string;
  draftMailbox?: string;
  inReplyTo?: string;
  references?: string[];
  replyMailbox?: string;
  replyUid?: string;
  isSending?: boolean;
  /** A save of this draft is on the wire, by its window or by the sign-out flush. */
  isSaving?: boolean;
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

  /**
   * Set when a sign-out goes ahead past a failed flush (see
   * {@link DraftFlushError.keepRecoveryCopy}), and consumed by the very next
   * `session-cleared`. While set, that sign-out empties the screen but leaves
   * the stored drafts on disk, under this account's key, for its next sign-in.
   */
  private keepDraftsOnSignOut = false;

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
   * `session-cleared` carrying `reason: 'expired'` — the screen only. So does
   * a sign-out that went ahead although its flush could not store every draft
   * (the idle timeout, or a user who confirmed): those drafts exist nowhere
   * else, so the disk copy stays under this account's key, where only this
   * account's next sign-in reads it.
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
    const keep = expired || this.keepDraftsOnSignOut;
    this.keepDraftsOnSignOut = false;
    const key = this.username && !keep ? draftsKeyFor(this.username) : null;
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
            // An upload the tab went away in never finished. One already in the
            // stored draft (a part path, as each save answers) is kept: dropped
            // here, the next save, which carries only what the window lists,
            // stored the draft without it. One uploaded but not yet saved was
            // kept by the session it was uploaded in, and this may be another,
            // after the session expired: kept, it made every save and the send
            // fail. So it is listed as one to add again; so is one that was
            // being added again when the tab went away.
            attachments: (draft.attachments || [])
              .map(att => (att.uploading && att._replaces ? att._replaces : att))
              .filter(att => !att.uploading && (att.uuid || att.partPath || att.missing))
              .map(att => (att.uuid ? uploadGone(att) : att)),
            isSending: false,
            // A save or a deferred close the tab or the session went away in.
            // Kept, it would refuse every later save, or hide the window.
            isSaving: false,
            closing: false,
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
      // The signature is plain text, typed into a textarea: escaped, so an
      // address in angle brackets or an ampersand reads as written instead of
      // as markup, with its line breaks kept.
      const sigHtml = `<div class="alps-signature">-- <br>${escapeHtml(signature).replace(/\r?\n/g, '<br>')}</div>`;
      
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
      // Against the current revision, not the opening text: once a draft is
      // saved, the opening text is not what is stored, and an edit back to it
      // is an edit. Nor is the text the whole message: a switch between rich
      // and plain text, or bold over unchanged words, changes what is saved
      // and sent while the text stays the same.
      //
      // Except while the composer is pristine, never stored and never edited.
      // Its opening text is then the only baseline, and whitespace at its
      // edges, such as the newline a stray Enter leaves, is not an edit: an
      // opened but unanswered reply is not worth filing as a draft.
      const pristine = !c.dirty && !c.draftUid;
      if ('text' in updates && (updates.text || '') !== (c.text || '') &&
          !(pristine && (updates.text || '').trim() === (c.initialText || '').trim())) isDirtyUpdate = true;
      if ('format' in updates && updates.format !== c.format) isDirtyUpdate = true;
      if ((updates.format ?? c.format) === 'html' && 'html' in updates &&
          (updates.html || '') !== (c.html || '')) isDirtyUpdate = true;

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
   *
   * With nothing open it does nothing, not even announce a change. The login
   * page calls this as it connects, inside the shell's render, and the
   * change it announced regardless had the shell render the login screen a
   * second time.
   */
  clearAllComposers() {
    if (this.state.activeComposers.length === 0) return;
    this.state = { ...this.state, activeComposers: [] };
    this.notify();
  }

  /**
   * Saves every dirty composer, closing each one the server stored, and
   * throws a {@link DraftFlushError} when any could not be stored.
   *
   * The only caller is sign-out. This used to empty every composer whatever
   * the saves answered, and sign-out then deleted the drafts key outright, so
   * a draft that failed to reach the server (offline, a 500, a full mailbox)
   * was destroyed from the screen and from localStorage at once, and the
   * login screen could only report it lost. A composer still sending in its
   * undo window, or still uploading, was "saved" without what made it so.
   *
   * Now a composer that cannot be stored stays open, and so does its copy on
   * disk: one sending, saving, closing behind an upload, or still uploading,
   * and one whose save failed or that was edited while its save was out. The
   * rest still go, one at a time, because the idle sign-out goes ahead
   * whatever this answers, and every draft that can reach the server should.
   * The error carries the hook that keeps the copy through the sign-out.
   */
  async saveAllDirtyDrafts(): Promise<void> {
    // Decided afresh by each sign-out, never inherited from one that did not
    // happen.
    this.keepDraftsOnSignOut = false;
    const username = this.username;
    let failed = false;
    try {
      for (const id of this.state.activeComposers.map(c => c.id)) {
        // Signed out, or someone else signed in, during a save: nothing here
        // is this flush's to store any more.
        if (this.username !== username) throw new DraftFlushError();
        const composer = this.getComposer(id);
        if (!composer) continue;
        if (composer.isSending || composer.isSaving || composer.closing || composer.attachments?.some(a => a.uploading || a.missing)) {
          // Missing placeholders exist only here and in localStorage, never
          // in the saved MIME draft. Even a clean autosaved composer must
          // retain them until the user adds the files again or removes them.
          failed = true;
          continue;
        }
        // Only what was touched: an opened but unanswered reply is not filed
        // as a draft, and a draft already saved is on the server.
        if (!composer.dirty) {
          this.closeComposer(id);
          continue;
        }
        const hasRecipient = (composer.to?.length || 0) > 0 || (composer.cc?.length || 0) > 0 || (composer.bcc?.length || 0) > 0;
        const textIsJustInitial = composer.text?.trim() === composer.initialText?.trim();
        const hasContent = !textIsJustInitial || (composer.subject?.trim().length || 0) > 0;
        // Nothing to save only in a message never stored: a stored draft
        // emptied to blank is saved, as its window saves it, or Drafts keeps
        // what the user took out.
        if (!composer.draftUid && !hasRecipient && !hasContent && !(composer.attachments && composer.attachments.length > 0)) {
          this.closeComposer(id);
          continue;
        }

        const contentKey = draftContentKey(composer);
        this.updateComposer(id, { isSaving: true });
        try {
          let saved: Awaited<ReturnType<typeof messageOperations.saveDraft>>;
          try {
            saved = await messageOperations.saveDraft(this.draftForm(composer));
          } catch (error) {
            if (!(error instanceof MissingUploadsError)) throw error;
            // Kept open, listing those files as ones to add again, so the
            // window's next save stores the rest without them.
            const gone = new Set(error.uuids);
            const current = this.getComposer(id);
            if (current) {
              this.updateComposer(id, {
                attachments: (current.attachments || []).map(a => (a.uuid && gone.has(a.uuid) ? uploadGone(a) : a)),
              });
            }
            saved = null;
          }
          if (this.username !== username) throw new DraftFlushError();
          if (!saved) {
            failed = true;
            continue;
          }
          const current = this.getComposer(id);
          if (current && draftContentKey(current) !== contentKey) {
            // Stored, but not as it is now: record the stored draft, so the
            // next save replaces it, without marking the newer edit clean.
            this.updateComposer(id, {
              draftUid: saved.uid,
              draftMailbox: saved.mailbox,
              ...(saved.attachments && {
                attachments: reconcileSavedAttachments(current.attachments || [], composer.attachments || [], saved.attachments),
              }),
            });
            failed = true;
            continue;
          }
          this.closeComposer(id);
        } finally {
          if (this.getComposer(id)) this.updateComposer(id, { isSaving: false });
        }
      }
      if (failed || this.state.activeComposers.length > 0) throw new DraftFlushError();
    } catch (error) {
      if (!(error instanceof DraftFlushError)) Logger.error('Failed to save drafts before signing out', error);
      this.saveDrafts();
      // The keep hook only while the account the flush began for is still
      // the one signed in: armed for another, it would spare the wrong
      // account's drafts.
      throw new DraftFlushError(this.username === username && username !== null
        ? () => this.retainDraftsForSignOut(username)
        : undefined);
    }
  }

  /**
   * The keep hook a failed flush hands its caller. Writes the composers as
   * they are now, since the user may have edited one between the failure and
   * a confirmed sign-out and `handleSessionCleared` cancels the debounced
   * writer, and marks the coming `session-cleared` as one that leaves them.
   */
  private retainDraftsForSignOut(username: string): void {
    if (this.username !== username) return;
    if (this.saveTimeout !== null) {
      window.clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.saveDrafts();
    this.keepDraftsOnSignOut = true;
  }

  /** A composer as the form a draft save posts. */
  private draftForm(composer: ComposerInstance): FormData {
    const formData = new FormData();
    let bcc = [...(composer.bcc || [])];
    let replyToSetting = '';
    {
      // Same correction as the composer defaults above: `bccMyself`,
      // `loginUsername` and `replyTo` all live in the per-user record, never
      // in `alps_settings`, so "BCC myself" and a custom Reply-To silently
      // did nothing on every message sent.
      const sendSettings = readUserSettings();
      // The address, not the login: see ownAddress.
      const self = ownAddress(sendSettings);
      if (sendSettings.bccMyself && self && !bcc.some(addr => bareAddress(addr) === bareAddress(self))) {
        bcc.push(self);
      }
      if (sendSettings.replyTo) {
        replyToSetting = sendSettings.replyTo;
      }
    }

    formData.append('to', recipientField(composer.to));
    formData.append('cc', recipientField(composer.cc));
    formData.append('bcc', recipientField(bcc));
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
    appendReplyFields(formData, composer);
    return formData;
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
