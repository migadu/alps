import{_ as e,d as t,f as n,g as r,l as i,u as a,x as o,y as s}from"./lit-Drqu7DG3.js";import{a as c,n as l,t as u,x as d}from"./alps-button-1B4BsSBF.js";function f(e){let t=e.getRootNode(),n=t=>{let n=t.target;if(!(n instanceof Element)||e.contains(n))return;let r=n.closest(`label`);if(!r)return;let i=n.closest(`button, a[href], input, select, textarea`);i&&r.contains(i)||(r.htmlFor?r.htmlFor===e.id:r.contains(e))&&e.focus()};return t.addEventListener(`click`,n,!0),()=>t.removeEventListener(`click`,n,!0)}var p=new Set([``,`text`,`search`,`url`,`email`,`password`,`tel`,`number`]);function m(e){if(!e)return!1;if(e.isContentEditable)return!0;let t=e.tagName;if(t===`TEXTAREA`||t===`SELECT`)return!0;if(t===`INPUT`)return p.has((e.type||``).toLowerCase());let n=e.getAttribute(`role`);return n===`textbox`||n===`searchbox`}function h(e){return e?e.tagName===`TEXTAREA`||e.isContentEditable:!1}function g(e){return e.isComposing||e.keyCode===229}function _(){let e=document.activeElement;for(;e?.shadowRoot?.activeElement;)e=e.shadowRoot.activeElement;return e}var v=new Set([`password`,`email`,`url`,`number`,`tel`,`date`,`datetime-local`,`time`,`month`,`week`]),y=class extends r{constructor(...e){super(...e),this._handleI18nChange=()=>this.requestUpdate(),this.type=`text`,this.inputDir=``,this.value=``,this.name=``,this.placeholder=``,this.required=!1,this.disabled=!1,this.maxLength=-1,this.autocomplete=``,this.inputId=``,this.label=``,this.icon=``,this.clearable=!1,this.autofocus=!1,this.showPassword=!1,this.stopLabelWatch=null}static{this.styles=[l,o`
    :host {
      display: block;
      width: 100%;
      position: relative;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      --input-leading-space: 12px;
      --input-trailing-space: 12px;
    }

    input {
      width: 100%;
      height: 36px;
      padding-block: 0;
      padding-left: var(--input-leading-space);
      padding-right: var(--input-trailing-space);
      background: var(--alps-input-bg, var(--bg-primary, #ffffff));
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--input-radius, 6px);
      color: var(--text-primary, #111827);
      font-family: var(--font-base, 'Inter', sans-serif);
      font-size: var(--input-font-size, 14px);
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }

    /* Room for the icon and the action button, on the sides the INTERFACE
       puts them. Taken from the host's direction, not the input's: the input
       carries its value's direction, and logical padding there would put an
       address's room on the wrong side of a right-to-left field. */
    :host(:dir(rtl)) input {
      padding-left: var(--input-trailing-space);
      padding-right: var(--input-leading-space);
    }

    .has-left-icon { --input-leading-space: 36px; }
    .has-right-icon { --input-trailing-space: 36px; }

    /* An empty left-to-right field still shows the interface's placeholder,
       on the interface's side. */
    :host(:dir(rtl)) input[dir='ltr']:placeholder-shown {
      text-align: right;
    }

    /* The transparent outline paints nothing here; forced colors, which drop
       the border colour and the shadow, give it a system colour. */
    input:focus {
      border-color: var(--accent-color, #005A9E);
      box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
      outline: 2px solid transparent;
    }

    input::placeholder {
      color: var(--text-muted, #9ca3af);
    }

    .icon-left {
      position: absolute;
      inset-inline-start: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      color: var(--text-muted, #9ca3af);
      pointer-events: none;
    }

    .icon-left svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .action-btn {
      position: absolute;
      inset-inline-end: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      color: var(--text-muted, #9ca3af);
      cursor: pointer;
      background: transparent;
      border: none;
      padding: 0;
      border-radius: 4px;
      transition: color 0.2s ease, background 0.2s ease;
      outline: none;
    }

    .action-btn:focus-visible {
      outline: 2px solid var(--accent-color, #005A9E);
      outline-offset: 2px;
    }

    .action-btn:hover {
      color: var(--text-primary, #111827);
      background: var(--bg-tertiary, #f3f4f6);
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
  `]}handleInput(e){let t=e.target;this.value=t.value}handleChange(e){let t=e.target;this.value=t.value,this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}togglePassword(){this.disabled||(this.showPassword=!this.showPassword)}handleClear(){this.disabled||(this.value=``,this.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`clear`,{bubbles:!0,composed:!0})))}handleKeyDown(e){if(!this.disabled&&e.key===`Enter`&&!g(e)){let t=this.closest(`form`);t&&(e.preventDefault(),t.requestSubmit())}}checkValidity(){let e=this.shadowRoot?.querySelector(`input`);return!e||e.checkValidity()}reportValidity(){let e=this.shadowRoot?.querySelector(`input`);return!e||e.reportValidity()}focus(){let e=this.shadowRoot?.querySelector(`input`);e&&e.focus()}connectedCallback(){super.connectedCallback(),this.i18nStore?.addEventListener(`change`,this._handleI18nChange),this.stopLabelWatch=f(this)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),this.stopLabelWatch?.(),this.stopLabelWatch=null,this.showPassword=!1}willUpdate(e){e.has(`value`)&&!this.value&&(this.showPassword=!1)}render(){let t=this.type===`password`,n=t&&this.showPassword?`text`:this.type,r=this.icon||(this.type===`email`?`at`:``),i=this.inputDir||(v.has(this.type)?`ltr`:`auto`),a=[`url`,`email`,`password`].includes(this.type)||this.autocomplete.split(/\s+/).includes(`username`);return s`
      <div class="input-wrapper ${r?`has-left-icon`:``} ${(t||this.clearable)&&this.value?`has-right-icon`:``}">
        ${r?s`
          <span class="icon-left">
            ${d(r)}
          </span>
        `:``}

        <input 
          id=${this.inputId||``}
          type=${n} 
          dir=${i}
          .value=${this.value}
          name=${this.name||e}
          placeholder=${this.placeholder}
          aria-label=${this.label||e}
          ?required=${this.required}
          ?disabled=${this.disabled}
          maxlength=${this.maxLength>=0?this.maxLength:e}
          ?autofocus=${this.autofocus}
          autocomplete=${this.autocomplete}
          autocorrect=${a?`off`:e}
          autocapitalize=${a?`none`:e}
          spellcheck=${a?`false`:e}
          @input=${this.handleInput}
          @change=${this.handleChange}
          @keydown=${this.handleKeyDown}
        />

        ${t&&this.value?s`
          <button 
            type="button" 
            class="action-btn" 
            @click=${this.togglePassword}
            ?disabled=${this.disabled}
            aria-pressed=${this.showPassword}
            title=${this.showPassword?this.i18nStore?.t(`general.hidePassword`)||`Hide password`:this.i18nStore?.t(`general.showPassword`)||`Show password`}
            tabindex="-1"
          >
            ${d(this.showPassword?`eyeSlash`:`eye`)}
          </button>
        `:this.clearable&&this.value?s`
          <button 
            type="button" 
            class="action-btn" 
            @click=${this.handleClear}
            ?disabled=${this.disabled}
            title=${this.i18nStore?.t(`general.clear`)||`Clear`}
            tabindex="-1"
          >
            ${d(`x`)}
          </button>
        `:``}
      </div>
    `}};u([n({context:c})],y.prototype,`i18nStore`,void 0),u([a({type:String})],y.prototype,`type`,void 0),u([a({type:String,attribute:`input-dir`})],y.prototype,`inputDir`,void 0),u([a({type:String})],y.prototype,`value`,void 0),u([a({type:String})],y.prototype,`name`,void 0),u([a({type:String})],y.prototype,`placeholder`,void 0),u([a({type:Boolean})],y.prototype,`required`,void 0),u([a({type:Boolean,reflect:!0})],y.prototype,`disabled`,void 0),u([a({type:Number,attribute:`maxlength`})],y.prototype,`maxLength`,void 0),u([a({type:String})],y.prototype,`autocomplete`,void 0),u([a({type:String})],y.prototype,`inputId`,void 0),u([a({type:String})],y.prototype,`label`,void 0),u([a({type:String})],y.prototype,`icon`,void 0),u([a({type:Boolean})],y.prototype,`clearable`,void 0),u([a({type:Boolean})],y.prototype,`autofocus`,void 0),u([i()],y.prototype,`showPassword`,void 0),y=u([t(`alps-input`)],y);export{f as a,h as i,_ as n,g as r,m as t};