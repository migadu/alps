import{_ as e,b as t,c as n,d as r,f as i,h as a,m as o,n as s,p as c,r as l,v as u}from"./lit-Br1cDwGJ.js";import{A as d,B as f,C as p,D as m,E as ee,F as te,H as h,I as ne,J as g,L as re,M as ie,N as _,O as v,P as y,R as b,S as ae,T as oe,U as x,V as se,Y as S,_ as ce,_t as C,a as le,at as w,b as ue,bt as T,c as E,g as de,h as D,j as fe,k as pe,l as O,m as me,o as k,q as he,s as ge,v as A,vt as j,w as _e,x as ve,xt as M,y as N,z as P}from"./index-CMdaXNq5.js";import"./alps-address-input-D56QF5UX.js";import{_ as F,a as ye,c as be,d as xe,f as Se,g as Ce,h as I,i as we,l as Te,m as L,n as Ee,o as De,p as R,r as Oe,s as z,t as B,u as ke,v as V}from"./editor-lPhyAooS.js";import"./emoji-C1rmM34F.js";var H=`data-alps-quote-slot`,U=`<div ${H}=""></div>`,W=new WeakMap,G=be.create({name:`quotedMessage`,group:`block`,atom:!0,draggable:!1,priority:1e3,addOptions(){return{themed:()=>!0,inlineImages:()=>({mailbox:``,messageUid:``})}},addAttributes(){return{html:{default:``,rendered:!1,parseHTML:()=>null}}},parseHTML(){return[{tag:`div[${E}]`,getAttrs:e=>{let t=_(e.outerHTML);return t?{html:t}:!1}}]},renderHTML(){return[`div`,{[H]:``}]},renderText({node:e}){let t=W.get(e);return t===void 0&&(t=k(e.attrs.html),W.set(e,t)),t},addKeyboardShortcuts(){let e=e=>()=>{let{state:t}=this.editor,{selection:n}=t;if(!(n instanceof Ce)||!n.$cursor)return!1;let r=n.$cursor;if(e===`after`){if(r.parentOffset<r.parent.content.size)return!1;let e=r.after();return t.doc.nodeAt(e)?.type===this.type?this.editor.commands.setNodeSelection(e):!1}if(r.parentOffset>0)return!1;let i=t.doc.resolve(r.before()).nodeBefore;return i?.type===this.type?this.editor.commands.setNodeSelection(r.before()-i.nodeSize):!1};return{Backspace:e(`before`),"Mod-Backspace":e(`before`),"Shift-Backspace":e(`before`),Delete:e(`after`),"Mod-Delete":e(`after`)}},addProseMirrorPlugins(){let e=V.fromSchema(this.editor.schema),t=new V({...e.nodes,[this.name]:e=>je(e.attrs.html)},e.marks);return[new L({key:new I(this.name),props:{clipboardSerializer:t,transformPastedHTML:Me}})]},addNodeView(){let{themed:t,inlineImages:n}=this.options;return({node:r})=>{let i=document.createElement(`div`);i.className=`quoted-message`,i.contentEditable=`false`;let a=ie(r.attrs.html,{...n(),allowRemoteResources:!1}),o=t();return e(u`<iframe
        sandbox="allow-same-origin"
        tabindex="-1"
        .srcdoc=${a}
        @load=${e=>{let t=e.target;ge(t,o),Ae(t,i)}}
      ></iframe>`,i),{dom:i,ignoreMutation:()=>!0,destroy:()=>{let e=i.querySelector(`iframe`);e?._ro?.disconnect(),e?._widthRo?.disconnect()}}}}});function Ae(e,t){let n=e.contentDocument;if(!n?.body)return;e._widthRo?.disconnect();let r=()=>{e.style.width=`100%`;let r=Math.max(n.documentElement?.scrollWidth||0,n.body?.scrollWidth||0);r>t.clientWidth&&(e.style.width=`${Math.ceil(r)}px`)};r();let i=new ResizeObserver(r);i.observe(n.body),i.observe(t),e._widthRo=i}function je(e){let t=new DOMParser().parseFromString(e,`text/html`),n=t.createDocumentFragment();for(;t.body.firstChild;)n.appendChild(t.body.firstChild);return n}function Me(e){if(!e.includes(`data-alps-quote`)&&!e.includes(H))return e;let t=new DOMParser().parseFromString(e,`text/html`);for(let e of Array.from(t.querySelectorAll(`[${E}], [${H}]`)))e.removeAttribute(E),e.removeAttribute(H);return t.body.innerHTML}function K(e){let t=e.getHTML();if(/<(?:blockquote|ul|ol)\b|margin-inline-start\s*:/.test(t)){let e=new DOMParser().parseFromString(t,`text/html`).body;re(e,!0);let n=b();for(let t of e.querySelectorAll(`[style]`)){let e=t.style.marginInlineStart;if(!e)continue;let r=n(t)===`rtl`?`margin-right`:`margin-left`;t.style.removeProperty(`margin-inline-start`),t.style.setProperty(r,e)}t=e.innerHTML}if(!t.includes(U))return t;let n=[];return e.state.doc.descendants(e=>(e.type.name===G.name&&n.push(e.attrs.html),!0)),t.split(U).reduce((e,t,r)=>e+(r?n[r-1]??``:``)+t,``)}function q(e,t,n=!1){let r=new DOMParser().parseFromString(t,`text/html`).body,i=F.fromSchema(e).parse(r,{preserveWhitespace:n}).toJSON(),a=(e,t)=>{let n=e.attrs?.dir??t;e.attrs?.dir===null&&(n===`ltr`||n===`rtl`)&&(e.attrs.dir=n),e.content?.forEach(e=>a(e,n))};return a(i),i}function J(e){let t=b()(e)===`rtl`?`right`:`left`,n=[`margin-inline-start`,`margin-${t}`,`margin-${t===`right`?`left`:`right`}`];for(let r of n){let n=parseInt(e.style.getPropertyValue(r),10)||0;if(n)return{property:r,value:n,side:t}}return{property:``,value:0,side:t}}function Y(e){return e.replace(/\r\n?/g,`
`).split(`

`).map(e=>`<p>${e.split(`
`).map(fe).join(`<br>`)}</p>`).join(``)}var Ne=z.create({name:`quoteBar`,addGlobalAttributes(){return[{types:[`blockquote`],attributes:{class:{default:null,parseHTML:e=>e.getAttribute(`class`),renderHTML:e=>e.class?{class:e.class}:{}},style:{default:null,parseHTML:e=>{let t=se(e);if(!t)return null;let n=J(e);if(!n.value)return y(t)||null;let r=e.ownerDocument.createElement(`div`);r.style.cssText=t;let i=e.classList.contains(`gmail_quote`)?`0.8ex`:`0px`;return r.style.setProperty(n.property,i),y(r.style.cssText)||null},renderHTML:e=>e.style?{style:e.style}:{}}}}]}}),Pe=z.create({name:`fontSize`,addOptions(){return{types:[`textStyle`]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{fontSize:{default:null,parseHTML:e=>e.style.fontSize?.replace(/['"]+/g,``),renderHTML:e=>e.fontSize?{style:`font-size: ${e.fontSize}`}:{}}}}]},addCommands(){return{setFontSize:e=>({chain:t})=>t().setMark(`textStyle`,{fontSize:e}).run(),unsetFontSize:()=>({chain:e})=>e().setMark(`textStyle`,{fontSize:null}).removeEmptyTextStyle().run()}}}),Fe=z.create({name:`messageTextDirection`,addGlobalAttributes(){return[{types:[`paragraph`,`heading`,`blockquote`,`listItem`,`bulletList`,`orderedList`],attributes:{dir:{default:null,parseHTML:e=>{for(let t=e;t;t=t.parentElement){let e=f(t);if(e)return e}return null},renderHTML:e=>({dir:e.dir||`auto`})}}}]},addProseMirrorPlugins(){let e=new I(`messageDirection`);function t(e){let t=P(e=>({text:e.isText?e.text:void 0,direction:e.attrs.dir,children:e.content.content})),n=[];return e.descendants((e,r)=>{if([`blockquote`,`listItem`,`bulletList`,`orderedList`].includes(e.type.name)&&e.attrs.dir!==`ltr`&&e.attrs.dir!==`rtl`){let i=t(e);i&&n.push(xe.node(r,r+e.nodeSize,{[ne]:i,style:`direction: ${i}`}))}}),{decorations:Se.create(e,n),direction:t(e)??`ltr`}}return[new L({key:e,appendTransaction:(e,t,n)=>{if(!e.some(e=>e.docChanged))return null;let r=null,i=(e,t,a)=>{let o=e.attrs.dir??a;e.attrs.dir===null&&(o===`ltr`||o===`rtl`)&&(r??=n.tr,r.setNodeMarkup(t,void 0,{...e.attrs,dir:o})),e.forEach((e,n)=>i(e,t+1+n,o))};return i(n.doc,-1),r},state:{init:(e,n)=>t(n.doc),apply:(e,n)=>e.docChanged?t(e.doc):n},props:{decorations:t=>e.getState(t)?.decorations,attributes:t=>({style:`direction: ${e.getState(t)?.direction??`ltr`}`})}})]}}),Ie=z.create({name:`indent`,addOptions(){return{types:[`paragraph`,`heading`,`blockquote`],minIndent:0,maxIndent:240,step:40}},addGlobalAttributes(){return[{types:this.options.types,attributes:{indent:{default:0,parseHTML:e=>J(e).value,renderHTML:e=>e.indent?{style:`margin-inline-start: ${e.indent}px`}:{}}}}]},addCommands(){return{indent:()=>({tr:e,state:t,dispatch:n,editor:r})=>{if(r.can().sinkListItem(`listItem`))return r.chain().sinkListItem(`listItem`).run();let i=!1;return t.doc.nodesBetween(t.selection.from,t.selection.to,(t,r)=>{if(this.options.types.includes(t.type.name)){let a=t.attrs.indent||0;a<this.options.maxIndent&&(n&&e.setNodeMarkup(r,null,{...t.attrs,indent:a+this.options.step}),i=!0)}}),i},outdent:()=>({tr:e,state:t,dispatch:n,editor:r})=>{if(r.can().liftListItem(`listItem`))return r.chain().liftListItem(`listItem`).run();let i=!1;return t.doc.nodesBetween(t.selection.from,t.selection.to,(t,r)=>{if(this.options.types.includes(t.type.name)){let a=t.attrs.indent||0;a>this.options.minIndent&&(n&&e.setNodeMarkup(r,null,{...t.attrs,indent:Math.max(this.options.minIndent,a-this.options.step)}),i=!0)}}),i}}}}),X=class extends a{constructor(...e){super(...e),this.isSending=!1,this.text=``,this.htmlText=``,this.format=`text`,this.initialText=``,this.syncedText=null,this.discardedInlineIds=[],this.attachments=[],this.bubbleMenuState=`view`,this.activeLinkUrl=``,this.activeLinkText=``,this.replyInputRef=s(),this.editorContainerRef=s(),this.bubbleMenuRef=s(),this._handleI18nChange=()=>{this.requestUpdate()},this._handleSettingsChange=()=>{let e=this._themed();this.shadowRoot?.querySelectorAll(`.quoted-message iframe`).forEach(t=>{le(t,e)})}}focusEditor(e=!1){this.format===`html`&&this.editor&&!this.editor.isDestroyed?(this.editor.commands.focus(e?null:`start`),this.editor.view.focus()):this.replyInputRef.value&&(this.replyInputRef.value.focus(),e||this.replyInputRef.value.setSelectionRange(0,0))}hasSelection(){if(this.format===`html`&&this.editor&&!this.editor.isDestroyed){let{selection:e}=this.editor.state;return!e.empty&&!(e instanceof R)}let e=this.replyInputRef.value;return e?e.selectionStart!==e.selectionEnd:!1}getSelectionText(){if(this.format===`html`&&this.editor&&!this.editor.isDestroyed){if(this.editor.state.selection.empty)return``;let{from:e,to:t}=this.editor.state.selection;return this.editor.state.doc.textBetween(e,t,` `)}let e=this.replyInputRef.value;return e?e.value.substring(e.selectionStart,e.selectionEnd):``}getActiveLink(){return this.format===`html`&&this.editor&&!this.editor.isDestroyed&&this.editor.isActive(`link`)&&this.editor.getAttributes(`link`).href||null}_getLinkDetails(){if(!this.editor||this.editor.isDestroyed||!this.editor.isActive(`link`))return{url:``,text:``,range:null};let e=this.editor.getAttributes(`link`).href||``,t=Te(this.editor.state.selection.$from,this.editor.schema.marks.link),n=``;return t&&(n=this.editor.state.doc.textBetween(t.from,t.to,` `)),{url:e,text:n,range:t}}_enterEditMode(){let e=this._getLinkDetails();this.activeLinkUrl=e.url,this.activeLinkText=e.text,this.bubbleMenuState=`edit`}_applyBubbleLink(e){e.preventDefault();let t=this.shadowRoot?.querySelector(`#bubbleUrl`),n=this.shadowRoot?.querySelector(`#bubbleText`),r=t?.value||``,i=n?.value||``;if(!r||!this.editor||this.editor.isDestroyed)return;let a=this._getLinkDetails();a.range&&(i===a.text?this.editor.chain().focus().setLink({href:r}).run():this.editor.chain().focus().setTextSelection({from:a.range.from,to:a.range.to}).insertContent(i).setTextSelection({from:a.range.from,to:a.range.from+i.length}).setLink({href:r}).run()),this.bubbleMenuState=`view`}get messageText(){return this.text}get messageHtml(){return this.htmlText}getAttachments(){return this.attachments}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&(this.i18nStore?.addEventListener(`change`,this._handleI18nChange),this.settingsStore?.addEventListener(`change`,this._handleSettingsChange))})}firstUpdated(){this.initEditor()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),this.settingsStore?.removeEventListener(`change`,this._handleSettingsChange),this.editor?.destroy()}_themed(){return this.settingsStore?.getState().themeIframeContent??!!g().themeIframeContent}updated(e){if(e.has(`discardedInlineIds`)&&this.editor&&this.discardedInlineIds.length){let e=new Set(this.discardedInlineIds),t=this.editor.state.tr;this.editor.state.doc.descendants((n,r)=>{if(n.type.name!==G.name)return;let i=te(n.attrs.html,e);i!==n.attrs.html&&t.setNodeMarkup(r,void 0,{...n.attrs,html:i})}),t.docChanged&&(this.editor.view.dispatch(t.setMeta(`preventUpdate`,!0).setMeta(`addToHistory`,!1)),this.htmlText=K(this.editor))}if(e.has(`isSending`)&&this.editor&&this.editor.setEditable(!this.isSending,!1),e.has(`format`)){let t=e.get(`format`);if(t===`text`&&this.format===`html`){let e=this.syncedText;this.syncedText=null;let t=e!==null&&this.text===e;this.editor&&!t&&this._rewriteAboveQuote(e)||(this.editor&&!t&&this.editor.getText()!==this.text?(this.editor.commands.setContent(q(this.editor.schema,Y(this.text),!0)),this.htmlText=K(this.editor)):this.editor&&!this.htmlText&&(this.htmlText=K(this.editor),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0}))))}else t===`html`&&this.format===`text`&&this.editor&&(this.text=this.editor.getText(),this.syncedText=this.text,this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0})))}}_rewriteAboveQuote(e){let t=this.editor;if(!t||!e)return!1;let n=-1,r=null;if(t.state.doc.forEach((e,t)=>{!r&&e.type.name===G.name&&(r=e,n=t)}),!r)return!1;let i=k(r.attrs.html).split(`
`).map(e=>e.trim()).find(Boolean),a=i?e.indexOf(i):-1;if(a<0)return!1;let o=e.slice(a);if(!this.text.endsWith(o))return!1;let s=this.text.slice(0,this.text.length-o.length);return t.chain().deleteRange({from:0,to:n}).insertContentAt(0,q(t.schema,Y(s),!0).content??[]).run(),!0}initEditor(){if(!this.editorContainerRef.value)return;let e=[ye.configure({link:{openOnClick:!1}}),we.configure({types:[`heading`,`paragraph`]}),Oe,Ee,Pe,Fe,Ie,Ne,G.configure({themed:()=>this._themed(),inlineImages:()=>({mailbox:this.quoteSource?.mailbox??``,messageUid:this.quoteSource?.uid??``,messageStructure:this.quoteSource?.structure})}),B.configure({element:this.bubbleMenuRef.value,options:{placement:`bottom`},shouldShow:({editor:e})=>this.bubbleMenuState===`edit`?!0:e.isActive(`link`)})],t=!this.htmlText,n=this.htmlText||Y(this.text);this.editor=new De({element:this.editorContainerRef.value,extensions:e,content:q(ke(e),n,t),editorProps:{attributes:{dir:`auto`}},injectCSS:!1,onUpdate:({editor:e,transaction:t})=>{this.format===`html`&&(this.htmlText=K(e),this.text=e.getText(),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText,...!t.docChanged&&{initial:!0}},bubbles:!0,composed:!0})))},onTransaction:({editor:e})=>{!e.isActive(`link`)&&this.bubbleMenuState===`edit`&&(this.bubbleMenuState=`view`),this.requestUpdate()}}),this.editor.setEditable(!this.isSending,!1),this.format!==`html`&&(t||this.text===this.initialText)&&(this.syncedText=this.text),t&&this.format===`html`&&this.text.trim()&&(this.htmlText=K(this.editor),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText,initial:!0},bubbles:!0,composed:!0}))),this.requestUpdate()}clear(){this.replyInputRef.value&&(this.replyInputRef.value.value=``),this.text=``,this.htmlText=``,this.editor&&!this.editor.isDestroyed&&this.editor.commands.clearContent(),this.attachments=[],this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:``,html:``},bubbles:!0,composed:!0}))}insertFormatting(e,t=``){if(this.format===`html`&&this.editor&&!this.editor.isDestroyed){e===`**`?this.editor.chain().focus().toggleBold().run():e===`*`&&this.editor.chain().focus().toggleItalic().run();return}let n=this.replyInputRef.value;if(!n)return;let r=n.selectionStart,i=n.selectionEnd,a=n.value,o=a.substring(r,i);if(o.startsWith(e)&&o.endsWith(t)&&o.length>=e.length+t.length){let a=o.substring(e.length,o.length-t.length);n.setRangeText(a,r,i,`select`)}else r>=e.length&&a.substring(r-e.length,r)===e&&i+t.length<=a.length&&a.substring(i,i+t.length)===t?n.setRangeText(o,r-e.length,i+t.length,`select`):(n.setRangeText(e+o+t,r,i,`select`),r===i&&(n.selectionStart=r+e.length,n.selectionEnd=r+e.length));this.text=n.value,this.editor&&!this.editor.isDestroyed&&(this.htmlText=K(this.editor)),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0})),n.focus()}leaveSelectedNode(){let e=this.editor;if(!e||e.isDestroyed)return;let{selection:t,doc:n}=e.state;if(!(t instanceof R))return;let r=t.to;if(n.resolve(r).nodeAfter?.isTextblock){e.commands.setTextSelection(r+1);return}e.chain().insertContentAt(r,{type:`paragraph`}).setTextSelection(r+1).run()}insertEmoji(e){if(this.format===`html`&&this.editor&&!this.editor.isDestroyed)this.leaveSelectedNode(),this.editor.chain().focus().insertContent(e).run();else{let t=this.replyInputRef.value;if(!t)return;let n=t.selectionStart,r=t.selectionEnd;t.setRangeText(e,n,r,`end`),this.text=t.value,this.editor&&!this.editor.isDestroyed&&(this.htmlText=K(this.editor)),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0})),t.focus()}}_handleInput(e){this.text=e.target.value,this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0}))}static{this.styles=[me,t`
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

    /* Logical sides, so a right-to-left list or quote has its markers and
       its bar on the right. */
    .editor-container .ProseMirror ul,
    .editor-container .ProseMirror ol {
      margin: 0 0 1em 0;
      padding-inline-start: 1.5em;
    }

    .editor-container .ProseMirror blockquote {
      border-inline-start: 3px solid var(--border-color, #e5e7eb);
      margin: 0 0 1em 0;
      padding-inline-start: 1em;
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
  `]}renderFormattingToolbar(){if(!this.editor||this.format!==`html`)return``;let e=this.editor.getAttributes(`textStyle`).fontSize||`14px`,t=`textAlignLeft`,n=this.editor.isActive({textAlign:`center`}),r=this.editor.isActive({textAlign:`right`}),i=!n&&!r;return n&&(t=`textAlignCenter`),r&&(t=`textAlignRight`),u`
      <div class="formatting-toolbar">
        <alps-popup align="left" class="size-popup">
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`messageComposer.fontSize`)} icon="textSize"></alps-icon-btn>
          <button class="dropdown-item ${e===`10px`?`active`:``}" @click=${()=>this.editor?.chain().focus().setFontSize(`10px`).run()}>${this.i18nStore?.t(`messageComposer.small`)}</button>
          <button class="dropdown-item ${e===`14px`?`active`:``}" @click=${()=>this.editor?.chain().focus().setFontSize(`14px`).run()}>${this.i18nStore?.t(`messageComposer.normal`)}</button>
          <button class="dropdown-item ${e===`18px`?`active`:``}" @click=${()=>this.editor?.chain().focus().setFontSize(`18px`).run()}>${this.i18nStore?.t(`messageComposer.large`)}</button>
          <button class="dropdown-item ${e===`24px`?`active`:``}" @click=${()=>this.editor?.chain().focus().setFontSize(`24px`).run()}>${this.i18nStore?.t(`messageComposer.huge`)}</button>
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
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`messageComposer.align`)} icon="${t}"></alps-icon-btn>
          <button class="dropdown-item ${i?`active`:``}" @click=${()=>this.editor?.chain().focus().setTextAlign(`left`).run()}>
            ${C(`textAlignLeft`)} <span class="item-text">${this.i18nStore?.t(`messageComposer.left`)}</span>
          </button>
          <button class="dropdown-item ${n?`active`:``}" @click=${()=>this.editor?.chain().focus().setTextAlign(`center`).run()}>
            ${C(`textAlignCenter`)} <span class="item-text">${this.i18nStore?.t(`messageComposer.center`)}</span>
          </button>
          <button class="dropdown-item ${r?`active`:``}" @click=${()=>this.editor?.chain().focus().setTextAlign(`right`).run()}>
            ${C(`textAlignRight`)} <span class="item-text">${this.i18nStore?.t(`messageComposer.right`)}</span>
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
            ${C(`arrowUUpLeft`)} ${this.i18nStore?.t(`messageComposer.undo`)}
          </button>
          <button class="dropdown-item" @click=${()=>this.editor?.chain().focus().redo().run()}>
            ${C(`arrowUUpRight`)} ${this.i18nStore?.t(`messageComposer.redo`)}
          </button>
          <div class="dropdown-divider mobile-only"></div>
          <button class="dropdown-item mobile-only ${this.editor.isActive(`orderedList`)?`active`:``}" @click=${()=>this.editor?.chain().focus().toggleOrderedList().run()}>
            ${C(`listNumbers`)} ${this.i18nStore?.t(`messageComposer.numberedList`)}
          </button>
          <button class="dropdown-item mobile-only" @click=${()=>this.editor?.chain().focus().outdent().run()}>
            ${C(`textOutdent`)} ${this.i18nStore?.t(`messageComposer.indentLess`)}
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item ${this.editor.isActive(`blockquote`)?`active`:``}" @click=${()=>this.editor?.chain().focus().toggleBlockquote().run()}>
            ${C(`textQuote`)} ${this.i18nStore?.t(`messageComposer.quote`)}
          </button>
          <button class="dropdown-item ${this.editor.isActive(`strike`)?`active`:``}" @click=${()=>this.editor?.chain().focus().toggleStrike().run()}>
            ${C(`textStrikethrough`)} ${this.i18nStore?.t(`messageComposer.strikethrough`)}
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click=${()=>this.editor?.chain().focus().clearNodes().unsetAllMarks().run()}>
            ${C(`textClearFormat`)} ${this.i18nStore?.t(`messageComposer.clearFormatting`)}
          </button>
        </alps-popup>
      </div>
    `}render(){return u`
      <div class="compose-area">
        ${this.renderFormattingToolbar()}
        <div class="editor-container ${this.format===`html`?``:`hidden`}" ${l(this.editorContainerRef)}></div>
        
        <!-- Bubble Menu Container -->
        <div class="bubble-menu-container" ${l(this.bubbleMenuRef)} 
             @mousedown=${e=>e.stopPropagation()} 
             @mouseup=${e=>e.stopPropagation()} 
             @click=${e=>e.stopPropagation()} 
             @touchstart=${e=>e.stopPropagation()} 
             @touchend=${e=>e.stopPropagation()}
             @pointerdown=${e=>e.stopPropagation()}
             @pointerup=${e=>e.stopPropagation()}>
          <div class="bubble-menu-wrapper">
            ${this.bubbleMenuState===`view`?u`
              <div class="bubble-view" @mousedown=${e=>e.preventDefault()}>
                <span class="link-label">${this.i18nStore?.t(`messageComposer.goToLink`)} <a href="${this._getLinkDetails().url}" target="_blank">${this._getLinkDetails().url}</a></span>
                <span class="divider">|</span>
                <button class="bubble-btn" @click=${e=>{e.preventDefault(),this._enterEditMode()}}>${this.i18nStore?.t(`messageComposer.change`)}</button>
                <span class="divider">|</span>
                <button class="bubble-btn" @click=${e=>{e.preventDefault(),this.editor?.chain().focus().unsetLink().run()}}>${this.i18nStore?.t(`messageComposer.remove`)}</button>
              </div>
            `:u`
              <div class="bubble-edit">
                <div class="field-row">
                  <label for="bubble-text">${this.i18nStore?.t(`messageComposer.text`)}</label>
                  <alps-input id="bubble-text" inputId="bubbleText" label=${this.i18nStore?.t(`messageComposer.text`)} .value=${this.activeLinkText} @keydown=${e=>{e.key===`Enter`&&this._applyBubbleLink(e),e.stopPropagation()}}></alps-input>
                </div>
                <div class="field-row">
                  <label for="bubble-link">${this.i18nStore?.t(`messageComposer.link`)}</label>
                  <alps-input type="url" id="bubble-link" inputId="bubbleUrl" label=${this.i18nStore?.t(`messageComposer.link`)} .value=${this.activeLinkUrl} @keydown=${e=>{e.key===`Enter`&&this._applyBubbleLink(e),e.stopPropagation()}}></alps-input>
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
          dir="auto"
          ${l(this.replyInputRef)}
          class="reply-box ${this.format===`html`?`hidden`:``}"
          placeholder=${this.i18nStore?.t(`messageComposer.writeMessage`)}
          ?disabled=${this.isSending}
          .value=${this.text}
          @input=${this._handleInput}
        ></textarea>
      </div>
    `}};w([n({context:j})],X.prototype,`i18nStore`,void 0),w([c({type:Boolean})],X.prototype,`isSending`,void 0),w([c({type:String})],X.prototype,`text`,void 0),w([c({type:String})],X.prototype,`htmlText`,void 0),w([c({type:String})],X.prototype,`format`,void 0),w([c({attribute:!1})],X.prototype,`initialText`,void 0),w([c({attribute:!1})],X.prototype,`discardedInlineIds`,void 0),w([i()],X.prototype,`attachments`,void 0),w([i()],X.prototype,`bubbleMenuState`,void 0),w([i()],X.prototype,`activeLinkUrl`,void 0),w([i()],X.prototype,`activeLinkText`,void 0),w([c({attribute:!1})],X.prototype,`quoteSource`,void 0),w([n({context:S})],X.prototype,`settingsStore`,void 0),X=w([o(`alps-message-composer`)],X);var Z=class extends a{constructor(...e){super(...e),this.position=`bottom`}static{this.styles=t`
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
  `}_handleEmojiPick(e){let t=e.detail.emoji;this.popup&&this.popup.close(),this.dispatchEvent(new CustomEvent(`emoji-selected`,{detail:{emoji:t},bubbles:!0,composed:!0}))}_handlePopupToggle(){}render(){return u`
      <alps-popup align="left" position="${this.position}" @click=${this._handlePopupToggle}>
        <slot name="trigger" slot="trigger"></slot>
        <div class="selector-container" @click=${e=>e.stopPropagation()}>
          <unicode-emoji-picker
            filters-position="top"
            @emoji-pick=${this._handleEmojiPick}
          ></unicode-emoji-picker>
        </div>
      </alps-popup>
    `}};w([c({type:String})],Z.prototype,`position`,void 0),w([r(`alps-popup`)],Z.prototype,`popup`,void 0),Z=w([o(`alps-emoji-selector-popup`)],Z);var Q=5e3,$=class extends a{constructor(...e){super(...e),this.index=0,this.totalOpen=1,this.totalMinimized=0,this.openIndex=0,this.minimizedIndex=0,this.showCc=!1,this.showBcc=!1,this.typedRecipient=!1,this.showDiscardConfirm=!1,this.pendingDiscardType=null,this.windowWidth=window.innerWidth,this.windowHeight=window.innerHeight,this.isSaving=!1,this.isDragOver=!1,this.trayHeight=0,this.autoSaveTimer=null,this.savingPromise=null,this.storedDraft=null,this.discarding=!1,this.undoSendTimer=null,this.cancelUndoSend=null,this._handleI18nChange=()=>{this.requestUpdate()},this._handleStoreChange=()=>{let e=this.composeStore.getComposer(this.instance.id);e?.isSaving&&!this.isSaving&&(this.storedDraft=null),e&&e!==this.instance&&(this.instance=e)},this._handleWindowDragOver=()=>{this.isDragOver&&=!1},this._handleWindowDragLeave=e=>{e.relatedTarget===null&&this.isDragOver&&(this.isDragOver=!1)},this._handleGlobalDropHandled=()=>{this.isDragOver&&=!1},this._handleResize=()=>{this.windowWidth=window.innerWidth,this.windowHeight=window.innerHeight},this._wasActiveOnMousedown=!1,this._noteTypedRecipient=()=>{this.typedRecipient=this._recipientFields().some(e=>e.hasPendingAddress)},this.linkPromptFields=[],this._handleSubjectKeydown=e=>{if(e.key!==`Tab`||e.shiftKey||e.altKey||e.ctrlKey||e.metaKey)return;let t=this.composer;t?.focusEditor&&(e.preventDefault(),t.focusEditor(!0))},this._handleDragOver=e=>{this.instance.isSending||this.instance.minimized||(e.preventDefault(),e.stopPropagation(),this.isDragOver=!0)},this._handleDragLeave=e=>{e.preventDefault(),e.stopPropagation(),this.isDragOver=!1},this._handleDrop=e=>{if(this.instance.isSending||this.instance.minimized)return;e.preventDefault(),e.stopPropagation(),this.isDragOver=!1,window.dispatchEvent(new CustomEvent(`alps-composer-drop`));let t=Array.from(e.dataTransfer?.files||[]);t.length>0&&this._startUpload(t)}}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this._handleResize),window.addEventListener(`dragover`,this._handleWindowDragOver),window.addEventListener(`dragleave`,this._handleWindowDragLeave),window.addEventListener(`alps-composer-drop`,this._handleGlobalDropHandled),this.composeStore?.addEventListener?.(`change`,this._handleStoreChange),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),this.instance.cc&&this.instance.cc.length>0&&(this.showCc=!0),this.instance.bcc&&this.instance.bcc.length>0&&(this.showBcc=!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this._handleResize),window.removeEventListener(`dragover`,this._handleWindowDragOver),window.removeEventListener(`dragleave`,this._handleWindowDragLeave),window.removeEventListener(`alps-composer-drop`,this._handleGlobalDropHandled),this.composeStore?.removeEventListener?.(`change`,this._handleStoreChange),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),this._clearAutoSave(),this._clearUndoSend()}firstUpdated(){this._focusNewEditor()}async _focusNewEditor(){let e=this.composer;e&&(await e.updateComplete,this.isConnected&&e.isConnected&&e.focusEditor?.())}_clearAutoSave(){this.autoSaveTimer!==null&&(window.clearTimeout(this.autoSaveTimer),this.autoSaveTimer=null)}_clearUndoSend(){this.undoSendTimer!==null&&(window.clearTimeout(this.undoSendTimer),this.undoSendTimer=null);let e=this.cancelUndoSend;this.cancelUndoSend=null,e?.()}_sendCutShort(e){let t=this.composeStore.getComposer(e);return this.isConnected&&t?!1:(t&&this.composeStore.updateComposer(e,{isSending:!1,minimized:!1}),!0)}updated(e){e.has(`instance`)&&this.instance.dirty&&!this.instance.isSending&&!this.instance.isSaving&&this._scheduleAutoSave()}_scheduleAutoSave(){this._clearAutoSave(),!this.discarding&&(this.autoSaveTimer=window.setTimeout(()=>{this._saveDraft()},3e3))}_saveDraft(){if(this.savingPromise)return Promise.resolve(!1);let e=this._saveDraftWithoutGoneUploads().finally(()=>{this.savingPromise===e&&(this.savingPromise=null)});return this.savingPromise=e,e}async _saveDraftWithoutGoneUploads(){let e=this.instance.id;for(let t=1;;t++)try{return await this._doSaveDraft()}catch(n){if(!(n instanceof h))throw n;if(this._markUploadsGone(e,n.uuids),t===2||!this.isConnected||!this.composeStore.getComposer(e))return!1}}_markUploadsGone(e,t){let n=this.composeStore.getComposer(e);if(!n)return;let r=new Set(t),i=0,a=(n.attachments||[]).map(e=>!e.uuid||!r.has(e.uuid)?e:(i++,oe(e)));i!==0&&(this.composeStore.updateComposer(e,{attachments:a}),this._toastUploadsGone(i))}_toastUploadsGone(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.attachmentsGone`,{count:e}),duration:8e3}}))}async _doSaveDraft(){let e=this.instance.id,t=O.generation(),n=this.composeStore.getComposer(e)||this.instance;if(n.isSending||n.isSaving||this.discarding)return!1;let r=(n.to?.length||0)>0||(n.cc?.length||0)>0||(n.bcc?.length||0)>0,i=n.attachments&&n.attachments.length>0,a=n.text?.trim()!==n.initialText?.trim()||(n.subject?.trim().length||0)>0||i;if(!r&&!a&&!n.draftUid)return!0;let o=A(n);if(this.storedDraft&&this.storedDraft.uid===n.draftUid&&this.storedDraft.key===o)return n.dirty&&this.composeStore.updateComposer(e,{dirty:!1}),!0;this.isSaving=!0,this.composeStore.updateComposer(e,{isSaving:!0});try{let r=(n.attachments||[]).map(e=>e.uuid).filter(Boolean),i=this._bccRecipients(n),a=this._buildFormData(n,i);a.append(`save_as_draft`,`1`),this.storedDraft=null;let s=await x.saveDraft(a);if(t!==O.generation()||!this.isConnected||!this.composeStore.getComposer(e))return!!s;if(s){let e=this.instance.draftUid;window.dispatchEvent(new CustomEvent(`draft-autosaved`,{detail:{oldUid:e,oldMailbox:this.instance.draftMailbox,newUid:s.uid,mailbox:s.mailbox,subject:(n.subject||``).trim(),to:n.to,cc:n.cc,bcc:s.bcc??i,size:s.size,hasAttachments:(n.attachments||[]).some(e=>!e.inline&&(e.uuid||e.partPath))}}))}if(!this.isConnected)return!!s;if(s){let e=this.composeStore.getComposer(this.instance.id)||n,t={dirty:A(e)!==o,draftUid:s.uid,draftMailbox:s.mailbox};s.attachments&&(t.attachments=_e(e.attachments||[],n.attachments||[],s.attachments));let i=t.attachments??e.attachments,a=i&&ue(i,n);a!==i&&(t.attachments=a);let c=ae(n,s);c&&(t.quoteSource=c),Object.assign(t,ce(e,n,s)),this.composeStore.updateComposer(this.instance.id,t);let l=this.composeStore.getComposer(this.instance.id);this.storedDraft=l&&!l.dirty?{uid:s.uid,key:A(l)}:null;let u=(l?.attachments||[]).some(e=>e.uuid&&!r.includes(e.uuid));(l?.dirty||u)&&this._scheduleAutoSave()}return!!s}finally{this.isSaving=!1,this.composeStore.getComposer(e)&&this.composeStore.updateComposer(e,{isSaving:!1})}}_bccRecipients(e){let t=[...e.bcc||[]];{let e=g(),n=he(e),r=n?D(n):``;e.bccMyself&&n&&!t.some(e=>D(e)===r)&&t.push(n)}return t}_buildFormData(e,t=this._bccRecipients(e)){let n=new FormData,r=e.to||[],i=e.cc||[],a=g().replyTo,o=e.text||``,s=(e.subject||``).trim();n.append(`to`,p(r)),n.append(`cc`,p(i)),n.append(`bcc`,p(t)),a&&n.append(`reply_to`,a),n.append(`subject`,s),n.append(`text`,o),e.format===`html`&&e.html&&n.append(`html`,e.html);let c=ve(e),l=c.map(e=>e.uuid).filter(Boolean).join(`,`);l&&n.append(`attachment-uuids`,l);let u=c.map(e=>e.partPath).filter(Boolean).join(`,`);u&&n.append(`prev_attachments`,u);let d=N(c);return d&&n.append(`inline_attachments`,d),e.draftMailbox&&n.append(`draft_mailbox`,e.draftMailbox),e.draftUid&&n.append(`draft_uid`,e.draftUid),ee(n,e),n}get composer(){return this.shadowRoot.querySelector(`alps-message-composer`)}_toggleMinimize(){this.composeStore.updateComposer(this.instance.id,{minimized:!this.instance.minimized,expanded:!1})}_handleHeaderClick(){this.composeStore.bringComposerToFront(this.instance.id),this.instance.minimized?(this.composeStore.updateComposer(this.instance.id,{minimized:!1}),setTimeout(()=>{this.isConnected&&this.composer&&this.composer.focusEditor&&this.composer.focusEditor(!0)},100)):this._wasActiveOnMousedown||setTimeout(()=>{this.isConnected&&this.composer&&this.composer.focusEditor&&this.composer.focusEditor(!0)},100)}get _isExpanded(){return!!this.instance.expanded&&!this.instance.minimized}_toggleExpand(){this.composeStore.updateComposer(this.instance.id,{expanded:!this._isExpanded,minimized:!1})}async _finishDeferredClose(){if(await this.savingPromise?.catch(()=>!1),!this._keepOpenForMissingUploads()){if(await this._saveDraft()){if(this._keepOpenForMissingUploads(!1))return;this.composeStore.closeComposer(this.instance.id);return}this.composeStore.updateComposer(this.instance.id,{closing:!1}),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.draftSaveFailedKeepOpen`)||`Could not save this draft — the window stays open so nothing is lost`,duration:6e3}}))}}_keepOpenForMissingUploads(e=!0){let t=(this.composeStore.getComposer(this.instance.id)?.attachments||[]).filter(e=>e.missing).length;return t?(this.composeStore.updateComposer(this.instance.id,{closing:!1,minimized:!1}),e&&this._toastUploadsGone(t),!0):!1}_recipientFields(){return Array.from(this.shadowRoot?.querySelectorAll(`alps-address-input`)??[])}_recipientsChanged(e,t){this.composeStore.updateComposer(this.instance.id,{[e]:t.detail.addresses}),this._noteTypedRecipient()}_takeTypedRecipients(){for(let e of this._recipientFields())e.commitPending()}async _handleCloseClick(){if(this._takeTypedRecipients(),(this.instance.attachments||[]).some(e=>e.uploading)){this.composeStore.updateComposer(this.instance.id,{closing:!0});return}if(await this.savingPromise?.catch(()=>!1),this._keepOpenForMissingUploads())return;let e=this.composeStore.getComposer(this.instance.id)||this.instance;if(e.dirty&&!await this._saveDraft()){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.draftSaveFailedKeepOpen`)||`Could not save this draft — the window stays open so nothing is lost`,duration:6e3}}));return}if(this._keepOpenForMissingUploads(!1))return;let t=this.composeStore.getComposer(this.instance.id);t!==e&&t?.dirty||this.composeStore.closeComposer(this.instance.id)}_handleDiscardClick(){this._clearAutoSave();let e=!!this.instance.draftUid,t=this.instance.dirty,n=(this.instance.to?.length||0)>0||(this.instance.cc?.length||0)>0||(this.instance.bcc?.length||0)>0,r=this.instance.attachments&&this.instance.attachments.length>0,i=this.instance.text?.trim()!==this.instance.initialText?.trim()||(this.instance.subject?.trim().length||0)>0||r;!(!n&&!i)||e||t?(this.pendingDiscardType=`delete`,this.showDiscardConfirm=!0):this._performDiscard(`delete`)}async _confirmDiscard(){this.showDiscardConfirm=!1;let e=this.pendingDiscardType;this.pendingDiscardType=null,this._performDiscard(e)}_toastDiscardFailed(){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.discardFailed`)||`The draft could not be deleted from the server and is still in Drafts.`,duration:5e3}}))}async _performDiscard(e){this.discarding=!0,this._clearAutoSave(),await this.savingPromise?.catch(()=>!1);let t=this.composeStore.getComposer(this.instance.id)||this.instance;if(e===`delete`&&t.draftUid&&t.draftMailbox){let e=t.draftMailbox,n=String(t.draftUid);try{let t=await x.deleteMessagesResult(e,[n]);t.ok&&window.dispatchEvent(new CustomEvent(`draft-discarded`,{detail:{mailbox:e,uid:n}})),!t.ok&&t.reason!==`auth`&&this._toastDiscardFailed()}catch(e){M.error(`Failed to delete draft`,e),this._toastDiscardFailed()}}if(t.attachments)for(let e of t.attachments)e._tempId?m(e._tempId):e.uuid&&v(e.uuid);this.composeStore.closeComposer(this.instance.id)}_cancelDiscard(){this.showDiscardConfirm=!1,this.pendingDiscardType=null,this.instance.dirty&&this._scheduleAutoSave()}_bringToFront(){let e=this.composeStore.getState().activeComposers,t=1e3;e.forEach(e=>{e.zIndex&&e.zIndex>t&&(t=e.zIndex)}),this._wasActiveOnMousedown=(this.instance.zIndex||0)>=t,this.composeStore.bringComposerToFront(this.instance.id)}_handleLinkClick(){if(!this.composer)return;this.composer.focusEditor&&this.composer.focusEditor(!0);let e=this.composer.hasSelection(),t=this.composer.getActiveLink?this.composer.getActiveLink():null;if(t)this.linkPromptFields=[{id:`url`,label:this.i18nStore?.t(`floatingComposer.linkUrl`),placeholder:this.i18nStore?.t(`floatingComposer.linkUrlPlaceholder`),value:t}];else{let t=e&&this.composer.getSelectionText?this.composer.getSelectionText():``;this.linkPromptFields=[{id:`text`,label:this.i18nStore?.t(`floatingComposer.displayText`),placeholder:this.i18nStore?.t(`floatingComposer.displayTextPlaceholder`),value:t},{id:`url`,label:this.i18nStore?.t(`floatingComposer.linkUrl`),placeholder:this.i18nStore?.t(`floatingComposer.linkUrlPlaceholder`)}]}this.updateComplete.then(()=>{for(let e of this._linkPromptFieldElements())e.value=this.linkPromptFields.find(t=>t.id===e.inputId)?.value||``})}_linkPromptFieldElements(){return Array.from(this.shadowRoot?.querySelectorAll(`#linkPopup alps-input`)??[])}_linkPromptValues(){let e={};for(let t of this._linkPromptFieldElements())e[t.inputId]=t.value;return e}_handleLinkSubmit(){let e=this.shadowRoot?.querySelector(`#linkPopup`);if(e&&e.close(),!this.composer)return;let{text:t,url:n}=this._linkPromptValues();if(n)if(this.instance.format===`html`&&this.composer.editor){let e=this.composer.editor;if(this.composer.leaveSelectedNode?.(),t)e.chain().focus().insertContent(`<a href="${n}">${t}</a>`).command(({tr:t,dispatch:n})=>(n&&e.schema.marks.link&&t.removeStoredMark(e.schema.marks.link),!0)).run();else{let t=e.state.selection.to;e.chain().focus().setLink({href:n}).setTextSelection(t).command(({tr:t,dispatch:n})=>(n&&e.schema.marks.link&&t.removeStoredMark(e.schema.marks.link),!0)).run()}}else t?this.composer.insertFormatting(``,`[${t}](${n})`):this.composer.insertFormatting(`[`,`](${n})`)}async _handleSend(){let e=this.instance.id;this._takeTypedRecipients();let t=this.composeStore.getComposer(e)??this.instance;if((t.attachments||[]).some(e=>e.uploading)){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.attachmentsWait`),duration:3e3}}));return}let n=(t.attachments||[]).filter(e=>e.missing).length;if(n>0){this._toastUploadsGone(n);return}let r=t.text||``,i=t.to||[],a=t.cc||[],o=t.bcc||[],s=[...i,...a,...o];if(!(!r||s.length===0)){this._clearAutoSave(),this.composeStore.updateComposer(e,{isSending:!0,minimized:!0});try{let t,n,r=new Promise(e=>{let r=!1,i=t=>{r||(r=!0,this.undoSendTimer!==null&&window.clearTimeout(this.undoSendTimer),this.undoSendTimer=null,this.cancelUndoSend=null,e(t))};this.undoSendTimer=window.setTimeout(()=>i(!0),Q),t=()=>i(!1),n=()=>i(!0),this.cancelUndoSend=t});window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.sending`),actionLabel:this.i18nStore?.t(`composer.undo`),actionFn:()=>{t&&t()},dismissFn:()=>{n&&n()},duration:Q}}));let i=await r;if(this._sendCutShort(e))return;if(!i){this.composeStore.updateComposer(e,{isSending:!1,minimized:!1}),this.composeStore.bringComposerToFront(e);return}if(await this.savingPromise?.catch(()=>!1),this._sendCutShort(e))return;let a=(this.composeStore.getComposer(e)?.attachments||[]).filter(e=>e.missing).length;if(a>0){this.composeStore.updateComposer(e,{isSending:!1,minimized:!1}),this.composeStore.bringComposerToFront(e),this._toastUploadsGone(a);return}let o=this.composeStore.getComposer(e),c=this._buildFormData(o),{results:l,failed:u}=await T.invokeHookSettled(`composer:presend`,{composer:this,formData:c,instance:o});if(this._sendCutShort(e))return;let d=u>0;for(let e of l)e instanceof FormData?c=e:e===!1&&(d=!0);if(d){this.composeStore.updateComposer(e,{isSending:!1,minimized:!1}),this.composeStore.bringComposerToFront(e),u>0&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.presendFailed`),duration:5e3}}));return}if(!await x.sendDraft(c)){this.composeStore.updateComposer(e,{isSending:!1});return}o.draftUid&&o.draftMailbox&&window.dispatchEvent(new CustomEvent(`draft-discarded`,{detail:{mailbox:o.draftMailbox,uid:String(o.draftUid)}})),T.invokeHook(`composer:send`,{recipients:s}),this.composeStore.closeComposer(e)}catch(t){if(t instanceof h){this.composeStore.updateComposer(e,{isSending:!1,minimized:!1,expanded:!1}),this._bringToFront(),this._markUploadsGone(e,t.uuids);return}M.error(`Failed to send message:`,t),this.composeStore.updateComposer(e,{isSending:!1,minimized:!1,expanded:!1}),this._bringToFront(),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.sendError`,{error:t.message}),duration:5e3}}))}}}_toggleFormat(){let e=(this.instance.format||`html`)===`html`?`text`:`html`;this.composeStore.updateComposer(this.instance.id,{format:e}),requestAnimationFrame(()=>{setTimeout(()=>{this.isConnected&&this.composer&&this.composer.focusEditor&&this.composer.focusEditor()},0)})}_attachmentsTooLarge(){return this.i18nStore?.t(`composer.attachmentsTooLarge`)||`Attachments exceed the maximum allowed size.`}_attachedBytes(){return(this.instance.attachments||[]).reduce((e,t)=>e+(t.missing?0:t.size||0),0)}_maxAttachmentBytes(){return(this.settingsStore?.getState()?.maxAttachmentMiB||32)*1024*1024}_handleAttachClick(){pe(this.instance.id,this._maxAttachmentBytes(),this._attachedBytes(),...this._getUploadCallbacks(),this._attachmentsTooLarge())}_startUpload(e){d(e,this.instance.id,this._maxAttachmentBytes(),this._attachedBytes(),...this._getUploadCallbacks(),this._attachmentsTooLarge())}_getUploadCallbacks(){return[(e,t)=>{let n=this.composeStore.getComposer(this.instance.id)?.attachments||[],r={_tempId:e,filename:t.name,size:t.size,uploading:!0,progress:0},i=n.findIndex(e=>e.missing&&e.filename===t.name&&(!e.size||e.size===t.size)),a=i===-1?[...n,r]:n.map((e,t)=>t===i?{...r,_replaces:e}:e);this.composeStore.updateComposer(this.instance.id,{attachments:a})},(e,t)=>{let n=[...this.composeStore.getComposer(this.instance.id)?.attachments||[]],r=n.findIndex(t=>t._tempId===e);r!==-1&&(n[r]={...n[r],progress:t},this.composeStore.updateComposer(this.instance.id,{attachments:n}))},(e,t)=>{let n=[...this.composeStore.getComposer(this.instance.id)?.attachments||[]],r=n.findIndex(t=>t._tempId===e);if(r!==-1){let e={...n[r],uuid:t[0]};delete e.uploading,delete e.progress,delete e._tempId,delete e._replaces,n[r]=e,this.composeStore.updateComposer(this.instance.id,{attachments:n});let i=this.composeStore.getComposer(this.instance.id);if((i?.attachments||[]).some(e=>e.uploading))return;i?.closing?this._finishDeferredClose():this._saveDraft()}},(e,t)=>{M.error(`Failed to upload attachment:`,t);let n=[...this.composeStore.getComposer(this.instance.id)?.attachments||[]],r=n.findIndex(t=>t._tempId===e);if(r!==-1){let e=n[r]._replaces;e?n[r]=e:n.splice(r,1),this.composeStore.updateComposer(this.instance.id,{attachments:n})}let i=this.composeStore.getComposer(this.instance.id),a=(i?.attachments||[]).some(e=>e.uploading);i?.closing&&!a?this._finishDeferredClose():i?.closing||window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`floatingComposer.uploadFailed`,{error:t.message||this.i18nStore?.t(`floatingComposer.unknownError`)}),duration:6e3}}))}]}_removeAttachment(e){let t=[...this.instance.attachments||[]],n=t.splice(e,1)[0];n?._tempId?m(n._tempId):n?.uuid&&v(n.uuid),this.composeStore.updateComposer(this.instance.id,{attachments:t})}static{this.styles=t`
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
      /* Everything in the window stands on the window's surface, not the
         page's: the editor's toolbar, the overlays and the popups paint
         --bg-primary, so the window redefines it rather than painting over. */
      --bg-primary: var(--bg-raised);
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
      /* A scrim over the composer's own surface, so it must follow it: a
         literal white flashed bright over a dark composer in every dark theme. */
      background: color-mix(in srgb, var(--bg-primary, #ffffff) 85%, transparent);
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
      /* Sending minimizes the composer, so in a dark theme this was a white
         bar at the foot of the screen for as long as the send took. */
      background: color-mix(in srgb, var(--bg-primary, #ffffff) 80%, transparent);
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

    /* The body keeps a usable floor. The window first grows by the attachment
       tray's height; where the viewport cannot fit both, the tray gives way and
       scrolls. Without a floor the tray squeezed the body to nothing, and the
       formatting toolbar spilled over the tray's header. A percentage too, so
       a very short window still has room for its send row. */
    .composer-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: min(200px, 45%);
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
  `}render(){if(this.instance.closing)return u`<style>:host { display: none !important; }</style>`;let e=((this.instance.to?.length||0)>0||(this.instance.cc?.length||0)>0||(this.instance.bcc?.length||0)>0||this.typedRecipient)&&(this.instance.text?.trim().length||0)>0,t,n;if(this.instance.minimized)t=24,n=24+this.minimizedIndex*40;else{let e=this.totalMinimized>0?276:0;if(t=24+e+this.openIndex*486,n=0,24+e+this.totalOpen*470>this.windowWidth&&this.totalOpen>1){let n=this.windowWidth-470-48-e,r=n>0?n/(this.totalOpen-1):32;t=24+e+this.openIndex*Math.min(r,470)}}let r=Math.min(500+this.trayHeight,Math.max(500,this.windowHeight-n-160)),i=this.windowHeight*.8,a=Math.min(i+this.trayHeight,Math.max(i,this.windowHeight-48)),o,s,c,l,d=this.windowWidth<=768,f=this._isExpanded;return this.showDiscardConfirm?(this.style.zIndex=`30000`,d?(c=this.windowWidth,l=this.windowHeight,s=0,o=0,this.removeAttribute(`expanded`)):f?(c=Math.min(this.windowWidth*.85,800),l=a,s=(this.windowWidth-c)/2,o=(this.windowHeight-l)/2,this.setAttribute(`expanded`,``)):(c=this.instance.minimized?260:470,l=this.instance.minimized?40:r,s=this.windowWidth-t-c,o=this.windowHeight-n-l,this.removeAttribute(`expanded`))):d?(c=this.windowWidth,l=this.windowHeight,s=0,o=0,this.style.zIndex=`30000`,this.removeAttribute(`expanded`)):f?(c=Math.min(this.windowWidth*.85,800),l=a,s=(this.windowWidth-c)/2,o=(this.windowHeight-l)/2,this.style.zIndex=`30000`,this.setAttribute(`expanded`,``)):(c=this.instance.minimized?260:470,l=this.instance.minimized?40:r,s=this.windowWidth-t-c,o=this.windowHeight-n-l,this.style.zIndex=`${this.instance.zIndex||1e3}`,this.removeAttribute(`expanded`)),d?(this.style.width=`100%`,this.style.height=`100dvh`,this.style.left=`0`,this.style.top=`0`):(this.style.width=`${c}px`,this.style.height=`${l}px`,this.style.left=`${s}px`,this.style.top=`${o}px`),this.instance.minimized?this.setAttribute(`minimized`,``):this.removeAttribute(`minimized`),u`
      ${f?u`<div class="backdrop"></div>`:``}
      
      ${this.showDiscardConfirm?u`
        <ui-confirm
          heading=${this.i18nStore?.t(`floatingComposer.discardDraftTitle`)}
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
        
        ${this.isDragOver&&!this.instance.isSending?u`
          <div class="drag-overlay" @dragleave=${this._handleDragLeave}>
            <div class="drag-drop-zone">
              <svg viewBox="0 0 256 256">
                <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216ZM128,112a8,8,0,0,0-8,8v44.69l-22.34-22.35a8,8,0,0,0-11.32,11.32l36,36a8,8,0,0,0,11.32,0l36-36a8,8,0,0,0-11.32-11.32L136,164.69V120A8,8,0,0,0,128,112Z"></path>
              </svg>
              <span>${this.i18nStore?.t(`floatingComposer.dropFiles`)}</span>
            </div>
          </div>
        `:``}

        ${this.instance.isSending?u`
          <div class="sending-overlay">
            <alps-loader></alps-loader>
          </div>
        `:``}
        
        <div class="header" @click=${this._handleHeaderClick}>
          <div class="header-title">${this.instance.subject||this.i18nStore?.t(`floatingComposer.newMessage`)}</div>
          <div class="header-actions">
            ${this.isSaving?u`<span class="saving-indicator">${this.i18nStore?.t(`floatingComposer.saving`)}</span>`:this.instance.draftUid&&!this.instance.dirty?u`<span class="saving-indicator">${this.i18nStore?.t(`floatingComposer.autosaved`)}</span>`:``}
            <alps-icon-btn 
              class="minimize-btn"
              title="${this.instance.minimized?this.i18nStore?.t(`floatingComposer.restore`):this.i18nStore?.t(`floatingComposer.minimize`)}" 
              icon="${this.instance.minimized?`caretUp`:`composerMinimize`}"
              @click=${e=>{e.stopPropagation(),this._toggleMinimize()}}>
            </alps-icon-btn>
            <alps-icon-btn 
              class="expand-btn"
              title="${f?this.i18nStore?.t(`floatingComposer.restore`):this.i18nStore?.t(`floatingComposer.expand`)}" 
              icon="${f?`arrowsInSimple`:`arrowsOutSimple`}"
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
              label=${this.i18nStore?.t(`floatingComposer.to`)}
              .addresses=${this.instance.to||[]}
              @addresses-changed=${e=>this._recipientsChanged(`to`,e)}
              @input=${this._noteTypedRecipient}
              ?disabled=${this.instance.isSending}
            ></alps-address-input>
            ${!this.showCc||!this.showBcc?u`
              <div class="cc-bcc-toggles">
                ${this.showCc?``:u`<span @click=${()=>this.showCc=!0}>${this.i18nStore?.t(`floatingComposer.cc`)}</span>`}
                ${this.showBcc?``:u`<span @click=${()=>this.showBcc=!0}>${this.i18nStore?.t(`floatingComposer.bcc`)}</span>`}
              </div>
            `:``}
          </div>

          ${this.showCc?u`
            <div class="field-row">
              <span class="field-label">${this.i18nStore?.t(`floatingComposer.cc`)}</span>
              <alps-address-input 
                class="address-input"
                label=${this.i18nStore?.t(`floatingComposer.cc`)}
                .addresses=${this.instance.cc||[]}
                @addresses-changed=${e=>this._recipientsChanged(`cc`,e)}
                @input=${this._noteTypedRecipient}
                ?disabled=${this.instance.isSending}
              ></alps-address-input>
            </div>
          `:``}

          ${this.showBcc?u`
            <div class="field-row">
              <span class="field-label">${this.i18nStore?.t(`floatingComposer.bcc`)}</span>
              <alps-address-input 
                class="address-input"
                label=${this.i18nStore?.t(`floatingComposer.bcc`)}
                .addresses=${this.instance.bcc||[]}
                @addresses-changed=${e=>this._recipientsChanged(`bcc`,e)}
                @input=${this._noteTypedRecipient}
                ?disabled=${this.instance.isSending}
              ></alps-address-input>
            </div>
          `:``}

          <div class="field-row">
            <input 
              dir="auto"
              class="field-input" 
              placeholder=${this.i18nStore?.t(`floatingComposer.subject`)} 
              .value=${this.instance.subject||``}
              @input=${e=>this.composeStore.updateComposer(this.instance.id,{subject:e.target.value})}
              @keydown=${this._handleSubjectKeydown}
              ?disabled=${this.instance.isSending}
            />
          </div>

          <div class="composer-wrapper">
            <alps-message-composer
              .isSending=${this.instance.isSending}
              .text=${this.instance.text||``}
              .htmlText=${this.instance.html||``}
              .format=${this.instance.format||`html`}
              .initialText=${this.instance.initialText||``}
              .quoteSource=${this.instance.quoteSource}
              .discardedInlineIds=${this.instance.discardedInlineIds||[]}
              @text-changed=${e=>this.composeStore.updateComposer(this.instance.id,{text:e.detail.text,html:e.detail.html},{edit:!e.detail.initial})}
            ></alps-message-composer>
          </div>

          <alps-attachment-list
            .attachments=${(this.instance.attachments||[]).filter(e=>!e.inline)}
            .removable=${!0}
            .composerMode=${!0}
            .totalBytes=${this._attachedBytes()}
            .maxBytes=${this._maxAttachmentBytes()}
            @remove-attachment=${e=>{let t=(this.instance.attachments||[]).indexOf(e.detail.attachment);t!==-1&&this._removeAttachment(t)}}
            @tray-height=${e=>{this.trayHeight=e.detail.height}}
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
              ${(this.instance.format||`html`)===`html`?u`
                <alps-popup id="linkPopup" align="left" position="top">
                  <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`floatingComposer.insertLink`)} icon="linkSimple" @mousedown=${e=>e.preventDefault()} @click=${this._handleLinkClick}></alps-icon-btn>
                  <div class="popup-form" @keydown=${e=>{e.key===`Enter`&&this._handleLinkSubmit()}}>
                    ${this.linkPromptFields.map(e=>u`
                      <div class="field-group">
                        <!-- A label's "for" cannot reach the input inside alps-input's shadow root, so a click on the label focuses the field here. -->
                        <label @click=${()=>this._linkPromptFieldElements().find(t=>t.inputId===e.id)?.focus()}>${e.label}</label>
                        <alps-input inputId=${e.id} label=${e.label} type="text" placeholder=${e.placeholder}></alps-input>
                      </div>
                    `)}
                    <div class="popup-actions">
                      <alps-button variant="text" @click=${()=>(this.shadowRoot?.querySelector(`#linkPopup`))?.close()}>${this.i18nStore?.t(`general.cancel`)}</alps-button>
                      <alps-button variant="normal" @click=${this._handleLinkSubmit}>${this.i18nStore?.t(`floatingComposer.apply`)}</alps-button>
                    </div>
                  </div>
                </alps-popup>
              `:``}
              
              ${T.invokeHook(`composer:toolbar`,{composer:this,instance:this.instance})?.filter(Boolean)}
              
              <alps-emoji-selector-popup position="top" @emoji-selected=${e=>this.composer?.insertEmoji(e.detail.emoji)}>
                <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`floatingComposer.insertEmoji`)} icon="smiley"></alps-icon-btn>
              </alps-emoji-selector-popup>
            </div>
            <div class="send-actions">
              <alps-button variant="text" @click=${e=>{e.stopPropagation(),this._handleDiscardClick()}}>
                ${this.i18nStore?.t(`floatingComposer.discard`)}
              </alps-button>
              <alps-button variant="primary" @click=${this._handleSend} ?disabled=${this.instance.isSending||!e}>
                ${this.i18nStore?.t(`floatingComposer.send`)}
              </alps-button>
            </div>
          </div>
        </div>
      </div>
    `}};w([n({context:de})],$.prototype,`composeStore`,void 0),w([n({context:j})],$.prototype,`i18nStore`,void 0),w([n({context:S})],$.prototype,`settingsStore`,void 0),w([c({type:Object})],$.prototype,`instance`,void 0),w([c({type:Number})],$.prototype,`index`,void 0),w([c({type:Number})],$.prototype,`totalOpen`,void 0),w([c({type:Number})],$.prototype,`totalMinimized`,void 0),w([c({type:Number})],$.prototype,`openIndex`,void 0),w([c({type:Number})],$.prototype,`minimizedIndex`,void 0),w([i()],$.prototype,`showCc`,void 0),w([i()],$.prototype,`showBcc`,void 0),w([i()],$.prototype,`typedRecipient`,void 0),w([i()],$.prototype,`showDiscardConfirm`,void 0),w([i()],$.prototype,`pendingDiscardType`,void 0),w([i()],$.prototype,`windowWidth`,void 0),w([i()],$.prototype,`windowHeight`,void 0),w([i()],$.prototype,`isSaving`,void 0),w([i()],$.prototype,`isDragOver`,void 0),w([i()],$.prototype,`trayHeight`,void 0),w([i()],$.prototype,`linkPromptFields`,void 0),$=w([o(`alps-floating-composer`)],$);export{$ as AlpsFloatingComposer};