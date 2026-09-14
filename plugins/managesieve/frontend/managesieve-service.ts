import { fetchWithTimeout } from '../../../frontend/src/utils/fetch-utils';

class ManageSieveService {
  async fetchScript() {
    const res = await fetchWithTimeout('/managesieve/script');
    if (!res.ok) {
      throw new Error(`Failed to fetch script: ${res.statusText}`);
    }
    return res.json();
  }

  async saveScript(script: string, method: 'PUT' | 'POST' = 'PUT') {
    const res = await fetchWithTimeout('/managesieve/script', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: script })
    });
    // The body is read only once the status says it is ours to read. This parsed
    // it first, so a proxy's HTML 502 threw a SyntaxError and the user was shown
    // "Unexpected token '<'" in place of the failure — the defect sendDraft in
    // message-operations already guards against. Success parses as before.
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to save script');
    }
    return res.json();
  }

  async validateScript(script: string) {
    const res = await fetchWithTimeout('/managesieve/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: script })
    });
    // As saveScript above: the body is read only once the status says it is
    // ours. A 400 with a JSON body is an ordinary "this script is invalid"
    // answer and its `error` is still what the user sees; only a body that is
    // not JSON — a proxy's HTML 502 — now falls back to 'Validation failed'
    // instead of surfacing a SyntaxError.
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Validation failed');
    }
    return res.json();
  }

  async fetchFolders() {
    const res = await fetchWithTimeout('/mailboxes/INBOX');
    if (!res.ok) {
      throw new Error(`Failed to fetch mailboxes: ${res.statusText}`);
    }
    return res.json();
  }
}

export const managesieveService = new ManageSieveService();
