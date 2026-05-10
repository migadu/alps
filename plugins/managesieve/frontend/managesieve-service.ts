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
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save script');
    }
    return data;
  }

  async validateScript(script: string) {
    const res = await fetchWithTimeout('/managesieve/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: script })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Validation failed');
    }
    return data;
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
