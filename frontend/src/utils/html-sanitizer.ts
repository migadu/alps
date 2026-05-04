import * as cssParser from 'css';

export interface SanitizeOptions {
  mailbox: string;
  messageUid: string;
  allowRemoteResources: boolean;
  messageStructure?: any;
  onRemoteResourceBlocked?: () => void;
}

function findPartPathByCID(structure: any, cid: string, currentPath: string = ''): string | null {
  if (!structure) return null;

  const cleanCid = cid.replace(/^<|>$/g, '');
  if (structure.ID && structure.ID.replace(/^<|>$/g, '') === cleanCid) {
    return currentPath || '1';
  }

  if (structure.Children && Array.isArray(structure.Children)) {
    for (let i = 0; i < structure.Children.length; i++) {
      const nextPath = currentPath ? `${currentPath}.${i + 1}` : `${i + 1}`;
      const found = findPartPathByCID(structure.Children[i], cid, nextPath);
      if (found) return found;
    }
  }
  return null;
}

function processCSS(cssText: string, options: SanitizeOptions): string {
  if (!cssText) return cssText;

  try {
    const ast = cssParser.parse(cssText, { silent: true });
    if (ast && ast.stylesheet && ast.stylesheet.rules) {
      const urlRegex = /url\(\s*(['"]?)(https?:\/\/[^'"\)]+)\1\s*\)/gi;
      const replaceUrl = (val: string) => {
        return val.replace(urlRegex, (_match, quote, url) => {
          if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
          if (!options.allowRemoteResources) {
            return 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)';
          } else {
            const q = quote || '"';
            return `url(${q}/proxy?url=${encodeURIComponent(url)}${q})`;
          }
        });
      };

      const walkRules = (rules: Array<any>) => {
        for (let i = rules.length - 1; i >= 0; i--) {
          const rule = rules[i];

          if (['rule', 'font-face', 'page', 'keyframe'].includes(rule.type) && !rule.declarations) {
            rule.declarations = [];
          }
          if (['rule', 'page'].includes(rule.type) && !rule.selectors) {
            rule.selectors = [];
          }
          if (rule.type === 'keyframe' && !rule.values) {
            rule.values = [];
          }

          if (rule.type === 'import') {
            const importRule = rule as cssParser.Import;
            if (importRule.import && importRule.import.match(/https?:\/\//i)) {
              if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
              if (!options.allowRemoteResources) {
                rules.splice(i, 1);
                continue;
              } else {
                importRule.import = importRule.import.replace(/(url\(\s*)?(['"]?)(https?:\/\/[^'"\)]+)\2(\s*\))?/i, (_match, urlPrefix, quote, url, urlSuffix) => {
                  const prefix = urlPrefix || '';
                  const suffix = urlSuffix || '';
                  const q = quote || '"';
                  return `${prefix}${q}/proxy?url=${encodeURIComponent(url)}${q}${suffix}`;
                });
              }
            }
          }
          else if (rule.type === 'font-face') {
            const fontRule = rule as cssParser.FontFace;
            if (fontRule.declarations) {
              let hasRemoteFont = false;
              for (const dec of fontRule.declarations) {
                if (dec.type === 'declaration' && (dec as cssParser.Declaration).value?.match(urlRegex)) {
                  if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
                  hasRemoteFont = true;
                }
              }
              if (hasRemoteFont && !options.allowRemoteResources) {
                rules.splice(i, 1);
                continue;
              }
            }
          }

          if (rule.declarations) {
            for (const dec of rule.declarations) {
              if (dec.type === 'declaration' && dec.value && dec.value.match(urlRegex)) {
                dec.value = replaceUrl(dec.value);
              }
            }
          }
          if (rule.rules) {
            walkRules(rule.rules);
          }
        }
      };

      walkRules(ast.stylesheet.rules);
      return cssParser.stringify(ast);
    }
  } catch (err) {
    console.warn('AST CSS parsing failed, falling back to regex sanitizer', err);
  }

  let modified = cssText;
  const importRegex = /@import\s+(?:url\(\s*)?(['"]?)(https?:\/\/[^'"\)]+)\1\s*\)?\s*;?/gi;
  const urlRegex = /url\(\s*(['"]?)(https?:\/\/[^'"\)]+)\1\s*\)/gi;

  if (modified.match(importRegex) || modified.match(urlRegex)) {
    if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();

    if (!options.allowRemoteResources) {
      modified = modified.replace(importRegex, '');
      modified = modified.replace(/@font-face\s*\{[^{}]*\}/gi, (match) => {
        if (/url\(\s*['"]?https?:\/\//i.test(match)) return '';
        return match;
      });
      modified = modified.replace(urlRegex, 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)');
    } else {
      modified = modified.replace(importRegex, (_match, quote, url) => {
        const q = quote || '"';
        return `@import url(${q}/proxy?url=${encodeURIComponent(url)}${q});`;
      });
      modified = modified.replace(urlRegex, (_match, quote, url) => {
        return `url(${quote}/proxy?url=${encodeURIComponent(url)}${quote})`;
      });
    }
  }

  return modified;
}

export function sanitizeMessageHTML(rawHtml: string, options: SanitizeOptions): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  const base = doc.createElement('base');
  base.target = '_blank';
  doc.head.prepend(base);

  const csp = doc.createElement('meta');
  csp.httpEquiv = 'Content-Security-Policy';
  csp.content = `script-src 'none'; img-src ${window.location.origin} data: blob: cid:; media-src ${window.location.origin} data: blob: cid:;`;
  doc.head.prepend(csp);

  const style = doc.createElement('style');
  style.textContent = `
    body { margin: 0; padding: 24px; box-sizing: border-box; font: 14px -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; overflow-x: hidden; word-wrap: break-word; background-color: #ffffff; color: #000000; }
    @media (max-width: 768px) { body { padding: 16px !important; } }
    html:not(.x), body:not(.x) { height: auto !important; }
    p:first-child { margin-top: 0; }
    p:last-child { margin-bottom: 0; }
    a[href] { color: #3781b8; text-decoration: none; }
    a[href]:hover { text-decoration: underline; }
    blockquote[type='cite'] { margin: 0 0 0 0.8ex; border-left: 1px #ccc solid; padding-left: 1ex; }
    img { max-width: 100%; height: auto; }
  `;
  doc.head.prepend(style);

  const images = doc.querySelectorAll('img');
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (!src) return;

    if (src.toLowerCase().startsWith('cid:')) {
      const cid = src.substring(4);
      if (options.messageStructure) {
        const partPath = findPartPathByCID(options.messageStructure, cid);
        if (partPath) {
          img.src = `/mailboxes/${encodeURIComponent(options.mailbox)}/messages/${options.messageUid}/raw?part=${partPath}`;
        }
      }
    } else if (src.toLowerCase().startsWith('http://') || src.toLowerCase().startsWith('https://')) {
      if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
      if (!options.allowRemoteResources) {
        img.setAttribute('data-original-src', src);
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        img.style.height = '0';
        img.style.width = '0';
      } else {
        img.src = `/proxy?url=${encodeURIComponent(src)}`;
      }
    }
  });

  const links = doc.querySelectorAll('link[rel="stylesheet"]');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href.toLowerCase().startsWith('http://') || href.toLowerCase().startsWith('https://'))) {
      if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
      if (!options.allowRemoteResources) {
        link.remove();
      } else {
        link.setAttribute('href', `/proxy?url=${encodeURIComponent(href)}`);
      }
    }
  });

  const styleTags = doc.querySelectorAll('style');
  styleTags.forEach(styleTag => {
    if (styleTag.textContent) {
      styleTag.textContent = processCSS(styleTag.textContent, options);
    }
  });

  const urlRegex = /url\(\s*(['"]?)(https?:\/\/[^'"\)]+)\1\s*\)/gi;
  const elementsWithStyle = doc.querySelectorAll('[style]');
  elementsWithStyle.forEach(el => {
    let styleAttr = el.getAttribute('style');
    if (styleAttr && styleAttr.match(urlRegex)) {
      if (options.onRemoteResourceBlocked) options.onRemoteResourceBlocked();
      if (!options.allowRemoteResources) {
        styleAttr = styleAttr.replace(urlRegex, 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)');
      } else {
        styleAttr = styleAttr.replace(urlRegex, (_match, quote, url) => {
          const q = quote || '"';
          return `url(${q}/proxy?url=${encodeURIComponent(url)}${q})`;
        });
      }
      el.setAttribute('style', styleAttr);
    }
  });

  return doc.documentElement.outerHTML;
}
