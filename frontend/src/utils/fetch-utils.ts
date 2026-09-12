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

export async function fetchWithTimeout(url: RequestInfo | URL, options: RequestInit = {}, timeoutMs: number = 25000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (response.status === 502 || response.status === 503 || response.status === 504) {
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
    return response;
  } catch (error) {
    if (error instanceof TypeError || (error as Error).name === 'AbortError') {
      window.dispatchEvent(new CustomEvent('network-error'));
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}
