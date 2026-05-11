import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { settingsContext, SettingsStore } from '../../../frontend/src/store/settings-store';
import { calendarService, getCalendarColor } from './calendar-service';
import type { CalendarData, EventData } from './calendar-service';
import { sidebarLayoutStyles } from '../../../frontend/src/components/alps-sidebar';
import '../../../frontend/src/components/alps-sidebar';
import '../../../frontend/src/components/alps-toggle';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-toolbar';
import '../../../frontend/src/components/alps-create-button';
import './calendar-event-modal';
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
import '../../../frontend/src/components/alps-popup';
import { renderIcon } from '../../../frontend/src/utils/ui';
import { popupStyles } from '../../../frontend/src/components/alps-popup';

type ViewMode = 'day' | 'week' | 'month' | 'year';

const SIDEBAR_WIDTH_DEFAULT = 250;
const SIDEBAR_WIDTH_MIN = 150;
const SIDEBAR_WIDTH_MAX = 500;

const SIDEBAR_COLLAPSE_THRESHOLD = 120;

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
    @state() error = '';

    @state() modalOpen = false;
    @state() selectedEvent?: EventData;
    @state() initialDate?: Date;
    @state() private activeCalendars: Set<string> = new Set();
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
                    newDate.setFullYear(parseInt(y, 10));
                    newDate.setMonth(parseInt(m, 10) - 1);
                    newDate.setDate(1);
                }
            } else {
                const [y, m, d] = dateStr.split('-');
                if (y && m && d) {
                    newDate.setFullYear(parseInt(y, 10));
                    newDate.setMonth(parseInt(m, 10) - 1);
                    newDate.setDate(parseInt(d, 10));
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
        this.error = '';
        try {
            const calRes = await calendarService.fetchCalendars();
            
            let start, end;
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();

            if (this.viewMode === 'year') {
                start = new Date(year, 0, 1);
                end = new Date(year, 11, 31);
            } else if (this.viewMode === 'month') {
                start = new Date(year, month, 1);
                end = new Date(year, month + 1, 0);
                start.setDate(start.getDate() - 14);
                end.setDate(end.getDate() + 14);
            } else if (this.viewMode === 'week') {
                start = new Date(this.currentDate);
                start.setDate(start.getDate() - start.getDay() + 1); // Monday
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

            this.events = expandedEvents.map(ev => ({
                ...ev,
                color: ev.color || getCalendarColor(ev.calendarPath || ev.path)
            }));

            this.calendars = calRes.calendars.map((c: any) => ({
                ...c,
                color: c.color || getCalendarColor(c.path)
            }));

            if (this.activeCalendars.size === 0 && this.calendars.length > 0) {
                this.activeCalendars = new Set(this.calendars.map(c => c.path));
            }
        } catch (e) {
            console.error(e);
            this.error = 'Failed to load calendar data.';
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
        const d = new Date(this.currentDate);
        const mode = (forceMode || this.viewMode) as ViewMode;
        if (mode === 'year') {
            d.setFullYear(d.getFullYear() + offset);
        } else if (mode === 'month') {
            d.setMonth(d.getMonth() + offset);
        } else if (mode === 'week') {
            d.setDate(d.getDate() + (offset * 7));
        } else {
            d.setDate(d.getDate() + offset);
        }
        this.navigate(mode, d);
    }

    private openCreateModal(date?: Date) {
        this.selectedEvent = undefined;
        this.initialDate = date;
        this.modalOpen = true;
    }

    private openEditModal(event: EventData) {
        this.selectedEvent = event;
        this.initialDate = undefined;
        this.modalOpen = true;
    }

    private handleModalClose() {
        this.modalOpen = false;
        this.selectedEvent = undefined;
        this.initialDate = undefined;
    }

    private async handleModalSaved() {
        this.modalOpen = false;
        this.selectedEvent = undefined;
        this.initialDate = undefined;
        await this.fetchData();
    }

    private setViewMode(mode: ViewMode) {
        this.navigate(mode, this.currentDate);
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
                this.activeCalendars.delete(calendar.path);
                await this.fetchData();
            }
        } catch (err) {
            console.error('Failed to delete calendar', err);
        }
    }

    private async _executeDeleteEvent() {
        if (!this.eventToDelete) return;
        const event = this.eventToDelete;
        this.eventToDelete = null;

        try {
            await calendarService.deleteEvent(event.path);
            await this.fetchData();
        } catch (err) {
            console.error('Failed to delete event', err);
        }
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

        const visibleEvents = this.events.filter(e => this.activeCalendars.has(e.calendarPath));

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
                                @center=${() => { this.navigate(this.viewMode, new Date()); }}
                                @next=${() => this.changeDate(1)}
                            ></alps-nav-buttons>
                        </div>
                    </div>

                    <div class="calendar-body">
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
                                @create-event=${(e: CustomEvent) => this.openCreateModal(e.detail.date)}
                                @edit-event=${(e: CustomEvent) => this.openEditModal(e.detail.event)}
                                @delete-event=${(e: CustomEvent) => this.eventToDelete = e.detail.event}
                            ></calendar-month-view>
                        ` : ''}
                        ${this.viewMode === 'week' ? html`
                            <calendar-week-view 
                                .date=${this.currentDate} 
                                .events=${visibleEvents}
                                @create-event=${(e: CustomEvent) => this.openCreateModal(e.detail.date)}
                                @edit-event=${(e: CustomEvent) => this.openEditModal(e.detail.event)}
                                @delete-event=${(e: CustomEvent) => this.eventToDelete = e.detail.event}
                            ></calendar-week-view>
                        ` : ''}
                            ${this.viewMode === 'day' ? html`
                                <calendar-day-view 
                                    .date=${this.currentDate} 
                                    .events=${visibleEvents}
                                    @create-event=${(e: CustomEvent) => this.openCreateModal(e.detail.date)}
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

            <calendar-event-modal
                .open=${this.modalOpen}
                .event=${this.selectedEvent}
                .initialDate=${this.initialDate}
                .calendars=${this.calendars}
                @close=${this.handleModalClose}
                @saved=${this.handleModalSaved}
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

            ${this.eventToDelete ? html`
                <ui-confirm
                    title="${this.i18nStore?.t('calendar.deleteEvent')}"
                    message="Are you sure you want to delete this event?"
                    confirmText="${this.i18nStore?.t('calendar.delete')}"
                    isDanger
                    @confirm=${this._executeDeleteEvent}
                    @cancel=${() => this.eventToDelete = null}
                ></ui-confirm>
            ` : ''}
        `;
    }
}
