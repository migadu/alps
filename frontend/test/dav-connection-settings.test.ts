import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, flush, mount, record, shadow, text, waitFor } from './helpers/dom';
import '../src/components/dav-connection-settings';

type El = HTMLElement & Record<string, any>;
type Service = 'caldav' | 'carddav';

const defaults = () => ({
  server: '', default_server: 'https://dav.example.test/', use_mail_credentials: true,
  username: '', password_configured: false, configured: true, can_save: true,
});

let stored: ReturnType<typeof defaults>;
let requests: { url: string; method: string; body?: Record<string, any>; signal?: AbortSignal | null }[];
let putError: string | null;
let getError: string | null;

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

function settingsStore() {
  const store = Object.assign(new EventTarget(), {
    state: { loginUsername: 'ada@example.test' },
    getState: () => store.state,
  });
  return store;
}

beforeEach(() => {
  stored = defaults();
  requests = [];
  putError = getError = null;
  vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ url: String(url), method, body, signal: init?.signal });
    if (method === 'GET' && getError) return Response.json({ error: getError }, { status: 502 });
    if (method === 'PUT') {
      if (putError) return Response.json({ error: putError }, { status: 400 });
      stored = {
        ...stored, ...body,
        password_configured: !body.use_mail_credentials && (!!body.password || stored.password_configured),
        configured: !!(body.server || stored.default_server),
      };
    }
    if (method === 'DELETE') stored = { ...defaults(), default_server: stored.default_server, configured: !!stored.default_server };
    // The public endpoint never echoes the password, even for a successful PUT.
    const { password: _password, ...publicRecord } = stored as typeof stored & { password?: string };
    return Response.json(publicRecord);
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function open(service: Service = 'caldav', store = settingsStore()): Promise<El> {
  const el = await mount<El>(`alps-${service}-settings`, { settingsStore: store, i18nStore });
  await waitFor(() => !el.loading, 'the connection settings');
  await el.updateComplete;
  return el;
}

async function input(el: El, name: string, value: string) {
  const field = shadow<HTMLInputElement>(el, `[name="${name}"]`);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  await el.updateComplete;
}

async function useMail(el: El, use = false) {
  const field = shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]');
  field.checked = use;
  field.dispatchEvent(new Event('change', { bubbles: true }));
  await el.updateComplete;
}

async function save(el: El) {
  await el.save({ preventDefault() {}, currentTarget: shadow<HTMLFormElement>(el, 'form') });
  await el.updateComplete;
}

const puts = () => requests.filter(request => request.method === 'PUT');

