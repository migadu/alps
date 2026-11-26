import{$ as e,Q as t,Z as n,_ as r,a as i,b as a,et as o,g as s,h as c,i as l,n as u,o as d,p as f,r as ee,s as p}from"./index-o54DStUh.js";import{_ as m,d as h,f as g,g as _,l as v,u as y,x as b,y as x}from"./lit-Drqu7DG3.js";import{a as S,d as C,f as w,n as T,p as E,t as D,u as O,x as k}from"./alps-button-DC-ocZ2C.js";import{n as A,o as j,p as M}from"./settings-store-C_JSnBeo.js";import{r as N}from"./alps-input-0xQoMf5U.js";import"./alps-icon-btn-CHsE0dSu.js";import{s as P}from"./address-display-DiiZG-zq.js";import{c as F,l as I,n as L,o as R}from"./fetch-utils-CrnODyIe.js";var z=`All Contacts`,B=`Favorites`,V=class extends _{constructor(...e){super(...e),this.contacts=[],this.uniqueCategories=[],this.selectedCategory=``,this.filterQuery=``,this.activeKebabMenu=null,this.sidebarScrolled=!1}static{this.styles=[T,r,s,b`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
      box-sizing: border-box;
      /* The collapsed strip's slide (sidebarLayoutStyles): a category's icon
         sits 22px in, after the content's 8px padding, the row's 8px and the
         icon's own 6px, so it slides 14px to stand 8px inside the strip. */
      --strip-slide: 14px;
    }
    .sidebar-wrapper {
      background-color: var(--bg-secondary, #f9fafb);
    }
    .sidebar-header {
      background-color: var(--bg-secondary, #f9fafb);
    }
    .sidebar-wrapper.collapsed .category-item {
      border-radius: 0;
      border-start-start-radius: 6px;
      border-end-start-radius: 6px;
    }
    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 8px;
    }
    .category-item {
      display: flex;
      align-items: center;
      position: relative;
      height: 36px;
      padding: 0 8px;
      box-sizing: border-box;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-primary);
      margin-bottom: 2px;
      user-select: none;
      transition: background 0.15s;
    }
    .category-item:hover {
      background: var(--hover-color, #e5e7eb);
    }
    .category-item.active {
      background: var(--bg-selected, #eff6ff);
      color: var(--accent-hover, #2563eb);
      font-weight: 600;
    }
    .category-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .category-actions {
      display: none;
      align-items: center;
      padding-inline-start: 8px;
      margin-inline-start: auto;
      margin-inline-end: -4px;
    }
    .category-badge {
      background: rgba(0,0,0,0.08);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
    }
    
    .category-item.active .category-badge {
      background: rgba(255,255,255,0.2);
    }

    @media (hover: hover) {
      .category-item:hover .category-actions {
        display: flex;
      }
      .category-item.has-actions:hover .category-badge {
        display: none;
      }
    }
    /* A touch screen has no hover, and a tap leaves no :focus-visible, so
       neither the rule above nor the keyboard's below ever showed a menu
       there, and a category could not be renamed or deleted. The selected
       category shows its menu, as the folder list's open folder does on a
       phone: a tap selects the category, a second opens its menu. */
    @media (hover: none) {
      .category-item.active .category-actions {
        display: flex;
      }
    }
    .category-actions:focus-within,
    .category-actions.popup-open {
      display: flex;
    }
    .category-actions:focus-within ~ .category-badge,
    .category-actions.popup-open ~ .category-badge {
      display: none;
    }
    /* The menu is shown while the keyboard is in its row, so that Tab
       reaches it from the category's button: a button inside display: none
       is no Tab stop, and so it could never take the focus that shows it.
       Not while a click has put the focus on the button: a click leaves the
       row as it was. */
    .category-item:focus-within:not(:has(.category-control:focus:not(:focus-visible))) .category-actions {
      display: flex;
    }
    .category-item.has-actions:focus-within:not(:has(.category-control:focus:not(:focus-visible))) .category-badge {
      display: none;
    }
    /* The part of the row that is its button: the icon and the name. The
       row's menu and count sit beside it, not in it. */
    .category-control {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      border-radius: 4px;
    }
    /* Drawn as alps-icon-btn draws its icon, without the button. */
    .category-icon {
      display: flex;
      padding: 6px;
      margin-inline-end: 8px;
      color: var(--text-muted);
    }
    .category-icon .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
  `]}selectCategory(e){this.dispatchEvent(new CustomEvent(`select-category`,{detail:{category:e}}))}handleControlKeyDown(e,t){(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.selectCategory(t))}handleSidebarScroll(e){let t=e.target.scrollTop>0;this.sidebarScrolled!==t&&(this.sidebarScrolled=t)}render(){return x`
      <!-- Frame and content follow the strip state alps-sidebar provides:
           collapsed, they keep every category, dimmed, inert and behind the
           main view. Create, above, stays live. -->
      <alps-sidebar-frame class="sidebar-wrapper">
        <alps-toolbar class="sidebar-header" ?scrolled=${this.sidebarScrolled}>
          <alps-create-button 
            icon="userPlus" 
            @click=${()=>this.dispatchEvent(new CustomEvent(`create-contact`))}
          >${this.i18nStore?.t(`contacts.addContact`)}</alps-create-button>
        </alps-toolbar>
        
        <!-- A navigation landmark named for the tab, so a screen reader's
             landmark list says what the list is and can jump to it. -->
        <alps-sidebar-content
          class="sidebar-content"
          role="navigation"
          aria-label=${this.i18nStore?.t(`navigation.contacts`)??`Contacts`}
          @scroll=${this.handleSidebarScroll}
        >
          <div class="sidebar-scroll-content">
            ${[z,B,...this.uniqueCategories.filter(e=>e!==B)].map((e,t)=>{let n=e===`All Contacts`?this.contacts.length:this.contacts.filter(t=>t.categories&&t.categories.includes(e)).length,r=e===`All Contacts`||e===`Favorites`,i=e===`All Contacts`?this.i18nStore?.t(`contacts.allContacts`):e===`Favorites`?this.i18nStore?.t(`contacts.favorites`):e,a=e===`All Contacts`?!this.selectedCategory&&!this.filterQuery:this.selectedCategory===e,o=n>0||e===`Favorites`,s=`category-count-${t}`;return x`
                <div class="category-item ${a?`active`:``} ${r?``:`has-actions`}"
                  @click=${()=>this.selectCategory(e)}
                  draggable=${r?`false`:`true`}
                  @dragstart=${t=>{r||(t.dataTransfer?.setData(`text/plain`,e),this.dispatchEvent(new CustomEvent(`drag-start`,{detail:{category:e}})))}}
                  @dragend=${()=>{r||this.dispatchEvent(new CustomEvent(`drag-end`))}}
                >
                  <!--
                    The category's button: one Tab stop, named by the category,
                    with its count as the description. Not the whole row, which
                    also holds the category's menu, and a button may not contain
                    other controls. Its icon is decoration.
                  -->
                  <span class="category-control"
                    role="button"
                    tabindex="0"
                    aria-label=${i??e}
                    aria-current=${a?`true`:m}
                    aria-describedby=${o?s:m}
                    @keydown=${t=>this.handleControlKeyDown(t,e)}
                  >
                    <span class="category-icon">${k(e===`All Contacts`?`users`:e===`Favorites`?`starFourFill`:`folderUser`)}</span>
                    <span class="category-name"><bdi>${i}</bdi></span>
                  </span>
                  
                  ${r?``:x`
                    <div class="category-actions ${this.activeKebabMenu===e?`popup-open`:``}" @click=${e=>e.stopPropagation()}>
                      <alps-popup 
                        align="end" 
                        position="bottom"
                        @popup-open=${()=>{this.activeKebabMenu=e}}
                        @popup-close=${()=>{this.activeKebabMenu===e&&(this.activeKebabMenu=null)}}
                      >
                        <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical" title=${this.i18nStore?.t(`general.moreOptions`)}></alps-icon-btn>
                        <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.dispatchEvent(new CustomEvent(`rename-category`,{detail:{category:e}}))}}>
                          ${k(`pen`)} <span class="item-text">${this.i18nStore?.t(`contacts.rename`)}</span>
                        </button>
                        <button class="dropdown-item text-danger" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.dispatchEvent(new CustomEvent(`delete-category`,{detail:{category:e}}))}}>
                          ${k(`trash`)} <span class="item-text">${this.i18nStore?.t(`contacts.delete`)}</span>
                        </button>
                      </alps-popup>
                    </div>
                  `}

                  ${o?x`<div class="category-badge" id=${s}>${n}</div>`:``}
                </div>
              `})}
          </div>
        </alps-sidebar-content>
      </alps-sidebar-frame>
    `}};D([g({context:S})],V.prototype,`i18nStore`,void 0),D([y({type:Array})],V.prototype,`contacts`,void 0),D([y({type:Array})],V.prototype,`uniqueCategories`,void 0),D([y({type:String})],V.prototype,`selectedCategory`,void 0),D([y({type:String})],V.prototype,`filterQuery`,void 0),D([v()],V.prototype,`activeKebabMenu`,void 0),D([v()],V.prototype,`sidebarScrolled`,void 0),V=D([h(`alps-contacts-categories`)],V);var H=class extends _{constructor(...e){super(...e),this.contacts=[],this.selectedCategory=``,this.filterQuery=``,this.sortOrder=`asc`,this.showOnlyStarred=!1,this.isMobile=!1,this.densityMode=`compact`,this.selectedContacts=new Set,this.selectedContact=null,this.isSpinning=!1,this.loading=!1,this.listScrolled=!1,this.focusedIndex=-1}getFilteredContacts(){let e=this.contacts.filter(e=>{if(this.selectedCategory&&(!e.categories||!e.categories.includes(this.selectedCategory))||this.showOnlyStarred&&(!e.categories||!e.categories.includes(`Favorites`)))return!1;if(this.filterQuery){let t=this.filterQuery.toLowerCase(),n=(e.email||``).toLowerCase().includes(t)||e.emails&&e.emails.some(e=>(e.value||``).toLowerCase().includes(t)),r=(e.phone||``).toLowerCase().includes(t)||e.phones&&e.phones.some(e=>(e.value||``).toLowerCase().includes(t));if(!(e.name||``).toLowerCase().includes(t)&&!n&&!r&&!(e.nickname||``).toLowerCase().includes(t)&&!(e.organization||``).toLowerCase().includes(t))return!1}return!0});return e.sort((e,t)=>{let n=(e.name||e.email||``).toLowerCase(),r=(t.name||t.email||``).toLowerCase();return n<r?this.sortOrder===`asc`?-1:1:n>r?this.sortOrder===`asc`?1:-1:0}),e}willUpdate(e){if(super.willUpdate(e),e.has(`selectedContact`)||e.has(`contacts`)||e.has(`selectedCategory`)||e.has(`filterQuery`)||e.has(`sortOrder`)||e.has(`showOnlyStarred`)){let e=this.getFilteredContacts();if(this.selectedContact&&e.length>0){let t=e.findIndex(e=>e.path===this.selectedContact.path);this.focusedIndex=t===-1?-1:t}else this.focusedIndex=-1}}updated(e){super.updated(e),e.has(`densityMode`)&&(this.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),this.classList.add(`density-${this.densityMode}`))}static{this.styles=[T,f.styles,b`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      height: 100%;
    }
    .list-header {
      padding: 0 12px;
      gap: 12px;
      background: var(--bg-primary, #fff);
      z-index: 10;
      min-height: 48px;
    }
    .header-divider {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 4px;
    }
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted, #9ca3af);
    }
    .contact-item {
      padding: 12px;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: background 0.15s, padding 0.2s, gap 0.2s;
    }
    :host(.density-loose) .contact-item {
      padding-block: 16px;
      padding-inline: 0 12px;
      gap: 16px;
    }
    :host(.density-compact) .contact-item {
      padding-block: 8px;
      padding-inline: 0 12px;
      gap: 12px;
    }
    :host(.density-ultra-compact) .contact-item {
      padding-block: 4px;
      padding-inline: 0 12px;
      gap: 12px;
    }
    @media (max-width: 768px) {
      :host(.density-ultra-compact) .contact-item,
      :host(.density-compact) .contact-item {
        padding: 12px;
      }
      :host(.density-loose) .contact-item {
        padding: 16px 12px;
      }
    }
    .contact-item:hover {
      background: var(--hover-color);
    }
    .contact-item.active {
      background: var(--bg-selected);
    }
    .contact-item.starred .contact-sender,
    .contact-item.starred .contact-subject {
      color: var(--accent-color);
      font-weight: 600;
    }
    .list-content:focus {
      outline: none;
    }
    .list-content:focus-within .contact-item.focused {
      outline: 2px solid var(--accent-color);
      outline-offset: -2px;
      z-index: 10;
      position: relative;
    }
    .contact-item.active .avatar-wrapper {
      border-color: var(--bg-selected);
      background: var(--bg-selected);
    }
    .contact-item:hover .avatar-wrapper {
      border-color: var(--hover-color);
      background: var(--hover-color);
    }
    .contact-checkbox {
      cursor: pointer;
      opacity: 0.4;
      transition: opacity 0.2s;
    }
    .contact-item:hover .contact-checkbox,
    .contact-checkbox:checked {
      opacity: 1;
    }
    .contact-details {
      flex: 1;
      min-width: 0;
    }
    .contact-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    :host(.density-compact) .contact-header-row {
      margin-bottom: 2px;
    }
    .contact-header-inner {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
      margin-inline-end: 12px;
    }
    .contact-sender {
      font-weight: 450;
      color: var(--text-sender-read, #202020);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    :host(.density-ultra-compact) .contact-sender {
      width: 120px;
      flex-shrink: 1;
      min-width: 80px;
    }
    @media (max-width: 768px) {
      :host(.density-ultra-compact) .contact-sender {
        width: 80px;
        min-width: 60px;
      }
    }
    .contact-date {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      margin-inline-start: 8px;
      text-align: end;
      flex-shrink: 0;
    }
    .contact-item.active .contact-date {
      color: var(--text-muted);
    }
    .contact-subject-row {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      overflow: hidden;
    }
    .contact-subject {
      font-size: 14px;
      margin-bottom: 0;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    :host(.density-compact) .contact-subject {
      font-size: 13px;
      margin-bottom: 2px;
    }
    :host(.density-ultra-compact) .contact-subject {
      font-size: 13px;
      flex: 1;
      margin: 0;
    }
  `]}formatRevision(e){if(!e)return``;let t=e;t.length===16&&t.indexOf(`-`)===-1&&(t=`${t.slice(0,4)}-${t.slice(4,6)}-${t.slice(6,8)}T${t.slice(9,11)}:${t.slice(11,13)}:${t.slice(13,16)}`);let n=this.settingsStore?.getState()?.dateFormat||`auto`,r=String(this.settingsStore?.getState()?.hourFormat||`auto`);return C(new Date(t),n,r)}handleKeyDown(e){let t=this.getFilteredContacts();if(t.length!==0){if(e.key===`ArrowDown`)e.preventDefault(),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused();else if(e.key===`ArrowUp`)e.preventDefault(),this.focusedIndex=Math.max(0,this.focusedIndex-1),this.scrollToFocused();else if(e.key===`Enter`)e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length&&this.dispatchEvent(new CustomEvent(`select-contact`,{detail:{contact:t[this.focusedIndex]}}));else if(e.key===` `&&(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length)){let n=t[this.focusedIndex];n.isTemporary||this.dispatchEvent(new CustomEvent(`toggle-selection`,{detail:{path:n.path,event:e}})),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused()}}}scrollToFocused(){this.updateComplete.then(()=>{let e=this.renderRoot.querySelector(`.contact-item.focused`);e&&e.scrollIntoView({block:`nearest`})})}handleListScroll(e){let t=e.target.scrollTop>0;this.listScrolled!==t&&(this.listScrolled=t,this.dispatchEvent(new CustomEvent(`list-scrolled`,{detail:{scrolled:t}})))}render(){let e=this.getFilteredContacts(),t=e.filter(e=>e.path&&!e.isTemporary),n=t.length>0&&t.every(e=>this.selectedContacts.has(e.path));return x`
      ${this.isMobile?``:x`
        <alps-toolbar class="list-header" ?scrolled=${this.listScrolled}>
          <input type="checkbox" class="select-all-checkbox" title=${this.i18nStore?.t(`messageList.selectAll`)}
            .checked=${n}
            @change=${e=>this.dispatchEvent(new CustomEvent(`select-all`,{detail:{checked:e.target.checked,paths:t.map(e=>e.path)}}))}>
          <alps-icon-btn 
            title="${this.i18nStore?.t(`contacts.refreshContacts`)}"
            @click=${()=>this.dispatchEvent(new CustomEvent(`refresh`))}
            @animationiteration=${()=>this.dispatchEvent(new CustomEvent(`spin-iteration`))}
            ?spinning=${this.isSpinning}
            icon="arrowsClockwise"
          ></alps-icon-btn>
          <div class="header-divider"></div>
          <alps-icon-btn 
            title=${this.sortOrder===`asc`?this.i18nStore?.t(`contacts.sortZa`):this.i18nStore?.t(`contacts.sortAz`)}
            @click=${()=>this.dispatchEvent(new CustomEvent(`sort-toggle`))} 
            icon=${this.sortOrder===`asc`?`sortAscending`:`sortDescending`}
          ></alps-icon-btn>
          <alps-icon-btn 
            @click=${()=>this.dispatchEvent(new CustomEvent(`filter-star-toggle`))} 
            title="${this.i18nStore?.t(`contacts.filterStarred`)}"
            icon=${this.showOnlyStarred?`starFourFill`:`starFour`}
            ?active=${this.showOnlyStarred}
          ></alps-icon-btn>
        </alps-toolbar>
      `}
      
      <div class="list-content" tabindex="0" @keydown=${this.handleKeyDown} @scroll=${this.handleListScroll} style="flex: 1; overflow-y: auto; transition: opacity 0.2s ease-in-out; opacity: ${this.loading&&this.contacts.length>0?.5:1}; pointer-events: ${this.loading?`none`:`auto`};">
        ${this.loading&&this.contacts.length===0?x`<alps-loader full-height .text=${this.i18nStore?.t(`messageList.loading`)}></alps-loader>`:x`
              ${this.filterQuery?x`
                <alps-banner>
                  <span>${this.i18nStore?.t(`messageList.searchResultsFor`)} <strong>${this.filterQuery}</strong></span>
                  <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`clear-search`))}>
                    ${this.i18nStore?.t(`messageList.clearSearch`)}
                  </alps-button>
                </alps-banner>
              `:``}
              
              ${e.length===0?x`<div class="empty-state">${this.i18nStore?.t(`contacts.noContacts`)}</div>`:e.map((e,t)=>x`
                  <div class="contact-item ${this.selectedContact?.path===e.path||e.isTemporary&&this.selectedContact?.isTemporary?`active`:``} ${this.selectedContacts.has(e.path)?`selected`:``} ${this.focusedIndex===t?`focused`:``}" @click=${()=>this.dispatchEvent(new CustomEvent(`select-contact`,{detail:{contact:e}}))}>
                    ${this.isMobile?``:x`
                      <div class="checkbox-col" @click=${t=>{e.isTemporary?t.stopPropagation():this.dispatchEvent(new CustomEvent(`toggle-selection`,{detail:{path:e.path,event:t}}))}}>
                        <input type="checkbox" class="contact-checkbox" 
                          ?disabled=${e.isTemporary}
                          .checked=${this.selectedContacts.has(e.path)}
                          @click=${e=>e.stopPropagation()}
                          @change=${t=>this.dispatchEvent(new CustomEvent(`toggle-selection`,{detail:{path:e.path,event:t}}))}>
                      </div>
                    `}
                    <div class="avatar-stack">
                      <div class="avatar-wrapper">
                        <alps-avatar .name=${e.name||e.email||`Unknown`} .email=${e.email} .src=${e.avatar||``} .size=${this.densityMode===`loose`?48:this.densityMode===`compact`?24:40}></alps-avatar>
                      </div>
                    </div>
                    <div class="contact-details">
                      <div class="contact-header-row">
                        <div class="contact-header-inner">
                          <div class="contact-sender"><bdi>${e.name||e.email||this.i18nStore?.t(`contacts.unnamedContact`)}</bdi></div>
                          <div @click=${t=>{t.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-star`,{detail:{contact:e}}))}} class="star-btn ${e.categories?.includes(`Favorites`)?`starred`:``}" style="${e.isTemporary?`opacity: 0.5; pointer-events: none;`:``}">
                            ${k(e.categories?.includes(`Favorites`)?`starFourFill`:`starFour`)}
                          </div>
                        </div>
                        ${e.revision?x`<div class="contact-date">${this.formatRevision(e.revision)}</div>`:``}
                      </div>
                      <div class="contact-subject-row">
                        <div class="contact-subject">
                          ${this.densityMode===`ultra-compact`?``:e.email||``}
                        </div>
                      </div>
                    </div>
                  </div>
                `)}
            `}
      </div>
    `}};D([g({context:S})],H.prototype,`i18nStore`,void 0),D([g({context:j})],H.prototype,`settingsStore`,void 0),D([y({type:Array})],H.prototype,`contacts`,void 0),D([y({type:String})],H.prototype,`selectedCategory`,void 0),D([y({type:String})],H.prototype,`filterQuery`,void 0),D([y({type:String})],H.prototype,`sortOrder`,void 0),D([y({type:Boolean})],H.prototype,`showOnlyStarred`,void 0),D([y({type:Boolean})],H.prototype,`isMobile`,void 0),D([y({type:String})],H.prototype,`densityMode`,void 0),D([y({type:Object})],H.prototype,`selectedContacts`,void 0),D([y({type:Object})],H.prototype,`selectedContact`,void 0),D([y({type:Boolean})],H.prototype,`isSpinning`,void 0),D([y({type:Boolean})],H.prototype,`loading`,void 0),D([y({type:Boolean})],H.prototype,`listScrolled`,void 0),D([v()],H.prototype,`focusedIndex`,void 0),H=D([h(`alps-contacts-list`)],H);var U={street:`contacts.addressStreet`,extended:`contacts.addressExtended`,po_box:`contacts.addressPoBox`,locality:`contacts.addressCity`,region:`contacts.addressRegion`,postal_code:`contacts.addressPostcode`,country:`contacts.addressCountry`};function W(e,t,n){let r=new Date(2e3,0,1);return r.setFullYear(e,t-1,n),r.getMonth()===t-1&&r.getDate()===n?r:null}function G(e){let t=/^(?:--|0000-?)(\d{2})-?(\d{2})(?:T.*)?$/.exec(e);if(t){let[e,n]=[Number(t[1]),Number(t[2])];return W(2e3,e,n)?{month:e,day:n}:null}let n=/^(\d{4})-?(\d{2})-?(\d{2})(?:T.*)?$/.exec(e);if(!n)return null;let[r,i,a]=[Number(n[1]),Number(n[2]),Number(n[3])];return W(r,i,a)?{year:r,month:i,day:a}:null}function K(e){let t=G(e);return{day:t?String(t.day):``,month:t?String(t.month):``,year:t?.year===void 0?``:String(t.year).padStart(4,`0`)}}function q({day:e,month:t,year:n}){if(n=n.trim(),!e&&!t&&!n)return``;if(!e||!t||n&&!/^\d{4}$/.test(n))return null;let[r,i]=[t.padStart(2,`0`),e.padStart(2,`0`)];return n?W(Number(n),Number(t),Number(e))?`${n}-${r}-${i}`:null:W(2e3,Number(t),Number(e))?`--${r}${i}`:null}var J=class extends _{constructor(...e){super(...e),this.contact=null,this.isEditing=!1,this.saving=!1,this.uniqueCategories=[],this.isMobile=!1,this.selectedCount=0,this.allSelectedStarred=!1,this.scrolled=!1,this.editForm={},this.birthday={day:``,month:``,year:``},this.isDirty=!1,this.newCategoryName=``,this.saveTimeout=null,this.pendingSave=null,this.editUsername=``}handleAddCategory(){let e=this.newCategoryName.trim();if(e){this.dispatchEvent(new CustomEvent(`update-categories`,{detail:{category:e},bubbles:!0,composed:!0})),this.newCategoryName=``;let t=this.shadowRoot?.querySelector(`alps-popup`);t&&t.close()}}static{this.styles=[T,r,b`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-primary, #ffffff);
    }
    
    .toolbar {
      padding: 0 16px;
      gap: 12px;
      background: var(--bg-primary, #fff);
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      z-index: 10;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .toolbar-separator {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 8px;
    }
    
    .desktop-only {
      display: block;
    }
    @media (max-width: 768px) {
      .desktop-only {
        display: none !important;
      }
    }

    .content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted, #9ca3af);
    }

    /* Decoration, drawn as alps-icon-btn draws its icon, without the button. */
    .selection-icon {
      display: flex;
      padding: 6px;
      margin-inline-end: 8px;
    }

    .selection-icon .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .contact-detail-header {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 24px;
      text-align: center;
    }
    .contact-detail-email {
      font-size: 16px;
      color: var(--text-secondary, #4b5563);
      margin-bottom: 24px;
    }
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 400px;
      width: 100%;
      margin: 0 auto;
    }
    .edit-textarea {
      width: 100%;
      min-height: 80px;
      padding: 8px 12px;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      box-sizing: border-box;
    }
    .multi-field-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .multi-field-row alps-input {
      flex: 1;
    }
    .birthday-label, .address-label {
      font-size: 13px;
      color: var(--text-secondary, #4b5563);
      margin-bottom: 6px;
    }
    .address-fields {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .birthday-fields > * {
      flex: 1;
      min-width: 0;
    }
    .birthday-fields .birthday-month {
      flex: 2;
    }
    .multi-field-type {
      height: 36px;
      padding: 0 8px;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--input-radius, 6px);
      color: var(--text-primary, #111827);
      font-size: 13px;
      outline: none;
      cursor: pointer;
    }
    /* Focus as alps-select shows it. The transparent outline paints nothing
       here; forced colors, which drop the border colour and the shadow, give
       it a system colour. */
    .multi-field-type:focus,
    .new-category-input:focus {
      border-color: var(--accent-color, #005A9E);
      box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
      outline: 2px solid transparent;
    }
    .new-category-input {
      flex: 1;
      min-width: 0;
      padding: 4px 8px;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 4px;
      color: var(--text-primary);
      font-size: 13px;
      outline: none;
    }
    .add-field-btn {
      align-self: flex-start;
      background: none;
      border: none;
      color: var(--link-color, var(--primary, #2563eb));
      font-size: 13px;
      cursor: pointer;
      padding: 2px 4px;
      margin-top: -8px;
      margin-bottom: 4px;
    }
    .add-field-btn:hover {
      text-decoration: underline;
    }
    .view-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 32px;
    }
    .view-name {
      font-size: 24px;
      font-weight: 600;
      margin-top: 16px;
      margin-bottom: 4px;
      text-align: center;
      color: var(--text-primary);
    }
    .view-organization {
      font-size: 14px;
      color: var(--text-secondary, #6b7280);
      margin-bottom: 12px;
      text-align: center;
    }
    .view-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }
    .category-pill {
      background: var(--bg-selected, #eff6ff);
      color: var(--accent-hover, #2563eb);
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    .view-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 400px;
      width: 100%;
      margin: 0 auto;
    }
    .detail-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .detail-group:not(:last-child) {
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      padding-bottom: 16px;
    }
    .group-label {
      font-size: 11px;
      font-weight: 400;
      color: var(--text-muted, #9ca3af);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .group-value {
      font-size: 15px;
      color: var(--text-primary);
      word-break: break-word;
      white-space: pre-wrap;
    }
    .group-value a {
      color: var(--accent-hover, #2563eb);
      text-decoration: none;
    }
    .group-value a:hover {
      text-decoration: underline;
    }
    .view-categories alps-button {
      --btn-padding: 2px 8px;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]}updated(e){if(e.has(`contact`)||e.has(`isEditing`)){let t=e.has(`isEditing`)&&this.isEditing,n=!t&&this.isEditing&&e.get(`contact`)?.isTemporary&&this.contact&&!this.contact.isTemporary&&this.contact.path&&this.editForm&&!this.editForm.path;!n&&(e.has(`isEditing`)&&!this.isEditing||e.has(`contact`)&&e.get(`contact`)?.path!==this.contact?.path||e.get(`contact`)?.isTemporary&&this.contact?.isTemporary&&e.get(`contact`)!==this.contact)&&this.flushPendingSave(),n?this.editForm={...this.editForm,path:this.contact.path}:this.contact&&this.isEditing&&(t||!this.editForm||this.editForm.path!==this.contact.path)&&(this.editContact=this.contact,this.editUsername=A()??(this.settingsStore?.getState().loginUsername||``),this.editForm={...this.contact},this.birthday=K(String(this.editForm.birthday||``)),this.isDirty=!1,Array.isArray(this.editForm.emails)&&this.editForm.emails.length>0?this.editForm.emails=this.editForm.emails.map((e,t)=>({...e,id:e.id||`emails:${t}`})):this.editForm.email?this.editForm.emails=[{value:this.editForm.email,type:``,id:`emails:0`}]:this.editForm.emails=[{value:``,type:``,id:crypto.randomUUID()}],Array.isArray(this.editForm.phones)&&this.editForm.phones.length>0?this.editForm.phones=this.editForm.phones.map((e,t)=>({...e,id:e.id||`phones:${t}`})):this.editForm.phone?this.editForm.phones=[{value:this.editForm.phone,type:``,id:`phones:0`}]:this.editForm.phones=[{value:``,type:``,id:crypto.randomUUID()}])}}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.saveTimeout),this.pendingSave=null}flushPendingSave(){let e=this.pendingSave;this.pendingSave=null,clearTimeout(this.saveTimeout),this.saveTimeout=null,e?.()}debouncedSave(){this.saveTimeout&&clearTimeout(this.saveTimeout);let e=this.editForm,t=this.editContact,n=this.editUsername;this.pendingSave=()=>this.handleSave(e,t,n),this.saveTimeout=setTimeout(()=>this.flushPendingSave(),500)}handleInput(e,t){this.editForm={...this.editForm,[e]:t},this.isDirty=!0,this.debouncedSave()}handleAddressInput(e,t){this.handleInput(`address_parts`,{...this.editForm.address_parts,[e]:t})}handleBirthdayInput(e,t){this.birthday={...this.birthday,[e]:t};let n=q(this.birthday);n!==null&&n!==q(K(String(this.editForm.birthday||``)))&&this.handleInput(`birthday`,n)}handleMultiInput(e,t,n,r){let i=[...this.editForm[e]||[]];i[t]&&(i[t]={...i[t],[n]:r},this.editForm={...this.editForm,[e]:i,...e===`emails`?{email:i[0]?.value||``}:{phone:i[0]?.value||``}},this.isDirty=!0,this.debouncedSave())}addMultiField(e){let t=[...this.editForm[e]||[]];t.push({value:``,type:``,id:crypto.randomUUID()}),this.editForm={...this.editForm,[e]:t},this.requestUpdate()}removeMultiField(e,t){let n=[...this.editForm[e]||[]];n.splice(t,1),this.editForm={...this.editForm,[e]:n,...e===`emails`?{email:n[0]?.value||``}:{phone:n[0]?.value||``}},this.isDirty=!0,this.debouncedSave()}formatTypeLabel(e,t){if(!e)return t;let n=e.toLowerCase();return`${{home:this.i18nStore?.t(`contacts.typeHome`)||`Home`,work:this.i18nStore?.t(`contacts.typeWork`)||`Work`,other:this.i18nStore?.t(`contacts.typeOther`)||`Other`,cell:this.i18nStore?.t(`contacts.typeMobile`)||`Mobile`,mobile:this.i18nStore?.t(`contacts.typeMobile`)||`Mobile`}[n]||e.charAt(0).toUpperCase()+e.slice(1).toLowerCase()} ${t}`}handleSave(e=this.editForm,t=this.editContact,n=this.editUsername){clearTimeout(this.saveTimeout),this.saveTimeout=null,this.pendingSave=null,this.dispatchEvent(Object.assign(new CustomEvent(`save`,{detail:e,bubbles:!0,composed:!0}),{sourceContact:t,sourceUsername:n}))}renderDetailRow(e,t,n=!1,r=!1){if(!t)return``;let i=x`${t}`,a=`auto`;if(n||e===`Email Address`||e===`Email`||e.endsWith(`Email`)||e.endsWith(this.i18nStore?.t(`contacts.email`)||`Email`))i=x`<a href="mailto:${t}" @click=${e=>{e.preventDefault();let n=P(this.contact?.name,t);this.composeStore?.openComposer({to:[n]})}}>${t}</a>`,a=`ltr`;else if(r||e===`Phone`||e.endsWith(`Phone`)||e.endsWith(this.i18nStore?.t(`contacts.phone`)||`Phone`))i=x`<a href="tel:${t}">${t}</a>`,a=`ltr`;else if(e===`URL`){let e=t.startsWith(`http`)?t:`https://${t}`;i=x`<a href=${e} target="_blank" rel="noopener noreferrer">${t}</a>`,a=`ltr`}return x`
      <div class="detail-group">
        <div class="group-label">${e}</div>
        <div class="group-value" dir=${a}>${i}</div>
      </div>
    `}get isStarred(){return this.selectedCount>0?this.allSelectedStarred:this.contact?.categories?.includes(`Favorites`)||!1}get formattedBirthday(){if(!this.contact?.birthday)return``;let e=String(this.contact.birthday),t=this.settingsStore?.getState()?.dateFormat||`auto`,n=G(e);return n?n.year===void 0?E(n.month,n.day,t):w(W(n.year,n.month,n.day),t):e}get shownAddress(){let e=this.contact?.address_parts;return e?n.map(t=>(e[t]||``).trim()).filter(Boolean).join(`
`):this.contact?.address||``}renderAddress(){let e=e=>this.i18nStore?.t(e)||``,t=this.editForm.address_parts||{};return x`
      <div role="group" aria-labelledby="address-label">
        <div class="address-label" id="address-label">${e(`contacts.address`)}</div>
        <div class="address-fields">
          ${n.map(n=>x`
            <alps-input class="address-${n.replace(`_`,`-`)}" placeholder=${e(U[n])} label=${e(U[n])}
              .value=${t[n]||``} @input=${e=>this.handleAddressInput(n,e.target.value)}></alps-input>
          `)}
        </div>
      </div>
    `}renderBirthday(){let e=e=>this.i18nStore?.t(e)||``,t=new Intl.DateTimeFormat(this.i18nStore?.getIntlLanguage?.(),{month:`long`}),n=(e,t)=>Array.from({length:e},(e,n)=>({value:String(n+1),label:t(n+1)})),r=x`<alps-select class="birthday-day" label=${e(`contacts.birthdayDay`)} .value=${this.birthday.day}
      .options=${[{value:``,label:e(`contacts.birthdayDay`)},...n(31,String)]}
      @change=${e=>this.handleBirthdayInput(`day`,e.target.value)}></alps-select>`,i=x`<alps-select class="birthday-month" label=${e(`contacts.birthdayMonth`)} .value=${this.birthday.month}
      .options=${[{value:``,label:e(`contacts.birthdayMonth`)},...n(12,e=>t.format(new Date(2e3,e-1,1)))]}
      @change=${e=>this.handleBirthdayInput(`month`,e.target.value)}></alps-select>`,a={year:x`<alps-input class="birthday-year" placeholder=${e(`contacts.birthdayYear`)} label=${e(`contacts.birthdayYear`)} .value=${this.birthday.year}
      @input=${e=>this.handleBirthdayInput(`year`,e.target.value)}></alps-input>`,month:i,day:r},o=O(this.settingsStore?.getState()?.dateFormat||`auto`).map(e=>a[e]);return x`
      <div role="group" aria-labelledby="birthday-label">
        <div class="birthday-label" id="birthday-label">${e(`contacts.birthday`)}</div>
        <div class="multi-field-row birthday-fields">${o}</div>
      </div>
    `}render(){return!this.contact&&!this.isEditing&&this.selectedCount===0?x`
        <div class="empty-state">${this.i18nStore?.t(`contacts.selectContact`)}</div>
      `:x`
      <alps-toolbar class="toolbar" ?scrolled=${this.scrolled}>
        ${this.isMobile?x`
          <alps-icon-btn @click=${()=>this.dispatchEvent(new CustomEvent(`close`))} title="${this.i18nStore?.t(`contacts.back`)}" icon="arrowLeft"></alps-icon-btn>
          <div class="toolbar-separator"></div>
        `:``}

        <alps-icon-btn title="${this.i18nStore?.t(`contacts.delete`)}" @click=${()=>this.dispatchEvent(new CustomEvent(`delete`))} icon="trash" ?disabled=${this.contact?.isTemporary}></alps-icon-btn>
        
        <alps-popup align="end" @popup-close=${()=>{}}>
          <alps-icon-btn slot="trigger" title="${this.i18nStore?.t(`contacts.addToCategory`)}" icon="folderOpen" ?disabled=${this.contact?.isTemporary}></alps-icon-btn>
          
          <div style="padding: 8px; display: flex; gap: 8px; cursor: default; min-width: 200px;" @click=${e=>e.stopPropagation()}>
            <input
              type="text"
              class="new-category-input"
              placeholder="${this.i18nStore?.t(`contacts.newCategory`)||`New Category`}" 
              .value=${this.newCategoryName} 
              @input=${e=>this.newCategoryName=e.target.value}
              @keydown=${e=>{e.key===`Enter`&&!N(e)&&(e.preventDefault(),this.handleAddCategory())}}>
            <alps-button variant="normal" @click=${this.handleAddCategory} style="--btn-padding: 4px 12px; --btn-font-size: 13px;">${this.i18nStore?.t(`contacts.add`)||`Add`}</alps-button>
          </div>
          
          ${this.contact?.categories&&this.contact.categories.length>0||this.uniqueCategories.length>0?x`<div class="dropdown-divider"></div>`:``}

          ${this.uniqueCategories.map(e=>{let t=this.contact?.categories?.includes(e);return x`
              <button class="dropdown-item ${t?`active`:``}" @click=${t=>{t.stopPropagation(),this.dispatchEvent(new CustomEvent(`update-categories`,{detail:{category:e},bubbles:!0,composed:!0}))}}>
                ${t?k(`check`):x`<div style="width: 16px;"></div>`}
                <span class="item-text">${e}</span>
              </button>
            `})}

          ${this.contact?.categories&&this.contact.categories.length>0?x`
            ${this.uniqueCategories.length>0?x`<div class="dropdown-divider"></div>`:``}
            <button class="dropdown-item" @click=${()=>{this.dispatchEvent(new CustomEvent(`update-categories`,{detail:{category:``},bubbles:!0,composed:!0}));let e=this.shadowRoot?.querySelector(`alps-popup`);e&&e.close()}}>
              <span class="item-text" style="font-weight: 500;">${this.i18nStore?.t(`contacts.uncategorized`)}</span>
            </button>
          `:``}
        </alps-popup>

        <div class="toolbar-separator"></div>
        
        <alps-icon-btn 
          title="${this.i18nStore?.t(`contacts.toggleStar`)}" 
          @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-star`))} 
          icon=${this.isStarred?`starFourFill`:`starFour`}
          ?active=${this.isStarred}
          ?disabled=${this.contact?.isTemporary}
        ></alps-icon-btn>
        
        <div class="toolbar-spacer"></div>
        
        ${this.selectedCount>0?``:x`
          <alps-icon-btn 
            title=${this.isEditing?this.i18nStore?.t(`contacts.cancel`):this.i18nStore?.t(`contacts.editContact`)} 
            @click=${()=>{this.isEditing?(this.saveTimeout&&clearTimeout(this.saveTimeout),this.contact?.isTemporary&&!this.isDirty||this.handleSave(),this.dispatchEvent(new CustomEvent(`cancel-edit`))):this.dispatchEvent(new CustomEvent(`edit`))}} 
            icon="pen"
            ?active=${this.isEditing}
          ></alps-icon-btn>
        `}
      </alps-toolbar>

      <div class="content" @scroll=${e=>{let t=e.target.scrollTop>0;this.scrolled!==t&&(this.scrolled=t)}}>
        ${this.selectedCount>0?x`
          <div class="empty-state" style="flex-direction: column; gap: 16px;">
            <div class="selection-icon">${k(`users`)}</div>
            <span>${this.i18nStore?.t(`contacts.selectedContacts`,{count:this.selectedCount})}</span>
          </div>
        `:x`
        <div class="view-header">
          <alps-avatar .name=${this.isEditing?this.editForm.name||this.editForm.email||`Unknown`:this.contact?.name||this.contact?.email||`Unknown`} .email=${this.isEditing?this.editForm.email:this.contact?.email} .src=${this.contact?.avatar||``} .size=${100}></alps-avatar>
        </div>

        ${this.isEditing?x`
          <div class="edit-form">
            <alps-input 
              placeholder="${this.i18nStore?.t(`contacts.name`)}" 
              .value=${this.editForm.name||``} 
              @input=${e=>this.handleInput(`name`,e.target.value)}>
            </alps-input>
            <alps-input placeholder="${this.i18nStore?.t(`contacts.nickname`)}" .value=${this.editForm.nickname||``} @input=${e=>this.handleInput(`nickname`,e.target.value)}></alps-input>
            <alps-input placeholder="${this.i18nStore?.t(`contacts.organization`)}" .value=${this.editForm.organization||``} @input=${e=>this.handleInput(`organization`,e.target.value)}></alps-input>
            <alps-input placeholder="${this.i18nStore?.t(`contacts.titleField`)}" .value=${this.editForm.title||``} @input=${e=>this.handleInput(`title`,e.target.value)}></alps-input>

            ${(this.editForm.emails||[]).map((e,t)=>x`
              <div class="multi-field-row">
                <alps-input 
                  placeholder="${this.i18nStore?.t(`contacts.email`)}" 
                  type="email"
                  .value=${e.value||``} 
                  @input=${e=>this.handleMultiInput(`emails`,t,`value`,e.target.value)}>
                </alps-input>
                <select class="multi-field-type" .value=${e.type||``} @change=${e=>this.handleMultiInput(`emails`,t,`type`,e.target.value)}>
                  <option value="" ?selected=${!e.type}>${this.i18nStore?.t(`contacts.typeDefault`)||`Default`}</option>
                  <option value="home" ?selected=${e.type?.toLowerCase()===`home`}>${this.i18nStore?.t(`contacts.typeHome`)||`Home`}</option>
                  <option value="work" ?selected=${e.type?.toLowerCase()===`work`}>${this.i18nStore?.t(`contacts.typeWork`)||`Work`}</option>
                  <option value="other" ?selected=${e.type?.toLowerCase()===`other`}>${this.i18nStore?.t(`contacts.typeOther`)||`Other`}</option>
                </select>
                ${(this.editForm.emails||[]).length>1?x`
                  <alps-icon-btn icon="trash" @click=${()=>this.removeMultiField(`emails`,t)} title="${this.i18nStore?.t(`contacts.delete`)}"></alps-icon-btn>
                `:``}
              </div>
            `)}
            <button type="button" class="add-field-btn" @click=${()=>this.addMultiField(`emails`)}>
              + ${this.i18nStore?.t(`contacts.addEmail`)||`Add Email`}
            </button>

            ${(this.editForm.phones||[]).map((e,t)=>x`
              <div class="multi-field-row">
                <alps-input 
                  placeholder="${this.i18nStore?.t(`contacts.phone`)}" 
                  .value=${e.value||``} 
                  @input=${e=>this.handleMultiInput(`phones`,t,`value`,e.target.value)}>
                </alps-input>
                <select class="multi-field-type" .value=${e.type||``} @change=${e=>this.handleMultiInput(`phones`,t,`type`,e.target.value)}>
                  <option value="" ?selected=${!e.type}>${this.i18nStore?.t(`contacts.typeDefault`)||`Default`}</option>
                  <option value="cell" ?selected=${e.type?.toLowerCase()===`cell`||e.type?.toLowerCase()===`mobile`}>${this.i18nStore?.t(`contacts.typeMobile`)||`Mobile`}</option>
                  <option value="home" ?selected=${e.type?.toLowerCase()===`home`}>${this.i18nStore?.t(`contacts.typeHome`)||`Home`}</option>
                  <option value="work" ?selected=${e.type?.toLowerCase()===`work`}>${this.i18nStore?.t(`contacts.typeWork`)||`Work`}</option>
                  <option value="other" ?selected=${e.type?.toLowerCase()===`other`}>${this.i18nStore?.t(`contacts.typeOther`)||`Other`}</option>
                </select>
                ${(this.editForm.phones||[]).length>1?x`
                  <alps-icon-btn icon="trash" @click=${()=>this.removeMultiField(`phones`,t)} title="${this.i18nStore?.t(`contacts.delete`)}"></alps-icon-btn>
                `:``}
              </div>
            `)}
            <button type="button" class="add-field-btn" @click=${()=>this.addMultiField(`phones`)}>
              + ${this.i18nStore?.t(`contacts.addPhone`)||`Add Phone`}
            </button>

            ${this.renderAddress()}
            <alps-input placeholder="${this.i18nStore?.t(`contacts.url`)}" type="url" .value=${this.editForm.url||``} @input=${e=>this.handleInput(`url`,e.target.value)}></alps-input>
            ${this.renderBirthday()}
            <textarea class="edit-textarea" dir="auto" placeholder="${this.i18nStore?.t(`contacts.notes`)}" .value=${this.editForm.note||``} @input=${e=>this.handleInput(`note`,e.target.value)}></textarea>
            <textarea class="edit-textarea" dir="ltr" placeholder="${this.i18nStore?.t(`contacts.publicKey`)||`GPG Public Key Block`}" .value=${this.editForm.public_key||``} @input=${e=>this.handleInput(`public_key`,e.target.value)} style="font-family: monospace; white-space: pre;"></textarea>
          </div>
        `:x`
          <div class="view-header" style="margin-top: -32px;">
            <div class="view-name">
              ${this.contact.name||this.contact.email?M(this.contact.name,this.contact.email):this.i18nStore?.t(`contacts.unnamedContact`)||`Unnamed Contact`} ${this.contact.nickname?`(${this.contact.nickname})`:``}
            </div>
            ${this.contact.organization||this.contact.title?x`
              <div class="view-organization">
                <bdi>${[this.contact.title,this.contact.organization].filter(Boolean).join(`, `)}</bdi>
              </div>
            `:``}
            ${this.contact.categories&&this.contact.categories.length>0?x`
              <div class="view-categories">
                ${this.contact.categories.map(e=>x`<span class="category-pill"><bdi>${e}</bdi></span>`)}
              </div>
            `:``}
          </div>
          <div class="view-details">
            ${this.contact.emails&&this.contact.emails.length>0?this.contact.emails.map(e=>this.renderDetailRow(this.formatTypeLabel(e.type,this.i18nStore?.t(`contacts.email`)||`Email`),e.value,!0)):this.renderDetailRow(this.i18nStore?.t(`contacts.email`)||`Email`,this.contact.email,!0)}
            ${this.contact.phones&&this.contact.phones.length>0?this.contact.phones.map(e=>this.renderDetailRow(this.formatTypeLabel(e.type,this.i18nStore?.t(`contacts.phone`)||`Phone`),e.value,!1,!0)):this.renderDetailRow(this.i18nStore?.t(`contacts.phone`)||`Phone`,this.contact.phone,!1,!0)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.address`),this.shownAddress)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.birthday`),this.formattedBirthday)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.url`),this.contact.url)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.notes`),this.contact.note)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.publicKey`)||`Public Key`,this.contact.public_key)}
          </div>
        `}
        `}
      </div>
    `}};D([y({type:Object})],J.prototype,`contact`,void 0),D([y({type:Boolean})],J.prototype,`isEditing`,void 0),D([y({type:Boolean})],J.prototype,`saving`,void 0),D([y({type:Array})],J.prototype,`uniqueCategories`,void 0),D([y({type:Boolean})],J.prototype,`isMobile`,void 0),D([y({type:Number})],J.prototype,`selectedCount`,void 0),D([y({type:Boolean})],J.prototype,`allSelectedStarred`,void 0),D([v()],J.prototype,`scrolled`,void 0),D([g({context:S})],J.prototype,`i18nStore`,void 0),D([g({context:a})],J.prototype,`composeStore`,void 0),D([g({context:j,subscribe:!0})],J.prototype,`settingsStore`,void 0),D([v()],J.prototype,`editForm`,void 0),D([v()],J.prototype,`birthday`,void 0),D([v()],J.prototype,`isDirty`,void 0),D([v()],J.prototype,`newCategoryName`,void 0),J=D([h(`alps-contact-view`)],J);var Y=e=>`alps_contacts_categories_${e}`,X=`contacts_categories_cache`,Z=/^#\/contacts\/?([^\/]*)\/?(.*)$/,Q={delete:[`contacts.deleteUnconfirmed`,`contacts.deleteOneUnconfirmed`],update:[`contacts.updateUnconfirmed`,`contacts.updateOneUnconfirmed`]},$=class extends _{constructor(...e){super(...e),this.contacts=[],this.sortOrder=`asc`,this.showOnlyStarred=!1,this.loading=!0,this.isSpinning=!1,this.showInitialLoader=l(),this.selectedContact=null,this.filterQuery=``,this.isEditing=!1,this.saving=!1,this.selectedCategory=``,this.showCreatePrompt=!1,this.showDeleteConfirm=!1,this.addedCategories=[],this.sidebarWidth=250,this.listWidth=380,this.sidebarCollapsed=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.isSidebarDragging=!1,this.isPaneDragging=!1,this.densityMode=`compact`,this.selectedContacts=new Set,this.listScrolled=!1,this.categoryToRename=null,this.categoryToDelete=null,this.syncIntervalTimer=null,this.readEpoch=0,this.loadedQuery=``,this.wholeBook=[],this.wholeCardPath=null,this.cardRead=null,this.cardGeneration=0,this.mergedBook=null,this._handleSettingsChange=()=>{if(this.settingsStore){let e=this.settingsStore.getState();if(this.sidebarCollapsed=e.sidebarCollapsed,this.densityMode=e.densityMode||`compact`,this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null),e.checkMailInterval&&e.checkMailInterval>0){let t=e.checkMailInterval*60*1e3;this.syncIntervalTimer=setInterval(()=>{this.fetchContacts()},t)}}},this._handleWindowResize=()=>{this.isMobile=window.innerWidth<=768},this.restoringHash=!0,this.loadAddedCategories=()=>{try{localStorage.removeItem(X);let e=A(),t=e?JSON.parse(localStorage.getItem(Y(e))||`[]`):[];this.addedCategories=Array.isArray(t)?t:[];let n=e?JSON.parse(localStorage.getItem(Y(e)+`_pending`)||`[]`):[];this.pendingCategoryChanges=new Map(Array.isArray(n)?n.filter(e=>Array.isArray(e)&&typeof e[0]==`string`&&(typeof e[1]==`string`||e[1]===null)).map(([e,t])=>[e,t??void 0]):[])}catch{this.addedCategories=[],this.pendingCategoryChanges.clear()}},this._handleHashChange=()=>{p(window.location.hash)||this.readHash(window.location.hash)},this.listError=``,this.toolbarVersions=new Map,this.pendingCategoryChanges=new Map,this.queuedSaves=[],this.saveTargets=new WeakMap,this.saveActive=!0,this.saveLifetime=0,this.handleSaveOwnerChange=()=>{this.saveLifetime++,this.readEpoch++,this.goneCards.clear(),this.queuedSaves=[],this.saveTargets=new WeakMap,this.toolbarVersions.clear(),this.pendingCategoryChanges.clear(),this.loadAddedCategories()},this.saveRunning=!1,this.conflictedPath=null,this.gonePath=null,this.goneCards=new Set,this.stopResize=null,this.startResize=e=>{e.preventDefault(),this.stopResize?.(),this.isPaneDragging=!0;let t=e.clientX,n=this.listWidth,r=getComputedStyle(this).direction===`rtl`?-1:1,i=e=>{let i=(e.clientX-t)*r;this.listWidth=Math.max(250,Math.min(800,n+i))},a=()=>{this.stopResize=null,this.isPaneDragging=!1,window.removeEventListener(`mousemove`,i),window.removeEventListener(`mouseup`,a)};this.stopResize=a,window.addEventListener(`mousemove`,i),window.addEventListener(`mouseup`,a)}}static{this.styles=[T,u.styles,f.styles,r,b`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary, #ffffff);
      color: var(--text-primary);
      overflow: hidden;
      /* Not a scroll container: see the mailbox page's host. */
      overflow: clip;
    }
    .folder-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .contact-list-pane {
      background: var(--bg-primary, #ffffff);
      display: flex;
      flex-direction: column;
      position: relative;
      border-inline-end: 1px solid var(--border-color, #e5e7eb);
    }
    .resizer {
      background: transparent;
      position: relative;
      z-index: 25;
      flex-shrink: 0;
      width: 4px;
      margin: 0 -2px;
      cursor: col-resize;
    }
    .resizer::after {
      content: '';
      position: absolute;
      background: transparent;
      transition: background 0.2s;
      width: 3px;
      top: 0;
      bottom: 0;
      inset-inline-start: 1px;
    }
    .resizer:hover, .resizer.dragging {
      z-index: 9999;
    }
    .resizer:hover::after, .resizer.dragging::after {
      background: var(--accent-color, #005A9E);
      width: 3px;
      inset-inline-start: 0;
    }
    .app-container.collapsed .contact-list-pane {
      box-shadow: rgba(95, 95, 95, 0.1) calc(-4px * var(--ui-inline-direction, 1)) 0 4px -2px;
      z-index: 25;
      border-inline-start: 1px solid var(--border-color, #e5e7eb);
    }
    .contact-reader-pane {
      background: var(--bg-primary, #ffffff);
      padding: 0;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .contact-reader-pane alps-contact-view {
      flex: 1;
      width: 100%;
    }
    
    .app-container.mobile-view.reading .contact-list-pane {
      display: none !important;
    }
    .app-container.mobile-view:not(.reading) .contact-reader-pane {
      display: none !important;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted, #9ca3af);
    }
    .contact-detail-header {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .contact-detail-email {
      font-size: 16px;
      color: var(--text-secondary, #4b5563);
      margin-bottom: 24px;
    }
    .contact-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 400px;
    }
    .edit-textarea {
      width: 100%;
      min-height: 80px;
      padding: 8px 12px;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      box-sizing: border-box;
    }
    .contact-details-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .detail-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .detail-value {
      font-size: 14px;
      color: var(--text-primary);
      white-space: pre-wrap;
    }

  `]}updated(e){if(super.updated(e),e.has(`densityMode`)){let e=this.settingsStore?.getState().densityMode||`normal`;this.dataset.density=e;let t=this.shadowRoot?.querySelector(`.contact-list-pane`);t&&(t.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),t.classList.add(`density-${e}`))}}willUpdate(e){super.willUpdate(e),e.has(`loading`)&&this.loading&&(this.isSpinning=!0)}handleSpinIteration(){this.loading||(this.isSpinning=!1)}connectedCallback(){super.connectedCallback(),this.restoringHash=!0,this.saveActive=!0,this.showInitialLoader=l(),this.classList.add(`density-compact`),this.loadAddedCategories(),window.addEventListener(`alps-active-user-changed`,this.handleSaveOwnerChange),this.fetchContacts(),window.addEventListener(`resize`,this._handleWindowResize),window.addEventListener(`hashchange`,this._handleHashChange),this.settingsStore&&(this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._handleSettingsChange()),setTimeout(()=>{this.restoringHash&&this.readHash(i()??``)},0)}disconnectedCallback(){super.disconnectedCallback(),this.stopResize?.(),window.removeEventListener(`resize`,this._handleWindowResize),window.removeEventListener(`hashchange`,this._handleHashChange),window.removeEventListener(`alps-active-user-changed`,this.handleSaveOwnerChange),this.saveActive=!1,this.saveLifetime++,this.readEpoch++,this.goneCards.clear(),this.queuedSaves=[],this.saveTargets=new WeakMap,this.toolbarVersions.clear(),this.pendingCategoryChanges.clear(),this.settingsStore&&this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null)}saveAddedCategories(){let e=A();if(e)try{localStorage.setItem(Y(e),JSON.stringify(this.addedCategories)),localStorage.setItem(Y(e)+`_pending`,JSON.stringify([...this.pendingCategoryChanges]))}catch{}}readHash(e){this.contacts=this.contacts.filter(e=>!e.isTemporary);let t=e.match(Z);if(t){let e=t[1]?decodeURIComponent(t[1]):``,n=t[2]?decodeURIComponent(t[2]):``,r=e===`all`||!e?``:e;if(this.selectedCategory!==r&&(this.selectedCategory=r,this.selectedContacts=new Set,this.isMobile&&(this.mobileSidebarOpen=!1)),n){if((this.selectedContact?.uid?.replace(/^urn:uuid:/,``)||this.selectedContact?.path)!==n){if(this.contacts.length===0)return;let e=this.contacts.find(e=>(e.uid?.replace(/^urn:uuid:/,``)||e.path)===n);e&&this.selectContact(e,!1)}}else this.selectedContact=null,this.isEditing=!1}else this.selectedContact=null,this.isEditing=!1}writeHash(e,t){d(e)?this.readHash(e):window.location.hash!==e&&(t===`push`?window.location.hash=e:(history.replaceState(history.state,``,e),this._handleHashChange()))}listHash(){return`#/contacts/${encodeURIComponent(this.selectedCategory||`all`)}`}leaveDeletedCard(){i()?.match(Z)?.[2]&&this.writeHash(this.listHash(),`replace`)}get allContacts(){if(!this.loadedQuery)return this.contacts;let e=this.selectedContact,t=this.mergedBook;if(t&&t.contacts===this.contacts&&t.wholeBook===this.wholeBook&&t.open===e)return t.merged;let n=new Map(this.contacts.filter(e=>e.path).map(e=>[e.path,e]));e?.path&&!n.has(e.path)&&n.set(e.path,e);let r=new Set(this.wholeBook.map(e=>e.path)),i=[...this.contacts.filter(e=>!e.path||!r.has(e.path)),...this.wholeBook.map(e=>n.get(e.path)??e)];return this.mergedBook={contacts:this.contacts,wholeBook:this.wholeBook,open:e,merged:i},i}get uniqueCategories(){let e=new Set(this.addedCategories);for(let t of this.allContacts)if(t.categories)for(let n of t.categories)e.add(n);return Array.from(e).sort((e,t)=>e.localeCompare(t))}get username(){return this.settingsStore?.getState().loginUsername||``}async fetchContacts(){let t=++this.readEpoch;this.listError=``,this.loading=!0;try{let n=this.filterQuery,[r,a]=await Promise.all([e.fetchContacts(n),n?e.fetchContacts().catch(e=>(console.error(`Failed to read the whole address book beside a search`,e),null)):null]);if(t!==this.readEpoch)return;let o=this.isEditing&&this.selectedContact,s=o?.isTemporary?o:null;this.contacts=s?[s,...r.contacts||[]]:r.contacts||[],this.loadedQuery=n,n?a&&(this.wholeBook=a.contacts||[]):this.wholeBook=this.contacts,(!n||a)&&this.reconcileCategoryNames(this.wholeBook),this.restoringHash?(this.restoringHash=!1,o||this.readHash(i()??``)):o||this._handleHashChange()}catch(e){if(t!==this.readEpoch)return;this.listError=e instanceof L&&e.message===`carddav_not_configured`?`contacts.notConfigured`:`contacts.listLoadFailed`,this.listError!==`contacts.notConfigured`&&console.error(`Failed to fetch contacts`,e)}finally{t===this.readEpoch&&(this.loading=!1),this.showInitialLoader&&setTimeout(()=>{this.showInitialLoader=!1,ee()},100)}}clearSearch(){this.filterQuery&&(this.filterQuery=``,this.fetchContacts())}async selectContact(e,t=!0){if(e.isTemporary)this.selectedContact=e,this.isEditing=!0;else if(t){let t=this.selectedCategory?encodeURIComponent(this.selectedCategory):`all`,n=e.uid?.replace(/^urn:uuid:/,``)||e.path;this.writeHash(`#/contacts/${t}/${encodeURIComponent(n)}`,`push`)}else this.selectedContacts.size>0&&(this.selectedContacts=new Set),this.selectedContact?.path!==e.path&&(this.cardGeneration++,this.saving=!1,this.selectedContact={...e},this.wholeCardPath=null,this.isEditing=!1,this.conflictedPath=null,this.gonePath=null,await this.readOpenCard(e.path))}readOpenCard(t){let n=this.cardGeneration,r=this.saveLifetime,i=A()??this.username,a=()=>this.saveActive&&r===this.saveLifetime&&i===(A()??this.username);if(this.cardRead?.path===t&&this.cardRead.generation===n&&this.cardRead.lifetime===r&&this.cardRead.username===i)return this.cardRead.done;let o=(async()=>{try{let r=await e.fetchContact(t);if(!a())return!1;if(this.cardGeneration===n&&this.selectedContact?.path===r.path)return this.goneCards.delete(r.path),this.selectedContact=r,this.wholeCardPath=r.path,!0}catch(e){if(!a())return!1;e instanceof L&&e.status===404?this.cardGone(t,n):console.error(`Failed to fetch contact details`,e)}return!1})(),s={path:t,generation:n,lifetime:r,username:i,done:o};return this.cardRead=s,o.finally(()=>{this.cardRead===s&&(this.cardRead=null)}),o}cardGone(e,t){this.cardGeneration===t&&this.selectedContact?.path===e&&(this.selectedContact=null,this.isEditing=!1,this.leaveDeletedCard(),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`contacts.deletedElsewhere`),type:`info`,duration:5e3}}))),this.fetchContacts()}dropGone(e=[]){if(e.length===0)return;for(let t of e)this.goneCards.add(t);for(let t of this.queuedSaves)e.includes(t.target.contact.path)&&(t.target.gone=!0);let t=t=>!!t.path&&e.includes(t.path),n=this.wholeBook===this.contacts;this.contacts=this.contacts.filter(e=>!t(e)),this.wholeBook=n?this.contacts:this.wholeBook.filter(e=>!t(e)),e.some(e=>this.selectedContacts.has(e))&&(this.selectedContacts=new Set([...this.selectedContacts].filter(t=>!e.includes(t))));let r=this.selectedContact;r&&t(r)&&(this.isEditing?this.gonePath=r.path:(this.cardGeneration++,this.selectedContact=null,this.leaveDeletedCard())),this.fetchContacts()}get gestureTargets(){return this.selectedContacts.size>0?Array.from(this.selectedContacts):[this.selectedContact?.path].filter(Boolean)}findContact(e){return this.contacts.find(t=>t.path===e)??this.allContacts.find(t=>t.path===e)??(this.selectedContact?.path===e?this.selectedContact:void 0)}get allSelectedStarred(){if(this.selectedContacts.size===0)return!1;for(let e of this.selectedContacts){let t=this.findContact(e);if(!t||!t.categories?.includes(`Favorites`))return!1}return!0}async handleToggleStar(t,n){if(t.stopPropagation(),n.isTemporary)return;let r=this.contactWorkOwner(),i=n.categories?[...n.categories]:[];i.includes(`Favorites`)?i=i.filter(e=>e!==B):i.push(B),this.contacts=this.contacts.map(e=>e.path===n.path?{...e,categories:i}:e);try{let t=await e.updateCategories(n.path,i);if(!r())return;this.applyETags(t.etag?{[n.path]:t.etag}:void 0),this.selectedContact?.path===n.path&&(this.selectedContact={...this.selectedContact,categories:i})}catch(e){if(!r())return;if(R(e)){this.reportFailure(`contacts.deletedElsewhere`),this.dropGone([n.path]);return}console.error(`Failed to toggle star:`,e),this.reportFailure(I(e)?Q.update[1]:`contacts.starOneFailed`);let t=n.categories;this.contacts=this.contacts.map(e=>e.path===n.path?{...e,categories:t}:e),I(e)&&this.rereadCategories(n.path)}}async rereadCategories(t){let n=this.contacts.find(e=>e.path===t);try{let r=await e.fetchContact(t);if(!n||this.contacts.find(e=>e.path===t)!==n)return;let i={categories:r.categories??[],...r.etag?{etag:r.etag}:{}};this.contacts=this.contacts.map(e=>e.path===t?{...e,...i}:e),this.selectedContact?.path===t&&(this.selectedContact={...this.selectedContact,...i})}catch(e){console.error(`Failed to re-read a contact after a write that may have landed`,e)}}handleSelectAll(e){let t=e;if(t.detail?t.detail.checked:e.target.checked){if(Array.isArray(t.detail?.paths)){this.selectedContacts=new Set(t.detail.paths);return}let e=this.contacts.filter(e=>!(this.selectedCategory&&(!e.categories||!e.categories.includes(this.selectedCategory))||this.showOnlyStarred&&(!e.categories||!e.categories.includes(`Favorites`))));this.selectedContacts=new Set(e.map(e=>e.path))}else this.selectedContacts=new Set}handleSelectContact(e,t){e.stopPropagation();let n=new Set(this.selectedContacts);n.has(t)?n.delete(t):n.add(t),this.selectedContacts=n}handleCreateCategorySubmit(e){let t=e.detail.name?.trim();t&&(this.addedCategories.includes(t)||(this.addedCategories=[...this.addedCategories,t],this.saveAddedCategories())),this.showCreatePrompt=!1}handleCreateNew(){this.cardGeneration++,this.saving=!1,this.selectedContacts=new Set;let e={name:this.i18nStore?.t(`contacts.unnamedContact`),categories:this.selectedCategory?[this.selectedCategory]:[],isTemporary:!0,creation_id:crypto.randomUUID()};this.contacts=this.contacts.filter(e=>!e.isTemporary),this.contacts=[e,...this.contacts],this.selectedContact=e,this.isEditing=!0}async cardsCarrying(t){return(this.filterQuery?(await e.fetchContacts()).contacts||[]:this.contacts).filter(e=>e.path&&e.categories?.includes(t))}categoryHash(e){let t=i()?.match(Z)?.[2];return`#/contacts/${encodeURIComponent(e||`all`)}${t?`/${t}`:``}`}showWrittenCategories(e,t){let n=this.selectedContact?.path;if(!n||!t?.[n])return;let r=e.find(e=>e.path===n);r&&(this.selectedContact={...this.selectedContact,categories:r.categories})}reconcileCategoryNames(e){for(let[t,n]of this.pendingCategoryChanges){if(e.some(e=>e.categories?.includes(t)))continue;let r=n&&e.some(e=>e.categories?.includes(n))?n:``;this.pendingCategoryChanges.delete(t),this.addedCategories=[...new Set(this.addedCategories.flatMap(e=>e===t?r?[r]:[]:[e]))],this.saveAddedCategories();let i=new Map(e.map(e=>[e.path,e]));this.contacts=this.contacts.map(e=>i.has(e.path)?{...e,categories:i.get(e.path).categories}:e);let a=i.get(this.selectedContact?.path);a&&(this.selectedContact={...this.selectedContact,categories:a.categories}),this.selectedCategory===t&&(this.selectedCategory=r,this.writeHash(this.categoryHash(r),`replace`))}}async handleRenameCategorySubmit(t){let n=this.contactWorkOwner(),r=t.detail.name?.trim();if(!r||!this.categoryToRename||r===this.categoryToRename){this.categoryToRename=null;return}let i=this.categoryToRename;this.categoryToRename=null;let a;try{if(a=await this.cardsCarrying(i),!n())return}catch(e){if(!n())return;console.error(`Could not read the address book for a category change`,e),this.reportFailure(`contacts.categoryRenameOneFailed`);return}if(a.length>0){this.saving=!0;try{let t=a.map(e=>{let t=e.categories.map(e=>e===i?r:e);return{...e,categories:t}}),{total:o,done:s,failed:c,uncertain:l=0,etags:u,gonePaths:d=[]}=await e.bulkUpdateCategories(t);if(!n())return;if(this.applyETags(u),this.showWrittenCategories(t,u),c>0&&this.reportRefusals(`contacts.categoryRenameFailed`,`contacts.categoryRenameOneFailed`,{count:c-l,total:o,uncertain:l,gone:d.length}),this.dropGone(d),s===0&&l>0){this.pendingCategoryChanges.set(i,r),this.saveAddedCategories(),await this.fetchContacts();return}if(this.fetchContacts(),s===0)return;this.pendingCategoryChanges.delete(i),this.saveAddedCategories()}catch(e){if(!n())return;console.error(`Error renaming category`,e),this.fetchContacts();let t=a.length;this.reportRefusals(`contacts.categoryRenameFailed`,`contacts.categoryRenameOneFailed`,{count:t,total:t});return}finally{n()&&(this.saving=!1)}}this.addedCategories.includes(i)&&(this.addedCategories=this.addedCategories.map(e=>e===i?r:e),this.saveAddedCategories()),this.selectedCategory===i&&(this.selectedCategory=r,this.writeHash(this.categoryHash(r),`replace`))}async handleDeleteCategorySubmit(){let t=this.contactWorkOwner();if(!this.categoryToDelete)return;let n=this.categoryToDelete;this.categoryToDelete=null;let r;try{if(r=await this.cardsCarrying(n),!t())return}catch(e){if(!t())return;console.error(`Could not read the address book for a category change`,e),this.reportFailure(`contacts.categoryDeleteOneFailed`);return}if(r.length>0){this.saving=!0;try{let i=r.map(e=>{let t=e.categories.filter(e=>e!==n);return{...e,categories:t}}),{total:a,done:o,failed:s,uncertain:c=0,etags:l,gonePaths:u=[]}=await e.bulkUpdateCategories(i);if(!t())return;if(this.applyETags(l),this.showWrittenCategories(i,l),s>0&&this.reportRefusals(`contacts.categoryDeleteFailed`,`contacts.categoryDeleteOneFailed`,{count:s-c,total:a,uncertain:c,gone:u.length}),this.dropGone(u),o===0&&c>0){this.pendingCategoryChanges.set(n,void 0),this.saveAddedCategories(),await this.fetchContacts();return}if(this.fetchContacts(),o===0)return;this.pendingCategoryChanges.delete(n),this.saveAddedCategories()}catch(e){if(!t())return;console.error(`Error deleting category`,e),this.fetchContacts();let n=r.length;this.reportRefusals(`contacts.categoryDeleteFailed`,`contacts.categoryDeleteOneFailed`,{count:n,total:n});return}finally{t()&&(this.saving=!1)}}this.addedCategories.includes(n)&&(this.addedCategories=this.addedCategories.filter(e=>e!==n),this.saveAddedCategories()),this.selectedCategory===n&&(this.selectedCategory=``,this.writeHash(this.categoryHash(``),`replace`))}async handleEdit(){let e=this.selectedContact,t=this.cardGeneration;if(e&&!e.isTemporary&&this.wholeCardPath!==e.path){let n=await this.readOpenCard(e.path);if(this.cardGeneration!==t||this.selectedContact?.path!==e.path)return;if(!n){this.reportFailure(`contacts.loadFailed`);return}}this.isEditing=!0}handleCancelEdit(){this.isEditing=!1,this.selectedContact?.isTemporary?(this.cardGeneration++,this.selectedContact=null,this.contacts=this.contacts.filter(e=>!e.isTemporary),this.selectedCategory||this.writeHash(`#/contacts/all`,`push`)):this.selectedContact?.path&&this.selectedContact.path===this.gonePath?(this.gonePath=null,this.cardGeneration++,this.selectedContact=null,this.leaveDeletedCard()):this.selectedContact?.path&&this.selectedContact.path===this.conflictedPath&&(this.conflictedPath=null,this.rereadOpenContact())}async rereadOpenContact(){let t=this.selectedContact?.path;if(!t)return;let n=this.cardGeneration,r=this.contactWorkOwner();try{let i=await e.fetchContact(t);if(!r())return;this.cardGeneration===n&&this.selectedContact?.path===t&&!this.isEditing&&(this.selectedContact=i)}catch(e){if(!r())return;if(R(e)){this.cardGeneration===n&&this.selectedContact?.path===t&&this.isEditing?(this.reportFailure(`contacts.editDeletedElsewhere`),this.dropGone([t])):this.cardGone(t,n);return}console.error(`Failed to re-read the contact`,e)}this.fetchContacts()}applyETags(e){if(!e||Object.keys(e).length===0)return;for(let[t,n]of Object.entries(e))this.toolbarVersions.set(t,{etag:n});this.contacts=this.contacts.map(t=>e[t.path]?{...t,etag:e[t.path]}:t);let t=this.selectedContact?.path;t&&e[t]&&(this.selectedContact={...this.selectedContact,etag:e[t]})}ownsSave(e){return e.lifetime===this.saveLifetime&&e.username===(A()??this.username)}contactWorkOwner(){let e=this.saveLifetime,t=A()??this.username;return()=>this.saveActive&&e===this.saveLifetime&&t===(A()??this.username)}showingSave(e){return this.ownsSave(e)&&e.generation===this.cardGeneration&&!!this.selectedContact&&(this.selectedContact===e.original||this.selectedContact.path===e.contact.path)}saveFoundGone(e,t){e.gone=!0;let n=this.showingSave(e)&&this.isEditing;this.reportFailure(n?`contacts.editDeletedElsewhere`:`contacts.deletedElsewhere`),this.dropGone([t])}async handleSave(e,t=this.selectedContact){if(!t||!this.saveActive||t.path&&this.goneCards.has(t.path))return;let n=this.saveTargets.get(t);if(!n||!this.ownsSave(n)){let e=this.selectedContact&&(this.selectedContact===t||t.path&&t.path===this.selectedContact.path);n={contact:{...e?this.selectedContact:t},original:t,generation:e?this.cardGeneration:-1,lifetime:this.saveLifetime,username:A()??this.username,conflicted:!1,toolbarVersion:this.toolbarVersions.get(t.path),creationId:t.isTemporary?t.creation_id||crypto.randomUUID():void 0},this.saveTargets.set(t,n)}!this.saveRunning&&this.showingSave(n)&&(n.contact={...this.selectedContact},n.toolbarVersion=this.toolbarVersions.get(n.contact.path)),e={...e};for(let t of[`emails`,`phones`])Array.isArray(e[t])&&(e[t]=e[t].map(e=>({...e})));e.address_parts&&(e.address_parts={...e.address_parts});let r=this.queuedSaves.find(e=>e.target===n);if(r?r.payload=e:this.queuedSaves.push({payload:e,target:n}),!this.saveRunning){this.saveRunning=!0;try{for(;this.queuedSaves.length;){let e=this.queuedSaves.shift();this.ownsSave(e.target)&&await this.saveOnce(e.payload,e.target)}}finally{this.saveRunning=!1}}}async saveOnce(t,n){if(n.gone||this.goneCards.has(n.contact.path)||n.unconfirmed&&!await this.reconcileSave(n))return;let r=this.toolbarVersions.get(n.contact.path);r&&r!==n.toolbarVersion&&(n.contact={...n.contact,etag:r.etag},n.toolbarVersion=r);let i=n.contact,a=n.toolbarVersion,s=!i.isTemporary;if(!(n.conflicted||n.gone||s&&(this.conflictedPath===i.path||this.gonePath===i.path))){this.showingSave(n)&&(this.saving=!0);try{s?delete t.categories:t.categories=Array.isArray(t.categories)?t.categories:[];let r;if(s){let n=[`organization`,`title`,`note`,`url`,`nickname`,`public_key`,`address`].filter(e=>e===`address`&&t.address_parts?!o(t.address_parts,i.address_parts):String(t[e]||``).trim()!==String(i[e]||``).trim()),a=Object.fromEntries(n.map(e=>[e,String(i[e]||``)])),s={...t,changed_fields:n,changed_from:a,etag:i.etag,...t.address_parts&&{address_parts_from:i.address_parts??{}}};for(let e of[`emails`,`phones`]){let n=t[e];if(!Array.isArray(n)||n.some(e=>!e.id))continue;let r=e===`emails`?`email`:`phone`,a=(i[e]||(i[r]?[{value:i[r]}]:[])).filter(e=>String(e.value||``).trim());s[e]=n.map(t=>({value:t.value,type:t.type,source_index:a.findIndex((n,r)=>(n.id||`${e}:${r}`)===t.id)}))}r=await e.updateContact(i.path,s)}else r=await e.createContact({...t,allow_duplicate:!0,creation_id:n.creationId,...t.address_parts&&{address_parts_from:{}}});if(s&&this.goneCards.has(i.path))return;let c={...i,...t,path:r.path||(s?i.path:``),etag:r.etag};if(delete c.isTemporary,s){c.categories=this.findContact(i.path)?.categories??i.categories;let e=this.toolbarVersions.get(i.path);e&&e!==a&&(c.etag=e.etag)}let l=this.showingSave(n);if(n.contact=c,n.toolbarVersion=this.toolbarVersions.get(c.path),!this.ownsSave(n))return;let u=this.contacts.findIndex(e=>s?e.path===i.path:e===n.original);this.contacts=u>-1?this.contacts.map((e,t)=>t===u?c:e):[c,...this.contacts],l&&(this.selectedContact=c,this.wholeCardPath=c.path)}catch(e){if(s&&R(e)||console.error(`Error saving contact`,e),!this.ownsSave(n))return;s&&R(e)?this.saveFoundGone(n,i.path):I(e)||!s&&F(e)?(n.unconfirmed={before:i,payload:t},this.reportFailure(Q.update[1]),await this.reconcileSave(n)):s&&F(e)?(n.conflicted=!0,this.showingSave(n)&&(this.conflictedPath=i.path),this.reportFailure(`contacts.saveConflict`)):this.reportFailure(`contacts.saveFailed`)}finally{this.showingSave(n)&&(this.saving=!1)}}}async reconcileSave(n){let r=n.unconfirmed;if(!r)return!0;try{let{contacts:i=[]}=await e.fetchContacts();if(!this.ownsSave(n))return!1;let a=i.find(e=>r.before.isTemporary?String(e.uid||``).replace(/^urn:uuid:/i,``).toLowerCase()===n.creationId?.toLowerCase():e.path===r.before.path);if(!a&&r.before.isTemporary)return n.unconfirmed=void 0,!0;if(!a)return n.unconfirmed=void 0,this.saveFoundGone(n,r.before.path),!1;if(a&&(!r.before.isTemporary&&r.before.etag&&a.etag===r.before.etag||t(a,r.payload))){let e=this.showingSave(n);n.contact={...a},n.unconfirmed=void 0;let t=this.contacts.findIndex(e=>e===n.original||e.path===a.path);return this.contacts=t<0?[a,...this.contacts]:this.contacts.map((e,n)=>n===t?a:e),e&&(this.selectedContact=n.contact,this.wholeCardPath=a.path),this.saveTargets.set(n.contact,n),!0}n.unconfirmed=void 0,n.conflicted=!0,this.showingSave(n)&&(this.conflictedPath=r.before.path),this.reportFailure(`contacts.saveConflict`)}catch(e){console.error(`Could not confirm the contact save`,e)}return!1}handleSaveEvent(e){(e.sourceUsername===void 0||e.sourceUsername===(A()??this.username))&&this.handleSave(e.detail,e.sourceContact)}async handleToggleStarEvent(){let t=this.contactWorkOwner(),n=this.gestureTargets;if(n.length===0)return;let r=n.length>1?this.allSelectedStarred:this.findContact(n[0])?.categories?.includes(`Favorites`)||!1;this.saving=!0;let i=new Map,a=new Map;try{let o=n.map(e=>{let t=this.findContact(e);if(!t)return;i.set(e,t.categories);let n=t.categories?[...t.categories]:[];r?n=n.filter(e=>e!==B):n.includes(`Favorites`)||n.push(B),a.set(e,n);let o=this.contacts.findIndex(t=>t.path===e);return o!==-1&&(this.contacts[o]={...t,categories:n}),this.selectedContact?.path===e&&(this.selectedContact={...this.selectedContact,categories:n}),{...t,categories:n}}).filter(Boolean);this.contacts=[...this.contacts];let{total:s,done:c,failed:l,uncertain:u=0,etags:d,gonePaths:f=[]}=await e.bulkUpdateCategories(o);if(!t())return;if(this.applyETags(d),l>0){if(c===0){let e=e=>e&&a.has(e.path)&&e.categories===a.get(e.path)?{...e,categories:i.get(e.path)}:e;this.contacts=this.contacts.map(e),this.selectedContact=e(this.selectedContact),u>0&&this.fetchContacts()}else this.fetchContacts();this.reportRefusals(`contacts.starFailed`,`contacts.starOneFailed`,{count:l-u,total:s,uncertain:u,gone:f.length}),this.dropGone(f)}}catch(e){if(!t())return;console.error(`Error toggling star`,e),this.reportRefusals(`contacts.starFailed`,`contacts.starOneFailed`,{count:n.length,total:n.length})}finally{t()&&(this.saving=!1)}}reportFailure(e,t){this.showFailure(this.i18nStore?.t(e,t))}showFailure(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e,type:`error`,duration:5e3}}))}reportRefusals(e,t,n,r=`update`){let{total:i,uncertain:a=0,gone:o=0}=n,s=n.count-o,c=([e,t],n)=>(i===1?this.i18nStore?.t(t):this.i18nStore?.t(e,{count:n,total:i}))??``,l=[];s>0&&l.push(c([e,t],s)),o>0&&l.push(c([`contacts.deletedElsewhereCount`,`contacts.deletedElsewhere`],o)),a>0&&l.push(c(Q[r],a)),this.showFailure(l.reduce((e,t)=>e+(e&&!/[。！？]$/.test(e)?` `:``)+t,``))}handleDelete(){this.showDeleteConfirm=!0}async confirmDelete(){this.showDeleteConfirm=!1,this.saving=!0;let t=this.selectedContact?.path,n=i(),r=this.selectedContacts,a=this.gestureTargets;try{let{total:o,done:s,failed:c,uncertain:l=0,deletedPaths:u=[]}=await e.bulkDeleteContacts(a);if(s>0)t&&this.selectedContact?.path===t&&u.includes(t)&&(this.selectedContact=null,this.isEditing=!1,i()===n&&this.leaveDeletedCard()),this.selectedContacts===r&&r.size>0&&(this.selectedContacts=new Set),this.fetchContacts();else if(l>0){await this.fetchContacts();let e=new Set(this.allContacts.map(e=>e.path)),o=t=>!!t&&a.includes(t)&&!e.has(t);t&&this.selectedContact?.path===t&&o(t)&&(this.selectedContact=null,this.isEditing=!1,i()===n&&this.leaveDeletedCard()),this.selectedContacts===r&&[...r].some(o)&&(this.selectedContacts=new Set([...r].filter(e=>!o(e))))}c>0&&this.reportRefusals(`contacts.deleteFailed`,`contacts.deleteOneFailed`,{count:c-l,total:o,uncertain:l},`delete`)}catch(e){console.error(`Error deleting contacts`,e),this.fetchContacts(),this.reportRefusals(`contacts.deleteFailed`,`contacts.deleteOneFailed`,{count:a.length,total:a.length})}finally{this.saving=!1}}async handleUpdateCategories(t){let n=this.contactWorkOwner(),r=t.detail.category;typeof r==`string`&&(r=r.trim()),r&&!this.addedCategories.includes(r)&&(this.addedCategories=[...this.addedCategories,r],this.saveAddedCategories());let i=this.gestureTargets;if(i.length!==0){this.saving=!0;try{let t=i.map(e=>{let t=this.findContact(e);if(!t)return;let n=t.categories?[...t.categories]:[];r===``?n=[]:n.includes(r)?n=n.filter(e=>e!==r):n.push(r);let i=this.contacts.findIndex(t=>t.path===e);return i!==-1&&(this.contacts[i]={...t,categories:n}),this.selectedContact?.path===e&&(this.selectedContact={...this.selectedContact,categories:n}),{...t,categories:n}}).filter(Boolean),{total:a,failed:o,uncertain:s=0,etags:c,gonePaths:l=[]}=await e.bulkUpdateCategories(t);if(!n())return;if(this.contacts=[...this.contacts],this.applyETags(c),o>0&&(this.fetchContacts(),this.reportRefusals(`contacts.categoryUpdateFailed`,`contacts.categoryUpdateOneFailed`,{count:o-s,total:a,uncertain:s,gone:l.length}),this.dropGone(l)),this.selectedContact&&this.selectedContacts.size<=1&&this.selectedCategory!==``&&!this.selectedContact.categories?.includes(this.selectedCategory)){let e=this.selectedContact.uid?.replace(/^urn:uuid:/,``)||this.selectedContact.path;e&&this.writeHash(`#/contacts/all/${encodeURIComponent(e)}`,`replace`)}this.selectedCategory!==``&&this.selectedCategory!==`All Contacts`&&this.fetchContacts()}catch(e){if(!n())return;console.error(`Error updating categories`,e),this.reportRefusals(`contacts.categoryUpdateFailed`,`contacts.categoryUpdateOneFailed`,{count:i.length,total:i.length})}finally{n()&&(this.saving=!1)}}}render(){return x`
      ${this.showDeleteConfirm?x`
        <ui-confirm
          heading="${this.i18nStore?.t(`contacts.deleteContact`)}"
          message="${this.i18nStore?.t(`contacts.deleteContactConfirm`)}"
          confirmText="${this.i18nStore?.t(`contacts.delete`)}"
          isDanger
          @confirm=${this.confirmDelete}
          @cancel=${()=>this.showDeleteConfirm=!1}
        ></ui-confirm>
      `:``}
      <alps-initial-loader ?hidden=${!this.showInitialLoader}></alps-initial-loader>
      <app-header 
        currentTab="contacts"
        .username=${this.username}
        .isMobile=${this.isMobile}
        .searchQuery=${this.filterQuery}
        .scrolled=${this.listScrolled}
        @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
        @search-submit=${e=>{this.filterQuery=e.detail.value,this.fetchContacts()}}
      ></app-header>
      <div class="app-container layout-vertical ${this.sidebarCollapsed&&!this.isMobile?`collapsed`:``} ${this.isPaneDragging||this.isSidebarDragging?`dragging`:``} ${this.isMobile?`mobile-view`:``} ${this.isMobile&&this.selectedContact?`reading`:``}" style="${!this.sidebarCollapsed&&!this.isMobile?`--sidebar-width: ${this.sidebarWidth}px;`:``}">
        <alps-sidebar 
          class="${this.isMobile?`mobile-sidebar`:`desktop-sidebar`} ${this.mobileSidebarOpen?`open`:``}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
          .width=${this.sidebarWidth}
          .collapsed=${this.sidebarCollapsed&&!this.isMobile}
          @sidebar-resize=${e=>{let t=e.detail.newWidth;t<120?(this.sidebarCollapsed||this.settingsStore?.updateSettings({sidebarCollapsed:!0}),this.sidebarWidth=250):(this.sidebarCollapsed&&this.settingsStore?.updateSettings({sidebarCollapsed:!1}),this.sidebarWidth=Math.min(Math.max(t,180),500))}}
          @drag-start=${()=>this.isSidebarDragging=!0}
          @drag-end=${()=>this.isSidebarDragging=!1}
          @toggle-collapse=${()=>this.settingsStore?.updateSettings({sidebarCollapsed:!this.sidebarCollapsed})}
          @close-sidebar=${()=>this.mobileSidebarOpen=!1}
        >
          <alps-contacts-categories
            .contacts=${this.allContacts}
            .uniqueCategories=${this.uniqueCategories}
            .selectedCategory=${this.selectedCategory}
            .filterQuery=${this.filterQuery}
            @create-contact=${this.handleCreateNew}
            @select-category=${e=>{this.clearSearch();let t=e.detail.category;t===`All Contacts`?this.writeHash(`#/contacts/all`,`push`):this.writeHash(`#/contacts/${encodeURIComponent(t)}`,`push`),c(this.renderRoot)}}
            @drag-start=${()=>{this.isSidebarDragging=!0,c(this.renderRoot)}}
            @drag-end=${()=>{this.isSidebarDragging=!1,this.isMobile?this.mobileSidebarOpen=!1:c(this.renderRoot)}}
            @rename-category=${e=>{this.categoryToRename=e.detail.category}}
            @delete-category=${e=>{this.categoryToDelete=e.detail.category}}
          ></alps-contacts-categories>
          
          <alps-icon-btn 
            slot="footer-actions"
            class="new-folder-btn"
            icon="folderPlus"
            title="${this.i18nStore?.t(`contacts.createCategory`)}"
            @click=${()=>this.showCreatePrompt=!0}
          ></alps-icon-btn>
        </alps-sidebar>
        <div class="main-view">
          <div class="contact-list-pane" style="width: ${this.isMobile?`100%`:this.listWidth+`px`}; display: flex; flex-direction: column; flex-shrink: 0;">
            ${this.listError?x`<alps-banner variant=${this.listError===`contacts.notConfigured`?`info`:`error`} role="status">${this.i18nStore?.t(this.listError)}</alps-banner>`:``}
            <alps-contacts-list
              .contacts=${this.contacts}
              .selectedCategory=${this.selectedCategory}
              .filterQuery=${this.filterQuery}
              .sortOrder=${this.sortOrder}
              .showOnlyStarred=${this.showOnlyStarred}
              .isMobile=${this.isMobile}
              .densityMode=${this.densityMode}
              .selectedContacts=${this.selectedContacts}
              .selectedContact=${this.selectedContact}
              .isSpinning=${this.isSpinning}
              .loading=${this.loading}
              .listScrolled=${this.listScrolled}
              @select-contact=${e=>this.selectContact(e.detail.contact)}
              @toggle-star=${e=>this.handleToggleStar(new Event(``),e.detail.contact)}
              @select-all=${this.handleSelectAll}
              @toggle-selection=${e=>this.handleSelectContact(e.detail.event,e.detail.path)}
              @refresh=${()=>this.fetchContacts()}
              @spin-iteration=${this.handleSpinIteration}
              @sort-toggle=${()=>this.sortOrder=this.sortOrder===`asc`?`desc`:`asc`}
              @filter-star-toggle=${()=>this.showOnlyStarred=!this.showOnlyStarred}
              @clear-search=${()=>this.clearSearch()}
              @list-scrolled=${e=>this.listScrolled=e.detail.scrolled}
            ></alps-contacts-list>
          </div>
          ${this.isMobile?``:x`<div class="resizer ${this.isPaneDragging?`dragging`:``}" @mousedown=${this.startResize}></div>`}
          <div class="contact-reader-pane" style="padding: 0; flex: 1;">
            <alps-contact-view
              .contact=${this.selectedContact}
              .selectedCount=${this.selectedContacts.size}
              .allSelectedStarred=${this.allSelectedStarred}
              .isEditing=${this.isEditing}
              .saving=${this.saving}
              .uniqueCategories=${this.uniqueCategories}
              .isMobile=${this.isMobile}
              @save=${this.handleSaveEvent}
              @delete=${this.handleDelete}
              @cancel-edit=${this.handleCancelEdit}
              @edit=${this.handleEdit}
              @toggle-star=${this.handleToggleStarEvent}
              @update-categories=${this.handleUpdateCategories}
              @list-scrolled=${e=>this.listScrolled=e.detail.scrolled}
              @close=${()=>{this.selectedContact=null,this.isEditing=!1,this.writeHash(this.listHash(),`push`)}}
            ></alps-contact-view>
          </div>
        </div>
      </div>
      
      ${this.showCreatePrompt?x`
        <ui-prompt
          heading="${this.i18nStore?.t(`contacts.createCategory`)}"
          confirmText="${this.i18nStore?.t(`contacts.create`)}"
          .fields=${[{id:`name`,label:this.i18nStore?.t(`contacts.categoryName`),autofocus:!0}]}
          @submit=${this.handleCreateCategorySubmit}
          @cancel=${()=>this.showCreatePrompt=!1}
        ></ui-prompt>
      `:``}

      ${this.categoryToRename===null?``:x`
        <ui-prompt
          heading="${this.i18nStore?.t(`contacts.renameCategory`)}"
          confirmText="${this.i18nStore?.t(`contacts.rename`)}"
          .fields=${[{id:`name`,label:this.i18nStore?.t(`contacts.categoryName`),value:this.categoryToRename,autofocus:!0}]}
          @submit=${this.handleRenameCategorySubmit}
          @cancel=${()=>this.categoryToRename=null}
        ></ui-prompt>
      `}

      ${this.categoryToDelete===null?``:x`
        <ui-confirm
          heading="${this.i18nStore?.t(`contacts.deleteCategory`)}"
          message="${this.i18nStore?.t(`contacts.deleteCategoryConfirm`,{category:this.categoryToDelete})}"
          confirmText="${this.i18nStore?.t(`contacts.delete`)}"
          isDanger
          @confirm=${this.handleDeleteCategorySubmit}
          @cancel=${()=>this.categoryToDelete=null}
        ></ui-confirm>
      `}
    `}};D([g({context:S})],$.prototype,`i18nStore`,void 0),D([g({context:j})],$.prototype,`settingsStore`,void 0),D([v()],$.prototype,`contacts`,void 0),D([v()],$.prototype,`sortOrder`,void 0),D([v()],$.prototype,`showOnlyStarred`,void 0),D([v()],$.prototype,`loading`,void 0),D([v()],$.prototype,`isSpinning`,void 0),D([v()],$.prototype,`showInitialLoader`,void 0),D([v()],$.prototype,`selectedContact`,void 0),D([v()],$.prototype,`filterQuery`,void 0),D([v()],$.prototype,`isEditing`,void 0),D([v()],$.prototype,`saving`,void 0),D([v()],$.prototype,`selectedCategory`,void 0),D([v()],$.prototype,`showCreatePrompt`,void 0),D([v()],$.prototype,`showDeleteConfirm`,void 0),D([v()],$.prototype,`addedCategories`,void 0),D([v()],$.prototype,`sidebarWidth`,void 0),D([v()],$.prototype,`listWidth`,void 0),D([v()],$.prototype,`sidebarCollapsed`,void 0),D([v()],$.prototype,`isMobile`,void 0),D([v()],$.prototype,`mobileSidebarOpen`,void 0),D([v()],$.prototype,`isSidebarDragging`,void 0),D([v()],$.prototype,`isPaneDragging`,void 0),D([v()],$.prototype,`densityMode`,void 0),D([v()],$.prototype,`selectedContacts`,void 0),D([v()],$.prototype,`listScrolled`,void 0),D([v()],$.prototype,`categoryToRename`,void 0),D([v()],$.prototype,`categoryToDelete`,void 0),D([v()],$.prototype,`listError`,void 0),$=D([h(`contacts-page`)],$);export{$ as ContactsPage};