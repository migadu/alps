import{b as e,c as t,f as n,h as r,m as i,p as a,s as o,v as s}from"./lit-Br1cDwGJ.js";import{V as c,X as l,Z as u,c as d,ct as f,l as p,lt as m,nt as h,s as g}from"./index-CproRosE.js";import{S as _,_ as v,b as y,c as b,d as x,f as S,g as C,h as w,n as T,p as E,r as D,v as O,x as k,y as A}from"./task-modal-Ds6wjHUx.js";var j={overdue:`tasks.groups.overdue`,today:`tasks.groups.today`,week:`tasks.groups.week`,undated:`tasks.groups.undated`,later:`tasks.groups.later`,completed:`tasks.groups.completed`},M={high:`tasks.priorities.high`,medium:`tasks.priorities.medium`,low:`tasks.priorities.low`},N={high:`!!!`,medium:`!!`,low:`!`},P=class extends r{constructor(...e){super(...e),this.tasks=[],this.pendingPaths=new Set,this.settling=new Set,this.searching=!1,this.loading=!1,this.focusedIndex=-1}static{this.styles=e`
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
    `}groups(){let e=this.now??new Date,t=new Map;for(let n of this.tasks){let r=this.settling.has(n.path)?C({...n,status:`needs-action`},e):C(n,e),i=t.get(r);i?i.push(n):t.set(r,[n])}for(let[e,n]of t)n.sort(e===`completed`?S:E);return x.filter(e=>t.has(e)).map(e=>[e,t.get(e)])}toggle(e){this.pendingPaths.has(e.path)||this.dispatchEvent(new CustomEvent(`toggle-complete`,{detail:{task:e,done:e.status!==`completed`}}))}open(e){this.dispatchEvent(new CustomEvent(`open-task`,{detail:{task:e}}))}handleKeyDown(e){if(e.target!==e.currentTarget)return;let t=this.groups().flatMap(([,e])=>e);if(t.length===0)return;let n=Math.min(this.focusedIndex,t.length-1);switch(e.key){case`ArrowDown`:this.focusedIndex=Math.min(t.length-1,n+1);break;case`ArrowUp`:this.focusedIndex=Math.max(0,n-1);break;case`Home`:this.focusedIndex=0;break;case`End`:this.focusedIndex=t.length-1;break;case`Enter`:if(n<0)return;e.preventDefault(),this.open(t[n]);return;case` `:if(n<0)return;e.preventDefault(),this.toggle(t[n]);return;default:return}e.preventDefault(),this.updateComplete.then(()=>{this.renderRoot.querySelector(`.row.focused`)?.scrollIntoView?.({block:`nearest`})})}renderRow(e,t,n){let r=e=>this.i18nStore?.t(e)??e,i=e.status===`completed`,a=e.status===`cancelled`,o=y(e.priority),c=this.now??new Date;return s`
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
                    ${i?f(`check`):``}
                </button>
                <div class="body">
                    <div class="title">${e.title||r(`tasks.untitled`)}</div>
                    <div class="meta">
                        ${e.color?s`<span class="dot" style="background: ${e.color}"></span>`:``}
                        ${a?s`<span class="chip">${r(`tasks.statuses.cancelled`)}</span>`:``}
                        ${e.due?s`<span class="due ${n===`overdue`?`overdue`:``}">${w(e,c,r(`tasks.today`),O(this.i18nStore?.getLanguage?.()))}</span>`:``}
                        ${e.rrule?s`<span class="repeats" role="img" aria-label=${r(`tasks.repeats`)} title=${r(`tasks.repeats`)}>${f(`arrowsClockwise`)}</span>`:``}
                        ${e.role===`attendee`&&e.organizer?s`<span class="assigned">${r(`tasks.assignedBy`)} ${u(e.organizer.name,e.organizer.email)}</span>`:e.role===`organizer`&&e.attendees?.length?s`<span class="assigned">${r(`tasks.assignedTo`)} ${e.attendees.map((e,t)=>s`${t?`, `:``}${u(e.name,e.email)}`)}</span>`:``}
                        ${o?s`<span class="priority ${o}" role="img" aria-label=${r(M[o])} title=${r(M[o])}>${N[o]}</span>`:``}
                    </div>
                </div>
            </div>
        `}render(){if(this.loading&&this.tasks.length===0)return s`<div class="empty"><alps-loader></alps-loader></div>`;let e=this.groups();if(e.length===0)return s`<div class="empty">${this.i18nStore?.t(this.searching?`tasks.noResults`:`tasks.noTasks`)}</div>`;let t=-1;return s`
            <div class="scroll" tabindex="0" @keydown=${this.handleKeyDown}>
                ${e.map(([e,n])=>s`
                        <div class="group ${e}">${this.i18nStore?.t(j[e])}</div>
                        ${o(n,e=>e.path,n=>this.renderRow(n,++t,e))}
                    `)}
            </div>
        `}};l([t({context:m})],P.prototype,`i18nStore`,void 0),l([a({type:Array})],P.prototype,`tasks`,void 0),l([a({attribute:!1})],P.prototype,`pendingPaths`,void 0),l([a({attribute:!1})],P.prototype,`settling`,void 0),l([a({type:Boolean})],P.prototype,`searching`,void 0),l([a({type:Boolean})],P.prototype,`loading`,void 0),l([a({attribute:!1})],P.prototype,`now`,void 0),l([n()],P.prototype,`focusedIndex`,void 0),P=l([i(`tasks-list`)],P);var F=250,I=150,L=500,R=120,z=[{id:`all`,icon:`listBullets`,label:`tasks.allTasks`},{id:`today`,icon:`calendarBlank`,label:`tasks.today`},{id:`upcoming`,icon:`calendar`,label:`tasks.upcoming`},{id:`undated`,icon:`tray`,label:`tasks.undated`},{id:`completed`,icon:`checkCircle`,label:`tasks.completed`}],B=class extends r{constructor(...e){super(...e),this.tasks=[],this.lists=[],this.selectedList=`all`,this.selectedCalendar=``,this.searchQuery=``,this.loading=!0,this.loadedScope=``,this.pendingPaths=new Set,this.settling=new Set,this.modalOpen=!1,this.taskToDelete=null,this.scheduling=`email`,this.isSpinning=!1,this.listPromptOpen=!1,this.sidebarWidth=F,this.sidebarCollapsed=!1,this.isSidebarDragging=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.syncTimer=null,this.readEpoch=0,this.mutationEpoch=0,this.handleSettingsChange=()=>{if(!this.settingsStore)return;let e=this.settingsStore.getState();this.sidebarCollapsed=e.sidebarCollapsed,this.syncTimer&&=(clearInterval(this.syncTimer),null),e.checkMailInterval&&e.checkMailInterval>0&&(this.syncTimer=setInterval(()=>void this.fetchTasks(),e.checkMailInterval*60*1e3))},this.handleResize=()=>{this.isMobile=window.innerWidth<=768},this.handleHashChange=()=>{this.parseHash()&&this.fetchTasks()}}static{this.styles=[p,g,e`
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
        `]}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this.handleResize),window.addEventListener(`hashchange`,this.handleHashChange),this.settingsStore&&(this.settingsStore.addEventListener(`change`,this.handleSettingsChange),this.handleSettingsChange()),this.parseHash(),this.fetchTasks()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this.handleResize),window.removeEventListener(`hashchange`,this.handleHashChange),this.settingsStore?.removeEventListener(`change`,this.handleSettingsChange),this.syncTimer&&=(clearInterval(this.syncTimer),null)}get wantedScope(){return this.searchQuery?`all`:k(this.selectedList)}parseHash(){let e=window.location.hash;if(!e.startsWith(`#/tasks`))return!1;let[t,n=``]=e.slice(1).split(`?`),r=t.split(`/`)[2]??``,i=new URLSearchParams(n),a=i.get(`list`)??``,o=i.get(`q`)??``,s=r;return z.some(e=>e.id===r)||(s=`all`,history.replaceState(null,``,this.hashFor(s,a,o))),(s!==this.selectedList||a!==this.selectedCalendar||o!==this.searchQuery)&&(this.settling=new Set),this.selectedList=s,this.selectedCalendar=a,this.searchQuery=o,this.wantedScope!==this.loadedScope}hashFor(e,t,n){let r=new URLSearchParams;t&&r.set(`list`,t),n&&r.set(`q`,n);let i=r.toString();return`#/tasks/${e}${i?`?${i}`:``}`}navigate(e,t=this.selectedCalendar,n=this.searchQuery){let r=this.hashFor(e,t,n);window.location.hash!==r&&(window.location.hash=r)}async fetchTasks(){let e=++this.readEpoch,t=this.mutationEpoch,n=this.wantedScope;this.loading=!0,this.isSpinning=!0;try{let r=await _.fetchTasks(n===`all`?void 0:n);if(e!==this.readEpoch)return;if(t!==this.mutationEpoch){this.fetchTasks();return}this.lists=r.calendars.map(e=>({...e,color:D(e.path)})),this.tasks=r.tasks.map(e=>({...e,color:D(e.calendarPath)})),this.loadedScope=n,this.scheduling=r.scheduling===`server`?`server`:`email`,this.settling=new Set,r.failedCalendars>0&&this.toast(`tasks.someListsFailed`)}catch(t){if(e!==this.readEpoch)return;console.error(`Failed to load tasks`,t),this.failed(`tasks.loadFailed`,t)}finally{e===this.readEpoch&&(this.loading=!1)}}shows(e,t=new Date){if(this.selectedCalendar&&e.calendarPath!==this.selectedCalendar)return!1;let n=this.searchQuery.trim().toLowerCase();return n?e.title.toLowerCase().includes(n)||(e.description??``).toLowerCase().includes(n):v(e,this.selectedList,t)}get visibleTasks(){let e=new Date;return this.tasks.filter(t=>this.shows(t,e)||this.settling.has(t.path))}countFor(e){if(this.loadedScope!==`all`&&this.loadedScope!==k(e))return null;let t=new Date;return this.tasks.filter(n=>(!this.selectedCalendar||n.calendarPath===this.selectedCalendar)&&v(n,e,t)).length}replaceTask(e,t){this.mutationEpoch++;let n={...t,color:D(t.calendarPath)};this.tasks=this.tasks.map(t=>t.path===e?n:t)}async handleToggleComplete(e,t){if(!this.pendingPaths.has(e.path)){this.pendingPaths=new Set(this.pendingPaths).add(e.path),this.settling=new Set(this.settling).add(e.path),this.replaceTask(e.path,{...e,status:t?`completed`:`needs-action`});try{let n=await _.completeTask(e.path,t,this.i18nStore?.getLanguage?.());this.replaceTask(e.path,n),n.sendFailed&&this.toast(`invitations.notTold`),t&&!A(n)&&this.toast(`tasks.movedToNext`,{date:this.formatDue(n)})}catch(t){console.error(`Failed to update task`,t),this.replaceTask(e.path,e),this.failed(`tasks.completeFailed`,t)}finally{let t=new Set(this.pendingPaths);t.delete(e.path),this.pendingPaths=t}}}handleSaved(e){let{task:t,created:n}=e.detail;this.closeModal(),this.mutationEpoch++;let r={...t,color:D(t.calendarPath)};if(this.tasks=n?[r,...this.tasks]:this.tasks.map(e=>e.path===r.path?r:e),!this.shows(r))if(n){let e=this.selectedCalendar===r.calendarPath?this.selectedCalendar:``;this.navigate(A(r)?`completed`:`all`,e,``)}else this.settling=new Set(this.settling).add(r.path)}async confirmDelete(e=!0){let t=this.taskToDelete;if(t){this.taskToDelete=null;try{(await _.deleteTask(t.path,{notify:e,lang:this.i18nStore?.getLanguage?.()}))?.sendFailed&&this.toast(`invitations.notTold`),this.mutationEpoch++,this.tasks=this.tasks.filter(e=>e.path!==t.path)}catch(e){console.error(`Failed to delete task`,e),this.failed(`tasks.deleteFailed`,e)}}}async handleListPromptSubmit(e){this.listPromptOpen=!1;let t=String(e.detail?.name??``).trim();if(t)try{await T.createCalendar(t,[`VTODO`]),await this.fetchTasks()}catch(e){console.error(`Failed to create list`,e),this.failed(`tasks.createListFailed`,e)}}openCreate(){this.editingTask=void 0,this.modalOpen=!0,this.mobileSidebarOpen=!1}openEdit(e){this.editingTask=e,this.modalOpen=!0}closeModal(){this.modalOpen=!1,this.editingTask=void 0}selectList(e){this.mobileSidebarOpen=!1,d(this.renderRoot),this.navigate(e,this.selectedCalendar,``)}selectCalendar(e){this.mobileSidebarOpen=!1,d(this.renderRoot),this.navigate(this.selectedList,this.selectedCalendar===e?``:e,this.searchQuery)}formatDue(e){return w(e,new Date,this.i18nStore?.t(`tasks.today`)??`Today`,O(this.i18nStore?.getLanguage?.()))}failed(e,t){h(t)||this.toast(e)}toast(e,t){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(e,t),duration:5e3}}))}handleSidebarResize(e){let t=e.detail.newWidth,n=t<R;n!==this.sidebarCollapsed&&(this.sidebarCollapsed=n,this.settingsStore?.updateSettings({sidebarCollapsed:n})),this.sidebarWidth=n?F:Math.min(Math.max(t,I),L)}get username(){return this.settingsStore?.getState().loginUsername||``}render(){let e=e=>this.i18nStore?.t(e)??e,t=z.find(e=>e.id===this.selectedList)??z[0],n=this.lists.find(e=>e.path===this.selectedCalendar)?.name??``,r=this.selectedCalendar||this.lists[0]?.path||``;return s`
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
                            <alps-sidebar-content class="sidebar-content">
                                <div class="sidebar-scroll-content">
                                    <nav class="smart-lists">
                                        ${z.map(t=>{let n=this.countFor(t.id);return s`
                                                <button
                                                    class="nav-item smart-list ${t.id===this.selectedList&&!this.searchQuery?`active`:``}"
                                                    data-list=${t.id}
                                                    title=${e(t.label)}
                                                    @click=${()=>this.selectList(t.id)}
                                                >
                                                    ${f(t.icon)}
                                                    <span class="label">${e(t.label)}</span>
                                                    ${n?s`<span class="count">${n}</span>`:``}
                                                </button>
                                            `})}
                                    </nav>
                                    ${this.lists.length>0?s`
                                        <div class="calendar-lists">
                                            <alps-sidebar-heading heading=${e(`tasks.lists`)}></alps-sidebar-heading>
                                            ${this.lists.map(e=>s`
                                                <button
                                                    class="nav-item task-list ${e.path===this.selectedCalendar?`active`:``}"
                                                    data-path=${e.path}
                                                    @click=${()=>this.selectCalendar(e.path)}
                                                >
                                                    <span class="list-dot" style="background: ${e.color}"></span>
                                                    <span class="label">${e.name}</span>
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
                                ${n?s`<span class="sub-title">${n}</span>`:``}
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
                .defaultList=${r}
                .scheduling=${this.scheduling}
                @close=${()=>this.closeModal()}
                @saved=${this.handleSaved}
                @conflict=${()=>void this.fetchTasks()}
                @delete=${e=>{this.closeModal(),this.taskToDelete=e.detail.task}}
            ></task-modal>

            ${this.listPromptOpen?s`
                <ui-prompt
                    heading=${e(`tasks.newList`)}
                    .fields=${[{id:`name`,label:e(`tasks.listName`),autofocus:!0}]}
                    @submit=${this.handleListPromptSubmit}
                    @cancel=${()=>{this.listPromptOpen=!1}}
                ></ui-prompt>
            `:``}

            ${this.taskToDelete&&b(this.taskToDelete,this.scheduling)?s`
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
            `:this.taskToDelete?s`
                <ui-confirm
                    heading=${e(`tasks.deleteTask`)}
                    message=${e(`tasks.deleteTaskConfirm`)}
                    confirmText=${e(`tasks.delete`)}
                    isDanger
                    @confirm=${()=>void this.confirmDelete()}
                    @cancel=${()=>{this.taskToDelete=null}}
                ></ui-confirm>
            `:``}
        `}};l([t({context:m})],B.prototype,`i18nStore`,void 0),l([t({context:c})],B.prototype,`settingsStore`,void 0),l([n()],B.prototype,`tasks`,void 0),l([n()],B.prototype,`lists`,void 0),l([n()],B.prototype,`selectedList`,void 0),l([n()],B.prototype,`selectedCalendar`,void 0),l([n()],B.prototype,`searchQuery`,void 0),l([n()],B.prototype,`loading`,void 0),l([n()],B.prototype,`loadedScope`,void 0),l([n()],B.prototype,`pendingPaths`,void 0),l([n()],B.prototype,`settling`,void 0),l([n()],B.prototype,`modalOpen`,void 0),l([n()],B.prototype,`editingTask`,void 0),l([n()],B.prototype,`taskToDelete`,void 0),l([n()],B.prototype,`scheduling`,void 0),l([n()],B.prototype,`isSpinning`,void 0),l([n()],B.prototype,`listPromptOpen`,void 0),l([n()],B.prototype,`sidebarWidth`,void 0),l([n()],B.prototype,`sidebarCollapsed`,void 0),l([n()],B.prototype,`isSidebarDragging`,void 0),l([n()],B.prototype,`isMobile`,void 0),l([n()],B.prototype,`mobileSidebarOpen`,void 0),B=l([i(`tasks-page`)],B);export{B as TasksPage};