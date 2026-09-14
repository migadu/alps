/**
 * What kind of file an attachment is, from its MIME type and file name.
 *
 * The category picks the icon and its color, and says whether and how the
 * attachment can be shown in the preview: as an image, a PDF, text, audio or
 * video. The extension decides when the MIME type does not, because senders
 * often label every file application/octet-stream.
 */

export type AttachmentCategory =
  | 'pdf'
  | 'image'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'code'
  | 'text'
  | 'audio'
  | 'video'
  | 'calendar'
  | 'contact'
  | 'generic';

export type PreviewKind = 'image' | 'pdf' | 'text' | 'audio' | 'video' | 'none';

export interface AttachmentTypeInfo {
  category: AttachmentCategory;
  icon: string;
  themeClass: string;
  /** The category's color, painted inline; empty for the generic category,
   * which keeps the theme's muted text color. */
  color: string;
  previewKind: PreviewKind;
  isImage: boolean;
  isPdf: boolean;
  isAudio: boolean;
  isVideo: boolean;
  isPreviewable: boolean;
}

const IMAGE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp', 'ico', 'tiff', 'tif', 'heic', 'heif',
]);

const PDF_EXTENSIONS = new Set(['pdf']);

const DOC_EXTENSIONS = new Set([
  'doc', 'docx', 'odt', 'rtf', 'pages', 'dotx', 'docm',
]);

const SHEET_EXTENSIONS = new Set([
  'xls', 'xlsx', 'csv', 'tsv', 'ods', 'numbers', 'xlsm',
]);

const PRESENTATION_EXTENSIONS = new Set([
  'ppt', 'pptx', 'odp', 'key', 'potx', 'ppsx',
]);

const ARCHIVE_EXTENSIONS = new Set([
  'zip', 'tar', 'gz', 'rar', '7z', 'bz2', 'xz', 'tgz', 'iso', 'dmg', 'pkg', 'deb', 'rpm',
]);

const CODE_EXTENSIONS = new Set([
  'js', 'mjs', 'cjs', 'ts', 'mts', 'cts', 'jsx', 'tsx', 'json', 'json5', 'html', 'htm',
  'css', 'scss', 'sass', 'less', 'py', 'go', 'rs', 'c', 'cpp', 'h', 'hpp', 'java', 'kt',
  'sh', 'bash', 'zsh', 'yml', 'yaml', 'sql', 'xml', 'md', 'markdown', 'toml', 'ini', 'env',
  'diff', 'patch', 'php', 'rb', 'swift', 'graphql', 'gql', 'proto', 'vue', 'svelte', 'rust',
]);

const TEXT_EXTENSIONS = new Set([
  'txt', 'text', 'log', 'nfo', 'sub', 'srt',
]);

const AUDIO_EXTENSIONS = new Set([
  'mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma', 'aiff', 'opus', 'mid', 'midi',
]);

const VIDEO_EXTENSIONS = new Set([
  'mp4', 'webm', 'mov', 'mkv', 'avi', 'wmv', 'flv', 'm4v', '3gp', 'ogv',
]);

const CALENDAR_EXTENSIONS = new Set(['ics', 'ical', 'ifb']);

const CONTACT_EXTENSIONS = new Set(['vcf', 'vcard']);

