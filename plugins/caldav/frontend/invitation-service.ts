import { fetchWithTimeout, HttpStatusError } from '../../../frontend/src/utils/fetch-utils';

/** An organizer or attendee. */
export interface InvitationPerson {
    email: string;
    name?: string;
    /** An attendee's answer: needs-action, accepted, tentative, declined, delegated; for tasks also in-process and completed. */
    status?: string;
    role?: string;
}

export interface InvitationClash {
    summary: string;
    /** Left out for a repeating event, whose first occurrence is not the one that clashes. */
    start?: string;
    end?: string;
    allDay: boolean;
}

/**
 * Where an invitation stands against the calendar, as the server decided it
 * from the message in the mailbox. See the inv* constants in invitations.go.
 */
export type InvitationState =
    | 'answer' | 'update' | 'outdated' | 'organizer' | 'not-invited'
    | 'cancel' | 'cancelled' | 'reply' | 'replied' | 'unknown'
    | 'add' | 'added' | 'unsupported';

export interface InvitationView {
    method: 'request' | 'reply' | 'cancel' | 'publish' | string;
    kind: 'event' | 'task';
    uid: string;
    summary: string;
    description?: string;
    location?: string;
    start?: string;
    end?: string;
    allDay: boolean;
    rrule?: string;
    organizer?: InvitationPerson;
    attendees: InvitationPerson[];
    /** The address the invitation is for, among the user's. */
    me?: string;
    /** The user's answer as it stands. */
    status?: string;
    replier?: InvitationPerson;
    copy?: { path: string; calendarPath: string; etag?: string };
    state: InvitationState;
    /** Apply on opening: an update, cancellation or reply from whoever may send it. */
    autoApply: boolean;
    sender?: string;
    senderVerified: boolean;
    /** The event is over: there is nothing to answer, and nothing is applied on opening. */
    ended: boolean;
    /** Who mails replies: the calendar server, or alps. */
    scheduling: 'server' | 'email';
    clashes: InvitationClash[];
    calendars: { name: string; path: string; description?: string }[];
}

/** What a write that may also have mailed someone answers. */
export interface SavedInvitation {
    path?: string;
    etag?: string;
    removed?: boolean;
    sent: boolean;
    /** Saved, but the message it implies could not be sent. Not an error: repeating it would write again. */
    sendFailed?: boolean;
}

export interface InvitationRequest {
    mailbox: string;
    uid: string;
    status?: 'accepted' | 'tentative' | 'declined';
    calendarPath?: string;
    lang?: string;
}

/**
 * Whether a message's structure has a part an invitation travels in, so the
 * reader asks the server only about messages that may carry one.
 *
 * The structure is IMAP's BODYSTRUCTURE as the backend serializes it: a
 * multipart has Children, a single part Type and Subtype.
 */
export function hasCalendarPart(structure: any): boolean {
    if (!structure || typeof structure !== 'object') return false;
    if (Array.isArray(structure.Children)) {
        return structure.Children.some((child: any) => hasCalendarPart(child));
    }
    const type = `${structure.Type || ''}/${structure.Subtype || ''}`.toLowerCase();
    if (type === 'text/calendar' || type === 'application/ics') return true;
    const name = structure.Extended?.Disposition?.Params?.filename || structure.Params?.name || '';
    return typeof name === 'string' && name.toLowerCase().endsWith('.ics');
}

class InvitationService {
    /** The invitation a message carries, or null when it carries none. */
    async fetchInvitation(mailbox: string, uid: string): Promise<InvitationView | null> {
        const params = new URLSearchParams({ mailbox, uid });
        const response = await fetchWithTimeout(`/calendar/invitation?${params.toString()}`);
        if (response.status === 404) return null;
        if (!response.ok) throw new HttpStatusError(response.status, 'Failed to read the invitation');
        return response.json();
    }

    /** Answers an invitation: saved to the calendar, and mailed to the organizer unless the server does that. */
    async respond(request: InvitationRequest): Promise<SavedInvitation> {
        return this.post('/calendar/invitation/respond', request, 'Failed to answer the invitation');
    }

    /** Applies an update, cancellation or reply to the calendar, or adds a published event. */
    async apply(request: InvitationRequest): Promise<SavedInvitation> {
        return this.post('/calendar/invitation/apply', request, 'Failed to update the calendar');
    }

    private async post(url: string, body: InvitationRequest, failure: string): Promise<SavedInvitation> {
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new HttpStatusError(response.status, failure);
        return response.json();
    }
}

export const invitationService = new InvitationService();
