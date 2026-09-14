import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { settingsContext, SettingsStore } from '../../../frontend/src/store/settings-store';
import { calendarService, taskTellsSomeone, tellsSomeone, getCalendarColor, holdsEvents, taskChips, weekStart } from './calendar-service';
import { tasksService, type TaskData } from './tasks-service';
import type { CalendarData, EventData } from './calendar-service';
import { sidebarLayoutStyles } from '../../../frontend/src/components/alps-sidebar';
import '../../../frontend/src/components/alps-sidebar';
import '../../../frontend/src/components/alps-toggle';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-toolbar';
import '../../../frontend/src/components/alps-create-button';
import './calendar-event-modal';
import './task-modal';
import { RRule } from 'rrule';

// Import our modular view components
import './calendar-mini-month';
import './calendar-day-view';
import './calendar-week-view';
import './calendar-month-view';
import './calendar-year-view';
import './calendar-list-view';
import './alps-sidebar-calendar';
import '../../../frontend/src/components/alps-nav-buttons';
import '../../../frontend/src/components/ui-prompt';
import '../../../frontend/src/components/ui-confirm';
import { isVersionConflict } from '../../../frontend/src/utils/fetch-utils';
import '../../../frontend/src/components/alps-popup';
import { renderIcon } from '../../../frontend/src/utils/ui';
import { popupStyles } from '../../../frontend/src/components/alps-popup';

type ViewMode = 'day' | 'week' | 'month' | 'year';

const SIDEBAR_WIDTH_DEFAULT = 250;
const SIDEBAR_WIDTH_MIN = 150;
const SIDEBAR_WIDTH_MAX = 500;

const SIDEBAR_COLLAPSE_THRESHOLD = 120;

const SHOW_TASKS_KEY = 'alps.calendar.showTasks';

/** Whether tasks are drawn on the calendar: on unless switched off here. */
function readShowTasks(): boolean {
    try {
        return localStorage.getItem(SHOW_TASKS_KEY) !== 'false';
    } catch {
        return true;
    }
}

function writeShowTasks(show: boolean) {
    try {
        localStorage.setItem(SHOW_TASKS_KEY, String(show));
    } catch {
        // Storage refused (a private window): the choice lasts this visit.
    }
}

