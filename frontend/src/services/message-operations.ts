import { messageSync } from './message-sync';
import { fetchWithTimeout } from '../utils/fetch-utils';
import { FLAG_FLAGGED, FLAG_SEEN } from '../utils/flags';

export class MessageOperationsService extends EventTarget {
  /**
   * Sets or toggles a flag on specified messages.
   * action: 'add', 'remove', or 'set'
   */
  async setFlag(mailbox: string, uids: string[], flags: string[], action: 'add' | 'remove' | 'set'): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(mailbox)}/messages/flag`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uids,
          flags,
          action
        })
      });
      if (res.status === 401) {
         this.dispatchEvent(new CustomEvent('auth-error'));
         window.dispatchEvent(new CustomEvent('auth-error'));
         return false;
      }
      return res.ok;
    } catch (err) {
      console.error('Failed to set flag', err);
      return false;
    }
  }

  /**
   * Toggles the starred state of a message and returns the updated message object.
   */
  async toggleStar(mailbox: string, message: any): Promise<any> {
    const uid = message?.UID;
    if (!uid) return message;
    
    const isStarred = message.Flags?.includes(FLAG_FLAGGED);
    const flagAction = isStarred ? 'remove' : 'add';
    
    const success = await this.setFlag(mailbox, [String(uid)], [FLAG_FLAGGED], flagAction);
    if (success) {
      const newMsg = { ...message };
      if (isStarred) {
        newMsg.Flags = newMsg.Flags.filter((f: string) => f !== FLAG_FLAGGED);
      } else {
        newMsg.Flags = [...(newMsg.Flags || []), FLAG_FLAGGED];
      }
      return newMsg;
    }
    return message;
  }

  /**
   * Marks a message as unread by removing the \Seen flag.
   */
  async markAsUnread(mailbox: string, message: any): Promise<boolean> {
    const uid = message?.UID;
    if (!uid) return false;
    
    const success = await this.setFlag(mailbox, [String(uid)], [FLAG_SEEN], 'remove');
    if (success) {
      return true;
    }
    return false;
  }

  /**
   * Marks a message as read by adding the \Seen flag.
   */
  async markAsRead(mailbox: string, message: any): Promise<any> {
    const uid = message?.UID;
    if (!uid) return message;
    
    // Don't do anything if it's already read
    if (message.Flags?.includes(FLAG_SEEN)) {
      return message;
    }
    
    const success = await this.setFlag(mailbox, [String(uid)], [FLAG_SEEN], 'add');
    if (success) {
      const newMsg = { ...message };
      newMsg.Flags = [...(newMsg.Flags || []), FLAG_SEEN];
      return newMsg;
    }
    return message;
  }







  /**
   * Permanently deletes multiple messages.
   */
  async deleteMessages(mailbox: string, uids: string[]): Promise<boolean> {
    if (!uids || uids.length === 0) return false;
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(mailbox)}/messages`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uids })
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
      console.error('Failed to delete messages', err);
      return false;
    }
  }

  /**
   * Moves multiple messages to another mailbox.
   */
  async moveMessages(mailbox: string, uids: string[], to: string): Promise<{ success: boolean, uidMapping?: Record<string, string> }> {
    if (!uids || uids.length === 0) return { success: false };
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(mailbox)}/messages/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uids, to })
      });
      if (res.status === 401) {
         this.dispatchEvent(new CustomEvent('auth-error'));
         window.dispatchEvent(new CustomEvent('auth-error'));
         return { success: false };
      }
      if (res.ok) {
        messageSync.sync();
        const data = await res.json();
        return { success: true, uidMapping: data.uidMapping };
      }
      return { success: false };
    } catch (err) {
      console.error('Failed to move messages', err);
      return { success: false };
    }
  }

  /**
   * Copies multiple messages to another mailbox.
   */
  async copyMessages(mailbox: string, uids: string[], to: string): Promise<{ success: boolean }> {
    if (!uids || uids.length === 0) return { success: false };
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(mailbox)}/messages/copy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uids, to })
      });
      if (res.status === 401) {
         this.dispatchEvent(new CustomEvent('auth-error'));
         window.dispatchEvent(new CustomEvent('auth-error'));
         return { success: false };
      }
      if (res.ok) {
        messageSync.sync();
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      console.error('Failed to copy messages', err);
      return { success: false };
    }
  }

  /**
   * Marks multiple messages as read.
   */
  async markMessagesAsRead(mailbox: string, uids: string[]): Promise<boolean> {
    if (!uids || uids.length === 0) return false;
    const success = await this.setFlag(mailbox, uids, [FLAG_SEEN], 'add');
    return success;
  }

  /**
   * Marks multiple messages as unread.
   */
  async markMessagesAsUnread(mailbox: string, uids: string[]): Promise<boolean> {
    if (!uids || uids.length === 0) return false;
    const success = await this.setFlag(mailbox, uids, [FLAG_SEEN], 'remove');
    return success;
  }

  /**
   * Saves a composer instance as a draft on the server.
   */
  async saveDraft(formData: FormData): Promise<{ uid: string; mailbox: string; size?: number; attachments?: any[] } | null> {
    try {
      const res = await fetchWithTimeout('/messages', {
        method: 'POST',
        body: formData
      });
      if (res.status === 401) {
        this.dispatchEvent(new CustomEvent('auth-error'));
        window.dispatchEvent(new CustomEvent('auth-error'));
        return null;
      }
      if (res.ok) {
        const data = await res.json();
        return { uid: data.draft_uid, mailbox: data.draft_mailbox, size: data.draft_size, attachments: data.attachments };
      }
      const err = await res.json();
      console.error('Failed to save draft:', err);
      return null;
    } catch (err) {
      console.error('Failed to save draft:', err);
      return null;
    }
  }

  /**
   * Sends a composer instance message.
   */
  async sendDraft(formData: FormData): Promise<boolean> {
    try {
      const res = await fetchWithTimeout('/messages', {
        method: 'POST',
        body: formData
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
      const err = await res.json();
      throw new Error(err.error || 'Failed to send message');
    } catch (err: any) {
      console.error('Failed to send message:', err);
      throw err;
    }
  }
}

export const messageOperations = new MessageOperationsService();
