import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { isAllDayEvent } from './calendar-service';
import type { EventData } from './calendar-service';

@customElement('calendar-mini-month')
export class CalendarMiniMonth extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;
    @property({ type: Number }) year!: number;
    @property({ type: Number }) month!: number;
    @property({ type: Array }) events: EventData[] = [];
    @property({ type: Boolean }) showTitle = false;
    @property({ type: Number }) weekStart = 1;

    private getFirstDayOfWeek(): number {
        return this.weekStart ?? 1;
    }
    
    // An optional date to treat as the "current" selection
    @property({ type: Object }) currentDate?: Date;

    /** The day the arrow keys last moved to, or the one last picked, which
     * holds the month's one Tab stop while it is on the grid. */
    @state() private focusDay: Date | null = null;

    /** Whether one of the days had the focus when this update began. */
    private dayHadFocus = false;

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .year-month-title {
            color: var(--error, #ef4444);
            font-size: var(--mini-month-title-size, 16px);
            font-weight: 500;
            margin-bottom: 12px;
        }

        .mini-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-auto-rows: 1fr;
            gap: 2px;
            text-align: center;
            font-size: var(--mini-month-font-size, 12px);
            color: var(--text-secondary, #4b5563);
            flex: 1;
        }

        .mini-day-name {
            color: var(--text-muted, #6b7280);
            font-size: var(--mini-month-day-size, 11px);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .mini-day {
            border-radius: 4px;
            cursor: pointer;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .day-num {
            position: relative;
            line-height: 1;
        }

        .mini-day.weekend {
            opacity: 0.65;
        }

        .mini-day:hover {
            background-color: var(--bg-tertiary, #f3f4f6);
        }

        .mini-day.today {
            background-color: var(--error, #ef4444);
            color: #ffffff;
        }

        .mini-day.has-event .day-num::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: var(--text-secondary, #4b5563);
        }
        .mini-day.today.has-event .day-num::after {
            background-color: #ffffff;
        }
    `;

    private getMonthGrid() {
        // Counted rather than walked, for the reason given in the month view's
        // getMonthGrid: a day cursor gains an hour at a midnight DST start and
        // then drops the month's last day and the today highlight.
        const firstDayOfWeek = this.getFirstDayOfWeek();
        const dayOfWeek = new Date(this.year, this.month, 1).getDay();
        const offset = (dayOfWeek - firstDayOfWeek + 7) % 7;
        const firstCell = 1 - offset;
        const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
        const cellCount = Math.ceil((daysInMonth + offset) / 7) * 7;

        const grid: Date[] = [];
        for (let i = 0; i < cellCount; i++) {
            grid.push(new Date(this.year, this.month, firstCell + i));
        }
        return grid;
    }

    private hasEventsForDate(date: Date) {
        if (!this.events || this.events.length === 0) return false;
        
        const dayStart = new Date(date);
        dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23,59,59,999);

        return this.events.some(e => {
            const isAllDay = isAllDayEvent(e);

            if (isAllDay) {
                const startStr = e.start.split('T')[0];
                const endStr = e.end.split('T')[0];
                const startD = new Date(startStr + 'T00:00:00');
                const endD = new Date(endStr + 'T00:00:00');
                return startD <= dayStart && endD > dayStart;
            } else {
                const start = new Date(e.start);
                const end = new Date(e.end);

                if (end.getTime() === dayStart.getTime() && start.getTime() < end.getTime()) {
                    return false;
                }
                return start <= dayEnd && end >= dayStart;
            }
        });
    }

    private handleDateClick(d: Date) {
        this.focusDay = d;
        this.dispatchEvent(new CustomEvent('date-selected', {
            detail: { date: d },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * The day that is the month's one Tab stop: the one the arrow keys moved
     * to or the one last picked, else the day selected, else today, else the
     * 1st. Every day a Tab stop would be some forty in the sidebar, and some
     * five hundred in the year view, before the keyboard got past them.
     */
    private tabStop(grid: Date[]): Date {
        const onGrid = (d: Date | null | undefined) => !!d && grid.some(g => g.getTime() === d.getTime());
        if (onGrid(this.focusDay)) return this.focusDay!;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (const d of [this.currentDate, today]) {
            if (d && d.getFullYear() === this.year && d.getMonth() === this.month) {
                return new Date(this.year, this.month, d.getDate());
            }
        }
        return new Date(this.year, this.month, 1);
    }

    /** A day answers Enter and Space as a button does, Space once while it
     * is held; the arrow keys move to the day before or after, or a week up
     * or down. */
    private handleDayKeyDown(e: KeyboardEvent, d: Date, grid: Date[]) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (e.key === ' ' && e.repeat) return;
            this.handleDateClick(d);
            return;
        }
        const step = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' ? -7 : e.key === 'ArrowDown' ? 7 : 0;
        if (!step) return;
        e.preventDefault();
        const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + step);
        if (!grid.some(g => g.getTime() === next.getTime())) return;
        this.focusDay = next;
        void this.updateComplete.then(() => this.renderRoot.querySelector<HTMLElement>('.mini-day[tabindex="0"]')?.focus());
    }

    willUpdate(changed: PropertyValues<this>) {
        // Another month, or another day selected, puts the Tab stop on the day
        // selected again, not on the day the arrows last reached.
        const previous = changed.get('currentDate') as Date | undefined;
        if (changed.has('year') || changed.has('month')
            || (changed.has('currentDate') && previous?.getTime() !== this.currentDate?.getTime())) {
            this.focusDay = null;
        }
        this.dayHadFocus = !!(this.renderRoot as ShadowRoot | undefined)?.activeElement?.classList.contains('mini-day');
    }

    updated(changed: PropertyValues<this>) {
        // The days are drawn by position. When another month is shown, the day
        // that had the focus shows another date and is no Tab stop, or is gone
        // where the new month has fewer weeks. That happens when a day is
        // picked from the next or previous month's edge, and the view follows
        // it there: the focus goes to the Tab stop, which is that day.
        if (this.dayHadFocus && (changed.has('year') || changed.has('month'))) {
            this.renderRoot.querySelector<HTMLElement>('.mini-day[tabindex="0"]')?.focus();
        }
    }

    render() {
        const grid = this.getMonthGrid();
        const firstDayOfWeek = this.getFirstDayOfWeek();
        const dayNames = Array.from({length: 7}, (_, i) => {
            const dayIndex = (firstDayOfWeek + i) % 7;
            return this.i18nStore?.t(`calendar.daysNarrow.${dayIndex}`);
        });
        const today = new Date();
        today.setHours(0,0,0,0);
        const tabStop = this.tabStop(grid).getTime();
        const fullDate = new Intl.DateTimeFormat(this.i18nStore?.getIntlLanguage?.(), { dateStyle: 'full' });

        // Optional title if showTitle is true
        const monthName = this.i18nStore?.t(`calendar.months.${this.month}`);

        return html`
            ${this.showTitle ? html`<div class="year-month-title">${monthName}</div>` : ''}
            <div class="mini-grid">
                ${dayNames.map(n => html`<div class="mini-day-name">${n}</div>`)}
                ${grid.map(d => {
                    const isOtherMonth = d.getMonth() !== this.month;
                    const isToday = d.getTime() === today.getTime();
                    const hasEvent = this.hasEventsForDate(d);
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    
                    return html`
                        <div 
                            class="mini-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''} ${isWeekend ? 'weekend' : ''}" 
                            style="${isOtherMonth ? 'opacity: 0.3' : ''}"
                            role="button"
                            tabindex=${d.getTime() === tabStop ? '0' : '-1'}
                            aria-label=${fullDate.format(d)}
                            aria-current=${isToday ? 'date' : nothing}
                            @click=${() => this.handleDateClick(d)}
                            @keydown=${(e: KeyboardEvent) => this.handleDayKeyDown(e, d, grid)}
                        >
                            <span class="day-num">${d.getDate()}</span>
                        </div>
                    `;
                })}
            </div>
        `;
    }
}
