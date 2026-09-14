import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLoginNotice, takeLoginNotice } from '../src/utils/login-notice';

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe('login notice', () => {
  it('is shown exactly once', () => {
    setLoginNotice('sessionExpired');
    expect(takeLoginNotice()).toBe('sessionExpired');
    expect(takeLoginNotice()).toBeNull();
  });

  it('keeps only the latest notice', () => {
    setLoginNotice('signedOut');
    setLoginNotice('signedOutDraftsLost');
    expect(takeLoginNotice()).toBe('signedOutDraftsLost');
  });

  it('is empty when nothing was set', () => {
    expect(takeLoginNotice()).toBeNull();
  });

  it('survives storage that refuses access', () => {
    // Blocked site data throws on the storage call itself.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(() => setLoginNotice('signedOut')).not.toThrow();
    expect(takeLoginNotice()).toBeNull();
  });
});
