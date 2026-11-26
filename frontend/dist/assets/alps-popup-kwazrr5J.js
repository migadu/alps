import{d as e,g as t,u as n,x as r,y as i}from"./lit-Drqu7DG3.js";import{K as a,n as o,t as s}from"./alps-button-1B4BsSBF.js";import{i as c,r as l,t as u}from"./alps-input-BEkzUnir.js";import{a as d,i as f,r as p}from"./ui-confirm-D0o7tidP.js";var m=`plugin-load-failed`,h=new Map,g=new Map,_=new Set;function v(){_.clear()}function y(e,t){let{component:n,load:r}=e;if(!r||customElements.get(n))return h.delete(n),_.delete(n),!0;let i=e=>{_.has(n)||(_.add(n),a.error(`Failed to load <${n}>`,e),window.dispatchEvent(new CustomEvent(m,{detail:{component:n}})))};if(h.has(n))return i(h.get(n)),!1;let o=g.get(n);if(o)return t&&o.add(t),!0;let s=new Set;t&&s.add(t),g.set(n,s);let c=e=>{customElements.get(n)||h.has(n)||(h.set(n,e),i(e),s.forEach(e=>e()))},l;try{l=r.call(e)}catch(e){return c(e),g.delete(n),!1}return Promise.resolve(l).then(()=>{if(!customElements.get(n))throw Error(`The module did not define <${n}>`);_.delete(n)}).catch(c).finally(()=>g.delete(n)),!0}function b(e,t){if(e===null||t===null)return e===t;if(e.size!==t.size)return!1;for(let n of e)if(!t.has(n))return!1;return!0}var x=new class{constructor(){this.navTabs=[],this.settingsTabs=[],this.routes=[],this.hooks=new Map,this.enabledPlugins=null,this.activePlugins=null,this.rememberedActive=null}setEnabledPlugins(e,t=e){let n=e===null?null:new Set(e),r=t===null?null:new Set(t);b(this.enabledPlugins,n)&&b(this.activePlugins,r)||(this.enabledPlugins=n,this.activePlugins=r,window.dispatchEvent(new CustomEvent(`plugins-updated`)))}isEnabled(e){return this.enabledPlugins===null||this.enabledPlugins.has(e)}isActive(e){return this.isEnabled(e)?this.activePlugins?this.activePlugins.has(e):e!==`caldav`&&e!==`carddav`||this.rememberedActive?.has(e)===!0:!1}get activeKnown(){return this.activePlugins!==null}setRememberedActive(e){let t=e===null?null:new Set(e);b(this.rememberedActive,t)||(this.rememberedActive=t,this.activePlugins===null&&window.dispatchEvent(new CustomEvent(`plugins-updated`)))}setDAVConnectionConfigured(e,t){let n=new Set(this.activePlugins??this.enabledPlugins??[]);t?n.add(e):n.delete(e),this.setEnabledPlugins(this.enabledPlugins===null?null:[...this.enabledPlugins],[...n])}registerHook(e,t,n){this.hooks.has(e)||this.hooks.set(e,[]),this.hooks.get(e).push({handler:t,pluginId:n})}enabledHandlers(e){return(this.hooks.get(e)||[]).filter(e=>!e.pluginId||this.isActive(e.pluginId)).map(e=>e.handler)}async invokeHookAsync(e,t){let{results:n}=await this.invokeHookSettled(e,t);return n}async invokeHookSettled(e,t){let n=this.enabledHandlers(e),r=await Promise.allSettled(n.map(e=>new Promise(n=>n(e(t))))),i=[],a=0;for(let t of r)t.status===`fulfilled`?i.push(t.value):(a+=1,console.error(`Error in async hook ${e}:`,t.reason));return{results:i,failed:a}}invokeHook(e,t){let n=this.enabledHandlers(e),r=[];return n.forEach(n=>{try{r.push(n(t))}catch(t){console.error(`Error in hook ${e}:`,t)}}),r}registerNavTab(e){this.navTabs.find(t=>t.id===e.id)||this.navTabs.push(e)}getNavTabs(){return this.navTabs.filter(e=>this.isActive(e.pluginId||e.id)).slice().sort((e,t)=>(e.order||999)-(t.order||999))}registerSettingsTab(e){this.settingsTabs.find(t=>t.id===e.id)||this.settingsTabs.push(e)}getSettingsTabs(){return this.enabledPlugins===null?this.settingsTabs:this.settingsTabs.filter(e=>this.isEnabled(e.pluginId||e.id))}registerRoute(e){this.routes.find(t=>t.path===e.path)||this.routes.push(e)}getRoutes(){return this.routes.filter(e=>!e.pluginId||this.isActive(e.pluginId))}},S=`\\Seen`,C=`\\Flagged`,w=`\\Answered`,T=`\\Deleted`,E=`\\Draft`,D=`$Forwarded`,O=`$MDNSent`,k=`Junk`,A=`NonJunk`,j=`NotJunk`,M=`$Junk`,N=`$NotJunk`,P=`$Phishing`,F=`$SubmitPending`,I=`$Submitted`,L=`$HasAttachment`,R=`$HasNoAttachment`;function z(e,t){if(!e)return[];let n=new Set([S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R].map(e=>e.toLowerCase())),r=[];for(let i of e)i.startsWith(`\\`)||n.has(i.toLowerCase())||r.push({id:i,name:H(i,t),color:U(i)});return r.sort((e,t)=>{let n=e.id.toLowerCase().startsWith(`$label`),r=t.id.toLowerCase().startsWith(`$label`);return n&&!r?-1:!n&&r?1:e.id.localeCompare(t.id)})}var B=new Set([D,O,P,F,I,L,R].map(e=>e.toLowerCase()));function V(e){return e?e.filter(e=>!e.startsWith(`\\`)&&!B.has(e.toLowerCase())):[]}function H(e,t){switch(e.toLowerCase()){case`$label1`:return t?.t(`tags.important`)||`Important`;case`$label2`:return t?.t(`tags.work`)||`Work`;case`$label3`:return t?.t(`tags.personal`)||`Personal`;case`$label4`:return t?.t(`tags.todo`)||`To Do`;case`$label5`:return t?.t(`tags.later`)||`Later`;default:return e}}function U(e){switch(e.toLowerCase()){case`$label1`:return`#ef4444`;case`$label2`:return`#f97316`;case`$label3`:return`#22c55e`;case`$label4`:return`#3b82f6`;case`$label5`:return`#a855f7`;default:return K(e)}}function W(e){let t=G(e);if(!t)return`#fff`;let[n,r,i]=t.map(e=>{let t=e/255;return t<=.03928?t/12.92:((t+.055)/1.055)**2.4});return(.2126*n+.7152*r+.0722*i+.05)**2>.05*1.05?`#000`:`#fff`}function G(e){let t=/^#([0-9a-f]{6})$/i.exec(e.trim());if(t){let e=parseInt(t[1],16);return[e>>16&255,e>>8&255,e&255]}let n=/^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i.exec(e.trim());if(!n)return null;let[r,i,a]=[Number(n[1]),Number(n[2])/100,Number(n[3])/100],o=i*Math.min(a,1-a),s=e=>{let t=(e+r/30)%12;return 255*(a-o*Math.max(-1,Math.min(t-3,9-t,1)))};return[s(0),s(8),s(4)]}function K(e){let t=0;for(let n=0;n<e.length;n++)t=e.charCodeAt(n)+((t<<5)-t);return`hsl(${Math.abs(t)%360}, 70%, 45%)`}var q,J=r`
  .dropdown-header {
    padding: 12px 16px 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted, #6b7280);
    margin-bottom: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 16px;
    font-size: 14px;
    color: var(--text-primary, #111827);
    background: none;
    border: none;
    cursor: pointer;
    text-align: start;
    transition: background-color 0.2s;
    white-space: nowrap;
    position: relative;
  }

  .dropdown-item:focus,
  .dropdown-item:focus-visible {
    z-index: 10;
  }

  .dropdown-item:hover:not(:disabled) {
    background-color: var(--bg-tertiary, #f3f4f6);
  }

  .dropdown-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dropdown-item:first-of-type {
    border-start-start-radius: 4px;
    border-start-end-radius: 4px;
  }

  .dropdown-item:last-of-type {
    border-end-start-radius: 4px;
    border-end-end-radius: 4px;
  }

  .dropdown-item.active {
    color: var(--text-primary, #111827);
    background-color: var(--bg-tertiary, #f3f4f6);
    font-weight: 600;
  }

  .dropdown-item.active svg {
    color: var(--text-primary, #111827);
  }

  .dropdown-item svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
    color: var(--text-secondary, #4b5563);
    flex-shrink: 0;
  }

  .item-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-divider {
    height: 1px;
    background: var(--border-color, #e5e7eb);
    margin: 4px 0;
  }
`,Y=()=>Object.hasOwn(HTMLElement.prototype,`popover`),X=class extends t{static{q=this}constructor(...e){super(...e),this.align=`end`,this.position=`bottom`,this.triggerOn=`click`,this.openState=!1,this._openAtPointerDown=null,this._handleTriggerPointerDown=()=>{this._openAtPointerDown=this.openState},this._shown=!1,this._handleToggle=e=>{e.newState===`closed`&&(this._shown=!1,this.openState&&(this._closedByPopover=!0,this.close()))},this._returnFocus=null,this._closedByPopover=!1,this._handleOutsidePointer=e=>{this.openState&&!e.composedPath().includes(this)&&this.close()},this._syncExpanded=()=>{for(let e of this._triggerElements())`expanded`in e?e.expanded=this.openState:(e instanceof HTMLButtonElement||e.getAttribute(`role`)===`button`)&&e.setAttribute(`aria-expanded`,String(this.openState))},this._handleKeydown=e=>{if(!this.openState||e.defaultPrevented)return;let t=e.composedPath();if(t.find(e=>e instanceof q&&e.openState)!==this)return;let n=t.findIndex(e=>e instanceof HTMLDialogElement&&e.open);n!==-1&&n<t.indexOf(this)||this._handleMenuKey(e,t.includes(this._content))},this._handleWindowKeydown=e=>{this.openState&&!e.defaultPrevented&&d()===this._content&&(e.composedPath().some(e=>e instanceof q&&e.openState)||this._handleMenuKey(e,!1))},this._triggerRect=null,this._frame=0,this._closeTimeout=null,this._directionObserver=new MutationObserver(()=>{this.openState&&this._updatePosition()}),this._handleMouseEnter=()=>{this.triggerOn===`hover`&&(this._closeTimeout&&=(clearTimeout(this._closeTimeout),null),this.open())},this._handleMouseLeave=()=>{this.triggerOn===`hover`&&(this._closeTimeout&&clearTimeout(this._closeTimeout),this._closeTimeout=setTimeout(()=>{this.close(),this._closeTimeout=null},300))},this._handleResize=()=>{this.openState&&this._updatePosition()}}static{this.styles=[o,r`
    :host {
      display: inline-block;
      position: relative;
    }

    /* A popover's own box. The user-agent sheet centres a popover in the
       viewport and gives it a frame and a canvas; _updatePosition places it
       beside its trigger in viewport coordinates instead. Without the Popover
       API it is drawn in place, fixed above the page. */
    .popup-content {
      position: fixed;
      inset: auto;
      margin: 0;
      overflow: visible;
      /* What the dialog it was in gave it, and a popover gives it too. */
      color: CanvasText;
      z-index: 40010;
      min-width: 160px;
      max-width: 320px;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 6px;
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      padding: 4px 0;
      display: none;
      flex-direction: column;
    }

    /* Shown by the popover's own state where there is one, so a light dismiss
       hides it at once rather than when this element next renders. */
    .popup-content:popover-open {
      display: flex;
    }

    @supports not selector(:popover-open) {
      .popup-content.is-open {
        display: flex;
      }
    }

    .popup-content::before,
    .popup-content::after {
      content: '';
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
      pointer-events: none;
    }

    /* Position classes and arrow offsets have already been resolved to
       physical viewport sides by _updatePosition. Do not mirror them again. */
    .popup-content.position-bottom.align-right::before {
      top: -6px;
      right: var(--arrow-right, 10px);
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent var(--border-color, #e5e7eb) transparent;
    }

    .popup-content.position-bottom.align-right::after {
      top: -5px;
      right: calc(var(--arrow-right, 10px) + 1px);
      border-width: 0 5px 5px 5px;
      border-color: transparent transparent var(--bg-primary, #ffffff) transparent;
    }

    .popup-content.position-bottom.align-left::before {
      top: -6px;
      left: var(--arrow-left, 10px);
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent var(--border-color, #e5e7eb) transparent;
    }

    .popup-content.position-bottom.align-left::after {
      top: -5px;
      left: calc(var(--arrow-left, 10px) + 1px);
      border-width: 0 5px 5px 5px;
      border-color: transparent transparent var(--bg-primary, #ffffff) transparent;
    }

    .popup-content.position-top.align-right::before {
      bottom: -6px;
      right: var(--arrow-right, 10px);
      border-width: 6px 6px 0 6px;
      border-color: var(--border-color, #e5e7eb) transparent transparent transparent;
    }

    .popup-content.position-top.align-right::after {
      bottom: -5px;
      right: calc(var(--arrow-right, 10px) + 1px);
      border-width: 5px 5px 0 5px;
      border-color: var(--bg-primary, #ffffff) transparent transparent transparent;
    }

    .popup-content.position-top.align-left::before {
      bottom: -6px;
      left: var(--arrow-left, 10px);
      border-width: 6px 6px 0 6px;
      border-color: var(--border-color, #e5e7eb) transparent transparent transparent;
    }

    .popup-content.position-top.align-left::after {
      bottom: -5px;
      left: calc(var(--arrow-left, 10px) + 1px);
      border-width: 5px 5px 0 5px;
      border-color: var(--bg-primary, #ffffff) transparent transparent transparent;
    }

    /* Horizontal Left Position Arrow (points right, on the right border of popup) */
    .popup-content.position-left::before {
      right: -6px;
      top: var(--arrow-top, 10px);
      border-width: 6px 0 6px 6px;
      border-color: transparent transparent transparent var(--border-color, #e5e7eb);
    }
    .popup-content.position-left::after {
      right: -5px;
      top: calc(var(--arrow-top, 10px) + 1px);
      border-width: 5px 0 5px 5px;
      border-color: transparent transparent transparent var(--bg-primary, #ffffff);
    }

    /* Horizontal Right Position Arrow (points left, on the left border of popup) */
    .popup-content.position-right::before {
      left: -6px;
      top: var(--arrow-top, 10px);
      border-width: 6px 6px 6px 0;
      border-color: transparent var(--border-color, #e5e7eb) transparent transparent;
    }
    .popup-content.position-right::after {
      left: -5px;
      top: calc(var(--arrow-top, 10px) + 1px);
      border-width: 5px 5px 5px 0;
      border-color: transparent var(--bg-primary, #ffffff) transparent transparent;
    }

  `]}open(){this.openState=!0,this.dispatchEvent(new CustomEvent(`popup-open`,{bubbles:!0,composed:!0}))}close(){this.openState=!1,this.dispatchEvent(new CustomEvent(`popup-close`,{bubbles:!0,composed:!0}))}toggle(e){if(this.triggerOn===`hover`){e.stopPropagation();return}let t=e instanceof MouseEvent&&e.detail>0?this._openAtPointerDown??this.openState:this.openState;this._openAtPointerDown=null,t?this.openState&&this.close():this.open()}get _content(){return this.shadowRoot?.querySelector(`.popup-content`)??null}_holds(e){for(let t=e;t;t=t.parentNode??(t instanceof ShadowRoot?t.host:null))if(t===this)return!0;return!1}_giveFocusBack(){let e=this._returnFocus,t=this._closedByPopover;if(this._returnFocus=null,this._closedByPopover=!1,!e||t||!e.isConnected)return;let n=this._getActiveElement();(!n||n===document.body||this._holds(n))&&e.focus()}_showContent(e){if(this._returnFocus=this.triggerOn===`hover`?this._triggerElements().find(e=>e instanceof HTMLElement)??null:this._getActiveElement(),Y())try{e.showPopover({source:this.shadowRoot?.querySelector(`.trigger`)??void 0})}catch{return}else document.addEventListener(`pointerdown`,this._handleOutsidePointer,!0);this._shown=!0,this.triggerOn===`click`&&f(e)}_hideContent(e){if(p(e),document.removeEventListener(`pointerdown`,this._handleOutsidePointer,!0),this._shown&&(this._shown=!1,e&&Y()))try{e.hidePopover()}catch{}}_nestedPopups(){return((this.shadowRoot?.querySelector(`slot:not([name])`))?.assignedElements({flatten:!0})??[]).flatMap(e=>[...e instanceof q?[e]:[],...Array.from(e.querySelectorAll(`alps-popup`))])}_triggerElements(){return(this.shadowRoot?.querySelector(`slot[name="trigger"]`))?.assignedElements({flatten:!0})??[]}_getActiveElement(){let e=document.activeElement;for(;e?.shadowRoot&&e.shadowRoot.activeElement;)e=e.shadowRoot.activeElement;return e}_getFocusableElements(){let e=this.shadowRoot?.querySelector(`slot:not([name])`);if(!e)return[];let t=e.assignedElements({flatten:!0}),n=[],r=`button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])`;return t.forEach(e=>{if(e instanceof HTMLElement){e.matches(r)&&n.push(e);let t=Array.from(e.querySelectorAll(r));n.push(...t)}}),n}_handleMenuKey(e,t){if(!l(e)){if(e.key===`Escape`)e.preventDefault(),this.close();else if(e.key===`ArrowDown`||e.key===`ArrowUp`){if(c(this._getActiveElement()))return;e.preventDefault();let t=this._getFocusableElements();if(t.length===0)return;let n=this._getActiveElement(),r=t.findIndex(e=>e===n);r=e.key===`ArrowDown`?r===-1?0:(r+1)%t.length:r===-1?t.length-1:(r-1+t.length)%t.length,t[r].focus()}else if(t&&(e.key===`Enter`||e.key===` `)){let t=this._getActiveElement();if(e.key===` `?u(t):c(t))return;t&&typeof t.click==`function`&&(e.preventDefault(),t.click())}}}updated(e){if(super.updated(e),e.has(`openState`)){let t=this._content;if(t?.classList.toggle(`is-open`,this.openState),this.openState)t&&!this._shown&&this._showContent(t),window.addEventListener(`keydown`,this._handleWindowKeydown,!0),this._updatePosition(),this._followTrigger();else if(e.get(`openState`)===!0){window.removeEventListener(`keydown`,this._handleWindowKeydown,!0),this._stopFollowing();for(let e of this._nestedPopups())e.openState&&e.close();this._hideContent(t),this._giveFocusBack();let e=this.shadowRoot?.querySelector(`slot[name="trigger"]`),n=this._getActiveElement();e?.assignedElements({flatten:!0}).some(e=>e===n||e.matches(`:focus-within`))&&n&&!n.matches(`:focus-visible`)&&n.blur()}this._syncExpanded()}}_followTrigger(){if(this._frame||typeof requestAnimationFrame!=`function`)return;let e=()=>{if(this._frame=0,!this.openState)return;let t=this.shadowRoot?.querySelector(`.trigger`)?.getBoundingClientRect(),n=this._triggerRect;t&&n&&(t.top!==n.top||t.left!==n.left||t.width!==n.width||t.height!==n.height)&&this._updatePosition(),this._frame=requestAnimationFrame(e)};this._frame=requestAnimationFrame(e)}_stopFollowing(){this._frame&&cancelAnimationFrame(this._frame),this._frame=0}_updatePosition(){let e=this.shadowRoot?.querySelector(`.trigger`),t=this.shadowRoot?.querySelector(`.popup-content`);if(!e||!t)return;let n=e.getBoundingClientRect();this._triggerRect=n;let r=t.getBoundingClientRect(),i=getComputedStyle(this).direction===`rtl`,a=this.position===`inline-start`?i?`right`:`left`:this.position===`inline-end`?i?`left`:`right`:this.position,o=this.align===`start`?i?`right`:`left`:this.align===`end`?i?`left`:`right`:this.align,s=a,c=o;if(t.style.top=``,t.style.bottom=``,t.style.left=``,t.style.right=``,t.style.removeProperty(`--arrow-right`),t.style.removeProperty(`--arrow-left`),t.style.removeProperty(`--arrow-top`),t.style.removeProperty(`--arrow-bottom`),a===`left`||a===`right`){a===`right`?n.right+6+r.width>window.innerWidth&&n.left-6-r.width>=0&&(s=`left`):n.left-6-r.width<0&&n.right+6+r.width<=window.innerWidth&&(s=`right`),o===`top`?n.top+r.height>window.innerHeight&&n.bottom-r.height>=0&&(c=`bottom`):n.bottom-r.height<0&&n.top+r.height<=window.innerHeight&&(c=`top`),s===`right`?(t.style.left=`${n.right+6}px`,t.style.right=`auto`):(t.style.right=`${window.innerWidth-n.left+6}px`,t.style.left=`auto`);let e=n.top+n.height/2;if(c===`top`){let i=n.top-4;i+r.height>window.innerHeight&&(i=window.innerHeight-r.height-8),i=Math.max(8,i),t.style.top=`${i}px`,t.style.bottom=`auto`;let a=e-i-6;t.style.setProperty(`--arrow-top`,`${Math.max(10,Math.min(r.height-20,a))}px`)}else{let i=window.innerHeight-n.bottom-4;i+r.height>window.innerHeight&&(i=window.innerHeight-r.height-8),i=Math.max(8,i),t.style.bottom=`${i}px`,t.style.top=`auto`;let a=e-(window.innerHeight-i-r.height)-6;t.style.setProperty(`--arrow-top`,`${Math.max(10,Math.min(r.height-20,a))}px`)}}else if(a===`bottom`?n.bottom+8+r.height>window.innerHeight&&n.top-8-r.height>=0&&(s=`top`):n.top-8-r.height<0&&n.bottom+8+r.height<=window.innerHeight&&(s=`bottom`),o===`right`?n.right-r.width<0&&n.left+r.width<=window.innerWidth&&(c=`left`):n.left+r.width>window.innerWidth&&n.right-r.width>=0&&(c=`right`),s===`bottom`?(t.style.top=`${n.bottom+8}px`,t.style.bottom=`auto`):(t.style.bottom=`${window.innerHeight-n.top+8}px`,t.style.top=`auto`),c===`right`){let e=window.innerWidth-n.right;e+r.width>window.innerWidth&&(e=window.innerWidth-r.width-8),e=Math.max(8,e),t.style.right=`${e}px`,t.style.left=`auto`;let i=n.left+n.width/2,a=window.innerWidth-e-i-6;t.style.setProperty(`--arrow-right`,`${Math.max(10,Math.min(r.width-20,a))}px`)}else{let e=n.left;e+r.width>window.innerWidth&&(e=window.innerWidth-r.width-8),e=Math.max(8,e),t.style.left=`${e}px`,t.style.right=`auto`;let i=n.left+n.width/2-e-6;t.style.setProperty(`--arrow-left`,`${Math.max(10,Math.min(r.width-20,i))}px`)}t.classList.remove(`position-top`,`position-bottom`,`position-left`,`position-right`,`align-left`,`align-right`,`align-top`,`align-bottom`),t.classList.add(`position-${s}`,`align-${c}`)}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this._handleResize,{passive:!0}),this._directionObserver.observe(document.documentElement,{attributes:!0,attributeFilter:[`dir`]}),this.addEventListener(`mouseenter`,this._handleMouseEnter),this.addEventListener(`mouseleave`,this._handleMouseLeave),this.addEventListener(`keydown`,this._handleKeydown)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this._handleResize),window.removeEventListener(`keydown`,this._handleWindowKeydown,!0),this._directionObserver.disconnect(),this.removeEventListener(`mouseenter`,this._handleMouseEnter),this.removeEventListener(`mouseleave`,this._handleMouseLeave),this.removeEventListener(`keydown`,this._handleKeydown),this._stopFollowing(),this._closeTimeout&&=(clearTimeout(this._closeTimeout),null),this._hideContent(this._content),this._returnFocus=null,this.openState=!1}render(){return i`
      <div class="trigger" @click=${this.toggle} @pointerdown=${this._handleTriggerPointerDown}>
        <slot name="trigger" @slotchange=${this._syncExpanded}></slot>
      </div>

      <div class="popup-content align-${this.align} position-${this.position}"
        popover=${this.triggerOn===`hover`?`manual`:`auto`}
        @toggle=${this._handleToggle}>
        <slot></slot>
      </div>
    `}};s([n({type:String})],X.prototype,`align`,void 0),s([n({type:String})],X.prototype,`position`,void 0),s([n({type:String,reflect:!0})],X.prototype,`triggerOn`,void 0),s([n({type:Boolean,reflect:!0,attribute:`open`})],X.prototype,`openState`,void 0),X=q=s([e(`alps-popup`)],X);export{D as a,V as c,W as d,m as f,v as h,C as i,U as l,x as m,w as n,S as o,y as p,E as r,z as s,J as t,H as u};