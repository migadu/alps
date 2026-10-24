/**
 * A conversation card's message frame follows the app's theme.
 *
 * With "Apply theme to HTML messages content" on, a message's frame is
 * painted in the app's dark colours while the app is dark. A card painted its
 * frame only as the frame loaded, and the reader paints again on a settings
 * change only the frames in its own shadow root, so a conversation's bodies
 * kept the scheme they had loaded in.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount } from './helpers/dom';
import * as readerUtils from '../src/utils/reader-utils';
import '../src/components/alps-thread-card';

// jsdom gives a frame in a shadow root no document to paint, so what is
// checked is that the card paints it, with the setting as it is now.
vi.mock('../src/utils/reader-utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/utils/reader-utils')>();
  return { ...original, applyThemeToIframe: vi.fn(original.applyThemeToIframe) };
});

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

const item = {
  message: {
    UID: '7',
    Flags: ['\\Seen'],
    Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.com' }], To: [], Cc: [], Subject: 'Engines', Date: '2026-09-01T10:00:00Z' },
  },
  content: '<p>The figures.</p>',
  mimeType: 'text/html',
  loading: false,
  attachments: [],
  rawMessageHtml: '<p>The figures.</p>',
  hasHtml: true,
  hasText: false,
  activeBanners: [],
  allowRemoteResources: false,
  hasRemoteResources: false,
  isSent: false,
  mailbox: 'INBOX',
  expanded: true,
};

afterEach(() => {
  cleanup();
  vi.mocked(readerUtils.applyThemeToIframe).mockClear();
});

describe("a conversation card's frame", () => {
  it('is painted again in the theme when the settings change', async () => {
    const state = { themeIframeContent: true };
    const settingsStore = Object.assign(new EventTarget(), { getState: () => state });
    const el = await mount<El>('alps-thread-card', { i18nStore, settingsStore, item, mailbox: 'INBOX' });
    const frame = el.shadowRoot!.querySelector<HTMLIFrameElement>('iframe.reader-iframe');
    expect(frame).not.toBeNull();
    const painted = vi.mocked(readerUtils.applyThemeToIframe);
    painted.mockClear();

    settingsStore.dispatchEvent(new Event('change'));
    expect(painted.mock.calls).toEqual([[frame, true]]);

    state.themeIframeContent = false;
    settingsStore.dispatchEvent(new Event('change'));
    expect(painted.mock.calls.at(-1)).toEqual([frame, false]);
  });

  it('is left alone once the card has left the page', async () => {
    const settingsStore = Object.assign(new EventTarget(), { getState: () => ({ themeIframeContent: true }) });
    const el = await mount<El>('alps-thread-card', { i18nStore, settingsStore, item, mailbox: 'INBOX' });
    el.remove();
    vi.mocked(readerUtils.applyThemeToIframe).mockClear();

    settingsStore.dispatchEvent(new Event('change'));
    expect(readerUtils.applyThemeToIframe).not.toHaveBeenCalled();
  });
});
