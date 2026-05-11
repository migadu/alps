import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { EventData } from './calendar-service';
import './calendar-mini-month';

@customElement('calendar-year-view')
export class CalendarYearView extends LitElement {
    @property({ type: Number }) year!: number;
    @property({ type: Array }) events: EventData[] = [];

    static styles = css`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
            background-color: var(--bg-primary, #ffffff);
        }

        .year-view {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            grid-auto-rows: minmax(240px, 1fr);
            gap: 48px 36px;
            padding: 32px 64px;
            overflow-y: auto;
            height: 100%;
            width: 100%;
            box-sizing: border-box;

            /* Fluid typography for the mini-months inside the year view */
            --mini-month-font-size: clamp(12px, 1.2vw, 18px);
            --mini-month-title-size: clamp(16px, 1.5vw, 24px);
            --mini-month-day-size: clamp(11px, 1vw, 16px);
        }

        calendar-mini-month {
            padding: 12px;
            box-sizing: border-box;
        }

        @media (min-width: 600px) {
            .year-view { grid-template-columns: repeat(2, 1fr); }
        }

        @media (min-width: 900px) {
            .year-view { grid-template-columns: repeat(3, 1fr); }
        }

        @media (min-width: 1200px) {
            .year-view { grid-template-columns: repeat(4, 1fr); }
        }
    `;

    render() {
        const months = Array.from({length: 12}, (_, i) => i);
        return html`
            <div class="year-view">
                ${months.map(month => html`
                    <calendar-mini-month 
                        .year=${this.year} 
                        .month=${month} 
                        .events=${this.events}
                        .showTitle=${true}
                    ></calendar-mini-month>
                `)}
            </div>
        `;
    }
}
