import PostalMime from 'postal-mime';
import type { Address } from 'postal-mime';

/** One mailbox of an address header, as written. */
export interface HeaderMailbox {
  name: string;
  email: string;
}

export interface ParsedHeaders {
  messageId: string;
  date: string;
  /** One entry per mailbox, so each name and address can be shown isolated. */
  from: HeaderMailbox[];
  to: HeaderMailbox[];
  subject: string;
  spf: string;
  spfDetail: string;
  dkim: string;
  dkimDetail: string;
  dmarc: string;
  dmarcDetail: string;
  fromAddress: string;
  bimiSelector: string;
  hasBimiPotential: boolean;
}

/** The mailboxes of an address list, a group's members in its place. */
function mailboxesOf(addresses: Address[] | undefined): HeaderMailbox[] {
  return (addresses ?? []).flatMap((a) => a.group ?? [a]).map((m) => ({ name: m.name, email: m.address }));
}

export async function parseEmailHeaders(rawEmail: string): Promise<ParsedHeaders> {
  const parser = new PostalMime();
  const email = await parser.parse(rawEmail);

  let bimiSelector = 'default';
  const bimiHeader = email.headers?.find(h => h.key.toLowerCase() === 'bimi-selector');
  if (bimiHeader) {
    const sMatch = bimiHeader.value.match(/s=([^;\s]+)/i);
    if (sMatch) {
      bimiSelector = sMatch[1].trim();
    }
  }

  const fromAddress = email.from?.address || '';

  const result: ParsedHeaders = {
    messageId: email.messageId || '',
    date: email.date || '',
    from: mailboxesOf(email.from ? [email.from] : []),
    fromAddress,
    to: mailboxesOf(email.to),
    subject: email.subject || '',
    spf: 'none',
    spfDetail: '',
    dkim: 'none',
    dkimDetail: '',
    dmarc: 'none',
    dmarcDetail: '',
    bimiSelector,
    hasBimiPotential: false,
  };

  // postal-mime exposes all headers as an array of objects
  const authHeaders = email.headers?.filter(h => h.key.toLowerCase() === 'authentication-results') || [];
  if (authHeaders.length > 0) {
    const authHeader = authHeaders[0]; // Process the top-most (most recent) header
    const fullHeader = authHeader.value.toLowerCase();
    
    let spfIp = '';
    const ipMatch = fullHeader.match(/smtp\.(?:remote|client)-ip=([0-9a-f\.:]+)/) || fullHeader.match(/designates ([0-9a-f\.:]+) as permitted sender/);
    if (ipMatch) spfIp = ipMatch[1];

    const parts = authHeader.value.split(';');
    for (const part of parts) {
      const p = part.trim().toLowerCase();
      if (p.startsWith('spf=')) {
        result.spf = p.split('=')[1].split(' ')[0];
        if (spfIp) {
          result.spfDetail = `with IP address ${spfIp}`;
        } else {
          const fromMatch = p.match(/smtp\.mailfrom=([^ \t]+)/) || p.match(/smtp\.helo=([^ \t]+)/);
          if (fromMatch) result.spfDetail = `with ${fromMatch[1]}`;
        }
      } else if (p.startsWith('dkim=')) {
        result.dkim = p.split('=')[1].split(' ')[0];
        const dMatch = p.match(/header\.d=([^ \t]+)/);
        if (dMatch) result.dkimDetail = `with domain ${dMatch[1]}`;
      } else if (p.startsWith('dmarc=')) {
        result.dmarc = p.split('=')[1].split(' ')[0];
        const fromMatch = p.match(/header\.from=([^ \t]+)/);
        if (fromMatch) result.dmarcDetail = `with domain ${fromMatch[1]}`;
      }
    }
  }

  result.hasBimiPotential = result.dmarc === 'pass' && !!result.fromAddress;

  return result;
}
