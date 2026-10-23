import{_ as e,d as t,h as n,m as r,p as i,s as a,y as o}from"./lit-CB2iQgdU.js";import{J as s,st as c,z as l}from"./index-iaOWfb9x.js";import{i as u,n as d,r as f,t as p}from"./managesieve-service-CMuuc3Ed.js";function m(){let e=new Date,t=e=>String(e).padStart(2,`0`);return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}`}var h=class extends r{constructor(...e){super(...e),this.loading=!0,this.loadFailed=!1,this.extensions=[],this.ownVacation=!1,this.stored=u,this.draft=u,this.saving=!1,this.error=``}static{this.styles=o`
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
	`}connectedCallback(){super.connectedCallback(),this.load()}async load(){try{let{reply:e,extensions:t,ownVacation:n}=await d.fetchAutoReply();this.extensions=t,this.ownVacation=n,this.stored=e??u,this.draft=this.offersDates?this.stored:{...this.stored,start:``,end:``}}catch(e){console.error(`Failed to fetch the auto-reply`,e),this.loadFailed=!0}finally{this.loading=!1}}t(e,t){return this.i18nStore?.t(e,t)??e}get offersDates(){return this.extensions.includes(`date`)&&this.extensions.includes(`relational`)}get dirty(){return JSON.stringify(this.draft)!==JSON.stringify(this.stored)}get address(){let e=this.settingsStore?.getState();return e?.loginAddress||e?.loginUsername||void 0}edit(e){this.draft={...this.draft,...e},this.error=``}problem(e){return e.enabled&&e.message.trim()===``?`managesieve.autoReply.errors.emptyMessage`:e.start&&e.end&&e.start>e.end?`managesieve.autoReply.errors.invalidWindow`:null}async save(){if(this.saving)return;let e=this.draft,t=this.problem(e);if(t){this.error=this.t(t);return}this.saving=!0;let n=this.stored.enabled&&!e.enabled;try{await d.saveAutoReply(e,this.address),this.stored=e;let t=this.t(n?`managesieve.autoReply.turnedOff`:`managesieve.autoReply.saved`);window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:t,duration:3e3}}))}catch(e){if(e instanceof p){this.ownVacation=!0;return}console.error(`Failed to save the auto-reply`,e),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.t(`managesieve.autoReply.errors.saveError`),duration:5e3,type:`error`}}))}finally{this.saving=!1}}formatDay(e){let[t,n,r]=e.split(`-`).map(Number);return new Date(t,n-1,r).toLocaleDateString(this.i18nStore?.getIntlLanguage(),{year:`numeric`,month:`short`,day:`numeric`})}renderState(){let{enabled:t,start:r,end:i}=this.stored;if(!t)return n;let a=m();return r&&r>a?e`<div class="state">${this.t(`managesieve.autoReply.stateScheduled`,{date:this.formatDay(r)})}</div>`:i&&i<a?e`<div class="state">${this.t(`managesieve.autoReply.stateFinished`)}</div>`:e`<div class="state on">${i?this.t(`managesieve.autoReply.stateActiveUntil`,{date:this.formatDay(i)}):this.t(`managesieve.autoReply.stateActive`)}</div>`}renderIntro(t){return e`
			<alps-setting-group label=${this.t(`managesieve.autoReply.title`)} description=${this.t(`managesieve.autoReply.description`)}>
				${t}
			</alps-setting-group>
		`}render(){if(this.loading)return e`<div class="loading"><alps-loader></alps-loader></div>`;if(this.loadFailed)return this.renderIntro(e`<div class="notice">${this.t(`managesieve.autoReply.errors.loadError`)}</div>`);if(!this.extensions.includes(`vacation`))return this.renderIntro(e`<div class="notice">${this.t(`managesieve.autoReply.unsupported`)}</div>`);if(this.ownVacation)return this.renderIntro(e`<div class="notice">${this.t(`managesieve.autoReply.ownVacation`)}</div>`);let t=this.draft,r=f.includes(t.days)?f:[...f,t.days].sort((e,t)=>e-t);return e`
			${this.renderIntro(e`
				<label class="checkbox-label">
					<input type="checkbox" .checked=${t.enabled}
						@change=${e=>this.edit({enabled:e.target.checked})}>
					${this.t(`managesieve.autoReply.enable`)}
				</label>
				${this.renderState()}
			`)}

			<alps-setting-group label=${this.t(`managesieve.autoReply.subject`)} description=${this.t(`managesieve.autoReply.subjectDesc`)}>
				<alps-input class="subject" .value=${t.subject} placeholder=${this.t(`managesieve.autoReply.subjectPlaceholder`)}
					@input=${e=>this.edit({subject:e.target.value})}></alps-input>
			</alps-setting-group>

			<alps-setting-group label=${this.t(`managesieve.autoReply.message`)} description=${this.t(`managesieve.autoReply.messageDesc`)}>
				<textarea dir="auto" .value=${t.message} placeholder=${this.t(`managesieve.autoReply.messagePlaceholder`)}
					@input=${e=>this.edit({message:e.target.value})}></textarea>
			</alps-setting-group>

			${this.offersDates?e`
				<alps-setting-group label=${this.t(`managesieve.autoReply.dates`)} description=${this.t(`managesieve.autoReply.datesDesc`)}>
					<div class="dates">
						<label>
							<span class="field-label">${this.t(`managesieve.autoReply.startDate`)}</span>
							<alps-input class="start" type="date" .value=${t.start}
								@input=${e=>this.edit({start:e.target.value})}></alps-input>
						</label>
						<label>
							<span class="field-label">${this.t(`managesieve.autoReply.endDate`)}</span>
							<alps-input class="end" type="date" .value=${t.end}
								@input=${e=>this.edit({end:e.target.value})}></alps-input>
						</label>
					</div>
				</alps-setting-group>
			`:n}

			<alps-setting-group label=${this.t(`managesieve.autoReply.interval`)} description=${this.t(`managesieve.autoReply.intervalDesc`)}>
				<alps-select .value=${String(t.days)}
					.options=${r.map(e=>({value:String(e),label:this.t(`managesieve.autoReply.days`,{count:e})}))}
					@change=${e=>this.edit({days:Number(e.target.value)})}></alps-select>
			</alps-setting-group>

			<alps-setting-group>
				<div class="actions">
					<alps-button variant="primary" ?spinning=${this.saving} ?disabled=${this.saving||!this.dirty} @click=${this.save}>
						${this.t(`managesieve.autoReply.save`)}
					</alps-button>
					${this.error?e`<div class="error-message" role="alert">${this.error}</div>`:n}
				</div>
			</alps-setting-group>
		`}};s([a({context:c,subscribe:!0})],h.prototype,`i18nStore`,void 0),s([a({context:l})],h.prototype,`settingsStore`,void 0),s([t()],h.prototype,`loading`,void 0),s([t()],h.prototype,`loadFailed`,void 0),s([t()],h.prototype,`extensions`,void 0),s([t()],h.prototype,`ownVacation`,void 0),s([t()],h.prototype,`stored`,void 0),s([t()],h.prototype,`draft`,void 0),s([t()],h.prototype,`saving`,void 0),s([t()],h.prototype,`error`,void 0),h=s([i(`alps-auto-reply-page`)],h);export{h as AutoReplyPage};