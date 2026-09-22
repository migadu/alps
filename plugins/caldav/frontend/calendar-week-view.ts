import { LitElement, html, css } from 'lit';
import { consume } from '@lit/context';
import { weekStart } from './calendar-service';
import { customElement, property } from 'lit/decorators.js';
import type { EventData } from './calendar-service';
import { settingsContext, SettingsStore } from '../../../frontend/src/store/settings-store';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import './calendar-time-grid';

@customElement('calendar-week-view')
export class CalendarWeekView extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;
    @consume({ context: settingsContext })
    settingsStore!: SettingsStore;
    @property({ type: Object }) date!: Date;
    @property({ type: Array }) events: EventData[] = [];
    @property({ type: Number }) weekStart?: number;

    private _handleSettingsChange = () => {
        this.requestUpdate();
    };

    connectedCallback() {
        super.connectedCallback();
        this.settingsStore?.addEventListener('change', this._handleSettingsChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.settingsStore?.removeEventListener('change', this._handleSettingsChange);
    }

    private getFirstDayOfWeek(): number {
        return this.weekStart !== undefined ? this.weekStart : (this.settingsStore?.getState()?.weekStart ?? 1);
    }

    static styles = css`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
        }
    `;

    private getWeekDays() {
        const days = [];
        const firstDayOfWeek = this.getFirstDayOfWeek();
        const current = weekStart(this.date, firstDayOfWeek);

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
                .i18nStore=${this.i18nStore}
            ></calendar-time-grid>
        `;
    }
}
