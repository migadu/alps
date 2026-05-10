import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { VisualState, FilterRule, FilterCondition, FilterAction } from './sieve-compiler';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-input';
import '../../../frontend/src/components/alps-select';
import '../../../frontend/src/components/alps-icon-btn';

import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';


@customElement('alps-visual-editor')
export class VisualEditor extends LitElement {
	@property({ type: Boolean }) isSaving = false;
	@state() private initialSnapshot = '';

	willUpdate(changedProperties: Map<string, any>) {
		if (changedProperties.has('state') && this.initialSnapshot === '') {
			this.initialSnapshot = JSON.stringify(this.state);
		}
	}

	get isDirty() {
		return this.initialSnapshot !== '' && this.initialSnapshot !== JSON.stringify(this.state);
	}

	markClean() {
		this.initialSnapshot = JSON.stringify(this.state);
		this.requestUpdate();
	}

	@consume({ context: i18nContext, subscribe: true })
	i18nStore!: I18nStore;

	@property({ type: Object }) state: VisualState = { rules: [] };
	@property({ type: Array }) folders: string[] = [];


	static styles = css`
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
	`;

	private addRule() {
		this.state = {
			...this.state,
			rules: [...this.state.rules, {
				id: Math.random().toString(36).substring(7),
				matchType: 'all',
				conditions: [{ field: 'Subject', operator: 'contains', value: '' }],
				actions: [{ type: 'fileinto', value: this.folders[0] || 'INBOX' }]
			}]
		};
		this.notifyChange();
	}

	private deleteRule(index: number) {
		const newRules = [...this.state.rules];
		newRules.splice(index, 1);
		this.state = { ...this.state, rules: newRules };
		this.notifyChange();
	}

	private updateRule(index: number, updates: Partial<FilterRule>) {
		const newRules = [...this.state.rules];
		newRules[index] = { ...newRules[index], ...updates };
		this.state = { ...this.state, rules: newRules };
		this.notifyChange();
	}

	private addCondition(ruleIndex: number, insertAt?: number) {
		const rule = this.state.rules[ruleIndex];
		const newCond = { field: 'Subject', operator: 'contains', value: '' } as any;
		const newConditions = [...rule.conditions];
		if (insertAt !== undefined) {
			newConditions.splice(insertAt, 0, newCond);
		} else {
			newConditions.push(newCond);
		}
		this.updateRule(ruleIndex, { conditions: newConditions });
	}

	private deleteCondition(ruleIndex: number, condIndex: number) {
		const rule = this.state.rules[ruleIndex];
		const newConditions = [...rule.conditions];
		newConditions.splice(condIndex, 1);
		this.updateRule(ruleIndex, { conditions: newConditions });
	}

	private updateCondition(ruleIndex: number, condIndex: number, updates: Partial<FilterCondition>) {
		const rule = this.state.rules[ruleIndex];
		const newConditions = [...rule.conditions];
		const currentCond = newConditions[condIndex];

		if (updates.field && updates.field !== currentCond.field) {
			if (updates.field === 'Size') {
				if (currentCond.operator !== 'over' && currentCond.operator !== 'under') {
					updates.operator = 'over' as any;
				}
			} else {
				if (currentCond.operator === 'over' || currentCond.operator === 'under') {
					updates.operator = 'contains' as any;
				}
			}
		}

		newConditions[condIndex] = { ...currentCond, ...updates };
		this.updateRule(ruleIndex, { conditions: newConditions });
	}

	private addAction(ruleIndex: number, insertAt?: number) {
		const rule = this.state.rules[ruleIndex];
		const newAct = { type: 'fileinto', value: this.folders[0] || 'INBOX' } as any;
		const newActions = [...rule.actions];
		if (insertAt !== undefined) {
			newActions.splice(insertAt, 0, newAct);
		} else {
			newActions.push(newAct);
		}
		this.updateRule(ruleIndex, { actions: newActions });
	}

	private deleteAction(ruleIndex: number, actionIndex: number) {
		const rule = this.state.rules[ruleIndex];
		const newActions = [...rule.actions];
		newActions.splice(actionIndex, 1);
		this.updateRule(ruleIndex, { actions: newActions });
	}

	private updateAction(ruleIndex: number, actionIndex: number, updates: Partial<FilterAction>) {
		const rule = this.state.rules[ruleIndex];
		const newActions = [...rule.actions];
		newActions[actionIndex] = { ...newActions[actionIndex], ...updates };
		this.updateRule(ruleIndex, { actions: newActions });
	}

	private notifyChange() {
		this.dispatchEvent(new CustomEvent('state-changed', { detail: { state: this.state } }));
	}

	private save() {
		this.dispatchEvent(new CustomEvent('save-requested'));
		// Parent handles the actual API call
	}

