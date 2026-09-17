import { LitElement, html, css, render } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import type { Ref } from 'lit/directives/ref.js';
import type { Attachment } from '../utils/attachment-utils';
import { Editor, Extension, Node as TiptapNode, getSchema } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import { DOMParser as SchemaParser, DOMSerializer } from '@tiptap/pm/model';
import type { Node as ProseMirrorNode, Schema } from '@tiptap/pm/model';
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { renderIcon } from '../utils/ui';
import { popupStyles } from './alps-popup';
import './alps-popup';
import './alps-input.js';
import './alps-button.js';
import { BubbleMenu } from '@tiptap/extension-bubble-menu';
import { getMarkRange } from '@tiptap/core';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { readUserSettings, settingsContext } from '../store/settings-store';
import type { SettingsStore } from '../store/settings-store';
import type { QuoteSource } from '../store/compose-store';
import { QUOTE_ATTRIBUTE } from '../utils/email-quote';
import { sanitizeMessageHTML, sanitizeQuotedHTML } from '../utils/html-sanitizer';
import type { SanitizeOptions } from '../utils/html-sanitizer';
import { applyThemeToIframe, htmlToPlainText, setupIframeSizing } from '../utils/reader-utils';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

/**
 * Where a quote sits in editor.getHTML(): an empty placeholder that
 * serializeEditorHtml fills from the document, so the editor never serializes
 * the quote's markup itself. See QuotedMessage.
 */
const QUOTE_SLOT_ATTRIBUTE = 'data-alps-quote-slot';
const QUOTE_SLOT = `<div ${QUOTE_SLOT_ATTRIBUTE}=""></div>`;

interface QuotedMessageOptions {
  /** Whether the quote frame follows the app's theme, read when it is drawn. */
  themed: () => boolean;
  /** What the quote frame resolves the quote's `cid:` images against. */
  inlineImages: () => Pick<SanitizeOptions, 'mailbox' | 'messageUid' | 'messageStructure'>;
}

/**
 * The plain text of each quote, kept for the life of the node object. The
 * text/plain part is read on every edit, and a node the edit did not touch is
 * the same object as before, so the original is converted once.
 */
const plainTextOf = new WeakMap<ProseMirrorNode, string>();

/**
 * The original message in a reply or forward, held as one block the editor
 * does not look inside.
 *
 * Mail is laid out with tables, fonts, inline styles and images, and the
 * editor's schema has no node or mark for most of that. ProseMirror drops what
 * it cannot represent, so a quote loaded as ordinary content lost its
 * formatting as soon as the composer opened. Held as the markup generateQuote
 * built, it goes out as it came in, and can still be selected and deleted.
 *
 * That markup never becomes live DOM in this page. The quoting sanitizer
 * leaves remote image addresses as the sender wrote them, for the recipient,
 * and an image created in this document fetches its source even while
 * detached: a read receipt the reader's remote-content block exists to refuse.
 * So the quote is shown in a sandboxed frame through the display sanitizer,
 * renderHTML writes an empty placeholder in its place, and serializeEditorHtml
 * fills the placeholder from the document as a string.
 */
