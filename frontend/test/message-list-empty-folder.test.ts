/**
 * Emptying Trash or Junk, and what the user is told about it.
 *
 * The gesture is one request that the server may spend minutes on, and for a
 * long time its only two outcomes on screen were "Mailbox emptied
 * successfully." and "Failed to empty mailbox." Both were wrong in the case
 * that actually turned up: an empty that discarded nothing still reported
 * success, and one that ran past the client's deadline reported failure while
 * the expunge behind it carried on. Either way the folder on screen was
 * unchanged, which reads as "nothing happened" — and the answer to that is to
 * press the button again, sending a second full expunge after the first.
 *
 * So these assert on the WORDS, and on the control refusing the second press.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, click, flush, mount, record, shadow, shadowAll } from './helpers/dom';
import { mailboxOperations } from '../src/services/mailbox-operations';
import { I18nStore } from '../src/store/i18n-store';
import '../src/components/message-list';

const TAG = 'alps-message-list';
type El = HTMLElement & Record<string, any>;

const message = (uid: string) => ({
  UID: uid,
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.com' }], To: [], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

/**
 * The Trash, listed: the one folder state that offers the control at all.
 *
 * With a real dictionary. Nothing provides the i18n context in a component
 * test, and every `t()` here would otherwise land on the English fallback
 * written beside it — which is not the string the app renders, and in
 * particular is not plural-aware.
 */
async function trash(): Promise<El> {
  return mount<El>(TAG, {
    i18nStore: new I18nStore(),
    messages: [message('1'), message('2')],
    currentMailbox: 'Trash',
    currentMailboxRole: 'trash',
    totalMessages: 2,
  });
}

/** The banner's control, by its label — never by position among the actions. */
const deleteAll = (el: El) =>
  shadowAll(el, 'alps-banner alps-button').find(b => b.textContent?.includes('Delete All Now'))!;

/** The confirmation's control, which shares that label and lives in its own dialog. */
const confirmDelete = (el: El) => {
  const dialog = shadow(el, 'ui-confirm');
  return shadowAll(dialog as HTMLElement, 'alps-button').find(b => b.textContent?.includes('Delete All Now'))!;
};

/** Checks a row, as a user does: by its checkbox column. */
async function check(el: El, uid: string) {
  const row = shadowAll(el, '.message-item').find(r => r.textContent?.includes(`message ${uid}`))!;
  row.querySelector<HTMLElement>('.checkbox-col')!.click();
  await el.updateComplete;
}

/** Opens the confirmation and answers it. */
async function emptyTheFolder(el: El) {
  await click(deleteAll(el), el);
  await click(confirmDelete(el), el);
}

