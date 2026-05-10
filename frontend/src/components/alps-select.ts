import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { renderIcon } from '../utils/ui';

@customElement('alps-select')
export class AlpsSelect extends LitElement {
	@property({ type: String }) value = '';
	@property({ type: Array }) options: Array<{label: string, value: string, disabled?: boolean}> = [];

	static styles = css`
		:host {
			display: block;
			position: relative;
		}

		.select-wrapper {
			position: relative;
			display: flex;
			align-items: center;
			width: 100%;
		}

		select {
			width: 100%;
			height: 36px;
			padding: 0 36px 0 12px; /* Extra padding right for the custom caret */
			background: var(--alps-input-bg, var(--bg-primary, #ffffff));
			border: 1px solid var(--border-color, #e5e7eb);
			border-radius: var(--input-radius, 6px);
			color: var(--text-primary, #111827);
			font-family: var(--font-base, 'Inter', sans-serif);
			font-size: var(--input-font-size, 14px);
			transition: all 0.2s ease;
			box-sizing: border-box;
			outline: none;
			appearance: none;
			-webkit-appearance: none;
			-moz-appearance: none;
			cursor: pointer;
		}

		select:focus {
			border-color: var(--accent-color, #005A9E);
			box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
		}

		select:disabled {
			background: var(--bg-tertiary, #f3f4f6);
			cursor: not-allowed;
			opacity: 0.7;
		}

		.caret {
			position: absolute;
			right: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 16px;
			height: 16px;
			color: var(--text-muted, #9ca3af);
			pointer-events: none;
		}

		.caret svg {
			width: 100%;
			height: 100%;
		}
	`;

	private handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		this.value = target.value;
		this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
	}

	render() {
		return html`
			<div class="select-wrapper">
				<select .value=${this.value} @change=${this.handleChange}>
					${this.options.map(opt => html`<option value=${opt.value} ?disabled=${opt.disabled}>${opt.label}</option>`)}
				</select>
				<span class="caret">
					${renderIcon('caret-down')}
				</span>
			</div>
		`;
	}
}
