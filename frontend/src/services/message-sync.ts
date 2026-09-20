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
   * Whether a page for the CURRENT context has landed. False from the moment a
   * fetch re-points the context until its answer arrives, and for good if it
   * never does: until then the rows on hand are the previous view's, and
   * {@link check} must not let a quiet status probe vouch for them under the
   * new name.
   */
  private listed: boolean = false;

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
    this.interval = setInterval(() => void this.backgroundSync(), ms);
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
      // The rows on hand are the deleted folder's; nothing has been read of the
      // Inbox this service now points at.
      this.listed = false;
    }
  }

  /**
   * Forces an immediate sync using the current context. Run after a move, a
   * delete, a send — anything that changed the folder rather than asked about
   * it.
   *
   * Read in full, because it is not a question: the counts on every folder move
   * when a message is filed into one of them, and a status probe covers only
   * the Inbox and the folder on screen. Announced QUIETLY, though. The rows are
   * about to change because of something the user just did, and the dim that
   * announced them was the same half-second flash a folder switch makes, over
   * rows they were reading.
   */
  sync() {
    this.fetch(this.currentMailbox, this.currentPage, this.currentQuery, true, true);
  }

  /**
   * Forces an immediate sync if the user is currently viewing the specified mailbox.
   */
  syncIfViewing(mailbox: string) {
    if (this.currentMailbox === mailbox) {
      this.sync();
    }
  }

  /**
   * Re-reads the folder list alone, for the verbs that change which folders
   * exist rather than what is inside one.
   *
   * A create, a rename or a (un)subscribe moves no mail. `sync()` answered them
   * by re-listing a page of the folder on screen — a THREAD/SORT and a FETCH,
   * and a full repaint of rows that had not moved — to learn that a folder has
   * a new name. This asks the question that was actually raised.
   *
   * Announced on its OWN event, not `sync-success`. That one carries a page of
   * mail and everything the page infers from a page of mail: the arrival chime,
   * the list's failure flag, the open message's flags. None of it follows from a
   * folder list, and the chime in particular is gated on nothing but a count
   * that rose, so it would ring for a rename whenever mail happened to land
   * between the last poll and this read.
   *
   * Failure is logged and no more. The verb that called this already reported
   * its own outcome to the user; the folder list stays as it was until the next
   * poll, which is a stale count in the sidebar, not a lost answer.
   */
  async syncLabels(): Promise<void> {
    // Its own counter, not `currentFetchId`: this reads no messages, so it
    // neither supersedes a listing in flight nor is superseded by one. The
    // ticket is only so that of two renames in quick succession, the older
    // answer cannot land on top of the newer.
    const labelsId = ++this.currentLabelsId;
    try {
      const response = await fetchWithTimeout('/mailboxes');
      if (this.currentLabelsId !== labelsId) return;

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: MailboxData = await response.json();
      if (this.currentLabelsId !== labelsId) return;
      if (!data.Mailboxes) return;

      this.dispatchEvent(new CustomEvent('labels-success', { detail: { mailboxes: data.Mailboxes } }));
    } catch (err) {
      Logger.error('Failed to refresh folder list', err);
    }
  }

  private currentFetchId: number = 0;
  private currentLabelsId: number = 0;

  /**
   * Fetches data immediately. Used for initial load, pagination, or manual refresh.
   *
   * `quiet` keeps the answer in the foreground — it lands on whatever page is
   * being viewed, and it is not new mail — while asking the page not to dim the
   * rows for it. The floor below goes with the dim, so a quiet read skips it too.
   */
  async fetch(mailbox: string, page: number, query: string = '', checkStatus: boolean = false, quiet: boolean = false) {
    this.setContext(mailbox, page, query);
    this.listed = false;
    const fetchId = ++this.currentFetchId;

    this.dispatchEvent(new CustomEvent('sync-start', { detail: { background: false, quiet } }));
    const startTime = Date.now();

    // A dim shorter than the eye can read it is a flicker, so a foreground read
    // holds it for 200ms even when the answer came sooner. Nothing to hold when
    // nothing dimmed.
    const settle = async () => {
      if (quiet) return;
      const elapsed = Date.now() - startTime;
      if (elapsed < 200) await new Promise(r => setTimeout(r, 200 - elapsed));
    };

    try {
      let url = `/mailboxes/${encodeMailboxPath(mailbox)}?page=${page}`;
      if (query) url += `&query=${encodeURIComponent(query)}`;
      if (checkStatus) url += `&refresh=true`;

      const response = await fetchWithTimeout(url);
      if (this.currentFetchId !== fetchId) return; // Prevent race conditions

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return;
      }

      if (response.status === 404) {
        this.dispatchEvent(new CustomEvent('mailbox-not-found'));
        return;
      }

      const data: MailboxData = await response.json();
      if (this.currentFetchId !== fetchId) return; // Re-check after json parsing

      await settle();
      if (this.currentFetchId !== fetchId) return; // Re-check after artificial delay

      this.listed = true;
      this.dispatchEvent(new CustomEvent('sync-success', { detail: { data, background: false, quiet } }));
    } catch (err) {
      if (this.currentFetchId !== fetchId) return;
      Logger.error('Failed to fetch mailbox data', err);

      await settle();
      if (this.currentFetchId !== fetchId) return; // Re-check after artificial delay

      this.dispatchEvent(new CustomEvent('sync-error', { detail: { error: err, background: false, quiet } }));
    }
  }

  /**
   * The reader asked whether anything is new: the check-for-new-mail button.
   *
   * It was a `fetch`, and a fetch is a NAVIGATION. It announces itself in the
   * foreground, so the page dims the rows it is about to replace, and its
   * `refresh=true` drops the server's caches, so the mailbox is re-listed from
   * IMAP whatever it has to say. Pressed over a list that was already current,
   * which is nearly every press, that was a blink and a full THREAD/FETCH for
   * an answer of "nothing".
   *
   * The poll already asks this question the right way — a status probe first,
   * the page only when the counts moved — so the button asks it the same way.
   * What differs is that somebody is watching. The check is ANNOUNCED, in the
   * background so nothing dims, and it always ENDS: the chip that started it
   * spins until it hears an end, and a poll that fails says nothing to anybody.
   *
   * Three cases are still a fetch, each one where the rows on hand are not
   * something to check against: no read of this view has landed (a retry after
   * a failed load is this one), the view asked for is not the one held, and a
   * later page — the caller turns back to the first, where new mail is.
   */
  async check(mailbox: string, page: number, query: string = '') {
    const held = this.listed
      && page === 0 && this.currentPage === 0
      && mailbox === this.currentMailbox
      && query === this.currentQuery;
    if (!held) return this.fetch(mailbox, page, query, true);

    this.dispatchEvent(new CustomEvent('sync-start', { detail: { background: true } }));
    if (await this.backgroundSync()) return;
    // Logged where it failed. The rows on screen stand, as they do after any
    // background failure; this is only the end the chip is waiting for.
    this.dispatchEvent(new CustomEvent('sync-error', { detail: { error: null, background: true } }));
  }

  /**
   * Background sync invoked by the interval, and by {@link check}.
   *
   * Answers whether the sync is ACCOUNTED FOR: it dispatched an event, or
   * another fetch superseded it and will announce its own end. False is the
   * failure nobody hears about, which only `check` has a listener waiting on.
   */
  private async backgroundSync(): Promise<boolean> {
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
      if (this.currentFetchId !== fetchId) return true;
      await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/status`);
      if (this.currentFetchId !== fetchId) return true;

      let url = `/mailboxes/${encodeMailboxPath(mailbox)}?page=${page}`;
      if (query) url += `&query=${encodeURIComponent(query)}`;

      const response = await fetchWithTimeout(url);
      if (this.currentFetchId !== fetchId) return true;

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return true;
      }

      // The foreground path reports this; the poll used to fall through to
      // `response.json()` on the 404 body and die in the catch, so a folder
      // renamed or deleted in another tab left this one polling a mailbox that
      // no longer exists, silently, until the user clicked something.
      if (response.status === 404) {
        this.dispatchEvent(new CustomEvent('mailbox-not-found'));
        return true;
      }

      const data: MailboxData = await response.json();
      if (this.currentFetchId !== fetchId) return true;
      this.dispatchEvent(new CustomEvent('sync-success', { detail: { data, background: true } }));
      return true;
    } catch (err) {
      if (this.currentFetchId !== fetchId) return true;
      Logger.error('Background sync failed', err);
      return false;
    }
  }
}

export const messageSync = new MessageSyncService();
