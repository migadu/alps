/**
 * The auto-reply's Sieve: the `vacation` block it compiles to, and how that
 * block shares the account's one active script with the filters.
 *
 * ManageSieve runs one script per account, so the auto-reply cannot have a
 * script of its own without switching the filters off. It is a block inside the
 * filters' script instead, and the property that matters is that the block can
 * be put in and taken out again without changing anything else — least of all
 * a script alps cannot read, which it keeps as text. The one exception is a
 * line break, added once, when the last leading `require` shares its line
 * with a command or a multi-line comment, or ends the script without one.
 */
import { describe, expect, it } from 'vitest';
import {
  compileAutoReply,
  DEFAULT_AUTO_REPLY,
  hasVacation,
  mergeAutoReply,
  splitAutoReply,
  zoneFromOffset,
  type AutoReply,
} from '../../plugins/managesieve/frontend/auto-reply';
import { SieveCompiler } from '../../plugins/managesieve/frontend/sieve-compiler';

const ADDRESS = 'alice@example.test';
const reply = (overrides: Partial<AutoReply> = {}): AutoReply => ({
  ...DEFAULT_AUTO_REPLY,
  enabled: true,
  subject: 'Away',
  message: 'Back on Monday.',
  ...overrides,
});
/** Summer time until the 25th of October, as in central Europe. */
const zoneOf = (year: number, month: number, day: number) => (month < 10 || (month === 10 && day < 25) ? '+0200' : '+0100');
const compile = (r: AutoReply, address: string | null = ADDRESS) => compileAutoReply(r, { address: address ?? undefined, zoneOf });

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

/** The vacation command's reason: its quoted string that the `;` closes. */
function reasonOf(block: string): string {
  let at = block.indexOf('vacation ');
  for (;;) {
    const { value, end } = readQuoted(block, block.indexOf('"', at));
    if (block[end] === ';') return value;
    at = end;
  }
}

describe('the vacation block', () => {
  it('answers with the subject and message, from the account, for the account', () => {
    const block = compile(reply({ days: 7 }));
    expect(block).toContain('require ["vacation"];\n');
    expect(block).toContain(`vacation :days 7 :from "${ADDRESS}" :addresses ["${ADDRESS}"] :subject "Away" "Back on Monday.";\n`);
    expect(block).not.toContain('currentdate');
  });

  it('leaves the From to the server when the address is not known', () => {
    const block = compile(reply(), null);
    expect(block).toContain('vacation :days 7 :subject "Away" "Back on Monday.";');
  });

  it('leaves the subject to the server when none is given', () => {
    expect(compile(reply({ subject: '  ' }))).toContain(`:addresses ["${ADDRESS}"] "Back on Monday.";`);
  });

  it('takes how often one sender is answered as :days, and only a whole number of days', () => {
    expect(compile(reply({ days: 1 }))).toContain('vacation :days 1 ');
    expect(compile(reply({ days: 30 }))).toContain('vacation :days 30 ');
    for (const days of [0, -3, 2.5, Number.NaN]) expect(compile(reply({ days }))).toContain('vacation :days 7 ');
  });

  it('switched off, keeps what was written and does nothing', () => {
    const block = compile(reply({ enabled: false }));
    expect(block).not.toMatch(/^\s*(require|vacation|if)\b/m);
    expect(block.split('\n').filter(Boolean).every((line) => line.startsWith('#'))).toBe(true);
    expect(splitAutoReply(block).reply).toEqual(reply({ enabled: false }));
  });

  it('answers only between its dates, each in the zone of its own midnight', () => {
    const block = compile(reply({ start: '2026-10-20', end: '2026-10-30' }));
    expect(block).toContain('require ["vacation", "date", "relational"];\n');
    // The end is inclusive: the window closes at the midnight AFTER the end
    // day, which is in winter time here although the start is not.
    expect(block).toContain(
      'if allof (currentdate :zone "+0200" :value "ge" "date" "2026-10-20", currentdate :zone "+0100" :value "le" "date" "2026-10-30") {\n' +
        `\tvacation :days 7 :from "${ADDRESS}"`,
    );
    expect(block).toMatch(/"Back on Monday\.";\n\}\n/);
  });

  it('leaves an open end open', () => {
    expect(compile(reply({ start: '2026-10-20' }))).toContain('if currentdate :zone "+0200" :value "ge" "date" "2026-10-20" {\n');
    expect(compile(reply({ end: '2026-10-24' }))).toContain('if currentdate :zone "+0100" :value "le" "date" "2026-10-24" {\n');
  });

  it('drops a date that is not one', () => {
    for (const start of ['2026-1-02', 'tomorrow', '2026-10-20" :value "lt']) {
      const block = compile(reply({ start }));
      expect(block, start).not.toContain('currentdate');
      expect(block, start).toContain('require ["vacation"];');
    }
  });

  it('uses the browser\'s own offset when no zone is given', () => {
    const block = compileAutoReply(reply({ start: '2026-01-15' }), { address: ADDRESS });
    expect(block).toContain(`currentdate :zone "${zoneFromOffset(-new Date(2026, 0, 15).getTimezoneOffset())}"`);
  });

  it('writes an offset the way the date extension reads it', () => {
    expect(zoneFromOffset(120)).toBe('+0200');
    expect(zoneFromOffset(0)).toBe('+0000');
    expect(zoneFromOffset(-330)).toBe('-0530');
    expect(zoneFromOffset(345)).toBe('+0545');
  });
});

