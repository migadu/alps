import{_ as e,d as t,f as n,g as r,l as i,u as a,x as o,y as s}from"./lit-BYBpccnv.js";import{t as c}from"./vendor-Bey7gDeL.js";import{Ct as l,Dt as u,Nt as d,Ot as f,X as ee,_ as p,_t as m,a as h,g as te,h as g,ht as _,lt as v,m as y,o as b,s as x,st as S,ut as C,yt as w}from"./index-BW_ZGc31.js";import"./alps-address-input-Z95jfMtb.js";import{S as T,a as E,c as D,i as O,l as k,m as A,n as j,o as M,r as N,s as P,t as F,u as I}from"./task-modal-3F2GF4ym.js";var L=class extends r{constructor(...e){super(...e),this.options=[],this.value=``}static{this.styles=[C,o`
    :host {
      display: inline-flex;
      background-color: var(--bg-secondary, #f3f4f6);
      border-radius: 6px;
      padding: 2px;
      border: 1px solid var(--border-color, #e5e7eb);
    }

    button {
      background: none;
      border: none;
      padding: 4px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary, #4b5563);
      transition: all 0.2s;
    }

    button.active {
      background-color: var(--bg-primary, #ffffff);
      color: var(--text-primary, #111827);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    :host([full-width]) {
      display: flex;
      width: 100%;
      box-sizing: border-box;
    }

    :host([full-width]) button {
      flex: 1;
    }
  `]}render(){return s`
      ${this.options.map(e=>s`
        <button 
          class="${this.value===e.value?`active`:``}" 
          @click=${()=>this._select(e.value)}
        >${e.label}</button>
      `)}
    `}_select(e){this.value!==e&&(this.value=e,this.dispatchEvent(new CustomEvent(`change`,{detail:{value:e}})))}};v([a({type:Array})],L.prototype,`options`,void 0),v([a({type:String})],L.prototype,`value`,void 0),L=v([t(`alps-toggle`)],L);var R=class extends r{constructor(...e){super(...e),this.calendars=[],this.open=!1,this.scheduling=`email`,this.summary=``,this.location=``,this.calendarPath=``,this.description=``,this.startDate=``,this.startTime=``,this.endDate=``,this.endTime=``,this.isAllDay=!1,this.isSaving=!1,this.rruleFreq=``,this.originalRRule=``,this.attendees=[],this.askNotify=!1}static{this.styles=[C,ee,o`
            .form-group {
                margin-bottom: 16px;
            }
            .form-group label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 6px;
                color: var(--text-primary, #111827);
            }
            .form-row {
                display: flex;
                gap: 12px;
            }
            .form-row > div {
                flex: 1;
            }
            alps-input {
                width: 100%;
            }
            textarea {
                width: 100%;
                box-sizing: border-box;
                padding: 8px 12px;
                border: 1px solid var(--border-color, #e5e7eb);
                border-radius: 4px;
                font-family: inherit;
                font-size: 14px;
                resize: vertical;
                min-height: 80px;
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #111827);
            }
            /* The transparent outline paints nothing here; forced colors,
               which drop the border colour and the shadow, give it a system
               colour. */
            textarea:focus {
                outline: 2px solid transparent;
                border-color: var(--accent-color, #2563eb);
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
            }
        `]}updated(e){if(e.has(`open`)&&this.open){let e=e=>e.toString().padStart(2,`0`);if(this.askNotify=!1,this.attendees=(this.event?.attendees??[]).map(F),this.event){this.summary=this.event.summary||``,this.location=this.event.location||``,this.description=this.event.description||``,this.calendarPath=this.event.calendarPath||(this.calendars.length>0?this.calendars[0].path:``);let t=E(this.event);if(this.isAllDay=t,this.event.rrule?(this.originalRRule=this.event.rrule,this.event.rrule===`FREQ=DAILY`?this.rruleFreq=`DAILY`:this.event.rrule===`FREQ=WEEKLY`?this.rruleFreq=`WEEKLY`:this.event.rrule===`FREQ=MONTHLY`?this.rruleFreq=`MONTHLY`:this.event.rrule===`FREQ=YEARLY`?this.rruleFreq=`YEARLY`:this.rruleFreq=`CUSTOM`):(this.originalRRule=``,this.rruleFreq=``),t){let t=new Date(this.event.start);this.startDate=`${t.getUTCFullYear()}-${e(t.getUTCMonth()+1)}-${e(t.getUTCDate())}`,this.startTime=`00:00`;let n=new Date(this.event.end);n.setUTCDate(n.getUTCDate()-1),this.endDate=`${n.getUTCFullYear()}-${e(n.getUTCMonth()+1)}-${e(n.getUTCDate())}`,this.endDate<this.startDate&&(this.endDate=this.startDate),this.endTime=`00:00`}else{let t=new Date(this.event.start);this.startDate=`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}`,this.startTime=`${e(t.getHours())}:${e(t.getMinutes())}`;let n=new Date(this.event.end);this.endDate=`${n.getFullYear()}-${e(n.getMonth()+1)}-${e(n.getDate())}`,this.endTime=`${e(n.getHours())}:${e(n.getMinutes())}`}}else{this.summary=``,this.location=``,this.description=``,this.originalRRule=``,this.rruleFreq=``,this.calendarPath=this.calendars.length>0?this.calendars[0].path:``;let t=this.initialDate?new Date(this.initialDate):new Date;if(this.initialAllDay===void 0?this.initialDate&&t.getHours()===0&&t.getMinutes()===0:this.initialAllDay)this.isAllDay=!0,this.startDate=`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}`,this.startTime=`00:00`,this.endDate=this.startDate,this.endTime=`00:00`;else{this.isAllDay=!1,this.initialDate||(t.setMinutes(0,0,0),t.setHours(t.getHours()+1)),this.startDate=`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}`,this.startTime=`${e(t.getHours())}:${e(t.getMinutes())}`;let n=new Date(t.getTime()+3600*1e3);this.endDate=`${n.getFullYear()}-${e(n.getMonth()+1)}-${e(n.getDate())}`,this.endTime=`${e(n.getHours())}:${e(n.getMinutes())}`}}}}handleCancel(){this.open=!1,this.dispatchEvent(new CustomEvent(`close`))}formTimes(){if(this.isAllDay){let e=new Date(`${this.endDate}T00:00:00.000Z`);return e.setUTCDate(e.getUTCDate()+1),{startISO:`${this.startDate}T00:00:00.000Z`,endISO:e.toISOString()}}return{startISO:new Date(`${this.startDate}T${this.startTime||`00:00`}`).toISOString(),endISO:new Date(`${this.endDate}T${this.endTime||`00:00`}`).toISOString()}}setStart(e){Object.assign(this,e),this.startDate&&this.endDate<this.startDate&&(this.endDate=this.startDate),!this.isAllDay&&this.startDate&&this.endDate===this.startDate&&this.startTime&&this.endTime&&this.endTime<this.startTime&&(this.endTime=this.startTime)}endsBeforeStart(){if(this.isAllDay)return this.endDate<this.startDate;let{startISO:e,endISO:t}=this.formTimes();return new Date(t).getTime()<new Date(e).getTime()}get othersMeeting(){let e=this.event;return e?.role===`attendee`||!!e?.organizer&&e.role!==`organizer`}async handleSave(){if(this.shadowRoot?.querySelector(`alps-address-input.guests`)?.commitPending(),!this.summary.trim()||!this.startDate||!this.endDate)return;if(this.endsBeforeStart()){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`calendar.endBeforeStart`),type:`error`,duration:8e3}}));return}let e=!!this.event?.ended&&new Date(this.formTimes().endISO)<=new Date;if(this.event?.path&&!this.othersMeeting&&k({...this.event,ended:e},this.scheduling)){this.askNotify=!0;return}await this.save()}async save(e){this.askNotify=!1,this.isSaving=!0;try{let{startISO:t,endISO:n}=this.formTimes(),r;this.rruleFreq===`CUSTOM`?r=this.originalRRule:this.rruleFreq&&(r=`FREQ=${this.rruleFreq}`);let i={summary:this.summary,location:this.location,description:this.description,start:t,end:n,allDay:this.isAllDay,calendarPath:this.calendarPath,rrule:r,etag:this.event?.etag,attendees:this.othersMeeting?void 0:this.attendees.map(M).filter(e=>e!==null),notify:e,lang:this.i18nStore?.getLanguage?.()};(this.event&&this.event.path?await j.updateEvent(this.event.path,i):await j.createEvent(i))?.sendFailed&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`invitations.notTold`),type:`error`,duration:8e3}})),this.open=!1,this.dispatchEvent(new CustomEvent(`saved`))}catch(e){console.error(`Failed to save event`,e);let t=_(e);t&&this.dispatchEvent(new CustomEvent(`conflict`)),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(t?`calendar.saveConflict`:`calendar.saveEventFailed`),type:`error`,duration:8e3}}))}finally{this.isSaving=!1}}render(){return this.open?s`
            <ui-modal 
                heading="${this.event?this.i18nStore?.t(`calendar.editEvent`):this.i18nStore?.t(`calendar.newEvent`)}" 
                width="450px"
                ?dismissible=${!this.isSaving}
                @cancel=${this.handleCancel}
            >
                <div class="form-group">
                    <!-- Each label names its field: a bare one was tied to nothing. -->
                    <label for="event-summary">${this.i18nStore?.t(`calendar.summary`)}</label>
                    <alps-input 
                        id="event-summary"
                        label=${this.i18nStore?.t(`calendar.summary`)}
                        .value=${this.summary} 
                        @input=${e=>this.summary=e.target.value}
                        placeholder=${this.i18nStore?.t(`calendar.eventTitle`)}
                    ></alps-input>
                </div>

                ${this.calendars.length>1?s`
                    <div class="form-group">
                        <label for="event-calendar">${this.i18nStore?.t(`calendar.calendar`)}</label>
                        <alps-select
                            id="event-calendar"
                            label=${this.i18nStore?.t(`calendar.calendar`)}
                            .value=${this.calendarPath}
                            .options=${this.calendars.map(e=>({value:e.path,label:e.name}))}
                            @change=${e=>{this.calendarPath=e.target.value}}
                            ?disabled=${!!this.event}
                        ></alps-select>
                    </div>
                `:``}

                ${this.othersMeeting?s`
                    <div class="form-group organized-by">
                        ${f(this.i18nStore,`invitations.organizedBy`,{name:this.event?.organizer?u(this.event.organizer.name,this.event.organizer.email):``})}
                    </div>
                `:s`
                    <div class="form-group">
                        <label for="event-guests">${this.i18nStore?.t(`invitations.guests`)}</label>
                        <alps-address-input
                            id="event-guests"
                            class="guests"
                            label=${this.i18nStore?.t(`invitations.guests`)}
                            .addresses=${this.attendees}
                            @addresses-changed=${e=>{this.attendees=e.detail.addresses}}
                        ></alps-address-input>
                    </div>
                `}

                <div class="form-row">
                    <div class="form-group">
                        <label for="event-start-date">${this.i18nStore?.t(`calendar.startDate`)}</label>
                        <alps-input 
                            id="event-start-date"
                            label=${this.i18nStore?.t(`calendar.startDate`)}
                            type="date"
                            .value=${this.startDate} 
                            @input=${e=>this.setStart({startDate:e.target.value})}
                        ></alps-input>
                    </div>
                    ${this.isAllDay?``:s`
                    <div class="form-group">
                        <label for="event-start-time">${this.i18nStore?.t(`calendar.time`)}</label>
                        <!-- Named "Start time", though its label reads "Time": so is the end's. -->
                        <alps-input 
                            id="event-start-time"
                            label=${this.i18nStore?.t(`calendar.startTime`)}
                            type="time"
                            .value=${this.startTime} 
                            @input=${e=>this.setStart({startTime:e.target.value})}
                        ></alps-input>
                    </div>
                    `}
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="event-end-date">${this.i18nStore?.t(`calendar.endDate`)}</label>
                        <alps-input 
                            id="event-end-date"
                            label=${this.i18nStore?.t(`calendar.endDate`)}
                            type="date"
                            .value=${this.endDate} 
                            @input=${e=>this.endDate=e.target.value}
                        ></alps-input>
                    </div>
                    ${this.isAllDay?``:s`
                    <div class="form-group">
                        <label for="event-end-time">${this.i18nStore?.t(`calendar.time`)}</label>
                        <alps-input 
                            id="event-end-time"
                            label=${this.i18nStore?.t(`calendar.endTime`)}
                            type="time"
                            .value=${this.endTime} 
                            @input=${e=>this.endTime=e.target.value}
                        ></alps-input>
                    </div>
                    `}
                </div>

                <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="allday-checkbox" .checked=${this.isAllDay} @change=${e=>this.setStart({isAllDay:e.target.checked})}>
                    <label for="allday-checkbox" style="margin-bottom: 0; cursor: pointer;">${this.i18nStore?.t(`calendar.allDay`)}</label>
                </div>

                <div class="form-group">
                    <label for="event-repeat">${this.i18nStore?.t(`calendar.repeat`)}</label>
                    <alps-select
                        id="event-repeat"
                        label=${this.i18nStore?.t(`calendar.repeat`)}
                        .value=${this.rruleFreq}
                        .options=${[{value:``,label:this.i18nStore?.t(`calendar.repeatNone`)},{value:`DAILY`,label:this.i18nStore?.t(`calendar.repeatDaily`)},{value:`WEEKLY`,label:this.i18nStore?.t(`calendar.repeatWeekly`)},{value:`MONTHLY`,label:this.i18nStore?.t(`calendar.repeatMonthly`)},{value:`YEARLY`,label:this.i18nStore?.t(`calendar.repeatYearly`)},...this.rruleFreq===`CUSTOM`?[{value:`CUSTOM`,label:this.i18nStore?.t(`calendar.repeatCustom`)}]:[]]}
                        @change=${e=>this.rruleFreq=e.target.value}
                    ></alps-select>
                </div>

                <div class="form-group">
                    <label for="event-location">${this.i18nStore?.t(`calendar.location`)}</label>
                    <alps-input 
                        id="event-location"
                        label=${this.i18nStore?.t(`calendar.location`)}
                        .value=${this.location} 
                        @input=${e=>this.location=e.target.value}
                        placeholder=${this.i18nStore?.t(`calendar.addLocation`)}
                    ></alps-input>
                </div>

                <div class="form-group">
                    <label for="event-description">${this.i18nStore?.t(`calendar.description`)}</label>
                    <textarea dir="auto" 
                        id="event-description"
                        .value=${this.description} 
                        @input=${e=>this.description=e.target.value}
                        placeholder=${this.i18nStore?.t(`calendar.addDescription`)}
                    ></textarea>
                </div>

                <div slot="actions">
                    <alps-button variant="text" @click=${this.handleCancel} ?disabled=${this.isSaving}>
                        ${this.i18nStore?.t(`general.cancel`)}
                    </alps-button>
                    <alps-button variant="primary" @click=${this.handleSave} ?disabled=${this.isSaving||!this.summary} ?spinning=${this.isSaving}>
                        ${this.i18nStore?.t(`general.save`)}
                    </alps-button>
                </div>
            </ui-modal>

            ${this.askNotify?s`
                <ui-confirm
                    heading=${this.i18nStore?.t(`invitations.notifyTitle`)}
                    message=${this.i18nStore?.t(`invitations.notifyChanges`)}
                    confirmText=${this.i18nStore?.t(`invitations.send`)}
                    secondaryText=${this.i18nStore?.t(`invitations.dontSend`)}
                    @confirm=${()=>this.save(!0)}
                    @secondary=${()=>this.save(!1)}
                    @cancel=${()=>{this.askNotify=!1}}
                ></ui-confirm>
            `:``}
        `:s``}};v([n({context:m})],R.prototype,`i18nStore`,void 0),v([a({type:Object})],R.prototype,`event`,void 0),v([a({type:Object})],R.prototype,`initialDate`,void 0),v([a({type:Boolean})],R.prototype,`initialAllDay`,void 0),v([a({type:Array})],R.prototype,`calendars`,void 0),v([a({type:Boolean})],R.prototype,`open`,void 0),v([a({type:String})],R.prototype,`scheduling`,void 0),v([i()],R.prototype,`summary`,void 0),v([i()],R.prototype,`location`,void 0),v([i()],R.prototype,`calendarPath`,void 0),v([i()],R.prototype,`description`,void 0),v([i()],R.prototype,`startDate`,void 0),v([i()],R.prototype,`startTime`,void 0),v([i()],R.prototype,`endDate`,void 0),v([i()],R.prototype,`endTime`,void 0),v([i()],R.prototype,`isAllDay`,void 0),v([i()],R.prototype,`isSaving`,void 0),v([i()],R.prototype,`rruleFreq`,void 0),v([i()],R.prototype,`originalRRule`,void 0),v([i()],R.prototype,`attendees`,void 0),v([i()],R.prototype,`askNotify`,void 0),R=v([t(`calendar-event-modal`)],R);var z=class extends r{constructor(...e){super(...e),this.events=[],this.showTitle=!1,this.weekStart=1,this.focusDay=null,this.dayHadFocus=!1}getFirstDayOfWeek(){return this.weekStart??1}static{this.styles=o`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .year-month-title {
            color: var(--error, #ef4444);
            font-size: var(--mini-month-title-size, 16px);
            font-weight: 500;
            margin-bottom: 12px;
        }

        .mini-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-auto-rows: 1fr;
            gap: 2px;
            text-align: center;
            font-size: var(--mini-month-font-size, 12px);
            color: var(--text-secondary, #4b5563);
            flex: 1;
        }

        .mini-day-name {
            color: var(--text-muted, #6b7280);
            font-size: var(--mini-month-day-size, 11px);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .mini-day {
            border-radius: 4px;
            cursor: pointer;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .day-num {
            position: relative;
            line-height: 1;
        }

        .mini-day.weekend {
            opacity: 0.65;
        }

        .mini-day:hover {
            background-color: var(--bg-tertiary, #f3f4f6);
        }

        .mini-day.today {
            background-color: var(--error, #ef4444);
            color: #ffffff;
        }

        .mini-day.has-event .day-num::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: var(--text-secondary, #4b5563);
        }
        .mini-day.today.has-event .day-num::after {
            background-color: #ffffff;
        }
        /* The mark that a day has events is drawn by its background alone,
           which forced colors repaint as the page: there it takes the text's
           system colour. */
        @media (forced-colors: active) {
            .mini-day.has-event .day-num::after,
            .mini-day.today.has-event .day-num::after {
                forced-color-adjust: none;
                background-color: CanvasText;
            }
            .mini-day.today {
                outline: 2px solid CanvasText;
                outline-offset: -2px;
            }
        }
    `}getMonthGrid(){let e=this.getFirstDayOfWeek(),t=(new Date(this.year,this.month,1).getDay()-e+7)%7,n=1-t,r=new Date(this.year,this.month+1,0).getDate(),i=Math.ceil((r+t)/7)*7,a=[];for(let e=0;e<i;e++)a.push(new Date(this.year,this.month,n+e));return a}hasEventsForDate(e){if(!this.events||this.events.length===0)return!1;let t=new Date(e);t.setHours(0,0,0,0);let n=new Date(e);return n.setHours(23,59,59,999),this.events.some(e=>{if(E(e)){let n=e.start.split(`T`)[0],r=e.end.split(`T`)[0],i=new Date(n+`T00:00:00`),a=new Date(r+`T00:00:00`);return i<=t&&a>t}else{let r=new Date(e.start),i=new Date(e.end);return i.getTime()===t.getTime()&&r.getTime()<i.getTime()?!1:r<=n&&i>=t}})}handleDateClick(e){this.focusDay=e,this.dispatchEvent(new CustomEvent(`date-selected`,{detail:{date:e},bubbles:!0,composed:!0}))}tabStop(e){if((t=>!!t&&e.some(e=>e.getTime()===t.getTime()))(this.focusDay))return this.focusDay;let t=new Date;t.setHours(0,0,0,0);for(let e of[this.currentDate,t])if(e&&e.getFullYear()===this.year&&e.getMonth()===this.month)return new Date(this.year,this.month,e.getDate());return new Date(this.year,this.month,1)}handleDayKeyDown(e,t,n){if(e.key===`Enter`||e.key===` `){if(e.preventDefault(),e.key===` `&&e.repeat)return;this.handleDateClick(t);return}let r=getComputedStyle(this).direction===`rtl`?`ArrowLeft`:`ArrowRight`,i=r===`ArrowLeft`?`ArrowRight`:`ArrowLeft`,a=e.key===i?-1:e.key===r?1:e.key===`ArrowUp`?-7:e.key===`ArrowDown`?7:0;if(!a)return;e.preventDefault();let o=new Date(t.getFullYear(),t.getMonth(),t.getDate()+a);n.some(e=>e.getTime()===o.getTime())&&(this.focusDay=o,this.updateComplete.then(()=>this.renderRoot.querySelector(`.mini-day[tabindex="0"]`)?.focus()))}willUpdate(e){let t=e.get(`currentDate`);(e.has(`year`)||e.has(`month`)||e.has(`currentDate`)&&t?.getTime()!==this.currentDate?.getTime())&&(this.focusDay=null),this.dayHadFocus=!!this.renderRoot?.activeElement?.classList.contains(`mini-day`)}updated(e){this.dayHadFocus&&(e.has(`year`)||e.has(`month`))&&this.renderRoot.querySelector(`.mini-day[tabindex="0"]`)?.focus()}render(){let t=this.getMonthGrid(),n=this.getFirstDayOfWeek(),r=Array.from({length:7},(e,t)=>{let r=(n+t)%7;return this.i18nStore?.t(`calendar.daysNarrow.${r}`)}),i=new Date;i.setHours(0,0,0,0);let a=this.tabStop(t).getTime(),o=new Intl.DateTimeFormat(this.i18nStore?.getIntlLanguage?.(),{dateStyle:`full`}),c=this.i18nStore?.t(`calendar.months.${this.month}`);return s`
            ${this.showTitle?s`<div class="year-month-title">${c}</div>`:``}
            <div class="mini-grid">
                ${r.map(e=>s`<div class="mini-day-name">${e}</div>`)}
                ${t.map(n=>{let r=n.getMonth()!==this.month,c=n.getTime()===i.getTime(),l=this.hasEventsForDate(n),u=n.getDay()===0||n.getDay()===6;return s`
                        <div 
                            class="mini-day ${c?`today`:``} ${l?`has-event`:``} ${u?`weekend`:``}" 
                            style="${r?`opacity: 0.3`:``}"
                            role="button"
                            tabindex=${n.getTime()===a?`0`:`-1`}
                            aria-label=${o.format(n)}
                            aria-current=${c?`date`:e}
                            @click=${()=>this.handleDateClick(n)}
                            @keydown=${e=>this.handleDayKeyDown(e,n,t)}
                        >
                            <span class="day-num">${n.getDate()}</span>
                        </div>
                    `})}
            </div>
        `}};v([n({context:m})],z.prototype,`i18nStore`,void 0),v([a({type:Number})],z.prototype,`year`,void 0),v([a({type:Number})],z.prototype,`month`,void 0),v([a({type:Array})],z.prototype,`events`,void 0),v([a({type:Boolean})],z.prototype,`showTitle`,void 0),v([a({type:Number})],z.prototype,`weekStart`,void 0),v([a({type:Object})],z.prototype,`currentDate`,void 0),v([i()],z.prototype,`focusDay`,void 0),z=v([t(`calendar-mini-month`)],z);var B=class extends r{constructor(...e){super(...e),this.clock=new w(this)}static{this.styles=o`
        :host {
            display: block;
            padding: 12px;
            min-width: 280px;
            max-width: 320px;
            white-space: normal;
            cursor: default;
            box-sizing: border-box;
            background: var(--bg-primary, #ffffff);
            border-radius: 8px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 4px 4px 12px 4px;
        }

        .title-container {
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }

        /* The event's calendar, by its colour. Drawn by its background
           alone, which forced colors repaint as the page: kept. */
        .color-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-top: 5px;
            flex-shrink: 0;
            forced-color-adjust: none;
        }

        .title {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary, #111827);
            word-break: break-word;
            line-height: 1.4;
        }

        .edit-btn {
            color: var(--text-secondary, #6b7280);
            margin-inline-start: 12px;
            flex-shrink: 0;
        }

        .card {
            background: var(--bg-secondary, #f3f4f6);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .card:last-child {
            margin-bottom: 0;
        }

        .card-row {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary, #111827);
        }

        .card-row svg {
            width: 18px;
            height: 18px;
            fill: currentColor;
            color: var(--text-muted, #9ca3af);
        }

        .card-text {
            font-size: 13px;
            color: var(--text-secondary, #4b5563);
            margin-inline-start: 22px;
            line-height: 1.4;
        }

        .card-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted, #9ca3af);
            margin-bottom: 2px;
        }

        .description-text {
            font-size: 13px;
            color: var(--text-primary, #111827);
            white-space: pre-wrap;
            line-height: 1.5;
        }

        .date-primary {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #111827);
        }

        .date-secondary {
            font-size: 13px;
            color: var(--text-secondary, #4b5563);
        }

        .people {
            list-style: none;
            margin: 0;
            padding: 0;
            font-size: 13px;
            color: var(--text-primary, #111827);
        }

        .people li {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            line-height: 1.6;
        }

        .people .status {
            color: var(--text-muted, #9ca3af);
            white-space: nowrap;
        }

        .answers {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 4px;
        }

        .answers alps-button {
            --btn-padding: 4px 10px;
            --btn-font-size: 12px;
        }
    `}formatEventDate(e){let t=e.start,n=E(e),r;return r=n?new Date(t.split(`T`)[0]+`T00:00:00`):new Date(t),`${this.i18nStore?.t(`calendar.days.${r.getDay()}`)}, ${this.i18nStore?.t(`calendar.monthsShort.${r.getMonth()}`)} ${r.getDate()}, ${r.getFullYear()}`}formatEventTimeRange(e){let t=new Date(e.start),n=new Date(e.end);if(E(e))return this.i18nStore?.t(`calendar.allDay`);let r={hour:`2-digit`,minute:`2-digit`,hour12:this.clock.hour12};return t.toDateString()===n.toDateString()?`${t.toLocaleTimeString(void 0,r)} - ${n.toLocaleTimeString(void 0,r)}`:`${t.toLocaleTimeString(void 0,r)} - ${this.i18nStore?.t(`calendar.monthsShort.${n.getMonth()}`)} ${n.getDate()} ${n.toLocaleTimeString(void 0,r)}`}handleEdit(e){e.stopPropagation();let t=this.closest(`alps-popup`);t&&t.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`edit-event`,{detail:{event:this.event},bubbles:!0,composed:!0}))},10)}handleDelete(e){e.stopPropagation();let t=this.closest(`alps-popup`);t&&t.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`delete-event`,{detail:{event:this.event},bubbles:!0,composed:!0}))},10)}handleComplete(e){e.stopPropagation();let t=this.closest(`alps-popup`);t&&t.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`complete-task`,{detail:{task:this.event.task},bubbles:!0,composed:!0}))},10)}handleRespond(e,t){e.stopPropagation();let n=this.closest(`alps-popup`);n&&n.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`respond-event`,{detail:{event:this.event,status:t},bubbles:!0,composed:!0}))},10)}answerable(e){return!e.ended&&new Date(e.end)>new Date}renderMeeting(e){if(!e.organizer&&!e.attendees?.length)return``;let t=e=>this.i18nStore?.t(e),n=e=>u(e.name,e.email),r=(n,r)=>s`
            <alps-button
                class="answer-${n}"
                variant=${e.status===n?`primary`:`normal`}
                aria-pressed=${e.status===n?`true`:`false`}
                @click=${e=>this.handleRespond(e,n)}
            >${t(r)}</alps-button>
        `;return s`
            <div class="card meeting">
                ${e.organizer?s`
                    <div class="card-label">${t(`invitations.organizer`)}</div>
                    <div class="description-text">${n(e.organizer)}</div>
                `:``}
                ${e.attendees?.length?s`
                    <div class="card-label">${t(`invitations.guests`)}</div>
                    <ul class="people">
                        ${e.attendees.map(e=>s`<li><span>${n(e)}</span><span class="status">${t(`invitations.statuses.${S(e.status)}`)}</span></li>`)}
                    </ul>
                `:``}
                ${e.role===`attendee`?s`
                    <div class="card-label">${t(`invitations.yourAnswer`)}</div>
                    ${this.answerable(e)?s`
                        <div class="answers">
                            ${r(`accepted`,`invitations.accept`)}
                            ${r(`tentative`,`invitations.maybe`)}
                            ${r(`declined`,`invitations.decline`)}
                        </div>
                    `:s`<div class="description-text answer-status">${t(`invitations.statuses.${S(e.status)}`)}</div>`}
                `:``}
            </div>
        `}renderTask(e){let t=this.event,n=A(e);return s`
            <div class="header">
                <div class="title-container">
                    <div class="color-dot" style="background-color: ${t.color||`var(--accent-color, #2563eb)`}"></div>
                    <h3 class="title"><bdi>${e.title||this.i18nStore?.t(`tasks.untitled`)}</bdi></h3>
                </div>
                <div style="display: flex; gap: 4px;">
                    <alps-icon-btn class="complete-btn" icon="checkCircle" title=${this.i18nStore?.t(`tasks.markDone`)} @click=${this.handleComplete}></alps-icon-btn>
                    <alps-icon-btn class="edit-btn" icon="pen" title=${this.i18nStore?.t(`tasks.editTask`)} @click=${this.handleEdit}></alps-icon-btn>
                    <alps-icon-btn class="delete-btn" icon="trash" title=${this.i18nStore?.t(`tasks.deleteTask`)} @click=${this.handleDelete} style="color: var(--error, #ef4444);"></alps-icon-btn>
                </div>
            </div>

            <div class="card">
                <div class="card-label">${this.i18nStore?.t(`tasks.due`)}</div>
                <div class="date-primary">${this.formatEventDate(t)}</div>
                ${n&&!e.allDay?s`<div class="date-secondary">${n.toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`,hour12:this.clock.hour12})}</div>`:``}
            </div>

            ${e.description?s`
            <div class="card">
                <div class="card-label">${this.i18nStore?.t(`tasks.notes`)}</div>
                <div class="description-text" dir="auto">${e.description}</div>
            </div>`:``}
        `}render(){if(!this.event)return s``;if(this.event.task)return this.renderTask(this.event.task);let e=this.event;return s`
            <div class="header">
                <div class="title-container">
                    <div class="color-dot" style="background-color: ${e.color||`var(--accent-color, #2563eb)`}"></div>
                    <h3 class="title"><bdi>${e.summary||this.i18nStore?.t(`calendar.noTitle`)}</bdi></h3>
                </div>
                <div style="display: flex; gap: 4px;">
                    <alps-icon-btn class="edit-btn" icon="pen" title=${this.i18nStore?.t(`calendar.editEvent`)} @click=${this.handleEdit}></alps-icon-btn>
                    <alps-icon-btn class="delete-btn" icon="trash" title=${this.i18nStore?.t(`calendar.deleteEvent`)} @click=${this.handleDelete} style="color: var(--error, #ef4444);"></alps-icon-btn>
                </div>
            </div>

            <div class="card">
                <div class="date-primary">${this.formatEventDate(e)}</div>
                <div class="date-secondary">${this.formatEventTimeRange(e)}</div>
            </div>

            ${this.renderMeeting(e)}

            ${e.location?s`
            <div class="card">
                <div class="card-label">${this.i18nStore?.t(`calendar.location`)}</div>
                <div class="description-text" dir="auto">${e.location}</div>
            </div>`:``}

            ${e.description?s`
            <div class="card">
                <div class="card-label">${this.i18nStore?.t(`calendar.notes`)}</div>
                <div class="description-text" dir="auto">${e.description}</div>
            </div>`:``}
        `}};v([n({context:m})],B.prototype,`i18nStore`,void 0),v([a({type:Object})],B.prototype,`event`,void 0),B=v([t(`calendar-event-preview`)],B);var V=class extends r{constructor(...e){super(...e),this.clock=new w(this),this.days=[],this.events=[],this.scrolled=!1,this.now=new Date}connectedCallback(){super.connectedCallback(),this.now=new Date,this.nowTimer=window.setInterval(()=>{this.now=new Date},6e4)}disconnectedCallback(){super.disconnectedCallback(),this.nowTimer!==void 0&&(clearInterval(this.nowTimer),this.nowTimer=void 0)}static{this.styles=[C,o`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            background-color: var(--bg-primary, #ffffff);
        }

        .time-grid-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .header-wrapper {
            position: sticky;
            top: 0;
            z-index: 10;
            background: var(--bg-primary, #ffffff);
            transition: box-shadow 0.2s ease;
        }

        .header-wrapper.scrolled {
            box-shadow: rgba(95, 95, 95, 0.1) 0 4px 4px -2px;
        }

        .time-grid-header {
            display: flex;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #ffffff);
        }

        .time-axis-spacer {
            width: 60px;
            flex-shrink: 0;
            box-sizing: border-box;
            border-inline-end: 1px solid var(--border-color, #e5e7eb);
        }

        .time-grid-days {
            flex: 1;
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(0, 1fr);
        }

        .time-grid-day-header {
            padding: 8px;
            text-align: center;
            box-sizing: border-box;
            border-inline-end: 1px solid var(--border-color, #e5e7eb);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        .time-grid-day-header:last-child { border-inline-end: none; }

        .time-grid-day-name {
            font-size: 11px;
            font-weight: 500;
            color: var(--text-secondary, #4b5563);
            text-transform: uppercase;
        }
        .time-grid-day-number {
            font-size: 20px;
            font-weight: 400;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            color: var(--text-primary, #111827);
        }
        .time-grid-day-number.today {
            background-color: var(--error, #ef4444);
            color: #ffffff;
        }
        @media (forced-colors: active) {
            .time-grid-day-number.today {
                outline: 2px solid CanvasText;
                outline-offset: -2px;
            }
        }

        .all-day-row {
            display: flex;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            min-height: 24px;
            background: var(--bg-primary, #ffffff);
        }

        .all-day-label {
            width: 60px;
            flex-shrink: 0;
            font-size: 11px;
            color: var(--text-muted, #6b7280);
            padding: 4px 8px;
            box-sizing: border-box;
            text-align: end;
            border-inline-end: 1px solid var(--border-color, #e5e7eb);
        }

        .all-day-content {
            flex: 1;
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(0, 1fr);
        }
        .all-day-cell {
            border-inline-end: 1px solid var(--border-color, #e5e7eb);
            padding: 2px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .all-day-cell:last-child { border-inline-end: none; }

        .time-grid-scroll {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            position: relative;
        }

        .time-grid-body {
            display: flex;
            position: relative;
            min-height: 1152px; /* 24 hours * 48px */
            padding-top: 12px;
            padding-bottom: 24px;
        }

        .time-axis {
            width: 60px;
            flex-shrink: 0;
            box-sizing: border-box;
            border-inline-end: 1px solid var(--border-color, #e5e7eb);
            position: relative;
        }

        .time-label {
            position: absolute;
            inset-inline-end: 8px;
            font-size: 11px;
            color: var(--text-muted, #6b7280);
            transform: translateY(-50%);
        }

        .time-grid-columns {
            flex: 1;
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(0, 1fr);
            position: relative;
            background-image: linear-gradient(to bottom, var(--border-color, #e5e7eb) 1px, transparent 1px);
            background-size: 100% 48px; /* 48px per hour */
        }

        .time-column {
            border-inline-end: 1px solid var(--border-color, #e5e7eb);
            position: relative;
        }
        .time-column:last-child { border-inline-end: none; }

        alps-popup.time-event-popup {
            position: absolute;
            left: 2px;
            right: 2px;
            display: block;
            z-index: 5;
        }
        .time-event {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: rgba(37, 99, 235, 0.9);
            color: #ffffff;
            border-radius: 4px;
            padding: 4px 6px;
            font-size: 11px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            cursor: pointer;
            box-sizing: border-box;
        }
        .time-event:hover {
            background-color: var(--accent-fill, #2563eb);
        }
        .time-event-title {
            font-weight: 500;
            margin-bottom: 2px;
        }

        .event-chip {
            background-color: #f59e0b;
            color: #ffffff;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            opacity: 0.9;
        }
        /* An invitation the user declined stays in view, so it can be taken
           back, but reads as not happening. */
        .declined {
            opacity: 0.55;
            text-decoration: line-through;
        }

        .event-chip:hover {
            opacity: 1;
        }
        /* A task's chip: outlined in its calendar's colour, marked with a check,
           so it does not read as an all-day event. Doubled to outrank the
           all-day chip's own background. */
        .event-chip.event-chip.task {
            display: flex;
            align-items: center;
            gap: 4px;
            background-color: var(--bg-primary, #ffffff);
            color: var(--text-primary, #111827);
            border: 1px solid;
            border-inline-start-width: 3px;
            box-shadow: none;
        }
        .event-chip.task svg {
            flex-shrink: 0;
            width: 12px;
            height: 12px;
            fill: currentColor;
        }

        .now-line {
            position: absolute;
            left: 0;
            right: 0;
            border-top: 2px solid var(--error, #ef4444);
            /* Above the event popups (z-index 5), so an event cannot bury it. */
            z-index: 6;
            pointer-events: none;
        }
        .now-line::before {
            content: '';
            position: absolute;
            inset-inline-start: 0;
            /* The padding box starts below the 2px border, so -5px centers the
               8px dot on the line. */
            top: -5px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--error, #ef4444);
        }
    `]}getEventsForDate(e,t){return this.events?this.events.filter(n=>{let r=E(n);if(t!==r)return!1;let i=new Date(e);i.setHours(0,0,0,0);let a=new Date(e);if(a.setHours(23,59,59,999),r){let e=n.start.split(`T`)[0],t=n.end.split(`T`)[0],r=new Date(e+`T00:00:00`),a=new Date(t+`T00:00:00`);return r<=i&&a>i}else{let e=new Date(n.start),t=new Date(n.end);return t.getTime()===i.getTime()&&e.getTime()<t.getTime()?!1:e<=a&&t>=i}}):[]}handleColumnClick(e,t){let n=e.currentTarget.getBoundingClientRect(),r=e.clientY-n.top,i=Math.floor(r/48),a=new Date(t);a.setHours(i,0,0,0),this.dispatchEvent(new CustomEvent(`create-event`,{detail:{date:a,allDay:!1},bubbles:!0,composed:!0}))}handleAllDayCellClick(e){let t=new Date(e);t.setHours(0,0,0,0),this.dispatchEvent(new CustomEvent(`create-event`,{detail:{date:t,allDay:!0},bubbles:!0,composed:!0}))}handleScroll(e){let t=e.target;this.scrolled=t.scrollTop>0}render(){let e=Array.from({length:24},(e,t)=>t),t=new Date(this.now);return t.setHours(0,0,0,0),s`
            <div class="time-grid-container">
                <div class="time-grid-scroll" @scroll=${this.handleScroll}>
                    <div class="header-wrapper ${this.scrolled?`scrolled`:``}">
                        <div class="time-grid-header">
                            <div class="time-axis-spacer"></div>
                            <div class="time-grid-days">
                                ${this.days.map(e=>{let n=e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth()&&e.getDate()===t.getDate();return s`
                                        <div class="time-grid-day-header">
                                            <span class="time-grid-day-name">${this.i18nStore?.t(`calendar.daysShort.${e.getDay()}`)}</span>
                                            <span class="time-grid-day-number ${n?`today`:``}">${e.getDate()}</span>
                                        </div>
                                    `})}
                            </div>
                        </div>

                        <div class="all-day-row">
                            <div class="all-day-label">${this.i18nStore?.t(`calendar.allDay`)?.toLowerCase()}</div>
                            <div class="all-day-content">
                                ${this.days.map(e=>s`
                                        <div class="all-day-cell" @click=${()=>this.handleAllDayCellClick(e)} style="cursor: pointer;">
                                            ${this.getEventsForDate(e,!0).map(e=>s`
                                                <alps-popup align="start" position="bottom" style="width: 100%; display: block;" @click=${e=>e.stopPropagation()}>
                                                    <div slot="trigger"
                                                        class="event-chip ${e.task?`task`:``} ${e.status===`declined`?`declined`:``}" 
                                                        style=${e.task?`border-color: ${e.color}`:e.color?`background-color: ${e.color}`:``}
                                                        title="${e.summary||this.i18nStore?.t(`calendar.noTitle`)}">
                                                        ${e.task?d(`checkCircle`):``}<bdi>${e.summary||this.i18nStore?.t(`calendar.noTitle`)}</bdi>
                                                    </div>
                                                    <calendar-event-preview .event=${e}></calendar-event-preview>
                                                </alps-popup>
                                            `)}
                                        </div>
                                    `)}
                            </div>
                        </div>
                    </div>

                    <div class="time-grid-body">
                        <div class="time-axis">
                            ${e.map(e=>s`
                                <div class="time-label" style="top: ${e*48}px">${new Date(2e3,0,1,e).toLocaleTimeString(void 0,{hour:`2-digit`,minute:`2-digit`,hour12:this.clock.hour12})}</div>
                            `)}
                        </div>
                        <div class="time-grid-columns">
                            ${this.days.map(e=>{let n=this.getEventsForDate(e,!1),r=new Date(e);r.setHours(0,0,0,0);let i=new Date(e);return i.setHours(23,59,59,999),s`
                                    <div class="time-column" @click=${t=>this.handleColumnClick(t,e)} style="cursor: pointer;">
                                        ${r.getTime()===t.getTime()?s`
                                            <div class="now-line" style="top: ${(this.now.getHours()+this.now.getMinutes()/60)*48}px"></div>
                                        `:``}
                                        ${n.map(e=>{let t=new Date(e.start),n=new Date(e.end),a=t<r?r:t,o=n>i?i:n,c=t<=r?0:a.getHours()*48+a.getMinutes()/60*48,l=n>i?1152:o.getHours()*48+o.getMinutes()/60*48,u=l<=c&&o>a?(o.getTime()-a.getTime())/36e5*48:l-c;return u<20&&(u=20),c+u>1152&&(u=1152-c),s`
                                                <alps-popup 
                                                    class="time-event-popup"
                                                    align="start" position="bottom" 
                                                    style="top: ${c}px; height: ${u}px;"
                                                    @click=${e=>e.stopPropagation()}>
                                                    <div slot="trigger"
                                                        class="time-event ${e.status===`declined`?`declined`:``}" 
                                                        style="${e.color?`background-color: ${e.color}; border-color: ${e.color};`:``}" 
                                                        title="${e.summary||this.i18nStore?.t(`calendar.noTitle`)}">
                                                        <div class="time-event-title"><bdi>${e.summary||this.i18nStore?.t(`calendar.noTitle`)}</bdi></div>
                                                    </div>
                                                    <calendar-event-preview .event=${e}></calendar-event-preview>
                                                </alps-popup>
                                            `})}
                                    </div>
                                `})}
                        </div>
                    </div>
                </div>
            </div>
        `}};v([n({context:m})],V.prototype,`i18nStore`,void 0),v([a({type:Array})],V.prototype,`days`,void 0),v([a({type:Array})],V.prototype,`events`,void 0),v([i()],V.prototype,`scrolled`,void 0),v([i()],V.prototype,`now`,void 0),V=v([t(`calendar-time-grid`)],V);var H=class extends r{constructor(...e){super(...e),this.events=[]}static{this.styles=o`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
        }
    `}render(){return s`
            <calendar-time-grid 
                .days=${[this.date]} 
                .events=${this.events}
            ></calendar-time-grid>
        `}};v([a({type:Object})],H.prototype,`date`,void 0),v([a({type:Array})],H.prototype,`events`,void 0),H=v([t(`calendar-day-view`)],H);var U=class extends r{constructor(...e){super(...e),this.events=[],this.weekStart=1}getFirstDayOfWeek(){return this.weekStart??1}static{this.styles=o`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
        }
    `}getWeekDays(){let e=I(this.date,this.getFirstDayOfWeek()),t=e.getFullYear(),n=e.getMonth(),r=e.getDate();return Array.from({length:7},(e,i)=>new Date(t,n,r+i))}render(){return s`
            <calendar-time-grid 
                .days=${this.getWeekDays()} 
                .events=${this.events}
                .i18nStore=${this.i18nStore}
            ></calendar-time-grid>
        `}};v([n({context:m}),a({attribute:!1})],U.prototype,`i18nStore`,void 0),v([a({type:Object})],U.prototype,`date`,void 0),v([a({type:Array})],U.prototype,`events`,void 0),v([a({type:Number})],U.prototype,`weekStart`,void 0),U=v([t(`calendar-week-view`)],U);var W=class extends r{constructor(...e){super(...e),this.events=[],this.weekStart=1}getFirstDayOfWeek(){return this.weekStart??1}static{this.styles=o`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            background-color: var(--bg-primary, #ffffff);
        }

        .month-view {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .month-header {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #ffffff);
        }

        .month-header-cell {
            text-align: end;
            padding: 8px 12px;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary, #4b5563);
            border-inline-end: 1px solid var(--border-color, #e5e7eb);
        }
        .month-header-cell:last-child { border-inline-end: none; }

        .month-grid {
            flex: 1;
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-auto-rows: 1fr;
            background: var(--border-color, #e5e7eb);
            gap: 1px;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .month-cell {
            background-color: var(--bg-primary, #ffffff);
            padding: 4px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            overflow: hidden;
        }
        .month-cell.other-month {
            background-color: var(--bg-secondary, #f9fafb);
            opacity: 0.7;
        }

        .date-number {
            align-self: flex-end;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 4px;
            padding: 2px 6px;
            border-radius: 12px;
        }
        .date-number.today {
            background-color: var(--error, #ef4444);
            color: #ffffff;
        }
        @media (forced-colors: active) {
            .date-number.today {
                outline: 2px solid CanvasText;
                outline-offset: -2px;
            }
        }

        .event-chip {
            background-color: var(--accent-fill, #2563eb);
            color: #ffffff;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            opacity: 0.9;
        }
        /* An invitation the user declined stays in view, so it can be taken
           back, but reads as not happening. */
        .declined {
            opacity: 0.55;
            text-decoration: line-through;
        }

        .event-chip:hover {
            opacity: 1;
        }
        /* A task's chip: outlined in its calendar's colour, marked with a check,
           so it does not read as an all-day event. Doubled to outrank the
           all-day chip's own background. */
        .event-chip.event-chip.task {
            display: flex;
            align-items: center;
            gap: 4px;
            background-color: var(--bg-primary, #ffffff);
            color: var(--text-primary, #111827);
            border: 1px solid;
            border-inline-start-width: 3px;
            box-shadow: none;
        }
        .event-chip.task svg {
            flex-shrink: 0;
            width: 12px;
            height: 12px;
            fill: currentColor;
        }
        .event-chip.all-day {
            background-color: #f59e0b;
        }
    `}getMonthGrid(){let e=this.date.getFullYear(),t=this.date.getMonth(),n=this.getFirstDayOfWeek(),r=(new Date(e,t,1).getDay()-n+7)%7,i=1-r,a=new Date(e,t+1,0).getDate(),o=Math.ceil((a+r)/7)*7,s=[];for(let n=0;n<o;n++)s.push(new Date(e,t,i+n));return s}getEventsForDate(e,t){return this.events?this.events.filter(n=>{let r=E(n);if(t!==r)return!1;let i=new Date(e);i.setHours(0,0,0,0);let a=new Date(e);if(a.setHours(23,59,59,999),r){let e=n.start.split(`T`)[0],t=n.end.split(`T`)[0],r=new Date(e+`T00:00:00`),a=new Date(t+`T00:00:00`);return r<=i&&a>i}else{let e=new Date(n.start),t=new Date(n.end);return t.getTime()===i.getTime()&&e.getTime()<t.getTime()?!1:e<=a&&t>=i}}):[]}handleCellClick(e){this.dispatchEvent(new CustomEvent(`create-event`,{detail:{date:e,allDay:!0},bubbles:!0,composed:!0}))}render(){let e=this.getMonthGrid(),t=this.getFirstDayOfWeek(),n=Array.from({length:7},(e,n)=>{let r=(t+n)%7;return this.i18nStore?.t(`calendar.daysShort.${r}`)}),r=new Date;return r.setHours(0,0,0,0),s`
            <div class="month-view">
                <div class="month-header">
                    ${n.map(e=>s`<div class="month-header-cell">${e}</div>`)}
                </div>
                <div class="month-grid">
                    ${e.map(e=>{let t=e.getMonth()!==this.date.getMonth(),n=e.getTime()===r.getTime(),i=this.getEventsForDate(e,!0).concat(this.getEventsForDate(e,!1));return s`
                            <div class="month-cell ${t?`other-month`:``}" @click=${()=>this.handleCellClick(e)} style="cursor: pointer;">
                                <div class="date-number ${n?`today`:``}">${e.getDate()}</div>
                                ${i.slice(0,4).map(e=>s`
                                    <alps-popup align="start" position="bottom" style="width: 100%; display: block;" @click=${e=>e.stopPropagation()}>
                                        <div slot="trigger"
                                            class="event-chip ${E(e)?`all-day`:``} ${e.task?`task`:``} ${e.status===`declined`?`declined`:``}" 
                                            style=${e.task?`border-color: ${e.color}`:e.color?`background-color: ${e.color}`:``}
                                            title="${e.summary||this.i18nStore?.t(`calendar.noTitle`)}">
                                            ${e.task?d(`checkCircle`):``}<bdi>${e.summary||this.i18nStore?.t(`calendar.noTitle`)}</bdi>
                                        </div>
                                        <calendar-event-preview .event=${e}></calendar-event-preview>
                                    </alps-popup>
                                `)}
                                ${i.length>4?s`<div style="font-size: 11px; color: var(--text-muted); padding-inline-start: 4px;">${this.i18nStore?.t(`calendar.moreEvents`,{count:i.length-4})}</div>`:``}
                            </div>
                        `})}
                </div>
            </div>
        `}};v([n({context:m})],W.prototype,`i18nStore`,void 0),v([a({type:Object})],W.prototype,`date`,void 0),v([a({type:Array})],W.prototype,`events`,void 0),v([a({type:Number})],W.prototype,`weekStart`,void 0),W=v([t(`calendar-month-view`)],W);var G=class extends r{constructor(...e){super(...e),this.events=[]}static{this.styles=o`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
            background-color: var(--bg-primary, #ffffff);
        }

        .year-view {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            grid-auto-rows: minmax(240px, 1fr);
            gap: 48px 36px;
            padding: 32px 64px;
            overflow-y: auto;
            height: 100%;
            width: 100%;
            box-sizing: border-box;

            /* Fluid typography for the mini-months inside the year view */
            --mini-month-font-size: clamp(12px, 1.2vw, 18px);
            --mini-month-title-size: clamp(16px, 1.5vw, 24px);
            --mini-month-day-size: clamp(11px, 1vw, 16px);
        }

        calendar-mini-month {
            padding: 12px;
            box-sizing: border-box;
        }

        @media (min-width: 600px) {
            .year-view { grid-template-columns: repeat(2, 1fr); }
        }

        @media (min-width: 900px) {
            .year-view { grid-template-columns: repeat(3, 1fr); }
        }

        @media (min-width: 1200px) {
            .year-view { grid-template-columns: repeat(4, 1fr); }
        }
    `}render(){return s`
            <div class="year-view">
                ${Array.from({length:12},(e,t)=>t).map(e=>s`
                    <calendar-mini-month 
                        .year=${this.year} 
                        .month=${e} 
                        .events=${this.events}
                        .showTitle=${!0}
                        .weekStart=${this.weekStart}
                    ></calendar-mini-month>
                `)}
            </div>
        `}};v([a({type:Number})],G.prototype,`year`,void 0),v([a({type:Array})],G.prototype,`events`,void 0),v([a({type:Number})],G.prototype,`weekStart`,void 0),G=v([t(`calendar-year-view`)],G);var K=class extends r{constructor(...e){super(...e),this.clock=new w(this),this.events=[]}static{this.styles=[C,o`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            overflow-y: auto;
            background-color: var(--bg-primary, #ffffff);
            padding: 16px;
            box-sizing: border-box;
        }

        .list-container {
            max-width: 800px;
            margin: 0 auto;
            width: 100%;
        }

        .no-results {
            text-align: center;
            color: var(--text-muted, #6b7280);
            padding: 40px;
            font-size: 16px;
        }

        .event-item {
            display: flex;
            padding: 16px;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            cursor: pointer;
            transition: background-color 0.15s;
            align-items: flex-start;
            gap: 16px;
        }

        /* An invitation the user declined stays in view, so it can be taken
           back, but reads as not happening. */
        .event-item.declined .event-title {
            opacity: 0.55;
            text-decoration: line-through;
        }

        .event-item:hover {
            background-color: var(--bg-tertiary, #f3f4f6);
        }

        .event-date {
            width: 100px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
        }

        .date-day {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .date-month {
            font-size: 14px;
            color: var(--text-secondary);
        }

        .date-time {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 4px;
        }

        .event-details {
            flex: 1;
            min-width: 0;
        }

        .event-title {
            font-size: 16px;
            font-weight: 500;
            color: var(--text-primary);
            margin: 0 0 4px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* The event's calendar, by its colour. Drawn by its background
           alone, which forced colors repaint as the page: kept. */
        .color-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
            forced-color-adjust: none;
        }

        .event-location {
            font-size: 14px;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    `]}render(){return this.events.length===0?s`
                <div class="list-container">
                    <div class="no-results">${this.i18nStore?.t(`calendar.noResults`)}</div>
                </div>
            `:s`
            <div class="list-container">
                ${[...this.events].sort((e,t)=>new Date(e.start).getTime()-new Date(t.start).getTime()).map(e=>{let t=E(e),n=t?new Date(e.start.split(`T`)[0]+`T00:00:00`):new Date(e.start);return s`
                        <alps-popup align="start" position="bottom" style="width: 100%; display: block;" @click=${e=>e.stopPropagation()}>
                            <div slot="trigger" class="event-item ${e.status===`declined`?`declined`:``}">
                                <div class="event-date">
                                    <span class="date-day">${n.getDate()}</span>
                                    <span class="date-month">${this.i18nStore?.t(`calendar.monthsShort.${n.getMonth()}`)} ${n.getFullYear()}</span>
                                    <span class="date-time">
                                        ${t?this.i18nStore?.t(`calendar.allDay`):n.toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`,hour12:this.clock.hour12})}
                                    </span>
                                </div>
                                <div class="event-details">
                                    <h3 class="event-title">
                                        <div class="color-dot" style="background-color: ${e.color||`#2563eb`}"></div>
                                        <bdi>${e.summary||this.i18nStore?.t(`calendar.noTitle`)}</bdi>
                                    </h3>
                                    ${e.location?s`
                                        <div class="event-location">
                                            📍 ${e.location}
                                        </div>
                                    `:``}
                                </div>
                            </div>
                            <calendar-event-preview .event=${e}></calendar-event-preview>
                        </alps-popup>
                    `})}
            </div>
        `}};v([n({context:m})],K.prototype,`i18nStore`,void 0),v([a({type:Array})],K.prototype,`events`,void 0),K=v([t(`calendar-list-view`)],K);var q=class extends r{constructor(...e){super(...e),this.selectedDate=new Date,this.events=[],this.viewDate=new Date}static{this.styles=o`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
        }

        .mini-calendar-wrapper {
            margin-top: auto;
            min-height: 220px;
            display: flex;
            flex-direction: column;
        }

        .mini-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-weight: 500;
            font-size: 14px;
            gap: 4px;
        }

        .mini-header alps-icon-btn { flex-shrink: 0; }
        .month-caption {
            flex: 1;
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
        }
    `}updated(e){e.has(`selectedDate`)&&this.selectedDate&&(this.viewDate=new Date(this.selectedDate))}changeMonth(e){this.viewDate=new Date(this.viewDate.getFullYear(),this.viewDate.getMonth()+e,1)}render(){let e=this.viewDate.getFullYear(),t=this.viewDate.getMonth(),n=this.i18nStore?.t(`calendar.months.${t}`);return s`
            <div class="mini-calendar-wrapper">
                <div class="mini-header">
                    <alps-icon-btn icon="caretLeft" title=${this.i18nStore?.t(`calendar.previousMonth`)} @click=${()=>this.changeMonth(-1)}></alps-icon-btn>
                    <span class="month-caption" title=${`${n} ${e}`}>${n} ${e}</span>
                    <alps-icon-btn icon="caretRight" title=${this.i18nStore?.t(`calendar.nextMonth`)} @click=${()=>this.changeMonth(1)}></alps-icon-btn>
                </div>
                <!-- The month's date-selected bubbles out of this shadow root
                     by itself, as it does out of the year view's. A second
                     one sent from here made the calendar page take every day
                     picked twice, and read the calendar twice for it. -->
                <calendar-mini-month
                    .year=${e}
                    .month=${t}
                    .events=${this.events}
                    .currentDate=${this.selectedDate}
                    .weekStart=${this.weekStart}
                ></calendar-mini-month>
            </div>
        `}};v([n({context:m})],q.prototype,`i18nStore`,void 0),v([a({type:Object})],q.prototype,`selectedDate`,void 0),v([a({type:Array})],q.prototype,`events`,void 0),v([a({type:Number})],q.prototype,`weekStart`,void 0),v([i()],q.prototype,`viewDate`,void 0),q=v([t(`alps-sidebar-calendar`)],q);var J=class extends r{constructor(...e){super(...e),this._handleI18nChange=()=>this.requestUpdate(),this.label=`Today`}static{this.styles=[C,o`
        :host {
            display: inline-flex;
        }

        .nav-buttons {
            display: flex;
            align-items: center;
        }

        .nav-buttons button {
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            padding: 6px 12px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary, #111827);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 30px;
            box-sizing: border-box;
            transition: background-color 0.2s;
        }

        .nav-buttons button svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        .nav-buttons button:first-child {
            border-radius: 0;
            border-start-start-radius: 6px;
            border-end-start-radius: 6px;
        }
        
        .nav-buttons button:last-child {
            border-radius: 0;
            border-start-end-radius: 6px;
            border-end-end-radius: 6px;
            border-inline-start: none;
        }
        
        .nav-buttons button:nth-child(2) {
            border-inline-start: none;
            padding-inline-start: 16px;
            padding-inline-end: 16px;
        }

        @media (hover: hover) {
            .nav-buttons button:hover {
                background-color: var(--bg-secondary, #f3f4f6);
            }
        }
    `]}handlePrevious(){this.dispatchEvent(new CustomEvent(`previous`,{bubbles:!0,composed:!0}))}handleNext(){this.dispatchEvent(new CustomEvent(`next`,{bubbles:!0,composed:!0}))}handleCenter(){this.dispatchEvent(new CustomEvent(`center`,{bubbles:!0,composed:!0}))}connectedCallback(){super.connectedCallback(),this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}render(){return s`
            <div class="nav-buttons">
                <button @click=${this.handlePrevious} aria-label=${this.i18nStore?.t(`general.previous`)||`Previous`}>
                    ${d(`caretLeft`)}
                </button>
                <button @click=${this.handleCenter}>
                    ${this.label}
                </button>
                <button @click=${this.handleNext} aria-label=${this.i18nStore?.t(`general.next`)||`Next`}>
                    ${d(`caretRight`)}
                </button>
            </div>
        `}};v([n({context:m})],J.prototype,`i18nStore`,void 0),v([a({type:String})],J.prototype,`label`,void 0),J=v([t(`alps-nav-buttons`)],J);var Y=250,X=500,Z=120,Q=`alps.calendar.showTasks`;function ne(){try{return localStorage.getItem(Q)!==`false`}catch{return!0}}function re(e){try{localStorage.setItem(Q,String(e))}catch{}}var $=class extends r{constructor(...e){super(...e),this.calendars=[],this.events=[],this.currentDate=new Date,this.viewMode=`month`,this.loading=!0,this.isSpinning=!1,this.modalOpen=!1,this.activeCalendars=new Set,this.knownCalendarPaths=new Set,this.showTasks=ne(),this.taskModalOpen=!1,this.searchQuery=``,this.sidebarWidth=250,this.sidebarCollapsed=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.promptOpen=!1,this.promptFields=[],this.syncIntervalTimer=null,this.fetchSeq=0,this.promptMode=null,this.promptTarget=null,this.calendarToDelete=null,this.eventToDelete=null,this.scheduling=`email`,this.activeKebabMenu=null,this.isSidebarDragging=!1,this._lastWeekStart=1,this._handleSettingsChange=()=>{if(this.settingsStore){let e=this.settingsStore.getState();this.sidebarCollapsed=e.sidebarCollapsed;let t=this.getFirstDayOfWeek(),n=t!==this._lastWeekStart;if(this._lastWeekStart=t,this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null),e.checkMailInterval&&e.checkMailInterval>0){let t=e.checkMailInterval*60*1e3;this.syncIntervalTimer=setInterval(()=>{this.fetchData()},t)}n&&this.viewMode===`week`&&this.fetchData(),this.requestUpdate()}},this.handleHashChange=()=>{this.parseHash()&&this.fetchData()},this.handleResize=()=>{this.isMobile=window.innerWidth<=768},this.handleSpinIteration=()=>{this.loading||(this.isSpinning=!1)}}static{this.styles=[C,te,y,p,o`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
        }

        .app-container.collapsed .main-content {
            box-shadow: rgba(95, 95, 95, 0.1) calc(-4px * var(--ui-inline-direction, 1)) 0 4px -2px;
            z-index: 25;
            border-inline-start: 1px solid var(--border-color, #e5e7eb);
            position: relative;
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
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .sidebar-scroll-content {
            padding: 16px;
            display: flex;
            flex-direction: column;
            height: 100%;
            box-sizing: border-box;
            gap: 24px;
        }

        .calendars-list {
            flex: 1;
            overflow-y: auto;
        }

        .calendar-item {
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

        .calendar-item:hover {
            background-color: var(--bg-tertiary, #f3f4f6);
        }

        /* The part of the row that is its checkbox: the box and the name. The
           row's menu sits beside it, not in it. */
        .calendar-control {
            display: flex;
            align-items: center;
            flex: 1;
            min-width: 0;
            border-radius: 4px;
        }

        .calendar-item span {
            font-size: 14px;
            color: var(--text-primary, #111827);
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Drawn in the calendar's colour, the legend for its events.
           Forced colors would paint the box and its fill in system colours
           and lose the colour: kept. The check says whether it is on. */
        .calendar-checkbox {
            forced-color-adjust: none;
            width: 16px;
            height: 16px;
            border-radius: 4px;
            border: 2px solid var(--cal-color);
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            background-color: transparent;
            margin-inline-end: 8px;
            flex-shrink: 0;
        }

        .calendar-checkbox.checked {
            background-color: var(--cal-color);
        }

        .calendar-checkbox svg {
            width: 12px;
            height: 12px;
            color: #fff;
            fill: currentColor;
        }

        .sidebar-footer-btn {
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px;
            border-radius: 6px;
            width: 100%;
        }

        .sidebar-footer-btn:hover {
            background-color: var(--border-color, #e5e7eb);
        }

        .sidebar-footer-btn svg {
            width: 18px;
            height: 18px;
            color: var(--text-secondary, #4b5563);
        }

        .calendar-actions {
            display: none;
            align-items: center;
            margin-inline-start: auto;
            margin-inline-end: -4px;
        }

        @media (hover: hover) {
            .calendar-item:hover .calendar-actions {
                display: flex;
            }
        }
        @media (hover: none) {
            .calendar-actions { display: flex; }
        }
        /* Shown while the keyboard is in its row, so that Tab reaches the
           menu from the calendar's checkbox: a button inside display: none is
           no Tab stop, and so it could never take the focus that shows it.
           Not while a click has put the focus on the checkbox: a click leaves
           the row as it was. */
        .calendar-item:focus-within:not(:has(.calendar-control:focus:not(:focus-visible))) .calendar-actions {
            display: flex;
        }
        .calendar-actions:focus-within,
        .calendar-actions.popup-open {
            display: flex;
        }

        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background-color: var(--bg-primary, #ffffff);
            justify-content: center;
        }

        .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 57px;
            padding: 0 24px;
            box-sizing: border-box;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            flex-shrink: 0;
            background: var(--bg-primary, #ffffff);
        }

        .toolbar-left {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .toolbar-left h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }

        .toolbar-left .sub-title {
            font-weight: 300;
            color: var(--text-secondary, #4b5563);
        }

        .toolbar-center {
            flex: 1;
            display: flex;
            justify-content: center;
        }

        .toolbar-right {
            flex: 1;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 8px;
        }

        .mobile-bottom-header {
            height: 57px;
            box-sizing: border-box;
            padding: 0 12px;
            border-top: 1px solid var(--border-color, #e5e7eb);
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-primary, #ffffff);
            flex-shrink: 0;
            position: relative;
            z-index: 10;
            box-shadow: rgba(95, 95, 95, 0.1) 0 -4px 4px -2px;
        }

        .mobile-bottom-actions {
            display: flex;
            width: 100%;
        }

        @media (max-width: 768px) {
            .toolbar {
                padding: 0 12px;
            }
            .toolbar-left {
                flex: 1;
                min-width: 0;
            }
            .toolbar-left h2 {
                font-size: 18px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .toolbar-left h2 .sub-title {
                display: none;
            }
            .toolbar-right {
                flex: unset;
                gap: 4px;
            }
        }

        .calendar-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }
    `]}getFirstDayOfWeek(){return this.settingsStore?.getState()?.weekStart??1}async connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this.handleResize),window.addEventListener(`hashchange`,this.handleHashChange),this.settingsStore&&(this._lastWeekStart=this.getFirstDayOfWeek(),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._handleSettingsChange()),this.parseHash(h()??``),await this.fetchData()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this.handleResize),window.removeEventListener(`hashchange`,this.handleHashChange),this.settingsStore&&this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null),this.fetchSeq++}reportFailure(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(e),type:`error`,duration:5e3}}))}parseHash(e=window.location.hash){if(!e.startsWith(`#/calendar`))return!1;let[t,n]=e.substring(1).split(`?`),r=t.split(`/`),i=!1;if(r.length>=3){let e=r[2];[`day`,`week`,`month`,`year`].includes(e)&&this.viewMode!==e&&(this.viewMode=e,i=!0)}if(r.length>=4){let e=r[3],t=new Date(this.currentDate);if(this.viewMode===`year`){let n=parseInt(e,10);isNaN(n)||t.setFullYear(n)}else if(this.viewMode===`month`){let[n,r]=e.split(`-`);n&&r&&(t=new Date(parseInt(n,10),parseInt(r,10)-1,1))}else{let[n,r,i]=e.split(`-`);n&&r&&i&&(t=new Date(parseInt(n,10),parseInt(r,10)-1,parseInt(i,10)))}(t.getFullYear()!==this.currentDate.getFullYear()||t.getMonth()!==this.currentDate.getMonth()||t.getDate()!==this.currentDate.getDate())&&(this.currentDate=t,i=!0)}let a=``;return n&&(a=new URLSearchParams(`?`+n).get(`q`)||``),this.searchQuery!==a&&(this.searchQuery=a,i=!0),!x(window.location.hash)&&(t===`/calendar`||t===`/calendar/`)&&history.replaceState(history.state,``,this.hashFor(this.viewMode,this.currentDate,this.searchQuery)),i}hashFor(e,t,n=``){let r=t.getFullYear(),i=String(t.getMonth()+1).padStart(2,`0`),a=String(t.getDate()).padStart(2,`0`),o=`#/calendar/${e}`;return e===`year`?o+=`/${r}`:e===`month`?o+=`/${r}-${i}`:o+=`/${r}-${i}-${a}`,n&&(o+=`?q=${encodeURIComponent(n)}`),o}navigate(e,t,n=``){let r=this.hashFor(e,t,n);if(b(r)){this.parseHash(r)&&this.fetchData();return}window.location.hash===r?this.fetchData():window.location.hash=r}async fetchData(){if(!this.isConnected)return;let e=++this.fetchSeq;this.loading=!0,this.isSpinning=!0;let t=this.showTasks&&!this.searchQuery?T.fetchTasks(`active`).catch(t=>(console.error(`Failed to load tasks for the calendar`,t),e===this.fetchSeq&&this.reportFailure(`tasks.loadFailed`),null)):Promise.resolve(null);try{let n=await j.fetchCalendars();if(e!==this.fetchSeq)return;this.scheduling=n.scheduling===`server`?`server`:`email`;let r,i,a=this.currentDate.getFullYear(),o=this.currentDate.getMonth();this.viewMode===`year`?(r=new Date(a,0,1),i=new Date(a+1,0,1)):this.viewMode===`month`?(r=new Date(a,o,1),i=new Date(a,o+1,0),r.setDate(r.getDate()-14),i.setDate(i.getDate()+14)):this.viewMode===`week`?(r=I(this.currentDate,this.getFirstDayOfWeek()),i=new Date(r),i.setDate(r.getDate()+7)):(r=new Date(this.currentDate),r.setHours(0,0,0,0),i=new Date(this.currentDate),i.setHours(23,59,59,999));let s=await j.fetchEvents(r,i,this.searchQuery);if(e!==this.fetchSeq)return;let l=s.events||[],u=[];for(let e of l)if(e.rrule)try{let t=new Date(e.start),n=new Date(e.end).getTime()-t.getTime(),a=c.parseString(e.rrule);a.dtstart=t;let o=new c(a).between(r,i,!0);for(let t of o)u.push({...e,start:t.toISOString(),end:new Date(t.getTime()+n).toISOString()})}catch(t){console.error(`Failed to parse rrule for event`,e.uid,t),u.push(e)}else u.push(e);let d=(await t)?.tasks??[];if(e!==this.fetchSeq)return;this.events=[...u,...P(d)].map(e=>({...e,color:e.color||N(e.calendarPath||e.path)})),this.calendars=n.calendars.filter(O).map(e=>({...e,color:e.color||N(e.path)}));let f=new Set(this.calendars.map(e=>e.path));this.activeCalendars=new Set([...[...this.activeCalendars].filter(e=>f.has(e)),...[...f].filter(e=>!this.knownCalendarPaths.has(e))]),this.knownCalendarPaths=f}catch(t){console.error(t),e===this.fetchSeq&&this.reportFailure(`calendar.loadFailed`)}finally{e===this.fetchSeq&&(this.loading=!1)}}changeDate(e,t){let n=new Date(this.currentDate),r=t||this.viewMode;if(r===`year`||r===`month`){let t=r===`year`?e*12:e,i=new Date(n.getFullYear(),n.getMonth()+t+1,0).getDate();n=new Date(n.getFullYear(),n.getMonth()+t,Math.min(n.getDate(),i))}else r===`week`?n.setDate(n.getDate()+e*7):n.setDate(n.getDate()+e);this.navigate(r,n)}openCreateModal(e,t){this.selectedEvent=void 0,this.initialDate=e,this.initialAllDay=t,this.modalOpen=!0,this.isMobile&&(this.mobileSidebarOpen=!1)}openEditModal(e){if(e.task){this.editingTask=e.task,this.taskModalOpen=!0;return}this.selectedEvent=e,this.initialDate=void 0,this.initialAllDay=void 0,this.modalOpen=!0}handleModalClose(){this.modalOpen=!1,this.selectedEvent=void 0,this.initialDate=void 0,this.initialAllDay=void 0}async handleModalSaved(){this.modalOpen=!1,this.selectedEvent=void 0,this.initialDate=void 0,this.initialAllDay=void 0,await this.fetchData()}viewShows(e){let t=this.currentDate;if(this.viewMode===`year`)return e.getFullYear()===t.getFullYear();if(this.viewMode===`month`)return e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth();if(this.viewMode===`week`){let n=I(t,this.getFirstDayOfWeek()),r=new Date(n);return r.setDate(n.getDate()+7),e>=n&&e<r}return e.toDateString()===t.toDateString()}dayForViewSwitch(e){if(e===`day`||e===`week`){let e=new Date;if(this.viewShows(e))return e}return this.currentDate}goToToday(){this.navigate(`day`,new Date)}setViewMode(e){this.navigate(e,this.dayForViewSwitch(e))}handleDateSelected(e){this.navigate(`day`,e),g(this.renderRoot),this.isMobile&&(this.mobileSidebarOpen=!1)}handleAddCalendar(){this.promptFields=[{id:`name`,label:this.i18nStore?.t(`calendar.calendarName`),autofocus:!0}],this.promptMode=`add`,this.promptOpen=!0}handleRenameCalendar(e){this.promptFields=[{id:`name`,label:this.i18nStore?.t(`calendar.calendarName`),value:e.name,autofocus:!0}],this.promptMode=`rename`,this.promptTarget=e,this.promptOpen=!0}handleDeleteCalendar(e){this.calendarToDelete=e}async _executeDeleteCalendar(){if(!this.calendarToDelete)return;let e=this.calendarToDelete;this.calendarToDelete=null;try{if(await j.deleteCalendar(e.path),this.calendars=this.calendars.filter(t=>t.path!==e.path),this.activeCalendars.has(e.path)){let t=new Set(this.activeCalendars);t.delete(e.path),this.activeCalendars=t}await this.fetchData()}catch(e){console.error(`Failed to delete calendar`,e),this.reportFailure(`calendar.deleteCalendarFailed`)}}async _executeDeleteEvent(e=!0){if(!this.eventToDelete)return;let t=this.eventToDelete;this.eventToDelete=null;try{t.task?(await T.deleteTask(t.task.path,{notify:e,lang:this.i18nStore?.getLanguage?.()}))?.sendFailed&&this.reportFailure(`invitations.notTold`):(await j.deleteEvent(t.path,{notify:e,lang:this.i18nStore?.getLanguage?.()}))?.sendFailed&&this.reportFailure(`invitations.notTold`),await this.fetchData()}catch(e){console.error(`Failed to delete event`,e),this.reportFailure(t.task?`tasks.deleteFailed`:`calendar.deleteEventFailed`)}}isShown(e){return e.task?this.showTasks&&(!this.calendars.some(t=>t.path===e.calendarPath)||this.activeCalendars.has(e.calendarPath)):this.activeCalendars.has(e.calendarPath)}toggleTasks(){this.showTasks=!this.showTasks,re(this.showTasks),this.fetchData()}async respondToEvent(e,t){try{(await j.respondToEvent(e,t,this.i18nStore?.getLanguage?.())).sendFailed&&this.reportFailure(`invitations.sendFailed`),await this.fetchData()}catch(e){console.error(`Failed to answer the invitation`,e);let t=_(e);this.reportFailure(t?`invitations.changedElsewhere`:`invitations.answerFailed`),t&&await this.fetchData()}}async completeTask(e){try{(await T.completeTask(e.path,!0,this.i18nStore?.getLanguage?.()))?.sendFailed&&this.reportFailure(`invitations.notTold`),await this.fetchData()}catch(e){console.error(`Failed to update task`,e),this.reportFailure(`tasks.completeFailed`)}}closeTaskModal(){this.taskModalOpen=!1,this.editingTask=void 0}handleCheckboxKeyDown(e,t){e.key!==` `&&e.key!==`Enter`||(e.preventDefault(),!e.repeat&&t())}toggleCalendar(e){let t=new Set(this.activeCalendars);t.has(e)?t.delete(e):t.add(e),this.activeCalendars=t}async handlePromptSubmit(e){this.promptOpen=!1;let t=e.detail.name;if(t)try{this.promptMode===`add`?await j.createCalendar(t):this.promptMode===`rename`&&this.promptTarget&&await j.renameCalendar(this.promptTarget.path,t),await this.fetchData()}catch(e){console.error(`Failed to save calendar`,e),this.reportFailure(`calendar.saveCalendarFailed`)}}handlePromptCancel(){this.promptOpen=!1}get username(){return this.settingsStore?.getState().loginUsername||``}render(){let e=this.i18nStore?.t(`calendar.months.${this.currentDate.getMonth()}`),t=this.currentDate.getFullYear(),n=``;n=this.searchQuery?this.i18nStore?.t(`calendar.searchResults`):this.viewMode===`year`?t.toString():this.viewMode===`day`?`${this.currentDate.getDate()} ${e}`:e;let r=this.events.filter(e=>this.isShown(e));return s`
            <app-header 
                currentTab="calendar"
                .username=${this.username}
                .isMobile=${this.isMobile}
                .searchQuery=${this.searchQuery}
                @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
                @search-submit=${e=>{this.navigate(this.viewMode,this.currentDate,e.detail.value)}}
            ></app-header>
            <div class="app-container ${this.sidebarCollapsed&&!this.isMobile?`collapsed`:``} ${this.isSidebarDragging?`dragging`:``}" style="${!this.sidebarCollapsed&&!this.isMobile?`--sidebar-width: ${this.sidebarWidth}px;`:``}">
                <div class="layout">
                    <alps-sidebar 
                        class="${this.isMobile?`mobile-sidebar`:`desktop-sidebar`} ${this.mobileSidebarOpen?`open`:``}"
                        .isMobile=${this.isMobile}
                        .isOpen=${this.mobileSidebarOpen}
                        .collapsed=${this.sidebarCollapsed&&!this.isMobile}
                        .width=${this.sidebarWidth}
                        @toggle-collapse=${()=>{let e=!this.sidebarCollapsed;this.sidebarCollapsed=e,this.settingsStore&&this.settingsStore.updateSettings({sidebarCollapsed:e})}}
                        @sidebar-resize=${e=>{let t=e.detail.newWidth;t<Z?(this.sidebarCollapsed||(this.sidebarCollapsed=!0,this.settingsStore&&this.settingsStore.updateSettings({sidebarCollapsed:!0})),this.sidebarWidth=Y):(this.sidebarCollapsed&&(this.sidebarCollapsed=!1,this.settingsStore&&this.settingsStore.updateSettings({sidebarCollapsed:!1})),this.sidebarWidth=Math.min(Math.max(t,180),X))}}
                        @drag-start=${()=>this.isSidebarDragging=!0}
                        @drag-end=${()=>this.isSidebarDragging=!1}
                        @close-sidebar=${()=>this.mobileSidebarOpen=!1}
                    >
                    <!-- Frame and content follow the strip state alps-sidebar
                         provides: collapsed, they keep everything (the
                         calendars, their menus, the mini-month), dimmed,
                         inert and behind the main view. -->
                    <alps-sidebar-frame class="sidebar-wrapper">
                        <alps-toolbar class="sidebar-header">
                            <alps-create-button 
                                icon="calendarPlus" 
                                @click=${()=>this.openCreateModal()}
                            >${this.i18nStore?.t(`calendar.addEvent`)}</alps-create-button>
                        </alps-toolbar>
                        <alps-sidebar-content class="sidebar-content">
                            <div class="sidebar-scroll-content">
                                <div class="calendars-list">
                                    <alps-sidebar-heading heading=${this.i18nStore?.t(`calendar.myCalendars`)??``}></alps-sidebar-heading>
                                    ${this.calendars.map(e=>s`
                                        <div class="calendar-item" @click=${()=>this.toggleCalendar(e.path)}>
                                            <!-- The calendar's checkbox: one Tab stop, named by
                                                 the calendar. Not the whole row, which also
                                                 holds the calendar's menu. -->
                                            <div class="calendar-control"
                                                role="checkbox"
                                                tabindex="0"
                                                aria-checked=${this.activeCalendars.has(e.path)?`true`:`false`}
                                                @keydown=${t=>this.handleCheckboxKeyDown(t,()=>this.toggleCalendar(e.path))}
                                            >
                                                <div class="calendar-checkbox ${this.activeCalendars.has(e.path)?`checked`:``}" style="--cal-color: ${e.color}">
                                                    ${this.activeCalendars.has(e.path)?d(`check`):``}
                                                </div>
                                                <span><bdi>${e.name}</bdi></span>
                                            </div>

                                            <div class="calendar-actions ${this.activeKebabMenu===e.path?`popup-open`:``}" @click=${e=>e.stopPropagation()}>
                                                <alps-popup 
                                                    align="end" 
                                                    position="bottom"
                                                    @popup-open=${()=>{this.activeKebabMenu=e.path}}
                                                    @popup-close=${()=>{this.activeKebabMenu===e.path&&(this.activeKebabMenu=null)}}
                                                >
                                                    <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical" title=${this.i18nStore?.t(`general.moreOptions`)}></alps-icon-btn>
                                                    <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.handleRenameCalendar(e)}}>
                                                        ${d(`pen`)} <span class="item-text">${this.i18nStore?.t(`calendar.rename`)}</span>
                                                    </button>
                                                    ${this.calendars.length>1&&!(e.path===`default`||e.path.endsWith(`/default`)||e.path.endsWith(`/default/`))?s`
                                                        <button class="dropdown-item text-danger" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.handleDeleteCalendar(e)}}>
                                                            ${d(`trash`)} <span class="item-text">${this.i18nStore?.t(`calendar.delete`)}</span>
                                                        </button>
                                                    `:``}
                                                </alps-popup>
                                            </div>
                                        </div>
                                    `)}
                                    <div class="calendar-item tasks-toggle" @click=${this.toggleTasks}>
                                        <div class="calendar-control"
                                            role="checkbox"
                                            tabindex="0"
                                            aria-checked=${this.showTasks?`true`:`false`}
                                            @keydown=${e=>this.handleCheckboxKeyDown(e,()=>this.toggleTasks())}
                                        >
                                            <div class="calendar-checkbox ${this.showTasks?`checked`:``}" style="--cal-color: var(--text-secondary, #4b5563)">
                                                ${this.showTasks?d(`check`):``}
                                            </div>
                                            <span>${this.i18nStore?.t(`tasks.title`)}</span>
                                        </div>
                                    </div>
                                </div>

                                <alps-sidebar-calendar
                                    .selectedDate=${this.currentDate}
                                    .events=${r}
                                    .weekStart=${this.getFirstDayOfWeek()}
                                    @date-selected=${e=>this.handleDateSelected(e.detail.date)}
                                ></alps-sidebar-calendar>
                            </div>
                        </alps-sidebar-content>
                    </alps-sidebar-frame>
                    <alps-icon-btn slot="footer-actions" icon="calendarPlus" title=${this.i18nStore?.t(`calendar.addCalendar`)} @click=${this.handleAddCalendar}></alps-icon-btn>
                </alps-sidebar>

                <div class="main-content">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <h2>${n} <span class="sub-title">${this.viewMode===`year`?``:t}</span></h2>
                        </div>
                        ${this.isMobile?``:s`
                        <div class="toolbar-center">
                            <alps-toggle 
                                .options=${[{label:this.i18nStore?.t(`calendar.day`),value:`day`},{label:this.i18nStore?.t(`calendar.week`),value:`week`},{label:this.i18nStore?.t(`calendar.month`),value:`month`},{label:this.i18nStore?.t(`calendar.year`),value:`year`}]}
                                .value=${this.viewMode}
                                @change=${e=>this.setViewMode(e.detail.value)}
                            ></alps-toggle>
                        </div>
                        `}
                        <div class="toolbar-right" style="display: flex; align-items: center; gap: 8px;">
                            <alps-icon-btn 
                                icon="arrowsClockwise" 
                                title="${this.i18nStore?.t(`mailboxPage.refresh`)}" 
                                ?spinning=${this.isSpinning}
                                @animationiteration=${this.handleSpinIteration}
                                @click=${this.fetchData}
                            ></alps-icon-btn>
                            <alps-nav-buttons 
                                label="${this.i18nStore?.t(`calendar.today`)}"
                                @previous=${()=>this.changeDate(-1)}
                                @center=${()=>this.goToToday()}
                                @next=${()=>this.changeDate(1)}
                            ></alps-nav-buttons>
                        </div>
                    </div>

                    <div class="calendar-body" @complete-task=${e=>void this.completeTask(e.detail.task)} @respond-event=${e=>void this.respondToEvent(e.detail.event,e.detail.status)}>
                        ${this.searchQuery?s`
                            <calendar-list-view
                                .events=${r}
                                @edit-event=${e=>this.openEditModal(e.detail.event)}
                                @delete-event=${e=>this.eventToDelete=e.detail.event}
                            ></calendar-list-view>
                        `:s`
                            ${this.viewMode===`year`?s`
                                <calendar-year-view 
                                .year=${t} 
                                .events=${r}
                                .weekStart=${this.getFirstDayOfWeek()}
                                @date-selected=${e=>this.handleDateSelected(e.detail.date)}
                            ></calendar-year-view>
                        `:``}
                        ${this.viewMode===`month`?s`
                            <calendar-month-view 
                                .date=${this.currentDate} 
                                .events=${r}
                                .weekStart=${this.getFirstDayOfWeek()}
                                @create-event=${e=>this.openCreateModal(e.detail.date,e.detail.allDay)}
                                @edit-event=${e=>this.openEditModal(e.detail.event)}
                                @delete-event=${e=>this.eventToDelete=e.detail.event}
                            ></calendar-month-view>
                        `:``}
                        ${this.viewMode===`week`?s`
                            <calendar-week-view 
                                .date=${this.currentDate} 
                                .events=${r}
                                .weekStart=${this.getFirstDayOfWeek()}
                                @create-event=${e=>this.openCreateModal(e.detail.date,e.detail.allDay)}
                                @edit-event=${e=>this.openEditModal(e.detail.event)}
                                @delete-event=${e=>this.eventToDelete=e.detail.event}
                            ></calendar-week-view>
                        `:``}
                            ${this.viewMode===`day`?s`
                                <calendar-day-view 
                                    .date=${this.currentDate} 
                                    .events=${r}
                                    @create-event=${e=>this.openCreateModal(e.detail.date,e.detail.allDay)}
                                    @edit-event=${e=>this.openEditModal(e.detail.event)}
                                    @delete-event=${e=>this.eventToDelete=e.detail.event}
                                ></calendar-day-view>
                            `:``}
                        `}
                    </div>
                    ${this.isMobile?s`
                        <div class="mobile-bottom-header">
                            <div class="mobile-bottom-actions">
                                <alps-toggle 
                                    full-width
                                    .options=${[{label:this.i18nStore?.t(`calendar.day`),value:`day`},{label:this.i18nStore?.t(`calendar.week`),value:`week`},{label:this.i18nStore?.t(`calendar.month`),value:`month`},{label:this.i18nStore?.t(`calendar.year`),value:`year`}]}
                                    .value=${this.viewMode}
                                    @change=${e=>this.setViewMode(e.detail.value)}
                                ></alps-toggle>
                            </div>
                        </div>
                    `:``}
                </div>
            </div>

            <task-modal
                .open=${this.taskModalOpen}
                .task=${this.editingTask}
                .scheduling=${this.scheduling}
                @close=${this.closeTaskModal}
                @saved=${()=>{this.closeTaskModal(),this.fetchData()}}
                @conflict=${this.fetchData}
                @delete=${e=>{this.closeTaskModal(),this.eventToDelete={...e.detail.task,task:e.detail.task}}}
            ></task-modal>

            <calendar-event-modal
                .open=${this.modalOpen}
                .event=${this.selectedEvent}
                .initialDate=${this.initialDate}
                .initialAllDay=${this.initialAllDay}
                .calendars=${this.calendars}
                @close=${this.handleModalClose}
                @saved=${this.handleModalSaved}
                @conflict=${this.fetchData}
            ></calendar-event-modal>

            ${this.promptOpen?s`
                <ui-prompt 
                    heading="${this.promptMode===`add`?this.i18nStore?.t(`calendar.addCalendar`):this.i18nStore?.t(`calendar.renameCalendar`)}" 
                    .fields=${this.promptFields}
                    @submit=${this.handlePromptSubmit} 
                    @cancel=${this.handlePromptCancel}
                ></ui-prompt>
            `:``}

            ${this.calendarToDelete?s`
                <ui-confirm
                    heading="${this.i18nStore?.t(`calendar.deleteCalendar`)}"
                    .message=${this.i18nStore?.t(`calendar.deleteCalendarConfirm`,{name:this.calendarToDelete.name})??``}
                    confirmText="${this.i18nStore?.t(`calendar.delete`)}"
                    isDanger
                    @confirm=${this._executeDeleteCalendar}
                    @cancel=${()=>this.calendarToDelete=null}
                ></ui-confirm>
            `:``}

            ${this.eventToDelete&&(this.eventToDelete.task?D(this.eventToDelete.task,this.scheduling):k(this.eventToDelete,this.scheduling))?s`
                <ui-confirm
                    class="delete-meeting"
                    heading="${this.i18nStore?.t(this.eventToDelete.task?`tasks.deleteTask`:`calendar.deleteEvent`)}"
                    message="${this.i18nStore?.t(this.eventToDelete.task?this.eventToDelete.task.role===`organizer`?`tasks.deleteTellAssignees`:`tasks.deleteTellAssigner`:this.eventToDelete.role===`organizer`?`invitations.deleteTellGuests`:`invitations.deleteTellOrganizer`)}"
                    confirmText="${this.i18nStore?.t(`invitations.deleteAndTell`)}"
                    secondaryText="${this.i18nStore?.t(`invitations.deleteOnly`)}"
                    isDanger
                    @confirm=${()=>this._executeDeleteEvent(!0)}
                    @secondary=${()=>this._executeDeleteEvent(!1)}
                    @cancel=${()=>this.eventToDelete=null}
                ></ui-confirm>
            `:this.eventToDelete?s`
                <ui-confirm
                    heading="${this.i18nStore?.t(this.eventToDelete.task?`tasks.deleteTask`:`calendar.deleteEvent`)}"
                    .message=${this.i18nStore?.t(this.eventToDelete.task?`tasks.deleteTaskConfirm`:`calendar.deleteEventConfirm`)??``}
                    confirmText="${this.i18nStore?.t(`calendar.delete`)}"
                    isDanger
                    @confirm=${()=>this._executeDeleteEvent()}
                    @cancel=${()=>this.eventToDelete=null}
                ></ui-confirm>
            `:``}
        `}};v([n({context:m})],$.prototype,`i18nStore`,void 0),v([n({context:l})],$.prototype,`settingsStore`,void 0),v([i()],$.prototype,`calendars`,void 0),v([i()],$.prototype,`events`,void 0),v([i()],$.prototype,`currentDate`,void 0),v([i()],$.prototype,`viewMode`,void 0),v([i()],$.prototype,`loading`,void 0),v([i()],$.prototype,`isSpinning`,void 0),v([i()],$.prototype,`modalOpen`,void 0),v([i()],$.prototype,`selectedEvent`,void 0),v([i()],$.prototype,`initialDate`,void 0),v([i()],$.prototype,`initialAllDay`,void 0),v([i()],$.prototype,`activeCalendars`,void 0),v([i()],$.prototype,`showTasks`,void 0),v([i()],$.prototype,`taskModalOpen`,void 0),v([i()],$.prototype,`editingTask`,void 0),v([i()],$.prototype,`searchQuery`,void 0),v([i()],$.prototype,`sidebarWidth`,void 0),v([i()],$.prototype,`sidebarCollapsed`,void 0),v([i()],$.prototype,`isMobile`,void 0),v([i()],$.prototype,`mobileSidebarOpen`,void 0),v([i()],$.prototype,`promptOpen`,void 0),v([i()],$.prototype,`promptFields`,void 0),v([i()],$.prototype,`promptMode`,void 0),v([i()],$.prototype,`promptTarget`,void 0),v([i()],$.prototype,`calendarToDelete`,void 0),v([i()],$.prototype,`eventToDelete`,void 0),v([i()],$.prototype,`scheduling`,void 0),v([i()],$.prototype,`activeKebabMenu`,void 0),v([i()],$.prototype,`isSidebarDragging`,void 0),$=v([t(`calendar-page`)],$);export{$ as CalendarPage};