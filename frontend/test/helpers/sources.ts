/**
 * Source text for the tests that scan it, read from disk.
 *
 * Read with node:fs rather than import.meta.glob('?raw'): the glob goes through
 * Vite's transform cache, which can serve a file's previous contents, and a
 * guard checked against a revert it cannot see proves nothing.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND_SRC = resolve(HERE, '../../src');
const PLUGINS = resolve(HERE, '../../../plugins');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('.ts') && !full.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

/** Path -> text for the frontend and every plugin's frontend, keyed `src/…` and `plugins/…`. */
export function readSources(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const file of walk(FRONTEND_SRC)) out[`src/${relative(FRONTEND_SRC, file)}`] = readFileSync(file, 'utf8');
  for (const file of walk(PLUGINS)) {
    const rel = relative(PLUGINS, file);
    if (/^[^/]+\/frontend\//.test(rel)) out[`plugins/${rel}`] = readFileSync(file, 'utf8');
  }
  return out;
}
