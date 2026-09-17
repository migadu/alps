/**
 * What a probe of the cached session proved.
 *
 * Its own module because the harness's session reuse turns on this one rule,
 * and the tempting reading — "anything but 2xx means the session is dead" — is
 * the wrong one. A 502 while the IMAP server is briefly busy, or a dropped
 * connection, says nothing about the session; treating it as dead sends the
 * test back to the login form, and a run that should sign in once starts
 * signing in once per test.
 *
 * Only a 401 is an answer: the server looked at the cookie and found no
 * session. Being wrong in the other direction costs one failed test, whose
 * next request says the session really is gone.
 */
export type SessionVerdict = "dead" | "alive" | "unknown";

/** `status` is the probe's HTTP status, or null when it never completed. */
export function sessionVerdict(status: number | null): SessionVerdict {
  if (status === null) return "unknown";
  if (status === 401) return "dead";
  if (status >= 200 && status < 300) return "alive";
  return "unknown";
}

/** Whether a probe with this status should keep the cached session. */
export function keepSession(status: number | null): boolean {
  return sessionVerdict(status) !== "dead";
}
