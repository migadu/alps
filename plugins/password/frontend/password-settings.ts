import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-setting-group';

@customElement('alps-password-settings')
export class PasswordSettings extends LitElement {
	@consume({ context: i18nContext })
	i18nStore!: I18nStore;

	@state() private passwordForm = { old: '', new: '', confirm: '' };

	static styles = css`
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

		input:focus {
			border-color: var(--accent-color, #2563eb);
			box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
		}
	`;

	private handlePasswordFormChange(e: Event, field: 'old' | 'new' | 'confirm') {
		const target = e.target as HTMLInputElement;
		this.passwordForm = { ...this.passwordForm, [field]: target.value };
	}

	private async submitPasswordChange() {
		if (!this.passwordForm.old || !this.passwordForm.new || !this.passwordForm.confirm) {
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.i18nStore?.t('settings.password.fillAllFields'), timeout: 3000 } }));
			return;
		}
		if (this.passwordForm.new !== this.passwordForm.confirm) {
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.i18nStore?.t('settings.password.passwordMismatch'), timeout: 3000 } }));
			return;
		}

		try {
			const response = await fetch('/password/change', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					old_password: this.passwordForm.old,
					password: this.passwordForm.new
				})
			});

			const data = await response.json();
			if (response.ok) {
				window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: data.message || 'Password successfully changed.', timeout: 3000 } }));
				this.passwordForm = { old: '', new: '', confirm: '' };
			} else {
				window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: data.error || 'Failed to change password.', timeout: 3000 } }));
			}
		} catch (e) {
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Network error occurred.', timeout: 3000 } }));
		}
	}

	render() {
		return html`
			<alps-setting-group label="${this.i18nStore?.t('settings.password.changePassword')}" description="${this.i18nStore?.t('settings.password.changePasswordDesc')}">
					<input type="password" 
							placeholder="${this.i18nStore?.t('settings.password.oldPassword')}" 
							.value=${this.passwordForm.old} 
							@input=${(e: Event) => this.handlePasswordFormChange(e, 'old')}
					/>
					<input type="password" 
							placeholder="${this.i18nStore?.t('settings.password.newPassword')}" 
							.value=${this.passwordForm.new} 
							@input=${(e: Event) => this.handlePasswordFormChange(e, 'new')}
					/>
					<input type="password" 
							placeholder="${this.i18nStore?.t('settings.password.confirmPassword')}" 
							.value=${this.passwordForm.confirm} 
							@input=${(e: Event) => this.handlePasswordFormChange(e, 'confirm')}
					/>
					
					<alps-button 
						variant="primary"
						@click=${this.submitPasswordChange}>
						${this.i18nStore?.t('settings.password.updatePassword')}
					</alps-button>
			</alps-setting-group>			
	`;
	}
}
