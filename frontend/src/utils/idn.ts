/**
 * How a domain is read: in Unicode where that is safe, in its A-label
 * (`xn--…`) form where it is not.
 *
 * A domain can be written in any script, and some letters of one script look
 * exactly like letters of another: `pаypal.com` with a Cyrillic `а` is not
 * `paypal.com`, and nothing on screen says so. Each label is shown in Unicode
 * only when it keeps to one script (or to one of the combinations that CJK
 * writing uses every day), the "highly restrictive" level of UTS #39, as
 * browsers do for the address bar. A label that mixes scripts is shown in its
 * A-label form, which cannot pass for anything else, and is flagged.
 *
 * A label written in one script that imitates a word of another (an all
 * Cyrillic `аррӏе`) is not caught here: it mixes nothing, and telling it from
 * a real word of its own language needs a list of confusable words, which
 * this does not keep.
 */

/**
 * The domain in its A-label form, lower case, without a trailing dot, or null
 * when it is not a domain name: no dot, an address literal, an underscore, an
 * IDN that does not convert.
 *
 * The URL parser does the conversion (UTS #46, as the browser does for a host
 * it is asked to open), and the result is held to letters, digits and
 * hyphens. A host the parser read as an IPv4 address is refused too: it
 * rewrites `0x7f.1` as `127.0.0.1`, which is not what was written, and a
 * mail domain whose last label is a number is not a domain name anyway.
 */
