/**
 * A sign-out's flush could not store every open composer on the server.
 *
 * By the time this is thrown, the composers that could not be stored are
 * still open and their copy is on disk under the account's own key. What
 * happens next is the caller's decision, and neither answer may cost the user
 * the draft:
 *
 *  - Staying signed in (the user cancelled): nothing to do, the windows are
 *    still on screen.
 *  - Signing out anyway (the idle timeout, which always completes, or a user
 *    who confirmed): call {@link keepRecoveryCopy} first. A sign-out otherwise
 *    erases the stored drafts with the session, which is right for the drafts
 *    the flush stored and loses the ones it could not.
 */
export class DraftFlushError extends Error {
  private readonly keep?: () => void;

  constructor(keep?: () => void) {
    super('Drafts could not be saved before signing out');
    this.name = 'DraftFlushError';
    this.keep = keep;
  }

  /** Leaves the unsaved drafts on this device for the same account's next
   * sign-in, instead of erasing them with the session. */
  keepRecoveryCopy(): void {
    this.keep?.();
  }
}
