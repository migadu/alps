/**
 * Every icon is drawn from the sprite at one address.
 *
 * renderIcon() names the sprite with a version, so that a browser drops a
 * copy it cached once the icons change. The filter editor's arrow between a
 * rule's conditions and its actions wrote an address of its own, naming an
 * older version, so a browser could draw it from a stale sprite. It is drawn
 * with renderIcon() now.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'lit';
import { renderIcon } from '../src/utils/ui';
import '../../plugins/managesieve/frontend/visual-editor';
import { cleanup, mount, shadow } from './helpers/dom';
import { readSources } from './helpers/sources';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en', addEventListener: () => {}, removeEventListener: () => {} };

/** The address renderIcon() draws `name` from. */
function spriteAddress(name: string): string {
  const host = document.createElement('div');
  render(renderIcon(name), host);
  return host.querySelector('use')!.getAttribute('href')!;
}

afterEach(cleanup);

describe('the sprite', () => {
  it('is named by renderIcon() alone', () => {
    const elsewhere = Object.entries(readSources())
      .filter(([path, source]) => path !== 'src/utils/ui.ts' && source.includes('sprite.svg'))
      .map(([path]) => path);
    expect(elsewhere).toEqual([]);
  });

  it("draws the filter editor's arrow between conditions and actions", async () => {
    const el = await mount<El>('alps-visual-editor', {
      i18nStore,
      folders: ['INBOX'],
      state: {
        rules: [{
          id: 'r1',
          matchType: 'all',
          conditions: [{ field: 'Subject', operator: 'contains', value: 'invoice' }],
          actions: [{ type: 'discard', value: '' }],
        }],
      },
    });
    expect(shadow(el, '.connector use').getAttribute('href')).toBe(spriteAddress('arrow-fat-lines-down'));
  });
});
