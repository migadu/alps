import{_ as e,d as t,f as n,g as r,l as i,u as a,x as o,y as s}from"./lit-Drqu7DG3.js";import{a as c,n as l,t as u}from"./alps-button-1B4BsSBF.js";var d=[],f=`alps-modal-layers-changed`;function p(e){d.includes(e)||(d.push(e),window.dispatchEvent(new Event(f)))}function m(e){let t=e?d.indexOf(e):-1;t!==-1&&(d.splice(t,1),window.dispatchEvent(new Event(f)))}function h(){return d.findLast(e=>e.isConnected&&(!(e instanceof HTMLDialogElement)||e.open))}var g=o`
  .btn-cancel {
    background: transparent;
    border: none;
    color: var(--text-muted, #6b7280);
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;
    font-weight: 500;
    padding: 8px 16px;
    transition: color 0.2s;
  }
  .btn-cancel:hover { color: var(--text-primary, #111827); }
  
  .btn-confirm {
    background-color: transparent;
    color: var(--text-primary, #111827);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 4px;
    font-family: inherit;
    padding: 8px 16px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }
  .btn-confirm:hover { 
    background-color: var(--bg-tertiary, #f3f4f6);
  }
  .btn-confirm.danger {
    color: var(--error, #ef4444);
    border-color: var(--error, #ef4444);
  }
  .btn-confirm.danger:hover {
    background-color: var(--error, #ef4444);
    color: #ffffff;
  }
`,_=class extends r{constructor(...e){super(...e),this.heading=``,this.isDanger=!1,this.dismissible=!1,this.width=`400px`,this.bodyDescribes=!1,this.ownHeader=!1,this._handleEscape=e=>{this.dismissible||e.preventDefault()},this._handleDialogClose=()=>{let e=this.shadowRoot?.querySelector(`dialog`);!this.dismissible&&this.isConnected&&e&&!e.open?e.showModal():(m(e),this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0})))}}static{this.styles=[l,o`
    .modal-dialog {
      position: fixed;
      inset: 0;
      margin: 0;
      padding: 0;
      border: none;
      background: transparent;
      width: 100vw;
      height: 100vh;
      max-width: none;
      max-height: none;
      align-items: center;
      justify-content: center;
    }

    /* Only while open: a display of its own overrides the closed dialog's
       display: none, and a closed one went on drawing its card over the
       page, outside the top layer and with nothing behind it made inert. */
    .modal-dialog[open] {
      display: flex;
    }

    .modal-dialog:modal { overscroll-behavior: contain; }

    .modal-dialog::backdrop {
      overflow: hidden;
      overscroll-behavior: contain;
      background: var(--modal-backdrop, rgba(255, 255, 255, 0.8));
    }

    .modal-card {
      background: var(--bg-primary, #ffffff);
      padding: 24px;
      border-radius: 8px;
      max-width: 100%;
      border: 1px solid var(--border-color, #e5e7eb);
      box-shadow: 0 8px 24px -6px rgba(0,0,0,0.15);
      font-family: inherit;
    }
    .modal-title {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 500;
      color: var(--text-primary, #111827);
    }
    .modal-title.danger {
      color: var(--error, #ef4444);
    }
    .modal-body {
      margin-bottom: 24px;
      color: var(--text-secondary, #4b5563);
      line-height: 1.5;
      font-size: 14px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      align-items: center;
    }
  `]}firstUpdated(){let e=this.shadowRoot?.querySelector(`.modal-dialog`);e&&!e.open&&(e.showModal(),p(e))}close(){this.shadowRoot?.querySelector(`dialog`)?.close()}disconnectedCallback(){super.disconnectedCallback(),m(this.shadowRoot?.querySelector(`dialog`))}_handleOverlayClick(e){this.dismissible?e.target===e.currentTarget&&(e.preventDefault(),e.stopPropagation(),this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))):e.stopPropagation()}_handleHeaderChange(e){this.ownHeader=e.target.assignedElements().length>0}render(){return s`
      <dialog class="modal-dialog" part="dialog"
        aria-labelledby=${this.heading&&!this.ownHeader?`modal-title`:e}
        aria-label=${this.heading&&this.ownHeader?this.heading:e}
        aria-describedby=${this.bodyDescribes?`modal-body`:e}
        @pointerdown=${this._handleOverlayClick} @cancel=${this._handleEscape} @close=${this._handleDialogClose}>
        <div class="modal-card" part="card" style="width: ${this.width};" @pointerdown=${e=>e.stopPropagation()}>
          <slot name="header" @slotchange=${this._handleHeaderChange}>
            ${this.heading?s`<h3 id="modal-title" class="modal-title ${this.isDanger?`danger`:``}">${this.heading}</h3>`:``}
          </slot>
          <div class="modal-body" id="modal-body">
            <slot></slot>
          </div>
          <div class="modal-actions">
            <slot name="actions"></slot>
          </div>
        </div>
      </dialog>
    `}};u([a({type:String})],_.prototype,`heading`,void 0),u([a({type:Boolean})],_.prototype,`isDanger`,void 0),u([a({type:Boolean})],_.prototype,`dismissible`,void 0),u([a({type:String})],_.prototype,`width`,void 0),u([a({type:Boolean})],_.prototype,`bodyDescribes`,void 0),u([i()],_.prototype,`ownHeader`,void 0),_=u([t(`ui-modal`)],_);var v=class extends r{constructor(...e){super(...e),this.heading=`Confirm`,this.message=`Are you sure?`,this.confirmText=`Confirm`,this.cancelText=``,this.isDanger=!1,this.dismissible=!1}static{this.styles=[l,g]}_handleCancel(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}_handleSecondary(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`secondary`,{bubbles:!0,composed:!0}))}_handleConfirm(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`confirm`,{bubbles:!0,composed:!0}))}render(){return s`
      <ui-modal 
        .heading=${this.heading}
        .isDanger=${this.isDanger}
        .dismissible=${this.dismissible}
        .bodyDescribes=${!0}
        @cancel=${this._handleCancel}
      >
        <slot>${this.message}</slot>
        <alps-button slot="actions" variant="text" @click=${this._handleCancel}>${this.cancelText||this.i18nStore?.t(`general.cancel`)||`Cancel`}</alps-button>
        ${this.secondaryText?s`<alps-button slot="actions" variant="text" @click=${this._handleSecondary}>${this.secondaryText}</alps-button>`:``}
        <alps-button slot="actions" variant=${this.isDanger?`danger`:`normal`} @click=${this._handleConfirm}>
          ${this.confirmText}
        </alps-button>
      </ui-modal>
    `}};u([n({context:c})],v.prototype,`i18nStore`,void 0),u([a({type:String})],v.prototype,`heading`,void 0),u([a({type:String})],v.prototype,`message`,void 0),u([a({type:String})],v.prototype,`confirmText`,void 0),u([a({type:String})],v.prototype,`cancelText`,void 0),u([a({type:String})],v.prototype,`secondaryText`,void 0),u([a({type:Boolean})],v.prototype,`isDanger`,void 0),u([a({type:Boolean})],v.prototype,`dismissible`,void 0),v=u([t(`ui-confirm`)],v);export{h as a,p as i,f as n,m as r,g as t};