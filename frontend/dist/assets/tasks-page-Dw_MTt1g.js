import{_ as e,d as t,f as n,m as r,o as i,p as a,s as o,y as s}from"./lit-CB2iQgdU.js";import{J as c,Y as l,c as u,et as d,l as f,ot as p,s as m,st as h,z as g}from"./index-Bql1o0Vn.js";import{S as _,_ as v,b as y,c as b,d as x,f as S,g as C,h as w,n as T,p as E,r as D,v as O,x as k,y as A}from"./task-modal-B5zTfqbS.js";var j={overdue:`tasks.groups.overdue`,today:`tasks.groups.today`,week:`tasks.groups.week`,undated:`tasks.groups.undated`,later:`tasks.groups.later`,completed:`tasks.groups.completed`},M={high:`tasks.priorities.high`,medium:`tasks.priorities.medium`,low:`tasks.priorities.low`},N={high:`!!!`,medium:`!!`,low:`!`},P=class extends r{constructor(...e){super(...e),this.tasks=[],this.pendingPaths=new Set,this.settling=new Set,this.searching=!1,this.loading=!1,this.focusedIndex=-1}static{this.styles=s`
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
        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
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
    `}groups(){let e=this.now??new Date,t=new Map;for(let n of this.tasks){let r=this.settling.has(n.path)?C({...n,status:`needs-action`},e):C(n,e),i=t.get(r);i?i.push(n):t.set(r,[n])}for(let[e,n]of t)n.sort(e===`completed`?S:E);return x.filter(e=>t.has(e)).map(e=>[e,t.get(e)])}toggle(e){this.pendingPaths.has(e.path)||this.dispatchEvent(new CustomEvent(`toggle-complete`,{detail:{task:e,done:e.status!==`completed`}}))}open(e){this.dispatchEvent(new CustomEvent(`open-task`,{detail:{task:e}}))}handleKeyDown(e){if(e.target!==e.currentTarget)return;let t=this.groups().flatMap(([,e])=>e);if(t.length===0)return;let n=Math.min(this.focusedIndex,t.length-1);switch(e.key){case`ArrowDown`:this.focusedIndex=Math.min(t.length-1,n+1);break;case`ArrowUp`:this.focusedIndex=Math.max(0,n-1);break;case`Home`:this.focusedIndex=0;break;case`End`:this.focusedIndex=t.length-1;break;case`Enter`:if(n<0)return;e.preventDefault(),this.open(t[n]);return;case` `:if(n<0)return;e.preventDefault(),this.toggle(t[n]);return;default:return}e.preventDefault(),this.updateComplete.then(()=>{this.renderRoot.querySelector(`.row.focused`)?.scrollIntoView?.({block:`nearest`})})}renderRow(t,n,r){let i=e=>this.i18nStore?.t(e)??e,a=t.status===`completed`,o=t.status===`cancelled`,s=y(t.priority),c=this.now??new Date;return e`
            <div
                class="row ${a?`done`:``} ${o?`cancelled`:``} ${this.focusedIndex===n?`focused`:``}"
                @click=${()=>{this.focusedIndex=n,this.open(t)}}
            >
                <button
                    class="check"
                    role="checkbox"
                    aria-checked=${a?`true`:`false`}
                    aria-label=${i(a?`tasks.markNotDone`:`tasks.markDone`)}
                    ?disabled=${this.pendingPaths.has(t.path)}
                    @click=${e=>{e.stopPropagation(),this.toggle(t)}}
                >
                    ${a?p(`check`):``}
                </button>
                <div class="body">
                    <div class="title">${t.title||i(`tasks.untitled`)}</div>
                    <div class="meta">
                        ${t.color?e`<span class="dot" style="background: ${t.color}"></span>`:``}
                        ${o?e`<span class="chip">${i(`tasks.statuses.cancelled`)}</span>`:``}
                        ${t.due?e`<span class="due ${r===`overdue`?`overdue`:``}">${w(t,c,i(`tasks.today`),O(this.i18nStore?.getLanguage?.()))}</span>`:``}
                        ${t.rrule?e`<span class="repeats" role="img" aria-label=${i(`tasks.repeats`)} title=${i(`tasks.repeats`)}>${p(`arrowsClockwise`)}</span>`:``}
                        ${t.role===`attendee`&&t.organizer?e`<span class="assigned">${i(`tasks.assignedBy`)} ${l(t.organizer.name,t.organizer.email)}</span>`:t.role===`organizer`&&t.attendees?.length?e`<span class="assigned">${i(`tasks.assignedTo`)} ${t.attendees.map((t,n)=>e`${n?`, `:``}${l(t.name,t.email)}`)}</span>`:``}
                        ${s?e`<span class="priority ${s}" role="img" aria-label=${i(M[s])} title=${i(M[s])}>${N[s]}</span>`:``}
                    </div>
                </div>
            </div>
        `}render(){if(this.loading&&this.tasks.length===0)return e`<div class="empty"><alps-loader></alps-loader></div>`;let t=this.groups();if(t.length===0)return e`<div class="empty">${this.i18nStore?.t(this.searching?`tasks.noResults`:`tasks.noTasks`)}</div>`;let n=-1;return e`
            <div class="scroll" tabindex="0" @keydown=${this.handleKeyDown}>
                ${t.map(([t,r])=>e`
                        <div class="group ${t}">${this.i18nStore?.t(j[t])}</div>
                        ${i(r,e=>e.path,e=>this.renderRow(e,++n,t))}
                    `)}
            </div>
        `}};c([o({context:h})],P.prototype,`i18nStore`,void 0),c([n({type:Array})],P.prototype,`tasks`,void 0),c([n({attribute:!1})],P.prototype,`pendingPaths`,void 0),c([n({attribute:!1})],P.prototype,`settling`,void 0),c([n({type:Boolean})],P.prototype,`searching`,void 0),c([n({type:Boolean})],P.prototype,`loading`,void 0),c([n({attribute:!1})],P.prototype,`now`,void 0),c([t()],P.prototype,`focusedIndex`,void 0),P=c([a(`tasks-list`)],P);var F=250,I=150,L=500,R=120,z=[{id:`all`,icon:`listBullets`,label:`tasks.allTasks`},{id:`today`,icon:`calendarBlank`,label:`tasks.today`},{id:`upcoming`,icon:`calendar`,label:`tasks.upcoming`},{id:`undated`,icon:`tray`,label:`tasks.undated`},{id:`completed`,icon:`checkCircle`,label:`tasks.completed`}],B=class extends r{constructor(...e){super(...e),this.tasks=[],this.lists=[],this.selectedList=`all`,this.selectedCalendar=``,this.searchQuery=``,this.loading=!0,this.loadedScope=``,this.pendingPaths=new Set,this.settling=new Set,this.modalOpen=!1,this.taskToDelete=null,this.scheduling=`email`,this.isSpinning=!1,this.listPromptOpen=!1,this.sidebarWidth=F,this.sidebarCollapsed=!1,this.isSidebarDragging=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.syncTimer=null,this.readEpoch=0,this.mutationEpoch=0,this.handleSettingsChange=()=>{if(!this.settingsStore)return;let e=this.settingsStore.getState();this.sidebarCollapsed=e.sidebarCollapsed,this.syncTimer&&=(clearInterval(this.syncTimer),null),e.checkMailInterval&&e.checkMailInterval>0&&(this.syncTimer=setInterval(()=>void this.fetchTasks(),e.checkMailInterval*60*1e3))},this.handleResize=()=>{this.isMobile=window.innerWidth<=768},this.handleHashChange=()=>{this.parseHash()&&this.fetchTasks()}}static{this.styles=[f,m,s`
            :host {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
            }
            .app-container.collapsed .main-content {
                position: relative;
                z-index: 25;
                border-left: 1px solid var(--border-color, #e5e7eb);
                box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
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
                text-align: left;
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
            .list-dot {
                flex-shrink: 0;
                width: 10px;
                height: 10px;
                margin: 0 4px;
                border-radius: 50%;
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
        `]}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this.handleResize),window.addEventListener(`hashchange`,this.handleHashChange),this.settingsStore&&(this.settingsStore.addEventListener(`change`,this.handleSettingsChange),this.handleSettingsChange()),this.parseHash(),this.fetchTasks()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this.handleResize),window.removeEventListener(`hashchange`,this.handleHashChange),this.settingsStore?.removeEventListener(`change`,this.handleSettingsChange),this.syncTimer&&=(clearInterval(this.syncTimer),null)}get wantedScope(){return this.searchQuery?`all`:k(this.selectedList)}parseHash(){let e=window.location.hash;if(!e.startsWith(`#/tasks`))return!1;let[t,n=``]=e.slice(1).split(`?`),r=t.split(`/`)[2]??``,i=new URLSearchParams(n),a=i.get(`list`)??``,o=i.get(`q`)??``,s=r;return z.some(e=>e.id===r)||(s=`all`,history.replaceState(null,``,this.hashFor(s,a,o))),(s!==this.selectedList||a!==this.selectedCalendar||o!==this.searchQuery)&&(this.settling=new Set),this.selectedList=s,this.selectedCalendar=a,this.searchQuery=o,this.wantedScope!==this.loadedScope}hashFor(e,t,n){let r=new URLSearchParams;t&&r.set(`list`,t),n&&r.set(`q`,n);let i=r.toString();return`#/tasks/${e}${i?`?${i}`:``}`}navigate(e,t=this.selectedCalendar,n=this.searchQuery){let r=this.hashFor(e,t,n);window.location.hash!==r&&(window.location.hash=r)}async fetchTasks(){let e=++this.readEpoch,t=this.mutationEpoch,n=this.wantedScope;this.loading=!0,this.isSpinning=!0;try{let r=await _.fetchTasks(n===`all`?void 0:n);if(e!==this.readEpoch)return;if(t!==this.mutationEpoch){this.fetchTasks();return}this.lists=r.calendars.map(e=>({...e,color:D(e.path)})),this.tasks=r.tasks.map(e=>({...e,color:D(e.calendarPath)})),this.loadedScope=n,this.scheduling=r.scheduling===`server`?`server`:`email`,this.settling=new Set,r.failedCalendars>0&&this.toast(`tasks.someListsFailed`)}catch(t){if(e!==this.readEpoch)return;console.error(`Failed to load tasks`,t),this.failed(`tasks.loadFailed`,t)}finally{e===this.readEpoch&&(this.loading=!1)}}shows(e,t=new Date){if(this.selectedCalendar&&e.calendarPath!==this.selectedCalendar)return!1;let n=this.searchQuery.trim().toLowerCase();return n?e.title.toLowerCase().includes(n)||(e.description??``).toLowerCase().includes(n):v(e,this.selectedList,t)}get visibleTasks(){let e=new Date;return this.tasks.filter(t=>this.shows(t,e)||this.settling.has(t.path))}countFor(e){if(this.loadedScope!==`all`&&this.loadedScope!==k(e))return null;let t=new Date;return this.tasks.filter(n=>(!this.selectedCalendar||n.calendarPath===this.selectedCalendar)&&v(n,e,t)).length}replaceTask(e,t){this.mutationEpoch++;let n={...t,color:D(t.calendarPath)};this.tasks=this.tasks.map(t=>t.path===e?n:t)}async handleToggleComplete(e,t){if(!this.pendingPaths.has(e.path)){this.pendingPaths=new Set(this.pendingPaths).add(e.path),this.settling=new Set(this.settling).add(e.path),this.replaceTask(e.path,{...e,status:t?`completed`:`needs-action`});try{let n=await _.completeTask(e.path,t,this.i18nStore?.getLanguage?.());this.replaceTask(e.path,n),n.sendFailed&&this.toast(`invitations.notTold`),t&&!A(n)&&this.toast(`tasks.movedToNext`,{date:this.formatDue(n)})}catch(t){console.error(`Failed to update task`,t),this.replaceTask(e.path,e),this.failed(`tasks.completeFailed`,t)}finally{let t=new Set(this.pendingPaths);t.delete(e.path),this.pendingPaths=t}}}handleSaved(e){let{task:t,created:n}=e.detail;this.closeModal(),this.mutationEpoch++;let r={...t,color:D(t.calendarPath)};if(this.tasks=n?[r,...this.tasks]:this.tasks.map(e=>e.path===r.path?r:e),!this.shows(r))if(n){let e=this.selectedCalendar===r.calendarPath?this.selectedCalendar:``;this.navigate(A(r)?`completed`:`all`,e,``)}else this.settling=new Set(this.settling).add(r.path)}async confirmDelete(e=!0){let t=this.taskToDelete;if(t){this.taskToDelete=null;try{(await _.deleteTask(t.path,{notify:e,lang:this.i18nStore?.getLanguage?.()}))?.sendFailed&&this.toast(`invitations.notTold`),this.mutationEpoch++,this.tasks=this.tasks.filter(e=>e.path!==t.path)}catch(e){console.error(`Failed to delete task`,e),this.failed(`tasks.deleteFailed`,e)}}}async handleListPromptSubmit(e){this.listPromptOpen=!1;let t=String(e.detail?.name??``).trim();if(t)try{await T.createCalendar(t,[`VTODO`]),await this.fetchTasks()}catch(e){console.error(`Failed to create list`,e),this.failed(`tasks.createListFailed`,e)}}openCreate(){this.editingTask=void 0,this.modalOpen=!0,this.mobileSidebarOpen=!1}openEdit(e){this.editingTask=e,this.modalOpen=!0}closeModal(){this.modalOpen=!1,this.editingTask=void 0}selectList(e){this.mobileSidebarOpen=!1,u(this.renderRoot),this.navigate(e,this.selectedCalendar,``)}selectCalendar(e){this.mobileSidebarOpen=!1,u(this.renderRoot),this.navigate(this.selectedList,this.selectedCalendar===e?``:e,this.searchQuery)}formatDue(e){return w(e,new Date,this.i18nStore?.t(`tasks.today`)??`Today`,O(this.i18nStore?.getLanguage?.()))}failed(e,t){d(t)||this.toast(e)}toast(e,t){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(e,t),duration:5e3}}))}handleSidebarResize(e){let t=e.detail.newWidth,n=t<R;n!==this.sidebarCollapsed&&(this.sidebarCollapsed=n,this.settingsStore?.updateSettings({sidebarCollapsed:n})),this.sidebarWidth=n?F:Math.min(Math.max(t,I),L)}get username(){return this.settingsStore?.getState().loginUsername||``}render(){let t=e=>this.i18nStore?.t(e)??e,n=z.find(e=>e.id===this.selectedList)??z[0],r=this.lists.find(e=>e.path===this.selectedCalendar)?.name??``,i=this.selectedCalendar||this.lists[0]?.path||``;return e`
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
                                >${t(`tasks.addTask`)}</alps-create-button>
                            </alps-toolbar>
                            <alps-sidebar-content class="sidebar-content">
                                <div class="sidebar-scroll-content">
                                    <nav class="smart-lists">
                                        ${z.map(n=>{let r=this.countFor(n.id);return e`
                                                <button
                                                    class="nav-item smart-list ${n.id===this.selectedList&&!this.searchQuery?`active`:``}"
                                                    data-list=${n.id}
                                                    title=${t(n.label)}
                                                    @click=${()=>this.selectList(n.id)}
                                                >
                                                    ${p(n.icon)}
                                                    <span class="label">${t(n.label)}</span>
                                                    ${r?e`<span class="count">${r}</span>`:``}
                                                </button>
                                            `})}
                                    </nav>
                                    ${this.lists.length>0?e`
                                        <div class="calendar-lists">
                                            <alps-sidebar-heading heading=${t(`tasks.lists`)}></alps-sidebar-heading>
                                            ${this.lists.map(t=>e`
                                                <button
                                                    class="nav-item task-list ${t.path===this.selectedCalendar?`active`:``}"
                                                    data-path=${t.path}
                                                    @click=${()=>this.selectCalendar(t.path)}
                                                >
                                                    <span class="list-dot" style="background: ${t.color}"></span>
                                                    <span class="label">${t.name}</span>
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
                            title=${t(`tasks.newList`)}
                            @click=${()=>{this.listPromptOpen=!0}}
                        ></alps-icon-btn>
                    </alps-sidebar>

                    <div class="main-content">
                        <div class="toolbar">
                            <h2>
                                ${this.searchQuery?t(`tasks.searchResults`):t(n.label)}
                                ${r?e`<span class="sub-title">${r}</span>`:``}
                            </h2>
                            <alps-icon-btn
                                icon="arrowsClockwise"
                                title=${t(`mailboxPage.refresh`)}
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

            ${this.listPromptOpen?e`
                <ui-prompt
                    title=${t(`tasks.newList`)}
                    .fields=${[{id:`name`,label:t(`tasks.listName`),autofocus:!0}]}
                    @submit=${this.handleListPromptSubmit}
                    @cancel=${()=>{this.listPromptOpen=!1}}
                ></ui-prompt>
            `:``}

            ${this.taskToDelete&&b(this.taskToDelete,this.scheduling)?e`
                <ui-confirm
                    class="delete-assigned"
                    title=${t(`tasks.deleteTask`)}
                    message=${t(this.taskToDelete.role===`organizer`?`tasks.deleteTellAssignees`:`tasks.deleteTellAssigner`)}
                    confirmText=${t(`invitations.deleteAndTell`)}
                    secondaryText=${t(`invitations.deleteOnly`)}
                    isDanger
                    @confirm=${()=>void this.confirmDelete(!0)}
                    @secondary=${()=>void this.confirmDelete(!1)}
                    @cancel=${()=>{this.taskToDelete=null}}
                ></ui-confirm>
            `:this.taskToDelete?e`
                <ui-confirm
                    title=${t(`tasks.deleteTask`)}
                    message=${t(`tasks.deleteTaskConfirm`)}
                    confirmText=${t(`tasks.delete`)}
                    isDanger
                    @confirm=${()=>void this.confirmDelete()}
                    @cancel=${()=>{this.taskToDelete=null}}
                ></ui-confirm>
            `:``}
        `}};c([o({context:h})],B.prototype,`i18nStore`,void 0),c([o({context:g})],B.prototype,`settingsStore`,void 0),c([t()],B.prototype,`tasks`,void 0),c([t()],B.prototype,`lists`,void 0),c([t()],B.prototype,`selectedList`,void 0),c([t()],B.prototype,`selectedCalendar`,void 0),c([t()],B.prototype,`searchQuery`,void 0),c([t()],B.prototype,`loading`,void 0),c([t()],B.prototype,`loadedScope`,void 0),c([t()],B.prototype,`pendingPaths`,void 0),c([t()],B.prototype,`settling`,void 0),c([t()],B.prototype,`modalOpen`,void 0),c([t()],B.prototype,`editingTask`,void 0),c([t()],B.prototype,`taskToDelete`,void 0),c([t()],B.prototype,`scheduling`,void 0),c([t()],B.prototype,`isSpinning`,void 0),c([t()],B.prototype,`listPromptOpen`,void 0),c([t()],B.prototype,`sidebarWidth`,void 0),c([t()],B.prototype,`sidebarCollapsed`,void 0),c([t()],B.prototype,`isSidebarDragging`,void 0),c([t()],B.prototype,`isMobile`,void 0),c([t()],B.prototype,`mobileSidebarOpen`,void 0),B=c([a(`tasks-page`)],B);export{B as TasksPage};