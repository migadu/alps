// Whether the app is still booting: drawing the first page it loaded on,
// whose data has not arrived yet.
//
// Only then does a page cover itself with `<alps-initial-loader>`, the
// full-window splash. A page reached by a tab click is the app already
// running, and the splash there is the white and the fade of a reload, on a
// click that only asked to see another page.
//
// This was a `window` global that only the mailbox and contacts pages set,
// once their first listing landed. The calendar and the tasks pages never
// did, so a session loaded on either went on booting, and the first switch to
// Messages drew the mailbox's splash; Contacts drew its own on every visit.
//
// So the boot ends two ways now: a page that shows the splash ends it when
// its first data lands, and the shell ends it on any navigation away from the
// page the app loaded on (`app-root`'s `endBootOnNavigation`), which holds for
// every page, a plugin's included, without each one having to know.

let booting = true;

/** Whether a page drawn now is the boot's own, and so shows the splash. */
export function isBooting(): boolean {
  return booting;
}

/** The boot is over. Nothing starts it again for the life of the tab, a
 * sign-out included, as the global it replaces never did. */
export function endBoot(): void {
  booting = false;
}

/** For tests: a fresh boot, as a new tab would have. */
export function resetBootForTests(): void {
  booting = true;
}
