import{_ as e,d as t,f as n,h as r,m as i,p as a,s as o,y as s}from"./lit-CB2iQgdU.js";import{G as c,H as l,J as u,K as d,U as f,V as p,W as m,lt as h,ot as g,st as _,u as v}from"./index-iaOWfb9x.js";var y=class extends i{constructor(...e){super(...e),this.addresses=[],this.disabled=!1,this.label=``,this.inputText=``,this.suggestions=[],this.focusedSuggestionIndex=-1,this._suggestionTimeout=null,this._suggestionSeq=0,this._handleI18nChange=()=>this.requestUpdate()}focus(){let e=this.shadowRoot?.querySelector(`input`);e&&e.focus()}connectedCallback(){super.connectedCallback(),this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}updated(e){if(super.updated(e),e.has(`focusedSuggestionIndex`)&&this.focusedSuggestionIndex>=0){let e=this.shadowRoot?.querySelector(`.dropdown-item.active`);e&&e.scrollIntoView({block:`nearest`})}}_isBlockedAddress(e){let t=e.trim();if(t.endsWith(`>`)){let e=t.lastIndexOf(`<`);e!==-1&&(t=t.substring(e+1,t.length-1))}let n=t.toLowerCase();return n.startsWith(`noreply`)||n.startsWith(`no-reply`)||n.startsWith(`mailer-daemon`)}_isValidEmail(e){if(this._isBlockedAddress(e))return!1;let t=e.trim();return!!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)||/^.*?<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(t))}_displayAddr(t){let{name:n,email:r}=c(t);return f(r).warning?e`${n?e`<bdi>${n}</bdi> &lt;`:``}${p(r)}${n?`>`:``}${l(r,this.i18nStore)}`:n?e`<bdi>${n}</bdi>`:p(r)}_cancelSuggestions(){this._suggestionTimeout!==null&&(window.clearTimeout(this._suggestionTimeout),this._suggestionTimeout=null),this._suggestionSeq++}_handleInput(e){let t=e.target;if(this.inputText=t.value,this._cancelSuggestions(),this.inputText.trim().length>1){let e=this._suggestionSeq,t=this.inputText.trim();this._suggestionTimeout=window.setTimeout(async()=>{this._suggestionTimeout=null;try{let n=await h.invokeHookAsync(`composer:suggest`,{query:t});if(e!==this._suggestionSeq)return;this.suggestions=n.flat(),this.focusedSuggestionIndex=-1}catch(t){if(e!==this._suggestionSeq)return;console.error(`Failed to get suggestions`,t),this.suggestions=[],this.focusedSuggestionIndex=-1}},300)}else this.suggestions=[],this.focusedSuggestionIndex=-1}_handleKeyDown(e){let t=this.inputText.trim();if(this.suggestions.length>0){if(e.key===`ArrowDown`){e.preventDefault(),this._cancelSuggestions(),this.focusedSuggestionIndex=Math.min(this.focusedSuggestionIndex+1,this.suggestions.length-1);return}else if(e.key===`ArrowUp`){e.preventDefault(),this._cancelSuggestions(),this.focusedSuggestionIndex=Math.max(this.focusedSuggestionIndex-1,-1);return}else if(e.key===`Enter`&&this.focusedSuggestionIndex>=0){e.preventDefault(),this._cancelSuggestions();let t=this.suggestions[this.focusedSuggestionIndex],n=d(t.name,t.address);this._addAddress(n);return}else if(e.key===`Escape`){e.preventDefault(),this._cancelSuggestions(),this.suggestions=[],this.focusedSuggestionIndex=-1;return}}if(e.key===`Enter`&&t)e.preventDefault(),this._isValidEmail(t)&&this._addAddress(t);else if((e.key===` `||e.key===`,`)&&t)this._isValidEmail(t)&&(e.preventDefault(),this._addAddress(t));else if(e.key===`Backspace`&&!this.inputText&&this.addresses.length>0){let e=this.addresses[this.addresses.length-1];this._removeAddress(e),this.inputText=e+` `}}_addAddress(e,t=!0){this.addresses.includes(e)||(this.addresses=[...this.addresses,e],this._notifyChange()),this.inputText=``,this._cancelSuggestions(),this.suggestions=[],this.focusedSuggestionIndex=-1,t&&this.focus()}_removeAddress(e){this.addresses=this.addresses.filter(t=>t!==e),this._notifyChange()}_notifyChange(){this.dispatchEvent(new CustomEvent(`addresses-changed`,{detail:{addresses:this.addresses},bubbles:!0,composed:!0}))}_handleBlur(){setTimeout(()=>{let e=this.inputText.trim();e&&this._isValidEmail(e)&&this._addAddress(e,!1),this.suggestions=[],this.focusedSuggestionIndex=-1},150)}static{this.styles=[v,m,s`
    :host {
      display: block;
      width: 100%;
      position: relative;
      font-family: inherit;
    }

    .address-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      min-height: 32px;
      cursor: text;
    }

    .pill {
      display: flex;
      align-items: center;
      background: var(--bg-selected);
      border: none;
      border-radius: 4px;
      padding: 2px 2px 2px 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--accent-hover);
      gap: 4px;
    }

    .pill-addr {
      font-size: 13px;
      line-height: 1;
    }

    .pill-remove {
      background: none;
      border: none;
      color: var(--accent-hover);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      border-radius: 4px;
    }

    .pill-remove svg {
      width: 14px;
      height: 14px;
    }

    .pill-remove:hover {
      color: var(--text-color);
    }

    .input-container {
      flex: 1;
      min-width: 8px;
      position: relative;
    }

    .input-wrapper {
      width: 100%;
      display: flex;
    }

    .input-container:focus-within,
    .input-container.has-value {
      min-width: 144px;
    }

    .suggestions-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 40010;
      min-width: 200px;
      max-width: 320px;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 6px;
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      padding: 4px 0;
      display: flex;
      flex-direction: column;
      margin-top: 4px;
      max-height: 250px;
      overflow-y: auto;
    }

    input {
      width: 100%;
      border: none;
      outline: none;
      font-size: 14px;
      color: var(--text-color);
      background: transparent;
      padding: 4px 0;
    }
  `]}render(){return e`
      <div class="address-container" @click=${this.focus}>
        ${this.addresses.map(t=>e`
          <div class="pill" title=${t}>
            <span class="pill-addr">${this._displayAddr(t)}</span>
            <button class="pill-remove" @click=${()=>this._removeAddress(t)} ?disabled=${this.disabled}>
              ${g(`x`)}
            </button>
          </div>
        `)}
        
        <div class="input-container ${this.inputText.length>0?`has-value`:``}">
          <div class="input-wrapper">
            <input
              type="text"
              aria-label=${this.label||r}
              .value=${this.inputText}
              @input=${this._handleInput}
              @keydown=${this._handleKeyDown}
              @blur=${this._handleBlur}
              @click=${e=>e.stopPropagation()}
              ?disabled=${this.disabled}
            />
          </div>
          ${this.suggestions.length>0?e`
            <div class="suggestions-dropdown">
              ${this.suggestions.map((t,n)=>e`
                <button class="dropdown-item ${n===this.focusedSuggestionIndex?`active`:``}"
                  @mousedown=${e=>{e.preventDefault()}}
                  @click=${e=>{e.preventDefault(),e.stopPropagation();let n=d(t.name,t.address);this._addAddress(n)}}>
                  <span class="item-text"><b><bdi>${t.name}</bdi></b> &lt;${p(t.address)}&gt;${l(t.address,this.i18nStore)}</span>
                </button>
              `)}
            </div>
          `:``}
        </div>
      </div>
    `}};u([o({context:_})],y.prototype,`i18nStore`,void 0),u([n({type:Array})],y.prototype,`addresses`,void 0),u([n({type:Boolean})],y.prototype,`disabled`,void 0),u([n({type:String})],y.prototype,`label`,void 0),u([t()],y.prototype,`inputText`,void 0),u([t()],y.prototype,`suggestions`,void 0),u([t()],y.prototype,`focusedSuggestionIndex`,void 0),y=u([a(`alps-address-input`)],y);