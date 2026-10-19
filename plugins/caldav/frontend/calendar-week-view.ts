import { LitElement, html, css } from 'lit';
import { consume } from '@lit/context';
import { weekStart } from './calendar-service';
import { customElement, property } from 'lit/decorators.js';
import type { EventData } from './calendar-service';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import './calendar-time-grid';

@customElement('calendar-week-view')
export class CalendarWeekView extends LitElement {
    @consume({ context: i18nContext })
    @property({ attribute: false })
    i18nStore!: I18nStore;
    @property({ type: Object }) date!: Date;
    @property({ type: Array }) events: EventData[] = [];
    @property({ type: Number }) weekStart = 1;

    private getFirstDayOfWeek(): number {
        return this.weekStart ?? 1;
    }

    static styles = css`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
        }
    `;

    /**
     * Each column is counted from the week's first day, not walked to from the
     * column before. A cursor advanced by `setDate(getDate() + 1)` keeps its
     * time of day, so in a zone whose clocks skip midnight (Santiago, early
     * September) the transition day comes out at 01:00, and when the week
     * starts on that Sunday every later column inherits the hour.
     * `new Date(y, m, d + i)` lands each day on its own first minute.
     */
    private getWeekDays() {
        const start = weekStart(this.date, this.getFirstDayOfWeek());
        const year = start.getFullYear();
        const month = start.getMonth();
        const first = start.getDate();
        return Array.from({ length: 7 }, (_, i) => new Date(year, month, first + i));
    }

    render() {
        return html`
            <calendar-time-grid 
                .days=${this.getWeekDays()} 
                .events=${this.events}
                .i18nStore=${this.i18nStore}
            ></calendar-time-grid>
        `;
    }
}
