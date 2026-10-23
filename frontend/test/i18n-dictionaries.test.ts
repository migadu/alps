/**
 * Mechanical checks on the dictionaries and on how the source uses them.
 *
 * `t()` returns the key itself when a lookup misses, and a key is a truthy
 * string, so `t('a.b') || 'Fallback'` never reaches its fallback: a missing key
 * renders as literal "a.b". The type system cannot catch it either, so these
 * scans are the only guard.
 */
import { describe, expect, it } from 'vitest';
import { readSources } from './helpers/sources';
import { en } from '../src/i18n/en';
import { de } from '../src/i18n/de';
import { es } from '../src/i18n/es';
import { fr } from '../src/i18n/fr';
import { it as itLocale } from '../src/i18n/it';
import { pt } from '../src/i18n/pt';
import { rs } from '../src/i18n/rs';
import { sr } from '../src/i18n/sr';
import { da } from '../src/i18n/da';

type Dict = Record<string, unknown>;

const CORE: [string, Dict][] = [['da', da], ['de', de], ['es', es], ['fr', fr], ['it', itLocale], ['pt', pt], ['rs', rs], ['sr', sr]] as [string, Dict][];
const intlTag = (code: string) => (code === 'rs' ? 'sr-Cyrl' : code === 'sr' ? 'sr-Latn' : code);

const PLUGIN_LOCALES = import.meta.glob('../../plugins/*/frontend/i18n/*.ts', { eager: true }) as Record<string, Dict>;
const dictOf = (module: Dict) => (module.default ?? Object.values(module)[0] ?? {}) as Dict;

const byPlugin = new Map<string, Map<string, Dict>>();
for (const [path, module] of Object.entries(PLUGIN_LOCALES)) {
  const match = /plugins\/([^/]+)\/frontend\/i18n\/([^/]+)\.ts$/.exec(path);
  if (!match) continue;
  if (!byPlugin.has(match[1])) byPlugin.set(match[1], new Map());
  byPlugin.get(match[1])!.set(match[2], dictOf(module));
}

function mergeDeep(a: Dict, b: Dict): Dict {
  const out: Dict = { ...a };
  for (const [key, value] of Object.entries(b)) {
    const existing = out[key];
    out[key] = isObject(value) && isObject(existing) ? mergeDeep(existing as Dict, value as Dict) : value;
  }
  return out;
}
const isObject = (v: unknown) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** The dictionary the app resolves against: core `en` with every plugin's `en` merged in. */
const mergedEn = [...byPlugin.values()].reduce((acc, locales) => mergeDeep(acc, locales.get('en') ?? {}), en as unknown as Dict);

const isPlural = (v: unknown) => isObject(v) && typeof (v as Dict).other === 'string';
const isRenderable = (v: unknown) => typeof v === 'string' || isPlural(v);

/** Every key, counting a plural entry as one key rather than one per form. */
function keysOf(node: unknown, path: string[] = [], out: string[] = []): string[] {
  if (!isObject(node) || isPlural(node)) {
    out.push(path.join('.'));
    return out;
  }
  for (const [k, v] of Object.entries(node as Dict)) keysOf(v, [...path, k], out);
  return out;
}

/** Every string leaf, plural forms included. */
function leaves(node: unknown, path: string[] = [], out: [string, unknown][] = []): [string, unknown][] {
  if (!isObject(node)) {
    out.push([path.join('.'), node]);
    return out;
  }
  for (const [k, v] of Object.entries(node as Dict)) leaves(v, [...path, k], out);
  return out;
}

function lookup(dict: unknown, key: string): unknown {
  let cur: any = dict;
  for (const part of key.split('.')) cur = cur?.[part];
  return cur;
}

const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const SOURCES = readSources();

