import { html, type TemplateResult } from 'lit';

/**
 * Names and addresses, each in a bidi isolate of its own.
 *
 * A display name is whatever the sender wrote, and an RFC 2047 encoded word
 * can carry any character, a direction override such as U+202E among them.
 * An override applies to the rest of its paragraph, so a name shown as plain
 * text beside an address, a status or another name reversed everything after
 * it: `Pay<U+202E>ments <ada@example.com>, Bob` read backwards from the name
 * on. In an isolate it ends where the name does.
 *
 * A name takes the direction of its own first letter. An address is always
 * left to right, as it is written: a Hebrew or Arabic local part would
 * otherwise put the domain first.
 */

/** An address, laid out left to right in an isolate. A template stands in for
 * the text where some of its letters are marked (see address-display.ts). */
export function isolatedEmail(email: string | TemplateResult) {
  return html`<bdi dir="ltr">${email}</bdi>`;
}

/** A name, or the address when there is none, for a line that goes on after it. */
export function isolatedCaption(name: string | null | undefined, email: string) {
  return name ? html`<bdi>${name}</bdi>` : isolatedEmail(email);
}

/**
 * `Name <address>` as written, the name and the address each isolated, or
 * the address alone. The angle brackets are template text: inside a binding
 * an entity is escaped, and printed as `&lt;` literally.
 */
export function isolatedMailbox(mailbox: { name?: string | null; email: string }) {
  return mailbox.name ? html`<bdi>${mailbox.name}</bdi> &lt;${isolatedEmail(mailbox.email)}&gt;` : isolatedEmail(mailbox.email);
}

/** {@link isolatedMailbox} for each, comma separated. */
export function isolatedMailboxes(mailboxes: { name?: string | null; email: string }[]) {
  return mailboxes.map((mailbox, i) => html`${i ? ', ' : ''}${isolatedMailbox(mailbox)}`);
}

/** Just enough of the i18n store to word a sentence. */
interface Translator {
  t(key: string, params?: Record<string, unknown>): string;
}

/**
 * A translated sentence with an isolated name or address in its placeholders.
 *
 * t() puts a parameter into its sentence as text, and text holds no isolate:
 * a name passed to it ran on into the words after it, so an override in it
 * reversed them, and after an attendee named `Bob<U+202E>` the answer
 * " accepted." read backwards. Here t() is asked for the sentence with each
 * placeholder standing for itself, which leaves it where the language puts
 * it, and each of `parts` (an {@link isolatedCaption} or an
 * {@link isolatedEmail}) takes its place.
 */
export function isolatedSentence(i18n: Translator | undefined, key: string, parts: Record<string, TemplateResult | string>) {
  const placeholders = Object.fromEntries(Object.keys(parts).map((name) => [name, `{${name}}`]));
  const sentence = i18n?.t(key, placeholders) ?? key;
  return sentence.split(/\{(\w+)\}/).map((piece, i) => (i % 2 === 0 ? piece : parts[piece] ?? `{${piece}}`));
}

/**
 * The text with its explicit direction controls removed, for a name or an
 * address that goes into plain text, where no isolate can contain them.
 * Right-to-left letters stay as they are.
 */
export function stripBidiControls(value: string): string {
  return value.replace(/\p{Bidi_Control}/gu, '');
}
