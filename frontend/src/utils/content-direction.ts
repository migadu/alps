/**
 * The direction of message content: what its author set, and what the text
 * itself says where the author left it to `dir="auto"`.
 *
 * Shared by the reader's sanitizer, the quote a reply is built around and the
 * composer, so a message is resolved by the same rules when it is shown,
 * quoted and sent.
 */
export type Direction = 'ltr' | 'rtl';
type AuthoredDirection = Direction | 'auto';

/** Marks a direction this code resolved, as opposed to one the author wrote. */
export const AUTO_DIRECTION_ATTRIBUTE = 'data-alps-auto-direction';

/**
 * A `dir="auto"` container takes the direction of its first strong letter,
 * but a browser skips every descendant that carries a `dir` of its own, and
 * mail written in an editor often has one on every paragraph. A quote or list
 * of right-to-left paragraphs would then be laid out left to right, its bar
 * and markers on the wrong side, so the resolved direction is written on it
 * and applied here. Zero specificity, so the author's own stylesheet still
 * wins.
 */
export const AUTO_DIRECTION_STYLES = `
  :where(:is(body, div, blockquote, li, ul, ol)[data-alps-auto-direction="rtl"]) { direction: rtl; }
  :where(:is(body, div, blockquote, li, ul, ol)[data-alps-auto-direction="ltr"]) { direction: ltr; }
`;

function normalizeDirection(value: string | null | undefined): AuthoredDirection | null {
  const direction = value?.trim().toLowerCase();
  return direction === 'ltr' || direction === 'rtl' || direction === 'auto' ? direction : null;
}

function generatedDirection(element: Element): Direction | null {
  const value = element.getAttribute(AUTO_DIRECTION_ATTRIBUTE);
  return value === 'ltr' || value === 'rtl' ? value : null;
}

/** Is the element's inline `direction` the one this code wrote, unchanged? */
function hasGeneratedInlineDirection(element: HTMLElement): boolean {
  const generated = generatedDirection(element);
  return generated !== null
    && element.style?.direction.trim().toLowerCase() === generated
    && element.style?.getPropertyPriority('direction') === '';
}

/** The element's style without the direction this code derived, so a saved
 * draft keeps the author's formatting and stays automatic. */
export function getAuthoredStyle(element: HTMLElement): string | null {
  const original = element.getAttribute('style');
  if (!original || !hasGeneratedInlineDirection(element)) return original;
  const probe = element.ownerDocument.createElement('span');
  probe.style.cssText = original;
  probe.style.removeProperty('direction');
  return probe.getAttribute('style')?.trim() || null;
}

/**
 * The direction the element's author chose: an inline `direction`, which
 * overrides `dir` on the same element, or else `dir`. A direction this code
 * wrote for an automatic container does not count, or an automatic draft
 * would come back fixed to whatever its first line was.
 */
export function getAuthoredDirection(element: HTMLElement | null | undefined): AuthoredDirection | null {
  if (!element) return null;
  const inline = element.style?.direction;
  if (inline && !hasGeneratedInlineDirection(element)) return normalizeDirection(inline);
  return normalizeDirection(element.getAttribute('dir'));
}

export interface DirectionDescription<T> {
  /** A text node's content; supply children for a container instead. */
  text?: string;
  direction?: AuthoredDirection | null;
  children?: Iterable<T>;
}

/**
 * Resolves a tree the way `dir="auto"` does: the first branch, at any depth,
 * with an explicit direction or a strong letter decides.
 *
 * The letters are judged by the browser's own bidi algorithm rather than a
 * list of right-to-left script ranges, which would always be missing one. A
 * probe span with `dir="auto"` is given the text twice, followed once by a
 * left-to-right mark and once by a right-to-left one: text with a strong
 * letter of its own resolves the same both times, and text with none (digits,
 * punctuation, spaces) follows the mark, and so is told apart from
 * left-to-right text. The probe only ever holds text; no message markup is
 * rendered.
 */
