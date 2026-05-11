import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { calendarService, isAllDayEvent } from './calendar-service';
import type { EventData, CalendarData } from './calendar-service';
import '../../../frontend/src/components/ui-modal';
import '../../../frontend/src/components/alps-input';
import '../../../frontend/src/components/alps-select';
import '../../../frontend/src/components/alps-button';
import { modalButtonStyles } from '../../../frontend/src/components/ui-modal';

@customElement('calendar-event-modal')
export class CalendarEventModal extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;

    @property({ type: Object }) event?: EventData;
    @property({ type: Object }) initialDate?: Date;
    @property({ type: Array }) calendars: CalendarData[] = [];
    @property({ type: Boolean }) open = false;

    @state() summary = '';
    @state() location = '';
    @state() calendarPath = '';
    @state() description = '';
    @state() startDate = '';
    @state() startTime = '';
    @state() endDate = '';
    @state() endTime = '';
    @state() isAllDay = false;
    @state() isSaving = false;
    @state() rruleFreq = '';
    @state() originalRRule = '';

    static styles = [
        modalButtonStyles,
        css`
            .form-group {
                margin-bottom: 16px;
            }
            .form-group label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 6px;
                color: var(--text-primary, #111827);
            }
            .form-row {
                display: flex;
                gap: 12px;
            }
            .form-row > div {
                flex: 1;
            }
            alps-input {
                width: 100%;
            }
            textarea {
                width: 100%;
                box-sizing: border-box;
                padding: 8px 12px;
                border: 1px solid var(--border-color, #e5e7eb);
                border-radius: 4px;
                font-family: inherit;
                font-size: 14px;
                resize: vertical;
                min-height: 80px;
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #111827);
            }
            textarea:focus {
                outline: none;
                border-color: var(--accent-color, #2563eb);
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
            }
        `
    ];

    updated(changedProperties: Map<string, any>) {
        if (changedProperties.has('open') && this.open) {
            const pad = (n: number) => n.toString().padStart(2, '0');
            
            if (this.event) {
                this.summary = this.event.summary || '';
                this.location = this.event.location || '';
                this.description = this.event.description || '';
                this.calendarPath = this.event.calendarPath || (this.calendars.length > 0 ? this.calendars[0].path : '');
                const isAllDay = isAllDayEvent(this.event.start, this.event.end);
                this.isAllDay = isAllDay;
                
                if (this.event.rrule) {
                    this.originalRRule = this.event.rrule;
                    if (this.event.rrule === 'FREQ=DAILY') this.rruleFreq = 'DAILY';
                    else if (this.event.rrule === 'FREQ=WEEKLY') this.rruleFreq = 'WEEKLY';
                    else if (this.event.rrule === 'FREQ=MONTHLY') this.rruleFreq = 'MONTHLY';
                    else if (this.event.rrule === 'FREQ=YEARLY') this.rruleFreq = 'YEARLY';
                    else this.rruleFreq = 'CUSTOM';
                } else {
                    this.originalRRule = '';
                    this.rruleFreq = '';
                }

                if (isAllDay) {
                    const start = new Date(this.event.start);
                    this.startDate = `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`;
                    this.startTime = '00:00';

                    const end = new Date(this.event.end);
                    end.setUTCDate(end.getUTCDate() - 1);
                    this.endDate = `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`;
                    this.endTime = '00:00';
                } else {
                    const start = new Date(this.event.start);
                    this.startDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
                    this.startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;

                    const end = new Date(this.event.end);
                    this.endDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
                    this.endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
                }
            } else {
                this.summary = '';
                this.location = '';
                this.description = '';
                this.originalRRule = '';
                this.rruleFreq = '';
                this.calendarPath = this.calendars.length > 0 ? this.calendars[0].path : '';
                const start = this.initialDate ? new Date(this.initialDate) : new Date();
                
                // If initialDate has a 00:00:00 time, assume user clicked on a day or month view cell
                const isFullDayClick = this.initialDate && start.getHours() === 0 && start.getMinutes() === 0;
                
                if (isFullDayClick) {
                    this.isAllDay = true;
                    this.startDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
                    this.startTime = '00:00';
                    this.endDate = this.startDate;
                    this.endTime = '00:00';
                } else {
                    this.isAllDay = false;
                    if (!this.initialDate) {
                        start.setMinutes(0, 0, 0);
                        start.setHours(start.getHours() + 1);
                    }
                    this.startDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
                    this.startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;

                    const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
                    this.endDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
                    this.endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
                }
            }
        }
    }

    private handleCancel() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('close'));
    }

    private async handleSave() {
        if (!this.summary.trim() || !this.startDate || !this.endDate) return;

        this.isSaving = true;

        try {
            let startISO: string;
            let endISO: string;

            if (this.isAllDay) {
                startISO = `${this.startDate}T00:00:00.000Z`;
                const endD = new Date(`${this.endDate}T00:00:00.000Z`);
                endD.setUTCDate(endD.getUTCDate() + 1);
                endISO = endD.toISOString();
            } else {
                const startD = new Date(`${this.startDate}T${this.startTime || '00:00'}`);
                const endD = new Date(`${this.endDate}T${this.endTime || '00:00'}`);
                startISO = startD.toISOString();
                endISO = endD.toISOString();
            }

            let rruleStr: string | undefined = undefined;
            if (this.rruleFreq === 'CUSTOM') {
                rruleStr = this.originalRRule;
            } else if (this.rruleFreq) {
                rruleStr = `FREQ=${this.rruleFreq}`;
            }

            const payload = {
                summary: this.summary,
                location: this.location,
                description: this.description,
                start: startISO,
                end: endISO,
                calendarPath: this.calendarPath,
                rrule: rruleStr
            };

            if (this.event && this.event.path) {
                await calendarService.updateEvent(this.event.path, payload);
            } else {
                await calendarService.createEvent(payload);
            }

            this.open = false;
            this.dispatchEvent(new CustomEvent('saved'));
        } catch (e) {
            console.error('Failed to save event', e);
        } finally {
            this.isSaving = false;
        }
    }

    render() {
        if (!this.open) return html``;

        return html`
            <ui-modal 
                title="${this.event ? (this.i18nStore?.t('calendar.editEvent')) : (this.i18nStore?.t('calendar.newEvent'))}" 
                width="450px"
                ?dismissible=${!this.isSaving}
                @cancel=${this.handleCancel}
            >
                <div class="form-group">
                    <label>${this.i18nStore?.t('calendar.summary')}</label>
                    <alps-input 
                        .value=${this.summary} 
                        @input=${(e: any) => this.summary = e.target.value}
                        placeholder=${this.i18nStore?.t('calendar.eventTitle')}
                    ></alps-input>
                </div>

                ${this.calendars.length > 1 ? html`
                    <div class="form-group">
                        <label>${this.i18nStore?.t('calendar.calendar')}</label>
                        <alps-select
                            .value=${this.calendarPath}
                            .options=${this.calendars.map(c => ({ value: c.path, label: c.name }))}
                            @change=${(e: any) => this.calendarPath = e.detail.value}
                            ?disabled=${!!this.event}
                        ></alps-select>
                    </div>
                ` : ''}

                <div class="form-row">
                    <div class="form-group">
                        <label>${this.i18nStore?.t('calendar.startDate')}</label>
                        <alps-input 
                            type="date"
                            .value=${this.startDate} 
                            @input=${(e: any) => this.startDate = e.target.value}
                        ></alps-input>
                    </div>
                    ${!this.isAllDay ? html`
                    <div class="form-group">
                        <label>${this.i18nStore?.t('calendar.time')}</label>
                        <alps-input 
                            type="time"
                            .value=${this.startTime} 
                            @input=${(e: any) => this.startTime = e.target.value}
                        ></alps-input>
                    </div>
                    ` : ''}
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>${this.i18nStore?.t('calendar.endDate')}</label>
                        <alps-input 
                            type="date"
                            .value=${this.endDate} 
                            @input=${(e: any) => this.endDate = e.target.value}
                        ></alps-input>
                    </div>
                    ${!this.isAllDay ? html`
                    <div class="form-group">
                        <label>${this.i18nStore?.t('calendar.time')}</label>
                        <alps-input 
                            type="time"
                            .value=${this.endTime} 
                            @input=${(e: any) => this.endTime = e.target.value}
                        ></alps-input>
                    </div>
                    ` : ''}
                </div>

                <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="allday-checkbox" .checked=${this.isAllDay} @change=${(e: any) => this.isAllDay = e.target.checked}>
                    <label for="allday-checkbox" style="margin-bottom: 0; cursor: pointer;">${this.i18nStore?.t('calendar.allDay')}</label>
                </div>

                <div class="form-group">
                    <label>${this.i18nStore?.t('calendar.repeat')}</label>
                    <alps-select
                        .value=${this.rruleFreq}
                        .options=${[
                            { value: '', label: this.i18nStore?.t('calendar.repeatNone') },
                            { value: 'DAILY', label: this.i18nStore?.t('calendar.repeatDaily') },
                            { value: 'WEEKLY', label: this.i18nStore?.t('calendar.repeatWeekly') },
                            { value: 'MONTHLY', label: this.i18nStore?.t('calendar.repeatMonthly') },
                            { value: 'YEARLY', label: this.i18nStore?.t('calendar.repeatYearly') },
                            ...(this.rruleFreq === 'CUSTOM' ? [{ value: 'CUSTOM', label: this.i18nStore?.t('calendar.repeatCustom') }] : [])
                        ]}
                        @change=${(e: any) => this.rruleFreq = e.target.value}
                    ></alps-select>
                </div>

                <div class="form-group">
                    <label>${this.i18nStore?.t('calendar.location')}</label>
                    <alps-input 
                        .value=${this.location} 
                        @input=${(e: any) => this.location = e.target.value}
                        placeholder=${this.i18nStore?.t('calendar.addLocation')}
                    ></alps-input>
                </div>

                <div class="form-group">
                    <label>${this.i18nStore?.t('calendar.description')}</label>
                    <textarea 
                        .value=${this.description} 
                        @input=${(e: any) => this.description = e.target.value}
                        placeholder=${this.i18nStore?.t('calendar.addDescription')}
                    ></textarea>
                </div>

                <div slot="actions">
                    <alps-button variant="text" @click=${this.handleCancel} ?disabled=${this.isSaving}>
                        ${this.i18nStore?.t('general.cancel')}
                    </alps-button>
                    <alps-button variant="primary" @click=${this.handleSave} ?disabled=${this.isSaving || !this.summary} ?spinning=${this.isSaving}>
                        ${this.i18nStore?.t('general.save')}
                    </alps-button>
                </div>
            </ui-modal>
        `;
    }
}
