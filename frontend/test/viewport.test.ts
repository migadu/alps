/**
 * The viewport lets the page be pinch-zoomed.
 *
 * It declared `maximum-scale=1.0, user-scalable=0`, which Chrome on Android
 * honours: nothing in alps could be zoomed there. iOS has ignored both for the
 * user's own pinch since iOS 10, and there `maximum-scale=1` still stops Safari
 * zooming into a focused 14px field, so iOS alone gets the cap, at boot.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { capFocusZoomOnIOS } from '../src/utils/viewport';

const FRONTEND = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const page = readFileSync(resolve(FRONTEND, 'index.html'), 'utf8');

const DECLARED = 'width=device-width, initial-scale=1.0';

function viewport(): HTMLMetaElement {
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = DECLARED;
  document.head.append(meta);
  return meta;
}

const browser = (userAgent: string, platform = '', maxTouchPoints = 0) =>
  ({ userAgent, platform, maxTouchPoints }) as Navigator;

afterEach(() => document.head.querySelectorAll('meta[name="viewport"]').forEach(meta => meta.remove()));

describe('the viewport', () => {
  it('declares no scale limit', () => {
    const content = /<meta name="viewport" content="([^"]*)"/.exec(page)?.[1];
    expect(content).toBe(DECLARED);
  });

  it('is capped on an iPhone', () => {
    const meta = viewport();
    capFocusZoomOnIOS(document, browser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15'));
    expect(meta.content).toBe(`${DECLARED}, maximum-scale=1`);
  });

  it('is capped on an iPad that asks for the desktop site', () => {
    const meta = viewport();
    capFocusZoomOnIOS(document, browser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 'MacIntel', 5));
    expect(meta.content).toBe(`${DECLARED}, maximum-scale=1`);
  });

  it('is left alone on Android and on a Mac', () => {
    const meta = viewport();
    capFocusZoomOnIOS(document, browser('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36', 'Linux armv8l', 5));
    capFocusZoomOnIOS(document, browser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 'MacIntel', 0));
    expect(meta.content).toBe(DECLARED);
  });

  it('is capped once however often it is asked', () => {
    const meta = viewport();
    const iphone = browser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X)');
    capFocusZoomOnIOS(document, iphone);
    capFocusZoomOnIOS(document, iphone);
    expect(meta.content).toBe(`${DECLARED}, maximum-scale=1`);
  });
});
