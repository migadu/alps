/**
 * The compose store: whose drafts are on screen and on disk.
 *
 * Unsent messages are the data a user is least forgiving about losing, and the
 * data least acceptable to hand to the next person on the same browser. Both
 * failures have happened: drafts restored into another account, and drafts
 * erased by a session quietly expiring.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComposeStore, bareAddress } from '../src/store/compose-store';
import { messageOperations } from '../src/services/message-operations';

const stores: ComposeStore[] = [];
function makeStore(): ComposeStore {
  const store = new ComposeStore();
  stores.push(store);
  return store;
}

function signIn(user: string, settings: Record<string, unknown> = {}) {
  localStorage.setItem('alps_active_user', user);
  localStorage.setItem(`alps_settings_${user}`, JSON.stringify({ loginUsername: user, ...settings }));
}

const storedDrafts = (user: string) => JSON.parse(localStorage.getItem(`alps_compose_drafts_${user}`) ?? 'null');
const composers = (store: ComposeStore) => store.getState().activeComposers;
const announceUser = () => window.dispatchEvent(new CustomEvent('alps-active-user-changed'));

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // Each store listens on the window; detach them so one test's store cannot
  // react to the next test's events.
  for (const store of stores.splice(0)) {
    const s = store as any;
    window.removeEventListener('session-cleared', s.handleSessionCleared);
    window.removeEventListener('user-logged-in', s.adoptSession);
    window.removeEventListener('alps-active-user-changed', s.adoptSession);
    if (s.saveTimeout !== null) window.clearTimeout(s.saveTimeout);
  }
  localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('whose drafts', () => {
  it('restores the signed-in user\'s drafts, without interrupted uploads or sends', () => {
    signIn('ada');
    localStorage.setItem('alps_compose_drafts_ada', JSON.stringify([
      { id: 'c1', subject: 'Hi', isSending: true, minimized: true, attachments: [{ uuid: 'u1' }, { uuid: 'u2', uploading: true }, { name: 'no id' }] },
    ]));
    const [draft] = composers(makeStore());
    expect(draft).toMatchObject({ subject: 'Hi', isSending: false, minimized: false, attachments: [{ uuid: 'u1' }] });
  });

  it('deletes drafts stored under the old shared key rather than adopting them', () => {
    localStorage.setItem('alps_compose_drafts', JSON.stringify([{ id: 'x', subject: 'someone else\'s' }]));
    signIn('ada');
    expect(composers(makeStore())).toEqual([]);
    expect(localStorage.getItem('alps_compose_drafts')).toBeNull();
  });

  it('learns the user once the settings store names them, keeping windows opened before', () => {
    const store = makeStore();
    store.openComposer({ subject: 'opened before sign-in' });
    expect(localStorage.length).toBe(0);

    signIn('ada');
    localStorage.setItem('alps_compose_drafts_ada', JSON.stringify([{ id: 'old', subject: 'stored' }]));
    announceUser();
    expect(composers(store).map((c) => c.subject)).toEqual(['stored', 'opened before sign-in']);
  });

  it('does not carry one user\'s windows into another\'s session', () => {
    signIn('ada');
    const store = makeStore();
    store.openComposer({ subject: 'ada\'s message' });
    signIn('bob');
    announceUser();
    expect(composers(store)).toEqual([]);
    expect(storedDrafts('ada')).toHaveLength(1);
  });
});

describe('leaving', () => {
  it('takes drafts off the screen and the disk on sign-out, and a pending save cannot write them back', async () => {
    vi.useFakeTimers();
    signIn('ada');
    const store = makeStore();
    store.openComposer({ subject: 'first' });
    store.updateComposer(composers(store)[0].id, { subject: 'edited' });
    window.dispatchEvent(new CustomEvent('session-cleared'));
    await vi.advanceTimersByTimeAsync(2000);
    expect(composers(store)).toEqual([]);
    expect(localStorage.getItem('alps_compose_drafts_ada')).toBeNull();
  });

  it('keeps the drafts through an expired session, including an edit not yet saved', async () => {
    vi.useFakeTimers();
    signIn('ada');
    const store = makeStore();
    store.openComposer({ subject: 'first' });
    store.updateComposer(composers(store)[0].id, { subject: 'typed just before the 401' });
    window.dispatchEvent(new CustomEvent('session-cleared', { detail: { reason: 'expired' } }));
    expect(composers(store)).toEqual([]);
    expect(storedDrafts('ada').map((c: any) => c.subject)).toEqual(['typed just before the 401']);
  });

  it('clears the windows for the login screen without touching what is stored', () => {
    signIn('ada');
    const store = makeStore();
    store.openComposer({ subject: 'keep me' });
    store.clearAllComposers();
    expect(composers(store)).toEqual([]);
    expect(storedDrafts('ada')).toHaveLength(1);
  });
});

describe('opening a composer', () => {
  it('appends the user\'s own signature in their chosen format', () => {
    signIn('ada', { signature: 'Ada\nEngines', composeFormat: 'text' });
    const store = makeStore();
    store.openComposer();
    const [c] = composers(store);
    expect(c.format).toBe('text');
    expect(c.text).toBe('\n\n-- \nAda\nEngines\n');
    expect(c.html).toContain('<div class="alps-signature">-- <br>Ada<br>Engines</div>');
  });

  it('adds no signature to a draft being reopened, and reuses its window', () => {
    signIn('ada', { signature: 'Ada' });
    const store = makeStore();
    store.openComposer({ draftUid: '9', text: 'body' });
    store.openComposer({ draftUid: '9', text: 'body' });
    expect(composers(store)).toHaveLength(1);
    expect(composers(store)[0].text).toBe('body');
  });

  it('drops no-reply recipients', () => {
    signIn('ada');
    const store = makeStore();
    store.openComposer({ to: ['noreply@example.com', 'Charles <charles@example.com>'], cc: ['MAILER-DAEMON@example.com'] });
    expect(composers(store)[0]).toMatchObject({ to: ['Charles <charles@example.com>'], cc: [] });
  });

  it('opens at most three windows on a desktop, and one on a phone', () => {
    signIn('ada');
    const store = makeStore();
    for (let i = 0; i < 5; i++) store.openComposer({ subject: String(i) });
    expect(composers(store)).toHaveLength(3);

    const width = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true });
    try {
      const phone = makeStore();
      phone.clearAllComposers();
      phone.openComposer({ subject: 'a' });
      phone.openComposer({ subject: 'b' });
      expect(composers(phone)).toHaveLength(1);
    } finally {
      Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
    }
  });
});

describe('editing', () => {
  it('marks a composer dirty for a real change, not for text equal to what it started with', () => {
    signIn('ada');
    const store = makeStore();
    store.openComposer({ text: 'hello' });
    const id = composers(store)[0].id;
    store.updateComposer(id, { text: '  hello  ' });
    expect(composers(store)[0].dirty).toBe(false);
    store.updateComposer(id, { to: ['charles@example.com'] });
    expect(composers(store)[0].dirty).toBe(true);
    store.updateComposer(id, { dirty: false });
    expect(composers(store)[0].dirty).toBe(false);
  });

  it('saves edits after a pause rather than on every keystroke', async () => {
    vi.useFakeTimers();
    signIn('ada');
    const store = makeStore();
    store.openComposer({ subject: 'a' });
    const id = composers(store)[0].id;
    store.updateComposer(id, { subject: 'ab' });
    store.updateComposer(id, { subject: 'abc' });
    expect(storedDrafts('ada')[0].subject).toBe('a');
    await vi.advanceTimersByTimeAsync(500);
    expect(storedDrafts('ada')[0].subject).toBe('abc');
  });
});

describe('saving everything at sign-out', () => {
  it('saves each composer worth saving and counts the ones that failed', async () => {
    signIn('ada@example.com');
    const store = makeStore();
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ uid: '1', mailbox: 'Drafts' });
    store.openComposer({ subject: 'with a recipient', to: ['charles@example.com'] });
    store.openComposer({ subject: '' });
    store.openComposer({ subject: 'a subject only' });
    for (const c of composers(store)) store.updateComposer(c.id, { dirty: true });

    expect(await store.saveAllDirtyDrafts()).toEqual({ failed: 1 });
    expect(saveDraft).toHaveBeenCalledTimes(2);
    expect(composers(store)).toEqual([]);
  });

  it('adds the user to Bcc once, however their address is spelled, and sets Reply-To', async () => {
    signIn('ada@example.com', { bccMyself: true, replyTo: 'team@example.com' });
    const store = makeStore();
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '1', mailbox: 'Drafts' });
    store.openComposer({ subject: 'already there', bcc: ['"Me" <ADA@example.com>'] });
    store.openComposer({ subject: 'not there' });
    for (const c of composers(store)) store.updateComposer(c.id, { dirty: true });
    await store.saveAllDirtyDrafts();

    const forms = saveDraft.mock.calls.map((call) => call[0] as FormData);
    expect(forms.map((f) => f.get('bcc'))).toEqual(['"Me" <ADA@example.com>', 'ada@example.com']);
    expect(forms.every((f) => f.get('reply_to') === 'team@example.com' && f.get('save_as_draft') === '1')).toBe(true);
  });
});

describe('discarding a draft', () => {
  it('closes at once and says so when the server keeps the draft', async () => {
    signIn('ada');
    const store = makeStore();
    vi.spyOn(messageOperations, 'deleteMessagesResult').mockResolvedValue({ ok: false, reason: 'failed' });
    const toasts: CustomEvent[] = [];
    const onToast = (e: Event) => toasts.push(e as CustomEvent);
    window.addEventListener('show-toast', onToast);
    store.openComposer({ draftUid: '7', draftMailbox: 'Drafts' });
    store.discardDraft(composers(store)[0].id);
    expect(composers(store)).toEqual([]);
    await vi.waitFor(() => expect(toasts).toHaveLength(1));
    window.removeEventListener('show-toast', onToast);
    expect(toasts[0].detail.i18nKey).toBe('composer.discardFailed');
  });

  it('stays quiet on an expired session, and deletes nothing for a draft never saved', async () => {
    signIn('ada');
    const store = makeStore();
    const del = vi.spyOn(messageOperations, 'deleteMessagesResult').mockResolvedValue({ ok: false, reason: 'auth' });
    const toasts: Event[] = [];
    const onToast = (e: Event) => toasts.push(e);
    window.addEventListener('show-toast', onToast);
    store.openComposer({ draftUid: '7', draftMailbox: 'Drafts' });
    store.openComposer({ subject: 'never saved' });
    const [saved, unsaved] = composers(store);
    store.discardDraft(saved.id);
    store.discardDraft(unsaved.id);
    await new Promise((r) => setTimeout(r, 0));
    window.removeEventListener('show-toast', onToast);
    expect(del).toHaveBeenCalledTimes(1);
    expect(toasts).toHaveLength(0);
  });
});

describe('bareAddress', () => {
  it('reduces any spelling of an address to its lower-cased mailbox', () => {
    expect(bareAddress('"Me" <ME@Example.com>')).toBe('me@example.com');
    expect(bareAddress('  Ada@Example.COM ')).toBe('ada@example.com');
    expect(bareAddress('Charles <charles@example.com> ')).toBe('charles@example.com');
  });
});
