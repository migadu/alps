import type { ComposerInstance, OpenComposerOptions } from '../store/compose-store';
import { escapeHtml } from './html-sanitizer';

/** What a `mailto:` URI asks the composer to start with (RFC 6068). */
export interface MailtoFields {
  to: string[];
  cc: string[];
  subject?: string;
  body?: string;
}

/** The slice of the compose store a `mailto:` click needs. */
export interface MailtoComposer {
  openComposer(initialData?: Partial<ComposerInstance>, options?: OpenComposerOptions): void;
}

/**
 * Splits a decoded recipient list on the commas BETWEEN addresses. A comma
 * inside double quotes belongs to one address, as in the quoted local part of
 * `"last,first"@example.com` (RFC 6068 §2) or a display name `"Doe, Jo" <jo@x>`.
 */
function addresses(value: string): string[] {
  const out: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (quoted && ch === '\\' && i + 1 < value.length) {
      current += ch + value[++i];
      continue;
    }
    if (ch === '"') quoted = !quoted;
    if (ch === ',' && !quoted) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out.map(a => a.trim()).filter(a => a !== '');
}

/**
 * Parses a `mailto:` URI, or returns null when `href` is not one or is not
 * well-formed (a bad percent-escape).
 *
 * Only `to`, `cc`, `subject` and `body` are read. Every other header field is
 * dropped: RFC 6068 §7 leaves it to the client which ones are safe, and the
 * link is written by whoever sent the message, not by the user clicking it.
 * Dropped on purpose:
 *
 *  - `bcc`, because it is the one recipient the other recipients never see. A
 *    link that prefills it lets a sender quietly copy themselves on whatever
 *    the user writes in reply to a third party, and the Bcc line is the one
 *    nobody reads before pressing Send. A user who wants a Bcc adds it by hand.
 *  - `attach`, `in-reply-to`, `from` and the rest: attaching a file, threading
 *    into a conversation or picking a sender is not a link's to decide.
 *
 * `+` is a literal plus, as the RFC says (it is legal in addresses), not a
 * space.
 */
export function parseMailto(href: string): MailtoFields | null {
  const trimmed = href.trim();
  if (!/^mailto:/i.test(trimmed)) return null;
  const rest = trimmed.slice('mailto:'.length);
  const q = rest.indexOf('?');
  const path = q < 0 ? rest : rest.slice(0, q);
  const query = q < 0 ? '' : rest.slice(q + 1);

  try {
    const fields: MailtoFields = { to: addresses(decodeURIComponent(path)), cc: [] };
    for (const pair of query.split('&')) {
      if (pair === '') continue;
      const eq = pair.indexOf('=');
      const name = decodeURIComponent(eq < 0 ? pair : pair.slice(0, eq)).toLowerCase();
      const value = eq < 0 ? '' : decodeURIComponent(pair.slice(eq + 1));
      switch (name) {
        case 'to': fields.to.push(...addresses(value)); break;
        case 'cc': fields.cc.push(...addresses(value)); break;
        // A repeated subject or body is ambiguous; the first one wins.
        case 'subject': fields.subject ??= value; break;
        case 'body': fields.body ??= value.replace(/\r\n?/g, '\n'); break;
      }
    }
    return fields;
  } catch {
    return null;
  }
}

/** The composer's opening state for a parsed `mailto:`, in both formats. */
export function mailtoComposerData(fields: MailtoFields): Partial<ComposerInstance> {
  const data: Partial<ComposerInstance> = { to: fields.to, cc: fields.cc };
  if (fields.subject) data.subject = fields.subject;
  if (fields.body) {
    data.text = fields.body;
    data.html = plainTextToEditorHtml(fields.body);
  }
  return data;
}

/**
 * Plain text as HTML the rich editor loads as it was written. As the composer
 * itself turns text into paragraphs, a blank line ends a paragraph and any
 * other line break is a `<br>` within one, so the editor's text, the message's
 * text/plain part, comes back as the body was. Each paragraph is marked
 * `white-space: pre-wrap`: the editor's parser collapses runs of spaces and
 * drops leading ones everywhere else. The style is only read while parsing;
 * the paragraph node does not keep it.
 *
 * Escaped first: the body is the link author's text, not markup.
 */
function plainTextToEditorHtml(text: string): string {
  return text
    .split('\n\n')
    .map(block => `<p style="white-space: pre-wrap">${block.split('\n').map(escapeHtml).join('<br>')}</p>`)
    .join('');
}

/**
 * A click handler that opens alps's composer for a `mailto:` link, instead of
 * whatever mail handler the browser or the operating system has registered.
 *
 * Takes over only a plain primary click on a well-formed `mailto:`. A modified
 * click, any other link, and a `mailto:` this cannot parse are left to the
 * browser, so the user can still reach the system handler with a modifier,
 * and nothing is swallowed silently.
 *
 * Works on events from an HTML message's frame too: the frame is same-origin,
 * and `closest` is read off the target rather than tested with `instanceof`,
 * which is false across the frame's realm.
 */
export function openMailtoFromClick(event: MouseEvent, composer: MailtoComposer | undefined): void {
  if (!composer || event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = event.target as Element | null;
  const anchor = typeof target?.closest === 'function' ? target.closest('a[href]') : null;
  if (!anchor) return;
  const fields = parseMailto(anchor.getAttribute('href') ?? '');
  if (!fields) return;
  event.preventDefault();
  composer.openComposer(mailtoComposerData(fields), { signature: 'below' });
}

/**
 * Routes `mailto:` clicks in an HTML message's frame to the composer. Call on
 * every load: each `srcdoc` is a fresh document with no listeners on it.
 */
export function interceptMailtoClicks(iframe: HTMLIFrameElement, composer: () => MailtoComposer | undefined): void {
  iframe.contentDocument?.addEventListener('click', e => openMailtoFromClick(e as MouseEvent, composer()));
}
