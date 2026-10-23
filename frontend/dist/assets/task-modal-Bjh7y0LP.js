import{_ as e,d as t,f as n,m as r,p as i,s as a,y as o}from"./lit-CB2iQgdU.js";import{$ as s,F as c,G as l,J as u,Q as d,Y as f,Z as p,q as m,st as h,tt as g}from"./index-iaOWfb9x.js";import"./alps-address-input-Dd_n1OJM.js";function _(e){return e.status===`completed`||e.status===`cancelled`}function v(e){if(!e.due)return null;let t=new Date(e.due);return Number.isNaN(t.getTime())?null:e.allDay?new Date(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate()):t}var y=[`overdue`,`today`,`week`,`undated`,`later`,`completed`];function b(e,t=new Date){if(_(e))return`completed`;let n=v(e);if(!n)return`undated`;let r=new Date(t.getFullYear(),t.getMonth(),t.getDate()),i=new Date(t.getFullYear(),t.getMonth(),t.getDate()+1),a=new Date(t.getFullYear(),t.getMonth(),t.getDate()+7);return n<r?`overdue`:n<i?`today`:n<a?`week`:`later`}function x(e){return e.priority&&e.priority>0?e.priority:10}function S(e,t){let n=v(e)?.getTime()??1/0,r=v(t)?.getTime()??1/0;if(n!==r)return n-r;let i=x(e)-x(t);return i===0?e.title.localeCompare(t.title):i}function C(e,t){let n=v(e)?.getTime(),r=v(t)?.getTime();return n===r?e.title.localeCompare(t.title):n===void 0?1:r===void 0?-1:r-n}function w(e){return!e||e<1?null:e<=4?`high`:e===5?`medium`:`low`}function T(e){if(e)return e===`rs`?`sr-Cyrl`:e===`sr`?`sr-Latn`:e}function E(e,t,n,r){let i=v(e);if(!i)return``;let a=i.getFullYear()===t.getFullYear()&&i.getMonth()===t.getMonth()&&i.getDate()===t.getDate(),o={hour:`2-digit`,minute:`2-digit`},s={month:`short`,day:`numeric`,...i.getFullYear()===t.getFullYear()?{}:{year:`numeric`}};return a?e.allDay?n:i.toLocaleTimeString(r,o):e.allDay?i.toLocaleDateString(r,s):i.toLocaleString(r,{...s,...o})}function D(e){return e===`completed`?`closed`:`active`}function O(e,t,n=new Date){let r=b(e,n);switch(t){case`today`:return r===`overdue`||r===`today`;case`upcoming`:return r===`week`||r===`later`;case`undated`:return r===`undated`;case`completed`:return r===`completed`;default:return r!==`completed`}}var k=new class{async fetchTasks(e){let t=await s(e?`/calendar/tasks?scope=${e}`:`/calendar/tasks`);if(!t.ok)throw new p(t.status,`Failed to fetch tasks`);let n=await t.json();return{tasks:n.tasks??[],calendars:n.calendars??[],failedCalendars:n.failedCalendars??0,scheduling:n.scheduling}}createTask(e){return this.send(`/calendar/tasks`,e,`Failed to create task`)}updateTask(e,t){return this.send(`/calendar/tasks/${d(e)}/edit`,t,`Failed to update task`)}completeTask(e,t,n){return this.send(`/calendar/tasks/${d(e)}/complete`,{done:t,lang:n},`Failed to update task`)}async deleteTask(e,t={}){let n=new URLSearchParams;t.notify===!1&&n.set(`notify`,`0`),t.lang&&n.set(`lang`,t.lang);let r=n.toString()?`?${n.toString()}`:``,i=await s(`/calendar/tasks/${d(e)}${r}`,{method:`DELETE`});if(!i.ok)throw new p(i.status,`Failed to delete task`);return i.json().catch(()=>({}))}async send(e,t,n){let r=await s(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!r.ok)throw new p(r.status,n);return r.json()}};function A(e){return!e.components?.length||e.components.some(e=>e.toUpperCase()===`VEVENT`)}function j(e){let t=e.trim(),n=/^(.*)<([^<>\s]+@[^<>\s]+)>$/.exec(t);if(n){let{name:e}=l(t);return e?{email:n[2],name:e}:{email:n[2]}}return/^[^\s@<>]+@[^\s@<>]+$/.test(t)?{email:t}:null}function M(e){let t=e.name?.replace(/"/g,``).trim();return t?`"${t.replace(/\\/g,`\\\\`)}" <${e.email}>`:e.email}function N(e,t){return!!e&&P({role:e.role,attendees:e.attendees,status:e.answer},t)}function P(e,t){return!e||t===`server`||e.ended?!1:e.role===`organizer`?(e.attendees?.length??0)>0:e.role===`attendee`&&e.status!==`declined`}var F=[`#2563eb`,`#16a34a`,`#d97706`,`#dc2626`,`#9333ea`,`#0891b2`,`#db2777`,`#ea580c`];function I(e){let t=0;for(let n=0;n<e.length;n++)t=e.charCodeAt(n)+((t<<5)-t);return F[Math.abs(t)%F.length]}function L(e){return e.allDay===!0}var R=class{async fetchCalendars(){let e=await s(`/calendar/calendars`);if(!e.ok)throw Error(`Failed to fetch calendars`);return e.json()}async fetchEvents(e,t,n){let r=new URLSearchParams;r.append(`start`,e.toISOString()),r.append(`end`,t.toISOString()),n&&r.append(`query`,n);let i=await s(`/calendar/events?${r.toString()}`);if(!i.ok)throw Error(`Failed to fetch events`);return i.json()}async createCalendar(e,t){let n=await s(`/calendar/calendars`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t?{name:e,components:t}:{name:e})});if(!n.ok)throw new p(n.status,`Failed to create calendar`);return n.json()}async renameCalendar(e,t){let n=await s(`/calendar/calendars/${d(e)}`,{method:`PATCH`,headers:{"Content-Type":`application/json`},body:JSON.stringify({name:t})});if(!n.ok)throw Error(`Failed to rename calendar`);return n.json()}async deleteCalendar(e){let t=await s(`/calendar/calendars/${d(e)}`,{method:`DELETE`});if(!t.ok)throw Error(`Failed to delete calendar`);return t.json()}async createEvent(e){let t=await s(`/calendar/events`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(!t.ok)throw new p(t.status,`Failed to create event`);return t.json()}async updateEvent(e,t){let n=await s(`/calendar/events/${d(e)}/edit`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!n.ok)throw new p(n.status,`Failed to update event`);return n.json()}async respondToEvent(e,t,n){let r=await s(`/calendar/${e.task?`tasks`:`events`}/${d(e.path)}/respond`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({status:t,etag:e.etag,lang:n})});if(!r.ok)throw new p(r.status,`Failed to answer the invitation`);return r.json()}async deleteEvent(e,t={}){let n=d(e),r=new URLSearchParams;t.notify===!1&&r.set(`notify`,`0`),t.lang&&r.set(`lang`,t.lang);let i=await s(`/calendar/events/${n}${r.toString()?`?${r.toString()}`:``}`,{method:`DELETE`});if(!i.ok)throw Error(`Failed to delete event`);return i.json()}},z=e=>`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`;function B(e){let t=[];for(let n of e){let e=v(n);if(!e||_(n))continue;let r=new Date(e.getFullYear(),e.getMonth(),e.getDate()+1);t.push({uid:n.uid,summary:n.title,start:`${z(e)}T00:00:00Z`,end:`${z(r)}T00:00:00Z`,allDay:!0,path:n.path,calendarPath:n.calendarPath,task:n})}return t}function V(e,t=1){let n=new Date(e),r=(n.getDay()-t+7)%7;return n.setDate(n.getDate()-r),n.setHours(0,0,0,0),n}var H=new R,U=[`DAILY`,`WEEKLY`,`MONTHLY`,`YEARLY`];function W(e){return e?U.find(t=>e===`FREQ=${t}`)??`CUSTOM`:``}var G=e=>String(e).padStart(2,`0`),K=class extends r{constructor(...e){super(...e),this.open=!1,this.lists=[],this.defaultList=``,this.scheduling=`email`,this.title=``,this.description=``,this.dueDate=``,this.dueTime=``,this.allDay=!0,this.status=`needs-action`,this.priority=0,this.percent=0,this.repeat=``,this.calendarPath=``,this.saving=!1,this.attendees=[],this.askNotify=!1,this.originalRRule=``,this.openedDue={date:``,time:``,allDay:!0}}static{this.styles=[c,o`
            .form-group {
                margin-bottom: 16px;
                flex: 1;
            }
            .form-group label {
                display: block;
                margin-bottom: 6px;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-primary, #111827);
            }
            .form-row {
                display: flex;
                gap: 12px;
            }
            alps-input,
            alps-select {
                width: 100%;
            }
            .checkbox {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: -8px 0 16px;
                font-size: 14px;
                cursor: pointer;
            }
            input.number,
            textarea {
                width: 100%;
                box-sizing: border-box;
                padding: 8px 12px;
                border: 1px solid var(--border-color, #e5e7eb);
                border-radius: 4px;
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #111827);
                font-family: inherit;
                font-size: 14px;
            }
            textarea {
                min-height: 80px;
                resize: vertical;
            }
            input.number:focus,
            textarea:focus {
                outline: none;
                border-color: var(--accent-color, #2563eb);
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
            }
            .hint {
                font-size: 13px;
                color: var(--text-muted, #6b7280);
            }
            .assigned {
                margin-bottom: 16px;
                font-size: 13px;
                color: var(--text-secondary, #4b5563);
                overflow-wrap: anywhere;
            }
            .assigned .label {
                font-weight: 500;
            }
            .actions {
                display: flex;
                gap: 8px;
                width: 100%;
            }
            .actions .delete {
                margin-right: auto;
            }
        `]}willUpdate(e){e.has(`open`)&&this.open&&this.reset()}reset(){let e=this.task;this.title=e?.title??``,this.description=e?.description??``,this.status=e?.status??`needs-action`,this.priority=e?.priority??0,this.percent=e?.percentComplete??0,this.calendarPath=e?.calendarPath||this.defaultList||this.lists[0]?.path||``,this.originalRRule=e?.rrule??``,this.repeat=W(this.originalRRule),this.dueDate=``,this.dueTime=``,this.allDay=e?.due?e.allDay:!0;let t=e?v(e):null;t&&(this.dueDate=`${t.getFullYear()}-${G(t.getMonth()+1)}-${G(t.getDate())}`,this.allDay||(this.dueTime=`${G(t.getHours())}:${G(t.getMinutes())}`)),this.openedDue={date:this.dueDate,time:this.dueTime,allDay:this.allDay},this.attendees=(e?.attendees??[]).map(M),this.askNotify=!1}get assignedToUser(){return this.task?.role===`attendee`}input(){let e=``,t=this.dueDate===this.openedDue.date&&this.dueTime===this.openedDue.time&&this.allDay===this.openedDue.allDay;this.task&&t?e=this.task.due??``:this.dueDate&&(e=this.allDay?`${this.dueDate}T00:00:00Z`:new Date(`${this.dueDate}T${this.dueTime||`09:00`}`).toISOString());let n=e?this.repeat===`CUSTOM`?this.originalRRule:this.repeat?`FREQ=${this.repeat}`:``:``;return{title:this.title.trim(),description:this.description,due:e,allDay:this.allDay,status:this.status,percentComplete:this.status===`completed`?100:this.percent,priority:this.priority,rrule:n,calendarPath:this.calendarPath,etag:this.task?.etag}}setStatus(e){this.status===`completed`&&e!==`completed`&&this.percent>=100&&(this.percent=0),this.status=e}close(){this.open=!1,this.dispatchEvent(new CustomEvent(`close`))}requestDelete(){this.dispatchEvent(new CustomEvent(`delete`,{detail:{task:this.task}}))}async handleSave(){if(!(this.saving||!this.title.trim()||!this.calendarPath)){if(this.task?.role===`organizer`&&N(this.task,this.scheduling)){this.askNotify=!0;return}await this.save()}}async save(e){this.askNotify=!1,this.saving=!0;try{let t=!this.task,n={...this.input(),attendees:this.assignedToUser?void 0:this.attendees.map(j).filter(e=>e!==null),notify:e,lang:this.i18nStore?.getLanguage?.()},r=this.task?await k.updateTask(this.task.path,n):await k.createTask(n);r?.sendFailed&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`invitations.notTold`),duration:8e3}})),this.open=!1,this.dispatchEvent(new CustomEvent(`saved`,{detail:{task:r,created:t}}))}catch(e){console.error(`Failed to save task`,e);let t=g(e);t&&this.dispatchEvent(new CustomEvent(`conflict`)),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(t?`tasks.saveConflict`:`tasks.saveFailed`),duration:8e3}}))}finally{this.saving=!1}}priorityOptions(){let e=e=>this.i18nStore?.t(e)??e,t=[{value:`0`,label:e(`tasks.priorities.none`)},{value:`1`,label:e(`tasks.priorities.high`)},{value:`5`,label:e(`tasks.priorities.medium`)},{value:`9`,label:e(`tasks.priorities.low`)}];if(!t.some(e=>e.value===String(this.priority))){let n=this.priority<=4?`tasks.priorities.high`:this.priority===5?`tasks.priorities.medium`:`tasks.priorities.low`;t.push({value:String(this.priority),label:e(n)})}return t}render(){if(!this.open)return e``;let t=e=>this.i18nStore?.t(e)??e,n=!!this.dueDate,r=this.task;return e`
            <ui-modal
                title=${t(r?`tasks.editTask`:`tasks.newTask`)}
                width="460px"
                ?dismissible=${!this.saving}
                @cancel=${this.close}
            >
                <div class="form-group">
                    <label>${t(`tasks.titleField`)}</label>
                    <alps-input
                        label=${t(`tasks.titleField`)}
                        class="title-input"
                        .value=${this.title}
                        placeholder=${t(`tasks.titlePlaceholder`)}
                        @input=${e=>{this.title=e.target.value}}
                    ></alps-input>
                </div>

                ${!r&&this.lists.length>1?e`
                    <div class="form-group">
                        <label>${t(`tasks.list`)}</label>
                        <alps-select
                            class="list-select"
                            label=${t(`tasks.list`)}
                            .value=${this.calendarPath}
                            .options=${this.lists.map(e=>({value:e.path,label:e.name}))}
                            @change=${e=>{this.calendarPath=e.target.value}}
                        ></alps-select>
                    </div>
                `:``}

                <div class="form-row">
                    <div class="form-group">
                        <label>${t(`tasks.due`)}</label>
                        <alps-input
                            label=${t(`tasks.due`)}
                            class="due-date"
                            type="date"
                            .value=${this.dueDate}
                            @input=${e=>{this.dueDate=e.target.value}}
                        ></alps-input>
                    </div>
                    ${n&&!this.allDay?e`
                        <div class="form-group">
                            <label>${t(`tasks.time`)}</label>
                            <alps-input
                                label=${t(`tasks.time`)}
                                class="due-time"
                                type="time"
                                .value=${this.dueTime}
                                @input=${e=>{this.dueTime=e.target.value}}
                            ></alps-input>
                        </div>
                    `:``}
                </div>
                ${n?e`
                    <label class="checkbox">
                        <input
                            class="all-day"
                            type="checkbox"
                            .checked=${this.allDay}
                            @change=${e=>{this.allDay=e.target.checked,!this.allDay&&!this.dueTime&&(this.dueTime=`09:00`)}}
                        />
                        ${t(`tasks.allDay`)}
                    </label>
                `:``}

                <div class="form-row">
                    ${r?e`
                        <div class="form-group">
                            <label>${t(`tasks.status`)}</label>
                            <alps-select
                                class="status-select"
                                label=${t(`tasks.status`)}
                                .value=${this.status}
                                .options=${[{value:`needs-action`,label:t(`tasks.statuses.needsAction`)},{value:`in-process`,label:t(`tasks.statuses.inProcess`)},{value:`completed`,label:t(`tasks.statuses.completed`)},{value:`cancelled`,label:t(`tasks.statuses.cancelled`)}]}
                                @change=${e=>this.setStatus(e.target.value)}
                            ></alps-select>
                        </div>
                    `:``}
                    <div class="form-group">
                        <label>${t(`tasks.priority`)}</label>
                        <alps-select
                            class="priority-select"
                            label=${t(`tasks.priority`)}
                            .value=${String(this.priority)}
                            .options=${this.priorityOptions()}
                            @change=${e=>{this.priority=Number(e.target.value)}}
                        ></alps-select>
                    </div>
                </div>

                <div class="form-row">
                    ${r?e`
                        <div class="form-group">
                            <label for="task-percent">${t(`tasks.percentComplete`)}</label>
                            <input
                                id="task-percent"
                                class="number"
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                .value=${String(this.status===`completed`?100:this.percent)}
                                ?disabled=${this.status===`completed`}
                                @change=${e=>{let t=Number(e.target.value);this.percent=Math.max(0,Math.min(100,Math.round(t||0)))}}
                            />
                        </div>
                    `:``}
                    <div class="form-group">
                        <label>${t(`tasks.repeat`)}</label>
                        ${n?e`
                            <alps-select
                                class="repeat-select"
                                label=${t(`tasks.repeat`)}
                                .value=${this.repeat}
                                .options=${[{value:``,label:t(`calendar.repeatNone`)},{value:`DAILY`,label:t(`calendar.repeatDaily`)},{value:`WEEKLY`,label:t(`calendar.repeatWeekly`)},{value:`MONTHLY`,label:t(`calendar.repeatMonthly`)},{value:`YEARLY`,label:t(`calendar.repeatYearly`)},...this.repeat===`CUSTOM`?[{value:`CUSTOM`,label:t(`calendar.repeatCustom`)}]:[]]}
                                @change=${e=>{this.repeat=e.target.value}}
                            ></alps-select>
                        `:e`<div class="hint">${t(`tasks.repeatNeedsDue`)}</div>`}
                    </div>
                </div>

                <div class="form-group">
                    <label>${t(`tasks.notes`)}</label>
                    <textarea
                        .value=${this.description}
                        placeholder=${t(`tasks.addNotes`)}
                        @input=${e=>{this.description=e.target.value}}
                    ></textarea>
                </div>

                ${this.assignedToUser?e`
                    <div class="assigned">
                        <div><span class="label">${t(`tasks.assignedBy`)}:</span> ${r?.organizer?f(r.organizer.name,r.organizer.email):``}</div>
                    </div>
                `:e`
                    <div class="form-group">
                        <label>${t(`tasks.assignTo`)}</label>
                        <alps-address-input
                            class="assignees"
                            label=${t(`tasks.assignTo`)}
                            .addresses=${this.attendees}
                            @addresses-changed=${e=>{this.attendees=e.detail.addresses}}
                        ></alps-address-input>
                    </div>
                    ${r?.role===`organizer`&&r.attendees?.length?e`
                        <div class="assigned answers">
                            ${r.attendees.map(n=>e`<div>${f(n.name,n.email)}: ${t(`invitations.statuses.${m(n.status)}`)}</div>`)}
                        </div>
                    `:``}
                `}

                <div slot="actions" class="actions">
                    ${r?e`
                        <alps-button class="delete" variant="danger" ?disabled=${this.saving} @click=${this.requestDelete}>
                            ${t(`tasks.delete`)}
                        </alps-button>
                    `:``}
                    <alps-button variant="text" ?disabled=${this.saving} @click=${this.close}>${t(`general.cancel`)}</alps-button>
                    <alps-button
                        class="save"
                        variant="primary"
                        ?disabled=${this.saving||!this.title.trim()||!this.calendarPath}
                        ?spinning=${this.saving}
                        @click=${this.handleSave}
                    >${t(`general.save`)}</alps-button>
                </div>
            </ui-modal>

            ${this.askNotify?e`
                <ui-confirm
                    title=${t(`invitations.notifyTitle`)}
                    message=${t(`tasks.notifyChanges`)}
                    confirmText=${t(`invitations.send`)}
                    secondaryText=${t(`invitations.dontSend`)}
                    @confirm=${()=>this.save(!0)}
                    @secondary=${()=>this.save(!1)}
                    @cancel=${()=>{this.askNotify=!1}}
                ></ui-confirm>
            `:``}
        `}};u([a({context:h})],K.prototype,`i18nStore`,void 0),u([n({type:Boolean})],K.prototype,`open`,void 0),u([n({attribute:!1})],K.prototype,`task`,void 0),u([n({type:Array})],K.prototype,`lists`,void 0),u([n({type:String})],K.prototype,`defaultList`,void 0),u([n({type:String})],K.prototype,`scheduling`,void 0),u([t()],K.prototype,`title`,void 0),u([t()],K.prototype,`description`,void 0),u([t()],K.prototype,`dueDate`,void 0),u([t()],K.prototype,`dueTime`,void 0),u([t()],K.prototype,`allDay`,void 0),u([t()],K.prototype,`status`,void 0),u([t()],K.prototype,`priority`,void 0),u([t()],K.prototype,`percent`,void 0),u([t()],K.prototype,`repeat`,void 0),u([t()],K.prototype,`calendarPath`,void 0),u([t()],K.prototype,`saving`,void 0),u([t()],K.prototype,`attendees`,void 0),u([t()],K.prototype,`askNotify`,void 0),K=u([i(`task-modal`)],K);export{k as S,O as _,L as a,w as b,N as c,y as d,C as f,b as g,E as h,A as i,P as l,v as m,H as n,j as o,S as p,I as r,B as s,M as t,V as u,T as v,D as x,_ as y};