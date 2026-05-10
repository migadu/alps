import { html } from 'lit';
import { renderIcon } from '../../../frontend/src/utils/ui';
import { contactsService } from '../../carddav/frontend/contacts-service';
import { fetchWithTimeout } from '../../../frontend/src/utils/fetch-utils';
import '../../../frontend/src/components/ui-prompt';

function promptForPassphrase(errorMsg?: string, i18nStore?: any): Promise<string | null> {
    return new Promise((resolve) => {
        const prompt = document.createElement('ui-prompt') as any;
        prompt.title = i18nStore?.t('gpg.passphraseRequired') as string;
        prompt.confirmText = i18nStore?.t('gpg.unlock') as string;
        prompt.cancelText = i18nStore?.t('general.cancel') as string;
        
        let label = i18nStore?.t('gpg.passphrasePrompt') as string;
        if (errorMsg) label += ` (Error: ${errorMsg})`;
            
        prompt.fields = [{
            id: 'passphrase',
            label: label,
            type: 'password',
            placeholder: i18nStore?.t('gpg.passphrase') as string,
            autofocus: true
        }];

        const cleanup = () => {
            if (prompt.parentNode) prompt.parentNode.removeChild(prompt);
        };

        prompt.addEventListener('submit', (e: any) => {
            resolve(e.detail.passphrase);
            cleanup();
        });

        prompt.addEventListener('cancel', () => {
            resolve(null);
            cleanup();
        });

        document.body.appendChild(prompt);
    });
}

let cachedPrivateKey: any = null;

async function getPrivateKey(openpgp: any, i18nStore?: any): Promise<any> {
    if (cachedPrivateKey) return cachedPrivateKey;

    // Try to get from session storage first
    const stored = sessionStorage.getItem('gpg_private_key');
    if (stored) {
        cachedPrivateKey = await openpgp.readPrivateKey({ armoredKey: stored });
        return cachedPrivateKey;
    }

    // Fetch from server
    const res = await fetchWithTimeout('/gpg/keys');
    if (!res.ok) throw new Error('Failed to fetch GPG keyring.');
    const keyring = await res.json();
    
    if (!keyring.encrypted_private_key) {
        throw new Error('No private key found on server. Please generate one in Settings.');
    }

    const privateKey = await openpgp.readPrivateKey({ armoredKey: keyring.encrypted_private_key });
    
    if (!privateKey.isDecrypted()) {
        let errorMsg: string | undefined;
        let pass = await promptForPassphrase(errorMsg, i18nStore);
        while (pass !== null) {
            try {
                const decryptedKey = await openpgp.decryptKey({
                    privateKey,
                    passphrase: pass
                });
                cachedPrivateKey = decryptedKey;
                sessionStorage.setItem('gpg_private_key', decryptedKey.armor());
                return cachedPrivateKey;
            } catch (e: any) {
                errorMsg = 'Incorrect passphrase: ' + e.message;
                pass = await promptForPassphrase(errorMsg, i18nStore);
            }
        }
        throw new Error('Passphrase prompt cancelled.');
    } else {
        // Key was already decrypted (unlikely if securely stored)
        cachedPrivateKey = privateKey;
        return cachedPrivateKey;
    }
}

