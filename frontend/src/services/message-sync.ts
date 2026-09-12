import { fetchWithTimeout } from '../utils/fetch-utils';
import { FOLDER_INBOX, encodeMailboxPath, isDescendantMailbox } from '../utils/folders';
import { Logger } from '../utils/logger';

export interface MailboxData {
  Username?: string;
  Page?: number;
  Total?: number;
  MessagesPerPage?: number;
  Mailboxes?: any[];
  Messages?: any[];
}

export class MessageSyncService extends EventTarget {
  private interval: ReturnType<typeof setInterval> | null = null;
  private currentMailbox: string = FOLDER_INBOX;
  private currentPage: number = 0;
  private currentQuery: string = '';

  /**
   * Updates the current context for background polling.
   */
  setContext(mailbox: string, page: number, query: string = '') {
    this.currentMailbox = mailbox;
    this.currentPage = page;
    this.currentQuery = query;
  }

  /**
   * Starts background polling every N minutes.
   * If minutes <= 0, background polling is disabled.
   */
  start(minutes: number = 5) {
    this.stop();
    if (minutes <= 0) return;
    const ms = minutes * 60 * 1000;
    this.interval = setInterval(() => this.backgroundSync(), ms);
  }

  /**
   * Stops background polling.
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * The folder on screen has been renamed.
   *
   * Called BEFORE the sync that follows a rename, because the sync re-reads
   * whatever mailbox this service is pointed at — and if that is the folder
   * just renamed, the name it holds is the one the IMAP server has stopped
   * answering for. The poll then 404s and the view reports the folder missing,
   * a moment before the UI navigates to the new name anyway.
   */
  mailboxRenamed(oldName: string, newName: string) {
    if (this.currentMailbox === oldName) {
      this.currentMailbox = newName;
    } else if (this.currentMailbox.startsWith(oldName)) {
      // A child of the renamed folder moves with its parent. Guarded by the
      // delimiter so renaming `Arch` does not claim `Archive`.
      const rest = this.currentMailbox.slice(oldName.length);
      if (/^[^A-Za-z0-9]/.test(rest)) {
        this.currentMailbox = newName + rest;
      }
    }
  }

  /**
   * The folder on screen has been deleted. Same ordering rule as
   * {@link mailboxRenamed}: point the poll somewhere that still exists before
   * it runs, rather than letting it ask for a mailbox that is gone.
   */
  mailboxDeleted(name: string) {
    if (this.currentMailbox === name || isDescendantMailbox(this.currentMailbox, name)) {
      this.currentMailbox = FOLDER_INBOX;
      this.currentPage = 0;
    }
  }

  /**
   * Forces an immediate sync using the current context.
   */
  sync() {
    this.fetch(this.currentMailbox, this.currentPage, this.currentQuery, true);
  }

  /**
   * Forces an immediate sync if the user is currently viewing the specified mailbox.
   */
  syncIfViewing(mailbox: string) {
    if (this.currentMailbox === mailbox) {
      this.sync();
    }
  }

  private currentFetchId: number = 0;

  /**
   * Fetches data immediately. Used for initial load, pagination, or manual refresh.
   */
  async fetch(mailbox: string, page: number, query: string = '', checkStatus: boolean = false) {
    this.setContext(mailbox, page, query);
    const fetchId = ++this.currentFetchId;

    this.dispatchEvent(new CustomEvent('sync-start', { detail: { background: false } }));
    const startTime = Date.now();

    try {
      let url = `/mailboxes/${encodeMailboxPath(mailbox)}?page=${page}`;
      if (query) url += `&query=${encodeURIComponent(query)}`;
      if (checkStatus) url += `&refresh=true`;

      const response = await fetchWithTimeout(url);
      if (this.currentFetchId !== fetchId) return; // Prevent race conditions

      if (response.status === 401) {
        this.dispatchEvent(new CustomEvent('auth-error'));
        window.dispatchEvent(new CustomEvent('auth-error'));
        return;
      }

      if (response.status === 404) {
        this.dispatchEvent(new CustomEvent('mailbox-not-found'));
        return;
      }

      const data: MailboxData = await response.json();
      if (this.currentFetchId !== fetchId) return; // Re-check after json parsing

      const elapsed = Date.now() - startTime;
      if (elapsed < 200) {
        await new Promise(r => setTimeout(r, 200 - elapsed));
      }
      if (this.currentFetchId !== fetchId) return; // Re-check after artificial delay

      this.dispatchEvent(new CustomEvent('sync-success', { detail: { data, background: false } }));
    } catch (err) {
      if (this.currentFetchId !== fetchId) return;
      Logger.error('Failed to fetch mailbox data', err);

      const elapsed = Date.now() - startTime;
      if (elapsed < 200) {
        await new Promise(r => setTimeout(r, 200 - elapsed));
      }
      if (this.currentFetchId !== fetchId) return; // Re-check after artificial delay

      this.dispatchEvent(new CustomEvent('sync-error', { detail: { error: err, background: false } }));
    }
  }

  /**
   * Background sync invoked by the interval.
   */
  private async backgroundSync() {
    // The poll takes a ticket from the same counter the foreground fetch uses.
    //
    // It did not, and nothing else made the two agree, so a background response
    // that landed after the user had clicked into another folder dispatched
    // `sync-success` with the PREVIOUS folder's messages — the list snapping
    // back to what you just navigated away from, once every polling interval.
    const fetchId = ++this.currentFetchId;
    const mailbox = this.currentMailbox;
    const page = this.currentPage;
    const query = this.currentQuery;
    try {
      if (mailbox !== FOLDER_INBOX) {
        await fetchWithTimeout(`/mailboxes/${FOLDER_INBOX}/status`).catch(() => {});
      }
      if (this.currentFetchId !== fetchId) return;
      await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/status`);
      if (this.currentFetchId !== fetchId) return;

      let url = `/mailboxes/${encodeMailboxPath(mailbox)}?page=${page}`;
      if (query) url += `&query=${encodeURIComponent(query)}`;

      const response = await fetchWithTimeout(url);
      if (this.currentFetchId !== fetchId) return;

      if (response.status === 401) {
        this.dispatchEvent(new CustomEvent('auth-error'));
        window.dispatchEvent(new CustomEvent('auth-error'));
        return;
      }

      // The foreground path reports this; the poll used to fall through to
      // `response.json()` on the 404 body and die in the catch, so a folder
      // renamed or deleted in another tab left this one polling a mailbox that
      // no longer exists, silently, until the user clicked something.
      if (response.status === 404) {
        this.dispatchEvent(new CustomEvent('mailbox-not-found'));
        return;
      }

      const data: MailboxData = await response.json();
      if (this.currentFetchId !== fetchId) return;
      this.dispatchEvent(new CustomEvent('sync-success', { detail: { data, background: true } }));
    } catch (err) {
      if (this.currentFetchId !== fetchId) return;
      Logger.error('Background sync failed', err);
    }
  }
}

export const messageSync = new MessageSyncService();
