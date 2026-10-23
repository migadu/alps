import{b as e,c as t,f as n,g as r,h as i,m as a,v as o}from"./lit-Br1cDwGJ.js";import{K as s,mt as c,tt as l}from"./index-CNqDyrpU.js";import{a as u,i as d,n as f,r as p,t as m}from"./unsaved-CF-cwXVH.js";var h=new m;function g(){let e=new Date,t=e=>String(e).padStart(2,`0`);return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}`}var _=class extends i{constructor(...e){super(...e),this.loading=!0,this.loadFailed=!1,this.extensions=[],this.ownVacation=!1,this.stored=u,this.draft=u,this.saving=!1,this.error=``,this.visit=h.visit(),this.retainEdit=!0,this.loadRequest=0}static{this.styles=e`
		.loading {
			display: flex;
			justify-content: center;
			align-items: center;
			min-height: 200px;
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
		.state {
			font-size: 13px;
			color: var(--text-muted);
		}
		.state.on {
			color: var(--warning, #f59e0b);
		}
		.notice {
			color: var(--text-secondary);
			line-height: 1.4;
		}
		textarea {
			width: 100%;
			min-height: 140px;
			box-sizing: border-box;
			padding: var(--input-padding, 8px 12px);
			border: 1px solid var(--border-color);
			border-radius: var(--input-radius, 6px);
			background-color: var(--bg-primary);
			color: var(--text-primary);
			font-size: var(--input-font-size, 14px);
			font-family: var(--font-base);
			line-height: 1.5;
			resize: vertical;
			outline: none;
		}
		textarea:focus {
			border-color: var(--accent-color, #2563eb);
			box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
		}
		.dates {
			display: flex;
			gap: 16px;
			flex-wrap: wrap;
		}
		.dates > label {
			display: flex;
			flex-direction: column;
			gap: 6px;
			flex: 1;
			min-width: 160px;
		}
		.field-label {
			font-size: 13px;
			color: var(--text-secondary);
		}
		.actions {
			display: flex;
			align-items: center;
			gap: 12px;
			flex-wrap: wrap;
		}
		.error-message {
			color: var(--danger-color, #dc2626);
			font-size: 13px;
		}
	`}connectedCallback(){super.connectedCallback(),this.visit=h.visit(),this.retainEdit=!0,this.load()}disconnectedCallback(){super.disconnectedCallback(),!(!this.retainEdit||this.loading||this.loadFailed)&&(this.dirty||this.saving?h.keep(JSON.stringify(this.stored),this.draft,this.visit):h.forget(this.visit))}discardUnsavedChanges(){this.retainEdit=!1,h.forget(this.visit)}async load(){let e=this.visit,t=h.revision,n=++this.loadRequest,r=()=>this.visit===e&&n===this.loadRequest&&h.current(e);this.loading=!0,this.loadFailed=!1;try{let{reply:n,extensions:i,ownVacation:a}=await p.fetchAutoReply();if(!r())return;if(t!==h.revision)return this.load();this.extensions=i,this.ownVacation=a,this.stored=n??u,this.draft=this.offersDates?this.stored:{...this.stored,start:``,end:``};let o=this.isConnected?h.take(JSON.stringify(this.stored),e):null;o&&(this.draft=o)}catch(e){if(!r())return;console.error(`Failed to fetch the auto-reply`,e),this.loadFailed=!0}finally{r()&&(this.loading=!1)}}t(e,t){return this.i18nStore?.t(e,t)??e}get offersDates(){return this.extensions.includes(`date`)&&this.extensions.includes(`relational`)}get dirty(){return JSON.stringify(this.draft)!==JSON.stringify(this.stored)}get hasUnsavedChanges(){return!this.loading&&!this.loadFailed&&(this.dirty||this.saving)}get address(){let e=this.settingsStore?.getState();return e?.loginAddress||e?.loginUsername||void 0}edit(e){this.draft={...this.draft,...e},this.error=``}problem(e){return e.enabled&&e.message.trim()===``?`managesieve.autoReply.errors.emptyMessage`:e.start&&e.end&&e.start>e.end?`managesieve.autoReply.errors.invalidWindow`:null}async save(){if(this.saving)return;let e=this.draft,t=this.visit,n=JSON.stringify(this.stored),r=this.problem(e);if(r){this.error=this.t(r);return}this.saving=!0;let i=this.stored.enabled&&!e.enabled;try{if(await p.saveAutoReply(e,this.address),!h.current(t)||(h.savedAs(n,JSON.stringify(e),t),this.visit!==t))return;this.stored=e;let r=this.t(i?`managesieve.autoReply.turnedOff`:`managesieve.autoReply.saved`);window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:r,duration:3e3}}))}catch(e){if(this.visit!==t||!h.current(t))return;if(e instanceof f){this.ownVacation=!0;return}console.error(`Failed to save the auto-reply`,e),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.t(`managesieve.autoReply.errors.saveError`),duration:5e3,type:`error`}}))}finally{this.visit===t&&(this.saving=!1)}}formatDay(e){let[t,n,r]=e.split(`-`).map(Number);return new Date(t,n-1,r).toLocaleDateString(this.i18nStore?.getIntlLanguage(),{year:`numeric`,month:`short`,day:`numeric`})}renderState(){let{enabled:e,start:t,end:n}=this.stored;if(!e)return r;let i=g();return t&&t>i?o`<div class="state">${this.t(`managesieve.autoReply.stateScheduled`,{date:this.formatDay(t)})}</div>`:n&&n<i?o`<div class="state">${this.t(`managesieve.autoReply.stateFinished`)}</div>`:o`<div class="state on">${n?this.t(`managesieve.autoReply.stateActiveUntil`,{date:this.formatDay(n)}):this.t(`managesieve.autoReply.stateActive`)}</div>`}renderIntro(e){return o`
			<alps-setting-group label=${this.t(`managesieve.autoReply.title`)} description=${this.t(`managesieve.autoReply.description`)}>
				${e}
			</alps-setting-group>
		`}render(){if(this.loading)return o`<div class="loading"><alps-loader></alps-loader></div>`;if(this.loadFailed)return this.renderIntro(o`<div class="notice">${this.t(`managesieve.autoReply.errors.loadError`)}</div>`);if(!this.extensions.includes(`vacation`))return this.renderIntro(o`<div class="notice">${this.t(`managesieve.autoReply.unsupported`)}</div>`);if(this.ownVacation)return this.renderIntro(o`<div class="notice">${this.t(`managesieve.autoReply.ownVacation`)}</div>`);let e=this.draft,t=d.includes(e.days)?d:[...d,e.days].sort((e,t)=>e-t);return o`
			${this.renderIntro(o`
				<label class="checkbox-label">
					<input type="checkbox" .checked=${e.enabled}
						@change=${e=>this.edit({enabled:e.target.checked})}>
					${this.t(`managesieve.autoReply.enable`)}
				</label>
				${this.renderState()}
			`)}

			<alps-setting-group label=${this.t(`managesieve.autoReply.subject`)} description=${this.t(`managesieve.autoReply.subjectDesc`)}>
				<alps-input class="subject" .value=${e.subject} placeholder=${this.t(`managesieve.autoReply.subjectPlaceholder`)}
					@input=${e=>this.edit({subject:e.target.value})}></alps-input>
			</alps-setting-group>

			<alps-setting-group label=${this.t(`managesieve.autoReply.message`)} description=${this.t(`managesieve.autoReply.messageDesc`)}>
				<textarea dir="auto" .value=${e.message} placeholder=${this.t(`managesieve.autoReply.messagePlaceholder`)}
					@input=${e=>this.edit({message:e.target.value})}></textarea>
			</alps-setting-group>

			${this.offersDates?o`
				<alps-setting-group label=${this.t(`managesieve.autoReply.dates`)} description=${this.t(`managesieve.autoReply.datesDesc`)}>
					<div class="dates">
						<label>
							<span class="field-label">${this.t(`managesieve.autoReply.startDate`)}</span>
							<alps-input class="start" type="date" .value=${e.start}
								@input=${e=>this.edit({start:e.target.value})}></alps-input>
						</label>
						<label>
							<span class="field-label">${this.t(`managesieve.autoReply.endDate`)}</span>
							<alps-input class="end" type="date" .value=${e.end}
								@input=${e=>this.edit({end:e.target.value})}></alps-input>
						</label>
					</div>
				</alps-setting-group>
			`:r}

			<alps-setting-group label=${this.t(`managesieve.autoReply.interval`)} description=${this.t(`managesieve.autoReply.intervalDesc`)}>
				<alps-select .value=${String(e.days)}
					.options=${t.map(e=>({value:String(e),label:this.t(`managesieve.autoReply.days`,{count:e})}))}
					@change=${e=>this.edit({days:Number(e.target.value)})}></alps-select>
			</alps-setting-group>

			<alps-setting-group>
				<div class="actions">
					<alps-button variant="primary" ?spinning=${this.saving} ?disabled=${this.saving||!this.dirty} @click=${this.save}>
						${this.t(`managesieve.autoReply.save`)}
					</alps-button>
					${this.error?o`<div class="error-message" role="alert">${this.error}</div>`:r}
				</div>
			</alps-setting-group>
		`}};l([t({context:c,subscribe:!0})],_.prototype,`i18nStore`,void 0),l([t({context:s})],_.prototype,`settingsStore`,void 0),l([n()],_.prototype,`loading`,void 0),l([n()],_.prototype,`loadFailed`,void 0),l([n()],_.prototype,`extensions`,void 0),l([n()],_.prototype,`ownVacation`,void 0),l([n()],_.prototype,`stored`,void 0),l([n()],_.prototype,`draft`,void 0),l([n()],_.prototype,`saving`,void 0),l([n()],_.prototype,`error`,void 0),_=l([a(`alps-auto-reply-page`)],_);export{_ as AutoReplyPage};