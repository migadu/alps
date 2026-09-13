/**
 * The visual filter editor's Sieve compiler.
 *
 * Everything the user types ends up inside a Sieve quoted string, so the
 * property that matters is that a server reading the script gets back exactly
 * the value — no early close, no trailing backslash swallowing the quote, no
 * remainder parsed as code.
 */
import { describe, expect, it } from 'vitest';
import { SieveCompiler, type FilterRule } from '../../plugins/managesieve/frontend/sieve-compiler';

const rule = (overrides: Partial<FilterRule> = {}): FilterRule => ({
  id: 'r1',
  matchType: 'all',
  conditions: [{ field: 'Subject', operator: 'contains', value: 'invoice' }],
  actions: [{ type: 'fileinto', value: 'Receipts' }],
  ...overrides,
});
const compile = (...rules: FilterRule[]) => SieveCompiler.compile({ rules });

/** Reads the quoted string starting at `start`, the way a Sieve parser does. */
function readQuoted(script: string, start: number): { value: string; end: number } {
  expect(script[start]).toBe('"');
  let value = '';
  for (let i = start + 1; i < script.length; i++) {
    const ch = script[i];
    if (ch === '\\') {
      value += script[++i];
      continue;
    }
    if (ch === '"') return { value, end: i + 1 };
    value += ch;
  }
  throw new Error('unterminated quoted string');
}

describe('quoting', () => {
  const values = [
    'plain', 'C:\\temp\\', 'say "hi"', 'x\\", "', '\\', '"', '"; discard; "', 'Привет 🎉',
    'tab\there', 'a\r\nb', '\u0000nul', 'del\u007f',
  ];
  const expected = (v: string) => v.replace(/[\u0000-\u001f\u007f]/g, '');

  it('gives a server back exactly the condition value, minus control characters', () => {
    for (const value of values) {
      const script = compile(rule({ conditions: [{ field: 'Subject', operator: 'contains', value }] }));
      const marker = 'header :contains "Subject" ';
      const { value: read, end } = readQuoted(script, script.indexOf(marker) + marker.length);
      expect(read, JSON.stringify(value)).toBe(expected(value));
      expect(script.slice(end, end + 3), JSON.stringify(value)).toBe(' {\n');
    }
  });

  it('gives a server back exactly the folder and the redirect address', () => {
    for (const value of values) {
      const script = compile(rule({ actions: [{ type: 'fileinto', value }, { type: 'redirect', value }] }));
      for (const marker of ['fileinto :create ', 'redirect ']) {
        const { value: read, end } = readQuoted(script, script.indexOf(marker) + marker.length);
        expect(read, `${marker}${JSON.stringify(value)}`).toBe(expected(value));
        expect(script[end], `${marker}${JSON.stringify(value)}`).toBe(';');
      }
    }
  });

  it('never leaves a bare line break inside a string', () => {
    const script = compile(rule({ conditions: [{ field: 'Subject', operator: 'is', value: 'one\ntwo' }] }));
    expect(script).toContain('header :is "Subject" "onetwo"');
  });
});