/** Checks one family of locales against its own English. */
function checkFamily(name: string, source: Dict, locales: [string, Dict][]) {
  const enKeys = keysOf(source);
  const problems: string[] = [];
  for (const [code, dict] of locales) {
    const keys = keysOf(dict);
    for (const k of keys.filter((k) => !enKeys.includes(k))) problems.push(`${name}/${code}: extra ${k}`);
    for (const k of enKeys.filter((k) => !keys.includes(k))) problems.push(`${name}/${code}: missing ${k}`);

    const needed = new Set(new Intl.PluralRules(intlTag(code)).resolvedOptions().pluralCategories as string[]);
    for (const key of keys) {
      const value = lookup(dict, key);
      if (!isPlural(value)) continue;
      const forms = Object.keys(value as Dict);
      for (const f of forms.filter((f) => !needed.has(f))) problems.push(`${name}/${code}: ${key} has a ${f} form ${code} never selects`);
      // `many` (es/fr/it/pt, for counts of a million and up) is not required:
      // the store answers a form a locale does not spell out with `other`.
      for (const f of [...needed].filter((f) => f !== 'many' && !forms.includes(f))) problems.push(`${name}/${code}: ${key} lacks the ${f} form`);
    }

    for (const [key, value] of leaves(dict)) {
      if (typeof value !== 'string' || !value.trim()) problems.push(`${name}/${code}: ${key} is not a non-empty string`);
    }

    const placeholders = (v: unknown) => (typeof v === 'string' ? [...new Set([...v.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort() : []);
    for (const key of enKeys) {
      const value = lookup(source, key);
      const translated = lookup(dict, key);
      if (!isPlural(value)) {
        const want = placeholders(value).join();
        const got = placeholders(translated).join();
        if (want && typeof translated === 'string' && want !== got) problems.push(`${name}/${code}: ${key} has {${got}} where en has {${want}}`);
        continue;
      }
      // Each form of a plural entry says what en's `other` says. A form may
      // leave the count out when it names the number in words ("the one
      // message"), but Serbian's `one` also serves 21 and must keep it, so
      // the forms are held to `other` rather than to en's form of the same name.
      const want = placeholders((value as Dict).other);
      for (const [form, text] of Object.entries(isObject(translated) ? (translated as Dict) : {})) {
        const got = placeholders(text);
        const missing = want.filter((p) => p !== 'count' && !got.includes(p));
        const extra = got.filter((p) => !want.includes(p));
        if (missing.length || extra.length) problems.push(`${name}/${code}: ${key}.${form} has {${got}} where en has {${want}}`);
      }
    }
  }
  return problems;
}

describe('locales', () => {
  it('found the plugin dictionaries', () => {
    expect(byPlugin.size).toBeGreaterThanOrEqual(5);
    for (const [plugin, locales] of byPlugin) expect([...locales.keys()].sort(), plugin).toEqual(['da', 'de', 'en', 'es', 'fr', 'it', 'pt', 'rs', 'sr']);
  });

  it('core: every locale has en\'s keys, its language\'s plural forms, and en\'s placeholders', () => {
    expect(checkFamily('core', en as unknown as Dict, CORE)).toEqual([]);
  });

  it('plugins: the same, against each plugin\'s own en', () => {
    const problems: string[] = [];
    for (const [plugin, locales] of byPlugin) {
      problems.push(...checkFamily(plugin, locales.get('en')!, [...locales].filter(([code]) => code !== 'en')));
    }
    expect(problems).toEqual([]);
  });
});

describe('counted numbers', () => {
  /**
   * A plain string can be right for one grammatical number only: "1 messages
   * selected", and Serbian, whose noun has three forms, was wrong for most
   * counts. So a number that counts something is a plural key. These strings
   * have no counted noun beside their number, and say why.
   */
  const COUNT_WITHOUT_NOUN: Record<string, string> = {
    'pagination.totalCount': 'a bare total: "120 total"',
    'pagination.rangeOfTotal': 'a range: "1–50 of 120"',
    'calendar.moreEvents': 'no noun: "+3 more"',
  };
  const NUMBER_PLACEHOLDER = /\{(count|n|total|limit|seconds|minutes|hours|left|failed|done|start|end)\}/;

  it('every counted number is a plural key', () => {
    const plain = keysOf(mergedEn).filter((key) => {
      const value = lookup(mergedEn, key);
      return typeof value === 'string' && NUMBER_PLACEHOLDER.test(value);
    });
    // The exemptions must all still be plain counted strings, or the list goes stale.
    for (const key of Object.keys(COUNT_WITHOUT_NOUN)) expect(plain, key).toContain(key);
    expect(plain.filter((key) => !(key in COUNT_WITHOUT_NOUN))).toEqual([]);
  });

  it('a one form that also serves 21 and 31 says its number', () => {
    // Serbian files 1, 21, 31, 101 under `one`, so "jedan razgovor" or "the
    // message you checked" there was wrong for every count but 1.
    const problems: string[] = [];
    const families: [string, [string, Dict][]][] = [['core', CORE], ...[...byPlugin].map(([p, locales]) => [p, [...locales]] as [string, [string, Dict][]])];
    for (const [name, locales] of families) {
      for (const [code, dict] of locales) {
        if (new Intl.PluralRules(intlTag(code)).select(21) !== 'one') continue;
        for (const [key, value] of leaves(dict)) {
          if (key.endsWith('.one') && typeof value === 'string' && !value.includes('{count}')) problems.push(`${name}/${code}: ${key}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

describe('keys used in source', () => {
  it('every literal t() key resolves', () => {
    const pattern = /\bt\(\s*['"`]([a-zA-Z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+)['"`]/g;
    const used = new Map<string, string>();
    for (const [file, text] of Object.entries(SOURCES)) {
      for (const m of stripComments(text).matchAll(pattern)) if (!used.has(m[1])) used.set(m[1], file);
    }
    expect(used.size).toBeGreaterThan(300);
    const unresolved = [...used].filter(([key]) => !isRenderable(lookup(mergedEn, key))).map(([key, file]) => `${key} (${file})`);
    expect(unresolved).toEqual([]);
  });

  it('every key-shaped literal resolves, wherever it is written', () => {
    // A key handed to t() through a variable is invisible to the scan above:
    // that is how a list row rendered "messageList.noRecipient".
    const namespaces = Object.keys(mergedEn);
    const pattern = new RegExp(`['"\`]((?:${namespaces.join('|')})\\.[A-Za-z0-9_.]+)['"\`]`, 'g');
    const unresolved = new Set<string>();
    for (const [file, text] of Object.entries(SOURCES)) {
      if (file.includes('/i18n/')) continue;
      for (const m of stripComments(text).matchAll(pattern)) {
        if (!isRenderable(lookup(mergedEn, m[1]))) unresolved.add(`${m[1]} (${file})`);
      }
    }
    expect([...unresolved].sort()).toEqual([]);
  });

  it('no plural key is asked for without a count', () => {
    // t() picks a form only when params.count is a number; without one the
    // plural entry is not a string and the user reads the key. A literal key
    // handed to any call counts, not only t(): the contacts page passes its
    // keys through reportFailure(), and one of those calls passed no numbers.
    const pattern = /\b[A-Za-z_$][\w$]*\(\s*['"`]([a-zA-Z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+)['"`]/g;
    const offenders: string[] = [];
    let plurals = 0;
    for (const [file, text] of Object.entries(SOURCES)) {
      const source = stripComments(text);
      for (const m of source.matchAll(pattern)) {
        if (!isPlural(lookup(mergedEn, m[1]))) continue;
        plurals++;
        // The rest of the call, up to its own closing parenthesis.
        let depth = 0;
        let end = m.index! + m[0].length;
        for (; end < source.length; end++) {
          const ch = source[end];
          if (ch === '(' || ch === '{' || ch === '[') depth++;
          else if (ch === ')' || ch === '}' || ch === ']') {
            if (depth === 0) break;
            depth--;
          }
        }
        if (!/\bcount\b/.test(source.slice(m.index! + m[0].length, end))) offenders.push(`${m[1]} (${file})`);
      }
    }
    expect(plurals).toBeGreaterThan(10);
    expect(offenders).toEqual([]);
  });

  it('no t() result has .replace() chained onto it', () => {
    // t() interpolates every {param}; a chained replace substitutes only the
    // first, and skips plural selection.
    const offenders = Object.entries(SOURCES).filter(([, text]) => /\bt\(\s*['"`][\w.]+['"`]\s*\)\s*(\?\.|\.)replace\(/.test(text)).map(([f]) => f);
    expect(offenders).toEqual([]);
  });
});

describe('Serbian scripts', () => {
  const CYRILLIC = /[\u0400-\u04FF]/;
  const LATIN = /[A-Za-zČčĆćŠšŽžĐđ]/;

  it('rs is the Cyrillic dictionary', () => {
    const values = leaves(rs).map(([, v]) => v as string);
    const cyrillic = values.filter((v) => CYRILLIC.test(v)).length;
    expect(cyrillic / values.length).toBeGreaterThan(0.85);
  });

  it('sr is the Latin dictionary, apart from the language picker naming Cyrillic Serbian', () => {
    const stray = leaves(sr).filter(([key, v]) => key !== 'settings.localization.serbian' && CYRILLIC.test(v as string));
    expect(stray).toEqual([]);
    expect(leaves(sr).filter(([, v]) => LATIN.test(v as string)).length).toBeGreaterThan(300);
  });

  it('the plugins follow the same split', () => {
    const problems: string[] = [];
    for (const [plugin, locales] of byPlugin) {
      for (const [key, v] of leaves(locales.get('sr')!)) if (CYRILLIC.test(v as string)) problems.push(`${plugin}/sr ${key}`);
      const rsValues = leaves(locales.get('rs')!).map(([, v]) => v as string);
      if (rsValues.filter((v) => CYRILLIC.test(v)).length / rsValues.length < 0.8) problems.push(`${plugin}/rs is mostly not Cyrillic`);
    }
    expect(problems).toEqual([]);
  });
});

const ALL_CORE: [string, Dict][] = [['en', en as unknown as Dict], ...CORE];

/** Every dictionary of one locale, the app's own and each plugin's, by the file it comes from. */
function dictionariesOf(code: string): [file: string, dict: Dict][] {
  const out: [string, Dict][] = [[`core/${code}`, ALL_CORE.find(([c]) => c === code)![1]]];
  for (const [plugin, locales] of byPlugin) if (locales.has(code)) out.push([`${plugin}/${code}`, locales.get(code)!]);
  return out;
}

/** Every string of one locale, plural forms included, as `file:key` and text. */
function stringsOf(code: string): [where: string, text: string][] {
  return dictionariesOf(code).flatMap(([file, dict]) =>
    leaves(dict).filter(([, v]) => typeof v === 'string').map(([key, v]) => [`${file}:${key}`, v as string] as [string, string]));
}

/**
 * Example domains are reserved ones. A placeholder is text a user copies, into
 * the reply-to field or a link, and seven locales wrote theirs under real,
 * registrable domains (beispiel.de, ejemplo.com, primer.com, eksempel.dk), so a
 * copied example sent mail to whoever owns them. RFC 2606 and RFC 6761 reserve
 * example.com, .net, .org and the .example TLD for this; the localized word
 * stays, under .example.
 *
 * A string is read in three shapes: whatever follows an @, the host of a URL,
 * and a bare host of three or more labels. A bare name of two labels is left
 * alone, since it cannot be told from a file name ("invite.ics").
 */
const DOMAIN_SHAPES = [
  /@([\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+)/gu,
  /[a-z][a-z\d+.-]*:\/\/([\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+)/giu,
  /(?<![\p{L}\p{N}@./:-])([\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+){2,})/gu,
];
const RESERVED_DOMAIN = /(?:^|\.)(?:example\.(?:com|net|org)|example)$/;

/** The domains one string names, lower-cased, `{placeholders}` dropped first. */
function domainsIn(text: string): string[] {
  const plain = text.replace(/\{[^}]*\}/g, ' ');
  return DOMAIN_SHAPES.flatMap((shape) => [...plain.matchAll(shape)].map((match) => match[1]!.toLowerCase()))
    // A top-level label is letters: "1.2.3" is a version, not a host.
    .filter((domain) => /\.\p{L}{2,}$/u.test(domain));
}

describe('example domains', () => {
  const LOCALES = ALL_CORE.map(([code]) => code);

  it('are read in every shape a string writes them, and only there', () => {
    expect(domainsIn('user@beispiel.de oder @beispiel.de')).toEqual(['beispiel.de', 'beispiel.de']);
    expect(domainsIn('pop.ejemplo.com')).toEqual(['pop.ejemplo.com']);
    expect(domainsIn('Voir https://eksempel.dk/hjaelp.')).toEqual(['eksempel.dk']);
    expect(domainsIn('invite.ics, z. B., e.g., f.eks., v1.2.3, {host}.')).toEqual([]);
  });

  it('are found in every locale, so an empty scan cannot pass', () => {
    for (const code of LOCALES) expect(stringsOf(code).flatMap(([, text]) => domainsIn(text)).length, code).toBeGreaterThan(0);
  });

  it.each(LOCALES)('%s writes every example under a reserved domain', (code) => {
    const real = stringsOf(code).flatMap(([where, text]) =>
      domainsIn(text).filter((domain) => !RESERVED_DOMAIN.test(domain)).map((domain) => `${where}: ${domain}`));
    expect(real).toEqual([]);
  });

  it('accepts exactly the reserved names', () => {
    for (const domain of ['example.com', 'pop.example.net', 'example.org', 'beispiel.example', 'primer.example']) {
      expect(RESERVED_DOMAIN.test(domain), domain).toBe(true);
    }
    for (const domain of ['beispiel.de', 'ejemplo.com', 'notexample.com', 'example.com.evil.de', 'example.co']) {
      expect(RESERVED_DOMAIN.test(domain), domain).toBe(false);
    }
  });
});

/**
 * The language picker names each language in its own words, the same in
 * every locale. Someone who lands in a language they cannot read is looking
 * for the name of their own, and German offered "Dänisch" and "Serbisch
 * (Lateinisch)", Spanish "Danés", and the Cyrillic dictionary wrote the Latin
 * option in Cyrillic. Serbian gets one option per script, each written in the
 * script it selects, the script named in lower case as Serbian writes it.
 */
const ENDONYMS: Record<string, string> = {
  english: 'English',
  german: 'Deutsch',
  italian: 'Italiano',
  spanish: 'Español',
  french: 'Français',
  portuguese: 'Português',
  danish: 'Dansk',
  serbian: 'Српски (ћирилица)',
  serbianLatin: 'Srpski (latinica)',
};

describe('the language picker', () => {
  it.each(ALL_CORE.map(([code]) => code))('%s names every language in its own words', (code) => {
    const dict = ALL_CORE.find(([c]) => c === code)![1];
    const labels = Object.fromEntries(Object.keys(ENDONYMS).map((key) => [key, lookup(dict, `settings.localization.${key}`)]));
    expect(labels).toEqual(ENDONYMS);
  });
});

/**
 * The Cyrillic dictionary writes Cyrillic. rs carried Latin words a Serbian
 * reader of Cyrillic would not write: "BCC" beside the composer's own "Бцц",
 * a "Cc:" label, a "uid" in an error, an "inline" in the GPG warning.
 *
 * Some words do stay Latin in Cyrillic text, so the rule is not "no Latin
 * letter". Each string is read as tokens, a run of Latin letters with the
 * digits and punctuation that hold an address or a command together, and
 * every token must be on the list below, which says why it stays Latin.
 * Tokens, not whole strings: a Latin word must not pass because it shares a
 * string with HTML. `{placeholders}` are code, not text, and are dropped first.
 */
const LATIN_IN_CYRILLIC = new Set([
  // Protocols, standards and formats, spelled as their specifications spell them.
  '2FA', 'ASCII', 'DKIM', 'DMARC', 'GPG', 'HTML', 'PGP', 'SPF', 'URL', 'WebAuthn',
  // The Message-ID header ("ID поруке").
  'ID',
  // What the user types or copies: example addresses, a URL, a command.
  'odgovor@primer.example', 'https://example.com', 'gpg --armor --export-secret-keys',
  // The 12-hour clock's markers, which the browser prints in Latin too. A size's
  // unit is not one of these: rs writes "КБ", as formatSize prints it.
  'AM/PM',
  // A product, by its own name.
  'YubiKey',
  // The language picker names each language in its own words.
  ...Object.values(ENDONYMS).filter((name) => /\p{Script=Latin}/u.test(name)),
]);
const LATIN_RUN = /[\p{Script=Latin}\d@._:/+-]+/gu;

/** The Latin tokens of one string, a multi-word name counted as one. */
function latinTokens(text: string): string[] {
  let rest = text.replace(/\{[^}]*\}/g, ' ');
  const tokens: string[] = [];
  for (const name of LATIN_IN_CYRILLIC) {
    if (name.includes(' ') && rest.includes(name)) {
      tokens.push(name);
      rest = rest.split(name).join(' ');
    }
  }
  for (const [run] of rest.matchAll(LATIN_RUN)) {
    // A sentence's full stop, or the hyphen before a Cyrillic case ending
    // ("GPG-а"), is not part of the name.
    const token = run.replace(/[.-]+$/, '');
    if (/\p{Script=Latin}/u.test(token)) tokens.push(token);
  }
  return tokens;
}

const strayLatin = (text: string) => latinTokens(text).filter((token) => !LATIN_IN_CYRILLIC.has(token));

describe('Serbian Cyrillic in its own script', () => {
  const RS_FILES = dictionariesOf('rs').map(([file]) => file);

  it('reads every rs dictionary through, so an empty scan cannot pass', () => {
    expect(RS_FILES).toEqual(expect.arrayContaining(['core/rs', 'caldav/rs', 'carddav/rs', 'gpg/rs', 'managesieve/rs', 'password/rs']));
    for (const [file, dict] of dictionariesOf('rs')) expect(leaves(dict).length, file).toBeGreaterThan(0);
  });

  it('catches a Latin word, even beside an allowed name or inside a Cyrillic word', () => {
    expect(strayLatin('Увек додај мене у BCC')).toEqual(['BCC']);
    expect(strayLatin('Недостају параметри фасцикле или uid')).toEqual(['uid']);
    expect(strayLatin('Прилози се не могу криптовати inline PGP-ом')).toEqual(['inline']);
    expect(strayLatin('Cc:')).toEqual(['Cc:']);
    // "Цц" spelled with a Latin "c": it looks right, and it is a Latin letter.
    expect(strayLatin('Цc')).toEqual(['c']);
    expect(strayLatin('{count} помоћу GPG-а, YubiKey и odgovor@primer.example.')).toEqual([]);
  });

  it.each(RS_FILES)('%s writes every string in Cyrillic', (file) => {
    const dict = dictionariesOf('rs').find(([f]) => f === file)![1];
    const latin = leaves(dict)
      .map(([key, text]) => [key, strayLatin(text as string)] as const)
      .filter(([, stray]) => stray.length > 0)
      .map(([key, stray]) => `${key}: ${stray.join(' ')}`);
    expect(latin).toEqual([]);
  });

  it('allows only tokens an rs string still uses, so the list cannot go stale', () => {
    const used = new Set(stringsOf('rs').flatMap(([, text]) => latinTokens(text)));
    expect([...LATIN_IN_CYRILLIC].filter((token) => !used.has(token))).toEqual([]);
  });
});

/**
 * Serbian speaks to the user formally, in both scripts. The dictionaries say
 * "želite", "Pokušajte ponovo" and "vaše sanduče", and a few strings had
 * slipped into the familiar ti: the name field's placeholder said "Tvoje ime",
 * the sign-in checkbox told the user "Ostani prijavljen", the rate-limited
 * button "Sačekaj", the filters' warning asked "Nastavi?".
 *
 * A command the user gives keeps the singular. A button, a menu item or an
 * option names what the user tells the app to do ("Obriši", "Sačuvaj i
 * zatvori"), which is how Serbian software writes them. The register shows
 * where the app speaks TO the user: an instruction, an error, a question. So
 * the second person, the pronouns and the possessive are read everywhere, and
 * the commands only where one continues a sentence, after . ! ? : or ;.
 *
 * rs is read as Latin, each string transliterated letter for letter first, so
 * one marker reads both scripts; the self-check proves it on a sample in each.
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z', и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm',
  н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't', ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'č', џ: 'dž', ш: 'š',
};

/** A Serbian string in Latin letters, lower case, as the case-insensitive markers read it. */
function toLatin(text: string): string {
  return [...text.toLowerCase()].map((letter) => CYRILLIC_TO_LATIN[letter] ?? letter).join('');
}

/** The strings, across both scripts' dictionaries, that `word` finds once read as Latin. */
function usingSerbian(word: RegExp): string[] {
  return ['rs', 'sr'].flatMap((code) => stringsOf(code).filter(([, text]) => word.test(toLatin(text))).map(([where, text]) => `${where}="${text}"`));
}

const serbianCommand = (verb: string): RegExp => new RegExp(`(?<=[.!?:;]\\s+)${verb}(?!\\p{L})`, 'iu');
const SERBIAN_FAMILIAR: { familiar: string; formal: string; marker: RegExp; caught: string[]; spared: string[] }[] = [
  {
    familiar: 'nećeš, vidiš, možeš',
    formal: 'nećete, vidite, možete',
    marker: /(?<!\p{L})(?!(?:vaš|naš|heš)(?!\p{L}))\p{L}*[aei]š(?!\p{L})/iu,
    caught: ['Organizatoru možeš javiti da nećeš doći.', 'Организатору можеш јавити да нећеш доћи.'],
    spared: ['Organizatoru možete javiti da nećete doći.', 'Организатору можете јавити да нећете доћи.'],
  },
  {
    familiar: 'si',
    formal: 'ste',
    marker: /(?<!\p{L})(?:si|jesi|nisi)(?!\p{L})/iu,
    caught: ['Da li si siguran?', 'Да ли си сигуран?'],
    spared: ['Da li ste sigurni?', 'Да ли сте сигурни?'],
  },
  {
    familiar: 'tvoj',
    formal: 'vaš',
    marker: /(?<!\p{L})tvo(?:j\p{L}*|g|ga|m|me|mu)(?!\p{L})/iu,
    caught: ['Tvoje ime', 'Твоје име'],
    spared: ['Vaše ime', 'Ваше име'],
  },
  {
    familiar: 'ti, tebe, tebi, tobom',
    formal: 'vi, vas, vam, vama',
    marker: /(?<!\p{L})(?:ti|tebe|tebi|tobom)(?!\p{L})/iu,
    caught: ['Organizator ti je poslao izmene.', 'Организатор ти је послао измене.'],
    spared: ['Organizator vam je poslao izmene.', 'Организатор вам је послао измене.'],
  },
  {
    familiar: 'Nastavi?',
    formal: 'Nastaviti?',
    marker: serbianCommand('nastavi'),
    caught: ['Skripta se više neće moći vizuelno uređivati. Nastavi?', 'Скрипта се више неће моћи визуелно уређивати. Настави?'],
    spared: ['Skripta se više neće moći vizuelno uređivati. Nastaviti?', 'Скрипта се више неће моћи визуелно уређивати. Наставити?'],
  },
  {
    familiar: 'Pokušaj ponovo',
    formal: 'Pokušajte ponovo',
    marker: serbianCommand('pokušaj ponovo'),
    caught: ['Došlo je do greške na mreži. Pokušaj ponovo.', 'Дошло је до грешке на мрежи. Покушај поново.'],
    spared: ['Došlo je do greške na mreži. Pokušajte ponovo.', 'Дошло је до грешке на мрежи. Покушајте поново.'],
  },
];

/** Spelt like a familiar form, but a command the user gives, a noun or a possessive. */
const SERBIAN_NOT_FAMILIAR = [
  'Sačuvaj i zatvori', 'Сачувај и затвори',
  'Pokušaj ponovo', 'Покушај поново',
  'Novi pokušaj za {count} sekundi...', 'Нови покушај за {count} секунди...',
  'Vaš odgovor', 'Ваш одговор',
  'Nikada ne označavaj automatski', 'Никада не означавај аутоматски',
];

/**
 * Strings the markers cannot see, because they open on the command: each was
 * said to the user in the singular, so none is a command the user gives.
 */
const SERBIAN_FORMAL_PINS: [key: string, latin: string, cyrillic: string][] = [
  ['settings.placeholderName', 'Vaše ime', 'Ваше име'],
  // A checkbox, but "Ostani prijavljen" told the user to stay, in the masculine.
  ['login.keepMeSignedIn', 'Ostanite prijavljeni', 'Останите пријављени'],
  // The sign-in button's text while sign-in is rate limited, telling the user to wait.
  ['login.wait', 'Sačekajte', 'Сачекајте'],
  // The app retrying on its own. "Pokušaj ponovo za {seconds} sekundi" read as
  // telling the user to try again.
  ['offline.tryingAgain.other', 'Novi pokušaj za {count} sekundi...', 'Нови покушај за {count} секунди...'],
];

describe('Serbian register and spelling', () => {
  it('reads every Serbian dictionary through, so an empty scan cannot pass', () => {
    for (const code of ['rs', 'sr']) expect(dictionariesOf(code).map(([file]) => file), code).toEqual(expect.arrayContaining([`core/${code}`, `caldav/${code}`, `carddav/${code}`, `gpg/${code}`, `managesieve/${code}`, `password/${code}`]));
  });

  it('reads every rs letter as Latin, so a Cyrillic word cannot slip past a marker', () => {
    expect(toLatin('Љубав, Њива, Џеп, Ђак, Шта, Жута, Ћуп, Чаша')).toBe('ljubav, njiva, džep, đak, šta, žuta, ćup, čaša');
    const left = stringsOf('rs').filter(([, text]) => /\p{Script=Cyrillic}/u.test(toLatin(text)));
    expect(left).toEqual([]);
  });

  it('has familiar-register markers that catch their forms and spare the formal ones, in both scripts', () => {
    for (const { familiar, marker, caught, spared } of SERBIAN_FAMILIAR) {
      for (const text of caught) expect(marker.test(toLatin(text)), `${familiar} in "${text}"`).toBe(true);
      for (const text of spared) expect(marker.test(toLatin(text)), `${familiar} in "${text}"`).toBe(false);
    }
    for (const text of SERBIAN_NOT_FAMILIAR) {
      expect(SERBIAN_FAMILIAR.filter(({ marker }) => marker.test(toLatin(text))).map(({ familiar }) => familiar), text).toEqual([]);
    }
  });

  it.each(SERBIAN_FAMILIAR.map((f) => [f.formal, f.familiar, f.marker] as const))('rs and sr say "%s", not "%s"', (_formal, _familiar, marker) => {
    expect(usingSerbian(marker)).toEqual([]);
  });

  it('says to the user formally what the markers cannot see', () => {
    const wrong = SERBIAN_FORMAL_PINS.flatMap(([key, latin, cyrillic]) => [
      ...(lookup(sr, key) === latin ? [] : [`sr:${key}="${lookup(sr, key)}"`]),
      ...(lookup(rs, key) === cyrillic ? [] : [`rs:${key}="${lookup(rs, key)}"`]),
    ]);
    expect(wrong).toEqual([]);
  });

  it('rs writes URL in Latin, as the rest of rs does', () => {
    // carddav/rs labelled the field "УРЛ", where the composer says "URL везе".
    expect(stringsOf('rs').filter(([, text]) => /(?<!\p{L})урл(?!\p{L})/iu.test(text))).toEqual([]);
    expect(lookup(byPlugin.get('carddav')!.get('rs'), 'contacts.url')).toBe('URL');
  });

  it.each(['rs', 'sr'])('%s uses no long dash', (code) => {
    expect(stringsOf(code).filter(([, text]) => text.includes('—'))).toEqual([]);
  });
});

/** A Serbian string in Latin letters, case kept: "ЊИВА" is "NJIVA", "Џеп" is "Džep". */
function transliterate(text: string): string {
  const letters = [...text];
  return letters
    .map((letter, i) => {
      const lower = letter.toLowerCase();
      const latin = CYRILLIC_TO_LATIN[lower];
      if (latin === undefined || letter === lower) return latin ?? letter;
      const next = letters[i + 1];
      return next !== undefined && next !== next.toLowerCase() ? latin.toUpperCase() : latin[0].toUpperCase() + latin.slice(1);
    })
    .join('');
}

/**
 * One concept, one word, in both scripts, taken from the UI's own heading.
 *
 *  - spam: "nepoželjno", the Junk folder's own name. The verdict buttons said
 *    "Spem", a transcription of the English sound that no other string used.
 *  - draft: "nacrt", the folder's own name ("Nacrti") and the composer's
 *    ("Odbaciti nacrt?"), over "radna verzija" in the reader's draft banner
 *    and "skica" in the sign-out notices, so one draft had three names.
 *  - e-mail: "e-pošta", as the sign-in field says ("Adresa e-pošte"), over
 *    "mejl server", "imejl" and "email poruke".
 */
const SERBIAN_TERMS: { term: string; not: string; marker: RegExp; caught: string[]; spared: string[]; heading: [key: string, latin: string] }[] = [
  {
    term: 'nepoželjno',
    not: 'Spem, neželjena pošta',
    marker: /(?<!\p{L})(?:spem|neželjen)/iu,
    caught: ['Prijavi kao Spem', 'Пријави као Спем', 'filter za neželjenu poštu'],
    spared: ['Prijavi kao nepoželjno', 'Пријави као непожељно', 'filter za nepoželjnu poštu', 'Spam', 'Спам'],
    heading: ['folderList.junk', 'Nepoželjno'],
  },
  {
    term: 'nacrt',
    not: 'radna verzija, skica',
    marker: /(?<!\p{L})(?:radn\p{L}* verzij|skic)/iu,
    caught: ['Odbaci radnu verziju', 'Одбаци радну верзију', 'Neke neposlate skice', 'још увек је у скицама'],
    spared: ['Odbaci nacrt', 'Одбаци нацрт', 'Neke neposlate nacrte', 'још увек је у Нацртима'],
    heading: ['folderList.drafts', 'Nacrti'],
  },
  {
    term: 'e-pošta',
    not: 'imejl, mejl, email, e-adresa',
    marker: /(?<!\p{L})(?:i?mejl(?!ing)|e-?mail|e-adres)/iu,
    caught: ['Ovaj mejl server', 'имејл о томе', 'Раније криптоване емаил поруке', 'Kontakt sa tom e-adresom'],
    spared: ['Ovaj server pošte', 'обавештење е-поштом', 'Адреса е-поште', 'Prijavite se na svoj vebmejl.'],
    heading: ['login.emailPlaceholder', 'Adresa e-pošte'],
  },
];

/**
 * English keeps two words for spam: the verdict ("Report Spam", "Not Spam")
 * and the folder it files into, which IMAP calls Junk. Serbian keeps one: the
 * verdict names the folder, "Prijavi kao nepoželjno" beside "Nepoželjno".
 * `folderList.spam` is a different folder, one literally named Spam, which the
 * sidebar keeps apart from Junk as English does; it keeps its own word,
 * spelled as Serbian spells the loanword.
 */
const SPAM_VERDICTS = ['messageReader.reportSpam', 'messageReader.notSpam'];

/**
 * A dialog's title names the action the dialog performs, as its button does,
 * so it takes the button's bare imperative: "Prebaci u sirovi režim" over a
 * "Prebaci" button, where it said "Prebacite". A title that asks opens on the
 * infinitive, as "Poslati izmene gostima?" does, not on the imperative
 * ("Odbaci nacrt?"). A title that is a sentence, ending in a full stop, is
 * said to the user and is formal ("Prijavite se na svoj vebmejl.").
 */
function titleSlip(text: string): string | null {
  const first = toLatin(text).split(/\s+/)[0];
  if (text.endsWith('?')) return /(?:ti|ći)$/u.test(first) ? null : 'asks without the infinitive';
  if (text.endsWith('.')) return null;
  return /(?:ite|jte)$/u.test(first) ? 'names its action in the formal imperative' : null;
}

/** Every title in both scripts' dictionaries, as `file:key` and text. Not the field labels. */
/**
 * Keys where the two scripts must differ: each alphabet sorts its own way, the
 * Latin abeceda ending at Ž, the Cyrillic azbuka at Ш, and the language picker
 * names Cyrillic Serbian in Cyrillic in both dictionaries.
 */
const SCRIPT_OWN: string[] = ['carddav:contacts.sortAz', 'carddav:contacts.sortZa', 'core:settings.localization.serbian'];

function serbianTitles(): [where: string, text: string][] {
  return ['rs', 'sr'].flatMap((code) => stringsOf(code).filter(([where]) => {
    const last = where.split('.').at(-1)!;
    return /title(?:Add|Edit)?$/i.test(last) && !['noTitle', 'eventTitle'].includes(last);
  }));
}

describe('Serbian terms, titles and twins', () => {
  it('has term markers that catch the other word and spare the chosen one, in both scripts', () => {
    for (const { term, marker, caught, spared } of SERBIAN_TERMS) {
      for (const text of caught) expect(marker.test(toLatin(text)), `${term}: "${text}"`).toBe(true);
      for (const text of spared) expect(marker.test(toLatin(text)), `${term}: "${text}"`).toBe(false);
      expect(caught.some((text) => /\p{Script=Cyrillic}/u.test(text)), term).toBe(true);
    }
  });

  it.each(SERBIAN_TERMS.map((t) => [t.term, t.not, t.marker] as const))('rs and sr say "%s", not "%s"', (_term, _not, marker) => {
    expect(usingSerbian(marker)).toEqual([]);
  });

  it("takes each term from the UI's own heading, in both scripts", () => {
    for (const { heading: [key, latin] } of SERBIAN_TERMS) {
      expect(lookup(sr, key), key).toBe(latin);
      expect(transliterate(String(lookup(rs, key))), key).toBe(latin);
    }
  });

  it('has a title rule that catches the formal imperative and the imperative question', () => {
    expect(titleSlip('Prebacite u sirovi režim')).not.toBeNull();
    expect(titleSlip('Пребаците у сирови режим')).not.toBeNull();
    expect(titleSlip('Odbaci nacrt?')).not.toBeNull();
    expect(titleSlip('Одбаци нацрт?')).not.toBeNull();
    for (const text of ['Prebaci u sirovi režim', 'Odbaciti nacrt?', 'Poslati izmene gostima?', 'Подешавања', 'Prijavite se na svoj vebmejl.']) {
      expect(titleSlip(text), text).toBeNull();
    }
  });

  it("names a dialog's action as its button does, and asks in the infinitive", () => {
    const titles = serbianTitles();
    expect(titles.length).toBeGreaterThan(30);
    const slips = titles.map(([where, text]) => [`${where}="${text}"`, titleSlip(text)] as const).filter(([, slip]) => slip !== null);
    expect(slips).toEqual([]);
  });

  it('transliterates case by case, so capitals compare too', () => {
    expect(transliterate('Љубав, ЊИВА, Џеп и Бцц')).toBe('Ljubav, NJIVA, Džep i Bcc');
  });

  it('sr says what rs says, letter for letter', () => {
    // A string fixed in one script and not the other drifts: sr said "Obriši
    // pretragu" where rs said "Очисти претрагу", and rs misspelled "Празњење".
    const latin = new Map(dictionariesOf('sr').map(([file, dict]) => [file.replace(/\/sr$/, ''), dict]));
    const apart = dictionariesOf('rs').flatMap(([file, dict]) => {
      const name = file.replace(/\/rs$/, '');
      return leaves(dict)
        .filter(([key]) => !SCRIPT_OWN.includes(`${name}:${key}`))
        .filter(([key, text]) => transliterate(String(text)) !== lookup(latin.get(name), key))
        .map(([key, text]) => `${name}:${key}: "${text}" / "${lookup(latin.get(name), key)}"`);
    });
    expect(apart).toEqual([]);
  });

  it('orders each alphabet its own way: A-Ž in Latin, А-Ш in Cyrillic', () => {
    const latin = byPlugin.get('carddav')!.get('sr');
    const cyrillic = byPlugin.get('carddav')!.get('rs');
    expect([lookup(latin, 'contacts.sortAz'), lookup(latin, 'contacts.sortZa')]).toEqual(['Sortiraj A-Ž', 'Sortiraj Ž-A']);
    expect([lookup(cyrillic, 'contacts.sortAz'), lookup(cyrillic, 'contacts.sortZa')]).toEqual(['Сортирај А-Ш', 'Сортирај Ш-А']);
  });

  it('names the spam verdict with the folder it files into, where English does not', () => {
    for (const [code, dict] of [['rs', rs], ['sr', sr]] as const) {
      const folder = transliterate(String(lookup(dict, 'folderList.junk'))).toLowerCase();
      for (const key of SPAM_VERDICTS) expect(transliterate(String(lookup(dict, key))).toLowerCase(), `${code}:${key}`).toContain(folder);
    }
    expect([lookup(sr, 'folderList.spam'), lookup(rs, 'folderList.spam')]).toEqual(['Spam', 'Спам']);
  });

  it('puts a folder name after "fascikla", never straight after "u"', () => {
    // A folder name arrives in the nominative, and "u" wants the accusative
    // (moved into) or the locative (in): "premeštena u Arhiva". After the noun
    // the name stands in apposition, where its case does not matter.
    const bare = [...stringsOf('rs'), ...stringsOf('sr')].filter(([, text]) => /(?<!\p{L})[uу] \{folder\}/u.test(text));
    expect(bare).toEqual([]);
  });
});

/**
 * Serbian capitalises a sentence's first word and proper names, where an
 * English title capitalises every word. The GPG plugin's titles, labels and
 * buttons had taken the English habit throughout ("Uvezi Postojeći GPG Par
 * Ključeva", "Lozinka (Obavezno)"), and so had the filter editor's "Novo
 * Pravilo".
 *
 * A word that does not open its sentence is written in lower case, unless it
 * is a name: an acronym in capitals (GPG), a name with a capital inside it
 * (WebAuthn, OpenPGP), one on the list below, or a folder's name. A sentence
 * opens after . ! ? : ; or … followed by whitespace, or after a line break,
 * not after a parenthesis or a slash. Quoted text and {placeholders} are not
 * the string's own words and are dropped first, and rs is read
 * transliterated, case kept, so one rule reads both scripts.
 */
const SERBIAN_NAMES = new Set([
  // The composer's Bcc field, by the name the identity settings give it.
  'Bcc',
]);

/**
 * The dictionaries capitalise a folder's name as a proper name, and Serbian
 * declines it ("u Nacrtima", "u Prijemnom sandučetu"). So a folder's name is
 * spared in the case forms its own ending takes, and only those: "Nacrt", a
 * draft rather than the Drafts folder, is not one, nor "Poslati" or
 * "Arhiviraj".
 */
const SERBIAN_DECLENSIONS: [ending: RegExp, endings: string[]][] = [
  // Prijemno, Poslato, Nepoželjno: the neuter adjective.
  [/o$/, ['o', 'og', 'oga', 'om', 'ome']],
  // Nacrti: a masculine plural.
  [/i$/, ['i', 'a', 'e', 'ima']],
  // Arhiva: a feminine noun.
  [/a$/, ['a', 'e', 'i', 'u', 'om']],
  // Otpad, Spam: a masculine noun, its name the stem.
  [/$/, ['', 'a', 'u', 'om', 'e']],
];
const SERBIAN_FOLDER_FORMS = new Set(['inbox', 'drafts', 'sent', 'archive', 'spam', 'junk', 'trash'].flatMap((key) => {
  const name = String(lookup(sr, `folderList.${key}`)).split(/\s+/)[0];
  const [ending, endings] = SERBIAN_DECLENSIONS.find(([pattern]) => pattern.test(name))!;
  return endings.map((form) => name.replace(ending, '') + form);
}));

/** The words of one Serbian string capitalised where Serbian writes them in lower case. */
function titleCased(text: string): string[] {
  const plain = transliterate(text).replace(/\{[^}]*\}/g, ' ').replace(/"[^"]*"|„[^“”]*[“”]/g, ' ');
  return plain.split(/(?<=[.!?:;…])\s+|\n/).flatMap((sentence) =>
    [...sentence.matchAll(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu)].slice(1).map(([word]) => word)
      .filter((word) => /^\p{Lu}/u.test(word) && !/\p{Lu}/u.test(word.slice(1)))
      .filter((word) => !SERBIAN_NAMES.has(word) && !SERBIAN_FOLDER_FORMS.has(word)));
}

describe('Serbian capitals', () => {
  it('has a rule that catches English title case and spares names, folders and new sentences', () => {
    expect(titleCased('Uvezi Postojeći GPG Par Ključeva')).toEqual(['Postojeći', 'Par', 'Ključeva']);
    expect(titleCased('Увоз Није Успео')).toEqual(['Nije', 'Uspeo']);
    expect(titleCased('Lozinka (Obavezno)')).toEqual(['Obavezno']);
    expect(titleCased('Kopiraj/Premesti u...')).toEqual(['Premesti']);
    // Spelt like a folder, but not one of its forms.
    expect(titleCased('Odbaci Nacrt')).toEqual(['Nacrt']);
    expect(titleCased('Nije moguće Poslati ni Arhivirati')).toEqual(['Poslati', 'Arhivirati']);
    for (const text of [
      'Uvezi postojeći GPG par ključeva', 'Ваш GPG кључ', '2FA / WebAuthn', 'Kriptovano pomoću OpenPGP-a',
      'Uvek dodaj mene u Bcc', 'Nove poruke u Prijemnom sandučetu', 'Нацрт је још увек у Нацртима.', 'Premesti u Otpad ili Arhivu?',
      'Pogrešna lozinka. Pokušajte ponovo.', 'Nije moguće kriptovati poruku: Nedostaju ključevi za:\n{keys}',
      'Fascikla "Moji Računi" je prazna.', 'Uvoz nije uspeo: {error}',
    ]) {
      expect(titleCased(text), text).toEqual([]);
    }
  });

  it.each(['rs', 'sr'])('%s capitalises only a sentence\'s first word and names', (code) => {
    const slips = stringsOf(code)
      .map(([where, text]) => [where, text, titleCased(text)] as const)
      .filter(([, , words]) => words.length > 0)
      .map(([where, text, words]) => `${where}="${text}": ${words.join(' ')}`);
    expect(slips).toEqual([]);
  });

  it('allows only names a Serbian string still uses, so the list cannot go stale', () => {
    const texts = [...stringsOf('rs'), ...stringsOf('sr')].map(([, text]) => transliterate(text));
    const unused = [...SERBIAN_NAMES].filter((name) => !texts.some((text) => new RegExp(`(?<!\\p{L})${name}(?!\\p{L})`, 'u').test(text)));
    expect(unused).toEqual([]);
  });
});

describe('terms within one locale', () => {
  it('fr calls calendars "calendrier", the calendar feature\'s own name', () => {
    // French names the feature "Calendrier" on its tab and throughout its
    // plugin; the load error alone called the same calendar an "agenda".
    expect(stringsOf('fr').filter(([, text]) => /(?<!\p{L})agendas?(?!\p{L})/iu.test(text))).toEqual([]);
    expect(lookup(fr, 'navigation.calendar')).toBe('Calendrier');
  });

  it('pt names an attachment without a file name in sentence case, as en does', () => {
    // "Anexo Desconhecido" took the English habit of a capital on every word.
    expect(lookup(pt, 'messageReader.unknownAttachment')).toBe('Anexo desconhecido');
  });
});

/**
 * A folder's name has the gender and number of whatever word it is: French
 * "Corbeille" is singular and "Indésirables" plural, Spanish "Papelera" is
 * feminine and "Spam" masculine, Serbian "Otpad" is masculine and
 * "Nepoželjno" neuter, and a folder the user named can be any of them. In
 * these languages a sentence agrees with its subject, so one whose subject is
 * the name fits some folders and misreads the rest: "{folder} ya estaba vacía"
 * said "Spam ya estaba vacía". After the word for folder ("la carpeta
 * {folder}", "fascikla {folder}") the name stands in apposition, and the
 * sentence agrees with the noun, whatever the folder is called.
 */
const AGREEING_LOCALES = ['es', 'fr', 'it', 'pt', 'rs', 'sr'];

/**
 * Whether a sentence of `text` opens on a folder's name and goes on to say
 * something of it. The name may be quoted, French guillemets with their inner
 * (non-breaking) space included, and a Spanish question or exclamation opens
 * on ¿ or ¡.
 */
const opensOnFolder = (text: string) =>
  /(?:^|[.!?:;–—…]\s+|[¿¡])["«“„]?\s?\{folder\}\s?["»”]?\s+\p{L}/u.test(text);

describe("a folder's name in a sentence", () => {
  it('has a rule that catches the name as a subject and spares it after a noun or a verb', () => {
    for (const text of [
      '{folder} ya estaba vacía: no se eliminó nada.', 'Terminé. {folder} está vacía.', 'Terminé… {folder} está vacía.',
      '¿{folder} ya estaba vacía?', '¡{folder} está vacía!', '«{folder}» était déjà vide.',
      '«\u00a0{folder}\u00a0» était déjà vide.', '« {folder} » était déjà vide.',
    ]) {
      expect(opensOnFolder(text), text).toBe(true);
    }
    for (const text of [
      'La carpeta {folder} ya estaba vacía.', 'Fascikla {folder} je već bila prazna.', 'Se ha vaciado {folder}.',
      'Vidage du dossier {folder}...', '¿Mover "{folder}" a la Papelera?', '¿Vaciar {folder}?', '{folder}: {count}',
    ]) {
      expect(opensOnFolder(text), text).toBe(false);
    }
  });

  it.each(AGREEING_LOCALES)("%s never opens a sentence on a folder's name", (code) => {
    expect(stringsOf(code).filter(([, text]) => opensOnFolder(text))).toEqual([]);
  });
});
