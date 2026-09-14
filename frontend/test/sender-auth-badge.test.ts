/**
 * The badge that says whether a sender passed the receiving server's checks. It
 * is drawn beside the name whatever the avatars do, so turning avatars off never
 * hides a failed check. It is an icon everywhere, its words the tooltip and
 * accessible name.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount, shadow, shadowAll, text, update } from './helpers/dom';
import '../src/components/alps-sender-auth-badge';

const TAG = 'alps-sender-auth-badge';

afterEach(() => {
  cleanup();
});

describe('sender auth badge', () => {
  it('marks a verified sender with an icon that names it', async () => {
    const el = await mount(TAG, { verified: true });
    const badge = shadow(el, '.badge.verified');
    expect(badge.getAttribute('role')).toBe('img');
    expect(badge.getAttribute('aria-label')).toBe('Verified Sender');
    expect(badge.getAttribute('title')).toBe('Verified Sender');
    expect(text(el)).toBe('');
  });

  it('marks a sender that failed its checks', async () => {
    const el = await mount(TAG, { failed: true });
    expect(shadow(el, '.badge.failed').getAttribute('aria-label')).toBe('Unverified Sender');
  });

  it('draws nothing without a verdict, and appears when one arrives', async () => {
    const el = await mount(TAG);
    expect(shadowAll(el, '.badge')).toHaveLength(0);
    await update(el, { failed: true });
    expect(shadowAll(el, '.badge.failed')).toHaveLength(1);
  });
});
