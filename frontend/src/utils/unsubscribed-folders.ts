/**
 * The folders the user unsubscribed from HERE, kept with the account's
 * settings as `unsubscribedFolders`.
 *
 * The sidebar puts an unsubscribed folder behind its More row, and the
 * server's subscription list cannot say on its own which folders those are.
 * It also holds every folder unsubscribed in another client, where the user
 * chose what that client shows and not what this one does, and every folder
 * created on a server that does not subscribe on CREATE: until alps asked for
 * the subscription itself, that was every folder ever made here. Taken at its
 * word, the list would have emptied the sidebar into More the day it was read.
 *
 * So alps keeps its own list of the folders unsubscribed through its folder
 * menu, and a folder goes behind More only when it is on this list AND the
 * server still lists it unsubscribed. Subscribing here takes it off the list.
 * Subscribing elsewhere brings it back as well, since the server's word is
 * half the rule, and the entry is dropped the next time a listing shows the
 * folder subscribed, so that unsubscribing it in that other client later does
 * not send it behind More here. A rename here carries the entries of the
 * folder and of everything under it to their new names; a delete, and a move
 * to Trash, drops them.
 *
 * The list is a set kept in order, oldest first, under the server's caps:
 * {@link MAX_UNSUBSCRIBED_FOLDERS} names, {@link MAX_UNSUBSCRIBED_FOLDERS_BYTES}
 * between them. A list past them keeps its newest names.
 */
import { isSelfOrDescendantMailbox } from './folders';

/** As `maxUnsubscribedFolders` in the server's settings check. */
export const MAX_UNSUBSCRIBED_FOLDERS = 200;
/** As `maxUnsubscribedFoldersBytes` there: UTF-8 bytes, all names together. */
export const MAX_UNSUBSCRIBED_FOLDERS_BYTES = 16 * 1024;

const encoder = new TextEncoder();

/**
 * `list` as the server takes it: each name once, at its latest place, and the
 * newest names that fit the caps. A name too long to fit at all is left out
 * rather than taking every older one with it.
 */
export function capUnsubscribedFolders(list: readonly string[]): string[] {
  const kept: string[] = [];
  const seen = new Set<string>();
  let bytes = 0;
  for (let i = list.length - 1; i >= 0 && kept.length < MAX_UNSUBSCRIBED_FOLDERS; i--) {
    const name = list[i];
    if (typeof name !== 'string' || !name || seen.has(name)) continue;
    const size = encoder.encode(name).length;
    if (bytes + size > MAX_UNSUBSCRIBED_FOLDERS_BYTES) continue;
    seen.add(name);
    bytes += size;
    kept.push(name);
  }
  return kept.reverse();
}

/** `list` with `name` added, as the newest entry. */
export function withUnsubscribedFolder(list: readonly string[], name: string): string[] {
  return capUnsubscribedFolders([...list.filter(n => n !== name), name]);
}

/** `list` without `name`. The folders under it keep their own entries: a
 * subscription is one folder's. */
export function withoutUnsubscribedFolder(list: readonly string[], name: string): string[] {
  return list.filter(n => n !== name);
}

/** `list` without `name` and every folder under it, for a folder that is gone. */
export function forgetUnsubscribedTree(list: readonly string[], name: string, delimiter?: string): string[] {
  return list.filter(n => !isSelfOrDescendantMailbox(n, name, delimiter));
}

/** `list` after `from` was renamed to `to`: its entry, and those of the
 * folders under it, under their new names. */
export function renameUnsubscribedTree(list: readonly string[], from: string, to: string, delimiter?: string): string[] {
  return capUnsubscribedFolders(list.map(n => (isSelfOrDescendantMailbox(n, from, delimiter) ? to + n.slice(from.length) : n)));
}

const listedName = (mb: any): string => mb?.Name || mb?.Mailbox || '';

/**
 * Takes out of `unconfirmed` the names that `mailboxes` lists unsubscribed.
 *
 * `unconfirmed` holds the folders just unsubscribed here, until a listing
 * bears that out. A listing asked for before the UNSUBSCRIBE, or a server
 * cache filled just before it, can still answer afterwards with the folder
 * subscribed, and read as "subscribed again elsewhere" that would drop the
 * entry the gesture had just written.
 */
export function confirmUnsubscribed(unconfirmed: Set<string>, mailboxes: readonly any[]): void {
  if (unconfirmed.size === 0) return;
  for (const mb of mailboxes || []) {
    const name = listedName(mb);
    if (unconfirmed.has(name) && mb.Subscribed !== true) unconfirmed.delete(name);
  }
}

/**
 * `list` without the folders `mailboxes` lists subscribed, other than those
 * still `unconfirmed`. A folder the listing does not show keeps its entry: a
 * listing that is short of a folder is no proof that it is gone.
 */
export function settleUnsubscribedFolders(list: readonly string[], mailboxes: readonly any[], unconfirmed: ReadonlySet<string>): string[] {
  const subscribed = new Set<string>();
  for (const mb of mailboxes || []) {
    if (mb?.Subscribed === true) subscribed.add(listedName(mb));
  }
  return list.filter(n => unconfirmed.has(n) || !subscribed.has(n));
}
