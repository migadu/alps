import { MessageCache } from '../utils/message-cache';
import { Logger } from '../utils/logger';
import { clearSessionSettings } from '../store/settings-store';

class AutoLogoutService {
  private events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  private logoutMinutes: number = 0;
  private lastActivity: number = Date.now();
  private lastPing: number = Date.now();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  public onBeforeLogout?: () => Promise<void>;

  public setLogoutTime(minutes: number) {
    const wasActive = this.logoutMinutes > 0;
    this.logoutMinutes = minutes;
    const isActive = this.logoutMinutes > 0;

    if (isActive && !wasActive) {
      this.attachEvents();
      this.startInterval();
    } else if (!isActive && wasActive) {
      this.detachEvents();
      this.clearInterval();
    } else if (isActive && wasActive) {
      this.lastActivity = Date.now(); // reset on config change
    }
  }

  private handleActivity = () => {
    this.lastActivity = Date.now();
  };

  private attachEvents() {
    this.events.forEach(event => document.addEventListener(event, this.handleActivity, { passive: true }));
    this.lastActivity = Date.now();
  }

  private detachEvents() {
    this.events.forEach(event => document.removeEventListener(event, this.handleActivity));
  }

  private startInterval() {
    this.clearInterval();
    // Check every 30 seconds if we've passed the threshold
    this.checkInterval = setInterval(() => this.checkTimeout(), 30000);
  }

  private clearInterval() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private checkTimeout() {
    if (this.logoutMinutes <= 0) return;
    
    // Don't auto-logout if we're already at the login screen
    if (window.location.hash === '#/login' || window.location.hash === '') {
      this.lastActivity = Date.now();
      return;
    }

    const msSinceActive = Date.now() - this.lastActivity;
    const timeoutMs = this.logoutMinutes * 60 * 1000;

    if (msSinceActive >= timeoutMs) {
      this.logout();
    } else {
      // If user was active recently and it's been more than 5 minutes since last ping
      if (msSinceActive < 5 * 60 * 1000 && Date.now() - this.lastPing > 5 * 60 * 1000) {
        this.pingBackend();
      }
    }
  }

  private async pingBackend() {
    this.lastPing = Date.now();
    try {
      // Silent fetch to keep backend session alive
      await fetch('/session');
    } catch (err) {
      // Ignore ping errors
    }
  }

  private async logout() {
    this.clearInterval();
    this.detachEvents();
    
    if (this.onBeforeLogout) {
      try {
        await this.onBeforeLogout();
      } catch (err) {
        Logger.error('Failed to run onBeforeLogout hook', err);
      }
    }

    try {
      await fetch('/session', { method: 'DELETE' });
      MessageCache.clear();
      clearSessionSettings();
      window.dispatchEvent(new CustomEvent('session-cleared'));
      window.location.hash = '#/login';
      
      // Optionally reset so if they log back in it can re-attach
      this.lastActivity = Date.now();
      this.setLogoutTime(this.logoutMinutes);
    } catch (err) {
      Logger.error('Failed to auto sign out', err);
    }
  }
}

export const autoLogoutService = new AutoLogoutService();
