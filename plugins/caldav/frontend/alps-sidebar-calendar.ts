import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import type { EventData } from './calendar-service';
import '../../../frontend/src/components/alps-icon-btn';
import './calendar-mini-month';

@customElement('alps-sidebar-calendar')
export class AlpsSidebarCalendar extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;
    @property({ type: Object }) selectedDate: Date = new Date();
    @property({ type: Array }) events: EventData[] = [];

    @state() private viewDate: Date = new Date();

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
        }

        .mini-calendar-wrapper {
            margin-top: auto;
            min-height: 220px;
            display: flex;
            flex-direction: column;
        }

        .mini-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-weight: 500;
            font-size: 14px;
        }

        alps-icon-btn {
            --btn-padding: 4px;
        }
    `;

    updated(changedProperties: Map<string, any>) {
        if (changedProperties.has('selectedDate') && this.selectedDate) {
            // Keep view in sync when selected date changes externally
            this.viewDate = new Date(this.selectedDate);
        }
    }

    private changeMonth(delta: number) {
        const newDate = new Date(this.viewDate);
        newDate.setMonth(newDate.getMonth() + delta);
        this.viewDate = newDate;
    }

    render() {
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        const monthName = this.i18nStore?.t(`calendar.months.${month}`);

        return html`
            <div class="mini-calendar-wrapper">
                <div class="mini-header">
                    <alps-icon-btn icon="caretLeft" @click=${() => this.changeMonth(-1)}></alps-icon-btn>
                    <span>${monthName} ${year}</span>
                    <alps-icon-btn icon="caretRight" @click=${() => this.changeMonth(1)}></alps-icon-btn>
                </div>
                <calendar-mini-month
                    .year=${year}
                    .month=${month}
                    .events=${this.events}
                    .currentDate=${this.selectedDate}
                    @date-selected=${(e: CustomEvent) => {
                // Forward the event to the parent
                this.dispatchEvent(new CustomEvent('date-selected', {
                    detail: e.detail,
                    bubbles: true,
                    composed: true
                }));
            }}
                ></calendar-mini-month>
            </div>
        `;
    }
}
