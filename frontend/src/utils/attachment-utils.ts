import { Logger } from './logger';

/** The English fallback for the over-budget refusal, used when a caller has no
 * translation to hand. */
const DEFAULT_TOO_LARGE = 'Attachments exceed the maximum allowed size.';
export interface Attachment {
  uuid?: string;
  partPath?: string;
  filename: string;
  size: number;
  /** A part of the body's markup, not of the attachment tray: it is sent, which
   * is what makes the quote's `cid:` reference resolve, and shown as no chip. */
  inline?: boolean;
  uploading?: boolean;
  progress?: number;
  _tempId?: string; // used to identify the attachment during upload
}

const activeUploads = new Map<string, XMLHttpRequest>();

/**
 * An id for one in-flight upload.
 *
 * `activeUploads` is a module-level map shared by every open composer, so a
 * collision aborts somebody else's upload. The previous
 * `Math.random().toString(36).substring(2, 15)` was generated in a tight loop —
 * once per file in a multi-file selection — which is exactly where a
 * same-millisecond collision is least unlikely.
 */
export function newAttachmentId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}

export function abortUpload(tempId: string) {
  const xhr = activeUploads.get(tempId);
  if (xhr) {
    xhr.abort();
    activeUploads.delete(tempId);
  }
}

/**
 * Cancels every in-flight upload among `attachments` — for a composer that is
 * going away whole (discarded, or signed out from under).
 *
 * Without this, an upload still streaming when the session ends finishes into a
 * composer that no longer exists, and deposits its bytes in a server-side
 * session that is being torn down.
 */
export function abortUploads(attachments: Attachment[]): void {
  for (const att of attachments) {
    if (att.uploading && att._tempId) abortUpload(att._tempId);
  }
}

export async function deleteAttachment(uuid: string) {
  try {
    await fetch(`/attachments/${uuid}`, {
      method: 'DELETE'
    });
  } catch (err) {
    Logger.error('Failed to delete attachment from server:', err);
  }
}

export function handleAttachClick(
  composerId: string,
  maxBytes: number,
  currentBytes: number,
  onFileAdded: (tempId: string, file: File) => void,
  onProgress: (tempId: string, progress: number) => void,
  onComplete: (tempId: string, uuids: string[]) => void,
  onError: (tempId: string, err: any) => void,
  refusal?: string
) {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;

  input.onchange = (e: Event) => {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    if (files.length === 0) return;

    uploadFiles(files, composerId, maxBytes, currentBytes, onFileAdded, onProgress, onComplete, onError, refusal);
  };

  input.click();
}

export function uploadFiles(
  files: File[],
  composerId: string,
  maxBytes: number,
  currentBytes: number,
  onFileAdded: (tempId: string, file: File) => void,
  onProgress: (tempId: string, progress: number) => void,
  onComplete: (tempId: string, uuids: string[]) => void,
  onError: (tempId: string, err: any) => void,
  /** The translated over-budget message. Passed in because this module is not a
   * component and cannot reach the i18n store, which alps provides through Lit
   * context rather than as a singleton. */
  refusal?: string
) {
  let incomingBytes = 0;
  for (const file of files) {
    incomingBytes += file.size;
  }

  if (maxBytes > 0 && (currentBytes + incomingBytes) > maxBytes) {
    // Translated, like every other message this app shows. This one was an
    // English string literal in a UI that ships eight locales.
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        message: refusal || DEFAULT_TOO_LARGE,
        duration: 5000
      }
    }));
    return; // Abort upload of all these files
  }

  for (const file of files) {
    const tempId = newAttachmentId();
    onFileAdded(tempId, file);

    const formData = new FormData();
    formData.append('attachments', file);

    const xhr = new XMLHttpRequest();
    activeUploads.set(tempId, xhr);
    xhr.open('POST', `/attachments?composer_id=${encodeURIComponent(composerId)}`, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(tempId, progress);
      }
    };

    xhr.onload = () => {
      activeUploads.delete(tempId);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const uuids = Array.isArray(data) ? data : (data.uuids || []);
          if (uuids.length > 0) {
            onComplete(tempId, uuids);
          } else {
            onError(tempId, new Error('No UUID returned from server'));
          }
        } catch (err) {
          onError(tempId, err);
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          onError(tempId, new Error(errorData.error || 'Unknown error'));
        } catch (e) {
          onError(tempId, new Error('Upload failed with status ' + xhr.status));
        }
      }
    };

    xhr.onerror = () => {
      activeUploads.delete(tempId);
      onError(tempId, new Error('Network error during upload'));
    };

    xhr.onabort = () => {
      activeUploads.delete(tempId);
      // Do not trigger onError if user aborted explicitly
    };

    xhr.send(formData);
  }
}

/** A part of another message, as a composer names it to the server. */
export interface CarriedPart {
  name: string;
  size: number;
  type: string;
  partPath: string;
  inline?: boolean;
}

/**
 * The original's inline parts, for a reply or forward to carry.
 *
 * The quote keeps the original's `cid:` images, as every mail client's does,
 * and a `cid:` names a part of the message it came in: without the part, the
 * recipient gets a broken image. The message's attachment rows leave these
 * parts out, as parts of the body, so they are read off its structure: every
 * part with a Content-ID, whatever its disposition, numbered as the server
 * numbers parts. They are carried as inline, so they are the body's images
 * and not chips the user never attached.
 */
export function inlinePartsOf(structure: any): CarriedPart[] {
  const parts: CarriedPart[] = [];
  const walk = (node: any, path: string) => {
    if (!node) return;
    if (node.ID) {
      const encoded = Number(node.Size) || 0;
      parts.push({
        name: node.Extended?.Disposition?.Params?.filename || node.Params?.name || 'image',
        // The structure reports the encoded size, and these parts are base64.
        size: String(node.Encoding).toLowerCase() === 'base64' ? Math.floor((encoded * 3) / 4) : encoded,
        type: node.Type && node.Subtype ? `${node.Type}/${node.Subtype}`.toLowerCase() : 'application/octet-stream',
        partPath: path || '1',
        inline: true,
      });
    }
    if (Array.isArray(node.Children)) {
      node.Children.forEach((child: any, i: number) => walk(child, path ? `${path}.${i + 1}` : `${i + 1}`));
    }
  };
  walk(structure, '');
  return parts;
}
