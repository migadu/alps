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
      // Trigger a sync to refresh mailbox list
      if (outcome === 'ok') messageSync.sync();
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
        // BEFORE the sync, which re-reads whatever mailbox this service is
        // pointed at: if that is this one, the name it holds is the one the
        // server has just stopped answering for. See `messageSync.mailboxRenamed`.
        messageSync.mailboxRenamed(oldName, newName);
        messageSync.sync();
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
        // Same ordering as the rename above, for the same reason.
        messageSync.mailboxDeleted(name);
        messageSync.sync();
      }
      return outcome === 'ok';
    } catch (err) {
      Logger.error('Failed to delete mailbox', err);
      return false;
    }
  }

  async emptyMailbox(name: string): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(name)}/empty`, {
        method: 'POST'
      });
      
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return false;
      }
      
      if (res.ok) {
        messageSync.sync();
        return true;
      }
      return false;
    } catch (err) {
      Logger.error('Failed to empty mailbox', err);
      return false;
    }
  }

  async subscribeMailbox(name: string): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(name)}/subscribe`, {
        method: 'PUT'
      });
      
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return false;
      }
      
      if (res.ok) {
        messageSync.sync();
        return true;
      }
      return false;
    } catch (err) {
      Logger.error('Failed to subscribe mailbox', err);
      return false;
    }
  }

  async unsubscribeMailbox(name: string): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(name)}/unsubscribe`, {
        method: 'PUT'
      });
      
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return false;
      }
      
      if (res.ok) {
        messageSync.sync();
        return true;
      }
      return false;
    } catch (err) {
      Logger.error('Failed to unsubscribe mailbox', err);
      return false;
    }
  }
}

export const mailboxOperations = new MailboxOperationsService();
