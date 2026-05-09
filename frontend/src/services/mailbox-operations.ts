import { fetchWithTimeout } from '../utils/fetch-utils';
import { messageSync } from './message-sync';
import { Logger } from '../utils/logger';

export class MailboxOperationsService extends EventTarget {
  
  async createMailbox(name: string): Promise<boolean> {
    try {
      const formData = new URLSearchParams();
      formData.append('name', name);
      
      const res = await fetchWithTimeout('/mailboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
      
      if (res.status === 401) {
        this.dispatchEvent(new CustomEvent('auth-error'));
        window.dispatchEvent(new CustomEvent('auth-error'));
        return false;
      }
      
      if (res.ok) {
        // Trigger a sync to refresh mailbox list
        messageSync.sync();
        return true;
      }
      return false;
    } catch (err) {
      Logger.error('Failed to create mailbox', err);
      return false;
    }
  }

  async renameMailbox(oldName: string, newName: string): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(oldName)}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: newName })
      });
      
      if (res.status === 401) {
        this.dispatchEvent(new CustomEvent('auth-error'));
        window.dispatchEvent(new CustomEvent('auth-error'));
        return false;
      }
      
      if (res.ok) {
        messageSync.sync();
        return true;
      }
      return false;
    } catch (err) {
      Logger.error('Failed to rename mailbox', err);
      return false;
    }
  }

  async deleteMailbox(name: string): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      
      if (res.status === 401) {
        this.dispatchEvent(new CustomEvent('auth-error'));
        window.dispatchEvent(new CustomEvent('auth-error'));
        return false;
      }
      
      if (res.ok) {
        messageSync.sync();
        return true;
      }
      return false;
    } catch (err) {
      Logger.error('Failed to delete mailbox', err);
      return false;
    }
  }

  async emptyMailbox(name: string): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(name)}/empty`, {
        method: 'POST'
      });
      
      if (res.status === 401) {
        this.dispatchEvent(new CustomEvent('auth-error'));
        window.dispatchEvent(new CustomEvent('auth-error'));
        return false;
      }
      
      if (res.ok) {
        messageSync.sync();
        return true;
      }
      return false;
    } catch (err) {
      Logger.error('Failed to empty mailbox', err);
      return false;
    }
  }

  async subscribeMailbox(name: string): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(name)}/subscribe`, {
        method: 'PUT'
      });
      
      if (res.status === 401) {
        this.dispatchEvent(new CustomEvent('auth-error'));
        window.dispatchEvent(new CustomEvent('auth-error'));
        return false;
      }
      
      if (res.ok) {
        messageSync.sync();
        return true;
      }
      return false;
    } catch (err) {
      Logger.error('Failed to subscribe mailbox', err);
      return false;
    }
  }

  async unsubscribeMailbox(name: string): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(name)}/unsubscribe`, {
        method: 'PUT'
      });
      
      if (res.status === 401) {
        this.dispatchEvent(new CustomEvent('auth-error'));
        window.dispatchEvent(new CustomEvent('auth-error'));
        return false;
      }
      
      if (res.ok) {
        messageSync.sync();
        return true;
      }
      return false;
    } catch (err) {
      Logger.error('Failed to unsubscribe mailbox', err);
      return false;
    }
  }
}

export const mailboxOperations = new MailboxOperationsService();
