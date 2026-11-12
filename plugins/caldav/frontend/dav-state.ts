import { HttpStatusError } from '../../../frontend/src/utils/fetch-utils';

/** Preserve the server's stable code so configuration states stay distinct from outages. */
export async function davReadError(response: Response, fallback: string): Promise<HttpStatusError> {
    const data = await response.json().catch(() => ({}));
    return new HttpStatusError(response.status, data.error || fallback);
}

export function isCalDAVNotConfigured(error: unknown): boolean {
    return error instanceof HttpStatusError && error.status === 409 && error.message === 'caldav_not_configured';
}
