/**
 * Where the Settings window closes to.
 *
 * Settings is a window over the page it was opened from, and its URL is a
 * route of its own. Close, Escape and the browser's Back must all land on that
 * page as it was: the folder, the open message, the search. So the history
 * entry Settings is on carries two facts, stamped when the entry is first
 * reached:
 *
 *  - BACKGROUND, the hash of the page beneath, so a reload of Settings still
 *    draws it, and so the page's header can name its own tab;
 *  - DEPTH, how many entries back that page is. Choosing a section replaces
 *    the entry, so it is normally 1; a navigation from one section to another
 *    by URL pushes, and Close has to walk back over it rather than land on the
 *    previous section.
 *
 * A direct load of #/settings/x has neither, and closes to the Inbox.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { isSettingsHash, settingsCategoryOf, settingsHash } from '../src/utils/routes';
import { nextSettingsEntry, pageHash, settingsEntry, stampSettingsEntry } from '../src/utils/settings-history';

afterEach(() => {
  history.replaceState(null, '', '#/');
});

describe('the Settings route', () => {
  it('is spelled one way', () => {
    expect(settingsHash()).toBe('#/settings');
    expect(settingsHash('reading')).toBe('#/settings/reading');
  });

  it('is told apart from routes that only begin with its name', () => {
    expect(isSettingsHash('#/settings')).toBe(true);
    expect(isSettingsHash('#/settings/reading')).toBe(true);
    expect(isSettingsHash('#/settings?x=1')).toBe(true);
    expect(isSettingsHash('#/settingsx')).toBe(false);
    expect(isSettingsHash('#/mailbox/settings')).toBe(false);
    expect(isSettingsHash('')).toBe(false);
  });

  it('names its section, or none', () => {
    expect(settingsCategoryOf('#/settings')).toBe('');
    expect(settingsCategoryOf('#/settings/')).toBe('');
    expect(settingsCategoryOf('#/settings/managesieve')).toBe('managesieve');
    expect(settingsCategoryOf('#/settings/reading?from=menu')).toBe('reading');
    expect(settingsCategoryOf('#/mailbox/INBOX')).toBe('');
  });
});

describe('the entry a navigation into Settings stamps', () => {
  it('records the page it came from, one step back', () => {
    expect(nextSettingsEntry('#/mailbox/Work?uid=7', null)).toEqual({ depth: 1, background: '#/mailbox/Work?uid=7' });
  });

  it('names the root when the page it came from had no hash', () => {
    expect(nextSettingsEntry('', null)).toEqual({ depth: 1, background: '#/' });
  });

  it('goes one deeper on a navigation from one section to another, over the same page', () => {
    const first = { depth: 1, background: '#/calendar/week/2026-10-21' };
    expect(nextSettingsEntry('#/settings/identity', first)).toEqual({ depth: 2, background: '#/calendar/week/2026-10-21' });
  });

  it('knows no page beneath a direct load, however deep it goes', () => {
    // The page under a direct load is the mailbox, drawn without a URL of its
    // own: there is no entry behind this one to go back to.
    expect(nextSettingsEntry('#/settings/identity', null)).toEqual({ depth: 1, background: null });
  });
});

describe('stamping and reading the entry', () => {
  it('keeps whatever else the entry\'s state holds', () => {
    history.replaceState({ other: 1 }, '', '#/settings/webauthn');
    stampSettingsEntry({ depth: 1, background: '#/contacts/all' });
    expect(history.state.other).toBe(1);
    expect(settingsEntry()).toEqual({ depth: 1, background: '#/contacts/all' });
    expect(window.location.hash).toBe('#/settings/webauthn');
  });

  it('reads nothing from an entry nobody stamped', () => {
    history.replaceState(null, '', '#/settings');
    expect(settingsEntry()).toBeNull();
    history.replaceState({ alpsSettings: { depth: '1' } }, '', '#/settings');
    expect(settingsEntry()).toBeNull();
  });
});

describe('the page beneath', () => {
  it('is the current page when Settings is not open', () => {
    history.replaceState(null, '', '#/tasks/today');
    expect(pageHash()).toBe('#/tasks/today');
  });

  it('is the page Settings was opened from', () => {
    history.replaceState(null, '', '#/settings/webauthn');
    stampSettingsEntry({ depth: 1, background: '#/contacts/all' });
    expect(pageHash()).toBe('#/contacts/all');
  });

  it('is unknown under a direct load of Settings', () => {
    history.replaceState(null, '', '#/settings/webauthn');
    expect(pageHash()).toBeNull();
  });
});
