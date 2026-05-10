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


export class SieveCompiler {
	
	static extractVisualState(script: string): VisualState | null {
		const match = script.match(/^# ALPS_VISUAL_STATE: (.*)$/m);
		if (!match) return null;
		
		try {
			return JSON.parse(atob(match[1])) as VisualState;
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
		script += `# ALPS_VISUAL_STATE: ${btoa(JSON.stringify(state))}\n\n`;
		
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
			return `size :${c.operator} ${c.value}`;
		}
		
		if (field === 'body') {
			// Body extension required in reality, but simplified for now
			return `body :text :${c.operator === 'contains' ? 'contains' : 'is'} "${c.value.replace(/"/g, '\\"')}"`;
		}
		
		// Header match
		let op = '';
		let matchType = '';
		if (c.operator === 'contains') { op = ''; matchType = ':contains'; }
		else if (c.operator === 'not_contains') { op = 'not '; matchType = ':contains'; }
		else if (c.operator === 'is') { op = ''; matchType = ':is'; }
		else if (c.operator === 'not_is') { op = 'not '; matchType = ':is'; }
		
		return `${op}header ${matchType} "${c.field}" "${c.value.replace(/"/g, '\\"')}"`;
	}
	
	private static compileAction(a: FilterAction): string {
		switch (a.type) {
			case 'fileinto': return `fileinto :create "${a.value}";`;
			case 'discard': return `discard;`;
			case 'redirect': return `redirect "${a.value}";`;
			case 'stop': return `stop;`;
		}
		return '';
	}
}
