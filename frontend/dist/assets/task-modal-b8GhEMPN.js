import{d as e,f as t,g as n,l as r,u as i,x as a,y as o}from"./lit-CBBf5Ahu.js";import{Dt as s,Et as c,Nt as l,X as u,ct as d,dt as f,ft as p,gt as m,it as h,lt as g,mt as _,ot as v,ut as y}from"./index-JB8xp_C5.js";import"./alps-address-input--sXFqotK.js";function b(e){return e.status===`completed`||e.status===`cancelled`}function x(e){if(!e.due)return null;let t=new Date(e.due);return Number.isNaN(t.getTime())?null:e.allDay?new Date(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate()):t}var S=[`overdue`,`today`,`week`,`undated`,`later`,`completed`];function C(e,t=new Date){if(b(e))return`completed`;let n=x(e);if(!n)return`undated`;let r=new Date(t.getFullYear(),t.getMonth(),t.getDate()),i=new Date(t.getFullYear(),t.getMonth(),t.getDate()+1),a=new Date(t.getFullYear(),t.getMonth(),t.getDate()+7);return n<r?`overdue`:n<i?`today`:n<a?`week`:`later`}function w(e){return e.priority&&e.priority>0?e.priority:10}function T(e,t){let n=x(e)?.getTime()??1/0,r=x(t)?.getTime()??1/0;if(n!==r)return n-r;let i=w(e)-w(t);return i===0?e.title.localeCompare(t.title):i}function E(e,t){let n=x(e)?.getTime(),r=x(t)?.getTime();return n===r?e.title.localeCompare(t.title):n===void 0?1:r===void 0?-1:r-n}function D(e){return!e||e<1?null:e<=4?`high`:e===5?`medium`:`low`}function O(e){if(e)return e===`rs`?`sr-Cyrl`:e===`sr`?`sr-Latn`:e}function k(e,t,n,r,i){let a=x(e);if(!a)return``;let o=a.getFullYear()===t.getFullYear()&&a.getMonth()===t.getMonth()&&a.getDate()===t.getDate(),s={hour:`2-digit`,minute:`2-digit`,hour12:l(i)===`12`},c={month:`short`,day:`numeric`,...a.getFullYear()===t.getFullYear()?{}:{year:`numeric`}};return o?e.allDay?n:a.toLocaleTimeString(r,s):e.allDay?a.toLocaleDateString(r,c):a.toLocaleString(r,{...c,...s})}function A(e){return e===`completed`?`closed`:`active`}function j(e,t,n=new Date){let r=C(e,n);switch(t){case`today`:return r===`overdue`||r===`today`;case`upcoming`:return r===`week`||r===`later`;case`undated`:return r===`undated`;case`completed`:return r===`completed`;default:return r!==`completed`}}var M=new class{async fetchTasks(e){let t=await p(e?`/calendar/tasks?scope=${e}`:`/calendar/tasks`);if(!t.ok)throw new y(t.status,`Failed to fetch tasks`);let n=await t.json();return{tasks:n.tasks??[],calendars:n.calendars??[],failedCalendars:n.failedCalendars??0,scheduling:n.scheduling}}createTask(e){return this.send(`/calendar/tasks`,e,`Failed to create task`)}updateTask(e,t){return this.send(`/calendar/tasks/${f(e)}/edit`,t,`Failed to update task`)}completeTask(e,t,n){return this.send(`/calendar/tasks/${f(e)}/complete`,{done:t,lang:n},`Failed to update task`)}async deleteTask(e,t={}){let n=new URLSearchParams;t.notify===!1&&n.set(`notify`,`0`),t.lang&&n.set(`lang`,t.lang);let r=n.toString()?`?${n.toString()}`:``,i=await p(`/calendar/tasks/${f(e)}${r}`,{method:`DELETE`});if(!i.ok)throw new y(i.status,`Failed to delete task`);return i.json().catch(()=>({}))}async send(e,t,n){let r=await p(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!r.ok)throw new y(r.status,n);return r.json()}};function N(e){return!e.components?.length||e.components.some(e=>e.toUpperCase()===`VEVENT`)}function P(e){let t=e.trim(),n=/^(.*)<([^<>\s]+@[^<>\s]+)>$/.exec(t);if(n){let{name:e}=h(t);return e?{email:n[2],name:e}:{email:n[2]}}return/^[^\s@<>]+@[^\s@<>]+$/.test(t)?{email:t}:null}function F(e){let t=e.name?.replace(/"/g,``).trim();return t?`"${t.replace(/\\/g,`\\\\`)}" <${e.email}>`:e.email}function I(e,t){return!!e&&L({role:e.role,attendees:e.attendees,status:e.answer},t)}function L(e,t){return!e||t===`server`||e.ended?!1:e.role===`organizer`?(e.attendees?.length??0)>0:e.role===`attendee`&&e.status!==`declined`}var R=[`#2563eb`,`#16a34a`,`#d97706`,`#dc2626`,`#9333ea`,`#0891b2`,`#db2777`,`#ea580c`];function z(e){let t=0;for(let n=0;n<e.length;n++)t=e.charCodeAt(n)+((t<<5)-t);return R[Math.abs(t)%R.length]}function B(e){return e.allDay===!0}var V=class{async fetchCalendars(){let e=await p(`/calendar/calendars`);if(!e.ok)throw Error(`Failed to fetch calendars`);return e.json()}async fetchEvents(e,t,n){let r=new URLSearchParams;r.append(`start`,e.toISOString()),r.append(`end`,t.toISOString()),n&&r.append(`query`,n);let i=await p(`/calendar/events?${r.toString()}`);if(!i.ok)throw Error(`Failed to fetch events`);return i.json()}async createCalendar(e,t){let n=await p(`/calendar/calendars`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t?{name:e,components:t}:{name:e})});if(!n.ok)throw new y(n.status,`Failed to create calendar`);return n.json()}async renameCalendar(e,t){let n=await p(`/calendar/calendars/${f(e)}`,{method:`PATCH`,headers:{"Content-Type":`application/json`},body:JSON.stringify({name:t})});if(!n.ok)throw Error(`Failed to rename calendar`);return n.json()}async deleteCalendar(e){let t=await p(`/calendar/calendars/${f(e)}`,{method:`DELETE`});if(!t.ok)throw Error(`Failed to delete calendar`);return t.json()}async createEvent(e){let t=await p(`/calendar/events`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(!t.ok)throw new y(t.status,`Failed to create event`);return t.json()}async updateEvent(e,t){let n=await p(`/calendar/events/${f(e)}/edit`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!n.ok)throw new y(n.status,`Failed to update event`);return n.json()}async respondToEvent(e,t,n){let r=await p(`/calendar/${e.task?`tasks`:`events`}/${f(e.path)}/respond`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({status:t,etag:e.etag,lang:n})});if(!r.ok)throw new y(r.status,`Failed to answer the invitation`);return r.json()}async deleteEvent(e,t={}){let n=f(e),r=new URLSearchParams;t.notify===!1&&r.set(`notify`,`0`),t.lang&&r.set(`lang`,t.lang);let i=await p(`/calendar/events/${n}${r.toString()?`?${r.toString()}`:``}`,{method:`DELETE`});if(!i.ok)throw Error(`Failed to delete event`);return i.json()}},H=e=>`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`;function U(e){let t=[];for(let n of e){let e=x(n);if(!e||b(n))continue;let r=new Date(e.getFullYear(),e.getMonth(),e.getDate()+1);t.push({uid:n.uid,summary:n.title,start:`${H(e)}T00:00:00Z`,end:`${H(r)}T00:00:00Z`,allDay:!0,path:n.path,calendarPath:n.calendarPath,task:n})}return t}function W(e,t=1){let n=new Date(e),r=(n.getDay()-t+7)%7;return n.setDate(n.getDate()-r),n.setHours(0,0,0,0),n}var G=new V,K=[`DAILY`,`WEEKLY`,`MONTHLY`,`YEARLY`];function q(e){return e?K.find(t=>e===`FREQ=${t}`)??`CUSTOM`:``}var J=e=>String(e).padStart(2,`0`),Y=class extends n{constructor(...e){super(...e),this.open=!1,this.lists=[],this.defaultList=``,this.scheduling=`email`,this.title=``,this.description=``,this.dueDate=``,this.dueTime=``,this.allDay=!0,this.status=`needs-action`,this.priority=0,this.percent=0,this.repeat=``,this.calendarPath=``,this.saving=!1,this.attendees=[],this.askNotify=!1,this.originalRRule=``,this.openedDue={date:``,time:``,allDay:!0}}static{this.styles=[g,u,a`
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
            /* The transparent outline paints nothing here; forced colors,
               which drop the border colour and the shadow, give it a system
               colour. */
            input.number:focus,
            textarea:focus {
                outline: 2px solid transparent;
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
                margin-inline-end: auto;
            }
        `]}willUpdate(e){e.has(`open`)&&this.open&&this.reset()}reset(){let e=this.task;this.title=e?.title??``,this.description=e?.description??``,this.status=e?.status??`needs-action`,this.priority=e?.priority??0,this.percent=e?.percentComplete??0,this.calendarPath=e?.calendarPath||this.defaultList||this.lists[0]?.path||``,this.originalRRule=e?.rrule??``,this.repeat=q(this.originalRRule),this.dueDate=``,this.dueTime=``,this.allDay=e?.due?e.allDay:!0;let t=e?x(e):null;t&&(this.dueDate=`${t.getFullYear()}-${J(t.getMonth()+1)}-${J(t.getDate())}`,this.allDay||(this.dueTime=`${J(t.getHours())}:${J(t.getMinutes())}`)),this.openedDue={date:this.dueDate,time:this.dueTime,allDay:this.allDay},this.attendees=(e?.attendees??[]).map(F),this.askNotify=!1}get assignedToUser(){return this.task?.role===`attendee`}input(){let e=``,t=this.dueDate===this.openedDue.date&&this.dueTime===this.openedDue.time&&this.allDay===this.openedDue.allDay;this.task&&t?e=this.task.due??``:this.dueDate&&(e=this.allDay?`${this.dueDate}T00:00:00Z`:new Date(`${this.dueDate}T${this.dueTime||`09:00`}`).toISOString());let n=e?this.repeat===`CUSTOM`?this.originalRRule:this.repeat?`FREQ=${this.repeat}`:``:``;return{title:this.title.trim(),description:this.description,due:e,allDay:this.allDay,status:this.status,percentComplete:this.status===`completed`?100:this.percent,priority:this.priority,rrule:n,calendarPath:this.calendarPath,etag:this.task?.etag}}setStatus(e){this.status===`completed`&&e!==`completed`&&this.percent>=100&&(this.percent=0),this.status=e}close(){this.open=!1,this.dispatchEvent(new CustomEvent(`close`))}requestDelete(){this.dispatchEvent(new CustomEvent(`delete`,{detail:{task:this.task}}))}async handleSave(){if(this.shadowRoot?.querySelector(`alps-address-input.assignees`)?.commitPending(),!(this.saving||!this.title.trim()||!this.calendarPath)){if(this.task?.role===`organizer`&&I(this.task,this.scheduling)){this.askNotify=!0;return}await this.save()}}async save(e){this.askNotify=!1,this.saving=!0;try{let t=!this.task,n={...this.input(),attendees:this.assignedToUser?void 0:this.attendees.map(P).filter(e=>e!==null),notify:e,lang:this.i18nStore?.getLanguage?.()},r=this.task?await M.updateTask(this.task.path,n):await M.createTask(n);r?.sendFailed&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`invitations.notTold`),type:`error`,duration:8e3}})),this.open=!1,this.dispatchEvent(new CustomEvent(`saved`,{detail:{task:r,created:t}}))}catch(e){console.error(`Failed to save task`,e);let t=_(e);t&&this.dispatchEvent(new CustomEvent(`conflict`)),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(t?`tasks.saveConflict`:`tasks.saveFailed`),type:`error`,duration:8e3}}))}finally{this.saving=!1}}priorityOptions(){let e=e=>this.i18nStore?.t(e)??e,t=[{value:`0`,label:e(`tasks.priorities.none`)},{value:`1`,label:e(`tasks.priorities.high`)},{value:`5`,label:e(`tasks.priorities.medium`)},{value:`9`,label:e(`tasks.priorities.low`)}];if(!t.some(e=>e.value===String(this.priority))){let n=this.priority<=4?`tasks.priorities.high`:this.priority===5?`tasks.priorities.medium`:`tasks.priorities.low`;t.push({value:String(this.priority),label:e(n)})}return t}render(){if(!this.open)return o``;let e=e=>this.i18nStore?.t(e)??e,t=!!this.dueDate,n=this.task;return o`
            <ui-modal
                heading=${e(n?`tasks.editTask`:`tasks.newTask`)}
                width="460px"
                ?dismissible=${!this.saving}
                @cancel=${this.close}
            >
                <div class="form-group">
                    <!-- Each label names its field: a bare one was tied to nothing. -->
                    <label for="task-title">${e(`tasks.titleField`)}</label>
                    <alps-input
                        id="task-title"
                        label=${e(`tasks.titleField`)}
                        class="title-input"
                        .value=${this.title}
                        placeholder=${e(`tasks.titlePlaceholder`)}
                        @input=${e=>{this.title=e.target.value}}
                    ></alps-input>
                </div>

                ${!n&&this.lists.length>1?o`
                    <div class="form-group">
                        <label for="task-list">${e(`tasks.list`)}</label>
                        <alps-select
                            id="task-list"
                            class="list-select"
                            label=${e(`tasks.list`)}
                            .value=${this.calendarPath}
                            .options=${this.lists.map(e=>({value:e.path,label:e.name}))}
                            @change=${e=>{this.calendarPath=e.target.value}}
                        ></alps-select>
                    </div>
                `:``}

                <div class="form-row">
                    <div class="form-group">
                        <label for="task-due">${e(`tasks.due`)}</label>
                        <alps-input
                            id="task-due"
                            label=${e(`tasks.due`)}
                            class="due-date"
                            type="date"
                            .value=${this.dueDate}
                            @input=${e=>{this.dueDate=e.target.value}}
                        ></alps-input>
                    </div>
                    ${t&&!this.allDay?o`
                        <div class="form-group">
                            <label for="task-time">${e(`tasks.time`)}</label>
                            <alps-input
                                id="task-time"
                                label=${e(`tasks.time`)}
                                class="due-time"
                                type="time"
                                .value=${this.dueTime}
                                @input=${e=>{this.dueTime=e.target.value}}
                            ></alps-input>
                        </div>
                    `:``}
                </div>
                ${t?o`
                    <label class="checkbox">
                        <input
                            class="all-day"
                            type="checkbox"
                            .checked=${this.allDay}
                            @change=${e=>{this.allDay=e.target.checked,!this.allDay&&!this.dueTime&&(this.dueTime=`09:00`)}}
                        />
                        ${e(`tasks.allDay`)}
                    </label>
                `:``}

                <div class="form-row">
                    ${n?o`
                        <div class="form-group">
                            <label for="task-status">${e(`tasks.status`)}</label>
                            <alps-select
                                id="task-status"
                                class="status-select"
                                label=${e(`tasks.status`)}
                                .value=${this.status}
                                .options=${[{value:`needs-action`,label:e(`tasks.statuses.needsAction`)},{value:`in-process`,label:e(`tasks.statuses.inProcess`)},{value:`completed`,label:e(`tasks.statuses.completed`)},{value:`cancelled`,label:e(`tasks.statuses.cancelled`)}]}
                                @change=${e=>this.setStatus(e.target.value)}
                            ></alps-select>
                        </div>
                    `:``}
                    <div class="form-group">
                        <label for="task-priority">${e(`tasks.priority`)}</label>
                        <alps-select
                            id="task-priority"
                            class="priority-select"
                            label=${e(`tasks.priority`)}
                            .value=${String(this.priority)}
                            .options=${this.priorityOptions()}
                            @change=${e=>{this.priority=Number(e.target.value)}}
                        ></alps-select>
                    </div>
                </div>

                <div class="form-row">
                    ${n?o`
                        <div class="form-group">
                            <label for="task-percent">${e(`tasks.percentComplete`)}</label>
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
                        <label for="task-repeat">${e(`tasks.repeat`)}</label>
                        ${t?o`
                            <alps-select
                                id="task-repeat"
                                class="repeat-select"
                                label=${e(`tasks.repeat`)}
                                .value=${this.repeat}
                                .options=${[{value:``,label:e(`calendar.repeatNone`)},{value:`DAILY`,label:e(`calendar.repeatDaily`)},{value:`WEEKLY`,label:e(`calendar.repeatWeekly`)},{value:`MONTHLY`,label:e(`calendar.repeatMonthly`)},{value:`YEARLY`,label:e(`calendar.repeatYearly`)},...this.repeat===`CUSTOM`?[{value:`CUSTOM`,label:e(`calendar.repeatCustom`)}]:[]]}
                                @change=${e=>{this.repeat=e.target.value}}
                            ></alps-select>
                        `:o`<div class="hint">${e(`tasks.repeatNeedsDue`)}</div>`}
                    </div>
                </div>

                <div class="form-group">
                    <label for="task-notes">${e(`tasks.notes`)}</label>
                    <textarea dir="auto"
                        id="task-notes"
                        .value=${this.description}
                        placeholder=${e(`tasks.addNotes`)}
                        @input=${e=>{this.description=e.target.value}}
                    ></textarea>
                </div>

                ${this.assignedToUser?o`
                    <div class="assigned">
                        <div><span class="label">${e(`tasks.assignedBy`)}</span> ${n?.organizer?c(n.organizer.name,n.organizer.email):``}</div>
                    </div>
                `:o`
                    <div class="form-group">
                        <label for="task-assignees">${e(`tasks.assignTo`)}</label>
                        <alps-address-input
                            id="task-assignees"
                            class="assignees"
                            label=${e(`tasks.assignTo`)}
                            .addresses=${this.attendees}
                            @addresses-changed=${e=>{this.attendees=e.detail.addresses}}
                        ></alps-address-input>
                    </div>
                    ${n?.role===`organizer`&&n.attendees?.length?o`
                        <div class="assigned answers">
                            ${n.attendees.map(t=>o`<div>${s(this.i18nStore,`tasks.assigneeAnswer`,{name:c(t.name,t.email),status:e(`invitations.statuses.${v(t.status)}`)})}</div>`)}
                        </div>
                    `:``}
                `}

                <div slot="actions" class="actions">
                    ${n?o`
                        <alps-button class="delete" variant="danger" ?disabled=${this.saving} @click=${this.requestDelete}>
                            ${e(`tasks.delete`)}
                        </alps-button>
                    `:``}
                    <alps-button variant="text" ?disabled=${this.saving} @click=${this.close}>${e(`general.cancel`)}</alps-button>
                    <alps-button
                        class="save"
                        variant="primary"
                        ?disabled=${this.saving||!this.title.trim()||!this.calendarPath}
                        ?spinning=${this.saving}
                        @click=${this.handleSave}
                    >${e(`general.save`)}</alps-button>
                </div>
            </ui-modal>

            ${this.askNotify?o`
                <ui-confirm
                    heading=${e(`invitations.notifyTitle`)}
                    message=${e(`tasks.notifyChanges`)}
                    confirmText=${e(`invitations.send`)}
                    secondaryText=${e(`invitations.dontSend`)}
                    @confirm=${()=>this.save(!0)}
                    @secondary=${()=>this.save(!1)}
                    @cancel=${()=>{this.askNotify=!1}}
                ></ui-confirm>
            `:``}
        `}};d([t({context:m})],Y.prototype,`i18nStore`,void 0),d([i({type:Boolean})],Y.prototype,`open`,void 0),d([i({attribute:!1})],Y.prototype,`task`,void 0),d([i({type:Array})],Y.prototype,`lists`,void 0),d([i({type:String})],Y.prototype,`defaultList`,void 0),d([i({type:String})],Y.prototype,`scheduling`,void 0),d([r()],Y.prototype,`title`,void 0),d([r()],Y.prototype,`description`,void 0),d([r()],Y.prototype,`dueDate`,void 0),d([r()],Y.prototype,`dueTime`,void 0),d([r()],Y.prototype,`allDay`,void 0),d([r()],Y.prototype,`status`,void 0),d([r()],Y.prototype,`priority`,void 0),d([r()],Y.prototype,`percent`,void 0),d([r()],Y.prototype,`repeat`,void 0),d([r()],Y.prototype,`calendarPath`,void 0),d([r()],Y.prototype,`saving`,void 0),d([r()],Y.prototype,`attendees`,void 0),d([r()],Y.prototype,`askNotify`,void 0),Y=d([e(`task-modal`)],Y);export{M as S,j as _,B as a,D as b,I as c,S as d,E as f,C as g,k as h,N as i,L as l,x as m,G as n,P as o,T as p,z as r,U as s,F as t,W as u,O as v,A as x,b as y};