import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
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
    
    // An optional date to treat as the "current" selection
    @property({ type: Object }) currentDate?: Date;

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
        const firstDay = new Date(this.year, this.month, 1);
        const lastDay = new Date(this.year, this.month + 1, 0);
        
        const grid = [];
        let current = new Date(firstDay);
        // Rewind to Monday (1 = Monday, 0 = Sunday)
        let dayOfWeek = current.getDay();
        if (dayOfWeek === 0) dayOfWeek = 7;
        current.setDate(current.getDate() - (dayOfWeek - 1));

        while (current <= lastDay || grid.length % 7 !== 0) {
            grid.push(new Date(current));
            current.setDate(current.getDate() + 1);
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
            const isAllDay = isAllDayEvent(e.start, e.end);

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
        this.dispatchEvent(new CustomEvent('date-selected', {
            detail: { date: d },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        const grid = this.getMonthGrid();
        const dayNames = Array.from({length: 7}, (_, i) => {
            const d = new Date(2021, 10, i + 1); // Nov 1, 2021 was a Monday
            return this.i18nStore?.t(`calendar.daysNarrow.${d.getDay()}`);
        });
        const today = new Date();
        today.setHours(0,0,0,0);

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
                            @click=${() => this.handleDateClick(d)}
                        >
                            <span class="day-num">${d.getDate()}</span>
                        </div>
                    `;
                })}
            </div>
        `;
    }
}
