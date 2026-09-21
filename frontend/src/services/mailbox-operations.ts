import { fetchWithTimeout } from '../utils/fetch-utils';
import { messageSync } from './message-sync';
import { encodeMailboxPath } from '../utils/folders';
import { Logger } from '../utils/logger';

/**
 * The outcome of a folder mutation.
 *
 * Tri-state, not a boolean, because the two failures mean different things to a
 * user: `exists` is "pick another name" and is by far the most likely way these
 * calls fail, while `failed` is "try again later". Collapsing both into `false`
 * left the UI with nothing to say, and what it said was nothing — the create
 * path did not even read the result.
 *
 * Note there is no truthy success value, deliberately: a caller that writes
 * `if (await createMailbox(…))` would read `'failed'` as success, so every call
 * site has to compare explicitly.
 */
export type MailboxMutation = 'ok' | 'exists' | 'failed';

/**
 * What emptying a folder did.
 *
 * `discarded` is how many messages the server found to discard, and zero is a
 * real answer: the folder was already empty and this request removed nothing.
 * It used to be indistinguishable from a real emptying — both were `true` —
 * and the success message that followed was a claim the list on screen could
 * contradict.
 *
 * `timeout` is separated from `failed` for the same reason: the request gave
 * up, the server very likely did not.
 */
export type EmptyOutcome =
  | { ok: true; discarded?: number }
  | { ok: false; reason: 'auth' | 'not_discardable' | 'timeout' | 'failed' };

/** Ten minutes. Long enough for an expunge over a folder nobody has emptied in
 * years, short enough that a wedged connection still ends in an answer. */
const EMPTY_MAILBOX_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * NOT an EventTarget.
 *
 * It extended one and dispatched `auth-error` on itself beside every
 * `window.dispatchEvent` of the same name — and nothing has ever called
 * `addEventListener` on this service. Only `messageSync` has real
 * subscribers. The window dispatch is what app-root actually hears, so the
 * self-dispatches were inert and the base class was there to support them.
 */
export class MailboxOperationsService {