describe('quoting', () => {
  const values = ['plain', 'C:\\temp\\', 'say "hi"', 'x\\", "', '"; discard; "', 'Привет 🎉', '\u0000nul', 'del\u007f'];

  it('gives the server back exactly the subject, on one line', () => {
    for (const subject of [...values, 'one\ntwo', 'tab\there']) {
      const block = compile(reply({ subject }));
      const marker = ':subject ';
      const { value, end } = readQuoted(block, block.indexOf(marker) + marker.length);
      expect(value, JSON.stringify(subject)).toBe(subject.replace(/[\u0000-\u001f\u007f]/g, '').trim());
      expect(block[end], JSON.stringify(subject)).toBe(' ');
    }
  });

  it('gives the server back exactly the message, line breaks and all', () => {
    for (const message of [...values, 'Away.\nBack on Monday.', 'Windows\r\nlines\r\n', 'a\ttab']) {
      const block = compile(reply({ message }));
      expect(reasonOf(block), JSON.stringify(message)).toBe(message.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ''));
    }
  });

  it('keeps a message line that looks like the end of the block inside the block', () => {
    const message = 'Away.\n# ALPS_AUTOREPLY_END\n# ALPS_AUTOREPLY: x\n#hash';
    const written = compile(reply({ message }));
    expect(reasonOf(written)).toBe(message);
    expect(written).not.toMatch(/^#hash/m);
    const filters = 'require "fileinto";\nkeep;\n';
    const { reply: read, block, filters: rest } = splitAutoReply(mergeAutoReply(written, filters));
    expect(block).toBe(written);
    expect(rest).toBe(filters);
    expect(read?.message).toBe(message);
  });

  it('carries what was written back, whatever it was', () => {
    for (const text of [...values, 'Away.\nBack on Monday.']) {
      const written = reply({ subject: text.replace(/\n/g, ' '), message: text, start: '2026-10-20', end: '2026-10-30', days: 3 });
      expect(splitAutoReply(compile(written)).reply, JSON.stringify(text)).toEqual(written);
    }
  });
});

