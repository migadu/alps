import { css, html } from 'lit';
import { en } from '../i18n/en';
import { isolatedEmail } from './bidi';
import { canonicalAddress, domainPresentation, isHighlyRestrictive, type DomainWarning } from './idn';

/**
 * An address as a person reads it, and the warning beside one that may not be
 * what it looks like.
 *
 * Only the DISPLAY changes. A pill's title, the address a click on it writes
 * to and the address a reply goes to all keep the spelling the message
 * carried, so nothing is ever sent somewhere other than where the mail came
 * from.
 */

/** What {@link addressWarnings} can report. Each kind has its own words in
 * `wordsFor`, which fails the typecheck for a kind it cannot word. */
export type AddressWarning = 'directional-control' | 'mixed-script-local' | DomainWarning;

const BIDI_CONTROLS = /\p{Bidi_Control}/gu;

/**
 * Every warning an address raises, the most telling first: a direction
 * control anywhere in it, a local part that mixes alphabets, then whatever
 * the domain raises. The label beside the address names the first; its
 * tooltip explains them all.
 *
 * Each half is judged without its direction controls, which the first reason
 * already names: a control is all that makes `exa<U+202E>mple.test` unusual,
 * and `user<U+202E>` is all one alphabet.
 */
export function addressWarnings(address: string): AddressWarning[] {
  const out: AddressWarning[] = [];
  if (/\p{Bidi_Control}/u.test(address)) out.push('directional-control');
  const at = address.lastIndexOf('@');
  if (at < 0) return out;
  if (!isHighlyRestrictive(address.slice(0, at).replace(BIDI_CONTROLS, ''))) out.push('mixed-script-local');
  const domain = domainPresentation(address.slice(at + 1).replace(BIDI_CONTROLS, '')).warning;
  if (domain) out.push(domain);
  return out;
}

/**
 * The address as it should be read, its domain's A-label form, and the first
 * warning it raises. A domain that mixes scripts reads as its A-label; any
 * other internationalized domain in Unicode, whichever way it arrived.
 */
export function displayAddress(address: string): { text: string; ascii: string; warning: AddressWarning | null } {
  const warning = addressWarnings(address)[0] ?? null;
  const at = address.lastIndexOf('@');
  if (at < 0) return { text: address, ascii: address, warning };
  const local = address.slice(0, at);
  const domain = domainPresentation(address.slice(at + 1));
  return { text: `${local}@${domain.text}`, ascii: `${local}@${domain.ascii}`, warning };
}

/**
 * A recipient pill (`Name <address>`, `"Name" <address>` or a bare address)
 * split into the name and the address exactly as they were typed.
 */
