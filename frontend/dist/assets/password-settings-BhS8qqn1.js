import{d as e,f as t,g as n,l as r,x as i,y as a}from"./lit-BYBpccnv.js";import{mt as o,ut as s,vt as c}from"./index-BTqn3JuA.js";var l=class extends n{constructor(...e){super(...e),this.passwordForm={old:``,new:``,confirm:``},this.isSubmitting=!1}static{this.styles=i`
		input[type="password"] {
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
		}

		/* The transparent outline paints nothing here; forced colors, which drop
		   the border colour and the shadow, give it a system colour. */
		input:focus {
			border-color: var(--accent-color, #2563eb);
			box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
			outline: 2px solid transparent;
		}
	`}handlePasswordFormChange(e,t){let n=e.target;this.passwordForm={...this.passwordForm,[t]:n.value}}async submitPasswordChange(){if(!this.passwordForm.old||!this.passwordForm.new||!this.passwordForm.confirm){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`settings.password.fillAllFields`),type:`error`,timeout:3e3}}));return}if(this.passwordForm.new!==this.passwordForm.confirm){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`settings.password.passwordMismatch`),type:`error`,timeout:3e3}}));return}this.isSubmitting=!0;try{let e=await o(`/password/change`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({old_password:this.passwordForm.old,password:this.passwordForm.new})}),t=await e.json().catch(()=>({}));if(e.ok){let e=t.code===`reauthenticate`||t.message===`Password changed, but please log in again`?`changedSignInAgain`:t.warning===`linked_accounts_not_refreshed`?`changedLinkedWarning`:`changed`;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`settings.password.${e}`),duration:6e3}})),this.passwordForm={old:``,new:``,confirm:``}}else{let n=t.code===`current_password_incorrect`||t.error===`Current password is incorrect`?`webauthn.errors.wrong_password`:e.status===429?`settings.password.tooManyAttempts`:t.code===`password_required`?`settings.password.fillAllFields`:t.code===`password_change_disabled`||e.status>=500?`settings.password.serviceUnavailable`:`settings.password.changeFailed`;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(n),type:`error`,duration:6e3}}))}}catch{window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`login.networkError`),type:`error`,timeout:3e3}}))}finally{this.isSubmitting=!1}}render(){return a`
			<alps-setting-group label="${this.i18nStore?.t(`settings.password.changePassword`)}" description="${this.i18nStore?.t(`settings.password.changePasswordDesc`)}">
					<alps-input type="password" icon="key"
							placeholder="${this.i18nStore?.t(`settings.password.oldPassword`)}" 
							.value=${this.passwordForm.old} 
							@input=${e=>this.handlePasswordFormChange(e,`old`)}
					></alps-input>
					<alps-input type="password" icon="key"
							placeholder="${this.i18nStore?.t(`settings.password.newPassword`)}" 
							.value=${this.passwordForm.new} 
							@input=${e=>this.handlePasswordFormChange(e,`new`)}
					></alps-input>
					<alps-input type="password" icon="key"
							placeholder="${this.i18nStore?.t(`settings.password.confirmPassword`)}" 
							.value=${this.passwordForm.confirm} 
							@input=${e=>this.handlePasswordFormChange(e,`confirm`)}
					></alps-input>
					
					<alps-button 
						variant="normal"
						style="align-self: flex-start;"
						?disabled=${this.isSubmitting||!this.passwordForm.old||!this.passwordForm.new||!this.passwordForm.confirm}
						?spinning=${this.isSubmitting}
						@click=${this.submitPasswordChange}>
						${this.i18nStore?.t(`settings.password.updatePassword`)}
					</alps-button>
			</alps-setting-group>			
	`}};s([t({context:c})],l.prototype,`i18nStore`,void 0),s([r()],l.prototype,`passwordForm`,void 0),s([r()],l.prototype,`isSubmitting`,void 0),l=s([e(`alps-password-settings`)],l);export{l as PasswordSettings};