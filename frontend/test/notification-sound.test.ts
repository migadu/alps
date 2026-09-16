/**
 * The new-mail chime answers to its setting.
 *
 * A browser lets a page play sound only after a user gesture, so the mailbox
 * page plays the chime muted on the first click or key press to earn that
 * permission. With sound notifications switched off that play must not happen
 * at all: muting does not silence it everywhere, and it was the sound users
 * heard while clicking around with the setting off.
 *
 * The element is never connected, so nothing is fetched; the gesture handler is
 * called directly and the chime is a stand-in that records what was played.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/mailbox-page';

class FakeAudio {
  static made: FakeAudio[] = [];
  muted = false;
  currentTime = 0;
  mutedWhilePlaying: boolean[] = [];
  pause = vi.fn();
  play = vi.fn(() => {
    this.mutedWhilePlaying.push(this.muted);
    return Promise.resolve();
  });
  constructor() {
    FakeAudio.made.push(this);
  }
}

type Page = HTMLElement & { unlockAudio: () => void };

function page(settings: { soundNotifications: boolean }): Page {
  const el = document.createElement('mailbox-page') as any;
  el.settingsStore = { getState: () => settings };
  return el;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  FakeAudio.made = [];
  vi.stubGlobal('Audio', FakeAudio);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the first gesture on the mailbox', () => {
  it('plays nothing while sound notifications are off', () => {
    const el = page({ soundNotifications: false });
    const removed = vi.spyOn(document, 'removeEventListener');

    el.unlockAudio();

    expect(FakeAudio.made).toHaveLength(0);
    // Still listening, so switching the sound on later unlocks it on a later gesture.
    expect(removed).not.toHaveBeenCalledWith('click', el.unlockAudio);
  });

  it('unlocks the chime, muted, once they are on', async () => {
    const settings = { soundNotifications: false };
    const el = page(settings);
    el.unlockAudio();

    settings.soundNotifications = true;
    const removed = vi.spyOn(document, 'removeEventListener');
    el.unlockAudio();
    await flush();

    expect(FakeAudio.made).toHaveLength(1);
    const [chime] = FakeAudio.made;
    expect(chime.play).toHaveBeenCalledTimes(1);
    expect(chime.mutedWhilePlaying).toEqual([true]);
    expect(chime.muted).toBe(false);
    expect(removed).toHaveBeenCalledWith('click', el.unlockAudio);
    expect(removed).toHaveBeenCalledWith('keydown', el.unlockAudio);
  });
});
