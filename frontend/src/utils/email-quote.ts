import { formatFullDate } from './ui';
import { escapeHtml, sanitizeQuotedHTML } from './html-sanitizer';

/**
 * Marks the element that holds a quoted original. The composer keeps what is
 * inside it as one block instead of passing it through its editor's schema.
 */
export const QUOTE_ATTRIBUTE = 'data-alps-quote';

export function formatAddrs(addrs: any[]): string[] {
  if (!addrs) return [];
  return addrs.map(a => a.Name ? `${a.Name} <${a.Mailbox}@${a.Host}>` : `${a.Mailbox}@${a.Host}`);
}

/** An envelope address as `mailbox@host`, lower-cased, for comparing. */
const addressKey = (a: any): string => `${a?.Mailbox ?? ''}@${a?.Host ?? ''}`.toLowerCase();

/** A setting's address as `mailbox@host`, lower-cased: `"Me" <me@x>` and `ME@x` are one. */
const bareKey = (addr: string): string => {
  const trimmed = addr.trim();
  const open = trimmed.lastIndexOf('<');
  const bare = trimmed.endsWith('>') && open !== -1 ? trimmed.slice(open + 1, -1) : trimmed;
  return bare.trim().toLowerCase();
};

/**
 * `self` is the user's own addresses. A reply is never addressed to them: a
 * Reply All used to keep the user wherever the original named them, so every
 * answer to a group mailed its author a copy. A message the user sent is
 * answered to the people it was sent to.
 */
export function generateQuote(
  type: 'reply' | 'replyAll' | 'forward',
  message: any,
  textBody: string,
  rawMessageHtml: string | null,
  hasHtml: boolean,
  dateFormat: string = 'YYYY-MM-DD',
  hourFormat: string = '12',
  self: string[] = []
) {
  const originalSubject = message?.Envelope?.Subject || '';
  let subject = originalSubject;
  if (type === 'forward') {
    subject = subject.toLowerCase().startsWith('fwd:') ? subject : `Fwd: ${subject}`;
  } else {
    subject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
  }

  let to: string[] = [];
  let cc: string[] = [];

  if (type === 'reply' || type === 'replyAll') {
    const envelope = message?.Envelope ?? {};
    const mine = new Set(self.filter(Boolean).map(bareKey));
    const taken = new Set<string>();
    // Each address once, and never one of the user's own.
    const others = (addrs: any[] | undefined): any[] => (addrs || []).filter(a => {
      const key = addressKey(a);
      if (mine.has(key) || taken.has(key)) return false;
      taken.add(key);
      return true;
    });

    const author = envelope.ReplyTo?.length > 0 ? envelope.ReplyTo : envelope.From;
    let toAddrs = others(author);
    // An empty list here means the user wrote the original.
    if (type === 'replyAll' || toAddrs.length === 0) {
      toAddrs = [...toAddrs, ...others(envelope.To)];
    }
    let ccAddrs = type === 'replyAll' ? others(envelope.Cc) : [];
    if (toAddrs.length === 0) {
      [toAddrs, ccAddrs] = [ccAddrs, []];
    }
    // A message the user sent only to themselves is answered to them.
    to = toAddrs.length > 0 ? formatAddrs(toAddrs) : formatAddrs(author);
    cc = formatAddrs(ccAddrs);
  }

  const dateStr = message?.Envelope?.Date ? formatFullDate(message.Envelope.Date, dateFormat, hourFormat) : '';
  const sender = message?.Envelope?.From?.[0];
  const senderAddress = sender?.Mailbox && sender?.Host ? `${sender.Mailbox}@${sender.Host}` : '';
  const senderName = sender?.Name || senderAddress || 'Unknown Sender';
  
  let quoteHeader = `On ${dateStr}, ${senderName} wrote:`;
  if (type === 'forward') {
    const toStrs = formatAddrs(message?.Envelope?.To).join(', ');
    quoteHeader = `---------- Forwarded message ---------\nFrom: ${senderName} <${senderAddress}>\nDate: ${dateStr}\nSubject: ${originalSubject}\nTo: ${toStrs}\n`;
  }

  const quotedText = `\n\n${quoteHeader}\n` + textBody.split('\n').map(line => `> ${line}`).join('\n');

  // Everything below builds HTML out of values the SENDER controls: the display
  // name, the address, the subject, the recipient list, and the body itself.
  // They were interpolated raw, so a display name of `<img src=x onerror=…>`
  // — or simply one containing `<` — was injected into the draft the user is
  // about to send.
  const eSenderName = escapeHtml(senderName);
  const eSenderAddress = escapeHtml(senderAddress);
  const eSubject = escapeHtml(originalSubject);
  const eDate = escapeHtml(dateStr);

  // The message body is quoted through a sanitizer that removes what executes
  // on the RECIPIENT's behalf. Without it, replying makes our user a carrier:
  // scripts and `on*` handlers ride out under our user's name. The images
  // stay, as every mail client keeps them; see sanitizeQuotedHTML for why, and
  // inlinePartsOf for the parts their `cid:` references need.
  const safeHtml = hasHtml && rawMessageHtml ? sanitizeQuotedHTML(rawMessageHtml) : '';

  // The HTML quote is marked so the composer can hold it as one piece. Its
  // editor drops every tag and style it has no node or mark for — tables,
  // fonts, colours, images — so a quote loaded as ordinary content went out
  // with its layout gone. The mark stays in the sent and saved HTML, which is
  // what lets a reopened draft keep the quote whole too.
  let quotedHtml = '';
  if (safeHtml) {
    if (type === 'forward') {
      const toStrs = escapeHtml(formatAddrs(message?.Envelope?.To).join(', '));
      quotedHtml = `<br><br><div class="gmail_quote" ${QUOTE_ATTRIBUTE}><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>From: ${eSenderName} &lt;${eSenderAddress}&gt;<br>Date: ${eDate}<br>Subject: ${eSubject}<br>To: ${toStrs}<br></div><br>${safeHtml}</div>`;
    } else {
      quotedHtml = `<br><br><div class="gmail_quote" ${QUOTE_ATTRIBUTE}><div dir="ltr" class="gmail_attr">On ${eDate}, ${eSenderName} wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${safeHtml}</blockquote></div>`;
    }
  } else {
    // The plain-text fallback is HTML too, so the body needs escaping before its
    // newlines become `<br>` — `textBody` is not markup and must not become any.
    const escapedHeader = escapeHtml(quoteHeader).replace(/\n/g, '<br>');
    const escapedBody = escapeHtml(textBody).replace(/\n/g, '<br>');
    quotedHtml = `<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">${escapedHeader}<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${escapedBody}</blockquote></div>`;
  }

  return { subject, to, cc, quotedText, quotedHtml };
}
