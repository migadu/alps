/**
 * A thread card's sender: the avatar is a preference, the verdict on the sender
 * is not. With avatars off the card still marks a sender that failed its checks,
 * and an expanded card warns above that message's body.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, installResizeObserver, mount, shadow, shadowAll } from './helpers/dom';
import '../src/components/alps-thread-card';

const TAG = 'alps-thread-card';

const message = (verdict: Record<string, boolean> = {}) => ({
  UID: '7',
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Brand', Mailbox: 'news', Host: 'brand.test' }], To: [], Cc: [], Subject: 'Offer', Date: '2026-09-01T10:00:00Z' },
  ...verdict,
});

const item = (msg: unknown, expanded = false) => ({
  message: msg,
  content: 'hello',
  mimeType: 'text/plain',
  loading: false,
  attachments: [],
  rawMessageHtml: '',
  hasHtml: false,
  hasText: true,
  activeBanners: [],
  allowRemoteResources: false,
  hasRemoteResources: false,
  isSent: false,
  mailbox: 'INBOX',
  expanded,
});

const warnings = (el: HTMLElement) => shadowAll(el, 'alps-banner[variant="warning"]');

afterEach(() => {
  cleanup();
});

describe('thread card sender', () => {
  it('draws the avatar and the verdict by default', async () => {
    const el = await mount(TAG, { item: item(message({ HasBimiPotential: true })), mailbox: 'INBOX' });
    expect(shadowAll(el, 'alps-avatar')).toHaveLength(1);
    expect(shadow<HTMLElement & { verified: boolean }>(el, 'alps-sender-auth-badge').verified).toBe(true);
  });

  it('keeps the verdict beside the name when avatars are off', async () => {
    const el = await mount(TAG, { item: item(message({ HasBimiFailed: true })), mailbox: 'INBOX', showSenderAvatars: false });
    expect(shadowAll(el, 'alps-avatar')).toHaveLength(0);
    expect(shadow<HTMLElement & { failed: boolean }>(el, 'alps-sender-auth-badge').failed).toBe(true);
  });

  it('warns above the body of an expanded message that failed its checks, and only that one', async () => {
    installResizeObserver();
    const failed = await mount(TAG, { item: item(message({ HasBimiFailed: true }), true), mailbox: 'INBOX', showSenderAvatars: false });
    expect(warnings(failed)).toHaveLength(1);
    const passed = await mount(TAG, { item: item(message({ HasBimiPotential: true }), true), mailbox: 'INBOX' });
    expect(warnings(passed)).toHaveLength(0);
  });
});
