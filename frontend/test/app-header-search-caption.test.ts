/**
 * What the header's search box is labelled with while the mail tab is open:
 * the folder on screen, named as the sidebar names it.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/app-header';
import { cleanup, mount, shadow } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => ({ 'folderList.trash': 'Papierkorb' } as Record<string, string>)[key] ?? key,
  getLanguage: () => 'de',
  getIntlLanguage: () => 'de',
});

const mb = (Name: string, Attrs: string[] = []) => ({ Name, Attrs, Delimiter: '/' });

async function placeholder(props: Record<string, unknown>): Promise<string> {
  const el = await mount<El>('app-header', { i18nStore, ...props });
  return shadow<El>(el, 'alps-input').placeholder;
}

afterEach(() => cleanup());

describe('the search box names the folder on screen', () => {
  it('by its role when it is the special folder', async () => {
    expect(await placeholder({ currentMailbox: 'Bin', mailboxes: [mb('INBOX'), mb('Bin', ['\\Trash'])] })).toBe('Papierkorb');
  });

  it("by its own name when it only spells one, beside the server's own", async () => {
    const mailboxes = [mb('INBOX'), mb('Bin', ['\\Trash']), mb('Trash')];
    expect(await placeholder({ currentMailbox: 'Trash', mailboxes })).toBe('Trash');
  });
});
