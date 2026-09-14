import { noteVersion } from '../services/app-update';

/**
 * Encodes a value for use as a single path segment in a backend URL when the
 * value may itself contain the `/` character — e.g. an IMAP mailbox name like
 * Gmail's `[Gmail]/All Mail`, or a CardDAV/CalDAV object path (`.../uid.vcf`).
 *
 * Go's net/http.ServeMux decodes `%2F` back to `/` before routing, which would
 * split a single-segment `{param}` wildcard and make the request 404. We
 * therefore double-encode: the extra layer survives ServeMux's one decode as a
 * literal `%2F` (so the segment is not split), and the backend handler undoes it
 * with a single `url.PathUnescape`. This is a no-op for values without special
 * characters. See GitHub issue #4.
 *
 * Only use this for a URL *path segment*; values sent in a request body or query
 * string must be sent verbatim, not double-encoded.
 */
export function encodePathParam(value: string): string {
  return encodeURIComponent(encodeURIComponent(value));
}

/**
 * A backend answer that was not 2xx, with its status kept, so a caller can
 * tell a refusal it has words for from a failure it has none for.
 */
export class HttpStatusError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpStatusError';
    this.status = status;
  }
}

/**
 * Was this a save the server refused because the event or contact had been
 * saved elsewhere since it was opened here?
 *
 * Not a failed request: pressing Save again is the wrong answer to it, because
 * the next attempt would read the other device's version and overwrite it. The
 * message says so instead, and the user looks at what was written first.
 */
export function isVersionConflict(error: unknown): boolean {
  return error instanceof HttpStatusError && error.status === 412;
}

/**
 * Upstream answers worth another attempt: the backend saying "not now" rather
 * than "no". A deploy rolling or an upstream connection being re-established
 * produces exactly these, briefly, and without a retry that blip reached the
 * person as a failed listing plus the offline banner.
 */
const RETRY_STATUSES = new Set([502, 503, 504]);
/** Two extra attempts, backing off. Short enough that a real outage still fails
 * fast rather than leaving the UI spinning. */
const RETRY_DELAYS_MS = [250, 1000];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchWithTimeout(url: RequestInfo | URL, options: RequestInit = {}, timeoutMs: number = 25000): Promise<Response> {
  // Only a GET is replayed. It is the one method here with no side effect; a
  // replayed POST could send a message or apply a move twice.
  const method = (options.method ?? (url instanceof Request ? url.method : 'GET')).toUpperCase();
  const attempts = method === 'GET' ? RETRY_DELAYS_MS.length + 1 : 1;

  let response!: Response;
  let controller!: AbortController;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const isLast = attempt === attempts - 1;
    const current = new AbortController();
    controller = current;
    const id = setTimeout(() => current.abort(), timeoutMs);
    try {
      response = await fetch(url, { ...options, signal: current.signal });
    } catch (error) {
      // A dropped connection is retried; a timeout is NOT, because the caller
      // has already waited the whole budget and a replay would multiply it.
      if (error instanceof TypeError && !isLast) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      if (error instanceof TypeError || (error as Error).name === 'AbortError') {
        window.dispatchEvent(new CustomEvent('network-error'));
      }
      throw error;
    } finally {
      clearTimeout(id);
    }

    if (RETRY_STATUSES.has(response.status) && !isLast) {
      // Nothing will read the refused attempt's body; release its connection.
      current.abort();
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }
    break;
  }

  // The deadline covers the BODY too. It used to be cleared the moment headers
  // arrived, after which every caller read the body (`res.json()` in some fifty
  // places) with no timeout at all: a response that sent its headers and then
  // stalled hung that call forever, spinner up. A fresh budget rather than what
  // was left of the first, so a slow answer that took most of it to START is not
  // cut off while it streams. Aborting once the body has been read is a no-op,
  // so nothing needs to clear this.
  const bodyController = controller;
  setTimeout(() => bodyController.abort(), timeoutMs);

  if (RETRY_STATUSES.has(response.status)) {
    // Announced only once the retries are spent, so a blip that healed itself
    // never raises the offline banner.
    window.dispatchEvent(new CustomEvent('network-error'));
  }
    // An expired session, announced once here rather than at every call site.
    //
    // The mail services each handle their own 401 and will dispatch this a
    // second time; app-root's handler is idempotent, so that is harmless. What
    // it fixes is the PLUGINS: not one line in caldav, carddav, gpg,
    // managesieve or password mentioned 401 or `auth-error`. A session expiring
    // while the user was on Calendar or Contacts produced a generic "Failed to
    // fetch events", over and over, with no sign-out and no explanation —
    // while the same expiry on the mail tab returned them to the login screen
    // immediately.
    //
    // NOT for the login endpoint, which answers 401 for a wrong password;
    // login-page deliberately uses bare `fetch` and must keep doing so, or a
    // failed sign-in would raise a session-expired notice over its own error.
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth-error'));
    }
  // Every API answer names the build the server serves. The dev server runs
  // the code being edited, whatever build the backend embeds, so it never asks.
  if (!import.meta.env.DEV) noteVersion(response);
  return response;
}
