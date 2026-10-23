/**
 * The shared dialogs: ui-modal, ui-confirm and ui-prompt.
 *
 * They sit in front of every destructive or naming action in the app, so what
 * they must get right is which answer was given, exactly once, and — for the
 * prompt — that what the user typed survives the owner re-rendering. Each is
 * named by its title, and a confirmation described by its question, so that a
 * screen reader says which dialog opened (browser test: e2e/folders.spec.ts).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount, record, shadow, shadowAll, text, update } from './helpers/dom';
import { I18nStore } from '../src/store/i18n-store';
import '../src/components/ui-modal';
import '../src/components/ui-confirm';
import '../src/components/ui-prompt';

afterEach(cleanup);

const dialogOf = (modal: HTMLElement) => shadow<HTMLDialogElement>(modal, 'dialog');

/** The text a node shows, through its shadow root and the nodes slotted into it. */
function shownText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node instanceof HTMLSlotElement) {
    const assigned = node.assignedNodes({ flatten: true });
    return (assigned.length ? assigned : [...node.childNodes]).map(shownText).join('');
  }
  const host = node as Element;
  return [...(host.shadowRoot ?? host).childNodes].map(shownText).join('');
}

/** What the elements an ARIA reference names show, found in the dialog's own root. */
function referenced(dialog: HTMLElement, attribute: string): string | null {
  const ids = dialog.getAttribute(attribute);
  if (!ids) return null;
  const root = dialog.getRootNode() as ShadowRoot;
  return ids.split(/\s+/).map((id) => {
    const target = root.getElementById(id);
    expect(target, `#${id}, named by ${attribute}`).not.toBeNull();
    return shownText(target!).replace(/\s+/g, ' ').trim();
  }).join(' ');
}

/** The dialog's accessible name: what aria-labelledby points at, else aria-label. */
const nameOf = (dialog: HTMLElement) => referenced(dialog, 'aria-labelledby') ?? dialog.getAttribute('aria-label');
const descriptionOf = (dialog: HTMLElement) => referenced(dialog, 'aria-describedby');

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

  it('is named by its title', async () => {
    const modal = await mount('ui-modal', { title: 'Delete folder' });
    expect(nameOf(dialogOf(modal))).toBe('Delete folder');
    // Nothing describes it unless asked: an editor's body is a form.
    expect(descriptionOf(dialogOf(modal))).toBeNull();
    await update(modal, { title: '' });
    expect(nameOf(dialogOf(modal))).toBeNull();
  });

  it('is named by its title when a header of the caller\'s replaces the heading', async () => {
    const modal = document.createElement('ui-modal') as HTMLElement & { title: string };
    modal.title = 'Security key';
    modal.innerHTML = '<div slot="header">A drawn header</div>';
    document.body.append(modal);
    await (modal as any).updateComplete;
    await (modal as any).updateComplete;
    expect(nameOf(dialogOf(modal))).toBe('Security key');
    modal.remove();
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

  it('is named by its title and described by its message', async () => {
    const el = await mount('ui-confirm', { title: 'Discard?', message: 'Your draft is lost.', confirmText: 'Discard', cancelText: 'Keep' });
    const dialog = dialogOf(shadow(el, 'ui-modal'));
    expect(nameOf(dialog)).toBe('Discard?');
    expect(descriptionOf(dialog)).toBe('Your draft is lost.');
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

  it('is named by its title, and its form is no description', async () => {
    const el = await mount('ui-prompt', { fields: folderField(), title: 'New folder' });
    const dialog = dialogOf(shadow(el, 'ui-modal'));
    expect(nameOf(dialog)).toBe('New folder');
    expect(descriptionOf(dialog)).toBeNull();
  });

  it('renders a labelled input per field, seeded from its value', async () => {
    const el = await mount('ui-prompt', { fields: [...folderField(), { id: 'parent', label: 'Parent' }] });
    // Each field carries its label as its name too: the label's `for` could
    // not reach the input inside alps-input (field-labels.test.ts).
    expect(shadowAll(el, 'label').map((l) => l.textContent)).toEqual(['Folder name', 'Parent']);
    expect(shadowAll<HTMLElement & { label: string }>(el, 'alps-input').map((f) => f.label)).toEqual(['Folder name', 'Parent']);
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

  it('shows the owner\'s errors under their fields, and drops one once its field is typed in', async () => {
    const el = await mount('ui-prompt', { fields: [...folderField(), { id: 'parent', label: 'Parent' }] });
    await update(el, { errors: { name: 'Taken', parent: 'Missing' } });
    expect(shadowAll(el, '.field-error').map((e) => [e.getAttribute('role'), e.textContent])).toEqual([['alert', 'Taken'], ['alert', 'Missing']]);

    await typeInto(el, 'name', 'Receipts');
    expect(shadowAll(el, '.field-error').map((e) => e.textContent)).toEqual(['Missing']);

    // A re-render with the same errors object does not bring it back; a new
    // refusal does.
    const same = (el as any).errors;
    await update(el, { errors: same, title: 'Again' });
    expect(shadowAll(el, '.field-error')).toHaveLength(1);
    await update(el, { errors: { name: 'Taken' } });
    expect(shadowAll(el, '.field-error')).toHaveLength(2);
  });

  it('keeps a value its field refuses, with the field\'s words, and submits once it is put right', async () => {
    const required = { id: 'name', label: 'Folder name', validate: (v: string) => (v ? null : 'Enter a name') };
    const el = await mount('ui-prompt', { fields: [required] });
    const submits = record<CustomEvent>(el, 'submit');
    buttons(el)[1].click();
    await (el as any).updateComplete;
    expect(submits).toHaveLength(0);
    expect(text(el, '.field-error')).toBe('Enter a name');
    // The refusal is not a submit: the button is not left latched.
    expect(buttons(el)[1].hasAttribute('disabled')).toBe(false);

    await typeInto(el, 'name', 'Receipts');
    buttons(el)[1].click();
    expect(submits.map((e) => e.detail)).toEqual([{ name: 'Receipts' }]);
  });

  it('can be submitted again once the owner answers with an error, busy or not', async () => {
    const el = await mount('ui-prompt', { fields: folderField() });
    const submits = record(el, 'submit');
    buttons(el)[1].click();
    await (el as any).updateComplete;
    expect(buttons(el)[1].hasAttribute('disabled')).toBe(true);

    await update(el, { errors: { name: 'Taken' } });
    await (el as any).updateComplete;
    expect(buttons(el)[1].hasAttribute('disabled')).toBe(false);
    buttons(el)[1].click();
    expect(submits).toHaveLength(2);
  });

  it('styles a destructive prompt as ui-confirm does', async () => {
    const el = await mount('ui-prompt', { fields: folderField(), title: 'Remove key', isDanger: true });
    expect(shadow(shadow(el, 'ui-modal'), 'h3').classList.contains('danger')).toBe(true);
    expect(buttons(el)[1].getAttribute('variant')).toBe('danger');
    await update(el, { isDanger: false });
    expect(buttons(el)[1].getAttribute('variant')).toBe('normal');
  });

  it('survives an empty field list', async () => {
    const el = await mount('ui-prompt', { fields: [] });
    const submits = record<CustomEvent>(el, 'submit');
    buttons(el)[1].click();
    expect(submits[0].detail).toEqual({});
  });
});
