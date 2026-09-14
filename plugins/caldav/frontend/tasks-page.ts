import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { settingsContext, SettingsStore } from '../../../frontend/src/store/settings-store';
import { sidebarLayoutStyles } from '../../../frontend/src/components/alps-sidebar';
import '../../../frontend/src/components/alps-sidebar';
import '../../../frontend/src/components/alps-toolbar';
import '../../../frontend/src/components/alps-create-button';
import '../../../frontend/src/components/alps-icon-btn';
import '../../../frontend/src/components/ui-prompt';
import '../../../frontend/src/components/ui-confirm';
import { renderIcon } from '../../../frontend/src/utils/ui';
import { taskTellsSomeone, calendarService, getCalendarColor } from './calendar-service';
import { formatDue, inSmartList, intlLocale, isClosed, scopeOf, tasksService } from './tasks-service';
import type { SmartList, TaskData, TaskList, TaskScope } from './tasks-service';
import './tasks-list';
import './task-modal';

const SIDEBAR_WIDTH_DEFAULT = 250;
const SIDEBAR_WIDTH_MIN = 150;
const SIDEBAR_WIDTH_MAX = 500;
const SIDEBAR_COLLAPSE_THRESHOLD = 120;

const SMART_LISTS: Array<{ id: SmartList; icon: string; label: string }> = [
    { id: 'all', icon: 'listBullets', label: 'tasks.allTasks' },
    { id: 'today', icon: 'calendarBlank', label: 'tasks.today' },
    { id: 'upcoming', icon: 'calendar', label: 'tasks.upcoming' },
    { id: 'undated', icon: 'tray', label: 'tasks.undated' },
    { id: 'completed', icon: 'checkCircle', label: 'tasks.completed' },
];

/**
 * The Tasks tab: the VTODOs in every calendar that takes them.
 *
 * `#/tasks/<list>` names the sidebar list; `?list=` narrows it to one calendar
 * and `?q=` searches. The open work and the finished work are loaded
 * separately (see wantedScope), since finished work only grows and most views
 * never show it.
 */
