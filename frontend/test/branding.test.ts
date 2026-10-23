/**
 * The server's [branding]: a default theme and a sign-in logo, written into
 * the page as <meta> tags. Without them alps looks as it ships.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount } from './helpers/dom';
import { themeFamily } from '../src/store/themes';
import { loginLogo, loginLogoBuiltin, loginLogoDark } from '../src/utils/branding';
import '../src/components/alps-auth-card';

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

describe('the sign-in card', () => {
  it('shows the server\'s logo in place of the icon', async () => {
    brand('alps-login-logo', '/branding/login-logo');
    const card = await mount('alps-auth-card', { icon: 'edelweiss', logo: loginLogo() ?? '' });
    const img = card.shadowRoot!.querySelector('.logo-container img');
    expect(img?.getAttribute('src')).toBe('/branding/login-logo');
    expect(card.shadowRoot!.querySelector('.logo-container svg')).toBeNull();
  });

  // Which of the two shows is CSS (.theme-dark in index.css), which jsdom does
  // not apply; the browser tests see it.
  it('carries a logo for each mode when the server has a dark one', async () => {
    brand('alps-login-logo', '/branding/login-logo');
    brand('alps-login-logo-dark', '/branding/login-logo-dark');
    const card = await mount('alps-auth-card', { logo: loginLogo() ?? '', logoDark: loginLogoDark() ?? '' });
    expect(card.shadowRoot!.querySelector('img.light-only')?.getAttribute('src')).toBe('/branding/login-logo');
    expect(card.shadowRoot!.querySelector('img.dark-only')?.getAttribute('src')).toBe('/branding/login-logo-dark');
  });

  it('carries one logo, for every mode, when the server has no dark one', async () => {
    brand('alps-login-logo', '/branding/login-logo');
    const card = await mount('alps-auth-card', { logo: loginLogo() ?? '', logoDark: loginLogoDark() ?? '' });
    const imgs = card.shadowRoot!.querySelectorAll('.logo-container img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0].classList.length).toBe(0);
  });

  it('draws a built-in logo from the sprite, at its own shape', async () => {
    brand('alps-login-logo-builtin', 'migadu');
    const card = await mount('alps-auth-card', { icon: 'edelweiss', builtinLogo: loginLogoBuiltin() ?? '' });
    const svg = card.shadowRoot!.querySelector('.logo-container svg.builtin-logo');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 98 24');
    expect(svg?.querySelector('use')?.getAttribute('href')).toMatch(/sprite\.svg\?v=\d+#migadu$/);
    expect(card.shadowRoot!.querySelectorAll('.logo-container svg')).toHaveLength(1);
  });

  it('shows its icon for a built-in logo this build does not have', async () => {
    brand('alps-login-logo-builtin', 'sepia');
    const card = await mount('alps-auth-card', { icon: 'edelweiss', builtinLogo: loginLogoBuiltin() ?? '' });
    expect(card.shadowRoot!.querySelector('svg.builtin-logo')).toBeNull();
    expect(card.shadowRoot!.querySelector('.logo-container svg use')?.getAttribute('href')).toMatch(/#edelweiss$/);
  });

  it('shows its icon when the server has no logo', async () => {
    const card = await mount('alps-auth-card', { icon: 'edelweiss', logo: loginLogo() ?? '' });
    expect(card.shadowRoot!.querySelector('.logo-container img')).toBeNull();
    expect(card.shadowRoot!.querySelector('.logo-container svg')).not.toBeNull();
  });
});
