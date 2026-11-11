import{_ as e,d as t,f as n,g as r,l as i,x as a,y as o}from"./lit-BYBpccnv.js";import{St as s,Tt as c,ut as l,yt as u}from"./index-j-PMb7Oz.js";var d=class extends Error{constructor(e){super(e),this.code=e}},f=class extends r{constructor(...e){super(...e),this.service=`caldav`,this.saved=null,this.server=``,this.useMailCredentials=!0,this.username=``,this.password=``,this.showPassword=!1,this.loading=!0,this.submitting=!1,this.error=``,this.status=``,this.generation=0,this.account=``,this.controller=null,this.mailCredentialsChosenForServer=!1,this.onLanguageChanged=()=>this.requestUpdate(),this.onAccountChanged=()=>{let e=this.currentAccount();e!==this.account&&(this.account=e,this.load())},this.onSessionCleared=()=>{this.invalidate(),this.account=``,this.clear()},this.onLogin=e=>{this.account=e.detail?.username??this.currentAccount(),this.load()},this.onInput=e=>{let t=e.target;t.name===`server`&&(this.server=t.value,this.server.trim()&&this.server.trim()!==this.saved?.server&&!this.mailCredentialsChosenForServer&&(this.useMailCredentials=!1)),t.name===`username`&&(this.username=t.value),t.name===`password`&&(this.password=t.value),this.error=this.status=``},this.onCredentialsChanged=e=>{this.useMailCredentials=e.target.checked,this.mailCredentialsChosenForServer=this.useMailCredentials,this.password=``,this.showPassword=!1,this.error=this.status=``},this.save=async e=>{if(e.preventDefault(),this.submitting||!this.saved||!e.currentTarget.reportValidity())return;if(!this.useMailCredentials&&!this.saved.can_save){this.error=`settings.dav.keyRequired`;return}let t={server:this.server.trim(),use_mail_credentials:this.useMailCredentials,username:this.useMailCredentials?``:this.username.trim(),...!this.useMailCredentials&&this.password?{password:this.password}:{}};await this.mutate(`PUT`,t)},this.reset=async()=>{this.submitting||this.loading||await this.mutate(`DELETE`)}}static{this.styles=a`
    :host { display: block; max-width: 600px; color: var(--text-primary); }
    h3 { margin-block: 0 0.5rem; font-size: 1rem; font-weight: 500; }
    p { margin-block: 0 1rem; }
    .description, .hint { color: var(--text-muted); font-size: 0.8125rem; line-height: 1.5; }
    form, fieldset { display: flex; flex-direction: column; gap: 1rem; }
    fieldset { min-inline-size: 0; border: 0; padding: 0; margin: 0; }
    legend { padding: 0; margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 500; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; }
    label { font-size: 0.875rem; }
    input:not([type='checkbox']) {
      box-sizing: border-box; inline-size: 100%; min-block-size: 48px;
      padding: 0.5rem 0.75rem; border: 1px solid var(--border-color);
      border-radius: var(--input-radius, 6px); background: var(--bg-primary);
      color: var(--text-primary); font: inherit; font-size: max(1rem, 1em);
    }
    input:focus-visible, button:focus-visible {
      outline: 2px solid var(--accent-color, #2563eb); outline-offset: 2px;
    }
    .check { display: flex; gap: 0.5rem; align-items: center; min-block-size: 48px; }
    input[type='checkbox'] { inline-size: 1rem; block-size: 1rem; accent-color: var(--accent-color, #2563eb); }
    .check label { display: flex; align-items: center; min-block-size: 48px; cursor: pointer; }
    .password-field { display: flex; align-items: center; gap: 0.5rem; }
    .password-field input { min-inline-size: 0; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    button {
      min-block-size: 48px; padding: 0.5rem 1rem; border: 1px solid var(--border-color);
      border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary);
      font: inherit; font-size: 0.875rem; cursor: pointer;
    }
    button[type='submit'] { background: var(--accent-color, #2563eb); border-color: transparent; color: white; }
    button:disabled { opacity: 0.6; cursor: default; }
    .error { color: var(--danger-color, #dc2626); font-size: 0.875rem; }
    .status { font-size: 0.875rem; }
    bdi { overflow-wrap: anywhere; }
  `}connectedCallback(){super.connectedCallback(),this.settingsStore?.addEventListener(`change`,this.onAccountChanged),this.i18nStore?.addEventListener(`change`,this.onLanguageChanged),window.addEventListener(`alps-active-user-changed`,this.onAccountChanged),window.addEventListener(`session-cleared`,this.onSessionCleared),window.addEventListener(`user-logged-in`,this.onLogin),this.account=this.currentAccount(),this.load()}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore?.removeEventListener(`change`,this.onAccountChanged),this.i18nStore?.removeEventListener(`change`,this.onLanguageChanged),window.removeEventListener(`alps-active-user-changed`,this.onAccountChanged),window.removeEventListener(`session-cleared`,this.onSessionCleared),window.removeEventListener(`user-logged-in`,this.onLogin),this.submitting&&this.invalidateDAVPages(),this.invalidate(),this.password=``,this.showPassword=!1;let e=this.shadowRoot?.querySelector(`[name="password"]`);e&&(e.value=``)}t(e,t){return this.i18nStore?.t(e,t)??e}currentAccount(){return this.settingsStore?.getState().loginUsername??s()??``}invalidate(){return this.controller?.abort(),this.controller=null,++this.generation}current(e){return this.isConnected&&e===this.generation}clear(){this.saved=null,this.server=this.username=this.password=this.error=this.status=``,this.useMailCredentials=!0,this.showPassword=!1,this.loading=!0,this.submitting=!1,this.mailCredentialsChosenForServer=!1}apply(e){let t=e.server||e.default_server?e.use_mail_credentials:!1;this.saved={server:e.server,default_server:e.default_server,use_mail_credentials:t,username:e.username,password_configured:e.password_configured,configured:e.configured,can_save:e.can_save},this.server=e.server,this.username=e.username,this.useMailCredentials=t,this.password=``,this.showPassword=!1,this.mailCredentialsChosenForServer=!1}async request(e,t,n){let r=new AbortController;this.controller=r;let i=setTimeout(()=>r.abort(),25e3);try{let i=await fetch(`/settings/dav/${this.service}`,{method:e,signal:r.signal,credentials:`same-origin`,...n?{headers:{"Content-Type":`application/json`},body:JSON.stringify(n)}:{}});if(!this.current(t))return null;if(i.status===401)throw window.dispatchEvent(new CustomEvent(`auth-error`)),new d(`dav_session_ended`);let a=await i.json().catch(()=>null);if(!this.current(t))return null;if(!i.ok)throw new d(a?.error??`dav_unavailable`);if(!a||typeof a.server!=`string`||typeof a.default_server!=`string`||typeof a.username!=`string`||typeof a.use_mail_credentials!=`boolean`||typeof a.password_configured!=`boolean`||typeof a.configured!=`boolean`||typeof a.can_save!=`boolean`)throw new d(`dav_unavailable`);return a}finally{clearTimeout(i),this.controller===r&&(this.controller=null)}}errorKey(e){return`settings.dav.${e instanceof d?{dav_invalid_server:`invalidServer`,dav_credentials_required:`credentialsRequired`,dav_password_required:`passwordRequired`,dav_login_key_required:`keyRequired`,dav_auth_failed:`authFailed`,dav_session_ended:`sessionEnded`}[e.code]??`unavailable`:`unavailable`}`}async load(){let e=this.invalidate();this.clear();try{let t=await this.request(`GET`,e);t&&this.current(e)&&this.apply(t)}catch(t){this.current(e)&&(this.error=this.errorKey(t))}finally{this.current(e)&&(this.loading=!1)}}get hasUnsavedChanges(){return!!this.saved&&(this.server.trim()!==this.saved.server||this.useMailCredentials!==this.saved.use_mail_credentials||!this.useMailCredentials&&(this.username.trim()!==this.saved.username||this.password!==``))}discardUnsavedChanges(){this.submitting&&this.invalidateDAVPages(),this.invalidate(),this.saved&&this.apply(this.saved),this.submitting=!1,this.error=this.status=``}get needsPassword(){return!this.saved?.password_configured||this.server.trim()!==this.saved.server||this.username.trim()!==this.saved.username}invalidateDAVPages(){window.dispatchEvent(new CustomEvent(`dav-connections-updated`,{detail:{service:this.service}}))}async mutate(e,t){let n=this.invalidate();this.submitting=!0,this.error=this.status=``;try{let r=await this.request(e,n,t);if(!r||!this.current(n))return;this.apply(r),this.status=e===`PUT`?`settings.dav.saved`:r.default_server?`settings.dav.resetDone`:`settings.dav.removed`,window.dispatchEvent(new CustomEvent(`dav-connections-updated`,{detail:{service:this.service,configured:r.configured}}))}catch(e){if(!this.current(n))return;e instanceof d&&[`dav_invalid_server`,`dav_credentials_required`,`dav_password_required`,`dav_login_key_required`,`dav_auth_failed`,`dav_session_ended`].includes(e.code)||this.invalidateDAVPages(),this.error=this.errorKey(e),this.updateComplete.then(()=>{this.current(n)&&this.shadowRoot?.querySelector(`[role="alert"]`)?.focus()})}finally{this.current(n)&&(this.submitting=!1)}}render(){let t=`dav-${this.service}`;return o`
      <h3 id="${t}-title">${this.t(`settings.dav.${this.service}`)}</h3>
      <p class="description">${this.t(`settings.dav.description`)}</p>
      ${this.loading?o`<p role="status">${this.t(`settings.loading`)}</p>`:e}
      ${this.error?o`<p class="error" role="alert" tabindex="-1">${this.t(this.error)}</p>`:e}
      ${!this.loading&&!this.saved?o`
        <div class="actions">
          <button type="button" ?disabled=${this.submitting} @click=${this.load}>${this.t(`settings.dav.retry`)}</button>
          <button type="button" ?disabled=${this.submitting} @click=${this.reset}>${this.t(`settings.dav.remove`)}</button>
        </div>
      `:e}
      ${this.saved?o`
        <form action="/settings/dav/${this.service}" method="post" aria-labelledby="${t}-title" @submit=${this.save}>
          <fieldset ?disabled=${this.submitting}>
            <legend>${this.t(`settings.dav.connection`)}</legend>
            <div class="field">
              <label for="${t}-server">${this.t(`settings.dav.server`)}</label>
              <input id="${t}-server" name="server" type="url" .value=${this.server}
                placeholder="https://dav.example.com/" ?required=${!this.saved.default_server}
                maxlength="2048" autocomplete="url" autocorrect="off" autocapitalize="none" spellcheck="false"
                aria-describedby="${t}-server-hint" @input=${this.onInput}>
              <span class="hint" id="${t}-server-hint">${this.saved.default_server?o`${this.t(`settings.dav.defaultServer`)} <bdi dir="ltr">${this.saved.default_server}</bdi>`:this.t(`settings.dav.serverRequired`)}</span>
            </div>
            <div class="check">
              <input id="${t}-mail" name="use_mail_credentials" type="checkbox"
                .checked=${this.useMailCredentials} @change=${this.onCredentialsChanged}>
              <label for="${t}-mail">${this.t(`settings.dav.useMailCredentials`)}</label>
            </div>
            ${this.saved.can_save?e:o`<p class="hint">${this.t(`settings.dav.keyRequired`)}</p>`}
            ${this.useMailCredentials?e:o`
              <div class="field">
                <label for="${t}-username">${this.t(`settings.dav.username`)}</label>
                <input id="${t}-username" name="username" type="text" .value=${this.username}
                  required maxlength="1024" autocomplete="section-${this.service} username"
                  autocorrect="off" autocapitalize="none" spellcheck="false" @input=${this.onInput}>
              </div>
              <div class="field">
                <label for="${t}-password">${this.t(`settings.dav.password`)}</label>
                <div class="password-field">
                  <input id="${t}-password" name="password" type=${this.showPassword?`text`:`password`}
                    .value=${this.password} ?required=${this.needsPassword} maxlength="4096"
                    autocomplete="section-${this.service} current-password" aria-describedby="${t}-password-hint"
                    @input=${this.onInput}>
                  <button type="button" aria-pressed=${this.showPassword}
                    aria-controls="${t}-password" @click=${()=>{this.showPassword=!this.showPassword}}>
                    ${this.t(this.showPassword?`general.hidePassword`:`general.showPassword`)}
                  </button>
                </div>
                <span class="hint" id="${t}-password-hint">${this.t(this.needsPassword?`settings.dav.enterPassword`:`settings.dav.passwordConfigured`)}</span>
              </div>
            `}
            <div class="actions">
              <button type="submit">${this.t(this.submitting?`settings.dav.saving`:`settings.dav.save`)}</button>
              <button type="button" @click=${this.reset}>${this.t(this.saved.default_server?`settings.dav.reset`:`settings.dav.remove`)}</button>
            </div>
          </fieldset>
        </form>
      `:e}
      <p class="status" role="status">${this.status?this.t(this.status):``}</p>
    `}};l([n({context:u})],f.prototype,`i18nStore`,void 0),l([n({context:c,subscribe:!0})],f.prototype,`settingsStore`,void 0),l([i()],f.prototype,`saved`,void 0),l([i()],f.prototype,`server`,void 0),l([i()],f.prototype,`useMailCredentials`,void 0),l([i()],f.prototype,`username`,void 0),l([i()],f.prototype,`password`,void 0),l([i()],f.prototype,`showPassword`,void 0),l([i()],f.prototype,`loading`,void 0),l([i()],f.prototype,`submitting`,void 0),l([i()],f.prototype,`error`,void 0),l([i()],f.prototype,`status`,void 0);var p=class extends f{constructor(...e){super(...e),this.service=`caldav`}};p=l([t(`alps-caldav-settings`)],p);var m=class extends f{constructor(...e){super(...e),this.service=`carddav`}};m=l([t(`alps-carddav-settings`)],m);export{p as CalDAVSettings,m as CardDAVSettings,f as DavConnectionSettings};