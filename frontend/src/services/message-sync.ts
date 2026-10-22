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
  /**
   * The mailbox `Messages` were read from, stamped here from the read's own
   * request rather than from {@link MessageSyncService.setContext}, which has
   * moved on by the time a superseded read could land. A folder switch keeps
   * the previous folder's rows on screen until the new ones arrive, and a row
   * is drawn by the rules of the folder it came from.
   */
  ListedMailbox?: string;
  /** The counts the listing was read at, of the mailbox and of the Inbox. */
  Mailbox?: { NumMessages?: number; NumUnseen?: number } | null;
  Inbox?: { NumMessages?: number; NumUnseen?: number } | null;
}

/** A folder's counts, as a status check answers them. */
interface Counts {
  total: number;
  unseen: number;
}

/**
 * The lock the tab that polls holds. Every tab of a session shares one
 * connection to the mail server, and each polled on its own: one poll per tab,
 * one after another on that connection, and one chime per tab for the same
 * arrival.
 */
const POLL_LOCK = 'alps-mail-poll';

/** How old what a tab shows may be when it comes back into view, before it is checked. */
const STALE_ON_SHOW_MS = 60 * 1000;

/**
 * How old a listing may be before a poll reads it again, whatever the counts
 * say. Unchanged counts do not prove an unchanged listing: a star or a label
 * set in another tab or another program moves neither count, nor does mail
 * filed into a folder other than the Inbox and the one on screen (whose count
 * the sidebar shows), and a body search can have missed a message the server
 * had not yet indexed when the counts moved.
 *
 * It is the server's default cache lifetime. When every poll read the
 * listing, that cache answered most of them, and the mail server was read
 * again about this often.
 */
