/**
 * The viewport's scale cap, set on iOS only.
 *
 * Safari on iOS zooms into a focused field whose text is under 16px, and
 * alps's fields are 14px. A `maximum-scale=1` stops that, and on iOS it leaves
 * pinch zoom alone: iOS has ignored a page's scale limits for the user's own
 * pinch since iOS 10. Everywhere else, Chrome on Android first, the same cap
 * takes pinch zoom away, so the page itself declares none.
 */
export function capFocusZoomOnIOS(doc: Document = document, nav: Navigator = navigator): void {
  // An iPad asks for the desktop site by default and calls itself a Mac; only
  // its touch screen tells it apart.
  const ios = /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  if (!ios) return;
  const viewport = doc.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (viewport && !/maximum-scale/.test(viewport.content)) viewport.content += ', maximum-scale=1';
}
