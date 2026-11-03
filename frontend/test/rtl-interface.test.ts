/**
 * A right-to-left interface: the document's direction follows the language,
 * the layout mirrors with it, and what is written left to right in every
 * language (addresses, passwords, dates, code) stays that way.
 *
 * jsdom lays nothing out and does not inherit `direction` from `dir`, so the
 * components under test are given `style.direction` themselves; what they read
 * is getComputedStyle, which a page with `dir="rtl"` answers the same way.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'lit';
import { cleanup, installDialogSupport, mount, record, shadow, shadowAll } from './helpers/dom';
import { readSources } from './helpers/sources';
import { I18nStore, textDirection } from '../src/store/i18n-store';
import { renderIcon } from '../src/utils/ui';
import '../src/components/alps-popup';
import '../src/components/alps-input';
import '../src/components/alps-sidebar';
import '../src/components/alps-attachment-preview';
import '../../plugins/caldav/frontend/calendar-mini-month';

installDialogSupport();

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

type El = HTMLElement & { updateComplete: Promise<unknown> } & Record<string, any>;

function key(target: Element, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  window.dispatchEvent(new MouseEvent('mouseup'));
  document.documentElement.dir = 'ltr';
  vi.restoreAllMocks();
  cleanup();
});

describe('the document direction', () => {
  it.each([
    ['ar', 'rtl'], ['he', 'rtl'], ['fa', 'rtl'], ['ur', 'rtl'],
    ['en', 'ltr'], ['da', 'ltr'], ['rs', 'ltr'], ['sr', 'ltr'], ['zh-Hans', 'ltr'],
  ])('reads %s as %s', (code, direction) => {
    expect(textDirection(code)).toBe(direction);
  });

  it('follows the language the store is set to, and back', async () => {
    const store = new I18nStore();
    expect(document.documentElement.dir).toBe('ltr');
    await store.setLanguage('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(store.getDirection()).toBe('rtl');
    await store.setLanguage('de');
    expect(document.documentElement.dir).toBe('ltr');
  });
});

describe('icons', () => {
  const svgOf = (name: string) => {
    const host = document.createElement('div');
    render(renderIcon(name), host);
    return host.querySelector('svg')!;
  };

  it.each(['caretRight', 'caretLeft', 'arrowLeft', 'arrowBendUpLeft', 'arrowBendUpRight', 'arrowUUpLeft', 'textIndent', 'sidebar'])(
    'mirrors %s, which points along the reading direction',
    (name) => {
      expect(svgOf(name).getAttribute('style')).toContain('scale: var(--ui-inline-direction, 1) 1');
    },
  );

  it.each(['caretDown', 'trash', 'arrowsClockwise', 'signOut', 'x'])('keeps %s as drawn', (name) => {
    expect(svgOf(name).getAttribute('style')).toBeNull();
  });
});

describe('alps-popup anchors', () => {
  // Room on both sides of the trigger, so no fallback moves the menu.
  const rect = { left: 400, right: 440, top: 200, bottom: 220, width: 40, height: 20, x: 400, y: 200 } as DOMRect;

  async function popup(props: Record<string, unknown>, direction: 'ltr' | 'rtl') {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ ...rect, toJSON: () => rect });
    const el = document.createElement('alps-popup') as El;
    el.innerHTML = '<button slot="trigger">Menu</button><button>One</button>';
    el.style.direction = direction;
    Object.assign(el, props);
    document.body.append(el);
    await el.updateComplete;
    el.open();
    await el.updateComplete;
    return el;
  }
  const classes = (el: El) => [...shadow(el, '.popup-content').classList];

  it.each([
    ['end', 'ltr', 'align-right'], ['end', 'rtl', 'align-left'],
    ['start', 'ltr', 'align-left'], ['start', 'rtl', 'align-right'],
    ['right', 'rtl', 'align-right'], ['left', 'rtl', 'align-left'],
  ] as const)('aligns %s in %s to the %s', async (align, direction, expected) => {
    const el = await popup({ align }, direction);
    expect(classes(el)).toContain(expected);
  });

  it.each([
    ['inline-end', 'ltr', 'position-right'], ['inline-end', 'rtl', 'position-left'],
    ['inline-start', 'rtl', 'position-right'],
  ] as const)('opens %s in %s on the %s', async (position, direction, expected) => {
    const el = await popup({ position, align: 'top' }, direction);
    expect(classes(el)).toContain(expected);
  });

  it('moves an open menu when the language switches direction', async () => {
    const el = await popup({ align: 'end' }, 'ltr');
    expect(classes(el)).toContain('align-right');
    el.style.direction = 'rtl';
    document.documentElement.dir = 'rtl';
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(classes(el)).toContain('align-left');
  });
});

describe('alps-input', () => {
  const inner = async (props: Record<string, unknown>) => {
    const el = await mount<El>('alps-input', { i18nStore, ...props });
    return shadow<HTMLInputElement>(el, 'input');
  };

  it.each(['email', 'password', 'url', 'number', 'tel', 'date', 'time'])('writes a %s value left to right', async (type) => {
    expect((await inner({ type })).dir).toBe('ltr');
  });

  it('lets text take its own direction, and a caller say otherwise', async () => {
    expect((await inner({ type: 'text' })).dir).toBe('auto');
    expect((await inner({ type: 'text', inputDir: 'ltr' })).dir).toBe('ltr');
    expect((await inner({ type: 'email', inputDir: 'auto' })).dir).toBe('auto');
  });

  it('keeps a password left to right while it is shown', async () => {
    const el = await mount<El>('alps-input', { i18nStore, type: 'password', value: 'secret' });
    el.showPassword = true;
    await el.updateComplete;
    const input = shadow<HTMLInputElement>(el, 'input');
    expect(input.type).toBe('text');
    expect(input.dir).toBe('ltr');
  });
});

describe('dragging a resize handle', () => {
  const press = (node: Element, clientX: number) =>
    node.dispatchEvent(new MouseEvent('mousedown', { clientX, bubbles: true, cancelable: true }));
  const move = (clientX: number) => window.dispatchEvent(new MouseEvent('mousemove', { clientX }));

  it.each(['ltr', 'rtl'])('widens the sidebar toward its inline end in %s', async (direction) => {
    const el = document.createElement('alps-sidebar') as El;
    Object.assign(el, { i18nStore, width: 250 });
    el.style.direction = direction;
    document.body.append(el);
    await el.updateComplete;
    const resizes = record<CustomEvent>(el, 'sidebar-resize');
    const outward = direction === 'rtl' ? -1 : 1;
    press(shadow(el, '.sidebar-resizer'), 250);
    move(250 + 50 * outward);
    move(250 - 30 * outward);
    expect(resizes.map((e) => e.detail.newWidth)).toEqual([300, 220]);
  });
});

describe('arrow keys follow what they move through', () => {
  it.each([
    ['ltr', 'ArrowLeft', 0], ['ltr', 'ArrowRight', 2],
    ['rtl', 'ArrowRight', 0], ['rtl', 'ArrowLeft', 2],
  ] as const)('in %s, %s in the attachment preview opens attachment %i', async (direction, name, expected) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })));
    const part = (Filename: string) => ({ Filename, Size: 10, MIMEType: '', Path: [2] });
    const el = document.createElement('alps-attachment-preview') as El;
    Object.assign(el, { attachments: [part('a.bin'), part('b.bin'), part('c.bin')], mailbox: 'INBOX', messageUid: '7', activeIndex: 1 });
    el.style.direction = direction;
    document.body.append(el);
    await el.updateComplete;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
    expect(el.activeIndex).toBe(expected);
    vi.unstubAllGlobals();
  });

  it.each([
    ['ltr', 'ArrowRight', 'October 15'], ['ltr', 'ArrowLeft', 'October 13'],
    ['rtl', 'ArrowLeft', 'October 15'], ['rtl', 'ArrowRight', 'October 13'],
  ] as const)('in %s, %s in the mini month moves to %s', async (direction, name, expected) => {
    const el = document.createElement('calendar-mini-month') as El;
    Object.assign(el, { i18nStore, year: 2026, month: 9, weekStart: 1, currentDate: new Date(2026, 9, 14) });
    el.style.direction = direction;
    document.body.append(el);
    await el.updateComplete;
    const stop = () => shadowAll<HTMLElement>(el, '.mini-day').find((d) => d.tabIndex === 0)!;
    key(stop(), name);
    await el.updateComplete;
    expect(stop().getAttribute('aria-label')).toContain(expected);
  });
});

/**
 * The stylesheets say start and end, not left and right, so the layout
 * mirrors by itself. What is left physical is listed with its reason; a new
 * physical side anywhere else fails here, and is either made logical or added
 * to the list with one.
 */
