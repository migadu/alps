import { createContext } from '@lit/context';

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

    constructor() {
        super();
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
        this.loading = true;
        this.dispatchEvent(new Event('change'));
        
        try {
            const response = await fetch('/accounts');
            if (response.ok) {
                const data: LinkedAccountsData = await response.json();
                this.accounts = data.accounts || [];
                this.initialized = true;
            } else {
                console.error('Failed to fetch linked accounts');
            }
        } catch (error) {
            console.error('Error fetching linked accounts:', error);
        } finally {
            this.loading = false;
            this.dispatchEvent(new Event('change'));
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
