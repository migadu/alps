import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { settingsContext, SettingsStore } from '../../../frontend/src/store/settings-store';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-input';
import '../../../frontend/src/components/alps-loader';
import '../../../frontend/src/components/alps-select';
import '../../../frontend/src/components/alps-setting-group';
import { AUTO_REPLY_DAYS, DEFAULT_AUTO_REPLY, type AutoReply } from './auto-reply';
import { managesieveService, TwoVacationsError } from './managesieve-service';
import { UnsavedEdit } from './unsaved';

/** The reply as it was left unsaved, for the page's next visit. */
const unsavedReply = new UnsavedEdit<AutoReply>();

/** Today in the browser's zone, as `YYYY-MM-DD`: the calendar the dates are typed in. */
function today(): string {
	const now = new Date();
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Settings → Auto-reply: a vacation reply the mail server sends on delivery.
 *
 * The reply is a block inside the same active script the filters live in (see
 * auto-reply.ts), and a save re-reads that script and replaces only the block.
 * The page offers only what the server runs: nothing at all without the
 * vacation extension, and the dates only with date and relational. It never
 * offers a form over a script it could not read — a save writes the whole
 * script, and one built on a failed read would be built on nothing — nor over
 * a vacation the filters already send themselves, which a second one would
 * collide with.
 */
@customElement('alps-auto-reply-page')
export class AutoReplyPage extends LitElement {
	@consume({ context: i18nContext, subscribe: true })
	i18nStore!: I18nStore;

	@consume({ context: settingsContext })
	settingsStore?: SettingsStore;

	@state() private loading = true;
	@state() private loadFailed = false;
	@state() private extensions: string[] = [];
	@state() private ownVacation = false;
	/** The reply as the server holds it: what the status line describes, and what Save is measured against. */
	@state() private stored: AutoReply = DEFAULT_AUTO_REPLY;
	@state() private draft: AutoReply = DEFAULT_AUTO_REPLY;
	@state() private saving = false;
	@state() private error = '';

	static styles = css`
		.loading {
			display: flex;
			justify-content: center;
			align-items: center;
			min-height: 200px;
		}
		.checkbox-label {
			display: flex;
			align-items: center;
			gap: 8px;
			cursor: pointer;
			color: var(--text-primary);
			font-weight: 500;
		}
		input[type="checkbox"] {
			width: 16px;
			height: 16px;
			cursor: pointer;
		}
		.state {
			font-size: 13px;
			color: var(--text-muted);
		}
		.state.on {
			color: var(--warning, #f59e0b);
		}
		.notice {
			color: var(--text-secondary);
			line-height: 1.4;
		}
		textarea {
			width: 100%;
			min-height: 140px;
			box-sizing: border-box;
			padding: var(--input-padding, 8px 12px);
			border: 1px solid var(--border-color);
			border-radius: var(--input-radius, 6px);
			background-color: var(--bg-primary);
			color: var(--text-primary);
			font-size: var(--input-font-size, 14px);
			font-family: var(--font-base);
			line-height: 1.5;
			resize: vertical;
			outline: none;
		}
		textarea:focus {
			border-color: var(--accent-color, #2563eb);
			box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
		}
		.dates {
			display: flex;
			gap: 16px;
			flex-wrap: wrap;
		}
		.dates > label {
			display: flex;
			flex-direction: column;
			gap: 6px;
			flex: 1;
			min-width: 160px;
		}
		.field-label {
			font-size: 13px;
			color: var(--text-secondary);
		}
		.actions {
			display: flex;
			align-items: center;
			gap: 12px;
			flex-wrap: wrap;
		}
		.error-message {
			color: var(--danger-color, #dc2626);
			font-size: 13px;
		}
	`;

	connectedCallback() {
		super.connectedCallback();
		this.load();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		// A page still reading leaves what an earlier visit kept as it is.
		if (this.loading || this.loadFailed) return;
		if (this.dirty) unsavedReply.keep(JSON.stringify(this.stored), this.draft);
		else unsavedReply.forget();
	}

	private async load() {
		try {
			const { reply, extensions, ownVacation } = await managesieveService.fetchAutoReply();
			this.extensions = extensions;
			this.ownVacation = ownVacation;
			this.stored = reply ?? DEFAULT_AUTO_REPLY;
			// Dates the server no longer checks have no fields on the page, and a
			// script requiring the extension would be refused, so the draft goes
			// without them — and reads as the unsaved change it is.
			this.draft = this.offersDates ? this.stored : { ...this.stored, start: '', end: '' };
			// Taken only by a page still on screen: one left before the read
			// answered would take the edit away with it.
			const kept = this.isConnected ? unsavedReply.take(JSON.stringify(this.stored)) : null;
			if (kept) this.draft = kept;
		} catch (e) {
			console.error('Failed to fetch the auto-reply', e);
			this.loadFailed = true;
		} finally {
			this.loading = false;
		}
	}

	private t(key: string, params?: Record<string, any>): string {
		return this.i18nStore?.t(key, params) ?? key;
	}

	private get offersDates(): boolean {
		return this.extensions.includes('date') && this.extensions.includes('relational');
	}

	private get dirty(): boolean {
		return JSON.stringify(this.draft) !== JSON.stringify(this.stored);
	}

	/**
	 * The account's own address: what the reply comes from, and the address it
	 * answers for. A login can be a bare user name, so the address the server
	 * gave for it, `loginAddress`, comes first when the settings hold one. The
	 * login is the fallback, and compileAutoReply leaves out one that is no
	 * address. The state is read through these two fields alone, as the
	 * settings may not declare the first.
	 */
	private get address(): string | undefined {
		const state: { loginAddress?: string; loginUsername?: string } | undefined = this.settingsStore?.getState();
		return state?.loginAddress || state?.loginUsername || undefined;
	}

	private edit(changes: Partial<AutoReply>) {
		this.draft = { ...this.draft, ...changes };
		this.error = '';
	}

	/** What would make the reply wrong, said at the field rather than by the server. */
	private problem(reply: AutoReply): string | null {
		if (reply.enabled && reply.message.trim() === '') return 'managesieve.autoReply.errors.emptyMessage';
		// `YYYY-MM-DD` compares as text in calendar order. One day is a window.
		if (reply.start && reply.end && reply.start > reply.end) return 'managesieve.autoReply.errors.invalidWindow';
		return null;
	}

	private async save() {
		if (this.saving) return;
		const reply = this.draft;
		const problem = this.problem(reply);
		if (problem) {
			this.error = this.t(problem);
			return;
		}
		this.saving = true;
		// Turned off only when it was on: a reply that is off keeps its text,
		// and saving an edit to that text turns nothing off.
		const turnedOff = this.stored.enabled && !reply.enabled;
		try {
			await managesieveService.saveAutoReply(reply, this.address);
			// What was SENT is what is stored now; an edit made while the save was
			// in flight still reads as unsaved.
			this.stored = reply;
			const message = this.t(turnedOff ? 'managesieve.autoReply.turnedOff' : 'managesieve.autoReply.saved');
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, duration: 3000 } }));
		} catch (e) {
			if (e instanceof TwoVacationsError) {
				// The filters gained a vacation of their own since the page
				// opened. Nothing was written; the page says what it says on
				// opening such a script.
				this.ownVacation = true;
				return;
			}
			console.error('Failed to save the auto-reply', e);
			window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: this.t('managesieve.autoReply.errors.saveError'), duration: 5000, type: 'error' } }));
		} finally {
			this.saving = false;
		}
	}

	private formatDay(day: string): string {
		const [year, month, date] = day.split('-').map(Number);
		return new Date(year, month - 1, date).toLocaleDateString(this.i18nStore?.getIntlLanguage(), {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * What the stored reply is doing today. Switched on is not the same as
	 * answering: a reply set for next week, or one whose end has passed, sends
	 * nothing, and without this line looks exactly like one that does.
	 */
	private renderState() {
		const { enabled, start, end } = this.stored;
		if (!enabled) return nothing;
		const now = today();
		if (start && start > now) {
			return html`<div class="state">${this.t('managesieve.autoReply.stateScheduled', { date: this.formatDay(start) })}</div>`;
		}
		if (end && end < now) {
			return html`<div class="state">${this.t('managesieve.autoReply.stateFinished')}</div>`;
		}
		return html`<div class="state on">${end
			? this.t('managesieve.autoReply.stateActiveUntil', { date: this.formatDay(end) })
			: this.t('managesieve.autoReply.stateActive')}</div>`;
	}

	private renderIntro(body: unknown) {
		return html`
			<alps-setting-group label=${this.t('managesieve.autoReply.title')} description=${this.t('managesieve.autoReply.description')}>
				${body}
			</alps-setting-group>
		`;
	}

	render() {
		if (this.loading) {
			return html`<div class="loading"><alps-loader></alps-loader></div>`;
		}
		if (this.loadFailed) return this.renderIntro(html`<div class="notice">${this.t('managesieve.autoReply.errors.loadError')}</div>`);
		if (!this.extensions.includes('vacation')) return this.renderIntro(html`<div class="notice">${this.t('managesieve.autoReply.unsupported')}</div>`);
		if (this.ownVacation) return this.renderIntro(html`<div class="notice">${this.t('managesieve.autoReply.ownVacation')}</div>`);

		const draft = this.draft;
		// A stored interval the list does not offer is still shown as itself.
		const intervals = AUTO_REPLY_DAYS.includes(draft.days) ? AUTO_REPLY_DAYS : [...AUTO_REPLY_DAYS, draft.days].sort((a, b) => a - b);
		return html`
			${this.renderIntro(html`
				<label class="checkbox-label">
					<input type="checkbox" .checked=${draft.enabled}
						@change=${(e: Event) => this.edit({ enabled: (e.target as HTMLInputElement).checked })}>
					${this.t('managesieve.autoReply.enable')}
				</label>
				${this.renderState()}
			`)}

			<alps-setting-group label=${this.t('managesieve.autoReply.subject')} description=${this.t('managesieve.autoReply.subjectDesc')}>
				<alps-input class="subject" .value=${draft.subject} placeholder=${this.t('managesieve.autoReply.subjectPlaceholder')}
					@input=${(e: Event) => this.edit({ subject: (e.target as HTMLInputElement).value })}></alps-input>
			</alps-setting-group>

			<alps-setting-group label=${this.t('managesieve.autoReply.message')} description=${this.t('managesieve.autoReply.messageDesc')}>
				<textarea dir="auto" .value=${draft.message} placeholder=${this.t('managesieve.autoReply.messagePlaceholder')}
					@input=${(e: Event) => this.edit({ message: (e.target as HTMLTextAreaElement).value })}></textarea>
			</alps-setting-group>

			${this.offersDates ? html`
				<alps-setting-group label=${this.t('managesieve.autoReply.dates')} description=${this.t('managesieve.autoReply.datesDesc')}>
					<div class="dates">
						<label>
							<span class="field-label">${this.t('managesieve.autoReply.startDate')}</span>
							<alps-input class="start" type="date" .value=${draft.start}
								@input=${(e: Event) => this.edit({ start: (e.target as HTMLInputElement).value })}></alps-input>
						</label>
						<label>
							<span class="field-label">${this.t('managesieve.autoReply.endDate')}</span>
							<alps-input class="end" type="date" .value=${draft.end}
								@input=${(e: Event) => this.edit({ end: (e.target as HTMLInputElement).value })}></alps-input>
						</label>
					</div>
				</alps-setting-group>
			` : nothing}

			<alps-setting-group label=${this.t('managesieve.autoReply.interval')} description=${this.t('managesieve.autoReply.intervalDesc')}>
				<alps-select .value=${String(draft.days)}
					.options=${intervals.map(days => ({ value: String(days), label: this.t('managesieve.autoReply.days', { count: days }) }))}
					@change=${(e: Event) => this.edit({ days: Number((e.target as HTMLSelectElement).value) })}></alps-select>
			</alps-setting-group>

			<alps-setting-group>
				<div class="actions">
					<alps-button variant="primary" ?spinning=${this.saving} ?disabled=${this.saving || !this.dirty} @click=${this.save}>
						${this.t('managesieve.autoReply.save')}
					</alps-button>
					${this.error ? html`<div class="error-message" role="alert">${this.error}</div>` : nothing}
				</div>
			</alps-setting-group>
		`;
	}
}