@customElement('tasks-page')
export class TasksPage extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;

    @consume({ context: settingsContext })
    settingsStore!: SettingsStore;

    @state() tasks: TaskData[] = [];
    @state() lists: TaskList[] = [];
    @state() selectedList: SmartList = 'all';
    @state() selectedCalendar = '';
    @state() searchQuery = '';
    @state() loading = true;
    /** Which tasks `tasks` holds: 'active', 'closed', or 'all' for a search. */
    @state() loadedScope = '';
    @state() pendingPaths: Set<string> = new Set();
    /** See TasksList.settling. */
    @state() settling: Set<string> = new Set();
    @state() modalOpen = false;
    @state() editingTask?: TaskData;
    @state() taskToDelete: TaskData | null = null;
    /** Who tells assignees about changes, as the listing says: the server, or alps by email. */
    @state() scheduling: 'server' | 'email' = 'email';
    @state() private isSpinning = false;
    @state() private listPromptOpen = false;
    @state() private sidebarWidth = SIDEBAR_WIDTH_DEFAULT;
    @state() private sidebarCollapsed = false;
    @state() private isSidebarHovered = false;
    @state() private suppressSidebarHover = false;
    @state() private isSidebarDragging = false;
    @state() private isMobile = window.innerWidth <= 768;
    @state() private mobileSidebarOpen = false;

    private hoverTimeout?: ReturnType<typeof setTimeout>;
    private syncTimer: ReturnType<typeof setInterval> | null = null;
    /** Bumped by every read. Only the newest read's answer is painted. */
    private readEpoch = 0;
    /** Bumped by every local write; see fetchTasks. */
    private mutationEpoch = 0;

    static styles = [
        sidebarLayoutStyles,
        css`
            :host {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
            }
            .app-container.collapsed .main-content {
                position: relative;
                z-index: 25;
                border-left: 1px solid var(--border-color, #e5e7eb);
                box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
            }
            .layout {
                display: flex;
                width: 100%;
                height: 100%;
                overflow: hidden;
                background-color: var(--bg-primary, #ffffff);
            }
            .sidebar-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .sidebar-scroll-content {
                display: flex;
                flex-direction: column;
                gap: 24px;
                height: 100%;
                padding: 16px;
                box-sizing: border-box;
                overflow-y: auto;
            }
            .sidebar-wrapper.collapsed .label,
            .sidebar-wrapper.collapsed .count,
            .sidebar-wrapper.collapsed h3,
            .sidebar-wrapper.collapsed .calendar-lists {
                display: none;
            }
            h3 {
                margin: 0 0 12px 0;
                font-size: 12px;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                color: var(--text-muted, #6b7280);
            }
            .nav-item {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                height: 36px;
                margin-bottom: 2px;
                padding: 0 8px;
                box-sizing: border-box;
                border: none;
                border-radius: 6px;
                background: transparent;
                color: var(--text-primary, #111827);
                font-family: inherit;
                font-size: 14px;
                text-align: left;
                cursor: pointer;
                user-select: none;
            }
            .nav-item:hover {
                background: var(--bg-tertiary, #f3f4f6);
            }
            .nav-item.active {
                background: var(--bg-tertiary, #f3f4f6);
                font-weight: 600;
            }
            .nav-item svg {
                flex-shrink: 0;
                width: 18px;
                height: 18px;
                fill: currentColor;
                color: var(--text-secondary, #4b5563);
            }
            .nav-item .label {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .nav-item .count {
                font-size: 12px;
                color: var(--text-muted, #6b7280);
            }
            .list-dot {
                flex-shrink: 0;
                width: 10px;
                height: 10px;
                margin: 0 4px;
                border-radius: 50%;
            }
            .main-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                background-color: var(--bg-primary, #ffffff);
            }
            .toolbar {
                display: flex;
                flex-shrink: 0;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                height: 57px;
                padding: 0 24px;
                box-sizing: border-box;
                border-bottom: 1px solid var(--border-color, #e5e7eb);
            }
            .toolbar h2 {
                margin: 0;
                overflow: hidden;
                font-size: 24px;
                font-weight: 600;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .toolbar .sub-title {
                font-weight: 300;
                color: var(--text-secondary, #4b5563);
            }
            @media (max-width: 768px) {
                .toolbar {
                    padding: 0 12px;
                }
                .toolbar h2 {
                    font-size: 18px;
                }
            }
        `,
    ];

    private handleSettingsChange = () => {
        if (!this.settingsStore) return;
        const settings = this.settingsStore.getState();
        this.sidebarCollapsed = settings.sidebarCollapsed;
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
        if (settings.checkMailInterval && settings.checkMailInterval > 0) {
            this.syncTimer = setInterval(() => void this.fetchTasks(), settings.checkMailInterval * 60 * 1000);
        }
    };

    private handleResize = () => {
        this.isMobile = window.innerWidth <= 768;
    };

    private handleHashChange = () => {
        if (this.parseHash()) void this.fetchTasks();
    };

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('hashchange', this.handleHashChange);
        if (this.settingsStore) {
            this.settingsStore.addEventListener('change', this.handleSettingsChange);
            this.handleSettingsChange();
        }
        this.parseHash();
        void this.fetchTasks();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('hashchange', this.handleHashChange);
        this.settingsStore?.removeEventListener('change', this.handleSettingsChange);
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
        clearTimeout(this.hoverTimeout);
    }

    /** The tasks the current view needs loaded. A search looks through both halves:
     * a task already done is one of the things people search for. */
    get wantedScope(): string {
        return this.searchQuery ? 'all' : scopeOf(this.selectedList);
    }

    /** Reads the view from the address, and reports whether it needs tasks not yet loaded. */
    parseHash(): boolean {
        const hash = window.location.hash;
        if (!hash.startsWith('#/tasks')) return false;
        const [path, query = ''] = hash.slice(1).split('?');
        const segment = path.split('/')[2] ?? '';
        const params = new URLSearchParams(query);
        const calendar = params.get('list') ?? '';
        const search = params.get('q') ?? '';
        if (!SMART_LISTS.some(list => list.id === segment)) {
            this.navigate('all', calendar, search);
            return false;
        }
        const list = segment as SmartList;
        if (list !== this.selectedList || calendar !== this.selectedCalendar || search !== this.searchQuery) {
            this.settling = new Set();
        }
        this.selectedList = list;
        this.selectedCalendar = calendar;
        this.searchQuery = search;
        return this.wantedScope !== this.loadedScope;
    }

    navigate(list: SmartList, calendar = this.selectedCalendar, query = this.searchQuery) {
        const params = new URLSearchParams();
        if (calendar) params.set('list', calendar);
        if (query) params.set('q', query);
        const search = params.toString();
        const hash = `#/tasks/${list}${search ? `?${search}` : ''}`;
        if (window.location.hash !== hash) window.location.hash = hash;
    }

    async fetchTasks() {
        const epoch = ++this.readEpoch;
        const mutations = this.mutationEpoch;
        const scope = this.wantedScope;
        this.loading = true;
        this.isSpinning = true;
        try {
            const listing = await tasksService.fetchTasks(scope === 'all' ? undefined : (scope as TaskScope));
            if (epoch !== this.readEpoch) return;
            if (mutations !== this.mutationEpoch) {
                // A tick or a save landed while this read was on its way, and
                // the answer may predate it: painted, it would undo the change
                // on screen. Read again instead.
                void this.fetchTasks();
                return;
            }
            this.lists = listing.calendars.map(list => ({ ...list, color: getCalendarColor(list.path) }));
            this.tasks = listing.tasks.map(task => ({ ...task, color: getCalendarColor(task.calendarPath) }));
            this.loadedScope = scope;
            this.scheduling = listing.scheduling === 'server' ? 'server' : 'email';
            this.settling = new Set();
            if (listing.failedCalendars > 0) this.toast('tasks.someListsFailed');
        } catch (e) {
            if (epoch !== this.readEpoch) return;
            console.error('Failed to load tasks', e);
            this.toast('tasks.loadFailed');
        } finally {
            if (epoch === this.readEpoch) this.loading = false;
        }
    }

    /** Whether the current view shows a task, apart from rows left settling. */
    shows(task: TaskData, now: Date = new Date()): boolean {
        if (this.selectedCalendar && task.calendarPath !== this.selectedCalendar) return false;
        const query = this.searchQuery.trim().toLowerCase();
        if (query) {
            return task.title.toLowerCase().includes(query) || (task.description ?? '').toLowerCase().includes(query);
        }
        return inSmartList(task, this.selectedList, now);
    }

    get visibleTasks(): TaskData[] {
        const now = new Date();
        return this.tasks.filter(task => this.shows(task, now) || this.settling.has(task.path));
    }

    /** A sidebar list's size, when the tasks it counts are loaded; null when not. */
    countFor(list: SmartList): number | null {
        if (this.loadedScope !== 'all' && this.loadedScope !== scopeOf(list)) return null;
        const now = new Date();
        return this.tasks.filter(task => (!this.selectedCalendar || task.calendarPath === this.selectedCalendar) && inSmartList(task, list, now)).length;
    }

    private replaceTask(path: string, task: TaskData) {
        this.mutationEpoch++;
        const row = { ...task, color: getCalendarColor(task.calendarPath) };
        this.tasks = this.tasks.map(t => (t.path === path ? row : t));
    }

    async handleToggleComplete(task: TaskData, done: boolean) {
        if (this.pendingPaths.has(task.path)) return;
        this.pendingPaths = new Set(this.pendingPaths).add(task.path);
        this.settling = new Set(this.settling).add(task.path);
        this.replaceTask(task.path, { ...task, status: done ? 'completed' : 'needs-action' });
        try {
            const saved = await tasksService.completeTask(task.path, done, this.i18nStore?.getLanguage?.());
            this.replaceTask(task.path, saved);
            // On a task assigned to the user the tick was their answer.
            if (saved.sendFailed) this.toast('invitations.notTold');
            if (done && !isClosed(saved)) {
                // It repeats: ticked off, it moved to its next occurrence instead.
                this.toast('tasks.movedToNext', { date: this.formatDue(saved) });
            }
        } catch (e) {
            console.error('Failed to update task', e);
            // This row back as it was, and nothing else: a snapshot of the whole
            // list would also undo whatever changed while the tick was in flight.
            this.replaceTask(task.path, task);
            this.toast('tasks.completeFailed');
        } finally {
            const pending = new Set(this.pendingPaths);
            pending.delete(task.path);
            this.pendingPaths = pending;
        }
    }

    handleSaved(e: CustomEvent<{ task: TaskData; created: boolean }>) {
        const { task, created } = e.detail;
        this.closeModal();
        this.mutationEpoch++;
        const row = { ...task, color: getCalendarColor(task.calendarPath) };
        this.tasks = created ? [row, ...this.tasks] : this.tasks.map(t => (t.path === row.path ? row : t));
        if (this.shows(row)) return;
        if (created) {
            // A new task the view hides the moment it is saved reads as a save
            // that failed, such as an undated task added from Today. The view
            // moves to where the task is; the task keeps what was typed.
            const calendar = this.selectedCalendar === row.calendarPath ? this.selectedCalendar : '';
            this.navigate(isClosed(row) ? 'completed' : 'all', calendar, '');
        } else {
            // An edit that takes a task out of the view leaves it in place, as a
            // tick does, until the view is next loaded.
            this.settling = new Set(this.settling).add(row.path);
        }
    }

    async confirmDelete(notify = true) {
        const task = this.taskToDelete;
        if (!task) return;
        this.taskToDelete = null;
        try {
            const removed = await tasksService.deleteTask(task.path, { notify, lang: this.i18nStore?.getLanguage?.() });
            if (removed?.sendFailed) this.toast('invitations.notTold');
            this.mutationEpoch++;
            this.tasks = this.tasks.filter(t => t.path !== task.path);
        } catch (e) {
            console.error('Failed to delete task', e);
            this.toast('tasks.deleteFailed');
        }
    }

    private async handleListPromptSubmit(e: CustomEvent) {
        this.listPromptOpen = false;
        const name = String(e.detail?.name ?? '').trim();
        if (!name) return;
        try {
            await calendarService.createCalendar(name);
            await this.fetchTasks();
        } catch (err) {
            console.error('Failed to create list', err);
            this.toast('tasks.createListFailed');
        }
    }

    private openCreate() {
        this.editingTask = undefined;
        this.modalOpen = true;
        this.mobileSidebarOpen = false;
    }

    private openEdit(task: TaskData) {
        this.editingTask = task;
        this.modalOpen = true;
    }

    private closeModal() {
        this.modalOpen = false;
        this.editingTask = undefined;
    }

    private selectList(list: SmartList) {
        this.mobileSidebarOpen = false;
        this.navigate(list, this.selectedCalendar, '');
    }

    private selectCalendar(path: string) {
        this.mobileSidebarOpen = false;
        this.navigate(this.selectedList, this.selectedCalendar === path ? '' : path, this.searchQuery);
    }

    private formatDue(task: TaskData): string {
        return formatDue(task, new Date(), this.i18nStore?.t('tasks.today') ?? 'Today', intlLocale(this.i18nStore?.getLanguage?.()));
    }

    private toast(key: string, params?: Record<string, string | number>) {
        window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: this.i18nStore?.t(key, params), duration: 5000 },
        }));
    }

    private handleSidebarMouseEnter() {
        if (this.sidebarCollapsed && !this.isSidebarDragging) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = setTimeout(() => {
                this.isSidebarHovered = true;
                this.suppressSidebarHover = false;
            }, 300);
        }
    }

    private handleSidebarMouseLeave() {
        if (this.sidebarCollapsed) {
            clearTimeout(this.hoverTimeout);
            this.isSidebarHovered = false;
        }
    }

    private handleSidebarResize(e: CustomEvent) {
        const width = e.detail.newWidth;
        const collapse = width < SIDEBAR_COLLAPSE_THRESHOLD;
        if (collapse !== this.sidebarCollapsed) {
            this.sidebarCollapsed = collapse;
            this.settingsStore?.updateSettings({ sidebarCollapsed: collapse });
        }
        this.sidebarWidth = collapse ? SIDEBAR_WIDTH_DEFAULT : Math.min(Math.max(width, SIDEBAR_WIDTH_MIN), SIDEBAR_WIDTH_MAX);
    }

    private get username() {
        return this.settingsStore?.getState().loginUsername || '';
    }

    render() {
        const t = (key: string) => this.i18nStore?.t(key) ?? key;
        const collapsed = this.sidebarCollapsed && (!this.isSidebarHovered || this.suppressSidebarHover) && !this.isMobile;
        const current = SMART_LISTS.find(list => list.id === this.selectedList) ?? SMART_LISTS[0];
        const calendarName = this.lists.find(list => list.path === this.selectedCalendar)?.name ?? '';
        const defaultList = this.selectedCalendar || this.lists[0]?.path || '';

        return html`
            <app-header
                currentTab="tasks"
                .username=${this.username}
                .isMobile=${this.isMobile}
                .searchQuery=${this.searchQuery}
                @toggle-sidebar=${() => { this.mobileSidebarOpen = !this.mobileSidebarOpen; }}
                @search-submit=${(e: CustomEvent) => this.navigate(this.selectedList, this.selectedCalendar, e.detail.value)}
            ></app-header>
            <div
                class="app-container ${this.sidebarCollapsed && !this.isMobile ? 'collapsed' : ''} ${this.isSidebarDragging ? 'dragging' : ''}"
                style="${!this.sidebarCollapsed && !this.isMobile ? `--sidebar-width: ${this.sidebarWidth}px;` : ''}"
            >
                <div class="layout">
                    <alps-sidebar
                        class="${this.isMobile ? 'mobile-sidebar' : 'desktop-sidebar'} ${this.mobileSidebarOpen ? 'open' : ''}"
                        .isMobile=${this.isMobile}
                        .isOpen=${this.mobileSidebarOpen}
                        .collapsed=${this.sidebarCollapsed && !this.isMobile}
                        .isHovered=${this.isSidebarHovered}
                        .suppressHover=${this.suppressSidebarHover}
                        .width=${this.sidebarWidth}
                        @toggle-collapse=${() => {
                            this.sidebarCollapsed = !this.sidebarCollapsed;
                            this.settingsStore?.updateSettings({ sidebarCollapsed: this.sidebarCollapsed });
                        }}
                        @sidebar-resize=${this.handleSidebarResize}
                        @drag-start=${() => { this.isSidebarDragging = true; }}
                        @drag-end=${() => { this.isSidebarDragging = false; }}
                        @close-sidebar=${() => { this.mobileSidebarOpen = false; }}
                        @mouseenter=${() => this.handleSidebarMouseEnter()}
                        @mouseleave=${() => this.handleSidebarMouseLeave()}
                    >
                        <div class="sidebar-wrapper ${collapsed ? 'collapsed' : ''}">
                            <alps-toolbar class="sidebar-header">
                                <alps-create-button
                                    icon="plusBold"
                                    ?collapsed=${collapsed}
                                    ?disabled=${this.lists.length === 0}
                                    @click=${() => this.openCreate()}
                                >${t('tasks.addTask')}</alps-create-button>
                            </alps-toolbar>
                            <div class="sidebar-content">
                                <div class="sidebar-scroll-content">
                                    <nav class="smart-lists">
                                        ${SMART_LISTS.map(list => {
                                            const count = this.countFor(list.id);
                                            return html`
                                                <button
                                                    class="nav-item smart-list ${list.id === this.selectedList && !this.searchQuery ? 'active' : ''}"
                                                    data-list=${list.id}
                                                    title=${t(list.label)}
                                                    @click=${() => this.selectList(list.id)}
                                                >
                                                    ${renderIcon(list.icon)}
                                                    <span class="label">${t(list.label)}</span>
                                                    ${count ? html`<span class="count">${count}</span>` : ''}
                                                </button>
                                            `;
                                        })}
                                    </nav>
                                    ${this.lists.length > 0 ? html`
                                        <div class="calendar-lists">
                                            <h3>${t('tasks.lists')}</h3>
                                            ${this.lists.map(list => html`
                                                <button
                                                    class="nav-item task-list ${list.path === this.selectedCalendar ? 'active' : ''}"
                                                    data-path=${list.path}
                                                    @click=${() => this.selectCalendar(list.path)}
                                                >
                                                    <span class="list-dot" style="background: ${list.color}"></span>
                                                    <span class="label">${list.name}</span>
                                                </button>
                                            `)}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <alps-icon-btn
                            slot="footer-actions"
                            icon="folderPlus"
                            title=${t('tasks.newList')}
                            @click=${() => { this.listPromptOpen = true; }}
                        ></alps-icon-btn>
                    </alps-sidebar>

                    <div class="main-content">
                        <div class="toolbar">
                            <h2>
                                ${this.searchQuery ? t('tasks.searchResults') : t(current.label)}
                                ${calendarName ? html`<span class="sub-title">${calendarName}</span>` : ''}
                            </h2>
                            <alps-icon-btn
                                icon="arrowsClockwise"
                                title=${t('mailboxPage.refresh')}
                                ?spinning=${this.isSpinning}
                                @animationiteration=${() => { if (!this.loading) this.isSpinning = false; }}
                                @click=${() => void this.fetchTasks()}
                            ></alps-icon-btn>
                        </div>
                        <tasks-list
                            .tasks=${this.visibleTasks}
                            .pendingPaths=${this.pendingPaths}
                            .settling=${this.settling}
                            ?searching=${!!this.searchQuery}
                            ?loading=${this.loading}
                            @toggle-complete=${(e: CustomEvent) => void this.handleToggleComplete(e.detail.task, e.detail.done)}
                            @open-task=${(e: CustomEvent) => this.openEdit(e.detail.task)}
                        ></tasks-list>
                    </div>
                </div>
            </div>

            <task-modal
                .open=${this.modalOpen}
                .task=${this.editingTask}
                .lists=${this.lists}
                .defaultList=${defaultList}
                .scheduling=${this.scheduling}
                @close=${() => this.closeModal()}
                @saved=${this.handleSaved}
                @conflict=${() => void this.fetchTasks()}
                @delete=${(e: CustomEvent) => {
                    this.closeModal();
                    this.taskToDelete = e.detail.task;
                }}
            ></task-modal>

            ${this.listPromptOpen ? html`
                <ui-prompt
                    title=${t('tasks.newList')}
                    .fields=${[{ id: 'name', label: t('tasks.listName'), autofocus: true }]}
                    @submit=${this.handleListPromptSubmit}
                    @cancel=${() => { this.listPromptOpen = false; }}
                ></ui-prompt>
            ` : ''}

            ${this.taskToDelete && taskTellsSomeone(this.taskToDelete, this.scheduling) ? html`
                <ui-confirm
                    class="delete-assigned"
                    title=${t('tasks.deleteTask')}
                    message=${t(this.taskToDelete.role === 'organizer' ? 'tasks.deleteTellAssignees' : 'tasks.deleteTellAssigner')}
                    confirmText=${t('invitations.deleteAndTell')}
                    secondaryText=${t('invitations.deleteOnly')}
                    isDanger
                    @confirm=${() => void this.confirmDelete(true)}
                    @secondary=${() => void this.confirmDelete(false)}
                    @cancel=${() => { this.taskToDelete = null; }}
                ></ui-confirm>
            ` : this.taskToDelete ? html`
                <ui-confirm
                    title=${t('tasks.deleteTask')}
                    message=${t('tasks.deleteTaskConfirm')}
                    confirmText=${t('tasks.delete')}
                    isDanger
                    @confirm=${() => void this.confirmDelete()}
                    @cancel=${() => { this.taskToDelete = null; }}
                ></ui-confirm>
            ` : ''}
        `;
    }
}
