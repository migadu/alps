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
 * once saved. A successful save from this tab advances the baseline: text
 * typed after its snapshot stays unsaved even when that save finishes after
 * leaving. A read that straddles such a write is retried before restoring.
 *
 * In memory only, and forgotten when the session ends: the next account to
 * sign in is not shown it. A visit carries the session generation so a page
 * removed after session teardown cannot put the previous account's edit back.
 */
import { MessageCache } from '../../../frontend/src/utils/message-cache';

export interface EditVisit {
	readonly session: number;
	readonly owner: symbol;
}

export class UnsavedEdit<T> {
	private kept: { base: string; edit: T; owner: symbol } | null = null;
	private session = MessageCache.generation();
	private saved = new Map<string, string>();
	private writes = 0;

	get revision(): number { return this.writes; }

	constructor() {
		window.addEventListener('session-cleared', () => {
			this.kept = null;
			this.saved.clear();
		});
	}

	/** Also follows account-switch teardown, which clears MessageCache directly. */
	visit(): EditVisit {
		if (this.session !== MessageCache.generation()) {
			this.session = MessageCache.generation();
			this.kept = null;
			this.saved.clear();
		}
		return { session: this.session, owner: Symbol() };
	}

	current(visit: EditVisit): boolean {
		return visit.session === MessageCache.generation();
	}

	private baseAfterSaves(base: string): string {
		const seen = new Set<string>();
		while (this.saved.has(base) && !seen.has(base)) {
			seen.add(base);
			base = this.saved.get(base)!;
		}
		return base;
	}

	/** Keeps `edit`, made on the server's copy `base`. */
	keep(base: string, edit: T, visit: EditVisit): void {
		if (!this.current(visit)) return;
		this.kept = { base: this.baseAfterSaves(base), edit, owner: visit.owner };
	}

	forget(visit: EditVisit): void {
		if (this.current(visit) && this.kept?.owner === visit.owner) this.kept = null;
	}

	/** Own successful writes advance the base, including a save that lands after Back. */
	savedAs(base: string, next: string, visit: EditVisit): void {
		if (!this.current(visit)) return;
		this.writes++;
		base = this.baseAfterSaves(base);
		if (base !== next) this.saved.set(base, next);
	}

	/** The edit kept on `base`, once: null when none was, or it was made on another copy. */
	take(base: string, visit: EditVisit): T | null {
		if (!this.current(visit)) return null;
		const kept = this.kept;
		this.kept = null;
		const matches = kept && this.baseAfterSaves(kept.base) === base;
		// A fresh server read is the new baseline, including an external change
		// back to an earlier value. Old own-write transitions must not remap it.
		this.saved.clear();
		return matches ? kept.edit : null;
	}
}
