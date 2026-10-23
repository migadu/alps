import { afterEach, expect, it, vi } from 'vitest';
import '../../plugins/carddav/frontend/contact-view';

afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

it('retains the edited entry identity when remove and edit share one debounce', async () => {
  vi.useFakeTimers();
  const view = document.createElement('alps-contact-view') as HTMLElement & Record<string, any>;
  view.contact = { path: '/a.vcf', emails: [{ value: 'work@example.test', type: 'work' }, { value: 'home@example.test', type: 'home' }] };
  view.isEditing = true;
  view.updated(new Map([['isEditing', false]]));
  const saved = vi.fn();
  view.addEventListener('save', (event: Event) => saved((event as CustomEvent).detail));
  view.removeMultiField('emails', 0);
  view.handleMultiInput('emails', 0, 'value', 'changed@example.test');
  await vi.advanceTimersByTimeAsync(500);
  expect(saved).toHaveBeenCalledTimes(1);
  expect(saved.mock.calls[0][0].emails).toEqual([{ value: 'changed@example.test', type: 'home', id: 'emails:1' }]);
  view.addMultiField('emails');
  expect(view.editForm.emails[1].id).toBeTruthy();
  expect(view.editForm.emails[1].id).not.toMatch(/^emails:/);
  view.handleMultiInput('emails', 1, 'value', 'brand-new@example.test');
  expect(view.editForm.emails[0].id).toBe('emails:1');
});
