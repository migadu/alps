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
        .event-chip:hover {
            opacity: 1;
        }
    `;

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

    private handleColumnClick(e: MouseEvent, date: Date) {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const hour = Math.floor(y / 48);

        const newDate = new Date(date);
        newDate.setHours(hour, 0, 0, 0);

        this.dispatchEvent(new CustomEvent('create-event', {
            detail: { date: newDate },
            bubbles: true,
            composed: true
        }));
    }

    private handleAllDayCellClick(date: Date) {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);

        this.dispatchEvent(new CustomEvent('create-event', {
            detail: { date: newDate },
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
        const today = new Date();
        today.setHours(0,0,0,0);

        return html`
            <div class="time-grid-container">
                <div class="time-grid-scroll" @scroll=${this.handleScroll}>
                    <div class="header-wrapper ${this.scrolled ? 'scrolled' : ''}">
                        <div class="time-grid-header">
                            <div class="time-axis-spacer"></div>
                            <div class="time-grid-days">
                                ${this.days.map(d => {
                                    const isToday = d.getTime() === today.getTime();
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
                                                        class="event-chip" 
                                                        style=${e.color ? `background-color: ${e.color}` : ''}
                                                        title="${e.summary || (this.i18nStore?.t('calendar.noTitle'))}">
                                                        ${e.summary || (this.i18nStore?.t('calendar.noTitle'))}
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

                                return html`
                                    <div class="time-column" @click=${(e: MouseEvent) => this.handleColumnClick(e, d)} style="cursor: pointer;">
                                        ${timedEvents.map(e => {
                                            const start = new Date(e.start);
                                            const end = new Date(e.end);
                                            
                                            // constrain to this column's day bounds
                                            const renderStart = start < dayStart ? dayStart : start;
                                            const renderEnd = end > dayEnd ? dayEnd : end;

                                            const top = (renderStart.getHours() * 48) + (renderStart.getMinutes() / 60 * 48);
                                            const durationMinutes = (renderEnd.getTime() - renderStart.getTime()) / 1000 / 60;
                                            let height = (durationMinutes / 60) * 48;
                                            
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
                                                        class="time-event" 
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
