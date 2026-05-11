import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { EventData } from './calendar-service';
import './calendar-time-grid';

@customElement('calendar-day-view')
export class CalendarDayView extends LitElement {
    @property({ type: Object }) date!: Date;
    @property({ type: Array }) events: EventData[] = [];

    static styles = css`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
        }
    `;

    render() {
        return html`
            <calendar-time-grid 
                .days=${[this.date]} 
                .events=${this.events}
            ></calendar-time-grid>
        `;
    }
}
