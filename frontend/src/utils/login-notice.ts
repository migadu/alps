// Carries a one-shot message to the login screen (e.g. "You have been signed
// out") across the navigation that returns the user there. Stored in
// sessionStorage so it survives the hash change but never outlives the tab.

const STORAGE_KEY = 'alps-login-notice';

export type LoginNotice = 'signedOut' | 'sessionExpired' | 'inactivitySignedOut';

export function setLoginNotice(notice: LoginNotice) {
  try {
    sessionStorage.setItem(STORAGE_KEY, notice);
  } catch {
    // Ignore storage errors (e.g. private mode) — the notice is non-critical.
  }
}

// Reads and clears the pending notice so it's shown exactly once.
export function takeLoginNotice(): LoginNotice | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (value) sessionStorage.removeItem(STORAGE_KEY);
    return (value as LoginNotice) || null;
  } catch {
    return null;
  }
}
