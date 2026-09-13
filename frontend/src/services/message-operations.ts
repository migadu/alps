import { messageSync } from './message-sync';
import { fetchWithTimeout } from '../utils/fetch-utils';
import { FLAG_SEEN } from '../utils/flags';
import { encodeMailboxPath } from '../utils/folders';
import { Logger } from '../utils/logger';

/**
 * The largest UID list a single request may carry.
 *
 * Matches `maxFlagUIDs` in `plugins/base/routes.go`, which now refuses a larger
 * one with 413 rather than handing the IMAP session a STORE it may not survive.
 * Every ordinary selection is well under this, so the common case is still one
 * round trip; only a select-everything gesture is split.
 *
 * Sequential on purpose: an IMAP session is single-threaded, so parallel chunks
 * would only queue — and a sequential failure leaves a clean prefix (chunks
 * before it committed, nothing after), which the callers rely on to decide
 * whether to re-sync.
 */
export const BATCH_MAX_UIDS = 500;

function chunkUids(uids: string[]): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < uids.length; i += BATCH_MAX_UIDS) {
    chunks.push(uids.slice(i, i + BATCH_MAX_UIDS));
  }
  return chunks;
}

/** A body that may not be JSON — a proxy's HTML 502 page, an empty 413 — read
 * without letting the parse failure replace the status we actually care about.
 * `await res.json()` on an error path used to throw a SyntaxError that the
 * caller then surfaced as "Unexpected token '<'" in place of the real problem. */
async function readErrorBody(res: Response): Promise<Record<string, any>> {
  try {
    return (await res.json()) ?? {};
  } catch {
    return {};
  }
}

/**
 * NOT an EventTarget.
 *
 * It extended one and dispatched `auth-error` on itself beside every
 * `window.dispatchEvent` of the same name — and nothing has ever called
 * `addEventListener` on this service. Only `messageSync` has real
 * subscribers. The window dispatch is what app-root actually hears, so the
 * self-dispatches were inert and the base class was there to support them.
 */
export class MessageOperationsService {
  /** True when the response was a 401; also announces it. Every verb in this
   * file repeated these four lines. */
  private isAuthError(res: Response): boolean {
    if (res.status !== 401) return false;
    window.dispatchEvent(new CustomEvent('auth-error'));
    return true;
  }