export function createDirectionResolver<T>(describe: (node: T) => DirectionDescription<T>) {
  const cache = new Map<T, Direction | null>();
  const textCache = new Map<string, Direction | null>();
  const probe = document.createElement('span');
  probe.dir = 'auto';
  let supportsDirectionSelector = true;
  try {
    probe.matches(':dir(rtl)');
  } catch {
    supportsDirectionSelector = false;
    // A browser with dir="auto" but no :dir() selector still reports the
    // resolved direction through computed style, which needs the probe in
    // the document. It is hidden, and removed again after each reading.
    probe.hidden = true;
  }
  const probeDirection = (): Direction => supportsDirectionSelector
    ? probe.matches(':dir(rtl)') ? 'rtl' : 'ltr'
    : getComputedStyle(probe).direction === 'rtl' ? 'rtl' : 'ltr';

  const textDirection = (text: string): Direction | null => {
    if (textCache.has(text)) return textCache.get(text)!;
    if (!supportsDirectionSelector) document.documentElement.appendChild(probe);
    try {
      probe.textContent = text + '‎';
      const ltrFallback = probeDirection();
      probe.textContent = text + '‏';
      const rtlFallback = probeDirection();
      const direction = ltrFallback === rtlFallback ? ltrFallback : null;
      textCache.set(text, direction);
      return direction;
    } finally {
      probe.remove();
    }
  };

  const resolve = (node: T): Direction | null => {
    if (cache.has(node)) return cache.get(node)!;
    const description = describe(node);
    let direction: Direction | null = description.direction === 'ltr' || description.direction === 'rtl'
      ? description.direction
      : description.text !== undefined ? textDirection(description.text) : null;
    if (direction === null) {
      for (const child of description.children ?? []) {
        direction = resolve(child);
        if (direction !== null) break;
      }
    }
    cache.set(node, direction);
    return direction;
  };
  return resolve;
}

const CONTAINERS = new Set(['BODY', 'DIV', 'BLOCKQUOTE', 'LI', 'UL', 'OL']);
const NON_CONTENT = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'BDI', 'BDO']);
const INLINE_ELEMENTS = new Set([
  'A', 'ABBR', 'B', 'CITE', 'CODE', 'DATA', 'DEL', 'DFN', 'EM', 'FONT',
  'I', 'INS', 'KBD', 'MARK', 'Q', 'S', 'SAMP', 'SMALL', 'SPAN', 'STRONG',
  'SUB', 'SUP', 'TIME', 'U', 'VAR',
]);

/** Resolves message markup, by the same rules in the reader and in sent mail. */
export function createDOMDirectionResolver() {
  return createDirectionResolver<Node>((node) => {
    if (node.nodeType === 3) return { text: node.nodeValue ?? '' };
    if (node.nodeType !== 1) return { children: node.childNodes };
    const element = node as HTMLElement;
    // A quote's attribution line ("On …, Ada wrote:") is written left to
    // right whatever the quote says, so it must not decide the quote.
    if (NON_CONTENT.has(element.tagName) || element.hidden || element.classList.contains('gmail_attr')) return {};
    if (INLINE_ELEMENTS.has(element.tagName)) {
      // An inline element with a dir is an isolate, which the first-strong
      // scan of its parent skips. A CSS direction alone isolates nothing and
      // leaves the text's letters as they are, so that text still counts.
      if (normalizeDirection(element.getAttribute('dir')) !== null) return {};
      return { children: element.childNodes };
    }
    return { direction: getAuthoredDirection(element), children: element.childNodes };
  });
}

/**
 * Marks each explicitly automatic container with the direction its content
 * resolves to, and with `inline` also writes it as an inline style, for mail
 * that leaves this application without the stylesheet above. An authored
 * `dir` or style is never changed.
 */
export function applyAutoDirections(root: ParentNode, inline = false): void {
  const elements = [
    ...(root.nodeType === 1 ? [root as HTMLElement] : []),
    ...root.querySelectorAll<HTMLElement>('*'),
  ];

  // Start over after an edit: the first line may have changed, and a
  // container the author has since given a direction of its own needs none
  // of ours. Other inline styles stay as they are.
  for (const element of elements) {
    if (hasGeneratedInlineDirection(element)) element.style.removeProperty('direction');
    element.removeAttribute(AUTO_DIRECTION_ATTRIBUTE);
  }

  const resolve = createDOMDirectionResolver();

  for (const element of elements) {
    // Only an explicit dir="auto" opts a container into the direction of its
    // content. An unlabelled list inherits as usual, including a direction
    // from an author stylesheet that cannot be computed in this inert
    // document.
    if (!CONTAINERS.has(element.tagName) || getAuthoredDirection(element) !== 'auto'
      || element.style?.direction) continue;
    const direction = resolve(element);
    if (!direction) continue;
    element.setAttribute(AUTO_DIRECTION_ATTRIBUTE, direction);
    if (inline) element.style.direction = direction;
  }
}
