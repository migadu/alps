import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fetchWithTimeout } from '../../../frontend/src/utils/fetch-utils';
import { consume } from '@lit/context';
import { i18nContext, type I18nStore } from '../../../frontend/src/store/i18n-store';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-input';
import '../../../frontend/src/components/alps-loader';
import '../../../frontend/src/components/alps-setting-group';
import '../../../frontend/src/components/ui-prompt';
import '../../../frontend/src/components/ui-confirm';
import '../../../frontend/src/components/ui-modal';

@customElement('alps-gpg-settings')
export class AlpsGpgSettings extends LitElement {
    @consume({ context: i18nContext, subscribe: true })
    i18nStore?: I18nStore;

    @state() private loading = true;
    @state() private generating = false;
    @state() private importing = false;
    @state() private importError = '';
    @state() private keyring: any = null;
    @state() private pubKeyInput = '';
    @state() private privKeyInput = '';

    @state() private viewState: 'default' | 'import' = 'default';
    @state() private showPassphrasePrompt = false;
    @state() private passphrasePromptMode: 'lock' | 'confirm' = 'lock';
    @state() private showPurgeConfirm = false;
    private resolvePassphrase: ((pass: string | null) => void) | null = null;

    static styles = css`
        :host {
            display: block;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }
        label {
            font-size: 14px;
            font-weight: 500;
        }
        textarea {
            width: 100%;
            height: 150px;
            padding: 12px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            box-sizing: border-box;
            background: var(--bg-secondary);
            color: var(--text-color);
        }
        .actions {
            display: flex;
            gap: 12px;
        }
        .key-info {
            font-family: monospace;
            background: var(--bg-secondary);
            padding: 16px;
            border-radius: 4px;
            word-break: break-all;
            white-space: pre-wrap;
            font-size: 12px;
        }
        .empty-state {
            color: var(--text-muted);
            font-style: italic;
            padding: 16px 0;
            text-align: left;
        }
    `;

    async connectedCallback() {
        super.connectedCallback();
        await this.fetchKeys();
    }

