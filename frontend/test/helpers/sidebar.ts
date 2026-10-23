/**
 * Mounts a sidebar's content the way every page does: slotted into a real
 * `alps-sidebar`, which is what tells it whether it is the collapsed strip
 * (`sidebarStripContext`). A content component mounted bare has no sidebar
 * above it and is always expanded.
 */
import type { AlpsSidebar } from '../../src/components/alps-sidebar';
import '../../src/components/alps-sidebar';
import { flush, mount } from './dom';

interface Updatable {
  updateComplete: Promise<unknown>;
}

/** Lets the context reach its consumers and each of them re-render. */
export async function settleSidebar(root: Element, ticks = 3): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    await flush();
    const nodes = [root, ...root.querySelectorAll('*')];
    for (const node of nodes) {
      await (node as unknown as Partial<Updatable>).updateComplete;
      if ((node as HTMLElement).shadowRoot) {
        for (const inner of (node as HTMLElement).shadowRoot!.querySelectorAll('*')) {
          await (inner as unknown as Partial<Updatable>).updateComplete;
        }
      }
    }
  }
}

/** Mounts `tag` inside an `alps-sidebar` with `sidebarProps`; cleanup() removes both. */
export async function inSidebar<T extends HTMLElement = HTMLElement>(
  tag: string,
  props: Record<string, unknown> = {},
  sidebarProps: Partial<Pick<AlpsSidebar, 'collapsed' | 'isMobile' | 'i18nStore'>> = {},
): Promise<{ sidebar: AlpsSidebar; el: T }> {
  const el = document.createElement(tag) as T;
  Object.assign(el, props);
  const sidebar = await mount<AlpsSidebar>('alps-sidebar', sidebarProps);
  sidebar.append(el);
  await settleSidebar(sidebar);
  return { sidebar, el };
}

/** Collapses, expands or peeks the sidebar as its own pointer handling would. */
export async function setSidebar(
  sidebar: AlpsSidebar,
  props: Partial<Pick<AlpsSidebar, 'collapsed' | 'isMobile' | 'peeking'>>,
): Promise<void> {
  // `collapsed` and `isMobile` reset `peeking` in willUpdate, so set those
  // first and let them land before a peek is opened.
  const { peeking, ...rest } = props;
  Object.assign(sidebar, rest);
  await settleSidebar(sidebar);
  if (peeking !== undefined) {
    sidebar.peeking = peeking;
    await settleSidebar(sidebar);
  }
}
