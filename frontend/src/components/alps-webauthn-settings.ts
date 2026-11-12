import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { registerCredential } from '../utils/webauthn-utils';
import { renderIcon } from '../utils/ui';
import { fetchWithTimeout } from '../utils/fetch-utils';

import './alps-setting-group';
import './alps-icon-btn';
import './alps-button';
import './ui-prompt';
import './ui-modal';

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
    recoveryCodesLeft?: number;
    recoveryCodesAvailable?: boolean;
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
    @state() private pendingDeleteId: string | null = null;
    @state() private showTrustPrompt = false;
    @state() private trustBusy = false;
    @state() private removeBusy = false;
    /**
     * The removal prompt's field errors. Assigned only when a refusal arrives,
     * never rebuilt on render: ui-prompt takes its errors again whenever this
     * object changes, and a fresh one would bring back an error the user had
     * already typed past.
     */
    @state() private removeErrors: Record<string, string> = {};
    /**
     * Recovery codes just made, which the server shows this once: with the
     * first key, or when new ones are asked for. Shown until the user is done
     * with them.
     */
    @state() private shownCodes: string[] | null = null;
    @state() private showCodesPrompt = false;
    @state() private codesBusy = false;
    /** The new-codes prompt's field errors, assigned as removeErrors is. */
    @state() private codesErrors: Record<string, string> = {};

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
        .alert { padding: 12px; border-radius: 6px; background: rgba(220, 38, 38, 0.1); color: var(--error, #ef4444); margin-bottom: 12px; }
        .codes {
            margin: 16px 0 0;
            padding: 0;
            list-style: none;
            display: grid;
            grid-template-columns: repeat(2, max-content);
            gap: 8px 32px;
            font-family: var(--font-mono, ui-monospace, monospace);
            font-size: 15px;
        }
        .empty-state {
            color: var(--text-muted);
            font-style: italic;
            padding: 16px 0;
            text-align: start;
        }
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
            // Said in the user's language. The error's own words, the
            // browser's or the line above's, are English, and for the console.
            console.error('Failed to read the security key settings', e);
            this.error = this.i18nStore?.t('webauthn.errors.load_failed') ?? 'webauthn.errors.load_failed';
        } finally {
            this.loading = false;
        }
    }



    /**
     * The box shows what the server holds, never what was clicked: it is put
     * back at once, and changes only once the server has agreed and the
     * settings are read again. Turning trust on waives this account's second
     * factor for its linked accounts, so it takes the password, asked for
     * first; turning it off takes nothing.
     */
    async handleTrustToggle(e: Event) {
        const target = e.target as HTMLInputElement;
        const wanted = target.checked;
        target.checked = !!this.data?.trustLinkedAccounts;
        if (this.trustBusy) return;
        if (wanted) {
            this.showTrustPrompt = true;
            return;
        }
        await this.sendTrust({ trust: false });
    }

    private async _handleTrustPromptSubmit(e: CustomEvent) {
        const password = typeof e.detail?.password === 'string' ? e.detail.password : '';
        this.showTrustPrompt = false;
        if (!password) {
            this.showTrustError('webauthn.errors.password_required');
            return;
        }
        await this.sendTrust({ trust: true, current_password: password });
    }

    private async sendTrust(body: { trust: boolean; current_password?: string }) {
        this.trustBusy = true;
        this.error = '';
        try {
            const res = await fetchWithTimeout('/settings/2fa/trust-linked-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            // An ended session is handled by fetchWithTimeout, which sends the
            // user to the login screen with a notice saying why.
            if (res.status === 401) return;
            if (!res.ok) {
                const code = await res.json().then((b) => b?.error, () => undefined);
                this.showTrustError(this.trustRefusal(res.status, code));
            }
        } catch {
            this.showTrustError('webauthn.errors.trust_failed');
        } finally {
            this.trustBusy = false;
        }
        await this.fetchData();
    }

    /** The message for a refused change of trust, by the server's stable code. */
    private trustRefusal(status: number, code: unknown): string {
        switch (code) {
            case 'keys_unavailable': return 'webauthn.errors.load_failed';
            case 'wrong_password': return 'webauthn.errors.wrong_password';
            case 'password_required': return 'webauthn.errors.password_required';
            case 'two_factor_required': return 'webauthn.errors.two_factor_required';
            case 'no_security_key': return 'webauthn.errors.no_security_key';
        }
        if (status === 429) return 'webauthn.errors.rate_limited';
        return 'webauthn.errors.trust_failed';
    }

    private showTrustError(key: string) {
        this.error = this.i18nStore?.t(key) ?? key;
    }

    async addCredential() {
        this.adding = true;
        this.error = '';
        try {
            const res = await fetch('/settings/2fa/begin', { method: 'POST' });
            if (res.status === 503) {
                this.error = this.i18nStore?.t('webauthn.errors.load_failed') ?? 'webauthn.errors.load_failed';
                this.adding = false;
                return;
            }
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
                this.error = this.i18nStore?.t('webauthn.errors.register_failed') || 'There was an error registering your security key. Please try again.';
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
            if (finishRes.status === 503) {
                this.error = this.i18nStore?.t('webauthn.errors.load_failed') ?? 'webauthn.errors.load_failed';
                return;
            }
            if (!finishRes.ok) throw new Error(await finishRes.text());
            // The first key comes with the recovery codes, in this answer alone.
            const finished = await finishRes.json().catch(() => ({}));
            if (Array.isArray(finished?.recovery_codes) && finished.recovery_codes.length) this.shownCodes = finished.recovery_codes;

            this.fetchData();
        } catch (err: any) {
            this.error = this.i18nStore?.t('webauthn.errors.register_failed') || 'There was an error registering your security key. Please try again.';
        } finally {
            this.adding = false;
            this.pendingCredential = null;
        }
    }

    private _handlePromptCancel() {
        this.showNamePrompt = false;
        this.pendingCredential = null;
    }

    removeCredential(id: string) {
        this.error = '';
        this.removeErrors = {};
        this.pendingDeleteId = id;
    }

    private t(key: string): string {
        return this.i18nStore?.t(key) ?? key;
    }

    /**
     * Removing a key takes the account's password, which the server checks: a
     * browser left signed in must not be enough to strip the second factor.
     * A refusal stays in the prompt, under the field, so the password can be
     * typed again; only success closes it.
     */
    async executeRemoveCredential(e: CustomEvent) {
        const id = this.pendingDeleteId;
        if (!id || this.removeBusy) return;
        const password = typeof e.detail?.password === 'string' ? e.detail.password : '';
        // The prompt's own check catches this first. Kept so that an empty
        // password is never sent, whatever route the submit took.
        if (!password) {
            this.removeErrors = { password: this.t('webauthn.errors.password_required') };
            return;
        }
        this.removeBusy = true;
        try {
            const res = await fetchWithTimeout(`/settings/2fa/credential/${encodeURIComponent(id)}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_password: password }),
            });
            // A key already gone, removed from another tab, is what was asked.
            if (res.ok || res.status === 404) {
                this.pendingDeleteId = null;
                this.fetchData();
                return;
            }
            // An ended session is handled by fetchWithTimeout, which sends the
            // user to the login screen with a notice saying why.
            if (res.status === 401) {
                this.pendingDeleteId = null;
                return;
            }
            const code = await res.json().then((body) => body?.error, () => undefined);
            this.removeErrors = { password: this.removeRefusal(res.status, code) };
        } catch {
            // The server was not reached, so nothing was decided.
            this.removeErrors = { password: this.t('webauthn.errors.remove_unavailable') };
        } finally {
            this.removeBusy = false;
        }
    }

    /** The words for a refused removal, by the server's stable code. */
    private removeRefusal(status: number, code: unknown): string {
        if (code === 'wrong_password') return this.t('webauthn.errors.wrong_password');
        if (code === 'password_required') return this.t('webauthn.errors.password_required');
        // A session that has not given the second factor: no password helps,
        // so it is not told to type one again.
        if (code === 'two_factor_required') return this.t('webauthn.errors.two_factor_required');
        if (status === 429) return this.t('webauthn.errors.rate_limited');
        // Not "wrong password": the password may well be right, and saying
        // otherwise sends the user to retype one that works.
        if (status >= 500) return this.t('webauthn.errors.remove_unavailable');
        return this.t('webauthn.errors.remove_failed');
    }

    private askForNewCodes() {
        this.error = '';
        this.codesErrors = {};
        this.showCodesPrompt = true;
    }

    /**
     * New codes replace the old ones, so they take the account's password, as
     * removing a key does. A refusal stays in the prompt; success shows them.
     */
    private async createCodes(e: CustomEvent) {
        if (this.codesBusy) return;
        const password = typeof e.detail?.password === 'string' ? e.detail.password : '';
        if (!password) {
            this.codesErrors = { password: this.t('webauthn.errors.password_required') };
            return;
        }
        this.codesBusy = true;
        try {
            const res = await fetchWithTimeout('/settings/2fa/recovery-codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_password: password }),
            });
            // An ended session is handled by fetchWithTimeout, which sends the
            // user to the login screen with a notice saying why.
            if (res.status === 401) {
                this.showCodesPrompt = false;
                return;
            }
            const body = await res.json().catch(() => ({}));
            if (res.ok && Array.isArray(body?.recovery_codes)) {
                this.showCodesPrompt = false;
                this.shownCodes = body.recovery_codes;
                this.fetchData();
                return;
            }
            this.codesErrors = { password: this.codesRefusal(res.status, body?.error) };
        } catch {
            this.codesErrors = { password: this.t('webauthn.recovery.create_failed') };
        } finally {
            this.codesBusy = false;
        }
    }

    /** The words for refused new codes, by the server's stable code. */
    private codesRefusal(status: number, code: unknown): string {
        switch (code) {
            case 'wrong_password': return this.t('webauthn.errors.wrong_password');
            case 'password_required': return this.t('webauthn.errors.password_required');
            case 'two_factor_required': return this.t('webauthn.errors.two_factor_required');
            case 'no_security_key': return this.t('webauthn.errors.no_security_key');
        }
        if (code === 'recovery_unavailable') return this.t('webauthn.recovery.unavailable');
        if (status === 429) return this.t('webauthn.errors.rate_limited');
        return this.t('webauthn.recovery.create_failed');
    }

    private async copyCodes() {
        try {
            await navigator.clipboard.writeText((this.shownCodes ?? []).join('\n'));
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.t('originalMessage.copied'), timeout: 3000 } }));
        } catch {
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.t('originalMessage.copyFailed'), type: 'error', timeout: 3000 } }));
        }
    }

    private downloadCodes() {
        const blob = new Blob([(this.shownCodes ?? []).join('\n') + '\n'], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'recovery-codes.txt';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    /**
     * The codes, shown once. Only Done closes the dialog, not Escape or a
     * click beside it, which would lose them by accident.
     */
    private renderCodes() {
        return html`
            <ui-modal heading=${this.t('webauthn.recovery.codes_title')} .bodyDescribes=${true}>
                <div>${this.t('webauthn.recovery.codes_intro')}</div>
                <ol class="codes" dir="ltr">
                    ${this.shownCodes!.map((code) => html`<li>${code}</li>`)}
                </ol>
                <div slot="actions">
                    <alps-button variant="text" @click=${this.copyCodes}>${this.t('originalMessage.copyClipboard')}</alps-button>
                    <alps-button variant="text" @click=${this.downloadCodes}>${this.t('attachment.download')}</alps-button>
                    <alps-button variant="normal" @click=${() => this.shownCodes = null}>${this.t('webauthn.recovery.done')}</alps-button>
                </div>
            </ui-modal>
        `;
    }

    render() {
        if (this.loading) return html`<div>${this.i18nStore?.t('settings.loading')}</div>`;

        return html`
            ${this.showNamePrompt ? html`
                <!-- Said here, where the key is kept or dropped: Cancel
                     saves nothing. -->
                <ui-prompt
                    heading=${this.i18nStore?.t('webauthn.name_key_title')}
                    .message=${this.i18nStore?.t('webauthn.name_key_notice') ?? ''}
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

            ${this.showTrustPrompt ? html`
                <ui-prompt
                    heading=${this.i18nStore?.t('webauthn.trust_linked_checkbox')}
                    confirmText=${this.i18nStore?.t('general.save')}
                    cancelText=${this.i18nStore?.t('general.cancel')}
                    .fields=${[
                    {
                        id: 'password',
                        type: 'password',
                        label: this.i18nStore?.t('webauthn.trust_password_label'),
                        autofocus: true
                    }
                ]}
                    @submit=${this._handleTrustPromptSubmit}
                    @cancel=${() => this.showTrustPrompt = false}
                ></ui-prompt>
            ` : ''}

            ${this.error ? html`
                <ui-modal 
                    heading="${this.i18nStore?.t('general.error') || 'Error'}" 
                    .isDanger=${true} 
                    .dismissible=${true}
                    @cancel=${() => this.error = ''}>
                    <div>${this.error}</div>
                    <div slot="actions">
                        <!-- Close: an error has nothing to cancel. -->
                        <alps-button variant="normal" @click=${() => this.error = ''}>
                            ${this.i18nStore?.t('attachment.close') || 'Close'}
                        </alps-button>
                    </div>
                </ui-modal>
            ` : ''}

            ${this.pendingDeleteId ? html`
                <ui-prompt
                    heading="${this.t('webauthn.confirm_remove')}"
                    confirmText="${this.t('webauthn.settings.remove_btn')}"
                    cancelText="${this.t('general.cancel')}"
                    .isDanger=${true}
                    .busy=${this.removeBusy}
                    .errors=${this.removeErrors}
                    .fields=${[
                    {
                        id: 'password',
                        type: 'password',
                        label: this.t('webauthn.remove_password_label'),
                        autocomplete: 'current-password',
                        autofocus: true,
                        validate: (value: string) => (value ? null : this.t('webauthn.errors.password_required')),
                    }
                ]}
                    @submit=${this.executeRemoveCredential}
                    @cancel=${() => { if (!this.removeBusy) this.pendingDeleteId = null; }}
                ></ui-prompt>
            ` : ''}

            ${this.shownCodes ? this.renderCodes() : ''}

            ${this.showCodesPrompt ? html`
                <ui-prompt
                    heading="${this.t('webauthn.recovery.create')}"
                    .message=${this.t('webauthn.recovery.create_notice')}
                    confirmText="${this.t('webauthn.recovery.create')}"
                    cancelText="${this.t('general.cancel')}"
                    .busy=${this.codesBusy}
                    .errors=${this.codesErrors}
                    .fields=${[
                    {
                        id: 'password',
                        type: 'password',
                        label: this.t('webauthn.recovery.password_label'),
                        autocomplete: 'current-password',
                        autofocus: true,
                        validate: (value: string) => (value ? null : this.t('webauthn.errors.password_required')),
                    }
                ]}
                    @submit=${this.createCodes}
                    @cancel=${() => { if (!this.codesBusy) this.showCodesPrompt = false; }}
                ></ui-prompt>
            ` : ''}

            <alps-setting-group 
                label="${this.i18nStore?.t('webauthn.settings.keys_title')}" 
                description="${this.i18nStore?.t('webauthn.settings.group_desc')}">

                <div class="cred-list" style="margin-top: 0;">
                    ${this.data?.credentialCount && this.data.credentialCount > 0 ? html`
                        ${this.data?.credentials.map(c => html`
                            <div class="setting-row">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="icon-container">${renderIcon('fingerprint')}</div>
                                    <strong>${c.Name || this.i18nStore?.t('webauthn.settings.unnamed_key')}</strong>
                                </div>
                                <div style="display: flex; align-items: center; gap: 16px;">
                                    <div style="font-size: 13px; color: var(--text-muted);">${this.i18nStore?.t('webauthn.settings.added')} ${new Date(c.AddedAt).toLocaleString()}</div>
                                    <alps-icon-btn icon="trash" @click=${() => this.removeCredential(c.ID)} title=${this.i18nStore?.t('webauthn.settings.remove_btn') || 'Remove'}></alps-icon-btn>
                                </div>
                            </div>
                        `)}
                    ` : html`<div class="empty-state">${this.i18nStore?.t('webauthn.settings.noKeys')}</div>`}
                    <alps-button variant="normal" style="margin-top: 12px;" @click=${this.addCredential} ?disabled=${this.adding} ?spinning=${this.adding}>
                        ${this.i18nStore?.t('webauthn.add_key')}
                    </alps-button>
                </div>
            </alps-setting-group>

            ${(this.data?.credentialCount ?? 0) > 0 ? html`
                <alps-setting-group label="${this.t('webauthn.recovery.title')}" description="${this.t('webauthn.recovery.desc')}">
                    ${this.data?.recoveryCodesAvailable === false ? html`<p>${this.t('webauthn.recovery.unavailable')}</p>` : html`
                    <div class="setting-row">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="icon-container">${renderIcon('key')}</div>
                            <span>${(this.data?.recoveryCodesLeft ?? 0) > 0
                                ? this.i18nStore?.t('webauthn.recovery.left', { count: this.data!.recoveryCodesLeft })
                                : this.t('webauthn.recovery.none')}</span>
                        </div>
                    </div>
                    <alps-button variant="normal" style="margin-top: 4px;" @click=${this.askForNewCodes}>
                        ${this.t('webauthn.recovery.create')}
                    </alps-button>
                    `}
                </alps-setting-group>
            ` : ''}

            ${(this.data?.credentialCount ?? 0) > 0 ? html`
                <alps-setting-group label="${this.i18nStore?.t('webauthn.trust_linked')}" description="${this.i18nStore?.t('webauthn.trust_linked_desc')}">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
                        <input type="checkbox" .checked=${live(!!this.data?.trustLinkedAccounts)} ?disabled=${this.trustBusy} @change=${this.handleTrustToggle}>
                        ${this.i18nStore?.t('webauthn.trust_linked_checkbox')}
                    </label>
                </alps-setting-group>
            ` : ''}
        `;
    }
}


