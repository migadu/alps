import { LitElement, html, css } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import type { Ref } from 'lit/directives/ref.js';
import type { Attachment } from '../utils/attachment-utils';
import { Editor, Extension } from '@tiptap/core';
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

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

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
    } else if (this.replyInputRef.value) {
      this.replyInputRef.value.focus();
      this.replyInputRef.value.setSelectionRange(0, 0);
    }
  }

  public hasSelection(): boolean {
    if (this.format === 'html' && this.editor && !this.editor.isDestroyed) {
      return !this.editor.state.selection.empty;
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

  firstUpdated() {
    this.initEditor();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.editor?.destroy();
  }

  updated(changedProperties: PropertyValues) {
    if (changedProperties.has('isSending') && this.editor) {
      this.editor.setEditable(!this.isSending);
    }
    if (changedProperties.has('format')) {
      const oldFormat = changedProperties.get('format');
      if (oldFormat === 'text' && this.format === 'html') {
        if (this.editor && this.editor.getText() !== this.text) {
          const contentStr = this.text.split('\n').map(line => `<p>${line}</p>`).join('');
          this.editor.commands.setContent(contentStr);
          this.htmlText = this.editor.getHTML();
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
    this.editor = new Editor({
      element: this.editorContainerRef.value,
      extensions: [
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
      ],
      content: this.htmlText || (this.format === 'html' ? this.text.split('\n').map(line => `<p>${line}</p>`).join('') : this.text),
      onUpdate: ({ editor }) => {
        this.htmlText = editor.getHTML();
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
    this.editor.setEditable(!this.isSending);
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
      this.htmlText = this.editor.getHTML();
    }

    this.dispatchEvent(new CustomEvent('text-changed', {
      detail: { text: this.text, html: this.htmlText },
      bubbles: true,
      composed: true
    }));
    textarea.focus();
  }

  public insertEmoji(emoji: string) {
    if (this.format === 'html' && this.editor && !this.editor.isDestroyed) {
      this.editor.chain().focus().insertContent(emoji).run();
    } else {
      const textarea = this.replyInputRef.value;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.setRangeText(emoji, start, end, 'end');
      this.text = textarea.value;
      if (this.editor && !this.editor.isDestroyed) {
        this.htmlText = this.editor.getHTML();
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
