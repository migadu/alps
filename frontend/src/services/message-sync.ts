import { fetchWithTimeout } from '../utils/fetch-utils';
import { ALL_MAILBOXES, FOLDER_INBOX, encodeMailboxPath, isDescendantMailbox } from '../utils/folders';
import { Logger } from '../utils/logger';
import { mailboxOf, messageKey } from '../utils/message-key';

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
  Mailbox?: { NumMessages?: number; NumUnseen?: number; UIDNext?: number; UIDValidity?: number } | null;
  Inbox?: { NumMessages?: number; NumUnseen?: number; UIDNext?: number; UIDValidity?: number } | null;
}

/** A folder's counts, as a status check answers them. */
interface Counts {
  total: number;
  unseen: number;
  uidnext?: number;
  uidvalidity?: number;
}

/**
 * The lock the tab that polls holds. Every tab of a session shares one
 * connection to the mail server, and each polled on its own: one poll per tab,
 * one after another on that connection, and one chime per tab for the same
 * arrival.
 */
const POLL_LOCK = 'alps-mail-poll';
const POLL_CHANNEL = 'alps-mail-poll-counts';

interface PollPeer {
  peer: string;
  epoch: string;
  username: string;
  mailbox: string;
  visible: boolean;
  seen: number;
}

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
/** How many listings {@link MessageSyncService} keeps; the one read longest ago goes first. */
const MAX_KEPT_LISTINGS = 30;

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
  private leadRequest: AbortController | null = null;
  private lockFailed = false;
  private pollGeneration = 0;
  private pollBusy = false;
  private channel: BroadcastChannel | null = null;
  private readonly peerId = newPollToken();
  private sessionEpoch = newPollToken();
  private username: string | null = null;
  private peers = new Map<string, PollPeer>();

  /**
   * The listings answered in this session, by view, in memory only. Going back
   * to a folder or a page waited for the server, even where the server answered
   * from its own cache. A view held here is shown at once and read again
   * quietly (see {@link fetch}).
   *
   * Kept without the folder list every answer carries: a kept listing is shown
   * with the latest one, so the sidebar's counts never go back in time.
   */
  private listings = new Map<string, MailboxData>();
  private latestMailboxes: any[] | null = null;
  private listingSettingsKey = '';

  /**
   * The foreground listing request out at the server, if any: one asked for
   * meanwhile waits for it, and a newer one takes the place of one waiting
   * (see {@link fetch}). The poll's listing and the check-for-new-mail
   * button's do not wait for it yet.
   */
  private listingOut: Promise<void> | null = null;

  /**
   * What changed in the rows on screen while a listing was out, in order: a
   * flag set or cleared, rows taken out for a write, and changes that only
   * make an answer not worth keeping (an autosave, other listing settings).
   *
   * The server reads a session's requests one at a time, so a write sent
   * while a listing is out is read after it, and the listing's answer shows
   * the rows as they were before the write. Shown from memory, a view's rows
   * can be used at once, while its quiet re-read is out: a star set then went
   * out again when the answer landed, the answer was kept so, and a row filed
   * away came back until the write's own re-read. Each change is played again
   * over an answer that was sent before it, and such an answer is shown but
   * not kept; the views kept were patched as the change was made.
   */
  private changes: { seq: number; replay?: (data: MailboxData) => void }[] = [];
  private changeSeq = 0;
  /** How many listings are out, foreground or not; `changes` is kept while any is. */
  private listingsOut = 0;

  constructor() {
    super();
    // Signing out does not reload the page, and the next user's mail page
    // listens on this same service. A read still out when the session ended
    // is the previous user's mail: its tickets are taken here so that it
    // cannot land. The next page's first listing supersedes a listing, but
    // nothing superseded the folder list a create or rename re-reads, and it
    // became the next user's sidebar.
    window.addEventListener('session-cleared', () => {
      this.resetPollSession();
      this.currentFetchId++;
      this.currentLabelsId++;
      this.listed = false;
      this.heard = null;
      this.forgetListings();
      this.latestMailboxes = null;
    });
    // A sign-in that does not follow a sign-out on this page, as a switch to
    // a linked account is, starts with nothing of the account before it.
    window.addEventListener('user-logged-in', () => {
      this.resetPollSession();
      this.currentFetchId++;
      this.currentLabelsId++;
      this.listed = false;
      this.heard = null;
      this.forgetListings();
      this.latestMailboxes = null;
    });

    // A message read, starred or marked unread on screen is so in every view
    // kept, so that going back to one does not show it as it was.
    window.addEventListener('external-message-flags-changed', (e: Event) => {
      const { keys, flag, action } = (e as CustomEvent).detail ?? {};
      if (!Array.isArray(keys) || typeof flag !== 'string') return;
      const named = new Set<string>(keys);
      for (const data of this.listings.values()) patchFlags(data, named, flag, action);
      this.noteChange((data) => patchFlags(data, named, flag, action));
    });
    // An autosave replaces a draft under a new UID.
    window.addEventListener('draft-autosaved', (e: Event) => {
      const { mailbox, oldMailbox } = (e as CustomEvent).detail ?? {};
      this.forgetListings((listed) => listed === mailbox || listed === oldMailbox || listed === ALL_MAILBOXES);
      this.noteChange();
    });
  }

  /**
   * Rows the page has taken off the list for a move or a delete, before the
   * write runs. An answer sent before it is shown without them, as the list is.
   * Answers a put-back, for rows the write refused, which then stay.
   */
  rowsTakenOut(keys: string[]): () => void {
    const gone = new Set(keys);
    this.noteChange((data) => removeRows(data, gone));
    return () => gone.clear();
  }

  /** Records a change for the listings out (see {@link changes}). */
  private noteChange(replay?: (data: MailboxData) => void) {
    if (this.listingsOut === 0) return;
    this.changes.push({ seq: ++this.changeSeq, replay });
  }

  /** A listing is sent: answers the place in {@link changes} it was read at. */
  private listingSent(): number {
    this.listingsOut++;
    return this.changeSeq;
  }

  private listingDone() {
    this.listingsOut--;
    if (this.listingsOut === 0) this.changes = [];
  }

  /**
   * Plays the changes made since `sentAt` over an answer, and answers whether
   * there were any: an answer read before a change is not kept.
   */
  private replayChanges(data: MailboxData, sentAt: number): boolean {
    let changed = false;
    for (const change of this.changes) {
      if (change.seq <= sentAt) continue;
      changed = true;
      change.replay?.(data);
    }
    return changed;
  }

  /**
   * The settings a listing is read under (order, page size, threading). The
   * listings kept were read under the previous ones, and are dropped when they
   * change.
   */
  setListingSettings(key: string) {
    if (key === this.listingSettingsKey) return;
    this.listingSettingsKey = key;
    this.forgetListings();
    // A listing out now was read under the old ones.
    this.noteChange();
  }

  private listingKey(mailbox: string, page: number, query: string): string {
    return [mailbox, page, query].join('\0');
  }

  /** The kept listing of a view, as a copy of its own, with the latest folder list. */
  private keptListing(mailbox: string, page: number, query: string): MailboxData | undefined {
    const key = this.listingKey(mailbox, page, query);
    const kept = this.listings.get(key);
    if (!kept) return undefined;
    // Read last, so kept longest.
    this.listings.delete(key);
    this.listings.set(key, kept);
    const data: MailboxData = JSON.parse(JSON.stringify(kept));
    if (this.latestMailboxes) data.Mailboxes = this.latestMailboxes;
    return data;
  }

  private keepListing(mailbox: string, page: number, query: string, data: MailboxData) {
    if (data.Mailboxes) this.latestMailboxes = data.Mailboxes;
    const kept: MailboxData = JSON.parse(JSON.stringify(data));
    delete kept.Mailboxes;
    const key = this.listingKey(mailbox, page, query);
    this.listings.delete(key);
    this.listings.set(key, kept);
    while (this.listings.size > MAX_KEPT_LISTINGS) {
      this.listings.delete(this.listings.keys().next().value!);
    }
  }

  /** Drops the kept listings, or those of the mailboxes `which` names. */
  private forgetListings(which?: (mailbox: string) => boolean) {
    if (!which) {
      this.listings.clear();
      return;
    }
    for (const [key, data] of [...this.listings]) {
      if (which(data.ListedMailbox ?? '')) this.listings.delete(key);
    }
  }

  /**
   * Updates the current context for background polling.
   */
  setContext(mailbox: string, page: number, query: string = '') {
    this.currentMailbox = mailbox;
    this.currentPage = page;
    this.currentQuery = query;
    this.tellView();
  }

  /**
   * Starts background polling every N minutes.
   * If minutes <= 0, background polling is disabled.
   *
   * Only one tab polls: the one holding {@link POLL_LOCK}, which the next tab
   * waiting for it takes over when that tab closes or leaves the mail page. It
   * polls hidden as well, since new-mail sounds and notifications come from its
   * polls. Visible followers subscribe to its status results for their own
   * folders and re-read only changed views. Without BroadcastChannel each
   * visible tab checks itself, with notifications still owned by the lock
   * holder. Without Web Locks each tab checks itself, as before.
   */
  start(minutes: number = 5) {
    this.stop();
    this.pollMinutes = minutes;
    this.lockFailed = false;
    if (minutes <= 0) return;
    this.watchShown(true);
    try {
      if (typeof window.BroadcastChannel === 'function') {
        this.channel = new window.BroadcastChannel(POLL_CHANNEL);
        this.channel.onmessage = this.handlePollMessage;
      }
    } catch (err) {
      Logger.error('Failed to share poll counts', err);
    }
    this.tellView();
    this.postPoll({ type: 'hello' });
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    if (!locks) {
      this.startTimer();
      return;
    }
    // Without a channel every visible tab must check for itself. The lock
    // still selects the one whose results may notify the reader.
    if (!this.channel) this.startTimer();
    const generation = this.pollGeneration;
    const controller = this.leadRequest = new AbortController();
    locks.request(POLL_LOCK, { signal: controller.signal }, () => new Promise<void>((release) => {
      if (this.pollMinutes <= 0 || generation !== this.pollGeneration) {
        release();
        return;
      }
      this.leading = true;
      this.releaseLead = () => {
        this.leading = false;
        this.releaseLead = null;
        release();
      };
      this.postPoll({ type: 'leader' });
      this.startTimer();
    })).catch((err) => {
      if (controller.signal.aborted || generation !== this.pollGeneration) return;
      Logger.error('Failed to take the poll lock', err);
      this.lockFailed = true;
      this.postPoll({ type: 'hello' });
      this.tellView();
      if (this.pollMinutes > 0 && !this.leading) this.startTimer();
    });
  }

  /**
   * Stops background polling.
   */
  stop() {
    this.pollMinutes = 0;
    this.pollGeneration++;
    this.leadRequest?.abort();
    this.leadRequest = null;
    this.postPoll({ type: 'leave', peer: this.peerId });
    this.channel?.close();
    this.channel = null;
    this.peers.clear();
    this.stopTimer();
    this.giveUpLead();
    this.watchShown(false);
  }

  private startTimer() {
    this.stopTimer();
    this.interval = setInterval(() => void this.poll(), this.pollMinutes * 60 * 1000);
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
    if (this.pollMinutes <= 0 || this.leading) return true;
    if (navigator.locks && !this.lockFailed) return false;
    // Without Web Locks status checks remain per-tab. A channel can still
    // select one announcer; stopped or crashed tabs expire from this set.
    return [...this.peers.values()].every((peer) => peer.username !== this.username
      || Date.now() - peer.seen > Math.max(this.pollMinutes * 3 * 60_000, 180_000)
      || peer.peer > this.peerId);
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
    this.tellView();
    if (this.shownCheck || document.hidden || !this.listed || !this.heard) return;
    if (Date.now() - this.heard.at < STALE_ON_SHOW_MS) return;
    this.shownCheck = this.backgroundSync({ announce: this.announces })
      .finally(() => { this.shownCheck = null; });
  };

  /** Only counts cross tabs. Listings are always read under this tab's session. */
  private postPoll(message: object) {
    try { this.channel?.postMessage(message); } catch (err) {
      Logger.error('Failed to share poll counts', err);
      this.channel?.close();
      this.channel = null;
      if (this.pollMinutes > 0) this.startTimer();
    }
  }

  private tellView() {
    if (!this.username || this.pollMinutes <= 0) return;
    this.postPoll({ type: 'watch', peer: this.peerId, epoch: this.sessionEpoch,
      username: this.username, mailbox: this.currentMailbox, visible: !document.hidden });
  }

  private resetPollSession() {
    const minutes = this.pollMinutes;
    this.stop();
    this.sessionEpoch = newPollToken();
    this.username = null;
    if (minutes > 0) this.start(minutes);
  }

  private handlePollMessage = (event: MessageEvent) => {
    const message = event.data;
    if (!message || this.pollMinutes <= 0) return;
    if (message.type === 'leader' || message.type === 'hello') { this.tellView(); return; }
    if (message.type === 'leave') { this.peers.delete(message.peer); return; }
    if (message.type === 'watch' && (this.leading || !navigator.locks || this.lockFailed)) {
      if (typeof message.peer !== 'string' || typeof message.epoch !== 'string'
        || typeof message.mailbox !== 'string' || message.username !== this.username) return;
      this.peers.set(message.peer, { ...message, seen: Date.now() });
      return;
    }
    if (message.type !== 'counts' || this.leading || document.hidden || !this.listed
      || message.peer !== this.peerId || message.epoch !== this.sessionEpoch
      || message.username !== this.username || message.mailbox !== this.currentMailbox) return;
    this.tellView();
    void this.backgroundSync({ announce: false, scheduled: true,
      shared: { mailbox: checkedCounts(message.counts), inbox: checkedCounts(message.inbox) } });
  };

  /** One leader probes each watched folder once, then each view uses those counts. */
  private async poll() {
    if (this.pollBusy || this.pollMinutes <= 0) return;
    this.pollBusy = true;
    try {
      if (!this.leading || !this.channel || !this.username) {
        if (!this.leading && navigator.locks && !this.lockFailed && document.hidden) return;
        this.tellView();
        await this.backgroundSync({ announce: this.announces, scheduled: true });
        return;
      }
      const generation = this.pollGeneration;
      const username = this.username;
      const peers = [...this.peers.values()].filter((peer) => peer.visible && peer.username === username
        && Date.now() - peer.seen <= Math.max(this.pollMinutes * 3 * 60_000, 180_000));
      const mailbox = this.currentMailbox;
      const fetchId = this.currentFetchId;
      const mailboxes = new Set([FOLDER_INBOX, mailbox, ...peers.map((peer) => peer.mailbox)]);
      const counts = new Map<string, Counts | null>();
      for (const name of mailboxes) {
        counts.set(name, name === ALL_MAILBOXES ? null : await this.askCounts(name).catch(() => null));
        if (!this.leading || generation !== this.pollGeneration) return;
      }
      for (const peer of peers) this.postPoll({ type: 'counts', peer: peer.peer, epoch: peer.epoch,
        username, mailbox: peer.mailbox, counts: counts.get(peer.mailbox), inbox: counts.get(FOLDER_INBOX) });
      // A foreground navigation made while the probes were out owns its own
      // listing; do not supersede it using the previous view's counts.
      if (mailbox !== this.currentMailbox || fetchId !== this.currentFetchId) return;
      await this.backgroundSync({ announce: true, scheduled: true,
        shared: { mailbox: counts.get(mailbox) ?? null, inbox: counts.get(FOLDER_INBOX) ?? null } });
    } finally {
      this.pollBusy = false;
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
    // The views kept are named by the old names. Rare enough to start over.
    this.forgetListings();
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
    this.forgetListings();
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
   * Not a refresh. The server has already dropped what the write changed, and
   * read again the counts of the folders it filed messages into or took them
   * from; a refresh dropped its folder list and every folder's counts on top,
   * and read them all again. The refresh did catch mail that arrived meanwhile
   * (a message sent to oneself, say), so the counts of the Inbox and of the
   * folder on screen are asked first, as the poll asks them, and the server
   * reads again a folder whose counts moved. Announced QUIETLY. The rows are
   * about to change because of something the user just did, and the dim that
   * announced them was the same half-second flash a folder switch makes, over
   * rows they were reading.
   *
   * `refresh` is for a write that failed or was given up on part of the way:
   * what it did is then unknown, and the server has dropped nothing for it.
   *
   * Inside {@link afterWrites}, it is made once, when the writes are done.
   */
  sync({ refresh = false }: { refresh?: boolean } = {}) {
    if (this.writing > 0) {
      this.syncAsked = true;
      this.refreshAsked ||= refresh;
      return;
    }
    this.forgetListings();
    this.fetch(this.currentMailbox, this.currentPage, this.currentQuery, refresh, true, { probe: !refresh });
  }

  /** How many {@link afterWrites} are under way, and whether a write in one of
   * them asked for the re-read, and for a refresh. */
  private writing = 0;
  private syncAsked = false;
  private refreshAsked = false;

  /**
   * Runs the writes of one gesture, and makes the re-read they ask for once,
   * when they are done, whether they succeeded or not.
   *
   * A gesture on messages in several folders (a search across all of them)
   * writes to each folder in turn, and each write asked for its own re-read:
   * one listing per folder, sent while the next write waited behind it on the
   * session's one connection, and, for a search, one search of every folder
   * each time.
   */
  async afterWrites<T>(writes: () => Promise<T>): Promise<T> {
    this.writing++;
    try {
      return await writes();
    } finally {
      this.writing--;
      if (this.writing === 0 && this.syncAsked) {
        const refresh = this.refreshAsked;
        this.syncAsked = false;
        this.refreshAsked = false;
        this.sync({ refresh });
      }
    }
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

      this.latestMailboxes = data.Mailboxes;
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
   *
   * `probe` asks for the counts of the Inbox and of the mailbox first (see
   * {@link sync}).
   */
  async fetch(
    mailbox: string,
    page: number,
    query: string = '',
    checkStatus: boolean = false,
    quiet: boolean = false,
    { probe = false }: { probe?: boolean } = {},
  ) {
    this.setContext(mailbox, page, query);
    this.listed = false;
    const fetchId = ++this.currentFetchId;

    // A view read before in this session is shown at once from memory, and
    // read again quietly: its rows stay readable while the answer is on its
    // way, and the answer replaces them where it differs. Not for a refresh,
    // which is asked for when what is held may be what is wrong.
    const kept = checkStatus ? undefined : this.keptListing(mailbox, page, query);
    if (kept) quiet = true;

    this.dispatchEvent(new CustomEvent('sync-start', { detail: { background: false, quiet } }));
    if (kept) {
      kept.ListedMailbox = mailbox;
      this.dispatchEvent(new CustomEvent('sync-success', { detail: { data: kept, background: false, quiet, kept: true } }));
    }
    const startTime = Date.now();

    // A dim shorter than the eye can read it is a flicker, so a foreground read
    // holds it for 200ms even when the answer came sooner. Nothing to hold when
    // nothing dimmed.
    const settle = async () => {
      if (quiet) return;
      const elapsed = Date.now() - startTime;
      if (elapsed < 200) await new Promise(r => setTimeout(r, 200 - elapsed));
    };

    // Where in `changes` the listing was sent, once it is.
    let sentAt: number | null = null;
    try {
      // The server reads a session's listings one after another, on its one
      // connection to the mail server, so a listing sent while another was
      // out only waited there; clicking through three folders, the third
      // waited for the first two. A listing asked for while the foreground one
      // is out waits here instead, and a newer one takes its place before it
      // is sent, so only the first and the latest are sent. The one out is not
      // aborted: the server would read it all the same.
      while (this.listingOut) {
        await this.listingOut;
        if (this.currentFetchId !== fetchId) return;
      }

      if (probe) {
        // A probe that fails says nothing the listing will not say itself.
        const ask = (name: string) => fetchWithTimeout(`/mailboxes/${encodeMailboxPath(name)}/status`).catch(() => {});
        if (mailbox !== FOLDER_INBOX) await ask(FOLDER_INBOX);
        if (this.currentFetchId !== fetchId) return;
        if (mailbox !== ALL_MAILBOXES) await ask(mailbox);

        if (this.currentFetchId !== fetchId) return;
      }

      let url = `/mailboxes/${encodeMailboxPath(mailbox)}?page=${page}`;
      if (query) url += `&query=${encodeURIComponent(query)}`;
      if (checkStatus) url += `&refresh=true`;

      const request = fetchWithTimeout(url);
      const out = request.then(() => {}, () => {});
      this.listingOut = out;
      sentAt = this.listingSent();
      let response: Response;
      try {
        response = await request;
      } finally {
        if (this.listingOut === out) this.listingOut = null;
      }
      if (this.currentFetchId !== fetchId) return; // Prevent race conditions

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        return;
      }

      if (response.status === 404) {
        this.forgetListings((listed) => listed === mailbox);
        this.dispatchEvent(new CustomEvent('mailbox-not-found'));
        return;
      }

      // Any other refusal is a failure. The server's errors are JSON too, and
      // announced as data an `{"error": …}` answer had no Messages: the page
      // took it for an empty folder and cleared the rows on screen.
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: MailboxData = await response.json();
      if (this.currentFetchId !== fetchId) return; // Re-check after json parsing

      await settle();
      if (this.currentFetchId !== fetchId) return; // Re-check after artificial delay

      this.listed = true;
      data.ListedMailbox = mailbox;
      this.hear(mailbox, page, query, data);
      const changed = this.replayChanges(data, sentAt);
      if (response.ok && !changed) this.keepListing(mailbox, page, query, data);
      this.dispatchEvent(new CustomEvent('sync-success', { detail: { data, background: false, quiet } }));
    } catch (err) {
      if (this.currentFetchId !== fetchId) return;
      Logger.error('Failed to fetch mailbox data', err);

      await settle();
      if (this.currentFetchId !== fetchId) return; // Re-check after artificial delay

      this.dispatchEvent(new CustomEvent('sync-error', { detail: { error: err, background: false, quiet } }));
    } finally {
      if (sentAt !== null) this.listingDone();
    }
  }

  private viewKey(mailbox: string, page: number, query: string): string {
    return [mailbox, page, query].join('\0');
  }

  /** A listing of the view landed, read at the counts it carries. */
  private hear(mailbox: string, page: number, query: string, data: MailboxData) {
    const now = Date.now();
    if (typeof data.Username === 'string' && data.Username !== this.username) {
      this.username = data.Username;
      if (this.leading) this.postPoll({ type: 'leader' });
      this.tellView();
      this.postPoll({ type: 'hello' });
    }
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
    return checkedCounts(body);
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
  private async backgroundSync({ announce = true, scheduled = false, shared }: {
    announce?: boolean; scheduled?: boolean; shared?: { mailbox: Counts | null; inbox: Counts | null };
  } = {}): Promise<boolean> {
    // The poll takes a ticket from the same counter the foreground fetch uses.
    //
    // It did not, and nothing else made the two agree, so a background response
    // that landed after the user had clicked into another folder dispatched
    // `sync-success` with the PREVIOUS folder's messages — the list snapping
    // back to what you just navigated away from, once every polling interval.
    const fetchId = ++this.currentFetchId;
    const generation = this.pollGeneration;
    const superseded = () => this.currentFetchId !== fetchId || (scheduled && generation !== this.pollGeneration);
    const mailbox = this.currentMailbox;
    const page = this.currentPage;
    const query = this.currentQuery;
    const started = Date.now();
    let sentAt: number | null = null;

    try {
      let inbox: Counts | null = shared?.inbox ?? null;
      if (!shared && mailbox !== FOLDER_INBOX) {
        inbox = await this.askCounts(FOLDER_INBOX).catch(() => null);
      }
      if (superseded()) return true;
      const counts = shared ? shared.mailbox : await this.askCounts(mailbox);
      if (superseded()) return true;

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

      sentAt = this.listingSent();
      const response = await fetchWithTimeout(url);
      if (superseded()) return true;

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

      // As in the foreground: an error answer is not a listing. Taken for one,
      // a single failed poll emptied the folder on screen until the next.
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: MailboxData = await response.json();
      if (superseded()) return true;
      data.ListedMailbox = mailbox;
      this.hear(mailbox, page, query, data);
      const changed = this.replayChanges(data, sentAt);
      if (response.ok && !changed) this.keepListing(mailbox, page, query, data);
      this.dispatchEvent(new CustomEvent('sync-success', { detail: { data, background: true, announce: announce && this.announces } }));

      return true;
    } catch (err) {
      if (superseded()) return true;
      Logger.error('Background sync failed', err);
      return false;
    } finally {
      if (sentAt !== null) this.listingDone();
    }
  }
}

/** Also available on an HTTP deployment where randomUUID is not exposed. */
function newPollToken(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}-${Math.random()}`;
}

function countsOf(status: MailboxData['Mailbox']): Counts | null {
  if (typeof status?.NumMessages !== 'number' || typeof status?.NumUnseen !== 'number') return null;
  return { total: status.NumMessages, unseen: status.NumUnseen, uidnext: status.UIDNext, uidvalidity: status.UIDValidity };
}

/** Validate messages from another tab as strictly as HTTP status answers. */
function checkedCounts(body: any): Counts | null {
  if (typeof body?.total !== 'number' || typeof body?.unseen !== 'number') return null;
  return { total: body.total, unseen: body.unseen,
    uidnext: typeof body.uidnext === 'number' ? body.uidnext : undefined,
    uidvalidity: typeof body.uidvalidity === 'number' ? body.uidvalidity : undefined };
}

/** Whether a check's answer is the counts held; neither unknown. */
function sameCounts(answer: Counts | null, held: Counts | null): boolean {
  return !!answer && !!held && answer.total === held.total && answer.unseen === held.unseen
    && answer.uidnext === held.uidnext && answer.uidvalidity === held.uidvalidity;
}

/** Sets or clears a flag on the messages of a listing that `keys` names. */
function patchFlags(data: MailboxData, keys: Set<string>, flag: string, action: 'add' | 'remove') {
  const listed = data.ListedMailbox ?? '';
  const patch = (msg: any) => {
    if (!keys.has(messageKey(mailboxOf(msg, listed), msg?.UID))) return;
    const flags: string[] = Array.isArray(msg.Flags) ? msg.Flags : [];
    if (action === 'add' && !flags.includes(flag)) msg.Flags = [...flags, flag];
    if (action === 'remove') msg.Flags = flags.filter((f) => f !== flag);
  };
  for (const msg of data.Messages ?? []) {
    patch(msg);
    (msg?.SubMessages ?? []).forEach(patch);
  }
}

/**
 * Takes the messages `gone` names out of a listing, as the page takes their
 * rows out: a row goes when every message it stands for goes, and counts as
 * one off the total.
 */
function removeRows(data: MailboxData, gone: Set<string>) {
  if (gone.size === 0 || !data.Messages) return;
  const listed = data.ListedMailbox ?? '';
  const keyOf = (msg: any) => messageKey(mailboxOf(msg, listed), msg?.UID);
  let removed = 0;
  data.Messages = data.Messages.flatMap((msg: any) => {
    const subs: any[] = msg?.SubMessages ?? [];
    const staying = subs.filter((sub) => !gone.has(keyOf(sub)));
    if (gone.has(keyOf(msg)) && staying.length === 0) {
      removed++;
      return [];
    }
    return [staying.length === subs.length ? msg : { ...msg, SubMessages: staying }];
  });
  if (removed > 0 && typeof data.Total === 'number') data.Total = Math.max(0, data.Total - removed);
}

export const messageSync = new MessageSyncService();