describe('DAV settings', () => {
  it.each(['caldav', 'carddav'] as Service[])('edits %s independently using its own settings endpoint', async service => {
    const el = await open(service);
    expect(requests[0]).toMatchObject({ url: `/settings/dav/${service}`, method: 'GET' });
    expect(text(el, 'h3')).toBe(`settings.dav.${service}`);
    expect(shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]').checked).toBe(true);
    expect(text(el, '.hint')).toContain('https://dav.example.test/');
    expect(el.hasUnsavedChanges).toBe(false);
  });

  it('offers setup before a server exists, requiring a URL and separate credentials', async () => {
    stored = { ...defaults(), default_server: '', configured: false };
    const el = await open();
    expect(shadow<HTMLInputElement>(el, '[name="server"]').required).toBe(true);
    expect(shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]').checked).toBe(false);
    expect(shadow<HTMLInputElement>(el, '[name="password"]').required).toBe(true);
    expect(el.hasUnsavedChanges).toBe(false);
    await save(el);
    expect(puts()).toEqual([]);
  });

  it('changes to separate credentials when a new destination is entered, unless mail credentials are explicitly chosen', async () => {
    const el = await open();
    await input(el, 'server', 'https://personal.example.test/');
    expect(shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]').checked).toBe(false);
    await useMail(el, true);
    await input(el, 'server', 'https://personal.example.test/dav/');
    expect(shadow<HTMLInputElement>(el, '[name="use_mail_credentials"]').checked).toBe(true);
    await save(el);
    expect(puts()[0].body).toEqual({ server: 'https://personal.example.test/dav/', use_mail_credentials: true, username: '' });
  });

  it('sends separate credentials once, clears the password, and announces the saved connection', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const el = await open();
    const notices = record<CustomEvent>(window, 'dav-connections-updated');
    await useMail(el);
    await input(el, 'username', '  radicale-ada  ');
    await input(el, 'password', 'radicale secret');
    expect(el.hasUnsavedChanges).toBe(true);
    await save(el);
    expect(puts()[0].body).toEqual({ server: '', use_mail_credentials: false, username: 'radicale-ada', password: 'radicale secret' });
    expect(shadow<HTMLInputElement>(el, '[name="password"]').value).toBe('');
    expect(shadow<HTMLInputElement>(el, '[name="password"]').required).toBe(false);
    expect(text(el)).toContain('settings.dav.passwordConfigured');
    expect(notices.at(-1)?.detail).toEqual({ service: 'caldav', configured: true });
    expect(el.hasUnsavedChanges).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
    expect(JSON.stringify(el.saved)).not.toContain('radicale secret');
  });

  it('retains a configured password only while the endpoint and username stay unchanged', async () => {
    stored = { ...defaults(), use_mail_credentials: false, username: 'radicale-ada', password_configured: true };
    const el = await open();
    await save(el);
    expect(puts()[0].body).toEqual({ server: '', use_mail_credentials: false, username: 'radicale-ada' });
    await input(el, 'username', 'another-user');
    expect(shadow<HTMLInputElement>(el, '[name="password"]').required).toBe(true);
    await save(el);
    expect(puts()).toHaveLength(1);
    await input(el, 'password', 'another password');
    await save(el);
    expect(puts()[1].body?.password).toBe('another password');
  });

  it('keeps a rejected edit and password available for correction, with no success announcement', async () => {
    const el = await open();
    const notices = record<CustomEvent>(window, 'dav-connections-updated');
    await useMail(el);
    await input(el, 'username', 'radicale-ada');
    await input(el, 'password', 'wrong secret');
    putError = 'dav_auth_failed';
    await save(el);
    expect(text(el, '[role="alert"]')).toBe('settings.dav.authFailed');
    expect(shadow<HTMLInputElement>(el, '[name="password"]').value).toBe('wrong secret');
    expect(el.hasUnsavedChanges).toBe(true);
    expect(notices).toEqual([]);
    expect(el.shadowRoot!.activeElement).toBe(shadow(el, '[role="alert"]'));
    await input(el, 'password', 'corrected secret');
    expect(el.shadowRoot!.querySelector('[role="alert"]')).toBeNull();
  });

  it('offers retry instead of an editable form when settings could not be read', async () => {
    getError = 'dav_unavailable';
    const el = await open();
    expect(el.shadowRoot!.querySelector('form')).toBeNull();
    expect(text(el, '[role="alert"]')).toBe('settings.dav.unavailable');
    getError = null;
    shadow<HTMLButtonElement>(el, 'button').click();
    await waitFor(() => !el.loading && !!el.saved, 'the retried settings');
    expect(el.saved.default_server).toBe(stored.default_server);
  });

  it('can remove an unreadable connection without first loading its saved record', async () => {
    getError = 'dav_unavailable';
    const el = await open();
    const notices = record<CustomEvent>(window, 'dav-connections-updated');
    expect(el.saved).toBeNull();
    await el.reset();
    await el.updateComplete;
    expect(requests.at(-1)?.method).toBe('DELETE');
    expect(el.saved.default_server).toBe(stored.default_server);
    expect(el.shadowRoot!.querySelector('form')).not.toBeNull();
    expect(notices.at(-1)?.detail).toEqual({ service: 'caldav', configured: true });
  });

  it('invalidates retained DAV pages after a lost mutation reply without claiming the save succeeded', async () => {
    const el = await open();
    const notices = record<CustomEvent>(window, 'dav-connections-updated');
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Connection closed'));
    await save(el);
    expect(notices.map(event => event.detail)).toEqual([{ service: 'caldav' }]);
    expect(text(el, '[role="status"]')).not.toContain('settings.dav.saved');
    expect(text(el, '[role="alert"]')).toBe('settings.dav.unavailable');
  });

  it('resets a personal connection, clears the secret and announces that no endpoint remains', async () => {
    stored = { ...defaults(), default_server: '', server: 'https://personal.example.test/', username: 'radicale-ada', use_mail_credentials: false, password_configured: true };
    const el = await open('carddav');
    const notices = record<CustomEvent>(window, 'dav-connections-updated');
    await input(el, 'password', 'unsaved password');
    await el.reset();
    await el.updateComplete;
    expect(requests.at(-1)?.method).toBe('DELETE');
    expect(el.server).toBe('');
    expect(el.password).toBe('');
    expect(el.saved.password_configured).toBe(false);
    expect(el.hasUnsavedChanges).toBe(false);
    expect(notices.at(-1)?.detail).toEqual({ service: 'carddav', configured: false });
  });

  it('does not save a separate password without credential encryption, while default mail authentication remains usable', async () => {
    stored.can_save = false;
    const el = await open();
    await useMail(el);
    await input(el, 'username', 'radicale-ada');
    await input(el, 'password', 'secret');
    await save(el);
    expect(puts()).toEqual([]);
    expect(text(el, '[role="alert"]')).toBe('settings.dav.keyRequired');
    await useMail(el, true);
    await save(el);
    expect(puts()).toHaveLength(1);
    expect(puts()[0].body).not.toHaveProperty('password');
  });

  it('supports password visibility without submitting or storing the secret', async () => {
    const el = await open();
    await useMail(el);
    await input(el, 'password', 'secret');
    const toggle = shadow<HTMLButtonElement>(el, '.password-field button');
    expect(toggle.type).toBe('button');
    toggle.click();
    await el.updateComplete;
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(shadow<HTMLInputElement>(el, '[name="password"]').type).toBe('text');
    expect(puts()).toEqual([]);
    el.discardUnsavedChanges();
    expect(el.password).toBe('');
    expect(el.hasUnsavedChanges).toBe(false);
  });
});

