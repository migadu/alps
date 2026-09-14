import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { addressOfPerson, calendarService, isAllDayEvent, personFromAddress, tellsSomeone } from './calendar-service';
import { isVersionConflict } from '../../../frontend/src/utils/fetch-utils';
import type { EventData, CalendarData } from './calendar-service';
import '../../../frontend/src/components/ui-modal';
import '../../../frontend/src/components/alps-input';
import '../../../frontend/src/components/alps-select';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-address-input';
import '../../../frontend/src/components/ui-confirm';
import { modalButtonStyles } from '../../../frontend/src/components/ui-modal';

@customElement('calendar-event-modal')
export class CalendarEventModal extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;

    @property({ type: Object }) event?: EventData;
    @property({ type: Object }) initialDate?: Date;
    /** What the click that opened the editor meant, when the view knows: a day
     * cell or the all-day strip says true, a time slot says false. */
    @property({ type: Boolean }) initialAllDay?: boolean;
    @property({ type: Array }) calendars: CalendarData[] = [];
    @property({ type: Boolean }) open = false;
    /** Who tells the guests about a change: the calendar server, or alps by email. */
    @property({ type: String }) scheduling: 'server' | 'email' = 'email';

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
    /** The guest list, as the address field spells it. */
    @state() attendees: string[] = [];
    /** Asking whether to email the guests the changes. */
    @state() askNotify = false;

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
            
            this.askNotify = false;
            this.attendees = (this.event?.attendees ?? []).map(addressOfPerson);
            if (this.event) {
                this.summary = this.event.summary || '';
                this.location = this.event.location || '';
                this.description = this.event.description || '';
                this.calendarPath = this.event.calendarPath || (this.calendars.length > 0 ? this.calendars[0].path : '');
                const isAllDay = isAllDayEvent(this.event);
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
                
                // Stated by the view that was clicked. A midnight start is only the
                // fallback for a caller that does not say; read on its own, it made
                // the 00:00 row of the week and day grids open the all-day form.
                const isFullDayClick = this.initialAllDay !== undefined
                    ? this.initialAllDay
                    : this.initialDate && start.getHours() === 0 && start.getMinutes() === 0;
                
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

    /** The form's start and end, as the server takes them. */
    private formTimes(): { startISO: string; endISO: string } {
        if (this.isAllDay) {
            const endD = new Date(`${this.endDate}T00:00:00.000Z`);
            endD.setUTCDate(endD.getUTCDate() + 1);
            return { startISO: `${this.startDate}T00:00:00.000Z`, endISO: endD.toISOString() };
        }
        return {
            startISO: new Date(`${this.startDate}T${this.startTime || '00:00'}`).toISOString(),
            endISO: new Date(`${this.endDate}T${this.endTime || '00:00'}`).toISOString(),
        };
    }

    /** Someone else's meeting: its guest list is its organizer's. */
    private get invited(): boolean {
        return this.event?.role === 'attendee';
    }

    private async handleSave() {
        if (!this.summary.trim() || !this.startDate || !this.endDate) return;
        // A change to a meeting that already has guests is theirs to hear about
        // or not; a new meeting's guests are invited, which is what adding them
        // asked for.
        // An event that is over, and stays over, tells nobody: moved to a time
        // still to come, it is news again.
        const staysOver = !!this.event?.ended && new Date(this.formTimes().endISO) <= new Date();
        if (this.event?.path && !this.invited && tellsSomeone({ ...this.event, ended: staysOver }, this.scheduling)) {
            this.askNotify = true;
            return;
        }
        await this.save();
    }

    private async save(notify?: boolean) {
        this.askNotify = false;
        this.isSaving = true;

        try {
            const { startISO, endISO } = this.formTimes();

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
                allDay: this.isAllDay,
                calendarPath: this.calendarPath,
                rrule: rruleStr,
                // The version this editor opened; see EventData.etag.
                etag: this.event?.etag,
                // Left out for someone else's meeting, whose list stays as it is.
                attendees: this.invited
                    ? undefined
                    : this.attendees.map(personFromAddress).filter((p): p is NonNullable<typeof p> => p !== null),
                notify,
                lang: this.i18nStore?.getLanguage?.()
            };

            const saved = this.event && this.event.path
                ? await calendarService.updateEvent(this.event.path, payload)
                : await calendarService.createEvent(payload);

            if (saved?.sendFailed) {
                window.dispatchEvent(new CustomEvent('show-toast', {
                    detail: { message: this.i18nStore?.t('invitations.notTold'), duration: 8000 }
                }));
            }
            this.open = false;
            this.dispatchEvent(new CustomEvent('saved'));
        } catch (e) {
            console.error('Failed to save event', e);
            // Refused rather than failed: the event was saved elsewhere while
            // this editor was open. "Could not be saved" invites pressing Save
            // again; the page re-reads instead, so reopening shows what the
            // other device wrote, and the typed edit stays here until closed.
            const conflict = isVersionConflict(e);
            if (conflict) this.dispatchEvent(new CustomEvent('conflict'));
            window.dispatchEvent(new CustomEvent('show-toast', {
                detail: { message: this.i18nStore?.t(conflict ? 'calendar.saveConflict' : 'calendar.saveEventFailed'), duration: 8000 }
            }));
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
                            @change=${(e: Event) => { this.calendarPath = (e.target as HTMLSelectElement).value; }}
                            ?disabled=${!!this.event}
                        ></alps-select>
                    </div>
                ` : ''}

                ${this.invited ? html`
                    <div class="form-group organized-by">
                        ${this.i18nStore?.t('invitations.organizedBy', { name: this.event?.organizer?.name || this.event?.organizer?.email || '' })}
                    </div>
                ` : html`
                    <div class="form-group">
                        <label>${this.i18nStore?.t('invitations.guests')}</label>
                        <alps-address-input
                            class="guests"
                            .addresses=${this.attendees}
                            @addresses-changed=${(e: CustomEvent) => { this.attendees = e.detail.addresses; }}
                        ></alps-address-input>
                    </div>
                `}

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

            ${this.askNotify ? html`
                <ui-confirm
                    title=${this.i18nStore?.t('invitations.notifyTitle')}
                    message=${this.i18nStore?.t('invitations.notifyChanges')}
                    confirmText=${this.i18nStore?.t('invitations.send')}
                    secondaryText=${this.i18nStore?.t('invitations.dontSend')}
                    @confirm=${() => this.save(true)}
                    @secondary=${() => this.save(false)}
                    @cancel=${() => { this.askNotify = false; }}
                ></ui-confirm>
            ` : ''}
        `;
    }
}