  /**
   * Sets or toggles a flag on specified messages.
   * action: 'add', 'remove', or 'set'
   *
   * Returns a reason rather than a bare boolean, because the backend can now
   * refuse a keyword it does not support (`unsupported_flags`) — and it used to
   * answer 200 OK for exactly that case, so the UI painted a tag the server
   * never stored and the next sync took it back with no error in between.
   */
  async setFlag(mailbox: string, uids: string[], flags: string[], action: 'add' | 'remove' | 'set'): Promise<FlagResult> {
    if (!uids || uids.length === 0) return { ok: false, reason: 'empty' };
    let applied = 0;
    try {
      for (const chunk of chunkUids(uids)) {
        const res = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/messages/flag`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uids: chunk,
            flags,
            action
          })
        });
        if (this.isAuthError(res)) return { ok: false, reason: 'auth', applied };
        if (!res.ok) {
          const body = await readErrorBody(res);
          const reason = body.error === 'unsupported_flags' ? 'unsupported' : 'failed';
          Logger.error('Failed to set flag', res.status, body);
          return { ok: false, reason, applied, rejected: body.rejected };
        }
        applied += chunk.length;
      }
      return { ok: true, applied };
    } catch (err) {
      Logger.error('Failed to set flag', err);
      return { ok: false, reason: 'failed', applied };
    }
  }


  /**
   * Marks a message as read by adding the \Seen flag.
   */
  async markAsRead(mailbox: string, message: any): Promise<any> {
    const uid = message?.UID;
    if (!uid) return message;
    
    // Don't do anything if it's already read
    if (message.Flags?.includes(FLAG_SEEN)) {
      return message;
    }
    
    const { ok: success } = await this.setFlag(mailbox, [String(uid)], [FLAG_SEEN], 'add');
    if (success) {
      const newMsg = { ...message };
      newMsg.Flags = [...(newMsg.Flags || []), FLAG_SEEN];
      return newMsg;
    }
    return message;
  }







  /**
   * Permanently deletes multiple messages.
   */
  async deleteMessagesResult(mailbox: string, uids: string[]): Promise<DeleteResult> {
    if (!uids || uids.length === 0) return { ok: false, reason: 'empty' };
    let deleted = 0;
    try {
      for (const chunk of chunkUids(uids)) {
        const res = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/messages`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uids: chunk })
        });
        if (this.isAuthError(res)) return { ok: false, reason: 'auth' };
        if (!res.ok) {
          Logger.error('Failed to delete messages', res.status, await readErrorBody(res));
          // A mid-walk failure follows chunks that ALREADY committed, so the
          // list on screen is wrong either way and has to be re-read.
          if (deleted > 0) messageSync.sync();
          return { ok: false, reason: 'failed' };
        }
        deleted += chunk.length;
      }
      messageSync.sync();
      return { ok: true };
    } catch (err) {
      Logger.error('Failed to delete messages', err);
      if (deleted > 0) messageSync.sync();
      return { ok: false, reason: 'failed' };
    }
  }

  /**
   * The boolean form, which every existing caller reads — deliberately NOT
   * widened to an object. `if (await deleteMessages(...))` is how four call
   * sites branch, and an object is always truthy: widening this would have made
   * every failed delete read as a success, with no type error anywhere (review
   * doc, recurring pattern #6). A caller that needs to know WHY a delete failed
   * — to stay quiet on an expired session — uses deleteMessagesResult instead.
   */
  async deleteMessages(mailbox: string, uids: string[]): Promise<boolean> {
    return (await this.deleteMessagesResult(mailbox, uids)).ok;
  }

  /**
   * Moves multiple messages to another mailbox.
   */
  async moveMessages(mailbox: string, uids: string[], to: string): Promise<MoveResult> {
    if (!uids || uids.length === 0) return { success: false, reason: 'empty' };
    let moved = 0;
    const uidMapping: Record<string, string> = {};
    try {
      for (const chunk of chunkUids(uids)) {
        const res = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/messages/move`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uids: chunk, to })
        });
        if (this.isAuthError(res)) return { success: false, reason: 'auth' };
        if (!res.ok) {
          Logger.error('Failed to move messages', res.status, await readErrorBody(res));
          if (moved > 0) messageSync.sync();
          return { success: false, reason: 'failed' };
        }
        // Read the body BEFORE the sync. The sync used to be kicked off first,
        // which put a fetch in flight against the mailbox we were still parsing
        // the move's answer out of, for no benefit.
        const data = await readErrorBody(res);
        Object.assign(uidMapping, data.uidMapping ?? {});
        moved += chunk.length;
      }
      messageSync.sync();
      return { success: true, uidMapping };
    } catch (err) {
      Logger.error('Failed to move messages', err);
      if (moved > 0) messageSync.sync();
      return { success: false, reason: 'failed' };
    }
  }

  /**
   * Copies multiple messages to another mailbox.
   */
  async copyMessages(mailbox: string, uids: string[], to: string): Promise<MoveResult> {
    if (!uids || uids.length === 0) return { success: false, reason: 'empty' };
    let copied = 0;
    try {
      for (const chunk of chunkUids(uids)) {
        const res = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/messages/copy`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uids: chunk, to })
        });
        if (this.isAuthError(res)) return { success: false, reason: 'auth' };
        if (!res.ok) {
          Logger.error('Failed to copy messages', res.status, await readErrorBody(res));
          if (copied > 0) messageSync.sync();
          return { success: false, reason: 'failed' };
        }
        copied += chunk.length;
      }
      messageSync.sync();
      return { success: true };
    } catch (err) {
      Logger.error('Failed to copy messages', err);
      if (copied > 0) messageSync.sync();
      return { success: false, reason: 'failed' };
    }
  }

  /**
   * Marks multiple messages as read.
   */
  async markMessagesAsRead(mailbox: string, uids: string[]): Promise<boolean> {
    if (!uids || uids.length === 0) return false;
    const { ok } = await this.setFlag(mailbox, uids, [FLAG_SEEN], 'add');
    return ok;
  }

  /**
   * Marks multiple messages as unread.
   */
  async markMessagesAsUnread(mailbox: string, uids: string[]): Promise<boolean> {
    if (!uids || uids.length === 0) return false;
    const { ok } = await this.setFlag(mailbox, uids, [FLAG_SEEN], 'remove');
    return ok;
  }

  /**
   * Saves a composer instance as a draft on the server.
   */
  async saveDraft(formData: FormData): Promise<{ uid: string; mailbox: string; size?: number; attachments?: any[] } | null> {
    try {
      const res = await fetchWithTimeout('/messages', {
        method: 'POST',
        body: formData
      });
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return null;
      }
      if (res.ok) {
        const data = await res.json();
        return { uid: data.draft_uid, mailbox: data.draft_mailbox, size: data.draft_size, attachments: data.attachments };
      }
      Logger.error('Failed to save draft:', res.status, await readErrorBody(res));
      return null;
    } catch (err) {
      Logger.error('Failed to save draft:', err);
      return null;
    }
  }

  /**
   * Sends a composer instance message.
   */
  async sendDraft(formData: FormData): Promise<boolean> {
    try {
      const res = await fetchWithTimeout('/messages', {
        method: 'POST',
        body: formData
      });
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return false;
      }
      if (res.ok) {
        messageSync.sync();
        return true;
      }
      // Guarded: `await res.json()` on a proxy's HTML 502 threw a SyntaxError
      // that the catch below rethrew, so the user was shown "Unexpected token
      // '<'" in place of whatever actually went wrong.
      const body = await readErrorBody(res);
      throw new Error(body.error || `Failed to send message (${res.status})`);
    } catch (err: any) {
      Logger.error('Failed to send message:', err);
      throw err;
    }
  }
}

/**
 * What a flag write did.
 *
 * `applied` counts the UIDs in chunks that committed before a failure, so a
 * caller can tell a refusal that changed nothing from one that changed most of
 * a large selection — the distinction a bare `false` threw away.
 */
export interface FlagResult {
  ok: boolean;
  /** Why it failed. `unsupported` is the server refusing the keyword itself, so
   * retrying cannot help and the optimistic paint has to be reverted. */
  reason?: 'empty' | 'auth' | 'unsupported' | 'failed';
  applied?: number;
  /** The keywords the server would not store, when it said so. */
  rejected?: string[];
}

/** A move, and why it did not happen. `reason` is additive: `success` means
 * exactly what it always did, so existing `if (result.success)` callers are
 * unaffected. `auth` matters because isAuthError has already sent the user to
 * the login screen — a failure toast then would flash over it. */
export interface MoveResult {
  success: boolean;
  uidMapping?: Record<string, string>;
  reason?: 'empty' | 'auth' | 'failed';
}

/** As MoveResult, for deletes — shaped like FlagResult above. */
export interface DeleteResult {
  ok: boolean;
  reason?: 'empty' | 'auth' | 'failed';
}

export const messageOperations = new MessageOperationsService();
