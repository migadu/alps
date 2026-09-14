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

    const placeholders = (v: unknown) => (typeof v === 'string' ? [...v.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join() : '');
    for (const [key, value] of leaves(source)) {
      const want = placeholders(value);
      const got = placeholders(lookup(dict, key));
      if (want && typeof lookup(dict, key) === 'string' && want !== got) problems.push(`${name}/${code}: ${key} has {${got}} where en has {${want}}`);
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
    const plurals = keysOf(mergedEn).filter((k) => isPlural(lookup(mergedEn, k)));
    expect(plurals.length).toBeGreaterThan(5);
    const offenders: string[] = [];
    for (const [file, text] of Object.entries(SOURCES)) {
      for (const key of plurals) {
        if (new RegExp(`t\\(\\s*['"\`]${key.replace(/\./g, '\\.')}['"\`]\\s*\\)`).test(text)) offenders.push(`${key} (${file})`);
      }
    }
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
