import { sieveString } from './sieve-compiler';

/**
 * The auto-reply as Sieve: a `vacation` action (RFC 5230) kept in a block of
 * its own inside the account's active script.
 *
 * ManageSieve runs one script per account, and the filters are already in it,
 * so the auto-reply cannot have a script of its own without switching the
 * filters off. It goes into the same script instead, between two marker
 * comments, and each page works on its own part only: Filters is handed the
 * script without the block and saves its rules around it, and the auto-reply
 * page replaces the block and keeps everything else as it was written — a
 * script the visual editor cannot read included.
 *
 * The block goes after the filters' leading `require` commands, not at the
 * very top, because Sieve allows `require` only before any other command
 * (RFC 5228 §3.2) and the block has a command of its own. It carries its own
 * `require`, which a script may repeat. That is also the one change it can
 * make around itself: a line break, added once, when the last leading
 * `require` shares its line with a command or a multi-line comment, or ends
 * the script without one.
 *
 * Like the visual editor, the block keeps what was typed in a comment, and the
 * page reads that back rather than parsing Sieve: the commands below it are
 * generated from it, and only the server reads them.
 */
export interface AutoReply {
	enabled: boolean;
	subject: string;
	message: string;
	/** The first day replies go out, as `YYYY-MM-DD` in the user's own zone; '' for no start. */
	start: string;
	/** The last day replies go out, inclusive; '' for no end. */
	end: string;
	/** Days before the same sender is answered again: the vacation's `:days`. */
	days: number;
}

/** RFC 5230's own default for `:days` is a week. */
export const DEFAULT_AUTO_REPLY: AutoReply = { enabled: false, subject: '', message: '', start: '', end: '', days: 7 };

/** The intervals the page offers. RFC 5230's minimum is one day. */
export const AUTO_REPLY_DAYS = [1, 3, 7, 14, 30];

const BEGIN = '# ALPS_AUTOREPLY: ';
const END = '# ALPS_AUTOREPLY_END';
/** The block as `compileAutoReply` writes it, from its first line to its last.
 * Half a block — a first line with no last — is not taken for one. */
const BLOCK = /^# ALPS_AUTOREPLY: (\S*)[ \t]*\r?\n(?:[^\n]*\n)*?# ALPS_AUTOREPLY_END[ \t]*(?:\r?\n|$)/m;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A reply with every field of the right type, whatever it was read from: the
 * state comes back out of a script another client may have edited. */
function normalize(value: Partial<Record<keyof AutoReply, unknown>>): AutoReply {
	const day = (v: unknown) => (typeof v === 'string' && DAY.test(v) ? v : '');
	const days = value.days;
	return {
		enabled: value.enabled === true,
		subject: typeof value.subject === 'string' ? value.subject : '',
		message: typeof value.message === 'string' ? value.message : '',
		start: day(value.start),
		end: day(value.end),
		days: typeof days === 'number' && Number.isInteger(days) && days >= 1 ? days : DEFAULT_AUTO_REPLY.days,
	};
}

/** UTF-8 safe, as the visual editor's state is: `btoa` alone throws on Cyrillic. */
function encodeState(reply: AutoReply): string {
	let binary = '';
	for (const byte of new TextEncoder().encode(JSON.stringify(reply))) binary += String.fromCharCode(byte);
	return btoa(binary);
}

function decodeState(encoded: string): AutoReply | null {
	try {
		const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
		const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
		return value && typeof value === 'object' ? normalize(value) : null;
	} catch {
		return null;
	}
}

/**
 * The message as a Sieve quoted string. Unlike a header value it keeps its
 * line breaks: a quoted string may hold them (RFC 5228 §2.4.2), and the server
 * sends them as the reply's lines. They are written as LF, as the rest of the
 * script is, tabs stay, and every other control character goes.
 *
 * A `#` that starts a line is written `\#`, which Sieve reads as a bare `#`
 * (an undefined escape, RFC 5228 §2.4.2). Written as it is, a line of the
 * message reading "# ALPS_AUTOREPLY_END" would end the block there for
 * splitAutoReply, and hand the rest of the vacation to the filters.
 */
function sieveText(value: string): string {
	return '"' + value
		.replace(/\r\n?/g, '\n')
		.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/^#/gm, '\\#') + '"';
}

