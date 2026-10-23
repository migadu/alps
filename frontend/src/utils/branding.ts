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
 * The logos alps ships besides the edelweiss, by sprite symbol, with the
 * viewBox that sizes each. They take the theme's colours, so one serves both
 * modes. Go keeps the same names in BuiltinLogos.
 */
export const BUILTIN_LOGOS: Record<string, string> = {
  migadu: '0 0 98 24',
};

/** A built-in logo the sign-in page shows in place of the edelweiss. */
export const loginLogoBuiltin = () => meta('alps-login-logo-builtin');

/** An image the sign-in page shows in place of the edelweiss. */
export const loginLogo = () => meta('alps-login-logo');

/** The same for the dark modes, when the server has one. */
export const loginLogoDark = () => meta('alps-login-logo-dark');
