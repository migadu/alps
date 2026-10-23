/**
 * The web app manifest: what an installed alps is called, and how its icon is
 * drawn on a home screen.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONTEND = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(FRONTEND, 'public/site.webmanifest'), 'utf8'));
const title = /<title>([^<]*)<\/title>/.exec(readFileSync(resolve(FRONTEND, 'index.html'), 'utf8'))?.[1];

describe('the web app manifest', () => {
  it('names the app as the page does', () => {
    expect(manifest.name).toBe(title);
    expect(manifest.short_name).toBe('Webmail');
  });

  it('offers its icons as they are drawn, not as maskable', () => {
    // The edelweiss reaches the edge of the image. A maskable icon is cropped
    // to its middle 80%, which cuts the petals off.
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons) expect(icon.purpose, icon.src).toBe('any');
  });
});