const QuotedMessage = TiptapNode.create<QuotedMessageOptions>({
  name: 'quotedMessage',
  group: 'block',
  atom: true,
  draggable: false,
  // Above the editor's own keymap, so the shortcuts below see a Backspace or
  // Delete beside a quote before the editor's join commands do.
  priority: 1000,

  addOptions() {
    return {
      themed: () => true,
      inlineImages: () => ({ mailbox: '', messageUid: '' }),
    };
  },

  addAttributes() {
    return {
      html: {
        default: '',
        rendered: false,
        // Set by the parse rule alone. Left to the editor, the attribute is
        // also read off a literal `html="…"` on the element, unsanitized, and
        // that reading wins over the rule's.
        parseHTML: () => null,
      },
    };
  },

  parseHTML() {
    return [
      {
        // A quote as generateQuote marks it, which includes a saved draft.
        // Sanitized again on the way in, because a draft reopened from the
        // server was not necessarily built by generateQuote.
        tag: `div[${QUOTE_ATTRIBUTE}]`,
        getAttrs: (el) => {
          const safe = sanitizeQuotedHTML(el.outerHTML);
          return safe ? { html: safe } : false;
        },
      },
    ];
  },

  renderHTML() {
    return ['div', { [QUOTE_SLOT_ATTRIBUTE]: '' }];
  },

  // The text/plain part of the message is editor.getText(), and a leaf node
  // contributes nothing to it without this.
  renderText({ node }) {
    let text = plainTextOf.get(node);
    if (text === undefined) {
      text = htmlToPlainText(node.attrs.html);
      plainTextOf.set(node, text);
    }
    return text;
  },

  addKeyboardShortcuts() {
    // A quote beside the caret is selected by the first press and deleted by
    // the next. The editor's own Backspace and Delete delete an adjacent atom
    // outright, which for a quote is the whole original gone for a key the
    // user meant for one character.
    const selectBeside = (side: 'before' | 'after') => () => {
      const { state } = this.editor;
      const { selection } = state;
      if (!(selection instanceof TextSelection) || !selection.$cursor) return false;
      const $cursor = selection.$cursor;
      if (side === 'after') {
        if ($cursor.parentOffset < $cursor.parent.content.size) return false;
        const pos = $cursor.after();
        if (state.doc.nodeAt(pos)?.type !== this.type) return false;
        return this.editor.commands.setNodeSelection(pos);
      }
      if ($cursor.parentOffset > 0) return false;
      const before = state.doc.resolve($cursor.before()).nodeBefore;
      if (before?.type !== this.type) return false;
      return this.editor.commands.setNodeSelection($cursor.before() - before.nodeSize);
    };
    return {
      Backspace: selectBeside('before'),
      'Mod-Backspace': selectBeside('before'),
      'Shift-Backspace': selectBeside('before'),
      Delete: selectBeside('after'),
      'Mod-Delete': selectBeside('after'),
    };
  },

  addProseMirrorPlugins() {
    const base = DOMSerializer.fromSchema(this.editor.schema);
    // A copy carries the quote as the markup it is, for whatever it is pasted
    // into: the placeholder renderHTML writes would paste as nothing. The
    // editor serializes a copy into a document with no browsing context, so
    // the quote's images load nothing here either.
    const clipboardSerializer = new DOMSerializer(
      { ...base.nodes, [this.name]: (node) => inertFragment(node.attrs.html) },
      base.marks,
    );
    return [
      new Plugin({
        key: new PluginKey(this.name),
        props: {
          clipboardSerializer,
          // Pasted markup is content, never a quote. A quote's references
          // belong to the message it was built for — its `cid:` parts, and the
          // reader's rewrites of them if it was copied out of the reader — and
          // the composer pasting it may hold none of them. Markup copied from
          // this editor is stripped too, so a cut quote pastes back as text the
          // schema keeps; a quote is moved whole by dragging it.
          transformPastedHTML: unmarkQuotes,
        },
      }),
    ];
  },

  addNodeView() {
    const { themed, inlineImages } = this.options;
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.className = 'quoted-message';
      dom.contentEditable = 'false';

      const srcdoc = sanitizeMessageHTML(node.attrs.html, { ...inlineImages(), allowRemoteResources: false });
      const theme = themed();
      // No scripts; same origin only so the frame can be sized to its content.
      // Out of the tab order, frame and its links alike: Tab goes from the body
      // to the send row, and a key pressed with focus inside the frame would
      // reach neither the editor nor the composer's shortcuts.
      render(html`<iframe
        sandbox="allow-same-origin"
        tabindex="-1"
        .srcdoc=${srcdoc}
        @load=${(e: Event) => {
          const frame = e.target as HTMLIFrameElement;
          setupIframeSizing(frame, theme);
          fitQuoteWidth(frame, dom);
        }}
      ></iframe>`, dom);

      return { dom, ignoreMutation: () => true };
    };
  },
});

/**
 * Lets a quote wider than the composer scroll sideways.
 *
 * setupIframeSizing locks a frame to its container's width and leaves wide
 * content to scroll inside the frame, which is right for the reader and out of
 * reach here: the frame takes no pointer events, so that a click on the quote
 * selects it. So the frame is widened to its content instead, and the block
 * around it scrolls, which the wheel and the scrollbar both reach. The frame
 * is measured at the block's width each time, so content that fits the block
 * again once it grows is not held at an old width.
 */
function fitQuoteWidth(frame: HTMLIFrameElement, block: HTMLElement): void {
  const doc = frame.contentDocument;
  if (!doc?.body) return;
  const fit = () => {
    frame.style.width = '100%';
    const width = Math.max(doc.documentElement?.scrollWidth || 0, doc.body?.scrollWidth || 0);
    if (width > block.clientWidth) frame.style.width = `${Math.ceil(width)}px`;
  };
  fit();
  const observer = new ResizeObserver(fit);
  observer.observe(doc.body);
  observer.observe(block);
}

/** The markup as DOM nodes of a document with no browsing context, so an
 * image in it fetches nothing. */
function inertFragment(markup: string): DocumentFragment {
  const doc = new DOMParser().parseFromString(markup, 'text/html');
  const fragment = doc.createDocumentFragment();
  while (doc.body.firstChild) fragment.appendChild(doc.body.firstChild);
  return fragment;
}

/** The markup with every quote mark removed, so its parse rule matches nothing. */
function unmarkQuotes(markup: string): string {
  if (!markup.includes(QUOTE_ATTRIBUTE) && !markup.includes(QUOTE_SLOT_ATTRIBUTE)) return markup;
  const doc = new DOMParser().parseFromString(markup, 'text/html');
  for (const el of Array.from(doc.querySelectorAll(`[${QUOTE_ATTRIBUTE}], [${QUOTE_SLOT_ATTRIBUTE}]`))) {
    el.removeAttribute(QUOTE_ATTRIBUTE);
    el.removeAttribute(QUOTE_SLOT_ATTRIBUTE);
  }
  return doc.body.innerHTML;
}

/**
 * The editor's HTML with each quoted original written into its place.
 *
 * Whatever is saved or sent must come from here rather than editor.getHTML(),
 * which leaves an empty placeholder where each quote is. The quotes are read
 * off the document in order and spliced in as strings, so the editor never
 * serializes a quote's markup and nothing here parses it: an edit costs the
 * same whatever the size of the original.
 */
