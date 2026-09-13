export interface FilterRule {
	id: string;
	matchType: 'all' | 'any';
	conditions: FilterCondition[];
	actions: FilterAction[];
}

export interface FilterCondition {
	field: 'Subject' | 'From' | 'To' | 'Body' | 'Size';
	operator: 'contains' | 'not_contains' | 'is' | 'not_is' | 'over' | 'under';
	value: string;
}

export interface FilterAction {
	type: 'fileinto' | 'discard' | 'redirect' | 'stop';
	value?: string;
}

export interface VisualState {
	rules: FilterRule[];
}


/**
 * A user value as a Sieve quoted string, RFC 5228 §2.4.2.
 *
 * The backslash is the escape character INSIDE a quoted string, so it has to be
 * doubled BEFORE the quote is escaped — doing it the other way round would
 * escape the backslashes this function just introduced. Only `"` was escaped
 * before, and not `\\` at all, which broke both ways round:
 *
 *   value `C:\temp\`  ->  "C:\temp\"   the trailing \ escapes the closing
 *                                        quote, and the literal runs on
 *   value `x\", "` ->  the pre-existing \ plus the newly escaped " form \\",
 *                      which closes the string and leaves the rest as Sieve
 *
 * C0 controls and DEL go too. A Sieve quoted string cannot contain a bare CR or
 * LF, so a pasted multi-line value produced a script the server refuses — and
 * they are the quoting boundary this all leans on. The range is written as
 * escapes, never as literal bytes, because a raw NUL in a character class is
 * invisible in a diff.
 */
function sieveString(value: string): string {
	return '"' + String(value ?? '')
		.replace(/[\u0000-\u001f\u007f]/g, '')
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"') + '"';
}

/** UTF-8 safe, because `btoa` throws on any codepoint above U+00FF.
 *
 * A rule whose value or folder name was Cyrillic, Greek, CJK or an emoji made
 * `compile()` throw InvalidCharacterError and the script unsavable — for a
 * codebase that ships Serbian Cyrillic as a locale. Latin-1 accents happened to
 * work, which is what kept it hidden. */
function encodeVisualState(state: VisualState): string {
	const bytes = new TextEncoder().encode(JSON.stringify(state));
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

/** Decodes what encodeVisualState wrote, and what `btoa` wrote before it.
 *
 * A script saved by the old code holds Latin-1 bytes. Pure ASCII is identical
 * under both, so only a high Latin-1 byte differs — and a lone one is not valid
 * UTF-8, so a fatal decode rejects it and the Latin-1 reading is used instead.
 * Without the fallback an existing German rule would come back as `f\uFFFDr`. */
function decodeVisualState(encoded: string): string {
	const binary = atob(encoded);
	const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
	} catch {
		return binary;
	}
}


export class SieveCompiler {
	
	static extractVisualState(script: string): VisualState | null {
		const match = script.match(/^# ALPS_VISUAL_STATE: (.*)$/m);
		if (!match) return null;
		
		try {
			return JSON.parse(decodeVisualState(match[1])) as VisualState;
		} catch (e) {
			return null;
		}
	}
	
	static compile(state: VisualState): string {
		if (state.rules.length === 0) {
			return '';
		}

		const requiredExts = new Set<string>();
		
		for (const rule of state.rules) {
			for (const action of rule.actions) {
				if (action.type === 'fileinto') {
					requiredExts.add('fileinto');
					requiredExts.add('mailbox');
				}
			}
			for (const cond of rule.conditions) {
				if (cond.field.toLowerCase() === 'body') requiredExts.add('body');
			}
		}
		
		let script = '';
		if (requiredExts.size > 0) {
			script += `require [${Array.from(requiredExts).map(e => `"${e}"`).join(', ')}];\n\n`;
		}
		
		// Inject visual state
		script += `# ALPS_VISUAL_STATE: ${encodeVisualState(state)}\n\n`;
		
		for (const rule of state.rules) {
			if (rule.conditions.length === 0 || rule.actions.length === 0) continue;
			
			const conditionsSieve = rule.conditions.map(c => this.compileCondition(c));
			let ifStatement = '';
			
			if (conditionsSieve.length === 1) {
				ifStatement = `if ${conditionsSieve[0]}`;
			} else if (rule.matchType === 'all') {
				ifStatement = `if allof (${conditionsSieve.join(', ')})`;
			} else {
				ifStatement = `if anyof (${conditionsSieve.join(', ')})`;
			}
			
			script += `${ifStatement} {\n`;
			for (const action of rule.actions) {
				script += `  ${this.compileAction(action)}\n`;
			}
			script += `}\n\n`;
		}
		
		return script;
	}
	
	private static compileCondition(c: FilterCondition): string {
		const field = c.field.toLowerCase();
		
		if (field === 'size') {
			// Emitted as a bare NUMBER, not a quoted string, so it is the one
			// value that cannot be escaped — it has to be validated instead.
			// Sieve accepts an optional K/M/G suffix; anything else was pasted
			// straight into the script as code.
			const size = String(c.value ?? '').trim();
			if (!/^\d+[KMG]?$/i.test(size)) return `size :${c.operator} 0`;
			return `size :${c.operator} ${size}`;
		}
		
		if (field === 'body') {
			// The editor offers all four text operators for Body, and this read
			// only `contains`: `not_contains` and `not_is` both compiled to a
			// positive `:is`. A rule meant as "body does not contain X" became
			// "body is exactly X" — inverted, and almost never matching — with
			// nothing on screen to say so. `require ["body"]` is added in compile().
			const negate = c.operator === 'not_contains' || c.operator === 'not_is' ? 'not ' : '';
			const match = c.operator === 'is' || c.operator === 'not_is' ? ':is' : ':contains';
			return `${negate}body :text ${match} ${sieveString(c.value)}`;
		}
		
		// Header match
		let op = '';
		let matchType = '';
		if (c.operator === 'contains') { op = ''; matchType = ':contains'; }
		else if (c.operator === 'not_contains') { op = 'not '; matchType = ':contains'; }
		else if (c.operator === 'is') { op = ''; matchType = ':is'; }
		else if (c.operator === 'not_is') { op = 'not '; matchType = ':is'; }
		
		return `${op}header ${matchType} ${sieveString(c.field)} ${sieveString(c.value)}`;
	}
	
	private static compileAction(a: FilterAction): string {
		switch (a.type) {
			// These escaped NOTHING. A folder name or redirect address holding a
			// quote closed the literal and left the remainder as Sieve code.
			case 'fileinto': return `fileinto :create ${sieveString(a.value ?? '')};`;
			case 'discard': return `discard;`;
			case 'redirect': return `redirect ${sieveString(a.value ?? '')};`;
			case 'stop': return `stop;`;
		}
		return '';
	}
}
