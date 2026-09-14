import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { renderIcon } from '../../../frontend/src/utils/ui';
import '../../../frontend/src/components/alps-loader';
import { compareClosed, compareTasks, formatDue, groupOf, intlLocale, priorityBand, TASK_GROUP_ORDER } from './tasks-service';
import type { TaskData, TaskGroup } from './tasks-service';

const GROUP_LABELS: Record<TaskGroup, string> = {
    overdue: 'tasks.groups.overdue',
    today: 'tasks.groups.today',
    week: 'tasks.groups.week',
    undated: 'tasks.groups.undated',
    later: 'tasks.groups.later',
    completed: 'tasks.groups.completed',
};

const PRIORITY_LABELS = {
    high: 'tasks.priorities.high',
    medium: 'tasks.priorities.medium',
    low: 'tasks.priorities.low',
} as const;

/** One mark per step of urgency, so the band does not rest on colour alone. */
const PRIORITY_MARKS = { high: '!!!', medium: '!!', low: '!' } as const;

/**
 * The task rows, grouped by when they are due.
 *
 * It writes nothing: a row's checkbox fires `toggle-complete` and the row
 * itself `open-task`, each with the task, and the page does the rest.
 */
@customElement('tasks-list')
export class TasksList extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;

    @property({ type: Array }) tasks: TaskData[] = [];
    /** Tasks with a tick on its way to the server. Their checkbox waits for it. */
    @property({ attribute: false }) pendingPaths: Set<string> = new Set();
    /**
     * Tasks ticked, or otherwise edited, out of the view they are shown in.
     * They keep their place, drawn as they now are, until the view is next
     * loaded: a row that vanished the moment it was ticked read as a mis-click,
     * with nothing left to untick.
     */
    @property({ attribute: false }) settling: Set<string> = new Set();
    @property({ type: Boolean }) searching = false;
    @property({ type: Boolean }) loading = false;
    /** The clock rows are grouped against; the current time when unset. */
    @property({ attribute: false }) now?: Date;

    @state() private focusedIndex = -1;

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
        }
        .scroll {
            flex: 1;
            overflow-y: auto;
            padding: 8px 24px 24px;
            outline: none;
        }
        .empty {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px 16px;
            color: var(--text-muted, #6b7280);
            font-size: 14px;
        }
        .group {
            margin: 16px 0 4px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--text-muted, #6b7280);
        }
        .group.overdue {
            color: var(--error, #ef4444);
        }
        .row {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 10px 8px;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            border-radius: 6px;
            cursor: pointer;
        }
        .row:hover,
        .row.focused {
            background: var(--bg-tertiary, #f3f4f6);
        }
        .check {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            margin-top: 1px;
            padding: 0;
            border: 2px solid var(--text-muted, #9ca3af);
            border-radius: 50%;
            background: transparent;
            color: #fff;
            cursor: pointer;
        }
        .check:hover {
            border-color: var(--accent-color, #2563eb);
        }
        .check:disabled {
            opacity: 0.5;
            cursor: progress;
        }
        .row.done .check {
            background: var(--accent-color, #2563eb);
            border-color: var(--accent-color, #2563eb);
        }
        .check svg {
            width: 12px;
            height: 12px;
            fill: currentColor;
        }
        .body {
            flex: 1;
            min-width: 0;
        }
        .title {
            font-size: 14px;
            color: var(--text-primary, #111827);
            overflow-wrap: anywhere;
        }
        .row.done .title,
        .row.cancelled .title {
            text-decoration: line-through;
            color: var(--text-muted, #6b7280);
        }
        .meta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            margin-top: 2px;
            font-size: 12px;
            color: var(--text-secondary, #4b5563);
        }
        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        .due.overdue {
            color: var(--error, #ef4444);
            font-weight: 500;
        }
        .repeats svg {
            display: block;
            width: 12px;
            height: 12px;
            fill: currentColor;
        }
        .priority {
            font-weight: 700;
            letter-spacing: -1px;
        }
        .priority.high {
            color: var(--error, #ef4444);
        }
        .priority.medium {
            color: #d97706;
        }
        .priority.low {
            color: var(--text-muted, #6b7280);
        }
        .chip {
            padding: 0 6px;
            border-radius: 4px;
            background: var(--bg-tertiary, #f3f4f6);
        }
        @media (max-width: 768px) {
            .scroll {
                padding: 4px 12px 16px;
            }
        }
    `;

    /** The groups in display order, each sorted for the question it answers. */
    groups(): Array<[TaskGroup, TaskData[]]> {
        const now = this.now ?? new Date();
        const grouped = new Map<TaskGroup, TaskData[]>();
        for (const task of this.tasks) {
            // A settling row stays in the group it was ticked in.
            const group = this.settling.has(task.path) ? groupOf({ ...task, status: 'needs-action' }, now) : groupOf(task, now);
            const rows = grouped.get(group);
            if (rows) rows.push(task);
            else grouped.set(group, [task]);
        }
        for (const [group, rows] of grouped) rows.sort(group === 'completed' ? compareClosed : compareTasks);
        return TASK_GROUP_ORDER.filter(group => grouped.has(group)).map(group => [group, grouped.get(group)!]);
    }

    private toggle(task: TaskData) {
        if (this.pendingPaths.has(task.path)) return;
        this.dispatchEvent(new CustomEvent('toggle-complete', { detail: { task, done: task.status !== 'completed' } }));
    }

    private open(task: TaskData) {
        this.dispatchEvent(new CustomEvent('open-task', { detail: { task } }));
    }

    /**
     * Arrow keys walk the rows, Enter opens one and Space ticks it.
     *
     * Only keys aimed at the list itself count. A row's checkbox is a button
     * with its own Enter and Space, and acting on those as they bubble up would
     * open the task being ticked.
     */
    private handleKeyDown(e: KeyboardEvent) {
        if (e.target !== e.currentTarget) return;
        const ordered = this.groups().flatMap(([, rows]) => rows);
        if (ordered.length === 0) return;
        const at = Math.min(this.focusedIndex, ordered.length - 1);
        switch (e.key) {
            case 'ArrowDown':
                this.focusedIndex = Math.min(ordered.length - 1, at + 1);
                break;
            case 'ArrowUp':
                this.focusedIndex = Math.max(0, at - 1);
                break;
            case 'Home':
                this.focusedIndex = 0;
                break;
            case 'End':
                this.focusedIndex = ordered.length - 1;
                break;
            case 'Enter':
                if (at < 0) return;
                e.preventDefault();
                this.open(ordered[at]);
                return;
            case ' ':
                if (at < 0) return;
                e.preventDefault();
                this.toggle(ordered[at]);
                return;
            default:
                return;
        }
        e.preventDefault();
        void this.updateComplete.then(() => {
            // Optional-called: jsdom has no scrollIntoView.
            (this.renderRoot.querySelector('.row.focused') as HTMLElement | null)?.scrollIntoView?.({ block: 'nearest' });
        });
    }

    private renderRow(task: TaskData, index: number, group: TaskGroup) {
        const t = (key: string) => this.i18nStore?.t(key) ?? key;
        const done = task.status === 'completed';
        const cancelled = task.status === 'cancelled';
        const band = priorityBand(task.priority);
        const now = this.now ?? new Date();
        return html`
            <div
                class="row ${done ? 'done' : ''} ${cancelled ? 'cancelled' : ''} ${this.focusedIndex === index ? 'focused' : ''}"
                @click=${() => {
                    this.focusedIndex = index;
                    this.open(task);
                }}
            >
                <button
                    class="check"
                    role="checkbox"
                    aria-checked=${done ? 'true' : 'false'}
                    aria-label=${t(done ? 'tasks.markNotDone' : 'tasks.markDone')}
                    ?disabled=${this.pendingPaths.has(task.path)}
                    @click=${(e: Event) => {
                        e.stopPropagation();
                        this.toggle(task);
                    }}
                >
                    ${done ? renderIcon('check') : ''}
                </button>
                <div class="body">
                    <div class="title">${task.title || t('tasks.untitled')}</div>
                    <div class="meta">
                        ${task.color ? html`<span class="dot" style="background: ${task.color}"></span>` : ''}
                        ${cancelled ? html`<span class="chip">${t('tasks.statuses.cancelled')}</span>` : ''}
                        ${task.due
                            ? html`<span class="due ${group === 'overdue' ? 'overdue' : ''}">${formatDue(
                                  task,
                                  now,
                                  t('tasks.today'),
                                  intlLocale(this.i18nStore?.getLanguage?.()),
                              )}</span>`
                            : ''}
                        ${task.rrule
                            ? html`<span class="repeats" role="img" aria-label=${t('tasks.repeats')} title=${t('tasks.repeats')}>${renderIcon('arrowsClockwise')}</span>`
                            : ''}
                        ${task.role === 'attendee' && task.organizer
                            ? html`<span class="assigned">${t('tasks.assignedBy')}: ${task.organizer.name || task.organizer.email}</span>`
                            : task.role === 'organizer' && task.attendees?.length
                                ? html`<span class="assigned">${t('tasks.assignedTo')}: ${task.attendees.map(a => a.name || a.email).join(', ')}</span>`
                                : ''}
                        ${band
                            ? html`<span class="priority ${band}" role="img" aria-label=${t(PRIORITY_LABELS[band])} title=${t(PRIORITY_LABELS[band])}>${PRIORITY_MARKS[band]}</span>`
                            : ''}
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        if (this.loading && this.tasks.length === 0) {
            return html`<div class="empty"><alps-loader></alps-loader></div>`;
        }
        const groups = this.groups();
        if (groups.length === 0) {
            return html`<div class="empty">${this.i18nStore?.t(this.searching ? 'tasks.noResults' : 'tasks.noTasks')}</div>`;
        }
        // The draw order, so a row's index is the one the keyboard walks.
        let index = -1;
        return html`
            <div class="scroll" tabindex="0" @keydown=${this.handleKeyDown}>
                ${groups.map(
                    ([group, rows]) => html`
                        <div class="group ${group}">${this.i18nStore?.t(GROUP_LABELS[group])}</div>
                        ${repeat(rows, row => row.path, row => this.renderRow(row, ++index, group))}
                    `,
                )}
            </div>
        `;
    }
}