function serializeEditorHtml(editor: Editor): string {
  const html = editor.getHTML();
  if (!html.includes(QUOTE_SLOT)) return html;
  const quotes: string[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === QuotedMessage.name) quotes.push(node.attrs.html);
    return true;
  });
  return html.split(QUOTE_SLOT).reduce((out, part, i) => out + (i ? quotes[i - 1] ?? '' : '') + part, '');
}

/**
 * Editor content parsed from HTML by the editor's own schema, without the
 * editor's whitespace pass.
 *
 * Handed a string, the editor first deletes every text node that is only a
 * newline, throughout the markup, and a quote is read off its element after
 * that: `<b>Total:</b>\n<span>$5</span>` went out as `Total:$5`. Parsed here,
 * in an inert document, the quote is read as it was written.
 */
function contentFromHtml(schema: Schema, markup: string): JSONContent {
  const body = new DOMParser().parseFromString(markup, 'text/html').body;
  return SchemaParser.fromSchema(schema).parse(body).toJSON();
}

/**
 * A text-only original is quoted as an editable blockquote, so it can be
 * trimmed, and the editor's blockquote kept none of what marks it as a quote
 * to the recipient's client: the `gmail_quote` class and the bar down its
 * left. Both are kept on the node and go out with it. A `url()` in the style
 * is dropped, as the quote sanitizer drops it: pasted markup comes this way
 * too, and a background is a fetch on the recipient's side.
 */
const QuoteBar = Extension.create({
  name: 'quoteBar',
  addGlobalAttributes() {
    return [
      {
        types: ['blockquote'],
        attributes: {
          class: {
            default: null,
            parseHTML: (element) => element.getAttribute('class'),
            renderHTML: (attributes) => (attributes.class ? { class: attributes.class } : {}),
          },
          style: {
            default: null,
            parseHTML: (element) => element.getAttribute('style')?.replace(/url\s*\([^)]*\)/gi, '') || null,
            renderHTML: (attributes) => (attributes.style ? { style: attributes.style } : {}),
          },
        },
      },
    ];
  },
});

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

const Indent = Extension.create({
  name: 'indent',
  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      minIndent: 0,
      maxIndent: 240,
      step: 40,
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const marginLeft = parseInt(element.style.marginLeft, 10) || 0;
              return marginLeft;
            },
            renderHTML: attributes => {
              if (!attributes.indent) return {};
              return { style: `margin-left: ${attributes.indent}px` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch, editor }: any) => {
        if (editor.can().sinkListItem('listItem')) {
          return editor.chain().sinkListItem('listItem').run();
        }
        let indentApplied = false;
        state.doc.nodesBetween(state.selection.from, state.selection.to, (node: any, pos: number) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            if (currentIndent < this.options.maxIndent) {
              if (dispatch) tr.setNodeMarkup(pos, null, { ...node.attrs, indent: currentIndent + this.options.step });
              indentApplied = true;
            }
          }
        });
        return indentApplied;
      },
      outdent: () => ({ tr, state, dispatch, editor }: any) => {
        if (editor.can().liftListItem('listItem')) {
          return editor.chain().liftListItem('listItem').run();
        }
        let outdentApplied = false;
        state.doc.nodesBetween(state.selection.from, state.selection.to, (node: any, pos: number) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            if (currentIndent > this.options.minIndent) {
              if (dispatch) tr.setNodeMarkup(pos, null, { ...node.attrs, indent: Math.max(this.options.minIndent, currentIndent - this.options.step) });
              outdentApplied = true;
            }
          }
        });
        return outdentApplied;
      },
    } as any;
  },
});

