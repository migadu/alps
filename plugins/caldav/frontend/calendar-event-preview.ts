import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { EventData } from './calendar-service';
import '../../../frontend/src/components/alps-icon-btn';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { isAllDayEvent } from './calendar-service';

@customElement('calendar-event-preview')
export class CalendarEventPreview extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;
    @property({ type: Object }) event!: EventData;

    static styles = css`
        :host {
            display: block;
            padding: 12px;
            min-width: 280px;
            max-width: 320px;
            white-space: normal;
            cursor: default;
            box-sizing: border-box;
            background: var(--bg-primary, #ffffff);
            border-radius: 8px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 4px 4px 12px 4px;
        }

        .title-container {
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }

        .color-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-top: 5px;
            flex-shrink: 0;
        }

        .title {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary, #111827);
            word-break: break-word;
            line-height: 1.4;
        }

        .edit-btn {
            --icon-size: 16px;
            color: var(--text-secondary, #6b7280);
            margin-left: 12px;
            flex-shrink: 0;
        }

        .card {
            background: var(--bg-secondary, #f3f4f6);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .card:last-child {
            margin-bottom: 0;
        }

        .card-row {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary, #111827);
        }

        .card-row svg {
            width: 18px;
            height: 18px;
            fill: currentColor;
            color: var(--text-muted, #9ca3af);
        }

        .card-text {
            font-size: 13px;
            color: var(--text-secondary, #4b5563);
            margin-left: 22px;
            line-height: 1.4;
        }

        .card-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted, #9ca3af);
            margin-bottom: 2px;
        }

        .description-text {
            font-size: 13px;
            color: var(--text-primary, #111827);
            white-space: pre-wrap;
            line-height: 1.5;
        }

        .date-primary {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #111827);
        }

        .date-secondary {
            font-size: 13px;
            color: var(--text-secondary, #4b5563);
        }
    `;

    private formatEventDate(dateStr: string, endStr: string) {
        const isAllDay = isAllDayEvent(dateStr, endStr);
        let d: Date;
        if (isAllDay) {
            d = new Date(dateStr.split('T')[0] + 'T00:00:00');
        } else {
            d = new Date(dateStr);
        }
        return `${this.i18nStore?.t(`calendar.days.${d.getDay()}`)}, ${this.i18nStore?.t(`calendar.monthsShort.${d.getMonth()}`)} ${d.getDate()}, ${d.getFullYear()}`;
    }

    private formatEventTimeRange(startStr: string, endStr: string) {
        const s = new Date(startStr);
        const e = new Date(endStr);
        const isAllDay = isAllDayEvent(startStr, endStr);
        if (isAllDay) return this.i18nStore?.t('calendar.allDay');
        
        const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
        if (s.toDateString() === e.toDateString()) {
            return `${s.toLocaleTimeString(undefined, timeOptions)} - ${e.toLocaleTimeString(undefined, timeOptions)}`;
        }
        return `${s.toLocaleTimeString(undefined, timeOptions)} - ${this.i18nStore?.t(`calendar.monthsShort.${e.getMonth()}`)} ${e.getDate()} ${e.toLocaleTimeString(undefined, timeOptions)}`;
    }

    private handleEdit(ev: Event) {
        ev.stopPropagation();
        const popup = this.closest('alps-popup') as any;
        if (popup) popup.close();
        
        setTimeout(() => {
            this.dispatchEvent(new CustomEvent('edit-event', {
                detail: { event: this.event },
                bubbles: true,
                composed: true
            }));
        }, 10);
    }

    private handleDelete(ev: Event) {
        ev.stopPropagation();
        const popup = this.closest('alps-popup') as any;
        if (popup) popup.close();
        
        setTimeout(() => {
            this.dispatchEvent(new CustomEvent('delete-event', {
                detail: { event: this.event },
                bubbles: true,
                composed: true
            }));
        }, 10);
    }

    render() {
        if (!this.event) return html``;

        const e = this.event;
        return html`
            <div class="header">
                <div class="title-container">
                    <div class="color-dot" style="background-color: ${e.color || 'var(--accent-color, #2563eb)'}"></div>
                    <h3 class="title">${e.summary || (this.i18nStore?.t('calendar.noTitle'))}</h3>
                </div>
                <div style="display: flex; gap: 4px;">
                    <alps-icon-btn class="edit-btn" icon="pen" title=${this.i18nStore?.t('calendar.editEvent')} @click=${this.handleEdit}></alps-icon-btn>
                    <alps-icon-btn class="delete-btn" icon="trash" title=${this.i18nStore?.t('calendar.deleteEvent')} @click=${this.handleDelete} style="color: var(--error, #ef4444);"></alps-icon-btn>
                </div>
            </div>

            <div class="card">
                <div class="date-primary">${this.formatEventDate(e.start, e.end)}</div>
                <div class="date-secondary">${this.formatEventTimeRange(e.start, e.end)}</div>
            </div>

            ${e.location ? html`
            <div class="card">
                <div class="card-label">${this.i18nStore?.t('calendar.location')}</div>
                <div class="description-text">${e.location}</div>
            </div>` : ''}

            ${e.description ? html`
            <div class="card">
                <div class="card-label">${this.i18nStore?.t('calendar.notes')}</div>
                <div class="description-text">${e.description}</div>
            </div>` : ''}
        `;
    }
}
