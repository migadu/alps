/**
 * Does `hash` name this tab's route?
 *
 * The match is on a segment boundary, not a bare prefix. `#/tasks`,
 * `#/tasks/all` and `#/tasks?q=x` are the Tasks tab; `#/tasksomething` is not,
 * because a bare `startsWith` lets any tab claim the route of a tab whose id
 * merely begins with its own.
 */
export function matchesTabRoute(hash: string, id: string): boolean {
  const route = `#/${id}`;
  if (!hash.startsWith(route)) return false;
  const rest = hash.slice(route.length);
  return rest === '' || rest.startsWith('/') || rest.startsWith('?');
}

/**
 * The Settings window's route: `#/settings`, or `#/settings/<section>`.
 *
 * A window over the page, with a URL of its own all the same: the account
 * menu opens it by hash, and a reload reopens it at the same section. Every
 * page beneath it leaves this hash alone: see `isSettingsHash`.
 */
export function settingsHash(category?: string): string {
  return category ? `#/settings/${category}` : '#/settings';
}

/**
 * Whether `hash` is the Settings window's.
 *
 * The question every page that reads or writes its own URL asks first. While
 * the window is open the URL is the WINDOW's, and the page beneath it is still
 * mounted: a page that read `#/settings` as its own (the mailbox read it as
 * "no folder, go to the Inbox") or wrote its URL over it (a draft's new UID,
 * a page past the last) would reset itself or close the window.
 */
export function isSettingsHash(hash: string): boolean {
  return matchesTabRoute(hash, 'settings');
}

/** The section `hash` opens, or '' for none, which on a phone is the section
 * list and on a desktop is General. */
export function settingsCategoryOf(hash: string): string {
  if (!isSettingsHash(hash)) return '';
  const [path] = hash.slice('#/settings'.length).split('?');
  return path.replace(/^\//, '').split('/')[0] ?? '';
}
