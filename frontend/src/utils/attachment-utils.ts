import { Logger } from './logger';
export interface Attachment {
  uuid?: string;
  partPath?: string;
  filename: string;
  size: number;
  uploading?: boolean;
  progress?: number;
  _tempId?: string; // used to identify the attachment during upload
}

const activeUploads = new Map<string, XMLHttpRequest>();

export function abortUpload(tempId: string) {
  const xhr = activeUploads.get(tempId);
  if (xhr) {
    xhr.abort();
    activeUploads.delete(tempId);
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
  onError: (tempId: string, err: any) => void
) {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;

  input.onchange = (e: Event) => {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    if (files.length === 0) return;

    let incomingBytes = 0;
    for (const file of files) {
      incomingBytes += file.size;
    }

    if (maxBytes > 0 && (currentBytes + incomingBytes) > maxBytes) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: `Attachments exceed the maximum allowed size.`,
          duration: 5000
        }
      }));
      return; // Abort upload of all these files
    }

    for (const file of files) {
      const tempId = Math.random().toString(36).substring(2, 15);
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
  };

  input.click();
}
