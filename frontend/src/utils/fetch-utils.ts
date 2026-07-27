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
