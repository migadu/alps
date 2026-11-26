const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dav-connection-settings-DBW_eZ70.js","assets/lit-Drqu7DG3.js","assets/alps-button-1B4BsSBF.js","assets/rolldown-runtime-XKyaHtl9.js","assets/settings-store-BlPBHhbe.js","assets/alps-input-BEkzUnir.js","assets/ui-confirm-D0o7tidP.js","assets/calendar-page-DmVWJKvh.js","assets/task-modal-CUYJp2s6.js","assets/fetch-utils-VTb8hdll.js","assets/alps-address-input-B-N24X3O.js","assets/address-display-1EPr2xN-.js","assets/vendor-COBU12uM.js","assets/vendor-CFC-TXhq.css","assets/alps-icon-btn-0xOCbNBD.js","assets/tasks-page-B4gM3UB4.js","assets/contacts-page-DuEzCBoW.js","assets/openpgp-7ptK92FR.js","assets/gpg-settings-CBSus0su.js","assets/managesieve-page-J97sFkKT.js","assets/unsaved-r6brZd11.js","assets/auto-reply-page-37O5Bz-f.js","assets/password-settings-gGkKjcpY.js","assets/alps-floating-composer-BbyUr-Sy.js","assets/editor-DEVUhqTM.js","assets/emoji-DEpkJxIb.js"])))=>i.map(i=>d[i]);
import{n as e,r as t}from"./rolldown-runtime-XKyaHtl9.js";import{_ as n,a as r,b as i,c as a,d as o,f as s,g as c,h as l,i as u,l as d,m as f,o as p,p as m,r as h,s as g,u as _,v,x as y,y as b}from"./lit-Drqu7DG3.js";import{A as x,B as ee,C as S,D as C,E as w,F as T,G as te,H as ne,I as re,K as E,L as D,M as ie,N as O,O as ae,P as k,R as oe,S as se,T as ce,U as le,V as ue,W as de,_ as fe,a as A,b as pe,d as me,g as he,h as ge,i as _e,j as ve,k as ye,l as be,m as xe,n as j,o as M,r as Se,s as Ce,t as N,v as we,w as Te,x as P,y as Ee,z as De}from"./alps-button-1B4BsSBF.js";import{C as Oe,S as ke,_ as Ae,a as je,c as Me,d as Ne,g as Pe,h as Fe,i as Ie,l as Le,m as Re,n as ze,o as Be,p as Ve,r as He,s as Ue,t as We,v as Ge,w as Ke}from"./settings-store-BlPBHhbe.js";import{a as qe,c as Je,d as Ye,f as Xe,h as Ze,i as F,l as Qe,m as $e,n as et,o as tt,p as nt,r as rt,t as it,u as at}from"./fetch-utils-VTb8hdll.js";import{a as ot,i as st,n as ct,r as lt,t as ut}from"./alps-input-BEkzUnir.js";import{a as dt,i as ft,n as pt,o as mt,r as ht,s as gt,t as _t}from"./address-display-1EPr2xN-.js";import{a as vt,i as yt,n as bt,r as xt,t as St}from"./ui-confirm-D0o7tidP.js";import{n as Ct,r as wt}from"./vendor-COBU12uM.js";import"./alps-icon-btn-0xOCbNBD.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var Tt=`plugin-load-failed`,Et=new Map,Dt=new Map,Ot=new Set;function kt(){Ot.clear()}function At(e,t){let{component:n,load:r}=e;if(!r||customElements.get(n))return Et.delete(n),Ot.delete(n),!0;let i=e=>{Ot.has(n)||(Ot.add(n),E.error(`Failed to load <${n}>`,e),window.dispatchEvent(new CustomEvent(Tt,{detail:{component:n}})))};if(Et.has(n))return i(Et.get(n)),!1;let a=Dt.get(n);if(a)return t&&a.add(t),!0;let o=new Set;t&&o.add(t),Dt.set(n,o);let s=e=>{customElements.get(n)||Et.has(n)||(Et.set(n,e),i(e),o.forEach(e=>e()))},c;try{c=r.call(e)}catch(e){return s(e),Dt.delete(n),!1}return Promise.resolve(c).then(()=>{if(!customElements.get(n))throw Error(`The module did not define <${n}>`);Ot.delete(n)}).catch(s).finally(()=>Dt.delete(n)),!0}function jt(e,t){if(e===null||t===null)return e===t;if(e.size!==t.size)return!1;for(let n of e)if(!t.has(n))return!1;return!0}var I=new class{constructor(){this.navTabs=[],this.settingsTabs=[],this.routes=[],this.hooks=new Map,this.enabledPlugins=null,this.activePlugins=null,this.rememberedActive=null}setEnabledPlugins(e,t=e){let n=e===null?null:new Set(e),r=t===null?null:new Set(t);jt(this.enabledPlugins,n)&&jt(this.activePlugins,r)||(this.enabledPlugins=n,this.activePlugins=r,window.dispatchEvent(new CustomEvent(`plugins-updated`)))}isEnabled(e){return this.enabledPlugins===null||this.enabledPlugins.has(e)}isActive(e){return this.isEnabled(e)?this.activePlugins?this.activePlugins.has(e):e!==`caldav`&&e!==`carddav`||this.rememberedActive?.has(e)===!0:!1}get activeKnown(){return this.activePlugins!==null}setRememberedActive(e){let t=e===null?null:new Set(e);jt(this.rememberedActive,t)||(this.rememberedActive=t,this.activePlugins===null&&window.dispatchEvent(new CustomEvent(`plugins-updated`)))}setDAVConnectionConfigured(e,t){let n=new Set(this.activePlugins??this.enabledPlugins??[]);t?n.add(e):n.delete(e),this.setEnabledPlugins(this.enabledPlugins===null?null:[...this.enabledPlugins],[...n])}registerHook(e,t,n){this.hooks.has(e)||this.hooks.set(e,[]),this.hooks.get(e).push({handler:t,pluginId:n})}enabledHandlers(e){return(this.hooks.get(e)||[]).filter(e=>!e.pluginId||this.isActive(e.pluginId)).map(e=>e.handler)}async invokeHookAsync(e,t){let{results:n}=await this.invokeHookSettled(e,t);return n}async invokeHookSettled(e,t){let n=this.enabledHandlers(e),r=await Promise.allSettled(n.map(e=>new Promise(n=>n(e(t))))),i=[],a=0;for(let t of r)t.status===`fulfilled`?i.push(t.value):(a+=1,console.error(`Error in async hook ${e}:`,t.reason));return{results:i,failed:a}}invokeHook(e,t){let n=this.enabledHandlers(e),r=[];return n.forEach(n=>{try{r.push(n(t))}catch(t){console.error(`Error in hook ${e}:`,t)}}),r}registerNavTab(e){this.navTabs.find(t=>t.id===e.id)||this.navTabs.push(e)}getNavTabs(){return this.navTabs.filter(e=>this.isActive(e.pluginId||e.id)).slice().sort((e,t)=>(e.order||999)-(t.order||999))}registerSettingsTab(e){this.settingsTabs.find(t=>t.id===e.id)||this.settingsTabs.push(e)}getSettingsTabs(){return this.enabledPlugins===null?this.settingsTabs:this.settingsTabs.filter(e=>this.isEnabled(e.pluginId||e.id))}registerRoute(e){this.routes.find(t=>t.path===e.path)||this.routes.push(e)}getRoutes(){return this.routes.filter(e=>!e.pluginId||this.isActive(e.pluginId))}},Mt=class{constructor(e){this.changed=()=>this.host.requestUpdate(),this.host=e,e.addController(this),new f(e,{context:Be,subscribe:!0,callback:t=>{this.store=t,this.listen(),e.requestUpdate()}})}get hour12(){return se(this.store?.getState().hourFormat)===`12`}listen(){this.listening!==this.store&&this.host.isConnected&&(this.listening?.removeEventListener(`change`,this.changed),this.listening=this.store,this.listening?.addEventListener(`change`,this.changed))}hostConnected(){this.listen()}hostDisconnected(){this.listening?.removeEventListener(`change`,this.changed),this.listening=void 0}},Nt=class extends c{constructor(...e){super(...e),this.value=``,this.options=[],this.label=``,this.disabled=!1,this.stopLabelWatch=null}static{this.styles=[j,y`
		:host {
			display: block;
			position: relative;
		}

		.select-wrapper {
			position: relative;
			display: flex;
			align-items: center;
			width: 100%;
		}

		select {
			width: 100%;
			height: 36px;
			padding-block: 0;
			padding-inline: 12px 36px; /* Room at the inline end for the custom caret */
			background: var(--alps-input-bg, var(--bg-primary, #ffffff));
			border: 1px solid var(--border-color, #e5e7eb);
			border-radius: var(--input-radius, 6px);
			color: var(--text-primary, #111827);
			font-family: var(--font-base, 'Inter', sans-serif);
			font-size: var(--input-font-size, 14px);
			transition: all 0.2s ease;
			box-sizing: border-box;
			outline: none;
			appearance: none;
			-webkit-appearance: none;
			-moz-appearance: none;
			cursor: pointer;
		}

		/* The transparent outline paints nothing here; forced colors, which drop
		   the border colour and the shadow, give it a system colour. */
		select:focus {
			border-color: var(--accent-color, #005A9E);
			box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
			outline: 2px solid transparent;
		}

		select:disabled {
			background: var(--bg-tertiary, #f3f4f6);
			cursor: not-allowed;
			opacity: 0.7;
		}

		.caret {
			position: absolute;
			inset-inline-end: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 16px;
			height: 16px;
			color: var(--text-muted, #9ca3af);
			pointer-events: none;
		}

		.caret svg {
			width: 100%;
			height: 100%;
		}
	`]}focus(){this.shadowRoot?.querySelector(`select`)?.focus()}connectedCallback(){super.connectedCallback(),this.stopLabelWatch=ot(this)}disconnectedCallback(){super.disconnectedCallback(),this.stopLabelWatch?.(),this.stopLabelWatch=null}handleChange(e){let t=e.target;this.value=t.value,this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}render(){return b`
			<div class="select-wrapper">
				<select .value=${this.value} aria-label=${this.label||n} ?disabled=${this.disabled} @change=${this.handleChange}>
					${this.options.map(e=>b`<option value=${e.value} lang=${e.lang??n} ?selected=${e.value===this.value} ?disabled=${e.disabled}>${e.label}</option>`)}
				</select>
				<span class="caret">
					${P(`caret-down`)}
				</span>
			</div>
		`}};N([_({type:String})],Nt.prototype,`value`,void 0),N([_({type:Array})],Nt.prototype,`options`,void 0),N([_({type:String})],Nt.prototype,`label`,void 0),N([_({type:Boolean})],Nt.prototype,`disabled`,void 0),Nt=N([o(`alps-select`)],Nt);function Pt(e){if(!e||typeof e!=`object`)return!1;if(Array.isArray(e.Children))return e.Children.some(e=>Pt(e));let t=`${e.Type||``}/${e.Subtype||``}`.toLowerCase();if(t===`text/calendar`||t===`application/ics`)return!0;let n=e.Extended?.Disposition?.Params?.filename||e.Params?.name||``;return typeof n==`string`&&n.toLowerCase().endsWith(`.ics`)}var Ft=new class{async fetchInvitation(e,t){let n=new URLSearchParams({mailbox:e,uid:t}),r=await F(`/calendar/invitation?${n.toString()}`);if(r.status===404)return null;if(!r.ok)throw new et(r.status,`Failed to read the invitation`);return r.json()}async respond(e){return this.post(`/calendar/invitation/respond`,e,`Failed to answer the invitation`)}async apply(e){return this.post(`/calendar/invitation/apply`,e,`Failed to update the calendar`)}async post(e,t,n){let r=await F(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!r.ok)throw new et(r.status,n);return r.json()}},It={accepted:`accepted`,tentative:`tentative`,declined:`declined`,"needs-action":`needsAction`,delegated:`delegated`,completed:`completed`,"in-process":`inProcess`};function Lt(e){return It[e??``]??`needsAction`}var Rt={update:`update`,outdated:`outdated`,organizer:`organizer`,"not-invited":`notInvited`,cancel:`cancel`,cancelled:`cancelled`,reply:`reply`,replied:`replied`,unknown:`unknown`,add:`add`,added:`added`,unsupported:`unsupported`},zt=class extends c{constructor(...e){super(...e),this.clock=new Mt(this),this.mailbox=``,this.uid=``,this.view=null,this.busy=!1,this.notice=null,this.calendarPath=``,this.loadSeq=0,this.visit=0,this.autoApplied=new Set}static{this.styles=y`
        :host {
            display: block;
            margin: 12px 16px 0;
        }
        .card {
            display: flex;
            gap: 12px;
            padding: 12px 16px;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 8px;
            background: var(--bg-secondary, #f9fafb);
            color: var(--text-primary, #111827);
            font-size: 13px;
        }
        .icon svg {
            width: 22px;
            height: 22px;
            fill: currentColor;
            color: var(--accent-color, #2563eb);
        }
        .body {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .eyebrow {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted, #6b7280);
        }
        .title {
            font-size: 15px;
            font-weight: 600;
            word-break: break-word;
        }
        .title.struck {
            text-decoration: line-through;
        }
        .muted {
            color: var(--text-secondary, #4b5563);
        }
        .clash {
            color: var(--warning-text, #b45309);
        }
        .warning, .notice.error {
            color: var(--error, #b91c1c);
        }
        .actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            margin-top: 6px;
        }
        .actions:empty {
            display: none;
        }
        alps-select {
            min-width: 140px;
        }
    `}willUpdate(e){(e.has(`mailbox`)||e.has(`uid`))&&(this.visit++,this.view=null,this.notice=null,this.busy=!1,this.load())}isCurrent(e){return e===this.visit}t(e,t){return this.i18nStore?.t(e,t)??e}async load(){let e=++this.loadSeq,{mailbox:t,uid:n}=this;if(!t||!n)return;let r;try{r=await Ft.fetchInvitation(t,n)}catch(t){console.error(`Failed to read the invitation`,t),e===this.loadSeq&&(this.view=null);return}if(e!==this.loadSeq||(this.view=r,!r))return;r.calendars.some(e=>e.path===this.calendarPath)||(this.calendarPath=r.copy?.calendarPath||r.calendars[0]?.path||``);let i=JSON.stringify([t,n]);r.autoApply&&!this.autoApplied.has(i)&&(this.autoApplied.add(i),await this.apply())}async respond(e){let t=this.view;if(!t||this.busy)return;let n=this.visit;this.busy=!0,this.notice=null;try{let r=await Ft.respond({mailbox:this.mailbox,uid:this.uid,status:e,calendarPath:t.copy?void 0:this.calendarPath,lang:this.i18nStore?.getLanguage?.()});if(!this.isCurrent(n))return;this.notice=r.sendFailed?{key:`invitations.sendFailed`,tone:`error`}:{key:r.sent?`invitations.sent`:`invitations.saved`,tone:`info`}}catch(e){if(console.error(`Failed to answer the invitation`,e),!this.isCurrent(n))return;this.notice={key:Je(e)?`invitations.changedElsewhere`:`invitations.answerFailed`,tone:`error`}}finally{this.isCurrent(n)&&(this.busy=!1)}await this.load()}async apply(){let e=this.view;if(!e||this.busy)return;let t=this.visit;this.busy=!0,this.notice=null;try{let n=await Ft.apply({mailbox:this.mailbox,uid:this.uid,calendarPath:this.calendarPath});if(!this.isCurrent(t))return;let r=n.removed?`invitations.removed`:e.state===`add`?`invitations.added`:`invitations.updated`;this.notice={key:r,tone:`info`}}catch(e){if(console.error(`Failed to update the calendar`,e),!this.isCurrent(t))return;this.notice={key:Je(e)?`invitations.changedElsewhere`:`invitations.applyFailed`,tone:`error`}}finally{this.isCurrent(t)&&(this.busy=!1)}await this.load()}kindKey(e){switch(e.method){case`cancel`:return`cancelled`;case`reply`:return`reply`;case`request`:return e.kind===`task`?`task`:e.state===`update`?`updated`:`invitation`}return e.kind===`task`?`task`:`event`}when(e){let t=this.i18nStore?.getIntlLanguage?.()||void 0,n=new Intl.DateTimeFormat(t,{weekday:`short`,year:`numeric`,month:`short`,day:`numeric`}),r=e=>new Date(`${e.slice(0,10)}T00:00:00`);if(e.kind===`task`&&!e.start){if(!e.end)return``;let i=e.allDay?n.format(r(e.end)):new Intl.DateTimeFormat(t,{dateStyle:`medium`,timeStyle:`short`,hour12:this.clock.hour12}).format(new Date(e.end));return this.t(`invitations.dueOn`,{date:i})}if(!e.start)return``;if(e.allDay){let t=r(e.start);if(!e.end)return n.format(t);let i=r(e.end);return i.setDate(i.getDate()-1),i>t?`${n.format(t)} - ${n.format(i)}`:n.format(t)}let i=new Date(e.start),a=e.end?new Date(e.end):i,o=new Intl.DateTimeFormat(t,{weekday:`short`,year:`numeric`,month:`short`,day:`numeric`,hour:`numeric`,minute:`2-digit`,hour12:this.clock.hour12}),s=o.formatRange;return a>i&&s?s.call(o,i,a):o.format(i)}answerLine(e){return this.t(`invitations.yourAnswerIs`,{status:this.t(`invitations.statuses.${Lt(e)}`)})}renderStateLine(e){if(e.ended)return b`
                <div class="muted state ended">${this.t(`invitations.states.ended`)}</div>
                ${e.status&&e.status!==`needs-action`?b`<div class="muted answer">${this.answerLine(e.status)}</div>`:n}
            `;if(e.state===`answer`)return!e.status||e.status===`needs-action`?n:b`<div class="muted answer">${this.answerLine(e.status)}</div>`;let t=Rt[e.state];return t?b`<div class="muted state">${this.t(`invitations.states.${t}`)}</div>`:n}renderClashes(e){if(e.ended||e.kind!==`event`||e.method!==`request`||e.state!==`answer`&&e.state!==`update`||e.status===`declined`)return n;if(!e.clashes.length)return b`<div class="muted clashes">${this.t(`invitations.noConflicts`)}</div>`;let t=b`${e.clashes.map((e,t)=>b`${t?`, `:``}<bdi>${e.summary||this.t(`calendar.noTitle`)}</bdi>`)}`;return b`<div class="clash clashes">${Ae(this.i18nStore,`invitations.conflictsWith`,{names:t})}</div>`}renderSender(e){if(e.ended||e.senderVerified||!e.sender||![`answer`,`update`,`cancel`,`reply`].includes(e.state))return n;let t=e.method===`reply`?`invitations.unverifiedReply`:`invitations.unverified`;return b`<div class="warning sender">${Ae(this.i18nStore,t,{sender:Re(e.sender)})}</div>`}renderPicker(e){return e.copy||e.calendars.length<2?n:b`
            <alps-select
                .value=${this.calendarPath}
                .options=${e.calendars.map(e=>({value:e.path,label:e.name}))}
                title=${this.t(`invitations.calendar`)}
                label=${this.t(`invitations.calendar`)}
                ?disabled=${this.busy}
                @change=${e=>{this.calendarPath=e.target.value}}
            ></alps-select>
        `}renderActions(e){if(e.ended)return n;if(e.method===`request`&&[`answer`,`update`,`outdated`].includes(e.state)&&e.me){let t=(t,n)=>b`
                <alps-button
                    class="answer-${t}"
                    variant=${e.status===t?`primary`:`normal`}
                    aria-pressed=${e.status===t?`true`:`false`}
                    ?disabled=${this.busy}
                    @click=${()=>this.respond(t)}
                >${this.t(n)}</alps-button>
            `;return b`
                ${t(`accepted`,`invitations.accept`)}
                ${t(`tentative`,`invitations.maybe`)}
                ${t(`declined`,`invitations.decline`)}
                ${this.renderPicker(e)}
                ${e.state===`update`?this.applyButton(`invitations.updateCalendar`):n}
            `}switch(e.state){case`update`:return this.applyButton(`invitations.updateCalendar`);case`cancel`:return this.applyButton(`invitations.removeFromCalendar`);case`reply`:return this.applyButton(`invitations.recordAnswer`);case`add`:return b`${this.applyButton(`invitations.addToCalendar`)}${this.renderPicker(e)}`}return n}applyButton(e){return b`<alps-button class="apply" variant="normal" ?disabled=${this.busy} @click=${()=>this.apply()}>${this.t(e)}</alps-button>`}render(){let e=this.view;if(!e)return n;let t=e.method===`cancel`,r=this.t(`invitations.kinds.${this.kindKey(e)}`),i=this.when(e);return b`
            <div class="card" role="region" aria-label=${r}>
                <div class="icon">${P(e.kind===`task`?`checkCircle`:`calendar`)}</div>
                <div class="body">
                    <div class="eyebrow">${r}</div>
                    <div class="title ${t?`struck`:``}"><bdi>${e.summary||this.t(`calendar.noTitle`)}</bdi></div>
                    ${i?b`<div class="when">${i}${e.rrule?b`, ${this.t(`invitations.repeats`)}`:n}</div>`:n}
                    ${e.location?b`<div class="muted where">${e.location}</div>`:n}
                    ${e.method===`reply`&&e.replier?b`<div class="replier">${Ae(this.i18nStore,`invitations.answered.${Lt(e.replier.status)}`,{name:Ve(e.replier.name,e.replier.email)})}</div>`:e.organizer?b`<div class="muted organizer">${Ae(this.i18nStore,`invitations.organizerIs`,{name:Ve(e.organizer.name,e.organizer.email)})}</div>`:n}
                    ${this.renderClashes(e)}
                    ${this.renderStateLine(e)}
                    ${this.renderSender(e)}
                    ${this.notice?b`<div class="notice ${this.notice.tone}" role="status">${this.t(this.notice.key)}</div>`:n}
                    <div class="actions">${this.renderActions(e)}</div>
                </div>
            </div>
        `}};N([s({context:A})],zt.prototype,`i18nStore`,void 0),N([_()],zt.prototype,`mailbox`,void 0),N([_()],zt.prototype,`uid`,void 0),N([d()],zt.prototype,`view`,void 0),N([d()],zt.prototype,`busy`,void 0),N([d()],zt.prototype,`notice`,void 0),N([d()],zt.prototype,`calendarPath`,void 0),zt=N([o(`calendar-invitation-banner`)],zt);var Bt=e({});I.registerSettingsTab({id:`caldav`,pluginId:`caldav`,labelKey:`navigation.calendar`,icon:`calendar`,component:`alps-caldav-settings`,load:()=>Ce(()=>import(`./dav-connection-settings-DBW_eZ70.js`),__vite__mapDeps([0,1,2,3,4,5,6]))}),I.registerRoute({path:`/calendar/*`,component:`calendar-page`,pluginId:`caldav`,load:()=>Ce(()=>import(`./calendar-page-DmVWJKvh.js`),__vite__mapDeps([7,8,1,2,3,9,6,5,10,11,4,12,13,14]))}),I.registerNavTab({id:`calendar`,pluginId:`caldav`,labelKey:`navigation.calendar`,icon:`calendar`,order:20}),I.registerRoute({path:`/tasks/*`,component:`tasks-page`,pluginId:`caldav`,load:()=>Ce(()=>import(`./tasks-page-B4gM3UB4.js`),__vite__mapDeps([15,8,1,2,3,9,6,5,10,11,4,14]))}),I.registerNavTab({id:`tasks`,pluginId:`caldav`,labelKey:`navigation.tasks`,icon:`checkCircle`,order:30}),I.registerHook(`reader:content`,e=>{let t=e?.message;if(!t||!Pt(t.BodyStructure))return;let n=e.mailbox||t.Mailbox;n&&t.UID!==void 0&&(e.banners=e.banners||[],e.banners.push(b`<calendar-invitation-banner .mailbox=${n} .uid=${String(t.UID)}></calendar-invitation-banner>`))},`caldav`);var Vt=[`street`,`extended`,`po_box`,`locality`,`region`,`postal_code`,`country`];function Ht(e,t){return Vt.every(n=>(e?.[n]||``).trim()===(t?.[n]||``).trim())}function Ut(e){let t=0,n=0;for(let r of e)r.status===`rejected`&&(t+=1,Qe(r.reason)&&(n+=1),tt(r.reason)||console.error(`Bulk contact operation failed for one item`,r.reason));return{total:e.length,done:e.length-t,failed:t,uncertain:n}}function Wt(e){return e instanceof et&&e.status===409&&[`no_address_book`,`carddav_not_configured`].includes(e.message)}var Gt=new class{async fetchContacts(e=``){let t=e?`/contacts?query=${encodeURIComponent(e)}`:`/contacts`,n=await F(t,{},3e5);if(!n.ok){let e=await n.json().catch(()=>({}));throw new et(n.status,e.error||`contacts_unavailable`)}return n.json()}async fetchContact(e){let t=await F(`/contacts/${rt(e)}`);if(!t.ok)throw new et(t.status,`Failed to fetch contact: ${t.statusText}`);return t.json()}async createContact(e){let t=await F(`/contacts/create`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(!t.ok){let e=await t.json().catch(()=>({}));throw new et(t.status,e.error||`contacts_unavailable`)}return t.json()}async updateContact(e,t){let n=await F(`/contacts/${rt(e)}/edit`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!n.ok)throw new et(n.status,`Failed to update contact: ${n.statusText}`);return n.json()}async updateCategories(e,t){let n=await F(`/contacts/${rt(e)}/categories`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({categories:t})});if(!n.ok)throw new et(n.status,`Failed to update contact: ${n.statusText}`);return n.json()}async deleteContact(e){let t=await F(`/contacts/${rt(e)}`,{method:`DELETE`});if(!t.ok)throw new et(t.status,`Failed to delete contact: ${t.statusText}`)}async bulkUpdateCategories(e){let t=e.filter(e=>e.path),n=await Promise.allSettled(t.map(e=>this.updateCategories(e.path,e.categories??[]))),r={};n.forEach((e,n)=>{e.status===`fulfilled`&&e.value?.etag&&(r[t[n].path]=e.value.etag)});let i=t.filter((e,t)=>n[t].status===`rejected`&&tt(n[t].reason)).map(e=>e.path);return{...Ut(n),etags:r,...i.length>0&&{gonePaths:i}}}async bulkDeleteContacts(e){let t=await Promise.allSettled(e.map(e=>this.deleteContact(e))),n=e.filter((e,n)=>t[n].status===`fulfilled`);return{...Ut(t),deletedPaths:n}}};function Kt(e,t){let n=e=>String(e??``).trim();for(let r of[`name`,`email`,`phone`,`organization`,`title`,`birthday`,`note`,`url`,`nickname`,`public_key`])if(!(r===`email`&&Array.isArray(t.emails)||r===`phone`&&Array.isArray(t.phones))&&Object.hasOwn(t,r)&&n(e[r])!==n(t[r]))return!1;if(t.address_parts){if(!Ht(e.address_parts,t.address_parts))return!1}else if(Object.hasOwn(t,`address`)&&n(e.address)!==n(t.address))return!1;for(let r of[`emails`,`phones`]){if(!Array.isArray(t[r]))continue;let i=e=>e.filter(e=>n(e.value)).map(e=>[n(e.value),n(e.type).toLowerCase()]);if(JSON.stringify(i(e[r]||[]))!==JSON.stringify(i(t[r])))return!1}return!0}var qt=e({});I.registerSettingsTab({id:`carddav`,pluginId:`carddav`,labelKey:`navigation.contacts`,icon:`users`,component:`alps-carddav-settings`,load:()=>Ce(()=>import(`./dav-connection-settings-DBW_eZ70.js`),__vite__mapDeps([0,1,2,3,4,5,6]))}),I.registerRoute({path:`/contacts/*`,component:`contacts-page`,pluginId:`carddav`,load:()=>Ce(()=>import(`./contacts-page-DuEzCBoW.js`),__vite__mapDeps([16,1,2,3,4,5,14,11,9]))}),I.registerNavTab({id:`contacts`,pluginId:`carddav`,labelKey:`navigation.contacts`,icon:`users`,order:10}),I.registerHook(`composer:send`,async({recipients:e})=>{if(e&&Array.isArray(e))for(let t of e){let{name:e,email:n}=mt(t);try{await Gt.createContact({name:e,email:n})}catch(e){if(Wt(e))return;console.error(`Failed to auto-save contact`,e)}}},`carddav`),I.registerHook(`composer:suggest`,async({query:e})=>{try{let t=(await Gt.fetchContacts(e)).contacts||[],n=[],r=new Set;for(let e of t){let t=e.name||``,i=e.emails&&e.emails.length>0?e.emails:e.email?[{value:e.email}]:[];for(let e of i){let i=e.value?.trim();i&&!r.has(i.toLowerCase())&&(r.add(i.toLowerCase()),n.push({name:t,address:i}))}}return n}catch(e){return Wt(e)||console.error(`Failed to fetch contact suggestions`,e),[]}},`carddav`);var L=class extends c{constructor(...e){super(...e),this.heading=`Prompt`,this.fields=[],this.message=``,this.confirmText=``,this.cancelText=``,this.busy=!1,this.errors={},this.isDanger=!1,this.values={},this.fieldErrors={},this.seededFrom=null,this.submitted=!1}static{this.styles=[j,St,y`
      .prompt-message {
        margin: 0 0 16px;
        color: var(--text-secondary, #4b5563);
      }
      .field-group {
        margin-bottom: 16px;
      }
      .field-group:last-child {
        margin-bottom: 0;
      }
      .field-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--text-primary, #111827);
      }
      .field-input {
        margin-top: 8px;
      }
      .field-error {
        margin-top: 6px;
        font-size: 13px;
        color: var(--error, #ef4444);
      }
    `]}willUpdate(e){if(e.has(`fields`)){let e=this.fields.map(e=>`${e.id}\u0000${e.value??``}`).join(``);if(e!==this.seededFrom){this.seededFrom=e;let t={};for(let e of this.fields)t[e.id]=e.value||``;this.values=t}}e.has(`errors`)&&(this.fieldErrors={...this.fieldErrors,...this.errors||{}})}firstUpdated(){setTimeout(()=>{let e=this.shadowRoot?.querySelector(`alps-input[autofocus]`);if(e&&typeof e.focus==`function`)e.focus();else{let e=this.shadowRoot?.querySelector(`alps-input`);e&&typeof e.focus==`function`&&e.focus()}},50)}_handleInput(e,t){let n=e.target;this.values={...this.values,[t]:n.value},this.fieldErrors[t]&&(this.fieldErrors={...this.fieldErrors,[t]:``})}_focusField(e){Array.from(this.shadowRoot?.querySelectorAll(`alps-input`)??[]).find(t=>t.inputId===e)?.focus()}_handleKeyDown(e){e.key===`Enter`&&!lt(e)&&(e.preventDefault(),this._handleSubmit())}_handleCancel(){this.busy||this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}_handleSubmit(){if(this.busy||this.submitted)return;let e={};for(let t of this.fields){let n=t.validate?.(this.values[t.id]||``,this.values);n&&(e[t.id]=n)}Object.keys(e).length>0?this.fieldErrors={...this.fieldErrors,...e}:(this.submitted=!0,this.dispatchEvent(new CustomEvent(`submit`,{detail:this.values,bubbles:!0,composed:!0})))}updated(e){(e.has(`busy`)&&!this.busy||e.has(`errors`))&&(this.submitted=!1)}render(){return b`
      <ui-modal 
        .heading=${this.heading}
        .isDanger=${this.isDanger}
        .dismissible=${!this.busy}
        .bodyDescribes=${!!this.message}
        @cancel=${this._handleCancel}>

        ${this.message?b`<p class="prompt-message">${this.message}</p>`:``}
        <div class="prompt-form">
          ${this.fields.map(e=>b`
            <div class="field-group">
              <label class="field-label" @click=${()=>this._focusField(e.id)}>${e.label}</label>
              <alps-input 
                inputId=${e.id}
                label=${e.label}
                class="field-input"
                type=${e.type||`text`}
                placeholder=${e.placeholder||``}
                autocomplete=${e.autocomplete||``}
                .value=${this.values[e.id]||``}
                ?autofocus=${e.autofocus}
                @input=${t=>this._handleInput(t,e.id)}
                @keydown=${this._handleKeyDown}
              ></alps-input>
              ${this.fieldErrors[e.id]?b`<div class="field-error" role="alert">${this.fieldErrors[e.id]}</div>`:``}
            </div>
          `)}
        </div>
        
        <alps-button slot="actions" variant="text" ?disabled=${this.busy} @click=${this._handleCancel}>${this.cancelText||this.i18nStore?.t(`general.cancel`)||`Cancel`}</alps-button>
        <alps-button slot="actions" variant=${this.isDanger?`danger`:`normal`} ?disabled=${this.busy||this.submitted} @click=${this._handleSubmit}>${this.confirmText||this.i18nStore?.t(`general.save`)||`Save`}</alps-button>
      </ui-modal>
    `}};N([s({context:A})],L.prototype,`i18nStore`,void 0),N([_({type:String})],L.prototype,`heading`,void 0),N([_({type:Array})],L.prototype,`fields`,void 0),N([_({type:String})],L.prototype,`message`,void 0),N([_({type:String})],L.prototype,`confirmText`,void 0),N([_({type:String})],L.prototype,`cancelText`,void 0),N([_({type:Boolean})],L.prototype,`busy`,void 0),N([_({type:Object})],L.prototype,`errors`,void 0),N([_({type:Boolean})],L.prototype,`isDanger`,void 0),N([d()],L.prototype,`values`,void 0),N([d()],L.prototype,`fieldErrors`,void 0),N([d()],L.prototype,`submitted`,void 0),L=N([o(`ui-prompt`)],L);function Jt(e,t){return new Promise(n=>{let r=document.createElement(`ui-prompt`);r.heading=t?.t(`gpg.passphraseRequired`),r.confirmText=t?.t(`gpg.unlock`),r.cancelText=t?.t(`general.cancel`);let i=t?.t(`gpg.passphrasePrompt`);e&&(i+=` ${e}`),r.fields=[{id:`passphrase`,label:i,type:`password`,placeholder:t?.t(`gpg.passphrase`),autofocus:!0}];let a=()=>{r.parentNode&&r.parentNode.removeChild(r)};r.addEventListener(`submit`,e=>{n(e.detail.passphrase),a()}),r.addEventListener(`cancel`,()=>{n(null),a()}),document.body.appendChild(r)})}var Yt=null,Xt=0;function Zt(){Xt++,Yt=null;try{sessionStorage.removeItem(`gpg_private_key`)}catch{}}window.addEventListener(`session-cleared`,()=>{Zt()});function Qt(e,t){return t===Xt&&(Yt=e),e}var $t=class extends Error{constructor(e){super(e),this.translationKey=e}};async function en(e,t){if(Yt)return Yt;let n=Xt,r,i;try{let t=await F(`/gpg/keys`);if(!t.ok)throw Error(`Keyring read failed: ${t.status}`);if(r=await t.json(),n!==Xt)throw Error(`The keyring changed.`);if(!r.encrypted_private_key)throw new $t(`gpg.noPrivateKey`);i=await e.readPrivateKey({armoredKey:r.encrypted_private_key})}catch(e){throw e instanceof $t?e:(console.error(`GPG keyring read failed:`,e),new $t(`gpg.keyringUnreadable`))}if(i.isDecrypted())return Qt(i,n);{let r,a=await Jt(r,t);for(;a!==null;)try{return Qt(await e.decryptKey({privateKey:i,passphrase:a}),n)}catch(e){console.error(`GPG key unlock failed:`,e),r=t?.t(`gpg.importIncorrectPassphrase`),a=await Jt(r,t)}throw new $t(`gpg.passphraseCancelled`)}}function tn(e,t){let n=e=>(mt(e).email||e).trim().toLowerCase(),r=n(t);return[e.email,...(e.emails??[]).map(e=>e.value)].some(e=>!!e&&n(e)===r)}async function nn(e){let{instance:t,formData:n,composer:r}=e;if(!t.encryptGpg)return n;if(n.get(`attachment-uuids`)||n.get(`prev_attachments`)){let e=r?.i18nStore?.t(`gpg.attachmentsNotEncryptable`);return alert(e||`Attachments cannot be encrypted with inline PGP and would be sent unencrypted. Remove the attachments, or turn off encryption to send them.`),!1}try{let e=await Ce(()=>import(`./openpgp-7ptK92FR.js`).then(e=>e.t),__vite__mapDeps([17,3])),i=t.to||[],a=t.cc||[],o=t.bcc||[],s=[...i,...a,...o];if(s.length===0)return n;let c=[],l=[],u=Ie(je()).trim().toLowerCase();for(let t of s){let n=mt(t).email||t.trim();if(u&&u===n.toLowerCase())continue;let r=(await Gt.fetchContacts(n)).contacts||[],i=!1;for(let t of r)if(t.public_key&&tn(t,n)){let n=await e.readKey({armoredKey:t.public_key});c.push(n),i=!0;break}i||l.push(t)}if(l.length>0){let e=r.i18nStore?.t(`gpg.missingPublicKeys`),t=l.join(`
`);return alert(e?e.replace(`{keys}`,t):`Cannot encrypt: Missing public keys for:\n${t}`),!1}let d=await en(e,r.i18nStore),f=d.toPublic();c.push(f);let p=n.get(`text`)||``,m=n.get(`html`)||``,h=``;h=t.format===`html`&&m?m:p;let g=await e.createMessage({text:h}),_=await e.encrypt({message:g,encryptionKeys:c,signingKeys:d,format:`armored`});return n.set(`text`,_),n.set(`html`,``),n}catch(e){return e instanceof $t&&e.translationKey===`gpg.passphraseCancelled`||(console.error(`GPG encryption failed:`,e),alert(r?.i18nStore?.t(e instanceof $t?e.translationKey:`gpg.encryptionFailed`))),!1}}async function rn(e){if(typeof e.content==`string`&&e.content.includes(`-----BEGIN PGP MESSAGE-----`))try{let t=await Ce(()=>import(`./openpgp-7ptK92FR.js`).then(e=>e.t),__vite__mapDeps([17,3])),n=e.content.indexOf(`-----BEGIN PGP MESSAGE-----`),r=e.content.indexOf(`-----END PGP MESSAGE-----`,n);if(r===-1)return e.content;let i=r+25;if(n===-1||i<=n)return e.content;let a=e.content.substring(n,i),o;try{o=await t.readMessage({armoredMessage:a})}catch(e){throw console.error(`Unreadable GPG message:`,e),new $t(`gpg.messageUnreadable`)}let s=await en(t,e.i18nStore),c=o.getEncryptionKeyIDs?.().map(e=>e.toHex())??[],l=s.getKeyIDs?.().map(e=>e.toHex())??[];if(c.length&&l.length&&!c.some(e=>/^0+$/.test(e)||l.includes(e)))throw new $t(`gpg.noMatchingKey`);let{data:u}=await t.decrypt({message:o,decryptionKeys:s,format:`utf8`}),d=String(u);d.includes(`<html`)||d.includes(`<body`)||d.includes(`<p>`)||d.includes(`<div`)||d.includes(`<br`)||(d=d.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/\n/g,`<br/>`));let f=e.content.substring(0,n)+d+e.content.substring(i);return e.banners=e.banners||[],e.banners.push(b`
              <alps-banner variant="info">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex; width: 16px; height: 16px;">${P(`lock`)}</span>
                  <span>${e.i18nStore?.t(`gpg.decryptedSuccess`)}</span>
                </span>
              </alps-banner>
            `),e.isHtml=!0,f}catch(t){return console.error(`Decryption failed:`,t),e.banners=e.banners||[],e.banners.push(b`
              <alps-banner variant="error">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex; width: 16px; height: 16px;">${P(`lock`)}</span>
                  <span>${e.i18nStore?.t(t instanceof $t?t.translationKey:`gpg.decryptionFailed`)}</span>
                </span>
              </alps-banner>
            `),e.content}return e.content}var an=e({});I.registerSettingsTab({id:`gpg`,labelKey:`settings.gpg`,icon:`key`,component:`alps-gpg-settings`,load:()=>Ce(()=>import(`./gpg-settings-CBSus0su.js`),__vite__mapDeps([18,1,9,2,3,5,6,4]))}),I.registerHook(`composer:toolbar`,e=>{let t=e.instance,n=e.composer,r=t.encryptGpg||!1;return b`
        <alps-icon-btn 
            title="${n.i18nStore?.t(`gpg.toggleEncryption`)}" 
            icon="lock"
            ?active=${r}
            @click=${()=>{n.composeStore.updateComposer(t.id,{encryptGpg:!r})}}>
        </alps-icon-btn>
    `},`gpg`),I.registerHook(`composer:presend`,nn,`gpg`),I.registerHook(`reader:content`,rn,`gpg`);var on=e({});I.registerSettingsTab({id:`managesieve`,labelKey:`settings.categories.filters`,icon:`sieve`,component:`alps-managesieve-page`,load:()=>Ce(()=>import(`./managesieve-page-J97sFkKT.js`),__vite__mapDeps([19,1,2,3,20,9,5,14,6]))}),I.registerSettingsTab({id:`autoreply`,pluginId:`managesieve`,labelKey:`settings.categories.autoReply`,icon:`arrowBendUpLeft`,component:`alps-auto-reply-page`,load:()=>Ce(()=>import(`./auto-reply-page-37O5Bz-f.js`),__vite__mapDeps([21,1,2,3,4,5,20,9]))});var sn=e({});I.registerSettingsTab({id:`password`,labelKey:`settings.categories.password`,icon:`password`,component:`alps-password-settings`,load:()=>Ce(()=>import(`./password-settings-gGkKjcpY.js`),__vite__mapDeps([22,9,2,3,1]))});function cn(e=document,t=navigator){if(!(/iPad|iPhone|iPod/.test(t.userAgent)||t.platform===`MacIntel`&&t.maxTouchPoints>1))return;let n=e.querySelector(`meta[name="viewport"]`);n&&!/maximum-scale/.test(n.content)&&(n.content+=`, maximum-scale=1`)}var ln=class{constructor(e,t){this.container=document.createElement(`div`),this.relocate=()=>{if(!this.host.isConnected)return;let e=vt()??this.host.renderRoot;this.container.parentNode!==e&&e.appendChild(this.container)},this.host=e,this.content=t,this.container.style.display=`contents`,e.addController(this)}hostConnected(){window.addEventListener(bt,this.relocate)}hostUpdated(){v(this.content(),this.container,{host:this.host}),this.relocate()}hostDisconnected(){window.removeEventListener(bt,this.relocate),v(n,this.container),this.container.remove()}},un=class{get currentPath(){return this.getHashPath()}constructor(e,t,n){this.routes=e,this.fallback=t,this.onHashChange=e=>n(e)}hostConnected(){window.addEventListener(`hashchange`,this.onHashChange),this.onHashChange()}hostDisconnected(){window.removeEventListener(`hashchange`,this.onHashChange)}getHashPath(){let e=window.location.hash;return!e||e===`#`?`/`:e.substring(1).split(`?`)[0]}navigate(e){window.location.hash=e}setRoutes(e){this.routes=e}render(e=this.currentPath){let t=this.matchKey(e);return t===null?this.fallback():this.routes[t]()}matchKey(e){if(this.routes[e])return e;for(let t in this.routes){if(!t.endsWith(`/*`))continue;let n=t.slice(0,-2);if(e===n||e.startsWith(`${n}/`))return t}return null}};function R(e,t){return`${e??``}\0${String(t)}`}function dn(e){let t=e.indexOf(`\0`);return t===-1?{mailbox:``,uid:e}:{mailbox:e.slice(0,t),uid:e.slice(t+1)}}function fn(e){let t=new Map;for(let n of e){let{mailbox:e,uid:r}=dn(n),i=t.get(e);i?i.push(r):t.set(e,[r])}return t}function pn(e,t){return typeof e?.Mailbox==`string`&&e.Mailbox?e.Mailbox:t}var mn=`alps-mail-poll`,hn=`alps-mail-poll-counts`,gn=6e4,_n=6e5,vn=3,yn=30,bn=.1,xn=18e5;function Sn(e,t,n){let r=Math.min(e*2**t,Math.max(e,xn));return Math.round(r*(1+bn*(2*n-1)))}var Cn=class extends EventTarget{constructor(){super(),this.interval=null,this.pollFailures=0,this.timerGeneration=0,this.currentMailbox=w,this.currentPage=0,this.currentQuery=``,this.listed=!1,this.heard=null,this.shownCheck=null,this.pollMinutes=0,this.foldersPushed=!1,this.roundsPassed=0,this.peerPollSpacing=1,this.leading=!1,this.releaseLead=null,this.leadRequest=null,this.lockFailed=!1,this.pollGeneration=0,this.pollBusy=!1,this.channel=null,this.peerId=wn(),this.sessionEpoch=wn(),this.username=null,this.peers=new Map,this.listings=new Map,this.latestMailboxes=null,this.latestMailboxesVersion=null,this.listingSettingsKey=``,this.listingOut=null,this.changes=[],this.changeSeq=0,this.listingsOut=0,this.watching=!1,this.handleShown=()=>{this.tellView(),!this.shownCheck&&!document.hidden&&this.listed&&this.heard&&(Date.now()-this.heard.at<gn?this.checkPendingNews():(this.newsPending=!1,this.shownCheck=this.backgroundSync({announce:this.announces}).finally(()=>{this.shownCheck=null})))},this.handlePollMessage=e=>{let t=e.data;if(!(!t||this.pollMinutes<=0)){if(t.type===`leader`||t.type===`hello`)this.tellView();else if(t.type===`leave`)this.peers.delete(t.peer);else if(t.type===`watch`&&(this.leading||!navigator.locks||this.lockFailed)){if(typeof t.peer!=`string`||typeof t.epoch!=`string`||typeof t.mailbox!=`string`||t.username!==this.username)return;this.peers.set(t.peer,{...t,seen:Date.now()})}else t.type!==`counts`||this.leading||document.hidden||!this.listed||t.peer!==this.peerId||t.epoch!==this.sessionEpoch||t.username!==this.username||t.mailbox!==this.currentMailbox||(this.tellView(),this.backgroundSync({announce:!1,scheduled:!0,shared:{mailbox:Dn(t.counts),inbox:Dn(t.inbox)}}))}},this.writing=0,this.syncAsked=!1,this.refreshAsked=!1,this.newsCheck=null,this.newsAgain=!1,this.newsPending=!1,this.newsOf=new Set,this.currentFetchId=0,this.currentLabelsId=0,window.addEventListener(`session-cleared`,()=>{this.resetPollSession(),this.currentFetchId++,this.currentLabelsId++,this.listed=!1,this.newsPending=!1,this.newsOf.clear(),this.heard=null,this.forgetListings(),this.latestMailboxes=null,this.latestMailboxesVersion=null}),window.addEventListener(`user-logged-in`,()=>{this.resetPollSession(),this.currentFetchId++,this.currentLabelsId++,this.listed=!1,this.newsPending=!1,this.newsOf.clear(),this.heard=null,this.forgetListings(),this.latestMailboxes=null,this.latestMailboxesVersion=null}),window.addEventListener(`external-message-flags-changed`,e=>{let{keys:t,flag:n,action:r}=e.detail??{};if(!Array.isArray(t)||typeof n!=`string`)return;let i=new Set(t);for(let e of this.listings.values())An(e,i,n,r);this.noteChange(e=>An(e,i,n,r))}),window.addEventListener(`draft-autosaved`,e=>{let{mailbox:t,oldMailbox:n}=e.detail??{};this.forgetListings(e=>e===t||e===n||e===`*`),this.noteChange()})}rowsTakenOut(e){e.length>0&&this.forgetListings();let t=new Set(e);return this.noteChange(e=>jn(e,t)),()=>t.clear()}noteChange(e){this.listingsOut!==0&&this.changes.push({seq:++this.changeSeq,replay:e})}listingSent(){return this.listingsOut++,this.changeSeq}listingDone(){this.listingsOut--,this.listingsOut===0&&(this.changes=[])}replayChanges(e,t){let n=!1;for(let r of this.changes)r.seq<=t||(n=!0,r.replay?.(e));return n}setListingSettings(e){e!==this.listingSettingsKey&&(this.listingSettingsKey=e,this.forgetListings(),this.noteChange())}listingKey(e,t,n){return[e,t,n].join(`\0`)}keptListing(e,t,n){let r=this.listingKey(e,t,n),i=this.listings.get(r);if(!i)return;this.listings.delete(r),this.listings.set(r,i);let a=JSON.parse(JSON.stringify(i));return this.latestMailboxes&&(a.Mailboxes=this.latestMailboxes),a}keepListing(e,t,n,r){r.Mailboxes&&this.holdMailboxes(r);let i=JSON.parse(JSON.stringify(r));delete i.Mailboxes;let a=this.listingKey(e,t,n);for(this.listings.delete(a),this.listings.set(a,i);this.listings.size>yn;)this.listings.delete(this.listings.keys().next().value)}holdMailboxes(e){this.latestMailboxes=e.Mailboxes??null,this.latestMailboxesVersion=e.MailboxesVersion??null}listingURL(e,t,n,r){let i=`/mailboxes/${k(e)}?page=${t}`;return n&&(i+=`&query=${encodeURIComponent(n)}`),r?i+=`&refresh=true`:this.latestMailboxesVersion&&(i+=`&mailboxes=${encodeURIComponent(this.latestMailboxesVersion)}`),i}fillMailboxes(e){!e.Mailboxes&&this.latestMailboxes&&e.MailboxesVersion&&e.MailboxesVersion===this.latestMailboxesVersion&&(e.Mailboxes=this.latestMailboxes)}forgetListings(e){if(!e)this.listings.clear();else for(let[t,n]of[...this.listings])e(n.ListedMailbox??``)&&this.listings.delete(t)}setContext(e,t,n=``){this.currentMailbox=e,this.currentPage=t,this.currentQuery=n,this.tellView()}start(e=5){if(this.stop(),this.pollMinutes=e,this.lockFailed=!1,e<=0)return;this.watchShown(!0);try{typeof window.BroadcastChannel==`function`&&(this.channel=new window.BroadcastChannel(hn),this.channel.onmessage=this.handlePollMessage)}catch(e){E.error(`Failed to share poll counts`,e)}this.tellView(),this.postPoll({type:`hello`});let t=typeof navigator<`u`?navigator.locks:void 0;if(!t){this.startTimer();return}this.channel||this.startTimer();let n=this.pollGeneration,r=this.leadRequest=new AbortController;t.request(mn,{signal:r.signal},()=>new Promise(e=>{this.pollMinutes<=0||n!==this.pollGeneration?e():(this.leading=!0,this.releaseLead=()=>{this.leading=!1,this.releaseLead=null,e()},this.postPoll({type:`leader`}),this.startTimer())})).catch(e=>{r.signal.aborted||n!==this.pollGeneration||(E.error(`Failed to take the poll lock`,e),this.lockFailed=!0,this.postPoll({type:`hello`}),this.tellView(),this.pollMinutes>0&&!this.leading&&this.startTimer())})}stop(){this.pollMinutes=0,this.pollGeneration++,this.leadRequest?.abort(),this.leadRequest=null,this.postPoll({type:`leave`,peer:this.peerId}),this.channel?.close(),this.channel=null,this.peers.clear(),this.stopTimer(),this.giveUpLead(),this.watchShown(!1)}startTimer(){this.stopTimer(),this.roundsPassed=0,this.pollFailures=0,this.scheduleNextPoll()}scheduleNextPoll(){let e=this.timerGeneration;this.interval=setTimeout(async()=>{if(e!==this.timerGeneration||(this.scheduleNextPoll(),this.foldersPushed&&++this.roundsPassed<vn))return;this.roundsPassed=0;let t=await this.poll();if(e!==this.timerGeneration||t===null)return;t&&(this.peerPollSpacing=this.foldersPushed?vn:1);let n=this.pollFailures;this.pollFailures=t?0:n+1,t&&n===0||(this.interval&&clearTimeout(this.interval),this.scheduleNextPoll())},Sn(this.pollMinutes*60*1e3,this.pollFailures,Math.random()))}get pollEveryMinutes(){return this.pollMinutes*(this.foldersPushed?vn:1)}stopTimer(){this.timerGeneration++,this.interval&&=(clearTimeout(this.interval),null)}giveUpLead(){this.releaseLead?.()}get announces(){return this.pollMinutes<=0||this.leading?!0:navigator.locks&&!this.lockFailed?!1:[...this.peers.values()].every(e=>e.username!==this.username||Date.now()-e.seen>Math.max(this.pollEveryMinutes*3*6e4,18e4)||e.peer>this.peerId)}watchShown(e){e!==this.watching&&typeof document<`u`&&(this.watching=e,e?(document.addEventListener(`visibilitychange`,this.handleShown),window.addEventListener(`focus`,this.handleShown)):(document.removeEventListener(`visibilitychange`,this.handleShown),window.removeEventListener(`focus`,this.handleShown)))}postPoll(e){try{this.channel?.postMessage(e)}catch(e){E.error(`Failed to share poll counts`,e),this.channel?.close(),this.channel=null,this.pollMinutes>0&&this.startTimer()}}tellView(){!this.username||this.pollMinutes<=0||this.postPoll({type:`watch`,peer:this.peerId,epoch:this.sessionEpoch,username:this.username,mailbox:this.currentMailbox,visible:!document.hidden})}resetPollSession(){let e=this.pollMinutes;this.stop(),this.sessionEpoch=wn(),this.username=null,e>0&&this.start(e)}async poll(){if(this.pollBusy||this.pollMinutes<=0)return null;this.pollBusy=!0;try{if(!this.leading||!this.channel||!this.username)return!this.leading&&navigator.locks&&!this.lockFailed&&document.hidden?null:(this.tellView(),await this.backgroundSync({announce:this.announces,scheduled:!0}));let e=this.pollGeneration,t=this.username,n=this.pollFailures>0?Sn(this.pollMinutes*6e4,this.pollFailures,1):this.pollMinutes*6e4,r=[...this.peers.values()].filter(e=>e.visible&&e.username===t&&Date.now()-e.seen<=Math.max(n*this.peerPollSpacing*3,18e4)),i=this.currentMailbox,a=this.currentFetchId,o=[...new Set([i,w,...r.map(e=>e.mailbox)])].filter(e=>e!==`*`),s=await this.askStatuses(o).catch(()=>new Map);if(!this.leading||e!==this.pollGeneration)return null;for(let e of r)this.postPoll({type:`counts`,peer:e.peer,epoch:e.epoch,username:t,mailbox:e.mailbox,counts:s.get(e.mailbox),inbox:s.get(w)});return i!==this.currentMailbox||a!==this.currentFetchId?null:await this.backgroundSync({announce:!0,scheduled:!0,shared:{mailbox:s.get(i)??null,inbox:s.get(`INBOX`)??null}})}finally{this.pollBusy=!1}}mailboxRenamed(e,t){if(this.forgetListings(),this.currentMailbox===e)this.currentMailbox=t;else if(this.currentMailbox.startsWith(e)){let n=this.currentMailbox.slice(e.length);/^[^A-Za-z0-9]/.test(n)&&(this.currentMailbox=t+n)}}mailboxDeleted(e){this.forgetListings(),(this.currentMailbox===e||re(this.currentMailbox,e))&&(this.currentMailbox=w,this.currentPage=0,this.listed=!1)}sync({refresh:e=!1}={}){this.writing>0?(this.syncAsked=!0,this.refreshAsked||=e):(this.forgetListings(),this.fetch(this.currentMailbox,this.currentPage,this.currentQuery,e,!0,{probe:!e}))}async afterWrites(e){this.writing++;try{return await e()}finally{if(this.writing--,this.writing===0&&this.syncAsked){let e=this.refreshAsked;this.syncAsked=!1,this.refreshAsked=!1,this.sync({refresh:e})}}}syncIfViewing(e){this.currentMailbox===e&&this.sync()}async syncLabels(){let e=++this.currentLabelsId;try{let t=await F(`/mailboxes`);if(this.currentLabelsId!==e)return;if(t.status===401){window.dispatchEvent(new CustomEvent(`auth-error`));return}if(!t.ok)throw Error(`HTTP ${t.status}`);let n=await t.json();if(this.currentLabelsId!==e||!n.Mailboxes)return;this.holdMailboxes(n),this.dispatchEvent(new CustomEvent(`labels-success`,{detail:{mailboxes:n.Mailboxes}}))}catch(e){E.error(`Failed to refresh folder list`,e)}}inboxChanged(){this.forgetListings(e=>e===`INBOX`||e===`*`),this.newsOf.add(w),this.takeNews()}folderChanged(e){e.toUpperCase()===`INBOX`?this.inboxChanged():(this.forgetListings(t=>t===e||t===`*`),this.newsOf.add(e),this.takeNews())}foldersWatched(e){this.foldersPushed=e,e&&(this.peerPollSpacing=vn),e&&this.currentMailbox!==`INBOX`&&this.currentMailbox!==`*`&&this.folderChanged(this.currentMailbox)}takeNews(){if(!this.listed||typeof document<`u`&&document.hidden&&!this.announces){this.newsPending=!0;return}if(this.newsPending=!1,this.newsCheck){this.newsAgain=!0;return}let e=this.newsOf;this.newsOf=new Set,this.newsCheck=this.checkNews(e).finally(()=>{this.newsCheck=null,this.newsAgain&&(this.newsAgain=!1,this.takeNews())})}checkPendingNews(){this.newsPending&&this.takeNews()}async checkNews(e){if(e.size===0)return;let t=this.currentQuery?null:this.currentMailbox;t!==null&&e.has(t)&&(await this.backgroundSync({announce:this.announces})||this.dispatchEvent(new CustomEvent(`sync-error`,{detail:{error:null,background:!0}})),e.delete(t),e.delete(w));for(let t of e)await this.checkCounts(t)}async checkCounts(e){let t=e===w,n=this.heard,r=await this.askCounts(e).catch(()=>null);if(!r||this.heard!==n)return;let i=n=>{let r=String(n?.Name??n?.Mailbox);return t?r.toUpperCase()===w:r===e};if(t){if(n&&kn(r,n.inbox))return;n&&(n.inbox=r)}else{let e=this.latestMailboxes?.find(i);if(!e||e.Total===r.total&&e.Unseen===r.unseen)return}this.latestMailboxes&&(this.latestMailboxes=this.latestMailboxes.map(e=>i(e)?{...e,Total:r.total,Unseen:r.unseen}:e),this.latestMailboxesVersion=null),t?this.dispatchEvent(new CustomEvent(`inbox-counts`,{detail:{counts:r,announce:this.announces}})):this.dispatchEvent(new CustomEvent(`folder-counts`,{detail:{mailbox:e,counts:r,announce:this.announces}}))}async fetch(e,t,n=``,r=!1,i=!1,{probe:a=!1}={}){this.setContext(e,t,n),this.listed=!1;let o=++this.currentFetchId,s=r?void 0:this.keptListing(e,t,n);s&&(i=!0),this.dispatchEvent(new CustomEvent(`sync-start`,{detail:{background:!1,quiet:i}})),s&&(s.ListedMailbox=e,this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:s,background:!1,quiet:i,kept:!0}})));let c=Date.now(),l=async()=>{if(i)return;let e=Date.now()-c;e<200&&await new Promise(t=>setTimeout(t,200-e))},u=null;try{for(;this.listingOut;)if(await this.listingOut,this.currentFetchId!==o)return;if(a){let t=En([e,w].filter(e=>e!==`*`));if(t&&await F(t).catch(()=>{}),this.currentFetchId!==o)return}let s=this.listingURL(e,t,n,r),c=F(s),d=c.then(()=>{},()=>{});this.listingOut=d,u=this.listingSent();let f;try{f=await c}finally{this.listingOut===d&&(this.listingOut=null)}if(this.currentFetchId!==o)return;if(f.status===401){window.dispatchEvent(new CustomEvent(`auth-error`));return}if(f.status===404){this.forgetListings(t=>t===e),this.dispatchEvent(new CustomEvent(`mailbox-not-found`));return}if(!f.ok)throw new et(f.status,`HTTP ${f.status}`);let p=await f.json();if(this.currentFetchId!==o||(this.fillMailboxes(p),await l(),this.currentFetchId!==o))return;this.listed=!0,p.ListedMailbox=e,this.hear(e,t,n,p);let m=this.replayChanges(p,u);f.ok&&!m&&this.keepListing(e,t,n,p),this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:p,background:!1,quiet:i}})),this.checkPendingNews()}catch(e){if(this.currentFetchId!==o||(E.error(`Failed to fetch mailbox data`,e),await l(),this.currentFetchId!==o))return;this.dispatchEvent(new CustomEvent(`sync-error`,{detail:{error:e,background:!1,quiet:i}}))}finally{u!==null&&this.listingDone()}}viewKey(e,t,n){return[e,t,n].join(`\0`)}hear(e,t,n,r){let i=Date.now();typeof r.Username==`string`&&r.Username!==this.username&&(this.username=r.Username,this.leading&&this.postPoll({type:`leader`}),this.tellView(),this.postPoll({type:`hello`})),this.heard={view:this.viewKey(e,t,n),inbox:Tn(r.Inbox),mailbox:Tn(r.Mailbox),read:i,at:i}}relistDue(e,t,n){let r=n?Math.max(this.pollMinutes,0)*60*1e3/2:0;return t-e>=_n-r}async askStatuses(e){let t=[...new Set(e)],n=new Map(t.map(e=>[e,null])),r=En(t);if(!r)return n;let[i,...a]=t,o=await F(r);if(!o.ok)return n;let s=await o.json().catch(()=>null);n.set(i,Dn(s));for(let e of a)n.set(e,Dn(s?.with?.[e]));return n}async askCounts(e){let t=await F(`/mailboxes/${k(e)}/status`);if(!t.ok)return null;let n=await t.json().catch(()=>null);return typeof n?.total!=`number`||typeof n?.unseen!=`number`?null:Dn(n)}async check(e,t,n=``){if(!(this.listed&&t===0&&this.currentPage===0&&e===this.currentMailbox&&n===this.currentQuery))return this.fetch(e,t,n,!0);this.dispatchEvent(new CustomEvent(`sync-start`,{detail:{background:!0}})),await this.backgroundSync({announce:this.announces})||this.dispatchEvent(new CustomEvent(`sync-error`,{detail:{error:null,background:!0}}))}async backgroundSync({announce:e=!0,scheduled:t=!1,shared:n}={}){let r=++this.currentFetchId,i=this.pollGeneration,a=()=>this.currentFetchId!==r||t&&i!==this.pollGeneration,o=this.currentMailbox,s=this.currentPage,c=this.currentQuery,l=Date.now(),u=null;try{let r=n?.inbox??null,i=n?.mailbox??null;if(!n){let e=await this.askStatuses([o,w].filter(e=>e!==`*`)).catch(()=>new Map);o!==`INBOX`&&(r=e.get(`INBOX`)??null),i=o===`*`?null:e.get(o)??null}if(a())return!0;let d=this.heard,f=d!==null&&this.listed&&d.view===this.viewKey(o,s,c)&&kn(i,d.mailbox)&&(o===`INBOX`||kn(r,d.inbox));if(d&&f&&!this.relistDue(d.read,l,t))return d.at=Date.now(),this.dispatchEvent(new CustomEvent(`sync-unchanged`,{detail:{background:!0}})),!0;let p=this.listingURL(o,s,c,f);for(;this.listingOut;)if(await this.listingOut,a())return!0;u=this.listingSent();let m=F(p),h=m.then(()=>{},()=>{});this.listingOut=h;let g;try{g=await m}finally{this.listingOut===h&&(this.listingOut=null)}if(a())return!0;if(g.status===401)return window.dispatchEvent(new CustomEvent(`auth-error`)),!0;if(g.status===404)return this.forgetListings(e=>e===o),this.dispatchEvent(new CustomEvent(`mailbox-not-found`)),!0;if(!g.ok)throw Error(`HTTP ${g.status}`);let _=await g.json();if(a())return!0;this.fillMailboxes(_),this.listed=!0,_.ListedMailbox=o,this.hear(o,s,c,_);let v=this.replayChanges(_,u);return g.ok&&!v&&this.keepListing(o,s,c,_),this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:_,background:!0,announce:e&&this.announces}})),this.checkPendingNews(),!0}catch(e){return a()?!0:(E.error(`Background sync failed`,e),!1)}finally{u!==null&&this.listingDone()}}};function wn(){return globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}-${Math.random()}`}function Tn(e){return typeof e?.NumMessages!=`number`||typeof e?.NumUnseen!=`number`?null:{total:e.NumMessages,unseen:e.NumUnseen,uidnext:e.UIDNext,uidvalidity:e.UIDValidity,highestmodseq:On(e.HighestModSeq)}}function En(e){let[t,...n]=[...new Set(e)];if(t===void 0)return null;let r=`/mailboxes/${k(t)}/status`;return n.length>0?r+`?`+n.map(e=>`with=${encodeURIComponent(e)}`).join(`&`):r}function Dn(e){return typeof e?.total!=`number`||typeof e?.unseen!=`number`?null:{total:e.total,unseen:e.unseen,uidnext:typeof e.uidnext==`number`?e.uidnext:void 0,uidvalidity:typeof e.uidvalidity==`number`?e.uidvalidity:void 0,highestmodseq:On(e.highestmodseq)}}function On(e){if(e!==void 0&&e!==0&&e!==`0`)return typeof e==`number`?Number.isSafeInteger(e)&&e>0?String(e):null:typeof e==`string`&&/^[1-9]\d{0,18}$/.test(e)&&(e.length<19||e<=`9223372036854775807`)?e:null}function kn(e,t){return!!e&&!!t&&e.highestmodseq!==null&&t.highestmodseq!==null&&e.total===t.total&&e.unseen===t.unseen&&e.uidnext===t.uidnext&&e.uidvalidity===t.uidvalidity&&e.highestmodseq===t.highestmodseq}function An(e,t,n,r){let i=e.ListedMailbox??``,a=e=>{if(!t.has(R(pn(e,i),e?.UID)))return;let a=Array.isArray(e.Flags)?e.Flags:[];r===`add`&&!a.includes(n)&&(e.Flags=[...a,n]),r===`remove`&&(e.Flags=a.filter(e=>e!==n))};for(let t of e.Messages??[])a(t),(t?.SubMessages??[]).forEach(a)}function jn(e,t){if(t.size===0||!e.Messages)return;let n=e.ListedMailbox??``,r=e=>R(pn(e,n),e?.UID),i=0;e.Messages=e.Messages.flatMap(e=>{let n=e?.SubMessages??[],a=n.filter(e=>!t.has(r(e)));return t.has(r(e))&&a.length===0?(i++,[]):[a.length===n.length?e:{...e,SubMessages:a}]}),i>0&&typeof e.Total==`number`&&(e.Total=Math.max(0,e.Total-i))}var z=new Cn,B=`\\Seen`,V=`\\Flagged`,Mn=`\\Answered`,Nn=`\\Deleted`,Pn=`\\Draft`,Fn=`$Forwarded`,In=`$MDNSent`,Ln=`Junk`,Rn=`NonJunk`,zn=`NotJunk`,Bn=`$Junk`,Vn=`$NotJunk`,Hn=`$Phishing`,Un=`$SubmitPending`,Wn=`$Submitted`,Gn=`$HasAttachment`,Kn=`$HasNoAttachment`;function qn(e,t){if(!e)return[];let n=new Set([B,V,Mn,Nn,Pn,Fn,In,Ln,Rn,zn,Bn,Vn,Hn,Un,Wn,Gn,Kn].map(e=>e.toLowerCase())),r=[];for(let i of e)i.startsWith(`\\`)||n.has(i.toLowerCase())||r.push({id:i,name:Xn(i,t),color:Zn(i)});return r.sort((e,t)=>{let n=e.id.toLowerCase().startsWith(`$label`),r=t.id.toLowerCase().startsWith(`$label`);return n&&!r?-1:!n&&r?1:e.id.localeCompare(t.id)})}var Jn=new Set([Fn,In,Hn,Un,Wn,Gn,Kn].map(e=>e.toLowerCase()));function Yn(e){return e?e.filter(e=>!e.startsWith(`\\`)&&!Jn.has(e.toLowerCase())):[]}function Xn(e,t){switch(e.toLowerCase()){case`$label1`:return t?.t(`tags.important`)||`Important`;case`$label2`:return t?.t(`tags.work`)||`Work`;case`$label3`:return t?.t(`tags.personal`)||`Personal`;case`$label4`:return t?.t(`tags.todo`)||`To Do`;case`$label5`:return t?.t(`tags.later`)||`Later`;default:return e}}function Zn(e){switch(e.toLowerCase()){case`$label1`:return`#ef4444`;case`$label2`:return`#f97316`;case`$label3`:return`#22c55e`;case`$label4`:return`#3b82f6`;case`$label5`:return`#a855f7`;default:return er(e)}}function Qn(e){let t=$n(e);if(!t)return`#fff`;let[n,r,i]=t.map(e=>{let t=e/255;return t<=.03928?t/12.92:((t+.055)/1.055)**2.4});return(.2126*n+.7152*r+.0722*i+.05)**2>.05*1.05?`#000`:`#fff`}function $n(e){let t=/^#([0-9a-f]{6})$/i.exec(e.trim());if(t){let e=parseInt(t[1],16);return[e>>16&255,e>>8&255,e&255]}let n=/^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i.exec(e.trim());if(!n)return null;let[r,i,a]=[Number(n[1]),Number(n[2])/100,Number(n[3])/100],o=i*Math.min(a,1-a),s=e=>{let t=(e+r/30)%12;return 255*(a-o*Math.max(-1,Math.min(t-3,9-t,1)))};return[s(0),s(8),s(4)]}function er(e){let t=0;for(let n=0;n<e.length;n++)t=e.charCodeAt(n)+((t<<5)-t);return`hsl(${Math.abs(t)%360}, 70%, 45%)`}function tr(e){let t=[];for(let n=0;n<e.length;n+=500)t.push(e.slice(n,n+500));return t}async function nr(e){try{return await e.json()??{}}catch{return{}}}var rr=class extends Error{constructor(){super(`message_too_large`),this.name=`MessageTooLargeError`}};function ir(e,t){return e.status===413||t.code===`message_too_large`||t.error===`message_too_large`}var ar=class extends Error{constructor(e){super(`unable to retrieve message attachment ${e.join(`, `)}`),this.name=`MissingUploadsError`,this.uuids=e}},or=class extends Error{constructor(e){super(e),this.name=`SenderNotAllowedError`}};function sr(e,t){let n=t.missing_attachments;return e.status!==409||!Array.isArray(n)||n.length===0?null:new ar(n.map(String))}var H=new class{isAuthError(e){return e.status===401&&(window.dispatchEvent(new CustomEvent(`auth-error`)),!0)}async setFlag(e,t,n,r){if(!t||t.length===0)return{ok:!1,reason:`empty`};let i=0;try{for(let a of tr(t)){let t=await F(`/mailboxes/${k(e)}/messages/flag`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:a,flags:n,action:r})});if(this.isAuthError(t))return{ok:!1,reason:`auth`,applied:i};if(!t.ok){let e=await nr(t),n=e.error===`unsupported_flags`?`unsupported`:`failed`;return E.error(`Failed to set flag`,t.status,e),{ok:!1,reason:n,applied:i,rejected:e.rejected}}i+=a.length}return{ok:!0,applied:i}}catch(e){return E.error(`Failed to set flag`,e),{ok:!1,reason:`failed`,applied:i}}}matchingBody(e,t={}){return JSON.stringify({all:!0,query:e.query||``,except:e.except??[],...t})}countOf(e){return typeof e.count==`number`?e.count:0}async setFlagMatching(e,t,n,r){try{let i=await F(`/mailboxes/${k(e)}/messages/flag`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:this.matchingBody(t,{flags:n,action:r})});if(this.isAuthError(i))return{ok:!1,reason:`auth`};let a=await nr(i);if(!i.ok){let e=a.error===`unsupported_flags`?`unsupported`:`failed`;return E.error(`Failed to set a flag on a folder`,i.status,a),{ok:!1,reason:e,rejected:a.rejected}}return z.sync(),{ok:!0,applied:this.countOf(a)}}catch(e){return E.error(`Failed to set a flag on a folder`,e),{ok:!1,reason:`failed`}}}async moveMatching(e,t,n){return this.fileMatching(`move`,e,t,n)}async copyMatching(e,t,n){return this.fileMatching(`copy`,e,t,n)}async fileMatching(e,t,n,r){try{let i=await F(`/mailboxes/${k(t)}/messages/${e}`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:this.matchingBody(n,{to:r})});if(this.isAuthError(i))return{success:!1,reason:`auth`};let a=await nr(i);return i.ok?(z.sync(),{success:!0,uidMapping:a.uidMapping??{},count:this.countOf(a)}):(E.error(`Failed to ${e} a folder's messages`,i.status,a),{success:!1,reason:`failed`})}catch(t){return E.error(`Failed to ${e} a folder's messages`,t),{success:!1,reason:`failed`}}}async deleteMatchingResult(e,t){try{let n=await F(`/mailboxes/${k(e)}/messages`,{method:`DELETE`,headers:{"Content-Type":`application/json`},body:this.matchingBody(t)});if(this.isAuthError(n))return{ok:!1,reason:`auth`};let r=await nr(n);return n.ok?(z.sync(),{ok:!0,count:this.countOf(r)}):(E.error(`Failed to delete a folder's messages`,n.status,r),{ok:!1,reason:`failed`})}catch(e){return E.error(`Failed to delete a folder's messages`,e),{ok:!1,reason:`failed`}}}async markAsRead(e,t){let n=t?.UID;if(!n||t.Flags?.includes(`\\Seen`))return t;let{ok:r}=await this.setFlag(e,[String(n)],[B],`add`);if(r){let e={...t};return e.Flags=[...e.Flags||[],B],e}return t}async deleteMessagesResult(e,t){if(!t||t.length===0)return{ok:!1,reason:`empty`};let n=0;try{for(let r of tr(t)){let t=await F(`/mailboxes/${k(e)}/messages`,{method:`DELETE`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:r})});if(this.isAuthError(t))return{ok:!1,reason:`auth`};if(!t.ok)return E.error(`Failed to delete messages`,t.status,await nr(t)),n>0&&z.sync({refresh:!0}),{ok:!1,reason:`failed`};n+=r.length}return z.sync(),{ok:!0}}catch(e){return E.error(`Failed to delete messages`,e),n>0&&z.sync({refresh:!0}),{ok:!1,reason:`failed`}}}async deleteMessages(e,t){return(await this.deleteMessagesResult(e,t)).ok}async moveMessages(e,t,n){if(!t||t.length===0)return{success:!1,reason:`empty`};let r=0,i={};try{for(let a of tr(t)){let t=await F(`/mailboxes/${k(e)}/messages/move`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:a,to:n})});if(this.isAuthError(t))return{success:!1,reason:`auth`};if(!t.ok)return E.error(`Failed to move messages`,t.status,await nr(t)),r>0&&z.sync({refresh:!0}),{success:!1,reason:`failed`};let o=await nr(t);Object.assign(i,o.uidMapping??{}),r+=a.length}return z.sync(),{success:!0,uidMapping:i}}catch(e){return E.error(`Failed to move messages`,e),r>0&&z.sync({refresh:!0}),{success:!1,reason:`failed`}}}async copyMessages(e,t,n){if(!t||t.length===0)return{success:!1,reason:`empty`};let r=0;try{for(let i of tr(t)){let t=await F(`/mailboxes/${k(e)}/messages/copy`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:i,to:n})});if(this.isAuthError(t))return{success:!1,reason:`auth`};if(!t.ok)return E.error(`Failed to copy messages`,t.status,await nr(t)),r>0&&z.sync({refresh:!0}),{success:!1,reason:`failed`};r+=i.length}return z.sync(),{success:!0}}catch(e){return E.error(`Failed to copy messages`,e),r>0&&z.sync({refresh:!0}),{success:!1,reason:`failed`}}}async markMessagesAsRead(e,t){if(!t||t.length===0)return!1;let{ok:n}=await this.setFlag(e,t,[B],`add`);return n}async markMessagesAsUnread(e,t){if(!t||t.length===0)return!1;let{ok:n}=await this.setFlag(e,t,[B],`remove`);return n}async saveDraft(e){try{let t=await F(`/messages`,{method:`POST`,body:e});if(t.status===401)return window.dispatchEvent(new CustomEvent(`auth-error`)),null;if(t.ok){let e=await t.json();return{uid:e.draft_uid,mailbox:e.draft_mailbox,size:e.draft_size,attachments:e.attachments,...e.draft_structure?{structure:e.draft_structure}:{},...Array.isArray(e.draft_bcc)?{bcc:e.draft_bcc.map(e=>gt(e.Name,e.Address))}:{}}}let n=await nr(t);if(ir(t,n))throw new rr;let r=sr(t,n);if(r)throw r;return E.error(`Failed to save draft:`,t.status,n),null}catch(e){if(e instanceof ar||e instanceof rr)throw e;return E.error(`Failed to save draft:`,e),null}}async sendDraft(e){try{let t=await F(`/messages`,{method:`POST`,body:e});if(t.status===401)return window.dispatchEvent(new CustomEvent(`auth-error`)),!1;if(t.ok){let e=await t.json().catch(()=>({})),n={not_filed_in_sent:`composer.sentNotFiled`,draft_not_removed:`composer.sentDraftNotRemoved`,not_filed_in_sent_and_draft_not_removed:`composer.sentNotFiledDraftKept`}[e.warning];return n&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{i18nKey:n,type:`warning`,duration:0}})),z.sync(),!n||{sent:!0,warning:e.warning,draftRemoved:e.warning===`not_filed_in_sent`}}let n=await nr(t);throw ir(t,n)?new rr:t.status===403&&n.code===`sender_not_allowed`?new or(n.error||`sender not allowed`):sr(t,n)||Error(n.error||`Failed to send message (${t.status})`)}catch(e){throw E.error(`Failed to send message:`,e),e}}},cr=t(wt(),1),lr=new Set([`:`,`;`,`,`,`(`,`)`,`[`,`]`,`{`,`}`]),ur=e=>e===`
`||e===`\r`||e===`\f`,dr=e=>e===` `||e===`	`||ur(e),fr=e=>e>=`0`&&e<=`9`,pr=e=>fr(e)||e>=`a`&&e<=`f`||e>=`A`&&e<=`F`,mr=e=>e>=`a`&&e<=`z`||e>=`A`&&e<=`Z`||e===`_`||e===`\0`||e.charCodeAt(0)>=128,hr=e=>mr(e)||fr(e)||e===`-`,gr=e=>{let t=e.charCodeAt(0);return t>=1&&t<=8||t===11||t>=14&&t<=31||t===127},_r=e=>e===`\0`?`�`:e,vr=e=>e.replace(/[A-Z]/g,e=>e.toLowerCase()),yr=e=>vr(e).replace(/^-[a-z]+-(?=.)/,``);function br(e){let t=[],n=0,r=t=>e[t]??``,i=e=>r(e)===`\\`&&!ur(r(e+1)),a=e=>r(e)===`-`?mr(r(e+1))||r(e+1)===`-`||i(e+1):mr(r(e))||i(e),o=e=>{let t=r(e);return(t===`+`||t===`-`)&&(t=r(++e)),fr(t)||t===`.`&&fr(r(e+1))},s=()=>{n++;let t=r(n);if(t===``)return`�`;if(!pr(t))return n++,_r(t);let i=``;for(;i.length<6&&pr(r(n));)i+=e[n++];r(n)===`\r`&&r(n+1)===`
`?n+=2:dr(r(n))&&n++;let a=parseInt(i,16);return a===0||a>=55296&&a<=57343||a>1114111?`�`:String.fromCodePoint(a)},c=()=>{let t=``;for(;;)if(hr(r(n)))t+=_r(e[n++]);else if(i(n))t+=s();else return t},l=e=>{let t=``;for(n++;;){let i=r(n);if(i===``)return[`string`,t];if(i===e)return n++,[`string`,t];if(ur(i))return[`bad-string`,t];if(i!==`\\`){t+=_r(i),n++;continue}let a=r(n+1);a===``?n++:ur(a)?n+=a===`\r`&&r(n+2)===`
`?3:2:t+=s()}},u=()=>{for(;;){let e=r(n);if(e===``)break;if(e===`)`){n++;break}i(n)?s():n++}return[`bad-url`,``]},d=()=>{let e=``;for(;dr(r(n));)n++;for(;;){let t=r(n);if(t===``)return[`url`,e];if(t===`)`)return n++,[`url`,e];if(dr(t)){for(;dr(r(n));)n++;return r(n)===``?[`url`,e]:r(n)===`)`?(n++,[`url`,e]):u()}if(t===`"`||t===`'`||t===`(`||gr(t))return u();if(t===`\\`){if(!i(n))return u();e+=s()}else e+=_r(t),n++}},f=()=>{let e=c();if(r(n)!==`(`)return[`ident`,e];if(n++,vr(e)!==`url`)return[`function`,e];for(;dr(r(n))&&dr(r(n+1));)n++;let t=dr(r(n))?r(n+1):r(n);return t===`"`||t===`'`?[`function`,e]:d()},p=()=>{let t=n;for((r(n)===`+`||r(n)===`-`)&&n++;fr(r(n));)n++;if(r(n)===`.`&&fr(r(n+1)))for(n++;fr(r(n));)n++;if((r(n)===`e`||r(n)===`E`)&&(fr(r(n+1))||(r(n+1)===`+`||r(n+1)===`-`)&&fr(r(n+2))))for(n+=fr(r(n+1))?1:2;fr(r(n));)n++;let i=e.slice(t,n);return a(n)?i+c():r(n)===`%`?(n++,`${i}%`):i};for(;n<e.length;){if(r(n)===`/`&&r(n+1)===`*`){let t=e.indexOf(`*/`,n+2);n=t===-1?e.length:t+2;continue}let s=n,u=e[n],d,m=u;if(dr(u)){for(;dr(r(n));)n++;d=`whitespace`,m=` `}else u===`"`||u===`'`?[d,m]=l(u):u===`#`&&(hr(r(n+1))||i(n+1))?(n++,d=`hash`,m=c()):o(n)?(d=`number`,m=p()):e.startsWith(`<!--`,n)?(n+=4,d=`cdo`,m=`<!--`):e.startsWith(`-->`,n)?(n+=3,d=`cdc`,m=`-->`):a(n)?[d,m]=f():u===`@`&&a(n+1)?(n++,d=`at-keyword`,m=c()):(n++,d=lr.has(u)?u:`delim`);t.push({type:d,value:m,start:s,end:n})}return t}function xr(e){return e.type===`function`||e.type===`(`?`)`:e.type===`[`?`]`:e.type===`{`?`}`:null}function Sr(e){let t=[],n=[],r=0;for(let i of br(e)){let e=xr(i);e?n.push(e):i.type===n[n.length-1]?n.pop():i.type===`;`&&n.length===0&&(t.push([r,i.start]),r=i.end)}return t.push([r,e.length]),t}var Cr=e=>e.replace(/^[ \t\n\r\f]+|[ \t\n\r\f]+$/g,``);function wr(e,t){let n=[],r=!1;for(let[i,a]of Sr(e)){let o=e.slice(i,a);t(o)?r=!0:Cr(o)&&n.push(o)}return r?Cr(n.join(`;`)):e}var Tr=new Set([`image`,`image-set`]);function Er(e){let t=br(e).filter(e=>e.type!==`whitespace`),n=[];for(let e=0;e<t.length;e++){let r=t[e],i=t[e+1];if(r.type===`url`)n.push(r.value);else if(r.type===`function`){let a=yr(r.value);if((a===`url`||a===`src`)&&i?.type===`string`)n.push(i.value);else if(Tr.has(a)){let r=[`)`];for(let i=e+1;i<t.length&&r.length>0;i++){let e=t[i],a=xr(e);a?r.push(a):e.type===r[r.length-1]?r.pop():e.type===`string`&&r.length===1&&n.push(e.value)}}}else if(r.type===`at-keyword`){let a=vr(r.value);if(a===`import`&&i?.type===`string`)n.push(i.value);else if(a===`namespace`)for(;e+1<t.length&&t[e+1].type!==`;`;)e++}}return n}var Dr=/(?:url|src|image|image-set|cross-fade|element|expression)\s*\(|@import|(?:^|[^\w-])(?:-ms-)?behavior\s*:/i;function Or(e,t){let n=e[t];if(n.type===`url`)return n.value.startsWith(`#`)?t:-1;if(n.type!==`function`||vr(n.value)!==`url`)return-1;let r=t+1;for(;e[r]?.type===`whitespace`;)r++;if(e[r]?.type!==`string`||!e[r].value.startsWith(`#`))return-1;for(r++;e[r]?.type===`whitespace`;)r++;return e[r]?.type===`)`?r:-1}function kr(e){let t=br(e),n=``;for(let e=0;e<t.length;e++){let r=Or(t,e);if(r!==-1){n+=` `,e=r;continue}let i=t[e];switch(i.type){case`function`:n+=`${i.value}(`;break;case`at-keyword`:n+=`@${i.value}`;break;case`hash`:n+=`#${i.value}`;break;case`url`:case`bad-url`:n+=`url()`;break;case`string`:case`bad-string`:n+=`""`;break;default:n+=i.value}}return Dr.test(n)}var Ar=`data-alps-auto-direction`,jr=`
  :where(:is(body, div, blockquote, li, ul, ol)[data-alps-auto-direction="rtl"]) { direction: rtl; }
  :where(:is(body, div, blockquote, li, ul, ol)[data-alps-auto-direction="ltr"]) { direction: ltr; }
`;function Mr(e){let t=e?.trim().toLowerCase();return t===`ltr`||t===`rtl`||t===`auto`?t:null}function Nr(e){let t=e.getAttribute(Ar);return t===`ltr`||t===`rtl`?t:null}function Pr(e){let t=Nr(e);return t!==null&&e.style?.direction.trim().toLowerCase()===t&&e.style?.getPropertyPriority(`direction`)===``}function Fr(e){let t=e.getAttribute(`style`);if(!t||!Pr(e))return t;let n=e.ownerDocument.createElement(`span`);return n.style.cssText=t,n.style.removeProperty(`direction`),n.getAttribute(`style`)?.trim()||null}function Ir(e){if(!e)return null;let t=e.style?.direction;return t&&!Pr(e)?Mr(t):Mr(e.getAttribute(`dir`))}function Lr(e){let t=new Map,n=new Map,r=document.createElement(`span`);r.dir=`auto`;let i=!0;try{r.matches(`:dir(rtl)`)}catch{i=!1,r.hidden=!0}let a=()=>i?r.matches(`:dir(rtl)`)?`rtl`:`ltr`:getComputedStyle(r).direction===`rtl`?`rtl`:`ltr`,o=e=>{if(n.has(e))return n.get(e);i||document.documentElement.appendChild(r);try{r.textContent=e+`‎`;let t=a();r.textContent=e+`‏`;let i=t===a()?t:null;return n.set(e,i),i}finally{r.remove()}},s=n=>{if(t.has(n))return t.get(n);let r=e(n),i=r.direction===`ltr`||r.direction===`rtl`?r.direction:r.text===void 0?null:o(r.text);if(i===null){for(let e of r.children??[])if(i=s(e),i!==null)break}return t.set(n,i),i};return s}var Rr=new Set([`BODY`,`DIV`,`BLOCKQUOTE`,`LI`,`UL`,`OL`]),zr=new Set([`SCRIPT`,`STYLE`,`TEMPLATE`,`NOSCRIPT`,`BDI`,`BDO`]),Br=new Set([`A`,`ABBR`,`B`,`CITE`,`CODE`,`DATA`,`DEL`,`DFN`,`EM`,`FONT`,`I`,`INS`,`KBD`,`MARK`,`Q`,`S`,`SAMP`,`SMALL`,`SPAN`,`STRONG`,`SUB`,`SUP`,`TIME`,`U`,`VAR`]);function Vr(){return Lr(e=>{if(e.nodeType===3)return{text:e.nodeValue??``};if(e.nodeType!==1)return{children:e.childNodes};let t=e;return zr.has(t.tagName)||t.hidden||t.classList.contains(`gmail_attr`)?{}:Br.has(t.tagName)?Mr(t.getAttribute(`dir`))===null?{children:t.childNodes}:{}:{direction:Ir(t),children:t.childNodes}})}function Hr(e,t=!1){let n=[...e.nodeType===1?[e]:[],...e.querySelectorAll(`*`)];for(let e of n)Pr(e)&&e.style.removeProperty(`direction`),e.removeAttribute(Ar);let r=Vr();for(let e of n){if(!Rr.has(e.tagName)||Ir(e)!==`auto`||e.style?.direction)continue;let n=r(e);n&&(e.setAttribute(Ar,n),t&&(e.style.direction=n))}}var Ur=`data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`;function Wr(e){return e.replace(/^[\x00-\x20]+|[\x00-\x20]+$/g,``).replace(/[\t\n\r]/g,``)}function Gr(e){let t=Wr(e).toLowerCase();return t.startsWith(`http:`)||t.startsWith(`https:`)||/^[\\/]{2}/.test(t)}function Kr(e){return e.toLowerCase().replace(/[^\x21-\x7e]/g,``)}function qr(e){return Kr(e).startsWith(`cid:`)}function Jr(e){return e.replace(/[^\x21-\x7e]/g,``).substring(4)}function Yr(e){let t={img:[`src`,`srcset`],source:[`src`,`srcset`],audio:[`src`],video:[`src`,`poster`],track:[`src`],a:[`href`],area:[`href`],body:[`background`],table:[`background`],thead:[`background`],tbody:[`background`],tfoot:[`background`],tr:[`background`],td:[`background`],th:[`background`]},n=e.localName.toLowerCase(),r=new Set(t[n]??[]);return e.namespaceURI===`http://www.w3.org/2000/svg`&&[`a`,`image`,`use`,`feimage`].includes(n)&&(r.add(`href`),r.add(`xlink:href`)),n===`input`&&e.getAttribute(`type`)?.toLowerCase()===`image`&&r.add(`src`),r}function Xr(e){let t=new Set;if(!e)return t;let n=new DOMParser().parseFromString(e,`text/html`);for(let e of Array.from(n.querySelectorAll(`*`))){let n=Yr(e);for(let r of n){let n=e.getAttribute(r);if(n===null)continue;let i=r===`srcset`?si(n).map(e=>e.url):[n];for(let e of i)qr(e)&&t.add(Jr(e).replace(/^<|>$/g,``))}}return t}function Zr(e,t){if(!e||!t.size)return e;let n=new DOMParser().parseFromString(e,`text/html`),r=e=>qr(e)&&t.has(Jr(e).replace(/^<|>$/g,``)),i=!1;for(let e of Array.from(n.querySelectorAll(`*`)))for(let t of Yr(e)){let n=e.getAttribute(t);if(n!==null){if(t===`srcset`){let i=si(n),a=i.filter(e=>!r(e.url));if(a.length===i.length)continue;a.length?e.setAttribute(t,a.map(e=>`${e.url}${e.descriptor}`).join(`, `)):e.removeAttribute(t)}else{if(!r(n))continue;e.removeAttribute(t)}i=!0}}return i?n.body.innerHTML:e}var Qr=()=>/url\(\s*(['"]?)((?:https?:)?\/\/[^'"\)]+)\1\s*\)/gi,$r=()=>/@import\s+(?:url\(\s*)?(['"]?)((?:https?:)?\/\/[^'"\)]+)\1\s*\)?\s*;?/gi;function ei(e){return Er(e).some(e=>Gr(Kr(e)))}function ti(e){let t;try{t=new URL(e,document.baseURI).href}catch{t=Wr(e)}return`/proxy?url=${encodeURIComponent(t)}`}var ni=new Set([`animate`,`animatecolor`,`animatemotion`,`animatetransform`,`discard`,`set`]);function ri(e){for(let t of Array.from(e.querySelectorAll(`*`)))ni.has(t.localName.toLowerCase())&&t.remove()}var ii=new Set([`fill`,`stroke`,`filter`,`mask`,`clip-path`,`marker-start`,`marker-mid`,`marker-end`,`cursor`]);function ai(e,t,n){let r=n(e.replace(Qr(),(e,n,r)=>{if(!t.allowRemoteResources)return`url(${Ur})`;let i=n||`"`;return`url(${i}${ti(r)}${i})`}));return r===e?null:(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),r)}function oi(e,t){return Gr(e)?(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?ti(e):Ur):null}function si(e){let t=[],n=e=>e===` `||e===`	`||e===`
`||e===`\r`||e===`\f`,r=0;for(;r<e.length;){for(;r<e.length&&(n(e[r])||e[r]===`,`);)r++;if(r>=e.length)break;let i=r;for(;r<e.length&&!n(e[r]);)r++;let a=e.slice(i,r),o=``;if(a.endsWith(`,`))a=a.replace(/,+$/,``);else{let t=r,n=!1;for(;r<e.length;){let t=e[r];if(t===`(`)n=!0;else if(t===`)`)n=!1;else if(t===`,`&&!n)break;r++}let i=e.slice(t,r).trim();i&&(o=` ${i}`),r++}a&&t.push({url:a,descriptor:o})}return t}function ci(e,t){let n=si(e);if(n.length===0)return null;let r=!1,i=n.map(({url:e,descriptor:n})=>Gr(e)?(r=!0,t.allowRemoteResources?`${ti(e)}${n}`:Ur):`${e}${n}`);return r?(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?i.join(`, `):Ur):null}function li(e,t,n=``){if(!e)return null;let r=t.replace(/^<|>$/g,``);if(e.ID&&e.ID.replace(/^<|>$/g,``)===r)return n||`1`;if(e.Children&&Array.isArray(e.Children))for(let r=0;r<e.Children.length;r++){let i=n?`${n}.${r+1}`:`${r+1}`,a=li(e.Children[r],t,i);if(a)return a}return null}function ui(e,t){if(!e.includes(`\\`)&&!/prefers-color-scheme/i.test(e))return e;let n=br(e).filter(e=>e.type!==`whitespace`),r=``,i=0;for(let a=0;a+3<n.length;a++){if(n[a].type!==`(`)continue;let[o,s,c]=[n[a+1],n[a+2],n[a+3]],l=n[a+4],u=vr(c.value);o.type!==`ident`||vr(o.value)!==`prefers-color-scheme`||s.type!==`:`||c.type!==`ident`||u!==`light`&&u!==`dark`||l&&l.type!==`)`||(r+=e.slice(i,n[a].start)+(u===t?`(width >= 0)`:`(width < 0)`),i=l?l.end:c.end,a+=4)}return r+e.slice(i)}function di(e){let t=br(e).find(e=>e.type!==`whitespace`);return t?.type===`ident`&&vr(t.value)===`color-scheme`}function fi(e){let t=br(e),n=``,r=0;for(let i=0;i<t.length;i++){if(t[i].type!==`ident`||vr(t[i].value)!==`color-scheme`)continue;let a=i+1;for(;t[a]?.type===`whitespace`;)a++;if(t[a]?.type!==`:`)continue;let o=0;for(a++;a<t.length;a++){let e=t[a].type;if(e===`(`||e===`[`||e===`{`||e===`function`)o++;else if(o>0&&(e===`)`||e===`]`||e===`}`))o--;else if(o===0&&(e===`;`||e===`}`))break}n+=e.slice(r,t[i].start),r=t[a]?.type===`;`?t[a].end:t[a]?.start??e.length,i=a-1}return n+e.slice(r)}var pi={light:`data-alps-css-light`,dark:`data-alps-css-dark`},mi={light:`data-alps-media-light`,dark:`data-alps-media-dark`},hi=[...Object.values(pi),...Object.values(mi)];function gi(e,t){e.documentElement.style.setProperty(`color-scheme`,t,`important`),e.querySelectorAll(`style[${pi[t]}]`).forEach(e=>{let n=e.getAttribute(pi[t])??``;e.textContent!==n&&(e.textContent=n)}),e.querySelectorAll(`[${mi[t]}]`).forEach(e=>{let n=e.getAttribute(mi[t]);n?e.setAttribute(`media`,n):e.removeAttribute(`media`)})}function _i(e,t){if(!e)return e;let n=e=>ei(e)?(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),``):e;try{let r=cr.parse(e,{silent:!0});if(r&&r.stylesheet&&r.stylesheet.rules){let e=Qr(),i=n=>n.replace(e,(e,n,r)=>{if(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources){let e=n||`"`;return`url(${e}${ti(r)}${e})`}return`url(${Ur})`}),a=n=>{for(let r=n.length-1;r>=0;r--){let o=n[r];if([`rule`,`font-face`,`page`,`keyframe`].includes(o.type)&&!o.declarations&&(o.declarations=[]),[`rule`,`page`].includes(o.type)&&!o.selectors&&(o.selectors=[]),o.type===`keyframe`&&!o.values&&(o.values=[]),o.type===`import`)ei(`@import ${o.import??``};`)&&t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),n.splice(r,1);else{if(o.type===`font-face`){let e=o;if(e.declarations){let i=!1;for(let n of e.declarations)n.type===`declaration`&&ei(n.value??``)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),i=!0);if(i&&!t.allowRemoteResources){n.splice(r,1);continue}}}if(o.declarations)for(let n=o.declarations.length-1;n>=0;n--){let r=o.declarations[n];r.type===`declaration`&&r.value&&(di(r.property??``)?o.declarations.splice(n,1):(r.value.match(e)&&(r.value=i(r.value)),ei(r.value)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),o.declarations.splice(n,1))))}o.rules&&a(o.rules),o.keyframes&&a(o.keyframes)}}};return a(r.stylesheet.rules),n(cr.stringify(r))}}catch(e){console.warn(`AST CSS parsing failed, falling back to regex sanitizer`,e)}let r=fi(e),i=$r(),a=Qr();return(r.match(i)||r.match(a))&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),r=r.replace(i,``),t.allowRemoteResources?r=r.replace(a,(e,t,n)=>`url(${t}${ti(n)}${t})`):(r=r.replace(/@font-face\s*\{[^{}]*\}/gi,e=>/url\(\s*['"]?(?:https?:)?\/\//i.test(e)?``:e),r=r.replace(a,`url(${Ur})`))),n(r)}function vi(e){let t=t=>{try{return e.documentElement.matches(t)||e.body.matches(t)}catch{return!1}},n=e=>e.some(e=>e.type===`rule`&&e.selectors?.some(t)&&e.declarations?.some(e=>e.property?.toLowerCase()===`direction`)||Array.isArray(e.rules)&&n(e.rules));return[...e.querySelectorAll(`style`)].some(e=>{if(!/\bdirection\s*:/i.test(e.textContent??``))return!1;try{return n(cr.parse(e.textContent??``,{silent:!0}).stylesheet?.rules??[])}catch{return!1}})}function yi(e,t){let n=new DOMParser().parseFromString(e,`text/html`);n.documentElement.hasAttribute(`dir`)||n.body.hasAttribute(`dir`)||n.documentElement.style.direction||n.body.style.direction||vi(n)||(n.body.dir=`auto`),n.querySelectorAll(`iframe, object, embed, frame, frameset, applet, meta[http-equiv]`).forEach(e=>e.remove()),ri(n),n.querySelectorAll(`link`).forEach(e=>{(e.getAttribute(`rel`)||``).toLowerCase()!==`stylesheet`&&e.remove()});let r=n.createElement(`base`);r.target=`_blank`,n.head.prepend(r);let i=`/mailboxes/${k(t.mailbox)}/messages/${t.messageUid}/raw`,a=n.createElement(`meta`);a.httpEquiv=`Content-Security-Policy`;let o=[...t.messageUid?[new URL(i,window.location.origin).href]:[],...t.allowRemoteResources?[`${window.location.origin}/proxy`]:[],`data:`,`blob:`,`cid:`].join(` `);a.content=`default-src 'none'; img-src ${o}; media-src ${o}; style-src 'unsafe-inline'; font-src ${o}; script-src 'none'; object-src 'none'; frame-src 'none'; child-src 'none'; form-action 'none'; base-uri 'none';`,n.head.prepend(a);let s=window.innerWidth<=768,c=n.createElement(`style`);c.textContent=`
    body { margin: 0; padding: 24px; box-sizing: border-box; font: 14px -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; overflow-x: auto; word-wrap: break-word; background-color: #ffffff; color: #000000; }
    ${s?`body { padding: 16px !important; }`:``}
    html:not(.x), body:not(.x) { height: auto !important; }
    p:first-child { margin-top: 0; }
    p:last-child { margin-bottom: 0; }
    a[href] { color: #3781b8; text-decoration: none; }
    a[href]:hover { text-decoration: underline; }
    blockquote[type='cite'] { margin: 0; margin-inline-start: 0.8ex; border-inline-start: 1px #ccc solid; padding-inline-start: 1ex; }
    ${jr}
    img { max-width: 100%; height: auto; }
  `,n.head.prepend(c);let l=e=>{let n=t.messageStructure?li(t.messageStructure,Jr(e)):null;return n?`${i}?part=${n}`:null};n.querySelectorAll(`img`).forEach(e=>{let n=e.getAttribute(`src`);if(n){if(qr(n)){let t=l(n);t&&(e.src=t)}else Gr(n)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?e.src=ti(n):(e.setAttribute(`data-original-src`,n),e.src=Ur,e.style.height=`0`,e.style.width=`0`))}});for(let e of Array.from(n.querySelectorAll(`img[srcset], source[srcset], video[poster], source[src]`)))for(let n of[`srcset`,`poster`,`src`]){let r=e.getAttribute(n);if(!r||n===`src`&&e.tagName.toLowerCase()===`img`)continue;let i=n===`srcset`?ci(r,t):oi(r,t);i!==null&&e.setAttribute(n,i)}n.querySelectorAll(`[background]`).forEach(e=>{let n=e.getAttribute(`background`)??``,r=qr(n)?l(n):oi(n,t);r!==null&&e.setAttribute(`background`,r)}),n.querySelectorAll(`link[rel="stylesheet"]`).forEach(e=>{let n=e.getAttribute(`href`);n&&Gr(n)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),e.remove())}),n.querySelectorAll(`a[href]`).forEach(e=>{e.setAttribute(`rel`,`noopener noreferrer`)}),n.querySelectorAll(hi.map(e=>`[${e}]`).join(`, `)).forEach(e=>{for(let t of hi)e.removeAttribute(t)}),n.querySelectorAll(`[media]`).forEach(e=>{let t=e.getAttribute(`media`)??``,n=ui(t,`light`);n!==t&&(e.setAttribute(mi.light,n),e.setAttribute(mi.dark,ui(t,`dark`)))}),n.querySelectorAll(`style`).forEach(e=>{let n=e.textContent;if(!n)return;let r=ui(n,`light`);if(r===n){e.textContent=_i(n,t);return}let i=_i(r,t);e.setAttribute(pi.light,i),e.setAttribute(pi.dark,_i(ui(n,`dark`),t)),e.textContent=i}),n.querySelectorAll(`[style]`).forEach(e=>{let t=e.getAttribute(`style`)??``,n=wr(t,di);n!==t&&(n?e.setAttribute(`style`,n):e.removeAttribute(`style`))}),n.querySelectorAll(`[style]`).forEach(e=>{let n=ai(e.getAttribute(`style`)??``,t,e=>wr(e,ei));n!==null&&(n?e.setAttribute(`style`,n):e.removeAttribute(`style`))});let u=[...ii];return n.querySelectorAll(u.map(e=>`[${e}]`).join(`, `)).forEach(e=>{for(let n of u){let r=e.getAttribute(n);if(!r)continue;let i=ai(r,t,e=>ei(e)?``:e);i!==null&&(i?e.setAttribute(n,i):e.removeAttribute(n))}}),gi(n,`light`),Hr(n),n.documentElement.outerHTML}function bi(e){let t=Kr(e);return t.startsWith(`javascript:`)||t.startsWith(`vbscript:`)||t.startsWith(`data:text/html`)}var xi=new Set([`href`,`src`,`action`,`formaction`,`xlink:href`,`poster`]);function Si(e){return wr(e,kr)}function Ci(e){if(!e)return``;let t=new DOMParser().parseFromString(e,`text/html`);t.querySelectorAll(`script, style, link, iframe, object, embed, frame, frameset, applet, form, meta, base, template`).forEach(e=>e.remove()),ri(t),t.querySelectorAll(`noscript, noembed, noframes`).forEach(e=>e.remove());for(let e of Array.from(t.querySelectorAll(`xmp, plaintext`))){let n=t.createElement(`pre`);n.textContent=e.textContent,e.replaceWith(n)}for(let e of Array.from(t.querySelectorAll(`*`))){for(let t of Array.from(e.attributes)){let n=t.name.toLowerCase();(n.startsWith(`on`)||(n===`srcset`?si(t.value).some(e=>bi(e.url)):xi.has(n)&&bi(t.value))||ii.has(n)&&kr(t.value)||n===`background`&&Gr(t.value))&&e.removeAttribute(t.name)}let t=e.getAttribute(`style`),n=t&&Si(t);n!==t&&(n?e.setAttribute(`style`,n):e.removeAttribute(`style`))}if(!t.body)return``;let n=Ir(t.body)??Ir(t.documentElement);if(n){let e=t.createElement(`div`);e.dir=n;let r=t.body.getAttribute(`lang`)??t.documentElement.getAttribute(`lang`);return r&&(e.lang=r),e.innerHTML=t.body.innerHTML,e.outerHTML}return t.body.innerHTML}function wi(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}var Ti=`Attachments exceed the maximum allowed size.`,Ei=new Map;function Di(){return globalThis.crypto?.randomUUID?.()??`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}function Oi(e){let t=Ei.get(e);t&&(t.abort(),Ei.delete(e))}function ki(e){for(let t of e)t.uploading&&t._tempId&&Oi(t._tempId)}async function Ai(e){try{await fetch(`/attachments/${e}`,{method:`DELETE`})}catch(e){E.error(`Failed to delete attachment from server:`,e)}}function ji(e,t,n,r,i,a,o,s){let c=document.createElement(`input`);c.type=`file`,c.multiple=!0,c.onchange=c=>{let l=Array.from(c.target.files||[]);l.length!==0&&Mi(l,e,t,n,r,i,a,o,s)},c.click()}function Mi(e,t,n,r,i,a,o,s,c){let l=0;for(let t of e)l+=t.size;if(n>=0&&r+l>n)window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:c||Ti,type:`error`,duration:5e3}}));else for(let n of e){let e=Di();i(e,n);let r=new FormData;r.append(`attachments`,n);let c=new XMLHttpRequest;Ei.set(e,c),c.open(`POST`,`/attachments?composer_id=${encodeURIComponent(t)}`,!0),c.upload.onprogress=t=>{if(t.lengthComputable){let n=Math.round(t.loaded/t.total*100);a(e,n)}},c.onload=()=>{if(Ei.delete(e),c.status>=200&&c.status<300)try{let t=JSON.parse(c.responseText),n=Array.isArray(t)?t:t.uuids||[];n.length>0?o(e,n):s(e,Error(`No UUID returned from server`))}catch(t){s(e,t)}else try{let t=JSON.parse(c.responseText);s(e,Error(t.error||`Unknown error`))}catch{s(e,Error(`Upload failed with status `+c.status))}},c.onerror=()=>{Ei.delete(e),s(e,Error(`Network error during upload`))},c.onabort=()=>{Ei.delete(e)},c.send(r)}}function Ni(e){let t=e-2*Math.floor(e/78);return t%4!=0&&(t=Math.max(0,e-2*Math.ceil(e/78))),Math.floor(t*3/4)}function Pi(e,t){let n=Xr(t),r=[],i=(e,t)=>{if(!e)return;let a=String(e.Extended?.Disposition?.Value??``).toLowerCase()===`inline`;if(e.ID&&(a||n.has(String(e.ID).replace(/^<|>$/g,``)))){let n=Number(e.Size)||0;r.push({name:e.Extended?.Disposition?.Params?.filename||e.Params?.name||`image`,size:String(e.Encoding).toLowerCase()===`base64`?Ni(n):n,type:e.Type&&e.Subtype?`${e.Type}/${e.Subtype}`.toLowerCase():`application/octet-stream`,partPath:t||`1`,inline:!0,contentId:String(e.ID).replace(/^<|>$/g,``)})}Array.isArray(e.Children)&&e.Children.forEach((e,n)=>i(e,t?`${t}.${n+1}`:`${n+1}`))};return i(e,``),r}function Fi(e,t){let n={},r=e?.Envelope?.MessageID||e?.Envelope?.MessageId;return r&&(n.inReplyTo=r,n.references=Array.isArray(e.References)?[...e.References]:[]),e?.UID!==void 0&&e?.UID!==null&&t&&(n.replyMailbox=t,n.replyUid=String(e.UID)),n}function Ii(e,t){t.inReplyTo&&e.append(`in_reply_to`,t.inReplyTo),t.references?.length&&e.append(`references`,t.references.join(` `)),t.replyMailbox&&t.replyUid&&(e.append(`reply_mailbox`,t.replyMailbox),e.append(`reply_uid`,t.replyUid)),t.quoteSource?.mailbox&&t.quoteSource.uid&&(e.append(`source_mailbox`,t.quoteSource.mailbox),e.append(`source_uid`,t.quoteSource.uid))}var Li=class extends Error{constructor(e){super(`Drafts could not be saved before signing out`),this.name=`DraftFlushError`,this.keep=e}keepRecoveryCopy(){this.keep?.()}},Ri=e=>`alps_compose_drafts_${e}`,zi=`alps_compose_drafts`,Bi=e=>{let t=e.trim();if(t.endsWith(`>`)){let e=t.lastIndexOf(`<`);e!==-1&&(t=t.substring(e+1,t.length-1))}return t.trim().toLowerCase()},Vi=e=>(e||[]).map(ht).join(`, `),Hi=e=>JSON.stringify([e.from,e.subject,e.to,e.cc,e.bcc,e.text,e.format,e.html,(e.attachments||[]).map(e=>[e._tempId,e.uuid,e.partPath,e.filename])]);function Ui(e,t,n){let r=Ue(n.identities,t.from);r?e.append(`from`,r.address):n.replyTo&&e.append(`reply_to`,n.replyTo)}var Wi=e=>{let t={...e,missing:!0};return delete t.uuid,t},Gi=(e,t,n)=>{let r=e=>e.uuid?`uuid:${e.uuid}`:e.partPath?`part:${e.partPath}`:void 0,i=new Set(t.map(r)),a=new Map;for(let{source:e,...t}of n){let n=e&&r(e);n&&a.set(n,t)}return e.map(e=>{let t=r(e),n=t&&i.has(t)&&a.get(t);return n?{...n,...e.contentId&&{contentId:e.contentId}}:e})},Ki=e=>{let t=e.attachments||[];if(e.format!==`html`)return t.filter(e=>!e.inline);let n=e=>String(e.contentId).replace(/^<|>$/g,``),r=t.filter(e=>e.inline&&e.contentId);if(!r.length)return t;let i=Xr(e.html||``);if(r.every(e=>i.has(n(e))))return t;let a=Xr(e.initialHtml||``);return t.filter(e=>!r.includes(e)||i.has(n(e))||!a.has(n(e)))},qi=e=>{let t=Ki(e);return(e.attachments||[]).filter(e=>!t.includes(e))},Ji=(e,t)=>{let n=qi(t);return n.length?e.filter(e=>!n.includes(e)):e},Yi=(e,t,n={})=>{let r=qi(t);if(!r.length)return{};let i=e=>e.replace(/^<|>$/g,``),a=new Set(r.map(e=>e.contentId).filter(Boolean).map(i));if(r.some(e=>!e.contentId)){if(n.structure){let e=new Set(Pi(n.structure,t.html||``).map(e=>e.contentId));for(let n of Xr(t.html||``))e.has(n)||a.add(n)}else if(!t.draftUid||t.quoteSource?.uid===t.draftUid&&t.quoteSource?.mailbox===t.draftMailbox){let e=new Set(r.filter(e=>!e.contentId).map(e=>e.partPath));for(let n of Pi(t.quoteSource?.structure,t.html||``))e.has(n.partPath)&&n.contentId&&a.add(n.contentId)}}return a.size?{html:Zr(e.html||``,a),discardedInlineIds:[...new Set([...(e.discardedInlineIds||[]).map(i),...a])]}:{}},Xi=(e,t)=>{let n=e.quoteSource;if(n&&e.draftUid&&n.uid===e.draftUid&&n.mailbox===e.draftMailbox)return{mailbox:t.mailbox,uid:t.uid,structure:t.structure??n.structure}},Zi=e=>e.filter(e=>e.inline&&e.partPath).map(e=>e.partPath).join(`,`),Qi=e=>{let t=Bi(e);return t.startsWith(`noreply`)||t.startsWith(`no-reply`)||t.startsWith(`mailer-daemon`)},$i=e=>e&&e.filter(e=>!Qi(e)),ea=class extends EventTarget{constructor(){super(),this.state={activeComposers:[]},this.saveTimeout=null,this.username=null,this.keepDraftsOnSignOut=!1,this.flushOnPageHide=()=>{this.saveTimeout!==null&&(window.clearTimeout(this.saveTimeout),this.saveTimeout=null,this.saveDrafts())},this.adoptSession=()=>{let e=ze();if(e===this.username)return;let t=this.username===null?this.state.activeComposers:[];this.username=e;let n=e?this.loadDrafts(e):[];this.state.activeComposers=e?[...n,...t]:[],this.notify()},this.handleSessionCleared=e=>{this.saveTimeout!==null&&(window.clearTimeout(this.saveTimeout),this.saveTimeout=null);let t=e?.detail?.reason===`expired`;t&&this.saveDrafts();let n=t||this.keepDraftsOnSignOut;this.keepDraftsOnSignOut=!1;let r=this.username&&!n?Ri(this.username):null;this.username=null;for(let e of this.state.activeComposers)ki(e.attachments||[]);if(this.state.activeComposers=[],this.notify(),r)try{localStorage.removeItem(r)}catch(e){E.error(`Failed to clear compose drafts`,e)}};try{localStorage.removeItem(zi)}catch{}window.addEventListener(`session-cleared`,this.handleSessionCleared),window.addEventListener(`user-logged-in`,this.adoptSession),window.addEventListener(`alps-active-user-changed`,this.adoptSession),window.addEventListener(`pagehide`,this.flushOnPageHide),this.adoptSession()}loadDrafts(e){try{let t=localStorage.getItem(Ri(e));if(t)return JSON.parse(t).map(e=>{let t=e.isSending;return{...e,attachments:(e.attachments||[]).map(e=>e.uploading&&e._replaces?e._replaces:e).filter(e=>!e.uploading&&(e.uuid||e.partPath||e.missing)).map(e=>e.uuid?Wi(e):e),isSending:!1,isSaving:!1,closing:!1,minimized:!t&&e.minimized}})}catch(e){E.error(`Failed to parse compose drafts from localStorage`,e)}return[]}saveDrafts(){if(!this.username)return this.state.activeComposers.length===0;try{return localStorage.setItem(Ri(this.username),JSON.stringify(this.state.activeComposers)),!0}catch(e){return E.error(`Failed to save compose drafts to localStorage`,e),!1}}debouncedSaveDrafts(){this.saveTimeout!==null&&window.clearTimeout(this.saveTimeout),this.saveTimeout=window.setTimeout(()=>{this.saveDrafts(),this.saveTimeout=null},500)}persistNow(){return this.saveTimeout!==null&&(window.clearTimeout(this.saveTimeout),this.saveTimeout=null),this.state.activeComposers.length===0||this.saveDrafts()}notify(){this.dispatchEvent(new CustomEvent(`change`))}get stateCopy(){return{...this.state}}getComposer(e){return this.state.activeComposers.find(t=>t.id===e)}getState(){return this.state}openComposer(e,t={}){if(e?.draftUid){let t=this.state.activeComposers.find(t=>t.draftUid===e.draftUid);if(t){this.bringComposerToFront(t.id),t.minimized&&this.updateComposer(t.id,{minimized:!1});return}}let n=window.innerWidth<=768;if(n&&this.state.activeComposers.length>=1){let e=this.state.activeComposers[0].id;this.bringComposerToFront(e);return}if(!n&&this.state.activeComposers.length>=3)return;let r=`composer_`+Date.now()+`_`+Math.random().toString(36).substr(2,5),i=`html`,a=``,o=je();o.composeFormat===`text`&&(i=`text`),o.signature&&(a=o.signature);let s=e?.text||``,c=e?.html||``;if(a&&!e?.draftUid){let n=`-- \n${a}`,r=`<div class="alps-signature">-- <br>${wi(a).replace(/\r?\n/g,`<br>`)}</div>`;t.signature===`below`?(s=`${s}\n\n${n}`,c=`${c}<br><br>${r}`):(s=`\n\n${n}\n${s}`,c=c||e?.text?`<br><br>${r}${c}`:`<br><br>${r}`)}let l={id:r,minimized:!1,expanded:!1,dirty:!1,subject:``,format:e?.format||i,attachments:[],zIndex:1e3+this.state.activeComposers.length,...e,to:$i(e?.to)||[],cc:$i(e?.cc)||[],bcc:$i(e?.bcc)||[],text:s,html:c,initialText:s,initialHtml:c};this.state={...this.state,activeComposers:[...this.state.activeComposers,l]},this.saveDrafts(),this.notify()}updateComposer(e,t,{edit:n=!0}={}){t.to&&=$i(t.to),t.cc&&=$i(t.cc),t.bcc&&=$i(t.bcc);let r=this.state.activeComposers.map(r=>{if(r.id!==e)return r;let i=!1;`from`in t&&(t.from||``)!==(r.from||``)&&(i=!0),`subject`in t&&t.subject!==r.subject&&(i=!0),`to`in t&&JSON.stringify(t.to||[])!==JSON.stringify(r.to||[])&&(i=!0),`cc`in t&&JSON.stringify(t.cc||[])!==JSON.stringify(r.cc||[])&&(i=!0),`bcc`in t&&JSON.stringify(t.bcc||[])!==JSON.stringify(r.bcc||[])&&(i=!0),`attachments`in t&&t.attachments!==r.attachments&&(i=!0);let a=!r.dirty&&!r.draftUid;`text`in t&&(t.text||``)!==(r.text||``)&&!(a&&(t.text||``).trim()===(r.initialText||``).trim())&&(i=!0),`format`in t&&t.format!==r.format&&(i=!0),(t.format??r.format)===`html`&&`html`in t&&(t.html||``)!==(r.html||``)&&(i=!0);let o=`dirty`in t?t.dirty:n&&i?!0:r.dirty,s=!n&&(r.text||``)===(r.initialText||``)?{...`text`in t&&{initialText:t.text},...`html`in t&&{initialHtml:t.html}}:{};return{...r,...t,...s,dirty:o}});this.state={...this.state,activeComposers:r},this.debouncedSaveDrafts(),this.notify()}closeComposer(e){this.state={...this.state,activeComposers:this.state.activeComposers.filter(t=>t.id!==e)},this.saveDrafts(),this.notify()}clearAllComposers(){this.saveTimeout!==null&&this.persistNow(),this.state.activeComposers.length!==0&&(this.state={...this.state,activeComposers:[]},this.notify())}async saveAllDirtyDrafts(){this.keepDraftsOnSignOut=!1;let e=this.username,t=!1;try{for(let n of this.state.activeComposers.map(e=>e.id)){if(this.username!==e)throw new Li;let r=this.getComposer(n);if(!r)continue;if(r.isSending||r.isSaving||r.closing||r.attachments?.some(e=>e.uploading||e.missing)){t=!0;continue}if(!r.dirty){this.closeComposer(n);continue}let i=(r.to?.length||0)>0||(r.cc?.length||0)>0||(r.bcc?.length||0)>0,a=r.text?.trim()!==r.initialText?.trim()||(r.subject?.trim().length||0)>0;if(!r.draftUid&&!i&&!a&&!(r.attachments&&r.attachments.length>0)){this.closeComposer(n);continue}let o=Hi(r);this.updateComposer(n,{isSaving:!0});try{let i;try{i=await H.saveDraft(this.draftForm(r))}catch(e){if(!(e instanceof ar))throw e;let t=new Set(e.uuids),r=this.getComposer(n);r&&this.updateComposer(n,{attachments:(r.attachments||[]).map(e=>e.uuid&&t.has(e.uuid)?Wi(e):e)}),i=null}if(this.username!==e)throw new Li;if(!i){t=!0;continue}let a=this.getComposer(n);if(a&&Hi(a)!==o){let e=i.attachments?Gi(a.attachments||[],r.attachments||[],i.attachments):a.attachments;e&&=Ji(e,r);let o=Xi(r,i);this.updateComposer(n,{draftUid:i.uid,draftMailbox:i.mailbox,...e!==a.attachments&&{attachments:e},...o&&{quoteSource:o},...Yi(a,r,i)}),t=!0;continue}this.closeComposer(n)}finally{this.getComposer(n)&&this.updateComposer(n,{isSaving:!1})}}if(t||this.state.activeComposers.length>0)throw new Li}catch(t){throw t instanceof Li||E.error(`Failed to save drafts before signing out`,t),this.saveDrafts(),new Li(this.username===e&&e!==null?()=>this.retainDraftsForSignOut(e):void 0)}}retainDraftsForSignOut(e){this.username===e&&(this.saveTimeout!==null&&(window.clearTimeout(this.saveTimeout),this.saveTimeout=null),this.saveDrafts(),this.keepDraftsOnSignOut=!0)}draftForm(e){let t=new FormData,n=[...e.bcc||[]],r=je(),i=Ie(r);r.bccMyself&&i&&!n.some(e=>Bi(e)===Bi(i))&&n.push(i),Ui(t,e,r),t.append(`to`,Vi(e.to)),t.append(`cc`,Vi(e.cc)),t.append(`bcc`,Vi(n)),t.append(`subject`,(e.subject||``).trim()),t.append(`text`,e.text||``),e.html&&e.format===`html`&&t.append(`html`,e.html),t.append(`save_as_draft`,`1`);let a=Ki(e),o=a.map(e=>e.uuid).filter(Boolean).join(`,`);o&&t.append(`attachment-uuids`,o);let s=a.map(e=>e.partPath).filter(Boolean).join(`,`);s&&t.append(`prev_attachments`,s);let c=Zi(a);return c&&t.append(`inline_attachments`,c),e.draftMailbox&&t.append(`draft_mailbox`,e.draftMailbox),e.draftUid&&t.append(`draft_uid`,e.draftUid),Ii(t,e),t}bringComposerToFront(e){let t=1e3;this.state.activeComposers.forEach(e=>{e.zIndex&&e.zIndex>t&&(t=e.zIndex)}),this.updateComposer(e,{zIndex:t+1})}},ta=l(`compose-store`),na=class extends c{constructor(...e){super(...e),this.persistFailed=!1,this._handleI18nChange=()=>this.requestUpdate()}static{this.styles=y`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      box-sizing: border-box;
      height: 100%;
      min-height: 240px;
      padding: 24px;
      text-align: center;
      color: var(--text-primary);
      background: var(--bg-primary);
    }

    .title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .hint {
      margin: 4px 0 0;
      color: var(--text-muted);
      font-size: 14px;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .persist-error {
      margin: 0;
      color: var(--error, #ef4444);
    }

    a {
      color: var(--accent-color);
      font-size: 14px;
    }
  `}connectedCallback(){super.connectedCallback(),this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}_reload(){this.persistFailed=this.composeStore?.persistNow()===!1,this.persistFailed||$e()}render(){return b`
      <div role="alert">
        <h2 class="title">${this.i18nStore?.t(`general.pageLoadFailed`)}</h2>
        <p class="hint">${this.i18nStore?.t(`general.pageLoadFailedHint`)}</p>
      </div>
      ${this.persistFailed?b`<p class="persist-error" role="alert">${this.i18nStore?.t(`composer.draftSaveFailedKeepOpen`)}</p>`:``}
      <div class="actions">
        <alps-button variant="primary" @click=${this._reload}>${this.i18nStore?.t(`update.reload`)}</alps-button>
        <a href="#/mailbox/INBOX">${this.i18nStore?.t(`navigation.messages`)}</a>
      </div>
    `}};N([s({context:A})],na.prototype,`i18nStore`,void 0),N([s({context:ta})],na.prototype,`composeStore`,void 0),N([d()],na.prototype,`persistFailed`,void 0),na=N([o(`alps-page-load-error`)],na);var ra=`alps-login-notice`;function ia(e){try{sessionStorage.setItem(ra,e)}catch{}}function aa(){try{let e=sessionStorage.getItem(ra);return e&&sessionStorage.removeItem(ra),e||null}catch{return null}}var oa=class extends c{constructor(...e){super(...e),this.icon=``,this.branded=!1,this.title=``,this.subtitle=``}static{this.styles=[Oe,y`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      background: var(--bg-secondary, #f9fafb);
      position: relative;
    }

    .card {
      position: relative;
      z-index: 1;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      padding: 32px;
      border-radius: var(--radius-lg, 8px);
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      width: 100%;
      max-width: 360px;
      color: var(--text-primary, #111827);
    }

    .logo-container {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;
    }

    .logo-container svg,
    .logo-container img.logo {
      width: var(--auth-card-icon-size, 40px);
      height: var(--auth-card-icon-size, 40px);
      fill: var(--auth-card-icon-color, currentColor);
    }

    h1 {
      margin-top: 0;
      margin-bottom: 4px;
      text-align: center;
      font-family: var(--font-heading, 'Inter', sans-serif);
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary, #111827);
    }

    p.subtitle {
      text-align: center;
      color: var(--text-secondary, #4b5563);
      margin-bottom: 24px;
      font-size: 14px;
      line-height: 1.5;
    }

    @media (max-width: 640px) {
      :host {
        background: var(--bg-primary, #ffffff);
      }
      
      .card {
        border: none;
        box-shadow: none;
      }
    }
  `]}render(){return b`
      <div class="card">
        ${this.branded||this.icon?b`
          <div class="logo-container">
            ${this.branded?Ke():P(this.icon)}
          </div>
        `:``}
        ${this.title?b`<h1>${this.title}</h1>`:``}
        ${this.subtitle?b`<p class="subtitle">${this.subtitle}</p>`:``}
        
        <slot></slot>
      </div>
    `}};N([_({type:String})],oa.prototype,`icon`,void 0),N([_({type:Boolean})],oa.prototype,`branded`,void 0),N([_({type:String})],oa.prototype,`title`,void 0),N([_({type:String})],oa.prototype,`subtitle`,void 0),oa=N([o(`alps-auth-card`)],oa);var sa=class extends c{constructor(...e){super(...e),this.text=``,this.fullHeight=!1}static{this.styles=[j,y`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: currentColor;
    }
    
    :host([full-height]) {
      display: flex;
      height: 100%;
    }

    .spinner {
      animation: spin 1.5s linear infinite;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner .icon {
      width: var(--loader-size, 32px);
      height: var(--loader-size, 32px);
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]}render(){return b`
      <div class="spinner">${P(`edelweiss`)}</div>
      ${this.text?b`<span>${this.text}</span>`:``}
    `}};N([_({type:String})],sa.prototype,`text`,void 0),N([_({type:Boolean,attribute:`full-height`})],sa.prototype,`fullHeight`,void 0),sa=N([o(`alps-loader`)],sa);var ca=class extends c{constructor(...e){super(...e),this.notice=null,this.username=``,this.password=``,this.rememberMe=!1,this.error=``,this.isSubmitting=!1,this.retryAfter=0,this.isRateLimited=!1,this._handleI18nChange=()=>{this.requestUpdate()}}static{this.styles=[j,y`
    .form-group {
      margin-bottom: 16px;
      position: relative;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .native-input {
      width: 100%;
      height: 36px;
      padding: 0 12px;
      background: var(--alps-input-bg, var(--bg-primary, #ffffff));
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--input-radius, 6px);
      color: var(--text-primary, #111827);
      font-family: var(--font-base, 'Inter', sans-serif);
      font-size: var(--input-font-size, 14px);
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }

    .has-left-icon .native-input {
      padding-left: 36px;
    }

    /* The address and the password are written left to right in every
       language, but the icon follows the interface: in a right-to-left one it
       sits on the right, and the room for it moves there with it. Physical
       sides, because the input's own direction is not the interface's. */
    :host(:dir(rtl)) .has-left-icon .native-input {
      padding-left: 12px;
      padding-right: 36px;
    }

    :host(:dir(rtl)) .native-input:placeholder-shown {
      text-align: right;
    }

    /* The transparent outline paints nothing here; forced colors, which drop
       the border colour and the shadow, give it a system colour. */
    .native-input:focus {
      border-color: var(--accent-color, #005A9E);
      box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
      outline: 2px solid transparent;
    }

    .native-input::placeholder {
      color: var(--text-muted, #9ca3af);
    }

    .icon-left {
      position: absolute;
      inset-inline-start: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      color: var(--text-muted, #9ca3af);
      pointer-events: none;
    }

    .icon-left svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }

    /* The label wraps on a phone in most languages ("Stay signed in after
       closing the browser"), so the box sits on the FIRST line rather than
       centred on the block, and never shrinks to make room for the text. */
    .checkbox-group label {
      display: flex;
      align-items: flex-start;
      cursor: pointer;
      font-size: 14px;
      line-height: 20px;
      color: var(--text-secondary, #4b5563);
      user-select: none;
    }

    .checkbox-group input[type="checkbox"] {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      margin: 0;
      margin-top: 2px;
      margin-inline-end: 8px;
      cursor: pointer;
      accent-color: var(--accent-color, #2563eb);
    }

    .error-container {
      border-radius: var(--radius-md, 6px);
      padding: 8px 12px;
      margin-bottom: 24px;
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }

    .error-text {
      color: var(--error, #ef4444);
      font-size: 14px;
      margin: 0;
      text-align: center;
    }

    .notice-container {
      border-radius: var(--radius-md, 6px);
      padding: 8px 12px;
      margin-bottom: 24px;
      background: var(--bg-tertiary, rgba(0, 0, 0, 0.04));
      border: 1px solid var(--border-color, #e5e7eb);
    }

    .notice-text {
      color: var(--text-secondary, #4b5563);
      font-size: 14px;
      margin: 0;
      text-align: center;
    }

    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }

    .submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 36px;
      margin-top: 4px;
      gap: 8px;
      background-color: var(--accent-fill, #3b82f6);
      color: #ffffff;
      border: 1px solid var(--accent-fill-border, transparent);
      border-radius: var(--btn-radius, 4px);
      font-family: inherit;
      font-size: var(--btn-font-size, 14px);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }

    .submit-btn:focus-visible {
      outline: 2px solid var(--accent-color, #005A9E);
      outline-offset: 2px;
    }

    .submit-btn:hover:not(:disabled) {
      background-color: var(--accent-fill-hover, #2563eb);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .submit-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .spinner {
      animation: spin 1s linear infinite;
      display: flex;
      width: 18px;
      height: 18px;
    }

    .spinner svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
  `]}connectedCallback(){super.connectedCallback(),this.notice=aa(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),this.composeStore&&this.composeStore.clearAllComposers()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),this.retryCountdownInterval&&clearInterval(this.retryCountdownInterval)}async firstUpdated(){await this.renderRoot.querySelector(`alps-auth-card`)?.updateComplete,this.renderRoot.querySelector(`#username`)?.focus()}startRetryCountdown(e){this.retryAfter=e,this.isRateLimited=!0,this.retryCountdownInterval&&clearInterval(this.retryCountdownInterval),this.retryCountdownInterval=setInterval(()=>{this.retryAfter--,this.retryAfter<=0&&(this.isRateLimited=!1,this.retryCountdownInterval&&=(clearInterval(this.retryCountdownInterval),void 0))},1e3)}formatRetryTime(e){let t=e>=60;return new Intl.NumberFormat(this.i18nStore?.getIntlLanguage?.(),{style:`unit`,unit:t?`minute`:`second`,unitDisplay:`long`}).format(t?Math.ceil(e/60):e)}async handleSubmit(e){if(e.preventDefault(),this.isSubmitting)return;let t=this.shadowRoot?.querySelector(`form`);if(t&&!t.checkValidity())t.reportValidity();else{this.error=``,this.isSubmitting=!0;try{await new Promise(e=>setTimeout(e,600));let e={username:this.username,password:this.password,"remember-me":this.rememberMe?`on`:``},t=await fetch(`/session`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)}),n={};try{n=await t.json()??{}}catch{n={}}if(t.ok){if(n.requires_2fa){try{sessionStorage.setItem(`pending_2fa_username`,this.username)}catch{}window.location.hash=`/login/webauthn`,this.isSubmitting=!1}else window.dispatchEvent(new CustomEvent(`user-logged-in`,{detail:{username:this.username}})),window.location.hash=`/mailbox/INBOX`}else{if(t.status===429){this.error=n.code===`server_busy`?this.i18nStore?.t(`login.serviceUnavailable`):this.i18nStore?.t(`login.tooManyAttempts`);let e=Number(n.retry_after)||Number(t.headers.get(`Retry-After`))||60;this.startRetryCountdown(e)}else if(n.error===`connection_limit`)this.error=this.i18nStore?.t(`login.tooManyConnections`),this.isRateLimited=!1;else if(t.status>=500){this.error=this.i18nStore?.t(`login.serviceUnavailable`);let e=Number(t.headers.get(`Retry-After`));e>0?this.startRetryCountdown(e):this.isRateLimited=!1}else this.error=this.i18nStore?.t(`login.loginFailed`),this.isRateLimited=!1;this.isSubmitting=!1}}catch{this.error=this.i18nStore?.t(`login.networkError`),this.isSubmitting=!1,this.isRateLimited=!1}}}render(){return b`
      <alps-auth-card
        branded
        subtitle="${this.i18nStore?.t(`login.subtitle`)}">

        ${this.notice&&!this.error?b`
          <div class="notice-container">
            <p class="notice-text">${this.i18nStore?.t(`login.${this.notice}`)}</p>
          </div>
        `:``}

        ${this.error?b`
          <div class="error-container">
            <p class="error-text">
              ${this.error}
              ${this.isRateLimited&&this.retryAfter>0?b`
                <br><strong>${this.i18nStore?.t(`login.pleaseWait`)} ${this.formatRetryTime(this.retryAfter)}</strong>
              `:``}
            </p>
          </div>
        `:``}

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <div class="input-wrapper has-left-icon">
              <span class="icon-left">${P(`at`)}</span>
              <input 
                type="text" 
                dir="ltr"
                id="username" 
                name="username"
                class="native-input"
                placeholder="${this.i18nStore?.t(`login.emailPlaceholder`)}"
                .value=${this.username}
                @input=${e=>this.username=e.target.value}
                required
                autocomplete="username"
              />
            </div>
          </div>
          <div class="form-group">
            <div class="input-wrapper has-left-icon">
              <span class="icon-left">${P(`key`)}</span>
              <input 
                type="password" 
                dir="ltr"
                id="password" 
                name="password"
                class="native-input"
                placeholder="${this.i18nStore?.t(`login.passwordPlaceholder`)}"
                .value=${this.password}
                @input=${e=>this.password=e.target.value}
                required
                autocomplete="current-password"
              />
            </div>
          </div>
          <div class="checkbox-group">
            <label>
              <input 
                type="checkbox" 
                .checked=${this.rememberMe}
                @change=${e=>this.rememberMe=e.target.checked}
              />
              ${this.i18nStore?.t(`login.keepMeSignedIn`)}
            </label>
          </div>
          <button 
            type="submit" 
            class="submit-btn"
            ?disabled=${this.isSubmitting||this.isRateLimited}>
            ${this.isSubmitting?b`<alps-loader style="--loader-size: 16px;"></alps-loader>`:``}
            <span>${this.isRateLimited?`${this.i18nStore?.t(`login.wait`)} ${this.formatRetryTime(this.retryAfter)}`:this.i18nStore?.t(`login.signIn`)}</span>
          </button>
        </form>
      </alps-auth-card>
    `}};N([s({context:A})],ca.prototype,`i18nStore`,void 0),N([d()],ca.prototype,`notice`,void 0),N([d()],ca.prototype,`username`,void 0),N([d()],ca.prototype,`password`,void 0),N([d()],ca.prototype,`rememberMe`,void 0),N([d()],ca.prototype,`error`,void 0),N([d()],ca.prototype,`isSubmitting`,void 0),N([d()],ca.prototype,`retryAfter`,void 0),N([d()],ca.prototype,`isRateLimited`,void 0),N([s({context:ta,subscribe:!0})],ca.prototype,`composeStore`,void 0),ca=N([o(`login-page`)],ca);var la=[`read_only`,`read_write`,`full`],ua=new Set([`invalid_identifier`,`self`,`invalid_level`,`unknown_identifier`,`not_found`,`forbidden`,`refused`,`not_supported`]);async function da(e){if(e.status===401)return`auth`;try{let t=await e.json();if(typeof t?.error==`string`&&ua.has(t.error))return t.error}catch{}return`failed`}var fa=6e5,pa=new class{async classify(e,t){return e.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),`failed`):e.ok?`ok`:e.status===409?`exists`:(E.error(`Failed to ${t}`,e.status),`failed`)}async createMailbox(e){try{let t=new URLSearchParams;t.append(`name`,e);let n=await F(`/mailboxes`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:t.toString()}),r=await this.classify(n,`create mailbox`);return r===`ok`&&z.syncLabels(),r}catch(e){return E.error(`Failed to create mailbox`,e),`failed`}}async renameMailbox(e,t){try{let n=await F(`/mailboxes/${k(e)}/rename`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({new_name:t})}),r=await this.classify(n,`rename mailbox`);return r===`ok`&&(z.mailboxRenamed(e,t),z.syncLabels()),r}catch(e){return E.error(`Failed to rename mailbox`,e),`failed`}}async deleteMailbox(e){try{let t=await F(`/mailboxes/${k(e)}`,{method:`DELETE`}),n=await this.classify(t,`delete mailbox`);return n===`ok`&&(z.mailboxDeleted(e),z.sync()),n===`ok`}catch(e){return E.error(`Failed to delete mailbox`,e),!1}}async emptyMailbox(e){try{let t=await F(`/mailboxes/${k(e)}/empty`,{method:`POST`},fa);if(t.status===401)return{ok:!1,reason:`auth`};if(t.ok){let e;try{let n=await t.json();typeof n?.discarded==`number`&&(e=n.discarded)}catch{}return z.sync(),{ok:!0,discarded:e}}return E.error(`Failed to empty mailbox`,t.status),{ok:!1,reason:t.status===403?`not_discardable`:`failed`}}catch(e){return E.error(`Failed to empty mailbox`,e),e?.name===`AbortError`?(z.sync({refresh:!0}),{ok:!1,reason:`timeout`}):{ok:!1,reason:`failed`}}}async setSubscribed(e,t){let n=t?`subscribe`:`unsubscribe`;try{let t=await F(`/mailboxes/${k(e)}/${n}`,{method:`PUT`});return t.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),{ok:!1,reason:`auth`}):t.ok?(z.syncLabels(),{ok:!0}):(E.error(`Failed to ${n} mailbox`,t.status),{ok:!1,reason:`failed`})}catch(e){return E.error(`Failed to ${n} mailbox`,e),{ok:!1,reason:`failed`}}}async readSharing(e){try{let t=await F(`/mailboxes/${k(e)}/sharing`);if(!t.ok)return E.warn(`Could not read who has access to a folder`,t.status),{ok:!1,reason:await da(t)};let n=await t.json(),r=Array.isArray(n?.entries)?n.entries.filter(e=>typeof e?.identifier==`string`).map(e=>({identifier:e.identifier,rights:typeof e.rights==`string`?e.rights:``,level:la.includes(e.level)?e.level:``})):[];return{ok:!0,rights:typeof n?.rights==`string`?n.rights:``,entries:r}}catch(e){return E.error(`Failed to read who has access to a folder`,e),{ok:!1,reason:`failed`}}}async shareMailbox(e,t,n){return this.changeSharing(e,t,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({level:n})})}async unshareMailbox(e,t){return this.changeSharing(e,t,{method:`DELETE`})}async changeSharing(e,t,n){try{let r=await F(`/mailboxes/${k(e)}/sharing/${k(t)}`,n);return r.ok?{ok:!0}:(E.warn(`Could not change who has access to a folder`,r.status),{ok:!1,reason:await da(r)})}catch(e){return E.error(`Failed to change who has access to a folder`,e),{ok:!1,reason:`failed`}}}},ma=`application/x-alps-messages`;function ha(e){return!!e&&Array.from(e.types??[]).includes(`application/x-alps-messages`)}function ga(e){if(!ha(e))return null;let t;try{t=JSON.parse(e.getData(ma))}catch{return null}let n=t;return!n||!Array.isArray(n.keys)||!n.keys.every(e=>typeof e==`string`)?null:{keys:n.keys,selection:n.selection===!0}}function _a(e){return e.altKey||e.ctrlKey}var va=new TextEncoder;function ya(e){let t=[],n=new Set,r=0;for(let i=e.length-1;i>=0&&t.length<200;i--){let a=e[i];if(typeof a!=`string`||!a||n.has(a))continue;let o=va.encode(a).length;r+o>16384||(n.add(a),r+=o,t.push(a))}return t.reverse()}function ba(e,t){return ya([...e.filter(e=>e!==t),t])}function xa(e,t){return e.filter(e=>e!==t)}function Sa(e,t,n){return e.filter(e=>!D(e,t,n))}function Ca(e,t,n,r){return ya(e.map(e=>D(e,t,r)?n+e.slice(t.length):e))}var wa=e=>e?.Name||e?.Mailbox||``;function Ta(e,t){if(e.size!==0)for(let n of t||[]){let t=wa(n);e.has(t)&&n.Subscribed!==!0&&e.delete(t)}}function Ea(e,t,n){let r=new Set;for(let e of t||[])e?.Subscribed===!0&&r.add(wa(e));return e.filter(e=>n.has(e)||!r.has(e))}var Da=class extends c{constructor(...e){super(...e),this.scrolled=!1}static{this.styles=[j,y`
    :host {
      display: flex;
      align-items: center;
      height: 57px;
      box-sizing: border-box;
      flex-shrink: 0;
      border-bottom: 1px solid var(--border-color);
      transition: box-shadow 0.2s ease;
      position: relative;
      overflow: visible;
    }

    :host([scrolled]) {
      box-shadow: rgba(95, 95, 95, 0.1) 0 4px 4px -2px;
    }
  `]}render(){return b`<slot></slot>`}};N([_({type:Boolean,reflect:!0})],Da.prototype,`scrolled`,void 0),Da=N([o(`alps-toolbar`)],Da);var Oa,ka=y`
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
`,Aa=()=>Object.hasOwn(HTMLElement.prototype,`popover`),ja=class extends c{static{Oa=this}constructor(...e){super(...e),this.align=`end`,this.position=`bottom`,this.triggerOn=`click`,this.openState=!1,this._openAtPointerDown=null,this._handleTriggerPointerDown=()=>{this._openAtPointerDown=this.openState},this._shown=!1,this._handleToggle=e=>{e.newState===`closed`&&(this._shown=!1,this.openState&&(this._closedByPopover=!0,this.close()))},this._returnFocus=null,this._closedByPopover=!1,this._handleOutsidePointer=e=>{this.openState&&!e.composedPath().includes(this)&&this.close()},this._syncExpanded=()=>{for(let e of this._triggerElements())`expanded`in e?e.expanded=this.openState:(e instanceof HTMLButtonElement||e.getAttribute(`role`)===`button`)&&e.setAttribute(`aria-expanded`,String(this.openState))},this._handleKeydown=e=>{if(!this.openState||e.defaultPrevented)return;let t=e.composedPath();if(t.find(e=>e instanceof Oa&&e.openState)!==this)return;let n=t.findIndex(e=>e instanceof HTMLDialogElement&&e.open);n!==-1&&n<t.indexOf(this)||this._handleMenuKey(e,t.includes(this._content))},this._handleWindowKeydown=e=>{this.openState&&!e.defaultPrevented&&vt()===this._content&&(e.composedPath().some(e=>e instanceof Oa&&e.openState)||this._handleMenuKey(e,!1))},this._triggerRect=null,this._frame=0,this._closeTimeout=null,this._directionObserver=new MutationObserver(()=>{this.openState&&this._updatePosition()}),this._handleMouseEnter=()=>{this.triggerOn===`hover`&&(this._closeTimeout&&=(clearTimeout(this._closeTimeout),null),this.open())},this._handleMouseLeave=()=>{this.triggerOn===`hover`&&(this._closeTimeout&&clearTimeout(this._closeTimeout),this._closeTimeout=setTimeout(()=>{this.close(),this._closeTimeout=null},300))},this._handleResize=()=>{this.openState&&this._updatePosition()}}static{this.styles=[j,y`
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

  `]}open(){this.openState=!0,this.dispatchEvent(new CustomEvent(`popup-open`,{bubbles:!0,composed:!0}))}close(){this.openState=!1,this.dispatchEvent(new CustomEvent(`popup-close`,{bubbles:!0,composed:!0}))}toggle(e){if(this.triggerOn===`hover`){e.stopPropagation();return}let t=e instanceof MouseEvent&&e.detail>0?this._openAtPointerDown??this.openState:this.openState;this._openAtPointerDown=null,t?this.openState&&this.close():this.open()}get _content(){return this.shadowRoot?.querySelector(`.popup-content`)??null}_holds(e){for(let t=e;t;t=t.parentNode??(t instanceof ShadowRoot?t.host:null))if(t===this)return!0;return!1}_giveFocusBack(){let e=this._returnFocus,t=this._closedByPopover;if(this._returnFocus=null,this._closedByPopover=!1,!e||t||!e.isConnected)return;let n=this._getActiveElement();(!n||n===document.body||this._holds(n))&&e.focus()}_showContent(e){if(this._returnFocus=this.triggerOn===`hover`?this._triggerElements().find(e=>e instanceof HTMLElement)??null:this._getActiveElement(),Aa())try{e.showPopover({source:this.shadowRoot?.querySelector(`.trigger`)??void 0})}catch{return}else document.addEventListener(`pointerdown`,this._handleOutsidePointer,!0);this._shown=!0,this.triggerOn===`click`&&yt(e)}_hideContent(e){if(xt(e),document.removeEventListener(`pointerdown`,this._handleOutsidePointer,!0),this._shown&&(this._shown=!1,e&&Aa()))try{e.hidePopover()}catch{}}_nestedPopups(){return((this.shadowRoot?.querySelector(`slot:not([name])`))?.assignedElements({flatten:!0})??[]).flatMap(e=>[...e instanceof Oa?[e]:[],...Array.from(e.querySelectorAll(`alps-popup`))])}_triggerElements(){return(this.shadowRoot?.querySelector(`slot[name="trigger"]`))?.assignedElements({flatten:!0})??[]}_getActiveElement(){let e=document.activeElement;for(;e?.shadowRoot&&e.shadowRoot.activeElement;)e=e.shadowRoot.activeElement;return e}_getFocusableElements(){let e=this.shadowRoot?.querySelector(`slot:not([name])`);if(!e)return[];let t=e.assignedElements({flatten:!0}),n=[],r=`button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])`;return t.forEach(e=>{if(e instanceof HTMLElement){e.matches(r)&&n.push(e);let t=Array.from(e.querySelectorAll(r));n.push(...t)}}),n}_handleMenuKey(e,t){if(!lt(e)){if(e.key===`Escape`)e.preventDefault(),this.close();else if(e.key===`ArrowDown`||e.key===`ArrowUp`){if(st(this._getActiveElement()))return;e.preventDefault();let t=this._getFocusableElements();if(t.length===0)return;let n=this._getActiveElement(),r=t.findIndex(e=>e===n);r=e.key===`ArrowDown`?r===-1?0:(r+1)%t.length:r===-1?t.length-1:(r-1+t.length)%t.length,t[r].focus()}else if(t&&(e.key===`Enter`||e.key===` `)){let t=this._getActiveElement();if(e.key===` `?ut(t):st(t))return;t&&typeof t.click==`function`&&(e.preventDefault(),t.click())}}}updated(e){if(super.updated(e),e.has(`openState`)){let t=this._content;if(t?.classList.toggle(`is-open`,this.openState),this.openState)t&&!this._shown&&this._showContent(t),window.addEventListener(`keydown`,this._handleWindowKeydown,!0),this._updatePosition(),this._followTrigger();else if(e.get(`openState`)===!0){window.removeEventListener(`keydown`,this._handleWindowKeydown,!0),this._stopFollowing();for(let e of this._nestedPopups())e.openState&&e.close();this._hideContent(t),this._giveFocusBack();let e=this.shadowRoot?.querySelector(`slot[name="trigger"]`),n=this._getActiveElement();e?.assignedElements({flatten:!0}).some(e=>e===n||e.matches(`:focus-within`))&&n&&!n.matches(`:focus-visible`)&&n.blur()}this._syncExpanded()}}_followTrigger(){if(this._frame||typeof requestAnimationFrame!=`function`)return;let e=()=>{if(this._frame=0,!this.openState)return;let t=this.shadowRoot?.querySelector(`.trigger`)?.getBoundingClientRect(),n=this._triggerRect;t&&n&&(t.top!==n.top||t.left!==n.left||t.width!==n.width||t.height!==n.height)&&this._updatePosition(),this._frame=requestAnimationFrame(e)};this._frame=requestAnimationFrame(e)}_stopFollowing(){this._frame&&cancelAnimationFrame(this._frame),this._frame=0}_updatePosition(){let e=this.shadowRoot?.querySelector(`.trigger`),t=this.shadowRoot?.querySelector(`.popup-content`);if(!e||!t)return;let n=e.getBoundingClientRect();this._triggerRect=n;let r=t.getBoundingClientRect(),i=getComputedStyle(this).direction===`rtl`,a=this.position===`inline-start`?i?`right`:`left`:this.position===`inline-end`?i?`left`:`right`:this.position,o=this.align===`start`?i?`right`:`left`:this.align===`end`?i?`left`:`right`:this.align,s=a,c=o;if(t.style.top=``,t.style.bottom=``,t.style.left=``,t.style.right=``,t.style.removeProperty(`--arrow-right`),t.style.removeProperty(`--arrow-left`),t.style.removeProperty(`--arrow-top`),t.style.removeProperty(`--arrow-bottom`),a===`left`||a===`right`){a===`right`?n.right+6+r.width>window.innerWidth&&n.left-6-r.width>=0&&(s=`left`):n.left-6-r.width<0&&n.right+6+r.width<=window.innerWidth&&(s=`right`),o===`top`?n.top+r.height>window.innerHeight&&n.bottom-r.height>=0&&(c=`bottom`):n.bottom-r.height<0&&n.top+r.height<=window.innerHeight&&(c=`top`),s===`right`?(t.style.left=`${n.right+6}px`,t.style.right=`auto`):(t.style.right=`${window.innerWidth-n.left+6}px`,t.style.left=`auto`);let e=n.top+n.height/2;if(c===`top`){let i=n.top-4;i+r.height>window.innerHeight&&(i=window.innerHeight-r.height-8),i=Math.max(8,i),t.style.top=`${i}px`,t.style.bottom=`auto`;let a=e-i-6;t.style.setProperty(`--arrow-top`,`${Math.max(10,Math.min(r.height-20,a))}px`)}else{let i=window.innerHeight-n.bottom-4;i+r.height>window.innerHeight&&(i=window.innerHeight-r.height-8),i=Math.max(8,i),t.style.bottom=`${i}px`,t.style.top=`auto`;let a=e-(window.innerHeight-i-r.height)-6;t.style.setProperty(`--arrow-top`,`${Math.max(10,Math.min(r.height-20,a))}px`)}}else if(a===`bottom`?n.bottom+8+r.height>window.innerHeight&&n.top-8-r.height>=0&&(s=`top`):n.top-8-r.height<0&&n.bottom+8+r.height<=window.innerHeight&&(s=`bottom`),o===`right`?n.right-r.width<0&&n.left+r.width<=window.innerWidth&&(c=`left`):n.left+r.width>window.innerWidth&&n.right-r.width>=0&&(c=`right`),s===`bottom`?(t.style.top=`${n.bottom+8}px`,t.style.bottom=`auto`):(t.style.bottom=`${window.innerHeight-n.top+8}px`,t.style.top=`auto`),c===`right`){let e=window.innerWidth-n.right;e+r.width>window.innerWidth&&(e=window.innerWidth-r.width-8),e=Math.max(8,e),t.style.right=`${e}px`,t.style.left=`auto`;let i=n.left+n.width/2,a=window.innerWidth-e-i-6;t.style.setProperty(`--arrow-right`,`${Math.max(10,Math.min(r.width-20,a))}px`)}else{let e=n.left;e+r.width>window.innerWidth&&(e=window.innerWidth-r.width-8),e=Math.max(8,e),t.style.left=`${e}px`,t.style.right=`auto`;let i=n.left+n.width/2-e-6;t.style.setProperty(`--arrow-left`,`${Math.max(10,Math.min(r.width-20,i))}px`)}t.classList.remove(`position-top`,`position-bottom`,`position-left`,`position-right`,`align-left`,`align-right`,`align-top`,`align-bottom`),t.classList.add(`position-${s}`,`align-${c}`)}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this._handleResize,{passive:!0}),this._directionObserver.observe(document.documentElement,{attributes:!0,attributeFilter:[`dir`]}),this.addEventListener(`mouseenter`,this._handleMouseEnter),this.addEventListener(`mouseleave`,this._handleMouseLeave),this.addEventListener(`keydown`,this._handleKeydown)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this._handleResize),window.removeEventListener(`keydown`,this._handleWindowKeydown,!0),this._directionObserver.disconnect(),this.removeEventListener(`mouseenter`,this._handleMouseEnter),this.removeEventListener(`mouseleave`,this._handleMouseLeave),this.removeEventListener(`keydown`,this._handleKeydown),this._stopFollowing(),this._closeTimeout&&=(clearTimeout(this._closeTimeout),null),this._hideContent(this._content),this._returnFocus=null,this.openState=!1}render(){return b`
      <div class="trigger" @click=${this.toggle} @pointerdown=${this._handleTriggerPointerDown}>
        <slot name="trigger" @slotchange=${this._syncExpanded}></slot>
      </div>

      <div class="popup-content align-${this.align} position-${this.position}"
        popover=${this.triggerOn===`hover`?`manual`:`auto`}
        @toggle=${this._handleToggle}>
        <slot></slot>
      </div>
    `}};N([_({type:String})],ja.prototype,`align`,void 0),N([_({type:String})],ja.prototype,`position`,void 0),N([_({type:String,reflect:!0})],ja.prototype,`triggerOn`,void 0),N([_({type:Boolean,reflect:!0,attribute:`open`})],ja.prototype,`openState`,void 0),ja=Oa=N([o(`alps-popup`)],ja);var Ma=l(`sidebar-strip`),Na=class extends i{constructor(...e){super(...e),this.strip=!1}createRenderRoot(){return this}update(e){super.update(e),this.follow(this.strip)}};N([s({context:Ma,subscribe:!0}),_({attribute:!1})],Na.prototype,`strip`,void 0);var Pa=class extends Na{follow(e){this.classList.toggle(`collapsed`,e)}};Pa=N([o(`alps-sidebar-frame`)],Pa);var Fa=class extends Na{follow(e){this.toggleAttribute(`strip`,e),this.toggleAttribute(`inert`,e)}};Fa=N([o(`alps-sidebar-content`)],Fa);var Ia=class extends c{constructor(...e){super(...e),this.collapsed=!1,this.icon=`plus`,this.text=``,this.disabled=!1,this.title=``}static{this.styles=[j,y`
    :host {
      display: block;
      width: 100%;
    }

    .create-btn {
      width: 100%;
      height: 36px;
      font-size: 14px;
      overflow: hidden;
      --btn-padding: 8px 16px;
      --btn-gap: 8px;
      transition: all 0.2s ease;
    }

    .create-btn::part(button) {
      width: 100%;
      height: 100%;
    }

    :host([collapsed]) .create-btn {
      --btn-padding: 8px;
      --btn-gap: 0px;
    }

    .create-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: max-width 0.2s ease, opacity 0.2s ease, margin 0.2s ease;
      max-width: 150px;
      opacity: 1;
      display: inline-block;
    }

    :host([collapsed]) .create-text {
      max-width: 0;
      opacity: 0;
      margin-inline-start: 0;
    }
  `]}render(){return b`
      <alps-button 
        variant="primary"
        icon="${this.icon}"
        class="create-btn"
        ?disabled=${this.disabled}
        title="${this.title}"
        @click=${()=>{}}
      >
        <span class="create-text"><slot>${this.text}</slot></span>
      </alps-button>
    `}};N([s({context:Ma,subscribe:!0}),_({type:Boolean,reflect:!0})],Ia.prototype,`collapsed`,void 0),N([_({type:String})],Ia.prototype,`icon`,void 0),N([_({type:String})],Ia.prototype,`text`,void 0),N([_({type:Boolean})],Ia.prototype,`disabled`,void 0),N([_({type:String})],Ia.prototype,`title`,void 0),Ia=N([o(`alps-create-button`)],Ia);var La=y`
  .app-container {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }
  .app-container.collapsed {
    --sidebar-width: 64px;
  }
  alps-sidebar.desktop-sidebar {
    width: var(--sidebar-width, 250px);
    flex-shrink: 0;
    transition: width 0.2s, z-index 0s 0.2s;
    position: relative;
    z-index: 20;
  }
  alps-sidebar.desktop-sidebar[collapsed][peeking] {
    transition: width 0.2s, z-index 0s 0s;
  }
  .app-container.dragging alps-sidebar.desktop-sidebar {
    transition: none;
  }
  .sidebar-wrapper {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: transparent;
  }
  /* The content follows the strip state alps-sidebar provides
     (alps-sidebar-strip.ts): in the strip it stays exactly as it is, dimmed,
     behind the main view and inert. */
  alps-sidebar-content {
    display: block;
    transition: opacity 0.2s ease;
  }
  alps-sidebar-content[strip] {
    opacity: 0.5;
    overflow-y: hidden;
    pointer-events: none;
  }
  .sidebar-header {
    padding: 0 12px;
    gap: 8px;
    background-color: transparent;
    z-index: 10;
  }
  .sidebar-wrapper.collapsed .sidebar-header {
    padding: 0 14px !important;
    justify-content: flex-start;
  }
  /* Docked, the content is as wide as the sidebar, however narrow it is
     dragged: names shorten, and each row's count and menu stay in view at
     its inline end. It used to keep 215px there too, so a sidebar dragged
     narrower cut them off instead.

     In the strip the content keeps at least 215px, so that it is clipped
     rather than reflowed, and slides behind the main view: what the 64px
     strip should show is each row's ICON. Every sidebar sets --strip-slide,
     how far its content moves to bring its icons 8px inside the strip, the
     same place on every page. The default suits rows padded 8px inside 16px
     of content padding (Calendar, Tasks). Mail's rows lead with the expander
     column and slide 38px, Contacts' 14px, Settings' 20px. One slide for all
     of them put mail's icons half out of the strip and everyone else's under
     the main view.

     The slide starts only below 120px of content, narrower than any docked
     sidebar's (a drag below 120px snaps to the strip, and the narrowest
     docked sidebar, SIDEBAR_WIDTH_MIN, keeps 163px inside its border and
     padding, 148px beside a scrollbar that takes room), so a sidebar dragged
     narrow keeps every column in view, the expander carets included. On the
     way into the strip the content moves with the edge until it has slid
     --strip-slide.

     Out of the strip, expanding or opening as the overlay, the 215px stay
     while the sidebar widens (its 0.2s) and go once it has: let go at once,
     the rows reflowed through every width from the strip's up, and each
     count set off from beside its icon. Into the strip they come at once. */
  .sidebar-scroll-content {
    width: 100%;
    min-width: 0;
    margin-inline-start: max(0px - var(--strip-slide, 16px), min(0px, 100% - 120px));
    transition: min-width 0s 0.2s;
  }
  alps-sidebar-content[strip] .sidebar-scroll-content {
    min-width: 215px;
    transition: none;
  }
  /* The sidebar jumps to its width instead of widening: so does the content. */
  @media (prefers-reduced-motion: reduce) {
    .sidebar-scroll-content {
      transition-delay: 0s;
    }
  }
`;function Ra(e){e?.querySelector(`alps-sidebar`)?.closePeek()}var za=class extends c{static{this.styles=[j,y`
    :host {
      display: block;
      position: relative;
      height: 100%;
      z-index: 10;
      transition: z-index 0s 0.2s;
    }

    :host([collapsed][peeking]) {
      z-index: 30 !important;
      transition: z-index 0s 0s;
    }

    :host {
      /* The shadow falls past the sidebar's inline end, and a closed mobile
         sidebar waits beyond its inline start: both mirror in a
         right-to-left interface. */
      --sidebar-edge-offset: 4px;
      --sidebar-closed-offset: -100%;
    }

    :host(:dir(rtl)) {
      --sidebar-edge-offset: -4px;
      --sidebar-closed-offset: 100%;
    }

    .sidebar {
      background-color: var(--bg-secondary, #f3f4f6);
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      position: relative;
      z-index: 10;
      box-sizing: border-box;
      border-inline-end: 1px solid var(--border-color, #e5e7eb);
      box-shadow: rgba(95, 95, 95, 0) var(--sidebar-edge-offset) 0 4px -2px;
      transition: width 0.2s, box-shadow 0.2s, z-index 0s 0.2s;
    }

    .sidebar.dragging {
      transition: none !important;
    }

    :host(:not([collapsed])) .sidebar {
      width: var(--sidebar-width-expanded, 250px);
    }

    :host([collapsed]:not([peeking])) .sidebar {
      border-inline-end: none;
      width: 100%;
      position: absolute;
      top: 0;
      inset-inline-start: 0;
      bottom: 0;
      box-shadow: rgba(95, 95, 95, 0) var(--sidebar-edge-offset) 0 4px -2px;
    }

    :host([collapsed][peeking]) .sidebar {
      width: var(--sidebar-width-expanded, 250px);
      box-shadow: rgba(95, 95, 95, 0.1) var(--sidebar-edge-offset) 0 4px -2px;
      z-index: 30;
      transition: width 0.2s, box-shadow 0.2s, z-index 0s 0s;
      position: absolute;
      top: 0;
      inset-inline-start: 0;
      bottom: 0;
    }

    .sidebar-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    /* Mobile overrides */
    :host(.mobile-sidebar) {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 100;
    }
    
    :host(.mobile-sidebar) .sidebar {
      position: absolute;
      top: 0;
      inset-inline-start: 0;
      bottom: 0;
      width: 280px;
      z-index: 100;
      pointer-events: auto;
      transform: translateX(var(--sidebar-closed-offset));
      transition: transform 0.25s cubic-bezier(0, 0, 0.2, 1);
      box-shadow: rgba(95, 95, 95, 0.1) var(--sidebar-edge-offset) 0 4px -2px;
    }

    :host(.mobile-sidebar.open) .sidebar {
      transform: translateX(0);
    }

    .mobile-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: transparent;
      z-index: 99;
      pointer-events: none;
    }

    :host(.mobile-sidebar.open) .mobile-backdrop {
      pointer-events: auto;
    }

    .sidebar-resizer {
      position: absolute;
      top: 0;
      inset-inline-end: -3px;
      bottom: 0;
      width: 6px;
      cursor: col-resize;
      z-index: 50;
    }
    .sidebar-resizer::after {
      content: '';
      position: absolute;
      background: transparent;
      transition: background 0.2s;
      width: 3px;
      top: 0;
      bottom: 0;
      inset-inline-start: 1px;
    }
    .sidebar-resizer:hover::after, .sidebar-resizer.dragging::after {
      background: var(--accent-color, #005A9E);
    }

    /* Do not show resizer on mobile or when collapsed */
    :host([collapsed]) .sidebar-resizer,
    :host(.mobile-sidebar) .sidebar-resizer {
      display: none;
    }

    .sidebar-footer {
      padding: 0 16px;
      height: 57px;
      box-sizing: border-box;
      flex-shrink: 0;
      border-top: 1px solid var(--border-color, #e5e7eb);
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      background: var(--bg-secondary, #f9fafb);
    }
    .footer-divider {
      width: 1px;
      height: 20px;
      background: var(--border-color, #e5e7eb);
      margin: 0 4px;
      flex-shrink: 0;
    }

    :host([collapsed]:not([peeking])) .footer-divider,
    :host([collapsed]:not([peeking])) ::slotted([slot="footer-actions"]) {
      display: none;
    }

    .mobile-return-btn {
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
      font-family: inherit;
    }
    .mobile-return-btn:hover {
      background: var(--hover-color, #e5e7eb);
    }
    .mobile-return-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
  `]}constructor(){super(),this.isMobile=!1,this.isOpen=!1,this.collapsed=!1,this.peeking=!1,this.strip=!1,this.width=250,this.hideFooterDivider=!1,this.showMobileBack=!1,this.isDragging=!1,this.openTimer=null,this.closeTimer=null,this.stopResize=null,this.pointerInside=!1,this.focusHeld=!1,this.onPointerEnter=()=>{this.pointerInside=!0,this.closeTimer!==null&&(clearTimeout(this.closeTimer),this.closeTimer=null),this.peeking||!this.collapsed||this.isMobile||this.isDragging||(this.openTimer??=setTimeout(()=>{this.openTimer=null,this.peeking=!0},300))},this.onPointerLeave=()=>{this.pointerInside=!1,this.openTimer!==null&&(clearTimeout(this.openTimer),this.openTimer=null),this.peeking&&!this.focusHeld&&(this.closeTimer??=setTimeout(()=>{this.closeTimer=null,this.peeking=!1},300))},this.onFocusIn=e=>{if(!this.collapsed||this.isMobile)return;let t=e.relatedTarget;if(t instanceof Node&&this.contains(t))return;let n=e.composedPath()[0];n instanceof Element&&n.matches(`:focus-visible`)&&(this.clearPeekTimers(),this.focusHeld=!0,this.peeking=!0)},this.onFocusOut=e=>{if(!this.focusHeld)return;let t=e.relatedTarget;(t instanceof Node?this.contains(t):this.focusPlace()!==`outside`)||(this.focusHeld=!1,this.pointerInside||(this.clearPeekTimers(),this.peeking=!1))},this.onKeyDown=e=>{e.key===`Escape`&&!e.defaultPrevented&&this.peeking&&(e.composedPath().some(e=>e instanceof HTMLDialogElement)||(e.preventDefault(),this.shutPeek(!0)))},this.addEventListener(`mouseenter`,this.onPointerEnter),this.addEventListener(`mouseleave`,this.onPointerLeave),this.addEventListener(`focusin`,this.onFocusIn),this.addEventListener(`focusout`,this.onFocusOut),this.addEventListener(`keydown`,this.onKeyDown)}disconnectedCallback(){super.disconnectedCallback(),this.clearPeekTimers(),this.stopResize?.()}closePeek(){this.shutPeek(this.focusHeld)}shutPeek(e){this.clearPeekTimers(),e&&this.peeking&&this.focusPlace()===`hidden`&&this.renderRoot.querySelector(`.collapse-btn`)?.shadowRoot?.querySelector(`button`)?.focus(),this.focusHeld=!1,this.peeking=!1}willUpdate(e){(e.has(`collapsed`)||e.has(`isMobile`))&&(this.clearPeekTimers(),this.focusHeld=!1,this.peeking=!1),this.strip=this.collapsed&&!this.peeking&&!this.isMobile}focusPlace(){let e=!1;for(let t=ct();t;t=t.parentNode??(t instanceof ShadowRoot?t.host:null)){if(t===this)return e?`hidden`:`kept`;(t instanceof Fa||t instanceof Element&&t.parentNode===this&&t.slot===`footer-actions`)&&(e=!0)}return`outside`}clearPeekTimers(){this.openTimer!==null&&clearTimeout(this.openTimer),this.closeTimer!==null&&clearTimeout(this.closeTimer),this.openTimer=null,this.closeTimer=null}startResize(e){if(this.isMobile||this.collapsed)return;e.preventDefault(),this.stopResize?.(),this.isDragging=!0,this.dispatchEvent(new CustomEvent(`drag-start`));let t=e.clientX,n=this.width,r=getComputedStyle(this).direction===`rtl`?-1:1,i=e=>{let i=(e.clientX-t)*r,a=n+i;this.dispatchEvent(new CustomEvent(`sidebar-resize`,{detail:{newWidth:a,clientX:e.clientX}}))},a=()=>{this.stopResize=null,this.isDragging=!1,window.removeEventListener(`mousemove`,i),window.removeEventListener(`mouseup`,a),this.dispatchEvent(new CustomEvent(`drag-end`))};this.stopResize=a,window.addEventListener(`mousemove`,i),window.addEventListener(`mouseup`,a)}render(){return b`
      <div class="mobile-backdrop" @click=${()=>this.dispatchEvent(new CustomEvent(`close-sidebar`))}></div>
      <aside class="sidebar ${this.isDragging?`dragging`:``}" part="sidebar" style="--sidebar-width-expanded: ${this.width}px">
        <div class="sidebar-content">
          <slot></slot>
        </div>
        <div class="sidebar-footer">
          ${this.isMobile&&this.showMobileBack?b`
            <button class="mobile-return-btn" @click=${()=>window.location.hash=``}>
              ${P(`arrowLeft`)} <span class="return-text">${this.i18nStore?.t(`messageReader.back`)||`Back`}</span>
            </button>
          `:this.isMobile?``:b`
            <alps-icon-btn 
              class="collapse-btn"
              icon="sidebar"
              title=${this.collapsed?this.i18nStore?.t(`folderList.expandSidebar`):this.i18nStore?.t(`folderList.collapseSidebar`)}
              @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-collapse`))}
            ></alps-icon-btn>
          `}
          ${!this.hideFooterDivider&&(!this.isMobile||this.showMobileBack)?b`<div class="footer-divider"></div>`:``}
          <div style="display: flex; flex: 1; justify-content: flex-start;">
            <slot name="footer-actions"></slot>
          </div>
        </div>
      </aside>
      <div class="sidebar-resizer ${this.isDragging?`dragging`:``}" @mousedown=${this.startResize}></div>
    `}};N([s({context:A})],za.prototype,`i18nStore`,void 0),N([_({type:Boolean})],za.prototype,`isMobile`,void 0),N([_({type:Boolean})],za.prototype,`isOpen`,void 0),N([_({type:Boolean,reflect:!0})],za.prototype,`collapsed`,void 0),N([_({type:Boolean,reflect:!0})],za.prototype,`peeking`,void 0),N([m({context:Ma})],za.prototype,`strip`,void 0),N([_({type:Number})],za.prototype,`width`,void 0),N([_({type:Boolean})],za.prototype,`hideFooterDivider`,void 0),N([_({type:Boolean})],za.prototype,`showMobileBack`,void 0),N([d()],za.prototype,`isDragging`,void 0),za=N([o(`alps-sidebar`)],za);var Ba=class extends c{constructor(...e){super(...e),this.heading=``}createRenderRoot(){return this}render(){return b`<h3 class="section-heading">${this.heading}</h3>`}};N([_({type:String})],Ba.prototype,`heading`,void 0),Ba=N([o(`alps-sidebar-heading`)],Ba);var Va=y`
  alps-sidebar-heading {
    display: block;
  }
  /* 32px, the text centred, and 8px in, as the rows below pad theirs. */
  .section-heading {
    display: flex;
    align-items: center;
    min-height: 32px;
    margin: 0;
    padding: 0 8px;
    font-family: var(--font-label);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted, #6b7280);
  }
`,U=class extends c{constructor(...e){super(...e),this.mailbox=``,this.folderName=``,this.entries=[],this.loading=!0,this.listFailed=!1,this.address=``,this.level=`read_only`,this.busy=!1,this.changing=null,this.confirmingRevoke=null,this.error=null}static{this.styles=[j,y`
    .intro {
      margin: 0 0 16px;
      color: var(--text-muted, #6b7280);
      font-size: 13px;
      line-height: 1.5;
    }
    .add {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: flex-end;
    }
    .add .address {
      flex: 1 1 200px;
      min-width: 0;
    }
    .add .level {
      flex: 0 1 190px;
      min-width: 0;
    }
    .field-label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary, #111827);
    }
    .error {
      margin: 10px 0 0;
      color: var(--error, #ef4444);
      font-size: 13px;
    }
    .access {
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px solid var(--border-color, #e5e7eb);
    }
    .access h4 {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted, #6b7280);
    }
    .access ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .share-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 40px;
    }
    .share-who {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      color: var(--text-primary, #111827);
    }
    .share-row alps-select {
      flex: 0 1 190px;
      min-width: 0;
    }
    .note {
      color: var(--text-muted, #6b7280);
      font-size: 13px;
      padding: 4px 0;
    }
  `]}t(e,t){return this.i18nStore?.t(e,t)??e}connectedCallback(){super.connectedCallback(),this.load()}firstUpdated(){setTimeout(()=>this.addressInput?.focus(),50)}async load(){let e=await pa.readSharing(this.mailbox);this.loading=!1,e.ok?(this.entries=e.entries,this.listFailed=!1):(this.listFailed=!0,e.reason!==`auth`&&e.reason!==`failed`&&(this.error=this.describe(e.reason)))}levels(){return la.map(e=>({value:e,label:this.levelLabel(e)}))}levelLabel(e){switch(e){case`read_only`:return this.t(`folderShare.levelRead`);case`read_write`:return this.t(`folderShare.levelOrganise`);case`full`:return this.t(`folderShare.levelFull`);default:return this.t(`folderShare.levelCustom`)}}describe(e){switch(e){case`invalid_identifier`:return this.t(`folderShare.errorInvalidAddress`);case`self`:return this.t(`folderShare.errorSelf`);case`unknown_identifier`:return this.t(`folderShare.errorUnknown`);case`not_found`:return this.t(`folderShare.errorGone`);case`forbidden`:return this.t(`folderShare.errorForbidden`);case`refused`:case`invalid_level`:return this.t(`folderShare.errorRefused`);default:return this.t(`folderShare.errorGeneric`)}}close(){this.pending||this.dispatchEvent(new CustomEvent(`close`,{bubbles:!0,composed:!0}))}get pending(){return this.busy||this.changing!==null}async grant(){let e=this.address.trim();if(!e||this.pending)return;if(!/^[^\s@,;<>]+@[^\s@,;<>]+$/.test(e)){this.error=this.t(`folderShare.errorInvalidAddress`);return}let t=this.entries.find(t=>t.identifier.toLowerCase()===e.toLowerCase())?.identifier??e,n=this.level;this.busy=!0,this.error=null;try{let e=await pa.shareMailbox(this.mailbox,t,n);e.ok?this.address=``:e.reason!==`auth`&&(this.error=this.describe(e.reason)),await this.load()}finally{this.busy=!1}}async changeLevel(e,t){if(!(t===e.level||this.pending)){this.changing=e.identifier,this.error=null;try{let n=await pa.shareMailbox(this.mailbox,e.identifier,t);!n.ok&&n.reason!==`auth`&&(this.error=this.describe(n.reason)),await this.load()}finally{this.changing=null}}}async revoke(e){if(!this.pending){this.changing=e.identifier,this.error=null;try{let t=await pa.unshareMailbox(this.mailbox,e.identifier);!t.ok&&t.reason!==`auth`&&(this.error=this.describe(t.reason)),await this.load()}finally{this.changing=null,await this.updateComplete,this.addressInput?.focus()}}}renderEntries(){return this.loading?b`<div class="note" role="status">${this.t(`folderShare.loading`)}</div>`:this.listFailed?b`<div class="note error" role="alert">${this.t(`folderShare.listFailed`)}</div>`:this.entries.length===0?b`<div class="note">${this.t(`folderShare.noneYet`)}</div>`:b`
      <ul>
        ${this.entries.map(e=>{let t=e.level===``?[{value:``,label:this.levelLabel(``),disabled:!0},...this.levels()]:this.levels();return b`
            <li class="share-row">
              <div class="share-who" title=${e.identifier}><bdi dir="ltr">${e.identifier}</bdi></div>
              <alps-select
                label=${this.t(`folderShare.levelFor`,{who:e.identifier})}
                .value=${r(e.level)}
                .options=${t}
                ?disabled=${this.pending}
                @change=${t=>this.changeLevel(e,t.target.value)}
              ></alps-select>
              <alps-icon-btn
                class="revoke"
                icon="trash"
                title=${this.t(`folderShare.revokeFor`,{who:e.identifier})}
                ?disabled=${this.pending}
                @click=${()=>{this.confirmingRevoke=e}}
              ></alps-icon-btn>
            </li>
          `})}
      </ul>
    `}render(){return b`
      <ui-modal
        .heading=${this.t(`folderShare.title`,{folder:this.folderName||this.mailbox})}
        .dismissible=${!this.pending}
        width="520px"
        @cancel=${()=>this.close()}
      >
        <p class="intro">${this.t(`folderShare.intro`)}</p>
        <div class="add">
          <div class="address">
            <label class="field-label" for="share-address">${this.t(`folderShare.address`)}</label>
            <alps-input
              id="share-address"
              type="email"
              input-dir="ltr"
              autocomplete="email"
              label=${this.t(`folderShare.address`)}
              .value=${this.address}
              @input=${e=>{this.address=e.target.value,this.error=null}}
              @keydown=${e=>{e.key!==`Enter`||lt(e)||(e.preventDefault(),this.grant())}}
            ></alps-input>
          </div>
          <div class="level">
            <label class="field-label" for="share-level">${this.t(`folderShare.level`)}</label>
            <alps-select
              id="share-level"
              label=${this.t(`folderShare.level`)}
              .value=${this.level}
              .options=${this.levels()}
              @change=${e=>{this.level=e.target.value}}
            ></alps-select>
          </div>
          <alps-button
            class="grant"
            variant="primary"
            ?disabled=${this.pending||this.address.trim()===``}
            ?spinning=${this.busy}
            @click=${()=>this.grant()}
          >${this.t(`folderShare.grant`)}</alps-button>
        </div>
        ${this.error?b`<p class="error" role="alert">${this.error}</p>`:n}

        <section class="access" aria-labelledby="access-heading">
          <h4 id="access-heading">${this.t(`folderShare.currentAccess`)}</h4>
          ${this.renderEntries()}
        </section>

        <alps-button slot="actions" variant="normal" ?disabled=${this.pending} @click=${()=>this.close()}>${this.t(`folderShare.done`)}</alps-button>
      </ui-modal>

      ${this.confirmingRevoke?b`
        <ui-confirm
          heading=${this.t(`folderShare.revokeTitle`)}
          message=${this.t(`folderShare.revokeMessage`,{who:this.confirmingRevoke.identifier,folder:this.folderName||this.mailbox})}
          confirmText=${this.t(`folderShare.revoke`)}
          .isDanger=${!0}
          @confirm=${()=>{let e=this.confirmingRevoke;this.confirmingRevoke=null,this.revoke(e)}}
          @cancel=${()=>{this.confirmingRevoke=null}}
        ></ui-confirm>
      `:n}
    `}};N([s({context:A,subscribe:!0}),_({attribute:!1})],U.prototype,`i18nStore`,void 0),N([_({type:String})],U.prototype,`mailbox`,void 0),N([_({type:String})],U.prototype,`folderName`,void 0),N([d()],U.prototype,`entries`,void 0),N([d()],U.prototype,`loading`,void 0),N([d()],U.prototype,`listFailed`,void 0),N([d()],U.prototype,`address`,void 0),N([d()],U.prototype,`level`,void 0),N([d()],U.prototype,`busy`,void 0),N([d()],U.prototype,`changing`,void 0),N([d()],U.prototype,`confirmingRevoke`,void 0),N([d()],U.prototype,`error`,void 0),N([a(`alps-input`)],U.prototype,`addressInput`,void 0),U=N([o(`alps-folder-share-dialog`)],U);var W=class extends c{constructor(...e){super(...e),this.mailboxes=[],this.currentMailbox=``,this.expandedFolders=new Set,this.layoutMode=`vertical`,this.syncing=!1,this.strip=!1,this.isScrolled=!1,this.scrolledTo=0,this.showCreatePrompt=!1,this.promptBusy=!1,this.showRenamePrompt=!1,this.mailboxToRename=``,this.showDeleteConfirm=!1,this.showMoveToTrashConfirm=!1,this.mailboxToDelete=``,this.parentForNewFolder=``,this.folderToShare=null,this.activeKebabMenu=null,this.dropTarget=null,this.dropCopy=!1,this.stopDropWatch=null,this.showUnsubscribed=!1,this.unconfirmedUnsubscribes=new Set,this.primaryFullNames=new Set,this._handleStoreChange=()=>{this.requestUpdate()},this.handleScroll=e=>{let t=e.target;this.scrolledTo=t.scrollTop,this.isScrolled=t.scrollTop>0}}willUpdate(e){super.willUpdate(e)}updated(e){super.updated(e),this.settleUnsubscribed()}get unsubscribedHere(){return this.settingsStore?.getState()?.unsubscribedFolders??[]}saveUnsubscribedHere(e){let t=this.unsubscribedHere;e.length===t.length&&e.every((e,n)=>e===t[n])||this.settingsStore?.updateSettings({unsubscribedFolders:e})}settleUnsubscribed(){this.settingsStore?.recordRead&&this.mailboxes.length!==0&&(this.unsubscribedHere.length!==0||this.unconfirmedUnsubscribes.size!==0)&&(Ta(this.unconfirmedUnsubscribes,this.mailboxes),this.saveUnsubscribedHere(Ea(this.unsubscribedHere,this.mailboxes,this.unconfirmedUnsubscribes)))}subscriptionChanged(e,t){t?(this.unconfirmedUnsubscribes.delete(e),this.saveUnsubscribedHere(xa(this.unsubscribedHere,e))):(this.unconfirmedUnsubscribes.add(e),this.saveUnsubscribedHere(ba(this.unsubscribedHere,e)))}renamedHere(e,t,n){for(let r of[...this.unconfirmedUnsubscribes])D(r,e,n)&&(this.unconfirmedUnsubscribes.delete(r),this.unconfirmedUnsubscribes.add(t+r.slice(e.length)));this.saveUnsubscribedHere(Ca(this.unsubscribedHere,e,t,n))}goneHere(e,t){for(let n of[...this.unconfirmedUnsubscribes])D(n,e,t)&&this.unconfirmedUnsubscribes.delete(n);this.saveUnsubscribedHere(Sa(this.unsubscribedHere,e,t))}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{if(!this.isConnected)return;this.composeStore&&this.composeStore.addEventListener(`change`,this._handleStoreChange),this.i18nStore&&this.i18nStore.addEventListener(`change`,this._handleStoreChange),this.settingsStore&&this.settingsStore.addEventListener(`change`,this._handleStoreChange);let e=this.renderRoot.querySelector(`.sidebar-content`);e&&this.scrolledTo>0&&(e.scrollTop=this.scrolledTo)})}disconnectedCallback(){super.disconnectedCallback(),this.composeStore&&this.composeStore.removeEventListener(`change`,this._handleStoreChange),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange),this.clearDropTarget()}static{this.styles=[j,ka,La,Va,y`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
      box-sizing: border-box;
      /* The collapsed strip's slide (sidebarLayoutStyles): a folder's icon
         sits 46px in, after the content's 8px padding, the row's 4px, the
         30px expander and the 4px gap, so it slides 38px to stand 8px inside
         the strip. */
      --strip-slide: 38px;
    }

    .sidebar-wrapper {
      background-color: var(--bg-secondary);
    }

    .sidebar-header {
      background-color: var(--bg-secondary);
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 8px;
    }

    .sidebar-wrapper.collapsed .folder-item {
      border-radius: 0;
      border-start-start-radius: 6px;
      border-end-start-radius: 6px;
    }

    .folder-item {
      display: flex;
      align-items: center;
      position: relative;
      height: 36px;
      padding: 0 4px;
      box-sizing: border-box;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-color);
      margin-bottom: 2px;
      user-select: none;
      gap: 4px;
    }

    /* The fade belongs to the hover only. On the base rule it also eased the
       row that lost .active down over 150ms while the new one came up, so a
       folder switch showed two rows lit at once, the old one reading as still
       selected. A transition is taken from the state being entered, so the
       base and .active have none, and only entering :hover animates. */
    @media (hover: hover) {
      .folder-item:hover {
        background: var(--hover-color);
        transition: background 0.15s;
      }

      .folder-item.active:hover {
        transition: none;
      }
    }

    .folder-item.active {
      background: var(--bg-selected);
      color: var(--accent-hover);
      font-weight: 600;
    }

    /* The folder a drop would file into. Dashed for a move, and in another
       colour for a copy, so the modifier can be seen to have been taken. */
    .folder-item.drop-target {
      background: var(--hover-color);
      outline: 2px dashed var(--accent-color);
      outline-offset: -2px;
    }

    .folder-item.drop-target.drop-copy {
      outline-color: var(--success);
    }

    /* The More row: a button, so the keyboard reaches it, drawn as a row. */
    button.more-row {
      width: 100%;
      border: none;
      background: none;
      font: inherit;
      color: var(--text-muted);
      text-align: start;
    }

    .more-caret {
      display: flex;
      padding: 2px;
    }

    .folder-item .icon {
      color: var(--text-muted);
    }
    
    .folder-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .folder-badge {
      background: rgba(0,0,0,0.08);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .folder-item.active .folder-badge {
      background: rgba(255,255,255,0.2);
    }

    .folder-children {
      margin-inline-start: 12px;
    }

    .folder-actions {
      display: none;
      align-items: center;
      padding-inline-start: 8px;
      margin-inline-start: auto;      
    }

    .folder-item.active .folder-actions {
      display: none; /* Only show on hover for desktop */
    }

    @media (hover: hover) {
      .folder-item:hover .folder-actions {
        display: flex;
      }
      .folder-item.has-actions:hover .folder-badge {
        display: none;
      }
    }

    .folder-actions:focus-within,
    .folder-actions.popup-open {
      display: flex;
    }

    /* The lock-up guard, keyed on the menu's own state. A click-triggered
       alps-popup opens with dialog.showModal(), which makes the whole document
       inert until it closes. If the container of that still-open dialog is then
       display: none, the user gets an INVISIBLE modal: nothing on screen, every
       click dead, only Escape gets out. Two routes reached it:

       1. Specificity. .folder-item.active .folder-actions is (0,3,0) and
          .folder-actions.popup-open is (0,2,0), so on the SELECTED folder the
          open rule lost. Hover held the container open until the modal opened,
          but hover does not reach a modal dialog's ancestors.
       2. A desynced marker. .popup-open mirrors activeKebabMenu, and the nested
          Order submenu's popup-close bubbled (composed) to the outer kebab's
          handler and cleared it while the outer menu was still open.

       :has() reads the popup's reflected open attribute, which cannot desync,
       and (0,3,1) outranks every display: none above. */
    .folder-item .folder-actions:has(alps-popup[open]) {
      display: flex;
    }

    .folder-actions:focus-within ~ .folder-badge,
    .folder-actions.popup-open ~ .folder-badge {
      display: none;
    }

    /* The menu is shown while the keyboard is in its row, so that Tab
       reaches it from the folder's name: a button inside display: none is no
       Tab stop, and so it could never take the focus that shows it. Not
       while a click has put the focus on the name, or on the expander, whose
       button a click focuses too: a click leaves the row as it was. Keyed on
       :focus-within, which holds while the focus moves from the name to the
       menu; keyed on the name's :focus-visible alone, the menu was hidden
       again before Tab reached it. */
    .folder-item:focus-within:not(:has(.folder-name:focus:not(:focus-visible), .folder-toggle-btn:focus)) .folder-actions {
      display: flex;
    }

    .folder-item.has-actions:focus-within:not(:has(.folder-name:focus:not(:focus-visible), .folder-toggle-btn:focus)) .folder-badge {
      display: none;
    }

    @media (max-width: 768px) {
      .folder-item.active .folder-actions {
        display: flex;
        position: static;
        transform: none;
        background: transparent;
      }
      .folder-item.active .folder-badge {
        display: block; /* keep badge visible alongside actions on mobile */
      }
    }

    .folder-separator {
      height: 1px;
      background: var(--border-color);
      margin: 8px 12px;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      border-radius: 4px;
    }
    
    .icon-btn:hover {
      background: var(--hover-color);
      color: var(--text-color);
    }

    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .folder-icon {
      margin-inline-end: 10px;
      font-size: 16px;
      display: flex;
      align-items: center;
    }

    /* Submenu trigger styling inside popup trigger slot */
    .dropdown-item.submenu-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 8px 16px;
      box-sizing: border-box;
    }
    .dropdown-item.submenu-trigger .trigger-label {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    .dropdown-item.submenu-trigger .caret-icon {
      margin-inline-start: auto;
      color: var(--text-muted, #6b7280);
      display: flex;
      align-items: center;
    }
    .dropdown-item.submenu-trigger .caret-icon svg {
      width: 12px;
      height: 12px;
    }
  `]}toggleFolder(e,t){e&&e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-folder`,{detail:{folderName:t}}))}selectMailbox(e){this.dispatchEvent(new CustomEvent(`select-mailbox`,{detail:{name:e}}))}triggerCreateFolder(){this.parentForNewFolder=``,this.showCreatePrompt=!0}async handleCreateSubmit(e){let t=e.detail.name;this.promptBusy=!0;try{if(t){if(this.parentForNewFolder){let e=this.mailboxes.find(e=>(e.Name||e.Mailbox)===this.parentForNewFolder),n=O(e)||`.`;t=`${this.parentForNewFolder}${n}${t}`,this.dispatchEvent(new CustomEvent(`expand-folder`,{detail:{folderName:this.parentForNewFolder}}))}let e=await pa.createMailbox(t);e===`ok`?this.saveUnsubscribedHere(xa(this.unsubscribedHere,t)):e===`exists`?this.toast(this.i18nStore?.t(`toast.folderExists`),`A folder with that name already exists`,{type:`error`}):e===`failed`&&this.toast(this.i18nStore?.t(`toast.folderCreateFailed`),`Could not create the folder`,{type:`error`})}}finally{this.promptBusy=!1,this.showCreatePrompt=!1,this.parentForNewFolder=``}}toast(e,t,n={}){this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:e||t,duration:4e3,...n},bubbles:!0,composed:!0}))}async handleRenameSubmit(e){let t=e.detail.name;if(t&&this.mailboxToRename){let e=this.mailboxToRename,n=O(this.mailboxes.find(t=>(t.Name||t.Mailbox)===e));this.showRenamePrompt=!1,this.mailboxToRename=``;let r=await pa.renameMailbox(e,t);r===`exists`?this.toast(this.i18nStore?.t(`toast.folderExists`),`A folder with that name already exists`,{type:`error`}):r===`failed`?this.toast(this.i18nStore?.t(`toast.folderRenameFailed`),`Could not rename the folder`,{type:`error`}):(this.renamedHere(e,t,n),D(this.currentMailbox,e)&&this.selectMailbox(t+this.currentMailbox.slice(e.length)),this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderRenamed`),actionLabel:this.i18nStore?.t(`toast.undo`),actionFn:async()=>{await pa.renameMailbox(t,e)===`ok`?(this.renamedHere(t,e,n),D(this.currentMailbox,t)&&this.selectMailbox(e+this.currentMailbox.slice(t.length))):this.toast(this.i18nStore?.t(`toast.folderUndoFailed`),`Could not undo that`,{type:`error`})},duration:5e3},bubbles:!0,composed:!0})))}else this.showRenamePrompt=!1,this.mailboxToRename=``}async handleDeleteConfirm(){if(this.mailboxToDelete){let e=this.mailboxToDelete,t=O(this.mailboxes.find(t=>(t.Name||t.Mailbox)===e));await pa.deleteMailbox(e)?(this.goneHere(e,t),D(this.currentMailbox,this.mailboxToDelete)&&this.selectMailbox(w),this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderPermanentlyDeleted`),duration:3e3},bubbles:!0,composed:!0}))):this.toast(this.i18nStore?.t(`toast.folderDeleteFailed`),`Could not delete the folder`,{type:`error`})}this.showDeleteConfirm=!1,this.mailboxToDelete=``}async handleMoveToTrashConfirm(){if(this.mailboxToDelete){let e=this.mailboxes.find(e=>(e.Name||e.Mailbox)===this.mailboxToDelete),t=oe(this.mailboxToDelete,O(e,`.`)),n=t[t.length-1],r=O(e,`.`)||`.`,i=T(`trash`,this.mailboxes,`Trash`),a=`${i}${r}${n}`,o=1;for(;this.mailboxes.some(e=>(e.Name||e.Mailbox)===a);)a=`${i}${r}${n} (${o})`,o++;let s=a;if(await pa.renameMailbox(this.mailboxToDelete,s)!==`ok`)this.toast(this.i18nStore?.t(`toast.folderRenameFailed`),`Could not rename the folder`,{type:`error`});else{this.goneHere(this.mailboxToDelete,r),D(this.currentMailbox,this.mailboxToDelete,r)&&this.selectMailbox(w);let e=this.mailboxToDelete;this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderMovedToTrash`),actionLabel:this.i18nStore?.t(`toast.undo`),actionFn:async()=>{await pa.renameMailbox(s,e)!==`ok`&&this.toast(this.i18nStore?.t(`toast.folderUndoFailed`),`Could not undo that`,{type:`error`})},duration:5e3},bubbles:!0,composed:!0}))}}this.showMoveToTrashConfirm=!1,this.mailboxToDelete=``}moveFolder(e,t){console.log(`[moveFolder] Start:`,{folderName:e,direction:t});let n=this.mailboxes.find(t=>(t.Name||t.Mailbox)===e),r=O(n,`.`),i=oe(e,r),a=i.slice(0,-1).join(r),o=De(n)!==null,s=this.mailboxes.filter(e=>De(e)!==null===o).map(e=>e.Name||e.Mailbox||``).filter(e=>{if(this.primaryFullNames.has(e))return!1;let t=oe(e,r);return t.slice(0,-1).join(r)===a&&t.length===i.length});console.log(`[moveFolder] Sibling custom folders found:`,s);let c=[...this.settingsStore?.getState()?.customMailboxOrder||[]];s.sort((e,t)=>{let n=c.indexOf(e),r=c.indexOf(t);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.localeCompare(t):1:-1}),console.log(`[moveFolder] Sorted siblings:`,s);let l=s.indexOf(e);if(l===-1){console.error(`[moveFolder] Folder not found in siblings!`);return}let u=l;switch(t){case`top`:u=0;break;case`up`:u=Math.max(0,l-1);break;case`down`:u=Math.min(s.length-1,l+1);break;case`bottom`:u=s.length-1}if(console.log(`[moveFolder] Shifting indexes:`,{currentIndex:l,newIndex:u}),u===l){console.log(`[moveFolder] No index change needed.`);return}s.splice(l,1),s.splice(u,0,e),console.log(`[moveFolder] New siblings order:`,s);let d=c.filter(e=>!s.includes(e));d.push(...s),console.log(`[moveFolder] Final updated customMailboxOrder settings state:`,d),this.settingsStore?.updateSettings({customMailboxOrder:d})}takesDrop(e,t){return!this.strip&&ha(e.dataTransfer)&&ve(t,this.mailboxes,this.currentMailbox)}handleDragOver(e,t,n){if(!this.takesDrop(e,n)){this.dropTarget===t&&this.clearDropTarget();return}e.preventDefault();let r=_a(e);e.dataTransfer.dropEffect=r?`copy`:`move`,this.dropTarget!==t&&(this.dropTarget=t),this.dropCopy!==r&&(this.dropCopy=r),this.watchDragEnd()}handleDragLeave(e,t){let n=e.currentTarget,r=e.relatedTarget;n&&r&&n.contains(r)||this.dropTarget===t&&this.clearDropTarget()}handleDrop(e,t,n){if(!this.takesDrop(e,n))return;e.preventDefault();let r=_a(e),i=ga(e.dataTransfer);this.clearDropTarget(),i&&i.keys.length!==0&&this.dispatchEvent(new CustomEvent(`drop-messages`,{detail:{folder:t,copy:r,keys:i.keys,selection:i.selection},bubbles:!0,composed:!0}))}watchDragEnd(){if(this.stopDropWatch)return;let e=()=>this.clearDropTarget(),t=t=>{t.key===`Escape`&&e()};window.addEventListener(`dragend`,e,!0),window.addEventListener(`drop`,e,!0),window.addEventListener(`keydown`,t,!0),this.stopDropWatch=()=>{window.removeEventListener(`dragend`,e,!0),window.removeEventListener(`drop`,e,!0),window.removeEventListener(`keydown`,t,!0)}}clearDropTarget(){this.stopDropWatch?.(),this.stopDropWatch=null,this.dropTarget=null,this.dropCopy=!1}render(){let e=[{role:`inbox`,names:[w],display:{icon:`tray`,label:this.i18nStore?.t(`folderList.inbox`)}},{role:`drafts`,names:[ce],display:{icon:`fileText`,label:this.i18nStore?.t(`folderList.drafts`)}},{role:`sent`,names:[ae],display:{icon:`paperPlaneTilt`,label:this.i18nStore?.t(`folderList.sent`)}},{role:`archive`,names:[S,Te],display:{icon:`archiveBox`,label:this.i18nStore?.t(`folderList.archive`)}},{role:`junk`,names:[C,ye],display:{icon:`warningDiamond`,label:this.i18nStore?.t(`folderList.junk`)}},{role:`trash`,names:[x],display:{icon:`trash`,label:this.i18nStore?.t(`folderList.trash`)}}],t={[w]:{icon:`tray`,label:this.i18nStore?.t(`folderList.inbox`)},[ce]:{icon:`fileText`,label:this.i18nStore?.t(`folderList.drafts`)},[ae]:{icon:`paperPlaneTilt`,label:this.i18nStore?.t(`folderList.sent`)},[S]:{icon:`archiveBox`,label:this.i18nStore?.t(`folderList.archive`)},[Te]:{icon:`archiveBox`,label:this.i18nStore?.t(`folderList.archive`)},[ye]:{icon:`warningDiamond`,label:this.i18nStore?.t(`folderList.spam`)},[C]:{icon:`warningDiamond`,label:this.i18nStore?.t(`folderList.junk`)},[x]:{icon:`trash`,label:this.i18nStore?.t(`folderList.trash`)}},r=()=>Object.create(null),i=(e,t)=>{let n=r();return e.forEach(e=>{let i=e.Name||e.Mailbox||``,a=O(e,`.`),o=t?le(e):i;if(o===``)return;let s=oe(o,a),c=n,l=t?i.slice(0,i.length-o.length):``;for(let n=0;n<s.length;n++){let i=s[n];l=n===0?l+i:l+a+i;let o=t?l:i;c[o]||(c[o]={name:i,fullName:l,children:r()}),n===s.length-1&&(c[o].mb=e),c=c[o].children}}),n},a=i(this.mailboxes.filter(e=>De(e)===null),!1),o=i(this.mailboxes.filter(e=>De(e)!==null),!0),s=ie(this.mailboxes),c=new Map;e.forEach((e,t)=>{let n=te(e.role,this.mailboxes);n!==null&&c.set(n,t)});let l=new Map,u=[];Object.values(a).forEach(e=>{let t=e.mb?c.get(e.fullName):void 0;t===void 0?u.push(e):l.set(t,e)});let d=(n,r)=>e[r].names.includes(n.name)&&t[n.name]||e[r].display,f=[];for(let t=0;t<e.length;t++){let e=l.get(t);e&&(e.primary=d(e,t),f.push(e))}this.primaryFullNames=new Set(f.map(e=>e.fullName));let p=new Map([...c].filter(([,e])=>!l.has(e))),m=this.settingsStore?.getState()?.customMailboxOrder||[],h=(e,t)=>{let n=m.indexOf(e.fullName),r=m.indexOf(t.fullName);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.name.localeCompare(t.name):1:-1};u.sort(h);let g=Object.values(o).sort(h),_=new Set(this.unsubscribedHere),v=e=>ee(e.mb,s)!==null||Object.values(e.children).some(v),y=de(this.mailboxes)?u.filter(e=>!!e.mb&&e.mb.Subscribed!==!0&&_.has(e.fullName)&&!v(e)):[],re=u.filter(e=>!y.includes(e)),E=y.some(e=>D(this.currentMailbox,e.fullName,O(e.mb))),k=this.showUnsubscribed||E,se=(e,t=0,r=!1)=>e.map(e=>{let i=Object.keys(e.children).length>0,a=this.expandedFolders.has(e.fullName),o=this.currentMailbox===e.fullName,s=t=>r?!!e.mb&&ne(e.mb,t):ne(e.mb,t),c=!!e.mb?.Shareable,l=t>0||!e.primary,u=l||c,f=s(`k`),m=s(`x`),_=!1,v=!1;if(l){let t=O(e.mb,`.`),n=oe(e.fullName,t),i=n.slice(0,-1).join(t),a=this.mailboxes.filter(e=>De(e)!==null===r).map(e=>e.Name||e.Mailbox||``).filter(e=>{if(this.primaryFullNames.has(e))return!1;let r=oe(e,t);return r.slice(0,-1).join(t)===i&&r.length===n.length}),o=this.settingsStore?.getState()?.customMailboxOrder||[];a.sort((e,t)=>{let n=o.indexOf(e),r=o.indexOf(t);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.localeCompare(t):1:-1});let s=a.indexOf(e.fullName);_=s<=0,v=s===-1||s===a.length-1}let y=p.get(e.fullName),ee=e.primary??(y===void 0?void 0:d(e,y)),S=P(r?`folderUser`:`folder`),C=e.name;r&&t===0&&g.some(t=>t!==e&&t.name===e.name)&&(C=e.fullName),ee&&(S=P(ee.icon),C=ee.label);let w=e.mb?.Unseen||0,te=(e.mb?.Attrs||[]).some(e=>typeof e==`string`&&e.toLowerCase()===`\\noselect`),re=this.dropTarget===e.fullName,E=t=>{te?i&&this.toggleFolder(t,e.fullName):this.selectMailbox(e.fullName)},ie=!te||i;return b`
          <div 
            class="folder-item ${o?`active`:``} ${te?`no-select`:``} ${u?`has-actions`:``} ${re?`drop-target`:``} ${re&&this.dropCopy?`drop-copy`:``}"
            title=${C}
            @click=${E}
            @dragenter=${t=>this.handleDragOver(t,e.fullName,e.mb)}
            @dragover=${t=>this.handleDragOver(t,e.fullName,e.mb)}
            @dragleave=${t=>this.handleDragLeave(t,e.fullName)}
            @drop=${t=>this.handleDrop(t,e.fullName,e.mb)}
          >
            <alps-icon-btn 
              class="folder-toggle-btn" 
              title=${this.i18nStore?.t(a?`general.collapse`:`general.expand`)}
              icon=${a?`caretDown`:`caretRight`}
              style="visibility: ${i?`visible`:`hidden`};"
              @click=${t=>{t.stopPropagation(),i&&this.toggleFolder(t,e.fullName)}}
            ></alps-icon-btn>
            
            <div class="folder-icon">${S}</div>
            <div class="folder-name"
              role=${ie?`button`:n}
              tabindex=${ie?`0`:n}
              aria-current=${o?`true`:n}
              aria-expanded=${te&&i?String(a):n}
              @keydown=${ie?e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),e.key===` `&&e.repeat||E(e))}:n}
            ><bdi>${C}</bdi></div>
            
            ${u?b`
              <div class="folder-actions ${this.activeKebabMenu===e.fullName?`popup-open`:``}" @click=${e=>e.stopPropagation()}>
                <alps-popup 
                  align="end" 
                  position="bottom"
                  @popup-open=${()=>{this.activeKebabMenu=e.fullName}}
                  @popup-close=${()=>{this.activeKebabMenu===e.fullName&&(this.activeKebabMenu=null)}}
                >
                  <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical" title=${this.i18nStore?.t(`general.moreOptions`)}></alps-icon-btn>
                  ${l?b`
                  ${f?b`
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.parentForNewFolder=e.fullName,this.showCreatePrompt=!0}}>
                    ${P(`folderPlus`)} <span class="item-text">${this.i18nStore?.t(`folderList.createSubfolder`)}</span>
                  </button>
                  `:``}
                  ${m?b`
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.mailboxToRename=e.fullName,this.showRenamePrompt=!0}}>
                    ${P(`pen`)} <span class="item-text">${this.i18nStore?.t(`folderList.rename`)}</span>
                  </button>
                  `:``}
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=!e.mb?.Subscribed;pa.setSubscribed(e.fullName,r).then(t=>{t.ok&&this.subscriptionChanged(e.fullName,r),t.ok||t.reason===`auth`||(r?this.toast(this.i18nStore?.t(`toast.subscribeFailed`),`Could not subscribe`,{type:`error`}):this.toast(this.i18nStore?.t(`toast.unsubscribeFailed`),`Could not unsubscribe`,{type:`error`}))})}}>
                    ${P(e.mb?.Subscribed?`eyeSlash`:`eye`)} <span class="item-text">${e.mb?.Subscribed?this.i18nStore?.t(`folderList.unsubscribe`):this.i18nStore?.t(`folderList.subscribe`)}</span>
                  </button>
                  <div class="dropdown-divider"></div>
                  
                  <!-- Natively nested Order submenu via extended alps-popup -->
                  <!--
                    Open and close are stopped as well as the click: they are
                    dispatched {bubbles, composed}, so this submenu's popup-close
                    reached the OUTER kebab's @popup-close and cleared
                    activeKebabMenu while the outer menu was still open.
                  -->
                  <alps-popup
                    position="inline-end"
                    align="top"
                    triggerOn="hover"
                    @click=${e=>e.stopPropagation()}
                    @popup-open=${e=>e.stopPropagation()}
                    @popup-close=${e=>e.stopPropagation()}
                  >
                    <button slot="trigger" class="dropdown-item submenu-trigger">
                      <div class="trigger-label">
                        ${P(`sortAscending`)} <span class="item-text">${this.i18nStore?.t(`folderList.order`)}</span>
                      </div>
                      <div class="caret-icon">${P(`caretRight`)}</div>
                    </button>
                    
                    <button class="dropdown-item" ?disabled=${_} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`top`)}}>
                      ${P(`caretDoubleUp`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveToTop`)}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${_} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`up`)}}>
                      ${P(`caretUp`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveUp`)}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${v} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`down`)}}>
                      ${P(`caretDown`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveDown`)}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${v} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`bottom`)}}>
                      ${P(`caretDoubleDown`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveToBottom`)}</span>
                    </button>
                  </alps-popup>


                  ${m?b`
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.mailboxToDelete=e.fullName;let i=T(`trash`,this.mailboxes,x);r||ue(e.fullName,this.mailboxes)===`trash`||D(e.fullName,i,O(e.mb))?this.showDeleteConfirm=!0:this.showMoveToTrashConfirm=!0}}>
                    ${P(`trash`)} <span class="item-text">${this.i18nStore?.t(`folderList.delete`)}</span>
                  </button>
                  `:``}
                  `:``}
                  ${c?b`
                  ${l?b`<div class="dropdown-divider"></div>`:``}
                  <button class="dropdown-item share-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.folderToShare={name:e.fullName,label:C}}}>
                    ${P(`userPlus`)} <span class="item-text">${this.i18nStore?.t(`folderList.share`)}</span>
                  </button>
                  `:``}
                </alps-popup>
              </div>
            `:``}

            ${w>0?b`<div class="folder-badge">${w}</div>`:``}
          </div>
          
          ${i&&a?b`
            <div class="folder-children">
              ${se(Object.values(e.children).sort(h),t+1,r)}
            </div>
          `:``}
        `});return b`
      <!-- Frame and content follow the strip state alps-sidebar provides.
           In the strip the content is inert, not only dimmed:
           sidebarLayoutStyles gives it pointer-events: none, which keeps the
           mouse out; inert keeps the keyboard out too, so Tab cannot walk
           into folder carets clipped past the strip's edge. Compose, above,
           stays live, and the keyboard reaching it (or the expand button)
           opens the overlay, where the folders are live. -->
      <alps-sidebar-frame class="sidebar-wrapper">
        <alps-toolbar class="sidebar-header" ?scrolled=${this.isScrolled}>
          <alps-create-button 
            icon="pen"
            ?disabled=${(this.composeStore?.getState()?.activeComposers?.length||0)>=3}
            title=${this.i18nStore?.t(`folderList.compose`)}
            @click=${()=>this.dispatchEvent(new CustomEvent(`compose`))}
          >${this.i18nStore?.t(`folderList.compose`)}</alps-create-button>
        </alps-toolbar>
        <!-- A navigation landmark named for what it lists, so a screen
             reader's landmark list says what it is and can jump to it. -->
        <alps-sidebar-content
          class="sidebar-content"
          role="navigation"
          aria-label=${this.i18nStore?.t(`folderList.title`)??`Folders`}
          @scroll=${this.handleScroll}
        >
          <div class="sidebar-scroll-content">
            ${se(f)}
            ${f.length>0&&u.length>0?b`
              <div class="folder-separator"></div>
            `:``}
            <alps-sidebar-heading heading=${this.i18nStore?.t(`folderList.title`)??``}></alps-sidebar-heading>
            ${se(re)}
            ${y.length>0?b`
              <button
                type="button"
                class="folder-item more-row"
                aria-expanded=${k?`true`:`false`}
                title=${this.i18nStore?.t(`folderList.unsubscribedFolders`)}
                @click=${()=>{this.showUnsubscribed=!k}}
              >
                <div class="more-caret">${P(k?`caretDown`:`caretRight`)}</div>
                <div class="folder-icon">${P(`eyeSlash`)}</div>
                <div class="folder-name">${k?this.i18nStore?.t(`folderList.less`):this.i18nStore?.t(`folderList.more`)}</div>
              </button>
              ${k?se(y):``}
            `:``}
            ${g.length>0?b`
              <div class="folder-separator"></div>
              <alps-sidebar-heading class="shared-heading" heading=${this.i18nStore?.t(`folderList.sharedFolders`)??``}></alps-sidebar-heading>
              ${se(g,0,!0)}
            `:``}
          </div>
        </alps-sidebar-content>
      </alps-sidebar-frame>

      ${this.showCreatePrompt?b`
        <ui-prompt
          heading=${this.parentForNewFolder?this.i18nStore?.t(`folderList.createSubfolderUnder`,{folder:this.parentForNewFolder}):this.i18nStore?.t(`folderList.createFolder`)}
          confirmText=${this.i18nStore?.t(`folderList.createFolder`)}
          .busy=${this.promptBusy}
          .fields=${[{id:`name`,label:this.i18nStore?.t(`folderList.folderName`)||`Folder name`,autofocus:!0}]}
          @submit=${this.handleCreateSubmit}
          @cancel=${()=>{this.showCreatePrompt=!1,this.parentForNewFolder=``}}
        ></ui-prompt>
      `:``}

      ${this.showRenamePrompt?b`
        <ui-prompt
          heading="${this.i18nStore?.t(`folderList.renameFolder`)}"
          confirmText=${this.i18nStore?.t(`folderList.rename`)}
          .fields=${[{id:`name`,label:this.i18nStore?.t(`folderList.folderName`)||`Folder name`,autofocus:!0,value:this.mailboxToRename}]}
          @submit=${this.handleRenameSubmit}
          @cancel=${()=>this.showRenamePrompt=!1}
        ></ui-prompt>
      `:``}

      ${this.showMoveToTrashConfirm?b`
        <ui-confirm
          heading=${this.i18nStore?.t(`folderList.moveToTrash`)}
          message=${this.i18nStore?.t(`folderList.moveToTrashConfirm`,{folder:this.mailboxToDelete})}
          confirmText=${this.i18nStore?.t(`folderList.moveToTrash`)}
          isDanger=${!1}
          @confirm=${this.handleMoveToTrashConfirm}
          @cancel=${()=>this.showMoveToTrashConfirm=!1}
        ></ui-confirm>
      `:``}

      ${this.folderToShare?b`
        <alps-folder-share-dialog
          .mailbox=${this.folderToShare.name}
          .folderName=${this.folderToShare.label}
          @close=${()=>{this.folderToShare=null}}
        ></alps-folder-share-dialog>
      `:``}

      ${this.showDeleteConfirm?b`
        <ui-confirm
          heading="${this.i18nStore?.t(`folderList.deleteFolder`)}"
          message=${this.i18nStore?.t(`folderList.deleteFolderConfirm`,{folder:this.mailboxToDelete})}
          confirmText=${this.i18nStore?.t(`folderList.delete`)}
          isDanger=${!0}
          @confirm=${this.handleDeleteConfirm}
          @cancel=${()=>this.showDeleteConfirm=!1}
        ></ui-confirm>
      `:``}
    `}};N([s({context:ta})],W.prototype,`composeStore`,void 0),N([s({context:A})],W.prototype,`i18nStore`,void 0),N([s({context:Be})],W.prototype,`settingsStore`,void 0),N([_({type:Array})],W.prototype,`mailboxes`,void 0),N([_({type:String})],W.prototype,`currentMailbox`,void 0),N([_({type:Object})],W.prototype,`expandedFolders`,void 0),N([_({type:String})],W.prototype,`layoutMode`,void 0),N([_({type:Boolean})],W.prototype,`syncing`,void 0),N([s({context:Ma,subscribe:!0}),d()],W.prototype,`strip`,void 0),N([d()],W.prototype,`isScrolled`,void 0),N([d()],W.prototype,`showCreatePrompt`,void 0),N([d()],W.prototype,`promptBusy`,void 0),N([d()],W.prototype,`showRenamePrompt`,void 0),N([d()],W.prototype,`mailboxToRename`,void 0),N([d()],W.prototype,`showDeleteConfirm`,void 0),N([d()],W.prototype,`showMoveToTrashConfirm`,void 0),N([d()],W.prototype,`mailboxToDelete`,void 0),N([d()],W.prototype,`parentForNewFolder`,void 0),N([d()],W.prototype,`folderToShare`,void 0),N([d()],W.prototype,`activeKebabMenu`,void 0),N([d()],W.prototype,`dropTarget`,void 0),N([d()],W.prototype,`dropCopy`,void 0),N([d()],W.prototype,`showUnsubscribed`,void 0),W=N([o(`alps-folder-list`)],W);async function Ha(e,t){let n=new Map,r=null;for(let i=0;i<t.length;i+=200){let a=t.slice(i,i+200).map(encodeURIComponent).join(`,`),o=await F(`/mailboxes/${k(e)}/verdicts?uids=${a}`,{},void 0,{background:!0});if(!o.ok)throw Error(`verdicts request failed: ${o.status}`);let s=await o.json(),c=typeof s?.Scope==`string`?s.Scope:``;if(r!==null&&c!==r)throw Error(`verdicts were answered under different scopes`);r=c;for(let[e,t]of Object.entries(s?.Verdicts??{})){let r=t??{};n.set(e,{HasBimiPotential:r.HasBimiPotential===!0,HasBimiFailed:r.HasBimiFailed===!0})}}return{verdicts:n,scope:r??``}}async function Ua(e,t){let n=t.map(encodeURIComponent).join(`,`),r=await F(`/mailboxes/${k(e)}/previews?uids=${n}`,{},void 0,{background:!0});if(!r.ok)throw Error(`previews request failed: ${r.status}`);let i=await r.json(),a=new Map;for(let[e,t]of Object.entries(i?.Previews??{}))typeof t==`string`&&a.set(e,t);return{previews:a,scope:typeof i?.Scope==`string`?i.Scope:``,supported:i?.Supported===!0}}var Wa=class extends c{constructor(...e){super(...e),this.name=``,this.email=``,this.src=``,this.size=40,this.imageError=!1,this._handleStoreChange=()=>{this.requestUpdate()}}willUpdate(e){e.has(`src`)&&(this.imageError=!1)}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.settingsStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=y`
    :host {
      display: inline-block;
      flex-shrink: 0;
    }
    .avatar {
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      user-select: none;
      overflow: hidden; /* Ensure image doesn't overflow border-radius */
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background-color: white;
    }
  `}getInitials(e){if(!e)return`U`;let t=e.trim().split(/[\s.@]+/);return t.length>=2?(t[0][0]+t[1][0]).toUpperCase():e.substring(0,2).toUpperCase()}render(){let e=this.settingsStore?.getState()?.loginUsername||``,t=this.settingsStore?.getState()?.name||``,n=!1;(e&&this.email&&this.email.toLowerCase()===e.toLowerCase()||t&&this.name&&this.name.toLowerCase()===t.toLowerCase()||e&&this.name&&this.name.toLowerCase()===e.toLowerCase())&&(n=!0);let r=n?t||e:this.email||this.name,i=n&&(t||e)||this.name,a=Math.round(this.size/2.3),o={width:`${this.size}px`,height:`${this.size}px`,fontSize:`${a}px`,backgroundColor:he(r)};return b`
      <div class="avatar" style="${u(o)}">
        ${this.src&&!this.imageError?b`<img src="${this.src}" alt="${this.name}" @error="${()=>this.imageError=!0}" />`:this.getInitials(i)}
      </div>
    `}};N([s({context:Be})],Wa.prototype,`settingsStore`,void 0),N([_({type:String})],Wa.prototype,`name`,void 0),N([_({type:String})],Wa.prototype,`email`,void 0),N([_({type:String})],Wa.prototype,`src`,void 0),N([_({type:Number})],Wa.prototype,`size`,void 0),N([d()],Wa.prototype,`imageError`,void 0),Wa=N([o(`alps-avatar`)],Wa);var Ga=class extends c{constructor(...e){super(...e),this.name=``,this.color=``}static{this.styles=y`
    :host {
      display: inline-flex;
    }

    .tag-pill {
      display: inline-flex;
      align-items: center;
      padding-block: 0;
      padding-inline: 6px 10px;
      height: 18px;
      border-radius: 0;
      border-start-start-radius: 4px;
      border-end-start-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      max-width: 80px;
      line-height: 1;
      clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%);
    }

    /* The tag's point is on its inline end. */
    :host(:dir(rtl)) .tag-pill {
      clip-path: polygon(6px 0, 100% 0, 100% 100%, 6px 100%, 0 50%);
    }
  `}render(){return b`
      <div class="tag-pill" style="background-color: ${this.color}; color: ${Qn(this.color)}" title=${this.name}>
        ${this.name}
      </div>
    `}};N([_({type:String})],Ga.prototype,`name`,void 0),N([_({type:String})],Ga.prototype,`color`,void 0),Ga=N([o(`alps-tag`)],Ga);var Ka=class extends c{constructor(...e){super(...e),this.currentPage=0,this.totalItems=0,this.itemsPerPage=50,this.currentCount=0,this.isSearch=!1,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=y`
    /* Sized by its content and pushed to the end of the toolbar, rather than
       stretched across whatever room is left. Stretched, the count sat in the
       middle of that space (margin: 0 auto) with the arrows far off at the
       right edge, so the two halves of one control read as unrelated. */
    :host {
      display: inline-flex;
      align-items: center;
      margin-inline-start: auto;
      flex-shrink: 0;
    }

    .pagination-container {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-muted);
      user-select: none;
    }

    .pagination-controls {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .pagination-text {
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
  `}changePage(e){let t=this.currentPage+e;t>=0&&t<Math.ceil(this.totalItems/this.itemsPerPage)&&this.dispatchEvent(new CustomEvent(`change-page`,{detail:{page:t},bubbles:!0,composed:!0}))}get knownTotal(){return this.totalItems>0?this.totalItems:void 0}get hasPrev(){return this.currentPage>0}get hasNext(){let e=this.knownTotal;return e!==void 0&&(this.currentPage+1)*this.itemsPerPage<e}get rangeText(){let e=this.currentCount>0?this.currentCount:0;if(e===0)return this.i18nStore?.t(`pagination.zeroMessages`)||`0 messages`;if(!this.hasPrev&&!this.hasNext){let t=this.isSearch?e:this.knownTotal??e;return this.isSearch?this.i18nStore?.t(`pagination.searchResults`,{count:t})||`${t} results`:this.i18nStore?.t(`pagination.totalCount`,{total:t})||`${t} total`}let t=this.currentPage*this.itemsPerPage+1,n=t+e-1,r=this.knownTotal;return r===void 0?`${t}\u2013${n}`:(this.i18nStore?.t(`pagination.rangeOfTotal`)||`{start}–{end} of {total}`).replace(`{start}`,String(t)).replace(`{end}`,String(n)).replace(`{total}`,String(r))}render(){let e=this.rangeText;return b`
      <div class="pagination-container">
        <div class="pagination-text" title="${e}">${e}</div>
        <div class="pagination-controls">
          <alps-icon-btn 
            title=${this.i18nStore?.t(`pagination.previousPage`)} 
            ?disabled=${!this.hasPrev} 
            @click=${()=>this.changePage(-1)}
            icon="caretLeft"
          ></alps-icon-btn>
          <alps-icon-btn 
            title=${this.i18nStore?.t(`pagination.nextPage`)} 
            ?disabled=${!this.hasNext} 
            @click=${()=>this.changePage(1)}
            icon="caretRight"
          ></alps-icon-btn>
        </div>
      </div>
    `}};N([_({type:Number})],Ka.prototype,`currentPage`,void 0),N([_({type:Number})],Ka.prototype,`totalItems`,void 0),N([_({type:Number})],Ka.prototype,`itemsPerPage`,void 0),N([_({type:Number})],Ka.prototype,`currentCount`,void 0),N([_({type:Boolean})],Ka.prototype,`isSearch`,void 0),N([s({context:A})],Ka.prototype,`i18nStore`,void 0),Ka=N([o(`alps-pagination`)],Ka);var qa=class extends c{constructor(...e){super(...e),this.variant=`info`}static{this.styles=y`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .banner {
      padding: 6px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 38px;
      box-sizing: border-box;
      font-size: 13px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-primary, #ffffff);
      color: var(--text-primary, #111827);
      box-shadow: rgba(95, 95, 95, 0.1) 0 4px 4px -2px;
    }

    .banner.warning {
      border-inline-start: 3px solid var(--warning, #f59e0b);
      padding-inline-start: 13px;
    }

    .banner.error {
      background: var(--error-surface, color-mix(in srgb, var(--error, #ef4444) 12%, var(--bg-primary, #ffffff)));
      border-color: var(--error-border, var(--error, #ef4444));
      border-inline-start: 3px solid var(--error-border, var(--error, #ef4444));
      color: var(--error-text, color-mix(in srgb, var(--error, #ef4444) 55%, var(--text-primary, #111827)));
      padding-inline-start: 13px;
    }

    .content {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
    }

    .actions {
      margin-inline-start: 16px;
      flex-shrink: 0;
      display: flex;
      gap: 8px;
    }

    ::slotted(alps-button) {
      --btn-padding: 4px 10px;
      --btn-font-size: 12px;
    }

    @media (max-width: 768px) {
      .banner {
        font-size: 11px;
        padding: 6px 12px;
      }
      .content {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .actions {
        margin-inline-start: 8px;
      }
    }
  `}render(){return b`
      <div class="banner ${this.variant}">
        <div class="content">
          <slot></slot>
        </div>
        <div class="actions">
          <slot name="action"></slot>
        </div>
      </div>
    `}};N([_({type:String,reflect:!0})],qa.prototype,`variant`,void 0),qa=N([o(`alps-banner`)],qa);var Ja=new Set([`is:starred`,`is:unread`]),Ya=5e3,G=0;typeof window<`u`&&(window.addEventListener(`session-cleared`,()=>{G++}),window.addEventListener(`user-logged-in`,()=>{G++}));var K=class extends c{constructor(...e){super(...e),this.messages=[],this.currentMailbox=``,this.mailboxes=[],this.currentMailboxRole=``,this.listedMailbox=``,this.listedUIDValidity=0,this.listedMailboxRole=``,this.loading=!1,this.selectedMessage=null,this.layoutMode=`vertical`,this.isMobile=!1,this.sidebarCollapsed=!1,this.currentPage=0,this.listedPage=0,this.totalMessages=0,this.messagesPerPage=50,this.filterQuery=``,this.sortOrder=`desc`,this.densityMode=`compact`,this.showSenderAvatars=!0,this.selectedMessages=new Set,this.selectAllMatching=!1,this.matchingCount=0,this.syncing=!1,this.loadFailed=!1,this.loadLimited=!1,this.isSpinning=!1,this.isScrolled=!1,this.isAtBottom=!1,this.scrolledTo=0,this.selectionScrollTimer=null,this.focusedIndex=-1,this.showEmptyConfirm=!1,this.emptying=!1,this.expandedThreads=new Set,this.memberDetails=new Map,this.membersAsked=new Set,this.membersSignIn=G,this.membersNeedRead=!1,this.draggingKeys=null,this.verdicts=new Map,this.verdictScopes=new Map,this.verdictsAsked=new Set,this.verdictsConfirmed=new Set,this.verdictsSignIn=G,this.verdictGeneration=0,this.verdictsRunning=!1,this.verdictsRerun=!1,this.previews=new Map,this.previewScopes=new Map,this.previewsAsked=new Set,this.previewsSignIn=G,this.previewGeneration=0,this.previewsRunning=!1,this.previewsRerun=!1,this.previewsUnsupported=!1,this._shouldScrollToTop=!1,this._uidsBeforeCheck=null,this._arrivedIndex=-1,this._handleStoreChange=()=>{this.requestUpdate()},this.handleSyncStart=()=>{this.syncing=!0,this.isSpinning=!0},this.handleSyncEnd=()=>{this.syncing=!1},this.handleSpinIteration=()=>{this.syncing||(this.isSpinning=!1)},this.handleScroll=e=>{this.scrolledTo=e.target.scrollTop,this.checkScrollState(e.target)},this.endDrag=()=>{this.draggingKeys=null,window.removeEventListener(`drop`,this.endDrag,!0),window.removeEventListener(`dragend`,this.endDrag,!0)}}static{this.styles=[j,dt,y`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .list-header {
      padding: 0 12px;
      gap: 12px;
      background: var(--bg-primary, #fff);
      overflow: hidden;
    }

    .select-all-checkbox {
      cursor: pointer;
    }
    
    .current-mailbox-label {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-color);
      margin-inline-start: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mailbox-badge {
      display: inline-flex;
      align-items: center;
      background: var(--bg-tertiary, #f3f4f6);
      color: var(--text-secondary, #4b5563);
      font-size: 10px;
      font-weight: 500;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid var(--border-color, #e5e7eb);
      margin-inline-end: 6px;
      flex-shrink: 0;
      text-transform: capitalize;
    }
    
    .list-content {
      flex: 1;
      overflow-y: auto;
      margin-bottom: -1px;
      position: relative;
      z-index: 1;
    }

    .message-item {
      padding: 12px;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: background 0.15s, padding 0.2s, gap 0.2s;
    }

    /* What a drag is carrying, left in place until the drop files it. */
    .message-item.is-dragging {
      opacity: 0.4;
    }

    /* Density: Loose */
    :host(.density-loose) .message-item {
      padding-block: 16px;
      padding-inline: 0 12px;
      gap: 16px;
    }
    :host(.density-loose) .message-preview {
      -webkit-line-clamp: 3;
    }
    :host(.density-loose) .checkbox-col {
      margin-top: -16px;
      margin-bottom: -16px;
    }

    /* Density: Compact */
    :host(.density-compact) .message-item {
      padding-block: 8px;
      padding-inline: 0 12px;
      gap: 12px;
    }
    :host(.density-compact) .message-header-row {
      margin-bottom: 2px;
    }
    :host(.density-compact) .message-subject {
      font-size: 13px;
      margin-bottom: 2px;
    }
    :host(.density-compact) .message-preview {
      font-size: 12px;
      -webkit-line-clamp: 1;
    }
    :host(.density-compact) .checkbox-col {
      margin-top: -8px;
      margin-bottom: -8px;
    }

    /* Density: Ultra-compact */
    :host(.density-ultra-compact) .message-item {
      padding-block: 4px;
      padding-inline: 0 12px;
      gap: 12px;
    }
    :host(.density-ultra-compact) .message-subject {
      font-size: 13px;
      flex: 1;
      margin: 0;
    }
    :host(.density-ultra-compact) .message-sender {
      width: 120px;
      flex-shrink: 1;
      min-width: 80px;
    }
    :host(.density-ultra-compact) .checkbox-col {
      margin-top: -4px;
      margin-bottom: -4px;
    }

    @media (max-width: 768px) {
      :host(.density-ultra-compact) .message-sender {
        width: 80px;
        min-width: 60px;
      }
      :host(.density-ultra-compact) .message-item,
      :host(.density-compact) .message-item {
        padding: 12px;
      }
      :host(.density-loose) .message-item {
        padding: 16px 12px;
      }
    }

    .message-item:hover {
      background: var(--hover-color);
    }

    .message-item.unread {
      background: var(--bg-unread, rgba(234, 179, 8, 0.08));
    }

    .message-item.unread:hover {
      background: var(--bg-unread-hover, rgba(234, 179, 8, 0.12));
    }

    .message-item.starred .message-sender,
    .message-item.starred .message-subject {
      color: var(--accent-color);
      font-weight: 600;
    }

    .message-item.active {
      background: var(--bg-selected);
    }

    .message-item.active.unread {
      background: var(--bg-selected);
    }

    .message-item.active .message-preview,
    .message-item.active .message-date {
      color: var(--text-muted);
    }

    .list-content:focus {
      outline: none;
    }

    .list-content:focus-within .message-item.focused {
      outline: 2px solid var(--accent-color);
      outline-offset: -2px;
      z-index: 10;
      position: relative;
    }

    .message-item.unread .message-sender {
      font-weight: 700;
    }

    .message-item.unread .message-subject {
      font-weight: 700;
      color: var(--text-color);
    }

    .message-item.active.unread .message-subject {
      color: var(--text-color);
    }

    .message-details {
      flex: 1;
      min-width: 0;
    }

    .message-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .message-sender {
      font-weight: 450;
      color: var(--text-sender-read, #202020);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .message-date {
      font-family: var(--font-label);
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      margin-inline-start: 8px;
      text-align: end;
      flex-shrink: 0;
    }

    .message-size {
      font-family: var(--font-label);
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      margin-inline-start: 8px;
      text-align: end;
      flex-shrink: 0;
    }

    .avatar-stack {
      display: flex;
      align-items: center;
      position: relative;
      flex-shrink: 0;
    }
    
    .avatar-wrapper {
      position: relative;
      border: 2px solid var(--bg-primary, #fff);
      border-radius: 50%;
      background: var(--bg-primary, #fff);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.15s, background-color 0.15s;
    }

    .message-item.active .avatar-wrapper {
      border-color: var(--bg-selected);
      background: var(--bg-selected);
    }
    
    .message-item.active.unread .avatar-wrapper {
      border-color: var(--bg-selected);
      background: var(--bg-selected);
    }

    .message-item.unread .avatar-wrapper {
      border-color: var(--bg-unread, rgba(234, 179, 8, 0.08));
      background: var(--bg-unread, rgba(234, 179, 8, 0.08));
    }

    .message-item:hover .avatar-wrapper {
      border-color: var(--hover-color);
      background: var(--hover-color);
    }

    .avatar-wrapper:not(:first-child) {
      margin-inline-start: -8px;
    }

    .extra-count {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 500;
      background: var(--bg-secondary, #f3f4f6) !important;
      border-radius: 50%;
      box-sizing: content-box;
    }

    .attachment-col {
      width: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
    }

    .message-subject {
      font-size: 14px;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .message-preview {
      font-size: 13px;
      color: var(--text-muted);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted);
    }

    .empty-state.load-error {
      flex-direction: column;
      gap: 12px;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 12px;
      color: var(--text-muted);
    }

    .header-divider {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 4px;
    }

    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    
    .spinner {
      animation: spin 3s linear infinite;
      display: flex;
      margin-inline-end: 8px;
    }
    
    .spinner .icon {
      width: 32px;
      height: 32px;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }



    .message-checkbox, .select-all-checkbox {
      cursor: pointer;
      opacity: 0.4;
      transition: opacity 0.2s;
    }

    .checkbox-col {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-inline-start: 12px;
      padding-inline-end: 6px;
      align-self: stretch;
      cursor: pointer;
    }

    .message-item:hover .message-checkbox,
    .message-checkbox:checked,
    .select-all-checkbox:hover,
    .select-all-checkbox:checked {
      opacity: 1;
    }

    .star-btn {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      opacity: 0.3;
      color: var(--text-muted);
    }
    .star-btn:hover,    
    .star-btn.starred {
      opacity: 1;
    }
    .star-btn.starred {
      color: var(--accent-color);
    }
    .star-btn:hover {
      transform: scale(1.1);
    }
    
    .indicator-icon {
      display: flex;
      color: var(--text-muted);
    }
    .indicator-icon svg {
      width: 18px;
      height: 18px;
    }

    .message-indicators {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .star-btn-wrapper-ultra {
      margin-inline-end: 8px;
    }

    .indicators-wrapper-ultra {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-inline-end: 4px;
    }

    .message-header-inner {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
      margin-inline-end: 12px;
    }

    .message-header-inner .star-btn {
      flex-shrink: 0;
    }

    .message-subject-row {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      overflow: hidden;
    }

    .message-subject-row .message-subject {
      margin-bottom: 0;
      flex: 1;
    }

    .indicators-wrapper {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-inline-end: 6px;
      flex-shrink: 0;
    }

    .tag-pills {
      display: flex;
      flex-wrap: nowrap;
      gap: 4px;
      margin-inline-end: 6px;
      overflow: hidden;
      flex-shrink: 0;
      align-items: center;
    }

    .mobile-bottom-header {
      height: 57px;
      box-sizing: border-box;
      padding: 0 12px;
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-primary);
      flex-shrink: 0;
      position: relative;
      z-index: 10;
      box-shadow: rgba(95, 95, 95, 0.1) 0 -4px 4px -2px;
      transition: box-shadow 0.2s ease;
    }

    .mobile-bottom-header.at-bottom {
      box-shadow: none;
    }

    .mobile-bottom-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .loading-overlay {
      opacity: 0.5;
      pointer-events: none;
      transition: opacity 0.2s ease-in-out;
    }

    .thread-count-caret-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--border-color, #e5e7eb);
      color: var(--text-muted, #4b5563);
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 8px;
      line-height: 1;
      flex-shrink: 0;
    }
    
    .message-item.unread .thread-count-caret-badge {
      background: var(--accent-fill, #eab308);
      color: #fff;
    }

    .caret-col {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 44px;
      height: 100%;
      cursor: pointer;
      color: var(--text-muted);
      opacity: 0.6;
      transition: opacity 0.2s, color 0.2s;
      flex-shrink: 0;
    }
    .caret-col:hover {
      opacity: 1;
      color: var(--text-color);
    }
    .caret-col.empty {
      cursor: default;
      opacity: 0;
      pointer-events: none;
    }
    .caret-col svg {
      width: 14px;
      height: 14px;
    }

    .message-item.sub-message-item {
      background: var(--bg-secondary, #fafafa);
    }
    .message-item.sub-message-item.first-sub-item {
      box-shadow: inset rgba(95, 95, 95, 0.1) 0 4px 4px -2px;
    }
    .message-item.sub-message-item.last-sub-item {
      box-shadow: inset rgba(95, 95, 95, 0.1) 0 -4px 4px -2px;
    }
    .message-item.sub-message-item.first-sub-item.last-sub-item {
      box-shadow: inset rgba(95, 95, 95, 0.1) 0 4px 4px -2px,
                  inset rgba(95, 95, 95, 0.1) 0 -4px 4px -2px;
    }
    .message-item.sub-message-item:hover {
      background: var(--hover-color);
    }
    .message-item.sub-message-item.active {
      background: var(--bg-selected);
    }
  `]}get visibleMessages(){let e=[];for(let t of this.messages||[])e.push(t),t.SubMessages&&t.SubMessages.length>0&&this.isThreadExpanded(String(t.UID))&&e.push(...t.SubMessages);return e}leaveVerdicts(){this.verdictGeneration++,this.verdictsConfirmed=new Set,this.verdicts.size>Ya&&(this.verdicts=new Map,this.verdictScopes=new Map),this.verdictsAsked=new Set([...this.verdictsAsked].filter(e=>this.verdicts.has(e)))}forgetVerdicts(){this.verdictGeneration++,this.verdictsSignIn=G,this.verdicts=new Map,this.verdictScopes=new Map,this.verdictsAsked=new Set,this.verdictsConfirmed=new Set}mailboxOf(e){return pn(e,this.currentMailbox)}keyOf(e){return R(this.mailboxOf(e),e?.UID)}async refreshVerdicts(){if(this.verdictsRunning)this.verdictsRerun=!0;else{this.verdictsRunning=!0;try{await this.askVerdicts()}finally{this.verdictsRunning=!1,this.verdictsRerun&&(this.verdictsRerun=!1,this.refreshVerdicts())}}}get drawsAvatars(){return this.showSenderAvatars&&this.densityMode!==`ultra-compact`}async askVerdicts(){let e=this.currentMailbox;if(!e||!this.drawsAvatars)return;let t=this.verdictGeneration,n=G,r=()=>e===this.currentMailbox&&t===this.verdictGeneration&&n===G,i=new Map,a=new Map,o=t=>{let n=t?.UID==null?``:String(t.UID),r=this.mailboxOf(t);if(!n||e!==`*`&&r!==e)return;let o=R(r,n);pe(t)&&(this.verdictsAsked.has(o)?!this.verdictsConfirmed.has(r)&&this.verdicts.has(o)&&!a.has(r)&&a.set(r,n):(this.verdictsAsked.add(o),i.has(r)||i.set(r,[]),i.get(r).push(n)))};for(let e of this.messages||[])o(e),e?.SubMessages?.length&&this.isThreadExpanded(String(e.UID))&&e.SubMessages.forEach(o);for(let[e,t]of a)i.has(e)||i.set(e,[t]);let s=[];for(let[e,t]of i)for(let n of t)s.push({mailbox:e,uid:n});let c=e=>{for(let t of s.slice(e))this.verdictsAsked.delete(R(t.mailbox,t.uid))},l=0;for(;l<s.length;){if(await qe(),!r())return;if(this.loading){c(l);return}let e=s[l].mailbox,t=l;for(;t<s.length&&t-l<3&&s[t].mailbox===e;)t++;let n=s.slice(l,t).map(e=>e.uid),i;try{i=await Ha(e,n)}catch{r()&&c(l);return}if(!r())return;let a=new Map(this.verdicts),o=this.verdictScopes.get(e),u=!1;if(i.scope&&o&&i.scope!==o){let r=R(e,``);for(let e of[...a.keys()])e.startsWith(r)&&a.delete(e);for(let e of[...this.verdictsAsked])e.startsWith(r)&&this.verdictsAsked.delete(e);for(let t of n)this.verdictsAsked.add(R(e,t));c(t),u=!0}i.scope&&this.verdictScopes.set(e,i.scope),this.verdictsConfirmed.add(e);for(let[t,n]of i.verdicts)a.set(R(e,t),n);if(this.verdicts=a,u){this.verdictsRerun=!0;return}l=t}}withVerdict(e){let t=this.mailboxOf(e);if(!this.verdictsConfirmed.has(t))return e;let n=this.verdicts.get(R(t,String(e?.UID)));return n?{...e,...n}:e}forgetPreviews(){this.previewGeneration++,this.previewsSignIn=G,this.previews=new Map,this.previewScopes=new Map,this.previewsAsked=new Set,this.previewsUnsupported=!1}previewScopeOf(e){return e?.PreviewScope||(this.currentMailbox!==`*`&&this.listedUIDValidity?String(this.listedUIDValidity):``)}async refreshPreviews(){if(this.previewsRunning)this.previewsRerun=!0;else{this.previewsRunning=!0;try{await this.askPreviews()}finally{this.previewsRunning=!1,this.previewsRerun&&(this.previewsRerun=!1,this.refreshPreviews())}}}async askPreviews(){let e=this.currentMailbox;if(!e||this.densityMode===`ultra-compact`||this.previewsUnsupported)return;let t=this.previewGeneration,n=G,r=()=>e===this.currentMailbox&&t===this.previewGeneration&&n===G,i=new Map;for(let t of this.messages||[]){let n=t?.UID==null?``:String(t.UID),r=this.mailboxOf(t);if(!n||!t.PreviewPending||e!==`*`&&r!==e)continue;let a=this.previewScopeOf(t);a&&this.previewScopes.set(r,a);let o=R(r,n);this.previewsAsked.has(o)||(this.previewsAsked.add(o),i.has(r)||i.set(r,[]),i.get(r).push(n))}let a=[];for(let[e,t]of i)for(let n of t)a.push({mailbox:e,uid:n});let o=e=>{for(let t of a.slice(e))this.previewsAsked.delete(R(t.mailbox,t.uid))},s=0;for(;s<a.length;){if(await qe(),!r())return;if(this.loading){o(s);return}let e=a[s].mailbox,t=s;for(;t<a.length&&t-s<5&&a[t].mailbox===e;)t++;let n=a.slice(s,t).map(e=>e.uid),i;try{i=await Ua(e,n)}catch{r()&&o(s);return}if(!r())return;if(!i.supported){this.previewsUnsupported=!0;return}let c=this.previewScopes.get(e);if(i.scope&&c&&i.scope!==c){let t=R(e,``);this.previews=new Map([...this.previews].filter(([e])=>!e.startsWith(t)));return}if(i.scope&&this.previewScopes.set(e,i.scope),i.previews.size>0){let t=new Map(this.previews);for(let[n,r]of i.previews)t.set(R(e,n),r);this.previews=t}s=t}}previewOf(e){return typeof e?.Preview==`string`&&e.Preview?e.Preview:this.previews.get(this.keyOf(e))??``}renderPreview(e){let t=this.previewOf(e);return t?b`<div class="message-preview" dir="auto">${t}</div>`:n}isThreadExpanded(e){return this.expandedThreads.has(e)}toggleThreadCollapse(e,t){e.stopPropagation();let n=new Set(this.expandedThreads);n.has(t)?n.delete(t):(n.add(t),this.readMembers(t)),this.expandedThreads=n}forgetMembers(){this.memberDetails=new Map,this.membersAsked=new Set,this.membersSignIn=G,this.membersNeedRead=!0}async readMembers(e){if(!this.isConnected||!this.rowsAreCurrent||this.loading)return;this.membersSignIn!==G&&this.forgetMembers();let t=this.messages?.find(t=>String(t.UID)===e);if(!t?.SubMessages?.some(e=>!e.BodyStructure))return;let n=this.keyOf(t);if(this.membersAsked.has(n))return;let r=this.membersAsked,i=G;r.add(n);try{let e=await F(`/mailboxes/${k(this.mailboxOf(t))}/messages/${t.UID}/thread`);if(!e.ok)throw Error(`answered ${e.status}`);let n=await e.json();if(!this.isConnected||this.membersAsked!==r||G!==i)return;let a=new Map(this.memberDetails);for(let e of Array.isArray(n?.Messages)?n.Messages:[])a.set(this.keyOf(e),{HasAttachments:!!e.HasAttachments});this.memberDetails=a}catch{r.delete(n)}}rowKeys(e){let t=this.keyOf(e);return!e.SubMessages?.length||this.isThreadExpanded(String(e.UID))?[t]:[t,...e.SubMessages.map(e=>this.keyOf(e))]}rowMessages(e){return!e.SubMessages?.length||this.isThreadExpanded(String(e.UID))?[e]:[e,...e.SubMessages]}rowSelection(e){let t=this.rowKeys(e),n=t.filter(e=>this.selectedMessages.has(e)).length;return n===0?`none`:n===t.length?`all`:`some`}toggleRow(e){let t=this.rowKeys(e),n=this.rowSelection(e)===`all`,r=new Set(this.selectedMessages);for(let e of t)n?r.delete(e):r.add(e);this.setSelection(r)}get pageKeys(){let e=[];for(let t of this.messages||[]){e.push(this.keyOf(t));for(let n of t.SubMessages||[])e.push(this.keyOf(n))}return e}get allOnPageSelected(){let e=this.pageKeys;return e.length>0&&e.every(e=>this.selectedMessages.has(e))}get canSelectAllMatching(){return this.currentMailbox!==`*`&&this.totalMessages>this.pageKeys.length}handleSelectAll(e){let t=e.target.checked;!t&&this.selectAllMatching?this.dispatchEvent(new CustomEvent(`clear-selection`)):this.setSelection(t?new Set(this.pageKeys):new Set)}setSelection(e){this.selectedMessages=e,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedKeys:e}}))}isOpen(e){return!!this.selectedMessage&&this.keyOf(this.selectedMessage)===this.keyOf(e)}connectedCallback(){super.connectedCallback(),this.membersNeedRead&&this.requestUpdate(),z.addEventListener(`sync-start`,this.handleSyncStart),z.addEventListener(`sync-success`,this.handleSyncEnd),z.addEventListener(`sync-error`,this.handleSyncEnd),z.addEventListener(`sync-unchanged`,this.handleSyncEnd),this.updateComplete.then(()=>{if(!this.isConnected)return;this.i18nStore?.addEventListener(`change`,this._handleStoreChange);let e=this.renderRoot.querySelector(`.list-content`);e&&this.scrolledTo>0&&(e.scrollTop=this.scrolledTo)})}disconnectedCallback(){super.disconnectedCallback(),this.selectionScrollTimer!==null&&(clearTimeout(this.selectionScrollTimer),this.selectionScrollTimer=null),this.endDrag(),this.forgetMembers(),z.removeEventListener(`sync-start`,this.handleSyncStart),z.removeEventListener(`sync-success`,this.handleSyncEnd),z.removeEventListener(`sync-error`,this.handleSyncEnd),z.removeEventListener(`sync-unchanged`,this.handleSyncEnd),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}willUpdate(e){if(super.willUpdate(e),this.verdictsSignIn===G?e.has(`currentMailbox`)&&this.leaveVerdicts():this.forgetVerdicts(),(this.membersSignIn!==G||e.has(`currentMailbox`)||e.has(`listedUIDValidity`))&&this.forgetMembers(),(this.previewsSignIn!==G||e.has(`currentMailbox`)||e.has(`listedUIDValidity`)||e.has(`messages`)&&this.messages.some(e=>{let t=this.previewScopes.get(this.mailboxOf(e)),n=this.previewScopeOf(e);return t&&n&&t!==n}))&&this.forgetPreviews(),this.isConnected&&(this.membersNeedRead||e.has(`messages`)||e.has(`loading`))){this.membersNeedRead=!1;for(let e of this.expandedThreads)this.readMembers(e)}if((e.has(`currentMailbox`)||e.has(`currentPage`)||e.has(`filterQuery`)||e.has(`sortOrder`))&&(!this.selectAllMatching&&this.selectedMessages.size>0&&this.setSelection(new Set),this.focusedIndex=-1,this._shouldScrollToTop=!0,this._uidsBeforeCheck=null),this._uidsBeforeCheck&&e.has(`syncing`)&&!this.syncing){let t=this._uidsBeforeCheck;if(this._uidsBeforeCheck=null,e.has(`messages`)){let e=(this.messages||[]).findIndex(e=>Number(e.UID)>(t.get(this.mailboxOf(e))??0));e!==-1&&(this._arrivedIndex=this.visibleMessages.indexOf(this.messages[e]))}}if(e.has(`messages`)&&this.draggingKeys){let e=new Set(this.pageKeys);this.draggingKeys.some(t=>e.has(t))||this.endDrag()}if(e.has(`selectedMessage`)||e.has(`messages`)){if(e.has(`messages`)&&this.messages&&!this.selectAllMatching&&this.selectedMessages.size>0){let e=new Set(this.pageKeys),t=new Set([...this.selectedMessages].filter(t=>e.has(t)));t.size!==this.selectedMessages.size&&this.setSelection(t)}if(this.selectedMessage){if(this.messages){let e=!1,t=new Set(this.expandedThreads);for(let n of this.messages)if(n.SubMessages&&n.SubMessages.some(e=>this.isOpen(e))){let r=String(n.UID);t.has(r)||(t.add(r),this.readMembers(r),e=!0)}e&&(this.expandedThreads=t)}let t=e.get(`selectedMessage`),n=this.visibleMessages,r=e.has(`selectedMessage`)&&!(t&&this.isOpen(t)),i=this.focusedIndex<0&&e.has(`messages`);if((r||i)&&n.length>0){let e=n.findIndex(e=>this.isOpen(e));e!==-1&&(this.focusedIndex=e)}}}e.has(`messages`)&&this.focusedIndex>=this.visibleMessages.length&&(this.focusedIndex=this.visibleMessages.length-1)}checkScrollState(e){if(!e)return;let t=e.scrollTop>0;this.isScrolled!==t&&(this.isScrolled=t,this.dispatchEvent(new CustomEvent(`list-scrolled`,{detail:{scrolled:t}})));let n=e.scrollHeight<=e.clientHeight||Math.ceil(e.scrollTop+e.clientHeight)>=e.scrollHeight;this.isAtBottom!==n&&(this.isAtBottom=n)}updated(e){super.updated(e),(e.has(`messages`)||e.has(`expandedThreads`)||e.has(`currentMailbox`)||e.has(`showSenderAvatars`)||e.has(`densityMode`)||e.has(`loading`)&&!this.loading)&&this.refreshVerdicts(),(e.has(`messages`)||e.has(`currentMailbox`)||e.has(`densityMode`)||e.has(`loading`)&&!this.loading)&&this.refreshPreviews(),e.has(`densityMode`)&&(this.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),this.classList.add(`density-${this.densityMode}`)),e.has(`syncing`)&&this.syncing&&(this.isSpinning=!0);let t=e.get(`selectedMessage`);if(e.has(`selectedMessage`)&&this.selectedMessage&&!(t&&this.isOpen(t))&&(this.selectionScrollTimer!==null&&clearTimeout(this.selectionScrollTimer),this.selectionScrollTimer=setTimeout(()=>{if(this.selectionScrollTimer=null,!this.isConnected)return;let e=this.renderRoot.querySelector(`.list-content`)?.querySelector(`.message-item.active`);e&&e.scrollIntoView(Se({behavior:`smooth`,block:`center`}))},50)),this._shouldScrollToTop&&(e.has(`messages`)||e.has(`loading`)&&!this.loading)){let e=this.renderRoot.querySelector(`.list-content`);e&&(e.scrollTop=0),this._shouldScrollToTop=!1}if(this._arrivedIndex!==-1){let e=this._arrivedIndex;this._arrivedIndex=-1;let t=this.renderRoot.querySelector(`.list-content`);e===0?t&&(t.scrollTop=0):t?.querySelectorAll(`.message-item`)[e]?.scrollIntoView({block:`nearest`})}let n=this.renderRoot.querySelector(`.list-content`);n&&requestAnimationFrame(()=>{this.checkScrollState(n)})}checkForNew(){let e=new Map;for(let t of this.messages||[]){let n=this.mailboxOf(t);e.set(n,Math.max(e.get(n)??0,Number(t.UID)||0))}this._uidsBeforeCheck=e,this.dispatchEvent(new CustomEvent(`refresh`))}selectMessage(e){this.selectedMessages.size>0&&this.setSelection(new Set),this.dispatchEvent(new CustomEvent(`select-message`,{detail:{message:e}}))}moveCursor(e){let t=this.visibleMessages;this.focusedIndex=e>0?Math.min(t.length-1,this.focusedIndex+1):Math.max(0,this.focusedIndex-1),this.scrollToFocused()}step(e){this.visibleMessages.length!==0&&(this.renderRoot.querySelector(`.list-content`)?.focus({preventScroll:!0}),this.moveCursor(e))}get focusedRowKeys(){let e=this.visibleMessages[this.focusedIndex];return e?this.rowKeys(e):[]}handleKeyDown(e){let t=this.visibleMessages;t&&t.length!==0&&(e.key===`ArrowDown`?(e.preventDefault(),this.moveCursor(1)):e.key===`ArrowUp`?(e.preventDefault(),this.moveCursor(-1)):e.key===`Enter`?(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length&&this.selectMessage(t[this.focusedIndex])):e.key===` `&&(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length&&(this.toggleRow(t[this.focusedIndex]),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused())))}get countsConversations(){return this.messages.some(e=>(e?.ThreadCount??0)>0)}get folderTitle(){return Ee(this.currentMailbox,this.i18nStore,this.mailboxes)}get emptyConfirmMessage(){let e=this.folderTitle,t=this.totalMessages,n=this.countsConversations?`messageList.emptyMailboxConfirmConversations`:`messageList.emptyMailboxConfirm`,r=this.i18nStore?.t(n,{folder:e,count:t})||(this.countsConversations?`Are you sure you want to permanently delete all ${t} conversations in ${e}, and every message in them? This action cannot be undone.`:`Are you sure you want to permanently delete all ${t} messages in ${e}? This action cannot be undone.`),i=this.selectedMessages.size;return i===0?r:`${r} ${this.i18nStore?.t(`messageList.emptyMailboxSelectionNote`,{count:i})||`This includes the ${i} messages you have checked.`}`}toast(e,t){this.dispatchEvent(new CustomEvent(`toast`,{detail:{type:e,message:t},bubbles:!0,composed:!0}))}async handleEmptyMailbox(){if(this.emptying)return;this.showEmptyConfirm=!1,this.emptying=!0;let e=this.currentMailbox,t=this.folderTitle;this.toast(`info`,this.i18nStore?.t(`messageList.emptyingMailbox`,{folder:t})||`Emptying ${t}...`);try{let n=await pa.emptyMailbox(e);n.ok&&n.discarded===0?this.toast(`info`,this.i18nStore?.t(`messageList.mailboxAlreadyEmpty`,{folder:t})||`${t} was already empty — nothing was deleted.`):n.ok?this.toast(`success`,this.i18nStore?.t(`messageList.mailboxEmptied`,{folder:t})||`${t} emptied.`):n.reason===`timeout`?this.toast(`error`,this.i18nStore?.t(`messageList.emptyMailboxSlow`,{folder:t})||`Still emptying ${t}. The server is working on it — check the folder again in a moment.`):n.reason!==`auth`&&this.toast(`error`,this.i18nStore?.t(`messageList.emptyMailboxFailed`,{folder:t})||`Failed to empty ${t}.`)}finally{this.emptying=!1}}scrollToFocused(){this.updateComplete.then(()=>{let e=this.renderRoot.querySelector(`.message-item.focused`);e&&e.scrollIntoView({block:`nearest`})})}get isDiscardableFolder(){let e=this.currentMailboxRole;return e!==`trash`&&e!==`junk`?!1:(te(e,this.mailboxes)??this.currentMailbox)===this.currentMailbox}get rowsAreCurrent(){return!this.listedMailbox||this.listedMailbox===this.currentMailbox}get rowMailbox(){return this.rowsAreCurrent?this.currentMailbox:this.listedMailbox}get rowRole(){return this.rowsAreCurrent?this.currentMailboxRole:this.listedMailboxRole}renderMessageItem(e,t=!1,r=!1,i=!1){if(t){let t=this.memberDetails.get(this.keyOf(e));t&&(e={...e,...t})}let a=this.rowRole,o=a===`drafts`||a===`sent`,s=this.rowMailbox===`*`,c=[];o?(c=[...e.Envelope?.To||[],...e.Envelope?.Cc||[]],c.length||(c=e.Envelope?.From||[])):c=[...e.Envelope?.From||[],...e.Envelope?.To||[],...e.Envelope?.Cc||[]];let l=new Set,u=[];for(let e of c){let t=(e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``)||e.Name||`unknown`;t!==`unknown`&&!l.has(t)?(l.add(t),u.push(e)):t===`unknown`&&u.push(e)}let d=Ie(this.settingsStore?.getState()).toLowerCase(),f=e=>{let t=e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``;return!!(d&&t===d)};if(u.length>1){let e=u.filter(e=>!f(e));e.length>0&&(u=e)}u.length||(u=[{}]);let p=o?`messageReader.noRecipients`:`messageList.unknownSender`,m=u.map((e,t)=>{let r=e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`:``,i=e.Name?b`<bdi>${e.Name}</bdi>${r&&ft(r).warning?b` &lt;${_t(r)}&gt;`:``}`:r?_t(r):this.i18nStore?.t(p)||this.i18nStore?.t(`messageList.unknown`);return b`${t?`, `:``}<span title=${r||n}>${i}${pt(r,this.i18nStore)}</span>`}),h=this.isMobile?1:3,g=u.slice(0,h),_=u.length-h,v=g.length+ +(_>0),y=e.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`),x=this.settingsStore?.getState()?.dateFormat||`auto`,ee=String(this.settingsStore?.getState()?.hourFormat||`auto`),S=e.Envelope?.Date?me(e.Envelope.Date,x,ee):``,C=e.RFC822Size||e.Size,w=C?ge(C,this.i18nStore):``,T=e.SubMessages&&e.SubMessages.length>0,te=this.isThreadExpanded(String(e.UID)),ne=this.rowSelection(e),re=e=>!e?.Flags||!e.Flags.includes(`\\Seen`),E=re(e)||!t&&!!T&&!te&&e.SubMessages.some(re),D=this.rowMessages(e).some(e=>e.Flags?.includes(V)),ie=e.Flags&&e.Flags.includes(`\\Answered`),O=e.Flags&&e.Flags.includes(`$Forwarded`),ae=qn(e.Flags,this.i18nStore),k=this.densityMode===`loose`?48:this.densityMode===`compact`?24:40;return this.densityMode===`ultra-compact`?b`
      <div class="message-item ${t?`sub-message-item`:``} ${r?`first-sub-item`:``} ${i?`last-sub-item`:``} ${this.selectedMessages.size===0&&this.isOpen(e)||ne!==`none`?`active`:``} ${E?`unread`:``} ${D?`starred`:``} ${this.focusedIndex===this.visibleMessages.indexOf(e)?`focused`:``} ${this.isDragged(e)?`is-dragging`:``}"
        draggable=${this.isMobile?`false`:`true`}
        @dragstart=${t=>this.handleDragStart(t,e)}
        @dragend=${this.endDrag}
        @click=${()=>this.selectMessage(e)}>
        <div class="checkbox-col" @click=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
          <input type="checkbox" class="message-checkbox" 
            .checked=${ne===`all`}
            .indeterminate=${ne===`some`}
            @click=${e=>e.stopPropagation()}
            @change=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
        </div>

        <!-- Caret Toggle Button -->
        ${!t&&T?b`
          <div class="caret-col" @click=${t=>this.toggleThreadCollapse(t,String(e.UID))}>
            ${P(te?`caretDown`:`caretRight`)}
            <span class="thread-count-caret-badge" title="${e.ThreadCount} messages">${e.ThreadCount}</span>
          </div>
        `:t?b`<div class="caret-col empty"></div>`:``}

        <div class="message-sender">${m}</div>
        <div @click=${t=>this.toggleStar(t,e)} class="star-btn ${D?`starred`:``} star-btn-wrapper-ultra">
          ${P(D?`starFourFill`:`starFour`)}
        </div>
        ${ie||O?b`
          <div class="indicators-wrapper-ultra">
            ${ie?b`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.replied`)}>${P(`arrowBendUpLeft`)}</div>`:``}
            ${O?b`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.forwarded`)}>${P(`arrowBendUpRight`)}</div>`:``}
          </div>
        `:``}
        ${ae.length>0?b`
          <div class="tag-pills">
            ${ae.map(e=>b`
              <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
            `)}
          </div>
        `:``}
        ${s&&e.Mailbox?b`
          <span class="mailbox-badge" title="Folder: ${e.Mailbox}">${e.Mailbox}</span>
        `:``}
        <div class="message-subject" dir="auto">
          ${y}
        </div>
        <div class="message-indicators">
          <div class="attachment-col">
            ${e.HasAttachments?b`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.hasAttachments`)}>${P(`paperclipHorizontal`)}</div>`:``}
          </div>
          <div class="message-date"><bdi>${S}</bdi></div>
        </div>
      </div>
      `:b`
    <div class="message-item ${t?`sub-message-item`:``} ${r?`first-sub-item`:``} ${i?`last-sub-item`:``} ${this.selectedMessages.size===0&&this.isOpen(e)||ne!==`none`?`active`:``} ${E?`unread`:``} ${D?`starred`:``} ${this.focusedIndex===this.visibleMessages.indexOf(e)?`focused`:``} ${this.isDragged(e)?`is-dragging`:``}"
        draggable=${this.isMobile?`false`:`true`}
        @dragstart=${t=>this.handleDragStart(t,e)}
        @dragend=${this.endDrag}
        @click=${()=>this.selectMessage(e)}>
      <div class="checkbox-col" @click=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
        <input type="checkbox" class="message-checkbox" 
          .checked=${ne===`all`}
          .indeterminate=${ne===`some`}
          @click=${e=>e.stopPropagation()}
          @change=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
      </div>

      <!-- Caret Toggle Button -->
      ${!t&&T?b`
        <div class="caret-col" @click=${t=>this.toggleThreadCollapse(t,String(e.UID))}>
          ${P(te?`caretDown`:`caretRight`)}
          <span class="thread-count-caret-badge" title="${e.ThreadCount} messages">${e.ThreadCount}</span>
        </div>
      `:t?b`<div class="caret-col empty"></div>`:``}

      ${this.showSenderAvatars?b`
        <div class="avatar-stack">
          ${g.map((t,n)=>{let r=t.Mailbox&&t.Host?`${t.Mailbox}@${t.Host}`:``,i=t.Name||r||this.i18nStore?.t(p)||this.i18nStore?.t(`messageList.unknown`),a=be(this.withVerdict(e),t);return b`
              <div class="avatar-wrapper" style="z-index: ${v-n};">
                <alps-avatar .name=${i} .email=${r} .size=${k} .src=${a}></alps-avatar>
              </div>
            `})}
          ${_>0?b`
            <div class="avatar-wrapper extra-count" style="width: ${k}px; height: ${k}px; z-index: 0;">
              +${_}
            </div>
          `:``}
        </div>
      `:``}
      <div class="message-details">
        <div class="message-header-row">
          <div class="message-header-inner">
            <div class="message-sender">${m}</div>
            <div @click=${t=>this.toggleStar(t,e)} class="star-btn ${D?`starred`:``}">
              ${P(D?`starFourFill`:`starFour`)}
            </div>
          </div>
          <div class="message-indicators">
            <div class="attachment-col">
              ${e.HasAttachments?b`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.hasAttachments`)}>${P(`paperclipHorizontal`)}</div>`:``}
            </div>
            <div class="message-date"><bdi>${S}</bdi></div>
          </div>
        </div>
        <div class="message-subject-row">
          ${ie||O?b`
            <div class="indicators-wrapper">
              ${ie?b`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.replied`)}>${P(`arrowBendUpLeft`)}</div>`:``}
              ${O?b`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.forwarded`)}>${P(`arrowBendUpRight`)}</div>`:``}
            </div>
          `:``}
          ${ae.length>0?b`
            <div class="tag-pills">
              ${ae.map(e=>b`
                <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
              `)}
            </div>
          `:``}
          ${s&&e.Mailbox?b`
            <span class="mailbox-badge" title="Folder: ${e.Mailbox}">${e.Mailbox}</span>
          `:``}
          <div class="message-subject" dir="auto">
            ${y}
          </div>
          ${w?b`<div class="message-size"><bdi>${w}</bdi></div>`:``}
        </div>
        ${this.renderPreview(e)}
      </div>
    </div>
    `}handleDragStart(e,t){let n=e.dataTransfer;if(!n)return;let r=this.rowKeys(t),i=r.some(e=>this.selectedMessages.has(e)),a=i?[...this.selectedMessages]:r,o={keys:a,selection:i},s=i&&this.selectAllMatching?this.matchingCount:a.length,c=s>1?this.i18nStore?.t(`messageList.dragCount`,{count:s})||`${s}`:t.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`)||``;n.setData(ma,JSON.stringify(o)),n.setData(`text/plain`,c),n.effectAllowed=`copyMove`,this.setDragImage(n,c),this.draggingKeys=a,window.addEventListener(`drop`,this.endDrag,!0),window.addEventListener(`dragend`,this.endDrag,!0)}setDragImage(e,t){if(typeof e.setDragImage!=`function`)return;let n=document.createElement(`div`);n.textContent=t,Object.assign(n.style,{position:`absolute`,top:`-1000px`,left:`-1000px`,maxWidth:`280px`,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`,padding:`6px 12px`,borderRadius:`16px`,background:`var(--accent-fill, #005A9E)`,color:`#fff`,font:`500 13px/1.4 var(--font-base, sans-serif)`,boxShadow:`0 4px 12px rgba(0, 0, 0, 0.18)`,pointerEvents:`none`}),n.dir=`auto`,document.body.appendChild(n),e.setDragImage(n,15,15),setTimeout(()=>n.remove(),0)}isDragged(e){return!!this.draggingKeys&&this.rowKeys(e).some(e=>this.draggingKeys.includes(e))}toggleStar(e,t){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-star-message`,{detail:{message:t,messages:this.rowMessages(t)}}))}get isTextSearch(){return this.filterQuery!==``&&!Ja.has(this.filterQuery)}render(){return b`
      ${this.isMobile?``:b`
        <alps-toolbar class="list-header" ?scrolled=${this.isScrolled}>
          <input type="checkbox" class="select-all-checkbox" title=${this.i18nStore?.t(`messageList.selectAll`)}
            .checked=${this.allOnPageSelected}
            @change=${this.handleSelectAll}>
          <alps-icon-btn 
            title=${this.i18nStore?.t(`messageList.checkNew`)}
            @click=${()=>this.checkForNew()}
            @animationiteration=${this.handleSpinIteration}
            ?spinning=${this.isSpinning}
            icon="arrowsClockwise"
          ></alps-icon-btn>
          <div class="header-divider"></div>
          <alps-icon-btn 
            title=${this.sortOrder===`asc`?this.i18nStore?.t(`messageList.sortDesc`):this.i18nStore?.t(`messageList.sortAsc`)}
            @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-sort`))} 
            icon=${this.sortOrder===`asc`?`sortAscending`:`sortDescending`}
          ></alps-icon-btn>
          <alps-icon-btn 
            @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-filter-starred`))} 
            title=${this.i18nStore?.t(`messageList.filterStarred`)}
            icon=${this.filterQuery===`is:starred`?`starFourFill`:`starFour`}
            ?active=${this.filterQuery===`is:starred`}
          ></alps-icon-btn>
          <alps-icon-btn 
            @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-filter-unread`))} 
            title=${this.i18nStore?.t(`messageList.filterUnread`)}
            icon="envelopeUnread"
            ?active=${this.filterQuery===`is:unread`}
          ></alps-icon-btn>
          ${this.sidebarCollapsed?b`
            <div class="current-mailbox-label">
              ${this.folderTitle}
            </div>
          `:``}
          <alps-pagination 
            .currentPage=${this.listedPage} 
            .totalItems=${this.totalMessages} 
            .itemsPerPage=${this.messagesPerPage}
            .currentCount=${this.messages.length}
            .isSearch=${this.isTextSearch}>
          </alps-pagination>
        </alps-toolbar>
      `}
      <div class="list-content ${this.loading&&this.messages.length>0?`loading-overlay`:``}" tabindex="0" @scroll=${this.handleScroll} @keydown=${this.handleKeyDown}>
        ${this.filterQuery?b`
          <alps-banner>
            <span>${this.i18nStore?.t(`messageList.searchResultsFor`)} <strong>${this.filterQuery}</strong></span>
            ${this.currentMailbox!==`*`&&this.settingsStore?.getState()?.hasESearchCapability?b`
              <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:this.filterQuery,global:!0},bubbles:!0,composed:!0}))}>
                ${this.i18nStore?.t(`messageList.searchAllMailboxes`)||`Search All Mailboxes`}
              </alps-button>
            `:``}
            <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`clear-search`))}>
              ${this.i18nStore?.t(`messageList.clearSearch`)}
            </alps-button>
          </alps-banner>
        `:``}
        ${this.selectAllMatching?b`
          <alps-banner>
            <span>${this.i18nStore?.t(`messageList.allMatchingSelected`,{count:this.matchingCount,folder:this.folderTitle})}</span>
            <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`clear-selection`))}>
              ${this.i18nStore?.t(`messageList.clearSelection`)}
            </alps-button>
          </alps-banner>
        `:this.selectedMessages.size>0&&this.allOnPageSelected&&this.canSelectAllMatching?b`
          <alps-banner>
            <span>${this.i18nStore?.t(`messageList.allOnPageSelected`,{count:this.pageKeys.length})}</span>
            <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`select-all-matching`))}>
              ${this.i18nStore?.t(`messageList.selectAllMatching`,{count:this.totalMessages,folder:this.folderTitle})}
            </alps-button>
          </alps-banner>
        `:``}
        ${!this.filterQuery&&this.isDiscardableFolder&&this.totalMessages>0&&this.rowsAreCurrent?b`
          <alps-banner variant="warning">
            <span>${this.i18nStore?.t(this.countsConversations?`messageList.totalConversationsIn`:`messageList.totalMessagesIn`,{count:this.totalMessages,folder:this.folderTitle})||`${this.totalMessages} total ${this.countsConversations?`conversations`:`messages`} in ${this.folderTitle}`}</span>
            <alps-button slot="action" variant="normal"
              ?spinning=${this.emptying}
              @click=${()=>this.showEmptyConfirm=!0}>
              ${this.i18nStore?.t(`messageList.deleteAllNow`)||`Delete All Now`}
            </alps-button>
          </alps-banner>
        `:``}
        ${this.loading&&this.messages.length===0?b`
          <alps-loader full-height .text=${this.i18nStore?.t(`messageList.loading`)||`Loading...`}></alps-loader>
        `:this.messages.length===0&&this.loadFailed?b`<div class="empty-state load-error">
          <div>${this.i18nStore?.t(this.loadLimited?`messageList.searchLimited`:`messageList.loadError`)}</div>
          <alps-button variant="normal" @click=${()=>this.checkForNew()}>
            ${this.i18nStore?.t(`messageList.loadErrorRetry`)}
          </alps-button>
        </div>`:this.messages.length===0?b`<div class="empty-state">${this.i18nStore?.t(`messageList.noMessages`)}</div>`:g(this.messages,e=>this.keyOf(e),e=>b`
            ${this.renderMessageItem(e,!1)}
            ${e.SubMessages&&e.SubMessages.length>0&&this.isThreadExpanded(String(e.UID))?e.SubMessages.map((t,n)=>this.renderMessageItem(t,!0,n===0,n===e.SubMessages.length-1)):``}
          `)}
      </div>
      ${this.isMobile&&this.messages.length>0?b`
        <div class="mobile-bottom-header ${this.isAtBottom?`at-bottom`:``}">
          ${this.selectedMessages.size>0?b`
            <slot name="mobile-bulk-actions"></slot>
          `:b`
            <div class="mobile-bottom-actions">
              <input type="checkbox" class="select-all-checkbox" title=${this.i18nStore?.t(`messageList.selectAll`)}
                .checked=${this.allOnPageSelected}
                @change=${this.handleSelectAll}>
              <alps-icon-btn 
                title=${this.i18nStore?.t(`messageList.checkNew`)}
                @click=${()=>this.checkForNew()}
                @animationiteration=${this.handleSpinIteration}
                ?spinning=${this.isSpinning}
                icon="arrowsClockwise"
              ></alps-icon-btn>
              <div class="header-divider"></div>
              <alps-icon-btn 
                title=${this.sortOrder===`asc`?this.i18nStore?.t(`messageList.sortDesc`):this.i18nStore?.t(`messageList.sortAsc`)}
                @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-sort`))} 
                icon=${this.sortOrder===`asc`?`sortAscending`:`sortDescending`}
              ></alps-icon-btn>
              <alps-icon-btn 
                @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-filter-starred`))} 
                title=${this.i18nStore?.t(`messageList.filterStarred`)}
                icon=${this.filterQuery===`is:starred`?`starFourFill`:`starFour`}
                ?active=${this.filterQuery===`is:starred`}
              ></alps-icon-btn>
              <alps-icon-btn 
                @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-filter-unread`))} 
                title=${this.i18nStore?.t(`messageList.filterUnread`)}
                icon="envelopeUnread"
                ?active=${this.filterQuery===`is:unread`}
              ></alps-icon-btn>
            </div>

            <alps-pagination 
              .currentPage=${this.listedPage} 
              .totalItems=${this.totalMessages} 
              .itemsPerPage=${this.messagesPerPage}
              .currentCount=${this.messages.length}
              .isSearch=${this.isTextSearch}>
            </alps-pagination>
          `}
        </div>
      `:``}
      ${this.showEmptyConfirm?b`
        <ui-confirm
          heading=${this.i18nStore?.t(`messageList.emptyMailboxTitle`,{folder:this.folderTitle})||`Empty ${this.folderTitle}`}
          message=${this.emptyConfirmMessage}
          confirmText=${this.i18nStore?.t(`messageList.deleteAllNow`)||`Delete All Now`}
          .isDanger=${!0}
          @confirm=${this.handleEmptyMailbox}
          @cancel=${()=>this.showEmptyConfirm=!1}
        ></ui-confirm>
      `:``}
    `}};N([s({context:Be})],K.prototype,`settingsStore`,void 0),N([s({context:A})],K.prototype,`i18nStore`,void 0),N([_({type:Array})],K.prototype,`messages`,void 0),N([_({type:String})],K.prototype,`currentMailbox`,void 0),N([_({type:Array})],K.prototype,`mailboxes`,void 0),N([_({type:String})],K.prototype,`currentMailboxRole`,void 0),N([_({type:String})],K.prototype,`listedMailbox`,void 0),N([_({type:Number})],K.prototype,`listedUIDValidity`,void 0),N([_({type:String})],K.prototype,`listedMailboxRole`,void 0),N([_({type:Boolean})],K.prototype,`loading`,void 0),N([_({type:Object})],K.prototype,`selectedMessage`,void 0),N([_({type:String})],K.prototype,`layoutMode`,void 0),N([_({type:Boolean})],K.prototype,`isMobile`,void 0),N([_({type:Boolean})],K.prototype,`sidebarCollapsed`,void 0),N([_({type:Number})],K.prototype,`currentPage`,void 0),N([_({type:Number})],K.prototype,`listedPage`,void 0),N([_({type:Number})],K.prototype,`totalMessages`,void 0),N([_({type:Number})],K.prototype,`messagesPerPage`,void 0),N([_({type:String})],K.prototype,`filterQuery`,void 0),N([_({type:String})],K.prototype,`sortOrder`,void 0),N([_({type:String})],K.prototype,`densityMode`,void 0),N([_({type:Boolean})],K.prototype,`showSenderAvatars`,void 0),N([_({type:Object})],K.prototype,`selectedMessages`,void 0),N([_({type:Boolean})],K.prototype,`selectAllMatching`,void 0),N([_({type:Number})],K.prototype,`matchingCount`,void 0),N([_({type:Boolean})],K.prototype,`syncing`,void 0),N([_({type:Boolean})],K.prototype,`loadFailed`,void 0),N([_({type:Boolean})],K.prototype,`loadLimited`,void 0),N([d()],K.prototype,`isSpinning`,void 0),N([d()],K.prototype,`isScrolled`,void 0),N([d()],K.prototype,`isAtBottom`,void 0),N([d()],K.prototype,`focusedIndex`,void 0),N([d()],K.prototype,`showEmptyConfirm`,void 0),N([d()],K.prototype,`emptying`,void 0),N([d()],K.prototype,`expandedThreads`,void 0),N([d()],K.prototype,`memberDetails`,void 0),N([d()],K.prototype,`draggingKeys`,void 0),N([d()],K.prototype,`verdicts`,void 0),N([d()],K.prototype,`previews`,void 0),K=N([o(`alps-message-list`)],K);var Xa=class extends c{constructor(...e){super(...e),this.name=``,this.address=``,this._handleI18nChange=()=>this.requestUpdate()}connectedCallback(){super.connectedCallback(),this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}static{this.styles=[dt,y`
    :host {
      display: inline;
    }
    
    .recipient-link {
      display: inline;
      color: var(--text-color);
      text-decoration: none;
      cursor: pointer;
    }

    .recipient-link:hover {
      text-decoration: underline;
    }

    .recipient-name {
      font-weight: 500;
    }

    .recipient-address {
      color: var(--text-muted);
    }
  `]}handleClick(){this.composeStore.openComposer({to:[this.address]})}render(){let e=this.name;e===this.address&&(e=``);let t=_t(this.address),n=pt(this.address,this.i18nStore);return e?b`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          <bdi class="recipient-name">${e}</bdi>
          <span class="recipient-address">&lt;${t}&gt;</span>${n}
        </a>
      `:b`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          ${t}${n}
        </a>
      `}};N([s({context:ta})],Xa.prototype,`composeStore`,void 0),N([s({context:A})],Xa.prototype,`i18nStore`,void 0),N([_({type:String})],Xa.prototype,`name`,void 0),N([_({type:String})],Xa.prototype,`address`,void 0),Xa=N([o(`alps-recipient-pill`)],Xa);function Za(e,t,n){if(!e||t===void 0||t===``||!n)return``;let r=Array.isArray(n.Path)?n.Path.join(`.`):String(n.Path??``);return r?`/mailboxes/${k(e)}/messages/${t}/raw?part=${r}`:``}var Qa=new Set([`png`,`jpg`,`jpeg`,`gif`,`webp`,`svg`,`avif`,`bmp`,`ico`,`tiff`,`tif`,`heic`,`heif`]),$a=new Set([`pdf`]),eo=new Set([`doc`,`docx`,`odt`,`rtf`,`pages`,`dotx`,`docm`]),to=new Set([`xls`,`xlsx`,`csv`,`tsv`,`ods`,`numbers`,`xlsm`]),no=new Set([`ppt`,`pptx`,`odp`,`key`,`potx`,`ppsx`]),ro=new Set([`zip`,`tar`,`gz`,`rar`,`7z`,`bz2`,`xz`,`tgz`,`iso`,`dmg`,`pkg`,`deb`,`rpm`]),io=new Set(`js.mjs.cjs.ts.mts.cts.jsx.tsx.json.json5.html.htm.css.scss.sass.less.py.go.rs.c.cpp.h.hpp.java.kt.sh.bash.zsh.yml.yaml.sql.xml.md.markdown.toml.ini.env.diff.patch.php.rb.swift.graphql.gql.proto.vue.svelte.rust`.split(`.`)),ao=new Set([`txt`,`text`,`log`,`nfo`,`sub`,`srt`]),oo=new Set([`mp3`,`wav`,`ogg`,`m4a`,`flac`,`aac`,`wma`,`aiff`,`opus`,`mid`,`midi`]),so=new Set([`mp4`,`webm`,`mov`,`mkv`,`avi`,`wmv`,`flv`,`m4v`,`3gp`,`ogv`]),co=new Set([`ics`,`ical`,`ifb`]),lo=new Set([`vcf`,`vcard`]);function uo(e){if(!e)return``;let t=e.lastIndexOf(`.`);return t===-1||t===e.length-1?``:e.slice(t+1).toLowerCase()}function fo(e,t){let n=(e||``).toLowerCase().trim(),r=uo(t);if(n===`application/pdf`||$a.has(r))return{category:`pdf`,icon:`filePdf`,themeClass:`type-pdf`,color:`#ef4444`,previewKind:`pdf`,isImage:!1,isPdf:!0,isAudio:!1,isVideo:!1,isPreviewable:!0};if(n.startsWith(`image/`)||Qa.has(r))return{category:`image`,icon:`image`,themeClass:`type-image`,color:`#10b981`,previewKind:`image`,isImage:!0,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0};if(n.startsWith(`audio/`)||oo.has(r))return{category:`audio`,icon:`fileAudio`,themeClass:`type-audio`,color:`#f59e0b`,previewKind:`audio`,isImage:!1,isPdf:!1,isAudio:!0,isVideo:!1,isPreviewable:!0};if(n.startsWith(`video/`)||so.has(r))return{category:`video`,icon:`fileVideo`,themeClass:`type-video`,color:`#f43f5e`,previewKind:`video`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!0,isPreviewable:!0};if(io.has(r)||n===`application/json`||n===`application/ld+json`||n===`application/xml`||n===`application/javascript`||n===`text/javascript`||n===`text/css`||n===`text/html`||n===`text/markdown`||n===`text/x-python`||n===`text/x-shellscript`)return{category:`code`,icon:`fileCode`,themeClass:`type-code`,color:`#8b5cf6`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0};if(to.has(r)||n.includes(`spreadsheet`)||n.includes(`excel`)||n===`text/csv`||n===`text/tab-separated-values`){let e=r===`csv`||r===`tsv`||n===`text/csv`||n===`text/tab-separated-values`;return{category:`spreadsheet`,icon:`fileXls`,themeClass:`type-spreadsheet`,color:`#059669`,previewKind:e?`text`:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:e}}return eo.has(r)||n.includes(`word`)||n.includes(`officedocument.wordprocessingml`)||n===`application/rtf`?{category:`document`,icon:`fileDoc`,themeClass:`type-document`,color:`#3b82f6`,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}:no.has(r)||n.includes(`presentation`)||n.includes(`powerpoint`)?{category:`presentation`,icon:`filePpt`,themeClass:`type-presentation`,color:`#f59e0b`,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}:ro.has(r)||n.includes(`zip`)||n.includes(`tar`)||n.includes(`compressed`)||n.includes(`archive`)?{category:`archive`,icon:`fileArchive`,themeClass:`type-archive`,color:`#64748b`,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}:co.has(r)||n===`text/calendar`?{category:`calendar`,icon:`calendarBlank`,themeClass:`type-calendar`,color:`#0ea5e9`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0}:lo.has(r)||n===`text/vcard`||n===`text/x-vcard`?{category:`contact`,icon:`user`,themeClass:`type-contact`,color:`#14b8a6`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0}:ao.has(r)||n.startsWith(`text/`)?{category:`text`,icon:`fileText`,themeClass:`type-text`,color:`#6b7280`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0}:{category:`generic`,icon:`file`,themeClass:`type-generic`,color:``,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}}var po=1<<20,mo=class extends c{constructor(...e){super(...e),this.attachment=null,this.downloadUrl=``,this.fallbackName=`Unknown attachment`,this.removable=!1,this.compact=!1,this.imgError=!1}willUpdate(e){e.has(`attachment`)&&(this.imgError=!1)}static{this.styles=[j,y`
    .attachment-chip {
      display: inline-flex;
      align-items: center;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      gap: 8px;
      /* The type square sits as far from the border as it does from the top. */
      padding: 4px;
      padding-inline-end: 8px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--bg-primary);
      color: var(--text-color);
      text-decoration: none;
      font-size: 13px;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .progress-bar {
      position: absolute;
      inset-inline-start: 0;
      top: 0;
      bottom: 0;
      /* A tint of the theme's accent. It was --bg-selected at 30%: #EFF6FF
         over a white pill, a fill drawn at the right width that nobody could
         see. 18% is what the palest accent, ocean-light's, needs to stand out
         from its pill; attachment-pill-progress.test.ts checks every theme. */
      background: color-mix(in srgb, var(--accent-color, #2563eb) 18%, transparent);
      transition: width 0.1s linear;
      pointer-events: none;
      z-index: 0;
    }

    .attachment-icon, .attachment-name, .attachment-size, .remove-btn {
      position: relative;
      z-index: 1;
    }

    :host([compact]) .attachment-chip {
      padding: 2px 4px;
      border-radius: 4px;
      gap: 6px;
    }

    .attachment-icon {
      color: var(--text-muted);
      flex-shrink: 0;
      display: flex;
    }

    .icon {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    :host([compact]) .icon {
      width: 16px;
      height: 16px;
    }

    .attachment-name {
      font-weight: 500;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :host([compact]) .attachment-name {
      flex: 1 auto;
      font-size: 12px;
    }

    .attachment-size {
      font-size: 12px;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    :host([compact]) .attachment-size {
      font-size: 11px;
    }

    /* A file whose upload the server no longer holds: it has to be added again. */
    .attachment-size.missing {
      color: var(--error, #ef4444);
    }

    .remove-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3px;
      border-radius: 4px;
      margin-inline-end: -4px;
    }

    .remove-btn:hover {
      color: var(--text-color);
    }

    .remove-btn .icon {
      width: 14px;
      height: 14px;
    }

    .attachment-chip { cursor: pointer; }

    .attachment-thumb {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      position: relative;
      z-index: 1;
    }
    .attachment-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .attachment-icon.typed {
      width: 22px;
      height: 22px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    :host([compact]) .attachment-thumb,
    :host([compact]) .attachment-icon.typed {
      width: 18px;
      height: 18px;
    }
    .preview-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3px;
      border-radius: 4px;
      position: relative;
      z-index: 1;
    }
    .preview-btn:hover {
      color: var(--text-primary);
      background: var(--bg-secondary);
    }
    .preview-btn .icon {
      width: 14px;
      height: 14px;
    }
  `]}get name(){let e=this.attachment;return e.Filename||e.filename||e.name||this.fallbackName}typeInfo(){let e=this.attachment;return fo(e.MIMEType||e.contentType||e.type,this.name)}uploadProgress(e,t){return this.i18nStore?.t(`attachment.uploadProgress`,{percent:e,size:ge(t,this.i18nStore)})||`${e}% of ${ge(t,this.i18nStore)}`}_handlePreview(e){!this.removable&&this.downloadUrl&&this.typeInfo().isPreviewable&&(e.preventDefault(),e.stopPropagation(),this.dispatchEvent(new CustomEvent(`preview-attachment`,{bubbles:!0,composed:!0,detail:{attachment:this.attachment}})))}_handleRemove(e){e.preventDefault(),e.stopPropagation(),this.dispatchEvent(new CustomEvent(`remove-attachment`,{bubbles:!0,composed:!0,detail:{attachment:this.attachment}}))}render(){if(!this.attachment)return b``;let e=this.name,t=this.attachment.Size||this.attachment.size||0,n=this.attachment.uploading,r=this.attachment.progress||0,i=this.typeInfo(),a=!this.removable&&!!this.downloadUrl&&i.isPreviewable,o=i.isImage&&this.downloadUrl&&!this.imgError&&t<=po,s=b`
      ${n?b`<div class="progress-bar" style="width: ${r}%"></div>`:``}
      ${o?b`
        <div class="attachment-thumb">
          <img src="${this.downloadUrl}" alt="" loading="lazy" @error=${()=>{this.imgError=!0}} />
        </div>
      `:b`
        <div
          class="attachment-icon typed ${i.themeClass}"
          style="${i.color?`color: ${i.color}; background: color-mix(in srgb, ${i.color} 12%, transparent)`:``}"
        >${P(i.icon)}</div>
      `}
      <span class="attachment-name"><bdi>${e}</bdi></span>
      ${this.attachment.missing?b`
        <span class="attachment-size missing">${this.i18nStore?.t(`attachment.addAgain`)}</span>
      `:b`
        <span class="attachment-size"><bdi>${n?this.uploadProgress(r,t):ge(t,this.i18nStore)}</bdi></span>
      `}
      ${a?b`
        <button class="preview-btn" @click=${this._handlePreview} title="${this.i18nStore?.t(`attachment.preview`)}">
          ${P(`eye`)}
        </button>
      `:``}
      ${this.removable?b`
        <button class="remove-btn" @click=${this._handleRemove} title="${this.i18nStore?.t(`attachment.remove`)}">
          ${P(`x`)}
        </button>
      `:``}
    `;return this.downloadUrl?b`
        <a href="${this.downloadUrl}" download="${e}" class="attachment-chip" title="${e}" @click=${this._handlePreview}>
          ${s}
        </a>
      `:b`
        <div class="attachment-chip" title="${e}">
          ${s}
        </div>
      `}};N([s({context:A})],mo.prototype,`i18nStore`,void 0),N([_({type:Object})],mo.prototype,`attachment`,void 0),N([_({type:String})],mo.prototype,`downloadUrl`,void 0),N([_({type:String})],mo.prototype,`fallbackName`,void 0),N([_({type:Boolean})],mo.prototype,`removable`,void 0),N([_({type:Boolean,reflect:!0})],mo.prototype,`compact`,void 0),N([d()],mo.prototype,`imgError`,void 0),mo=N([o(`alps-attachment-pill`)],mo);var ho=class extends c{constructor(...e){super(...e),this.attachments=[],this.mailbox=w,this.messageUid=``,this.removable=!1,this.composerMode=!1,this.totalBytes=0,this.maxBytes=0,this.attachmentsExpanded=!0,this.trayObserver=null,this.observedWrapper=null,this.reportedHeight=-1,this._reportTrayHeight=()=>{if(!this.composerMode)return;let e=this.shadowRoot?.querySelector(`.attachments-container`),t=0;if(e){let n=getComputedStyle(e),r=(parseFloat(n.borderTopWidth)||0)+(parseFloat(n.borderBottomWidth)||0),i=(parseFloat(n.paddingTop)||0)+(parseFloat(n.paddingBottom)||0),a=e.scrollHeight+r,o=parseFloat(n.maxHeight);t=Number.isFinite(o)?Math.min(a,o+(n.boxSizing===`border-box`?0:i+r)):a}t=Math.ceil(t),t!==this.reportedHeight&&(this.reportedHeight=t,this.dispatchEvent(new CustomEvent(`tray-height`,{detail:{height:t}})))},this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this._reportTrayHeight),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this._reportTrayHeight),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.trayObserver?.disconnect(),this.trayObserver=null,this.observedWrapper=null}updated(){if(!this.composerMode)return;let e=this.shadowRoot?.querySelector(`.attachments-wrapper`)??null;e!==this.observedWrapper&&typeof ResizeObserver<`u`&&(this.trayObserver??=new ResizeObserver(()=>this._reportTrayHeight()),this.observedWrapper&&this.trayObserver.unobserve(this.observedWrapper),e&&this.trayObserver.observe(e),this.observedWrapper=e),this._reportTrayHeight()}_sizeFigure(){let e=e=>ge(e,this.i18nStore);if(this.composerMode)return this.maxBytes>0?`${e(this.totalBytes)} / ${e(this.maxBytes)}`:``;let t=this.attachments.reduce((e,t)=>e+(t.Size||t.size||0),0);return t>0?e(t):``}get resolvedMailbox(){if(this.mailbox)return this.mailbox;let e=window.location.hash.match(/^#\/mailbox\/([^/]+)/);return e?decodeURIComponent(e[1]):w}_openPreview(e){window.dispatchEvent(new CustomEvent(`open-attachment-preview`,{detail:{attachments:this.attachments,mailbox:this.resolvedMailbox,messageUid:this.messageUid,index:e}}))}toggleAttachments(){this.attachmentsExpanded=!this.attachmentsExpanded}_downloadAll(e){if(e.stopPropagation(),!this.attachments||this.attachments.length===0||!this.messageUid)return;let t=this.resolvedMailbox;this.attachments.forEach((e,n)=>{let r=Za(t,this.messageUid,e);r&&setTimeout(()=>{let t=document.createElement(`a`);t.href=r,t.download=e.Filename||this.i18nStore?.t(`messageReader.unknownAttachment`)||`attachment`,document.body.appendChild(t),t.click(),document.body.removeChild(t)},n*200)})}static{this.styles=[j,y`
    :host {
      display: block;
      width: 100%;
    }

    .attachments-container {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);
      flex-shrink: 0;
      max-height: 30vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .attachments-header {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
    }

    .attachments-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .attachments-header:hover {
      color: var(--text-color);
    }

    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .attachments-header .icon {
      width: 16px;
      height: 16px;
      transition: transform 0.3s ease;
    }

    .attachments-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .download-all-btn {
      width: 16px;
      height: 16px;
      fill: currentColor;
      transition: transform 0.2s ease, color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }

    .download-all-btn:hover {
      color: var(--text-color);
      transform: translateY(-1px);
    }

    .attachments-wrapper {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.3s ease-out, margin 0.3s ease-out;
      margin: 0;
    }

    .attachments-wrapper.expanded {
      grid-template-rows: 1fr;
      margin-top: 12px;
    }

    .caret {
      transition: transform 0.3s ease;
    }

    .attachments-container.is-expanded .caret {
      transform: rotate(180deg);
    }

    .attachments-container.is-closed .caret {
      transform: rotate(0deg);
    }

    :host([composermode]) .attachments-container.is-expanded .caret {
      transform: rotate(0deg);
    }

    :host([composermode]) .attachments-container.is-closed .caret {
      transform: rotate(180deg);
    }

    .attachments-list {
      min-height: 0;
      overflow: hidden;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px;
    }

    /* The composer's tray stops at four rows of pills and half of a fifth, so
       one that scrolls shows it does. Uncapped, it took the message body's
       room row by row, down to nothing. */
    :host([composermode]) .attachments-container {
      border-bottom: none;
      border-top: 1px solid var(--border-color);
      padding: 8px 16px;
      max-height: min(30vh, 186px);
    }

    :host([composermode]) .attachments-list {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 8px;
    }

    :host([composermode]) .attachments-header {
      font-size: 11px;
    }

    /* In the composer the tray gives way before the message body does: where
       the window cannot grow by the tray's height, the host shrinks and the
       container scrolls, rather than squeezing the body out of sight. */
    :host([composermode]) {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    :host([composermode]) .attachments-container {
      min-height: 0;
      flex-shrink: 1;
    }

    :host([composermode]) .attachments-header,
    :host([composermode]) .attachments-wrapper {
      flex-shrink: 0;
    }

    /* The header stays put while the pills scroll under it, so the size figure
       and the caret stay in reach. The pills lift their contents with z-index,
       which would paint them over the header as they pass under it. */
    :host([composermode]) .attachments-wrapper {
      isolation: isolate;
    }

    :host([composermode]) .attachments-header {
      position: sticky;
      top: -8px;
      z-index: 1;
      margin: -8px 0 0;
      padding: 8px 0 0;
      background: var(--bg-secondary);
    }

    .attachments-size {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .attachments-size.over {
      color: var(--error, #ef4444);
    }

    @media (max-width: 768px) {
      .attachments-container {
        border-bottom: none;
        border-top: 1px solid var(--border-color);
      }

      .attachments-container.is-expanded .caret {
        transform: rotate(0deg);
      }

      .attachments-container.is-closed .caret {
        transform: rotate(180deg);
      }

      .attachments-list {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }
    }
  `]}render(){if(!this.attachments||this.attachments.length===0)return b``;let e=this._sizeFigure();return b`
      <div class="attachments-container ${this.attachmentsExpanded?`is-expanded`:`is-closed`}">
        <div class="attachments-header" @click=${this.toggleAttachments}>
          <div class="attachments-title">
            <span>${this.i18nStore?.t(`messageReader.attachments`)} (${this.attachments.length})</span>
          </div>
          <div class="attachments-actions">
            ${e?b`
              <span class="attachments-size ${this.composerMode&&this.totalBytes>this.maxBytes?`over`:``}"
                ><bdi>${e}</bdi></span>
            `:``}
            ${this.composerMode?``:b`
              <div 
                class="download-all-btn" 
                title=${this.i18nStore?.t(`messageReader.downloadAllAttachments`)} 
                @click=${this._downloadAll}
              >
                ${P(`downloadSimple`)}
              </div>
            `}
            <div class="icon caret">
              ${P(`caretDown`)}
            </div>
          </div>
        </div>
        <div class="attachments-wrapper ${this.attachmentsExpanded?`expanded`:``}">
          <div class="attachments-list">
            ${this.attachments.map((e,t)=>{let n=this.messageUid?Za(this.resolvedMailbox,this.messageUid,e):``;return b`
                <alps-attachment-pill
                  .attachment=${e}
                  .downloadUrl=${n}
                  .fallbackName=${this.i18nStore?.t(`messageReader.unknownAttachment`)}
                  .removable=${this.removable}
                  .compact=${this.composerMode}
                  @preview-attachment=${e=>{e.stopPropagation(),this._openPreview(t)}}
                ></alps-attachment-pill>
              `})}
          </div>
        </div>
      </div>
    `}};N([s({context:A})],ho.prototype,`i18nStore`,void 0),N([_({type:Array})],ho.prototype,`attachments`,void 0),N([_({type:String})],ho.prototype,`mailbox`,void 0),N([_({type:String})],ho.prototype,`messageUid`,void 0),N([_({type:Boolean})],ho.prototype,`removable`,void 0),N([_({type:Boolean,reflect:!0})],ho.prototype,`composerMode`,void 0),N([_({type:Number})],ho.prototype,`totalBytes`,void 0),N([_({type:Number})],ho.prototype,`maxBytes`,void 0),N([d()],ho.prototype,`attachmentsExpanded`,void 0),ho=N([o(`alps-attachment-list`)],ho);var go=class extends c{constructor(...e){super(...e),this.mailboxes=[],this.currentMailbox=``,this.noActionBox=!1,this.noSearchBox=!1,this.filterQuery=``,this.isMove=!0}static{this.styles=[j,y`
    :host {
      display: inline-block;
    }

    alps-popup {
      display: block;
      width: 100%;
    }

    .selector-container {
      display: flex;
      flex-direction: column;
      width: 240px;
    }

    .search-box {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .action-box {
      padding: 10px 12px 6px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      background-color: var(--bg-secondary, #f9fafb);
      display: flex;
      flex-direction: row;
      gap: 16px;
      margin-top: -4px; /* offset popup padding at top */
      border-radius: 6px 6px 0 0;
    }

    .action-box label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary, #111827);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      user-select: none;
    }

    .search-input {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 4px;
      font-size: 13px;
      box-sizing: border-box;
      outline: none;
    }

    /* Forced colors drop the border colour and give the transparent outline
       a system colour. */
    .search-input:focus {
      border-color: var(--accent-color, #005A9E);
      outline: 2px solid transparent;
    }

    .folder-list {
      max-height: 250px;
      overflow-y: auto;
      padding: 4px 0 0 0;
      margin-bottom: -4px; /* offset the bottom padding of the popup */
    }

    .folder-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      height: 36px;
      padding: 0 12px;
      box-sizing: border-box;
      font-size: 13px;
      color: var(--text-primary, #111827);
      background: none;
      border: none;
      cursor: pointer;
      text-align: start;
      transition: background-color 0.2s;
    }

    .folder-item:hover {
      background-color: var(--hover-color, #f3f4f6);
    }

    .folder-item svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
      color: var(--text-secondary, #4b5563);
      flex-shrink: 0;
    }

    .folder-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .no-results {
      padding: 12px;
      text-align: center;
      font-size: 13px;
      color: var(--text-muted, #6b7280);
      font-style: italic;
    }

    input[type="radio"] {
      cursor: pointer;
      margin: 0;
    }
  `]}_handleFilter(e){let t=e.target;this.filterQuery=t.value.toLowerCase()}_handleSelect(e){this.popup&&this.popup.close(),this.dispatchEvent(new CustomEvent(`folder-selected`,{detail:{folderName:e,isMove:this.isMove},bubbles:!0,composed:!0}))}_handlePopupToggle(){this.filterQuery=``,setTimeout(()=>{this.filterInput&&this.filterInput.focus()},50)}render(){let e=this.mailboxes.filter(e=>ne(e,`i`)).map(e=>e.Name||e.Mailbox||``).filter(e=>e!==``&&e!==this.currentMailbox).map(e=>({name:e,caption:fe(e,this.i18nStore,this.mailboxes)})).filter(({name:e,caption:t})=>e.toLowerCase().includes(this.filterQuery)||t.toLowerCase().includes(this.filterQuery));return b`
      <alps-popup align="end" @click=${this._handlePopupToggle}>
        <slot name="trigger" slot="trigger"></slot>
        
        <div class="selector-container" @click=${e=>e.stopPropagation()}>
          ${this.noActionBox?``:b`
          <div class="action-box">
            <label>
              <input 
                type="radio" 
                name="folderAction"
                .checked=${this.isMove}
                @change=${()=>this.isMove=!0}
              />
              ${this.i18nStore?.t(`folderSelector.actionMove`)}
            </label>
            <label>
              <input 
                type="radio" 
                name="folderAction"
                .checked=${!this.isMove}
                @change=${()=>this.isMove=!1}
              />
              ${this.i18nStore?.t(`folderSelector.actionCopy`)}
            </label>
          </div>
          `}
          
          ${this.noSearchBox?``:b`
            <div class="search-box">
              <input 
                type="text" 
                class="search-input" 
                placeholder=${this.i18nStore?.t(`folderSelector.filter`)}
                .value=${this.filterQuery}
                @input=${this._handleFilter}
              />
            </div>
          `}
          
          <div class="folder-list">
            ${e.length>0?e.map(({name:e,caption:t})=>b`
              <button class="folder-item" title=${e} @click=${()=>this._handleSelect(e)}>
                ${P(`folder`)}
                <span class="folder-name"><bdi>${t}</bdi></span>
              </button>
            `):b`
              <div class="no-results">${this.i18nStore?.t(`folderSelector.noResults`)}</div>
            `}
          </div>
        </div>
      </alps-popup>
    `}};N([s({context:A})],go.prototype,`i18nStore`,void 0),N([_({type:Array})],go.prototype,`mailboxes`,void 0),N([_({type:String})],go.prototype,`currentMailbox`,void 0),N([_({type:Boolean})],go.prototype,`noActionBox`,void 0),N([_({type:Boolean})],go.prototype,`noSearchBox`,void 0),N([d()],go.prototype,`filterQuery`,void 0),N([d()],go.prototype,`isMove`,void 0),N([a(`alps-popup`)],go.prototype,`popup`,void 0),N([a(`input`)],go.prototype,`filterInput`,void 0),go=N([o(`alps-folder-selector-popup`)],go);var _o=class extends c{constructor(...e){super(...e),this.verified=!1,this.failed=!1}static{this.styles=y`
    :host {
      display: inline-flex;
      flex-shrink: 0;
      vertical-align: middle;
    }

    .badge {
      display: inline-flex;
    }

    .verified {
      color: var(--success, #10b981);
    }

    .failed {
      color: var(--error, #ef4444);
    }

    svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
  `}render(){let e=this.verified?`verified`:this.failed?`failed`:``;if(!e)return n;let t=e===`verified`?this.i18nStore?.t(`messageReader.verifiedSender`)||`Verified Sender`:this.i18nStore?.t(`messageReader.unverifiedSender`)||`Unverified Sender`;return b`
      <span class="badge ${e}" role="img" aria-label=${t} title=${t}>
        ${P(e===`verified`?`verifiedBadge`:`authFailedBadge`)}
      </span>
    `}};N([s({context:A})],_o.prototype,`i18nStore`,void 0),N([_({type:Boolean})],_o.prototype,`verified`,void 0),N([_({type:Boolean})],_o.prototype,`failed`,void 0),_o=N([o(`alps-sender-auth-badge`)],_o);var vo=`alps_msg_`,yo=18e5,bo=0;typeof window<`u`&&window.addEventListener(`session-cleared`,()=>{bo++});function xo(){try{let e=[];for(let t=0;t<sessionStorage.length;t++){let n=sessionStorage.key(t);n&&n.startsWith(vo)&&e.push(n)}e.forEach(e=>sessionStorage.removeItem(e))}catch(e){E.error(`Failed to clear message cache`,e)}}var q={generation(){return bo},get(e,t,n=`html`){try{let r=`${vo}${e}_${t}_${n}`,i=sessionStorage.getItem(r);if(!i)return null;let a=JSON.parse(i);return Date.now()-a.timestamp>yo?(sessionStorage.removeItem(r),null):a}catch(e){return E.error(`Failed to read message cache`,e),null}},set(e,t,n,r){try{let i=`${vo}${e}_${t}_${n}`,a={...r,timestamp:Date.now()},o=JSON.stringify(a);if(o.length>2097152){console.warn(`Message ${t} is too large to cache (${Math.round(o.length/1024)}KB)`);return}sessionStorage.setItem(i,o)}catch(i){if(i instanceof DOMException&&(i.name===`QuotaExceededError`||i.code===22)){console.warn(`Session storage quota exceeded, clearing cache and retrying...`),xo();try{let i=`${vo}${e}_${t}_${n}`,a={...r,timestamp:Date.now()};sessionStorage.setItem(i,JSON.stringify(a))}catch(e){E.error(`Failed to write message cache even after clearing`,e)}}else E.error(`Failed to write message cache`,i)}},clear(){bo++,xo()}},So=`data-alps-quote`;function Co(e){return e?e.map(e=>gt(e.Name,`${e.Mailbox}@${e.Host}`)):[]}var wo=e=>`${e?.Mailbox??``}@${e?.Host??``}`.toLowerCase(),To=e=>{let t=e.trim(),n=t.lastIndexOf(`<`);return(t.endsWith(`>`)&&n!==-1?t.slice(n+1,-1):t).trim().toLowerCase()};function Eo(e,t,n,r,i,a=`auto`,o=`auto`,s=[]){let c=t?.Envelope?.Subject||``,l=c;l=e===`forward`?l.toLowerCase().startsWith(`fwd:`)?l:`Fwd: ${l}`:l.toLowerCase().startsWith(`re:`)?l:`Re: ${l}`;let u=[],d=[];if(e===`reply`||e===`replyAll`){let n=t?.Envelope??{},r=new Set(s.filter(Boolean).map(To)),i=new Set,a=e=>(e||[]).filter(e=>{let t=wo(e);return r.has(t)||i.has(t)?!1:(i.add(t),!0)}),o=n.ReplyTo?.length>0?n.ReplyTo:n.From,c=a(o);(e===`replyAll`||c.length===0)&&(c=[...c,...a(n.To)]);let l=e===`replyAll`?a(n.Cc):[];c.length===0&&([c,l]=[l,[]]),u=c.length>0?Co(c):Co(o),d=Co(l)}let f=t?.Envelope?.Date?xe(t.Envelope.Date,a,o):``,p=e=>ft(Ge(`${e.Mailbox}@${e.Host}`)).text,m=t?.Envelope?.From?.[0],h=m?.Mailbox&&m?.Host?p(m):``,g=Ge(m?.Name||h||`Unknown Sender`),_=(t?.Envelope?.To||[]).map(e=>e.Name?`${Ge(e.Name)} <${p(e)}>`:p(e)).join(`, `),v=`On ${f}, ${g} wrote:`;e===`forward`&&(v=`---------- Forwarded message ---------\nFrom: ${g} <${h}>\nDate: ${f}\nSubject: ${c}\nTo: ${_}\n`);let y=`\n\n${v}\n`+n.split(`
`).map(e=>`> ${e}`).join(`
`),b=wi(g),x=wi(h),ee=wi(c),S=wi(f),C=i&&r?Ci(r):``,w=wi(n).replace(/\n/g,`<br>`),T=Vr()(new DOMParser().parseFromString(C||w,`text/html`).body)??`ltr`,te=T===`rtl`?`margin:0px 0.8ex 0px 0px;border-right:1px solid rgb(204,204,204);padding-right:1ex`:`margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex`,ne=``;return ne=C?e===`forward`?`<br><br><div class="gmail_quote" ${So} dir="auto"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>From: ${b} &lt;${x}&gt;<br>Date: ${S}<br>Subject: ${ee}<br>To: ${wi(_)}<br></div><br>${C}</div>`:`<br><br><div class="gmail_quote" ${So} dir="auto"><div dir="ltr" class="gmail_attr">On ${S}, ${b} wrote:<br></div><blockquote class="gmail_quote" dir="${T}" style="${te}">${C}</blockquote></div>`:`<br><br><div class="gmail_quote" dir="auto"><div dir="ltr" class="gmail_attr">${wi(v).replace(/\n/g,`<br>`)}<br></div><blockquote class="gmail_quote" dir="${T}" style="${te}">${w}</blockquote></div>`,{subject:l,to:u,cc:d,quotedText:y,quotedHtml:ne}}var Do=!1;function Oo(){Do=!0}function ko(){return Do}window.addEventListener(`user-logged-in`,()=>{Do=!1});var Ao=`alps_last_active`,jo=3e3;function Mo(e){try{return window.localStorage.getItem(e)}catch{return null}}function No(e,t){try{window.localStorage.setItem(e,t)}catch{}}function Po(e){try{window.localStorage.removeItem(e)}catch{}}var Fo=new class{constructor(){this.events=[`mousedown`,`mousemove`,`keydown`,`scroll`,`touchstart`,`wheel`,`pointerdown`,`pointermove`,`click`,`input`,`focusin`],this.logoutMinutes=0,this.lastActivity=Date.now(),this.lastSync=0,this.lastPing=Date.now(),this.checkInterval=null,this.recordActivity=()=>{let e=Date.now();this.lastActivity=e,window.location.hash!==`#/login`&&window.location.hash!==``&&e-this.lastSync>=jo&&(this.lastSync=e,No(Ao,String(e)))},this.handleActivity=()=>{this.recordActivity()},this.handleStorage=e=>{if(e.key===Ao&&e.newValue){let t=Number(e.newValue);Number.isFinite(t)&&t>this.lastActivity&&(this.lastActivity=t)}}}setLogoutTime(e){let t=this.logoutMinutes>0;this.logoutMinutes=e;let n=this.logoutMinutes>0;n&&!t?(this.attachEvents(),this.startInterval()):!n&&t?(this.detachEvents(),this.clearInterval()):n&&t&&this.recordActivity()}attachEvents(){this.lastSync=0,this.events.forEach(e=>{document.addEventListener(e,this.handleActivity,{capture:!0,passive:!0})}),window.addEventListener(`storage`,this.handleStorage),this.recordActivity()}detachEvents(){this.lastSync=0,this.events.forEach(e=>{document.removeEventListener(e,this.handleActivity,{capture:!0})}),window.removeEventListener(`storage`,this.handleStorage)}trackIframe(e){try{let t=e.contentDocument;if(!t)return;this.events.forEach(e=>{t.addEventListener(e,this.handleActivity,{capture:!0,passive:!0})})}catch{}}startInterval(){this.clearInterval(),this.checkInterval=setInterval(()=>this.checkTimeout(),3e4)}clearInterval(){this.checkInterval&&=(clearInterval(this.checkInterval),null)}checkTimeout(){if(this.logoutMinutes<=0)return;if(window.location.hash===`#/login`||window.location.hash===``){this.recordActivity();return}let e=this.lastActivity,t=Number(Mo(Ao));Number.isFinite(t)&&t>e&&(e=t,this.lastActivity=t);let n=Date.now()-e;n>=this.logoutMinutes*60*1e3?this.logout():n<3e5&&Date.now()-this.lastPing>3e5&&this.pingBackend()}async pingBackend(){this.lastPing=Date.now();try{await fetch(`/session`)}catch{}}rearm(){this.lastActivity=Date.now(),this.lastPing=Date.now(),this.lastSync=0,this.logoutMinutes>0&&(this.attachEvents(),this.startInterval())}async logout(){this.clearInterval(),this.detachEvents();let e=!1;if(this.onBeforeLogout)try{await this.onBeforeLogout()}catch(t){t instanceof Li?(t.keepRecoveryCopy(),e=!0):E.error(`Failed to run onBeforeLogout hook`,t)}try{Po(Ao),ia(e?`inactivitySignedOutDraftsKept`:`inactivitySignedOut`),Oo();try{await fetch(`/session`,{method:`DELETE`})}catch(e){E.error(`Sign-out request failed; ending the session locally anyway`,e)}q.clear(),He(),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`}catch(e){E.error(`Failed to auto sign out`,e)}finally{this.rearm()}}};function Io(e,t){if(!e.contentDocument||!e.contentDocument.body)return;let n=e.contentDocument.getElementById(`dark-mode-override`);n&&n.remove();let r=t&&document.body.classList.contains(`theme-dark`);if(gi(e.contentDocument,r?`dark`:`light`),r){let t=window.getComputedStyle(document.documentElement).getPropertyValue(`--bg-primary`).trim()||`#1f2937`,n=window.getComputedStyle(document.documentElement).getPropertyValue(`--text-primary`).trim()||`#f9fafb`,r=window.getComputedStyle(document.documentElement).getPropertyValue(`--accent-color`).trim()||`#3b82f6`,i=window.getComputedStyle(document.documentElement).getPropertyValue(`--border-color`).trim()||`#374151`,a=e.contentDocument.createElement(`style`);a.id=`dark-mode-override`,a.textContent=`
      body {
        background-color: ${t} !important;
        color: ${n} !important;
      }
      /* Make all layout elements transparent so theme background shows through */
      table, tr, td, tbody, thead, div, p, span, section, article, header, footer, blockquote {
        background-color: transparent !important;
      }
      /* Ensure all standard text containers inherit readable text color */
      td, div, p, span, h1, h2, h3, h4, h5, h6, font {
        color: inherit !important;
      }
      /* Style links to use the theme's accent color */
      a {
        color: ${r} !important;
      }
      /* Ensure list elements are clean and transparent */
      ul, ol, li {
        background-color: transparent !important;
        color: inherit !important;
      }
      /* Style horizontal rules/lines */
      hr {
        border-color: ${i} !important;
      }
    `,e.contentDocument.head.appendChild(a)}}function Lo(e,t){if(!e.contentDocument||!e.contentDocument.body)return;e.style.width=`100%`,e.contentDocument.addEventListener(`dragover`,e=>e.preventDefault()),e.contentDocument.addEventListener(`drop`,e=>e.preventDefault()),Fo.trackIframe(e),Io(e,t),e._ro&&e._ro.disconnect();let n=e.contentDocument,r=()=>{if(!e.contentDocument)return;let t=e.contentDocument.documentElement,n=e.contentDocument.body,r=Math.max(t?.scrollHeight||0,n?.scrollHeight||0);if(r>0){let t=parseFloat(e.style.height)||0;Math.abs(t-r)>2&&(e.style.height=`${Math.ceil(r)}px`)}};r();let i=new ResizeObserver(()=>r());i.observe(n.body),i.observe(n.documentElement),e._ro=i}function Ro(e){if(!e)return``;let t=new DOMParser().parseFromString(e,`text/html`);t.querySelectorAll(`script, style, noscript, head, template`).forEach(e=>e.remove());let n=new Set([`p`,`div`,`br`,`tr`,`li`,`h1`,`h2`,`h3`,`h4`,`h5`,`h6`,`blockquote`,`section`,`article`,`header`,`footer`,`pre`,`table`,`ul`,`ol`]),r=``,i=e=>{for(let t of Array.from(e.childNodes))if(t.nodeType===Node.TEXT_NODE)r+=t.textContent||``;else if(t.nodeType===Node.ELEMENT_NODE){let e=t,a=e.tagName.toLowerCase();if(a===`br`){r+=`
`;continue}i(e),n.has(a)&&(r+=`
`)}};return t.body&&i(t.body),r.replace(/\n{3,}/g,`

`).trim()}function zo(e,t,n,r){if(!e)return n||r;let i=e;if(t?.toLowerCase()===`text/html`||e.trim().startsWith(`<`)||/<\/[a-zA-Z]+>/.test(e)||/<[a-zA-Z]+[^>]*>/.test(e))try{let t=new DOMParser().parseFromString(e,`text/html`);t.querySelectorAll(`style, script, head`).forEach(e=>e.remove());let n=e=>{if(e.nodeType===Node.TEXT_NODE)return e.textContent||``;if(e.nodeType===Node.ELEMENT_NODE){let t=e,r=t.tagName.toLowerCase();if(r===`br`)return` `;let i=``;for(let e=0;e<t.childNodes.length;e++)i+=n(t.childNodes[e]);return[`p`,`div`,`td`,`tr`,`th`,`li`,`h1`,`h2`,`h3`,`h4`,`h5`,`h6`,`section`,`article`,`blockquote`,`ol`,`ul`,`header`,`footer`].includes(r)?` `+i+` `:i}return``};i=n(t.body||t)}catch{i=e.replace(/<[^>]*>/g,` `)}else i=e.replace(/[\r\n\t]+/g,` `);let a=i.replace(/\s+/g,` `).trim();if(a){let e=a.substring(0,100);return a.length>100?e+`...`:e}return n?n.replace(/[\r\n\t\s]+/g,` `).trim():r}var Bo=/(?<![\p{L}\p{N}._%+@/-])(?:https?:\/\/|www\.|mailto:)|@/giu,Vo=/[\s<>"`\u0000-\u001f\u007f]/u,Ho=new Set([`.`,`,`,`;`,`:`,`!`,`?`,`'`,`*`]),Uo={")":`(`,"]":`[`,"}":`{`},Wo=64,Go=255,Ko=253,qo=/[\p{L}\p{N}!#$%&'*+/=?^_`{|}~.-]/u,Jo=/[!#$&*/=?^`{|}~]/,Yo="'`*.",Xo=/[\p{L}\p{N}.-]/u,Zo=/^(?:\p{L}{2,}|xn--[a-z0-9-]+)$/iu;function Qo(e){let t=e.split(`.`);return t.length<2||t.some(e=>e===``||e.startsWith(`-`)||e.endsWith(`-`))?!1:Zo.test(t[t.length-1])}function $o(e,t,n){let r={"(":0,")":0,"[":0,"]":0,"{":0,"}":0};for(let i=t;i<n;i++)e[i]in r&&r[e[i]]++;for(;n>t;){let t=e[n-1];if(Ho.has(t)){n--;continue}let i=Uo[t];if(i&&r[t]>r[i])r[t]--,n--;else break}return n}function es(e,t,n){let r=t;for(;r>n&&t-r<=Wo;){let t=r-1,i=e.charCodeAt(t);if(i>=56320&&i<=57343&&t>n){let n=e.charCodeAt(t-1);n>=55296&&n<=56319&&t--}if(!qo.test(e.slice(t,r)))break;r=t}if(t-r>Wo)return null;for(;r<t&&Yo.includes(e[r]);)r++;let i=e.slice(r,t);if(i===``||i.endsWith(`.`)||Jo.test(i))return null;let a=t+1;for(;a<e.length&&a-t-1<=Go;){let t=String.fromCodePoint(e.codePointAt(a));if(!Xo.test(t))break;a+=t.length}if(a-t-1>Go)return null;for(;a>t+1&&(e[a-1]===`.`||e[a-1]===`-`);)a--;return Qo(e.slice(t+1,a))?{start:r,end:a}:null}function ts(e,t,n){let r=t;for(;r<n&&!`/?#`.includes(e[r]);)if(e[r]===`@`||++r-t>Ko)return!1;for(;r>t&&(Ho.has(e[r-1])||e[r-1]in Uo);)r--;return e.slice(t,r).includes(`.`)}function ns(e){let t=[],n=new RegExp(Bo.source,Bo.flags),r=0,i=-1,a=-1,o=t=>{if(t>=i&&t<a)return a;let n=t;for(;n<e.length&&!Vo.test(e[n]);)n++;return i=t,a=n,n},s;for(;(s=n.exec(e))!==null;){let i=s.index,a=s[0].toLowerCase();if(a===`@`){let a=es(e,i,r);if(!a)continue;let o=e.slice(a.start,i),s=e.slice(i+1,a.end);t.push({...a,href:`mailto:${encodeURIComponent(o)}@${s}`,kind:`email`}),r=n.lastIndex=a.end;continue}let c=i+a.length,l=o(i);if(c>=l)continue;if(a===`www.`){if(!ts(e,c,l))continue}else if(a!==`mailto:`&&!/[\p{L}\p{N}\[]/u.test(e[c]))continue;let u=$o(e,i,l);if(u<=c)continue;let d=e.slice(i,u);t.push({start:i,end:u,href:a===`www.`?`https://${d}`:d,kind:a===`mailto:`?`email`:`url`}),r=n.lastIndex=u}return t}function rs(e){let t=as.get(e);if(t!==void 0)return t;let n=os(e);return as.size>=is&&as.delete(as.keys().next().value),as.set(e,n),n}var is=32,as=new Map;function os(e){let t=ns(e);if(t.length===0)return e;let n=[],r=0;for(let i of t){i.start>r&&n.push(e.slice(r,i.start));let t=e.slice(i.start,i.end);n.push(i.kind===`url`?b`<a href=${i.href} target="_blank" rel="noopener noreferrer">${t}</a>`:b`<a href=${i.href}>${t}</a>`),r=i.end}return r<e.length&&n.push(e.slice(r)),n}function ss(e){let t=[],n=``,r=!1;for(let i=0;i<e.length;i++){let a=e[i];r&&a===`\\`&&i+1<e.length?n+=a+e[++i]:(a===`"`&&(r=!r),a===`,`&&!r?(t.push(n),n=``):n+=a)}return t.push(n),t.map(e=>e.trim()).filter(e=>e!==``)}function cs(e){let t=e.trim();if(!/^mailto:/i.test(t))return null;let n=t.slice(7),r=n.indexOf(`?`),i=r<0?n:n.slice(0,r),a=r<0?``:n.slice(r+1);try{let e={to:ss(decodeURIComponent(i)),cc:[]};for(let t of a.split(`&`)){if(t===``)continue;let n=t.indexOf(`=`),r=decodeURIComponent(n<0?t:t.slice(0,n)).toLowerCase(),i=n<0?``:decodeURIComponent(t.slice(n+1));switch(r){case`to`:e.to.push(...ss(i));break;case`cc`:e.cc.push(...ss(i));break;case`subject`:e.subject??=i;break;case`body`:e.body??=i.replace(/\r\n?/g,`
`)}}return e}catch{return null}}function ls(e){let t={to:e.to,cc:e.cc};return e.subject&&(t.subject=e.subject),e.body&&(t.text=e.body,t.html=us(e.body)),t}function us(e){return e.split(`

`).map(e=>`<p style="white-space: pre-wrap">${e.split(`
`).map(wi).join(`<br>`)}</p>`).join(``)}function ds(e,t){if(!t||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;let n=e.target,r=typeof n?.closest==`function`?n.closest(`a[href]`):null;if(!r)return;let i=cs(r.getAttribute(`href`)??``);i&&(e.preventDefault(),t.openComposer(ls(i),{signature:`below`}))}function fs(e,t){e.contentDocument?.addEventListener(`click`,e=>ds(e,t()))}var ps=class extends c{constructor(...e){super(...e),this.showSenderAvatars=!0,this.canToggleRead=!1,this._handleSettingsChange=()=>{let e=this.settingsStore?.getState()?.themeIframeContent??!1;this.shadowRoot?.querySelectorAll(`iframe.reader-iframe`).forEach(t=>{Io(t,e)})}}static{this.styles=[j,dt,y`
    :host {
      display: block;
      scroll-margin-top: 32px;
    }

    .thread-card {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-primary, #fff);
      overflow: hidden;
      transition: box-shadow 0.2s ease;
    }

    .thread-card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .thread-card.expanded {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .thread-card-header {
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
      background: var(--bg-primary, #fff);
      transition: background-color 0.2s ease;
    }

    .thread-card-header:hover {
      background: var(--bg-secondary, #fafafa);
    }

    .thread-card.expanded .thread-card-header {
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-primary, #fff);
    }

    .thread-card-summary {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .thread-card-sender {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
      max-width: 200px;
      line-height: 1.2;
    }

    .thread-card-sender-heading {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
    }

    .thread-card-sender-name {
      font-weight: 600;
      font-size: 14px;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .thread-card-sender-address {
      font-size: 12px;
      font-weight: 400;
      line-height: 1.2;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .avatar-container {
      display: inline-flex;
      flex-shrink: 0;
    }

    .thread-card-snippet {
      font-size: 13px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .thread-card-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .thread-card-date {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .thread-card-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--bg-secondary, #e5e7eb);
      color: var(--text-color, #374151);
      font-weight: 500;
      border: 1px solid var(--border-color);
    }

    .thread-card-body {
      padding: 0;
    }

    .thread-card .reader-meta {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-primary, #fff);
    }

    .thread-card alps-attachment-list {
      width: auto !important;
      display: block;
      margin: 0;
    }

    .thread-card alps-banner {
      width: auto !important;
      display: block;
    }

    .thread-card.unread {
      border-color: rgba(234, 179, 8, 0.4) !important;
      background: var(--bg-unread, rgba(234, 179, 8, 0.08));
    }

    .thread-card.unread .thread-card-header {
      background: var(--bg-unread, rgba(234, 179, 8, 0.08)) !important;
    }

    .thread-card.unread .thread-card-header:hover {
      background: var(--bg-unread-hover, rgba(234, 179, 8, 0.12)) !important;
    }

    .thread-card-sender.unread .thread-card-sender-name {
      font-weight: 700;
    }

    .reader-recipients-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .reader-recipients {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .reader-recipients-label {
      color: var(--text-muted);
      width: 48px;
      flex-shrink: 0;
    }

    .reader-recipients-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    .undisclosed-recipients {
      color: var(--text-muted);
      font-style: italic;
    }

    .message-content {
      position: relative;
    }

    .reader-content-wrapper {
      position: relative;
    }

    .reader-iframe {
      width: 100%;
      border: none;
      display: block;
      transition: height 0.1s ease;
      background: transparent;
    }

    .reader-empty-body {
      padding: 32px;
      text-align: center;
      color: var(--text-muted);
      font-style: italic;
      border: 1px dashed var(--border-color);
      border-radius: 8px;
    }

    .reader-load-error {
      padding: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--text-muted);
      text-align: center;
    }

    .reader-text-wrapper {
      border: none;
      border-radius: 0;
      padding: 16px;
      background: transparent;
      overflow-x: auto;
    }

    /* Each paragraph of a plain-text body runs the way its first letter
       does, as in the reader. */
    .reader-preformatted {
      margin: 0;
      white-space: pre-wrap;
      unicode-bidi: plaintext;
      word-wrap: break-word;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-primary);
    }

    /* Links found in a plain-text body (utils/linkify.ts). A URL has no spaces
       to wrap at, so it may break anywhere rather than widen the pane. */
    .reader-preformatted a {
      color: var(--accent-color);
      overflow-wrap: anywhere;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 8px 16px;
      border: none;
      background: transparent;
      font-size: 14px;
      text-align: start;
      cursor: pointer;
      color: var(--text-primary);
      transition: background-color 0.15s ease;
      box-sizing: border-box;
      gap: 12px;
    }

    .dropdown-item:hover {
      background-color: var(--bg-secondary);
    }

    .dropdown-item .icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: var(--text-muted);
    }

    .dropdown-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 4px 0;
    }

    .mobile-only {
      display: none;
    }

    @media (max-width: 768px) {
      .thread-card.expanded .thread-card-date {
        display: none;
      }
      .mobile-only {
        display: flex;
      }
    }
  `]}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.settingsStore?.addEventListener(`change`,this._handleSettingsChange)})}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore?.removeEventListener(`change`,this._handleSettingsChange)}onIframeLoad(e){let t=e.target;Lo(t,this.settingsStore?.getState()?.themeIframeContent??!1),fs(t,()=>this.composeStore)}onTextBodyClick(e){ds(e,this.composeStore)}handleCardHeaderClick(){this.dispatchEvent(new CustomEvent(`toggle-expansion`,{detail:{item:this.item},bubbles:!0,composed:!0}))}_closePopup(){let e=this.shadowRoot?.querySelectorAll(`alps-popup`);e&&e.forEach(e=>e.close())}handleStarClick(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-star`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleActionForItem(e){this._closePopup(),this.dispatchEvent(new CustomEvent(`action-for-item`,{detail:{action:e,item:this.item},bubbles:!0,composed:!0}))}handleDeleteItem(){this._closePopup(),this.dispatchEvent(new CustomEvent(`delete-item`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleRetryBody(){this.dispatchEvent(new CustomEvent(`retry-body`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleLoadRemoteResources(){this.dispatchEvent(new CustomEvent(`load-remote-resources`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleEditDraftClick(){this.dispatchEvent(new CustomEvent(`edit-draft-for-item`,{detail:{item:this.item},bubbles:!0,composed:!0}))}renderItemContent(){if(this.item.loading)return b`
        <div style="padding: 16px; display: flex; justify-content: center; align-items: center;">
          <alps-loader></alps-loader>
        </div>
      `;let e=this.item.message||{},t=this.settingsStore?.getState()?.dateFormat||`auto`,n=String(this.settingsStore?.getState()?.hourFormat||`auto`),i=e.Envelope?.Date?xe(e.Envelope.Date,t,n):``;return b`
      <div class="reader-meta">
        <div class="reader-recipients-block">
          <div class="reader-recipients">
            <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.to`)}</span>
            <div class="reader-recipients-list">
              ${e.Envelope?.To&&e.Envelope.To.length>0?e.Envelope.To.map(e=>e.Mailbox&&e.Host?b`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``):b`<span class="undisclosed-recipients">${e.Flags?.includes(`\\Draft`)?this.i18nStore?.t(`messageReader.noRecipients`):this.i18nStore?.t(`messageReader.undisclosed`)}</span>`}
            </div>
          </div>
          ${e.Envelope?.Cc&&e.Envelope.Cc.length>0?b`
            <div class="reader-recipients">
              <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.cc`)}</span>
              <div class="reader-recipients-list">
                ${e.Envelope.Cc.map(e=>e.Mailbox&&e.Host?b`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``)}
              </div>
            </div>
          `:``}
          
          <div class="reader-recipients mobile-only" style="margin-top: 4px;">
            <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.date`)||`Date:`}</span>
            <div class="reader-recipients-list">
              <span style="color: var(--text-primary);">${i}</span>
            </div>
          </div>
        </div>
      </div>

      ${this.item.attachments&&this.item.attachments.length>0?b`
        <alps-attachment-list
          .attachments=${this.item.attachments}
          .mailbox=${this.item.mailbox}
          .messageUid=${e.UID}
        ></alps-attachment-list>
      `:``}

      <div class="message-content">
        ${e.HasBimiFailed?b`
          <alps-banner variant="warning" style="margin-bottom: 12px;">
            <span>${this.i18nStore?.t(`messageReader.senderUnverifiedWarning`)}</span>
          </alps-banner>
        `:``}
        ${this.item.activeBanners&&this.item.activeBanners.length>0?b`
          ${this.item.activeBanners.map(e=>e)}
        `:``}
        ${this.item.hasRemoteResources&&!this.item.allowRemoteResources?b`
          <alps-banner style="margin-bottom: 12px;">
            <span>${this.i18nStore?.t(`messageReader.remoteContentWarning`)}</span>
            <alps-button slot="action" variant="normal" @click=${this.handleLoadRemoteResources}>${this.i18nStore?.t(`messageReader.loadRemoteContent`)}</alps-button>
          </alps-banner>
        `:``}
        ${e.Flags?.includes(`\\Draft`)?b`
          <alps-banner style="margin-bottom: 12px;">
            <span>${this.i18nStore?.t(`messageReader.isDraft`)}</span>
            <alps-button slot="action" variant="normal" @click=${this.handleEditDraftClick}>${this.i18nStore?.t(`messageReader.editDraft`)}</alps-button>
            <!-- The menu's Delete is the same gesture. This is where a draft is
                 looked at, and Edit Draft alone left no way to drop one in sight. -->
            <alps-button slot="action" variant="normal" @click=${()=>this.handleDeleteItem()}>${this.i18nStore?.t(`messageReader.discardDraft`)}</alps-button>
          </alps-banner>
        `:``}
        
        <div class="reader-content-wrapper">
          ${this.item.loadFailed?b`
            <div class="reader-load-error">
              <div>${this.i18nStore?.t(`messageReader.loadError`)}</div>
              <alps-button variant="normal" @click=${this.handleRetryBody}>
                ${this.i18nStore?.t(`messageReader.loadErrorRetry`)}
              </alps-button>
            </div>
          `:this.item.mimeType?.toLowerCase()===`text/html`?b`
            <iframe 
              class="reader-iframe"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              .srcdoc=${r(this.item.content)}
              @load=${this.onIframeLoad}
            ></iframe>
          `:this.item.mimeType?.toLowerCase().startsWith(`multipart/`)||!this.item.content?b`
            <div class="reader-empty-body">
              ${this.i18nStore?.t(`messageReader.noReadableText`)}
            </div>
          `:b`
            <div class="reader-text-wrapper">
              <pre dir="auto" class="reader-preformatted" @click=${this.onTextBodyClick}>${rs(this.item.content)}</pre>
            </div>
          `}
        </div>
      </div>
    `}render(){let e=this.item.message||{},t=e.Envelope?.From?.[0]||{},n=t.Mailbox&&t.Host?`${t.Mailbox}@${t.Host}`:``,r=t.Name||n||this.i18nStore?.t(`messageList.unknownSender`),i=!!(n&&t.Name?.trim()&&t.Name.trim()!==n),a=i?`${t.Name} <${n}>`:n||r,o=this.settingsStore?.getState()?.dateFormat||`auto`,s=String(this.settingsStore?.getState()?.hourFormat||`auto`),c=e.Envelope?.Date?xe(e.Envelope.Date,o,s):``,l=be(e,t),u=e.Flags?.includes(V),d=!e.Flags?.includes(B),f=e.Snippet||``,p=window.innerWidth<=768?``:this.i18nStore?.t(`messageReader.clickToExpand`)||`Click to expand message content`,m=this.item.expanded?``:zo(this.item.content,this.item.mimeType,f,p);return b`
      <div class="thread-card ${this.item.expanded?`expanded`:``} ${d?`unread`:``}">
        <div class="thread-card-header" @click=${this.handleCardHeaderClick}>
          <div class="thread-card-summary">
            ${this.showSenderAvatars?b`
              <div class="avatar-container">
                <alps-avatar .name=${r} .email=${n} .size=${28} .src=${l}></alps-avatar>
              </div>
            `:``}
            <div class="thread-card-sender ${d?`unread`:``}" title=${a}>
              <div class="thread-card-sender-heading">
                <span class="thread-card-sender-name" dir="auto">${i||!n?r:_t(n)}</span>
                <alps-sender-auth-badge ?verified=${!!e.HasBimiPotential} ?failed=${!!e.HasBimiFailed}></alps-sender-auth-badge>
              </div>
              ${i?b`<span class="thread-card-sender-address">${_t(n)}</span>`:``}
              <!-- On a line of its own, where the address's ellipsis cannot cut it off. -->
              ${pt(n,this.i18nStore)}
            </div>
            ${this.item.expanded?``:b`<div class="thread-card-snippet" dir="auto">${m}</div>`}
          </div>
          <div class="thread-card-meta">
            ${this.item.isSent?b`<span class="thread-card-badge">${this.i18nStore?.t(`folderList.sent`)||`Sent`}</span>`:``}
            ${this.item.mailbox!==this.mailbox&&!this.item.isSent?b`<span class="thread-card-badge">${this.item.mailbox}</span>`:``}
            <div class="thread-card-date"><bdi>${c}</bdi></div>
            
            <alps-icon-btn
              title=${this.i18nStore?.t(`messageReader.star`)||`Star`}
              ?active=${u}
              @click=${this.handleStarClick}
              icon=${u?`starFourFill`:`starFour`}
            ></alps-icon-btn>
            
            ${this.item.expanded?b`
              <alps-icon-btn
                title=${this.i18nStore?.t(`messageReader.reply`)||`Reply`}
                @click=${e=>{e.stopPropagation(),this.handleActionForItem(`reply`)}}
                icon="arrowBendUpLeft"
              ></alps-icon-btn>
              
              <alps-popup align="end" class="card-more-menu" @click=${e=>e.stopPropagation()}>
                <alps-icon-btn
                  slot="trigger"
                  title=${this.i18nStore?.t(`messageReader.moreOptions`)}
                  icon="dotsThreeVertical"
                ></alps-icon-btn>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`reply`)}>
                  ${P(`arrowBendUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reply`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`replyAll`)}>
                  ${P(`arrowBendDoubleUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.replyAll`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`forward`)}>
                  ${P(`arrowBendUpRight`)} <span class="item-text">${this.i18nStore?.t(`messageReader.forward`)}</span>
                </button>
                <div class="dropdown-divider"></div>
                <!-- Everything below is about THIS message. Over a conversation
                     the toolbar acts on all of it, so these live here. -->
                ${this.canToggleRead?b`
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(d?`markRead`:`markUnread`)}>
                  ${P(d?`envelopeOpen`:`envelopeUnread`)} <span class="item-text">${this.i18nStore?.t(d?`messageReader.markRead`:`messageReader.markUnread`)}</span>
                </button>
                `:``}
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`print`)}>
                  ${P(`printer`)} <span class="item-text">${this.i18nStore?.t(`messageReader.print`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`downloadMessage`)}>
                  ${P(`downloadSimple`)} <span class="item-text">${this.i18nStore?.t(`messageReader.downloadMessage`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`showOriginal`)}>
                  ${P(`codeBlock`)} <span class="item-text">${this.i18nStore?.t(`messageReader.showOriginal`)}</span>
                </button>
                <div class="dropdown-divider"></div>
                <!-- Named for what it does to a draft, as the toolbar's is. -->
                <button class="dropdown-item" @click=${()=>this.handleDeleteItem()}>
                  ${P(`trash`)} <span class="item-text">${this.i18nStore?.t(e.Flags?.includes(`\\Draft`)?`messageReader.discardDraft`:`messageReader.delete`)}</span>
                </button>
              </alps-popup>
            `:``}
            
            <alps-icon-btn
              icon=${this.item.expanded?`caretUp`:`caretDown`}
              title=${this.item.expanded?this.i18nStore?.t(`general.collapse`):this.i18nStore?.t(`general.expand`)}
            ></alps-icon-btn>
          </div>
        </div>
        
        ${this.item.expanded?b`
          <div class="thread-card-body">
            ${this.renderItemContent()}
          </div>
        `:``}
      </div>
    `}};N([s({context:Be})],ps.prototype,`settingsStore`,void 0),N([s({context:A})],ps.prototype,`i18nStore`,void 0),N([s({context:ta})],ps.prototype,`composeStore`,void 0),N([_({type:Object})],ps.prototype,`item`,void 0),N([_({type:String})],ps.prototype,`mailbox`,void 0),N([_({type:Boolean})],ps.prototype,`showSenderAvatars`,void 0),N([_({type:Boolean})],ps.prototype,`canToggleRead`,void 0),ps=N([o(`alps-thread-card`)],ps);function ms(e){return!!e?.Flags?.includes(Pn)}var hs=10,J=class extends c{constructor(...e){super(...e),this.localPreferredView=null,this.hasHtml=!1,this.hasText=!1,this.mailbox=w,this.message=null,this.messages=[],this.selectedKeys=new Set,this.selectedCount=0,this.allSelectedStarred=!1,this.allSelectedUnread=!1,this.commonTags=[],this.bulkProcessing=!1,this.layoutMode=`vertical`,this.mailboxes=[],this.content=``,this.mimeType=``,this.loading=!1,this.loadFailed=!1,this.activeBanners=[],this.attachments=[],this.allowRemoteResources=!1,this.hasRemoteResources=!1,this.rawMessageHtml=``,this.isScrolled=!1,this.threadItems=[],this._isThread=!1,this._deferPropertySync=!1,this._conversation=null,this.conversationGeneration=0,this.conversationReads=new Set,this.scrolledToKey=null,this.scrollTimer=null,this.readDueAt=new Map,this.readTimer=null,this.readRefused=new Set,this.droppedKeys=new Set,this.stayingOn=null,this.readGeneration=0,this.readRefusalSaid=!1,this._handleDraftDiscarded=e=>{let t=e.detail;if(!t?.mailbox||!t.uid||!this.message)return;let n=R(t.mailbox,t.uid);for(let e of this.conversationReads)e.removed.add(n);this.threadItems.some(e=>this.itemKey(e)===n)&&this.dropCard(n),this.keyOf(this.message)===n&&this.dispatchEvent(new CustomEvent(`close`))},this._handleDraftAutosaved=e=>{let t=e.detail;if(!t?.oldUid||t.newUid==null||!t.mailbox)return;let n=t.mailbox,r=String(t.newUid),i=R(t.oldMailbox||n,t.oldUid),a=R(n,r);if(i===a)return;for(let e of this.conversationReads)e.moves.set(i,{mailbox:n,uid:r}),e.key===i&&(e.key=a);let o=e=>({...e,UID:r,Mailbox:n});this._conversation&&(this._conversation.key===i||this._conversation.messages.some(e=>this.keyOf(e)===i))&&(this._conversation={key:this._conversation.key===i?a:this._conversation.key,messages:this._conversation.messages.map(e=>this.keyOf(e)===i?o(e):e)});let s=[];if(this.threadItems=this.threadItems.map(e=>{if(this.itemKey(e)!==i)return e;let t={...e,mailbox:n,message:o(e.message)};return(e.loading||this.bodyLoads.has(i))&&s.push(t),t}),s.length){this.bodyReads.set(i,(this.bodyReads.get(i)??0)+1),this.bodyLoads.delete(i),this.prefetchQueue=this.prefetchQueue.filter(e=>this.itemKey(e)!==i);let e=q.generation(),t=!!this.message&&this.keyOf(this.message)===i;for(let n of s)this.fetchItemBody(n,!n.expanded).then(()=>{t&&!this._conversation&&this.isConnected&&e===q.generation()&&this.message&&this.keyOf(this.message)===a&&this.loadConversation(this.message)})}this.scrolledToKey===i&&(this.scrolledToKey=a)},this._handleExternalFlagsChanged=e=>{let t=e;if(!t.detail)return;let{keys:n,flag:r,action:i}=t.detail;if(!this.threadItems||this.threadItems.length===0)return;let a=new Set(n);for(let e of a)this.patchConversationFlag(e,r,i);let o=!1;for(let e=0;e<this.threadItems.length;e++){let t=this.threadItems[e];if(t.message&&a.has(this.itemKey(t))){let n=t.message.Flags||[],a=n.includes(r);i===`add`&&!a?(this.threadItems[e]={...t,message:{...t.message,Flags:[...n,r]}},o=!0):i===`remove`&&a&&(this.threadItems[e]={...t,message:{...t.message,Flags:n.filter(e=>e!==r)}},o=!0)}}if(o&&(this.threadItems=[...this.threadItems],this.requestUpdate(),this.message&&a.has(this.keyOf(this.message)))){let e=this.message.Flags?.includes(r);i===`add`&&!e?this.message.Flags=[...this.message.Flags||[],r]:i===`remove`&&e&&(this.message.Flags=this.message.Flags.filter(e=>e!==r)),this.message={...this.message}}},this.prefetchQueue=[],this.prefetching=!1,this.bodyReads=new Map,this.bodyLoads=new Map,this._handleSettingsChange=()=>{this.applyThemeToAllIframes()},this.handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0}}ownAddresses(){let e=this.settingsStore?.getState();return[Ie(e)||ze()||``,e?.replyTo||``,...(e?.identities??[]).map(e=>e.address)].filter(Boolean)}senderFor(e){let t=this.settingsStore?.getState();return Ne(e,Ie(t)||ze()||``,t?.identities)}_closePopup(){let e=this.shadowRoot?.querySelectorAll(`alps-popup`);e&&e.forEach(e=>e.close())}async _handleAction(e,t){if(e===`reply`||e===`replyAll`||e===`forward`){if(!this.message)return;this._closePopup();let t=this.bodyActionCurrent(),n=this.keyOf(this.message),r=this.threadItems.find(e=>this.itemKey(e)===n);if(r&&!r.loading&&r.loadFailed&&this.retryItemBody(r),this.bodyLoads.has(n)&&(await this.loadedItem(n),!this.message||this.keyOf(this.message)!==n)||!t())return;if(this.loadFailed){this._sayBodyUnread();return}let i=``;this.mimeType===`text/plain`?i=this.content:this.rawMessageHtml&&(i=Ro(this.rawMessageHtml));let a=this.settingsStore?.getState()?.dateFormat||`auto`,o=String(this.settingsStore?.getState()?.hourFormat||`auto`),{subject:s,to:c,cc:l,quotedText:u,quotedHtml:d}=Eo(e,this.message,i,this.rawMessageHtml,this.hasHtml,a,o,this.ownAddresses()),f=e===`forward`?this.attachments.map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})):[],p=[...f,...Pi(this.message.BodyStructure,d).filter(e=>!f.some(t=>t.partPath===e.partPath))],m=e===`reply`||e===`replyAll`?Fi(this.message,this.message.Mailbox||this.mailbox):{};this.composeStore.openComposer({subject:s,to:c,cc:l,text:u,html:d,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:p,quoteSource:{mailbox:this.message.Mailbox||this.mailbox,uid:String(this.message.UID),structure:this.message.BodyStructure},from:this.senderFor(this.message.Envelope),...m})}else if(e===`showPlaintext`||e===`showHtml`)this.localPreferredView=e===`showPlaintext`?`text`:`html`,this._closePopup(),await Promise.all(this.threadItems.filter(e=>e.content||e.loading||e.loadFailed).map(e=>this.fetchItemBody(e)));else if(e===`print`){let e=this.allowRemoteResources?`&remote=1`:``;window.open(`#/print?mailbox=`+encodeURIComponent(this.mailboxOfMessage(this.message))+`&uid=`+this.message.UID+e,`_blank`),this._closePopup()}else{if(this._closePopup(),this.toolbarIsConversation){if(e===`markUnread`){let e=this.unreadKeys;if(e.length>0)return void this.markMembersRead(e)}else{this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,folder:t,uids:this.conversationUids}}));return}}this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,folder:t}}))}}get openIsUnsent(){return this.message?ms(this.message)||ue(this.mailbox||``,this.mailboxes)===`drafts`:!1}get toolbarIsConversation(){return!(this.selectedCount>0)&&this.threadItems.length>1&&!this.openIsUnsent&&this.conversationItems.length>0}get conversationItems(){return this.threadItems.filter(e=>e.message&&e.mailbox===this.mailbox)}get conversationUids(){return this.conversationItems.map(e=>String(e.message.UID))}get unreadKeys(){return this.threadItems.filter(e=>e.message&&!e.message.Flags?.includes(`\\Seen`)&&!ms(e.message)).map(e=>this.itemKey(e))}get markReadTargetKeys(){return this.toolbarIsConversation?this.unreadKeys:this.message?.UID?[this.keyOf(this.message)]:[]}get readToggleMarksRead(){return this.selectedCount>0?this.allSelectedUnread:this.toolbarIsConversation?this.unreadKeys.length>0:!this.message?.Flags?.includes(B)}hasTag(e){let t=e.toLowerCase(),n=e=>!!e?.some(e=>e.toLowerCase()===t);if(this.selectedCount>0)return n(this.commonTags);if(this.toolbarIsConversation){let e=this.conversationItems;return e.length>0&&e.every(e=>n(e.message.Flags))}return n(this.message?.Flags)}_handleTag(e){this._closePopup();let t=this.toolbarIsConversation?this.conversationUids:void 0;this.dispatchEvent(new CustomEvent(`action`,{detail:{action:this.hasTag(e)?`removeTag`:`addTag`,folder:e,uids:t}}))}_handleRemoveAllTags(){this._closePopup();let e=this.selectedCount>0,t;if(e){let e=new Set;for(let t of this.messages)for(let n of[t,...t.SubMessages||[]])if(this.selectedKeys.has(this.keyOf(n)))for(let t of Yn(n.Flags))e.add(t);t=[...e]}else if(this.toolbarIsConversation){let e=new Set;for(let t of this.conversationItems)for(let n of Yn(t.message.Flags))e.add(n);t=[...e]}else t=Yn(this.message?.Flags);if(t.length===0)return;let n=!e&&this.toolbarIsConversation?this.conversationUids:void 0;this.dispatchEvent(new CustomEvent(`action`,{detail:{action:`removeTag`,tags:t,uids:n}}))}resetReadRefusals(){this.readGeneration++,this.readRefused.clear(),this.readRefusalSaid=!1}keyOf(e){return R(this.mailboxOfMessage(e),e?.UID)}mailboxOfMessage(e){return pn(e,this.mailbox)}itemKey(e){return R(e.mailbox,e.message?.UID)}isOpenItem(e){return!!this.message&&this.itemKey(e)===this.keyOf(this.message)}listedKeys(){let e=new Set;for(let t of this.messages||[]){e.add(this.keyOf(t));for(let n of t.SubMessages||[])e.add(this.keyOf(n))}return e}cardId(e){return`thread-card-${encodeURIComponent(e.mailbox)}-${e.message?.UID}`}connectedCallback(){super.connectedCallback(),window.addEventListener(`external-message-flags-changed`,this._handleExternalFlagsChanged),window.addEventListener(`draft-discarded`,this._handleDraftDiscarded),window.addEventListener(`draft-autosaved`,this._handleDraftAutosaved),this.updateComplete.then(()=>{this.isConnected&&this.settingsStore?.addEventListener(`change`,this._handleSettingsChange)})}disconnectedCallback(){this.conversationGeneration++,this.settingsStore?.removeEventListener(`change`,this._handleSettingsChange),window.removeEventListener(`external-message-flags-changed`,this._handleExternalFlagsChanged),this.readDueAt.clear(),this.resetReadRefusals(),this.prefetchQueue=[],this.readTimer&&clearTimeout(this.readTimer),this.readTimer=null,this.scrollTimer&&clearTimeout(this.scrollTimer),this.scrollTimer=null,window.removeEventListener(`draft-discarded`,this._handleDraftDiscarded),window.removeEventListener(`draft-autosaved`,this._handleDraftAutosaved),super.disconnectedCallback()}static{this.styles=[j,ka,y`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .tags-popup .dropdown-item.active svg {
      margin-inline-start: auto;
      color: var(--text-secondary, #9ca3af);
    }

    /* A tag's colour, as its pill in the list wears it. Drawn by its
       background alone, which forced colors repaint as the page: kept. */
    .tag-dot {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-inline-end: 12px;
      opacity: 0.9;
      forced-color-adjust: none;
    }

    .toolbar {
      padding: 0 16px;
      gap: 12px;
      background: var(--bg-primary, #fff);
    }

    .desktop-attachments {
      display: block;
    }

    .mobile-attachments {
      display: none;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .folder-selector {
      display: block;
      width: 100%;
    }

    .reader-header {
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .reader-subject {
      font-family: var(--font-heading);
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      display: flow-root;
      word-break: break-word;
    }

    .tag-pills {
      float: inline-end;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-inline-start: 12px;
      margin-bottom: 4px;
    }

    .reader-meta {
      display: flex;
      flex-direction: column;
    }

    .reader-meta-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .reader-sender-block {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .reader-sender-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .avatar-container {
      display: inline-flex;
      flex-shrink: 0;
    }

    .reader-sender-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .reader-sender-line {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px 8px;
    }

    .reader-sender-name {
      font-weight: 600;
      font-size: 14px;
      line-height: 1.2;
    }

    .reader-recipients-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .reader-recipients {
      display: flex;
      align-items: baseline;
    }

    .reader-recipients-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color);
      width: 40px;
      text-align: end;
      margin-inline-end: 16px;
      line-height: 1.5;
      flex-shrink: 0;
    }

    .reader-recipients-list {
      line-height: 1.5;
      font-size: 14px;
      flex: 1;
      min-width: 0;
    }

    .reader-recipients-list alps-recipient-pill:not(:last-child)::after {
      content: ", ";
      color: var(--text-color);
      white-space: pre;
    }

    .reader-date {
      font-family: var(--font-label);
      font-size: 13px;
      color: var(--text-muted);
    }

    .desktop-date-container {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .reader-size {
      font-family: var(--font-label);
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .mobile-date-container {
      display: none;
    }

    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spinner {
      animation: spin 3s linear infinite;
      display: flex;
      margin-inline-end: 8px;
    }

    .spinner .icon {
      width: 32px;
      height: 32px;
    }

    .empty-reader-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }

    /* Decoration, drawn as alps-icon-btn draws its icon, without the button. */
    .selection-icon {
      display: flex;
      padding: 6px;
    }

    .bulk-spinner-container {
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }

    .spinner.bulk-spinner {
      margin: 0;
    }

    .toolbar-separator {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 8px;
    }

    .mobile-spacer {
      display: none;
    }

    .mobile-only {
      display: none;
    }

    .undisclosed-recipients {
      color: var(--text-muted);
      font-size: 14px;
      margin-top: 4px;
    }

    .reader-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
      min-height: 0;
    }

    .loading-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .loading-state {
      display: flex;
      align-items: center;
      color: var(--text-muted);
    }

    .reader-content-wrapper {
      flex: 1;
      min-height: 0;
    }

    .reader-iframe {
      width: 100%;
      min-height: 100%;
      border: none;
      display: block;
    }

    .reader-empty-body {
      padding: 24px;
      color: var(--text-muted);
      font-style: italic;
      text-align: center;
    }

    .reader-text-wrapper {
      padding: 24px;
    }

    .reader-load-error {
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--text-muted);
      text-align: center;
    }

    /* A plain-text body has no markup to say which way it runs. Each
       paragraph takes the direction of its own first letter, so a Hebrew or
       Arabic line reads right to left beside English ones. */
    .reader-preformatted {
      white-space: pre-wrap;
      unicode-bidi: plaintext;
      font-family: inherit;
      margin: 0;
      color: inherit;
    }

    /* Links found in a plain-text body (utils/linkify.ts). A URL has no spaces
       to wrap at, so it may break anywhere rather than widen the pane. */
    .reader-preformatted a {
      color: var(--accent-color);
      overflow-wrap: anywhere;
    }

    @media (max-width: 768px) {
      .desktop-only {
        display: none !important;
      }

      .desktop-spacer {
        display: none !important;
      }

      .mobile-spacer {
        flex: 1;
        display: block;
      }

      .toolbar-separator.mobile-only {
        display: block;
      }

      .reader-recipients.mobile-only {
        display: flex;
      }

      .desktop-attachments {
        display: none;
      }

      .mobile-attachments {
        display: block;
        flex-shrink: 0;
      }

      .reader-header {
        padding: 16px;
      }

      .reader-text-wrapper {
        padding: 16px;
      }

      .desktop-date {
        display: none;
      }

      .mobile-date-container {
        display: flex;
        flex-direction: column;
        margin-top: 4px;
      }

      .mobile-date {
        display: block;
        font-weight: normal;
        font-size: 13px;
        line-height: 1.2;
      }

      .mobile-size {
        font-size: 11px;
        color: var(--text-muted);
        line-height: 1.2;
        margin-top: 2px;
        font-weight: normal;
      }
    }

    .thread-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }

    .reader-header.thread-header-grouped {
      border-bottom: none;
      padding-bottom: 0;
    }

    /* Lined up with the cards above it, and wrapping rather than shrinking:
       three labels do not fit a narrow pane in German. */
    .conversation-reply {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 0 16px 24px;
    }
  `]}updated(e){if(!e.has(`message`))return;if(!this.message){this.scrolledToKey=null;return}let t=this.keyOf(this.message);t!==this.scrolledToKey&&(this.scrolledToKey=t,this.scrollToCard(t))}scrollToCard(e){this.scrollTimer&&clearTimeout(this.scrollTimer),this.scrollTimer=setTimeout(()=>{this.scrollTimer=null;let t=this.threadItems.find(t=>this.itemKey(t)===e),n=t?this.shadowRoot?.getElementById(this.cardId(t)):null;n&&n.scrollIntoView(Se({behavior:`smooth`,block:`start`}))},50)}willUpdate(e){let t=e.has(`message`),n=e.has(`mailbox`),r=e.has(`messages`);if(t||n){let t=e.get(`message`),n=e.has(`mailbox`)?e.get(`mailbox`):this.mailbox;if(!this.message)this.stayingOn=null,this.resetReadRefusals(),this.localPreferredView=null,this.content=``,this.mimeType=``,this.rawMessageHtml=``,this.loading=!1,this.loadFailed=!1,this.allowRemoteResources=!1,this.hasRemoteResources=!1,this.hasHtml=!1,this.hasText=!1,this.activeBanners=[],this.threadItems=[];else{let e=!t||this.keyOf(t)!==this.keyOf(this.message)||n!==this.mailbox,r=e?this.stayingOn:null;e&&(this.stayingOn=null),r&&r===this.keyOf(this.message)&&n===this.mailbox&&this.threadItems.some(e=>this.itemKey(e)===r)?this.stayOnCard(this.message):e?(this.resetReadRefusals(),this.localPreferredView=null,this.fetchMessageBody(this.message,this.message._isAutosaveUpdate)):(t&&(t.HasBimiPotential&&!this.message.HasBimiPotential&&(this.message={...this.message,HasBimiPotential:!0}),t.HasBimiFailed&&!this.message.HasBimiFailed&&(this.message={...this.message,HasBimiFailed:!0})),this.resolveThread(this.message),this.message._isAutosaveUpdate&&t&&this.message!==t&&this.fetchMessageBody(this.message,!0))}}else r&&this.message&&this.resolveThread(this.message);this.syncReadTimers()}syncReadTimers(){if(!this.isConnected)return;let e=this.settingsStore?.getState()?.markReadTimeout??0,t=this.selectedCount>0;for(let e of[...this.readRefused])this.threadItems.some(t=>t.expanded&&this.itemKey(t)===e)||this.readRefused.delete(e);let n=new Set;if(e>=0&&this.threadItems.length>1&&!t)for(let e of this.threadItems)e.message&&e.expanded&&!this.isOpenItem(e)&&(e.message.Flags?.includes(`\\Seen`)||ms(e.message)||this.readRefused.has(this.itemKey(e))||n.add(this.itemKey(e)));let r=!1;for(let e of[...this.readDueAt.keys()])n.has(e)||(r=this.readDueAt.delete(e)||r);for(let t of n)this.readDueAt.has(t)||(this.readDueAt.set(t,Date.now()+e*1e3),r=!0);r&&this.armReadTimer()}armReadTimer(){if(this.readTimer&&clearTimeout(this.readTimer),this.readTimer=null,this.readDueAt.size===0)return;let e=Math.max(0,Math.min(...this.readDueAt.values())-Date.now());this.readTimer=setTimeout(()=>this.flushReadDue(),e)}flushReadDue(){this.readTimer=null;let e=Date.now(),t=[...this.readDueAt].filter(([,t])=>t<=e).map(([e])=>e);for(let e of t)this.readDueAt.delete(e);let n=t.filter(e=>{let t=this.threadItems.find(t=>this.itemKey(t)===e);return!!t&&t.expanded&&!t.message?.Flags?.includes(`\\Seen`)});n.length>0&&this.markMembersRead(n,!1),this.armReadTimer()}patchConversationFlag(e,t,n){for(let r of this.conversationReads){let i=r.flags.get(e)??new Map;i.set(t,n),r.flags.set(e,i)}this._conversation&&={...this._conversation,messages:this._conversation.messages.map(r=>{if(this.keyOf(r)!==e)return r;let i=r.Flags||[];return n===`add`===i.includes(t)?r:{...r,Flags:n===`add`?[...i,t]:i.filter(e=>e!==t)}})}}patchMemberFlag(e,t,n){let r=e=>{let r=e?.Flags||[],i=r.includes(t);return n===`add`===i?e:{...e,Flags:n===`add`?[...r,t]:r.filter(e=>e!==t)}},i=this.threadItems.findIndex(t=>this.itemKey(t)===e);if(i!==-1){let e=this.threadItems[i],t=r(e.message);t!==e.message&&(this.threadItems[i]={...e,message:t},this.threadItems=[...this.threadItems])}this.patchConversationFlag(e,t,n),this.message&&this.keyOf(this.message)===e&&(this.message.Flags=r(this.message).Flags,this.requestUpdate())}async markMembersRead(e,t=!0){let n=this.readGeneration,r=new Set(e),i=new Map;for(let e of this.threadItems){if(!e.message||!r.has(this.itemKey(e)))continue;let t=i.get(e.mailbox)??[];t.push(String(e.message.UID)),i.set(e.mailbox,t)}let a=this.listedKeys(),o=(e,t,n)=>{for(let r of t){let t=R(e,r);a.has(t)&&this.isConnected&&this.dispatchEvent(new CustomEvent(`message-flags-changed`,{detail:{uid:r,mailbox:e,flag:B,action:n},bubbles:!0,composed:!0})),this.patchMemberFlag(t,B,n)}},s=!1;await Promise.all([...i].map(async([e,t])=>{o(e,t,`add`);let r={ok:!1};try{r=await H.setFlag(e,t,[B],`add`)}catch(e){E.error(`Failed to mark conversation messages read`,e)}if(n===this.readGeneration)for(let n of t){let t=R(e,n);r.ok?this.readRefused.delete(t):this.readRefused.add(t)}r.ok||(o(e,t,`remove`),r.reason!==`auth`&&(s=!0))})),s&&this.sayReadRefused(t,n)}sayReadRefused(e,t){if(this.isConnected&&t===this.readGeneration){if(!e){if(this.readRefusalSaid)return;this.readRefusalSaid=!0}window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`toast.flagChangeFailed`)||`Could not update the messages`,type:`error`,duration:4e3}}))}}expandUnreadOnOpen(){if(this.openIsUnsent)return;let e=this.threadItems.filter(e=>e.message&&!e.message.Flags?.includes(`\\Seen`)&&!ms(e.message)),t=!1;for(let n of e.slice(0,hs))n.expanded||(n.expanded=!0,t=!0,!n.content&&!n.loading&&(n.loading=!0,this.queueItemBody(n)));return t&&(this.threadItems=[...this.threadItems]),e[0]?this.itemKey(e[0]):void 0}settleOpenedConversation(){if(!this.message||this.threadItems.length<2)return;let e=this.expandUnreadOnOpen();e&&e!==this.keyOf(this.message)&&this.scrollToCard(e)}loadRemoteResources(){if(this.allowRemoteResources=!0,this.message&&this.rawMessageHtml){this.hasRemoteResources=!1,this.content=yi(this.rawMessageHtml,{mailbox:this.mailboxOfMessage(this.message),messageUid:this.message.UID,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}});let e=this.threadItems.find(e=>this.isOpenItem(e));e&&(e.allowRemoteResources=!0,e.content=this.content,e.hasRemoteResources=this.hasRemoteResources,this.updateThreadItemReference(e))}}resolveThread(e){if(!e)return;let t=this.settingsStore?.getState()?.enableThreading??!0,n=[],r=null;if(t&&this.messages&&this.messages.length>0){let t=this.messages.find(t=>this.keyOf(t)===this.keyOf(e));if(t)r=t;else for(let t of this.messages)if(t.SubMessages&&t.SubMessages.find(t=>this.keyOf(t)===this.keyOf(e))){r=t;break}}if(r?(n=[r,...r.SubMessages||[]],n.sort((e,t)=>(e.Envelope?.Date?new Date(e.Envelope.Date).getTime():0)-(t.Envelope?.Date?new Date(t.Envelope.Date).getTime():0))):n=(t&&this.threadItems.length>1&&this.threadItems.some(t=>this.itemKey(t)===this.keyOf(e))?this.threadItems.map(e=>({...e.message,Mailbox:e.mailbox})):null)??[e],t&&this._conversation?.key===this.keyOf(e)){let e=new Set(n.map(e=>this.keyOf(e))),t=this._conversation.messages.filter(t=>!e.has(this.keyOf(t)));t.length>0&&(n=[...n,...t],n.sort((e,t)=>(e.Envelope?.Date?new Date(e.Envelope.Date).getTime():0)-(t.Envelope?.Date?new Date(t.Envelope.Date).getTime():0)))}this.droppedKeys.size>0&&(n=n.filter(e=>!this.droppedKeys.has(this.keyOf(e)))),this._isThread=t&&n.length>1;let i=this.getSentMailboxName(),a=this.threadItems||[];this.threadItems=n.map(t=>{let n=this.keyOf(t)===this.keyOf(e),r=a.find(e=>this.itemKey(e)===this.keyOf(t));if(r){let e={...t,Flags:t.Flags===void 0?r.message.Flags??[]:t.Flags??[]};return r.message.HasBimiPotential&&(e.HasBimiPotential=!0),r.message.HasBimiFailed&&(e.HasBimiFailed=!0),{...r,message:e}}return{message:t,content:``,mimeType:``,loading:!1,attachments:[],rawMessageHtml:``,hasHtml:!1,hasText:!1,activeBanners:[],allowRemoteResources:this.allowRemoteResources,hasRemoteResources:!1,isSent:(this.mailbox||``).toLowerCase()===i.toLowerCase()||(t.Mailbox||``).toLowerCase()===i.toLowerCase(),mailbox:t.Mailbox||this.mailbox,expanded:n}})}async fetchMessageBody(e,t=!1){e&&(e._isAutosaveUpdate=!1),this.message&&(this.message._isAutosaveUpdate=!1),t||(this.conversationGeneration++,this.content=``,this.mimeType=``,this.rawMessageHtml=``,this.loading=!0,this.loadFailed=!1,this.activeBanners=[],this.allowRemoteResources=this.settingsStore?.getState().showRemoteContent===`always`,this.hasRemoteResources=!1,this.threadItems=[],this._conversation=null,this.droppedKeys.clear());let n=this.conversationGeneration;this.resolveThread(e),this.prefetchQueue=[];let r=this.threadItems.find(t=>this.itemKey(t)===this.keyOf(e))||this.threadItems[0];if(r){r.loading=!t,r.expanded=!0,this._deferPropertySync=!1;let i=this.bodyLoads.get(this.itemKey(r))??this.fetchItemBody(r);i.then(()=>{this.isConnected&&this.message&&this.keyOf(this.message)===this.keyOf(e)&&this.requestUpdate()}),t||i.catch(()=>{}).then(()=>{this.isConnected&&n===this.conversationGeneration&&this.message&&this.keyOf(this.message)===this.keyOf(e)&&this.loadConversation(e)})}else t||this.loadConversation(e)}queueItemBody(e){this.isConnected&&(this.prefetchQueue.push(e),this.drainPrefetch())}async drainPrefetch(){if(!this.prefetching){this.prefetching=!0;try{for(;this.prefetchQueue.length>0;){let e=this.prefetchQueue.shift();e.content||await this.fetchItemBody(e,!0)}}finally{this.prefetching=!1}}}async loadConversation(e,t=!0){if(!(this.settingsStore?.getState()?.enableThreading??!0)||!e?.UID)return;let n=++this.conversationGeneration,r=q.generation(),i={key:this.keyOf(e),generation:n,moves:new Map,removed:new Set,flags:new Map};this.conversationReads.add(i);let a=e=>{let t=new Set,n=e;for(;;){let e=this.keyOf(n);for(let[t,r]of i.flags.get(e)??[]){let e=n.Flags??[];n={...n,Flags:r===`add`?e.includes(t)?e:[...e,t]:e.filter(e=>e!==t)}}let r=i.moves.get(e);if(!r||t.has(e))return n;t.add(e),n={...n,UID:r.uid,Mailbox:r.mailbox}}},o=()=>this.isConnected&&n===this.conversationGeneration&&r===q.generation()&&!!this.message&&this.keyOf(this.message)===i.key,s=e.Mailbox||this.mailbox;if(t&&!this.mayHaveConversation(e))this.conversationReads.delete(i),o()&&this.settleOpenedConversation();else{try{let t=await F(`/mailboxes/${k(s)}/messages/${e.UID}/thread`);if(t.ok){let e=await t.json(),n=(Array.isArray(e?.Messages)?e.Messages:[]).map(a).filter(e=>!i.removed.has(this.keyOf(e)));if(!o())return;this._conversation={key:i.key,messages:n},n.length>1&&(this.resolveThread(this.message),this.requestUpdate())}}catch(e){o()&&E.error(`Failed to load the conversation`,e)}finally{this.conversationReads.delete(i)}t&&o()&&this.settleOpenedConversation()}}mayHaveConversation(e){if(this.loadFailed)return!0;let t=this.message&&this.keyOf(this.message)===this.keyOf(e)?this.message:e;return(e.ThreadCount??0)!==1||(t.Flags??e.Flags??[]).includes(`\\Answered`)||t.Envelope?.InReplyTo||e.Envelope?.InReplyTo?!0:Array.isArray(t.References)&&t.References.length>0}liveFlags(e,t){let n=this.threadItems.find(t=>this.itemKey(t)===e)??t;if(n.message&&`Flags`in n.message)return n.message.Flags??[]}updateThreadItemReference(e){if(!e.message||!this.isConnected)return;let t=this.threadItems.findIndex(t=>this.itemKey(t)===this.itemKey(e));t!==-1&&(this.threadItems[t]={...e},this.threadItems=[...this.threadItems])}async loadedItem(e){let t;for(;t=this.bodyLoads.get(e);)await t;return this.threadItems.find(t=>this.itemKey(t)===e)}readWaitingCard(e){if(this.bodyLoads.has(e))return;let t=this.threadItems.find(t=>this.itemKey(t)===e);t?.loading&&!t.content&&(this.prefetchQueue=this.prefetchQueue.filter(t=>this.itemKey(t)!==e),this.fetchItemBody(t))}async fetchItemBody(e,t=!1){if(!e.message)return;let n=e.message,r=e.mailbox,i=this.itemKey(e),a=q.generation(),o=(this.bodyReads.get(i)??0)+1;this.bodyReads.set(i,o);let s=()=>this.bodyReads.get(i)===o&&a===q.generation(),c,l=new Promise(e=>{c=e});this.bodyLoads.set(i,l);let u=this.localPreferredView||this.settingsStore?.getState()?.preferredView||`html`;try{let o=q.get(r,n.UID.toString(),u),c,l=!1;if(o)c=o;else{let e=t?it:{},i=await F(`/mailboxes/${k(r)}/messages/${n.UID}?view=${u}`,e);if(!s())return;if(i.status===401){window.location.hash=`/login`;return}if(!i.ok)throw Error(`Failed to fetch metadata`);let a=await i.json();if(!s())return;let o,d,f=a.Part;if(f&&typeof a.Body==`string`)(f.MIMEType||f.MimeType||`text/plain`).toLowerCase()===`text/html`?o=a.Body:d=a.Body;else if(f){let t=Array.isArray(f.Path)&&f.Path.length?f.Path.join(`.`):`1`,i=await F(`/mailboxes/${k(r)}/messages/${n.UID}/raw?part=${t}&text=1`,e).catch(e=>(E.error(`Failed to fetch message body:`,e),null));if(!s())return;if(i?.status===401){window.location.hash=`/login`;return}if(i?.ok){let e=await i.text();if(!s())return;(f.MIMEType||f.MimeType||`text/plain`).toLowerCase()===`text/html`?o=e:d=e}else i&&E.error(`Failed to fetch message body:`,i.status),l=!0}c={Message:a.Message,Part:a.Part,Attachments:a.Attachments,RawHtml:o,RawText:d,HasHTML:!!a.HasHTML,HasText:!!a.HasText}}let d=c.Message?{...n,...c.Message}:n,f=!!c.HasHTML,p=!!c.HasText,m=e.mimeType,h=e.content,g=e.rawMessageHtml,_=e.activeBanners,v=e.hasRemoteResources,y=t=>yi(t,{mailbox:r,messageUid:d?.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:d?.BodyStructure,onRemoteResourceBlocked:()=>{v=!0}});if(c.Part&&!l){if(m=c.Part.MIMEType||c.Part.MimeType||`text/plain`,c.RawHtml!==void 0){v=!1;let e={content:c.RawHtml,isHtml:!0,message:d,mailbox:r,banners:[],i18nStore:this.i18nStore},t=await I.invokeHookAsync(`reader:content`,e);if(!s())return;g=c.RawHtml;for(let e of t)e&&typeof e==`string`&&(g=e);_=e.banners||[],h=y(g)}else if(c.RawText!==void 0){v=!1;let e={content:c.RawText,isHtml:!1,message:d,mailbox:r,banners:[],i18nStore:this.i18nStore},t=await I.invokeHookAsync(`reader:content`,e);if(!s())return;h=c.RawText;for(let e of t)e&&typeof e==`string`&&(h=e);_=e.banners||[],e.isHtml&&(m=`text/html`,f=!0,h=y(h))}}!o&&!l&&q.generation()===a&&q.set(r,n.UID.toString(),u,{...c,HasHTML:f,HasText:p}),e.attachments=c.Attachments||[],e.hasHtml=f,e.hasText=p,e.message={...d,Flags:this.liveFlags(i,e)??d.Flags},e.mimeType=m,e.content=h,e.rawMessageHtml=g,e.activeBanners=_,e.hasRemoteResources=v,e.loadFailed=l}catch(t){if(!s())return;E.error(`Failed to fetch message:`,t),e.loadFailed=!0}finally{this.bodyLoads.get(i)===l&&this.bodyLoads.delete(i),c(),s()&&(e.loading=!1,this.isConnected&&!this._deferPropertySync&&this.isOpenItem(e)&&this.showOpenItem(e),this.updateThreadItemReference(e))}}getSentMailboxName(){if(this.mailboxes&&Array.isArray(this.mailboxes)){for(let e of this.mailboxes){let t=e.Name||e.Mailbox;if(t&&(e.Attrs||[]).some(e=>typeof e==`string`&&(e.toLowerCase()===`\\sent`||e.toLowerCase()===`\\\\sent`)))return t}let e=[`sent`,`sent messages`,`sent items`,`sent-mail`];for(let t of this.mailboxes){let n=t.Name||t.Mailbox;if(n&&e.includes(n.toLowerCase()))return n}}return ae}async toggleItemExpansion(e){e.expanded=!e.expanded,this.updateThreadItemReference(e),e.expanded&&!e.content&&!e.loading&&(e.loading=!0,this.updateThreadItemReference(e),await this.fetchItemBody(e))}async retryItemBody(e){e&&!e.loading&&(e.loading=!0,e.loadFailed=!1,this.updateThreadItemReference(e),this.isOpenItem(e)&&(this.loading=!0,this.loadFailed=!1),await this.fetchItemBody(e))}loadRemoteResourcesForItem(e){e.allowRemoteResources=!0,e.message&&e.rawMessageHtml&&(e.hasRemoteResources=!1,e.content=yi(e.rawMessageHtml,{mailbox:e.mailbox,messageUid:e.message.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:e.message.BodyStructure,onRemoteResourceBlocked:()=>{e.hasRemoteResources=!0}}),this.isOpenItem(e)&&(this.content=e.content,this.allowRemoteResources=!0,this.hasRemoteResources=e.hasRemoteResources),this.updateThreadItemReference(e))}async toggleItemStar(e){if(!e.message)return;let t=e.message.Flags?.includes(V),n=t?`remove`:`add`;t?e.message.Flags=e.message.Flags.filter(e=>e!==V):e.message.Flags=[...e.message.Flags||[],V],this.updateThreadItemReference(e);let r=this.itemKey(e);this.patchConversationFlag(r,V,n);let i=t?`add`:`remove`,a=this.listedKeys().has(this.itemKey(e)),o=t=>{a&&this.dispatchEvent(new CustomEvent(`message-flags-changed`,{detail:{uid:String(e.message.UID),mailbox:e.mailbox,flag:V,action:t},bubbles:!0,composed:!0}))};o(n);try{let{ok:a}=await H.setFlag(e.mailbox,[String(e.message.UID)],[V],n);a?this.isOpenItem(e)&&(this.message.Flags=e.message.Flags,this.requestUpdate()):(t?e.message.Flags=[...e.message.Flags||[],V]:e.message.Flags=e.message.Flags.filter(e=>e!==V),this.updateThreadItemReference(e),this.patchConversationFlag(r,V,i),o(i))}catch(n){E.error(`Failed to toggle star for thread item`,n),t?e.message.Flags=[...e.message.Flags||[],V]:e.message.Flags=e.message.Flags.filter(e=>e!==V),this.updateThreadItemReference(e),this.patchConversationFlag(r,V,i),o(i)}}deleteItem(e){if(!e.message)return;let t=this.itemKey(e),n=this.isOpenItem(e),r=this.mailbox===`*`?this.threadItems.filter(e=>e.message):this.conversationItems,i=n?[...r].reverse().find(e=>this.itemKey(e)!==t):void 0;this.dispatchEvent(new CustomEvent(`action`,{detail:{action:`delete`,uid:String(e.message.UID),mailbox:e.mailbox,nextUid:i?String(i.message.UID):void 0,nextMailbox:i?.mailbox,done:e=>{e&&(this.dropCard(t),i&&(this.stayingOn=this.itemKey(i)))}}}))}stayOnCard(e){let t=this.keyOf(e),n=!1;for(let e of this.conversationReads)e.generation===this.conversationGeneration&&(e.key=t,n=!0);this._conversation&&={...this._conversation,key:t},this.resolveThread(e);let r=this.threadItems.find(e=>this.itemKey(e)===t);if(r&&(r.expanded=!0,r.loading||this.bodyLoads.has(t)?this.loading=!0:r.content?this.showOpenItem(r):(r.loading=!0,this.loading=!0,this.fetchItemBody(r)),this.updateThreadItemReference(r),!this._conversation&&!n)){let e=this.conversationGeneration,n=q.generation();(this.bodyLoads.get(t)??Promise.resolve()).then(()=>{this.isConnected&&e===this.conversationGeneration&&n===q.generation()&&this.message&&this.keyOf(this.message)===t&&this.loadConversation(this.message,!1)})}}showOpenItem(e){this.content=e.content,this.mimeType=e.mimeType,this.rawMessageHtml=e.rawMessageHtml,this.attachments=e.attachments,this.hasHtml=e.hasHtml,this.hasText=e.hasText,this.activeBanners=e.activeBanners,this.allowRemoteResources=e.allowRemoteResources,this.hasRemoteResources=e.hasRemoteResources,this.loadFailed=!!e.loadFailed,this.loading=!1,this.message={...this.message,...e.message}}dropCard(e){this.droppedKeys.add(e);for(let t of this.conversationReads)t.removed.add(e);if(this.threadItems=this.threadItems.filter(t=>this.itemKey(t)!==e),this._conversation&&={...this._conversation,messages:this._conversation.messages.filter(t=>this.keyOf(t)!==e)},this.threadItems.length===1&&!this.threadItems[0].expanded){let e=this.threadItems[0];e.expanded=!0,!e.content&&!e.loading&&(e.loading=!0,this.fetchItemBody(e))}this._isThread=this.threadItems.length>1,this.requestUpdate()}reloadConversation(){this.message&&this.loadConversation(this.message,!1)}async _handleActionForItem(e,t){if(e===`reply`||e===`replyAll`||e===`forward`){let n=this.bodyActionCurrent(),r=this.itemKey(t);if(this.readWaitingCard(r),!t.loading&&t.loadFailed&&this.retryItemBody(t),this.bodyLoads.has(r)){let e=await this.loadedItem(r);if(!e)return;t=e}if(!n())return;if(t.loadFailed){this._sayBodyUnread();return}let i=``;t.mimeType===`text/plain`?i=t.content:t.rawMessageHtml&&(i=Ro(t.rawMessageHtml));let a=this.settingsStore?.getState()?.dateFormat||`auto`,o=String(this.settingsStore?.getState()?.hourFormat||`auto`),{subject:s,to:c,cc:l,quotedText:u,quotedHtml:d}=Eo(e,t.message,i,t.rawMessageHtml,t.hasHtml,a,o,this.ownAddresses()),f=e===`forward`?t.attachments.map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})):[],p=[...f,...Pi(t.message.BodyStructure,d).filter(e=>!f.some(t=>t.partPath===e.partPath))],m=e===`reply`||e===`replyAll`?Fi(t.message,t.mailbox):{};this.composeStore.openComposer({subject:s,to:c,cc:l,text:u,html:d,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:p,quoteSource:{mailbox:t.mailbox,uid:String(t.message.UID),structure:t.message.BodyStructure},from:this.senderFor(t.message.Envelope),...m})}else{if(e===`markRead`)return void this.markMembersRead([this.itemKey(t)]);if(e===`markUnread`||e===`downloadMessage`||e===`showOriginal`)this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,uid:String(t.message.UID),mailbox:t.mailbox}}));else if(e===`showPlaintext`)this.localPreferredView=`text`,this.fetchItemBody(t);else if(e===`showHtml`)this.localPreferredView=`html`,this.fetchItemBody(t);else if(e===`print`){let e=t.allowRemoteResources?`&remote=1`:``;window.open(`#/print?mailbox=`+encodeURIComponent(t.mailbox)+`&uid=`+t.message.UID+e,`_blank`)}}}applyThemeToIframe(e){Io(e,this.settingsStore?.getState()?.themeIframeContent??!1)}applyThemeToAllIframes(){let e=this.shadowRoot?.querySelectorAll(`iframe.reader-iframe`);e&&e.forEach(e=>this.applyThemeToIframe(e))}onIframeLoad(e){let t=e.target;Lo(t,this.settingsStore?.getState()?.themeIframeContent??!1),fs(t,()=>this.composeStore)}onTextBodyClick(e){ds(e,this.composeStore)}bodyActionCurrent(){let e=this.readGeneration,t=q.generation();return()=>this.isConnected&&e===this.readGeneration&&t===q.generation()}_sayBodyUnread(){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`messageReader.loadError`),type:`error`}}))}async _handleEditDraft(e){let t=e&&!(e instanceof Event),n=t?e.message:this.message,r=t?e.mailbox:this.mailboxOfMessage(n);if(!n)return;let i=this.bodyActionCurrent(),a=t?this.itemKey(e):this.keyOf(n),o=t?e:this.threadItems.find(e=>this.itemKey(e)===a);if(o&&!o.loading&&(o.loadFailed||t&&!o.content)&&this.retryItemBody(o),this.bodyLoads.has(a)){let n=await this.loadedItem(a);if(!n)return;if(t)e=n;else if(!this.message||this.keyOf(this.message)!==a)return}if(n=t?e.message:this.message,!i())return;if(t?e.loadFailed:this.loadFailed){this._sayBodyUnread();return}let s=t&&e?e.content:this.content,c=t&&e?e.mimeType:this.mimeType,l=t&&e?e.rawMessageHtml:this.rawMessageHtml,u=t&&e?e.attachments:this.attachments,d=!!(t&&e?e.hasHtml:this.hasHtml);if(d&&!l){let e=await this.readDraftHtml(r,String(n.UID));if(!i()||this.droppedKeys.has(a)||o&&!this.threadItems.some(e=>this.itemKey(e)===a))return;if(e===null){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`messageReader.loadError`),type:`error`}}));return}l=e}let f=``;f=c===`text/plain`?s:Ro(l);let p=(u||[]).map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})),m=[...p,...Pi(n.BodyStructure,l||``).filter(e=>!p.some(t=>t.partPath===e.partPath))];this.composeStore.openComposer({draftUid:n.UID.toString(),draftMailbox:r,from:this.senderFor({From:n.Envelope?.From}),subject:n.Envelope?.Subject||``,to:Co(n.Envelope?.To),cc:Co(n.Envelope?.Cc),bcc:Co(n.Envelope?.Bcc),text:f,html:l,format:d?`html`:`text`,attachments:m,quoteSource:{mailbox:r,uid:n.UID.toString(),structure:n.BodyStructure},inReplyTo:n.Envelope?.InReplyTo||void 0,references:Array.isArray(n.References)&&n.References.length?n.References:void 0})}async readDraftHtml(e,t){let n=q.get(e,t,`html`);if(n?.RawHtml!==void 0)return n.RawHtml;try{let n=await F(`/mailboxes/${k(e)}/messages/${t}?view=html`);if(!n.ok)return null;let r=await n.json(),i=r.Part;if(!i||(i.MIMEType||i.MimeType||``).toLowerCase()!==`text/html`)return null;if(typeof r.Body==`string`)return r.Body;let a=await F(`/mailboxes/${k(e)}/messages/${t}/raw?part=${Array.isArray(i.Path)?i.Path.join(`.`):i.Path}&text=1`);return a.ok?await a.text():null}catch(e){return E.error(`Failed to read the draft's HTML:`,e),null}}get showSenderAvatars(){return this.settingsStore?.getState()?.showSenderAvatars??!0}canToggleReadFor(e){return!e.message||e.isSent||ms(e.message)||ue(this.mailbox||``,this.mailboxes)===`trash`?!1:(this.mailbox||``).toLowerCase()!==this.getSentMailboxName().toLowerCase()}get newestAnswerable(){return[...this.threadItems].reverse().find(e=>e.message&&!ms(e.message))}async answerNewest(e){let t=this.newestAnswerable;if(!t)return;let n=this.itemKey(t);!t.content&&!t.loading&&await this.fetchItemBody(t);let r=this.threadItems.find(e=>this.itemKey(e)===n)??t;await this._handleActionForItem(e,r)}renderConversationReply(){return!this.toolbarIsConversation||!this.newestAnswerable?``:b`
      <div class="conversation-reply">
        <alps-button variant="normal" icon="arrowBendUpLeft" @click=${()=>this.answerNewest(`reply`)}>${this.i18nStore?.t(`messageReader.reply`)}</alps-button>
        <alps-button variant="normal" icon="arrowBendDoubleUpLeft" @click=${()=>this.answerNewest(`replyAll`)}>${this.i18nStore?.t(`messageReader.replyAll`)}</alps-button>
        <alps-button variant="normal" icon="arrowBendUpRight" @click=${()=>this.answerNewest(`forward`)}>${this.i18nStore?.t(`messageReader.forward`)}</alps-button>
      </div>
    `}renderThreadCard(e){return b`
      <alps-thread-card
        id=${this.cardId(e)}
        .item=${e}
        .mailbox=${this.mailbox}
        .canToggleRead=${this.canToggleReadFor(e)}
        .showSenderAvatars=${this.showSenderAvatars}
        @toggle-expansion=${e=>this.toggleItemExpansion(e.detail.item)}
        @load-remote-resources=${e=>this.loadRemoteResourcesForItem(e.detail.item)}
        @retry-body=${e=>this.retryItemBody(e.detail.item)}
        @toggle-star=${e=>this.toggleItemStar(e.detail.item)}
        @delete-item=${e=>this.deleteItem(e.detail.item)}
        @action-for-item=${e=>this._handleActionForItem(e.detail.action,e.detail.item)}
        @edit-draft-for-item=${e=>{this._handleEditDraft(e.detail.item)}}
      ></alps-thread-card>
    `}render(){let e=this.selectedCount>0,t=this.settingsStore?.getState()?.enableThreading??!0;if(!this.message&&!e)return b`
        <div class="empty-reader-state">
          ${this.bulkProcessing?b`
            <!--
              A bulk write is still running, and the rows it is about have
              already left the list — so the selection is empty and this pane
              would otherwise flip back to "select a message" while the server
              is still working. The loader is the one place left that can say
              so, and it needs no words to.
            -->
            <div class="bulk-spinner-container"><alps-loader></alps-loader></div>
          `:this.i18nStore?.t(`messageReader.selectMessage`)}
        </div>
      `;let n=this.localPreferredView||this.settingsStore?.getState()?.preferredView||`html`,i=this.message||{},a=qn(i.Flags,this.i18nStore),o=new Set([`$label1`,`$label2`,`$label3`,`$label4`,`$label5`]),s=e||!this.message?[]:Yn(i.Flags).filter(e=>!o.has(e.toLowerCase())),c=i.Envelope?.From?.[0]||{},l=c.Mailbox&&c.Host?`${c.Mailbox}@${c.Host}`:``,u=c.Name||l||this.i18nStore?.t(`messageList.unknownSender`),d=this.settingsStore?.getState()?.dateFormat||`auto`,f=String(this.settingsStore?.getState()?.hourFormat||`auto`),p=i.Envelope?.Date?xe(i.Envelope.Date,d,f):``,m=be(i,c),h=(this.mailbox||``).toLowerCase(),_=ue(this.mailbox||``,this.mailboxes),v=_===`archive`,y=_===`junk`,x=_===`trash`,ee=_===`drafts`,S=h===this.getSentMailboxName().toLowerCase(),C=this.toolbarIsConversation,w=this.readToggleMarksRead,T=C?this.i18nStore?.t(`messageReader.deleteThread`):this.message?.Flags?.includes(`\\Draft`)||ee?this.i18nStore?.t(`messageReader.discardDraft`):this.i18nStore?.t(`messageReader.delete`);return b`
      <alps-toolbar class="toolbar" ?scrolled=${this.isScrolled}>
        ${this.layoutMode===`full`?b`
          <alps-icon-btn @click=${()=>this.dispatchEvent(new CustomEvent(`close`))} title=${this.i18nStore?.t(`messageReader.back`)} icon="arrowLeft"></alps-icon-btn>
          <div class="toolbar-separator desktop-only"></div>
        `:``}
        
        <div class="toolbar-spacer mobile-spacer"></div>
        
        ${!v&&!x&&!ee?b`
        <alps-icon-btn title=${this.i18nStore?.t(`messageReader.archive`)} @click=${()=>this._handleAction(`archive`)} icon="archiveBox"></alps-icon-btn>
        `:``}
        ${!y&&!x&&!ee&&!S?b`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t(`messageReader.reportSpam`)} @click=${()=>this._handleAction(`reportSpam`)} icon="warningDiamond"></alps-icon-btn>
        `:``}
        ${y?b`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t(`messageReader.notSpam`)} @click=${()=>this._handleAction(`notSpam`)} icon="notSpam"></alps-icon-btn>
        `:``}
        <alps-icon-btn title=${T} @click=${()=>this._handleAction(`delete`)} icon="trash"></alps-icon-btn>
        <alps-folder-selector-popup
          class="desktop-only"
          .mailboxes=${this.mailboxes}
          .currentMailbox=${this.mailbox}
          @folder-selected=${e=>this._handleAction(e.detail.isMove?`moveTo`:`copyTo`,e.detail.folderName)}
        >
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`messageReader.moveTo`)} icon="folderOpen"></alps-icon-btn>
        </alps-folder-selector-popup>
        
        <div class="toolbar-separator"></div>
        
        ${!x&&!S?b`
        <alps-icon-btn title=${w?this.i18nStore?.t(`messageReader.markRead`):this.i18nStore?.t(`messageReader.markUnread`)} @click=${()=>this._handleAction(`markUnread`)} icon=${w?`envelopeOpen`:`envelopeUnread`}></alps-icon-btn>
        `:``}
        ${C?``:b`
        <!-- A star is a flag on ONE message, so over a conversation it is each
             card's own star and not a button up here. -->
        <alps-icon-btn class="desktop-only" ?active=${e&&this.allSelectedStarred||!e&&this.message?.Flags?.includes(`\\Flagged`)} title=${this.i18nStore?.t(`messageReader.star`)} @click=${()=>this._handleAction(`star`)} icon=${e&&this.allSelectedStarred||!e&&this.message?.Flags?.includes(`\\Flagged`)?`starFourFill`:`starFour`}></alps-icon-btn>
        `}
        
        <alps-popup align="start" class="tags-popup">
          <alps-icon-btn slot="trigger" class="desktop-only" title=${this.i18nStore?.t(`messageReader.tags`)} icon="tag"></alps-icon-btn>
          ${[`$label1`,`$label2`,`$label3`,`$label4`,`$label5`].map(e=>{let t=this.hasTag(e);return b`
              <button class="dropdown-item ${t?`active`:``}" @click=${()=>this._handleTag(e)}>
                <span class="tag-dot" style="background: ${Zn(e)}"></span>
                <span class="item-text">${Xn(e,this.i18nStore)}</span>
              </button>
            `})}
          ${s.length?b`
            <div class="dropdown-divider"></div>
            ${s.map(e=>b`
              <button class="dropdown-item active" title=${this.i18nStore?.t(`messageReader.removeTag`)} @click=${()=>this._handleTag(e)}>
                <span class="tag-dot" style="background: ${Zn(e)}"></span>
                <span class="item-text">${Xn(e,this.i18nStore)}</span>
                ${P(`x`)}
              </button>
            `)}
          `:``}
          <div class="dropdown-divider"></div>
          <button class="dropdown-item text-danger" @click=${()=>this._handleRemoveAllTags()}>
            <span class="item-text">${this.i18nStore?.t(`messageReader.removeAllTags`)}</span>
          </button>
        </alps-popup>

        <div class="toolbar-spacer desktop-spacer"></div>
        <div class="toolbar-separator mobile-only"></div>
          
          ${e?``:b`
            ${this.message?.Flags?.includes(`\\Draft`)||ee?b`
              <alps-icon-btn title=${this.i18nStore?.t(`messageReader.editDraft`)} @click=${this._handleEditDraft} icon="pen"></alps-icon-btn>
            `:C?``:b`
              <alps-icon-btn title=${this.i18nStore?.t(`messageReader.reply`)} @click=${()=>this._handleAction(`reply`)} icon="arrowBendUpLeft"></alps-icon-btn>
            `}
            
            <alps-popup align="end" class="more-menu-popup">
              <alps-icon-btn slot="trigger" class="more-btn" title=${this.i18nStore?.t(`messageReader.moreOptions`)} icon="dotsThreeVertical"></alps-icon-btn>
            
            ${this.message?.Flags?.includes(`\\Draft`)||ee||C?``:b`
            <button class="dropdown-item" @click=${()=>this._handleAction(`reply`)}>
              ${P(`arrowBendUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reply`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`replyAll`)}>
              ${P(`arrowBendDoubleUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.replyAll`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`forward`)}>
              ${P(`arrowBendUpRight`)} <span class="item-text">${this.i18nStore?.t(`messageReader.forward`)}</span>
            </button>
            <div class="dropdown-divider"></div>
            `}
            ${!v&&!x&&!ee?b`
            <button class="dropdown-item" @click=${()=>this._handleAction(`archive`)}>
              ${P(`archiveBox`)} <span class="item-text">${this.i18nStore?.t(`messageReader.archive`)}</span>
            </button>
            `:``}
            ${!y&&!x&&!ee&&!S?b`
            <button class="dropdown-item" @click=${()=>this._handleAction(`reportSpam`)}>
              ${P(`warningDiamond`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reportSpam`)}</span>
            </button>
            `:``}
            ${y?b`
            <button class="dropdown-item" @click=${()=>this._handleAction(`notSpam`)}>
              ${P(`notSpam`)} <span class="item-text">${this.i18nStore?.t(`messageReader.notSpam`)}</span>
            </button>
            `:``}
            <button class="dropdown-item" @click=${()=>this._handleAction(`delete`)}>
              ${P(`trash`)} <span class="item-text">${T}</span>
            </button>
            <alps-folder-selector-popup
              class="folder-selector"
              .mailboxes=${this.mailboxes}
              .currentMailbox=${this.mailbox}
              @folder-selected=${e=>this._handleAction(e.detail.isMove?`moveTo`:`copyTo`,e.detail.folderName)}
            >
              <button slot="trigger" class="dropdown-item">
                ${P(`folderOpen`)} <span class="item-text">${this.i18nStore?.t(`messageReader.moveTo`)}</span>
              </button>
            </alps-folder-selector-popup>
            ${!x&&!S||!C?b`
            <div class="dropdown-divider"></div>
            ${!x&&!S?b`
            <button class="dropdown-item" @click=${()=>this._handleAction(`markUnread`)}>
              ${P(w?`envelopeOpen`:`envelopeUnread`)} <span class="item-text">${w?this.i18nStore?.t(`messageReader.markRead`):this.i18nStore?.t(`messageReader.markUnread`)}</span>
            </button>
            `:``}
            ${C?``:b`
            <button class="dropdown-item" @click=${()=>this._handleAction(`star`)}>
              ${this.message?.Flags?.includes(`\\Flagged`)?P(`starFourFill`):P(`starFour`)} <span class="item-text">${this.i18nStore?.t(`messageReader.star`)}</span>
            </button>
            `}
            `:``}
            ${C?``:b`
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${()=>this._handleAction(`print`)}>
              ${P(`printer`)} <span class="item-text">${this.i18nStore?.t(`messageReader.print`)}</span>
            </button>
            `}
            <!-- Stays over a conversation: it is a preference about the READER,
                 not a verb on a message. -->
            <div class="dropdown-divider"></div>
            <button class="dropdown-item ${n===`text`?`active`:``}" ?disabled=${!this.hasText} @click=${()=>this.hasText&&this._handleAction(`showPlaintext`)}>
              ${P(`textAlignLeft`)}
              <span class="item-text">${this.i18nStore?.t(`messageReader.showPlaintext`)}</span>
            </button>
            <button class="dropdown-item ${n===`html`?`active`:``}" ?disabled=${!this.hasHtml} @click=${()=>this.hasHtml&&this._handleAction(`showHtml`)}>
              ${P(`code`)}
              <span class="item-text">${this.i18nStore?.t(`messageReader.showHtml`)}</span>
            </button>
            ${C?``:b`
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${()=>this._handleAction(`downloadMessage`)}>
              ${P(`downloadSimple`)} <span class="item-text">${this.i18nStore?.t(`messageReader.downloadMessage`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`showOriginal`)}>
              ${P(`codeBlock`)} <span class="item-text">${this.i18nStore?.t(`messageReader.showOriginal`)}</span>
            </button>
            `}
          </alps-popup>
          `}
      </alps-toolbar>
      
      ${e?b`
        <div class="reader-body">
          <div class="empty-reader-state" style="flex-direction: column; gap: 16px;">
            ${this.bulkProcessing?b`
              <div class="bulk-spinner-container">
                <alps-loader></alps-loader>
              </div>
            `:b`
              <div class="selection-icon">${P(`envelopeSimple`)}</div>
            `}
            <!-- One sentence with the number inside it. The number followed by
                 a bare "messages selected" read "1 messages selected", and a
                 language whose noun changes with the count had no form to
                 agree with a number it never saw. -->
            <span>${this.i18nStore?.t(`messageReader.messagesSelected`,{count:this.selectedCount})}</span>
          </div>
        </div>
      `:t&&(this.threadItems.length>1||this._isThread)?b`
        <div class="reader-body" @scroll=${this.handleScroll}>
          <div class="reader-header thread-header-grouped">
            <div class="reader-subject">
              ${a.length>0?b`
                <div class="tag-pills">
                  ${a.map(e=>b`
                    <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
                  `)}
                </div>
              `:``}
              <bdi>${i.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`)}</bdi>
            </div>
          </div>
          <div class="thread-container">
            ${g(this.threadItems,e=>this.itemKey(e),e=>this.renderThreadCard(e))}
          </div>
          ${this.renderConversationReply()}
        </div>
      `:b`
        <div class="reader-body" @scroll=${this.handleScroll}>
          <div class="reader-header">
          <div class="reader-subject">
            ${a.length>0?b`
              <div class="tag-pills">
                ${a.map(e=>b`
                  <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
                `)}
              </div>
            `:``}

            <bdi>${i.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`)}</bdi>
          </div>
          <div class="reader-meta">
            <div class="reader-sender-block">
              <div class="reader-sender-left">
                ${this.showSenderAvatars?b`
                  <div class="avatar-container">
                    <alps-avatar .name=${u} .email=${l} .size=${40} .src=${m}></alps-avatar>
                  </div>
                `:``}
                <div class="reader-sender-info">
                  ${c.Name&&c.Name!==l?b`
                    <div class="reader-sender-line">
                      <span class="reader-sender-name" dir="auto">${c.Name}</span>
                      <alps-sender-auth-badge ?verified=${!!i.HasBimiPotential} ?failed=${!!i.HasBimiFailed}></alps-sender-auth-badge>
                    </div>
                    ${l?b`<alps-recipient-pill address="${l}"></alps-recipient-pill>`:b`<span class="reader-sender-name" dir="auto">${u}</span>`}
                  `:b`
                    <div class="reader-sender-line">
                      ${l?b`<alps-recipient-pill address="${l}"></alps-recipient-pill>`:b`<span class="reader-sender-name" dir="auto">${u}</span>`}
                      <alps-sender-auth-badge ?verified=${!!i.HasBimiPotential} ?failed=${!!i.HasBimiFailed}></alps-sender-auth-badge>
                    </div>
                  `}
                </div>
              </div>
              <div class="desktop-date-container">
                <div class="reader-date desktop-date"><bdi>${p}</bdi></div>
                ${i.RFC822Size?b`<div class="reader-size desktop-only"><bdi>${ge(i.RFC822Size,this.i18nStore)}</bdi></div>`:``}
              </div>
            </div>
            
            <div class="reader-recipients-block">
              <div class="reader-recipients">
                <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.to`)}</span>
                <div class="reader-recipients-list">
                  ${i.Envelope?.To&&i.Envelope.To.length>0?i.Envelope.To.map(e=>e.Mailbox&&e.Host?b`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``):b`<span class="undisclosed-recipients">${i.Flags?.includes(`\\Draft`)?this.i18nStore?.t(`messageReader.noRecipients`):this.i18nStore?.t(`messageReader.undisclosed`)}</span>`}
                </div>
              </div>
              ${i.Envelope?.Cc&&i.Envelope.Cc.length>0?b`
                <div class="reader-recipients">
                  <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.cc`)}</span>
                  <div class="reader-recipients-list">
                    ${i.Envelope.Cc.map(e=>e.Mailbox&&e.Host?b`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``)}
                  </div>
                </div>
              `:``}
              
              <div class="reader-recipients mobile-only">
                <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.date`)||`Date:`}</span>
                <div class="reader-recipients-list mobile-date-container" style="flex-direction: row; align-items: baseline; gap: 8px; margin-top: 0;">
                  <span class="reader-date mobile-date" style="color: var(--text-primary);"><bdi>${p}</bdi></span>
                  ${i.RFC822Size?b`<span class="reader-size mobile-size">(<bdi>${ge(i.RFC822Size,this.i18nStore)}</bdi>)</span>`:``}
                </div>
              </div>
            </div>
          </div>
        </div>

        ${!this.loading&&this.attachments&&this.attachments.length>0?b`
          <alps-attachment-list
            class="desktop-attachments"
            .attachments=${this.attachments}
            .mailbox=${this.mailboxOfMessage(i)}
            .messageUid=${i.UID}
          ></alps-attachment-list>
        `:``}

        ${this.loading?b`
          <div class="loading-overlay">
            <div class="loading-state">
              <alps-loader full-height .text=${this.i18nStore?.t(`messageReader.loadingMessage`)||`Loading message...`}></alps-loader>
            </div>
          </div>
        `:b`
          <div class="message-content">
          ${i.HasBimiFailed?b`
            <alps-banner variant="warning">
              <span>${this.i18nStore?.t(`messageReader.senderUnverifiedWarning`)}</span>
            </alps-banner>
          `:``}
          ${this.activeBanners&&this.activeBanners.length>0?b`
            ${this.activeBanners.map(e=>e)}
          `:``}
          ${this.hasRemoteResources&&!this.allowRemoteResources?b`
            <alps-banner>
              <span>${this.i18nStore?.t(`messageReader.remoteContentWarning`)}</span>
              <alps-button slot="action" variant="normal" @click=${this.loadRemoteResources}>${this.i18nStore?.t(`messageReader.loadRemoteContent`)}</alps-button>
            </alps-banner>
          `:``}
          ${this.message?.Flags?.includes(`\\Draft`)?b`
            <alps-banner>
              <span>${this.i18nStore?.t(`messageReader.isDraft`)}</span>
              <alps-button slot="action" variant="normal" @click=${this._handleEditDraft}>${this.i18nStore?.t(`messageReader.editDraft`)}</alps-button>
            </alps-banner>
          `:``}
          
          <div class="reader-content-wrapper">
            ${this.loadFailed?b`
              <div class="reader-load-error">
                <div>${this.i18nStore?.t(`messageReader.loadError`)}</div>
                <alps-button variant="normal" @click=${()=>this.retryItemBody(this.threadItems.find(e=>this.isOpenItem(e)))}>
                  ${this.i18nStore?.t(`messageReader.loadErrorRetry`)}
                </alps-button>
              </div>
            `:this.mimeType?.toLowerCase()===`text/html`?b`
              <iframe 
                class="reader-iframe"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                .srcdoc=${r(this.content)}
                @load=${this.onIframeLoad}
              ></iframe>
            `:this.mimeType?.toLowerCase().startsWith(`multipart/`)||!this.content?b`
              <div class="reader-empty-body">
                ${this.i18nStore?.t(`messageReader.noReadableText`)}
              </div>
            `:b`
              <div class="reader-text-wrapper">
                <pre dir="auto" class="reader-preformatted" @click=${this.onTextBodyClick}>${rs(this.content)}</pre>
              </div>
            `}
          </div>

        `}
      </div>

      ${!this.loading&&this.attachments&&this.attachments.length>0?b`
        <alps-attachment-list
          class="mobile-attachments"
          .attachments=${this.attachments}
          .mailbox=${this.mailboxOfMessage(i)}
          .messageUid=${i.UID}
        ></alps-attachment-list>
      `:``}
      `}
    `}};N([s({context:Be})],J.prototype,`settingsStore`,void 0),N([s({context:A})],J.prototype,`i18nStore`,void 0),N([s({context:ta})],J.prototype,`composeStore`,void 0),N([d()],J.prototype,`localPreferredView`,void 0),N([d()],J.prototype,`hasHtml`,void 0),N([d()],J.prototype,`hasText`,void 0),N([_({type:String})],J.prototype,`mailbox`,void 0),N([_({type:Object})],J.prototype,`message`,void 0),N([_({type:Array})],J.prototype,`messages`,void 0),N([_({type:Object})],J.prototype,`selectedKeys`,void 0),N([_({type:Number})],J.prototype,`selectedCount`,void 0),N([_({type:Boolean})],J.prototype,`allSelectedStarred`,void 0),N([_({type:Boolean})],J.prototype,`allSelectedUnread`,void 0),N([_({type:Array})],J.prototype,`commonTags`,void 0),N([_({type:Boolean})],J.prototype,`bulkProcessing`,void 0),N([_({type:String})],J.prototype,`layoutMode`,void 0),N([_({type:Array})],J.prototype,`mailboxes`,void 0),N([d()],J.prototype,`content`,void 0),N([d()],J.prototype,`mimeType`,void 0),N([d()],J.prototype,`loading`,void 0),N([d()],J.prototype,`loadFailed`,void 0),N([d()],J.prototype,`activeBanners`,void 0),N([d()],J.prototype,`attachments`,void 0),N([d()],J.prototype,`allowRemoteResources`,void 0),N([d()],J.prototype,`hasRemoteResources`,void 0),N([d()],J.prototype,`rawMessageHtml`,void 0),N([d()],J.prototype,`isScrolled`,void 0),N([d()],J.prototype,`threadItems`,void 0),N([d()],J.prototype,`_isThread`,void 0),J=N([o(`alps-message-reader`)],J);function gs(e,t){let n=`#/${t}`;if(!e.startsWith(n))return!1;let r=e.slice(n.length);return r===``||r.startsWith(`/`)||r.startsWith(`?`)}function _s(e){return e?`#/settings/${e}`:`#/settings`}function Y(e){return gs(e,`settings`)}function vs(e){if(!Y(e))return``;let[t]=e.slice(10).split(`?`);return t.replace(/^\//,``).split(`/`)[0]??``}var ys=`alpsSettings`,bs=`alpsPageEntry`,xs=`settings-background-changed`;function Ss(e=history.state){let t=e?.[bs];return typeof t==`string`?t:null}function Cs(){let e=history.state&&typeof history.state==`object`?{...history.state}:{},t=Ss(e)??globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`;return(e[bs]!==t||ys in e)&&(delete e[ys],history.replaceState({...e,[bs]:t},``,window.location.href)),t}function ws(e=history.state){let t=e?.[ys];if(!t||typeof t.depth!=`number`)return null;let n=typeof t.background==`string`?t.background:null,r=t.origin;return{depth:t.depth,background:n,...r===null||typeof r==`string`?{origin:r}:{}}}function Ts(e,t,n){return Y(e)?t?{...t,depth:t.depth+1}:{depth:1,background:null,...n===void 0?{}:{origin:null}}:{depth:1,background:e&&e!==`#`?e:`#/`,...n===void 0?{}:{origin:n}}}function Es(e){let t=history.state&&typeof history.state==`object`?history.state:{};history.replaceState({...t,[ys]:e},``,window.location.href)}function Ds(){let e=window.location.hash;return Y(e)?ws()?.background??null:e}function Os(e){if(!Y(window.location.hash))return!1;let t=ws()??{depth:0,background:null,origin:null},n=e=>e.replace(/^#\/?/,``).split(/[/?]/)[0]||`mailbox`;return n(t.background??`#/`)===n(e)&&t.background!==e&&(Es({...t,background:e}),window.dispatchEvent(new CustomEvent(xs))),!0}var ks=class extends Error{constructor(e){super(e),this.code=e}},As=new class extends EventTarget{constructor(){super(),this.accounts=[],this.loading=!1,this.initialized=!1,this.epoch=0,window.addEventListener(`session-cleared`,()=>{this.epoch++,this.accounts=[],this.initialized=!1,this.loading=!1,this.dispatchEvent(new Event(`change`))})}getAccounts(){return this.accounts}isLoading(){return this.loading}isInitialized(){return this.initialized}async fetchAccounts(){let e=this.epoch;this.loading=!0,this.dispatchEvent(new Event(`change`));try{let t=await fetch(`/accounts`);if(t.ok){let n=await t.json();if(e!==this.epoch)return;this.accounts=n.accounts||[],this.initialized=!0}else E.error(`Failed to fetch linked accounts`)}catch(e){E.error(`Error fetching linked accounts:`,e)}finally{e===this.epoch&&(this.loading=!1,this.dispatchEvent(new Event(`change`)))}}async addAccount(e,t,n=``){let r=new URLSearchParams;r.append(`username`,e),r.append(`password`,t),r.append(`display_name`,n);let i=await fetch(`/accounts`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:r.toString()});if(!i.ok){let e=await i.json().catch(()=>({}));throw Error(e.error||`Failed to add linked account`)}await this.fetchAccounts()}async removeAccount(e){let t=await fetch(`/accounts/${encodeURIComponent(e)}`,{method:`DELETE`});if(!t.ok){let e=await t.json().catch(()=>({}));throw Error(e.error||`Failed to remove linked account`)}await this.fetchAccounts()}async switchAccount(e){let t=new URLSearchParams;t.append(`username`,e);let n=await fetch(`/accounts/switch`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:t.toString()});if(!n.ok){let e=await n.json().catch(()=>({}));throw new ks(typeof e.error==`string`?e.error:`switch_failed`)}return await n.json()}},js=l(`alps-linked-accounts`),Ms=80,Ns=95,Ps=6e4;function Fs(e){return e.limit===0?100:Math.min(100,Math.max(0,Math.floor(e.used*100/e.limit)))}function Is(e){if(!e)return``;let t=Fs(e);return t>=Ns?`critical`:t>=Ms?`warn`:``}function Ls(e){if(e?.supported!==!0)return{usage:null,unsupported:e?.supported===!1};let{used:t,limit:n}=e;return typeof t!=`number`||typeof n!=`number`||!(n>=0)||!(t>=0)?{usage:null,unsupported:!1}:{usage:{used:t,limit:n},unsupported:!1}}var Rs=class extends c{constructor(...e){super(...e),this.usage=null,this.severity=``,this.announced={severity:``,percent:0,shown:!1},this.unsupported=!1,this.readAt=0,this.reading=null,this._handleI18nChange=()=>this.requestUpdate(),this._handleMailNews=e=>{e.detail?.kept||this.refresh()}}static{this.styles=[j,y`
    :host {
      display: block;
    }

    .storage {
      padding: 8px 16px;
      min-width: 200px;
      cursor: default;
    }

    .label {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
      color: var(--text-secondary, #4b5563);
      margin-block-end: 6px;
    }

    .percent {
      flex-shrink: 0;
    }

    .track {
      height: 4px;
      border-radius: 2px;
      overflow: hidden;
      background: var(--border-color, #e5e7eb);
    }

    .fill {
      height: 100%;
      background: var(--accent-color, #2563eb);
      transition: width 0.3s;
    }

    .fill.warn {
      background: var(--warning, #f59e0b);
    }

    .fill.critical {
      background: var(--error, #ef4444);
    }

    /* The bar is drawn by backgrounds alone, which forced colors repaint as
       the page: the track is outlined and the fill takes the text's colour. */
    @media (forced-colors: active) {
      .track {
        border: 1px solid CanvasText;
      }
      .fill,
      .fill.warn,
      .fill.critical {
        forced-color-adjust: none;
        background: CanvasText;
      }
    }
  `]}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),z.addEventListener(`sync-success`,this._handleMailNews),z.addEventListener(`inbox-counts`,this._handleMailNews),z.addEventListener(`folder-counts`,this._handleMailNews),qe().then(()=>{this.isConnected&&this.refresh()})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),z.removeEventListener(`sync-success`,this._handleMailNews),z.removeEventListener(`inbox-counts`,this._handleMailNews),z.removeEventListener(`folder-counts`,this._handleMailNews)}async refresh(e=!1){if(this.reading)return this.reading;if(!this.unsupported&&!(!e&&Date.now()-this.readAt<Ps))return this.reading=this.read().finally(()=>{this.reading=null}),this.reading}async read(){try{let e=await F(`/quota`,{},void 0,{background:!0});if(!e.ok)throw Error(`status ${e.status}`);let{usage:t,unsupported:n}=Ls(await e.json());this.usage=t,this.unsupported=n}catch(e){E.warn(`Failed to read the storage quota`,e)}finally{this.readAt=Date.now()}}willUpdate(e){e.has(`usage`)&&(this.severity=Is(this.usage))}updated(){let e={severity:this.severity,percent:this.usage?Fs(this.usage):0,shown:this.usage!==null},t=this.announced;(e.severity!==t.severity||e.percent!==t.percent||e.shown!==t.shown)&&(this.announced=e,this.dispatchEvent(new CustomEvent(`storage-change`,{detail:e})))}render(){let e=this.usage;if(!e)return n;let t=e.limit===0?1:Math.min(1,e.used/e.limit),r=Fs(e),i=Ae(this.i18nStore,`storage.used`,{used:b`<bdi>${ge(e.used,this.i18nStore)}</bdi>`,quota:b`<bdi>${ge(e.limit,this.i18nStore)}</bdi>`});return b`
      <div class="storage">
        <div class="label">
          <span class="used">${i}</span>
          <span class="percent"><bdi>${this.i18nStore?.t(`storage.percent`,{percent:r})??`${r}%`}</bdi></span>
        </div>
        <div class="track" aria-hidden="true">
          <div class="fill ${this.severity}" style="width: ${t*100}%"></div>
        </div>
      </div>
    `}};N([s({context:A})],Rs.prototype,`i18nStore`,void 0),N([d()],Rs.prototype,`usage`,void 0),N([_({type:String,reflect:!0})],Rs.prototype,`severity`,void 0),Rs=N([o(`alps-storage-usage`)],Rs);var zs=class extends c{constructor(...e){super(...e),this.username=``,this.isMobile=!1,this.currentTab=`messages`,this.storage={severity:``,percent:0,shown:!1},this._handleStoreChange=()=>{this.requestUpdate()},this._handleStorageChange=e=>{this.storage=e.detail},this._handleMenuOpen=()=>{this.shadowRoot?.querySelector(`alps-storage-usage`)?.refresh(!0)}}static{this.styles=[j,ka,y`
    :host {
      display: block;
      position: relative;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary, #111827);
      user-select: none;
    }

    .user-text-container {
      display: flex;
      flex-direction: column;
      max-width: 180px;
    }

    .user-name-text {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }

    .user-address-text {
      font-size: 12px;
      font-weight: 400;
      color: var(--text-secondary, #6b7280);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
      margin-top: 2px;
    }

    .item-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .menu-icon { display: inline-flex; flex-shrink: 0; }
    .shortcut-hint {
      margin-inline-start: auto;
      flex-shrink: 0;
      padding: 1px 5px;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 4px;
      color: var(--text-muted, #6b7280);
      font: inherit;
      font-size: 12px;
    }

    /* A mailbox close to its storage limit, shown while the menu is closed:
       the figures are inside it. The two states differ in size and in the
       mark, not in colour alone. */
    .avatar-wrap {
      position: relative;
      display: inline-flex;
    }

    .storage-badge {
      position: absolute;
      inset-block-start: -2px;
      inset-inline-end: -2px;
      box-sizing: border-box;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      box-shadow: 0 0 0 2px var(--bg-primary, #ffffff);
      background: var(--warning, #f59e0b);
    }

    .storage-badge.critical {
      inset-block-start: -4px;
      inset-inline-end: -4px;
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #b91c1c;
      color: #ffffff;
      border: 1px solid #ffffff;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
    }

    /* Drawn by its background, which forced colors repaint as the page. */
    @media (forced-colors: active) {
      .storage-badge,
      .storage-badge.critical {
        forced-color-adjust: none;
        background: CanvasText;
        color: Canvas;
        border-color: Canvas;
        box-shadow: 0 0 0 2px Canvas;
      }
    }

    @media (max-width: 768px) {
      .user-text-container {
        display: none;
      }
      
      .user-info {
        gap: 0;
      }
    }
  `]}_storageNotice(){let{severity:e,percent:t}=this.storage;return e===`critical`?this.i18nStore?.t(`storage.critical`,{percent:t})??``:e===`warn`?this.i18nStore?.t(`storage.warning`,{percent:t})??``:``}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&(this.i18nStore?.addEventListener(`change`,this._handleStoreChange),this.settingsStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.addEventListener(`change`,this._handleStoreChange),window.addEventListener(`plugins-updated`,this._handleStoreChange),this.linkedAccountsStore&&!this.linkedAccountsStore.isInitialized()&&this.linkedAccountsStore.fetchAccounts())})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.removeEventListener(`change`,this._handleStoreChange),window.removeEventListener(`plugins-updated`,this._handleStoreChange)}_closePopup(){let e=this.shadowRoot?.querySelector(`alps-popup`);e&&e.close()}async _openWindow(e){let t=this.shadowRoot?.querySelector(`alps-popup`);this._closePopup(),await t?.updateComplete,this.isConnected&&(this.shadowRoot?.querySelector(`alps-icon-btn[slot="trigger"]`)?.shadowRoot?.querySelector(`button`)?.focus(),this.dispatchEvent(new CustomEvent(e,{bubbles:!0,composed:!0})))}_handleSettings(){return this._openWindow(`open-settings`)}_handleShortcuts(){return this._openWindow(`open-shortcuts`)}_handleSignOut(){this._closePopup(),this.dispatchEvent(new CustomEvent(`sign-out`,{bubbles:!0,composed:!0}))}_handleTabChange(e){this._closePopup(),e===`messages`?window.location.hash.startsWith(`#/mailbox/`)||(window.location.hash=`#/`):gs(window.location.hash,e)||(window.location.hash=`#/`+e),this.dispatchEvent(new CustomEvent(`change-tab`,{detail:{tab:e},bubbles:!0,composed:!0}))}async _handleSwitchAccount(e){this._closePopup();let t=document.createElement(`div`);document.body.appendChild(t),v(b`
      <style>
        @keyframes global-spin { to { transform: rotate(360deg); } }
        .switch-overlay svg { width: 100%; height: 100%; fill: currentColor; }
      </style>
      <div id="switch-account-overlay" class="switch-overlay" style="position: fixed; inset: 0; background-color: var(--bg-primary, #ffffff); z-index: 999999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease-in;">
        <div class="spinner" style="display: inline-flex; width: 32px; height: 32px; animation: global-spin 1s linear infinite; color: var(--accent-color, #2563eb);">
          ${P(`edelweiss`)}
        </div>
      </div>
    `,t);let n=t.querySelector(`#switch-account-overlay`);requestAnimationFrame(()=>{requestAnimationFrame(()=>{n&&(n.style.opacity=`1`)})}),await new Promise(e=>setTimeout(e,300));try{if((await this.linkedAccountsStore.switchAccount(e)).requires_2fa){He(!1),q.clear(),sessionStorage.clear();try{sessionStorage.setItem(`pending_2fa_username`,e),sessionStorage.setItem(`pending_2fa_is_switch`,`1`)}catch{}window.location.hash=`#/login/webauthn`,n&&(n.style.opacity=`0`),setTimeout(()=>t.remove(),300)}else He(!1),sessionStorage.clear(),window.location.reload()}catch(e){n&&(n.style.opacity=`0`),setTimeout(()=>t.remove(),300),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(e.code===`relink_required`?`linkedAccounts.relinkRequired`:e.code===`account_not_found`?`linkedAccounts.accountNotFound`:e.code===`service_unavailable`?`linkedAccounts.switchUnavailable`:`linkedAccounts.switchError`),type:`error`,duration:5e3}}))}}render(){let e=this.settingsStore?.getState().name||this.username,t=this._storageNotice();return b`
      <div class="user-profile">
        <div class="user-info">
          <span class="avatar-wrap">
            <alps-avatar .name=${e} .size=${28}></alps-avatar>
            <!-- Hidden from assistive technology: the menu's button says the
                 same in its name, where focus lands, and the badge is not
                 focusable. -->
            ${t?b`
              <span class="storage-badge ${this.storage.severity}" aria-hidden="true" title=${t}>${this.storage.severity===`critical`?`!`:``}</span>
            `:``}
          </span>
          <div class="user-text-container">
            <span class="user-name-text"><bdi>${e}</bdi></span>
            <span class="user-address-text"><bdi dir="ltr">${this.username}</bdi></span>
          </div>
        </div>
        <alps-popup align="end" @popup-open=${this._handleMenuOpen}>
          <alps-icon-btn
            slot="trigger"
            .icon=${`dotsThreeVertical`}
            title=${t?this.i18nStore?.t(`userMenu.profileOptionsNotice`,{notice:t}):this.i18nStore?.t(`userMenu.profileOptions`)}
          ></alps-icon-btn>
          
          ${(()=>{let e=this.linkedAccountsStore?.getAccounts()||[];return e.length===0?``:b`
              ${e.map(e=>b`
                <button class="dropdown-item" @click="${()=>this._handleSwitchAccount(e.username)}">
                  <alps-avatar .name=${e.display_name||e.username} .size=${16} style="margin-inline-end: 4px;"></alps-avatar>
                  <span class="item-text" style="font-weight: 500;" title="${e.username}"><bdi>${e.display_name||e.username}</bdi></span>
                </button>
              `)}
              <div class="dropdown-divider"></div>
            `})()}
          
          <!-- The pages, on a PHONE only. A desktop's header switches between
               Messages, Contacts, Calendar and Tasks itself, and the menu does
               not repeat it; a phone's header has no room for the tabs, and
               this menu is then the only way between them. -->
          ${this.isMobile?b`
            <button class="dropdown-item ${this.currentTab===`messages`?`active`:``}" @click="${()=>this._handleTabChange(`messages`)}">
              ${P(`envelopeSimple`)} <span class="item-text">${this.i18nStore?.t(`navigation.messages`)}</span>
            </button>
            ${I.getNavTabs().map(e=>b`
              <button class="dropdown-item ${this.currentTab===e.id?`active`:``}" @click="${()=>this._handleTabChange(e.id)}">
                ${P(e.icon||`star`)} <span class="item-text">${this.i18nStore?.t(e.labelKey)}</span>
              </button>
            `)}
            <div class="dropdown-divider"></div>
          `:``}
          <!-- Never the current item: Settings is a window over the page, and
               the page's tab stays the current one. -->
          <button class="dropdown-item" @click="${this._handleSettings}">
            ${P(`gear`)} <span class="item-text">${this.i18nStore?.t(`userMenu.settings`)}</span>
          </button>
          <button type="button" class="dropdown-item shortcut-help" @click=${this._handleShortcuts}>
            <span class="menu-icon" aria-hidden="true">${P(`bookOpen`)}</span>
            <span class="item-text">${this.i18nStore?.t(`shortcuts.title`)}</span>
            <kbd class="shortcut-hint" aria-hidden="true">?</kbd>
          </button>
          <div class="dropdown-divider"></div>
          <!-- Storage, above Sign out: it is the account's, and this menu is
               on every page. The section draws nothing for a mailbox without
               a storage limit, and its divider goes with it. -->
          <alps-storage-usage @storage-change=${this._handleStorageChange}></alps-storage-usage>
          ${this.storage.shown?b`<div class="dropdown-divider"></div>`:``}
          <button class="dropdown-item" @click="${this._handleSignOut}">
            ${P(`signOut`)} <span class="item-text">${this.i18nStore?.t(`userMenu.signOut`)}</span>
          </button>
        </alps-popup>
      </div>
    `}};N([_({type:String})],zs.prototype,`username`,void 0),N([_({type:Boolean})],zs.prototype,`isMobile`,void 0),N([_({type:String})],zs.prototype,`currentTab`,void 0),N([s({context:A})],zs.prototype,`i18nStore`,void 0),N([s({context:Be})],zs.prototype,`settingsStore`,void 0),N([s({context:js})],zs.prototype,`linkedAccountsStore`,void 0),N([d()],zs.prototype,`storage`,void 0),zs=N([o(`user-profile-menu`)],zs);var Bs=class extends c{constructor(...e){super(...e),this.username=``,this.currentTab=``,this.isMobile=!1,this.scrolled=!1,this.unsavedDraftsFailure=null,this._handleStoreChange=()=>{this.requestUpdate()},this.confirmSignOutWithUnsavedDrafts=async()=>{let e=this.unsavedDraftsFailure;this.unsavedDraftsFailure=null,e&&(e.keepRecoveryCopy(),await this.endSession(`signedOutDraftsKept`))},this.cancelSignOutWithUnsavedDrafts=()=>{this.unsavedDraftsFailure=null}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=[j,y`
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 57px;
      box-sizing: border-box;
      background: var(--bg-primary, #ffffff);
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      flex-shrink: 0;
      z-index: 20000;
      transition: box-shadow 0.2s ease;
    }

    :host([scrolled][ismobile]) {
      box-shadow: rgba(95, 95, 95, 0.1) 0 4px 4px -2px;
    }

    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      padding: 0 16px;
    }

    .left-section {
      display: flex;
      align-items: center;
      height: 100%;
      gap: 12px;
      flex-shrink: 0;
    }

    .center-section {
      flex: 1;
      display: flex;
      align-items: center;
      min-width: 0;
      margin: 0 24px;
    }

    :host([ismobile]) .center-section {
      margin: 0 8px;
    }

    .right-section {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }

    ::slotted([slot="center"]) {
      width: 100%;
    }
  `]}handleSettings(){window.location.hash=`/settings`}async handleSignOut(){try{await this.composeStore?.saveAllDirtyDrafts()}catch(e){this.unsavedDraftsFailure=e instanceof Li?e:new Li;return}await this.endSession(`signedOut`)}async endSession(e){ia(e),Oo();try{await fetch(`/session`,{method:`DELETE`})}catch(e){E.error(`Sign-out request failed; ending the session locally anyway`,e)}q.clear(),He(),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`}render(){return b`
      ${this.unsavedDraftsFailure?b`
        <ui-confirm
          heading=${this.i18nStore?.t(`userMenu.unsavedDraftsTitle`)}
          message=${this.i18nStore?.t(`userMenu.unsavedDraftsMessage`)}
          confirmText=${this.i18nStore?.t(`userMenu.signOutAnyway`)}
          cancelText=${this.i18nStore?.t(`general.cancel`)}
          .isDanger=${!0}
          @confirm=${this.confirmSignOutWithUnsavedDrafts}
          @cancel=${this.cancelSignOutWithUnsavedDrafts}
        ></ui-confirm>
      `:``}
      <div class="header-container">
        <div class="left-section">
          ${this.isMobile?b`
            <alps-icon-btn 
              title=${this.i18nStore?.t(`messageList.menu`)} 
              @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-sidebar`))}
              icon="sidebar"
            ></alps-icon-btn>
          `:``}
          <slot name="left"></slot>
        </div>

        <div class="center-section">
          <slot name="center"></slot>
        </div>

        <div class="right-section">
          <slot name="right-actions"></slot>
          ${this.username?b`
            <user-profile-menu 
              .username=${this.username}
              .isMobile=${this.isMobile}
              .currentTab=${this.currentTab}
              @open-settings=${this.handleSettings}
              @sign-out=${this.handleSignOut}
            ></user-profile-menu>
          `:``}
        </div>
      </div>
    `}};N([_({type:String})],Bs.prototype,`username`,void 0),N([_({type:String})],Bs.prototype,`currentTab`,void 0),N([_({type:Boolean,reflect:!0})],Bs.prototype,`isMobile`,void 0),N([_({type:Boolean,reflect:!0})],Bs.prototype,`scrolled`,void 0),N([s({context:A})],Bs.prototype,`i18nStore`,void 0),N([s({context:ta})],Bs.prototype,`composeStore`,void 0),N([d()],Bs.prototype,`unsavedDraftsFailure`,void 0),Bs=N([o(`alps-header`)],Bs);var Vs=class extends c{constructor(...e){super(...e),this.username=``,this.currentTab=`messages`,this.isMobile=!1,this.currentMailbox=``,this.mailboxes=[],this.searchQuery=``,this.scrolled=!1,this._handleStoreChange=()=>{this.requestUpdate()},this._handleHashChange=()=>{let e=Ds();if(e!==null){if(gs(e,`contacts`))this.currentTab=`contacts`;else{let t=I.getNavTabs().find(t=>gs(e,t.id));this.currentTab=t?t.id:`messages`}}}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)}),window.addEventListener(`hashchange`,this._handleHashChange),window.addEventListener(`plugins-updated`,this._handleStoreChange),this._handleHashChange()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),window.removeEventListener(`hashchange`,this._handleHashChange),window.removeEventListener(`plugins-updated`,this._handleStoreChange)}static{this.styles=[j,Oe,y`
    :host {
      display: block;
      width: 100%;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
    }

    .logo svg,
    .logo img.logo {
      width: 28px;
      height: 28px;
    }

    nav {
      height: 100%;
    }

    .nav-tabs {
      display: flex;
      height: 100%;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .nav-tabs li {
      display: flex;
    }

    .nav-tab {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 12px;
      color: var(--text-secondary, #4b5563);
      font-weight: 500;
      font-size: 14px;
      text-decoration: none;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .nav-tab:hover {
      color: var(--text-primary, #111827);
    }

    /* Keyboard focus, in the accent. Drawn inside the tab, which fills the
       header's height and so has no room outside. */
    .nav-tab:focus-visible {
      outline: 2px solid var(--accent-color, #005A9E);
      outline-offset: -2px;
    }

    .nav-tab[aria-current='page'] {
      color: var(--accent-color, #2563eb);
      border-bottom-color: var(--accent-color, #2563eb);
    }

    /* Forced colours repaint every tab's underline, the transparent ones too,
       in one colour, so every tab looked current. Only the current one keeps
       it, in the system's highlight. */
    @media (forced-colors: active) {
      .nav-tab {
        border-bottom-color: Canvas;
      }

      .nav-tab[aria-current='page'] {
        border-bottom-color: Highlight;
      }
    }

    .header-left-slot {
      display: flex;
      align-items: center;
      height: 100%;
      gap: 12px;
    }

    alps-input {
      flex: 1;
      --alps-input-bg: var(--bg-secondary, #f9fafb);
    }
  `]}handleTabClick(e,t){e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||(e.preventDefault(),gs(window.location.hash,t)||(this.currentTab=t,this.dispatchEvent(new CustomEvent(`change-tab`,{detail:{tab:t}})),t===`messages`?window.location.hash.startsWith(`#/mailbox/`)||(window.location.hash=`#/`):window.location.hash=`#/`+t))}render(){return b`
      <alps-header 
        .username=${this.username} 
        .isMobile=${this.isMobile} 
        .currentTab=${this.currentTab}
        .scrolled=${this.scrolled}
        @toggle-sidebar=${()=>this.dispatchEvent(new CustomEvent(`toggle-sidebar`))}
      >
        <div slot="left" class="header-left-slot">
          ${this.isMobile?``:b`
            <div class="logo">
              ${Ke()}
            </div>
            <!-- Links, so Tab reaches them and a screen reader hears where
                 they go and which is the page on screen. -->
            <nav aria-label=${this.i18nStore?.t(`navigation.label`)||`Apps`}>
              <ul class="nav-tabs" role="list">
                <li>
                  <a
                    class="nav-tab"
                    href="#/"
                    aria-current=${this.currentTab===`messages`?`page`:n}
                    @click=${e=>this.handleTabClick(e,`messages`)}
                    title=${this.i18nStore?.t(`navigation.messages`)}
                  >${this.i18nStore?.t(`navigation.messages`)}</a>
                </li>
                ${I.getNavTabs().map(e=>b`
                  <li>
                    <a
                      class="nav-tab"
                      href="#/${e.id}"
                      aria-current=${this.currentTab===e.id?`page`:n}
                      @click=${t=>this.handleTabClick(t,e.id)}
                      title=${this.i18nStore?.t(e.labelKey)||e.id}
                    >${this.i18nStore?.t(e.labelKey)||e.id}</a>
                  </li>
                `)}
              </ul>
            </nav>
          `}
        </div>

        <alps-input 
          slot="center"
          icon="magnifyingGlass"
          ?clearable=${!0}
          .value=${this.searchQuery}
          .placeholder=${this.currentTab===`contacts`?this.i18nStore?.t(`contacts.title`)||`Contacts`:this.currentTab===`calendar`?this.i18nStore?.t(`calendar.title`)||`Search Calendar`:this.currentTab===`tasks`?this.i18nStore?.t(`tasks.title`):this.currentMailbox?Ee(this.currentMailbox,this.i18nStore,this.mailboxes):this.i18nStore?.t(`search.placeholder`)}
          @keydown=${e=>{e.key===`Enter`&&!lt(e)&&(e.preventDefault(),this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:e.target.value},bubbles:!0,composed:!0})))}}
          @clear=${()=>{this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:``},bubbles:!0,composed:!0}))}}
        ></alps-input>

        <div slot="right-actions">
        </div>
      </alps-header>
    `}};N([_({type:String})],Vs.prototype,`username`,void 0),N([_({type:String})],Vs.prototype,`currentTab`,void 0),N([_({type:Boolean})],Vs.prototype,`isMobile`,void 0),N([_({type:String})],Vs.prototype,`currentMailbox`,void 0),N([_({type:Array})],Vs.prototype,`mailboxes`,void 0),N([_({type:String})],Vs.prototype,`searchQuery`,void 0),N([_({type:Boolean})],Vs.prototype,`scrolled`,void 0),N([s({context:A})],Vs.prototype,`i18nStore`,void 0),Vs=N([o(`app-header`)],Vs);var Hs=`alps-mail-push`,Us=`alps-mail-push`,Ws=2e3,Gs=3e5,Ks=.2,qs=new class{constructor(e,t={}){this.running=!1,this.away=!1,this.generation=0,this.releaseLead=null,this.seeking=!1,this.source=null,this.channel=null,this.retry=null,this.retryDelay=Ws,this.unavailable=!1,this.foldersOn=!1,this.handleAway=()=>{this.running&&(this.away=!0,this.generation++,this.giveUpLead())},this.handleBack=e=>{this.running&&(e.type!==`pageshow`||e.persisted)&&(this.away=!1,this.seekLead())},this.onNews=e,this.onFolders=t,window.addEventListener(`session-cleared`,()=>this.stop())}start(){this.running||typeof navigator<`u`&&navigator.locks&&typeof EventSource<`u`&&(this.running=!0,this.away=!1,this.unavailable=!1,typeof BroadcastChannel<`u`&&(this.channel=new BroadcastChannel(Us),this.channel.onmessage=e=>{e.data?.type===`news`&&this.onNews(),e.data?.type===`folder`&&typeof e.data.mailbox==`string`&&this.onFolders.folder?.(e.data.mailbox),e.data?.type===`folders`&&this.onFolders.folders?.(e.data.on===!0)}),document.addEventListener(`freeze`,this.handleAway),window.addEventListener(`pagehide`,this.handleAway),document.addEventListener(`resume`,this.handleBack),window.addEventListener(`pageshow`,this.handleBack),this.seekLead())}stop(){this.running=!1,this.generation++,this.giveUpLead(),this.channel?.close(),this.channel=null,document.removeEventListener(`freeze`,this.handleAway),window.removeEventListener(`pagehide`,this.handleAway),document.removeEventListener(`resume`,this.handleBack),window.removeEventListener(`pageshow`,this.handleBack)}seekLead(){this.seeking||this.releaseLead||(this.seeking=!0,navigator.locks.request(Hs,()=>new Promise(e=>{this.seeking=!1,!this.running||this.away?e():(this.releaseLead=()=>{this.releaseLead=null,e()},this.open())})).catch(e=>{this.seeking=!1,E.error(`Failed to take the event stream lock`,e)}))}giveUpLead(){this.close(),this.retry&&=(clearTimeout(this.retry),null),this.retryDelay=Ws,this.releaseLead?.()}open(){if(!this.running||this.unavailable||this.source)return;let e=new EventSource(`/events`);this.source=e;let t=!1;e.addEventListener(`watching`,e=>{t=!0,this.retryDelay=Ws,this.news();let n=e.data===`SUBSCRIBED`;(n||this.foldersOn)&&this.tellFolders(n)}),e.addEventListener(`inbox`,()=>this.news()),e.addEventListener(`folder`,e=>{let t=e.data;typeof t==`string`&&t&&(this.onFolders.folder?.(t),this.channel?.postMessage({type:`folder`,mailbox:t}))}),e.addEventListener(`unavailable`,()=>{this.unavailable=!0,this.close()}),e.addEventListener(`error`,()=>{if(this.source!==e||(this.close(),!this.running||this.unavailable||ko()))return;let n=this.retryDelay;this.retryDelay=Math.min(n*2,Gs);let r=n*(.8+2*Ks*Math.random()),i=this.generation;this.retry=setTimeout(()=>{this.retry=null,i===this.generation&&(t?this.open():this.openIfStillPushed(i))},r)})}async openIfStillPushed(e){try{let t=await F(`/settings`,{},25e3,{background:!0});if(e!==this.generation)return;if(t.status===401){this.stop();return}if(t.ok){let n=await t.json().catch(()=>null);if(e!==this.generation)return;if(n?.PushNewMail===!1){this.stop(),window.dispatchEvent(new CustomEvent(`mail-push-off`));return}}}catch(t){if(e!==this.generation)return;E.error(`Failed to read the settings before opening the event stream again`,t)}this.open()}close(){this.source?.close(),this.source=null,this.foldersOn&&this.tellFolders(!1)}tellFolders(e){this.foldersOn=e,this.onFolders.folders?.(e),this.channel?.postMessage({type:`folders`,on:e})}news(){this.onNews(),this.channel?.postMessage({type:`news`})}}(()=>z.inboxChanged(),{folder:e=>z.folderChanged(e),folders:e=>z.foldersWatched(e)}),Js=class extends c{constructor(...e){super(...e),this.hidden=!1}static{this.styles=[j,y`
    :host {
      position: absolute;
      inset: 0;
      background: var(--bg-primary, #ffffff);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.5s ease-in-out, visibility 0.5s;
    }

    :host([hidden]) {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
  `]}render(){return b`<alps-loader></alps-loader>`}};N([_({type:Boolean,reflect:!0})],Js.prototype,`hidden`,void 0),Js=N([o(`alps-initial-loader`)],Js);var Ys=!0;function Xs(){return Ys}function Zs(){Ys=!1}function Qs(e){return e.defaultPrevented||e.repeat||e.altKey||e.ctrlKey||e.metaKey||lt(e)||vt()?!1:!e.composedPath().some(e=>e instanceof HTMLElement?e.tagName===`INPUT`&&![`checkbox`,`radio`,`button`,`submit`,`reset`,`image`].includes(e.type)||[`TEXTAREA`,`SELECT`,`DIALOG`,`ALPS-FLOATING-COMPOSER`,`ALPS-ATTACHMENT-PREVIEW`,`SETTINGS-WINDOW`].includes(e.tagName)||e.isContentEditable||e.hasAttribute(`contenteditable`)&&e.getAttribute(`contenteditable`)!==`false`?!0:[`textbox`,`searchbox`,`combobox`,`menu`,`listbox`,`dialog`,`spinbutton`,`slider`].includes(e.getAttribute(`role`)??``):!1)}var $s=1e4,ec=[`sortOrder`,`messageSortCriteria`,`messagesPerPage`,`enableThreading`],tc=e=>!!e?.Flags?.includes(V),nc=(e,t)=>(e?.length??0)===(t?.length??0)&&(e??[]).every((e,n)=>e===t[n]);function rc(e,t){return e===t?!0:!e||e.length!==t.length?!1:JSON.stringify(e)===JSON.stringify(t)}function ic(e){return(e||[]).map(e=>{let{name:t,email:n}=mt(ht(e)),r=n.lastIndexOf(`@`);return{Name:t,Mailbox:r===-1?n:n.slice(0,r),Host:r===-1?``:n.slice(r+1)}})}var ac=250,oc=500,sc=64,cc=120,lc=380,uc=300,dc=57,fc=150,pc=250,X=class extends c{constructor(...e){super(...e),this.showDeleteConfirm=!1,this.listLoadFailed=!1,this.listLoadLimited=!1,this.pendingDeleteDetails=null,this.markReadTimer=null,this.notificationSound=null,this.audioUnlocked=!1,this.unlockAudio=()=>{if(this.audioUnlocked||!this.settingsStore.getState().soundNotifications)return;let e=this.chime();e.muted=!0,e.play().then(()=>{e.pause(),e.currentTime=0,this.audioUnlocked=!0}).catch(()=>{}).finally(()=>{e.muted=!1}),document.removeEventListener(`click`,this.unlockAudio),document.removeEventListener(`keydown`,this.unlockAudio)},this.mailboxes=[],this.messages=[],this.currentMailbox=w,this.loadingMessages=!0,this.showInitialLoader=Xs(),this.selectedMessage=null,this.selectedKeys=new Set,this.selectAllMatching=!1,this.excludedKeys=new Set,this.layoutMode=`vertical`,this.filterQuery=``,this.expandedFolders=new Set([w]),this.username=``,this.currentPage=0,this.listedPage=0,this.listedMailbox=``,this.listedUIDValidity=0,this.listedQuery=``,this.totalMessages=0,this.messagesPerPage=50,this.resizerPositionX=ac+Math.max(lc,(window.innerWidth-ac)*.4),this.listHeight=Math.max(pc,(window.innerHeight-dc)*.4),this.isSidebarDragging=!1,this.isPaneDragging=!1,this.sidebarWidth=ac,this.densityMode=`compact`,this.showSenderAvatars=!0,this.isSyncing=!1,this.sidebarCollapsed=!1,this.sortOrder=`desc`,this.listScrolled=!1,this.targetUid=null,this.targetMailbox=null,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.bulkProcessing=!1,this.shortcutProcessing=!1,this.computedMinListWidth=lc,this._mql=window.matchMedia(`(max-width: 768px)`),this._relayToast=e=>{this.showGlobalToast(e.detail.message,e.detail.actionLabel,e.detail.actionFn,e.detail.duration,e.detail.type)},this._handleMediaQuery=e=>{this.isMobile=e.matches,this.isMobile||(this.mobileSidebarOpen=!1)},this.hasConnected=!1,this.handleDraftAutosaved=e=>{let{oldUid:t,oldMailbox:n,newUid:r,mailbox:i,subject:a,to:o,cc:s,bcc:c,hasAttachments:l,size:u}=e.detail;if(!this.messages)return;let d=String(r),f=!1,p=t?R(n||i,t):null,m=ic(o),h=ic(s),g=ic(c),_=e=>({...e,UID:d,...e.Mailbox?{Mailbox:i}:{},Size:u||e.Size,RFC822Size:u||e.RFC822Size,HasAttachments:l,_isAutosaveUpdate:!0,Envelope:{...e.Envelope,Subject:a,To:m,Cc:h,Bcc:g}});if(p){let e=this.messages.findIndex(e=>this.keyOf(e)===p);if(e!==-1){let t=[...this.messages];t[e]=_(t[e]),this.messages=t,f=!0,this.selectedMessage&&this.keyOf(this.selectedMessage)===p&&this.followAutosavedSelection(t[e])}else for(let e=0;e<this.messages.length;e++){let t=this.messages[e];if(t.SubMessages){let n=t.SubMessages.findIndex(e=>this.keyOf(e)===p);if(n!==-1){let r=[...t.SubMessages];r[n]=_(r[n]);let i=[...this.messages];i[e]={...t,SubMessages:r},this.messages=i,f=!0,this.selectedMessage&&this.keyOf(this.selectedMessage)===p&&this.followAutosavedSelection(r[n]);break}}}!f&&this.selectedMessage&&this.keyOf(this.selectedMessage)===p&&this.followAutosavedSelection(_(this.selectedMessage))}if(!f&&this.currentMailbox===i&&!(this.listLoadFailed&&this.messages.length===0)){let e=this.settingsStore?.getState().name||this.username,n=(this.username||``).split(`@`),i=n[0]||``,o=n[1]||``,s={UID:d,Size:u||0,RFC822Size:u||0,HasAttachments:l,Flags:[B,Pn],_isAutosaveUpdate:!0,Envelope:{Subject:a,Date:new Date().toISOString(),From:[{Name:e,Mailbox:i,Host:o}],To:m,Cc:h,Bcc:g}},c=this.messages.filter(e=>String(e.UID)!==String(t)&&String(e.UID)!==String(r));this.messages=[s,...c]}},this._handleSettingsChange=()=>{this._syncSettings()},this.handleSettingsSaved=e=>{(e.detail?.keys??[]).some(e=>ec.includes(e))&&z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0,!0)},this._handleI18nChange=()=>{this.requestUpdate()},this.handleLabelsSuccess=e=>{let{mailboxes:t}=e.detail;this.mailboxes=t},this.handleSyncStart=e=>{let t=e.detail;this.isSyncing=!0,!t.background&&!t.quiet&&(this.loadingMessages=!0,this.listLoadFailed=!1)},this.handleFolderCounts=e=>{let{mailbox:t=`INBOX`,counts:n,announce:r}=e.detail,i=String(t).toUpperCase()===`INBOX`,a=e=>{let n=String(e.Name||e.Mailbox);return i?n.toUpperCase()===`INBOX`:n===t};if(!this.mailboxes.some(a))return;let o=this.mailboxes.map(e=>a(e)?{...e,Total:n.total,Unseen:n.unseen}:e);this.takeMailboxes(o,!0,r!==!1)},this.handleSyncSuccess=e=>{this.isSyncing=!1,this.listLoadFailed=!1;let{data:t,background:n}=e.detail,r=e.detail.announce!==!1;if(t.Username){this.username=t.Username;let e=this.settingsStore.getState(),n=t.Address||void 0;(e.loginUsername!==t.Username||e.loginAddress!==n)&&this.settingsStore.updateSettings({loginUsername:t.Username,loginAddress:n})}if(this.takeMailboxes(t.Mailboxes,n,r),n&&this.currentPage>0)t.Total!==void 0&&t.Total!==this.totalMessages&&this.showGlobalToast(this.i18nStore?.t(`mailboxPage.newMessagesAvailable`),this.i18nStore?.t(`mailboxPage.refresh`),()=>{this.currentPage=0,z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)});else if(this.pastTheLastPage(t)){let e=t.MessagesPerPage||this.messagesPerPage,n=Math.max(0,Math.ceil(t.Total/e)-1);this.currentPage=n;let r=this.hashFor(this.currentMailbox,n,this.targetUid,this.filterQuery,this.targetMailbox);Os(r)||window.history.replaceState(history.state,``,r),z.fetch(this.currentMailbox,n,this.filterQuery,!1,!0);return}else if(t.Page!==void 0&&(this.currentPage=t.Page),this.listedPage=t.Page===void 0?this.currentPage:t.Page,this.listedMailbox=t.ListedMailbox||this.currentMailbox,this.listedUIDValidity=t.Mailbox?.UIDValidity??0,this.listedQuery=this.filterQuery,t.Total!==void 0&&(this.totalMessages=t.Total),t.MessagesPerPage!==void 0&&(this.messagesPerPage=t.MessagesPerPage),t.Messages){if(rc(this.messages,t.Messages)||(this.messages=t.Messages,this.selectAllMatching&&(this.selectedKeys=new Set(this.listedKeys().filter(e=>!this.excludedKeys.has(e))))),this.selectedMessage){let e=this.listedByKey(this.keyOf(this.selectedMessage));e&&e.Flags!==void 0&&!nc(this.selectedMessage.Flags,e.Flags)&&(this.selectedMessage={...this.selectedMessage,Flags:e.Flags??[]})}}else this.messages=[];n||(this.loadingMessages=!1,this.applyTargetUid(),this.showInitialLoader&&setTimeout(()=>{this.showInitialLoader=!1,Zs()},100))},this.handleSyncUnchanged=()=>{this.isSyncing=!1},this.handleSyncError=e=>{this.isSyncing=!1;let{background:t,error:n}=e.detail;t||(this.loadingMessages=!1,this.listLoadLimited=n instanceof et&&n.status===429,this.listLoadFailed=!0,(this.listedMailbox!==this.currentMailbox||this.listedPage!==this.currentPage||this.listedQuery!==this.filterQuery)&&(this.messages=[]))},this.handleStrayArrow=e=>{if(e.key!==`ArrowDown`&&e.key!==`ArrowUp`||e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||this.showDeleteConfirm||Y(window.location.hash))return;let t=e.composedPath().filter(e=>e instanceof HTMLElement),n=t[0],r=n?.classList.contains(`folder-name`)&&t.some(e=>e.tagName===`ALPS-FOLDER-LIST`);if(!n||n!==document.body&&n.tagName!==`A`&&!r||t.some(e=>e.tagName===`ALPS-MESSAGE-LIST`||e.tagName===`DIALOG`||[`dialog`,`menu`,`listbox`].includes(e.getAttribute(`role`)??``)))return;let i=this.renderRoot.querySelector(`alps-message-list`);i&&(e.preventDefault(),i.step(e.key===`ArrowDown`?1:-1))},this.handleMessageShortcut=async e=>{if(e.key!==`q`&&e.key!==`z`||e.shiftKey||!Qs(e)||this.settingsStore.getState().keyboardShortcuts===!1||Y(window.location.hash)||this.shortcutProcessing||this.bulkProcessing||this.showDeleteConfirm||this.loadingMessages||this.listLoadFailed||this.listedMailbox!==this.currentMailbox||this.listedPage!==this.currentPage||this.listedQuery!==this.filterQuery||e.key===`z`&&!this.canArchiveHere)return;let t=this.renderRoot.querySelector(`alps-message-list`),n=this.renderRoot.querySelector(`alps-message-reader`),r=this.selectionCount>0,i=!!t&&e.composedPath().includes(t),a=i?t.focusedRowKeys:[],o=!!n?.message&&!!this.selectedMessage&&this.keyOf(n.message)===this.keyOf(this.selectedMessage),s;if(r)s=[...this.selectedKeys];else if(i)s=a;else if(o)s=e.key===`q`?n.markReadTargetKeys:n.toolbarIsConversation?n.conversationUids.map(e=>R(this.currentMailbox,e)):[this.keyOf(this.selectedMessage)];else return;if(s.length!==0||r){e.preventDefault(),this.shortcutProcessing=!0;try{if(e.key===`q`){let e=await this.flagTargets(s,[B],`add`);e.ok||this.reportFlagFailure(e)}else{let e=T(`archive`,this.mailboxes,S);if(!r&&a.length>0){let t=s.filter(t=>dn(t).mailbox!==e);t.length>0&&await this.fileDropped(t,e)}else await this.fileAway(s,e,r,t=>this.movedMessage(r||s.length>1,t,e))}}catch(t){E.error(`Keyboard message action failed`,t),this.reportActionFailed(e.key===`q`?`toast.flagChangeFailed`:`toast.moveFailed`,e.key===`q`?`Could not update the messages`:`Could not move that`)}finally{this.shortcutProcessing=!1}}},this.handleMailboxNotFound=()=>{this.showGlobalToast(this.i18nStore.t(`mailboxPage.mailboxNotFound`),``,void 0,3e3,`error`),this.updateUrl(w,0,null,null)},this.handleHashChange=()=>{Y(window.location.hash)||this.readMailboxHash(window.location.hash)},this.stopResize=null,this.startResize=e=>{e.preventDefault(),this.stopResize?.(),this.isPaneDragging=!0,this.updateComputedMinWidth();let t=e=>{if(this.layoutMode===`vertical`){let t=this.sidebarCollapsed?sc:this.sidebarWidth,n=getComputedStyle(this).direction===`rtl`?window.innerWidth-e.clientX:e.clientX,r=Math.max(t+this.computedMinListWidth,Math.min(n,window.innerWidth-uc));this.resizerPositionX=r}else this.layoutMode===`horizontal`&&(this.listHeight=Math.max(fc,Math.min(e.clientY-dc,window.innerHeight-fc)))},n=()=>{this.stopResize=null,this.isPaneDragging=!1,window.removeEventListener(`mousemove`,t),window.removeEventListener(`mouseup`,n)};this.stopResize=n,window.addEventListener(`mousemove`,t),window.addEventListener(`mouseup`,n)},this.rowsAfterTakeOut=null,this.handleDroppedMessages=e=>{let{folder:t,copy:n,keys:r,selection:i}=e.detail,a=this.mailboxes.find(e=>(e.Name||e.Mailbox)===t);if(!ve(a,this.mailboxes,this.currentMailbox))return;if(i&&this.selectionCount>0){this._handleReaderAction(new CustomEvent(`action`,{detail:{action:n?`copyTo`:`moveTo`,folder:t}}));return}let o=r.filter(e=>dn(e).mailbox!==t);o.length!==0&&(n?this.copyKeys(o,t,o.length>1):this.fileDropped(o,t))}}chime(){return this.notificationSound??=new Audio(`/assets/notify.wav`)}static{this.styles=[j,y`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      width: 100vw;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      overflow: hidden;
      /* Clip, where the browser knows it: a hidden host is still a scroll
         container, so a scrollIntoView() or focus() on anything at its clipped
         edge scrolled the whole page by what overflowed, cutting off the top
         of the header until the next navigation. Clip cuts the same and
         cannot be scrolled at all. */
      overflow: clip;
      font-size: 14px;
    }
    
    /* Layout Configurations */
    .app-container {
      display: flex;
      flex: 1;
      min-height: 0;
      width: 100%;
      position: relative;
    }

    /* Vertical: Sidebar (250px) | Message List (min 300px) | Reader (flex) */
    .layout-vertical alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${ac}px); flex-shrink: 0; }
    .layout-vertical .main-view { flex: 1; display: flex; flex-direction: row; min-width: 0; }
    .layout-vertical .message-list-pane { width: ${lc}px; flex-shrink: 0; border-inline-end: 1px solid var(--border-color); }
    .layout-vertical .message-reader-pane { flex: 1; min-width: 0; }

    /* Horizontal: Sidebar (250px) | [ Message List (50%) / Reader (50%) ] */
    .layout-horizontal alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${ac}px); flex-shrink: 0; }
    .layout-horizontal .main-view { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .layout-horizontal .message-list-pane { flex-shrink: 0; border-bottom: 1px solid var(--border-color); }
    .layout-horizontal .message-reader-pane { flex: 1; min-height: 0; }

    /* Full: Sidebar (250px) | Message List OR Reader */
    .layout-full alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${ac}px); flex-shrink: 0; }
    .layout-full .main-view { flex: 1; display: flex; min-width: 0; }
    .layout-full .message-list-pane { flex: 1; min-width: 0; }
    .layout-full .message-reader-pane { flex: 1; min-width: 0; }
    .layout-full.reading .message-list-pane { display: none; }
    .layout-full:not(.reading) .message-reader-pane { display: none; }

    .desktop-sidebar.open {
      display: flex;
    }

    .mobile-bulk-actions-container {
      display: flex;
      gap: 8px;
      align-items: center;
      width: 100%;
    }

    .header-divider {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 4px;
    }

    .mobile-bulk-actions-count {
      font-weight: 600;
      margin-inline-start: 8px;
      margin-inline-end: auto;
    }

    .pane {
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      padding: 0;
    }
    
    .resizer {
      background: transparent;
      position: relative;
      z-index: 25;
      flex-shrink: 0;
    }

    .resizer::after {
      content: '';
      position: absolute;
      background: transparent;
      transition: background 0.2s;
    }

    .layout-vertical .resizer {
      width: 4px;
      margin: 0 -2px;
      cursor: col-resize;
    }

    .layout-vertical .resizer::after {
      width: 3px;
      top: 0;
      bottom: 0;
      inset-inline-start: 1px;
    }

    .layout-horizontal .resizer {
      height: 4px;
      margin: -2px 0;
      cursor: row-resize;
    }

    .layout-horizontal .resizer::after {
      height: 3px;
      left: 0;
      right: 0;
      top: 1px;
    }

    .resizer:hover, .resizer.dragging {
      z-index: 9999;
    }

    .resizer:hover::after, .resizer.dragging::after {
      background: var(--accent-color, #005A9E);
    }



    .app-container.dragging {
      user-select: none;
      pointer-events: none;
    }
    

    alps-sidebar.desktop-sidebar {
      transition: width 0.2s, z-index 0s 0.2s;
      position: relative;
      z-index: 20;
    }

    alps-sidebar.desktop-sidebar[collapsed][peeking] {
      transition: width 0.2s, z-index 0s 0s;
    }

    .app-container.dragging alps-sidebar.desktop-sidebar {
      transition: none;
    }



    .app-container.collapsed {
      --sidebar-width: ${sc}px;
    }

    .app-container.collapsed .message-list-pane {
      box-shadow: rgba(95, 95, 95, 0.1) calc(-4px * var(--ui-inline-direction, 1)) 0 4px -2px;
      z-index: 25;
      border-inline-start: 1px solid var(--border-color);
    }



    `]}updateComputedMinWidth(){let e=lc,t=this.shadowRoot?.querySelector(`.message-list-pane alps-message-list`);if(t){let n=t.shadowRoot?.querySelector(`.list-header`);if(n){let t=we(n);e=Math.max(lc,t+2)}}if(e!==this.computedMinListWidth){this.computedMinListWidth=e;let t=this.sidebarCollapsed&&!this.isMobile?sc:this.sidebarWidth;this.resizerPositionX-t<e&&(this.resizerPositionX=t+e)}}showGlobalToast(e,t=``,n,r=3e3,i){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e,actionLabel:t,actionFn:n,duration:r,type:i}}))}reportActionFailed(e,t){this.showGlobalToast(this.i18nStore?.t(e)||t,``,void 0,4e3,`error`)}reportFlagFailure(e){if(e.reason===`auth`)return;let t=e.reason===`unsupported`?`toast.tagNotSupported`:`toast.flagChangeFailed`,n=e.reason===`unsupported`?`That tag is not supported by this mail server`:`Could not update the messages`;this.showGlobalToast(this.i18nStore?.t(t)||n,``,void 0,4e3,`error`)}get canArchiveHere(){let e=ue(this.currentMailbox,this.mailboxes);return e!==`trash`&&e!==`drafts`&&e!==`archive`}get effectiveListWidth(){let e=this.sidebarCollapsed&&!this.isMobile?sc:this.sidebarWidth;return Math.max(this.computedMinListWidth,this.resizerPositionX-e)}get selectedListed(){if(this.selectedKeys.size===0)return[];let e=[];for(let t of this.messages){this.selectedKeys.has(this.keyOf(t))&&e.push(t);for(let n of t.SubMessages||[])this.selectedKeys.has(this.keyOf(n))&&e.push(n)}return e}get selectedStarRows(){let e=[];for(let t of this.messages){let n=[t,...t.SubMessages||[]],r=n.filter(e=>this.selectedKeys.has(this.keyOf(e)));if(n.length>1&&r.length===n.length)e.push({face:t,messages:n});else for(let t of r)e.push({face:t,messages:[t]})}return e}get allSelectedStarred(){let e=this.selectedStarRows;return e.length>0&&e.every(e=>e.messages.some(tc))}starWrite(e){let t=e.length>0&&e.every(e=>e.messages.some(tc));return{keys:(t?e.flatMap(e=>e.messages.filter(tc)):e.filter(e=>!e.messages.some(tc)).map(e=>e.face)).map(e=>this.keyOf(e)),op:t?`remove`:`add`}}get commonSelectedTags(){let e=this.selectedListed;return e.length===0?[]:[`$label1`,`$label2`,`$label3`,`$label4`,`$label5`].filter(t=>e.every(e=>e.Flags?.some(e=>e.toLowerCase()===t.toLowerCase())))}get allSelectedUnread(){let e=!1;for(let t of this.messages){let n=[t,...t.SubMessages||[]].filter(e=>this.selectedKeys.has(this.keyOf(e)));if(n.length!==0&&(e=!0,n.every(e=>e.Flags?.includes(`\\Seen`))))return!1}return e}get selectionCount(){return this.selectAllMatching?Math.max(0,this.totalMessages-this.excludedKeys.size):this.selectedKeys.size}get matchingScope(){return{query:this.filterQuery,except:[...this.excludedKeys].map(e=>dn(e).uid)}}listedKeys(){let e=[];for(let t of this.messages||[]){e.push(this.keyOf(t));for(let n of t.SubMessages||[])e.push(this.keyOf(n))}return e}takeSelection(e){if(this.selectedKeys=e,!this.selectAllMatching)return;let t=new Set(this.excludedKeys);for(let n of this.listedKeys())e.has(n)?t.delete(n):t.add(n);this.excludedKeys=t,this.selectionCount<=0&&this.clearSelection()}selectAllInFolder(){this.selectAllMatching=!0,this.excludedKeys=new Set,this.selectedKeys=new Set(this.listedKeys())}clearSelection(){this.selectAllMatching=!1,this.excludedKeys=new Set,this.selectedKeys=new Set}mailboxOf(e){return pn(e,this.currentMailbox)}keyOf(e){return R(this.mailboxOf(e),e?.UID)}isOpen(e){return!!this.selectedMessage&&!!e&&this.keyOf(this.selectedMessage)===this.keyOf(e)}listedByKey(e){for(let t of this.messages){if(this.keyOf(t)===e)return t;let n=t.SubMessages?.find(t=>this.keyOf(t)===e);if(n)return n}}connectedCallback(){super.connectedCallback();let e=this.hasConnected;this.hasConnected=!0;let t=window.location.hash;e&&!t.startsWith(`#/mailbox/`)&&!Y(t)&&window.history.replaceState(history.state,``,this.hashFor(this.currentMailbox,this.currentPage,this.targetUid,this.filterQuery,this.targetMailbox));let n=[this.currentMailbox,this.currentPage,this.filterQuery].join(`
`);e?this.readMailboxHash(Ds()??``,Y(t)):this.extractMailboxFromHash(Ds()??``),window.addEventListener(`hashchange`,this.handleHashChange),document.addEventListener(`click`,this.unlockAudio),document.addEventListener(`keydown`,this.unlockAudio),document.addEventListener(`keydown`,this.handleStrayArrow),document.addEventListener(`keydown`,this.handleMessageShortcut),this._mql.addEventListener(`change`,this._handleMediaQuery),this._handleMediaQuery(this._mql),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this.settingsStore.addEventListener(`saved`,this.handleSettingsSaved),this.i18nStore?.addEventListener(`change`,this._handleI18nChange),this._syncSettings(),z.addEventListener(`sync-start`,this.handleSyncStart),z.addEventListener(`sync-success`,this.handleSyncSuccess),z.addEventListener(`sync-error`,this.handleSyncError),z.addEventListener(`sync-unchanged`,this.handleSyncUnchanged),z.addEventListener(`inbox-counts`,this.handleFolderCounts),z.addEventListener(`folder-counts`,this.handleFolderCounts),z.addEventListener(`labels-success`,this.handleLabelsSuccess),z.addEventListener(`mailbox-not-found`,this.handleMailboxNotFound),window.addEventListener(`draft-autosaved`,this.handleDraftAutosaved),e?n===[this.currentMailbox,this.currentPage,this.filterQuery].join(`
`)&&z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0,!0):z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0)}disconnectedCallback(){super.disconnectedCallback(),this.stopResize?.(),window.removeEventListener(`hashchange`,this.handleHashChange),this._mql.removeEventListener(`change`,this._handleMediaQuery),document.removeEventListener(`click`,this.unlockAudio),document.removeEventListener(`keydown`,this.unlockAudio),document.removeEventListener(`keydown`,this.handleStrayArrow),document.removeEventListener(`keydown`,this.handleMessageShortcut),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.settingsStore.removeEventListener(`saved`,this.handleSettingsSaved),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),z.removeEventListener(`sync-start`,this.handleSyncStart),z.removeEventListener(`sync-success`,this.handleSyncSuccess),z.removeEventListener(`sync-error`,this.handleSyncError),z.removeEventListener(`sync-unchanged`,this.handleSyncUnchanged),z.removeEventListener(`inbox-counts`,this.handleFolderCounts),z.removeEventListener(`folder-counts`,this.handleFolderCounts),z.removeEventListener(`labels-success`,this.handleLabelsSuccess),z.removeEventListener(`mailbox-not-found`,this.handleMailboxNotFound),window.removeEventListener(`draft-autosaved`,this.handleDraftAutosaved),z.stop(),qs.stop()}updated(e){super.updated(e),(e.has(`sidebarCollapsed`)||e.has(`layoutMode`)||e.has(`currentMailbox`)||e.has(`isMobile`)||e.has(`mailboxes`))&&setTimeout(()=>this.updateComputedMinWidth(),0)}followAutosavedSelection(e){this.selectedMessage=e,this.targetUid=String(e.UID);let t=this.mailboxOf(e);this.targetMailbox=t===this.currentMailbox?null:t;let n=this.hashFor(this.currentMailbox,this.currentPage,this.targetUid,this.filterQuery,this.targetMailbox);Os(n)||window.history.replaceState(history.state,``,n)}_syncSettings(){let e=this.settingsStore.getState();this.layoutMode=e.layoutMode,this.densityMode=e.densityMode,this.showSenderAvatars=e.showSenderAvatars??!0,this.sortOrder=e.sortOrder||`desc`,e.loginUsername&&(this.username=e.loginUsername),this.sidebarCollapsed!==e.sidebarCollapsed&&(this.sidebarCollapsed=e.sidebarCollapsed),e.messagesPerPage&&e.messagesPerPage>0&&(this.messagesPerPage=e.messagesPerPage),z.setListingSettings(ec.map(t=>e[t]).join(` `)),e.checkMailInterval!==void 0&&z.start(e.checkMailInterval),e.pushNewMail?qs.start():qs.stop()}takeMailboxes(e,t,n){let r=this.mailboxes.length===0,i=!1,a=!1,o=0;if(e){for(let n of e){let e=n.Name||n.Mailbox,s=this.mailboxes.find(t=>(t.Name||t.Mailbox)===e);if(s&&!r&&t&&n.Total!==void 0&&s.Total!==void 0&&n.Unseen!==void 0&&s.Unseen!==void 0){let t=Math.min(n.Total-s.Total,n.Unseen-s.Unseen);t>0&&(i=!0,e.toUpperCase()===`INBOX`&&(a=!0,o+=t))}}this.mailboxes=e}if(n&&i&&this.settingsStore.getState().soundNotifications){let e=this.chime();e.currentTime=0,e.play().catch(e=>{e.name!==`NotAllowedError`&&E.error(`Failed to play sound notification:`,e)})}if(n&&a&&this.settingsStore.getState().desktopNotifications&&`Notification`in window&&Notification.permission===`granted`){let e=this.i18nStore?.t(`mailboxPage.newMessages`),t=o===1?this.i18nStore?.t(`mailboxPage.newMessagesSingleBody`):this.i18nStore?.t(`mailboxPage.newMessagesMultiBody`,{count:o});try{let n=new Notification(e,{body:t,icon:`/apple-touch-icon.png`,tag:`alps-new-message`});n.onclick=()=>{window.focus(),n.close(),this.currentMailbox===`INBOX`?(this.currentPage=0,z.fetch(this.currentMailbox,0,this.filterQuery,!1)):this.updateUrl(`INBOX`,0,null,``)}}catch(e){E.error(`Failed to show desktop notification:`,e)}}a&&this.currentMailbox!==`INBOX`&&this.showGlobalToast(this.i18nStore?.t(`mailboxPage.newMessagesInInbox`),this.i18nStore?.t(`mailboxPage.open`),()=>{this.updateUrl(`INBOX`,0,null,``)},5e3)}pastTheLastPage(e){let t=e.Page??this.currentPage,n=e.MessagesPerPage||this.messagesPerPage;return t<=0||(e.Messages?.length??0)>0||e.Total===void 0||e.Total<=0||n<=0?!1:Math.ceil(e.Total/n)-1<t}readMailboxHash(e,t=!1){let n=this.currentMailbox,r=this.currentPage,i=this.targetUid,a=this.targetMailbox,o=this.filterQuery;this.extractMailboxFromHash(e),n!==this.currentMailbox||r!==this.currentPage||o!==this.filterQuery?(n===this.currentMailbox?o!==this.filterQuery&&(this.loadingMessages=!0,t||(this.currentPage=0),this.clearSelection()):(this.selectedMessage=null,t||(this.currentPage=0),this.clearSelection(),this.loadingMessages=!0),z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)):(i!==this.targetUid||a!==this.targetMailbox)&&this.applyTargetUid()}openFolderPrompt(){let e=this.shadowRoot?.querySelector(`alps-folder-list`);e&&typeof e.triggerCreateFolder==`function`&&e.triggerCreateFolder()}updateUrl(e,t,n,r=this.filterQuery,i=null){let a=this.hashFor(e,t,n,r,i);Os(a)?this.readMailboxHash(a,!0):window.location.hash=a}hashFor(e,t,n,r,i){let a=`#/mailbox/${encodeURIComponent(e)}`,o=new URLSearchParams;t>0&&o.set(`p`,t.toString()),n&&(o.set(`uid`,n),i&&i!==e&&o.set(`in`,i)),r&&o.set(`q`,r);let s=o.toString();return s&&(a+=`?`+s),a}openKeyInUrl(e,t,n){if(!n){this.updateUrl(e,t,null);return}let{mailbox:r,uid:i}=dn(n);this.updateUrl(e,t,i,void 0,r)}extractMailboxFromHash(e=window.location.hash){if(e.startsWith(`#/mailbox/`)){let t=e.substring(10),n=t.indexOf(`?`),r=``;n!==-1&&(r=t.substring(n+1),t=t.substring(0,n));let i=t.split(`/`);this.currentMailbox=decodeURIComponent(i[0]);let a=new URLSearchParams(r);i.length>1&&i[1]?(this.targetUid=i[1],this.targetMailbox=null):(this.targetUid=a.get(`uid`)||null,this.targetMailbox=this.targetUid&&a.get(`in`)||null);let o=a.get(`p`);this.currentPage=o&&parseInt(o,10)||0,this.filterQuery=a.get(`q`)||``}else this.currentMailbox=w,this.targetUid=null,this.targetMailbox=null,this.currentPage=0}async applyTargetUid(){if(!this.targetUid){this.markReadTimer&&=(clearTimeout(this.markReadTimer),null),this.selectedMessage=null;return}let e=this.targetUid,t=this.targetMailbox,n=t||this.currentMailbox,r=R(n,e),i=this.listedByKey(r)??(this.selectedMessage&&this.keyOf(this.selectedMessage)===r?this.selectedMessage:void 0);if(!i&&this.messages.length>0)try{let t=this.settingsStore?.getState()?.preferredView||`html`,r=q.generation(),a=await F(`/mailboxes/${k(n)}/messages/${e}?view=${t}`);if(a.ok){let e=await a.json();if(e.Message){i={...e.Message,Mailbox:e.Message.Mailbox||n};let a=e.Part;if((!a||typeof e.Body==`string`)&&q.generation()===r){let n=!!a&&(a.MIMEType||a.MimeType||`text/plain`).toLowerCase()===`text/html`;q.set(i.Mailbox,String(i.UID),t,{Message:e.Message,Part:a,Attachments:e.Attachments,RawHtml:a&&n?e.Body:void 0,RawText:a&&!n?e.Body:void 0,HasHTML:!!e.HasHTML,HasText:!!e.HasText})}}}}catch(e){E.error(`Failed to fetch shifted message:`,e)}this.targetUid===e&&this.targetMailbox===t&&(i?this.isOpen(i)||(this.selectedMessage=i,this.layoutMode===`full`&&(this.expandedFolders=new Set),this._scheduleMarkAsRead(i)):this.messages.length>0&&(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)))}async selectMessage(e){this.openKeyInUrl(this.currentMailbox,this.currentPage,this.keyOf(e))}_scheduleMarkAsRead(e){if(this.markReadTimer&&=(clearTimeout(this.markReadTimer),null),e.Flags?.includes(`\\Seen`))return;let t=this.settingsStore?.getState().markReadTimeout??0;t<0||(t===0?this._doMarkAsRead(e):this.markReadTimer=setTimeout(()=>{this._doMarkAsRead(e)},t*1e3))}updateLocalMessageFlags(e,t,n){let r=new Set(e),i=[],a=[...this.messages],o=e=>{let r=!!e.Flags?.includes(t);return n===`add`&&!r?{...e,Flags:[...e.Flags||[],t]}:n===`remove`&&r?{...e,Flags:e.Flags.filter(e=>e!==t)}:e};for(let e=0;e<a.length;e++){let t=a[e];if(r.has(this.keyOf(t))){let n=o(t);n!==t&&(a[e]=t=n,i.push(this.keyOf(t)))}if(t.SubMessages?.some(e=>r.has(this.keyOf(e)))){let n=t.SubMessages.map(e=>r.has(this.keyOf(e))?o(e):e),s=n.filter((e,n)=>e!==t.SubMessages[n]);if(s.length>0){a[e]={...t,SubMessages:n};for(let e of s)i.push(this.keyOf(e))}}}if(i.length>0){if(this.messages=a,this.selectedMessage&&r.has(this.keyOf(this.selectedMessage))){let e=this.selectedMessage.Flags&&this.selectedMessage.Flags.includes(t);n===`add`&&!e?this.selectedMessage.Flags=[...this.selectedMessage.Flags||[],t]:n===`remove`&&e&&(this.selectedMessage.Flags=this.selectedMessage.Flags.filter(e=>e!==t)),this.selectedMessage={...this.selectedMessage}}window.dispatchEvent(new CustomEvent(`external-message-flags-changed`,{detail:{keys:e,flag:t,action:n}}))}return i}async _handleListToggleStar(e){let t=e.detail.message,{keys:n,op:r}=this.starWrite([{face:t,messages:e.detail.messages??[t]}]),i=r===`add`?`remove`:`add`;this.updateLocalMessageFlags(n,V,r);let a=new Set,o;try{o=(await this.eachFolder(n,async(e,t)=>{let n=await H.setFlag(e,t,[V],r);if(n.ok)for(let n of t)a.add(R(e,n));return n})).refused}catch{}let s=n.filter(e=>!a.has(e));s.length>0&&(this.updateLocalMessageFlags(s,V,i),o&&this.reportFlagFailure(o))}async _doMarkAsRead(e){let t=await H.markAsRead(this.mailboxOf(e),e);t?.Flags?.includes(`\\Seen`)&&(this.isOpen(e)&&(this.selectedMessage=t),this.updateLocalMessageFlags([this.keyOf(e)],B,`add`))}async handleNamedMessageAction(e){let t=String(e.uid),n=e.mailbox,r=R(n,t),i=!!this.selectedMessage&&this.keyOf(this.selectedMessage)===r;if(e.action===`downloadMessage`){let e=document.createElement(`a`);e.href=`/mailboxes/${k(n)}/messages/${t}/raw`,e.download=``,document.body.appendChild(e),e.click(),document.body.removeChild(e);return}if(e.action===`showOriginal`){window.open(`#/original?mailbox=${encodeURIComponent(n)}&uid=${t}`,`_blank`);return}if(e.action===`markUnread`){let e=await H.setFlag(n,[t],[B],`remove`);if(!e.ok){this.reportFlagFailure(e);return}this.updateLocalMessageFlags([r],B,`remove`),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null);return}if(e.action!==`delete`)return;if(this.deletesForGood(n)){this.pendingDeleteDetails={isBulk:!1,doomed:[r],toTrash:[],isDrafts:ue(n,this.mailboxes)===`drafts`,named:{isOpen:i,nextUid:e.nextUid,nextMailbox:e.nextMailbox,done:e.done}},this.showDeleteConfirm=!0;return}let a=T(`trash`,this.mailboxes,x),o=this.currentMailbox,s=await H.moveMessages(n,[t],a);if(!s.success){e.done?.(!1),s.reason!==`auth`&&this.reportActionFailed(`toast.moveFailed`,`Could not move that`);return}e.done?.(!0),i&&this.leaveDeletedMessage(e.nextUid,e.nextMailbox);let c=s.uidMapping?.[t],l=c?async()=>{try{let e=await H.moveMessages(a,[c],n);if(!e.success){e.reason!==`auth`&&this.reportActionFailed(`toast.undoFailed`,`Could not undo that`);return}let t=e.uidMapping?.[c];if(i){let e=this.currentMailbox===o?this.currentPage:0;this.openKeyInUrl(o,e,t?R(n,t):null)}else this.renderRoot.querySelector(`alps-message-reader`)?.reloadConversation()}catch(e){E.error(`Undo failed`,e),this.reportActionFailed(`toast.undoFailed`,`Could not undo that`)}}:void 0;this.showGlobalToast(this.movedMessage(!1,1,a),l?this.i18nStore?.t(`mailboxPage.undo`):``,l,$s)}leaveDeletedMessage(e,t){e?this.updateUrl(this.currentMailbox,this.currentPage,e,void 0,t??null):(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null))}async eachFolder(e,t){let n=[],r;return await z.afterWrites(async()=>{for(let[i,a]of fn(e)){let e=await t(i,a);if(e.ok)n.push({mailbox:i,uids:a,result:e});else if(r??=e,e.reason===`auth`)break}}),{done:n,refused:r}}writtenKeys(e){return e.flatMap(({mailbox:e,uids:t})=>t.map(t=>R(e,t)))}async flagEach(e,t,n){let r=t.map(t=>({flag:t,keys:this.updateLocalMessageFlags(e,t,n)})),i=new Set,{refused:a}=await this.eachFolder(e,async(e,r)=>{let a=await H.setFlag(e,r,t,n);if(a.ok)for(let t of r)i.add(R(e,t));return a});if(i.size<e.length){let e=n===`add`?`remove`:`add`;for(let{flag:t,keys:n}of r){let r=n.filter(e=>!i.has(e));r.length>0&&this.updateLocalMessageFlags(r,t,e)}}return a??{ok:!0}}async flagTargets(e,t,n){if(!this.selectAllMatching)return this.flagEach(e,t,n);let r=await H.setFlagMatching(this.currentMailbox,this.matchingScope,t,n);if(r.ok)for(let r of t)this.updateLocalMessageFlags(e,r,n);return r}async fileWholeFolder(e,t){let n=this.currentMailbox,r=this.matchingScope,i=await H.moveMatching(n,r,e);if(!i.success){i.reason!==`auth`&&this.reportActionFailed(`toast.moveFailed`,`Could not move that`);return}this.clearSelection(),this.selectedMessage=null,this.updateUrl(n,this.currentPage,null);let a=this.undoMoves([{from:n,mapping:i.uidMapping??{}}],e,n,void 0);this.showGlobalToast(t(i.count??0),a?this.i18nStore?.t(`mailboxPage.undo`):``,a,$s)}takeRowsOut(e){let t=this.messages,n=this.totalMessages,r=e.length>0?z.rowsTakenOut(e):()=>{},i=e=>this.messages===this.rowsAfterTakeOut&&(r(),this.messages=t,this.totalMessages=n,this.takeRowsOut(e),!0);if(e.length===0)return i;let a=new Set(e),o=0,s=[];for(let e of this.messages){let t=e.SubMessages??[],n=t.filter(e=>!a.has(this.keyOf(e)));a.has(this.keyOf(e))&&n.length===0?o+=1:s.push(n.length===t.length?e:{...e,SubMessages:n})}return this.messages=s,this.rowsAfterTakeOut=s,o>0&&(this.totalMessages=Math.max(0,this.totalMessages-o)),i}async fileAway(e,t,n,r){if(this.selectAllMatching)return this.fileWholeFolder(t,r);let i=this.currentMailbox,a=this.selectedMessage?this.keyOf(this.selectedMessage):void 0,o=n?e.filter(e=>dn(e).mailbox!==t):[],s=n?this.takeRowsOut(o):void 0;await z.afterWrites(async()=>{let{done:c,refused:l}=await this.eachFolder(e,async(e,n)=>{if(e===t)return{ok:!0,uidMapping:{}};let r=await H.moveMessages(e,n,t);return{ok:r.success,reason:r.reason,uidMapping:r.uidMapping??{}}}),u=this.writtenKeys(c);if(u.length>0){n&&(this.selectedKeys=new Set([...this.selectedKeys].filter(e=>!u.includes(e)))),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null);let e=c.filter(({mailbox:e})=>e!==t).map(({mailbox:e,result:t})=>({from:e,mapping:t.uidMapping})),o=this.undoMoves(e,t,i,n?void 0:a);this.showGlobalToast(r(u.length),o?this.i18nStore?.t(`mailboxPage.undo`):``,o,$s)}if(l&&l.reason!==`auth`&&(this.reportActionFailed(`toast.moveFailed`,`Could not move that`),s)){let t=new Set(u),n=e.filter(e=>!t.has(e));s(o.filter(e=>t.has(e)))?this.selectedKeys=new Set(n):z.sync()}})}undoMoves(e,t,n,r,i=!0){let a=e.filter(({mapping:e})=>Object.keys(e).length>0);if(a.length!==0)return async()=>{try{let e=[],o=null,s;if(await z.afterWrites(async()=>{for(let{from:n,mapping:i}of a){let a=await H.moveMessages(t,Object.values(i),n);if(a.success)for(let[t,s]of Object.entries(i)){let i=a.uidMapping?.[s];i&&(e.push(R(n,i)),r===R(n,t)&&(o=R(n,i)))}else if(s??=a,a.reason===`auth`)break}}),s&&s.reason!==`auth`&&this.reportActionFailed(`toast.undoFailed`,`Could not undo that`),e.length===0)return;if(r!==void 0){let e=this.currentMailbox===n?this.currentPage:0;this.openKeyInUrl(n,e,o)}else i&&this.currentMailbox===n&&(this.selectedKeys=new Set([...this.selectedKeys,...e]))}catch(e){E.error(`Undo failed`,e),this.reportActionFailed(`toast.undoFailed`,`Could not undo that`)}}}async copyKeys(e,t,n){let{done:r,refused:i}=await this.eachFolder(e,async(e,n)=>{let r=await H.copyMessages(e,n,t);return{ok:r.success,reason:r.reason,uidMapping:{}}}),a=this.writtenKeys(r).length;if(a>0){let e=n?this.i18nStore?.t(`toast.messagesCopiedToFolder`,{count:a,folder:this.folderCaption(t)}):this.i18nStore?.t(`toast.messageCopiedToFolder`,{folder:this.folderCaption(t)});this.showGlobalToast(e,``,void 0,$s)}i&&i.reason!==`auth`&&this.reportActionFailed(`toast.copyFailed`,`Could not copy that`)}async fileDropped(e,t){let n=this.currentMailbox,r=this.selectedMessage?this.keyOf(this.selectedMessage):void 0,i=this.takeRowsOut(e);await z.afterWrites(async()=>{let{done:a,refused:o}=await this.eachFolder(e,async(e,n)=>{let r=await H.moveMessages(e,n,t);return{ok:r.success,reason:r.reason,uidMapping:r.uidMapping??{}}}),s=this.writtenKeys(a);if(s.length>0){let e=r!==void 0&&s.includes(r);e&&(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null));let i=a.map(({mailbox:e,result:t})=>({from:e,mapping:t.uidMapping})),o=this.undoMoves(i,t,n,e?r:void 0,!1);this.showGlobalToast(this.movedMessage(s.length>1,s.length,t),o?this.i18nStore?.t(`mailboxPage.undo`):``,o,$s)}if(o&&o.reason!==`auth`){this.reportActionFailed(`toast.moveFailed`,`Could not move that`);let t=new Set(s);i(e.filter(e=>t.has(e)))||z.sync()}})}deletesForGood(e){let t=ue(e,this.mailboxes);return t===`trash`||t===`drafts`||t===`junk`}folderCaption(e){return fe(e,this.i18nStore,this.mailboxes)}movedMessage(e,t,n){let r=this.folderCaption(n);return e?this.i18nStore?.t(`toast.messagesMovedToFolder`,{count:t,folder:r}):this.i18nStore?.t(`toast.messageMovedToFolder`,{folder:r})}async _handleReaderAction(e){let t=e.detail.action;if(e.detail.uid&&e.detail.mailbox)return this.handleNamedMessageAction(e.detail);let n=this.selectionCount>0,r=this.selectedMessage;if(!n&&!r?.UID)return;let i=n?[]:[this.keyOf(r)],a=n?[...this.selectedKeys]:e.detail.uids?.length?e.detail.uids.map(e=>R(this.currentMailbox,e)):i,o=n||a.length>1;n&&(this.bulkProcessing=!0);try{if(t===`star`){let e=n?this.starWrite(this.selectedStarRows):{keys:i,op:r.Flags?.includes(`\\Flagged`)?`remove`:`add`},t=await this.flagTargets(e.keys,[V],e.op);t.ok||this.reportFlagFailure(t)}else if(t===`addTag`||t===`removeTag`){let n=e.detail.tags||(e.detail.folder?[e.detail.folder]:[]);if(!n||n.length===0)return;let r=t===`addTag`?`add`:`remove`,i=await this.flagTargets(a,n,r);i.ok||this.reportFlagFailure(i),this.requestUpdate()}else if(t===`markUnread`){if(n){let e=await this.flagTargets(a,[B],this.allSelectedUnread?`add`:`remove`);e.ok||this.reportFlagFailure(e)}else{let e=!r.Flags||!r.Flags.includes(`\\Seen`),t=await H.setFlag(this.mailboxOf(r),[String(r.UID)],[B],e?`add`:`remove`);t.ok?e?(this.selectedMessage={...r,Flags:[...r.Flags||[],B]},this.updateLocalMessageFlags(i,B,`add`)):(this.updateLocalMessageFlags(i,B,`remove`),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)):this.reportFlagFailure(t)}}else if(t===`delete`||t===`archive`||t===`reportSpam`||t===`notSpam`){let e=T(`trash`,this.mailboxes,x);if(t===`archive`&&(e=T(`archive`,this.mailboxes,S)),t===`reportSpam`&&(e=T(`junk`,this.mailboxes,C)),t===`notSpam`&&(e=w),t===`delete`&&this.selectAllMatching){if(this.deletesForGood(this.currentMailbox)){this.pendingDeleteDetails={isBulk:n,doomed:[],toTrash:[],isDrafts:ue(this.currentMailbox,this.mailboxes)===`drafts`,matching:{count:this.selectionCount}},this.showDeleteConfirm=!0;return}}else if(t===`delete`){let e=a.filter(e=>this.deletesForGood(dn(e).mailbox));if(e.length>0){this.pendingDeleteDetails={isBulk:n,doomed:e,toTrash:a.filter(t=>!e.includes(t)),isDrafts:e.every(e=>ue(dn(e).mailbox,this.mailboxes)===`drafts`)},this.showDeleteConfirm=!0;return}}await this.fileAway(a,e,n,t=>this.movedMessage(o,t,e))}else if(t===`moveTo`||t===`copyTo`){let r=e.detail.folder;if(!r)return;if(t===`moveTo`)await this.fileAway(a,r,n,e=>this.movedMessage(o,e,r));else if(this.selectAllMatching){let e=await H.copyMatching(this.currentMailbox,this.matchingScope,r);if(e.success){let t=e.count??0;this.showGlobalToast(o?this.i18nStore?.t(`toast.messagesCopiedToFolder`,{count:t,folder:this.folderCaption(r)}):this.i18nStore?.t(`toast.messageCopiedToFolder`,{folder:this.folderCaption(r)}),``,void 0,$s)}else e.reason!==`auth`&&this.reportActionFailed(`toast.copyFailed`,`Could not copy that`)}else await this.copyKeys(a,r,o)}else if(t===`downloadMessage`&&!n){let e=`/mailboxes/${k(this.mailboxOf(r))}/messages/${r.UID}/raw`,t=document.createElement(`a`);t.href=e,t.download=``,document.body.appendChild(t),t.click(),document.body.removeChild(t)}else if(t===`showOriginal`&&!n){let e=`#/original?mailbox=${encodeURIComponent(this.mailboxOf(r))}&uid=${r.UID}`;window.open(e,`_blank`)}}finally{n&&(this.bulkProcessing=!1)}}async _confirmDelete(){this.showDeleteConfirm=!1;let e=this.pendingDeleteDetails;if(this.pendingDeleteDetails=null,!e)return;let{isBulk:t,doomed:n,toTrash:r,isDrafts:i,named:a,matching:o}=e,s=o?o.count>1:n.length>1;t&&(this.bulkProcessing=!0);try{if(o){let e=await H.deleteMatchingResult(this.currentMailbox,this.matchingScope);if(e.ok){let t=e.count??0;this.clearSelection(),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null);let n=i?s?this.i18nStore?.t(`toast.draftsDiscarded`,{count:t}):this.i18nStore?.t(`toast.draftDiscarded`):s?this.i18nStore?.t(`toast.messagesPermanentlyDeleted`,{count:t}):this.i18nStore?.t(`toast.messagePermanentlyDeleted`);this.showGlobalToast(n,``,void 0,$s)}else e.reason!==`auth`&&this.reportActionFailed(`toast.messageDeleteFailed`,`The message could not be deleted`);return}await z.afterWrites(async()=>{let e=t&&!a?this.takeRowsOut(n):void 0,{done:o,refused:c}=await this.eachFolder(n,(e,t)=>H.deleteMessagesResult(e,t));a?.done?.(!c);let l=this.writtenKeys(o);if(l.length>0){a?a.isOpen&&this.leaveDeletedMessage(a.nextUid,a.nextMailbox):(t&&(this.selectedKeys=new Set([...this.selectedKeys].filter(e=>!l.includes(e)))),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null));let e=``;e=i?s?this.i18nStore?.t(`toast.draftsDiscarded`,{count:l.length}):this.i18nStore?.t(`toast.draftDiscarded`):s?this.i18nStore?.t(`toast.messagesPermanentlyDeleted`,{count:l.length}):this.i18nStore?.t(`toast.messagePermanentlyDeleted`),this.showGlobalToast(e,``,void 0,$s)}if(c&&c.reason!==`auth`&&(this.reportActionFailed(`toast.messageDeleteFailed`,`The message could not be deleted`),e)){let t=new Set(l);e(l)?this.selectedKeys=new Set(n.filter(e=>!t.has(e))):z.sync()}if(r.length>0){let e=T(`trash`,this.mailboxes,x);await this.fileAway(r,e,t,n=>this.movedMessage(t||r.length>1,n,e))}})}finally{t&&(this.bulkProcessing=!1)}}get deleteDialogWords(){let e=e=>this.i18nStore?.t(e),t=this.pendingDeleteDetails,n=(t?.matching?.count??t?.doomed.length??0)>1;return t?.isDrafts?{title:e(n?`mailboxPage.discardDraftsTitle`:`floatingComposer.discardDraftTitle`),message:e(n?`mailboxPage.discardDraftsMessage`:`floatingComposer.discardDraftMessage`),confirm:e(`floatingComposer.discard`)}:{title:e(`mailboxPage.permanentlyDelete`),message:e(n?`messageReader.deleteConfirmMultiple`:`messageReader.deleteConfirmSingle`),confirm:e(`mailboxPage.deletePermanently`)}}_cancelDelete(){this.showDeleteConfirm=!1,this.pendingDeleteDetails=null}toggleFolder(e,t){t&&(t.stopPropagation(),t.preventDefault());let n=new Set(this.expandedFolders);n.has(e)?n.delete(e):n.add(e),this.expandedFolders=n}render(){let e=this.isMobile?`full`:this.layoutMode,t=e===`full`&&this.selectedMessage!==null;return b`
      <alps-initial-loader ?hidden=${!this.showInitialLoader}></alps-initial-loader>
      <app-header 
        .username=${this.username}
        .isMobile=${this.isMobile}
        .currentMailbox=${this.currentMailbox}
        .mailboxes=${this.mailboxes}
        .searchQuery=${this.filterQuery}
        .scrolled=${this.listScrolled}
        @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
        @compose=${()=>this.composeStore.openComposer()}
        @search-submit=${e=>{let t=e.detail.value,n=e.detail.global?`*`:this.currentMailbox;this.updateUrl(n,0,null,t)}}
      ></app-header>
      <div class="app-container layout-${e} ${t?`reading`:``} ${this.isPaneDragging||this.isSidebarDragging?`dragging`:``} ${this.sidebarCollapsed&&!this.isMobile?`collapsed`:``} ${this.isMobile?`mobile-view`:``}" style="${!this.sidebarCollapsed&&!this.isMobile?`--sidebar-width: ${this.sidebarWidth}px;`:``}">
        <alps-sidebar 
          class="${this.isMobile?`mobile-sidebar`:`desktop-sidebar`} ${this.mobileSidebarOpen?`open`:``}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
          .collapsed=${this.sidebarCollapsed&&!this.isMobile}
          .width=${this.sidebarWidth}
          @sidebar-resize=${e=>{let t=e.detail.newWidth;t<cc?(this.sidebarCollapsed||this.settingsStore.updateSettings({sidebarCollapsed:!0}),this.sidebarWidth=ac):(this.sidebarCollapsed&&this.settingsStore.updateSettings({sidebarCollapsed:!1}),this.sidebarWidth=Math.min(Math.max(t,180),oc),this.resizerPositionX=Math.max(this.resizerPositionX,this.sidebarWidth+lc))}}
          @drag-start=${()=>this.isSidebarDragging=!0}
          @drag-end=${()=>this.isSidebarDragging=!1}
          @toggle-collapse=${()=>this.settingsStore.updateSettings({sidebarCollapsed:!this.sidebarCollapsed})}
          @close-sidebar=${()=>this.mobileSidebarOpen=!1}
        >
          <alps-folder-list
            .mailboxes=${this.mailboxes}
            .currentMailbox=${this.currentMailbox}
            .expandedFolders=${this.expandedFolders}
            .layoutMode=${e}
            .syncing=${this.isSyncing}
            @select-mailbox=${e=>{this.currentMailbox===e.detail.name?(this.currentPage=0,this.selectedMessage=null,this.filterQuery=``,this.loadingMessages=!0,this.updateUrl(e.detail.name,0,null),z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)):(this.loadingMessages=!0,this.filterQuery=``,this.clearSelection(),this.updateUrl(e.detail.name,0,null)),Ra(this.renderRoot),this.isMobile&&(this.mobileSidebarOpen=!1)}}
            @toggle-folder=${e=>this.toggleFolder(e.detail.folderName,null)}
            @expand-folder=${e=>{let t=new Set(this.expandedFolders);t.add(e.detail.folderName),this.expandedFolders=t}}
            @compose=${()=>{this.composeStore.openComposer(),this.isMobile&&(this.mobileSidebarOpen=!1)}}
            @toast=${this._relayToast}
            @drop-messages=${this.handleDroppedMessages}
          ></alps-folder-list>
          <alps-icon-btn 
            slot="footer-actions"
            class="new-folder-btn"
            icon="folderPlus"
            title="${this.i18nStore?.t(`folderList.createFolder`)}"
            @click=${this.openFolderPrompt}
          ></alps-icon-btn>
        </alps-sidebar>
        <div class="main-view">
          <div class="pane message-list-pane" style="position: relative; ${e===`vertical`?`width: ${this.effectiveListWidth}px; flex: none; ${this.isPaneDragging||this.isSidebarDragging?``:`transition: width 0.2s;`}`:e===`horizontal`?`height: ${this.listHeight}px; flex: none;`:``}">

            <alps-message-list
              .messages=${this.messages}
              .currentMailbox=${this.currentMailbox}
              .currentMailboxRole=${ue(this.currentMailbox,this.mailboxes)||``}
              .listedMailbox=${this.listedMailbox}
              .listedUIDValidity=${this.listedUIDValidity}
              .listedMailboxRole=${ue(this.listedMailbox,this.mailboxes)||``}
              .mailboxes=${this.mailboxes}
              .sidebarCollapsed=${this.sidebarCollapsed&&!this.isMobile}
              .loading=${this.loadingMessages}
              .selectedMessage=${this.selectedMessage}
              .selectedMessages=${this.selectedKeys}
              .selectAllMatching=${this.selectAllMatching}
              .matchingCount=${this.selectionCount}
              .layoutMode=${e}
              .isMobile=${this.isMobile}
              .currentPage=${this.currentPage}
              .listedPage=${this.listedPage}
              .totalMessages=${this.totalMessages}
              .messagesPerPage=${this.messagesPerPage}
              .densityMode=${this.densityMode}
              .showSenderAvatars=${this.showSenderAvatars}
              .filterQuery=${this.filterQuery}
              .sortOrder=${this.sortOrder}
              .syncing=${this.isSyncing}
              .loadFailed=${this.listLoadFailed}
              .loadLimited=${this.listLoadLimited}
              @refresh=${()=>{this.listLoadFailed&&this.messages.length===0?z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0):(this.currentPage=0,z.check(this.currentMailbox,this.currentPage,this.filterQuery))}}
              @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
              @compose=${()=>this.composeStore.openComposer()}
              @toast=${this._relayToast}
              @select-message=${e=>this.selectMessage(e.detail.message)}
              @change-page=${e=>this.updateUrl(this.currentMailbox,e.detail.page,this.targetUid,void 0,this.targetMailbox)}
              @list-scrolled=${e=>this.listScrolled=e.detail.scrolled}
              @toggle-sort=${async()=>{let e=this.sortOrder===`asc`?`desc`:`asc`;this.messages=[],this.loadingMessages=!0,await this.settingsStore.updateSettings({sortOrder:e}),this.currentPage=0,z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)}}
              @toggle-filter-starred=${()=>{let e=this.filterQuery===`is:starred`?``:`is:starred`;this.updateUrl(this.currentMailbox,0,null,e)}}
              @toggle-filter-unread=${()=>{let e=this.filterQuery===`is:unread`?``:`is:unread`;this.updateUrl(this.currentMailbox,0,null,e)}}
              @clear-search=${()=>{let e=this.currentMailbox===`*`?w:this.currentMailbox;this.updateUrl(e,0,null,``)}}
              @search-submit=${e=>{let t=e.detail.value,n=e.detail.global?`*`:this.currentMailbox;this.updateUrl(n,0,null,t)}}
              @selection-changed=${e=>this.takeSelection(e.detail.selectedKeys)}
              @select-all-matching=${()=>this.selectAllInFolder()}
              @clear-selection=${()=>this.clearSelection()}
              @toggle-star-message=${this._handleListToggleStar}
            >
              <div slot="mobile-bulk-actions" class="mobile-bulk-actions-container">
                <alps-icon-btn title=${this.i18nStore?.t(`general.cancel`)||`Cancel`} @click=${()=>this.clearSelection()} icon="arrowLeft"></alps-icon-btn>
                <span class="mobile-bulk-actions-count">${this.selectionCount}</span>
                ${this.canArchiveHere?b`
                  <alps-icon-btn title=${this.i18nStore?.t(`messageReader.archive`)} @click=${()=>this._handleReaderAction(new CustomEvent(`action`,{detail:{action:`archive`}}))} icon="archiveBox"></alps-icon-btn>
                `:``}
                <alps-icon-btn title=${this.i18nStore?.t(`messageReader.delete`)} @click=${()=>this._handleReaderAction(new CustomEvent(`action`,{detail:{action:`delete`}}))} icon="trash"></alps-icon-btn>
                <div class="header-divider"></div>
                <alps-icon-btn title=${this.allSelectedUnread?this.i18nStore?.t(`messageReader.markRead`):this.i18nStore?.t(`messageReader.markUnread`)} @click=${()=>this._handleReaderAction(new CustomEvent(`action`,{detail:{action:`markUnread`}}))} icon=${this.allSelectedUnread?`envelopeOpen`:`envelopeUnread`}></alps-icon-btn>
                <alps-icon-btn title=${this.i18nStore?.t(`messageReader.star`)} @click=${()=>this._handleReaderAction(new CustomEvent(`action`,{detail:{action:`star`}}))} icon=${this.allSelectedStarred?`starFourFill`:`starFour`}></alps-icon-btn>
                <div class="header-divider"></div>
                <alps-folder-selector-popup
                  .mailboxes=${this.mailboxes}
                  .currentMailbox=${this.currentMailbox}
                  @folder-selected=${e=>this._handleReaderAction(new CustomEvent(`action`,{detail:{action:e.detail.isMove?`moveTo`:`copyTo`,folder:e.detail.folderName}}))}
                >
                  <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`messageReader.moveTo`)} icon="folderOpen"></alps-icon-btn>
                </alps-folder-selector-popup>
              </div>
            </alps-message-list>
          </div>
          ${e===`full`?``:b`
            <div class="resizer ${this.isPaneDragging?`dragging`:``}" @mousedown=${this.startResize}></div>
          `}
          <div class="pane message-reader-pane">
            <alps-message-reader
              .mailboxes=${this.mailboxes}
              .mailbox=${this.currentMailbox}
              .message=${this.selectedMessage}
              .messages=${this.messages}
              .layoutMode=${e}
              .selectedKeys=${this.selectedKeys}
              .selectedCount=${this.selectionCount}
              .allSelectedStarred=${this.allSelectedStarred}
              .allSelectedUnread=${this.allSelectedUnread}
              .commonTags=${this.commonSelectedTags}
              .bulkProcessing=${this.bulkProcessing}
              @close=${()=>{this.updateUrl(this.currentMailbox,this.currentPage,null)}}
              @action=${this._handleReaderAction}
              @message-flags-changed=${e=>this.updateLocalMessageFlags([R(e.detail.mailbox??this.currentMailbox,e.detail.uid)],e.detail.flag,e.detail.action)}
            ></alps-message-reader>
          </div>
        </div>
      </div>
      ${this.showDeleteConfirm?b`
        <ui-confirm
          heading=${this.deleteDialogWords.title}
          message=${this.deleteDialogWords.message}
          confirmText=${this.deleteDialogWords.confirm}
          cancelText=${this.i18nStore?.t(`general.cancel`)}
          .isDanger=${!0}
          @confirm=${this._confirmDelete}
          @cancel=${this._cancelDelete}
        ></ui-confirm>
      `:``}
    `}};N([s({context:ta})],X.prototype,`composeStore`,void 0),N([s({context:Be})],X.prototype,`settingsStore`,void 0),N([s({context:A})],X.prototype,`i18nStore`,void 0),N([d()],X.prototype,`showDeleteConfirm`,void 0),N([d()],X.prototype,`listLoadFailed`,void 0),N([d()],X.prototype,`listLoadLimited`,void 0),N([d()],X.prototype,`pendingDeleteDetails`,void 0),N([d()],X.prototype,`mailboxes`,void 0),N([d()],X.prototype,`messages`,void 0),N([d()],X.prototype,`currentMailbox`,void 0),N([d()],X.prototype,`loadingMessages`,void 0),N([d()],X.prototype,`showInitialLoader`,void 0),N([d()],X.prototype,`selectedMessage`,void 0),N([d()],X.prototype,`selectedKeys`,void 0),N([d()],X.prototype,`selectAllMatching`,void 0),N([d()],X.prototype,`excludedKeys`,void 0),N([d()],X.prototype,`layoutMode`,void 0),N([d()],X.prototype,`filterQuery`,void 0),N([d()],X.prototype,`expandedFolders`,void 0),N([d()],X.prototype,`username`,void 0),N([d()],X.prototype,`currentPage`,void 0),N([d()],X.prototype,`listedPage`,void 0),N([d()],X.prototype,`listedMailbox`,void 0),N([d()],X.prototype,`listedUIDValidity`,void 0),N([d()],X.prototype,`totalMessages`,void 0),N([d()],X.prototype,`messagesPerPage`,void 0),N([d()],X.prototype,`resizerPositionX`,void 0),N([d()],X.prototype,`listHeight`,void 0),N([d()],X.prototype,`isSidebarDragging`,void 0),N([d()],X.prototype,`isPaneDragging`,void 0),N([d()],X.prototype,`sidebarWidth`,void 0),N([d()],X.prototype,`densityMode`,void 0),N([d()],X.prototype,`showSenderAvatars`,void 0),N([d()],X.prototype,`isSyncing`,void 0),N([d()],X.prototype,`sidebarCollapsed`,void 0),N([d()],X.prototype,`sortOrder`,void 0),N([d()],X.prototype,`listScrolled`,void 0),N([d()],X.prototype,`targetUid`,void 0),N([d()],X.prototype,`targetMailbox`,void 0),N([d()],X.prototype,`isMobile`,void 0),N([d()],X.prototype,`mobileSidebarOpen`,void 0),N([d()],X.prototype,`bulkProcessing`,void 0),N([d()],X.prototype,`computedMinListWidth`,void 0),X=N([o(`mailbox-page`)],X);function mc(e){return(e??[]).flatMap(e=>e.group??[e]).map(e=>({name:e.name,email:e.address}))}async function hc(e){let t=await new Ct().parse(e),n=`default`,r=t.headers?.find(e=>e.key.toLowerCase()===`bimi-selector`);if(r){let e=r.value.match(/s=([^;\s]+)/i);e&&(n=e[1].trim())}let i=t.from?.address||``,a={messageId:t.messageId||``,date:t.date||``,from:mc(t.from?[t.from]:[]),fromAddress:i,to:mc(t.to),subject:t.subject||``,spf:`none`,spfDetail:``,dkim:`none`,dkimDetail:``,dmarc:`none`,dmarcDetail:``,bimiSelector:n,hasBimiPotential:!1},o=t.headers?.filter(e=>e.key.toLowerCase()===`authentication-results`)||[];if(o.length>0){let e=o[0].value.replace(/\s+/g,` `),t=e.toLowerCase(),n=``,r=t.match(/smtp\.(?:remote|client)-ip=([0-9a-f\.:]+)/)||t.match(/designates ([0-9a-f\.:]+) as permitted sender/);r&&(n=r[1]);let i=e.split(`;`);for(let e of i){let t=e.trim().toLowerCase();if(t.startsWith(`spf=`)){if(a.spf=t.split(`=`)[1].split(` `)[0],n)a.spfDetail=`with IP address ${n}`;else{let e=t.match(/smtp\.mailfrom=([^ \t]+)/)||t.match(/smtp\.helo=([^ \t]+)/);e&&(a.spfDetail=`with ${e[1]}`)}}else if(t.startsWith(`dkim=`)){a.dkim=t.split(`=`)[1].split(` `)[0];let e=t.match(/header\.d=([^ \t]+)/);e&&(a.dkimDetail=`with domain ${e[1]}`)}else if(t.startsWith(`dmarc=`)){a.dmarc=t.split(`=`)[1].split(` `)[0];let e=t.match(/header\.from=([^ \t]+)/);e&&(a.dmarcDetail=`with domain ${e[1]}`)}}}return a.hasBimiPotential=a.dmarc===`pass`&&!!a.fromAddress,a}var gc=class extends c{constructor(...e){super(...e),this.rawText=``,this.parsedHeaders=null,this.loading=!0,this.error=``,this.mailbox=``,this.uid=``,this.isTruncated=!1,this._handleStoreChange=()=>{this.requestUpdate()},this.MAX_DISPLAY_SIZE=65536}static{this.styles=[j,y`
    :host {
      display: block;
      height: 100vh;
      overflow: auto;
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #000);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 24px;
      font-weight: 600;
    }
    .metadata-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      background: var(--bg-secondary, #f9fafb);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      overflow: hidden;
    }
    .metadata-table th,
    .metadata-table td {
      padding: 12px 16px;
      text-align: start;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      font-size: 14px;
    }
    .metadata-table th {
      width: 150px;
      font-weight: 600;
      color: var(--text-secondary, #4b5563);
      background: var(--bg-tertiary, #f3f4f6);
    }
    .metadata-table tr:last-child th,
    .metadata-table tr:last-child td {
      border-bottom: none;
    }
    .auth-pass { color: #059669; font-weight: 600; }
    .auth-fail { color: #dc2626; font-weight: 600; }
    .auth-none { color: var(--text-muted, #9ca3af); }

    .actions {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .raw-content {
      background: var(--bg-secondary, #f9fafb);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--border-color, #e5e7eb);
      overflow-x: auto;
      font-family: var(--font-mono);
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
    }
    alps-banner {
      position: static;
      margin-bottom: 24px;
      border-radius: 4px;
      overflow: hidden;
    }
    .auth-status-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .auth-status-detail {
      color: var(--text-muted, #6b7280);
      font-size: 13px;
    }
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 12px;
      color: var(--text-muted, #6b7280);
      font-size: 14px;
    }
    .spinner {
      animation: spin 3s linear infinite;
      display: flex;
    }
    .spinner svg {
      width: 32px;
      height: 32px;
      fill: currentColor;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]}connectedCallback(){super.connectedCallback(),this.extractParams(),this.mailbox&&this.uid?this.fetchOriginal():(this.error=this.i18nStore?.t(`originalMessage.errorMissingParams`),this.loading=!1),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}extractParams(){let e=window.location.hash,t=e.indexOf(`?`);if(t!==-1){let n=new URLSearchParams(e.substring(t+1));this.mailbox=n.get(`mailbox`)||``,this.uid=n.get(`uid`)||``}}async fetchOriginal(){try{this.loading=!0;let e=await F(`/mailboxes/${k(this.mailbox)}/messages/${this.uid}/raw?limit=${this.MAX_DISPLAY_SIZE}`);if(!e.ok){if(e.status===401){window.location.hash=`#/login`;return}throw Error(this.i18nStore?.t(`originalMessage.errorFailedToFetch`))}this.rawText=await e.text(),this.rawText.length>=this.MAX_DISPLAY_SIZE&&(this.isTruncated=!0),this.parsedHeaders=await hc(this.rawText)}catch(e){this.error=e.message}finally{this.loading=!1}}copyToClipboard(){navigator.clipboard.writeText(this.rawText).then(()=>{alert(this.isTruncated?this.i18nStore?.t(`originalMessage.copiedTruncated`):this.i18nStore?.t(`originalMessage.copied`))}).catch(e=>{E.error(`Failed to copy: `,e),alert(this.i18nStore?.t(`originalMessage.copyFailed`))})}renderAuthStatus(e,t){e=e.toLowerCase();let n=b`<span class="auth-none">${this.i18nStore?.t(`originalMessage.none`)}</span>`;return e===`pass`?n=b`<span class="auth-pass">${this.i18nStore?.t(`originalMessage.pass`)}</span>`:e===`fail`&&(n=b`<span class="auth-fail">${this.i18nStore?.t(`originalMessage.fail`)}</span>`),b`
      <div class="auth-status-container">
        ${n}
        ${t?b`<span class="auth-status-detail">${t}</span>`:``}
      </div>
    `}render(){if(this.loading)return b`
        <div class="loading-state">
          <alps-loader></alps-loader>
          <span>${this.i18nStore?.t(`originalMessage.loading`)}</span>
        </div>
      `;if(this.error)return b`
        <div class="container">
          <alps-banner>
            ${this.error}
          </alps-banner>
        </div>
      `;let e=`/mailboxes/${k(this.mailbox)}/messages/${this.uid}/raw`;return b`
      <div class="container">
        <h1>${this.i18nStore?.t(`originalMessage.title`)}</h1>
        
        ${this.parsedHeaders?b`
          <table class="metadata-table">
            <tbody>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.messageId`)}</th>
                <td>${this.parsedHeaders.messageId}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.createdAt`)}</th>
                <td>${this.parsedHeaders.date}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.from`)}</th>
                <td>${Pe(this.parsedHeaders.from)}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.to`)}</th>
                <td>${Pe(this.parsedHeaders.to)}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.subject`)}</th>
                <td>${this.parsedHeaders.subject}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.spf`)}</th>
                <td>${this.renderAuthStatus(this.parsedHeaders.spf,this.parsedHeaders.spfDetail)}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.dkim`)}</th>
                <td>${this.renderAuthStatus(this.parsedHeaders.dkim,this.parsedHeaders.dkimDetail)}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.dmarc`)}</th>
                <td>${this.renderAuthStatus(this.parsedHeaders.dmarc,this.parsedHeaders.dmarcDetail)}</td>
              </tr>
            </tbody>
          </table>
        `:``}

        ${this.isTruncated?b`
          <alps-banner>
            ${this.i18nStore?.t(`originalMessage.truncatedInfo`)}
          </alps-banner>
        `:``}

        <div class="actions">
          <alps-button variant="primary" icon="downloadSimple" @click=${()=>{let t=document.createElement(`a`);t.href=e,t.download=`original_message.eml`,t.click()}}>
            ${this.i18nStore?.t(`originalMessage.downloadOriginal`)}
          </alps-button>
          ${this.isTruncated?``:b`
            <alps-button variant="normal" icon="copy" @click=${this.copyToClipboard}>
              ${this.i18nStore?.t(`originalMessage.copyClipboard`)}
            </alps-button>
          `}
        </div>

        <pre class="raw-content" dir="ltr">${this.rawText}</pre>
      </div>
    `}};N([d()],gc.prototype,`rawText`,void 0),N([d()],gc.prototype,`parsedHeaders`,void 0),N([d()],gc.prototype,`loading`,void 0),N([d()],gc.prototype,`error`,void 0),N([d()],gc.prototype,`mailbox`,void 0),N([d()],gc.prototype,`uid`,void 0),N([d()],gc.prototype,`isTruncated`,void 0),N([s({context:A})],gc.prototype,`i18nStore`,void 0),gc=N([o(`original-message-page`)],gc);var Z=class extends c{constructor(...e){super(...e),this.loading=!0,this.error=``,this.mailbox=``,this.uid=``,this.message=null,this.content=``,this.rawMessageHtml=``,this.mimeType=`text/plain`,this.hasRemoteResources=!1,this.allowRemoteResources=!1,this.printTriggered=!1}static{this.styles=[j,y`
    :host {
      display: block;
      min-height: 100vh;
      background: #fff;
      color: #000;
      font-family: Arial, sans-serif;
    }
    .print-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }
    .print-header {
      margin-bottom: 24px;
      text-align: start;
    }
    .print-header h2 {
      font-size: 20px;
      font-weight: normal;
      margin: 0 0 12px 0;
      color: #222;
    }
    .print-divider {
      border-bottom: 1px solid #ddd;
      margin-bottom: 12px;
    }
    .print-meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .print-date {
      color: #666;
      margin-inline-start: 16px;
      text-align: end;
      min-width: 150px;
    }
    .print-to-row {
      font-size: 13px;
      color: #444;
    }
    .print-cc {
      margin-top: 4px;
    }
    .print-divider-thick {
      border-bottom: 1px solid #eee;
      margin-top: 24px;
      margin-bottom: 24px;
    }
    .print-body {
      font-size: 14px;
    }
    .print-iframe {
      width: 100%;
      border: none;
      overflow: visible;
      display: block;
    }
    .loading-state, .error-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: var(--text-muted, #6b7280);
      font-size: 14px;
      gap: 12px;
    }
    .error-state {
      color: #dc2626;
      flex-direction: column;
    }
    .spinner {
      animation: spin 3s linear infinite;
      display: flex;
    }
    .spinner svg {
      width: 32px;
      height: 32px;
      fill: currentColor;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @media print {
      body { padding: 0 !important; margin: 0 !important; }
      .print-container { padding: 0; max-width: none; }
      alps-banner { display: none !important; }
    }
  `]}connectedCallback(){super.connectedCallback(),this.allowRemoteResources=this.settingsStore.getState().showRemoteContent===`always`,this.extractParams(),this.mailbox&&this.uid?this.fetchMessage():(this.error=`Missing mailbox or uid parameters`,this.loading=!1)}extractParams(){let e=window.location.hash,t=e.indexOf(`?`);if(t!==-1){let n=new URLSearchParams(e.substring(t+1));this.mailbox=n.get(`mailbox`)||``,this.uid=n.get(`uid`)||``,n.get(`remote`)===`1`&&(this.allowRemoteResources=!0)}}async fetchMessage(){try{this.loading=!0;let e=[q.get(this.mailbox,this.uid,`html`),q.get(this.mailbox,this.uid,`text`)].find(e=>!!e&&!!e.Part&&(e.RawHtml!==void 0||e.RawText!==void 0));if(e){this.message=e.Message,this.mimeType=e.Part.MIMEType||e.Part.MimeType||`text/plain`,e.RawHtml===void 0?e.RawText!==void 0&&(this.content=e.RawText):(this.rawMessageHtml=e.RawHtml,this.hasRemoteResources=!1,this.content=yi(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})),this.loading=!1;return}let t=await F(`/mailboxes/${k(this.mailbox)}/messages/${this.uid}?view=html`);if(!t.ok){if(t.status===401){window.location.hash=`#/login`;return}throw Error(`Failed to fetch message metadata`)}let n=await t.json();this.message=n.Message,n.Part&&typeof n.Body==`string`?(this.mimeType=n.Part.MIMEType||n.Part.MimeType||`text/plain`,this.mimeType.toLowerCase()===`text/html`?(this.rawMessageHtml=n.Body,this.hasRemoteResources=!1,this.content=yi(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})):this.content=n.Body):await this.fetchMessageBody(n.Part)}catch(e){this.error=e.message}finally{this.loading=!1}}async fetchMessageBody(e){if(!e){this.mimeType=`multipart/mixed`,this.content=``;return}this.mimeType=e.MIMEType||e.MimeType||`text/plain`;let t=Array.isArray(e.Path)&&e.Path.length?e.Path.join(`.`):`1`,n=await F(`/mailboxes/${k(this.mailbox)}/messages/${this.uid}/raw?part=${t}&text=1`);if(!n.ok)throw Error(`Failed to fetch message body`);this.mimeType.toLowerCase()===`text/html`?(this.rawMessageHtml=await n.text(),this.hasRemoteResources=!1,this.content=yi(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})):this.content=await n.text()}loadRemoteResources(){this.allowRemoteResources=!0,this.printTriggered=!1,this.rawMessageHtml&&(this.content=yi(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message?.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}}))}updated(e){this.loading||this.error||!this.message||this.mimeType?.toLowerCase()!==`text/html`&&(this.printTriggered||(this.printTriggered=!0,setTimeout(()=>{this.isConnected&&window.print()},500)))}onPrintIframeLoad(e){let t=e.target;try{let e=t.contentDocument;e&&e.body&&(t.style.height=`${e.body.scrollHeight}px`)}catch{}this.printTriggered||(this.printTriggered=!0,setTimeout(()=>{this.isConnected&&window.print()},300))}render(){if(this.loading)return b`
        <div class="loading-state">
          <alps-loader></alps-loader>
          <span>${this.i18nStore?.t(`print.loading`)}</span>
        </div>
      `;if(this.error)return b`
        <div class="error-state">
          <div>${P(`warning`)}</div>
          <span>${this.error}</span>
        </div>
      `;let e=this.message;if(!e)return b``;let t=e.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`),n=e.Envelope?.From?.[0]||{},i=n.Mailbox&&n.Host?`${n.Mailbox}@${n.Host}`:``,a=n.Name||i?Ve(n.Name,i):this.i18nStore?.t(`messageList.unknownSender`),o=this.settingsStore?.getState()?.dateFormat||`auto`,s=String(this.settingsStore?.getState()?.hourFormat||`auto`),c=e.Envelope?.Date?xe(e.Envelope.Date,o,s):``,l=e=>Pe(e.map(e=>({name:e.Name,email:`${e.Mailbox}@${e.Host}`}))),u=e.Envelope?.To&&e.Envelope.To.length>0?l(e.Envelope.To):this.i18nStore?.t(`messageReader.undisclosed`),d=b``;if(e.Envelope?.Cc&&e.Envelope.Cc.length>0){let t=l(e.Envelope.Cc);d=b`<div class="print-cc"><strong>${this.i18nStore?.t(`messageReader.cc`)}</strong> ${t}</div>`}let f;return f=this.mimeType?.toLowerCase()===`text/html`?b`<iframe
        class="print-iframe"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        .srcdoc=${r(this.content)}
        @load=${this.onPrintIframeLoad}
      ></iframe>`:this.mimeType?.toLowerCase().startsWith(`multipart/`)?b`<div style="font-style: italic; color: #666;">${this.i18nStore?.t(`messageReader.noReadableText`)}</div>`:b`<pre dir="auto" style="unicode-bidi: plaintext; white-space: pre-wrap; font-family: inherit; margin: 0;">${this.content}</pre>`,b`
      ${this.hasRemoteResources&&!this.allowRemoteResources?b`
        <alps-banner>
          <span>${this.i18nStore.t(`messageReader.remoteContentWarning`)}</span>
          <alps-button slot="action" variant="normal" @click=${this.loadRemoteResources}>
            ${this.i18nStore.t(`messageReader.loadRemoteContent`)}
          </alps-button>
        </alps-banner>
      `:``}
      <div class="print-container">
        <div class="print-header">
          <h2><bdi>${t}</bdi></h2>
          <div class="print-divider"></div>
          <div class="print-meta-row">
            <div><strong>${a}</strong> ${n.Name&&i?b`&lt;${Re(i)}&gt;`:``}</div>
            <div class="print-date">${c}</div>
          </div>
          <div class="print-to-row">
            <strong>${this.i18nStore?.t(`messageReader.to`)}</strong> ${u}
            ${d}
          </div>
          <div class="print-divider-thick"></div>
        </div>
        <div class="print-body">
          ${f}
        </div>
      </div>
    `}};N([s({context:Be})],Z.prototype,`settingsStore`,void 0),N([s({context:A})],Z.prototype,`i18nStore`,void 0),N([d()],Z.prototype,`loading`,void 0),N([d()],Z.prototype,`error`,void 0),N([d()],Z.prototype,`mailbox`,void 0),N([d()],Z.prototype,`uid`,void 0),N([d()],Z.prototype,`message`,void 0),N([d()],Z.prototype,`content`,void 0),N([d()],Z.prototype,`rawMessageHtml`,void 0),N([d()],Z.prototype,`mimeType`,void 0),N([d()],Z.prototype,`hasRemoteResources`,void 0),N([d()],Z.prototype,`allowRemoteResources`,void 0),Z=N([o(`print-page`)],Z);function _c(e){if(!e)throw Error(`base64url is null or undefined`);let t=e.replace(/-/g,`+`).replace(/_/g,`/`),n=atob(t),r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);return r.buffer}function vc(e){let t=new Uint8Array(e),n=``;for(let e=0;e<t.byteLength;e++)n+=String.fromCharCode(t[e]);return btoa(n).replace(/\+/g,`-`).replace(/\//g,`_`).replace(/=/g,``)}async function yc(e){e.publicKey.challenge=_c(e.publicKey.challenge),e.publicKey.user.id=_c(e.publicKey.user.id),e.publicKey.excludeCredentials&&(e.publicKey.excludeCredentials=e.publicKey.excludeCredentials.map(e=>({...e,id:_c(e.id)})));let t=await navigator.credentials.create(e);if(!t)throw Error(`Credential creation failed or was cancelled.`);let n=t.response,r=n.getTransports?n.getTransports():[];return{id:t.id,rawId:vc(t.rawId),type:t.type,response:{attestationObject:vc(n.attestationObject),clientDataJSON:vc(n.clientDataJSON)},transports:r}}var bc=class extends Error{constructor(){super(`The authentication options cannot be used.`),this.name=`InvalidOptionsError`}};function xc(e){if(typeof e!=`string`||!/^[A-Za-z0-9_-]+={0,2}$/.test(e))throw new bc;return _c(e)}async function Sc(e){try{e.publicKey.challenge=xc(e.publicKey.challenge),e.publicKey.allowCredentials&&(e.publicKey.allowCredentials=e.publicKey.allowCredentials.map(e=>({...e,id:xc(e.id)})))}catch{throw new bc}let t=await navigator.credentials.get(e);if(!t)throw new DOMException(`No credential was returned.`,`NotAllowedError`);let n=t.response;return{id:t.id,rawId:vc(t.rawId),type:t.type,response:{authenticatorData:vc(n.authenticatorData),clientDataJSON:vc(n.clientDataJSON),signature:vc(n.signature),userHandle:n.userHandle?vc(n.userHandle):null}}}function Cc(){return window.PublicKeyCredential!==void 0&&navigator.credentials!==void 0}async function wc(e,t={}){let n;try{n=await fetch(e,{...t,method:`POST`})}catch{return null}let r=null;try{r=await n.json()}catch{r=null}return{ok:n.ok,status:n.status,body:r}}var Tc=e=>e.status>=500||e.ok&&e.body===null,Ec=class extends c{constructor(...e){super(...e),this.statusMessage=``,this.statusType=`info`,this.isLoading=!1,this.isSuccess=!1,this.usingCode=!1,this.recoveryCodesAvailable=!0,this.code=``,this.codeBusy=!1,this._handleI18nChange=()=>{this.requestUpdate()},this._verification=null}static{this.styles=y`
    .status {
      margin-bottom: 24px;
      padding: 8px 12px;
      border-radius: var(--radius-md, 6px);
      font-size: 14px;
      text-align: center;
    }
    
    /* The theme defines --error / --success / --accent-color. There has never
       been a --color-* family, nor any -muted variant, so every declaration in
       this block resolved to nothing: the status banner on the second-factor
       screen — the element that tells the user whether their security key
       worked — rendered with no background, no border and inherited text. */
    .status.error {
      background: color-mix(in srgb, var(--error, #ef4444) 12%, transparent);
      color: var(--error, #ef4444);
      border: 1px solid color-mix(in srgb, var(--error, #ef4444) 30%, transparent);
    }
    
    .status.info {
      background: color-mix(in srgb, var(--accent-color, #2563eb) 12%, transparent);
      color: var(--accent-color, #2563eb);
      border: 1px solid color-mix(in srgb, var(--accent-color, #2563eb) 30%, transparent);
    }
    
    .status.success {
      background: color-mix(in srgb, var(--success, #16a34a) 12%, transparent);
      color: var(--success, #16a34a);
      border: 1px solid color-mix(in srgb, var(--success, #16a34a) 30%, transparent);
    }

    .code-label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary, #111827);
    }

    /* As the login form's fields. A code is written left to right in every
       language. */
    .code-input {
      width: 100%;
      height: 36px;
      padding: 0 12px;
      background: var(--alps-input-bg, var(--bg-primary, #ffffff));
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--input-radius, 6px);
      color: var(--text-primary, #111827);
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: var(--input-font-size, 14px);
      box-sizing: border-box;
      outline: none;
    }

    .code-input:focus {
      border-color: var(--accent-color, #005A9E);
      box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
      outline: 2px solid transparent;
    }
    

  `}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),Cc()?this._autoVerify=setTimeout(()=>{this._handleVerify()},300):(this.statusMessage=this.i18nStore?.t(`webauthn.not_supported`),this.statusType=`error`)}disconnectedCallback(){super.disconnectedCallback(),this._cancelVerification(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}_cancelVerification(){clearTimeout(this._autoVerify),clearTimeout(this._completeLogin),this._verification?.abort(),this._verification=null,this.isLoading=!1,this.isSuccess=!1}_backToLogin(){this._cancelVerification(),window.location.hash=`#/login`}_backToPassword(){try{sessionStorage.removeItem(`pending_2fa_username`),sessionStorage.removeItem(`pending_2fa_is_switch`)}catch{}ia(`secondFactorExpired`),this._backToLogin()}async _handleVerify(){if(clearTimeout(this._autoVerify),!this.isConnected||this.isLoading||this.isSuccess)return;let e=new AbortController;this._verification=e;let t=()=>this.isConnected&&this._verification===e&&!e.signal.aborted;this.isLoading=!0,this.statusMessage=this.i18nStore?.t(`webauthn.requesting`),this.statusType=`info`;try{let n=await wc(`/webauthn/verify/begin`,{signal:e.signal});if(!t())return;if(n===null)throw Error(this.i18nStore?.t(`login.networkError`));if(n.status===401)return this._backToPassword();if(Tc(n))throw Error(this.i18nStore?.t(`webauthn.errors.unavailable`));if(!n.ok)throw Error(this.i18nStore?.t(`webauthn.errors.begin_failed`));let r=n.body;if(this.recoveryCodesAvailable=n.body?.recoveryCodesAvailable!==!1,!r||!r.publicKey)throw Error(this.i18nStore?.t(`webauthn.errors.invalid_options`));this.statusMessage=this.i18nStore?.t(`webauthn.waiting_for_key`);let i=await Sc({...r,signal:e.signal});if(!t())return;this.statusMessage=this.i18nStore?.t(`webauthn.verifying`);let a=await wc(`/webauthn/verify/finish`,{signal:e.signal,headers:{"Content-Type":`application/json`},body:JSON.stringify(i)});if(!t())return;if(a===null)throw Error(this.i18nStore?.t(`login.networkError`));if(a.status===401)return this._backToPassword();if(Tc(a))throw Error(this.i18nStore?.t(`webauthn.errors.unavailable`));let o=a.body;if(a.ok&&o?.success)this._signedIn(o,t);else throw Error(this.i18nStore?.t(`webauthn.errors.verification_failed`))}catch(e){if(!t())return;this.statusMessage=e?.name===`NotAllowedError`||e?.name===`AbortError`?this.i18nStore?.t(`webauthn.errors.cancelled`):e instanceof bc?this.i18nStore?.t(`webauthn.errors.invalid_options`):e instanceof DOMException?this.i18nStore?.t(`webauthn.errors.general`):e.message||this.i18nStore?.t(`webauthn.errors.general`),this.statusType=`error`}finally{t()&&(this.isLoading=!1)}}_signedIn(e,t){this.statusMessage=this.i18nStore?.t(`webauthn.success`),this.statusType=`success`,this.isSuccess=!0;let n=!1;try{n=sessionStorage.getItem(`pending_2fa_is_switch`)===`1`,sessionStorage.removeItem(`pending_2fa_is_switch`)}catch{}let r=e.username;if(r)try{sessionStorage.removeItem(`pending_2fa_username`)}catch{}else try{r=sessionStorage.getItem(`pending_2fa_username`)||``,sessionStorage.removeItem(`pending_2fa_username`)}catch{}this._completeLogin=setTimeout(()=>{if(t()&&(window.dispatchEvent(new CustomEvent(`user-logged-in`,{detail:{username:r}})),window.location.hash=`/mailbox/INBOX`,n&&typeof window.location.reload==`function`))try{window.location.reload()}catch{}},500)}_useCode(){this._cancelVerification(),this.usingCode=!0,this.statusMessage=``,this.updateComplete.then(()=>this.renderRoot.querySelector(`#recovery-code`)?.focus())}_useKey(){this.usingCode=!1,this.code=``,this.statusMessage=``,this._handleVerify()}_codeError(e){this.statusMessage=this.i18nStore?.t(e),this.statusType=`error`}async _submitCode(e){if(e?.preventDefault(),this.codeBusy||this.isSuccess)return;let t=this.code.trim();if(!t)return this._codeError(`webauthn.recovery.code_required`);this.codeBusy=!0,this.statusMessage=this.i18nStore?.t(`webauthn.verifying`),this.statusType=`info`;try{let e=await wc(`/webauthn/verify/recovery`,{headers:{"Content-Type":`application/json`},body:JSON.stringify({code:t})});if(!this.isConnected||!this.usingCode)return;if(e===null)return this._codeError(`login.networkError`);if(e.status===401)return this._backToPassword();if(e.status===429)return this._codeError(`webauthn.errors.rate_limited`);if(e.body?.error===`recovery_unavailable`)return this._codeError(`webauthn.recovery.unavailable`);if(Tc(e))return this._codeError(`webauthn.errors.unavailable`);if(e.ok&&e.body?.success)return this._signedIn(e.body,()=>this.isConnected);this._codeError(e.body?.error===`code_required`?`webauthn.recovery.code_required`:`webauthn.recovery.wrong_code`)}finally{this.codeBusy=!1}}_renderCode(){return b`
      <form @submit=${this._submitCode}>
        <label class="code-label" for="recovery-code">${this.i18nStore?.t(`webauthn.recovery.code_label`)}</label>
        <input
          id="recovery-code"
          class="code-input"
          type="text"
          dir="ltr"
          autocomplete="one-time-code"
          autocapitalize="none"
          spellcheck="false"
          .value=${this.code}
          ?disabled=${this.isSuccess}
          @input=${e=>this.code=e.target.value}
        />
      </form>

      <alps-button
        variant="primary"
        full-width
        style="height: 36px; margin-top: 16px;"
        @click=${()=>this._submitCode()}
        ?disabled=${this.codeBusy||this.isSuccess}
        ?spinning=${this.codeBusy}
      >
        ${this.i18nStore?.t(`login.signIn`)}
      </alps-button>

      <alps-button
        variant="text"
        full-width
        style="height: 36px; margin-top: 8px;"
        @click=${this._useKey}
        ?disabled=${this.codeBusy||this.isSuccess}
      >
        ${this.i18nStore?.t(`webauthn.recovery.use_key`)}
      </alps-button>
    `}render(){return b`
      <alps-auth-card
        icon="fingerprint"
        title="${this.i18nStore?.t(`webauthn.title`)}"
        subtitle="${this.i18nStore?.t(this.usingCode?`webauthn.recovery.instruction`:`webauthn.instruction`)}"
        style="--auth-card-icon-color: var(--accent-color, #2563eb); --auth-card-icon-size: 64px;"
      >
        ${this.statusMessage?b`
          <div class="status ${this.statusType}">
            ${this.statusMessage}
          </div>
        `:``}
        
        ${this.usingCode?this._renderCode():b`
          <alps-button 
            variant="primary"
            full-width
            style="height: 36px; margin-top: 4px;"
            @click=${this._handleVerify} 
            ?disabled=${this.isLoading||this.isSuccess||!Cc()}
            ?spinning=${this.isLoading}
          >
            ${this.isLoading?this.i18nStore?.t(`webauthn.verifying_btn`):this.i18nStore?.t(`webauthn.verify_btn`)}
          </alps-button>

          <!-- The way in when the key is not at hand. Offered while a
               ceremony runs too: the browser's prompt may wait for a key
               that never comes. -->
          ${this.recoveryCodesAvailable?b`
          <alps-button
            variant="text"
            full-width
            style="height: 36px; margin-top: 8px;"
            @click=${this._useCode}
            ?disabled=${this.isSuccess}
          >
            ${this.i18nStore?.t(`webauthn.use_recovery_code`)}
          </alps-button>
          `:``}
        `}
        
        <alps-button 
          variant="text"
          full-width
          style="height: 36px; margin-top: 8px;"
          @click=${this._backToLogin}
        >
          ← ${this.i18nStore?.t(`webauthn.back_to_login`)}
        </alps-button>
      </alps-auth-card>
    `}};N([s({context:A})],Ec.prototype,`i18nStore`,void 0),N([d()],Ec.prototype,`statusMessage`,void 0),N([d()],Ec.prototype,`statusType`,void 0),N([d()],Ec.prototype,`isLoading`,void 0),N([d()],Ec.prototype,`isSuccess`,void 0),N([d()],Ec.prototype,`usingCode`,void 0),N([d()],Ec.prototype,`recoveryCodesAvailable`,void 0),N([d()],Ec.prototype,`code`,void 0),N([d()],Ec.prototype,`codeBusy`,void 0),Ec=N([o(`login-webauthn-page`)],Ec);var Dc=class extends c{constructor(...e){super(...e),this.show=!1,this.message=``,this.actionLabel=``,this.timeout=0,this._timer=null}disconnectedCallback(){super.disconnectedCallback(),this._timer&&=(clearTimeout(this._timer),null)}connectedCallback(){super.connectedCallback(),this.hasUpdated&&this.startTimer()}startTimer(){if(this._timer&&clearTimeout(this._timer),this._timer=null,this.show&&this.timeout>0){let e=this.expiresAt===void 0?this.timeout:Math.max(0,this.expiresAt-Date.now());this._timer=setTimeout(()=>this.dismiss(),e)}}updated(e){e.has(`show`)&&this.startTimer()}dismiss(){this.onDismiss&&this.onDismiss(),this.close()}close(){this.show=!1,this.dispatchEvent(new CustomEvent(`dismiss`)),this.onAction=void 0,this.onDismiss=void 0}handleAction(){if(this.onAction){if(this.onAction()===!1)return}else this.dispatchEvent(new CustomEvent(`action`));this.close()}static{this.styles=[j,y`
    :host {
      display: block;
      max-width: calc(100vw - 48px);
      transform: translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    :host([show]) {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .toast-container {
      background: var(--toast-bg, rgba(0, 0, 0, 0.85));
      color: var(--toast-fg, #fff);
      border: 1px solid var(--toast-border, rgba(255, 255, 255, 0.1));
      border-radius: 6px;
      padding-block: 0;
      padding-inline: 16px 4px;
      min-height: 36px;
      box-sizing: border-box;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: normal;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    .toast-container > span {
      min-width: 0;
      padding: 6px 0;
      overflow-wrap: anywhere;
    }

    .toast-container > alps-button,
    .toast-container > alps-icon-btn {
      flex-shrink: 0;
    }

    /* Action button is now an alps-button and styled via custom properties inline */
  `]}render(){return b`
      <div class="toast-container">
        <span>${this.message}</span>
        ${this.actionLabel?b`
          <alps-button 
            variant="normal" 
            @click=${this.handleAction}
            style="--text-primary: var(--toast-fg, #fff); --border-color: currentColor; --bg-tertiary: rgba(255, 255, 255, 0.15); --btn-padding: 4px 10px; --btn-font-size: 12px;"
          >
            ${this.actionLabel}
          </alps-button>
        `:``}
        <!-- Named by its title, which alps-icon-btn passes on to its button; an
             aria-label would stay on this element, which is no control. -->
        <alps-icon-btn 
          class="dismiss-btn" 
          icon="x" 
          title="${this.i18nStore?.t(`toast.dismiss`)}" 
          @click=${this.dismiss}
          style="--btn-color: var(--toast-fg, rgba(255, 255, 255, 0.7)); --btn-hover-bg: rgba(255, 255, 255, 0.15); --text-primary: var(--toast-fg, #fff); --btn-icon-size: 16px;"
        ></alps-icon-btn>
      </div>
    `}};N([s({context:A})],Dc.prototype,`i18nStore`,void 0),N([_({type:Boolean,reflect:!0})],Dc.prototype,`show`,void 0),N([_({type:String})],Dc.prototype,`message`,void 0),N([_({type:String})],Dc.prototype,`actionLabel`,void 0),N([_({type:Object})],Dc.prototype,`onAction`,void 0),N([_({type:Object})],Dc.prototype,`onDismiss`,void 0),N([_({type:Number})],Dc.prototype,`timeout`,void 0),N([_({type:Number})],Dc.prototype,`expiresAt`,void 0),Dc=N([o(`alps-toast`)],Dc);var Oc=class extends c{constructor(...e){super(...e),this.active=!1,this.icon=``,this.handleKeyDown=e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),e.key===` `&&e.repeat||this.click())}}connectedCallback(){super.connectedCallback(),this.hasAttribute(`role`)||this.setAttribute(`role`,`button`),this.hasAttribute(`tabindex`)||(this.tabIndex=0),this.addEventListener(`keydown`,this.handleKeyDown)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(`keydown`,this.handleKeyDown)}updated(e){e.has(`active`)&&(this.active?this.setAttribute(`aria-current`,`true`):this.removeAttribute(`aria-current`))}static{this.styles=[j,y`
    :host {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      margin: 2px 12px;
      cursor: pointer;
      border-radius: 6px;
      color: var(--text-secondary);
      font-weight: 500;
      transition: background 0.15s;
      user-select: none;
      white-space: nowrap;
      overflow: hidden;
    }

    .category-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      margin-inline-end: 12px;
      opacity: 0.7;
    }

    :host([active]) .category-icon {
      opacity: 1;
    }

    .category-icon svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    :host(:hover) {
      background: var(--hover-color);
      color: var(--text-primary);
    }

    :host([active]) {
      background: var(--bg-selected);
      color: var(--accent-hover);
      font-weight: 600;
    }

    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `]}render(){return b`
      ${this.icon?b`
        <span class="category-icon">${P(this.icon)}</span>
      `:``}
      <span class="label"><slot></slot></span>
    `}};N([_({type:Boolean,reflect:!0})],Oc.prototype,`active`,void 0),N([_({type:String})],Oc.prototype,`icon`,void 0),Oc=N([o(`alps-category-item`)],Oc);var kc=`alps-input, alps-select, alps-address-input, input:not([type="hidden"]), select, textarea`,Ac=class extends c{constructor(...e){super(...e),this.label=``,this.description=``,this.focusField=()=>{[...this.querySelectorAll(kc)].find(e=>e.closest(`alps-setting-group`)===this)?.focus()}}static{this.styles=y`
    :host {
      display: block;
      width: 100%;
      max-width: 600px;
      margin-bottom: 36px;
    }

    .setting-label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .setting-description {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
      line-height: 1.4;
      margin-bottom: 12px;
    }

    .slot-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `}render(){return b`
      ${this.label?b`<label class="setting-label" @click=${this.focusField}>${this.label}</label>`:``}
      ${this.description?b`<div class="setting-description">${this.description}</div>`:``}
      <div class="slot-container">
        <slot></slot>
      </div>
    `}};N([_({type:String})],Ac.prototype,`label`,void 0),N([_({type:String})],Ac.prototype,`description`,void 0),Ac=N([o(`alps-setting-group`)],Ac);var jc=class extends c{constructor(...e){super(...e),this.newUsername=``,this.newPassword=``,this.newDisplayName=``,this.isSubmitting=!1,this.error=``,this.showAddForm=!1,this._handleStoreChange=()=>{this.requestUpdate()}}static{this.styles=y`
        :host {
            display: block;
        }
            
        .setting-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px;
            background: var(--bg-secondary);
            border-radius: 8px;
            margin-bottom: 8px;
        }

        .add-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 16px;
        }

        .form-row {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .error-message {
            color: var(--danger-color, #dc2626);
            font-size: 13px;
            margin-top: 8px;
        }

        .empty-state {
            color: var(--text-muted);
            font-style: italic;
            padding: 16px 0;
            text-align: start;
        }
    `}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&(this.i18nStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore&&!this.linkedAccountsStore.isInitialized()&&this.linkedAccountsStore.fetchAccounts())})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.removeEventListener(`change`,this._handleStoreChange)}async handleAdd(e){if(e.preventDefault(),this.newUsername&&this.newPassword){this.isSubmitting=!0,this.error=``;try{await this.linkedAccountsStore.addAccount(this.newUsername,this.newPassword,this.newDisplayName),this.newUsername=``,this.newPassword=``,this.newDisplayName=``,this.showAddForm=!1,window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`linkedAccounts.addedSuccess`)}}))}catch(e){this.error=e.message||this.i18nStore?.t(`linkedAccounts.addError`)}finally{this.isSubmitting=!1}}}async handleRemove(e){if(confirm(this.i18nStore?.t(`linkedAccounts.removeConfirm`)))try{await this.linkedAccountsStore.removeAccount(e),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`linkedAccounts.removedSuccess`)}}))}catch(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore?.t(`linkedAccounts.removeError`),type:`error`}}))}}render(){let e=this.linkedAccountsStore?.getAccounts()||[],t=this.linkedAccountsStore?.isLoading();return b`
            <alps-setting-group 
                label="${this.i18nStore?.t(`settings.categories.accounts`)}"
                description="${this.i18nStore?.t(`settings.categories.accountsDesc`)}">
                
                <div class="account-list">
                    ${t&&!this.linkedAccountsStore.isInitialized()?b`<div>${this.i18nStore?.t(`settings.loading`)}</div>`:e.length===0?b`<div class="empty-state">${this.i18nStore?.t(`linkedAccounts.noAccounts`)}</div>`:e.map(e=>b`
                        <div class="setting-row">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <alps-avatar .name=${e.display_name||e.username} .size=${24}></alps-avatar>
                                <div style="display: flex; flex-direction: column; gap: 2px;">
                                    <strong><bdi>${e.display_name||e.username}</bdi></strong>
                                    ${e.display_name?b`<div style="font-size: 13px; color: var(--text-secondary);"><bdi dir="ltr">${e.username}</bdi></div>`:``}
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 16px;">
                                ${e.added_at&&new Date(e.added_at).getFullYear()>1970?b`
                                    <div style="font-size: 13px; color: var(--text-muted);">
                                        ${this.i18nStore?.t(`webauthn.settings.added`)} ${new Date(e.added_at).toLocaleString()}
                                    </div>
                                `:``}
                                <alps-icon-btn icon="trash" @click=${()=>this.handleRemove(e.username)} title="${this.i18nStore?.t(`linkedAccounts.remove`)}"></alps-icon-btn>
                            </div>
                        </div>
                    `)}
                </div>

                ${this.showAddForm?``:b`
                    <alps-button variant="normal" @click=${()=>this.showAddForm=!0}>
                        ${this.i18nStore?.t(`linkedAccounts.addTitle`)}
                    </alps-button>
                `}
            </alps-setting-group>

            ${this.showAddForm?b`
            <alps-setting-group 
                label="${this.i18nStore?.t(`linkedAccounts.addTitle`)}"
                description="${this.i18nStore?.t(`linkedAccounts.description`)}">
                <form class="add-form" style="margin-top: 0;" @submit=${this.handleAdd}>
                    <div class="form-row">
                        <alps-input 
                            type="email" 
                            placeholder="${this.i18nStore?.t(`login.emailPlaceholder`)}"
                            .value=${this.newUsername}
                            @input=${e=>this.newUsername=e.target.value}
                            ?required=${!0}
                        ></alps-input>
                    </div>
                    
                    <div class="form-row">
                        <alps-input 
                            type="password" icon="key"
                            placeholder="${this.i18nStore?.t(`login.passwordPlaceholder`)}"
                            .value=${this.newPassword}
                            @input=${e=>this.newPassword=e.target.value}
                            ?required=${!0}
                        ></alps-input>
                    </div>

                    <div class="form-row">
                        <alps-input 
                            type="text" icon="user"
                            placeholder="${this.i18nStore?.t(`settings.identity.displayName`)} (${this.i18nStore?.t(`general.optional`)})"
                            .value=${this.newDisplayName}
                            @input=${e=>this.newDisplayName=e.target.value}
                        ></alps-input>
                    </div>

                    ${this.error?b`<div class="error-message">${this.error}</div>`:``}

                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <alps-button variant="primary" ?disabled=${this.isSubmitting||!this.newUsername||!this.newPassword} ?spinning=${this.isSubmitting} @click=${this.handleAdd}>
                            ${this.i18nStore?.t(`linkedAccounts.linkAccount`)}
                        </alps-button>
                        <alps-button variant="text" @click=${e=>{e.preventDefault(),this.showAddForm=!1}}>
                            ${this.i18nStore?.t(`general.cancel`)}
                        </alps-button>
                    </div>
                </form>
            </alps-setting-group>
            `:``}
        `}};N([s({context:A})],jc.prototype,`i18nStore`,void 0),N([s({context:js})],jc.prototype,`linkedAccountsStore`,void 0),N([d()],jc.prototype,`newUsername`,void 0),N([d()],jc.prototype,`newPassword`,void 0),N([d()],jc.prototype,`newDisplayName`,void 0),N([d()],jc.prototype,`isSubmitting`,void 0),N([d()],jc.prototype,`error`,void 0),N([d()],jc.prototype,`showAddForm`,void 0),jc=N([o(`settings-accounts`)],jc);var Q=class extends c{constructor(...e){super(...e),this.data=null,this.error=``,this.loading=!0,this.adding=!1,this.showNamePrompt=!1,this.pendingCredential=null,this.pendingDeleteId=null,this.showTrustPrompt=!1,this.trustBusy=!1,this.removeBusy=!1,this.removeErrors={},this.shownCodes=null,this.showCodesPrompt=!1,this.codesBusy=!1,this.codesErrors={}}static{this.styles=y`
        :host { display: block; }
        .setting-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px;
            background: var(--bg-secondary);
            border-radius: 8px;
            margin-bottom: 8px;
        }
        .icon-container {
            display: flex;
            align-items: center;
            color: var(--text-secondary);
        }
        .icon-container svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }
        .cred-list { margin-top: 16px; }
        .alert { padding: 12px; border-radius: 6px; background: rgba(220, 38, 38, 0.1); color: var(--error, #ef4444); margin-bottom: 12px; }
        .codes {
            margin: 16px 0 0;
            padding: 0;
            list-style: none;
            display: grid;
            grid-template-columns: repeat(2, max-content);
            gap: 8px 32px;
            font-family: var(--font-mono, ui-monospace, monospace);
            font-size: 15px;
        }
        .empty-state {
            color: var(--text-muted);
            font-style: italic;
            padding: 16px 0;
            text-align: start;
        }
    `}connectedCallback(){super.connectedCallback(),this.fetchData()}async fetchData(){try{this.loading=!0;let e=await fetch(`/settings/2fa`);if(!e.ok)throw Error(`Failed to fetch settings`);this.data=await e.json()}catch(e){console.error(`Failed to read the security key settings`,e),this.error=this.i18nStore?.t(`webauthn.errors.load_failed`)??`webauthn.errors.load_failed`}finally{this.loading=!1}}async handleTrustToggle(e){let t=e.target,n=t.checked;t.checked=!!this.data?.trustLinkedAccounts,this.trustBusy||(n?this.showTrustPrompt=!0:await this.sendTrust({trust:!1}))}async _handleTrustPromptSubmit(e){let t=typeof e.detail?.password==`string`?e.detail.password:``;this.showTrustPrompt=!1,t?await this.sendTrust({trust:!0,current_password:t}):this.showTrustError(`webauthn.errors.password_required`)}async sendTrust(e){this.trustBusy=!0,this.error=``;try{let t=await F(`/settings/2fa/trust-linked-accounts`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(t.status===401)return;if(!t.ok){let e=await t.json().then(e=>e?.error,()=>void 0);this.showTrustError(this.trustRefusal(t.status,e))}}catch{this.showTrustError(`webauthn.errors.trust_failed`)}finally{this.trustBusy=!1}await this.fetchData()}trustRefusal(e,t){if(e===503)return`webauthn.errors.load_failed`;switch(t){case`keys_unavailable`:return`webauthn.errors.load_failed`;case`wrong_password`:return`webauthn.errors.wrong_password`;case`password_required`:return`webauthn.errors.password_required`;case`two_factor_required`:return`webauthn.errors.two_factor_required`;case`no_security_key`:return`webauthn.errors.no_security_key`}return e===429?`webauthn.errors.rate_limited`:`webauthn.errors.trust_failed`}showTrustError(e){this.error=this.i18nStore?.t(e)??e}async addCredential(){this.adding=!0,this.error=``;try{let e=await fetch(`/settings/2fa/begin`,{method:`POST`});if(e.status===503){this.error=this.i18nStore?.t(`webauthn.errors.load_failed`)??`webauthn.errors.load_failed`,this.adding=!1;return}if(!e.ok)throw Error(await e.text());let t=await yc(await e.json());this.pendingCredential=t,this.showNamePrompt=!0,this.adding=!1}catch(e){this.error=e.name===`NotAllowedError`||e.message&&e.message.includes(`not allowed`)?``:this.i18nStore?.t(`webauthn.errors.register_failed`)||`There was an error registering your security key. Please try again.`,this.adding=!1}}async _handlePromptSubmit(e){let t=e.detail.keyName||`Security Key`;this.showNamePrompt=!1;let n={...this.pendingCredential,name:t};this.adding=!0,this.error=``;try{let e=await fetch(`/settings/2fa/finish`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(n)});if(e.status===503){this.error=this.i18nStore?.t(`webauthn.errors.load_failed`)??`webauthn.errors.load_failed`;return}if(!e.ok)throw Error(await e.text());let t=await e.json().catch(()=>({}));Array.isArray(t?.recovery_codes)&&t.recovery_codes.length&&(this.shownCodes=t.recovery_codes),this.fetchData()}catch{this.error=this.i18nStore?.t(`webauthn.errors.register_failed`)||`There was an error registering your security key. Please try again.`}finally{this.adding=!1,this.pendingCredential=null}}_handlePromptCancel(){this.showNamePrompt=!1,this.pendingCredential=null}removeCredential(e){this.error=``,this.removeErrors={},this.pendingDeleteId=e}t(e){return this.i18nStore?.t(e)??e}async executeRemoveCredential(e){let t=this.pendingDeleteId;if(!t||this.removeBusy)return;let n=typeof e.detail?.password==`string`?e.detail.password:``;if(!n)this.removeErrors={password:this.t(`webauthn.errors.password_required`)};else{this.removeBusy=!0;try{let e=await F(`/settings/2fa/credential/${encodeURIComponent(t)}/delete`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({current_password:n})});if(e.ok||e.status===404){this.pendingDeleteId=null,this.fetchData();return}if(e.status===401){this.pendingDeleteId=null;return}let r=await e.json().then(e=>e?.error,()=>void 0);this.removeErrors={password:this.removeRefusal(e.status,r)}}catch{this.removeErrors={password:this.t(`webauthn.errors.remove_unavailable`)}}finally{this.removeBusy=!1}}}removeRefusal(e,t){return t===`wrong_password`?this.t(`webauthn.errors.wrong_password`):t===`password_required`?this.t(`webauthn.errors.password_required`):t===`two_factor_required`?this.t(`webauthn.errors.two_factor_required`):e===429?this.t(`webauthn.errors.rate_limited`):e>=500?this.t(`webauthn.errors.remove_unavailable`):this.t(`webauthn.errors.remove_failed`)}askForNewCodes(){this.error=``,this.codesErrors={},this.showCodesPrompt=!0}async createCodes(e){if(this.codesBusy)return;let t=typeof e.detail?.password==`string`?e.detail.password:``;if(!t)this.codesErrors={password:this.t(`webauthn.errors.password_required`)};else{this.codesBusy=!0;try{let e=await F(`/settings/2fa/recovery-codes`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({current_password:t})});if(e.status===401){this.showCodesPrompt=!1;return}let n=await e.json().catch(()=>({}));if(e.ok&&Array.isArray(n?.recovery_codes)){this.showCodesPrompt=!1,this.shownCodes=n.recovery_codes,this.fetchData();return}this.codesErrors={password:this.codesRefusal(e.status,n?.error)}}catch{this.codesErrors={password:this.t(`webauthn.recovery.create_failed`)}}finally{this.codesBusy=!1}}}codesRefusal(e,t){switch(t){case`wrong_password`:return this.t(`webauthn.errors.wrong_password`);case`password_required`:return this.t(`webauthn.errors.password_required`);case`two_factor_required`:return this.t(`webauthn.errors.two_factor_required`);case`no_security_key`:return this.t(`webauthn.errors.no_security_key`)}return t===`recovery_unavailable`?this.t(`webauthn.recovery.unavailable`):e===429?this.t(`webauthn.errors.rate_limited`):this.t(`webauthn.recovery.create_failed`)}async copyCodes(){try{await navigator.clipboard.writeText((this.shownCodes??[]).join(`
`)),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.t(`originalMessage.copied`),timeout:3e3}}))}catch{window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.t(`originalMessage.copyFailed`),type:`error`,timeout:3e3}}))}}downloadCodes(){let e=new Blob([(this.shownCodes??[]).join(`
`)+`
`],{type:`text/plain`}),t=URL.createObjectURL(e),n=document.createElement(`a`);n.href=t,n.download=`recovery-codes.txt`,n.click(),setTimeout(()=>URL.revokeObjectURL(t),0)}renderCodes(){return b`
            <ui-modal heading=${this.t(`webauthn.recovery.codes_title`)} .bodyDescribes=${!0}>
                <div>${this.t(`webauthn.recovery.codes_intro`)}</div>
                <ol class="codes" dir="ltr">
                    ${this.shownCodes.map(e=>b`<li>${e}</li>`)}
                </ol>
                <div slot="actions">
                    <alps-button variant="text" @click=${this.copyCodes}>${this.t(`originalMessage.copyClipboard`)}</alps-button>
                    <alps-button variant="text" @click=${this.downloadCodes}>${this.t(`attachment.download`)}</alps-button>
                    <alps-button variant="normal" @click=${()=>this.shownCodes=null}>${this.t(`webauthn.recovery.done`)}</alps-button>
                </div>
            </ui-modal>
        `}render(){return this.loading?b`<div>${this.i18nStore?.t(`settings.loading`)}</div>`:b`
            ${this.showNamePrompt?b`
                <!-- Said here, where the key is kept or dropped: Cancel
                     saves nothing. -->
                <ui-prompt
                    heading=${this.i18nStore?.t(`webauthn.name_key_title`)}
                    .message=${this.i18nStore?.t(`webauthn.name_key_notice`)??``}
                    confirmText=${this.i18nStore?.t(`general.save`)}
                    cancelText=${this.i18nStore?.t(`general.cancel`)}
                    .fields=${[{id:`keyName`,label:this.i18nStore?.t(`webauthn.name_key_label`),placeholder:this.i18nStore?.t(`webauthn.key_name_placeholder`),autofocus:!0}]}
                    @submit=${this._handlePromptSubmit}
                    @cancel=${this._handlePromptCancel}
                ></ui-prompt>
            `:``}

            ${this.showTrustPrompt?b`
                <ui-prompt
                    heading=${this.i18nStore?.t(`webauthn.trust_linked_checkbox`)}
                    confirmText=${this.i18nStore?.t(`general.save`)}
                    cancelText=${this.i18nStore?.t(`general.cancel`)}
                    .fields=${[{id:`password`,type:`password`,label:this.i18nStore?.t(`webauthn.trust_password_label`),autofocus:!0}]}
                    @submit=${this._handleTrustPromptSubmit}
                    @cancel=${()=>this.showTrustPrompt=!1}
                ></ui-prompt>
            `:``}

            ${this.error?b`
                <ui-modal 
                    heading="${this.i18nStore?.t(`general.error`)||`Error`}" 
                    .isDanger=${!0} 
                    .dismissible=${!0}
                    @cancel=${()=>this.error=``}>
                    <div>${this.error}</div>
                    <div slot="actions">
                        <!-- Close: an error has nothing to cancel. -->
                        <alps-button variant="normal" @click=${()=>this.error=``}>
                            ${this.i18nStore?.t(`attachment.close`)||`Close`}
                        </alps-button>
                    </div>
                </ui-modal>
            `:``}

            ${this.pendingDeleteId?b`
                <ui-prompt
                    heading="${this.t(`webauthn.confirm_remove`)}"
                    confirmText="${this.t(`webauthn.settings.remove_btn`)}"
                    cancelText="${this.t(`general.cancel`)}"
                    .isDanger=${!0}
                    .busy=${this.removeBusy}
                    .errors=${this.removeErrors}
                    .fields=${[{id:`password`,type:`password`,label:this.t(`webauthn.remove_password_label`),autocomplete:`current-password`,autofocus:!0,validate:e=>e?null:this.t(`webauthn.errors.password_required`)}]}
                    @submit=${this.executeRemoveCredential}
                    @cancel=${()=>{this.removeBusy||(this.pendingDeleteId=null)}}
                ></ui-prompt>
            `:``}

            ${this.shownCodes?this.renderCodes():``}

            ${this.showCodesPrompt?b`
                <ui-prompt
                    heading="${this.t(`webauthn.recovery.create`)}"
                    .message=${this.t(`webauthn.recovery.create_notice`)}
                    confirmText="${this.t(`webauthn.recovery.create`)}"
                    cancelText="${this.t(`general.cancel`)}"
                    .busy=${this.codesBusy}
                    .errors=${this.codesErrors}
                    .fields=${[{id:`password`,type:`password`,label:this.t(`webauthn.recovery.password_label`),autocomplete:`current-password`,autofocus:!0,validate:e=>e?null:this.t(`webauthn.errors.password_required`)}]}
                    @submit=${this.createCodes}
                    @cancel=${()=>{this.codesBusy||(this.showCodesPrompt=!1)}}
                ></ui-prompt>
            `:``}

            <alps-setting-group 
                label="${this.i18nStore?.t(`webauthn.settings.keys_title`)}" 
                description="${this.i18nStore?.t(`webauthn.settings.group_desc`)}">

                <div class="cred-list" style="margin-top: 0;">
                    ${this.data?.credentialCount&&this.data.credentialCount>0?b`
                        ${this.data?.credentials.map(e=>b`
                            <div class="setting-row">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="icon-container">${P(`fingerprint`)}</div>
                                    <strong>${e.Name||this.i18nStore?.t(`webauthn.settings.unnamed_key`)}</strong>
                                </div>
                                <div style="display: flex; align-items: center; gap: 16px;">
                                    <div style="font-size: 13px; color: var(--text-muted);">${this.i18nStore?.t(`webauthn.settings.added`)} ${new Date(e.AddedAt).toLocaleString()}</div>
                                    <alps-icon-btn icon="trash" @click=${()=>this.removeCredential(e.ID)} title=${this.i18nStore?.t(`webauthn.settings.remove_btn`)||`Remove`}></alps-icon-btn>
                                </div>
                            </div>
                        `)}
                    `:b`<div class="empty-state">${this.i18nStore?.t(`webauthn.settings.noKeys`)}</div>`}
                    <alps-button variant="normal" style="margin-top: 12px;" @click=${this.addCredential} ?disabled=${this.adding} ?spinning=${this.adding}>
                        ${this.i18nStore?.t(`webauthn.add_key`)}
                    </alps-button>
                </div>
            </alps-setting-group>

            ${(this.data?.credentialCount??0)>0?b`
                <alps-setting-group label="${this.t(`webauthn.recovery.title`)}" description="${this.t(`webauthn.recovery.desc`)}">
                    ${this.data?.recoveryCodesAvailable===!1?b`<p>${this.t(`webauthn.recovery.unavailable`)}</p>`:b`
                    <div class="setting-row">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="icon-container">${P(`key`)}</div>
                            <span>${(this.data?.recoveryCodesLeft??0)>0?this.i18nStore?.t(`webauthn.recovery.left`,{count:this.data.recoveryCodesLeft}):this.t(`webauthn.recovery.none`)}</span>
                        </div>
                    </div>
                    <alps-button variant="normal" style="margin-top: 4px;" @click=${this.askForNewCodes}>
                        ${this.t(`webauthn.recovery.create`)}
                    </alps-button>
                    `}
                </alps-setting-group>
            `:``}

            ${(this.data?.credentialCount??0)>0?b`
                <alps-setting-group label="${this.i18nStore?.t(`webauthn.trust_linked`)}" description="${this.i18nStore?.t(`webauthn.trust_linked_desc`)}">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
                        <input type="checkbox" .checked=${r(!!this.data?.trustLinkedAccounts)} ?disabled=${this.trustBusy} @change=${this.handleTrustToggle}>
                        ${this.i18nStore?.t(`webauthn.trust_linked_checkbox`)}
                    </label>
                </alps-setting-group>
            `:``}
        `}};N([s({context:A})],Q.prototype,`i18nStore`,void 0),N([d()],Q.prototype,`data`,void 0),N([d()],Q.prototype,`error`,void 0),N([d()],Q.prototype,`loading`,void 0),N([d()],Q.prototype,`adding`,void 0),N([d()],Q.prototype,`showNamePrompt`,void 0),N([d()],Q.prototype,`pendingCredential`,void 0),N([d()],Q.prototype,`pendingDeleteId`,void 0),N([d()],Q.prototype,`showTrustPrompt`,void 0),N([d()],Q.prototype,`trustBusy`,void 0),N([d()],Q.prototype,`removeBusy`,void 0),N([d()],Q.prototype,`removeErrors`,void 0),N([d()],Q.prototype,`shownCodes`,void 0),N([d()],Q.prototype,`showCodesPrompt`,void 0),N([d()],Q.prototype,`codesBusy`,void 0),N([d()],Q.prototype,`codesErrors`,void 0),Q=N([o(`alps-webauthn-settings`)],Q);var Mc=class extends c{constructor(...e){super(...e),this.editing=null,this.draftName=``,this.draftAddress=``,this.problem=null,this._handleI18nChange=()=>this.requestUpdate(),this._handleSettingsChange=()=>this.requestUpdate(),this.onFormKeydown=e=>{e.key!==`Escape`||lt(e)||(e.preventDefault(),this.closeForm())}}static{this.styles=y`
    :host {
      display: block;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .identity {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-block: 6px;
      padding-inline: 12px 6px;
      background: var(--bg-secondary);
      border-radius: 8px;
    }

    .sender {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
      color: var(--text-primary);
    }

    .identity-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .problem {
      color: var(--danger-color, #dc2626);
      font-size: 13px;
    }

    .note {
      font-size: 13px;
      color: var(--text-muted);
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .add {
      align-self: flex-start;
    }
  `}connectedCallback(){super.connectedCallback(),this.i18nStore?.addEventListener(`change`,this._handleI18nChange),this.settingsStore?.addEventListener(`change`,this._handleSettingsChange)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),this.settingsStore?.removeEventListener(`change`,this._handleSettingsChange)}get identities(){return this.settingsStore?.getState().identities??[]}get opened(){return typeof this.editing==`number`?this.identities[this.editing]??{name:``,address:``}:{name:``,address:``}}get hasUnsavedChanges(){if(this.editing===null)return!1;let e=this.opened;return this.draftName.trim()!==e.name.trim()||this.draftAddress.trim()!==e.address}discardUnsavedChanges(){this.editing=null}t(e,t){return this.i18nStore?.t(e,t)??e}openForm(e){let t=typeof e==`number`?this.identities[e]:void 0;this.editing=e,this.draftName=t?.name??``,this.draftAddress=t?.address??``,this.problem=null,this.updateComplete.then(()=>this.shadowRoot?.querySelector(`.identity-form alps-input`)?.focus())}closeForm(){let e=this.editing;this.editing=null,this.problem=null,this.updateComplete.then(()=>this.focusAfter(typeof e==`number`?e:null))}focusAfter(e){let t=[...this.shadowRoot?.querySelectorAll(`.identity`)??[]];(e!==null&&t.length>0?t[Math.min(e,t.length-1)].querySelector(`alps-icon-btn.edit`):this.shadowRoot?.querySelector(`alps-button.add`))?.shadowRoot?.querySelector(`button`)?.focus()}saveForm(e){e?.preventDefault();let t=this.editing;if(t===null)return;let n=this.identities.filter((e,n)=>n!==t),r=Le(this.draftAddress,Ie(this.settingsStore.getState()),n);if(r){this.problem=r;return}let i={name:[...this.draftName.trim()].slice(0,256).join(``),address:Me(this.draftAddress)},a=t===`new`?[...this.identities,i]:this.identities.map((e,n)=>n===t?i:e);this.settingsStore.updateSettings({identities:a}),this.closeForm()}removeAt(e){this.editing!==null&&(this.editing=null),this.settingsStore.updateSettings({identities:this.identities.filter((t,n)=>n!==e)}),this.updateComplete.then(()=>this.focusAfter(this.identities.length>0?e:null))}problemText(e){switch(e){case`own`:return this.t(`settings.identity.identityOwn`);case`duplicate`:return this.t(`settings.identity.identityDuplicate`);default:return this.t(`settings.identity.identityInvalid`)}}renderForm(){let e=this.settingsStore?.getState().name?.trim();return b`
      <form class="identity-form" novalidate @submit=${this.saveForm} @keydown=${this.onFormKeydown}>
        <label class="field">
          ${this.t(`settings.identity.identityName`)}
          <alps-input
            type="text"
            label=${this.t(`settings.identity.identityName`)}
            .value=${this.draftName}
            placeholder=${e||this.t(`settings.placeholderName`)}
            @input=${e=>{this.draftName=e.target.value}}
          ></alps-input>
        </label>
        <label class="field">
          ${this.t(`settings.identity.identityAddress`)}
          <alps-input
            type="email"
            label=${this.t(`settings.identity.identityAddress`)}
            autocomplete="off"
            .value=${this.draftAddress}
            @input=${e=>{this.draftAddress=e.target.value,this.problem=null}}
          ></alps-input>
        </label>
        ${this.problem?b`<div class="problem" role="alert">${this.problemText(this.problem)}</div>`:n}
        <div class="actions">
          <alps-button variant="primary" @click=${this.saveForm}>${this.t(`general.save`)}</alps-button>
          <alps-button variant="text" @click=${()=>this.closeForm()}>${this.t(`general.cancel`)}</alps-button>
        </div>
      </form>
    `}render(){let e=this.identities,t=this.settingsStore?.getState().name?.trim()??``,r=e.length>=20;return b`
      <alps-setting-group label=${this.t(`settings.identity.identities`)} description=${this.t(`settings.identity.identitiesDesc`)}>
        ${e.length>0?b`
          <ul aria-label=${this.t(`settings.identity.identities`)}>
            ${e.map((e,n)=>this.editing===n?b`<li>${this.renderForm()}</li>`:b`
              <li class="identity">
                <span class="sender">${Fe({name:e.name||t,email:e.address})}</span>
                <alps-icon-btn
                  class="edit"
                  ?disabled=${this.editing!==null}
                  icon="pen"
                  title=${this.t(`settings.identity.editIdentity`,{address:e.address})}
                  @click=${()=>this.openForm(n)}
                ></alps-icon-btn>
                <alps-icon-btn
                  class="remove"
                  ?disabled=${this.editing!==null}
                  icon="trash"
                  title=${this.t(`settings.identity.removeIdentity`,{address:e.address})}
                  @click=${()=>this.removeAt(n)}
                ></alps-icon-btn>
              </li>
            `)}
          </ul>
        `:n}
        ${this.editing===`new`?this.renderForm():b`
          <alps-button class="add" variant="normal" icon="plusBold" ?disabled=${r||this.editing!==null} @click=${()=>this.openForm(`new`)}>
            ${this.t(`settings.identity.addIdentity`)}
          </alps-button>
        `}
        ${r?b`<div class="note">${this.t(`settings.identity.identitiesFull`,{count:20})}</div>`:n}
      </alps-setting-group>
    `}};N([s({context:Be,subscribe:!0})],Mc.prototype,`settingsStore`,void 0),N([s({context:A})],Mc.prototype,`i18nStore`,void 0),N([d()],Mc.prototype,`editing`,void 0),N([d()],Mc.prototype,`draftName`,void 0),N([d()],Mc.prototype,`draftAddress`,void 0),N([d()],Mc.prototype,`problem`,void 0),Mc=N([o(`alps-identities-settings`)],Mc);var Nc=768,Pc=class extends c{constructor(...e){super(...e),this.category=``,this.isMobile=window.innerWidth<=Nc,this.previouslyFocused=null,this.hadSectionFocus=!1,this.lastSection=``,this._handleResize=()=>{this.isMobile=window.innerWidth<=Nc},this.onDocumentKeydown=e=>{if(!(e.key!==`Escape`||e.defaultPrevented||lt(e))){for(let t of e.composedPath())if(t instanceof HTMLDialogElement&&t.open||t instanceof HTMLElement&&t.localName===`alps-floating-composer`)return;e.preventDefault(),this.requestClose()}},this.handlePluginsUpdated=()=>{this.requestUpdate()},this._handleSettingsChange=()=>{this._syncState()},this._handleI18nChange=()=>{this.requestUpdate()},this.pendingLeave=null,this.confirmLeave=()=>{let e=this.pendingLeave;if(this.pendingLeave=null,e){let e=this.shadowRoot?.querySelector(`.settings-content-wrapper`);for(let t of e?.children??[])t.discardUnsavedChanges?.()}e?.()}}static{this.styles=y`
    :host {
      position: fixed;
      inset: 0;
      z-index: ${900};
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* The composer's backdrop when it is expanded: the page beneath, dimmed. */
    .backdrop {
      position: absolute;
      inset: 0;
      background: var(--modal-backdrop, rgba(255, 255, 255, 0.8));
    }

    /* The composer's frame, rounded on all four corners as an expanded one is. */
    .window-frame {
      position: relative;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      width: min(960px, calc(100vw - 48px));
      height: min(860px, calc(100vh - 48px));
      height: min(860px, calc(100dvh - 48px));
      background: var(--bg-primary);
      border-radius: 8px;
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    /* The composer's title bar, without its Minimize and Expand. */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-block: 6px;
      padding-inline: 10px 6px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      color: var(--text-color);
    }

    .header-title {
      font-weight: 500;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .settings-layout {
      display: flex;
      flex: 1;
      min-height: 0;
      color: var(--text-primary);
      font-size: 14px;
    }

    .sections {
      flex: 0 0 220px;
      box-sizing: border-box;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 0;
      border-inline-end: 1px solid var(--border-color);
    }

    .main-view {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
      padding: 24px 32px;
      background: var(--bg-primary);
    }

    .settings-content-wrapper {
      max-width: 640px;
      margin: 0 auto;
    }

    .category-title {
      margin: 0 0 24px;
      font-family: var(--font-heading);
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .back-to-sections {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 12px;
      padding-block: 4px;
      padding-inline: 4px 8px;
      border: none;
      border-radius: 6px;
      background: none;
      color: var(--text-primary);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }
    .back-to-sections:hover {
      background: var(--hover-color);
    }
    .back-to-sections svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    /* A phone shows the whole screen, one column at a time: the list, or one
       section. */
    @media (max-width: ${Nc}px) {
      .window-frame {
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        border: none;
        border-radius: 0;
      }
      .sections {
        flex: 1;
        border-inline-end: none;
      }
      .main-view {
        padding: 16px;
      }
    }

    /* The transparent outline paints nothing here; forced colors, which drop
       the border colour and the shadow, give it a system colour. */
    select:focus, input:focus, textarea:focus {
      border-color: var(--accent-color, #2563eb);
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
      outline: 2px solid transparent;
    }

    textarea {
      width: 100%;
      box-sizing: border-box;
      padding: var(--input-padding, 8px 12px);
      border: 1px solid var(--border-color);
      border-radius: var(--input-radius, 6px);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-size: var(--input-font-size, 14px);
      outline: none;
      font-family: var(--font-base);
      min-height: 80px;
      resize: vertical;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--text-primary);
      font-weight: 500;
    }

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  `}get shownCategory(){return this.category||(this.isMobile?``:`general`)}connectedCallback(){super.connectedCallback(),this.previouslyFocused=ct(),document.addEventListener(`keydown`,this.onDocumentKeydown),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this.i18nStore?.addEventListener(`change`,this._handleI18nChange),window.addEventListener(`resize`,this._handleResize),window.addEventListener(`plugins-updated`,this.handlePluginsUpdated),this._syncState()}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(`keydown`,this.onDocumentKeydown),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),window.removeEventListener(`resize`,this._handleResize),window.removeEventListener(`plugins-updated`,this.handlePluginsUpdated);let e=this.previouslyFocused;this.previouslyFocused=null,e?.isConnected&&e.focus?.()}firstUpdated(){this.focusSection()}willUpdate(e){this.hadSectionFocus=this.hasUpdated&&(e.has(`category`)||e.has(`isMobile`))&&!!this.shadowRoot?.activeElement}updated(){this.hadSectionFocus&&!this.shadowRoot?.activeElement&&this.focusSection(),this.shownCategory&&(this.lastSection=this.shownCategory)}focusSection(){let e=this.shadowRoot;if(e.activeElement)return;let t=[...e.querySelectorAll(`alps-category-item`)];(e.querySelector(`alps-category-item[active]`)??e.querySelector(`.back-to-sections`)??t.find(e=>e.dataset.category===this.lastSection)??t[0])?.focus()}_syncState(){this.settingsState={...this.settingsStore.getState()}}getCategoryLabel(e){switch(e){case`general`:return this.i18nStore?.t(`settings.categories.general`);case`identity`:return this.i18nStore?.t(`settings.categories.identity`);case`webauthn`:return this.i18nStore?.t(`settings.categories.webauthn`);case`accounts`:return this.i18nStore?.t(`settings.categories.accounts`);case`reading`:return this.i18nStore?.t(`settings.categories.reading`);case`appearance`:return this.i18nStore?.t(`settings.categories.appearance`);case`localization`:return this.i18nStore?.t(`settings.categories.localization`);default:let t=I.getSettingsTabs().find(t=>t.id===e);return t?this.i18nStore?.t(t.labelKey):e}}selectCategory(e){e!==this.shownCategory&&this.leave(()=>this.dispatchEvent(new CustomEvent(`settings-category`,{detail:{category:e},bubbles:!0,composed:!0})))}requestClose(){this.leave(()=>this.dispatchEvent(new CustomEvent(`settings-close`,{bubbles:!0,composed:!0})))}leave(e){let t=ct();t instanceof HTMLElement&&(t.localName===`input`||t.localName===`textarea`||t.isContentEditable)&&t.blur(),this.hasUnsavedChanges?this.pendingLeave=e:e()}get hasUnsavedChanges(){return[...this.shadowRoot?.querySelector(`.settings-content-wrapper`)?.children??[]].some(e=>e.hasUnsavedChanges===!0)}async handleUpdate(e,t){let n=e.target,r=n.value;n.type===`checkbox`?(r=n.checked,t===`desktopNotifications`&&r===!0&&(`Notification`in window&&Notification.permission!==`granted`&&Notification.permission!==`denied`?await Notification.requestPermission()!==`granted`&&(r=!1,n.checked=!1):`Notification`in window&&Notification.permission===`denied`&&(r=!1,n.checked=!1))):(n.type===`number`||[`checkMailInterval`,`autoLogout`,`messagesPerPage`,`markReadTimeout`,`undoTimeout`,`weekStart`].includes(t))&&(r=parseInt(n.value,10),isNaN(r)&&(r=0)),this.settingsStore.updateSettings({[t]:r})}renderSection(e,t,n,r){return b`
      <alps-category-item
        ?active=${r===e}
        data-category=${e}
        @click=${()=>this.selectCategory(e)}
        .icon=${t}
      >${n}</alps-category-item>`}renderSections(e){let t=e=>this.i18nStore?.t(e);return b`
      <nav class="sections">
        ${this.renderSection(`general`,`gear`,t(`settings.categories.general`),e)}
        ${this.renderSection(`reading`,`bookOpen`,t(`settings.categories.reading`),e)}
        ${this.renderSection(`appearance`,`palette`,t(`settings.categories.appearance`),e)}
        ${this.renderSection(`localization`,`globe`,t(`settings.categories.localization`),e)}
        ${this.renderSection(`identity`,`user`,t(`settings.categories.identity`),e)}
        ${this.renderSection(`accounts`,`users`,t(`settings.categories.accounts`),e)}
        ${this.renderSection(`webauthn`,`fingerprint`,t(`settings.categories.webauthn`),e)}
        ${I.getSettingsTabs().map(n=>this.renderSection(n.id,n.icon,t(n.labelKey),e))}
      </nav>
    `}renderContent(e){return this.settingsState?b`
      ${e===`general`?this.renderGeneral():``}
      ${e===`identity`?this.renderIdentity():``}
      ${e===`accounts`?b`<settings-accounts></settings-accounts>`:``}
      ${e===`webauthn`?b`<alps-webauthn-settings></alps-webauthn-settings>`:``}
      ${e===`reading`?this.renderReading():``}
      ${e===`appearance`?this.renderAppearance():``}
      ${e===`localization`?this.renderLocalization():``}
      ${I.getSettingsTabs().filter(t=>t.id===e).map(e=>At(e,()=>this.requestUpdate())?b`${h(`<${e.component}></${e.component}>`)}`:b`<alps-page-load-error></alps-page-load-error>`)}
    `:b`<div>${this.i18nStore?.t(`settings.loading`)}</div>`}render(){let e=this.shownCategory,t=!this.isMobile||e===``,n=e!==``,r=e=>this.i18nStore?.t(e)??``,i=r(`settings.title`);return b`
      ${this.pendingLeave?b`
        <ui-confirm
          heading=${r(`settings.unsavedTitle`)}
          message=${r(`settings.unsavedMessage`)}
          confirmText=${r(`settings.discard`)}
          cancelText=${r(`settings.keepEditing`)}
          .isDanger=${!0}
          @confirm=${this.confirmLeave}
          @cancel=${()=>{this.pendingLeave=null}}
        ></ui-confirm>
      `:``}
      <div class="backdrop"></div>
      <div class="window-frame" role="dialog" aria-label=${i}>
        <div class="header">
          <div class="header-title">${i}</div>
          <alps-icon-btn
            class="close-btn"
            title=${r(`general.close`)}
            icon="x"
            @click=${()=>this.requestClose()}
          ></alps-icon-btn>
        </div>
        <div class="settings-layout">
          ${t?this.renderSections(e):``}
          ${n?b`
            <main class="main-view">
              <div class="settings-content-wrapper">
                ${this.isMobile?b`
                  <button class="back-to-sections" @click=${()=>this.selectCategory(``)}>
                    ${P(`arrowLeft`)} ${i}
                  </button>`:``}
                <h1 class="category-title">${this.getCategoryLabel(e)}</h1>
                ${this.renderContent(e)}
              </div>
            </main>`:``}
        </div>
      </div>
    `}renderGeneral(){return b`
        <alps-setting-group label="${this.i18nStore?.t(`settings.general.checkMailInterval`)}" description="${this.i18nStore?.t(`settings.general.checkMailIntervalDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.general.checkMailInterval`)}" @change=${e=>this.handleUpdate(e,`checkMailInterval`)} .value=${this.settingsState.checkMailInterval.toString()}
            .options=${[{value:`1`,label:this.i18nStore?.t(`settings.general.everyMinute`)||`1`},{value:`5`,label:this.i18nStore?.t(`settings.general.every5Minutes`)||`5`},{value:`15`,label:this.i18nStore?.t(`settings.general.every15Minutes`)||`15`},{value:`30`,label:this.i18nStore?.t(`settings.general.every30Minutes`)||`30`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.general.autoLogout`)}" description="${this.i18nStore?.t(`settings.general.autoLogoutDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.general.autoLogout`)}" @change=${e=>this.handleUpdate(e,`autoLogout`)} .value=${this.settingsState.autoLogout.toString()}
            .options=${[{value:`0`,label:this.i18nStore?.t(`settings.general.never`)||`0`},{value:`15`,label:this.i18nStore?.t(`settings.general.minutes15`)||`15`},{value:`30`,label:this.i18nStore?.t(`settings.general.minutes30`)||`30`},{value:`60`,label:this.i18nStore?.t(`settings.general.hour1`)||`60`},{value:`120`,label:this.i18nStore?.t(`settings.general.hours2`)||`120`},{value:`360`,label:this.i18nStore?.t(`settings.general.hours6`)||`360`},...[0,15,30,60,120,360].includes(this.settingsState.autoLogout)?[]:[{value:String(this.settingsState.autoLogout),label:new Intl.NumberFormat(this.i18nStore?.getIntlLanguage?.(),{style:`unit`,unit:`minute`,unitDisplay:`long`}).format(this.settingsState.autoLogout)}]]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.desktopNotifications} 
                   @change=${e=>this.handleUpdate(e,`desktopNotifications`)}>
            ${this.i18nStore?.t(`settings.general.desktopNotifications`)}
          </label>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.soundNotifications} 
                   @change=${e=>this.handleUpdate(e,`soundNotifications`)}>
            ${this.i18nStore?.t(`settings.general.soundNotifications`)}
          </label>
        </alps-setting-group>
    `}renderIdentity(){return b`
        <alps-setting-group label="${this.i18nStore?.t(`settings.identity.displayName`)}" description="${this.i18nStore?.t(`settings.identity.displayNameDesc`)}">
          <alps-input label="${this.i18nStore?.t(`settings.identity.displayName`)}" type="text" icon="user" .value=${this.settingsState.name||``} @change=${e=>this.handleUpdate(e,`name`)} placeholder="${this.i18nStore?.t(`settings.placeholderName`)}"></alps-input>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.identity.signature`)}" description="${this.i18nStore?.t(`settings.identity.signatureDesc`)}">
          <!-- Named by its setting: the label above is in alps-setting-group's
               shadow root, which no label can reach out of. -->
          <textarea dir="auto" aria-label=${this.i18nStore?.t(`settings.identity.signature`)??``} @change=${e=>this.handleUpdate(e,`signature`)} .value=${this.settingsState.signature||``}></textarea>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.identity.replyTo`)}" description="${this.i18nStore?.t(`settings.identity.replyToDesc`)}">
          <alps-input label="${this.i18nStore?.t(`settings.identity.replyTo`)}" type="text" .value=${this.settingsState.replyTo||``} @change=${e=>this.handleUpdate(e,`replyTo`)} placeholder="${this.i18nStore?.t(`settings.placeholderReplyTo`)}"></alps-input>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.bccMyself} 
                   @change=${e=>this.handleUpdate(e,`bccMyself`)}>
            ${this.i18nStore?.t(`settings.identity.bccMyself`)}
          </label>
        </alps-setting-group>
        <alps-identities-settings></alps-identities-settings>
    `}renderReading(){return b`
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.messagesPerPage`)}">
          <alps-select label="${this.i18nStore?.t(`settings.reading.messagesPerPage`)}" @change=${e=>this.handleUpdate(e,`messagesPerPage`)} .value=${this.settingsState.messagesPerPage.toString()}
            .options=${[{value:`25`,label:`25`},{value:`50`,label:`50`},{value:`100`,label:`100`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.enableThreading&&this.settingsState.hasThreadCapability!==!1} 
                   ?disabled=${this.settingsState.hasThreadCapability===!1}
                   @change=${e=>this.handleUpdate(e,`enableThreading`)}>
            ${this.i18nStore?.t(`settings.reading.enableThreading`)}
            ${this.settingsState.hasThreadCapability===!1?b`
              <span style="font-size: 12px; color: var(--text-muted); font-weight: normal; margin-inline-start: 4px;">
                (${this.i18nStore?.t(`settings.reading.threadingNotSupported`)})
              </span>
            `:``}
          </label>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.preferredView`)}" description="${this.i18nStore?.t(`settings.reading.preferredViewDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.reading.preferredView`)}" @change=${e=>this.handleUpdate(e,`preferredView`)} .value=${this.settingsState.preferredView}
            .options=${[{value:`html`,label:this.i18nStore?.t(`settings.reading.html`)||`html`},{value:`text`,label:this.i18nStore?.t(`settings.reading.plainText`)||`text`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.themeIframeContent} 
                   @change=${e=>this.handleUpdate(e,`themeIframeContent`)}>
            ${this.i18nStore?.t(`settings.reading.themeIframeContent`)}
          </label>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.showRemoteContent`)}">
          <alps-select label="${this.i18nStore?.t(`settings.reading.showRemoteContent`)}" @change=${e=>this.handleUpdate(e,`showRemoteContent`)} .value=${this.settingsState.showRemoteContent}
            .options=${[{value:`ask`,label:this.i18nStore?.t(`settings.reading.alwaysAsk`)||`ask`},{value:`always`,label:this.i18nStore?.t(`settings.reading.alwaysLoad`)||`always`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.markReadTimeout`)}">
          <alps-select label="${this.i18nStore?.t(`settings.reading.markReadTimeout`)}" @change=${e=>this.handleUpdate(e,`markReadTimeout`)} .value=${this.settingsState.markReadTimeout.toString()}
            .options=${[{value:`0`,label:this.i18nStore?.t(`settings.reading.markReadImmediately`)||`0`},{value:`1`,label:this.i18nStore?.t(`settings.reading.markRead1s`)||`1`},{value:`3`,label:this.i18nStore?.t(`settings.reading.markRead3s`)||`3`},{value:`5`,label:this.i18nStore?.t(`settings.reading.markRead5s`)||`5`},{value:`10`,label:this.i18nStore?.t(`settings.reading.markRead10s`)||`10`},{value:`-1`,label:this.i18nStore?.t(`settings.reading.markReadNever`)||`-1`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.composeFormat`)}">
          <alps-select label="${this.i18nStore?.t(`settings.reading.composeFormat`)}" @change=${e=>this.handleUpdate(e,`composeFormat`)} .value=${this.settingsState.composeFormat}
            .options=${[{value:`html`,label:this.i18nStore?.t(`settings.reading.richText`)||`html`},{value:`text`,label:this.i18nStore?.t(`settings.reading.plainText`)||`text`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.messageSortCriteria`)}" description="${this.i18nStore?.t(`settings.reading.messageSortCriteriaDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.reading.messageSortCriteria`)}" @change=${e=>this.handleUpdate(e,`messageSortCriteria`)} .value=${this.settingsState.messageSortCriteria}
            .options=${[{value:`date`,label:this.i18nStore?.t(`settings.reading.sortDate`)||`date`},{value:`uid`,label:this.i18nStore?.t(`settings.reading.sortUid`)||`uid`}]}>
          </alps-select>
        </alps-setting-group>
    `}renderAppearance(){return b`
        
        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.colorTheme`)}" description="${this.i18nStore?.t(`settings.appearance.colorThemeDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.appearance.colorTheme`)}" @change=${e=>this.handleUpdate(e,`colorFamily`)} .value=${ke(this.settingsState.colorFamily)}
            .options=${[{value:`alps`,label:`Alps`},{value:`migadu`,label:`Migadu`},{value:`nord`,label:`Nord`},{value:`ocean`,label:`Ocean`}]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.themeMode`)}" description="${this.i18nStore?.t(`settings.appearance.themeModeDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.appearance.themeMode`)}" @change=${e=>this.handleUpdate(e,`themeMode`)} .value=${this.settingsState.themeMode}
            .options=${[{value:`light`,label:this.i18nStore?.t(`settings.appearance.light`)||`light`},{value:`dark`,label:this.i18nStore?.t(`settings.appearance.dark`)||`dark`},{value:`auto`,label:this.i18nStore?.t(`settings.appearance.systemAuto`)||`auto`}]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.layoutMode`)}" description="${this.i18nStore?.t(`settings.appearance.layoutModeDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.appearance.layoutMode`)}" @change=${e=>this.handleUpdate(e,`layoutMode`)} .value=${this.settingsState.layoutMode}
            .options=${[{value:`vertical`,label:this.i18nStore?.t(`settings.appearance.vertical`)||`vertical`},{value:`horizontal`,label:this.i18nStore?.t(`settings.appearance.horizontal`)||`horizontal`},{value:`full`,label:this.i18nStore?.t(`settings.appearance.fullScreen`)||`full`}]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.listDensity`)}" description="${this.i18nStore?.t(`settings.appearance.listDensityDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.appearance.listDensity`)}" @change=${e=>this.handleUpdate(e,`densityMode`)} .value=${this.settingsState.densityMode}
            .options=${[{value:`loose`,label:this.i18nStore?.t(`settings.appearance.loose`)||`loose`},{value:`normal`,label:this.i18nStore?.t(`settings.appearance.normal`)||`normal`},{value:`compact`,label:this.i18nStore?.t(`settings.appearance.compact`)||`compact`},{value:`ultra-compact`,label:this.i18nStore?.t(`settings.appearance.ultraCompact`)||`ultra-compact`}]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group description="${this.i18nStore?.t(`settings.appearance.showSenderAvatarsDesc`)}">
          <label class="checkbox-label">
            <input type="checkbox"
                   ?checked=${this.settingsState.showSenderAvatars}
                   @change=${e=>this.handleUpdate(e,`showSenderAvatars`)}>
            ${this.i18nStore?.t(`settings.appearance.showSenderAvatars`)}
          </label>
        </alps-setting-group>
    `}renderLocalization(){return b`
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.language`)}">
          <!-- Each language is named in its own words and marked with its own
               language, so a screen reader reads "Deutsch" in German rather
               than in the language of the page around it. Auto is a word of
               the page's own language, and is not marked. -->
          <alps-select label="${this.i18nStore?.t(`settings.localization.language`)}" @change=${e=>this.handleUpdate(e,`language`)} .value=${this.settingsState.language}
            .options=${[{value:`auto`,label:this.i18nStore?.t(`settings.localization.auto`)||`auto`},{value:`en`,lang:M(`en`),label:this.i18nStore?.t(`settings.localization.english`)||`en`},{value:`de`,lang:M(`de`),label:this.i18nStore?.t(`settings.localization.german`)||`de`},{value:`it`,lang:M(`it`),label:this.i18nStore?.t(`settings.localization.italian`)||`it`},{value:`es`,lang:M(`es`),label:this.i18nStore?.t(`settings.localization.spanish`)||`es`},{value:`rs`,lang:M(`rs`),label:this.i18nStore?.t(`settings.localization.serbian`)||`rs`},{value:`sr`,lang:M(`sr`),label:this.i18nStore?.t(`settings.localization.serbianLatin`)||`sr`},{value:`fr`,lang:M(`fr`),label:this.i18nStore?.t(`settings.localization.french`)||`fr`},{value:`pt`,lang:M(`pt`),label:this.i18nStore?.t(`settings.localization.portuguese`)||`pt`},{value:`pt-BR`,lang:M(`pt-BR`),label:this.i18nStore?.t(`settings.localization.portugueseBrazil`)||`pt-BR`},{value:`da`,lang:M(`da`),label:this.i18nStore?.t(`settings.localization.danish`)||`da`},{value:`ru`,lang:M(`ru`),label:this.i18nStore?.t(`settings.localization.russian`)||`ru`},{value:`tr`,lang:M(`tr`),label:this.i18nStore?.t(`settings.localization.turkish`)||`tr`},{value:`id`,lang:M(`id`),label:this.i18nStore?.t(`settings.localization.indonesian`)||`id`},{value:`hi`,lang:M(`hi`),label:this.i18nStore?.t(`settings.localization.hindi`)||`hi`},{value:`ja`,lang:M(`ja`),label:this.i18nStore?.t(`settings.localization.japanese`)||`ja`},{value:`ko`,lang:M(`ko`),label:this.i18nStore?.t(`settings.localization.korean`)||`ko`},{value:`zh-Hans`,lang:M(`zh-Hans`),label:this.i18nStore?.t(`settings.localization.chineseSimplified`)||`zh-Hans`},{value:`zh-Hant`,lang:M(`zh-Hant`),label:this.i18nStore?.t(`settings.localization.chineseTraditional`)||`zh-Hant`},{value:`ar`,lang:M(`ar`),label:this.i18nStore?.t(`settings.localization.arabic`)||`ar`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.timeFormat`)}">
          <alps-select label="${this.i18nStore?.t(`settings.localization.timeFormat`)}" @change=${e=>this.handleUpdate(e,`hourFormat`)} .value=${this.settingsState.hourFormat}
            .options=${[{value:`auto`,label:this.i18nStore?.t(`settings.localization.auto`)||`auto`},{value:`12`,label:this.i18nStore?.t(`settings.localization.format12h`)||`12`},{value:`24`,label:this.i18nStore?.t(`settings.localization.format24h`)||`24`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.dateFormat`)}">
          <alps-select label="${this.i18nStore?.t(`settings.localization.dateFormat`)}" @change=${e=>this.handleUpdate(e,`dateFormat`)} .value=${this.settingsState.dateFormat}
            .options=${[{value:`auto`,label:this.i18nStore?.t(`settings.localization.auto`)||`auto`},{value:`YYYY-MM-DD`,label:`YYYY-MM-DD`},{value:`MM/DD/YYYY`,label:`MM/DD/YYYY`},{value:`DD.MM.YYYY`,label:`DD.MM.YYYY`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.weekStart`)}">
          <alps-select label="${this.i18nStore?.t(`settings.localization.weekStart`)}" @change=${e=>this.handleUpdate(e,`weekStart`)} .value=${String(this.settingsState.weekStart??1)}
            .options=${[{value:`1`,label:this.i18nStore?.t(`settings.localization.monday`)||`Monday`},{value:`0`,label:this.i18nStore?.t(`settings.localization.sunday`)||`Sunday`}]}>
          </alps-select>
        </alps-setting-group>
    `}};N([s({context:Be})],Pc.prototype,`settingsStore`,void 0),N([s({context:A})],Pc.prototype,`i18nStore`,void 0),N([_({type:String})],Pc.prototype,`category`,void 0),N([d()],Pc.prototype,`settingsState`,void 0),N([d()],Pc.prototype,`isMobile`,void 0),N([d()],Pc.prototype,`pendingLeave`,void 0),Pc=N([o(`settings-window`)],Pc);var Fc=class extends c{constructor(...e){super(...e),this.changed=()=>this.requestUpdate(),this.close=()=>this.renderRoot.querySelector(`ui-modal`)?.close()}connectedCallback(){super.connectedCallback(),this.settingsStore?.addEventListener(`change`,this.changed),this.i18nStore?.addEventListener(`change`,this.changed)}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore?.removeEventListener(`change`,this.changed),this.i18nStore?.removeEventListener(`change`,this.changed)}static{this.styles=[j,St,y`
    ui-modal::part(card) {
      box-sizing: border-box;
      max-inline-size: calc(100vw - 32px);
      max-block-size: calc(100dvh - 32px);
      overflow: auto;
      overscroll-behavior: contain;
    }
    p { margin-block: 0 16px; }
    h4 { font-size: inherit; margin-block: 20px 8px; color: var(--text-primary); }
    dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 10px 20px; margin: 0; }
    dt { text-align: end; }
    dd { margin: 0; overflow-wrap: anywhere; }
    kbd { font: inherit; font-size: 12px; border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 6px; white-space: nowrap; }
    label { display: flex; align-items: center; gap: 8px; min-block-size: 32px; color: var(--text-primary); cursor: pointer; }
    input { accent-color: var(--accent-color); }
    .hint { color: var(--text-muted); font-size: 12px; margin-block: 4px 16px; }
  `]}render(){let e=e=>this.i18nStore?.t(e);return b`
      <ui-modal heading=${e(`shortcuts.title`)} .dismissible=${!0} width="560px" @cancel=${this.close}>
        <label for="enabled"><input id="enabled" type="checkbox" autofocus
          aria-describedby="enabled-hint"
          .checked=${this.settingsStore?.getState().keyboardShortcuts!==!1}
          @change=${e=>{this.settingsStore.updateSettings({keyboardShortcuts:e.target.checked})}}
        >${e(`shortcuts.enabled`)}</label>
        <p id="enabled-hint" class="hint">${e(`shortcuts.enabledHint`)}</p>
        <dl><dt><kbd>?</kbd></dt><dd>${e(`shortcuts.title`)}</dd></dl>
        <h4>${e(`shortcuts.mail`)}</h4>
        <p>${e(`shortcuts.context`)}</p>
        <dl>
          <dt><kbd>q</kbd></dt><dd>${e(`messageReader.markRead`)}</dd>
          <dt><kbd>z</kbd></dt><dd>${e(`messageReader.archive`)}</dd>
        </dl>
        <h4>${e(`shortcuts.navigation`)}</h4>
        <dl>
          <dt><kbd>↓</kbd> <kbd>↑</kbd></dt><dd>${e(`shortcuts.move`)}</dd>
          <dt><kbd>${e(`shortcuts.enter`)}</kbd></dt><dd>${e(`shortcuts.open`)}</dd>
          <dt><kbd>${e(`shortcuts.space`)}</kbd></dt><dd>${e(`shortcuts.select`)}</dd>
          <dt><kbd>${e(`shortcuts.escape`)}</kbd></dt><dd>${e(`shortcuts.dismiss`)}</dd>
        </dl>
        <button slot="actions" class="btn-confirm" type="button" @click=${this.close}>${e(`general.close`)}</button>
      </ui-modal>
    `}};N([s({context:A})],Fc.prototype,`i18nStore`,void 0),N([s({context:Be})],Fc.prototype,`settingsStore`,void 0),Fc=N([o(`keyboard-shortcuts-dialog`)],Fc);var $=class extends c{constructor(...e){super(...e),this.attachments=[],this.mailbox=``,this.messageUid=``,this.activeIndex=0,this.zoom=1,this.rotation=0,this.loadedText=null,this.textLoading=!1,this.textError=null,this.copied=!1,this.pdfUrl=null,this.pdfLoading=!1,this.pdfError=null,this.loadToken=0,this.previouslyFocused=null,this.handleKeyDown=e=>{if(e.key===`Escape`)e.preventDefault(),e.stopPropagation(),this.close();else if(e.key===`ArrowLeft`||e.key===`ArrowRight`){e.preventDefault(),e.stopPropagation();let t=getComputedStyle(this).direction===`rtl`;e.key===(t?`ArrowRight`:`ArrowLeft`)?this.prev():this.next()}else(e.key===`ArrowUp`||e.key===`ArrowDown`)&&e.stopPropagation()}}connectedCallback(){super.connectedCallback(),this.previouslyFocused=ct(),window.addEventListener(`keydown`,this.handleKeyDown,!0)}firstUpdated(){let e=this.shadowRoot?.querySelector(`dialog.backdrop`);e&&!e.open&&(e.showModal(),yt(e)),this.shadowRoot?.querySelector(`.close-btn`)?.focus()}disconnectedCallback(){super.disconnectedCallback(),xt(this.shadowRoot?.querySelector(`dialog`)),window.removeEventListener(`keydown`,this.handleKeyDown,!0),this.replacePdfUrl(null);let e=this.previouslyFocused;this.previouslyFocused=null,e?.isConnected&&e.focus?.()}updated(e){(e.has(`activeIndex`)||e.has(`attachments`))&&(this.zoom=1,this.rotation=0,this.copied=!1,this.loadContent())}get current(){if(!this.attachments||this.attachments.length===0)return null;let e=Math.max(0,Math.min(this.activeIndex,this.attachments.length-1));return this.attachments[e]}nameOf(e){return e?.Filename||e?.filename||e?.name||this.i18nStore?.t(`messageReader.unknownAttachment`)||``}sizeOf(e){return e?.Size||e?.size||0}infoOf(e){return fo(e?.MIMEType||e?.contentType,this.nameOf(e))}urlOf(e){return Za(this.mailbox,this.messageUid,e)}replacePdfUrl(e){this.pdfUrl&&URL.revokeObjectURL(this.pdfUrl),this.pdfUrl=e}async loadContent(){let e=this.current;if(!e)return;let t=++this.loadToken;this.replacePdfUrl(null),this.pdfLoading=!1,this.pdfError=null,this.textLoading=!1,this.textError=null,this.loadedText=null;let n=this.infoOf(e),r=this.urlOf(e);if(r){if(n.previewKind===`text`){if(this.sizeOf(e)>2097152)return;this.textLoading=!0;try{let e=await F(`${r}&text=1`);if(!e.ok)throw Error(String(e.status));let n=await e.text();if(t!==this.loadToken)return;this.loadedText=n}catch(e){if(t!==this.loadToken)return;this.textError=e?.message||`error`}finally{t===this.loadToken&&(this.textLoading=!1)}}else if(n.previewKind===`pdf`){this.pdfLoading=!0;try{let e=await F(r);if(!e.ok)throw Error(String(e.status));let n=await e.blob();if(n.type!==`application/pdf`&&(n=new Blob([n],{type:`application/pdf`})),t!==this.loadToken)return;this.replacePdfUrl(URL.createObjectURL(n))}catch(e){if(t!==this.loadToken)return;this.pdfError=e?.message||`error`}finally{t===this.loadToken&&(this.pdfLoading=!1)}}}}close(){xt(this.shadowRoot?.querySelector(`dialog`)),this.dispatchEvent(new CustomEvent(`close`,{bubbles:!0,composed:!0}))}prev(){this.attachments.length<=1||(this.activeIndex=(this.activeIndex-1+this.attachments.length)%this.attachments.length)}next(){this.attachments.length<=1||(this.activeIndex=(this.activeIndex+1)%this.attachments.length)}zoomIn(){this.zoom=Math.min(4,Math.round((this.zoom+.25)*100)/100)}zoomOut(){this.zoom=Math.max(.25,Math.round((this.zoom-.25)*100)/100)}resetZoom(){this.zoom=1,this.rotation=0}rotate(){this.rotation=(this.rotation+90)%360}async copyContent(){if(this.loadedText)try{await navigator.clipboard.writeText(this.loadedText),this.copied=!0,setTimeout(()=>{this.copied=!1},2e3)}catch{}}download(){let e=this.current,t=this.urlOf(e);if(!t)return;let n=document.createElement(`a`);n.href=t,n.download=this.nameOf(e)||`download`,document.body.appendChild(n),n.click(),document.body.removeChild(n)}openPdfInNewTab(){this.pdfUrl&&window.open(this.pdfUrl,`_blank`,`noopener,noreferrer`)}static{this.styles=[j,y`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 30000;
      user-select: none;
    }
    /* The dialog is the whole window, and paints the overlay itself. */
    .backdrop {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 0;
      border: none;
      color: inherit;
      background: var(--modal-backdrop, rgba(255, 255, 255, 0.85));
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .backdrop::backdrop {
      background: transparent;
    }
    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
      flex-shrink: 0;
      gap: 16px;
    }
    .meta-info {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1;
    }
    .type-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: var(--bg-secondary);
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    .file-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .file-title {
      font-size: 14px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .file-sub {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      gap: 8px;
    }
    .actions-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .action-btn, .close-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 32px;
      min-width: 32px;
      padding: 0 10px;
      border-radius: 6px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      font-size: 12px;
      cursor: pointer;
      box-sizing: border-box;
    }
    .action-btn.icon-only, .close-btn {
      padding: 0;
      width: 32px;
    }
    .action-btn:hover, .close-btn:hover {
      background: var(--hover-color, var(--bg-secondary));
    }
    .action-btn .icon {
      width: 16px;
      height: 16px;
    }
    .preview-body {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 24px;
      box-sizing: border-box;
    }
    .image-viewport {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .preview-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: transform 0.2s ease;
      border-radius: 4px;
    }
    .pdf-container, .text-container {
      width: 100%;
      height: 100%;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }
    .pdf-container {
      max-width: 1000px;
      overflow: hidden;
    }
    .pdf-frame {
      width: 100%;
      height: 100%;
      border: none;
    }
    .text-container {
      max-width: 900px;
      overflow: auto;
      padding: 16px;
      box-sizing: border-box;
      font-family: var(--font-mono);
      font-size: 13px;
      line-height: 1.6;
      color: var(--text-primary);
      user-select: text;
    }
    .code-line {
      display: flex;
      gap: 16px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .line-num {
      color: var(--text-muted);
      width: 36px;
      text-align: end;
      flex-shrink: 0;
      user-select: none;
    }
    .line-text {
      flex: 1;
    }
    .audio-card, .fallback-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      padding: 32px 40px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
      color: var(--text-primary);
      max-width: 480px;
      width: 100%;
      box-sizing: border-box;
    }
    .card-icon {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      color: var(--text-muted);
    }
    .card-icon .icon {
      width: 32px;
      height: 32px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 600;
      word-break: break-word;
    }
    .card-desc {
      font-size: 13px;
      color: var(--text-muted);
    }
    audio {
      width: 100%;
    }
    .video-container {
      max-width: 1000px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.9);
    }
    video {
      max-width: 100%;
      max-height: 80vh;
    }
    .nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2;
    }
    .nav-arrow.prev { inset-inline-start: 24px; }
    .nav-arrow.next { inset-inline-end: 24px; }
    .loading-state, .error-state {
      color: var(--text-muted);
      font-size: 14px;
    }
    .error-state {
      color: var(--error);
    }
  `]}render(){let e=this.current;if(!e)return b``;let t=e=>this.i18nStore?.t(e)??e,n=this.nameOf(e),r=this.sizeOf(e),i=this.infoOf(e),a=this.urlOf(e),o=this.attachments.length,s=e=>{e.target===e.currentTarget&&this.close()};return b`
      <dialog class="backdrop" aria-labelledby="preview-title" @click=${s} @close=${()=>this.close()}>
        <div class="preview-header">
          <div class="meta-info">
            <div
              class="type-badge ${i.themeClass}"
              style="${i.color?`color: ${i.color}; background: color-mix(in srgb, ${i.color} 12%, transparent)`:``}"
            >${P(i.icon)}</div>
            <div class="file-details">
              <span class="file-title" id="preview-title" title="${n}"><bdi>${n}</bdi></span>
              <span class="file-sub">
                <span><bdi>${ge(r,this.i18nStore)}</bdi></span>
                ${o>1?b`<span>•</span><span>${this.activeIndex+1} / ${o}</span>`:``}
              </span>
            </div>
          </div>
          <div class="actions-bar">
            ${i.isImage?b`
              <button class="action-btn icon-only zoom-out" @click=${this.zoomOut} title="${t(`attachment.zoomOut`)}">${P(`magnifyingGlassMinus`)}</button>
              <button class="action-btn icon-only fit" @click=${this.resetZoom} title="${t(`attachment.fitToScreen`)}">${P(`arrowsInSimple`)}</button>
              <button class="action-btn icon-only zoom-in" @click=${this.zoomIn} title="${t(`attachment.zoomIn`)}">${P(`magnifyingGlassPlus`)}</button>
              <button class="action-btn icon-only rotate" @click=${this.rotate} title="${t(`attachment.rotate`)}">${P(`arrowCounterClockwise`)}</button>
            `:``}
            ${i.previewKind===`text`&&this.loadedText?b`
              <button class="action-btn copy" @click=${this.copyContent} title="${t(`attachment.copyContent`)}">
                ${P(`copy`)}
                <span>${this.copied?t(`attachment.copied`):t(`attachment.copyContent`)}</span>
              </button>
            `:``}
            ${i.isPdf&&this.pdfUrl?b`
              <button class="action-btn icon-only new-tab" @click=${this.openPdfInNewTab} title="${t(`attachment.openInNewTab`)}">${P(`arrowsOutSimple`)}</button>
            `:``}
            ${a?b`
              <button class="action-btn icon-only download" @click=${this.download} title="${t(`attachment.download`)}">${P(`downloadSimple`)}</button>
            `:``}
            <button class="close-btn" @click=${this.close} title="${t(`attachment.close`)}">${P(`x`)}</button>
          </div>
        </div>

        <div class="preview-body" @click=${s}>
          ${o>1?b`
            <button class="nav-arrow prev" @click=${this.prev} title="${t(`attachment.previous`)}">${P(`caretLeft`)}</button>
            <button class="nav-arrow next" @click=${this.next} title="${t(`attachment.next`)}">${P(`caretRight`)}</button>
          `:``}
          ${this.renderContent(i,a,n,r)}
        </div>
        <!-- The shell's toasts, while this is open. A modal dialog is drawn
             above everything else in the page and makes the rest inert, so a
             toast left in the shell was hidden behind it and its Undo could
             not be pressed. -->

      </dialog>
    `}renderContent(e,t,n,r){let i=e=>this.i18nStore?.t(e)??e;if(!t)return this.renderFallback(e,t,n,r);if(e.isImage)return b`
        <div class="image-viewport" @click=${e=>{e.target===e.currentTarget&&this.close()}}>
          <img
            src="${t}"
            alt="${n}"
            class="preview-image"
            style="transform: scale(${this.zoom}) rotate(${this.rotation}deg);"
            @dblclick=${()=>{this.zoom=this.zoom===1?2:1}}
          />
        </div>
      `;if(e.isPdf)return this.pdfLoading?b`<div class="loading-state">${i(`attachment.loadingPreview`)}</div>`:this.pdfError?b`<div class="error-state">${i(`attachment.errorLoading`)}</div>`:this.pdfUrl?b`
        <div class="pdf-container">
          <iframe src="${this.pdfUrl}#toolbar=1" class="pdf-frame" title="${n}"></iframe>
        </div>
      `:this.renderFallback(e,t,n,r);if(e.previewKind===`text`){if(r>2097152)return this.renderFallback(e,t,n,r);if(this.textLoading)return b`<div class="loading-state">${i(`attachment.loadingPreview`)}</div>`;if(this.textError)return b`<div class="error-state">${i(`attachment.errorLoading`)}</div>`;if(this.loadedText===null)return b``;let a=this.loadedText.split(`
`);return b`
        <div class="text-container">
          ${a.map((e,t)=>b`
            <div class="code-line"><span class="line-num">${t+1}</span><span class="line-text">${e||` `}</span></div>
          `)}
        </div>
      `}return e.isAudio?b`
        <div class="audio-card">
          <div class="card-icon" style="${e.color?`color: ${e.color}; background: color-mix(in srgb, ${e.color} 12%, transparent)`:``}">
            ${P(`fileAudio`)}
          </div>
          <div class="card-title"><bdi>${n}</bdi></div>
          <audio controls src="${t}"></audio>
        </div>
      `:e.isVideo?b`
        <div class="video-container">
          <video controls playsinline src="${t}"></video>
        </div>
      `:this.renderFallback(e,t,n,r)}renderFallback(e,t,n,r){let i=e=>this.i18nStore?.t(e)??e;return b`
      <div class="fallback-card">
        <div class="card-icon">${P(e.icon)}</div>
        <div class="card-title"><bdi>${n}</bdi></div>
        <div class="card-desc">${i(`attachment.cannotPreview`)} (<bdi>${ge(r,this.i18nStore)}</bdi>)</div>
        ${t?b`
          <button class="action-btn download" @click=${this.download}>
            ${P(`downloadSimple`)}
            <span>${i(`attachment.download`)}</span>
          </button>
        `:``}
      </div>
    `}};N([s({context:A,subscribe:!0})],$.prototype,`i18nStore`,void 0),N([_({type:Array})],$.prototype,`attachments`,void 0),N([_({type:String})],$.prototype,`mailbox`,void 0),N([_({type:String})],$.prototype,`messageUid`,void 0),N([_({type:Number})],$.prototype,`activeIndex`,void 0),N([d()],$.prototype,`zoom`,void 0),N([d()],$.prototype,`rotation`,void 0),N([d()],$.prototype,`loadedText`,void 0),N([d()],$.prototype,`textLoading`,void 0),N([d()],$.prototype,`textError`,void 0),N([d()],$.prototype,`copied`,void 0),N([d()],$.prototype,`pdfUrl`,void 0),N([d()],$.prototype,`pdfLoading`,void 0),N([d()],$.prototype,`pdfError`,void 0),$=N([o(`alps-attachment-preview`)],$);var Ic=new Set;function Lc(e){Ic.add(e)}function Rc(){for(let e of Ic)if(e.hasKeptEdit)return!0;return!1}var zc=3e3,Bc=15e3,Vc=3e3,Hc=1500,Uc=new Set([`/login`,`/login/webauthn`,`/settings`,`/settings/*`,`/original`,`/print`]);function Wc(e){return(e.replace(/^#/,``)||`/`).split(`?`)[0]}var Gc=[2e3,5e3,15e3,3e4],Kc=[`caldav`,`carddav`],qc=e=>`alps_dav_active:${e}`;function Jc(e){if(!e)return null;try{let t=JSON.parse(localStorage.getItem(qc(e))??`null`);return Array.isArray(t)?t.filter(e=>Kc.includes(e)):null}catch{return null}}function Yc(e,t){if(e)try{localStorage.setItem(qc(e),JSON.stringify(t.filter(e=>Kc.includes(e))))}catch{}}var Xc=class extends c{static{this.styles=y`
    /* The offline modal's glyph. It was a hand-written <use> pointing at the
       sprite with its OWN cache-busting query — ?v=7, where renderIcon uses
       ?v=11 — so the browser treated it as a second 64 KB resource that nothing
       else in the app ever requests. Which made the one icon shown BECAUSE the
       network is down the one icon guaranteed not to be in cache: a fresh
       fetch, while offline, that cannot succeed. */
    .offline-icon {
      color: var(--text-muted, #9ca3af);
      margin-bottom: 16px;
    }
    .offline-icon .icon {
      width: 48px;
      height: 48px;
      fill: currentColor;
    }

    :host {
      display: block;
      height: 100vh;
      height: 100dvh;
      width: 100vw;
    }

    /* The routed page's wrapper: no box of its own, so every page lays out
       exactly as it did as the host's child. Beneath the Settings window it
       takes one, to be a stacking context at 0: everything the page stacks,
       its header at 20000 included, then sits under the window (900) and the
       composers above that. Only then, because outside Settings a docked
       composer must stay under the page's own header. */
    .route-view {
      display: contents;
    }
    .route-view.behind-window {
      display: block;
      position: relative;
      z-index: 0;
      height: 100%;
    }


  `}constructor(){super(),this.composeStore=new ea,this.settingsStore=new We,this.i18nStore=new _e,this.linkedAccountsStore=As,this.activeComposers=[],this.composerReady=!1,this.toasts=[],this.attachmentPreview=null,this.toastIdCounter=0,this.shortcutsOpen=!1,this.isOffline=!navigator.onLine,this.offlineCountdown=0,this.offlineInterval=null,this._handleOpenAttachmentPreview=e=>{let{attachments:t,mailbox:n,messageUid:r,index:i}=e.detail??{};Array.isArray(t)&&t.length!==0&&(this.attachmentPreview={attachments:t,mailbox:n,messageUid:r,index:i??0})},this._handlePluginsUpdated=()=>{let e=this.getRoutes();for(let t of[...this.pluginPages.keys()])t in e||this.pluginPages.delete(t);this.router.setRoutes(e),this.requestUpdate()},this._handleUserLoggedIn=()=>{this._fetchSessionData()},this._handleDAVConnectionsUpdated=e=>{let{service:t,configured:n}=e.detail??{};if(t===`caldav`||t===`carddav`){if(e.detail?.unchanged!==!0)for(let e of I.routes)e.pluginId===t&&this.pluginPages.delete(e.path);t===`caldav`&&e.detail?.unchanged!==!0&&(this.mailboxPage=null),typeof n==`boolean`&&I.setDAVConnectionConfigured(t,n),this.requestUpdate(),this._fetchSessionData()}},this.sessionDataGeneration=0,this._handleGlobalDragOver=e=>{e.preventDefault()},this._handleGlobalDrop=e=>{e.preventDefault(),window.dispatchEvent(new CustomEvent(`alps-composer-drop`))},this._handleAuthError=()=>{ko()||(sessionStorage.clear(),He(),window.dispatchEvent(new CustomEvent(`session-cleared`,{detail:{reason:`expired`}})),ia(`sessionExpired`),window.location.hash=`#/login`)},this._verifyConnectivity=async()=>{if(!navigator.onLine)return!1;try{let e=await fetch(`/site.webmanifest`,{method:`HEAD`,cache:`no-store`});return e.status!==502&&e.status!==503&&e.status!==504}catch{return!1}},this._handleOnlineEvent=async()=>{await this._verifyConnectivity()?(this.isOffline=!1,this._stopOfflineCountdown()):this._handleOfflineEvent()},this._verifyingNetworkError=!1,this._handleNetworkError=async()=>{if(!(this.isOffline||this._verifyingNetworkError)){this._verifyingNetworkError=!0;try{await this._verifyConnectivity()||this._handleOfflineEvent()}finally{this._verifyingNetworkError=!1}}},this._handleOfflineEvent=()=>{this.isOffline||(this.isOffline=!0,this.offlineCountdown=10,this._startOfflineCountdown())},this._isPinging=!1,this._handleShowToast=e=>{let t=++this.toastIdCounter,n={id:t,message:e.detail.message??(e.detail.i18nKey?this.i18nStore?.t(e.detail.i18nKey):void 0)??``,type:e.detail.type,actionLabel:e.detail.actionLabel||``,actionFn:e.detail.actionFn,dismissFn:e.detail.dismissFn,timeout:e.detail.duration??zc,show:!1};n.timeout>0&&(n.expiresAt=Date.now()+n.timeout),this.toasts=[...this.toasts,n],requestAnimationFrame(()=>{this.toasts=this.toasts.map(e=>e.id===t?{...e,show:!0}:e)})},this._handleBeforeUnload=e=>{if(this.activeComposers.some(e=>e.isSending))return e.preventDefault(),`You have a message currently sending. Are you sure you want to leave?`},this._handleUpdateAvailable=()=>{this._handleShowToast(new CustomEvent(`show-toast`,{detail:{i18nKey:`update.available`,actionLabel:this.i18nStore?.t(`update.reload`),actionFn:()=>{if(!this.composeStore.persistNow())return this._handleShowToast(new CustomEvent(`show-toast`,{detail:{i18nKey:`composer.draftSaveFailedKeepOpen`,type:`error`,duration:6e3}})),!1;Ye()},duration:Bc}}))},this._handlePluginLoadFailed=()=>{this._handleShowToast(new CustomEvent(`show-toast`,{detail:{i18nKey:`general.pageLoadFailed`,type:`error`,actionLabel:this.i18nStore.t(`general.backToMail`),actionFn:()=>{window.location.hash=`#/mailbox/INBOX`},duration:0}}))},this.composerModule=null,this.composerFailed=!1,this.composerFailureToast=null,this._handleComposeChange=()=>{let e=this.composeStore.getState().activeComposers;e.length>0?this.ensureComposerLoaded().catch(()=>this._composerUnavailable()):Ze(),this._hasStructuralComposeChange(this.activeComposers,e)&&(this.activeComposers=e)},this._handleSettingsChange=()=>{let e=this.settingsStore.getState();Fo.setLogoutTime(e.autoLogout??0),this.i18nStore.setLanguage(e.language??`auto`)},this.mailboxPage=null,this.pluginPages=new Map,this._handleSessionCleared=()=>{this.shortcutsOpen=!1,this.sessionDataGeneration++,clearTimeout(this.sessionDataRetry),this.mailboxPage=null,this.pluginPages.clear(),I.setRememberedActive(null),I.setEnabledPlugins(null)},this.loadFailurePath=null,this.router=new un(this.getRoutes(),()=>I.activeKnown?b`<div>404 — ${this.i18nStore.t(`general.notFound`)}</div>`:n,e=>{let t=this.router.currentPath;t!==this.loadFailurePath&&(this.loadFailurePath=t,kt()),this.endBootOnNavigation(e),this.trackSettingsEntry(e),e&&Ze(),this.requestUpdate()}),this.lastHash=null,this.lastPageEntryId=null,this.lastSettingsEntry=null,this._handleBackgroundChanged=()=>{this.lastSettingsEntry=ws(),this.requestUpdate()},this._handleSettingsCategory=e=>{history.replaceState(history.state,``,_s(e.detail.category)),this.lastHash=window.location.hash,this.requestUpdate()},this._closeSettings=()=>{let e=ws();e?.background&&e.depth>0&&e.origin!==null?history.go(-e.depth):window.location.replace(e?.background??`#/`)},this.openShortcuts=()=>{this.shortcutsOpen=!0},this.handleShortcutHelp=e=>{e.key!==`?`||this.shortcutsOpen||this.isOffline||this.attachmentPreview||this.settingsStore.getState().keyboardShortcuts!==!1&&Qs(e)&&(Wc(window.location.hash).startsWith(`/login`)||Y(window.location.hash)||(e.preventDefault(),this.openShortcuts()))},new ln(this,()=>this.renderToasts()),this.addController(this.router)}connectedCallback(){super.connectedCallback();let e=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`))||document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));!e&&!window.location.hash.startsWith(`#/login`)&&(window.location.hash=`#/login`),this.settingsStore.setI18n(this.i18nStore),this.composeStore.addEventListener(`change`,this._handleComposeChange),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._handleComposeChange();let t=this.settingsStore.getState().autoLogout??0;Fo.setLogoutTime(t),Fo.onBeforeLogout=()=>this.composeStore.saveAllDirtyDrafts(),this.i18nStore.setLanguage(this.settingsStore.getState().language??`auto`),document.addEventListener(`keydown`,this.handleShortcutHelp),this.addEventListener(`open-shortcuts`,this.openShortcuts),window.addEventListener(`auth-error`,this._handleAuthError),window.addEventListener(`session-cleared`,this._handleSessionCleared),window.addEventListener(`user-logged-in`,this._handleUserLoggedIn),window.addEventListener(xs,this._handleBackgroundChanged),window.addEventListener(`show-toast`,this._handleShowToast),window.addEventListener(`beforeunload`,this._handleBeforeUnload),window.addEventListener(`online`,this._handleOnlineEvent),window.addEventListener(`offline`,this._handleOfflineEvent),window.addEventListener(`network-error`,this._handleNetworkError),window.addEventListener(`dragover`,this._handleGlobalDragOver),window.addEventListener(`drop`,this._handleGlobalDrop),window.addEventListener(`plugins-updated`,this._handlePluginsUpdated),window.addEventListener(`dav-connections-updated`,this._handleDAVConnectionsUpdated),this._handlePluginsUpdated(),window.addEventListener(Tt,this._handlePluginLoadFailed),window.addEventListener(`open-attachment-preview`,this._handleOpenAttachmentPreview),window.addEventListener(at,this._handleUpdateAvailable),nt(()=>this.composeStore.getState().activeComposers.length>0||this.settingsUnsaved()||Rc()),this.isOffline&&this._handleOfflineEvent(),e&&this._fetchSessionData()}settingsUnsaved(){return this.shadowRoot?.querySelector(`settings-window`)?.hasUnsavedChanges===!0}async _fetchSessionData(e=0){let t=++this.sessionDataGeneration;clearTimeout(this.sessionDataRetry);let n=ze();I.activeKnown||I.setRememberedActive(Jc(n));let r=!1;try{let e=await fetch(`/session`);if(r=e.ok||e.status===401,e.ok){let r=await e.json();if(!this.isConnected||t!==this.sessionDataGeneration)return;if(r.EnabledPlugins){let e=r.ActivePlugins??r.EnabledPlugins;I.setEnabledPlugins(r.EnabledPlugins,e),Yc(n,e)}}}catch(e){this.isConnected&&t===this.sessionDataGeneration&&console.error(`Failed to fetch session data`,e)}if(r||!this.isConnected||t!==this.sessionDataGeneration)return;let i=Gc[Math.min(e,Gc.length-1)];this.sessionDataRetry=setTimeout(()=>{this.isConnected&&t===this.sessionDataGeneration&&this._fetchSessionData(e+1)},i)}disconnectedCallback(){super.disconnectedCallback(),this.sessionDataGeneration++,clearTimeout(this.sessionDataRetry),this.composeStore.removeEventListener(`change`,this._handleComposeChange),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),document.removeEventListener(`keydown`,this.handleShortcutHelp),this.removeEventListener(`open-shortcuts`,this.openShortcuts),window.removeEventListener(`auth-error`,this._handleAuthError),window.removeEventListener(`session-cleared`,this._handleSessionCleared),window.removeEventListener(`user-logged-in`,this._handleUserLoggedIn),window.removeEventListener(xs,this._handleBackgroundChanged),window.removeEventListener(`show-toast`,this._handleShowToast),window.removeEventListener(`open-attachment-preview`,this._handleOpenAttachmentPreview),window.removeEventListener(`beforeunload`,this._handleBeforeUnload),window.removeEventListener(`online`,this._handleOnlineEvent),window.removeEventListener(`offline`,this._handleOfflineEvent),window.removeEventListener(`network-error`,this._handleNetworkError),window.removeEventListener(`dragover`,this._handleGlobalDragOver),window.removeEventListener(`drop`,this._handleGlobalDrop),window.removeEventListener(`plugins-updated`,this._handlePluginsUpdated),window.removeEventListener(`dav-connections-updated`,this._handleDAVConnectionsUpdated),window.removeEventListener(Tt,this._handlePluginLoadFailed),window.removeEventListener(at,this._handleUpdateAvailable),nt(null),this._stopOfflineCountdown()}_startOfflineCountdown(){this._stopOfflineCountdown(),this.offlineInterval=window.setInterval(async()=>{if(this.offlineCountdown>1)this.offlineCountdown--;else{if(this.offlineCountdown=10,this._isPinging)return;this._isPinging=!0;try{await this._verifyConnectivity()&&(this.isOffline=!1,this._stopOfflineCountdown())}finally{this._isPinging=!1}}},1e3)}_stopOfflineCountdown(){this.offlineInterval!==null&&(clearInterval(this.offlineInterval),this.offlineInterval=null)}get politeAnnouncement(){return this.announcement(this.newestToast(e=>e!==`error`))}get assertiveAnnouncement(){return this.announcement(this.newestToast(e=>e===`error`))}newestToast(e){for(let t=this.toasts.length-1;t>=0;t--){let n=this.toasts[t];if(n.show&&e(n.type))return n}return null}announcement(e){return e?p(e.id,b`${e.message}`):``}_handleDismissToast(e){this.toasts=this.toasts.map(t=>t.id===e?{...t,show:!1}:t),setTimeout(()=>{this.toasts=this.toasts.filter(t=>t.id!==e)},300)}firstUpdated(){let e=()=>{this.isConnected&&this.ensureComposerLoaded().catch(()=>{})},t=window.requestIdleCallback;typeof t==`function`?t(e,{timeout:Vc}):window.setTimeout(e,Hc)}ensureComposerLoaded(){return this.composerFailed?Promise.reject(Error(`The composer could not be loaded`)):(this.composerModule||=(async()=>{if(await Ce(()=>import(`./alps-floating-composer-BbyUr-Sy.js`),__vite__mapDeps([23,1,4,2,3,10,5,11,24,6,25])),!customElements.get(`alps-floating-composer`))throw Error(`The composer module did not define its window`);this.composerReady=!0})().catch(e=>{throw this.composerModule=null,this.composerFailed=!0,E.error(`Failed to load the composer`,e),e}),this.composerModule)}_composerUnavailable(){for(let e of this.composeStore.getState().activeComposers)!e.dirty&&!e.draftUid&&this.composeStore.closeComposer(e.id);this.toasts.some(e=>e.id===this.composerFailureToast)||(this._handleShowToast(new CustomEvent(`show-toast`,{detail:{message:`${this.i18nStore.t(`composer.windowLoadFailed`)} ${this.i18nStore.t(`general.pageLoadFailedHint`)}`,type:`error`,actionLabel:this.i18nStore.t(`update.reload`),actionFn:()=>{if(!this.composeStore.persistNow())return this._handleShowToast(new CustomEvent(`show-toast`,{detail:{i18nKey:`composer.draftSaveFailedKeepOpen`,type:`error`,duration:6e3}})),!1;$e()},duration:0}})),this.composerFailureToast=this.toastIdCounter)}_hasStructuralComposeChange(e,t){return e.length!==t.length||t.some((t,n)=>{let r=e[n];return r.id!==t.id||!!r.minimized!=!!t.minimized||!!r.isSending!=!!t.isSending||!!r.dirty!=!!t.dirty||!!t.minimized&&(r.subject??``)!==(t.subject??``)})}getMailboxPage(){return this.mailboxPage??=document.createElement(`mailbox-page`)}getRoutes(){let e={"/":()=>this.getMailboxPage(),"/login":()=>b`<login-page></login-page>`,"/mailbox/*":()=>this.getMailboxPage(),"/settings":()=>this.backgroundView(),"/settings/*":()=>this.backgroundView(),"/original":()=>b`<original-message-page></original-message-page>`,"/print":()=>b`<print-page></print-page>`,"/login/webauthn":()=>b`<login-webauthn-page></login-webauthn-page>`};return I.getRoutes().forEach(t=>{e[t.path]=()=>{if(!At(t,()=>this.requestUpdate()))return b`<alps-page-load-error></alps-page-load-error>`;let e=this.pluginPages.get(t.path);return e||(e=document.createElement(t.component),this.pluginPages.set(t.path,e)),e}}),e}endBootOnNavigation(e){if(!e?.oldURL)return;let t=e=>Wc(e).startsWith(`/login`);t(new URL(e.oldURL).hash)||t(window.location.hash)||Zs()}backgroundView(){let e=ws()?.background??null;if(e!==null){let t=Wc(e),n=this.router.matchKey(t);if(n!==null&&!Uc.has(n))return this.router.render(t)}return this.getMailboxPage()}trackSettingsEntry(e){let t=window.location.hash,n=e?.oldURL?new URL(e.oldURL).hash:this.lastHash,r=this.lastSettingsEntry;if(!Y(t)){Y(n??``)&&r?.origin&&Ss()===r.origin&&r.background&&t!==r.background&&(history.replaceState(history.state,``,r.background),t=window.location.hash),this.lastHash=t,this.lastSettingsEntry=null,this.lastPageEntryId=Cs();return}let i=ws();!i&&n!==null?(i=Ts(n,r,this.lastPageEntryId),Es(i)):i?.origin&&i.origin===r?.origin&&Y(n??``)&&i.background!==r.background?(i={...i,background:r.background},Es(i)):i?.origin&&i.origin===this.lastPageEntryId&&n!==null&&!Y(n)&&i.background!==n&&(i={...i,background:n},Es(i)),this.lastHash=t,this.lastSettingsEntry=i}settingsWindow(){return Y(window.location.hash)?b`
      <settings-window
        .category=${vs(window.location.hash)}
        @settings-category=${this._handleSettingsCategory}
        @settings-close=${this._closeSettings}
      ></settings-window>
    `:n}renderToasts(){return b`
      <style>    /* Read out, never seen. Not display: none or visibility: hidden, either of
       which takes the node out of the accessibility tree, where a live region
       has to stay. */
    .toast-announce {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    .toast-stack {
      position: fixed;
      bottom: 24px;
      inset-inline-start: 24px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 8px;
      z-index: 50000;
      pointer-events: none;
    }
      </style>
      <div class="toast-announce" role="status" aria-live="polite" >${this.politeAnnouncement}</div>
      <div class="toast-announce" role="alert" aria-live="assertive" >${this.assertiveAnnouncement}</div>
      <div class="toast-stack" >
        ${g(this.toasts,e=>e.id,e=>b`
          <alps-toast
            .i18nStore=${this.i18nStore}
            .show=${e.show}
            .message=${e.message}
            .actionLabel=${e.actionLabel}
            .onAction=${e.actionFn}
            .onDismiss=${e.dismissFn}
            .timeout=${e.timeout}
            .expiresAt=${e.expiresAt}
            @dismiss=${()=>this._handleDismissToast(e.id)}
          ></alps-toast>
        `)}
      </div>
    `}render(){let e=this.activeComposers.filter(e=>!e.minimized).length,t=this.activeComposers.filter(e=>e.minimized).length,r=0,i=0,a=this.router.render(),o=this.settingsWindow(),s=o!==n;return b`
      <div class="route-view ${s?`behind-window`:``}" ?inert=${s}>${a}</div>
      ${o}
      ${this.shortcutsOpen?b`
        <keyboard-shortcuts-dialog @cancel=${()=>{this.shortcutsOpen=!1}}></keyboard-shortcuts-dialog>
      `:n}

      <!-- Keyed by composer: a window's element is that composer's for its
           whole life. By position, closing the first of three handed the
           second window's element to the third composer, and a send counting
           down in it went on to send the wrong message. -->
      ${this.composerReady?g(this.activeComposers,e=>e.id,(n,a)=>{let o=n.minimized,s=o?0:r++,c=o?i++:0;return b`
          <alps-floating-composer
            .instance=${this.composeStore.getComposer(n.id)??n}
            .index=${a}
            .totalOpen=${e}
            .totalMinimized=${t}
            .openIndex=${s}
            .minimizedIndex=${c}
          ></alps-floating-composer>
        `}):``}
      

      ${this.attachmentPreview?b`
        <alps-attachment-preview
          .attachments=${this.attachmentPreview.attachments}
          .mailbox=${this.attachmentPreview.mailbox}
          .messageUid=${this.attachmentPreview.messageUid}
          .activeIndex=${this.attachmentPreview.index}
          @close=${()=>{this.attachmentPreview=null}}
        ></alps-attachment-preview>
      `:``}

      ${this.isOffline?b`
        <ui-modal heading=${this.i18nStore.t(`offline.title`)} .dismissible=${!1} width="400px">
          <div style="text-align: center; padding: 16px 0;">
            <div class="offline-icon">${P(`wifiSlash`)}</div>
            <div style="font-weight: 500; font-size: 16px; margin-bottom: 8px; color: var(--text-primary, #111827);">
              ${this.i18nStore.t(`offline.description`)}
            </div>
            <div style="color: var(--text-secondary, #4b5563); font-size: 14px;">
              ${this.i18nStore.t(`offline.tryingAgain`,{count:this.offlineCountdown})}
            </div>
          </div>
        </ui-modal>
      `:``}
    `}};N([m({context:ta})],Xc.prototype,`composeStore`,void 0),N([m({context:Be})],Xc.prototype,`settingsStore`,void 0),N([m({context:A})],Xc.prototype,`i18nStore`,void 0),N([m({context:js})],Xc.prototype,`linkedAccountsStore`,void 0),N([d()],Xc.prototype,`activeComposers`,void 0),N([d()],Xc.prototype,`composerReady`,void 0),N([d()],Xc.prototype,`toasts`,void 0),N([d()],Xc.prototype,`attachmentPreview`,void 0),N([d()],Xc.prototype,`shortcutsOpen`,void 0),N([d()],Xc.prototype,`isOffline`,void 0),N([d()],Xc.prototype,`offlineCountdown`,void 0),Xc=N([o(`app-root`)],Xc);var Zc=Object.assign({"../../plugins/caldav/frontend/index.ts":Bt,"../../plugins/carddav/frontend/index.ts":qt,"../../plugins/gpg/frontend/index.ts":an,"../../plugins/managesieve/frontend/index.ts":on,"../../plugins/password/frontend/index.ts":sn});E.info(`Loaded ${Object.keys(Zc).length} frontend plugins.`),Xe(),cn();export{Gt as $,Ii as A,Ar as B,Zi as C,Vi as D,Xi as E,wi as F,Fr as G,Vr as H,yi as I,or as J,rr as K,Ci as L,Ai as M,ji as N,Gi as O,Mi as P,Kt as Q,Si as R,Hi as S,Ki as T,Lr as U,Hr as V,Ir as W,Zt as X,H as Y,Vt as Z,ka as _,Ds as a,ta as b,Io as c,So as d,Ht as et,q as f,La as g,Ra as h,Xs as i,Oi as j,Wi as k,Ro as l,Va as m,X as n,Mt as nt,Os as o,K as p,ar as q,Zs as r,I as rt,Y as s,Lc as t,Lt as tt,Lo as u,Ui as v,Ji as w,Yi as x,Bi as y,Zr as z};