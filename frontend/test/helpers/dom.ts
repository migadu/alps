/**
 * Helpers for component tests, and the jsdom shims setup.ts installs.
 */
import { expect } from 'vitest';

interface Updatable {
  updateComplete: Promise<unknown>;
}

const mounted = new Set<HTMLElement>();

/**
 * Creates `tag`, assigns `props`, connects it and waits for the first render.
 *
 * Without the await the shadow root is still empty, and an assertion that
 * something is ABSENT passes for a component that renders it fine.
 */
export async function mount<T extends HTMLElement = HTMLElement>(
  tag: string,
  props: Record<string, unknown> = {},
): Promise<T> {
  const el = document.createElement(tag) as T;
  Object.assign(el, props);
  document.body.appendChild(el);
  mounted.add(el);
  await (el as unknown as Updatable).updateComplete;
  return el;
}

/** Applies `props` to a mounted element and waits for the re-render. */
export async function update<T extends HTMLElement>(el: T, props: Record<string, unknown>): Promise<T> {
  Object.assign(el, props);
  await (el as unknown as Updatable).updateComplete;
  return el;
}

/** Removes everything mount() created. Call from afterEach. */
export function cleanup(): void {
  for (const el of mounted) el.remove();
  mounted.clear();
  document.body.innerHTML = '';
}

/** A shadow-root query that fails naming the selector, rather than as a null dereference later. */
export function shadow<E extends Element = HTMLElement>(el: HTMLElement, selector: string): E {
  const found = el.shadowRoot?.querySelector<E>(selector);
  expect(found, `${el.localName} has no ${selector} in its shadow root`).not.toBeNull();
  return found as E;
}

export function shadowAll<E extends Element = HTMLElement>(el: HTMLElement, selector: string): E[] {
  return Array.from(el.shadowRoot?.querySelectorAll<E>(selector) ?? []);
}

/**
 * The visible text of a shadow root (or of one node in it), whitespace collapsed.
 *
 * `<style>` is skipped: jsdom has no adoptedStyleSheets, so Lit appends real
 * style elements and raw textContent would include the whole stylesheet.
 */
export function text(el: HTMLElement, selector?: string): string {
  const node = selector ? el.shadowRoot?.querySelector(selector) : el.shadowRoot;
  if (!node) return '';
  let out = '';
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) {
      out += n.nodeValue ?? '';
      return;
    }
    if (n.nodeName === 'STYLE' || n.nodeName === 'SCRIPT') return;
    n.childNodes.forEach(walk);
  };
  walk(node);
  return out.replace(/\s+/g, ' ').trim();
}

/** Collects events of `type` fired on `target`, into a live array. */
export function record<T extends Event = Event>(target: EventTarget, type: string): T[] {
  const seen: T[] = [];
  target.addEventListener(type, (e) => seen.push(e as T));
  return seen;
}

/** Lets queued microtasks and a setTimeout(0) settle. */
export const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Clicks and waits for the re-render the click queued. */
export async function click(node: Element, host?: HTMLElement): Promise<void> {
  (node as HTMLElement).click();
  const owner = host ?? ((node.getRootNode() as ShadowRoot).host as HTMLElement | undefined);
  await (owner as unknown as Updatable | undefined)?.updateComplete;
  await flush();
}

/**
 * Waits for the state an assertion is about rather than a guessed number of
 * ticks. `maxTicks` is a backstop for a condition that never holds, counted in
 * ticks so a loaded machine measures the same thing as an idle one. Real
 * timers only.
 */
export async function waitFor(condition: () => boolean, what = 'the expected state', maxTicks = 200): Promise<void> {
  for (let tick = 0; tick < maxTicks; tick++) {
    if (condition()) return;
    await flush();
  }
  if (!condition()) throw new Error(`waitFor: gave up after ${maxTicks} ticks waiting for ${what}`);
}

/** jsdom has no layout, so no scrollIntoView; a no-op loses nothing observable. */
export function installScrollIntoView(): void {
  const proto = Element.prototype as unknown as Record<string, unknown>;
  if (typeof proto.scrollIntoView === 'function') return;
  proto.scrollIntoView = () => {};
}

/** jsdom ships no ResizeObserver; the reader's iframe sizing constructs one. */
export function installResizeObserver(): void {
  const g = globalThis as { ResizeObserver?: unknown };
  if (typeof g.ResizeObserver === 'function') return;
  g.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

/**
 * jsdom has no matchMedia. Width queries are answered from innerWidth, which
 * jsdom does track, so a test that sets the width still gets a truthful answer;
 * anything else reports false.
 */
export function installMatchMedia(): void {
  if (typeof window.matchMedia === 'function') return;
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*(\d+)px/.exec(query);
    const min = /min-width:\s*(\d+)px/.exec(query);
    const matches = max ? window.innerWidth <= Number(max[1]) : min ? window.innerWidth >= Number(min[1]) : false;
    return {
      media: query,
      matches,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    };
  }) as unknown as typeof window.matchMedia;
}

/**
 * jsdom's <dialog> has no showModal/close. ui-modal and alps-popup call them
 * from their update cycle, so without this every modal test reports an
 * unhandled rejection that looks like a real render failure. `open` is toggled
 * honestly and close() fires `close`, so dismissal stays testable.
 */
export function installDialogSupport(): void {
  const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  if (typeof proto.showModal === 'function' && typeof proto.close === 'function') return;
  proto.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  proto.show = function (this: HTMLDialogElement) {
    this.open = true;
  };
  proto.close = function (this: HTMLDialogElement, returnValue?: string) {
    if (!this.open) return;
    this.open = false;
    if (returnValue !== undefined) this.returnValue = returnValue;
    this.dispatchEvent(new Event('close'));
  };
}

/**
 * jsdom has no document.execCommand. ProseMirror calls it for an editor inside
 * a shadow root when it believes it is on Safari, which jsdom's navigator.vendor
 * suggests, and the throw escapes from a frame callback no test can await.
 */
export function installExecCommand(): void {
  const doc = document as unknown as Record<string, unknown>;
  if (typeof doc.execCommand === 'function') return;
  doc.execCommand = () => false;
}
