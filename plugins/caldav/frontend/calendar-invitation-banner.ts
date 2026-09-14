import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { renderIcon } from '../../../frontend/src/utils/ui';
import { isVersionConflict } from '../../../frontend/src/utils/fetch-utils';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-select';
import { invitationService, type InvitationPerson, type InvitationView } from './invitation-service';

type Answer = 'accepted' | 'tentative' | 'declined';

const STATUS_KEYS: Record<string, string> = {
    'accepted': 'accepted',
    'tentative': 'tentative',
    'declined': 'declined',
    'needs-action': 'needsAction',
    'delegated': 'delegated',
    'completed': 'completed',
    'in-process': 'inProcess',
};

/** The dictionary key of an attendee's answer. */
export function statusKey(status?: string): string {
    return STATUS_KEYS[status ?? ''] ?? 'needsAction';
}

/** The line each state says; 'answer' says the user's own answer instead. */
const STATE_KEYS: Record<string, string> = {
    'update': 'update',
    'outdated': 'outdated',
    'organizer': 'organizer',
    'not-invited': 'notInvited',
    'cancel': 'cancel',
    'cancelled': 'cancelled',
    'reply': 'reply',
    'replied': 'replied',
    'unknown': 'unknown',
    'add': 'add',
    'added': 'added',
    'unsupported': 'unsupported',
};

const personName = (person: InvitationPerson) => person.name || person.email;

/**
 * The invitation a message carries, above the message: what it is, when, who
 * asks, whether it clashes with the calendar, and the answers.
 *
 * Everything it shows and does is the server's reading of the message in the
 * mailbox; nothing is parsed here. An update, cancellation or reply that its
 * rightful sender sent is applied as the message opens, which is the closest
 * a webmail with no delivery hook comes to the calendar keeping itself up to
 * date; anything else waits for a click.
 */
