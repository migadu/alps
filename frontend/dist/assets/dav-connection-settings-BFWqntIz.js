import{_ as e,d as t,f as n,g as r,l as i,x as a,y as o}from"./lit-BYBpccnv.js";import{St as s,Tt as c,ut as l,yt as u}from"./index-D9SgAg-o.js";var d=class extends Error{constructor(e){super(e),this.code=e}},f=class extends r{constructor(...e){super(...e),this.service=`caldav`,this.saved=null,this.server=``,this.useMailCredentials=!0,this.username=``,this.password=``,this.loading=!0,this.submitting=!1,this.error=``,this.removal=null,this.unreadablePersonal=!1,this.generation=0,this.account=``,this.controller=null,this.mailCredentialsChosenForServer=!1,this.onLanguageChanged=()=>this.requestUpdate(),this.onAccountChanged=()=>{let e=this.currentAccount();e!==this.account&&(this.account=e,this.load())},this.onSessionCleared=()=>{this.invalidate(),this.account=``,this.clear()},this.onLogin=e=>{this.account=e.detail?.username??this.currentAccount(),this.load()},this.onInput=e=>{let t=e.target;t.name===`server`&&(this.server=t.value,this.server.trim()&&this.server.trim()!==this.saved?.server&&!this.mailCredentialsChosenForServer&&(this.useMailCredentials=!1)),t.name===`username`&&(this.username=t.value),t.name===`password`&&(this.password=t.value),this.error=``},this.onCredentialsChanged=e=>{this.useMailCredentials=e.target.checked,this.mailCredentialsChosenForServer=this.useMailCredentials,this.password=``,this.error=``},this.save=async e=>{if(e.preventDefault(),this.submitting||!this.saved)return;let t=e.currentTarget;if(!t.reportValidity())return;for(let e of t.querySelectorAll(`alps-input`))if(!e.reportValidity()){e.focus();return}if(!this.useMailCredentials&&!this.saved.can_save){this.error=`settings.dav.keyRequired`;return}let n={server:this.server.trim(),use_mail_credentials:this.useMailCredentials,username:this.useMailCredentials?``:this.username.trim(),...!this.useMailCredentials&&this.password?{password:this.password}:{}};await this.mutate(`PUT`,n)},this.askRemove=()=>{this.submitting||this.loading||!this.hasPersonalConnection||this.removal||(this.removal={generation:this.generation,account:this.account})},this.confirmRemove=async e=>{this.removal!==e||!this.current(e.generation)||e.account!==this.account||e.account!==this.currentAccount()||!this.hasPersonalConnection||this.submitting||(this.removal=null,await this.mutate(`DELETE`))}}static{this.styles=a`
    :host { display: block; }
    .hint { color: var(--text-muted); font-size: 13px; line-height: 1.4; }
    .checkbox-label {
      display: flex; align-items: center; gap: 8px; cursor: pointer;
      color: var(--text-primary); font-weight: 500;
    }
    input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .error { color: var(--danger-color, #dc2626); font-size: 13px; margin-block: 0 16px; }
    bdi { overflow-wrap: anywhere; }
  `}connectedCallback(){super.connectedCallback(),this.settingsStore?.addEventListener(`change`,this.onAccountChanged),this.i18nStore?.addEventListener(`change`,this.onLanguageChanged),window.addEventListener(`alps-active-user-changed`,this.onAccountChanged),window.addEventListener(`session-cleared`,this.onSessionCleared),window.addEventListener(`user-logged-in`,this.onLogin),this.account=this.currentAccount(),this.load()}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore?.removeEventListener(`change`,this.onAccountChanged),this.i18nStore?.removeEventListener(`change`,this.onLanguageChanged),window.removeEventListener(`alps-active-user-changed`,this.onAccountChanged),window.removeEventListener(`session-cleared`,this.onSessionCleared),window.removeEventListener(`user-logged-in`,this.onLogin),this.submitting&&this.invalidateDAVPages(),this.invalidate(),this.password=``;let e=this.shadowRoot?.querySelector(`alps-input[name="password"]`);if(e){e.value=``;let t=e.shadowRoot?.querySelector(`input`);t&&(t.value=``)}}t(e,t){return this.i18nStore?.t(e,t)??e}currentAccount(){return this.settingsStore?.getState().loginUsername??s()??``}invalidate(){return this.controller?.abort(),this.controller=null,this.removal=null,++this.generation}current(e){return this.isConnected&&e===this.generation}clear(){this.saved=null,this.server=this.username=this.password=this.error=``,this.useMailCredentials=!0,this.loading=!0,this.submitting=!1,this.mailCredentialsChosenForServer=!1,this.unreadablePersonal=!1}apply(e){this.unreadablePersonal=!1;let t=e.server||e.default_server?e.use_mail_credentials:!1;this.saved={server:e.server,default_server:e.default_server,use_mail_credentials:t,username:e.username,password_configured:e.password_configured,configured:e.configured,personal_configured:e.personal_configured,can_save:e.can_save},this.server=e.server,this.username=e.username,this.useMailCredentials=t,this.password=``,this.mailCredentialsChosenForServer=!1}async request(e,t,n){let r=new AbortController;this.controller=r;let i=setTimeout(()=>r.abort(),25e3);try{let i=await fetch(`/settings/dav/${this.service}`,{method:e,signal:r.signal,credentials:`same-origin`,...n?{headers:{"Content-Type":`application/json`},body:JSON.stringify(n)}:{}});if(!this.current(t))return null;if(i.status===401)throw window.dispatchEvent(new CustomEvent(`auth-error`)),new d(`dav_session_ended`);let a=await i.json().catch(()=>null);if(!this.current(t))return null;if(!i.ok)throw e===`GET`&&a?.personal_configured===!0&&(this.unreadablePersonal=!0),new d(a?.error??`dav_unavailable`);if(!a||typeof a.server!=`string`||typeof a.default_server!=`string`||typeof a.username!=`string`||typeof a.use_mail_credentials!=`boolean`||typeof a.password_configured!=`boolean`||typeof a.configured!=`boolean`||typeof a.personal_configured!=`boolean`||typeof a.can_save!=`boolean`)throw new d(`dav_unavailable`);return a}finally{clearTimeout(i),this.controller===r&&(this.controller=null)}}errorKey(e){return`settings.dav.${e instanceof d?{dav_invalid_server:`invalidServer`,dav_credentials_required:`credentialsRequired`,dav_password_required:`passwordRequired`,dav_login_key_required:`keyRequired`,dav_auth_failed:`authFailed`,dav_session_ended:`sessionEnded`}[e.code]??`unavailable`:`unavailable`}`}async load(){let e=this.invalidate();this.clear();try{let t=await this.request(`GET`,e);t&&this.current(e)&&this.apply(t)}catch(t){this.current(e)&&(this.error=this.errorKey(t))}finally{this.current(e)&&(this.loading=!1)}}get hasUnsavedChanges(){return!!this.saved&&(this.server.trim()!==this.saved.server||this.useMailCredentials!==this.saved.use_mail_credentials||!this.useMailCredentials&&(this.username.trim()!==this.saved.username||this.password!==``))}discardUnsavedChanges(){this.submitting&&this.invalidateDAVPages(),this.invalidate(),this.saved&&this.apply(this.saved),this.submitting=!1,this.error=``}get needsPassword(){return!this.saved?.password_configured||this.server.trim()!==this.saved.server||this.username.trim()!==this.saved.username}get hasPersonalConnection(){return this.saved?.personal_configured===!0||this.unreadablePersonal}invalidateDAVPages(){window.dispatchEvent(new CustomEvent(`dav-connections-updated`,{detail:{service:this.service}}))}async mutate(e,t){let n=this.invalidate();this.submitting=!0,this.error=``;try{let r=await this.request(e,n,t);if(!r||!this.current(n))return;this.apply(r);let i=e===`PUT`?`settings.dav.saved`:r.default_server?`settings.dav.resetDone`:`settings.dav.removed`;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.t(i)}})),window.dispatchEvent(new CustomEvent(`dav-connections-updated`,{detail:{service:this.service,configured:r.configured}}))}catch(e){if(!this.current(n))return;e instanceof d&&[`dav_invalid_server`,`dav_credentials_required`,`dav_password_required`,`dav_login_key_required`,`dav_auth_failed`,`dav_session_ended`].includes(e.code)||this.invalidateDAVPages(),this.error=this.errorKey(e),this.updateComplete.then(()=>{this.current(n)&&this.shadowRoot?.querySelector(`[role="alert"]`)?.focus()})}finally{this.current(n)&&(this.submitting=!1)}}render(){let t=this.removal;return o`
      ${t?o`
        <ui-confirm
          heading=${this.t(`settings.dav.remove`)}
          message=${this.t(`settings.dav.removeConfirm`)}
          confirmText=${this.t(`settings.dav.remove`)}
          cancelText=${this.t(`general.cancel`)}
          .isDanger=${!0}
          .dismissible=${!0}
          @confirm=${()=>this.confirmRemove(t)}
          @cancel=${()=>{this.removal===t&&(this.removal=null)}}
        ></ui-confirm>
      `:e}
      ${this.loading?o`<p role="status">${this.t(`settings.loading`)}</p>`:e}
      ${this.error?o`<p class="error" role="alert" tabindex="-1">${this.t(this.error)}</p>`:e}
      ${!this.loading&&!this.saved?o`
        <div class="actions">
          <alps-button variant="normal" ?disabled=${this.submitting} @click=${this.load}>${this.t(`settings.dav.retry`)}</alps-button>
          ${this.unreadablePersonal?o`
            <alps-button class="remove" type="button" variant="danger" ?disabled=${this.submitting} @click=${this.askRemove}>
              ${this.t(`settings.dav.remove`)}
            </alps-button>
          `:e}
        </div>
      `:e}
      ${this.saved?o`
        <form action="/settings/dav/${this.service}" method="post"
          aria-label=${this.t(`settings.dav.${this.service}`)} @submit=${this.save}>
          <alps-setting-group label=${this.t(`settings.dav.server`)} description=${this.t(`settings.dav.serverRequired`)}>
            <alps-input name="server" type="url" icon="globe" label=${this.t(`settings.dav.server`)}
              .value=${this.server} ?required=${!this.saved.default_server} ?disabled=${this.submitting}
              maxlength="2048" autocomplete="url" placeholder="https://dav.example.com/" @input=${this.onInput}
            ></alps-input>
            ${this.saved.default_server?o`
              <span class="hint">${this.t(`settings.dav.defaultServer`)} <bdi dir="ltr">${this.saved.default_server}</bdi></span>
            `:e}
          </alps-setting-group>
          <alps-setting-group label=${this.t(`settings.dav.authentication`)}>
            <label class="checkbox-label">
              <input name="use_mail_credentials" type="checkbox" .checked=${this.useMailCredentials}
                ?disabled=${this.submitting} @change=${this.onCredentialsChanged}>
              ${this.t(`settings.dav.useMailCredentials`)}
            </label>
            ${this.saved.can_save?e:o`<span class="hint">${this.t(`settings.dav.keyRequired`)}</span>`}
            ${this.useMailCredentials?e:o`
              <alps-input name="username" type="text" icon="user" label=${this.t(`settings.dav.username`)}
                placeholder=${this.t(`settings.dav.username`)}
                .value=${this.username} required ?disabled=${this.submitting} maxlength="1024"
                autocomplete="section-${this.service} username" @input=${this.onInput}
              ></alps-input>
              <alps-input name="password" type="password" icon="key" label=${this.t(`settings.dav.password`)}
                placeholder=${this.t(`settings.dav.password`)}
                .value=${this.password} ?required=${this.needsPassword} ?disabled=${this.submitting} maxlength="4096"
                autocomplete="section-${this.service} current-password" @input=${this.onInput}
              ></alps-input>
              <span class="hint password-hint">${this.t(this.needsPassword?`settings.dav.enterPassword`:`settings.dav.passwordConfigured`)}</span>
            `}
          </alps-setting-group>
          <div class="actions">
            <alps-button type="submit" variant="primary" ?disabled=${this.submitting} ?spinning=${this.submitting}>
              ${this.t(this.submitting?`settings.dav.saving`:`settings.dav.save`)}
            </alps-button>
            ${this.saved.personal_configured?o`
              <alps-button class="remove" type="button" variant="danger" ?disabled=${this.submitting} @click=${this.askRemove}>
                ${this.t(`settings.dav.remove`)}
              </alps-button>
            `:e}
          </div>
        </form>
      `:e}
    `}};l([n({context:u})],f.prototype,`i18nStore`,void 0),l([n({context:c,subscribe:!0})],f.prototype,`settingsStore`,void 0),l([i()],f.prototype,`saved`,void 0),l([i()],f.prototype,`server`,void 0),l([i()],f.prototype,`useMailCredentials`,void 0),l([i()],f.prototype,`username`,void 0),l([i()],f.prototype,`password`,void 0),l([i()],f.prototype,`loading`,void 0),l([i()],f.prototype,`submitting`,void 0),l([i()],f.prototype,`error`,void 0),l([i()],f.prototype,`removal`,void 0),l([i()],f.prototype,`unreadablePersonal`,void 0);var p=class extends f{constructor(...e){super(...e),this.service=`caldav`}};p=l([t(`alps-caldav-settings`)],p);var m=class extends f{constructor(...e){super(...e),this.service=`carddav`}};m=l([t(`alps-carddav-settings`)],m);export{p as CalDAVSettings,m as CardDAVSettings,f as DavConnectionSettings};