describe('conditions', () => {
  it('maps each header operator', () => {
    const cond = (operator: any) => compile(rule({ conditions: [{ field: 'From', operator, value: 'a@b.test' }] }));
    expect(cond('contains')).toContain('if header :contains "From" "a@b.test" {');
    expect(cond('not_contains')).toContain('if not header :contains "From" "a@b.test" {');
    expect(cond('is')).toContain('if header :is "From" "a@b.test" {');
    expect(cond('not_is')).toContain('if not header :is "From" "a@b.test" {');
  });

  it('joins several conditions with allof or anyof', () => {
    const conditions: FilterRule['conditions'] = [
      { field: 'From', operator: 'contains', value: 'a' },
      { field: 'To', operator: 'is', value: 'b' },
    ];
    expect(compile(rule({ conditions }))).toContain('if allof (header :contains "From" "a", header :is "To" "b") {');
    expect(compile(rule({ conditions, matchType: 'any' }))).toContain('if anyof (header :contains "From" "a", header :is "To" "b") {');
  });

  it('emits a valid size and replaces an invalid one', () => {
    // A size is a bare number, so it cannot be escaped — only validated.
    const size = (operator: any, value: string) => compile(rule({ conditions: [{ field: 'Size', operator, value }] }));
    expect(size('over', '100K')).toContain('if size :over 100K {');
    expect(size('under', ' 5M ')).toContain('if size :under 5M {');
    expect(size('over', '10g')).toContain('if size :over 10g {');
    expect(size('over', 'abc; discard')).toContain('if size :over 0 {');
    expect(size('over', '')).toContain('if size :over 0 {');
  });

  it('matches the body with the body extension', () => {
    const script = compile(rule({ conditions: [{ field: 'Body', operator: 'contains', value: 'unsubscribe' }], actions: [{ type: 'discard' }] }));
    expect(script).toContain('require ["body"];');
    expect(script).toContain('if body :text :contains "unsubscribe" {');
  });

  it('maps each body operator, negations included', () => {
    const body = (operator: any) => compile(rule({ conditions: [{ field: 'Body', operator, value: 'x' }], actions: [{ type: 'discard' }] }));
    expect(body('contains')).toContain('if body :text :contains "x" {');
    expect(body('not_contains')).toContain('if not body :text :contains "x" {');
    expect(body('is')).toContain('if body :text :is "x" {');
    expect(body('not_is')).toContain('if not body :text :is "x" {');
  });
});

describe('actions and structure', () => {
  it('requires fileinto and mailbox only when a rule files messages', () => {
    expect(compile(rule()).startsWith('require ["fileinto", "mailbox"];\n\n')).toBe(true);
    expect(compile(rule({ actions: [{ type: 'discard' }] }))).not.toContain('require');
  });

  it('writes each action', () => {
    const script = compile(rule({ actions: [{ type: 'fileinto', value: 'Receipts' }, { type: 'redirect', value: 'a@b.test' }, { type: 'discard' }, { type: 'stop' }] }));
    expect(script).toContain('  fileinto :create "Receipts";\n  redirect "a@b.test";\n  discard;\n  stop;\n}');
  });

  it('skips a rule with no conditions or no actions', () => {
    expect(compile(rule({ conditions: [] }))).not.toContain('if ');
    expect(compile(rule({ actions: [] }))).not.toContain('if ');
  });

  it('compiles no rules to an empty script', () => {
    expect(compile()).toBe('');
  });
});

describe('the embedded editor state', () => {
  it('round-trips, including text beyond Latin-1', () => {
    // btoa throws above U+00FF, which made a Cyrillic rule unsavable.
    const state = { rules: [rule({ conditions: [{ field: 'Subject', operator: 'contains', value: 'Рачун 🧾' }], actions: [{ type: 'fileinto', value: 'Рачуни' }] })] };
    const script = SieveCompiler.compile(state);
    expect(script).toMatch(/^# ALPS_VISUAL_STATE: [A-Za-z0-9+/=]+$/m);
    expect(SieveCompiler.extractVisualState(script)).toEqual(state);
  });

  it('still reads state written as Latin-1 before that fix', () => {
    const state = { rules: [rule({ conditions: [{ field: 'Subject', operator: 'contains', value: 'für' }] })] };
    const legacy = `# ALPS_VISUAL_STATE: ${btoa(JSON.stringify(state))}\n`;
    expect(SieveCompiler.extractVisualState(legacy)).toEqual(state);
  });

  it('answers null for a script without state, or with state it cannot read', () => {
    expect(SieveCompiler.extractVisualState('if true { stop; }')).toBeNull();
    expect(SieveCompiler.extractVisualState('# ALPS_VISUAL_STATE: !!!\n')).toBeNull();
    expect(SieveCompiler.extractVisualState(`# ALPS_VISUAL_STATE: ${btoa('{not json')}\n`)).toBeNull();
  });
});
