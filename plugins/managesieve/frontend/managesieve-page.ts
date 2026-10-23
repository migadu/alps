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
	private storedVisualSnapshot = JSON.stringify(this.visualState);
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
	private visit = unsavedFilters.visit();
	private retainEdit = true;
	private loadRequest = 0;

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
		this.visit = unsavedFilters.visit();
		this.retainEdit = true;
		this.fetchScript();
		this.fetchFolders();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		// A page still reading leaves what an earlier visit kept as it is.
		if (!this.retainEdit || this.isLoading || this.loadFailed) return;
		if (this.unsaved) {
			unsavedFilters.keep(this.storedScript, { mode: this.mode, script: this.script, visualState: this.visualState }, this.visit);
		} else {
			unsavedFilters.forget(this.visit);
		}
	}

	discardUnsavedChanges() {
		this.retainEdit = false;
		unsavedFilters.forget(this.visit);
	}

	/** Whether the editor on screen holds what the server does not: Save is offered. */
	private get unsaved(): boolean {
		if (this.mode === 'raw') {
			const editor = this.shadowRoot?.querySelector('alps-raw-editor') as { hasUnsavedChanges?: boolean } | null;
			return this.script !== this.storedScript || editor?.hasUnsavedChanges === true;
		}
		// Retention cannot depend on the child's first render/markClean: Back
		// may remove it while a restored editor is still publishing that state.
		return JSON.stringify(this.visualState) !== this.storedVisualSnapshot || this.isSaving;
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
		const kept = unsavedFilters.take(this.storedScript, this.visit);
		if (!kept) return;
		const saved = this.storedVisualSnapshot;
		const visit = this.visit;
		const request = this.loadRequest;
		this.mode = kept.mode;
		this.script = kept.script;
		this.visualState = kept.visualState;
		if (kept.mode !== 'visual') return;
		await this.updateComplete;
		if (!this.isConnected || this.visit !== visit || this.loadRequest !== request || !unsavedFilters.current(visit)) return;
		const editor = this.shadowRoot?.querySelector('alps-visual-editor') as { markClean?: (snapshot: string) => void } | null;
		editor?.markClean?.(saved);
	}

	private async fetchScript(): Promise<void> {
		const visit = this.visit;
		const revision = unsavedFilters.revision;
		const request = ++this.loadRequest;
		const current = () => this.visit === visit && request === this.loadRequest && unsavedFilters.current(visit);
		this.isLoading = true;
		this.loadFailed = false;
		try {
			const data = await managesieveService.fetchScript();
			if (!current()) return;
			if (revision !== unsavedFilters.revision) return this.fetchScript();
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
			this.storedVisualSnapshot = JSON.stringify(this.visualState);
		} catch (e) {
			if (!current()) return;
			console.error('Failed to fetch Sieve script', e);
			this.loadFailed = true;
		} finally {
			if (current()) this.isLoading = false;
		}
		if (current()) await this.restoreUnsaved();
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
		return this.unsaved;
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
		const visit = this.visit;
		const base = this.storedScript;
		this.isSaving = true;
		try {
			const compiled = SieveCompiler.compile(this.visualState);
			this.script = compiled; // update raw script cache too
			// Snapshotted now, not after the PUT: a rule edited while it is in flight
			// must still read as unsaved when it lands.
			const sentSnapshot = JSON.stringify(this.visualState);

			const { autoReplyOn } = await managesieveService.saveScript(compiled, 'PUT');
			if (!unsavedFilters.current(visit)) return;
			unsavedFilters.savedAs(base, compiled, visit);
			if (this.visit !== visit) return;
			this.storedScript = compiled;
			this.storedVisualSnapshot = sentSnapshot;
			// Without rules the script is switched off, unless an auto-reply that
			// is on goes on running in it.
			const msgKey = compiled.trim() === '' && !autoReplyOn ? 'managesieve.toast.deactivated' : 'managesieve.toast.saved';
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.i18nStore.t(msgKey), duration: 3000 } }));
			const editor = this.shadowRoot?.querySelector('alps-visual-editor') as any;
			if (editor && editor.markClean) editor.markClean(sentSnapshot);
		} catch (e: any) {
			if (this.visit !== visit || !unsavedFilters.current(visit)) return;
			const message = e instanceof TwoVacationsError
				? this.i18nStore.t('managesieve.toast.autoReplyOn')
				: e.message || this.i18nStore.t('managesieve.toast.networkError');
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, duration: 5000, type: 'error' } }));
		} finally {
			if (this.visit === visit) this.isSaving = false;
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
							@script-saved=${(e: CustomEvent) => {
								unsavedFilters.savedAs(this.storedScript, e.detail.script, this.visit);
								this.storedScript = e.detail.script;
							}}
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