const RELIST_AFTER_MS = 10 * 60 * 1000;

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
   * The view the last landed listing was of, the counts it was read at, when
   * it landed (`read`), and when it was last found current (`at`: when it
   * landed, or when a check found the counts it was read at). A poll whose
   * counts match does not read the listing again until it is due
   * ({@link relistDue}).
   */
  private heard: { view: string; inbox: Counts | null; mailbox: Counts | null; read: number; at: number } | null = null;

  /** The check a tab that came into view started, while it is out. */
  private shownCheck: Promise<boolean> | null = null;

  /** The minutes between polls, 0 for none. */
  private pollMinutes = 0;
  /** This tab holds the poll lock; `releaseLead` gives it up. */
  private leading = false;
  private releaseLead: (() => void) | null = null;
  private seekingLead = false;

  constructor() {
    super();
    // Signing out does not reload the page, and the next user's mail page
    // listens on this same service. A read still out when the session ended
    // is the previous user's mail: its tickets are taken here so that it
    // cannot land. The next page's first listing supersedes a listing, but
    // nothing superseded the folder list a create or rename re-reads, and it
    // became the next user's sidebar.
    window.addEventListener('session-cleared', () => {
      this.currentFetchId++;
      this.currentLabelsId++;
      this.listed = false;
      this.heard = null;
    });
  }

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
   *
   * Only one tab polls: the one holding {@link POLL_LOCK}, which the next tab
   * waiting for it takes over when that tab closes or leaves the mail page. It
   * polls hidden as well, since new-mail sounds and notifications come from its
   * polls. The other tabs check when they come back into view (see
   * {@link handleShown}). A browser without `navigator.locks` polls from every
   * tab, as before.
   */
  start(minutes: number = 5) {
    this.stopTimer();
    this.pollMinutes = minutes;
    if (minutes <= 0) {
      this.giveUpLead();
      this.watchShown(false);
      return;
    }
    this.watchShown(true);
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    if (!locks || this.leading) {
      this.startTimer();
      return;
    }
    if (this.seekingLead) return;
    this.seekingLead = true;
    locks.request(POLL_LOCK, () => new Promise<void>((release) => {
      this.seekingLead = false;
      // Stopped while waiting its turn.
      if (this.pollMinutes <= 0) {
        release();
        return;
      }
      this.leading = true;
      this.releaseLead = () => {
        this.leading = false;
        this.releaseLead = null;
        release();
      };
      this.startTimer();
    })).catch((err) => {
      this.seekingLead = false;
      Logger.error('Failed to take the poll lock', err);
      // Polled from here, as without `navigator.locks`, rather than from no
      // tab at all.
      if (this.pollMinutes > 0 && !this.leading) this.startTimer();
    });
  }

  /**
   * Stops background polling.
   */
  stop() {
    this.pollMinutes = 0;
    this.stopTimer();
    this.giveUpLead();
    this.watchShown(false);
  }

  private startTimer() {
    this.stopTimer();
    this.interval = setInterval(() => void this.backgroundSync({ scheduled: true }), this.pollMinutes * 60 * 1000);
  }

  private stopTimer() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private giveUpLead() {
    this.releaseLead?.();
  }

  /**
   * Whether what this tab finds is announced with a sound or a notification:
   * it is the tab that polls, or no tab polls and the reader's own check is
   * the only one there is. Another tab that polls has announced the same
   * arrival, or will.
   */
  private get announces(): boolean {
    return this.interval !== null || this.pollMinutes <= 0;
  }

  private watching = false;

  private watchShown(on: boolean) {
    if (on === this.watching || typeof document === 'undefined') return;
    this.watching = on;
    if (on) {
      document.addEventListener('visibilitychange', this.handleShown);
      window.addEventListener('focus', this.handleShown);
    } else {
      document.removeEventListener('visibilitychange', this.handleShown);
      window.removeEventListener('focus', this.handleShown);
    }
  }

  /**
   * A tab come back into view, or into focus, checks for new mail at once
   * when what it shows is more than a minute old: the tab that polls may be
   * another, and a poll may be minutes away. Only over a view that has landed;
   * a read on its way will bring the news itself.
   *
   * Announced only from the tab that polls: the arrival was, or will be,
   * chimed there.
   *
   * One switch to the tab fires both `visibilitychange` and `focus`. The
   * second is not sent while the first is out: it would take the first one's
   * place after its status request had already gone to the server.
   */
  private handleShown = () => {
    if (this.shownCheck || document.hidden || !this.listed || !this.heard) return;
    if (Date.now() - this.heard.at < STALE_ON_SHOW_MS) return;
    this.shownCheck = this.backgroundSync({ announce: this.announces })
      .finally(() => { this.shownCheck = null; });
  };

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
      data.ListedMailbox = mailbox;
      this.hear(mailbox, page, query, data);
      this.dispatchEvent(new CustomEvent('sync-success', { detail: { data, background: false, quiet } }));
    } catch (err) {
      if (this.currentFetchId !== fetchId) return;
      Logger.error('Failed to fetch mailbox data', err);

      await settle();
      if (this.currentFetchId !== fetchId) return; // Re-check after artificial delay

      this.dispatchEvent(new CustomEvent('sync-error', { detail: { error: err, background: false, quiet } }));
    }
  }

  private viewKey(mailbox: string, page: number, query: string): string {
    return [mailbox, page, query].join('\0');
  }

  /** A listing of the view landed, read at the counts it carries. */
  private hear(mailbox: string, page: number, query: string, data: MailboxData) {
    const now = Date.now();
    this.heard = {
      view: this.viewKey(mailbox, page, query),
      inbox: countsOf(data.Inbox),
      mailbox: countsOf(data.Mailbox),
      read: now,
      at: now,
    };
  }

  /**
   * Whether a listing that landed at `read` is to be read again, its counts
   * unchanged, by a check that started at `started`. A poll on the timer
   * reads it at the poll nearest {@link RELIST_AFTER_MS} after it, not the
   * first one past it; any other check (the check-for-new-mail button, a tab
   * come back into view) once it is that old.
   *
   * Polls start a whole interval apart, but a listing lands some way into
   * its poll, after the status checks and its own round trip, and a timer
   * can fire late, a hidden tab's in particular. Without slack, the poll ten
   * minutes on finds the listing a moment short of ten minutes old, and at
   * the default five-minute interval a view is read again every fifteen
   * minutes, not every ten. Half an interval absorbs both. A check off the
   * timer runs at any moment, and with the slack of a long interval it would
   * read a listing seconds old again.
   */
  private relistDue(read: number, started: number, scheduled: boolean): boolean {
    const slack = scheduled ? Math.max(this.pollMinutes, 0) * 60 * 1000 / 2 : 0;
    return started - read >= RELIST_AFTER_MS - slack;
  }

  /** A folder's counts as the server reads them now; null when it does not say. */
  private async askCounts(mailbox: string): Promise<Counts | null> {
    const response = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/status`);
    if (!response.ok) return null;
    const body = await response.json().catch(() => null);
    if (typeof body?.total !== 'number' || typeof body?.unseen !== 'number') return null;
    return { total: body.total, unseen: body.unseen };
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
    if (await this.backgroundSync({ announce: this.announces })) return;
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
   * One that found the counts the view was read at, and read nothing more,
   * ends on `sync-unchanged`.
   *
   * `announce: false` asks the page not to chime or notify for what it finds
   * (see {@link announces}). `scheduled` marks the poll on the timer (see
   * {@link relistDue}).
   */
  private async backgroundSync({ announce = true, scheduled = false }: { announce?: boolean; scheduled?: boolean } = {}): Promise<boolean> {
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
    const started = Date.now();
    try {
      let inbox: Counts | null = null;
      if (mailbox !== FOLDER_INBOX) {
        inbox = await this.askCounts(FOLDER_INBOX).catch(() => null);
      }
      if (this.currentFetchId !== fetchId) return true;
      const counts = await this.askCounts(mailbox);
      if (this.currentFetchId !== fetchId) return true;

      // The listing is read again only when the counts moved since it was
      // read, or it is due for its age (relistDue). It was read on every
      // poll, a search run again in full each time, and the answers to the
      // checks were never looked at. A search across every folder has no
      // counts of its own to go by, and is read as before. So is a view whose
      // read is still on its way: this poll has taken its place, and is the
      // answer the page waits for.
      const heard = this.heard;
      const unchanged = heard !== null && this.listed
        && heard.view === this.viewKey(mailbox, page, query)
        && sameCounts(counts, heard.mailbox)
        && (mailbox === FOLDER_INBOX || sameCounts(inbox, heard.inbox));
      if (heard && unchanged && !this.relistDue(heard.read, started, scheduled)) {
        heard.at = Date.now();
        // Announced whoever asked: a check this poll took the place of left
        // its chip waiting for this one's end.
        this.dispatchEvent(new CustomEvent('sync-unchanged', { detail: { background: true } }));
        return true;
      }

      let url = `/mailboxes/${encodeMailboxPath(mailbox)}?page=${page}`;
      if (query) url += `&query=${encodeURIComponent(query)}`;
      // Read again for its age alone, and past the server's caches. They
      // kept the page when this view was last read, and live about as long
      // as RELIST_AFTER_MS: often they would still answer with that page,
      // and what changed since would wait for the next round.
      if (unchanged) url += '&refresh=true';

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
      data.ListedMailbox = mailbox;
      this.hear(mailbox, page, query, data);
      this.dispatchEvent(new CustomEvent('sync-success', { detail: { data, background: true, announce } }));
      return true;
    } catch (err) {
      if (this.currentFetchId !== fetchId) return true;
      Logger.error('Background sync failed', err);
      return false;
    }
  }
}

function countsOf(status: MailboxData['Mailbox']): Counts | null {
  if (typeof status?.NumMessages !== 'number' || typeof status?.NumUnseen !== 'number') return null;
  return { total: status.NumMessages, unseen: status.NumUnseen };
}

/** Whether a check's answer is the counts held; neither unknown. */
function sameCounts(answer: Counts | null, held: Counts | null): boolean {
  return !!answer && !!held && answer.total === held.total && answer.unseen === held.unseen;
}

export const messageSync = new MessageSyncService();
