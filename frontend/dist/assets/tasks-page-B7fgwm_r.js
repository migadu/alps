import{b as e,c as t,f as n,g as r,h as i,m as a,p as o,s,v as c}from"./lit-CXIqsLEv.js";import{At as l,St as u,_t as d,a as f,et as p,g as m,gt as h,h as g,ht as _,kt as v,m as y,o as b,s as x}from"./index-1GNfCV5I.js";import{S,_ as C,b as w,c as T,d as E,f as D,g as O,h as k,n as A,p as j,r as M,v as N,x as P,y as F}from"./task-modal-DC4EoKrD.js";var I={overdue:`tasks.groups.overdue`,today:`tasks.groups.today`,week:`tasks.groups.week`,undated:`tasks.groups.undated`,later:`tasks.groups.later`,completed:`tasks.groups.completed`},L={high:`tasks.priorities.high`,medium:`tasks.priorities.medium`,low:`tasks.priorities.low`},R={high:`!!!`,medium:`!!`,low:`!`},z=class extends i{constructor(...e){super(...e),this.tasks=[],this.pendingPaths=new Set,this.settling=new Set,this.searching=!1,this.loading=!1,this.focusedIndex=-1}static{this.styles=e`
        :host {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
        }
        .scroll {
            flex: 1;
            overflow-y: auto;
            padding: 8px 24px 24px;
            outline: none;
        }
        .empty {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px 16px;
            color: var(--text-muted, #6b7280);
            font-size: 14px;
        }
        .group {
            margin: 16px 0 4px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--text-muted, #6b7280);
        }
        .group.overdue {
            color: var(--error, #ef4444);
        }
        .row {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 10px 8px;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            border-radius: 6px;
            cursor: pointer;
        }
        .row:hover,
        .row.focused {
            background: var(--bg-tertiary, #f3f4f6);
        }
        /* The keyboard cursor, drawn as the mail list draws its own: an
           outline, which forced colors keep where they repaint the background. */
        .scroll:focus-within .row.focused {
            outline: 2px solid var(--accent-color);
            outline-offset: -2px;
        }
        .check {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            margin-top: 1px;
            padding: 0;
            border: 2px solid var(--text-muted, #9ca3af);
            border-radius: 50%;
            background: transparent;
            color: #fff;
            cursor: pointer;
        }
        .check:hover {
            border-color: var(--accent-color, #2563eb);
        }
        .check:disabled {
            opacity: 0.5;
            cursor: progress;
        }
        .row.done .check {
            background: var(--accent-fill, #2563eb);
            border-color: var(--accent-fill, #2563eb);
        }
        .check svg {
            width: 12px;
            height: 12px;
            fill: currentColor;
        }
        .body {
            flex: 1;
            min-width: 0;
        }
        .title {
            font-size: 14px;
            color: var(--text-primary, #111827);
            overflow-wrap: anywhere;
        }
        .row.done .title,
        .row.cancelled .title {
            text-decoration: line-through;
            color: var(--text-muted, #6b7280);
        }
        .meta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            margin-top: 2px;
            font-size: 12px;
            color: var(--text-secondary, #4b5563);
        }
        /* Which list a task is in: its colour is the only mark of it in the
           row. Drawn by its background alone, which forced colors repaint as
           the page: kept. */
        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            forced-color-adjust: none;
        }
        .due.overdue {
            color: var(--error, #ef4444);
            font-weight: 500;
        }
        .repeats svg {
            display: block;
            width: 12px;
            height: 12px;
            fill: currentColor;
        }
        .priority {
            font-weight: 700;
            letter-spacing: -1px;
        }
        .priority.high {
            color: var(--error, #ef4444);
        }
        .priority.medium {
            color: #d97706;
        }
        .priority.low {
            color: var(--text-muted, #6b7280);
        }
        .chip {
            padding: 0 6px;
            border-radius: 4px;
            background: var(--bg-tertiary, #f3f4f6);
        }
        @media (max-width: 768px) {
            .scroll {
                padding: 4px 12px 16px;
            }
        }
    `}groups(){let e=this.now??new Date,t=new Map;for(let n of this.tasks){let r=this.settling.has(n.path)?O({...n,status:`needs-action`},e):O(n,e),i=t.get(r);i?i.push(n):t.set(r,[n])}for(let[e,n]of t)n.sort(e===`completed`?D:j);return E.filter(e=>t.has(e)).map(e=>[e,t.get(e)])}toggle(e){this.pendingPaths.has(e.path)||this.dispatchEvent(new CustomEvent(`toggle-complete`,{detail:{task:e,done:e.status!==`completed`}}))}open(e){this.dispatchEvent(new CustomEvent(`open-task`,{detail:{task:e}}))}handleKeyDown(e){if(e.target!==e.currentTarget)return;let t=this.groups().flatMap(([,e])=>e);if(t.length===0)return;let n=Math.min(this.focusedIndex,t.length-1);switch(e.key){case`ArrowDown`:this.focusedIndex=Math.min(t.length-1,n+1);break;case`ArrowUp`:this.focusedIndex=Math.max(0,n-1);break;case`Home`:this.focusedIndex=0;break;case`End`:this.focusedIndex=t.length-1;break;case`Enter`:if(n<0)return;e.preventDefault(),this.open(t[n]);return;case` `:if(n<0)return;e.preventDefault(),this.toggle(t[n]);return;default:return}e.preventDefault(),this.updateComplete.then(()=>{this.renderRoot.querySelector(`.row.focused`)?.scrollIntoView?.({block:`nearest`})})}renderRow(e,t,n){let r=e=>this.i18nStore?.t(e)??e,i=e.status===`completed`,a=e.status===`cancelled`,o=w(e.priority),s=this.now??new Date;return c`
            <div
                class="row ${i?`done`:``} ${a?`cancelled`:``} ${this.focusedIndex===t?`focused`:``}"
                @click=${()=>{this.focusedIndex=t,this.open(e)}}
            >
                <button
                    class="check"
                    role="checkbox"
                    aria-checked=${i?`true`:`false`}
                    aria-label=${r(i?`tasks.markNotDone`:`tasks.markDone`)}
                    ?disabled=${this.pendingPaths.has(e.path)}
                    @click=${t=>{t.stopPropagation(),this.toggle(e)}}
                >
                    ${i?v(`check`):``}
                </button>
                <div class="body">
                    <div class="title"><bdi>${e.title||r(`tasks.untitled`)}</bdi></div>
                    <div class="meta">
                        ${e.color?c`<span class="dot" style="background: ${e.color}"></span>`:``}
                        ${a?c`<span class="chip">${r(`tasks.statuses.cancelled`)}</span>`:``}
                        ${e.due?c`<span class="due ${n===`overdue`?`overdue`:``}">${k(e,s,r(`tasks.today`),N(this.i18nStore?.getLanguage?.()))}</span>`:``}
                        ${e.rrule?c`<span class="repeats" role="img" aria-label=${r(`tasks.repeats`)} title=${r(`tasks.repeats`)}>${v(`arrowsClockwise`)}</span>`:``}
                        ${e.role===`attendee`&&e.organizer?c`<span class="assigned">${r(`tasks.assignedBy`)} ${d(e.organizer.name,e.organizer.email)}</span>`:e.role===`organizer`&&e.attendees?.length?c`<span class="assigned">${r(`tasks.assignedTo`)} ${e.attendees.map((e,t)=>c`${t?`, `:``}${d(e.name,e.email)}`)}</span>`:``}
                        ${o?c`<span class="priority ${o}" role="img" aria-label=${r(L[o])} title=${r(L[o])}>${R[o]}</span>`:``}
                    </div>
                </div>
            </div>
        `}render(){if(this.loading&&this.tasks.length===0)return c`<div class="empty"><alps-loader></alps-loader></div>`;let e=this.groups();if(e.length===0)return c`<div class="empty">${this.i18nStore?.t(this.searching?`tasks.noResults`:`tasks.noTasks`)}</div>`;let t=-1;return c`
            <div class="scroll" tabindex="0" @keydown=${this.handleKeyDown}>
                ${e.map(([e,n])=>c`
                        <div class="group ${e}">${this.i18nStore?.t(I[e])}</div>
                        ${s(n,e=>e.path,n=>this.renderRow(n,++t,e))}
                    `)}
            </div>
        `}};_([t({context:l})],z.prototype,`i18nStore`,void 0),_([o({type:Array})],z.prototype,`tasks`,void 0),_([o({attribute:!1})],z.prototype,`pendingPaths`,void 0),_([o({attribute:!1})],z.prototype,`settling`,void 0),_([o({type:Boolean})],z.prototype,`searching`,void 0),_([o({type:Boolean})],z.prototype,`loading`,void 0),_([o({attribute:!1})],z.prototype,`now`,void 0),_([n()],z.prototype,`focusedIndex`,void 0),z=_([a(`tasks-list`)],z);var B=250,V=500,H=120,U=[{id:`all`,icon:`listBullets`,label:`tasks.allTasks`},{id:`today`,icon:`calendarBlank`,label:`tasks.today`},{id:`upcoming`,icon:`calendar`,label:`tasks.upcoming`},{id:`undated`,icon:`tray`,label:`tasks.undated`},{id:`completed`,icon:`checkCircle`,label:`tasks.completed`}],W=class extends i{constructor(...e){super(...e),this.tasks=[],this.lists=[],this.selectedList=`all`,this.selectedCalendar=``,this.searchQuery=``,this.loading=!0,this.loadedScope=``,this.pendingPaths=new Set,this.settling=new Set,this.modalOpen=!1,this.taskToDelete=null,this.scheduling=`email`,this.isSpinning=!1,this.listPromptOpen=!1,this.sidebarWidth=B,this.sidebarCollapsed=!1,this.isSidebarDragging=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.syncTimer=null,this.readEpoch=0,this.mutationEpoch=0,this.handleSettingsChange=()=>{if(!this.settingsStore)return;let e=this.settingsStore.getState();this.sidebarCollapsed=e.sidebarCollapsed,this.syncTimer&&=(clearInterval(this.syncTimer),null),e.checkMailInterval&&e.checkMailInterval>0&&(this.syncTimer=setInterval(()=>void this.fetchTasks(),e.checkMailInterval*60*1e3))},this.handleResize=()=>{this.isMobile=window.innerWidth<=768},this.handleHashChange=()=>{this.parseHash()&&this.fetchTasks()}}static{this.styles=[h,m,y,e`
            :host {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
            }
            .app-container.collapsed .main-content {
                position: relative;
                z-index: 25;
                border-inline-start: 1px solid var(--border-color, #e5e7eb);
                box-shadow: rgba(95, 95, 95, 0.1) calc(-4px * var(--ui-inline-direction, 1)) 0 4px -2px;
            }
            .layout {
                display: flex;
                width: 100%;
                height: 100%;
                overflow: hidden;
                background-color: var(--bg-primary, #ffffff);
            }
            .sidebar-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .sidebar-scroll-content {
                display: flex;
                flex-direction: column;
                gap: 24px;
                height: 100%;
                padding: 16px;
                box-sizing: border-box;
                overflow-y: auto;
            }
            .nav-item {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                height: 36px;
                margin-bottom: 2px;
                padding: 0 8px;
                box-sizing: border-box;
                border: none;
                border-radius: 6px;
                background: transparent;
                color: var(--text-primary, #111827);
                font-family: inherit;
                font-size: 14px;
                text-align: start;
                cursor: pointer;
                user-select: none;
            }
            .nav-item:hover {
                background: var(--bg-tertiary, #f3f4f6);
            }
            .nav-item.active {
                background: var(--bg-tertiary, #f3f4f6);
                font-weight: 600;
            }
            .nav-item svg {
                flex-shrink: 0;
                width: 18px;
                height: 18px;
                fill: currentColor;
                color: var(--text-secondary, #4b5563);
            }
            .nav-item .label {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .nav-item .count {
                font-size: 12px;
                color: var(--text-muted, #6b7280);
            }
            /* A list's colour, the one its tasks' dots wear. Drawn by its
               background alone, which forced colors repaint as the page:
               kept. */
            .list-dot {
                flex-shrink: 0;
                width: 10px;
                height: 10px;
                margin: 0 4px;
                border-radius: 50%;
                forced-color-adjust: none;
            }
            .main-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                background-color: var(--bg-primary, #ffffff);
            }
            .toolbar {
                display: flex;
                flex-shrink: 0;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                height: 57px;
                padding: 0 24px;
                box-sizing: border-box;
                border-bottom: 1px solid var(--border-color, #e5e7eb);
            }
            .toolbar h2 {
                margin: 0;
                overflow: hidden;
                font-size: 24px;
                font-weight: 600;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .toolbar .sub-title {
                font-weight: 300;
                color: var(--text-secondary, #4b5563);
            }
            @media (max-width: 768px) {
                .toolbar {
                    padding: 0 12px;
                }
                .toolbar h2 {
                    font-size: 18px;
                }
            }
        `]}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this.handleResize),window.addEventListener(`hashchange`,this.handleHashChange),this.settingsStore&&(this.settingsStore.addEventListener(`change`,this.handleSettingsChange),this.handleSettingsChange()),this.parseHash(f()??``),this.fetchTasks()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this.handleResize),window.removeEventListener(`hashchange`,this.handleHashChange),this.settingsStore?.removeEventListener(`change`,this.handleSettingsChange),this.syncTimer&&=(clearInterval(this.syncTimer),null)}get wantedScope(){return this.searchQuery?`all`:P(this.selectedList)}parseHash(e=window.location.hash){if(!e.startsWith(`#/tasks`))return!1;let[t,n=``]=e.slice(1).split(`?`),r=t.split(`/`)[2]??``,i=new URLSearchParams(n),a=i.get(`list`)??``,o=i.get(`q`)??``,s=r;return U.some(e=>e.id===r)||(s=`all`,x(window.location.hash)||history.replaceState(history.state,``,this.hashFor(s,a,o))),(s!==this.selectedList||a!==this.selectedCalendar||o!==this.searchQuery)&&(this.settling=new Set),this.selectedList=s,this.selectedCalendar=a,this.searchQuery=o,this.wantedScope!==this.loadedScope}hashFor(e,t,n){let r=new URLSearchParams;t&&r.set(`list`,t),n&&r.set(`q`,n);let i=r.toString();return`#/tasks/${e}${i?`?${i}`:``}`}navigate(e,t=this.selectedCalendar,n=this.searchQuery){let r=this.hashFor(e,t,n);if(b(r)){this.parseHash(r)&&this.fetchTasks();return}window.location.hash!==r&&(window.location.hash=r)}async fetchTasks(){let e=++this.readEpoch,t=this.mutationEpoch,n=this.wantedScope;this.loading=!0,this.isSpinning=!0;try{let r=await S.fetchTasks(n===`all`?void 0:n);if(e!==this.readEpoch)return;if(t!==this.mutationEpoch){this.fetchTasks();return}this.lists=r.calendars.map(e=>({...e,color:M(e.path)})),this.tasks=r.tasks.map(e=>({...e,color:M(e.calendarPath)})),this.loadedScope=n,this.scheduling=r.scheduling===`server`?`server`:`email`,this.settling=new Set,r.failedCalendars>0&&this.toast(`tasks.someListsFailed`,void 0,`error`)}catch(t){if(e!==this.readEpoch)return;console.error(`Failed to load tasks`,t),this.failed(`tasks.loadFailed`,t)}finally{e===this.readEpoch&&(this.loading=!1)}}shows(e,t=new Date){if(this.selectedCalendar&&e.calendarPath!==this.selectedCalendar)return!1;let n=this.searchQuery.trim().toLowerCase();return n?e.title.toLowerCase().includes(n)||(e.description??``).toLowerCase().includes(n):C(e,this.selectedList,t)}get visibleTasks(){let e=new Date;return this.tasks.filter(t=>this.shows(t,e)||this.settling.has(t.path))}countFor(e){if(this.loadedScope!==`all`&&this.loadedScope!==P(e))return null;let t=new Date;return this.tasks.filter(n=>(!this.selectedCalendar||n.calendarPath===this.selectedCalendar)&&C(n,e,t)).length}replaceTask(e,t){this.mutationEpoch++;let n={...t,color:M(t.calendarPath)};this.tasks=this.tasks.map(t=>t.path===e?n:t)}async handleToggleComplete(e,t){if(!this.pendingPaths.has(e.path)){this.pendingPaths=new Set(this.pendingPaths).add(e.path),this.settling=new Set(this.settling).add(e.path),this.replaceTask(e.path,{...e,status:t?`completed`:`needs-action`});try{let n=await S.completeTask(e.path,t,this.i18nStore?.getLanguage?.());this.replaceTask(e.path,n),n.sendFailed&&this.toast(`invitations.notTold`,void 0,`error`),t&&!F(n)&&this.toast(`tasks.movedToNext`,{date:this.formatDue(n)})}catch(t){console.error(`Failed to update task`,t),this.replaceTask(e.path,e),this.failed(`tasks.completeFailed`,t)}finally{let t=new Set(this.pendingPaths);t.delete(e.path),this.pendingPaths=t}}}handleSaved(e){let{task:t,created:n}=e.detail;this.closeModal(),this.mutationEpoch++;let r={...t,color:M(t.calendarPath)};if(this.tasks=n?[r,...this.tasks]:this.tasks.map(e=>e.path===r.path?r:e),!this.shows(r))if(n){let e=this.selectedCalendar===r.calendarPath?this.selectedCalendar:``;this.navigate(F(r)?`completed`:`all`,e,``)}else this.settling=new Set(this.settling).add(r.path)}async confirmDelete(e=!0){let t=this.taskToDelete;if(t){this.taskToDelete=null;try{(await S.deleteTask(t.path,{notify:e,lang:this.i18nStore?.getLanguage?.()}))?.sendFailed&&this.toast(`invitations.notTold`,void 0,`error`),this.mutationEpoch++,this.tasks=this.tasks.filter(e=>e.path!==t.path)}catch(e){console.error(`Failed to delete task`,e),this.failed(`tasks.deleteFailed`,e)}}}async handleListPromptSubmit(e){this.listPromptOpen=!1;let t=String(e.detail?.name??``).trim();if(t)try{await A.createCalendar(t,[`VTODO`]),await this.fetchTasks()}catch(e){console.error(`Failed to create list`,e),this.failed(`tasks.createListFailed`,e)}}openCreate(){this.editingTask=void 0,this.modalOpen=!0,this.mobileSidebarOpen=!1}openEdit(e){this.editingTask=e,this.modalOpen=!0}closeModal(){this.modalOpen=!1,this.editingTask=void 0}selectList(e){this.mobileSidebarOpen=!1,g(this.renderRoot),this.navigate(e,this.selectedCalendar,``)}selectCalendar(e){this.mobileSidebarOpen=!1,g(this.renderRoot),this.navigate(this.selectedList,this.selectedCalendar===e?``:e,this.searchQuery)}formatDue(e){return k(e,new Date,this.i18nStore?.t(`tasks.today`)??`Today`,N(this.i18nStore?.getLanguage?.()))}failed(e,t){u(t)||this.toast(e,void 0,`error`)}toast(e,t,n){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(e,t),type:n,duration:5e3}}))}handleSidebarResize(e){let t=e.detail.newWidth,n=t<H;n!==this.sidebarCollapsed&&(this.sidebarCollapsed=n,this.settingsStore?.updateSettings({sidebarCollapsed:n})),this.sidebarWidth=n?B:Math.min(Math.max(t,180),V)}get username(){return this.settingsStore?.getState().loginUsername||``}render(){let e=e=>this.i18nStore?.t(e)??e,t=U.find(e=>e.id===this.selectedList)??U[0],n=this.lists.find(e=>e.path===this.selectedCalendar)?.name??``,i=this.selectedCalendar||this.lists[0]?.path||``;return c`
            <app-header
                currentTab="tasks"
                .username=${this.username}
                .isMobile=${this.isMobile}
                .searchQuery=${this.searchQuery}
                @toggle-sidebar=${()=>{this.mobileSidebarOpen=!this.mobileSidebarOpen}}
                @search-submit=${e=>this.navigate(this.selectedList,this.selectedCalendar,e.detail.value)}
            ></app-header>
            <div
                class="app-container ${this.sidebarCollapsed&&!this.isMobile?`collapsed`:``} ${this.isSidebarDragging?`dragging`:``}"
                style="${!this.sidebarCollapsed&&!this.isMobile?`--sidebar-width: ${this.sidebarWidth}px;`:``}"
            >
                <div class="layout">
                    <alps-sidebar
                        class="${this.isMobile?`mobile-sidebar`:`desktop-sidebar`} ${this.mobileSidebarOpen?`open`:``}"
                        .isMobile=${this.isMobile}
                        .isOpen=${this.mobileSidebarOpen}
                        .collapsed=${this.sidebarCollapsed&&!this.isMobile}
                        .width=${this.sidebarWidth}
                        @toggle-collapse=${()=>{this.sidebarCollapsed=!this.sidebarCollapsed,this.settingsStore?.updateSettings({sidebarCollapsed:this.sidebarCollapsed})}}
                        @sidebar-resize=${this.handleSidebarResize}
                        @drag-start=${()=>{this.isSidebarDragging=!0}}
                        @drag-end=${()=>{this.isSidebarDragging=!1}}
                        @close-sidebar=${()=>{this.mobileSidebarOpen=!1}}
                    >
                        <!-- Frame and content follow the strip state
                             alps-sidebar provides: collapsed, they keep the
                             smart lists and the lists, dimmed, inert and
                             behind the main view. -->
                        <alps-sidebar-frame class="sidebar-wrapper">
                            <alps-toolbar class="sidebar-header">
                                <alps-create-button
                                    icon="plusBold"
                                    ?disabled=${this.lists.length===0}
                                    @click=${()=>this.openCreate()}
                                >${e(`tasks.addTask`)}</alps-create-button>
                            </alps-toolbar>
                            <!-- A navigation landmark named for the tab. The
                                 smart lists inside are a plain group: an
                                 unnamed navigation of their own, nested in it,
                                 left the task lists outside. -->
                            <alps-sidebar-content class="sidebar-content" role="navigation" aria-label=${e(`navigation.tasks`)}>
                                <div class="sidebar-scroll-content">
                                    <div class="smart-lists">
                                        ${U.map(t=>{let n=this.countFor(t.id),i=t.id===this.selectedList&&!this.searchQuery;return c`
                                                <button
                                                    class="nav-item smart-list ${i?`active`:``}"
                                                    data-list=${t.id}
                                                    aria-current=${i?`page`:r}
                                                    title=${e(t.label)}
                                                    @click=${()=>this.selectList(t.id)}
                                                >
                                                    ${v(t.icon)}
                                                    <span class="label">${e(t.label)}</span>
                                                    ${n?c`<span class="count">${n}</span>`:``}
                                                </button>
                                            `})}
                                    </div>
                                    ${this.lists.length>0?c`
                                        <div class="calendar-lists">
                                            <alps-sidebar-heading heading=${e(`tasks.lists`)}></alps-sidebar-heading>
                                            ${this.lists.map(e=>c`
                                                <button
                                                    class="nav-item task-list ${e.path===this.selectedCalendar?`active`:``}"
                                                    data-path=${e.path}
                                                    aria-current=${e.path===this.selectedCalendar?`true`:r}
                                                    @click=${()=>this.selectCalendar(e.path)}
                                                >
                                                    <span class="list-dot" style="background: ${e.color}"></span>
                                                    <span class="label"><bdi>${e.name}</bdi></span>
                                                </button>
                                            `)}
                                        </div>
                                    `:``}
                                </div>
                            </alps-sidebar-content>
                        </alps-sidebar-frame>
                        <alps-icon-btn
                            slot="footer-actions"
                            icon="folderPlus"
                            title=${e(`tasks.newList`)}
                            @click=${()=>{this.listPromptOpen=!0}}
                        ></alps-icon-btn>
                    </alps-sidebar>

                    <div class="main-content">
                        <div class="toolbar">
                            <h2>
                                ${this.searchQuery?e(`tasks.searchResults`):e(t.label)}
                                ${n?c`<span class="sub-title"><bdi>${n}</bdi></span>`:``}
                            </h2>
                            <alps-icon-btn
                                icon="arrowsClockwise"
                                title=${e(`mailboxPage.refresh`)}
                                ?spinning=${this.isSpinning}
                                @animationiteration=${()=>{this.loading||(this.isSpinning=!1)}}
                                @click=${()=>void this.fetchTasks()}
                            ></alps-icon-btn>
                        </div>
                        <tasks-list
                            .tasks=${this.visibleTasks}
                            .pendingPaths=${this.pendingPaths}
                            .settling=${this.settling}
                            ?searching=${!!this.searchQuery}
                            ?loading=${this.loading}
                            @toggle-complete=${e=>void this.handleToggleComplete(e.detail.task,e.detail.done)}
                            @open-task=${e=>this.openEdit(e.detail.task)}
                        ></tasks-list>
                    </div>
                </div>
            </div>

            <task-modal
                .open=${this.modalOpen}
                .task=${this.editingTask}
                .lists=${this.lists}
                .defaultList=${i}
                .scheduling=${this.scheduling}
                @close=${()=>this.closeModal()}
                @saved=${this.handleSaved}
                @conflict=${()=>void this.fetchTasks()}
                @delete=${e=>{this.closeModal(),this.taskToDelete=e.detail.task}}
            ></task-modal>

            ${this.listPromptOpen?c`
                <ui-prompt
                    heading=${e(`tasks.newList`)}
                    .fields=${[{id:`name`,label:e(`tasks.listName`),autofocus:!0}]}
                    @submit=${this.handleListPromptSubmit}
                    @cancel=${()=>{this.listPromptOpen=!1}}
                ></ui-prompt>
            `:``}

            ${this.taskToDelete&&T(this.taskToDelete,this.scheduling)?c`
                <ui-confirm
                    class="delete-assigned"
                    heading=${e(`tasks.deleteTask`)}
                    message=${e(this.taskToDelete.role===`organizer`?`tasks.deleteTellAssignees`:`tasks.deleteTellAssigner`)}
                    confirmText=${e(`invitations.deleteAndTell`)}
                    secondaryText=${e(`invitations.deleteOnly`)}
                    isDanger
                    @confirm=${()=>void this.confirmDelete(!0)}
                    @secondary=${()=>void this.confirmDelete(!1)}
                    @cancel=${()=>{this.taskToDelete=null}}
                ></ui-confirm>
            `:this.taskToDelete?c`
                <ui-confirm
                    heading=${e(`tasks.deleteTask`)}
                    message=${e(`tasks.deleteTaskConfirm`)}
                    confirmText=${e(`tasks.delete`)}
                    isDanger
                    @confirm=${()=>void this.confirmDelete()}
                    @cancel=${()=>{this.taskToDelete=null}}
                ></ui-confirm>
            `:``}
        `}};_([t({context:l})],W.prototype,`i18nStore`,void 0),_([t({context:p})],W.prototype,`settingsStore`,void 0),_([n()],W.prototype,`tasks`,void 0),_([n()],W.prototype,`lists`,void 0),_([n()],W.prototype,`selectedList`,void 0),_([n()],W.prototype,`selectedCalendar`,void 0),_([n()],W.prototype,`searchQuery`,void 0),_([n()],W.prototype,`loading`,void 0),_([n()],W.prototype,`loadedScope`,void 0),_([n()],W.prototype,`pendingPaths`,void 0),_([n()],W.prototype,`settling`,void 0),_([n()],W.prototype,`modalOpen`,void 0),_([n()],W.prototype,`editingTask`,void 0),_([n()],W.prototype,`taskToDelete`,void 0),_([n()],W.prototype,`scheduling`,void 0),_([n()],W.prototype,`isSpinning`,void 0),_([n()],W.prototype,`listPromptOpen`,void 0),_([n()],W.prototype,`sidebarWidth`,void 0),_([n()],W.prototype,`sidebarCollapsed`,void 0),_([n()],W.prototype,`isSidebarDragging`,void 0),_([n()],W.prototype,`isMobile`,void 0),_([n()],W.prototype,`mobileSidebarOpen`,void 0),W=_([a(`tasks-page`)],W);export{W as TasksPage};