export async function handlePresend(payload: any) {
    const { instance, formData, composer } = payload;
    if (!instance.encryptGpg) return formData; // Do nothing if not encrypting

    try {
        // @ts-ignore
        const openpgp = await import('openpgp');
        const to = instance.to || [];
        const cc = instance.cc || [];
        const bcc = instance.bcc || [];
        const recipients = [...to, ...cc, ...bcc];

        if (recipients.length === 0) {
            return formData;
        }

        // Fetch all contacts to find public keys
        const publicKeys: any[] = [];
        const missingKeys: string[] = [];

        // Get user's own emails from settings to skip CardDAV lookup for them
        let userEmails: string[] = [];
        try {
            const storedSettings = localStorage.getItem('alps_settings');
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                if (parsed.loginUsername) userEmails.push(parsed.loginUsername);
                if (parsed.identities) {
                    parsed.identities.forEach((i: any) => {
                        if (i.email) userEmails.push(i.email);
                    });
                }
            }
        } catch (e) {}

        for (const email of recipients) {
            // Very simple extraction if email is like "Name <email@host.com>"
            const cleanEmail = email.includes('<') ? email.split('<')[1].split('>')[0].trim() : email.trim();
            
            if (userEmails.includes(cleanEmail)) {
                // We encrypt to ourselves anyway below, so we can skip CardDAV lookup
                continue;
            }

            const result = await contactsService.fetchContacts(cleanEmail);
            const contactsList = result.contacts || [];
            let keyFound = false;
            for (const c of contactsList) {
                if (c.public_key) {
                    const key = await openpgp.readKey({ armoredKey: c.public_key });
                    publicKeys.push(key);
                    keyFound = true;
                    break;
                }
            }
            if (!keyFound) {
                missingKeys.push(email);
            }
        }

        if (missingKeys.length > 0) {
            const msgTemplate = composer.i18nStore?.t('gpg.missingPublicKeys') as string;
            alert(msgTemplate ? msgTemplate.replace('{keys}', missingKeys.join('\\n')) : `Cannot encrypt: Missing public keys for:\n${missingKeys.join('\\n')}`);
            return false; // Abort send
        }

        // We also want to encrypt to ourselves so we can read it in Sent folder
        const privateKey = await getPrivateKey(openpgp, composer.i18nStore);
        const myPubKey = privateKey.toPublic();
        publicKeys.push(myPubKey);

        // Encrypt the text/html content
        let textContent = formData.get('text') as string || '';
        let htmlContent = formData.get('html') as string || '';

        // If there's HTML, we should probably encrypt it? Standard PGP inline is text only.
        // PGP/MIME handles multipart but is much harder to assemble manually.
        // For inline, we'll encrypt the raw message. 
        // If it's HTML, we might lose formatting if the receiver doesn't support PGP inline HTML.
        // Let's just encrypt whatever format is chosen.
        let msgToEncrypt = '';
        if (instance.format === 'html' && htmlContent) {
            msgToEncrypt = htmlContent;
        } else {
            msgToEncrypt = textContent;
        }

        const message = await openpgp.createMessage({ text: msgToEncrypt });
        
        // Use our private key to sign the message
        const encrypted = await openpgp.encrypt({
            message,
            encryptionKeys: publicKeys,
            signingKeys: privateKey,
            format: 'armored'
        });

        // Update formData to only send the encrypted payload in text part
        formData.set('text', encrypted as string);
        formData.set('html', '');
        
        return formData;

    } catch (e: any) {
        alert('GPG Encryption failed: ' + e.message);
        return false; // Prevent sending
    }
}

export async function handleReaderContent(payload: any) {
    if (typeof payload.content === 'string' && payload.content.includes('-----BEGIN PGP MESSAGE-----')) {
        try {
            // @ts-ignore
            const openpgp = await import('openpgp');
            
            // Extract the PGP block
            const blockStart = payload.content.indexOf('-----BEGIN PGP MESSAGE-----');
            const blockEnd = payload.content.indexOf('-----END PGP MESSAGE-----') + '-----END PGP MESSAGE-----'.length;
            
            if (blockStart === -1 || blockEnd <= blockStart) return payload.content;

            const armoredBlock = payload.content.substring(blockStart, blockEnd);

            const privateKey = await getPrivateKey(openpgp, payload.i18nStore);
            const message = await openpgp.readMessage({ armoredMessage: armoredBlock });
            
            const { data: decrypted } = await openpgp.decrypt({
                message,
                decryptionKeys: privateKey,
                format: 'utf8'
            });

            let decryptedHtml = String(decrypted);
            // If the decrypted content is plain text, convert newlines to <br/>
            const isDecryptedHtml = decryptedHtml.includes('<html') || decryptedHtml.includes('<body') || decryptedHtml.includes('<p>') || decryptedHtml.includes('<div') || decryptedHtml.includes('<br');
            if (!isDecryptedHtml) {
                // simple sanitize of plain text to avoid XSS before injecting into our HTML wrap
                decryptedHtml = decryptedHtml.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
            }

            // Replace the encrypted block with the decrypted text
            const replaced = payload.content.substring(0, blockStart) + decryptedHtml + payload.content.substring(blockEnd);
            
            // Add a banner to the UI
            payload.banners = payload.banners || [];
            payload.banners.push(html`
              <alps-banner variant="info">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex; width: 16px; height: 16px;">${renderIcon('lock')}</span>
                  <span>${payload.i18nStore?.t('gpg.decryptedSuccess')}</span>
                </span>
              </alps-banner>
            `);

            payload.isHtml = true; // Upgrade the payload rendering to HTML
            return replaced;
        } catch (e: any) {
            console.error('Decryption failed:', e);
            
            payload.banners = payload.banners || [];
            payload.banners.push(html`
              <alps-banner variant="error">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex; width: 16px; height: 16px;">${renderIcon('lock')}</span>
                  <span>${payload.i18nStore?.t('gpg.decryptedFailed')}</span>
                </span>
              </alps-banner>
            `);

            return payload.content;
        }
    }
    return payload.content;
}
