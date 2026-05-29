const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/openpgp-DR5IM9o-.js","assets/rolldown-runtime-S-ySWqyJ.js"])))=>i.map(i=>d[i]);
import{n as e,r as t}from"./rolldown-runtime-S-ySWqyJ.js";import{_ as n,a as r,c as i,d as a,f as o,g as s,h as c,i as l,l as u,m as d,n as f,o as p,p as m,r as h,s as g,t as _,u as v}from"./lit-C0EuKSUw.js";import{n as ee,r as te,t as ne}from"./vendor-CxikQeXM.js";import{a as re,c as ie,i as ae,n as oe,o as se,r as ce,s as le,t as ue}from"./editor-Dqqk7UQI.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var y=new class{constructor(){this.navTabs=[],this.settingsTabs=[],this.routes=[],this.hooks=new Map,this.enabledPlugins=null}setEnabledPlugins(e){this.enabledPlugins=new Set(e),window.dispatchEvent(new CustomEvent(`plugins-updated`))}registerHook(e,t){this.hooks.has(e)||this.hooks.set(e,[]),this.hooks.get(e).push(t)}async invokeHookAsync(e,t){let n=this.hooks.get(e)||[];return await Promise.all(n.map(e=>e(t)))}invokeHook(e,t){let n=this.hooks.get(e)||[],r=[];return n.forEach(n=>{try{r.push(n(t))}catch(t){console.error(`Error in hook ${e}:`,t)}}),r}registerNavTab(e){this.navTabs.find(t=>t.id===e.id)||this.navTabs.push(e)}getNavTabs(){let e=this.navTabs;return this.enabledPlugins!==null&&(e=e.filter(e=>{let t=e.pluginId||e.id;return this.enabledPlugins.has(t)})),e.slice().sort((e,t)=>(e.order||999)-(t.order||999))}registerSettingsTab(e){this.settingsTabs.find(t=>t.id===e.id)||this.settingsTabs.push(e)}getSettingsTabs(){return this.enabledPlugins===null?this.settingsTabs:this.settingsTabs.filter(e=>{let t=e.pluginId||e.id;return this.enabledPlugins.has(t)})}registerRoute(e){this.routes.find(t=>t.path===e.path)||this.routes.push(e)}getRoutes(){return this.routes}},de=e({default:()=>fe}),fe={calendar:{months:{0:`January`,1:`February`,2:`March`,3:`April`,4:`May`,5:`June`,6:`July`,7:`August`,8:`September`,9:`October`,10:`November`,11:`December`},monthsShort:{0:`Jan`,1:`Feb`,2:`Mar`,3:`Apr`,4:`May`,5:`Jun`,6:`Jul`,7:`Aug`,8:`Sep`,9:`Oct`,10:`Nov`,11:`Dec`},days:{0:`Sunday`,1:`Monday`,2:`Tuesday`,3:`Wednesday`,4:`Thursday`,5:`Friday`,6:`Saturday`},daysShort:{0:`Sun`,1:`Mon`,2:`Tue`,3:`Wed`,4:`Thu`,5:`Fri`,6:`Sat`},daysNarrow:{0:`S`,1:`M`,2:`T`,3:`W`,4:`T`,5:`F`,6:`S`},title:`Calendar`,myCalendars:`My Calendars`,addEvent:`Add Event`,rename:`Rename`,delete:`Delete`,addCalendar:`Add Calendar`,renameCalendar:`Rename Calendar`,deleteCalendar:`Delete Calendar`,calendarName:`Calendar Name`,searchResults:`Search Results`,noResults:`No events found matching your search.`,day:`Day`,week:`Week`,month:`Month`,year:`Year`,today:`Today`,allDay:`All Day`,noTitle:`(No title)`,location:`Location`,notes:`Notes`,editEvent:`Edit Event`,deleteEvent:`Delete Event`,newEvent:`New Event`,summary:`Summary`,eventTitle:`Event title`,calendar:`Calendar`,startDate:`Start Date`,endDate:`End Date`,time:`Time`,addLocation:`Add location`,addDescription:`Add description`,description:`Description`,moreEvents:`+{count} more`,repeat:`Repeat`,repeatNone:`Do not repeat`,repeatDaily:`Daily`,repeatWeekly:`Weekly`,repeatMonthly:`Monthly`,repeatYearly:`Yearly`,repeatCustom:`Custom`}},pe=e({default:()=>me}),me={contacts:{unnamedContact:`Unnamed Contact`,title:`Contacts`,allContacts:`All Contacts`,favorites:`Favorites`,addContact:`Add Contact`,createCategory:`Create Category`,categoryName:`Category Name`,renameCategory:`Rename Category`,deleteCategory:`Delete Category`,deleteCategoryConfirm:`Are you sure you want to delete the category '{category}'? This will remove it from all contacts. No contacts will be deleted.`,rename:`Rename`,delete:`Delete`,create:`Create`,add:`Add`,newCategory:`New Category`,refreshContacts:`Refresh Contacts`,sortZa:`Sort Z-A`,sortAz:`Sort A-Z`,filterStarred:`Filter Starred`,uncategorized:`Uncategorized`,addToCategory:`Add to Category`,deleteContact:`Delete Contact`,deleteContactConfirm:`Are you sure you want to delete this contact?`,editContact:`Edit Contact`,save:`Save`,cancel:`Cancel`,noContacts:`No contacts found`,selectContact:`Select a contact to view details`,selectedContacts:`{count} contacts selected`,clearSelection:`Clear selection`,selectAll:`Select All`,clearSearch:`Clear Search`,searchContacts:`Search contacts...`,details:`Details`,notes:`Notes`,name:`Name`,nickname:`Nickname`,organization:`Organization`,titleField:`Title`,email:`Email`,phone:`Phone`,address:`Address`,url:`URL`,birthday:`Birthday`,back:`Back`,toggleStar:`Toggle Star`,publicKey:`Public Key`}},he=e({default:()=>ge}),ge={settings:{gpg:`GPG Keys`},gpg:{toggleEncryption:`Toggle GPG Encryption`,decryptedSuccess:`The content of this message was end-to-end encrypted with GPG.`,decryptedFailed:`This message is encrypted but no matching private key is found on server to decrypt it.`,passphraseRequired:`GPG Passphrase Required`,passphraseSetTitle:`Set GPG Passphrase`,passphraseConfirmTitle:`Confirm GPG Passphrase`,passphrasePrompt:`Please enter your passphrase to unlock your private key.`,passphraseLockPrompt:`Please enter a new passphrase to encrypt your private key.`,passphraseConfirmPrompt:`Please re-enter your passphrase to confirm.`,passphrase:`Passphrase`,cancel:`Cancel`,unlock:`Unlock`,lock:`Set Passphrase`,confirm:`Confirm`,yourGpgKey:`Your GPG Key`,keyStoredSecurely:`You have a GPG keypair stored securely on the server. The private key is encrypted with your passphrase.`,publicKey:`Public Key`,purgeKeys:`Purge Keypair`,generateNewKeypair:`Generate New Keypair`,enableEncryptionDesc:`To enable end-to-end encryption between contacts that support it, you'll need a GPG keypair.`,noKeyPresent:`No key present`,passphraseRequiredLabel:`Passphrase (Required)`,generateKeysBtn:`Generate Keys`,importExistingKeys:`Import Existing GPG Keypair`,publicKeyBlock:`Public Key Block`,privateKeyBlock:`Private Key Block`,importUnencryptedDesc:`The keys must be unencrypted, we will prompt for a new passphrase to encrypt it.`,importKeysBtn:`Import Keys`,purgeConfirm:`Are you sure you want to permanently delete your GPG keys from the server? Past encrypted emails will become unreadable.`,passphraseMissing:`Passphrase is required to encrypt your new private key.`,importMissing:`Both public and private blocks are required for import.`,generateFailed:`Failed to generate keys: {error}`,importFailed:`Import failed: {error}`,importFailedTitle:`Import Failed`,passphraseMismatch:`Passphrases do not match. Please try again.`,missingPublicKeys:`Cannot encrypt: Missing public keys for:
{keys}`}},_e=e({default:()=>ve}),ve={settings:{categories:{filters:`Filters`}},managesieve:{title:`Filters`,description:`Add custom rules on how messages are processed and filed.`,tabs:{switchToRaw:`Raw Editor`},warningRawSwitchTitle:`Switch to Raw Mode`,warningRawSwitchConfirm:`Switch`,warningRawSwitch:`Switching to raw mode means the script will no longer be editable visually. Continue?`,toast:{saved:`Rules saved and activated.`,deactivated:`Rules deactivated.`,valid:`Script is valid!`,networkError:`Network error occurred.`},visual:{newRule:`New Rule`,noRules:`No rules defined.`,saveFilters:`Save`,deleteRule:`Delete Rule`,remove:`Remove`,add:`Add`,if:`IF`,all:`ALL`,any:`ANY`,ofTheFollowing:`of the following conditions match`,then:`THEN`,actions:{fileinto:`Move to folder`,discard:`Discard (Delete)`,redirect:`Redirect to email`,stop:`Stop evaluating rules`},fields:{subject:`Subject`,from:`From`,to:`To`,body:`Body`,size:`Size`,emailAddress:`Email Address`},operators:{contains:`Contains`,not_contains:`Does not contain`,is:`Is exactly`,not_is:`Is not exactly`,over:`Over`,under:`Under`}},raw:{validate:`Validate`,save:`Save`}}},ye=e({default:()=>be}),be={settings:{categories:{password:`Password`},password:{title:`Password`,changePassword:`Change Password`,changePasswordDesc:`Update your account password.`,oldPassword:`Current Password`,newPassword:`New Password`,confirmPassword:`Confirm New Password`,updatePassword:`Update Password`,fillAllFields:`Please fill in all fields.`,passwordMismatch:`New passwords do not match.`}}},xe={tags:{important:`Important`,work:`Work`,personal:`Personal`,todo:`To Do`,later:`Later`},settings:{title:`Settings`,categories:{general:`General`,identity:`Identity`,reading:`Reading & Composing`,appearance:`Appearance`,localization:`Localization`,accounts:`Linked Accounts`,accountsDesc:`Pre-authorized accounts for quick switching between.`,webauthn:`2FA / WebAuthn`},loading:`Loading...`,placeholderName:`Your Name`,placeholderReplyTo:`reply@example.com`,general:{checkMailInterval:`Check mail interval`,checkMailIntervalDesc:`How often to automatically check for new mail.`,autoLogout:`Auto-logout`,autoLogoutDesc:`Automatically log out after inactivity.`,desktopNotifications:`Enable Desktop Notifications`,soundNotifications:`Play sound notification on new messages`,everyMinute:`Every minute`,every5Minutes:`Every 5 minutes`,every15Minutes:`Every 15 minutes`,every30Minutes:`Every 30 minutes`,never:`Never`,minutes15:`15 minutes`,minutes30:`30 minutes`,hour1:`1 hour`,hours2:`2 hours`,hours6:`6 hours`},identity:{displayName:`Display Name`,displayNameDesc:`The name shown to recipients when you send an email.`,signature:`Signature`,signatureDesc:`Appended to the end of your sent messages.`,replyTo:`Reply-To Address`,replyToDesc:`Optional: specify a different address for replies.`,bccMyself:`Always BCC myself on outgoing mail`},reading:{messagesPerPage:`Messages per page`,preferredView:`Preferred View`,preferredViewDesc:`How to display messages that have both HTML and Plain Text.`,showRemoteContent:`Show Remote Content`,composeFormat:`Compose Format`,html:`HTML`,plainText:`Plain Text`,alwaysAsk:`Always ask`,alwaysLoad:`Always load`,richText:`Rich Text (HTML)`,markReadTimeout:`Mark as Read`,markReadImmediately:`Immediately`,markRead1s:`After 1 second`,markRead3s:`After 3 seconds`,markRead5s:`After 5 seconds`,markRead10s:`After 10 seconds`,markReadNever:`Never mark automatically`,messageSortCriteria:`Message Sort Criteria`,messageSortCriteriaDesc:`Choose whether to sort by the original received date or by folder filing date.`,sortUid:`Folder Filing Date`,sortDate:`Received Date`,enableThreading:`Use threading`,themeIframeContent:`Apply theme to HTML messages content`},appearance:{colorTheme:`Color Theme`,colorThemeDesc:`Select your preferred color palette.`,themeMode:`Theme Mode`,themeModeDesc:`Choose light, dark, or system auto.`,layoutMode:`Layout Mode`,layoutModeDesc:`Choose how you want your mailbox to be laid out.`,listDensity:`List Density`,listDensityDesc:`Adjust the spacing and compactness of the message list.`,light:`Light`,dark:`Dark`,systemAuto:`System Auto`,vertical:`Vertical (3 Panes)`,horizontal:`Horizontal (Top/Bottom)`,fullScreen:`Full Screen (Hide list when reading)`,loose:`Loose`,normal:`Normal`,compact:`Compact`,ultraCompact:`Ultra Compact`},localization:{language:`Language`,timeFormat:`Time Format`,dateFormat:`Date Format`,format12h:`12-hour (AM/PM)`,format24h:`24-hour`,english:`English`,german:`Deutsch`,italian:`Italiano`,spanish:`Español`,serbian:`Српски`,serbianLatin:`Srpski (Latinica)`,french:`Français`,portuguese:`Português`}},linkedAccounts:{description:`Connect another account to quickly switch between them without logging out.`,noAccounts:`No linked accounts.`,remove:`Remove`,addTitle:`Link Account`,linkAccount:`Link Account`,addedSuccess:`Account linked successfully.`,addError:`Failed to add account. Please check the credentials.`,removeConfirm:`Are you sure you want to remove this linked account?`,removedSuccess:`Account removed.`,removeError:`Failed to remove account.`,switchError:`Failed to switch account. The password might have changed.`},webauthn:{title:`Security Key Verification`,instruction:`Please use your security key to complete login.`,not_supported:`WebAuthn is not supported in your browser.`,requesting:`Requesting authentication...`,waiting_for_key:`Waiting for security key...`,verifying:`Verifying...`,success:`Verification successful, redirecting...`,verify_btn:`Verify Identity`,verifying_btn:`Verifying...`,back_to_login:`Back to Login`,key_name_placeholder:`Device name (e.g. YubiKey)`,name_key_title:`Name Security Key`,name_key_label:`Device Name`,add_key:`Add Security Key`,trust_linked:`Trust Linked Accounts`,trust_linked_desc:`If enabled, you can switch to this account from a linked account without providing a 2FA credential again.`,trust_linked_checkbox:`Allow switching to this account without 2FA`,confirm_remove:`Are you sure you want to remove this security key?`,errors:{begin_failed:`Failed to initiate authentication.`,invalid_options:`Invalid authentication options received.`,verification_failed:`Verification failed. Please try again.`,register_failed:`There was an error registering your security key. Please try again.`,remove_failed:`Failed to remove the security key.`,general:`An error occurred.`},settings:{group_desc:`Secure your account with a hardware security key or biometrics.`,keys_title:`Security Keys`,noKeys:`No registered keys.`,added:`Added`,remove_btn:`Remove`}},print:{loading:`Loading print view...`},login:{subtitle:`Sign in to your webmail.`,emailPlaceholder:`Email Address`,passwordPlaceholder:`Password`,keepMeSignedIn:`Keep me signed in`,signIn:`Sign In`,tooManyAttempts:`Too many login attempts`,loginFailed:`Login failed. Please check your credentials.`,networkError:`Network error occurred. Please try again.`,pleaseWait:`Please wait`,wait:`Wait`},folderList:{compose:`Compose`,inbox:`Inbox`,drafts:`Drafts`,sent:`Sent`,archive:`Archive`,spam:`Spam`,junk:`Junk`,trash:`Trash`,title:`Folders`,rename:`Rename`,delete:`Delete`,createFolder:`Create Folder`,renameFolder:`Rename Folder`,deleteFolder:`Delete Folder`,deleteFolderConfirm:`Are you sure you want to delete "{folder}"? All messages inside will be permanently deleted.`,expandSidebar:`Expand sidebar`,collapseSidebar:`Collapse sidebar`,moveToTrash:`Move to Trash`,moveToTrashConfirm:`Are you sure you want to move "{folder}" to the Trash?`,createSubfolder:`Create subfolder`,createSubfolderUnder:`Create Subfolder under "{folder}"`},messageList:{selectAll:`Select all messages`,checkNew:`Check for new messages`,sortDesc:`Sort descending by date`,sortAsc:`Sort ascending by date`,filterStarred:`Filter by starred`,filterUnread:`Filter by unread`,noMessages:`No messages`,loading:`Loading...`,unknownSender:`Unknown Sender`,unknown:`Unknown`,noSubject:`(No Subject)`,hasAttachments:`Has attachments`,replied:`Replied`,forwarded:`Forwarded`,searchResultsFor:`Search results for:`,clearSearch:`Clear search`,totalMessagesIn:`{count} total messages in {folder}`,deleteAllNow:`Delete All Now`,emptyMailboxTitle:`Empty {folder}`,emptyMailboxConfirm:`Are you sure you want to permanently delete all {count} messages in {folder}? This action cannot be undone.`,emptyingMailbox:`Emptying mailbox...`,mailboxEmptied:`Mailbox emptied successfully.`,emptyMailboxFailed:`Failed to empty mailbox. Make sure it is Trash or Junk.`},composer:{attachmentsWait:`Please wait for attachments to finish uploading before sending.`,sending:`Message is being sent...`,undo:`Undo`,sendError:`Failed to send message: {error}`},messageComposer:{fontSize:`Font Size`,small:`Small`,normal:`Normal`,large:`Large`,huge:`Huge`,bold:`Bold`,italic:`Italic`,underline:`Underline`,textColor:`Text Color`,align:`Align`,left:`Left`,center:`Center`,right:`Right`,numberedList:`Numbered List`,bulletedList:`Bulleted List`,indentMore:`Indent More`,indentLess:`Indent Less`,moreFormatting:`More Formatting`,undo:`Undo`,redo:`Redo`,quote:`Quote`,strikethrough:`Strikethrough`,clearFormatting:`Clear Formatting`,goToLink:`Go to link:`,change:`Change`,remove:`Remove`,text:`Text`,link:`Link`,apply:`Apply`,writeMessage:`Write your message...`},floatingComposer:{discardDraftTitle:`Discard Draft?`,discardDraftMessage:`Are you sure you want to discard this draft? This action cannot be undone.`,discard:`Discard`,dropFiles:`Drop files here to attach`,newMessage:`New Message`,saving:`Saving...`,autosaved:`Autosaved`,restore:`Restore`,minimize:`Minimize`,expand:`Expand`,saveAndClose:`Save & close`,to:`To`,cc:`Cc`,bcc:`Bcc`,subject:`Subject`,toggleFormatting:`Toggle Formatting Options`,attachFiles:`Attach Files`,insertLink:`Insert Link`,insertEmoji:`Insert Emoji`,send:`Send`,linkUrl:`Link URL`,linkUrlPlaceholder:`https://example.com`,displayText:`Display Text`,displayTextPlaceholder:`My Website`,apply:`Apply`,uploadFailed:`Failed to upload attachment: {error}`,unknownError:`Unknown error`},messageReader:{tags:`Tags`,removeAllTags:`Remove all tags`,selectMessage:`Select a message to read`,messagesSelected:`messages selected`,back:`Back`,reply:`Reply`,replyAll:`Reply All`,forward:`Forward`,to:`To:`,cc:`Cc:`,undisclosed:`Undisclosed`,loadingMessage:`Loading message...`,remoteContentWarning:`This message contains remote content. For your privacy, it has been blocked.`,loadRemoteContent:`Load remote content`,isDraft:`This is a draft message.`,editDraft:`Edit Draft`,noRecipients:`(No Recipients)`,discardDraft:`Discard Draft`,noReadableText:`This message contains no readable text, only attachments.`,attachments:`Attachments`,downloadAllAttachments:`Download all attachments`,unknownAttachment:`Unknown attachment`,archive:`Archive`,reportSpam:`Report Spam`,notSpam:`Not Spam`,delete:`Delete`,deleteConfirmSingle:`Are you sure you want to permanently delete this message? This action cannot be undone.`,deleteConfirmMultiple:`Are you sure you want to permanently delete these messages? This action cannot be undone.`,markUnread:`Mark as unread`,markRead:`Mark as read`,star:`Star`,moveTo:`Copy/Move to...`,print:`Print`,showPlaintext:`Show plaintext`,showHtml:`Show HTML`,downloadMessage:`Download message`,showOriginal:`Show original`,verifiedSender:`Verified Sender`,unverifiedSender:`Unverified Sender`,clickToExpand:`Click to expand message content`},originalMessage:{title:`Original Message`,loading:`Loading original message...`,errorMissingParams:`Missing mailbox or uid parameters`,errorFailedToFetch:`Failed to fetch original message`,messageId:`Message ID`,createdAt:`Created at`,from:`From`,to:`To`,subject:`Subject`,spf:`SPF`,dkim:`DKIM`,dmarc:`DMARC`,truncatedInfo:`Message is too large to display fully. Showing the first 64KB. Please use "Download Original" to view the entire message.`,downloadOriginal:`Download Original`,copyClipboard:`Copy to clipboard`,copiedTruncated:`Copied truncated content to clipboard.`,copied:`Copied to clipboard.`,copyFailed:`Failed to copy to clipboard.`,none:`NONE`,pass:`PASS`,fail:`FAIL`},folderSelector:{filter:`Filter folders...`,noResults:`No matching folders`,actionMove:`Move to`,actionCopy:`Copy to`},attachment:{remove:`Remove`},navigation:{messages:`Messages`,contacts:`Contacts`,calendar:`Calendar`},userMenu:{settings:`Settings`,signOut:`Sign Out`,profileOptions:`Profile options`},pagination:{previousPage:`Previous page`,nextPage:`Next page`,of:`of`,zeroMessages:`0 messages`},toast:{messagePermanentlyDeleted:`Message permanently deleted`,draftDiscarded:`Draft discarded`,folderRenamed:`Folder renamed`,folderMovedToTrash:`Folder moved to Trash`,folderPermanentlyDeleted:`Folder permanently deleted`,undo:`Undo`,dismiss:`Dismiss`,messageMovedToArchive:`Message moved to Archive`,messagesMovedToArchive:`{count} messages moved to Archive`,messageMovedToSpam:`Message moved to Spam`,messagesMovedToSpam:`{count} messages moved to Spam`,messageMovedToInbox:`Message moved to Inbox`,messagesMovedToInbox:`{count} messages moved to Inbox`,messageMovedToTrash:`Message moved to Trash`,messagesMovedToTrash:`{count} messages moved to Trash`,messageMovedToFolder:`Message moved to {folder}`,messagesMovedToFolder:`{count} messages moved to {folder}`,messageCopiedToFolder:`Message copied to {folder}`,messagesCopiedToFolder:`{count} messages copied to {folder}`,draftsDiscarded:`{count} drafts discarded`,messagesPermanentlyDeleted:`{count} messages permanently deleted`},mailboxPage:{mailboxNotFound:`Mailbox not found`,newMessages:`New Messages`,newMessagesSingleBody:`You have 1 new message`,newMessagesMultiBody:`You have {count} new messages`,newMessagesInInbox:`New messages in Inbox`,newMessagesAvailable:`New messages available`,open:`Open`,refresh:`Refresh`,permanentlyDelete:`Permanently Delete?`,deletePermanently:`Delete Permanently`,undo:`Undo`},offline:{title:`Connection Lost`,description:`Network connectivity lost`,tryingAgain:`Trying again in {seconds} seconds...`},general:{error:`Error`,cancel:`Cancel`,save:`Save`,optional:`Optional`,delete:`Delete`}},b={debug:(...e)=>{},info:(...e)=>{console.info(`[INFO]`,...e)},warn:(...e)=>{console.warn(`[WARN]`,...e)},error:(...e)=>{console.error(`[ERROR]`,...e)}},Se=`modulepreload`,Ce=function(e){return`/`+e},we={},x=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=Ce(t,n),t in we)return;we[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:Se,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})};function Te(e,t){if(typeof e!=`object`||!e)return t;if(typeof t!=`object`||!t)return e;let n={...e};return Object.keys(t).forEach(r=>{typeof t[r]==`object`&&t[r]!==null&&!Array.isArray(t[r])&&r in e?n[r]=Te(e[r],t[r]):n[r]=t[r]}),n}var Ee=Object.assign({"../../../plugins/caldav/frontend/i18n/en.ts":de,"../../../plugins/carddav/frontend/i18n/en.ts":pe,"../../../plugins/gpg/frontend/i18n/en.ts":he,"../../../plugins/managesieve/frontend/i18n/en.ts":_e,"../../../plugins/password/frontend/i18n/en.ts":ye}),De={...xe};for(let e in Ee){let t=Ee[e],n=t.default||t.en||{};De=Te(De,n)}var Oe=De,ke=class extends EventTarget{constructor(){super(),this.language=`en`,this.dictionary=Oe}async setLanguage(e){if(this.language!==e){this.language=e;try{if(e===`en`)this.dictionary=Oe;else{let t={},n=Object.assign({"../i18n/de.ts":()=>x(()=>import(`./de-CGdei4NF.js`),[]),"../i18n/es.ts":()=>x(()=>import(`./es-5ouKlTSZ.js`),[]),"../i18n/fr.ts":()=>x(()=>import(`./fr-C9JWghOS.js`),[]),"../i18n/it.ts":()=>x(()=>import(`./it-Bz2i0ekA.js`),[]),"../i18n/pt.ts":()=>x(()=>import(`./pt-HApCfAl2.js`),[]),"../i18n/rs.ts":()=>x(()=>import(`./rs-CQj1L96D.js`),[]),"../i18n/sr.ts":()=>x(()=>import(`./sr-kTVvujoe.js`),[])})[`../i18n/${e}.ts`];if(n){let r=await n();t=r.default||r[e]}else throw Error(`Locale file not found for ${e}`);let r=Object.assign({"../../../plugins/caldav/frontend/i18n/de.ts":()=>x(()=>import(`./de-CHX82Mih.js`),[]),"../../../plugins/caldav/frontend/i18n/es.ts":()=>x(()=>import(`./es-CE_qkV3b.js`),[]),"../../../plugins/caldav/frontend/i18n/fr.ts":()=>x(()=>import(`./fr-COT7fzwM.js`),[]),"../../../plugins/caldav/frontend/i18n/it.ts":()=>x(()=>import(`./it-sPNxqW-a.js`),[]),"../../../plugins/caldav/frontend/i18n/pt.ts":()=>x(()=>import(`./pt-CimStXX2.js`),[]),"../../../plugins/caldav/frontend/i18n/rs.ts":()=>x(()=>import(`./rs-Cl7S2hrV.js`),[]),"../../../plugins/caldav/frontend/i18n/sr.ts":()=>x(()=>import(`./sr-CStm-m5m.js`),[]),"../../../plugins/carddav/frontend/i18n/de.ts":()=>x(()=>import(`./de-DSIMKznW.js`),[]),"../../../plugins/carddav/frontend/i18n/es.ts":()=>x(()=>import(`./es-3CPMlBZS.js`),[]),"../../../plugins/carddav/frontend/i18n/fr.ts":()=>x(()=>import(`./fr-piM4aOAz.js`),[]),"../../../plugins/carddav/frontend/i18n/it.ts":()=>x(()=>import(`./it-Dg5wVEuA.js`),[]),"../../../plugins/carddav/frontend/i18n/pt.ts":()=>x(()=>import(`./pt-Br_uTAeA.js`),[]),"../../../plugins/carddav/frontend/i18n/rs.ts":()=>x(()=>import(`./rs-Cq2PV90c.js`),[]),"../../../plugins/carddav/frontend/i18n/sr.ts":()=>x(()=>import(`./sr-B4PGlgTr.js`),[]),"../../../plugins/gpg/frontend/i18n/de.ts":()=>x(()=>import(`./de-DFTOoo-s.js`),[]),"../../../plugins/gpg/frontend/i18n/es.ts":()=>x(()=>import(`./es-BFP1Qjyv.js`),[]),"../../../plugins/gpg/frontend/i18n/fr.ts":()=>x(()=>import(`./fr-BfS8-amp.js`),[]),"../../../plugins/gpg/frontend/i18n/it.ts":()=>x(()=>import(`./it-B21YW5-g.js`),[]),"../../../plugins/gpg/frontend/i18n/pt.ts":()=>x(()=>import(`./pt-BeAqf8p8.js`),[]),"../../../plugins/gpg/frontend/i18n/rs.ts":()=>x(()=>import(`./rs-Cqoly8-S.js`),[]),"../../../plugins/gpg/frontend/i18n/sr.ts":()=>x(()=>import(`./sr-Cw6U8EmC.js`),[]),"../../../plugins/managesieve/frontend/i18n/de.ts":()=>x(()=>import(`./de-2p4R8r_O.js`),[]),"../../../plugins/managesieve/frontend/i18n/es.ts":()=>x(()=>import(`./es-Ceotzurd.js`),[]),"../../../plugins/managesieve/frontend/i18n/fr.ts":()=>x(()=>import(`./fr-DNBA9pLz.js`),[]),"../../../plugins/managesieve/frontend/i18n/it.ts":()=>x(()=>import(`./it-aj8cgAIZ.js`),[]),"../../../plugins/managesieve/frontend/i18n/pt.ts":()=>x(()=>import(`./pt-Qs_9prMy.js`),[]),"../../../plugins/managesieve/frontend/i18n/rs.ts":()=>x(()=>import(`./rs-DZeb9vfW.js`),[]),"../../../plugins/managesieve/frontend/i18n/sr.ts":()=>x(()=>import(`./sr-BouvbczH.js`),[]),"../../../plugins/password/frontend/i18n/de.ts":()=>x(()=>import(`./de-Bmc0pcLt.js`),[]),"../../../plugins/password/frontend/i18n/es.ts":()=>x(()=>import(`./es-BTItK4LS.js`),[]),"../../../plugins/password/frontend/i18n/fr.ts":()=>x(()=>import(`./fr-CIcKCuDF.js`),[]),"../../../plugins/password/frontend/i18n/it.ts":()=>x(()=>import(`./it-DhqlGy7Z.js`),[]),"../../../plugins/password/frontend/i18n/pt.ts":()=>x(()=>import(`./pt-oYEXEIxk.js`),[]),"../../../plugins/password/frontend/i18n/rs.ts":()=>x(()=>import(`./rs-0bH0iM4E.js`),[]),"../../../plugins/password/frontend/i18n/sr.ts":()=>x(()=>import(`./sr-DXF7DXTk.js`),[])}),i=[];for(let t in r)t.endsWith(`/${e}.ts`)&&i.push(r[t]());let a=await Promise.all(i);for(let n of a){let r=n.default||n[e]||{};t=Te(t,r)}this.dictionary=t}}catch(t){b.error(`Failed to load language module for ${e}`,t),this.dictionary=Oe}this.dispatchEvent(new CustomEvent(`change`))}}getLanguage(){return this.language}getIntlLanguage(){return this.language===`rs`?`sr-Latn`:this.language===`sr`?`sr-Cyrl`:this.language}t(e,t){let n=e.split(`.`),r=this.dictionary;for(let e of n){if(r==null)break;r=r[e]}if(typeof r!=`string`){let t=Oe;for(let e of n){if(t==null)break;t=t[e]}r=typeof t==`string`?t:e}return typeof r==`string`&&t?r.replace(/\{(\w+)\}/g,(e,n)=>t[n]===void 0?e:String(t[n])):r}},S=u(`i18n-store`),Ae={"default-light":{id:`default-light`,name:`Default Light`,isDark:!1,colors:{"bg-primary":`#ffffff`,"bg-secondary":`#f9fafb`,"bg-tertiary":`#f3f4f6`,"bg-selected":`#eff6ff`,"bg-starred":`#2563eb0f`,"text-primary":`#111827`,"text-sender-read":`#202020`,"text-secondary":`#4b5563`,"text-muted":`#9ca3af`,"border-color":`#e5e7eb`,"accent-color":`#2563eb`,"accent-hover":`#1d4ed8`,"accent-light":`#dbeafe`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`#f3f4f6`}},"default-dark":{id:`default-dark`,name:`Default Dark`,isDark:!0,colors:{"bg-primary":`#1f2937`,"bg-secondary":`#111827`,"bg-tertiary":`#374151`,"bg-selected":`#1e3a8a`,"bg-starred":`#3b82f615`,"text-primary":`#f9fafb`,"text-sender-read":`#e5e7eb`,"text-secondary":`#d1d5db`,"text-muted":`#9ca3af`,"border-color":`#374151`,"accent-color":`#3b82f6`,"accent-hover":`#60a5fa`,"accent-light":`#1e3a8a`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(255, 255, 255, 0.1)`}},"nord-light":{id:`nord-light`,name:`Nord Light`,isDark:!1,colors:{"bg-primary":`#eceff4`,"bg-secondary":`#e5e9f0`,"bg-tertiary":`#d8dee9`,"bg-selected":`#81a1c133`,"bg-starred":`#5e81ac15`,"text-primary":`#2e3440`,"text-sender-read":`#3b4252`,"text-secondary":`#3b4252`,"text-muted":`#4c566a`,"border-color":`#d8dee9`,"accent-color":`#5e81ac`,"accent-hover":`#81a1c1`,"accent-light":`#81a1c133`,success:`#a3be8c`,warning:`#ebcb8b`,error:`#bf616a`,"hover-color":`rgba(0, 0, 0, 0.05)`}},"nord-dark":{id:`nord-dark`,name:`Nord Dark`,isDark:!0,colors:{"bg-primary":`#2e3440`,"bg-secondary":`#3b4252`,"bg-tertiary":`#434c5e`,"bg-selected":`#81a1c133`,"bg-starred":`#88c0d015`,"text-primary":`#eceff4`,"text-sender-read":`#e5e9f0`,"text-secondary":`#e5e9f0`,"text-muted":`#d8dee9`,"border-color":`#434c5e`,"accent-color":`#88c0d0`,"accent-hover":`#81a1c1`,"accent-light":`#81a1c133`,success:`#a3be8c`,warning:`#ebcb8b`,error:`#bf616a`,"hover-color":`rgba(255, 255, 255, 0.1)`}},"ocean-light":{id:`ocean-light`,name:`Ocean Light`,isDark:!1,colors:{"bg-primary":`#f8fafc`,"bg-secondary":`#f1f5f9`,"bg-tertiary":`#e2e8f0`,"bg-selected":`#e0f2fe`,"bg-starred":`#0ea5e915`,"text-primary":`#0f172a`,"text-sender-read":`#1e293b`,"text-secondary":`#334155`,"text-muted":`#64748b`,"border-color":`#cbd5e1`,"accent-color":`#0ea5e9`,"accent-hover":`#0284c7`,"accent-light":`#e0f2fe`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(0, 0, 0, 0.05)`}},"ocean-dark":{id:`ocean-dark`,name:`Ocean Dark`,isDark:!0,colors:{"bg-primary":`#0f172a`,"bg-secondary":`#1e293b`,"bg-tertiary":`#334155`,"bg-selected":`#0c4a6e`,"bg-starred":`#38bdf815`,"text-primary":`#f8fafc`,"text-sender-read":`#e2e8f0`,"text-secondary":`#cbd5e1`,"text-muted":`#94a3b8`,"border-color":`#334155`,"accent-color":`#38bdf8`,"accent-hover":`#0ea5e9`,"accent-light":`#0c4a6e`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(255, 255, 255, 0.1)`}}},je={themeMode:`auto`,colorFamily:`default`,layoutMode:`vertical`,densityMode:`compact`,sidebarCollapsed:!1,enableThreading:!0,themeIframeContent:!1,checkMailInterval:5,autoLogout:30,desktopNotifications:!1,soundNotifications:!0,name:``,signature:``,replyTo:``,bccMyself:!1,messagesPerPage:50,preferredView:`html`,markReadTimeout:0,showRemoteContent:`ask`,composeFormat:`html`,undoTimeout:0,language:`en`,hourFormat:`24`,dateFormat:`YYYY-MM-DD`,sortOrder:`desc`,messageSortCriteria:`date`,maxAttachmentMiB:32},Me=class extends EventTarget{constructor(){super(),this.initialFetchCompleted=!1,this.state=this.loadSettings(),this.applyTheme(),window.matchMedia(`(prefers-color-scheme: dark)`).addEventListener(`change`,()=>{this.state.themeMode===`auto`&&this.applyTheme()}),window.addEventListener(`session-cleared`,()=>{this.initialFetchCompleted=!1,this.state=this.loadSettings(),this.applyTheme(),this.notify()}),window.addEventListener(`user-logged-in`,()=>{this.initializeSession()}),this.initializeSession()}async initializeSession(){this.initialFetchCompleted=!1;let e=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`)),t=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));if(!e&&!t){await this._fetchBackendSettings();return}try{let e=await fetch(`/session`);if(e.ok){let t=await e.json(),n=t.Username||t.username;n&&(this.state=this.loadSettings(n),this.applyTheme(),this.notify())}}catch(e){b.error(`Failed to fetch session username during initialization`,e)}await this._fetchBackendSettings()}loadSettings(e){let t=e?`alps_settings_${e}`:null,n=t?localStorage.getItem(t):null,r={};if(n)try{r=JSON.parse(n)}catch(e){b.error(`Failed to parse user settings`,e)}let i=localStorage.getItem(`alps_settings`),a={};if(i)try{a=JSON.parse(i)}catch(e){b.error(`Failed to parse global settings`,e)}let o={...je,themeMode:r.themeMode??a.themeMode??je.themeMode,colorFamily:r.colorFamily??a.colorFamily??je.colorFamily,layoutMode:r.layoutMode??a.layoutMode??je.layoutMode,densityMode:r.densityMode??a.densityMode??je.densityMode,enableThreading:r.enableThreading??a.enableThreading??je.enableThreading,themeIframeContent:r.themeIframeContent??a.themeIframeContent??je.themeIframeContent,language:r.language??a.language??je.language,loginUsername:e};return n&&Object.assign(o,r),o}saveSettings(){let e=this.state.loginUsername;e&&localStorage.setItem(`alps_settings_${e}`,JSON.stringify(this.state));let t={themeMode:this.state.themeMode,colorFamily:this.state.colorFamily,language:this.state.language,layoutMode:this.state.layoutMode,densityMode:this.state.densityMode,enableThreading:this.state.enableThreading,themeIframeContent:this.state.themeIframeContent};localStorage.setItem(`alps_settings`,JSON.stringify(t))}notify(){this.dispatchEvent(new CustomEvent(`change`))}getState(){return this.state}async updateSettings(e){let t=this.state.loginUsername,n=e.loginUsername;n!==void 0&&n!==t?this.state={...this.loadSettings(n),...e}:this.state={...this.state,...e},this.saveSettings(),(e.themeMode!==void 0||e.colorFamily!==void 0)&&this.applyTheme(),this.notify();let r={...e};if(delete r.loginUsername,Object.keys(r).length>0)return this._saveBackendSettings(this.state)}async _fetchBackendSettings(){let e=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`)),t=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));if(!e&&!t){window.location.hash.startsWith(`#/login`)||window.dispatchEvent(new CustomEvent(`auth-error`)),this.initialFetchCompleted=!0;return}let n=!1;try{let e=await fetch(`/settings`);if(e.status===401){window.dispatchEvent(new CustomEvent(`auth-error`));return}if(e.ok){let t=await e.json(),r={};if(t.MaxAttachmentMiB!==void 0&&(r.maxAttachmentMiB=t.MaxAttachmentMiB),t.HasThreadCapability!==void 0&&(r.hasThreadCapability=t.HasThreadCapability,t.HasThreadCapability===!1&&(r.enableThreading=!1)),t&&t.Settings){let e=t.Settings;if(e.ui){let t=e.ui;t.themeMode&&(r.themeMode=t.themeMode),t.colorFamily&&(r.colorFamily=t.colorFamily),t.layoutMode&&(r.layoutMode=t.layoutMode),t.densityMode&&(r.densityMode=t.densityMode),t.sidebarCollapsed!==void 0&&(r.sidebarCollapsed=t.sidebarCollapsed),t.enableThreading!==void 0&&(r.enableThreading=t.enableThreading),t.themeIframeContent!==void 0&&(r.themeIframeContent=t.themeIframeContent)}e.check_mail_interval!==void 0&&e.check_mail_interval!==0&&(r.checkMailInterval=e.check_mail_interval),e.auto_logout!==void 0&&(r.autoLogout=e.auto_logout),e.desktop_notifications!==void 0&&(r.desktopNotifications=e.desktop_notifications),e.sound_notifications!==void 0&&(r.soundNotifications=e.sound_notifications),e.from!==void 0&&(r.name=e.from),e.signature!==void 0&&(r.signature=e.signature),e.reply_to!==void 0&&(r.replyTo=e.reply_to),e.bcc_myself!==void 0&&(r.bccMyself=e.bcc_myself),e.messages_per_page!==void 0&&e.messages_per_page!==0&&(r.messagesPerPage=e.messages_per_page),e.preferred_view!==void 0&&e.preferred_view!==``&&(r.preferredView=e.preferred_view),e.mark_read_timeout!==void 0&&(r.markReadTimeout=e.mark_read_timeout),e.show_remote_content!==void 0&&e.show_remote_content!==``&&(r.showRemoteContent=e.show_remote_content),e.compose_format!==void 0&&e.compose_format!==``&&(r.composeFormat=e.compose_format),e.undo_timeout!==void 0&&(r.undoTimeout=e.undo_timeout),e.language!==void 0&&e.language!==``&&(r.language=e.language),e.hour_format!==void 0&&e.hour_format!==``&&(r.hourFormat=e.hour_format),e.date_format!==void 0&&e.date_format!==``&&(r.dateFormat=e.date_format),e.sort_order!==void 0&&e.sort_order!==``&&(r.sortOrder=e.sort_order),e.message_sort_criteria!==void 0&&e.message_sort_criteria!==``&&(r.messageSortCriteria=e.message_sort_criteria),e.language||(n=!0),Object.keys(r).length>0&&(this.state={...this.state,...r},this.saveSettings(),this.applyTheme(),this.notify())}}}catch(e){b.error(`Failed to fetch backend settings`,e)}finally{this.initialFetchCompleted=!0}n&&await this._saveBackendSettings(this.state)}async _saveBackendSettings(e){if(this.initialFetchCompleted)try{(await fetch(`/settings`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({ui:{themeMode:e.themeMode,colorFamily:e.colorFamily,layoutMode:e.layoutMode,sidebarCollapsed:e.sidebarCollapsed,enableThreading:e.enableThreading,themeIframeContent:e.themeIframeContent},check_mail_interval:Number(e.checkMailInterval)||0,auto_logout:Number(e.autoLogout)||0,desktop_notifications:!!e.desktopNotifications,sound_notifications:!!e.soundNotifications,from:e.name,signature:e.signature,reply_to:e.replyTo,bcc_myself:!!e.bccMyself,messages_per_page:Number(e.messagesPerPage)||50,preferred_view:e.preferredView,mark_read_timeout:Number(e.markReadTimeout)||0,show_remote_content:e.showRemoteContent,compose_format:e.composeFormat,undo_timeout:Number(e.undoTimeout)||0,language:e.language,hour_format:e.hourFormat,date_format:e.dateFormat,sort_order:e.sortOrder,message_sort_criteria:e.messageSortCriteria})})).status===401&&window.dispatchEvent(new CustomEvent(`auth-error`))}catch(e){b.error(`Failed to save backend settings`,e)}}applyTheme(){let e=!1;this.state.themeMode===`dark`?e=!0:this.state.themeMode===`auto`&&(e=window.matchMedia(`(prefers-color-scheme: dark)`).matches),e?document.body.classList.add(`theme-dark`):document.body.classList.remove(`theme-dark`);let t=Ae[`${this.state.colorFamily}-${e?`dark`:`light`}`]||Ae[`default-${e?`dark`:`light`}`];if(t)for(let[e,n]of Object.entries(t.colors))document.documentElement.style.setProperty(`--${e}`,n)}},C=u(`settings-store`);function Ne(){let e=localStorage.getItem(`alps_settings`);if(e)try{let t=JSON.parse(e),n={};t.themeMode&&(n.themeMode=t.themeMode),t.colorFamily&&(n.colorFamily=t.colorFamily),t.language&&(n.language=t.language),t.layoutMode&&(n.layoutMode=t.layoutMode),t.densityMode&&(n.densityMode=t.densityMode),t.enableThreading!==void 0&&(n.enableThreading=t.enableThreading),t.themeIframeContent!==void 0&&(n.themeIframeContent=t.themeIframeContent),localStorage.setItem(`alps_settings`,JSON.stringify(n))}catch(e){b.error(`Failed to clear and preserve global settings`,e),localStorage.removeItem(`alps_settings`)}let t=`; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`+(window.location.protocol===`https:`?`; Secure`:``);document.cookie=`alps_logged_in=`+t,document.cookie=`alps_has_login_token=`+t}var Pe=[`#2563eb`,`#16a34a`,`#d97706`,`#dc2626`,`#9333ea`,`#0891b2`,`#db2777`,`#ea580c`];function Fe(e){let t=0;for(let n=0;n<e.length;n++)t=e.charCodeAt(n)+((t<<5)-t);return Pe[Math.abs(t)%Pe.length]}function Ie(e,t){let n=e.endsWith(`T00:00:00Z`)||e.endsWith(`T00:00:00.000Z`)||e.length===10,r=t.endsWith(`T00:00:00Z`)||t.endsWith(`T00:00:00.000Z`)||t.length===10;return n&&r}var Le=new class{async fetchCalendars(){let e=await fetch(`/calendar/calendars`);if(!e.ok)throw Error(`Failed to fetch calendars`);return e.json()}async fetchEvents(e,t,n){let r=new URLSearchParams;r.append(`start`,e.toISOString()),r.append(`end`,t.toISOString()),n&&r.append(`query`,n);let i=await fetch(`/calendar/events?${r.toString()}`);if(!i.ok)throw Error(`Failed to fetch events`);return i.json()}async createCalendar(e){let t=await fetch(`/calendar/calendars`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({name:e})});if(!t.ok)throw Error(`Failed to create calendar`);return t.json()}async renameCalendar(e,t){let n=await fetch(`/calendar/calendars/${encodeURIComponent(e)}`,{method:`PATCH`,headers:{"Content-Type":`application/json`},body:JSON.stringify({name:t})});if(!n.ok)throw Error(`Failed to rename calendar`);return n.json()}async deleteCalendar(e){let t=await fetch(`/calendar/calendars/${encodeURIComponent(e)}`,{method:`DELETE`});if(!t.ok)throw Error(`Failed to delete calendar`);return t.json()}async createEvent(e){let t=await fetch(`/calendar/events`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(!t.ok)throw Error(`Failed to create event`);return t.json()}async updateEvent(e,t){let n=await fetch(`/calendar/events/${encodeURIComponent(e)}/edit`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!n.ok)throw Error(`Failed to update event`);return n.json()}async deleteEvent(e){let t=await fetch(`/calendar/events/${encodeURIComponent(e)}`,{method:`DELETE`});if(!t.ok)throw Error(`Failed to delete event`);return t.json()}},w=`INBOX`,Re=`Drafts`,ze=`Sent`,Be=`Archive`,Ve=`Archives`,He=`Spam`,Ue=`Junk`,We=`Trash`;function T(e){return s`
    <svg class="icon">
      <use href="/assets/icons/sprite.svg?v=11#${e}"></use>
    </svg>
  `}function Ge(e){if(!e)return`#78909c`;let t=[`#ef5350`,`#ec407a`,`#ab47bc`,`#7e57c2`,`#5c6bc0`,`#42a5f5`,`#29b6f6`,`#26c6da`,`#26a69a`,`#66bb6a`,`#9ccc65`,`#d4e157`,`#ffca28`,`#ffa726`,`#ff7043`,`#8d6e63`,`#78909c`],n=0;for(let t=0;t<e.length;t++)n=e.charCodeAt(t)+((n<<5)-n);return t[Math.abs(n)%t.length]}function Ke(e,t=`YYYY-MM-DD`,n=`12`){if(!e)return``;let r=typeof e==`string`?new Date(e):e,i=new Date;if(r.getDate()===i.getDate()&&r.getMonth()===i.getMonth()&&r.getFullYear()===i.getFullYear())return r.toLocaleTimeString(void 0,{hour:`2-digit`,minute:`2-digit`,hour12:n===`12`});if(r.getFullYear()!==i.getFullYear()){let e=r.getFullYear(),n=String(r.getMonth()+1).padStart(2,`0`),i=String(r.getDate()).padStart(2,`0`);return t===`YYYY-MM-DD`?`${e}-${n}-${i}`:t===`MM/DD/YYYY`?`${n}/${i}/${e}`:t===`DD.MM.YYYY`?`${i}.${n}.${e}`:r.toLocaleDateString(void 0,{year:`numeric`,month:`short`,day:`numeric`})}return r.toLocaleDateString(void 0,{month:`short`,day:`numeric`})}function qe(e,t=`YYYY-MM-DD`,n=`12`){if(!e)return``;let r=typeof e==`string`?new Date(e):e,i=r.getFullYear(),a=String(r.getMonth()+1).padStart(2,`0`),o=String(r.getDate()).padStart(2,`0`),s=`${i}-${a}-${o}`;t===`MM/DD/YYYY`?s=`${a}/${o}/${i}`:t===`DD.MM.YYYY`&&(s=`${o}.${a}.${i}`);let c=r.toLocaleTimeString(void 0,{hour:`2-digit`,minute:`2-digit`,hour12:n===`12`});return`${s} ${c}`}function Je(e,t){if(!e)return``;let n={[w]:t?.t(`folderList.inbox`),[Re]:t?.t(`folderList.drafts`),[ze]:t?.t(`folderList.sent`),[Be]:t?.t(`folderList.archive`),[Ve]:t?.t(`folderList.archive`),[He]:t?.t(`folderList.spam`),[Ue]:t?.t(`folderList.junk`),[We]:t?.t(`folderList.trash`)};if(n[e])return n[e];let r=e.split(/[.\/]/);return r[r.length-1]||e}function Ye(e){if(!e||e===0)return`0 B`;let t=1024,n=[`B`,`KB`,`MB`,`GB`],r=Math.floor(Math.log(e)/Math.log(t));return Math.round(e/t**+r)+` `+n[r]}var Xe=new Set([`gmail.com`,`yahoo.com`,`hotmail.com`,`outlook.com`,`icloud.com`,`me.com`,`mac.com`,`aol.com`,`proton.me`,`protonmail.com`,`live.com`,`msn.com`,`pm.me`,`yandex.ru`,`mail.ru`,`gmx.de`,`web.de`,`t-online.de`,`orange.fr`,`free.fr`]);function Ze(e){if(!e)return``;let t=e.toLowerCase();return Xe.has(t)?``:`/bimi/avatar?domain=${encodeURIComponent(t)}`}function E(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var Qe=class extends d{constructor(...e){super(...e),this.icon=``,this.title=``,this.disabled=!1,this.active=!1,this.spinning=!1}static{this.styles=n`
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
        ${this.icon?T(this.icon):s`<slot></slot>`}
      </button>
    `}};E([o({type:String})],Qe.prototype,`icon`,void 0),E([o({type:String})],Qe.prototype,`title`,void 0),E([o({type:Boolean})],Qe.prototype,`disabled`,void 0),E([o({type:Boolean,reflect:!0})],Qe.prototype,`active`,void 0),E([o({type:Boolean})],Qe.prototype,`spinning`,void 0),Qe=E([m(`alps-icon-btn`)],Qe);var $e=n`
  .app-container {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }
  .app-container.collapsed {
    --sidebar-width: 64px;
  }
  alps-sidebar.desktop-sidebar {
    width: var(--sidebar-width, 250px);
    flex-shrink: 0;
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
  .sidebar-wrapper {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: transparent;
  }
  .sidebar-wrapper.collapsed .sidebar-content {
    opacity: 0.5;
    overflow-y: hidden;
    pointer-events: none;
  }
  .sidebar-header {
    padding: 0 12px;
    gap: 8px;
    background-color: transparent;
    z-index: 10;
  }
  .sidebar-wrapper.collapsed .sidebar-header,
  :host([collapsed]) .sidebar-header {
    padding: 0 14px !important;
    justify-content: flex-start;
  }
  .sidebar-scroll-content {
    width: calc(max(100%, 215px));
    margin-left: calc(min(0px, (100% - 215px) * 50 / 167));
  }
`,D=class extends d{constructor(...e){super(...e),this.isMobile=!1,this.isOpen=!1,this.collapsed=!1,this.suppressHover=!1,this.isHovered=!1,this.width=250,this.hideFooterDivider=!1,this.showMobileBack=!1,this.isDragging=!1}static{this.styles=n`
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

    .sidebar.dragging {
      transition: none !important;
    }

    :host(:not([collapsed])) .sidebar {
      width: var(--sidebar-width-expanded, 250px);
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

    .mobile-return-btn {
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px;
      border-radius: 6px;
      font-family: inherit;
    }
    .mobile-return-btn:hover {
      background: var(--hover-color, #e5e7eb);
    }
    .mobile-return-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
  `}startResize(e){if(this.isMobile||this.collapsed)return;e.preventDefault(),this.isDragging=!0,this.dispatchEvent(new CustomEvent(`drag-start`));let t=e.clientX,n=this.width,r=e=>{let r=n+(e.clientX-t);this.dispatchEvent(new CustomEvent(`sidebar-resize`,{detail:{newWidth:r,clientX:e.clientX}}))},i=()=>{this.isDragging=!1,window.removeEventListener(`mousemove`,r),window.removeEventListener(`mouseup`,i),this.dispatchEvent(new CustomEvent(`drag-end`))};window.addEventListener(`mousemove`,r),window.addEventListener(`mouseup`,i)}render(){return s`
      <div class="mobile-backdrop" @click=${()=>this.dispatchEvent(new CustomEvent(`close-sidebar`))}></div>
      <aside class="sidebar ${this.isDragging?`dragging`:``}" part="sidebar" style="--sidebar-width-expanded: ${this.width}px">
        <div class="sidebar-content">
          <slot></slot>
        </div>
        <div class="sidebar-footer">
          ${this.isMobile&&this.showMobileBack?s`
            <button class="mobile-return-btn" @click=${()=>window.location.hash=``}>
              ${T(`arrowLeft`)} <span class="return-text">${this.i18nStore?.t(`messageReader.back`)||`Back`}</span>
            </button>
          `:this.isMobile?``:s`
            <alps-icon-btn 
              class="collapse-btn"
              icon="sidebar"
              title=${this.collapsed?this.i18nStore?.t(`folderList.expandSidebar`):this.i18nStore?.t(`folderList.collapseSidebar`)}
              @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-collapse`))}
              style="--btn-padding: 8px; --icon-size: 20px;"
            ></alps-icon-btn>
          `}
          ${!this.hideFooterDivider&&(!this.isMobile||this.showMobileBack)?s`<div class="footer-divider"></div>`:``}
          <div style="display: flex; flex: 1; justify-content: flex-start;">
            <slot name="footer-actions"></slot>
          </div>
        </div>
      </aside>
      <div class="sidebar-resizer ${this.isDragging?`dragging`:``}" @mousedown=${this.startResize}></div>
    `}};E([g({context:S})],D.prototype,`i18nStore`,void 0),E([o({type:Boolean})],D.prototype,`isMobile`,void 0),E([o({type:Boolean})],D.prototype,`isOpen`,void 0),E([o({type:Boolean,reflect:!0})],D.prototype,`collapsed`,void 0),E([o({type:Boolean,reflect:!0})],D.prototype,`suppressHover`,void 0),E([o({type:Boolean,reflect:!0})],D.prototype,`isHovered`,void 0),E([o({type:Number})],D.prototype,`width`,void 0),E([o({type:Boolean})],D.prototype,`hideFooterDivider`,void 0),E([o({type:Boolean})],D.prototype,`showMobileBack`,void 0),E([a()],D.prototype,`isDragging`,void 0),D=E([m(`alps-sidebar`)],D);var et=class extends d{constructor(...e){super(...e),this.options=[],this.value=``}static{this.styles=n`
    :host {
      display: inline-flex;
      background-color: var(--bg-secondary, #f3f4f6);
      border-radius: 6px;
      padding: 2px;
      border: 1px solid var(--border-color, #e5e7eb);
    }

    button {
      background: none;
      border: none;
      padding: 4px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary, #4b5563);
      transition: all 0.2s;
    }

    button.active {
      background-color: var(--bg-primary, #ffffff);
      color: var(--text-primary, #111827);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    :host([full-width]) {
      display: flex;
      width: 100%;
      box-sizing: border-box;
    }

    :host([full-width]) button {
      flex: 1;
    }
  `}render(){return s`
      ${this.options.map(e=>s`
        <button 
          class="${this.value===e.value?`active`:``}" 
          @click=${()=>this._select(e.value)}
        >${e.label}</button>
      `)}
    `}_select(e){this.value!==e&&(this.value=e,this.dispatchEvent(new CustomEvent(`change`,{detail:{value:e}})))}};E([o({type:Array})],et.prototype,`options`,void 0),E([o({type:String})],et.prototype,`value`,void 0),et=E([m(`alps-toggle`)],et);var tt=class extends d{constructor(...e){super(...e),this.variant=`normal`,this.icon=``,this.disabled=!1,this.spinning=!1,this.type=`button`,this.title=``,this.fullWidth=!1,this.handleClick=e=>{if(this.disabled||this.spinning){e.preventDefault(),e.stopPropagation();return}if(this.type===`submit`){let t=this.closest(`form`);t&&(e.preventDefault(),t.requestSubmit())}else if(this.type===`reset`){let t=this.closest(`form`);t&&(e.preventDefault(),t.reset())}}}connectedCallback(){super.connectedCallback(),this.addEventListener(`click`,this.handleClick)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(`click`,this.handleClick)}static{this.styles=n`
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
        background-color: var(--hover-color, rgba(0, 0, 0, 0.05));
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
            ${T(`edelweiss`)}
          </span>
        `:this.icon?s`
          <span class="icon-container">
            ${T(this.icon)}
          </span>
        `:``}
        <span class="content"><slot></slot></span>
      </button>
    `}};E([o({type:String,reflect:!0})],tt.prototype,`variant`,void 0),E([o({type:String})],tt.prototype,`icon`,void 0),E([o({type:Boolean,reflect:!0})],tt.prototype,`disabled`,void 0),E([o({type:Boolean,reflect:!0})],tt.prototype,`spinning`,void 0),E([o({type:String})],tt.prototype,`type`,void 0),E([o({type:String})],tt.prototype,`title`,void 0),E([o({type:Boolean,attribute:`full-width`,reflect:!0})],tt.prototype,`fullWidth`,void 0),tt=E([m(`alps-button`)],tt);var nt=class extends d{constructor(...e){super(...e),this.scrolled=!1}static{this.styles=n`
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
  `}render(){return s`<slot></slot>`}};E([o({type:Boolean,reflect:!0})],nt.prototype,`scrolled`,void 0),nt=E([m(`alps-toolbar`)],nt);var rt=class extends d{constructor(...e){super(...e),this.collapsed=!1,this.icon=`plus`,this.text=``,this.disabled=!1,this.title=``}static{this.styles=n`
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
    `}};E([o({type:Boolean})],rt.prototype,`collapsed`,void 0),E([o({type:String})],rt.prototype,`icon`,void 0),E([o({type:String})],rt.prototype,`text`,void 0),E([o({type:Boolean})],rt.prototype,`disabled`,void 0),E([o({type:String})],rt.prototype,`title`,void 0),rt=E([m(`alps-create-button`)],rt);var it=n`
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
`,at=class extends d{constructor(...e){super(...e),this.title=``,this.isDanger=!1,this.dismissible=!1,this.width=`400px`,this._handleDialogClose=()=>{this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}}static{this.styles=n`
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
    `}};E([o({type:String})],at.prototype,`title`,void 0),E([o({type:Boolean})],at.prototype,`isDanger`,void 0),E([o({type:Boolean})],at.prototype,`dismissible`,void 0),E([o({type:String})],at.prototype,`width`,void 0),at=E([m(`ui-modal`)],at);var O=class extends d{constructor(...e){super(...e),this.type=`text`,this.value=``,this.placeholder=``,this.required=!1,this.autocomplete=``,this.inputId=``,this.icon=``,this.clearable=!1,this.autofocus=!1,this.showPassword=!1}static{this.styles=n`
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
            ${T(n)}
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
            ${T(this.showPassword?`eyeSlash`:`eye`)}
          </button>
        `:this.clearable&&this.value?s`
          <button 
            type="button" 
            class="action-btn" 
            @click=${this.handleClear}
            title="Clear"
            tabindex="-1"
          >
            ${T(`x`)}
          </button>
        `:``}
      </div>
    `}};E([o({type:String})],O.prototype,`type`,void 0),E([o({type:String})],O.prototype,`value`,void 0),E([o({type:String})],O.prototype,`placeholder`,void 0),E([o({type:Boolean})],O.prototype,`required`,void 0),E([o({type:String})],O.prototype,`autocomplete`,void 0),E([o({type:String})],O.prototype,`inputId`,void 0),E([o({type:String})],O.prototype,`icon`,void 0),E([o({type:Boolean})],O.prototype,`clearable`,void 0),E([o({type:Boolean})],O.prototype,`autofocus`,void 0),E([a()],O.prototype,`showPassword`,void 0),O=E([m(`alps-input`)],O);var ot=class extends d{constructor(...e){super(...e),this.value=``,this.options=[]}static{this.styles=n`
		:host {
			display: block;
			position: relative;
		}

		.select-wrapper {
			position: relative;
			display: flex;
			align-items: center;
			width: 100%;
		}

		select {
			width: 100%;
			height: 36px;
			padding: 0 36px 0 12px; /* Extra padding right for the custom caret */
			background: var(--alps-input-bg, var(--bg-primary, #ffffff));
			border: 1px solid var(--border-color, #e5e7eb);
			border-radius: var(--input-radius, 6px);
			color: var(--text-primary, #111827);
			font-family: var(--font-base, 'Inter', sans-serif);
			font-size: var(--input-font-size, 14px);
			transition: all 0.2s ease;
			box-sizing: border-box;
			outline: none;
			appearance: none;
			-webkit-appearance: none;
			-moz-appearance: none;
			cursor: pointer;
		}

		select:focus {
			border-color: var(--accent-color, #005A9E);
			box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
		}

		select:disabled {
			background: var(--bg-tertiary, #f3f4f6);
			cursor: not-allowed;
			opacity: 0.7;
		}

		.caret {
			position: absolute;
			right: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 16px;
			height: 16px;
			color: var(--text-muted, #9ca3af);
			pointer-events: none;
		}

		.caret svg {
			width: 100%;
			height: 100%;
		}
	`}handleChange(e){let t=e.target;this.value=t.value,this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}render(){return s`
			<div class="select-wrapper">
				<select .value=${this.value} @change=${this.handleChange}>
					${this.options.map(e=>s`<option value=${e.value} ?selected=${e.value===this.value} ?disabled=${e.disabled}>${e.label}</option>`)}
				</select>
				<span class="caret">
					${T(`caret-down`)}
				</span>
			</div>
		`}};E([o({type:String})],ot.prototype,`value`,void 0),E([o({type:Array})],ot.prototype,`options`,void 0),ot=E([m(`alps-select`)],ot);var k=class extends d{constructor(...e){super(...e),this.calendars=[],this.open=!1,this.summary=``,this.location=``,this.calendarPath=``,this.description=``,this.startDate=``,this.startTime=``,this.endDate=``,this.endTime=``,this.isAllDay=!1,this.isSaving=!1,this.rruleFreq=``,this.originalRRule=``}static{this.styles=[it,n`
            .form-group {
                margin-bottom: 16px;
            }
            .form-group label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 6px;
                color: var(--text-primary, #111827);
            }
            .form-row {
                display: flex;
                gap: 12px;
            }
            .form-row > div {
                flex: 1;
            }
            alps-input {
                width: 100%;
            }
            textarea {
                width: 100%;
                box-sizing: border-box;
                padding: 8px 12px;
                border: 1px solid var(--border-color, #e5e7eb);
                border-radius: 4px;
                font-family: inherit;
                font-size: 14px;
                resize: vertical;
                min-height: 80px;
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #111827);
            }
            textarea:focus {
                outline: none;
                border-color: var(--accent-color, #2563eb);
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
            }
        `]}updated(e){if(e.has(`open`)&&this.open){let e=e=>e.toString().padStart(2,`0`);if(this.event){this.summary=this.event.summary||``,this.location=this.event.location||``,this.description=this.event.description||``,this.calendarPath=this.event.calendarPath||(this.calendars.length>0?this.calendars[0].path:``);let t=Ie(this.event.start,this.event.end);if(this.isAllDay=t,this.event.rrule?(this.originalRRule=this.event.rrule,this.event.rrule===`FREQ=DAILY`?this.rruleFreq=`DAILY`:this.event.rrule===`FREQ=WEEKLY`?this.rruleFreq=`WEEKLY`:this.event.rrule===`FREQ=MONTHLY`?this.rruleFreq=`MONTHLY`:this.event.rrule===`FREQ=YEARLY`?this.rruleFreq=`YEARLY`:this.rruleFreq=`CUSTOM`):(this.originalRRule=``,this.rruleFreq=``),t){let t=new Date(this.event.start);this.startDate=`${t.getUTCFullYear()}-${e(t.getUTCMonth()+1)}-${e(t.getUTCDate())}`,this.startTime=`00:00`;let n=new Date(this.event.end);n.setUTCDate(n.getUTCDate()-1),this.endDate=`${n.getUTCFullYear()}-${e(n.getUTCMonth()+1)}-${e(n.getUTCDate())}`,this.endTime=`00:00`}else{let t=new Date(this.event.start);this.startDate=`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}`,this.startTime=`${e(t.getHours())}:${e(t.getMinutes())}`;let n=new Date(this.event.end);this.endDate=`${n.getFullYear()}-${e(n.getMonth()+1)}-${e(n.getDate())}`,this.endTime=`${e(n.getHours())}:${e(n.getMinutes())}`}}else{this.summary=``,this.location=``,this.description=``,this.originalRRule=``,this.rruleFreq=``,this.calendarPath=this.calendars.length>0?this.calendars[0].path:``;let t=this.initialDate?new Date(this.initialDate):new Date;if(this.initialDate&&t.getHours()===0&&t.getMinutes()===0)this.isAllDay=!0,this.startDate=`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}`,this.startTime=`00:00`,this.endDate=this.startDate,this.endTime=`00:00`;else{this.isAllDay=!1,this.initialDate||(t.setMinutes(0,0,0),t.setHours(t.getHours()+1)),this.startDate=`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}`,this.startTime=`${e(t.getHours())}:${e(t.getMinutes())}`;let n=new Date(t.getTime()+3600*1e3);this.endDate=`${n.getFullYear()}-${e(n.getMonth()+1)}-${e(n.getDate())}`,this.endTime=`${e(n.getHours())}:${e(n.getMinutes())}`}}}}handleCancel(){this.open=!1,this.dispatchEvent(new CustomEvent(`close`))}async handleSave(){if(!(!this.summary.trim()||!this.startDate||!this.endDate)){this.isSaving=!0;try{let e,t;if(this.isAllDay){e=`${this.startDate}T00:00:00.000Z`;let n=new Date(`${this.endDate}T00:00:00.000Z`);n.setUTCDate(n.getUTCDate()+1),t=n.toISOString()}else{let n=new Date(`${this.startDate}T${this.startTime||`00:00`}`),r=new Date(`${this.endDate}T${this.endTime||`00:00`}`);e=n.toISOString(),t=r.toISOString()}let n;this.rruleFreq===`CUSTOM`?n=this.originalRRule:this.rruleFreq&&(n=`FREQ=${this.rruleFreq}`);let r={summary:this.summary,location:this.location,description:this.description,start:e,end:t,calendarPath:this.calendarPath,rrule:n};this.event&&this.event.path?await Le.updateEvent(this.event.path,r):await Le.createEvent(r),this.open=!1,this.dispatchEvent(new CustomEvent(`saved`))}catch(e){console.error(`Failed to save event`,e)}finally{this.isSaving=!1}}}render(){return this.open?s`
            <ui-modal 
                title="${this.event?this.i18nStore?.t(`calendar.editEvent`):this.i18nStore?.t(`calendar.newEvent`)}" 
                width="450px"
                ?dismissible=${!this.isSaving}
                @cancel=${this.handleCancel}
            >
                <div class="form-group">
                    <label>${this.i18nStore?.t(`calendar.summary`)}</label>
                    <alps-input 
                        .value=${this.summary} 
                        @input=${e=>this.summary=e.target.value}
                        placeholder=${this.i18nStore?.t(`calendar.eventTitle`)}
                    ></alps-input>
                </div>

                ${this.calendars.length>1?s`
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`calendar.calendar`)}</label>
                        <alps-select
                            .value=${this.calendarPath}
                            .options=${this.calendars.map(e=>({value:e.path,label:e.name}))}
                            @change=${e=>this.calendarPath=e.detail.value}
                            ?disabled=${!!this.event}
                        ></alps-select>
                    </div>
                `:``}

                <div class="form-row">
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`calendar.startDate`)}</label>
                        <alps-input 
                            type="date"
                            .value=${this.startDate} 
                            @input=${e=>this.startDate=e.target.value}
                        ></alps-input>
                    </div>
                    ${this.isAllDay?``:s`
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`calendar.time`)}</label>
                        <alps-input 
                            type="time"
                            .value=${this.startTime} 
                            @input=${e=>this.startTime=e.target.value}
                        ></alps-input>
                    </div>
                    `}
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`calendar.endDate`)}</label>
                        <alps-input 
                            type="date"
                            .value=${this.endDate} 
                            @input=${e=>this.endDate=e.target.value}
                        ></alps-input>
                    </div>
                    ${this.isAllDay?``:s`
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`calendar.time`)}</label>
                        <alps-input 
                            type="time"
                            .value=${this.endTime} 
                            @input=${e=>this.endTime=e.target.value}
                        ></alps-input>
                    </div>
                    `}
                </div>

                <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="allday-checkbox" .checked=${this.isAllDay} @change=${e=>this.isAllDay=e.target.checked}>
                    <label for="allday-checkbox" style="margin-bottom: 0; cursor: pointer;">${this.i18nStore?.t(`calendar.allDay`)}</label>
                </div>

                <div class="form-group">
                    <label>${this.i18nStore?.t(`calendar.repeat`)}</label>
                    <alps-select
                        .value=${this.rruleFreq}
                        .options=${[{value:``,label:this.i18nStore?.t(`calendar.repeatNone`)},{value:`DAILY`,label:this.i18nStore?.t(`calendar.repeatDaily`)},{value:`WEEKLY`,label:this.i18nStore?.t(`calendar.repeatWeekly`)},{value:`MONTHLY`,label:this.i18nStore?.t(`calendar.repeatMonthly`)},{value:`YEARLY`,label:this.i18nStore?.t(`calendar.repeatYearly`)},...this.rruleFreq===`CUSTOM`?[{value:`CUSTOM`,label:this.i18nStore?.t(`calendar.repeatCustom`)}]:[]]}
                        @change=${e=>this.rruleFreq=e.target.value}
                    ></alps-select>
                </div>

                <div class="form-group">
                    <label>${this.i18nStore?.t(`calendar.location`)}</label>
                    <alps-input 
                        .value=${this.location} 
                        @input=${e=>this.location=e.target.value}
                        placeholder=${this.i18nStore?.t(`calendar.addLocation`)}
                    ></alps-input>
                </div>

                <div class="form-group">
                    <label>${this.i18nStore?.t(`calendar.description`)}</label>
                    <textarea 
                        .value=${this.description} 
                        @input=${e=>this.description=e.target.value}
                        placeholder=${this.i18nStore?.t(`calendar.addDescription`)}
                    ></textarea>
                </div>

                <div slot="actions">
                    <alps-button variant="text" @click=${this.handleCancel} ?disabled=${this.isSaving}>
                        ${this.i18nStore?.t(`general.cancel`)}
                    </alps-button>
                    <alps-button variant="primary" @click=${this.handleSave} ?disabled=${this.isSaving||!this.summary} ?spinning=${this.isSaving}>
                        ${this.i18nStore?.t(`general.save`)}
                    </alps-button>
                </div>
            </ui-modal>
        `:s``}};E([g({context:S})],k.prototype,`i18nStore`,void 0),E([o({type:Object})],k.prototype,`event`,void 0),E([o({type:Object})],k.prototype,`initialDate`,void 0),E([o({type:Array})],k.prototype,`calendars`,void 0),E([o({type:Boolean})],k.prototype,`open`,void 0),E([a()],k.prototype,`summary`,void 0),E([a()],k.prototype,`location`,void 0),E([a()],k.prototype,`calendarPath`,void 0),E([a()],k.prototype,`description`,void 0),E([a()],k.prototype,`startDate`,void 0),E([a()],k.prototype,`startTime`,void 0),E([a()],k.prototype,`endDate`,void 0),E([a()],k.prototype,`endTime`,void 0),E([a()],k.prototype,`isAllDay`,void 0),E([a()],k.prototype,`isSaving`,void 0),E([a()],k.prototype,`rruleFreq`,void 0),E([a()],k.prototype,`originalRRule`,void 0),k=E([m(`calendar-event-modal`)],k);var st=class extends d{constructor(...e){super(...e),this.events=[],this.showTitle=!1}static{this.styles=n`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .year-month-title {
            color: var(--error, #ef4444);
            font-size: var(--mini-month-title-size, 16px);
            font-weight: 500;
            margin-bottom: 12px;
        }

        .mini-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-auto-rows: 1fr;
            gap: 2px;
            text-align: center;
            font-size: var(--mini-month-font-size, 12px);
            color: var(--text-secondary, #4b5563);
            flex: 1;
        }

        .mini-day-name {
            color: var(--text-muted, #6b7280);
            font-size: var(--mini-month-day-size, 11px);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .mini-day {
            border-radius: 4px;
            cursor: pointer;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .day-num {
            position: relative;
            line-height: 1;
        }

        .mini-day.weekend {
            opacity: 0.65;
        }

        .mini-day:hover {
            background-color: var(--bg-tertiary, #f3f4f6);
        }

        .mini-day.today {
            background-color: var(--error, #ef4444);
            color: #ffffff;
        }

        .mini-day.has-event .day-num::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: var(--text-secondary, #4b5563);
        }
        .mini-day.today.has-event .day-num::after {
            background-color: #ffffff;
        }
    `}getMonthGrid(){let e=new Date(this.year,this.month,1),t=new Date(this.year,this.month+1,0),n=[],r=new Date(e),i=r.getDay();for(i===0&&(i=7),r.setDate(r.getDate()-(i-1));r<=t||n.length%7!=0;)n.push(new Date(r)),r.setDate(r.getDate()+1);return n}hasEventsForDate(e){if(!this.events||this.events.length===0)return!1;let t=new Date(e);t.setHours(0,0,0,0);let n=new Date(e);return n.setHours(23,59,59,999),this.events.some(e=>{if(Ie(e.start,e.end)){let n=e.start.split(`T`)[0],r=e.end.split(`T`)[0],i=new Date(n+`T00:00:00`),a=new Date(r+`T00:00:00`);return i<=t&&a>t}else{let r=new Date(e.start),i=new Date(e.end);return i.getTime()===t.getTime()&&r.getTime()<i.getTime()?!1:r<=n&&i>=t}})}handleDateClick(e){this.dispatchEvent(new CustomEvent(`date-selected`,{detail:{date:e},bubbles:!0,composed:!0}))}render(){let e=this.getMonthGrid(),t=Array.from({length:7},(e,t)=>{let n=new Date(2021,10,t+1);return this.i18nStore?.t(`calendar.daysNarrow.${n.getDay()}`)}),n=new Date;n.setHours(0,0,0,0);let r=this.i18nStore?.t(`calendar.months.${this.month}`);return s`
            ${this.showTitle?s`<div class="year-month-title">${r}</div>`:``}
            <div class="mini-grid">
                ${t.map(e=>s`<div class="mini-day-name">${e}</div>`)}
                ${e.map(e=>{let t=e.getMonth()!==this.month,r=e.getTime()===n.getTime(),i=this.hasEventsForDate(e),a=e.getDay()===0||e.getDay()===6;return s`
                        <div 
                            class="mini-day ${r?`today`:``} ${i?`has-event`:``} ${a?`weekend`:``}" 
                            style="${t?`opacity: 0.3`:``}"
                            @click=${()=>this.handleDateClick(e)}
                        >
                            <span class="day-num">${e.getDate()}</span>
                        </div>
                    `})}
            </div>
        `}};E([g({context:S})],st.prototype,`i18nStore`,void 0),E([o({type:Number})],st.prototype,`year`,void 0),E([o({type:Number})],st.prototype,`month`,void 0),E([o({type:Array})],st.prototype,`events`,void 0),E([o({type:Boolean})],st.prototype,`showTitle`,void 0),E([o({type:Object})],st.prototype,`currentDate`,void 0),st=E([m(`calendar-mini-month`)],st);var ct=n`
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
    position: relative;
  }

  .dropdown-item:focus,
  .dropdown-item:focus-visible {
    z-index: 10;
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
`,lt=class extends d{constructor(...e){super(...e),this.align=`right`,this.position=`bottom`,this.openState=!1,this._handleDialogClick=e=>{this.openState&&e.target===e.currentTarget&&(e.stopPropagation(),e.preventDefault(),this.close())},this._handleDialogClose=()=>{this.openState&&this.close()},this._handleDialogKeydown=e=>{if(this.openState){if(e.key===`ArrowDown`||e.key===`ArrowUp`){e.preventDefault();let t=this._getFocusableElements();if(t.length===0)return;let n=this._getActiveElement(),r=t.findIndex(e=>e===n);r=e.key===`ArrowDown`?r===-1?0:(r+1)%t.length:r===-1?t.length-1:(r-1+t.length)%t.length,t[r].focus()}else if(e.key===`Enter`||e.key===` `){let t=this._getActiveElement();t&&typeof t.click==`function`&&(e.preventDefault(),t.click())}}},this._handleResize=()=>{this.openState&&this._updatePosition()}}static{this.styles=n`
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
      right: var(--arrow-right, 10px);
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent var(--border-color, #e5e7eb) transparent;
    }

    .popup-content.position-bottom.align-right::after {
      top: -5px;
      right: calc(var(--arrow-right, 10px) + 1px);
      border-width: 0 5px 5px 5px;
      border-color: transparent transparent var(--bg-primary, #ffffff) transparent;
    }

    .popup-content.position-bottom.align-left::before {
      top: -6px;
      left: var(--arrow-left, 10px);
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent var(--border-color, #e5e7eb) transparent;
    }

    .popup-content.position-bottom.align-left::after {
      top: -5px;
      left: calc(var(--arrow-left, 10px) + 1px);
      border-width: 0 5px 5px 5px;
      border-color: transparent transparent var(--bg-primary, #ffffff) transparent;
    }

    .popup-content.position-top.align-right::before {
      bottom: -6px;
      right: var(--arrow-right, 10px);
      border-width: 6px 6px 0 6px;
      border-color: var(--border-color, #e5e7eb) transparent transparent transparent;
    }

    .popup-content.position-top.align-right::after {
      bottom: -5px;
      right: calc(var(--arrow-right, 10px) + 1px);
      border-width: 5px 5px 0 5px;
      border-color: var(--bg-primary, #ffffff) transparent transparent transparent;
    }

    .popup-content.position-top.align-left::before {
      bottom: -6px;
      left: var(--arrow-left, 10px);
      border-width: 6px 6px 0 6px;
      border-color: var(--border-color, #e5e7eb) transparent transparent transparent;
    }

    .popup-content.position-top.align-left::after {
      bottom: -5px;
      left: calc(var(--arrow-left, 10px) + 1px);
      border-width: 5px 5px 0 5px;
      border-color: var(--bg-primary, #ffffff) transparent transparent transparent;
    }
  `}open(){this.openState=!0,this.dispatchEvent(new CustomEvent(`popup-open`,{bubbles:!0,composed:!0}))}close(){this.openState=!1,this.dispatchEvent(new CustomEvent(`popup-close`,{bubbles:!0,composed:!0}))}toggle(e){this.openState?this.close():this.open()}_getActiveElement(){let e=document.activeElement;for(;e?.shadowRoot&&e.shadowRoot.activeElement;)e=e.shadowRoot.activeElement;return e}_getFocusableElements(){let e=this.shadowRoot?.querySelector(`slot:not([name])`);if(!e)return[];let t=e.assignedElements({flatten:!0}),n=[],r=`button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])`;return t.forEach(e=>{if(e instanceof HTMLElement){e.matches(r)&&n.push(e);let t=Array.from(e.querySelectorAll(r));n.push(...t)}}),n}updated(e){if(super.updated(e),e.has(`openState`)){let e=this.shadowRoot?.querySelector(`.popup-dialog`);if(this.openState)e&&!e.open&&e.showModal(),this._updatePosition();else if(e&&e.open){e.close();let t=this.shadowRoot?.querySelector(`slot[name="trigger"]`);t&&t.assignedElements({flatten:!0}).forEach(e=>{e instanceof HTMLElement&&e.blur()})}}}_updatePosition(){let e=this.shadowRoot?.querySelector(`.trigger`),t=this.shadowRoot?.querySelector(`.popup-content`);if(!e||!t)return;let n=e.getBoundingClientRect(),r=t.getBoundingClientRect(),i=this.position,a=this.align;if(this.position===`bottom`?n.bottom+8+r.height>window.innerHeight&&n.top-8-r.height>=0&&(i=`top`):n.top-8-r.height<0&&n.bottom+8+r.height<=window.innerHeight&&(i=`bottom`),this.align===`right`?n.right-r.width<0&&n.left+r.width<=window.innerWidth&&(a=`left`):n.left+r.width>window.innerWidth&&n.right-r.width>=0&&(a=`right`),i===`bottom`?(t.style.top=`${n.bottom+8}px`,t.style.bottom=`auto`):(t.style.bottom=`${window.innerHeight-n.top+8}px`,t.style.top=`auto`),a===`right`){let e=window.innerWidth-n.right;e+r.width>window.innerWidth&&(e=window.innerWidth-r.width-8),e=Math.max(8,e),t.style.right=`${e}px`,t.style.left=`auto`;let i=n.left+n.width/2,a=window.innerWidth-e-i-6;t.style.setProperty(`--arrow-right`,`${Math.max(10,Math.min(r.width-20,a))}px`)}else{let e=n.left;e+r.width>window.innerWidth&&(e=window.innerWidth-r.width-8),e=Math.max(8,e),t.style.left=`${e}px`,t.style.right=`auto`;let i=n.left+n.width/2-e-6;t.style.setProperty(`--arrow-left`,`${Math.max(10,Math.min(r.width-20,i))}px`)}t.classList.remove(`position-top`,`position-bottom`,`align-left`,`align-right`),t.classList.add(`position-${i}`,`align-${a}`)}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this._handleResize,{passive:!0})}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this._handleResize)}render(){return s`
      <div class="trigger" @click=${this.toggle}>
        <slot name="trigger"></slot>
      </div>
      
      <dialog class="popup-dialog" 
        @pointerdown=${this._handleDialogClick} 
        @contextmenu=${this._handleDialogClick} 
        @close=${this._handleDialogClose}
        @keydown=${this._handleDialogKeydown}>
        <div class="popup-content align-${this.align} position-${this.position}">
          <slot></slot>
        </div>
      </dialog>
    `}};E([o({type:String})],lt.prototype,`align`,void 0),E([o({type:String})],lt.prototype,`position`,void 0),E([o({type:Boolean,reflect:!0,attribute:`open`})],lt.prototype,`openState`,void 0),lt=E([m(`alps-popup`)],lt);var ut=class extends d{static{this.styles=n`
        :host {
            display: block;
            padding: 12px;
            min-width: 280px;
            max-width: 320px;
            white-space: normal;
            cursor: default;
            box-sizing: border-box;
            background: var(--bg-primary, #ffffff);
            border-radius: 8px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 4px 4px 12px 4px;
        }

        .title-container {
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }

        .color-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-top: 5px;
            flex-shrink: 0;
        }

        .title {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary, #111827);
            word-break: break-word;
            line-height: 1.4;
        }

        .edit-btn {
            --icon-size: 16px;
            color: var(--text-secondary, #6b7280);
            margin-left: 12px;
            flex-shrink: 0;
        }

        .card {
            background: var(--bg-secondary, #f3f4f6);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .card:last-child {
            margin-bottom: 0;
        }

        .card-row {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary, #111827);
        }

        .card-row svg {
            width: 18px;
            height: 18px;
            fill: currentColor;
            color: var(--text-muted, #9ca3af);
        }

        .card-text {
            font-size: 13px;
            color: var(--text-secondary, #4b5563);
            margin-left: 22px;
            line-height: 1.4;
        }

        .card-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted, #9ca3af);
            margin-bottom: 2px;
        }

        .description-text {
            font-size: 13px;
            color: var(--text-primary, #111827);
            white-space: pre-wrap;
            line-height: 1.5;
        }

        .date-primary {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #111827);
        }

        .date-secondary {
            font-size: 13px;
            color: var(--text-secondary, #4b5563);
        }
    `}formatEventDate(e,t){let n=Ie(e,t),r;return r=n?new Date(e.split(`T`)[0]+`T00:00:00`):new Date(e),`${this.i18nStore?.t(`calendar.days.${r.getDay()}`)}, ${this.i18nStore?.t(`calendar.monthsShort.${r.getMonth()}`)} ${r.getDate()}, ${r.getFullYear()}`}formatEventTimeRange(e,t){let n=new Date(e),r=new Date(t);if(Ie(e,t))return this.i18nStore?.t(`calendar.allDay`);let i={hour:`numeric`,minute:`2-digit`};return n.toDateString()===r.toDateString()?`${n.toLocaleTimeString(void 0,i)} - ${r.toLocaleTimeString(void 0,i)}`:`${n.toLocaleTimeString(void 0,i)} - ${this.i18nStore?.t(`calendar.monthsShort.${r.getMonth()}`)} ${r.getDate()} ${r.toLocaleTimeString(void 0,i)}`}handleEdit(e){e.stopPropagation();let t=this.closest(`alps-popup`);t&&t.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`edit-event`,{detail:{event:this.event},bubbles:!0,composed:!0}))},10)}handleDelete(e){e.stopPropagation();let t=this.closest(`alps-popup`);t&&t.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`delete-event`,{detail:{event:this.event},bubbles:!0,composed:!0}))},10)}render(){if(!this.event)return s``;let e=this.event;return s`
            <div class="header">
                <div class="title-container">
                    <div class="color-dot" style="background-color: ${e.color||`var(--accent-color, #2563eb)`}"></div>
                    <h3 class="title">${e.summary||this.i18nStore?.t(`calendar.noTitle`)}</h3>
                </div>
                <div style="display: flex; gap: 4px;">
                    <alps-icon-btn class="edit-btn" icon="pen" title=${this.i18nStore?.t(`calendar.editEvent`)} @click=${this.handleEdit}></alps-icon-btn>
                    <alps-icon-btn class="delete-btn" icon="trash" title=${this.i18nStore?.t(`calendar.deleteEvent`)} @click=${this.handleDelete} style="color: var(--error, #ef4444);"></alps-icon-btn>
                </div>
            </div>

            <div class="card">
                <div class="date-primary">${this.formatEventDate(e.start,e.end)}</div>
                <div class="date-secondary">${this.formatEventTimeRange(e.start,e.end)}</div>
            </div>

            ${e.location?s`
            <div class="card">
                <div class="card-label">${this.i18nStore?.t(`calendar.location`)}</div>
                <div class="description-text">${e.location}</div>
            </div>`:``}

            ${e.description?s`
            <div class="card">
                <div class="card-label">${this.i18nStore?.t(`calendar.notes`)}</div>
                <div class="description-text">${e.description}</div>
            </div>`:``}
        `}};E([g({context:S})],ut.prototype,`i18nStore`,void 0),E([o({type:Object})],ut.prototype,`event`,void 0),ut=E([m(`calendar-event-preview`)],ut);var dt=class extends d{constructor(...e){super(...e),this.days=[],this.events=[],this.scrolled=!1}static{this.styles=n`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            background-color: var(--bg-primary, #ffffff);
        }

        .time-grid-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .header-wrapper {
            position: sticky;
            top: 0;
            z-index: 10;
            background: var(--bg-primary, #ffffff);
            transition: box-shadow 0.2s ease;
        }

        .header-wrapper.scrolled {
            box-shadow: rgba(95, 95, 95, 0.1) 0 4px 4px -2px;
        }

        .time-grid-header {
            display: flex;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #ffffff);
        }

        .time-axis-spacer {
            width: 60px;
            flex-shrink: 0;
            box-sizing: border-box;
            border-right: 1px solid var(--border-color, #e5e7eb);
        }

        .time-grid-days {
            flex: 1;
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(0, 1fr);
        }

        .time-grid-day-header {
            padding: 8px;
            text-align: center;
            box-sizing: border-box;
            border-right: 1px solid var(--border-color, #e5e7eb);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        .time-grid-day-header:last-child { border-right: none; }

        .time-grid-day-name {
            font-size: 11px;
            font-weight: 500;
            color: var(--text-secondary, #4b5563);
            text-transform: uppercase;
        }
        .time-grid-day-number {
            font-size: 20px;
            font-weight: 400;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            color: var(--text-primary, #111827);
        }
        .time-grid-day-number.today {
            background-color: var(--error, #ef4444);
            color: #ffffff;
        }

        .all-day-row {
            display: flex;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            min-height: 24px;
            background: var(--bg-primary, #ffffff);
        }

        .all-day-label {
            width: 60px;
            flex-shrink: 0;
            font-size: 11px;
            color: var(--text-muted, #6b7280);
            padding: 4px 8px;
            box-sizing: border-box;
            text-align: right;
            border-right: 1px solid var(--border-color, #e5e7eb);
        }

        .all-day-content {
            flex: 1;
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(0, 1fr);
        }
        .all-day-cell {
            border-right: 1px solid var(--border-color, #e5e7eb);
            padding: 2px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .all-day-cell:last-child { border-right: none; }

        .time-grid-scroll {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            position: relative;
        }

        .time-grid-body {
            display: flex;
            position: relative;
            min-height: 1152px; /* 24 hours * 48px */
            padding-top: 12px;
            padding-bottom: 24px;
        }

        .time-axis {
            width: 60px;
            flex-shrink: 0;
            box-sizing: border-box;
            border-right: 1px solid var(--border-color, #e5e7eb);
            position: relative;
        }

        .time-label {
            position: absolute;
            right: 8px;
            font-size: 11px;
            color: var(--text-muted, #6b7280);
            transform: translateY(-50%);
        }

        .time-grid-columns {
            flex: 1;
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(0, 1fr);
            position: relative;
            background-image: linear-gradient(to bottom, var(--border-color, #e5e7eb) 1px, transparent 1px);
            background-size: 100% 48px; /* 48px per hour */
        }

        .time-column {
            border-right: 1px solid var(--border-color, #e5e7eb);
            position: relative;
        }
        .time-column:last-child { border-right: none; }

        alps-popup.time-event-popup {
            position: absolute;
            left: 2px;
            right: 2px;
            display: block;
            z-index: 5;
        }
        .time-event {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: rgba(37, 99, 235, 0.9);
            color: #ffffff;
            border-radius: 4px;
            padding: 4px 6px;
            font-size: 11px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            cursor: pointer;
            box-sizing: border-box;
        }
        .time-event:hover {
            background-color: var(--accent-color, #2563eb);
        }
        .time-event-title {
            font-weight: 500;
            margin-bottom: 2px;
        }

        .event-chip {
            background-color: #f59e0b;
            color: #ffffff;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            opacity: 0.9;
        }
        .event-chip:hover {
            opacity: 1;
        }
    `}getEventsForDate(e,t){return this.events?this.events.filter(n=>{let r=Ie(n.start,n.end);if(t!==r)return!1;let i=new Date(e);i.setHours(0,0,0,0);let a=new Date(e);if(a.setHours(23,59,59,999),r){let e=n.start.split(`T`)[0],t=n.end.split(`T`)[0],r=new Date(e+`T00:00:00`),a=new Date(t+`T00:00:00`);return r<=i&&a>i}else{let e=new Date(n.start),t=new Date(n.end);return t.getTime()===i.getTime()&&e.getTime()<t.getTime()?!1:e<=a&&t>=i}}):[]}handleColumnClick(e,t){let n=e.currentTarget.getBoundingClientRect(),r=e.clientY-n.top,i=Math.floor(r/48),a=new Date(t);a.setHours(i,0,0,0),this.dispatchEvent(new CustomEvent(`create-event`,{detail:{date:a},bubbles:!0,composed:!0}))}handleAllDayCellClick(e){let t=new Date(e);t.setHours(0,0,0,0),this.dispatchEvent(new CustomEvent(`create-event`,{detail:{date:t},bubbles:!0,composed:!0}))}handleScroll(e){let t=e.target;this.scrolled=t.scrollTop>0}render(){let e=Array.from({length:24},(e,t)=>t),t=new Date;return t.setHours(0,0,0,0),s`
            <div class="time-grid-container">
                <div class="time-grid-scroll" @scroll=${this.handleScroll}>
                    <div class="header-wrapper ${this.scrolled?`scrolled`:``}">
                        <div class="time-grid-header">
                            <div class="time-axis-spacer"></div>
                            <div class="time-grid-days">
                                ${this.days.map(e=>{let n=e.getTime()===t.getTime();return s`
                                        <div class="time-grid-day-header">
                                            <span class="time-grid-day-name">${this.i18nStore?.t(`calendar.daysShort.${e.getDay()}`)}</span>
                                            <span class="time-grid-day-number ${n?`today`:``}">${e.getDate()}</span>
                                        </div>
                                    `})}
                            </div>
                        </div>

                        <div class="all-day-row">
                            <div class="all-day-label">${this.i18nStore?.t(`calendar.allDay`)?.toLowerCase()}</div>
                            <div class="all-day-content">
                                ${this.days.map(e=>s`
                                        <div class="all-day-cell" @click=${()=>this.handleAllDayCellClick(e)} style="cursor: pointer;">
                                            ${this.getEventsForDate(e,!0).map(e=>s`
                                                <alps-popup align="left" position="bottom" style="width: 100%; display: block;" @click=${e=>e.stopPropagation()}>
                                                    <div slot="trigger"
                                                        class="event-chip" 
                                                        style=${e.color?`background-color: ${e.color}`:``}
                                                        title="${e.summary||this.i18nStore?.t(`calendar.noTitle`)}">
                                                        ${e.summary||this.i18nStore?.t(`calendar.noTitle`)}
                                                    </div>
                                                    <calendar-event-preview .event=${e}></calendar-event-preview>
                                                </alps-popup>
                                            `)}
                                        </div>
                                    `)}
                            </div>
                        </div>
                    </div>

                    <div class="time-grid-body">
                        <div class="time-axis">
                            ${e.map(e=>s`
                                <div class="time-label" style="top: ${e*48}px">${e.toString().padStart(2,`0`)}:00</div>
                            `)}
                        </div>
                        <div class="time-grid-columns">
                            ${this.days.map(e=>{let t=this.getEventsForDate(e,!1),n=new Date(e);n.setHours(0,0,0,0);let r=new Date(e);return r.setHours(23,59,59,999),s`
                                    <div class="time-column" @click=${t=>this.handleColumnClick(t,e)} style="cursor: pointer;">
                                        ${t.map(e=>{let t=new Date(e.start),i=new Date(e.end),a=t<n?n:t,o=i>r?r:i,c=a.getHours()*48+a.getMinutes()/60*48,l=(o.getTime()-a.getTime())/1e3/60/60*48;return l<20&&(l=20),c+l>1152&&(l=1152-c),s`
                                                <alps-popup 
                                                    class="time-event-popup"
                                                    align="left" position="bottom" 
                                                    style="top: ${c}px; height: ${l}px;"
                                                    @click=${e=>e.stopPropagation()}>
                                                    <div slot="trigger"
                                                        class="time-event" 
                                                        style="${e.color?`background-color: ${e.color}; border-color: ${e.color};`:``}" 
                                                        title="${e.summary||this.i18nStore?.t(`calendar.noTitle`)}">
                                                        <div class="time-event-title">${e.summary||this.i18nStore?.t(`calendar.noTitle`)}</div>
                                                    </div>
                                                    <calendar-event-preview .event=${e}></calendar-event-preview>
                                                </alps-popup>
                                            `})}
                                    </div>
                                `})}
                        </div>
                    </div>
                </div>
            </div>
        `}};E([g({context:S})],dt.prototype,`i18nStore`,void 0),E([o({type:Array})],dt.prototype,`days`,void 0),E([o({type:Array})],dt.prototype,`events`,void 0),E([a()],dt.prototype,`scrolled`,void 0),dt=E([m(`calendar-time-grid`)],dt);var ft=class extends d{constructor(...e){super(...e),this.events=[]}static{this.styles=n`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
        }
    `}render(){return s`
            <calendar-time-grid 
                .days=${[this.date]} 
                .events=${this.events}
            ></calendar-time-grid>
        `}};E([o({type:Object})],ft.prototype,`date`,void 0),E([o({type:Array})],ft.prototype,`events`,void 0),ft=E([m(`calendar-day-view`)],ft);var pt=class extends d{constructor(...e){super(...e),this.events=[]}static{this.styles=n`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
        }
    `}getWeekDays(){let e=[],t=new Date(this.date),n=t.getDay();n===0&&(n=7),t.setDate(t.getDate()-(n-1));for(let n=0;n<7;n++)e.push(new Date(t)),t.setDate(t.getDate()+1);return e}render(){return s`
            <calendar-time-grid 
                .days=${this.getWeekDays()} 
                .events=${this.events}
            ></calendar-time-grid>
        `}};E([o({type:Object})],pt.prototype,`date`,void 0),E([o({type:Array})],pt.prototype,`events`,void 0),pt=E([m(`calendar-week-view`)],pt);var mt=class extends d{constructor(...e){super(...e),this.events=[]}static{this.styles=n`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            background-color: var(--bg-primary, #ffffff);
        }

        .month-view {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .month-header {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #ffffff);
        }

        .month-header-cell {
            text-align: right;
            padding: 8px 12px;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary, #4b5563);
            border-right: 1px solid var(--border-color, #e5e7eb);
        }
        .month-header-cell:last-child { border-right: none; }

        .month-grid {
            flex: 1;
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-auto-rows: 1fr;
            background: var(--border-color, #e5e7eb);
            gap: 1px;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .month-cell {
            background-color: var(--bg-primary, #ffffff);
            padding: 4px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            overflow: hidden;
        }
        .month-cell.other-month {
            background-color: var(--bg-secondary, #f9fafb);
            opacity: 0.7;
        }

        .date-number {
            align-self: flex-end;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 4px;
            padding: 2px 6px;
            border-radius: 12px;
        }
        .date-number.today {
            background-color: var(--error, #ef4444);
            color: #ffffff;
        }

        .event-chip {
            background-color: var(--accent-color, #2563eb);
            color: #ffffff;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            opacity: 0.9;
        }
        .event-chip:hover {
            opacity: 1;
        }
        .event-chip.all-day {
            background-color: #f59e0b;
        }
    `}getMonthGrid(){let e=this.date.getFullYear(),t=this.date.getMonth(),n=new Date(e,t,1),r=new Date(e,t+1,0),i=[],a=new Date(n),o=a.getDay();for(o===0&&(o=7),a.setDate(a.getDate()-(o-1));a<=r||i.length%7!=0;)i.push(new Date(a)),a.setDate(a.getDate()+1);return i}getEventsForDate(e,t){return this.events?this.events.filter(n=>{let r=Ie(n.start,n.end);if(t!==r)return!1;let i=new Date(e);i.setHours(0,0,0,0);let a=new Date(e);if(a.setHours(23,59,59,999),r){let e=n.start.split(`T`)[0],t=n.end.split(`T`)[0],r=new Date(e+`T00:00:00`),a=new Date(t+`T00:00:00`);return r<=i&&a>i}else{let e=new Date(n.start),t=new Date(n.end);return t.getTime()===i.getTime()&&e.getTime()<t.getTime()?!1:e<=a&&t>=i}}):[]}handleCellClick(e){this.dispatchEvent(new CustomEvent(`create-event`,{detail:{date:e},bubbles:!0,composed:!0}))}render(){let e=this.getMonthGrid(),t=Array.from({length:7},(e,t)=>{let n=new Date(2021,10,t+1);return this.i18nStore?.t(`calendar.daysShort.${n.getDay()}`)}),n=new Date;return n.setHours(0,0,0,0),s`
            <div class="month-view">
                <div class="month-header">
                    ${t.map(e=>s`<div class="month-header-cell">${e}</div>`)}
                </div>
                <div class="month-grid">
                    ${e.map(e=>{let t=e.getMonth()!==this.date.getMonth(),r=e.getTime()===n.getTime(),i=this.getEventsForDate(e,!0).concat(this.getEventsForDate(e,!1));return s`
                            <div class="month-cell ${t?`other-month`:``}" @click=${()=>this.handleCellClick(e)} style="cursor: pointer;">
                                <div class="date-number ${r?`today`:``}">${e.getDate()}</div>
                                ${i.slice(0,4).map(e=>s`
                                    <alps-popup align="left" position="bottom" style="width: 100%; display: block;" @click=${e=>e.stopPropagation()}>
                                        <div slot="trigger"
                                            class="event-chip ${Ie(e.start,e.end)?`all-day`:``}" 
                                            style=${e.color?`background-color: ${e.color}`:``}
                                            title="${e.summary||this.i18nStore?.t(`calendar.noTitle`)}">
                                            ${e.summary||this.i18nStore?.t(`calendar.noTitle`)}
                                        </div>
                                        <calendar-event-preview .event=${e}></calendar-event-preview>
                                    </alps-popup>
                                `)}
                                ${i.length>4?s`<div style="font-size: 11px; color: var(--text-muted); padding-left: 4px;">${this.i18nStore?.t(`calendar.moreEvents`,{count:i.length-4})}</div>`:``}
                            </div>
                        `})}
                </div>
            </div>
        `}};E([g({context:S})],mt.prototype,`i18nStore`,void 0),E([o({type:Object})],mt.prototype,`date`,void 0),E([o({type:Array})],mt.prototype,`events`,void 0),mt=E([m(`calendar-month-view`)],mt);var ht=class extends d{constructor(...e){super(...e),this.events=[]}static{this.styles=n`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
            background-color: var(--bg-primary, #ffffff);
        }

        .year-view {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            grid-auto-rows: minmax(240px, 1fr);
            gap: 48px 36px;
            padding: 32px 64px;
            overflow-y: auto;
            height: 100%;
            width: 100%;
            box-sizing: border-box;

            /* Fluid typography for the mini-months inside the year view */
            --mini-month-font-size: clamp(12px, 1.2vw, 18px);
            --mini-month-title-size: clamp(16px, 1.5vw, 24px);
            --mini-month-day-size: clamp(11px, 1vw, 16px);
        }

        calendar-mini-month {
            padding: 12px;
            box-sizing: border-box;
        }

        @media (min-width: 600px) {
            .year-view { grid-template-columns: repeat(2, 1fr); }
        }

        @media (min-width: 900px) {
            .year-view { grid-template-columns: repeat(3, 1fr); }
        }

        @media (min-width: 1200px) {
            .year-view { grid-template-columns: repeat(4, 1fr); }
        }
    `}render(){return s`
            <div class="year-view">
                ${Array.from({length:12},(e,t)=>t).map(e=>s`
                    <calendar-mini-month 
                        .year=${this.year} 
                        .month=${e} 
                        .events=${this.events}
                        .showTitle=${!0}
                    ></calendar-mini-month>
                `)}
            </div>
        `}};E([o({type:Number})],ht.prototype,`year`,void 0),E([o({type:Array})],ht.prototype,`events`,void 0),ht=E([m(`calendar-year-view`)],ht);var gt=class extends d{constructor(...e){super(...e),this.events=[]}static{this.styles=n`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            overflow-y: auto;
            background-color: var(--bg-primary, #ffffff);
            padding: 16px;
            box-sizing: border-box;
        }

        .list-container {
            max-width: 800px;
            margin: 0 auto;
            width: 100%;
        }

        .no-results {
            text-align: center;
            color: var(--text-muted, #6b7280);
            padding: 40px;
            font-size: 16px;
        }

        .event-item {
            display: flex;
            padding: 16px;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            cursor: pointer;
            transition: background-color 0.15s;
            align-items: flex-start;
            gap: 16px;
        }

        .event-item:hover {
            background-color: var(--bg-tertiary, #f3f4f6);
        }

        .event-date {
            width: 100px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
        }

        .date-day {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .date-month {
            font-size: 14px;
            color: var(--text-secondary);
        }

        .date-time {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 4px;
        }

        .event-details {
            flex: 1;
            min-width: 0;
        }

        .event-title {
            font-size: 16px;
            font-weight: 500;
            color: var(--text-primary);
            margin: 0 0 4px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .color-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .event-location {
            font-size: 14px;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    `}render(){return this.events.length===0?s`
                <div class="list-container">
                    <div class="no-results">${this.i18nStore?.t(`calendar.noResults`)}</div>
                </div>
            `:s`
            <div class="list-container">
                ${[...this.events].sort((e,t)=>new Date(e.start).getTime()-new Date(t.start).getTime()).map(e=>{let t=new Date(e.start),n=e.start.length===10||e.end.length===10;return s`
                        <alps-popup align="left" position="bottom" style="width: 100%; display: block;" @click=${e=>e.stopPropagation()}>
                            <div slot="trigger" class="event-item">
                                <div class="event-date">
                                    <span class="date-day">${t.getDate()}</span>
                                    <span class="date-month">${this.i18nStore?.t(`calendar.monthsShort.${t.getMonth()}`)} ${t.getFullYear()}</span>
                                    <span class="date-time">
                                        ${n?this.i18nStore?.t(`calendar.allDay`):t.toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`})}
                                    </span>
                                </div>
                                <div class="event-details">
                                    <h3 class="event-title">
                                        <div class="color-dot" style="background-color: ${e.color||`#2563eb`}"></div>
                                        ${e.summary||this.i18nStore?.t(`calendar.noTitle`)}
                                    </h3>
                                    ${e.location?s`
                                        <div class="event-location">
                                            📍 ${e.location}
                                        </div>
                                    `:``}
                                </div>
                            </div>
                            <calendar-event-preview .event=${e}></calendar-event-preview>
                        </alps-popup>
                    `})}
            </div>
        `}};E([g({context:S})],gt.prototype,`i18nStore`,void 0),E([o({type:Array})],gt.prototype,`events`,void 0),gt=E([m(`calendar-list-view`)],gt);var _t=class extends d{constructor(...e){super(...e),this.selectedDate=new Date,this.events=[],this.viewDate=new Date}static{this.styles=n`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
        }

        .mini-calendar-wrapper {
            margin-top: auto;
            min-height: 220px;
            display: flex;
            flex-direction: column;
        }

        .mini-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-weight: 500;
            font-size: 14px;
        }

        alps-icon-btn {
            --btn-padding: 4px;
        }
    `}updated(e){e.has(`selectedDate`)&&this.selectedDate&&(this.viewDate=new Date(this.selectedDate))}changeMonth(e){let t=new Date(this.viewDate);t.setMonth(t.getMonth()+e),this.viewDate=t}render(){let e=this.viewDate.getFullYear(),t=this.viewDate.getMonth();return s`
            <div class="mini-calendar-wrapper">
                <div class="mini-header">
                    <alps-icon-btn icon="caretLeft" @click=${()=>this.changeMonth(-1)}></alps-icon-btn>
                    <span>${this.i18nStore?.t(`calendar.months.${t}`)} ${e}</span>
                    <alps-icon-btn icon="caretRight" @click=${()=>this.changeMonth(1)}></alps-icon-btn>
                </div>
                <calendar-mini-month
                    .year=${e}
                    .month=${t}
                    .events=${this.events}
                    .currentDate=${this.selectedDate}
                    @date-selected=${e=>{this.dispatchEvent(new CustomEvent(`date-selected`,{detail:e.detail,bubbles:!0,composed:!0}))}}
                ></calendar-mini-month>
            </div>
        `}};E([g({context:S})],_t.prototype,`i18nStore`,void 0),E([o({type:Object})],_t.prototype,`selectedDate`,void 0),E([o({type:Array})],_t.prototype,`events`,void 0),E([a()],_t.prototype,`viewDate`,void 0),_t=E([m(`alps-sidebar-calendar`)],_t);var vt=class extends d{constructor(...e){super(...e),this.label=`Today`}static{this.styles=n`
        :host {
            display: inline-flex;
        }

        .nav-buttons {
            display: flex;
            align-items: center;
        }

        .nav-buttons button {
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            padding: 6px 12px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary, #111827);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 30px;
            box-sizing: border-box;
            transition: background-color 0.2s;
        }

        .nav-buttons button svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        .nav-buttons button:first-child {
            border-radius: 6px 0 0 6px;
        }
        
        .nav-buttons button:last-child {
            border-radius: 0 6px 6px 0;
            border-left: none;
        }
        
        .nav-buttons button:nth-child(2) {
            border-left: none;
            padding-left: 16px;
            padding-right: 16px;
        }

        @media (hover: hover) {
            .nav-buttons button:hover {
                background-color: var(--bg-secondary, #f3f4f6);
            }
        }
    `}handlePrevious(){this.dispatchEvent(new CustomEvent(`previous`,{bubbles:!0,composed:!0}))}handleNext(){this.dispatchEvent(new CustomEvent(`next`,{bubbles:!0,composed:!0}))}handleCenter(){this.dispatchEvent(new CustomEvent(`center`,{bubbles:!0,composed:!0}))}render(){return s`
            <div class="nav-buttons">
                <button @click=${this.handlePrevious} aria-label="Previous">
                    ${T(`caretLeft`)}
                </button>
                <button @click=${this.handleCenter}>
                    ${this.label}
                </button>
                <button @click=${this.handleNext} aria-label="Next">
                    ${T(`caretRight`)}
                </button>
            </div>
        `}};E([o({type:String})],vt.prototype,`label`,void 0),vt=E([m(`alps-nav-buttons`)],vt);var yt=class extends d{constructor(...e){super(...e),this.title=`Prompt`,this.fields=[],this.confirmText=`Apply`,this.cancelText=`Cancel`,this.values={}}static{this.styles=[it,n`
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
    `]}willUpdate(e){if(e.has(`fields`)){let e={};for(let t of this.fields)e[t.id]=t.value||``;this.values=e}}firstUpdated(){setTimeout(()=>{let e=this.shadowRoot?.querySelector(`alps-input[autofocus]`);if(e&&typeof e.focus==`function`)e.focus();else{let e=this.shadowRoot?.querySelector(`alps-input`);e&&typeof e.focus==`function`&&e.focus()}},50)}_handleInput(e,t){let n=e.target;this.values={...this.values,[t]:n.value}}_handleKeyDown(e){e.key===`Enter`&&(e.preventDefault(),this._handleSubmit())}_handleCancel(){this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}_handleSubmit(){this.dispatchEvent(new CustomEvent(`submit`,{detail:this.values,bubbles:!0,composed:!0}))}render(){return s`
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
    `}};E([o({type:String})],yt.prototype,`title`,void 0),E([o({type:Array})],yt.prototype,`fields`,void 0),E([o({type:String})],yt.prototype,`confirmText`,void 0),E([o({type:String})],yt.prototype,`cancelText`,void 0),E([a()],yt.prototype,`values`,void 0),yt=E([m(`ui-prompt`)],yt);var bt=class extends d{constructor(...e){super(...e),this.title=`Confirm`,this.message=`Are you sure?`,this.confirmText=`Confirm`,this.cancelText=`Cancel`,this.isDanger=!1,this.dismissible=!1}static{this.styles=[it]}_handleCancel(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}_handleSecondary(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`secondary`,{bubbles:!0,composed:!0}))}_handleConfirm(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`confirm`,{bubbles:!0,composed:!0}))}render(){return s`
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
    `}};E([o({type:String})],bt.prototype,`title`,void 0),E([o({type:String})],bt.prototype,`message`,void 0),E([o({type:String})],bt.prototype,`confirmText`,void 0),E([o({type:String})],bt.prototype,`cancelText`,void 0),E([o({type:String})],bt.prototype,`secondaryText`,void 0),E([o({type:Boolean})],bt.prototype,`isDanger`,void 0),E([o({type:Boolean})],bt.prototype,`dismissible`,void 0),bt=E([m(`ui-confirm`)],bt);var xt=250,St=150,Ct=500,wt=120,A=class extends d{constructor(...e){super(...e),this.calendars=[],this.events=[],this.currentDate=new Date,this.viewMode=`month`,this.loading=!0,this.isSpinning=!1,this.error=``,this.modalOpen=!1,this.activeCalendars=new Set,this.searchQuery=``,this.sidebarWidth=250,this.sidebarCollapsed=!1,this.isSidebarHovered=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.promptOpen=!1,this.promptFields=[{id:`name`,label:`Calendar Name`,autofocus:!0}],this.syncIntervalTimer=null,this.promptMode=null,this.promptTarget=null,this.calendarToDelete=null,this.eventToDelete=null,this.activeKebabMenu=null,this.hoverTimeout=null,this.suppressSidebarHover=!1,this.isSidebarDragging=!1,this._handleSettingsChange=()=>{if(this.settingsStore){let e=this.settingsStore.getState();if(this.sidebarCollapsed=e.sidebarCollapsed,this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null),e.checkMailInterval&&e.checkMailInterval>0){let t=e.checkMailInterval*60*1e3;this.syncIntervalTimer=setInterval(()=>{this.fetchData()},t)}}},this.handleHashChange=()=>{this.parseHash()&&this.fetchData()},this.handleResize=()=>{this.isMobile=window.innerWidth<=768},this.handleSpinIteration=()=>{this.loading||(this.isSpinning=!1)}}static{this.styles=[$e,ct,n`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
        }

        .app-container.collapsed .main-content {
            box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
            z-index: 25;
            border-left: 1px solid var(--border-color, #e5e7eb);
            position: relative;
        }

        .layout {
            display: flex;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: var(--bg-primary, #ffffff);
        }

        .sidebar-content {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .sidebar-scroll-content {
            padding: 16px;
            display: flex;
            flex-direction: column;
            height: 100%;
            box-sizing: border-box;
            gap: 24px;
        }

        .calendars-list {
            flex: 1;
            overflow-y: auto;
        }

        .calendars-list h3 {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted, #6b7280);
            margin: 0 0 12px 0;
        }

        .calendar-item {
            display: flex;
            align-items: center;
            position: relative;
            height: 36px;
            padding: 0 8px;
            box-sizing: border-box;
            border-radius: 6px;
            cursor: pointer;
            color: var(--text-primary);
            margin-bottom: 2px;
            user-select: none;
            transition: background 0.15s;
        }

        .calendar-item:hover {
            background-color: var(--bg-tertiary, #f3f4f6);
        }

        .calendar-item span {
            font-size: 14px;
            color: var(--text-primary, #111827);
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .calendar-checkbox {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            border: 2px solid var(--cal-color);
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            background-color: transparent;
            margin-right: 8px;
            flex-shrink: 0;
        }

        .calendar-checkbox.checked {
            background-color: var(--cal-color);
        }

        .calendar-checkbox svg {
            width: 12px;
            height: 12px;
            color: #fff;
            fill: currentColor;
        }

        .sidebar-footer-btn {
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px;
            border-radius: 6px;
            width: 100%;
        }

        .sidebar-footer-btn:hover {
            background-color: var(--border-color, #e5e7eb);
        }

        .sidebar-footer-btn svg {
            width: 18px;
            height: 18px;
            color: var(--text-secondary, #4b5563);
        }

        .calendar-actions {
            display: none;
            align-items: center;
            margin-left: auto;
            margin-right: -4px;
        }

        @media (hover: hover) {
            .calendar-item:hover .calendar-actions {
                display: flex;
            }
        }
        .calendar-actions:focus-within,
        .calendar-actions.popup-open {
            display: flex;
        }
        
        .kebab-btn {
            --btn-padding: 8px;
        }

        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background-color: var(--bg-primary, #ffffff);
            justify-content: center;
        }

        .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 57px;
            padding: 0 24px;
            box-sizing: border-box;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            flex-shrink: 0;
            background: var(--bg-primary, #ffffff);
        }

        .toolbar-left {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .toolbar-left h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }

        .toolbar-left .sub-title {
            font-weight: 300;
            color: var(--text-secondary, #4b5563);
        }

        .toolbar-center {
            flex: 1;
            display: flex;
            justify-content: center;
        }

        .toolbar-right {
            flex: 1;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 8px;
        }

        .mobile-bottom-header {
            height: 57px;
            box-sizing: border-box;
            padding: 0 12px;
            border-top: 1px solid var(--border-color, #e5e7eb);
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-primary, #ffffff);
            flex-shrink: 0;
            position: relative;
            z-index: 10;
            box-shadow: rgba(95, 95, 95, 0.1) 0 -4px 4px -2px;
        }

        .mobile-bottom-actions {
            display: flex;
            width: 100%;
        }

        @media (max-width: 768px) {
            .toolbar {
                padding: 0 12px;
            }
            .toolbar-left {
                flex: 1;
                min-width: 0;
            }
            .toolbar-left h2 {
                font-size: 18px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .toolbar-left h2 .sub-title {
                display: none;
            }
            .toolbar-right {
                flex: unset;
                gap: 4px;
            }
        }

        .calendar-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }
    `]}async connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this.handleResize),window.addEventListener(`hashchange`,this.handleHashChange),this.settingsStore&&(this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._handleSettingsChange()),this.parseHash(),await this.fetchData()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this.handleResize),window.removeEventListener(`hashchange`,this.handleHashChange),this.settingsStore&&this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null)}parseHash(){let e=window.location.hash;if(!e.startsWith(`#/calendar`))return!1;let[t,n]=e.substring(1).split(`?`),r=t.split(`/`),i=!1;if(r.length>=3){let e=r[2];[`day`,`week`,`month`,`year`].includes(e)&&this.viewMode!==e&&(this.viewMode=e,i=!0)}if(r.length>=4){let e=r[3],t=new Date(this.currentDate);if(this.viewMode===`year`){let n=parseInt(e,10);isNaN(n)||t.setFullYear(n)}else if(this.viewMode===`month`){let[n,r]=e.split(`-`);n&&r&&(t.setFullYear(parseInt(n,10)),t.setMonth(parseInt(r,10)-1),t.setDate(1))}else{let[n,r,i]=e.split(`-`);n&&r&&i&&(t.setFullYear(parseInt(n,10)),t.setMonth(parseInt(r,10)-1),t.setDate(parseInt(i,10)))}(t.getFullYear()!==this.currentDate.getFullYear()||t.getMonth()!==this.currentDate.getMonth()||t.getDate()!==this.currentDate.getDate())&&(this.currentDate=t,i=!0)}let a=``;return n&&(a=new URLSearchParams(`?`+n).get(`q`)||``),this.searchQuery!==a&&(this.searchQuery=a,i=!0),t===`/calendar`||t===`/calendar/`?(this.navigate(this.viewMode,this.currentDate,this.searchQuery),!1):i}navigate(e,t,n=``){let r=t.getFullYear(),i=String(t.getMonth()+1).padStart(2,`0`),a=String(t.getDate()).padStart(2,`0`),o=`#/calendar/${e}`;e===`year`?o+=`/${r}`:e===`month`?o+=`/${r}-${i}`:o+=`/${r}-${i}-${a}`,n&&(o+=`?q=${encodeURIComponent(n)}`),window.location.hash===o?this.fetchData():window.location.hash=o}handleSidebarMouseEnter(){this.sidebarCollapsed&&!this.isSidebarDragging&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=setTimeout(()=>{this.isSidebarHovered=!0,this.suppressSidebarHover=!1},300))}handleSidebarMouseLeave(){this.sidebarCollapsed&&(clearTimeout(this.hoverTimeout),this.isSidebarHovered=!1)}async fetchData(){this.loading=!0,this.isSpinning=!0,this.error=``;try{let e=await Le.fetchCalendars(),t,n,r=this.currentDate.getFullYear(),i=this.currentDate.getMonth();this.viewMode===`year`?(t=new Date(r,0,1),n=new Date(r,11,31)):this.viewMode===`month`?(t=new Date(r,i,1),n=new Date(r,i+1,0),t.setDate(t.getDate()-14),n.setDate(n.getDate()+14)):this.viewMode===`week`?(t=new Date(this.currentDate),t.setDate(t.getDate()-t.getDay()+1),n=new Date(t),n.setDate(t.getDate()+7)):(t=new Date(this.currentDate),t.setHours(0,0,0,0),n=new Date(this.currentDate),n.setHours(23,59,59,999));let a=(await Le.fetchEvents(t,n,this.searchQuery)).events||[],o=[];for(let e of a)if(e.rrule)try{let r=new Date(e.start),i=new Date(e.end).getTime()-r.getTime(),a=te.parseString(e.rrule);a.dtstart=r;let s=new te(a).between(t,n,!0);for(let t of s)o.push({...e,start:t.toISOString(),end:new Date(t.getTime()+i).toISOString()})}catch(t){console.error(`Failed to parse rrule for event`,e.uid,t),o.push(e)}else o.push(e);this.events=o.map(e=>({...e,color:e.color||Fe(e.calendarPath||e.path)})),this.calendars=e.calendars.map(e=>({...e,color:e.color||Fe(e.path)})),this.activeCalendars.size===0&&this.calendars.length>0&&(this.activeCalendars=new Set(this.calendars.map(e=>e.path)))}catch(e){console.error(e),this.error=`Failed to load calendar data.`}finally{this.loading=!1}}changeDate(e,t){let n=new Date(this.currentDate),r=t||this.viewMode;r===`year`?n.setFullYear(n.getFullYear()+e):r===`month`?n.setMonth(n.getMonth()+e):r===`week`?n.setDate(n.getDate()+e*7):n.setDate(n.getDate()+e),this.navigate(r,n)}openCreateModal(e){this.selectedEvent=void 0,this.initialDate=e,this.modalOpen=!0}openEditModal(e){this.selectedEvent=e,this.initialDate=void 0,this.modalOpen=!0}handleModalClose(){this.modalOpen=!1,this.selectedEvent=void 0,this.initialDate=void 0}async handleModalSaved(){this.modalOpen=!1,this.selectedEvent=void 0,this.initialDate=void 0,await this.fetchData()}setViewMode(e){this.navigate(e,this.currentDate)}handleDateSelected(e){this.navigate(`day`,e)}handleAddCalendar(){this.promptFields=[{id:`name`,label:this.i18nStore?.t(`calendar.calendarName`),autofocus:!0}],this.promptMode=`add`,this.promptOpen=!0}handleRenameCalendar(e){this.promptFields=[{id:`name`,label:this.i18nStore?.t(`calendar.calendarName`),value:e.name,autofocus:!0}],this.promptMode=`rename`,this.promptTarget=e,this.promptOpen=!0}handleDeleteCalendar(e){this.calendarToDelete=e}async _executeDeleteCalendar(){if(!this.calendarToDelete)return;let e=this.calendarToDelete;this.calendarToDelete=null;try{await Le.deleteCalendar(e.path),this.calendars=this.calendars.filter(t=>t.path!==e.path),this.activeCalendars.has(e.path)&&(this.activeCalendars.delete(e.path),await this.fetchData())}catch(e){console.error(`Failed to delete calendar`,e)}}async _executeDeleteEvent(){if(!this.eventToDelete)return;let e=this.eventToDelete;this.eventToDelete=null;try{await Le.deleteEvent(e.path),await this.fetchData()}catch(e){console.error(`Failed to delete event`,e)}}toggleCalendar(e){let t=new Set(this.activeCalendars);t.has(e)?t.delete(e):t.add(e),this.activeCalendars=t}async handlePromptSubmit(e){this.promptOpen=!1;let t=e.detail.name;if(t)try{this.promptMode===`add`?await Le.createCalendar(t):this.promptMode===`rename`&&this.promptTarget&&await Le.renameCalendar(this.promptTarget.path,t),await this.fetchData()}catch(e){console.error(`Failed to save calendar`,e)}}handlePromptCancel(){this.promptOpen=!1}get username(){return this.settingsStore?.getState().loginUsername||``}render(){let e=this.i18nStore?.t(`calendar.months.${this.currentDate.getMonth()}`),t=this.currentDate.getFullYear(),n=``;n=this.searchQuery?this.i18nStore?.t(`calendar.searchResults`):this.viewMode===`year`?t.toString():this.viewMode===`day`?`${this.currentDate.getDate()} ${e}`:e;let r=this.events.filter(e=>this.activeCalendars.has(e.calendarPath));return s`
            <app-header 
                currentTab="calendar"
                .username=${this.username}
                .isMobile=${this.isMobile}
                .searchQuery=${this.searchQuery}
                @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
                @search-submit=${e=>{this.navigate(this.viewMode,this.currentDate,e.detail.value)}}
            ></app-header>
            <div class="app-container ${this.sidebarCollapsed&&!this.isMobile?`collapsed`:``} ${this.isSidebarDragging?`dragging`:``}" style="${!this.sidebarCollapsed&&!this.isMobile?`--sidebar-width: ${this.sidebarWidth}px;`:``}">
                <div class="layout">
                    <alps-sidebar 
                        class="${this.isMobile?`mobile-sidebar`:`desktop-sidebar`} ${this.mobileSidebarOpen?`open`:``}"
                        .isMobile=${this.isMobile}
                        .isOpen=${this.mobileSidebarOpen}
                        .collapsed=${this.sidebarCollapsed&&!this.isMobile}
                        .isHovered=${this.isSidebarHovered}
                        .suppressHover=${this.suppressSidebarHover}
                        .width=${this.sidebarWidth}
                        @toggle-collapse=${()=>{let e=!this.sidebarCollapsed;this.sidebarCollapsed=e,this.settingsStore&&this.settingsStore.updateSettings({sidebarCollapsed:e})}}
                        @sidebar-resize=${e=>{let t=e.detail.newWidth;t<wt?(this.sidebarCollapsed||(this.sidebarCollapsed=!0,this.settingsStore&&this.settingsStore.updateSettings({sidebarCollapsed:!0})),this.sidebarWidth=xt):(this.sidebarCollapsed&&(this.sidebarCollapsed=!1,this.settingsStore&&this.settingsStore.updateSettings({sidebarCollapsed:!1})),this.sidebarWidth=Math.min(Math.max(t,St),Ct))}}
                        @drag-start=${()=>this.isSidebarDragging=!0}
                        @drag-end=${()=>this.isSidebarDragging=!1}
                        @close-sidebar=${()=>this.mobileSidebarOpen=!1}
                        @mouseenter=${()=>this.handleSidebarMouseEnter()}
                        @mouseleave=${()=>this.handleSidebarMouseLeave()}
                    >
                    <div class="sidebar-wrapper ${this.sidebarCollapsed&&(!this.isSidebarHovered||this.suppressSidebarHover)&&!this.isMobile?`collapsed`:``}">
                        <alps-toolbar class="sidebar-header">
                            <alps-create-button 
                                icon="calendarPlus" 
                                ?collapsed=${this.sidebarCollapsed&&(!this.isSidebarHovered||this.suppressSidebarHover)&&!this.isMobile}
                                @click=${()=>this.openCreateModal()}
                            >${this.i18nStore?.t(`calendar.addEvent`)}</alps-create-button>
                        </alps-toolbar>
                        <div class="sidebar-content">
                            <div class="sidebar-scroll-content">
                                <div class="calendars-list">
                                    <h3>${this.i18nStore?.t(`calendar.myCalendars`)}</h3>
                                    ${this.calendars.map(e=>s`
                                        <div class="calendar-item" @click=${()=>this.toggleCalendar(e.path)}>
                                            <div class="calendar-checkbox ${this.activeCalendars.has(e.path)?`checked`:``}" style="--cal-color: ${e.color}">
                                                ${this.activeCalendars.has(e.path)?T(`check`):``}
                                            </div>
                                            <span>${e.name}</span>

                                            <div class="calendar-actions ${this.activeKebabMenu===e.path?`popup-open`:``}" @click=${e=>e.stopPropagation()}>
                                                <alps-popup 
                                                    align="right" 
                                                    position="bottom"
                                                    @popup-open=${()=>{this.activeKebabMenu=e.path}}
                                                    @popup-close=${()=>{this.activeKebabMenu===e.path&&(this.activeKebabMenu=null)}}
                                                >
                                                    <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical"></alps-icon-btn>
                                                    <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.handleRenameCalendar(e)}}>
                                                        ${T(`pen`)} <span class="item-text">${this.i18nStore?.t(`calendar.rename`)}</span>
                                                    </button>
                                                    ${this.calendars.length>1&&!(e.path===`default`||e.path.endsWith(`/default`)||e.path.endsWith(`/default/`))?s`
                                                        <button class="dropdown-item text-danger" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.handleDeleteCalendar(e)}}>
                                                            ${T(`trash`)} <span class="item-text">${this.i18nStore?.t(`calendar.delete`)}</span>
                                                        </button>
                                                    `:``}
                                                </alps-popup>
                                            </div>
                                        </div>
                                    `)}
                                </div>

                                <alps-sidebar-calendar
                                    .selectedDate=${this.currentDate}
                                    .events=${r}
                                    @date-selected=${e=>this.handleDateSelected(e.detail.date)}
                                ></alps-sidebar-calendar>
                            </div>
                        </div>
                    </div>
                    <alps-icon-btn slot="footer-actions" icon="calendarPlus" @click=${this.handleAddCalendar}></alps-icon-btn>
                </alps-sidebar>

                <div class="main-content">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <h2>${n} <span class="sub-title">${this.viewMode===`year`?``:t}</span></h2>
                        </div>
                        ${this.isMobile?``:s`
                        <div class="toolbar-center">
                            <alps-toggle 
                                .options=${[{label:this.i18nStore?.t(`calendar.day`),value:`day`},{label:this.i18nStore?.t(`calendar.week`),value:`week`},{label:this.i18nStore?.t(`calendar.month`),value:`month`},{label:this.i18nStore?.t(`calendar.year`),value:`year`}]}
                                .value=${this.viewMode}
                                @change=${e=>this.setViewMode(e.detail.value)}
                            ></alps-toggle>
                        </div>
                        `}
                        <div class="toolbar-right" style="display: flex; align-items: center; gap: 8px;">
                            <alps-icon-btn 
                                icon="arrowsClockwise" 
                                title="${this.i18nStore?.t(`mailboxPage.refresh`)}" 
                                ?spinning=${this.isSpinning}
                                @animationiteration=${this.handleSpinIteration}
                                @click=${this.fetchData}
                            ></alps-icon-btn>
                            <alps-nav-buttons 
                                label="${this.i18nStore?.t(`calendar.today`)}"
                                @previous=${()=>this.changeDate(-1)}
                                @center=${()=>{this.navigate(this.viewMode,new Date)}}
                                @next=${()=>this.changeDate(1)}
                            ></alps-nav-buttons>
                        </div>
                    </div>

                    <div class="calendar-body">
                        ${this.searchQuery?s`
                            <calendar-list-view
                                .events=${r}
                                @edit-event=${e=>this.openEditModal(e.detail.event)}
                                @delete-event=${e=>this.eventToDelete=e.detail.event}
                            ></calendar-list-view>
                        `:s`
                            ${this.viewMode===`year`?s`
                                <calendar-year-view 
                                .year=${t} 
                                .events=${r}
                                @date-selected=${e=>this.handleDateSelected(e.detail.date)}
                            ></calendar-year-view>
                        `:``}
                        ${this.viewMode===`month`?s`
                            <calendar-month-view 
                                .date=${this.currentDate} 
                                .events=${r}
                                @create-event=${e=>this.openCreateModal(e.detail.date)}
                                @edit-event=${e=>this.openEditModal(e.detail.event)}
                                @delete-event=${e=>this.eventToDelete=e.detail.event}
                            ></calendar-month-view>
                        `:``}
                        ${this.viewMode===`week`?s`
                            <calendar-week-view 
                                .date=${this.currentDate} 
                                .events=${r}
                                @create-event=${e=>this.openCreateModal(e.detail.date)}
                                @edit-event=${e=>this.openEditModal(e.detail.event)}
                                @delete-event=${e=>this.eventToDelete=e.detail.event}
                            ></calendar-week-view>
                        `:``}
                            ${this.viewMode===`day`?s`
                                <calendar-day-view 
                                    .date=${this.currentDate} 
                                    .events=${r}
                                    @create-event=${e=>this.openCreateModal(e.detail.date)}
                                    @edit-event=${e=>this.openEditModal(e.detail.event)}
                                    @delete-event=${e=>this.eventToDelete=e.detail.event}
                                ></calendar-day-view>
                            `:``}
                        `}
                    </div>
                    ${this.isMobile?s`
                        <div class="mobile-bottom-header">
                            <div class="mobile-bottom-actions">
                                <alps-toggle 
                                    full-width
                                    .options=${[{label:this.i18nStore?.t(`calendar.day`),value:`day`},{label:this.i18nStore?.t(`calendar.week`),value:`week`},{label:this.i18nStore?.t(`calendar.month`),value:`month`},{label:this.i18nStore?.t(`calendar.year`),value:`year`}]}
                                    .value=${this.viewMode}
                                    @change=${e=>this.setViewMode(e.detail.value)}
                                ></alps-toggle>
                            </div>
                        </div>
                    `:``}
                </div>
            </div>

            <calendar-event-modal
                .open=${this.modalOpen}
                .event=${this.selectedEvent}
                .initialDate=${this.initialDate}
                .calendars=${this.calendars}
                @close=${this.handleModalClose}
                @saved=${this.handleModalSaved}
            ></calendar-event-modal>

            ${this.promptOpen?s`
                <ui-prompt 
                    title="${this.promptMode===`add`?this.i18nStore?.t(`calendar.addCalendar`):this.i18nStore?.t(`calendar.renameCalendar`)}" 
                    .fields=${this.promptFields}
                    @submit=${this.handlePromptSubmit} 
                    @cancel=${this.handlePromptCancel}
                ></ui-prompt>
            `:``}

            ${this.calendarToDelete?s`
                <ui-confirm
                    title="${this.i18nStore?.t(`calendar.deleteCalendar`)}"
                    message="Are you sure you want to delete the calendar &quot;${this.calendarToDelete.name}&quot;?"
                    confirmText="${this.i18nStore?.t(`calendar.delete`)}"
                    isDanger
                    @confirm=${this._executeDeleteCalendar}
                    @cancel=${()=>this.calendarToDelete=null}
                ></ui-confirm>
            `:``}

            ${this.eventToDelete?s`
                <ui-confirm
                    title="${this.i18nStore?.t(`calendar.deleteEvent`)}"
                    message="Are you sure you want to delete this event?"
                    confirmText="${this.i18nStore?.t(`calendar.delete`)}"
                    isDanger
                    @confirm=${this._executeDeleteEvent}
                    @cancel=${()=>this.eventToDelete=null}
                ></ui-confirm>
            `:``}
        `}};E([g({context:S})],A.prototype,`i18nStore`,void 0),E([g({context:C})],A.prototype,`settingsStore`,void 0),E([a()],A.prototype,`calendars`,void 0),E([a()],A.prototype,`events`,void 0),E([a()],A.prototype,`currentDate`,void 0),E([a()],A.prototype,`viewMode`,void 0),E([a()],A.prototype,`loading`,void 0),E([a()],A.prototype,`isSpinning`,void 0),E([a()],A.prototype,`error`,void 0),E([a()],A.prototype,`modalOpen`,void 0),E([a()],A.prototype,`selectedEvent`,void 0),E([a()],A.prototype,`initialDate`,void 0),E([a()],A.prototype,`activeCalendars`,void 0),E([a()],A.prototype,`searchQuery`,void 0),E([a()],A.prototype,`sidebarWidth`,void 0),E([a()],A.prototype,`sidebarCollapsed`,void 0),E([a()],A.prototype,`isSidebarHovered`,void 0),E([a()],A.prototype,`isMobile`,void 0),E([a()],A.prototype,`mobileSidebarOpen`,void 0),E([a()],A.prototype,`promptOpen`,void 0),E([a()],A.prototype,`promptFields`,void 0),E([a()],A.prototype,`promptMode`,void 0),E([a()],A.prototype,`promptTarget`,void 0),E([a()],A.prototype,`calendarToDelete`,void 0),E([a()],A.prototype,`eventToDelete`,void 0),E([a()],A.prototype,`activeKebabMenu`,void 0),E([a()],A.prototype,`suppressSidebarHover`,void 0),E([a()],A.prototype,`isSidebarDragging`,void 0),A=E([m(`calendar-page`)],A);var Tt=e({});y.registerRoute({path:`/calendar/*`,component:`calendar-page`}),y.registerNavTab({id:`calendar`,pluginId:`caldav`,labelKey:`navigation.calendar`,icon:`calendar`,order:20});async function j(e,t={},n=25e3){let r=new AbortController,i=setTimeout(()=>r.abort(),n);try{let n=await fetch(e,{...t,signal:r.signal});return(n.status===502||n.status===503||n.status===504)&&window.dispatchEvent(new CustomEvent(`network-error`)),n}catch(e){throw(e instanceof TypeError||e.name===`AbortError`)&&window.dispatchEvent(new CustomEvent(`network-error`)),e}finally{clearTimeout(i)}}var M=new class{async fetchContacts(e=``){let t=await j(e?`/contacts?query=${encodeURIComponent(e)}`:`/contacts`);if(!t.ok)throw Error(`Failed to fetch contacts: ${t.statusText}`);return t.json()}async fetchContact(e){let t=await j(`/contacts/${encodeURIComponent(e)}`);if(!t.ok)throw Error(`Failed to fetch contact: ${t.statusText}`);return t.json()}async createContact(e){let t=await j(`/contacts/create`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(!t.ok)throw Error(`Failed to create contact: ${t.statusText}`);return t.json()}async updateContact(e,t){let n=await j(`/contacts/${encodeURIComponent(e)}/edit`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!n.ok)throw Error(`Failed to update contact: ${n.statusText}`);return n.json()}async deleteContact(e){let t=await j(`/contacts/${encodeURIComponent(e)}`,{method:`DELETE`});if(!t.ok)throw Error(`Failed to delete contact: ${t.statusText}`)}async bulkUpdateContacts(e){let t=e.map(e=>e.path?this.updateContact(e.path,e):Promise.resolve());await Promise.all(t)}async bulkDeleteContacts(e){let t=e.map(e=>this.deleteContact(e));await Promise.all(t)}},Et=`All Contacts`,Dt=`Favorites`,Ot=`alps_msg_`,kt=1800*1e3,At={get(e,t,n=`html`){try{let r=`${Ot}${e}_${t}_${n}`,i=sessionStorage.getItem(r);if(!i)return null;let a=JSON.parse(i);return Date.now()-a.timestamp>kt?(sessionStorage.removeItem(r),null):a}catch(e){return b.error(`Failed to read message cache`,e),null}},set(e,t,n,r){try{let i=`${Ot}${e}_${t}_${n}`,a={...r,timestamp:Date.now()},o=JSON.stringify(a);if(o.length>2*1024*1024){console.warn(`Message ${t} is too large to cache (${Math.round(o.length/1024)}KB)`);return}sessionStorage.setItem(i,o)}catch(i){if(i instanceof DOMException&&(i.name===`QuotaExceededError`||i.code===22)){console.warn(`Session storage quota exceeded, clearing cache and retrying...`),this.clear();try{let i=`${Ot}${e}_${t}_${n}`,a={...r,timestamp:Date.now()};sessionStorage.setItem(i,JSON.stringify(a))}catch(e){b.error(`Failed to write message cache even after clearing`,e)}}else b.error(`Failed to write message cache`,i)}},clear(){try{let e=[];for(let t=0;t<sessionStorage.length;t++){let n=sessionStorage.key(t);n&&n.startsWith(Ot)&&e.push(n)}e.forEach(e=>sessionStorage.removeItem(e))}catch(e){b.error(`Failed to clear message cache`,e)}}},N=new class extends EventTarget{constructor(...e){super(...e),this.interval=null,this.currentMailbox=w,this.currentPage=0,this.currentQuery=``,this.currentFetchId=0}setContext(e,t,n=``){this.currentMailbox=e,this.currentPage=t,this.currentQuery=n}start(e=5){if(this.stop(),e<=0)return;let t=e*60*1e3;this.interval=setInterval(()=>this.backgroundSync(),t)}stop(){this.interval&&=(clearInterval(this.interval),null)}sync(){this.fetch(this.currentMailbox,this.currentPage,this.currentQuery,!0)}syncIfViewing(e){this.currentMailbox===e&&this.sync()}async fetch(e,t,n=``,r=!1){this.setContext(e,t,n);let i=++this.currentFetchId;this.dispatchEvent(new CustomEvent(`sync-start`,{detail:{background:!1}}));let a=Date.now();try{let o=`/mailboxes/${encodeURIComponent(e)}?page=${t}`;n&&(o+=`&query=${encodeURIComponent(n)}`),r&&(o+=`&refresh=true`);let s=await j(o);if(this.currentFetchId!==i)return;if(s.status===401){this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`));return}if(s.status===404){this.dispatchEvent(new CustomEvent(`mailbox-not-found`));return}let c=await s.json();if(this.currentFetchId!==i)return;let l=Date.now()-a;if(l<200&&await new Promise(e=>setTimeout(e,200-l)),this.currentFetchId!==i)return;this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:c,background:!1}}))}catch(e){if(this.currentFetchId!==i)return;b.error(`Failed to fetch mailbox data`,e);let t=Date.now()-a;if(t<200&&await new Promise(e=>setTimeout(e,200-t)),this.currentFetchId!==i)return;this.dispatchEvent(new CustomEvent(`sync-error`,{detail:{error:e,background:!1}}))}}async backgroundSync(){try{this.currentMailbox!==`INBOX`&&await j(`/mailboxes/${w}/status`).catch(()=>{}),await j(`/mailboxes/${encodeURIComponent(this.currentMailbox)}/status`);let e=`/mailboxes/${encodeURIComponent(this.currentMailbox)}?page=${this.currentPage}`;this.currentQuery&&(e+=`&query=${encodeURIComponent(this.currentQuery)}`);let t=await j(e);if(t.status===401){this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`));return}let n=await t.json();this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:n,background:!0}}))}catch(e){b.error(`Background sync failed`,e)}}},P=`\\Seen`,F=`\\Flagged`,jt=`\\Answered`,Mt=`\\Deleted`,Nt=`\\Draft`,Pt=`$Forwarded`,Ft=`$MDNSent`,It=`Junk`,Lt=`NonJunk`,Rt=`$SubmitPending`,zt=`$Submitted`;function Bt(e,t){if(!e)return[];let n=new Set([P,F,jt,Mt,Nt,Pt,Ft,It,Lt,Rt,zt].map(e=>e.toLowerCase())),r=[];for(let i of e)i.startsWith(`\\`)||n.has(i.toLowerCase())||r.push({id:i,name:Vt(i,t),color:Ht(i)});return r.sort((e,t)=>{let n=e.id.toLowerCase().startsWith(`$label`),r=t.id.toLowerCase().startsWith(`$label`);return n&&!r?-1:!n&&r?1:e.id.localeCompare(t.id)})}function Vt(e,t){switch(e.toLowerCase()){case`$label1`:return t?.t(`tags.important`)||`Important`;case`$label2`:return t?.t(`tags.work`)||`Work`;case`$label3`:return t?.t(`tags.personal`)||`Personal`;case`$label4`:return t?.t(`tags.todo`)||`To Do`;case`$label5`:return t?.t(`tags.later`)||`Later`;default:return e}}function Ht(e){switch(e.toLowerCase()){case`$label1`:return`#ef4444`;case`$label2`:return`#f97316`;case`$label3`:return`#22c55e`;case`$label4`:return`#3b82f6`;case`$label5`:return`#a855f7`;default:return Ut(e)}}function Ut(e){let t=0;for(let n=0;n<e.length;n++)t=e.charCodeAt(n)+((t<<5)-t);return`hsl(${Math.abs(t)%360}, 70%, 45%)`}var I=new class extends EventTarget{async setFlag(e,t,n,r){try{let i=await j(`/mailboxes/${encodeURIComponent(e)}/messages/flag`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:t,flags:n,action:r})});return i.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):i.ok}catch(e){return b.error(`Failed to set flag`,e),!1}}async toggleStar(e,t){let n=t?.UID;if(!n)return t;let r=t.Flags?.includes(F),i=r?`remove`:`add`;if(await this.setFlag(e,[String(n)],[`\\Flagged`],i)){let e={...t};return r?e.Flags=e.Flags.filter(e=>e!==F):e.Flags=[...e.Flags||[],F],e}return t}async markAsUnread(e,t){let n=t?.UID;return n?!!await this.setFlag(e,[String(n)],[`\\Seen`],`remove`):!1}async markAsRead(e,t){let n=t?.UID;if(!n||t.Flags?.includes(`\\Seen`))return t;if(await this.setFlag(e,[String(n)],[`\\Seen`],`add`)){let e={...t};return e.Flags=[...e.Flags||[],P],e}return t}async deleteMessages(e,t){if(!t||t.length===0)return!1;try{let n=await j(`/mailboxes/${encodeURIComponent(e)}/messages`,{method:`DELETE`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:t})});return n.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):n.ok?(N.sync(),!0):!1}catch(e){return b.error(`Failed to delete messages`,e),!1}}async moveMessages(e,t,n){if(!t||t.length===0)return{success:!1};try{let r=await j(`/mailboxes/${encodeURIComponent(e)}/messages/move`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:t,to:n})});return r.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),{success:!1}):r.ok?(N.sync(),{success:!0,uidMapping:(await r.json()).uidMapping}):{success:!1}}catch(e){return b.error(`Failed to move messages`,e),{success:!1}}}async copyMessages(e,t,n){if(!t||t.length===0)return{success:!1};try{let r=await j(`/mailboxes/${encodeURIComponent(e)}/messages/copy`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:t,to:n})});return r.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),{success:!1}):r.ok?(N.sync(),{success:!0}):{success:!1}}catch(e){return b.error(`Failed to copy messages`,e),{success:!1}}}async markMessagesAsRead(e,t){return!t||t.length===0?!1:await this.setFlag(e,t,[P],`add`)}async markMessagesAsUnread(e,t){return!t||t.length===0?!1:await this.setFlag(e,t,[P],`remove`)}async saveDraft(e){try{let t=await j(`/messages`,{method:`POST`,body:e});if(t.status===401)return this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),null;if(t.ok){let e=await t.json();return{uid:e.draft_uid,mailbox:e.draft_mailbox,size:e.draft_size,attachments:e.attachments}}let n=await t.json();return b.error(`Failed to save draft:`,n),null}catch(e){return b.error(`Failed to save draft:`,e),null}}async sendDraft(e){try{let t=await j(`/messages`,{method:`POST`,body:e});if(t.status===401)return this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1;if(t.ok)return N.sync(),!0;let n=await t.json();throw Error(n.error||`Failed to send message`)}catch(e){throw b.error(`Failed to send message:`,e),e}}},Wt=e=>{let t=e.trim(),n=t.match(/^.*?<([^>]+)>$/);n&&n[1]&&(t=n[1]);let r=t.toLowerCase();return r.startsWith(`noreply`)||r.startsWith(`no-reply`)||r.startsWith(`mailer-daemon`)},Gt=e=>e&&e.filter(e=>!Wt(e)),Kt=class extends EventTarget{constructor(){super(),this.state={activeComposers:[]},this.saveTimeout=null,this.state.activeComposers=this.loadDrafts()}loadDrafts(){try{let e=localStorage.getItem(`alps_compose_drafts`);if(e)return JSON.parse(e).map(e=>{let t=e.isSending;return{...e,attachments:e.attachments?.filter(e=>!e.uploading&&e.uuid)||[],isSending:!1,minimized:t?!1:e.minimized}})}catch(e){b.error(`Failed to parse compose drafts from localStorage`,e)}return[]}saveDrafts(){try{localStorage.setItem(`alps_compose_drafts`,JSON.stringify(this.state.activeComposers))}catch(e){b.error(`Failed to save compose drafts to localStorage`,e)}}debouncedSaveDrafts(){this.saveTimeout!==null&&window.clearTimeout(this.saveTimeout),this.saveTimeout=window.setTimeout(()=>{this.saveDrafts(),this.saveTimeout=null},500)}notify(){this.dispatchEvent(new CustomEvent(`change`))}get stateCopy(){return{...this.state}}getComposer(e){return this.state.activeComposers.find(t=>t.id===e)}getState(){return this.state}openComposer(e){if(e?.draftUid){let t=this.state.activeComposers.find(t=>t.draftUid===e.draftUid);if(t){this.bringComposerToFront(t.id),t.minimized&&this.updateComposer(t.id,{minimized:!1});return}}let t=window.innerWidth<=768;if(t&&this.state.activeComposers.length>=1){let e=this.state.activeComposers[0].id;this.bringComposerToFront(e);return}if(!t&&this.state.activeComposers.length>=3)return;let n=`composer_`+Date.now()+`_`+Math.random().toString(36).substr(2,5),r=`html`,i=``;try{let e=localStorage.getItem(`alps_settings`);if(e){let t=JSON.parse(e);t.composeFormat===`text`&&(r=`text`),t.signature&&(i=t.signature)}}catch{}let a=e?.text||``,o=e?.html||``;if(i&&!e?.draftUid){let t=`-- \n${i}`,n=`<div class="alps-signature">-- <br>${i.replace(/\n/g,`<br>`)}</div>`;a=`\n\n${t}\n${a}`,o=o||e?.text?`<br><br>${n}${o}`:`<br><br>${n}`}let s={id:n,minimized:!1,expanded:!1,dirty:!1,subject:``,format:e?.format||r,attachments:[],zIndex:1e3+this.state.activeComposers.length,...e,to:Gt(e?.to)||[],cc:Gt(e?.cc)||[],bcc:Gt(e?.bcc)||[],text:a,html:o,initialText:a,initialHtml:o};this.state={...this.state,activeComposers:[...this.state.activeComposers,s]},this.saveDrafts(),this.notify()}updateComposer(e,t){t.to&&=Gt(t.to),t.cc&&=Gt(t.cc),t.bcc&&=Gt(t.bcc);let n=this.state.activeComposers.map(n=>{if(n.id!==e)return n;let r=!1;if(`subject`in t&&t.subject!==n.subject&&(r=!0),`to`in t&&JSON.stringify(t.to||[])!==JSON.stringify(n.to||[])&&(r=!0),`cc`in t&&JSON.stringify(t.cc||[])!==JSON.stringify(n.cc||[])&&(r=!0),`bcc`in t&&JSON.stringify(t.bcc||[])!==JSON.stringify(n.bcc||[])&&(r=!0),`attachments`in t&&t.attachments!==n.attachments&&(r=!0),!r&&!n.dirty){if(`text`in t||`html`in t){let e=`text`in t?t.text||``:n.text||``,i=n.initialText||``;e.trim()!==i.trim()&&(r=!0)}}else !r&&n.dirty;let i=`dirty`in t?t.dirty:r?!0:n.dirty;return{...n,...t,dirty:i}});this.state={...this.state,activeComposers:n},this.debouncedSaveDrafts(),this.notify()}closeComposer(e){this.state={...this.state,activeComposers:this.state.activeComposers.filter(t=>t.id!==e)},this.saveDrafts(),this.notify()}discardDraft(e){let t=this.state.activeComposers.find(t=>t.id===e);t&&t.draftUid&&t.draftMailbox&&I.deleteMessages(t.draftMailbox,[String(t.draftUid)]),this.closeComposer(e)}clearAllComposers(){this.state={...this.state,activeComposers:[]},this.saveDrafts(),this.notify()}async saveAllDirtyDrafts(){let e=this.state.activeComposers.filter(e=>e.dirty);if(e.length>0)for(let t of e){let e=(t.to?.length||0)>0||(t.cc?.length||0)>0||(t.bcc?.length||0)>0,n=t.text?.trim()!==t.initialText?.trim()||(t.subject?.trim().length||0)>0;if(!e&&!n&&!(t.attachments&&t.attachments.length>0))continue;let r=new FormData,i=[...t.bcc||[]],a=``;try{let e=localStorage.getItem(`alps_settings`);if(e){let t=JSON.parse(e);t.bccMyself&&t.loginUsername&&(i.includes(t.loginUsername)||i.push(t.loginUsername)),t.replyTo&&(a=t.replyTo)}}catch{}r.append(`to`,(t.to||[]).join(`, `)),r.append(`cc`,(t.cc||[]).join(`, `)),r.append(`bcc`,i.join(`, `)),a&&r.append(`reply_to`,a),r.append(`subject`,(t.subject||``).trim()),r.append(`text`,t.text||``),t.html&&t.format===`html`&&r.append(`html`,t.html),r.append(`save_as_draft`,`1`);let o=t.attachments||[],s=o.map(e=>e.uuid).filter(Boolean).join(`,`);s&&r.append(`attachment-uuids`,s);let c=o.map(e=>e.partPath).filter(Boolean).join(`,`);c&&r.append(`prev_attachments`,c),t.draftMailbox&&r.append(`draft_mailbox`,t.draftMailbox),t.draftUid&&r.append(`draft_uid`,t.draftUid),await I.saveDraft(r)}this.state={...this.state,activeComposers:[]},this.saveDrafts(),this.notify()}bringComposerToFront(e){let t=1e3;this.state.activeComposers.forEach(e=>{e.zIndex&&e.zIndex>t&&(t=e.zIndex)}),this.updateComposer(e,{zIndex:t+1})}},L=u(`compose-store`),qt=new class extends EventTarget{constructor(){super(),this.accounts=[],this.loading=!1,this.initialized=!1}getAccounts(){return this.accounts}isLoading(){return this.loading}isInitialized(){return this.initialized}async fetchAccounts(){this.loading=!0,this.dispatchEvent(new Event(`change`));try{let e=await fetch(`/accounts`);if(e.ok){let t=await e.json();this.accounts=t.accounts||[],this.initialized=!0}else b.error(`Failed to fetch linked accounts`)}catch(e){b.error(`Error fetching linked accounts:`,e)}finally{this.loading=!1,this.dispatchEvent(new Event(`change`))}}async addAccount(e,t,n=``){let r=new URLSearchParams;r.append(`username`,e),r.append(`password`,t),r.append(`display_name`,n);let i=await fetch(`/accounts`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:r.toString()});if(!i.ok){let e=await i.json().catch(()=>({}));throw Error(e.error||`Failed to add linked account`)}await this.fetchAccounts()}async removeAccount(e){let t=await fetch(`/accounts/${encodeURIComponent(e)}`,{method:`DELETE`});if(!t.ok){let e=await t.json().catch(()=>({}));throw Error(e.error||`Failed to remove linked account`)}await this.fetchAccounts()}async switchAccount(e){let t=new URLSearchParams;t.append(`username`,e);let n=await fetch(`/accounts/switch`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:t.toString()});if(!n.ok){let e=await n.json().catch(()=>({}));throw Error(e.error||`Failed to switch account`)}return await n.json()}},Jt=u(`alps-linked-accounts`),Yt=class extends d{constructor(...e){super(...e),this.name=``,this.email=``,this.src=``,this.size=40,this.imageError=!1,this._handleStoreChange=()=>{this.requestUpdate()}}willUpdate(e){e.has(`src`)&&(this.imageError=!1)}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.settingsStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=n`
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
  `}getInitials(e){if(!e)return`U`;let t=e.trim().split(/[\s.@]+/);return t.length>=2?(t[0][0]+t[1][0]).toUpperCase():e.substring(0,2).toUpperCase()}render(){let e=this.settingsStore?.getState()?.loginUsername||``,t=this.settingsStore?.getState()?.name||``,n=!1;(e&&this.email&&this.email.toLowerCase()===e.toLowerCase()||t&&this.name&&this.name.toLowerCase()===t.toLowerCase()||e&&this.name&&this.name.toLowerCase()===e.toLowerCase())&&(n=!0);let r=n?t||e:this.email||this.name,i=n&&(t||e)||this.name,a=Math.round(this.size/2.3);return s`
      <div class="avatar" style="${p({width:`${this.size}px`,height:`${this.size}px`,fontSize:`${a}px`,backgroundColor:Ge(r)})}">
        ${this.src&&!this.imageError?s`<img src="${this.src}" alt="${this.name}" @error="${()=>this.imageError=!0}" />`:this.getInitials(i)}
      </div>
    `}};E([g({context:C})],Yt.prototype,`settingsStore`,void 0),E([o({type:String})],Yt.prototype,`name`,void 0),E([o({type:String})],Yt.prototype,`email`,void 0),E([o({type:String})],Yt.prototype,`src`,void 0),E([o({type:Number})],Yt.prototype,`size`,void 0),E([a()],Yt.prototype,`imageError`,void 0),Yt=E([m(`alps-avatar`)],Yt);var Xt=class extends d{constructor(...e){super(...e),this.username=``,this.isMobile=!1,this.currentTab=`messages`,this._handleStoreChange=()=>{this.requestUpdate()}}static{this.styles=[ct,n`
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
  `]}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange),this.settingsStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.addEventListener(`change`,this._handleStoreChange),window.addEventListener(`plugins-updated`,this._handleStoreChange),this.linkedAccountsStore&&!this.linkedAccountsStore.isInitialized()&&this.linkedAccountsStore.fetchAccounts()})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.removeEventListener(`change`,this._handleStoreChange),window.removeEventListener(`plugins-updated`,this._handleStoreChange)}_closePopup(){let e=this.shadowRoot?.querySelector(`alps-popup`);e&&e.close()}_handleSettings(){this._closePopup(),this.dispatchEvent(new CustomEvent(`open-settings`,{bubbles:!0,composed:!0}))}_handleSignOut(){this._closePopup(),this.dispatchEvent(new CustomEvent(`sign-out`,{bubbles:!0,composed:!0}))}_handleTabChange(e){this._closePopup(),e===`messages`?window.location.hash.startsWith(`#/mailbox/`)||(window.location.hash=`#/`):window.location.hash=`#/`+e,this.dispatchEvent(new CustomEvent(`change-tab`,{detail:{tab:e},bubbles:!0,composed:!0}))}async _handleSwitchAccount(e){this._closePopup();let t=document.createElement(`div`);document.body.appendChild(t),c(s`
      <style>
        @keyframes global-spin { to { transform: rotate(360deg); } }
        .switch-overlay svg { width: 100%; height: 100%; fill: currentColor; }
      </style>
      <div id="switch-account-overlay" class="switch-overlay" style="position: fixed; inset: 0; background-color: var(--bg-primary, #ffffff); z-index: 999999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease-in;">
        <div style="display: inline-flex; width: 32px; height: 32px; animation: global-spin 1s linear infinite; color: var(--accent-color, #2563eb);">
          ${T(`edelweiss`)}
        </div>
      </div>
    `,t);let n=t.querySelector(`#switch-account-overlay`);requestAnimationFrame(()=>{requestAnimationFrame(()=>{n&&(n.style.opacity=`1`)})}),await new Promise(e=>setTimeout(e,300));try{(await this.linkedAccountsStore.switchAccount(e)).requires_2fa?(window.location.hash=`#/login/webauthn`,n&&(n.style.opacity=`0`),setTimeout(()=>t.remove(),300)):(Ne(),sessionStorage.clear(),window.location.reload())}catch(e){n&&(n.style.opacity=`0`),setTimeout(()=>t.remove(),300),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore?.t(`linkedAccounts.switchError`),duration:5e3}}))}}render(){let e=this.settingsStore?.getState().name||this.username;return s`
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
            ${T(`envelopeSimple`)} <span class="item-text">${this.i18nStore?.t(`navigation.messages`)}</span>
          </button>
          ${y.getNavTabs().map(e=>s`
            <button class="dropdown-item ${this.currentTab===e.id?`active`:``}" @click="${()=>this._handleTabChange(e.id)}">
              ${T(e.icon||`star`)} <span class="item-text">${this.i18nStore?.t(e.labelKey)}</span>
            </button>
          `)}
          <div class="dropdown-divider"></div>
          <button class="dropdown-item ${this.currentTab===`settings`?`active`:``}" @click="${this._handleSettings}">
            ${T(`gear`)} <span class="item-text">${this.i18nStore?.t(`userMenu.settings`)}</span>
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click="${this._handleSignOut}">
            ${T(`signOut`)} <span class="item-text">${this.i18nStore?.t(`userMenu.signOut`)}</span>
          </button>
        </alps-popup>
      </div>
    `}};E([o({type:String})],Xt.prototype,`username`,void 0),E([o({type:Boolean})],Xt.prototype,`isMobile`,void 0),E([o({type:String})],Xt.prototype,`currentTab`,void 0),E([g({context:S})],Xt.prototype,`i18nStore`,void 0),E([g({context:C})],Xt.prototype,`settingsStore`,void 0),E([g({context:Jt})],Xt.prototype,`linkedAccountsStore`,void 0),Xt=E([m(`user-profile-menu`)],Xt);var Zt=class extends d{constructor(...e){super(...e),this.username=``,this.currentTab=``,this.isMobile=!1,this.scrolled=!1,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=n`
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
  `}handleSettings(){window.location.hash=`/settings`}async handleSignOut(){try{this.composeStore&&await this.composeStore.saveAllDirtyDrafts(),await fetch(`/session`,{method:`DELETE`}),At.clear(),Ne(),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`}catch(e){b.error(`Failed to sign out`,e)}}render(){return s`
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
    `}};E([o({type:String})],Zt.prototype,`username`,void 0),E([o({type:String})],Zt.prototype,`currentTab`,void 0),E([o({type:Boolean,reflect:!0})],Zt.prototype,`isMobile`,void 0),E([o({type:Boolean,reflect:!0})],Zt.prototype,`scrolled`,void 0),E([g({context:S})],Zt.prototype,`i18nStore`,void 0),E([g({context:L})],Zt.prototype,`composeStore`,void 0),Zt=E([m(`alps-header`)],Zt);var Qt=class extends d{constructor(...e){super(...e),this.username=``,this.currentTab=`messages`,this.isMobile=!1,this.currentMailbox=``,this.searchQuery=``,this.scrolled=!1,this._handleStoreChange=()=>{this.requestUpdate()},this._handleHashChange=()=>{let e=window.location.hash;if(e.startsWith(`#/contacts`))this.currentTab=`contacts`;else if(e.startsWith(`#/settings`))this.currentTab=`settings`;else{let t=y.getNavTabs().find(t=>e.startsWith(`#/${t.id}`));t?this.currentTab=t.id:this.currentTab=`messages`}}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)}),window.addEventListener(`hashchange`,this._handleHashChange),window.addEventListener(`plugins-updated`,this._handleStoreChange),this._handleHashChange()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),window.removeEventListener(`hashchange`,this._handleHashChange),window.removeEventListener(`plugins-updated`,this._handleStoreChange)}static{this.styles=n`
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
              ${T(`edelweiss`)}
            </div>
            <div class="nav-tabs">
              <div 
                class="nav-tab ${this.currentTab===`messages`?`active`:``}"
                @click=${()=>this.handleTabClick(`messages`)}
                title=${this.i18nStore?.t(`navigation.messages`)}
              >
                ${this.i18nStore?.t(`navigation.messages`)}
              </div>
              ${y.getNavTabs().map(e=>s`
                <div 
                  class="nav-tab ${this.currentTab===e.id?`active`:``}"
                  @click=${()=>this.handleTabClick(e.id)}
                  title=${this.i18nStore?.t(e.labelKey)||e.id}
                >
                  ${this.i18nStore?.t(e.labelKey)||e.id}
                </div>
              `)}
            </div>
          `}
        </div>

        <alps-input 
          slot="center"
          icon="magnifyingGlass"
          ?clearable=${!0}
          .value=${this.searchQuery}
          .placeholder=${this.currentTab===`contacts`?this.i18nStore?.t(`contacts.title`)||`Contacts`:this.currentTab===`calendar`?this.i18nStore?.t(`calendar.title`)||`Search Calendar`:this.currentMailbox?Je(this.currentMailbox,this.i18nStore):this.i18nStore?.t(`search.placeholder`)}
          @keydown=${e=>{e.key===`Enter`&&(e.preventDefault(),this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:e.target.value},bubbles:!0,composed:!0})))}}
          @clear=${()=>{this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:``},bubbles:!0,composed:!0}))}}
        ></alps-input>

        <div slot="right-actions">
        </div>
      </alps-header>
    `}};E([o({type:String})],Qt.prototype,`username`,void 0),E([o({type:String})],Qt.prototype,`currentTab`,void 0),E([o({type:Boolean})],Qt.prototype,`isMobile`,void 0),E([o({type:String})],Qt.prototype,`currentMailbox`,void 0),E([o({type:String})],Qt.prototype,`searchQuery`,void 0),E([o({type:Boolean})],Qt.prototype,`scrolled`,void 0),E([g({context:S})],Qt.prototype,`i18nStore`,void 0),Qt=E([m(`app-header`)],Qt);var $t=class extends d{constructor(...e){super(...e),this.text=``,this.fullHeight=!1}static{this.styles=n`
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
      <div class="spinner">${T(`edelweiss`)}</div>
      ${this.text?s`<span>${this.text}</span>`:``}
    `}};E([o({type:String})],$t.prototype,`text`,void 0),E([o({type:Boolean,attribute:`full-height`})],$t.prototype,`fullHeight`,void 0),$t=E([m(`alps-loader`)],$t);var en=class extends d{constructor(...e){super(...e),this.hidden=!1}static{this.styles=n`
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
  `}render(){return s`<alps-loader></alps-loader>`}};E([o({type:Boolean,reflect:!0})],en.prototype,`hidden`,void 0),en=E([m(`alps-initial-loader`)],en);var R=class extends d{constructor(...e){super(...e),this.contacts=[],this.uniqueCategories=[],this.selectedCategory=``,this.filterQuery=``,this.sidebarCollapsed=!1,this.isSidebarHovered=!1,this.suppressSidebarHover=!1,this.isMobile=!1,this.activeKebabMenu=null,this.sidebarScrolled=!1}static{this.styles=[ct,$e,n`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
      box-sizing: border-box;
    }
    .sidebar-wrapper {
      background-color: var(--bg-secondary, #f9fafb);
    }
    .sidebar-header {
      background-color: var(--bg-secondary, #f9fafb);
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
      color: var(--text-primary);
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
      <div class="sidebar-wrapper ${this.sidebarCollapsed&&!this.isMobile&&(!this.isSidebarHovered||this.suppressSidebarHover)?`collapsed`:``}">
        <alps-toolbar class="sidebar-header" ?scrolled=${this.sidebarScrolled}>
          <alps-create-button 
            icon="userPlus" 
            ?collapsed=${this.sidebarCollapsed&&!this.isMobile&&(!this.isSidebarHovered||this.suppressSidebarHover)}
            @click=${()=>this.dispatchEvent(new CustomEvent(`create-contact`))}
          >${this.i18nStore?.t(`contacts.addContact`)}</alps-create-button>
        </alps-toolbar>
        
        <div class="sidebar-content" @scroll=${this.handleSidebarScroll}>
          <div class="sidebar-scroll-content">
            ${[Et,Dt,...this.uniqueCategories.filter(e=>e!==Dt)].map(e=>{let t=e===`All Contacts`?this.contacts.length:this.contacts.filter(t=>t.categories&&t.categories.includes(e)).length,n=e===`All Contacts`||e===`Favorites`;return s`
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
                          ${T(`pen`)} <span class="item-text">${this.i18nStore?.t(`contacts.rename`)}</span>
                        </button>
                        <button class="dropdown-item text-danger" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.dispatchEvent(new CustomEvent(`delete-category`,{detail:{category:e}}))}}>
                          ${T(`trash`)} <span class="item-text">${this.i18nStore?.t(`contacts.delete`)}</span>
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
    `}};E([g({context:S})],R.prototype,`i18nStore`,void 0),E([o({type:Array})],R.prototype,`contacts`,void 0),E([o({type:Array})],R.prototype,`uniqueCategories`,void 0),E([o({type:String})],R.prototype,`selectedCategory`,void 0),E([o({type:String})],R.prototype,`filterQuery`,void 0),E([o({type:Boolean})],R.prototype,`sidebarCollapsed`,void 0),E([o({type:Boolean})],R.prototype,`isSidebarHovered`,void 0),E([o({type:Boolean})],R.prototype,`suppressSidebarHover`,void 0),E([o({type:Boolean})],R.prototype,`isMobile`,void 0),E([a()],R.prototype,`activeKebabMenu`,void 0),E([a()],R.prototype,`sidebarScrolled`,void 0),R=E([m(`alps-contacts-categories`)],R);var tn=new class extends EventTarget{async createMailbox(e){try{let t=new URLSearchParams;t.append(`name`,e);let n=await j(`/mailboxes`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:t.toString()});return n.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):n.ok?(N.sync(),!0):!1}catch(e){return b.error(`Failed to create mailbox`,e),!1}}async renameMailbox(e,t){try{let n=await j(`/mailboxes/${encodeURIComponent(e)}/rename`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({new_name:t})});return n.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):n.ok?(N.sync(),!0):!1}catch(e){return b.error(`Failed to rename mailbox`,e),!1}}async deleteMailbox(e){try{let t=await j(`/mailboxes/${encodeURIComponent(e)}`,{method:`DELETE`});return t.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):t.ok?(N.sync(),!0):!1}catch(e){return b.error(`Failed to delete mailbox`,e),!1}}async emptyMailbox(e){try{let t=await j(`/mailboxes/${encodeURIComponent(e)}/empty`,{method:`POST`});return t.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):t.ok?(N.sync(),!0):!1}catch(e){return b.error(`Failed to empty mailbox`,e),!1}}async subscribeMailbox(e){try{let t=await j(`/mailboxes/${encodeURIComponent(e)}/subscribe`,{method:`PUT`});return t.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):t.ok?(N.sync(),!0):!1}catch(e){return b.error(`Failed to subscribe mailbox`,e),!1}}async unsubscribeMailbox(e){try{let t=await j(`/mailboxes/${encodeURIComponent(e)}/unsubscribe`,{method:`PUT`});return t.status===401?(this.dispatchEvent(new CustomEvent(`auth-error`)),window.dispatchEvent(new CustomEvent(`auth-error`)),!1):t.ok?(N.sync(),!0):!1}catch(e){return b.error(`Failed to unsubscribe mailbox`,e),!1}}},nn=class extends d{constructor(...e){super(...e),this.name=``,this.color=``}static{this.styles=n`
    :host {
      display: inline-flex;
    }

    .tag-pill {
      display: inline-flex;
      align-items: center;
      padding: 0 10px 0 6px;
      height: 18px;
      border-radius: 4px 0 0 4px;
      font-size: 10px;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      max-width: 80px;
      line-height: 1;
      opacity: 0.9;
      clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%);
    }

    .tag-pill:hover {
      opacity: 1;
    }
  `}render(){return s`
      <div class="tag-pill" style="background-color: ${this.color}" title=${this.name}>
        ${this.name}
      </div>
    `}};E([o({type:String})],nn.prototype,`name`,void 0),E([o({type:String})],nn.prototype,`color`,void 0),nn=E([m(`alps-tag`)],nn);var rn=class extends d{constructor(...e){super(...e),this.currentPage=0,this.totalItems=0,this.itemsPerPage=50,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=n`
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
    `}};E([o({type:Number})],rn.prototype,`currentPage`,void 0),E([o({type:Number})],rn.prototype,`totalItems`,void 0),E([o({type:Number})],rn.prototype,`itemsPerPage`,void 0),E([g({context:S})],rn.prototype,`i18nStore`,void 0),rn=E([m(`alps-pagination`)],rn);var an=class extends d{constructor(...e){super(...e),this.variant=`info`}static{this.styles=n`
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
      min-height: 38px;
      box-sizing: border-box;
      font-size: 13px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-primary, #ffffff);
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

    @media (max-width: 768px) {
      .banner {
        font-size: 11px;
        padding: 6px 12px;
      }
      .content {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .actions {
        margin-left: 8px;
      }
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
    `}};E([o({type:String,reflect:!0})],an.prototype,`variant`,void 0),an=E([m(`alps-banner`)],an);var z=class extends d{constructor(...e){super(...e),this.messages=[],this.currentMailbox=``,this.loading=!1,this.selectedMessage=null,this.layoutMode=`vertical`,this.isMobile=!1,this.sidebarCollapsed=!1,this.currentPage=0,this.totalMessages=0,this.messagesPerPage=50,this.filterQuery=``,this.sortOrder=`desc`,this.densityMode=`compact`,this.selectedMessages=new Set,this.syncing=!1,this.isSpinning=!1,this.isScrolled=!1,this.isAtBottom=!1,this.focusedIndex=-1,this.showEmptyConfirm=!1,this.collapsedThreads=new Set,this._shouldScrollToTop=!1,this._handleStoreChange=()=>{this.requestUpdate()},this.handleSyncStart=()=>{this.syncing=!0,this.isSpinning=!0},this.handleSyncEnd=()=>{this.syncing=!1},this.handleSpinIteration=()=>{this.syncing||(this.isSpinning=!1)},this.handleScroll=e=>{this.checkScrollState(e.target)}}static{this.styles=n`
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
      outline: 2px solid var(--accent-color);
      outline-offset: -2px;
      z-index: 10;
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

    .tag-pills {
      display: flex;
      flex-wrap: nowrap;
      gap: 4px;
      margin-right: 6px;
      overflow: hidden;
      flex-shrink: 0;
      align-items: center;
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

    .thread-count-caret-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--border-color, #e5e7eb);
      color: var(--text-muted, #4b5563);
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 8px;
      line-height: 1;
      flex-shrink: 0;
    }
    
    .message-item.unread .thread-count-caret-badge {
      background: var(--accent-color, #eab308);
      color: #fff;
    }

    .caret-col {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 44px;
      height: 100%;
      cursor: pointer;
      color: var(--text-muted);
      opacity: 0.6;
      transition: opacity 0.2s, color 0.2s;
      flex-shrink: 0;
    }
    .caret-col:hover {
      opacity: 1;
      color: var(--text-color);
    }
    .caret-col.empty {
      cursor: default;
      opacity: 0;
      pointer-events: none;
    }
    .caret-col svg {
      width: 14px;
      height: 14px;
    }

    .message-item.sub-message-item {
      background: var(--bg-secondary, #fafafa);
    }
    .message-item.sub-message-item.first-sub-item {
      box-shadow: inset rgba(95, 95, 95, 0.1) 0 4px 4px -2px;
    }
    .message-item.sub-message-item.last-sub-item {
      box-shadow: inset rgba(95, 95, 95, 0.1) 0 -4px 4px -2px;
    }
    .message-item.sub-message-item.first-sub-item.last-sub-item {
      box-shadow: inset rgba(95, 95, 95, 0.1) 0 4px 4px -2px,
                  inset rgba(95, 95, 95, 0.1) 0 -4px 4px -2px;
    }
    .message-item.sub-message-item:hover {
      background: var(--hover-color);
    }
    .message-item.sub-message-item.active {
      background: var(--bg-selected);
    }
  `}get visibleMessages(){let e=[];for(let t of this.messages||[])e.push(t),t.SubMessages&&t.SubMessages.length>0&&this.isThreadExpanded(String(t.UID))&&e.push(...t.SubMessages);return e}isThreadExpanded(e){return!this.collapsedThreads.has(e)}toggleThreadCollapse(e,t){e.stopPropagation();let n=new Set(this.collapsedThreads);n.has(t)?n.delete(t):n.add(t),this.collapsedThreads=n}handleSelectAll(e){if(e.target.checked){let e=this.visibleMessages.map(e=>String(e.UID));this.selectedMessages=new Set(e)}else this.selectedMessages=new Set;this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}}))}handleSelectMessage(e,t){e.stopPropagation();let n=e.target.checked,r=new Set(this.selectedMessages);n?r.add(t):r.delete(t),this.selectedMessages=r,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}}))}connectedCallback(){super.connectedCallback(),N.addEventListener(`sync-start`,this.handleSyncStart),N.addEventListener(`sync-success`,this.handleSyncEnd),N.addEventListener(`sync-error`,this.handleSyncEnd),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),N.removeEventListener(`sync-start`,this.handleSyncStart),N.removeEventListener(`sync-success`,this.handleSyncEnd),N.removeEventListener(`sync-error`,this.handleSyncEnd),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}willUpdate(e){if(super.willUpdate(e),(e.has(`currentMailbox`)||e.has(`currentPage`)||e.has(`filterQuery`)||e.has(`sortOrder`))&&(this.selectedMessages.size>0&&(this.selectedMessages=new Set,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}}))),this._shouldScrollToTop=!0),e.has(`selectedMessage`)||e.has(`messages`)){if(e.has(`messages`)&&this.messages&&this.selectedMessages.size>0){let e=new Set;for(let t of this.messages)if(e.add(String(t.UID)),t.SubMessages)for(let n of t.SubMessages)e.add(String(n.UID));let t=!1,n=new Set;for(let r of this.selectedMessages)e.has(r)?n.add(r):t=!0;t&&(this.selectedMessages=n,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}})))}if(this.selectedMessage){let e=this.visibleMessages;if(e.length>0){let t=e.findIndex(e=>String(e.UID)===String(this.selectedMessage.UID));t!==-1&&(this.focusedIndex=t)}}}}checkScrollState(e){if(!e)return;let t=e.scrollTop>0;this.isScrolled!==t&&(this.isScrolled=t,this.dispatchEvent(new CustomEvent(`list-scrolled`,{detail:{scrolled:t}})));let n=e.scrollHeight<=e.clientHeight||Math.ceil(e.scrollTop+e.clientHeight)>=e.scrollHeight;this.isAtBottom!==n&&(this.isAtBottom=n)}updated(e){if(super.updated(e),e.has(`densityMode`)&&(this.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),this.classList.add(`density-${this.densityMode}`)),e.has(`syncing`)&&this.syncing&&(this.isSpinning=!0),this._shouldScrollToTop&&(e.has(`messages`)||e.has(`loading`)&&!this.loading)){let e=this.renderRoot.querySelector(`.list-content`);e&&(e.scrollTop=0),this._shouldScrollToTop=!1}let t=this.renderRoot.querySelector(`.list-content`);t&&requestAnimationFrame(()=>{this.checkScrollState(t)})}selectMessage(e){this.selectedMessages.size>0&&(this.selectedMessages=new Set,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}}))),this.dispatchEvent(new CustomEvent(`select-message`,{detail:{message:e}}))}handleKeyDown(e){let t=this.visibleMessages;if(!(!t||t.length===0)){if(e.key===`ArrowDown`)e.preventDefault(),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused();else if(e.key===`ArrowUp`)e.preventDefault(),this.focusedIndex=Math.max(0,this.focusedIndex-1),this.scrollToFocused();else if(e.key===`Enter`)e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length&&this.selectMessage(t[this.focusedIndex]);else if(e.key===` `&&(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length)){let e=t[this.focusedIndex],n=String(e.UID),r=new Set(this.selectedMessages);r.has(n)?r.delete(n):r.add(n),this.selectedMessages=r,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}})),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused()}}}async handleEmptyMailbox(){this.showEmptyConfirm=!1,this.dispatchEvent(new CustomEvent(`toast`,{detail:{type:`info`,message:this.i18nStore?.t(`messageList.emptyingMailbox`)||`Emptying mailbox...`},bubbles:!0,composed:!0})),await tn.emptyMailbox(this.currentMailbox)?this.dispatchEvent(new CustomEvent(`toast`,{detail:{type:`success`,message:this.i18nStore?.t(`messageList.mailboxEmptied`)||`Mailbox emptied successfully.`},bubbles:!0,composed:!0})):this.dispatchEvent(new CustomEvent(`toast`,{detail:{type:`error`,message:this.i18nStore?.t(`messageList.emptyMailboxFailed`)||`Failed to empty mailbox. Make sure it is Trash or Junk.`},bubbles:!0,composed:!0}))}scrollToFocused(){this.updateComplete.then(()=>{let e=this.renderRoot.querySelector(`.message-item.focused`);e&&e.scrollIntoView({block:`nearest`})})}renderMessageItem(e,t=!1,n=!1,r=!1){let i=this.currentMailbox===`Drafts`||this.currentMailbox===`Sent`,a=[];i?(a=[...e.Envelope?.To||[],...e.Envelope?.Cc||[]],a.length||(a=e.Envelope?.From||[])):a=[...e.Envelope?.From||[],...e.Envelope?.To||[],...e.Envelope?.Cc||[]];let o=new Set,c=[];for(let e of a){let t=(e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``)||e.Name||`unknown`;t!==`unknown`&&!o.has(t)?(o.add(t),c.push(e)):t===`unknown`&&c.push(e)}let l=this.settingsStore?.getState()?.loginUsername?.toLowerCase()||``,u=e=>{let t=e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``;return!!(l&&t===l)};if(c.length>1){let e=c.filter(e=>!u(e));e.length>0&&(c=e)}c.length||(c=[{}]);let d=i?`messageList.noRecipient`:`messageList.unknownSender`,f=c.map(e=>{let t=e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`:``;return e.Name||t||this.i18nStore?.t(d)||this.i18nStore?.t(`messageList.unknown`)}).join(`, `),p=c.slice(0,3),m=c.length-3,h=p.length+ +(m>0),g=e.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`),_=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,v=String(this.settingsStore?.getState()?.hourFormat||`12`),ee=e.Envelope?.Date?Ke(e.Envelope.Date,_,v):``,te=e.RFC822Size||e.Size,ne=te?Ye(te):``,re=!e.Flags||!e.Flags.includes(`\\Seen`),ie=e.Flags&&e.Flags.includes(`\\Flagged`),ae=e.Flags&&e.Flags.includes(`\\Answered`),oe=e.Flags&&e.Flags.includes(`$Forwarded`),se=Bt(e.Flags,this.i18nStore),ce=this.densityMode===`loose`?48:this.densityMode===`compact`?24:40,le=e.SubMessages&&e.SubMessages.length>0,ue=this.isThreadExpanded(String(e.UID));return this.densityMode===`ultra-compact`?s`
      <div class="message-item ${t?`sub-message-item`:``} ${n?`first-sub-item`:``} ${r?`last-sub-item`:``} ${this.selectedMessages.size===0&&this.selectedMessage?.UID===e.UID||this.selectedMessages.has(String(e.UID))?`active`:``} ${re?`unread`:``} ${ie?`starred`:``} ${this.focusedIndex===this.visibleMessages.indexOf(e)?`focused`:``}" @click=${()=>this.selectMessage(e)}>
        ${this.isMobile?``:s`
          <div class="checkbox-col" @click=${t=>{t.stopPropagation();let n=String(e.UID),r=new Set(this.selectedMessages);r.has(n)?r.delete(n):r.add(n),this.selectedMessages=r,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}}))}}>
            <input type="checkbox" class="message-checkbox" 
              .checked=${this.selectedMessages.has(String(e.UID))}
              @click=${e=>e.stopPropagation()}
              @change=${t=>this.handleSelectMessage(t,String(e.UID))}>
          </div>
        `}

        <!-- Caret Toggle Button -->
        ${!t&&le?s`
          <div class="caret-col" @click=${t=>this.toggleThreadCollapse(t,String(e.UID))}>
            ${T(ue?`caretDown`:`caretRight`)}
            <span class="thread-count-caret-badge" title="${e.ThreadCount} messages">${e.ThreadCount}</span>
          </div>
        `:t?s`<div class="caret-col empty"></div>`:``}

        <div class="message-sender">${f}</div>
        <div @click=${t=>this.toggleStar(t,e)} class="star-btn ${ie?`starred`:``} star-btn-wrapper-ultra">
          ${T(ie?`starFourFill`:`starFour`)}
        </div>
        ${ae||oe?s`
          <div class="indicators-wrapper-ultra">
            ${ae?s`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.replied`)}>${T(`arrowBendUpLeft`)}</div>`:``}
            ${oe?s`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.forwarded`)}>${T(`arrowBendUpRight`)}</div>`:``}
          </div>
        `:``}
        ${se.length>0?s`
          <div class="tag-pills">
            ${se.map(e=>s`
              <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
            `)}
          </div>
        `:``}
        <div class="message-subject">
          ${g}
        </div>
        <div class="message-indicators">
          <div class="attachment-col">
            ${e.HasAttachments?s`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.hasAttachments`)}>${T(`paperclipHorizontal`)}</div>`:``}
          </div>
          <div class="message-date">${ee}</div>
        </div>
      </div>
      `:s`
    <div class="message-item ${t?`sub-message-item`:``} ${n?`first-sub-item`:``} ${r?`last-sub-item`:``} ${this.selectedMessages.size===0&&this.selectedMessage?.UID===e.UID||this.selectedMessages.has(String(e.UID))?`active`:``} ${re?`unread`:``} ${ie?`starred`:``} ${this.focusedIndex===this.visibleMessages.indexOf(e)?`focused`:``}" @click=${()=>this.selectMessage(e)}>
      ${this.isMobile?``:s`
        <div class="checkbox-col" @click=${t=>{t.stopPropagation();let n=String(e.UID),r=new Set(this.selectedMessages);r.has(n)?r.delete(n):r.add(n),this.selectedMessages=r,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedUids:this.selectedMessages}}))}}>
          <input type="checkbox" class="message-checkbox" 
            .checked=${this.selectedMessages.has(String(e.UID))}
            @click=${e=>e.stopPropagation()}
            @change=${t=>this.handleSelectMessage(t,String(e.UID))}>
        </div>
      `}

      <!-- Caret Toggle Button -->
      ${!t&&le?s`
        <div class="caret-col" @click=${t=>this.toggleThreadCollapse(t,String(e.UID))}>
          ${T(ue?`caretDown`:`caretRight`)}
          <span class="thread-count-caret-badge" title="${e.ThreadCount} messages">${e.ThreadCount}</span>
        </div>
      `:t?s`<div class="caret-col empty"></div>`:``}

      <div class="avatar-stack">
        ${p.map((e,t)=>{let n=e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`:``,r=e.Name||n||this.i18nStore?.t(d)||this.i18nStore?.t(`messageList.unknown`),i=Ze(e.Host?e.Host.toLowerCase():``);return s`
            <div class="avatar-wrapper" style="z-index: ${h-t};">
              <alps-avatar .name=${r} .email=${n} .size=${ce} .src=${i}></alps-avatar>
            </div>
          `})}
        ${m>0?s`
          <div class="avatar-wrapper extra-count" style="width: ${ce}px; height: ${ce}px; z-index: 0;">
            +${m}
          </div>
        `:``}
      </div>
      <div class="message-details">
        <div class="message-header-row">
          <div class="message-header-inner">
            <div class="message-sender">${f}</div>
            <div @click=${t=>this.toggleStar(t,e)} class="star-btn ${ie?`starred`:``}">
              ${T(ie?`starFourFill`:`starFour`)}
            </div>
          </div>
          <div class="message-indicators">
            <div class="attachment-col">
              ${e.HasAttachments?s`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.hasAttachments`)}>${T(`paperclipHorizontal`)}</div>`:``}
            </div>
            <div class="message-date">${ee}</div>
          </div>
        </div>
        <div class="message-subject-row">
          ${ae||oe?s`
            <div class="indicators-wrapper">
              ${ae?s`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.replied`)}>${T(`arrowBendUpLeft`)}</div>`:``}
              ${oe?s`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.forwarded`)}>${T(`arrowBendUpRight`)}</div>`:``}
            </div>
          `:``}
          ${se.length>0?s`
            <div class="tag-pills">
              ${se.map(e=>s`
                <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
              `)}
            </div>
          `:``}
          <div class="message-subject">
            ${g}
          </div>
          ${ne?s`<div class="message-size">${ne}</div>`:``}
        </div>
      </div>
    </div>
    `}toggleStar(e,t){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-star-message`,{detail:{message:t}}))}render(){return s`
      ${this.isMobile?``:s`
        <alps-toolbar class="list-header" ?scrolled=${this.isScrolled}>
          <input type="checkbox" class="select-all-checkbox" title=${this.i18nStore?.t(`messageList.selectAll`)}
            .checked=${this.messages.length>0&&this.selectedMessages.size===this.visibleMessages.length}
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
              ${Je(this.currentMailbox,this.i18nStore)}
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
        `:this.messages.length===0?s`<div class="empty-state">${this.i18nStore?.t(`messageList.noMessages`)}</div>`:r(this.messages,e=>e.UID,e=>s`
            ${this.renderMessageItem(e,!1)}
            ${e.SubMessages&&e.SubMessages.length>0&&this.isThreadExpanded(String(e.UID))?e.SubMessages.map((t,n)=>this.renderMessageItem(t,!0,n===0,n===e.SubMessages.length-1)):``}
          `)}
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
    `}};E([g({context:C})],z.prototype,`settingsStore`,void 0),E([g({context:S})],z.prototype,`i18nStore`,void 0),E([o({type:Array})],z.prototype,`messages`,void 0),E([o({type:String})],z.prototype,`currentMailbox`,void 0),E([o({type:Boolean})],z.prototype,`loading`,void 0),E([o({type:Object})],z.prototype,`selectedMessage`,void 0),E([o({type:String})],z.prototype,`layoutMode`,void 0),E([o({type:Boolean})],z.prototype,`isMobile`,void 0),E([o({type:Boolean})],z.prototype,`sidebarCollapsed`,void 0),E([o({type:Number})],z.prototype,`currentPage`,void 0),E([o({type:Number})],z.prototype,`totalMessages`,void 0),E([o({type:Number})],z.prototype,`messagesPerPage`,void 0),E([o({type:String})],z.prototype,`filterQuery`,void 0),E([o({type:String})],z.prototype,`sortOrder`,void 0),E([o({type:String})],z.prototype,`densityMode`,void 0),E([o({type:Object})],z.prototype,`selectedMessages`,void 0),E([o({type:Boolean})],z.prototype,`syncing`,void 0),E([a()],z.prototype,`isSpinning`,void 0),E([a()],z.prototype,`isScrolled`,void 0),E([a()],z.prototype,`isAtBottom`,void 0),E([a()],z.prototype,`focusedIndex`,void 0),E([a()],z.prototype,`showEmptyConfirm`,void 0),E([a()],z.prototype,`collapsedThreads`,void 0),z=E([m(`alps-message-list`)],z);var B=class extends d{constructor(...e){super(...e),this.contacts=[],this.selectedCategory=``,this.filterQuery=``,this.sortOrder=`asc`,this.showOnlyStarred=!1,this.isMobile=!1,this.densityMode=`compact`,this.selectedContacts=new Set,this.selectedContact=null,this.isSpinning=!1,this.loading=!1,this.listScrolled=!1,this.focusedIndex=-1}getFilteredContacts(){let e=this.contacts.filter(e=>{if(this.selectedCategory&&(!e.categories||!e.categories.includes(this.selectedCategory))||this.showOnlyStarred&&(!e.categories||!e.categories.includes(`Favorites`)))return!1;if(this.filterQuery){let t=this.filterQuery.toLowerCase();if(!(e.name||``).toLowerCase().includes(t)&&!(e.email||``).toLowerCase().includes(t)&&!(e.nickname||``).toLowerCase().includes(t)&&!(e.organization||``).toLowerCase().includes(t))return!1}return!0});return e.sort((e,t)=>{let n=(e.name||e.email||``).toLowerCase(),r=(t.name||t.email||``).toLowerCase();return n<r?this.sortOrder===`asc`?-1:1:n>r?this.sortOrder===`asc`?1:-1:0}),e}willUpdate(e){if(super.willUpdate(e),e.has(`selectedContact`)||e.has(`contacts`)||e.has(`selectedCategory`)||e.has(`filterQuery`)||e.has(`sortOrder`)||e.has(`showOnlyStarred`)){let e=this.getFilteredContacts();if(this.selectedContact&&e.length>0){let t=e.findIndex(e=>e.path===this.selectedContact.path);t===-1?this.focusedIndex=-1:this.focusedIndex=t}else this.focusedIndex=-1}}updated(e){super.updated(e),e.has(`densityMode`)&&(this.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),this.classList.add(`density-${this.densityMode}`))}static{this.styles=[z.styles,n`
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
    .list-content:focus {
      outline: none;
    }
    .list-content:focus-within .contact-item.focused {
      outline: 2px solid var(--accent-color);
      outline-offset: -2px;
      z-index: 10;
      position: relative;
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
  `]}formatRevision(e){if(!e)return``;let t=e;t.length===16&&t.indexOf(`-`)===-1&&(t=`${t.slice(0,4)}-${t.slice(4,6)}-${t.slice(6,8)}T${t.slice(9,11)}:${t.slice(11,13)}:${t.slice(13,16)}`);let n=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,r=String(this.settingsStore?.getState()?.hourFormat||`12`);return Ke(new Date(t),n,r)}handleKeyDown(e){let t=this.getFilteredContacts();if(t.length!==0){if(e.key===`ArrowDown`)e.preventDefault(),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused();else if(e.key===`ArrowUp`)e.preventDefault(),this.focusedIndex=Math.max(0,this.focusedIndex-1),this.scrollToFocused();else if(e.key===`Enter`)e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length&&this.dispatchEvent(new CustomEvent(`select-contact`,{detail:{contact:t[this.focusedIndex]}}));else if(e.key===` `&&(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length)){let n=t[this.focusedIndex];n.isTemporary||this.dispatchEvent(new CustomEvent(`toggle-selection`,{detail:{path:n.path,event:e}})),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused()}}}scrollToFocused(){this.updateComplete.then(()=>{let e=this.renderRoot.querySelector(`.contact-item.focused`);e&&e.scrollIntoView({block:`nearest`})})}handleListScroll(e){let t=e.target.scrollTop>0;this.listScrolled!==t&&(this.listScrolled=t,this.dispatchEvent(new CustomEvent(`list-scrolled`,{detail:{scrolled:t}})))}render(){return s`
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
      
      <div class="list-content" tabindex="0" @keydown=${this.handleKeyDown} @scroll=${this.handleListScroll} style="flex: 1; overflow-y: auto; transition: opacity 0.2s ease-in-out; opacity: ${this.loading&&this.contacts.length>0?.5:1}; pointer-events: ${this.loading?`none`:`auto`};">
        ${this.loading&&this.contacts.length===0?s`<alps-loader full-height .text=${this.i18nStore?.t(`messageList.loading`)}></alps-loader>`:(()=>{let e=this.getFilteredContacts();return s`
              ${this.filterQuery?s`
                <alps-banner>
                  <span>${this.i18nStore?.t(`messageList.searchResultsFor`)} <strong>${this.filterQuery}</strong></span>
                  <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`clear-search`))}>
                    ${this.i18nStore?.t(`messageList.clearSearch`)}
                  </alps-button>
                </alps-banner>
              `:``}
              
              ${e.length===0?s`<div class="empty-state">${this.i18nStore?.t(`contacts.noContacts`)}</div>`:e.map((e,t)=>s`
                  <div class="contact-item ${this.selectedContact?.path===e.path||e.isTemporary&&this.selectedContact?.isTemporary?`active`:``} ${this.selectedContacts.has(e.path)?`selected`:``} ${this.focusedIndex===t?`focused`:``}" @click=${()=>this.dispatchEvent(new CustomEvent(`select-contact`,{detail:{contact:e}}))}>
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
                            ${T(e.categories?.includes(`Favorites`)?`starFourFill`:`starFour`)}
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
    `}};E([g({context:S})],B.prototype,`i18nStore`,void 0),E([g({context:C})],B.prototype,`settingsStore`,void 0),E([o({type:Array})],B.prototype,`contacts`,void 0),E([o({type:String})],B.prototype,`selectedCategory`,void 0),E([o({type:String})],B.prototype,`filterQuery`,void 0),E([o({type:String})],B.prototype,`sortOrder`,void 0),E([o({type:Boolean})],B.prototype,`showOnlyStarred`,void 0),E([o({type:Boolean})],B.prototype,`isMobile`,void 0),E([o({type:String})],B.prototype,`densityMode`,void 0),E([o({type:Object})],B.prototype,`selectedContacts`,void 0),E([o({type:Object})],B.prototype,`selectedContact`,void 0),E([o({type:Boolean})],B.prototype,`isSpinning`,void 0),E([o({type:Boolean})],B.prototype,`loading`,void 0),E([o({type:Boolean})],B.prototype,`listScrolled`,void 0),E([a()],B.prototype,`focusedIndex`,void 0),B=E([m(`alps-contacts-list`)],B);var V=class extends d{constructor(...e){super(...e),this.mailboxes=[],this.currentMailbox=``,this.expandedFolders=new Set,this.layoutMode=`vertical`,this.syncing=!1,this.collapsed=!1,this.isScrolled=!1,this.showCreatePrompt=!1,this.showRenamePrompt=!1,this.mailboxToRename=``,this.showDeleteConfirm=!1,this.showMoveToTrashConfirm=!1,this.mailboxToDelete=``,this.parentForNewFolder=``,this.activeKebabMenu=null,this._handleStoreChange=()=>{this.requestUpdate()},this.handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0}}willUpdate(e){super.willUpdate(e)}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.composeStore&&this.composeStore.addEventListener(`change`,this._handleStoreChange),this.i18nStore&&this.i18nStore.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.composeStore&&this.composeStore.removeEventListener(`change`,this._handleStoreChange),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=[ct,$e,n`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
      box-sizing: border-box;
    }
    
    .sidebar-wrapper {
      background-color: var(--bg-secondary);
    }

    .sidebar-header {
      background-color: var(--bg-secondary);
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

    .sidebar-wrapper.collapsed .folder-item {
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

  `]}toggleFolder(e,t){e&&e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-folder`,{detail:{folderName:t}}))}selectMailbox(e){this.dispatchEvent(new CustomEvent(`select-mailbox`,{detail:{name:e}}))}triggerCreateFolder(){this.parentForNewFolder=``,this.showCreatePrompt=!0}handleCreateSubmit(e){let t=e.detail.name;if(t){if(this.parentForNewFolder){let e=this.mailboxes.find(e=>(e.Name||e.Mailbox)===this.parentForNewFolder),n=`.`;if(e){let t=e.Delimiter||e.Delim;n=typeof t==`number`?String.fromCharCode(t):t||`.`}t=`${this.parentForNewFolder}${n}${t}`,this.dispatchEvent(new CustomEvent(`expand-folder`,{detail:{folderName:this.parentForNewFolder}}))}tn.createMailbox(t)}this.showCreatePrompt=!1,this.parentForNewFolder=``}async handleRenameSubmit(e){let t=e.detail.name;if(t&&this.mailboxToRename){let e=this.mailboxToRename;this.showRenamePrompt=!1,this.mailboxToRename=``,await tn.renameMailbox(e,t)&&(this.currentMailbox===e&&this.selectMailbox(t),this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderRenamed`),actionLabel:this.i18nStore?.t(`toast.undo`),actionFn:async()=>{await tn.renameMailbox(t,e),this.currentMailbox===t&&this.selectMailbox(e)},duration:5e3},bubbles:!0,composed:!0})))}else this.showRenamePrompt=!1,this.mailboxToRename=``}async handleDeleteConfirm(){this.mailboxToDelete&&await tn.deleteMailbox(this.mailboxToDelete)&&(this.currentMailbox.startsWith(this.mailboxToDelete)&&this.selectMailbox(w),this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderPermanentlyDeleted`),duration:3e3},bubbles:!0,composed:!0}))),this.showDeleteConfirm=!1,this.mailboxToDelete=``}async handleMoveToTrashConfirm(){if(this.mailboxToDelete){let e=this.mailboxes.find(e=>(e.Name||e.Mailbox)===this.mailboxToDelete),t=`.`;if(e){let n=e.Delimiter||e.Delim;t=typeof n==`number`?String.fromCharCode(n):n||`.`}let n=this.mailboxToDelete.split(t),r=n[n.length-1],i=`Trash${t}${r}`;if(await tn.renameMailbox(this.mailboxToDelete,i)){this.currentMailbox.startsWith(this.mailboxToDelete)&&this.selectMailbox(w);let e=this.mailboxToDelete;this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderMovedToTrash`),actionLabel:this.i18nStore?.t(`toast.undo`),actionFn:async()=>{await tn.renameMailbox(i,e)},duration:5e3},bubbles:!0,composed:!0}))}}this.showMoveToTrashConfirm=!1,this.mailboxToDelete=``}render(){let e=[w,Re,ze,Be,Ve,He,Ue,We],t={[w]:{icon:`tray`,colorClass:`icon-inbox`,label:this.i18nStore?.t(`folderList.inbox`)},[Re]:{icon:`fileText`,colorClass:`icon-drafts`,label:this.i18nStore?.t(`folderList.drafts`)},[ze]:{icon:`paperPlaneTilt`,colorClass:`icon-sent`,label:this.i18nStore?.t(`folderList.sent`)},[Be]:{icon:`archiveBox`,colorClass:`icon-archive`,label:this.i18nStore?.t(`folderList.archive`)},[Ve]:{icon:`archiveBox`,colorClass:`icon-archive`,label:this.i18nStore?.t(`folderList.archive`)},[He]:{icon:`warningDiamond`,colorClass:`icon-spam`,label:this.i18nStore?.t(`folderList.spam`)},[Ue]:{icon:`warningDiamond`,colorClass:`icon-spam`,label:this.i18nStore?.t(`folderList.junk`)},[We]:{icon:`trash`,colorClass:`icon-trash`,label:this.i18nStore?.t(`folderList.trash`)}},n={};this.mailboxes.forEach(e=>{let t=e.Name||e.Mailbox||``,r=e.Delimiter||e.Delim,i=typeof r==`number`?String.fromCharCode(r):r||`.`,a=t.split(i),o=n,s=``;for(let t=0;t<a.length;t++){let n=a[t];s=t===0?n:s+i+n,o[n]||(o[n]={name:n,fullName:s,children:{}}),t===a.length-1&&(o[n].mb=e),o=o[n].children}});let r=[],i=[];Object.values(n).forEach(t=>{e.includes(t.name)?r.push(t):i.push(t)}),r.sort((t,n)=>e.indexOf(t.name)-e.indexOf(n.name)),i.sort((e,t)=>e.name.localeCompare(t.name));let a=(n,r=0)=>n.map(n=>{let i=Object.keys(n.children).length>0,o=this.expandedFolders.has(n.fullName),c=this.currentMailbox===n.fullName,l=T(`folder`),u=`icon-default`,d=n.name;r===0&&t[n.name]&&(l=T(t[n.name].icon),u=t[n.name].colorClass,d=t[n.name].label);let f=n.mb?.Unseen||0,p=(n.mb?.Attrs||[]).some(e=>typeof e==`string`&&e.toLowerCase()===`\\noselect`),m=e=>{p?i&&this.toggleFolder(e,n.fullName):this.selectMailbox(n.fullName)},h=r>0||!e.includes(n.name);return s`
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
                    ${T(`folderPlus`)} <span class="item-text">${this.i18nStore?.t(`folderList.createSubfolder`)}</span>
                  </button>
                  <button class="dropdown-item" @click=${e=>{let t=e.target.closest(`alps-popup`);t&&t.close(),this.mailboxToRename=n.fullName,this.showRenamePrompt=!0}}>
                    ${T(`pen`)} <span class="item-text">${this.i18nStore?.t(`folderList.rename`)}</span>
                  </button>
                  <button class="dropdown-item" @click=${e=>{let t=e.target.closest(`alps-popup`);t&&t.close(),n.mb?.Subscribed?tn.unsubscribeMailbox(n.fullName):tn.subscribeMailbox(n.fullName)}}>
                    ${T(n.mb?.Subscribed?`eyeSlash`:`eye`)} <span class="item-text">${n.mb?.Subscribed?`Unsubscribe`:`Subscribe`}</span>
                  </button>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item" @click=${e=>{let t=e.target.closest(`alps-popup`);t&&t.close(),this.mailboxToDelete=n.fullName,n.fullName.toLowerCase().startsWith(`trash`)?this.showDeleteConfirm=!0:this.showMoveToTrashConfirm=!0}}>
                    ${T(`trash`)} <span class="item-text">${this.i18nStore?.t(`folderList.delete`)}</span>
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
      <div class="sidebar-wrapper ${this.collapsed?`collapsed`:``}">
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
    `}};E([g({context:L})],V.prototype,`composeStore`,void 0),E([g({context:S})],V.prototype,`i18nStore`,void 0),E([o({type:Array})],V.prototype,`mailboxes`,void 0),E([o({type:String})],V.prototype,`currentMailbox`,void 0),E([o({type:Object})],V.prototype,`expandedFolders`,void 0),E([o({type:String})],V.prototype,`layoutMode`,void 0),E([o({type:Boolean})],V.prototype,`syncing`,void 0),E([o({type:Boolean,reflect:!0})],V.prototype,`collapsed`,void 0),E([a()],V.prototype,`isScrolled`,void 0),E([a()],V.prototype,`showCreatePrompt`,void 0),E([a()],V.prototype,`showRenamePrompt`,void 0),E([a()],V.prototype,`mailboxToRename`,void 0),E([a()],V.prototype,`showDeleteConfirm`,void 0),E([a()],V.prototype,`showMoveToTrashConfirm`,void 0),E([a()],V.prototype,`mailboxToDelete`,void 0),E([a()],V.prototype,`parentForNewFolder`,void 0),E([a()],V.prototype,`activeKebabMenu`,void 0),V=E([m(`alps-folder-list`)],V);var on=class extends d{constructor(...e){super(...e),this.name=``,this.address=``}static{this.styles=n`
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
      `}};E([g({context:L})],on.prototype,`composeStore`,void 0),E([o({type:String})],on.prototype,`name`,void 0),E([o({type:String})],on.prototype,`address`,void 0),on=E([m(`alps-recipient-pill`)],on);var sn=class extends d{constructor(...e){super(...e),this.attachment=null,this.downloadUrl=``,this.fallbackName=`Unknown attachment`,this.removable=!1,this.compact=!1}static{this.styles=n`
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
      <div class="attachment-icon">${T(`paperclipHorizontal`)}</div>
      <span class="attachment-name">${e}</span>
      <span class="attachment-size">${n?`${r}% of ${Ye(t)}`:Ye(t)}</span>
      ${this.removable?s`
        <button class="remove-btn" @click=${this._handleRemove} title="${this.i18nStore?.t(`attachment.remove`)}">
          ${T(`x`)}
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
      `}};E([g({context:S})],sn.prototype,`i18nStore`,void 0),E([o({type:Object})],sn.prototype,`attachment`,void 0),E([o({type:String})],sn.prototype,`downloadUrl`,void 0),E([o({type:String})],sn.prototype,`fallbackName`,void 0),E([o({type:Boolean})],sn.prototype,`removable`,void 0),E([o({type:Boolean,reflect:!0})],sn.prototype,`compact`,void 0),sn=E([m(`alps-attachment-pill`)],sn);var cn=class extends d{constructor(...e){super(...e),this.attachments=[],this.mailbox=w,this.messageUid=``,this.removable=!1,this.composerMode=!1,this.attachmentsExpanded=!0,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}toggleAttachments(){this.attachmentsExpanded=!this.attachmentsExpanded}_downloadAll(e){if(e.stopPropagation(),!this.attachments||this.attachments.length===0||!this.messageUid)return;let t=this.mailbox||`INBOX`;if(!this.mailbox){let e=window.location.hash.match(/^#\/mailbox\/([^/]+)/);e&&(t=decodeURIComponent(e[1]))}this.attachments.forEach((e,n)=>{let r=Array.isArray(e.Path)?e.Path.join(`.`):e.Path,i=`/mailboxes/${encodeURIComponent(t)}/messages/${this.messageUid}/raw?part=${r}`;setTimeout(()=>{let t=document.createElement(`a`);t.href=i,t.download=e.Filename||this.i18nStore?.t(`messageReader.unknownAttachment`)||`attachment`,document.body.appendChild(t),t.click(),document.body.removeChild(t)},n*200)})}static{this.styles=n`
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
                ${T(`downloadSimple`)}
              </div>
            `}
            <div class="icon caret">
              ${T(`caretDown`)}
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
    `}};E([g({context:S})],cn.prototype,`i18nStore`,void 0),E([o({type:Array})],cn.prototype,`attachments`,void 0),E([o({type:String})],cn.prototype,`mailbox`,void 0),E([o({type:String})],cn.prototype,`messageUid`,void 0),E([o({type:Boolean})],cn.prototype,`removable`,void 0),E([o({type:Boolean,reflect:!0})],cn.prototype,`composerMode`,void 0),E([a()],cn.prototype,`attachmentsExpanded`,void 0),cn=E([m(`alps-attachment-list`)],cn);var H=class extends d{constructor(...e){super(...e),this.mailboxes=[],this.currentMailbox=``,this.noActionBox=!1,this.noSearchBox=!1,this.filterQuery=``,this.isMove=!0}static{this.styles=n`
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
                ${T(`folder`)}
                <span class="folder-name">${e}</span>
              </button>
            `):s`
              <div class="no-results">${this.i18nStore?.t(`folderSelector.noResults`)}</div>
            `}
          </div>
        </div>
      </alps-popup>
    `}};E([g({context:S})],H.prototype,`i18nStore`,void 0),E([o({type:Array})],H.prototype,`mailboxes`,void 0),E([o({type:String})],H.prototype,`currentMailbox`,void 0),E([o({type:Boolean})],H.prototype,`noActionBox`,void 0),E([o({type:Boolean})],H.prototype,`noSearchBox`,void 0),E([a()],H.prototype,`filterQuery`,void 0),E([a()],H.prototype,`isMove`,void 0),E([v(`alps-popup`)],H.prototype,`popup`,void 0),E([v(`input`)],H.prototype,`filterInput`,void 0),H=E([m(`alps-folder-selector-popup`)],H);var ln=t(ee(),1);function un(e,t,n=``){if(!e)return null;let r=t.replace(/^<|>$/g,``);if(e.ID&&e.ID.replace(/^<|>$/g,``)===r)return n||`1`;if(e.Children&&Array.isArray(e.Children))for(let r=0;r<e.Children.length;r++){let i=n?`${n}.${r+1}`:`${r+1}`,a=un(e.Children[r],t,i);if(a)return a}return null}function dn(e,t){if(!e)return e;try{let n=ln.parse(e,{silent:!0});if(n&&n.stylesheet&&n.stylesheet.rules){let e=/url\(\s*(['"]?)(https?:\/\/[^'"\)]+)\1\s*\)/gi,r=n=>n.replace(e,(e,n,r)=>{if(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources){let e=n||`"`;return`url(${e}/proxy?url=${encodeURIComponent(r)}${e})`}else return`url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)`}),i=n=>{for(let a=n.length-1;a>=0;a--){let o=n[a];if([`rule`,`font-face`,`page`,`keyframe`].includes(o.type)&&!o.declarations&&(o.declarations=[]),[`rule`,`page`].includes(o.type)&&!o.selectors&&(o.selectors=[]),o.type===`keyframe`&&!o.values&&(o.values=[]),o.type===`import`){let e=o;if(e.import&&e.import.match(/https?:\/\//i))if(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources)e.import=e.import.replace(/(url\(\s*)?(['"]?)(https?:\/\/[^'"\)]+)\2(\s*\))?/i,(e,t,n,r,i)=>{let a=t||``,o=i||``,s=n||`"`;return`${a}${s}/proxy?url=${encodeURIComponent(r)}${s}${o}`});else{n.splice(a,1);continue}}else if(o.type===`font-face`){let r=o;if(r.declarations){let i=!1;for(let n of r.declarations)n.type===`declaration`&&n.value?.match(e)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),i=!0);if(i&&!t.allowRemoteResources){n.splice(a,1);continue}}}if(o.declarations)for(let t of o.declarations)t.type===`declaration`&&t.value&&t.value.match(e)&&(t.value=r(t.value));o.rules&&i(o.rules)}};return i(n.stylesheet.rules),ln.stringify(n)}}catch(e){console.warn(`AST CSS parsing failed, falling back to regex sanitizer`,e)}let n=e,r=/@import\s+(?:url\(\s*)?(['"]?)(https?:\/\/[^'"\)]+)\1\s*\)?\s*;?/gi,i=/url\(\s*(['"]?)(https?:\/\/[^'"\)]+)\1\s*\)/gi;return(n.match(r)||n.match(i))&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?(n=n.replace(r,(e,t,n)=>{let r=t||`"`;return`@import url(${r}/proxy?url=${encodeURIComponent(n)}${r});`}),n=n.replace(i,(e,t,n)=>`url(${t}/proxy?url=${encodeURIComponent(n)}${t})`)):(n=n.replace(r,``),n=n.replace(/@font-face\s*\{[^{}]*\}/gi,e=>/url\(\s*['"]?https?:\/\//i.test(e)?``:e),n=n.replace(i,`url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)`))),n}function fn(e,t){let n=new DOMParser().parseFromString(e,`text/html`),r=n.createElement(`base`);r.target=`_blank`,n.head.prepend(r);let i=n.createElement(`meta`);i.httpEquiv=`Content-Security-Policy`,i.content=`script-src 'none'; img-src ${window.location.origin} data: blob: cid:; media-src ${window.location.origin} data: blob: cid:;`,n.head.prepend(i);let a=n.createElement(`style`);a.textContent=`
    body { margin: 0; padding: 24px; box-sizing: border-box; font: 14px -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; overflow-x: hidden; word-wrap: break-word; background-color: #ffffff; color: #000000; }
    @media (max-width: 768px) { body { padding: 16px !important; } }
    html:not(.x), body:not(.x) { height: auto !important; }
    p:first-child { margin-top: 0; }
    p:last-child { margin-bottom: 0; }
    a[href] { color: #3781b8; text-decoration: none; }
    a[href]:hover { text-decoration: underline; }
    blockquote[type='cite'] { margin: 0 0 0 0.8ex; border-left: 1px #ccc solid; padding-left: 1ex; }
    img { max-width: 100%; height: auto; }
  `,n.head.prepend(a),n.querySelectorAll(`img`).forEach(e=>{let n=e.getAttribute(`src`);if(n)if(n.toLowerCase().startsWith(`cid:`)){let r=n.substring(4);if(t.messageStructure){let n=un(t.messageStructure,r);n&&(e.src=`/mailboxes/${encodeURIComponent(t.mailbox)}/messages/${t.messageUid}/raw?part=${n}`)}}else (n.toLowerCase().startsWith(`http://`)||n.toLowerCase().startsWith(`https://`))&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?e.src=`/proxy?url=${encodeURIComponent(n)}`:(e.setAttribute(`data-original-src`,n),e.src=`data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`,e.style.height=`0`,e.style.width=`0`))}),n.querySelectorAll(`link[rel="stylesheet"]`).forEach(e=>{let n=e.getAttribute(`href`);n&&(n.toLowerCase().startsWith(`http://`)||n.toLowerCase().startsWith(`https://`))&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?e.setAttribute(`href`,`/proxy?url=${encodeURIComponent(n)}`):e.remove())}),n.querySelectorAll(`style`).forEach(e=>{e.textContent&&=dn(e.textContent,t)});let o=/url\(\s*(['"]?)(https?:\/\/[^'"\)]+)\1\s*\)/gi;return n.querySelectorAll(`[style]`).forEach(e=>{let n=e.getAttribute(`style`);n&&n.match(o)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),n=t.allowRemoteResources?n.replace(o,(e,t,n)=>{let r=t||`"`;return`url(${r}/proxy?url=${encodeURIComponent(n)}${r})`}):n.replace(o,`url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)`),e.setAttribute(`style`,n))}),n.documentElement.outerHTML}function pn(e){return e?e.map(e=>e.Name?`${e.Name} <${e.Mailbox}@${e.Host}>`:`${e.Mailbox}@${e.Host}`):[]}function mn(e,t,n,r,i,a=`YYYY-MM-DD`,o=`12`){let s=t?.Envelope?.Subject||``,c=s;c=e===`forward`?c.toLowerCase().startsWith(`fwd:`)?c:`Fwd: ${c}`:c.toLowerCase().startsWith(`re:`)?c:`Re: ${c}`;let l=[],u=[];if(e===`reply`||e===`replyAll`){let n=t?.Envelope?.ReplyTo,r=t?.Envelope?.From;if(l=[...pn(n&&n.length>0?n:r)],e===`replyAll`){let e=pn(t?.Envelope?.To)||[],n=pn(t?.Envelope?.Cc)||[],r=new Set([...l,...e]);l=Array.from(r),u=[...n]}}let d=t?.Envelope?.Date?qe(t.Envelope.Date,a,o):``,f=t?.Envelope?.From?.[0],p=f?.Mailbox&&f?.Host?`${f.Mailbox}@${f.Host}`:``,m=f?.Name||p||`Unknown Sender`,h=`On ${d}, ${m} wrote:`;e===`forward`&&(h=`---------- Forwarded message ---------\nFrom: ${m} <${p}>\nDate: ${d}\nSubject: ${s}\nTo: ${pn(t?.Envelope?.To).join(`, `)}\n`);let g=`\n\n${h}\n`+n.split(`
`).map(e=>`> ${e}`).join(`
`),_=``;return _=i&&r?e===`forward`?`<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>From: ${m} &lt;${p}&gt;<br>Date: ${d}<br>Subject: ${s}<br>To: ${pn(t?.Envelope?.To).join(`, `)}<br></div><br>${r}</div>`:`<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">On ${d}, ${m} wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${r}</blockquote></div>`:`<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">${h.replace(/\n/g,`<br>`)}<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${n.replace(/\n/g,`<br>`)}</blockquote></div>`,{subject:c,to:l,cc:u,quotedText:g,quotedHtml:_}}function hn(e,t){if(!e.contentDocument||!e.contentDocument.body)return;let n=e.contentDocument.getElementById(`dark-mode-override`);if(n&&n.remove(),t&&document.body.classList.contains(`theme-dark`)){let t=window.getComputedStyle(document.documentElement).getPropertyValue(`--bg-primary`).trim()||`#1f2937`,n=window.getComputedStyle(document.documentElement).getPropertyValue(`--text-primary`).trim()||`#f9fafb`,r=window.getComputedStyle(document.documentElement).getPropertyValue(`--accent-color`).trim()||`#3b82f6`,i=window.getComputedStyle(document.documentElement).getPropertyValue(`--border-color`).trim()||`#374151`,a=e.contentDocument.createElement(`style`);a.id=`dark-mode-override`,a.textContent=`
      html {
        color-scheme: dark !important;
      }
      body {
        background-color: ${t} !important;
        color: ${n} !important;
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
        color: ${r} !important;
      }
      /* Ensure list elements are clean and transparent */
      ul, ol, li {
        background-color: transparent !important;
        color: inherit !important;
      }
      /* Style horizontal rules/lines */
      hr {
        border-color: ${i} !important;
      }
    `,e.contentDocument.head.appendChild(a)}}function gn(e,t){if(!e.contentDocument||!e.contentDocument.body)return;e.style.height=`0px`,e.style.width=`100%`,e.contentDocument.addEventListener(`dragover`,e=>e.preventDefault()),e.contentDocument.addEventListener(`drop`,e=>e.preventDefault()),hn(e,t),e._ro&&e._ro.disconnect();let n=0,r=new ResizeObserver(t=>{let r=0,i=0;for(let a of t)a.target===e.parentElement?n=a.contentRect.width:e.contentDocument&&a.target===e.contentDocument.body&&(a.borderBoxSize&&a.borderBoxSize.length>0?(r=a.borderBoxSize[0].blockSize,i=a.borderBoxSize[0].inlineSize):(r=a.contentRect.height+48,i=a.contentRect.width+48));if(r>0){let t=parseFloat(e.style.height)||0;Math.abs(t-r)>2&&(e.style.height=`${Math.ceil(r)}px`)}if(n>0&&i>n){let t=parseFloat(e.style.width)||0;Math.abs(t-i)>2&&(e.style.width=`${Math.ceil(i)}px`)}});r.observe(e.contentDocument.body),e.parentElement&&r.observe(e.parentElement),e._ro=r}function _n(e,t,n,r){if(!e)return n||r;let i=e;if(t?.toLowerCase()===`text/html`||e.trim().startsWith(`<`)||/<\/[a-zA-Z]+>/.test(e)||/<[a-zA-Z]+[^>]*>/.test(e))try{let t=new DOMParser().parseFromString(e,`text/html`);t.querySelectorAll(`style, script, head`).forEach(e=>e.remove());let n=e=>{if(e.nodeType===Node.TEXT_NODE)return e.textContent||``;if(e.nodeType===Node.ELEMENT_NODE){let t=e,r=t.tagName.toLowerCase();if(r===`br`)return` `;let i=``;for(let e=0;e<t.childNodes.length;e++)i+=n(t.childNodes[e]);return[`p`,`div`,`td`,`tr`,`th`,`li`,`h1`,`h2`,`h3`,`h4`,`h5`,`h6`,`section`,`article`,`blockquote`,`ol`,`ul`,`header`,`footer`].includes(r)?` `+i+` `:i}return``};i=n(t.body||t)}catch{i=e.replace(/<[^>]*>/g,` `)}else i=e.replace(/[\r\n\t]+/g,` `);let a=i.replace(/\s+/g,` `).trim();if(a){let e=a.substring(0,100);return a.length>100?e+`...`:e}else if(n)return n.replace(/[\r\n\t\s]+/g,` `).trim();else return r}var vn=class extends d{static{this.styles=n`
    :host {
      display: block;
    }

    .thread-card {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-primary, #fff);
      overflow: hidden;
      transition: box-shadow 0.2s ease;
    }

    .thread-card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .thread-card.expanded {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .thread-card-header {
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
      background: var(--bg-primary, #fff);
      transition: background-color 0.2s ease;
    }

    .thread-card-header:hover {
      background: var(--bg-secondary, #fafafa);
    }

    .thread-card.expanded .thread-card-header {
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-primary, #fff);
    }

    .thread-card-summary {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .thread-card-sender {
      font-weight: 600;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    .thread-card-snippet {
      font-size: 13px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .thread-card-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .thread-card-date {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .thread-card-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--bg-secondary, #e5e7eb);
      color: var(--text-color, #374151);
      font-weight: 500;
      border: 1px solid var(--border-color);
    }

    .thread-card-body {
      padding: 0;
    }

    .thread-card .reader-meta {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-primary, #fff);
    }

    .thread-card alps-attachment-list {
      width: auto !important;
      display: block;
      margin: 0;
    }

    .thread-card alps-banner {
      width: auto !important;
      display: block;
    }

    .thread-card.unread {
      border-color: rgba(234, 179, 8, 0.4) !important;
      background: var(--bg-unread, rgba(234, 179, 8, 0.08));
    }

    .thread-card.unread .thread-card-header {
      background: var(--bg-unread, rgba(234, 179, 8, 0.08)) !important;
    }

    .thread-card.unread .thread-card-header:hover {
      background: var(--bg-unread-hover, rgba(234, 179, 8, 0.12)) !important;
    }

    .thread-card-sender.unread {
      font-weight: 700;
    }

    .reader-recipients-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .reader-recipients {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .reader-recipients-label {
      color: var(--text-muted);
      width: 48px;
      flex-shrink: 0;
    }

    .reader-recipients-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    .undisclosed-recipients {
      color: var(--text-muted);
      font-style: italic;
    }

    .message-content {
      position: relative;
    }

    .reader-content-wrapper {
      position: relative;
    }

    .reader-iframe {
      width: 100%;
      border: none;
      display: block;
      transition: height 0.1s ease;
      background: transparent;
    }

    .reader-empty-body {
      padding: 32px;
      text-align: center;
      color: var(--text-muted);
      font-style: italic;
      border: 1px dashed var(--border-color);
      border-radius: 8px;
    }

    .reader-text-wrapper {
      border: none;
      border-radius: 0;
      padding: 16px;
      background: transparent;
      overflow-x: auto;
    }

    .reader-preformatted {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-primary);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 8px 16px;
      border: none;
      background: transparent;
      font-size: 14px;
      text-align: left;
      cursor: pointer;
      color: var(--text-primary);
      transition: background-color 0.15s ease;
      box-sizing: border-box;
      gap: 12px;
    }

    .dropdown-item:hover {
      background-color: var(--bg-secondary);
    }

    .dropdown-item .icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: var(--text-muted);
    }

    .dropdown-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 4px 0;
    }
  `}onIframeLoad(e){let t=e.target;gn(t,this.settingsStore?.getState()?.themeIframeContent??!1)}handleCardHeaderClick(){this.dispatchEvent(new CustomEvent(`toggle-expansion`,{detail:{item:this.item},bubbles:!0,composed:!0}))}_closePopup(){let e=this.shadowRoot?.querySelectorAll(`alps-popup`);e&&e.forEach(e=>e.close())}handleStarClick(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-star`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleActionForItem(e){this._closePopup(),this.dispatchEvent(new CustomEvent(`action-for-item`,{detail:{action:e,item:this.item},bubbles:!0,composed:!0}))}handleDeleteItem(){this._closePopup(),this.dispatchEvent(new CustomEvent(`delete-item`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleLoadRemoteResources(){this.dispatchEvent(new CustomEvent(`load-remote-resources`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleEditDraftClick(){this.dispatchEvent(new CustomEvent(`edit-draft-for-item`,{detail:{item:this.item},bubbles:!0,composed:!0}))}renderItemContent(){if(this.item.loading)return s`
        <div style="padding: 16px; display: flex; justify-content: center; align-items: center;">
          <alps-loader></alps-loader>
        </div>
      `;let e=this.item.message||{};return s`
      <div class="reader-meta">
        <div class="reader-recipients-block">
          <div class="reader-recipients">
            <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.to`)}</span>
            <div class="reader-recipients-list">
              ${e.Envelope?.To&&e.Envelope.To.length>0?e.Envelope.To.map(e=>e.Mailbox&&e.Host?s`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``):s`<span class="undisclosed-recipients">${e.Flags?.includes(`\\Draft`)?this.i18nStore?.t(`messageReader.noRecipients`):this.i18nStore?.t(`messageReader.undisclosed`)}</span>`}
            </div>
          </div>
          ${e.Envelope?.Cc&&e.Envelope.Cc.length>0?s`
            <div class="reader-recipients">
              <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.cc`)}</span>
              <div class="reader-recipients-list">
                ${e.Envelope.Cc.map(e=>e.Mailbox&&e.Host?s`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``)}
              </div>
            </div>
          `:``}
        </div>
      </div>

      ${this.item.attachments&&this.item.attachments.length>0?s`
        <alps-attachment-list
          .attachments=${this.item.attachments}
          .mailbox=${this.item.mailbox}
          .messageUid=${e.UID}
        ></alps-attachment-list>
      `:``}

      <div class="message-content">
        ${this.item.activeBanners&&this.item.activeBanners.length>0?s`
          ${this.item.activeBanners.map(e=>e)}
        `:``}
        ${this.item.hasRemoteResources&&!this.item.allowRemoteResources?s`
          <alps-banner style="margin-bottom: 12px;">
            <span>${this.i18nStore?.t(`messageReader.remoteContentWarning`)}</span>
            <alps-button slot="action" variant="normal" @click=${this.handleLoadRemoteResources}>${this.i18nStore?.t(`messageReader.loadRemoteContent`)}</alps-button>
          </alps-banner>
        `:``}
        ${e.Flags?.includes(`\\Draft`)?s`
          <alps-banner style="margin-bottom: 12px;">
            <span>${this.i18nStore?.t(`messageReader.isDraft`)}</span>
            <alps-button slot="action" variant="normal" @click=${this.handleEditDraftClick}>${this.i18nStore?.t(`messageReader.editDraft`)}</alps-button>
          </alps-banner>
        `:``}
        
        <div class="reader-content-wrapper">
          ${this.item.mimeType?.toLowerCase()===`text/html`?s`
            <iframe 
              class="reader-iframe"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              .srcdoc=${l(this.item.content)}
              @load=${this.onIframeLoad}
            ></iframe>
          `:this.item.mimeType?.toLowerCase().startsWith(`multipart/`)?s`
            <div class="reader-empty-body">
              ${this.i18nStore?.t(`messageReader.noReadableText`)}
            </div>
          `:s`
            <div class="reader-text-wrapper">
              <pre class="reader-preformatted">${this.item.content}</pre>
            </div>
          `}
        </div>
      </div>
    `}render(){let e=this.item.message||{},t=e.Envelope?.From?.[0]||{},n=t.Mailbox&&t.Host?`${t.Mailbox}@${t.Host}`:``,r=t.Name||n||this.i18nStore?.t(`messageList.unknownSender`),i=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,a=String(this.settingsStore?.getState()?.hourFormat||`12`),o=e.Envelope?.Date?qe(e.Envelope.Date,i,a):``,c=Ze(t.Host?t.Host.toLowerCase():``),l=e.Flags?.includes(F),u=!e.Flags?.includes(P),d=e.Snippet||``,f=this.i18nStore?.t(`messageReader.clickToExpand`)||`Click to expand message content`,p=this.item.expanded?``:_n(this.item.content,this.item.mimeType,d,f);return s`
      <div class="thread-card ${this.item.expanded?`expanded`:``} ${u?`unread`:``}">
        <div class="thread-card-header" @click=${this.handleCardHeaderClick}>
          <div class="thread-card-summary">
            <alps-avatar .name=${r} .email=${n} .size=${28} .src=${c}></alps-avatar>
            <div class="thread-card-sender ${u?`unread`:``}">${r}</div>
            ${this.item.expanded?``:s`<div class="thread-card-snippet">${p}</div>`}
          </div>
          <div class="thread-card-meta">
            ${this.item.isSent?s`<span class="thread-card-badge">${this.i18nStore?.t(`folderList.sent`)||`Sent`}</span>`:``}
            ${this.item.mailbox!==this.mailbox&&!this.item.isSent?s`<span class="thread-card-badge">${this.item.mailbox}</span>`:``}
            <div class="thread-card-date">${o}</div>
            
            <alps-icon-btn
              style="--icon-size: 16px; --btn-padding: 4px;"
              title=${this.i18nStore?.t(`messageReader.star`)||`Star`}
              ?active=${l}
              @click=${this.handleStarClick}
              icon=${l?`starFourFill`:`starFour`}
            ></alps-icon-btn>
            
            ${this.item.expanded?s`
              <alps-icon-btn
                style="--icon-size: 16px; --btn-padding: 4px;"
                title=${this.i18nStore?.t(`messageReader.reply`)||`Reply`}
                @click=${e=>{e.stopPropagation(),this.handleActionForItem(`reply`)}}
                icon="arrowBendUpLeft"
              ></alps-icon-btn>
              
              <alps-popup align="right" class="card-more-menu" @click=${e=>e.stopPropagation()}>
                <alps-icon-btn
                  slot="trigger"
                  style="--icon-size: 16px; --btn-padding: 4px;"
                  title=${this.i18nStore?.t(`messageReader.moreOptions`)}
                  icon="dotsThreeVertical"
                ></alps-icon-btn>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`reply`)}>
                  ${T(`arrowBendUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reply`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`replyAll`)}>
                  ${T(`arrowBendDoubleUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.replyAll`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`forward`)}>
                  ${T(`arrowBendUpRight`)} <span class="item-text">${this.i18nStore?.t(`messageReader.forward`)}</span>
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`print`)}>
                  ${T(`printer`)} <span class="item-text">${this.i18nStore?.t(`messageReader.print`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleDeleteItem()}>
                  ${T(`trash`)} <span class="item-text">${this.i18nStore?.t(`messageReader.delete`)}</span>
                </button>
              </alps-popup>
            `:``}
            
            <alps-icon-btn
              style="--icon-size: 16px; --btn-padding: 4px;"
              icon=${this.item.expanded?`caretUp`:`caretDown`}
              title=${this.item.expanded?`Collapse`:`Expand`}
            ></alps-icon-btn>
          </div>
        </div>
        
        ${this.item.expanded?s`
          <div class="thread-card-body">
            ${this.renderItemContent()}
          </div>
        `:``}
      </div>
    `}};E([g({context:C})],vn.prototype,`settingsStore`,void 0),E([g({context:S})],vn.prototype,`i18nStore`,void 0),E([g({context:L})],vn.prototype,`composeStore`,void 0),E([o({type:Object})],vn.prototype,`item`,void 0),E([o({type:String})],vn.prototype,`mailbox`,void 0),vn=E([m(`alps-thread-card`)],vn);var U=class extends d{constructor(...e){super(...e),this.localPreferredView=null,this.hasHtml=!1,this.hasText=!1,this.mailbox=w,this.message=null,this.messages=[],this.selectedUids=new Set,this.allSelectedStarred=!1,this.allSelectedUnread=!1,this.commonTags=[],this.bulkProcessing=!1,this.layoutMode=`vertical`,this.mailboxes=[],this.content=``,this.mimeType=``,this.loading=!1,this.activeBanners=[],this.attachments=[],this.allowRemoteResources=!1,this.hasRemoteResources=!1,this.rawMessageHtml=``,this.isScrolled=!1,this.threadItems=[],this._isThread=!1,this._deferPropertySync=!1,this._handleExternalFlagsChanged=e=>{let t=e;if(!t.detail)return;let{uids:n,flag:r,action:i}=t.detail;if(!this.threadItems||this.threadItems.length===0)return;let a=!1;for(let e=0;e<this.threadItems.length;e++){let t=this.threadItems[e];if(t.message&&n.includes(String(t.message.UID))){let n=t.message.Flags||[],o=n.includes(r);i===`add`&&!o?(this.threadItems[e]={...t,message:{...t.message,Flags:[...n,r]}},a=!0):i===`remove`&&o&&(this.threadItems[e]={...t,message:{...t.message,Flags:n.filter(e=>e!==r)}},a=!0)}}if(a&&(this.threadItems=[...this.threadItems],this.requestUpdate(),this.message&&n.includes(String(this.message.UID)))){let e=this.message.Flags?.includes(r);i===`add`&&!e?this.message.Flags=[...this.message.Flags||[],r]:i===`remove`&&e&&(this.message.Flags=this.message.Flags.filter(e=>e!==r)),this.message={...this.message}}},this._handleSettingsChange=()=>{this.applyThemeToAllIframes()},this.handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0}}_closePopup(){let e=this.shadowRoot?.querySelectorAll(`alps-popup`);e&&e.forEach(e=>e.close())}async _handleAction(e,t){if(e===`reply`||e===`replyAll`||e===`forward`){if(!this.message)return;this._closePopup();let t=``;if(this.mimeType===`text/plain`)t=this.content;else{try{let e=await j(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.message.UID}?view=text`);if(e.ok){let n=await e.json();n.Part&&n.RawText&&(t=n.RawText)}}catch(e){b.error(`Failed to fetch text body for quote`,e)}if(!t&&this.rawMessageHtml){let e=document.createElement(`div`);e.innerHTML=this.rawMessageHtml,t=e.innerText||``}}let n=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,r=String(this.settingsStore?.getState()?.hourFormat||`12`),{subject:i,to:a,cc:o,quotedText:s,quotedHtml:c}=mn(e,this.message,t,this.rawMessageHtml,this.hasHtml,n,r),l=e===`forward`?this.attachments.map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})):[],u=e===`reply`||e===`replyAll`?this.message.Envelope?.MessageID||this.message.Envelope?.MessageId:void 0;this.composeStore.openComposer({subject:i,to:a,cc:o,text:s,html:c,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:l,inReplyTo:u});return}if(e===`showPlaintext`){this.localPreferredView=`text`,this.message&&this.fetchMessageBody(this.message),this._closePopup();return}if(e===`showHtml`){this.localPreferredView=`html`,this.message&&this.fetchMessageBody(this.message),this._closePopup();return}if(e===`print`){let e=this.allowRemoteResources?`&remote=1`:``;window.open(`#/print?mailbox=`+encodeURIComponent(this.mailbox)+`&uid=`+this.message.UID+e,`_blank`),this._closePopup();return}this._closePopup(),this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,folder:t}}))}_handleTag(e){this._closePopup();let t=this.selectedUids.size>1&&!this.message?this.commonTags?.some(t=>t.toLowerCase()===e.toLowerCase()):this.message?.Flags?.some(t=>t.toLowerCase()===e.toLowerCase());this.dispatchEvent(new CustomEvent(`action`,{detail:{action:t?`removeTag`:`addTag`,folder:e}}))}_handleRemoveAllTags(){this._closePopup(),this.dispatchEvent(new CustomEvent(`action`,{detail:{action:`removeTag`,tags:[`$label1`,`$label2`,`$label3`,`$label4`,`$label5`]}}))}connectedCallback(){super.connectedCallback(),window.addEventListener(`external-message-flags-changed`,this._handleExternalFlagsChanged),this.updateComplete.then(()=>{this.settingsStore?.addEventListener(`change`,this._handleSettingsChange)})}disconnectedCallback(){this.settingsStore?.removeEventListener(`change`,this._handleSettingsChange),window.removeEventListener(`external-message-flags-changed`,this._handleExternalFlagsChanged),super.disconnectedCallback()}static{this.styles=[ct,n`
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

    .tag-pills {
      float: right;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-left: 12px;
      margin-bottom: 4px;
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
      flex: 1;
      min-width: 0;
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

    .thread-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }

    .reader-header.thread-header-grouped {
      border-bottom: none;
      padding-bottom: 0;
    }
  `]}willUpdate(e){let t=e.has(`message`),n=e.has(`mailbox`),r=e.has(`messages`);if(t||n){let t=e.get(`message`),n=e.has(`mailbox`)?e.get(`mailbox`):this.mailbox;this.message?!t||t.UID!==this.message.UID||n!==this.mailbox?(this.localPreferredView=null,this.fetchMessageBody(this.message,this.message._isAutosaveUpdate)):(this.resolveThread(this.message),this.message._isAutosaveUpdate&&t&&this.message!==t&&this.fetchMessageBody(this.message,!0)):(this.localPreferredView=null,this.content=``,this.mimeType=``,this.rawMessageHtml=``,this.loading=!1,this.allowRemoteResources=!1,this.hasRemoteResources=!1,this.hasHtml=!1,this.hasText=!1,this.activeBanners=[],this.threadItems=[])}else r&&this.message&&this.resolveThread(this.message)}loadRemoteResources(){this.allowRemoteResources=!0,this.rawMessageHtml&&(this.content=fn(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.message?.UID,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message?.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}}))}resolveThread(e){if(!e)return;let t=this.settingsStore?.getState()?.enableThreading??!0,n=[],r=null;if(t&&this.messages&&this.messages.length>0){let t=this.messages.find(t=>String(t.UID)===String(e.UID));if(t)r=t;else for(let t of this.messages)if(t.SubMessages&&t.SubMessages.find(t=>String(t.UID)===String(e.UID))){r=t;break}}r?(n=[r,...r.SubMessages||[]],n.sort((e,t)=>(e.Envelope?.Date?new Date(e.Envelope.Date).getTime():0)-(t.Envelope?.Date?new Date(t.Envelope.Date).getTime():0))):n=[e],this._isThread=t&&n.length>1;let i=this.getSentMailboxName(),a=this.threadItems||[];this.threadItems=n.map(t=>{let n=String(t.UID)===String(e.UID),r=a.find(e=>String(e.message?.UID)===String(t.UID));return r?{...r,message:{...t,Flags:t.Flags||r.message.Flags||[]}}:{message:t,content:``,mimeType:``,loading:!1,attachments:[],rawMessageHtml:``,hasHtml:!1,hasText:!1,activeBanners:[],allowRemoteResources:this.allowRemoteResources,hasRemoteResources:!1,isSent:(this.mailbox||``).toLowerCase()===i.toLowerCase()||(t.Mailbox||``).toLowerCase()===i.toLowerCase(),mailbox:t.Mailbox||this.mailbox,expanded:n}})}async fetchMessageBody(e,t=!1){t||(this.content=``,this.mimeType=``,this.rawMessageHtml=``,this.loading=!0,this.activeBanners=[],this.allowRemoteResources=this.settingsStore?.getState().showRemoteContent===`always`,this.hasRemoteResources=!1,this.threadItems=[]),this.resolveThread(e);let n=this.threadItems.find(t=>String(t.message?.UID)===String(e.UID))||this.threadItems[0];n&&(n.loading=!t,n.expanded=!0,this._deferPropertySync=!1,this.fetchItemBody(n).then(()=>{this.message?.UID!==e.UID||this.mailbox!==e.Mailbox||this.requestUpdate()}))}updateThreadItemReference(e){if(!e.message)return;let t=this.threadItems.findIndex(t=>String(t.message?.UID)===String(e.message?.UID));t!==-1&&(this.threadItems[t]={...e},this.threadItems=[...this.threadItems])}async fetchItemBody(e){if(!e.message)return;let t=e.message,n=e.mailbox,r=this.localPreferredView||this.settingsStore?.getState()?.preferredView||`html`;try{let i=At.get(n,t.UID.toString(),r);if(i){if(e.attachments=i.Attachments||[],e.hasHtml=i.HasHTML||!1,e.hasText=i.HasText||!1,i.Message&&(e.message={...t,...i.Message}),i.Part)if(e.mimeType=i.Part.MIMEType||i.Part.MimeType||`text/plain`,i.RawHtml===void 0){if(i.RawText!==void 0){e.content=i.RawText;let t={content:e.content,isHtml:!1,message:e.message,banners:[],i18nStore:this.i18nStore},r=await y.invokeHookAsync(`reader:content`,t);for(let t of r)t&&typeof t==`string`&&(e.content=t);e.activeBanners=t.banners||[],t.isHtml&&(e.mimeType=`text/html`,e.hasHtml=!0,e.content=fn(e.content,{mailbox:n,messageUid:e.message?.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:e.message?.BodyStructure,onRemoteResourceBlocked:()=>{e.hasRemoteResources=!0,String(e.message.UID)===String(this.message?.UID)&&(this.hasRemoteResources=!0)}}))}}else{e.rawMessageHtml=i.RawHtml;let t={content:e.rawMessageHtml,isHtml:!0,message:e.message,banners:[],i18nStore:this.i18nStore},r=await y.invokeHookAsync(`reader:content`,t);for(let t of r)t&&typeof t==`string`&&(e.rawMessageHtml=t);e.activeBanners=t.banners||[],e.content=fn(e.rawMessageHtml,{mailbox:n,messageUid:e.message?.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:e.message?.BodyStructure,onRemoteResourceBlocked:()=>{e.hasRemoteResources=!0,String(e.message.UID)===String(this.message?.UID)&&(this.hasRemoteResources=!0)}})}e.loading=!1,!this._deferPropertySync&&String(e.message.UID)===String(this.message?.UID)&&(this.content=e.content,this.mimeType=e.mimeType,this.rawMessageHtml=e.rawMessageHtml,this.attachments=e.attachments,this.hasHtml=e.hasHtml,this.hasText=e.hasText,this.activeBanners=e.activeBanners,this.allowRemoteResources=e.allowRemoteResources,this.hasRemoteResources=e.hasRemoteResources,this.loading=!1),this.updateThreadItemReference(e);return}let a=await j(`/mailboxes/${encodeURIComponent(n)}/messages/${t.UID}?view=${r}`);if(a.status===401){window.location.hash=`/login`;return}if(!a.ok)throw Error(`Failed to fetch metadata`);let o=await a.json();e.attachments=o.Attachments||[],e.hasHtml=!!o.HasHTML,e.hasText=!!o.HasText,o.Message&&(e.message={...e.message,...o.Message});let s,c,l=o.Part;if(l){e.mimeType=l.MIMEType||l.MimeType||`text/plain`;let r=Array.isArray(l.Path)?l.Path.join(`.`):l.Path,i=await j(`/mailboxes/${encodeURIComponent(n)}/messages/${t.UID}/raw?part=${r}`);if(i.status===401){window.location.hash=`/login`;return}if(i.ok)if(e.mimeType.toLowerCase()===`text/html`){s=await i.text(),e.rawMessageHtml=s;let t={content:e.rawMessageHtml,isHtml:!0,message:e.message,banners:[],i18nStore:this.i18nStore},r=await y.invokeHookAsync(`reader:content`,t);for(let t of r)t&&typeof t==`string`&&(e.rawMessageHtml=t);e.activeBanners=t.banners||[],e.content=fn(e.rawMessageHtml,{mailbox:n,messageUid:e.message?.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:e.message?.BodyStructure,onRemoteResourceBlocked:()=>{e.hasRemoteResources=!0,String(e.message.UID)===String(this.message?.UID)&&(this.hasRemoteResources=!0)}})}else{c=await i.text(),e.content=c;let t={content:e.content,isHtml:!1,message:e.message,banners:[],i18nStore:this.i18nStore},r=await y.invokeHookAsync(`reader:content`,t);for(let t of r)t&&typeof t==`string`&&(e.content=t);e.activeBanners=t.banners||[],t.isHtml&&(e.mimeType=`text/html`,e.hasHtml=!0,e.content=fn(e.content,{mailbox:n,messageUid:e.message?.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:e.message?.BodyStructure,onRemoteResourceBlocked:()=>{e.hasRemoteResources=!0,String(e.message.UID)===String(this.message?.UID)&&(this.hasRemoteResources=!0)}}))}}At.set(n,t.UID.toString(),r,{Message:o.Message,Part:o.Part,Attachments:o.Attachments,RawHtml:s,RawText:c,HasHTML:e.hasHtml,HasText:e.hasText})}catch(t){b.error(`Failed to fetch message:`,t),e.content=`Error loading message.`}finally{e.loading=!1,!this._deferPropertySync&&String(e.message.UID)===String(this.message?.UID)&&(this.content=e.content,this.mimeType=e.mimeType,this.rawMessageHtml=e.rawMessageHtml,this.attachments=e.attachments,this.hasHtml=e.hasHtml,this.hasText=e.hasText,this.activeBanners=e.activeBanners,this.allowRemoteResources=e.allowRemoteResources,this.hasRemoteResources=e.hasRemoteResources,this.loading=!1),this.updateThreadItemReference(e)}}getSentMailboxName(){if(this.mailboxes&&Array.isArray(this.mailboxes)){for(let e of this.mailboxes){let t=e.Name||e.Mailbox;if(t&&(e.Attrs||[]).some(e=>typeof e==`string`&&(e.toLowerCase()===`\\sent`||e.toLowerCase()===`\\\\sent`)))return t}let e=[`sent`,`sent messages`,`sent items`,`sent-mail`];for(let t of this.mailboxes){let n=t.Name||t.Mailbox;if(n&&e.includes(n.toLowerCase()))return n}}return ze}async toggleItemExpansion(e){e.expanded=!e.expanded,this.updateThreadItemReference(e),e.expanded&&!e.content&&!e.loading&&(e.loading=!0,this.updateThreadItemReference(e),await this.fetchItemBody(e))}loadRemoteResourcesForItem(e){e.allowRemoteResources=!0,e.rawMessageHtml&&(e.content=fn(e.rawMessageHtml,{mailbox:e.mailbox,messageUid:e.message?.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:e.message?.BodyStructure,onRemoteResourceBlocked:()=>{e.hasRemoteResources=!0}}),e===this.threadItems[0]&&(this.content=e.content,this.allowRemoteResources=!0),this.updateThreadItemReference(e))}async toggleItemStar(e){if(!e.message)return;let t=e.message.Flags?.includes(F),n=t?`remove`:`add`;t?e.message.Flags=e.message.Flags.filter(e=>e!==F):e.message.Flags=[...e.message.Flags||[],F],this.updateThreadItemReference(e),this.dispatchEvent(new CustomEvent(`message-flags-changed`,{detail:{uid:String(e.message.UID),flag:F,action:n},bubbles:!0,composed:!0}));try{await I.setFlag(e.mailbox,[String(e.message.UID)],[`\\Flagged`],n)?String(e.message.UID)===String(this.message?.UID)&&(this.message.Flags=e.message.Flags,this.requestUpdate()):(t?e.message.Flags=[...e.message.Flags||[],F]:e.message.Flags=e.message.Flags.filter(e=>e!==F),this.updateThreadItemReference(e),this.dispatchEvent(new CustomEvent(`message-flags-changed`,{detail:{uid:String(e.message.UID),flag:F,action:t?`add`:`remove`},bubbles:!0,composed:!0})))}catch(n){b.error(`Failed to toggle star for thread item`,n),t?e.message.Flags=[...e.message.Flags||[],F]:e.message.Flags=e.message.Flags.filter(e=>e!==F),this.updateThreadItemReference(e),this.dispatchEvent(new CustomEvent(`message-flags-changed`,{detail:{uid:String(e.message.UID),flag:F,action:t?`add`:`remove`},bubbles:!0,composed:!0}))}}async deleteItem(e){if(e.message&&confirm(this.i18nStore?.t(`messageReader.deleteConfirmSingle`)||`Are you sure you want to permanently delete this message?`))try{if(await I.deleteMessages(e.mailbox,[String(e.message.UID)])){let t=String(e.message.UID),n=this.threadItems.length>0&&String(this.threadItems[0].message?.UID)===t;this.threadItems=this.threadItems.filter(e=>String(e.message?.UID)!==t),this.requestUpdate(),n&&this.dispatchEvent(new CustomEvent(`action`,{detail:{action:`delete`}}))}}catch(e){b.error(`Failed to delete thread item`,e)}}async _handleActionForItem(e,t){if(e===`reply`||e===`replyAll`||e===`forward`){let n=``;if(t.mimeType===`text/plain`)n=t.content;else{try{let e=await j(`/mailboxes/${encodeURIComponent(t.mailbox)}/messages/${t.message.UID}?view=text`);if(e.ok){let t=await e.json();t.Part&&t.RawText&&(n=t.RawText)}}catch(e){b.error(`Failed to fetch text body for quote`,e)}if(!n&&t.rawMessageHtml){let e=document.createElement(`div`);e.innerHTML=t.rawMessageHtml,n=e.innerText||``}}let r=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,i=String(this.settingsStore?.getState()?.hourFormat||`12`),{subject:a,to:o,cc:s,quotedText:c,quotedHtml:l}=mn(e,t.message,n,t.rawMessageHtml,t.hasHtml,r,i),u=e===`forward`?t.attachments.map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})):[],d=e===`reply`||e===`replyAll`?t.message.Envelope?.MessageID||t.message.Envelope?.MessageId:void 0;this.composeStore.openComposer({subject:a,to:o,cc:s,text:c,html:l,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:u,inReplyTo:d});return}if(e===`showPlaintext`){this.localPreferredView=`text`,this.fetchItemBody(t);return}if(e===`showHtml`){this.localPreferredView=`html`,this.fetchItemBody(t);return}if(e===`print`){let e=t.allowRemoteResources?`&remote=1`:``;window.open(`#/print?mailbox=`+encodeURIComponent(t.mailbox)+`&uid=`+t.message.UID+e,`_blank`);return}}applyThemeToIframe(e){hn(e,this.settingsStore?.getState()?.themeIframeContent??!1)}applyThemeToAllIframes(){let e=this.shadowRoot?.querySelectorAll(`iframe.reader-iframe`);e&&e.forEach(e=>this.applyThemeToIframe(e))}onIframeLoad(e){let t=e.target;gn(t,this.settingsStore?.getState()?.themeIframeContent??!1)}async _handleEditDraft(){if(!this.message)return;let e=``;if(this.mimeType===`text/plain`)e=this.content;else{try{let t=await j(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.message.UID}?view=text`);if(t.ok){let n=await t.json();n.Part&&n.RawText&&(e=n.RawText)}}catch(e){b.error(`Failed to fetch text body for draft`,e)}if(!e){let t=document.createElement(`div`);t.innerHTML=this.rawMessageHtml,e=t.innerText||``}}let t=this.attachments.map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})),n=e=>e?e.map(e=>e.Name?`${e.Name} <${e.Mailbox}@${e.Host}>`:`${e.Mailbox}@${e.Host}`):[];this.composeStore.openComposer({draftUid:this.message.UID.toString(),draftMailbox:this.mailbox,subject:this.message.Envelope?.Subject||``,to:n(this.message.Envelope?.To),cc:n(this.message.Envelope?.Cc),bcc:n(this.message.Envelope?.Bcc),text:e,html:this.rawMessageHtml,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:t})}renderThreadCard(e){return s`
      <alps-thread-card
        .item=${e}
        .mailbox=${this.mailbox}
        @toggle-expansion=${e=>this.toggleItemExpansion(e.detail.item)}
        @load-remote-resources=${e=>this.loadRemoteResourcesForItem(e.detail.item)}
        @toggle-star=${e=>this.toggleItemStar(e.detail.item)}
        @delete-item=${e=>this.deleteItem(e.detail.item)}
        @action-for-item=${e=>this._handleActionForItem(e.detail.action,e.detail.item)}
        @edit-draft-for-item=${e=>{this.message=e.detail.item.message,this.mailbox=e.detail.item.mailbox,this._handleEditDraft()}}
      ></alps-thread-card>
    `}render(){let e=this.selectedUids&&this.selectedUids.size>0,t=this.settingsStore?.getState()?.enableThreading??!0;if(!this.message&&!e)return s`
        <div class="empty-reader-state">
          ${this.i18nStore?.t(`messageReader.selectMessage`)}
        </div>
      `;let n=this.localPreferredView||this.settingsStore?.getState()?.preferredView||`html`,r=this.message||{},i=Bt(r.Flags,this.i18nStore),a=r.Envelope?.From?.[0]||{},o=a.Mailbox&&a.Host?`${a.Mailbox}@${a.Host}`:``,c=a.Name||o||this.i18nStore?.t(`messageList.unknownSender`),u=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,d=String(this.settingsStore?.getState()?.hourFormat||`12`),f=r.Envelope?.Date?qe(r.Envelope.Date,u,d):``,p=Ze(a.Host?a.Host.toLowerCase():``),m=(this.mailbox||``).toLowerCase(),h=m===`archive`||m===`archives`,g=m===`spam`||m===`junk`,_=m===We.toLowerCase(),v=m===Re.toLowerCase(),ee=m===this.getSentMailboxName().toLowerCase();return s`
      <alps-toolbar class="toolbar" ?scrolled=${this.isScrolled}>
        ${this.layoutMode===`full`?s`
          <alps-icon-btn @click=${()=>this.dispatchEvent(new CustomEvent(`close`))} title=${this.i18nStore?.t(`messageReader.back`)} icon="arrowLeft"></alps-icon-btn>
          <div class="toolbar-separator desktop-only"></div>
        `:``}
        
        <div class="toolbar-spacer mobile-spacer"></div>
        
        ${!h&&!_&&!v?s`
        <alps-icon-btn title=${this.i18nStore?.t(`messageReader.archive`)} @click=${()=>this._handleAction(`archive`)} icon="archiveBox"></alps-icon-btn>
        `:``}
        ${!g&&!_&&!v&&!ee?s`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t(`messageReader.reportSpam`)} @click=${()=>this._handleAction(`reportSpam`)} icon="warningDiamond"></alps-icon-btn>
        `:``}
        ${g?s`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t(`messageReader.notSpam`)} @click=${()=>this._handleAction(`notSpam`)} icon="notSpam"></alps-icon-btn>
        `:``}
        <alps-icon-btn title=${this.message?.Flags?.includes(`\\Draft`)||v?this.i18nStore?.t(`messageReader.discardDraft`):this.i18nStore?.t(`messageReader.delete`)} @click=${()=>this._handleAction(`delete`)} icon="trash"></alps-icon-btn>
        <alps-folder-selector-popup
          class="desktop-only"
          .mailboxes=${this.mailboxes}
          .currentMailbox=${this.mailbox}
          @folder-selected=${e=>this._handleAction(e.detail.isMove?`moveTo`:`copyTo`,e.detail.folderName)}
        >
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`messageReader.moveTo`)} icon="folderOpen"></alps-icon-btn>
        </alps-folder-selector-popup>
        
        <div class="toolbar-separator"></div>
        
        ${!_&&!ee?s`
        <alps-icon-btn title=${e&&this.allSelectedUnread||!e&&!this.message?.Flags?.includes(`\\Seen`)?this.i18nStore?.t(`messageReader.markRead`):this.i18nStore?.t(`messageReader.markUnread`)} @click=${()=>this._handleAction(`markUnread`)} icon=${e&&this.allSelectedUnread||!e&&!this.message?.Flags?.includes(`\\Seen`)?`envelopeOpen`:`envelopeUnread`}></alps-icon-btn>
        `:``}
        <alps-icon-btn class="desktop-only" ?active=${e&&this.allSelectedStarred||!e&&this.message?.Flags?.includes(`\\Flagged`)} title=${this.i18nStore?.t(`messageReader.star`)} @click=${()=>this._handleAction(`star`)} icon=${e&&this.allSelectedStarred||!e&&this.message?.Flags?.includes(`\\Flagged`)?`starFourFill`:`starFour`}></alps-icon-btn>
        
        <alps-popup align="left" class="tags-popup">
          <alps-icon-btn slot="trigger" class="desktop-only" title=${this.i18nStore?.t(`messageReader.tags`)} icon="tag"></alps-icon-btn>
          ${[`$label1`,`$label2`,`$label3`,`$label4`,`$label5`].map(t=>s`
              <button class="dropdown-item ${(e?this.commonTags?.some(e=>e.toLowerCase()===t.toLowerCase()):this.message?.Flags?.some(e=>e.toLowerCase()===t.toLowerCase()))?`active`:``}" @click=${()=>this._handleTag(t)}>
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${Ht(t)};margin-right:12px;opacity:0.9;"></span>
                <span class="item-text">${Vt(t,this.i18nStore)}</span>
              </button>
            `)}
          <div class="dropdown-divider"></div>
          <button class="dropdown-item text-danger" @click=${()=>this._handleRemoveAllTags()}>
            <span class="item-text">${this.i18nStore?.t(`messageReader.removeAllTags`)}</span>
          </button>
        </alps-popup>

        <div class="toolbar-spacer desktop-spacer"></div>
        <div class="toolbar-separator mobile-only"></div>
          
          ${e?``:s`
            ${this.message?.Flags?.includes(`\\Draft`)||v?s`
              <alps-icon-btn title=${this.i18nStore?.t(`messageReader.editDraft`)} @click=${this._handleEditDraft} icon="pen"></alps-icon-btn>
            `:s`
              <alps-icon-btn title=${this.i18nStore?.t(`messageReader.reply`)} @click=${()=>this._handleAction(`reply`)} icon="arrowBendUpLeft"></alps-icon-btn>
            `}
            
            <alps-popup align="right" class="more-menu-popup">
              <alps-icon-btn slot="trigger" class="more-btn" title=${this.i18nStore?.t(`messageReader.moreOptions`)} icon="dotsThreeVertical"></alps-icon-btn>
            
            ${this.message?.Flags?.includes(`\\Draft`)||v?``:s`
            <button class="dropdown-item" @click=${()=>this._handleAction(`reply`)}>
              ${T(`arrowBendUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reply`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`replyAll`)}>
              ${T(`arrowBendDoubleUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.replyAll`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`forward`)}>
              ${T(`arrowBendUpRight`)} <span class="item-text">${this.i18nStore?.t(`messageReader.forward`)}</span>
            </button>
            <div class="dropdown-divider"></div>
            `}
            ${!h&&!_&&!v?s`
            <button class="dropdown-item" @click=${()=>this._handleAction(`archive`)}>
              ${T(`archiveBox`)} <span class="item-text">${this.i18nStore?.t(`messageReader.archive`)}</span>
            </button>
            `:``}
            ${!g&&!_&&!v&&!ee?s`
            <button class="dropdown-item" @click=${()=>this._handleAction(`reportSpam`)}>
              ${T(`warningDiamond`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reportSpam`)}</span>
            </button>
            `:``}
            ${g?s`
            <button class="dropdown-item" @click=${()=>this._handleAction(`notSpam`)}>
              ${T(`notSpam`)} <span class="item-text">${this.i18nStore?.t(`messageReader.notSpam`)}</span>
            </button>
            `:``}
            <button class="dropdown-item" @click=${()=>this._handleAction(`delete`)}>
              ${T(`trash`)} <span class="item-text">${this.message?.Flags?.includes(`\\Draft`)||this.mailbox===`Drafts`?this.i18nStore?.t(`messageReader.discardDraft`):this.i18nStore?.t(`messageReader.delete`)}</span>
            </button>
            <alps-folder-selector-popup
              class="folder-selector"
              .mailboxes=${this.mailboxes}
              .currentMailbox=${this.mailbox}
              @folder-selected=${e=>this._handleAction(e.detail.isMove?`moveTo`:`copyTo`,e.detail.folderName)}
            >
              <button slot="trigger" class="dropdown-item">
                ${T(`folderOpen`)} <span class="item-text">${this.i18nStore?.t(`messageReader.moveTo`)}</span>
              </button>
            </alps-folder-selector-popup>
            <div class="dropdown-divider"></div>
            ${!_&&!ee?s`
            <button class="dropdown-item" @click=${()=>this._handleAction(`markUnread`)}>
              ${this.message?.Flags?.includes(`\\Seen`)?T(`envelopeUnread`):T(`envelopeOpen`)} <span class="item-text">${this.message?.Flags?.includes(`\\Seen`)?this.i18nStore?.t(`messageReader.markUnread`):this.i18nStore?.t(`messageReader.markRead`)}</span>
            </button>
            `:``}
            <button class="dropdown-item" @click=${()=>this._handleAction(`star`)}>
              ${this.message?.Flags?.includes(`\\Flagged`)?T(`starFourFill`):T(`starFour`)} <span class="item-text">${this.i18nStore?.t(`messageReader.star`)}</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${()=>this._handleAction(`print`)}>
              ${T(`printer`)} <span class="item-text">${this.i18nStore?.t(`messageReader.print`)}</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item ${n===`text`?`active`:``}" ?disabled=${!this.hasText} @click=${()=>this.hasText&&this._handleAction(`showPlaintext`)}>
              ${T(`textAlignLeft`)}
              <span class="item-text">${this.i18nStore?.t(`messageReader.showPlaintext`)}</span>
            </button>
            <button class="dropdown-item ${n===`html`?`active`:``}" ?disabled=${!this.hasHtml} @click=${()=>this.hasHtml&&this._handleAction(`showHtml`)}>
              ${T(`code`)}
              <span class="item-text">${this.i18nStore?.t(`messageReader.showHtml`)}</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${()=>this._handleAction(`downloadMessage`)}>
              ${T(`downloadSimple`)} <span class="item-text">${this.i18nStore?.t(`messageReader.downloadMessage`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`showOriginal`)}>
              ${T(`codeBlock`)} <span class="item-text">${this.i18nStore?.t(`messageReader.showOriginal`)}</span>
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
      `:t&&(this.threadItems.length>1||this._isThread)?s`
        <div class="reader-body" @scroll=${this.handleScroll}>
          <div class="reader-header thread-header-grouped">
            <div class="reader-subject">
              ${i.length>0?s`
                <div class="tag-pills">
                  ${i.map(e=>s`
                    <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
                  `)}
                </div>
              `:``}
              ${r.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`)}
            </div>
          </div>
          <div class="thread-container">
            ${this.threadItems.map(e=>this.renderThreadCard(e))}
          </div>
        </div>
      `:s`
        <div class="reader-body" @scroll=${this.handleScroll}>
          <div class="reader-header">
          <div class="reader-subject">
            ${i.length>0?s`
              <div class="tag-pills">
                ${i.map(e=>s`
                  <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
                `)}
              </div>
            `:``}
            <div class="mobile-date-container">
              <div class="reader-date mobile-date">${f}</div>
              ${r.RFC822Size?s`<div class="reader-size mobile-size">${Ye(r.RFC822Size)}</div>`:``}
            </div>
            ${r.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`)}
          </div>
          <div class="reader-meta">
            <div class="reader-sender-block">
              <div class="reader-sender-left">
                <div class="avatar-container">
                  <alps-avatar .name=${c} .email=${o} .size=${40} .src=${p}></alps-avatar>
                  ${r.HasBimiPotential?s`
                    <div class="bimi-badge" title="${this.i18nStore?.t(`messageReader.verifiedSender`)}">
                      ${T(`verifiedBadge`)}
                    </div>
                  `:r.HasBimiFailed?s`
                    <div class="bimi-badge bimi-failed-badge" title="${this.i18nStore?.t(`messageReader.unverifiedSender`)}">
                      ${T(`authFailedBadge`)}
                    </div>
                  `:``}
                </div>
                <div class="reader-sender-info">
                  ${a.Name&&a.Name!==o?s`<span class="reader-sender-name">${a.Name}</span>`:``}
                  ${o?s`<alps-recipient-pill address="${o}"></alps-recipient-pill>`:s`<span class="reader-sender-name">${c}</span>`}
                </div>
              </div>
              <div class="desktop-date-container">
                <div class="reader-date desktop-date">${f}</div>
                ${r.RFC822Size?s`<div class="reader-size desktop-only">${Ye(r.RFC822Size)}</div>`:``}
              </div>
            </div>
            
            <div class="reader-recipients-block">
              <div class="reader-recipients">
                <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.to`)}</span>
                <div class="reader-recipients-list">
                  ${r.Envelope?.To&&r.Envelope.To.length>0?r.Envelope.To.map(e=>e.Mailbox&&e.Host?s`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``):s`<span class="undisclosed-recipients">${r.Flags?.includes(`\\Draft`)?this.i18nStore?.t(`messageReader.noRecipients`):this.i18nStore?.t(`messageReader.undisclosed`)}</span>`}
                </div>
              </div>
              ${r.Envelope?.Cc&&r.Envelope.Cc.length>0?s`
                <div class="reader-recipients">
                  <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.cc`)}</span>
                  <div class="reader-recipients-list">
                    ${r.Envelope.Cc.map(e=>e.Mailbox&&e.Host?s`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``)}
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
            .messageUid=${r.UID}
          ></alps-attachment-list>
        `:``}

        ${this.loading?s`
          <div class="loading-overlay">
            <div class="loading-state">
              <alps-loader full-height .text=${this.i18nStore?.t(`messageReader.loadingMessage`)||`Loading message...`}></alps-loader>
            </div>
          </div>
        `:s`
          <div class="message-content">
          ${this.activeBanners&&this.activeBanners.length>0?s`
            ${this.activeBanners.map(e=>e)}
          `:``}
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
                .srcdoc=${l(this.content)}
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
          .messageUid=${r.UID}
        ></alps-attachment-list>
      `:``}
      `}
    `}};E([g({context:C})],U.prototype,`settingsStore`,void 0),E([g({context:S})],U.prototype,`i18nStore`,void 0),E([g({context:L})],U.prototype,`composeStore`,void 0),E([a()],U.prototype,`localPreferredView`,void 0),E([a()],U.prototype,`hasHtml`,void 0),E([a()],U.prototype,`hasText`,void 0),E([o({type:String})],U.prototype,`mailbox`,void 0),E([o({type:Object})],U.prototype,`message`,void 0),E([o({type:Array})],U.prototype,`messages`,void 0),E([o({type:Object})],U.prototype,`selectedUids`,void 0),E([o({type:Boolean})],U.prototype,`allSelectedStarred`,void 0),E([o({type:Boolean})],U.prototype,`allSelectedUnread`,void 0),E([o({type:Array})],U.prototype,`commonTags`,void 0),E([o({type:Boolean})],U.prototype,`bulkProcessing`,void 0),E([o({type:String})],U.prototype,`layoutMode`,void 0),E([o({type:Array})],U.prototype,`mailboxes`,void 0),E([a()],U.prototype,`content`,void 0),E([a()],U.prototype,`mimeType`,void 0),E([a()],U.prototype,`loading`,void 0),E([a()],U.prototype,`activeBanners`,void 0),E([a()],U.prototype,`attachments`,void 0),E([a()],U.prototype,`allowRemoteResources`,void 0),E([a()],U.prototype,`hasRemoteResources`,void 0),E([a()],U.prototype,`rawMessageHtml`,void 0),E([a()],U.prototype,`isScrolled`,void 0),E([a()],U.prototype,`threadItems`,void 0),E([a()],U.prototype,`_isThread`,void 0),U=E([m(`alps-message-reader`)],U);var yn=1e4,bn=250,xn=150,Sn=500,Cn=64,wn=120,Tn=380,En=300,Dn=57,On=150,kn=250,W=class extends d{constructor(...e){super(...e),this.showDeleteConfirm=!1,this.pendingDeleteDetails=null,this.markReadTimer=null,this.notificationSound=new Audio(`/assets/notify.wav`),this.audioUnlocked=!1,this.unlockAudio=()=>{this.audioUnlocked||(this.notificationSound.volume=0,this.notificationSound.play().then(()=>{this.notificationSound.pause(),this.notificationSound.currentTime=0,this.notificationSound.volume=1,this.audioUnlocked=!0}).catch(()=>{}),document.removeEventListener(`click`,this.unlockAudio),document.removeEventListener(`keydown`,this.unlockAudio))},this.mailboxes=[],this.messages=[],this.currentMailbox=w,this.loadingMessages=!0,this.showInitialLoader=!window.alpsAppLoaded,this.selectedMessage=null,this.selectedUids=new Set,this.layoutMode=`vertical`,this.filterQuery=``,this.expandedFolders=new Set([w]),this.username=``,this.currentPage=0,this.totalMessages=0,this.messagesPerPage=50,this.resizerPositionX=bn+Math.max(Tn,(window.innerWidth-bn)*.4),this.listHeight=Math.max(kn,(window.innerHeight-Dn)*.4),this.isSidebarDragging=!1,this.isPaneDragging=!1,this.sidebarWidth=bn,this.isSidebarHovered=!1,this.hoverTimeout=null,this.densityMode=`compact`,this.isSyncing=!1,this.sidebarCollapsed=!1,this.suppressSidebarHover=!1,this.sortOrder=`desc`,this.listScrolled=!1,this.targetUid=null,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.bulkProcessing=!1,this._mql=window.matchMedia(`(max-width: 768px)`),this._handleMediaQuery=e=>{this.isMobile=e.matches,this.isMobile||(this.mobileSidebarOpen=!1)},this.handleDraftAutosaved=e=>{let{oldUid:t,newUid:n,mailbox:r,subject:i,hasAttachments:a,size:o}=e.detail;if(this.currentMailbox===r&&this.messages){let e=Number(n),r=!1;if(t){let n=this.messages.findIndex(e=>String(e.UID)===String(t));if(n!==-1){let s=[...this.messages];if(s[n]={...s[n],UID:e,Size:o||s[n].Size,RFC822Size:o||s[n].RFC822Size,HasAttachments:a,_isAutosaveUpdate:!0,Envelope:{...s[n].Envelope,Subject:i||s[n].Envelope?.Subject||`(No subject)`}},this.messages=s,r=!0,this.selectedMessage&&String(this.selectedMessage.UID)===String(t)){this.selectedMessage=s[n],this.targetUid=String(e);let r=window.location.hash;r.includes(`/${t}`)?r=r.replace(`/${t}`,`/${e}`):r.includes(`uid=${t}`)&&(r=r.replace(`uid=${t}`,`uid=${e}`)),window.history.replaceState(null,``,r)}}}if(!r){let r=this.settingsStore?.getState().name||this.username,s=(this.username||``).split(`@`),c=s[0]||``,l=s[1]||``,u={UID:e,Size:o||0,RFC822Size:o||0,HasAttachments:a,Flags:[P,Nt],_isAutosaveUpdate:!0,Envelope:{Subject:i||`(No subject)`,Date:new Date().toISOString(),From:[{Name:r,Mailbox:c,Host:l}]}},d=this.messages.filter(e=>String(e.UID)!==String(t)&&String(e.UID)!==String(n));this.messages=[u,...d]}}},this._handleSettingsChange=()=>{this._syncSettings()},this._handleI18nChange=()=>{this.requestUpdate()},this.handleSyncStart=e=>{let t=e.detail;this.isSyncing=!0,t.background||(this.loadingMessages=!0)},this.handleSyncSuccess=e=>{this.isSyncing=!1;let{data:t,background:n}=e.detail;t.Username&&(this.username=t.Username,this.settingsStore.getState().loginUsername!==t.Username&&this.settingsStore.updateSettings({loginUsername:t.Username}));let r=this.mailboxes.length===0,i=!1,a=!1,o=0;if(t.Mailboxes){for(let e of t.Mailboxes){let t=e.Name||e.Mailbox,s=this.mailboxes.find(e=>(e.Name||e.Mailbox)===t),c=s?s.Total:void 0;c!==void 0&&e.Total!==void 0&&e.Total>c&&!r&&n&&(i=!0,t.toUpperCase()===`INBOX`&&(a=!0,o+=e.Total-c))}this.mailboxes=t.Mailboxes}if(i&&this.settingsStore.getState().soundNotifications&&(this.notificationSound.currentTime=0,this.notificationSound.play().catch(e=>{e.name!==`NotAllowedError`&&b.error(`Failed to play sound notification:`,e)})),a&&this.settingsStore.getState().desktopNotifications&&`Notification`in window&&Notification.permission===`granted`){let e=this.i18nStore?.t(`mailboxPage.newMessages`),t=o===1?this.i18nStore?.t(`mailboxPage.newMessagesSingleBody`):(this.i18nStore?.t(`mailboxPage.newMessagesMultiBody`)).replace(`{count}`,String(o));try{let n=new Notification(e,{body:t,icon:`/apple-touch-icon.png`,tag:`alps-new-message`});n.onclick=()=>{window.focus(),n.close(),this.currentMailbox===`INBOX`?(this.currentPage=0,N.fetch(this.currentMailbox,0,this.filterQuery,!1)):this.updateUrl(`INBOX`,0,null)}}catch(e){b.error(`Failed to show desktop notification:`,e)}}if(a&&this.currentMailbox!==`INBOX`&&this.showGlobalToast(this.i18nStore?.t(`mailboxPage.newMessagesInInbox`),this.i18nStore?.t(`mailboxPage.open`),()=>{this.updateUrl(`INBOX`,0,null)},5e3),n&&this.currentPage>0)t.Total!==void 0&&t.Total!==this.totalMessages&&this.showGlobalToast(this.i18nStore?.t(`mailboxPage.newMessagesAvailable`),this.i18nStore?.t(`mailboxPage.refresh`),()=>{this.currentPage=0,N.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)});else if(t.Page!==void 0&&(this.currentPage=t.Page),t.Total!==void 0&&(this.totalMessages=t.Total),t.MessagesPerPage!==void 0&&(this.messagesPerPage=t.MessagesPerPage),t.Messages){if(this.messages=t.Messages,this.selectedMessage){let e=this.messages.find(e=>String(e.UID)===String(this.selectedMessage.UID));e&&e.Flags&&(this.selectedMessage={...this.selectedMessage,Flags:e.Flags})}}else this.messages=[];n||(this.loadingMessages=!1,this.applyTargetUid(),this.showInitialLoader&&setTimeout(()=>{this.showInitialLoader=!1,window.alpsAppLoaded=!0},100))},this.handleSyncError=e=>{this.isSyncing=!1;let{background:t}=e.detail;t||(this.loadingMessages=!1)},this.handleMailboxNotFound=()=>{this.showGlobalToast(this.i18nStore.t(`mailboxPage.mailboxNotFound`),``,void 0,3e3),this.updateUrl(w,0,null,null)},this.handleHashChange=()=>{let e=this.currentMailbox,t=this.currentPage,n=this.targetUid,r=this.filterQuery;this.extractMailboxFromHash(),e!==this.currentMailbox||t!==this.currentPage||r!==this.filterQuery?(e===this.currentMailbox?r!==this.filterQuery&&(this.loadingMessages=!0,this.currentPage=0):(this.selectedMessage=null,this.currentPage=0,this.selectedUids=new Set,this.loadingMessages=!0),N.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)):n!==this.targetUid&&this.applyTargetUid()},this.startResize=e=>{e.preventDefault(),this.isPaneDragging=!0;let t=e=>{if(this.layoutMode===`vertical`){let t=this.sidebarCollapsed?Cn:this.sidebarWidth,n=Math.max(t+Tn,Math.min(e.clientX,window.innerWidth-En));this.resizerPositionX=n}else this.layoutMode===`horizontal`&&(this.listHeight=Math.max(On,Math.min(e.clientY-Dn,window.innerHeight-On)))},n=()=>{this.isPaneDragging=!1,window.removeEventListener(`mousemove`,t),window.removeEventListener(`mouseup`,n)};window.addEventListener(`mousemove`,t),window.addEventListener(`mouseup`,n)}}static{this.styles=n`
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
    .layout-vertical alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${bn}px); flex-shrink: 0; }
    .layout-vertical .main-view { flex: 1; display: flex; flex-direction: row; min-width: 0; }
    .layout-vertical .message-list-pane { width: ${Tn}px; flex-shrink: 0; border-right: 1px solid var(--border-color); }
    .layout-vertical .message-reader-pane { flex: 1; min-width: 0; }

    /* Horizontal: Sidebar (250px) | [ Message List (50%) / Reader (50%) ] */
    .layout-horizontal alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${bn}px); flex-shrink: 0; }
    .layout-horizontal .main-view { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .layout-horizontal .message-list-pane { flex-shrink: 0; border-bottom: 1px solid var(--border-color); }
    .layout-horizontal .message-reader-pane { flex: 1; min-height: 0; }

    /* Full: Sidebar (250px) | Message List OR Reader */
    .layout-full alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${bn}px); flex-shrink: 0; }
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
      --sidebar-width: ${Cn}px;
    }

    .app-container.collapsed .message-list-pane {
      box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
      z-index: 25;
      border-left: 1px solid var(--border-color);
    }



    `}showGlobalToast(e,t=``,n,r=3e3){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e,actionLabel:t,actionFn:n,duration:r}}))}get effectiveListWidth(){let e=this.sidebarCollapsed&&!this.isMobile?Cn:this.sidebarWidth;return Math.max(Tn,this.resizerPositionX-e)}get allSelectedStarred(){if(this.selectedUids.size===0)return!1;for(let e of this.selectedUids){let t=this.messages.find(t=>String(t.UID)===e);if(!t||!t.Flags?.includes(`\\Flagged`))return!1}return!0}get commonSelectedTags(){return this.selectedUids.size===0?[]:[`$label1`,`$label2`,`$label3`,`$label4`,`$label5`].filter(e=>{for(let t of this.selectedUids){let n=this.messages.find(e=>String(e.UID)===t);if(!n||!n.Flags?.some(t=>t.toLowerCase()===e.toLowerCase()))return!1}return!0})}get allSelectedUnread(){if(this.selectedUids.size===0)return!1;for(let e of this.selectedUids){let t=this.messages.find(t=>String(t.UID)===e);if(t&&t.Flags?.includes(`\\Seen`))return!1}return!0}connectedCallback(){super.connectedCallback(),this.extractMailboxFromHash(),window.addEventListener(`hashchange`,this.handleHashChange),document.addEventListener(`click`,this.unlockAudio),document.addEventListener(`keydown`,this.unlockAudio),this._mql.addEventListener(`change`,this._handleMediaQuery),this._handleMediaQuery(this._mql),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._syncSettings(),N.addEventListener(`sync-start`,this.handleSyncStart),N.addEventListener(`sync-success`,this.handleSyncSuccess),N.addEventListener(`sync-error`,this.handleSyncError),N.addEventListener(`mailbox-not-found`,this.handleMailboxNotFound),window.addEventListener(`draft-autosaved`,this.handleDraftAutosaved),N.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`hashchange`,this.handleHashChange),this._mql.removeEventListener(`change`,this._handleMediaQuery),document.removeEventListener(`click`,this.unlockAudio),document.removeEventListener(`keydown`,this.unlockAudio),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),N.removeEventListener(`sync-start`,this.handleSyncStart),N.removeEventListener(`sync-success`,this.handleSyncSuccess),N.removeEventListener(`sync-error`,this.handleSyncError),N.removeEventListener(`mailbox-not-found`,this.handleMailboxNotFound),window.removeEventListener(`draft-autosaved`,this.handleDraftAutosaved),N.stop()}_syncSettings(){let e=this.settingsStore.getState();this.layoutMode=e.layoutMode,this.densityMode=e.densityMode,this.sortOrder=e.sortOrder||`desc`,this.sidebarCollapsed!==e.sidebarCollapsed&&(this.sidebarCollapsed=e.sidebarCollapsed),e.messagesPerPage&&e.messagesPerPage>0&&(this.messagesPerPage=e.messagesPerPage),e.checkMailInterval!==void 0&&N.start(e.checkMailInterval)}openFolderPrompt(){let e=this.shadowRoot?.querySelector(`alps-folder-list`);e&&typeof e.triggerCreateFolder==`function`&&e.triggerCreateFolder()}updateUrl(e,t,n,r=this.filterQuery){let i=`#/mailbox/${encodeURIComponent(e)}`,a=new URLSearchParams;t>0&&a.set(`p`,t.toString()),n&&a.set(`uid`,n),r&&a.set(`q`,r);let o=a.toString();o&&(i+=`?`+o),window.location.hash=i}extractMailboxFromHash(){let e=window.location.hash;if(e.startsWith(`#/mailbox/`)){let t=e.substring(10),n=t.indexOf(`?`),r=``;n!==-1&&(r=t.substring(n+1),t=t.substring(0,n));let i=t.split(`/`);this.currentMailbox=decodeURIComponent(i[0]);let a=new URLSearchParams(r);i.length>1&&i[1]?this.targetUid=i[1]:this.targetUid=a.get(`uid`)||null;let o=a.get(`p`);o?this.currentPage=parseInt(o,10)||0:this.currentPage=0,this.filterQuery=a.get(`q`)||``}else this.currentMailbox=w,this.targetUid=null,this.currentPage=0}async applyTargetUid(){if(!this.targetUid){this.markReadTimer&&=(clearTimeout(this.markReadTimer),null),this.selectedMessage=null;return}let e=this.targetUid,t=this.messages.find(t=>String(t.UID)===e);if(!t&&this.messages.length>0)try{let n=await j(`/mailboxes/${encodeURIComponent(this.currentMailbox)}/messages/${e}`);if(n.ok){let e=await n.json();e.Message&&(t=e.Message)}}catch(e){b.error(`Failed to fetch shifted message:`,e)}this.targetUid===e&&(t?this.selectedMessage?.UID!==t.UID&&(this.selectedMessage=t,this.layoutMode===`full`&&this.expandedFolders.clear(),this._scheduleMarkAsRead(t)):this.messages.length>0&&(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)))}async selectMessage(e){this.updateUrl(this.currentMailbox,this.currentPage,e.UID)}_scheduleMarkAsRead(e){if(this.markReadTimer&&=(clearTimeout(this.markReadTimer),null),e.Flags?.includes(`\\Seen`))return;let t=this.settingsStore?.getState().markReadTimeout??0;t<0||(t===0?this._doMarkAsRead(e):this.markReadTimer=setTimeout(()=>{this._doMarkAsRead(e)},t*1e3))}updateLocalMessageFlags(e,t,n){let r=!1,i=[...this.messages];for(let a=0;a<i.length;a++){let o=i[a];if(e.includes(String(o.UID))){let e=o.Flags&&o.Flags.includes(t);n===`add`&&!e?(i[a]={...o,Flags:[...o.Flags||[],t]},r=!0):n===`remove`&&e&&(i[a]={...o,Flags:o.Flags.filter(e=>e!==t)},r=!0)}}if(r&&(this.messages=i,this.selectedMessage&&e.includes(String(this.selectedMessage.UID)))){let e=this.selectedMessage.Flags&&this.selectedMessage.Flags.includes(t);n===`add`&&!e?this.selectedMessage.Flags=[...this.selectedMessage.Flags||[],t]:n===`remove`&&e&&(this.selectedMessage.Flags=this.selectedMessage.Flags.filter(e=>e!==t)),this.selectedMessage={...this.selectedMessage}}}async _handleListToggleStar(e){let t=e.detail.message,n=t.Flags&&t.Flags.includes(`\\Flagged`),r=n?`remove`:`add`;this.updateLocalMessageFlags([String(t.UID)],F,r);try{await I.setFlag(this.currentMailbox,[String(t.UID)],[`\\Flagged`],r)||this.updateLocalMessageFlags([String(t.UID)],F,n?`add`:`remove`)}catch{this.updateLocalMessageFlags([String(t.UID)],F,n?`add`:`remove`)}}async _doMarkAsRead(e){if(this.selectedMessage?.UID===e.UID)this.selectedMessage=await I.markAsRead(this.currentMailbox,e),this.updateLocalMessageFlags([String(this.selectedMessage.UID)],P,`add`);else{let t=await I.markAsRead(this.currentMailbox,e);t&&t.UID&&this.updateLocalMessageFlags([String(t.UID)],P,`add`)}}async _handleReaderAction(e){let t=e.detail.action,n=this.selectedUids&&this.selectedUids.size>0,r=n?Array.from(this.selectedUids):[];if(!(!n&&!this.selectedMessage?.UID)){n&&(this.bulkProcessing=!0);try{let i=this.selectedMessage,a=this.currentMailbox;if(t===`star`)if(n){let e=this.allSelectedStarred?`remove`:`add`;await I.setFlag(this.currentMailbox,r,[F],e),this.updateLocalMessageFlags(r,F,e)}else this.selectedMessage=await I.toggleStar(this.currentMailbox,this.selectedMessage),this.updateLocalMessageFlags([String(this.selectedMessage.UID)],F,this.selectedMessage.Flags?.includes(`\\Flagged`)?`add`:`remove`);else if(t===`addTag`||t===`removeTag`){let a=e.detail.tags||(e.detail.folder?[e.detail.folder]:[]);if(!a||a.length===0)return;let o=t===`addTag`?`add`:`remove`;if(n){await I.setFlag(this.currentMailbox,r,a,o);for(let e of a)this.updateLocalMessageFlags(r,e,o)}else{await I.setFlag(this.currentMailbox,[String(i.UID)],a,o);for(let e of a)this.updateLocalMessageFlags([String(i.UID)],e,o)}this.requestUpdate()}else if(t===`markUnread`)if(n){let e=this.allSelectedUnread?`add`:`remove`;await I.setFlag(this.currentMailbox,r,[P],e),this.updateLocalMessageFlags(r,P,e)}else !i?.Flags||!i.Flags.includes(`\\Seen`)?(this.selectedMessage=await I.markAsRead(this.currentMailbox,i),this.updateLocalMessageFlags([String(this.selectedMessage.UID)],P,`add`)):await I.markAsUnread(this.currentMailbox,i)&&(this.updateLocalMessageFlags([String(i.UID)],P,`remove`),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null));else if(t===`delete`||t===`archive`||t===`reportSpam`||t===`notSpam`){let e=this.currentMailbox.toLowerCase()===We.toLowerCase(),o=this.currentMailbox.toLowerCase()===Re.toLowerCase(),s=this.currentMailbox.toLowerCase()===`junk`||this.currentMailbox.toLowerCase()===`spam`,c={success:!1},l=We;if(t===`archive`&&(l=Be),t===`reportSpam`&&(l=Ue),t===`notSpam`&&(l=w),t===`delete`&&(e||o||s)){this.pendingDeleteDetails={isBulk:n,uidsArray:r,currentMsgUid:i?.UID,isTrash:e,isDrafts:o,isSpam:s},this.showDeleteConfirm=!0;return}else c=n?await I.moveMessages(this.currentMailbox,r,l):await I.moveMessages(this.currentMailbox,[String(i.UID)],l);if(c.success){n?(this.selectedUids=new Set,this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null),this.requestUpdate()):(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null));let e=``,o;if(e=t===`archive`?n?this.i18nStore?.t(`toast.messagesMovedToArchive`,{count:r.length}):this.i18nStore?.t(`toast.messageMovedToArchive`):t===`reportSpam`?n?this.i18nStore?.t(`toast.messagesMovedToSpam`,{count:r.length}):this.i18nStore?.t(`toast.messageMovedToSpam`):t===`notSpam`?n?this.i18nStore?.t(`toast.messagesMovedToInbox`,{count:r.length}):this.i18nStore?.t(`toast.messageMovedToInbox`):n?this.i18nStore?.t(`toast.messagesMovedToTrash`,{count:r.length}):this.i18nStore?.t(`toast.messageMovedToTrash`),n&&c.uidMapping){let e=Object.values(c.uidMapping);o=async()=>{try{let t=await I.moveMessages(l,e,a);if(t.success&&this.currentMailbox===a&&t.uidMapping){let e=new Set(this.selectedUids);Object.values(t.uidMapping).forEach(t=>e.add(t)),this.selectedUids=e,this.requestUpdate()}}catch(e){b.error(`Undo failed`,e)}}}else if(!n&&c.uidMapping?.[String(i.UID)]){let e={UID:c.uidMapping[String(i.UID)]};o=async()=>{try{let t=await I.moveMessages(l,[String(e.UID)],a);if(t.success){let n=this.currentMailbox===a?this.currentPage:0;t.uidMapping?.[String(e.UID)]?this.updateUrl(a,n,t.uidMapping[String(e.UID)]):this.updateUrl(a,n,null)}}catch(e){b.error(`Undo failed`,e)}}}this.showGlobalToast(e,o?this.i18nStore?.t(`mailboxPage.undo`):``,o,yn)}}else if(t===`moveTo`||t===`copyTo`){let o=e.detail.folder;if(!o)return;let s=t===`moveTo`,c={success:!1};if(c=s?n?await I.moveMessages(this.currentMailbox,r,o):await I.moveMessages(this.currentMailbox,[String(i.UID)],o):n?await I.copyMessages(this.currentMailbox,r,o):await I.copyMessages(this.currentMailbox,[String(i.UID)],o),c.success){s&&(n?(this.selectedUids=new Set,this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null),this.requestUpdate()):(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)));let e=s?n?this.i18nStore?.t(`toast.messagesMovedToFolder`,{count:r.length,folder:o}):this.i18nStore?.t(`toast.messageMovedToFolder`,{folder:o}):n?this.i18nStore?.t(`toast.messagesCopiedToFolder`,{count:r.length,folder:o}):this.i18nStore?.t(`toast.messageCopiedToFolder`,{folder:o}),t;if(n&&s&&c.uidMapping){let e=Object.values(c.uidMapping);t=async()=>{try{let t=await I.moveMessages(o,e,a);if(t.success&&this.currentMailbox===a&&t.uidMapping){let e=new Set(this.selectedUids);Object.values(t.uidMapping).forEach(t=>e.add(t)),this.selectedUids=e,this.requestUpdate()}}catch(e){b.error(`Undo failed`,e)}}}else if(!n&&s&&c.uidMapping?.[String(i.UID)]){let e={UID:c.uidMapping[String(i.UID)]};t=async()=>{try{let t=await I.moveMessages(o,[String(e.UID)],a);if(t.success){let n=this.currentMailbox===a?this.currentPage:0;t.uidMapping?.[String(e.UID)]?this.updateUrl(a,n,t.uidMapping[String(e.UID)]):this.updateUrl(a,n,null)}}catch(e){b.error(`Undo failed`,e)}}}this.showGlobalToast(e,t?this.i18nStore?.t(`mailboxPage.undo`):``,t,yn)}}else if(t===`downloadMessage`&&!n){let e=i.UID,t=`/mailboxes/${encodeURIComponent(this.currentMailbox)}/messages/${e}/raw`,n=document.createElement(`a`);n.href=t,n.download=``,document.body.appendChild(n),n.click(),document.body.removeChild(n)}else if(t===`showOriginal`&&!n){let e=`#/original?mailbox=${encodeURIComponent(this.currentMailbox)}&uid=${i.UID}`;window.open(e,`_blank`)}}finally{n&&(this.bulkProcessing=!1)}}}async _confirmDelete(){this.showDeleteConfirm=!1;let e=this.pendingDeleteDetails;if(this.pendingDeleteDetails=null,!e)return;let{isBulk:t,uidsArray:n,currentMsgUid:r,isDrafts:i}=e;t&&(this.bulkProcessing=!0);try{let e=!1;if(e=t?await I.deleteMessages(this.currentMailbox,n):await I.deleteMessages(this.currentMailbox,[String(r)]),e){t?(this.selectedUids=new Set,this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null),this.requestUpdate()):(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null));let e=``;e=i?t?this.i18nStore?.t(`toast.draftsDiscarded`,{count:n.length}):this.i18nStore?.t(`toast.draftDiscarded`):t?this.i18nStore?.t(`toast.messagesPermanentlyDeleted`,{count:n.length}):this.i18nStore?.t(`toast.messagePermanentlyDeleted`),this.showGlobalToast(e,``,void 0,yn)}}finally{t&&(this.bulkProcessing=!1)}}_cancelDelete(){this.showDeleteConfirm=!1,this.pendingDeleteDetails=null}toggleFolder(e,t){t&&(t.stopPropagation(),t.preventDefault());let n=new Set(this.expandedFolders);n.has(e)?n.delete(e):n.add(e),this.expandedFolders=n}render(){let e=this.isMobile?`full`:this.layoutMode,t=e===`full`&&this.selectedMessage!==null;return s`
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
          @sidebar-resize=${e=>{let t=e.detail.newWidth;t<wn?(this.sidebarCollapsed||this.settingsStore.updateSettings({sidebarCollapsed:!0}),this.sidebarWidth=bn):(this.sidebarCollapsed&&this.settingsStore.updateSettings({sidebarCollapsed:!1}),this.sidebarWidth=Math.min(Math.max(t,xn),Sn),this.resizerPositionX=Math.max(this.resizerPositionX,this.sidebarWidth+Tn))}}
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
            @select-mailbox=${e=>{this.currentMailbox===e.detail.name?(this.currentPage=0,this.selectedMessage=null,this.filterQuery=``,this.loadingMessages=!0,this.updateUrl(e.detail.name,0,null),N.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)):(this.loadingMessages=!0,this.filterQuery=``,this.selectedUids=new Set,this.updateUrl(e.detail.name,0,null)),this.sidebarCollapsed&&!this.isMobile&&(this.suppressSidebarHover=!0),this.isMobile&&(this.mobileSidebarOpen=!1)}}
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
          <div class="pane message-list-pane" style="position: relative; ${e===`vertical`?`width: ${this.effectiveListWidth}px; flex: none; ${this.isPaneDragging||this.isSidebarDragging?``:`transition: width 0.2s;`}`:e===`horizontal`?`height: ${this.listHeight}px; flex: none;`:``}">

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
              @refresh=${()=>{this.currentPage=0,N.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0)}}
              @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
              @compose=${()=>this.composeStore.openComposer()}
              @select-message=${e=>this.selectMessage(e.detail.message)}
              @change-page=${e=>this.updateUrl(this.currentMailbox,e.detail.page,this.targetUid)}
              @list-scrolled=${e=>this.listScrolled=e.detail.scrolled}
              @toggle-sort=${async()=>{let e=this.sortOrder===`asc`?`desc`:`asc`;this.messages=[],this.loadingMessages=!0,await this.settingsStore.updateSettings({sortOrder:e}),this.currentPage=0,N.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)}}
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
              .messages=${this.messages}
              .layoutMode=${e}
              .selectedUids=${this.selectedUids}
              .allSelectedStarred=${this.allSelectedStarred}
              .allSelectedUnread=${this.allSelectedUnread}
              .commonTags=${this.commonSelectedTags}
              .bulkProcessing=${this.bulkProcessing}
              @close=${()=>{this.updateUrl(this.currentMailbox,this.currentPage,null)}}
              @action=${this._handleReaderAction}
              @message-flags-changed=${e=>this.updateLocalMessageFlags([e.detail.uid],e.detail.flag,e.detail.action)}
            ></alps-message-reader>
          </div>
        </div>
      </div>
      ${this.showDeleteConfirm?s`
        <ui-confirm
          title="${this.i18nStore?.t(`mailboxPage.permanentlyDelete`)}"
          message=${this.pendingDeleteDetails?.isBulk?this.i18nStore?.t(`messageReader.deleteConfirmMultiple`):this.i18nStore?.t(`messageReader.deleteConfirmSingle`)}
          confirmText=${this.i18nStore?.t(`mailboxPage.deletePermanently`)}
          cancelText=${this.i18nStore?.t(`general.cancel`)}
          .isDanger=${!0}
          @confirm=${this._confirmDelete}
          @cancel=${this._cancelDelete}
        ></ui-confirm>
      `:``}
    `}};E([g({context:L})],W.prototype,`composeStore`,void 0),E([g({context:C})],W.prototype,`settingsStore`,void 0),E([g({context:S})],W.prototype,`i18nStore`,void 0),E([a()],W.prototype,`showDeleteConfirm`,void 0),E([a()],W.prototype,`pendingDeleteDetails`,void 0),E([a()],W.prototype,`mailboxes`,void 0),E([a()],W.prototype,`messages`,void 0),E([a()],W.prototype,`currentMailbox`,void 0),E([a()],W.prototype,`loadingMessages`,void 0),E([a()],W.prototype,`showInitialLoader`,void 0),E([a()],W.prototype,`selectedMessage`,void 0),E([a()],W.prototype,`selectedUids`,void 0),E([a()],W.prototype,`layoutMode`,void 0),E([a()],W.prototype,`filterQuery`,void 0),E([a()],W.prototype,`expandedFolders`,void 0),E([a()],W.prototype,`username`,void 0),E([a()],W.prototype,`currentPage`,void 0),E([a()],W.prototype,`totalMessages`,void 0),E([a()],W.prototype,`messagesPerPage`,void 0),E([a()],W.prototype,`resizerPositionX`,void 0),E([a()],W.prototype,`listHeight`,void 0),E([a()],W.prototype,`isSidebarDragging`,void 0),E([a()],W.prototype,`isPaneDragging`,void 0),E([a()],W.prototype,`sidebarWidth`,void 0),E([a()],W.prototype,`isSidebarHovered`,void 0),E([a()],W.prototype,`densityMode`,void 0),E([a()],W.prototype,`isSyncing`,void 0),E([a()],W.prototype,`sidebarCollapsed`,void 0),E([a()],W.prototype,`suppressSidebarHover`,void 0),E([a()],W.prototype,`sortOrder`,void 0),E([a()],W.prototype,`listScrolled`,void 0),E([a()],W.prototype,`targetUid`,void 0),E([a()],W.prototype,`isMobile`,void 0),E([a()],W.prototype,`mobileSidebarOpen`,void 0),E([a()],W.prototype,`bulkProcessing`,void 0),W=E([m(`mailbox-page`)],W);var G=class extends d{constructor(...e){super(...e),this.contacts=[],this.sortOrder=`asc`,this.showOnlyStarred=!1,this.loading=!0,this.isSpinning=!1,this.showInitialLoader=!window.alpsAppLoaded,this.selectedContact=null,this.filterQuery=``,this.isEditing=!1,this.saving=!1,this.selectedCategory=``,this.showCreatePrompt=!1,this.showDeleteConfirm=!1,this.addedCategories=[],this.sidebarWidth=250,this.listWidth=380,this.sidebarCollapsed=!1,this.isSidebarHovered=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.hoverTimeout=null,this.suppressSidebarHover=!1,this.isSidebarDragging=!1,this.isPaneDragging=!1,this.densityMode=`compact`,this.selectedContacts=new Set,this.listScrolled=!1,this.categoryToRename=null,this.categoryToDelete=null,this.syncIntervalTimer=null,this._handleSettingsChange=()=>{if(this.settingsStore){let e=this.settingsStore.getState();if(this.sidebarCollapsed=e.sidebarCollapsed,this.densityMode=e.densityMode||`compact`,this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null),e.checkMailInterval&&e.checkMailInterval>0){let t=e.checkMailInterval*60*1e3;this.syncIntervalTimer=setInterval(()=>{this.fetchContacts()},t)}}},this._handleWindowResize=()=>{this.isMobile=window.innerWidth<=768},this._handleHashChange=()=>{this.contacts=this.contacts.filter(e=>!e.isTemporary);let e=window.location.hash.match(/^#\/contacts\/?([^\/]*)\/?(.*)$/);if(e){let t=e[1]?decodeURIComponent(e[1]):``,n=e[2]?decodeURIComponent(e[2]):``,r=t===`all`||!t?``:t;if(this.selectedCategory!==r&&(this.selectedCategory=r,this.selectedContacts=new Set,this.isMobile&&(this.mobileSidebarOpen=!1)),n){if((this.selectedContact?.uid?.replace(/^urn:uuid:/,``)||this.selectedContact?.path)!==n){if(this.contacts.length===0)return;let e=this.contacts.find(e=>(e.uid?.replace(/^urn:uuid:/,``)||e.path)===n);e&&this.selectContact(e,!1)}}else this.selectedContact=null,this.isEditing=!1}else this.selectedContact=null,this.isEditing=!1},this.startResize=e=>{e.preventDefault(),this.isPaneDragging=!0;let t=e.clientX,n=this.listWidth,r=e=>{let r=e.clientX-t;this.listWidth=Math.max(250,Math.min(800,n+r))},i=()=>{this.isPaneDragging=!1,window.removeEventListener(`mousemove`,r),window.removeEventListener(`mouseup`,i)};window.addEventListener(`mousemove`,r),window.addEventListener(`mouseup`,i)}}static{this.styles=[W.styles,z.styles,ct,n`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary, #ffffff);
      color: var(--text-primary);
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
      padding: 0;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .contact-reader-pane alps-contact-view {
      flex: 1;
      width: 100%;
    }
    
    .app-container.mobile-view.reading .contact-list-pane {
      display: none !important;
    }
    .app-container.mobile-view:not(.reading) .contact-reader-pane {
      display: none !important;
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
      color: var(--text-primary);
      white-space: pre-wrap;
    }

  `]}updated(e){if(super.updated(e),e.has(`densityMode`)){let e=this.settingsStore?.getState().densityMode||`normal`;this.dataset.density=e;let t=this.shadowRoot?.querySelector(`.contact-list-pane`);t&&(t.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),t.classList.add(`density-${e}`))}e.has(`loading`)&&this.loading&&(this.isSpinning=!0)}handleSpinIteration(){this.loading||(this.isSpinning=!1)}connectedCallback(){super.connectedCallback(),this.showInitialLoader=!window.alpsAppLoaded,this.classList.add(`density-compact`);let e=localStorage.getItem(`contacts_categories_cache`);if(e)try{this.addedCategories=JSON.parse(e)}catch{}this.fetchContacts(),window.addEventListener(`resize`,this._handleWindowResize),window.addEventListener(`hashchange`,this._handleHashChange),this.settingsStore&&(this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._handleSettingsChange()),setTimeout(()=>this._handleHashChange(),0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this._handleWindowResize),window.removeEventListener(`hashchange`,this._handleHashChange),this.settingsStore&&this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null)}get uniqueCategories(){let e=new Set(this.addedCategories);for(let t of this.contacts)if(t.categories)for(let n of t.categories)e.add(n);return Array.from(e).sort((e,t)=>e.localeCompare(t))}get username(){return this.settingsStore?.getState().loginUsername||``}async fetchContacts(){this.loading=!0;try{let e=await M.fetchContacts(this.filterQuery);this.contacts=e.contacts||[],this._handleHashChange()}catch(e){console.error(`Failed to fetch contacts`,e)}finally{this.loading=!1,this.showInitialLoader&&setTimeout(()=>{this.showInitialLoader=!1,window.alpsAppLoaded=!0},100)}}async selectContact(e,t=!0){if(e.isTemporary){this.selectedContact=e,this.isEditing=!0;return}if(t){let t=this.selectedCategory?encodeURIComponent(this.selectedCategory):`all`,n=e.uid?.replace(/^urn:uuid:/,``)||e.path;window.location.hash=`/contacts/${t}/${encodeURIComponent(n)}`;return}if(this.selectedContacts.size>0&&(this.selectedContacts=new Set),this.selectedContact?.path!==e.path){this.selectedContact={...e},this.isEditing=!1;try{let t=await M.fetchContact(e.path);this.selectedContact?.path===t.path&&(this.selectedContact=t)}catch(e){console.error(`Failed to fetch contact details`,e)}}}get allSelectedStarred(){if(this.selectedContacts.size===0)return!1;for(let e of this.selectedContacts){let t=this.contacts.find(t=>t.path===e);if(!t||!t.categories?.includes(`Favorites`))return!1}return!0}async handleToggleStar(e,t){if(e.stopPropagation(),t.isTemporary)return;let n=t.categories?[...t.categories]:[],r=n.includes(Dt);r?n=n.filter(e=>e!==Dt):n.push(Dt),this.contacts=this.contacts.map(e=>e.path===t.path?{...e,categories:n}:e);try{let e={name:t.name||``,email:t.email||``,phone:t.phone||``,organization:t.organization||``,address:t.address||``,birthday:t.birthday||``,note:t.note||``,url:t.url||``,nickname:t.nickname||``,categories:n};await M.updateContact(t.path,e),this.selectedContact?.path===t.path&&(this.selectedContact={...this.selectedContact,categories:n})}catch(e){console.error(`Failed to toggle star:`,e),r?t.categories.push(Dt):t.categories=t.categories.filter(e=>e!==Dt),this.requestUpdate()}}handleSelectAll(e){let t=e;if(t.detail?t.detail.checked:e.target.checked){let e=this.contacts.filter(e=>!(this.selectedCategory&&(!e.categories||!e.categories.includes(this.selectedCategory))));this.selectedContacts=new Set(e.map(e=>e.path))}else this.selectedContacts=new Set}handleSelectContact(e,t){e.stopPropagation();let n=new Set(this.selectedContacts);n.has(t)?n.delete(t):n.add(t),this.selectedContacts=n}handleCreateCategorySubmit(e){let t=e.detail.name?.trim();t&&(this.addedCategories.includes(t)||(this.addedCategories=[...this.addedCategories,t],localStorage.setItem(`contacts_categories_cache`,JSON.stringify(this.addedCategories)))),this.showCreatePrompt=!1}handleCreateNew(){this.selectedContacts=new Set;let e={name:this.i18nStore?.t(`contacts.unnamedContact`),categories:this.selectedCategory?[this.selectedCategory]:[],isTemporary:!0};this.contacts=this.contacts.filter(e=>!e.isTemporary),this.contacts=[e,...this.contacts],this.selectedContact=e,this.isEditing=!0}async handleRenameCategorySubmit(e){let t=e.detail.name?.trim();if(!t||!this.categoryToRename||t===this.categoryToRename){this.categoryToRename=null;return}let n=this.categoryToRename;this.categoryToRename=null,this.addedCategories.includes(n)&&(this.addedCategories=this.addedCategories.map(e=>e===n?t:e),localStorage.setItem(`contacts_categories_cache`,JSON.stringify(this.addedCategories))),this.selectedCategory===n&&(this.selectedCategory=t,window.location.hash=`/contacts/${encodeURIComponent(t)}`);let r=this.contacts.filter(e=>e.categories?.includes(n));if(r.length>0){this.saving=!0;try{let e=r.map(e=>{let r=e.categories.map(e=>e===n?t:e);return{...e,categories:r}});await M.bulkUpdateContacts(e),this.fetchContacts()}catch(e){console.error(`Error renaming category`,e)}finally{this.saving=!1}}}async handleDeleteCategorySubmit(){if(!this.categoryToDelete)return;let e=this.categoryToDelete;this.categoryToDelete=null,this.addedCategories.includes(e)&&(this.addedCategories=this.addedCategories.filter(t=>t!==e),localStorage.setItem(`contacts_categories_cache`,JSON.stringify(this.addedCategories))),this.selectedCategory===e&&(this.selectedCategory=``,window.location.hash=`/contacts/all`);let t=this.contacts.filter(t=>t.categories?.includes(e));if(t.length>0){this.saving=!0;try{let n=t.map(t=>{let n=t.categories.filter(t=>t!==e);return{...t,categories:n}});await M.bulkUpdateContacts(n),this.fetchContacts()}catch(e){console.error(`Error deleting category`,e)}finally{this.saving=!1}}}handleEdit(){this.isEditing=!0}handleCancelEdit(){this.isEditing=!1,this.selectedContact?.isTemporary&&(this.selectedContact=null,this.contacts=this.contacts.filter(e=>!e.isTemporary),this.selectedCategory||(window.location.hash=`/contacts/all`))}async handleSave(e){this.saving=!0;try{e.categories&&typeof e.categories==`string`?e.categories=e.categories.split(`,`).map(e=>e.trim()).filter(e=>e):e.categories=[];let t;t=this.selectedContact&&!this.selectedContact.isTemporary?await M.updateContact(this.selectedContact.path,e):await M.createContact(e);let n={...e,path:t.path||(this.selectedContact&&!this.selectedContact.isTemporary?this.selectedContact.path:``)},r=this.contacts.findIndex(e=>this.selectedContact&&(e.path===this.selectedContact.path||e.isTemporary&&this.selectedContact.isTemporary));r>-1?(this.contacts[r]={...this.contacts[r],...n},delete this.contacts[r].isTemporary,this.contacts=[...this.contacts]):this.contacts=[n,...this.contacts],this.selectedContact={...this.selectedContact,...n},delete this.selectedContact.isTemporary}catch(e){console.error(`Error saving contact`,e)}finally{this.saving=!1}}handleSaveEvent(e){this.handleSave(e.detail)}async handleToggleStarEvent(){let e=this.selectedContacts.size>1?Array.from(this.selectedContacts):[this.selectedContact?.path].filter(Boolean);if(e.length===0)return;let t=e.length>1?this.allSelectedStarred:this.contacts.find(t=>t.path===e[0])?.categories?.includes(`Favorites`)||!1;this.saving=!0;try{let n=e.map(e=>{let n=this.contacts.findIndex(t=>t.path===e);if(n===-1)return;let r=this.contacts[n],i=r.categories?[...r.categories]:[];return t?i=i.filter(e=>e!==Dt):i.includes(`Favorites`)||i.push(Dt),this.contacts[n]={...r,categories:i},this.selectedContact?.path===e&&(this.selectedContact={...this.selectedContact,categories:i}),{...r,categories:i}}).filter(Boolean);this.contacts=[...this.contacts],await M.bulkUpdateContacts(n)}catch(e){console.error(`Error toggling star`,e)}finally{this.saving=!1}}handleDelete(){this.showDeleteConfirm=!0}async confirmDelete(){this.showDeleteConfirm=!1,this.saving=!0;try{let e=this.selectedContacts.size>1?Array.from(this.selectedContacts):[this.selectedContact?.path].filter(Boolean);await M.bulkDeleteContacts(e),this.selectedContact=null,this.selectedContacts.size>1&&(this.selectedContacts=new Set),this.isEditing=!1,this.fetchContacts()}catch(e){console.error(`Error deleting contacts`,e),alert(`Failed to delete one or more contacts`)}finally{this.saving=!1}}async handleUpdateCategories(e){let t=e.detail.category;typeof t==`string`&&(t=t.trim()),t&&!this.addedCategories.includes(t)&&(this.addedCategories=[...this.addedCategories,t],localStorage.setItem(`contacts_categories_cache`,JSON.stringify(this.addedCategories)));let n=this.selectedContacts.size>1?Array.from(this.selectedContacts):[this.selectedContact?.path].filter(Boolean);if(n.length!==0){this.saving=!0;try{let e=n.map(e=>{let n=this.contacts.findIndex(t=>t.path===e);if(n===-1)return;let r=this.contacts[n],i=r.categories?[...r.categories]:[];return t===``?i=[]:i.includes(t)?i=i.filter(e=>e!==t):i.push(t),this.contacts[n]={...r,categories:i},this.selectedContact?.path===e&&(this.selectedContact={...this.selectedContact,categories:i}),{...r,categories:i}}).filter(Boolean);if(await M.bulkUpdateContacts(e),this.contacts=[...this.contacts],this.selectedContact&&this.selectedContacts.size<=1&&this.selectedCategory!==``&&!this.selectedContact.categories?.includes(this.selectedCategory)){let e=this.selectedContact.uid?.replace(/^urn:uuid:/,``)||this.selectedContact.path;e&&(window.location.hash=`#/contacts/all/${encodeURIComponent(e)}`)}this.selectedCategory!==``&&this.selectedCategory!==`All Contacts`&&this.fetchContacts()}catch(e){console.error(`Error updating categories`,e)}finally{this.saving=!1}}}render(){return s`
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
      <div class="app-container layout-vertical ${this.sidebarCollapsed&&!this.isMobile?`collapsed`:``} ${this.isPaneDragging||this.isSidebarDragging?`dragging`:``} ${this.isMobile?`mobile-view`:``} ${this.suppressSidebarHover?`suppress-sidebar-hover`:``} ${this.isMobile&&this.selectedContact?`reading`:``}" style="${!this.sidebarCollapsed&&!this.isMobile?`--sidebar-width: ${this.sidebarWidth}px;`:``}">
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
            @drag-end=${()=>{this.isSidebarDragging=!1,this.isMobile?this.mobileSidebarOpen=!1:this.suppressSidebarHover=!0}}
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
              @close=${()=>{this.selectedContact=null,this.isEditing=!1,window.location.hash=`/contacts/${encodeURIComponent(this.selectedCategory||`all`)}`}}
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
    `}};E([g({context:S})],G.prototype,`i18nStore`,void 0),E([g({context:C})],G.prototype,`settingsStore`,void 0),E([a()],G.prototype,`contacts`,void 0),E([a()],G.prototype,`sortOrder`,void 0),E([a()],G.prototype,`showOnlyStarred`,void 0),E([a()],G.prototype,`loading`,void 0),E([a()],G.prototype,`isSpinning`,void 0),E([a()],G.prototype,`showInitialLoader`,void 0),E([a()],G.prototype,`selectedContact`,void 0),E([a()],G.prototype,`filterQuery`,void 0),E([a()],G.prototype,`isEditing`,void 0),E([a()],G.prototype,`saving`,void 0),E([a()],G.prototype,`selectedCategory`,void 0),E([a()],G.prototype,`showCreatePrompt`,void 0),E([a()],G.prototype,`showDeleteConfirm`,void 0),E([a()],G.prototype,`addedCategories`,void 0),E([a()],G.prototype,`sidebarWidth`,void 0),E([a()],G.prototype,`listWidth`,void 0),E([a()],G.prototype,`sidebarCollapsed`,void 0),E([a()],G.prototype,`isSidebarHovered`,void 0),E([a()],G.prototype,`isMobile`,void 0),E([a()],G.prototype,`mobileSidebarOpen`,void 0),E([a()],G.prototype,`suppressSidebarHover`,void 0),E([a()],G.prototype,`isSidebarDragging`,void 0),E([a()],G.prototype,`isPaneDragging`,void 0),E([a()],G.prototype,`densityMode`,void 0),E([a()],G.prototype,`selectedContacts`,void 0),E([a()],G.prototype,`listScrolled`,void 0),E([a()],G.prototype,`categoryToRename`,void 0),E([a()],G.prototype,`categoryToDelete`,void 0),G=E([m(`contacts-page`)],G);var K=class extends d{constructor(...e){super(...e),this.contact=null,this.isEditing=!1,this.saving=!1,this.uniqueCategories=[],this.isMobile=!1,this.selectedCount=0,this.allSelectedStarred=!1,this.scrolled=!1,this.editForm={},this.isDirty=!1,this.newCategoryName=``,this.saveTimeout=null}handleAddCategory(){let e=this.newCategoryName.trim();if(e){this.dispatchEvent(new CustomEvent(`update-categories`,{detail:{category:e},bubbles:!0,composed:!0})),this.newCategoryName=``;let t=this.shadowRoot?.querySelector(`alps-popup`);t&&t.close()}}static{this.styles=[ct,n`
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
      color: var(--text-primary);
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
      color: var(--text-primary);
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
    `}get isStarred(){return this.selectedCount>1?this.allSelectedStarred:this.contact?.categories?.includes(`Favorites`)||!1}get formattedBirthday(){if(!this.contact?.birthday)return``;let e=new Date(this.contact.birthday);return isNaN(e.getTime())?this.contact.birthday:qe(e,this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,`24`).split(` `)[0]}render(){return!this.contact&&!this.isEditing&&this.selectedCount===0?s`
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
              style="flex: 1; padding: 4px 8px; border: 1px solid var(--border-color, #e5e7eb); border-radius: 4px; font-size: 13px; outline: none; min-width: 0; background: var(--bg-primary, #ffffff); color: var(--text-primary);">
            <alps-button variant="normal" @click=${this.handleAddCategory} style="--btn-padding: 4px 12px; --btn-font-size: 13px;">${this.i18nStore?.t(`contacts.add`)||`Add`}</alps-button>
          </div>
          
          ${this.contact?.categories&&this.contact.categories.length>0||this.uniqueCategories.length>0?s`<div class="dropdown-divider"></div>`:``}

          ${this.uniqueCategories.map(e=>{let t=this.contact?.categories?.includes(e);return s`
              <button class="dropdown-item ${t?`active`:``}" @click=${t=>{t.stopPropagation(),this.dispatchEvent(new CustomEvent(`update-categories`,{detail:{category:e},bubbles:!0,composed:!0}))}}>
                ${t?T(`check`):s`<div style="width: 16px;"></div>`}
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
          <alps-avatar .name=${this.isEditing?this.editForm.name||this.editForm.email||`Unknown`:this.contact?.name||this.contact?.email||`Unknown`} .email=${this.isEditing?this.editForm.email:this.contact?.email} .src=${this.contact?.avatar||``} .size=${100}></alps-avatar>
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
            <textarea class="edit-textarea" placeholder="${this.i18nStore?.t(`contacts.publicKey`)||`GPG Public Key Block`}" .value=${this.editForm.public_key||``} @input=${e=>this.handleInput(`public_key`,e.target.value)} style="font-family: monospace; white-space: pre;"></textarea>
          </div>
        `:s`
          <div class="view-header" style="margin-top: -32px;">
            <div class="view-name">
              ${this.contact.name||this.contact.email||this.i18nStore?.t(`contacts.unnamedContact`)||`Unnamed Contact`} ${this.contact.nickname?`(${this.contact.nickname})`:``}
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
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.publicKey`)||`Public Key`,this.contact.public_key)}
          </div>
        `}
        `}
      </div>
    `}};E([o({type:Object})],K.prototype,`contact`,void 0),E([o({type:Boolean})],K.prototype,`isEditing`,void 0),E([o({type:Boolean})],K.prototype,`saving`,void 0),E([o({type:Array})],K.prototype,`uniqueCategories`,void 0),E([o({type:Boolean})],K.prototype,`isMobile`,void 0),E([o({type:Number})],K.prototype,`selectedCount`,void 0),E([o({type:Boolean})],K.prototype,`allSelectedStarred`,void 0),E([a()],K.prototype,`scrolled`,void 0),E([g({context:S})],K.prototype,`i18nStore`,void 0),E([g({context:L})],K.prototype,`composeStore`,void 0),E([g({context:C,subscribe:!0})],K.prototype,`settingsStore`,void 0),E([a()],K.prototype,`editForm`,void 0),E([a()],K.prototype,`isDirty`,void 0),E([a()],K.prototype,`newCategoryName`,void 0),K=E([m(`alps-contact-view`)],K);var An=e({});y.registerRoute({path:`/contacts/*`,component:`contacts-page`}),y.registerNavTab({id:`contacts`,pluginId:`carddav`,labelKey:`navigation.contacts`,icon:`users`,order:10}),y.registerHook(`composer:send`,async({recipients:e})=>{if(!(!e||!Array.isArray(e)))for(let t of e){let e=t,n=``,r=t.match(/^(.*?)\s*<([^>]+)>$/);r&&r[2]?(n=r[1].replace(/^["']|["']$/g,``).trim(),e=r[2]):e=e.trim();try{await M.createContact({name:n,email:e})}catch(e){console.error(`Failed to auto-save contact`,e)}}}),y.registerHook(`composer:suggest`,async({query:e})=>{try{return((await M.fetchContacts(e)).contacts||[]).map(e=>({name:e.name||``,address:e.email||``})).filter(e=>e.address)}catch(e){return console.error(`Failed to fetch contact suggestions`,e),[]}});var jn=class extends d{constructor(...e){super(...e),this.label=``,this.description=``}static{this.styles=n`
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
    `}};E([o({type:String})],jn.prototype,`label`,void 0),E([o({type:String})],jn.prototype,`description`,void 0),jn=E([m(`alps-setting-group`)],jn);var q=class extends d{constructor(...e){super(...e),this.loading=!0,this.generating=!1,this.importing=!1,this.importError=``,this.keyring=null,this.pubKeyInput=``,this.privKeyInput=``,this.viewState=`default`,this.showPassphrasePrompt=!1,this.passphrasePromptMode=`lock`,this.showPurgeConfirm=!1,this.resolvePassphrase=null,this.resolveError=null}static{this.styles=n`
        :host {
            display: block;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }
        label {
            font-size: 14px;
            font-weight: 500;
        }
        textarea {
            width: 100%;
            height: 150px;
            padding: 12px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            box-sizing: border-box;
            background: var(--bg-secondary);
            color: var(--text-color);
        }
        .actions {
            display: flex;
            gap: 12px;
        }
        .key-info {
            font-family: monospace;
            background: var(--bg-secondary);
            padding: 16px;
            border-radius: 4px;
            word-break: break-all;
            white-space: pre-wrap;
            font-size: 12px;
        }
        .empty-state {
            color: var(--text-muted);
            font-style: italic;
            padding: 16px 0;
            text-align: left;
        }
    `}async connectedCallback(){super.connectedCallback(),await this.fetchKeys()}async fetchKeys(){this.loading=!0;try{let e=await j(`/gpg/keys`);if(e.ok){let t=await e.json();t.public_key?this.keyring=t:this.keyring=null}}catch(e){console.error(e)}finally{this.loading=!1}}promptForPassphrase(e=`lock`){return this.passphrasePromptMode=e,this.showPassphrasePrompt=!0,new Promise(e=>{this.resolvePassphrase=e})}showErrorDialog(e){return this.importError=e,new Promise(e=>{this.resolveError=e})}clearError(){this.importError=``,this.resolveError&&=(this.resolveError(),null)}async getConfirmedPassphrase(){for(;;){let e=await this.promptForPassphrase(`lock`);if(!e)return null;let t=await this.promptForPassphrase(`confirm`);if(!t)return null;if(e===t)return e;await this.showErrorDialog(this.i18nStore?.t(`gpg.passphraseMismatch`))}}handlePassphraseSubmit(e){this.resolvePassphrase&&=(this.resolvePassphrase(e),null),this.showPassphrasePrompt=!1}handlePassphraseCancel(){this.resolvePassphrase&&=(this.resolvePassphrase(null),null),this.showPassphrasePrompt=!1}async generateKeys(){let e=await this.getConfirmedPassphrase();if(e){this.generating=!0;try{let{privateKey:t,publicKey:n}=await(await x(()=>import(`./openpgp-DR5IM9o-.js`).then(e=>e.t),__vite__mapDeps([0,1]))).generateKey({type:`ecc`,curve:`curve25519`,userIDs:[{name:`ALPS User`,email:``}],passphrase:e});await j(`/gpg/keys`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({public_key:n,encrypted_private_key:t})}),await this.fetchKeys()}catch(e){alert(this.i18nStore?.t(`gpg.generateFailed`,{error:e.message}))}finally{this.generating=!1}}}async importKeys(){if(!this.pubKeyInput||!this.privKeyInput){this.importError=this.i18nStore?.t(`gpg.importMissing`);return}this.importing=!0;let e,t;try{e=await x(()=>import(`./openpgp-DR5IM9o-.js`).then(e=>e.t),__vite__mapDeps([0,1])),await e.readKey({armoredKey:this.pubKeyInput}),t=await e.readPrivateKey({armoredKey:this.privKeyInput})}catch(e){this.importing=!1,this.importError=this.i18nStore?.t(`gpg.importFailed`,{error:e.message});return}this.importing=!1;let n=await this.getConfirmedPassphrase();if(n){this.importing=!0;try{let r=await e.encryptKey({privateKey:t,passphrase:n});await j(`/gpg/keys`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({public_key:this.pubKeyInput,encrypted_private_key:r})}),this.pubKeyInput=``,this.privKeyInput=``,this.viewState=`default`,await this.fetchKeys()}catch(e){this.importError=this.i18nStore?.t(`gpg.importFailed`,{error:e.message})}finally{this.importing=!1}}}async purgeKeys(){this.loading=!0,this.showPurgeConfirm=!1,await j(`/gpg/keys`,{method:`DELETE`}),this.keyring=null,sessionStorage.removeItem(`gpg_private_key`),this.loading=!1}render(){return this.loading||this.generating?s`<alps-loader full-height .text=${this.generating?`Generating keypair...`:`Loading...`}></alps-loader>`:s`
            ${this.keyring?s`
                <alps-setting-group label="${this.i18nStore?.t(`settings.gpg`)}" description="${this.i18nStore?.t(`gpg.keyStoredSecurely`)}">
                    <div class="key-info">${this.keyring.public_key}</div>

                    <div class="actions">
                        <alps-button variant="danger" @click=${()=>this.showPurgeConfirm=!0}>${this.i18nStore?.t(`gpg.purgeKeys`)}</alps-button>
                    </div>
                </alps-setting-group>
            `:this.viewState===`import`?s`
                <alps-setting-group label="${this.i18nStore?.t(`gpg.importExistingKeys`)}">
                    <alps-setting-group description="${this.i18nStore?.t(`gpg.importUnencryptedDesc`)}" style="margin-bottom: 24px;"></alps-setting-group>
                    
                    <alps-setting-group label="${this.i18nStore?.t(`gpg.publicKeyBlock`)}" style="margin-bottom: 24px;">
                        <textarea .value=${this.pubKeyInput} @input=${e=>this.pubKeyInput=e.target.value}></textarea>
                    </alps-setting-group>

                    <alps-setting-group label="${this.i18nStore?.t(`gpg.privateKeyBlock`)}" style="margin-bottom: 24px;">
                        <textarea .value=${this.privKeyInput} @input=${e=>this.privKeyInput=e.target.value}></textarea>
                    </alps-setting-group>

                    <div class="actions">
                        <alps-button variant="primary" ?disabled=${!this.pubKeyInput||!this.privKeyInput} ?spinning=${this.importing} @click=${this.importKeys}>${this.i18nStore?.t(`general.save`)}</alps-button>
                        <alps-button variant="normal" @click=${()=>this.viewState=`default`}>${this.i18nStore?.t(`general.cancel`)}</alps-button>
                    </div>
                </alps-setting-group>
            `:s`
                <alps-setting-group label="${this.i18nStore?.t(`settings.gpg`)}" description="${this.i18nStore?.t(`gpg.enableEncryptionDesc`)}">
                    <div class="empty-state">${this.i18nStore?.t(`gpg.noKeyPresent`)}</div>
                    <div class="actions">
                        <alps-button variant="primary" @click=${this.generateKeys}>${this.i18nStore?.t(`gpg.generateNewKeypair`)}</alps-button>
                        <alps-button variant="normal" @click=${()=>this.viewState=`import`}>${this.i18nStore?.t(`gpg.importExistingKeys`)}</alps-button>
                    </div>
                </alps-setting-group>
            `}

            ${this.showPassphrasePrompt?s`
                <ui-prompt
                    title="${this.passphrasePromptMode===`confirm`?this.i18nStore?.t(`gpg.passphraseConfirmTitle`):this.i18nStore?.t(`gpg.passphraseSetTitle`)}"
                    confirmText="${this.passphrasePromptMode===`confirm`?this.i18nStore?.t(`gpg.confirm`):this.i18nStore?.t(`gpg.lock`)}"
                    cancelText="${this.i18nStore?.t(`general.cancel`)}"
                    .fields=${[{id:`passphrase`,label:this.passphrasePromptMode===`confirm`?this.i18nStore?.t(`gpg.passphraseConfirmPrompt`):this.i18nStore?.t(`gpg.passphraseLockPrompt`),type:`password`,placeholder:this.i18nStore?.t(`gpg.passphrase`),autofocus:!0}]}
                    @submit=${e=>this.handlePassphraseSubmit(e.detail.passphrase)}
                    @cancel=${this.handlePassphraseCancel}
                ></ui-prompt>
            `:``}
            ${this.importError?s`
                <ui-modal title="${this.i18nStore?.t(`gpg.importFailedTitle`)}" @cancel=${this.clearError}>
                    <div style="padding: 16px; white-space: pre-wrap; font-family: monospace; font-size: 13px;">${this.importError}</div>
                    <alps-button slot="actions" @click=${this.clearError}>OK</alps-button>
                </ui-modal>
            `:``}

            ${this.showPurgeConfirm?s`
                <ui-confirm
                    title="${this.i18nStore?.t(`gpg.purgeKeys`)}"
                    message="${this.i18nStore?.t(`gpg.purgeConfirm`)}"
                    confirmText="${this.i18nStore?.t(`gpg.purgeKeys`)}"
                    cancelText="${this.i18nStore?.t(`general.cancel`)}"
                    isDanger
                    @confirm=${this.purgeKeys}
                    @cancel=${()=>this.showPurgeConfirm=!1}
                ></ui-confirm>
            `:``}
        `}};E([g({context:S,subscribe:!0})],q.prototype,`i18nStore`,void 0),E([a()],q.prototype,`loading`,void 0),E([a()],q.prototype,`generating`,void 0),E([a()],q.prototype,`importing`,void 0),E([a()],q.prototype,`importError`,void 0),E([a()],q.prototype,`keyring`,void 0),E([a()],q.prototype,`pubKeyInput`,void 0),E([a()],q.prototype,`privKeyInput`,void 0),E([a()],q.prototype,`viewState`,void 0),E([a()],q.prototype,`showPassphrasePrompt`,void 0),E([a()],q.prototype,`passphrasePromptMode`,void 0),E([a()],q.prototype,`showPurgeConfirm`,void 0),q=E([m(`alps-gpg-settings`)],q);function Mn(e,t){return new Promise(n=>{let r=document.createElement(`ui-prompt`);r.title=t?.t(`gpg.passphraseRequired`),r.confirmText=t?.t(`gpg.unlock`),r.cancelText=t?.t(`general.cancel`);let i=t?.t(`gpg.passphrasePrompt`);e&&(i+=` (Error: ${e})`),r.fields=[{id:`passphrase`,label:i,type:`password`,placeholder:t?.t(`gpg.passphrase`),autofocus:!0}];let a=()=>{r.parentNode&&r.parentNode.removeChild(r)};r.addEventListener(`submit`,e=>{n(e.detail.passphrase),a()}),r.addEventListener(`cancel`,()=>{n(null),a()}),document.body.appendChild(r)})}var Nn=null;async function Pn(e,t){if(Nn)return Nn;let n=sessionStorage.getItem(`gpg_private_key`);if(n)return Nn=await e.readPrivateKey({armoredKey:n}),Nn;let r=await j(`/gpg/keys`);if(!r.ok)throw Error(`Failed to fetch GPG keyring.`);let i=await r.json();if(!i.encrypted_private_key)throw Error(`No private key found on server. Please generate one in Settings.`);let a=await e.readPrivateKey({armoredKey:i.encrypted_private_key});if(a.isDecrypted())return Nn=a,Nn;{let n,r=await Mn(n,t);for(;r!==null;)try{let t=await e.decryptKey({privateKey:a,passphrase:r});return Nn=t,sessionStorage.setItem(`gpg_private_key`,t.armor()),Nn}catch(e){n=`Incorrect passphrase: `+e.message,r=await Mn(n,t)}throw Error(`Passphrase prompt cancelled.`)}}async function Fn(e){let{instance:t,formData:n,composer:r}=e;if(!t.encryptGpg)return n;try{let e=await x(()=>import(`./openpgp-DR5IM9o-.js`).then(e=>e.t),__vite__mapDeps([0,1])),i=t.to||[],a=t.cc||[],o=t.bcc||[],s=[...i,...a,...o];if(s.length===0)return n;let c=[],l=[],u=[];try{let e=localStorage.getItem(`alps_settings`);if(e){let t=JSON.parse(e);t.loginUsername&&u.push(t.loginUsername),t.identities&&t.identities.forEach(e=>{e.email&&u.push(e.email)})}}catch{}for(let t of s){let n=t.includes(`<`)?t.split(`<`)[1].split(`>`)[0].trim():t.trim();if(u.includes(n))continue;let r=(await M.fetchContacts(n)).contacts||[],i=!1;for(let t of r)if(t.public_key){let n=await e.readKey({armoredKey:t.public_key});c.push(n),i=!0;break}i||l.push(t)}if(l.length>0){let e=r.i18nStore?.t(`gpg.missingPublicKeys`);return alert(e?e.replace(`{keys}`,l.join(`\\n`)):`Cannot encrypt: Missing public keys for:\n${l.join(`\\n`)}`),!1}let d=await Pn(e,r.i18nStore),f=d.toPublic();c.push(f);let p=n.get(`text`)||``,m=n.get(`html`)||``,h=``;h=t.format===`html`&&m?m:p;let g=await e.createMessage({text:h}),_=await e.encrypt({message:g,encryptionKeys:c,signingKeys:d,format:`armored`});return n.set(`text`,_),n.set(`html`,``),n}catch(e){return alert(`GPG Encryption failed: `+e.message),!1}}async function In(e){if(typeof e.content==`string`&&e.content.includes(`-----BEGIN PGP MESSAGE-----`))try{let t=await x(()=>import(`./openpgp-DR5IM9o-.js`).then(e=>e.t),__vite__mapDeps([0,1])),n=e.content.indexOf(`-----BEGIN PGP MESSAGE-----`),r=e.content.indexOf(`-----END PGP MESSAGE-----`)+25;if(n===-1||r<=n)return e.content;let i=e.content.substring(n,r),a=await Pn(t,e.i18nStore),o=await t.readMessage({armoredMessage:i}),{data:c}=await t.decrypt({message:o,decryptionKeys:a,format:`utf8`}),l=String(c);l.includes(`<html`)||l.includes(`<body`)||l.includes(`<p>`)||l.includes(`<div`)||l.includes(`<br`)||(l=l.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/\n/g,`<br/>`));let u=e.content.substring(0,n)+l+e.content.substring(r);return e.banners=e.banners||[],e.banners.push(s`
              <alps-banner variant="info">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex; width: 16px; height: 16px;">${T(`lock`)}</span>
                  <span>${e.i18nStore?.t(`gpg.decryptedSuccess`)}</span>
                </span>
              </alps-banner>
            `),e.isHtml=!0,u}catch(t){return console.error(`Decryption failed:`,t),e.banners=e.banners||[],e.banners.push(s`
              <alps-banner variant="error">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex; width: 16px; height: 16px;">${T(`lock`)}</span>
                  <span>${e.i18nStore?.t(`gpg.decryptedFailed`)}</span>
                </span>
              </alps-banner>
            `),e.content}return e.content}var Ln=e({});y.registerSettingsTab({id:`gpg`,labelKey:`settings.gpg`,icon:`key`,component:`alps-gpg-settings`}),y.registerHook(`composer:toolbar`,e=>{let t=e.instance,n=e.composer,r=t.encryptGpg||!1;return s`
        <alps-icon-btn 
            title="${n.i18nStore?.t(`gpg.toggleEncryption`)}" 
            icon="lock"
            ?active=${r}
            @click=${()=>{n.composeStore.updateComposer(t.id,{encryptGpg:!r})}}>
        </alps-icon-btn>
    `}),y.registerHook(`composer:presend`,Fn),y.registerHook(`reader:content`,In);var Rn=class{static extractVisualState(e){let t=e.match(/^# ALPS_VISUAL_STATE: (.*)$/m);if(!t)return null;try{return JSON.parse(atob(t[1]))}catch{return null}}static compile(e){if(e.rules.length===0)return``;let t=new Set;for(let n of e.rules){for(let e of n.actions)e.type===`fileinto`&&(t.add(`fileinto`),t.add(`mailbox`));for(let e of n.conditions)e.field.toLowerCase()===`body`&&t.add(`body`)}let n=``;t.size>0&&(n+=`require [${Array.from(t).map(e=>`"${e}"`).join(`, `)}];\n\n`),n+=`# ALPS_VISUAL_STATE: ${btoa(JSON.stringify(e))}\n\n`;for(let t of e.rules){if(t.conditions.length===0||t.actions.length===0)continue;let e=t.conditions.map(e=>this.compileCondition(e)),r=``;r=e.length===1?`if ${e[0]}`:t.matchType===`all`?`if allof (${e.join(`, `)})`:`if anyof (${e.join(`, `)})`,n+=`${r} {\n`;for(let e of t.actions)n+=`  ${this.compileAction(e)}\n`;n+=`}

`}return n}static compileCondition(e){let t=e.field.toLowerCase();if(t===`size`)return`size :${e.operator} ${e.value}`;if(t===`body`)return`body :text :${e.operator===`contains`?`contains`:`is`} "${e.value.replace(/"/g,`\\"`)}"`;let n=``,r=``;return e.operator===`contains`?(n=``,r=`:contains`):e.operator===`not_contains`?(n=`not `,r=`:contains`):e.operator===`is`?(n=``,r=`:is`):e.operator===`not_is`&&(n=`not `,r=`:is`),`${n}header ${r} "${e.field}" "${e.value.replace(/"/g,`\\"`)}"`}static compileAction(e){switch(e.type){case`fileinto`:return`fileinto :create "${e.value}";`;case`discard`:return`discard;`;case`redirect`:return`redirect "${e.value}";`;case`stop`:return`stop;`}return``}},zn=new class{async fetchScript(){let e=await j(`/managesieve/script`);if(!e.ok)throw Error(`Failed to fetch script: ${e.statusText}`);return e.json()}async saveScript(e,t=`PUT`){let n=await j(`/managesieve/script`,{method:t,headers:{"Content-Type":`application/json`},body:JSON.stringify({content:e})}),r=await n.json();if(!n.ok)throw Error(r.error||`Failed to save script`);return r}async validateScript(e){let t=await j(`/managesieve/validate`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({content:e})}),n=await t.json();if(!t.ok)throw Error(n.error||`Validation failed`);return n}async fetchFolders(){let e=await j(`/mailboxes/INBOX`);if(!e.ok)throw Error(`Failed to fetch mailboxes: ${e.statusText}`);return e.json()}},Bn=class extends d{constructor(...e){super(...e),this.initialScript=null,this.isDirty=!1,this.script=``,this.isValidating=!1,this.isSaving=!1}static{this.styles=n`
		.editor-container {
			display: flex;
			flex-direction: column;
			gap: 16px;
			width: 100%;
			height: 400px;
			margin-top: 12px;
		}

		.code-area {
			position: relative;
			flex: 1;
			width: 100%;
			border: 1px solid var(--border-color, #ccc);
			border-radius: var(--input-radius, 6px);
			background-color: var(--bg-primary, #fff);
			overflow: hidden;
		}
		.highlight-layer, textarea {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			padding: 12px;
			margin: 0;
			border: none;
			font-family: monospace;
			font-size: 14px;
			line-height: 1.5;
			box-sizing: border-box;
			white-space: pre-wrap;
			word-wrap: break-word;
			overflow-y: auto;
			tab-size: 4;
		}
		.highlight-layer {
			color: var(--text-primary, #000);
			z-index: 1;
			pointer-events: none;
		}
		textarea {
			color: transparent;
			background: transparent;
			caret-color: var(--text-primary, #000);
			z-index: 2;
			resize: none;
			outline: none;
		}
		
		.sieve-keyword { color: #d73a49; font-weight: 600; }
		.sieve-operator { color: #005cc5; font-weight: 600; }
		.sieve-string { color: #032f62; }
		.sieve-comment { color: #6a737d; font-style: italic; }
		
		@media (prefers-color-scheme: dark) {
			.sieve-keyword { color: #ff7b72; }
			.sieve-operator { color: #79c0ff; }
			.sieve-string { color: #a5d6ff; }
			.sieve-comment { color: #8b949e; }
		}

		.actions {
			display: flex;
			gap: 12px;
			align-items: center;
		}
	`}willUpdate(e){e.has(`script`)&&(this.initialScript===null&&(this.initialScript=this.script),this.isDirty=this.script!==this.initialScript)}highlight(e){if(!e)return``;let t=e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`);return t=t.replace(/(#.*|\/\*[\s\S]*?\*\/)|("[^"\\]*(?:\\.[^"\\]*)*")|\b(require|if|else|elsif|stop|fileinto|keep|discard|redirect)\b|\b(anyof|allof|not|contains|is|matches|over|under)\b/gi,(e,t,n,r,i)=>t?`<span class="sieve-comment">${t}</span>`:n?`<span class="sieve-string">${n}</span>`:r?`<span class="sieve-keyword">${r}</span>`:i?`<span class="sieve-operator">${i}</span>`:e),t.endsWith(`
`)&&(t+=` `),h(t)}handleScroll(e){let t=e.target,n=this.shadowRoot?.querySelector(`.highlight-layer`);n&&(n.scrollTop=t.scrollTop,n.scrollLeft=t.scrollLeft)}handleInput(e){let t=e.target;this.script=t.value,this.dispatchEvent(new CustomEvent(`script-changed`,{detail:{script:this.script}}))}async validate(){this.isValidating=!0;try{await zn.validateScript(this.script),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore.t(`managesieve.toast.valid`),timeout:3e3}}))}catch(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore.t(`managesieve.toast.networkError`),timeout:5e3,type:`error`}}))}finally{this.isValidating=!1}}async save(){this.isSaving=!0;try{await zn.saveScript(this.script,`PUT`),this.initialScript=this.script,this.isDirty=!1;let e=this.script.trim()===``?`managesieve.toast.deactivated`:`managesieve.toast.saved`;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore.t(e),timeout:3e3}}))}catch(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore.t(`managesieve.toast.networkError`),timeout:5e3,type:`error`}}))}finally{this.isSaving=!1}}render(){return s`
			<div class="editor-container">
				<div class="code-area">
					<div class="highlight-layer">${this.highlight(this.script)}</div>
					<textarea .value=${this.script} @input=${this.handleInput} @scroll=${this.handleScroll} spellcheck="false"></textarea>
				</div>
				<div class="actions">
					<alps-button variant="text" ?spinning=${this.isValidating} ?disabled=${this.isSaving} @click=${this.validate}>
						${this.i18nStore.t(`managesieve.raw.validate`)}
					</alps-button>
					<div style="flex: 1;"></div>
					<alps-button variant="primary" ?spinning=${this.isSaving} ?disabled=${this.isValidating||!this.isDirty} @click=${this.save}>
						${this.i18nStore.t(`managesieve.raw.save`)}
					</alps-button>
				</div>
			</div>
		`}};E([a()],Bn.prototype,`isDirty`,void 0),E([g({context:S})],Bn.prototype,`i18nStore`,void 0),E([o({type:String})],Bn.prototype,`script`,void 0),E([a()],Bn.prototype,`isValidating`,void 0),E([a()],Bn.prototype,`isSaving`,void 0),Bn=E([m(`alps-raw-editor`)],Bn);var Vn=class extends d{constructor(...e){super(...e),this.isSaving=!1,this.initialSnapshot=``,this.state={rules:[]},this.folders=[]}willUpdate(e){e.has(`state`)&&this.initialSnapshot===``&&(this.initialSnapshot=JSON.stringify(this.state))}get isDirty(){return this.initialSnapshot!==``&&this.initialSnapshot!==JSON.stringify(this.state)}markClean(){this.initialSnapshot=JSON.stringify(this.state),this.requestUpdate()}static{this.styles=n`
		.editor-container {
			display: flex;
			flex-direction: column;
			gap: 24px;
			margin-top: 12px;
		}
		.rule-card {
			position: relative;
			border-radius: 8px;
			padding: 16px;
			background: var(--bg-secondary);
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
		.rule-header {
			position: absolute;
			top: 16px;
			right: 16px;
			display: flex;
			align-items: center;
		}
		.condition-row, .action-row {
			display: flex;
			gap: 8px;
			align-items: center;
		}
		.row-label {
			width: 80px;
			font-weight: 600;
			font-size: 13px;
			color: var(--text-secondary);
			text-align: right;
		}
		.row-content {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.row-text {
			color: var(--text-secondary);
			font-size: 13px;
			font-weight: 400;
		}
		.flex-1 {
			flex: 1;
		}
		.connector {
			display: flex;
			justify-content: center;
			color: var(--text-muted);
			opacity: 0.5;
			padding: 8px 0;
			margin-left: 40px;
		}
		.connector-icon {
			fill: none;
			color: currentColor;
		}
		.actions-container {
			display: flex;
			gap: 16px;
			justify-content: flex-end;
		}
		.empty-state {
			color: var(--text-muted);
			font-style: italic;
			padding: 16px 0;
			text-align: left;
		}
	`}addRule(){this.state={...this.state,rules:[...this.state.rules,{id:Math.random().toString(36).substring(7),matchType:`all`,conditions:[{field:`Subject`,operator:`contains`,value:``}],actions:[{type:`fileinto`,value:this.folders[0]||`INBOX`}]}]},this.notifyChange()}deleteRule(e){let t=[...this.state.rules];t.splice(e,1),this.state={...this.state,rules:t},this.notifyChange()}updateRule(e,t){let n=[...this.state.rules];n[e]={...n[e],...t},this.state={...this.state,rules:n},this.notifyChange()}addCondition(e,t){let n=this.state.rules[e],r={field:`Subject`,operator:`contains`,value:``},i=[...n.conditions];t===void 0?i.push(r):i.splice(t,0,r),this.updateRule(e,{conditions:i})}deleteCondition(e,t){let n=[...this.state.rules[e].conditions];n.splice(t,1),this.updateRule(e,{conditions:n})}updateCondition(e,t,n){let r=[...this.state.rules[e].conditions],i=r[t];n.field&&n.field!==i.field&&(n.field===`Size`?i.operator!==`over`&&i.operator!==`under`&&(n.operator=`over`):(i.operator===`over`||i.operator===`under`)&&(n.operator=`contains`)),r[t]={...i,...n},this.updateRule(e,{conditions:r})}addAction(e,t){let n=this.state.rules[e],r={type:`fileinto`,value:this.folders[0]||`INBOX`},i=[...n.actions];t===void 0?i.push(r):i.splice(t,0,r),this.updateRule(e,{actions:i})}deleteAction(e,t){let n=[...this.state.rules[e].actions];n.splice(t,1),this.updateRule(e,{actions:n})}updateAction(e,t,n){let r=[...this.state.rules[e].actions];r[t]={...r[t],...n},this.updateRule(e,{actions:r})}notifyChange(){this.dispatchEvent(new CustomEvent(`state-changed`,{detail:{state:this.state}}))}save(){this.dispatchEvent(new CustomEvent(`save-requested`))}render(){return s`
			<div class="editor-container">
				${this.state.rules.length===0?s`
					<div class="empty-state">${this.i18nStore.t(`managesieve.visual.noRules`)}</div>
				`:this.state.rules.map((e,t)=>s`
					<div class="rule-card">
						<div class="rule-header">
							<alps-icon-btn icon="x" title=${this.i18nStore.t(`managesieve.visual.deleteRule`)} @click=${()=>this.deleteRule(t)}></alps-icon-btn>
						</div>

						<div class="condition-row">
							<div class="row-label">${this.i18nStore.t(`managesieve.visual.if`)}</div>
							<div class="row-content">
								<alps-select 
									.value=${e.matchType}
									.options=${[{value:`all`,label:this.i18nStore.t(`managesieve.visual.all`)},{value:`any`,label:this.i18nStore.t(`managesieve.visual.any`)}]}
									@change=${e=>this.updateRule(t,{matchType:e.target.value})}>
								</alps-select>
								<span class="row-text">${this.i18nStore.t(`managesieve.visual.ofTheFollowing`)}</span>
							</div>
						</div>
						

						${e.conditions.map((n,r)=>s`
							<div class="condition-row">
								<div class="row-label"></div>
								<alps-select 
									.value=${n.field}
									.options=${[{value:`Subject`,label:this.i18nStore.t(`managesieve.visual.fields.subject`)},{value:`From`,label:this.i18nStore.t(`managesieve.visual.fields.from`)},{value:`To`,label:this.i18nStore.t(`managesieve.visual.fields.to`)},{value:`Body`,label:this.i18nStore.t(`managesieve.visual.fields.body`)},{value:`Size`,label:this.i18nStore.t(`managesieve.visual.fields.size`)}]}
									@change=${e=>this.updateCondition(t,r,{field:e.target.value})}>
								</alps-select>
								<alps-select 
									.value=${n.operator}
									.options=${n.field===`Size`?[{value:`over`,label:this.i18nStore.t(`managesieve.visual.operators.over`)},{value:`under`,label:this.i18nStore.t(`managesieve.visual.operators.under`)}]:[{value:`contains`,label:this.i18nStore.t(`managesieve.visual.operators.contains`)},{value:`not_contains`,label:this.i18nStore.t(`managesieve.visual.operators.not_contains`)},{value:`is`,label:this.i18nStore.t(`managesieve.visual.operators.is`)},{value:`not_is`,label:this.i18nStore.t(`managesieve.visual.operators.not_is`)}]}
									@change=${e=>this.updateCondition(t,r,{operator:e.target.value})}>
								</alps-select>
								<alps-input class="flex-1" .value=${n.value} @input=${e=>this.updateCondition(t,r,{value:e.target.value})}></alps-input>
								${e.conditions.length>1?s`<alps-icon-btn icon="minus-square" title=${this.i18nStore.t(`managesieve.visual.remove`)} @click=${()=>this.deleteCondition(t,r)}></alps-icon-btn>`:``}
								<alps-icon-btn icon="plus-square" title=${this.i18nStore.t(`managesieve.visual.add`)} @click=${()=>this.addCondition(t,r+1)}></alps-icon-btn>
							</div>
						`)}

						<div class="connector">
							<svg width="24" height="24" class="connector-icon"><use href="/assets/icons/sprite.svg?v=10#arrow-fat-lines-down"></use></svg>
						</div>

						${e.actions.map((n,r)=>s`
							<div class="action-row">
								<div class="row-label">
									${r===0?this.i18nStore.t(`managesieve.visual.then`):``}
								</div>
								<alps-select 
									.value=${n.type}
									.options=${[{value:`fileinto`,label:this.i18nStore.t(`managesieve.visual.actions.fileinto`)},{value:`redirect`,label:this.i18nStore.t(`managesieve.visual.actions.redirect`)},{value:`discard`,label:this.i18nStore.t(`managesieve.visual.actions.discard`)},{value:`stop`,label:this.i18nStore.t(`managesieve.visual.actions.stop`)}]}
									@change=${e=>this.updateAction(t,r,{type:e.target.value,value:``})}>
								</alps-select>
								${n.type===`fileinto`?s`
									<alps-select 
										class="flex-1" 
										.value=${n.value||``}
										.options=${[...this.folders.map(e=>({value:e,label:e}))]}
										@change=${e=>this.updateAction(t,r,{value:e.target.value})}>
									</alps-select>
								`:n.type===`redirect`?s`
									<alps-input type="email" class="flex-1" placeholder=${this.i18nStore.t(`managesieve.visual.fields.emailAddress`)} .value=${n.value||``} @input=${e=>this.updateAction(t,r,{value:e.target.value})}></alps-input>
								`:``}
								${e.actions.length>1?s`<alps-icon-btn icon="minus-square" title=${this.i18nStore.t(`managesieve.visual.remove`)} @click=${()=>this.deleteAction(t,r)}></alps-icon-btn>`:``}
								${n.type===`stop`?``:s`<alps-icon-btn icon="plus-square" title=${this.i18nStore.t(`managesieve.visual.add`)} @click=${()=>this.addAction(t,r+1)}></alps-icon-btn>`}
							</div>
						`)}

					</div>
				`)}
				
				<div class="actions-container" >
					<alps-button variant="normal" @click=${this.addRule}>${this.i18nStore.t(`managesieve.visual.newRule`)}</alps-button>
					${this.state.rules.length>0?s`<alps-button variant="text" @click=${()=>this.dispatchEvent(new CustomEvent(`switch-raw-requested`))}>${this.i18nStore.t(`managesieve.tabs.switchToRaw`)}</alps-button>`:``}
					<div class="flex-1"></div>
					${this.isDirty?s`<alps-button variant="primary" ?spinning=${this.isSaving} ?disabled=${this.isSaving} @click=${this.save}>${this.i18nStore.t(`managesieve.visual.saveFilters`)}</alps-button>`:``}
				</div>
			</div>
		`}};E([o({type:Boolean})],Vn.prototype,`isSaving`,void 0),E([a()],Vn.prototype,`initialSnapshot`,void 0),E([g({context:S,subscribe:!0})],Vn.prototype,`i18nStore`,void 0),E([o({type:Object})],Vn.prototype,`state`,void 0),E([o({type:Array})],Vn.prototype,`folders`,void 0),Vn=E([m(`alps-visual-editor`)],Vn);var J=class extends d{constructor(...e){super(...e),this.mode=`visual`,this.script=``,this.visualState={rules:[]},this.folders=[],this.isLoading=!0,this.isSaving=!1,this.showSwitchRawConfirm=!1}static{this.styles=n`
		.container {
			display: flex;
			flex-direction: column;
			gap: 20px;
			padding-bottom: 32px;
		}
		.switch-btn-container {
			margin-top: 16px;
			padding-top: 16px;
			border-top: 1px solid var(--border-color, #eee);
		}
	`}connectedCallback(){super.connectedCallback(),this.fetchScript(),this.fetchFolders()}async fetchScript(){try{let e=await zn.fetchScript();if(this.script=e.content||``,this.script.trim()===``)this.mode=`visual`,this.visualState={rules:[]};else{let e=Rn.extractVisualState(this.script);e?(this.visualState=e,this.mode=`visual`):this.mode=`raw`}}catch(e){console.error(`Failed to fetch Sieve script`,e),this.visualState={rules:[]},this.mode=`visual`}finally{this.isLoading=!1}}async fetchFolders(){try{let e=await zn.fetchFolders();e&&e.Mailboxes&&(this.folders=e.Mailboxes.map(e=>e.Name||e.Mailbox).filter(Boolean))}catch(e){console.error(`Failed to fetch folders`,e)}}handleVisualStateChange(e){this.visualState=e.detail.state}handleRawScriptChange(e){this.script=e.detail.script}switchToRaw(){this.showSwitchRawConfirm=!0}confirmSwitchToRaw(){this.script=Rn.compile(this.visualState),this.mode=`raw`,this.showSwitchRawConfirm=!1}async saveVisual(){this.isSaving=!0;try{let e=Rn.compile(this.visualState);this.script=e,await zn.saveScript(e,`PUT`);let t=e.trim()===``?`managesieve.toast.deactivated`:`managesieve.toast.saved`;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore.t(t),timeout:3e3}}));let n=this.shadowRoot?.querySelector(`alps-visual-editor`);n&&n.markClean&&n.markClean()}catch(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore.t(`managesieve.toast.networkError`),timeout:5e3,type:`error`}}))}finally{this.isSaving=!1}}render(){return s`
			<div class="container">
				<alps-setting-group label="${this.i18nStore.t(`managesieve.title`)}" description="${this.i18nStore.t(`managesieve.description`)}">
					${this.isLoading?s`
						<div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
							<alps-loader></alps-loader>
						</div>
					`:this.mode===`visual`?s`
						<alps-visual-editor 
							.isSaving=${this.isSaving} 
							.state=${this.visualState} 
							.folders=${this.folders}
							@state-changed=${this.handleVisualStateChange}
							@save-requested=${this.saveVisual}
							@switch-raw-requested=${this.switchToRaw}
						></alps-visual-editor>
					`:s`
						<alps-raw-editor 
							.script=${this.script}
							@script-changed=${this.handleRawScriptChange}
						></alps-raw-editor>
					`}
				</alps-setting-group>
			</div>

			${this.showSwitchRawConfirm?s`
				<ui-confirm
					title=${this.i18nStore.t(`managesieve.warningRawSwitchTitle`)}
					message="${this.i18nStore.t(`managesieve.warningRawSwitch`)}"
					confirmText=${this.i18nStore.t(`managesieve.warningRawSwitchConfirm`)}
					isDanger=${!0}
					@confirm=${this.confirmSwitchToRaw}
					@cancel=${()=>this.showSwitchRawConfirm=!1}
				></ui-confirm>
			`:``}
		`}};E([g({context:S,subscribe:!0})],J.prototype,`i18nStore`,void 0),E([a()],J.prototype,`mode`,void 0),E([a()],J.prototype,`script`,void 0),E([a()],J.prototype,`visualState`,void 0),E([a()],J.prototype,`folders`,void 0),E([a()],J.prototype,`isLoading`,void 0),E([a()],J.prototype,`isSaving`,void 0),E([a()],J.prototype,`showSwitchRawConfirm`,void 0),J=E([m(`alps-managesieve-page`)],J);var Hn=e({});y.registerSettingsTab({id:`managesieve`,labelKey:`settings.categories.filters`,icon:`sieve`,component:`alps-managesieve-page`});var Un=class extends d{constructor(...e){super(...e),this.passwordForm={old:``,new:``,confirm:``},this.isSubmitting=!1}static{this.styles=n`
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
	`}};E([g({context:S})],Un.prototype,`i18nStore`,void 0),E([a()],Un.prototype,`passwordForm`,void 0),E([a()],Un.prototype,`isSubmitting`,void 0),Un=E([m(`alps-password-settings`)],Un);var Wn=e({});y.registerSettingsTab({id:`password`,labelKey:`settings.categories.password`,icon:`password`,component:`alps-password-settings`});var Gn=class{constructor(e,t,n){this.routes=e,this.fallback=t,this.currentPath=this.getHashPath(),window.addEventListener(`hashchange`,()=>{this.currentPath=this.getHashPath(),n()})}getHashPath(){let e=window.location.hash;return!e||e===`#`?`/`:e.substring(1).split(`?`)[0]}navigate(e){window.location.hash=e}render(){if(this.routes[this.currentPath])return this.routes[this.currentPath]();for(let e in this.routes)if(e.endsWith(`/*`)&&this.currentPath.startsWith(e.replace(`/*`,``)))return this.routes[e]();return this.fallback()}},Kn=class extends d{constructor(...e){super(...e),this.icon=``,this.title=``,this.subtitle=``}static{this.styles=n`
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
            ${T(this.icon)}
          </div>
        `:``}
        ${this.title?s`<h1>${this.title}</h1>`:``}
        ${this.subtitle?s`<p class="subtitle">${this.subtitle}</p>`:``}
        
        <slot></slot>
      </div>
    `}};E([o({type:String})],Kn.prototype,`icon`,void 0),E([o({type:String})],Kn.prototype,`title`,void 0),E([o({type:String})],Kn.prototype,`subtitle`,void 0),Kn=E([m(`alps-auth-card`)],Kn);var Y=class extends d{constructor(...e){super(...e),this.username=``,this.password=``,this.rememberMe=!1,this.error=``,this.isSubmitting=!1,this.retryAfter=0,this.isRateLimited=!1,this._handleI18nChange=()=>{this.requestUpdate()}}static{this.styles=n`
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
  `}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),this.composeStore&&this.composeStore.clearAllComposers()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),this.retryCountdownInterval&&clearInterval(this.retryCountdownInterval)}startRetryCountdown(e){this.retryAfter=e,this.isRateLimited=!0,this.retryCountdownInterval&&clearInterval(this.retryCountdownInterval),this.retryCountdownInterval=setInterval(()=>{this.retryAfter--,this.retryAfter<=0&&(this.isRateLimited=!1,this.retryCountdownInterval&&=(clearInterval(this.retryCountdownInterval),void 0))},1e3)}formatRetryTime(e){if(e<60)return`${e} second${e===1?``:`s`}`;let t=Math.ceil(e/60);return`${t} minute${t===1?``:`s`}`}async handleSubmit(e){if(e.preventDefault(),this.isSubmitting)return;let t=this.shadowRoot?.querySelector(`form`);if(t&&!t.checkValidity()){t.reportValidity();return}this.error=``,this.isSubmitting=!0;try{await new Promise(e=>setTimeout(e,600));let e={username:this.username,password:this.password,"remember-me":this.rememberMe?`on`:``},t=await fetch(`/session`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)}),n=await t.json();t.ok?n.requires_2fa?(window.location.hash=`/login/webauthn`,this.isSubmitting=!1):(window.dispatchEvent(new CustomEvent(`user-logged-in`)),window.location.hash=`/mailbox/INBOX`):(t.status===429&&n.retry_after?(this.error=n.error||this.i18nStore?.t(`login.tooManyAttempts`),this.startRetryCountdown(n.retry_after)):(this.error=n.error||this.i18nStore?.t(`login.loginFailed`),this.isRateLimited=!1),this.isSubmitting=!1)}catch{this.error=this.i18nStore?.t(`login.networkError`),this.isSubmitting=!1,this.isRateLimited=!1}}render(){return s`
      <alps-auth-card 
        icon="edelweiss" 
        title="Alps" 
        subtitle="${this.i18nStore?.t(`login.subtitle`)}">
        
        ${this.error?s`
          <div class="error-container">
            <p class="error-text">
              ${this.error}
              ${this.isRateLimited&&this.retryAfter>0?s`
                <br><strong>${this.i18nStore?.t(`login.pleaseWait`)} ${this.formatRetryTime(this.retryAfter)}</strong>
              `:``}
            </p>
          </div>
        `:``}

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <div class="input-wrapper has-left-icon">
              <span class="icon-left">${T(`at`)}</span>
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
              <span class="icon-left">${T(`key`)}</span>
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
              ${this.i18nStore?.t(`login.keepMeSignedIn`)}
            </label>
          </div>
          <button 
            type="submit" 
            class="submit-btn"
            ?disabled=${this.isSubmitting||this.isRateLimited}>
            ${this.isSubmitting?s`<alps-loader style="--loader-size: 16px;"></alps-loader>`:``}
            <span>${this.isRateLimited?`${this.i18nStore?.t(`login.wait`)} ${this.formatRetryTime(this.retryAfter)}`:this.i18nStore?.t(`login.signIn`)}</span>
          </button>
        </form>
      </alps-auth-card>
    `}};E([g({context:S})],Y.prototype,`i18nStore`,void 0),E([a()],Y.prototype,`username`,void 0),E([a()],Y.prototype,`password`,void 0),E([a()],Y.prototype,`rememberMe`,void 0),E([a()],Y.prototype,`error`,void 0),E([a()],Y.prototype,`isSubmitting`,void 0),E([a()],Y.prototype,`retryAfter`,void 0),E([a()],Y.prototype,`isRateLimited`,void 0),E([g({context:L,subscribe:!0})],Y.prototype,`composeStore`,void 0),Y=E([m(`login-page`)],Y);var qn=class extends d{constructor(...e){super(...e),this.active=!1,this.icon=``}static{this.styles=n`
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
      white-space: nowrap;
      overflow: hidden;
    }

    .category-icon {
      flex-shrink: 0;
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

    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `}render(){return s`
      ${this.icon?s`
        <span class="category-icon">${T(this.icon)}</span>
      `:``}
      <span class="label"><slot></slot></span>
    `}};E([o({type:Boolean,reflect:!0})],qn.prototype,`active`,void 0),E([o({type:String})],qn.prototype,`icon`,void 0),qn=E([m(`alps-category-item`)],qn);var Jn=class extends d{constructor(...e){super(...e),this.newUsername=``,this.newPassword=``,this.newDisplayName=``,this.isSubmitting=!1,this.error=``,this.showAddForm=!1,this._handleStoreChange=()=>{this.requestUpdate()}}static{this.styles=n`
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
            text-align: left;
        }
    `}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore&&!this.linkedAccountsStore.isInitialized()&&this.linkedAccountsStore.fetchAccounts()})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.removeEventListener(`change`,this._handleStoreChange)}async handleAdd(e){if(e.preventDefault(),!(!this.newUsername||!this.newPassword)){this.isSubmitting=!0,this.error=``;try{await this.linkedAccountsStore.addAccount(this.newUsername,this.newPassword,this.newDisplayName),this.newUsername=``,this.newPassword=``,this.newDisplayName=``,this.showAddForm=!1,window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`linkedAccounts.addedSuccess`)}}))}catch(e){this.error=e.message||this.i18nStore?.t(`linkedAccounts.addError`)}finally{this.isSubmitting=!1}}}async handleRemove(e){if(confirm(this.i18nStore?.t(`linkedAccounts.removeConfirm`)))try{await this.linkedAccountsStore.removeAccount(e),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`linkedAccounts.removedSuccess`)}}))}catch(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore?.t(`linkedAccounts.removeError`)}}))}}render(){let e=this.linkedAccountsStore?.getAccounts()||[],t=this.linkedAccountsStore?.isLoading();return s`
            <alps-setting-group 
                label="${this.i18nStore?.t(`settings.categories.accounts`)}"
                description="${this.i18nStore?.t(`settings.categories.accountsDesc`)}">
                
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

                ${this.showAddForm?``:s`
                    <alps-button variant="normal" @click=${()=>this.showAddForm=!0}>
                        ${this.i18nStore?.t(`linkedAccounts.addTitle`)}
                    </alps-button>
                `}
            </alps-setting-group>

            ${this.showAddForm?s`
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
                            type="text" icon="user"
                            placeholder="${this.i18nStore?.t(`settings.identity.displayName`)} (${this.i18nStore?.t(`general.optional`)})"
                            .value=${this.newDisplayName}
                            @input=${e=>this.newDisplayName=e.target.value}
                        ></alps-input>
                    </div>

                    ${this.error?s`<div class="error-message">${this.error}</div>`:``}

                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <alps-button variant="primary" ?disabled=${this.isSubmitting||!this.newUsername||!this.newPassword} ?spinning=${this.isSubmitting} @click=${this.handleAdd}>
                            ${this.i18nStore?.t(`linkedAccounts.linkAccount`)}
                        </alps-button>
                        <alps-button variant="text" @click=${e=>{e.preventDefault(),this.showAddForm=!1}}>
                            ${this.i18nStore?.t(`general.cancel`)}
                        </alps-button>
                    </div>
                </form>
            </alps-setting-group>
            `:``}
        `}};E([g({context:S})],Jn.prototype,`i18nStore`,void 0),E([g({context:Jt})],Jn.prototype,`linkedAccountsStore`,void 0),E([a()],Jn.prototype,`newUsername`,void 0),E([a()],Jn.prototype,`newPassword`,void 0),E([a()],Jn.prototype,`newDisplayName`,void 0),E([a()],Jn.prototype,`isSubmitting`,void 0),E([a()],Jn.prototype,`error`,void 0),E([a()],Jn.prototype,`showAddForm`,void 0),Jn=E([m(`settings-accounts`)],Jn);function Yn(e){if(!e)throw Error(`base64url is null or undefined`);let t=e.replace(/-/g,`+`).replace(/_/g,`/`),n=atob(t),r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);return r.buffer}function Xn(e){let t=new Uint8Array(e),n=``;for(let e=0;e<t.byteLength;e++)n+=String.fromCharCode(t[e]);return btoa(n).replace(/\+/g,`-`).replace(/\//g,`_`).replace(/=/g,``)}async function Zn(e){e.publicKey.challenge=Yn(e.publicKey.challenge),e.publicKey.user.id=Yn(e.publicKey.user.id),e.publicKey.excludeCredentials&&(e.publicKey.excludeCredentials=e.publicKey.excludeCredentials.map(e=>({...e,id:Yn(e.id)})));let t=await navigator.credentials.create(e);if(!t)throw Error(`Credential creation failed or was cancelled.`);let n=t.response,r=n.getTransports?n.getTransports():[];return{id:t.id,rawId:Xn(t.rawId),type:t.type,response:{attestationObject:Xn(n.attestationObject),clientDataJSON:Xn(n.clientDataJSON)},transports:r}}async function Qn(e){e.publicKey.challenge=Yn(e.publicKey.challenge),e.publicKey.allowCredentials&&(e.publicKey.allowCredentials=e.publicKey.allowCredentials.map(e=>({...e,id:Yn(e.id)})));let t=await navigator.credentials.get(e);if(!t)throw Error(`Assertion failed or was cancelled.`);let n=t.response;return{id:t.id,rawId:Xn(t.rawId),type:t.type,response:{authenticatorData:Xn(n.authenticatorData),clientDataJSON:Xn(n.clientDataJSON),signature:Xn(n.signature),userHandle:n.userHandle?Xn(n.userHandle):null}}}function $n(){return window.PublicKeyCredential!==void 0&&navigator.credentials!==void 0}var er=class extends d{constructor(...e){super(...e),this.data=null,this.error=``,this.loading=!0,this.adding=!1,this.showNamePrompt=!1,this.pendingCredential=null,this.pendingDeleteId=null}static{this.styles=n`
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
        .empty-state {
            color: var(--text-muted);
            font-style: italic;
            padding: 16px 0;
            text-align: left;
        }
    `}connectedCallback(){super.connectedCallback(),this.fetchData()}async fetchData(){try{this.loading=!0;let e=await fetch(`/settings/2fa`);if(!e.ok)throw Error(`Failed to fetch settings`);this.data=await e.json()}catch(e){this.error=e.message}finally{this.loading=!1}}async handleTrustToggle(e){let t=e.target;await fetch(`/settings/2fa/trust-linked-accounts`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({trust:t.checked})}),this.fetchData()}async addCredential(){this.adding=!0,this.error=``;try{let e=await fetch(`/settings/2fa/begin`,{method:`POST`});if(!e.ok)throw Error(await e.text());let t=await Zn(await e.json());this.pendingCredential=t,this.showNamePrompt=!0,this.adding=!1}catch(e){e.name===`NotAllowedError`||e.message&&e.message.includes(`not allowed`)?this.error=``:this.error=this.i18nStore?.t(`webauthn.errors.register_failed`)||`There was an error registering your security key. Please try again.`,this.adding=!1}}async _handlePromptSubmit(e){let t=e.detail.keyName||`Security Key`;this.showNamePrompt=!1;let n={...this.pendingCredential,name:t};this.adding=!0,this.error=``;try{let e=await fetch(`/settings/2fa/finish`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(n)});if(!e.ok)throw Error(await e.text());this.fetchData()}catch{this.error=this.i18nStore?.t(`webauthn.errors.register_failed`)||`There was an error registering your security key. Please try again.`}finally{this.adding=!1,this.pendingCredential=null}}_handlePromptCancel(){this.showNamePrompt=!1,this.pendingCredential=null}removeCredential(e){this.pendingDeleteId=e}async executeRemoveCredential(){if(!this.pendingDeleteId)return;let e=this.pendingDeleteId;this.pendingDeleteId=null;try{this.error=``;let t=await fetch(`/settings/2fa/credential/${encodeURIComponent(e)}/delete`,{method:`POST`});if(!t.ok)throw Error(await t.text());this.fetchData()}catch(e){this.error=e.message||this.i18nStore?.t(`webauthn.errors.remove_failed`)}}render(){return this.loading?s`<div>Loading...</div>`:s`
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

            ${this.error?s`
                <ui-modal 
                    title="${this.i18nStore?.t(`general.error`)||`Error`}" 
                    .isDanger=${!0} 
                    .dismissible=${!0}
                    @cancel=${()=>this.error=``}>
                    <div>${this.error}</div>
                    <div slot="actions">
                        <alps-button variant="normal" @click=${()=>this.error=``}>
                            ${this.i18nStore?.t(`general.cancel`)||`Close`}
                        </alps-button>
                    </div>
                </ui-modal>
            `:``}

            ${this.pendingDeleteId?s`
                <ui-confirm
                    title="${this.i18nStore?.t(`webauthn.settings.remove_btn`)||`Remove Key`}"
                    message="${this.i18nStore?.t(`webauthn.confirm_remove`)}"
                    confirmText="${this.i18nStore?.t(`general.delete`)||`Delete`}"
                    cancelText="${this.i18nStore?.t(`general.cancel`)}"
                    isDanger
                    @confirm=${this.executeRemoveCredential}
                    @cancel=${()=>this.pendingDeleteId=null}
                ></ui-confirm>
            `:``}

            <alps-setting-group 
                label="${this.i18nStore?.t(`webauthn.settings.keys_title`)}" 
                description="${this.i18nStore?.t(`webauthn.settings.group_desc`)}">

                <div class="cred-list" style="margin-top: 0;">
                    ${this.data?.credentialCount&&this.data.credentialCount>0?s`
                        ${this.data?.credentials.map(e=>s`
                            <div class="setting-row">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="icon-container">${T(`fingerprint`)}</div>
                                    <strong>${e.Name||`Security Key`}</strong>
                                </div>
                                <div style="display: flex; align-items: center; gap: 16px;">
                                    <div style="font-size: 13px; color: var(--text-muted);">${this.i18nStore?.t(`webauthn.settings.added`)} ${new Date(e.AddedAt).toLocaleString()}</div>
                                    <alps-icon-btn icon="trash" @click=${()=>this.removeCredential(e.ID)} title=${this.i18nStore?.t(`webauthn.settings.remove_btn`)||`Remove`}></alps-icon-btn>
                                </div>
                            </div>
                        `)}
                    `:s`<div class="empty-state">${this.i18nStore?.t(`webauthn.settings.noKeys`)}</div>`}
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
        `}};E([g({context:S})],er.prototype,`i18nStore`,void 0),E([a()],er.prototype,`data`,void 0),E([a()],er.prototype,`error`,void 0),E([a()],er.prototype,`loading`,void 0),E([a()],er.prototype,`adding`,void 0),E([a()],er.prototype,`showNamePrompt`,void 0),E([a()],er.prototype,`pendingCredential`,void 0),E([a()],er.prototype,`pendingDeleteId`,void 0),er=E([m(`alps-webauthn-settings`)],er);var X=class extends d{constructor(...e){super(...e),this.category=`general`,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.username=``,this.isScrolled=!1,this.sidebarWidth=250,this.sidebarCollapsed=!1,this.isSidebarDragging=!1,this.isSidebarHovered=!1,this.hoverTimeout=null,this.suppressSidebarHover=!1,this._handleResize=()=>{this.isMobile=window.innerWidth<=768,this.isMobile||(this.mobileSidebarOpen=!1)},this._handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0},this._handleSettingsChange=()=>{this._syncState()},this._handleI18nChange=()=>{this.requestUpdate()}}static{this.styles=[$e,n`
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

    .app-container.collapsed .main-view {
      box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
      z-index: 25;
      border-left: 1px solid var(--border-color);
      position: relative;
    }

    .sidebar-wrapper.collapsed alps-category-item {
      border-radius: 6px 0 0 6px;
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 0;
    }

    alps-sidebar::part(sidebar) {
      padding-top: 0;
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
  `]}async connectedCallback(){super.connectedCallback(),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this.i18nStore?.addEventListener(`change`,this._handleI18nChange),window.addEventListener(`resize`,this._handleResize),this._syncState();try{let e=await fetch(`/session`);if(e.ok){let t=await e.json();t.Username&&(this.username=t.Username)}}catch(e){b.error(`Failed to fetch username in settings`,e)}}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),window.removeEventListener(`resize`,this._handleResize)}_syncState(){this.settingsState={...this.settingsStore.getState()},this.sidebarCollapsed=this.settingsState.sidebarCollapsed||!1}getCategoryLabel(e){switch(e){case`general`:return this.i18nStore?.t(`settings.categories.general`);case`identity`:return this.i18nStore?.t(`settings.categories.identity`);case`webauthn`:return this.i18nStore?.t(`settings.categories.webauthn`);case`accounts`:return this.i18nStore?.t(`settings.categories.accounts`);case`reading`:return this.i18nStore?.t(`settings.categories.reading`);case`appearance`:return this.i18nStore?.t(`settings.categories.appearance`);case`localization`:return this.i18nStore?.t(`settings.categories.localization`);default:let t=y.getSettingsTabs().find(t=>t.id===e);return t?this.i18nStore?.t(t.labelKey):e}}selectCategory(e){window.location.hash=`/settings/${e}`,this.isMobile&&(this.mobileSidebarOpen=!1),this.sidebarCollapsed&&!this.isMobile&&(this.suppressSidebarHover=!0)}async handleUpdate(e,t){let n=e.target,r=n.value;n.type===`checkbox`?(r=n.checked,t===`desktopNotifications`&&r===!0&&(`Notification`in window&&Notification.permission!==`granted`&&Notification.permission!==`denied`?await Notification.requestPermission()!==`granted`&&(r=!1,n.checked=!1):`Notification`in window&&Notification.permission===`denied`&&(r=!1,n.checked=!1))):(n.type===`number`||[`checkMailInterval`,`autoLogout`,`messagesPerPage`,`markReadTimeout`,`undoTimeout`].includes(t))&&(r=parseInt(n.value,10),isNaN(r)&&(r=0)),this.settingsStore.updateSettings({[t]:r})}render(){return s`
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
              ${T(`arrowLeft`)} ${this.i18nStore?.t(`messageReader.back`)}
            </button>
          `}
        </div>
        <div slot="center" class="settings-title">${this.i18nStore?.t(`settings.title`)} / ${this.getCategoryLabel(this.category)}</div>
      </alps-header>
      <div class="app-container ${this.sidebarCollapsed&&!this.isMobile?`collapsed`:``} ${this.isSidebarDragging?`dragging`:``}" style="${!this.sidebarCollapsed&&!this.isMobile?`--sidebar-width: ${this.sidebarWidth}px;`:``}">
        <alps-sidebar
          class="${this.isMobile?`mobile-sidebar`:`desktop-sidebar`} ${this.mobileSidebarOpen?`open`:``}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
          .isHovered=${this.isSidebarHovered}
          .suppressHover=${this.suppressSidebarHover}
          .width=${this.sidebarWidth}
          .hideFooterDivider=${!0}
          .showMobileBack=${!0}
          .collapsed=${this.sidebarCollapsed&&!this.isMobile}
          @sidebar-resize=${e=>{let t=e.detail.newWidth;t<120?(this.sidebarCollapsed||this.settingsStore.updateSettings({sidebarCollapsed:!0}),this.sidebarWidth=250):(this.sidebarCollapsed&&this.settingsStore.updateSettings({sidebarCollapsed:!1}),this.sidebarWidth=Math.min(Math.max(t,150),500))}}
          @drag-start=${()=>this.isSidebarDragging=!0}
          @drag-end=${()=>this.isSidebarDragging=!1}
          @toggle-collapse=${()=>this.settingsStore.updateSettings({sidebarCollapsed:!this.sidebarCollapsed})}
          @mouseenter=${()=>{this.hoverTimeout&&=(clearTimeout(this.hoverTimeout),null),this.isSidebarHovered=!0,this.suppressSidebarHover=!1}}
          @mouseleave=${()=>{this.hoverTimeout=setTimeout(()=>{this.isSidebarHovered=!1},300)}}
          @close-sidebar=${()=>this.mobileSidebarOpen=!1}
        >
          <div class="sidebar-wrapper ${this.sidebarCollapsed&&(!this.isSidebarHovered||this.suppressSidebarHover)&&!this.isMobile?`collapsed`:``}">
            <div class="sidebar-content">
              <div class="sidebar-scroll-content">
                <alps-category-item 
            ?active=${this.category===`general`}
            @click=${()=>this.selectCategory(`general`)}
            icon="gear"
          >
            ${this.i18nStore?.t(`settings.categories.general`)}
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
          <alps-category-item 
            ?active=${this.category===`webauthn`}
            @click=${()=>this.selectCategory(`webauthn`)}
            icon="fingerprint"
          >
            ${this.i18nStore?.t(`settings.categories.webauthn`)}
          </alps-category-item>
          ${y.getSettingsTabs().map(e=>s`
            <alps-category-item 
              ?active=${this.category===e.id}
              @click=${()=>this.selectCategory(e.id)}
              .icon=${e.icon}
            >
              ${this.i18nStore?.t(e.labelKey)}
            </alps-category-item>
          `)}
              </div>
            </div>
          </div>
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
            ${y.getSettingsTabs().filter(e=>e.id===this.category).map(e=>s`${h(`<${e.component}></${e.component}>`)}`)}
          `:s`<div>${this.i18nStore?.t(`settings.loading`)}</div>`}
        </div>
      </div>
    `}renderGeneral(){return s`
        <alps-setting-group label="${this.i18nStore?.t(`settings.general.checkMailInterval`)}" description="${this.i18nStore?.t(`settings.general.checkMailIntervalDesc`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`checkMailInterval`)} .value=${this.settingsState.checkMailInterval.toString()}
            .options=${[{value:`1`,label:this.i18nStore?.t(`settings.general.everyMinute`)||`1`},{value:`5`,label:this.i18nStore?.t(`settings.general.every5Minutes`)||`5`},{value:`15`,label:this.i18nStore?.t(`settings.general.every15Minutes`)||`15`},{value:`30`,label:this.i18nStore?.t(`settings.general.every30Minutes`)||`30`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.general.autoLogout`)}" description="${this.i18nStore?.t(`settings.general.autoLogoutDesc`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`autoLogout`)} .value=${this.settingsState.autoLogout.toString()}
            .options=${[{value:`0`,label:this.i18nStore?.t(`settings.general.never`)||`0`},{value:`15`,label:this.i18nStore?.t(`settings.general.minutes15`)||`15`},{value:`30`,label:this.i18nStore?.t(`settings.general.minutes30`)||`30`},{value:`60`,label:this.i18nStore?.t(`settings.general.hour1`)||`60`},{value:`120`,label:this.i18nStore?.t(`settings.general.hours2`)||`120`},{value:`360`,label:this.i18nStore?.t(`settings.general.hours6`)||`360`}]}>
          </alps-select>
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
          <alps-input type="text" icon="user" .value=${this.settingsState.name||``} @change=${e=>this.handleUpdate(e,`name`)} placeholder="${this.i18nStore?.t(`settings.placeholderName`)}"></alps-input>
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
          <alps-select @change=${e=>this.handleUpdate(e,`messagesPerPage`)} .value=${this.settingsState.messagesPerPage.toString()}
            .options=${[{value:`25`,label:`25`},{value:`50`,label:`50`},{value:`100`,label:`100`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.enableThreading&&this.settingsState.hasThreadCapability!==!1} 
                   ?disabled=${this.settingsState.hasThreadCapability===!1}
                   @change=${e=>this.handleUpdate(e,`enableThreading`)}>
            ${this.i18nStore?.t(`settings.reading.enableThreading`)}
            ${this.settingsState.hasThreadCapability===!1?s`
              <span style="font-size: 12px; color: var(--text-muted); font-weight: normal; margin-left: 4px;">
                (Not supported by your mail server)
              </span>
            `:``}
          </label>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.preferredView`)}" description="${this.i18nStore?.t(`settings.reading.preferredViewDesc`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`preferredView`)} .value=${this.settingsState.preferredView}
            .options=${[{value:`html`,label:this.i18nStore?.t(`settings.reading.html`)||`html`},{value:`text`,label:this.i18nStore?.t(`settings.reading.plainText`)||`text`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group>
          <label class="checkbox-label">
            <input type="checkbox" 
                   ?checked=${this.settingsState.themeIframeContent} 
                   @change=${e=>this.handleUpdate(e,`themeIframeContent`)}>
            ${this.i18nStore?.t(`settings.reading.themeIframeContent`)}
          </label>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.showRemoteContent`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`showRemoteContent`)} .value=${this.settingsState.showRemoteContent}
            .options=${[{value:`ask`,label:this.i18nStore?.t(`settings.reading.alwaysAsk`)||`ask`},{value:`always`,label:this.i18nStore?.t(`settings.reading.alwaysLoad`)||`always`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.markReadTimeout`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`markReadTimeout`)} .value=${this.settingsState.markReadTimeout.toString()}
            .options=${[{value:`0`,label:this.i18nStore?.t(`settings.reading.markReadImmediately`)||`0`},{value:`1`,label:this.i18nStore?.t(`settings.reading.markRead1s`)||`1`},{value:`3`,label:this.i18nStore?.t(`settings.reading.markRead3s`)||`3`},{value:`5`,label:this.i18nStore?.t(`settings.reading.markRead5s`)||`5`},{value:`10`,label:this.i18nStore?.t(`settings.reading.markRead10s`)||`10`},{value:`-1`,label:this.i18nStore?.t(`settings.reading.markReadNever`)||`-1`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.composeFormat`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`composeFormat`)} .value=${this.settingsState.composeFormat}
            .options=${[{value:`html`,label:this.i18nStore?.t(`settings.reading.richText`)||`html`},{value:`text`,label:this.i18nStore?.t(`settings.reading.plainText`)||`text`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.messageSortCriteria`)}" description="${this.i18nStore?.t(`settings.reading.messageSortCriteriaDesc`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`messageSortCriteria`)} .value=${this.settingsState.messageSortCriteria}
            .options=${[{value:`date`,label:this.i18nStore?.t(`settings.reading.sortDate`)||`date`},{value:`uid`,label:this.i18nStore?.t(`settings.reading.sortUid`)||`uid`}]}>
          </alps-select>
        </alps-setting-group>
    `}renderAppearance(){return s`
        
        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.colorTheme`)}" description="${this.i18nStore?.t(`settings.appearance.colorThemeDesc`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`colorFamily`)} .value=${this.settingsState.colorFamily}
            .options=${[{value:`default`,label:`Alps`},{value:`nord`,label:`Nord`},{value:`ocean`,label:`Ocean`}]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.themeMode`)}" description="${this.i18nStore?.t(`settings.appearance.themeModeDesc`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`themeMode`)} .value=${this.settingsState.themeMode}
            .options=${[{value:`light`,label:this.i18nStore?.t(`settings.appearance.light`)||`light`},{value:`dark`,label:this.i18nStore?.t(`settings.appearance.dark`)||`dark`},{value:`auto`,label:this.i18nStore?.t(`settings.appearance.systemAuto`)||`auto`}]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.layoutMode`)}" description="${this.i18nStore?.t(`settings.appearance.layoutModeDesc`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`layoutMode`)} .value=${this.settingsState.layoutMode}
            .options=${[{value:`vertical`,label:this.i18nStore?.t(`settings.appearance.vertical`)||`vertical`},{value:`horizontal`,label:this.i18nStore?.t(`settings.appearance.horizontal`)||`horizontal`},{value:`full`,label:this.i18nStore?.t(`settings.appearance.fullScreen`)||`full`}]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.listDensity`)}" description="${this.i18nStore?.t(`settings.appearance.listDensityDesc`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`densityMode`)} .value=${this.settingsState.densityMode}
            .options=${[{value:`loose`,label:this.i18nStore?.t(`settings.appearance.loose`)||`loose`},{value:`normal`,label:this.i18nStore?.t(`settings.appearance.normal`)||`normal`},{value:`compact`,label:this.i18nStore?.t(`settings.appearance.compact`)||`compact`},{value:`ultra-compact`,label:this.i18nStore?.t(`settings.appearance.ultraCompact`)||`ultra-compact`}]}>
          </alps-select>
        </alps-setting-group>
    `}renderLocalization(){return s`
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.language`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`language`)} .value=${this.settingsState.language}
            .options=${[{value:`en`,label:this.i18nStore?.t(`settings.localization.english`)||`en`},{value:`de`,label:this.i18nStore?.t(`settings.localization.german`)||`de`},{value:`it`,label:this.i18nStore?.t(`settings.localization.italian`)||`it`},{value:`es`,label:this.i18nStore?.t(`settings.localization.spanish`)||`es`},{value:`rs`,label:this.i18nStore?.t(`settings.localization.serbian`)||`rs`},{value:`sr`,label:this.i18nStore?.t(`settings.localization.serbianLatin`)||`sr`},{value:`fr`,label:this.i18nStore?.t(`settings.localization.french`)||`fr`},{value:`pt`,label:this.i18nStore?.t(`settings.localization.portuguese`)||`pt`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.timeFormat`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`hourFormat`)} .value=${this.settingsState.hourFormat}
            .options=${[{value:`12`,label:this.i18nStore?.t(`settings.localization.format12h`)||`12`},{value:`24`,label:this.i18nStore?.t(`settings.localization.format24h`)||`24`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.dateFormat`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`dateFormat`)} .value=${this.settingsState.dateFormat}
            .options=${[{value:`YYYY-MM-DD`,label:`YYYY-MM-DD`},{value:`MM/DD/YYYY`,label:`MM/DD/YYYY`},{value:`DD.MM.YYYY`,label:`DD.MM.YYYY`}]}>
          </alps-select>
        </alps-setting-group>
    `}};E([g({context:C})],X.prototype,`settingsStore`,void 0),E([g({context:S})],X.prototype,`i18nStore`,void 0),E([o({type:String})],X.prototype,`category`,void 0),E([a()],X.prototype,`settingsState`,void 0),E([a()],X.prototype,`isMobile`,void 0),E([a()],X.prototype,`mobileSidebarOpen`,void 0),E([a()],X.prototype,`username`,void 0),E([a()],X.prototype,`isScrolled`,void 0),E([a()],X.prototype,`sidebarWidth`,void 0),E([a()],X.prototype,`sidebarCollapsed`,void 0),E([a()],X.prototype,`isSidebarDragging`,void 0),E([a()],X.prototype,`isSidebarHovered`,void 0),E([a()],X.prototype,`suppressSidebarHover`,void 0),X=E([m(`settings-page`)],X);async function tr(e){let t=await new ne().parse(e),n=`default`,r=t.headers?.find(e=>e.key.toLowerCase()===`bimi-selector`);if(r){let e=r.value.match(/s=([^;\s]+)/i);e&&(n=e[1].trim())}let i=t.from?.address||``,a={messageId:t.messageId||``,date:t.date||``,from:t.from?t.from.name?`${t.from.name} <${t.from.address||``}>`:t.from.address||``:``,fromAddress:i,to:t.to?t.to.map(e=>e.name?`${e.name} <${e.address}>`:e.address).join(`, `):``,subject:t.subject||``,spf:`none`,spfDetail:``,dkim:`none`,dkimDetail:``,dmarc:`none`,dmarcDetail:``,bimiSelector:n,hasBimiPotential:!1},o=t.headers?.filter(e=>e.key.toLowerCase()===`authentication-results`)||[];if(o.length>0){let e=o[0],t=e.value.toLowerCase(),n=``,r=t.match(/smtp\.(?:remote|client)-ip=([0-9a-f\.:]+)/)||t.match(/designates ([0-9a-f\.:]+) as permitted sender/);r&&(n=r[1]);let i=e.value.split(`;`);for(let e of i){let t=e.trim().toLowerCase();if(t.startsWith(`spf=`))if(a.spf=t.split(`=`)[1].split(` `)[0],n)a.spfDetail=`with IP address ${n}`;else{let e=t.match(/smtp\.mailfrom=([^ \t]+)/)||t.match(/smtp\.helo=([^ \t]+)/);e&&(a.spfDetail=`with ${e[1]}`)}else if(t.startsWith(`dkim=`)){a.dkim=t.split(`=`)[1].split(` `)[0];let e=t.match(/header\.d=([^ \t]+)/);e&&(a.dkimDetail=`with domain ${e[1]}`)}else if(t.startsWith(`dmarc=`)){a.dmarc=t.split(`=`)[1].split(` `)[0];let e=t.match(/header\.from=([^ \t]+)/);e&&(a.dmarcDetail=`with domain ${e[1]}`)}}}return a.hasBimiPotential=a.dmarc===`pass`&&!!a.fromAddress,a}var nr=class extends d{constructor(...e){super(...e),this.rawText=``,this.parsedHeaders=null,this.loading=!0,this.error=``,this.mailbox=``,this.uid=``,this.isTruncated=!1,this._handleStoreChange=()=>{this.requestUpdate()},this.MAX_DISPLAY_SIZE=65536}static{this.styles=n`
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
  `}connectedCallback(){super.connectedCallback(),this.extractParams(),this.mailbox&&this.uid?this.fetchOriginal():(this.error=this.i18nStore?.t(`originalMessage.errorMissingParams`),this.loading=!1),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}extractParams(){let e=window.location.hash,t=e.indexOf(`?`);if(t!==-1){let n=new URLSearchParams(e.substring(t+1));this.mailbox=n.get(`mailbox`)||``,this.uid=n.get(`uid`)||``}}async fetchOriginal(){try{this.loading=!0;let e=await j(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.uid}/raw?limit=${this.MAX_DISPLAY_SIZE}`);if(!e.ok){if(e.status===401){window.location.hash=`#/login`;return}throw Error(this.i18nStore?.t(`originalMessage.errorFailedToFetch`))}this.rawText=await e.text(),this.rawText.length>=this.MAX_DISPLAY_SIZE&&(this.isTruncated=!0),this.parsedHeaders=await tr(this.rawText)}catch(e){this.error=e.message}finally{this.loading=!1}}copyToClipboard(){navigator.clipboard.writeText(this.rawText).then(()=>{alert(this.isTruncated?this.i18nStore?.t(`originalMessage.copiedTruncated`):this.i18nStore?.t(`originalMessage.copied`))}).catch(e=>{b.error(`Failed to copy: `,e),alert(this.i18nStore?.t(`originalMessage.copyFailed`))})}renderAuthStatus(e,t){e=e.toLowerCase();let n=s`<span class="auth-none">${this.i18nStore?.t(`originalMessage.none`)}</span>`;return e===`pass`?n=s`<span class="auth-pass">${this.i18nStore?.t(`originalMessage.pass`)}</span>`:e===`fail`&&(n=s`<span class="auth-fail">${this.i18nStore?.t(`originalMessage.fail`)}</span>`),s`
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
    `}};E([a()],nr.prototype,`rawText`,void 0),E([a()],nr.prototype,`parsedHeaders`,void 0),E([a()],nr.prototype,`loading`,void 0),E([a()],nr.prototype,`error`,void 0),E([a()],nr.prototype,`mailbox`,void 0),E([a()],nr.prototype,`uid`,void 0),E([a()],nr.prototype,`isTruncated`,void 0),E([g({context:S})],nr.prototype,`i18nStore`,void 0),nr=E([m(`original-message-page`)],nr);var Z=class extends d{constructor(...e){super(...e),this.loading=!0,this.error=``,this.mailbox=``,this.uid=``,this.message=null,this.content=``,this.rawMessageHtml=``,this.mimeType=`text/plain`,this.hasRemoteResources=!1,this.allowRemoteResources=!1}static{this.styles=n`
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
  `}connectedCallback(){super.connectedCallback(),this.allowRemoteResources=this.settingsStore.getState().showRemoteContent===`always`,this.extractParams(),this.mailbox&&this.uid?this.fetchMessage():(this.error=`Missing mailbox or uid parameters`,this.loading=!1)}extractParams(){let e=window.location.hash,t=e.indexOf(`?`);if(t!==-1){let n=new URLSearchParams(e.substring(t+1));this.mailbox=n.get(`mailbox`)||``,this.uid=n.get(`uid`)||``,n.get(`remote`)===`1`&&(this.allowRemoteResources=!0)}}async fetchMessage(){try{this.loading=!0;let e=At.get(this.mailbox,this.uid);if(e&&e.Part){this.message=e.Message,this.mimeType=e.Part.MIMEType||e.Part.MimeType||`text/plain`,e.RawHtml===void 0?e.RawText!==void 0&&(this.content=e.RawText):(this.rawMessageHtml=e.RawHtml,this.hasRemoteResources=!1,this.content=fn(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})),this.loading=!1;return}let t=await j(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.uid}`);if(!t.ok){if(t.status===401){window.location.hash=`#/login`;return}throw Error(`Failed to fetch message metadata`)}this.message=await t.json(),await this.fetchMessageBody()}catch(e){this.error=e.message}finally{this.loading=!1}}findDisplayPart(e,t){if(!e)return null;if(e.MIMEType&&e.MIMEType.toLowerCase().startsWith(`multipart/`)){if(e.MIMEType.toLowerCase()===`multipart/alternative`){let n=null,r=null;for(let t of e.Children||[])t.MIMEType?.toLowerCase()===`text/plain`&&(n=t),t.MIMEType?.toLowerCase()===`text/html`&&(r=t);return t===`html`?r||n||e.Children[0]:n||r||e.Children[0]}for(let n of e.Children||[]){let e=this.findDisplayPart(n,t);if(e)return e}}return e.MIMEType?.toLowerCase()===`text/html`||e.MIMEType?.toLowerCase()===`text/plain`?e:null}findPartPath(e,t,n=``){if(!e)return null;if(e===t)return n||`1`;if(e.Children&&Array.isArray(e.Children))for(let r=0;r<e.Children.length;r++){let i=n?`${n}.${r+1}`:`${r+1}`,a=this.findPartPath(e.Children[r],t,i);if(a)return a}return null}async fetchMessageBody(){if(!this.message||!this.message.BodyStructure)return;let e=`1`,t=this.findDisplayPart(this.message.BodyStructure,`html`);if(t?(e=this.findPartPath(this.message.BodyStructure,t)||`1`,this.mimeType=t.MIMEType||`text/plain`):(this.mimeType=this.message.BodyStructure.MIMEType||`text/plain`,this.mimeType.toLowerCase()===`text/plain`||this.mimeType.toLowerCase()===`text/html`?e=`1`:this.mimeType=`multipart/mixed`),this.mimeType.toLowerCase().startsWith(`multipart/`)){this.content=``;return}let n=await j(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.uid}/raw?part=${e}`);if(!n.ok)throw Error(`Failed to fetch message body`);this.mimeType.toLowerCase()===`text/html`?(this.rawMessageHtml=await n.text(),this.hasRemoteResources=!1,this.content=fn(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})):this.content=await n.text()}loadRemoteResources(){this.allowRemoteResources=!0,this.rawMessageHtml&&(this.content=fn(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message?.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}}))}updated(e){e.has(`content`)&&this.content&&setTimeout(()=>{window.print()},500)}render(){if(this.loading)return s`
        <div class="loading-state">
          <alps-loader></alps-loader>
          <span>${this.i18nStore?.t(`print.loading`)}</span>
        </div>
      `;if(this.error)return s`
        <div class="error-state">
          <div>${T(`warning`)}</div>
          <span>${this.error}</span>
        </div>
      `;let e=this.message;if(!e)return s``;let t=e.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`),n=e.Envelope?.From?.[0]||{},r=n.Mailbox&&n.Host?`${n.Mailbox}@${n.Host}`:``,i=n.Name||r||this.i18nStore?.t(`messageList.unknownSender`),a=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,o=String(this.settingsStore?.getState()?.hourFormat||`12`),c=e.Envelope?.Date?qe(e.Envelope.Date,a,o):``,l=e.Envelope?.To&&e.Envelope.To.length>0?e.Envelope.To.map(e=>e.Name?`${e.Name} &lt;${e.Mailbox}@${e.Host}&gt;`:`${e.Mailbox}@${e.Host}`).join(`, `):this.i18nStore?.t(`messageReader.undisclosed`),u=s``;if(e.Envelope?.Cc&&e.Envelope.Cc.length>0){let t=e.Envelope.Cc.map(e=>e.Name?`${e.Name} &lt;${e.Mailbox}@${e.Host}&gt;`:`${e.Mailbox}@${e.Host}`).join(`, `);u=s`<div class="print-cc"><strong>${this.i18nStore?.t(`messageReader.cc`)}</strong> ${t}</div>`}let d;return d=this.mimeType?.toLowerCase()===`text/html`?s`<div .innerHTML=${this.content}></div>`:this.mimeType?.toLowerCase().startsWith(`multipart/`)?s`<div style="font-style: italic; color: #666;">${this.i18nStore?.t(`messageReader.noReadableText`)}</div>`:s`<pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${this.content}</pre>`,s`
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
    `}};E([g({context:C})],Z.prototype,`settingsStore`,void 0),E([g({context:S})],Z.prototype,`i18nStore`,void 0),E([a()],Z.prototype,`loading`,void 0),E([a()],Z.prototype,`error`,void 0),E([a()],Z.prototype,`mailbox`,void 0),E([a()],Z.prototype,`uid`,void 0),E([a()],Z.prototype,`message`,void 0),E([a()],Z.prototype,`content`,void 0),E([a()],Z.prototype,`rawMessageHtml`,void 0),E([a()],Z.prototype,`mimeType`,void 0),E([a()],Z.prototype,`hasRemoteResources`,void 0),E([a()],Z.prototype,`allowRemoteResources`,void 0),Z=E([m(`print-page`)],Z);var rr=class extends d{constructor(...e){super(...e),this.statusMessage=``,this.statusType=`info`,this.isLoading=!1,this.isSuccess=!1,this._handleI18nChange=()=>{this.requestUpdate()}}static{this.styles=n`
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
    

  `}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),$n()?setTimeout(()=>{this._handleVerify()},300):(this.statusMessage=this.i18nStore?.t(`webauthn.not_supported`),this.statusType=`error`)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}async _handleVerify(){this.isLoading=!0,this.statusMessage=this.i18nStore?.t(`webauthn.requesting`),this.statusType=`info`;try{let e=await fetch(`/webauthn/verify/begin`,{method:`POST`});if(!e.ok)throw Error(this.i18nStore?.t(`webauthn.errors.begin_failed`));let t=await e.json();if(!t||!t.publicKey)throw Error(this.i18nStore?.t(`webauthn.errors.invalid_options`));this.statusMessage=this.i18nStore?.t(`webauthn.waiting_for_key`);let n=await Qn(t);if(this.statusMessage=this.i18nStore?.t(`webauthn.verifying`),(await(await fetch(`/webauthn/verify/finish`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(n)})).json()).success)this.statusMessage=this.i18nStore?.t(`webauthn.success`),this.statusType=`success`,this.isSuccess=!0,setTimeout(()=>{window.location.hash=`#/`,Ne(),sessionStorage.clear(),window.location.reload()},1e3);else throw Error(this.i18nStore?.t(`webauthn.errors.verification_failed`))}catch(e){this.statusMessage=e.message||this.i18nStore?.t(`webauthn.errors.general`),this.statusType=`error`}finally{this.isLoading=!1}}render(){return s`
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
          ?disabled=${this.isLoading||this.isSuccess||!$n()}
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
    `}};E([g({context:S})],rr.prototype,`i18nStore`,void 0),E([a()],rr.prototype,`statusMessage`,void 0),E([a()],rr.prototype,`statusType`,void 0),E([a()],rr.prototype,`isLoading`,void 0),E([a()],rr.prototype,`isSuccess`,void 0),rr=E([m(`login-webauthn-page`)],rr);var ir=new Map;function ar(e){let t=ir.get(e);t&&(t.abort(),ir.delete(e))}async function or(e){try{await fetch(`/attachments/${e}`,{method:`DELETE`})}catch(e){b.error(`Failed to delete attachment from server:`,e)}}function sr(e,t,n,r,i,a,o){let s=document.createElement(`input`);s.type=`file`,s.multiple=!0,s.onchange=s=>{let c=Array.from(s.target.files||[]);c.length!==0&&cr(c,e,t,n,r,i,a,o)},s.click()}function cr(e,t,n,r,i,a,o,s){let c=0;for(let t of e)c+=t.size;if(n>0&&r+c>n){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:`Attachments exceed the maximum allowed size.`,duration:5e3}}));return}for(let n of e){let e=Math.random().toString(36).substring(2,15);i(e,n);let r=new FormData;r.append(`attachments`,n);let c=new XMLHttpRequest;ir.set(e,c),c.open(`POST`,`/attachments?composer_id=${encodeURIComponent(t)}`,!0),c.upload.onprogress=t=>{t.lengthComputable&&a(e,Math.round(t.loaded/t.total*100))},c.onload=()=>{if(ir.delete(e),c.status>=200&&c.status<300)try{let t=JSON.parse(c.responseText),n=Array.isArray(t)?t:t.uuids||[];n.length>0?o(e,n):s(e,Error(`No UUID returned from server`))}catch(t){s(e,t)}else try{let t=JSON.parse(c.responseText);s(e,Error(t.error||`Unknown error`))}catch{s(e,Error(`Upload failed with status `+c.status))}},c.onerror=()=>{ir.delete(e),s(e,Error(`Network error during upload`))},c.onabort=()=>{ir.delete(e)},c.send(r)}}var lr=class extends d{constructor(...e){super(...e),this.addresses=[],this.disabled=!1,this.inputText=``,this.suggestions=[],this.focusedSuggestionIndex=-1,this._suggestionTimeout=null}focus(){let e=this.shadowRoot?.querySelector(`input`);e&&e.focus()}updated(e){if(super.updated(e),e.has(`focusedSuggestionIndex`)&&this.focusedSuggestionIndex>=0){let e=this.shadowRoot?.querySelector(`.dropdown-item.active`);e&&e.scrollIntoView({block:`nearest`})}}_isBlockedAddress(e){let t=e.trim(),n=t.match(/^.*?<([^>]+)>$/);n&&n[1]&&(t=n[1]);let r=t.toLowerCase();return r.startsWith(`noreply`)||r.startsWith(`no-reply`)||r.startsWith(`mailer-daemon`)}_isValidEmail(e){if(this._isBlockedAddress(e))return!1;let t=e.trim();return!!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)||/^.*?<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(t))}_displayAddr(e){let t=e.match(/^(.*?)\s*<([^>]+)>$/);return t&&t[1]?t[1].replace(/^["']|["']$/g,``).trim()||t[2]:e}_handleInput(e){let t=e.target;this.inputText=t.value,this._suggestionTimeout!==null&&window.clearTimeout(this._suggestionTimeout),this.inputText.trim().length>1?this._suggestionTimeout=window.setTimeout(async()=>{try{let e=await y.invokeHookAsync(`composer:suggest`,{query:this.inputText.trim()});this.suggestions=e.flat(),this.focusedSuggestionIndex=-1}catch(e){console.error(`Failed to get suggestions`,e),this.suggestions=[],this.focusedSuggestionIndex=-1}},300):(this.suggestions=[],this.focusedSuggestionIndex=-1)}_handleKeyDown(e){let t=this.inputText.trim();if(this.suggestions.length>0){if(e.key===`ArrowDown`){e.preventDefault(),this.focusedSuggestionIndex=Math.min(this.focusedSuggestionIndex+1,this.suggestions.length-1);return}else if(e.key===`ArrowUp`){e.preventDefault(),this.focusedSuggestionIndex=Math.max(this.focusedSuggestionIndex-1,-1);return}else if(e.key===`Enter`&&this.focusedSuggestionIndex>=0){e.preventDefault();let t=this.suggestions[this.focusedSuggestionIndex],n=t.name?`"`+t.name+`" <`+t.address+`>`:t.address;this._addAddress(n);return}else if(e.key===`Escape`){e.preventDefault(),this.suggestions=[],this.focusedSuggestionIndex=-1;return}}if(e.key===`Enter`&&t)e.preventDefault(),this._isValidEmail(t)&&this._addAddress(t);else if((e.key===` `||e.key===`,`)&&t)e.preventDefault(),this._isValidEmail(t)&&this._addAddress(t);else if(e.key===`Backspace`&&!this.inputText&&this.addresses.length>0){let e=this.addresses[this.addresses.length-1];this._removeAddress(e),this.inputText=e+` `}}_addAddress(e,t=!0){this.addresses.includes(e)||(this.addresses=[...this.addresses,e],this._notifyChange()),this.inputText=``,this.suggestions=[],this.focusedSuggestionIndex=-1,t&&this.focus()}_removeAddress(e){this.addresses=this.addresses.filter(t=>t!==e),this._notifyChange()}_notifyChange(){this.dispatchEvent(new CustomEvent(`addresses-changed`,{detail:{addresses:this.addresses},bubbles:!0,composed:!0}))}_handleBlur(){setTimeout(()=>{let e=this.inputText.trim();e&&this._isValidEmail(e)&&this._addAddress(e,!1),this.suggestions=[],this.focusedSuggestionIndex=-1},150)}static{this.styles=[ct,n`
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
      cursor: text;
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

    .input-container {
      flex: 1;
      min-width: 8px;
      position: relative;
    }

    .input-wrapper {
      width: 100%;
      display: flex;
    }

    .input-container:focus-within,
    .input-container.has-value {
      min-width: 144px;
    }

    .suggestions-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 40010;
      min-width: 200px;
      max-width: 320px;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 6px;
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      padding: 4px 0;
      display: flex;
      flex-direction: column;
      margin-top: 4px;
      max-height: 250px;
      overflow-y: auto;
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
  `]}render(){return s`
      <div class="address-container" @click=${this.focus}>
        ${this.addresses.map(e=>s`
          <div class="pill" title=${e}>
            <span class="pill-addr">${this._displayAddr(e)}</span>
            <button class="pill-remove" @click=${()=>this._removeAddress(e)} ?disabled=${this.disabled}>
              ${T(`x`)}
            </button>
          </div>
        `)}
        
        <div class="input-container ${this.inputText.length>0?`has-value`:``}">
          <div class="input-wrapper">
            <input
              type="text"
              .value=${this.inputText}
              @input=${this._handleInput}
              @keydown=${this._handleKeyDown}
              @blur=${this._handleBlur}
              @click=${e=>e.stopPropagation()}
              ?disabled=${this.disabled}
            />
          </div>
          ${this.suggestions.length>0?s`
            <div class="suggestions-dropdown">
              ${this.suggestions.map((e,t)=>s`
                <button class="dropdown-item ${t===this.focusedSuggestionIndex?`active`:``}"
                  @mousedown=${e=>{e.preventDefault()}}
                  @click=${t=>{t.preventDefault(),t.stopPropagation();let n=e.name?`"`+e.name+`" <`+e.address+`>`:e.address;this._addAddress(n)}}>
                  <span class="item-text"><b>${e.name}</b> &lt;${e.address}&gt;</span>
                </button>
              `)}
            </div>
          `:``}
        </div>
      </div>
    `}};E([o({type:Array})],lr.prototype,`addresses`,void 0),E([o({type:Boolean})],lr.prototype,`disabled`,void 0),E([a()],lr.prototype,`inputText`,void 0),E([a()],lr.prototype,`suggestions`,void 0),E([a()],lr.prototype,`focusedSuggestionIndex`,void 0),lr=E([m(`alps-address-input`)],lr);var ur=le.create({name:`fontSize`,addOptions(){return{types:[`textStyle`]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{fontSize:{default:null,parseHTML:e=>e.style.fontSize?.replace(/['"]+/g,``),renderHTML:e=>e.fontSize?{style:`font-size: ${e.fontSize}`}:{}}}}]},addCommands(){return{setFontSize:e=>({chain:t})=>t().setMark(`textStyle`,{fontSize:e}).run(),unsetFontSize:()=>({chain:e})=>e().setMark(`textStyle`,{fontSize:null}).removeEmptyTextStyle().run()}}}),dr=le.create({name:`indent`,addOptions(){return{types:[`paragraph`,`heading`,`blockquote`],minIndent:0,maxIndent:240,step:40}},addGlobalAttributes(){return[{types:this.options.types,attributes:{indent:{default:0,parseHTML:e=>parseInt(e.style.marginLeft,10)||0,renderHTML:e=>e.indent?{style:`margin-left: ${e.indent}px`}:{}}}}]},addCommands(){return{indent:()=>({tr:e,state:t,dispatch:n,editor:r})=>{if(r.can().sinkListItem(`listItem`))return r.chain().sinkListItem(`listItem`).run();let i=!1;return t.doc.nodesBetween(t.selection.from,t.selection.to,(t,r)=>{if(this.options.types.includes(t.type.name)){let a=t.attrs.indent||0;a<this.options.maxIndent&&(n&&e.setNodeMarkup(r,null,{...t.attrs,indent:a+this.options.step}),i=!0)}}),i},outdent:()=>({tr:e,state:t,dispatch:n,editor:r})=>{if(r.can().liftListItem(`listItem`))return r.chain().liftListItem(`listItem`).run();let i=!1;return t.doc.nodesBetween(t.selection.from,t.selection.to,(t,r)=>{if(this.options.types.includes(t.type.name)){let a=t.attrs.indent||0;a>this.options.minIndent&&(n&&e.setNodeMarkup(r,null,{...t.attrs,indent:Math.max(this.options.minIndent,a-this.options.step)}),i=!0)}}),i}}}}),Q=class extends d{constructor(...e){super(...e),this.isSending=!1,this.text=``,this.htmlText=``,this.format=`text`,this.attachments=[],this.bubbleMenuState=`view`,this.activeLinkUrl=``,this.activeLinkText=``,this.replyInputRef=_(),this.editorContainerRef=_(),this.bubbleMenuRef=_(),this._handleI18nChange=()=>{this.requestUpdate()}}focusEditor(){this.format===`html`&&this.editor&&!this.editor.isDestroyed?this.editor.commands.focus(`start`):this.replyInputRef.value&&(this.replyInputRef.value.focus(),this.replyInputRef.value.setSelectionRange(0,0))}hasSelection(){if(this.format===`html`&&this.editor&&!this.editor.isDestroyed)return!this.editor.state.selection.empty;let e=this.replyInputRef.value;return e?e.selectionStart!==e.selectionEnd:!1}getSelectionText(){if(this.format===`html`&&this.editor&&!this.editor.isDestroyed){if(this.editor.state.selection.empty)return``;let{from:e,to:t}=this.editor.state.selection;return this.editor.state.doc.textBetween(e,t,` `)}let e=this.replyInputRef.value;return e?e.value.substring(e.selectionStart,e.selectionEnd):``}getActiveLink(){return this.format===`html`&&this.editor&&!this.editor.isDestroyed&&this.editor.isActive(`link`)&&this.editor.getAttributes(`link`).href||null}_getLinkDetails(){if(!this.editor||this.editor.isDestroyed||!this.editor.isActive(`link`))return{url:``,text:``,range:null};let e=this.editor.getAttributes(`link`).href||``,t=ie(this.editor.state.selection.$from,this.editor.schema.marks.link),n=``;return t&&(n=this.editor.state.doc.textBetween(t.from,t.to,` `)),{url:e,text:n,range:t}}_enterEditMode(){let e=this._getLinkDetails();this.activeLinkUrl=e.url,this.activeLinkText=e.text,this.bubbleMenuState=`edit`}_applyBubbleLink(e){e.preventDefault();let t=this.shadowRoot?.querySelector(`#bubbleUrl`),n=this.shadowRoot?.querySelector(`#bubbleText`),r=t?.value||``,i=n?.value||``;if(!r||!this.editor||this.editor.isDestroyed)return;let a=this._getLinkDetails();a.range&&(i===a.text?this.editor.chain().focus().setLink({href:r}).run():this.editor.chain().focus().setTextSelection({from:a.range.from,to:a.range.to}).insertContent(i).setTextSelection({from:a.range.from,to:a.range.from+i.length}).setLink({href:r}).run()),this.bubbleMenuState=`view`}get messageText(){return this.text}get messageHtml(){return this.htmlText}getAttachments(){return this.attachments}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleI18nChange)})}firstUpdated(){this.initEditor()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),this.editor?.destroy()}updated(e){if(e.has(`isSending`)&&this.editor&&this.editor.setEditable(!this.isSending),e.has(`format`)){let t=e.get(`format`);if(t===`text`&&this.format===`html`){if(this.editor&&this.editor.getText()!==this.text){let e=this.text.split(`
`).map(e=>`<p>${e}</p>`).join(``);this.editor.commands.setContent(e),this.htmlText=this.editor.getHTML()}}else t===`html`&&this.format===`text`&&this.editor&&(this.text=this.editor.getText())}}initEditor(){this.editorContainerRef.value&&(this.editor=new se({element:this.editorContainerRef.value,extensions:[re.configure({link:{openOnClick:!1}}),ae.configure({types:[`heading`,`paragraph`]}),ce,oe,ur,dr,ue.configure({element:this.bubbleMenuRef.value,options:{placement:`bottom`},shouldShow:({editor:e})=>this.bubbleMenuState===`edit`?!0:e.isActive(`link`)})],content:this.htmlText||(this.format===`html`?this.text.split(`
`).map(e=>`<p>${e}</p>`).join(``):this.text),onUpdate:({editor:e})=>{this.htmlText=e.getHTML(),this.text=e.getText(),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0}))},onTransaction:({editor:e})=>{!e.isActive(`link`)&&this.bubbleMenuState===`edit`&&(this.bubbleMenuState=`view`),this.requestUpdate()}}),this.editor.setEditable(!this.isSending),this.requestUpdate())}clear(){this.replyInputRef.value&&(this.replyInputRef.value.value=``),this.text=``,this.htmlText=``,this.editor&&!this.editor.isDestroyed&&this.editor.commands.clearContent(),this.attachments=[],this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:``,html:``},bubbles:!0,composed:!0}))}insertFormatting(e,t=``){if(this.format===`html`&&this.editor&&!this.editor.isDestroyed){e===`**`?this.editor.chain().focus().toggleBold().run():e===`*`&&this.editor.chain().focus().toggleItalic().run();return}let n=this.replyInputRef.value;if(!n)return;let r=n.selectionStart,i=n.selectionEnd,a=n.value,o=a.substring(r,i);if(o.startsWith(e)&&o.endsWith(t)&&o.length>=e.length+t.length){let a=o.substring(e.length,o.length-t.length);n.setRangeText(a,r,i,`select`)}else r>=e.length&&a.substring(r-e.length,r)===e&&i+t.length<=a.length&&a.substring(i,i+t.length)===t?n.setRangeText(o,r-e.length,i+t.length,`select`):(n.setRangeText(e+o+t,r,i,`select`),r===i&&(n.selectionStart=r+e.length,n.selectionEnd=r+e.length));this.text=n.value,this.editor&&!this.editor.isDestroyed&&(this.htmlText=this.editor.getHTML()),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0})),n.focus()}insertEmoji(e){if(this.format===`html`&&this.editor&&!this.editor.isDestroyed)this.editor.chain().focus().insertContent(e).run();else{let t=this.replyInputRef.value;if(!t)return;let n=t.selectionStart,r=t.selectionEnd;t.setRangeText(e,n,r,`end`),this.text=t.value,this.editor&&!this.editor.isDestroyed&&(this.htmlText=this.editor.getHTML()),this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0})),t.focus()}}_handleInput(e){this.text=e.target.value,this.dispatchEvent(new CustomEvent(`text-changed`,{detail:{text:this.text,html:this.htmlText},bubbles:!0,composed:!0}))}static{this.styles=[ct,n`
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
            ${T(`textAlignLeft`)} <span class="item-text">${this.i18nStore?.t(`messageComposer.left`)}</span>
          </button>
          <button class="dropdown-item ${n?`active`:``}" @click=${()=>this.editor?.chain().focus().setTextAlign(`center`).run()}>
            ${T(`textAlignCenter`)} <span class="item-text">${this.i18nStore?.t(`messageComposer.center`)}</span>
          </button>
          <button class="dropdown-item ${r?`active`:``}" @click=${()=>this.editor?.chain().focus().setTextAlign(`right`).run()}>
            ${T(`textAlignRight`)} <span class="item-text">${this.i18nStore?.t(`messageComposer.right`)}</span>
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
            ${T(`arrowUUpLeft`)} ${this.i18nStore?.t(`messageComposer.undo`)}
          </button>
          <button class="dropdown-item" @click=${()=>this.editor?.chain().focus().redo().run()}>
            ${T(`arrowUUpRight`)} ${this.i18nStore?.t(`messageComposer.redo`)}
          </button>
          <div class="dropdown-divider mobile-only"></div>
          <button class="dropdown-item mobile-only ${this.editor.isActive(`orderedList`)?`active`:``}" @click=${()=>this.editor?.chain().focus().toggleOrderedList().run()}>
            ${T(`listNumbers`)} ${this.i18nStore?.t(`messageComposer.numberedList`)}
          </button>
          <button class="dropdown-item mobile-only" @click=${()=>this.editor?.chain().focus().outdent().run()}>
            ${T(`textOutdent`)} ${this.i18nStore?.t(`messageComposer.indentLess`)}
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item ${this.editor.isActive(`blockquote`)?`active`:``}" @click=${()=>this.editor?.chain().focus().toggleBlockquote().run()}>
            ${T(`textQuote`)} ${this.i18nStore?.t(`messageComposer.quote`)}
          </button>
          <button class="dropdown-item ${this.editor.isActive(`strike`)?`active`:``}" @click=${()=>this.editor?.chain().focus().toggleStrike().run()}>
            ${T(`textStrikethrough`)} ${this.i18nStore?.t(`messageComposer.strikethrough`)}
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click=${()=>this.editor?.chain().focus().clearNodes().unsetAllMarks().run()}>
            ${T(`textClearFormat`)} ${this.i18nStore?.t(`messageComposer.clearFormatting`)}
          </button>
        </alps-popup>
      </div>
    `}render(){return s`
      <div class="compose-area">
        ${this.renderFormattingToolbar()}
        <div class="editor-container ${this.format===`html`?``:`hidden`}" ${f(this.editorContainerRef)}></div>
        
        <!-- Bubble Menu Container -->
        <div class="bubble-menu-container" ${f(this.bubbleMenuRef)} 
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
                <span class="link-label">${this.i18nStore?.t(`messageComposer.goToLink`)} <a href="${this._getLinkDetails().url}" target="_blank">${this._getLinkDetails().url}</a></span>
                <span class="divider">|</span>
                <button class="bubble-btn" @click=${e=>{e.preventDefault(),this._enterEditMode()}}>${this.i18nStore?.t(`messageComposer.change`)}</button>
                <span class="divider">|</span>
                <button class="bubble-btn" @click=${e=>{e.preventDefault(),this.editor?.chain().focus().unsetLink().run()}}>${this.i18nStore?.t(`messageComposer.remove`)}</button>
              </div>
            `:s`
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
          ${f(this.replyInputRef)}
          class="reply-box ${this.format===`html`?`hidden`:``}"
          placeholder=${this.i18nStore?.t(`messageComposer.writeMessage`)}
          ?disabled=${this.isSending}
          .value=${this.text}
          @input=${this._handleInput}
        ></textarea>
      </div>
    `}};E([g({context:S})],Q.prototype,`i18nStore`,void 0),E([o({type:Boolean})],Q.prototype,`isSending`,void 0),E([o({type:String})],Q.prototype,`text`,void 0),E([o({type:String})],Q.prototype,`htmlText`,void 0),E([o({type:String})],Q.prototype,`format`,void 0),E([a()],Q.prototype,`attachments`,void 0),E([a()],Q.prototype,`bubbleMenuState`,void 0),E([a()],Q.prototype,`activeLinkUrl`,void 0),E([a()],Q.prototype,`activeLinkText`,void 0),Q=E([m(`alps-message-composer`)],Q);var fr=class extends d{constructor(...e){super(...e),this.position=`bottom`}static{this.styles=n`
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
    `}};E([o({type:String})],fr.prototype,`position`,void 0),E([v(`alps-popup`)],fr.prototype,`popup`,void 0),fr=E([m(`alps-emoji-selector-popup`)],fr);var pr=1e4,$=class extends d{constructor(...e){super(...e),this.index=0,this.totalOpen=1,this.totalMinimized=0,this.openIndex=0,this.minimizedIndex=0,this.showCc=!1,this.showBcc=!1,this.showDiscardConfirm=!1,this.pendingDiscardType=null,this.windowWidth=window.innerWidth,this.windowHeight=window.innerHeight,this.isSaving=!1,this.isDragOver=!1,this.autoSaveTimer=null,this._handleI18nChange=()=>{this.requestUpdate()},this._handleWindowDragOver=()=>{this.isDragOver&&=!1},this._handleWindowDragLeave=e=>{e.relatedTarget===null&&this.isDragOver&&(this.isDragOver=!1)},this._handleGlobalDropHandled=()=>{this.isDragOver&&=!1},this._handleResize=()=>{this.windowWidth=window.innerWidth,this.windowHeight=window.innerHeight},this._wasActiveOnMousedown=!1,this.linkPromptFields=[],this._handleDragOver=e=>{this.instance.isSending||this.instance.minimized||(e.preventDefault(),e.stopPropagation(),this.isDragOver=!0)},this._handleDragLeave=e=>{e.preventDefault(),e.stopPropagation(),this.isDragOver=!1},this._handleDrop=e=>{if(this.instance.isSending||this.instance.minimized)return;e.preventDefault(),e.stopPropagation(),this.isDragOver=!1,window.dispatchEvent(new CustomEvent(`alps-composer-drop`));let t=Array.from(e.dataTransfer?.files||[]);t.length>0&&this._startUpload(t)}}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this._handleResize),window.addEventListener(`dragover`,this._handleWindowDragOver),window.addEventListener(`dragleave`,this._handleWindowDragLeave),window.addEventListener(`alps-composer-drop`,this._handleGlobalDropHandled),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),this.instance.cc&&this.instance.cc.length>0&&(this.showCc=!0),this.instance.bcc&&this.instance.bcc.length>0&&(this.showBcc=!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this._handleResize),window.removeEventListener(`dragover`,this._handleWindowDragOver),window.removeEventListener(`dragleave`,this._handleWindowDragLeave),window.removeEventListener(`alps-composer-drop`,this._handleGlobalDropHandled),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),this._clearAutoSave()}firstUpdated(){setTimeout(()=>{this.isConnected&&this.composer&&this.composer.focusEditor&&this.composer.focusEditor()},100)}_clearAutoSave(){this.autoSaveTimer!==null&&(window.clearTimeout(this.autoSaveTimer),this.autoSaveTimer=null)}updated(e){e.has(`instance`)&&this.instance.dirty&&!this.instance.isSending&&this._scheduleAutoSave()}_scheduleAutoSave(){this._clearAutoSave(),this.autoSaveTimer=window.setTimeout(()=>{this._saveDraft()},3e3)}async _saveDraft(){let e=this.composeStore.getComposer(this.instance.id)||this.instance;if(e.isSending||this.isSaving)return;let t=(e.to?.length||0)>0||(e.cc?.length||0)>0||(e.bcc?.length||0)>0,n=e.attachments&&e.attachments.length>0,r=e.text?.trim()!==e.initialText?.trim()||(e.subject?.trim().length||0)>0||n;if(!(!t&&!r)){this.isSaving=!0;try{let t=(e.attachments||[]).map(e=>e.uuid).filter(Boolean),n=this._buildFormData(e);n.append(`save_as_draft`,`1`);let r=await I.saveDraft(n);if(r){let e=this.instance.draftUid;window.dispatchEvent(new CustomEvent(`draft-autosaved`,{detail:{oldUid:e,newUid:r.uid,mailbox:r.mailbox,subject:this.instance.subject,to:this.instance.to,cc:this.instance.cc,bcc:this.instance.bcc,size:r.size,hasAttachments:this.instance.attachments&&this.instance.attachments.length>0}}))}if(!this.isConnected)return;if(r){let n={dirty:!1,draftUid:r.uid,draftMailbox:r.mailbox};if(r.attachments){let i=(e.attachments||[]).filter(e=>!!(e._tempId||e.uuid&&!t.includes(e.uuid)));n.attachments=[...r.attachments,...i]}this.composeStore.updateComposer(this.instance.id,n);let i=this.composeStore.getComposer(this.instance.id),a=(i?.attachments||[]).some(e=>e.uuid&&!t.includes(e.uuid));(i?.dirty||a)&&this._scheduleAutoSave()}}finally{this.isSaving=!1}}}_buildFormData(e){let t=new FormData,n=e.to||[],r=e.cc||[],i=[...e.bcc||[]],a=``;try{let e=localStorage.getItem(`alps_settings`);if(e){let t=JSON.parse(e);t.bccMyself&&t.loginUsername&&(i.includes(t.loginUsername)||i.push(t.loginUsername)),t.replyTo&&(a=t.replyTo)}}catch{}let o=e.text||``,s=(e.subject||``).trim();t.append(`to`,n.join(`, `)),t.append(`cc`,r.join(`, `)),t.append(`bcc`,i.join(`, `)),a&&t.append(`reply_to`,a),t.append(`subject`,s),t.append(`text`,o),e.format===`html`&&e.html&&t.append(`html`,e.html);let c=e.attachments||[],l=c.map(e=>e.uuid).filter(Boolean).join(`,`);l&&t.append(`attachment-uuids`,l);let u=c.map(e=>e.partPath).filter(Boolean).join(`,`);return u&&t.append(`prev_attachments`,u),e.draftMailbox&&t.append(`draft_mailbox`,e.draftMailbox),e.draftUid&&t.append(`draft_uid`,e.draftUid),e.inReplyTo&&t.append(`in_reply_to`,e.inReplyTo),t}get composer(){return this.shadowRoot.querySelector(`alps-message-composer`)}_toggleMinimize(){this.composeStore.updateComposer(this.instance.id,{minimized:!this.instance.minimized,expanded:!1})}_handleHeaderClick(){this.composeStore.bringComposerToFront(this.instance.id),this.instance.minimized?(this.composeStore.updateComposer(this.instance.id,{minimized:!1}),setTimeout(()=>{this.isConnected&&this.composer&&this.composer.focusEditor&&this.composer.focusEditor()},100)):this._wasActiveOnMousedown||setTimeout(()=>{this.isConnected&&this.composer&&this.composer.focusEditor&&this.composer.focusEditor()},100)}_toggleExpand(){this.composeStore.updateComposer(this.instance.id,{expanded:!this.instance.expanded,minimized:!1})}_handleCloseClick(){if((this.instance.attachments||[]).some(e=>e.uploading)){this.composeStore.updateComposer(this.instance.id,{closing:!0});return}this.instance.dirty&&this._saveDraft(),this.composeStore.closeComposer(this.instance.id)}_handleDiscardClick(){this._clearAutoSave();let e=!!this.instance.draftUid,t=this.instance.dirty,n=(this.instance.to?.length||0)>0||(this.instance.cc?.length||0)>0||(this.instance.bcc?.length||0)>0,r=this.instance.attachments&&this.instance.attachments.length>0,i=this.instance.text?.trim()!==this.instance.initialText?.trim()||(this.instance.subject?.trim().length||0)>0||r;!(!n&&!i)||e||t?(this.pendingDiscardType=`delete`,this.showDiscardConfirm=!0):this._performDiscard(`delete`)}async _confirmDiscard(){this.showDiscardConfirm=!1;let e=this.pendingDiscardType;this.pendingDiscardType=null,this._performDiscard(e)}async _performDiscard(e){if(e===`delete`&&this.instance.draftUid&&this.instance.draftMailbox)try{await I.deleteMessages(this.instance.draftMailbox,[String(this.instance.draftUid)])}catch(e){b.error(`Failed to delete draft`,e)}if(this.instance.attachments)for(let e of this.instance.attachments)e._tempId?ar(e._tempId):e.uuid&&or(e.uuid);this.composeStore.closeComposer(this.instance.id)}_cancelDiscard(){this.showDiscardConfirm=!1,this.pendingDiscardType=null,this.instance.dirty&&this._scheduleAutoSave()}_bringToFront(){let e=this.composeStore.getState().activeComposers,t=1e3;e.forEach(e=>{e.zIndex&&e.zIndex>t&&(t=e.zIndex)}),this._wasActiveOnMousedown=(this.instance.zIndex||0)>=t,this.composeStore.bringComposerToFront(this.instance.id)}_handleLinkClick(){if(!this.composer)return;this.composer.focusEditor&&this.composer.focusEditor();let e=this.composer.hasSelection(),t=this.composer.getActiveLink?this.composer.getActiveLink():null;if(t)this.linkPromptFields=[{id:`url`,label:this.i18nStore?.t(`floatingComposer.linkUrl`),placeholder:this.i18nStore?.t(`floatingComposer.linkUrlPlaceholder`),value:t}];else{let t=e&&this.composer.getSelectionText?this.composer.getSelectionText():``;this.linkPromptFields=[{id:`text`,label:this.i18nStore?.t(`floatingComposer.displayText`),placeholder:this.i18nStore?.t(`floatingComposer.displayTextPlaceholder`),value:t},{id:`url`,label:this.i18nStore?.t(`floatingComposer.linkUrl`),placeholder:this.i18nStore?.t(`floatingComposer.linkUrlPlaceholder`)}]}setTimeout(()=>{(this.shadowRoot?.querySelectorAll(`#linkPopup input`)).forEach(e=>{e.value=this.linkPromptFields.find(t=>t.id===e.id)?.value||``})},50)}_handleLinkSubmit(){let e=this.shadowRoot?.querySelector(`#linkPopup`);if(e&&e.close(),!this.composer)return;let t=this.shadowRoot?.querySelectorAll(`#linkPopup input`),n={};t.forEach(e=>n[e.id]=e.value);let{text:r,url:i}=n;if(i)if(this.instance.format===`html`&&this.composer.editor){let e=this.composer.editor;if(r)e.chain().focus().insertContent(`<a href="${i}">${r}</a>`).command(({tr:t,dispatch:n})=>(n&&e.schema.marks.link&&t.removeStoredMark(e.schema.marks.link),!0)).run();else{let t=e.state.selection.to;e.chain().focus().setLink({href:i}).setTextSelection(t).command(({tr:t,dispatch:n})=>(n&&e.schema.marks.link&&t.removeStoredMark(e.schema.marks.link),!0)).run()}}else r?this.composer.insertFormatting(``,`[${r}](${i})`):this.composer.insertFormatting(`[`,`](${i})`)}async _handleSend(){if((this.instance.attachments||[]).some(e=>e.uploading)){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.attachmentsWait`),duration:3e3}}));return}let e=this.instance.text||``,t=this.instance.to||[],n=this.instance.cc||[],r=this.instance.bcc||[],i=[...t,...n,...r],a=(this.instance.subject||``).trim();if(!(!e||i.length===0||!a)){this._clearAutoSave(),this.composeStore.updateComposer(this.instance.id,{isSending:!0,minimized:!0});try{let e,t=new Promise(t=>{let n=window.setTimeout(()=>{t(!0)},pr);e=()=>{window.clearTimeout(n),t(!1)}});if(window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.sending`),actionLabel:this.i18nStore?.t(`composer.undo`),actionFn:()=>{e&&e()},duration:pr}})),!await t){this.composeStore.updateComposer(this.instance.id,{isSending:!1,minimized:!1}),this.composeStore.bringComposerToFront(this.instance.id);return}let n=this.composeStore.getComposer(this.instance.id)||this.instance,r=this._buildFormData(n),a=await y.invokeHookAsync(`composer:presend`,{composer:this,formData:r,instance:n}),o=!1;for(let e of a)e instanceof FormData?r=e:e===!1&&(o=!0);if(o){this.composeStore.updateComposer(this.instance.id,{isSending:!1,minimized:!1}),this.composeStore.bringComposerToFront(this.instance.id);return}await I.sendDraft(r),y.invokeHook(`composer:send`,{recipients:i}),n.draftMailbox&&N.fetch(n.draftMailbox,0,``,!1),this.composeStore.closeComposer(this.instance.id)}catch(e){b.error(`Failed to send message:`,e),this.composeStore.updateComposer(this.instance.id,{isSending:!1,minimized:!1,expanded:!1}),this._bringToFront(),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`composer.sendError`)?.replace(`{error}`,e.message),duration:5e3}}))}}}_toggleFormat(){let e=(this.instance.format||`html`)===`html`?`text`:`html`;this.composeStore.updateComposer(this.instance.id,{format:e}),requestAnimationFrame(()=>{setTimeout(()=>{this.isConnected&&this.composer&&this.composer.focusEditor&&this.composer.focusEditor()},0)})}_handleAttachClick(){let e=(this.settingsStore?.getState()?.maxAttachmentMiB||32)*1024*1024,t=(this.instance.attachments||[]).reduce((e,t)=>e+(t.size||0),0);sr(this.instance.id,e,t,...this._getUploadCallbacks())}_startUpload(e){let t=(this.settingsStore?.getState()?.maxAttachmentMiB||32)*1024*1024,n=(this.instance.attachments||[]).reduce((e,t)=>e+(t.size||0),0);cr(e,this.instance.id,t,n,...this._getUploadCallbacks())}_getUploadCallbacks(){return[(e,t)=>{let n=this.composeStore.getComposer(this.instance.id)?.attachments||[],r={_tempId:e,filename:t.name,size:t.size,uploading:!0,progress:0},i=[...n,r];this.composeStore.updateComposer(this.instance.id,{attachments:i})},(e,t)=>{let n=[...this.composeStore.getComposer(this.instance.id)?.attachments||[]],r=n.findIndex(t=>t._tempId===e);r!==-1&&(n[r]={...n[r],progress:t},this.composeStore.updateComposer(this.instance.id,{attachments:n}))},(e,t)=>{let n=[...this.composeStore.getComposer(this.instance.id)?.attachments||[]],r=n.findIndex(t=>t._tempId===e);if(r!==-1){let e={...n[r],uuid:t[0]};delete e.uploading,delete e.progress,delete e._tempId,n[r]=e,this.composeStore.updateComposer(this.instance.id,{attachments:n});let i=this.composeStore.getComposer(this.instance.id),a=(i?.attachments||[]).some(e=>e.uploading);i?.closing&&!a?this._saveDraft().then(()=>{this.composeStore.closeComposer(this.instance.id)}):this._saveDraft()}},(e,t)=>{b.error(`Failed to upload attachment:`,t);let n=[...this.composeStore.getComposer(this.instance.id)?.attachments||[]],r=n.findIndex(t=>t._tempId===e);r!==-1&&(n.splice(r,1),this.composeStore.updateComposer(this.instance.id,{attachments:n}));let i=this.composeStore.getComposer(this.instance.id),a=(i?.attachments||[]).some(e=>e.uploading);i?.closing&&!a?this._saveDraft().then(()=>{this.composeStore.closeComposer(this.instance.id)}):i?.closing||alert(this.i18nStore?.t(`floatingComposer.uploadFailed`,{error:t.message||this.i18nStore?.t(`floatingComposer.unknownError`)}))}]}_removeAttachment(e){let t=[...this.instance.attachments||[]],n=t.splice(e,1)[0];n?._tempId?ar(n._tempId):n?.uuid&&or(n.uuid),this.composeStore.updateComposer(this.instance.id,{attachments:t})}static{this.styles=n`
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
      .header-actions alps-icon-btn[title="Minimize"],
      .header-actions alps-icon-btn[title="Expand"] {
        display: none;
      }
    }
  `}render(){if(this.instance.closing)return s`<style>:host { display: none !important; }</style>`;let e=((this.instance.to?.length||0)>0||(this.instance.cc?.length||0)>0||(this.instance.bcc?.length||0)>0)&&(this.instance.text?.trim().length||0)>0,t,n;if(this.instance.minimized)t=24,n=24+this.minimizedIndex*40;else{let e=this.totalMinimized>0?276:0;if(t=24+e+this.openIndex*486,n=0,24+e+this.totalOpen*470>this.windowWidth&&this.totalOpen>1){let n=this.windowWidth-470-48-e,r=n>0?n/(this.totalOpen-1):32;t=24+e+this.openIndex*Math.min(r,470)}}let r,i,a,o,c=this.windowWidth<=768;return this.showDiscardConfirm?(this.style.zIndex=`30000`,c?(a=this.windowWidth,o=this.windowHeight,i=0,r=0,this.removeAttribute(`expanded`)):this.instance.expanded?(a=Math.min(this.windowWidth*.85,800),o=this.windowHeight*.8,i=(this.windowWidth-a)/2,r=(this.windowHeight-o)/2,this.setAttribute(`expanded`,``)):(a=this.instance.minimized?260:470,o=this.instance.minimized?40:500,i=this.windowWidth-t-a,r=this.windowHeight-n-o,this.removeAttribute(`expanded`))):c?(a=this.windowWidth,o=this.windowHeight,i=0,r=0,this.style.zIndex=`30000`,this.removeAttribute(`expanded`)):this.instance.expanded?(a=Math.min(this.windowWidth*.85,800),o=this.windowHeight*.8,i=(this.windowWidth-a)/2,r=(this.windowHeight-o)/2,this.style.zIndex=`30000`,this.setAttribute(`expanded`,``)):(a=this.instance.minimized?260:470,o=this.instance.minimized?40:500,i=this.windowWidth-t-a,r=this.windowHeight-n-o,this.style.zIndex=`${this.instance.zIndex||1e3}`,this.removeAttribute(`expanded`)),c?(this.style.width=`100%`,this.style.height=`100dvh`,this.style.left=`0`,this.style.top=`0`):(this.style.width=`${a}px`,this.style.height=`${o}px`,this.style.left=`${i}px`,this.style.top=`${r}px`),this.instance.minimized?this.setAttribute(`minimized`,``):this.removeAttribute(`minimized`),s`
      ${this.instance.expanded?s`<div class="backdrop"></div>`:``}
      
      ${this.showDiscardConfirm?s`
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
        
        ${this.isDragOver&&!this.instance.isSending?s`
          <div class="drag-overlay" @dragleave=${this._handleDragLeave}>
            <div class="drag-drop-zone">
              <svg viewBox="0 0 256 256">
                <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216ZM128,112a8,8,0,0,0-8,8v44.69l-22.34-22.35a8,8,0,0,0-11.32,11.32l36,36a8,8,0,0,0,11.32,0l36-36a8,8,0,0,0-11.32-11.32L136,164.69V120A8,8,0,0,0,128,112Z"></path>
              </svg>
              <span>${this.i18nStore?.t(`floatingComposer.dropFiles`)}</span>
            </div>
          </div>
        `:``}

        ${this.instance.isSending?s`
          <div class="sending-overlay">
            <alps-loader></alps-loader>
          </div>
        `:``}
        
        <div class="header" @click=${this._handleHeaderClick}>
          <div class="header-title">${this.instance.subject||this.i18nStore?.t(`floatingComposer.newMessage`)}</div>
          <div class="header-actions">
            ${this.isSaving?s`<span class="saving-indicator">${this.i18nStore?.t(`floatingComposer.saving`)}</span>`:this.instance.draftUid&&!this.instance.dirty?s`<span class="saving-indicator">${this.i18nStore?.t(`floatingComposer.autosaved`)}</span>`:``}
            <alps-icon-btn 
              title="${this.instance.minimized?this.i18nStore?.t(`floatingComposer.restore`):this.i18nStore?.t(`floatingComposer.minimize`)}" 
              icon="${this.instance.minimized?`caretUp`:`composerMinimize`}"
              @click=${e=>{e.stopPropagation(),this._toggleMinimize()}}>
            </alps-icon-btn>
            <alps-icon-btn 
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
            ${!this.showCc||!this.showBcc?s`
              <div class="cc-bcc-toggles">
                ${this.showCc?``:s`<span @click=${()=>this.showCc=!0}>${this.i18nStore?.t(`floatingComposer.cc`)}</span>`}
                ${this.showBcc?``:s`<span @click=${()=>this.showBcc=!0}>${this.i18nStore?.t(`floatingComposer.bcc`)}</span>`}
              </div>
            `:``}
          </div>

          ${this.showCc?s`
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

          ${this.showBcc?s`
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
                title=${this.i18nStore?.t(`floatingComposer.toggleFormatting`)} 
                icon="textAa"
                @click=${this._toggleFormat}>
              </alps-icon-btn>
              <alps-icon-btn 
                title=${this.i18nStore?.t(`floatingComposer.attachFiles`)} 
                icon="paperclip"
                @click=${this._handleAttachClick}>
              </alps-icon-btn>
              ${(this.instance.format||`html`)===`html`?s`
                <alps-popup id="linkPopup" align="left" position="top">
                  <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`floatingComposer.insertLink`)} icon="linkSimple" @mousedown=${e=>e.preventDefault()} @click=${this._handleLinkClick}></alps-icon-btn>
                  <div class="popup-form" @keydown=${e=>{e.key===`Enter`&&this._handleLinkSubmit()}}>
                    ${this.linkPromptFields.map(e=>s`
                      <div class="field-group">
                        <label for=${e.id}>${e.label}</label>
                        <alps-input inputId=${e.id} type="text" placeholder=${e.placeholder}></alps-input>
                      </div>
                    `)}
                    <div class="popup-actions">
                      <alps-button variant="text" @click=${()=>(this.shadowRoot?.querySelector(`#linkPopup`))?.close()}>${this.i18nStore?.t(`general.cancel`)}</alps-button>
                      <alps-button variant="normal" @click=${this._handleLinkSubmit}>${this.i18nStore?.t(`floatingComposer.apply`)}</alps-button>
                    </div>
                  </div>
                </alps-popup>
              `:``}
              
              ${y.invokeHook(`composer:toolbar`,{composer:this,instance:this.instance})?.filter(Boolean)}
              
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
    `}};E([g({context:L})],$.prototype,`composeStore`,void 0),E([g({context:S})],$.prototype,`i18nStore`,void 0),E([g({context:C})],$.prototype,`settingsStore`,void 0),E([o({type:Object})],$.prototype,`instance`,void 0),E([o({type:Number})],$.prototype,`index`,void 0),E([o({type:Number})],$.prototype,`totalOpen`,void 0),E([o({type:Number})],$.prototype,`totalMinimized`,void 0),E([o({type:Number})],$.prototype,`openIndex`,void 0),E([o({type:Number})],$.prototype,`minimizedIndex`,void 0),E([a()],$.prototype,`showCc`,void 0),E([a()],$.prototype,`showBcc`,void 0),E([a()],$.prototype,`showDiscardConfirm`,void 0),E([a()],$.prototype,`pendingDiscardType`,void 0),E([a()],$.prototype,`windowWidth`,void 0),E([a()],$.prototype,`windowHeight`,void 0),E([a()],$.prototype,`isSaving`,void 0),E([a()],$.prototype,`isDragOver`,void 0),E([a()],$.prototype,`linkPromptFields`,void 0),$=E([m(`alps-floating-composer`)],$);var mr=class extends d{constructor(...e){super(...e),this.show=!1,this.message=``,this.actionLabel=``,this.timeout=0,this._timer=null}updated(e){e.has(`show`)&&(this.show&&this.timeout>0?(this._timer&&clearTimeout(this._timer),this._timer=setTimeout(()=>{this.dismiss()},this.timeout)):!this.show&&this._timer&&(clearTimeout(this._timer),this._timer=null))}dismiss(){this.show=!1,this.dispatchEvent(new CustomEvent(`dismiss`)),this.onAction=void 0}handleAction(){this.onAction?this.onAction():this.dispatchEvent(new CustomEvent(`action`)),this.dismiss()}static{this.styles=n`
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
    `}};E([g({context:S})],mr.prototype,`i18nStore`,void 0),E([o({type:Boolean,reflect:!0})],mr.prototype,`show`,void 0),E([o({type:String})],mr.prototype,`message`,void 0),E([o({type:String})],mr.prototype,`actionLabel`,void 0),E([o({type:Object})],mr.prototype,`onAction`,void 0),E([o({type:Number})],mr.prototype,`timeout`,void 0),mr=E([m(`alps-toast`)],mr);var hr=new class{constructor(){this.events=[`mousedown`,`mousemove`,`keypress`,`scroll`,`touchstart`],this.logoutMinutes=0,this.lastActivity=Date.now(),this.lastPing=Date.now(),this.checkInterval=null,this.handleActivity=()=>{this.lastActivity=Date.now()}}setLogoutTime(e){let t=this.logoutMinutes>0;this.logoutMinutes=e;let n=this.logoutMinutes>0;n&&!t?(this.attachEvents(),this.startInterval()):!n&&t?(this.detachEvents(),this.clearInterval()):n&&t&&(this.lastActivity=Date.now())}attachEvents(){this.events.forEach(e=>document.addEventListener(e,this.handleActivity,{passive:!0})),this.lastActivity=Date.now()}detachEvents(){this.events.forEach(e=>document.removeEventListener(e,this.handleActivity))}startInterval(){this.clearInterval(),this.checkInterval=setInterval(()=>this.checkTimeout(),3e4)}clearInterval(){this.checkInterval&&=(clearInterval(this.checkInterval),null)}checkTimeout(){if(this.logoutMinutes<=0)return;if(window.location.hash===`#/login`||window.location.hash===``){this.lastActivity=Date.now();return}let e=Date.now()-this.lastActivity;e>=this.logoutMinutes*60*1e3?this.logout():e<300*1e3&&Date.now()-this.lastPing>300*1e3&&this.pingBackend()}async pingBackend(){this.lastPing=Date.now();try{await fetch(`/session`)}catch{}}async logout(){if(this.clearInterval(),this.detachEvents(),this.onBeforeLogout)try{await this.onBeforeLogout()}catch(e){b.error(`Failed to run onBeforeLogout hook`,e)}try{await fetch(`/session`,{method:`DELETE`}),At.clear(),Ne(),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`,this.lastActivity=Date.now(),this.setLogoutTime(this.logoutMinutes)}catch(e){b.error(`Failed to auto sign out`,e)}}},gr=3e3,_r=class extends d{constructor(...e){super(...e),this.composeStore=new Kt,this.settingsStore=new Me,this.i18nStore=new ke,this.linkedAccountsStore=qt,this.activeComposers=[],this.toasts=[],this.toastIdCounter=0,this.isOffline=!navigator.onLine,this.offlineCountdown=0,this.offlineInterval=null,this._handlePluginsUpdated=()=>{this.requestUpdate()},this._handleGlobalDragOver=e=>{e.preventDefault()},this._handleGlobalDrop=e=>{e.preventDefault(),window.dispatchEvent(new CustomEvent(`alps-composer-drop`))},this._handleAuthError=()=>{sessionStorage.clear(),Ne(),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`},this._verifyConnectivity=async()=>{if(!navigator.onLine)return!1;try{let e=await fetch(`/site.webmanifest`,{method:`HEAD`,cache:`no-store`});return!(e.status===502||e.status===503||e.status===504)}catch{return!1}},this._handleOnlineEvent=async()=>{await this._verifyConnectivity()?(this.isOffline=!1,this._stopOfflineCountdown()):this._handleOfflineEvent()},this._handleOfflineEvent=()=>{this.isOffline||(this.isOffline=!0,this.offlineCountdown=10,this._startOfflineCountdown())},this._isPinging=!1,this._handleShowToast=e=>{let t=++this.toastIdCounter,n={id:t,message:e.detail.message,actionLabel:e.detail.actionLabel||``,actionFn:e.detail.actionFn,timeout:e.detail.duration||gr,show:!1};this.toasts=[...this.toasts,n],requestAnimationFrame(()=>{this.toasts=this.toasts.map(e=>e.id===t?{...e,show:!0}:e)})},this._handleBeforeUnload=e=>{if(this.activeComposers.some(e=>e.isSending))return e.preventDefault(),`You have a message currently sending. Are you sure you want to leave?`},this._handleComposeChange=()=>{this.activeComposers=this.composeStore.getState().activeComposers},this._handleSettingsChange=()=>{let e=this.settingsStore.getState();hr.setLogoutTime(e.autoLogout??0),this.i18nStore.setLanguage(e.language??`en`)},this.mailboxPageTemplate=s`<mailbox-page></mailbox-page>`,this.router=new Gn(this.getRoutes(),()=>s`<div>404 Not Found</div>`,()=>this.requestUpdate())}static{this.styles=n`
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
  `}connectedCallback(){super.connectedCallback();let e=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`))||document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));!e&&!window.location.hash.startsWith(`#/login`)&&(window.location.hash=`#/login`),this.composeStore.addEventListener(`change`,this._handleComposeChange),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this.activeComposers=this.composeStore.getState().activeComposers;let t=this.settingsStore.getState().autoLogout??0;hr.setLogoutTime(t),hr.onBeforeLogout=async()=>{await this.composeStore.saveAllDirtyDrafts()};let n=this.settingsStore.getState().language??`en`;this.i18nStore.setLanguage(n),window.addEventListener(`auth-error`,this._handleAuthError),window.addEventListener(`show-toast`,this._handleShowToast),window.addEventListener(`beforeunload`,this._handleBeforeUnload),window.addEventListener(`online`,this._handleOnlineEvent),window.addEventListener(`offline`,this._handleOfflineEvent),window.addEventListener(`network-error`,this._handleOfflineEvent),window.addEventListener(`dragover`,this._handleGlobalDragOver),window.addEventListener(`drop`,this._handleGlobalDrop),window.addEventListener(`plugins-updated`,this._handlePluginsUpdated),this.isOffline&&this._handleOfflineEvent(),e&&this._fetchSessionData()}async _fetchSessionData(){try{let e=await fetch(`/session`);if(e.ok){let t=await e.json();t.EnabledPlugins&&y.setEnabledPlugins(t.EnabledPlugins)}}catch(e){console.error(`Failed to fetch session data`,e)}}disconnectedCallback(){super.disconnectedCallback(),this.composeStore.removeEventListener(`change`,this._handleComposeChange),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),window.removeEventListener(`auth-error`,this._handleAuthError),window.removeEventListener(`show-toast`,this._handleShowToast),window.removeEventListener(`beforeunload`,this._handleBeforeUnload),window.removeEventListener(`online`,this._handleOnlineEvent),window.removeEventListener(`offline`,this._handleOfflineEvent),window.removeEventListener(`network-error`,this._handleOfflineEvent),window.removeEventListener(`dragover`,this._handleGlobalDragOver),window.removeEventListener(`drop`,this._handleGlobalDrop),window.removeEventListener(`plugins-updated`,this._handlePluginsUpdated),this._stopOfflineCountdown()}_startOfflineCountdown(){this._stopOfflineCountdown(),this.offlineInterval=window.setInterval(async()=>{if(this.offlineCountdown>1)this.offlineCountdown--;else{if(this.offlineCountdown=10,this._isPinging)return;this._isPinging=!0;try{await this._verifyConnectivity()&&(this.isOffline=!1,this._stopOfflineCountdown())}finally{this._isPinging=!1}}},1e3)}_stopOfflineCountdown(){this.offlineInterval!==null&&(clearInterval(this.offlineInterval),this.offlineInterval=null)}_handleDismissToast(e){this.toasts=this.toasts.map(t=>t.id===e?{...t,show:!1}:t),setTimeout(()=>{this.toasts=this.toasts.filter(t=>t.id!==e)},300)}getRoutes(){let e={"/":()=>this.mailboxPageTemplate,"/login":()=>s`<login-page></login-page>`,"/mailbox/*":()=>this.mailboxPageTemplate,"/settings":()=>s`<settings-page category="general"></settings-page>`,"/settings/*":()=>{let e=window.location.hash.match(/^#\/settings\/?(.*)$/);return s`<settings-page .category=${e&&e[1]?e[1].split(`?`)[0]:`general`}></settings-page>`},"/original":()=>s`<original-message-page></original-message-page>`,"/print":()=>s`<print-page></print-page>`,"/login/webauthn":()=>s`<login-webauthn-page></login-webauthn-page>`};return y.getRoutes().forEach(t=>{let n=null;e[t.path]=()=>(n||=document.createElement(t.component),n)}),e}render(){let e=this.activeComposers.filter(e=>!e.minimized).length,t=this.activeComposers.filter(e=>e.minimized).length,n=0,r=0;return s`
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
              <use href="/assets/icons/sprite.svg?v=7#wifiSlash"></use>
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
    `}};E([i({context:L})],_r.prototype,`composeStore`,void 0),E([i({context:C})],_r.prototype,`settingsStore`,void 0),E([i({context:S})],_r.prototype,`i18nStore`,void 0),E([i({context:Jt})],_r.prototype,`linkedAccountsStore`,void 0),E([a()],_r.prototype,`activeComposers`,void 0),E([a()],_r.prototype,`toasts`,void 0),E([a()],_r.prototype,`isOffline`,void 0),E([a()],_r.prototype,`offlineCountdown`,void 0),_r=E([m(`app-root`)],_r);var vr=Object.assign({"../../plugins/caldav/frontend/index.ts":Tt,"../../plugins/carddav/frontend/index.ts":An,"../../plugins/gpg/frontend/index.ts":Ln,"../../plugins/managesieve/frontend/index.ts":Hn,"../../plugins/password/frontend/index.ts":Wn});b.info(`Loaded ${Object.keys(vr).length} frontend plugins.`);