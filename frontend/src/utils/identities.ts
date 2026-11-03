import { canonicalAddress } from './idn';

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
