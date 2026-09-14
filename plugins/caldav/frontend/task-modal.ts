import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { isVersionConflict } from '../../../frontend/src/utils/fetch-utils';
import '../../../frontend/src/components/ui-modal';
import '../../../frontend/src/components/alps-input';
import '../../../frontend/src/components/alps-select';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-address-input';
import '../../../frontend/src/components/ui-confirm';
import { modalButtonStyles } from '../../../frontend/src/components/ui-modal';
import { dueOf, tasksService } from './tasks-service';
import { addressOfPerson, personFromAddress, taskTellsSomeone } from './calendar-service';
import { statusKey } from './calendar-invitation-banner';
import type { TaskData, TaskInput, TaskList, TaskStatus } from './tasks-service';

const PRESETS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;

/** Which repeat choice a stored rule is: a preset the form writes, or CUSTOM
 * for any rule it did not, which is then kept as it is. */
function repeatOf(rrule: string): string {
    if (!rrule) return '';
    const preset = PRESETS.find(freq => rrule === `FREQ=${freq}`);
    return preset ?? 'CUSTOM';
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Creates or edits one task.
 *
 * Fires `saved` with the task as stored (and whether it was created), `delete`
 * with the task when asked to delete it, `conflict` when the server refused an
 * edit because the task changed elsewhere, and `close`.
 */
@customElement('task-modal')
export class TaskModal extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;

    @property({ type: Boolean }) open = false;
    /** The task being edited; none for a new one. */
    @property({ attribute: false }) task?: TaskData;
    @property({ type: Array }) lists: TaskList[] = [];
    /** Where a new task goes unless another list is picked. */
    @property({ type: String }) defaultList = '';
    /** Who tells assignees about a change: the calendar server, or alps by email. */
    @property({ type: String }) scheduling: 'server' | 'email' = 'email';

    @state() title = '';
    @state() description = '';
    @state() dueDate = '';
    @state() dueTime = '';
    @state() allDay = true;
    @state() status: TaskStatus = 'needs-action';
    @state() priority = 0;
    @state() percent = 0;
    @state() repeat = '';
    @state() calendarPath = '';
    @state() saving = false;
    /** Whom the task is assigned to, as the address field spells them. */
    @state() attendees: string[] = [];
    /** Asking whether to email the assignees the changes. */
    @state() askNotify = false;

    private originalRRule = '';
    /** The due fields as the task opened, to tell an untouched due date. */
    private openedDue = { date: '', time: '', allDay: true };

    static styles = [
        modalButtonStyles,
        css`
            .form-group {
                margin-bottom: 16px;
                flex: 1;
            }
            .form-group label {
                display: block;
                margin-bottom: 6px;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-primary, #111827);
            }
            .form-row {
                display: flex;
                gap: 12px;
            }
            alps-input,
            alps-select {
                width: 100%;
            }
            .checkbox {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: -8px 0 16px;
                font-size: 14px;
                cursor: pointer;
            }
            input.number,
            textarea {
                width: 100%;
                box-sizing: border-box;
                padding: 8px 12px;
                border: 1px solid var(--border-color, #e5e7eb);
                border-radius: 4px;
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #111827);
                font-family: inherit;
                font-size: 14px;
            }
            textarea {
                min-height: 80px;
                resize: vertical;
            }
            input.number:focus,
            textarea:focus {
                outline: none;
                border-color: var(--accent-color, #2563eb);
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
            }
            .hint {
                font-size: 13px;
                color: var(--text-muted, #6b7280);
            }
            .assigned {
                margin-bottom: 16px;
                font-size: 13px;
                color: var(--text-secondary, #4b5563);
                overflow-wrap: anywhere;
            }
            .assigned .label {
                font-weight: 500;
            }
            .actions {
                display: flex;
                gap: 8px;
                width: 100%;
            }
            .actions .delete {
                margin-right: auto;
            }
        `,
    ];

    willUpdate(changed: Map<string, unknown>) {
        if (changed.has('open') && this.open) this.reset();
    }

    private reset() {
        const task = this.task;
        this.title = task?.title ?? '';
        this.description = task?.description ?? '';
        this.status = task?.status ?? 'needs-action';
        this.priority = task?.priority ?? 0;
        this.percent = task?.percentComplete ?? 0;
        this.calendarPath = task?.calendarPath || this.defaultList || this.lists[0]?.path || '';
        this.originalRRule = task?.rrule ?? '';
        this.repeat = repeatOf(this.originalRRule);
        this.dueDate = '';
        this.dueTime = '';
        this.allDay = task?.due ? task.allDay : true;
        const due = task ? dueOf(task) : null;
        if (due) {
            this.dueDate = `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`;
            if (!this.allDay) this.dueTime = `${pad(due.getHours())}:${pad(due.getMinutes())}`;
        }
        this.openedDue = { date: this.dueDate, time: this.dueTime, allDay: this.allDay };
        this.attendees = (task?.attendees ?? []).map(addressOfPerson);
        this.askNotify = false;
    }

    /** A task someone else assigned: whom it is assigned to is theirs to say. */
    private get assignedToUser(): boolean {
        return this.task?.role === 'attendee';
    }

    /** The form as the server takes it. */
    input(): TaskInput {
        let due = '';
        const untouched = this.dueDate === this.openedDue.date && this.dueTime === this.openedDue.time && this.allDay === this.openedDue.allDay;
        if (this.task && untouched) {
            // As read, to the second and in its own offset: rebuilt from the
            // form, a time with seconds would come back changed, and the server
            // would rewrite a date nobody touched.
            due = this.task.due ?? '';
        } else if (this.dueDate) {
            due = this.allDay
                ? `${this.dueDate}T00:00:00Z`
                : new Date(`${this.dueDate}T${this.dueTime || '09:00'}`).toISOString();
        }
        // A rule needs a date to repeat from; the form offers none without one.
        const rrule = !due ? '' : this.repeat === 'CUSTOM' ? this.originalRRule : this.repeat ? `FREQ=${this.repeat}` : '';
        return {
            title: this.title.trim(),
            description: this.description,
            due,
            allDay: this.allDay,
            status: this.status,
            percentComplete: this.status === 'completed' ? 100 : this.percent,
            priority: this.priority,
            rrule,
            calendarPath: this.calendarPath,
            etag: this.task?.etag,
        };
    }

    private setStatus(status: TaskStatus) {
        // Reopening a finished task does not leave it at 100 percent.
        if (this.status === 'completed' && status !== 'completed' && this.percent >= 100) this.percent = 0;
        this.status = status;
    }

    private close() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('close'));
    }

    private requestDelete() {
        this.dispatchEvent(new CustomEvent('delete', { detail: { task: this.task } }));
    }

    async handleSave() {
        if (this.saving || !this.title.trim() || !this.calendarPath) return;
        // As in the event editor: a change to a task already assigned is the
        // assignees' to hear about or not; a new assignment is sent.
        if (this.task?.role === 'organizer' && taskTellsSomeone(this.task, this.scheduling)) {
            this.askNotify = true;
            return;
        }
        await this.save();
    }

    private async save(notify?: boolean) {
        this.askNotify = false;
        this.saving = true;
        try {
            const created = !this.task;
            const input: TaskInput = {
                ...this.input(),
                attendees: this.assignedToUser
                    ? undefined
                    : this.attendees.map(personFromAddress).filter((p): p is NonNullable<typeof p> => p !== null),
                notify,
                lang: this.i18nStore?.getLanguage?.(),
            };
            const saved = this.task
                ? await tasksService.updateTask(this.task.path, input)
                : await tasksService.createTask(input);
            if (saved?.sendFailed) {
                window.dispatchEvent(new CustomEvent('show-toast', {
                    detail: { message: this.i18nStore?.t('invitations.notTold'), duration: 8000 },
                }));
            }
            this.open = false;
            this.dispatchEvent(new CustomEvent('saved', { detail: { task: saved, created } }));
        } catch (e) {
            console.error('Failed to save task', e);
            // Refused, not failed: see the event editor, which answers the same
            // refusal the same way.
            const conflict = isVersionConflict(e);
            if (conflict) this.dispatchEvent(new CustomEvent('conflict'));
            window.dispatchEvent(new CustomEvent('show-toast', {
                detail: { message: this.i18nStore?.t(conflict ? 'tasks.saveConflict' : 'tasks.saveFailed'), duration: 8000 },
            }));
        } finally {
            this.saving = false;
        }
    }

    private priorityOptions() {
        const t = (key: string) => this.i18nStore?.t(key) ?? key;
        const options = [
            { value: '0', label: t('tasks.priorities.none') },
            { value: '1', label: t('tasks.priorities.high') },
            { value: '5', label: t('tasks.priorities.medium') },
            { value: '9', label: t('tasks.priorities.low') },
        ];
        // A priority another client wrote between the presets stays selectable
        // as itself, under its band's name, so opening the task does not change it.
        if (!options.some(option => option.value === String(this.priority))) {
            const band = this.priority <= 4 ? 'tasks.priorities.high' : this.priority === 5 ? 'tasks.priorities.medium' : 'tasks.priorities.low';
            options.push({ value: String(this.priority), label: t(band) });
        }
        return options;
    }

    render() {
        if (!this.open) return html``;
        const t = (key: string) => this.i18nStore?.t(key) ?? key;
        const hasDue = !!this.dueDate;
        const task = this.task;

        return html`
            <ui-modal
                title=${task ? t('tasks.editTask') : t('tasks.newTask')}
                width="460px"
                ?dismissible=${!this.saving}
                @cancel=${this.close}
            >
                <div class="form-group">
                    <label>${t('tasks.titleField')}</label>
                    <alps-input
                        class="title-input"
                        .value=${this.title}
                        placeholder=${t('tasks.titlePlaceholder')}
                        @input=${(e: Event) => { this.title = (e.target as HTMLInputElement).value; }}
                    ></alps-input>
                </div>

                ${!task && this.lists.length > 1 ? html`
                    <div class="form-group">
                        <label>${t('tasks.list')}</label>
                        <alps-select
                            class="list-select"
                            .value=${this.calendarPath}
                            .options=${this.lists.map(list => ({ value: list.path, label: list.name }))}
                            @change=${(e: Event) => { this.calendarPath = (e.target as HTMLSelectElement).value; }}
                        ></alps-select>
                    </div>
                ` : ''}

                <div class="form-row">
                    <div class="form-group">
                        <label>${t('tasks.due')}</label>
                        <alps-input
                            class="due-date"
                            type="date"
                            .value=${this.dueDate}
                            @input=${(e: Event) => { this.dueDate = (e.target as HTMLInputElement).value; }}
                        ></alps-input>
                    </div>
                    ${hasDue && !this.allDay ? html`
                        <div class="form-group">
                            <label>${t('tasks.time')}</label>
                            <alps-input
                                class="due-time"
                                type="time"
                                .value=${this.dueTime}
                                @input=${(e: Event) => { this.dueTime = (e.target as HTMLInputElement).value; }}
                            ></alps-input>
                        </div>
                    ` : ''}
                </div>
                ${hasDue ? html`
                    <label class="checkbox">
                        <input
                            class="all-day"
                            type="checkbox"
                            .checked=${this.allDay}
                            @change=${(e: Event) => {
                                this.allDay = (e.target as HTMLInputElement).checked;
                                if (!this.allDay && !this.dueTime) this.dueTime = '09:00';
                            }}
                        />
                        ${t('tasks.allDay')}
                    </label>
                ` : ''}

                <div class="form-row">
                    ${task ? html`
                        <div class="form-group">
                            <label>${t('tasks.status')}</label>
                            <alps-select
                                class="status-select"
                                .value=${this.status}
                                .options=${[
                                    { value: 'needs-action', label: t('tasks.statuses.needsAction') },
                                    { value: 'in-process', label: t('tasks.statuses.inProcess') },
                                    { value: 'completed', label: t('tasks.statuses.completed') },
                                    { value: 'cancelled', label: t('tasks.statuses.cancelled') },
                                ]}
                                @change=${(e: Event) => this.setStatus((e.target as HTMLSelectElement).value as TaskStatus)}
                            ></alps-select>
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <label>${t('tasks.priority')}</label>
                        <alps-select
                            class="priority-select"
                            .value=${String(this.priority)}
                            .options=${this.priorityOptions()}
                            @change=${(e: Event) => { this.priority = Number((e.target as HTMLSelectElement).value); }}
                        ></alps-select>
                    </div>
                </div>

                <div class="form-row">
                    ${task ? html`
                        <div class="form-group">
                            <label for="task-percent">${t('tasks.percentComplete')}</label>
                            <input
                                id="task-percent"
                                class="number"
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                .value=${String(this.status === 'completed' ? 100 : this.percent)}
                                ?disabled=${this.status === 'completed'}
                                @change=${(e: Event) => {
                                    const raw = Number((e.target as HTMLInputElement).value);
                                    this.percent = Math.max(0, Math.min(100, Math.round(raw || 0)));
                                }}
                            />
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <label>${t('tasks.repeat')}</label>
                        ${hasDue ? html`
                            <alps-select
                                class="repeat-select"
                                .value=${this.repeat}
                                .options=${[
                                    { value: '', label: t('calendar.repeatNone') },
                                    { value: 'DAILY', label: t('calendar.repeatDaily') },
                                    { value: 'WEEKLY', label: t('calendar.repeatWeekly') },
                                    { value: 'MONTHLY', label: t('calendar.repeatMonthly') },
                                    { value: 'YEARLY', label: t('calendar.repeatYearly') },
                                    ...(this.repeat === 'CUSTOM' ? [{ value: 'CUSTOM', label: t('calendar.repeatCustom') }] : []),
                                ]}
                                @change=${(e: Event) => { this.repeat = (e.target as HTMLSelectElement).value; }}
                            ></alps-select>
                        ` : html`<div class="hint">${t('tasks.repeatNeedsDue')}</div>`}
                    </div>
                </div>

                <div class="form-group">
                    <label>${t('tasks.notes')}</label>
                    <textarea
                        .value=${this.description}
                        placeholder=${t('tasks.addNotes')}
                        @input=${(e: Event) => { this.description = (e.target as HTMLTextAreaElement).value; }}
                    ></textarea>
                </div>

                ${this.assignedToUser ? html`
                    <div class="assigned">
                        <div><span class="label">${t('tasks.assignedBy')}:</span> ${task?.organizer?.name || task?.organizer?.email || ''}</div>
                    </div>
                ` : html`
                    <div class="form-group">
                        <label>${t('tasks.assignTo')}</label>
                        <alps-address-input
                            class="assignees"
                            .addresses=${this.attendees}
                            @addresses-changed=${(e: CustomEvent) => { this.attendees = e.detail.addresses; }}
                        ></alps-address-input>
                    </div>
                    ${task?.role === 'organizer' && task.attendees?.length ? html`
                        <div class="assigned answers">
                            ${task.attendees.map(a => html`<div>${a.name || a.email}: ${t(`invitations.statuses.${statusKey(a.status)}`)}</div>`)}
                        </div>
                    ` : ''}
                `}

                <div slot="actions" class="actions">
                    ${task ? html`
                        <alps-button class="delete" variant="danger" ?disabled=${this.saving} @click=${this.requestDelete}>
                            ${t('tasks.delete')}
                        </alps-button>
                    ` : ''}
                    <alps-button variant="text" ?disabled=${this.saving} @click=${this.close}>${t('general.cancel')}</alps-button>
                    <alps-button
                        class="save"
                        variant="primary"
                        ?disabled=${this.saving || !this.title.trim() || !this.calendarPath}
                        ?spinning=${this.saving}
                        @click=${this.handleSave}
                    >${t('general.save')}</alps-button>
                </div>
            </ui-modal>

            ${this.askNotify ? html`
                <ui-confirm
                    title=${t('invitations.notifyTitle')}
                    message=${t('tasks.notifyChanges')}
                    confirmText=${t('invitations.send')}
                    secondaryText=${t('invitations.dontSend')}
                    @confirm=${() => this.save(true)}
                    @secondary=${() => this.save(false)}
                    @cancel=${() => { this.askNotify = false; }}
                ></ui-confirm>
            ` : ''}
        `;
    }
}