describe('sharing the script with the filters', () => {
  const block = compile(reply());
  const visual = SieveCompiler.compile({
    rules: [{ id: 'r', matchType: 'all', conditions: [{ field: 'Subject', operator: 'contains', value: 'invoice' }], actions: [{ type: 'fileinto', value: 'Receipts' }] }],
  });
  const handWritten = [
    '# Kept by hand.',
    '/* Two requires, a list over two lines,',
    '   and comments between them. */',
    'require "fileinto";',
    '# the flags are for the archive',
    'require [ "imap4flags",',
    '          "copy" ]; # needed below',
    '',
    'if address :is "from" "boss@remote.test" { addflag "\\\\Flagged"; fileinto :copy "Boss"; }',
    '',
  ].join('\n');

  /** Everything before the block is `require` commands and comments. */
  const beforeBlock = (merged: string) => merged.slice(0, merged.indexOf('# ALPS_AUTOREPLY:'));

  it('is the whole script when there are no filters', () => {
    expect(mergeAutoReply(block, '')).toBe(block);
    expect(splitAutoReply(block)).toEqual({ reply: reply(), block, filters: '' });
  });

  it('goes in after the filters\' require, which Sieve wants first', () => {
    const merged = mergeAutoReply(block, visual);
    expect(beforeBlock(merged)).toBe('require ["fileinto", "mailbox"];\n');
    expect(merged).toBe(beforeBlock(merged) + block + visual.slice(beforeBlock(merged).length));
  });

  it('comes out again leaving the filters exactly as they were', () => {
    for (const filters of [visual, handWritten, 'keep;\n', 'discard;', '# only a comment\n']) {
      const { reply: read, filters: rest, block: found } = splitAutoReply(mergeAutoReply(block, filters));
      expect(rest, filters).toBe(filters);
      expect(found, filters).toBe(block);
      expect(read, filters).toEqual(reply());
    }
  });

  it('reads past comments, string lists and line breaks to the last require', () => {
    const merged = mergeAutoReply(block, handWritten);
    expect(beforeBlock(merged)).toBe(handWritten.slice(0, handWritten.indexOf('\n\nif') + 1));
    expect(merged.indexOf('# ALPS_AUTOREPLY:')).toBeLessThan(merged.indexOf('if address'));
  });

  it('is not fooled by require, ; or # inside a string or a comment', () => {
    const tricky = 'require "x;y"; /* require "z"; */ # require "w";\nrequire text:\nfileinto;\n.\n;\nkeep;\n';
    const merged = mergeAutoReply(block, tricky);
    expect(beforeBlock(merged)).toBe('require "x;y"; /* require "z"; */ # require "w";\nrequire text:\nfileinto;\n.\n;\n');
    expect(splitAutoReply(merged).filters).toBe(tricky);
  });

  it('starts the script when the filters require nothing', () => {
    expect(mergeAutoReply(block, 'keep;\n')).toBe(block + 'keep;\n');
    expect(mergeAutoReply(block, '# Notes.\nkeep;\n')).toBe(block + '# Notes.\nkeep;\n');
  });

  it('takes a line of its own after a require that shares its line', () => {
    const merged = mergeAutoReply(block, 'require "fileinto"; fileinto "A";');
    expect(merged).toBe('require "fileinto";\n' + block + ' fileinto "A";');
    // The one byte it had to add stays, and nothing moves after that.
    const { filters } = splitAutoReply(merged);
    expect(filters).toBe('require "fileinto";\n fileinto "A";');
    expect(splitAutoReply(mergeAutoReply(block, filters)).filters).toBe(filters);
  });

  it('ends a require line left without a line break', () => {
    expect(mergeAutoReply(block, 'require "fileinto";')).toBe('require "fileinto";\n' + block);
  });

  it('replaces the block it finds rather than adding a second', () => {
    const merged = mergeAutoReply(block, visual);
    const next = compile(reply({ message: 'Changed.' }));
    const replaced = mergeAutoReply(next, splitAutoReply(merged).filters);
    expect(replaced.match(/# ALPS_AUTOREPLY:/g)).toHaveLength(1);
    expect(splitAutoReply(replaced).reply?.message).toBe('Changed.');
    expect(splitAutoReply(replaced).filters).toBe(visual);
  });

  it('leaves a script without the block alone', () => {
    for (const script of ['', visual, handWritten]) {
      expect(splitAutoReply(script)).toEqual({ reply: null, block: '', filters: script });
    }
  });

  it('does not take half a block for one', () => {
    const half = block.replace('# ALPS_AUTOREPLY_END\n', '');
    expect(splitAutoReply(half)).toEqual({ reply: null, block: '', filters: half });
  });

  it('keeps hiding a block whose state it cannot read, so a save replaces it', () => {
    const broken = block.replace(/^# ALPS_AUTOREPLY: \S*/m, '# ALPS_AUTOREPLY: !!!');
    const { reply: read, filters } = splitAutoReply(mergeAutoReply(broken, visual));
    expect(read).toBeNull();
    expect(filters).toBe(visual);
  });

  it('is not mistaken for the visual editor\'s rules', () => {
    expect(SieveCompiler.extractVisualState(mergeAutoReply(block, visual))).toEqual(SieveCompiler.extractVisualState(visual));
    expect(SieveCompiler.extractVisualState(block)).toBeNull();
  });
});

describe('a vacation the filters send themselves', () => {
  it('is found as a command', () => {
    expect(hasVacation('require "vacation";\nvacation "Away.";\n')).toBe(true);
    expect(hasVacation('require ["vacation"];\nif true {\n  VACATION :days 3 "Away.";\n}\n')).toBe(true);
  });

  it('is not found in a require, a string or a comment', () => {
    expect(hasVacation('require "vacation";\nkeep;\n')).toBe(false);
    expect(hasVacation('# vacation "x";\n/* vacation "y"; */\nif header :contains "Subject" "vacation" { keep; }\n')).toBe(false);
    expect(hasVacation('')).toBe(false);
  });
});
