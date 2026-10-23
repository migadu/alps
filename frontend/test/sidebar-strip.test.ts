/**
 * The sidebar tells its contents whether it is the collapsed strip.
 *
 * The strip is collapsed, not peeking, not mobile. That answer used to be
 * rebuilt in each of five sidebars from three props, with every page tracking
 * the peek only to pass it back down, and it drove the same three things in
 * each: the wrapper's `collapsed` class, `inert` on the content and the create
 * button's small form. Now `alps-sidebar` provides it once and three consumers
 * apply it wherever they sit beneath it: inline in the page (calendar, tasks,
 * settings) or inside a component's own shadow root (mail, contacts).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { LitElement, html } from 'lit';
import { cleanup } from './helpers/dom';
import { readSources } from './helpers/sources';
import { rulesOf } from './helpers/styles';
import { inSidebar, setSidebar, settleSidebar } from './helpers/sidebar';
import { sidebarLayoutStyles } from '../src/components/alps-sidebar';
import '../src/components/alps-sidebar-strip';
import '../src/components/alps-create-button';

/** A sidebar's content with its own shadow root, as the folder list is. */
class ShadowContent extends LitElement {
  static styles = [sidebarLayoutStyles];
  render() {
    return html`
      <alps-sidebar-frame class="sidebar-wrapper">
        <div class="sidebar-header"><alps-create-button></alps-create-button></div>
        <alps-sidebar-content class="sidebar-content"><button>row</button></alps-sidebar-content>
      </alps-sidebar-frame>
    `;
  }
}
customElements.define('test-shadow-content', ShadowContent);

afterEach(() => {
  cleanup();
});

/** The inline content (calendar, settings) and the shadow content (mail…), as one reading. */
function read(sidebar: HTMLElement) {
  const shadow = sidebar.querySelector('test-shadow-content')!.shadowRoot!;
  const roots: ParentNode[] = [sidebar, shadow];
  return roots.map((root) => ({
    frame: root.querySelector('alps-sidebar-frame')!.classList.contains('collapsed'),
    inert: root.querySelector('alps-sidebar-content')!.hasAttribute('inert'),
    strip: root.querySelector('alps-sidebar-content')!.hasAttribute('strip'),
    create: root.querySelector('alps-create-button')!.hasAttribute('collapsed'),
  }));
}

async function mountBoth(sidebarProps: { collapsed?: boolean; isMobile?: boolean } = {}) {
  const { sidebar } = await inSidebar('test-shadow-content', {}, sidebarProps);
  // Inline content, slotted beside it, as calendar-page renders its own.
  const inline = document.createElement('div');
  inline.innerHTML = `
    <alps-sidebar-frame class="sidebar-wrapper">
      <div class="sidebar-header"><alps-create-button></alps-create-button></div>
      <alps-sidebar-content class="sidebar-content"><button>row</button></alps-sidebar-content>
    </alps-sidebar-frame>`;
  sidebar.prepend(...inline.children);
  await settleSidebar(sidebar);
  return sidebar;
}

const EXPANDED = { frame: false, inert: false, strip: false, create: false };
const STRIP = { frame: true, inert: true, strip: true, create: true };

describe('alps-sidebar provides the strip state to everything beneath it', () => {
  it('is expanded by default', async () => {
    const sidebar = await mountBoth();
    expect(read(sidebar)).toEqual([EXPANDED, EXPANDED]);
  });

  it('is the strip when collapsed, inline and inside a shadow root alike', async () => {
    const sidebar = await mountBoth({ collapsed: true });
    expect(read(sidebar)).toEqual([STRIP, STRIP]);
  });

  it('is not the strip while it peeks open, and is again when the peek closes', async () => {
    const sidebar = await mountBoth({ collapsed: true });
    await setSidebar(sidebar, { peeking: true });
    expect(read(sidebar)).toEqual([EXPANDED, EXPANDED]);
    await setSidebar(sidebar, { peeking: false });
    expect(read(sidebar)).toEqual([STRIP, STRIP]);
  });

  it('is never the strip on mobile, whatever the saved setting says', async () => {
    const sidebar = await mountBoth({ collapsed: true, isMobile: true });
    expect(read(sidebar)).toEqual([EXPANDED, EXPANDED]);
  });

  it('follows an expand', async () => {
    const sidebar = await mountBoth({ collapsed: true });
    await setSidebar(sidebar, { collapsed: false });
    expect(read(sidebar)).toEqual([EXPANDED, EXPANDED]);
  });

  it('keeps the create button live in the strip: it sits outside the inert content', async () => {
    const sidebar = await mountBoth({ collapsed: true });
    const shadow = sidebar.querySelector('test-shadow-content')!.shadowRoot!;
    for (const root of [sidebar, shadow]) {
      expect(root.querySelector('alps-create-button')!.closest('[inert]')).toBeNull();
    }
  });
});

describe('the strip is dimmed in one place', () => {
  const rules = rulesOf(sidebarLayoutStyles.cssText);

  it('dims alps-sidebar-content[strip] and takes the pointer from it', () => {
    const rule = rules.find((r) => r.selectorText === 'alps-sidebar-content[strip]');
    expect(rule?.style.getPropertyValue('opacity')).toBe('0.5');
    expect(rule?.style.getPropertyValue('pointer-events')).toBe('none');
  });

  it('no longer keys the dimming on the wrapper class', () => {
    expect(rules.map((r) => r.selectorText)).not.toContain('.sidebar-wrapper.collapsed .sidebar-content');
  });
});

describe('no sidebar works the strip out for itself (source pin)', () => {
  const sources = readSources();
  const offenders = (pattern: RegExp) =>
    Object.entries(sources)
      .filter(([path]) => !path.endsWith('/components/alps-sidebar.ts'))
      .flatMap(([path, source]) => [...source.matchAll(pattern)].map((m) => `${path}: ${m[0]}`));

  it('reads the sources', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100);
  });

  it('tracks no peek state outside alps-sidebar', () => {
    expect(offenders(/sidebarPeeking|@peek-change/g)).toEqual([]);
  });

  it('binds no strip state by hand: no ?inert, no collapsed create button, no collapsed wrapper class', () => {
    expect(offenders(/class="sidebar-[a-z]+"[^>]*\?inert=\$\{/g)).toEqual([]);
    expect(offenders(/<alps-create-button[^>]*\?collapsed=/g)).toEqual([]);
    expect(offenders(/class="sidebar-wrapper \$\{/g)).toEqual([]);
  });
});
