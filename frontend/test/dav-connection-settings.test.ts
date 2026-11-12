import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, flush, mount, record, shadow, shadowAll, text, waitFor } from './helpers/dom';
import '../src/components/dav-connection-settings';

type El = HTMLElement & Record<string, any>;
type Service = 'caldav' | 'carddav';
const defaults = () => ({
  server: '', default_server: 'https://dav.example.test/', use_mail_credentials: true,
  username: '', password_configured: false, configured: true, personal_configured: false, can_save: true,
});
let stored: ReturnType<typeof defaults>;
let requests: { url: string; method: string; body?: Record<string, any>; signal?: AbortSignal | null }[];
let putError: string | null;
let getError: string | null;
let corruptPersonal: boolean;
const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });
function settingsStore() {
  const store = Object.assign(new EventTarget(), {
    state: { loginUsername: 'ada@example.test' }, getState: () => store.state,
  });
  return store;
}
beforeEach(() => {
  stored = defaults(); requests = []; putError = getError = null; corruptPersonal = false;
  vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ url: String(url), method, body, signal: init?.signal });
    if (method === 'GET' && getError) return Response.json({ error: getError,
      ...(corruptPersonal ? { personal_configured: true } : {}),
    }, { status: 502 });
    if (method === 'PUT') {
      if (putError) return Response.json({ error: putError }, { status: 400 });
      stored = { ...stored, ...body, personal_configured: true,
        password_configured: !body.use_mail_credentials && (!!body.password || stored.password_configured),
        configured: !!(body.server || stored.default_server),
      };
    }
    if (method === 'DELETE') stored = { ...defaults(), default_server: stored.default_server, configured: !!stored.default_server };
    const { password: _password, mail_password: _mail, ...publicRecord } = stored as typeof stored & { password?: string; mail_password?: string };
    return Response.json(publicRecord);
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function settle(el: El) {
  await el.updateComplete;
  await Promise.all(shadowAll<El>(el, 'alps-input, alps-button, alps-setting-group, ui-confirm').map(child => child.updateComplete));
}
async function open(service: Service = 'caldav', store = settingsStore()): Promise<El> {
  const el = await mount<El>(`alps-${service}-settings`, { settingsStore: store, i18nStore });
  await waitFor(() => !el.loading, 'the connection settings');
  await settle(el);
  return el;
}
function inputHost(el: El, name: string): El { return shadow<El>(el, `alps-input[name="${name}"]`); }
function nativeInput(el: El, name: string): HTMLInputElement { return shadow<HTMLInputElement>(inputHost(el, name), 'input'); }
async function input(el: El, name: string, value: string) {
  const field = nativeInput(el, name); field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await settle(el);
}
async function useMail(el: El, use = false) {
  const field = shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]'); field.checked = use;
  field.dispatchEvent(new Event('change', { bubbles: true })); await settle(el);
}
async function save(el: El) {
  await el.save({ preventDefault() {}, currentTarget: shadow<HTMLFormElement>(el, 'form') }); await settle(el);
}
function button(el: Element): HTMLButtonElement { return shadow<HTMLButtonElement>(el as El, 'button'); }
async function askRemove(el: El) { button(shadow(el, 'alps-button.remove')).click(); await settle(el); }
async function confirmRemove(el: El) {
  const confirm = shadow<El>(el, 'ui-confirm');
  button(shadowAll(confirm, 'alps-button')[1]).click();
  await waitFor(() => !el.submitting && requests.some(request => request.method === 'DELETE'), 'the removed connection');
  await settle(el);
}
const puts = () => requests.filter(request => request.method === 'PUT');
const deletes = () => requests.filter(request => request.method === 'DELETE');
function delayNextFetch() {
  let resolve!: (response: Response) => void;
  let signal: AbortSignal | null | undefined;
  vi.mocked(fetch).mockImplementationOnce(async (_, init) => {
    signal = init?.signal; return new Promise<Response>(r => { resolve = r; });
  });
  return { resolve: (data: object) => resolve(Response.json(data)), signal: () => signal };
}

