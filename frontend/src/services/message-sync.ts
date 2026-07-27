import { fetchWithTimeout } from '../utils/fetch-utils';
import { FOLDER_INBOX, encodeMailboxPath } from '../utils/folders';
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
    try {
      if (this.currentMailbox !== FOLDER_INBOX) {
        await fetchWithTimeout(`/mailboxes/${FOLDER_INBOX}/status`).catch(() => {});
      }
      await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(this.currentMailbox)}/status`);

      let url = `/mailboxes/${encodeMailboxPath(this.currentMailbox)}?page=${this.currentPage}`;
      if (this.currentQuery) url += `&query=${encodeURIComponent(this.currentQuery)}`;

      const response = await fetchWithTimeout(url);
      if (response.status === 401) {
        this.dispatchEvent(new CustomEvent('auth-error'));
        window.dispatchEvent(new CustomEvent('auth-error'));
        return;
      }
      const data: MailboxData = await response.json();
      this.dispatchEvent(new CustomEvent('sync-success', { detail: { data, background: true } }));
    } catch (err) {
      Logger.error('Background sync failed', err);
    }
  }
}

export const messageSync = new MessageSyncService();
