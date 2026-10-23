import { afterEach, expect, it, vi } from 'vitest';
import '../src/components/toast-notification';
import { cleanup, mount, record } from './helpers/dom';

type El = HTMLElement & Record<string, any>;
afterEach(cleanup);
const toast = (props: Record<string, unknown>) => mount<El>('alps-toast', {
  show: true, message: 'Recovery', actionLabel: 'Retry', ...props,
});
const action = (el: El) => el.shadowRoot!.querySelector('alps-button')!.shadowRoot!.querySelector('button')!;

it('keeps a synchronously refused action available, and closes when a retry succeeds', async () => {
  const onAction = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
  const onDismiss = vi.fn();
  const el = await toast({ onAction, onDismiss });
  const dismissed = record(el, 'dismiss');
  action(el).click();
  expect(el.show).toBe(true);
  expect(el.onAction).toBe(onAction);
  expect(dismissed).toHaveLength(0);
  expect(onDismiss).not.toHaveBeenCalled();

  action(el).click();
  expect(onAction).toHaveBeenCalledTimes(2);
  expect(el.show).toBe(false);
  expect(dismissed).toHaveLength(1);
  expect(onDismiss).not.toHaveBeenCalled();
});

it('closes a normal void action without running its dismissal action', async () => {
  const onAction = vi.fn();
  const onDismiss = vi.fn();
  const el = await toast({ onAction, onDismiss });
  action(el).click();
  expect(onAction).toHaveBeenCalledTimes(1);
  expect(el.show).toBe(false);
  expect(onDismiss).not.toHaveBeenCalled();
});

it('keeps the immediate dismissal of asynchronous actions, without awaiting their result', async () => {
  let resolve!: (value: boolean) => void;
  const result = new Promise<boolean>(done => { resolve = done; });
  const el = await toast({ onAction: () => result });
  action(el).click();
  expect(el.show).toBe(false);
  resolve(false);
  await result;
  expect(el.show).toBe(false);
});

it('still dispatches the fallback action event and closes when there is no callback', async () => {
  const el = await toast({});
  const events = record(el, 'action');
  action(el).click();
  expect(events).toHaveLength(1);
  expect(el.show).toBe(false);
});
