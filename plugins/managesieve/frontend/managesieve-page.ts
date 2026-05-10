import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import type { VisualState } from './sieve-compiler';
import { SieveCompiler } from './sieve-compiler';
import '../../../frontend/src/components/alps-setting-group';
import './raw-editor';
import './visual-editor';
import { managesieveService } from './managesieve-service';
import '../../../frontend/src/components/ui-confirm';

@customElement('alps-managesieve-page')
export class ManageSievePage extends LitElement {
	@consume({ context: i18nContext, subscribe: true })
	i18nStore!: I18nStore;

	@state() private mode: 'visual' | 'raw' = 'visual';
	@state() private script = '';
	@state() private visualState: VisualState = { rules: [] };
	@state() folders: string[] = [];

	@state() private isLoading = true;
	@state() private isSaving = false;
	@state() private showSwitchRawConfirm = false;

	static styles = css`
		.container {
			display: flex;
			flex-direction: column;
			gap: 20px;
			padding-bottom: 32px;
		}
		.switch-btn-container {
			margin-top: 16px;
			padding-top: 16px;
			border-top: 1px solid var(--border-color, #eee);
		}
	`;

	connectedCallback() {
		super.connectedCallback();
		this.fetchScript();
		this.fetchFolders();
	}

	private async fetchScript() {
		try {
			const data = await managesieveService.fetchScript();
			this.script = data.content || '';
			if (this.script.trim() === '') {
				this.mode = 'visual';
				this.visualState = { rules: [] };
			} else {
				const parsed = SieveCompiler.extractVisualState(this.script);
				if (parsed) {
					this.visualState = parsed;
					this.mode = 'visual';
				} else {
					this.mode = 'raw';
				}
			}
		} catch (e) {
			console.error('Failed to fetch Sieve script', e);
			this.visualState = { rules: [] };
			this.mode = 'visual';
		} finally {
			this.isLoading = false;
		}
	}

	private async fetchFolders() {
		try {
			const data = await managesieveService.fetchFolders();
			if (data && data.Mailboxes) {
				this.folders = data.Mailboxes.map((m: any) => m.Name || m.Mailbox).filter(Boolean);
			}
		} catch (e) {
			console.error('Failed to fetch folders', e);
		}
	}

	private handleVisualStateChange(e: CustomEvent) {
		this.visualState = e.detail.state;
	}

	private handleRawScriptChange(e: CustomEvent) {
		this.script = e.detail.script;
	}

	private switchToRaw() {
		this.showSwitchRawConfirm = true;
	}

	private confirmSwitchToRaw() {
		this.script = SieveCompiler.compile(this.visualState);
		this.mode = 'raw';
		this.showSwitchRawConfirm = false;
	}

	private async saveVisual() {
		this.isSaving = true;
		try {
			const compiled = SieveCompiler.compile(this.visualState);
			this.script = compiled; // update raw script cache too

			await managesieveService.saveScript(compiled, 'PUT');
			const msgKey = compiled.trim() === '' ? 'managesieve.toast.deactivated' : 'managesieve.toast.saved';
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.i18nStore.t(msgKey), timeout: 3000 } }));
			const editor = this.shadowRoot?.querySelector('alps-visual-editor') as any;
			if (editor && editor.markClean) editor.markClean();
		} catch (e: any) {
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: e.message || this.i18nStore.t('managesieve.toast.networkError'), timeout: 5000, type: 'error' } }));
		} finally {
			this.isSaving = false;
		}
	}

	render() {
		return html`
			<div class="container">
				<alps-setting-group label="${this.i18nStore.t('managesieve.title')}" description="${this.i18nStore.t('managesieve.description')}">
					${this.isLoading ? html`
						<div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
							<alps-loader></alps-loader>
						</div>
					` : this.mode === 'visual' ? html`
						<alps-visual-editor 
							.isSaving=${this.isSaving} 
							.state=${this.visualState} 
							.folders=${this.folders}
							@state-changed=${this.handleVisualStateChange}
							@save-requested=${this.saveVisual}
							@switch-raw-requested=${this.switchToRaw}
						></alps-visual-editor>
					` : html`
						<alps-raw-editor 
							.script=${this.script}
							@script-changed=${this.handleRawScriptChange}
						></alps-raw-editor>
					`}
				</alps-setting-group>
			</div>

			${this.showSwitchRawConfirm ? html`
				<ui-confirm
					title=${this.i18nStore.t('managesieve.warningRawSwitchTitle')}
					message="${this.i18nStore.t('managesieve.warningRawSwitch')}"
					confirmText=${this.i18nStore.t('managesieve.warningRawSwitchConfirm')}
					isDanger=${true}
					@confirm=${this.confirmSwitchToRaw}
					@cancel=${() => this.showSwitchRawConfirm = false}
				></ui-confirm>
			` : ''}
		`;
	}
}
