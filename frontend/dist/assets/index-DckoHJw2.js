import{n as e,r as t}from"./rolldown-runtime-S-ySWqyJ.js";import{a as n,c as r,d as i,f as a,g as o,h as s,i as c,l,m as u,n as d,o as f,p,r as m,s as h,t as g,u as _}from"./lit-C59KtRpQ.js";import{n as ee,t as te}from"./vendor-SnGHSY2f.js";import{a as ne,c as re,i as ie,n as ae,o as oe,r as se,s as ce,t as le}from"./editor-Dqqk7UQI.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var ue=new class{constructor(){this.navTabs=[],this.settingsTabs=[],this.routes=[]}registerNavTab(e){this.navTabs.find(t=>t.id===e.id)||this.navTabs.push(e)}getNavTabs(){return this.navTabs}registerSettingsTab(e){this.settingsTabs.find(t=>t.id===e.id)||this.settingsTabs.push(e)}getSettingsTabs(){return this.settingsTabs}registerRoute(e){this.routes.find(t=>t.path===e.path)||this.routes.push(e)}getRoutes(){return this.routes}},de=`All Contacts`,v=`Favorites`,fe=e({default:()=>pe}),pe={settings:{categories:{password:`Password`},password:{title:`Password`,changePassword:`Change Password`,changePasswordDesc:`Update your account password.`,oldPassword:`Current Password`,newPassword:`New Password`,confirmPassword:`Confirm New Password`,updatePassword:`Update Password`,fillAllFields:`Please fill in all fields.`,passwordMismatch:`New passwords do not match.`}}},me={settings:{title:`Settings`,categories:{general:`General`,identity:`Identity`,reading:`Reading & Composing`,appearance:`Appearance`,localization:`Localization`,accounts:`Linked Accounts`,webauthn:`2FA / WebAuthn`},loading:`Loading...`,placeholderName:`Your Name`,placeholderReplyTo:`reply@example.com`,general:{checkMailInterval:`Check mail interval`,checkMailIntervalDesc:`How often to automatically check for new mail.`,autoLogout:`Auto-logout`,autoLogoutDesc:`Automatically log out after inactivity.`,desktopNotifications:`Enable Desktop Notifications`,soundNotifications:`Play sound notification on new messages`,everyMinute:`Every minute`,every5Minutes:`Every 5 minutes`,every15Minutes:`Every 15 minutes`,every30Minutes:`Every 30 minutes`,never:`Never`,minutes15:`15 minutes`,minutes30:`30 minutes`,hour1:`1 hour`,hours2:`2 hours`,hours6:`6 hours`},identity:{displayName:`Display Name`,displayNameDesc:`The name shown to recipients when you send an email.`,signature:`Signature`,signatureDesc:`Appended to the end of your sent messages.`,replyTo:`Reply-To Address`,replyToDesc:`Optional: specify a different address for replies.`,bccMyself:`Always BCC myself on outgoing mail`},reading:{messagesPerPage:`Messages per page`,preferredView:`Preferred View`,preferredViewDesc:`How to display messages that have both HTML and Plain Text.`,showRemoteContent:`Show Remote Content`,composeFormat:`Compose Format`,html:`HTML`,plainText:`Plain Text`,alwaysAsk:`Always ask`,alwaysLoad:`Always load`,richText:`Rich Text (HTML)`,markReadTimeout:`Mark as Read`,markReadImmediately:`Immediately`,markRead1s:`After 1 second`,markRead3s:`After 3 seconds`,markRead5s:`After 5 seconds`,markRead10s:`After 10 seconds`,markReadNever:`Never mark automatically`,messageSortCriteria:`Message Sort Criteria`,messageSortCriteriaDesc:`Choose whether to sort by the original received date or by folder filing date.`,sortUid:`Folder Filing Date`,sortDate:`Received Date`},appearance:{colorTheme:`Color Theme`,colorThemeDesc:`Select your preferred color palette.`,themeMode:`Theme Mode`,themeModeDesc:`Choose light, dark, or system auto.`,layoutMode:`Layout Mode`,layoutModeDesc:`Choose how you want your mailbox to be laid out.`,listDensity:`List Density`,listDensityDesc:`Adjust the spacing and compactness of the message list.`,light:`Light`,dark:`Dark`,systemAuto:`System Auto`,vertical:`Vertical (3 Panes)`,horizontal:`Horizontal (Top/Bottom)`,fullScreen:`Full Screen (Hide list when reading)`,loose:`Loose`,normal:`Normal`,compact:`Compact`,ultraCompact:`Ultra Compact`},localization:{language:`Language`,timeFormat:`Time Format`,dateFormat:`Date Format`,format12h:`12-hour (AM/PM)`,format24h:`24-hour`,english:`English`,german:`Deutsch`,italian:`Italiano`,spanish:`Español`,serbian:`Српски`,serbianLatin:`Srpski (Latinica)`,french:`Français`,portuguese:`Português`}},linkedAccounts:{description:`Connect another account to quickly switch between them without logging out.`,noAccounts:`No linked accounts.`,remove:`Remove`,addTitle:`Link An Account`,linkAccount:`Link Account`,addedSuccess:`Account linked successfully.`,addError:`Failed to add account. Please check the credentials.`,removeConfirm:`Are you sure you want to remove this linked account?`,removedSuccess:`Account removed.`,removeError:`Failed to remove account.`,switchError:`Failed to switch account. The password might have changed.`},webauthn:{title:`Security Key Verification`,instruction:`Please use your security key to complete login.`,not_supported:`WebAuthn is not supported in your browser.`,requesting:`Requesting authentication...`,waiting_for_key:`Waiting for security key...`,verifying:`Verifying...`,success:`Verification successful, redirecting...`,verify_btn:`Verify Identity`,verifying_btn:`Verifying...`,back_to_login:`Back to Login`,key_name_placeholder:`Device name (e.g. YubiKey)`,name_key_title:`Name Security Key`,name_key_label:`Device Name`,add_key:`Add Security Key`,trust_linked:`Trust Linked Accounts`,trust_linked_desc:`If enabled, you can switch to this account from a linked account without providing a 2FA credential again.`,trust_linked_checkbox:`Allow switching to this account without 2FA`,confirm_remove:`Are you sure you want to remove this security key?`,errors:{begin_failed:`Failed to initiate authentication.`,invalid_options:`Invalid authentication options received.`,verification_failed:`Verification failed. Please try again.`,remove_failed:`Failed to remove the security key.`,general:`An error occurred.`},settings:{group_desc:`Secure your account with a hardware security key or biometrics.`,keys_title:`Security Keys`,added:`Added`,remove_btn:`Remove`}},print:{loading:`Loading print view...`},login:{subtitle:`Sign in to your webmail.`,emailPlaceholder:`Email Address`,passwordPlaceholder:`Password`},folderList:{compose:`Compose`,inbox:`Inbox`,drafts:`Drafts`,sent:`Sent`,archive:`Archive`,spam:`Spam`,junk:`Junk`,trash:`Trash`,title:`Folders`,rename:`Rename`,delete:`Delete`,createFolder:`Create Folder`,renameFolder:`Rename Folder`,deleteFolder:`Delete Folder`,deleteFolderConfirm:`Are you sure you want to delete "{folder}"? All messages inside will be permanently deleted.`,expandSidebar:`Expand sidebar`,collapseSidebar:`Collapse sidebar`,moveToTrash:`Move to Trash`,moveToTrashConfirm:`Are you sure you want to move "{folder}" to the Trash?`,createSubfolder:`Create subfolder`,createSubfolderUnder:`Create Subfolder under "{folder}"`},messageList:{selectAll:`Select all messages`,checkNew:`Check for new messages`,sortDesc:`Sort descending by date`,sortAsc:`Sort ascending by date`,filterStarred:`Filter by starred`,filterUnread:`Filter by unread`,noMessages:`No messages`,loading:`Loading...`,unknownSender:`Unknown Sender`,unknown:`Unknown`,noSubject:`(No Subject)`,hasAttachments:`Has attachments`,replied:`Replied`,forwarded:`Forwarded`,searchResultsFor:`Search results for:`,clearSearch:`Clear search`,totalMessagesIn:`{count} total messages in {folder}`,deleteAllNow:`Delete All Now`,emptyMailboxTitle:`Empty {folder}`,emptyMailboxConfirm:`Are you sure you want to permanently delete all {count} messages in {folder}? This action cannot be undone.`,emptyingMailbox:`Emptying mailbox...`,mailboxEmptied:`Mailbox emptied successfully.`,emptyMailboxFailed:`Failed to empty mailbox. Make sure it is Trash or Junk.`},composer:{attachmentsWait:`Please wait for attachments to finish uploading before sending.`,sending:`Message is being sent...`,undo:`Undo`,sendError:`Failed to send message: {error}`},messageReader:{selectMessage:`Select a message to read`,messagesSelected:`messages selected`,back:`Back`,reply:`Reply`,replyAll:`Reply All`,forward:`Forward`,to:`To:`,cc:`Cc:`,undisclosed:`Undisclosed`,loadingMessage:`Loading message...`,remoteContentWarning:`This message contains remote content. For your privacy, it has been blocked.`,loadRemoteContent:`Load remote content`,isDraft:`This is a draft message.`,editDraft:`Edit Draft`,noRecipients:`(No Recipients)`,discardDraft:`Discard Draft`,noReadableText:`This message contains no readable text, only attachments.`,attachments:`Attachments`,downloadAllAttachments:`Download all attachments`,unknownAttachment:`Unknown attachment`,archive:`Archive`,reportSpam:`Report Spam`,notSpam:`Not Spam`,delete:`Delete`,deleteConfirmSingle:`Are you sure you want to permanently delete this message? This action cannot be undone.`,deleteConfirmMultiple:`Are you sure you want to permanently delete these messages? This action cannot be undone.`,markUnread:`Mark as unread`,markRead:`Mark as read`,star:`Star`,moveTo:`Copy/Move to...`,print:`Print`,showPlaintext:`Show plaintext`,showHtml:`Show HTML`,downloadMessage:`Download message`,showOriginal:`Show original`,verifiedSender:`Verified Sender`,unverifiedSender:`Unverified Sender`},originalMessage:{title:`Original Message`,loading:`Loading original message...`,errorMissingParams:`Missing mailbox or uid parameters`,errorFailedToFetch:`Failed to fetch original message`,messageId:`Message ID`,createdAt:`Created at`,from:`From`,to:`To`,subject:`Subject`,spf:`SPF`,dkim:`DKIM`,dmarc:`DMARC`,truncatedInfo:`Message is too large to display fully. Showing the first 64KB. Please use "Download Original" to view the entire message.`,downloadOriginal:`Download Original`,copyClipboard:`Copy to clipboard`,copiedTruncated:`Copied truncated content to clipboard.`,copied:`Copied to clipboard.`,copyFailed:`Failed to copy to clipboard.`,none:`NONE`,pass:`PASS`,fail:`FAIL`},folderSelector:{filter:`Filter folders...`,noResults:`No matching folders`,actionMove:`Move to`,actionCopy:`Copy to`},attachment:{remove:`Remove`},navigation:{messages:`Messages`,contacts:`Contacts`,calendar:`Calendar`},userMenu:{settings:`Settings`,signOut:`Sign Out`,profileOptions:`Profile options`},pagination:{previousPage:`Previous page`,nextPage:`Next page`,of:`of`,zeroMessages:`0 messages`},toast:{messagePermanentlyDeleted:`Message permanently deleted`,draftDiscarded:`Draft discarded`,folderRenamed:`Folder renamed`,folderMovedToTrash:`Folder moved to Trash`,folderPermanentlyDeleted:`Folder permanently deleted`,undo:`Undo`,dismiss:`Dismiss`},mailboxPage:{mailboxNotFound:`Mailbox not found`,newMessages:`New Messages`,newMessagesSingleBody:`You have 1 new message`,newMessagesMultiBody:`You have {count} new messages`,newMessagesInInbox:`New messages in Inbox`,newMessagesAvailable:`New messages available`,open:`Open`,refresh:`Refresh`,permanentlyDelete:`Permanently Delete?`,undo:`Undo`},offline:{title:`Connection Lost`,description:`Network connectivity lost`,tryingAgain:`Trying again in {seconds} seconds...`},general:{cancel:`Cancel`,save:`Save`,optional:`Optional`},contacts:{unnamedContact:`Unnamed Contact`,title:`Contacts`,allContacts:`All Contacts`,favorites:`Favorites`,addContact:`Add Contact`,createCategory:`Create Category`,categoryName:`Category Name`,renameCategory:`Rename Category`,deleteCategory:`Delete Category`,deleteCategoryConfirm:`Are you sure you want to delete the category '{category}'? This will remove it from all contacts. No contacts will be deleted.`,rename:`Rename`,delete:`Delete`,create:`Create`,add:`Add`,newCategory:`New Category`,refreshContacts:`Refresh Contacts`,sortZa:`Sort Z-A`,sortAz:`Sort A-Z`,filterStarred:`Filter Starred`,uncategorized:`Uncategorized`,addToCategory:`Add to Category`,deleteContact:`Delete Contact`,deleteContactConfirm:`Are you sure you want to delete this contact?`,editContact:`Edit Contact`,save:`Save`,cancel:`Cancel`,noContacts:`No contacts found`,selectContact:`Select a contact to view details`,selectedContacts:`{count} contacts selected`,clearSelection:`Clear selection`,selectAll:`Select All`,clearSearch:`Clear Search`,searchContacts:`Search contacts...`,details:`Details`,notes:`Notes`,name:`Name`,nickname:`Nickname`,organization:`Organization`,titleField:`Title`,email:`Email`,phone:`Phone`,address:`Address`,url:`URL`,birthday:`Birthday`,back:`Back`,toggleStar:`Toggle Star`}},y={debug:(...e)=>{},info:(...e)=>{console.info(`[INFO]`,...e)},warn:(...e)=>{console.warn(`[WARN]`,...e)},error:(...e)=>{console.error(`[ERROR]`,...e)}},he=`modulepreload`,ge=function(e){return`/`+e},_e={},b=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=ge(t,n),t in _e)return;_e[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:he,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})};function ve(e,t){if(typeof e!=`object`||!e)return t;if(typeof t!=`object`||!t)return e;let n={...e};return Object.keys(t).forEach(r=>{typeof t[r]==`object`&&t[r]!==null&&!Array.isArray(t[r])&&r in e?n[r]=ve(e[r],t[r]):n[r]=t[r]}),n}var ye=Object.assign({"../../../plugins/password/frontend/i18n/en.ts":fe}),be={...me};for(let e in ye){let t=ye[e],n=t.default||t.en||{};be=ve(be,n)}var xe=be,Se=class extends EventTarget{constructor(){super(),this.language=`en`,this.dictionary=xe}async setLanguage(e){if(this.language!==e){this.language=e;try{if(e===`en`)this.dictionary=xe;else{let t={},n=Object.assign({"../i18n/de.ts":()=>b(()=>import(`./de-B5P7rj17.js`),[]),"../i18n/es.ts":()=>b(()=>import(`./es-TurBPK4N.js`),[]),"../i18n/fr.ts":()=>b(()=>import(`./fr-DQluIBPp.js`),[]),"../i18n/it.ts":()=>b(()=>import(`./it-BWWgvNlX.js`),[]),"../i18n/pt.ts":()=>b(()=>import(`./pt-mrvrvDL_.js`),[]),"../i18n/rs.ts":()=>b(()=>import(`./rs-aHOgf5RH.js`),[]),"../i18n/sr.ts":()=>b(()=>import(`./sr-D8CZIHEW.js`),[])})[`../i18n/${e}.ts`];if(n){let r=await n();t=r.default||r[e]}else throw Error(`Locale file not found for ${e}`);let r=Object.assign({"../../../plugins/password/frontend/i18n/de.ts":()=>b(()=>import(`./de-DapQY-T-.js`),[]),"../../../plugins/password/frontend/i18n/es.ts":()=>b(()=>import(`./es-oAWzt7Vf.js`),[]),"../../../plugins/password/frontend/i18n/fr.ts":()=>b(()=>import(`./fr-DQgAzKRZ.js`),[]),"../../../plugins/password/frontend/i18n/it.ts":()=>b(()=>import(`./it-DWoNlkdm.js`),[]),"../../../plugins/password/frontend/i18n/pt.ts":()=>b(()=>import(`./pt-C8OSsNBD.js`),[]),"../../../plugins/password/frontend/i18n/rs.ts":()=>b(()=>import(`./rs-BrLoXmUA.js`),[]),"../../../plugins/password/frontend/i18n/sr.ts":()=>b(()=>import(`./sr-Mg6Rh3g1.js`),[])}),i=[];for(let t in r)t.endsWith(`/${e}.ts`)&&i.push(r[t]());let a=await Promise.all(i);for(let n of a){let r=n.default||n[e]||{};t=ve(t,r)}this.dictionary=t}}catch(t){y.error(`Failed to load language module for ${e}`,t),this.dictionary=xe}this.dispatchEvent(new CustomEvent(`change`))}}getLanguage(){return this.language}t(e,t){let n=e.split(`.`),r=this.dictionary;for(let e of n){if(r==null)break;r=r[e]}if(typeof r!=`string`){let t=xe;for(let e of n){if(t==null)break;t=t[e]}r=typeof t==`string`?t:e}return typeof r==`string`&&t?r.replace(/\{(\w+)\}/g,(e,n)=>t[n]===void 0?e:String(t[n])):r}},x=r(`i18n-store`),Ce={"default-light":{id:`default-light`,name:`Default Light`,isDark:!1,colors:{"bg-primary":`#ffffff`,"bg-secondary":`#f9fafb`,"bg-tertiary":`#f3f4f6`,"bg-selected":`#eff6ff`,"bg-starred":`#2563eb0f`,"text-primary":`#111827`,"text-sender-read":`#202020`,"text-secondary":`#4b5563`,"text-muted":`#9ca3af`,"border-color":`#e5e7eb`,"accent-color":`#2563eb`,"accent-hover":`#1d4ed8`,"accent-light":`#dbeafe`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`#f3f4f6`}},"default-dark":{id:`default-dark`,name:`Default Dark`,isDark:!0,colors:{"bg-primary":`#1f2937`,"bg-secondary":`#111827`,"bg-tertiary":`#374151`,"bg-selected":`#1e3a8a`,"bg-starred":`#3b82f615`,"text-primary":`#f9fafb`,"text-sender-read":`#e5e7eb`,"text-secondary":`#d1d5db`,"text-muted":`#9ca3af`,"border-color":`#374151`,"accent-color":`#3b82f6`,"accent-hover":`#60a5fa`,"accent-light":`#1e3a8a`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(255, 255, 255, 0.1)`}},"nord-light":{id:`nord-light`,name:`Nord Light`,isDark:!1,colors:{"bg-primary":`#eceff4`,"bg-secondary":`#e5e9f0`,"bg-tertiary":`#d8dee9`,"bg-selected":`#81a1c133`,"bg-starred":`#5e81ac15`,"text-primary":`#2e3440`,"text-sender-read":`#3b4252`,"text-secondary":`#3b4252`,"text-muted":`#4c566a`,"border-color":`#d8dee9`,"accent-color":`#5e81ac`,"accent-hover":`#81a1c1`,"accent-light":`#81a1c133`,success:`#a3be8c`,warning:`#ebcb8b`,error:`#bf616a`,"hover-color":`rgba(0, 0, 0, 0.05)`}},"nord-dark":{id:`nord-dark`,name:`Nord Dark`,isDark:!0,colors:{"bg-primary":`#2e3440`,"bg-secondary":`#3b4252`,"bg-tertiary":`#434c5e`,"bg-selected":`#81a1c133`,"bg-starred":`#88c0d015`,"text-primary":`#eceff4`,"text-sender-read":`#e5e9f0`,"text-secondary":`#e5e9f0`,"text-muted":`#d8dee9`,"border-color":`#434c5e`,"accent-color":`#88c0d0`,"accent-hover":`#81a1c1`,"accent-light":`#81a1c133`,success:`#a3be8c`,warning:`#ebcb8b`,error:`#bf616a`,"hover-color":`rgba(255, 255, 255, 0.1)`}},"ocean-light":{id:`ocean-light`,name:`Ocean Light`,isDark:!1,colors:{"bg-primary":`#f8fafc`,"bg-secondary":`#f1f5f9`,"bg-tertiary":`#e2e8f0`,"bg-selected":`#e0f2fe`,"bg-starred":`#0ea5e915`,"text-primary":`#0f172a`,"text-sender-read":`#1e293b`,"text-secondary":`#334155`,"text-muted":`#64748b`,"border-color":`#cbd5e1`,"accent-color":`#0ea5e9`,"accent-hover":`#0284c7`,"accent-light":`#e0f2fe`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(0, 0, 0, 0.05)`}},"ocean-dark":{id:`ocean-dark`,name:`Ocean Dark`,isDark:!0,colors:{"bg-primary":`#0f172a`,"bg-secondary":`#1e293b`,"bg-tertiary":`#334155`,"bg-selected":`#0c4a6e`,"bg-starred":`#38bdf815`,"text-primary":`#f8fafc`,"text-sender-read":`#e2e8f0`,"text-secondary":`#cbd5e1`,"text-muted":`#94a3b8`,"border-color":`#334155`,"accent-color":`#38bdf8`,"accent-hover":`#0ea5e9`,"accent-light":`#0c4a6e`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(255, 255, 255, 0.1)`}}},we={themeMode:`auto`,colorFamily:`default`,layoutMode:`vertical`,densityMode:`compact`,sidebarCollapsed:!1,checkMailInterval:5,autoLogout:30,desktopNotifications:!1,soundNotifications:!0,name:``,signature:``,replyTo:``,bccMyself:!1,messagesPerPage:50,preferredView:`html`,markReadTimeout:3,showRemoteContent:`ask`,composeFormat:`html`,undoTimeout:0,language:`en`,hourFormat:`24`,dateFormat:`YYYY-MM-DD`,sortOrder:`desc`,messageSortCriteria:`date`,maxAttachmentMiB:32},Te=class extends EventTarget{constructor(){super(),this.state=this.loadSettings(),this.applyTheme(),window.matchMedia(`(prefers-color-scheme: dark)`).addEventListener(`change`,()=>{this.state.themeMode===`auto`&&this.applyTheme()}),window.addEventListener(`session-cleared`,()=>{this.state=this.loadSettings(),this.applyTheme(),this.notify()}),window.addEventListener(`user-logged-in`,()=>{this._fetchBackendSettings()}),this._fetchBackendSettings()}loadSettings(){let e=localStorage.getItem(`alps_settings`);if(e)try{let t=JSON.parse(e);return{...we,...t}}catch(e){y.error(`Failed to parse settings`,e)}return{...we}}saveSettings(){localStorage.setItem(`alps_settings`,JSON.stringify(this.state))}notify(){this.dispatchEvent(new CustomEvent(`change`))}getState(){return this.state}async updateSettings(e){this.state={...this.state,...e},this.saveSettings(),(e.themeMode!==void 0||e.colorFamily!==void 0)&&this.applyTheme(),this.notify();let t={...e};if(delete t.loginUsername,Object.keys(t).length>0)return this._saveBackendSettings(this.state)}async _fetchBackendSettings(){let e=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`)),t=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));if(!e&&!t){window.location.hash.startsWith(`#/login`)||window.dispatchEvent(new CustomEvent(`auth-error`));return}try{let e=await fetch(`/settings`);if(e.status===401){window.dispatchEvent(new CustomEvent(`auth-error`));return}if(e.ok){let t=await e.json(),n={};if(t.MaxAttachmentMiB!==void 0&&(n.maxAttachmentMiB=t.MaxAttachmentMiB),t&&t.Settings){let e=t.Settings;if(e.ui){let t=e.ui;t.themeMode&&(n.themeMode=t.themeMode),t.colorFamily&&(n.colorFamily=t.colorFamily),t.layoutMode&&(n.layoutMode=t.layoutMode),t.densityMode&&(n.densityMode=t.densityMode),t.sidebarCollapsed!==void 0&&(n.sidebarCollapsed=t.sidebarCollapsed)}e.check_mail_interval!==void 0&&e.check_mail_interval!==0&&(n.checkMailInterval=e.check_mail_interval),e.auto_logout!==void 0&&(n.autoLogout=e.auto_logout),e.desktop_notifications!==void 0&&(n.desktopNotifications=e.desktop_notifications),e.sound_notifications!==void 0&&(n.soundNotifications=e.sound_notifications),e.from!==void 0&&(n.name=e.from),e.signature!==void 0&&(n.signature=e.signature),e.reply_to!==void 0&&(n.replyTo=e.reply_to),e.bcc_myself!==void 0&&(n.bccMyself=e.bcc_myself),e.messages_per_page!==void 0&&e.messages_per_page!==0&&(n.messagesPerPage=e.messages_per_page),e.preferred_view!==void 0&&e.preferred_view!==``&&(n.preferredView=e.preferred_view),e.mark_read_timeout!==void 0&&(n.markReadTimeout=e.mark_read_timeout),e.show_remote_content!==void 0&&e.show_remote_content!==``&&(n.showRemoteContent=e.show_remote_content),e.compose_format!==void 0&&e.compose_format!==``&&(n.composeFormat=e.compose_format),e.undo_timeout!==void 0&&(n.undoTimeout=e.undo_timeout),e.language!==void 0&&e.language!==``&&(n.language=e.language),e.hour_format!==void 0&&e.hour_format!==``&&(n.hourFormat=e.hour_format),e.date_format!==void 0&&e.date_format!==``&&(n.dateFormat=e.date_format),e.sort_order!==void 0&&e.sort_order!==``&&(n.sortOrder=e.sort_order),e.message_sort_criteria!==void 0&&e.message_sort_criteria!==``&&(n.messageSortCriteria=e.message_sort_criteria),Object.keys(n).length>0&&(this.state={...this.state,...n},this.saveSettings(),this.applyTheme(),this.notify())}}}catch(e){y.error(`Failed to fetch backend settings`,e)}}async _saveBackendSettings(e){try{(await fetch(`/settings`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({ui:{themeMode:e.themeMode,colorFamily:e.colorFamily,layoutMode:e.layoutMode,densityMode:e.densityMode,sidebarCollapsed:e.sidebarCollapsed},check_mail_interval:Number(e.checkMailInterval)||0,auto_logout:Number(e.autoLogout)||0,desktop_notifications:!!e.desktopNotifications,sound_notifications:!!e.soundNotifications,from:e.name,signature:e.signature,reply_to:e.replyTo,bcc_myself:!!e.bccMyself,messages_per_page:Number(e.messagesPerPage)||50,preferred_view:e.preferredView,mark_read_timeout:Number(e.markReadTimeout)||0,show_remote_content:e.showRemoteContent,compose_format:e.composeFormat,undo_timeout:Number(e.undoTimeout)||0,language:e.language,hour_format:e.hourFormat,date_format:e.dateFormat,sort_order:e.sortOrder,message_sort_criteria:e.messageSortCriteria})})).status===401&&window.dispatchEvent(new CustomEvent(`auth-error`))}catch(e){y.error(`Failed to save backend settings`,e)}}applyTheme(){let e=!1;this.state.themeMode===`dark`?e=!0:this.state.themeMode===`auto`&&(e=window.matchMedia(`(prefers-color-scheme: dark)`).matches),e?document.body.classList.add(`theme-dark`):document.body.classList.remove(`theme-dark`);let t=Ce[`${this.state.colorFamily}-${e?`dark`:`light`}`]||Ce[`default-${e?`dark`:`light`}`];if(t)for(let[e,n]of Object.entries(t.colors))document.documentElement.style.setProperty(`--${e}`,n)}},S=r(`settings-store`),C=`INBOX`,Ee=`Drafts`,De=`Sent`,Oe=`Archive`,ke=`Archives`,Ae=`Spam`,je=`Junk`,Me=`Trash`;function w(e){return s`
    <svg class="icon">
      <use href="/assets/icons/sprite.svg?v=6#${e}"></use>
    </svg>
  `}function Ne(e){if(!e)return`#78909c`;let t=[`#ef5350`,`#ec407a`,`#ab47bc`,`#7e57c2`,`#5c6bc0`,`#42a5f5`,`#29b6f6`,`#26c6da`,`#26a69a`,`#66bb6a`,`#9ccc65`,`#d4e157`,`#ffca28`,`#ffa726`,`#ff7043`,`#8d6e63`,`#78909c`],n=0;for(let t=0;t<e.length;t++)n=e.charCodeAt(t)+((n<<5)-n);return t[Math.abs(n)%t.length]}function Pe(e,t=`YYYY-MM-DD`,n=`12`){if(!e)return``;let r=typeof e==`string`?new Date(e):e,i=new Date;if(r.getDate()===i.getDate()&&r.getMonth()===i.getMonth()&&r.getFullYear()===i.getFullYear())return r.toLocaleTimeString(void 0,{hour:`2-digit`,minute:`2-digit`,hour12:n===`12`});if(r.getFullYear()!==i.getFullYear()){let e=r.getFullYear(),n=String(r.getMonth()+1).padStart(2,`0`),i=String(r.getDate()).padStart(2,`0`);return t===`YYYY-MM-DD`?`${e}-${n}-${i}`:t===`MM/DD/YYYY`?`${n}/${i}/${e}`:t===`DD.MM.YYYY`?`${i}.${n}.${e}`:r.toLocaleDateString(void 0,{year:`numeric`,month:`short`,day:`numeric`})}return r.toLocaleDateString(void 0,{month:`short`,day:`numeric`})}function Fe(e,t=`YYYY-MM-DD`,n=`12`){if(!e)return``;let r=typeof e==`string`?new Date(e):e,i=r.getFullYear(),a=String(r.getMonth()+1).padStart(2,`0`),o=String(r.getDate()).padStart(2,`0`),s=`${i}-${a}-${o}`;t===`MM/DD/YYYY`?s=`${a}/${o}/${i}`:t===`DD.MM.YYYY`&&(s=`${o}.${a}.${i}`);let c=r.toLocaleTimeString(void 0,{hour:`2-digit`,minute:`2-digit`,hour12:n===`12`});return`${s} ${c}`}function Ie(e,t){if(!e)return``;let n={[C]:t?.t(`folderList.inbox`),[Ee]:t?.t(`folderList.drafts`),[De]:t?.t(`folderList.sent`),[Oe]:t?.t(`folderList.archive`),[ke]:t?.t(`folderList.archive`),[Ae]:t?.t(`folderList.spam`),[je]:t?.t(`folderList.junk`),[Me]:t?.t(`folderList.trash`)};if(n[e])return n[e];let r=e.split(/[.\/]/);return r[r.length-1]||e}function Le(e){if(!e||e===0)return`0 B`;let t=1024,n=[`B`,`KB`,`MB`,`GB`],r=Math.floor(Math.log(e)/Math.log(t));return Math.round(e/t**+r)+` `+n[r]}var Re=`alps_msg_`,ze=1800*1e3,Be={get(e,t,n=`html`){try{let r=`${Re}${e}_${t}_${n}`,i=sessionStorage.getItem(r);if(!i)return null;let a=JSON.parse(i);return Date.now()-a.timestamp>ze?(sessionStorage.removeItem(r),null):a}catch(e){return y.error(`Failed to read message cache`,e),null}},set(e,t,n,r){try{let i=`${Re}${e}_${t}_${n}`,a={...r,timestamp:Date.now()},o=JSON.stringify(a);if(o.length>2*1024*1024){console.warn(`Message ${t} is too large to cache (${Math.round(o.length/1024)}KB)`);return}sessionStorage.setItem(i,o)}catch(i){if(i instanceof DOMException&&(i.name===`QuotaExceededError`||i.code===22)){console.warn(`Session storage quota exceeded, clearing cache and retrying...`),this.clear();try{let i=`${Re}${e}_${t}_${n}`,a={...r,timestamp:Date.now()};sessionStorage.setItem(i,JSON.stringify(a))}catch(e){y.error(`Failed to write message cache even after clearing`,e)}}else y.error(`Failed to write message cache`,i)}},clear(){try{let e=[];for(let t=0;t<sessionStorage.length;t++){let n=sessionStorage.key(t);n&&n.startsWith(Re)&&e.push(n)}e.forEach(e=>sessionStorage.removeItem(e))}catch(e){y.error(`Failed to clear message cache`,e)}}};async function T(e,t={},n=25e3){let r=new AbortController,i=setTimeout(()=>r.abort(),n);try{let n=await fetch(e,{...t,signal:r.signal});return(n.status===502||n.status===503||n.status===504)&&window.dispatchEvent(new CustomEvent(`network-error`)),n}catch(e){throw(e instanceof TypeError||e.name===`AbortError`)&&window.dispatchEvent(new CustomEvent(`network-error`)),e}finally{clearTimeout(i)}}var E=new class extends EventTarget{constructor(...e){super(...e),this.interval=null,this.currentMailbox=C,this.currentPage=0,this.currentQuery=``,this.currentFetchId=0}setContext(e,t,n=``){this.currentMailbox=e,this.currentPage=t,this.currentQuery=n}start(e=5){if(this.stop(),e<=0)return;let t=e*60*1e3;this.interval=setInterval(()=>this.backgroundSync(),t)}stop(){this.interval&&=(clearInterval(this.interval),null)}sync(){this.fetch(this.currentMailbox,this.currentPage,this.currentQuery,!0)}syncIfViewing(e){this.currentMailbox===e&&this.sync()}async fetch(e,t,n=``,r=!1){this.setContext(e,t,n);let i=++this.currentFetchId;this.dispatchEvent(new CustomEvent(`sync-start`,{detail:{background:!1}}));let a=Date.now();try{let o=`/mailboxes/${encodeURIComponent(e)}?page=${t}`;n&&(o+=`&query=${encodeURIComponent(n)}`),r&&(o+=`&refresh=true`);let s=await T(o);if(this.currentFetchId!==i)return;if(s.status===401){this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`));return}if(s.status===404){this.dispatchEvent(new CustomEvent(`mailbox-not-found`));return}let c=await s.json();if(this.currentFetchId!==i)return;let l=Date.now()-a;if(l<200&&await new Promise(e=>setTimeout(e,200-l)),this.currentFetchId!==i)return;this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:c,background:!1}}))}catch(e){if(this.currentFetchId!==i)return;y.error(`Failed to fetch mailbox data`,e);let t=Date.now()-a;if(t<200&&await new Promise(e=>setTimeout(e,200-t)),this.currentFetchId!==i)return;this.dispatchEvent(new CustomEvent(`sync-error`,{detail:{error:e,background:!1}}))}}async backgroundSync(){try{this.currentMailbox!==`INBOX`&&await T(`/mailboxes/${C}/status`).catch(()=>{}),await T(`/mailboxes/${encodeURIComponent(this.currentMailbox)}/status`);let e=`/mailboxes/${encodeURIComponent(this.currentMailbox)}?page=${this.currentPage}`;this.currentQuery&&(e+=`&query=${encodeURIComponent(this.currentQuery)}`);let t=await T(e);if(t.status===401){this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`));return}let n=await t.json();this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:n,background:!0}}))}catch(e){y.error(`Background sync failed`,e)}}},D=`\\Seen`,Ve=`\\Flagged`,He=`\\Draft`,O=new class extends EventTarget{async setFlag(e,t,n,r){try{let i=await T(`/mailboxes/${encodeURIComponent(e)}/messages/flag`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:t,flags:n,action:r})});return i.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):i.ok}catch(e){return y.error(`Failed to set flag`,e),!1}}async toggleStar(e,t){let n=t?.UID;if(!n)return t;let r=t.Flags?.includes(Ve),i=r?`remove`:`add`;if(await this.setFlag(e,[String(n)],[`\\Flagged`],i)){let e={...t};return r?e.Flags=e.Flags.filter(e=>e!==Ve):e.Flags=[...e.Flags||[],Ve],e}return t}async markAsUnread(e,t){let n=t?.UID;return n?!!await this.setFlag(e,[String(n)],[`\\Seen`],`remove`):!1}async markAsRead(e,t){let n=t?.UID;if(!n||t.Flags?.includes(`\\Seen`))return t;if(await this.setFlag(e,[String(n)],[`\\Seen`],`add`)){let e={...t};return e.Flags=[...e.Flags||[],D],e}return t}async deleteMessages(e,t){if(!t||t.length===0)return!1;try{let n=await T(`/mailboxes/${encodeURIComponent(e)}/messages`,{method:`DELETE`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:t})});return n.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):n.ok?(E.sync(),!0):!1}catch(e){return y.error(`Failed to delete messages`,e),!1}}async moveMessages(e,t,n){if(!t||t.length===0)return{success:!1};try{let r=await T(`/mailboxes/${encodeURIComponent(e)}/messages/move`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:t,to:n})});return r.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),{success:!1}):r.ok?(E.sync(),{success:!0,uidMapping:(await r.json()).uidMapping}):{success:!1}}catch(e){return y.error(`Failed to move messages`,e),{success:!1}}}async copyMessages(e,t,n){if(!t||t.length===0)return{success:!1};try{let r=await T(`/mailboxes/${encodeURIComponent(e)}/messages/copy`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:t,to:n})});return r.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),{success:!1}):r.ok?(E.sync(),{success:!0}):{success:!1}}catch(e){return y.error(`Failed to copy messages`,e),{success:!1}}}async markMessagesAsRead(e,t){return!t||t.length===0?!1:await this.setFlag(e,t,[D],`add`)}async markMessagesAsUnread(e,t){return!t||t.length===0?!1:await this.setFlag(e,t,[D],`remove`)}async saveDraft(e){try{let t=await T(`/messages`,{method:`POST`,body:e});if(t.status===401)return this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),null;if(t.ok){let e=await t.json();return{uid:e.draft_uid,mailbox:e.draft_mailbox,size:e.draft_size,attachments:e.attachments}}let n=await t.json();return y.error(`Failed to save draft:`,n),null}catch(e){return y.error(`Failed to save draft:`,e),null}}async sendDraft(e){try{let t=await T(`/messages`,{method:`POST`,body:e});if(t.status===401)return this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1;if(t.ok)return E.sync(),!0;let n=await t.json();throw Error(n.error||`Failed to send message`)}catch(e){throw y.error(`Failed to send message:`,e),e}}},Ue=e=>{let t=e.trim(),n=t.match(/^.*?<([^>]+)>$/);n&&n[1]&&(t=n[1]);let r=t.toLowerCase();return r.startsWith(`noreply`)||r.startsWith(`no-reply`)||r.startsWith(`mailer-daemon`)},We=e=>e&&e.filter(e=>!Ue(e)),Ge=class extends EventTarget{constructor(){super(),this.state={activeComposers:[]},this.saveTimeout=null,this.state.activeComposers=this.loadDrafts()}loadDrafts(){try{let e=localStorage.getItem(`alps_compose_drafts`);if(e)return JSON.parse(e).map(e=>{let t=e.isSending;return{...e,attachments:e.attachments?.filter(e=>!e.uploading&&e.uuid)||[],isSending:!1,minimized:t?!1:e.minimized}})}catch(e){y.error(`Failed to parse compose drafts from localStorage`,e)}return[]}saveDrafts(){try{localStorage.setItem(`alps_compose_drafts`,JSON.stringify(this.state.activeComposers))}catch(e){y.error(`Failed to save compose drafts to localStorage`,e)}}debouncedSaveDrafts(){this.saveTimeout!==null&&window.clearTimeout(this.saveTimeout),this.saveTimeout=window.setTimeout(()=>{this.saveDrafts(),this.saveTimeout=null},500)}notify(){this.dispatchEvent(new CustomEvent(`change`))}get stateCopy(){return{...this.state}}getComposer(e){return this.state.activeComposers.find(t=>t.id===e)}getState(){return this.state}openComposer(e){if(e?.draftUid){let t=this.state.activeComposers.find(t=>t.draftUid===e.draftUid);if(t){this.bringComposerToFront(t.id),t.minimized&&this.updateComposer(t.id,{minimized:!1});return}}let t=window.innerWidth<=768;if(t&&this.state.activeComposers.length>=1){let e=this.state.activeComposers[0].id;this.bringComposerToFront(e);return}if(!t&&this.state.activeComposers.length>=3)return;let n=`composer_`+Date.now()+`_`+Math.random().toString(36).substr(2,5),r=`html`,i=``;try{let e=localStorage.getItem(`alps_settings`);if(e){let t=JSON.parse(e);t.composeFormat===`text`&&(r=`text`),t.signature&&(i=t.signature)}}catch{}let a=e?.text||``,o=e?.html||``;if(i&&!e?.draftUid){let t=`-- \n${i}`,n=`<div class="alps-signature">-- <br>${i.replace(/\n/g,`<br>`)}</div>`;a=`\n\n${t}\n${a}`,o=o||e?.text?`<br><br>${n}${o}`:`<br><br>${n}`}let s={id:n,minimized:!1,expanded:!1,dirty:!1,subject:``,format:e?.format||r,attachments:[],zIndex:1e3+this.state.activeComposers.length,...e,to:We(e?.to)||[],cc:We(e?.cc)||[],bcc:We(e?.bcc)||[],text:a,html:o,initialText:a,initialHtml:o};this.state={...this.state,activeComposers:[...this.state.activeComposers,s]},this.saveDrafts(),this.notify()}updateComposer(e,t){t.to&&=We(t.to),t.cc&&=We(t.cc),t.bcc&&=We(t.bcc);let n=this.state.activeComposers.map(n=>{if(n.id!==e)return n;let r=!1;if(`subject`in t&&t.subject!==n.subject&&(r=!0),`to`in t&&JSON.stringify(t.to||[])!==JSON.stringify(n.to||[])&&(r=!0),`cc`in t&&JSON.stringify(t.cc||[])!==JSON.stringify(n.cc||[])&&(r=!0),`bcc`in t&&JSON.stringify(t.bcc||[])!==JSON.stringify(n.bcc||[])&&(r=!0),`attachments`in t&&t.attachments!==n.attachments&&(r=!0),!r&&!n.dirty){if(`text`in t||`html`in t){let e=`text`in t?t.text||``:n.text||``,i=n.initialText||``;e.trim()!==i.trim()&&(r=!0)}}else !r&&n.dirty;let i=`dirty`in t?t.dirty:r?!0:n.dirty;return{...n,...t,dirty:i}});this.state={...this.state,activeComposers:n},this.debouncedSaveDrafts(),this.notify()}closeComposer(e){this.state={...this.state,activeComposers:this.state.activeComposers.filter(t=>t.id!==e)},this.saveDrafts(),this.notify()}discardDraft(e){let t=this.state.activeComposers.find(t=>t.id===e);t&&t.draftUid&&t.draftMailbox&&O.deleteMessages(t.draftMailbox,[String(t.draftUid)]),this.closeComposer(e)}clearAllComposers(){this.state={...this.state,activeComposers:[]},this.saveDrafts(),this.notify()}async saveAllDirtyDrafts(){let e=this.state.activeComposers.filter(e=>e.dirty);if(e.length>0)for(let t of e){let e=(t.to?.length||0)>0||(t.cc?.length||0)>0||(t.bcc?.length||0)>0,n=t.text?.trim()!==t.initialText?.trim()||(t.subject?.trim().length||0)>0;if(!e&&!n&&!(t.attachments&&t.attachments.length>0))continue;let r=new FormData,i=[...t.bcc||[]],a=``;try{let e=localStorage.getItem(`alps_settings`);if(e){let t=JSON.parse(e);t.bccMyself&&t.loginUsername&&(i.includes(t.loginUsername)||i.push(t.loginUsername)),t.replyTo&&(a=t.replyTo)}}catch{}r.append(`to`,(t.to||[]).join(`, `)),r.append(`cc`,(t.cc||[]).join(`, `)),r.append(`bcc`,i.join(`, `)),a&&r.append(`reply_to`,a),r.append(`subject`,(t.subject||``).trim()),r.append(`text`,t.text||``),t.html&&t.format===`html`&&r.append(`html`,t.html),r.append(`save_as_draft`,`1`);let o=t.attachments||[],s=o.map(e=>e.uuid).filter(Boolean).join(`,`);s&&r.append(`attachment-uuids`,s);let c=o.map(e=>e.partPath).filter(Boolean).join(`,`);c&&r.append(`prev_attachments`,c),t.draftMailbox&&r.append(`draft_mailbox`,t.draftMailbox),t.draftUid&&r.append(`draft_uid`,t.draftUid),await O.saveDraft(r)}this.state={...this.state,activeComposers:[]},this.saveDrafts(),this.notify()}bringComposerToFront(e){let t=1e3;this.state.activeComposers.forEach(e=>{e.zIndex&&e.zIndex>t&&(t=e.zIndex)}),this.updateComposer(e,{zIndex:t+1})}},k=r(`compose-store`),Ke=new class extends EventTarget{constructor(){super(),this.accounts=[],this.loading=!1,this.initialized=!1}getAccounts(){return this.accounts}isLoading(){return this.loading}isInitialized(){return this.initialized}async fetchAccounts(){this.loading=!0,this.dispatchEvent(new Event(`change`));try{let e=await fetch(`/accounts`);if(e.ok){let t=await e.json();this.accounts=t.accounts||[],this.initialized=!0}else y.error(`Failed to fetch linked accounts`)}catch(e){y.error(`Error fetching linked accounts:`,e)}finally{this.loading=!1,this.dispatchEvent(new Event(`change`))}}async addAccount(e,t,n=``){let r=new URLSearchParams;r.append(`username`,e),r.append(`password`,t),r.append(`display_name`,n);let i=await fetch(`/accounts`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:r.toString()});if(!i.ok){let e=await i.json().catch(()=>({}));throw Error(e.error||`Failed to add linked account`)}await this.fetchAccounts()}async removeAccount(e){let t=await fetch(`/accounts/${encodeURIComponent(e)}`,{method:`DELETE`});if(!t.ok){let e=await t.json().catch(()=>({}));throw Error(e.error||`Failed to remove linked account`)}await this.fetchAccounts()}async switchAccount(e){let t=new URLSearchParams;t.append(`username`,e);let n=await fetch(`/accounts/switch`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:t.toString()});if(!n.ok){let e=await n.json().catch(()=>({}));throw Error(e.error||`Failed to switch account`)}return await n.json()}},qe=r(`alps-linked-accounts`);function A(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var Je=class extends p{constructor(...e){super(...e),this.name=``,this.email=``,this.src=``,this.size=40,this.imageError=!1,this._handleStoreChange=()=>{this.requestUpdate()}}willUpdate(e){e.has(`src`)&&(this.imageError=!1)}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.settingsStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=o`
    :host {
      display: inline-block;
      flex-shrink: 0;
    }
    .avatar {
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      user-select: none;
      overflow: hidden; /* Ensure image doesn't overflow border-radius */
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background-color: white;
    }
  `}getInitials(e){if(!e)return`U`;let t=e.trim().split(/[\s.@]+/);return t.length>=2?(t[0][0]+t[1][0]).toUpperCase():e.substring(0,2).toUpperCase()}render(){let e=this.settingsStore?.getState()?.loginUsername||``,t=this.settingsStore?.getState()?.name||``,r=!1;(e&&this.email&&this.email.toLowerCase()===e.toLowerCase()||t&&this.name&&this.name.toLowerCase()===t.toLowerCase()||e&&this.name&&this.name.toLowerCase()===e.toLowerCase())&&(r=!0);let i=r?t||e:this.email||this.name,a=r&&(t||e)||this.name,o=Math.round(this.size/2.3);return s`
      <div class="avatar" style="${n({width:`${this.size}px`,height:`${this.size}px`,fontSize:`${o}px`,backgroundColor:Ne(i)})}">
        ${this.src&&!this.imageError?s`<img src="${this.src}" alt="${this.name}" @error="${()=>this.imageError=!0}" />`:this.getInitials(a)}
      </div>
    `}};A([f({context:S})],Je.prototype,`settingsStore`,void 0),A([i({type:String})],Je.prototype,`name`,void 0),A([i({type:String})],Je.prototype,`email`,void 0),A([i({type:String})],Je.prototype,`src`,void 0),A([i({type:Number})],Je.prototype,`size`,void 0),A([_()],Je.prototype,`imageError`,void 0),Je=A([a(`alps-avatar`)],Je);var Ye=o`
  .dropdown-header {
    padding: 12px 16px 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted, #6b7280);
    margin-bottom: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 16px;
    font-size: 14px;
    color: var(--text-primary, #111827);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s;
    white-space: nowrap;
  }

  .dropdown-item:hover:not(:disabled) {
    background-color: var(--bg-tertiary, #f3f4f6);
  }

  .dropdown-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dropdown-item:first-of-type {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  .dropdown-item:last-of-type {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  .dropdown-item.active {
    color: var(--text-primary, #111827);
    background-color: var(--bg-tertiary, #f3f4f6);
    font-weight: 600;
  }

  .dropdown-item.active svg {
    color: var(--text-primary, #111827);
  }

  .dropdown-item svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
    color: var(--text-secondary, #4b5563);
    flex-shrink: 0;
  }

  .item-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-divider {
    height: 1px;
    background: var(--border-color, #e5e7eb);
    margin: 4px 0;
  }
`,Xe=class extends p{constructor(...e){super(...e),this.align=`right`,this.position=`bottom`,this.openState=!1,this._handleDialogClick=e=>{this.openState&&e.target===e.currentTarget&&(e.stopPropagation(),e.preventDefault(),this.close())},this._handleDialogClose=()=>{this.openState&&this.close()},this._handleResize=()=>{this.openState&&this._updatePosition()}}static{this.styles=o`
    :host {
      display: inline-block;
      position: relative;
    }

    .popup-dialog {
      position: fixed;
      inset: 0;
      margin: 0;
      padding: 0;
      border: none;
      background: transparent;
      width: 100vw;
      height: 100vh;
      max-width: none;
      max-height: none;
      overflow: visible;
    }

    .popup-dialog::backdrop {
      background: transparent;
    }

    .popup-content {
      position: absolute;
      
      z-index: 40010;
      min-width: 160px;
      max-width: 320px;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 6px;
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      padding: 4px 0;
      display: flex;
      flex-direction: column;
    }

    .popup-content.align-right::before,
    .popup-content.align-right::after,
    .popup-content.align-left::before,
    .popup-content.align-left::after {
      content: '';
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
      pointer-events: none;
    }

    .popup-content.position-bottom.align-right::before {
      top: -6px;
      right: 10px;
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent var(--border-color, #e5e7eb) transparent;
    }

    .popup-content.position-bottom.align-right::after {
      top: -5px;
      right: 11px;
      border-width: 0 5px 5px 5px;
      border-color: transparent transparent var(--bg-primary, #ffffff) transparent;
    }

    .popup-content.position-bottom.align-left::before {
      top: -6px;
      left: 10px;
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent var(--border-color, #e5e7eb) transparent;
    }

    .popup-content.position-bottom.align-left::after {
      top: -5px;
      left: 11px;
      border-width: 0 5px 5px 5px;
      border-color: transparent transparent var(--bg-primary, #ffffff) transparent;
    }

    .popup-content.position-top.align-right::before {
      bottom: -6px;
      right: 10px;
      border-width: 6px 6px 0 6px;
      border-color: var(--border-color, #e5e7eb) transparent transparent transparent;
    }

    .popup-content.position-top.align-right::after {
      bottom: -5px;
      right: 11px;
      border-width: 5px 5px 0 5px;
      border-color: var(--bg-primary, #ffffff) transparent transparent transparent;
    }

    .popup-content.position-top.align-left::before {
      bottom: -6px;
      left: 10px;
      border-width: 6px 6px 0 6px;
      border-color: var(--border-color, #e5e7eb) transparent transparent transparent;
    }

    .popup-content.position-top.align-left::after {
      bottom: -5px;
      left: 11px;
      border-width: 5px 5px 0 5px;
      border-color: var(--bg-primary, #ffffff) transparent transparent transparent;
    }
  `}open(){this.openState=!0,this.dispatchEvent(new CustomEvent(`popup-open`,{bubbles:!0,composed:!0}))}close(){this.openState=!1,this.dispatchEvent(new CustomEvent(`popup-close`,{bubbles:!0,composed:!0}))}toggle(e){this.openState?this.close():this.open()}updated(e){if(super.updated(e),e.has(`openState`)){let e=this.shadowRoot?.querySelector(`.popup-dialog`);if(this.openState)e&&!e.open&&e.showModal(),this._updatePosition();else if(e&&e.open){e.close();let t=this.shadowRoot?.querySelector(`slot[name="trigger"]`);t&&t.assignedElements({flatten:!0}).forEach(e=>{e instanceof HTMLElement&&e.blur()})}}}_updatePosition(){let e=this.shadowRoot?.querySelector(`.trigger`),t=this.shadowRoot?.querySelector(`.popup-content`);if(!e||!t)return;let n=e.getBoundingClientRect(),r=t.getBoundingClientRect(),i=this.position,a=this.align;this.position===`bottom`?n.bottom+8+r.height>window.innerHeight&&n.top-8-r.height>=0&&(i=`top`):n.top-8-r.height<0&&n.bottom+8+r.height<=window.innerHeight&&(i=`bottom`),this.align===`right`?n.right-r.width<0&&n.left+r.width<=window.innerWidth&&(a=`left`):n.left+r.width>window.innerWidth&&n.right-r.width>=0&&(a=`right`),i===`bottom`?(t.style.top=`${n.bottom+8}px`,t.style.bottom=`auto`):(t.style.bottom=`${window.innerHeight-n.top+8}px`,t.style.top=`auto`),a===`right`?(t.style.right=`${window.innerWidth-n.right}px`,t.style.left=`auto`):(t.style.left=`${n.left}px`,t.style.right=`auto`),t.classList.remove(`position-top`,`position-bottom`,`align-left`,`align-right`),t.classList.add(`position-${i}`,`align-${a}`)}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this._handleResize,{passive:!0})}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this._handleResize)}render(){return s`
      <div class="trigger" @click=${this.toggle}>
        <slot name="trigger"></slot>
      </div>
      
      <dialog class="popup-dialog" @pointerdown=${this._handleDialogClick} @contextmenu=${this._handleDialogClick} @close=${this._handleDialogClose}>
        <div class="popup-content align-${this.align} position-${this.position}">
          <slot></slot>
        </div>
      </dialog>
    `}};A([i({type:String})],Xe.prototype,`align`,void 0),A([i({type:String})],Xe.prototype,`position`,void 0),A([i({type:Boolean,reflect:!0,attribute:`open`})],Xe.prototype,`openState`,void 0),Xe=A([a(`alps-popup`)],Xe);var Ze=class extends p{constructor(...e){super(...e),this.icon=``,this.title=``,this.disabled=!1,this.active=!1,this.spinning=!1}static{this.styles=o`
    :host {
      display: inline-flex;
      line-height: 0;
    }

    button {
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: var(--btn-icon-padding, 6px);
      border-radius: var(--btn-radius, 4px);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      margin: 0;
      line-height: 0;
      aspect-ratio: 1 / 1;
      box-sizing: border-box;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (hover: hover) {
      button:hover:not(:disabled) {
        background: var(--btn-hover-bg, var(--hover-color, rgba(0, 0, 0, 0.05)));
      }
      button:hover:not(:disabled) .icon {
        color: var(--text-primary);
      }
    }

    :host([active]) button {
      background: var(--btn-hover-bg, var(--hover-color, rgba(0, 0, 0, 0.05)));
    }
    :host([active]) .icon {
      color: var(--text-primary);
    }

    .icon {
      width: var(--btn-icon-size, 18px);
      height: var(--btn-icon-size, 18px);
      fill: currentColor;
      color: var(--btn-color, var(--text-muted));
      transition: color 0.2s;
    }

    .spinning .icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `}_handleAnimationIteration(){this.dispatchEvent(new Event(`animationiteration`,{bubbles:!0,composed:!0}))}render(){return s`
      <button 
        type="button"
        title=${this.title}
        ?disabled=${this.disabled}
        class=${this.spinning?`spinning`:``}
        part="button"
        @animationiteration=${this._handleAnimationIteration}
      >
        ${this.icon?w(this.icon):s`<slot></slot>`}
      </button>
    `}};A([i({type:String})],Ze.prototype,`icon`,void 0),A([i({type:String})],Ze.prototype,`title`,void 0),A([i({type:Boolean})],Ze.prototype,`disabled`,void 0),A([i({type:Boolean,reflect:!0})],Ze.prototype,`active`,void 0),A([i({type:Boolean})],Ze.prototype,`spinning`,void 0),Ze=A([a(`alps-icon-btn`)],Ze);var Qe=class extends p{constructor(...e){super(...e),this.username=``,this.isMobile=!1,this.currentTab=`messages`,this._handleStoreChange=()=>{this.requestUpdate()}}static{this.styles=[Ye,o`
    :host {
      display: block;
      position: relative;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary, #111827);
      user-select: none;
    }

    .user-text-container {
      display: flex;
      flex-direction: column;
      max-width: 180px;
    }

    .user-name-text {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }

    .user-address-text {
      font-size: 12px;
      font-weight: 400;
      color: var(--text-secondary, #6b7280);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
      margin-top: 2px;
    }

    .item-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 768px) {
      .user-text-container {
        display: none;
      }
      
      .user-info {
        gap: 0;
      }
    }
  `]}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange),this.settingsStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore&&!this.linkedAccountsStore.isInitialized()&&this.linkedAccountsStore.fetchAccounts()})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.removeEventListener(`change`,this._handleStoreChange)}_closePopup(){let e=this.shadowRoot?.querySelector(`alps-popup`);e&&e.close()}_handleSettings(){this._closePopup(),this.dispatchEvent(new CustomEvent(`open-settings`,{bubbles:!0,composed:!0}))}_handleSignOut(){this._closePopup(),this.dispatchEvent(new CustomEvent(`sign-out`,{bubbles:!0,composed:!0}))}_handleTabChange(e){this._closePopup(),e===`messages`&&(window.location.hash=`#/`),this.dispatchEvent(new CustomEvent(`change-tab`,{detail:{tab:e},bubbles:!0,composed:!0}))}async _handleSwitchAccount(e){this._closePopup();let t=document.createElement(`div`);document.body.appendChild(t),u(s`
      <style>
        @keyframes global-spin { to { transform: rotate(360deg); } }
        .switch-overlay svg { width: 100%; height: 100%; fill: currentColor; }
      </style>
      <div id="switch-account-overlay" class="switch-overlay" style="position: fixed; inset: 0; background-color: var(--bg-primary, #ffffff); z-index: 999999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease-in;">
        <div style="display: inline-flex; width: 32px; height: 32px; animation: global-spin 1s linear infinite; color: var(--accent-color, #2563eb);">
          ${w(`edelweiss`)}
        </div>
      </div>
    `,t);let n=t.querySelector(`#switch-account-overlay`);requestAnimationFrame(()=>{requestAnimationFrame(()=>{n&&(n.style.opacity=`1`)})}),await new Promise(e=>setTimeout(e,300));try{(await this.linkedAccountsStore.switchAccount(e)).requires_2fa?(window.location.hash=`#/login/webauthn`,n&&(n.style.opacity=`0`),setTimeout(()=>t.remove(),300)):(localStorage.removeItem(`alps_settings`),sessionStorage.clear(),window.location.reload())}catch(e){n&&(n.style.opacity=`0`),setTimeout(()=>t.remove(),300),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore?.t(`linkedAccounts.switchError`),duration:5e3}}))}}render(){let e=this.settingsStore?.getState().name||this.username;return s`
      <div class="user-profile">
        <div class="user-info">
          <alps-avatar .name=${e} .size=${28}></alps-avatar>
          <div class="user-text-container">
            <span class="user-name-text">${e}</span>
            <span class="user-address-text">${this.username}</span>
          </div>
        </div>
        <alps-popup align="right">
          <alps-icon-btn
            slot="trigger"
            .icon=${`dotsThreeVertical`}
            title=${this.i18nStore?.t(`userMenu.profileOptions`)}
          ></alps-icon-btn>
          
          ${(()=>{let e=this.linkedAccountsStore?.getAccounts()||[];return e.length===0?``:s`
              ${e.map(e=>s`
                <button class="dropdown-item" @click="${()=>this._handleSwitchAccount(e.username)}">
                  <alps-avatar .name=${e.display_name||e.username} .size=${16} style="margin-right: 4px;"></alps-avatar>
                  <span class="item-text" style="font-weight: 500;" title="${e.username}">${e.display_name||e.username}</span>
                </button>
              `)}
              <div class="dropdown-divider"></div>
            `})()}
          
          <button class="dropdown-item ${this.currentTab===`messages`?`active`:``}" @click="${()=>this._handleTabChange(`messages`)}">
            ${w(`envelopeSimple`)} <span class="item-text">${this.i18nStore?.t(`navigation.messages`)}</span>
          </button>
          <button class="dropdown-item ${this.currentTab===`contacts`?`active`:``}" @click="${()=>this._handleTabChange(`contacts`)}">
            ${w(`users`)} <span class="item-text">${this.i18nStore?.t(`navigation.contacts`)}</span>
          </button>
          <button class="dropdown-item ${this.currentTab===`calendar`?`active`:``}" @click="${()=>this._handleTabChange(`calendar`)}">
            ${w(`calendarBlank`)} <span class="item-text">${this.i18nStore?.t(`navigation.calendar`)}</span>
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item ${this.currentTab===`settings`?`active`:``}" @click="${this._handleSettings}">
            ${w(`gear`)} <span class="item-text">${this.i18nStore?.t(`userMenu.settings`)}</span>
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click="${this._handleSignOut}">
            ${w(`signOut`)} <span class="item-text">${this.i18nStore?.t(`userMenu.signOut`)}</span>
          </button>
        </alps-popup>
      </div>
    `}};A([i({type:String})],Qe.prototype,`username`,void 0),A([i({type:Boolean})],Qe.prototype,`isMobile`,void 0),A([i({type:String})],Qe.prototype,`currentTab`,void 0),A([f({context:x})],Qe.prototype,`i18nStore`,void 0),A([f({context:S})],Qe.prototype,`settingsStore`,void 0),A([f({context:qe})],Qe.prototype,`linkedAccountsStore`,void 0),Qe=A([a(`user-profile-menu`)],Qe);var $e=class extends p{constructor(...e){super(...e),this.username=``,this.currentTab=``,this.isMobile=!1,this.scrolled=!1,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=o`
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 57px;
      box-sizing: border-box;
      background: var(--bg-primary, #ffffff);
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      flex-shrink: 0;
      z-index: 20000;
      transition: box-shadow 0.2s ease;
    }

    :host([scrolled][ismobile]) {
      box-shadow: rgba(95, 95, 95, 0.1) 0 4px 4px -2px;
    }

    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      padding: 0 16px;
    }

    .left-section {
      display: flex;
      align-items: center;
      height: 100%;
      gap: 12px;
      flex-shrink: 0;
    }

    .center-section {
      flex: 1;
      display: flex;
      align-items: center;
      min-width: 0;
      margin: 0 24px;
    }

    .right-section {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }

    ::slotted([slot="center"]) {
      width: 100%;
    }
  `}handleSettings(){window.location.hash=`/settings`}async handleSignOut(){try{this.composeStore&&await this.composeStore.saveAllDirtyDrafts(),await fetch(`/session`,{method:`DELETE`}),Be.clear(),localStorage.removeItem(`alps_settings`),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`}catch(e){y.error(`Failed to sign out`,e)}}render(){return s`
      <div class="header-container">
        <div class="left-section">
          ${this.isMobile?s`
            <alps-icon-btn 
              title=${this.i18nStore?.t(`messageList.menu`)} 
              @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-sidebar`))}
              icon="sidebar"
              style="--icon-size: 20px;"
            ></alps-icon-btn>
          `:``}
          <slot name="left"></slot>
        </div>

        <div class="center-section">
          <slot name="center"></slot>
        </div>

        <div class="right-section">
          <slot name="right-actions"></slot>
          ${this.username?s`
            <user-profile-menu 
              .username=${this.username}
              .isMobile=${this.isMobile}
              .currentTab=${this.currentTab}
              @open-settings=${this.handleSettings}
              @sign-out=${this.handleSignOut}
            ></user-profile-menu>
          `:``}
        </div>
      </div>
    `}};A([i({type:String})],$e.prototype,`username`,void 0),A([i({type:String})],$e.prototype,`currentTab`,void 0),A([i({type:Boolean,reflect:!0})],$e.prototype,`isMobile`,void 0),A([i({type:Boolean,reflect:!0})],$e.prototype,`scrolled`,void 0),A([f({context:x})],$e.prototype,`i18nStore`,void 0),A([f({context:k})],$e.prototype,`composeStore`,void 0),$e=A([a(`alps-header`)],$e);var j=class extends p{constructor(...e){super(...e),this.type=`text`,this.value=``,this.placeholder=``,this.required=!1,this.autocomplete=``,this.inputId=``,this.icon=``,this.clearable=!1,this.autofocus=!1,this.showPassword=!1}static{this.styles=o`
    :host {
      display: block;
      width: 100%;
      position: relative;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    input {
      width: 100%;
      height: 36px;
      padding: 0 12px;
      background: var(--alps-input-bg, var(--bg-primary, #ffffff));
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--input-radius, 6px);
      color: var(--text-primary, #111827);
      font-family: var(--font-base, 'Inter', sans-serif);
      font-size: var(--input-font-size, 14px);
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }

    /* Padding adjustments for icons */
    .has-left-icon input {
      padding-left: 36px;
    }

    .has-right-icon input {
      padding-right: 36px;
    }

    input:focus {
      border-color: var(--accent-color, #005A9E);
      box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
    }

    input::placeholder {
      color: var(--text-muted, #9ca3af);
    }

    .icon-left {
      position: absolute;
      left: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      color: var(--text-muted, #9ca3af);
      pointer-events: none;
    }

    .icon-left svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .action-btn {
      position: absolute;
      right: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      color: var(--text-muted, #9ca3af);
      cursor: pointer;
      background: transparent;
      border: none;
      padding: 0;
      border-radius: 4px;
      transition: color 0.2s ease, background 0.2s ease;
      outline: none;
    }

    .action-btn:hover {
      color: var(--text-primary, #111827);
      background: var(--bg-tertiary, #f3f4f6);
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
  `}handleInput(e){let t=e.target;this.value=t.value,this.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}togglePassword(){this.showPassword=!this.showPassword}handleClear(){this.value=``,this.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`clear`,{bubbles:!0,composed:!0}))}handleKeyDown(e){if(e.key===`Enter`){let t=this.closest(`form`);t&&(e.preventDefault(),t.requestSubmit())}}checkValidity(){let e=this.shadowRoot?.querySelector(`input`);return e?e.checkValidity():!0}reportValidity(){let e=this.shadowRoot?.querySelector(`input`);return e?e.reportValidity():!0}focus(){let e=this.shadowRoot?.querySelector(`input`);e&&e.focus()}render(){let e=this.type===`password`,t=e&&this.showPassword?`text`:this.type,n=this.icon||(this.type===`email`?`at`:``);return s`
      <div class="input-wrapper ${n?`has-left-icon`:``} ${(e||this.clearable)&&this.value?`has-right-icon`:``}">
        ${n?s`
          <span class="icon-left">
            ${w(n)}
          </span>
        `:``}

        <input 
          id=${this.inputId||``}
          type=${t} 
          .value=${this.value}
          placeholder=${this.placeholder}
          ?required=${this.required}
          ?autofocus=${this.autofocus}
          autocomplete=${this.autocomplete}
          @input=${this.handleInput}
          @change=${this.handleInput}
          @keydown=${this.handleKeyDown}
        />

        ${e&&this.value?s`
          <button 
            type="button" 
            class="action-btn" 
            @click=${this.togglePassword}
            title=${this.showPassword?`Hide password`:`Show password`}
            tabindex="-1"
          >
            ${w(this.showPassword?`eyeSlash`:`eye`)}
          </button>
        `:this.clearable&&this.value?s`
          <button 
            type="button" 
            class="action-btn" 
            @click=${this.handleClear}
            title="Clear"
            tabindex="-1"
          >
            ${w(`x`)}
          </button>
        `:``}
      </div>
    `}};A([i({type:String})],j.prototype,`type`,void 0),A([i({type:String})],j.prototype,`value`,void 0),A([i({type:String})],j.prototype,`placeholder`,void 0),A([i({type:Boolean})],j.prototype,`required`,void 0),A([i({type:String})],j.prototype,`autocomplete`,void 0),A([i({type:String})],j.prototype,`inputId`,void 0),A([i({type:String})],j.prototype,`icon`,void 0),A([i({type:Boolean})],j.prototype,`clearable`,void 0),A([i({type:Boolean})],j.prototype,`autofocus`,void 0),A([_()],j.prototype,`showPassword`,void 0),j=A([a(`alps-input`)],j);var M=class extends p{constructor(...e){super(...e),this.username=``,this.currentTab=`messages`,this.isMobile=!1,this.currentMailbox=``,this.searchQuery=``,this.scrolled=!1,this._handleStoreChange=()=>{this.requestUpdate()},this._handleHashChange=()=>{let e=window.location.hash;e.startsWith(`#/contacts`)?this.currentTab=`contacts`:e.startsWith(`#/calendar`)?this.currentTab=`calendar`:e.startsWith(`#/settings`)?this.currentTab=`settings`:this.currentTab=`messages`}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)}),window.addEventListener(`hashchange`,this._handleHashChange),this._handleHashChange()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),window.removeEventListener(`hashchange`,this._handleHashChange)}static{this.styles=o`
    :host {
      display: block;
      width: 100%;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
    }

    .logo svg {
      width: 28px;
      height: 28px;
    }

    .nav-tabs {
      display: flex;
      height: 100%;
      gap: 8px;
    }

    .nav-tab {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 12px;
      color: var(--text-secondary, #4b5563);
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .nav-tab:hover {
      color: var(--text-primary, #111827);
    }

    .nav-tab.active {
      color: var(--accent-color, #2563eb);
      border-bottom-color: var(--accent-color, #2563eb);
    }

    .header-left-slot {
      display: flex;
      align-items: center;
      height: 100%;
      gap: 12px;
    }

    alps-input {
      flex: 1;
      --alps-input-bg: var(--bg-secondary, #f9fafb);
    }
  `}handleTabClick(e){this.currentTab=e,this.dispatchEvent(new CustomEvent(`change-tab`,{detail:{tab:e}})),e===`messages`?window.location.hash.startsWith(`#/mailbox/`)||(window.location.hash=`#/`):window.location.hash=`#/`+e}render(){return s`
      <alps-header 
        .username=${this.username} 
        .isMobile=${this.isMobile} 
        .currentTab=${this.currentTab}
        .scrolled=${this.scrolled}
        @toggle-sidebar=${()=>this.dispatchEvent(new CustomEvent(`toggle-sidebar`))}
      >
        <div slot="left" class="header-left-slot">
          ${this.isMobile?``:s`
            <div class="logo" title="Alps">
              ${w(`edelweiss`)}
            </div>
            <div class="nav-tabs">
              <div 
                class="nav-tab ${this.currentTab===`messages`?`active`:``}"
                @click=${()=>this.handleTabClick(`messages`)}
                title=${this.i18nStore?.t(`navigation.messages`)}
              >
                ${this.i18nStore?.t(`navigation.messages`)}
              </div>
              ${ue.getNavTabs().map(e=>s`
                <div 
                  class="nav-tab ${this.currentTab===e.id?`active`:``}"
                  @click=${()=>this.handleTabClick(e.id)}
                  title=${this.i18nStore?.t(e.labelKey)||e.id}
                >
                  ${this.i18nStore?.t(e.labelKey)||e.id}
                </div>
              `)}
              <div 
                class="nav-tab ${this.currentTab===`calendar`?`active`:``}"
                @click=${()=>this.handleTabClick(`calendar`)}
                title=${this.i18nStore?.t(`navigation.calendar`)}
              >
                ${this.i18nStore?.t(`navigation.calendar`)}
              </div>
            </div>
          `}
        </div>

        <alps-input 
          slot="center"
          icon="magnifyingGlass"
          ?clearable=${!0}
          .value=${this.searchQuery}
          .placeholder=${this.currentTab===`contacts`?this.i18nStore?.t(`contacts.title`)||`Contacts`:this.currentMailbox?Ie(this.currentMailbox,this.i18nStore):this.i18nStore?.t(`search.placeholder`)}
          @keydown=${e=>{e.key===`Enter`&&(e.preventDefault(),this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:e.target.value},bubbles:!0,composed:!0})))}}
          @clear=${()=>{this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:``},bubbles:!0,composed:!0}))}}
        ></alps-input>

        <div slot="right-actions">
          ${this.isMobile?s`
            <alps-icon-btn 
              title=${this.i18nStore?.t(`messageList.compose`)} 
              @click=${()=>this.dispatchEvent(new CustomEvent(`compose`,{bubbles:!0,composed:!0}))}
              icon="pen"
              style="--icon-size: 20px;"
            ></alps-icon-btn>
          `:``}
        </div>
      </alps-header>
    `}};A([i({type:String})],M.prototype,`username`,void 0),A([i({type:String})],M.prototype,`currentTab`,void 0),A([i({type:Boolean})],M.prototype,`isMobile`,void 0),A([i({type:String})],M.prototype,`currentMailbox`,void 0),A([i({type:String})],M.prototype,`searchQuery`,void 0),A([i({type:Boolean})],M.prototype,`scrolled`,void 0),A([f({context:x})],M.prototype,`i18nStore`,void 0),M=A([a(`app-header`)],M);var N=class extends p{constructor(...e){super(...e),this.variant=`normal`,this.icon=``,this.disabled=!1,this.spinning=!1,this.type=`button`,this.title=``,this.fullWidth=!1,this.handleClick=e=>{if(this.disabled||this.spinning){e.preventDefault(),e.stopPropagation();return}if(this.type===`submit`){let t=this.closest(`form`);t&&(e.preventDefault(),t.requestSubmit())}else if(this.type===`reset`){let t=this.closest(`form`);t&&(e.preventDefault(),t.reset())}}}connectedCallback(){super.connectedCallback(),this.addEventListener(`click`,this.handleClick)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(`click`,this.handleClick)}static{this.styles=o`
    :host {
      display: inline-flex;
    }

    :host([full-width]) {
      display: flex;
      width: 100%;
    }

    :host([full-width]) button {
      width: 100%;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--btn-gap, 8px);
      font-family: inherit;
      font-size: var(--btn-font-size, 14px);
      font-weight: 500;
      border-radius: var(--btn-radius, 4px);
      padding: var(--btn-padding, 8px 16px);
      cursor: pointer;
      transition: all 0.2s ease;
      box-sizing: border-box;
      line-height: normal;
      outline: none;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button:active:not(:disabled) {
      transform: scale(0.98);
    }

    /* Variant: Normal (Default) */
    :host([variant="normal"]) button {
      background-color: transparent;
      color: var(--text-primary, #111827);
      border: 1px solid var(--border-color, #e5e7eb);
    }
    
    @media (hover: hover) {
      :host([variant="normal"]) button:hover:not(:disabled) {
        background-color: var(--bg-tertiary, #f3f4f6);
      }
    }

    /* Variant: Primary */
    :host([variant="primary"]) button {
      background-color: var(--accent-color, #3b82f6);
      color: #ffffff;
      border: 1px solid transparent;
    }
    
    @media (hover: hover) {
      :host([variant="primary"]) button:hover:not(:disabled) {
        background-color: var(--accent-hover, #2563eb);
      }
    }

    /* Variant: Danger */
    :host([variant="danger"]) button {
      background-color: transparent;
      color: var(--error, #ef4444);
      border: 1px solid var(--border-color, #e5e7eb);
    }
    
    @media (hover: hover) {
      :host([variant="danger"]) button:hover:not(:disabled) {
        background-color: var(--error-light, #fee2e2);
        border-color: var(--error, #ef4444);
      }
    }

    /* Variant: Text */
    :host([variant="text"]) button {
      background-color: transparent;
      color: var(--text-muted, #6b7280);
      border: 1px solid transparent;
    }
    
    @media (hover: hover) {
      :host([variant="text"]) button:hover:not(:disabled) {
        color: var(--text-primary, #111827);
        background-color: var(--hover-color, rgba(0, 0, 0, 0.05));
      }
    }

    /* Icons and Spinners */
    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--btn-icon-size, 18px);
      height: var(--btn-icon-size, 18px);
    }

    .icon-container svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .spinner {
      animation: spin 1s linear infinite;
      display: flex;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* Slot wrapper for proper alignment */
    .content {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }
  `}render(){return s`
      <button 
        type=${this.type}
        title=${this.title}
        ?disabled=${this.disabled||this.spinning}
        part="button"
      >
        ${this.spinning?s`
          <span class="icon-container spinner">
            ${w(`edelweiss`)}
          </span>
        `:this.icon?s`
          <span class="icon-container">
            ${w(this.icon)}
          </span>
        `:``}
        <span class="content"><slot></slot></span>
      </button>
    `}};A([i({type:String,reflect:!0})],N.prototype,`variant`,void 0),A([i({type:String})],N.prototype,`icon`,void 0),A([i({type:Boolean,reflect:!0})],N.prototype,`disabled`,void 0),A([i({type:Boolean,reflect:!0})],N.prototype,`spinning`,void 0),A([i({type:String})],N.prototype,`type`,void 0),A([i({type:String})],N.prototype,`title`,void 0),A([i({type:Boolean,attribute:`full-width`,reflect:!0})],N.prototype,`fullWidth`,void 0),N=A([a(`alps-button`)],N);var P=class extends p{constructor(...e){super(...e),this.isMobile=!1,this.isOpen=!1,this.collapsed=!1,this.suppressHover=!1,this.isHovered=!1,this.width=250,this.isDragging=!1}static{this.styles=o`
    :host {
      display: block;
      position: relative;
      height: 100%;
      z-index: 10;
      transition: z-index 0s 0.2s;
    }

    :host([collapsed][ishovered]:not([suppresshover])) {
      z-index: 30 !important;
      transition: z-index 0s 0s;
    }

    .sidebar {
      background-color: var(--bg-secondary, #f3f4f6);
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      position: relative;
      z-index: 10;
      box-sizing: border-box;
      border-right: 1px solid var(--border-color, #e5e7eb);
      box-shadow: rgba(95, 95, 95, 0) 4px 0 4px -2px;
      transition: width 0.2s, box-shadow 0.2s, z-index 0s 0.2s;
    }

    :host([collapsed]:not([ishovered])) .sidebar,
    :host([collapsed][suppresshover]) .sidebar {
      border-right: none;
      width: 100%;
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      box-shadow: rgba(95, 95, 95, 0) 4px 0 4px -2px;
    }

    :host([collapsed][ishovered]:not([suppresshover])) .sidebar {
      width: var(--sidebar-width-expanded, 250px);
      box-shadow: rgba(95, 95, 95, 0.1) 4px 0 4px -2px;
      z-index: 30;
      transition: width 0.2s, box-shadow 0.2s, z-index 0s 0s;
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
    }

    .sidebar-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    /* Mobile overrides */
    :host(.mobile-sidebar) {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 100;
    }
    
    :host(.mobile-sidebar) .sidebar {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 280px;
      z-index: 100;
      pointer-events: auto;
      transform: translateX(-100%);
      transition: transform 0.25s cubic-bezier(0, 0, 0.2, 1);
      box-shadow: rgba(95, 95, 95, 0.1) 4px 0 4px -2px;
    }

    :host(.mobile-sidebar.open) .sidebar {
      transform: translateX(0);
    }

    .mobile-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: transparent;
      z-index: 99;
      pointer-events: none;
    }

    :host(.mobile-sidebar.open) .mobile-backdrop {
      pointer-events: auto;
    }

    .sidebar-resizer {
      position: absolute;
      top: 0;
      right: -3px;
      bottom: 0;
      width: 6px;
      cursor: col-resize;
      z-index: 50;
    }
    .sidebar-resizer::after {
      content: '';
      position: absolute;
      background: transparent;
      transition: background 0.2s;
      width: 3px;
      top: 0;
      bottom: 0;
      left: 1px;
    }
    .sidebar-resizer:hover::after, .sidebar-resizer.dragging::after {
      background: var(--accent-color, #005A9E);
    }

    /* Do not show resizer on mobile or when collapsed */
    :host([collapsed]) .sidebar-resizer,
    :host(.mobile-sidebar) .sidebar-resizer {
      display: none;
    }

    .sidebar-footer {
      padding: 0 16px;
      height: 57px;
      box-sizing: border-box;
      flex-shrink: 0;
      border-top: 1px solid var(--border-color, #e5e7eb);
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      background: var(--bg-secondary, #f9fafb);
    }
    .footer-divider {
      width: 1px;
      height: 20px;
      background: var(--border-color, #e5e7eb);
      margin: 0 4px;
      flex-shrink: 0;
    }

    :host([collapsed]:not([ishovered])) .footer-divider,
    :host([collapsed]:not([ishovered])) ::slotted([slot="footer-actions"]) {
      display: none;
    }
  `}startResize(e){if(this.isMobile||this.collapsed)return;e.preventDefault(),this.isDragging=!0,this.dispatchEvent(new CustomEvent(`drag-start`));let t=e.clientX,n=this.width,r=e=>{let r=n+(e.clientX-t);this.dispatchEvent(new CustomEvent(`sidebar-resize`,{detail:{newWidth:r,clientX:e.clientX}}))},i=()=>{this.isDragging=!1,window.removeEventListener(`mousemove`,r),window.removeEventListener(`mouseup`,i),this.dispatchEvent(new CustomEvent(`drag-end`))};window.addEventListener(`mousemove`,r),window.addEventListener(`mouseup`,i)}render(){return s`
      <div class="mobile-backdrop" @click=${()=>this.dispatchEvent(new CustomEvent(`close-sidebar`))}></div>
      <aside class="sidebar" part="sidebar">
        <div class="sidebar-content">
          <slot></slot>
        </div>
        <div class="sidebar-footer">
          <alps-icon-btn 
            class="collapse-btn"
            icon="sidebar"
            title=${this.collapsed?`Expand sidebar`:`Collapse sidebar`}
            @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-collapse`))}
            style="--btn-padding: 8px; --icon-size: 20px;"
          ></alps-icon-btn>
          <div class="footer-divider"></div>
          <slot name="footer-actions"></slot>
        </div>
      </aside>
      <div class="sidebar-resizer ${this.isDragging?`dragging`:``}" @mousedown=${this.startResize}></div>
    `}};A([i({type:Boolean})],P.prototype,`isMobile`,void 0),A([i({type:Boolean})],P.prototype,`isOpen`,void 0),A([i({type:Boolean,reflect:!0})],P.prototype,`collapsed`,void 0),A([i({type:Boolean,reflect:!0})],P.prototype,`suppressHover`,void 0),A([i({type:Boolean,reflect:!0})],P.prototype,`isHovered`,void 0),A([i({type:Number})],P.prototype,`width`,void 0),A([_()],P.prototype,`isDragging`,void 0),P=A([a(`alps-sidebar`)],P);var et=o`
  .btn-cancel {
    background: transparent;
    border: none;
    color: var(--text-muted, #6b7280);
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;
    font-weight: 500;
    padding: 8px 16px;
    transition: color 0.2s;
  }
  .btn-cancel:hover { color: var(--text-primary, #111827); }
  
  .btn-confirm {
    background-color: transparent;
    color: var(--text-primary, #111827);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 4px;
    font-family: inherit;
    padding: 8px 16px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }
  .btn-confirm:hover { 
    background-color: var(--bg-tertiary, #f3f4f6);
  }
  .btn-confirm.danger {
    color: var(--error, #ef4444);
    border-color: var(--error, #ef4444);
  }
  .btn-confirm.danger:hover {
    background-color: var(--error, #ef4444);
    color: #ffffff;
  }
`,tt=class extends p{constructor(...e){super(...e),this.title=``,this.isDanger=!1,this.dismissible=!1,this.width=`400px`,this._handleDialogClose=()=>{this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}}static{this.styles=o`
    .modal-dialog {
      position: fixed;
      inset: 0;
      margin: 0;
      padding: 0;
      border: none;
      background: transparent;
      width: 100vw;
      height: 100vh;
      max-width: none;
      max-height: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .modal-dialog::backdrop {
      background: var(--modal-backdrop, rgba(255, 255, 255, 0.8));
    }

    .modal-card {
      background: var(--bg-primary, #ffffff);
      padding: 24px;
      border-radius: 8px;
      max-width: 100%;
      border: 1px solid var(--border-color, #e5e7eb);
      box-shadow: 0 8px 24px -6px rgba(0,0,0,0.15);
      font-family: inherit;
    }
    .modal-title {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 500;
      color: var(--text-primary, #111827);
    }
    .modal-title.danger {
      color: var(--error, #ef4444);
    }
    .modal-body {
      margin-bottom: 24px;
      color: var(--text-secondary, #4b5563);
      line-height: 1.5;
      font-size: 14px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      align-items: center;
    }
  `}firstUpdated(){let e=this.shadowRoot?.querySelector(`.modal-dialog`);e&&!e.open&&e.showModal()}_handleOverlayClick(e){this.dismissible?e.target===e.currentTarget&&(e.stopPropagation(),this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))):e.stopPropagation()}render(){return s`
      <dialog class="modal-dialog" @pointerdown=${this._handleOverlayClick} @close=${this._handleDialogClose}>
        <div class="modal-card" style="width: ${this.width};" @pointerdown=${e=>e.stopPropagation()}>
          <slot name="header">
            ${this.title?s`<h3 class="modal-title ${this.isDanger?`danger`:``}">${this.title}</h3>`:``}
          </slot>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-actions">
            <slot name="actions"></slot>
          </div>
        </div>
      </dialog>
    `}};A([i({type:String})],tt.prototype,`title`,void 0),A([i({type:Boolean})],tt.prototype,`isDanger`,void 0),A([i({type:Boolean})],tt.prototype,`dismissible`,void 0),A([i({type:String})],tt.prototype,`width`,void 0),tt=A([a(`ui-modal`)],tt);var nt=class extends p{constructor(...e){super(...e),this.title=`Prompt`,this.fields=[],this.confirmText=`Apply`,this.cancelText=`Cancel`,this.values={}}static{this.styles=[et,o`
      .field-group {
        margin-bottom: 16px;
      }
      .field-group:last-child {
        margin-bottom: 0;
      }
      .field-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--text-primary, #111827);
      }
      .field-input {
        margin-top: 8px;
      }
    `]}connectedCallback(){super.connectedCallback();let e={};for(let t of this.fields)e[t.id]=t.value||``;this.values=e}firstUpdated(){setTimeout(()=>{let e=this.shadowRoot?.querySelector(`alps-input[autofocus]`);if(e&&typeof e.focus==`function`)e.focus();else{let e=this.shadowRoot?.querySelector(`alps-input`);e&&typeof e.focus==`function`&&e.focus()}},50)}_handleInput(e,t){let n=e.target;this.values={...this.values,[t]:n.value}}_handleKeyDown(e){e.key===`Enter`&&(e.preventDefault(),this._handleSubmit())}_handleCancel(){this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}_handleSubmit(){this.dispatchEvent(new CustomEvent(`submit`,{detail:this.values,bubbles:!0,composed:!0}))}render(){return s`
      <ui-modal 
        .title=${this.title}
        @cancel=${this._handleCancel}>
        
        <div class="prompt-form">
          ${this.fields.map(e=>s`
            <div class="field-group">
              <label class="field-label" for=${e.id}>${e.label}</label>
              <alps-input 
                inputId=${e.id}
                class="field-input"
                type=${e.type||`text`}
                placeholder=${e.placeholder||``}
                .value=${this.values[e.id]||``}
                ?autofocus=${e.autofocus}
                @input=${t=>this._handleInput(t,e.id)}
                @keydown=${this._handleKeyDown}
              ></alps-input>
            </div>
          `)}
        </div>
        
        <alps-button slot="actions" variant="text" @click=${this._handleCancel}>${this.cancelText}</alps-button>
        <alps-button slot="actions" variant="normal" @click=${this._handleSubmit}>${this.confirmText}</alps-button>
      </ui-modal>
    `}};A([i({type:String})],nt.prototype,`title`,void 0),A([i({type:Array})],nt.prototype,`fields`,void 0),A([i({type:String})],nt.prototype,`confirmText`,void 0),A([i({type:String})],nt.prototype,`cancelText`,void 0),A([_()],nt.prototype,`values`,void 0),nt=A([a(`ui-prompt`)],nt);var rt=class extends p{constructor(...e){super(...e),this.text=``,this.fullHeight=!1}static{this.styles=o`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: currentColor;
    }
    
    :host([full-height]) {
      display: flex;
      height: 100%;
    }

    .spinner {
      animation: spin 1.5s linear infinite;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner .icon {
      width: var(--loader-size, 32px);
      height: var(--loader-size, 32px);
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `}render(){return s`
      <div class="spinner">${w(`edelweiss`)}</div>
      ${this.text?s`<span>${this.text}</span>`:``}
    `}};A([i({type:String})],rt.prototype,`text`,void 0),A([i({type:Boolean,attribute:`full-height`})],rt.prototype,`fullHeight`,void 0),rt=A([a(`alps-loader`)],rt);var it=class extends p{constructor(...e){super(...e),this.hidden=!1}static{this.styles=o`
    :host {
      position: absolute;
      inset: 0;
      background: var(--bg-primary, #ffffff);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.5s ease-in-out, visibility 0.5s;
    }

    :host([hidden]) {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
  `}render(){return s`<alps-loader></alps-loader>`}};A([i({type:Boolean,reflect:!0})],it.prototype,`hidden`,void 0),it=A([a(`alps-initial-loader`)],it);var at=class extends p{constructor(...e){super(...e),this.collapsed=!1,this.icon=`plus`,this.text=``,this.disabled=!1,this.title=``}static{this.styles=o`
    :host {
      display: block;
      width: 100%;
    }

    .create-btn {
      width: 100%;
      height: 36px;
      font-size: 14px;
      overflow: hidden;
      --btn-padding: 8px 16px;
      --btn-gap: 8px;
      transition: all 0.2s ease;
    }

    .create-btn::part(button) {
      width: 100%;
      height: 100%;
    }

    :host([collapsed]) .create-btn {
      --btn-padding: 8px;
      --btn-gap: 0px;
    }

    .create-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: max-width 0.2s ease, opacity 0.2s ease, margin 0.2s ease;
      max-width: 150px;
      opacity: 1;
      display: inline-block;
    }

    :host([collapsed]) .create-text {
      max-width: 0;
      opacity: 0;
      margin-left: 0;
    }
  `}render(){return s`
      <alps-button 
        variant="primary"
        icon="${this.icon}"
        class="create-btn"
        ?disabled=${this.disabled}
        title="${this.title}"
        @click=${()=>{}}
      >
        <span class="create-text"><slot>${this.text}</slot></span>
      </alps-button>
    `}};A([i({type:Boolean})],at.prototype,`collapsed`,void 0),A([i({type:String})],at.prototype,`icon`,void 0),A([i({type:String})],at.prototype,`text`,void 0),A([i({type:Boolean})],at.prototype,`disabled`,void 0),A([i({type:String})],at.prototype,`title`,void 0),at=A([a(`alps-create-button`)],at);var F=class extends p{constructor(...e){super(...e),this.contacts=[],this.uniqueCategories=[],this.selectedCategory=``,this.filterQuery=``,this.sidebarCollapsed=!1,this.isSidebarHovered=!1,this.suppressSidebarHover=!1,this.isMobile=!1,this.activeKebabMenu=null,this.sidebarScrolled=!1}static{this.styles=[Ye,o`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
      box-sizing: border-box;
    }
    .sidebar-wrapper {
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-color: var(--bg-secondary, #f9fafb);
    }
    .sidebar-header {
      padding: 0 12px;
      gap: 8px;
      background-color: var(--bg-secondary, #f9fafb);
      z-index: 10;
    }
    .sidebar-wrapper.collapsed .sidebar-header {
      padding: 0 14px !important;
      justify-content: flex-start;
    }
    .sidebar-wrapper.collapsed .sidebar-content {
      opacity: 0.5;
      overflow-y: hidden;
    }
    .sidebar-scroll-content {
      width: calc(max(100%, 215px));
      margin-left: calc(min(0px, (100% - 215px) * 50 / 167));
    }
    .sidebar-wrapper.collapsed .category-item {
      border-radius: 6px 0 0 6px;
    }
    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 8px;
    }
    .category-item {
      display: flex;
      align-items: center;
      position: relative;
      height: 36px;
      padding: 0 8px;
      box-sizing: border-box;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-color, #111827);
      margin-bottom: 2px;
      user-select: none;
      transition: background 0.15s;
    }
    .category-item:hover {
      background: var(--hover-color, #e5e7eb);
    }
    .category-item.active {
      background: var(--bg-selected, #eff6ff);
      color: var(--accent-hover, #2563eb);
      font-weight: 600;
    }
    .category-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .category-actions {
      display: none;
      align-items: center;
      padding-left: 8px;
      margin-left: auto;
      margin-right: -4px;
    }
    .category-item.active .category-actions {
      display: none;
    }
    .category-badge {
      background: rgba(0,0,0,0.08);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
    }
    
    .category-item.active .category-badge {
      background: rgba(255,255,255,0.2);
    }

    @media (hover: hover) {
      .category-item:hover .category-actions {
        display: flex;
      }
      .category-item.has-actions:hover .category-badge {
        display: none;
      }
    }
    .category-actions:focus-within,
    .category-actions.popup-open {
      display: flex;
    }
    .category-actions:focus-within ~ .category-badge,
    .category-actions.popup-open ~ .category-badge {
      display: none;
    }
    .category-icon {
      pointer-events: none;
      margin-right: 8px;
    }
    .kebab-btn {
      --btn-padding: 8px;
    }
  `]}handleSidebarScroll(e){let t=e.target.scrollTop>0;this.sidebarScrolled!==t&&(this.sidebarScrolled=t)}render(){return s`
      <div class="sidebar-wrapper ${this.sidebarCollapsed&&(!this.isSidebarHovered||this.suppressSidebarHover)?`collapsed`:``}">
        <alps-toolbar class="sidebar-header" ?scrolled=${this.sidebarScrolled}>
          <alps-create-button 
            icon="userPlus" 
            ?collapsed=${this.sidebarCollapsed&&(!this.isSidebarHovered||this.suppressSidebarHover)}
            @click=${()=>this.dispatchEvent(new CustomEvent(`create-contact`))}
          >${this.i18nStore?.t(`contacts.addContact`)}</alps-create-button>
        </alps-toolbar>
        
        <div class="sidebar-content" @scroll=${this.handleSidebarScroll}>
          <div class="sidebar-scroll-content">
            ${[de,v,...this.uniqueCategories.filter(e=>e!==v)].map(e=>{let t=e===`All Contacts`?this.contacts.length:this.contacts.filter(t=>t.categories&&t.categories.includes(e)).length,n=e===`All Contacts`||e===`Favorites`;return s`
                <div class="category-item ${e===`All Contacts`?!this.selectedCategory&&!this.filterQuery?`active`:``:this.selectedCategory===e?`active`:``} ${n?``:`has-actions`}"
                  @click=${()=>this.dispatchEvent(new CustomEvent(`select-category`,{detail:{category:e}}))}
                  draggable=${n?`false`:`true`}
                  @dragstart=${t=>{n||(t.dataTransfer?.setData(`text/plain`,e),this.dispatchEvent(new CustomEvent(`drag-start`,{detail:{category:e}})))}}
                  @dragend=${()=>{n||this.dispatchEvent(new CustomEvent(`drag-end`))}}
                >
                  <alps-icon-btn class="category-icon" icon=${e===`All Contacts`?`users`:e===`Favorites`?`starFourFill`:`folderUser`}></alps-icon-btn>
                  <span class="category-name">${e===`All Contacts`?this.i18nStore?.t(`contacts.allContacts`):e===`Favorites`?this.i18nStore?.t(`contacts.favorites`):e}</span>
                  
                  ${n?``:s`
                    <div class="category-actions ${this.activeKebabMenu===e?`popup-open`:``}" @click=${e=>e.stopPropagation()}>
                      <alps-popup 
                        align="right" 
                        position="bottom"
                        @popup-open=${()=>{this.activeKebabMenu=e}}
                        @popup-close=${()=>{this.activeKebabMenu===e&&(this.activeKebabMenu=null)}}
                      >
                        <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical"></alps-icon-btn>
                        <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.dispatchEvent(new CustomEvent(`rename-category`,{detail:{category:e}}))}}>
                          ${w(`pen`)} <span class="item-text">${this.i18nStore?.t(`contacts.rename`)}</span>
                        </button>
                        <button class="dropdown-item text-danger" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.dispatchEvent(new CustomEvent(`delete-category`,{detail:{category:e}}))}}>
                          ${w(`trash`)} <span class="item-text">${this.i18nStore?.t(`contacts.delete`)}</span>
                        </button>
                      </alps-popup>
                    </div>
                  `}

                  ${t>0||e===`Favorites`?s`<div class="category-badge">${t}</div>`:``}
                </div>
              `})}
          </div>
        </div>
      </div>
    `}};A([f({context:x})],F.prototype,`i18nStore`,void 0),A([i({type:Array})],F.prototype,`contacts`,void 0),A([i({type:Array})],F.prototype,`uniqueCategories`,void 0),A([i({type:String})],F.prototype,`selectedCategory`,void 0),A([i({type:String})],F.prototype,`filterQuery`,void 0),A([i({type:Boolean})],F.prototype,`sidebarCollapsed`,void 0),A([i({type:Boolean})],F.prototype,`isSidebarHovered`,void 0),A([i({type:Boolean})],F.prototype,`suppressSidebarHover`,void 0),A([i({type:Boolean})],F.prototype,`isMobile`,void 0),A([_()],F.prototype,`activeKebabMenu`,void 0),A([_()],F.prototype,`sidebarScrolled`,void 0),F=A([a(`alps-contacts-categories`)],F);var I=new class extends EventTarget{async createMailbox(e){try{let t=new URLSearchParams;t.append(`name`,e);let n=await T(`/mailboxes`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:t.toString()});return n.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):n.ok?(E.sync(),!0):!1}catch(e){return y.error(`Failed to create mailbox`,e),!1}}async renameMailbox(e,t){try{let n=await T(`/mailboxes/${encodeURIComponent(e)}/rename`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({new_name:t})});return n.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):n.ok?(E.sync(),!0):!1}catch(e){return y.error(`Failed to rename mailbox`,e),!1}}async deleteMailbox(e){try{let t=await T(`/mailboxes/${encodeURIComponent(e)}`,{method:`DELETE`});return t.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):t.ok?(E.sync(),!0):!1}catch(e){return y.error(`Failed to delete mailbox`,e),!1}}async emptyMailbox(e){try{let t=await T(`/mailboxes/${encodeURIComponent(e)}/empty`,{method:`POST`});return t.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):t.ok?(E.sync(),!0):!1}catch(e){return y.error(`Failed to empty mailbox`,e),!1}}async subscribeMailbox(e){try{let t=await T(`/mailboxes/${encodeURIComponent(e)}/subscribe`,{method:`PUT`});return t.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):t.ok?(E.sync(),!0):!1}catch(e){return y.error(`Failed to subscribe mailbox`,e),!1}}async unsubscribeMailbox(e){try{let t=await T(`/mailboxes/${encodeURIComponent(e)}/unsubscribe`,{method:`PUT`});return t.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):t.ok?(E.sync(),!0):!1}catch(e){return y.error(`Failed to unsubscribe mailbox`,e),!1}}},ot=class extends p{constructor(...e){super(...e),this.currentPage=0,this.totalItems=0,this.itemsPerPage=50,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=o`
    :host {
      display: block;
    }

    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-color);
      font-size: 13px;
      color: var(--text-muted);
      flex-shrink: 0;
      gap: 12px;
    }

    .pagination-controls {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .pagination-text {
      white-space: nowrap;
      overflow: hidden;
      min-width: 0;
    }


  `}changePage(e){let t=this.currentPage+e;t>=0&&t<Math.ceil(this.totalItems/this.itemsPerPage)&&this.dispatchEvent(new CustomEvent(`change-page`,{detail:{page:t},bubbles:!0,composed:!0}))}render(){let e=this.currentPage*this.itemsPerPage+1,t=Math.min((this.currentPage+1)*this.itemsPerPage,this.totalItems);return s`
      <div class="pagination-container">
        <div class="pagination-text" title="${this.totalItems>0?`${e} - ${t} ${this.i18nStore?.t(`pagination.of`)} ${this.totalItems}`:this.i18nStore?.t(`pagination.zeroMessages`)}">
          ${this.totalItems>0?s`${e} - ${t} ${this.i18nStore?.t(`pagination.of`)} ${this.totalItems}`:this.i18nStore?.t(`pagination.zeroMessages`)}
        </div>
        <div class="pagination-controls">
          <alps-icon-btn 
            title=${this.i18nStore?.t(`pagination.previousPage`)} 
            ?disabled=${this.currentPage===0} 
            @click=${()=>this.changePage(-1)}
            icon="caretLeft"
            style="--icon-size: 16px;"
          ></alps-icon-btn>
          <alps-icon-btn 
            title=${this.i18nStore?.t(`pagination.nextPage`)} 
            ?disabled=${(this.currentPage+1)*this.itemsPerPage>=this.totalItems||this.totalItems===0} 
            @click=${()=>this.changePage(1)}
            icon="caretRight"
            style="--icon-size: 16px;"
          ></alps-icon-btn>
        </div>
      </div>
    `}};A([i({type:Number})],ot.prototype,`currentPage`,void 0),A([i({type:Number})],ot.prototype,`totalItems`,void 0),A([i({type:Number})],ot.prototype,`itemsPerPage`,void 0),A([f({context:x})],ot.prototype,`i18nStore`,void 0),ot=A([a(`alps-pagination`)],ot);var st=class extends p{constructor(...e){super(...e),this.scrolled=!1}static{this.styles=o`
    :host {
      display: flex;
      align-items: center;
      height: 57px;
      box-sizing: border-box;
      flex-shrink: 0;
      border-bottom: 1px solid var(--border-color);
      transition: box-shadow 0.2s ease;
      position: relative;
      overflow: visible;
    }

    :host([scrolled]) {
      box-shadow: rgba(95, 95, 95, 0.1) 0 4px 4px -2px;
    }
  `}render(){return s`<slot></slot>`}};A([i({type:Boolean,reflect:!0})],st.prototype,`scrolled`,void 0),st=A([a(`alps-toolbar`)],st);var ct=class extends p{constructor(...e){super(...e),this.variant=`info`}static{this.styles=o`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .banner {
      padding: 6px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      border-bottom: 1px solid var(--border-color);
      background: var(--surface, #ffffff);
      color: var(--text-primary, #111827);
      box-shadow: rgba(95, 95, 95, 0.1) 0 4px 4px -2px;
    }

    .content {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
    }

    .actions {
      margin-left: 16px;
      flex-shrink: 0;
      display: flex;
      gap: 8px;
    }

    ::slotted(alps-button) {
      --btn-padding: 4px 10px;
      --btn-font-size: 12px;
    }
  `}render(){return s`
      <div class="banner ${this.variant}">
        <div class="content">
          <slot></slot>
        </div>
        <div class="actions">
          <slot name="action"></slot>
        </div>
      </div>
    `}};A([i({type:String,reflect:!0})],ct.prototype,`variant`,void 0),ct=A([a(`alps-banner`)],ct);var L=class extends p{constructor(...e){super(...e),this.title=`Confirm`,this.message=`Are you sure?`,this.confirmText=`Confirm`,this.cancelText=`Cancel`,this.isDanger=!1,this.dismissible=!1}static{this.styles=[et]}_handleCancel(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}_handleSecondary(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`secondary`,{bubbles:!0,composed:!0}))}_handleConfirm(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`confirm`,{bubbles:!0,composed:!0}))}render(){return s`
      <ui-modal 
        .title=${this.title}
        .isDanger=${this.isDanger}
        .dismissible=${this.dismissible}
        @cancel=${this._handleCancel}
      >
        <slot>${this.message}</slot>
        <alps-button slot="actions" variant="text" @click=${this._handleCancel}>${this.cancelText}</alps-button>
        ${this.secondaryText?s`<alps-button slot="actions" variant="text" @click=${this._handleSecondary}>${this.secondaryText}</alps-button>`:``}
        <alps-button slot="actions" variant=${this.isDanger?`danger`:`normal`} @click=${this._handleConfirm}>
          ${this.confirmText}
        </alps-button>
      </ui-modal>
    `}};A([i({type:String})],L.prototype,`title`,void 0),A([i({type:String})],L.prototype,`message`,void 0),A([i({type:String})],L.prototype,`confirmText`,void 0),A([i({type:String})],L.prototype,`cancelText`,void 0),A([i({type:String})],L.prototype,`secondaryText`,void 0),A([i({type:Boolean})],L.prototype,`isDanger`,void 0),A([i({type:Boolean})],L.prototype,`dismissible`,void 0),L=A([a(`ui-confirm`)],L);var R=class extends p{constructor(...e){super(...e),this.messages=[],this.currentMailbox=``,this.loading=!1,this.selectedMessage=null,this.layoutMode=`vertical`,this.isMobile=!1,this.sidebarCollapsed=!1,this.currentPage=0,this.totalMessages=0,this.messagesPerPage=50,this.filterQuery=``,this.sortOrder=`desc`,this.densityMode=`compact`,this.selectedMessages=new Set,this.syncing=!1,this.isSpinning=!1,this.isScrolled=!1,this.isAtBottom=!1,this.focusedIndex=-1,this.showEmptyConfirm=!1,this._handleStoreChange=()=>{this.requestUpdate()},this.handleSyncStart=()=>{this.syncing=!0,this.isSpinning=!0},this.handleSyncEnd=()=>{this.syncing=!1},this.handleSpinIteration=()=>{this.syncing||(this.isSpinning=!1)},this.handleScroll=e=>{this.checkScrollState(e.target)}}static{this.styles=o`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .list-header {
      padding: 0 12px;
      gap: 12px;
      background: var(--bg-primary, #fff);
      overflow: hidden;
    }

    .select-all-checkbox {
      cursor: pointer;
    }
    
    .current-mailbox-label {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-color);
      margin-left: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .list-content {
      flex: 1;
      overflow-y: auto;
      margin-bottom: -1px;
      position: relative;
      z-index: 1;
    }

    .message-item {
      padding: 12px;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: background 0.15s, padding 0.2s, gap 0.2s;
    }

    /* Density: Loose */
    :host(.density-loose) .message-item {
      padding: 16px 12px 16px 0;
      gap: 16px;
    }
    :host(.density-loose) .message-preview {
      -webkit-line-clamp: 3;
    }
    :host(.density-loose) .checkbox-col {
      margin-top: -16px;
      margin-bottom: -16px;
    }

    /* Density: Compact */
    :host(.density-compact) .message-item {
      padding: 8px 12px 8px 0;
      gap: 12px;
    }
    :host(.density-compact) .message-header-row {
      margin-bottom: 2px;
    }
    :host(.density-compact) .message-subject {
      font-size: 13px;
      margin-bottom: 2px;
    }
    :host(.density-compact) .message-preview {
      font-size: 12px;
      -webkit-line-clamp: 1;
    }
    :host(.density-compact) .checkbox-col {
      margin-top: -8px;
      margin-bottom: -8px;
    }

    /* Density: Ultra-compact */
    :host(.density-ultra-compact) .message-item {
      padding: 4px 12px 4px 0;
      gap: 12px;
    }
    :host(.density-ultra-compact) .message-subject {
      font-size: 13px;
      flex: 1;
      margin: 0;
    }
    :host(.density-ultra-compact) .message-sender {
      width: 120px;
      flex-shrink: 1;
      min-width: 80px;
    }
    :host(.density-ultra-compact) .checkbox-col {
      margin-top: -4px;
      margin-bottom: -4px;
    }

    @media (max-width: 768px) {
      :host(.density-ultra-compact) .message-sender {
        width: 80px;
        min-width: 60px;
      }
      :host(.density-ultra-compact) .message-item,
      :host(.density-compact) .message-item {
        padding: 12px;
      }
      :host(.density-loose) .message-item {
        padding: 16px 12px;
      }
    }

    .message-item:hover {
      background: var(--hover-color);
    }

    .message-item.unread {
      background: var(--bg-unread, rgba(234, 179, 8, 0.08));
    }

    .message-item.unread:hover {
      background: var(--bg-unread-hover, rgba(234, 179, 8, 0.12));
    }

    .message-item.starred .message-sender,
    .message-item.starred .message-subject {
      color: var(--accent-color);
      font-weight: 600;
    }

    .message-item.active {
      background: var(--bg-selected);
    }

    .message-item.active.unread {
      background: var(--bg-selected);
    }

    .message-item.active .message-preview,
    .message-item.active .message-date {
      color: var(--text-muted);
    }

    .list-content:focus {
      outline: none;
    }

    .list-content:focus-within .message-item.focused {
      outline: 1px solid var(--accent-color);
      outline-offset: -1px;
      z-index: 2;
      position: relative;
    }

    .message-item.unread .message-sender {
      font-weight: 700;
    }

    .message-item.unread .message-subject {
      font-weight: 700;
      color: var(--text-color);
    }

    .message-item.active.unread .message-subject {
      color: var(--text-color);
    }

    .message-details {
      flex: 1;
      min-width: 0;
    }

    .message-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .message-sender {
      font-weight: 450;
      color: var(--text-sender-read, #202020);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .message-date {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      margin-left: 8px;
      text-align: right;
      flex-shrink: 0;
    }

    .message-size {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      margin-left: 8px;
      text-align: right;
      flex-shrink: 0;
    }

    .avatar-stack {
      display: flex;
      align-items: center;
      position: relative;
      flex-shrink: 0;
    }
    
    .avatar-wrapper {
      position: relative;
      border: 2px solid var(--bg-primary, #fff);
      border-radius: 50%;
      background: var(--bg-primary, #fff);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.15s, background-color 0.15s;
    }

    .message-item.active .avatar-wrapper {
      border-color: var(--bg-selected);
      background: var(--bg-selected);
    }
    
    .message-item.active.unread .avatar-wrapper {
      border-color: var(--bg-selected);
      background: var(--bg-selected);
    }

    .message-item.unread .avatar-wrapper {
      border-color: var(--bg-unread, rgba(234, 179, 8, 0.08));
      background: var(--bg-unread, rgba(234, 179, 8, 0.08));
    }

    .message-item:hover .avatar-wrapper {
      border-color: var(--hover-color);
      background: var(--hover-color);
    }

    .avatar-wrapper:not(:first-child) {
      margin-left: -8px;
    }

    .extra-count {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 500;
      background: var(--bg-secondary, #f3f4f6) !important;
      border-radius: 50%;
    }

    .attachment-col {
      width: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
    }

    .message-subject {
      font-size: 14px;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .message-preview {
      font-size: 13px;
      color: var(--text-muted);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted);
    }

    .spacer {
      flex: 1;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 12px;
      color: var(--text-muted);
    }

    .header-divider {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 4px;
    }

    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    
    .spinner {
      animation: spin 3s linear infinite;
      display: flex;
      margin-right: 8px;
    }
    
    .spinner .icon {
      width: 32px;
      height: 32px;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }



    .message-checkbox, .select-all-checkbox {
      cursor: pointer;
      opacity: 0.4;
      transition: opacity 0.2s;
    }

    .checkbox-col {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-left: 12px;
      padding-right: 6px;
      align-self: stretch;
      cursor: pointer;
    }

    .message-item:hover .message-checkbox,
    .message-checkbox:checked,
    .select-all-checkbox:hover,
    .select-all-checkbox:checked {
      opacity: 1;
    }

    .star-btn {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      opacity: 0.3;
      color: var(--text-muted);
    }
    .star-btn:hover,    
    .star-btn.starred {
      opacity: 1;
    }
    .star-btn.starred {
      color: var(--accent-color);
    }
    .star-btn:hover {
      transform: scale(1.1);
    }
    
    .indicator-icon {
      display: flex;
      color: var(--text-muted);
    }
    .indicator-icon svg {
      width: 18px;
      height: 18px;
    }

    .message-indicators {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .star-btn-wrapper-ultra {
      margin-right: 8px;
    }

    .indicators-wrapper-ultra {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-right: 4px;
    }

    .message-header-inner {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
      margin-right: 12px;
    }

    .message-header-inner .star-btn {
      flex-shrink: 0;
    }

    .message-subject-row {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      overflow: hidden;
    }

    .message-subject-row .message-subject {
      margin-bottom: 0;
      flex: 1;
    }

    .indicators-wrapper {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-right: 6px;
      flex-shrink: 0;
    }

    .mobile-bottom-header {
      height: 57px;
      box-sizing: border-box;
      padding: 0 12px;
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-primary);
      flex-shrink: 0;
      position: relative;
      z-index: 10;
      box-shadow: rgba(95, 95, 95, 0.1) 0 -4px 4px -2px;
      transition: box-shadow 0.2s ease;
    }

    .mobile-bottom-header.at-bottom {
      box-shadow: none;
    }

    .mobile-bottom-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .loading-overlay {
      opacity: 0.5;
      pointer-events: none;
      transition: opacity 0.2s ease-in-out;
    }
  `}handleSelectAll(e){if(e.target.checked){let e=this.messages.map(e=>String(e.UID));this.selectedMessages=new Set(e)}else this.selectedMessages=new Set;this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}}))}handleSelectMessage(e,t){e.stopPropagation();let n=e.target.checked,r=new Set(this.selectedMessages);n?r.add(t):r.delete(t),this.selectedMessages=r,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}}))}connectedCallback(){super.connectedCallback(),E.addEventListener(`sync-start`,this.handleSyncStart),E.addEventListener(`sync-success`,this.handleSyncEnd),E.addEventListener(`sync-error`,this.handleSyncEnd),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),E.removeEventListener(`sync-start`,this.handleSyncStart),E.removeEventListener(`sync-success`,this.handleSyncEnd),E.removeEventListener(`sync-error`,this.handleSyncEnd),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}willUpdate(e){if(super.willUpdate(e),(e.has(`currentMailbox`)||e.has(`currentPage`)||e.has(`filterQuery`)||e.has(`sortOrder`))&&this.selectedMessages.size>0&&(this.selectedMessages=new Set,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}}))),e.has(`selectedMessage`)||e.has(`messages`)){if(e.has(`messages`)&&this.messages&&this.selectedMessages.size>0){let e=new Set(this.messages.map(e=>String(e.UID))),t=!1,n=new Set;for(let r of this.selectedMessages)e.has(r)?n.add(r):t=!0;t&&(this.selectedMessages=n,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}})))}if(this.selectedMessage&&this.messages.length>0){let e=this.messages.findIndex(e=>String(e.UID)===String(this.selectedMessage.UID));e!==-1&&(this.focusedIndex=e)}}}checkScrollState(e){if(!e)return;let t=e.scrollTop>0;this.isScrolled!==t&&(this.isScrolled=t,this.dispatchEvent(new CustomEvent(`list-scrolled`,{detail:{scrolled:t}})));let n=e.scrollHeight<=e.clientHeight||Math.ceil(e.scrollTop+e.clientHeight)>=e.scrollHeight;this.isAtBottom!==n&&(this.isAtBottom=n)}updated(e){if(super.updated(e),e.has(`densityMode`)&&(this.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),this.classList.add(`density-${this.densityMode}`)),e.has(`syncing`)&&this.syncing&&(this.isSpinning=!0),e.has(`currentPage`)||e.has(`currentMailbox`)){let e=this.renderRoot.querySelector(`.list-content`);e&&(e.scrollTop=0)}let t=this.renderRoot.querySelector(`.list-content`);t&&requestAnimationFrame(()=>{this.checkScrollState(t)})}selectMessage(e){this.selectedMessages.size>0&&(this.selectedMessages=new Set,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}}))),this.dispatchEvent(new CustomEvent(`select-message`,{detail:{message:e}}))}handleKeyDown(e){if(!(!this.messages||this.messages.length===0)){if(e.key===`ArrowDown`)e.preventDefault(),this.focusedIndex=Math.min(this.messages.length-1,this.focusedIndex+1),this.scrollToFocused();else if(e.key===`ArrowUp`)e.preventDefault(),this.focusedIndex=Math.max(0,this.focusedIndex-1),this.scrollToFocused();else if(e.key===`Enter`)e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<this.messages.length&&this.selectMessage(this.messages[this.focusedIndex]);else if(e.key===` `&&(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<this.messages.length)){let e=String(this.messages[this.focusedIndex].UID),t=new Set(this.selectedMessages);t.has(e)?t.delete(e):t.add(e),this.selectedMessages=t,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}})),this.focusedIndex=Math.min(this.messages.length-1,this.focusedIndex+1),this.scrollToFocused()}}}async handleEmptyMailbox(){this.showEmptyConfirm=!1,this.dispatchEvent(new CustomEvent(`toast`,{detail:{type:`info`,message:this.i18nStore?.t(`messageList.emptyingMailbox`)||`Emptying mailbox...`},bubbles:!0,composed:!0})),await I.emptyMailbox(this.currentMailbox)?this.dispatchEvent(new CustomEvent(`toast`,{detail:{type:`success`,message:this.i18nStore?.t(`messageList.mailboxEmptied`)||`Mailbox emptied successfully.`},bubbles:!0,composed:!0})):this.dispatchEvent(new CustomEvent(`toast`,{detail:{type:`error`,message:this.i18nStore?.t(`messageList.emptyMailboxFailed`)||`Failed to empty mailbox. Make sure it is Trash or Junk.`},bubbles:!0,composed:!0}))}scrollToFocused(){this.updateComplete.then(()=>{let e=this.renderRoot.querySelector(`.message-item.focused`);e&&e.scrollIntoView({block:`nearest`})})}toggleStar(e,t){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-star-message`,{detail:{message:t}}))}render(){let e=this.densityMode===`loose`?48:this.densityMode===`compact`?24:40;return s`
      ${this.isMobile?``:s`
        <alps-toolbar class="list-header" ?scrolled=${this.isScrolled}>
          <input type="checkbox" class="select-all-checkbox" title=${this.i18nStore?.t(`messageList.selectAll`)}
            .checked=${this.messages.length>0&&this.selectedMessages.size===this.messages.length}
            @change=${this.handleSelectAll}>
          <alps-icon-btn 
            title=${this.i18nStore?.t(`messageList.checkNew`)}
            @click=${()=>this.dispatchEvent(new CustomEvent(`refresh`))}
            @animationiteration=${this.handleSpinIteration}
            ?spinning=${this.isSpinning}
            icon="arrowsClockwise"
          ></alps-icon-btn>
          <div class="header-divider"></div>
          <alps-icon-btn 
            title=${this.sortOrder===`asc`?this.i18nStore?.t(`messageList.sortDesc`):this.i18nStore?.t(`messageList.sortAsc`)}
            @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-sort`))} 
            icon=${this.sortOrder===`asc`?`sortAscending`:`sortDescending`}
          ></alps-icon-btn>
          <alps-icon-btn 
            @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-filter-starred`))} 
            title=${this.i18nStore?.t(`messageList.filterStarred`)}
            icon=${this.filterQuery===`is:starred`?`starFourFill`:`starFour`}
            ?active=${this.filterQuery===`is:starred`}
          ></alps-icon-btn>
          <alps-icon-btn 
            @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-filter-unread`))} 
            title=${this.i18nStore?.t(`messageList.filterUnread`)}
            icon="envelopeUnread"
            ?active=${this.filterQuery===`is:unread`}
          ></alps-icon-btn>
          <div class="spacer"></div>
          ${this.sidebarCollapsed?s`
            <div class="current-mailbox-label">
              ${Ie(this.currentMailbox,this.i18nStore)}
            </div>
            <div class="spacer"></div>
          `:``}
          <alps-pagination 
            .currentPage=${this.currentPage} 
            .totalItems=${this.totalMessages} 
            .itemsPerPage=${this.messagesPerPage}>
          </alps-pagination>
        </alps-toolbar>
      `}
      <div class="list-content ${this.loading&&this.messages.length>0?`loading-overlay`:``}" tabindex="0" @scroll=${this.handleScroll} @keydown=${this.handleKeyDown}>
        ${this.filterQuery?s`
          <alps-banner>
            <span>${this.i18nStore?.t(`messageList.searchResultsFor`)} <strong>${this.filterQuery}</strong></span>
            <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`clear-search`))}>
              ${this.i18nStore?.t(`messageList.clearSearch`)}
            </alps-button>
          </alps-banner>
        `:``}
        ${!this.filterQuery&&/^(trash|junk|spam|deleted items)$/i.test(this.currentMailbox)&&this.totalMessages>0?s`
          <alps-banner variant="warning">
            <span>${this.i18nStore?.t(`messageList.totalMessagesIn`)?.replace(`{count}`,String(this.totalMessages)).replace(`{folder}`,this.currentMailbox)||`${this.totalMessages} total messages in ${this.currentMailbox}`}</span>
            <alps-button slot="action" variant="normal" ?disabled=${this.selectedMessages.size>0} @click=${()=>this.showEmptyConfirm=!0}>
              ${this.i18nStore?.t(`messageList.deleteAllNow`)||`Delete All Now`}
            </alps-button>
          </alps-banner>
        `:``}
        ${this.loading&&this.messages.length===0?s`
          <alps-loader full-height .text=${this.i18nStore?.t(`messageList.loading`)||`Loading...`}></alps-loader>
        `:this.messages.length===0?s`<div class="empty-state">${this.i18nStore?.t(`messageList.noMessages`)}</div>`:c(this.messages,e=>e.UID,t=>{let n=this.currentMailbox===`Drafts`||this.currentMailbox===`Sent`,r=[];n?(r=[...t.Envelope?.To||[],...t.Envelope?.Cc||[]],r.length||(r=t.Envelope?.From||[])):r=[...t.Envelope?.From||[],...t.Envelope?.To||[],...t.Envelope?.Cc||[]];let i=new Set,a=[];for(let e of r){let t=(e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``)||e.Name||`unknown`;t!==`unknown`&&!i.has(t)?(i.add(t),a.push(e)):t===`unknown`&&a.push(e)}let o=this.settingsStore?.getState()?.loginUsername?.toLowerCase()||``,c=e=>{let t=e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``;return!!(o&&t===o)};if(a.length>1){let e=a.filter(e=>!c(e));e.length>0&&(a=e)}a.length||(a=[{}]);let l=n?`messageList.noRecipient`:`messageList.unknownSender`,u=a.map(e=>{let t=e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`:``;return e.Name||t||this.i18nStore?.t(l)||this.i18nStore?.t(`messageList.unknown`)}).join(`, `),d=a.slice(0,3),f=a.length-3,p=d.length+ +(f>0),m=t.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`),h=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,g=String(this.settingsStore?.getState()?.hourFormat||`12`),_=t.Envelope?.Date?Pe(t.Envelope.Date,h,g):``,ee=t.RFC822Size||t.Size,te=ee?Le(ee):``,ne=!t.Flags||!t.Flags.includes(`\\Seen`),re=t.Flags&&t.Flags.includes(`\\Flagged`),ie=t.Flags&&t.Flags.includes(`\\Answered`),ae=t.Flags&&t.Flags.includes(`$Forwarded`);return this.densityMode===`ultra-compact`?s`
              <div class="message-item ${this.selectedMessages.size===0&&this.selectedMessage?.UID===t.UID||this.selectedMessages.has(String(t.UID))?`active`:``} ${ne?`unread`:``} ${re?`starred`:``} ${this.focusedIndex===this.messages.indexOf(t)?`focused`:``}" @click=${()=>this.selectMessage(t)}>
                ${this.isMobile?``:s`
                  <div class="checkbox-col" @click=${e=>{e.stopPropagation();let n=String(t.UID),r=new Set(this.selectedMessages);r.has(n)?r.delete(n):r.add(n),this.selectedMessages=r,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}}))}}>
                    <input type="checkbox" class="message-checkbox" 
                      .checked=${this.selectedMessages.has(String(t.UID))}
                      @click=${e=>e.stopPropagation()}
                      @change=${e=>this.handleSelectMessage(e,String(t.UID))}>
                  </div>
                `}
                <div class="message-sender">${u}</div>
                <div @click=${e=>this.toggleStar(e,t)} class="star-btn ${re?`starred`:``} star-btn-wrapper-ultra">
                  ${w(re?`starFourFill`:`starFour`)}
                </div>
                ${ie||ae?s`
                  <div class="indicators-wrapper-ultra">
                    ${ie?s`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.replied`)}>${w(`arrowBendUpLeft`)}</div>`:``}
                    ${ae?s`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.forwarded`)}>${w(`arrowBendUpRight`)}</div>`:``}
                  </div>
                `:``}
                <div class="message-subject">${m}</div>
                <div class="message-indicators">
                  <div class="attachment-col">
                    ${t.HasAttachments?s`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.hasAttachments`)}>${w(`paperclipHorizontal`)}</div>`:``}
                  </div>
                  <div class="message-date">${_}</div>
                </div>
              </div>
              `:s`
            <div class="message-item ${this.selectedMessages.size===0&&this.selectedMessage?.UID===t.UID||this.selectedMessages.has(String(t.UID))?`active`:``} ${ne?`unread`:``} ${re?`starred`:``} ${this.focusedIndex===this.messages.indexOf(t)?`focused`:``}" @click=${()=>this.selectMessage(t)}>
              ${this.isMobile?``:s`
                <div class="checkbox-col" @click=${e=>{e.stopPropagation();let n=String(t.UID),r=new Set(this.selectedMessages);r.has(n)?r.delete(n):r.add(n),this.selectedMessages=r,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}}))}}>
                  <input type="checkbox" class="message-checkbox" 
                    .checked=${this.selectedMessages.has(String(t.UID))}
                    @click=${e=>e.stopPropagation()}
                    @change=${e=>this.handleSelectMessage(e,String(t.UID))}>
                </div>
              `}
              <div class="avatar-stack">
                ${d.map((t,n)=>{let r=t.Mailbox&&t.Host?`${t.Mailbox}@${t.Host}`:``,i=t.Name||r||this.i18nStore?.t(l)||this.i18nStore?.t(`messageList.unknown`),a=t.Host?t.Host.toLowerCase():``,o=a&&!new Set([`gmail.com`,`yahoo.com`,`hotmail.com`,`outlook.com`,`icloud.com`,`me.com`,`mac.com`,`aol.com`,`proton.me`,`protonmail.com`,`live.com`,`msn.com`,`pm.me`,`yandex.ru`,`mail.ru`,`gmx.de`,`web.de`,`t-online.de`,`orange.fr`,`free.fr`]).has(a)?`/bimi/avatar?domain=${encodeURIComponent(a)}`:``;return s`
                    <div class="avatar-wrapper" style="z-index: ${p-n};">
                      <alps-avatar .name=${i} .email=${r} .size=${e} .src=${o}></alps-avatar>
                    </div>
                  `})}
                ${f>0?s`
                  <div class="avatar-wrapper extra-count" style="width: ${e}px; height: ${e}px; z-index: 0;">
                    +${f}
                  </div>
                `:``}
              </div>
              <div class="message-details">
                <div class="message-header-row">
                  <div class="message-header-inner">
                    <div class="message-sender">${u}</div>
                    <div @click=${e=>this.toggleStar(e,t)} class="star-btn ${re?`starred`:``}">
                      ${w(re?`starFourFill`:`starFour`)}
                    </div>
                  </div>
                  <div class="message-indicators">
                    <div class="attachment-col">
                      ${t.HasAttachments?s`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.hasAttachments`)}>${w(`paperclipHorizontal`)}</div>`:``}
                    </div>
                    <div class="message-date">${_}</div>
                  </div>
                </div>
                <div class="message-subject-row">
                  ${ie||ae?s`
                    <div class="indicators-wrapper">
                      ${ie?s`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.replied`)}>${w(`arrowBendUpLeft`)}</div>`:``}
                      ${ae?s`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.forwarded`)}>${w(`arrowBendUpRight`)}</div>`:``}
                    </div>
                  `:``}
                  <div class="message-subject">${m}</div>
                  ${te?s`<div class="message-size">${te}</div>`:``}
                </div>
              </div>
            </div>
          `})}
      </div>
      ${this.isMobile&&this.messages.length>0?s`
        <div class="mobile-bottom-header ${this.isAtBottom?`at-bottom`:``}">
          <div class="mobile-bottom-actions">
            <alps-icon-btn 
              title=${this.i18nStore?.t(`messageList.checkNew`)}
              @click=${()=>this.dispatchEvent(new CustomEvent(`refresh`))}
              @animationiteration=${this.handleSpinIteration}
              ?spinning=${this.isSpinning}
              icon="arrowsClockwise"
            ></alps-icon-btn>
            <div class="header-divider"></div>
            <alps-icon-btn 
              title=${this.sortOrder===`asc`?this.i18nStore?.t(`messageList.sortDesc`):this.i18nStore?.t(`messageList.sortAsc`)}
              @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-sort`))} 
              icon=${this.sortOrder===`asc`?`sortAscending`:`sortDescending`}
            ></alps-icon-btn>
            <alps-icon-btn 
              @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-filter-starred`))} 
              title=${this.i18nStore?.t(`messageList.filterStarred`)}
              icon=${this.filterQuery===`is:starred`?`starFourFill`:`starFour`}
              ?active=${this.filterQuery===`is:starred`}
            ></alps-icon-btn>
            <alps-icon-btn 
              @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-filter-unread`))} 
              title=${this.i18nStore?.t(`messageList.filterUnread`)}
              icon="envelopeUnread"
              ?active=${this.filterQuery===`is:unread`}
            ></alps-icon-btn>
          </div>
          <alps-toast></alps-toast>
          ${this.showEmptyConfirm?s`
            <ui-confirm
              title=${this.i18nStore?.t(`messageList.emptyMailboxTitle`)?.replace(`{folder}`,this.currentMailbox)||`Empty ${this.currentMailbox}`}
              message=${this.i18nStore?.t(`messageList.emptyMailboxConfirm`)?.replace(`{folder}`,this.currentMailbox).replace(`{count}`,String(this.totalMessages))||`Are you sure you want to permanently delete all ${this.totalMessages} messages in ${this.currentMailbox}? This action cannot be undone.`}
              confirmText=${this.i18nStore?.t(`messageList.deleteAllNow`)||`Delete All Now`}
              confirmVariant="danger"
              @confirm=${this.handleEmptyMailbox}
              @cancel=${()=>this.showEmptyConfirm=!1}
            ></ui-confirm>
          `:``}
          <div class="spacer"></div>
          <alps-pagination 
            .currentPage=${this.currentPage} 
            .totalItems=${this.totalMessages} 
            .itemsPerPage=${this.messagesPerPage}>
          </alps-pagination>
        </div>
      `:``}
    `}};A([f({context:S})],R.prototype,`settingsStore`,void 0),A([f({context:x})],R.prototype,`i18nStore`,void 0),A([i({type:Array})],R.prototype,`messages`,void 0),A([i({type:String})],R.prototype,`currentMailbox`,void 0),A([i({type:Boolean})],R.prototype,`loading`,void 0),A([i({type:Object})],R.prototype,`selectedMessage`,void 0),A([i({type:String})],R.prototype,`layoutMode`,void 0),A([i({type:Boolean})],R.prototype,`isMobile`,void 0),A([i({type:Boolean})],R.prototype,`sidebarCollapsed`,void 0),A([i({type:Number})],R.prototype,`currentPage`,void 0),A([i({type:Number})],R.prototype,`totalMessages`,void 0),A([i({type:Number})],R.prototype,`messagesPerPage`,void 0),A([i({type:String})],R.prototype,`filterQuery`,void 0),A([i({type:String})],R.prototype,`sortOrder`,void 0),A([i({type:String})],R.prototype,`densityMode`,void 0),A([i({type:Object})],R.prototype,`selectedMessages`,void 0),A([i({type:Boolean})],R.prototype,`syncing`,void 0),A([_()],R.prototype,`isSpinning`,void 0),A([_()],R.prototype,`isScrolled`,void 0),A([_()],R.prototype,`isAtBottom`,void 0),A([_()],R.prototype,`focusedIndex`,void 0),A([_()],R.prototype,`showEmptyConfirm`,void 0),R=A([a(`alps-message-list`)],R);var z=class extends p{constructor(...e){super(...e),this.contacts=[],this.selectedCategory=``,this.filterQuery=``,this.sortOrder=`asc`,this.showOnlyStarred=!1,this.isMobile=!1,this.densityMode=`compact`,this.selectedContacts=new Set,this.selectedContact=null,this.isSpinning=!1,this.loading=!1,this.listScrolled=!1}updated(e){super.updated(e),e.has(`densityMode`)&&(this.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),this.classList.add(`density-${this.densityMode}`))}static{this.styles=[R.styles,o`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      height: 100%;
    }
    .list-header {
      padding: 0 12px;
      gap: 12px;
      background: var(--bg-primary, #fff);
      z-index: 10;
      min-height: 48px;
    }
    .header-divider {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 4px;
    }
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted, #9ca3af);
    }
    .contact-item {
      padding: 12px;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: background 0.15s, padding 0.2s, gap 0.2s;
    }
    :host(.density-loose) .contact-item {
      padding: 16px 12px 16px 0;
      gap: 16px;
    }
    :host(.density-compact) .contact-item {
      padding: 8px 12px 8px 0;
      gap: 12px;
    }
    :host(.density-ultra-compact) .contact-item {
      padding: 4px 12px 4px 0;
      gap: 12px;
    }
    @media (max-width: 768px) {
      :host(.density-ultra-compact) .contact-item,
      :host(.density-compact) .contact-item {
        padding: 12px;
      }
      :host(.density-loose) .contact-item {
        padding: 16px 12px;
      }
    }
    .contact-item:hover {
      background: var(--hover-color);
    }
    .contact-item.active {
      background: var(--bg-selected);
    }
    .contact-item.starred .contact-sender,
    .contact-item.starred .contact-subject {
      color: var(--accent-color);
      font-weight: 600;
    }
    .contact-item.active .avatar-wrapper {
      border-color: var(--bg-selected);
      background: var(--bg-selected);
    }
    .contact-item:hover .avatar-wrapper {
      border-color: var(--hover-color);
      background: var(--hover-color);
    }
    .contact-checkbox {
      cursor: pointer;
      opacity: 0.4;
      transition: opacity 0.2s;
    }
    .contact-item:hover .contact-checkbox,
    .contact-checkbox:checked {
      opacity: 1;
    }
    .contact-details {
      flex: 1;
      min-width: 0;
    }
    .contact-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    :host(.density-compact) .contact-header-row {
      margin-bottom: 2px;
    }
    .contact-header-inner {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
      margin-right: 12px;
    }
    .contact-sender {
      font-weight: 450;
      color: var(--text-sender-read, #202020);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    :host(.density-ultra-compact) .contact-sender {
      width: 120px;
      flex-shrink: 1;
      min-width: 80px;
    }
    @media (max-width: 768px) {
      :host(.density-ultra-compact) .contact-sender {
        width: 80px;
        min-width: 60px;
      }
    }
    .contact-date {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      margin-left: 8px;
      text-align: right;
      flex-shrink: 0;
    }
    .contact-item.active .contact-date {
      color: var(--text-muted);
    }
    .contact-subject-row {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      overflow: hidden;
    }
    .contact-subject {
      font-size: 14px;
      margin-bottom: 0;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    :host(.density-compact) .contact-subject {
      font-size: 13px;
      margin-bottom: 2px;
    }
    :host(.density-ultra-compact) .contact-subject {
      font-size: 13px;
      flex: 1;
      margin: 0;
    }
  `]}formatRevision(e){if(!e)return``;let t=e;t.length===16&&t.indexOf(`-`)===-1&&(t=`${t.slice(0,4)}-${t.slice(4,6)}-${t.slice(6,8)}T${t.slice(9,11)}:${t.slice(11,13)}:${t.slice(13,16)}`);let n=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,r=String(this.settingsStore?.getState()?.hourFormat||`12`);return Pe(new Date(t),n,r)}handleListScroll(e){let t=e.target.scrollTop>0;this.listScrolled!==t&&(this.listScrolled=t,this.dispatchEvent(new CustomEvent(`list-scrolled`,{detail:{scrolled:t}})))}render(){return s`
      ${this.isMobile?``:s`
        <alps-toolbar class="list-header" ?scrolled=${this.listScrolled}>
          <input type="checkbox" class="select-all-checkbox" title=${this.i18nStore?.t(`messageList.selectAll`)}
            .checked=${this.contacts.length>0&&this.selectedContacts.size===this.contacts.length}
            @change=${e=>this.dispatchEvent(new CustomEvent(`select-all`,{detail:{checked:e.target.checked}}))}>
          <alps-icon-btn 
            title="${this.i18nStore?.t(`contacts.refreshContacts`)}"
            @click=${()=>this.dispatchEvent(new CustomEvent(`refresh`))}
            @animationiteration=${()=>this.dispatchEvent(new CustomEvent(`spin-iteration`))}
            ?spinning=${this.isSpinning}
            icon="arrowsClockwise"
          ></alps-icon-btn>
          <div class="header-divider"></div>
          <alps-icon-btn 
            title=${this.sortOrder===`asc`?this.i18nStore?.t(`contacts.sortZa`):this.i18nStore?.t(`contacts.sortAz`)}
            @click=${()=>this.dispatchEvent(new CustomEvent(`sort-toggle`))} 
            icon=${this.sortOrder===`asc`?`sortAscending`:`sortDescending`}
          ></alps-icon-btn>
          <alps-icon-btn 
            @click=${()=>this.dispatchEvent(new CustomEvent(`filter-star-toggle`))} 
            title="${this.i18nStore?.t(`contacts.filterStarred`)}"
            icon=${this.showOnlyStarred?`starFourFill`:`starFour`}
            ?active=${this.showOnlyStarred}
          ></alps-icon-btn>
        </alps-toolbar>
      `}
      
      <div @scroll=${this.handleListScroll} style="flex: 1; overflow-y: auto; transition: opacity 0.2s ease-in-out; opacity: ${this.loading&&this.contacts.length>0?.5:1}; pointer-events: ${this.loading?`none`:`auto`};">
        ${this.loading&&this.contacts.length===0?s`<alps-loader full-height .text=${this.i18nStore?.t(`messageList.loading`)}></alps-loader>`:(()=>{let e=this.contacts.filter(e=>{if(this.selectedCategory&&(!e.categories||!e.categories.includes(this.selectedCategory))||this.showOnlyStarred&&(!e.categories||!e.categories.includes(`Favorites`)))return!1;if(this.filterQuery){let t=this.filterQuery.toLowerCase();if(!(e.name||``).toLowerCase().includes(t)&&!(e.email||``).toLowerCase().includes(t)&&!(e.nickname||``).toLowerCase().includes(t)&&!(e.organization||``).toLowerCase().includes(t))return!1}return!0});return e.sort((e,t)=>{let n=(e.name||e.email||``).toLowerCase(),r=(t.name||t.email||``).toLowerCase();return n<r?this.sortOrder===`asc`?-1:1:n>r?this.sortOrder===`asc`?1:-1:0}),s`
              ${this.filterQuery?s`
                <alps-banner>
                  <span>${this.i18nStore?.t(`messageList.searchResultsFor`)} <strong>${this.filterQuery}</strong></span>
                  <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`clear-search`))}>
                    ${this.i18nStore?.t(`messageList.clearSearch`)}
                  </alps-button>
                </alps-banner>
              `:``}
              
              ${e.length===0?s`<div class="empty-state">${this.i18nStore?.t(`contacts.noContacts`)}</div>`:e.map(e=>s`
                  <div class="contact-item ${this.selectedContact?.path===e.path||e.isTemporary&&this.selectedContact?.isTemporary?`active`:``} ${this.selectedContacts.has(e.path)?`selected`:``}" @click=${()=>this.dispatchEvent(new CustomEvent(`select-contact`,{detail:{contact:e}}))}>
                    ${this.isMobile?``:s`
                      <div class="checkbox-col" @click=${t=>{if(e.isTemporary){t.stopPropagation();return}this.dispatchEvent(new CustomEvent(`toggle-selection`,{detail:{path:e.path,event:t}}))}}>
                        <input type="checkbox" class="contact-checkbox" 
                          ?disabled=${e.isTemporary}
                          .checked=${this.selectedContacts.has(e.path)}
                          @click=${e=>e.stopPropagation()}
                          @change=${t=>this.dispatchEvent(new CustomEvent(`toggle-selection`,{detail:{path:e.path,event:t}}))}>
                      </div>
                    `}
                    <div class="avatar-stack">
                      <div class="avatar-wrapper">
                        <alps-avatar .name=${e.name||e.email||`Unknown`} .email=${e.email} .src=${e.avatar||``} .size=${this.densityMode===`loose`?48:this.densityMode===`compact`?24:40}></alps-avatar>
                      </div>
                    </div>
                    <div class="contact-details">
                      <div class="contact-header-row">
                        <div class="contact-header-inner">
                          <div class="contact-sender">${e.name||e.email||this.i18nStore?.t(`contacts.unnamedContact`)}</div>
                          <div @click=${t=>{t.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-star`,{detail:{contact:e}}))}} class="star-btn ${e.categories?.includes(`Favorites`)?`starred`:``}" style="${e.isTemporary?`opacity: 0.5; pointer-events: none;`:``}">
                            ${w(e.categories?.includes(`Favorites`)?`starFourFill`:`starFour`)}
                          </div>
                        </div>
                        ${e.revision?s`<div class="contact-date">${this.formatRevision(e.revision)}</div>`:``}
                      </div>
                      <div class="contact-subject-row">
                        <div class="contact-subject">
                          ${this.densityMode===`ultra-compact`?``:e.email||``}
                        </div>
                      </div>
                    </div>
                  </div>
                `)}
            `})()}
      </div>
    `}};A([f({context:x})],z.prototype,`i18nStore`,void 0),A([f({context:S})],z.prototype,`settingsStore`,void 0),A([i({type:Array})],z.prototype,`contacts`,void 0),A([i({type:String})],z.prototype,`selectedCategory`,void 0),A([i({type:String})],z.prototype,`filterQuery`,void 0),A([i({type:String})],z.prototype,`sortOrder`,void 0),A([i({type:Boolean})],z.prototype,`showOnlyStarred`,void 0),A([i({type:Boolean})],z.prototype,`isMobile`,void 0),A([i({type:String})],z.prototype,`densityMode`,void 0),A([i({type:Object})],z.prototype,`selectedContacts`,void 0),A([i({type:Object})],z.prototype,`selectedContact`,void 0),A([i({type:Boolean})],z.prototype,`isSpinning`,void 0),A([i({type:Boolean})],z.prototype,`loading`,void 0),A([i({type:Boolean})],z.prototype,`listScrolled`,void 0),z=A([a(`alps-contacts-list`)],z);var B=class extends p{constructor(...e){super(...e),this.mailboxes=[],this.currentMailbox=``,this.expandedFolders=new Set,this.layoutMode=`vertical`,this.syncing=!1,this.collapsed=!1,this.isScrolled=!1,this.showCreatePrompt=!1,this.showRenamePrompt=!1,this.mailboxToRename=``,this.showDeleteConfirm=!1,this.showMoveToTrashConfirm=!1,this.mailboxToDelete=``,this.parentForNewFolder=``,this.activeKebabMenu=null,this._handleStoreChange=()=>{this.requestUpdate()},this.handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0}}willUpdate(e){super.willUpdate(e)}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.composeStore&&this.composeStore.addEventListener(`change`,this._handleStoreChange),this.i18nStore&&this.i18nStore.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.composeStore&&this.composeStore.removeEventListener(`change`,this._handleStoreChange),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=[Ye,o`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
      box-sizing: border-box;
    }
    
    .sidebar-wrapper {
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-color: var(--bg-secondary);
    }

    .sidebar-header {
      padding: 0 12px;
      gap: 8px;
      background-color: var(--bg-secondary);
    }

    :host([collapsed]) .sidebar-header {
      padding: 0 14px;
      justify-content: flex-start;
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 8px;
    }

    :host([collapsed]) .sidebar-content {
      transition: opacity 0.2s ease;
    }

    .sidebar-scroll-content {
      width: calc(max(100%, 215px));
      margin-left: calc(min(0px, (100% - 215px) * 50 / 167));
    }

    :host([collapsed]) .sidebar-content {
      opacity: 0.5;
      overflow-y: hidden;
    }

    :host([collapsed]) .folder-item {
      border-radius: 6px 0 0 6px;
    }

    .folder-item {
      display: flex;
      align-items: center;
      position: relative;
      height: 36px;
      padding: 0 8px;
      box-sizing: border-box;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-color);
      margin-bottom: 2px;
      user-select: none;
      transition: background 0.15s;
    }

    @media (hover: hover) {
      .folder-item:hover {
        background: var(--hover-color);
      }
    }

    .folder-item.active {
      background: var(--bg-selected);
      color: var(--accent-hover);
      font-weight: 600;
    }

    .folder-item .icon {
      color: var(--text-muted);
    }
    
    .folder-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .folder-badge {
      background: rgba(0,0,0,0.08);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .folder-item.active .folder-badge {
      background: rgba(255,255,255,0.2);
    }

    .folder-children {
      margin-left: 12px;
    }

    .folder-actions {
      display: none;
      align-items: center;
      padding-left: 8px;
      margin-left: auto;
      margin-right: -4px;
    }

    .folder-item.active .folder-actions {
      display: none; /* Only show on hover for desktop */
    }

    @media (hover: hover) {
      .folder-item:hover .folder-actions {
        display: flex;
      }
      .folder-item.has-actions:hover .folder-badge {
        display: none;
      }
    }

    .folder-actions:focus-within,
    .folder-actions.popup-open {
      display: flex;
    }

    .folder-actions:focus-within ~ .folder-badge,
    .folder-actions.popup-open ~ .folder-badge {
      display: none;
    }

    @media (max-width: 768px) {
      .folder-item.active .folder-actions {
        display: flex;
        position: static;
        transform: none;
        background: transparent;
      }
      .folder-item.active .folder-badge {
        display: block; /* keep badge visible alongside actions on mobile */
      }
    }

    .sidebar-header-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px 4px 14px;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }

    .folder-separator {
      height: 1px;
      background: var(--border-color);
      margin: 8px 12px;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      border-radius: 4px;
    }
    
    .icon-btn:hover {
      background: var(--hover-color);
      color: var(--text-color);
    }

    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .folder-icon {
      margin-right: 10px;
      font-size: 16px;
      display: flex;
      align-items: center;
    }

    /* Standard icon colors */
    .icon-inbox { color: var(--icon-inbox, #3b82f6); }
    .icon-sent { color: var(--icon-sent, #10b981); }
    .icon-drafts { color: var(--icon-drafts, #f59e0b); }
    .icon-spam { color: var(--icon-spam, #ef4444); }
    .icon-trash { color: var(--icon-trash, #6b7280); }
    .icon-archive { color: var(--icon-archive, #8b5cf6); }
    .icon-default { color: var(--icon-default, #9ca3af); }

  `]}toggleFolder(e,t){e&&e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-folder`,{detail:{folderName:t}}))}selectMailbox(e){this.dispatchEvent(new CustomEvent(`select-mailbox`,{detail:{name:e}}))}triggerCreateFolder(){this.parentForNewFolder=``,this.showCreatePrompt=!0}handleCreateSubmit(e){let t=e.detail.name;if(t){if(this.parentForNewFolder){let e=this.mailboxes.find(e=>(e.Name||e.Mailbox)===this.parentForNewFolder),n=`.`;if(e){let t=e.Delimiter||e.Delim;n=typeof t==`number`?String.fromCharCode(t):t||`.`}t=`${this.parentForNewFolder}${n}${t}`,this.dispatchEvent(new CustomEvent(`expand-folder`,{detail:{folderName:this.parentForNewFolder}}))}I.createMailbox(t)}this.showCreatePrompt=!1,this.parentForNewFolder=``}async handleRenameSubmit(e){let t=e.detail.name;if(t&&this.mailboxToRename){let e=this.mailboxToRename;this.showRenamePrompt=!1,this.mailboxToRename=``,await I.renameMailbox(e,t)&&(this.currentMailbox===e&&this.selectMailbox(t),this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderRenamed`),actionLabel:this.i18nStore?.t(`toast.undo`),actionFn:async()=>{await I.renameMailbox(t,e),this.currentMailbox===t&&this.selectMailbox(e)},duration:5e3},bubbles:!0,composed:!0})))}else this.showRenamePrompt=!1,this.mailboxToRename=``}async handleDeleteConfirm(){this.mailboxToDelete&&await I.deleteMailbox(this.mailboxToDelete)&&(this.currentMailbox.startsWith(this.mailboxToDelete)&&this.selectMailbox(C),this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderPermanentlyDeleted`),duration:3e3},bubbles:!0,composed:!0}))),this.showDeleteConfirm=!1,this.mailboxToDelete=``}async handleMoveToTrashConfirm(){if(this.mailboxToDelete){let e=this.mailboxes.find(e=>(e.Name||e.Mailbox)===this.mailboxToDelete),t=`.`;if(e){let n=e.Delimiter||e.Delim;t=typeof n==`number`?String.fromCharCode(n):n||`.`}let n=this.mailboxToDelete.split(t),r=n[n.length-1],i=`Trash${t}${r}`;if(await I.renameMailbox(this.mailboxToDelete,i)){this.currentMailbox.startsWith(this.mailboxToDelete)&&this.selectMailbox(C);let e=this.mailboxToDelete;this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderMovedToTrash`),actionLabel:this.i18nStore?.t(`toast.undo`),actionFn:async()=>{await I.renameMailbox(i,e)},duration:5e3},bubbles:!0,composed:!0}))}}this.showMoveToTrashConfirm=!1,this.mailboxToDelete=``}render(){let e=[C,Ee,De,Oe,ke,Ae,je,Me],t={[C]:{icon:`tray`,colorClass:`icon-inbox`,label:this.i18nStore?.t(`folderList.inbox`)},[Ee]:{icon:`fileText`,colorClass:`icon-drafts`,label:this.i18nStore?.t(`folderList.drafts`)},[De]:{icon:`paperPlaneTilt`,colorClass:`icon-sent`,label:this.i18nStore?.t(`folderList.sent`)},[Oe]:{icon:`archiveBox`,colorClass:`icon-archive`,label:this.i18nStore?.t(`folderList.archive`)},[ke]:{icon:`archiveBox`,colorClass:`icon-archive`,label:this.i18nStore?.t(`folderList.archive`)},[Ae]:{icon:`warningDiamond`,colorClass:`icon-spam`,label:this.i18nStore?.t(`folderList.spam`)},[je]:{icon:`warningDiamond`,colorClass:`icon-spam`,label:this.i18nStore?.t(`folderList.junk`)},[Me]:{icon:`trash`,colorClass:`icon-trash`,label:this.i18nStore?.t(`folderList.trash`)}},n={};this.mailboxes.forEach(e=>{let t=e.Name||e.Mailbox||``,r=e.Delimiter||e.Delim,i=typeof r==`number`?String.fromCharCode(r):r||`.`,a=t.split(i),o=n,s=``;for(let t=0;t<a.length;t++){let n=a[t];s=t===0?n:s+i+n,o[n]||(o[n]={name:n,fullName:s,children:{}}),t===a.length-1&&(o[n].mb=e),o=o[n].children}});let r=[],i=[];Object.values(n).forEach(t=>{e.includes(t.name)?r.push(t):i.push(t)}),r.sort((t,n)=>e.indexOf(t.name)-e.indexOf(n.name)),i.sort((e,t)=>e.name.localeCompare(t.name));let a=(n,r=0)=>n.map(n=>{let i=Object.keys(n.children).length>0,o=this.expandedFolders.has(n.fullName),c=this.currentMailbox===n.fullName,l=w(`folder`),u=`icon-default`,d=n.name;r===0&&t[n.name]&&(l=w(t[n.name].icon),u=t[n.name].colorClass,d=t[n.name].label);let f=n.mb?.Unseen||0,p=(n.mb?.Attrs||[]).some(e=>typeof e==`string`&&e.toLowerCase()===`\\noselect`),m=e=>{p?i&&this.toggleFolder(e,n.fullName):this.selectMailbox(n.fullName)},h=r>0||!e.includes(n.name);return s`
          <div 
            class="folder-item ${c?`active`:``} ${p?`no-select`:``} ${h?`has-actions`:``}"
            title=${d}
            @click=${m}
          >
            <alps-icon-btn 
              class="folder-toggle-btn" 
              icon=${o?`caretDown`:`caretRight`}
              style="visibility: ${i?`visible`:`hidden`}; --btn-padding: 2px;" 
              @click=${e=>{e.stopPropagation(),i&&this.toggleFolder(e,n.fullName)}}
            ></alps-icon-btn>
            
            <div class="folder-icon ${u}">${l}</div>
            <div class="folder-name">${d}</div>
            
            ${h?s`
              <div class="folder-actions ${this.activeKebabMenu===n.fullName?`popup-open`:``}" @click=${e=>e.stopPropagation()}>
                <alps-popup 
                  align="right" 
                  position="bottom"
                  @popup-open=${()=>{this.activeKebabMenu=n.fullName}}
                  @popup-close=${()=>{this.activeKebabMenu===n.fullName&&(this.activeKebabMenu=null)}}
                >
                  <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical" style="--btn-padding: 8px;"></alps-icon-btn>
                  <button class="dropdown-item" @click=${e=>{let t=e.target.closest(`alps-popup`);t&&t.close(),this.parentForNewFolder=n.fullName,this.showCreatePrompt=!0}}>
                    ${w(`folderPlus`)} <span class="item-text">${this.i18nStore?.t(`folderList.createSubfolder`)}</span>
                  </button>
                  <button class="dropdown-item" @click=${e=>{let t=e.target.closest(`alps-popup`);t&&t.close(),this.mailboxToRename=n.fullName,this.showRenamePrompt=!0}}>
                    ${w(`pen`)} <span class="item-text">${this.i18nStore?.t(`folderList.rename`)}</span>
                  </button>
                  <button class="dropdown-item" @click=${e=>{let t=e.target.closest(`alps-popup`);t&&t.close(),n.mb?.Subscribed?I.unsubscribeMailbox(n.fullName):I.subscribeMailbox(n.fullName)}}>
                    ${w(n.mb?.Subscribed?`eyeSlash`:`eye`)} <span class="item-text">${n.mb?.Subscribed?`Unsubscribe`:`Subscribe`}</span>
                  </button>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item" @click=${e=>{let t=e.target.closest(`alps-popup`);t&&t.close(),this.mailboxToDelete=n.fullName,n.fullName.toLowerCase().startsWith(`trash`)?this.showDeleteConfirm=!0:this.showMoveToTrashConfirm=!0}}>
                    ${w(`trash`)} <span class="item-text">${this.i18nStore?.t(`folderList.delete`)}</span>
                  </button>
                </alps-popup>
              </div>
            `:``}

            ${f>0?s`<div class="folder-badge">${f}</div>`:``}
          </div>
          
          ${i&&o?s`
            <div class="folder-children">
              ${a(Object.values(n.children).sort((e,t)=>e.name.localeCompare(t.name)),r+1)}
            </div>
          `:``}
        `});return s`
      <div class="sidebar-wrapper">
        <alps-toolbar class="sidebar-header" ?scrolled=${this.isScrolled}>
          <alps-create-button 
            icon="pen"
            ?disabled=${(this.composeStore?.getState()?.activeComposers?.length||0)>=3}
            title=${this.i18nStore?.t(`folderList.compose`)}
            ?collapsed=${this.hasAttribute(`collapsed`)}
            @click=${()=>this.dispatchEvent(new CustomEvent(`compose`))}
          >${this.i18nStore?.t(`folderList.compose`)}</alps-create-button>
        </alps-toolbar>
        <div class="sidebar-content" @scroll=${this.handleScroll}>
          <div class="sidebar-scroll-content">
            ${a(r)}
            ${r.length>0&&i.length>0?s`
              <div class="folder-separator"></div>
            `:``}
            <div class="sidebar-header-title">
              <span>${this.i18nStore?.t(`folderList.title`)}</span>
            </div>
            ${a(i)}
          </div>
        </div>
      </div>

      ${this.showCreatePrompt?s`
        <ui-prompt
          title=${this.parentForNewFolder?this.i18nStore?.t(`folderList.createSubfolderUnder`)?.replace(`{folder}`,this.parentForNewFolder):this.i18nStore?.t(`folderList.createFolder`)}
          confirmText="Create"
          .fields=${[{id:`name`,label:`Folder Name`,autofocus:!0}]}
          @submit=${this.handleCreateSubmit}
          @cancel=${()=>{this.showCreatePrompt=!1,this.parentForNewFolder=``}}
        ></ui-prompt>
      `:``}

      ${this.showRenamePrompt?s`
        <ui-prompt
          title="${this.i18nStore?.t(`folderList.renameFolder`)}"
          confirmText="Rename"
          .fields=${[{id:`name`,label:`New Name`,autofocus:!0,value:this.mailboxToRename}]}
          @submit=${this.handleRenameSubmit}
          @cancel=${()=>this.showRenamePrompt=!1}
        ></ui-prompt>
      `:``}

      ${this.showMoveToTrashConfirm?s`
        <ui-confirm
          title=${this.i18nStore?.t(`folderList.moveToTrash`)}
          message=${this.i18nStore?.t(`folderList.moveToTrashConfirm`)?.replace(`{folder}`,this.mailboxToDelete)}
          confirmText=${this.i18nStore?.t(`folderList.moveToTrash`)}
          isDanger=${!1}
          @confirm=${this.handleMoveToTrashConfirm}
          @cancel=${()=>this.showMoveToTrashConfirm=!1}
        ></ui-confirm>
      `:``}

      ${this.showDeleteConfirm?s`
        <ui-confirm
          title="${this.i18nStore?.t(`folderList.deleteFolder`)}"
          message=${this.i18nStore?.t(`folderList.deleteFolderConfirm`)?.replace(`{folder}`,this.mailboxToDelete)}
          confirmText="Delete"
          isDanger=${!0}
          @confirm=${this.handleDeleteConfirm}
          @cancel=${()=>this.showDeleteConfirm=!1}
        ></ui-confirm>
      `:``}
    `}};A([f({context:k})],B.prototype,`composeStore`,void 0),A([f({context:x})],B.prototype,`i18nStore`,void 0),A([i({type:Array})],B.prototype,`mailboxes`,void 0),A([i({type:String})],B.prototype,`currentMailbox`,void 0),A([i({type:Object})],B.prototype,`expandedFolders`,void 0),A([i({type:String})],B.prototype,`layoutMode`,void 0),A([i({type:Boolean})],B.prototype,`syncing`,void 0),A([i({type:Boolean,reflect:!0})],B.prototype,`collapsed`,void 0),A([_()],B.prototype,`isScrolled`,void 0),A([_()],B.prototype,`showCreatePrompt`,void 0),A([_()],B.prototype,`showRenamePrompt`,void 0),A([_()],B.prototype,`mailboxToRename`,void 0),A([_()],B.prototype,`showDeleteConfirm`,void 0),A([_()],B.prototype,`showMoveToTrashConfirm`,void 0),A([_()],B.prototype,`mailboxToDelete`,void 0),A([_()],B.prototype,`parentForNewFolder`,void 0),A([_()],B.prototype,`activeKebabMenu`,void 0),B=A([a(`alps-folder-list`)],B);var lt=class extends p{constructor(...e){super(...e),this.name=``,this.address=``}static{this.styles=o`
    :host {
      display: inline;
    }
    
    .recipient-link {
      display: inline;
      color: var(--text-color);
      text-decoration: none;
      cursor: pointer;
    }

    .recipient-link:hover {
      text-decoration: underline;
    }

    .recipient-name {
      font-weight: 500;
    }

    .recipient-address {
      color: var(--text-muted);
    }
  `}handleClick(){this.composeStore.openComposer({to:[this.address]})}render(){let e=this.name;return e===this.address&&(e=``),e?s`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          <span class="recipient-name">${e}</span>
          <span class="recipient-address">&lt;${this.address}&gt;</span>
        </a>
      `:s`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          ${this.address}
        </a>
      `}};A([f({context:k})],lt.prototype,`composeStore`,void 0),A([i({type:String})],lt.prototype,`name`,void 0),A([i({type:String})],lt.prototype,`address`,void 0),lt=A([a(`alps-recipient-pill`)],lt);var ut=class extends p{constructor(...e){super(...e),this.attachment=null,this.downloadUrl=``,this.fallbackName=`Unknown attachment`,this.removable=!1,this.compact=!1}static{this.styles=o`
    .attachment-chip {
      display: inline-flex;
      align-items: center;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      gap: 8px;
      padding: 6px 10px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--bg-primary);
      color: var(--text-color);
      text-decoration: none;
      font-size: 13px;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .progress-bar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      background: var(--bg-selected);
      opacity: 0.3;
      transition: width 0.1s linear;
      pointer-events: none;
      z-index: 0;
    }

    .attachment-icon, .attachment-name, .attachment-size, .remove-btn {
      position: relative;
      z-index: 1;
    }

    :host([compact]) .attachment-chip {
      padding: 2px 4px;
      border-radius: 4px;
      gap: 6px;
    }

    .attachment-icon {
      color: var(--text-muted);
      flex-shrink: 0;
      display: flex;
    }

    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    :host([compact]) .icon {
      width: 16px;
      height: 16px;
    }

    .attachment-name {
      font-weight: 500;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :host([compact]) .attachment-name {
      flex: 1 auto;
      font-size: 12px;
    }

    .attachment-size {
      font-size: 12px;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    :host([compact]) .attachment-size {
      font-size: 11px;
    }

    .remove-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3px;
      border-radius: 4px;
      margin-right: -4px;
    }

    .remove-btn:hover {
      color: var(--text-color);
    }

    .remove-btn .icon {
      width: 14px;
      height: 14px;
    }
  `}_handleRemove(e){e.preventDefault(),e.stopPropagation(),this.dispatchEvent(new CustomEvent(`remove-attachment`,{bubbles:!0,composed:!0,detail:{attachment:this.attachment}}))}render(){if(!this.attachment)return s``;let e=this.attachment.Filename||this.attachment.filename||this.attachment.name||this.fallbackName,t=this.attachment.Size||this.attachment.size||0,n=this.attachment.uploading,r=this.attachment.progress||0,i=s`
      ${n?s`<div class="progress-bar" style="width: ${r}%"></div>`:``}
      <div class="attachment-icon">${w(`paperclipHorizontal`)}</div>
      <span class="attachment-name">${e}</span>
      <span class="attachment-size">${n?`${r}% of ${Le(t)}`:Le(t)}</span>
      ${this.removable?s`
        <button class="remove-btn" @click=${this._handleRemove} title="${this.i18nStore?.t(`attachment.remove`)}">
          ${w(`x`)}
        </button>
      `:``}
    `;return this.downloadUrl?s`
        <a href="${this.downloadUrl}" download="${e}" class="attachment-chip" title="${e}">
          ${i}
        </a>
      `:s`
        <div class="attachment-chip" title="${e}">
          ${i}
        </div>
      `}};A([f({context:x})],ut.prototype,`i18nStore`,void 0),A([i({type:Object})],ut.prototype,`attachment`,void 0),A([i({type:String})],ut.prototype,`downloadUrl`,void 0),A([i({type:String})],ut.prototype,`fallbackName`,void 0),A([i({type:Boolean})],ut.prototype,`removable`,void 0),A([i({type:Boolean,reflect:!0})],ut.prototype,`compact`,void 0),ut=A([a(`alps-attachment-pill`)],ut);var dt=class extends p{constructor(...e){super(...e),this.attachments=[],this.mailbox=C,this.messageUid=``,this.removable=!1,this.composerMode=!1,this.attachmentsExpanded=!0,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}toggleAttachments(){this.attachmentsExpanded=!this.attachmentsExpanded}_downloadAll(e){if(e.stopPropagation(),!this.attachments||this.attachments.length===0||!this.messageUid)return;let t=this.mailbox||`INBOX`;if(!this.mailbox){let e=window.location.hash.match(/^#\/mailbox\/([^/]+)/);e&&(t=decodeURIComponent(e[1]))}this.attachments.forEach((e,n)=>{let r=Array.isArray(e.Path)?e.Path.join(`.`):e.Path,i=`/mailboxes/${encodeURIComponent(t)}/messages/${this.messageUid}/raw?part=${r}`;setTimeout(()=>{let t=document.createElement(`a`);t.href=i,t.download=e.Filename||this.i18nStore?.t(`messageReader.unknownAttachment`)||`attachment`,document.body.appendChild(t),t.click(),document.body.removeChild(t)},n*200)})}static{this.styles=o`
    :host {
      display: block;
      width: 100%;
    }

    .attachments-container {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);
      flex-shrink: 0;
      max-height: 30vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .attachments-header {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
    }

    .attachments-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .attachments-header:hover {
      color: var(--text-color);
    }

    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .attachments-header .icon {
      width: 16px;
      height: 16px;
      transition: transform 0.3s ease;
    }

    .attachments-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .download-all-btn {
      width: 16px;
      height: 16px;
      fill: currentColor;
      transition: transform 0.2s ease, color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }

    .download-all-btn:hover {
      color: var(--text-color);
      transform: translateY(-1px);
    }

    .attachments-wrapper {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.3s ease-out, margin 0.3s ease-out;
      margin: 0;
    }

    .attachments-wrapper.expanded {
      grid-template-rows: 1fr;
      margin-top: 12px;
    }

    .caret {
      transition: transform 0.3s ease;
    }

    .attachments-container.is-expanded .caret {
      transform: rotate(180deg);
    }

    .attachments-container.is-closed .caret {
      transform: rotate(0deg);
    }

    :host([composermode]) .attachments-container.is-expanded .caret {
      transform: rotate(0deg);
    }

    :host([composermode]) .attachments-container.is-closed .caret {
      transform: rotate(180deg);
    }

    .attachments-list {
      min-height: 0;
      overflow: hidden;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }

    :host([composermode]) .attachments-container {
      border-bottom: none;
      border-top: 1px solid var(--border-color);
      padding: 8px 16px;
    }

    :host([composermode]) .attachments-list {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 8px;
    }

    :host([composermode]) .attachments-header {
      font-size: 11px;
    }

    @media (max-width: 768px) {
      .attachments-container {
        border-bottom: none;
        border-top: 1px solid var(--border-color);
      }

      .attachments-container.is-expanded .caret {
        transform: rotate(0deg);
      }

      .attachments-container.is-closed .caret {
        transform: rotate(180deg);
      }

      .attachments-list {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }
    }
  `}render(){return!this.attachments||this.attachments.length===0?s``:s`
      <div class="attachments-container ${this.attachmentsExpanded?`is-expanded`:`is-closed`}">
        <div class="attachments-header" @click=${this.toggleAttachments}>
          <div class="attachments-title">
            <span>${this.i18nStore?.t(`messageReader.attachments`)} (${this.attachments.length})</span>
          </div>
          <div class="attachments-actions">
            ${this.composerMode?``:s`
              <div 
                class="download-all-btn" 
                title=${this.i18nStore?.t(`messageReader.downloadAllAttachments`)} 
                @click=${this._downloadAll}
              >
                ${w(`downloadSimple`)}
              </div>
            `}
            <div class="icon caret">
              ${w(`caretDown`)}
            </div>
          </div>
        </div>
        <div class="attachments-wrapper ${this.attachmentsExpanded?`expanded`:``}">
          <div class="attachments-list">
            ${this.attachments.map(e=>{let t=``;if(this.messageUid){let n=Array.isArray(e.Path)?e.Path.join(`.`):e.Path,r=this.mailbox||`INBOX`;if(!this.mailbox){let e=window.location.hash.match(/^#\/mailbox\/([^/]+)/);e&&(r=decodeURIComponent(e[1]))}t=`/mailboxes/${encodeURIComponent(r)}/messages/${this.messageUid}/raw?part=${n}`}return s`
                <alps-attachment-pill
                  .attachment=${e}
                  .downloadUrl=${t}
                  .fallbackName=${this.i18nStore?.t(`messageReader.unknownAttachment`)}
                  .removable=${this.removable}
                  .compact=${this.composerMode}
                ></alps-attachment-pill>
              `})}
          </div>
        </div>
      </div>
    `}};A([f({context:x})],dt.prototype,`i18nStore`,void 0),A([i({type:Array})],dt.prototype,`attachments`,void 0),A([i({type:String})],dt.prototype,`mailbox`,void 0),A([i({type:String})],dt.prototype,`messageUid`,void 0),A([i({type:Boolean})],dt.prototype,`removable`,void 0),A([i({type:Boolean,reflect:!0})],dt.prototype,`composerMode`,void 0),A([_()],dt.prototype,`attachmentsExpanded`,void 0),dt=A([a(`alps-attachment-list`)],dt);var V=class extends p{constructor(...e){super(...e),this.mailboxes=[],this.currentMailbox=``,this.noActionBox=!1,this.noSearchBox=!1,this.filterQuery=``,this.isMove=!0}static{this.styles=o`
    :host {
      display: inline-block;
    }

    alps-popup {
      display: block;
      width: 100%;
    }

    .selector-container {
      display: flex;
      flex-direction: column;
      width: 240px;
    }

    .search-box {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .action-box {
      padding: 10px 12px 6px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      background-color: var(--bg-secondary, #f9fafb);
      display: flex;
      flex-direction: row;
      gap: 16px;
      margin-top: -4px; /* offset popup padding at top */
      border-radius: 6px 6px 0 0;
    }

    .action-box label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary, #111827);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      user-select: none;
    }

    .search-input {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 4px;
      font-size: 13px;
      box-sizing: border-box;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--accent-color, #005A9E);
    }

    .folder-list {
      max-height: 250px;
      overflow-y: auto;
      padding: 4px 0 0 0;
      margin-bottom: -4px; /* offset the bottom padding of the popup */
    }

    .folder-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      height: 36px;
      padding: 0 12px;
      box-sizing: border-box;
      font-size: 13px;
      color: var(--text-primary, #111827);
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background-color 0.2s;
    }

    .folder-item:hover {
      background-color: var(--hover-color, #f3f4f6);
    }

    .folder-item svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
      color: var(--text-secondary, #4b5563);
      flex-shrink: 0;
    }

    .folder-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .no-results {
      padding: 12px;
      text-align: center;
      font-size: 13px;
      color: var(--text-muted, #6b7280);
      font-style: italic;
    }

    input[type="radio"] {
      cursor: pointer;
      margin: 0;
    }
  `}_handleFilter(e){let t=e.target;this.filterQuery=t.value.toLowerCase()}_handleSelect(e){this.popup&&this.popup.close(),this.dispatchEvent(new CustomEvent(`folder-selected`,{detail:{folderName:e,isMove:this.isMove},bubbles:!0,composed:!0}))}_handlePopupToggle(){this.filterQuery=``,setTimeout(()=>{this.filterInput&&this.filterInput.focus()},50)}render(){let e=this.mailboxes.map(e=>e.Name||e.Mailbox||``).filter(e=>e!==``&&e!==this.currentMailbox).filter(e=>e.toLowerCase().includes(this.filterQuery));return s`
      <alps-popup align="right" @click=${this._handlePopupToggle}>
        <slot name="trigger" slot="trigger"></slot>
        
        <div class="selector-container" @click=${e=>e.stopPropagation()}>
          ${this.noActionBox?``:s`
          <div class="action-box">
            <label>
              <input 
                type="radio" 
                name="folderAction"
                .checked=${this.isMove}
                @change=${()=>this.isMove=!0}
              />
              ${this.i18nStore?.t(`folderSelector.actionMove`)}
            </label>
            <label>
              <input 
                type="radio" 
                name="folderAction"
                .checked=${!this.isMove}
                @change=${()=>this.isMove=!1}
              />
              ${this.i18nStore?.t(`folderSelector.actionCopy`)}
            </label>
          </div>
          `}
          
          ${this.noSearchBox?``:s`
            <div class="search-box">
              <input 
                type="text" 
                class="search-input" 
                placeholder=${this.i18nStore?.t(`folderSelector.filter`)}
                .value=${this.filterQuery}
                @input=${this._handleFilter}
              />
            </div>
          `}
          
          <div class="folder-list">
            ${e.length>0?e.map(e=>s`
              <button class="folder-item" @click=${()=>this._handleSelect(e)}>
                ${w(`folder`)}
                <span class="folder-name">${e}</span>
              </button>
            `):s`
              <div class="no-results">${this.i18nStore?.t(`folderSelector.noResults`)}</div>
            `}
          </div>
        </div>
      </alps-popup>
    `}};A([f({context:x})],V.prototype,`i18nStore`,void 0),A([i({type:Array})],V.prototype,`mailboxes`,void 0),A([i({type:String})],V.prototype,`currentMailbox`,void 0),A([i({type:Boolean})],V.prototype,`noActionBox`,void 0),A([i({type:Boolean})],V.prototype,`noSearchBox`,void 0),A([_()],V.prototype,`filterQuery`,void 0),A([_()],V.prototype,`isMove`,void 0),A([l(`alps-popup`)],V.prototype,`popup`,void 0),A([l(`input`)],V.prototype,`filterInput`,void 0),V=A([a(`alps-folder-selector-popup`)],V);var ft=t(ee(),1);function pt(e,t,n=``){if(!e)return null;let r=t.replace(/^<|>$/g,``);if(e.ID&&e.ID.replace(/^<|>$/g,``)===r)return n||`1`;if(e.Children&&Array.isArray(e.Children))for(let r=0;r<e.Children.length;r++){let i=n?`${n}.${r+1}`:`${r+1}`,a=pt(e.Children[r],t,i);if(a)return a}return null}function mt(e,t){if(!e)return e;try{let n=ft.parse(e,{silent:!0});if(n&&n.stylesheet&&n.stylesheet.rules){let e=/url\(\s*(['"]?)(https?:\/\/[^'"\)]+)\1\s*\)/gi,r=n=>n.replace(e,(e,n,r)=>{if(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources){let e=n||`"`;return`url(${e}/proxy?url=${encodeURIComponent(r)}${e})`}else return`url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)`}),i=n=>{for(let a=n.length-1;a>=0;a--){let o=n[a];if([`rule`,`font-face`,`page`,`keyframe`].includes(o.type)&&!o.declarations&&(o.declarations=[]),[`rule`,`page`].includes(o.type)&&!o.selectors&&(o.selectors=[]),o.type===`keyframe`&&!o.values&&(o.values=[]),o.type===`import`){let e=o;if(e.import&&e.import.match(/https?:\/\//i))if(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources)e.import=e.import.replace(/(url\(\s*)?(['"]?)(https?:\/\/[^'"\)]+)\2(\s*\))?/i,(e,t,n,r,i)=>{let a=t||``,o=i||``,s=n||`"`;return`${a}${s}/proxy?url=${encodeURIComponent(r)}${s}${o}`});else{n.splice(a,1);continue}}else if(o.type===`font-face`){let r=o;if(r.declarations){let i=!1;for(let n of r.declarations)n.type===`declaration`&&n.value?.match(e)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),i=!0);if(i&&!t.allowRemoteResources){n.splice(a,1);continue}}}if(o.declarations)for(let t of o.declarations)t.type===`declaration`&&t.value&&t.value.match(e)&&(t.value=r(t.value));o.rules&&i(o.rules)}};return i(n.stylesheet.rules),ft.stringify(n)}}catch(e){console.warn(`AST CSS parsing failed, falling back to regex sanitizer`,e)}let n=e,r=/@import\s+(?:url\(\s*)?(['"]?)(https?:\/\/[^'"\)]+)\1\s*\)?\s*;?/gi,i=/url\(\s*(['"]?)(https?:\/\/[^'"\)]+)\1\s*\)/gi;return(n.match(r)||n.match(i))&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?(n=n.replace(r,(e,t,n)=>{let r=t||`"`;return`@import url(${r}/proxy?url=${encodeURIComponent(n)}${r});`}),n=n.replace(i,(e,t,n)=>`url(${t}/proxy?url=${encodeURIComponent(n)}${t})`)):(n=n.replace(r,``),n=n.replace(/@font-face\s*\{[^{}]*\}/gi,e=>/url\(\s*['"]?https?:\/\//i.test(e)?``:e),n=n.replace(i,`url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)`))),n}function ht(e,t){let n=new DOMParser().parseFromString(e,`text/html`),r=n.createElement(`base`);r.target=`_blank`,n.head.prepend(r);let i=n.createElement(`meta`);i.httpEquiv=`Content-Security-Policy`,i.content=`script-src 'none'; img-src ${window.location.origin} data: blob: cid:; media-src ${window.location.origin} data: blob: cid:;`,n.head.prepend(i);let a=n.createElement(`style`);a.textContent=`
    body { margin: 0; padding: 24px; box-sizing: border-box; font: 14px -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; overflow-x: hidden; word-wrap: break-word; background-color: #ffffff; color: #000000; }
    @media (max-width: 768px) { body { padding: 16px !important; } }
    html:not(.x), body:not(.x) { height: auto !important; }
    p:first-child { margin-top: 0; }
    p:last-child { margin-bottom: 0; }
    a[href] { color: #3781b8; text-decoration: none; }
    a[href]:hover { text-decoration: underline; }
    blockquote[type='cite'] { margin: 0 0 0 0.8ex; border-left: 1px #ccc solid; padding-left: 1ex; }
    img { max-width: 100%; height: auto; }
  `,n.head.prepend(a),n.querySelectorAll(`img`).forEach(e=>{let n=e.getAttribute(`src`);if(n)if(n.toLowerCase().startsWith(`cid:`)){let r=n.substring(4);if(t.messageStructure){let n=pt(t.messageStructure,r);n&&(e.src=`/mailboxes/${encodeURIComponent(t.mailbox)}/messages/${t.messageUid}/raw?part=${n}`)}}else (n.toLowerCase().startsWith(`http://`)||n.toLowerCase().startsWith(`https://`))&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?e.src=`/proxy?url=${encodeURIComponent(n)}`:(e.setAttribute(`data-original-src`,n),e.src=`data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`,e.style.height=`0`,e.style.width=`0`))}),n.querySelectorAll(`link[rel="stylesheet"]`).forEach(e=>{let n=e.getAttribute(`href`);n&&(n.toLowerCase().startsWith(`http://`)||n.toLowerCase().startsWith(`https://`))&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?e.setAttribute(`href`,`/proxy?url=${encodeURIComponent(n)}`):e.remove())}),n.querySelectorAll(`style`).forEach(e=>{e.textContent&&=mt(e.textContent,t)});let o=/url\(\s*(['"]?)(https?:\/\/[^'"\)]+)\1\s*\)/gi;return n.querySelectorAll(`[style]`).forEach(e=>{let n=e.getAttribute(`style`);n&&n.match(o)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),n=t.allowRemoteResources?n.replace(o,(e,t,n)=>{let r=t||`"`;return`url(${r}/proxy?url=${encodeURIComponent(n)}${r})`}):n.replace(o,`url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)`),e.setAttribute(`style`,n))}),n.documentElement.outerHTML}function gt(e){return e?e.map(e=>e.Name?`${e.Name} <${e.Mailbox}@${e.Host}>`:`${e.Mailbox}@${e.Host}`):[]}function _t(e,t,n,r,i,a=`YYYY-MM-DD`,o=`12`){let s=t?.Envelope?.Subject||``,c=s;c=e===`forward`?c.toLowerCase().startsWith(`fwd:`)?c:`Fwd: ${c}`:c.toLowerCase().startsWith(`re:`)?c:`Re: ${c}`;let l=[],u=[];if(e===`reply`||e===`replyAll`){let n=t?.Envelope?.ReplyTo,r=t?.Envelope?.From;if(l=[...gt(n&&n.length>0?n:r)],e===`replyAll`){let e=gt(t?.Envelope?.To)||[],n=gt(t?.Envelope?.Cc)||[],r=new Set([...l,...e]);l=Array.from(r),u=[...n]}}let d=t?.Envelope?.Date?Fe(t.Envelope.Date,a,o):``,f=t?.Envelope?.From?.[0],p=f?.Mailbox&&f?.Host?`${f.Mailbox}@${f.Host}`:``,m=f?.Name||p||`Unknown Sender`,h=`On ${d}, ${m} wrote:`;e===`forward`&&(h=`---------- Forwarded message ---------\nFrom: ${m} <${p}>\nDate: ${d}\nSubject: ${s}\nTo: ${gt(t?.Envelope?.To).join(`, `)}\n`);let g=`\n\n${h}\n`+n.split(`
`).map(e=>`> ${e}`).join(`
`),_=``;return _=i&&r?e===`forward`?`<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>From: ${m} &lt;${p}&gt;<br>Date: ${d}<br>Subject: ${s}<br>To: ${gt(t?.Envelope?.To).join(`, `)}<br></div><br>${r}</div>`:`<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">On ${d}, ${m} wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${r}</blockquote></div>`:`<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">${h.replace(/\n/g,`<br>`)}<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${n.replace(/\n/g,`<br>`)}</blockquote></div>`,{subject:c,to:l,cc:u,quotedText:g,quotedHtml:_}}var H=class extends p{constructor(...e){super(...e),this.localPreferredView=null,this.hasHtml=!1,this.hasText=!1,this.mailbox=C,this.message=null,this.selectedUids=new Set,this.allSelectedStarred=!1,this.allSelectedUnread=!1,this.bulkProcessing=!1,this.layoutMode=`vertical`,this.mailboxes=[],this.content=``,this.mimeType=``,this.loading=!1,this.hasRemoteResources=!1,this.allowRemoteResources=!1,this.attachments=[],this.rawMessageHtml=``,this.isScrolled=!1,this.handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0}}_closePopup(){let e=this.shadowRoot?.querySelector(`.more-menu-popup`);e&&e.close()}async _handleAction(e,t){if(e===`reply`||e===`replyAll`||e===`forward`){if(!this.message)return;this._closePopup();let t=``;if(this.mimeType===`text/plain`)t=this.content;else{try{let e=await T(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.message.UID}?view=text`);if(e.ok){let n=await e.json();n.Part&&n.RawText&&(t=n.RawText)}}catch(e){y.error(`Failed to fetch text body for quote`,e)}if(!t&&this.rawMessageHtml){let e=document.createElement(`div`);e.innerHTML=this.rawMessageHtml,t=e.innerText||``}}let n=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,r=String(this.settingsStore?.getState()?.hourFormat||`12`),{subject:i,to:a,cc:o,quotedText:s,quotedHtml:c}=_t(e,this.message,t,this.rawMessageHtml,this.hasHtml,n,r),l=e===`forward`?this.attachments.map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})):[],u=e===`reply`||e===`replyAll`?this.message.Envelope?.MessageId:void 0;this.composeStore.openComposer({subject:i,to:a,cc:o,text:s,html:c,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:l,inReplyTo:u});return}if(e===`showPlaintext`){this.localPreferredView=`text`,this.message&&this.fetchMessageBody(this.message),this._closePopup();return}if(e===`showHtml`){this.localPreferredView=`html`,this.message&&this.fetchMessageBody(this.message),this._closePopup();return}if(e===`print`){let e=this.allowRemoteResources?`&remote=1`:``;window.open(`#/print?mailbox=`+encodeURIComponent(this.mailbox)+`&uid=`+this.message.UID+e,`_blank`),this._closePopup();return}this._closePopup(),this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,folder:t}}))}static{this.styles=[Ye,o`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .toolbar {
      padding: 0 16px;
      gap: 12px;
      background: var(--bg-primary, #fff);
    }

    .desktop-attachments {
      display: block;
    }

    .mobile-attachments {
      display: none;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .folder-selector {
      display: block;
      width: 100%;
    }

    .reader-header {
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .reader-subject {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      display: flow-root;
      word-break: break-word;
    }

    .reader-meta {
      display: flex;
      flex-direction: column;
    }

    .reader-meta-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .reader-sender-block {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .reader-sender-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .avatar-container {
      position: relative;
      display: inline-flex;
    }

    .bimi-badge {
      position: absolute;
      bottom: -2px;
      right: -2px;
      color: var(--success, #10b981);
      background: var(--bg-primary, #ffffff);
      border-radius: 50%;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 1px var(--bg-primary, #ffffff);
    }

    .bimi-badge.bimi-failed-badge {
      color: var(--error, #ef4444);
    }

    .bimi-badge svg {
      width: 16px;
      height: 16px;
    }

    .reader-sender-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .reader-sender-name {
      font-weight: 600;
      font-size: 14px;
      line-height: 1.2;
    }

    .reader-recipients-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .reader-recipients {
      display: flex;
      align-items: baseline;
    }

    .reader-recipients-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color);
      width: 40px;
      text-align: right;
      margin-right: 16px;
      line-height: 1.5;
      flex-shrink: 0;
    }

    .reader-recipients-list {
      line-height: 1.5;
      font-size: 14px;
    }

    alps-recipient-pill:not(:last-child)::after {
      content: ", ";
      color: var(--text-color);
      white-space: pre;
    }

    .reader-date {
      font-size: 13px;
      color: var(--text-muted);
    }

    .desktop-date-container {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .reader-size {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .mobile-date-container {
      display: none;
    }

    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spinner {
      animation: spin 3s linear infinite;
      display: flex;
      margin-right: 8px;
    }

    .spinner .icon {
      width: 32px;
      height: 32px;
    }

    .empty-reader-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }

    .bulk-spinner-container {
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }

    .spinner.bulk-spinner {
      margin: 0;
    }

    .toolbar-separator {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 8px;
    }

    .mobile-spacer {
      display: none;
    }

    .mobile-only {
      display: none;
    }

    .undisclosed-recipients {
      color: var(--text-muted);
      font-size: 14px;
      margin-top: 4px;
    }

    .reader-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
      min-height: 0;
    }

    .loading-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .loading-state {
      display: flex;
      align-items: center;
      color: var(--text-muted);
    }

    .reader-content-wrapper {
      flex: 1;
      min-height: 0;
    }

    .reader-iframe {
      width: 100%;
      min-height: 100%;
      border: none;
      display: block;
    }

    .reader-empty-body {
      padding: 24px;
      color: var(--text-muted);
      font-style: italic;
      text-align: center;
    }

    .reader-text-wrapper {
      padding: 24px;
    }

    .reader-preformatted {
      white-space: pre-wrap;
      font-family: inherit;
      margin: 0;
      color: inherit;
    }

    @media (max-width: 768px) {
      .desktop-only {
        display: none !important;
      }

      .desktop-spacer {
        display: none !important;
      }

      .mobile-spacer {
        flex: 1;
        display: block;
      }

      .toolbar-separator.mobile-only {
        display: block;
      }

      .desktop-attachments {
        display: none;
      }

      .mobile-attachments {
        display: block;
        flex-shrink: 0;
      }

      .reader-header {
        padding: 16px;
      }

      .reader-text-wrapper {
        padding: 16px;
      }

      .desktop-date {
        display: none;
      }

      .mobile-date-container {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        float: right;
        margin-left: 12px;
        margin-top: 5px;
      }

      .mobile-date {
        display: block;
        font-weight: normal;
        font-size: 13px;
        line-height: 1.2;
      }

      .mobile-size {
        font-size: 11px;
        color: var(--text-muted);
        line-height: 1.2;
        margin-top: 2px;
        font-weight: normal;
      }
    }
  `]}willUpdate(e){let t=e.has(`message`),n=e.has(`mailbox`);if(t||n){let t=e.get(`message`),n=e.has(`mailbox`)?e.get(`mailbox`):this.mailbox;this.message?!t||t.UID!==this.message.UID||n!==this.mailbox?(this.localPreferredView=null,this.fetchMessageBody(this.message,this.message._isAutosaveUpdate)):this.message._isAutosaveUpdate&&t&&this.message!==t&&this.fetchMessageBody(this.message,!0):(this.localPreferredView=null,this.content=``,this.mimeType=``,this.rawMessageHtml=``,this.loading=!1,this.allowRemoteResources=!1,this.hasRemoteResources=!1,this.hasHtml=!1,this.hasText=!1)}}loadRemoteResources(){this.allowRemoteResources=!0,this.rawMessageHtml&&(this.content=ht(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.message?.UID,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message?.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}}))}async fetchMessageBody(e,t=!1){t||(this.content=``,this.mimeType=``,this.rawMessageHtml=``,this.loading=!0,this.allowRemoteResources=this.settingsStore?.getState().showRemoteContent===`always`,this.hasRemoteResources=!1);let n=this.localPreferredView||this.settingsStore?.getState()?.preferredView||`html`;try{let t=Be.get(this.mailbox,e.UID.toString(),n);if(t){this.attachments=t.Attachments||[],this.hasHtml=t.HasHTML||!1,this.hasText=t.HasText||!1,t.Message&&(this.message={...this.message,...t.Message,...e}),t.Part&&(this.mimeType=t.Part.MIMEType||t.Part.MimeType||`text/plain`,t.RawHtml===void 0?t.RawText!==void 0&&(this.content=t.RawText):(this.rawMessageHtml=t.RawHtml,this.content=ht(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.message?.UID,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message?.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}}))),this.loading=!1;return}let r=await T(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${e.UID}?view=${n}`);if(r.status===401){window.location.hash=`/login`;return}if(!r.ok)throw Error(`Failed to fetch metadata`);let i=await r.json();this.attachments=i.Attachments||[],this.hasHtml=!!i.HasHTML,this.hasText=!!i.HasText,i.Message&&(this.message={...this.message,...i.Message});let a,o,s=i.Part;if(s){this.mimeType=s.MIMEType||s.MimeType||`text/plain`;let t=Array.isArray(s.Path)?s.Path.join(`.`):s.Path,n=await T(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${e.UID}/raw?part=${t}`);if(n.status===401){window.location.hash=`/login`;return}n.ok&&(this.mimeType.toLowerCase()===`text/html`?(a=await n.text(),this.rawMessageHtml=a,this.content=ht(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.message?.UID,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message?.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})):(o=await n.text(),this.content=o))}Be.set(this.mailbox,e.UID.toString(),n,{Message:i.Message,Part:i.Part,Attachments:i.Attachments,RawHtml:a,RawText:o,HasHTML:this.hasHtml,HasText:this.hasText})}catch(e){y.error(`Failed to fetch message:`,e),this.content=`Error loading message.`}finally{this.loading=!1}}onIframeLoad(e){let t=e.target;if(!t.contentDocument||!t.contentDocument.body)return;t.style.height=`0px`,t.style.width=`100%`,t._ro&&t._ro.disconnect();let n=0,r=new ResizeObserver(e=>{let r=0,i=0;for(let a of e)a.target===t.parentElement?n=a.contentRect.width:t.contentDocument&&a.target===t.contentDocument.body&&(a.borderBoxSize&&a.borderBoxSize.length>0?(r=a.borderBoxSize[0].blockSize,i=a.borderBoxSize[0].inlineSize):(r=a.contentRect.height+48,i=a.contentRect.width+48));r>0&&t.style.height!==`${r}px`&&(t.style.height=`${r}px`),n>0&&i>n&&t.style.width!==`${i}px`&&(t.style.width=`${i}px`)});r.observe(t.contentDocument.body),t.parentElement&&r.observe(t.parentElement),t._ro=r}async _handleEditDraft(){if(!this.message)return;let e=``;if(this.mimeType===`text/plain`)e=this.content;else{try{let t=await T(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.message.UID}?view=text`);if(t.ok){let n=await t.json();n.Part&&n.RawText&&(e=n.RawText)}}catch(e){y.error(`Failed to fetch text body for draft`,e)}if(!e){let t=document.createElement(`div`);t.innerHTML=this.rawMessageHtml,e=t.innerText||``}}let t=this.attachments.map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})),n=e=>e?e.map(e=>e.Name?`${e.Name} <${e.Mailbox}@${e.Host}>`:`${e.Mailbox}@${e.Host}`):[];this.composeStore.openComposer({draftUid:this.message.UID.toString(),draftMailbox:this.mailbox,subject:this.message.Envelope?.Subject||``,to:n(this.message.Envelope?.To),cc:n(this.message.Envelope?.Cc),bcc:n(this.message.Envelope?.Bcc),text:e,html:this.rawMessageHtml,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:t})}render(){let e=this.selectedUids&&this.selectedUids.size>0;if(!this.message&&!e)return s`
        <div class="empty-reader-state">
          ${this.i18nStore?.t(`messageReader.selectMessage`)}
        </div>
      `;let t=this.localPreferredView||this.settingsStore?.getState()?.preferredView||`html`,n=this.message||{},r=n.Envelope?.From?.[0]||{},i=r.Mailbox&&r.Host?`${r.Mailbox}@${r.Host}`:``,a=r.Name||i||this.i18nStore?.t(`messageList.unknownSender`),o=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,c=String(this.settingsStore?.getState()?.hourFormat||`12`),l=n.Envelope?.Date?Fe(n.Envelope.Date,o,c):``,u=r.Host?r.Host.toLowerCase():``,d=u&&!new Set([`gmail.com`,`yahoo.com`,`hotmail.com`,`outlook.com`,`icloud.com`,`me.com`,`mac.com`,`aol.com`,`proton.me`,`protonmail.com`,`live.com`,`msn.com`,`pm.me`,`yandex.ru`,`mail.ru`,`gmx.de`,`web.de`,`t-online.de`,`orange.fr`,`free.fr`]).has(u)?`/bimi/avatar?domain=${encodeURIComponent(u)}`:``,f=(this.mailbox||``).toLowerCase(),p=f===`archive`||f===`archives`,m=f===`spam`||f===`junk`,h=f===Me.toLowerCase(),g=f===Ee.toLowerCase(),_=f===De.toLowerCase();return s`
      <alps-toolbar class="toolbar" ?scrolled=${this.isScrolled}>
        ${this.layoutMode===`full`?s`
          <alps-icon-btn @click=${()=>this.dispatchEvent(new CustomEvent(`close`))} title=${this.i18nStore?.t(`messageReader.back`)} icon="arrowLeft"></alps-icon-btn>
          <div class="toolbar-separator desktop-only"></div>
        `:``}
        
        <div class="toolbar-spacer mobile-spacer"></div>
        
        ${!p&&!h&&!g?s`
        <alps-icon-btn title=${this.i18nStore?.t(`messageReader.archive`)} @click=${()=>this._handleAction(`archive`)} icon="archiveBox"></alps-icon-btn>
        `:``}
        ${!m&&!h&&!g&&!_?s`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t(`messageReader.reportSpam`)} @click=${()=>this._handleAction(`reportSpam`)} icon="warningDiamond"></alps-icon-btn>
        `:``}
        ${m?s`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t(`messageReader.notSpam`)} @click=${()=>this._handleAction(`notSpam`)} icon="notSpam"></alps-icon-btn>
        `:``}
        <alps-icon-btn title=${this.message?.Flags?.includes(`\\Draft`)||g?this.i18nStore?.t(`messageReader.discardDraft`):this.i18nStore?.t(`messageReader.delete`)} @click=${()=>this._handleAction(`delete`)} icon="trash"></alps-icon-btn>
        <alps-folder-selector-popup
          class="desktop-only"
          .mailboxes=${this.mailboxes}
          .currentMailbox=${this.mailbox}
          @folder-selected=${e=>this._handleAction(e.detail.isMove?`moveTo`:`copyTo`,e.detail.folderName)}
        >
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`messageReader.moveTo`)} icon="folderOpen"></alps-icon-btn>
        </alps-folder-selector-popup>
        
        <div class="toolbar-separator"></div>
        
        ${!h&&!_?s`
        <alps-icon-btn title=${e&&this.allSelectedUnread||!e&&!this.message?.Flags?.includes(`\\Seen`)?this.i18nStore?.t(`messageReader.markRead`):this.i18nStore?.t(`messageReader.markUnread`)} @click=${()=>this._handleAction(`markUnread`)} icon=${e&&this.allSelectedUnread||!e&&!this.message?.Flags?.includes(`\\Seen`)?`envelopeOpen`:`envelopeUnread`}></alps-icon-btn>
        `:``}
        <alps-icon-btn class="desktop-only" ?active=${e&&this.allSelectedStarred||!e&&this.message?.Flags?.includes(`\\Flagged`)} title=${this.i18nStore?.t(`messageReader.star`)} @click=${()=>this._handleAction(`star`)} icon=${e&&this.allSelectedStarred||!e&&this.message?.Flags?.includes(`\\Flagged`)?`starFourFill`:`starFour`}></alps-icon-btn>
        <div class="toolbar-spacer desktop-spacer"></div>
        <div class="toolbar-separator mobile-only"></div>
          
          ${e?``:s`
            ${this.message?.Flags?.includes(`\\Draft`)||g?s`
              <alps-icon-btn title=${this.i18nStore?.t(`messageReader.editDraft`)} @click=${this._handleEditDraft} icon="pen"></alps-icon-btn>
            `:s`
              <alps-icon-btn title=${this.i18nStore?.t(`messageReader.reply`)} @click=${()=>this._handleAction(`reply`)} icon="arrowBendUpLeft"></alps-icon-btn>
            `}
            
            <alps-popup align="right" class="more-menu-popup">
              <alps-icon-btn slot="trigger" class="more-btn" title=${this.i18nStore?.t(`messageReader.moreOptions`)} icon="dotsThreeVertical"></alps-icon-btn>
            
            ${this.message?.Flags?.includes(`\\Draft`)||g?``:s`
            <button class="dropdown-item" @click=${()=>this._handleAction(`reply`)}>
              ${w(`arrowBendUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reply`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`replyAll`)}>
              ${w(`arrowBendDoubleUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.replyAll`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`forward`)}>
              ${w(`arrowBendUpRight`)} <span class="item-text">${this.i18nStore?.t(`messageReader.forward`)}</span>
            </button>
            <div class="dropdown-divider"></div>
            `}
            ${!p&&!h&&!g?s`
            <button class="dropdown-item" @click=${()=>this._handleAction(`archive`)}>
              ${w(`archiveBox`)} <span class="item-text">${this.i18nStore?.t(`messageReader.archive`)}</span>
            </button>
            `:``}
            ${!m&&!h&&!g&&!_?s`
            <button class="dropdown-item" @click=${()=>this._handleAction(`reportSpam`)}>
              ${w(`warningDiamond`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reportSpam`)}</span>
            </button>
            `:``}
            ${m?s`
            <button class="dropdown-item" @click=${()=>this._handleAction(`notSpam`)}>
              ${w(`notSpam`)} <span class="item-text">${this.i18nStore?.t(`messageReader.notSpam`)}</span>
            </button>
            `:``}
            <button class="dropdown-item" @click=${()=>this._handleAction(`delete`)}>
              ${w(`trash`)} <span class="item-text">${this.message?.Flags?.includes(`\\Draft`)||this.mailbox===`Drafts`?this.i18nStore?.t(`messageReader.discardDraft`):this.i18nStore?.t(`messageReader.delete`)}</span>
            </button>
            <alps-folder-selector-popup
              class="folder-selector"
              .mailboxes=${this.mailboxes}
              .currentMailbox=${this.mailbox}
              @folder-selected=${e=>this._handleAction(e.detail.isMove?`moveTo`:`copyTo`,e.detail.folderName)}
            >
              <button slot="trigger" class="dropdown-item">
                ${w(`folderOpen`)} <span class="item-text">${this.i18nStore?.t(`messageReader.moveTo`)}</span>
              </button>
            </alps-folder-selector-popup>
            <div class="dropdown-divider"></div>
            ${!h&&!_?s`
            <button class="dropdown-item" @click=${()=>this._handleAction(`markUnread`)}>
              ${this.message?.Flags?.includes(`\\Seen`)?w(`envelopeUnread`):w(`envelopeOpen`)} <span class="item-text">${this.message?.Flags?.includes(`\\Seen`)?this.i18nStore?.t(`messageReader.markUnread`):this.i18nStore?.t(`messageReader.markRead`)}</span>
            </button>
            `:``}
            <button class="dropdown-item" @click=${()=>this._handleAction(`star`)}>
              ${this.message?.Flags?.includes(`\\Flagged`)?w(`starFourFill`):w(`starFour`)} <span class="item-text">${this.i18nStore?.t(`messageReader.star`)}</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${()=>this._handleAction(`print`)}>
              ${w(`printer`)} <span class="item-text">${this.i18nStore?.t(`messageReader.print`)}</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item ${t===`text`?`active`:``}" ?disabled=${!this.hasText} @click=${()=>this.hasText&&this._handleAction(`showPlaintext`)}>
              ${w(`textAlignLeft`)}
              <span class="item-text">${this.i18nStore?.t(`messageReader.showPlaintext`)}</span>
            </button>
            <button class="dropdown-item ${t===`html`?`active`:``}" ?disabled=${!this.hasHtml} @click=${()=>this.hasHtml&&this._handleAction(`showHtml`)}>
              ${w(`code`)}
              <span class="item-text">${this.i18nStore?.t(`messageReader.showHtml`)}</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${()=>this._handleAction(`downloadMessage`)}>
              ${w(`downloadSimple`)} <span class="item-text">${this.i18nStore?.t(`messageReader.downloadMessage`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`showOriginal`)}>
              ${w(`codeBlock`)} <span class="item-text">${this.i18nStore?.t(`messageReader.showOriginal`)}</span>
            </button>
          </alps-popup>
          `}
      </alps-toolbar>
      
      ${e?s`
        <div class="reader-body">
          <div class="empty-reader-state" style="flex-direction: column; gap: 16px;">
            ${this.bulkProcessing?s`
              <div class="bulk-spinner-container">
                <alps-loader></alps-loader>
              </div>
            `:s`
              <alps-icon-btn icon="envelopeSimple" style="pointer-events: none;"></alps-icon-btn>
            `}
            <span>${this.selectedUids.size} ${this.i18nStore?.t(`messageReader.messagesSelected`)}</span>
          </div>
        </div>
      `:s`
        <div class="reader-body" @scroll=${this.handleScroll}>
          <div class="reader-header">
          <div class="reader-subject">
            <div class="mobile-date-container">
              <div class="reader-date mobile-date">${l}</div>
              ${n.RFC822Size?s`<div class="reader-size mobile-size">${Le(n.RFC822Size)}</div>`:``}
            </div>
            ${n.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`)}
          </div>
          <div class="reader-meta">
            <div class="reader-sender-block">
              <div class="reader-sender-left">
                <div class="avatar-container">
                  <alps-avatar .name=${a} .email=${i} .size=${40} .src=${d}></alps-avatar>
                  ${n.HasBimiPotential?s`
                    <div class="bimi-badge" title="${this.i18nStore?.t(`messageReader.verifiedSender`)}">
                      ${w(`verifiedBadge`)}
                    </div>
                  `:n.HasBimiFailed?s`
                    <div class="bimi-badge bimi-failed-badge" title="${this.i18nStore?.t(`messageReader.unverifiedSender`)}">
                      ${w(`authFailedBadge`)}
                    </div>
                  `:``}
                </div>
                <div class="reader-sender-info">
                  ${r.Name&&r.Name!==i?s`<span class="reader-sender-name">${r.Name}</span>`:``}
                  ${i?s`<alps-recipient-pill address="${i}"></alps-recipient-pill>`:s`<span class="reader-sender-name">${a}</span>`}
                </div>
              </div>
              <div class="desktop-date-container">
                <div class="reader-date desktop-date">${l}</div>
                ${n.RFC822Size?s`<div class="reader-size desktop-only">${Le(n.RFC822Size)}</div>`:``}
              </div>
            </div>
            
            <div class="reader-recipients-block">
              <div class="reader-recipients">
                <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.to`)}</span>
                <div class="reader-recipients-list">
                  ${n.Envelope?.To&&n.Envelope.To.length>0?n.Envelope.To.map(e=>e.Mailbox&&e.Host?s`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``):s`<span class="undisclosed-recipients">${n.Flags?.includes(`\\Draft`)?this.i18nStore?.t(`messageReader.noRecipients`):this.i18nStore?.t(`messageReader.undisclosed`)}</span>`}
                </div>
              </div>
              ${n.Envelope?.Cc&&n.Envelope.Cc.length>0?s`
                <div class="reader-recipients">
                  <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.cc`)}</span>
                  <div class="reader-recipients-list">
                    ${n.Envelope.Cc.map(e=>e.Mailbox&&e.Host?s`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``)}
                  </div>
                </div>
              `:``}
            </div>
          </div>
        </div>

        ${!this.loading&&this.attachments&&this.attachments.length>0?s`
          <alps-attachment-list
            class="desktop-attachments"
            .attachments=${this.attachments}
            .mailbox=${this.mailbox}
            .messageUid=${n.UID}
          ></alps-attachment-list>
        `:``}

        ${this.loading?s`
          <div class="loading-overlay">
            <div class="loading-state">
              <alps-loader full-height .text=${this.i18nStore?.t(`messageReader.loadingMessage`)||`Loading message...`}></alps-loader>
            </div>
          </div>
        `:s`
          ${this.hasRemoteResources&&!this.allowRemoteResources?s`
            <alps-banner>
              <span>${this.i18nStore?.t(`messageReader.remoteContentWarning`)}</span>
              <alps-button slot="action" variant="normal" @click=${this.loadRemoteResources}>${this.i18nStore?.t(`messageReader.loadRemoteContent`)}</alps-button>
            </alps-banner>
          `:``}
          ${this.message?.Flags?.includes(`\\Draft`)?s`
            <alps-banner>
              <span>${this.i18nStore?.t(`messageReader.isDraft`)}</span>
              <alps-button slot="action" variant="normal" @click=${this._handleEditDraft}>${this.i18nStore?.t(`messageReader.editDraft`)}</alps-button>
            </alps-banner>
          `:``}
          
          <div class="reader-content-wrapper">
            ${this.mimeType?.toLowerCase()===`text/html`?s`
              <iframe 
                class="reader-iframe"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                .srcdoc=${this.content}
                @load=${this.onIframeLoad}
              ></iframe>
            `:this.mimeType?.toLowerCase().startsWith(`multipart/`)?s`
              <div class="reader-empty-body">
                ${this.i18nStore?.t(`messageReader.noReadableText`)}
              </div>
            `:s`
              <div class="reader-text-wrapper">
                <pre class="reader-preformatted">${this.content}</pre>
              </div>
            `}
          </div>

        `}
      </div>

      ${!this.loading&&this.attachments&&this.attachments.length>0?s`
        <alps-attachment-list
          class="mobile-attachments"
          .attachments=${this.attachments}
          .mailbox=${this.mailbox}
          .messageUid=${n.UID}
        ></alps-attachment-list>
      `:``}
      `}
    `}};A([f({context:S})],H.prototype,`settingsStore`,void 0),A([f({context:x})],H.prototype,`i18nStore`,void 0),A([f({context:k})],H.prototype,`composeStore`,void 0),A([_()],H.prototype,`localPreferredView`,void 0),A([_()],H.prototype,`hasHtml`,void 0),A([_()],H.prototype,`hasText`,void 0),A([i({type:String})],H.prototype,`mailbox`,void 0),A([i({type:Object})],H.prototype,`message`,void 0),A([i({type:Object})],H.prototype,`selectedUids`,void 0),A([i({type:Boolean})],H.prototype,`allSelectedStarred`,void 0),A([i({type:Boolean})],H.prototype,`allSelectedUnread`,void 0),A([i({type:Boolean})],H.prototype,`bulkProcessing`,void 0),A([i({type:String})],H.prototype,`layoutMode`,void 0),A([i({type:Array})],H.prototype,`mailboxes`,void 0),A([_()],H.prototype,`content`,void 0),A([_()],H.prototype,`mimeType`,void 0),A([_()],H.prototype,`loading`,void 0),A([_()],H.prototype,`hasRemoteResources`,void 0),A([_()],H.prototype,`allowRemoteResources`,void 0),A([_()],H.prototype,`attachments`,void 0),A([_()],H.prototype,`rawMessageHtml`,void 0),A([_()],H.prototype,`isScrolled`,void 0),H=A([a(`alps-message-reader`)],H);var vt=1e4,yt=250,bt=150,xt=500,St=64,Ct=120,wt=380,Tt=300,Et=57,Dt=150,Ot=250,U=class extends p{constructor(...e){super(...e),this.showDeleteConfirm=!1,this.pendingDeleteDetails=null,this.markReadTimer=null,this.notificationSound=new Audio(`/assets/notify.wav`),this.audioUnlocked=!1,this.unlockAudio=()=>{this.audioUnlocked||(this.notificationSound.volume=0,this.notificationSound.play().then(()=>{this.notificationSound.pause(),this.notificationSound.currentTime=0,this.notificationSound.volume=1,this.audioUnlocked=!0}).catch(()=>{}),document.removeEventListener(`click`,this.unlockAudio),document.removeEventListener(`keydown`,this.unlockAudio))},this.mailboxes=[],this.messages=[],this.currentMailbox=C,this.loadingMessages=!0,this.showInitialLoader=!0,this.selectedMessage=null,this.selectedUids=new Set,this.layoutMode=`vertical`,this.filterQuery=``,this.expandedFolders=new Set([C]),this.username=``,this.currentPage=0,this.totalMessages=0,this.messagesPerPage=50,this.resizerPositionX=yt+Math.max(wt,(window.innerWidth-yt)*.4),this.listHeight=Math.max(Ot,(window.innerHeight-Et)*.4),this.isSidebarDragging=!1,this.isPaneDragging=!1,this.sidebarWidth=yt,this.isSidebarHovered=!1,this.hoverTimeout=null,this.densityMode=`compact`,this.isSyncing=!1,this.sidebarCollapsed=!1,this.suppressSidebarHover=!1,this.sortOrder=`desc`,this.listScrolled=!1,this.targetUid=null,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.bulkProcessing=!1,this._mql=window.matchMedia(`(max-width: 768px)`),this._handleMediaQuery=e=>{this.isMobile=e.matches,this.isMobile||(this.mobileSidebarOpen=!1)},this.handleDraftAutosaved=e=>{let{oldUid:t,newUid:n,mailbox:r,subject:i,hasAttachments:a,size:o}=e.detail;if(this.currentMailbox===r&&this.messages){let e=Number(n),r=!1;if(t){let n=this.messages.findIndex(e=>String(e.UID)===String(t));if(n!==-1){let s=[...this.messages];if(s[n]={...s[n],UID:e,Size:o||s[n].Size,RFC822Size:o||s[n].RFC822Size,HasAttachments:a,_isAutosaveUpdate:!0,Envelope:{...s[n].Envelope,Subject:i||s[n].Envelope?.Subject||`(No subject)`}},this.messages=s,r=!0,this.selectedMessage&&String(this.selectedMessage.UID)===String(t)){this.selectedMessage=s[n],this.targetUid=String(e);let r=window.location.hash;r.includes(`/${t}`)?r=r.replace(`/${t}`,`/${e}`):r.includes(`uid=${t}`)&&(r=r.replace(`uid=${t}`,`uid=${e}`)),window.history.replaceState(null,``,r)}}}if(!r){let r=this.settingsStore?.getState().name||this.username,s=(this.username||``).split(`@`),c=s[0]||``,l=s[1]||``,u={UID:e,Size:o||0,RFC822Size:o||0,HasAttachments:a,Flags:[D,He],_isAutosaveUpdate:!0,Envelope:{Subject:i||`(No subject)`,Date:new Date().toISOString(),From:[{Name:r,Mailbox:c,Host:l}]}},d=this.messages.filter(e=>String(e.UID)!==String(t)&&String(e.UID)!==String(n));this.messages=[u,...d]}}},this._handleSettingsChange=()=>{this._syncSettings()},this._handleI18nChange=()=>{this.requestUpdate()},this.handleSyncStart=e=>{let t=e.detail;this.isSyncing=!0,t.background||(this.loadingMessages=!0)},this.handleSyncSuccess=e=>{this.isSyncing=!1;let{data:t,background:n}=e.detail;t.Username&&(this.username=t.Username,this.settingsStore.getState().loginUsername!==t.Username&&this.settingsStore.updateSettings({loginUsername:t.Username}));let r=this.mailboxes.length===0,i=!1,a=!1,o=0;if(t.Mailboxes){for(let e of t.Mailboxes){let t=e.Name||e.Mailbox,s=this.mailboxes.find(e=>(e.Name||e.Mailbox)===t),c=s?s.Total:void 0;c!==void 0&&e.Total!==void 0&&e.Total>c&&!r&&n&&(i=!0,t.toUpperCase()===`INBOX`&&(a=!0,o+=e.Total-c))}this.mailboxes=t.Mailboxes}if(i&&this.settingsStore.getState().soundNotifications&&(this.notificationSound.currentTime=0,this.notificationSound.play().catch(e=>{e.name!==`NotAllowedError`&&y.error(`Failed to play sound notification:`,e)})),a&&this.settingsStore.getState().desktopNotifications&&`Notification`in window&&Notification.permission===`granted`){let e=this.i18nStore?.t(`mailboxPage.newMessages`),t=o===1?this.i18nStore?.t(`mailboxPage.newMessagesSingleBody`):(this.i18nStore?.t(`mailboxPage.newMessagesMultiBody`)).replace(`{count}`,String(o));try{let n=new Notification(e,{body:t,icon:`/apple-touch-icon.png`,tag:`alps-new-message`});n.onclick=()=>{window.focus(),n.close(),this.currentMailbox===`INBOX`?(this.currentPage=0,E.fetch(this.currentMailbox,0,this.filterQuery,!1)):this.updateUrl(`INBOX`,0,null)}}catch(e){y.error(`Failed to show desktop notification:`,e)}}if(a&&this.currentMailbox!==`INBOX`&&this.showGlobalToast(this.i18nStore?.t(`mailboxPage.newMessagesInInbox`),this.i18nStore?.t(`mailboxPage.open`),()=>{this.updateUrl(`INBOX`,0,null)},5e3),n&&this.currentPage>0)t.Total!==void 0&&t.Total!==this.totalMessages&&this.showGlobalToast(this.i18nStore?.t(`mailboxPage.newMessagesAvailable`),this.i18nStore?.t(`mailboxPage.refresh`),()=>{this.currentPage=0,E.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)});else if(t.Page!==void 0&&(this.currentPage=t.Page),t.Total!==void 0&&(this.totalMessages=t.Total),t.MessagesPerPage!==void 0&&(this.messagesPerPage=t.MessagesPerPage),t.Messages){if(this.messages=t.Messages,this.selectedMessage){let e=this.messages.find(e=>String(e.UID)===String(this.selectedMessage.UID));e&&e.Flags&&(this.selectedMessage={...this.selectedMessage,Flags:e.Flags})}}else this.messages=[];n||(this.loadingMessages=!1,this.applyTargetUid(),this.showInitialLoader&&setTimeout(()=>{this.showInitialLoader=!1},100))},this.handleSyncError=e=>{this.isSyncing=!1;let{background:t}=e.detail;t||(this.loadingMessages=!1)},this.handleMailboxNotFound=()=>{this.showGlobalToast(this.i18nStore.t(`mailboxPage.mailboxNotFound`),``,void 0,3e3),this.updateUrl(C,0,null,null)},this.handleHashChange=()=>{let e=this.currentMailbox,t=this.currentPage,n=this.targetUid,r=this.filterQuery;this.extractMailboxFromHash(),e!==this.currentMailbox||t!==this.currentPage||r!==this.filterQuery?(e===this.currentMailbox?r!==this.filterQuery&&(this.loadingMessages=!0,this.currentPage=0):(this.selectedMessage=null,this.currentPage=0,this.selectedUids=new Set,this.loadingMessages=!0),E.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)):n!==this.targetUid&&this.applyTargetUid()},this.startResize=e=>{e.preventDefault(),this.isPaneDragging=!0;let t=e=>{if(this.layoutMode===`vertical`){let t=this.sidebarCollapsed?St:this.sidebarWidth,n=Math.max(t+wt,Math.min(e.clientX,window.innerWidth-Tt));this.resizerPositionX=n}else this.layoutMode===`horizontal`&&(this.listHeight=Math.max(Dt,Math.min(e.clientY-Et,window.innerHeight-Dt)))},n=()=>{this.isPaneDragging=!1,window.removeEventListener(`mousemove`,t),window.removeEventListener(`mouseup`,n)};window.addEventListener(`mousemove`,t),window.addEventListener(`mouseup`,n)}}static{this.styles=o`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      overflow: hidden;
      font-size: 14px;
    }
    
    svg {
      width: 1em;
      height: 1em;
      fill: currentColor;
    }
    
    /* Layout Configurations */
    .app-container {
      display: flex;
      flex: 1;
      min-height: 0;
      width: 100%;
      position: relative;
    }

    /* Vertical: Sidebar (250px) | Message List (min 300px) | Reader (flex) */
    .layout-vertical alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${yt}px); flex-shrink: 0; }
    .layout-vertical .main-view { flex: 1; display: flex; flex-direction: row; min-width: 0; }
    .layout-vertical .message-list-pane { width: ${wt}px; flex-shrink: 0; border-right: 1px solid var(--border-color); }
    .layout-vertical .message-reader-pane { flex: 1; min-width: 0; }

    /* Horizontal: Sidebar (250px) | [ Message List (50%) / Reader (50%) ] */
    .layout-horizontal alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${yt}px); flex-shrink: 0; }
    .layout-horizontal .main-view { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .layout-horizontal .message-list-pane { flex-shrink: 0; border-bottom: 1px solid var(--border-color); }
    .layout-horizontal .message-reader-pane { flex: 1; min-height: 0; }

    /* Full: Sidebar (250px) | Message List OR Reader */
    .layout-full alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${yt}px); flex-shrink: 0; }
    .layout-full .main-view { flex: 1; display: flex; min-width: 0; }
    .layout-full .message-list-pane { flex: 1; min-width: 0; }
    .layout-full .message-reader-pane { flex: 1; min-width: 0; }
    .layout-full.reading .message-list-pane { display: none; }
    .layout-full:not(.reading) .message-reader-pane { display: none; }

    .pane {
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      padding: 0;
    }
    
    .resizer {
      background: transparent;
      position: relative;
      z-index: 25;
      flex-shrink: 0;
    }

    .resizer::after {
      content: '';
      position: absolute;
      background: transparent;
      transition: background 0.2s;
    }

    .layout-vertical .resizer {
      width: 4px;
      margin: 0 -2px;
      cursor: col-resize;
    }

    .layout-vertical .resizer::after {
      width: 3px;
      top: 0;
      bottom: 0;
      left: 1px;
    }

    .layout-horizontal .resizer {
      height: 4px;
      margin: -2px 0;
      cursor: row-resize;
    }

    .layout-horizontal .resizer::after {
      height: 3px;
      left: 0;
      right: 0;
      top: 1px;
    }

    .resizer:hover, .resizer.dragging {
      z-index: 9999;
    }

    .resizer:hover::after, .resizer.dragging::after {
      background: var(--accent-color, #005A9E);
    }



    .app-container.dragging {
      user-select: none;
      pointer-events: none;
    }
    

    alps-sidebar.desktop-sidebar {
      transition: width 0.2s, z-index 0s 0.2s;
      position: relative;
      z-index: 20;
    }

    alps-sidebar.desktop-sidebar[collapsed]:hover {
      transition: width 0.2s, z-index 0s 0s;
    }

    .app-container.dragging alps-sidebar.desktop-sidebar {
      transition: none;
    }



    .app-container.collapsed {
      --sidebar-width: ${St}px;
    }

    .app-container.collapsed .message-list-pane {
      box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
      z-index: 25;
      border-left: 1px solid var(--border-color);
    }



    `}showGlobalToast(e,t=``,n,r=3e3){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e,actionLabel:t,actionFn:n,duration:r}}))}get effectiveListWidth(){let e=this.sidebarCollapsed&&!this.isMobile?St:this.sidebarWidth;return Math.max(wt,this.resizerPositionX-e)}get allSelectedStarred(){if(this.selectedUids.size===0)return!1;for(let e of this.selectedUids){let t=this.messages.find(t=>String(t.UID)===e);if(!t||!t.Flags?.includes(`\\Flagged`))return!1}return!0}get allSelectedUnread(){if(this.selectedUids.size===0)return!1;for(let e of this.selectedUids){let t=this.messages.find(t=>String(t.UID)===e);if(t&&t.Flags?.includes(`\\Seen`))return!1}return!0}connectedCallback(){super.connectedCallback(),this.extractMailboxFromHash(),window.addEventListener(`hashchange`,this.handleHashChange),document.addEventListener(`click`,this.unlockAudio),document.addEventListener(`keydown`,this.unlockAudio),this._mql.addEventListener(`change`,this._handleMediaQuery),this._handleMediaQuery(this._mql),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._syncSettings(),E.addEventListener(`sync-start`,this.handleSyncStart),E.addEventListener(`sync-success`,this.handleSyncSuccess),E.addEventListener(`sync-error`,this.handleSyncError),E.addEventListener(`mailbox-not-found`,this.handleMailboxNotFound),window.addEventListener(`draft-autosaved`,this.handleDraftAutosaved),E.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`hashchange`,this.handleHashChange),this._mql.removeEventListener(`change`,this._handleMediaQuery),document.removeEventListener(`click`,this.unlockAudio),document.removeEventListener(`keydown`,this.unlockAudio),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),E.removeEventListener(`sync-start`,this.handleSyncStart),E.removeEventListener(`sync-success`,this.handleSyncSuccess),E.removeEventListener(`sync-error`,this.handleSyncError),E.removeEventListener(`mailbox-not-found`,this.handleMailboxNotFound),window.removeEventListener(`draft-autosaved`,this.handleDraftAutosaved),E.stop()}_syncSettings(){let e=this.settingsStore.getState();this.layoutMode=e.layoutMode,this.densityMode=e.densityMode,this.sortOrder=e.sortOrder||`desc`,this.sidebarCollapsed!==e.sidebarCollapsed&&(this.sidebarCollapsed=e.sidebarCollapsed),e.messagesPerPage&&e.messagesPerPage>0&&(this.messagesPerPage=e.messagesPerPage),e.checkMailInterval!==void 0&&E.start(e.checkMailInterval)}openFolderPrompt(){let e=this.shadowRoot?.querySelector(`alps-folder-list`);e&&typeof e.triggerCreateFolder==`function`&&e.triggerCreateFolder()}updateUrl(e,t,n,r=this.filterQuery){let i=`#/mailbox/${encodeURIComponent(e)}`,a=new URLSearchParams;t>0&&a.set(`p`,t.toString()),n&&a.set(`uid`,n),r&&a.set(`q`,r);let o=a.toString();o&&(i+=`?`+o),window.location.hash=i}extractMailboxFromHash(){let e=window.location.hash;if(e.startsWith(`#/mailbox/`)){let t=e.substring(10),n=t.indexOf(`?`),r=``;n!==-1&&(r=t.substring(n+1),t=t.substring(0,n));let i=t.split(`/`);this.currentMailbox=decodeURIComponent(i[0]);let a=new URLSearchParams(r);i.length>1&&i[1]?this.targetUid=i[1]:this.targetUid=a.get(`uid`)||null;let o=a.get(`p`);o?this.currentPage=parseInt(o,10)||0:this.currentPage=0,this.filterQuery=a.get(`q`)||``}else this.currentMailbox=C,this.targetUid=null,this.currentPage=0}async applyTargetUid(){if(!this.targetUid){this.markReadTimer&&=(clearTimeout(this.markReadTimer),null),this.selectedMessage=null;return}let e=this.targetUid,t=this.messages.find(t=>String(t.UID)===e);if(!t&&this.messages.length>0)try{let n=await T(`/mailboxes/${encodeURIComponent(this.currentMailbox)}/messages/${e}`);if(n.ok){let e=await n.json();e.Message&&(t=e.Message)}}catch(e){y.error(`Failed to fetch shifted message:`,e)}this.targetUid===e&&(t?this.selectedMessage?.UID!==t.UID&&(this.selectedMessage=t,this.layoutMode===`full`&&this.expandedFolders.clear(),this._scheduleMarkAsRead(t)):this.messages.length>0&&(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)))}async selectMessage(e){this.updateUrl(this.currentMailbox,this.currentPage,e.UID)}_scheduleMarkAsRead(e){if(this.markReadTimer&&=(clearTimeout(this.markReadTimer),null),e.Flags?.includes(`\\Seen`))return;let t=this.settingsStore?.getState().markReadTimeout??0;t<0||(t===0?this._doMarkAsRead(e):this.markReadTimer=setTimeout(()=>{this._doMarkAsRead(e)},t*1e3))}updateLocalMessageFlags(e,t,n){let r=!1,i=[...this.messages];for(let a=0;a<i.length;a++){let o=i[a];if(e.includes(String(o.UID))){let e=o.Flags&&o.Flags.includes(t);n===`add`&&!e?(i[a]={...o,Flags:[...o.Flags||[],t]},r=!0):n===`remove`&&e&&(i[a]={...o,Flags:o.Flags.filter(e=>e!==t)},r=!0)}}if(r&&(this.messages=i,this.selectedMessage&&e.includes(String(this.selectedMessage.UID)))){let e=this.selectedMessage.Flags&&this.selectedMessage.Flags.includes(t);n===`add`&&!e?this.selectedMessage.Flags=[...this.selectedMessage.Flags||[],t]:n===`remove`&&e&&(this.selectedMessage.Flags=this.selectedMessage.Flags.filter(e=>e!==t)),this.selectedMessage={...this.selectedMessage}}}async _handleListToggleStar(e){let t=e.detail.message,n=t.Flags&&t.Flags.includes(`\\Flagged`),r=n?`remove`:`add`;this.updateLocalMessageFlags([String(t.UID)],Ve,r);try{await O.setFlag(this.currentMailbox,[String(t.UID)],[`\\Flagged`],r)||this.updateLocalMessageFlags([String(t.UID)],Ve,n?`add`:`remove`)}catch{this.updateLocalMessageFlags([String(t.UID)],Ve,n?`add`:`remove`)}}async _doMarkAsRead(e){if(this.selectedMessage?.UID===e.UID)this.selectedMessage=await O.markAsRead(this.currentMailbox,e),this.updateLocalMessageFlags([String(this.selectedMessage.UID)],D,`add`);else{let t=await O.markAsRead(this.currentMailbox,e);t&&t.UID&&this.updateLocalMessageFlags([String(t.UID)],D,`add`)}}async _handleReaderAction(e){let t=e.detail.action,n=this.selectedUids&&this.selectedUids.size>0,r=n?Array.from(this.selectedUids):[];if(!(!n&&!this.selectedMessage?.UID)){n&&(this.bulkProcessing=!0);try{let i=this.selectedMessage,a=this.currentMailbox;if(t===`star`)if(n){let e=this.allSelectedStarred?`remove`:`add`;await O.setFlag(this.currentMailbox,r,[Ve],e),this.updateLocalMessageFlags(r,Ve,e)}else this.selectedMessage=await O.toggleStar(this.currentMailbox,this.selectedMessage),this.updateLocalMessageFlags([String(this.selectedMessage.UID)],Ve,this.selectedMessage.Flags?.includes(`\\Flagged`)?`add`:`remove`);else if(t===`markUnread`)if(n){let e=this.allSelectedUnread?`add`:`remove`;await O.setFlag(this.currentMailbox,r,[D],e),this.updateLocalMessageFlags(r,D,e)}else !i?.Flags||!i.Flags.includes(`\\Seen`)?(this.selectedMessage=await O.markAsRead(this.currentMailbox,i),this.updateLocalMessageFlags([String(this.selectedMessage.UID)],D,`add`)):await O.markAsUnread(this.currentMailbox,i)&&(this.updateLocalMessageFlags([String(i.UID)],D,`remove`),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null));else if(t===`delete`||t===`archive`||t===`reportSpam`||t===`notSpam`){let e=this.currentMailbox.toLowerCase()===Me.toLowerCase(),o=this.currentMailbox.toLowerCase()===Ee.toLowerCase(),s=this.currentMailbox.toLowerCase()===`junk`||this.currentMailbox.toLowerCase()===`spam`,c={success:!1},l=Me;if(t===`archive`&&(l=Oe),t===`reportSpam`&&(l=je),t===`notSpam`&&(l=C),t===`delete`&&(e||o||s)){this.pendingDeleteDetails={isBulk:n,uidsArray:r,currentMsgUid:i?.UID,isTrash:e,isDrafts:o,isSpam:s},this.showDeleteConfirm=!0;return}else c=n?await O.moveMessages(this.currentMailbox,r,l):await O.moveMessages(this.currentMailbox,[String(i.UID)],l);if(c.success){n?(this.selectedUids=new Set,this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null),this.requestUpdate()):(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null));let e=``,o,s=n?`${r.length} messages`:`Message`;if(e=t===`archive`?`${s} moved to Archive`:t===`reportSpam`?`${s} moved to Spam`:t===`notSpam`?`${s} moved to Inbox`:`${s} moved to Trash`,n&&c.uidMapping){let e=Object.values(c.uidMapping);o=async()=>{try{let t=await O.moveMessages(l,e,a);if(t.success&&this.currentMailbox===a&&t.uidMapping){let e=new Set(this.selectedUids);Object.values(t.uidMapping).forEach(t=>e.add(t)),this.selectedUids=e,this.requestUpdate()}}catch(e){y.error(`Undo failed`,e)}}}else if(!n&&c.uidMapping?.[String(i.UID)]){let e={UID:c.uidMapping[String(i.UID)]};o=async()=>{try{let t=await O.moveMessages(l,[String(e.UID)],a);if(t.success){let n=this.currentMailbox===a?this.currentPage:0;t.uidMapping?.[String(e.UID)]?this.updateUrl(a,n,t.uidMapping[String(e.UID)]):this.updateUrl(a,n,null)}}catch(e){y.error(`Undo failed`,e)}}}this.showGlobalToast(e,o?this.i18nStore?.t(`mailboxPage.undo`):``,o,vt)}}else if(t===`moveTo`||t===`copyTo`){let o=e.detail.folder;if(!o)return;let s=t===`moveTo`,c={success:!1};if(c=s?n?await O.moveMessages(this.currentMailbox,r,o):await O.moveMessages(this.currentMailbox,[String(i.UID)],o):n?await O.copyMessages(this.currentMailbox,r,o):await O.copyMessages(this.currentMailbox,[String(i.UID)],o),c.success){s&&(n?(this.selectedUids=new Set,this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null),this.requestUpdate()):(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)));let e=n?`${r.length} messages`:`Message`,t=s?`${e} moved to ${o}`:`${e} copied to ${o}`,l;if(n&&s&&c.uidMapping){let e=Object.values(c.uidMapping);l=async()=>{try{let t=await O.moveMessages(o,e,a);if(t.success&&this.currentMailbox===a&&t.uidMapping){let e=new Set(this.selectedUids);Object.values(t.uidMapping).forEach(t=>e.add(t)),this.selectedUids=e,this.requestUpdate()}}catch(e){y.error(`Undo failed`,e)}}}else if(!n&&s&&c.uidMapping?.[String(i.UID)]){let e={UID:c.uidMapping[String(i.UID)]};l=async()=>{try{let t=await O.moveMessages(o,[String(e.UID)],a);if(t.success){let n=this.currentMailbox===a?this.currentPage:0;t.uidMapping?.[String(e.UID)]?this.updateUrl(a,n,t.uidMapping[String(e.UID)]):this.updateUrl(a,n,null)}}catch(e){y.error(`Undo failed`,e)}}}this.showGlobalToast(t,l?this.i18nStore?.t(`mailboxPage.undo`):``,l,vt)}}else if(t===`downloadMessage`&&!n){let e=i.UID,t=`/mailboxes/${encodeURIComponent(this.currentMailbox)}/messages/${e}/raw`,n=document.createElement(`a`);n.href=t,n.download=``,document.body.appendChild(n),n.click(),document.body.removeChild(n)}else if(t===`showOriginal`&&!n){let e=`#/original?mailbox=${encodeURIComponent(this.currentMailbox)}&uid=${i.UID}`;window.open(e,`_blank`)}}finally{n&&(this.bulkProcessing=!1)}}}async _confirmDelete(){this.showDeleteConfirm=!1;let e=this.pendingDeleteDetails;if(this.pendingDeleteDetails=null,!e)return;let{isBulk:t,uidsArray:n,currentMsgUid:r,isDrafts:i}=e;t&&(this.bulkProcessing=!0);try{let e=!1;if(e=t?await O.deleteMessages(this.currentMailbox,n):await O.deleteMessages(this.currentMailbox,[String(r)]),e){t?(this.selectedUids=new Set,this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null),this.requestUpdate()):(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null));let e=``;e=i?t?`${n.length} drafts discarded`:this.i18nStore?.t(`toast.draftDiscarded`):t?`${n.length} messages permanently deleted`:this.i18nStore?.t(`toast.messagePermanentlyDeleted`),this.showGlobalToast(e,``,void 0,vt)}}finally{t&&(this.bulkProcessing=!1)}}_cancelDelete(){this.showDeleteConfirm=!1,this.pendingDeleteDetails=null}toggleFolder(e,t){t&&(t.stopPropagation(),t.preventDefault());let n=new Set(this.expandedFolders);n.has(e)?n.delete(e):n.add(e),this.expandedFolders=n}render(){let e=this.isMobile?`full`:this.layoutMode,t=e===`full`&&this.selectedMessage!==null;return s`
      <alps-initial-loader ?hidden=${!this.showInitialLoader}></alps-initial-loader>
      <app-header 
        .username=${this.username}
        .isMobile=${this.isMobile}
        .currentMailbox=${this.currentMailbox}
        .searchQuery=${this.filterQuery}
        .scrolled=${this.listScrolled}
        @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
        @compose=${()=>this.composeStore.openComposer()}
        @search-submit=${e=>{let t=e.detail.value;this.updateUrl(this.currentMailbox,0,null,t)}}
      ></app-header>
      <div class="app-container layout-${e} ${t?`reading`:``} ${this.isPaneDragging||this.isSidebarDragging?`dragging`:``} ${this.sidebarCollapsed&&!this.isMobile?`collapsed`:``} ${this.isMobile?`mobile-view`:``} ${this.suppressSidebarHover?`suppress-sidebar-hover`:``}" style="${!this.sidebarCollapsed&&!this.isMobile?`--sidebar-width: ${this.sidebarWidth}px;`:``}">
        <alps-sidebar 
          class="${this.isMobile?`mobile-sidebar`:`desktop-sidebar`} ${this.mobileSidebarOpen?`open`:``}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
          .isHovered=${this.isSidebarHovered}
          .suppressHover=${this.suppressSidebarHover}
          .collapsed=${this.sidebarCollapsed&&!this.isMobile}
          .width=${this.sidebarWidth}
          @sidebar-resize=${e=>{let t=e.detail.newWidth;t<Ct?(this.sidebarCollapsed||this.settingsStore.updateSettings({sidebarCollapsed:!0}),this.sidebarWidth=yt):(this.sidebarCollapsed&&this.settingsStore.updateSettings({sidebarCollapsed:!1}),this.sidebarWidth=Math.min(Math.max(t,bt),xt),this.resizerPositionX=Math.max(this.resizerPositionX,this.sidebarWidth+wt))}}
          @drag-start=${()=>this.isSidebarDragging=!0}
          @drag-end=${()=>this.isSidebarDragging=!1}
          @toggle-collapse=${()=>this.settingsStore.updateSettings({sidebarCollapsed:!this.sidebarCollapsed})}
          @close-sidebar=${()=>this.mobileSidebarOpen=!1}
          @mouseenter=${()=>{this.hoverTimeout&&=(clearTimeout(this.hoverTimeout),null),this.isSidebarHovered=!0,this.suppressSidebarHover=!1}}
          @mouseleave=${()=>{this.hoverTimeout=setTimeout(()=>{this.isSidebarHovered=!1},300)}}
        >
          <alps-folder-list
            .mailboxes=${this.mailboxes}
            .currentMailbox=${this.currentMailbox}
            .expandedFolders=${this.expandedFolders}
            .layoutMode=${e}
            .syncing=${this.isSyncing}
            ?collapsed=${this.sidebarCollapsed&&!this.isMobile&&!this.isSidebarHovered}
            @select-mailbox=${e=>{this.currentMailbox===e.detail.name?(this.currentPage=0,this.selectedMessage=null,this.filterQuery=``,this.loadingMessages=!0,this.updateUrl(e.detail.name,0,null),E.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)):(this.loadingMessages=!0,this.filterQuery=``,this.selectedUids=new Set,this.updateUrl(e.detail.name,0,null)),!this.isMobile&&!this.sidebarCollapsed&&this.settingsStore.updateSettings({sidebarCollapsed:!0}),this.sidebarCollapsed&&!this.isMobile&&(this.suppressSidebarHover=!0),this.isMobile&&(this.mobileSidebarOpen=!1)}}
            @toggle-folder=${e=>this.toggleFolder(e.detail.folderName,null)}
            @expand-folder=${e=>{let t=new Set(this.expandedFolders);t.add(e.detail.folderName),this.expandedFolders=t}}
            @compose=${()=>{this.composeStore.openComposer(),this.isMobile&&(this.mobileSidebarOpen=!1)}}
            @toast=${e=>this.showGlobalToast(e.detail.message,e.detail.actionLabel,e.detail.actionFn,e.detail.duration)}
          ></alps-folder-list>
          <alps-icon-btn 
            slot="footer-actions"
            class="new-folder-btn"
            icon="folderPlus"
            title="${this.i18nStore?.t(`folderList.createFolder`)}"
            @click=${this.openFolderPrompt}
            style="--btn-padding: 8px; --icon-size: 20px;"
          ></alps-icon-btn>
        </alps-sidebar>
        <div class="main-view">
          <div class="pane message-list-pane" style="position: relative; ${e===`vertical`?`width: ${this.effectiveListWidth}px; flex: none; ${this.isPaneDragging?``:`transition: width 0.2s;`}`:e===`horizontal`?`height: ${this.listHeight}px; flex: none;`:``}">

            <alps-message-list
              .messages=${this.messages}
              .currentMailbox=${this.currentMailbox}
              .sidebarCollapsed=${this.sidebarCollapsed&&!this.isMobile}
              .loading=${this.loadingMessages}
              .selectedMessage=${this.selectedMessage}
              .selectedMessages=${this.selectedUids}
              .layoutMode=${e}
              .isMobile=${this.isMobile}
              .currentPage=${this.currentPage}
              .totalMessages=${this.totalMessages}
              .messagesPerPage=${this.messagesPerPage}
              .densityMode=${this.densityMode}
              .filterQuery=${this.filterQuery}
              .sortOrder=${this.sortOrder}
              .syncing=${this.isSyncing}
              @refresh=${()=>{this.currentPage=0,E.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0)}}
              @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
              @compose=${()=>this.composeStore.openComposer()}
              @select-message=${e=>this.selectMessage(e.detail.message)}
              @change-page=${e=>this.updateUrl(this.currentMailbox,e.detail.page,this.targetUid)}
              @list-scrolled=${e=>this.listScrolled=e.detail.scrolled}
              @toggle-sort=${async()=>{let e=this.sortOrder===`asc`?`desc`:`asc`;this.messages=[],this.loadingMessages=!0,await this.settingsStore.updateSettings({sortOrder:e}),this.currentPage=0,E.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)}}
              @toggle-filter-starred=${()=>{let e=this.filterQuery===`is:starred`?``:`is:starred`;this.updateUrl(this.currentMailbox,0,null,e)}}
              @toggle-filter-unread=${()=>{let e=this.filterQuery===`is:unread`?``:`is:unread`;this.updateUrl(this.currentMailbox,0,null,e)}}
              @clear-search=${()=>this.updateUrl(this.currentMailbox,0,null,``)}
              @selection-changed=${e=>this.selectedUids=e.detail.selectedUids}
              @toggle-star-message=${this._handleListToggleStar}
            ></alps-message-list>
          </div>
          ${e===`full`?``:s`
            <div class="resizer ${this.isPaneDragging?`dragging`:``}" @mousedown=${this.startResize}></div>
          `}
          <div class="pane message-reader-pane">
            <alps-message-reader
              .mailboxes=${this.mailboxes}
              .mailbox=${this.currentMailbox}
              .message=${this.selectedMessage}
              .layoutMode=${e}
              .selectedUids=${this.selectedUids}
              .allSelectedStarred=${this.allSelectedStarred}
              .allSelectedUnread=${this.allSelectedUnread}
              .bulkProcessing=${this.bulkProcessing}
              @close=${()=>{this.updateUrl(this.currentMailbox,this.currentPage,null)}}
              @action=${this._handleReaderAction}
            ></alps-message-reader>
          </div>
        </div>
      </div>
      ${this.showDeleteConfirm?s`
        <ui-confirm
          title="${this.i18nStore?.t(`mailboxPage.permanentlyDelete`)}"
          message=${this.pendingDeleteDetails?.isBulk?this.i18nStore?.t(`messageReader.deleteConfirmMultiple`):this.i18nStore?.t(`messageReader.deleteConfirmSingle`)}
          confirmText="Delete Permanently"
          cancelText="Cancel"
          .isDanger=${!0}
          @confirm=${this._confirmDelete}
          @cancel=${this._cancelDelete}
        ></ui-confirm>
      `:``}
    `}};A([f({context:k})],U.prototype,`composeStore`,void 0),A([f({context:S})],U.prototype,`settingsStore`,void 0),A([f({context:x})],U.prototype,`i18nStore`,void 0),A([_()],U.prototype,`showDeleteConfirm`,void 0),A([_()],U.prototype,`pendingDeleteDetails`,void 0),A([_()],U.prototype,`mailboxes`,void 0),A([_()],U.prototype,`messages`,void 0),A([_()],U.prototype,`currentMailbox`,void 0),A([_()],U.prototype,`loadingMessages`,void 0),A([_()],U.prototype,`showInitialLoader`,void 0),A([_()],U.prototype,`selectedMessage`,void 0),A([_()],U.prototype,`selectedUids`,void 0),A([_()],U.prototype,`layoutMode`,void 0),A([_()],U.prototype,`filterQuery`,void 0),A([_()],U.prototype,`expandedFolders`,void 0),A([_()],U.prototype,`username`,void 0),A([_()],U.prototype,`currentPage`,void 0),A([_()],U.prototype,`totalMessages`,void 0),A([_()],U.prototype,`messagesPerPage`,void 0),A([_()],U.prototype,`resizerPositionX`,void 0),A([_()],U.prototype,`listHeight`,void 0),A([_()],U.prototype,`isSidebarDragging`,void 0),A([_()],U.prototype,`isPaneDragging`,void 0),A([_()],U.prototype,`sidebarWidth`,void 0),A([_()],U.prototype,`isSidebarHovered`,void 0),A([_()],U.prototype,`densityMode`,void 0),A([_()],U.prototype,`isSyncing`,void 0),A([_()],U.prototype,`sidebarCollapsed`,void 0),A([_()],U.prototype,`suppressSidebarHover`,void 0),A([_()],U.prototype,`sortOrder`,void 0),A([_()],U.prototype,`listScrolled`,void 0),A([_()],U.prototype,`targetUid`,void 0),A([_()],U.prototype,`isMobile`,void 0),A([_()],U.prototype,`mobileSidebarOpen`,void 0),A([_()],U.prototype,`bulkProcessing`,void 0),U=A([a(`mailbox-page`)],U);var W=new class{async fetchContacts(e=``){let t=await T(e?`/contacts?query=${encodeURIComponent(e)}`:`/contacts`);if(!t.ok)throw Error(`Failed to fetch contacts: ${t.statusText}`);return t.json()}async fetchContact(e){let t=await T(`/contacts/${encodeURIComponent(e)}`);if(!t.ok)throw Error(`Failed to fetch contact: ${t.statusText}`);return t.json()}async createContact(e){let t=await T(`/contacts/create`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(!t.ok)throw Error(`Failed to create contact: ${t.statusText}`);return t.json()}async updateContact(e,t){let n=await T(`/contacts/${encodeURIComponent(e)}/edit`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!n.ok)throw Error(`Failed to update contact: ${n.statusText}`);return n.json()}async deleteContact(e){let t=await T(`/contacts/${encodeURIComponent(e)}`,{method:`DELETE`});if(!t.ok)throw Error(`Failed to delete contact: ${t.statusText}`)}async bulkUpdateContacts(e){let t=e.map(e=>e.path?this.updateContact(e.path,e):Promise.resolve());await Promise.all(t)}async bulkDeleteContacts(e){let t=e.map(e=>this.deleteContact(e));await Promise.all(t)}},G=class extends p{constructor(...e){super(...e),this.contacts=[],this.sortOrder=`asc`,this.showOnlyStarred=!1,this.loading=!0,this.isSpinning=!1,this.showInitialLoader=!0,this.selectedContact=null,this.filterQuery=``,this.isEditing=!1,this.saving=!1,this.selectedCategory=``,this.showCreatePrompt=!1,this.showDeleteConfirm=!1,this.addedCategories=[],this.sidebarWidth=250,this.listWidth=380,this.sidebarCollapsed=!1,this.isSidebarHovered=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.hoverTimeout=null,this.suppressSidebarHover=!1,this.isSidebarDragging=!1,this.isPaneDragging=!1,this.densityMode=`compact`,this.selectedContacts=new Set,this.listScrolled=!1,this.categoryToRename=null,this.categoryToDelete=null,this._handleSettingsChange=()=>{if(this.settingsStore){let e=this.settingsStore.getState();this.sidebarCollapsed=e.sidebarCollapsed,this.densityMode=e.densityMode||`compact`}},this._handleWindowResize=()=>{this.isMobile=window.innerWidth<=768},this._handleHashChange=()=>{this.contacts=this.contacts.filter(e=>!e.isTemporary);let e=window.location.hash.match(/^#\/contacts\/?([^\/]*)\/?(.*)$/);if(e){let t=e[1]?decodeURIComponent(e[1]):``,n=e[2]?decodeURIComponent(e[2]):``,r=t===`all`||!t?``:t;if(this.selectedCategory!==r&&(this.selectedCategory=r,this.selectedContacts=new Set,this.isMobile&&(this.mobileSidebarOpen=!1)),n){if((this.selectedContact?.uid?.replace(/^urn:uuid:/,``)||this.selectedContact?.path)!==n){if(this.contacts.length===0)return;let e=this.contacts.find(e=>(e.uid?.replace(/^urn:uuid:/,``)||e.path)===n);e&&this.selectContact(e,!1)}}else this.selectedContact=null,this.isEditing=!1}else this.selectedContact=null,this.isEditing=!1},this.startResize=e=>{e.preventDefault(),this.isPaneDragging=!0;let t=e.clientX,n=this.listWidth,r=e=>{let r=e.clientX-t;this.listWidth=Math.max(250,Math.min(800,n+r))},i=()=>{this.isPaneDragging=!1,window.removeEventListener(`mousemove`,r),window.removeEventListener(`mouseup`,i)};window.addEventListener(`mousemove`,r),window.addEventListener(`mouseup`,i)}}static{this.styles=[U.styles,R.styles,Ye,o`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary, #ffffff);
      color: var(--text-primary, #111827);
      overflow: hidden;
    }
    .folder-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .contact-list-pane {
      background: var(--bg-primary, #ffffff);
      display: flex;
      flex-direction: column;
      position: relative;
      border-right: 1px solid var(--border-color, #e5e7eb);
    }
    .resizer {
      background: transparent;
      position: relative;
      z-index: 25;
      flex-shrink: 0;
      width: 4px;
      margin: 0 -2px;
      cursor: col-resize;
    }
    .resizer::after {
      content: '';
      position: absolute;
      background: transparent;
      transition: background 0.2s;
      width: 3px;
      top: 0;
      bottom: 0;
      left: 1px;
    }
    .resizer:hover, .resizer.dragging {
      z-index: 9999;
    }
    .resizer:hover::after, .resizer.dragging::after {
      background: var(--accent-color, #005A9E);
      width: 3px;
      left: 0;
    }
    .app-container.collapsed .contact-list-pane {
      box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
      z-index: 25;
      border-left: 1px solid var(--border-color, #e5e7eb);
    }
    .contact-reader-pane {
      background: var(--bg-primary, #ffffff);
      padding: 24px;
      overflow-y: auto;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted, #9ca3af);
    }
    .contact-detail-header {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .contact-detail-email {
      font-size: 16px;
      color: var(--text-secondary, #4b5563);
      margin-bottom: 24px;
    }
    .contact-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 400px;
    }
    .edit-textarea {
      width: 100%;
      min-height: 80px;
      padding: 8px 12px;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      box-sizing: border-box;
    }
    .contact-details-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .detail-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .detail-value {
      font-size: 14px;
      color: var(--text-primary, #111827);
      white-space: pre-wrap;
    }

  `]}updated(e){if(super.updated(e),e.has(`densityMode`)){let e=this.settingsStore?.getState().densityMode||`normal`;this.dataset.density=e;let t=this.shadowRoot?.querySelector(`.contact-list-pane`);t&&(t.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),t.classList.add(`density-${e}`))}e.has(`loading`)&&this.loading&&(this.isSpinning=!0)}handleSpinIteration(){this.loading||(this.isSpinning=!1)}connectedCallback(){super.connectedCallback(),this.showInitialLoader=!0,this.classList.add(`density-compact`);let e=localStorage.getItem(`contacts_categories_cache`);if(e)try{this.addedCategories=JSON.parse(e)}catch{}this.fetchContacts(),window.addEventListener(`resize`,this._handleWindowResize),window.addEventListener(`hashchange`,this._handleHashChange),this.settingsStore&&(this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._handleSettingsChange()),setTimeout(()=>this._handleHashChange(),0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this._handleWindowResize),window.removeEventListener(`hashchange`,this._handleHashChange),this.settingsStore&&this.settingsStore.removeEventListener(`change`,this._handleSettingsChange)}get uniqueCategories(){let e=new Set(this.addedCategories);for(let t of this.contacts)if(t.categories)for(let n of t.categories)e.add(n);return Array.from(e).sort((e,t)=>e.localeCompare(t))}get username(){return this.settingsStore?.getState().loginUsername||``}async fetchContacts(){this.loading=!0;try{let e=await W.fetchContacts(this.filterQuery);this.contacts=e.contacts||[],this._handleHashChange()}catch(e){console.error(`Failed to fetch contacts`,e)}finally{this.loading=!1,this.showInitialLoader&&setTimeout(()=>{this.showInitialLoader=!1},100)}}async selectContact(e,t=!0){if(e.isTemporary){this.selectedContact=e,this.isEditing=!0;return}if(t){let t=this.selectedCategory?encodeURIComponent(this.selectedCategory):`all`,n=e.uid?.replace(/^urn:uuid:/,``)||e.path;window.location.hash=`/contacts/${t}/${encodeURIComponent(n)}`;return}if(this.selectedContacts.size>0&&(this.selectedContacts=new Set),this.selectedContact?.path!==e.path){this.selectedContact={...e},this.isEditing=!1;try{let t=await W.fetchContact(e.path);this.selectedContact?.path===t.path&&(this.selectedContact=t)}catch(e){console.error(`Failed to fetch contact details`,e)}}}get allSelectedStarred(){if(this.selectedContacts.size===0)return!1;for(let e of this.selectedContacts){let t=this.contacts.find(t=>t.path===e);if(!t||!t.categories?.includes(`Favorites`))return!1}return!0}async handleToggleStar(e,t){if(e.stopPropagation(),t.isTemporary)return;let n=t.categories?[...t.categories]:[],r=n.includes(v);r?n=n.filter(e=>e!==v):n.push(v),this.contacts=this.contacts.map(e=>e.path===t.path?{...e,categories:n}:e);try{let e={name:t.name||``,email:t.email||``,phone:t.phone||``,organization:t.organization||``,address:t.address||``,birthday:t.birthday||``,note:t.note||``,url:t.url||``,nickname:t.nickname||``,categories:n};await W.updateContact(t.path,e),this.selectedContact?.path===t.path&&(this.selectedContact={...this.selectedContact,categories:n})}catch(e){console.error(`Failed to toggle star:`,e),r?t.categories.push(v):t.categories=t.categories.filter(e=>e!==v),this.requestUpdate()}}handleSelectAll(e){let t=e;if(t.detail?t.detail.checked:e.target.checked){let e=this.contacts.filter(e=>!(this.selectedCategory&&(!e.categories||!e.categories.includes(this.selectedCategory))));this.selectedContacts=new Set(e.map(e=>e.path))}else this.selectedContacts=new Set}handleSelectContact(e,t){e.stopPropagation();let n=new Set(this.selectedContacts);n.has(t)?n.delete(t):n.add(t),this.selectedContacts=n}handleCreateCategorySubmit(e){let t=e.detail.name?.trim();t&&(this.addedCategories.includes(t)||(this.addedCategories=[...this.addedCategories,t],localStorage.setItem(`contacts_categories_cache`,JSON.stringify(this.addedCategories)))),this.showCreatePrompt=!1}handleCreateNew(){this.selectedContacts=new Set;let e={name:this.i18nStore?.t(`contacts.unnamedContact`),categories:this.selectedCategory?[this.selectedCategory]:[],isTemporary:!0};this.contacts=this.contacts.filter(e=>!e.isTemporary),this.contacts=[e,...this.contacts],this.selectedContact=e,this.isEditing=!0}async handleRenameCategorySubmit(e){let t=e.detail.name?.trim();if(!t||!this.categoryToRename||t===this.categoryToRename){this.categoryToRename=null;return}let n=this.categoryToRename;this.categoryToRename=null,this.addedCategories.includes(n)&&(this.addedCategories=this.addedCategories.map(e=>e===n?t:e),localStorage.setItem(`contacts_categories_cache`,JSON.stringify(this.addedCategories))),this.selectedCategory===n&&(this.selectedCategory=t,window.location.hash=`/contacts/${encodeURIComponent(t)}`);let r=this.contacts.filter(e=>e.categories?.includes(n));if(r.length>0){this.saving=!0;try{let e=r.map(e=>{let r=e.categories.map(e=>e===n?t:e);return{...e,categories:r}});await W.bulkUpdateContacts(e),this.fetchContacts()}catch(e){console.error(`Error renaming category`,e)}finally{this.saving=!1}}}async handleDeleteCategorySubmit(){if(!this.categoryToDelete)return;let e=this.categoryToDelete;this.categoryToDelete=null,this.addedCategories.includes(e)&&(this.addedCategories=this.addedCategories.filter(t=>t!==e),localStorage.setItem(`contacts_categories_cache`,JSON.stringify(this.addedCategories))),this.selectedCategory===e&&(this.selectedCategory=``,window.location.hash=`/contacts/all`);let t=this.contacts.filter(t=>t.categories?.includes(e));if(t.length>0){this.saving=!0;try{let n=t.map(t=>{let n=t.categories.filter(t=>t!==e);return{...t,categories:n}});await W.bulkUpdateContacts(n),this.fetchContacts()}catch(e){console.error(`Error deleting category`,e)}finally{this.saving=!1}}}handleEdit(){this.isEditing=!0}handleCancelEdit(){this.isEditing=!1,this.selectedContact?.isTemporary&&(this.selectedContact=null,this.contacts=this.contacts.filter(e=>!e.isTemporary),this.selectedCategory||(window.location.hash=`/contacts/all`))}async handleSave(e){this.saving=!0;try{e.categories&&typeof e.categories==`string`?e.categories=e.categories.split(`,`).map(e=>e.trim()).filter(e=>e):e.categories=[];let t;t=this.selectedContact&&!this.selectedContact.isTemporary?await W.updateContact(this.selectedContact.path,e):await W.createContact(e);let n={...e,path:t.path||(this.selectedContact&&!this.selectedContact.isTemporary?this.selectedContact.path:``)},r=this.contacts.findIndex(e=>this.selectedContact&&(e.path===this.selectedContact.path||e.isTemporary&&this.selectedContact.isTemporary));r>-1?(this.contacts[r]={...this.contacts[r],...n},delete this.contacts[r].isTemporary,this.contacts=[...this.contacts]):this.contacts=[n,...this.contacts],this.selectedContact={...this.selectedContact,...n},delete this.selectedContact.isTemporary}catch(e){console.error(`Error saving contact`,e)}finally{this.saving=!1}}handleSaveEvent(e){this.handleSave(e.detail)}async handleToggleStarEvent(){let e=this.selectedContacts.size>1?Array.from(this.selectedContacts):[this.selectedContact?.path].filter(Boolean);if(e.length===0)return;let t=e.length>1?this.allSelectedStarred:this.contacts.find(t=>t.path===e[0])?.categories?.includes(`Favorites`)||!1;this.saving=!0;try{let n=e.map(e=>{let n=this.contacts.findIndex(t=>t.path===e);if(n===-1)return;let r=this.contacts[n],i=r.categories?[...r.categories]:[];return t?i=i.filter(e=>e!==v):i.includes(`Favorites`)||i.push(v),this.contacts[n]={...r,categories:i},this.selectedContact?.path===e&&(this.selectedContact={...this.selectedContact,categories:i}),{...r,categories:i}}).filter(Boolean);this.contacts=[...this.contacts],await W.bulkUpdateContacts(n)}catch(e){console.error(`Error toggling star`,e)}finally{this.saving=!1}}handleDelete(){this.showDeleteConfirm=!0}async confirmDelete(){this.showDeleteConfirm=!1,this.saving=!0;try{let e=this.selectedContacts.size>1?Array.from(this.selectedContacts):[this.selectedContact?.path].filter(Boolean);await W.bulkDeleteContacts(e),this.selectedContact=null,this.selectedContacts.size>1&&(this.selectedContacts=new Set),this.isEditing=!1,this.fetchContacts()}catch(e){console.error(`Error deleting contacts`,e),alert(`Failed to delete one or more contacts`)}finally{this.saving=!1}}async handleUpdateCategories(e){let t=e.detail.category;typeof t==`string`&&(t=t.trim()),t&&!this.addedCategories.includes(t)&&(this.addedCategories=[...this.addedCategories,t],localStorage.setItem(`contacts_categories_cache`,JSON.stringify(this.addedCategories)));let n=this.selectedContacts.size>1?Array.from(this.selectedContacts):[this.selectedContact?.path].filter(Boolean);if(n.length!==0){this.saving=!0;try{let e=n.map(e=>{let n=this.contacts.findIndex(t=>t.path===e);if(n===-1)return;let r=this.contacts[n],i=r.categories?[...r.categories]:[];return t===``?i=[]:i.includes(t)?i=i.filter(e=>e!==t):i.push(t),this.contacts[n]={...r,categories:i},this.selectedContact?.path===e&&(this.selectedContact={...this.selectedContact,categories:i}),{...r,categories:i}}).filter(Boolean);if(await W.bulkUpdateContacts(e),this.contacts=[...this.contacts],this.selectedContact&&this.selectedContacts.size<=1&&this.selectedCategory!==``&&!this.selectedContact.categories?.includes(this.selectedCategory)){let e=this.selectedContact.uid?.replace(/^urn:uuid:/,``)||this.selectedContact.path;e&&(window.location.hash=`#/contacts/all/${encodeURIComponent(e)}`)}this.selectedCategory!==``&&this.selectedCategory!==`All Contacts`&&this.fetchContacts()}catch(e){console.error(`Error updating categories`,e)}finally{this.saving=!1}}}render(){return s`
      ${this.showDeleteConfirm?s`
        <ui-confirm
          title="${this.i18nStore?.t(`contacts.deleteContact`)}"
          message="${this.i18nStore?.t(`contacts.deleteContactConfirm`)}"
          confirmText="${this.i18nStore?.t(`contacts.delete`)}"
          isDanger
          @confirm=${this.confirmDelete}
          @cancel=${()=>this.showDeleteConfirm=!1}
        ></ui-confirm>
      `:``}
      <alps-initial-loader ?hidden=${!this.showInitialLoader}></alps-initial-loader>
      <app-header 
        currentTab="contacts"
        .username=${this.username}
        .isMobile=${this.isMobile}
        .searchQuery=${this.filterQuery}
        .scrolled=${this.listScrolled}
        @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
        @search-submit=${e=>{this.filterQuery=e.detail.value,this.fetchContacts()}}
      ></app-header>
      <div class="app-container layout-vertical ${this.sidebarCollapsed&&!this.isMobile?`collapsed`:``} ${this.isPaneDragging||this.isSidebarDragging?`dragging`:``} ${this.isMobile?`mobile-view`:``} ${this.suppressSidebarHover?`suppress-sidebar-hover`:``}" style="${!this.sidebarCollapsed&&!this.isMobile?`--sidebar-width: ${this.sidebarWidth}px;`:``}">
        <alps-sidebar 
          class="${this.isMobile?`mobile-sidebar`:`desktop-sidebar`} ${this.mobileSidebarOpen?`open`:``}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
          .isHovered=${this.isSidebarHovered}
          .suppressHover=${this.suppressSidebarHover}
          .width=${this.sidebarWidth}
          .collapsed=${this.sidebarCollapsed&&!this.isMobile}
          @sidebar-resize=${e=>{let t=e.detail.newWidth;t<120?(this.sidebarCollapsed||this.settingsStore?.updateSettings({sidebarCollapsed:!0}),this.sidebarWidth=250):(this.sidebarCollapsed&&this.settingsStore?.updateSettings({sidebarCollapsed:!1}),this.sidebarWidth=Math.min(Math.max(t,150),500))}}
          @drag-start=${()=>this.isSidebarDragging=!0}
          @drag-end=${()=>this.isSidebarDragging=!1}
          @toggle-collapse=${()=>this.settingsStore?.updateSettings({sidebarCollapsed:!this.sidebarCollapsed})}
          @close-sidebar=${()=>this.mobileSidebarOpen=!1}
          @mouseenter=${()=>{this.hoverTimeout&&=(clearTimeout(this.hoverTimeout),null),this.isSidebarHovered=!0,this.suppressSidebarHover=!1}}
          @mouseleave=${()=>{this.hoverTimeout=setTimeout(()=>{this.isSidebarHovered=!1},300)}}
        >
          <alps-contacts-categories
            .contacts=${this.contacts}
            .uniqueCategories=${this.uniqueCategories}
            .selectedCategory=${this.selectedCategory}
            .filterQuery=${this.filterQuery}
            .sidebarCollapsed=${this.sidebarCollapsed}
            .isSidebarHovered=${this.isSidebarHovered}
            .suppressSidebarHover=${this.suppressSidebarHover}
            .isMobile=${this.isMobile}
            @create-contact=${this.handleCreateNew}
            @select-category=${e=>{this.filterQuery=``;let t=e.detail.category;t===`All Contacts`?window.location.hash=`/contacts/all`:window.location.hash=`/contacts/${encodeURIComponent(t)}`}}
            @drag-start=${()=>{this.isSidebarDragging=!0,this.suppressSidebarHover=!0}}
            @drag-end=${()=>{this.isSidebarDragging=!1,this.isMobile?this.mobileSidebarOpen=!1:(this.sidebarCollapsed||this.settingsStore?.updateSettings({sidebarCollapsed:!0}),this.suppressSidebarHover=!0)}}
            @rename-category=${e=>{this.categoryToRename=e.detail.category}}
            @delete-category=${e=>{this.categoryToDelete=e.detail.category}}
          ></alps-contacts-categories>
          
          <alps-icon-btn 
            slot="footer-actions"
            class="new-folder-btn"
            icon="folderPlus"
            title="${this.i18nStore?.t(`contacts.createCategory`)}"
            @click=${()=>this.showCreatePrompt=!0}
            style="--btn-padding: 8px; --icon-size: 20px;"
          ></alps-icon-btn>
        </alps-sidebar>
        <div class="main-view">
          <div class="contact-list-pane" style="width: ${this.isMobile?`100%`:this.listWidth+`px`}; display: flex; flex-direction: column; flex-shrink: 0;">
            <alps-contacts-list
              .contacts=${this.contacts}
              .selectedCategory=${this.selectedCategory}
              .filterQuery=${this.filterQuery}
              .sortOrder=${this.sortOrder}
              .showOnlyStarred=${this.showOnlyStarred}
              .isMobile=${this.isMobile}
              .densityMode=${this.densityMode}
              .selectedContacts=${this.selectedContacts}
              .selectedContact=${this.selectedContact}
              .isSpinning=${this.isSpinning}
              .loading=${this.loading}
              .listScrolled=${this.listScrolled}
              @select-contact=${e=>this.selectContact(e.detail.contact)}
              @toggle-star=${e=>this.handleToggleStar(new Event(``),e.detail.contact)}
              @select-all=${this.handleSelectAll}
              @toggle-selection=${e=>this.handleSelectContact(e.detail.event,e.detail.path)}
              @refresh=${()=>this.fetchContacts()}
              @spin-iteration=${this.handleSpinIteration}
              @sort-toggle=${()=>this.sortOrder=this.sortOrder===`asc`?`desc`:`asc`}
              @filter-star-toggle=${()=>this.showOnlyStarred=!this.showOnlyStarred}
              @clear-search=${()=>{this.filterQuery=``,this.fetchContacts();let e=document.querySelector(`app-header`);e&&e.shadowRoot?.querySelector(`alps-input`)?.shadowRoot?.querySelector(`input`)?.setAttribute(`value`,``)}}
              @list-scrolled=${e=>this.listScrolled=e.detail.scrolled}
            ></alps-contacts-list>
          </div>
          ${this.isMobile?``:s`<div class="resizer ${this.isPaneDragging?`dragging`:``}" @mousedown=${this.startResize}></div>`}
          <div class="contact-reader-pane" style="padding: 0; flex: 1;">
            <alps-contact-view
              .contact=${this.selectedContact}
              .selectedCount=${this.selectedContacts.size}
              .allSelectedStarred=${this.allSelectedStarred}
              .isEditing=${this.isEditing}
              .saving=${this.saving}
              .uniqueCategories=${this.uniqueCategories}
              .isMobile=${this.isMobile}
              @save=${this.handleSaveEvent}
              @delete=${this.handleDelete}
              @cancel-edit=${this.handleCancelEdit}
              @edit=${this.handleEdit}
              @toggle-star=${this.handleToggleStarEvent}
              @update-categories=${this.handleUpdateCategories}
              @list-scrolled=${e=>this.listScrolled=e.detail.scrolled}
            ></alps-contact-view>
          </div>
        </div>
      </div>
      
      ${this.showCreatePrompt?s`
        <ui-prompt
          title="${this.i18nStore?.t(`contacts.createCategory`)}"
          confirmText="${this.i18nStore?.t(`contacts.create`)}"
          .fields=${[{id:`name`,label:this.i18nStore?.t(`contacts.categoryName`),autofocus:!0}]}
          @submit=${this.handleCreateCategorySubmit}
          @cancel=${()=>this.showCreatePrompt=!1}
        ></ui-prompt>
      `:``}

      ${this.categoryToRename===null?``:s`
        <ui-prompt
          title="${this.i18nStore?.t(`contacts.renameCategory`)}"
          confirmText="${this.i18nStore?.t(`contacts.rename`)}"
          .fields=${[{id:`name`,label:this.i18nStore?.t(`contacts.categoryName`),value:this.categoryToRename,autofocus:!0}]}
          @submit=${this.handleRenameCategorySubmit}
          @cancel=${()=>this.categoryToRename=null}
        ></ui-prompt>
      `}

      ${this.categoryToDelete===null?``:s`
        <ui-confirm
          title="${this.i18nStore?.t(`contacts.deleteCategory`)}"
          message="${this.i18nStore?.t(`contacts.deleteCategoryConfirm`,{category:this.categoryToDelete})}"
          confirmText="${this.i18nStore?.t(`contacts.delete`)}"
          isDanger
          @confirm=${this.handleDeleteCategorySubmit}
          @cancel=${()=>this.categoryToDelete=null}
        ></ui-confirm>
      `}
    `}};A([f({context:x})],G.prototype,`i18nStore`,void 0),A([f({context:S})],G.prototype,`settingsStore`,void 0),A([_()],G.prototype,`contacts`,void 0),A([_()],G.prototype,`sortOrder`,void 0),A([_()],G.prototype,`showOnlyStarred`,void 0),A([_()],G.prototype,`loading`,void 0),A([_()],G.prototype,`isSpinning`,void 0),A([_()],G.prototype,`showInitialLoader`,void 0),A([_()],G.prototype,`selectedContact`,void 0),A([_()],G.prototype,`filterQuery`,void 0),A([_()],G.prototype,`isEditing`,void 0),A([_()],G.prototype,`saving`,void 0),A([_()],G.prototype,`selectedCategory`,void 0),A([_()],G.prototype,`showCreatePrompt`,void 0),A([_()],G.prototype,`showDeleteConfirm`,void 0),A([_()],G.prototype,`addedCategories`,void 0),A([_()],G.prototype,`sidebarWidth`,void 0),A([_()],G.prototype,`listWidth`,void 0),A([_()],G.prototype,`sidebarCollapsed`,void 0),A([_()],G.prototype,`isSidebarHovered`,void 0),A([_()],G.prototype,`isMobile`,void 0),A([_()],G.prototype,`mobileSidebarOpen`,void 0),A([_()],G.prototype,`suppressSidebarHover`,void 0),A([_()],G.prototype,`isSidebarDragging`,void 0),A([_()],G.prototype,`isPaneDragging`,void 0),A([_()],G.prototype,`densityMode`,void 0),A([_()],G.prototype,`selectedContacts`,void 0),A([_()],G.prototype,`listScrolled`,void 0),A([_()],G.prototype,`categoryToRename`,void 0),A([_()],G.prototype,`categoryToDelete`,void 0),G=A([a(`contacts-page`)],G);var K=class extends p{constructor(...e){super(...e),this.contact=null,this.isEditing=!1,this.saving=!1,this.uniqueCategories=[],this.isMobile=!1,this.selectedCount=0,this.allSelectedStarred=!1,this.scrolled=!1,this.editForm={},this.isDirty=!1,this.newCategoryName=``,this.saveTimeout=null}handleAddCategory(){let e=this.newCategoryName.trim();if(e){this.dispatchEvent(new CustomEvent(`update-categories`,{detail:{category:e},bubbles:!0,composed:!0})),this.newCategoryName=``;let t=this.shadowRoot?.querySelector(`alps-popup`);t&&t.close()}}static{this.styles=[Ye,o`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-primary, #ffffff);
    }
    
    .toolbar {
      padding: 0 16px;
      gap: 12px;
      background: var(--bg-primary, #fff);
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      z-index: 10;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .toolbar-separator {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 8px;
    }
    
    .desktop-only {
      display: block;
    }
    @media (max-width: 768px) {
      .desktop-only {
        display: none !important;
      }
    }

    .content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted, #9ca3af);
    }

    .contact-detail-header {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 24px;
      text-align: center;
    }
    .contact-detail-email {
      font-size: 16px;
      color: var(--text-secondary, #4b5563);
      margin-bottom: 24px;
    }
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 400px;
      width: 100%;
      margin: 0 auto;
    }
    .edit-textarea {
      width: 100%;
      min-height: 80px;
      padding: 8px 12px;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      box-sizing: border-box;
    }
    .view-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 32px;
    }
    .view-name {
      font-size: 24px;
      font-weight: 600;
      margin-top: 16px;
      margin-bottom: 4px;
      text-align: center;
      color: var(--text-color, #111827);
    }
    .view-organization {
      font-size: 14px;
      color: var(--text-secondary, #6b7280);
      margin-bottom: 12px;
      text-align: center;
    }
    .view-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }
    .category-pill {
      background: var(--bg-selected, #eff6ff);
      color: var(--accent-hover, #2563eb);
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    .view-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 400px;
      width: 100%;
      margin: 0 auto;
    }
    .detail-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .detail-group:not(:last-child) {
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      padding-bottom: 16px;
    }
    .group-label {
      font-size: 11px;
      font-weight: 400;
      color: var(--text-muted, #9ca3af);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .group-value {
      font-size: 15px;
      color: var(--text-color, #111827);
      word-break: break-word;
      white-space: pre-wrap;
    }
    .group-value a {
      color: var(--accent-hover, #2563eb);
      text-decoration: none;
    }
    .group-value a:hover {
      text-decoration: underline;
    }
    .view-categories alps-button {
      --btn-padding: 2px 8px;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]}updated(e){(e.has(`contact`)||e.has(`isEditing`))&&this.contact&&this.isEditing&&(!this.editForm||this.editForm.path!==this.contact.path)&&(this.editForm={...this.contact},this.isDirty=!1,Array.isArray(this.editForm.categories)&&(this.editForm.categories=this.editForm.categories.join(`, `)))}debouncedSave(){this.saveTimeout&&clearTimeout(this.saveTimeout),this.saveTimeout=setTimeout(()=>{this.handleSave()},500)}handleInput(e,t){this.editForm={...this.editForm,[e]:t},this.isDirty=!0,this.debouncedSave()}handleSave(){this.dispatchEvent(new CustomEvent(`save`,{detail:this.editForm,bubbles:!0,composed:!0}))}renderDetailRow(e,t){if(!t)return``;let n=s`${t}`;return e===`Email Address`?n=s`<a href="mailto:${t}" @click=${e=>{e.preventDefault();let n=this.contact?.name?`"${this.contact.name}" <${t}>`:t;this.composeStore?.openComposer({to:[n]})}}>${t}</a>`:e===`Phone`?n=s`<a href="tel:${t}">${t}</a>`:e===`URL`&&(n=s`<a href=${t.startsWith(`http`)?t:`https://${t}`} target="_blank" rel="noopener noreferrer">${t}</a>`),s`
      <div class="detail-group">
        <div class="group-label">${e}</div>
        <div class="group-value">${n}</div>
      </div>
    `}get isStarred(){return this.selectedCount>1?this.allSelectedStarred:this.contact?.categories?.includes(`Favorites`)||!1}get formattedBirthday(){if(!this.contact?.birthday)return``;let e=new Date(this.contact.birthday);return isNaN(e.getTime())?this.contact.birthday:Fe(e,this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,`24`).split(` `)[0]}render(){return!this.contact&&!this.isEditing&&this.selectedCount===0?s`
        <div class="empty-state">${this.i18nStore?.t(`contacts.selectContact`)}</div>
      `:s`
      <alps-toolbar class="toolbar" ?scrolled=${this.scrolled}>
        ${this.isMobile?s`
          <alps-icon-btn @click=${()=>this.dispatchEvent(new CustomEvent(`close`))} title="${this.i18nStore?.t(`contacts.back`)}" icon="arrowLeft"></alps-icon-btn>
          <div class="toolbar-separator"></div>
        `:``}

        <alps-icon-btn title="${this.i18nStore?.t(`contacts.delete`)}" @click=${()=>this.dispatchEvent(new CustomEvent(`delete`))} icon="trash" ?disabled=${this.contact?.isTemporary}></alps-icon-btn>
        
        <alps-popup align="right" @popup-close=${()=>{}}>
          <alps-icon-btn slot="trigger" title="${this.i18nStore?.t(`contacts.addToCategory`)}" icon="folderOpen" ?disabled=${this.contact?.isTemporary}></alps-icon-btn>
          
          <div style="padding: 8px; display: flex; gap: 8px; cursor: default; min-width: 200px;" @click=${e=>e.stopPropagation()}>
            <input 
              type="text" 
              placeholder="${this.i18nStore?.t(`contacts.newCategory`)||`New Category`}" 
              .value=${this.newCategoryName} 
              @input=${e=>this.newCategoryName=e.target.value}
              @keydown=${e=>{e.key===`Enter`&&(e.preventDefault(),this.handleAddCategory())}}
              style="flex: 1; padding: 4px 8px; border: 1px solid var(--border-color, #e5e7eb); border-radius: 4px; font-size: 13px; outline: none; min-width: 0; background: var(--bg-primary, #ffffff); color: var(--text-primary, #111827);">
            <alps-button variant="normal" @click=${this.handleAddCategory} style="--btn-padding: 4px 12px; --btn-font-size: 13px;">${this.i18nStore?.t(`contacts.add`)||`Add`}</alps-button>
          </div>
          
          ${this.contact?.categories&&this.contact.categories.length>0||this.uniqueCategories.length>0?s`<div class="dropdown-divider"></div>`:``}

          ${this.uniqueCategories.map(e=>{let t=this.contact?.categories?.includes(e);return s`
              <button class="dropdown-item ${t?`active`:``}" @click=${t=>{t.stopPropagation(),this.dispatchEvent(new CustomEvent(`update-categories`,{detail:{category:e},bubbles:!0,composed:!0}))}}>
                ${t?w(`check`):s`<div style="width: 16px;"></div>`}
                <span class="item-text">${e}</span>
              </button>
            `})}

          ${this.contact?.categories&&this.contact.categories.length>0?s`
            ${this.uniqueCategories.length>0?s`<div class="dropdown-divider"></div>`:``}
            <button class="dropdown-item" @click=${()=>{this.dispatchEvent(new CustomEvent(`update-categories`,{detail:{category:``},bubbles:!0,composed:!0}));let e=this.shadowRoot?.querySelector(`alps-popup`);e&&e.close()}}>
              <span class="item-text" style="font-weight: 500;">${this.i18nStore?.t(`contacts.uncategorized`)}</span>
            </button>
          `:``}
        </alps-popup>

        <div class="toolbar-separator"></div>
        
        <alps-icon-btn 
          title="${this.i18nStore?.t(`contacts.toggleStar`)}" 
          @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-star`))} 
          icon=${this.isStarred?`starFourFill`:`starFour`}
          ?active=${this.isStarred}
          ?disabled=${this.contact?.isTemporary}
        ></alps-icon-btn>
        
        <div class="toolbar-spacer"></div>
        
        ${this.selectedCount>0?``:s`
          <alps-icon-btn 
            title=${this.isEditing?this.i18nStore?.t(`contacts.cancel`):this.i18nStore?.t(`contacts.editContact`)} 
            @click=${()=>{this.isEditing?(this.saveTimeout&&clearTimeout(this.saveTimeout),this.contact?.isTemporary&&!this.isDirty||this.handleSave(),this.dispatchEvent(new CustomEvent(`cancel-edit`))):this.dispatchEvent(new CustomEvent(`edit`))}} 
            icon="pen"
            ?active=${this.isEditing}
          ></alps-icon-btn>
        `}
      </alps-toolbar>

      <div class="content" @scroll=${e=>{let t=e.target.scrollTop>0;this.scrolled!==t&&(this.scrolled=t)}}>
        ${this.selectedCount>0?s`
          <div class="empty-state" style="flex-direction: column; gap: 16px;">
            <alps-icon-btn icon="users" style="pointer-events: none; margin-right: 8px;"></alps-icon-btn>
            <span>${this.i18nStore?.t(`contacts.selectedContacts`,{count:this.selectedCount})}</span>
          </div>
        `:s`
        <div class="view-header">
          <alps-avatar .name=${this.isEditing?this.editForm.name:this.contact?.name} .email=${this.isEditing?this.editForm.email:this.contact?.email} .src=${this.contact?.avatar||``} .size=${100}></alps-avatar>
        </div>

        ${this.isEditing?s`
          <div class="edit-form">
            <alps-input 
              placeholder="${this.i18nStore?.t(`contacts.name`)}" 
              .value=${this.editForm.name||``} 
              @input=${e=>this.handleInput(`name`,e.target.value)}>
            </alps-input>
            <alps-input placeholder="${this.i18nStore?.t(`contacts.nickname`)}" .value=${this.editForm.nickname||``} @input=${e=>this.handleInput(`nickname`,e.target.value)}></alps-input>
            <alps-input placeholder="${this.i18nStore?.t(`contacts.organization`)}" .value=${this.editForm.organization||``} @input=${e=>this.handleInput(`organization`,e.target.value)}></alps-input>
            <alps-input placeholder="${this.i18nStore?.t(`contacts.titleField`)}" .value=${this.editForm.title||``} @input=${e=>this.handleInput(`title`,e.target.value)}></alps-input>
            <alps-input 
              placeholder="${this.i18nStore?.t(`contacts.email`)}" 
              type="email"
              .value=${this.editForm.email||``} 
              @input=${e=>this.handleInput(`email`,e.target.value)}>
            </alps-input>
            <alps-input placeholder="${this.i18nStore?.t(`contacts.phone`)}" .value=${this.editForm.phone||``} @input=${e=>this.handleInput(`phone`,e.target.value)}></alps-input>
            <alps-input placeholder="${this.i18nStore?.t(`contacts.address`)}" .value=${this.editForm.address||``} @input=${e=>this.handleInput(`address`,e.target.value)}></alps-input>
            <alps-input placeholder="${this.i18nStore?.t(`contacts.url`)}" type="url" .value=${this.editForm.url||``} @input=${e=>this.handleInput(`url`,e.target.value)}></alps-input>
            <alps-input placeholder="${this.i18nStore?.t(`contacts.birthday`)}" type="date" .value=${this.editForm.birthday||``} @input=${e=>this.handleInput(`birthday`,e.target.value)}></alps-input>
            <textarea class="edit-textarea" placeholder="${this.i18nStore?.t(`contacts.notes`)}" .value=${this.editForm.note||``} @input=${e=>this.handleInput(`note`,e.target.value)}></textarea>
          </div>
        `:s`
          <div class="view-header" style="margin-top: -32px;">
            <div class="view-name">
              ${this.contact.name||`Unnamed Contact`} ${this.contact.nickname?`(${this.contact.nickname})`:``}
            </div>
            ${this.contact.organization||this.contact.title?s`
              <div class="view-organization">
                ${[this.contact.title,this.contact.organization].filter(Boolean).join(`, `)}
              </div>
            `:``}
            ${this.contact.categories&&this.contact.categories.length>0?s`
              <div class="view-categories">
                ${this.contact.categories.map(e=>s`<span class="category-pill">${e}</span>`)}
              </div>
            `:``}
          </div>
          <div class="view-details">
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.email`),this.contact.email)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.phone`),this.contact.phone)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.address`),this.contact.address)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.birthday`),this.formattedBirthday)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.url`),this.contact.url)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.notes`),this.contact.note)}
          </div>
        `}
        `}
      </div>
    `}};A([i({type:Object})],K.prototype,`contact`,void 0),A([i({type:Boolean})],K.prototype,`isEditing`,void 0),A([i({type:Boolean})],K.prototype,`saving`,void 0),A([i({type:Array})],K.prototype,`uniqueCategories`,void 0),A([i({type:Boolean})],K.prototype,`isMobile`,void 0),A([i({type:Number})],K.prototype,`selectedCount`,void 0),A([i({type:Boolean})],K.prototype,`allSelectedStarred`,void 0),A([_()],K.prototype,`scrolled`,void 0),A([f({context:x})],K.prototype,`i18nStore`,void 0),A([f({context:k})],K.prototype,`composeStore`,void 0),A([f({context:S,subscribe:!0})],K.prototype,`settingsStore`,void 0),A([_()],K.prototype,`editForm`,void 0),A([_()],K.prototype,`isDirty`,void 0),A([_()],K.prototype,`newCategoryName`,void 0),K=A([a(`alps-contact-view`)],K);var kt=e({});ue.registerRoute({path:`/contacts/*`,component:`contacts-page`}),ue.registerNavTab({id:`contacts`,labelKey:`navigation.contacts`});var At=class extends p{constructor(...e){super(...e),this.label=``,this.description=``}static{this.styles=o`
    :host {
      display: block;
      width: 100%;
      max-width: 600px;
      margin-bottom: 36px;
    }

    .setting-label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .setting-description {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
      line-height: 1.4;
      margin-bottom: 12px;
    }

    .slot-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `}render(){return s`
      ${this.label?s`<label class="setting-label">${this.label}</label>`:``}
      ${this.description?s`<div class="setting-description">${this.description}</div>`:``}
      <div class="slot-container">
        <slot></slot>
      </div>
    `}};A([i({type:String})],At.prototype,`label`,void 0),A([i({type:String})],At.prototype,`description`,void 0),At=A([a(`alps-setting-group`)],At);var jt=class extends p{constructor(...e){super(...e),this.passwordForm={old:``,new:``,confirm:``},this.isSubmitting=!1}static{this.styles=o`
		input[type="password"] {
			width: 100%;
			box-sizing: border-box;
			padding: var(--input-padding, 8px 12px);
			border: 1px solid var(--border-color);
			border-radius: var(--input-radius, 6px);
			background-color: var(--bg-primary);
			color: var(--text-primary);
			font-size: var(--input-font-size, 14px);
			outline: none;
			font-family: var(--font-base);
		}

		input:focus {
			border-color: var(--accent-color, #2563eb);
			box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
		}
	`}handlePasswordFormChange(e,t){let n=e.target;this.passwordForm={...this.passwordForm,[t]:n.value}}async submitPasswordChange(){if(!this.passwordForm.old||!this.passwordForm.new||!this.passwordForm.confirm){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`settings.password.fillAllFields`),timeout:3e3}}));return}if(this.passwordForm.new!==this.passwordForm.confirm){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`settings.password.passwordMismatch`),timeout:3e3}}));return}this.isSubmitting=!0;try{let e=await fetch(`/password/change`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({old_password:this.passwordForm.old,password:this.passwordForm.new})}),t=await e.json();e.ok?(window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:t.message||`Password successfully changed.`,timeout:3e3}})),this.passwordForm={old:``,new:``,confirm:``}):window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:t.error||`Failed to change password.`,timeout:3e3}}))}catch{window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:`Network error occurred.`,timeout:3e3}}))}finally{this.isSubmitting=!1}}render(){return s`
			<alps-setting-group label="${this.i18nStore?.t(`settings.password.changePassword`)}" description="${this.i18nStore?.t(`settings.password.changePasswordDesc`)}">
					<alps-input type="password" icon="key"
							placeholder="${this.i18nStore?.t(`settings.password.oldPassword`)}" 
							.value=${this.passwordForm.old} 
							@input=${e=>this.handlePasswordFormChange(e,`old`)}
					></alps-input>
					<alps-input type="password" icon="key"
							placeholder="${this.i18nStore?.t(`settings.password.newPassword`)}" 
							.value=${this.passwordForm.new} 
							@input=${e=>this.handlePasswordFormChange(e,`new`)}
					></alps-input>
					<alps-input type="password" icon="key"
							placeholder="${this.i18nStore?.t(`settings.password.confirmPassword`)}" 
							.value=${this.passwordForm.confirm} 
							@input=${e=>this.handlePasswordFormChange(e,`confirm`)}
					></alps-input>
					
					<alps-button 
						variant="normal"
						style="align-self: flex-start;"
						?disabled=${this.isSubmitting||!this.passwordForm.old||!this.passwordForm.new||!this.passwordForm.confirm}
						?spinning=${this.isSubmitting}
						@click=${this.submitPasswordChange}>
						${this.i18nStore?.t(`settings.password.updatePassword`)}
					</alps-button>
			</alps-setting-group>			
	`}};A([f({context:x})],jt.prototype,`i18nStore`,void 0),A([_()],jt.prototype,`passwordForm`,void 0),A([_()],jt.prototype,`isSubmitting`,void 0),jt=A([a(`alps-password-settings`)],jt);var Mt=e({});ue.registerSettingsTab({id:`password`,labelKey:`settings.categories.password`,icon:`password`,component:`alps-password-settings`});var Nt=class{constructor(e,t,n){this.routes=e,this.fallback=t,this.currentPath=this.getHashPath(),window.addEventListener(`hashchange`,()=>{this.currentPath=this.getHashPath(),n()})}getHashPath(){let e=window.location.hash;return!e||e===`#`?`/`:e.substring(1).split(`?`)[0]}navigate(e){window.location.hash=e}render(){if(this.routes[this.currentPath])return this.routes[this.currentPath]();for(let e in this.routes)if(e.endsWith(`/*`)&&this.currentPath.startsWith(e.replace(`/*`,``)))return this.routes[e]();return this.fallback()}},Pt=class extends p{constructor(...e){super(...e),this.icon=``,this.title=``,this.subtitle=``}static{this.styles=o`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      background: var(--bg-secondary, #f9fafb);
      position: relative;
    }

    .card {
      position: relative;
      z-index: 1;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      padding: 32px;
      border-radius: var(--radius-lg, 8px);
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      width: 100%;
      max-width: 360px;
      color: var(--text-primary, #111827);
    }

    .logo-container {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;
    }

    .logo-container svg {
      width: var(--auth-card-icon-size, 40px);
      height: var(--auth-card-icon-size, 40px);
      fill: var(--auth-card-icon-color, currentColor);
    }

    h1 {
      margin-top: 0;
      margin-bottom: 4px;
      text-align: center;
      font-family: var(--font-heading, 'Inter', sans-serif);
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary, #111827);
    }

    p.subtitle {
      text-align: center;
      color: var(--text-secondary, #4b5563);
      margin-bottom: 24px;
      font-size: 14px;
      line-height: 1.5;
    }
  `}render(){return s`
      <div class="card">
        ${this.icon?s`
          <div class="logo-container">
            ${w(this.icon)}
          </div>
        `:``}
        ${this.title?s`<h1>${this.title}</h1>`:``}
        ${this.subtitle?s`<p class="subtitle">${this.subtitle}</p>`:``}
        
        <slot></slot>
      </div>
    `}};A([i({type:String})],Pt.prototype,`icon`,void 0),A([i({type:String})],Pt.prototype,`title`,void 0),A([i({type:String})],Pt.prototype,`subtitle`,void 0),Pt=A([a(`alps-auth-card`)],Pt);var q=class extends p{constructor(...e){super(...e),this.username=``,this.password=``,this.rememberMe=!1,this.error=``,this.isSubmitting=!1,this.retryAfter=0,this.isRateLimited=!1}static{this.styles=o`
    .form-group {
      margin-bottom: 16px;
      position: relative;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .native-input {
      width: 100%;
      height: 36px;
      padding: 0 12px;
      background: var(--alps-input-bg, var(--bg-primary, #ffffff));
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--input-radius, 6px);
      color: var(--text-primary, #111827);
      font-family: var(--font-base, 'Inter', sans-serif);
      font-size: var(--input-font-size, 14px);
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }

    .has-left-icon .native-input {
      padding-left: 36px;
    }

    .native-input:focus {
      border-color: var(--accent-color, #005A9E);
      box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
    }

    .native-input::placeholder {
      color: var(--text-muted, #9ca3af);
    }

    .icon-left {
      position: absolute;
      left: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      color: var(--text-muted, #9ca3af);
      pointer-events: none;
    }

    .icon-left svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }

    .checkbox-group label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 14px;
      color: var(--text-secondary, #4b5563);
      user-select: none;
    }

    .checkbox-group input[type="checkbox"] {
      width: 16px;
      height: 16px;
      margin: 0;
      margin-right: 8px;
      cursor: pointer;
      accent-color: var(--accent-color, #2563eb);
    }

    .error-container {
      border-radius: var(--radius-md, 6px);
      padding: 8px 12px;
      margin-bottom: 24px;
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }

    .error-text {
      color: var(--error, #ef4444);
      font-size: 14px;
      margin: 0;
      text-align: center;
    }

    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }

    .submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 36px;
      margin-top: 4px;
      gap: 8px;
      background-color: var(--accent-color, #3b82f6);
      color: #ffffff;
      border: 1px solid transparent;
      border-radius: var(--btn-radius, 4px);
      font-family: inherit;
      font-size: var(--btn-font-size, 14px);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }

    .submit-btn:hover:not(:disabled) {
      background-color: var(--accent-hover, #2563eb);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .submit-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .spinner {
      animation: spin 1s linear infinite;
      display: flex;
      width: 18px;
      height: 18px;
    }

    .spinner svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
  `}connectedCallback(){super.connectedCallback(),this.composeStore&&this.composeStore.clearAllComposers()}disconnectedCallback(){super.disconnectedCallback(),this.retryCountdownInterval&&clearInterval(this.retryCountdownInterval)}startRetryCountdown(e){this.retryAfter=e,this.isRateLimited=!0,this.retryCountdownInterval&&clearInterval(this.retryCountdownInterval),this.retryCountdownInterval=setInterval(()=>{this.retryAfter--,this.retryAfter<=0&&(this.isRateLimited=!1,this.retryCountdownInterval&&=(clearInterval(this.retryCountdownInterval),void 0))},1e3)}formatRetryTime(e){if(e<60)return`${e} second${e===1?``:`s`}`;let t=Math.ceil(e/60);return`${t} minute${t===1?``:`s`}`}async handleSubmit(e){if(e.preventDefault(),this.isSubmitting)return;let t=this.shadowRoot?.querySelector(`form`);if(t&&!t.checkValidity()){t.reportValidity();return}this.error=``,this.isSubmitting=!0;try{await new Promise(e=>setTimeout(e,600));let e={username:this.username,password:this.password,"remember-me":this.rememberMe?`on`:``},t=await fetch(`/session`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)}),n=await t.json();t.ok?n.requires_2fa?(window.location.hash=`/login/webauthn`,this.isSubmitting=!1):(window.dispatchEvent(new CustomEvent(`user-logged-in`)),window.location.hash=`/mailbox/INBOX`):(t.status===429&&n.retry_after?(this.error=n.error||`Too many login attempts`,this.startRetryCountdown(n.retry_after)):(this.error=n.error||`Login failed. Please check your credentials.`,this.isRateLimited=!1),this.isSubmitting=!1)}catch{this.error=`Network error occurred. Please try again.`,this.isSubmitting=!1,this.isRateLimited=!1}}render(){return s`
      <alps-auth-card 
        icon="edelweiss" 
        title="Alps" 
        subtitle="${this.i18nStore?.t(`login.subtitle`)}">
        
        ${this.error?s`
          <div class="error-container">
            <p class="error-text">
              ${this.error}
              ${this.isRateLimited&&this.retryAfter>0?s`
                <br><strong>Please wait ${this.formatRetryTime(this.retryAfter)}</strong>
              `:``}
            </p>
          </div>
        `:``}

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <div class="input-wrapper has-left-icon">
              <span class="icon-left">${w(`at`)}</span>
              <input 
                type="email" 
                id="username" 
                name="username"
                class="native-input"
                placeholder="${this.i18nStore?.t(`login.emailPlaceholder`)}"
                .value=${this.username}
                @input=${e=>this.username=e.target.value}
                required
                autocomplete="username"
              />
            </div>
          </div>
          <div class="form-group">
            <div class="input-wrapper has-left-icon">
              <span class="icon-left">${w(`key`)}</span>
              <input 
                type="password" 
                id="password" 
                name="password"
                class="native-input"
                placeholder="${this.i18nStore?.t(`login.passwordPlaceholder`)}"
                .value=${this.password}
                @input=${e=>this.password=e.target.value}
                required
                autocomplete="current-password"
              />
            </div>
          </div>
          <div class="checkbox-group">
            <label>
              <input 
                type="checkbox" 
                .checked=${this.rememberMe}
                @change=${e=>this.rememberMe=e.target.checked}
              />
              Keep me signed in
            </label>
          </div>
          <button 
            type="submit" 
            class="submit-btn"
            ?disabled=${this.isSubmitting||this.isRateLimited}>
            ${this.isSubmitting?s`<alps-loader style="--loader-size: 16px;"></alps-loader>`:``}
            <span>${this.isRateLimited?`Wait ${this.formatRetryTime(this.retryAfter)}`:`Sign In`}</span>
          </button>
        </form>
      </alps-auth-card>
    `}};A([f({context:x})],q.prototype,`i18nStore`,void 0),A([_()],q.prototype,`username`,void 0),A([_()],q.prototype,`password`,void 0),A([_()],q.prototype,`rememberMe`,void 0),A([_()],q.prototype,`error`,void 0),A([_()],q.prototype,`isSubmitting`,void 0),A([_()],q.prototype,`retryAfter`,void 0),A([_()],q.prototype,`isRateLimited`,void 0),A([f({context:k,subscribe:!0})],q.prototype,`composeStore`,void 0),q=A([a(`login-page`)],q);var Ft=class extends p{constructor(...e){super(...e),this.active=!1,this.icon=``}static{this.styles=o`
    :host {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      margin: 2px 12px;
      cursor: pointer;
      border-radius: 6px;
      color: var(--text-secondary);
      font-weight: 500;
      transition: background 0.15s;
      user-select: none;
    }

    .category-icon {
      display: flex;
      align-items: center;
      margin-right: 12px;
      opacity: 0.7;
    }

    :host([active]) .category-icon {
      opacity: 1;
    }

    .category-icon svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    :host(:hover) {
      background: var(--hover-color);
      color: var(--text-primary);
    }

    :host([active]) {
      background: var(--bg-selected);
      color: var(--accent-hover);
      font-weight: 600;
    }
  `}render(){return s`
      ${this.icon?s`
        <span class="category-icon">${w(this.icon)}</span>
      `:``}
      <slot></slot>
    `}};A([i({type:Boolean,reflect:!0})],Ft.prototype,`active`,void 0),A([i({type:String})],Ft.prototype,`icon`,void 0),Ft=A([a(`alps-category-item`)],Ft);var It=class extends p{constructor(...e){super(...e),this.newUsername=``,this.newPassword=``,this.newDisplayName=``,this.isSubmitting=!1,this.error=``,this._handleStoreChange=()=>{this.requestUpdate()}}static{this.styles=o`
        :host {
            display: block;
        }
            
        .setting-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px;
            background: var(--bg-secondary);
            border-radius: 8px;
            margin-bottom: 8px;
        }

        .add-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 16px;
        }

        .form-row {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .error-message {
            color: var(--danger-color, #dc2626);
            font-size: 13px;
            margin-top: 8px;
        }

        .empty-state {
            color: var(--text-muted);
            font-style: italic;
            padding: 16px 0;
        }
    `}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore&&!this.linkedAccountsStore.isInitialized()&&this.linkedAccountsStore.fetchAccounts()})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.removeEventListener(`change`,this._handleStoreChange)}async handleAdd(e){if(e.preventDefault(),!(!this.newUsername||!this.newPassword)){this.isSubmitting=!0,this.error=``;try{await this.linkedAccountsStore.addAccount(this.newUsername,this.newPassword,this.newDisplayName),this.newUsername=``,this.newPassword=``,this.newDisplayName=``,window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`linkedAccounts.addedSuccess`)}}))}catch(e){this.error=e.message||this.i18nStore?.t(`linkedAccounts.addError`)}finally{this.isSubmitting=!1}}}async handleRemove(e){if(confirm(this.i18nStore?.t(`linkedAccounts.removeConfirm`)))try{await this.linkedAccountsStore.removeAccount(e),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`linkedAccounts.removedSuccess`)}}))}catch(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore?.t(`linkedAccounts.removeError`)}}))}}render(){let e=this.linkedAccountsStore?.getAccounts()||[],t=this.linkedAccountsStore?.isLoading();return s`
            <alps-setting-group 
                label="${this.i18nStore?.t(`settings.categories.accounts`)}">
                
                <div class="account-list">
                    ${t&&!this.linkedAccountsStore.isInitialized()?s`<div>${this.i18nStore?.t(`settings.loading`)}</div>`:e.length===0?s`<div class="empty-state">${this.i18nStore?.t(`linkedAccounts.noAccounts`)}</div>`:e.map(e=>s`
                        <div class="setting-row">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <alps-avatar .name=${e.display_name||e.username} .size=${24}></alps-avatar>
                                <div style="display: flex; flex-direction: column; gap: 2px;">
                                    <strong>${e.display_name||e.username}</strong>
                                    ${e.display_name?s`<div style="font-size: 13px; color: var(--text-secondary);">${e.username}</div>`:``}
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 16px;">
                                ${e.added_at&&new Date(e.added_at).getFullYear()>1970?s`
                                    <div style="font-size: 13px; color: var(--text-muted);">
                                        ${this.i18nStore?.t(`webauthn.settings.added`)} ${new Date(e.added_at).toLocaleString()}
                                    </div>
                                `:``}
                                <alps-icon-btn icon="trash" @click=${()=>this.handleRemove(e.username)} title="${this.i18nStore?.t(`linkedAccounts.remove`)}"></alps-icon-btn>
                            </div>
                        </div>
                    `)}
                </div>
            </alps-setting-group>

            <alps-setting-group 
                label="${this.i18nStore?.t(`linkedAccounts.addTitle`)}"
                description="${this.i18nStore?.t(`linkedAccounts.description`)}">
                <form class="add-form" style="margin-top: 0;" @submit=${this.handleAdd}>
                    <div class="form-row">
                        <alps-input 
                            type="email" 
                            placeholder="${this.i18nStore?.t(`login.emailPlaceholder`)}"
                            .value=${this.newUsername}
                            @input=${e=>this.newUsername=e.target.value}
                            ?required=${!0}
                        ></alps-input>
                    </div>
                    
                    <div class="form-row">
                        <alps-input 
                            type="password" icon="key"
                            placeholder="${this.i18nStore?.t(`login.passwordPlaceholder`)}"
                            .value=${this.newPassword}
                            @input=${e=>this.newPassword=e.target.value}
                            ?required=${!0}
                        ></alps-input>
                    </div>

                    <div class="form-row">
                        <alps-input 
                            type="text" 
                            placeholder="${this.i18nStore?.t(`settings.identity.displayName`)} (${this.i18nStore?.t(`general.optional`)})"
                            .value=${this.newDisplayName}
                            @input=${e=>this.newDisplayName=e.target.value}
                        ></alps-input>
                    </div>

                    ${this.error?s`<div class="error-message">${this.error}</div>`:``}

                    <alps-button variant="normal" style="align-self: flex-start;" ?disabled=${this.isSubmitting||!this.newUsername||!this.newPassword} ?spinning=${this.isSubmitting} @click=${this.handleAdd}>
                        ${this.i18nStore?.t(`linkedAccounts.linkAccount`)}
                    </alps-button>
                </form>
            </alps-setting-group>
        `}};A([f({context:x})],It.prototype,`i18nStore`,void 0),A([f({context:qe})],It.prototype,`linkedAccountsStore`,void 0),A([_()],It.prototype,`newUsername`,void 0),A([_()],It.prototype,`newPassword`,void 0),A([_()],It.prototype,`newDisplayName`,void 0),A([_()],It.prototype,`isSubmitting`,void 0),A([_()],It.prototype,`error`,void 0),It=A([a(`settings-accounts`)],It);function Lt(e){if(!e)throw Error(`base64url is null or undefined`);let t=e.replace(/-/g,`+`).replace(/_/g,`/`),n=atob(t),r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);return r.buffer}function Rt(e){let t=new Uint8Array(e),n=``;for(let e=0;e<t.byteLength;e++)n+=String.fromCharCode(t[e]);return btoa(n).replace(/\+/g,`-`).replace(/\//g,`_`).replace(/=/g,``)}async function zt(e){e.publicKey.challenge=Lt(e.publicKey.challenge),e.publicKey.user.id=Lt(e.publicKey.user.id),e.publicKey.excludeCredentials&&(e.publicKey.excludeCredentials=e.publicKey.excludeCredentials.map(e=>({...e,id:Lt(e.id)})));let t=await navigator.credentials.create(e);if(!t)throw Error(`Credential creation failed or was cancelled.`);let n=t.response,r=n.getTransports?n.getTransports():[];return{id:t.id,rawId:Rt(t.rawId),type:t.type,response:{attestationObject:Rt(n.attestationObject),clientDataJSON:Rt(n.clientDataJSON)},transports:r}}async function Bt(e){e.publicKey.challenge=Lt(e.publicKey.challenge),e.publicKey.allowCredentials&&(e.publicKey.allowCredentials=e.publicKey.allowCredentials.map(e=>({...e,id:Lt(e.id)})));let t=await navigator.credentials.get(e);if(!t)throw Error(`Assertion failed or was cancelled.`);let n=t.response;return{id:t.id,rawId:Rt(t.rawId),type:t.type,response:{authenticatorData:Rt(n.authenticatorData),clientDataJSON:Rt(n.clientDataJSON),signature:Rt(n.signature),userHandle:n.userHandle?Rt(n.userHandle):null}}}function Vt(){return window.PublicKeyCredential!==void 0&&navigator.credentials!==void 0}var Ht=class extends p{constructor(...e){super(...e),this.data=null,this.error=``,this.loading=!0,this.adding=!1,this.showNamePrompt=!1,this.pendingCredential=null}static{this.styles=o`
        :host { display: block; }
        .setting-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px;
            background: var(--bg-secondary);
            border-radius: 8px;
            margin-bottom: 8px;
        }
        .icon-container {
            display: flex;
            align-items: center;
            color: var(--text-secondary);
        }
        .icon-container svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }
        .cred-list { margin-top: 16px; }
        .alert { padding: 12px; border-radius: 6px; background: rgba(220, 38, 38, 0.1); color: var(--danger-color); margin-bottom: 12px; }
    `}connectedCallback(){super.connectedCallback(),this.fetchData()}async fetchData(){try{this.loading=!0;let e=await fetch(`/settings/2fa`);if(!e.ok)throw Error(`Failed to fetch settings`);this.data=await e.json()}catch(e){this.error=e.message}finally{this.loading=!1}}async handleTrustToggle(e){let t=e.target;await fetch(`/settings/2fa/trust-linked-accounts`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({trust:t.checked})}),this.fetchData()}async addCredential(){this.adding=!0,this.error=``;try{let e=await fetch(`/settings/2fa/begin`,{method:`POST`});if(!e.ok)throw Error(await e.text());let t=await zt(await e.json());this.pendingCredential=t,this.showNamePrompt=!0,this.adding=!1}catch(e){e.name===`NotAllowedError`||e.message&&e.message.includes(`not allowed`)?this.error=``:this.error=e.message,this.adding=!1}}async _handlePromptSubmit(e){let t=e.detail.keyName||`Security Key`;this.showNamePrompt=!1;let n={...this.pendingCredential,name:t};this.adding=!0,this.error=``;try{let e=await fetch(`/settings/2fa/finish`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(n)});if(!e.ok)throw Error(await e.text());this.fetchData()}catch(e){this.error=e.message}finally{this.adding=!1,this.pendingCredential=null}}_handlePromptCancel(){this.showNamePrompt=!1,this.pendingCredential=null}async removeCredential(e){if(confirm(this.i18nStore?.t(`webauthn.confirm_remove`)))try{this.error=``;let t=await fetch(`/settings/2fa/credential/${encodeURIComponent(e)}/delete`,{method:`POST`});if(!t.ok)throw Error(await t.text());this.fetchData()}catch(e){this.error=e.message||this.i18nStore?.t(`webauthn.errors.remove_failed`)}}render(){return this.loading?s`<div>Loading...</div>`:s`
            ${this.showNamePrompt?s`
                <ui-prompt 
                    title=${this.i18nStore?.t(`webauthn.name_key_title`)}
                    confirmText=${this.i18nStore?.t(`general.save`)}
                    cancelText=${this.i18nStore?.t(`general.cancel`)}
                    .fields=${[{id:`keyName`,label:this.i18nStore?.t(`webauthn.name_key_label`),placeholder:this.i18nStore?.t(`webauthn.key_name_placeholder`),autofocus:!0}]}
                    @submit=${this._handlePromptSubmit}
                    @cancel=${this._handlePromptCancel}
                ></ui-prompt>
            `:``}


            <alps-setting-group 
                label="${this.i18nStore?.t(`webauthn.settings.keys_title`)}" 
                description="${this.i18nStore?.t(`webauthn.settings.group_desc`)}">
                ${this.error?s`<div class="alert">${this.error}</div>`:``}

                <div class="cred-list" style="margin-top: 0;">
                    ${this.data?.credentialCount&&this.data.credentialCount>0?s`
                        ${this.data?.credentials.map(e=>s`
                            <div class="setting-row">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="icon-container">${w(`fingerprint`)}</div>
                                    <strong>${e.Name||`Security Key`}</strong>
                                </div>
                                <div style="display: flex; align-items: center; gap: 16px;">
                                    <div style="font-size: 13px; color: var(--text-muted);">${this.i18nStore?.t(`webauthn.settings.added`)} ${new Date(e.AddedAt).toLocaleString()}</div>
                                    <alps-icon-btn icon="trash" @click=${()=>this.removeCredential(e.ID)} title=${this.i18nStore?.t(`webauthn.settings.remove_btn`)||`Remove`}></alps-icon-btn>
                                </div>
                            </div>
                        `)}
                    `:``}
                    <alps-button variant="normal" style="margin-top: 12px;" @click=${this.addCredential} ?disabled=${this.adding} ?spinning=${this.adding}>
                        ${this.i18nStore?.t(`webauthn.add_key`)}
                    </alps-button>
                </div>
            </alps-setting-group>

            ${(this.data?.credentialCount??0)>0?s`
                <alps-setting-group label="${this.i18nStore?.t(`webauthn.trust_linked`)}" description="${this.i18nStore?.t(`webauthn.trust_linked_desc`)}">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
                        <input type="checkbox" .checked=${this.data?.trustLinkedAccounts} @change=${this.handleTrustToggle}>
                        ${this.i18nStore?.t(`webauthn.trust_linked_checkbox`)}
                    </label>
                </alps-setting-group>
            `:``}
        `}};A([f({context:x})],Ht.prototype,`i18nStore`,void 0),A([_()],Ht.prototype,`data`,void 0),A([_()],Ht.prototype,`error`,void 0),A([_()],Ht.prototype,`loading`,void 0),A([_()],Ht.prototype,`adding`,void 0),A([_()],Ht.prototype,`showNamePrompt`,void 0),A([_()],Ht.prototype,`pendingCredential`,void 0),Ht=A([a(`alps-webauthn-settings`)],Ht);var J=class extends p{constructor(...e){super(...e),this.category=`general`,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.username=``,this.isScrolled=!1,this.enabledPlugins=[],this._handleResize=()=>{this.isMobile=window.innerWidth<=768,this.isMobile||(this.mobileSidebarOpen=!1)},this._handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0},this._handleSettingsChange=()=>{this._syncState()},this._handleI18nChange=()=>{this.requestUpdate()}}static{this.styles=o`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      overflow: hidden;
      font-size: 14px;
    }

    .settings-title {
      font-weight: 500;
      font-size: 16px;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
    }

    .app-container {
      display: flex;
      flex: 1;
      min-height: 0;
      width: 100%;
      position: relative;
    }

    alps-sidebar.desktop-sidebar {
      width: 250px;
      flex-shrink: 0;
      border-right: 1px solid var(--border-color);
    }

    alps-sidebar::part(sidebar) {
      padding-top: 8px;
    }

    .main-view {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: var(--bg-primary);
    }

    select {
      width: 100%;
      box-sizing: border-box;
      padding: var(--input-padding, 8px 12px);
      border: 1px solid var(--border-color);
      border-radius: var(--input-radius, 6px);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-size: var(--input-font-size, 14px);
      outline: none;
    }

    select:focus, input:focus, textarea:focus {
      border-color: var(--accent-color, #2563eb);
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }

    input[type="text"], input[type="password"], input[type="number"], textarea {
      width: 100%;
      box-sizing: border-box;
      padding: var(--input-padding, 8px 12px);
      border: 1px solid var(--border-color);
      border-radius: var(--input-radius, 6px);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-size: var(--input-font-size, 14px);
      outline: none;
      font-family: var(--font-base);
    }

    textarea {
      min-height: 80px;
      resize: vertical;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--text-primary);
      font-weight: 500;
    }

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    svg.icon {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .header-icon-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      padding: 4px;
    }
    
    .header-icon-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .back-btn {
      gap: 6px;
      font-weight: 500;
      color: var(--text-primary);
      transition: color 0.2s;
    }
  `}async connectedCallback(){super.connectedCallback(),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this.i18nStore?.addEventListener(`change`,this._handleI18nChange),window.addEventListener(`resize`,this._handleResize),this._syncState();try{let e=await fetch(`/session`);if(e.ok){let t=await e.json();t.Username&&(this.username=t.Username),t.EnabledPlugins&&(this.enabledPlugins=t.EnabledPlugins)}}catch(e){y.error(`Failed to fetch username in settings`,e)}}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),window.removeEventListener(`resize`,this._handleResize)}_syncState(){this.settingsState={...this.settingsStore.getState()}}getCategoryLabel(e){switch(e){case`general`:return this.i18nStore?.t(`settings.categories.general`);case`identity`:return this.i18nStore?.t(`settings.categories.identity`);case`webauthn`:return this.i18nStore?.t(`settings.categories.webauthn`);case`accounts`:return this.i18nStore?.t(`settings.categories.accounts`);case`reading`:return this.i18nStore?.t(`settings.categories.reading`);case`appearance`:return this.i18nStore?.t(`settings.categories.appearance`);case`localization`:return this.i18nStore?.t(`settings.categories.localization`);default:let t=ue.getSettingsTabs().find(t=>t.id===e);return t?this.i18nStore?.t(t.labelKey):e}}selectCategory(e){window.location.hash=`/settings/${e}`,this.isMobile&&(this.mobileSidebarOpen=!1)}async handleUpdate(e,t){let n=e.target,r=n.value;n.type===`checkbox`?(r=n.checked,t===`desktopNotifications`&&r===!0&&(`Notification`in window&&Notification.permission!==`granted`&&Notification.permission!==`denied`?await Notification.requestPermission()!==`granted`&&(r=!1,n.checked=!1):`Notification`in window&&Notification.permission===`denied`&&(r=!1,n.checked=!1))):(n.type===`number`||[`checkMailInterval`,`autoLogout`,`messagesPerPage`,`markReadTimeout`,`undoTimeout`].includes(t))&&(r=parseInt(n.value,10),isNaN(r)&&(r=0)),this.settingsStore.updateSettings({[t]:r})}render(){return s`
      <alps-header 
        .username=${this.username}
        .isMobile=${this.isMobile}
        .scrolled=${this.isScrolled}
        currentTab="settings"
        @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
      >
        <div slot="left" class="header-left">
          ${this.isMobile?``:s`
            <button class="header-icon-btn back-btn" @click=${()=>window.location.hash=``} title=${this.i18nStore?.t(`messageReader.back`)}>
              ${w(`arrowLeft`)} ${this.i18nStore?.t(`messageReader.back`)}
            </button>
          `}
        </div>
        <div slot="center" class="settings-title">${this.i18nStore?.t(`settings.title`)} / ${this.getCategoryLabel(this.category)}</div>
      </alps-header>
      <div class="app-container">
        <alps-sidebar
          class="${this.isMobile?`mobile-sidebar`:`desktop-sidebar`} ${this.mobileSidebarOpen?`open`:``}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
          @close-sidebar=${()=>this.mobileSidebarOpen=!1}
        >
          <alps-category-item 
            ?active=${this.category===`general`}
            @click=${()=>this.selectCategory(`general`)}
            icon="gear"
          >
            ${this.i18nStore?.t(`settings.categories.general`)}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.category===`identity`}
            @click=${()=>this.selectCategory(`identity`)}
            icon="user"
          >
            ${this.i18nStore?.t(`settings.categories.identity`)}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.category===`accounts`}
            @click=${()=>this.selectCategory(`accounts`)}
            icon="users"
          >
            ${this.i18nStore?.t(`settings.categories.accounts`)}
          </alps-category-item>
          ${ue.getSettingsTabs().filter(e=>this.enabledPlugins.includes(e.id)).map(e=>s`
            <alps-category-item 
              ?active=${this.category===e.id}
              @click=${()=>this.selectCategory(e.id)}
              .icon=${e.icon}
            >
              ${this.i18nStore?.t(e.labelKey)}
            </alps-category-item>
          `)}
          <alps-category-item 
            ?active=${this.category===`webauthn`}
            @click=${()=>this.selectCategory(`webauthn`)}
            icon="fingerprint"
          >
            ${this.i18nStore?.t(`settings.categories.webauthn`)}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.category===`reading`}
            @click=${()=>this.selectCategory(`reading`)}
            icon="bookOpen"
          >
            ${this.i18nStore?.t(`settings.categories.reading`)}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.category===`appearance`}
            @click=${()=>this.selectCategory(`appearance`)}
            icon="palette"
          >
            ${this.i18nStore?.t(`settings.categories.appearance`)}
          </alps-category-item>
          <alps-category-item 
            ?active=${this.category===`localization`}
            @click=${()=>this.selectCategory(`localization`)}
            icon="globe"
          >
            ${this.i18nStore?.t(`settings.categories.localization`)}
          </alps-category-item>
        </alps-sidebar>
        
        <div class="main-view" @scroll=${this._handleScroll}>
          ${this.settingsState?s`
            ${this.category===`general`?this.renderGeneral():``}
            ${this.category===`identity`?this.renderIdentity():``}
            ${this.category===`accounts`?s`<settings-accounts></settings-accounts>`:``}
            ${this.category===`webauthn`?s`<alps-webauthn-settings></alps-webauthn-settings>`:``}
            ${this.category===`reading`?this.renderReading():``}
            ${this.category===`appearance`?this.renderAppearance():``}
            ${this.category===`localization`?this.renderLocalization():``}
            ${ue.getSettingsTabs().filter(e=>e.id===this.category&&this.enabledPlugins.includes(e.id)).map(e=>s`${m(`<${e.component}></${e.component}>`)}`)}
          `:s`<div>${this.i18nStore?.t(`settings.loading`)}</div>`}
        </div>
      </div>
    `}renderGeneral(){return s`
        <alps-setting-group label="${this.i18nStore?.t(`settings.general.checkMailInterval`)}" description="${this.i18nStore?.t(`settings.general.checkMailIntervalDesc`)}">
          <select @change=${e=>this.handleUpdate(e,`checkMailInterval`)} .value=${this.settingsState.checkMailInterval.toString()}>
            <option value="1">${this.i18nStore?.t(`settings.general.everyMinute`)}</option>
            <option value="5">${this.i18nStore?.t(`settings.general.every5Minutes`)}</option>
            <option value="15">${this.i18nStore?.t(`settings.general.every15Minutes`)}</option>
            <option value="30">${this.i18nStore?.t(`settings.general.every30Minutes`)}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.general.autoLogout`)}" description="${this.i18nStore?.t(`settings.general.autoLogoutDesc`)}">
          <select @change=${e=>this.handleUpdate(e,`autoLogout`)} .value=${this.settingsState.autoLogout.toString()}>
            <option value="0">${this.i18nStore?.t(`settings.general.never`)}</option>
            <option value="15">${this.i18nStore?.t(`settings.general.minutes15`)}</option>
            <option value="30">${this.i18nStore?.t(`settings.general.minutes30`)}</option>
            <option value="60">${this.i18nStore?.t(`settings.general.hour1`)}</option>
            <option value="120">${this.i18nStore?.t(`settings.general.hours2`)}</option>
            <option value="360">${this.i18nStore?.t(`settings.general.hours6`)}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.desktopNotifications} 
                   @change=${e=>this.handleUpdate(e,`desktopNotifications`)}>
            ${this.i18nStore?.t(`settings.general.desktopNotifications`)}
          </label>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.soundNotifications} 
                   @change=${e=>this.handleUpdate(e,`soundNotifications`)}>
            ${this.i18nStore?.t(`settings.general.soundNotifications`)}
          </label>
        </alps-setting-group>
    `}renderIdentity(){return s`
        <alps-setting-group label="${this.i18nStore?.t(`settings.identity.displayName`)}" description="${this.i18nStore?.t(`settings.identity.displayNameDesc`)}">
          <alps-input type="text" .value=${this.settingsState.name||``} @change=${e=>this.handleUpdate(e,`name`)} placeholder="${this.i18nStore?.t(`settings.placeholderName`)}"></alps-input>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.identity.signature`)}" description="${this.i18nStore?.t(`settings.identity.signatureDesc`)}">
          <textarea @change=${e=>this.handleUpdate(e,`signature`)} .value=${this.settingsState.signature||``}></textarea>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.identity.replyTo`)}" description="${this.i18nStore?.t(`settings.identity.replyToDesc`)}">
          <alps-input type="email" .value=${this.settingsState.replyTo||``} @change=${e=>this.handleUpdate(e,`replyTo`)} placeholder="${this.i18nStore?.t(`settings.placeholderReplyTo`)}"></alps-input>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.bccMyself} 
                   @change=${e=>this.handleUpdate(e,`bccMyself`)}>
            ${this.i18nStore?.t(`settings.identity.bccMyself`)}
          </label>
        </alps-setting-group>
    `}renderReading(){return s`
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.messagesPerPage`)}">
          <select @change=${e=>this.handleUpdate(e,`messagesPerPage`)} .value=${this.settingsState.messagesPerPage.toString()}>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.preferredView`)}" description="${this.i18nStore?.t(`settings.reading.preferredViewDesc`)}">
          <select @change=${e=>this.handleUpdate(e,`preferredView`)} .value=${this.settingsState.preferredView}>
            <option value="html">${this.i18nStore?.t(`settings.reading.html`)}</option>
            <option value="text">${this.i18nStore?.t(`settings.reading.plainText`)}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.showRemoteContent`)}">
          <select @change=${e=>this.handleUpdate(e,`showRemoteContent`)} .value=${this.settingsState.showRemoteContent}>
            <option value="ask">${this.i18nStore?.t(`settings.reading.alwaysAsk`)}</option>
            <option value="always">${this.i18nStore?.t(`settings.reading.alwaysLoad`)}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.markReadTimeout`)}">
          <select @change=${e=>this.handleUpdate(e,`markReadTimeout`)} .value=${this.settingsState.markReadTimeout.toString()}>
            <option value="0">${this.i18nStore?.t(`settings.reading.markReadImmediately`)}</option>
            <option value="1">${this.i18nStore?.t(`settings.reading.markRead1s`)}</option>
            <option value="3">${this.i18nStore?.t(`settings.reading.markRead3s`)}</option>
            <option value="5">${this.i18nStore?.t(`settings.reading.markRead5s`)}</option>
            <option value="10">${this.i18nStore?.t(`settings.reading.markRead10s`)}</option>
            <option value="-1">${this.i18nStore?.t(`settings.reading.markReadNever`)}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.composeFormat`)}">
          <select @change=${e=>this.handleUpdate(e,`composeFormat`)} .value=${this.settingsState.composeFormat}>
            <option value="html">${this.i18nStore?.t(`settings.reading.richText`)}</option>
            <option value="text">${this.i18nStore?.t(`settings.reading.plainText`)}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.messageSortCriteria`)}" description="${this.i18nStore?.t(`settings.reading.messageSortCriteriaDesc`)}">
          <select @change=${e=>this.handleUpdate(e,`messageSortCriteria`)} .value=${this.settingsState.messageSortCriteria}>
            <option value="date">${this.i18nStore?.t(`settings.reading.sortDate`)}</option>
            <option value="uid">${this.i18nStore?.t(`settings.reading.sortUid`)}</option>
          </select>
        </alps-setting-group>
    `}renderAppearance(){return s`
        
        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.colorTheme`)}" description="${this.i18nStore?.t(`settings.appearance.colorThemeDesc`)}">
          <select @change=${e=>this.handleUpdate(e,`colorFamily`)} .value=${this.settingsState.colorFamily}>
            <option value="default">Default Alps</option>
            <option value="nord">Nord</option>
            <option value="ocean">Ocean</option>
          </select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.themeMode`)}" description="${this.i18nStore?.t(`settings.appearance.themeModeDesc`)}">
          <select @change=${e=>this.handleUpdate(e,`themeMode`)} .value=${this.settingsState.themeMode}>
            <option value="light">${this.i18nStore?.t(`settings.appearance.light`)}</option>
            <option value="dark">${this.i18nStore?.t(`settings.appearance.dark`)}</option>
            <option value="auto">${this.i18nStore?.t(`settings.appearance.systemAuto`)}</option>
          </select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.layoutMode`)}" description="${this.i18nStore?.t(`settings.appearance.layoutModeDesc`)}">
          <select @change=${e=>this.handleUpdate(e,`layoutMode`)} .value=${this.settingsState.layoutMode}>
            <option value="vertical">${this.i18nStore?.t(`settings.appearance.vertical`)}</option>
            <option value="horizontal">${this.i18nStore?.t(`settings.appearance.horizontal`)}</option>
            <option value="full">${this.i18nStore?.t(`settings.appearance.fullScreen`)}</option>
          </select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.listDensity`)}" description="${this.i18nStore?.t(`settings.appearance.listDensityDesc`)}">
          <select @change=${e=>this.handleUpdate(e,`densityMode`)} .value=${this.settingsState.densityMode}>
            <option value="loose">${this.i18nStore?.t(`settings.appearance.loose`)}</option>
            <option value="normal">${this.i18nStore?.t(`settings.appearance.normal`)}</option>
            <option value="compact">${this.i18nStore?.t(`settings.appearance.compact`)}</option>
            <option value="ultra-compact">${this.i18nStore?.t(`settings.appearance.ultraCompact`)}</option>
          </select>
        </alps-setting-group>
    `}renderLocalization(){return s`
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.language`)}">
          <select @change=${e=>this.handleUpdate(e,`language`)} .value=${this.settingsState.language}>
            <option value="en">${this.i18nStore?.t(`settings.localization.english`)}</option>
            <option value="de">${this.i18nStore?.t(`settings.localization.german`)}</option>
            <option value="it">${this.i18nStore?.t(`settings.localization.italian`)}</option>
            <option value="es">${this.i18nStore?.t(`settings.localization.spanish`)}</option>
            <option value="rs">${this.i18nStore?.t(`settings.localization.serbian`)}</option>
            <option value="sr">${this.i18nStore?.t(`settings.localization.serbianLatin`)}</option>
            <option value="fr">${this.i18nStore?.t(`settings.localization.french`)}</option>
            <option value="pt">${this.i18nStore?.t(`settings.localization.portuguese`)}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.timeFormat`)}">
          <select @change=${e=>this.handleUpdate(e,`hourFormat`)} .value=${this.settingsState.hourFormat}>
            <option value="12">${this.i18nStore?.t(`settings.localization.format12h`)}</option>
            <option value="24">${this.i18nStore?.t(`settings.localization.format24h`)}</option>
          </select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.dateFormat`)}">
          <select @change=${e=>this.handleUpdate(e,`dateFormat`)} .value=${this.settingsState.dateFormat}>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD.MM.YYYY">DD.MM.YYYY</option>
          </select>
        </alps-setting-group>
    `}};A([f({context:S})],J.prototype,`settingsStore`,void 0),A([f({context:x})],J.prototype,`i18nStore`,void 0),A([i({type:String})],J.prototype,`category`,void 0),A([_()],J.prototype,`settingsState`,void 0),A([_()],J.prototype,`isMobile`,void 0),A([_()],J.prototype,`mobileSidebarOpen`,void 0),A([_()],J.prototype,`username`,void 0),A([_()],J.prototype,`isScrolled`,void 0),A([_()],J.prototype,`enabledPlugins`,void 0),J=A([a(`settings-page`)],J);async function Ut(e){let t=await new te().parse(e),n=`default`,r=t.headers?.find(e=>e.key.toLowerCase()===`bimi-selector`);if(r){let e=r.value.match(/s=([^;\s]+)/i);e&&(n=e[1].trim())}let i=t.from?.address||``,a={messageId:t.messageId||``,date:t.date||``,from:t.from?t.from.name?`${t.from.name} <${t.from.address||``}>`:t.from.address||``:``,fromAddress:i,to:t.to?t.to.map(e=>e.name?`${e.name} <${e.address}>`:e.address).join(`, `):``,subject:t.subject||``,spf:`none`,spfDetail:``,dkim:`none`,dkimDetail:``,dmarc:`none`,dmarcDetail:``,bimiSelector:n,hasBimiPotential:!1},o=t.headers?.filter(e=>e.key.toLowerCase()===`authentication-results`)||[];if(o.length>0){let e=o[0],t=e.value.toLowerCase(),n=``,r=t.match(/smtp\.(?:remote|client)-ip=([0-9a-f\.:]+)/)||t.match(/designates ([0-9a-f\.:]+) as permitted sender/);r&&(n=r[1]);let i=e.value.split(`;`);for(let e of i){let t=e.trim().toLowerCase();if(t.startsWith(`spf=`))if(a.spf=t.split(`=`)[1].split(` `)[0],n)a.spfDetail=`with IP address ${n}`;else{let e=t.match(/smtp\.mailfrom=([^ \t]+)/)||t.match(/smtp\.helo=([^ \t]+)/);e&&(a.spfDetail=`with ${e[1]}`)}else if(t.startsWith(`dkim=`)){a.dkim=t.split(`=`)[1].split(` `)[0];let e=t.match(/header\.d=([^ \t]+)/);e&&(a.dkimDetail=`with domain ${e[1]}`)}else if(t.startsWith(`dmarc=`)){a.dmarc=t.split(`=`)[1].split(` `)[0];let e=t.match(/header\.from=([^ \t]+)/);e&&(a.dmarcDetail=`with domain ${e[1]}`)}}}return a.hasBimiPotential=a.dmarc===`pass`&&!!a.fromAddress,a}var Y=class extends p{constructor(...e){super(...e),this.rawText=``,this.parsedHeaders=null,this.loading=!0,this.error=``,this.mailbox=``,this.uid=``,this.isTruncated=!1,this._handleStoreChange=()=>{this.requestUpdate()},this.MAX_DISPLAY_SIZE=65536}static{this.styles=o`
    :host {
      display: block;
      height: 100vh;
      overflow: auto;
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #000);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 24px;
      font-weight: 600;
    }
    .metadata-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      background: var(--bg-secondary, #f9fafb);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      overflow: hidden;
    }
    .metadata-table th,
    .metadata-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      font-size: 14px;
    }
    .metadata-table th {
      width: 150px;
      font-weight: 600;
      color: var(--text-secondary, #4b5563);
      background: var(--bg-tertiary, #f3f4f6);
    }
    .metadata-table tr:last-child th,
    .metadata-table tr:last-child td {
      border-bottom: none;
    }
    .auth-pass { color: #059669; font-weight: 600; }
    .auth-fail { color: #dc2626; font-weight: 600; }
    .auth-none { color: var(--text-muted, #9ca3af); }

    .actions {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .raw-content {
      background: var(--bg-secondary, #f9fafb);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--border-color, #e5e7eb);
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
    }
    alps-banner {
      position: static;
      margin-bottom: 24px;
      border-radius: 4px;
      overflow: hidden;
    }
    .auth-status-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .auth-status-detail {
      color: var(--text-muted, #6b7280);
      font-size: 13px;
    }
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 12px;
      color: var(--text-muted, #6b7280);
      font-size: 14px;
    }
    .spinner {
      animation: spin 3s linear infinite;
      display: flex;
    }
    .spinner svg {
      width: 32px;
      height: 32px;
      fill: currentColor;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `}connectedCallback(){super.connectedCallback(),this.extractParams(),this.mailbox&&this.uid?this.fetchOriginal():(this.error=this.i18nStore?.t(`originalMessage.errorMissingParams`),this.loading=!1),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}extractParams(){let e=window.location.hash,t=e.indexOf(`?`);if(t!==-1){let n=new URLSearchParams(e.substring(t+1));this.mailbox=n.get(`mailbox`)||``,this.uid=n.get(`uid`)||``}}async fetchOriginal(){try{this.loading=!0;let e=await T(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.uid}/raw?limit=${this.MAX_DISPLAY_SIZE}`);if(!e.ok){if(e.status===401){window.location.hash=`#/login`;return}throw Error(this.i18nStore?.t(`originalMessage.errorFailedToFetch`))}this.rawText=await e.text(),this.rawText.length>=this.MAX_DISPLAY_SIZE&&(this.isTruncated=!0),this.parsedHeaders=await Ut(this.rawText)}catch(e){this.error=e.message}finally{this.loading=!1}}copyToClipboard(){navigator.clipboard.writeText(this.rawText).then(()=>{alert(this.isTruncated?this.i18nStore?.t(`originalMessage.copiedTruncated`):this.i18nStore?.t(`originalMessage.copied`))}).catch(e=>{y.error(`Failed to copy: `,e),alert(this.i18nStore?.t(`originalMessage.copyFailed`))})}renderAuthStatus(e,t){e=e.toLowerCase();let n=s`<span class="auth-none">${this.i18nStore?.t(`originalMessage.none`)}</span>`;return e===`pass`?n=s`<span class="auth-pass">${this.i18nStore?.t(`originalMessage.pass`)}</span>`:e===`fail`&&(n=s`<span class="auth-fail">${this.i18nStore?.t(`originalMessage.fail`)}</span>`),s`
      <div class="auth-status-container">
        ${n}
        ${t?s`<span class="auth-status-detail">${t}</span>`:``}
      </div>
    `}render(){if(this.loading)return s`
        <div class="loading-state">
          <alps-loader></alps-loader>
          <span>${this.i18nStore?.t(`originalMessage.loading`)}</span>
        </div>
      `;if(this.error)return s`
        <div class="container">
          <alps-banner>
            ${this.error}
          </alps-banner>
        </div>
      `;let e=`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.uid}/raw`;return s`
      <div class="container">
        <h1>${this.i18nStore?.t(`originalMessage.title`)}</h1>
        
        ${this.parsedHeaders?s`
          <table class="metadata-table">
            <tbody>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.messageId`)}</th>
                <td>${this.parsedHeaders.messageId}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.createdAt`)}</th>
                <td>${this.parsedHeaders.date}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.from`)}</th>
                <td>${this.parsedHeaders.from}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.to`)}</th>
                <td>${this.parsedHeaders.to}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.subject`)}</th>
                <td>${this.parsedHeaders.subject}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.spf`)}</th>
                <td>${this.renderAuthStatus(this.parsedHeaders.spf,this.parsedHeaders.spfDetail)}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.dkim`)}</th>
                <td>${this.renderAuthStatus(this.parsedHeaders.dkim,this.parsedHeaders.dkimDetail)}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.dmarc`)}</th>
                <td>${this.renderAuthStatus(this.parsedHeaders.dmarc,this.parsedHeaders.dmarcDetail)}</td>
              </tr>
            </tbody>
          </table>
        `:``}

        ${this.isTruncated?s`
          <alps-banner>
            ${this.i18nStore?.t(`originalMessage.truncatedInfo`)}
          </alps-banner>
        `:``}

        <div class="actions">
          <alps-button variant="primary" icon="downloadSimple" @click=${()=>{let t=document.createElement(`a`);t.href=e,t.download=`original_message.eml`,t.click()}}>
            ${this.i18nStore?.t(`originalMessage.downloadOriginal`)}
          </alps-button>
          ${this.isTruncated?``:s`
            <alps-button variant="normal" icon="copy" @click=${this.copyToClipboard}>
              ${this.i18nStore?.t(`originalMessage.copyClipboard`)}
            </alps-button>
          `}
        </div>

        <pre class="raw-content">${this.rawText}</pre>
      </div>
    `}};A([_()],Y.prototype,`rawText`,void 0),A([_()],Y.prototype,`parsedHeaders`,void 0),A([_()],Y.prototype,`loading`,void 0),A([_()],Y.prototype,`error`,void 0),A([_()],Y.prototype,`mailbox`,void 0),A([_()],Y.prototype,`uid`,void 0),A([_()],Y.prototype,`isTruncated`,void 0),A([f({context:x})],Y.prototype,`i18nStore`,void 0),Y=A([a(`original-message-page`)],Y);var X=class extends p{constructor(...e){super(...e),this.loading=!0,this.error=``,this.mailbox=``,this.uid=``,this.message=null,this.content=``,this.rawMessageHtml=``,this.mimeType=`text/plain`,this.hasRemoteResources=!1,this.allowRemoteResources=!1}static{this.styles=o`
    :host {
      display: block;
      min-height: 100vh;
      background: #fff;
      color: #000;
      font-family: Arial, sans-serif;
    }
    .print-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }
    .print-header {
      margin-bottom: 24px;
      text-align: left;
    }
    .print-header h2 {
      font-size: 20px;
      font-weight: normal;
      margin: 0 0 12px 0;
      color: #222;
    }
    .print-divider {
      border-bottom: 1px solid #ddd;
      margin-bottom: 12px;
    }
    .print-meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .print-date {
      color: #666;
      margin-left: 16px;
      text-align: right;
      min-width: 150px;
    }
    .print-to-row {
      font-size: 13px;
      color: #444;
    }
    .print-cc {
      margin-top: 4px;
    }
    .print-divider-thick {
      border-bottom: 1px solid #eee;
      margin-top: 24px;
      margin-bottom: 24px;
    }
    .print-body {
      font-size: 14px;
    }
    .loading-state, .error-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: var(--text-muted, #6b7280);
      font-size: 14px;
      gap: 12px;
    }
    .error-state {
      color: #dc2626;
      flex-direction: column;
    }
    .spinner {
      animation: spin 3s linear infinite;
      display: flex;
    }
    .spinner svg {
      width: 32px;
      height: 32px;
      fill: currentColor;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @media print {
      body { padding: 0 !important; margin: 0 !important; }
      .print-container { padding: 0; max-width: none; }
      alps-banner { display: none !important; }
    }
  `}connectedCallback(){super.connectedCallback(),this.allowRemoteResources=this.settingsStore.getState().showRemoteContent===`always`,this.extractParams(),this.mailbox&&this.uid?this.fetchMessage():(this.error=`Missing mailbox or uid parameters`,this.loading=!1)}extractParams(){let e=window.location.hash,t=e.indexOf(`?`);if(t!==-1){let n=new URLSearchParams(e.substring(t+1));this.mailbox=n.get(`mailbox`)||``,this.uid=n.get(`uid`)||``,n.get(`remote`)===`1`&&(this.allowRemoteResources=!0)}}async fetchMessage(){try{this.loading=!0;let e=Be.get(this.mailbox,this.uid);if(e&&e.Part){this.message=e.Message,this.mimeType=e.Part.MIMEType||e.Part.MimeType||`text/plain`,e.RawHtml===void 0?e.RawText!==void 0&&(this.content=e.RawText):(this.rawMessageHtml=e.RawHtml,this.hasRemoteResources=!1,this.content=ht(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})),this.loading=!1;return}let t=await T(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.uid}`);if(!t.ok){if(t.status===401){window.location.hash=`#/login`;return}throw Error(`Failed to fetch message metadata`)}this.message=await t.json(),await this.fetchMessageBody()}catch(e){this.error=e.message}finally{this.loading=!1}}findDisplayPart(e,t){if(!e)return null;if(e.MIMEType&&e.MIMEType.toLowerCase().startsWith(`multipart/`)){if(e.MIMEType.toLowerCase()===`multipart/alternative`){let n=null,r=null;for(let t of e.Children||[])t.MIMEType?.toLowerCase()===`text/plain`&&(n=t),t.MIMEType?.toLowerCase()===`text/html`&&(r=t);return t===`html`?r||n||e.Children[0]:n||r||e.Children[0]}for(let n of e.Children||[]){let e=this.findDisplayPart(n,t);if(e)return e}}return e.MIMEType?.toLowerCase()===`text/html`||e.MIMEType?.toLowerCase()===`text/plain`?e:null}findPartPath(e,t,n=``){if(!e)return null;if(e===t)return n||`1`;if(e.Children&&Array.isArray(e.Children))for(let r=0;r<e.Children.length;r++){let i=n?`${n}.${r+1}`:`${r+1}`,a=this.findPartPath(e.Children[r],t,i);if(a)return a}return null}async fetchMessageBody(){if(!this.message||!this.message.BodyStructure)return;let e=`1`,t=this.findDisplayPart(this.message.BodyStructure,`html`);if(t?(e=this.findPartPath(this.message.BodyStructure,t)||`1`,this.mimeType=t.MIMEType||`text/plain`):(this.mimeType=this.message.BodyStructure.MIMEType||`text/plain`,this.mimeType.toLowerCase()===`text/plain`||this.mimeType.toLowerCase()===`text/html`?e=`1`:this.mimeType=`multipart/mixed`),this.mimeType.toLowerCase().startsWith(`multipart/`)){this.content=``;return}let n=await T(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.uid}/raw?part=${e}`);if(!n.ok)throw Error(`Failed to fetch message body`);this.mimeType.toLowerCase()===`text/html`?(this.rawMessageHtml=await n.text(),this.hasRemoteResources=!1,this.content=ht(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})):this.content=await n.text()}loadRemoteResources(){this.allowRemoteResources=!0,this.rawMessageHtml&&(this.content=ht(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message?.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}}))}updated(e){e.has(`content`)&&this.content&&setTimeout(()=>{window.print()},500)}render(){if(this.loading)return s`
        <div class="loading-state">
          <alps-loader></alps-loader>
          <span>${this.i18nStore?.t(`print.loading`)}</span>
        </div>
      `;if(this.error)return s`
        <div class="error-state">
          <div>${w(`warning`)}</div>
          <span>${this.error}</span>
        </div>
      `;let e=this.message;if(!e)return s``;let t=e.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`),n=e.Envelope?.From?.[0]||{},r=n.Mailbox&&n.Host?`${n.Mailbox}@${n.Host}`:``,i=n.Name||r||this.i18nStore?.t(`messageList.unknownSender`),a=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,o=String(this.settingsStore?.getState()?.hourFormat||`12`),c=e.Envelope?.Date?Fe(e.Envelope.Date,a,o):``,l=e.Envelope?.To&&e.Envelope.To.length>0?e.Envelope.To.map(e=>e.Name?`${e.Name} &lt;${e.Mailbox}@${e.Host}&gt;`:`${e.Mailbox}@${e.Host}`).join(`, `):this.i18nStore?.t(`messageReader.undisclosed`),u=s``;if(e.Envelope?.Cc&&e.Envelope.Cc.length>0){let t=e.Envelope.Cc.map(e=>e.Name?`${e.Name} &lt;${e.Mailbox}@${e.Host}&gt;`:`${e.Mailbox}@${e.Host}`).join(`, `);u=s`<div class="print-cc"><strong>${this.i18nStore?.t(`messageReader.cc`)}</strong> ${t}</div>`}let d;return d=this.mimeType?.toLowerCase()===`text/html`?s`<div .innerHTML=${this.content}></div>`:this.mimeType?.toLowerCase().startsWith(`multipart/`)?s`<div style="font-style: italic; color: #666;">${this.i18nStore?.t(`messageReader.noReadableText`)}</div>`:s`<pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${this.content}</pre>`,s`
      ${this.hasRemoteResources&&!this.allowRemoteResources?s`
        <alps-banner>
          <span>${this.i18nStore.t(`messageReader.remoteContentWarning`)}</span>
          <alps-button slot="action" variant="normal" @click=${this.loadRemoteResources}>
            ${this.i18nStore.t(`messageReader.loadRemoteContent`)}
          </alps-button>
        </alps-banner>
      `:``}
      <div class="print-container">
        <div class="print-header">
          <h2>${t}</h2>
          <div class="print-divider"></div>
          <div class="print-meta-row">
            <div><strong>${i}</strong> ${r?`<${r}>`:``}</div>
            <div class="print-date">${c}</div>
          </div>
          <div class="print-to-row">
            <strong>${this.i18nStore?.t(`messageReader.to`)}</strong> ${l}
            ${u}
          </div>
          <div class="print-divider-thick"></div>
        </div>
        <div class="print-body">
          ${d}
        </div>
      </div>
    `}};A([f({context:S})],X.prototype,`settingsStore`,void 0),A([f({context:x})],X.prototype,`i18nStore`,void 0),A([_()],X.prototype,`loading`,void 0),A([_()],X.prototype,`error`,void 0),A([_()],X.prototype,`mailbox`,void 0),A([_()],X.prototype,`uid`,void 0),A([_()],X.prototype,`message`,void 0),A([_()],X.prototype,`content`,void 0),A([_()],X.prototype,`rawMessageHtml`,void 0),A([_()],X.prototype,`mimeType`,void 0),A([_()],X.prototype,`hasRemoteResources`,void 0),A([_()],X.prototype,`allowRemoteResources`,void 0),X=A([a(`print-page`)],X);var Wt=class extends p{constructor(...e){super(...e),this.statusMessage=``,this.statusType=`info`,this.isLoading=!1,this.isSuccess=!1}static{this.styles=o`
    .status {
      margin-bottom: 24px;
      padding: 8px 12px;
      border-radius: var(--radius-md, 6px);
      font-size: 14px;
      text-align: center;
    }
    
    .status.error {
      background: var(--color-error-muted);
      color: var(--color-error);
      border: 1px solid var(--color-error-muted);
    }
    
    .status.info {
      background: var(--color-info-muted);
      color: var(--color-info);
      border: 1px solid var(--color-info-muted);
    }
    
    .status.success {
      background: var(--color-success-muted);
      color: var(--color-success);
      border: 1px solid var(--color-success-muted);
    }
    

  `}connectedCallback(){super.connectedCallback(),Vt()?setTimeout(()=>{this._handleVerify()},300):(this.statusMessage=this.i18nStore?.t(`webauthn.not_supported`),this.statusType=`error`)}async _handleVerify(){this.isLoading=!0,this.statusMessage=this.i18nStore?.t(`webauthn.requesting`),this.statusType=`info`;try{let e=await fetch(`/webauthn/verify/begin`,{method:`POST`});if(!e.ok)throw Error(this.i18nStore?.t(`webauthn.errors.begin_failed`));let t=await e.json();if(!t||!t.publicKey)throw Error(this.i18nStore?.t(`webauthn.errors.invalid_options`));this.statusMessage=this.i18nStore?.t(`webauthn.waiting_for_key`);let n=await Bt(t);if(this.statusMessage=this.i18nStore?.t(`webauthn.verifying`),(await(await fetch(`/webauthn/verify/finish`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(n)})).json()).success)this.statusMessage=this.i18nStore?.t(`webauthn.success`),this.statusType=`success`,this.isSuccess=!0,setTimeout(()=>{window.location.hash=`#/`,localStorage.removeItem(`alps_settings`),sessionStorage.clear(),window.location.reload()},1e3);else throw Error(this.i18nStore?.t(`webauthn.errors.verification_failed`))}catch(e){this.statusMessage=e.message||this.i18nStore?.t(`webauthn.errors.general`),this.statusType=`error`}finally{this.isLoading=!1}}render(){return s`
      <alps-auth-card
        icon="fingerprint"
        title="${this.i18nStore?.t(`webauthn.title`)}"
        subtitle="${this.i18nStore?.t(`webauthn.instruction`)}"
        style="--auth-card-icon-color: var(--accent-color, #2563eb); --auth-card-icon-size: 64px;"
      >
        ${this.statusMessage?s`
          <div class="status ${this.statusType}">
            ${this.statusMessage}
          </div>
        `:``}
        
        <alps-button 
          variant="primary"
          full-width
          style="height: 36px; margin-top: 4px;"
          @click=${this._handleVerify} 
          ?disabled=${this.isLoading||this.isSuccess||!Vt()}
          ?spinning=${this.isLoading}
        >
          ${this.isLoading?this.i18nStore?.t(`webauthn.verifying_btn`):this.i18nStore?.t(`webauthn.verify_btn`)}
        </alps-button>
        
        <alps-button 
          variant="text"
          full-width
          style="height: 36px; margin-top: 8px;"
          @click=${()=>window.location.hash=`#/login`}
        >
          ← ${this.i18nStore?.t(`webauthn.back_to_login`)}
        </alps-button>
      </alps-auth-card>
    `}};A([f({context:x})],Wt.prototype,`i18nStore`,void 0),A([_()],Wt.prototype,`statusMessage`,void 0),A([_()],Wt.prototype,`statusType`,void 0),A([_()],Wt.prototype,`isLoading`,void 0),A([_()],Wt.prototype,`isSuccess`,void 0),Wt=A([a(`login-webauthn-page`)],Wt);var Gt=new Map;function Kt(e){let t=Gt.get(e);t&&(t.abort(),Gt.delete(e))}async function qt(e){try{await fetch(`/attachments/${e}`,{method:`DELETE`})}catch(e){y.error(`Failed to delete attachment from server:`,e)}}function Jt(e,t,n,r,i,a,o){let s=document.createElement(`input`);s.type=`file`,s.multiple=!0,s.onchange=s=>{let c=Array.from(s.target.files||[]);if(c.length===0)return;let l=0;for(let e of c)l+=e.size;if(t>0&&n+l>t){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:`Attachments exceed the maximum allowed size.`,duration:5e3}}));return}for(let t of c){let n=Math.random().toString(36).substring(2,15);r(n,t);let s=new FormData;s.append(`attachments`,t);let c=new XMLHttpRequest;Gt.set(n,c),c.open(`POST`,`/attachments?composer_id=${encodeURIComponent(e)}`,!0),c.upload.onprogress=e=>{e.lengthComputable&&i(n,Math.round(e.loaded/e.total*100))},c.onload=()=>{if(Gt.delete(n),c.status>=200&&c.status<300)try{let e=JSON.parse(c.responseText),t=Array.isArray(e)?e:e.uuids||[];t.length>0?a(n,t):o(n,Error(`No UUID returned from server`))}catch(e){o(n,e)}else try{let e=JSON.parse(c.responseText);o(n,Error(e.error||`Unknown error`))}catch{o(n,Error(`Upload failed with status `+c.status))}},c.onerror=()=>{Gt.delete(n),o(n,Error(`Network error during upload`))},c.onabort=()=>{Gt.delete(n)},c.send(s)}},s.click()}var Yt=class extends p{constructor(...e){super(...e),this.addresses=[],this.disabled=!1,this.inputText=``}focus(){let e=this.shadowRoot?.querySelector(`input`);e&&e.focus()}_isBlockedAddress(e){let t=e.trim(),n=t.match(/^.*?<([^>]+)>$/);n&&n[1]&&(t=n[1]);let r=t.toLowerCase();return r.startsWith(`noreply`)||r.startsWith(`no-reply`)||r.startsWith(`mailer-daemon`)}_isValidEmail(e){if(this._isBlockedAddress(e))return!1;let t=e.trim();return!!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)||/^.*?<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(t))}_displayAddr(e){let t=e.match(/^(.*?)\s*<([^>]+)>$/);return t&&t[1]?t[1].replace(/^["']|["']$/g,``).trim()||t[2]:e}_handleInput(e){let t=e.target;this.inputText=t.value}_handleKeyDown(e){let t=this.inputText.trim();if(e.key===`Enter`&&t)e.preventDefault(),this._isValidEmail(t)&&this._addAddress(t);else if((e.key===` `||e.key===`,`)&&t)e.preventDefault(),this._isValidEmail(t)&&this._addAddress(t);else if(e.key===`Backspace`&&!this.inputText&&this.addresses.length>0){let e=this.addresses[this.addresses.length-1];this._removeAddress(e),this.inputText=e+` `}}_addAddress(e,t=!0){this.addresses.includes(e)||(this.addresses=[...this.addresses,e],this._notifyChange()),this.inputText=``,t&&this.focus()}_removeAddress(e){this.addresses=this.addresses.filter(t=>t!==e),this._notifyChange()}_notifyChange(){this.dispatchEvent(new CustomEvent(`addresses-changed`,{detail:{addresses:this.addresses},bubbles:!0,composed:!0}))}_handleBlur(){let e=this.inputText.trim();e&&this._isValidEmail(e)&&this._addAddress(e,!1)}static{this.styles=o`
    :host {
      display: block;
      width: 100%;
      position: relative;
      font-family: inherit;
    }

    .address-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      min-height: 32px;
    }

    .pill {
      display: flex;
      align-items: center;
      background: var(--bg-selected);
      border: none;
      border-radius: 4px;
      padding: 2px 2px 2px 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--accent-hover);
      gap: 4px;
    }

    .pill-addr {
      font-size: 13px;
      line-height: 1;
    }

    .pill-remove {
      background: none;
      border: none;
      color: var(--accent-hover);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      border-radius: 4px;
    }

    .pill-remove svg {
      width: 14px;
      height: 14px;
    }

    .pill-remove:hover {
      color: var(--text-color);
    }

    .input-wrapper {
      flex: 1;
      min-width: 144px;
      display: flex;
    }

    input {
      width: 100%;
      border: none;
      outline: none;
      font-size: 14px;
      color: var(--text-color);
      background: transparent;
      padding: 4px 0;
    }
  `}render(){return s`
      <div class="address-container">
        ${this.addresses.map(e=>s`
          <div class="pill" title=${e}>
            <span class="pill-addr">${this._displayAddr(e)}</span>
            <button class="pill-remove" @click=${()=>this._removeAddress(e)} ?disabled=${this.disabled}>
              ${w(`x`)}
            </button>
          </div>
        `)}
        
        <div class="input-wrapper">
          <input
            type="text"
            .value=${this.inputText}
            @input=${this._handleInput}
            @keydown=${this._handleKeyDown}
            @blur=${this._handleBlur}
            ?disabled=${this.disabled}
          />
        </div>
      </div>
    `}};A([i({type:Array})],Yt.prototype,`addresses`,void 0),A([i({type:Boolean})],Yt.prototype,`disabled`,void 0),A([_()],Yt.prototype,`inputText`,void 0),Yt=A([a(`alps-address-input`)],Yt);var Xt=ce.create({name:`fontSize`,addOptions(){return{types:[`textStyle`]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{fontSize:{default:null,parseHTML:e=>e.style.fontSize?.replace(/['"]+/g,``),renderHTML:e=>e.fontSize?{style:`font-size: ${e.fontSize}`}:{}}}}]},addCommands(){return{setFontSize:e=>({chain:t})=>t().setMark(`textStyle`,{fontSize:e}).run(),unsetFontSize:()=>({chain:e})=>e().setMark(`textStyle`,{fontSize:null}).removeEmptyTextStyle().run()}}}),Zt=ce.create({name:`indent`,addOptions(){return{types:[`paragraph`,`heading`,`blockquote`],minIndent:0,maxIndent:240,step:40}},addGlobalAttributes(){return[{types:this.options.types,attributes:{indent:{default:0,parseHTML:e=>parseInt(e.style.marginLeft,10)||0,renderHTML:e=>e.indent?{style:`margin-left: ${e.indent}px`}:{}}}}]},addCommands(){return{indent:()=>({tr:e,state:t,dispatch:n,editor:r})=>{if(r.can().sinkListItem(`listItem`))return r.chain().sinkListItem(`listItem`).run();let i=!1;return t.doc.nodesBetween(t.selection.from,t.selection.to,(t,r)=>{if(this.options.types.includes(t.type.name)){let a=t.attrs.indent||0;a<this.options.maxIndent&&(n&&e.setNodeMarkup(r,null,{...t.attrs,indent:a+this.options.step}),i=!0)}}),i},outdent:()=>({tr:e,state:t,dispatch:n,editor:r})=>{if(r.can().liftListItem(`listItem`))return r.chain().liftListItem(`listItem`).run();let i=!1;return t.doc.nodesBetween(t.selection.from,t.selection.to,(t,r)=>{if(this.options.types.includes(t.type.name)){let a=t.attrs.indent||0;a>this.options.minIndent&&(n&&e.setNodeMarkup(r,null,{...t.attrs,indent:Math.max(this.options.minIndent,a-this.options.step)}),i=!0)}}),i}}}}),Z=class extends p{constructor(...e){super(...e),this.isSending=!1,this.text=``,this.htmlText=``,this.format=`text`,this.attachments=[],this.bubbleMenuState=`view`,this.activeLinkUrl=``,this.activeLinkText=``,this.replyInputRef=g(),this.editorContainerRef=g(),this.bubbleMenuRef=g()}focusEditor(){this.format===`html`&&this.editor?this.editor.commands.focus(`start`):this.replyInputRef.value&&(this.replyInputRef.value.focus(),this.replyInputRef.value.setSelectionRange(0,0))}hasSelection(){if(this.format===`html`&&this.editor)return!this.editor.state.selection.empty;let e=this.replyInputRef.value;return e?e.selectionStart!==e.selectionEnd:!1}getSelectionText(){if(this.format===`html`&&this.editor){if(this.editor.state.selection.empty)return``;let{from:e,to:t}=this.editor.state.selection;return this.editor.state.doc.textBetween(e,t,` `)}let e=this.replyInputRef.value;return e?e.value.substring(e.selectionStart,e.selectionEnd):``}getActiveLink(){return this.format===`html`&&this.editor&&this.editor.isActive(`link`)&&this.editor.getAttributes(`link`).href||null}_getLinkDetails(){if(!this.editor||!this.editor.isActive(`link`))return{url:``,text:``,range:null};let e=this.editor.getAttributes(`link`).href||``,t=re(this.editor.state.selection.$from,this.editor.schema.marks.link),n=``;return t&&(n=this.editor.state.doc.textBetween(t.from,t.to,` `)),{url:e,text:n,range:t}}_enterEditMode(){let e=this._getLinkDetails();this.activeLinkUrl=e.url,this.activeLinkText=e.text,this.bubbleMenuState=`edit`}_applyBubbleLink(e){e.preventDefault();let t=this.shadowRoot?.querySelector(`#bubbleUrl`),n=this.shadowRoot?.querySelector(`#bubbleText`),r=t?.value||``,i=n?.value||``;if(!r||!this.editor)return;let a=this._getLinkDetails();a.range&&(i===a.text?this.editor.chain().focus().setLink({href:r}).run():this.editor.chain().focus().setTextSelection({from:a.range.from,to:a.range.to}).insertContent(i).setTextSelection({from:a.range.from,to:a.range.from+i.length}).setLink({href:r}).run()),this.bubbleMenuState=`view`}get messageText(){return this.text}get messageHtml(){return this.htmlText}getAttachments(){return this.attachments}firstUpdated(){this.initEditor()}disconnectedCallback(){super.disconnectedCallback(),this.editor?.destroy()}updated(e){if(e.has(`isSending`)&&this.editor&&this.editor.setEditable(!this.isSending),e.has(`format`)){let t=e.get(`format`);if(t===`text`&&this.format===`html`){if(this.editor&&this.editor.getText()!==this.text){let e=this.text.split(`
`).map(e=>`<p>${e}</p>`).join(``);this.editor.commands.setContent(e),this.htmlText=this.editor.getHTML()}}else t===`html`&&this.format===`text`&&this.editor&&(this.text=this.editor.getText())}}initEditor(){this.editorContainerRef.value&&(this.editor=new oe({element:this.editorContainerRef.value,extensions:[ne.configure({link:{openOnClick:!1}}),ie.configure({types:[`heading`,`paragraph`]}),se,ae,Xt,Zt,le.configure({element:this.bubbleMenuRef.value,options:{placement:`bottom`},shouldShow:({editor:e})=>this.bubbleMenuState===`edit`?!0:e.isActive(`link`)})],content:this.htmlText||(this.format===`html`?this.text.split(`
`).map(e=>`<p>${e}</p>`).join(``):this.text),onUpdate:({editor:e})=>{this.htmlText=e.getHTML(),this.text=e.getText(),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0}))},onTransaction:({editor:e})=>{!e.isActive(`link`)&&this.bubbleMenuState===`edit`&&(this.bubbleMenuState=`view`),this.requestUpdate()}}),this.editor.setEditable(!this.isSending),this.requestUpdate())}clear(){this.replyInputRef.value&&(this.replyInputRef.value.value=``),this.text=``,this.htmlText=``,this.editor&&this.editor.commands.clearContent(),this.attachments=[],this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:``,html:``},bubbles:!0,composed:!0}))}insertFormatting(e,t=``){if(this.format===`html`&&this.editor){e===`**`?this.editor.chain().focus().toggleBold().run():e===`*`&&this.editor.chain().focus().toggleItalic().run();return}let n=this.replyInputRef.value;if(!n)return;let r=n.selectionStart,i=n.selectionEnd,a=n.value,o=a.substring(r,i);if(o.startsWith(e)&&o.endsWith(t)&&o.length>=e.length+t.length){let a=o.substring(e.length,o.length-t.length);n.setRangeText(a,r,i,`select`)}else r>=e.length&&a.substring(r-e.length,r)===e&&i+t.length<=a.length&&a.substring(i,i+t.length)===t?n.setRangeText(o,r-e.length,i+t.length,`select`):(n.setRangeText(e+o+t,r,i,`select`),r===i&&(n.selectionStart=r+e.length,n.selectionEnd=r+e.length));this.text=n.value,this.editor&&(this.htmlText=this.editor.getHTML()),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0})),n.focus()}insertEmoji(e){if(this.format===`html`&&this.editor)this.editor.chain().focus().insertContent(e).run();else{let t=this.replyInputRef.value;if(!t)return;let n=t.selectionStart,r=t.selectionEnd;t.setRangeText(e,n,r,`end`),this.text=t.value,this.editor&&(this.htmlText=this.editor.getHTML()),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0})),t.focus()}}_handleInput(e){this.text=e.target.value,this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0}))}static{this.styles=[Ye,o`
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
  `]}renderFormattingToolbar(){if(!this.editor||this.format!==`html`)return``;let e=this.editor.getAttributes(`textStyle`).fontSize||`14px`,t=`textAlignLeft`,n=this.editor.isActive({textAlign:`center`}),r=this.editor.isActive({textAlign:`right`}),i=!n&&!r;return n&&(t=`textAlignCenter`),r&&(t=`textAlignRight`),s`
      <div class="formatting-toolbar">
        <alps-popup align="left" class="size-popup">
          <alps-icon-btn slot="trigger" title="Font Size" icon="textSize"></alps-icon-btn>
          <button class="dropdown-item ${e===`10px`?`active`:``}" @click=${()=>this.editor?.chain().focus().setFontSize(`10px`).run()}>Small</button>
          <button class="dropdown-item ${e===`14px`?`active`:``}" @click=${()=>this.editor?.chain().focus().setFontSize(`14px`).run()}>Normal</button>
          <button class="dropdown-item ${e===`18px`?`active`:``}" @click=${()=>this.editor?.chain().focus().setFontSize(`18px`).run()}>Large</button>
          <button class="dropdown-item ${e===`24px`?`active`:``}" @click=${()=>this.editor?.chain().focus().setFontSize(`24px`).run()}>Huge</button>
        </alps-popup>

        <div class="divider"></div>

        <alps-icon-btn ?active=${this.editor.isActive(`bold`)} @click=${()=>this.editor?.chain().focus().toggleBold().run()} title="Bold" icon="textB"></alps-icon-btn>
        <alps-icon-btn ?active=${this.editor.isActive(`italic`)} @click=${()=>this.editor?.chain().focus().toggleItalic().run()} title="Italic" icon="textItalic"></alps-icon-btn>
        <alps-icon-btn ?active=${this.editor.isActive(`underline`)} @click=${()=>this.editor?.chain().focus().toggleUnderline().run()} title="Underline" icon="textUnderline"></alps-icon-btn>
        
        <alps-icon-btn 
          title="Text Color" 
          icon="textAUnderline" 
          @click=${e=>{let t=e.currentTarget.nextElementSibling;t&&t.click()}}>
        </alps-icon-btn>
        <input type="color" style="visibility: hidden; position: absolute; width: 0; height: 0;"
          .value=${this.editor.getAttributes(`textStyle`).color||`#000000`}
          @input=${e=>this.editor?.chain().focus().setColor(e.target.value).run()} />

        <div class="divider"></div>

        <alps-popup align="left" class="align-popup">
          <alps-icon-btn slot="trigger" title="Align" icon="${t}"></alps-icon-btn>
          <button class="dropdown-item ${i?`active`:``}" @click=${()=>this.editor?.chain().focus().setTextAlign(`left`).run()}>
            ${w(`textAlignLeft`)} <span class="item-text">Left</span>
          </button>
          <button class="dropdown-item ${n?`active`:``}" @click=${()=>this.editor?.chain().focus().setTextAlign(`center`).run()}>
            ${w(`textAlignCenter`)} <span class="item-text">Center</span>
          </button>
          <button class="dropdown-item ${r?`active`:``}" @click=${()=>this.editor?.chain().focus().setTextAlign(`right`).run()}>
            ${w(`textAlignRight`)} <span class="item-text">Right</span>
          </button>
        </alps-popup>

        <div class="divider"></div>

        <alps-icon-btn class="desktop-only" ?active=${this.editor.isActive(`orderedList`)} @click=${()=>this.editor?.chain().focus().toggleOrderedList().run()} title="Numbered List" icon="listNumbers"></alps-icon-btn>
        <alps-icon-btn ?active=${this.editor.isActive(`bulletList`)} @click=${()=>this.editor?.chain().focus().toggleBulletList().run()} title="Bulleted List" icon="listBullets"></alps-icon-btn>
        <alps-icon-btn @click=${()=>this.editor?.chain().focus().indent().run()} title="Indent More" icon="textIndent"></alps-icon-btn>
        <alps-icon-btn class="desktop-only" @click=${()=>this.editor?.chain().focus().outdent().run()} title="Indent Less" icon="textOutdent"></alps-icon-btn>
        
        <div class="divider"></div>
        <alps-popup align="right" class="more-formatting-popup">
          <alps-icon-btn slot="trigger" title="More Formatting" icon="dotsThreeVertical"></alps-icon-btn>
          <button class="dropdown-item" @click=${()=>this.editor?.chain().focus().undo().run()}>
            ${w(`arrowUUpLeft`)} Undo
          </button>
          <button class="dropdown-item" @click=${()=>this.editor?.chain().focus().redo().run()}>
            ${w(`arrowUUpRight`)} Redo
          </button>
          <div class="dropdown-divider mobile-only"></div>
          <button class="dropdown-item mobile-only ${this.editor.isActive(`orderedList`)?`active`:``}" @click=${()=>this.editor?.chain().focus().toggleOrderedList().run()}>
            ${w(`listNumbers`)} Numbered List
          </button>
          <button class="dropdown-item mobile-only" @click=${()=>this.editor?.chain().focus().outdent().run()}>
            ${w(`textOutdent`)} Indent Less
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item ${this.editor.isActive(`blockquote`)?`active`:``}" @click=${()=>this.editor?.chain().focus().toggleBlockquote().run()}>
            ${w(`textQuote`)} Quote
          </button>
          <button class="dropdown-item ${this.editor.isActive(`strike`)?`active`:``}" @click=${()=>this.editor?.chain().focus().toggleStrike().run()}>
            ${w(`textStrikethrough`)} Strikethrough
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click=${()=>this.editor?.chain().focus().clearNodes().unsetAllMarks().run()}>
            ${w(`textClearFormat`)} Clear Formatting
          </button>
        </alps-popup>
      </div>
    `}render(){return s`
      <div class="compose-area">
        ${this.renderFormattingToolbar()}
        <div class="editor-container ${this.format===`html`?``:`hidden`}" ${d(this.editorContainerRef)}></div>
        
        <!-- Bubble Menu Container -->
        <div class="bubble-menu-container" ${d(this.bubbleMenuRef)} 
             @mousedown=${e=>e.stopPropagation()} 
             @mouseup=${e=>e.stopPropagation()} 
             @click=${e=>e.stopPropagation()} 
             @touchstart=${e=>e.stopPropagation()} 
             @touchend=${e=>e.stopPropagation()}
             @pointerdown=${e=>e.stopPropagation()}
             @pointerup=${e=>e.stopPropagation()}>
          <div class="bubble-menu-wrapper">
            ${this.bubbleMenuState===`view`?s`
              <div class="bubble-view" @mousedown=${e=>e.preventDefault()}>
                <span class="link-label">Go to link: <a href="${this._getLinkDetails().url}" target="_blank">${this._getLinkDetails().url}</a></span>
                <span class="divider">|</span>
                <button class="bubble-btn" @click=${e=>{e.preventDefault(),this._enterEditMode()}}>Change</button>
                <span class="divider">|</span>
                <button class="bubble-btn" @click=${e=>{e.preventDefault(),this.editor?.chain().focus().unsetLink().run()}}>Remove</button>
              </div>
            `:s`
              <div class="bubble-edit">
                <div class="field-row">
                  <label>Text</label>
                  <alps-input inputId="bubbleText" .value=${this.activeLinkText} @keydown=${e=>{e.key===`Enter`&&this._applyBubbleLink(e),e.stopPropagation()}}></alps-input>
                </div>
                <div class="field-row">
                  <label>Link</label>
                  <alps-input type="url" inputId="bubbleUrl" .value=${this.activeLinkUrl} @keydown=${e=>{e.key===`Enter`&&this._applyBubbleLink(e),e.stopPropagation()}}></alps-input>
                </div>
                <div class="bubble-actions">
                  <alps-button variant="text" @click=${e=>{e.preventDefault(),this.bubbleMenuState=`view`}}>Cancel</alps-button>
                  <alps-button variant="normal" @click=${this._applyBubbleLink}>Apply</alps-button>
                </div>
              </div>
            `}
          </div>
        </div>
        <textarea
          ${d(this.replyInputRef)}
          class="reply-box ${this.format===`html`?`hidden`:``}"
          placeholder="Write your message..."
          ?disabled=${this.isSending}
          .value=${this.text}
          @input=${this._handleInput}
        ></textarea>
      </div>
    `}};A([i({type:Boolean})],Z.prototype,`isSending`,void 0),A([i({type:String})],Z.prototype,`text`,void 0),A([i({type:String})],Z.prototype,`htmlText`,void 0),A([i({type:String})],Z.prototype,`format`,void 0),A([_()],Z.prototype,`attachments`,void 0),A([_()],Z.prototype,`bubbleMenuState`,void 0),A([_()],Z.prototype,`activeLinkUrl`,void 0),A([_()],Z.prototype,`activeLinkText`,void 0),Z=A([a(`alps-message-composer`)],Z);var Qt=class extends p{constructor(...e){super(...e),this.position=`bottom`}static{this.styles=o`
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
  `}_handleEmojiPick(e){let t=e.detail.emoji;this.popup&&this.popup.close(),this.dispatchEvent(new CustomEvent(`emoji-selected`,{detail:{emoji:t},bubbles:!0,composed:!0}))}_handlePopupToggle(){}render(){return s`
      <alps-popup align="left" position="${this.position}" @click=${this._handlePopupToggle}>
        <slot name="trigger" slot="trigger"></slot>
        <div class="selector-container" @click=${e=>e.stopPropagation()}>
          <unicode-emoji-picker
            filters-position="top"
            @emoji-pick=${this._handleEmojiPick}
          ></unicode-emoji-picker>
        </div>
      </alps-popup>
    `}};A([i({type:String})],Qt.prototype,`position`,void 0),A([l(`alps-popup`)],Qt.prototype,`popup`,void 0),Qt=A([a(`alps-emoji-selector-popup`)],Qt);var $t=1e4,Q=class extends p{constructor(...e){super(...e),this.index=0,this.totalOpen=1,this.totalMinimized=0,this.openIndex=0,this.minimizedIndex=0,this.showCc=!1,this.showBcc=!1,this.showDiscardConfirm=!1,this.pendingDiscardType=null,this.windowWidth=window.innerWidth,this.windowHeight=window.innerHeight,this.isSaving=!1,this.autoSaveTimer=null,this._handleResize=()=>{this.windowWidth=window.innerWidth,this.windowHeight=window.innerHeight},this._wasActiveOnMousedown=!1,this.linkPromptFields=[]}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this._handleResize),this.instance.cc&&this.instance.cc.length>0&&(this.showCc=!0),this.instance.bcc&&this.instance.bcc.length>0&&(this.showBcc=!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this._handleResize),this._clearAutoSave()}firstUpdated(){setTimeout(()=>{this.composer&&this.composer.focusEditor&&this.composer.focusEditor()},100)}_clearAutoSave(){this.autoSaveTimer!==null&&(window.clearTimeout(this.autoSaveTimer),this.autoSaveTimer=null)}updated(e){e.has(`instance`)&&this.instance.dirty&&!this.instance.isSending&&this._scheduleAutoSave()}_scheduleAutoSave(){this._clearAutoSave(),this.autoSaveTimer=window.setTimeout(()=>{this._saveDraft()},3e3)}async _saveDraft(){let e=this.composeStore.getComposer(this.instance.id)||this.instance;if(e.isSending||this.isSaving)return;let t=(e.to?.length||0)>0||(e.cc?.length||0)>0||(e.bcc?.length||0)>0,n=e.attachments&&e.attachments.length>0,r=e.text?.trim()!==e.initialText?.trim()||(e.subject?.trim().length||0)>0||n;if(!(!t&&!r)){this.isSaving=!0;try{let t=(e.attachments||[]).map(e=>e.uuid).filter(Boolean),n=this._buildFormData(e);n.append(`save_as_draft`,`1`);let r=await O.saveDraft(n);if(r){let e=this.instance.draftUid;window.dispatchEvent(new CustomEvent(`draft-autosaved`,{detail:{oldUid:e,newUid:r.uid,mailbox:r.mailbox,subject:this.instance.subject,to:this.instance.to,cc:this.instance.cc,bcc:this.instance.bcc,size:r.size,hasAttachments:this.instance.attachments&&this.instance.attachments.length>0}}))}if(!this.isConnected)return;if(r){let n={dirty:!1,draftUid:r.uid,draftMailbox:r.mailbox};if(r.attachments){let i=(e.attachments||[]).filter(e=>!!(e._tempId||e.uuid&&!t.includes(e.uuid)));n.attachments=[...r.attachments,...i]}this.composeStore.updateComposer(this.instance.id,n);let i=this.composeStore.getComposer(this.instance.id),a=(i?.attachments||[]).some(e=>e.uuid&&!t.includes(e.uuid));(i?.dirty||a)&&this._scheduleAutoSave()}}finally{this.isSaving=!1}}}_buildFormData(e){let t=new FormData,n=e.to||[],r=e.cc||[],i=[...e.bcc||[]],a=``;try{let e=localStorage.getItem(`alps_settings`);if(e){let t=JSON.parse(e);t.bccMyself&&t.loginUsername&&(i.includes(t.loginUsername)||i.push(t.loginUsername)),t.replyTo&&(a=t.replyTo)}}catch{}let o=e.text||``,s=(e.subject||``).trim();t.append(`to`,n.join(`, `)),t.append(`cc`,r.join(`, `)),t.append(`bcc`,i.join(`, `)),a&&t.append(`reply_to`,a),t.append(`subject`,s),t.append(`text`,o),e.format===`html`&&e.html&&t.append(`html`,e.html);let c=e.attachments||[],l=c.map(e=>e.uuid).filter(Boolean).join(`,`);l&&t.append(`attachment-uuids`,l);let u=c.map(e=>e.partPath).filter(Boolean).join(`,`);return u&&t.append(`prev_attachments`,u),e.draftMailbox&&t.append(`draft_mailbox`,e.draftMailbox),e.draftUid&&t.append(`draft_uid`,e.draftUid),e.inReplyTo&&t.append(`in_reply_to`,e.inReplyTo),t}get composer(){return this.shadowRoot.querySelector(`alps-message-composer`)}_toggleMinimize(){this.composeStore.updateComposer(this.instance.id,{minimized:!this.instance.minimized,expanded:!1})}_handleHeaderClick(){this.composeStore.bringComposerToFront(this.instance.id),this.instance.minimized?(this.composeStore.updateComposer(this.instance.id,{minimized:!1}),setTimeout(()=>{this.composer&&this.composer.focusEditor&&this.composer.focusEditor()},100)):this._wasActiveOnMousedown||setTimeout(()=>{this.composer&&this.composer.focusEditor&&this.composer.focusEditor()},100)}_toggleExpand(){this.composeStore.updateComposer(this.instance.id,{expanded:!this.instance.expanded,minimized:!1})}_handleCloseClick(){if((this.instance.attachments||[]).some(e=>e.uploading)){this.composeStore.updateComposer(this.instance.id,{closing:!0});return}this.instance.dirty&&this._saveDraft(),this.composeStore.closeComposer(this.instance.id)}_handleDiscardClick(){this._clearAutoSave();let e=!!this.instance.draftUid,t=this.instance.dirty,n=(this.instance.to?.length||0)>0||(this.instance.cc?.length||0)>0||(this.instance.bcc?.length||0)>0,r=this.instance.attachments&&this.instance.attachments.length>0,i=this.instance.text?.trim()!==this.instance.initialText?.trim()||(this.instance.subject?.trim().length||0)>0||r;!(!n&&!i)||e||t?(this.pendingDiscardType=`delete`,this.showDiscardConfirm=!0):this._performDiscard(`delete`)}async _confirmDiscard(){this.showDiscardConfirm=!1;let e=this.pendingDiscardType;this.pendingDiscardType=null,this._performDiscard(e)}async _performDiscard(e){if(e===`delete`&&this.instance.draftUid&&this.instance.draftMailbox)try{await O.deleteMessages(this.instance.draftMailbox,[String(this.instance.draftUid)])}catch(e){y.error(`Failed to delete draft`,e)}if(this.instance.attachments)for(let e of this.instance.attachments)e._tempId?Kt(e._tempId):e.uuid&&qt(e.uuid);this.composeStore.closeComposer(this.instance.id)}_cancelDiscard(){this.showDiscardConfirm=!1,this.pendingDiscardType=null,this.instance.dirty&&this._scheduleAutoSave()}_bringToFront(){let e=this.composeStore.getState().activeComposers,t=1e3;e.forEach(e=>{e.zIndex&&e.zIndex>t&&(t=e.zIndex)}),this._wasActiveOnMousedown=(this.instance.zIndex||0)>=t,this.composeStore.bringComposerToFront(this.instance.id)}_handleLinkClick(){if(!this.composer)return;this.composer.focusEditor&&this.composer.focusEditor();let e=this.composer.hasSelection(),t=this.composer.getActiveLink?this.composer.getActiveLink():null;if(t)this.linkPromptFields=[{id:`url`,label:`Link URL`,placeholder:`https://example.com`,value:t}];else{let t=e&&this.composer.getSelectionText?this.composer.getSelectionText():``;this.linkPromptFields=[{id:`text`,label:`Display Text`,placeholder:`My Website`,value:t},{id:`url`,label:`Link URL`,placeholder:`https://example.com`}]}setTimeout(()=>{(this.shadowRoot?.querySelectorAll(`#linkPopup input`)).forEach(e=>{e.value=this.linkPromptFields.find(t=>t.id===e.id)?.value||``})},50)}_handleLinkSubmit(){let e=this.shadowRoot?.querySelector(`#linkPopup`);if(e&&e.close(),!this.composer)return;let t=this.shadowRoot?.querySelectorAll(`#linkPopup input`),n={};t.forEach(e=>n[e.id]=e.value);let{text:r,url:i}=n;if(i)if(this.instance.format===`html`&&this.composer.editor){let e=this.composer.editor;if(r)e.chain().focus().insertContent(`<a href="${i}">${r}</a>`).command(({tr:t,dispatch:n})=>(n&&e.schema.marks.link&&t.removeStoredMark(e.schema.marks.link),!0)).run();else{let t=e.state.selection.to;e.chain().focus().setLink({href:i}).setTextSelection(t).command(({tr:t,dispatch:n})=>(n&&e.schema.marks.link&&t.removeStoredMark(e.schema.marks.link),!0)).run()}}else r?this.composer.insertFormatting(``,`[${r}](${i})`):this.composer.insertFormatting(`[`,`](${i})`)}async _handleSend(){if((this.instance.attachments||[]).some(e=>e.uploading)){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.attachmentsWait`),duration:3e3}}));return}let e=this.instance.text||``,t=this.instance.to||[],n=this.instance.cc||[],r=this.instance.bcc||[],i=[...t,...n,...r],a=(this.instance.subject||``).trim();if(!(!e||i.length===0||!a)){this._clearAutoSave(),this.composeStore.updateComposer(this.instance.id,{isSending:!0,minimized:!0});try{let e,t=new Promise(t=>{let n=window.setTimeout(()=>{t(!0)},$t);e=()=>{window.clearTimeout(n),t(!1)}});if(window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.sending`),actionLabel:this.i18nStore?.t(`composer.undo`),actionFn:()=>{e&&e()},duration:$t}})),!await t){this.composeStore.updateComposer(this.instance.id,{isSending:!1,minimized:!1}),this.composeStore.bringComposerToFront(this.instance.id);return}let n=this.composeStore.getComposer(this.instance.id)||this.instance,r=this._buildFormData(n);await O.sendDraft(r),n.draftMailbox&&E.fetch(n.draftMailbox,0,``,!1),this.composeStore.closeComposer(this.instance.id)}catch(e){y.error(`Failed to send message:`,e),this.composeStore.updateComposer(this.instance.id,{isSending:!1,minimized:!1,expanded:!1}),this._bringToFront(),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.sendError`)?.replace(`{error}`,e.message),duration:5e3}}))}}}_toggleFormat(){let e=(this.instance.format||`html`)===`html`?`text`:`html`;this.composeStore.updateComposer(this.instance.id,{format:e}),requestAnimationFrame(()=>{setTimeout(()=>{this.composer&&this.composer.focusEditor&&this.composer.focusEditor()},0)})}_handleAttachClick(){let e=(this.settingsStore?.getState()?.maxAttachmentMiB||32)*1024*1024,t=(this.instance.attachments||[]).reduce((e,t)=>e+(t.size||0),0);Jt(this.instance.id,e,t,(e,t)=>{let n=this.composeStore.getComposer(this.instance.id)?.attachments||[],r={_tempId:e,filename:t.name,size:t.size,uploading:!0,progress:0},i=[...n,r];this.composeStore.updateComposer(this.instance.id,{attachments:i})},(e,t)=>{let n=[...this.composeStore.getComposer(this.instance.id)?.attachments||[]],r=n.findIndex(t=>t._tempId===e);r!==-1&&(n[r]={...n[r],progress:t},this.composeStore.updateComposer(this.instance.id,{attachments:n}))},(e,t)=>{let n=[...this.composeStore.getComposer(this.instance.id)?.attachments||[]],r=n.findIndex(t=>t._tempId===e);if(r!==-1){let e={...n[r],uuid:t[0]};delete e.uploading,delete e.progress,delete e._tempId,n[r]=e,this.composeStore.updateComposer(this.instance.id,{attachments:n});let i=this.composeStore.getComposer(this.instance.id),a=(i?.attachments||[]).some(e=>e.uploading);i?.closing&&!a?this._saveDraft().then(()=>{this.composeStore.closeComposer(this.instance.id)}):this._saveDraft()}},(e,t)=>{y.error(`Failed to upload attachment:`,t);let n=[...this.composeStore.getComposer(this.instance.id)?.attachments||[]],r=n.findIndex(t=>t._tempId===e);r!==-1&&(n.splice(r,1),this.composeStore.updateComposer(this.instance.id,{attachments:n}));let i=this.composeStore.getComposer(this.instance.id),a=(i?.attachments||[]).some(e=>e.uploading);i?.closing&&!a?this._saveDraft().then(()=>{this.composeStore.closeComposer(this.instance.id)}):i?.closing||alert(`Failed to upload attachment: `+(t.message||`Unknown error`))})}_removeAttachment(e){let t=[...this.instance.attachments||[]],n=t.splice(e,1)[0];n?._tempId?Kt(n._tempId):n?.uuid&&qt(n.uuid),this.composeStore.updateComposer(this.instance.id,{attachments:t})}static{this.styles=o`
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
      .header-actions alps-icon-btn[title="Minimize"],
      .header-actions alps-icon-btn[title="Expand"] {
        display: none;
      }
    }
  `}render(){if(this.instance.closing)return s`<style>:host { display: none !important; }</style>`;let e=((this.instance.to?.length||0)>0||(this.instance.cc?.length||0)>0||(this.instance.bcc?.length||0)>0)&&(this.instance.text?.trim().length||0)>0,t,n;if(this.instance.minimized)t=24,n=24+this.minimizedIndex*40;else{let e=this.totalMinimized>0?276:0;if(t=24+e+this.openIndex*486,n=0,24+e+this.totalOpen*470>this.windowWidth&&this.totalOpen>1){let n=this.windowWidth-470-48-e,r=n>0?n/(this.totalOpen-1):32;t=24+e+this.openIndex*Math.min(r,470)}}let r,i,a,o,c=this.windowWidth<=768;return this.showDiscardConfirm?(this.style.zIndex=`30000`,c?(a=this.windowWidth,o=this.windowHeight,i=0,r=0,this.removeAttribute(`expanded`)):this.instance.expanded?(a=Math.min(this.windowWidth*.85,800),o=this.windowHeight*.8,i=(this.windowWidth-a)/2,r=(this.windowHeight-o)/2,this.setAttribute(`expanded`,``)):(a=this.instance.minimized?260:470,o=this.instance.minimized?40:500,i=this.windowWidth-t-a,r=this.windowHeight-n-o,this.removeAttribute(`expanded`))):c?(a=this.windowWidth,o=this.windowHeight,i=0,r=0,this.style.zIndex=`30000`,this.removeAttribute(`expanded`)):this.instance.expanded?(a=Math.min(this.windowWidth*.85,800),o=this.windowHeight*.8,i=(this.windowWidth-a)/2,r=(this.windowHeight-o)/2,this.style.zIndex=`30000`,this.setAttribute(`expanded`,``)):(a=this.instance.minimized?260:470,o=this.instance.minimized?40:500,i=this.windowWidth-t-a,r=this.windowHeight-n-o,this.style.zIndex=`${this.instance.zIndex||1e3}`,this.removeAttribute(`expanded`)),this.style.width=`${a}px`,this.style.height=`${o}px`,this.style.left=`${i}px`,this.style.top=`${r}px`,this.instance.minimized?this.setAttribute(`minimized`,``):this.removeAttribute(`minimized`),s`
      ${this.instance.expanded?s`<div class="backdrop"></div>`:``}
      
      ${this.showDiscardConfirm?s`
        <ui-confirm
          title="Discard Draft?"
          message="Are you sure you want to discard this draft? This action cannot be undone."
          confirmText="Discard"
          cancelText="Cancel"
          .isDanger=${!0}
          @confirm=${this._confirmDiscard}
          @cancel=${this._cancelDiscard}
        ></ui-confirm>
      `:``}

      <div class="window-frame" @mousedown=${this._bringToFront}>
        ${this.instance.isSending?s`
          <div class="sending-overlay">
            <alps-loader></alps-loader>
          </div>
        `:``}
        
        <div class="header" @click=${this._handleHeaderClick}>
          <div class="header-title">${this.instance.subject||`New Message`}</div>
          <div class="header-actions">
            ${this.isSaving?s`<span class="saving-indicator">Saving...</span>`:this.instance.draftUid&&!this.instance.dirty?s`<span class="saving-indicator">Autosaved</span>`:``}
            <alps-icon-btn 
              title="${this.instance.minimized?`Restore`:`Minimize`}" 
              icon="${this.instance.minimized?`caretUp`:`composerMinimize`}"
              @click=${e=>{e.stopPropagation(),this._toggleMinimize()}}>
            </alps-icon-btn>
            <alps-icon-btn 
              title="${this.instance.expanded?`Restore`:`Expand`}" 
              icon="${this.instance.expanded?`arrowsInSimple`:`arrowsOutSimple`}"
              @click=${e=>{e.stopPropagation(),this._toggleExpand()}}>
            </alps-icon-btn>
            <alps-icon-btn 
              title="Save & close" 
              icon="x"
              @click=${e=>{e.stopPropagation(),this._handleCloseClick()}}>
            </alps-icon-btn>
          </div>
        </div>

        <div class="content">
          <div class="field-row">
            <span class="field-label">To</span>
            <alps-address-input 
              class="address-input"
              .addresses=${this.instance.to||[]}
              @addresses-changed=${e=>this.composeStore.updateComposer(this.instance.id,{to:e.detail.addresses})}
              ?disabled=${this.instance.isSending}
            ></alps-address-input>
            ${!this.showCc||!this.showBcc?s`
              <div class="cc-bcc-toggles">
                ${this.showCc?``:s`<span @click=${()=>this.showCc=!0}>Cc</span>`}
                ${this.showBcc?``:s`<span @click=${()=>this.showBcc=!0}>Bcc</span>`}
              </div>
            `:``}
          </div>

          ${this.showCc?s`
            <div class="field-row">
              <span class="field-label">Cc</span>
              <alps-address-input 
                class="address-input"
                .addresses=${this.instance.cc||[]}
                @addresses-changed=${e=>this.composeStore.updateComposer(this.instance.id,{cc:e.detail.addresses})}
                ?disabled=${this.instance.isSending}
              ></alps-address-input>
            </div>
          `:``}

          ${this.showBcc?s`
            <div class="field-row">
              <span class="field-label">Bcc</span>
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
              placeholder="Subject" 
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
              @text-changed=${e=>this.composeStore.updateComposer(this.instance.id,{text:e.detail.text,html:e.detail.html})}
            ></alps-message-composer>
          </div>

          <alps-attachment-list
            .attachments=${this.instance.attachments||[]}
            .removable=${!0}
            .composerMode=${!0}
            @remove-attachment=${e=>{let t=(this.instance.attachments||[]).indexOf(e.detail.attachment);t!==-1&&this._removeAttachment(t)}}
          ></alps-attachment-list>

          <div class="send-row">
            <div class="toolbar-actions">
              <alps-icon-btn 
                ?active=${(this.instance.format||`html`)===`html`} 
                title="Toggle Formatting Options" 
                icon="textAa"
                @click=${this._toggleFormat}>
              </alps-icon-btn>
              <alps-icon-btn 
                title="Attach Files" 
                icon="paperclip"
                @click=${this._handleAttachClick}>
              </alps-icon-btn>
              ${(this.instance.format||`html`)===`html`?s`
                <alps-popup id="linkPopup" align="left" position="top">
                  <alps-icon-btn slot="trigger" title="Insert Link" icon="linkSimple" @mousedown=${e=>e.preventDefault()} @click=${this._handleLinkClick}></alps-icon-btn>
                  <div class="popup-form" @keydown=${e=>{e.key===`Enter`&&this._handleLinkSubmit()}}>
                    ${this.linkPromptFields.map(e=>s`
                      <div class="field-group">
                        <label for=${e.id}>${e.label}</label>
                        <alps-input inputId=${e.id} type="text" placeholder=${e.placeholder}></alps-input>
                      </div>
                    `)}
                    <div class="popup-actions">
                      <alps-button variant="text" @click=${()=>(this.shadowRoot?.querySelector(`#linkPopup`))?.close()}>Cancel</alps-button>
                      <alps-button variant="normal" @click=${this._handleLinkSubmit}>Apply</alps-button>
                    </div>
                  </div>
                </alps-popup>
              `:``}
              
              <alps-emoji-selector-popup position="top" @emoji-selected=${e=>this.composer?.insertEmoji(e.detail.emoji)}>
                <alps-icon-btn slot="trigger" title="Insert Emoji" icon="smiley"></alps-icon-btn>
              </alps-emoji-selector-popup>
            </div>
            <div class="send-actions">
              <alps-button variant="text" @click=${e=>{e.stopPropagation(),this._handleDiscardClick()}}>
                Discard
              </alps-button>
              <alps-button variant="primary" @click=${this._handleSend} ?disabled=${this.instance.isSending||!e}>
                Send
              </alps-button>
            </div>
          </div>
        </div>
      </div>
    `}};A([f({context:k})],Q.prototype,`composeStore`,void 0),A([f({context:x})],Q.prototype,`i18nStore`,void 0),A([f({context:S})],Q.prototype,`settingsStore`,void 0),A([i({type:Object})],Q.prototype,`instance`,void 0),A([i({type:Number})],Q.prototype,`index`,void 0),A([i({type:Number})],Q.prototype,`totalOpen`,void 0),A([i({type:Number})],Q.prototype,`totalMinimized`,void 0),A([i({type:Number})],Q.prototype,`openIndex`,void 0),A([i({type:Number})],Q.prototype,`minimizedIndex`,void 0),A([_()],Q.prototype,`showCc`,void 0),A([_()],Q.prototype,`showBcc`,void 0),A([_()],Q.prototype,`showDiscardConfirm`,void 0),A([_()],Q.prototype,`pendingDiscardType`,void 0),A([_()],Q.prototype,`windowWidth`,void 0),A([_()],Q.prototype,`windowHeight`,void 0),A([_()],Q.prototype,`isSaving`,void 0),A([_()],Q.prototype,`linkPromptFields`,void 0),Q=A([a(`alps-floating-composer`)],Q);var en=class extends p{constructor(...e){super(...e),this.show=!1,this.message=``,this.actionLabel=``,this.timeout=0,this._timer=null}updated(e){e.has(`show`)&&(this.show&&this.timeout>0?(this._timer&&clearTimeout(this._timer),this._timer=setTimeout(()=>{this.dismiss()},this.timeout)):!this.show&&this._timer&&(clearTimeout(this._timer),this._timer=null))}dismiss(){this.show=!1,this.dispatchEvent(new CustomEvent(`dismiss`)),this.onAction=void 0}handleAction(){this.onAction?this.onAction():this.dispatchEvent(new CustomEvent(`action`)),this.dismiss()}static{this.styles=o`
    :host {
      display: block;
      transform: translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    :host([show]) {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .toast-container {
      background: var(--toast-bg, rgba(0, 0, 0, 0.85));
      color: var(--toast-fg, #fff);
      border: 1px solid var(--toast-border, rgba(255, 255, 255, 0.1));
      border-radius: 6px;
      padding: 0 4px 0 16px;
      height: 36px;
      box-sizing: border-box;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    /* Action button is now an alps-button and styled via custom properties inline */
  `}render(){return s`
      <div class="toast-container">
        <span>${this.message}</span>
        ${this.actionLabel?s`
          <alps-button 
            variant="normal" 
            @click=${this.handleAction}
            style="--text-primary: var(--toast-fg, #fff); --border-color: currentColor; --bg-tertiary: rgba(255, 255, 255, 0.15); --btn-padding: 4px 10px; --btn-font-size: 12px;"
          >
            ${this.actionLabel}
          </alps-button>
        `:``}
        <alps-icon-btn 
          class="dismiss-btn" 
          icon="x" 
          aria-label="${this.i18nStore?.t(`toast.dismiss`)}" 
          @click=${this.dismiss}
          style="--btn-color: var(--toast-fg, rgba(255, 255, 255, 0.7)); --btn-hover-bg: rgba(255, 255, 255, 0.15); --text-primary: var(--toast-fg, #fff); --btn-icon-size: 16px;"
        ></alps-icon-btn>
      </div>
    `}};A([f({context:x})],en.prototype,`i18nStore`,void 0),A([i({type:Boolean,reflect:!0})],en.prototype,`show`,void 0),A([i({type:String})],en.prototype,`message`,void 0),A([i({type:String})],en.prototype,`actionLabel`,void 0),A([i({type:Object})],en.prototype,`onAction`,void 0),A([i({type:Number})],en.prototype,`timeout`,void 0),en=A([a(`alps-toast`)],en);var tn=new class{constructor(){this.events=[`mousedown`,`mousemove`,`keypress`,`scroll`,`touchstart`],this.logoutMinutes=0,this.lastActivity=Date.now(),this.lastPing=Date.now(),this.checkInterval=null,this.handleActivity=()=>{this.lastActivity=Date.now()}}setLogoutTime(e){let t=this.logoutMinutes>0;this.logoutMinutes=e;let n=this.logoutMinutes>0;n&&!t?(this.attachEvents(),this.startInterval()):!n&&t?(this.detachEvents(),this.clearInterval()):n&&t&&(this.lastActivity=Date.now())}attachEvents(){this.events.forEach(e=>document.addEventListener(e,this.handleActivity,{passive:!0})),this.lastActivity=Date.now()}detachEvents(){this.events.forEach(e=>document.removeEventListener(e,this.handleActivity))}startInterval(){this.clearInterval(),this.checkInterval=setInterval(()=>this.checkTimeout(),3e4)}clearInterval(){this.checkInterval&&=(clearInterval(this.checkInterval),null)}checkTimeout(){if(this.logoutMinutes<=0)return;if(window.location.hash===`#/login`||window.location.hash===``){this.lastActivity=Date.now();return}let e=Date.now()-this.lastActivity;e>=this.logoutMinutes*60*1e3?this.logout():e<300*1e3&&Date.now()-this.lastPing>300*1e3&&this.pingBackend()}async pingBackend(){this.lastPing=Date.now();try{await fetch(`/session`)}catch{}}async logout(){if(this.clearInterval(),this.detachEvents(),this.onBeforeLogout)try{await this.onBeforeLogout()}catch(e){y.error(`Failed to run onBeforeLogout hook`,e)}try{await fetch(`/session`,{method:`DELETE`}),Be.clear(),localStorage.removeItem(`alps_settings`),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`,this.lastActivity=Date.now(),this.setLogoutTime(this.logoutMinutes)}catch(e){y.error(`Failed to auto sign out`,e)}}},nn=3e3,$=class extends p{constructor(...e){super(...e),this.composeStore=new Ge,this.settingsStore=new Te,this.i18nStore=new Se,this.linkedAccountsStore=Ke,this.activeComposers=[],this.toasts=[],this.toastIdCounter=0,this.isOffline=!navigator.onLine,this.offlineCountdown=0,this.offlineInterval=null,this._handleAuthError=()=>{sessionStorage.clear(),localStorage.removeItem(`alps_settings`),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`},this._verifyConnectivity=async()=>{if(!navigator.onLine)return!1;try{let e=await fetch(`/site.webmanifest`,{method:`HEAD`,cache:`no-store`});return!(e.status===502||e.status===503||e.status===504)}catch{return!1}},this._handleOnlineEvent=async()=>{await this._verifyConnectivity()?(this.isOffline=!1,this._stopOfflineCountdown()):this._handleOfflineEvent()},this._handleOfflineEvent=()=>{this.isOffline||(this.isOffline=!0,this.offlineCountdown=10,this._startOfflineCountdown())},this._isPinging=!1,this._handleShowToast=e=>{let t=++this.toastIdCounter,n={id:t,message:e.detail.message,actionLabel:e.detail.actionLabel||``,actionFn:e.detail.actionFn,timeout:e.detail.duration||nn,show:!1};this.toasts=[...this.toasts,n],requestAnimationFrame(()=>{this.toasts=this.toasts.map(e=>e.id===t?{...e,show:!0}:e)})},this._handleBeforeUnload=e=>{if(this.activeComposers.some(e=>e.isSending))return e.preventDefault(),`You have a message currently sending. Are you sure you want to leave?`},this._handleComposeChange=()=>{this.activeComposers=this.composeStore.getState().activeComposers},this._handleSettingsChange=()=>{let e=this.settingsStore.getState();tn.setLogoutTime(e.autoLogout||0),this.i18nStore.setLanguage(e.language||`en`)},this.mailboxPageTemplate=s`<mailbox-page></mailbox-page>`,this.router=new Nt(this.getRoutes(),()=>s`<div>404 Not Found</div>`,()=>this.requestUpdate())}static{this.styles=o`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
    }

    .toast-stack {
      position: fixed;
      bottom: 24px;
      left: 24px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 8px;
      z-index: 50000;
      pointer-events: none;
    }
  `}connectedCallback(){super.connectedCallback(),!(document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`))||document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`)))&&!window.location.hash.startsWith(`#/login`)&&(window.location.hash=`#/login`),this.composeStore.addEventListener(`change`,this._handleComposeChange),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this.activeComposers=this.composeStore.getState().activeComposers,tn.setLogoutTime(this.settingsStore.getState().autoLogout||0),tn.onBeforeLogout=async()=>{await this.composeStore.saveAllDirtyDrafts()},this.i18nStore.setLanguage(this.settingsStore.getState().language||`en`),window.addEventListener(`auth-error`,this._handleAuthError),window.addEventListener(`show-toast`,this._handleShowToast),window.addEventListener(`beforeunload`,this._handleBeforeUnload),window.addEventListener(`online`,this._handleOnlineEvent),window.addEventListener(`offline`,this._handleOfflineEvent),window.addEventListener(`network-error`,this._handleOfflineEvent),this.isOffline&&this._handleOfflineEvent()}disconnectedCallback(){super.disconnectedCallback(),this.composeStore.removeEventListener(`change`,this._handleComposeChange),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),window.removeEventListener(`auth-error`,this._handleAuthError),window.removeEventListener(`show-toast`,this._handleShowToast),window.removeEventListener(`beforeunload`,this._handleBeforeUnload),window.removeEventListener(`online`,this._handleOnlineEvent),window.removeEventListener(`offline`,this._handleOfflineEvent),window.removeEventListener(`network-error`,this._handleOfflineEvent),this._stopOfflineCountdown()}_startOfflineCountdown(){this._stopOfflineCountdown(),this.offlineInterval=window.setInterval(async()=>{if(this.offlineCountdown>1)this.offlineCountdown--;else{if(this.offlineCountdown=10,this._isPinging)return;this._isPinging=!0;try{await this._verifyConnectivity()&&(this.isOffline=!1,this._stopOfflineCountdown())}finally{this._isPinging=!1}}},1e3)}_stopOfflineCountdown(){this.offlineInterval!==null&&(clearInterval(this.offlineInterval),this.offlineInterval=null)}_handleDismissToast(e){this.toasts=this.toasts.map(t=>t.id===e?{...t,show:!1}:t),setTimeout(()=>{this.toasts=this.toasts.filter(t=>t.id!==e)},300)}getRoutes(){let e={"/":()=>this.mailboxPageTemplate,"/login":()=>s`<login-page></login-page>`,"/mailbox/*":()=>this.mailboxPageTemplate,"/settings":()=>s`<settings-page category="general"></settings-page>`,"/settings/*":()=>{let e=window.location.hash.match(/^#\/settings\/?(.*)$/);return s`<settings-page .category=${e&&e[1]?e[1].split(`?`)[0]:`general`}></settings-page>`},"/original":()=>s`<original-message-page></original-message-page>`,"/print":()=>s`<print-page></print-page>`,"/login/webauthn":()=>s`<login-webauthn-page></login-webauthn-page>`};return ue.getRoutes().forEach(t=>{let n=null;e[t.path]=()=>(n||=document.createElement(t.component),n)}),e}render(){let e=this.activeComposers.filter(e=>!e.minimized).length,t=this.activeComposers.filter(e=>e.minimized).length,n=0,r=0;return s`
      ${this.router.render()}
      
      ${this.activeComposers.map((i,a)=>{let o=i.minimized;return s`
          <alps-floating-composer
            .instance=${i}
            .index=${a}
            .totalOpen=${e}
            .totalMinimized=${t}
            .openIndex=${o?0:n++}
            .minimizedIndex=${o?r++:0}
          ></alps-floating-composer>
        `})}
      
      <div class="toast-stack">
        ${this.toasts.map(e=>s`
          <alps-toast
            .show=${e.show}
            .message=${e.message}
            .actionLabel=${e.actionLabel}
            .onAction=${e.actionFn}
            .timeout=${e.timeout}
            @dismiss=${()=>this._handleDismissToast(e.id)}
          ></alps-toast>
        `)}
      </div>

      ${this.isOffline?s`
        <ui-modal title=${this.i18nStore.t(`offline.title`)} .dismissible=${!1} width="400px">
          <div style="text-align: center; padding: 16px 0;">
            <svg style="width: 48px; height: 48px; color: var(--text-muted, #9ca3af); margin-bottom: 16px; fill: currentColor;">
              <use href="/assets/icons/sprite.svg?v=6#wifiSlash"></use>
            </svg>
            <div style="font-weight: 500; font-size: 16px; margin-bottom: 8px; color: var(--text-primary, #111827);">
              ${this.i18nStore.t(`offline.description`)}
            </div>
            <div style="color: var(--text-secondary, #4b5563); font-size: 14px;">
              ${this.i18nStore.t(`offline.tryingAgain`).replace(`{seconds}`,this.offlineCountdown.toString())}
            </div>
          </div>
        </ui-modal>
      `:``}
    `}};A([h({context:k})],$.prototype,`composeStore`,void 0),A([h({context:S})],$.prototype,`settingsStore`,void 0),A([h({context:x})],$.prototype,`i18nStore`,void 0),A([h({context:qe})],$.prototype,`linkedAccountsStore`,void 0),A([_()],$.prototype,`activeComposers`,void 0),A([_()],$.prototype,`toasts`,void 0),A([_()],$.prototype,`isOffline`,void 0),A([_()],$.prototype,`offlineCountdown`,void 0),$=A([a(`app-root`)],$);var rn=Object.assign({"../../plugins/carddav/frontend/index.ts":kt,"../../plugins/password/frontend/index.ts":Mt});y.info(`Loaded ${Object.keys(rn).length} frontend plugins.`);