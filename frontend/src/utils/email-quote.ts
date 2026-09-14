import { formatFullDate } from './ui';
import { escapeHtml, sanitizeQuotedHTML } from './html-sanitizer';

export function formatAddrs(addrs: any[]): string[] {
  if (!addrs) return [];
  return addrs.map(a => a.Name ? `${a.Name} <${a.Mailbox}@${a.Host}>` : `${a.Mailbox}@${a.Host}`);
}

export function generateQuote(
  type: 'reply' | 'replyAll' | 'forward',
  message: any,
  textBody: string,
  rawMessageHtml: string | null,
  hasHtml: boolean,
  dateFormat: string = 'YYYY-MM-DD',
  hourFormat: string = '12'
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
    const replyTo = message?.Envelope?.ReplyTo;
    const from = message?.Envelope?.From;
    const parsedFrom = formatAddrs(replyTo && replyTo.length > 0 ? replyTo : from);
    to = [...parsedFrom];
    
    if (type === 'replyAll') {
      const originalTo = formatAddrs(message?.Envelope?.To) || [];
      const originalCc = formatAddrs(message?.Envelope?.Cc) || [];
      const allTo = new Set([...to, ...originalTo]);
      to = Array.from(allTo);
      cc = [...originalCc];
    }
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
  // or fetches on the RECIPIENT's behalf. Without it, replying makes our user a
  // carrier: the reader blocks remote images so the sender cannot learn the mail
  // was read, and quoting the pixel unmodified re-arms it in the outgoing copy,
  // under our user's name. Scripts and `on*` handlers ride out the same way.
  const safeHtml = hasHtml && rawMessageHtml ? sanitizeQuotedHTML(rawMessageHtml) : '';

  let quotedHtml = '';
  if (safeHtml) {
    if (type === 'forward') {
      const toStrs = escapeHtml(formatAddrs(message?.Envelope?.To).join(', '));
      quotedHtml = `<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>From: ${eSenderName} &lt;${eSenderAddress}&gt;<br>Date: ${eDate}<br>Subject: ${eSubject}<br>To: ${toStrs}<br></div><br>${safeHtml}</div>`;
    } else {
      quotedHtml = `<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">On ${eDate}, ${eSenderName} wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${safeHtml}</blockquote></div>`;
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