describe('DAV settings using the shared settings controls', () => {
  it.each(['caldav', 'carddav'] as Service[])('edits %s with the same setting group/input layout as Identity', async service => {
    const el = await open(service);
    expect(requests[0]).toMatchObject({ url: `/settings/dav/${service}`, method: 'GET' });
    expect(el.shadowRoot!.querySelector('h3, legend')).toBeNull();
    expect(shadow(el, 'form').getAttribute('aria-label')).toBe(`settings.dav.${service}`);
    const group = shadow<El>(el, 'alps-setting-group');
    expect(group.label).toBe('settings.dav.server');
    expect(group.description).toBe('settings.dav.serverRequired');
    expect(inputHost(el, 'server').type).toBe('url');
    expect(inputHost(el, 'server').icon).toBe('globe');
    expect(nativeInput(el, 'server').getAttribute('aria-label')).toBe('settings.dav.server');
    expect(shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]').checked).toBe(true);
    expect(text(el, '.hint')).toContain('https://dav.example.test/');
    expect(el.shadowRoot!.querySelector('alps-button.remove')).toBeNull();
    expect(el.hasUnsavedChanges).toBe(false);
  });
  it('offers setup without a server, requiring its URL and separate credentials', async () => {
    stored = { ...defaults(), default_server: '', configured: false };
    const el = await open();
    expect(nativeInput(el, 'server').required).toBe(true);
    expect(shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]').checked).toBe(false);
    expect(nativeInput(el, 'password').required).toBe(true);
    expect(el.hasUnsavedChanges).toBe(false);
    await save(el);
    expect(puts()).toEqual([]);
    expect(el.shadowRoot!.activeElement).toBe(inputHost(el, 'server'));
  });
  it('groups custom credentials under Authentication with placeholders and native accessible names', async () => {
    const el = await open();
    await useMail(el);
    const groups = shadowAll<El>(el, 'alps-setting-group');
    expect(groups).toHaveLength(2);
    const authentication = groups[1];
    expect(authentication.label).toBe('settings.dav.authentication');
    expect(authentication.description).toBe('');
    const username = inputHost(el, 'username');
    const password = inputHost(el, 'password');
    expect(username.parentElement).toBe(authentication);
    expect(password.parentElement).toBe(authentication);
    expect(username.type).toBe('text');
    expect(username.icon).toBe('user');
    expect(nativeInput(el, 'username').placeholder).toBe('settings.dav.username');
    expect(nativeInput(el, 'password').placeholder).toBe('settings.dav.password');
    expect(nativeInput(el, 'username').getAttribute('aria-label')).toBe('settings.dav.username');
    expect(nativeInput(el, 'password').getAttribute('aria-label')).toBe('settings.dav.password');
    expect(password.nextElementSibling).toBe(shadow(el, '.password-hint'));
    expect(text(el, '.password-hint')).toBe('settings.dav.enterPassword');
    await input(el, 'username', 'radicale-account');
    expect(nativeInput(el, 'username').checkValidity()).toBe(true);
  });
  it('selects separate credentials for a new destination unless mail credentials are explicitly chosen', async () => {
    const el = await open();
    await input(el, 'server', 'https://personal.example.test/');
    expect(shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]').checked).toBe(false);
    await useMail(el, true);
    await input(el, 'server', 'https://personal.example.test/dav/');
    expect(shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]').checked).toBe(true);
    await input(el, 'mail_password', 'mail secret');
    await save(el);
    expect(puts()[0].body).toEqual({ server: 'https://personal.example.test/dav/', use_mail_credentials: true, username: '', mail_password: 'mail secret' });
  });
  it('asks for the mail password before sending it to a personal server, and only then', async () => {
    const el = await open();
    // The administrator's server gets the mail password anyway.
    expect(el.shadowRoot!.querySelector('alps-input[name="mail_password"]')).toBeNull();
    await input(el, 'server', 'https://personal.example.test/dav/');
    // Separate credentials send no mail password.
    expect(el.shadowRoot!.querySelector('alps-input[name="mail_password"]')).toBeNull();
    await useMail(el, true);
    expect(nativeInput(el, 'mail_password').required).toBe(true);
    expect(nativeInput(el, 'mail_password').type).toBe('password');
    expect(text(el, '.mail-password-hint')).toBe('settings.dav.mailPasswordHint');

    putError = 'dav_mail_password_incorrect';
    await input(el, 'mail_password', 'a guess'); await save(el);
    expect(text(el, '[role="alert"]')).toBe('settings.dav.mailPasswordIncorrect');
    expect(nativeInput(el, 'mail_password').value).toBe('a guess');

    putError = null;
    await input(el, 'mail_password', 'mail secret'); await save(el);
    expect(puts()[1].body?.mail_password).toBe('mail secret');
    // Saved: the password is gone from the page, and the same connection is
    // not asked about again.
    expect(el.shadowRoot!.querySelector('alps-input[name="mail_password"]')).toBeNull();
    expect(JSON.stringify(el.saved)).not.toContain('mail secret');
    await save(el);
    expect(puts()[2].body).not.toHaveProperty('mail_password');
    // Another server is another confirmation.
    await input(el, 'server', 'https://other.example.test/dav/'); await useMail(el, true);
    expect(nativeInput(el, 'mail_password').value).toBe('');
  });
  it('is unchanged again once a typed server is deleted, and says when a save changed nothing', async () => {
    const el = await open();
    await input(el, 'server', 'h');
    expect(shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]').checked).toBe(false);
    await input(el, 'server', '');
    expect(shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]').checked).toBe(true);
    expect(el.hasUnsavedChanges).toBe(false);
    // An explicit choice is kept, whatever the server field then does.
    await useMail(el, false); await input(el, 'server', 'h'); await input(el, 'server', '');
    expect(shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]').checked).toBe(false);
    await useMail(el, true);

    stored = { ...stored, personal_configured: true };
    const again = await open();
    const updates = record(window, 'dav-connections-updated');
    await save(again);
    expect(updates.at(-1)?.detail).toMatchObject({ service: 'caldav', unchanged: true });
    await useMail(again); await input(again, 'username', 'radicale-ada'); await input(again, 'password', 'secret'); await save(again);
    expect(updates.at(-1)?.detail).not.toHaveProperty('unchanged');
  });
  it('sends separate credentials once, clears the password, and announces success through the existing toast', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem'); const el = await open();
    const notices = record<CustomEvent>(window, 'dav-connections-updated');
    const toasts = record<CustomEvent>(window, 'show-toast');
    await useMail(el); await input(el, 'username', '  radicale-ada  '); await input(el, 'password', 'radicale secret');
    expect(el.hasUnsavedChanges).toBe(true);
    await save(el);
    expect(puts()[0].body).toEqual({ server: '', use_mail_credentials: false, username: 'radicale-ada', password: 'radicale secret' });
    expect(nativeInput(el, 'password').value).toBe('');
    expect(nativeInput(el, 'password').required).toBe(false);
    expect(text(el, '.password-hint')).toBe('settings.dav.passwordConfigured');
    expect(notices.at(-1)?.detail).toEqual({ service: 'caldav', configured: true });
    expect(toasts.at(-1)?.detail.message).toBe('settings.dav.saved');
    expect(el.shadowRoot!.querySelector('[role="status"]')).toBeNull();
    expect(el.hasUnsavedChanges).toBe(false); expect(setItem).not.toHaveBeenCalled();
    expect(JSON.stringify(el.saved)).not.toContain('radicale secret');
    expect(shadow(el, 'alps-button.remove')).toBeTruthy();
  });
  it('retains a configured password only while the endpoint and username stay unchanged', async () => {
    stored = { ...defaults(), use_mail_credentials: false, username: 'radicale-ada', password_configured: true, personal_configured: true };
    const el = await open(); await save(el);
    expect(puts()[0].body).toEqual({ server: '', use_mail_credentials: false, username: 'radicale-ada' });
    await input(el, 'username', 'another-user');
    expect(nativeInput(el, 'password').required).toBe(true);
    await save(el); expect(puts()).toHaveLength(1);
    await input(el, 'password', 'another password'); await save(el);
    expect(puts()[1].body?.password).toBe('another password');
  });
  it('keeps a rejected edit for correction without a toast or removal action for an unsaved connection', async () => {
    const el = await open(); const notices = record<CustomEvent>(window, 'dav-connections-updated');
    const toasts = record<CustomEvent>(window, 'show-toast');
    await useMail(el); await input(el, 'username', 'radicale-ada'); await input(el, 'password', 'wrong secret');
    putError = 'dav_auth_failed'; await save(el);
    expect(text(el, '[role="alert"]')).toBe('settings.dav.authFailed');
    expect(nativeInput(el, 'password').value).toBe('wrong secret'); expect(el.hasUnsavedChanges).toBe(true);
    expect(notices).toEqual([]); expect(toasts).toEqual([]);
    expect(el.shadowRoot!.querySelector('alps-button.remove')).toBeNull();
    expect(el.shadowRoot!.activeElement).toBe(shadow(el, '[role="alert"]'));
    await input(el, 'password', 'corrected secret'); expect(el.shadowRoot!.querySelector('[role="alert"]')).toBeNull();
  });
  it('offers only Retry when settings could not be read, never a removal action', async () => {
    getError = 'dav_unavailable'; const el = await open();
    expect(el.shadowRoot!.querySelector('form')).toBeNull(); expect(el.saved).toBeNull();
    expect(el.shadowRoot!.querySelector('alps-button.remove')).toBeNull();
    el.askRemove(); expect(el.removal).toBeNull(); expect(deletes()).toEqual([]);
    getError = null; button(shadow(el, 'alps-button')).click();
    await waitFor(() => !el.loading && !!el.saved, 'the retried settings');
    expect(el.saved.default_server).toBe(stored.default_server);
  });
  it('allows confirmed recovery only when the server proves an unreadable personal record exists', async () => {
    getError = 'dav_unavailable'; corruptPersonal = true;
    const el = await open(); const toasts = record<CustomEvent>(window, 'show-toast');
    expect(el.saved).toBeNull(); expect(el.unreadablePersonal).toBe(true);
    await askRemove(el); expect(deletes()).toEqual([]); await confirmRemove(el);
    expect(deletes()).toHaveLength(1); expect(el.unreadablePersonal).toBe(false);
    expect(el.saved.personal_configured).toBe(false);
    expect(el.shadowRoot!.querySelector('alps-button.remove')).toBeNull();
    expect(toasts.at(-1)?.detail.message).toBe('settings.dav.resetDone');
  });
  it('requires encryption for separate passwords while default mail authentication remains usable', async () => {
    stored.can_save = false; const el = await open();
    await useMail(el); await input(el, 'username', 'radicale-ada'); await input(el, 'password', 'secret'); await save(el);
    expect(puts()).toEqual([]); expect(text(el, '[role="alert"]')).toBe('settings.dav.keyRequired');
    await useMail(el, true); await save(el);
    expect(puts()).toHaveLength(1); expect(puts()[0].body).not.toHaveProperty('password');
  });
  it('uses the shared password visibility and credential autofill controls', async () => {
    const el = await open(); await useMail(el); await input(el, 'password', 'secret');
    expect(inputHost(el, 'username').type).toBe('text'); expect(inputHost(el, 'username').icon).toBe('user');
    expect(inputHost(el, 'password').icon).toBe('key');
    const username = nativeInput(el, 'username');
    expect(username.autocomplete).toBe('section-caldav username');
    expect(username.getAttribute('autocorrect')).toBe('off');
    expect(username.getAttribute('autocapitalize')).toBe('none');
    expect(username.getAttribute('spellcheck')).toBe('false');
    const toggle = shadow<HTMLButtonElement>(inputHost(el, 'password'), '.action-btn');
    toggle.click(); await inputHost(el, 'password').updateComplete;
    expect(toggle.getAttribute('aria-pressed')).toBe('true'); expect(nativeInput(el, 'password').type).toBe('text');
    expect(puts()).toEqual([]); el.discardUnsavedChanges(); await settle(el);
    expect(el.password).toBe(''); expect(el.hasUnsavedChanges).toBe(false);
  });
  it('validates shadow inputs before submitting through the shared Save button or Enter', async () => {
    const el = await open(); await useMail(el);
    button(shadow(el, 'alps-button[type="submit"]')).click(); await flush();
    expect(puts()).toEqual([]); expect(el.shadowRoot!.activeElement).toBe(inputHost(el, 'username'));
    await input(el, 'username', 'radicale-ada'); await input(el, 'password', 'secret');
    nativeInput(el, 'password').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await waitFor(() => puts().length === 1 && !el.submitting, 'the Enter submission'); await settle(el);
    expect(puts()[0].body?.username).toBe('radicale-ada');
    button(shadow(el, 'alps-button[type="submit"]')).click();
    await waitFor(() => puts().length === 2 && !el.submitting, 'the button submission');
    expect(puts()[1].body).not.toHaveProperty('password');
  });
});

