import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { EventData } from './calendar-service';
import { isAllDayEvent } from './calendar-service';
import '../../../frontend/src/components/alps-popup';
import '../../../frontend/src/components/alps-icon-btn';
import './calendar-event-preview';

import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';

@customElement('calendar-month-view')
export class CalendarMonthView extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;
    @property({ type: Object }) date!: Date;
    @property({ type: Array }) events: EventData[] = [];

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            background-color: var(--bg-primary, #ffffff);
        }

        .month-view {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .month-header {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #ffffff);
        }

        .month-header-cell {
            text-align: right;
            padding: 8px 12px;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary, #4b5563);
            border-right: 1px solid var(--border-color, #e5e7eb);
        }
        .month-header-cell:last-child { border-right: none; }

        .month-grid {
            flex: 1;
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-auto-rows: 1fr;
            background: var(--border-color, #e5e7eb);
            gap: 1px;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .month-cell {
            background-color: var(--bg-primary, #ffffff);
            padding: 4px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            overflow: hidden;
        }
        .month-cell.other-month {
            background-color: var(--bg-secondary, #f9fafb);
            opacity: 0.7;
        }

        .date-number {
            align-self: flex-end;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 4px;
            padding: 2px 6px;
            border-radius: 12px;
        }
        .date-number.today {
            background-color: var(--error, #ef4444);
            color: #ffffff;
        }

        .event-chip {
            background-color: var(--accent-color, #2563eb);
            color: #ffffff;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            opacity: 0.9;
        }
        .event-chip:hover {
            opacity: 1;
        }
        .event-chip.all-day {
            background-color: #f59e0b;
        }
    `;

    private getMonthGrid() {
        const year = this.date.getFullYear();
        const month = this.date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const grid = [];
        let current = new Date(firstDay);
        // Rewind to Monday
        let dayOfWeek = current.getDay();
        if (dayOfWeek === 0) dayOfWeek = 7;
        current.setDate(current.getDate() - (dayOfWeek - 1));

        while (current <= lastDay || grid.length % 7 !== 0) {
            grid.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return grid;
    }

    private getEventsForDate(date: Date, includeAllDay: boolean) {
        if (!this.events) return [];
        return this.events.filter(e => {
            const isAllDay = isAllDayEvent(e.start, e.end);
            if (includeAllDay !== isAllDay) return false;

            const dayStart = new Date(date);
            dayStart.setHours(0,0,0,0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23,59,59,999);
            
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

    private handleCellClick(date: Date) {
        this.dispatchEvent(new CustomEvent('create-event', {
            detail: { date },
            bubbles: true,
            composed: true
        }));
    }




    render() {
        const grid = this.getMonthGrid();
        const dayNames = Array.from({length: 7}, (_, i) => {
            const d = new Date(2021, 10, i + 1); // Nov 1, 2021 was a Monday
            return this.i18nStore?.t(`calendar.daysShort.${d.getDay()}`);
        });
        const today = new Date();
        today.setHours(0,0,0,0);

        return html`
            <div class="month-view">
                <div class="month-header">
                    ${dayNames.map(n => html`<div class="month-header-cell">${n}</div>`)}
                </div>
                <div class="month-grid">
                    ${grid.map(d => {
                        const isOtherMonth = d.getMonth() !== this.date.getMonth();
                        const isToday = d.getTime() === today.getTime();
                        const dayEvents = this.getEventsForDate(d, true).concat(this.getEventsForDate(d, false));
                        return html`
                            <div class="month-cell ${isOtherMonth ? 'other-month' : ''}" @click=${() => this.handleCellClick(d)} style="cursor: pointer;">
                                <div class="date-number ${isToday ? 'today' : ''}">${d.getDate()}</div>
                                ${dayEvents.slice(0, 4).map(e => html`
                                    <alps-popup align="left" position="bottom" style="width: 100%; display: block;" @click=${(ev: Event) => ev.stopPropagation()}>
                                        <div slot="trigger"
                                            class="event-chip ${isAllDayEvent(e.start, e.end) ? 'all-day' : ''}" 
                                            style=${e.color ? `background-color: ${e.color}` : ''}
                                            title="${e.summary || (this.i18nStore?.t('calendar.noTitle'))}">
                                            ${e.summary || (this.i18nStore?.t('calendar.noTitle'))}
                                        </div>
                                        <calendar-event-preview .event=${e}></calendar-event-preview>
                                    </alps-popup>
                                `)}
                                ${dayEvents.length > 4 ? html`<div style="font-size: 11px; color: var(--text-muted); padding-left: 4px;">${this.i18nStore?.t('calendar.moreEvents', { count: dayEvents.length - 4 })}</div>` : ''}
                            </div>
                        `;
                    })}
                </div>
            </div>
        `;
    }
}
