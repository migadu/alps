import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { managesieveService } from './managesieve-service';
import '../../../frontend/src/components/alps-button';

@customElement('alps-raw-editor')
export class RawEditor extends LitElement {
	private initialScript: string | null = null;
	@state() private isDirty = false;
	@consume({ context: i18nContext })
	i18nStore!: I18nStore;

	@property({ type: String }) script = '';
	@state() private isValidating = false;
	@state() private isSaving = false;

	static styles = css`
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
	`;

	willUpdate(changedProperties: Map<string, any>) {
		if (changedProperties.has('script')) {
			if (this.initialScript === null) {
				this.initialScript = this.script;
			}
			this.isDirty = this.script !== this.initialScript;
		}
	}

	
	private highlight(code: string) {
		if (!code) return '';
		
		let html_str = code
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
			
		const regex = /(#.*|\/\*[\s\S]*?\*\/)|("[^"\\]*(?:\\.[^"\\]*)*")|\b(require|if|else|elsif|stop|fileinto|keep|discard|redirect)\b|\b(anyof|allof|not|contains|is|matches|over|under)\b/gi;
		
		html_str = html_str.replace(regex, (match, comment, str, keyword, operator) => {
			if (comment) return `<span class="sieve-comment">${comment}</span>`;
			if (str) return `<span class="sieve-string">${str}</span>`;
			if (keyword) return `<span class="sieve-keyword">${keyword}</span>`;
			if (operator) return `<span class="sieve-operator">${operator}</span>`;
			return match;
		});
		
		// Ensure trailing newlines don't collapse the layout
		if (html_str.endsWith('\n')) {
		    html_str += ' ';
		}
		
		return unsafeHTML(html_str);
	}

	
	private handleScroll(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		const layer = this.shadowRoot?.querySelector('.highlight-layer') as HTMLDivElement;
		if (layer) {
			layer.scrollTop = target.scrollTop;
			layer.scrollLeft = target.scrollLeft;
		}
	}

	private handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		this.script = target.value;
		this.dispatchEvent(new CustomEvent('script-changed', { detail: { script: this.script } }));
	}

	private async validate() {
		this.isValidating = true;
		try {
			await managesieveService.validateScript(this.script);
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.i18nStore.t('managesieve.toast.valid'), timeout: 3000 } }));
		} catch (e: any) {
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: e.message || this.i18nStore.t('managesieve.toast.networkError'), timeout: 5000, type: 'error' } }));
		} finally {
			this.isValidating = false;
		}
	}

	private async save() {
		this.isSaving = true;
		try {
			await managesieveService.saveScript(this.script, 'PUT');
			this.initialScript = this.script;
			this.isDirty = false;
			const msgKey = this.script.trim() === '' ? 'managesieve.toast.deactivated' : 'managesieve.toast.saved';
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.i18nStore.t(msgKey), timeout: 3000 } }));
		} catch (e: any) {
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: e.message || this.i18nStore.t('managesieve.toast.networkError'), timeout: 5000, type: 'error' } }));
		} finally {
			this.isSaving = false;
		}
	}

	render() {
		return html`
			<div class="editor-container">
				<div class="code-area">
					<div class="highlight-layer">${this.highlight(this.script)}</div>
					<textarea .value=${this.script} @input=${this.handleInput} @scroll=${this.handleScroll} spellcheck="false"></textarea>
				</div>
				<div class="actions">
					<alps-button variant="text" ?spinning=${this.isValidating} ?disabled=${this.isSaving} @click=${this.validate}>
						${this.i18nStore.t('managesieve.raw.validate')}
					</alps-button>
					<div style="flex: 1;"></div>
					<alps-button variant="primary" ?spinning=${this.isSaving} ?disabled=${this.isValidating || !this.isDirty} @click=${this.save}>
						${this.i18nStore.t('managesieve.raw.save')}
					</alps-button>
				</div>
			</div>
		`;
	}
}
