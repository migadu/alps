import{_ as e,d as t,g as n,u as r,x as i,y as a}from"./lit-Drqu7DG3.js";import{n as o,t as s,x as c}from"./alps-button-DC-ocZ2C.js";var l=class extends n{constructor(...e){super(...e),this.icon=``,this.title=``,this.disabled=!1,this.active=!1,this.spinning=!1}static{this.styles=[o,i`
    :host {
      display: inline-flex;
      line-height: 0;
    }

    button {
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: var(--btn-icon-padding, 6px);
      border-radius: var(--btn-radius, 4px);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      margin: 0;
      line-height: 0;
      aspect-ratio: 1 / 1;
      box-sizing: border-box;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (hover: hover) {
      button:hover:not(:disabled) {
        background: var(--btn-hover-bg, var(--hover-color, rgba(0, 0, 0, 0.05)));
      }
      button:hover:not(:disabled) .icon {
        color: var(--text-primary);
      }
    }

    :host([active]) button {
      background: var(--btn-hover-bg, var(--hover-color, rgba(0, 0, 0, 0.05)));
    }
    :host([active]) .icon {
      color: var(--text-primary);
    }

    .icon {
      width: var(--btn-icon-size, 18px);
      height: var(--btn-icon-size, 18px);
      fill: currentColor;
      color: var(--btn-color, var(--text-muted));
      transition: color 0.2s;
    }

    .spinning .icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]}_handleAnimationIteration(){this.dispatchEvent(new Event(`animationiteration`,{bubbles:!0,composed:!0}))}render(){return a`
      <button 
        type="button"
        title=${this.title}
        aria-expanded=${this.expanded===void 0?e:String(this.expanded)}
        ?disabled=${this.disabled}
        class=${this.spinning?`spinning`:``}
        part="button"
        @animationiteration=${this._handleAnimationIteration}
      >
        ${this.icon?c(this.icon):a`<slot></slot>`}
      </button>
    `}};s([r({type:String})],l.prototype,`icon`,void 0),s([r({type:String})],l.prototype,`title`,void 0),s([r({type:Boolean})],l.prototype,`disabled`,void 0),s([r({type:Boolean,reflect:!0})],l.prototype,`active`,void 0),s([r({type:Boolean})],l.prototype,`spinning`,void 0),s([r({attribute:!1})],l.prototype,`expanded`,void 0),l=s([t(`alps-icon-btn`)],l);