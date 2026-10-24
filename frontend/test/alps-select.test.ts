/**
 * alps-select's `disabled`.
 *
 * The select is in alps-select's shadow root, so a `disabled` set on the
 * element did nothing to it: the event editor disabled its calendar picker
 * for an existing event, and the picker could be changed all the same.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/alps-select';
import { cleanup, mount, update } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

afterEach(cleanup);

const select = (el: El) => el.shadowRoot!.querySelector('select')!;

describe('alps-select', () => {
  it('disables its select while it is disabled', async () => {
    const el = await mount<El>('alps-select', { options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] });
    expect(select(el).disabled).toBe(false);
    await update(el, { disabled: true });
    expect(select(el).disabled).toBe(true);
    await update(el, { disabled: false });
    expect(select(el).disabled).toBe(false);
  });

  it('takes `disabled` as an attribute, as a template sets it', async () => {
    const el = document.createElement('alps-select') as El;
    el.setAttribute('disabled', '');
    document.body.append(el);
    await el.updateComplete;
    expect(select(el).disabled).toBe(true);
    el.remove();
  });
});
