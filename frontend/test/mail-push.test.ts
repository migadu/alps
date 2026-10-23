/**
 * New mail pushed by the server, over one event stream per browser.
 *
 * The stream is a request held open for as long as the mail page is, and a
 * browser lets a page hold six requests to a host at once. One stream per tab
 * would leave a browser with several tabs open waiting for its own requests,
 * so one tab holds it and tells the others what it hears.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type FolderNews, MailPushService, mailPush } from '../src/services/mail-push';
import { MessageSyncService, messageSync } from '../src/services/message-sync';
import { noteSignOut } from '../src/utils/signed-out';
import '../src/pages/mailbox-page';
import { cleanup, mount } from './helpers/dom';

/** EventSource, as far as the push service uses it. */
class FakeEventSource {
  static made: FakeEventSource[] = [];
  closed = false;
  url: string;
  private listeners = new Map<string, ((e: Event) => void)[]>();
  constructor(url: string) {
    this.url = url;
    FakeEventSource.made.push(this);
  }
  addEventListener(type: string, listener: (e: Event) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  removeEventListener(type: string, listener: (e: Event) => void) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((l) => l !== listener));
  }
  close() {
    this.closed = true;
  }
  /** The server sends an event, or the connection opens or fails. */
  emit(type: string, data = 'INBOX') {
    const event = type === 'open' || type === 'error' ? new Event(type) : new MessageEvent(type, { data });
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
  static open(): FakeEventSource[] {
    return FakeEventSource.made.filter((s) => !s.closed);
  }
}

/** BroadcastChannel between the tabs of one test: delivered to every other channel of the name. */
class FakeBroadcastChannel {
  static all: FakeBroadcastChannel[] = [];
  onmessage: ((e: MessageEvent) => void) | null = null;
  name: string;
  constructor(name: string) {
    this.name = name;
    FakeBroadcastChannel.all.push(this);
  }
  postMessage(data: unknown) {
    for (const other of FakeBroadcastChannel.all) {
      if (other === this || other.name !== this.name) continue;
      void Promise.resolve().then(() => other.onmessage?.(new MessageEvent('message', { data })));
    }
  }
  close() {
    FakeBroadcastChannel.all = FakeBroadcastChannel.all.filter((c) => c !== this);
  }
}

/** navigator.locks, as far as the push service uses it: one holder per name, the rest wait in turn. */
function installLocks() {
  const held = new Set<string>();
  const waiting = new Map<string, (() => void)[]>();
  const locks = {
    request(name: string, callback: () => Promise<void>) {
      return new Promise<void>((resolve, reject) => {
        const grant = () => {
          held.add(name);
          Promise.resolve(callback()).then(resolve, reject).finally(() => {
            held.delete(name);
            waiting.get(name)?.shift()?.();
          });
        };
        if (!held.has(name)) grant();
        else waiting.set(name, [...(waiting.get(name) ?? []), grant]);
      });
    },
  };
  Object.defineProperty(navigator, 'locks', { value: locks, configurable: true });
  return locks;
}

const started: MailPushService[] = [];

/** A tab's push service, telling `news` what it hears, and `folders` what it hears of the other folders. */
function tab(news: () => void = () => {}, folders: FolderNews = {}): MailPushService {
  const svc = new MailPushService(news, folders);
  started.push(svc);
  return svc;
}

const settle = () => vi.advanceTimersByTimeAsync(0);

/** What GET /settings answers the push service, while the stream is down. */
let settingsAnswer: () => Response;
let fetchMock: ReturnType<typeof vi.fn>;

/** A page put into the back-forward cache, or taken out of it. */
function pageTransition(type: 'pagehide' | 'pageshow'): Event {
  const event = new Event(type);
  Object.defineProperty(event, 'persisted', { value: true });
  return event;
}

