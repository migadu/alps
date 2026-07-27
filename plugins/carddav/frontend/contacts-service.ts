import { fetchWithTimeout, encodePathParam } from '../../../frontend/src/utils/fetch-utils';

export interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  birthday?: string;
  note?: string;
  title?: string;
  organization?: string;
  url?: string;
  nickname?: string;
  categories?: string[];
  path?: string;
  [key: string]: any;
}

class ContactsService {
  async fetchContacts(query: string = '') {
    const url = query ? `/contacts?query=${encodeURIComponent(query)}` : '/contacts';
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch contacts: ${res.statusText}`);
    }
    return res.json();
  }

  async fetchContact(path: string) {
    const res = await fetchWithTimeout(`/contacts/${encodePathParam(path)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch contact: ${res.statusText}`);
    }
    return res.json();
  }

  async createContact(payload: ContactPayload) {
    const res = await fetchWithTimeout('/contacts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`Failed to create contact: ${res.statusText}`);
    }
    return res.json();
  }

  async updateContact(path: string, payload: ContactPayload) {
    const res = await fetchWithTimeout(`/contacts/${encodePathParam(path)}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`Failed to update contact: ${res.statusText}`);
    }
    return res.json();
  }

  async deleteContact(path: string) {
    const res = await fetchWithTimeout(`/contacts/${encodePathParam(path)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      throw new Error(`Failed to delete contact: ${res.statusText}`);
    }
  }

  async bulkUpdateContacts(contacts: ContactPayload[]) {
    const promises = contacts.map(contact => {
      if (!contact.path) return Promise.resolve();
      return this.updateContact(contact.path, contact);
    });
    await Promise.all(promises);
  }

  async bulkDeleteContacts(paths: string[]) {
    const promises = paths.map(path => this.deleteContact(path));
    await Promise.all(promises);
  }
}

export const contactsService = new ContactsService();