  /** Maps the backend's slug-and-status answer onto {@link MailboxMutation}.
   * `already_exists` comes from `respondMailboxError` in the Go handlers, which
   * reads it off IMAP's `[ALREADYEXISTS]` response code. */
  private async classify(res: Response, what: string): Promise<MailboxMutation> {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('auth-error'));
      return 'failed';
    }
    if (res.ok) return 'ok';
    if (res.status === 409) return 'exists';
    Logger.error(`Failed to ${what}`, res.status);
    return 'failed';
  }

  async createMailbox(name: string): Promise<MailboxMutation> {
    try {
      const formData = new URLSearchParams();
      formData.append('name', name);
      
      const res = await fetchWithTimeout('/mailboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      const outcome = await this.classify(res, 'create mailbox');
      // The folder list, and only that: a new folder is empty, and no message
      // left the one on screen to be in it.
      if (outcome === 'ok') void messageSync.syncLabels();
      return outcome;
    } catch (err) {
      Logger.error('Failed to create mailbox', err);
      return 'failed';
    }
  }

  async renameMailbox(oldName: string, newName: string): Promise<MailboxMutation> {
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(oldName)}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: newName })
      });

      const outcome = await this.classify(res, 'rename mailbox');
      if (outcome === 'ok') {
        // Still first, though the folder-list read below no longer depends on
        // it: what this fixes is the name the POLL will ask for, which is the
        // one the server has just stopped answering for if the renamed folder
        // is the one on screen. See `messageSync.mailboxRenamed`.
        messageSync.mailboxRenamed(oldName, newName);
        // A rename moves no mail. The rows on screen are the same messages
        // under a folder that is now spelled differently.
        void messageSync.syncLabels();
      }
      return outcome;
    } catch (err) {
      Logger.error('Failed to rename mailbox', err);
      return 'failed';
    }
  }

  async deleteMailbox(name: string): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(name)}`, {
        method: 'DELETE'
      });

      const outcome = await this.classify(res, 'delete mailbox');
      if (outcome === 'ok') {
        // A full sync, unlike create and rename: deleting the folder on screen
        // sends the view to the Inbox, so there IS a page of mail to read —
        // a different folder's. `mailboxDeleted` points the service at it
        // first, so that the sync asks for the Inbox and not for the mailbox
        // the server has just dropped.
        messageSync.mailboxDeleted(name);
        messageSync.sync();
      }
      return outcome === 'ok';
    } catch (err) {
      Logger.error('Failed to delete mailbox', err);
      return false;
    }
  }

  /**
   * Emptying a folder is ONE request that may run for minutes.
   *
   * The server takes it as a single IMAP conversation — SELECT, STORE \Deleted
   * over the whole mailbox, EXPUNGE — with nothing to report until the expunge
   * returns, and an expunge of tens of thousands of messages is not a
   * 25-second job. On the default budget the browser aborted a delete that was
   * working: the abort cancels the request context, so the backend drops its
   * connection and never invalidates its caches, while the expunge it started
   * runs to completion regardless. The user is told the empty failed, the list
   * is never re-read, and the folder quietly empties behind them — which reads
   * as "nothing happened, so I pressed it again".
   *
   * So the deadline is the folder's, not the default one. A timeout is still
   * reported, and reported as its own thing: the work is probably still going
   * on upstream, and "try again" is the wrong advice.
   */
  async emptyMailbox(name: string): Promise<EmptyOutcome> {
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(name)}/empty`, {
        method: 'POST'
      }, EMPTY_MAILBOX_TIMEOUT_MS);

      if (res.status === 401) {
        // Announced by fetchWithTimeout; the shell is already on its way to the
        // login screen, so the caller says nothing.
        return { ok: false, reason: 'auth' };
      }

      if (res.ok) {
        // The count is the whole point of reading this body: a 200 says the
        // server has nothing left to complain about, not that it discarded
        // anything. An older backend sends no `discarded` at all, and an empty
        // that reported nothing is taken at its word rather than called a
        // no-op.
        let discarded: number | undefined;
        try {
          const body = await res.json();
          if (typeof body?.discarded === 'number') discarded = body.discarded;
        } catch {
          // A 200 with an unreadable body is still an empty that happened.
        }
        // A full sync too: emptying a folder is the one verb here that changes
        // what is in one, and every row it held is now gone.
        messageSync.sync();
        return { ok: true, discarded };
      }

      Logger.error('Failed to empty mailbox', res.status);
      return { ok: false, reason: res.status === 403 ? 'not_discardable' : 'failed' };
    } catch (err) {
      Logger.error('Failed to empty mailbox', err);
      if ((err as Error)?.name === 'AbortError') {
        // Read the folder again even though the request was abandoned. The
        // expunge is most likely still running or already done upstream, so
        // whatever the list shows next is nearer the truth than the rows the
        // client gave up holding — and a listing that succeeds also takes back
        // the offline notice the abort raised.
        messageSync.sync();
        return { ok: false, reason: 'timeout' };
      }
      return { ok: false, reason: 'failed' };
    }
  }

  /**
   * Subscribes or unsubscribes a folder, and says whether it happened.
   *
   * These were two boolean methods whose only caller — the folder menu — fired
   * them and never read the answer, so a refused (un)subscribe changed nothing
   * on screen and said nothing. `auth` is named so the caller can stay quiet
   * while the shell shows the login screen, as every other report does.
   */
  async setSubscribed(name: string, subscribed: boolean): Promise<{ ok: boolean; reason?: 'auth' | 'failed' }> {
    const verb = subscribed ? 'subscribe' : 'unsubscribe';
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(name)}/${verb}`, { method: 'PUT' });
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return { ok: false, reason: 'auth' };
      }
      if (res.ok) {
        // Which folders are listed, not what is in them. Unsubscribing the
        // folder being viewed hides it from the sidebar and leaves its mail on
        // screen, which is what it did before and is the server's answer too.
        void messageSync.syncLabels();
        return { ok: true };
      }
      Logger.error(`Failed to ${verb} mailbox`, res.status);
      return { ok: false, reason: 'failed' };
    } catch (err) {
      Logger.error(`Failed to ${verb} mailbox`, err);
      return { ok: false, reason: 'failed' };
    }
  }
}

export const mailboxOperations = new MailboxOperationsService();
