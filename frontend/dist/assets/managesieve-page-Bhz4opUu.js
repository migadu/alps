import{b as e,c as t,f as n,h as r,i,m as a,p as o,v as s}from"./lit-Br1cDwGJ.js";import{l as c,mt as l,tt as u}from"./index-CH99gXpe.js";import{n as d,o as f,r as p,t as m}from"./unsaved-yvxXYQ6r.js";var h=class extends r{constructor(...e){super(...e),this.isDirty=!1,this.script=``,this.stored=``,this.isValidating=!1,this.isSaving=!1}get hasUnsavedChanges(){return this.script!==this.stored||this.isSaving}static{this.styles=e`
		.editor-container {
			display: flex;
			flex-direction: column;
			gap: 16px;
			width: 100%;
			height: 400px;
			margin-top: 12px;
		}

		.code-area {
			position: relative;
			flex: 1;
			width: 100%;
			border: 1px solid var(--border-color, #ccc);
			border-radius: var(--input-radius, 6px);
			background-color: var(--bg-primary, #fff);
			overflow: hidden;
		}
		.highlight-layer, textarea {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			padding: 12px;
			margin: 0;
			border: none;
			font-family: monospace;
			font-size: 14px;
			line-height: 1.5;
			box-sizing: border-box;
			white-space: pre-wrap;
			word-wrap: break-word;
			overflow-y: auto;
			tab-size: 4;
		}
		.highlight-layer {
			color: var(--text-primary, #000);
			z-index: 1;
			pointer-events: none;
		}
		textarea {
			color: transparent;
			background: transparent;
			caret-color: var(--text-primary, #000);
			z-index: 2;
			resize: none;
			outline: none;
		}
		
		.sieve-keyword { color: #d73a49; font-weight: 600; }
		.sieve-operator { color: #005cc5; font-weight: 600; }
		.sieve-string { color: #032f62; }
		.sieve-comment { color: #6a737d; font-style: italic; }
		
		@media (prefers-color-scheme: dark) {
			.sieve-keyword { color: #ff7b72; }
			.sieve-operator { color: #79c0ff; }
			.sieve-string { color: #a5d6ff; }
			.sieve-comment { color: #8b949e; }
		}

		.actions {
			display: flex;
			gap: 12px;
			align-items: center;
		}
	`}willUpdate(e){(e.has(`script`)||e.has(`stored`))&&(this.isDirty=this.script!==this.stored)}highlight(e){if(!e)return``;let t=e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`);return t=t.replace(/(#.*|\/\*[\s\S]*?\*\/)|("[^"\\]*(?:\\.[^"\\]*)*")|\b(require|if|else|elsif|stop|fileinto|keep|discard|redirect)\b|\b(anyof|allof|not|contains|is|matches|over|under)\b/gi,(e,t,n,r,i)=>t?`<span class="sieve-comment">${t}</span>`:n?`<span class="sieve-string">${n}</span>`:r?`<span class="sieve-keyword">${r}</span>`:i?`<span class="sieve-operator">${i}</span>`:e),t.endsWith(`
`)&&(t+=` `),i(t)}handleScroll(e){let t=e.target,n=this.shadowRoot?.querySelector(`.highlight-layer`);n&&(n.scrollTop=t.scrollTop,n.scrollLeft=t.scrollLeft)}handleInput(e){let t=e.target;this.script=t.value,this.dispatchEvent(new CustomEvent(`script-changed`,{detail:{script:this.script}}))}async validate(){this.isValidating=!0;let e=this.script;try{if(await p.validateScript(e),this.script!==e)return;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore.t(`managesieve.toast.valid`),duration:3e3}}))}catch(t){if(this.script!==e)return;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:t.message||this.i18nStore.t(`managesieve.toast.networkError`),duration:5e3,type:`error`}}))}finally{this.isValidating=!1}}async save(){this.isSaving=!0;let e=c.generation(),t=this.script;try{let{autoReplyOn:n}=await p.saveScript(t,`PUT`);if(e!==c.generation())return;this.stored=t,this.dispatchEvent(new CustomEvent(`script-saved`,{detail:{script:t}}));let r=t.trim()===``&&!n?`managesieve.toast.deactivated`:`managesieve.toast.saved`;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore.t(r),duration:3e3}}))}catch(t){if(e!==c.generation())return;let n=t instanceof d?this.i18nStore.t(`managesieve.toast.autoReplyOn`):t.message||this.i18nStore.t(`managesieve.toast.networkError`);window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:n,duration:5e3,type:`error`}}))}finally{this.isSaving=!1}}render(){return s`
			<div class="editor-container">
				<div class="code-area">
					<div class="highlight-layer">${this.highlight(this.script)}</div>
					<!-- Named by what it holds: nothing else on the page labels it. -->
					<textarea aria-label=${this.i18nStore?.t(`managesieve.raw.script`)??``} .value=${this.script} @input=${this.handleInput} @scroll=${this.handleScroll} spellcheck="false"></textarea>
				</div>
				<div class="actions">
					<alps-button variant="text" ?spinning=${this.isValidating} ?disabled=${this.isSaving} @click=${this.validate}>
						${this.i18nStore.t(`managesieve.raw.validate`)}
					</alps-button>
					<div style="flex: 1;"></div>
					<alps-button variant="primary" ?spinning=${this.isSaving} ?disabled=${this.isValidating||!this.isDirty} @click=${this.save}>
						${this.i18nStore.t(`managesieve.raw.save`)}
					</alps-button>
				</div>
			</div>
		`}};u([n()],h.prototype,`isDirty`,void 0),u([t({context:l})],h.prototype,`i18nStore`,void 0),u([o({type:String})],h.prototype,`script`,void 0),u([o({type:String})],h.prototype,`stored`,void 0),u([n()],h.prototype,`isValidating`,void 0),u([n()],h.prototype,`isSaving`,void 0),h=u([a(`alps-raw-editor`)],h);var g=class extends r{constructor(...e){super(...e),this.isSaving=!1,this.initialSnapshot=``,this.state={rules:[]},this.folders=[]}willUpdate(e){e.has(`state`)&&this.initialSnapshot===``&&(this.initialSnapshot=JSON.stringify(this.state))}get isDirty(){return this.initialSnapshot!==``&&this.initialSnapshot!==JSON.stringify(this.state)}markClean(e=JSON.stringify(this.state)){this.initialSnapshot=e,this.requestUpdate()}static{this.styles=e`
		.editor-container {
			display: flex;
			flex-direction: column;
			gap: 24px;
			margin-top: 12px;
		}
		.rule-card {
			position: relative;
			border-radius: 8px;
			padding: 16px;
			background: var(--bg-secondary);
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
		.rule-header {
			position: absolute;
			top: 16px;
			right: 16px;
			display: flex;
			align-items: center;
		}
		.condition-row, .action-row {
			display: flex;
			gap: 8px;
			align-items: center;
		}
		.row-label {
			width: 80px;
			font-weight: 600;
			font-size: 13px;
			color: var(--text-secondary);
			text-align: right;
		}
		.row-content {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.row-text {
			color: var(--text-secondary);
			font-size: 13px;
			font-weight: 400;
		}
		.flex-1 {
			flex: 1;
		}
		.connector {
			display: flex;
			justify-content: center;
			color: var(--text-muted);
			opacity: 0.5;
			padding: 8px 0;
			margin-left: 40px;
		}
		.connector-icon {
			fill: none;
			color: currentColor;
		}
		.actions-container {
			display: flex;
			gap: 16px;
			justify-content: flex-end;
		}
		.empty-state {
			color: var(--text-muted);
			font-style: italic;
			padding: 16px 0;
			text-align: left;
		}
	`}addRule(){this.state={...this.state,rules:[...this.state.rules,{id:Math.random().toString(36).substring(7),matchType:`all`,conditions:[{field:`Subject`,operator:`contains`,value:``}],actions:[{type:`fileinto`,value:this.folders[0]||`INBOX`}]}]},this.notifyChange()}deleteRule(e){let t=[...this.state.rules];t.splice(e,1),this.state={...this.state,rules:t},this.notifyChange()}updateRule(e,t){let n=[...this.state.rules];n[e]={...n[e],...t},this.state={...this.state,rules:n},this.notifyChange()}addCondition(e,t){let n=this.state.rules[e],r={field:`Subject`,operator:`contains`,value:``},i=[...n.conditions];t===void 0?i.push(r):i.splice(t,0,r),this.updateRule(e,{conditions:i})}deleteCondition(e,t){let n=[...this.state.rules[e].conditions];n.splice(t,1),this.updateRule(e,{conditions:n})}updateCondition(e,t,n){let r=[...this.state.rules[e].conditions],i=r[t];n.field&&n.field!==i.field&&(n.field===`Size`?i.operator!==`over`&&i.operator!==`under`&&(n.operator=`over`):(i.operator===`over`||i.operator===`under`)&&(n.operator=`contains`)),r[t]={...i,...n},this.updateRule(e,{conditions:r})}addAction(e,t){let n=this.state.rules[e],r={type:`fileinto`,value:this.folders[0]||`INBOX`},i=[...n.actions];t===void 0?i.push(r):i.splice(t,0,r),this.updateRule(e,{actions:i})}deleteAction(e,t){let n=[...this.state.rules[e].actions];n.splice(t,1),this.updateRule(e,{actions:n})}updateAction(e,t,n){let r=[...this.state.rules[e].actions];r[t]={...r[t],...n},this.updateRule(e,{actions:r})}notifyChange(){this.dispatchEvent(new CustomEvent(`state-changed`,{detail:{state:this.state}}))}save(){this.dispatchEvent(new CustomEvent(`save-requested`))}render(){return s`
			<div class="editor-container">
				${this.state.rules.length===0?s`
					<div class="empty-state">${this.i18nStore.t(`managesieve.visual.noRules`)}</div>
				`:this.state.rules.map((e,t)=>s`
					<div class="rule-card">
						<div class="rule-header">
							<alps-icon-btn icon="x" title=${this.i18nStore.t(`managesieve.visual.deleteRule`)} @click=${()=>this.deleteRule(t)}></alps-icon-btn>
						</div>

						<div class="condition-row">
							<div class="row-label">${this.i18nStore.t(`managesieve.visual.if`)}</div>
							<div class="row-content">
								<alps-select 
									.value=${e.matchType}
									.options=${[{value:`all`,label:this.i18nStore.t(`managesieve.visual.all`)},{value:`any`,label:this.i18nStore.t(`managesieve.visual.any`)}]}
									@change=${e=>this.updateRule(t,{matchType:e.target.value})}>
								</alps-select>
								<span class="row-text">${this.i18nStore.t(`managesieve.visual.ofTheFollowing`)}</span>
							</div>
						</div>
						

						${e.conditions.map((n,r)=>s`
							<div class="condition-row">
								<div class="row-label"></div>
								<alps-select 
									.value=${n.field}
									.options=${[{value:`Subject`,label:this.i18nStore.t(`managesieve.visual.fields.subject`)},{value:`From`,label:this.i18nStore.t(`managesieve.visual.fields.from`)},{value:`To`,label:this.i18nStore.t(`managesieve.visual.fields.to`)},{value:`Body`,label:this.i18nStore.t(`managesieve.visual.fields.body`)},{value:`Size`,label:this.i18nStore.t(`managesieve.visual.fields.size`)}]}
									@change=${e=>this.updateCondition(t,r,{field:e.target.value})}>
								</alps-select>
								<alps-select 
									.value=${n.operator}
									.options=${n.field===`Size`?[{value:`over`,label:this.i18nStore.t(`managesieve.visual.operators.over`)},{value:`under`,label:this.i18nStore.t(`managesieve.visual.operators.under`)}]:[{value:`contains`,label:this.i18nStore.t(`managesieve.visual.operators.contains`)},{value:`not_contains`,label:this.i18nStore.t(`managesieve.visual.operators.not_contains`)},{value:`is`,label:this.i18nStore.t(`managesieve.visual.operators.is`)},{value:`not_is`,label:this.i18nStore.t(`managesieve.visual.operators.not_is`)}]}
									@change=${e=>this.updateCondition(t,r,{operator:e.target.value})}>
								</alps-select>
								<alps-input class="flex-1" label=${this.i18nStore.t(`managesieve.visual.value`)} .value=${n.value} @input=${e=>this.updateCondition(t,r,{value:e.target.value})}></alps-input>
								${e.conditions.length>1?s`<alps-icon-btn icon="minus-square" title=${this.i18nStore.t(`managesieve.visual.remove`)} @click=${()=>this.deleteCondition(t,r)}></alps-icon-btn>`:``}
								<alps-icon-btn icon="plus-square" title=${this.i18nStore.t(`managesieve.visual.add`)} @click=${()=>this.addCondition(t,r+1)}></alps-icon-btn>
							</div>
						`)}

						<div class="connector">
							<svg width="24" height="24" class="connector-icon"><use href="/assets/icons/sprite.svg?v=10#arrow-fat-lines-down"></use></svg>
						</div>

						${e.actions.map((n,r)=>s`
							<div class="action-row">
								<div class="row-label">
									${r===0?this.i18nStore.t(`managesieve.visual.then`):``}
								</div>
								<alps-select 
									.value=${n.type}
									.options=${[{value:`fileinto`,label:this.i18nStore.t(`managesieve.visual.actions.fileinto`)},{value:`redirect`,label:this.i18nStore.t(`managesieve.visual.actions.redirect`)},{value:`discard`,label:this.i18nStore.t(`managesieve.visual.actions.discard`)},{value:`stop`,label:this.i18nStore.t(`managesieve.visual.actions.stop`)}]}
									@change=${e=>this.updateAction(t,r,{type:e.target.value,value:``})}>
								</alps-select>
								${n.type===`fileinto`?s`
									<alps-select 
										class="flex-1" 
										.value=${n.value||``}
										.options=${[...this.folders.map(e=>({value:e,label:e}))]}
										@change=${e=>this.updateAction(t,r,{value:e.target.value})}>
									</alps-select>
								`:n.type===`redirect`?s`
									<alps-input type="email" class="flex-1" placeholder=${this.i18nStore.t(`managesieve.visual.fields.emailAddress`)} .value=${n.value||``} @input=${e=>this.updateAction(t,r,{value:e.target.value})}></alps-input>
								`:``}
								${e.actions.length>1?s`<alps-icon-btn icon="minus-square" title=${this.i18nStore.t(`managesieve.visual.remove`)} @click=${()=>this.deleteAction(t,r)}></alps-icon-btn>`:``}
								${n.type===`stop`?``:s`<alps-icon-btn icon="plus-square" title=${this.i18nStore.t(`managesieve.visual.add`)} @click=${()=>this.addAction(t,r+1)}></alps-icon-btn>`}
							</div>
						`)}

					</div>
				`)}
				
				<div class="actions-container" >
					<alps-button variant="normal" @click=${this.addRule}>${this.i18nStore.t(`managesieve.visual.newRule`)}</alps-button>
					${this.state.rules.length>0?s`<alps-button variant="text" @click=${()=>this.dispatchEvent(new CustomEvent(`switch-raw-requested`))}>${this.i18nStore.t(`managesieve.tabs.switchToRaw`)}</alps-button>`:``}
					<div class="flex-1"></div>
					${this.isDirty?s`<alps-button variant="primary" ?spinning=${this.isSaving} ?disabled=${this.isSaving} @click=${this.save}>${this.i18nStore.t(`managesieve.visual.saveFilters`)}</alps-button>`:``}
				</div>
			</div>
		`}};u([o({type:Boolean})],g.prototype,`isSaving`,void 0),u([n()],g.prototype,`initialSnapshot`,void 0),u([t({context:l,subscribe:!0})],g.prototype,`i18nStore`,void 0),u([o({type:Object})],g.prototype,`state`,void 0),u([o({type:Array})],g.prototype,`folders`,void 0),g=u([a(`alps-visual-editor`)],g);var _=new m,v=class extends r{constructor(...e){super(...e),this.mode=`visual`,this.script=``,this.storedScript=``,this.visualState={rules:[]},this.storedVisualSnapshot=JSON.stringify(this.visualState),this.folders=[],this.isLoading=!0,this.loadFailed=!1,this.isSaving=!1,this.showSwitchRawConfirm=!1,this.visit=_.visit(),this.retainEdit=!0,this.loadRequest=0}static{this.styles=e`
		.container {
			display: flex;
			flex-direction: column;
			gap: 20px;
			padding-bottom: 32px;
		}
		.load-error {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
			color: var(--text-secondary);
			line-height: 1.4;
		}
		.switch-btn-container {
			margin-top: 16px;
			padding-top: 16px;
			border-top: 1px solid var(--border-color, #eee);
		}
	`}connectedCallback(){super.connectedCallback(),this.visit=_.visit(),this.retainEdit=!0,this.fetchScript(),this.fetchFolders()}disconnectedCallback(){super.disconnectedCallback(),!(!this.retainEdit||this.isLoading||this.loadFailed)&&(this.unsaved?_.keep(this.storedScript,{mode:this.mode,script:this.script,visualState:this.visualState},this.visit):_.forget(this.visit))}discardUnsavedChanges(){this.retainEdit=!1,_.forget(this.visit)}get unsaved(){if(this.mode===`raw`){let e=this.shadowRoot?.querySelector(`alps-raw-editor`);return this.script!==this.storedScript||e?.hasUnsavedChanges===!0}return JSON.stringify(this.visualState)!==this.storedVisualSnapshot||this.isSaving}async restoreUnsaved(){if(this.loadFailed||!this.isConnected)return;let e=_.take(this.storedScript,this.visit);if(!e)return;let t=this.storedVisualSnapshot,n=this.visit,r=this.loadRequest;this.mode=e.mode,this.script=e.script,this.visualState=e.visualState,e.mode===`visual`&&(await this.updateComplete,!(!this.isConnected||this.visit!==n||this.loadRequest!==r||!_.current(n))&&(this.shadowRoot?.querySelector(`alps-visual-editor`))?.markClean?.(t))}async fetchScript(){let e=this.visit,t=_.revision,n=++this.loadRequest,r=()=>this.visit===e&&n===this.loadRequest&&_.current(e);this.isLoading=!0,this.loadFailed=!1;try{let e=await p.fetchScript();if(!r())return;if(t!==_.revision)return this.fetchScript();if(this.script=e.content||``,this.storedScript=this.script,this.script.trim()===``)this.mode=`visual`,this.visualState={rules:[]};else{let e=f.extractVisualState(this.script);e?(this.visualState=e,this.mode=`visual`):this.mode=`raw`}this.storedVisualSnapshot=JSON.stringify(this.visualState)}catch(e){if(!r())return;console.error(`Failed to fetch Sieve script`,e),this.loadFailed=!0}finally{r()&&(this.isLoading=!1)}r()&&await this.restoreUnsaved()}async fetchFolders(){try{let e=await p.fetchFolders();e&&e.Mailboxes&&(this.folders=e.Mailboxes.map(e=>e.Name||e.Mailbox).filter(Boolean))}catch(e){console.error(`Failed to fetch folders`,e)}}get hasUnsavedChanges(){return this.isLoading||this.loadFailed?!1:this.unsaved}handleVisualStateChange(e){this.visualState=e.detail.state}handleRawScriptChange(e){this.script=e.detail.script}switchToRaw(){this.showSwitchRawConfirm=!0}confirmSwitchToRaw(){this.script=f.compile(this.visualState),this.mode=`raw`,this.showSwitchRawConfirm=!1}async saveVisual(){let e=this.visit,t=this.storedScript;this.isSaving=!0;try{let n=f.compile(this.visualState);this.script=n;let r=JSON.stringify(this.visualState),{autoReplyOn:i}=await p.saveScript(n,`PUT`);if(!_.current(e)||(_.savedAs(t,n,e),this.visit!==e))return;this.storedScript=n,this.storedVisualSnapshot=r;let a=n.trim()===``&&!i?`managesieve.toast.deactivated`:`managesieve.toast.saved`;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore.t(a),duration:3e3}}));let o=this.shadowRoot?.querySelector(`alps-visual-editor`);o&&o.markClean&&o.markClean(r)}catch(t){if(this.visit!==e||!_.current(e))return;let n=t instanceof d?this.i18nStore.t(`managesieve.toast.autoReplyOn`):t.message||this.i18nStore.t(`managesieve.toast.networkError`);window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:n,duration:5e3,type:`error`}}))}finally{this.visit===e&&(this.isSaving=!1)}}render(){return s`
			<div class="container">
				<alps-setting-group label="${this.i18nStore.t(`managesieve.title`)}" description="${this.i18nStore.t(`managesieve.description`)}">
					${this.isLoading?s`
						<div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
							<alps-loader></alps-loader>
						</div>
					`:this.loadFailed?s`
						<div class="load-error">
							<div role="alert">${this.i18nStore.t(`managesieve.loadError`)}</div>
							<alps-button variant="normal" @click=${()=>this.fetchScript()}>
								${this.i18nStore.t(`managesieve.loadErrorRetry`)}
							</alps-button>
						</div>
					`:this.mode===`visual`?s`
						<alps-visual-editor 
							.isSaving=${this.isSaving} 
							.state=${this.visualState} 
							.folders=${this.folders}
							@state-changed=${this.handleVisualStateChange}
							@save-requested=${this.saveVisual}
							@switch-raw-requested=${this.switchToRaw}
						></alps-visual-editor>
					`:s`
						<alps-raw-editor 
							.script=${this.script}
							.stored=${this.storedScript}
							@script-changed=${this.handleRawScriptChange}
							@script-saved=${e=>{_.savedAs(this.storedScript,e.detail.script,this.visit),this.storedScript=e.detail.script}}
						></alps-raw-editor>
					`}
				</alps-setting-group>
			</div>

			${this.showSwitchRawConfirm?s`
				<ui-confirm
					heading=${this.i18nStore.t(`managesieve.warningRawSwitchTitle`)}
					message="${this.i18nStore.t(`managesieve.warningRawSwitch`)}"
					confirmText=${this.i18nStore.t(`managesieve.warningRawSwitchConfirm`)}
					isDanger=${!0}
					@confirm=${this.confirmSwitchToRaw}
					@cancel=${()=>this.showSwitchRawConfirm=!1}
				></ui-confirm>
			`:``}
		`}};u([t({context:l,subscribe:!0})],v.prototype,`i18nStore`,void 0),u([n()],v.prototype,`mode`,void 0),u([n()],v.prototype,`script`,void 0),u([n()],v.prototype,`storedScript`,void 0),u([n()],v.prototype,`visualState`,void 0),u([n()],v.prototype,`folders`,void 0),u([n()],v.prototype,`isLoading`,void 0),u([n()],v.prototype,`loadFailed`,void 0),u([n()],v.prototype,`isSaving`,void 0),u([n()],v.prototype,`showSwitchRawConfirm`,void 0),v=u([a(`alps-managesieve-page`)],v);export{v as ManageSievePage};