describe('stylesheets', () => {
  const PHYSICAL = /(?<![-\w])(margin-(?:left|right)|padding-(?:left|right)|border-(?:left|right)(?:-\w+)?|border-(?:top|bottom)-(?:left|right)-radius|text-align:\s*(?:left|right)|float:\s*(?:left|right)|left|right)\s*:\s*([^;`}]+)/g;

  /** file → declarations that stay physical, and why. */
  const ALLOWED: Record<string, { decls: string[]; why: string }> = {
    'src/pages/login-page.ts': {
      decls: ['padding-left: 36px', 'padding-left: 12px', 'padding-right: 36px', 'text-align: right'],
      why: 'the address and password are left to right while their icon follows the interface',
    },
    'src/components/alps-input.ts': {
      decls: ['padding-left: var(--input-leading-space)', 'padding-right: var(--input-trailing-space)', 'padding-left: var(--input-trailing-space)', 'padding-right: var(--input-leading-space)', 'text-align: right'],
      why: 'the same, for any field whose value is left to right',
    },
    'plugins/caldav/frontend/calendar-mini-month.ts': {
      decls: ['left: 50%'],
      why: 'centred with translateX(-50%), the same either way',
    },
  };

  /** Every css`` block and style attribute, with JS geometry left out. */
  function styleText(source: string): string {
    const blocks = [...source.matchAll(/css`([\s\S]*?)`/g)].map((m) => m[1]);
    const inline = [...source.matchAll(/style="([^"]*)"/g)].map((m) => m[1]);
    return [...blocks, ...inline].join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  }

  it('use logical sides, except where a physical one is the point', () => {
    const found: string[] = [];
    for (const [file, source] of Object.entries(readSources())) {
      if (file.includes('/i18n/')) continue;
      const text = styleText(source);
      for (const rule of text.split('}')) {
        const decls = [...rule.matchAll(PHYSICAL)].map((m) => `${m[1]}: ${m[2].trim()}`);
        // `left: 0; right: 0` (or any pair with one value) stretches: no side.
        const lefts = decls.filter((d) => /^left:/.test(d)).map((d) => d.slice(5).trim());
        const rights = decls.filter((d) => /^right:/.test(d)).map((d) => d.slice(6).trim());
        const symmetric = lefts.length > 0 && lefts.join() === rights.join();
        for (const decl of decls) {
          if (symmetric && /^(left|right):/.test(decl)) continue;
          if (ALLOWED[file]?.decls.includes(decl)) continue;
          found.push(`${file}: ${decl}`);
        }
      }
    }
    expect(found).toEqual([]);
  });
});
