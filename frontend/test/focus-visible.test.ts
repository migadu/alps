/**
 * A keyboard user can see where focus is, in every colour mode.
 *
 * alps-button took its outline away and put nothing back, so tabbing through
 * a dialog or a toolbar of buttons moved an invisible cursor; the sign-in
 * button and the button inside a field did the same, and so did a contact's
 * field-type select and the new-category field.
 *
 * The fields show focus as an accent border and a soft box-shadow ring, which
 * is the whole look in a normal theme. Forced colors (Windows high contrast)
 * drop every box-shadow and paint every border in one system colour, so there
 * a focused field looked like all the others. What forced colors keep is an
 * outline: a transparent one paints nothing in a normal theme and is given a
 * system colour there.
 *
 * Read from the stylesheets rather than listed, so the next control written
 * the same way is caught too.
 */
import { describe, expect, it } from 'vitest';
import { readSources } from './helpers/sources';

const SOURCES = readSources();

interface Rule {
  selectors: string[];
  body: string;
  forced: boolean;
}

/** The CSS of a source file: its css`` literals, interpolations blanked. */
function cssOf(src: string): string {
  return [...src.matchAll(/css`([\s\S]*?)`/g)].map((m) => m[1].replace(/\$\{[^}]*\}/g, '0')).join('\n');
}

/** Innermost style rules, each marked with whether it sits under forced colors. */
function rulesIn(css: string): Rule[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: Rule[] = [];
  const open: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      open.push(text.slice(start, i).trim());
      start = i + 1;
    } else if (text[i] === '}') {
      const prelude = open.pop();
      const body = text.slice(start, i);
      if (prelude !== undefined && !prelude.startsWith('@') && !/[{}]/.test(body)) {
        rules.push({
          selectors: prelude.split(',').map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean),
          body,
          forced: open.some((p) => /forced-colors/.test(p)),
        });
      }
      start = i + 1;
    }
  }
  return rules;
}

/** The element a selector lands on, as its simple selectors with the state
 * pseudo-classes dropped: `.a.b:focus-visible` is {.a, .b}. */
function target(selector: string): Set<string> {
  const last = selector.split(/\s+|>|~|\+/).filter(Boolean).pop() ?? '';
  const bare = last.replace(/:(?:focus(?:-visible|-within)?|hover|active|checked|disabled|not\([^)]*\))/g, '');
  return new Set(bare.match(/\[[^\]]*\]|[.#]?[a-zA-Z_][\w-]*/g) ?? []);
}

/** Whether a rule written for `general` also reaches what `specific` selects. */
const covers = (general: Set<string>, specific: Set<string>) =>
  general.size > 0 && [...general].every((t) => specific.has(t));

const REMOVES = /(?:^|;)\s*outline\s*:\s*(?:none|0)\s*(?:!important\s*)?(?:;|$)/;
const DRAWS = /(?:^|;)\s*outline\s*:(?!\s*(?:none|0)\s*(?:!important\s*)?(?:;|$))/;

/** Named a button, by its tag or its class. */
const LOOKS_LIKE_A_BUTTON = /^(?:button|\.[\w-]*(?:btn|button)[\w-]*)$/;

/**
 * Elements that take their outline away and show focus some other way.
 *
 * The lists hand focus to a container and draw the cursor on its row. The
 * composer's fields have no border of their own and sit in its rows, and its
 * editors are the page being written: in each the caret is where focus is.
 * The Sieve editor's text area fills a bordered box, and the box shows focus
 * (pinned below).
 */
const SHOWN_ELSEWHERE = new Set([
  'src/components/message-list.ts: .list-content:focus',
  'plugins/carddav/frontend/contacts-list.ts: .list-content:focus',
  'plugins/caldav/frontend/tasks-list.ts: .scroll',
  'src/components/alps-floating-composer.ts: .field-input',
  'src/components/alps-address-input.ts: input',
  'src/components/alps-message-composer.ts: .reply-box',
  'src/components/alps-message-composer.ts: .editor-container .ProseMirror',
  'plugins/managesieve/frontend/raw-editor.ts: textarea',
]);

/** Each place an element's outline is taken away, with the focus rules that
 * draw one back for it. */
function removals(): { where: string; el: Set<string>; drawnBy: Rule[] }[] {
  const out: { where: string; el: Set<string>; drawnBy: Rule[] }[] = [];
  for (const [path, src] of Object.entries(SOURCES)) {
    const rules = rulesIn(cssOf(src));
    for (const rule of rules) {
      if (rule.forced || !REMOVES.test(rule.body)) continue;
      for (const selector of rule.selectors) {
        const el = target(selector);
        const drawnBy = rules.filter(
          (o) => DRAWS.test(o.body) && o.selectors.some((s) => /:focus/.test(s) && covers(target(s), el)),
        );
        out.push({ where: `${path}: ${selector}`, el, drawnBy });
      }
    }
  }
  return out;
}

/** A style rule's body, by its exact selector, from one component's source. */
function ruleBody(path: string, selector: string): string {
  const rule = rulesIn(cssOf(SOURCES[path])).find((r) => r.selectors.includes(selector));
  expect(rule, `${path} has no rule for ${selector}`).toBeTruthy();
  return rule!.body;
}

describe('focus', () => {
  it('is drawn back as an outline wherever a stylesheet takes it away', () => {
    const missing = removals()
      .filter((r) => !SHOWN_ELSEWHERE.has(r.where) && r.drawnBy.length === 0)
      .map((r) => r.where);
    expect(missing).toEqual([]);
  });

  it('on a button, only when the keyboard put it there', () => {
    // `:focus` would ring every button a pointer presses as well, which
    // teaches people to ignore the ring.
    const onClick = removals()
      .filter((r) => [...r.el].some((s) => LOOKS_LIKE_A_BUTTON.test(s)))
      .filter((r) => !r.drawnBy.some((d) => d.selectors.some((s) => /:focus-visible/.test(s))))
      .map((r) => r.where);
    expect(onClick).toEqual([]);
  });

  it('on alps-button, in the accent the list rows use', () => {
    const body = ruleBody('src/components/alps-button.ts', 'button:focus-visible');
    expect(body).toMatch(/outline:\s*2px solid var\(--accent-color/);
  });

  it('is never taken away by an inline style, which no focus rule can override', () => {
    const inline: string[] = [];
    for (const [path, src] of Object.entries(SOURCES)) {
      for (const m of src.matchAll(/style="[^"]*outline:\s*(?:none|0)\b[^"]*"/g)) {
        inline.push(`${path}: ${m[0].slice(0, 60)}`);
      }
    }
    expect(inline).toEqual([]);
  });

  it('shows on the tasks list cursor as an outline, not as a background forced colors repaint', () => {
    expect(ruleBody('plugins/caldav/frontend/tasks-list.ts', '.scroll:focus-within .row.focused')).toMatch(DRAWS);
  });

  it('shows on the Sieve editor’s box', () => {
    expect(ruleBody('plugins/managesieve/frontend/raw-editor.ts', '.code-area:focus-within')).toMatch(DRAWS);
  });

  it('is reading real stylesheets, not an empty set', () => {
    // A sweep that parsed nothing would pass forever.
    expect(removals().length).toBeGreaterThan(15);
    for (const where of SHOWN_ELSEWHERE) {
      expect(removals().map((r) => r.where), where).toContain(where);
    }
  });
});