export function parseWrittenAddress(pill: string): { name: string; email: string } {
  const trimmed = pill.trim();
  if (trimmed.endsWith('>')) {
    const lt = trimmed.lastIndexOf('<');
    if (lt !== -1) {
      const email = trimmed.slice(lt + 1, -1).trim();
      const name = trimmed.slice(0, lt).trim().replace(/^["']|["']$/g, '').trim();
      return { name, email };
    }
  }
  return { name: '', email: trimmed };
}

/**
 * A recipient pill as it is sent: the address's domain in A-label form, the
 * rest as typed.
 *
 * The A-label is the domain's own spelling in DNS, and it is plain ASCII, so a
 * mail server that does not take internationalized addresses (SMTPUTF8) still
 * takes `ada@bücher.example` as `ada@xn--bcher-kva.example`. An address that
 * does not convert is sent as typed, for the server to judge.
 */
export function canonicalRecipient(pill: string): string {
  const trimmed = pill.trim();
  const lt = trimmed.endsWith('>') ? trimmed.lastIndexOf('<') : -1;
  const email = lt === -1 ? trimmed : trimmed.slice(lt + 1, -1).trim();
  const canonical = canonicalAddress(email);
  if (canonical === null || canonical === email) return trimmed;
  return lt === -1 ? canonical : `${trimmed.slice(0, lt + 1)}${canonical}>`;
}

/**
 * The address to show, left to right in an isolate of its own, with each
 * letter from another alphabet in a mixed-script local part marked.
 *
 * The letters stay marked when a direction control is the first reason to
 * warn: the label names only one reason, and the marks are how the other
 * shows.
 */
export function addressText(address: string) {
  const display = displayAddress(address);
  const at = display.text.lastIndexOf('@');
  if (!addressWarnings(address).includes('mixed-script-local')) return isolatedEmail(display.text);
  const local = Array.from(display.text.slice(0, at), ch =>
    /[^\x00-\x7f]/.test(ch) && !/\p{Bidi_Control}/u.test(ch) ? html`<mark class="mixed-script">${ch}</mark>` : ch);
  return isolatedEmail(html`${local}${display.text.slice(at)}`);
}

/**
 * The look of the letters {@link addressText} marks and of the label
 * {@link addressWarning} renders, for every component that renders either:
 * add it to `static styles`.
 *
 * One sheet, because the cue is one fact: styled in each shadow root on its
 * own, the same warning would look different in the reader, the list and the
 * composer, and a bare `<mark>` left to the browser is a fixed yellow in every
 * theme. The class keeps any other `mark` rule off it.
 *
 * The ground is the theme's warning colour mixed into its background, so it
 * is a pale tint in a light theme and a dark one in a dark theme, and the
 * text keeps its own colour on both. The label is isolated so that a
 * direction control in the address before it cannot reorder its words.
 */
export const mixedScriptStyles = css`
  .address-warning {
    unicode-bidi: isolate;
    margin-inline-start: .35em;
    font-size: .85em;
    white-space: nowrap;
  }
  mark.mixed-script {
    background: color-mix(in srgb, var(--warning, #f59e0b) 25%, var(--bg-primary, #ffffff));
    color: inherit;
    text-decoration: underline;
  }
`;

/** Just enough of the i18n store to word the warning, so a caller with no
 * store to hand still gets the English words. */
interface Translator {
  t(key: string, params?: Record<string, unknown>): string;
}

/** `{name}` placeholders filled by a replacer function, never a replacement
 * STRING: an address may carry `$&` or `$'`, which a string would expand. */
function fill(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => params[key] ?? match);
}

/**
 * The label and the tooltip for each kind of warning.
 *
 * A switch with no default under a declared return type, so a kind added to
 * {@link AddressWarning} without words of its own fails the typecheck rather
 * than borrowing another kind's, which would say something untrue of it.
 */
function wordsFor(kind: AddressWarning, i18n?: Translator): { label: string; tooltip: string } {
  switch (kind) {
    case 'directional-control':
      return {
        label: i18n?.t('address.directionalControl') ?? en.address.directionalControl,
        tooltip: i18n?.t('address.directionalControlTooltip') ?? en.address.directionalControlTooltip,
      };
    case 'mixed-script-local':
    case 'mixed-script-domain':
      return {
        label: i18n?.t('address.mixedScript') ?? en.address.mixedScript,
        tooltip: i18n?.t('address.mixedScriptTooltip') ?? en.address.mixedScriptTooltip,
      };
    case 'unusual-domain':
      return {
        label: i18n?.t('address.unusualDomain') ?? en.address.unusualDomain,
        tooltip: i18n?.t('address.unusualDomainTooltip') ?? en.address.unusualDomainTooltip,
      };
  }
}

/**
 * The warning beside an address, in the reader's language, or nothing.
 *
 * `address` is the address AS WRITTEN, which is what lets the tooltip say
 * something true. The label names the first reason; the tooltip explains each
 * of them, one line apiece, since one explanation would leave the rest unsaid
 * (a mixed-script local part in front of an unusual domain). For a domain that
 * mixes scripts it adds the domain's A-label, but only when the address was
 * not written that way already, where it would name the same domain twice.
 */
export function addressWarning(address: string, i18n?: Translator) {
  const kinds = addressWarnings(address);
  if (!kinds.length) return '';
  const label = wordsFor(kinds[0]!, i18n).label;
  // Each reason once: the two mixed-script kinds share their words.
  const lines = [...new Set(kinds.map(kind => wordsFor(kind, i18n).tooltip))];
  // The DOMAIN, whichever warning came first: a direction control outranks a
  // mixed-script domain, which still deserves its A-label. An unusual domain
  // has none to name.
  const written = address.slice(address.lastIndexOf('@') + 1).replace(BIDI_CONTROLS, '');
  const domain = domainPresentation(written);
  if (domain.warning === 'mixed-script-domain' && written.toLowerCase() !== domain.ascii) {
    const params = { domain: written, ascii: domain.ascii };
    lines.push(i18n?.t('address.mixedScriptAscii', params) ?? fill(en.address.mixedScriptAscii, params));
  }
  return html`<span class="address-warning" title=${lines.join('\n')}>⚠ ${label}</span>`;
}
