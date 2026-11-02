const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/openpgp-CVa1OxL9.js","assets/rolldown-runtime-S-ySWqyJ.js"])))=>i.map(i=>d[i]);
import{b as e,c as t,f as n,h as r,m as i,t as a,v as o}from"./lit-Br1cDwGJ.js";import{W as s,at as c,ut as l,vt as u,yt as d}from"./index-CMdaXNq5.js";var f=class extends r{constructor(...e){super(...e),this.loading=!0,this.generating=!1,this.importing=!1,this.importError=``,this.keyring=null,this.pubKeyInput=``,this.privKeyInput=``,this.viewState=`default`,this.showPassphrasePrompt=!1,this.passphrasePromptMode=`lock`,this.showPurgeConfirm=!1,this.resolvePassphrase=null,this.passphrasePromptId=0,this.resolveError=null}static{this.styles=e`
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
    `}async connectedCallback(){super.connectedCallback(),await this.fetchKeys()}async fetchKeys(){this.loading=!0;try{let e=await l(`/gpg/keys`);if(e.ok){let t=await e.json();t.public_key?this.keyring=t:this.keyring=null}}catch(e){console.error(e)}finally{this.loading=!1}}promptForPassphrase(e=`lock`){return this.passphrasePromptMode=e,this.passphrasePromptId++,this.showPassphrasePrompt=!0,new Promise(e=>{this.resolvePassphrase=e})}showErrorDialog(e){return this.importError=e,new Promise(e=>{this.resolveError=e})}clearError(){this.importError=``,this.resolveError&&=(this.resolveError(),null)}async getConfirmedPassphrase(){for(;;){let e=await this.promptForPassphrase(`lock`);if(!e)return null;let t=await this.promptForPassphrase(`confirm`);if(!t)return null;if(e===t)return e;await this.showErrorDialog(this.i18nStore?.t(`gpg.passphraseMismatch`))}}handlePassphraseSubmit(e){this.resolvePassphrase&&=(this.resolvePassphrase(e),null),this.showPassphrasePrompt=!1}handlePassphraseCancel(){this.resolvePassphrase&&=(this.resolvePassphrase(null),null),this.showPassphrasePrompt=!1}async saveKeyring(e,t){let n=await l(`/gpg/keys`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({public_key:e,encrypted_private_key:t})});if(!n.ok)throw Error(`${n.status} ${n.statusText}`.trim());s()}async generateKeys(){let e=await this.getConfirmedPassphrase();if(e){this.generating=!0;try{let{privateKey:t,publicKey:n}=await(await d(()=>import(`./openpgp-CVa1OxL9.js`).then(e=>e.t),__vite__mapDeps([0,1]))).generateKey({type:`ecc`,curve:`curve25519`,userIDs:[{name:`ALPS User`,email:``}],passphrase:e});await this.saveKeyring(n,t),await this.fetchKeys()}catch(e){alert(this.i18nStore?.t(`gpg.generateFailed`,{error:e.message}))}finally{this.generating=!1}}}async importKeys(){if(!this.pubKeyInput||!this.privKeyInput){this.importError=this.i18nStore?.t(`gpg.importMissing`);return}this.importing=!0;let e,t;try{e=await d(()=>import(`./openpgp-CVa1OxL9.js`).then(e=>e.t),__vite__mapDeps([0,1])),await e.readKey({armoredKey:this.pubKeyInput}),t=await e.readPrivateKey({armoredKey:this.privKeyInput})}catch(e){this.importing=!1,this.importError=this.i18nStore?.t(`gpg.importFailed`,{error:e.message});return}if(this.importing=!1,!t.isDecrypted()){let n=await this.promptForPassphrase(`unlock`);for(;n!==null;)try{t=await e.decryptKey({privateKey:t,passphrase:n});break}catch{await this.showErrorDialog(this.i18nStore?.t(`gpg.importIncorrectPassphrase`)),n=await this.promptForPassphrase(`unlock`)}if(!t.isDecrypted())return}let n=await this.getConfirmedPassphrase();if(n){this.importing=!0;try{let r=await e.encryptKey({privateKey:t,passphrase:n});await this.saveKeyring(this.pubKeyInput,r.armor()),this.pubKeyInput=``,this.privKeyInput=``,this.viewState=`default`,await this.fetchKeys()}catch(e){this.importError=this.i18nStore?.t(`gpg.importFailed`,{error:e.message})}finally{this.importing=!1}}}async purgeKeys(){this.loading=!0,this.showPurgeConfirm=!1;try{let e=await l(`/gpg/keys`,{method:`DELETE`});if(!e.ok)throw Error(`${e.status} ${e.statusText}`.trim());this.keyring=null,s()}catch(e){alert(this.i18nStore?.t(`gpg.purgeFailed`,{error:e.message}))}finally{this.loading=!1}}render(){return this.loading||this.generating?o`<alps-loader full-height .text=${this.i18nStore?.t(this.generating?`gpg.generating`:`settings.loading`)??``}></alps-loader>`:o`
            ${this.keyring?o`
                <alps-setting-group label="${this.i18nStore?.t(`settings.gpg`)}" description="${this.i18nStore?.t(`gpg.keyStoredSecurely`)}">
                    <div class="key-info">${this.keyring.public_key}</div>

                    <div class="actions">
                        <alps-button variant="danger" @click=${()=>this.showPurgeConfirm=!0}>${this.i18nStore?.t(`gpg.purgeKeys`)}</alps-button>
                    </div>
                </alps-setting-group>
            `:this.viewState===`import`?o`
                <alps-setting-group label="${this.i18nStore?.t(`gpg.importExistingKeys`)}">
                    <alps-setting-group description="${this.i18nStore?.t(`gpg.importUnencryptedDesc`)}" style="margin-bottom: 24px;"></alps-setting-group>
                    
                    <alps-setting-group label="${this.i18nStore?.t(`gpg.publicKeyBlock`)}" style="margin-bottom: 24px;">
                        <!-- Each box named by the label above it, which is in
                             alps-setting-group's shadow root and cannot reach it. -->
                        <textarea aria-label=${this.i18nStore?.t(`gpg.publicKeyBlock`)??``} .value=${this.pubKeyInput} @input=${e=>this.pubKeyInput=e.target.value}></textarea>
                    </alps-setting-group>

                    <alps-setting-group label="${this.i18nStore?.t(`gpg.privateKeyBlock`)}" style="margin-bottom: 24px;">
                        <textarea aria-label=${this.i18nStore?.t(`gpg.privateKeyBlock`)??``} .value=${this.privKeyInput} @input=${e=>this.privKeyInput=e.target.value}></textarea>
                    </alps-setting-group>

                    <div class="actions">
                        <alps-button variant="primary" ?disabled=${!this.pubKeyInput||!this.privKeyInput} ?spinning=${this.importing} @click=${this.importKeys}>${this.i18nStore?.t(`general.save`)}</alps-button>
                        <alps-button variant="normal" @click=${()=>this.viewState=`default`}>${this.i18nStore?.t(`general.cancel`)}</alps-button>
                    </div>
                </alps-setting-group>
            `:o`
                <alps-setting-group label="${this.i18nStore?.t(`settings.gpg`)}" description="${this.i18nStore?.t(`gpg.enableEncryptionDesc`)}">
                    <div class="empty-state">${this.i18nStore?.t(`gpg.noKeyPresent`)}</div>
                    <div class="actions">
                        <alps-button variant="primary" @click=${this.generateKeys}>${this.i18nStore?.t(`gpg.generateNewKeypair`)}</alps-button>
                        <alps-button variant="normal" @click=${()=>this.viewState=`import`}>${this.i18nStore?.t(`gpg.importExistingKeys`)}</alps-button>
                    </div>
                </alps-setting-group>
            `}

            ${this.showPassphrasePrompt?a(this.passphrasePromptId,o`
                <ui-prompt
                    heading="${this.passphrasePromptMode===`unlock`?this.i18nStore?.t(`gpg.passphraseRequired`):this.passphrasePromptMode===`confirm`?this.i18nStore?.t(`gpg.passphraseConfirmTitle`):this.i18nStore?.t(`gpg.passphraseSetTitle`)}"
                    confirmText="${this.passphrasePromptMode===`unlock`?this.i18nStore?.t(`gpg.unlock`):this.passphrasePromptMode===`confirm`?this.i18nStore?.t(`gpg.confirm`):this.i18nStore?.t(`gpg.lock`)}"
                    cancelText="${this.i18nStore?.t(`general.cancel`)}"
                    .fields=${[{id:`passphrase`,label:this.passphrasePromptMode===`unlock`?this.i18nStore?.t(`gpg.passphrasePrompt`):this.passphrasePromptMode===`confirm`?this.i18nStore?.t(`gpg.passphraseConfirmPrompt`):this.i18nStore?.t(`gpg.passphraseLockPrompt`),type:`password`,placeholder:this.i18nStore?.t(`gpg.passphrase`),autofocus:!0}]}
                    @submit=${e=>this.handlePassphraseSubmit(e.detail.passphrase)}
                    @cancel=${this.handlePassphraseCancel}
                ></ui-prompt>
            `):``}
            ${this.importError?o`
                <ui-modal heading="${this.i18nStore?.t(`gpg.importFailedTitle`)}" @cancel=${this.clearError}>
                    <div style="padding: 16px; white-space: pre-wrap; font-family: monospace; font-size: 13px;">${this.importError}</div>
                    <alps-button slot="actions" @click=${this.clearError}>${this.i18nStore?.t(`attachment.close`)}</alps-button>
                </ui-modal>
            `:``}

            ${this.showPurgeConfirm?o`
                <ui-confirm
                    heading="${this.i18nStore?.t(`gpg.purgeKeys`)}"
                    message="${this.i18nStore?.t(`gpg.purgeConfirm`)}"
                    confirmText="${this.i18nStore?.t(`gpg.purgeKeys`)}"
                    cancelText="${this.i18nStore?.t(`general.cancel`)}"
                    isDanger
                    @confirm=${this.purgeKeys}
                    @cancel=${()=>this.showPurgeConfirm=!1}
                ></ui-confirm>
            `:``}
        `}};c([t({context:u,subscribe:!0})],f.prototype,`i18nStore`,void 0),c([n()],f.prototype,`loading`,void 0),c([n()],f.prototype,`generating`,void 0),c([n()],f.prototype,`importing`,void 0),c([n()],f.prototype,`importError`,void 0),c([n()],f.prototype,`keyring`,void 0),c([n()],f.prototype,`pubKeyInput`,void 0),c([n()],f.prototype,`privKeyInput`,void 0),c([n()],f.prototype,`viewState`,void 0),c([n()],f.prototype,`showPassphrasePrompt`,void 0),c([n()],f.prototype,`passphrasePromptMode`,void 0),c([n()],f.prototype,`showPurgeConfirm`,void 0),c([n()],f.prototype,`passphrasePromptId`,void 0),f=c([i(`alps-gpg-settings`)],f);export{f as AlpsGpgSettings};