@customElement('calendar-page')
export class CalendarPage extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;

    @consume({ context: settingsContext })
    settingsStore!: SettingsStore;

    @state() calendars: CalendarData[] = [];
    @state() events: EventData[] = [];
    @state() currentDate: Date = new Date();
    @state() viewMode: ViewMode = 'month';
    @state() loading = true;
    @state() isSpinning = false;

    @state() modalOpen = false;
    @state() selectedEvent?: EventData;
    @state() initialDate?: Date;
    @state() initialAllDay?: boolean;
    @state() private activeCalendars: Set<string> = new Set();
    @state() private showTasks = readShowTasks();
    @state() private taskModalOpen = false;
    @state() private editingTask?: TaskData;
    @state() searchQuery = '';

    @state() private sidebarWidth = 250;
    @state() private sidebarCollapsed = false;
    @state() private isSidebarHovered = false;
    @state() private isMobile = window.innerWidth <= 768;
    @state() private mobileSidebarOpen = false;
    @state() private promptOpen = false;
    @state() private promptFields: Array<{ id: string; label: string; autofocus?: boolean; value?: string }> = [{ id: 'name', label: 'Calendar Name', autofocus: true }];

    private syncIntervalTimer: ReturnType<typeof setInterval> | null = null;
    @state() private promptMode: 'add' | 'rename' | null = null;
    @state() private promptTarget: any = null;
    @state() private calendarToDelete: any = null;
    @state() private eventToDelete: any = null;
    /** Who tells guests about changes, as the calendar listing says: the server, or alps by email. */
    @state() private scheduling: 'server' | 'email' = 'email';
    @state() private activeKebabMenu: string | null = null;
    private hoverTimeout: any = null;
    @state() private suppressSidebarHover = false;
    @state() private isSidebarDragging = false;

    static styles = [
        sidebarLayoutStyles,
        popupStyles,
        css`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
        }

        .app-container.collapsed .main-content {
            box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
            z-index: 25;
            border-left: 1px solid var(--border-color, #e5e7eb);
            position: relative;
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
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .sidebar-scroll-content {
            padding: 16px;
            display: flex;
            flex-direction: column;
            height: 100%;
            box-sizing: border-box;
            gap: 24px;
        }

        .calendars-list {
            flex: 1;
            overflow-y: auto;
        }

        .calendars-list h3 {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted, #6b7280);
            margin: 0 0 12px 0;
        }

        .calendar-item {
            display: flex;
            align-items: center;
            position: relative;
            height: 36px;
            padding: 0 8px;
            box-sizing: border-box;
            border-radius: 6px;
            cursor: pointer;
            color: var(--text-primary);
            margin-bottom: 2px;
            user-select: none;
            transition: background 0.15s;
        }

        .calendar-item:hover {
            background-color: var(--bg-tertiary, #f3f4f6);
        }

        .calendar-item span {
            font-size: 14px;
            color: var(--text-primary, #111827);
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .calendar-checkbox {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            border: 2px solid var(--cal-color);
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            background-color: transparent;
            margin-right: 8px;
            flex-shrink: 0;
        }

        .calendar-checkbox.checked {
            background-color: var(--cal-color);
        }

        .calendar-checkbox svg {
            width: 12px;
            height: 12px;
            color: #fff;
            fill: currentColor;
        }

        .sidebar-footer-btn {
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px;
            border-radius: 6px;
            width: 100%;
        }

        .sidebar-footer-btn:hover {
            background-color: var(--border-color, #e5e7eb);
        }

        .sidebar-footer-btn svg {
            width: 18px;
            height: 18px;
            color: var(--text-secondary, #4b5563);
        }

        .calendar-actions {
            display: none;
            align-items: center;
            margin-left: auto;
            margin-right: -4px;
        }

        @media (hover: hover) {
            .calendar-item:hover .calendar-actions {
                display: flex;
            }
        }
        .calendar-actions:focus-within,
        .calendar-actions.popup-open {
            display: flex;
        }
        
        .kebab-btn {
            --btn-padding: 8px;
        }

        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background-color: var(--bg-primary, #ffffff);
            justify-content: center;
        }

        .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 57px;
            padding: 0 24px;
            box-sizing: border-box;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            flex-shrink: 0;
            background: var(--bg-primary, #ffffff);
        }

        .toolbar-left {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .toolbar-left h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }

        .toolbar-left .sub-title {
            font-weight: 300;
            color: var(--text-secondary, #4b5563);
        }

        .toolbar-center {
            flex: 1;
            display: flex;
            justify-content: center;
        }

        .toolbar-right {
            flex: 1;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 8px;
        }

        .mobile-bottom-header {
            height: 57px;
            box-sizing: border-box;
            padding: 0 12px;
            border-top: 1px solid var(--border-color, #e5e7eb);
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-primary, #ffffff);
            flex-shrink: 0;
            position: relative;
            z-index: 10;
            box-shadow: rgba(95, 95, 95, 0.1) 0 -4px 4px -2px;
        }

        .mobile-bottom-actions {
            display: flex;
            width: 100%;
        }

        @media (max-width: 768px) {
            .toolbar {
                padding: 0 12px;
            }
            .toolbar-left {
                flex: 1;
                min-width: 0;
            }
            .toolbar-left h2 {
                font-size: 18px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .toolbar-left h2 .sub-title {
                display: none;
            }
            .toolbar-right {
                flex: unset;
                gap: 4px;
            }
        }

        .calendar-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }
    `];

    private _handleSettingsChange = () => {
        if (this.settingsStore) {
            const state = this.settingsStore.getState();
            this.sidebarCollapsed = state.sidebarCollapsed;

            // Manage background sync interval based on checkMailInterval (in minutes)
            if (this.syncIntervalTimer) {
                clearInterval(this.syncIntervalTimer);
                this.syncIntervalTimer = null;
            }
            if (state.checkMailInterval && state.checkMailInterval > 0) {
                const ms = state.checkMailInterval * 60 * 1000;
                this.syncIntervalTimer = setInterval(() => {
                    this.fetchData();
                }, ms);
            }
        }
    };

    async connectedCallback() {
        super.connectedCallback();
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('hashchange', this.handleHashChange);
        if (this.settingsStore) {
            this.settingsStore.addEventListener('change', this._handleSettingsChange);
            this._handleSettingsChange();
        }
        this.parseHash();
        await this.fetchData();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('hashchange', this.handleHashChange);
        if (this.settingsStore) {
            this.settingsStore.removeEventListener('change', this._handleSettingsChange);
        }
        if (this.syncIntervalTimer) {
            clearInterval(this.syncIntervalTimer);
            this.syncIntervalTimer = null;
        }
    }

    /** Says a write failed. Deleting a calendar, deleting an event and saving a
     * calendar all reported failure to the console only, so the UI went on
     * showing the state the user had asked for. */
    private reportFailure(key: string) {
        window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: this.i18nStore?.t(key), duration: 5000 }
        }));
    }

    private parseHash() {
        const hash = window.location.hash;
        if (!hash.startsWith('#/calendar')) return false;

        const path = hash.substring(1);
        const [pathStr, queryStr] = path.split('?');
        const parts = pathStr.split('/');
        
        let changed = false;

        if (parts.length >= 3) {
            const mode = parts[2] as ViewMode;
            if (['day', 'week', 'month', 'year'].includes(mode)) {
                if (this.viewMode !== mode) {
                    this.viewMode = mode;
                    changed = true;
                }
            }
        }

        if (parts.length >= 4) {
            const dateStr = parts[3];
            let newDate = new Date(this.currentDate);
            if (this.viewMode === 'year') {
                const y = parseInt(dateStr, 10);
                if (!isNaN(y)) newDate.setFullYear(y);
            } else if (this.viewMode === 'month') {
                const [y, m] = dateStr.split('-');
                if (y && m) {
                    // Constructed, not set field by field. setMonth on the 29th–31st
                    // rolls into the following month when the target month is
                    // shorter — January 31 becomes "April 31", which is May 1 —
                    // before setDate(1) runs, so a link to April opened May on the
                    // last days of a long month.
                    newDate = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
                }
            } else {
                const [y, m, d] = dateStr.split('-');
                if (y && m && d) {
                    // As above: set field by field from the 31st, February 15
                    // became March 15.
                    newDate = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
                }
            }
            
            if (newDate.getFullYear() !== this.currentDate.getFullYear() ||
                newDate.getMonth() !== this.currentDate.getMonth() ||
                newDate.getDate() !== this.currentDate.getDate()) {
                this.currentDate = newDate;
                changed = true;
            }
        }
        
        let query = '';
        if (queryStr) {
            const params = new URLSearchParams('?' + queryStr);
            query = params.get('q') || '';
        }
        if (this.searchQuery !== query) {
            this.searchQuery = query;
            changed = true;
        }

        if (pathStr === '/calendar' || pathStr === '/calendar/') {
            this.navigate(this.viewMode, this.currentDate, this.searchQuery);
            return false;
        }
        
        return changed;
    }

    private handleHashChange = () => {
        if (this.parseHash()) {
            this.fetchData();
        }
    };

    private navigate(mode: ViewMode, date: Date, query: string = '') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        let hash = `#/calendar/${mode}`;
        if (mode === 'year') {
            hash += `/${year}`;
        } else if (mode === 'month') {
            hash += `/${year}-${month}`;
        } else {
            hash += `/${year}-${month}-${day}`;
        }
        
        if (query) {
            hash += `?q=${encodeURIComponent(query)}`;
        }
        
        if (window.location.hash !== hash) {
            window.location.hash = hash;
        } else {
            this.fetchData();
        }
    }

    private handleResize = () => {
        this.isMobile = window.innerWidth <= 768;
    };

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

    private async fetchData() {
        this.loading = true;
        this.isSpinning = true;
        // Alongside the events, and apart from them: tasks that fail to load
        // leave the calendar's own events on screen, and say so separately.
        // Not during a search, whose results are events.
        const tasksLoad = this.showTasks && !this.searchQuery
            ? tasksService.fetchTasks('active').catch(err => {
                console.error('Failed to load tasks for the calendar', err);
                this.reportFailure('tasks.loadFailed');
                return null;
            })
            : Promise.resolve(null);
        try {
            const calRes = await calendarService.fetchCalendars();
            this.scheduling = calRes.scheduling === 'server' ? 'server' : 'email';
            
            let start, end;
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();

            if (this.viewMode === 'year') {
                start = new Date(year, 0, 1);
                // The start of the day AFTER the last one drawn, as the week arm
                // does. Ending at 31 December 00:00 dropped that day's timed events.
                end = new Date(year + 1, 0, 1);
            } else if (this.viewMode === 'month') {
                start = new Date(year, month, 1);
                end = new Date(year, month + 1, 0);
                start.setDate(start.getDate() - 14);
                end.setDate(end.getDate() + 14);
            } else if (this.viewMode === 'week') {
                start = weekStart(this.currentDate);
                end = new Date(start);
                end.setDate(start.getDate() + 7);
            } else {
                start = new Date(this.currentDate);
                start.setHours(0, 0, 0, 0);
                end = new Date(this.currentDate);
                end.setHours(23, 59, 59, 999);
            }

            const evRes = await calendarService.fetchEvents(start, end, this.searchQuery);
            const rawEvents = evRes.events || [];
            const expandedEvents: EventData[] = [];

            for (const ev of rawEvents) {
                if (ev.rrule) {
                    try {
                        const evStart = new Date(ev.start);
                        const evEnd = new Date(ev.end);
                        const durationMs = evEnd.getTime() - evStart.getTime();

                        const options = RRule.parseString(ev.rrule);
                        options.dtstart = evStart;
                        const ruleObj = new RRule(options);

                        const occurrences = ruleObj.between(start, end, true);
                        
                        for (const d of occurrences) {
                            expandedEvents.push({
                                ...ev,
                                start: d.toISOString(),
                                end: new Date(d.getTime() + durationMs).toISOString()
                            });
                        }
                    } catch (err) {
                        console.error('Failed to parse rrule for event', ev.uid, err);
                        expandedEvents.push(ev);
                    }
                } else {
                    expandedEvents.push(ev);
                }
            }

            const tasks = (await tasksLoad)?.tasks ?? [];
            this.events = [...expandedEvents, ...taskChips(tasks)].map(ev => ({
                ...ev,
                color: ev.color || getCalendarColor(ev.calendarPath || ev.path)
            }));

            this.calendars = calRes.calendars.filter(holdsEvents).map((c: any) => ({
                ...c,
                color: c.color || getCalendarColor(c.path)
            }));

            if (this.activeCalendars.size === 0 && this.calendars.length > 0) {
                this.activeCalendars = new Set(this.calendars.map(c => c.path));
            }
        } catch (e) {
            console.error(e);
            // Said, not stored: `error` was written here and rendered nowhere, so a
            // calendar that failed to load simply showed no events.
            this.reportFailure('calendar.loadFailed');
        } finally {
            this.loading = false;
        }
    }

    private handleSpinIteration = () => {
        if (!this.loading) {
            this.isSpinning = false;
        }
    };

    private changeDate(offset: number, forceMode?: string) {
        let d = new Date(this.currentDate);
        const mode = (forceMode || this.viewMode) as ViewMode;
        if (mode === 'year' || mode === 'month') {
            // Constructed, with the day clamped to the target month. setMonth and
            // setFullYear keep the day of the month, and a day the target month
            // does not have rolls into the month after it: "next" from 31 January
            // opened March, and "previous" from 31 March stayed in March.
            const months = mode === 'year' ? offset * 12 : offset;
            const lastDay = new Date(d.getFullYear(), d.getMonth() + months + 1, 0).getDate();
            d = new Date(d.getFullYear(), d.getMonth() + months, Math.min(d.getDate(), lastDay));
        } else if (mode === 'week') {
            d.setDate(d.getDate() + (offset * 7));
        } else {
            d.setDate(d.getDate() + offset);
        }
        this.navigate(mode, d);
    }

    private openCreateModal(date?: Date, allDay?: boolean) {
        this.selectedEvent = undefined;
        this.initialDate = date;
        this.initialAllDay = allDay;
        this.modalOpen = true;
    }

    private openEditModal(event: EventData) {
        if (event.task) {
            this.editingTask = event.task;
            this.taskModalOpen = true;
            return;
        }
        this.selectedEvent = event;
        this.initialDate = undefined;
        this.initialAllDay = undefined;
        this.modalOpen = true;
    }

    private handleModalClose() {
        this.modalOpen = false;
        this.selectedEvent = undefined;
        this.initialDate = undefined;
        this.initialAllDay = undefined;
    }

    private async handleModalSaved() {
        this.modalOpen = false;
        this.selectedEvent = undefined;
        this.initialDate = undefined;
        this.initialAllDay = undefined;
        await this.fetchData();
    }

    /** Does the period currently on screen include `date`? */
    private viewShows(date: Date): boolean {
        const anchor = this.currentDate;
        if (this.viewMode === 'year') return date.getFullYear() === anchor.getFullYear();
        if (this.viewMode === 'month') {
            return date.getFullYear() === anchor.getFullYear() && date.getMonth() === anchor.getMonth();
        }
        if (this.viewMode === 'week') {
            const start = weekStart(anchor);
            const end = new Date(start);
            end.setDate(start.getDate() + 7);
            return date >= start && date < end;
        }
        return date.toDateString() === anchor.toDateString();
    }

    /**
     * The day a view switch lands on.
     *
     * In month and year view `currentDate` is not a day the user chose: those
     * hashes carry no day-of-month, so parseHash anchors it to the 1st. Handing
     * that anchor straight to Day view opened the 1st of the month while the user
     * was looking at the CURRENT month — on first visit too, since #/calendar
     * redirects to this month. Today wins whenever the period being left contains
     * it; otherwise the anchor stands, so switching to Day from a month the user
     * navigated to keeps that month instead of jumping back to now.
     */
    private dayForViewSwitch(mode: ViewMode): Date {
        if (mode === 'day' || mode === 'week') {
            const today = new Date();
            if (this.viewShows(today)) return today;
        }
        return this.currentDate;
    }

    /**
     * The Today button: today's own day, in Day view.
     *
     * Today in the view already on screen only moved a month or a year to the
     * period holding today, where today is one cell among many and still has
     * to be found; the button is asked for a day.
     */
    private goToToday() {
        this.navigate('day', new Date());
    }

    private setViewMode(mode: ViewMode) {
        this.navigate(mode, this.dayForViewSwitch(mode));
    }

    private handleDateSelected(date: Date) {
        this.navigate('day', date);
    }

    private handleAddCalendar() {
        this.promptFields = [{ id: 'name', label: this.i18nStore?.t('calendar.calendarName'), autofocus: true }];
        this.promptMode = 'add';
        this.promptOpen = true;
    }

    private handleRenameCalendar(calendar: any) {
        this.promptFields = [{ id: 'name', label: this.i18nStore?.t('calendar.calendarName'), value: calendar.name, autofocus: true }];
        this.promptMode = 'rename';
        this.promptTarget = calendar;
        this.promptOpen = true;
    }

    private handleDeleteCalendar(calendar: any) {
        this.calendarToDelete = calendar;
    }

    private async _executeDeleteCalendar() {
        if (!this.calendarToDelete) return;
        const calendar = this.calendarToDelete;
        this.calendarToDelete = null;

        try {
            await calendarService.deleteCalendar(calendar.path);
            this.calendars = this.calendars.filter(c => c.path !== calendar.path);
            if (this.activeCalendars.has(calendar.path)) {
                // A new Set: this is @state, and Lit compares by identity, so a
                // delete in place is invisible to anything bound to it.
                const next = new Set(this.activeCalendars);
                next.delete(calendar.path);
                this.activeCalendars = next;
                await this.fetchData();
            }
        } catch (err) {
            console.error('Failed to delete calendar', err);
            this.reportFailure('calendar.deleteCalendarFailed');
        }
    }

    private async _executeDeleteEvent(notify = true) {
        if (!this.eventToDelete) return;
        const event = this.eventToDelete;
        this.eventToDelete = null;

        try {
            if (event.task) {
                const removed = await tasksService.deleteTask(event.task.path, { notify, lang: this.i18nStore?.getLanguage?.() });
                if (removed?.sendFailed) this.reportFailure('invitations.notTold');
            } else {
                const removed = await calendarService.deleteEvent(event.path, { notify, lang: this.i18nStore?.getLanguage?.() });
                if (removed?.sendFailed) this.reportFailure('invitations.notTold');
            }
            await this.fetchData();
        } catch (err) {
            console.error('Failed to delete event', err);
            this.reportFailure(event.task ? 'tasks.deleteFailed' : 'calendar.deleteEventFailed');
        }
    }

    /**
     * Whether an event, or a task's chip, is drawn.
     *
     * A task in a calendar listed here follows that calendar's box as its events
     * do. A task in a list that holds only tasks has no box here, and follows
     * the Tasks switch alone.
     */
    private isShown(event: EventData): boolean {
        if (!event.task) return this.activeCalendars.has(event.calendarPath);
        return this.showTasks && (!this.calendars.some(c => c.path === event.calendarPath) || this.activeCalendars.has(event.calendarPath));
    }

    private toggleTasks() {
        this.showTasks = !this.showTasks;
        writeShowTasks(this.showTasks);
        void this.fetchData();
    }

    /** Answers an invitation from its event in the calendar. */
    private async respondToEvent(event: EventData, status: string) {
        try {
            const saved = await calendarService.respondToEvent(event, status, this.i18nStore?.getLanguage?.());
            if (saved.sendFailed) this.reportFailure('invitations.sendFailed');
            await this.fetchData();
        } catch (err) {
            console.error('Failed to answer the invitation', err);
            const conflict = isVersionConflict(err);
            this.reportFailure(conflict ? 'invitations.changedElsewhere' : 'invitations.answerFailed');
            if (conflict) await this.fetchData();
        }
    }

    private async completeTask(task: TaskData) {
        try {
            const saved = await tasksService.completeTask(task.path, true, this.i18nStore?.getLanguage?.());
            if (saved?.sendFailed) this.reportFailure('invitations.notTold');
            await this.fetchData();
        } catch (err) {
            console.error('Failed to update task', err);
            this.reportFailure('tasks.completeFailed');
        }
    }

    private closeTaskModal() {
        this.taskModalOpen = false;
        this.editingTask = undefined;
    }

    private toggleCalendar(path: string) {
        const newSet = new Set(this.activeCalendars);
        if (newSet.has(path)) {
            newSet.delete(path);
        } else {
            newSet.add(path);
        }
        this.activeCalendars = newSet;
    }

    private async handlePromptSubmit(e: CustomEvent) {
        this.promptOpen = false;
        const name = e.detail.name;
        if (!name) return;
        try {
            if (this.promptMode === 'add') {
                await calendarService.createCalendar(name);
            } else if (this.promptMode === 'rename' && this.promptTarget) {
                await calendarService.renameCalendar(this.promptTarget.path, name);
            }
            await this.fetchData();
        } catch (err) {
            console.error('Failed to save calendar', err);
            this.reportFailure('calendar.saveCalendarFailed');
        }
    }

    private handlePromptCancel() {
        this.promptOpen = false;
    }

    get username() {
        return this.settingsStore?.getState().loginUsername || '';
    }

    render() {
        const monthName = this.i18nStore?.t(`calendar.months.${this.currentDate.getMonth()}`);
        const year = this.currentDate.getFullYear();
        let title = '';
        if (this.searchQuery) {
            title = this.i18nStore?.t('calendar.searchResults');
        } else if (this.viewMode === 'year') {
            title = year.toString();
        } else if (this.viewMode === 'day') {
            title = `${this.currentDate.getDate()} ${monthName}`;
        } else {
            title = monthName;
        }

        const visibleEvents = this.events.filter(e => this.isShown(e));

        return html`
            <app-header 
                currentTab="calendar"
                .username=${this.username}
                .isMobile=${this.isMobile}
                .searchQuery=${this.searchQuery}
                @toggle-sidebar=${() => this.mobileSidebarOpen = !this.mobileSidebarOpen}
                @search-submit=${(e: CustomEvent) => { this.navigate(this.viewMode, this.currentDate, e.detail.value); }}
            ></app-header>
            <div class="app-container ${this.sidebarCollapsed && !this.isMobile ? 'collapsed' : ''} ${this.isSidebarDragging ? 'dragging' : ''}" style="${!this.sidebarCollapsed && !this.isMobile ? `--sidebar-width: ${this.sidebarWidth}px;` : ''}">
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
                const newState = !this.sidebarCollapsed;
                this.sidebarCollapsed = newState;
                if (this.settingsStore) {
                    this.settingsStore.updateSettings({ sidebarCollapsed: newState });
                }
            }}
                        @sidebar-resize=${(e: CustomEvent) => {
                const newWidth = e.detail.newWidth;
                if (newWidth < SIDEBAR_COLLAPSE_THRESHOLD) {
                    if (!this.sidebarCollapsed) {
                        this.sidebarCollapsed = true;
                        if (this.settingsStore) this.settingsStore.updateSettings({ sidebarCollapsed: true });
                    }
                    this.sidebarWidth = SIDEBAR_WIDTH_DEFAULT;
                } else {
                    if (this.sidebarCollapsed) {
                        this.sidebarCollapsed = false;
                        if (this.settingsStore) this.settingsStore.updateSettings({ sidebarCollapsed: false });
                    }
                    this.sidebarWidth = Math.min(Math.max(newWidth, SIDEBAR_WIDTH_MIN), SIDEBAR_WIDTH_MAX);
                }
            }}
                        @drag-start=${() => this.isSidebarDragging = true}
                        @drag-end=${() => this.isSidebarDragging = false}
                        @close-sidebar=${() => this.mobileSidebarOpen = false}
                        @mouseenter=${() => this.handleSidebarMouseEnter()}
                        @mouseleave=${() => this.handleSidebarMouseLeave()}
                    >
                    <div class="sidebar-wrapper ${this.sidebarCollapsed && (!this.isSidebarHovered || this.suppressSidebarHover) && !this.isMobile ? 'collapsed' : ''}">
                        <alps-toolbar class="sidebar-header">
                            <alps-create-button 
                                icon="calendarPlus" 
                                ?collapsed=${this.sidebarCollapsed && (!this.isSidebarHovered || this.suppressSidebarHover) && !this.isMobile}
                                @click=${() => this.openCreateModal()}
                            >${this.i18nStore?.t('calendar.addEvent')}</alps-create-button>
                        </alps-toolbar>
                        <div class="sidebar-content">
                            <div class="sidebar-scroll-content">
                                <div class="calendars-list">
                                    <h3>${this.i18nStore?.t('calendar.myCalendars')}</h3>
                                    ${this.calendars.map(c => html`
                                        <div class="calendar-item" @click=${() => this.toggleCalendar(c.path)}>
                                            <div class="calendar-checkbox ${this.activeCalendars.has(c.path) ? 'checked' : ''}" style="--cal-color: ${c.color}">
                                                ${this.activeCalendars.has(c.path) ? renderIcon('check') : ''}
                                            </div>
                                            <span>${c.name}</span>

                                            <div class="calendar-actions ${this.activeKebabMenu === c.path ? 'popup-open' : ''}" @click=${(e: Event) => e.stopPropagation()}>
                                                <alps-popup 
                                                    align="right" 
                                                    position="bottom"
                                                    @popup-open=${() => { this.activeKebabMenu = c.path; }}
                                                    @popup-close=${() => { if (this.activeKebabMenu === c.path) this.activeKebabMenu = null; }}
                                                >
                                                    <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical"></alps-icon-btn>
                                                    <button class="dropdown-item" @click=${(e: Event) => {
                                                        const popup = (e.target as HTMLElement).closest('alps-popup') as any;
                                                        if (popup) popup.close();
                                                        this.handleRenameCalendar(c);
                                                    }}>
                                                        ${renderIcon('pen')} <span class="item-text">${this.i18nStore?.t('calendar.rename')}</span>
                                                    </button>
                                                    ${this.calendars.length > 1 && !(c.path === 'default' || c.path.endsWith('/default') || c.path.endsWith('/default/')) ? html`
                                                        <button class="dropdown-item text-danger" @click=${(e: Event) => {
                                                            const popup = (e.target as HTMLElement).closest('alps-popup') as any;
                                                            if (popup) popup.close();
                                                            this.handleDeleteCalendar(c);
                                                        }}>
                                                            ${renderIcon('trash')} <span class="item-text">${this.i18nStore?.t('calendar.delete')}</span>
                                                        </button>
                                                    ` : ''}
                                                </alps-popup>
                                            </div>
                                        </div>
                                    `)}
                                    <div class="calendar-item tasks-toggle" @click=${this.toggleTasks}>
                                        <div class="calendar-checkbox ${this.showTasks ? 'checked' : ''}" style="--cal-color: var(--text-secondary, #4b5563)">
                                            ${this.showTasks ? renderIcon('check') : ''}
                                        </div>
                                        <span>${this.i18nStore?.t('tasks.title')}</span>
                                    </div>
                                </div>

                                <alps-sidebar-calendar
                                    .selectedDate=${this.currentDate}
                                    .events=${visibleEvents}
                                    @date-selected=${(e: CustomEvent) => this.handleDateSelected(e.detail.date)}
                                ></alps-sidebar-calendar>
                            </div>
                        </div>
                    </div>
                    <alps-icon-btn slot="footer-actions" icon="calendarPlus" @click=${this.handleAddCalendar}></alps-icon-btn>
                </alps-sidebar>

                <div class="main-content">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <h2>${title} <span class="sub-title">${this.viewMode !== 'year' ? year : ''}</span></h2>
                        </div>
                        ${!this.isMobile ? html`
                        <div class="toolbar-center">
                            <alps-toggle 
                                .options=${[
                { label: this.i18nStore?.t('calendar.day'), value: 'day' },
                { label: this.i18nStore?.t('calendar.week'), value: 'week' },
                { label: this.i18nStore?.t('calendar.month'), value: 'month' },
                { label: this.i18nStore?.t('calendar.year'), value: 'year' }
            ]}
                                .value=${this.viewMode}
                                @change=${(e: CustomEvent) => this.setViewMode(e.detail.value as any)}
                            ></alps-toggle>
                        </div>
                        ` : ''}
                        <div class="toolbar-right" style="display: flex; align-items: center; gap: 8px;">
                            <alps-icon-btn 
                                icon="arrowsClockwise" 
                                title="${this.i18nStore?.t('mailboxPage.refresh')}" 
                                ?spinning=${this.isSpinning}
                                @animationiteration=${this.handleSpinIteration}
                                @click=${this.fetchData}
                            ></alps-icon-btn>
                            <alps-nav-buttons 
                                label="${this.i18nStore?.t('calendar.today')}"
                                @previous=${() => this.changeDate(-1)}
                                @center=${() => this.goToToday()}
                                @next=${() => this.changeDate(1)}
                            ></alps-nav-buttons>
                        </div>
                    </div>

                    <div class="calendar-body" @complete-task=${(e: CustomEvent) => void this.completeTask(e.detail.task)} @respond-event=${(e: CustomEvent) => void this.respondToEvent(e.detail.event, e.detail.status)}>
                        ${this.searchQuery ? html`
                            <calendar-list-view
                                .events=${visibleEvents}
                                @edit-event=${(e: CustomEvent) => this.openEditModal(e.detail.event)}
                                @delete-event=${(e: CustomEvent) => this.eventToDelete = e.detail.event}
                            ></calendar-list-view>
                        ` : html`
                            ${this.viewMode === 'year' ? html`
                                <calendar-year-view 
                                .year=${year} 
                                .events=${visibleEvents}
                                @date-selected=${(e: CustomEvent) => this.handleDateSelected(e.detail.date)}
                            ></calendar-year-view>
                        ` : ''}
                        ${this.viewMode === 'month' ? html`
                            <calendar-month-view 
                                .date=${this.currentDate} 
                                .events=${visibleEvents}
                                @create-event=${(e: CustomEvent) => this.openCreateModal(e.detail.date, e.detail.allDay)}
                                @edit-event=${(e: CustomEvent) => this.openEditModal(e.detail.event)}
                                @delete-event=${(e: CustomEvent) => this.eventToDelete = e.detail.event}
                            ></calendar-month-view>
                        ` : ''}
                        ${this.viewMode === 'week' ? html`
                            <calendar-week-view 
                                .date=${this.currentDate} 
                                .events=${visibleEvents}
                                @create-event=${(e: CustomEvent) => this.openCreateModal(e.detail.date, e.detail.allDay)}
                                @edit-event=${(e: CustomEvent) => this.openEditModal(e.detail.event)}
                                @delete-event=${(e: CustomEvent) => this.eventToDelete = e.detail.event}
                            ></calendar-week-view>
                        ` : ''}
                            ${this.viewMode === 'day' ? html`
                                <calendar-day-view 
                                    .date=${this.currentDate} 
                                    .events=${visibleEvents}
                                    @create-event=${(e: CustomEvent) => this.openCreateModal(e.detail.date, e.detail.allDay)}
                                    @edit-event=${(e: CustomEvent) => this.openEditModal(e.detail.event)}
                                    @delete-event=${(e: CustomEvent) => this.eventToDelete = e.detail.event}
                                ></calendar-day-view>
                            ` : ''}
                        `}
                    </div>
                    ${this.isMobile ? html`
                        <div class="mobile-bottom-header">
                            <div class="mobile-bottom-actions">
                                <alps-toggle 
                                    full-width
                                    .options=${[
                                        { label: this.i18nStore?.t('calendar.day'), value: 'day' },
                                        { label: this.i18nStore?.t('calendar.week'), value: 'week' },
                                        { label: this.i18nStore?.t('calendar.month'), value: 'month' },
                                        { label: this.i18nStore?.t('calendar.year'), value: 'year' }
                                    ]}
                                    .value=${this.viewMode}
                                    @change=${(e: CustomEvent) => this.setViewMode(e.detail.value as any)}
                                ></alps-toggle>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <task-modal
                .open=${this.taskModalOpen}
                .task=${this.editingTask}
                .scheduling=${this.scheduling}
                @close=${this.closeTaskModal}
                @saved=${() => { this.closeTaskModal(); void this.fetchData(); }}
                @conflict=${this.fetchData}
                @delete=${(e: CustomEvent) => {
                    this.closeTaskModal();
                    this.eventToDelete = { ...e.detail.task, task: e.detail.task };
                }}
            ></task-modal>

            <calendar-event-modal
                .open=${this.modalOpen}
                .event=${this.selectedEvent}
                .initialDate=${this.initialDate}
                .initialAllDay=${this.initialAllDay}
                .calendars=${this.calendars}
                @close=${this.handleModalClose}
                @saved=${this.handleModalSaved}
                @conflict=${this.fetchData}
            ></calendar-event-modal>

            ${this.promptOpen ? html`
                <ui-prompt 
                    title="${this.promptMode === 'add' ? (this.i18nStore?.t('calendar.addCalendar')) : (this.i18nStore?.t('calendar.renameCalendar'))}" 
                    .fields=${this.promptFields}
                    @submit=${this.handlePromptSubmit} 
                    @cancel=${this.handlePromptCancel}
                ></ui-prompt>
            ` : ''}

            ${this.calendarToDelete ? html`
                <ui-confirm
                    title="${this.i18nStore?.t('calendar.deleteCalendar')}"
                    message="Are you sure you want to delete the calendar &quot;${this.calendarToDelete.name}&quot;?"
                    confirmText="${this.i18nStore?.t('calendar.delete')}"
                    isDanger
                    @confirm=${this._executeDeleteCalendar}
                    @cancel=${() => this.calendarToDelete = null}
                ></ui-confirm>
            ` : ''}

            ${this.eventToDelete && (this.eventToDelete.task ? taskTellsSomeone(this.eventToDelete.task, this.scheduling) : tellsSomeone(this.eventToDelete, this.scheduling)) ? html`
                <ui-confirm
                    class="delete-meeting"
                    title="${this.i18nStore?.t(this.eventToDelete.task ? 'tasks.deleteTask' : 'calendar.deleteEvent')}"
                    message="${this.i18nStore?.t(this.eventToDelete.task
                        ? (this.eventToDelete.task.role === 'organizer' ? 'tasks.deleteTellAssignees' : 'tasks.deleteTellAssigner')
                        : (this.eventToDelete.role === 'organizer' ? 'invitations.deleteTellGuests' : 'invitations.deleteTellOrganizer'))}"
                    confirmText="${this.i18nStore?.t('invitations.deleteAndTell')}"
                    secondaryText="${this.i18nStore?.t('invitations.deleteOnly')}"
                    isDanger
                    @confirm=${() => this._executeDeleteEvent(true)}
                    @secondary=${() => this._executeDeleteEvent(false)}
                    @cancel=${() => this.eventToDelete = null}
                ></ui-confirm>
            ` : this.eventToDelete ? html`
                <ui-confirm
                    title="${this.i18nStore?.t('calendar.deleteEvent')}"
                    message="Are you sure you want to delete this event?"
                    confirmText="${this.i18nStore?.t('calendar.delete')}"
                    isDanger
                    @confirm=${() => this._executeDeleteEvent()}
                    @cancel=${() => this.eventToDelete = null}
                ></ui-confirm>
            ` : ''}
        `;
    }
}
