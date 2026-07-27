export function applyThemeToIframe(iframe: HTMLIFrameElement, themeIframeContent: boolean): void {
  if (!iframe.contentDocument || !iframe.contentDocument.body) return;

  const existing = iframe.contentDocument.getElementById('dark-mode-override');
  if (existing) {
    existing.remove();
  }

  if (!themeIframeContent) {
    return;
  }

  const isDark = document.body.classList.contains('theme-dark');
  if (isDark) {
    const bgPrimary = window.getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#1f2937';
    const textPrimary = window.getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#f9fafb';
    const accentColor = window.getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#3b82f6';
    const border = window.getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#374151';

    const style = iframe.contentDocument.createElement('style');
    style.id = 'dark-mode-override';
    style.textContent = `
      html {
        color-scheme: dark !important;
      }
      body {
        background-color: ${bgPrimary} !important;
        color: ${textPrimary} !important;
      }
      /* Make all layout elements transparent so theme background shows through */
      table, tr, td, tbody, thead, div, p, span, section, article, header, footer, blockquote {
        background-color: transparent !important;
      }
      /* Ensure all standard text containers inherit readable text color */
      td, div, p, span, h1, h2, h3, h4, h5, h6, font {
        color: inherit !important;
      }
      /* Style links to use the theme's accent color */
      a {
        color: ${accentColor} !important;
      }
      /* Ensure list elements are clean and transparent */
      ul, ol, li {
        background-color: transparent !important;
        color: inherit !important;
      }
      /* Style horizontal rules/lines */
      hr {
        border-color: ${border} !important;
      }
    `;
    iframe.contentDocument.head.appendChild(style);
  }
}

export function setupIframeSizing(iframe: HTMLIFrameElement, themeIframeContent: boolean): void {
  if (!iframe.contentDocument || !iframe.contentDocument.body) return;

  iframe.style.height = '0px';
  iframe.style.width = '100%';

  // Prevent dropping files inside the iframe from navigating away
  iframe.contentDocument.addEventListener('dragover', (ev) => ev.preventDefault());
  iframe.contentDocument.addEventListener('drop', (ev) => ev.preventDefault());

  applyThemeToIframe(iframe, themeIframeContent);

  if ((iframe as any)._ro) {
    (iframe as any)._ro.disconnect();
  }

  // The iframe stays locked to its container's width (100%). We only sync its
  // height to the content so the whole page scrolls as one. We deliberately do
  // NOT grow the iframe to the content's width: emails with fixed-width layouts
  // or wide tables would otherwise blow the iframe out past the viewport,
  // producing an enormous, broken-looking message. Content wider than the pane
  // scrolls horizontally inside the iframe instead (see html-sanitizer body
  // overflow-x).
  const ro = new ResizeObserver((entries) => {
    let newHeight = 0;

    for (const entry of entries) {
      if (iframe.contentDocument && entry.target === iframe.contentDocument.body) {
        if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
          newHeight = entry.borderBoxSize[0].blockSize;
        } else {
          newHeight = entry.contentRect.height + 48;
        }
      }
    }

    if (newHeight > 0) {
      const currentHeight = parseFloat(iframe.style.height) || 0;
      if (Math.abs(currentHeight - newHeight) > 2) {
        iframe.style.height = `${Math.ceil(newHeight)}px`;
      }
    }
  });

  ro.observe(iframe.contentDocument.body);
  (iframe as any)._ro = ro;
}

// htmlToPlainText extracts readable text from an HTML string using an inert
// DOMParser document. Unlike assigning to a live element's innerHTML, a
// DOMParser'd document is never inserted into the page, so it does NOT trigger
// resource loads (e.g. <img src> firing onerror/onload) — important because the
// input is untrusted message HTML. Block elements and <br> become newlines to
// approximate innerText for quoting replies/forwards.
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, noscript, head, template').forEach(el => el.remove());

  const blockTags = new Set([
    'p', 'div', 'br', 'tr', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'section', 'article', 'header', 'footer', 'pre', 'table',
    'ul', 'ol',
  ]);

  let out = '';
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        out += child.textContent || '';
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tag = el.tagName.toLowerCase();
        if (tag === 'br') {
          out += '\n';
          continue;
        }
        walk(el);
        if (blockTags.has(tag)) out += '\n';
      }
    }
  };
  if (doc.body) walk(doc.body);

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

export function extractSnippet(content: string, mimeType: string, fallbackSnippet: string, clickToExpandText: string): string {
  if (!content) {
    return fallbackSnippet || clickToExpandText;
  }

  let text = content;
  const isHtmlContent = 
    mimeType?.toLowerCase() === 'text/html' || 
    content.trim().startsWith('<') ||
    /<\/[a-zA-Z]+>/.test(content) ||
    /<[a-zA-Z]+[^>]*>/.test(content);

  if (isHtmlContent) {
    try {
      const doc = new DOMParser().parseFromString(content, 'text/html');
      const styles = doc.querySelectorAll('style, script, head');
      styles.forEach(s => s.remove());
      
      const extractText = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || '';
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          const tagName = el.tagName.toLowerCase();
          if (tagName === 'br') {
            return ' ';
          }
          let childText = '';
          for (let i = 0; i < el.childNodes.length; i++) {
            childText += extractText(el.childNodes[i]);
          }
          const blockTags = ['p', 'div', 'td', 'tr', 'th', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article', 'blockquote', 'ol', 'ul', 'header', 'footer'];
          if (blockTags.includes(tagName)) {
            return ' ' + childText + ' ';
          }
          return childText;
        }
        return '';
      };
      text = extractText(doc.body || doc);
    } catch (e) {
      text = content.replace(/<[^>]*>/g, ' ');
    }
  } else {
    text = content.replace(/[\r\n\t]+/g, ' ');
  }
  
  const trimmedText = text.replace(/\s+/g, ' ').trim();
  if (trimmedText) {
    const snippet = trimmedText.substring(0, 100);
    if (trimmedText.length > 100) {
      return snippet + '...';
    }
    return snippet;
  } else if (fallbackSnippet) {
    return fallbackSnippet.replace(/[\r\n\t\s]+/g, ' ').trim();
  } else {
    return clickToExpandText;
  }
}
