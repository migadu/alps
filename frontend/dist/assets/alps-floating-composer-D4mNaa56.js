<<<<<<<< HEAD:frontend/dist/assets/alps-floating-composer-D4mNaa56.js
import{_ as e,d as t,f as n,g as r,m as i,n as a,p as o,s,t as c,u as l,v as u}from"./lit-Db_Hq7O1.js";import{C as d,S as f,_ as p,a as ee,b as m,c as h,d as g,f as _,g as v,h as te,i as y,l as ne,m as b,n as x,o as S,p as C,r as re,s as w,t as T,u as E,v as D,x as O,y as k}from"./index-BHV7B3Zq.js";import{a as A,c as ie,d as j,f as ae,g as M,h as N,i as P,l as F,m as I,n as L,o as R,p as z,r as B,s as V,t as H,u as U}from"./editor-C3zCYtXa.js";import"./emoji-C1rmM34F.js";var W=`data-alps-quote-slot`,G=`<div ${W}=""></div>`,K=new WeakMap,q=ie.create({name:`quotedMessage`,group:`block`,atom:!0,draggable:!1,priority:1e3,addOptions(){return{themed:()=>!0,inlineImages:()=>({mailbox:``,messageUid:``})}},addAttributes(){return{html:{default:``,rendered:!1,parseHTML:()=>null}}},parseHTML(){return[{tag:`div[${y}]`,getAttrs:e=>{let t=S(e.outerHTML);return t?{html:t}:!1}}]},renderHTML(){return[`div`,{[W]:``}]},renderText({node:e}){let t=K.get(e);return t===void 0&&(t=x(e.attrs.html),K.set(e,t)),t},addKeyboardShortcuts(){let e=e=>()=>{let{state:t}=this.editor,{selection:n}=t;if(!(n instanceof I)||!n.$cursor)return!1;let r=n.$cursor;if(e===`after`){if(r.parentOffset<r.parent.content.size)return!1;let e=r.after();return t.doc.nodeAt(e)?.type===this.type?this.editor.commands.setNodeSelection(e):!1}if(r.parentOffset>0)return!1;let i=t.doc.resolve(r.before()).nodeBefore;return i?.type===this.type?this.editor.commands.setNodeSelection(r.before()-i.nodeSize):!1};return{Backspace:e(`before`),"Mod-Backspace":e(`before`),"Shift-Backspace":e(`before`),Delete:e(`after`),"Mod-Delete":e(`after`)}},addProseMirrorPlugins(){let e=M.fromSchema(this.editor.schema),t=new M({...e.nodes,[this.name]:e=>se(e.attrs.html)},e.marks);return[new ae({key:new z(this.name),props:{clipboardSerializer:t,transformPastedHTML:ce}})]},addNodeView(){let{themed:t,inlineImages:n}=this.options;return({node:i})=>{let a=document.createElement(`div`);a.className=`quoted-message`,a.contentEditable=`false`;let o=ee(i.attrs.html,{...n(),allowRemoteResources:!1}),s=t();return r(e`<iframe
========
import{_ as e,d as t,f as n,g as r,m as i,n as a,p as o,s,t as c,u as l,v as u}from"./lit-Db_Hq7O1.js";import{C as d,S as f,_ as p,a as ee,b as m,c as h,d as g,f as _,g as v,h as te,i as y,l as ne,m as b,n as x,o as S,p as C,r as re,s as w,t as T,u as E,v as D,x as O,y as k}from"./index-CCMQIZxV.js";import{a as A,c as ie,d as j,f as ae,g as M,h as N,i as P,l as F,m as I,n as L,o as R,p as z,r as B,s as V,t as H,u as U}from"./editor-C3zCYtXa.js";import"./emoji-C1rmM34F.js";var W=`data-alps-quote-slot`,G=`<div ${W}=""></div>`,K=new WeakMap,q=ie.create({name:`quotedMessage`,group:`block`,atom:!0,draggable:!1,priority:1e3,addOptions(){return{themed:()=>!0,inlineImages:()=>({mailbox:``,messageUid:``})}},addAttributes(){return{html:{default:``,rendered:!1,parseHTML:()=>null}}},parseHTML(){return[{tag:`div[${y}]`,getAttrs:e=>{let t=S(e.outerHTML);return t?{html:t}:!1}}]},renderHTML(){return[`div`,{[W]:``}]},renderText({node:e}){let t=K.get(e);return t===void 0&&(t=x(e.attrs.html),K.set(e,t)),t},addKeyboardShortcuts(){let e=e=>()=>{let{state:t}=this.editor,{selection:n}=t;if(!(n instanceof I)||!n.$cursor)return!1;let r=n.$cursor;if(e===`after`){if(r.parentOffset<r.parent.content.size)return!1;let e=r.after();return t.doc.nodeAt(e)?.type===this.type?this.editor.commands.setNodeSelection(e):!1}if(r.parentOffset>0)return!1;let i=t.doc.resolve(r.before()).nodeBefore;return i?.type===this.type?this.editor.commands.setNodeSelection(r.before()-i.nodeSize):!1};return{Backspace:e(`before`),"Mod-Backspace":e(`before`),"Shift-Backspace":e(`before`),Delete:e(`after`),"Mod-Delete":e(`after`)}},addProseMirrorPlugins(){let e=M.fromSchema(this.editor.schema),t=new M({...e.nodes,[this.name]:e=>se(e.attrs.html)},e.marks);return[new ae({key:new z(this.name),props:{clipboardSerializer:t,transformPastedHTML:ce}})]},addNodeView(){let{themed:t,inlineImages:n}=this.options;return({node:i})=>{let a=document.createElement(`div`);a.className=`quoted-message`,a.contentEditable=`false`;let o=ee(i.attrs.html,{...n(),allowRemoteResources:!1}),s=t();return r(e`<iframe
>>>>>>>> main:frontend/dist/assets/alps-floating-composer-BS4mHMKA.js
        sandbox="allow-same-origin"
        tabindex="-1"
        .srcdoc=${o}
        @load=${e=>{let t=e.target;re(t,s),oe(t,a)}}
      ></iframe>`,a),{dom:a,ignoreMutation:()=>!0}}}});function oe(e,t){let n=e.contentDocument;if(!n?.body)return;let r=()=>{e.style.width=`100%`;let r=Math.max(n.documentElement?.scrollWidth||0,n.body?.scrollWidth||0);r>t.clientWidth&&(e.style.width=`${Math.ceil(r)}px`)};r();let i=new ResizeObserver(r);i.observe(n.body),i.observe(t)}function se(e){let t=new DOMParser().parseFromString(e,`text/html`),n=t.createDocumentFragment();for(;t.body.firstChild;)n.appendChild(t.body.firstChild);return n}function ce(e){if(!e.includes(`data-alps-quote`)&&!e.includes(W))return e;let t=new DOMParser().parseFromString(e,`text/html`);for(let e of Array.from(t.querySelectorAll(`[${y}], [${W}]`)))e.removeAttribute(y),e.removeAttribute(W);return t.body.innerHTML}function J(e){let t=e.getHTML();if(!t.includes(G))return t;let n=[];return e.state.doc.descendants(e=>(e.type.name===q.name&&n.push(e.attrs.html),!0)),t.split(G).reduce((e,t,r)=>e+(r?n[r-1]??``:``)+t,``)}function Y(e,t){let n=new DOMParser().parseFromString(t,`text/html`).body;return N.fromSchema(e).parse(n).toJSON()}var le=V.create({name:`quoteBar`,addGlobalAttributes(){return[{types:[`blockquote`],attributes:{class:{default:null,parseHTML:e=>e.getAttribute(`class`),renderHTML:e=>e.class?{class:e.class}:{}},style:{default:null,parseHTML:e=>e.getAttribute(`style`)?.replace(/url\s*\([^)]*\)/gi,``)||null,renderHTML:e=>e.style?{style:e.style}:{}}}}]}}),ue=V.create({name:`fontSize`,addOptions(){return{types:[`textStyle`]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{fontSize:{default:null,parseHTML:e=>e.style.fontSize?.replace(/['"]+/g,``),renderHTML:e=>e.fontSize?{style:`font-size: ${e.fontSize}`}:{}}}}]},addCommands(){return{setFontSize:e=>({chain:t})=>t().setMark(`textStyle`,{fontSize:e}).run(),unsetFontSize:()=>({chain:e})=>e().setMark(`textStyle`,{fontSize:null}).removeEmptyTextStyle().run()}}}),de=V.create({name:`indent`,addOptions(){return{types:[`paragraph`,`heading`,`blockquote`],minIndent:0,maxIndent:240,step:40}},addGlobalAttributes(){return[{types:this.options.types,attributes:{indent:{default:0,parseHTML:e=>parseInt(e.style.marginLeft,10)||0,renderHTML:e=>e.indent?{style:`margin-left: ${e.indent}px`}:{}}}}]},addCommands(){return{indent:()=>({tr:e,state:t,dispatch:n,editor:r})=>{if(r.can().sinkListItem(`listItem`))return r.chain().sinkListItem(`listItem`).run();let i=!1;return t.doc.nodesBetween(t.selection.from,t.selection.to,(t,r)=>{if(this.options.types.includes(t.type.name)){let a=t.attrs.indent||0;a<this.options.maxIndent&&(n&&e.setNodeMarkup(r,null,{...t.attrs,indent:a+this.options.step}),i=!0)}}),i},outdent:()=>({tr:e,state:t,dispatch:n,editor:r})=>{if(r.can().liftListItem(`listItem`))return r.chain().liftListItem(`listItem`).run();let i=!1;return t.doc.nodesBetween(t.selection.from,t.selection.to,(t,r)=>{if(this.options.types.includes(t.type.name)){let a=t.attrs.indent||0;a>this.options.minIndent&&(n&&e.setNodeMarkup(r,null,{...t.attrs,indent:Math.max(this.options.minIndent,a-this.options.step)}),i=!0)}}),i}}}}),X=class extends i{constructor(...e){super(...e),this.isSending=!1,this.text=``,this.htmlText=``,this.format=`text`,this.attachments=[],this.bubbleMenuState=`view`,this.activeLinkUrl=``,this.activeLinkText=``,this.replyInputRef=c(),this.editorContainerRef=c(),this.bubbleMenuRef=c(),this._handleI18nChange=()=>{this.requestUpdate()},this._handleSettingsChange=()=>{let e=this._themed();this.shadowRoot?.querySelectorAll(`.quoted-message iframe`).forEach(t=>{T(t,e)})}}focusEditor(e=!1){this.format===`html`&&this.editor&&!this.editor.isDestroyed?(this.editor.commands.focus(e?null:`start`),this.editor.view.focus()):this.replyInputRef.value&&(this.replyInputRef.value.focus(),e||this.replyInputRef.value.setSelectionRange(0,0))}hasSelection(){if(this.format===`html`&&this.editor&&!this.editor.isDestroyed){let{selection:e}=this.editor.state;return!e.empty&&!(e instanceof j)}let e=this.replyInputRef.value;return e?e.selectionStart!==e.selectionEnd:!1}getSelectionText(){if(this.format===`html`&&this.editor&&!this.editor.isDestroyed){if(this.editor.state.selection.empty)return``;let{from:e,to:t}=this.editor.state.selection;return this.editor.state.doc.textBetween(e,t,` `)}let e=this.replyInputRef.value;return e?e.value.substring(e.selectionStart,e.selectionEnd):``}getActiveLink(){return this.format===`html`&&this.editor&&!this.editor.isDestroyed&&this.editor.isActive(`link`)&&this.editor.getAttributes(`link`).href||null}_getLinkDetails(){if(!this.editor||this.editor.isDestroyed||!this.editor.isActive(`link`))return{url:``,text:``,range:null};let e=this.editor.getAttributes(`link`).href||``,t=F(this.editor.state.selection.$from,this.editor.schema.marks.link),n=``;return t&&(n=this.editor.state.doc.textBetween(t.from,t.to,` `)),{url:e,text:n,range:t}}_enterEditMode(){let e=this._getLinkDetails();this.activeLinkUrl=e.url,this.activeLinkText=e.text,this.bubbleMenuState=`edit`}_applyBubbleLink(e){e.preventDefault();let t=this.shadowRoot?.querySelector(`#bubbleUrl`),n=this.shadowRoot?.querySelector(`#bubbleText`),r=t?.value||``,i=n?.value||``;if(!r||!this.editor||this.editor.isDestroyed)return;let a=this._getLinkDetails();a.range&&(i===a.text?this.editor.chain().focus().setLink({href:r}).run():this.editor.chain().focus().setTextSelection({from:a.range.from,to:a.range.to}).insertContent(i).setTextSelection({from:a.range.from,to:a.range.from+i.length}).setLink({href:r}).run()),this.bubbleMenuState=`view`}get messageText(){return this.text}get messageHtml(){return this.htmlText}getAttachments(){return this.attachments}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&(this.i18nStore?.addEventListener(`change`,this._handleI18nChange),this.settingsStore?.addEventListener(`change`,this._handleSettingsChange))})}firstUpdated(){this.initEditor()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),this.settingsStore?.removeEventListener(`change`,this._handleSettingsChange),this.editor?.destroy()}_themed(){return this.settingsStore?.getState().themeIframeContent??!!k().themeIframeContent}updated(e){if(e.has(`isSending`)&&this.editor&&this.editor.setEditable(!this.isSending,!1),e.has(`format`)){let t=e.get(`format`);if(t===`text`&&this.format===`html`){if(this.editor&&this.editor.getText()!==this.text){let e=this.text.split(`
`).map(e=>`<p>${e}</p>`).join(``);this.editor.commands.setContent(Y(this.editor.schema,e)),this.htmlText=J(this.editor)}}else t===`html`&&this.format===`text`&&this.editor&&(this.text=this.editor.getText())}}initEditor(){if(!this.editorContainerRef.value)return;let e=[A.configure({link:{openOnClick:!1}}),P.configure({types:[`heading`,`paragraph`]}),B,L,ue,de,le,q.configure({themed:()=>this._themed(),inlineImages:()=>({mailbox:this.quoteSource?.mailbox??``,messageUid:this.quoteSource?.uid??``,messageStructure:this.quoteSource?.structure})}),H.configure({element:this.bubbleMenuRef.value,options:{placement:`bottom`},shouldShow:({editor:e})=>this.bubbleMenuState===`edit`?!0:e.isActive(`link`)})],t=this.htmlText||(this.format===`html`?this.text.split(`
`).map(e=>`<p>${e}</p>`).join(``):this.text);this.editor=new R({element:this.editorContainerRef.value,extensions:e,content:Y(U(e),t),injectCSS:!1,onUpdate:({editor:e})=>{this.format===`html`&&(this.htmlText=J(e),this.text=e.getText(),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0})))},onTransaction:({editor:e})=>{!e.isActive(`link`)&&this.bubbleMenuState===`edit`&&(this.bubbleMenuState=`view`),this.requestUpdate()}}),this.editor.setEditable(!this.isSending,!1),this.requestUpdate()}clear(){this.replyInputRef.value&&(this.replyInputRef.value.value=``),this.text=``,this.htmlText=``,this.editor&&!this.editor.isDestroyed&&this.editor.commands.clearContent(),this.attachments=[],this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:``,html:``},bubbles:!0,composed:!0}))}insertFormatting(e,t=``){if(this.format===`html`&&this.editor&&!this.editor.isDestroyed){e===`**`?this.editor.chain().focus().toggleBold().run():e===`*`&&this.editor.chain().focus().toggleItalic().run();return}let n=this.replyInputRef.value;if(!n)return;let r=n.selectionStart,i=n.selectionEnd,a=n.value,o=a.substring(r,i);if(o.startsWith(e)&&o.endsWith(t)&&o.length>=e.length+t.length){let a=o.substring(e.length,o.length-t.length);n.setRangeText(a,r,i,`select`)}else r>=e.length&&a.substring(r-e.length,r)===e&&i+t.length<=a.length&&a.substring(i,i+t.length)===t?n.setRangeText(o,r-e.length,i+t.length,`select`):(n.setRangeText(e+o+t,r,i,`select`),r===i&&(n.selectionStart=r+e.length,n.selectionEnd=r+e.length));this.text=n.value,this.editor&&!this.editor.isDestroyed&&(this.htmlText=J(this.editor)),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0})),n.focus()}leaveSelectedNode(){let e=this.editor;if(!e||e.isDestroyed)return;let{selection:t,doc:n}=e.state;if(!(t instanceof j))return;let r=t.to;if(n.resolve(r).nodeAfter?.isTextblock){e.commands.setTextSelection(r+1);return}e.chain().insertContentAt(r,{type:`paragraph`}).setTextSelection(r+1).run()}insertEmoji(e){if(this.format===`html`&&this.editor&&!this.editor.isDestroyed)this.leaveSelectedNode(),this.editor.chain().focus().insertContent(e).run();else{let t=this.replyInputRef.value;if(!t)return;let n=t.selectionStart,r=t.selectionEnd;t.setRangeText(e,n,r,`end`),this.text=t.value,this.editor&&!this.editor.isDestroyed&&(this.htmlText=J(this.editor)),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0})),t.focus()}}_handleInput(e){this.text=e.target.value,this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0}))}static{this.styles=[v,u`
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
  `]}renderFormattingToolbar(){if(!this.editor||this.format!==`html`)return``;let t=this.editor.getAttributes(`textStyle`).fontSize||`14px`,n=`textAlignLeft`,r=this.editor.isActive({textAlign:`center`}),i=this.editor.isActive({textAlign:`right`}),a=!r&&!i;return r&&(n=`textAlignCenter`),i&&(n=`textAlignRight`),e`
      <div class="formatting-toolbar">
        <alps-popup align="left" class="size-popup">
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`messageComposer.fontSize`)} icon="textSize"></alps-icon-btn>
          <button class="dropdown-item ${t===`10px`?`active`:``}" @click=${()=>this.editor?.chain().focus().setFontSize(`10px`).run()}>${this.i18nStore?.t(`messageComposer.small`)}</button>
          <button class="dropdown-item ${t===`14px`?`active`:``}" @click=${()=>this.editor?.chain().focus().setFontSize(`14px`).run()}>${this.i18nStore?.t(`messageComposer.normal`)}</button>
          <button class="dropdown-item ${t===`18px`?`active`:``}" @click=${()=>this.editor?.chain().focus().setFontSize(`18px`).run()}>${this.i18nStore?.t(`messageComposer.large`)}</button>
          <button class="dropdown-item ${t===`24px`?`active`:``}" @click=${()=>this.editor?.chain().focus().setFontSize(`24px`).run()}>${this.i18nStore?.t(`messageComposer.huge`)}</button>
        </alps-popup>

        <div class="divider"></div>

        <alps-icon-btn ?active=${this.editor.isActive(`bold`)} @click=${()=>this.editor?.chain().focus().toggleBold().run()} title=${this.i18nStore?.t(`messageComposer.bold`)} icon="textB"></alps-icon-btn>
        <alps-icon-btn ?active=${this.editor.isActive(`italic`)} @click=${()=>this.editor?.chain().focus().toggleItalic().run()} title=${this.i18nStore?.t(`messageComposer.italic`)} icon="textItalic"></alps-icon-btn>
        <alps-icon-btn ?active=${this.editor.isActive(`underline`)} @click=${()=>this.editor?.chain().focus().toggleUnderline().run()} title=${this.i18nStore?.t(`messageComposer.underline`)} icon="textUnderline"></alps-icon-btn>
        
        <alps-icon-btn 
          title=${this.i18nStore?.t(`messageComposer.textColor`)} 
          icon="textAUnderline" 
          @click=${e=>{let t=e.currentTarget.nextElementSibling;t&&t.click()}}>
        </alps-icon-btn>
        <input type="color" style="visibility: hidden; position: absolute; width: 0; height: 0;"
          .value=${this.editor.getAttributes(`textStyle`).color||`#000000`}
          @input=${e=>this.editor?.chain().focus().setColor(e.target.value).run()} />

        <div class="divider"></div>

        <alps-popup align="left" class="align-popup">
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`messageComposer.align`)} icon="${n}"></alps-icon-btn>
          <button class="dropdown-item ${a?`active`:``}" @click=${()=>this.editor?.chain().focus().setTextAlign(`left`).run()}>
            ${D(`textAlignLeft`)} <span class="item-text">${this.i18nStore?.t(`messageComposer.left`)}</span>
          </button>
          <button class="dropdown-item ${r?`active`:``}" @click=${()=>this.editor?.chain().focus().setTextAlign(`center`).run()}>
            ${D(`textAlignCenter`)} <span class="item-text">${this.i18nStore?.t(`messageComposer.center`)}</span>
          </button>
          <button class="dropdown-item ${i?`active`:``}" @click=${()=>this.editor?.chain().focus().setTextAlign(`right`).run()}>
            ${D(`textAlignRight`)} <span class="item-text">${this.i18nStore?.t(`messageComposer.right`)}</span>
          </button>
        </alps-popup>

        <div class="divider"></div>

        <alps-icon-btn class="desktop-only" ?active=${this.editor.isActive(`orderedList`)} @click=${()=>this.editor?.chain().focus().toggleOrderedList().run()} title=${this.i18nStore?.t(`messageComposer.numberedList`)} icon="listNumbers"></alps-icon-btn>
        <alps-icon-btn ?active=${this.editor.isActive(`bulletList`)} @click=${()=>this.editor?.chain().focus().toggleBulletList().run()} title=${this.i18nStore?.t(`messageComposer.bulletedList`)} icon="listBullets"></alps-icon-btn>
        <alps-icon-btn @click=${()=>this.editor?.chain().focus().indent().run()} title=${this.i18nStore?.t(`messageComposer.indentMore`)} icon="textIndent"></alps-icon-btn>
        <alps-icon-btn class="desktop-only" @click=${()=>this.editor?.chain().focus().outdent().run()} title=${this.i18nStore?.t(`messageComposer.indentLess`)} icon="textOutdent"></alps-icon-btn>
        
        <div class="divider"></div>
        <alps-popup align="right" class="more-formatting-popup">
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`messageComposer.moreFormatting`)} icon="dotsThreeVertical"></alps-icon-btn>
          <button class="dropdown-item" @click=${()=>this.editor?.chain().focus().undo().run()}>
            ${D(`arrowUUpLeft`)} ${this.i18nStore?.t(`messageComposer.undo`)}
          </button>
          <button class="dropdown-item" @click=${()=>this.editor?.chain().focus().redo().run()}>
            ${D(`arrowUUpRight`)} ${this.i18nStore?.t(`messageComposer.redo`)}
          </button>
          <div class="dropdown-divider mobile-only"></div>
          <button class="dropdown-item mobile-only ${this.editor.isActive(`orderedList`)?`active`:``}" @click=${()=>this.editor?.chain().focus().toggleOrderedList().run()}>
            ${D(`listNumbers`)} ${this.i18nStore?.t(`messageComposer.numberedList`)}
          </button>
          <button class="dropdown-item mobile-only" @click=${()=>this.editor?.chain().focus().outdent().run()}>
            ${D(`textOutdent`)} ${this.i18nStore?.t(`messageComposer.indentLess`)}
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item ${this.editor.isActive(`blockquote`)?`active`:``}" @click=${()=>this.editor?.chain().focus().toggleBlockquote().run()}>
            ${D(`textQuote`)} ${this.i18nStore?.t(`messageComposer.quote`)}
          </button>
          <button class="dropdown-item ${this.editor.isActive(`strike`)?`active`:``}" @click=${()=>this.editor?.chain().focus().toggleStrike().run()}>
            ${D(`textStrikethrough`)} ${this.i18nStore?.t(`messageComposer.strikethrough`)}
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click=${()=>this.editor?.chain().focus().clearNodes().unsetAllMarks().run()}>
            ${D(`textClearFormat`)} ${this.i18nStore?.t(`messageComposer.clearFormatting`)}
          </button>
        </alps-popup>
      </div>
    `}render(){return e`
      <div class="compose-area">
        ${this.renderFormattingToolbar()}
        <div class="editor-container ${this.format===`html`?``:`hidden`}" ${a(this.editorContainerRef)}></div>
        
        <!-- Bubble Menu Container -->
        <div class="bubble-menu-container" ${a(this.bubbleMenuRef)} 
             @mousedown=${e=>e.stopPropagation()} 
             @mouseup=${e=>e.stopPropagation()} 
             @click=${e=>e.stopPropagation()} 
             @touchstart=${e=>e.stopPropagation()} 
             @touchend=${e=>e.stopPropagation()}
             @pointerdown=${e=>e.stopPropagation()}
             @pointerup=${e=>e.stopPropagation()}>
          <div class="bubble-menu-wrapper">
            ${this.bubbleMenuState===`view`?e`
              <div class="bubble-view" @mousedown=${e=>e.preventDefault()}>
                <span class="link-label">${this.i18nStore?.t(`messageComposer.goToLink`)} <a href="${this._getLinkDetails().url}" target="_blank">${this._getLinkDetails().url}</a></span>
                <span class="divider">|</span>
                <button class="bubble-btn" @click=${e=>{e.preventDefault(),this._enterEditMode()}}>${this.i18nStore?.t(`messageComposer.change`)}</button>
                <span class="divider">|</span>
                <button class="bubble-btn" @click=${e=>{e.preventDefault(),this.editor?.chain().focus().unsetLink().run()}}>${this.i18nStore?.t(`messageComposer.remove`)}</button>
              </div>
            `:e`
              <div class="bubble-edit">
                <div class="field-row">
                  <label>${this.i18nStore?.t(`messageComposer.text`)}</label>
                  <alps-input inputId="bubbleText" .value=${this.activeLinkText} @keydown=${e=>{e.key===`Enter`&&this._applyBubbleLink(e),e.stopPropagation()}}></alps-input>
                </div>
                <div class="field-row">
                  <label>${this.i18nStore?.t(`messageComposer.link`)}</label>
                  <alps-input type="url" inputId="bubbleUrl" .value=${this.activeLinkUrl} @keydown=${e=>{e.key===`Enter`&&this._applyBubbleLink(e),e.stopPropagation()}}></alps-input>
                </div>
                <div class="bubble-actions">
                  <alps-button variant="text" @click=${e=>{e.preventDefault(),this.bubbleMenuState=`view`}}>${this.i18nStore?.t(`general.cancel`)}</alps-button>
                  <alps-button variant="normal" @click=${this._applyBubbleLink}>${this.i18nStore?.t(`messageComposer.apply`)}</alps-button>
                </div>
              </div>
            `}
          </div>
        </div>
        <textarea
          ${a(this.replyInputRef)}
          class="reply-box ${this.format===`html`?`hidden`:``}"
          placeholder=${this.i18nStore?.t(`messageComposer.writeMessage`)}
          ?disabled=${this.isSending}
          .value=${this.text}
          @input=${this._handleInput}
        ></textarea>
      </div>
    `}};p([s({context:O})],X.prototype,`i18nStore`,void 0),p([n({type:Boolean})],X.prototype,`isSending`,void 0),p([n({type:String})],X.prototype,`text`,void 0),p([n({type:String})],X.prototype,`htmlText`,void 0),p([n({type:String})],X.prototype,`format`,void 0),p([t()],X.prototype,`attachments`,void 0),p([t()],X.prototype,`bubbleMenuState`,void 0),p([t()],X.prototype,`activeLinkUrl`,void 0),p([t()],X.prototype,`activeLinkText`,void 0),p([n({attribute:!1})],X.prototype,`quoteSource`,void 0),p([s({context:m})],X.prototype,`settingsStore`,void 0),X=p([o(`alps-message-composer`)],X);var Z=class extends i{constructor(...e){super(...e),this.position=`bottom`}static{this.styles=u`
    :host {
      display: inline-block;
    }

    .selector-container {
      display: flex;
      flex-direction: column;
      width: 320px;
      height: 400px;
    }

    unicode-emoji-picker {
      width: 100%;
      height: 100%;
      --fill-color: var(--bg-primary, #ffffff);
      --text-color: var(--text-primary, #111827);
      --box-shadow: none;
      --border-radius: 0;
      
      /* Theme mappings */
      --filters-border-color: var(--border-color, #e5e7eb);
      --filter-fill-color-hover: var(--hover-color, #f3f4f6);
      --content-scrollbar-thumb-fill-color: var(--border-color, #e5e7eb);
      --content-scrollbar-thumb-fill-color-hover: var(--text-muted, #6b7280);
      --filter-active-marker-border-color: var(--accent-color, #005A9E);
      --title-bar-fill-color: var(--bg-primary, #ffffff);
      --search-input-border-color: var(--border-color, #e5e7eb);
      --search-input-border-color-hover: var(--accent-color, #005A9E);
      --emoji-border-color-hover: var(--hover-color, #f3f4f6);
      
      font-size: 16px;
    }

    /* Target specific parts of the picker to hide the top/bottom borders that popup might have */
  `}_handleEmojiPick(e){let t=e.detail.emoji;this.popup&&this.popup.close(),this.dispatchEvent(new CustomEvent(`emoji-selected`,{detail:{emoji:t},bubbles:!0,composed:!0}))}_handlePopupToggle(){}render(){return e`
      <alps-popup align="left" position="${this.position}" @click=${this._handlePopupToggle}>
        <slot name="trigger" slot="trigger"></slot>
        <div class="selector-container" @click=${e=>e.stopPropagation()}>
          <unicode-emoji-picker
            filters-position="top"
            @emoji-pick=${this._handleEmojiPick}
          ></unicode-emoji-picker>
        </div>
      </alps-popup>
    `}};p([n({type:String})],Z.prototype,`position`,void 0),p([l(`alps-popup`)],Z.prototype,`popup`,void 0),Z=p([o(`alps-emoji-selector-popup`)],Z);var Q=5e3,$=class extends i{constructor(...e){super(...e),this.index=0,this.totalOpen=1,this.totalMinimized=0,this.openIndex=0,this.minimizedIndex=0,this.showCc=!1,this.showBcc=!1,this.showDiscardConfirm=!1,this.pendingDiscardType=null,this.windowWidth=window.innerWidth,this.windowHeight=window.innerHeight,this.isSaving=!1,this.isDragOver=!1,this.autoSaveTimer=null,this._handleI18nChange=()=>{this.requestUpdate()},this._handleWindowDragOver=()=>{this.isDragOver&&=!1},this._handleWindowDragLeave=e=>{e.relatedTarget===null&&this.isDragOver&&(this.isDragOver=!1)},this._handleGlobalDropHandled=()=>{this.isDragOver&&=!1},this._handleResize=()=>{this.windowWidth=window.innerWidth,this.windowHeight=window.innerHeight},this._wasActiveOnMousedown=!1,this.linkPromptFields=[],this._handleDragOver=e=>{this.instance.isSending||this.instance.minimized||(e.preventDefault(),e.stopPropagation(),this.isDragOver=!0)},this._handleDragLeave=e=>{e.preventDefault(),e.stopPropagation(),this.isDragOver=!1},this._handleDrop=e=>{if(this.instance.isSending||this.instance.minimized)return;e.preventDefault(),e.stopPropagation(),this.isDragOver=!1,window.dispatchEvent(new CustomEvent(`alps-composer-drop`));let t=Array.from(e.dataTransfer?.files||[]);t.length>0&&this._startUpload(t)}}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this._handleResize),window.addEventListener(`dragover`,this._handleWindowDragOver),window.addEventListener(`dragleave`,this._handleWindowDragLeave),window.addEventListener(`alps-composer-drop`,this._handleGlobalDropHandled),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),this.instance.cc&&this.instance.cc.length>0&&(this.showCc=!0),this.instance.bcc&&this.instance.bcc.length>0&&(this.showBcc=!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this._handleResize),window.removeEventListener(`dragover`,this._handleWindowDragOver),window.removeEventListener(`dragleave`,this._handleWindowDragLeave),window.removeEventListener(`alps-composer-drop`,this._handleGlobalDropHandled),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),this._clearAutoSave()}firstUpdated(){this._focusNewEditor()}async _focusNewEditor(){let e=this.composer;e&&(await e.updateComplete,this.isConnected&&e.isConnected&&e.focusEditor?.())}_clearAutoSave(){this.autoSaveTimer!==null&&(window.clearTimeout(this.autoSaveTimer),this.autoSaveTimer=null)}updated(e){e.has(`instance`)&&this.instance.dirty&&!this.instance.isSending&&this._scheduleAutoSave()}_scheduleAutoSave(){this._clearAutoSave(),this.autoSaveTimer=window.setTimeout(()=>{this._saveDraft()},3e3)}async _saveDraft(){let e=this.composeStore.getComposer(this.instance.id)||this.instance;if(e.isSending||this.isSaving)return!1;let t=(e.to?.length||0)>0||(e.cc?.length||0)>0||(e.bcc?.length||0)>0,n=e.attachments&&e.attachments.length>0,r=e.text?.trim()!==e.initialText?.trim()||(e.subject?.trim().length||0)>0||n;if(!t&&!r)return!0;this.isSaving=!0;try{let t=(e.attachments||[]).map(e=>e.uuid).filter(Boolean),n=this._buildFormData(e);n.append(`save_as_draft`,`1`);let r=await b.saveDraft(n);if(r){let e=this.instance.draftUid;window.dispatchEvent(new CustomEvent(`draft-autosaved`,{detail:{oldUid:e,oldMailbox:this.instance.draftMailbox,newUid:r.uid,mailbox:r.mailbox,subject:this.instance.subject,to:this.instance.to,cc:this.instance.cc,bcc:this.instance.bcc,size:r.size,hasAttachments:this.instance.attachments&&this.instance.attachments.length>0}}))}if(!this.isConnected)return!!r;if(r){let n={dirty:!1,draftUid:r.uid,draftMailbox:r.mailbox};if(r.attachments){let i=(e.attachments||[]).filter(e=>!!(e._tempId||e.uuid&&!t.includes(e.uuid)));n.attachments=[...r.attachments,...i]}this.composeStore.updateComposer(this.instance.id,n);let i=this.composeStore.getComposer(this.instance.id),a=(i?.attachments||[]).some(e=>e.uuid&&!t.includes(e.uuid));(i?.dirty||a)&&this._scheduleAutoSave()}return!!r}finally{this.isSaving=!1}}_buildFormData(e){let t=new FormData,n=e.to||[],r=e.cc||[],i=[...e.bcc||[]],a=``;{let e=k(),t=e.loginUsername,n=t?w(t):``;e.bccMyself&&t&&!i.some(e=>w(e)===n)&&i.push(t),e.replyTo&&(a=e.replyTo)}let o=e.text||``,s=(e.subject||``).trim();t.append(`to`,n.join(`, `)),t.append(`cc`,r.join(`, `)),t.append(`bcc`,i.join(`, `)),a&&t.append(`reply_to`,a),t.append(`subject`,s),t.append(`text`,o),e.format===`html`&&e.html&&t.append(`html`,e.html);let c=e.attachments||[],l=c.map(e=>e.uuid).filter(Boolean).join(`,`);l&&t.append(`attachment-uuids`,l);let u=c.map(e=>e.partPath).filter(Boolean).join(`,`);return u&&t.append(`prev_attachments`,u),e.draftMailbox&&t.append(`draft_mailbox`,e.draftMailbox),e.draftUid&&t.append(`draft_uid`,e.draftUid),ne(t,e),t}get composer(){return this.shadowRoot.querySelector(`alps-message-composer`)}_toggleMinimize(){this.composeStore.updateComposer(this.instance.id,{minimized:!this.instance.minimized,expanded:!1})}_handleHeaderClick(){this.composeStore.bringComposerToFront(this.instance.id),this.instance.minimized?(this.composeStore.updateComposer(this.instance.id,{minimized:!1}),setTimeout(()=>{this.isConnected&&this.composer&&this.composer.focusEditor&&this.composer.focusEditor(!0)},100)):this._wasActiveOnMousedown||setTimeout(()=>{this.isConnected&&this.composer&&this.composer.focusEditor&&this.composer.focusEditor(!0)},100)}_toggleExpand(){this.composeStore.updateComposer(this.instance.id,{expanded:!this.instance.expanded,minimized:!1})}async _finishDeferredClose(){if(await this._saveDraft()){this.composeStore.closeComposer(this.instance.id);return}this.composeStore.updateComposer(this.instance.id,{closing:!1}),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.draftSaveFailedKeepOpen`)||`Could not save this draft — the window stays open so nothing is lost`,duration:6e3}}))}async _handleCloseClick(){if((this.instance.attachments||[]).some(e=>e.uploading)){this.composeStore.updateComposer(this.instance.id,{closing:!0});return}if(this.instance.dirty&&!await this._saveDraft()){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.draftSaveFailedKeepOpen`)||`Could not save this draft — the window stays open so nothing is lost`,duration:6e3}}));return}this.composeStore.closeComposer(this.instance.id)}_handleDiscardClick(){this._clearAutoSave();let e=!!this.instance.draftUid,t=this.instance.dirty,n=(this.instance.to?.length||0)>0||(this.instance.cc?.length||0)>0||(this.instance.bcc?.length||0)>0,r=this.instance.attachments&&this.instance.attachments.length>0,i=this.instance.text?.trim()!==this.instance.initialText?.trim()||(this.instance.subject?.trim().length||0)>0||r;!(!n&&!i)||e||t?(this.pendingDiscardType=`delete`,this.showDiscardConfirm=!0):this._performDiscard(`delete`)}async _confirmDiscard(){this.showDiscardConfirm=!1;let e=this.pendingDiscardType;this.pendingDiscardType=null,this._performDiscard(e)}_toastDiscardFailed(){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.discardFailed`)||`The draft could not be deleted from the server and is still in Drafts.`,duration:5e3}}))}async _performDiscard(e){if(e===`delete`&&this.instance.draftUid&&this.instance.draftMailbox){let e=this.instance.draftMailbox,t=String(this.instance.draftUid);try{let n=await b.deleteMessagesResult(e,[t]);n.ok&&window.dispatchEvent(new CustomEvent(`draft-discarded`,{detail:{mailbox:e,uid:t}})),!n.ok&&n.reason!==`auth`&&this._toastDiscardFailed()}catch(e){f.error(`Failed to delete draft`,e),this._toastDiscardFailed()}}if(this.instance.attachments)for(let e of this.instance.attachments)e._tempId?E(e._tempId):e.uuid&&g(e.uuid);this.composeStore.closeComposer(this.instance.id)}_cancelDiscard(){this.showDiscardConfirm=!1,this.pendingDiscardType=null,this.instance.dirty&&this._scheduleAutoSave()}_bringToFront(){let e=this.composeStore.getState().activeComposers,t=1e3;e.forEach(e=>{e.zIndex&&e.zIndex>t&&(t=e.zIndex)}),this._wasActiveOnMousedown=(this.instance.zIndex||0)>=t,this.composeStore.bringComposerToFront(this.instance.id)}_handleLinkClick(){if(!this.composer)return;this.composer.focusEditor&&this.composer.focusEditor(!0);let e=this.composer.hasSelection(),t=this.composer.getActiveLink?this.composer.getActiveLink():null;if(t)this.linkPromptFields=[{id:`url`,label:this.i18nStore?.t(`floatingComposer.linkUrl`),placeholder:this.i18nStore?.t(`floatingComposer.linkUrlPlaceholder`),value:t}];else{let t=e&&this.composer.getSelectionText?this.composer.getSelectionText():``;this.linkPromptFields=[{id:`text`,label:this.i18nStore?.t(`floatingComposer.displayText`),placeholder:this.i18nStore?.t(`floatingComposer.displayTextPlaceholder`),value:t},{id:`url`,label:this.i18nStore?.t(`floatingComposer.linkUrl`),placeholder:this.i18nStore?.t(`floatingComposer.linkUrlPlaceholder`)}]}this.updateComplete.then(()=>{for(let e of this._linkPromptFieldElements())e.value=this.linkPromptFields.find(t=>t.id===e.inputId)?.value||``})}_linkPromptFieldElements(){return Array.from(this.shadowRoot?.querySelectorAll(`#linkPopup alps-input`)??[])}_linkPromptValues(){let e={};for(let t of this._linkPromptFieldElements())e[t.inputId]=t.value;return e}_handleLinkSubmit(){let e=this.shadowRoot?.querySelector(`#linkPopup`);if(e&&e.close(),!this.composer)return;let{text:t,url:n}=this._linkPromptValues();if(n)if(this.instance.format===`html`&&this.composer.editor){let e=this.composer.editor;if(this.composer.leaveSelectedNode?.(),t)e.chain().focus().insertContent(`<a href="${n}">${t}</a>`).command(({tr:t,dispatch:n})=>(n&&e.schema.marks.link&&t.removeStoredMark(e.schema.marks.link),!0)).run();else{let t=e.state.selection.to;e.chain().focus().setLink({href:n}).setTextSelection(t).command(({tr:t,dispatch:n})=>(n&&e.schema.marks.link&&t.removeStoredMark(e.schema.marks.link),!0)).run()}}else t?this.composer.insertFormatting(``,`[${t}](${n})`):this.composer.insertFormatting(`[`,`](${n})`)}async _handleSend(){if((this.instance.attachments||[]).some(e=>e.uploading)){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.attachmentsWait`),duration:3e3}}));return}let e=this.instance.text||``,t=this.instance.to||[],n=this.instance.cc||[],r=this.instance.bcc||[],i=[...t,...n,...r];if(!(!e||i.length===0)){this._clearAutoSave(),this.composeStore.updateComposer(this.instance.id,{isSending:!0,minimized:!0});try{let e,t,n=new Promise(n=>{let r=window.setTimeout(()=>{n(!0)},Q);e=()=>{window.clearTimeout(r),n(!1)},t=()=>{window.clearTimeout(r),n(!0)}});if(window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.sending`),actionLabel:this.i18nStore?.t(`composer.undo`),actionFn:()=>{e&&e()},dismissFn:()=>{t&&t()},duration:Q}})),!await n){this.composeStore.updateComposer(this.instance.id,{isSending:!1,minimized:!1}),this.composeStore.bringComposerToFront(this.instance.id);return}let r=this.composeStore.getComposer(this.instance.id)||this.instance,a=this._buildFormData(r),{results:o,failed:s}=await d.invokeHookSettled(`composer:presend`,{composer:this,formData:a,instance:r}),c=s>0;for(let e of o)e instanceof FormData?a=e:e===!1&&(c=!0);if(c){this.composeStore.updateComposer(this.instance.id,{isSending:!1,minimized:!1}),this.composeStore.bringComposerToFront(this.instance.id),s>0&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.presendFailed`),duration:5e3}}));return}if(!await b.sendDraft(a)){this.composeStore.updateComposer(this.instance.id,{isSending:!1});return}d.invokeHook(`composer:send`,{recipients:i}),r.draftMailbox&&te.fetch(r.draftMailbox,0,``,!1),this.composeStore.closeComposer(this.instance.id)}catch(e){f.error(`Failed to send message:`,e),this.composeStore.updateComposer(this.instance.id,{isSending:!1,minimized:!1,expanded:!1}),this._bringToFront(),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.sendError`,{error:e.message}),duration:5e3}}))}}}_toggleFormat(){let e=(this.instance.format||`html`)===`html`?`text`:`html`;this.composeStore.updateComposer(this.instance.id,{format:e}),requestAnimationFrame(()=>{setTimeout(()=>{this.isConnected&&this.composer&&this.composer.focusEditor&&this.composer.focusEditor()},0)})}_attachmentsTooLarge(){return this.i18nStore?.t(`composer.attachmentsTooLarge`)||`Attachments exceed the maximum allowed size.`}_handleAttachClick(){let e=(this.settingsStore?.getState()?.maxAttachmentMiB||32)*1024*1024,t=(this.instance.attachments||[]).reduce((e,t)=>e+(t.size||0),0);_(this.instance.id,e,t,...this._getUploadCallbacks(),this._attachmentsTooLarge())}_startUpload(e){let t=(this.settingsStore?.getState()?.maxAttachmentMiB||32)*1024*1024,n=(this.instance.attachments||[]).reduce((e,t)=>e+(t.size||0),0);C(e,this.instance.id,t,n,...this._getUploadCallbacks(),this._attachmentsTooLarge())}_getUploadCallbacks(){return[(e,t)=>{let n=this.composeStore.getComposer(this.instance.id)?.attachments||[],r={_tempId:e,filename:t.name,size:t.size,uploading:!0,progress:0},i=[...n,r];this.composeStore.updateComposer(this.instance.id,{attachments:i})},(e,t)=>{let n=[...this.composeStore.getComposer(this.instance.id)?.attachments||[]],r=n.findIndex(t=>t._tempId===e);r!==-1&&(n[r]={...n[r],progress:t},this.composeStore.updateComposer(this.instance.id,{attachments:n}))},(e,t)=>{let n=[...this.composeStore.getComposer(this.instance.id)?.attachments||[]],r=n.findIndex(t=>t._tempId===e);if(r!==-1){let e={...n[r],uuid:t[0]};delete e.uploading,delete e.progress,delete e._tempId,n[r]=e,this.composeStore.updateComposer(this.instance.id,{attachments:n});let i=this.composeStore.getComposer(this.instance.id),a=(i?.attachments||[]).some(e=>e.uploading);i?.closing&&!a?this._finishDeferredClose():this._saveDraft()}},(e,t)=>{f.error(`Failed to upload attachment:`,t);let n=[...this.composeStore.getComposer(this.instance.id)?.attachments||[]],r=n.findIndex(t=>t._tempId===e);r!==-1&&(n.splice(r,1),this.composeStore.updateComposer(this.instance.id,{attachments:n}));let i=this.composeStore.getComposer(this.instance.id),a=(i?.attachments||[]).some(e=>e.uploading);i?.closing&&!a?this._finishDeferredClose():i?.closing||window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`floatingComposer.uploadFailed`,{error:t.message||this.i18nStore?.t(`floatingComposer.unknownError`)}),duration:6e3}}))}]}_removeAttachment(e){let t=[...this.instance.attachments||[]],n=t.splice(e,1)[0];n?._tempId?E(n._tempId):n?.uuid&&g(n.uuid),this.composeStore.updateComposer(this.instance.id,{attachments:t})}static{this.styles=u`
    :host {
      display: flex;
      flex-direction: column;
      position: fixed;
      transition: top 0.3s cubic-bezier(0.2, 0, 0, 1), left 0.3s cubic-bezier(0.2, 0, 0, 1), right 0.3s cubic-bezier(0.2, 0, 0, 1), bottom 0.3s cubic-bezier(0.2, 0, 0, 1), width 0.3s cubic-bezier(0.2, 0, 0, 1), height 0.3s cubic-bezier(0.2, 0, 0, 1);
    }

    ui-confirm, alps-popup {
      position: relative;
      z-index: 100;
    }
    
    .popup-form {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 240px;
      text-align: left;
    }
    .popup-form .field-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .popup-form label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
    }
    .popup-form input {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 8px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-family: inherit;
      font-size: 13px;
    }
    .popup-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }

    .window-frame {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: var(--bg-primary);
      border-radius: 8px 8px 0 0;      
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      border: 1px solid var(--border-color);
      overflow: hidden;
      position: relative;
      z-index: 1;
      transition: box-shadow 0.2s, border-color 0.2s;
    }

    .drag-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.85);
      z-index: 60;
      display: flex;
      padding: 16px;
      pointer-events: auto;
    }

    .drag-overlay * {
      pointer-events: none;
    }

    .drag-drop-zone {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px dashed var(--accent-color, #005A9E);
      border-radius: 8px;
      color: var(--accent-color, #005A9E);
      font-size: 16px;
      font-weight: 500;
      background: rgba(0, 90, 158, 0.05);
    }

    .drag-drop-zone svg {
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      fill: currentColor;
    }

    :host([expanded]) .window-frame,
    :host([minimized]) .window-frame {
      border-radius: 8px;
    }

    .sending-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
    }

    .spinner {
      display: inline-flex;
      width: 32px;
      height: 32px;
      animation: spin 1s linear infinite;
      color: var(--accent-color, #005A9E);
    }

    .spinner svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .backdrop {
      display: block;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--modal-backdrop, rgba(255, 255, 255, 0.8));
      z-index: 0;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    :host([expanded]) .backdrop {
      opacity: 1;
      pointer-events: auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 6px 6px 10px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      color: var(--text-color);
      cursor: pointer;
      user-select: none;
    }

    .header-title {
      font-weight: 500;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .header-actions {
      display: flex;
      gap: 4px;
    }

    .content {
      display: flex;
      flex-direction: column;
      flex: 1;
      background: var(--bg-primary);
      min-height: 0;
    }

    :host([minimized]) .content {
      display: none;
    }

    .field-row {
      display: flex;
      align-items: center;
      padding: 4px 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .field-label {
      color: var(--text-muted);
      font-size: 14px;
      width: 40px;
    }

    .cc-bcc-toggles {
      display: flex;
      gap: 8px;
      color: var(--text-muted);
      font-size: 13px;
    }

    .cc-bcc-toggles span {
      cursor: pointer;
    }

    .cc-bcc-toggles span:hover {
      text-decoration: underline;
    }

    .field-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      background: transparent;
      padding: 8px 0;
      color: var(--text-color);
    }

    .address-input {
      flex: 1;
    }

    .toolbar-actions {
      display: flex;
      gap: 4px;
    }

    .send-actions {
      display: flex;
      gap: 8px;
    }

    .remove-attachment-btn {
      padding: 0;
    }

    .send-row {
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-color);
    }

    .attachments-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 16px 0;
    }

    .saving-indicator {
      font-size: 12px;
      color: var(--text-muted, #666);
      margin-right: 8px;
      align-self: center;
    }

    .composer-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    @media (max-width: 768px) {
      .window-frame {
        border-radius: 0;
      }
      .content {
        display: flex !important;
      }
      /* By class, not by title: the titles are translated, so a selector on the
         English title matched only in English, and on a phone in any other
         language the full-screen composer kept minimize and expand buttons it
         has no use for. */
      .header-actions .minimize-btn,
      .header-actions .expand-btn {
        display: none;
      }
    }
  `}render(){if(this.instance.closing)return e`<style>:host { display: none !important; }</style>`;let t=((this.instance.to?.length||0)>0||(this.instance.cc?.length||0)>0||(this.instance.bcc?.length||0)>0)&&(this.instance.text?.trim().length||0)>0,n,r;if(this.instance.minimized)n=24,r=24+this.minimizedIndex*40;else{let e=this.totalMinimized>0?276:0;if(n=24+e+this.openIndex*486,r=0,24+e+this.totalOpen*470>this.windowWidth&&this.totalOpen>1){let t=this.windowWidth-470-48-e,r=t>0?t/(this.totalOpen-1):32;n=24+e+this.openIndex*Math.min(r,470)}}let i,a,o,s,c=this.windowWidth<=768;return this.showDiscardConfirm?(this.style.zIndex=`30000`,c?(o=this.windowWidth,s=this.windowHeight,a=0,i=0,this.removeAttribute(`expanded`)):this.instance.expanded?(o=Math.min(this.windowWidth*.85,800),s=this.windowHeight*.8,a=(this.windowWidth-o)/2,i=(this.windowHeight-s)/2,this.setAttribute(`expanded`,``)):(o=this.instance.minimized?260:470,s=this.instance.minimized?40:500,a=this.windowWidth-n-o,i=this.windowHeight-r-s,this.removeAttribute(`expanded`))):c?(o=this.windowWidth,s=this.windowHeight,a=0,i=0,this.style.zIndex=`30000`,this.removeAttribute(`expanded`)):this.instance.expanded?(o=Math.min(this.windowWidth*.85,800),s=this.windowHeight*.8,a=(this.windowWidth-o)/2,i=(this.windowHeight-s)/2,this.style.zIndex=`30000`,this.setAttribute(`expanded`,``)):(o=this.instance.minimized?260:470,s=this.instance.minimized?40:500,a=this.windowWidth-n-o,i=this.windowHeight-r-s,this.style.zIndex=`${this.instance.zIndex||1e3}`,this.removeAttribute(`expanded`)),c?(this.style.width=`100%`,this.style.height=`100dvh`,this.style.left=`0`,this.style.top=`0`):(this.style.width=`${o}px`,this.style.height=`${s}px`,this.style.left=`${a}px`,this.style.top=`${i}px`),this.instance.minimized?this.setAttribute(`minimized`,``):this.removeAttribute(`minimized`),e`
      ${this.instance.expanded?e`<div class="backdrop"></div>`:``}
      
      ${this.showDiscardConfirm?e`
        <ui-confirm
          title=${this.i18nStore?.t(`floatingComposer.discardDraftTitle`)}
          message=${this.i18nStore?.t(`floatingComposer.discardDraftMessage`)}
          confirmText=${this.i18nStore?.t(`floatingComposer.discard`)}
          cancelText=${this.i18nStore?.t(`general.cancel`)}
          .isDanger=${!0}
          @confirm=${this._confirmDiscard}
          @cancel=${this._cancelDiscard}
        ></ui-confirm>
      `:``}

      <div class="window-frame ${this.isDragOver?`drag-over`:``}" 
           @mousedown=${this._bringToFront}
           @dragover=${this._handleDragOver}
           @drop=${this._handleDrop}>
        
        ${this.isDragOver&&!this.instance.isSending?e`
          <div class="drag-overlay" @dragleave=${this._handleDragLeave}>
            <div class="drag-drop-zone">
              <svg viewBox="0 0 256 256">
                <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216ZM128,112a8,8,0,0,0-8,8v44.69l-22.34-22.35a8,8,0,0,0-11.32,11.32l36,36a8,8,0,0,0,11.32,0l36-36a8,8,0,0,0-11.32-11.32L136,164.69V120A8,8,0,0,0,128,112Z"></path>
              </svg>
              <span>${this.i18nStore?.t(`floatingComposer.dropFiles`)}</span>
            </div>
          </div>
        `:``}

        ${this.instance.isSending?e`
          <div class="sending-overlay">
            <alps-loader></alps-loader>
          </div>
        `:``}
        
        <div class="header" @click=${this._handleHeaderClick}>
          <div class="header-title">${this.instance.subject||this.i18nStore?.t(`floatingComposer.newMessage`)}</div>
          <div class="header-actions">
            ${this.isSaving?e`<span class="saving-indicator">${this.i18nStore?.t(`floatingComposer.saving`)}</span>`:this.instance.draftUid&&!this.instance.dirty?e`<span class="saving-indicator">${this.i18nStore?.t(`floatingComposer.autosaved`)}</span>`:``}
            <alps-icon-btn 
              class="minimize-btn"
              title="${this.instance.minimized?this.i18nStore?.t(`floatingComposer.restore`):this.i18nStore?.t(`floatingComposer.minimize`)}" 
              icon="${this.instance.minimized?`caretUp`:`composerMinimize`}"
              @click=${e=>{e.stopPropagation(),this._toggleMinimize()}}>
            </alps-icon-btn>
            <alps-icon-btn 
              class="expand-btn"
              title="${this.instance.expanded?this.i18nStore?.t(`floatingComposer.restore`):this.i18nStore?.t(`floatingComposer.expand`)}" 
              icon="${this.instance.expanded?`arrowsInSimple`:`arrowsOutSimple`}"
              @click=${e=>{e.stopPropagation(),this._toggleExpand()}}>
            </alps-icon-btn>
            <alps-icon-btn 
              title="${this.i18nStore?.t(`floatingComposer.saveAndClose`)}" 
              icon="x"
              @click=${e=>{e.stopPropagation(),this._handleCloseClick()}}>
            </alps-icon-btn>
          </div>
        </div>

        <div class="content">
          <div class="field-row">
            <span class="field-label">${this.i18nStore?.t(`floatingComposer.to`)}</span>
            <alps-address-input 
              class="address-input"
              .addresses=${this.instance.to||[]}
              @addresses-changed=${e=>this.composeStore.updateComposer(this.instance.id,{to:e.detail.addresses})}
              ?disabled=${this.instance.isSending}
            ></alps-address-input>
            ${!this.showCc||!this.showBcc?e`
              <div class="cc-bcc-toggles">
                ${this.showCc?``:e`<span @click=${()=>this.showCc=!0}>${this.i18nStore?.t(`floatingComposer.cc`)}</span>`}
                ${this.showBcc?``:e`<span @click=${()=>this.showBcc=!0}>${this.i18nStore?.t(`floatingComposer.bcc`)}</span>`}
              </div>
            `:``}
          </div>

          ${this.showCc?e`
            <div class="field-row">
              <span class="field-label">${this.i18nStore?.t(`floatingComposer.cc`)}</span>
              <alps-address-input 
                class="address-input"
                .addresses=${this.instance.cc||[]}
                @addresses-changed=${e=>this.composeStore.updateComposer(this.instance.id,{cc:e.detail.addresses})}
                ?disabled=${this.instance.isSending}
              ></alps-address-input>
            </div>
          `:``}

          ${this.showBcc?e`
            <div class="field-row">
              <span class="field-label">${this.i18nStore?.t(`floatingComposer.bcc`)}</span>
              <alps-address-input 
                class="address-input"
                .addresses=${this.instance.bcc||[]}
                @addresses-changed=${e=>this.composeStore.updateComposer(this.instance.id,{bcc:e.detail.addresses})}
                ?disabled=${this.instance.isSending}
              ></alps-address-input>
            </div>
          `:``}

          <div class="field-row">
            <input 
              class="field-input" 
              placeholder=${this.i18nStore?.t(`floatingComposer.subject`)} 
              .value=${this.instance.subject||``}
              @input=${e=>this.composeStore.updateComposer(this.instance.id,{subject:e.target.value})}
              ?disabled=${this.instance.isSending}
            />
          </div>

          <div class="composer-wrapper">
            <alps-message-composer
              .isSending=${this.instance.isSending}
              .text=${this.instance.text||``}
              .htmlText=${this.instance.html||``}
              .format=${this.instance.format||`html`}
              .quoteSource=${this.instance.quoteSource}
              @text-changed=${e=>this.composeStore.updateComposer(this.instance.id,{text:e.detail.text,html:e.detail.html})}
            ></alps-message-composer>
          </div>

          <alps-attachment-list
            .attachments=${(this.instance.attachments||[]).filter(e=>!e.inline)}
            .removable=${!0}
            .composerMode=${!0}
            @remove-attachment=${e=>{let t=(this.instance.attachments||[]).indexOf(e.detail.attachment);t!==-1&&this._removeAttachment(t)}}
          ></alps-attachment-list>

          <div class="send-row">
            <div class="toolbar-actions">
              <alps-icon-btn 
                ?active=${(this.instance.format||`html`)===`html`} 
                title=${this.i18nStore?.t(`floatingComposer.toggleFormatting`)} 
                icon="textAa"
                @click=${this._toggleFormat}>
              </alps-icon-btn>
              <alps-icon-btn 
                title=${this.i18nStore?.t(`floatingComposer.attachFiles`)} 
                icon="paperclip"
                @click=${this._handleAttachClick}>
              </alps-icon-btn>
              ${(this.instance.format||`html`)===`html`?e`
                <alps-popup id="linkPopup" align="left" position="top">
                  <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`floatingComposer.insertLink`)} icon="linkSimple" @mousedown=${e=>e.preventDefault()} @click=${this._handleLinkClick}></alps-icon-btn>
                  <div class="popup-form" @keydown=${e=>{e.key===`Enter`&&this._handleLinkSubmit()}}>
                    ${this.linkPromptFields.map(t=>e`
                      <div class="field-group">
                        <label for=${t.id}>${t.label}</label>
                        <alps-input inputId=${t.id} type="text" placeholder=${t.placeholder}></alps-input>
                      </div>
                    `)}
                    <div class="popup-actions">
                      <alps-button variant="text" @click=${()=>(this.shadowRoot?.querySelector(`#linkPopup`))?.close()}>${this.i18nStore?.t(`general.cancel`)}</alps-button>
                      <alps-button variant="normal" @click=${this._handleLinkSubmit}>${this.i18nStore?.t(`floatingComposer.apply`)}</alps-button>
                    </div>
                  </div>
                </alps-popup>
              `:``}
              
              ${d.invokeHook(`composer:toolbar`,{composer:this,instance:this.instance})?.filter(Boolean)}
              
              <alps-emoji-selector-popup position="top" @emoji-selected=${e=>this.composer?.insertEmoji(e.detail.emoji)}>
                <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`floatingComposer.insertEmoji`)} icon="smiley"></alps-icon-btn>
              </alps-emoji-selector-popup>
            </div>
            <div class="send-actions">
              <alps-button variant="text" @click=${e=>{e.stopPropagation(),this._handleDiscardClick()}}>
                ${this.i18nStore?.t(`floatingComposer.discard`)}
              </alps-button>
              <alps-button variant="primary" @click=${this._handleSend} ?disabled=${this.instance.isSending||!t}>
                ${this.i18nStore?.t(`floatingComposer.send`)}
              </alps-button>
            </div>
          </div>
        </div>
      </div>
    `}};p([s({context:h})],$.prototype,`composeStore`,void 0),p([s({context:O})],$.prototype,`i18nStore`,void 0),p([s({context:m})],$.prototype,`settingsStore`,void 0),p([n({type:Object})],$.prototype,`instance`,void 0),p([n({type:Number})],$.prototype,`index`,void 0),p([n({type:Number})],$.prototype,`totalOpen`,void 0),p([n({type:Number})],$.prototype,`totalMinimized`,void 0),p([n({type:Number})],$.prototype,`openIndex`,void 0),p([n({type:Number})],$.prototype,`minimizedIndex`,void 0),p([t()],$.prototype,`showCc`,void 0),p([t()],$.prototype,`showBcc`,void 0),p([t()],$.prototype,`showDiscardConfirm`,void 0),p([t()],$.prototype,`pendingDiscardType`,void 0),p([t()],$.prototype,`windowWidth`,void 0),p([t()],$.prototype,`windowHeight`,void 0),p([t()],$.prototype,`isSaving`,void 0),p([t()],$.prototype,`isDragOver`,void 0),p([t()],$.prototype,`linkPromptFields`,void 0),$=p([o(`alps-floating-composer`)],$);export{$ as AlpsFloatingComposer};