export function canonicalDomain(raw: string): string | null {
  if (!raw || /[\s/\\?#:@%\[\]]/u.test(raw)) return null;
  try {
    const host = new URL(`http://${raw}`).hostname.replace(/\.$/, '').toLowerCase();
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
    return host.length <= 253 && /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/.test(host) ? host : null;
  } catch {
    return null;
  }
}

/**
 * An A-label in Unicode, or the label unchanged when it is not one or does not
 * decode (RFC 3492). Bounded by the DNS label length and by the Unicode scalar
 * range, so a hostile label cannot make it loop or throw.
 *
 * A decoding that does not encode back to the same label is refused too: the
 * same letters can be spelled as more than one punycode string, and only the
 * canonical spelling is the domain it seems to be.
 */
export function toUnicodeLabel(label: string): string {
  if (!label.startsWith('xn--') || label.length > 63) return label;
  const encoded = label.slice(4);
  const delimiter = encoded.lastIndexOf('-');
  const out = delimiter < 0 ? [] : Array.from(encoded.slice(0, delimiter), ch => ch.charCodeAt(0));
  let pos = delimiter < 0 ? 0 : delimiter + 1;
  let n = 128;
  let i = 0;
  let bias = 72;
  try {
    while (pos < encoded.length) {
      const old = i;
      let weight = 1;
      for (let k = 36; ; k += 36) {
        if (pos >= encoded.length) return label;
        const code = encoded.charCodeAt(pos++);
        const digit = code >= 97 && code <= 122 ? code - 97 : code >= 48 && code <= 57 ? code - 22 : 36;
        if (digit >= 36 || !Number.isSafeInteger(i + digit * weight)) return label;
        i += digit * weight;
        const threshold = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
        if (digit < threshold) break;
        weight *= 36 - threshold;
      }
      let delta = Math.floor((i - old) / (old === 0 ? 700 : 2));
      delta += Math.floor(delta / (out.length + 1));
      let k = 0;
      while (delta > 455) {
        delta = Math.floor(delta / 35);
        k += 36;
      }
      bias = k + Math.floor(36 * delta / (delta + 38));
      n += Math.floor(i / (out.length + 1));
      i %= out.length + 1;
      if (n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) return label;
      out.splice(i++, 0, n);
    }
    const decoded = String.fromCodePoint(...out);
    return canonicalDomain(`${decoded}.example`) === `${label}.example` ? decoded : label;
  } catch {
    return label;
  }
}

const SCRIPTS = [
  'Latin', 'Cyrillic', 'Greek', 'Han', 'Hiragana', 'Katakana', 'Bopomofo', 'Hangul', 'Arabic', 'Hebrew',
  'Devanagari', 'Bengali', 'Thai', 'Armenian', 'Georgian', 'Tamil', 'Telugu', 'Gujarati', 'Gurmukhi',
  'Kannada', 'Malayalam', 'Sinhala', 'Lao', 'Khmer', 'Myanmar', 'Ethiopic',
] as const;
const SCRIPT_MATCHERS = SCRIPTS.map(script => [script, new RegExp(`\\p{Script_Extensions=${script}}`, 'u')] as const);

/**
 * The script one character is written in, or null for one that belongs to
 * every script: a digit, punctuation, a symbol, a combining mark. Anything
 * outside the scripts listed is 'other', which no label may contain.
 */
export function scriptOf(rune: string): string | null {
  if (/[\p{Number}\p{Punctuation}\p{Symbol}]/u.test(rune)) return null;
  return SCRIPT_MATCHERS.find(([, pattern]) => pattern.test(rune))?.[0] ?? (/\p{Mark}/u.test(rune) ? null : 'other');
}

/**
 * Whether a label (or a local part) keeps to one script, or to one of the
 * mixes of Latin with Chinese, Japanese or Korean writing that UTS #39 allows
 * at its "highly restrictive" level.
 */
export function isHighlyRestrictive(label: string): boolean {
  // Format controls (including bidi overrides) and spaces are never
  // decoration: they are what makes two different strings look the same.
  if (/[\p{Cc}\p{Cf}\p{Z}]/u.test(label)) return false;
  const used = new Set(Array.from(label.normalize('NFC'), scriptOf).filter((s): s is string => s !== null));
  if (used.has('other')) return false;
  if (used.size <= 1) return true;
  return [
    ['Latin', 'Han', 'Hiragana', 'Katakana'],
    ['Latin', 'Han', 'Bopomofo'],
    ['Latin', 'Han', 'Hangul'],
  ].some(allowed => [...used].every(script => allowed.includes(script)));
}

/** The label separators UTS #46 reads as a full stop. */
const LABEL_SEPARATOR = /[.。．｡]/;

/**
 * Whether `domain` is `ascii` as written: label for label, either its A-label
 * or its Unicode form, in any case and any Unicode normalization.
 *
 * The conversion to an A-label does more than encode: it maps compatibility
 * characters to the letters they resemble, so a circled `ⓔ` or a full-width
 * `ｅ` comes out as a plain `e`. `ⓔxample.com` converts to `example.com`, and
 * shown converted it would read as the domain it imitates, its one visible
 * oddity gone.
 */
function writtenAs(domain: string, ascii: string): boolean {
  const written = domain.replace(new RegExp(`${LABEL_SEPARATOR.source}$`), '').split(LABEL_SEPARATOR);
  const labels = ascii.split('.');
  return written.length === labels.length && written.every((label, i) => {
    const folded = label.toLowerCase().normalize('NFC');
    return folded === labels[i] || folded === toUnicodeLabel(labels[i]!);
  });
}

/** What {@link domainPresentation} can warn about a domain. */
export type DomainWarning = 'mixed-script-domain' | 'unusual-domain';

/**
 * A domain as a person should read it: each label in Unicode unless it fails
 * the mixed-script check, which leaves it in A-label form and warns.
 *
 * A domain that has no A-label to check (no dot, an address literal, an
 * underscore) is shown as written. In printable ASCII it gets no warning:
 * every character is the one it looks like, so it can imitate nothing.
 * Anything else (a non-ASCII letter, a bidi override, an invisible control, a
 * letter the conversion would map to another) is an UNUSUAL domain rather
 * than a mixed-script one: it may mix nothing, but nothing here could check
 * it, and it is not the domain name it looks like.
 */
export function domainPresentation(domain: string): { text: string; ascii: string; warning: DomainWarning | null } {
  const ascii = canonicalDomain(domain);
  if (ascii === null || !writtenAs(domain, ascii)) {
    const plain = /^[\x20-\x7e]*$/.test(domain);
    return { text: domain, ascii: domain, warning: plain ? null : 'unusual-domain' };
  }
  let warning: DomainWarning | null = null;
  const text = ascii.split('.').map(label => {
    const unicode = toUnicodeLabel(label);
    if (!isHighlyRestrictive(unicode)) {
      warning = 'mixed-script-domain';
      return label;
    }
    return unicode;
  }).join('.');
  return { text, ascii, warning };
}

/**
 * The address with its domain in A-label form, for sending, or null when it
 * is not a single `local@domain` whose domain converts as written. The local
 * part is left as it is: it has no other spelling.
 */
export function canonicalAddress(address: string): string | null {
  if (/[\s<>\p{Cc}\p{Cf}]/u.test(address) || address.length > 320) return null;
  const parts = address.split('@');
  if (parts.length !== 2 || !parts[0]) return null;
  const domain = canonicalDomain(parts[1]!);
  return domain === null || !writtenAs(parts[1]!, domain) ? null : `${parts[0]}@${domain}`;
}
