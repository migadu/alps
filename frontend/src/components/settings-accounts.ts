import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { linkedAccountsContext, LinkedAccountsStore } from '../store/linked-accounts-store';
import './alps-setting-group';
import './alps-icon-btn';
import './alps-avatar';
import './alps-input';
import './alps-button';

@customElement('settings-accounts')
export class SettingsAccounts extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;

    @consume({ context: linkedAccountsContext })
    linkedAccountsStore!: LinkedAccountsStore;

    @state() private newUsername = '';
    @state() private newPassword = '';
    @state() private newDisplayName = '';
    @state() private isSubmitting = false;
    @state() private error = '';
    @state() private showAddForm = false;

    static styles = css`
        :host {
            display: block;
        }
            
        .setting-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px;
            background: var(--bg-secondary);
            border-radius: 8px;
            margin-bottom: 8px;
        }

        .add-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 16px;
        }

        .form-row {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .error-message {
            color: var(--danger-color, #dc2626);
            font-size: 13px;
            margin-top: 8px;
        }

        .empty-state {
            color: var(--text-muted);
            font-style: italic;
            padding: 16px 0;
            text-align: left;
        }
    `;

    private _handleStoreChange = () => {
        this.requestUpdate();
    };

    connectedCallback() {
        super.connectedCallback();
        this.updateComplete.then(() => {
            this.i18nStore?.addEventListener('change', this._handleStoreChange);
            this.linkedAccountsStore?.addEventListener('change', this._handleStoreChange);
            if (this.linkedAccountsStore && !this.linkedAccountsStore.isInitialized()) {
                this.linkedAccountsStore.fetchAccounts();
            }
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.i18nStore?.removeEventListener('change', this._handleStoreChange);
        this.linkedAccountsStore?.removeEventListener('change', this._handleStoreChange);
    }

    private async handleAdd(e: Event) {
        e.preventDefault();
        if (!this.newUsername || !this.newPassword) return;

        this.isSubmitting = true;
        this.error = '';

        try {
            await this.linkedAccountsStore.addAccount(this.newUsername, this.newPassword, this.newDisplayName);
            this.newUsername = '';
            this.newPassword = '';
            this.newDisplayName = '';
            this.showAddForm = false;
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.i18nStore?.t('linkedAccounts.addedSuccess') } }));
        } catch (err: any) {
            this.error = err.message || this.i18nStore?.t('linkedAccounts.addError');
        } finally {
            this.isSubmitting = false;
        }
    }

    private async handleRemove(username: string) {
        if (!confirm(this.i18nStore?.t('linkedAccounts.removeConfirm'))) {
            return;
        }

        try {
            await this.linkedAccountsStore.removeAccount(username);
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.i18nStore?.t('linkedAccounts.removedSuccess') } }));
        } catch (err: any) {
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: err.message || this.i18nStore?.t('linkedAccounts.removeError') } }));
        }
    }

    render() {
        const accounts = this.linkedAccountsStore?.getAccounts() || [];
        const isLoading = this.linkedAccountsStore?.isLoading();

        return html`
            <alps-setting-group 
                label="${this.i18nStore?.t('settings.categories.accounts')}"
                description="${this.i18nStore?.t('settings.categories.accountsDesc')}">
                
                <div class="account-list">
                    ${isLoading && !this.linkedAccountsStore.isInitialized() ? html`<div>${this.i18nStore?.t('settings.loading')}</div>` :
                accounts.length === 0 ? html`<div class="empty-state">${this.i18nStore?.t('linkedAccounts.noAccounts')}</div>` :
                    accounts.map(account => html`
                        <div class="setting-row">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <alps-avatar .name=${account.display_name || account.username} .size=${24}></alps-avatar>
                                <div style="display: flex; flex-direction: column; gap: 2px;">
                                    <strong>${account.display_name || account.username}</strong>
                                    ${account.display_name ? html`<div style="font-size: 13px; color: var(--text-secondary);">${account.username}</div>` : ''}
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 16px;">
                                ${account.added_at && new Date(account.added_at).getFullYear() > 1970 ? html`
                                    <div style="font-size: 13px; color: var(--text-muted);">
                                        ${this.i18nStore?.t('webauthn.settings.added')} ${new Date(account.added_at).toLocaleString()}
                                    </div>
                                ` : ''}
                                <alps-icon-btn icon="trash" @click=${() => this.handleRemove(account.username)} title="${this.i18nStore?.t('linkedAccounts.remove')}"></alps-icon-btn>
                            </div>
                        </div>
                    `)}
                </div>

                ${!this.showAddForm ? html`
                    <alps-button variant="normal" style="margin-top: 16px;" @click=${() => this.showAddForm = true}>
                        ${this.i18nStore?.t('linkedAccounts.addTitle')}
                    </alps-button>
                ` : ''}
            </alps-setting-group>

            ${this.showAddForm ? html`
            <alps-setting-group 
                label="${this.i18nStore?.t('linkedAccounts.addTitle')}"
                description="${this.i18nStore?.t('linkedAccounts.description')}">
                <form class="add-form" style="margin-top: 0;" @submit=${this.handleAdd}>
                    <div class="form-row">
                        <alps-input 
                            type="email" 
                            placeholder="${this.i18nStore?.t('login.emailPlaceholder')}"
                            .value=${this.newUsername}
                            @input=${(e: Event) => this.newUsername = (e.target as HTMLInputElement).value}
                            ?required=${true}
                        ></alps-input>
                    </div>
                    
                    <div class="form-row">
                        <alps-input 
                            type="password" icon="key"
                            placeholder="${this.i18nStore?.t('login.passwordPlaceholder')}"
                            .value=${this.newPassword}
                            @input=${(e: Event) => this.newPassword = (e.target as HTMLInputElement).value}
                            ?required=${true}
                        ></alps-input>
                    </div>

                    <div class="form-row">
                        <alps-input 
                            type="text" icon="user"
                            placeholder="${this.i18nStore?.t('settings.identity.displayName')} (${this.i18nStore?.t('general.optional')})"
                            .value=${this.newDisplayName}
                            @input=${(e: Event) => this.newDisplayName = (e.target as HTMLInputElement).value}
                        ></alps-input>
                    </div>

                    ${this.error ? html`<div class="error-message">${this.error}</div>` : ''}

                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <alps-button variant="primary" ?disabled=${this.isSubmitting || !this.newUsername || !this.newPassword} ?spinning=${this.isSubmitting} @click=${this.handleAdd}>
                            ${this.i18nStore?.t('linkedAccounts.linkAccount')}
                        </alps-button>
                        <alps-button variant="text" @click=${(e: Event) => { e.preventDefault(); this.showAddForm = false; }}>
                            ${this.i18nStore?.t('general.cancel')}
                        </alps-button>
                    </div>
                </form>
            </alps-setting-group>
            ` : ''}
        `;
    }
}