/** Sets document.hidden, as a tab put in the background is. */
function hideTab(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeEventSource.made = [];
  FakeBroadcastChannel.all = [];
  vi.stubGlobal('EventSource', FakeEventSource);
  vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
  settingsAnswer = () => new Response('{"PushNewMail":true}', { status: 200 });
  fetchMock = vi.fn(async (url: string) => (url === '/settings' ? settingsAnswer() : new Response('{}', { status: 200 })));
  vi.stubGlobal('fetch', fetchMock);
  // The waits between attempts without their jitter, unless a test says.
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  installLocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  started.splice(0).forEach((svc) => svc.stop());
  mailPush.stop();
  messageSync.stop();
  cleanup();
  delete (navigator as any).locks;
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
  window.dispatchEvent(new CustomEvent('user-logged-in'));
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
});

describe('the event stream', () => {
  it('is opened by one tab only, the one holding the lock', async () => {
    tab().start();
    tab().start();
    tab().start();
    await settle();
    expect(FakeEventSource.made.map((s) => s.url)).toEqual(['/events']);
  });

  it('tells every tab what it hears', async () => {
    const heard = [vi.fn(), vi.fn(), vi.fn()];
    heard.forEach((news) => tab(news).start());
    await settle();
    const [stream] = FakeEventSource.open();

    stream.emit('inbox');
    await settle();
    expect(heard.map((news) => news.mock.calls.length)).toEqual([1, 1, 1]);

    // Once up, too: what came while it was down went unheard.
    stream.emit('watching');
    await settle();
    expect(heard.map((news) => news.mock.calls.length)).toEqual([2, 2, 2]);
  });

  it('tells every tab of a folder that changed, where the server pushes the folders too', async () => {
    const heard = [vi.fn(), vi.fn()];
    heard.forEach((folder) => tab(() => {}, { folder }).start());
    await settle();
    FakeEventSource.open()[0].emit('folder', 'Archive');
    await settle();
    expect(heard.map((folder) => folder.mock.calls)).toEqual([[['Archive']], [['Archive']]]);
  });

  it('tells every tab that the folders are pushed as the stream comes up so, and that they are not once it ends', async () => {
    const told = [vi.fn(), vi.fn()];
    told.forEach((folders) => tab(() => {}, { folders }).start());
    await settle();
    const [stream] = FakeEventSource.open();

    stream.emit('watching', 'SUBSCRIBED');
    await settle();
    expect(told.map((folders) => folders.mock.calls)).toEqual([[[true]], [[true]]]);
    stream.emit('error');
    await settle();
    expect(told.map((folders) => folders.mock.calls)).toEqual([[[true], [false]], [[true], [false]]]);

    // Up again for the Inbox alone: nothing more to say.
    await vi.advanceTimersByTimeAsync(2_000);
    FakeEventSource.open()[0].emit('watching', 'INBOX');
    await settle();
    expect(told[0].mock.calls).toEqual([[true], [false]]);
  });

  it('tells a tab started twice once: the mail page starts it on every settings change', async () => {
    const heard = vi.fn();
    tab().start();
    const follower = tab(heard);
    follower.start();
    follower.start();
    await settle();
    FakeEventSource.open()[0].emit('inbox');
    await settle();
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('is opened by another tab once the one holding it goes', async () => {
    const heard = vi.fn();
    const first = tab();
    first.start();
    tab(heard).start();
    await settle();
    const [stream] = FakeEventSource.open();

    first.stop();
    await settle();
    expect(stream.closed).toBe(true);
    const open = FakeEventSource.open();
    expect(open).toHaveLength(1);
    expect(open[0]).not.toBe(stream);

    open[0].emit('inbox');
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('is not opened by a tab that left while it waited its turn, and passes the turn on', async () => {
    const first = tab();
    first.start();
    const left = tab();
    left.start();
    const third = tab();
    third.start();
    await settle();
    left.stop();
    first.stop();
    await settle();
    expect(FakeEventSource.open()).toHaveLength(1);
    third.stop();
    await settle();
    expect(FakeEventSource.open()).toHaveLength(0);
  });

  it('leaves one stream however often a waiting tab comes and goes', async () => {
    const leader = tab();
    leader.start();
    const b = tab();
    b.start();
    b.stop();
    b.start();
    b.stop();
    b.start();
    tab().start();
    await settle();
    leader.stop();
    await settle();
    expect(FakeEventSource.open()).toHaveLength(1);
    b.stop();
    await settle();
    expect(FakeEventSource.open()).toHaveLength(1);
  });

  it('is handed on by a tab the browser freezes or puts away, and taken back after', async () => {
    // The tabs of one test share a document, so the other tab starts once
    // the first is frozen, as it would wait its turn.
    const leader = tab();
    leader.start();
    await settle();
    const [first] = FakeEventSource.open();

    document.dispatchEvent(new Event('freeze'));
    await settle();
    expect(first.closed).toBe(true);
    const other = tab();
    other.start();
    await settle();
    const open = FakeEventSource.open();
    expect(open).toHaveLength(1);

    // Back, the first waits its turn, and has it once the other goes.
    document.dispatchEvent(new Event('resume'));
    other.stop();
    await settle();
    expect(FakeEventSource.open()).toHaveLength(1);
    expect(FakeEventSource.open()[0]).not.toBe(open[0]);

    window.dispatchEvent(pageTransition('pagehide'));
    await settle();
    expect(FakeEventSource.open()).toHaveLength(0);
    window.dispatchEvent(pageTransition('pageshow'));
    await settle();
    expect(FakeEventSource.open()).toHaveLength(1);
  });

  it('is opened again after it drops, a while later each time, until it is up again', async () => {
    tab().start();
    await settle();
    FakeEventSource.made[0].emit('error');
    expect(FakeEventSource.open()).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1_900);
    expect(FakeEventSource.made).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(100);
    expect(FakeEventSource.made).toHaveLength(2);

    // Accepted and cut at once: no reason to try sooner.
    FakeEventSource.made[1].emit('open');
    FakeEventSource.made[1].emit('error');
    await vi.advanceTimersByTimeAsync(3_900);
    expect(FakeEventSource.made).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(100);
    expect(FakeEventSource.made).toHaveLength(3);

    // Up, the server waiting for news: the waits start over.
    FakeEventSource.made[2].emit('watching');
    FakeEventSource.made[2].emit('error');
    await vi.advanceTimersByTimeAsync(2_000);
    expect(FakeEventSource.made).toHaveLength(4);

    // And they stop growing.
    for (let i = 0; i < 12; i++) {
      FakeEventSource.made[FakeEventSource.made.length - 1].emit('error');
      await vi.advanceTimersByTimeAsync(5 * 60_000 * 1.2);
    }
    expect(FakeEventSource.made).toHaveLength(16);
  });

  it('waits a little more or less than that, so that tabs of many browsers do not come back at once', async () => {
    vi.mocked(Math.random).mockReturnValue(0);
    tab().start();
    await settle();
    FakeEventSource.made[0].emit('error');
    await vi.advanceTimersByTimeAsync(1_550);
    expect(FakeEventSource.made).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(100);
    expect(FakeEventSource.made).toHaveLength(2);

    vi.mocked(Math.random).mockReturnValue(1);
    FakeEventSource.made[1].emit('error');
    await vi.advanceTimersByTimeAsync(4_750);
    expect(FakeEventSource.made).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(100);
    expect(FakeEventSource.made).toHaveLength(3);
  });

  it('asks the settings before trying again a stream that never came up, and stops when push is off', async () => {
    const off: Event[] = [];
    const onOff = (e: Event) => off.push(e);
    window.addEventListener('mail-push-off', onOff);
    tab().start();
    await settle();
    settingsAnswer = () => new Response('{"PushNewMail":false}', { status: 200 });
    FakeEventSource.made[0].emit('error');
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    window.removeEventListener('mail-push-off', onOff);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/settings']);
    expect(FakeEventSource.made).toHaveLength(1);
    // For the settings, so that the page's next settings change does not
    // start it again.
    expect(off).toHaveLength(1);
  });

  it('stops, and leaves it to the session, when the settings are refused', async () => {
    const authErrors: Event[] = [];
    const onAuth = (e: Event) => authErrors.push(e);
    window.addEventListener('auth-error', onAuth);
    tab().start();
    await settle();
    settingsAnswer = () => new Response('{}', { status: 401 });
    FakeEventSource.made[0].emit('error');
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    window.removeEventListener('auth-error', onAuth);
    expect(FakeEventSource.made).toHaveLength(1);
    expect(fetchMock.mock.calls.filter((c) => c[0] === '/settings')).toHaveLength(1);
    expect(authErrors.length).toBeGreaterThan(0);
  });

  it('does not ask the settings for a stream that was up', async () => {
    tab().start();
    await settle();
    FakeEventSource.made[0].emit('watching');
    FakeEventSource.made[0].emit('error');
    await vi.advanceTimersByTimeAsync(2_000);
    expect(FakeEventSource.made).toHaveLength(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('is not opened again once the server says it cannot push, nor when the tab comes back', async () => {
    tab().start();
    await settle();
    FakeEventSource.made[0].emit('unavailable');
    FakeEventSource.made[0].emit('error');
    document.dispatchEvent(new Event('freeze'));
    document.dispatchEvent(new Event('resume'));
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    expect(FakeEventSource.made).toHaveLength(1);
    expect(FakeEventSource.made[0].closed).toBe(true);
  });

  it('is not opened without navigator.locks, which would have every tab hold one', async () => {
    delete (navigator as any).locks;
    tab().start();
    tab().start();
    await settle();
    expect(FakeEventSource.made).toHaveLength(0);
  });

  it('is closed when the session ends, and not opened again', async () => {
    tab().start();
    await settle();
    window.dispatchEvent(new CustomEvent('session-cleared'));
    expect(FakeEventSource.made[0].closed).toBe(true);
    FakeEventSource.made[0].emit('error');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(FakeEventSource.made).toHaveLength(1);
  });

  it('is not opened again after it drops for signing out', async () => {
    tab().start();
    await settle();
    noteSignOut();
    FakeEventSource.made[0].emit('error');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(FakeEventSource.made).toHaveLength(1);
  });
});

describe('the news', () => {
  const listing = () => new Response(JSON.stringify({ Messages: [], Total: 0 }), { status: 200 });
  /** The Inbox's counts the server answers now. */
  let inbox = { total: 2, unseen: 1 };
  const urls = () => fetchMock.mock.calls.map((c) => String(c[0]));

  beforeEach(() => {
    inbox = { total: 2, unseen: 1 };
    fetchMock.mockImplementation(async (url: string) => (url.includes('/status')
      ? new Response(JSON.stringify(inbox), { status: 200 })
      : listing()));
  });

  async function landed(svc: MessageSyncService, mailbox = 'INBOX', query = '') {
    const pending = svc.fetch(mailbox, 0, query);
    await vi.advanceTimersByTimeAsync(500);
    await pending;
    fetchMock.mockClear();
  }

  it('has a tab showing the Inbox run the check a poll runs', async () => {
    const svc = new MessageSyncService();
    await landed(svc);
    const background: unknown[] = [];
    svc.addEventListener('sync-success', (e) => background.push((e as CustomEvent).detail.background));

    svc.inboxChanged();
    await settle();
    expect(urls()).toEqual(['/mailboxes/INBOX/status', '/mailboxes/INBOX?page=0']);
    expect(background).toEqual([true]);
  });

  it('runs one more check for news that came during one, not one for each', async () => {
    const svc = new MessageSyncService();
    await landed(svc);
    let answer!: () => void;
    fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => {
      answer = () => resolve(new Response('{}', { status: 200 }));
    }));

    svc.inboxChanged();
    svc.inboxChanged();
    svc.inboxChanged();
    await settle();
    answer();
    await settle();
    expect(urls().filter((url) => url.includes('/status'))).toHaveLength(2);
  });

  it('is checked once a read of the view that was out lands, which may have been read before it', async () => {
    const svc = new MessageSyncService();
    await landed(svc);
    let land!: () => void;
    fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => {
      land = () => resolve(listing());
    }));
    // The quiet re-read after an archive, answered as the server held the
    // Inbox before the news.
    const reread = svc.fetch('INBOX', 0, '', false, true);
    await settle();
    svc.inboxChanged();
    expect(urls().filter((url) => url.includes('/status'))).toHaveLength(0);
    land();
    await reread;
    await settle();
    expect(urls()).toContain('/mailboxes/INBOX/status');
  });

  it('is checked after a failed read, once a poll has brought the rows back', async () => {
    const svc = new MessageSyncService();
    fetchMock.mockImplementation(async () => new Response('busy', { status: 500 }));
    const first = svc.fetch('INBOX', 0);
    await vi.advanceTimersByTimeAsync(30_000);
    await first;
    fetchMock.mockImplementation(async (url: string) => (url.includes('/status')
      ? new Response(JSON.stringify(inbox), { status: 200 })
      : listing()));
    svc.start(1);
    await vi.advanceTimersByTimeAsync(60_000);
    svc.stop();
    fetchMock.mockClear();

    svc.inboxChanged();
    await settle();
    expect(urls()).toContain('/mailboxes/INBOX/status');
  });

  it('is checked once a poll lands the rows, after a read that failed', async () => {
    const svc = new MessageSyncService();
    fetchMock.mockImplementation(async () => new Response('busy', { status: 500 }));
    const first = svc.fetch('INBOX', 0);
    await vi.advanceTimersByTimeAsync(30_000);
    await first;
    svc.inboxChanged();
    await settle();
    fetchMock.mockImplementation(async (url: string) => (url.includes('/status')
      ? new Response(JSON.stringify(inbox), { status: 200 })
      : listing()));
    fetchMock.mockClear();
    svc.start(1);
    await vi.advanceTimersByTimeAsync(60_000);
    svc.stop();
    // The poll's own status and listing, and then the check the news asked for.
    expect(urls().slice(0, 3)).toEqual(['/mailboxes/INBOX/status', '/mailboxes/INBOX?page=0', '/mailboxes/INBOX/status']);
  });

  it('is not held over into the next session', async () => {
    const svc = new MessageSyncService();
    fetchMock.mockImplementation(async () => new Response('busy', { status: 500 }));
    const first = svc.fetch('INBOX', 0);
    await vi.advanceTimersByTimeAsync(30_000);
    await first;
    svc.inboxChanged();
    // A switch to a linked account signs in without a sign-out on this page.
    window.dispatchEvent(new CustomEvent('user-logged-in'));
    fetchMock.mockImplementation(async (url: string) => (url.includes('/status')
      ? new Response(JSON.stringify(inbox), { status: 200 })
      : listing()));
    fetchMock.mockClear();
    const next = svc.fetch('INBOX', 0);
    await vi.advanceTimersByTimeAsync(500);
    await next;
    await settle();
    expect(urls()).toEqual(['/mailboxes/INBOX?page=0']);
  });

  it('in a search of the Inbox, asks for its counts alone, and does not run the search again', async () => {
    const svc = new MessageSyncService();
    await landed(svc, 'INBOX', 'looms');
    svc.inboxChanged();
    await settle();
    expect(urls()).toEqual(['/mailboxes/INBOX/status']);
  });

  it('in a search of all mailboxes, asks for the Inbox\'s counts alone', async () => {
    const svc = new MessageSyncService();
    await landed(svc, '*', 'looms');
    svc.inboxChanged();
    await settle();
    expect(urls()).toEqual(['/mailboxes/INBOX/status']);
  });

  it('in another folder, re-reads nothing but the Inbox\'s counts, and gives the page those that moved', async () => {
    const svc = new MessageSyncService();
    await landed(svc, 'Archive');
    const told: any[] = [];
    svc.addEventListener('inbox-counts', (e) => told.push((e as CustomEvent).detail));

    inbox = { total: 3, unseen: 2 };
    svc.inboxChanged();
    await settle();
    expect(urls()).toEqual(['/mailboxes/INBOX/status']);
    expect(told).toEqual([{ counts: { total: 3, unseen: 2 }, announce: true }]);

    svc.inboxChanged();
    await settle();
    expect(told).toHaveLength(1);
  });

  it('lets go of Inbox counts answered after a newer listing, which has newer ones', async () => {
    const svc = new MessageSyncService();
    await landed(svc, 'Archive');
    // The Inbox's status, held until the next listing has landed.
    let answer: ((r: Response) => void) | null = null;
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/mailboxes/INBOX/status' && answer === null) {
        return new Promise<Response>((resolve) => { answer = resolve; });
      }
      return url.includes('/status') ? new Response(JSON.stringify(inbox), { status: 200 }) : listing();
    });
    const told: number[] = [];
    svc.addEventListener('inbox-counts', (e) => told.push((e as CustomEvent).detail.counts.total));

    svc.inboxChanged();
    await settle();
    await landed(svc, 'Archive');
    answer?.(new Response('{"total":11,"unseen":11}', { status: 200 }));
    await settle();
    expect(told).toEqual([]);
  });

  it('gives the Inbox counts it brings to the views it shows from memory', async () => {
    const withInbox = (total: number) => new Response(JSON.stringify({
      Messages: [], Total: 0, Mailboxes: [{ Name: 'INBOX', Total: total, Unseen: total }, { Name: 'Work', Total: 5, Unseen: 0 }],
    }), { status: 200 });
    fetchMock.mockImplementation(async (url: string) => (url.includes('/status')
      ? new Response(JSON.stringify(inbox), { status: 200 })
      : withInbox(10)));
    const svc = new MessageSyncService();
    await landed(svc, 'Work');
    await landed(svc, 'Archive');
    inbox = { total: 11, unseen: 11 };
    svc.inboxChanged();
    await settle();

    const shown: number[] = [];
    svc.addEventListener('sync-success', (e) => {
      const detail = (e as CustomEvent).detail;
      if (detail.kept) shown.push(detail.data.Mailboxes.find((m: any) => m.Name === 'INBOX').Total);
    });
    const back = svc.fetch('Work', 0);
    await vi.advanceTimersByTimeAsync(500);
    await back;
    expect(shown).toEqual([11]);
  });

  it('forgets the views of the Inbox kept in memory, which it has made old', async () => {
    const svc = new MessageSyncService();
    await landed(svc, 'INBOX');
    await landed(svc, 'Archive');
    svc.inboxChanged();
    await settle();
    const kept: boolean[] = [];
    svc.addEventListener('sync-success', (e) => kept.push(!!(e as CustomEvent).detail.kept));
    const back = svc.fetch('INBOX', 0);
    await vi.advanceTimersByTimeAsync(500);
    await back;
    expect(kept).toEqual([false]);
  });

  it('is not checked by a hidden tab that does not poll, until it is shown', async () => {
    const locks = installLocks();
    void locks.request('alps-mail-poll', () => new Promise<void>(() => {}));
    const svc = new MessageSyncService();
    svc.start(5);
    await landed(svc);
    hideTab(true);
    fetchMock.mockClear();

    svc.inboxChanged();
    svc.inboxChanged();
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();

    hideTab(false);
    await settle();
    expect(urls().filter((url) => url.includes('/status'))).toHaveLength(1);
    svc.stop();
  });

  it('is checked by the tab that polls while it is hidden, for the chime and the notification', async () => {
    const svc = new MessageSyncService();
    svc.start(5);
    await settle();
    await landed(svc);
    hideTab(true);
    fetchMock.mockClear();

    svc.inboxChanged();
    await settle();
    expect(urls()).toContain('/mailboxes/INBOX/status');
    svc.stop();
  });

  it('ends the check-mail chip when it took the press\'s place and failed', async () => {
    const svc = new MessageSyncService();
    await landed(svc);
    const ends: string[] = [];
    for (const type of ['sync-success', 'sync-error', 'sync-unchanged']) svc.addEventListener(type, () => ends.push(type));
    const press = svc.check('INBOX', 0);
    svc.inboxChanged();
    fetchMock.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
    await vi.advanceTimersByTimeAsync(120_000);
    await press;
    expect(ends).toEqual(['sync-error']);
  });

  it('leaves the poll running', async () => {
    const svc = new MessageSyncService();
    await landed(svc);
    svc.start(1);
    svc.inboxChanged();
    await settle();
    await vi.advanceTimersByTimeAsync(60_000);
    svc.stop();
    expect(urls().filter((url) => url.includes('/status'))).toHaveLength(2);
  });

  it('reaches the mail page\'s listing from the app\'s stream', async () => {
    const check = vi.spyOn(messageSync, 'inboxChanged').mockImplementation(() => {});
    const folder = vi.spyOn(messageSync, 'folderChanged').mockImplementation(() => {});
    const folders = vi.spyOn(messageSync, 'foldersWatched').mockImplementation(() => {});
    mailPush.start();
    await settle();
    FakeEventSource.open()[0].emit('inbox');
    expect(check).toHaveBeenCalledTimes(1);
    FakeEventSource.open()[0].emit('watching', 'SUBSCRIBED');
    FakeEventSource.open()[0].emit('folder', 'Archive');
    expect(folders.mock.calls).toEqual([[true]]);
    expect(folder.mock.calls).toEqual([['Archive']]);
  });

  it('of a folder on screen has the tab run the check a poll runs', async () => {
    const svc = new MessageSyncService();
    await landed(svc, 'Archive');
    const background: unknown[] = [];
    svc.addEventListener('sync-success', (e) => background.push((e as CustomEvent).detail.background));

    svc.folderChanged('Archive');
    await settle();
    expect(urls()).toEqual(['/mailboxes/INBOX/status', '/mailboxes/Archive/status', '/mailboxes/Archive?page=0']);
    expect(background).toEqual([true]);
  });

  it('of a folder not on screen asks for its counts alone, and gives the page those that moved', async () => {
    fetchMock.mockImplementation(async (url: string) => (url.includes('/status')
      ? new Response(JSON.stringify(inbox), { status: 200 })
      : new Response(JSON.stringify({ Messages: [], Total: 0, Mailboxes: [
        { Name: 'INBOX', Total: 2, Unseen: 1 }, { Name: 'Archive', Total: 0, Unseen: 0 }] }), { status: 200 })));
    const svc = new MessageSyncService();
    await landed(svc, 'INBOX');
    const told: any[] = [];
    svc.addEventListener('folder-counts', (e) => told.push((e as CustomEvent).detail));

    inbox = { total: 1, unseen: 1 };
    svc.folderChanged('Archive');
    await settle();
    expect(urls()).toEqual(['/mailboxes/Archive/status']);
    expect(told).toEqual([{ mailbox: 'Archive', counts: { total: 1, unseen: 1 }, announce: true }]);

    svc.folderChanged('Archive');
    await settle();
    expect(told).toHaveLength(1);
  });

  it('of folders and the Inbox together has one check made after the one out, for all of them', async () => {
    const svc = new MessageSyncService();
    await landed(svc, 'Archive');
    let answer!: () => void;
    fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => {
      answer = () => resolve(new Response(JSON.stringify(inbox), { status: 200 }));
    }));

    svc.folderChanged('Archive');
    svc.folderChanged('Lists');
    svc.inboxChanged();
    svc.folderChanged('Lists');
    await settle();
    answer();
    await settle();
    expect(urls().filter((url) => url.includes('/status')).sort()).toEqual([
      '/mailboxes/Archive/status', '/mailboxes/INBOX/status', '/mailboxes/INBOX/status', '/mailboxes/Lists/status']);
  });

  it('forgets the views of a folder kept in memory, which it has made old', async () => {
    const svc = new MessageSyncService();
    await landed(svc, 'Archive');
    await landed(svc, 'INBOX');
    svc.folderChanged('Archive');
    await settle();
    const kept: boolean[] = [];
    svc.addEventListener('sync-success', (e) => kept.push(!!(e as CustomEvent).detail.kept));
    const back = svc.fetch('Archive', 0);
    await vi.advanceTimersByTimeAsync(500);
    await back;
    expect(kept).toEqual([false]);
  });

  it('that the folders are pushed has the folder on screen checked, as the Inbox is', async () => {
    const svc = new MessageSyncService();
    await landed(svc, 'Archive');
    svc.foldersWatched(true);
    await settle();
    expect(urls()).toContain('/mailboxes/Archive/status');
  });

  it('of the folders pushed spaces the poll out to every third round, and once they are not, back', async () => {
    const svc = new MessageSyncService();
    await landed(svc);
    svc.start(1);
    await settle();
    svc.foldersWatched(true);
    const polls = () => urls().filter((url) => url.includes('/status')).length;

    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(polls()).toBe(0);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(polls()).toBe(1);

    svc.foldersWatched(false);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(polls()).toBe(2);
    svc.stop();
  });
});