describe('removing a saved personal connection', () => {
  beforeEach(() => { stored.personal_configured = true; });
  it('uses the standard confirmation and leaves the connection intact on Cancel', async () => {
    const el = await open(); await askRemove(el); const confirm = shadow<El>(el, 'ui-confirm');
    expect(confirm.heading).toBe('settings.dav.remove'); expect(confirm.message).toBe('settings.dav.removeConfirm');
    expect(confirm.confirmText).toBe('settings.dav.remove'); expect(confirm.cancelText).toBe('general.cancel');
    expect(confirm.isDanger).toBe(true); expect(confirm.dismissible).toBe(true); expect(deletes()).toEqual([]);
    button(shadowAll(confirm, 'alps-button')[0]).click(); await settle(el);
    expect(el.shadowRoot!.querySelector('ui-confirm')).toBeNull(); expect(deletes()).toEqual([]);
    expect(el.saved.personal_configured).toBe(true);
  });
  it('allows Escape/native dialog cancellation without removing the connection', async () => {
    const el = await open(); await askRemove(el); const confirm = shadow<El>(el, 'ui-confirm');
    await confirm.updateComplete; const modal = shadow<El>(confirm, 'ui-modal'); await modal.updateComplete;
    const dialog = shadow<HTMLDialogElement>(modal, 'dialog');
    const cancel = new Event('cancel', { cancelable: true });
    expect(dialog.dispatchEvent(cancel)).toBe(true);
    // A browser closes after an allowed native cancel. jsdom needs that step.
    dialog.close();
    await settle(el); expect(el.shadowRoot!.querySelector('ui-confirm')).toBeNull(); expect(deletes()).toEqual([]);
  });
  it('removes only after confirmation, clears the secret, and uses the removal toast', async () => {
    stored = { ...stored, default_server: '', server: 'https://personal.example.test/', username: 'radicale-ada', use_mail_credentials: false, password_configured: true };
    const el = await open('carddav'); const notices = record<CustomEvent>(window, 'dav-connections-updated');
    const toasts = record<CustomEvent>(window, 'show-toast'); await input(el, 'password', 'unsaved password');
    await askRemove(el); expect(deletes()).toEqual([]); await confirmRemove(el);
    expect(deletes()).toHaveLength(1); expect(el.server).toBe(''); expect(el.password).toBe('');
    expect(el.saved.personal_configured).toBe(false); expect(el.saved.password_configured).toBe(false);
    expect(el.hasUnsavedChanges).toBe(false); expect(notices.at(-1)?.detail).toEqual({ service: 'carddav', configured: false });
    expect(toasts.at(-1)?.detail.message).toBe('settings.dav.removed');
    expect(el.shadowRoot!.querySelector('alps-button.remove, [role="status"]')).toBeNull();
  });
  it('restores a configured default after removal and hides Remove again', async () => {
    const el = await open(); const toasts = record<CustomEvent>(window, 'show-toast');
    await askRemove(el); await confirmRemove(el);
    expect(el.saved.configured).toBe(true); expect(el.saved.personal_configured).toBe(false);
    expect(toasts.at(-1)?.detail.message).toBe('settings.dav.resetDone');
    expect(el.shadowRoot!.querySelector('alps-button.remove')).toBeNull();
  });
  it.each(['discard', 'leave', 'account', 'session'])('invalidates a pending confirmation on %s', async action => {
    const store = settingsStore(); const el = await open('caldav', store); await askRemove(el);
    const stale = shadow(el, 'ui-confirm');
    if (action === 'discard') el.discardUnsavedChanges();
    if (action === 'leave') el.remove();
    if (action === 'account') { store.state.loginUsername = 'grace@example.test'; store.dispatchEvent(new Event('change')); }
    if (action === 'session') window.dispatchEvent(new CustomEvent('session-cleared'));
    await flush(); stale.dispatchEvent(new CustomEvent('confirm')); await flush();
    expect(deletes()).toEqual([]); expect(el.removal).toBeNull();
  });
  it('does not let a cancelled confirmation confirm a later removal request', async () => {
    const el = await open(); await askRemove(el); const stale = shadow(el, 'ui-confirm');
    stale.dispatchEvent(new CustomEvent('cancel')); await settle(el); await askRemove(el);
    const current = shadow(el, 'ui-confirm'); stale.dispatchEvent(new CustomEvent('confirm')); await flush();
    expect(deletes()).toEqual([]); expect(shadow(el, 'ui-confirm')).toBe(current);
    await confirmRemove(el); expect(deletes()).toHaveLength(1);
  });
});

