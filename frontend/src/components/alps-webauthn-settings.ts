import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { registerCredential } from '../utils/webauthn-utils';
import { renderIcon } from '../utils/ui';

import './alps-setting-group';
import './alps-icon-btn';
import './alps-button';
import './ui-prompt';

interface CredentialDisplay {
    ID: string;
    Name: string;
    AddedAt: string;
}

interface WebAuthnSettingsData {
    credentialCount: number;
    credentials: CredentialDisplay[];
    isSecuritySettings: boolean;
    trustLinkedAccounts: boolean;
}

@customElement('alps-webauthn-settings')
export class AlpsWebauthnSettings extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;

    @state() private data: WebAuthnSettingsData | null = null;
    @state() private error = '';
    @state() private loading = true;
    @state() private adding = false;
    @state() private showNamePrompt = false;
    @state() private pendingCredential: any = null;

    static styles = css`
        :host { display: block; }
        .setting-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px;
            background: var(--bg-secondary);
            border-radius: 8px;
            margin-bottom: 8px;
        }
        .icon-container {
            display: flex;
            align-items: center;
            color: var(--text-secondary);
        }
        .icon-container svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }
        .cred-list { margin-top: 16px; }
        .alert { padding: 12px; border-radius: 6px; background: rgba(220, 38, 38, 0.1); color: var(--danger-color); margin-bottom: 12px; }
    `;

    connectedCallback() {
        super.connectedCallback();
        this.fetchData();
    }

    async fetchData() {
        try {
            this.loading = true;
            const res = await fetch('/settings/2fa');
            if (!res.ok) throw new Error('Failed to fetch settings');
            this.data = await res.json();
        } catch (e: any) {
            this.error = e.message;
        } finally {
            this.loading = false;
        }
    }



    async handleTrustToggle(e: Event) {
        const target = e.target as HTMLInputElement;
        await fetch('/settings/2fa/trust-linked-accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trust: target.checked })
        });
        this.fetchData();
    }

    async addCredential() {
        this.adding = true;
        this.error = '';
        try {
            const res = await fetch('/settings/2fa/begin', { method: 'POST' });
            if (!res.ok) throw new Error(await res.text());
            const options = await res.json();

            const credential = await registerCredential(options);

            // Show prompt to name the key before finishing
            this.pendingCredential = credential;
            this.showNamePrompt = true;
            this.adding = false;
        } catch (e: any) {
            if (e.name === 'NotAllowedError' || (e.message && e.message.includes('not allowed'))) {
                // User cancelled or key is already registered. Swallow the error.
                this.error = '';
            } else {
                this.error = e.message;
            }
            this.adding = false;
        }
    }

    private async _handlePromptSubmit(e: CustomEvent) {
        const keyName = e.detail.keyName || 'Security Key';
        this.showNamePrompt = false;

        const payload = {
            ...this.pendingCredential,
            name: keyName
        };

        this.adding = true;
        this.error = '';

        try {
            const finishRes = await fetch('/settings/2fa/finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!finishRes.ok) throw new Error(await finishRes.text());

            this.fetchData();
        } catch (err: any) {
            this.error = err.message;
        } finally {
            this.adding = false;
            this.pendingCredential = null;
        }
    }

    private _handlePromptCancel() {
        this.showNamePrompt = false;
        this.pendingCredential = null;
    }

    async removeCredential(id: string) {
        if (confirm(this.i18nStore?.t('webauthn.confirm_remove'))) {
            try {
                this.error = '';
                const res = await fetch(`/settings/2fa/credential/${encodeURIComponent(id)}/delete`, { method: 'POST' });
                if (!res.ok) throw new Error(await res.text());
                this.fetchData();
            } catch (err: any) {
                this.error = err.message || this.i18nStore?.t('webauthn.errors.remove_failed');
            }
        }
    }

    render() {
        if (this.loading) return html`<div>Loading...</div>`;

        return html`
            ${this.showNamePrompt ? html`
                <ui-prompt 
                    title=${this.i18nStore?.t('webauthn.name_key_title')}
                    confirmText=${this.i18nStore?.t('general.save')}
                    cancelText=${this.i18nStore?.t('general.cancel')}
                    .fields=${[
                    {
                        id: 'keyName',
                        label: this.i18nStore?.t('webauthn.name_key_label'),
                        placeholder: this.i18nStore?.t('webauthn.key_name_placeholder'),
                        autofocus: true
                    }
                ]}
                    @submit=${this._handlePromptSubmit}
                    @cancel=${this._handlePromptCancel}
                ></ui-prompt>
            ` : ''}


            <alps-setting-group 
                label="${this.i18nStore?.t('webauthn.settings.keys_title')}" 
                description="${this.i18nStore?.t('webauthn.settings.group_desc')}">
                ${this.error ? html`<div class="alert">${this.error}</div>` : ''}

                <div class="cred-list" style="margin-top: 0;">
                    ${this.data?.credentialCount && this.data.credentialCount > 0 ? html`
                        ${this.data?.credentials.map(c => html`
                            <div class="setting-row">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="icon-container">${renderIcon('fingerprint')}</div>
                                    <strong>${c.Name || 'Security Key'}</strong>
                                </div>
                                <div style="display: flex; align-items: center; gap: 16px;">
                                    <div style="font-size: 13px; color: var(--text-muted);">${this.i18nStore?.t('webauthn.settings.added')} ${new Date(c.AddedAt).toLocaleString()}</div>
                                    <alps-icon-btn icon="trash" @click=${() => this.removeCredential(c.ID)} title=${this.i18nStore?.t('webauthn.settings.remove_btn') || 'Remove'}></alps-icon-btn>
                                </div>
                            </div>
                        `)}
                    ` : ''}
                    <alps-button variant="normal" style="margin-top: 12px;" @click=${this.addCredential} ?disabled=${this.adding} ?spinning=${this.adding}>
                        ${this.i18nStore?.t('webauthn.add_key')}
                    </alps-button>
                </div>
            </alps-setting-group>

            ${(this.data?.credentialCount ?? 0) > 0 ? html`
                <alps-setting-group label="${this.i18nStore?.t('webauthn.trust_linked')}" description="${this.i18nStore?.t('webauthn.trust_linked_desc')}">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
                        <input type="checkbox" .checked=${this.data?.trustLinkedAccounts} @change=${this.handleTrustToggle}>
                        ${this.i18nStore?.t('webauthn.trust_linked_checkbox')}
                    </label>
                </alps-setting-group>
            ` : ''}
        `;
    }
}


