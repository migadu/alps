import { fetchWithTimeout } from '../utils/fetch-utils';
import { Logger } from '../utils/logger';
import { signedOutOnPurpose } from '../utils/signed-out';
import { messageSync } from './message-sync';

/**
 * The lock the tab that holds the event stream holds.
 *
 * The stream is a request kept open for as long as the mail page is, and a
 * browser lets a page hold six requests to one host at once (HTTP/1.1). A
 * stream per tab would have a browser with several tabs open wait for its own
 * listings, so one tab holds it, and the next waiting for the lock takes over
 * when that tab closes or leaves the mail page.
 */
const PUSH_LOCK = 'alps-mail-push';

/** Where the tab holding the stream tells the other tabs what it hears. */
const PUSH_CHANNEL = 'alps-mail-push';

/**
 * How long a stream that dropped waits before it is opened again, at first
 * and at most, give or take a fifth: the tabs of every browser a restart of
 * the server cut off do not all come back in the same second.
 */
const RETRY_FIRST_MS = 2_000;
const RETRY_MAX_MS = 5 * 60_000;
const RETRY_JITTER = 0.2;

/**
 * News of new mail, pushed by the server (`GET /events`) while it waits on
 * the mail server's IDLE for news of the Inbox. Push is off unless the server
 * turns it on (`[server] push_new_mail`), and the mail page starts this only
 * then.
 *
 * Every tab is told when a message arrived in the Inbox or went from it, and
 * when the stream has come up, since what changed before went unheard;
 * `onNews` is the check (see messageSync.inboxChanged). The poll goes on as
 * before: it covers the folders other than the Inbox, flags, and the times
 * the stream is down.
 *
 * A browser without `navigator.locks` opens no stream, rather than one per
 * tab, and polls as without push. Browsers have it only in a secure context,
 * so a deployment served over plain HTTP, but for localhost, gets no push.
 */
export class MailPushService {
  private running = false;
  /** The browser has frozen the tab, or put it in its back-forward cache. */
  private away = false;
  /** Moved on by a stop and by a tab put away, for the work they leave behind. */
  private generation = 0;
  private releaseLead: (() => void) | null = null;
  /** A request for the lock is out; one at a time. */
  private seeking = false;
  private source: EventSource | null = null;
  private channel: BroadcastChannel | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private retryDelay = RETRY_FIRST_MS;
  /** The server cannot push (its mail server has no IDLE): not asked again. */
  private unavailable = false;
  private onNews: () => void;

  constructor(onNews: () => void) {
    this.onNews = onNews;
    // The stream ends with the session on the server; opened again, it
    // would be refused.
    window.addEventListener('session-cleared', () => this.stop());
  }