/** An offset in minutes east of UTC, as the date extension's `:zone` takes it: "+0200". */
export function zoneFromOffset(minutes: number): string {
	const abs = Math.abs(minutes);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${minutes < 0 ? '-' : '+'}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`;
}

/** The browser's zone at the local midnight that starts the given day. */
function browserZone(year: number, month: number, day: number): string {
	return zoneFromOffset(-new Date(year, month - 1, day).getTimezoneOffset());
}

function dayParts(day: string): [number, number, number] {
	const [year, month, date] = day.split('-').map(Number);
	return [year, month, date];
}

function nextDay(day: string): [number, number, number] {
	const [year, month, date] = dayParts(day);
	const next = new Date(Date.UTC(year, month - 1, date + 1));
	return [next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()];
}

export interface AutoReplyOptions {
	/** The account's address: the reply's From, and the address it answers for.
	 * Left out when it is not an address, such as a bare user name. */
	address?: string;
	/** The zone in force at the local midnight starting a day. The browser's, unless a test says otherwise. */
	zoneOf?: (year: number, month: number, day: number) => string;
}

/**
 * The block for `reply`, ending in a line break.
 *
 * The dates are compared on the server, at delivery, by the date extension's
 * `currentdate` (RFC 5260) with `:value` from relational (RFC 5231). Each is
 * read in the zone of its own boundary: the start at the midnight that begins
 * it, the end at the midnight that closes it, so a window that crosses a
 * change of summer time still opens and closes at local midnight.
 *
 * Switched off, the block keeps only the comment, so what was written is there
 * the next time it is switched on.
 */
export function compileAutoReply(reply: AutoReply, options: AutoReplyOptions = {}): string {
	const r = normalize(reply);
	const lines = [BEGIN + encodeState(r)];
	if (r.enabled) {
		const zoneOf = options.zoneOf ?? browserZone;
		const tests: string[] = [];
		if (r.start) tests.push(`currentdate :zone ${sieveString(zoneOf(...dayParts(r.start)))} :value "ge" "date" ${sieveString(r.start)}`);
		if (r.end) tests.push(`currentdate :zone ${sieveString(zoneOf(...nextDay(r.end)))} :value "le" "date" ${sieveString(r.end)}`);
		const extensions = tests.length > 0 ? ['vacation', 'date', 'relational'] : ['vacation'];
		lines.push(`require [${extensions.map(e => `"${e}"`).join(', ')}];`);

		let vacation = `vacation :days ${r.days}`;
		// A login can be a bare user name, which is no address: RFC 5230 asks
		// the server to refuse it as :from (§4.3). Left out, the server sends
		// from, and answers for, the account's own address.
		const address = options.address?.trim();
		if (address?.includes('@')) vacation += ` :from ${sieveString(address)} :addresses [${sieveString(address)}]`;
		// Left out when empty, so the server words the subject itself; a blank
		// one would answer with an empty Subject line.
		const subject = r.subject.replace(/[\u0000-\u001f\u007f]/g, '').trim();
		if (subject) vacation += ` :subject ${sieveString(subject)}`;
		vacation += ` ${sieveText(r.message)};`;

		if (tests.length === 0) lines.push(vacation);
		else lines.push(`if ${tests.length === 1 ? tests[0] : `allof (${tests.join(', ')})`} {`, `\t${vacation}`, '}');
	}
	lines.push(END);
	return lines.join('\n') + '\n';
}

export interface SplitScript {
	/** The stored reply, or null when there is none, or none that can be read. */
	reply: AutoReply | null;
	/** The block as it stands in the script, or '' when there is none. */
	block: string;
	/** Everything else: the filters, exactly as they were written. */
	filters: string;
}

/** Takes the auto-reply's block out of a script. A block whose state cannot be
 * read is still taken out, so that the next save replaces it. */
export function splitAutoReply(script: string): SplitScript {
	const match = BLOCK.exec(script);
	if (!match) return { reply: null, block: '', filters: script };
	return {
		reply: decodeState(match[1]),
		block: match[0],
		filters: script.slice(0, match.index) + script.slice(match.index + match[0].length),
	};
}

/** Puts a block into the filters, after their leading `require` commands. */
export function mergeAutoReply(block: string, filters: string): string {
	if (!block) return filters;
	const { at, newline } = afterRequires(filters);
	return filters.slice(0, at) + (newline ? '\n' : '') + block + filters.slice(at);
}

/** Whether the filters send an automatic reply of their own: a `vacation`
 * command, not the word in a comment, a string or a require. */
export function hasVacation(filters: string): boolean {
	for (const token of sieveTokens(filters)) {
		if (token.kind === 'word' && token.text.toLowerCase() === 'vacation') return true;
	}
	return false;
}

/**
 * Where the block goes: just past the last of the script's leading `require`
 * commands, on a line of its own.
 *
 * The rest of that require's line goes before the block when it holds only a
 * comment. When it holds a command, the block needs a line break before it —
 * the one byte this adds to a script, and only to one written that way.
 */
function afterRequires(script: string): { at: number; newline: boolean } {
	let end = 0;
	let inRequire = false;
	for (const token of sieveTokens(script)) {
		if (inRequire) {
			if (token.kind === 'punct' && token.text === ';') {
				end = token.end;
				inRequire = false;
			}
			continue;
		}
		if (token.kind !== 'word' || token.text.toLowerCase() !== 'require') break;
		inRequire = true;
	}
	if (end === 0) return { at: 0, newline: false };

	let i = end;
	for (;;) {
		while (script[i] === ' ' || script[i] === '\t') i++;
		const close = script.startsWith('/*', i) ? script.indexOf('*/', i + 2) : -1;
		if (close < 0 || script.slice(i, close).includes('\n')) break;
		i = close + 2;
	}
	if (script[i] === '#') {
		const lineEnd = script.indexOf('\n', i);
		i = lineEnd < 0 ? script.length : lineEnd;
	}
	if (script.startsWith('\r\n', i)) return { at: i + 2, newline: false };
	if (script[i] === '\n') return { at: i + 1, newline: false };
	if (i >= script.length) return { at: script.length, newline: true };
	return { at: end, newline: true };
}

interface Token {
	kind: 'word' | 'tag' | 'string' | 'number' | 'punct';
	text: string;
	end: number;
}

/**
 * Sieve's tokens (RFC 5228 §8.1), as far as finding commands needs them:
 * comments are skipped whole, and a string — quoted or multi-line — is one
 * token, so nothing inside it can read as a command or end one. A script that
 * stops in the middle of a string or a comment simply has no more tokens.
 */
function* sieveTokens(script: string): Generator<Token> {
	const n = script.length;
	let i = 0;
	while (i < n) {
		const ch = script[i];
		if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
			i++;
			continue;
		}
		if (ch === '#') {
			const lineEnd = script.indexOf('\n', i);
			i = lineEnd < 0 ? n : lineEnd + 1;
			continue;
		}
		if (ch === '/' && script[i + 1] === '*') {
			const close = script.indexOf('*/', i + 2);
			if (close < 0) return;
			i = close + 2;
			continue;
		}
		const start = i;
		if (ch === '"') {
			i++;
			while (i < n && script[i] !== '"') i += script[i] === '\\' ? 2 : 1;
			if (i >= n) return;
			i++;
			yield { kind: 'string', text: script.slice(start, i), end: i };
			continue;
		}
		if (/[A-Za-z_]/.test(ch)) {
			while (i < n && /\w/.test(script[i])) i++;
			const word = script.slice(start, i);
			if (word.toLowerCase() === 'text' && script[i] === ':') {
				// A multi-line string: from the line after "text:" to a line
				// holding only a dot, which ends it.
				let lineEnd = script.indexOf('\n', i);
				for (;;) {
					if (lineEnd < 0) return;
					const next = script.indexOf('\n', lineEnd + 1);
					const line = script.slice(lineEnd + 1, next < 0 ? n : next).replace(/\r$/, '');
					if (line === '.') {
						i = next < 0 ? n : next + 1;
						break;
					}
					lineEnd = next;
				}
				yield { kind: 'string', text: script.slice(start, i), end: i };
				continue;
			}
			yield { kind: 'word', text: word, end: i };
			continue;
		}
		if (ch === ':') {
			i++;
			while (i < n && /\w/.test(script[i])) i++;
			yield { kind: 'tag', text: script.slice(start, i), end: i };
			continue;
		}
		if (/\d/.test(ch)) {
			while (i < n && /\d/.test(script[i])) i++;
			if (/[KMG]/i.test(script[i] ?? '')) i++;
			yield { kind: 'number', text: script.slice(start, i), end: i };
			continue;
		}
		i++;
		yield { kind: 'punct', text: ch, end: i };
	}
}
