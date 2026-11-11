import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { managesieveService, TwoVacationsError } from './managesieve-service';
import '../../../frontend/src/components/alps-button';
import { MessageCache } from '../../../frontend/src/utils/message-cache';

@customElement('alps-raw-editor')
export class RawEditor extends LitElement {
	@state() private isDirty = false;
	@consume({ context: i18nContext })
	i18nStore!: I18nStore;

	@property({ type: String }) script = '';
	/**
	 * The script as the server holds it. Save is offered whenever the text
	 * differs. The first text this editor was handed stood in for it, and that
	 * is not always what is stored: rules switched here before they were saved
	 * arrived as the first text, so they read as saved and could not be.
	 */
	@property({ type: String }) stored = '';
	@state() private isValidating = false;
	@state() private isSaving = false;

	get hasUnsavedChanges(): boolean {
		// Typing back to the old value while a different value is being saved
		// still needs retaining: that pending write becomes the new baseline.
		return this.script !== this.stored || this.isSaving;
	}

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
		/* The text area fills the box, so the box shows focus, as the other
		   fields do. The transparent outline paints nothing here; forced
		   colors, which drop the border colour and the shadow, give it a
		   system colour. */
		.code-area:focus-within {
			border-color: var(--accent-color, #2563eb);
			box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
			outline: 2px solid transparent;
		}
		.highlight-layer, textarea {
			position: absolute;
			top: 0;
			inset-inline-start: 0;
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
		
		/* Each colour in a light and a dark version, picked by the scheme alps's
		   theme sets on the page. The system's own setting is only a fallback,
		   for a browser without light-dark(): it chose by itself the light
		   palette on alps's dark theme, and the dark one on its light theme. */
		:host {
			--sieve-keyword: #d73a49;
			--sieve-operator: #005cc5;
			--sieve-string: #032f62;
			--sieve-comment: #6a737d;
		}
		@media (prefers-color-scheme: dark) {
			:host {
				--sieve-keyword: #ff7b72;
				--sieve-operator: #79c0ff;
				--sieve-string: #a5d6ff;
				--sieve-comment: #8b949e;
			}
		}
		@supports (color: light-dark(white, black)) {
			:host {
				--sieve-keyword: light-dark(#d73a49, #ff7b72);
				--sieve-operator: light-dark(#005cc5, #79c0ff);
				--sieve-string: light-dark(#032f62, #a5d6ff);
				--sieve-comment: light-dark(#6a737d, #8b949e);
			}
		}

		.sieve-keyword { color: var(--sieve-keyword); font-weight: 600; }
		.sieve-operator { color: var(--sieve-operator); font-weight: 600; }
		.sieve-string { color: var(--sieve-string); }
		.sieve-comment { color: var(--sieve-comment); font-style: italic; }

		.actions {
			display: flex;
			gap: 12px;
			align-items: center;
		}
	`;

	willUpdate(changedProperties: Map<string, any>) {
		if (changedProperties.has('script') || changedProperties.has('stored')) {
			this.isDirty = this.script !== this.stored;
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
		// The verdict is about the text that was SENT. If the script was edited while
		// the check was in flight, a toast would vouch for, or blame, text the server
		// never saw, so a late verdict is dropped.
		const sent = this.script;
		try {
			await managesieveService.validateScript(sent);
			if (this.script !== sent) return;
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.i18nStore.t('managesieve.toast.valid'), duration: 3000 } }));
		} catch (e: any) {
			if (this.script !== sent) return;
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: e.message || this.i18nStore.t('managesieve.toast.networkError'), duration: 5000, type: 'error' } }));
		} finally {
			this.isValidating = false;
		}
	}

	private async save() {
		this.isSaving = true;
		const session = MessageCache.generation();
		// What was SENT, captured before the round trip. Recording this.script once
		// the PUT landed marked anything typed while it was in flight as saved: Save
		// went back to disabled, and those characters never reached the server.
		const sent = this.script;
		try {
			const { autoReplyOn } = await managesieveService.saveScript(sent, 'PUT');
			if (session !== MessageCache.generation()) return;
			this.stored = sent;
			this.dispatchEvent(new CustomEvent('script-saved', { detail: { script: sent } }));
			// As on the visual editor's save: an empty script is switched off,
			// unless an auto-reply that is on goes on running in it.
			const msgKey = sent.trim() === '' && !autoReplyOn ? 'managesieve.toast.deactivated' : 'managesieve.toast.saved';
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.i18nStore.t(msgKey), duration: 3000 } }));
		} catch (e: any) {
			if (session !== MessageCache.generation()) return;
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
			<div class="editor-container">
				<!-- A Sieve script is code, written left to right in every language. -->
				<div class="code-area" dir="ltr">
					<div class="highlight-layer">${this.highlight(this.script)}</div>
					<!-- Named by what it holds: nothing else on the page labels it. -->
					<textarea aria-label=${this.i18nStore?.t('managesieve.raw.script') ?? ''} .value=${this.script} @input=${this.handleInput} @scroll=${this.handleScroll} spellcheck="false"></textarea>
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
