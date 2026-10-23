// Whether this page has ended its session on purpose: with the Sign Out
// button, or by the idle sign-out.
//
// Ending the session on the server has the requests still in flight refused
// (401), and each refusal raises `auth-error`. Those refusals are the
// sign-out's echo, not an expiry. Taken for one, they replaced "You have been
// signed out" with "Your session has expired": on this login screen, or, when
// the login page had already read its notice, at the next visit to it, since
// the notice waits in sessionStorage until it is read. The shell asks here
// before it treats a refusal as an expiry.
//
// Noted ahead of the request that ends the session, since that request is
// what has the others refused, and forgotten at the next sign-in, after which
// a refusal is an expiry again.

let ended = false;

/** Notes that the session is being ended on purpose. */
export function noteSignOut(): void {
  ended = true;
}

/** Whether the session was ended on purpose since the last sign-in. */
export function signedOutOnPurpose(): boolean {
  return ended;
}

window.addEventListener('user-logged-in', () => {
  ended = false;
});