    async fetchKeys() {
        this.loading = true;
        try {
            const res = await fetchWithTimeout('/gpg/keys');
            if (res.ok) {
                const data = await res.json();
                if (data.public_key) {
                    this.keyring = data;
                } else {
                    this.keyring = null;
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            this.loading = false;
        }
    }

    private promptForPassphrase(mode: 'lock' | 'confirm' = 'lock'): Promise<string | null> {
        this.passphrasePromptMode = mode;
        this.showPassphrasePrompt = true;
        return new Promise((resolve) => {
            this.resolvePassphrase = resolve;
        });
    }

    private resolveError: (() => void) | null = null;

    private showErrorDialog(msg: string): Promise<void> {
        this.importError = msg;
        return new Promise((resolve) => {
            this.resolveError = resolve;
        });
    }

    private clearError() {
        this.importError = '';
        if (this.resolveError) {
            this.resolveError();
            this.resolveError = null;
        }
    }

    private async getConfirmedPassphrase(): Promise<string | null> {
        while (true) {
            const pass = await this.promptForPassphrase('lock');
            if (!pass) return null;

            const passConfirm = await this.promptForPassphrase('confirm');
            if (!passConfirm) return null;

            if (pass === passConfirm) {
                return pass;
            } else {
                await this.showErrorDialog(this.i18nStore?.t('gpg.passphraseMismatch') as string);
            }
        }
    }

    private handlePassphraseSubmit(pass: string) {
        if (this.resolvePassphrase) {
            this.resolvePassphrase(pass);
            this.resolvePassphrase = null;
        }
        this.showPassphrasePrompt = false;
    }

    private handlePassphraseCancel() {
        if (this.resolvePassphrase) {
            this.resolvePassphrase(null);
            this.resolvePassphrase = null;
        }
        this.showPassphrasePrompt = false;
    }

    async generateKeys() {
        const pass = await this.getConfirmedPassphrase();
        if (!pass) return;

        this.generating = true;
        try {
            // @ts-ignore
            const openpgp = await import('openpgp');
            const { privateKey, publicKey } = await openpgp.generateKey({
                type: 'ecc',
                curve: 'curve25519',
                userIDs: [{ name: 'ALPS User', email: '' }],
                passphrase: pass
            });

            await fetchWithTimeout('/gpg/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    public_key: publicKey,
                    encrypted_private_key: privateKey
                })
            });
            await this.fetchKeys();
        } catch (e: any) {
            alert(this.i18nStore?.t('gpg.generateFailed', { error: e.message }));
        } finally {
            this.generating = false;
        }
    }

    async importKeys() {
        if (!this.pubKeyInput || !this.privKeyInput) {
            this.importError = this.i18nStore?.t('gpg.importMissing') as string;
            return;
        }

        this.importing = true;
        let openpgp: any;
        let privateKeyObj: any;
        
        try {
            // @ts-ignore
            openpgp = await import('openpgp');
            
            // Validate public key
            await openpgp.readKey({ armoredKey: this.pubKeyInput });
            // Validate private key
            privateKeyObj = await openpgp.readPrivateKey({ armoredKey: this.privKeyInput });
        } catch (e: any) {
            this.importing = false;
            this.importError = this.i18nStore?.t('gpg.importFailed', { error: e.message }) as string;
            return;
        }
        
        this.importing = false;

        const pass = await this.getConfirmedPassphrase();
        if (!pass) return;

        this.importing = true;
        try {
            const encryptedPrivateKey = await openpgp.encryptKey({
                privateKey: privateKeyObj,
                passphrase: pass
            });

            await fetchWithTimeout('/gpg/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    public_key: this.pubKeyInput,
                    encrypted_private_key: encryptedPrivateKey
                })
            });
            this.pubKeyInput = '';
            this.privKeyInput = '';
            this.viewState = 'default';
            await this.fetchKeys();
        } catch (e: any) {
            this.importError = this.i18nStore?.t('gpg.importFailed', { error: e.message }) as string;
        } finally {
            this.importing = false;
        }
    }

    async purgeKeys() {
        this.loading = true;
        this.showPurgeConfirm = false;
        await fetchWithTimeout('/gpg/keys', { method: 'DELETE' });
        this.keyring = null;
        sessionStorage.removeItem('gpg_private_key');
        this.loading = false;
    }

    render() {
        if (this.loading || this.generating) {
            return html`<alps-loader full-height .text=${this.generating ? 'Generating keypair...' : 'Loading...'}></alps-loader>`;
        }

        return html`
            ${this.keyring ? html`
                <alps-setting-group label="${this.i18nStore?.t('settings.gpg')}" description="${this.i18nStore?.t('gpg.keyStoredSecurely')}">
                    <div class="key-info">${this.keyring.public_key}</div>

                    <div class="actions">
                        <alps-button variant="danger" @click=${() => this.showPurgeConfirm = true}>${this.i18nStore?.t('gpg.purgeKeys')}</alps-button>
                    </div>
                </alps-setting-group>
            ` : this.viewState === 'import' ? html`
                <alps-setting-group label="${this.i18nStore?.t('gpg.importExistingKeys')}">
                    <alps-setting-group description="${this.i18nStore?.t('gpg.importUnencryptedDesc')}" style="margin-bottom: 24px;"></alps-setting-group>
                    
                    <alps-setting-group label="${this.i18nStore?.t('gpg.publicKeyBlock')}" style="margin-bottom: 24px;">
                        <textarea .value=${this.pubKeyInput} @input=${(e: any) => this.pubKeyInput = e.target.value}></textarea>
                    </alps-setting-group>

                    <alps-setting-group label="${this.i18nStore?.t('gpg.privateKeyBlock')}" style="margin-bottom: 24px;">
                        <textarea .value=${this.privKeyInput} @input=${(e: any) => this.privKeyInput = e.target.value}></textarea>
                    </alps-setting-group>

                    <div class="actions">
                        <alps-button variant="primary" ?disabled=${!this.pubKeyInput || !this.privKeyInput} ?spinning=${this.importing} @click=${this.importKeys}>${this.i18nStore?.t('general.save')}</alps-button>
                        <alps-button variant="normal" @click=${() => this.viewState = 'default'}>${this.i18nStore?.t('general.cancel')}</alps-button>
                    </div>
                </alps-setting-group>
            ` : html`
                <alps-setting-group label="${this.i18nStore?.t('settings.gpg')}" description="${this.i18nStore?.t('gpg.enableEncryptionDesc')}">
                    <div class="empty-state">${this.i18nStore?.t('gpg.noKeyPresent')}</div>
                    <div class="actions">
                        <alps-button variant="primary" @click=${this.generateKeys}>${this.i18nStore?.t('gpg.generateNewKeypair')}</alps-button>
                        <alps-button variant="normal" @click=${() => this.viewState = 'import'}>${this.i18nStore?.t('gpg.importExistingKeys')}</alps-button>
                    </div>
                </alps-setting-group>
            `}

            ${this.showPassphrasePrompt ? html`
                <ui-prompt
                    title="${this.passphrasePromptMode === 'confirm' ? this.i18nStore?.t('gpg.passphraseConfirmTitle') : this.i18nStore?.t('gpg.passphraseSetTitle')}"
                    confirmText="${this.passphrasePromptMode === 'confirm' ? this.i18nStore?.t('gpg.confirm') : this.i18nStore?.t('gpg.lock')}"
                    cancelText="${this.i18nStore?.t('general.cancel')}"
                    .fields=${[
                        {
                            id: 'passphrase',
                            label: this.passphrasePromptMode === 'confirm' 
                                ? this.i18nStore?.t('gpg.passphraseConfirmPrompt') 
                                : this.i18nStore?.t('gpg.passphraseLockPrompt'),
                            type: 'password',
                            placeholder: this.i18nStore?.t('gpg.passphrase'),
                            autofocus: true
                        }
                    ]}
                    @submit=${(e: CustomEvent) => this.handlePassphraseSubmit(e.detail.passphrase)}
                    @cancel=${this.handlePassphraseCancel}
                ></ui-prompt>
            ` : ''}
            ${this.importError ? html`
                <ui-modal title="${this.i18nStore?.t('gpg.importFailedTitle')}" @cancel=${this.clearError}>
                    <div style="padding: 16px; white-space: pre-wrap; font-family: monospace; font-size: 13px;">${this.importError}</div>
                    <alps-button slot="actions" @click=${this.clearError}>OK</alps-button>
                </ui-modal>
            ` : ''}

            ${this.showPurgeConfirm ? html`
                <ui-confirm
                    title="${this.i18nStore?.t('gpg.purgeKeys')}"
                    message="${this.i18nStore?.t('gpg.purgeConfirm')}"
                    confirmText="${this.i18nStore?.t('gpg.purgeKeys')}"
                    cancelText="${this.i18nStore?.t('general.cancel')}"
                    isDanger
                    @confirm=${this.purgeKeys}
                    @cancel=${() => this.showPurgeConfirm = false}
                ></ui-confirm>
            ` : ''}
        `;
    }
}
