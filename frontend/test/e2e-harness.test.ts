/**
 * Where scripts/e2e.sh has Playwright put its traces and screenshots.
 *
 * Playwright empties its output directory when a run starts. When every run
 * wrote to frontend/test-results, a run started beside another one on a
 * different E2E_PORT deleted what the first had written so far, and the two
 * then wrote into one directory. The directory now goes with the run's logs,
 * which are per port.
 *
 * The harness runs here with stand-ins for the tools it calls: `go` builds
 * programs that only wait to be stopped, `psql`, `curl` and `lsof` answer as a
 * free machine would, and `npx` writes down the E2E_RESULTS it was given
 * instead of starting Playwright.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONTEND = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = resolve(FRONTEND, '../scripts/e2e.sh');

const STUBS: Record<string, string> = {
  go: `while [ $# -gt 0 ]; do [ "$1" = -o ] && out="$2"; shift; done
printf '#!/bin/sh\\nexec sleep 30\\n' >"$out"
chmod +x "$out"`,
  psql: 'exit 0',
  curl: 'exit 0',
  lsof: 'exit 1',
  npm: 'exit 0',
  npx: 'printf "%s" "${E2E_RESULTS-}" >"$RECORD"',
};

// Real paths: bash reports the one it starts in without macOS's /var link.
let root = '';
let bin = '';
let sora = '';
beforeAll(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'alps-e2e-harness-')));
  bin = join(root, 'bin');
  mkdirSync(bin);
  for (const [name, body] of Object.entries(STUBS)) {
    writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`);
    chmodSync(join(bin, name), 0o755);
  }
  sora = join(root, 'sora');
  mkdirSync(join(sora, 'cmd/sora'), { recursive: true });
  writeFileSync(join(sora, 'cmd/sora/main.go'), 'package main\n');
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

/** A directory for a run to start in and to use as its TMPDIR. */
const runDir = () => mkdtempSync(join(root, 'run-'));

/** Runs the harness from `dir` and returns the directory Playwright would write to. */
function outputDir(dir: string, env: Record<string, string>): string {
  const record = join(dir, 'record');
  const run = spawnSync('bash', [SCRIPT], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 50_000,
    env: {
      PATH: `${bin}:${process.env.PATH}`,
      HOME: process.env.HOME ?? dir,
      TMPDIR: dir,
      SORA_DIR: sora,
      E2E_SKIP_BUILD: '1',
      RECORD: record,
      ...env,
    },
  });
  expect(run.status, run.stderr).toBe(0);
  // Playwright reads a relative outputDir from the directory of its config.
  return resolve(FRONTEND, readFileSync(record, 'utf8') || 'test-results');
}

// A run starts a hundred or so short processes, which a busy machine can make
// take several seconds.
describe('the e2e harness', { timeout: 60_000 }, () => {
  it("keeps each port's results with that port's logs", () => {
    const dir = runDir();
    expect(outputDir(dir, { E2E_PORT: '8900' })).toBe(join(dir, 'alps-e2e-logs-8900/test-results'));
    expect(outputDir(dir, { E2E_PORT: '8912' })).toBe(join(dir, 'alps-e2e-logs-8912/test-results'));
  });

  it('keeps them with a relative E2E_LOGS too, rather than under frontend/', () => {
    const dir = runDir();
    expect(outputDir(dir, { E2E_PORT: '8900', E2E_LOGS: 'logs' })).toBe(join(dir, 'logs/test-results'));
  });

  it('keeps an E2E_RESULTS the caller sets', () => {
    const dir = runDir();
    const own = join(dir, 'own-results');
    expect(outputDir(dir, { E2E_PORT: '8900', E2E_RESULTS: own })).toBe(own);
  });
});
