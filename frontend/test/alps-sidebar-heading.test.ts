/**
 * One section heading for every sidebar.
 *
 * Mail's FOLDERS, Calendar's MY CALENDARS and Tasks' LISTS each had their own
 * heading markup and CSS, and they had drifted apart: mail's
 * `.sidebar-header-title` had 14px side padding, 0.5px tracking and the theme's
 * label font; calendar's and tasks' were bare h3s with no side padding, the
 * browser's bold and a 12px margin below. `<alps-sidebar-heading>` is now the
 * one. It renders in the host's own root (no shadow root), so the host's rows
 * and the heading share one stylesheet and one set of selectors.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount } from './helpers/dom';
import { readSources } from './helpers/sources';
import { rulesOf } from './helpers/styles';
import { sectionHeadingStyles } from '../src/components/alps-sidebar-heading';

afterEach(() => {
  cleanup();
});

describe('<alps-sidebar-heading>', () => {
  it('renders its title in an h3, in the host root rather than a shadow root', async () => {
    const el = await mount('alps-sidebar-heading', { heading: 'Folders' });
    expect(el.shadowRoot).toBeNull();
    expect(el.querySelector('h3.section-heading')?.textContent?.trim()).toBe('Folders');
  });
});

describe('its styles exist once', () => {
  const rules = rulesOf(sectionHeadingStyles.cssText);

  it('styles the heading in the theme label font', () => {
    const heading = rules.find((r) => r.selectorText === '.section-heading');
    expect(heading?.style.getPropertyValue('font-family')).toBe('var(--font-label)');
    expect(heading?.style.getPropertyValue('text-transform')).toBe('uppercase');
  });

  const sources = readSources();
  const own = (path: string) => path.endsWith('/components/alps-sidebar-heading.ts');
  const offenders = (pattern: RegExp) =>
    Object.entries(sources)
      .filter(([path]) => !own(path))
      .flatMap(([path, source]) => [...source.matchAll(pattern)].map((m) => `${path}: ${m[0]}`));

  it('is the only definition of the heading, its markup and its CSS', () => {
    expect(offenders(/\.section-heading[^{\n]*\{/g)).toEqual([]);
    expect(offenders(/class="section-heading"/g)).toEqual([]);
    expect(offenders(/sidebar-header-title/g)).toEqual([]);
  });

  it.each([
    ['mail', 'src/components/folder-list.ts'],
    ['calendar', 'plugins/caldav/frontend/calendar-page.ts'],
    ['tasks', 'plugins/caldav/frontend/tasks-page.ts'],
  ])('%s heads its sections with it, and no h3 of its own', (_page, path) => {
    expect(sources[path]).toBeDefined();
    expect(sources[path]).toMatch(/<alps-sidebar-heading\b/);
    expect(sources[path]).toMatch(/sectionHeadingStyles/);
    expect(sources[path]).not.toMatch(/<h3[\s>]/);
  });
});
