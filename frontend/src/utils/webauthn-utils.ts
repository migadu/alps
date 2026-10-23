// WebAuthn client-side helpers
// Handles encoding/decoding and browser API calls

// Convert base64url to ArrayBuffer
export function base64urlToBuffer(base64url: string): ArrayBuffer {
    if (!base64url) {
        throw new Error('base64url is null or undefined');
    }
    // Convert base64url to base64
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Convert ArrayBuffer to base64url
export function bufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Register a new credential (for setup)
export async function registerCredential(credentialCreationOptions: any) {
    // Decode base64url fields
    credentialCreationOptions.publicKey.challenge = base64urlToBuffer(
        credentialCreationOptions.publicKey.challenge
    );
    credentialCreationOptions.publicKey.user.id = base64urlToBuffer(
        credentialCreationOptions.publicKey.user.id
    );

    // Decode excludeCredentials if present
    if (credentialCreationOptions.publicKey.excludeCredentials) {
        credentialCreationOptions.publicKey.excludeCredentials =
            credentialCreationOptions.publicKey.excludeCredentials.map((cred: any) => ({
                ...cred,
                id: base64urlToBuffer(cred.id)
            }));
    }

    // Call browser WebAuthn API
    const credential = await navigator.credentials.create(credentialCreationOptions) as PublicKeyCredential;

    if (!credential) {
        throw new Error('Credential creation failed or was cancelled.');
    }

    // Get transports if available (indicates platform vs cross-platform authenticator)
    const response = credential.response as AuthenticatorAttestationResponse;
    const transports = response.getTransports ? response.getTransports() : [];

    // Encode response for server
    return {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
            attestationObject: bufferToBase64url(response.attestationObject),
            clientDataJSON: bufferToBase64url(response.clientDataJSON),
        },
        transports: transports,
    };
}

/**
 * Options from the server that cannot be handed to the browser: a challenge or
 * an allowed credential's id that is missing, or not base64url.
 */
export class InvalidOptionsError extends Error {
    constructor() {
        super('The authentication options cannot be used.');
        this.name = 'InvalidOptionsError';
    }
}

// Authenticate with existing credential (for login)
export async function authenticateCredential(credentialRequestOptions: any) {
    // Decode base64url fields. A value that cannot be decoded failed with the
    // decoder's own English sentence when it was missing, and with atob's
    // DOMException when it was malformed; both are the same fault in the
    // options, so both are one error the page can name in the user's language.
    try {
        credentialRequestOptions.publicKey.challenge = base64urlToBuffer(
            credentialRequestOptions.publicKey.challenge
        );

        // Decode allowCredentials
        if (credentialRequestOptions.publicKey.allowCredentials) {
            credentialRequestOptions.publicKey.allowCredentials =
                credentialRequestOptions.publicKey.allowCredentials.map((cred: any) => ({
                    ...cred,
                    id: base64urlToBuffer(cred.id)
                }));
        }
    } catch {
        throw new InvalidOptionsError();
    }

    // Call browser WebAuthn API
    const assertion = await navigator.credentials.get(credentialRequestOptions) as PublicKeyCredential;

    if (!assertion) {
        // No credential means the key was not used, as when the prompt is
        // cancelled: the same NotAllowedError, which the page tells in the
        // user's language.
        throw new DOMException('No credential was returned.', 'NotAllowedError');
    }

    const response = assertion.response as AuthenticatorAssertionResponse;

    // Encode response for server
    return {
        id: assertion.id,
        rawId: bufferToBase64url(assertion.rawId),
        type: assertion.type,
        response: {
            authenticatorData: bufferToBase64url(response.authenticatorData),
            clientDataJSON: bufferToBase64url(response.clientDataJSON),
            signature: bufferToBase64url(response.signature),
            userHandle: response.userHandle ?
                bufferToBase64url(response.userHandle) : null,
        },
    };
}

// Check if WebAuthn is supported
export function isWebAuthnSupported(): boolean {
    return window.PublicKeyCredential !== undefined &&
        navigator.credentials !== undefined;
}