@customElement('alps-message-composer')
export class AlpsMessageComposer extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @property({ type: Boolean }) isSending = false;
  @property({ type: String }) text = '';
  @property({ type: String }) htmlText = '';
  @property({ type: String }) format: 'html' | 'text' = 'text';

  @state() private attachments: Attachment[] = [];

  @state() private bubbleMenuState: 'view' | 'edit' = 'view';
  @state() private activeLinkUrl = '';
  @state() private activeLinkText = '';

  private replyInputRef: Ref<HTMLTextAreaElement> = createRef();
  private editorContainerRef: Ref<HTMLDivElement> = createRef();
  private bubbleMenuRef: Ref<HTMLDivElement> = createRef();
  public editor?: Editor;

  public focusEditor() {
    if (this.format === 'html' && this.editor && !this.editor.isDestroyed) {
      this.editor.commands.focus('start');
      // The command only places the caret now and focuses on the next frame; a
      // key pressed before that frame would go to whatever held focus.
      this.editor.view.focus();
    } else if (this.replyInputRef.value) {
      this.replyInputRef.value.focus();
      this.replyInputRef.value.setSelectionRange(0, 0);
    }
  }

  /**
   * The message a quote's `cid:` images belong to, for the frame to show
   * them: a forwarded original, or the draft a forward was saved into.
   */
  @property({ attribute: false }) quoteSource?: QuoteSource;

  @consume({ context: settingsContext })
  settingsStore?: SettingsStore;

  public hasSelection(): boolean {
    if (this.format === 'html' && this.editor && !this.editor.isDestroyed) {
      // A selected quote is not text: nothing to prefill a link with.
      const { selection } = this.editor.state;
      return !selection.empty && !(selection instanceof NodeSelection);
    }
    const textarea = this.replyInputRef.value;
    if (textarea) {
      return textarea.selectionStart !== textarea.selectionEnd;
    }
    return false;
  }

  public getSelectionText(): string {
    if (this.format === 'html' && this.editor && !this.editor.isDestroyed) {
      if (this.editor.state.selection.empty) return '';
      const { from, to } = this.editor.state.selection;
      return this.editor.state.doc.textBetween(from, to, ' ');
    }
    const textarea = this.replyInputRef.value;
    if (textarea) {
      return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    }
    return '';
  }

  public getActiveLink(): string | null {
    if (this.format === 'html' && this.editor && !this.editor.isDestroyed) {
      if (this.editor.isActive('link')) {
        return this.editor.getAttributes('link').href || null;
      }
    }
    return null;
  }

  private _getLinkDetails() {
    if (!this.editor || this.editor.isDestroyed || !this.editor.isActive('link')) return { url: '', text: '', range: null };
    const url = this.editor.getAttributes('link').href || '';
    const range = getMarkRange(this.editor.state.selection.$from, this.editor.schema.marks.link);
    let text = '';
    if (range) {
      text = this.editor.state.doc.textBetween(range.from, range.to, ' ');
    }
    return { url, text, range };
  }

  private _enterEditMode() {
    const details = this._getLinkDetails();
    this.activeLinkUrl = details.url;
    this.activeLinkText = details.text;
    this.bubbleMenuState = 'edit';
  }

  private _applyBubbleLink(e: Event) {
    e.preventDefault();
    const urlInput = this.shadowRoot?.querySelector('#bubbleUrl') as HTMLInputElement;
    const textInput = this.shadowRoot?.querySelector('#bubbleText') as HTMLInputElement;
    const newUrl = urlInput?.value || '';
    const newText = textInput?.value || '';

    if (!newUrl || !this.editor || this.editor.isDestroyed) return;

    const details = this._getLinkDetails();
    if (details.range) {
      if (newText !== details.text) {
        this.editor.chain()
          .focus()
          .setTextSelection({ from: details.range.from, to: details.range.to })
          .insertContent(newText)
          .setTextSelection({ from: details.range.from, to: details.range.from + newText.length })
          .setLink({ href: newUrl })
          .run();
      } else {
        this.editor.chain()
          .focus()
          .setLink({ href: newUrl })
          .run();
      }
    }
    this.bubbleMenuState = 'view';
  }

  public get messageText(): string {
    return this.text;
  }

  public get messageHtml(): string {
    return this.htmlText;
  }

  public getAttachments(): Attachment[] {
    return this.attachments;
  }

  private _handleI18nChange = () => {
    this.requestUpdate();
  };

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      this.i18nStore?.addEventListener('change', this._handleI18nChange);
      this.settingsStore?.addEventListener('change', this._handleSettingsChange);
    });
  }

  firstUpdated() {
    this.initEditor();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);
    this.settingsStore?.removeEventListener('change', this._handleSettingsChange);
    this.editor?.destroy();
  }

  /** Whether message frames follow the app's theme, from the store when one is
   * provided and the saved settings otherwise. */
  private _themed(): boolean {
    return this.settingsStore?.getState().themeIframeContent ?? !!readUserSettings().themeIframeContent;
  }

  /**
   * Re-themes every quote frame, as the reader does its frames. A frame is
   * themed when it loads, and the composer stays open across a change of
   * theme: it is docked beside the routes, not inside one.
   */
  private _handleSettingsChange = () => {
    const themed = this._themed();
    this.shadowRoot?.querySelectorAll<HTMLIFrameElement>('.quoted-message iframe').forEach((frame) => {
      applyThemeToIframe(frame, themed);
    });
  };

  updated(changedProperties: PropertyValues) {
    if (changedProperties.has('isSending') && this.editor) {
      // Pass emitUpdate=false: TipTap v3's setEditable emits an "update" event by
      // default, which fires onUpdate. In plaintext mode that would overwrite the
      // user's text with the editor's stale, HTML-derived content right before the
      // message is assembled for sending. See GitHub issue #6.
      this.editor.setEditable(!this.isSending, false);
    }
    if (changedProperties.has('format')) {
      const oldFormat = changedProperties.get('format');
      if (oldFormat === 'text' && this.format === 'html') {
        if (this.editor && this.editor.getText() !== this.text) {
          const contentStr = this.text.split('\n').map(line => `<p>${line}</p>`).join('');
          this.editor.commands.setContent(contentFromHtml(this.editor.schema, contentStr));
          this.htmlText = serializeEditorHtml(this.editor);
        }
      } else if (oldFormat === 'html' && this.format === 'text') {
        if (this.editor) {
          this.text = this.editor.getText();
        }
      }
    }
  }

  private initEditor() {
    if (!this.editorContainerRef.value) return;
    const extensions = [
        StarterKit.configure({
          link: { openOnClick: false }
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        TextStyle,
        Color,
        FontSize,
        Indent,
        QuoteBar,
        QuotedMessage.configure({
          themed: () => this._themed(),
          inlineImages: () => ({
            mailbox: this.quoteSource?.mailbox ?? '',
            messageUid: this.quoteSource?.uid ?? '',
            messageStructure: this.quoteSource?.structure,
          }),
        }),
        BubbleMenu.configure({
          element: this.bubbleMenuRef.value,
          options: {
            placement: 'bottom',
          },
          shouldShow: ({ editor }) => {
            if (this.bubbleMenuState === 'edit') return true;
            return editor.isActive('link');
          },
        }),
    ];
    const initial = this.htmlText || (this.format === 'html' ? this.text.split('\n').map(line => `<p>${line}</p>`).join('') : this.text);
    this.editor = new Editor({
      element: this.editorContainerRef.value,
      extensions,
      // Parsed here rather than by the editor: see contentFromHtml. The schema
      // is the same one the editor builds from these extensions.
      content: contentFromHtml(getSchema(extensions), initial),
      // The editor's stylesheet goes into document.head, which this shadow root
      // never sees; the rules it needs are in this component's own CSS.
      injectCSS: false,
      onUpdate: ({ editor }) => {
        // The TipTap editor is only the source of truth in HTML mode. In plaintext
        // mode the <textarea> owns the content, so ignore editor updates there;
        // otherwise a programmatic editor update (e.g. setEditable(false) on send)
        // would clobber the user's plaintext with stale, HTML-derived text.
        // See GitHub issue #6.
        if (this.format !== 'html') return;
        this.htmlText = serializeEditorHtml(editor);
        this.text = editor.getText();
        this.dispatchEvent(new CustomEvent('text-changed', {
          detail: { text: this.text, html: this.htmlText },
          bubbles: true,
          composed: true
        }));
      },
      onTransaction: ({ editor }) => {
        if (!editor.isActive('link') && this.bubbleMenuState === 'edit') {
          this.bubbleMenuState = 'view';
        }
        this.requestUpdate();
      }
    });
    // No update event: in plaintext mode one would overwrite the textarea's
    // text with the editor's, as `updated` says of the same call.
    this.editor.setEditable(!this.isSending, false);
    this.requestUpdate();
  }

  public clear() {
    if (this.replyInputRef.value) {
      this.replyInputRef.value.value = '';
    }
    this.text = '';
    this.htmlText = '';
    if (this.editor && !this.editor.isDestroyed) {
      this.editor.commands.clearContent();
    }
    this.attachments = [];
    this.dispatchEvent(new CustomEvent('text-changed', {
      detail: { text: '', html: '' },
      bubbles: true,
      composed: true
    }));
  }

  public insertFormatting(prefix: string, suffix: string = '') {
    if (this.format === 'html' && this.editor && !this.editor.isDestroyed) {
      if (prefix === '**') {
        this.editor.chain().focus().toggleBold().run();
      } else if (prefix === '*') {
        this.editor.chain().focus().toggleItalic().run();
      }
      return;
    }

    const textarea = this.replyInputRef.value;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selectedText = value.substring(start, end);

    if (selectedText.startsWith(prefix) && selectedText.endsWith(suffix) && selectedText.length >= prefix.length + suffix.length) {
      const newText = selectedText.substring(prefix.length, selectedText.length - suffix.length);
      textarea.setRangeText(newText, start, end, 'select');
    } else if (
      start >= prefix.length &&
      value.substring(start - prefix.length, start) === prefix &&
      end + suffix.length <= value.length &&
      value.substring(end, end + suffix.length) === suffix
    ) {
      textarea.setRangeText(selectedText, start - prefix.length, end + suffix.length, 'select');
    } else {
      textarea.setRangeText(prefix + selectedText + suffix, start, end, 'select');
      if (start === end) {
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = start + prefix.length;
      }
    }

    this.text = textarea.value;
    if (this.editor && !this.editor.isDestroyed) {
      this.htmlText = serializeEditorHtml(this.editor);
    }

    this.dispatchEvent(new CustomEvent('text-changed', {
      detail: { text: this.text, html: this.htmlText },
      bubbles: true,
      composed: true
    }));
    textarea.focus();
  }

  /**
   * Moves the caret past a selected quote before content is inserted.
   *
   * Inserting replaces the selection, and with the quote selected that is the
   * whole original replaced by an emoji or a link: the link dialog reaches
   * its insert with the quote selected, since a click on the quote selects it
   * and the toolbar keeps the selection. The caret goes into the text block
   * after the quote, which is made when there is none.
   */
  public leaveSelectedNode() {
    const editor = this.editor;
    if (!editor || editor.isDestroyed) return;
    const { selection, doc } = editor.state;
    if (!(selection instanceof NodeSelection)) return;
    const after = selection.to;
    if (doc.resolve(after).nodeAfter?.isTextblock) {
      editor.commands.setTextSelection(after + 1);
      return;
    }
    editor.chain().insertContentAt(after, { type: 'paragraph' }).setTextSelection(after + 1).run();
  }

  public insertEmoji(emoji: string) {
    if (this.format === 'html' && this.editor && !this.editor.isDestroyed) {
      this.leaveSelectedNode();
      this.editor.chain().focus().insertContent(emoji).run();
    } else {
      const textarea = this.replyInputRef.value;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.setRangeText(emoji, start, end, 'end');
      this.text = textarea.value;
      if (this.editor && !this.editor.isDestroyed) {
        this.htmlText = serializeEditorHtml(this.editor);
      }
      this.dispatchEvent(new CustomEvent('text-changed', {
        detail: { text: this.text, html: this.htmlText },
        bubbles: true,
        composed: true
      }));
      textarea.focus();
    }
  }

  private _handleInput(e: Event) {
    this.text = (e.target as HTMLTextAreaElement).value;
    this.dispatchEvent(new CustomEvent('text-changed', {
      detail: { text: this.text, html: this.htmlText },
      bubbles: true,
      composed: true
    }));
  }

  static styles = [
    popupStyles,
    css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      min-height: 0;
    }

    .compose-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      min-height: 0;
    }

    .formatting-toolbar {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-primary);
      flex-wrap: wrap;
    }

    .formatting-toolbar .divider {
      width: 1px;
      height: 20px;
      background-color: var(--border-color);
      margin: 0 4px;
    }

    .reply-box {
      flex: 1;
      width: 100%;
      padding: 12px 16px;
      border: none;
      resize: none;
      font-family: inherit;
      font-size: 14px;
      color: var(--text-color);
      outline: none;
      box-sizing: border-box;
      background: transparent;
    }

    .editor-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 12px 16px;
      font-family: inherit;
      font-size: 14px;
      color: var(--text-color);
      min-height: 0;
    }

    .editor-container .ProseMirror {
      flex: 1;
      outline: none;
      white-space: pre-wrap;
    }

    .editor-container .ProseMirror p {
      margin: 0 0 1em 0;
    }

    .editor-container .ProseMirror a {
      color: var(--accent-color);
      cursor: pointer;
    }

    .editor-container .ProseMirror ul,
    .editor-container .ProseMirror ol {
      margin: 0 0 1em 0;
      padding-left: 1.5em;
    }

    .editor-container .ProseMirror blockquote {
      border-left: 3px solid var(--border-color, #e5e7eb);
      margin: 0 0 1em 0;
      padding-left: 1em;
      color: var(--text-muted, #6b7280);
    }

    /* The editor's own rules, which it injects into document.head and this
       shadow root never sees (injectCSS is off). A selected node hides the
       native selection, or its tint paints over the quote frame; a gap cursor
       has no caret without its rule; the separator is an editor-internal image.
       The gap cursor's bar is steady where the editor's blinks: the blink is an
       infinite animation, and a still bar reads as a caret. */
    .editor-container .ProseMirror [contenteditable="false"] {
      white-space: normal;
    }

    .editor-container .ProseMirror img.ProseMirror-separator {
      display: inline !important;
      border: none !important;
      margin: 0 !important;
      width: 0 !important;
      height: 0 !important;
    }

    .editor-container .ProseMirror-gapcursor {
      display: none;
      pointer-events: none;
      position: absolute;
      margin: 0;
    }

    .editor-container .ProseMirror-gapcursor:after {
      content: "";
      display: block;
      position: absolute;
      top: -2px;
      width: 20px;
      border-top: 1px solid currentColor;
    }

    .editor-container .ProseMirror-hideselection *::selection {
      background: transparent;
    }

    .editor-container .ProseMirror-hideselection * {
      caret-color: transparent;
    }

    .editor-container .ProseMirror-focused .ProseMirror-gapcursor {
      display: block;
    }

    .editor-container .ProseMirror .quoted-message {
      margin: 0 0 1em 0;
      /* A quote wider than the composer scrolls here, not inside the frame,
         which takes no pointer events. See fitQuoteWidth. */
      overflow-x: auto;
    }

    .editor-container .ProseMirror .quoted-message iframe {
      display: block;
      min-width: 100%;
      border: none;
      /* Clicks land on the block instead, so it can be selected and deleted. */
      pointer-events: none;
    }

    .editor-container .ProseMirror .quoted-message.ProseMirror-selectednode {
      outline: 2px solid var(--accent-color);
    }

    .bubble-menu-container {
      visibility: hidden;
      opacity: 0;
      z-index: 50000;
      transition: opacity 0.2s, visibility 0.2s;
      position: absolute;
    }

    .bubble-menu-wrapper {
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 6px;
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 13px;
      min-width: 200px;
    }

    .bubble-menu-wrapper .bubble-view {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
    }

    .bubble-menu-wrapper .bubble-view a {
      color: var(--accent-color, #005A9E);
      text-decoration: none;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-block;
      vertical-align: bottom;
    }

    .bubble-menu-wrapper .bubble-view a:hover {
      text-decoration: underline;
    }

    .bubble-menu-wrapper .divider {
      color: var(--border-color);
    }

    .bubble-menu-wrapper .bubble-btn {
      background: none;
      border: none;
      padding: 0;
      font-size: 13px;
      color: var(--accent-color, #005A9E);
      cursor: pointer;
    }

    .bubble-menu-wrapper .bubble-btn:hover {
      text-decoration: underline;
    }

    .bubble-menu-wrapper .bubble-edit {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .bubble-menu-wrapper .field-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bubble-menu-wrapper .field-row label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .bubble-menu-wrapper .field-row input {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 8px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-family: inherit;
      font-size: 13px;
    }

    .bubble-menu-wrapper .bubble-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }

    .hidden {
      display: none !important;
    }

    .mobile-only {
      display: none !important;
    }

    @media (max-width: 768px) {
      .desktop-only {
        display: none !important;
      }
      .mobile-only {
        display: flex !important;
      }
    }
  `];

  private renderFormattingToolbar() {
    if (!this.editor || this.format !== 'html') return '';

    const currentSize = this.editor.getAttributes('textStyle').fontSize || '14px';

    let alignIcon = 'textAlignLeft';
    const isCenter = this.editor.isActive({ textAlign: 'center' });
    const isRight = this.editor.isActive({ textAlign: 'right' });
    const isLeft = !isCenter && !isRight;

    if (isCenter) alignIcon = 'textAlignCenter';
    if (isRight) alignIcon = 'textAlignRight';

    return html`
      <div class="formatting-toolbar">
        <alps-popup align="left" class="size-popup">
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t('messageComposer.fontSize')} icon="textSize"></alps-icon-btn>
          <button class="dropdown-item ${currentSize === '10px' ? 'active' : ''}" @click=${() => this.editor?.chain().focus().setFontSize('10px').run()}>${this.i18nStore?.t('messageComposer.small')}</button>
          <button class="dropdown-item ${currentSize === '14px' ? 'active' : ''}" @click=${() => this.editor?.chain().focus().setFontSize('14px').run()}>${this.i18nStore?.t('messageComposer.normal')}</button>
          <button class="dropdown-item ${currentSize === '18px' ? 'active' : ''}" @click=${() => this.editor?.chain().focus().setFontSize('18px').run()}>${this.i18nStore?.t('messageComposer.large')}</button>
          <button class="dropdown-item ${currentSize === '24px' ? 'active' : ''}" @click=${() => this.editor?.chain().focus().setFontSize('24px').run()}>${this.i18nStore?.t('messageComposer.huge')}</button>
        </alps-popup>

        <div class="divider"></div>

        <alps-icon-btn ?active=${this.editor.isActive('bold')} @click=${() => this.editor?.chain().focus().toggleBold().run()} title=${this.i18nStore?.t('messageComposer.bold')} icon="textB"></alps-icon-btn>
        <alps-icon-btn ?active=${this.editor.isActive('italic')} @click=${() => this.editor?.chain().focus().toggleItalic().run()} title=${this.i18nStore?.t('messageComposer.italic')} icon="textItalic"></alps-icon-btn>
        <alps-icon-btn ?active=${this.editor.isActive('underline')} @click=${() => this.editor?.chain().focus().toggleUnderline().run()} title=${this.i18nStore?.t('messageComposer.underline')} icon="textUnderline"></alps-icon-btn>
        
        <alps-icon-btn 
          title=${this.i18nStore?.t('messageComposer.textColor')} 
          icon="textAUnderline" 
          @click=${(e: Event) => {
        const btn = e.currentTarget as HTMLElement;
        const input = btn.nextElementSibling as HTMLInputElement;
        if (input) input.click();
      }}>
        </alps-icon-btn>
        <input type="color" style="visibility: hidden; position: absolute; width: 0; height: 0;"
          .value=${this.editor.getAttributes('textStyle').color || '#000000'}
          @input=${(e: any) => this.editor?.chain().focus().setColor(e.target.value).run()} />

        <div class="divider"></div>

        <alps-popup align="left" class="align-popup">
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t('messageComposer.align')} icon="${alignIcon}"></alps-icon-btn>
          <button class="dropdown-item ${isLeft ? 'active' : ''}" @click=${() => this.editor?.chain().focus().setTextAlign('left').run()}>
            ${renderIcon('textAlignLeft')} <span class="item-text">${this.i18nStore?.t('messageComposer.left')}</span>
          </button>
          <button class="dropdown-item ${isCenter ? 'active' : ''}" @click=${() => this.editor?.chain().focus().setTextAlign('center').run()}>
            ${renderIcon('textAlignCenter')} <span class="item-text">${this.i18nStore?.t('messageComposer.center')}</span>
          </button>
          <button class="dropdown-item ${isRight ? 'active' : ''}" @click=${() => this.editor?.chain().focus().setTextAlign('right').run()}>
            ${renderIcon('textAlignRight')} <span class="item-text">${this.i18nStore?.t('messageComposer.right')}</span>
          </button>
        </alps-popup>

        <div class="divider"></div>

        <alps-icon-btn class="desktop-only" ?active=${this.editor.isActive('orderedList')} @click=${() => this.editor?.chain().focus().toggleOrderedList().run()} title=${this.i18nStore?.t('messageComposer.numberedList')} icon="listNumbers"></alps-icon-btn>
        <alps-icon-btn ?active=${this.editor.isActive('bulletList')} @click=${() => this.editor?.chain().focus().toggleBulletList().run()} title=${this.i18nStore?.t('messageComposer.bulletedList')} icon="listBullets"></alps-icon-btn>
        <alps-icon-btn @click=${() => this.editor?.chain().focus().indent().run()} title=${this.i18nStore?.t('messageComposer.indentMore')} icon="textIndent"></alps-icon-btn>
        <alps-icon-btn class="desktop-only" @click=${() => this.editor?.chain().focus().outdent().run()} title=${this.i18nStore?.t('messageComposer.indentLess')} icon="textOutdent"></alps-icon-btn>
        
        <div class="divider"></div>
        <alps-popup align="right" class="more-formatting-popup">
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t('messageComposer.moreFormatting')} icon="dotsThreeVertical"></alps-icon-btn>
          <button class="dropdown-item" @click=${() => this.editor?.chain().focus().undo().run()}>
            ${renderIcon('arrowUUpLeft')} ${this.i18nStore?.t('messageComposer.undo')}
          </button>
          <button class="dropdown-item" @click=${() => this.editor?.chain().focus().redo().run()}>
            ${renderIcon('arrowUUpRight')} ${this.i18nStore?.t('messageComposer.redo')}
          </button>
          <div class="dropdown-divider mobile-only"></div>
          <button class="dropdown-item mobile-only ${this.editor.isActive('orderedList') ? 'active' : ''}" @click=${() => this.editor?.chain().focus().toggleOrderedList().run()}>
            ${renderIcon('listNumbers')} ${this.i18nStore?.t('messageComposer.numberedList')}
          </button>
          <button class="dropdown-item mobile-only" @click=${() => this.editor?.chain().focus().outdent().run()}>
            ${renderIcon('textOutdent')} ${this.i18nStore?.t('messageComposer.indentLess')}
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item ${this.editor.isActive('blockquote') ? 'active' : ''}" @click=${() => this.editor?.chain().focus().toggleBlockquote().run()}>
            ${renderIcon('textQuote')} ${this.i18nStore?.t('messageComposer.quote')}
          </button>
          <button class="dropdown-item ${this.editor.isActive('strike') ? 'active' : ''}" @click=${() => this.editor?.chain().focus().toggleStrike().run()}>
            ${renderIcon('textStrikethrough')} ${this.i18nStore?.t('messageComposer.strikethrough')}
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click=${() => this.editor?.chain().focus().clearNodes().unsetAllMarks().run()}>
            ${renderIcon('textClearFormat')} ${this.i18nStore?.t('messageComposer.clearFormatting')}
          </button>
        </alps-popup>
      </div>
    `;
  }

  render() {
    return html`
      <div class="compose-area">
        ${this.renderFormattingToolbar()}
        <div class="editor-container ${this.format === 'html' ? '' : 'hidden'}" ${ref(this.editorContainerRef)}></div>
        
        <!-- Bubble Menu Container -->
        <div class="bubble-menu-container" ${ref(this.bubbleMenuRef)} 
             @mousedown=${(e: Event) => e.stopPropagation()} 
             @mouseup=${(e: Event) => e.stopPropagation()} 
             @click=${(e: Event) => e.stopPropagation()} 
             @touchstart=${(e: Event) => e.stopPropagation()} 
             @touchend=${(e: Event) => e.stopPropagation()}
             @pointerdown=${(e: Event) => e.stopPropagation()}
             @pointerup=${(e: Event) => e.stopPropagation()}>
          <div class="bubble-menu-wrapper">
            ${this.bubbleMenuState === 'view' ? html`
              <div class="bubble-view" @mousedown=${(e: Event) => e.preventDefault()}>
                <span class="link-label">${this.i18nStore?.t('messageComposer.goToLink')} <a href="${this._getLinkDetails().url}" target="_blank">${this._getLinkDetails().url}</a></span>
                <span class="divider">|</span>
                <button class="bubble-btn" @click=${(e: Event) => { e.preventDefault(); this._enterEditMode(); }}>${this.i18nStore?.t('messageComposer.change')}</button>
                <span class="divider">|</span>
                <button class="bubble-btn" @click=${(e: Event) => { e.preventDefault(); this.editor?.chain().focus().unsetLink().run(); }}>${this.i18nStore?.t('messageComposer.remove')}</button>
              </div>
            ` : html`
              <div class="bubble-edit">
                <div class="field-row">
                  <label>${this.i18nStore?.t('messageComposer.text')}</label>
                  <alps-input inputId="bubbleText" .value=${this.activeLinkText} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._applyBubbleLink(e); e.stopPropagation(); }}></alps-input>
                </div>
                <div class="field-row">
                  <label>${this.i18nStore?.t('messageComposer.link')}</label>
                  <alps-input type="url" inputId="bubbleUrl" .value=${this.activeLinkUrl} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._applyBubbleLink(e); e.stopPropagation(); }}></alps-input>
                </div>
                <div class="bubble-actions">
                  <alps-button variant="text" @click=${(e: Event) => { e.preventDefault(); this.bubbleMenuState = 'view'; }}>${this.i18nStore?.t('general.cancel')}</alps-button>
                  <alps-button variant="normal" @click=${this._applyBubbleLink}>${this.i18nStore?.t('messageComposer.apply')}</alps-button>
                </div>
              </div>
            `}
          </div>
        </div>
        <textarea
          ${ref(this.replyInputRef)}
          class="reply-box ${this.format === 'html' ? 'hidden' : ''}"
          placeholder=${this.i18nStore?.t('messageComposer.writeMessage')}
          ?disabled=${this.isSending}
          .value=${this.text}
          @input=${this._handleInput}
        ></textarea>
      </div>
    `;
  }
}