@customElement('calendar-invitation-banner')
export class CalendarInvitationBanner extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;

    @property() mailbox = '';
    @property() uid = '';

    @state() view: InvitationView | null = null;
    @state() busy = false;
    @state() notice: { key: string; tone: 'info' | 'error' } | null = null;
    @state() calendarPath = '';

    /** Drops a read that a newer one for another message has overtaken. */
    private loadSeq = 0;
    /** Messages applied on opening once already, so a failure is not retried in a loop. */
    private autoApplied = new Set<string>();

    static styles = css`
        :host {
            display: block;
            margin: 12px 16px 0;
        }
        .card {
            display: flex;
            gap: 12px;
            padding: 12px 16px;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 8px;
            background: var(--bg-secondary, #f9fafb);
            color: var(--text-primary, #111827);
            font-size: 13px;
        }
        .icon svg {
            width: 22px;
            height: 22px;
            fill: currentColor;
            color: var(--accent-color, #2563eb);
        }
        .body {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .eyebrow {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted, #6b7280);
        }
        .title {
            font-size: 15px;
            font-weight: 600;
            word-break: break-word;
        }
        .title.struck {
            text-decoration: line-through;
        }
        .muted {
            color: var(--text-secondary, #4b5563);
        }
        .clash {
            color: var(--warning-text, #b45309);
        }
        .warning, .notice.error {
            color: var(--error, #b91c1c);
        }
        .actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            margin-top: 6px;
        }
        .actions:empty {
            display: none;
        }
        alps-select {
            min-width: 140px;
        }
    `;

    protected willUpdate(changed: PropertyValues<this>) {
        if (changed.has('mailbox') || changed.has('uid')) {
            this.view = null;
            this.notice = null;
            void this.load();
        }
    }

    private t(key: string, params?: Record<string, unknown>): string {
        return this.i18nStore?.t(key, params) ?? key;
    }

    async load() {
        const seq = ++this.loadSeq;
        const { mailbox, uid } = this;
        if (!mailbox || !uid) return;
        let view: InvitationView | null;
        try {
            view = await invitationService.fetchInvitation(mailbox, uid);
        } catch (err) {
            console.error('Failed to read the invitation', err);
            if (seq === this.loadSeq) this.view = null;
            return;
        }
        if (seq !== this.loadSeq) return;
        this.view = view;
        if (!view) return;
        if (!view.calendars.some(c => c.path === this.calendarPath)) {
            this.calendarPath = view.copy?.calendarPath || view.calendars[0]?.path || '';
        }
        const key = JSON.stringify([mailbox, uid]);
        if (view.autoApply && !this.autoApplied.has(key)) {
            this.autoApplied.add(key);
            await this.apply();
        }
    }

    private async respond(status: Answer) {
        const view = this.view;
        if (!view || this.busy) return;
        this.busy = true;
        this.notice = null;
        try {
            const saved = await invitationService.respond({
                mailbox: this.mailbox,
                uid: this.uid,
                status,
                calendarPath: view.copy ? undefined : this.calendarPath,
                lang: this.i18nStore?.getLanguage?.(),
            });
            this.notice = saved.sendFailed
                ? { key: 'invitations.sendFailed', tone: 'error' }
                : { key: saved.sent ? 'invitations.sent' : 'invitations.saved', tone: 'info' };
        } catch (err) {
            console.error('Failed to answer the invitation', err);
            this.notice = { key: isVersionConflict(err) ? 'invitations.changedElsewhere' : 'invitations.answerFailed', tone: 'error' };
        } finally {
            this.busy = false;
        }
        await this.load();
    }

    private async apply() {
        const view = this.view;
        if (!view || this.busy) return;
        this.busy = true;
        this.notice = null;
        try {
            const saved = await invitationService.apply({ mailbox: this.mailbox, uid: this.uid, calendarPath: this.calendarPath });
            const key = saved.removed ? 'invitations.removed' : view.state === 'add' ? 'invitations.added' : 'invitations.updated';
            this.notice = { key, tone: 'info' };
        } catch (err) {
            console.error('Failed to update the calendar', err);
            this.notice = { key: isVersionConflict(err) ? 'invitations.changedElsewhere' : 'invitations.applyFailed', tone: 'error' };
        } finally {
            this.busy = false;
        }
        await this.load();
    }

    private kindKey(v: InvitationView): string {
        switch (v.method) {
            case 'cancel': return 'cancelled';
            case 'reply': return 'reply';
            case 'request':
                if (v.kind === 'task') return 'task';
                return v.state === 'update' ? 'updated' : 'invitation';
        }
        return v.kind === 'task' ? 'task' : 'event';
    }

    /** When, in the reader's own zone and language. */
    private when(v: InvitationView): string {
        const locale = this.i18nStore?.getIntlLanguage?.() || undefined;
        const day = new Intl.DateTimeFormat(locale, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        const dateOnly = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`);
        if (v.kind === 'task' && !v.start) {
            if (!v.end) return '';
            const due = v.allDay ? day.format(dateOnly(v.end)) : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v.end));
            return `${this.t('tasks.due')}: ${due}`;
        }
        if (!v.start) return '';
        if (v.allDay) {
            const first = dateOnly(v.start);
            if (!v.end) return day.format(first);
            const last = dateOnly(v.end);
            last.setDate(last.getDate() - 1);
            return last > first ? `${day.format(first)} - ${day.format(last)}` : day.format(first);
        }
        const start = new Date(v.start);
        const end = v.end ? new Date(v.end) : start;
        const format = new Intl.DateTimeFormat(locale, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        const range = (format as Intl.DateTimeFormat & { formatRange?: (a: Date, b: Date) => string }).formatRange;
        return end > start && range ? range.call(format, start, end) : format.format(start);
    }

    private renderStateLine(v: InvitationView) {
        if (v.ended) {
            return html`
                <div class="muted state ended">${this.t('invitations.states.ended')}</div>
                ${v.status && v.status !== 'needs-action' ? html`<div class="muted answer">${this.t('invitations.yourAnswer')}: ${this.t(`invitations.statuses.${statusKey(v.status)}`)}</div>` : nothing}
            `;
        }
        if (v.state === 'answer') {
            if (!v.status || v.status === 'needs-action') return nothing;
            return html`<div class="muted answer">${this.t('invitations.yourAnswer')}: ${this.t(`invitations.statuses.${statusKey(v.status)}`)}</div>`;
        }
        const key = STATE_KEYS[v.state];
        return key ? html`<div class="muted state">${this.t(`invitations.states.${key}`)}</div>` : nothing;
    }

    private renderClashes(v: InvitationView) {
        if (v.ended || v.kind !== 'event' || v.method !== 'request' || (v.state !== 'answer' && v.state !== 'update') || v.status === 'declined') {
            return nothing;
        }
        if (!v.clashes.length) {
            return html`<div class="muted clashes">${this.t('invitations.noConflicts')}</div>`;
        }
        const names = v.clashes.map(c => c.summary || this.t('calendar.noTitle')).join(', ');
        return html`<div class="clash clashes">${this.t('invitations.conflictsWith', { names })}</div>`;
    }

    /** Only where the sender is who may change the calendar: a first invitation, an update, a cancellation, a reply. */
    private renderSender(v: InvitationView) {
        if (v.ended || v.senderVerified || !v.sender || !['answer', 'update', 'cancel', 'reply'].includes(v.state)) return nothing;
        const key = v.method === 'reply' ? 'invitations.unverifiedReply' : 'invitations.unverified';
        return html`<div class="warning sender">${this.t(key, { sender: v.sender })}</div>`;
    }

    private renderPicker(v: InvitationView) {
        if (v.copy || v.calendars.length < 2) return nothing;
        return html`
            <alps-select
                .value=${this.calendarPath}
                .options=${v.calendars.map(c => ({ value: c.path, label: c.name }))}
                title=${this.t('invitations.calendar')}
                ?disabled=${this.busy}
                @change=${(e: Event) => { this.calendarPath = (e.target as HTMLSelectElement).value; }}
            ></alps-select>
        `;
    }

    private renderActions(v: InvitationView) {
        // Over: an answer would tell the organizer about the past, and an
        // update or cancellation would only rewrite its record.
        if (v.ended) return nothing;
        if (v.method === 'request' && ['answer', 'update', 'outdated'].includes(v.state) && v.me) {
            const answer = (status: Answer, label: string) => html`
                <alps-button
                    class="answer-${status}"
                    variant=${v.status === status ? 'primary' : 'normal'}
                    aria-pressed=${v.status === status ? 'true' : 'false'}
                    ?disabled=${this.busy}
                    @click=${() => this.respond(status)}
                >${this.t(label)}</alps-button>
            `;
            return html`
                ${answer('accepted', 'invitations.accept')}
                ${answer('tentative', 'invitations.maybe')}
                ${answer('declined', 'invitations.decline')}
                ${this.renderPicker(v)}
                ${v.state === 'update' ? this.applyButton('invitations.updateCalendar') : nothing}
            `;
        }
        switch (v.state) {
            case 'update': return this.applyButton('invitations.updateCalendar');
            case 'cancel': return this.applyButton('invitations.removeFromCalendar');
            case 'reply': return this.applyButton('invitations.recordAnswer');
            case 'add': return html`${this.applyButton('invitations.addToCalendar')}${this.renderPicker(v)}`;
        }
        return nothing;
    }

    private applyButton(label: string) {
        return html`<alps-button class="apply" variant="normal" ?disabled=${this.busy} @click=${() => this.apply()}>${this.t(label)}</alps-button>`;
    }

    render() {
        const v = this.view;
        if (!v) return nothing;
        const cancelled = v.method === 'cancel';
        const kind = this.t(`invitations.kinds.${this.kindKey(v)}`);
        const when = this.when(v);
        return html`
            <div class="card" role="region" aria-label=${kind}>
                <div class="icon">${renderIcon(v.kind === 'task' ? 'checkCircle' : 'calendar')}</div>
                <div class="body">
                    <div class="eyebrow">${kind}</div>
                    <div class="title ${cancelled ? 'struck' : ''}">${v.summary || this.t('calendar.noTitle')}</div>
                    ${when ? html`<div class="when">${when}${v.rrule ? html`, ${this.t('invitations.repeats')}` : nothing}</div>` : nothing}
                    ${v.location ? html`<div class="muted where">${v.location}</div>` : nothing}
                    ${v.method === 'reply' && v.replier
                        ? html`<div class="replier">${this.t(`invitations.answered.${statusKey(v.replier.status)}`, { name: personName(v.replier) })}</div>`
                        : v.organizer ? html`<div class="muted organizer">${this.t('invitations.organizer')}: ${personName(v.organizer)}</div>` : nothing}
                    ${this.renderClashes(v)}
                    ${this.renderStateLine(v)}
                    ${this.renderSender(v)}
                    ${this.notice ? html`<div class="notice ${this.notice.tone}" role="status">${this.t(this.notice.key)}</div>` : nothing}
                    <div class="actions">${this.renderActions(v)}</div>
                </div>
            </div>
        `;
    }
}