function getExtension(filename: string | undefined): string {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Resolves full classification and preview capabilities for an attachment given its MIME type and filename.
 */
export function getAttachmentTypeInfo(
  contentType?: string,
  filename?: string,
): AttachmentTypeInfo {
  const mime = (contentType || '').toLowerCase().trim();
  const ext = getExtension(filename);

  // 1. PDF
  if (mime === 'application/pdf' || PDF_EXTENSIONS.has(ext)) {
    return {
      category: 'pdf',
      icon: 'filePdf',
      themeClass: 'type-pdf',
      color: '#ef4444',
      previewKind: 'pdf',
      isImage: false,
      isPdf: true,
      isAudio: false,
      isVideo: false,
      isPreviewable: true,
    };
  }

  // 2. Images
  if (mime.startsWith('image/') || IMAGE_EXTENSIONS.has(ext)) {
    return {
      category: 'image',
      icon: 'image',
      themeClass: 'type-image',
      color: '#10b981',
      previewKind: 'image',
      isImage: true,
      isPdf: false,
      isAudio: false,
      isVideo: false,
      isPreviewable: true,
    };
  }

  // 3. Audio
  if (mime.startsWith('audio/') || AUDIO_EXTENSIONS.has(ext)) {
    return {
      category: 'audio',
      icon: 'fileAudio',
      themeClass: 'type-audio',
      color: '#f59e0b',
      previewKind: 'audio',
      isImage: false,
      isPdf: false,
      isAudio: true,
      isVideo: false,
      isPreviewable: true,
    };
  }

  // 4. Video
  if (mime.startsWith('video/') || VIDEO_EXTENSIONS.has(ext)) {
    return {
      category: 'video',
      icon: 'fileVideo',
      themeClass: 'type-video',
      color: '#f43f5e',
      previewKind: 'video',
      isImage: false,
      isPdf: false,
      isAudio: false,
      isVideo: true,
      isPreviewable: true,
    };
  }

  // 5. Code & structured data (text previewable)
  if (
    CODE_EXTENSIONS.has(ext) ||
    mime === 'application/json' ||
    mime === 'application/ld+json' ||
    mime === 'application/xml' ||
    mime === 'application/javascript' ||
    mime === 'text/javascript' ||
    mime === 'text/css' ||
    mime === 'text/html' ||
    mime === 'text/markdown' ||
    mime === 'text/x-python' ||
    mime === 'text/x-shellscript'
  ) {
    return {
      category: 'code',
      icon: 'fileCode',
      themeClass: 'type-code',
      color: '#8b5cf6',
      previewKind: 'text',
      isImage: false,
      isPdf: false,
      isAudio: false,
      isVideo: false,
      isPreviewable: true,
    };
  }

  // 6. Spreadsheets (CSV/TSV are previewable as text/table)
  if (
    SHEET_EXTENSIONS.has(ext) ||
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime === 'text/csv' ||
    mime === 'text/tab-separated-values'
  ) {
    const isTextPreviewable = ext === 'csv' || ext === 'tsv' || mime === 'text/csv' || mime === 'text/tab-separated-values';
    return {
      category: 'spreadsheet',
      icon: 'fileXls',
      themeClass: 'type-spreadsheet',
      color: '#059669',
      previewKind: isTextPreviewable ? 'text' : 'none',
      isImage: false,
      isPdf: false,
      isAudio: false,
      isVideo: false,
      isPreviewable: isTextPreviewable,
    };
  }

  // 7. Documents (Word, etc.)
  if (
    DOC_EXTENSIONS.has(ext) ||
    mime.includes('word') ||
    mime.includes('officedocument.wordprocessingml') ||
    mime === 'application/rtf'
  ) {
    return {
      category: 'document',
      icon: 'fileDoc',
      themeClass: 'type-document',
      color: '#3b82f6',
      previewKind: 'none',
      isImage: false,
      isPdf: false,
      isAudio: false,
      isVideo: false,
      isPreviewable: false,
    };
  }

  // 8. Presentations (PowerPoint, Keynote)
  if (
    PRESENTATION_EXTENSIONS.has(ext) ||
    mime.includes('presentation') ||
    mime.includes('powerpoint')
  ) {
    return {
      category: 'presentation',
      icon: 'filePpt',
      themeClass: 'type-presentation',
      color: '#f59e0b',
      previewKind: 'none',
      isImage: false,
      isPdf: false,
      isAudio: false,
      isVideo: false,
      isPreviewable: false,
    };
  }

  // 9. Archives
  if (
    ARCHIVE_EXTENSIONS.has(ext) ||
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('compressed') ||
    mime.includes('archive')
  ) {
    return {
      category: 'archive',
      icon: 'fileArchive',
      themeClass: 'type-archive',
      color: '#64748b',
      previewKind: 'none',
      isImage: false,
      isPdf: false,
      isAudio: false,
      isVideo: false,
      isPreviewable: false,
    };
  }

  // 10. Calendar
  if (CALENDAR_EXTENSIONS.has(ext) || mime === 'text/calendar') {
    return {
      category: 'calendar',
      icon: 'calendarBlank',
      themeClass: 'type-calendar',
      color: '#0ea5e9',
      previewKind: 'text',
      isImage: false,
      isPdf: false,
      isAudio: false,
      isVideo: false,
      isPreviewable: true,
    };
  }

  // 11. Contact (vCard)
  if (CONTACT_EXTENSIONS.has(ext) || mime === 'text/vcard' || mime === 'text/x-vcard') {
    return {
      category: 'contact',
      icon: 'user',
      themeClass: 'type-contact',
      color: '#14b8a6',
      previewKind: 'text',
      isImage: false,
      isPdf: false,
      isAudio: false,
      isVideo: false,
      isPreviewable: true,
    };
  }

  // 12. Plain Text
  if (TEXT_EXTENSIONS.has(ext) || mime.startsWith('text/')) {
    return {
      category: 'text',
      icon: 'fileText',
      themeClass: 'type-text',
      color: '#6b7280',
      previewKind: 'text',
      isImage: false,
      isPdf: false,
      isAudio: false,
      isVideo: false,
      isPreviewable: true,
    };
  }

  // 13. Generic / Fallback
  return {
    category: 'generic',
    icon: 'file',
    themeClass: 'type-generic',
    color: '',
    previewKind: 'none',
    isImage: false,
    isPdf: false,
    isAudio: false,
    isVideo: false,
    isPreviewable: false,
  };
}
