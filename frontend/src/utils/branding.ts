import { css, html, type TemplateResult } from 'lit';
import { renderIcon } from './ui';

/**
 * What the server's [branding] configuration wrote into the page it served
 * (see branding.go). In the page rather than behind a request, so the sign-in
 * page is drawn branded from its first paint. Absent, alps looks as it ships.
 */
function meta(name: string): string | null {
  return document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content || null;
}

/** The colour theme for anyone who has not picked one. */
export const defaultTheme = () => meta('alps-default-theme');

/**
 * The logos alps ships besides the edelweiss, as symbols in the icon sprite,
 * in the theme's colours. Each has its favicon package in
 * public/assets/logos/<name>/. Go keeps the same names in BuiltinLogos.
 */
const BUILTIN_LOGOS = ['migadu'];

/** The icon in the edelweiss's place: a built-in logo, or the edelweiss. */
export function logoIcon(): string {
  const name = meta('alps-logo-builtin');
  return name && BUILTIN_LOGOS.includes(name) ? name : 'edelweiss';
}

/** The image of a favicon package the server holds, in the edelweiss's place. */
export const logoFile = () => meta('alps-logo');

/**
 * The deployment's logo, where the edelweiss would be and at its size: the
 * caller sizes `svg` and `img.logo` alike.
 */
export function renderLogo(): TemplateResult {
  const file = logoFile();
  return file ? html`<img class="logo" src=${file} alt="">` : renderIcon(logoIcon());
}

export const logoStyles = css`
  img.logo {
    object-fit: contain;
  }
`;
