import { css } from 'lit';

/**
 * Motion the user asked not to see.
 *
 * `prefers-reduced-motion` is an operating system setting, and for some people
 * a medical one: animated movement is a common trigger of vestibular symptoms.
 * index.css honours it for the document, but a selector there does not reach
 * into a shadow root, where every component's own transitions and animations
 * are. So each component that moves composes this sheet, first in its
 * `static styles`, as it composes popupStyles or sidebarLayoutStyles.
 *
 * `:host` is named as well as `*`, which does not match the host from inside.
 * A parent that composes this sheet reaches its children's hosts with `*`,
 * but not every parent moves: app-root draws the floating composer, which
 * moves and resizes itself, and the toasts, which slide, and Settings draws
 * its section rows, which fade.
 *
 * 0.01ms rather than none: a transition that never runs never fires
 * `transitionend`, and whatever waits for it would wait forever.
 */
export const motionStyles = css`
  @media (prefers-reduced-motion: reduce) {
    :host,
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }

    /*
     * A spinner keeps turning. It is the sign that work is under way, and one
     * that stops after a single 0.01ms turn reads as a page that hung, not as
     * a calmer one. It turns at the pace of the slowest spinner here, so none
     * turns faster than it would without the setting.
     *
     * The descendants are named because animation properties are not
     * inherited: alps-icon-btn puts .spinning on its button and the spin on
     * the icon inside it. Frozen there, the icon would also never fire
     * animationiteration, which fires only between iterations and is what the
     * refresh buttons wait for to stop spinning.
     *
     * data-motion="essential" exempts motion that informs without being a
     * spinner.
     */
    .spinner,
    .spinning,
    [data-motion='essential'],
    .spinner *,
    .spinning *,
    [data-motion='essential'] * {
      animation-duration: 3s !important;
      animation-iteration-count: infinite !important;
    }
  }
`;

/** Whether the user asked for less motion: the query the stylesheets ask. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

/**
 * `scrollIntoView` options without the smooth scroll when motion is not
 * wanted. The list scrolling the opened message into view is the largest and
 * most repeated movement on screen, and no stylesheet reaches it.
 */
export function scrollOptions(options: ScrollIntoViewOptions): ScrollIntoViewOptions {
  if (options.behavior !== 'smooth' || !prefersReducedMotion()) return options;
  return { ...options, behavior: 'auto' };
}
