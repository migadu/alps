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