  start() {
    if (this.running) return;
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    if (!locks || typeof EventSource === 'undefined') return;
    this.running = true;
    this.away = false;
    // Asked again by a mail page shown again: it may be another account's,
    // on another mail server.
    this.unavailable = false;

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(PUSH_CHANNEL);
      this.channel.onmessage = (e: MessageEvent) => {
        if (e.data?.type === 'news') this.onNews();
      };
    }
    // A tab the browser freezes, or keeps in its back-forward cache, keeps
    // its lock and its stream otherwise, and every other tab goes without
    // news meanwhile.
    document.addEventListener('freeze', this.handleAway);
    window.addEventListener('pagehide', this.handleAway);
    document.addEventListener('resume', this.handleBack);
    window.addEventListener('pageshow', this.handleBack);
    this.seekLead();
  }

  stop() {
    this.running = false;
    this.generation++;
    this.giveUpLead();
    this.channel?.close();
    this.channel = null;
    document.removeEventListener('freeze', this.handleAway);
    window.removeEventListener('pagehide', this.handleAway);
    document.removeEventListener('resume', this.handleBack);
    window.removeEventListener('pageshow', this.handleBack);
  }

  /** Waits for the lock, and holds the stream once it has it. */
  private seekLead() {
    if (this.seeking || this.releaseLead) return;
    this.seeking = true;
    navigator.locks.request(PUSH_LOCK, () => new Promise<void>((release) => {
      this.seeking = false;
      // Stopped, or put away, while waiting its turn: the turn goes to the
      // next tab at once.
      if (!this.running || this.away) {
        release();
        return;
      }
      this.releaseLead = () => {
        this.releaseLead = null;
        release();
      };
      this.open();
    })).catch((err) => {
      this.seeking = false;
      Logger.error('Failed to take the event stream lock', err);
    });
  }

  /** Closes the stream and hands the lock on. */
  private giveUpLead() {
    this.close();
    if (this.retry) {
      clearTimeout(this.retry);
      this.retry = null;
    }
    this.retryDelay = RETRY_FIRST_MS;
    this.releaseLead?.();
  }

  private handleAway = () => {
    if (!this.running) return;
    this.away = true;
    this.generation++;
    this.giveUpLead();
  };

  private handleBack = (e: Event) => {
    if (!this.running) return;
    if (e.type === 'pageshow' && !(e as PageTransitionEvent).persisted) return;
    this.away = false;
    this.seekLead();
  };

  private open() {
    if (!this.running || this.unavailable || this.source) return;
    const source = new EventSource('/events');
    this.source = source;
    // Whether the server waits for the mail server's news on this stream:
    // a stream accepted and cut at once is not one that was up.
    let up = false;
    source.addEventListener('watching', () => {
      up = true;
      this.retryDelay = RETRY_FIRST_MS;
      this.news();
    });
    source.addEventListener('inbox', () => this.news());
    source.addEventListener('unavailable', () => {
      this.unavailable = true;
      this.close();
    });
    source.addEventListener('error', () => {
      if (this.source !== source) return;
      // The browser would open it again on its own, at once and for ever;
      // this waits longer each time, and not at all once the session has
      // ended.
      this.close();
      if (!this.running || this.unavailable || signedOutOnPurpose()) return;
      const base = this.retryDelay;
      this.retryDelay = Math.min(base * 2, RETRY_MAX_MS);
      const delay = base * (1 - RETRY_JITTER + 2 * RETRY_JITTER * Math.random());
      const generation = this.generation;
      this.retry = setTimeout(() => {
        this.retry = null;
        if (generation !== this.generation) return;
        if (up) this.open();
        else void this.openIfStillPushed(generation);
      }, delay);
    });
  }

  /**
   * Opens the stream again after one that never came up, once the settings
   * say that the server still pushes. A refusal of the stream does not say
   * why: a session that has ended (401), push turned off since (404). Asked
   * again every few minutes, either would be asked for as long as the page is
   * open. A refused session is the app's to answer, as for every request
   * (fetchWithTimeout raises `auth-error`).
   */
  private async openIfStillPushed(generation: number) {
    try {
      const response = await fetchWithTimeout('/settings', {}, 25000, { background: true });
      if (generation !== this.generation) return;
      if (response.status === 401) {
        this.stop();
        return;
      }
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (generation !== this.generation) return;
        if (data?.PushNewMail === false) {
          this.stop();
          // For the settings: the mail page starts the stream again on any
          // settings change while they say that the server pushes.
          window.dispatchEvent(new CustomEvent('mail-push-off'));
          return;
        }
      }
    } catch (err) {
      // Unreachable is no answer either way: the next attempt asks again.
      if (generation !== this.generation) return;
      Logger.error('Failed to read the settings before opening the event stream again', err);
    }
    this.open();
  }

  private close() {
    this.source?.close();
    this.source = null;
  }

  /** What the stream says, for this tab and the others. */
  private news() {
    this.onNews();
    this.channel?.postMessage({ type: 'news' });
  }
}

export const mailPush = new MailPushService(() => messageSync.inboxChanged());
