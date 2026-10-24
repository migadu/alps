import { createContext } from '@lit/context';
import { Logger } from '../utils/logger';

export interface LinkedAccount {
    username: string;
    display_name?: string;
    imap_server?: string;
    added_at?: string;
}

export interface LinkedAccountsData {
    accounts: LinkedAccount[];
}

export class LinkedAccountsStore extends EventTarget {
    private accounts: LinkedAccount[] = [];
    private loading = false;
    private initialized = false;
    /**
     * Moves when the session ends, so a read for the session that ended
     * cannot land in the next one.
     */
    private epoch = 0;

    constructor() {
        super();
        // The list is the signed-in account's, and signing out does not reload
        // the page. It was kept, and marked read, so the next user to sign in
        // on this tab had the menu and the settings page list the previous
        // user's linked accounts: both fetch only when nothing has been read.
        window.addEventListener('session-cleared', () => {
            this.epoch++;
            this.accounts = [];
            this.initialized = false;
            this.loading = false;
            this.dispatchEvent(new Event('change'));
        });
    }

    getAccounts() {
        return this.accounts;
    }

    isLoading() {
        return this.loading;
    }

    isInitialized() {
        return this.initialized;
    }

    async fetchAccounts() {
        const epoch = this.epoch;
        this.loading = true;
        this.dispatchEvent(new Event('change'));
        
        try {
            const response = await fetch('/accounts');
            if (response.ok) {
                const data: LinkedAccountsData = await response.json();
                if (epoch !== this.epoch) return;
                this.accounts = data.accounts || [];
                this.initialized = true;
            } else {
                Logger.error('Failed to fetch linked accounts');
            }
        } catch (error) {
            Logger.error('Error fetching linked accounts:', error);
        } finally {
            if (epoch === this.epoch) {
                this.loading = false;
                this.dispatchEvent(new Event('change'));
            }
        }
    }

    async addAccount(username: string, password: string, displayName: string = '') {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('display_name', displayName);

        const response = await fetch('/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to add linked account');
        }

        await this.fetchAccounts();
    }

    async removeAccount(username: string) {
        const response = await fetch(`/accounts/${encodeURIComponent(username)}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to remove linked account');
        }

        await this.fetchAccounts();
    }

    async switchAccount(username: string) {
        const formData = new URLSearchParams();
        formData.append('username', username);

        const response = await fetch('/accounts/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to switch account');
        }
        
        return await response.json();
    }
}

export const linkedAccountsStore = new LinkedAccountsStore();
export const linkedAccountsContext = createContext<LinkedAccountsStore>('alps-linked-accounts');
