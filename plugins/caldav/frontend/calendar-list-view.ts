import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import type { EventData } from './calendar-service';
import './calendar-event-preview';

@customElement('calendar-list-view')
export class CalendarListView extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;
    @property({ type: Array }) events: EventData[] = [];

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            overflow-y: auto;
            background-color: var(--bg-primary, #ffffff);
            padding: 16px;
            box-sizing: border-box;
        }

        .list-container {
            max-width: 800px;
            margin: 0 auto;
            width: 100%;
        }

        .no-results {
            text-align: center;
            color: var(--text-muted, #6b7280);
            padding: 40px;
            font-size: 16px;
        }

        .event-item {
            display: flex;
            padding: 16px;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            cursor: pointer;
            transition: background-color 0.15s;
            align-items: flex-start;
            gap: 16px;
        }

        .event-item:hover {
            background-color: var(--bg-tertiary, #f3f4f6);
        }

        .event-date {
            width: 100px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
        }

        .date-day {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .date-month {
            font-size: 14px;
            color: var(--text-secondary);
        }

        .date-time {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 4px;
        }

        .event-details {
            flex: 1;
            min-width: 0;
        }

        .event-title {
            font-size: 16px;
            font-weight: 500;
            color: var(--text-primary);
            margin: 0 0 4px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .color-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .event-location {
            font-size: 14px;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    `;



    render() {
        if (this.events.length === 0) {
            return html`
                <div class="list-container">
                    <div class="no-results">${this.i18nStore?.t('calendar.noResults')}</div>
                </div>
            `;
        }

        // Sort events chronologically
        const sortedEvents = [...this.events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        return html`
            <div class="list-container">
                ${sortedEvents.map(event => {
                    const startDate = new Date(event.start);
                    const isAllDay = event.start.length === 10 || event.end.length === 10;
                    
                    return html`
                        <alps-popup align="left" position="bottom" style="width: 100%; display: block;" @click=${(ev: Event) => ev.stopPropagation()}>
                            <div slot="trigger" class="event-item">
                                <div class="event-date">
                                    <span class="date-day">${startDate.getDate()}</span>
                                    <span class="date-month">${this.i18nStore?.t(`calendar.monthsShort.${startDate.getMonth()}`)} ${startDate.getFullYear()}</span>
                                    <span class="date-time">
                                        ${isAllDay ? (this.i18nStore?.t('calendar.allDay')) : startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div class="event-details">
                                    <h3 class="event-title">
                                        <div class="color-dot" style="background-color: ${event.color || '#2563eb'}"></div>
                                        ${event.summary || (this.i18nStore?.t('calendar.noTitle'))}
                                    </h3>
                                    ${event.location ? html`
                                        <div class="event-location">
                                            📍 ${event.location}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            <calendar-event-preview .event=${event}></calendar-event-preview>
                        </alps-popup>
                    `;
                })}
            </div>
        `;
    }
}
