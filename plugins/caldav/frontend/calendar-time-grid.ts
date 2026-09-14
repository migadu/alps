import { renderIcon } from '../../../frontend/src/utils/ui';
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { EventData } from './calendar-service';
import { isAllDayEvent } from './calendar-service';
import '../../../frontend/src/components/alps-popup';
import '../../../frontend/src/components/alps-icon-btn';
import './calendar-event-preview';

import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';

@customElement('calendar-time-grid')
export class CalendarTimeGrid extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;
    @property({ type: Array }) days: Date[] = [];
    @property({ type: Array }) events: EventData[] = [];
    @state() private scrolled = false;
    /** The clock behind the now-line. It also decides which column is today,
     *  so the line cannot sit in a column the header no longer marks. */
    @state() private now = new Date();

    private nowTimer?: number;

    connectedCallback() {
        super.connectedCallback();
        this.now = new Date();
        this.nowTimer = window.setInterval(() => { this.now = new Date(); }, 60_000);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.nowTimer !== undefined) {
            clearInterval(this.nowTimer);
            this.nowTimer = undefined;
        }
    }

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            background-color: var(--bg-primary, #ffffff);
        }

        .time-grid-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .header-wrapper {
            position: sticky;
            top: 0;
            z-index: 10;
            background: var(--bg-primary, #ffffff);
            transition: box-shadow 0.2s ease;
        }

        .header-wrapper.scrolled {
            box-shadow: rgba(95, 95, 95, 0.1) 0 4px 4px -2px;
        }

        .time-grid-header {
            display: flex;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #ffffff);
        }

        .time-axis-spacer {
            width: 60px;
            flex-shrink: 0;
            box-sizing: border-box;
            border-right: 1px solid var(--border-color, #e5e7eb);
        }

        .time-grid-days {
            flex: 1;
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(0, 1fr);
        }

        .time-grid-day-header {
            padding: 8px;
            text-align: center;
            box-sizing: border-box;
            border-right: 1px solid var(--border-color, #e5e7eb);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        .time-grid-day-header:last-child { border-right: none; }

        .time-grid-day-name {
            font-size: 11px;
            font-weight: 500;
            color: var(--text-secondary, #4b5563);
            text-transform: uppercase;
        }
        .time-grid-day-number {
            font-size: 20px;
            font-weight: 400;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            color: var(--text-primary, #111827);
        }
        .time-grid-day-number.today {
            background-color: var(--error, #ef4444);
            color: #ffffff;
        }

        .all-day-row {
            display: flex;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            min-height: 24px;
            background: var(--bg-primary, #ffffff);
        }

        .all-day-label {
            width: 60px;
            flex-shrink: 0;
            font-size: 11px;
            color: var(--text-muted, #6b7280);
            padding: 4px 8px;
            box-sizing: border-box;
            text-align: right;
            border-right: 1px solid var(--border-color, #e5e7eb);
        }

        .all-day-content {
            flex: 1;
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(0, 1fr);
        }
        .all-day-cell {
            border-right: 1px solid var(--border-color, #e5e7eb);
            padding: 2px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .all-day-cell:last-child { border-right: none; }

        .time-grid-scroll {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            position: relative;
        }

        .time-grid-body {
            display: flex;
            position: relative;
            min-height: 1152px; /* 24 hours * 48px */
            padding-top: 12px;
            padding-bottom: 24px;
        }

        .time-axis {
            width: 60px;
            flex-shrink: 0;
            box-sizing: border-box;
            border-right: 1px solid var(--border-color, #e5e7eb);
            position: relative;
        }

        .time-label {
            position: absolute;
            right: 8px;
            font-size: 11px;
            color: var(--text-muted, #6b7280);
            transform: translateY(-50%);
        }

        .time-grid-columns {
            flex: 1;
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(0, 1fr);
            position: relative;
            background-image: linear-gradient(to bottom, var(--border-color, #e5e7eb) 1px, transparent 1px);
            background-size: 100% 48px; /* 48px per hour */
        }

        .time-column {
            border-right: 1px solid var(--border-color, #e5e7eb);
            position: relative;
        }
        .time-column:last-child { border-right: none; }

        alps-popup.time-event-popup {
            position: absolute;
            left: 2px;
            right: 2px;
            display: block;
            z-index: 5;
        }
        .time-event {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: rgba(37, 99, 235, 0.9);
            color: #ffffff;
            border-radius: 4px;
            padding: 4px 6px;
            font-size: 11px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            cursor: pointer;
            box-sizing: border-box;
        }
        .time-event:hover {
            background-color: var(--accent-color, #2563eb);
        }
        .time-event-title {
            font-weight: 500;
            margin-bottom: 2px;
        }

        .event-chip {
            background-color: #f59e0b;
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
        /* An invitation the user declined stays in view, so it can be taken
           back, but reads as not happening. */
        .declined {
            opacity: 0.55;
            text-decoration: line-through;
        }

        .event-chip:hover {
            opacity: 1;
        }
        /* A task's chip: outlined in its calendar's colour, marked with a check,
           so it does not read as an all-day event. Doubled to outrank the
           all-day chip's own background. */
        .event-chip.event-chip.task {
            display: flex;
            align-items: center;
            gap: 4px;
            background-color: var(--bg-primary, #ffffff);
            color: var(--text-primary, #111827);
            border: 1px solid;
            border-left-width: 3px;
            box-shadow: none;
        }
        .event-chip.task svg {
            flex-shrink: 0;
            width: 12px;
            height: 12px;
            fill: currentColor;
        }

        .now-line {
            position: absolute;
            left: 0;
            right: 0;
            border-top: 2px solid var(--error, #ef4444);
            /* Above the event popups (z-index 5), so an event cannot bury it. */
            z-index: 6;
            pointer-events: none;
        }
        .now-line::before {
            content: '';
            position: absolute;
            left: 0;
            /* The padding box starts below the 2px border, so -5px centers the
               8px dot on the line. */
            top: -5px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--error, #ef4444);
        }
    `;

    private getEventsForDate(date: Date, includeAllDay: boolean) {
        if (!this.events) return [];
        return this.events.filter(e => {
            const isAllDay = isAllDayEvent(e);
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

    private handleColumnClick(e: MouseEvent, date: Date) {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const hour = Math.floor(y / 48);

        const newDate = new Date(date);
        newDate.setHours(hour, 0, 0, 0);

        this.dispatchEvent(new CustomEvent('create-event', {
            // The intent is stated rather than left to the editor, which read any
            // midnight as a day-cell click: the top (00:00) row of the week and
            // day grids opened the all-day form.
            detail: { date: newDate, allDay: false },
            bubbles: true,
            composed: true
        }));
    }

    private handleAllDayCellClick(date: Date) {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);

        this.dispatchEvent(new CustomEvent('create-event', {
            detail: { date: newDate, allDay: true },
            bubbles: true,
            composed: true
        }));
    }




    private handleScroll(e: Event) {
        const target = e.target as HTMLElement;
        this.scrolled = target.scrollTop > 0;
    }

    render() {
        const hours = Array.from({length: 24}, (_, i) => i);
        const today = new Date(this.now);
        today.setHours(0,0,0,0);

        return html`
            <div class="time-grid-container">
                <div class="time-grid-scroll" @scroll=${this.handleScroll}>
                    <div class="header-wrapper ${this.scrolled ? 'scrolled' : ''}">
                        <div class="time-grid-header">
                            <div class="time-axis-spacer"></div>
                            <div class="time-grid-days">
                                ${this.days.map(d => {
                                    const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
                                    return html`
                                        <div class="time-grid-day-header">
                                            <span class="time-grid-day-name">${this.i18nStore?.t(`calendar.daysShort.${d.getDay()}`)}</span>
                                            <span class="time-grid-day-number ${isToday ? 'today' : ''}">${d.getDate()}</span>
                                        </div>
                                    `;
                                })}
                            </div>
                        </div>

                        <div class="all-day-row">
                            <div class="all-day-label">${this.i18nStore?.t('calendar.allDay')?.toLowerCase()}</div>
                            <div class="all-day-content">
                                ${this.days.map(d => {
                                    const allDayEvents = this.getEventsForDate(d, true);
                                    return html`
                                        <div class="all-day-cell" @click=${() => this.handleAllDayCellClick(d)} style="cursor: pointer;">
                                            ${allDayEvents.map(e => html`
                                                <alps-popup align="left" position="bottom" style="width: 100%; display: block;" @click=${(ev: Event) => ev.stopPropagation()}>
                                                    <div slot="trigger"
                                                        class="event-chip ${e.task ? 'task' : ''} ${e.status === 'declined' ? 'declined' : ''}" 
                                                        style=${e.task ? `border-color: ${e.color}` : e.color ? `background-color: ${e.color}` : ''}
                                                        title="${e.summary || (this.i18nStore?.t('calendar.noTitle'))}">
                                                        ${e.task ? renderIcon('checkCircle') : ''}${e.summary || (this.i18nStore?.t('calendar.noTitle'))}
                                                    </div>
                                                    <calendar-event-preview .event=${e}></calendar-event-preview>
                                                </alps-popup>
                                            `)}
                                        </div>
                                    `;
                                })}
                            </div>
                        </div>
                    </div>

                    <div class="time-grid-body">
                        <div class="time-axis">
                            ${hours.map(h => html`
                                <div class="time-label" style="top: ${h * 48}px">${h.toString().padStart(2, '0')}:00</div>
                            `)}
                        </div>
                        <div class="time-grid-columns">
                            ${this.days.map(d => {
                                const timedEvents = this.getEventsForDate(d, false);
                                const dayStart = new Date(d);
                                dayStart.setHours(0,0,0,0);
                                const dayEnd = new Date(d);
                                dayEnd.setHours(23,59,59,999);
                                const isToday = dayStart.getTime() === today.getTime();

                                return html`
                                    <div class="time-column" @click=${(e: MouseEvent) => this.handleColumnClick(e, d)} style="cursor: pointer;">
                                        ${isToday ? html`
                                            <div class="now-line" style="top: ${(this.now.getHours() + this.now.getMinutes() / 60) * 48}px"></div>
                                        ` : ''}
                                        ${timedEvents.map(e => {
                                            const start = new Date(e.start);
                                            const end = new Date(e.end);
                                            
                                            // constrain to this column's day bounds
                                            const renderStart = start < dayStart ? dayStart : start;
                                            const renderEnd = end > dayEnd ? dayEnd : end;

                                            const top = (renderStart.getHours() * 48) + (renderStart.getMinutes() / 60 * 48);
                                            // Both ends read off the wall clock, like the hour lines behind
                                            // them. Elapsed time is not wall-clock distance on a DST day: an
                                            // 01:00-04:00 event on a spring-forward Sunday is two real hours,
                                            // so a height from milliseconds stopped at the 03:00 line.
                                            const bottom = (renderEnd.getHours() * 48) + (renderEnd.getMinutes() / 60 * 48);
                                            let height = bottom - top;
                                            
                                            // Ensure minimum height for visibility, but don't overflow bottom
                                            if (height < 20) height = 20;
                                            if (top + height > 24 * 48) height = (24 * 48) - top;

                                            return html`
                                                <alps-popup 
                                                    class="time-event-popup"
                                                    align="left" position="bottom" 
                                                    style="top: ${top}px; height: ${height}px;"
                                                    @click=${(ev: Event) => ev.stopPropagation()}>
                                                    <div slot="trigger"
                                                        class="time-event ${e.status === 'declined' ? 'declined' : ''}" 
                                                        style="${e.color ? `background-color: ${e.color}; border-color: ${e.color};` : ''}" 
                                                        title="${e.summary || (this.i18nStore?.t('calendar.noTitle'))}">
                                                        <div class="time-event-title">${e.summary || (this.i18nStore?.t('calendar.noTitle'))}</div>
                                                    </div>
                                                    <calendar-event-preview .event=${e}></calendar-event-preview>
                                                </alps-popup>
                                            `;
                                        })}
                                    </div>
                                `;
                            })}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
