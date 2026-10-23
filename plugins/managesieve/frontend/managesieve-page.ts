import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import type { VisualState } from './sieve-compiler';
import { SieveCompiler } from './sieve-compiler';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-setting-group';
import './raw-editor';
import './visual-editor';
import { managesieveService, TwoVacationsError } from './managesieve-service';
import '../../../frontend/src/components/ui-confirm';
import { UnsavedEdit } from './unsaved';

/** The filters as they were left unsaved, in the editor they were left in. */
interface FiltersEdit {
	mode: 'visual' | 'raw';
	script: string;
	visualState: VisualState;
}

/** The filters left unsaved, for the page's next visit. */
const unsavedFilters = new UnsavedEdit<FiltersEdit>();

@customElement('alps-managesieve-page')
export class ManageSievePage extends LitElement {
	@consume({ context: i18nContext, subscribe: true })
	i18nStore!: I18nStore;

	@state() private mode: 'visual' | 'raw' = 'visual';
	@state() private script = '';
	/** The script as the server holds it: what the raw editor measures edits against. */
	@state() private storedScript = '';
	@state() private visualState: VisualState = { rules: [] };
	@state() folders: string[] = [];

	@state() private isLoading = true;
	/**
	 * The script could not be read. No editor is offered then: a save writes
	 * the whole filter set, and one made from an editor over a failed read
	 * replaced every filter the server held with whatever was added there.
	 */
	@state() private loadFailed = false;
	@state() private isSaving = false;
	@state() private showSwitchRawConfirm = false;

	static styles = css`
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
	`;

	connectedCallback() {
		super.connectedCallback();
		this.fetchScript();
		this.fetchFolders();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		// A page still reading leaves what an earlier visit kept as it is.
		if (this.isLoading || this.loadFailed) return;
		if (this.unsaved) {
			unsavedFilters.keep(this.storedScript, { mode: this.mode, script: this.script, visualState: this.visualState });
		} else {
			unsavedFilters.forget();
		}
	}

	/** Whether the editor on screen holds what the server does not: Save is offered. */
	private get unsaved(): boolean {
		if (this.mode === 'raw') return this.script !== this.storedScript;
		const editor = this.shadowRoot?.querySelector('alps-visual-editor') as { isDirty?: boolean } | null;
		return editor?.isDirty === true;
	}

	/**
	 * Puts back the filters left unsaved on the last visit, over the script just
	 * read, if that is the script they were made on. The visual editor takes the
	 * first rules it is given for the saved ones, so it is told which those are.
	 */
	private async restoreUnsaved() {
		// Taken only by a page still on screen: one left before the read
		// answered would take the edit away with it.
		if (this.loadFailed || !this.isConnected) return;
		const kept = unsavedFilters.take(this.storedScript);
		if (!kept) return;
		const saved = JSON.stringify(this.visualState);
		this.mode = kept.mode;
		this.script = kept.script;
		this.visualState = kept.visualState;
		if (kept.mode !== 'visual') return;
		await this.updateComplete;
		const editor = this.shadowRoot?.querySelector('alps-visual-editor') as { markClean?: (snapshot: string) => void } | null;
		editor?.markClean?.(saved);
	}

	private async fetchScript() {
		this.isLoading = true;
		this.loadFailed = false;
		try {
			const data = await managesieveService.fetchScript();
			this.script = data.content || '';
			this.storedScript = this.script;
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
			this.loadFailed = true;
		} finally {
			this.isLoading = false;
		}
		await this.restoreUnsaved();
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

	/**
	 * What the Settings window asks before a Close, an Escape or another
	 * section would unmount the filters (its `UnsavedChanges`): the open
	 * editor's own measure, the one that offers its Save.
	 */
	get hasUnsavedChanges(): boolean {
		if (this.isLoading || this.loadFailed) return false;
		if (this.mode === 'raw') return this.script !== this.storedScript;
		const editor = this.shadowRoot?.querySelector('alps-visual-editor') as { isDirty?: boolean } | null;
		return editor?.isDirty === true;
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
			// Snapshotted now, not after the PUT: a rule edited while it is in flight
			// must still read as unsaved when it lands.
			const sentSnapshot = JSON.stringify(this.visualState);

			const { autoReplyOn } = await managesieveService.saveScript(compiled, 'PUT');
			this.storedScript = compiled;
			// Without rules the script is switched off, unless an auto-reply that
			// is on goes on running in it.
			const msgKey = compiled.trim() === '' && !autoReplyOn ? 'managesieve.toast.deactivated' : 'managesieve.toast.saved';
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.i18nStore.t(msgKey), duration: 3000 } }));
			const editor = this.shadowRoot?.querySelector('alps-visual-editor') as any;
			if (editor && editor.markClean) editor.markClean(sentSnapshot);
		} catch (e: any) {
			const message = e instanceof TwoVacationsError
				? this.i18nStore.t('managesieve.toast.autoReplyOn')
				: e.message || this.i18nStore.t('managesieve.toast.networkError');
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, duration: 5000, type: 'error' } }));
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
					` : this.loadFailed ? html`
						<div class="load-error">
							<div role="alert">${this.i18nStore.t('managesieve.loadError')}</div>
							<alps-button variant="normal" @click=${() => this.fetchScript()}>
								${this.i18nStore.t('managesieve.loadErrorRetry')}
							</alps-button>
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
							.stored=${this.storedScript}
							@script-changed=${this.handleRawScriptChange}
							@script-saved=${(e: CustomEvent) => { this.storedScript = e.detail.script; }}
						></alps-raw-editor>
					`}
				</alps-setting-group>
			</div>

			${this.showSwitchRawConfirm ? html`
				<ui-confirm
					heading=${this.i18nStore.t('managesieve.warningRawSwitchTitle')}
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
