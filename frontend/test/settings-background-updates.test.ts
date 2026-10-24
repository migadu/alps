/** Live changes to the page beneath Settings must survive history traversal,
 * not just leave the window's URL untouched. Autosave deletes the old UID. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, flush, mount, waitFor } from './helpers/dom';
import { messageSync } from '../src/services/message-sync';
import { pageEntryId, settingsEntry, updateSettingsBackground } from '../src/utils/settings-history';
import '../src/components/app-root';
vi.mock('unicode-emoji-picker', () => ({}));

type Bag = HTMLElement & Record<string, any>;
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('alps_active_user', 'alice@example.test');
  document.cookie = 'alps_logged_in=1; path=/';
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(messageSync, 'fetch').mockImplementation(async () => {});
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({})));
});
afterEach(() => {
  cleanup(); messageSync.stop(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  document.cookie = 'alps_logged_in=; path=/; max-age=0';
  history.replaceState(null, '', '#/');
});
async function settle(root: Bag) { await flush(); await flush(); await root.updateComplete; }
async function shell(hash: string): Promise<Bag> {
  history.replaceState(null, '', hash);
  const root = await mount<Bag>('app-root');
  await settle(root); return root;
}
async function go(root: Bag, hash: string) { window.location.hash = hash; await settle(root); }
const mailbox = (root: Bag) => root.shadowRoot!.querySelector('mailbox-page') as Bag;
const windowOf = (root: Bag) => root.shadowRoot!.querySelector('settings-window');
async function close(root: Bag, back = false) {
  if (back) history.back();
  else windowOf(root)!.dispatchEvent(new CustomEvent('settings-close', { bubbles: true, composed: true }));
  await waitFor(() => !windowOf(root), 'Settings close');
  await settle(root);
}
async function draft() {
  const root = await shell('#/mailbox/Drafts');
  const page = mailbox(root);
  const old = { UID: '7', Mailbox: 'Drafts', Flags: ['\\Draft'], Envelope: { Subject: 'Before' } };
  Object.assign(page, { currentMailbox: 'Drafts', targetUid: '7', messages: [old], selectedMessage: old });
  history.replaceState(history.state, '', '#/mailbox/Drafts?uid=7');
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  await settle(root);
  return { root, page };
}
function autosave() {
  window.dispatchEvent(new CustomEvent('draft-autosaved', { detail: {
    oldUid: '7', oldMailbox: 'Drafts', newUid: '8', mailbox: 'Drafts', subject: 'After',
    to: ['bob@example.test'], cc: [], bcc: [],
  } }));
}

describe('a replacement draft beneath Settings', () => {
  it.each([false, true])('survives %s (false=Close, true=browser Back)', async back => {
    const { root, page } = await draft();
    await go(root, '#/settings/appearance');
    const origin = settingsEntry()!.origin;
    autosave();
    expect(page.targetUid).toBe('8');
    expect(settingsEntry()).toMatchObject({ background: '#/mailbox/Drafts?uid=8', origin });
    expect(window.location.hash).toBe('#/settings/appearance');
    await close(root, back);
    expect(window.location.hash).toBe('#/mailbox/Drafts?uid=8');
    expect(pageEntryId()).toBe(origin);
    expect(page.targetUid).toBe('8');
    expect(page.selectedMessage.UID).toBe('8');
  });

  it('survives Close across two Settings entries, Forward to the older one, and a reload', async () => {
    const { root, page } = await draft();
    await go(root, '#/settings/appearance');
    await go(root, '#/settings/localization');
    expect(settingsEntry()!.depth).toBe(2);
    autosave();
    await close(root);
    expect(page.targetUid).toBe('8');
    history.forward();
    await waitFor(() => window.location.hash === '#/settings/appearance', 'Forward to the earlier section');
    await settle(root);
    expect(settingsEntry()).toMatchObject({ depth: 1, background: '#/mailbox/Drafts?uid=8' });
    root.remove(); messageSync.stop();
    const reloaded = await mount<Bag>('app-root');
    await settle(reloaded);
    expect(mailbox(reloaded).targetUid).toBe('8');
    await close(reloaded);
    expect(window.location.hash).toBe('#/mailbox/Drafts?uid=8');
  });

  it('carries the live background through Back between Settings sections', async () => {
    const { root, page } = await draft();
    await go(root, '#/settings/appearance');
    await go(root, '#/settings/localization');
    autosave(); history.back();
    await waitFor(() => window.location.hash === '#/settings/appearance', 'Back to the earlier section');
    await settle(root);
    expect(settingsEntry()).toMatchObject({ depth: 1, background: '#/mailbox/Drafts?uid=8' });
    await close(root, true);
    expect(page.targetUid).toBe('8');
  });

  it('captures a silent autosave rewrite made before opening Settings', async () => {
    const { root, page } = await draft();
    autosave(); // replaceState sends no hashchange to refresh AppRoot.lastHash.
    expect(window.location.hash).toBe('#/mailbox/Drafts?uid=8');
    await go(root, '#/settings/appearance');
    expect(settingsEntry()!.background).toBe('#/mailbox/Drafts?uid=8');
    await close(root);
    expect(page.targetUid).toBe('8');
  });

  it('does not override an explicit new navigation, even to the old draft URL', async () => {
    const { root, page } = await draft();
    await go(root, '#/settings/appearance');
    const origin = settingsEntry()!.origin;
    autosave();
    vi.spyOn(page, 'applyTargetUid').mockResolvedValue(undefined);
    await go(root, '#/mailbox/Drafts?uid=7');
    expect(window.location.hash).toBe('#/mailbox/Drafts?uid=7');
    expect(page.targetUid).toBe('7');
    expect(pageEntryId()).not.toBe(origin);
  });
});

it('retains a missing-folder fallback beneath Settings through Close', async () => {
  const root = await shell('#/mailbox/Work');
  const page = mailbox(root);
  await go(root, '#/settings/appearance');
  messageSync.dispatchEvent(new CustomEvent('mailbox-not-found'));
  expect(page.currentMailbox).toBe('INBOX');
  expect(window.location.hash).toBe('#/settings/appearance');
  await close(root);
  expect(window.location.hash).toBe('#/mailbox/INBOX');
  expect(page.currentMailbox).toBe('INBOX');
});

it('retains the clamped last page when a listing shrinks beneath Settings', async () => {
  const root = await shell('#/mailbox/Work?p=4');
  const page = mailbox(root);
  await go(root, '#/settings/appearance');
  page.handleSyncSuccess(new CustomEvent('sync-success', { detail: { background: false, data: {
    Mailboxes: [], Messages: [], Total: 12, Page: 4, MessagesPerPage: 10,
  } } }));
  expect(page.currentPage).toBe(1);
  await close(root);
  expect(window.location.hash).toBe('#/mailbox/Work?p=1');
  expect(page.currentPage).toBe(1);
});

it('auth-error leaves Settings for login without restoring a private background', async () => {
  const { root } = await draft();
  await go(root, '#/settings/appearance'); autosave();
  window.dispatchEvent(new CustomEvent('auth-error')); await settle(root);
  expect(windowOf(root)).toBeNull();
  expect(mailbox(root)).toBeNull();
  expect(root.shadowRoot!.querySelector('login-page')).not.toBeNull();
});

it('opens and closes Settings when secure-context randomUUID is unavailable', async () => {
  vi.stubGlobal('crypto', {});
  const root = await shell('#/mailbox/Work');
  await go(root, '#/settings/appearance');
  expect(settingsEntry()!.origin).toEqual(expect.any(String));
  await close(root);
  expect(window.location.hash).toBe('#/mailbox/Work');
});

it('does not let a late write from a page already left replace another underlay', async () => {
  const { root, page } = await draft();
  await go(root, '#/settings/appearance');
  autosave();
  updateSettingsBackground('#/contacts/all');
  expect(settingsEntry()!.background).toBe('#/mailbox/Drafts?uid=8');
  await close(root);
  expect(page.targetUid).toBe('8');
});
