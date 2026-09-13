/**
 * The shared dialogs: ui-modal, ui-confirm and ui-prompt.
 *
 * They sit in front of every destructive or naming action in the app, so what
 * they must get right is which answer was given, exactly once, and — for the
 * prompt — that what the user typed survives the owner re-rendering.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount, record, shadow, shadowAll, text, update } from './helpers/dom';
import { I18nStore } from '../src/store/i18n-store';
import '../src/components/ui-modal';
import '../src/components/ui-confirm';
import '../src/components/ui-prompt';

afterEach(cleanup);

const dialogOf = (modal: HTMLElement) => shadow<HTMLDialogElement>(modal, 'dialog');

describe('ui-modal', () => {
  it('opens itself modally on first render', async () => {
    const modal = await mount('ui-modal');
    expect(dialogOf(modal).open).toBe(true);
  });

  it('shows a title, marks it dangerous when asked, and omits the heading without one', async () => {
    const modal = await mount('ui-modal', { title: 'Delete folder', isDanger: true, width: '520px' });
    expect(text(modal, 'h3')).toBe('Delete folder');
    expect(shadow(modal, 'h3').classList.contains('danger')).toBe(true);
    expect(shadow(modal, '.modal-card').getAttribute('style')).toContain('width: 520px');
    await update(modal, { title: '' });
    expect(modal.shadowRoot!.querySelector('h3')).toBeNull();
  });

  it('refuses Escape unless it is dismissible', async () => {
    const modal = await mount('ui-modal');
    const escape = new Event('cancel', { cancelable: true });
    dialogOf(modal).dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);

    await update(modal, { dismissible: true });
    const allowed = new Event('cancel', { cancelable: true });
    dialogOf(modal).dispatchEvent(allowed);
    expect(allowed.defaultPrevented).toBe(false);
  });

  it('turns the dialog closing into a cancel', async () => {
    const modal = await mount('ui-modal', { dismissible: true });
    const cancels = record(modal, 'cancel');
    dialogOf(modal).close();
    expect(cancels).toHaveLength(1);
  });

  it('cancels on a backdrop press only when dismissible, and never from inside the card', async () => {
    const press = (target: Element) => target.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));

    const fixed = await mount('ui-modal');
    const fixedCancels = record(fixed, 'cancel');
    press(dialogOf(fixed));
    expect(fixedCancels).toHaveLength(0);

    const loose = await mount('ui-modal', { dismissible: true });
    const looseCancels = record(loose, 'cancel');
    press(shadow(loose, '.modal-card'));
    expect(looseCancels).toHaveLength(0);
    press(dialogOf(loose));
    expect(looseCancels).toHaveLength(1);
  });
});

describe('ui-confirm', () => {
  const buttons = (el: HTMLElement) => shadowAll<HTMLElement>(el, 'alps-button');

  it('asks a cautious question by default, with Cancel from the dictionary', async () => {
    const el = await mount('ui-confirm', { i18nStore: new I18nStore() });
    expect(text(el)).toContain('Are you sure?');
    expect(buttons(el).map((b) => b.textContent?.trim())).toEqual(['Cancel', 'Confirm']);
  });

  it('translates Cancel when the caller passes no text', async () => {
    const de = new I18nStore();
    await de.setLanguage('de');
    const el = await mount('ui-confirm', { i18nStore: de });
    expect(buttons(el)[0].textContent?.trim()).toBe(de.t('general.cancel'));
    expect(buttons(el)[0].textContent?.trim()).not.toBe('Cancel');
  });

  it('uses the wording it is given, and offers a secondary answer only when named', async () => {
    const el = await mount('ui-confirm', { title: 'Discard?', message: 'Your draft is lost.', confirmText: 'Discard', cancelText: 'Keep' });
    expect(buttons(el).map((b) => b.textContent?.trim())).toEqual(['Keep', 'Discard']);
    await update(el, { secondaryText: 'Save draft' });
    expect(buttons(el).map((b) => b.textContent?.trim())).toEqual(['Keep', 'Save draft', 'Discard']);
  });

  it('styles the confirm button as dangerous when asked', async () => {
    const el = await mount('ui-confirm', { isDanger: true });
    expect(buttons(el).at(-1)!.getAttribute('variant')).toBe('danger');
  });

  it('emits exactly one event per answer, and no stray click', async () => {
    const el = await mount('ui-confirm', { secondaryText: 'Other' });
    const confirms = record(el, 'confirm');
    const cancels = record(el, 'cancel');
    const secondaries = record(el, 'secondary');
    const clicks = record(document, 'click');
    const [cancel, secondary, confirm] = buttons(el);
    confirm.click();
    secondary.click();
    cancel.click();
    expect([confirms.length, secondaries.length, cancels.length]).toEqual([1, 1, 1]);
    expect(clicks).toHaveLength(0);
  });

  it('re-emits the modal\'s cancel once', async () => {
    const el = await mount('ui-confirm', { dismissible: true });
    const cancels = record(el, 'cancel');
    shadow(el, 'ui-modal').dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
    expect(cancels).toHaveLength(1);
  });
});

describe('ui-prompt', () => {
  type Field = { id: string; label: string; value?: string; autofocus?: boolean };
  const folderField = (over: Partial<Field> = {}): Field[] => [{ id: 'name', label: 'Folder name', value: 'Work', ...over }];
  const inputOf = (el: HTMLElement, id: string) => shadow<HTMLElement & { value: string }>(el, `alps-input[inputId="${id}"]`);
  const buttons = (el: HTMLElement) => shadowAll<HTMLElement>(el, 'alps-button');

  async function typeInto(el: HTMLElement, id: string, value: string) {
    const input = inputOf(el, id);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await (el as any).updateComplete;
  }

  it('renders a labelled input per field, seeded from its value', async () => {
    const el = await mount('ui-prompt', { fields: [...folderField(), { id: 'parent', label: 'Parent' }] });
    expect(shadowAll(el, 'label').map((l) => [l.getAttribute('for'), l.textContent])).toEqual([['name', 'Folder name'], ['parent', 'Parent']]);
    expect(inputOf(el, 'name').value).toBe('Work');
    expect(inputOf(el, 'parent').value).toBe('');
  });

  it('submits every field, the edited and the untouched', async () => {
    const el = await mount('ui-prompt', { fields: [...folderField(), { id: 'parent', label: 'Parent', value: 'INBOX' }] });
    const submits = record<CustomEvent>(el, 'submit');
    await typeInto(el, 'name', 'Receipts');
    buttons(el)[1].click();
    expect(submits.map((e) => e.detail)).toEqual([{ name: 'Receipts', parent: 'INBOX' }]);
  });

  it('keeps what was typed when the owner re-renders with an equal field set', async () => {
    // Owners pass the fields inline, a new array on each render.
    const el = await mount('ui-prompt', { fields: folderField() });
    await typeInto(el, 'name', 'Recei');
    await update(el, { fields: folderField() });
    expect(inputOf(el, 'name').value).toBe('Recei');
  });

  it('re-seeds for a genuinely different field set', async () => {
    const el = await mount('ui-prompt', { fields: folderField() });
    await typeInto(el, 'name', 'Recei');
    await update(el, { fields: folderField({ value: 'Archive' }) });
    expect(inputOf(el, 'name').value).toBe('Archive');
    await update(el, { fields: [{ id: 'newName', label: 'New name', value: 'Old' }] });
    expect(inputOf(el, 'newName').value).toBe('Old');
  });

  it('submits on Enter, suppressing its default, and ignores other keys', async () => {
    const el = await mount('ui-prompt', { fields: folderField() });
    const submits = record(el, 'submit');
    const other = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    inputOf(el, 'name').dispatchEvent(other);
    expect(submits).toHaveLength(0);
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    inputOf(el, 'name').dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
    expect(submits).toHaveLength(1);
  });

  it('submits once however fast the second press comes, until the owner is done', async () => {
    const el = await mount<HTMLElement & { busy: boolean }>('ui-prompt', { fields: folderField() });
    const submits = record(el, 'submit');
    buttons(el)[1].click();
    buttons(el)[1].click();
    inputOf(el, 'name').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(submits).toHaveLength(1);

    await update(el, { busy: true });
    expect(buttons(el).every((b) => b.hasAttribute('disabled'))).toBe(true);
    await update(el, { busy: false });
    buttons(el)[1].click();
    expect(submits).toHaveLength(2);
  });

  it('refuses to cancel while the owner is busy', async () => {
    const el = await mount('ui-prompt', { fields: folderField(), busy: true });
    const cancels = record(el, 'cancel');
    buttons(el)[0].click();
    expect(cancels).toHaveLength(0);
    expect((shadow(el, 'ui-modal') as any).dismissible).toBe(false);

    await update(el, { busy: false });
    buttons(el)[0].click();
    expect(cancels).toHaveLength(1);
  });

  it('labels its buttons from the dictionary unless given text', async () => {
    const el = await mount('ui-prompt', { fields: folderField(), i18nStore: new I18nStore() });
    expect(buttons(el).map((b) => b.textContent?.trim())).toEqual(['Cancel', 'Save']);
    await update(el, { confirmText: 'Create', cancelText: 'Back' });
    expect(buttons(el).map((b) => b.textContent?.trim())).toEqual(['Back', 'Create']);
  });

  it('survives an empty field list', async () => {
    const el = await mount('ui-prompt', { fields: [] });
    const submits = record<CustomEvent>(el, 'submit');
    buttons(el)[1].click();
    expect(submits[0].detail).toEqual({});
  });
});
