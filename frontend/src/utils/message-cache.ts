export interface CachedMessage {
  Message: any;
  Part: any;
  Attachments?: any[];
  RawHtml?: string;
  RawText?: string;
  HasHTML?: boolean;
  HasText?: boolean;
  timestamp: number;
}

const CACHE_PREFIX = 'alps_msg_';
const TTL_MS = 30 * 60 * 1000; // 30 minutes

export const MessageCache = {
  get(mailbox: string, uid: string, preferredView: string = 'html'): CachedMessage | null {
    try {
      const key = `${CACHE_PREFIX}${mailbox}_${uid}_${preferredView}`;
      const itemStr = sessionStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr) as CachedMessage;
      if (Date.now() - item.timestamp > TTL_MS) {
        sessionStorage.removeItem(key);
        return null;
      }
      return item;
    } catch (e) {
      console.error('Failed to read message cache', e);
      return null;
    }
  },

  set(mailbox: string, uid: string, preferredView: string, data: Omit<CachedMessage, 'timestamp'>) {
    try {
      const key = `${CACHE_PREFIX}${mailbox}_${uid}_${preferredView}`;
      const item: CachedMessage = {
        ...data,
        timestamp: Date.now()
      };
      
      const stringified = JSON.stringify(item);
      
      // Do not cache exceptionally large messages (> 2MB)
      if (stringified.length > 2 * 1024 * 1024) {
        console.warn(`Message ${uid} is too large to cache (${Math.round(stringified.length/1024)}KB)`);
        return;
      }
      
      sessionStorage.setItem(key, stringified);
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
        // If quota exceeded, clear old cache and try one more time
        console.warn('Session storage quota exceeded, clearing cache and retrying...');
        this.clear();
        try {
          const key = `${CACHE_PREFIX}${mailbox}_${uid}_${preferredView}`;
          const item: CachedMessage = { ...data, timestamp: Date.now() };
          sessionStorage.setItem(key, JSON.stringify(item));
        } catch (retryErr) {
          console.error('Failed to write message cache even after clearing', retryErr);
        }
      } else {
        console.error('Failed to write message cache', e);
      }
    }
  },

  clear() {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch (e) {
      console.error('Failed to clear message cache', e);
    }
  }
};
