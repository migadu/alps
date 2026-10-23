/**
 * An edit left unsaved on a page with a Save of its own, kept for the page's
 * next visit.
 *
 * The settings page makes the Auto-reply and Filters pages anew each time it
 * shows them, so leaving one, by the browser's Back or any other way, threw
 * its unsaved edit away without a word, and coming back, Forward included,
 * showed the server's copy again. A page keeps its edit here when it goes,
 * over the server's copy it was made on, and takes it back when it has read
 * the server again: only if that copy is the same, as an edit laid over a copy
 * changed since, from another tab or another client, would undo that change
 * once saved.
 *
 * In memory only, and forgotten when the session ends: the next account to
 * sign in is not shown it.
 */
export class UnsavedEdit<T> {
	private kept: { base: string; edit: T } | null = null;

	constructor() {
		window.addEventListener('session-cleared', () => {
			this.kept = null;
		});
	}

	/** Keeps `edit`, made on the server's copy `base`. */
	keep(base: string, edit: T): void {
		this.kept = { base, edit };
	}

	forget(): void {
		this.kept = null;
	}

	/** The edit kept on `base`, once: null when none was, or it was made on another copy. */
	take(base: string): T | null {
		const kept = this.kept;
		this.kept = null;
		return kept && kept.base === base ? kept.edit : null;
	}
}
