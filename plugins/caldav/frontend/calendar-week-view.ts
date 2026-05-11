import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { EventData } from './calendar-service';
import './calendar-time-grid';

@customElement('calendar-week-view')
export class CalendarWeekView extends LitElement {
    @property({ type: Object }) date!: Date;
    @property({ type: Array }) events: EventData[] = [];

    static styles = css`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
        }
    `;

    private getWeekDays() {
        const days = [];
        const current = new Date(this.date);
        let dayOfWeek = current.getDay();
        if (dayOfWeek === 0) dayOfWeek = 7;
        current.setDate(current.getDate() - (dayOfWeek - 1));

        for (let i = 0; i < 7; i++) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return days;
    }

    render() {
        return html`
            <calendar-time-grid 
                .days=${this.getWeekDays()} 
                .events=${this.events}
            ></calendar-time-grid>
        `;
    }
}
