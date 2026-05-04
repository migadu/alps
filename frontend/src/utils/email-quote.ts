import { formatFullDate } from './ui';

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

  let quotedHtml = '';
  if (hasHtml && rawMessageHtml) {
    if (type === 'forward') {
      const toStrs = formatAddrs(message?.Envelope?.To).join(', ');
      quotedHtml = `<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>From: ${senderName} &lt;${senderAddress}&gt;<br>Date: ${dateStr}<br>Subject: ${originalSubject}<br>To: ${toStrs}<br></div><br>${rawMessageHtml}</div>`;
    } else {
      quotedHtml = `<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">On ${dateStr}, ${senderName} wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${rawMessageHtml}</blockquote></div>`;
    }
  } else {
    quotedHtml = `<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">${quoteHeader.replace(/\n/g, '<br>')}<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${textBody.replace(/\n/g, '<br>')}</blockquote></div>`;
  }

  return { subject, to, cc, quotedText, quotedHtml };
}
