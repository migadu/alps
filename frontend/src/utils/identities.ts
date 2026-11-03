import { canonicalAddress } from './idn';
import { stripBidiControls } from './bidi';

/**
 * The other addresses the user sends from: an alias, or an address of their
 * own elsewhere that their mail server lets them send as. They are kept in
 * the account's settings, and the composer offers them beside the account's
 * own address. The server takes a message from one of them, or from the
 * account, and from no other address; the mail server has the last word.
 */
export interface Identity {
  /** The display name a message from it goes out under; empty is the
   * account's own display name. */
  name: string;
  address: string;
}

/** The server's caps (plugins/base, checkIdentities): how many there may be,
 * and how long a name and an address may be, in characters. */
export const MAX_IDENTITIES = 20;
export const MAX_IDENTITY_NAME = 256;
export const MAX_IDENTITY_ADDRESS = 254;

/** The letters a dot-atom local part is written in (RFC 5322, atext). */
const LOCAL_PART = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;

/** Two spellings of one address: its domain in A-label form, and either case. */
const keyOf = (address: string): string => (canonicalAddress(address.trim()) ?? address.trim()).toLowerCase();

/** Whether `a` and `b` are the same address. */
export function sameAddress(a: string, b: string): boolean {
  return !!a && !!b && keyOf(a) === keyOf(b);
}

/**
 * `raw` as an identity's address, its domain in A-label form, or null when it
 * is not one bare address. A local part is held to what the server reads
 * without quoting, so nothing this takes is refused there.
 */
export function identityAddress(raw: string): string | null {
  const canonical = canonicalAddress(raw.trim());
  if (!canonical || [...canonical].length > MAX_IDENTITY_ADDRESS) return null;
  return LOCAL_PART.test(canonical.slice(0, canonical.lastIndexOf('@'))) ? canonical : null;
}

/** Why an address cannot be added beside `others`, or null when it can. */
export type IdentityProblem = 'invalid' | 'own' | 'duplicate';

export function identityProblem(raw: string, own: string, others: readonly Identity[]): IdentityProblem | null {
  const address = identityAddress(raw);
  if (!address) return 'invalid';
  if (sameAddress(address, own)) return 'own';
  if (others.some((other) => sameAddress(other.address, address))) return 'duplicate';
  return null;
}

/** The identities the settings record holds, as far as they read as identities. */
export function identitiesFrom(value: unknown): Identity[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is { name?: unknown; address: string } => !!entry && typeof entry.address === 'string' && !!entry.address)
    .map((entry) => ({ name: typeof entry.name === 'string' ? entry.name : '', address: entry.address }));
}

/** The identity `address` names, if it is one. */
export function findIdentity(identities: readonly Identity[] | undefined, address: string | undefined): Identity | null {
  if (!address) return null;
  return identities?.find((identity) => sameAddress(identity.address, address)) ?? null;
}

/**
 * A sender as one line of plain text, `Name <address>`, the name and the
 * address each in an isolate: a menu's option holds text alone, and a name
 * in another direction, or an override in it, would otherwise carry the
 * address with it (see utils/bidi). The name's own direction controls go, so
 * none can close the isolate early.
 */
export function senderLabel(name: string, address: string): string {
  const ltrAddress = `\u2066${address}\u2069`;
  const clean = stripBidiControls(name).trim();
  return clean ? `\u2068${clean}\u2069 <${ltrAddress}>` : ltrAddress;
}

/** An envelope address as the reader holds one. */
interface EnvelopeAddress {
  Mailbox?: string;
  Host?: string;
}

const envelopeAddress = (a: EnvelopeAddress | undefined): string =>
  a?.Mailbox && a?.Host ? `${a.Mailbox}@${a.Host}` : '';

/**
 * The identity a reply to, or a forward of, a message starts from: the one
 * the message was sent from, as a message the user sent is answered from the
 * address it left from, else the first one it was addressed to, in To and
 * then in Cc. The account's own address, met first, is the account, which is
 * no identity at all: undefined, as for a message that names none of them.
 */
export function senderForMessage(
  envelope: { From?: EnvelopeAddress[]; To?: EnvelopeAddress[]; Cc?: EnvelopeAddress[] } | undefined,
  own: string,
  identities: readonly Identity[] | undefined,
): string | undefined {
  if (!envelope || !identities?.length) return undefined;
  for (const address of [envelope.From?.[0], ...(envelope.To ?? []), ...(envelope.Cc ?? [])].map(envelopeAddress)) {
    if (!address) continue;
    if (sameAddress(address, own)) return undefined;
    const identity = findIdentity(identities, address);
    if (identity) return identity.address;
  }
  return undefined;
}
