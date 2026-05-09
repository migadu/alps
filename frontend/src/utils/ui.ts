import { html, type TemplateResult } from 'lit';
import type { I18nStore } from '../store/i18n-store';
import { FOLDER_INBOX, FOLDER_DRAFTS, FOLDER_SENT, FOLDER_ARCHIVE, FOLDER_ARCHIVES, FOLDER_SPAM, FOLDER_JUNK, FOLDER_TRASH } from './folders';

export function renderIcon(name: string): TemplateResult {
  return html`
    <svg class="icon">
      <use href="/assets/icons/sprite.svg?v=7#${name}"></use>
    </svg>
  `;
}

export function getAvatarInitials(name: string, email: string): string {
  if (name) {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
  if (email) return email.substring(0, 2).toUpperCase();
  return '??';
}

export function getAvatarColor(identifier: string): string {
  if (!identifier) return '#78909c';
  const colors = [
    '#ef5350', '#ec407a', '#ab47bc', '#7e57c2', '#5c6bc0', 
    '#42a5f5', '#29b6f6', '#26c6da', '#26a69a', '#66bb6a', 
    '#9ccc65', '#d4e157', '#ffca28', '#ffa726', '#ff7043', 
    '#8d6e63', '#78909c'
  ];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function formatDateList(dateInput: string | Date, dateFormatStr: string = 'YYYY-MM-DD', hourFormatStr: string = '12'): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  
  if (date.getDate() === now.getDate() && 
      date.getMonth() === now.getMonth() && 
      date.getFullYear() === now.getFullYear()) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: hourFormatStr === '12' });
  }
  
  if (date.getFullYear() !== now.getFullYear()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    
    if (dateFormatStr === 'YYYY-MM-DD') return `${y}-${m}-${d}`;
    if (dateFormatStr === 'MM/DD/YYYY') return `${m}/${d}/${y}`;
    if (dateFormatStr === 'DD.MM.YYYY') return `${d}.${m}.${y}`;
    
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatFullDate(dateInput: string | Date, dateFormatStr: string = 'YYYY-MM-DD', hourFormatStr: string = '12'): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  
  let datePart = `${y}-${m}-${d}`;
  if (dateFormatStr === 'MM/DD/YYYY') datePart = `${m}/${d}/${y}`;
  else if (dateFormatStr === 'DD.MM.YYYY') datePart = `${d}.${m}.${y}`;
  
  const timePart = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: hourFormatStr === '12' });
  
  return `${datePart} ${timePart}`;
}

export function getMailboxLabel(name: string, i18nStore?: I18nStore): string {
  if (!name) return '';
  const stdMap: Record<string, string | undefined> = {
    [FOLDER_INBOX]: i18nStore?.t('folderList.inbox'),
    [FOLDER_DRAFTS]: i18nStore?.t('folderList.drafts'),
    [FOLDER_SENT]: i18nStore?.t('folderList.sent'),
    [FOLDER_ARCHIVE]: i18nStore?.t('folderList.archive'),
    [FOLDER_ARCHIVES]: i18nStore?.t('folderList.archive'),
    [FOLDER_SPAM]: i18nStore?.t('folderList.spam'),
    [FOLDER_JUNK]: i18nStore?.t('folderList.junk'),
    [FOLDER_TRASH]: i18nStore?.t('folderList.trash')
  };
  if (stdMap[name]) return stdMap[name] as string;
  const parts = name.split(/[.\/]/);
  return parts[parts.length - 1] || name;
}

export function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
}