describe('pending DAV requests', () => {
  it('locks shared inputs/buttons during validation and submits only once', async () => {
    const el = await open(); await useMail(el); await input(el, 'username', 'radicale-ada'); await input(el, 'password', 'secret');
    const delayed = delayNextFetch(); const form = shadow<HTMLFormElement>(el, 'form');
    const pending = el.save({ preventDefault() {}, currentTarget: form }); await settle(el);
    for (const field of shadowAll<El>(el, 'alps-input')) expect(shadow<HTMLInputElement>(field, 'input').disabled).toBe(true);
    expect(shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]').disabled).toBe(true);
    expect(button(shadow(el, 'alps-button[type="submit"]')).disabled).toBe(true);
    expect(shadow<HTMLButtonElement>(inputHost(el, 'password'), '.action-btn').disabled).toBe(true);
    const calls = vi.mocked(fetch).mock.calls.length; await el.save({ preventDefault() {}, currentTarget: form });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(calls);
    delayed.resolve(stored); await pending; await settle(el);
    expect(nativeInput(el, 'server').disabled).toBe(false);
  });
  it('invalidates retained DAV pages after an uncertain mutation reply without showing success', async () => {
    const el = await open(); const notices = record<CustomEvent>(window, 'dav-connections-updated');
    const toasts = record<CustomEvent>(window, 'show-toast');
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Connection closed')); await save(el);
    expect(notices.map(event => event.detail)).toEqual([{ service: 'caldav' }]); expect(toasts).toEqual([]);
    expect(text(el, '[role="alert"]')).toBe('settings.dav.unavailable');
  });
  it('cancels departure, clears the secret, and ignores a late save after reconnection', async () => {
    const el = await open(); await useMail(el); await input(el, 'username', 'radicale-ada'); await input(el, 'password', 'secret');
    const notices = record<CustomEvent>(window, 'dav-connections-updated'); const toasts = record<CustomEvent>(window, 'show-toast');
    const delayed = delayNextFetch(); const pending = el.save({ preventDefault() {}, currentTarget: shadow(el, 'form') });
    const field = nativeInput(el, 'password'); el.remove();
    expect(delayed.signal()?.aborted).toBe(true); expect(el.password).toBe(''); expect(field.value).toBe('');
    expect(notices.map(event => event.detail)).toEqual([{ service: 'caldav' }]);
    document.body.appendChild(el); await waitFor(() => !el.loading, 'the reconnected settings');
    delayed.resolve({ ...stored, username: 'old answer', password_configured: true }); await pending;
    expect(el.username).toBe(''); expect(toasts).toEqual([]);
  });
  it('ignores a previous account read and save after the account changes', async () => {
    const store = settingsStore(); const delayedRead = delayNextFetch();
    const el = await mount<El>('alps-caldav-settings', { settingsStore: store, i18nStore });
    store.state.loginUsername = 'grace@example.test'; store.dispatchEvent(new Event('change'));
    await waitFor(() => !el.loading, 'the next account settings'); await settle(el);
    delayedRead.resolve({ ...defaults(), username: 'old account' }); await flush(); expect(el.username).toBe('');
    await useMail(el); await input(el, 'username', 'grace-dav'); await input(el, 'password', 'grace password');
    const delayedSave = delayNextFetch(); const notices = record<CustomEvent>(window, 'dav-connections-updated');
    const toasts = record<CustomEvent>(window, 'show-toast');
    const pending = el.save({ preventDefault() {}, currentTarget: shadow(el, 'form') });
    store.state.loginUsername = 'ada@example.test'; store.dispatchEvent(new Event('change'));
    await waitFor(() => !el.loading, 'the restored account'); expect(el.password).toBe('');
    delayedSave.resolve({ ...stored, username: 'grace-dav', password_configured: true }); await pending;
    expect(el.username).toBe(''); expect(notices).toEqual([]); expect(toasts).toEqual([]);
  });
  it('invalidates a pending save when the mail session is cleared', async () => {
    const el = await open(); const delayed = delayNextFetch(); const notices = record<CustomEvent>(window, 'dav-connections-updated');
    const pending = el.save({ preventDefault() {}, currentTarget: shadow(el, 'form') });
    window.dispatchEvent(new CustomEvent('session-cleared')); delayed.resolve(stored); await pending; await settle(el);
    expect(el.saved).toBeNull(); expect(notices).toEqual([]);
  });
});