const messages = (toasts: CustomEvent[]) => toasts.map(t => t.detail.message);
const kinds = (toasts: CustomEvent[]) => toasts.map(t => t.detail.type);

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('what an empty reports', () => {
  it('says the folder was already empty rather than claiming an emptying', async () => {
    vi.spyOn(mailboxOperations, 'emptyMailbox').mockResolvedValue({ ok: true, discarded: 0 });
    const el = await trash();
    const toasts = record<CustomEvent>(el, 'toast');

    await emptyTheFolder(el);

    expect(messages(toasts).at(-1)).toContain('already empty');
    // Not a success: nothing was deleted, and the rows still on screen are the
    // proof the user would hold against the claim.
    expect(kinds(toasts)).not.toContain('success');
  });

  it('reports a real emptying as a success', async () => {
    vi.spyOn(mailboxOperations, 'emptyMailbox').mockResolvedValue({ ok: true, discarded: 2 });
    const el = await trash();
    const toasts = record<CustomEvent>(el, 'toast');

    await emptyTheFolder(el);

    expect(kinds(toasts)).toContain('success');
  });

  it('takes a backend that names no count at its word', async () => {
    vi.spyOn(mailboxOperations, 'emptyMailbox').mockResolvedValue({ ok: true });
    const el = await trash();
    const toasts = record<CustomEvent>(el, 'toast');

    await emptyTheFolder(el);

    expect(kinds(toasts)).toContain('success');
    expect(messages(toasts).join(' ')).not.toContain('already empty');
  });

  it('words a deadline the client gave up on as work still going on', async () => {
    vi.spyOn(mailboxOperations, 'emptyMailbox').mockResolvedValue({ ok: false, reason: 'timeout' });
    const el = await trash();
    const toasts = record<CustomEvent>(el, 'toast');

    await emptyTheFolder(el);

    // "Try again" is the wrong advice — trying again is what sends a second
    // expunge over a folder already being emptied.
    expect(messages(toasts).at(-1)).toContain('Still emptying');
    expect(messages(toasts).join(' ')).not.toContain('Failed to empty');
  });

  it('stays quiet when the session has ended', async () => {
    // The shell is already showing the login screen and saying why.
    vi.spyOn(mailboxOperations, 'emptyMailbox').mockResolvedValue({ ok: false, reason: 'auth' });
    const el = await trash();
    const toasts = record<CustomEvent>(el, 'toast');

    await emptyTheFolder(el);

    expect(kinds(toasts)).not.toContain('error');
  });

  it('reports a refusal and a fault the way it always did', async () => {
    vi.spyOn(mailboxOperations, 'emptyMailbox').mockResolvedValue({ ok: false, reason: 'not_discardable' });
    const el = await trash();
    const toasts = record<CustomEvent>(el, 'toast');

    await emptyTheFolder(el);

    expect(messages(toasts).at(-1)).toContain('Failed to empty');
  });
});

describe('the control and a checked selection', () => {
  it('stays live while messages are checked', async () => {
    const el = await trash();
    // The button used to go dead here, with nothing said about why, and the
    // way out was to uncheck every row by hand.
    await check(el, '1');

    expect(shadow<HTMLButtonElement>(deleteAll(el), 'button').disabled).toBe(false);
    await click(deleteAll(el), el);
    expect(shadowAll(el, 'ui-confirm')).toHaveLength(1);
  });

  it('says in the confirmation that the checked messages are part of the folder', async () => {
    const el = await trash();
    await check(el, '1');
    await click(deleteAll(el), el);

    // The whole folder, and the selection named as a subset of it — which is
    // the confusion the dead button existed to prevent.
    const asked = shadow(el, 'ui-confirm').getAttribute('message') ?? '';
    expect(asked).toContain('all 2 messages in Trash');
    expect(asked).toContain('This includes the message you have checked.');
  });

  it('counts the checked messages, and says nothing about them when none are', async () => {
    const el = await trash();
    await check(el, '1');
    await check(el, '2');
    await click(deleteAll(el), el);
    expect(shadow(el, 'ui-confirm').getAttribute('message')).toContain('the 2 messages you have checked');

    const plain = await trash();
    await click(deleteAll(plain), plain);
    expect(shadow(plain, 'ui-confirm').getAttribute('message')).not.toContain('checked');
  });
});

describe('while the empty runs', () => {
  it('spins on the control and refuses a second press', async () => {
    let finish!: (outcome: any) => void;
    const empty = vi.spyOn(mailboxOperations, 'emptyMailbox')
      .mockReturnValue(new Promise(resolve => { finish = resolve; }) as any);
    const el = await trash();

    await emptyTheFolder(el);

    // The one sign the work is under way, for however long it takes: the
    // request itself has nothing to report until it ends.
    expect(deleteAll(el).spinning).toBe(true);

    // A press now is the press that sends a second SELECT/STORE/EXPUNGE at a
    // folder already being emptied. Two things stop it: a spinning alps-button
    // renders a DISABLED native button, which is what a real press lands on and
    // what swallows it...
    expect(shadow<HTMLButtonElement>(deleteAll(el), 'button').disabled).toBe(true);
    // ...and the handler turns away a second call however it was reached.
    await el.handleEmptyMailbox();
    expect(empty).toHaveBeenCalledTimes(1);

    finish({ ok: true, discarded: 2 });
    await flush();
    await el.updateComplete;
    expect(deleteAll(el)?.spinning ?? false).toBe(false);
  });
});
