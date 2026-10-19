import { html } from 'lit';

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

/** An address, laid out left to right in an isolate. */
export function isolatedEmail(email: string) {
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

/**
 * The text with its explicit direction controls removed, for a name or an
 * address that goes into plain text, where no isolate can contain them.
 * Right-to-left letters stay as they are.
 */
export function stripBidiControls(value: string): string {
  return value.replace(/\p{Bidi_Control}/gu, '');
}
