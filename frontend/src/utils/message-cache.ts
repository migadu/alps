import { Logger } from './logger';
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

/**
 * Moves every time the cache is emptied for a session that ended.
 *
 * The keys name a mailbox and a UID and no user, so a body is only safe to
 * write while the session that read it is still the current one. A reader
 * still waiting on the server when its user signs out gets the answer
 * afterwards, and writing it then put the previous user's message back into
 * a cache the next person to sign in on this tab opens from. A reader takes
 * the generation before it asks, and writes only if it has not moved.
 *
 * Moved on `session-cleared` as well as by `clear()`, because an expired
 * session empties sessionStorage wholesale and never calls `clear()`.
 */
let generation = 0;

if (typeof window !== 'undefined') {
  window.addEventListener('session-cleared', () => {
    generation++;
  });
}

function removeAll() {
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
    Logger.error('Failed to clear message cache', e);
  }
}

export const MessageCache = {
  /** See {@link generation}. */
  generation(): number {
    return generation;
  },

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
      Logger.error('Failed to read message cache', e);
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
        // Room, not a new session: the reads in flight are still this user's.
        removeAll();
        try {
          const key = `${CACHE_PREFIX}${mailbox}_${uid}_${preferredView}`;
          const item: CachedMessage = { ...data, timestamp: Date.now() };
          sessionStorage.setItem(key, JSON.stringify(item));
        } catch (retryErr) {
          Logger.error('Failed to write message cache even after clearing', retryErr);
        }
      } else {
        Logger.error('Failed to write message cache', e);
      }
    }
  },

  clear() {
    generation++;
    removeAll();
  }
};