	render() {
		return html`
			<div class="editor-container">
				${this.state.rules.length === 0 ? html`
					<div class="empty-state">${this.i18nStore.t('managesieve.visual.noRules')}</div>
				` : this.state.rules.map((rule, rIdx) => html`
					<div class="rule-card">
						<div class="rule-header">
							<alps-icon-btn icon="x" title=${this.i18nStore.t('managesieve.visual.deleteRule')} @click=${() => this.deleteRule(rIdx)}></alps-icon-btn>
						</div>

						<div class="condition-row">
							<div class="row-label">${this.i18nStore.t('managesieve.visual.if')}</div>
							<div class="row-content">
								<alps-select 
									.value=${rule.matchType}
									.options=${[
				{ value: 'all', label: this.i18nStore.t('managesieve.visual.all') },
				{ value: 'any', label: this.i18nStore.t('managesieve.visual.any') }
			]}
									@change=${(e: Event) => this.updateRule(rIdx, { matchType: (e.target as HTMLSelectElement).value as any })}>
								</alps-select>
								<span class="row-text">${this.i18nStore.t('managesieve.visual.ofTheFollowing')}</span>
							</div>
						</div>
						

						${rule.conditions.map((cond, cIdx) => html`
							<div class="condition-row">
								<div class="row-label"></div>
								<alps-select 
									.value=${cond.field}
									.options=${[
					{ value: 'Subject', label: this.i18nStore.t('managesieve.visual.fields.subject') },
					{ value: 'From', label: this.i18nStore.t('managesieve.visual.fields.from') },
					{ value: 'To', label: this.i18nStore.t('managesieve.visual.fields.to') },
					{ value: 'Body', label: this.i18nStore.t('managesieve.visual.fields.body') },
					{ value: 'Size', label: this.i18nStore.t('managesieve.visual.fields.size') }
				]}
									@change=${(e: Event) => this.updateCondition(rIdx, cIdx, { field: (e.target as HTMLSelectElement).value as any })}>
								</alps-select>
								<alps-select 
									.value=${cond.operator}
									.options=${cond.field === 'Size' ? [
										{ value: 'over', label: this.i18nStore.t('managesieve.visual.operators.over') },
										{ value: 'under', label: this.i18nStore.t('managesieve.visual.operators.under') }
									] : [
										{ value: 'contains', label: this.i18nStore.t('managesieve.visual.operators.contains') },
										{ value: 'not_contains', label: this.i18nStore.t('managesieve.visual.operators.not_contains') },
										{ value: 'is', label: this.i18nStore.t('managesieve.visual.operators.is') },
										{ value: 'not_is', label: this.i18nStore.t('managesieve.visual.operators.not_is') }
									]}
									@change=${(e: Event) => this.updateCondition(rIdx, cIdx, { operator: (e.target as HTMLSelectElement).value as any })}>
								</alps-select>
								<alps-input class="flex-1" .value=${cond.value} @input=${(e: Event) => this.updateCondition(rIdx, cIdx, { value: (e.target as any).value })}></alps-input>
								${rule.conditions.length > 1 ? html`<alps-icon-btn icon="minus-square" title=${this.i18nStore.t('managesieve.visual.remove')} @click=${() => this.deleteCondition(rIdx, cIdx)}></alps-icon-btn>` : ''}
								<alps-icon-btn icon="plus-square" title=${this.i18nStore.t('managesieve.visual.add')} @click=${() => this.addCondition(rIdx, cIdx + 1)}></alps-icon-btn>
							</div>
						`)}

						<div class="connector">
							<svg width="24" height="24" class="connector-icon"><use href="/assets/icons/sprite.svg?v=10#arrow-fat-lines-down"></use></svg>
						</div>

						${rule.actions.map((act, aIdx) => html`
							<div class="action-row">
								<div class="row-label">
									${aIdx === 0 ? this.i18nStore.t('managesieve.visual.then') : ''}
								</div>
								<alps-select 
									.value=${act.type}
									.options=${[
						{ value: 'fileinto', label: this.i18nStore.t('managesieve.visual.actions.fileinto') },
						{ value: 'redirect', label: this.i18nStore.t('managesieve.visual.actions.redirect') },
						{ value: 'discard', label: this.i18nStore.t('managesieve.visual.actions.discard') },
						{ value: 'stop', label: this.i18nStore.t('managesieve.visual.actions.stop') }
					]}
									@change=${(e: Event) => this.updateAction(rIdx, aIdx, { type: (e.target as HTMLSelectElement).value as any, value: '' })}>
								</alps-select>
								${act.type === 'fileinto' ? html`
									<alps-select 
										class="flex-1" 
										.value=${act.value || ''}
										.options=${[
							
							...this.folders.map(f => ({ value: f, label: f }))
						]}
										@change=${(e: Event) => this.updateAction(rIdx, aIdx, { value: (e.target as HTMLSelectElement).value })}>
									</alps-select>
								` : act.type === 'redirect' ? html`
									<alps-input type="email" class="flex-1" placeholder=${this.i18nStore.t('managesieve.visual.fields.emailAddress')} .value=${act.value || ''} @input=${(e: Event) => this.updateAction(rIdx, aIdx, { value: (e.target as any).value })}></alps-input>
								` : ''}
								${rule.actions.length > 1 ? html`<alps-icon-btn icon="minus-square" title=${this.i18nStore.t('managesieve.visual.remove')} @click=${() => this.deleteAction(rIdx, aIdx)}></alps-icon-btn>` : ''}
								${act.type !== 'stop' ? html`<alps-icon-btn icon="plus-square" title=${this.i18nStore.t('managesieve.visual.add')} @click=${() => this.addAction(rIdx, aIdx + 1)}></alps-icon-btn>` : ''}
							</div>
						`)}

					</div>
				`)}
				
				<div class="actions-container" >
					<alps-button variant="normal" @click=${this.addRule}>${this.i18nStore.t('managesieve.visual.newRule')}</alps-button>
					${this.state.rules.length > 0 ? html`<alps-button variant="text" @click=${() => this.dispatchEvent(new CustomEvent('switch-raw-requested'))}>${this.i18nStore.t('managesieve.tabs.switchToRaw')}</alps-button>` : ''}
					<div class="flex-1"></div>
					${this.isDirty ? html`<alps-button variant="primary" ?spinning=${this.isSaving} ?disabled=${this.isSaving} @click=${this.save}>${this.i18nStore.t('managesieve.visual.saveFilters')}</alps-button>` : ''}
				</div>
			</div>
		`;
	}
}
