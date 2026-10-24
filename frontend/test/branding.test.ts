/**
 * The server's [branding]: a default theme and a logo, written into
 * the page as <meta> tags. Without them alps looks as it ships.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount } from './helpers/dom';
import { themeFamily } from '../src/store/themes';
import '../src/components/alps-auth-card';
import '../src/components/app-header';

function brand(name: string, content: string) {
  const meta = document.createElement('meta');
  meta.name = name;
  meta.content = content;
  document.head.appendChild(meta);
}

afterEach(() => {
  cleanup();
  document.head.querySelectorAll('meta[name^="alps-"]').forEach((m) => m.remove());
});

describe('the theme shown', () => {
  it('is Alps for anyone who has not picked one, when the server names none', () => {
    expect(themeFamily('default')).toBe('alps');
  });

  it('is the server\'s default for anyone who has not picked one', () => {
    brand('alps-default-theme', 'migadu');
    expect(themeFamily('default')).toBe('migadu');
  });

  it('is the one picked, whatever the server\'s default', () => {
    brand('alps-default-theme', 'migadu');
    expect(themeFamily('alps')).toBe('alps');
    expect(themeFamily('nord')).toBe('nord');
  });

  it('is Alps for a theme this build does not have', () => {
    expect(themeFamily('sepia')).toBe('alps');
    brand('alps-default-theme', 'sepia');
    expect(themeFamily('default')).toBe('alps');
  });
});

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key, getLanguage: () => 'en' });

/** The icon or images where the edelweiss would be, in the sign-in card and the header. */
async function logos() {
  const card = await mount('alps-auth-card', { branded: true });
  const header = await mount('app-header', { i18nStore });
  return [card.shadowRoot!.querySelector('.logo-container')!, header.shadowRoot!.querySelector('.logo')!];
}

const iconOf = (place: Element) => place.querySelector('svg use')?.getAttribute('href')?.split('#')[1];

describe('the logo, on the sign-in page and in the header', () => {
  it('is the edelweiss when the server names none', async () => {
    for (const place of await logos()) expect(iconOf(place)).toBe('edelweiss');
  });

  it('is a built-in logo the server names', async () => {
    brand('alps-logo-builtin', 'migadu');
    for (const place of await logos()) expect(iconOf(place)).toBe('migadu');
  });

  it('is the edelweiss for a built-in logo this build does not have', async () => {
    brand('alps-logo-builtin', 'sepia');
    for (const place of await logos()) expect(iconOf(place)).toBe('edelweiss');
  });

  it('is the favicon of the server\'s own package', async () => {
    brand('alps-logo', '/favicon.svg');
    for (const place of await logos()) {
      expect(place.querySelector('svg')).toBeNull();
      expect(place.querySelector('img.logo')?.getAttribute('src')).toBe('/favicon.svg');
    }
  });
});

describe('the sign-in card', () => {
  it('keeps its own icon where the page is not branded', async () => {
    brand('alps-logo-builtin', 'migadu');
    const card = await mount('alps-auth-card', { icon: 'fingerprint' });
    expect(iconOf(card.shadowRoot!.querySelector('.logo-container')!)).toBe('fingerprint');
  });
});
