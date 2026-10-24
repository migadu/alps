/**
 * One render per change on the contacts page.
 *
 * updated() set `isSpinning` whenever `loading` turned on. A property set
 * there lands after the update that saw the change has finished, so Lit
 * schedules another one and renders the whole page twice: every read of the
 * list, the mount's own included.
 *
 * Pinned on what Lit itself checks for its change-in-update warning,
 * `isUpdatePending` right after updated(), rather than on the console: the
 * warning is printed once per page load.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/carddav/frontend/contacts-page';
import '../../plugins/carddav/frontend/contact-view';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { cleanup, flush } from './helpers/dom';

type Watched = HTMLElement & Record<string, any> & {
  /** Updates finished since the last reset. */
  updates: number;
  /** The changed properties of each of those that scheduled another. */
  rescheduled: string[][];
  reset(): void;
};

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };

beforeEach(() => {
  vi.spyOn(contactsService, 'fetchContacts').mockImplementation(async () => ({
    contacts: [{ path: '/book/ada.vcf', uid: 'uA', name: 'Ada Lovelace', categories: ['Work'] }],
  }));
  history.replaceState(null, '', '#/contacts/all');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  history.replaceState(null, '', '#/');
});

// The page fades its first-load spinner on a 100ms timer that outlives the
// page. Let the last one fire while this file's window still exists; when the
// file finished sooner, it fired into a torn-down environment and failed the
// run with "window is not defined".
afterAll(() => new Promise<void>((resolve) => setTimeout(resolve, 150)));

async function settle(el: HTMLElement, ticks = 8): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    await flush();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  }
}

/** A page whose every update is checked the way Lit's dev mode checks it. */
async function mountWatched(): Promise<Watched> {
  const page = document.createElement('contacts-page') as Watched;
  page.i18nStore = i18nStore;
  const own = page.updated;
  page.updates = 0;
  page.rescheduled = [];
  page.reset = () => { page.updates = 0; page.rescheduled = []; };
  page.updated = function (this: Watched, changed: Map<PropertyKey, unknown>) {
    own.call(this, changed);
    page.updates += 1;
    if (page.isUpdatePending) page.rescheduled.push([...changed.keys()].map(String));
  };
  document.body.appendChild(page);
  await settle(page);
  return page;
}

describe('the contacts page renders each change once', () => {
  it('when it mounts and loads', async () => {
    const page = await mountWatched();

    expect(page.updates, 'the watch saw the mount').toBeGreaterThan(0);
    expect(page.rescheduled).toEqual([]);
  });

  it('when the list is read again', async () => {
    const page = await mountWatched();
    // The refresh icon finishing its turn once the mount's read is in, as
    // `animationiteration` reports it: the spinner stops, so the next read
    // has to start it again.
    page.shadowRoot!.querySelector('alps-contacts-list')!.dispatchEvent(new CustomEvent('spin-iteration'));
    await settle(page);
    expect(page.isSpinning).toBe(false);
    page.reset();

    page.shadowRoot!.querySelector('alps-contacts-list')!.dispatchEvent(new CustomEvent('refresh'));
    await settle(page);

    expect(page.updates, 'the watch saw the read').toBeGreaterThan(0);
    expect(page.rescheduled).toEqual([]);
  });
});