describe('pending DAV settings requests', () => {
  it('disables the form during validation and submits an edit only once', async () => {
    const el = await open();
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(async () => new Promise<Response>(r => { resolve = r; }));
    const form = shadow<HTMLFormElement>(el, 'form');
    const pending = el.save({ preventDefault() {}, currentTarget: form });
    await el.updateComplete;
    expect(shadow<HTMLFieldSetElement>(el, 'fieldset').disabled).toBe(true);
    const calls = vi.mocked(fetch).mock.calls.length;
    await el.save({ preventDefault() {}, currentTarget: form });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(calls);
    resolve(Response.json(stored));
    await pending;
    await el.updateComplete;
    expect(shadow<HTMLFieldSetElement>(el, 'fieldset').disabled).toBe(false);
  });

  it('cancels departure, clears the password and ignores a late successful save even after reconnection', async () => {
    const el = await open();
    await useMail(el);
    await input(el, 'username', 'radicale-ada');
    await input(el, 'password', 'secret');
    const notices = record<CustomEvent>(window, 'dav-connections-updated');
    let resolve!: (response: Response) => void;
    let signal: AbortSignal | null | undefined;
    vi.mocked(fetch).mockImplementationOnce(async (_, init) => {
      signal = init?.signal;
      return new Promise<Response>(r => { resolve = r; });
    });
    const pending = el.save({ preventDefault() {}, currentTarget: shadow(el, 'form') });
    el.remove();
    expect(signal?.aborted).toBe(true);
    expect(el.password).toBe('');
    expect(notices.map(event => event.detail)).toEqual([{ service: 'caldav' }]);
    document.body.appendChild(el);
    await waitFor(() => !el.loading, 'the reconnected settings');
    resolve(Response.json({ ...stored, username: 'old answer', password_configured: true }));
    await pending;
    expect(el.username).toBe('');
    expect(notices.map(event => event.detail)).toEqual([{ service: 'caldav' }]);
  });

  it('ignores an old account read and cancels an old save after the account changes', async () => {
    const store = settingsStore();
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(async () => new Promise<Response>(r => { resolve = r; }));
    const el = await mount<El>('alps-caldav-settings', { settingsStore: store, i18nStore });
    store.state.loginUsername = 'grace@example.test';
    store.dispatchEvent(new Event('change'));
    await waitFor(() => !el.loading, 'the next account settings');
    resolve(Response.json({ ...defaults(), username: 'old account' }));
    await flush();
    expect(el.username).toBe('');
    await useMail(el);
    await input(el, 'username', 'grace-dav');
    await input(el, 'password', 'grace password');
    const notices = record<CustomEvent>(window, 'dav-connections-updated');
    vi.mocked(fetch).mockImplementationOnce(async () => new Promise<Response>(r => { resolve = r; }));
    const pending = el.save({ preventDefault() {}, currentTarget: shadow(el, 'form') });
    store.state.loginUsername = 'ada@example.test';
    store.dispatchEvent(new Event('change'));
    await waitFor(() => !el.loading, 'the restored account settings');
    expect(el.password).toBe('');
    resolve(Response.json({ ...stored, username: 'grace-dav', password_configured: true }));
    await pending;
    expect(el.username).toBe('');
    expect(notices).toEqual([]);
  });

  it('invalidates a pending save when the mail session is cleared', async () => {
    const el = await open();
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(async () => new Promise<Response>(r => { resolve = r; }));
    const notices = record<CustomEvent>(window, 'dav-connections-updated');
    const pending = el.save({ preventDefault() {}, currentTarget: shadow(el, 'form') });
    window.dispatchEvent(new CustomEvent('session-cleared'));
    resolve(Response.json(stored));
    await pending;
    await el.updateComplete;
    expect(el.saved).toBeNull();
    expect(notices).toEqual([]);
  });
});