describe('the mail page', () => {
  const i18nStore = Object.assign(new EventTarget(), {
    t: (key: string) => key,
    getLanguage: () => 'en',
    getIntlLanguage: () => 'en',
  });
  function settingsStore(pushNewMail: boolean) {
    const state: Record<string, unknown> = {
      layoutMode: 'vertical',
      densityMode: 'compact',
      sortOrder: 'desc',
      messagesPerPage: 50,
      checkMailInterval: 5,
      loginUsername: 'ada@example.com',
      pushNewMail,
    };
    return Object.assign(new EventTarget(), { getState: () => state, updateSettings: async () => {} });
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"Messages":[],"Total":0}', { status: 200 })));
  });

  it('listens for pushed mail when the server pushes it, and stops when it goes', async () => {
    const start = vi.spyOn(mailPush, 'start');
    const stop = vi.spyOn(mailPush, 'stop');
    const el = await mount('mailbox-page', { i18nStore, settingsStore: settingsStore(true), composeStore: new EventTarget() });
    expect(start).toHaveBeenCalled();
    el.remove();
    expect(stop).toHaveBeenCalled();
  });

  it('shows the Inbox\'s counts that pushed news brought while another folder is on screen', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      Messages: [], Total: 0, Mailboxes: [{ Name: 'INBOX', Total: 2, Unseen: 1 }, { Name: 'Archive', Total: 0, Unseen: 0 }],
    }), { status: 200 })));
    const el = await mount<HTMLElement & Record<string, any>>('mailbox-page', { i18nStore, settingsStore: settingsStore(true), composeStore: new EventTarget() });
    await vi.advanceTimersByTimeAsync(500);
    expect(el.mailboxes.find((m: any) => m.Name === 'INBOX')?.Total).toBe(2);
    messageSync.dispatchEvent(new CustomEvent('inbox-counts', { detail: { counts: { total: 3, unseen: 2 }, announce: false } }));
    const inbox = el.mailboxes.find((m: any) => m.Name === 'INBOX');
    expect([inbox?.Total, inbox?.Unseen]).toEqual([3, 2]);
  });

  it('shows the counts of another folder that pushed news brought', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      Messages: [], Total: 0, Mailboxes: [{ Name: 'INBOX', Total: 2, Unseen: 1 }, { Name: 'Archive', Total: 0, Unseen: 0 }],
    }), { status: 200 })));
    const el = await mount<HTMLElement & Record<string, any>>('mailbox-page', { i18nStore, settingsStore: settingsStore(true), composeStore: new EventTarget() });
    await vi.advanceTimersByTimeAsync(500);
    messageSync.dispatchEvent(new CustomEvent('folder-counts', { detail: { mailbox: 'Archive', counts: { total: 3, unseen: 2 }, announce: false } }));
    const archive = el.mailboxes.find((m: any) => m.Name === 'Archive');
    expect([archive?.Total, archive?.Unseen]).toEqual([3, 2]);
    const inbox = el.mailboxes.find((m: any) => m.Name === 'INBOX');
    expect([inbox?.Total, inbox?.Unseen]).toEqual([2, 1]);
  });

  it('does not when the server does not', async () => {
    const start = vi.spyOn(mailPush, 'start');
    await mount('mailbox-page', { i18nStore, settingsStore: settingsStore(false), composeStore: new EventTarget() });
    expect(start).not.toHaveBeenCalled();
  });
});
