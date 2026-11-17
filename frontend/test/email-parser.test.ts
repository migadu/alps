/**
 * The headers the original-message page reads out of a raw message.
 */
import { describe, expect, it } from 'vitest';
import { parseEmailHeaders } from '../src/utils/email-parser';

const message = (authenticationResults: string) => [
  `Authentication-Results: ${authenticationResults}`,
  'From: Sender <sender@example.com>',
  'To: you@example.com',
  'Subject: Hello',
  'Message-ID: <1@example.com>',
  '',
  'Body',
  '',
].join('\r\n');

describe('the Authentication-Results header', () => {
  it('reads each verdict from a header folded onto several lines', async () => {
    const parsed = await parseEmailHeaders(message([
      'mx.example.net;',
      '\tspf=pass\tsmtp.mailfrom=sender@example.com;',
      '\tdkim=pass\theader.d=example.com;',
      '\tdmarc=pass\theader.from=example.com',
    ].join('\r\n')));
    expect(parsed.spf).toBe('pass');
    expect(parsed.spfDetail).toBe('with sender@example.com');
    expect(parsed.dkim).toBe('pass');
    expect(parsed.dkimDetail).toBe('with domain example.com');
    expect(parsed.dmarc).toBe('pass');
    expect(parsed.dmarcDetail).toBe('with domain example.com');
    expect(parsed.hasBimiPotential).toBe(true);
  });

  it('finds the SPF client address where a fold falls inside the explanation', async () => {
    const parsed = await parseEmailHeaders(message([
      'mx.example.net; spf=pass (example.net: domain of sender@example.com designates',
      '\t192.0.2.1 as permitted sender) smtp.mailfrom=sender@example.com',
    ].join('\r\n')));
    expect(parsed.spf).toBe('pass');
    expect(parsed.spfDetail).toBe('with IP address 192.0.2.1');
  });
});
