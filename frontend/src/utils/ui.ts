import { html, type TemplateResult } from 'lit';
import type { I18nStore } from '../store/i18n-store';
import { FOLDER_INBOX, FOLDER_DRAFTS, FOLDER_SENT, FOLDER_ARCHIVE, FOLDER_ARCHIVES, FOLDER_SPAM, FOLDER_JUNK, FOLDER_TRASH } from './folders';

export function renderIcon(name: string): TemplateResult {
  return html`
    <svg class="icon">
      <use href="/assets/icons/sprite.svg?v=12#${name}"></use>
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

export function getMailboxLabel(name: string, i18nStore?: I18nStore, delimiter?: string): string {
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
  // Split on the delimiter the SERVER reported, when the caller knows it.
  //
  // This split on `[.\/]` unconditionally, which is a guess at two of the
  // several delimiters IMAP allows — and it is wrong in both directions. On a
  // `/`-delimited server a folder legitimately named "Invoices v1.2" was drawn
  // whole in the sidebar (which has always used `mb.Delimiter`) and truncated
  // to "2" in the header and the search placeholder: the same folder, two
  // different names, in the same app. The loose split stays as the fallback for
  // callers that cannot reach the mailbox list.
  const parts = delimiter ? name.split(delimiter) : name.split(/[.\/]/);
  return parts[parts.length - 1] || name;
}

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/**
 * A byte count as a short human string.
 *
 * The unit list used to stop at `GB` and the index was used unclamped, so
 * anything at or above a terabyte read `1 undefined` — reachable on a quota
 * line, where TB mailboxes are ordinary. The same unchecked index produced
 * `NaN undefined` for a negative count and `512 undefined` for a fractional
 * one, because `Math.log` of those lands outside the array in both directions.
 *
 * The carry matters too: 1048575 B is `log`-wise still in the KB band, but
 * rounds to 1024 — printed as `1024 KB` rather than `1 MB`. Re-stepping after
 * the rounding is what keeps the mantissa under 1024.
 */
export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const raw = Math.floor(Math.log(bytes) / Math.log(k));
  let i = Math.min(Math.max(raw, 0), SIZE_UNITS.length - 1);
  let value = Math.round(bytes / Math.pow(k, i));
  if (value >= k && i < SIZE_UNITS.length - 1) {
    value = Math.round(value / k);
    i++;
  }
  return `${value} ${SIZE_UNITS[i]}`;
}

export const freemailDomains = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com',
  'live.com', 'msn.com', 'pm.me', 'yandex.ru', 'mail.ru',
  'gmx.de', 'web.de', 't-online.de', 'orange.fr', 'free.fr'
]);

export function getBimiAvatarUrl(domain: string): string {
  if (!domain) return '';
  const d = domain.toLowerCase();
  return !freemailDomains.has(d) ? `/bimi/avatar?domain=${encodeURIComponent(d)}` : '';
}

/**
 * The BIMI logo URL for one contact of one message, or '' when the message has
 * not earned a logo beside that contact.
 *
 * A BIMI logo is a trust mark, not decoration. It belongs only beside the From
 * address of a message the receiving server passed under DMARC
 * (`HasBimiPotential`, read from the receiver's own Authentication-Results).
 * Asking by domain alone drew a real brand's logo beside a forged From, and
 * beside any address of that brand named in To or Cc. A message with several
 * From addresses gets none: DMARC gives no verdict for it.
 */
/**
 * Whether bimiAvatarUrlFor could draw a logo for msg once its verdict is known:
 * a single From address, at a domain a logo is asked for at all. The message
 * list asks the mail server for verdicts only where the answer could change
 * what is drawn.
 */
export function mayShowBimiLogo(msg: any): boolean {
  const from = msg?.Envelope?.From;
  return Array.isArray(from) && from.length === 1 && !!from[0]?.Mailbox && getBimiAvatarUrl(from[0]?.Host || '') !== '';
}

export function bimiAvatarUrlFor(msg: any, contact: any): string {
  if (!msg?.HasBimiPotential) return '';
  const from = msg.Envelope?.From;
  if (!Array.isArray(from) || from.length !== 1) return '';
  const address = (c: any) => (c?.Mailbox && c?.Host ? `${c.Mailbox}@${c.Host}`.toLowerCase() : '');
  const sender = address(from[0]);
  if (!sender || sender !== address(contact)) return '';
  return getBimiAvatarUrl(from[0].Host);
}

/**
 * Calculates the absolute minimum width a flex container needs to display its inflexible contents.
 * It forces the container to 0 width, letting flex layout compress flexible items, 
 * and reads the scrollWidth of the remaining unshrinkable items.
 */
export function getFlexContainerMinWidth(container: HTMLElement): number {
  if (!container) return 0;
  const origWidth = container.style.width;
  container.style.width = '0px';
  const scrollW = container.scrollWidth;
  container.style.width = origWidth;
  return scrollW;
}
