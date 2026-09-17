/**
 * The rule the browser-test harness reuses a session by.
 *
 * Four lines, and still worth pinning: read backwards ("anything but 2xx is a
 * dead session"), a two-second upstream hiccup sends every test that starts
 * inside it back through the login form, and nothing at the point of the
 * mistake shows it.
 */
import { describe, expect, it } from 'vitest';
import { keepSession, sessionVerdict } from '../e2e/session-probe';

describe('sessionVerdict', () => {
  it('calls a 401 dead, the one answer about the session', () => {
    expect(sessionVerdict(401)).toBe('dead');
    expect(keepSession(401)).toBe(false);
  });

  it('calls a 2xx alive', () => {
    for (const status of [200, 204, 299]) {
      expect(sessionVerdict(status), `status ${status}`).toBe('alive');
      expect(keepSession(status)).toBe(true);
    }
  });

  it('calls a 5xx unknown, and keeps the session', () => {
    for (const status of [500, 502, 503, 504]) {
      expect(sessionVerdict(status), `status ${status}`).toBe('unknown');
      expect(keepSession(status), `status ${status}`).toBe(true);
    }
  });

  it('calls a request that never completed unknown', () => {
    expect(sessionVerdict(null)).toBe('unknown');
    expect(keepSession(null)).toBe(true);
  });

  it('does not read a refusal other than 401 as a dead session', () => {
    for (const status of [403, 404, 429]) {
      expect(sessionVerdict(status), `status ${status}`).toBe('unknown');
      expect(keepSession(status)).toBe(true);
    }
  });
});
