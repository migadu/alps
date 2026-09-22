const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/openpgp-BXFLORuu.js","assets/rolldown-runtime-S-ySWqyJ.js","assets/alps-floating-composer-zfcHv2nF.js","assets/editor-C3zCYtXa.js","assets/lit-Db_Hq7O1.js","assets/emoji-C1rmM34F.js"])))=>i.map(i=>d[i]);
import{n as e,r as t}from"./rolldown-runtime-S-ySWqyJ.js";import{_ as n,a as r,c as i,d as a,f as o,g as s,h as c,i as l,l as u,m as d,o as f,p,r as m,s as h,u as ee,v as g}from"./lit-Db_Hq7O1.js";import{n as te,r as ne,t as re}from"./vendor-CqVKsHuZ.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function _(e,t){if(e===null||t===null)return e===t;if(e.size!==t.size)return!1;for(let n of e)if(!t.has(n))return!1;return!0}var v=new class{constructor(){this.navTabs=[],this.settingsTabs=[],this.routes=[],this.hooks=new Map,this.enabledPlugins=null}setEnabledPlugins(e){let t=new Set(e);_(this.enabledPlugins,t)||(this.enabledPlugins=t,window.dispatchEvent(new CustomEvent(`plugins-updated`)))}isEnabled(e){return this.enabledPlugins===null||this.enabledPlugins.has(e)}registerHook(e,t,n){this.hooks.has(e)||this.hooks.set(e,[]),this.hooks.get(e).push({handler:t,pluginId:n})}enabledHandlers(e){return(this.hooks.get(e)||[]).filter(e=>!e.pluginId||this.isEnabled(e.pluginId)).map(e=>e.handler)}async invokeHookAsync(e,t){let{results:n}=await this.invokeHookSettled(e,t);return n}async invokeHookSettled(e,t){let n=this.enabledHandlers(e),r=await Promise.allSettled(n.map(e=>e(t))),i=[],a=0;for(let t of r)t.status===`fulfilled`?i.push(t.value):(a+=1,console.error(`Error in async hook ${e}:`,t.reason));return{results:i,failed:a}}invokeHook(e,t){let n=this.enabledHandlers(e),r=[];return n.forEach(n=>{try{r.push(n(t))}catch(t){console.error(`Error in hook ${e}:`,t)}}),r}registerNavTab(e){this.navTabs.find(t=>t.id===e.id)||this.navTabs.push(e)}getNavTabs(){let e=this.navTabs;return this.enabledPlugins!==null&&(e=e.filter(e=>this.isEnabled(e.pluginId||e.id))),e.slice().sort((e,t)=>(e.order||999)-(t.order||999))}registerSettingsTab(e){this.settingsTabs.find(t=>t.id===e.id)||this.settingsTabs.push(e)}getSettingsTabs(){return this.enabledPlugins===null?this.settingsTabs:this.settingsTabs.filter(e=>this.isEnabled(e.pluginId||e.id))}registerRoute(e){this.routes.find(t=>t.path===e.path)||this.routes.push(e)}getRoutes(){return this.enabledPlugins===null?this.routes:this.routes.filter(e=>!e.pluginId||this.isEnabled(e.pluginId))}},y=e({default:()=>ie}),ie={calendar:{deleteCalendarFailed:`The calendar could not be deleted.`,deleteEventFailed:`The event could not be deleted.`,saveCalendarFailed:`The calendar could not be saved.`,saveEventFailed:`The event could not be saved.`,saveConflict:`This event was changed on another device, so your edit was not saved. Close the editor and open the event again to see the latest version.`,loadFailed:`Could not load your calendar. Check your connection and try again.`,months:{0:`January`,1:`February`,2:`March`,3:`April`,4:`May`,5:`June`,6:`July`,7:`August`,8:`September`,9:`October`,10:`November`,11:`December`},monthsShort:{0:`Jan`,1:`Feb`,2:`Mar`,3:`Apr`,4:`May`,5:`Jun`,6:`Jul`,7:`Aug`,8:`Sep`,9:`Oct`,10:`Nov`,11:`Dec`},days:{0:`Sunday`,1:`Monday`,2:`Tuesday`,3:`Wednesday`,4:`Thursday`,5:`Friday`,6:`Saturday`},daysShort:{0:`Sun`,1:`Mon`,2:`Tue`,3:`Wed`,4:`Thu`,5:`Fri`,6:`Sat`},daysNarrow:{0:`S`,1:`M`,2:`T`,3:`W`,4:`T`,5:`F`,6:`S`},title:`Calendar`,myCalendars:`My Calendars`,addEvent:`Add Event`,rename:`Rename`,delete:`Delete`,addCalendar:`Add Calendar`,renameCalendar:`Rename Calendar`,deleteCalendar:`Delete Calendar`,calendarName:`Calendar Name`,searchResults:`Search Results`,noResults:`No events found matching your search.`,day:`Day`,week:`Week`,month:`Month`,year:`Year`,today:`Today`,allDay:`All Day`,noTitle:`(No title)`,location:`Location`,notes:`Notes`,editEvent:`Edit Event`,deleteEvent:`Delete Event`,newEvent:`New Event`,summary:`Summary`,eventTitle:`Event title`,calendar:`Calendar`,startDate:`Start Date`,endDate:`End Date`,time:`Time`,addLocation:`Add location`,addDescription:`Add description`,description:`Description`,moreEvents:`+{count} more`,repeat:`Repeat`,repeatNone:`Do not repeat`,repeatDaily:`Daily`,repeatWeekly:`Weekly`,repeatMonthly:`Monthly`,repeatYearly:`Yearly`,repeatCustom:`Custom`},tasks:{title:`Tasks`,addTask:`Add Task`,newTask:`New Task`,editTask:`Edit Task`,allTasks:`All Tasks`,today:`Today`,upcoming:`Upcoming`,undated:`No Due Date`,completed:`Completed`,searchResults:`Search Results`,lists:`Lists`,newList:`New List`,listName:`List Name`,list:`List`,noTasks:`Nothing to do.`,noResults:`No tasks match your search.`,untitled:`(No title)`,titleField:`Title`,titlePlaceholder:`What needs doing?`,notes:`Notes`,addNotes:`Add notes`,due:`Due`,time:`Time`,allDay:`All Day`,status:`Status`,percentComplete:`Percent Complete`,priority:`Priority`,repeat:`Repeat`,repeatNeedsDue:`Add a due date to repeat this task.`,assignedBy:`Assigned by`,assignedTo:`Assigned to`,delete:`Delete`,deleteTask:`Delete Task`,deleteTaskConfirm:`Are you sure you want to delete this task?`,markDone:`Mark as done`,markNotDone:`Mark as not done`,repeats:`Repeats`,movedToNext:`Done. The task repeats, and is now due {date}.`,loadFailed:`Could not load your tasks. Check your connection and try again.`,someListsFailed:`Some lists could not be loaded, so not every task is shown.`,saveFailed:`The task could not be saved.`,saveConflict:`This task was changed on another device, so your edit was not saved. Close the editor and open the task again to see the latest version.`,completeFailed:`The task could not be updated.`,deleteFailed:`The task could not be deleted.`,createListFailed:`The list could not be created.`,assignTo:`Assign to`,notifyChanges:`The people this task is assigned to can be sent the changes.`,deleteTellAssignees:`The people this task is assigned to can be told it is cancelled.`,deleteTellAssigner:`Whoever assigned this task can be told you will not do it.`,groups:{overdue:`Overdue`,today:`Today`,week:`Next 7 Days`,undated:`No Due Date`,later:`Later`,completed:`Completed`},statuses:{needsAction:`Not Started`,inProcess:`In Progress`,completed:`Completed`,cancelled:`Cancelled`},priorities:{none:`None`,high:`High`,medium:`Medium`,low:`Low`}},invitations:{kinds:{invitation:`Invitation`,updated:`Updated invitation`,cancelled:`Cancelled`,reply:`Answer`,event:`Event`,task:`Task`},accept:`Accept`,maybe:`Maybe`,decline:`Decline`,yourAnswer:`Your answer`,organizer:`Organizer`,guests:`Guests`,calendar:`Calendar`,repeats:`Repeats`,conflictsWith:`Conflicts with {names}`,noConflicts:`No conflicts in your calendar`,statuses:{accepted:`Accepted`,tentative:`Maybe`,declined:`Declined`,needsAction:`Not answered`,delegated:`Delegated`,completed:`Completed`,inProcess:`In progress`},answered:{accepted:`{name} accepted.`,tentative:`{name} might attend.`,declined:`{name} declined.`,needsAction:`{name} has not answered yet.`,delegated:`{name} passed this on to someone else.`,completed:`{name} completed the task.`,inProcess:`{name} is working on the task.`},states:{organizer:`You organize this.`,notInvited:`None of your addresses is on the guest list, so you cannot answer this invitation.`,outdated:`Your calendar already has a newer version.`,update:`This is newer than the version in your calendar.`,cancel:`The organizer has cancelled this.`,cancelled:`The organizer has cancelled this. It is not in your calendar.`,reply:`This answer is not in your calendar yet.`,replied:`Your calendar has this answer.`,unknown:`This answer is about nothing in your calendar.`,add:`This is not in your calendar.`,added:`This is in your calendar.`,ended:`This event is over.`,unsupported:`This calendar message cannot be acted on here.`},unverified:`Sent from {sender}, who is not the organizer.`,unverifiedReply:`Sent from {sender}, not by the guest who answered.`,updateCalendar:`Update calendar`,removeFromCalendar:`Remove from calendar`,recordAnswer:`Record answer`,addToCalendar:`Add to calendar`,saved:`Saved to your calendar.`,sent:`Saved to your calendar, and your answer was sent to the organizer.`,sendFailed:`Saved to your calendar, but your answer could not be sent to the organizer.`,updated:`Your calendar has been updated.`,removed:`Removed from your calendar.`,added:`Added to your calendar.`,answerFailed:`Your answer could not be saved.`,applyFailed:`Your calendar could not be updated.`,organizedBy:`Organized by {name}`,notifyTitle:`Send updates to the guests?`,notifyChanges:`Your guests can be sent the changes to this event.`,send:`Send`,dontSend:`Don't send`,deleteTellGuests:`The guests can be told that this event is cancelled.`,deleteTellOrganizer:`The organizer can be told that you will not attend.`,deleteAndTell:`Delete and tell them`,deleteOnly:`Just delete`,notTold:`Done, but the email about it could not be sent.`,changedElsewhere:`This was changed on another device in the meantime. Open the message again to see where it stands.`}},ae=e({default:()=>oe}),oe={contacts:{deleteFailed:`{failed} of {total} contacts could not be deleted.`,categoryRenameFailed:`{failed} of {total} contacts could not be updated, so the category was only partly renamed.`,categoryDeleteFailed:`{failed} of {total} contacts could not be updated, so the category was only partly removed.`,categoryUpdateFailed:`{failed} of {total} contacts could not be updated.`,saveFailed:`The contact could not be saved.`,saveConflict:`This contact was changed on another device, so your edit was not saved. Cancel the edit to see the latest version.`,starFailed:`The contact could not be updated.`,unnamedContact:`Unnamed Contact`,title:`Contacts`,allContacts:`All Contacts`,favorites:`Favorites`,addContact:`Add Contact`,createCategory:`Create Category`,categoryName:`Category Name`,renameCategory:`Rename Category`,deleteCategory:`Delete Category`,deleteCategoryConfirm:`Are you sure you want to delete the category '{category}'? This will remove it from all contacts. No contacts will be deleted.`,rename:`Rename`,delete:`Delete`,create:`Create`,add:`Add`,newCategory:`New Category`,refreshContacts:`Refresh Contacts`,sortZa:`Sort Z-A`,sortAz:`Sort A-Z`,filterStarred:`Filter Starred`,uncategorized:`Uncategorized`,addToCategory:`Add to Category`,deleteContact:`Delete Contact`,deleteContactConfirm:`Are you sure you want to delete this contact?`,editContact:`Edit Contact`,save:`Save`,cancel:`Cancel`,noContacts:`No contacts found`,selectContact:`Select a contact to view details`,selectedContacts:{one:`{count} contact selected`,other:`{count} contacts selected`},clearSelection:`Clear selection`,selectAll:`Select All`,clearSearch:`Clear Search`,searchContacts:`Search contacts...`,details:`Details`,notes:`Notes`,name:`Name`,nickname:`Nickname`,organization:`Organization`,titleField:`Title`,email:`Email`,phone:`Phone`,address:`Address`,url:`URL`,birthday:`Birthday`,back:`Back`,toggleStar:`Toggle Star`,publicKey:`Public Key`}},se=e({default:()=>ce}),ce={settings:{gpg:`GPG Keys`},gpg:{toggleEncryption:`Toggle GPG Encryption`,decryptedSuccess:`The content of this message was end-to-end encrypted with GPG.`,decryptedFailed:`This message is encrypted but no matching private key is found on server to decrypt it.`,passphraseRequired:`GPG Passphrase Required`,passphraseSetTitle:`Set GPG Passphrase`,passphraseConfirmTitle:`Confirm GPG Passphrase`,passphrasePrompt:`Please enter your passphrase to unlock your private key.`,passphraseLockPrompt:`Please enter a new passphrase to encrypt your private key.`,passphraseConfirmPrompt:`Please re-enter your passphrase to confirm.`,passphrase:`Passphrase`,cancel:`Cancel`,unlock:`Unlock`,lock:`Set Passphrase`,confirm:`Confirm`,yourGpgKey:`Your GPG Key`,keyStoredSecurely:`You have a GPG keypair stored securely on the server. The private key is encrypted with your passphrase.`,publicKey:`Public Key`,purgeKeys:`Purge Keypair`,generateNewKeypair:`Generate New Keypair`,enableEncryptionDesc:`To enable end-to-end encryption between contacts that support it, you'll need a GPG keypair.`,noKeyPresent:`No key present`,passphraseRequiredLabel:`Passphrase (Required)`,generateKeysBtn:`Generate Keys`,importExistingKeys:`Import Existing GPG Keypair`,publicKeyBlock:`Public Key Block`,privateKeyBlock:`Private Key Block`,importUnencryptedDesc:`Paste your public and private key blocks, e.g. from "gpg --armor --export-secret-keys". If the private key is passphrase-protected, you'll be asked for its current passphrase, then to set a new one.`,importIncorrectPassphrase:`Incorrect passphrase for the private key. Please try again.`,importKeysBtn:`Import Keys`,purgeConfirm:`Are you sure you want to permanently delete your GPG keys from the server? Past encrypted emails will become unreadable.`,passphraseMissing:`Passphrase is required to encrypt your new private key.`,importMissing:`Both public and private blocks are required for import.`,generateFailed:`Failed to generate keys: {error}`,importFailed:`Import failed: {error}`,importFailedTitle:`Import Failed`,passphraseMismatch:`Passphrases do not match. Please try again.`,missingPublicKeys:`Cannot encrypt: Missing public keys for:
{keys}`,attachmentsNotEncryptable:`Attachments cannot be encrypted with inline PGP and would be sent unencrypted. Remove the attachments, or turn off encryption to send them.`}},le=e({default:()=>ue}),ue={settings:{categories:{filters:`Filters`}},managesieve:{title:`Filters`,description:`Add custom rules on how messages are processed and filed.`,tabs:{switchToRaw:`Raw Editor`},warningRawSwitchTitle:`Switch to Raw Mode`,warningRawSwitchConfirm:`Switch`,warningRawSwitch:`Switching to raw mode means the script will no longer be editable visually. Continue?`,toast:{saved:`Rules saved and activated.`,deactivated:`Rules deactivated.`,valid:`Script is valid!`,networkError:`Network error occurred.`},visual:{newRule:`New Rule`,noRules:`No rules defined.`,saveFilters:`Save`,deleteRule:`Delete Rule`,remove:`Remove`,add:`Add`,if:`IF`,all:`ALL`,any:`ANY`,ofTheFollowing:`of the following conditions match`,then:`THEN`,actions:{fileinto:`Move to folder`,discard:`Discard (Delete)`,redirect:`Redirect to email`,stop:`Stop evaluating rules`},fields:{subject:`Subject`,from:`From`,to:`To`,body:`Body`,size:`Size`,emailAddress:`Email Address`},operators:{contains:`Contains`,not_contains:`Does not contain`,is:`Is exactly`,not_is:`Is not exactly`,over:`Over`,under:`Under`}},raw:{validate:`Validate`,save:`Save`}}},de=e({default:()=>fe}),fe={settings:{categories:{password:`Password`},password:{title:`Password`,changePassword:`Change Password`,changePasswordDesc:`Update your account password.`,oldPassword:`Current Password`,newPassword:`New Password`,confirmPassword:`Confirm New Password`,updatePassword:`Update Password`,fillAllFields:`Please fill in all fields.`,passwordMismatch:`New passwords do not match.`}}},pe={tags:{important:`Important`,work:`Work`,personal:`Personal`,todo:`To Do`,later:`Later`},settings:{saveFailed:`Could not save that setting — it may not survive signing out`,title:`Settings`,categories:{general:`General`,identity:`Identity`,reading:`Reading & Composing`,appearance:`Appearance`,localization:`Localization`,accounts:`Linked Accounts`,accountsDesc:`Pre-authorized accounts for quick switching between.`,webauthn:`2FA / WebAuthn`},loading:`Loading...`,placeholderName:`Your Name`,placeholderReplyTo:`reply@example.com`,general:{checkMailInterval:`Check mail interval`,checkMailIntervalDesc:`How often to automatically check for new mail.`,autoLogout:`Auto-logout`,autoLogoutDesc:`Automatically log out after inactivity.`,desktopNotifications:`Enable Desktop Notifications`,soundNotifications:`Play sound notification on new messages`,everyMinute:`Every minute`,every5Minutes:`Every 5 minutes`,every15Minutes:`Every 15 minutes`,every30Minutes:`Every 30 minutes`,never:`Never`,minutes15:`15 minutes`,minutes30:`30 minutes`,hour1:`1 hour`,hours2:`2 hours`,hours6:`6 hours`},identity:{displayName:`Display Name`,displayNameDesc:`The name shown to recipients when you send an email.`,signature:`Signature`,signatureDesc:`Appended to the end of your sent messages.`,replyTo:`Reply-To Address`,replyToDesc:`Optional: specify a different address for replies.`,bccMyself:`Always BCC myself on outgoing mail`},reading:{messagesPerPage:`Messages per page`,preferredView:`Preferred View`,preferredViewDesc:`How to display messages that have both HTML and Plain Text.`,showRemoteContent:`Show Remote Content`,composeFormat:`Compose Format`,html:`HTML`,plainText:`Plain Text`,alwaysAsk:`Always ask`,alwaysLoad:`Always load`,richText:`Rich Text (HTML)`,markReadTimeout:`Mark as Read`,markReadImmediately:`Immediately`,markRead1s:`After 1 second`,markRead3s:`After 3 seconds`,markRead5s:`After 5 seconds`,markRead10s:`After 10 seconds`,markReadNever:`Never mark automatically`,messageSortCriteria:`Message Sort Criteria`,messageSortCriteriaDesc:`Choose whether to sort by the original received date or by folder filing date.`,sortUid:`Folder Filing Date`,sortDate:`Received Date`,enableThreading:`Use threading`,themeIframeContent:`Apply theme to HTML messages content`,threadingNotSupported:`Not supported by your mail server`},appearance:{colorTheme:`Color Theme`,colorThemeDesc:`Select your preferred color palette.`,themeMode:`Theme Mode`,themeModeDesc:`Choose light, dark, or system auto.`,layoutMode:`Layout Mode`,layoutModeDesc:`Choose how you want your mailbox to be laid out.`,listDensity:`List Density`,listDensityDesc:`Adjust the spacing and compactness of the message list.`,light:`Light`,dark:`Dark`,systemAuto:`System Auto`,vertical:`Vertical (3 Panes)`,horizontal:`Horizontal (Top/Bottom)`,fullScreen:`Full Screen (Hide list when reading)`,loose:`Loose`,normal:`Normal`,compact:`Compact`,ultraCompact:`Ultra Compact`,showSenderAvatars:`Show sender avatars`,showSenderAvatarsDesc:`Pictures and initials beside senders in the message list and reader. Whether a sender is verified is shown either way.`},localization:{language:`Language`,timeFormat:`Time Format`,dateFormat:`Date Format`,format12h:`12-hour (AM/PM)`,format24h:`24-hour`,english:`English`,german:`Deutsch`,italian:`Italiano`,spanish:`Español`,serbian:`Српски`,serbianLatin:`Srpski (Latinica)`,french:`Français`,portuguese:`Português`,danish:`Dansk`}},linkedAccounts:{description:`Connect another account to quickly switch between them without logging out.`,noAccounts:`No linked accounts.`,remove:`Remove`,addTitle:`Link Account`,linkAccount:`Link Account`,addedSuccess:`Account linked successfully.`,addError:`Failed to add account. Please check the credentials.`,removeConfirm:`Are you sure you want to remove this linked account?`,removedSuccess:`Account removed.`,removeError:`Failed to remove account.`,switchError:`Failed to switch account. The password might have changed.`},webauthn:{title:`Security Key Verification`,instruction:`Please use your security key to complete login.`,not_supported:`WebAuthn is not supported in your browser.`,requesting:`Requesting authentication...`,waiting_for_key:`Waiting for security key...`,verifying:`Verifying...`,success:`Verification successful, redirecting...`,verify_btn:`Verify Identity`,verifying_btn:`Verifying...`,back_to_login:`Back to Login`,key_name_placeholder:`Device name (e.g. YubiKey)`,name_key_title:`Name Security Key`,name_key_label:`Device Name`,add_key:`Add Security Key`,trust_linked:`Trust Linked Accounts`,trust_linked_desc:`If enabled, you can switch to this account from a linked account without providing a 2FA credential again.`,trust_linked_checkbox:`Allow switching to this account without 2FA`,confirm_remove:`Are you sure you want to remove this security key?`,errors:{begin_failed:`Failed to initiate authentication.`,invalid_options:`Invalid authentication options received.`,verification_failed:`Verification failed. Please try again.`,register_failed:`There was an error registering your security key. Please try again.`,remove_failed:`Failed to remove the security key.`,general:`An error occurred.`},settings:{group_desc:`Secure your account with a hardware security key or biometrics.`,keys_title:`Security Keys`,noKeys:`No registered keys.`,added:`Added`,remove_btn:`Remove`,unnamed_key:`Security Key`}},print:{loading:`Loading print view...`},login:{subtitle:`Sign in to your webmail.`,emailPlaceholder:`Email Address`,passwordPlaceholder:`Password`,keepMeSignedIn:`Keep me signed in`,signIn:`Sign In`,tooManyAttempts:`Too many login attempts`,loginFailed:`Login failed. Please check your credentials.`,networkError:`Network error occurred. Please try again.`,pleaseWait:`Please wait`,wait:`Wait`,signedOut:`You have been signed out.`,signedOutDraftsLost:`You have been signed out. Some unsent drafts could not be saved and were lost.`,sessionExpired:`Your session has expired. Please sign in again.`,inactivitySignedOut:`You've been signed out due to inactivity.`,inactivitySignedOutDraftsLost:`You've been signed out due to inactivity. Some unsent drafts could not be saved and were lost.`},folderList:{compose:`Compose`,inbox:`Inbox`,drafts:`Drafts`,sent:`Sent`,archive:`Archive`,spam:`Spam`,junk:`Junk`,trash:`Trash`,title:`Folders`,rename:`Rename`,delete:`Delete`,createFolder:`Create Folder`,renameFolder:`Rename Folder`,folderName:`Folder name`,deleteFolder:`Delete Folder`,deleteFolderConfirm:`Are you sure you want to delete "{folder}"? All messages inside will be permanently deleted.`,expandSidebar:`Expand sidebar`,collapseSidebar:`Collapse sidebar`,moveToTrash:`Move to Trash`,moveToTrashConfirm:`Are you sure you want to move "{folder}" to the Trash?`,createSubfolder:`Create subfolder`,createSubfolderUnder:`Create Subfolder under "{folder}"`,subscribe:`Subscribe`,unsubscribe:`Unsubscribe`,order:`Order`,moveToTop:`Move to Top`,moveUp:`Move Up`,moveDown:`Move Down`,moveToBottom:`Move to Bottom`},search:{placeholder:`Search mail`},messageList:{menu:`Menu`,selectAll:`Select all messages`,allOnPageSelected:`All {count} messages on this page are selected`,selectAllMatching:`Select all {count} in {folder}`,allMatchingSelected:`All {count} messages in {folder} are selected`,clearSelection:`Clear selection`,checkNew:`Check for new messages`,sortDesc:`Sort descending by date`,sortAsc:`Sort ascending by date`,filterStarred:`Filter by starred`,filterUnread:`Filter by unread`,noMessages:`No messages`,loadError:`Could not load this folder.`,loadErrorRetry:`Try again`,loading:`Loading...`,unknownSender:`Unknown Sender`,unknown:`Unknown`,noSubject:`(No Subject)`,hasAttachments:`Has attachments`,replied:`Replied`,forwarded:`Forwarded`,searchResultsFor:`Search results for:`,clearSearch:`Clear search`,searchAllMailboxes:`Search All`,totalMessagesIn:`{count} total messages in {folder}`,totalConversationsIn:{one:`{count} conversation in {folder}`,other:`{count} total conversations in {folder}`},deleteAllNow:`Delete All Now`,emptyMailboxTitle:`Empty {folder}`,emptyMailboxConfirm:`Are you sure you want to permanently delete all {count} messages in {folder}? This action cannot be undone.`,emptyMailboxConfirmConversations:{one:`Are you sure you want to permanently delete the one conversation in {folder}, and every message in it? This action cannot be undone.`,other:`Are you sure you want to permanently delete all {count} conversations in {folder}, and every message in them? This action cannot be undone.`},emptyMailboxSelectionNote:{one:`This includes the message you have checked.`,other:`This includes the {count} messages you have checked.`},emptyingMailbox:`Emptying mailbox...`,mailboxEmptied:`Mailbox emptied successfully.`,emptyMailboxFailed:`Failed to empty mailbox. Make sure it is Trash or Junk.`,mailboxAlreadyEmpty:`{folder} was already empty — nothing was deleted.`,emptyMailboxSlow:`Still emptying {folder}. The server is working on it — check the folder again in a moment.`},composer:{discardFailed:`The draft could not be deleted from the server and is still in Drafts.`,attachmentsTooLarge:`Attachments exceed the maximum allowed size.`,draftSaveFailedKeepOpen:`Could not save this draft — the window stays open so nothing is lost`,attachmentsWait:`Please wait for attachments to finish uploading before sending.`,sending:`Message is being sent...`,undo:`Undo`,sendError:`Failed to send message: {error}`,presendFailed:`A security plugin could not process this message, so it was not sent.`},messageComposer:{fontSize:`Font Size`,small:`Small`,normal:`Normal`,large:`Large`,huge:`Huge`,bold:`Bold`,italic:`Italic`,underline:`Underline`,textColor:`Text Color`,align:`Align`,left:`Left`,center:`Center`,right:`Right`,numberedList:`Numbered List`,bulletedList:`Bulleted List`,indentMore:`Indent More`,indentLess:`Indent Less`,moreFormatting:`More Formatting`,undo:`Undo`,redo:`Redo`,quote:`Quote`,strikethrough:`Strikethrough`,clearFormatting:`Clear Formatting`,goToLink:`Go to link:`,change:`Change`,remove:`Remove`,text:`Text`,link:`Link`,apply:`Apply`,writeMessage:`Write your message...`},floatingComposer:{discardDraftTitle:`Discard Draft?`,discardDraftMessage:`Are you sure you want to discard this draft? This action cannot be undone.`,discard:`Discard`,dropFiles:`Drop files here to attach`,newMessage:`New Message`,saving:`Saving...`,autosaved:`Autosaved`,restore:`Restore`,minimize:`Minimize`,expand:`Expand`,saveAndClose:`Save & close`,to:`To`,cc:`Cc`,bcc:`Bcc`,subject:`Subject`,toggleFormatting:`Toggle Formatting Options`,attachFiles:`Attach Files`,insertLink:`Insert Link`,insertEmoji:`Insert Emoji`,send:`Send`,linkUrl:`Link URL`,linkUrlPlaceholder:`https://example.com`,displayText:`Display Text`,displayTextPlaceholder:`My Website`,apply:`Apply`,uploadFailed:`Failed to upload attachment: {error}`,unknownError:`Unknown error`},messageReader:{moreOptions:`More options`,tags:`Tags`,removeAllTags:`Remove all tags`,removeTag:`Remove tag`,selectMessage:`Select a message to read`,messagesSelected:`messages selected`,back:`Back`,reply:`Reply`,replyAll:`Reply All`,forward:`Forward`,to:`To:`,cc:`Cc:`,date:`Date:`,undisclosed:`Undisclosed`,loadingMessage:`Loading message...`,remoteContentWarning:`This message contains remote content. For your privacy, it has been blocked.`,loadRemoteContent:`Load remote content`,isDraft:`This is a draft message.`,editDraft:`Edit Draft`,noRecipients:`(No Recipients)`,discardDraft:`Discard Draft`,noReadableText:`This message contains no readable text, only attachments.`,attachments:`Attachments`,downloadAllAttachments:`Download all attachments`,unknownAttachment:`Unknown attachment`,archive:`Archive`,reportSpam:`Report Spam`,notSpam:`Not Spam`,delete:`Delete`,deleteThread:`Delete conversation`,deleteConfirmSingle:`Are you sure you want to permanently delete this message? This action cannot be undone.`,deleteConfirmMultiple:`Are you sure you want to permanently delete these messages? This action cannot be undone.`,markUnread:`Mark as unread`,markRead:`Mark as read`,star:`Star`,moveTo:`Copy/Move to...`,print:`Print`,showPlaintext:`Show plaintext`,showHtml:`Show HTML`,downloadMessage:`Download message`,showOriginal:`Show original`,verifiedSender:`Verified Sender`,unverifiedSender:`Unverified Sender`,senderUnverifiedWarning:`Your mail server could not verify this sender. The message may not be from who it claims to be, so be careful with its links and attachments.`,clickToExpand:`Click to expand message content`},originalMessage:{title:`Original Message`,loading:`Loading original message...`,errorMissingParams:`Missing mailbox or uid parameters`,errorFailedToFetch:`Failed to fetch original message`,messageId:`Message ID`,createdAt:`Created at`,from:`From`,to:`To`,subject:`Subject`,spf:`SPF`,dkim:`DKIM`,dmarc:`DMARC`,truncatedInfo:`Message is too large to display fully. Showing the first 64KB. Please use "Download Original" to view the entire message.`,downloadOriginal:`Download Original`,copyClipboard:`Copy to clipboard`,copiedTruncated:`Copied truncated content to clipboard.`,copied:`Copied to clipboard.`,copyFailed:`Failed to copy to clipboard.`,none:`NONE`,pass:`PASS`,fail:`FAIL`},folderSelector:{filter:`Filter folders...`,noResults:`No matching folders`,actionMove:`Move to`,actionCopy:`Copy to`},attachment:{remove:`Remove`,preview:`Preview`,download:`Download`,zoomIn:`Zoom in`,zoomOut:`Zoom out`,rotate:`Rotate`,fitToScreen:`Fit to screen`,previous:`Previous`,next:`Next`,copyContent:`Copy content`,copied:`Copied!`,openInNewTab:`Open in new tab`,cannotPreview:`No preview available for this file type`,loadingPreview:`Loading preview...`,errorLoading:`Failed to load preview`,close:`Close`},navigation:{messages:`Messages`,contacts:`Contacts`,calendar:`Calendar`,tasks:`Tasks`},userMenu:{settings:`Settings`,signOut:`Sign Out`,profileOptions:`Profile options`},pagination:{previousPage:`Previous page`,nextPage:`Next page`,zeroMessages:`0 messages`,totalCount:`{total} total`,searchResults:`{total} results`,rangeOfTotal:`{start}–{end} of {total}`},toast:{messagePermanentlyDeleted:`Message permanently deleted`,draftDiscarded:`Draft discarded`,folderRenamed:`Folder renamed`,tagNotSupported:`That tag is not supported by this mail server`,flagChangeFailed:`Could not update the messages`,folderCreated:`Folder created`,folderExists:`A folder with that name already exists`,folderCreateFailed:`Could not create the folder`,folderRenameFailed:`Could not rename the folder`,folderDeleteFailed:`Could not delete the folder`,folderUndoFailed:`Could not undo that`,folderMovedToTrash:`Folder moved to Trash`,folderPermanentlyDeleted:`Folder permanently deleted`,undo:`Undo`,dismiss:`Dismiss`,messageMovedToArchive:`Message moved to Archive`,messagesMovedToArchive:{one:`{count} message moved to Archive`,other:`{count} messages moved to Archive`},messageMovedToSpam:`Message moved to Spam`,messagesMovedToSpam:{one:`{count} message moved to Spam`,other:`{count} messages moved to Spam`},messageMovedToInbox:`Message moved to Inbox`,messagesMovedToInbox:{one:`{count} message moved to Inbox`,other:`{count} messages moved to Inbox`},messageMovedToTrash:`Message moved to Trash`,messagesMovedToTrash:{one:`{count} message moved to Trash`,other:`{count} messages moved to Trash`},messageMovedToFolder:`Message moved to {folder}`,messagesMovedToFolder:{one:`{count} message moved to {folder}`,other:`{count} messages moved to {folder}`},messageCopiedToFolder:`Message copied to {folder}`,messagesCopiedToFolder:{one:`{count} message copied to {folder}`,other:`{count} messages copied to {folder}`},draftsDiscarded:{one:`{count} draft discarded`,other:`{count} drafts discarded`},messagesPermanentlyDeleted:{one:`{count} message permanently deleted`,other:`{count} messages permanently deleted`},undoFailed:`Could not undo that`,messageDeleteFailed:`The message could not be deleted`,moveFailed:`Could not move that`,copyFailed:`Could not copy that`,subscribeFailed:`Could not subscribe`,unsubscribeFailed:`Could not unsubscribe`},mailboxPage:{mailboxNotFound:`Mailbox not found`,newMessages:`New Messages`,newMessagesSingleBody:`You have 1 new message`,newMessagesMultiBody:{one:`You have {count} new message`,other:`You have {count} new messages`},newMessagesInInbox:`New messages in Inbox`,newMessagesAvailable:`New messages available`,open:`Open`,refresh:`Refresh`,permanentlyDelete:`Permanently Delete?`,deletePermanently:`Delete Permanently`,undo:`Undo`},offline:{title:`Connection Lost`,description:`Network connectivity lost`,tryingAgain:`Trying again in {seconds} seconds...`},update:{available:`A new version is available.`,reload:`Reload`},general:{error:`Error`,cancel:`Cancel`,save:`Save`,optional:`Optional`,delete:`Delete`,clear:`Clear`,showPassword:`Show password`,hidePassword:`Hide password`,previous:`Previous`,next:`Next`,expand:`Expand`,collapse:`Collapse`,notFound:`Page not found`}},b={debug:(...e)=>{},info:(...e)=>{console.info(`[INFO]`,...e)},warn:(...e)=>{console.warn(`[WARN]`,...e)},error:(...e)=>{console.error(`[ERROR]`,...e)}},me=`modulepreload`,he=function(e){return`/`+e},ge={},x=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=he(t,n),t in ge)return;ge[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:me,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})};function _e(e,t){if(typeof e!=`object`||!e)return t;if(typeof t!=`object`||!t)return e;let n={...e};return Object.keys(t).forEach(r=>{typeof t[r]==`object`&&t[r]!==null&&!Array.isArray(t[r])&&r in e?n[r]=_e(e[r],t[r]):n[r]=t[r]}),n}var ve=Object.assign({"../../../plugins/caldav/frontend/i18n/en.ts":y,"../../../plugins/carddav/frontend/i18n/en.ts":ae,"../../../plugins/gpg/frontend/i18n/en.ts":se,"../../../plugins/managesieve/frontend/i18n/en.ts":le,"../../../plugins/password/frontend/i18n/en.ts":de}),ye={...pe};for(let e in ve){let t=ve[e],n=t.default||t.en||{};ye=_e(ye,n)}var be=ye,xe=class extends EventTarget{constructor(){super(),this.language=`en`,this.dictionary=be,this.pluralRules=null,this.pluralRulesFor=``,this.applyDocumentLanguage()}applyDocumentLanguage(){document.documentElement.lang=this.getIntlLanguage()}async setLanguage(e){if(this.language===e)return;this.language=e;let t=be;try{if(e!==`en`){let n={},r=Object.assign({"../i18n/da.ts":()=>x(()=>import(`./da-B-gzpbI1.js`),[]),"../i18n/de.ts":()=>x(()=>import(`./de-DCtV0IFl.js`),[]),"../i18n/es.ts":()=>x(()=>import(`./es-BUqVd7Zg.js`),[]),"../i18n/fr.ts":()=>x(()=>import(`./fr-BXlTcFll.js`),[]),"../i18n/it.ts":()=>x(()=>import(`./it-BRgyUlyM.js`),[]),"../i18n/pt.ts":()=>x(()=>import(`./pt-BGElZRh4.js`),[]),"../i18n/rs.ts":()=>x(()=>import(`./rs-B8fg9_CH.js`),[]),"../i18n/sr.ts":()=>x(()=>import(`./sr-CUKmWVoD.js`),[])})[`../i18n/${e}.ts`];if(r){let t=await r();n=t.default||t[e]}else throw Error(`Locale file not found for ${e}`);let i=Object.assign({"../../../plugins/caldav/frontend/i18n/da.ts":()=>x(()=>import(`./da-C5ySnHZ3.js`),[]),"../../../plugins/caldav/frontend/i18n/de.ts":()=>x(()=>import(`./de-cCDubTA7.js`),[]),"../../../plugins/caldav/frontend/i18n/es.ts":()=>x(()=>import(`./es-DogFDaYH.js`),[]),"../../../plugins/caldav/frontend/i18n/fr.ts":()=>x(()=>import(`./fr-BuvnzFXs.js`),[]),"../../../plugins/caldav/frontend/i18n/it.ts":()=>x(()=>import(`./it-DAIpRUrj.js`),[]),"../../../plugins/caldav/frontend/i18n/pt.ts":()=>x(()=>import(`./pt-DfWxf1xW.js`),[]),"../../../plugins/caldav/frontend/i18n/rs.ts":()=>x(()=>import(`./rs-CSFGLhV6.js`),[]),"../../../plugins/caldav/frontend/i18n/sr.ts":()=>x(()=>import(`./sr-D_xQMzLr.js`),[]),"../../../plugins/carddav/frontend/i18n/da.ts":()=>x(()=>import(`./da-Bd7NjcID.js`),[]),"../../../plugins/carddav/frontend/i18n/de.ts":()=>x(()=>import(`./de-BJSRojag.js`),[]),"../../../plugins/carddav/frontend/i18n/es.ts":()=>x(()=>import(`./es-5dzu12fR.js`),[]),"../../../plugins/carddav/frontend/i18n/fr.ts":()=>x(()=>import(`./fr-D8l9jSci.js`),[]),"../../../plugins/carddav/frontend/i18n/it.ts":()=>x(()=>import(`./it-BBqp3hb3.js`),[]),"../../../plugins/carddav/frontend/i18n/pt.ts":()=>x(()=>import(`./pt-D_IIYiV0.js`),[]),"../../../plugins/carddav/frontend/i18n/rs.ts":()=>x(()=>import(`./rs-Bn5zY5QB.js`),[]),"../../../plugins/carddav/frontend/i18n/sr.ts":()=>x(()=>import(`./sr-CQ9OkYeq.js`),[]),"../../../plugins/gpg/frontend/i18n/da.ts":()=>x(()=>import(`./da-DWbLl9jq.js`),[]),"../../../plugins/gpg/frontend/i18n/de.ts":()=>x(()=>import(`./de-BgvkfXqC.js`),[]),"../../../plugins/gpg/frontend/i18n/es.ts":()=>x(()=>import(`./es-BpKq3SI4.js`),[]),"../../../plugins/gpg/frontend/i18n/fr.ts":()=>x(()=>import(`./fr-BcVbmpr9.js`),[]),"../../../plugins/gpg/frontend/i18n/it.ts":()=>x(()=>import(`./it-JdfuyW_8.js`),[]),"../../../plugins/gpg/frontend/i18n/pt.ts":()=>x(()=>import(`./pt-webNkbeV.js`),[]),"../../../plugins/gpg/frontend/i18n/rs.ts":()=>x(()=>import(`./rs-D2l7K_4p.js`),[]),"../../../plugins/gpg/frontend/i18n/sr.ts":()=>x(()=>import(`./sr-WCrhrfC5.js`),[]),"../../../plugins/managesieve/frontend/i18n/da.ts":()=>x(()=>import(`./da-DDA7aPUK.js`),[]),"../../../plugins/managesieve/frontend/i18n/de.ts":()=>x(()=>import(`./de-Duck8ODe.js`),[]),"../../../plugins/managesieve/frontend/i18n/es.ts":()=>x(()=>import(`./es-BpaDTH0l.js`),[]),"../../../plugins/managesieve/frontend/i18n/fr.ts":()=>x(()=>import(`./fr-3O1icH2_.js`),[]),"../../../plugins/managesieve/frontend/i18n/it.ts":()=>x(()=>import(`./it-CMZspQ5V.js`),[]),"../../../plugins/managesieve/frontend/i18n/pt.ts":()=>x(()=>import(`./pt-DsShpb6v.js`),[]),"../../../plugins/managesieve/frontend/i18n/rs.ts":()=>x(()=>import(`./rs-BRssKrsL.js`),[]),"../../../plugins/managesieve/frontend/i18n/sr.ts":()=>x(()=>import(`./sr-CFQNPOLY.js`),[]),"../../../plugins/password/frontend/i18n/da.ts":()=>x(()=>import(`./da-C5Vf2w1h.js`),[]),"../../../plugins/password/frontend/i18n/de.ts":()=>x(()=>import(`./de-CKfYbCPk.js`),[]),"../../../plugins/password/frontend/i18n/es.ts":()=>x(()=>import(`./es-BBt27l7y.js`),[]),"../../../plugins/password/frontend/i18n/fr.ts":()=>x(()=>import(`./fr-4b9nT1Le.js`),[]),"../../../plugins/password/frontend/i18n/it.ts":()=>x(()=>import(`./it-DDtO0vgR.js`),[]),"../../../plugins/password/frontend/i18n/pt.ts":()=>x(()=>import(`./pt-BEPCs61G.js`),[]),"../../../plugins/password/frontend/i18n/rs.ts":()=>x(()=>import(`./rs-DefwpdBY.js`),[]),"../../../plugins/password/frontend/i18n/sr.ts":()=>x(()=>import(`./sr-VYO2n6sq.js`),[])}),a=[];for(let t in i)t.endsWith(`/${e}.ts`)&&a.push(i[t]());let o=await Promise.allSettled(a);for(let t of o){if(t.status===`rejected`){b.error(`Failed to load a plugin dictionary`,t.reason);continue}let r=t.value,i=r.default||r[e]||{};n=_e(n,i)}t=n}}catch(n){b.error(`Failed to load language module for ${e}`,n),t=be}this.language===e&&(this.dictionary=t,this.applyDocumentLanguage(),this.dispatchEvent(new CustomEvent(`change`)))}getLanguage(){return this.language}getIntlLanguage(){return this.language===`rs`?`sr-Cyrl`:this.language===`sr`?`sr-Latn`:this.language}pluralForm(e){let t=this.getIntlLanguage();return(this.pluralRulesFor!==t||!this.pluralRules)&&(this.pluralRules=new Intl.PluralRules(t),this.pluralRulesFor=t),this.pluralRules.select(e)}pickPluralForm(e,t){if(!e||typeof e!=`object`)return e;let n=e[typeof t?.count==`number`?this.pluralForm(t.count):`other`]??e.other;return typeof n==`string`?n:e}t(e,t){let n=e.split(`.`),r=this.dictionary;for(let e of n){if(r==null)break;r=r[e]}if(r=this.pickPluralForm(r,t),typeof r!=`string`){let i=be;for(let e of n){if(i==null)break;i=i[e]}i=this.pickPluralForm(i,t),r=typeof i==`string`?i:e}return typeof r==`string`&&t?r.replace(/\{(\w+)\}/g,(e,n)=>t[n]===void 0?e:String(t[n])):r}},S=u(`i18n-store`),Se={"default-light":{id:`default-light`,name:`Default Light`,isDark:!1,colors:{"bg-primary":`#ffffff`,"bg-secondary":`#f9fafb`,"bg-tertiary":`#f3f4f6`,"bg-selected":`#eff6ff`,"bg-starred":`#2563eb0f`,"text-primary":`#111827`,"text-sender-read":`#202020`,"text-secondary":`#4b5563`,"text-muted":`#9ca3af`,"border-color":`#e5e7eb`,"accent-color":`#2563eb`,"accent-hover":`#1d4ed8`,"accent-light":`#dbeafe`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`#f3f4f6`}},"default-dark":{id:`default-dark`,name:`Default Dark`,isDark:!0,colors:{"bg-primary":`#1f2937`,"bg-secondary":`#111827`,"bg-tertiary":`#374151`,"bg-selected":`#1e3a8a`,"bg-starred":`#3b82f615`,"text-primary":`#f9fafb`,"text-sender-read":`#e5e7eb`,"text-secondary":`#d1d5db`,"text-muted":`#9ca3af`,"border-color":`#374151`,"accent-color":`#3b82f6`,"accent-hover":`#60a5fa`,"accent-light":`#1e3a8a`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(255, 255, 255, 0.1)`}},"nord-light":{id:`nord-light`,name:`Nord Light`,isDark:!1,colors:{"bg-primary":`#eceff4`,"bg-secondary":`#e5e9f0`,"bg-tertiary":`#d8dee9`,"bg-selected":`#81a1c133`,"bg-starred":`#5e81ac15`,"text-primary":`#2e3440`,"text-sender-read":`#3b4252`,"text-secondary":`#3b4252`,"text-muted":`#4c566a`,"border-color":`#d8dee9`,"accent-color":`#5e81ac`,"accent-hover":`#81a1c1`,"accent-light":`#81a1c133`,success:`#a3be8c`,warning:`#ebcb8b`,error:`#bf616a`,"hover-color":`rgba(0, 0, 0, 0.05)`}},"nord-dark":{id:`nord-dark`,name:`Nord Dark`,isDark:!0,colors:{"bg-primary":`#2e3440`,"bg-secondary":`#3b4252`,"bg-tertiary":`#434c5e`,"bg-selected":`#81a1c133`,"bg-starred":`#88c0d015`,"text-primary":`#eceff4`,"text-sender-read":`#e5e9f0`,"text-secondary":`#e5e9f0`,"text-muted":`#d8dee9`,"border-color":`#434c5e`,"accent-color":`#88c0d0`,"accent-hover":`#81a1c1`,"accent-light":`#81a1c133`,success:`#a3be8c`,warning:`#ebcb8b`,error:`#bf616a`,"hover-color":`rgba(255, 255, 255, 0.1)`}},"ocean-light":{id:`ocean-light`,name:`Ocean Light`,isDark:!1,colors:{"bg-primary":`#f8fafc`,"bg-secondary":`#f1f5f9`,"bg-tertiary":`#e2e8f0`,"bg-selected":`#e0f2fe`,"bg-starred":`#0ea5e915`,"text-primary":`#0f172a`,"text-sender-read":`#1e293b`,"text-secondary":`#334155`,"text-muted":`#64748b`,"border-color":`#cbd5e1`,"accent-color":`#0ea5e9`,"accent-hover":`#0284c7`,"accent-light":`#e0f2fe`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(0, 0, 0, 0.05)`}},"ocean-dark":{id:`ocean-dark`,name:`Ocean Dark`,isDark:!0,colors:{"bg-primary":`#0f172a`,"bg-secondary":`#1e293b`,"bg-tertiary":`#334155`,"bg-selected":`#0c4a6e`,"bg-starred":`#38bdf815`,"text-primary":`#f8fafc`,"text-sender-read":`#e2e8f0`,"text-secondary":`#cbd5e1`,"text-muted":`#94a3b8`,"border-color":`#334155`,"accent-color":`#38bdf8`,"accent-hover":`#0ea5e9`,"accent-light":`#0c4a6e`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(255, 255, 255, 0.1)`}}},Ce=`alps_active_user`,we={themeMode:`auto`,colorFamily:`default`,layoutMode:`vertical`,densityMode:`compact`,sidebarCollapsed:!1,enableThreading:!0,themeIframeContent:!1,showSenderAvatars:!0,checkMailInterval:5,autoLogout:30,desktopNotifications:!1,soundNotifications:!0,name:``,signature:``,replyTo:``,bccMyself:!1,messagesPerPage:50,preferredView:`html`,markReadTimeout:0,showRemoteContent:`ask`,composeFormat:`html`,undoTimeout:0,language:`en`,hourFormat:`24`,dateFormat:`YYYY-MM-DD`,sortOrder:`desc`,messageSortCriteria:`date`,maxAttachmentMiB:32,customMailboxOrder:[]},Te={themeMode:{ui:!0,name:`themeMode`,value:e=>e.themeMode},colorFamily:{ui:!0,name:`colorFamily`,value:e=>e.colorFamily},layoutMode:{ui:!0,name:`layoutMode`,value:e=>e.layoutMode},densityMode:{ui:!0,name:`densityMode`,value:e=>e.densityMode},enableThreading:{ui:!0,name:`enableThreading`,value:e=>e.enableThreading},themeIframeContent:{ui:!0,name:`themeIframeContent`,value:e=>e.themeIframeContent},showSenderAvatars:{ui:!0,name:`showSenderAvatars`,value:e=>e.showSenderAvatars},customMailboxOrder:{ui:!0,name:`customMailboxOrder`,value:e=>e.customMailboxOrder},checkMailInterval:{name:`check_mail_interval`,value:e=>Number(e.checkMailInterval)||0},autoLogout:{name:`auto_logout`,value:e=>Number(e.autoLogout)||0},desktopNotifications:{name:`desktop_notifications`,value:e=>!!e.desktopNotifications},soundNotifications:{name:`sound_notifications`,value:e=>!!e.soundNotifications},name:{name:`from`,value:e=>e.name},signature:{name:`signature`,value:e=>e.signature},replyTo:{name:`reply_to`,value:e=>e.replyTo},bccMyself:{name:`bcc_myself`,value:e=>!!e.bccMyself},messagesPerPage:{name:`messages_per_page`,value:e=>Number(e.messagesPerPage)||50},preferredView:{name:`preferred_view`,value:e=>e.preferredView},markReadTimeout:{name:`mark_read_timeout`,value:e=>Number(e.markReadTimeout)||0},showRemoteContent:{name:`show_remote_content`,value:e=>e.showRemoteContent},composeFormat:{name:`compose_format`,value:e=>e.composeFormat},undoTimeout:{name:`undo_timeout`,value:e=>Number(e.undoTimeout)||0},language:{name:`language`,value:e=>e.language},hourFormat:{name:`hour_format`,value:e=>e.hourFormat},dateFormat:{name:`date_format`,value:e=>e.dateFormat},sortOrder:{name:`sort_order`,value:e=>e.sortOrder},messageSortCriteria:{name:`message_sort_criteria`,value:e=>e.messageSortCriteria}},Ee=e=>e in Te;function De(e,t){let n={};for(let r of t){let t=Te[r];if(t.ui){let r=n.ui??={};r[t.name]=t.value(e)}else n[t.name]=t.value(e)}return n}var Oe=class extends EventTarget{constructor(){super(),this.initialFetchCompleted=!1,this.settingsReadFailed=!1,this.rereadInFlight=!1,this.unsaved=new Set,this.saveInFlight=!1,this.savePending=!1,this.i18n=null,this.state=this.loadSettings(),this.applyTheme(),window.matchMedia(`(prefers-color-scheme: dark)`).addEventListener(`change`,()=>{this.state.themeMode===`auto`&&this.applyTheme()}),window.addEventListener(`session-cleared`,()=>{this.initialFetchCompleted=!1,this.settingsReadFailed=!1,this.unsaved.clear(),this.state=this.loadSettings(),this.applyTheme(),this.notify()}),window.addEventListener(`user-logged-in`,e=>{let t=e.detail?.username;this.initializeSession(t)}),this.initializeSession()}async initializeSession(e){if(this.initialFetchCompleted=!1,e){this.state.loginUsername=e;try{let t=localStorage.getItem(Ce);localStorage.setItem(Ce,e),t!==e&&window.dispatchEvent(new CustomEvent(`alps-active-user-changed`))}catch(e){b.error(`Failed to record the active user`,e)}let t=this.loadSettings(e);this.state={...t,...this.state,loginUsername:e},this.applyTheme(),this.notify()}let t=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`))||!!this.state.loginUsername||!!ke(),n=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));if(!t&&!n){await this._fetchBackendSettings();return}if(!e)try{let e=await fetch(`/session`);if(e.ok){let t=await e.json(),n=t.Username||t.username;if(n){this.state.loginUsername=n;try{let e=localStorage.getItem(Ce);localStorage.setItem(Ce,n),e!==n&&window.dispatchEvent(new CustomEvent(`alps-active-user-changed`))}catch(e){b.error(`Failed to record the active user`,e)}let e=this.loadSettings(n);this.state={...e,...this.state,loginUsername:n},this.applyTheme(),this.notify()}}}catch(e){b.error(`Failed to fetch session username during initialization`,e)}await this._fetchBackendSettings()}loadSettings(e){let t=e?`alps_settings_${e}`:null,n=t?localStorage.getItem(t):null,r={};if(n)try{r=JSON.parse(n)}catch(e){b.error(`Failed to parse user settings`,e)}let i=localStorage.getItem(`alps_settings`),a={};if(i)try{a=JSON.parse(i)}catch(e){b.error(`Failed to parse global settings`,e)}let o={...we,themeMode:r.themeMode??a.themeMode??we.themeMode,colorFamily:r.colorFamily??a.colorFamily??we.colorFamily,layoutMode:r.layoutMode??a.layoutMode??we.layoutMode,densityMode:r.densityMode??a.densityMode??we.densityMode,enableThreading:r.enableThreading??a.enableThreading??we.enableThreading,themeIframeContent:r.themeIframeContent??a.themeIframeContent??we.themeIframeContent,showSenderAvatars:r.showSenderAvatars??a.showSenderAvatars??we.showSenderAvatars,customMailboxOrder:r.customMailboxOrder??a.customMailboxOrder??we.customMailboxOrder,language:r.language??a.language??we.language,loginUsername:e};return n&&Object.assign(o,r),o}saveSettings(){let e=this.state.loginUsername||ke();if(e){this.state.loginUsername||(this.state.loginUsername=e),localStorage.setItem(`alps_settings_${e}`,JSON.stringify(this.state));try{let t=localStorage.getItem(Ce);localStorage.setItem(Ce,e),t!==e&&window.dispatchEvent(new CustomEvent(`alps-active-user-changed`))}catch(e){b.error(`Failed to record the active user`,e)}}let t={themeMode:this.state.themeMode,colorFamily:this.state.colorFamily,language:this.state.language,layoutMode:this.state.layoutMode,densityMode:this.state.densityMode,enableThreading:this.state.enableThreading,themeIframeContent:this.state.themeIframeContent,showSenderAvatars:this.state.showSenderAvatars};localStorage.setItem(`alps_settings`,JSON.stringify(t))}notify(){this.dispatchEvent(new CustomEvent(`change`))}getState(){return this.state}async updateSettings(e){let t=this.state.loginUsername,n=e.loginUsername,r=n!==void 0&&n!==t?t===void 0?{...this.loadSettings(n),...this.state}:this.loadSettings(n):this.state;this.state={...r,...e},this.saveSettings(),(e.themeMode!==void 0||e.colorFamily!==void 0)&&this.applyTheme(),this.notify();let i=Object.keys(e).filter(e=>Ee(e)&&JSON.stringify(r[e])!==JSON.stringify(this.state[e]));if(i.length>0){for(let e of i)this.unsaved.add(e);return this._saveBackendSettings()}}async _fetchBackendSettings(){let e=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`))||!!this.state.loginUsername||!!ke(),t=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));if(!e&&!t){window.location.hash.startsWith(`#/login`)||window.dispatchEvent(new CustomEvent(`auth-error`)),this.initialFetchCompleted=!0;return}let n=!1,r=!1;try{let e=await fetch(`/settings`);if(e.status===401){window.dispatchEvent(new CustomEvent(`auth-error`));return}if(e.ok){let t=await e.json();r=!0;let i={};if(t.MaxAttachmentMiB!==void 0&&(i.maxAttachmentMiB=t.MaxAttachmentMiB),t.HasThreadCapability!==void 0&&(i.hasThreadCapability=t.HasThreadCapability,t.HasThreadCapability===!1&&(i.enableThreading=!1)),t.HasESearchCapability!==void 0&&(i.hasESearchCapability=t.HasESearchCapability),t&&t.Settings){let e=t.Settings;if(e.ui){let t=e.ui;t.themeMode&&(t.themeMode!==`auto`||!this.state.themeMode||this.state.themeMode===`auto`)&&(i.themeMode=t.themeMode),t.colorFamily&&(t.colorFamily!==`default`||!this.state.colorFamily||this.state.colorFamily===`default`)&&(i.colorFamily=t.colorFamily),t.layoutMode&&(i.layoutMode=t.layoutMode),t.densityMode&&(i.densityMode=t.densityMode),t.sidebarCollapsed!==void 0&&(i.sidebarCollapsed=t.sidebarCollapsed),t.enableThreading!==void 0&&(i.enableThreading=t.enableThreading),t.themeIframeContent!==void 0&&(i.themeIframeContent=t.themeIframeContent),t.showSenderAvatars!==void 0&&(i.showSenderAvatars=t.showSenderAvatars),t.customMailboxOrder!==void 0&&(i.customMailboxOrder=t.customMailboxOrder)}e.check_mail_interval!==void 0&&e.check_mail_interval!==0&&(i.checkMailInterval=e.check_mail_interval),e.auto_logout!==void 0&&(i.autoLogout=e.auto_logout),e.desktop_notifications!==void 0&&(i.desktopNotifications=e.desktop_notifications),e.sound_notifications!==void 0&&(i.soundNotifications=e.sound_notifications),e.from!==void 0&&(i.name=e.from),e.signature!==void 0&&(i.signature=e.signature),e.reply_to!==void 0&&(i.replyTo=e.reply_to),e.bcc_myself!==void 0&&(i.bccMyself=e.bcc_myself),e.messages_per_page!==void 0&&e.messages_per_page!==0&&(i.messagesPerPage=e.messages_per_page),e.preferred_view!==void 0&&e.preferred_view!==``&&(i.preferredView=e.preferred_view),e.mark_read_timeout!==void 0&&(i.markReadTimeout=e.mark_read_timeout),e.show_remote_content!==void 0&&e.show_remote_content!==``&&(i.showRemoteContent=e.show_remote_content),e.compose_format!==void 0&&e.compose_format!==``&&(i.composeFormat=e.compose_format),e.undo_timeout!==void 0&&(i.undoTimeout=e.undo_timeout),e.language!==void 0&&e.language!==``&&(i.language=e.language),e.hour_format!==void 0&&e.hour_format!==``&&(i.hourFormat=e.hour_format),e.date_format!==void 0&&e.date_format!==``&&(i.dateFormat=e.date_format),e.sort_order!==void 0&&e.sort_order!==``&&(i.sortOrder=e.sort_order),e.message_sort_criteria!==void 0&&e.message_sort_criteria!==``&&(i.messageSortCriteria=e.message_sort_criteria),e.language||(n=!0);for(let e of this.unsaved)delete i[e];if(Object.keys(i).length>0){let e=this.state.loginUsername||ke();this.state={...this.state,...i},e&&!this.state.loginUsername&&(this.state.loginUsername=e),this.saveSettings(),this.applyTheme(),this.notify()}}}}catch(e){b.error(`Failed to fetch backend settings`,e)}finally{this.initialFetchCompleted=r,this.settingsReadFailed=!r}n&&this.unsaved.add(`language`),r&&this.unsaved.size>0&&await this._saveBackendSettings()}async _saveBackendSettings(){if(!this.initialFetchCompleted){if(this.settingsReadFailed&&!this.rereadInFlight){this.rereadInFlight=!0;try{await this._fetchBackendSettings()}finally{this.rereadInFlight=!1}this.initialFetchCompleted||this.reportSaveFailure()}return}if(this.saveInFlight){this.savePending=!0;return}let e=[...this.unsaved];if(e.length!==0){this.unsaved.clear(),this.saveInFlight=!0;try{if(!await this._putBackendSettings(De(this.state,e)))for(let t of e)this.unsaved.add(t)}finally{this.saveInFlight=!1,this.savePending&&(this.savePending=!1,this._saveBackendSettings())}}}async _putBackendSettings(e){try{let t=await fetch(`/settings`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});return t.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),!1):t.ok?!0:(b.error(`Failed to save backend settings`,t.status),this.reportSaveFailure(),!1)}catch(e){return b.error(`Failed to save backend settings`,e),this.reportSaveFailure(),!1}}reportSaveFailure(){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.translate(`settings.saveFailed`,`Could not save that setting — it may not survive signing out`),duration:6e3}}))}setI18n(e){this.i18n=e}translate(e,t){return this.i18n?.t(e)||t}applyTheme(){let e=!1;this.state.themeMode===`dark`?e=!0:this.state.themeMode===`auto`&&(e=window.matchMedia(`(prefers-color-scheme: dark)`).matches),e?document.body.classList.add(`theme-dark`):document.body.classList.remove(`theme-dark`);let t=Se[`${this.state.colorFamily}-${e?`dark`:`light`}`]||Se[`default-${e?`dark`:`light`}`];if(t)for(let[e,n]of Object.entries(t.colors))document.documentElement.style.setProperty(`--${e}`,n)}},C=u(`settings-store`);function ke(){try{return localStorage.getItem(Ce)}catch{return null}}function Ae(){let e=(()=>{try{let e=localStorage.getItem(`alps_settings`);return e?JSON.parse(e):{}}catch{return{}}})(),t=ke();if(!t)return e;try{let n=localStorage.getItem(`alps_settings_${t}`);return n?{...e,...JSON.parse(n)}:e}catch{return e}}function je(e=!0){let t=localStorage.getItem(`alps_settings`);if(t)try{let e=JSON.parse(t),n={};e.themeMode&&(n.themeMode=e.themeMode),e.colorFamily&&(n.colorFamily=e.colorFamily),e.language&&(n.language=e.language),e.layoutMode&&(n.layoutMode=e.layoutMode),e.densityMode&&(n.densityMode=e.densityMode),e.enableThreading!==void 0&&(n.enableThreading=e.enableThreading),e.themeIframeContent!==void 0&&(n.themeIframeContent=e.themeIframeContent),e.showSenderAvatars!==void 0&&(n.showSenderAvatars=e.showSenderAvatars),localStorage.setItem(`alps_settings`,JSON.stringify(n))}catch(e){b.error(`Failed to clear and preserve global settings`,e),localStorage.removeItem(`alps_settings`)}try{let e=localStorage.getItem(Ce);e&&localStorage.removeItem(`alps_settings_${e}`),localStorage.removeItem(Ce)}catch(e){b.error(`Failed to clear the per-user settings record`,e)}if(!e)return;let n=`; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`+(window.location.protocol===`https:`?`; Secure`:``);document.cookie=`alps_logged_in=`+n,document.cookie=`alps_has_login_token=`+n}var Me=1800*1e3,Ne=`X-Alps-Build`,Pe=`app-update-available`,Fe=`alps-update-chunk-reload`,Ie=60*1e3,Le=`alps-update-taken`,Re=600*1e3;function ze(e){try{let t=Number(sessionStorage.getItem(e)??0);return Number.isFinite(t)?t:0}catch{return 0}}function Be(e,t){try{sessionStorage.setItem(e,String(t))}catch{}}function Ve(e,t){let n=ze(e);return n>0&&Date.now()-n<t}function He(e){let t=(e.get(`Cache-Control`)??``).toLowerCase();if(t.includes(`no-store`)||t.includes(`no-cache`))return!1;if(t.includes(`immutable`))return!0;let n=/(?:^|[\s,])(?:s-maxage|max-age)\s*=\s*(\d+)/.exec(t);return n!==null&&Number(n[1])>0}var Ue=null,We=!1,Ge=!1,Ke=!1,qe=!1,Je=!1,Ye=null,Xe=null;function Ze(e){let t=e.headers.get(Ne);if(!(!t||He(e.headers))){if(Ue===null){Ue=t;return}if(t!==Ue&&!Ge&&(Ge=!0,We=!0,b.info(`A new build is served (${Ue} → ${t}).`)),!(!Ge||Ke)){if(Ve(Le,Re)){qe||(qe=!0,b.warn(`Not offering it yet: this tab already reloaded for an update.`));return}if(Ke=!0,document.hidden){Je=!0;return}window.dispatchEvent(new CustomEvent(Pe))}}}function Qe(){document.addEventListener(`visibilitychange`,nt),window.addEventListener(`vite:preloadError`,rt),document.hidden&&nt()}var $e=null;function et(e){$e=e}function tt(){return $e!==null&&$e()}function nt(){if(document.hidden){Ye=Date.now(),Xe&&clearTimeout(Xe),Xe=setTimeout(()=>{We&&!tt()&&at()},Me);return}Xe&&clearTimeout(Xe),Xe=null;let e=Ye===null?0:Date.now()-Ye;if(Ye=null,We&&e>=Me&&!tt()){at();return}Je&&(Je=!1,window.dispatchEvent(new CustomEvent(Pe)))}function rt(e){e.preventDefault(),b.warn(`A lazily loaded chunk is missing; the server was likely upgraded.`),We=!0,!(tt()||Ve(Fe,Ie))&&(Be(Fe,Date.now()),at())}function it(){Be(Le,Date.now()),at()}function at(){window.location.reload()}function ot(e){return encodeURIComponent(encodeURIComponent(e))}var w=class extends Error{constructor(e,t){super(t),this.name=`HttpStatusError`,this.status=e}};function st(e){return e instanceof w&&e.status===412}function ct(e){return e instanceof w&&e.status===401}var lt=new Set([502,503,504]),ut=[250,1e3],dt=e=>new Promise(t=>setTimeout(t,e));async function T(e,t={},n=25e3){let r=(t.method??(e instanceof Request?e.method:`GET`)).toUpperCase()===`GET`?ut.length+1:1,i,a;for(let o=0;o<r;o++){let s=o===r-1,c=new AbortController;a=c;let l=setTimeout(()=>c.abort(),n);try{i=await fetch(e,{...t,signal:c.signal})}catch(e){if(e instanceof TypeError&&!s){await dt(ut[o]);continue}throw(e instanceof TypeError||e.name===`AbortError`)&&window.dispatchEvent(new CustomEvent(`network-error`)),e}finally{clearTimeout(l)}if(lt.has(i.status)&&!s){c.abort(),await dt(ut[o]);continue}break}let o=a;return setTimeout(()=>o.abort(),n),lt.has(i.status)&&window.dispatchEvent(new CustomEvent(`network-error`)),i.status===401&&window.dispatchEvent(new CustomEvent(`auth-error`)),Ze(i),i}function ft(e){return e.status===`completed`||e.status===`cancelled`}function pt(e){if(!e.due)return null;let t=new Date(e.due);return Number.isNaN(t.getTime())?null:e.allDay?new Date(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate()):t}var mt=[`overdue`,`today`,`week`,`undated`,`later`,`completed`];function ht(e,t=new Date){if(ft(e))return`completed`;let n=pt(e);if(!n)return`undated`;let r=new Date(t.getFullYear(),t.getMonth(),t.getDate()),i=new Date(t.getFullYear(),t.getMonth(),t.getDate()+1),a=new Date(t.getFullYear(),t.getMonth(),t.getDate()+7);return n<r?`overdue`:n<i?`today`:n<a?`week`:`later`}function gt(e){return e.priority&&e.priority>0?e.priority:10}function _t(e,t){let n=pt(e)?.getTime()??1/0,r=pt(t)?.getTime()??1/0;if(n!==r)return n-r;let i=gt(e)-gt(t);return i===0?e.title.localeCompare(t.title):i}function vt(e,t){let n=pt(e)?.getTime(),r=pt(t)?.getTime();return n===r?e.title.localeCompare(t.title):n===void 0?1:r===void 0?-1:r-n}function yt(e){return!e||e<1?null:e<=4?`high`:e===5?`medium`:`low`}function bt(e){if(e)return e===`rs`?`sr-Cyrl`:e===`sr`?`sr-Latn`:e}function xt(e,t,n,r){let i=pt(e);if(!i)return``;let a=i.getFullYear()===t.getFullYear()&&i.getMonth()===t.getMonth()&&i.getDate()===t.getDate(),o={hour:`2-digit`,minute:`2-digit`},s={month:`short`,day:`numeric`,...i.getFullYear()===t.getFullYear()?{}:{year:`numeric`}};return a?e.allDay?n:i.toLocaleTimeString(r,o):e.allDay?i.toLocaleDateString(r,s):i.toLocaleString(r,{...s,...o})}function St(e){return e===`completed`?`closed`:`active`}function Ct(e,t,n=new Date){let r=ht(e,n);switch(t){case`today`:return r===`overdue`||r===`today`;case`upcoming`:return r===`week`||r===`later`;case`undated`:return r===`undated`;case`completed`:return r===`completed`;default:return r!==`completed`}}var wt=new class{async fetchTasks(e){let t=await T(e?`/calendar/tasks?scope=${e}`:`/calendar/tasks`);if(!t.ok)throw new w(t.status,`Failed to fetch tasks`);let n=await t.json();return{tasks:n.tasks??[],calendars:n.calendars??[],failedCalendars:n.failedCalendars??0,scheduling:n.scheduling}}createTask(e){return this.send(`/calendar/tasks`,e,`Failed to create task`)}updateTask(e,t){return this.send(`/calendar/tasks/${ot(e)}/edit`,t,`Failed to update task`)}completeTask(e,t,n){return this.send(`/calendar/tasks/${ot(e)}/complete`,{done:t,lang:n},`Failed to update task`)}async deleteTask(e,t={}){let n=new URLSearchParams;t.notify===!1&&n.set(`notify`,`0`),t.lang&&n.set(`lang`,t.lang);let r=n.toString()?`?${n.toString()}`:``,i=await T(`/calendar/tasks/${ot(e)}${r}`,{method:`DELETE`});if(!i.ok)throw new w(i.status,`Failed to delete task`);return i.json().catch(()=>({}))}async send(e,t,n){let r=await T(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!r.ok)throw new w(r.status,n);return r.json()}};function Tt(e){return!e.components?.length||e.components.some(e=>e.toUpperCase()===`VEVENT`)}function Et(e){let t=e.trim(),n=/^(.*)<([^<>\s]+@[^<>\s]+)>$/.exec(t);if(n){let e=n[1].trim().replace(/^"(.*)"$/,`$1`).trim();return e?{email:n[2],name:e}:{email:n[2]}}return/^[^\s@<>]+@[^\s@<>]+$/.test(t)?{email:t}:null}function Dt(e){let t=e.name?.replace(/"/g,``).trim();return t?`"${t}" <${e.email}>`:e.email}function Ot(e,t){return!!e&&kt({role:e.role,attendees:e.attendees,status:e.answer},t)}function kt(e,t){return!e||t===`server`||e.ended?!1:e.role===`organizer`?(e.attendees?.length??0)>0:e.role===`attendee`&&e.status!==`declined`}var At=[`#2563eb`,`#16a34a`,`#d97706`,`#dc2626`,`#9333ea`,`#0891b2`,`#db2777`,`#ea580c`];function jt(e){let t=0;for(let n=0;n<e.length;n++)t=e.charCodeAt(n)+((t<<5)-t);return At[Math.abs(t)%At.length]}function Mt(e){return e.allDay===!0}var Nt=class{async fetchCalendars(){let e=await T(`/calendar/calendars`);if(!e.ok)throw Error(`Failed to fetch calendars`);return e.json()}async fetchEvents(e,t,n){let r=new URLSearchParams;r.append(`start`,e.toISOString()),r.append(`end`,t.toISOString()),n&&r.append(`query`,n);let i=await T(`/calendar/events?${r.toString()}`);if(!i.ok)throw Error(`Failed to fetch events`);return i.json()}async createCalendar(e){let t=await T(`/calendar/calendars`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({name:e})});if(!t.ok)throw new w(t.status,`Failed to create calendar`);return t.json()}async renameCalendar(e,t){let n=await T(`/calendar/calendars/${ot(e)}`,{method:`PATCH`,headers:{"Content-Type":`application/json`},body:JSON.stringify({name:t})});if(!n.ok)throw Error(`Failed to rename calendar`);return n.json()}async deleteCalendar(e){let t=await T(`/calendar/calendars/${ot(e)}`,{method:`DELETE`});if(!t.ok)throw Error(`Failed to delete calendar`);return t.json()}async createEvent(e){let t=await T(`/calendar/events`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(!t.ok)throw new w(t.status,`Failed to create event`);return t.json()}async updateEvent(e,t){let n=await T(`/calendar/events/${ot(e)}/edit`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!n.ok)throw new w(n.status,`Failed to update event`);return n.json()}async respondToEvent(e,t,n){let r=await T(`/calendar/${e.task?`tasks`:`events`}/${ot(e.path)}/respond`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({status:t,etag:e.etag,lang:n})});if(!r.ok)throw new w(r.status,`Failed to answer the invitation`);return r.json()}async deleteEvent(e,t={}){let n=ot(e),r=new URLSearchParams;t.notify===!1&&r.set(`notify`,`0`),t.lang&&r.set(`lang`,t.lang);let i=await T(`/calendar/events/${n}${r.toString()?`?${r.toString()}`:``}`,{method:`DELETE`});if(!i.ok)throw Error(`Failed to delete event`);return i.json()}},Pt=e=>`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`;function Ft(e){let t=[];for(let n of e){let e=pt(n);if(!e||ft(n))continue;let r=new Date(e.getFullYear(),e.getMonth(),e.getDate()+1);t.push({uid:n.uid,summary:n.title,start:`${Pt(e)}T00:00:00Z`,end:`${Pt(r)}T00:00:00Z`,allDay:!0,path:n.path,calendarPath:n.calendarPath,task:n})}return t}function It(e){let t=new Date(e);return t.setDate(t.getDate()-(t.getDay()+6)%7),t.setHours(0,0,0,0),t}var Lt=new Nt,E=`INBOX`,Rt=`Drafts`,zt=`Sent`,Bt=`Archive`,Vt=`Archives`,Ht=`Spam`,Ut=`Junk`,Wt=`Trash`;function D(e){return encodeURIComponent(encodeURIComponent(e))}var Gt={"\\inbox":`inbox`,"\\drafts":`drafts`,"\\sent":`sent`,"\\archive":`archive`,"\\junk":`junk`,"\\trash":`trash`,"\\all":`all`},Kt={[E.toLowerCase()]:`inbox`,[Rt.toLowerCase()]:`drafts`,[zt.toLowerCase()]:`sent`,[Bt.toLowerCase()]:`archive`,[Vt.toLowerCase()]:`archive`,[Ht.toLowerCase()]:`junk`,[Ut.toLowerCase()]:`junk`,[Wt.toLowerCase()]:`trash`,"deleted items":`trash`};function qt(e,t){if(!e)return null;let n=(Array.isArray(e.Attrs)?e.Attrs:[]).map(e=>typeof e==`string`?e.toLowerCase():``);for(let e of n){let t=Gt[e];if(t)return t}if(n.includes(`\\noselect`)||n.includes(`\\nonexistent`))return null;let r=Kt[(e.Name||e.Mailbox||``).toLowerCase()]??null;return r&&t?.has(r)?null:r}function Jt(e,t=[]){if(!e)return null;let n=Xt(t),r=(t||[]).find(t=>(t?.Name||t?.Mailbox)===e);if(r)return qt(r,n);let i=Kt[e.toLowerCase()]??null;return i&&n.has(i)?null:i}function Yt(e,t,n){let r=Xt(t),i=(t||[]).find(t=>qt(t,r)===e);return i&&(i.Name||i.Mailbox)||n}function Xt(e=[]){let t=new Set;for(let n of e||[]){let e=Array.isArray(n?.Attrs)?n.Attrs:[];for(let n of e){let e=typeof n==`string`?Gt[n.toLowerCase()]:void 0;e&&e!==`inbox`&&t.add(e)}}return t}function Zt(e,t,n){if(!e||!t||e===t||!e.startsWith(t))return!1;let r=e.slice(t.length);return n?r.startsWith(n):/^[^A-Za-z0-9]/.test(r)}function Qt(e,t,n){return e===t||Zt(e,t,n)}function $t(e,t=[]){return e?en(t.find(t=>(t.Name||t.Mailbox)===e)):``}function en(e,t=``){let n=e?.Delimiter||e?.Delim;return typeof n==`number`?n>0?String.fromCharCode(n):``:typeof n==`string`&&n?n:t}function tn(e,t){return t?e.split(t):[e]}function O(e){return n`
    <svg class="icon">
      <use href="/assets/icons/sprite.svg?v=12#${e}"></use>
    </svg>
  `}function nn(e){if(!e)return`#78909c`;let t=[`#ef5350`,`#ec407a`,`#ab47bc`,`#7e57c2`,`#5c6bc0`,`#42a5f5`,`#29b6f6`,`#26c6da`,`#26a69a`,`#66bb6a`,`#9ccc65`,`#d4e157`,`#ffca28`,`#ffa726`,`#ff7043`,`#8d6e63`,`#78909c`],n=0;for(let t=0;t<e.length;t++)n=e.charCodeAt(t)+((n<<5)-n);return t[Math.abs(n)%t.length]}function rn(e,t=`YYYY-MM-DD`,n=`12`){if(!e)return``;let r=typeof e==`string`?new Date(e):e,i=new Date;if(r.getDate()===i.getDate()&&r.getMonth()===i.getMonth()&&r.getFullYear()===i.getFullYear())return r.toLocaleTimeString(void 0,{hour:`2-digit`,minute:`2-digit`,hour12:n===`12`});if(r.getFullYear()!==i.getFullYear()){let e=r.getFullYear(),n=String(r.getMonth()+1).padStart(2,`0`),i=String(r.getDate()).padStart(2,`0`);return t===`YYYY-MM-DD`?`${e}-${n}-${i}`:t===`MM/DD/YYYY`?`${n}/${i}/${e}`:t===`DD.MM.YYYY`?`${i}.${n}.${e}`:r.toLocaleDateString(void 0,{year:`numeric`,month:`short`,day:`numeric`})}return r.toLocaleDateString(void 0,{month:`short`,day:`numeric`})}function an(e,t=`YYYY-MM-DD`,n=`12`){if(!e)return``;let r=typeof e==`string`?new Date(e):e,i=r.getFullYear(),a=String(r.getMonth()+1).padStart(2,`0`),o=String(r.getDate()).padStart(2,`0`),s=`${i}-${a}-${o}`;t===`MM/DD/YYYY`?s=`${a}/${o}/${i}`:t===`DD.MM.YYYY`&&(s=`${o}.${a}.${i}`);let c=r.toLocaleTimeString(void 0,{hour:`2-digit`,minute:`2-digit`,hour12:n===`12`});return`${s} ${c}`}function on(e,t,n){if(!e)return``;let r={[E]:t?.t(`folderList.inbox`),[Rt]:t?.t(`folderList.drafts`),[zt]:t?.t(`folderList.sent`),[Bt]:t?.t(`folderList.archive`),[Vt]:t?.t(`folderList.archive`),[Ht]:t?.t(`folderList.spam`),[Ut]:t?.t(`folderList.junk`),[Wt]:t?.t(`folderList.trash`)};if(r[e])return r[e];let i=n?e.split(n):e.split(/[.\/]/);return i[i.length-1]||e}var sn=[`B`,`KB`,`MB`,`GB`,`TB`,`PB`];function cn(e){if(!Number.isFinite(e)||e<=0)return`0 B`;let t=1024,n=Math.floor(Math.log(e)/Math.log(t)),r=Math.min(Math.max(n,0),sn.length-1),i=Math.round(e/t**+r);return i>=t&&r<sn.length-1&&(i=Math.round(i/t),r++),`${i} ${sn[r]}`}var ln=new Set([`gmail.com`,`yahoo.com`,`hotmail.com`,`outlook.com`,`icloud.com`,`me.com`,`mac.com`,`aol.com`,`proton.me`,`protonmail.com`,`live.com`,`msn.com`,`pm.me`,`yandex.ru`,`mail.ru`,`gmx.de`,`web.de`,`t-online.de`,`orange.fr`,`free.fr`]);function un(e){if(!e)return``;let t=e.toLowerCase();return ln.has(t)?``:`/bimi/avatar?domain=${encodeURIComponent(t)}`}function dn(e){let t=e?.Envelope?.From;return Array.isArray(t)&&t.length===1&&!!t[0]?.Mailbox&&un(t[0]?.Host||``)!==``}function fn(e,t){if(!e?.HasBimiPotential)return``;let n=e.Envelope?.From;if(!Array.isArray(n)||n.length!==1)return``;let r=e=>e?.Mailbox&&e?.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``,i=r(n[0]);return!i||i!==r(t)?``:un(n[0].Host)}function pn(e){if(!e)return 0;let t=e.style.width;e.style.width=`0px`;let n=e.scrollWidth;return e.style.width=t,n}function k(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var mn=class extends d{constructor(...e){super(...e),this.icon=``,this.title=``,this.disabled=!1,this.active=!1,this.spinning=!1}static{this.styles=g`
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
  `}_handleAnimationIteration(){this.dispatchEvent(new Event(`animationiteration`,{bubbles:!0,composed:!0}))}render(){return n`
      <button 
        type="button"
        title=${this.title}
        ?disabled=${this.disabled}
        class=${this.spinning?`spinning`:``}
        part="button"
        @animationiteration=${this._handleAnimationIteration}
      >
        ${this.icon?O(this.icon):n`<slot></slot>`}
      </button>
    `}};k([o({type:String})],mn.prototype,`icon`,void 0),k([o({type:String})],mn.prototype,`title`,void 0),k([o({type:Boolean})],mn.prototype,`disabled`,void 0),k([o({type:Boolean,reflect:!0})],mn.prototype,`active`,void 0),k([o({type:Boolean})],mn.prototype,`spinning`,void 0),mn=k([p(`alps-icon-btn`)],mn);var hn=g`
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
`,A=class extends d{constructor(...e){super(...e),this.isMobile=!1,this.isOpen=!1,this.collapsed=!1,this.suppressHover=!1,this.isHovered=!1,this.width=250,this.hideFooterDivider=!1,this.showMobileBack=!1,this.isDragging=!1}static{this.styles=g`
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
  `}startResize(e){if(this.isMobile||this.collapsed)return;e.preventDefault(),this.isDragging=!0,this.dispatchEvent(new CustomEvent(`drag-start`));let t=e.clientX,n=this.width,r=e=>{let r=n+(e.clientX-t);this.dispatchEvent(new CustomEvent(`sidebar-resize`,{detail:{newWidth:r,clientX:e.clientX}}))},i=()=>{this.isDragging=!1,window.removeEventListener(`mousemove`,r),window.removeEventListener(`mouseup`,i),this.dispatchEvent(new CustomEvent(`drag-end`))};window.addEventListener(`mousemove`,r),window.addEventListener(`mouseup`,i)}render(){return n`
      <div class="mobile-backdrop" @click=${()=>this.dispatchEvent(new CustomEvent(`close-sidebar`))}></div>
      <aside class="sidebar ${this.isDragging?`dragging`:``}" part="sidebar" style="--sidebar-width-expanded: ${this.width}px">
        <div class="sidebar-content">
          <slot></slot>
        </div>
        <div class="sidebar-footer">
          ${this.isMobile&&this.showMobileBack?n`
            <button class="mobile-return-btn" @click=${()=>window.location.hash=``}>
              ${O(`arrowLeft`)} <span class="return-text">${this.i18nStore?.t(`messageReader.back`)||`Back`}</span>
            </button>
          `:this.isMobile?``:n`
            <alps-icon-btn 
              class="collapse-btn"
              icon="sidebar"
              title=${this.collapsed?this.i18nStore?.t(`folderList.expandSidebar`):this.i18nStore?.t(`folderList.collapseSidebar`)}
              @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-collapse`))}
              style="--btn-padding: 8px; --icon-size: 20px;"
            ></alps-icon-btn>
          `}
          ${!this.hideFooterDivider&&(!this.isMobile||this.showMobileBack)?n`<div class="footer-divider"></div>`:``}
          <div style="display: flex; flex: 1; justify-content: flex-start;">
            <slot name="footer-actions"></slot>
          </div>
        </div>
      </aside>
      <div class="sidebar-resizer ${this.isDragging?`dragging`:``}" @mousedown=${this.startResize}></div>
    `}};k([h({context:S})],A.prototype,`i18nStore`,void 0),k([o({type:Boolean})],A.prototype,`isMobile`,void 0),k([o({type:Boolean})],A.prototype,`isOpen`,void 0),k([o({type:Boolean,reflect:!0})],A.prototype,`collapsed`,void 0),k([o({type:Boolean,reflect:!0})],A.prototype,`suppressHover`,void 0),k([o({type:Boolean,reflect:!0})],A.prototype,`isHovered`,void 0),k([o({type:Number})],A.prototype,`width`,void 0),k([o({type:Boolean})],A.prototype,`hideFooterDivider`,void 0),k([o({type:Boolean})],A.prototype,`showMobileBack`,void 0),k([a()],A.prototype,`isDragging`,void 0),A=k([p(`alps-sidebar`)],A);var gn=class extends d{constructor(...e){super(...e),this.options=[],this.value=``}static{this.styles=g`
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
  `}render(){return n`
      ${this.options.map(e=>n`
        <button 
          class="${this.value===e.value?`active`:``}" 
          @click=${()=>this._select(e.value)}
        >${e.label}</button>
      `)}
    `}_select(e){this.value!==e&&(this.value=e,this.dispatchEvent(new CustomEvent(`change`,{detail:{value:e}})))}};k([o({type:Array})],gn.prototype,`options`,void 0),k([o({type:String})],gn.prototype,`value`,void 0),gn=k([p(`alps-toggle`)],gn);var _n=class extends d{constructor(...e){super(...e),this.variant=`normal`,this.icon=``,this.disabled=!1,this.spinning=!1,this.type=`button`,this.title=``,this.fullWidth=!1,this.handleClick=e=>{if(this.disabled||this.spinning){e.preventDefault(),e.stopPropagation();return}if(this.type===`submit`){let t=this.closest(`form`);t&&(e.preventDefault(),t.requestSubmit())}else if(this.type===`reset`){let t=this.closest(`form`);t&&(e.preventDefault(),t.reset())}}}connectedCallback(){super.connectedCallback(),this.addEventListener(`click`,this.handleClick)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(`click`,this.handleClick)}static{this.styles=g`
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
  `}render(){return n`
      <button 
        type=${this.type}
        title=${this.title}
        ?disabled=${this.disabled||this.spinning}
        part="button"
      >
        ${this.spinning?n`
          <span class="icon-container spinner">
            ${O(`edelweiss`)}
          </span>
        `:this.icon?n`
          <span class="icon-container">
            ${O(this.icon)}
          </span>
        `:``}
        <span class="content"><slot></slot></span>
      </button>
    `}};k([o({type:String,reflect:!0})],_n.prototype,`variant`,void 0),k([o({type:String})],_n.prototype,`icon`,void 0),k([o({type:Boolean,reflect:!0})],_n.prototype,`disabled`,void 0),k([o({type:Boolean,reflect:!0})],_n.prototype,`spinning`,void 0),k([o({type:String})],_n.prototype,`type`,void 0),k([o({type:String})],_n.prototype,`title`,void 0),k([o({type:Boolean,attribute:`full-width`,reflect:!0})],_n.prototype,`fullWidth`,void 0),_n=k([p(`alps-button`)],_n);var vn=class extends d{constructor(...e){super(...e),this.scrolled=!1}static{this.styles=g`
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
  `}render(){return n`<slot></slot>`}};k([o({type:Boolean,reflect:!0})],vn.prototype,`scrolled`,void 0),vn=k([p(`alps-toolbar`)],vn);var yn=class extends d{constructor(...e){super(...e),this.collapsed=!1,this.icon=`plus`,this.text=``,this.disabled=!1,this.title=``}static{this.styles=g`
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
  `}render(){return n`
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
    `}};k([o({type:Boolean})],yn.prototype,`collapsed`,void 0),k([o({type:String})],yn.prototype,`icon`,void 0),k([o({type:String})],yn.prototype,`text`,void 0),k([o({type:Boolean})],yn.prototype,`disabled`,void 0),k([o({type:String})],yn.prototype,`title`,void 0),yn=k([p(`alps-create-button`)],yn);var bn=g`
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
`,xn=class extends d{constructor(...e){super(...e),this.title=``,this.isDanger=!1,this.dismissible=!1,this.width=`400px`,this._handleEscape=e=>{this.dismissible||e.preventDefault()},this._handleDialogClose=()=>{this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}}static{this.styles=g`
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
  `}firstUpdated(){let e=this.shadowRoot?.querySelector(`.modal-dialog`);e&&!e.open&&e.showModal()}_handleOverlayClick(e){this.dismissible?e.target===e.currentTarget&&(e.stopPropagation(),this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))):e.stopPropagation()}render(){return n`
      <dialog class="modal-dialog" @pointerdown=${this._handleOverlayClick} @cancel=${this._handleEscape} @close=${this._handleDialogClose}>
        <div class="modal-card" style="width: ${this.width};" @pointerdown=${e=>e.stopPropagation()}>
          <slot name="header">
            ${this.title?n`<h3 class="modal-title ${this.isDanger?`danger`:``}">${this.title}</h3>`:``}
          </slot>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-actions">
            <slot name="actions"></slot>
          </div>
        </div>
      </dialog>
    `}};k([o({type:String})],xn.prototype,`title`,void 0),k([o({type:Boolean})],xn.prototype,`isDanger`,void 0),k([o({type:Boolean})],xn.prototype,`dismissible`,void 0),k([o({type:String})],xn.prototype,`width`,void 0),xn=k([p(`ui-modal`)],xn);var j=class extends d{constructor(...e){super(...e),this._handleI18nChange=()=>this.requestUpdate(),this.type=`text`,this.value=``,this.placeholder=``,this.required=!1,this.autocomplete=``,this.inputId=``,this.icon=``,this.clearable=!1,this.autofocus=!1,this.showPassword=!1}static{this.styles=g`
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
  `}handleInput(e){let t=e.target;this.value=t.value,this.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}togglePassword(){this.showPassword=!this.showPassword}handleClear(){this.value=``,this.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`clear`,{bubbles:!0,composed:!0}))}handleKeyDown(e){if(e.key===`Enter`){let t=this.closest(`form`);t&&(e.preventDefault(),t.requestSubmit())}}checkValidity(){let e=this.shadowRoot?.querySelector(`input`);return e?e.checkValidity():!0}reportValidity(){let e=this.shadowRoot?.querySelector(`input`);return e?e.reportValidity():!0}focus(){let e=this.shadowRoot?.querySelector(`input`);e&&e.focus()}connectedCallback(){super.connectedCallback(),this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}render(){let e=this.type===`password`,t=e&&this.showPassword?`text`:this.type,r=this.icon||(this.type===`email`?`at`:``);return n`
      <div class="input-wrapper ${r?`has-left-icon`:``} ${(e||this.clearable)&&this.value?`has-right-icon`:``}">
        ${r?n`
          <span class="icon-left">
            ${O(r)}
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

        ${e&&this.value?n`
          <button 
            type="button" 
            class="action-btn" 
            @click=${this.togglePassword}
            title=${this.showPassword?this.i18nStore?.t(`general.hidePassword`)||`Hide password`:this.i18nStore?.t(`general.showPassword`)||`Show password`}
            tabindex="-1"
          >
            ${O(this.showPassword?`eyeSlash`:`eye`)}
          </button>
        `:this.clearable&&this.value?n`
          <button 
            type="button" 
            class="action-btn" 
            @click=${this.handleClear}
            title=${this.i18nStore?.t(`general.clear`)||`Clear`}
            tabindex="-1"
          >
            ${O(`x`)}
          </button>
        `:``}
      </div>
    `}};k([h({context:S})],j.prototype,`i18nStore`,void 0),k([o({type:String})],j.prototype,`type`,void 0),k([o({type:String})],j.prototype,`value`,void 0),k([o({type:String})],j.prototype,`placeholder`,void 0),k([o({type:Boolean})],j.prototype,`required`,void 0),k([o({type:String})],j.prototype,`autocomplete`,void 0),k([o({type:String})],j.prototype,`inputId`,void 0),k([o({type:String})],j.prototype,`icon`,void 0),k([o({type:Boolean})],j.prototype,`clearable`,void 0),k([o({type:Boolean})],j.prototype,`autofocus`,void 0),k([a()],j.prototype,`showPassword`,void 0),j=k([p(`alps-input`)],j);var Sn=class extends d{constructor(...e){super(...e),this.value=``,this.options=[]}static{this.styles=g`
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
	`}handleChange(e){let t=e.target;this.value=t.value,this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}render(){return n`
			<div class="select-wrapper">
				<select .value=${this.value} @change=${this.handleChange}>
					${this.options.map(e=>n`<option value=${e.value} ?selected=${e.value===this.value} ?disabled=${e.disabled}>${e.label}</option>`)}
				</select>
				<span class="caret">
					${O(`caret-down`)}
				</span>
			</div>
		`}};k([o({type:String})],Sn.prototype,`value`,void 0),k([o({type:Array})],Sn.prototype,`options`,void 0),Sn=k([p(`alps-select`)],Sn);var Cn=new Set([``,`text`,`search`,`url`,`email`,`password`,`tel`,`number`]);function wn(e){if(!e)return!1;if(e.isContentEditable)return!0;let t=e.tagName;if(t===`TEXTAREA`||t===`SELECT`)return!0;if(t===`INPUT`)return Cn.has((e.type||``).toLowerCase());let n=e.getAttribute(`role`);return n===`textbox`||n===`searchbox`}function Tn(e){return e?e.tagName===`TEXTAREA`||e.isContentEditable:!1}var En=g`
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
`,Dn=class extends d{constructor(...e){super(...e),this.align=`right`,this.position=`bottom`,this.triggerOn=`click`,this.openState=!1,this._handleDialogClick=e=>{this.openState&&e.target===e.currentTarget&&(e.stopPropagation(),e.preventDefault(),this.close())},this._handleDialogClose=()=>{this.openState&&this.close()},this._handleDialogKeydown=e=>{if(this.openState){if(e.key===`ArrowDown`||e.key===`ArrowUp`){if(Tn(this._getActiveElement()))return;e.preventDefault();let t=this._getFocusableElements();if(t.length===0)return;let n=this._getActiveElement(),r=t.findIndex(e=>e===n);r=e.key===`ArrowDown`?r===-1?0:(r+1)%t.length:r===-1?t.length-1:(r-1+t.length)%t.length,t[r].focus()}else if(e.key===`Enter`||e.key===` `){let t=this._getActiveElement();if(e.key===` `?wn(t):Tn(t))return;t&&typeof t.click==`function`&&(e.preventDefault(),t.click())}}},this._closeTimeout=null,this._handleMouseEnter=()=>{this.triggerOn===`hover`&&(this._closeTimeout&&=(clearTimeout(this._closeTimeout),null),this.open())},this._handleMouseLeave=()=>{this.triggerOn===`hover`&&(this._closeTimeout&&clearTimeout(this._closeTimeout),this._closeTimeout=setTimeout(()=>{this.close(),this._closeTimeout=null},300))},this._handleResize=()=>{this.openState&&this._updatePosition()}}static{this.styles=g`
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
      pointer-events: none;
    }

    :host([triggerOn="click"]) .popup-dialog {
      pointer-events: auto;
    }

    .popup-dialog::backdrop {
      background: transparent;
    }

    .popup-content {
      position: absolute;
      pointer-events: auto;
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

    .popup-content::before,
    .popup-content::after {
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

    /* Horizontal Left Position Arrow (points right, on the right border of popup) */
    .popup-content.position-left::before {
      right: -6px;
      top: var(--arrow-top, 10px);
      border-width: 6px 0 6px 6px;
      border-color: transparent transparent transparent var(--border-color, #e5e7eb);
    }
    .popup-content.position-left::after {
      right: -5px;
      top: calc(var(--arrow-top, 10px) + 1px);
      border-width: 5px 0 5px 5px;
      border-color: transparent transparent transparent var(--bg-primary, #ffffff);
    }

    /* Horizontal Right Position Arrow (points left, on the left border of popup) */
    .popup-content.position-right::before {
      left: -6px;
      top: var(--arrow-top, 10px);
      border-width: 6px 6px 6px 0;
      border-color: transparent var(--border-color, #e5e7eb) transparent transparent;
    }
    .popup-content.position-right::after {
      left: -5px;
      top: calc(var(--arrow-top, 10px) + 1px);
      border-width: 5px 5px 5px 0;
      border-color: transparent var(--bg-primary, #ffffff) transparent transparent;
    }

  `}open(){this.openState=!0,this.dispatchEvent(new CustomEvent(`popup-open`,{bubbles:!0,composed:!0}))}close(){this.openState=!1,this.dispatchEvent(new CustomEvent(`popup-close`,{bubbles:!0,composed:!0}))}toggle(e){if(this.triggerOn===`hover`){e.stopPropagation();return}this.openState?this.close():this.open()}_getActiveElement(){let e=document.activeElement;for(;e?.shadowRoot&&e.shadowRoot.activeElement;)e=e.shadowRoot.activeElement;return e}_getFocusableElements(){let e=this.shadowRoot?.querySelector(`slot:not([name])`);if(!e)return[];let t=e.assignedElements({flatten:!0}),n=[],r=`button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])`;return t.forEach(e=>{if(e instanceof HTMLElement){e.matches(r)&&n.push(e);let t=Array.from(e.querySelectorAll(r));n.push(...t)}}),n}updated(e){if(super.updated(e),e.has(`openState`)){let e=this.shadowRoot?.querySelector(`.popup-dialog`);if(this.openState)e&&!e.open&&(this.triggerOn===`hover`?e.show():e.showModal()),this._updatePosition();else if(e&&e.open){e.close();let t=this.shadowRoot?.querySelector(`slot[name="trigger"]`);t&&t.assignedElements({flatten:!0}).forEach(e=>{e instanceof HTMLElement&&e.blur()})}}}_updatePosition(){let e=this.shadowRoot?.querySelector(`.trigger`),t=this.shadowRoot?.querySelector(`.popup-content`);if(!e||!t)return;let n=e.getBoundingClientRect(),r=t.getBoundingClientRect(),i=this.position,a=this.align;if(t.style.top=``,t.style.bottom=``,t.style.left=``,t.style.right=``,t.style.removeProperty(`--arrow-right`),t.style.removeProperty(`--arrow-left`),t.style.removeProperty(`--arrow-top`),t.style.removeProperty(`--arrow-bottom`),this.position===`left`||this.position===`right`){this.position===`right`?n.right+6+r.width>window.innerWidth&&n.left-6-r.width>=0&&(i=`left`):n.left-6-r.width<0&&n.right+6+r.width<=window.innerWidth&&(i=`right`),this.align===`top`?n.top+r.height>window.innerHeight&&n.bottom-r.height>=0&&(a=`bottom`):n.bottom-r.height<0&&n.top+r.height<=window.innerHeight&&(a=`top`),i===`right`?(t.style.left=`${n.right+6}px`,t.style.right=`auto`):(t.style.right=`${window.innerWidth-n.left+6}px`,t.style.left=`auto`);let e=n.top+n.height/2;if(a===`top`){let i=n.top-4;i+r.height>window.innerHeight&&(i=window.innerHeight-r.height-8),i=Math.max(8,i),t.style.top=`${i}px`,t.style.bottom=`auto`;let a=e-i-6;t.style.setProperty(`--arrow-top`,`${Math.max(10,Math.min(r.height-20,a))}px`)}else{let i=window.innerHeight-n.bottom-4;i+r.height>window.innerHeight&&(i=window.innerHeight-r.height-8),i=Math.max(8,i),t.style.bottom=`${i}px`,t.style.top=`auto`;let a=e-(window.innerHeight-i-r.height)-6;t.style.setProperty(`--arrow-top`,`${Math.max(10,Math.min(r.height-20,a))}px`)}}else if(this.position===`bottom`?n.bottom+8+r.height>window.innerHeight&&n.top-8-r.height>=0&&(i=`top`):n.top-8-r.height<0&&n.bottom+8+r.height<=window.innerHeight&&(i=`bottom`),this.align===`right`?n.right-r.width<0&&n.left+r.width<=window.innerWidth&&(a=`left`):n.left+r.width>window.innerWidth&&n.right-r.width>=0&&(a=`right`),i===`bottom`?(t.style.top=`${n.bottom+8}px`,t.style.bottom=`auto`):(t.style.bottom=`${window.innerHeight-n.top+8}px`,t.style.top=`auto`),a===`right`){let e=window.innerWidth-n.right;e+r.width>window.innerWidth&&(e=window.innerWidth-r.width-8),e=Math.max(8,e),t.style.right=`${e}px`,t.style.left=`auto`;let i=n.left+n.width/2,a=window.innerWidth-e-i-6;t.style.setProperty(`--arrow-right`,`${Math.max(10,Math.min(r.width-20,a))}px`)}else{let e=n.left;e+r.width>window.innerWidth&&(e=window.innerWidth-r.width-8),e=Math.max(8,e),t.style.left=`${e}px`,t.style.right=`auto`;let i=n.left+n.width/2-e-6;t.style.setProperty(`--arrow-left`,`${Math.max(10,Math.min(r.width-20,i))}px`)}t.classList.remove(`position-top`,`position-bottom`,`position-left`,`position-right`,`align-left`,`align-right`,`align-top`,`align-bottom`),t.classList.add(`position-${i}`,`align-${a}`)}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this._handleResize,{passive:!0}),this.addEventListener(`mouseenter`,this._handleMouseEnter),this.addEventListener(`mouseleave`,this._handleMouseLeave)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this._handleResize),this.removeEventListener(`mouseenter`,this._handleMouseEnter),this.removeEventListener(`mouseleave`,this._handleMouseLeave),this._closeTimeout&&=(clearTimeout(this._closeTimeout),null);let e=this.shadowRoot?.querySelector(`.popup-dialog`);e?.open&&e.close(),this.openState=!1}render(){return n`
      <div class="trigger" @click=${this.toggle}>
        <slot name="trigger"></slot>
      </div>
      
      <dialog class="popup-dialog" 
        @click=${this._handleDialogClick} 
        @contextmenu=${this._handleDialogClick} 
        @close=${this._handleDialogClose}
        @keydown=${this._handleDialogKeydown}>
        <div class="popup-content align-${this.align} position-${this.position}">
          <slot></slot>
        </div>
      </dialog>
    `}};k([o({type:String})],Dn.prototype,`align`,void 0),k([o({type:String})],Dn.prototype,`position`,void 0),k([o({type:String,reflect:!0})],Dn.prototype,`triggerOn`,void 0),k([o({type:Boolean,reflect:!0,attribute:`open`})],Dn.prototype,`openState`,void 0),Dn=k([p(`alps-popup`)],Dn);var On=class extends d{constructor(...e){super(...e),this.addresses=[],this.disabled=!1,this.inputText=``,this.suggestions=[],this.focusedSuggestionIndex=-1,this._suggestionTimeout=null,this._suggestionSeq=0}focus(){let e=this.shadowRoot?.querySelector(`input`);e&&e.focus()}updated(e){if(super.updated(e),e.has(`focusedSuggestionIndex`)&&this.focusedSuggestionIndex>=0){let e=this.shadowRoot?.querySelector(`.dropdown-item.active`);e&&e.scrollIntoView({block:`nearest`})}}_isBlockedAddress(e){let t=e.trim();if(t.endsWith(`>`)){let e=t.lastIndexOf(`<`);e!==-1&&(t=t.substring(e+1,t.length-1))}let n=t.toLowerCase();return n.startsWith(`noreply`)||n.startsWith(`no-reply`)||n.startsWith(`mailer-daemon`)}_isValidEmail(e){if(this._isBlockedAddress(e))return!1;let t=e.trim();return!!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)||/^.*?<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(t))}_displayAddr(e){let t=e.trim();if(t.endsWith(`>`)){let e=t.lastIndexOf(`<`);if(e!==-1){let n=t.substring(0,e).trim(),r=t.substring(e+1,t.length-1);return n.replace(/^["']|["']$/g,``).trim()||r}}return e}_cancelSuggestions(){this._suggestionTimeout!==null&&(window.clearTimeout(this._suggestionTimeout),this._suggestionTimeout=null),this._suggestionSeq++}_handleInput(e){let t=e.target;if(this.inputText=t.value,this._cancelSuggestions(),this.inputText.trim().length>1){let e=this._suggestionSeq,t=this.inputText.trim();this._suggestionTimeout=window.setTimeout(async()=>{this._suggestionTimeout=null;try{let n=await v.invokeHookAsync(`composer:suggest`,{query:t});if(e!==this._suggestionSeq)return;this.suggestions=n.flat(),this.focusedSuggestionIndex=-1}catch(t){if(e!==this._suggestionSeq)return;console.error(`Failed to get suggestions`,t),this.suggestions=[],this.focusedSuggestionIndex=-1}},300)}else this.suggestions=[],this.focusedSuggestionIndex=-1}_handleKeyDown(e){let t=this.inputText.trim();if(this.suggestions.length>0){if(e.key===`ArrowDown`){e.preventDefault(),this._cancelSuggestions(),this.focusedSuggestionIndex=Math.min(this.focusedSuggestionIndex+1,this.suggestions.length-1);return}else if(e.key===`ArrowUp`){e.preventDefault(),this._cancelSuggestions(),this.focusedSuggestionIndex=Math.max(this.focusedSuggestionIndex-1,-1);return}else if(e.key===`Enter`&&this.focusedSuggestionIndex>=0){e.preventDefault(),this._cancelSuggestions();let t=this.suggestions[this.focusedSuggestionIndex],n=t.name?`"`+t.name+`" <`+t.address+`>`:t.address;this._addAddress(n);return}else if(e.key===`Escape`){e.preventDefault(),this._cancelSuggestions(),this.suggestions=[],this.focusedSuggestionIndex=-1;return}}if(e.key===`Enter`&&t)e.preventDefault(),this._isValidEmail(t)&&this._addAddress(t);else if((e.key===` `||e.key===`,`)&&t)this._isValidEmail(t)&&(e.preventDefault(),this._addAddress(t));else if(e.key===`Backspace`&&!this.inputText&&this.addresses.length>0){let e=this.addresses[this.addresses.length-1];this._removeAddress(e),this.inputText=e+` `}}_addAddress(e,t=!0){this.addresses.includes(e)||(this.addresses=[...this.addresses,e],this._notifyChange()),this.inputText=``,this._cancelSuggestions(),this.suggestions=[],this.focusedSuggestionIndex=-1,t&&this.focus()}_removeAddress(e){this.addresses=this.addresses.filter(t=>t!==e),this._notifyChange()}_notifyChange(){this.dispatchEvent(new CustomEvent(`addresses-changed`,{detail:{addresses:this.addresses},bubbles:!0,composed:!0}))}_handleBlur(){setTimeout(()=>{let e=this.inputText.trim();e&&this._isValidEmail(e)&&this._addAddress(e,!1),this.suggestions=[],this.focusedSuggestionIndex=-1},150)}static{this.styles=[En,g`
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
  `]}render(){return n`
      <div class="address-container" @click=${this.focus}>
        ${this.addresses.map(e=>n`
          <div class="pill" title=${e}>
            <span class="pill-addr">${this._displayAddr(e)}</span>
            <button class="pill-remove" @click=${()=>this._removeAddress(e)} ?disabled=${this.disabled}>
              ${O(`x`)}
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
          ${this.suggestions.length>0?n`
            <div class="suggestions-dropdown">
              ${this.suggestions.map((e,t)=>n`
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
    `}};k([o({type:Array})],On.prototype,`addresses`,void 0),k([o({type:Boolean})],On.prototype,`disabled`,void 0),k([a()],On.prototype,`inputText`,void 0),k([a()],On.prototype,`suggestions`,void 0),k([a()],On.prototype,`focusedSuggestionIndex`,void 0),On=k([p(`alps-address-input`)],On);var kn=class extends d{constructor(...e){super(...e),this.title=`Confirm`,this.message=`Are you sure?`,this.confirmText=`Confirm`,this.cancelText=``,this.isDanger=!1,this.dismissible=!1}static{this.styles=[bn]}_handleCancel(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}_handleSecondary(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`secondary`,{bubbles:!0,composed:!0}))}_handleConfirm(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`confirm`,{bubbles:!0,composed:!0}))}render(){return n`
      <ui-modal 
        .title=${this.title}
        .isDanger=${this.isDanger}
        .dismissible=${this.dismissible}
        @cancel=${this._handleCancel}
      >
        <slot>${this.message}</slot>
        <alps-button slot="actions" variant="text" @click=${this._handleCancel}>${this.cancelText||this.i18nStore?.t(`general.cancel`)||`Cancel`}</alps-button>
        ${this.secondaryText?n`<alps-button slot="actions" variant="text" @click=${this._handleSecondary}>${this.secondaryText}</alps-button>`:``}
        <alps-button slot="actions" variant=${this.isDanger?`danger`:`normal`} @click=${this._handleConfirm}>
          ${this.confirmText}
        </alps-button>
      </ui-modal>
    `}};k([h({context:S})],kn.prototype,`i18nStore`,void 0),k([o({type:String})],kn.prototype,`title`,void 0),k([o({type:String})],kn.prototype,`message`,void 0),k([o({type:String})],kn.prototype,`confirmText`,void 0),k([o({type:String})],kn.prototype,`cancelText`,void 0),k([o({type:String})],kn.prototype,`secondaryText`,void 0),k([o({type:Boolean})],kn.prototype,`isDanger`,void 0),k([o({type:Boolean})],kn.prototype,`dismissible`,void 0),kn=k([p(`ui-confirm`)],kn);var M=class extends d{constructor(...e){super(...e),this.calendars=[],this.open=!1,this.scheduling=`email`,this.summary=``,this.location=``,this.calendarPath=``,this.description=``,this.startDate=``,this.startTime=``,this.endDate=``,this.endTime=``,this.isAllDay=!1,this.isSaving=!1,this.rruleFreq=``,this.originalRRule=``,this.attendees=[],this.askNotify=!1}static{this.styles=[bn,g`
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
        `]}updated(e){if(e.has(`open`)&&this.open){let e=e=>e.toString().padStart(2,`0`);if(this.askNotify=!1,this.attendees=(this.event?.attendees??[]).map(Dt),this.event){this.summary=this.event.summary||``,this.location=this.event.location||``,this.description=this.event.description||``,this.calendarPath=this.event.calendarPath||(this.calendars.length>0?this.calendars[0].path:``);let t=Mt(this.event);if(this.isAllDay=t,this.event.rrule?(this.originalRRule=this.event.rrule,this.event.rrule===`FREQ=DAILY`?this.rruleFreq=`DAILY`:this.event.rrule===`FREQ=WEEKLY`?this.rruleFreq=`WEEKLY`:this.event.rrule===`FREQ=MONTHLY`?this.rruleFreq=`MONTHLY`:this.event.rrule===`FREQ=YEARLY`?this.rruleFreq=`YEARLY`:this.rruleFreq=`CUSTOM`):(this.originalRRule=``,this.rruleFreq=``),t){let t=new Date(this.event.start);this.startDate=`${t.getUTCFullYear()}-${e(t.getUTCMonth()+1)}-${e(t.getUTCDate())}`,this.startTime=`00:00`;let n=new Date(this.event.end);n.setUTCDate(n.getUTCDate()-1),this.endDate=`${n.getUTCFullYear()}-${e(n.getUTCMonth()+1)}-${e(n.getUTCDate())}`,this.endTime=`00:00`}else{let t=new Date(this.event.start);this.startDate=`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}`,this.startTime=`${e(t.getHours())}:${e(t.getMinutes())}`;let n=new Date(this.event.end);this.endDate=`${n.getFullYear()}-${e(n.getMonth()+1)}-${e(n.getDate())}`,this.endTime=`${e(n.getHours())}:${e(n.getMinutes())}`}}else{this.summary=``,this.location=``,this.description=``,this.originalRRule=``,this.rruleFreq=``,this.calendarPath=this.calendars.length>0?this.calendars[0].path:``;let t=this.initialDate?new Date(this.initialDate):new Date;if(this.initialAllDay===void 0?this.initialDate&&t.getHours()===0&&t.getMinutes()===0:this.initialAllDay)this.isAllDay=!0,this.startDate=`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}`,this.startTime=`00:00`,this.endDate=this.startDate,this.endTime=`00:00`;else{this.isAllDay=!1,this.initialDate||(t.setMinutes(0,0,0),t.setHours(t.getHours()+1)),this.startDate=`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}`,this.startTime=`${e(t.getHours())}:${e(t.getMinutes())}`;let n=new Date(t.getTime()+3600*1e3);this.endDate=`${n.getFullYear()}-${e(n.getMonth()+1)}-${e(n.getDate())}`,this.endTime=`${e(n.getHours())}:${e(n.getMinutes())}`}}}}handleCancel(){this.open=!1,this.dispatchEvent(new CustomEvent(`close`))}formTimes(){if(this.isAllDay){let e=new Date(`${this.endDate}T00:00:00.000Z`);return e.setUTCDate(e.getUTCDate()+1),{startISO:`${this.startDate}T00:00:00.000Z`,endISO:e.toISOString()}}return{startISO:new Date(`${this.startDate}T${this.startTime||`00:00`}`).toISOString(),endISO:new Date(`${this.endDate}T${this.endTime||`00:00`}`).toISOString()}}get invited(){return this.event?.role===`attendee`}async handleSave(){if(!this.summary.trim()||!this.startDate||!this.endDate)return;let e=!!this.event?.ended&&new Date(this.formTimes().endISO)<=new Date;if(this.event?.path&&!this.invited&&kt({...this.event,ended:e},this.scheduling)){this.askNotify=!0;return}await this.save()}async save(e){this.askNotify=!1,this.isSaving=!0;try{let{startISO:t,endISO:n}=this.formTimes(),r;this.rruleFreq===`CUSTOM`?r=this.originalRRule:this.rruleFreq&&(r=`FREQ=${this.rruleFreq}`);let i={summary:this.summary,location:this.location,description:this.description,start:t,end:n,allDay:this.isAllDay,calendarPath:this.calendarPath,rrule:r,etag:this.event?.etag,attendees:this.invited?void 0:this.attendees.map(Et).filter(e=>e!==null),notify:e,lang:this.i18nStore?.getLanguage?.()};(this.event&&this.event.path?await Lt.updateEvent(this.event.path,i):await Lt.createEvent(i))?.sendFailed&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`invitations.notTold`),duration:8e3}})),this.open=!1,this.dispatchEvent(new CustomEvent(`saved`))}catch(e){console.error(`Failed to save event`,e);let t=st(e);t&&this.dispatchEvent(new CustomEvent(`conflict`)),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(t?`calendar.saveConflict`:`calendar.saveEventFailed`),duration:8e3}}))}finally{this.isSaving=!1}}render(){return this.open?n`
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

                ${this.calendars.length>1?n`
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`calendar.calendar`)}</label>
                        <alps-select
                            .value=${this.calendarPath}
                            .options=${this.calendars.map(e=>({value:e.path,label:e.name}))}
                            @change=${e=>{this.calendarPath=e.target.value}}
                            ?disabled=${!!this.event}
                        ></alps-select>
                    </div>
                `:``}

                ${this.invited?n`
                    <div class="form-group organized-by">
                        ${this.i18nStore?.t(`invitations.organizedBy`,{name:this.event?.organizer?.name||this.event?.organizer?.email||``})}
                    </div>
                `:n`
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`invitations.guests`)}</label>
                        <alps-address-input
                            class="guests"
                            .addresses=${this.attendees}
                            @addresses-changed=${e=>{this.attendees=e.detail.addresses}}
                        ></alps-address-input>
                    </div>
                `}

                <div class="form-row">
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`calendar.startDate`)}</label>
                        <alps-input 
                            type="date"
                            .value=${this.startDate} 
                            @input=${e=>this.startDate=e.target.value}
                        ></alps-input>
                    </div>
                    ${this.isAllDay?``:n`
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
                    ${this.isAllDay?``:n`
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

            ${this.askNotify?n`
                <ui-confirm
                    title=${this.i18nStore?.t(`invitations.notifyTitle`)}
                    message=${this.i18nStore?.t(`invitations.notifyChanges`)}
                    confirmText=${this.i18nStore?.t(`invitations.send`)}
                    secondaryText=${this.i18nStore?.t(`invitations.dontSend`)}
                    @confirm=${()=>this.save(!0)}
                    @secondary=${()=>this.save(!1)}
                    @cancel=${()=>{this.askNotify=!1}}
                ></ui-confirm>
            `:``}
        `:n``}};k([h({context:S})],M.prototype,`i18nStore`,void 0),k([o({type:Object})],M.prototype,`event`,void 0),k([o({type:Object})],M.prototype,`initialDate`,void 0),k([o({type:Boolean})],M.prototype,`initialAllDay`,void 0),k([o({type:Array})],M.prototype,`calendars`,void 0),k([o({type:Boolean})],M.prototype,`open`,void 0),k([o({type:String})],M.prototype,`scheduling`,void 0),k([a()],M.prototype,`summary`,void 0),k([a()],M.prototype,`location`,void 0),k([a()],M.prototype,`calendarPath`,void 0),k([a()],M.prototype,`description`,void 0),k([a()],M.prototype,`startDate`,void 0),k([a()],M.prototype,`startTime`,void 0),k([a()],M.prototype,`endDate`,void 0),k([a()],M.prototype,`endTime`,void 0),k([a()],M.prototype,`isAllDay`,void 0),k([a()],M.prototype,`isSaving`,void 0),k([a()],M.prototype,`rruleFreq`,void 0),k([a()],M.prototype,`originalRRule`,void 0),k([a()],M.prototype,`attendees`,void 0),k([a()],M.prototype,`askNotify`,void 0),M=k([p(`calendar-event-modal`)],M);function An(e){if(!e||typeof e!=`object`)return!1;if(Array.isArray(e.Children))return e.Children.some(e=>An(e));let t=`${e.Type||``}/${e.Subtype||``}`.toLowerCase();if(t===`text/calendar`||t===`application/ics`)return!0;let n=e.Extended?.Disposition?.Params?.filename||e.Params?.name||``;return typeof n==`string`&&n.toLowerCase().endsWith(`.ics`)}var jn=new class{async fetchInvitation(e,t){let n=await T(`/calendar/invitation?${new URLSearchParams({mailbox:e,uid:t}).toString()}`);if(n.status===404)return null;if(!n.ok)throw new w(n.status,`Failed to read the invitation`);return n.json()}async respond(e){return this.post(`/calendar/invitation/respond`,e,`Failed to answer the invitation`)}async apply(e){return this.post(`/calendar/invitation/apply`,e,`Failed to update the calendar`)}async post(e,t,n){let r=await T(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!r.ok)throw new w(r.status,n);return r.json()}},Mn={accepted:`accepted`,tentative:`tentative`,declined:`declined`,"needs-action":`needsAction`,delegated:`delegated`,completed:`completed`,"in-process":`inProcess`};function Nn(e){return Mn[e??``]??`needsAction`}var Pn={update:`update`,outdated:`outdated`,organizer:`organizer`,"not-invited":`notInvited`,cancel:`cancel`,cancelled:`cancelled`,reply:`reply`,replied:`replied`,unknown:`unknown`,add:`add`,added:`added`,unsupported:`unsupported`},Fn=e=>e.name||e.email,In=class extends d{constructor(...e){super(...e),this.mailbox=``,this.uid=``,this.view=null,this.busy=!1,this.notice=null,this.calendarPath=``,this.loadSeq=0,this.autoApplied=new Set}static{this.styles=g`
        :host {
            display: block;
            margin: 12px 16px 0;
        }
        .card {
            display: flex;
            gap: 12px;
            padding: 12px 16px;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 8px;
            background: var(--bg-secondary, #f9fafb);
            color: var(--text-primary, #111827);
            font-size: 13px;
        }
        .icon svg {
            width: 22px;
            height: 22px;
            fill: currentColor;
            color: var(--accent-color, #2563eb);
        }
        .body {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .eyebrow {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted, #6b7280);
        }
        .title {
            font-size: 15px;
            font-weight: 600;
            word-break: break-word;
        }
        .title.struck {
            text-decoration: line-through;
        }
        .muted {
            color: var(--text-secondary, #4b5563);
        }
        .clash {
            color: var(--warning-text, #b45309);
        }
        .warning, .notice.error {
            color: var(--error, #b91c1c);
        }
        .actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            margin-top: 6px;
        }
        .actions:empty {
            display: none;
        }
        alps-select {
            min-width: 140px;
        }
    `}willUpdate(e){(e.has(`mailbox`)||e.has(`uid`))&&(this.view=null,this.notice=null,this.load())}t(e,t){return this.i18nStore?.t(e,t)??e}async load(){let e=++this.loadSeq,{mailbox:t,uid:n}=this;if(!t||!n)return;let r;try{r=await jn.fetchInvitation(t,n)}catch(t){console.error(`Failed to read the invitation`,t),e===this.loadSeq&&(this.view=null);return}if(e!==this.loadSeq||(this.view=r,!r))return;r.calendars.some(e=>e.path===this.calendarPath)||(this.calendarPath=r.copy?.calendarPath||r.calendars[0]?.path||``);let i=JSON.stringify([t,n]);r.autoApply&&!this.autoApplied.has(i)&&(this.autoApplied.add(i),await this.apply())}async respond(e){let t=this.view;if(!(!t||this.busy)){this.busy=!0,this.notice=null;try{let n=await jn.respond({mailbox:this.mailbox,uid:this.uid,status:e,calendarPath:t.copy?void 0:this.calendarPath,lang:this.i18nStore?.getLanguage?.()});this.notice=n.sendFailed?{key:`invitations.sendFailed`,tone:`error`}:{key:n.sent?`invitations.sent`:`invitations.saved`,tone:`info`}}catch(e){console.error(`Failed to answer the invitation`,e),this.notice={key:st(e)?`invitations.changedElsewhere`:`invitations.answerFailed`,tone:`error`}}finally{this.busy=!1}await this.load()}}async apply(){let e=this.view;if(!(!e||this.busy)){this.busy=!0,this.notice=null;try{let t=(await jn.apply({mailbox:this.mailbox,uid:this.uid,calendarPath:this.calendarPath})).removed?`invitations.removed`:e.state===`add`?`invitations.added`:`invitations.updated`;this.notice={key:t,tone:`info`}}catch(e){console.error(`Failed to update the calendar`,e),this.notice={key:st(e)?`invitations.changedElsewhere`:`invitations.applyFailed`,tone:`error`}}finally{this.busy=!1}await this.load()}}kindKey(e){switch(e.method){case`cancel`:return`cancelled`;case`reply`:return`reply`;case`request`:return e.kind===`task`?`task`:e.state===`update`?`updated`:`invitation`}return e.kind===`task`?`task`:`event`}when(e){let t=this.i18nStore?.getIntlLanguage?.()||void 0,n=new Intl.DateTimeFormat(t,{weekday:`short`,year:`numeric`,month:`short`,day:`numeric`}),r=e=>new Date(`${e.slice(0,10)}T00:00:00`);if(e.kind===`task`&&!e.start){if(!e.end)return``;let i=e.allDay?n.format(r(e.end)):new Intl.DateTimeFormat(t,{dateStyle:`medium`,timeStyle:`short`}).format(new Date(e.end));return`${this.t(`tasks.due`)}: ${i}`}if(!e.start)return``;if(e.allDay){let t=r(e.start);if(!e.end)return n.format(t);let i=r(e.end);return i.setDate(i.getDate()-1),i>t?`${n.format(t)} - ${n.format(i)}`:n.format(t)}let i=new Date(e.start),a=e.end?new Date(e.end):i,o=new Intl.DateTimeFormat(t,{weekday:`short`,year:`numeric`,month:`short`,day:`numeric`,hour:`numeric`,minute:`2-digit`}),s=o.formatRange;return a>i&&s?s.call(o,i,a):o.format(i)}renderStateLine(e){if(e.ended)return n`
                <div class="muted state ended">${this.t(`invitations.states.ended`)}</div>
                ${e.status&&e.status!==`needs-action`?n`<div class="muted answer">${this.t(`invitations.yourAnswer`)}: ${this.t(`invitations.statuses.${Nn(e.status)}`)}</div>`:c}
            `;if(e.state===`answer`)return!e.status||e.status===`needs-action`?c:n`<div class="muted answer">${this.t(`invitations.yourAnswer`)}: ${this.t(`invitations.statuses.${Nn(e.status)}`)}</div>`;let t=Pn[e.state];return t?n`<div class="muted state">${this.t(`invitations.states.${t}`)}</div>`:c}renderClashes(e){if(e.ended||e.kind!==`event`||e.method!==`request`||e.state!==`answer`&&e.state!==`update`||e.status===`declined`)return c;if(!e.clashes.length)return n`<div class="muted clashes">${this.t(`invitations.noConflicts`)}</div>`;let t=e.clashes.map(e=>e.summary||this.t(`calendar.noTitle`)).join(`, `);return n`<div class="clash clashes">${this.t(`invitations.conflictsWith`,{names:t})}</div>`}renderSender(e){if(e.ended||e.senderVerified||!e.sender||![`answer`,`update`,`cancel`,`reply`].includes(e.state))return c;let t=e.method===`reply`?`invitations.unverifiedReply`:`invitations.unverified`;return n`<div class="warning sender">${this.t(t,{sender:e.sender})}</div>`}renderPicker(e){return e.copy||e.calendars.length<2?c:n`
            <alps-select
                .value=${this.calendarPath}
                .options=${e.calendars.map(e=>({value:e.path,label:e.name}))}
                title=${this.t(`invitations.calendar`)}
                ?disabled=${this.busy}
                @change=${e=>{this.calendarPath=e.target.value}}
            ></alps-select>
        `}renderActions(e){if(e.ended)return c;if(e.method===`request`&&[`answer`,`update`,`outdated`].includes(e.state)&&e.me){let t=(t,r)=>n`
                <alps-button
                    class="answer-${t}"
                    variant=${e.status===t?`primary`:`normal`}
                    aria-pressed=${e.status===t?`true`:`false`}
                    ?disabled=${this.busy}
                    @click=${()=>this.respond(t)}
                >${this.t(r)}</alps-button>
            `;return n`
                ${t(`accepted`,`invitations.accept`)}
                ${t(`tentative`,`invitations.maybe`)}
                ${t(`declined`,`invitations.decline`)}
                ${this.renderPicker(e)}
                ${e.state===`update`?this.applyButton(`invitations.updateCalendar`):c}
            `}switch(e.state){case`update`:return this.applyButton(`invitations.updateCalendar`);case`cancel`:return this.applyButton(`invitations.removeFromCalendar`);case`reply`:return this.applyButton(`invitations.recordAnswer`);case`add`:return n`${this.applyButton(`invitations.addToCalendar`)}${this.renderPicker(e)}`}return c}applyButton(e){return n`<alps-button class="apply" variant="normal" ?disabled=${this.busy} @click=${()=>this.apply()}>${this.t(e)}</alps-button>`}render(){let e=this.view;if(!e)return c;let t=e.method===`cancel`,r=this.t(`invitations.kinds.${this.kindKey(e)}`),i=this.when(e);return n`
            <div class="card" role="region" aria-label=${r}>
                <div class="icon">${O(e.kind===`task`?`checkCircle`:`calendar`)}</div>
                <div class="body">
                    <div class="eyebrow">${r}</div>
                    <div class="title ${t?`struck`:``}">${e.summary||this.t(`calendar.noTitle`)}</div>
                    ${i?n`<div class="when">${i}${e.rrule?n`, ${this.t(`invitations.repeats`)}`:c}</div>`:c}
                    ${e.location?n`<div class="muted where">${e.location}</div>`:c}
                    ${e.method===`reply`&&e.replier?n`<div class="replier">${this.t(`invitations.answered.${Nn(e.replier.status)}`,{name:Fn(e.replier)})}</div>`:e.organizer?n`<div class="muted organizer">${this.t(`invitations.organizer`)}: ${Fn(e.organizer)}</div>`:c}
                    ${this.renderClashes(e)}
                    ${this.renderStateLine(e)}
                    ${this.renderSender(e)}
                    ${this.notice?n`<div class="notice ${this.notice.tone}" role="status">${this.t(this.notice.key)}</div>`:c}
                    <div class="actions">${this.renderActions(e)}</div>
                </div>
            </div>
        `}};k([h({context:S})],In.prototype,`i18nStore`,void 0),k([o()],In.prototype,`mailbox`,void 0),k([o()],In.prototype,`uid`,void 0),k([a()],In.prototype,`view`,void 0),k([a()],In.prototype,`busy`,void 0),k([a()],In.prototype,`notice`,void 0),k([a()],In.prototype,`calendarPath`,void 0),In=k([p(`calendar-invitation-banner`)],In);var Ln=[`DAILY`,`WEEKLY`,`MONTHLY`,`YEARLY`];function Rn(e){return e?Ln.find(t=>e===`FREQ=${t}`)??`CUSTOM`:``}var zn=e=>String(e).padStart(2,`0`),N=class extends d{constructor(...e){super(...e),this.open=!1,this.lists=[],this.defaultList=``,this.scheduling=`email`,this.title=``,this.description=``,this.dueDate=``,this.dueTime=``,this.allDay=!0,this.status=`needs-action`,this.priority=0,this.percent=0,this.repeat=``,this.calendarPath=``,this.saving=!1,this.attendees=[],this.askNotify=!1,this.originalRRule=``,this.openedDue={date:``,time:``,allDay:!0}}static{this.styles=[bn,g`
            .form-group {
                margin-bottom: 16px;
                flex: 1;
            }
            .form-group label {
                display: block;
                margin-bottom: 6px;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-primary, #111827);
            }
            .form-row {
                display: flex;
                gap: 12px;
            }
            alps-input,
            alps-select {
                width: 100%;
            }
            .checkbox {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: -8px 0 16px;
                font-size: 14px;
                cursor: pointer;
            }
            input.number,
            textarea {
                width: 100%;
                box-sizing: border-box;
                padding: 8px 12px;
                border: 1px solid var(--border-color, #e5e7eb);
                border-radius: 4px;
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #111827);
                font-family: inherit;
                font-size: 14px;
            }
            textarea {
                min-height: 80px;
                resize: vertical;
            }
            input.number:focus,
            textarea:focus {
                outline: none;
                border-color: var(--accent-color, #2563eb);
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
            }
            .hint {
                font-size: 13px;
                color: var(--text-muted, #6b7280);
            }
            .assigned {
                margin-bottom: 16px;
                font-size: 13px;
                color: var(--text-secondary, #4b5563);
                overflow-wrap: anywhere;
            }
            .assigned .label {
                font-weight: 500;
            }
            .actions {
                display: flex;
                gap: 8px;
                width: 100%;
            }
            .actions .delete {
                margin-right: auto;
            }
        `]}willUpdate(e){e.has(`open`)&&this.open&&this.reset()}reset(){let e=this.task;this.title=e?.title??``,this.description=e?.description??``,this.status=e?.status??`needs-action`,this.priority=e?.priority??0,this.percent=e?.percentComplete??0,this.calendarPath=e?.calendarPath||this.defaultList||this.lists[0]?.path||``,this.originalRRule=e?.rrule??``,this.repeat=Rn(this.originalRRule),this.dueDate=``,this.dueTime=``,this.allDay=e?.due?e.allDay:!0;let t=e?pt(e):null;t&&(this.dueDate=`${t.getFullYear()}-${zn(t.getMonth()+1)}-${zn(t.getDate())}`,this.allDay||(this.dueTime=`${zn(t.getHours())}:${zn(t.getMinutes())}`)),this.openedDue={date:this.dueDate,time:this.dueTime,allDay:this.allDay},this.attendees=(e?.attendees??[]).map(Dt),this.askNotify=!1}get assignedToUser(){return this.task?.role===`attendee`}input(){let e=``,t=this.dueDate===this.openedDue.date&&this.dueTime===this.openedDue.time&&this.allDay===this.openedDue.allDay;this.task&&t?e=this.task.due??``:this.dueDate&&(e=this.allDay?`${this.dueDate}T00:00:00Z`:new Date(`${this.dueDate}T${this.dueTime||`09:00`}`).toISOString());let n=e?this.repeat===`CUSTOM`?this.originalRRule:this.repeat?`FREQ=${this.repeat}`:``:``;return{title:this.title.trim(),description:this.description,due:e,allDay:this.allDay,status:this.status,percentComplete:this.status===`completed`?100:this.percent,priority:this.priority,rrule:n,calendarPath:this.calendarPath,etag:this.task?.etag}}setStatus(e){this.status===`completed`&&e!==`completed`&&this.percent>=100&&(this.percent=0),this.status=e}close(){this.open=!1,this.dispatchEvent(new CustomEvent(`close`))}requestDelete(){this.dispatchEvent(new CustomEvent(`delete`,{detail:{task:this.task}}))}async handleSave(){if(!(this.saving||!this.title.trim()||!this.calendarPath)){if(this.task?.role===`organizer`&&Ot(this.task,this.scheduling)){this.askNotify=!0;return}await this.save()}}async save(e){this.askNotify=!1,this.saving=!0;try{let t=!this.task,n={...this.input(),attendees:this.assignedToUser?void 0:this.attendees.map(Et).filter(e=>e!==null),notify:e,lang:this.i18nStore?.getLanguage?.()},r=this.task?await wt.updateTask(this.task.path,n):await wt.createTask(n);r?.sendFailed&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`invitations.notTold`),duration:8e3}})),this.open=!1,this.dispatchEvent(new CustomEvent(`saved`,{detail:{task:r,created:t}}))}catch(e){console.error(`Failed to save task`,e);let t=st(e);t&&this.dispatchEvent(new CustomEvent(`conflict`)),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(t?`tasks.saveConflict`:`tasks.saveFailed`),duration:8e3}}))}finally{this.saving=!1}}priorityOptions(){let e=e=>this.i18nStore?.t(e)??e,t=[{value:`0`,label:e(`tasks.priorities.none`)},{value:`1`,label:e(`tasks.priorities.high`)},{value:`5`,label:e(`tasks.priorities.medium`)},{value:`9`,label:e(`tasks.priorities.low`)}];if(!t.some(e=>e.value===String(this.priority))){let n=this.priority<=4?`tasks.priorities.high`:this.priority===5?`tasks.priorities.medium`:`tasks.priorities.low`;t.push({value:String(this.priority),label:e(n)})}return t}render(){if(!this.open)return n``;let e=e=>this.i18nStore?.t(e)??e,t=!!this.dueDate,r=this.task;return n`
            <ui-modal
                title=${e(r?`tasks.editTask`:`tasks.newTask`)}
                width="460px"
                ?dismissible=${!this.saving}
                @cancel=${this.close}
            >
                <div class="form-group">
                    <label>${e(`tasks.titleField`)}</label>
                    <alps-input
                        class="title-input"
                        .value=${this.title}
                        placeholder=${e(`tasks.titlePlaceholder`)}
                        @input=${e=>{this.title=e.target.value}}
                    ></alps-input>
                </div>

                ${!r&&this.lists.length>1?n`
                    <div class="form-group">
                        <label>${e(`tasks.list`)}</label>
                        <alps-select
                            class="list-select"
                            .value=${this.calendarPath}
                            .options=${this.lists.map(e=>({value:e.path,label:e.name}))}
                            @change=${e=>{this.calendarPath=e.target.value}}
                        ></alps-select>
                    </div>
                `:``}

                <div class="form-row">
                    <div class="form-group">
                        <label>${e(`tasks.due`)}</label>
                        <alps-input
                            class="due-date"
                            type="date"
                            .value=${this.dueDate}
                            @input=${e=>{this.dueDate=e.target.value}}
                        ></alps-input>
                    </div>
                    ${t&&!this.allDay?n`
                        <div class="form-group">
                            <label>${e(`tasks.time`)}</label>
                            <alps-input
                                class="due-time"
                                type="time"
                                .value=${this.dueTime}
                                @input=${e=>{this.dueTime=e.target.value}}
                            ></alps-input>
                        </div>
                    `:``}
                </div>
                ${t?n`
                    <label class="checkbox">
                        <input
                            class="all-day"
                            type="checkbox"
                            .checked=${this.allDay}
                            @change=${e=>{this.allDay=e.target.checked,!this.allDay&&!this.dueTime&&(this.dueTime=`09:00`)}}
                        />
                        ${e(`tasks.allDay`)}
                    </label>
                `:``}

                <div class="form-row">
                    ${r?n`
                        <div class="form-group">
                            <label>${e(`tasks.status`)}</label>
                            <alps-select
                                class="status-select"
                                .value=${this.status}
                                .options=${[{value:`needs-action`,label:e(`tasks.statuses.needsAction`)},{value:`in-process`,label:e(`tasks.statuses.inProcess`)},{value:`completed`,label:e(`tasks.statuses.completed`)},{value:`cancelled`,label:e(`tasks.statuses.cancelled`)}]}
                                @change=${e=>this.setStatus(e.target.value)}
                            ></alps-select>
                        </div>
                    `:``}
                    <div class="form-group">
                        <label>${e(`tasks.priority`)}</label>
                        <alps-select
                            class="priority-select"
                            .value=${String(this.priority)}
                            .options=${this.priorityOptions()}
                            @change=${e=>{this.priority=Number(e.target.value)}}
                        ></alps-select>
                    </div>
                </div>

                <div class="form-row">
                    ${r?n`
                        <div class="form-group">
                            <label for="task-percent">${e(`tasks.percentComplete`)}</label>
                            <input
                                id="task-percent"
                                class="number"
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                .value=${String(this.status===`completed`?100:this.percent)}
                                ?disabled=${this.status===`completed`}
                                @change=${e=>{let t=Number(e.target.value);this.percent=Math.max(0,Math.min(100,Math.round(t||0)))}}
                            />
                        </div>
                    `:``}
                    <div class="form-group">
                        <label>${e(`tasks.repeat`)}</label>
                        ${t?n`
                            <alps-select
                                class="repeat-select"
                                .value=${this.repeat}
                                .options=${[{value:``,label:e(`calendar.repeatNone`)},{value:`DAILY`,label:e(`calendar.repeatDaily`)},{value:`WEEKLY`,label:e(`calendar.repeatWeekly`)},{value:`MONTHLY`,label:e(`calendar.repeatMonthly`)},{value:`YEARLY`,label:e(`calendar.repeatYearly`)},...this.repeat===`CUSTOM`?[{value:`CUSTOM`,label:e(`calendar.repeatCustom`)}]:[]]}
                                @change=${e=>{this.repeat=e.target.value}}
                            ></alps-select>
                        `:n`<div class="hint">${e(`tasks.repeatNeedsDue`)}</div>`}
                    </div>
                </div>

                <div class="form-group">
                    <label>${e(`tasks.notes`)}</label>
                    <textarea
                        .value=${this.description}
                        placeholder=${e(`tasks.addNotes`)}
                        @input=${e=>{this.description=e.target.value}}
                    ></textarea>
                </div>

                ${this.assignedToUser?n`
                    <div class="assigned">
                        <div><span class="label">${e(`tasks.assignedBy`)}:</span> ${r?.organizer?.name||r?.organizer?.email||``}</div>
                    </div>
                `:n`
                    <div class="form-group">
                        <label>${e(`tasks.assignTo`)}</label>
                        <alps-address-input
                            class="assignees"
                            .addresses=${this.attendees}
                            @addresses-changed=${e=>{this.attendees=e.detail.addresses}}
                        ></alps-address-input>
                    </div>
                    ${r?.role===`organizer`&&r.attendees?.length?n`
                        <div class="assigned answers">
                            ${r.attendees.map(t=>n`<div>${t.name||t.email}: ${e(`invitations.statuses.${Nn(t.status)}`)}</div>`)}
                        </div>
                    `:``}
                `}

                <div slot="actions" class="actions">
                    ${r?n`
                        <alps-button class="delete" variant="danger" ?disabled=${this.saving} @click=${this.requestDelete}>
                            ${e(`tasks.delete`)}
                        </alps-button>
                    `:``}
                    <alps-button variant="text" ?disabled=${this.saving} @click=${this.close}>${e(`general.cancel`)}</alps-button>
                    <alps-button
                        class="save"
                        variant="primary"
                        ?disabled=${this.saving||!this.title.trim()||!this.calendarPath}
                        ?spinning=${this.saving}
                        @click=${this.handleSave}
                    >${e(`general.save`)}</alps-button>
                </div>
            </ui-modal>

            ${this.askNotify?n`
                <ui-confirm
                    title=${e(`invitations.notifyTitle`)}
                    message=${e(`tasks.notifyChanges`)}
                    confirmText=${e(`invitations.send`)}
                    secondaryText=${e(`invitations.dontSend`)}
                    @confirm=${()=>this.save(!0)}
                    @secondary=${()=>this.save(!1)}
                    @cancel=${()=>{this.askNotify=!1}}
                ></ui-confirm>
            `:``}
        `}};k([h({context:S})],N.prototype,`i18nStore`,void 0),k([o({type:Boolean})],N.prototype,`open`,void 0),k([o({attribute:!1})],N.prototype,`task`,void 0),k([o({type:Array})],N.prototype,`lists`,void 0),k([o({type:String})],N.prototype,`defaultList`,void 0),k([o({type:String})],N.prototype,`scheduling`,void 0),k([a()],N.prototype,`title`,void 0),k([a()],N.prototype,`description`,void 0),k([a()],N.prototype,`dueDate`,void 0),k([a()],N.prototype,`dueTime`,void 0),k([a()],N.prototype,`allDay`,void 0),k([a()],N.prototype,`status`,void 0),k([a()],N.prototype,`priority`,void 0),k([a()],N.prototype,`percent`,void 0),k([a()],N.prototype,`repeat`,void 0),k([a()],N.prototype,`calendarPath`,void 0),k([a()],N.prototype,`saving`,void 0),k([a()],N.prototype,`attendees`,void 0),k([a()],N.prototype,`askNotify`,void 0),N=k([p(`task-modal`)],N);var Bn=class extends d{constructor(...e){super(...e),this.events=[],this.showTitle=!1}static{this.styles=g`
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
    `}getMonthGrid(){let e=new Date(this.year,this.month,1).getDay();e===0&&(e=7);let t=1-(e-1),n=new Date(this.year,this.month+1,0).getDate(),r=Math.ceil((n+(e-1))/7)*7,i=[];for(let e=0;e<r;e++)i.push(new Date(this.year,this.month,t+e));return i}hasEventsForDate(e){if(!this.events||this.events.length===0)return!1;let t=new Date(e);t.setHours(0,0,0,0);let n=new Date(e);return n.setHours(23,59,59,999),this.events.some(e=>{if(Mt(e)){let n=e.start.split(`T`)[0],r=e.end.split(`T`)[0],i=new Date(n+`T00:00:00`),a=new Date(r+`T00:00:00`);return i<=t&&a>t}else{let r=new Date(e.start),i=new Date(e.end);return i.getTime()===t.getTime()&&r.getTime()<i.getTime()?!1:r<=n&&i>=t}})}handleDateClick(e){this.dispatchEvent(new CustomEvent(`date-selected`,{detail:{date:e},bubbles:!0,composed:!0}))}render(){let e=this.getMonthGrid(),t=Array.from({length:7},(e,t)=>{let n=new Date(2021,10,t+1);return this.i18nStore?.t(`calendar.daysNarrow.${n.getDay()}`)}),r=new Date;r.setHours(0,0,0,0);let i=this.i18nStore?.t(`calendar.months.${this.month}`);return n`
            ${this.showTitle?n`<div class="year-month-title">${i}</div>`:``}
            <div class="mini-grid">
                ${t.map(e=>n`<div class="mini-day-name">${e}</div>`)}
                ${e.map(e=>{let t=e.getMonth()!==this.month,i=e.getTime()===r.getTime(),a=this.hasEventsForDate(e),o=e.getDay()===0||e.getDay()===6;return n`
                        <div 
                            class="mini-day ${i?`today`:``} ${a?`has-event`:``} ${o?`weekend`:``}" 
                            style="${t?`opacity: 0.3`:``}"
                            @click=${()=>this.handleDateClick(e)}
                        >
                            <span class="day-num">${e.getDate()}</span>
                        </div>
                    `})}
            </div>
        `}};k([h({context:S})],Bn.prototype,`i18nStore`,void 0),k([o({type:Number})],Bn.prototype,`year`,void 0),k([o({type:Number})],Bn.prototype,`month`,void 0),k([o({type:Array})],Bn.prototype,`events`,void 0),k([o({type:Boolean})],Bn.prototype,`showTitle`,void 0),k([o({type:Object})],Bn.prototype,`currentDate`,void 0),Bn=k([p(`calendar-mini-month`)],Bn);var Vn=class extends d{static{this.styles=g`
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

        .people {
            list-style: none;
            margin: 0;
            padding: 0;
            font-size: 13px;
            color: var(--text-primary, #111827);
        }

        .people li {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            line-height: 1.6;
        }

        .people .status {
            color: var(--text-muted, #9ca3af);
            white-space: nowrap;
        }

        .answers {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 4px;
        }

        .answers alps-button {
            --btn-padding: 4px 10px;
            --btn-font-size: 12px;
        }
    `}formatEventDate(e){let t=e.start,n=Mt(e),r;return r=n?new Date(t.split(`T`)[0]+`T00:00:00`):new Date(t),`${this.i18nStore?.t(`calendar.days.${r.getDay()}`)}, ${this.i18nStore?.t(`calendar.monthsShort.${r.getMonth()}`)} ${r.getDate()}, ${r.getFullYear()}`}formatEventTimeRange(e){let t=new Date(e.start),n=new Date(e.end);if(Mt(e))return this.i18nStore?.t(`calendar.allDay`);let r={hour:`numeric`,minute:`2-digit`};return t.toDateString()===n.toDateString()?`${t.toLocaleTimeString(void 0,r)} - ${n.toLocaleTimeString(void 0,r)}`:`${t.toLocaleTimeString(void 0,r)} - ${this.i18nStore?.t(`calendar.monthsShort.${n.getMonth()}`)} ${n.getDate()} ${n.toLocaleTimeString(void 0,r)}`}handleEdit(e){e.stopPropagation();let t=this.closest(`alps-popup`);t&&t.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`edit-event`,{detail:{event:this.event},bubbles:!0,composed:!0}))},10)}handleDelete(e){e.stopPropagation();let t=this.closest(`alps-popup`);t&&t.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`delete-event`,{detail:{event:this.event},bubbles:!0,composed:!0}))},10)}handleComplete(e){e.stopPropagation();let t=this.closest(`alps-popup`);t&&t.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`complete-task`,{detail:{task:this.event.task},bubbles:!0,composed:!0}))},10)}handleRespond(e,t){e.stopPropagation();let n=this.closest(`alps-popup`);n&&n.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`respond-event`,{detail:{event:this.event,status:t},bubbles:!0,composed:!0}))},10)}answerable(e){return!e.ended&&new Date(e.end)>new Date}renderMeeting(e){if(!e.organizer&&!e.attendees?.length)return``;let t=e=>this.i18nStore?.t(e),r=e=>e.name||e.email,i=(r,i)=>n`
            <alps-button
                class="answer-${r}"
                variant=${e.status===r?`primary`:`normal`}
                aria-pressed=${e.status===r?`true`:`false`}
                @click=${e=>this.handleRespond(e,r)}
            >${t(i)}</alps-button>
        `;return n`
            <div class="card meeting">
                ${e.organizer?n`
                    <div class="card-label">${t(`invitations.organizer`)}</div>
                    <div class="description-text">${r(e.organizer)}</div>
                `:``}
                ${e.attendees?.length?n`
                    <div class="card-label">${t(`invitations.guests`)}</div>
                    <ul class="people">
                        ${e.attendees.map(e=>n`<li><span>${r(e)}</span><span class="status">${t(`invitations.statuses.${Nn(e.status)}`)}</span></li>`)}
                    </ul>
                `:``}
                ${e.role===`attendee`?n`
                    <div class="card-label">${t(`invitations.yourAnswer`)}</div>
                    ${this.answerable(e)?n`
                        <div class="answers">
                            ${i(`accepted`,`invitations.accept`)}
                            ${i(`tentative`,`invitations.maybe`)}
                            ${i(`declined`,`invitations.decline`)}
                        </div>
                    `:n`<div class="description-text answer-status">${t(`invitations.statuses.${Nn(e.status)}`)}</div>`}
                `:``}
            </div>
        `}renderTask(e){let t=this.event,r=pt(e);return n`
            <div class="header">
                <div class="title-container">
                    <div class="color-dot" style="background-color: ${t.color||`var(--accent-color, #2563eb)`}"></div>
                    <h3 class="title">${e.title||this.i18nStore?.t(`tasks.untitled`)}</h3>
                </div>
                <div style="display: flex; gap: 4px;">
                    <alps-icon-btn class="complete-btn" icon="checkCircle" title=${this.i18nStore?.t(`tasks.markDone`)} @click=${this.handleComplete}></alps-icon-btn>
                    <alps-icon-btn class="edit-btn" icon="pen" title=${this.i18nStore?.t(`tasks.editTask`)} @click=${this.handleEdit}></alps-icon-btn>
                    <alps-icon-btn class="delete-btn" icon="trash" title=${this.i18nStore?.t(`tasks.deleteTask`)} @click=${this.handleDelete} style="color: var(--error, #ef4444);"></alps-icon-btn>
                </div>
            </div>

            <div class="card">
                <div class="card-label">${this.i18nStore?.t(`tasks.due`)}</div>
                <div class="date-primary">${this.formatEventDate(t)}</div>
                ${r&&!e.allDay?n`<div class="date-secondary">${r.toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`})}</div>`:``}
            </div>

            ${e.description?n`
            <div class="card">
                <div class="card-label">${this.i18nStore?.t(`tasks.notes`)}</div>
                <div class="description-text">${e.description}</div>
            </div>`:``}
        `}render(){if(!this.event)return n``;if(this.event.task)return this.renderTask(this.event.task);let e=this.event;return n`
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
                <div class="date-primary">${this.formatEventDate(e)}</div>
                <div class="date-secondary">${this.formatEventTimeRange(e)}</div>
            </div>

            ${this.renderMeeting(e)}

            ${e.location?n`
            <div class="card">
                <div class="card-label">${this.i18nStore?.t(`calendar.location`)}</div>
                <div class="description-text">${e.location}</div>
            </div>`:``}

            ${e.description?n`
            <div class="card">
                <div class="card-label">${this.i18nStore?.t(`calendar.notes`)}</div>
                <div class="description-text">${e.description}</div>
            </div>`:``}
        `}};k([h({context:S})],Vn.prototype,`i18nStore`,void 0),k([o({type:Object})],Vn.prototype,`event`,void 0),Vn=k([p(`calendar-event-preview`)],Vn);var Hn=class extends d{constructor(...e){super(...e),this.days=[],this.events=[],this.scrolled=!1,this.now=new Date}connectedCallback(){super.connectedCallback(),this.now=new Date,this.nowTimer=window.setInterval(()=>{this.now=new Date},6e4)}disconnectedCallback(){super.disconnectedCallback(),this.nowTimer!==void 0&&(clearInterval(this.nowTimer),this.nowTimer=void 0)}static{this.styles=g`
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
        /* An invitation the user declined stays in view, so it can be taken
           back, but reads as not happening. */
        .declined {
            opacity: 0.55;
            text-decoration: line-through;
        }

        .event-chip:hover {
            opacity: 1;
        }
        /* A task's chip: outlined in its calendar's colour, marked with a check,
           so it does not read as an all-day event. Doubled to outrank the
           all-day chip's own background. */
        .event-chip.event-chip.task {
            display: flex;
            align-items: center;
            gap: 4px;
            background-color: var(--bg-primary, #ffffff);
            color: var(--text-primary, #111827);
            border: 1px solid;
            border-left-width: 3px;
            box-shadow: none;
        }
        .event-chip.task svg {
            flex-shrink: 0;
            width: 12px;
            height: 12px;
            fill: currentColor;
        }

        .now-line {
            position: absolute;
            left: 0;
            right: 0;
            border-top: 2px solid var(--error, #ef4444);
            /* Above the event popups (z-index 5), so an event cannot bury it. */
            z-index: 6;
            pointer-events: none;
        }
        .now-line::before {
            content: '';
            position: absolute;
            left: 0;
            /* The padding box starts below the 2px border, so -5px centers the
               8px dot on the line. */
            top: -5px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--error, #ef4444);
        }
    `}getEventsForDate(e,t){return this.events?this.events.filter(n=>{let r=Mt(n);if(t!==r)return!1;let i=new Date(e);i.setHours(0,0,0,0);let a=new Date(e);if(a.setHours(23,59,59,999),r){let e=n.start.split(`T`)[0],t=n.end.split(`T`)[0],r=new Date(e+`T00:00:00`),a=new Date(t+`T00:00:00`);return r<=i&&a>i}else{let e=new Date(n.start),t=new Date(n.end);return t.getTime()===i.getTime()&&e.getTime()<t.getTime()?!1:e<=a&&t>=i}}):[]}handleColumnClick(e,t){let n=e.currentTarget.getBoundingClientRect(),r=e.clientY-n.top,i=Math.floor(r/48),a=new Date(t);a.setHours(i,0,0,0),this.dispatchEvent(new CustomEvent(`create-event`,{detail:{date:a,allDay:!1},bubbles:!0,composed:!0}))}handleAllDayCellClick(e){let t=new Date(e);t.setHours(0,0,0,0),this.dispatchEvent(new CustomEvent(`create-event`,{detail:{date:t,allDay:!0},bubbles:!0,composed:!0}))}handleScroll(e){let t=e.target;this.scrolled=t.scrollTop>0}render(){let e=Array.from({length:24},(e,t)=>t),t=new Date(this.now);return t.setHours(0,0,0,0),n`
            <div class="time-grid-container">
                <div class="time-grid-scroll" @scroll=${this.handleScroll}>
                    <div class="header-wrapper ${this.scrolled?`scrolled`:``}">
                        <div class="time-grid-header">
                            <div class="time-axis-spacer"></div>
                            <div class="time-grid-days">
                                ${this.days.map(e=>{let r=e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth()&&e.getDate()===t.getDate();return n`
                                        <div class="time-grid-day-header">
                                            <span class="time-grid-day-name">${this.i18nStore?.t(`calendar.daysShort.${e.getDay()}`)}</span>
                                            <span class="time-grid-day-number ${r?`today`:``}">${e.getDate()}</span>
                                        </div>
                                    `})}
                            </div>
                        </div>

                        <div class="all-day-row">
                            <div class="all-day-label">${this.i18nStore?.t(`calendar.allDay`)?.toLowerCase()}</div>
                            <div class="all-day-content">
                                ${this.days.map(e=>n`
                                        <div class="all-day-cell" @click=${()=>this.handleAllDayCellClick(e)} style="cursor: pointer;">
                                            ${this.getEventsForDate(e,!0).map(e=>n`
                                                <alps-popup align="left" position="bottom" style="width: 100%; display: block;" @click=${e=>e.stopPropagation()}>
                                                    <div slot="trigger"
                                                        class="event-chip ${e.task?`task`:``} ${e.status===`declined`?`declined`:``}" 
                                                        style=${e.task?`border-color: ${e.color}`:e.color?`background-color: ${e.color}`:``}
                                                        title="${e.summary||this.i18nStore?.t(`calendar.noTitle`)}">
                                                        ${e.task?O(`checkCircle`):``}${e.summary||this.i18nStore?.t(`calendar.noTitle`)}
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
                            ${e.map(e=>n`
                                <div class="time-label" style="top: ${e*48}px">${e.toString().padStart(2,`0`)}:00</div>
                            `)}
                        </div>
                        <div class="time-grid-columns">
                            ${this.days.map(e=>{let r=this.getEventsForDate(e,!1),i=new Date(e);i.setHours(0,0,0,0);let a=new Date(e);return a.setHours(23,59,59,999),n`
                                    <div class="time-column" @click=${t=>this.handleColumnClick(t,e)} style="cursor: pointer;">
                                        ${i.getTime()===t.getTime()?n`
                                            <div class="now-line" style="top: ${(this.now.getHours()+this.now.getMinutes()/60)*48}px"></div>
                                        `:``}
                                        ${r.map(e=>{let t=new Date(e.start),r=new Date(e.end),o=t<i?i:t,s=r>a?a:r,c=o.getHours()*48+o.getMinutes()/60*48,l=s.getHours()*48+s.getMinutes()/60*48-c;return l<20&&(l=20),c+l>1152&&(l=1152-c),n`
                                                <alps-popup 
                                                    class="time-event-popup"
                                                    align="left" position="bottom" 
                                                    style="top: ${c}px; height: ${l}px;"
                                                    @click=${e=>e.stopPropagation()}>
                                                    <div slot="trigger"
                                                        class="time-event ${e.status===`declined`?`declined`:``}" 
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
        `}};k([h({context:S})],Hn.prototype,`i18nStore`,void 0),k([o({type:Array})],Hn.prototype,`days`,void 0),k([o({type:Array})],Hn.prototype,`events`,void 0),k([a()],Hn.prototype,`scrolled`,void 0),k([a()],Hn.prototype,`now`,void 0),Hn=k([p(`calendar-time-grid`)],Hn);var Un=class extends d{constructor(...e){super(...e),this.events=[]}static{this.styles=g`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
        }
    `}render(){return n`
            <calendar-time-grid 
                .days=${[this.date]} 
                .events=${this.events}
            ></calendar-time-grid>
        `}};k([o({type:Object})],Un.prototype,`date`,void 0),k([o({type:Array})],Un.prototype,`events`,void 0),Un=k([p(`calendar-day-view`)],Un);var Wn=class extends d{constructor(...e){super(...e),this.events=[]}static{this.styles=g`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
        }
    `}getWeekDays(){let e=[],t=It(this.date);for(let n=0;n<7;n++)e.push(new Date(t)),t.setDate(t.getDate()+1);return e}render(){return n`
            <calendar-time-grid 
                .days=${this.getWeekDays()} 
                .events=${this.events}
            ></calendar-time-grid>
        `}};k([o({type:Object})],Wn.prototype,`date`,void 0),k([o({type:Array})],Wn.prototype,`events`,void 0),Wn=k([p(`calendar-week-view`)],Wn);var Gn=class extends d{constructor(...e){super(...e),this.events=[]}static{this.styles=g`
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
        /* An invitation the user declined stays in view, so it can be taken
           back, but reads as not happening. */
        .declined {
            opacity: 0.55;
            text-decoration: line-through;
        }

        .event-chip:hover {
            opacity: 1;
        }
        /* A task's chip: outlined in its calendar's colour, marked with a check,
           so it does not read as an all-day event. Doubled to outrank the
           all-day chip's own background. */
        .event-chip.event-chip.task {
            display: flex;
            align-items: center;
            gap: 4px;
            background-color: var(--bg-primary, #ffffff);
            color: var(--text-primary, #111827);
            border: 1px solid;
            border-left-width: 3px;
            box-shadow: none;
        }
        .event-chip.task svg {
            flex-shrink: 0;
            width: 12px;
            height: 12px;
            fill: currentColor;
        }
        .event-chip.all-day {
            background-color: #f59e0b;
        }
    `}getMonthGrid(){let e=this.date.getFullYear(),t=this.date.getMonth(),n=new Date(e,t,1).getDay();n===0&&(n=7);let r=1-(n-1),i=new Date(e,t+1,0).getDate(),a=Math.ceil((i+(n-1))/7)*7,o=[];for(let n=0;n<a;n++)o.push(new Date(e,t,r+n));return o}getEventsForDate(e,t){return this.events?this.events.filter(n=>{let r=Mt(n);if(t!==r)return!1;let i=new Date(e);i.setHours(0,0,0,0);let a=new Date(e);if(a.setHours(23,59,59,999),r){let e=n.start.split(`T`)[0],t=n.end.split(`T`)[0],r=new Date(e+`T00:00:00`),a=new Date(t+`T00:00:00`);return r<=i&&a>i}else{let e=new Date(n.start),t=new Date(n.end);return t.getTime()===i.getTime()&&e.getTime()<t.getTime()?!1:e<=a&&t>=i}}):[]}handleCellClick(e){this.dispatchEvent(new CustomEvent(`create-event`,{detail:{date:e,allDay:!0},bubbles:!0,composed:!0}))}render(){let e=this.getMonthGrid(),t=Array.from({length:7},(e,t)=>{let n=new Date(2021,10,t+1);return this.i18nStore?.t(`calendar.daysShort.${n.getDay()}`)}),r=new Date;return r.setHours(0,0,0,0),n`
            <div class="month-view">
                <div class="month-header">
                    ${t.map(e=>n`<div class="month-header-cell">${e}</div>`)}
                </div>
                <div class="month-grid">
                    ${e.map(e=>{let t=e.getMonth()!==this.date.getMonth(),i=e.getTime()===r.getTime(),a=this.getEventsForDate(e,!0).concat(this.getEventsForDate(e,!1));return n`
                            <div class="month-cell ${t?`other-month`:``}" @click=${()=>this.handleCellClick(e)} style="cursor: pointer;">
                                <div class="date-number ${i?`today`:``}">${e.getDate()}</div>
                                ${a.slice(0,4).map(e=>n`
                                    <alps-popup align="left" position="bottom" style="width: 100%; display: block;" @click=${e=>e.stopPropagation()}>
                                        <div slot="trigger"
                                            class="event-chip ${Mt(e)?`all-day`:``} ${e.task?`task`:``} ${e.status===`declined`?`declined`:``}" 
                                            style=${e.task?`border-color: ${e.color}`:e.color?`background-color: ${e.color}`:``}
                                            title="${e.summary||this.i18nStore?.t(`calendar.noTitle`)}">
                                            ${e.task?O(`checkCircle`):``}${e.summary||this.i18nStore?.t(`calendar.noTitle`)}
                                        </div>
                                        <calendar-event-preview .event=${e}></calendar-event-preview>
                                    </alps-popup>
                                `)}
                                ${a.length>4?n`<div style="font-size: 11px; color: var(--text-muted); padding-left: 4px;">${this.i18nStore?.t(`calendar.moreEvents`,{count:a.length-4})}</div>`:``}
                            </div>
                        `})}
                </div>
            </div>
        `}};k([h({context:S})],Gn.prototype,`i18nStore`,void 0),k([o({type:Object})],Gn.prototype,`date`,void 0),k([o({type:Array})],Gn.prototype,`events`,void 0),Gn=k([p(`calendar-month-view`)],Gn);var Kn=class extends d{constructor(...e){super(...e),this.events=[]}static{this.styles=g`
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
    `}render(){return n`
            <div class="year-view">
                ${Array.from({length:12},(e,t)=>t).map(e=>n`
                    <calendar-mini-month 
                        .year=${this.year} 
                        .month=${e} 
                        .events=${this.events}
                        .showTitle=${!0}
                    ></calendar-mini-month>
                `)}
            </div>
        `}};k([o({type:Number})],Kn.prototype,`year`,void 0),k([o({type:Array})],Kn.prototype,`events`,void 0),Kn=k([p(`calendar-year-view`)],Kn);var qn=class extends d{constructor(...e){super(...e),this.events=[]}static{this.styles=g`
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

        /* An invitation the user declined stays in view, so it can be taken
           back, but reads as not happening. */
        .event-item.declined .event-title {
            opacity: 0.55;
            text-decoration: line-through;
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
    `}render(){return this.events.length===0?n`
                <div class="list-container">
                    <div class="no-results">${this.i18nStore?.t(`calendar.noResults`)}</div>
                </div>
            `:n`
            <div class="list-container">
                ${[...this.events].sort((e,t)=>new Date(e.start).getTime()-new Date(t.start).getTime()).map(e=>{let t=Mt(e),r=t?new Date(e.start.split(`T`)[0]+`T00:00:00`):new Date(e.start);return n`
                        <alps-popup align="left" position="bottom" style="width: 100%; display: block;" @click=${e=>e.stopPropagation()}>
                            <div slot="trigger" class="event-item ${e.status===`declined`?`declined`:``}">
                                <div class="event-date">
                                    <span class="date-day">${r.getDate()}</span>
                                    <span class="date-month">${this.i18nStore?.t(`calendar.monthsShort.${r.getMonth()}`)} ${r.getFullYear()}</span>
                                    <span class="date-time">
                                        ${t?this.i18nStore?.t(`calendar.allDay`):r.toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`})}
                                    </span>
                                </div>
                                <div class="event-details">
                                    <h3 class="event-title">
                                        <div class="color-dot" style="background-color: ${e.color||`#2563eb`}"></div>
                                        ${e.summary||this.i18nStore?.t(`calendar.noTitle`)}
                                    </h3>
                                    ${e.location?n`
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
        `}};k([h({context:S})],qn.prototype,`i18nStore`,void 0),k([o({type:Array})],qn.prototype,`events`,void 0),qn=k([p(`calendar-list-view`)],qn);var Jn=class extends d{constructor(...e){super(...e),this.selectedDate=new Date,this.events=[],this.viewDate=new Date}static{this.styles=g`
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
    `}updated(e){e.has(`selectedDate`)&&this.selectedDate&&(this.viewDate=new Date(this.selectedDate))}changeMonth(e){this.viewDate=new Date(this.viewDate.getFullYear(),this.viewDate.getMonth()+e,1)}render(){let e=this.viewDate.getFullYear(),t=this.viewDate.getMonth();return n`
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
        `}};k([h({context:S})],Jn.prototype,`i18nStore`,void 0),k([o({type:Object})],Jn.prototype,`selectedDate`,void 0),k([o({type:Array})],Jn.prototype,`events`,void 0),k([a()],Jn.prototype,`viewDate`,void 0),Jn=k([p(`alps-sidebar-calendar`)],Jn);var Yn=class extends d{constructor(...e){super(...e),this._handleI18nChange=()=>this.requestUpdate(),this.label=`Today`}static{this.styles=g`
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
    `}handlePrevious(){this.dispatchEvent(new CustomEvent(`previous`,{bubbles:!0,composed:!0}))}handleNext(){this.dispatchEvent(new CustomEvent(`next`,{bubbles:!0,composed:!0}))}handleCenter(){this.dispatchEvent(new CustomEvent(`center`,{bubbles:!0,composed:!0}))}connectedCallback(){super.connectedCallback(),this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}render(){return n`
            <div class="nav-buttons">
                <button @click=${this.handlePrevious} aria-label=${this.i18nStore?.t(`general.previous`)||`Previous`}>
                    ${O(`caretLeft`)}
                </button>
                <button @click=${this.handleCenter}>
                    ${this.label}
                </button>
                <button @click=${this.handleNext} aria-label=${this.i18nStore?.t(`general.next`)||`Next`}>
                    ${O(`caretRight`)}
                </button>
            </div>
        `}};k([h({context:S})],Yn.prototype,`i18nStore`,void 0),k([o({type:String})],Yn.prototype,`label`,void 0),Yn=k([p(`alps-nav-buttons`)],Yn);var Xn=class extends d{constructor(...e){super(...e),this.title=`Prompt`,this.fields=[],this.confirmText=``,this.cancelText=``,this.busy=!1,this.values={},this.seededFrom=null,this.submitted=!1}static{this.styles=[bn,g`
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
    `]}willUpdate(e){if(e.has(`fields`)){let e=this.fields.map(e=>`${e.id}\u0000${e.value??``}`).join(``);if(e!==this.seededFrom){this.seededFrom=e;let t={};for(let e of this.fields)t[e.id]=e.value||``;this.values=t}}}firstUpdated(){setTimeout(()=>{let e=this.shadowRoot?.querySelector(`alps-input[autofocus]`);if(e&&typeof e.focus==`function`)e.focus();else{let e=this.shadowRoot?.querySelector(`alps-input`);e&&typeof e.focus==`function`&&e.focus()}},50)}_handleInput(e,t){let n=e.target;this.values={...this.values,[t]:n.value}}_handleKeyDown(e){e.key===`Enter`&&(e.preventDefault(),this._handleSubmit())}_handleCancel(){this.busy||this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}_handleSubmit(){this.busy||this.submitted||(this.submitted=!0,this.dispatchEvent(new CustomEvent(`submit`,{detail:this.values,bubbles:!0,composed:!0})))}updated(e){e.has(`busy`)&&!this.busy&&(this.submitted=!1)}render(){return n`
      <ui-modal 
        .title=${this.title}
        .dismissible=${!this.busy}
        @cancel=${this._handleCancel}>
        
        <div class="prompt-form">
          ${this.fields.map(e=>n`
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
        
        <alps-button slot="actions" variant="text" ?disabled=${this.busy} @click=${this._handleCancel}>${this.cancelText||this.i18nStore?.t(`general.cancel`)||`Cancel`}</alps-button>
        <alps-button slot="actions" variant="normal" ?disabled=${this.busy||this.submitted} @click=${this._handleSubmit}>${this.confirmText||this.i18nStore?.t(`general.save`)||`Save`}</alps-button>
      </ui-modal>
    `}};k([h({context:S})],Xn.prototype,`i18nStore`,void 0),k([o({type:String})],Xn.prototype,`title`,void 0),k([o({type:Array})],Xn.prototype,`fields`,void 0),k([o({type:String})],Xn.prototype,`confirmText`,void 0),k([o({type:String})],Xn.prototype,`cancelText`,void 0),k([o({type:Boolean})],Xn.prototype,`busy`,void 0),k([a()],Xn.prototype,`values`,void 0),k([a()],Xn.prototype,`submitted`,void 0),Xn=k([p(`ui-prompt`)],Xn);var Zn=250,Qn=150,$n=500,er=120,tr=`alps.calendar.showTasks`;function nr(){try{return localStorage.getItem(tr)!==`false`}catch{return!0}}function rr(e){try{localStorage.setItem(tr,String(e))}catch{}}var P=class extends d{constructor(...e){super(...e),this.calendars=[],this.events=[],this.currentDate=new Date,this.viewMode=`month`,this.loading=!0,this.isSpinning=!1,this.modalOpen=!1,this.activeCalendars=new Set,this.showTasks=nr(),this.taskModalOpen=!1,this.searchQuery=``,this.sidebarWidth=250,this.sidebarCollapsed=!1,this.isSidebarHovered=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.promptOpen=!1,this.promptFields=[{id:`name`,label:`Calendar Name`,autofocus:!0}],this.syncIntervalTimer=null,this.promptMode=null,this.promptTarget=null,this.calendarToDelete=null,this.eventToDelete=null,this.scheduling=`email`,this.activeKebabMenu=null,this.hoverTimeout=null,this.suppressSidebarHover=!1,this.isSidebarDragging=!1,this._handleSettingsChange=()=>{if(this.settingsStore){let e=this.settingsStore.getState();if(this.sidebarCollapsed=e.sidebarCollapsed,this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null),e.checkMailInterval&&e.checkMailInterval>0){let t=e.checkMailInterval*60*1e3;this.syncIntervalTimer=setInterval(()=>{this.fetchData()},t)}}},this.handleHashChange=()=>{this.parseHash()&&this.fetchData()},this.handleResize=()=>{this.isMobile=window.innerWidth<=768},this.handleSpinIteration=()=>{this.loading||(this.isSpinning=!1)}}static{this.styles=[hn,En,g`
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
    `]}async connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this.handleResize),window.addEventListener(`hashchange`,this.handleHashChange),this.settingsStore&&(this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._handleSettingsChange()),this.parseHash(),await this.fetchData()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this.handleResize),window.removeEventListener(`hashchange`,this.handleHashChange),this.settingsStore&&this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null)}reportFailure(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(e),duration:5e3}}))}parseHash(){let e=window.location.hash;if(!e.startsWith(`#/calendar`))return!1;let[t,n]=e.substring(1).split(`?`),r=t.split(`/`),i=!1;if(r.length>=3){let e=r[2];[`day`,`week`,`month`,`year`].includes(e)&&this.viewMode!==e&&(this.viewMode=e,i=!0)}if(r.length>=4){let e=r[3],t=new Date(this.currentDate);if(this.viewMode===`year`){let n=parseInt(e,10);isNaN(n)||t.setFullYear(n)}else if(this.viewMode===`month`){let[n,r]=e.split(`-`);n&&r&&(t=new Date(parseInt(n,10),parseInt(r,10)-1,1))}else{let[n,r,i]=e.split(`-`);n&&r&&i&&(t=new Date(parseInt(n,10),parseInt(r,10)-1,parseInt(i,10)))}(t.getFullYear()!==this.currentDate.getFullYear()||t.getMonth()!==this.currentDate.getMonth()||t.getDate()!==this.currentDate.getDate())&&(this.currentDate=t,i=!0)}let a=``;return n&&(a=new URLSearchParams(`?`+n).get(`q`)||``),this.searchQuery!==a&&(this.searchQuery=a,i=!0),t===`/calendar`||t===`/calendar/`?(this.navigate(this.viewMode,this.currentDate,this.searchQuery),!1):i}navigate(e,t,n=``){let r=t.getFullYear(),i=String(t.getMonth()+1).padStart(2,`0`),a=String(t.getDate()).padStart(2,`0`),o=`#/calendar/${e}`;e===`year`?o+=`/${r}`:e===`month`?o+=`/${r}-${i}`:o+=`/${r}-${i}-${a}`,n&&(o+=`?q=${encodeURIComponent(n)}`),window.location.hash===o?this.fetchData():window.location.hash=o}handleSidebarMouseEnter(){this.sidebarCollapsed&&!this.isSidebarDragging&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=setTimeout(()=>{this.isSidebarHovered=!0,this.suppressSidebarHover=!1},300))}handleSidebarMouseLeave(){this.sidebarCollapsed&&(clearTimeout(this.hoverTimeout),this.isSidebarHovered=!1)}async fetchData(){this.loading=!0,this.isSpinning=!0;let e=this.showTasks&&!this.searchQuery?wt.fetchTasks(`active`).catch(e=>(console.error(`Failed to load tasks for the calendar`,e),this.reportFailure(`tasks.loadFailed`),null)):Promise.resolve(null);try{let t=await Lt.fetchCalendars();this.scheduling=t.scheduling===`server`?`server`:`email`;let n,r,i=this.currentDate.getFullYear(),a=this.currentDate.getMonth();this.viewMode===`year`?(n=new Date(i,0,1),r=new Date(i+1,0,1)):this.viewMode===`month`?(n=new Date(i,a,1),r=new Date(i,a+1,0),n.setDate(n.getDate()-14),r.setDate(r.getDate()+14)):this.viewMode===`week`?(n=It(this.currentDate),r=new Date(n),r.setDate(n.getDate()+7)):(n=new Date(this.currentDate),n.setHours(0,0,0,0),r=new Date(this.currentDate),r.setHours(23,59,59,999));let o=(await Lt.fetchEvents(n,r,this.searchQuery)).events||[],s=[];for(let e of o)if(e.rrule)try{let t=new Date(e.start),i=new Date(e.end).getTime()-t.getTime(),a=ne.parseString(e.rrule);a.dtstart=t;let o=new ne(a).between(n,r,!0);for(let t of o)s.push({...e,start:t.toISOString(),end:new Date(t.getTime()+i).toISOString()})}catch(t){console.error(`Failed to parse rrule for event`,e.uid,t),s.push(e)}else s.push(e);let c=(await e)?.tasks??[];this.events=[...s,...Ft(c)].map(e=>({...e,color:e.color||jt(e.calendarPath||e.path)})),this.calendars=t.calendars.filter(Tt).map(e=>({...e,color:e.color||jt(e.path)})),this.activeCalendars.size===0&&this.calendars.length>0&&(this.activeCalendars=new Set(this.calendars.map(e=>e.path)))}catch(e){console.error(e),this.reportFailure(`calendar.loadFailed`)}finally{this.loading=!1}}changeDate(e,t){let n=new Date(this.currentDate),r=t||this.viewMode;if(r===`year`||r===`month`){let t=r===`year`?e*12:e,i=new Date(n.getFullYear(),n.getMonth()+t+1,0).getDate();n=new Date(n.getFullYear(),n.getMonth()+t,Math.min(n.getDate(),i))}else r===`week`?n.setDate(n.getDate()+e*7):n.setDate(n.getDate()+e);this.navigate(r,n)}openCreateModal(e,t){this.selectedEvent=void 0,this.initialDate=e,this.initialAllDay=t,this.modalOpen=!0}openEditModal(e){if(e.task){this.editingTask=e.task,this.taskModalOpen=!0;return}this.selectedEvent=e,this.initialDate=void 0,this.initialAllDay=void 0,this.modalOpen=!0}handleModalClose(){this.modalOpen=!1,this.selectedEvent=void 0,this.initialDate=void 0,this.initialAllDay=void 0}async handleModalSaved(){this.modalOpen=!1,this.selectedEvent=void 0,this.initialDate=void 0,this.initialAllDay=void 0,await this.fetchData()}viewShows(e){let t=this.currentDate;if(this.viewMode===`year`)return e.getFullYear()===t.getFullYear();if(this.viewMode===`month`)return e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth();if(this.viewMode===`week`){let n=It(t),r=new Date(n);return r.setDate(n.getDate()+7),e>=n&&e<r}return e.toDateString()===t.toDateString()}dayForViewSwitch(e){if(e===`day`||e===`week`){let e=new Date;if(this.viewShows(e))return e}return this.currentDate}goToToday(){this.navigate(`day`,new Date)}setViewMode(e){this.navigate(e,this.dayForViewSwitch(e))}handleDateSelected(e){this.navigate(`day`,e)}handleAddCalendar(){this.promptFields=[{id:`name`,label:this.i18nStore?.t(`calendar.calendarName`),autofocus:!0}],this.promptMode=`add`,this.promptOpen=!0}handleRenameCalendar(e){this.promptFields=[{id:`name`,label:this.i18nStore?.t(`calendar.calendarName`),value:e.name,autofocus:!0}],this.promptMode=`rename`,this.promptTarget=e,this.promptOpen=!0}handleDeleteCalendar(e){this.calendarToDelete=e}async _executeDeleteCalendar(){if(!this.calendarToDelete)return;let e=this.calendarToDelete;this.calendarToDelete=null;try{if(await Lt.deleteCalendar(e.path),this.calendars=this.calendars.filter(t=>t.path!==e.path),this.activeCalendars.has(e.path)){let t=new Set(this.activeCalendars);t.delete(e.path),this.activeCalendars=t,await this.fetchData()}}catch(e){console.error(`Failed to delete calendar`,e),this.reportFailure(`calendar.deleteCalendarFailed`)}}async _executeDeleteEvent(e=!0){if(!this.eventToDelete)return;let t=this.eventToDelete;this.eventToDelete=null;try{t.task?(await wt.deleteTask(t.task.path,{notify:e,lang:this.i18nStore?.getLanguage?.()}))?.sendFailed&&this.reportFailure(`invitations.notTold`):(await Lt.deleteEvent(t.path,{notify:e,lang:this.i18nStore?.getLanguage?.()}))?.sendFailed&&this.reportFailure(`invitations.notTold`),await this.fetchData()}catch(e){console.error(`Failed to delete event`,e),this.reportFailure(t.task?`tasks.deleteFailed`:`calendar.deleteEventFailed`)}}isShown(e){return e.task?this.showTasks&&(!this.calendars.some(t=>t.path===e.calendarPath)||this.activeCalendars.has(e.calendarPath)):this.activeCalendars.has(e.calendarPath)}toggleTasks(){this.showTasks=!this.showTasks,rr(this.showTasks),this.fetchData()}async respondToEvent(e,t){try{(await Lt.respondToEvent(e,t,this.i18nStore?.getLanguage?.())).sendFailed&&this.reportFailure(`invitations.sendFailed`),await this.fetchData()}catch(e){console.error(`Failed to answer the invitation`,e);let t=st(e);this.reportFailure(t?`invitations.changedElsewhere`:`invitations.answerFailed`),t&&await this.fetchData()}}async completeTask(e){try{(await wt.completeTask(e.path,!0,this.i18nStore?.getLanguage?.()))?.sendFailed&&this.reportFailure(`invitations.notTold`),await this.fetchData()}catch(e){console.error(`Failed to update task`,e),this.reportFailure(`tasks.completeFailed`)}}closeTaskModal(){this.taskModalOpen=!1,this.editingTask=void 0}toggleCalendar(e){let t=new Set(this.activeCalendars);t.has(e)?t.delete(e):t.add(e),this.activeCalendars=t}async handlePromptSubmit(e){this.promptOpen=!1;let t=e.detail.name;if(t)try{this.promptMode===`add`?await Lt.createCalendar(t):this.promptMode===`rename`&&this.promptTarget&&await Lt.renameCalendar(this.promptTarget.path,t),await this.fetchData()}catch(e){console.error(`Failed to save calendar`,e),this.reportFailure(`calendar.saveCalendarFailed`)}}handlePromptCancel(){this.promptOpen=!1}get username(){return this.settingsStore?.getState().loginUsername||``}render(){let e=this.i18nStore?.t(`calendar.months.${this.currentDate.getMonth()}`),t=this.currentDate.getFullYear(),r=``;r=this.searchQuery?this.i18nStore?.t(`calendar.searchResults`):this.viewMode===`year`?t.toString():this.viewMode===`day`?`${this.currentDate.getDate()} ${e}`:e;let i=this.events.filter(e=>this.isShown(e));return n`
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
                        @sidebar-resize=${e=>{let t=e.detail.newWidth;t<er?(this.sidebarCollapsed||(this.sidebarCollapsed=!0,this.settingsStore&&this.settingsStore.updateSettings({sidebarCollapsed:!0})),this.sidebarWidth=Zn):(this.sidebarCollapsed&&(this.sidebarCollapsed=!1,this.settingsStore&&this.settingsStore.updateSettings({sidebarCollapsed:!1})),this.sidebarWidth=Math.min(Math.max(t,Qn),$n))}}
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
                                    ${this.calendars.map(e=>n`
                                        <div class="calendar-item" @click=${()=>this.toggleCalendar(e.path)}>
                                            <div class="calendar-checkbox ${this.activeCalendars.has(e.path)?`checked`:``}" style="--cal-color: ${e.color}">
                                                ${this.activeCalendars.has(e.path)?O(`check`):``}
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
                                                        ${O(`pen`)} <span class="item-text">${this.i18nStore?.t(`calendar.rename`)}</span>
                                                    </button>
                                                    ${this.calendars.length>1&&!(e.path===`default`||e.path.endsWith(`/default`)||e.path.endsWith(`/default/`))?n`
                                                        <button class="dropdown-item text-danger" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.handleDeleteCalendar(e)}}>
                                                            ${O(`trash`)} <span class="item-text">${this.i18nStore?.t(`calendar.delete`)}</span>
                                                        </button>
                                                    `:``}
                                                </alps-popup>
                                            </div>
                                        </div>
                                    `)}
                                    <div class="calendar-item tasks-toggle" @click=${this.toggleTasks}>
                                        <div class="calendar-checkbox ${this.showTasks?`checked`:``}" style="--cal-color: var(--text-secondary, #4b5563)">
                                            ${this.showTasks?O(`check`):``}
                                        </div>
                                        <span>${this.i18nStore?.t(`tasks.title`)}</span>
                                    </div>
                                </div>

                                <alps-sidebar-calendar
                                    .selectedDate=${this.currentDate}
                                    .events=${i}
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
                            <h2>${r} <span class="sub-title">${this.viewMode===`year`?``:t}</span></h2>
                        </div>
                        ${this.isMobile?``:n`
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
                                @center=${()=>this.goToToday()}
                                @next=${()=>this.changeDate(1)}
                            ></alps-nav-buttons>
                        </div>
                    </div>

                    <div class="calendar-body" @complete-task=${e=>void this.completeTask(e.detail.task)} @respond-event=${e=>void this.respondToEvent(e.detail.event,e.detail.status)}>
                        ${this.searchQuery?n`
                            <calendar-list-view
                                .events=${i}
                                @edit-event=${e=>this.openEditModal(e.detail.event)}
                                @delete-event=${e=>this.eventToDelete=e.detail.event}
                            ></calendar-list-view>
                        `:n`
                            ${this.viewMode===`year`?n`
                                <calendar-year-view 
                                .year=${t} 
                                .events=${i}
                                @date-selected=${e=>this.handleDateSelected(e.detail.date)}
                            ></calendar-year-view>
                        `:``}
                        ${this.viewMode===`month`?n`
                            <calendar-month-view 
                                .date=${this.currentDate} 
                                .events=${i}
                                @create-event=${e=>this.openCreateModal(e.detail.date,e.detail.allDay)}
                                @edit-event=${e=>this.openEditModal(e.detail.event)}
                                @delete-event=${e=>this.eventToDelete=e.detail.event}
                            ></calendar-month-view>
                        `:``}
                        ${this.viewMode===`week`?n`
                            <calendar-week-view 
                                .date=${this.currentDate} 
                                .events=${i}
                                @create-event=${e=>this.openCreateModal(e.detail.date,e.detail.allDay)}
                                @edit-event=${e=>this.openEditModal(e.detail.event)}
                                @delete-event=${e=>this.eventToDelete=e.detail.event}
                            ></calendar-week-view>
                        `:``}
                            ${this.viewMode===`day`?n`
                                <calendar-day-view 
                                    .date=${this.currentDate} 
                                    .events=${i}
                                    @create-event=${e=>this.openCreateModal(e.detail.date,e.detail.allDay)}
                                    @edit-event=${e=>this.openEditModal(e.detail.event)}
                                    @delete-event=${e=>this.eventToDelete=e.detail.event}
                                ></calendar-day-view>
                            `:``}
                        `}
                    </div>
                    ${this.isMobile?n`
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

            <task-modal
                .open=${this.taskModalOpen}
                .task=${this.editingTask}
                .scheduling=${this.scheduling}
                @close=${this.closeTaskModal}
                @saved=${()=>{this.closeTaskModal(),this.fetchData()}}
                @conflict=${this.fetchData}
                @delete=${e=>{this.closeTaskModal(),this.eventToDelete={...e.detail.task,task:e.detail.task}}}
            ></task-modal>

            <calendar-event-modal
                .open=${this.modalOpen}
                .event=${this.selectedEvent}
                .initialDate=${this.initialDate}
                .initialAllDay=${this.initialAllDay}
                .calendars=${this.calendars}
                @close=${this.handleModalClose}
                @saved=${this.handleModalSaved}
                @conflict=${this.fetchData}
            ></calendar-event-modal>

            ${this.promptOpen?n`
                <ui-prompt 
                    title="${this.promptMode===`add`?this.i18nStore?.t(`calendar.addCalendar`):this.i18nStore?.t(`calendar.renameCalendar`)}" 
                    .fields=${this.promptFields}
                    @submit=${this.handlePromptSubmit} 
                    @cancel=${this.handlePromptCancel}
                ></ui-prompt>
            `:``}

            ${this.calendarToDelete?n`
                <ui-confirm
                    title="${this.i18nStore?.t(`calendar.deleteCalendar`)}"
                    message="Are you sure you want to delete the calendar &quot;${this.calendarToDelete.name}&quot;?"
                    confirmText="${this.i18nStore?.t(`calendar.delete`)}"
                    isDanger
                    @confirm=${this._executeDeleteCalendar}
                    @cancel=${()=>this.calendarToDelete=null}
                ></ui-confirm>
            `:``}

            ${this.eventToDelete&&(this.eventToDelete.task?Ot(this.eventToDelete.task,this.scheduling):kt(this.eventToDelete,this.scheduling))?n`
                <ui-confirm
                    class="delete-meeting"
                    title="${this.i18nStore?.t(this.eventToDelete.task?`tasks.deleteTask`:`calendar.deleteEvent`)}"
                    message="${this.i18nStore?.t(this.eventToDelete.task?this.eventToDelete.task.role===`organizer`?`tasks.deleteTellAssignees`:`tasks.deleteTellAssigner`:this.eventToDelete.role===`organizer`?`invitations.deleteTellGuests`:`invitations.deleteTellOrganizer`)}"
                    confirmText="${this.i18nStore?.t(`invitations.deleteAndTell`)}"
                    secondaryText="${this.i18nStore?.t(`invitations.deleteOnly`)}"
                    isDanger
                    @confirm=${()=>this._executeDeleteEvent(!0)}
                    @secondary=${()=>this._executeDeleteEvent(!1)}
                    @cancel=${()=>this.eventToDelete=null}
                ></ui-confirm>
            `:this.eventToDelete?n`
                <ui-confirm
                    title="${this.i18nStore?.t(`calendar.deleteEvent`)}"
                    message="Are you sure you want to delete this event?"
                    confirmText="${this.i18nStore?.t(`calendar.delete`)}"
                    isDanger
                    @confirm=${()=>this._executeDeleteEvent()}
                    @cancel=${()=>this.eventToDelete=null}
                ></ui-confirm>
            `:``}
        `}};k([h({context:S})],P.prototype,`i18nStore`,void 0),k([h({context:C})],P.prototype,`settingsStore`,void 0),k([a()],P.prototype,`calendars`,void 0),k([a()],P.prototype,`events`,void 0),k([a()],P.prototype,`currentDate`,void 0),k([a()],P.prototype,`viewMode`,void 0),k([a()],P.prototype,`loading`,void 0),k([a()],P.prototype,`isSpinning`,void 0),k([a()],P.prototype,`modalOpen`,void 0),k([a()],P.prototype,`selectedEvent`,void 0),k([a()],P.prototype,`initialDate`,void 0),k([a()],P.prototype,`initialAllDay`,void 0),k([a()],P.prototype,`activeCalendars`,void 0),k([a()],P.prototype,`showTasks`,void 0),k([a()],P.prototype,`taskModalOpen`,void 0),k([a()],P.prototype,`editingTask`,void 0),k([a()],P.prototype,`searchQuery`,void 0),k([a()],P.prototype,`sidebarWidth`,void 0),k([a()],P.prototype,`sidebarCollapsed`,void 0),k([a()],P.prototype,`isSidebarHovered`,void 0),k([a()],P.prototype,`isMobile`,void 0),k([a()],P.prototype,`mobileSidebarOpen`,void 0),k([a()],P.prototype,`promptOpen`,void 0),k([a()],P.prototype,`promptFields`,void 0),k([a()],P.prototype,`promptMode`,void 0),k([a()],P.prototype,`promptTarget`,void 0),k([a()],P.prototype,`calendarToDelete`,void 0),k([a()],P.prototype,`eventToDelete`,void 0),k([a()],P.prototype,`scheduling`,void 0),k([a()],P.prototype,`activeKebabMenu`,void 0),k([a()],P.prototype,`suppressSidebarHover`,void 0),k([a()],P.prototype,`isSidebarDragging`,void 0),P=k([p(`calendar-page`)],P);var ir=class extends d{constructor(...e){super(...e),this.text=``,this.fullHeight=!1}static{this.styles=g`
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
  `}render(){return n`
      <div class="spinner">${O(`edelweiss`)}</div>
      ${this.text?n`<span>${this.text}</span>`:``}
    `}};k([o({type:String})],ir.prototype,`text`,void 0),k([o({type:Boolean,attribute:`full-height`})],ir.prototype,`fullHeight`,void 0),ir=k([p(`alps-loader`)],ir);var ar={overdue:`tasks.groups.overdue`,today:`tasks.groups.today`,week:`tasks.groups.week`,undated:`tasks.groups.undated`,later:`tasks.groups.later`,completed:`tasks.groups.completed`},or={high:`tasks.priorities.high`,medium:`tasks.priorities.medium`,low:`tasks.priorities.low`},sr={high:`!!!`,medium:`!!`,low:`!`},cr=class extends d{constructor(...e){super(...e),this.tasks=[],this.pendingPaths=new Set,this.settling=new Set,this.searching=!1,this.loading=!1,this.focusedIndex=-1}static{this.styles=g`
        :host {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
        }
        .scroll {
            flex: 1;
            overflow-y: auto;
            padding: 8px 24px 24px;
            outline: none;
        }
        .empty {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px 16px;
            color: var(--text-muted, #6b7280);
            font-size: 14px;
        }
        .group {
            margin: 16px 0 4px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--text-muted, #6b7280);
        }
        .group.overdue {
            color: var(--error, #ef4444);
        }
        .row {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 10px 8px;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            border-radius: 6px;
            cursor: pointer;
        }
        .row:hover,
        .row.focused {
            background: var(--bg-tertiary, #f3f4f6);
        }
        .check {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            margin-top: 1px;
            padding: 0;
            border: 2px solid var(--text-muted, #9ca3af);
            border-radius: 50%;
            background: transparent;
            color: #fff;
            cursor: pointer;
        }
        .check:hover {
            border-color: var(--accent-color, #2563eb);
        }
        .check:disabled {
            opacity: 0.5;
            cursor: progress;
        }
        .row.done .check {
            background: var(--accent-color, #2563eb);
            border-color: var(--accent-color, #2563eb);
        }
        .check svg {
            width: 12px;
            height: 12px;
            fill: currentColor;
        }
        .body {
            flex: 1;
            min-width: 0;
        }
        .title {
            font-size: 14px;
            color: var(--text-primary, #111827);
            overflow-wrap: anywhere;
        }
        .row.done .title,
        .row.cancelled .title {
            text-decoration: line-through;
            color: var(--text-muted, #6b7280);
        }
        .meta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            margin-top: 2px;
            font-size: 12px;
            color: var(--text-secondary, #4b5563);
        }
        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        .due.overdue {
            color: var(--error, #ef4444);
            font-weight: 500;
        }
        .repeats svg {
            display: block;
            width: 12px;
            height: 12px;
            fill: currentColor;
        }
        .priority {
            font-weight: 700;
            letter-spacing: -1px;
        }
        .priority.high {
            color: var(--error, #ef4444);
        }
        .priority.medium {
            color: #d97706;
        }
        .priority.low {
            color: var(--text-muted, #6b7280);
        }
        .chip {
            padding: 0 6px;
            border-radius: 4px;
            background: var(--bg-tertiary, #f3f4f6);
        }
        @media (max-width: 768px) {
            .scroll {
                padding: 4px 12px 16px;
            }
        }
    `}groups(){let e=this.now??new Date,t=new Map;for(let n of this.tasks){let r=this.settling.has(n.path)?ht({...n,status:`needs-action`},e):ht(n,e),i=t.get(r);i?i.push(n):t.set(r,[n])}for(let[e,n]of t)n.sort(e===`completed`?vt:_t);return mt.filter(e=>t.has(e)).map(e=>[e,t.get(e)])}toggle(e){this.pendingPaths.has(e.path)||this.dispatchEvent(new CustomEvent(`toggle-complete`,{detail:{task:e,done:e.status!==`completed`}}))}open(e){this.dispatchEvent(new CustomEvent(`open-task`,{detail:{task:e}}))}handleKeyDown(e){if(e.target!==e.currentTarget)return;let t=this.groups().flatMap(([,e])=>e);if(t.length===0)return;let n=Math.min(this.focusedIndex,t.length-1);switch(e.key){case`ArrowDown`:this.focusedIndex=Math.min(t.length-1,n+1);break;case`ArrowUp`:this.focusedIndex=Math.max(0,n-1);break;case`Home`:this.focusedIndex=0;break;case`End`:this.focusedIndex=t.length-1;break;case`Enter`:if(n<0)return;e.preventDefault(),this.open(t[n]);return;case` `:if(n<0)return;e.preventDefault(),this.toggle(t[n]);return;default:return}e.preventDefault(),this.updateComplete.then(()=>{this.renderRoot.querySelector(`.row.focused`)?.scrollIntoView?.({block:`nearest`})})}renderRow(e,t,r){let i=e=>this.i18nStore?.t(e)??e,a=e.status===`completed`,o=e.status===`cancelled`,s=yt(e.priority),c=this.now??new Date;return n`
            <div
                class="row ${a?`done`:``} ${o?`cancelled`:``} ${this.focusedIndex===t?`focused`:``}"
                @click=${()=>{this.focusedIndex=t,this.open(e)}}
            >
                <button
                    class="check"
                    role="checkbox"
                    aria-checked=${a?`true`:`false`}
                    aria-label=${i(a?`tasks.markNotDone`:`tasks.markDone`)}
                    ?disabled=${this.pendingPaths.has(e.path)}
                    @click=${t=>{t.stopPropagation(),this.toggle(e)}}
                >
                    ${a?O(`check`):``}
                </button>
                <div class="body">
                    <div class="title">${e.title||i(`tasks.untitled`)}</div>
                    <div class="meta">
                        ${e.color?n`<span class="dot" style="background: ${e.color}"></span>`:``}
                        ${o?n`<span class="chip">${i(`tasks.statuses.cancelled`)}</span>`:``}
                        ${e.due?n`<span class="due ${r===`overdue`?`overdue`:``}">${xt(e,c,i(`tasks.today`),bt(this.i18nStore?.getLanguage?.()))}</span>`:``}
                        ${e.rrule?n`<span class="repeats" role="img" aria-label=${i(`tasks.repeats`)} title=${i(`tasks.repeats`)}>${O(`arrowsClockwise`)}</span>`:``}
                        ${e.role===`attendee`&&e.organizer?n`<span class="assigned">${i(`tasks.assignedBy`)}: ${e.organizer.name||e.organizer.email}</span>`:e.role===`organizer`&&e.attendees?.length?n`<span class="assigned">${i(`tasks.assignedTo`)}: ${e.attendees.map(e=>e.name||e.email).join(`, `)}</span>`:``}
                        ${s?n`<span class="priority ${s}" role="img" aria-label=${i(or[s])} title=${i(or[s])}>${sr[s]}</span>`:``}
                    </div>
                </div>
            </div>
        `}render(){if(this.loading&&this.tasks.length===0)return n`<div class="empty"><alps-loader></alps-loader></div>`;let e=this.groups();if(e.length===0)return n`<div class="empty">${this.i18nStore?.t(this.searching?`tasks.noResults`:`tasks.noTasks`)}</div>`;let t=-1;return n`
            <div class="scroll" tabindex="0" @keydown=${this.handleKeyDown}>
                ${e.map(([e,r])=>n`
                        <div class="group ${e}">${this.i18nStore?.t(ar[e])}</div>
                        ${f(r,e=>e.path,n=>this.renderRow(n,++t,e))}
                    `)}
            </div>
        `}};k([h({context:S})],cr.prototype,`i18nStore`,void 0),k([o({type:Array})],cr.prototype,`tasks`,void 0),k([o({attribute:!1})],cr.prototype,`pendingPaths`,void 0),k([o({attribute:!1})],cr.prototype,`settling`,void 0),k([o({type:Boolean})],cr.prototype,`searching`,void 0),k([o({type:Boolean})],cr.prototype,`loading`,void 0),k([o({attribute:!1})],cr.prototype,`now`,void 0),k([a()],cr.prototype,`focusedIndex`,void 0),cr=k([p(`tasks-list`)],cr);var lr=250,ur=150,dr=500,fr=120,pr=[{id:`all`,icon:`listBullets`,label:`tasks.allTasks`},{id:`today`,icon:`calendarBlank`,label:`tasks.today`},{id:`upcoming`,icon:`calendar`,label:`tasks.upcoming`},{id:`undated`,icon:`tray`,label:`tasks.undated`},{id:`completed`,icon:`checkCircle`,label:`tasks.completed`}],F=class extends d{constructor(...e){super(...e),this.tasks=[],this.lists=[],this.selectedList=`all`,this.selectedCalendar=``,this.searchQuery=``,this.loading=!0,this.loadedScope=``,this.pendingPaths=new Set,this.settling=new Set,this.modalOpen=!1,this.taskToDelete=null,this.scheduling=`email`,this.isSpinning=!1,this.listPromptOpen=!1,this.sidebarWidth=lr,this.sidebarCollapsed=!1,this.isSidebarHovered=!1,this.suppressSidebarHover=!1,this.isSidebarDragging=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.syncTimer=null,this.readEpoch=0,this.mutationEpoch=0,this.handleSettingsChange=()=>{if(!this.settingsStore)return;let e=this.settingsStore.getState();this.sidebarCollapsed=e.sidebarCollapsed,this.syncTimer&&=(clearInterval(this.syncTimer),null),e.checkMailInterval&&e.checkMailInterval>0&&(this.syncTimer=setInterval(()=>void this.fetchTasks(),e.checkMailInterval*60*1e3))},this.handleResize=()=>{this.isMobile=window.innerWidth<=768},this.handleHashChange=()=>{this.parseHash()&&this.fetchTasks()}}static{this.styles=[hn,g`
            :host {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
            }
            .app-container.collapsed .main-content {
                position: relative;
                z-index: 25;
                border-left: 1px solid var(--border-color, #e5e7eb);
                box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
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
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .sidebar-scroll-content {
                display: flex;
                flex-direction: column;
                gap: 24px;
                height: 100%;
                padding: 16px;
                box-sizing: border-box;
                overflow-y: auto;
            }
            .sidebar-wrapper.collapsed .label,
            .sidebar-wrapper.collapsed .count,
            .sidebar-wrapper.collapsed h3,
            .sidebar-wrapper.collapsed .calendar-lists {
                display: none;
            }
            h3 {
                margin: 0 0 12px 0;
                font-size: 12px;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                color: var(--text-muted, #6b7280);
            }
            .nav-item {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                height: 36px;
                margin-bottom: 2px;
                padding: 0 8px;
                box-sizing: border-box;
                border: none;
                border-radius: 6px;
                background: transparent;
                color: var(--text-primary, #111827);
                font-family: inherit;
                font-size: 14px;
                text-align: left;
                cursor: pointer;
                user-select: none;
            }
            .nav-item:hover {
                background: var(--bg-tertiary, #f3f4f6);
            }
            .nav-item.active {
                background: var(--bg-tertiary, #f3f4f6);
                font-weight: 600;
            }
            .nav-item svg {
                flex-shrink: 0;
                width: 18px;
                height: 18px;
                fill: currentColor;
                color: var(--text-secondary, #4b5563);
            }
            .nav-item .label {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .nav-item .count {
                font-size: 12px;
                color: var(--text-muted, #6b7280);
            }
            .list-dot {
                flex-shrink: 0;
                width: 10px;
                height: 10px;
                margin: 0 4px;
                border-radius: 50%;
            }
            .main-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                background-color: var(--bg-primary, #ffffff);
            }
            .toolbar {
                display: flex;
                flex-shrink: 0;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                height: 57px;
                padding: 0 24px;
                box-sizing: border-box;
                border-bottom: 1px solid var(--border-color, #e5e7eb);
            }
            .toolbar h2 {
                margin: 0;
                overflow: hidden;
                font-size: 24px;
                font-weight: 600;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .toolbar .sub-title {
                font-weight: 300;
                color: var(--text-secondary, #4b5563);
            }
            @media (max-width: 768px) {
                .toolbar {
                    padding: 0 12px;
                }
                .toolbar h2 {
                    font-size: 18px;
                }
            }
        `]}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this.handleResize),window.addEventListener(`hashchange`,this.handleHashChange),this.settingsStore&&(this.settingsStore.addEventListener(`change`,this.handleSettingsChange),this.handleSettingsChange()),this.parseHash(),this.fetchTasks()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this.handleResize),window.removeEventListener(`hashchange`,this.handleHashChange),this.settingsStore?.removeEventListener(`change`,this.handleSettingsChange),this.syncTimer&&=(clearInterval(this.syncTimer),null),clearTimeout(this.hoverTimeout)}get wantedScope(){return this.searchQuery?`all`:St(this.selectedList)}parseHash(){let e=window.location.hash;if(!e.startsWith(`#/tasks`))return!1;let[t,n=``]=e.slice(1).split(`?`),r=t.split(`/`)[2]??``,i=new URLSearchParams(n),a=i.get(`list`)??``,o=i.get(`q`)??``;if(!pr.some(e=>e.id===r))return this.navigate(`all`,a,o),!1;let s=r;return(s!==this.selectedList||a!==this.selectedCalendar||o!==this.searchQuery)&&(this.settling=new Set),this.selectedList=s,this.selectedCalendar=a,this.searchQuery=o,this.wantedScope!==this.loadedScope}navigate(e,t=this.selectedCalendar,n=this.searchQuery){let r=new URLSearchParams;t&&r.set(`list`,t),n&&r.set(`q`,n);let i=r.toString(),a=`#/tasks/${e}${i?`?${i}`:``}`;window.location.hash!==a&&(window.location.hash=a)}async fetchTasks(){let e=++this.readEpoch,t=this.mutationEpoch,n=this.wantedScope;this.loading=!0,this.isSpinning=!0;try{let r=await wt.fetchTasks(n===`all`?void 0:n);if(e!==this.readEpoch)return;if(t!==this.mutationEpoch){this.fetchTasks();return}this.lists=r.calendars.map(e=>({...e,color:jt(e.path)})),this.tasks=r.tasks.map(e=>({...e,color:jt(e.calendarPath)})),this.loadedScope=n,this.scheduling=r.scheduling===`server`?`server`:`email`,this.settling=new Set,r.failedCalendars>0&&this.toast(`tasks.someListsFailed`)}catch(t){if(e!==this.readEpoch)return;console.error(`Failed to load tasks`,t),this.failed(`tasks.loadFailed`,t)}finally{e===this.readEpoch&&(this.loading=!1)}}shows(e,t=new Date){if(this.selectedCalendar&&e.calendarPath!==this.selectedCalendar)return!1;let n=this.searchQuery.trim().toLowerCase();return n?e.title.toLowerCase().includes(n)||(e.description??``).toLowerCase().includes(n):Ct(e,this.selectedList,t)}get visibleTasks(){let e=new Date;return this.tasks.filter(t=>this.shows(t,e)||this.settling.has(t.path))}countFor(e){if(this.loadedScope!==`all`&&this.loadedScope!==St(e))return null;let t=new Date;return this.tasks.filter(n=>(!this.selectedCalendar||n.calendarPath===this.selectedCalendar)&&Ct(n,e,t)).length}replaceTask(e,t){this.mutationEpoch++;let n={...t,color:jt(t.calendarPath)};this.tasks=this.tasks.map(t=>t.path===e?n:t)}async handleToggleComplete(e,t){if(!this.pendingPaths.has(e.path)){this.pendingPaths=new Set(this.pendingPaths).add(e.path),this.settling=new Set(this.settling).add(e.path),this.replaceTask(e.path,{...e,status:t?`completed`:`needs-action`});try{let n=await wt.completeTask(e.path,t,this.i18nStore?.getLanguage?.());this.replaceTask(e.path,n),n.sendFailed&&this.toast(`invitations.notTold`),t&&!ft(n)&&this.toast(`tasks.movedToNext`,{date:this.formatDue(n)})}catch(t){console.error(`Failed to update task`,t),this.replaceTask(e.path,e),this.failed(`tasks.completeFailed`,t)}finally{let t=new Set(this.pendingPaths);t.delete(e.path),this.pendingPaths=t}}}handleSaved(e){let{task:t,created:n}=e.detail;this.closeModal(),this.mutationEpoch++;let r={...t,color:jt(t.calendarPath)};if(this.tasks=n?[r,...this.tasks]:this.tasks.map(e=>e.path===r.path?r:e),!this.shows(r))if(n){let e=this.selectedCalendar===r.calendarPath?this.selectedCalendar:``;this.navigate(ft(r)?`completed`:`all`,e,``)}else this.settling=new Set(this.settling).add(r.path)}async confirmDelete(e=!0){let t=this.taskToDelete;if(t){this.taskToDelete=null;try{(await wt.deleteTask(t.path,{notify:e,lang:this.i18nStore?.getLanguage?.()}))?.sendFailed&&this.toast(`invitations.notTold`),this.mutationEpoch++,this.tasks=this.tasks.filter(e=>e.path!==t.path)}catch(e){console.error(`Failed to delete task`,e),this.failed(`tasks.deleteFailed`,e)}}}async handleListPromptSubmit(e){this.listPromptOpen=!1;let t=String(e.detail?.name??``).trim();if(t)try{await Lt.createCalendar(t),await this.fetchTasks()}catch(e){console.error(`Failed to create list`,e),this.failed(`tasks.createListFailed`,e)}}openCreate(){this.editingTask=void 0,this.modalOpen=!0,this.mobileSidebarOpen=!1}openEdit(e){this.editingTask=e,this.modalOpen=!0}closeModal(){this.modalOpen=!1,this.editingTask=void 0}selectList(e){this.mobileSidebarOpen=!1,this.navigate(e,this.selectedCalendar,``)}selectCalendar(e){this.mobileSidebarOpen=!1,this.navigate(this.selectedList,this.selectedCalendar===e?``:e,this.searchQuery)}formatDue(e){return xt(e,new Date,this.i18nStore?.t(`tasks.today`)??`Today`,bt(this.i18nStore?.getLanguage?.()))}failed(e,t){ct(t)||this.toast(e)}toast(e,t){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(e,t),duration:5e3}}))}handleSidebarMouseEnter(){this.sidebarCollapsed&&!this.isSidebarDragging&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=setTimeout(()=>{this.isSidebarHovered=!0,this.suppressSidebarHover=!1},300))}handleSidebarMouseLeave(){this.sidebarCollapsed&&(clearTimeout(this.hoverTimeout),this.isSidebarHovered=!1)}handleSidebarResize(e){let t=e.detail.newWidth,n=t<fr;n!==this.sidebarCollapsed&&(this.sidebarCollapsed=n,this.settingsStore?.updateSettings({sidebarCollapsed:n})),this.sidebarWidth=n?lr:Math.min(Math.max(t,ur),dr)}get username(){return this.settingsStore?.getState().loginUsername||``}render(){let e=e=>this.i18nStore?.t(e)??e,t=this.sidebarCollapsed&&(!this.isSidebarHovered||this.suppressSidebarHover)&&!this.isMobile,r=pr.find(e=>e.id===this.selectedList)??pr[0],i=this.lists.find(e=>e.path===this.selectedCalendar)?.name??``,a=this.selectedCalendar||this.lists[0]?.path||``;return n`
            <app-header
                currentTab="tasks"
                .username=${this.username}
                .isMobile=${this.isMobile}
                .searchQuery=${this.searchQuery}
                @toggle-sidebar=${()=>{this.mobileSidebarOpen=!this.mobileSidebarOpen}}
                @search-submit=${e=>this.navigate(this.selectedList,this.selectedCalendar,e.detail.value)}
            ></app-header>
            <div
                class="app-container ${this.sidebarCollapsed&&!this.isMobile?`collapsed`:``} ${this.isSidebarDragging?`dragging`:``}"
                style="${!this.sidebarCollapsed&&!this.isMobile?`--sidebar-width: ${this.sidebarWidth}px;`:``}"
            >
                <div class="layout">
                    <alps-sidebar
                        class="${this.isMobile?`mobile-sidebar`:`desktop-sidebar`} ${this.mobileSidebarOpen?`open`:``}"
                        .isMobile=${this.isMobile}
                        .isOpen=${this.mobileSidebarOpen}
                        .collapsed=${this.sidebarCollapsed&&!this.isMobile}
                        .isHovered=${this.isSidebarHovered}
                        .suppressHover=${this.suppressSidebarHover}
                        .width=${this.sidebarWidth}
                        @toggle-collapse=${()=>{this.sidebarCollapsed=!this.sidebarCollapsed,this.settingsStore?.updateSettings({sidebarCollapsed:this.sidebarCollapsed})}}
                        @sidebar-resize=${this.handleSidebarResize}
                        @drag-start=${()=>{this.isSidebarDragging=!0}}
                        @drag-end=${()=>{this.isSidebarDragging=!1}}
                        @close-sidebar=${()=>{this.mobileSidebarOpen=!1}}
                        @mouseenter=${()=>this.handleSidebarMouseEnter()}
                        @mouseleave=${()=>this.handleSidebarMouseLeave()}
                    >
                        <div class="sidebar-wrapper ${t?`collapsed`:``}">
                            <alps-toolbar class="sidebar-header">
                                <alps-create-button
                                    icon="plusBold"
                                    ?collapsed=${t}
                                    ?disabled=${this.lists.length===0}
                                    @click=${()=>this.openCreate()}
                                >${e(`tasks.addTask`)}</alps-create-button>
                            </alps-toolbar>
                            <div class="sidebar-content">
                                <div class="sidebar-scroll-content">
                                    <nav class="smart-lists">
                                        ${pr.map(t=>{let r=this.countFor(t.id);return n`
                                                <button
                                                    class="nav-item smart-list ${t.id===this.selectedList&&!this.searchQuery?`active`:``}"
                                                    data-list=${t.id}
                                                    title=${e(t.label)}
                                                    @click=${()=>this.selectList(t.id)}
                                                >
                                                    ${O(t.icon)}
                                                    <span class="label">${e(t.label)}</span>
                                                    ${r?n`<span class="count">${r}</span>`:``}
                                                </button>
                                            `})}
                                    </nav>
                                    ${this.lists.length>0?n`
                                        <div class="calendar-lists">
                                            <h3>${e(`tasks.lists`)}</h3>
                                            ${this.lists.map(e=>n`
                                                <button
                                                    class="nav-item task-list ${e.path===this.selectedCalendar?`active`:``}"
                                                    data-path=${e.path}
                                                    @click=${()=>this.selectCalendar(e.path)}
                                                >
                                                    <span class="list-dot" style="background: ${e.color}"></span>
                                                    <span class="label">${e.name}</span>
                                                </button>
                                            `)}
                                        </div>
                                    `:``}
                                </div>
                            </div>
                        </div>
                        <alps-icon-btn
                            slot="footer-actions"
                            icon="folderPlus"
                            title=${e(`tasks.newList`)}
                            @click=${()=>{this.listPromptOpen=!0}}
                        ></alps-icon-btn>
                    </alps-sidebar>

                    <div class="main-content">
                        <div class="toolbar">
                            <h2>
                                ${this.searchQuery?e(`tasks.searchResults`):e(r.label)}
                                ${i?n`<span class="sub-title">${i}</span>`:``}
                            </h2>
                            <alps-icon-btn
                                icon="arrowsClockwise"
                                title=${e(`mailboxPage.refresh`)}
                                ?spinning=${this.isSpinning}
                                @animationiteration=${()=>{this.loading||(this.isSpinning=!1)}}
                                @click=${()=>void this.fetchTasks()}
                            ></alps-icon-btn>
                        </div>
                        <tasks-list
                            .tasks=${this.visibleTasks}
                            .pendingPaths=${this.pendingPaths}
                            .settling=${this.settling}
                            ?searching=${!!this.searchQuery}
                            ?loading=${this.loading}
                            @toggle-complete=${e=>void this.handleToggleComplete(e.detail.task,e.detail.done)}
                            @open-task=${e=>this.openEdit(e.detail.task)}
                        ></tasks-list>
                    </div>
                </div>
            </div>

            <task-modal
                .open=${this.modalOpen}
                .task=${this.editingTask}
                .lists=${this.lists}
                .defaultList=${a}
                .scheduling=${this.scheduling}
                @close=${()=>this.closeModal()}
                @saved=${this.handleSaved}
                @conflict=${()=>void this.fetchTasks()}
                @delete=${e=>{this.closeModal(),this.taskToDelete=e.detail.task}}
            ></task-modal>

            ${this.listPromptOpen?n`
                <ui-prompt
                    title=${e(`tasks.newList`)}
                    .fields=${[{id:`name`,label:e(`tasks.listName`),autofocus:!0}]}
                    @submit=${this.handleListPromptSubmit}
                    @cancel=${()=>{this.listPromptOpen=!1}}
                ></ui-prompt>
            `:``}

            ${this.taskToDelete&&Ot(this.taskToDelete,this.scheduling)?n`
                <ui-confirm
                    class="delete-assigned"
                    title=${e(`tasks.deleteTask`)}
                    message=${e(this.taskToDelete.role===`organizer`?`tasks.deleteTellAssignees`:`tasks.deleteTellAssigner`)}
                    confirmText=${e(`invitations.deleteAndTell`)}
                    secondaryText=${e(`invitations.deleteOnly`)}
                    isDanger
                    @confirm=${()=>void this.confirmDelete(!0)}
                    @secondary=${()=>void this.confirmDelete(!1)}
                    @cancel=${()=>{this.taskToDelete=null}}
                ></ui-confirm>
            `:this.taskToDelete?n`
                <ui-confirm
                    title=${e(`tasks.deleteTask`)}
                    message=${e(`tasks.deleteTaskConfirm`)}
                    confirmText=${e(`tasks.delete`)}
                    isDanger
                    @confirm=${()=>void this.confirmDelete()}
                    @cancel=${()=>{this.taskToDelete=null}}
                ></ui-confirm>
            `:``}
        `}};k([h({context:S})],F.prototype,`i18nStore`,void 0),k([h({context:C})],F.prototype,`settingsStore`,void 0),k([a()],F.prototype,`tasks`,void 0),k([a()],F.prototype,`lists`,void 0),k([a()],F.prototype,`selectedList`,void 0),k([a()],F.prototype,`selectedCalendar`,void 0),k([a()],F.prototype,`searchQuery`,void 0),k([a()],F.prototype,`loading`,void 0),k([a()],F.prototype,`loadedScope`,void 0),k([a()],F.prototype,`pendingPaths`,void 0),k([a()],F.prototype,`settling`,void 0),k([a()],F.prototype,`modalOpen`,void 0),k([a()],F.prototype,`editingTask`,void 0),k([a()],F.prototype,`taskToDelete`,void 0),k([a()],F.prototype,`scheduling`,void 0),k([a()],F.prototype,`isSpinning`,void 0),k([a()],F.prototype,`listPromptOpen`,void 0),k([a()],F.prototype,`sidebarWidth`,void 0),k([a()],F.prototype,`sidebarCollapsed`,void 0),k([a()],F.prototype,`isSidebarHovered`,void 0),k([a()],F.prototype,`suppressSidebarHover`,void 0),k([a()],F.prototype,`isSidebarDragging`,void 0),k([a()],F.prototype,`isMobile`,void 0),k([a()],F.prototype,`mobileSidebarOpen`,void 0),F=k([p(`tasks-page`)],F);var mr=e({});v.registerRoute({path:`/calendar/*`,component:`calendar-page`,pluginId:`caldav`}),v.registerNavTab({id:`calendar`,pluginId:`caldav`,labelKey:`navigation.calendar`,icon:`calendar`,order:20}),v.registerRoute({path:`/tasks/*`,component:`tasks-page`,pluginId:`caldav`}),v.registerNavTab({id:`tasks`,pluginId:`caldav`,labelKey:`navigation.tasks`,icon:`checkCircle`,order:30}),v.registerHook(`reader:content`,e=>{let t=e?.message;if(!t||!An(t.BodyStructure))return;let r=e.mailbox||t.Mailbox;!r||t.UID===void 0||(e.banners=e.banners||[],e.banners.push(n`<calendar-invitation-banner .mailbox=${r} .uid=${String(t.UID)}></calendar-invitation-banner>`))},`caldav`);function hr(e){let t=0;for(let n of e)n.status===`rejected`&&(t+=1,console.error(`Bulk contact operation failed for one item`,n.reason));return{total:e.length,done:e.length-t,failed:t}}var I=new class{async fetchContacts(e=``){let t=await T(e?`/contacts?query=${encodeURIComponent(e)}`:`/contacts`);if(!t.ok)throw Error(`Failed to fetch contacts: ${t.statusText}`);return t.json()}async fetchContact(e){let t=await T(`/contacts/${ot(e)}`);if(!t.ok)throw Error(`Failed to fetch contact: ${t.statusText}`);return t.json()}async createContact(e){let t=await T(`/contacts/create`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(!t.ok)throw new w(t.status,`Failed to create contact: ${t.statusText}`);return t.json()}async updateContact(e,t){let n=await T(`/contacts/${ot(e)}/edit`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!n.ok)throw new w(n.status,`Failed to update contact: ${n.statusText}`);return n.json()}async updateCategories(e,t){let n=await T(`/contacts/${ot(e)}/categories`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({categories:t})});if(!n.ok)throw new w(n.status,`Failed to update contact: ${n.statusText}`);return n.json()}async deleteContact(e){let t=await T(`/contacts/${ot(e)}`,{method:`DELETE`});if(!t.ok)throw Error(`Failed to delete contact: ${t.statusText}`)}async bulkUpdateCategories(e){let t=e.filter(e=>e.path),n=await Promise.allSettled(t.map(e=>this.updateCategories(e.path,e.categories??[]))),r={};return n.forEach((e,n)=>{e.status===`fulfilled`&&e.value?.etag&&(r[t[n].path]=e.value.etag)}),{...hr(n),etags:r}}async bulkDeleteContacts(e){return hr(await Promise.allSettled(e.map(e=>this.deleteContact(e))))}},gr=`All Contacts`,_r=`Favorites`,vr=`alps_msg_`,yr=1800*1e3,br={get(e,t,n=`html`){try{let r=`${vr}${e}_${t}_${n}`,i=sessionStorage.getItem(r);if(!i)return null;let a=JSON.parse(i);return Date.now()-a.timestamp>yr?(sessionStorage.removeItem(r),null):a}catch(e){return b.error(`Failed to read message cache`,e),null}},set(e,t,n,r){try{let i=`${vr}${e}_${t}_${n}`,a={...r,timestamp:Date.now()},o=JSON.stringify(a);if(o.length>2*1024*1024){console.warn(`Message ${t} is too large to cache (${Math.round(o.length/1024)}KB)`);return}sessionStorage.setItem(i,o)}catch(i){if(i instanceof DOMException&&(i.name===`QuotaExceededError`||i.code===22)){console.warn(`Session storage quota exceeded, clearing cache and retrying...`),this.clear();try{let i=`${vr}${e}_${t}_${n}`,a={...r,timestamp:Date.now()};sessionStorage.setItem(i,JSON.stringify(a))}catch(e){b.error(`Failed to write message cache even after clearing`,e)}}else b.error(`Failed to write message cache`,i)}},clear(){try{let e=[];for(let t=0;t<sessionStorage.length;t++){let n=sessionStorage.key(t);n&&n.startsWith(vr)&&e.push(n)}e.forEach(e=>sessionStorage.removeItem(e))}catch(e){b.error(`Failed to clear message cache`,e)}}},L=new class extends EventTarget{constructor(...e){super(...e),this.interval=null,this.currentMailbox=E,this.currentPage=0,this.currentQuery=``,this.listed=!1,this.currentFetchId=0,this.currentLabelsId=0}setContext(e,t,n=``){this.currentMailbox=e,this.currentPage=t,this.currentQuery=n}start(e=5){if(this.stop(),e<=0)return;let t=e*60*1e3;this.interval=setInterval(()=>void this.backgroundSync(),t)}stop(){this.interval&&=(clearInterval(this.interval),null)}mailboxRenamed(e,t){if(this.currentMailbox===e)this.currentMailbox=t;else if(this.currentMailbox.startsWith(e)){let n=this.currentMailbox.slice(e.length);/^[^A-Za-z0-9]/.test(n)&&(this.currentMailbox=t+n)}}mailboxDeleted(e){(this.currentMailbox===e||Zt(this.currentMailbox,e))&&(this.currentMailbox=E,this.currentPage=0,this.listed=!1)}sync(){this.fetch(this.currentMailbox,this.currentPage,this.currentQuery,!0,!0)}syncIfViewing(e){this.currentMailbox===e&&this.sync()}async syncLabels(){let e=++this.currentLabelsId;try{let t=await T(`/mailboxes`);if(this.currentLabelsId!==e)return;if(t.status===401){window.dispatchEvent(new CustomEvent(`auth-error`));return}if(!t.ok)throw Error(`HTTP ${t.status}`);let n=await t.json();if(this.currentLabelsId!==e||!n.Mailboxes)return;this.dispatchEvent(new CustomEvent(`labels-success`,{detail:{mailboxes:n.Mailboxes}}))}catch(e){b.error(`Failed to refresh folder list`,e)}}async fetch(e,t,n=``,r=!1,i=!1){this.setContext(e,t,n),this.listed=!1;let a=++this.currentFetchId;this.dispatchEvent(new CustomEvent(`sync-start`,{detail:{background:!1,quiet:i}}));let o=Date.now(),s=async()=>{if(i)return;let e=Date.now()-o;e<200&&await new Promise(t=>setTimeout(t,200-e))};try{let o=`/mailboxes/${D(e)}?page=${t}`;n&&(o+=`&query=${encodeURIComponent(n)}`),r&&(o+=`&refresh=true`);let c=await T(o);if(this.currentFetchId!==a)return;if(c.status===401){window.dispatchEvent(new CustomEvent(`auth-error`));return}if(c.status===404){this.dispatchEvent(new CustomEvent(`mailbox-not-found`));return}let l=await c.json();if(this.currentFetchId!==a||(await s(),this.currentFetchId!==a))return;this.listed=!0,this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:l,background:!1,quiet:i}}))}catch(e){if(this.currentFetchId!==a||(b.error(`Failed to fetch mailbox data`,e),await s(),this.currentFetchId!==a))return;this.dispatchEvent(new CustomEvent(`sync-error`,{detail:{error:e,background:!1,quiet:i}}))}}async check(e,t,n=``){if(!(this.listed&&t===0&&this.currentPage===0&&e===this.currentMailbox&&n===this.currentQuery))return this.fetch(e,t,n,!0);this.dispatchEvent(new CustomEvent(`sync-start`,{detail:{background:!0}})),!await this.backgroundSync()&&this.dispatchEvent(new CustomEvent(`sync-error`,{detail:{error:null,background:!0}}))}async backgroundSync(){let e=++this.currentFetchId,t=this.currentMailbox,n=this.currentPage,r=this.currentQuery;try{if(t!==`INBOX`&&await T(`/mailboxes/${E}/status`).catch(()=>{}),this.currentFetchId!==e||(await T(`/mailboxes/${D(t)}/status`),this.currentFetchId!==e))return!0;let i=`/mailboxes/${D(t)}?page=${n}`;r&&(i+=`&query=${encodeURIComponent(r)}`);let a=await T(i);if(this.currentFetchId!==e)return!0;if(a.status===401)return window.dispatchEvent(new CustomEvent(`auth-error`)),!0;if(a.status===404)return this.dispatchEvent(new CustomEvent(`mailbox-not-found`)),!0;let o=await a.json();return this.currentFetchId===e&&this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:o,background:!0}})),!0}catch(t){return this.currentFetchId===e?(b.error(`Background sync failed`,t),!1):!0}}},R=`\\Seen`,z=`\\Flagged`,xr=`\\Answered`,Sr=`\\Deleted`,Cr=`\\Draft`,wr=`$Forwarded`,Tr=`$MDNSent`,Er=`Junk`,Dr=`NonJunk`,Or=`NotJunk`,kr=`$Junk`,Ar=`$NotJunk`,jr=`$Phishing`,Mr=`$SubmitPending`,Nr=`$Submitted`;function Pr(e,t){if(!e)return[];let n=new Set([R,z,xr,Sr,Cr,wr,Tr,Er,Dr,Or,kr,Ar,jr,Mr,Nr].map(e=>e.toLowerCase())),r=[];for(let i of e)i.startsWith(`\\`)||n.has(i.toLowerCase())||r.push({id:i,name:Lr(i,t),color:Rr(i)});return r.sort((e,t)=>{let n=e.id.toLowerCase().startsWith(`$label`),r=t.id.toLowerCase().startsWith(`$label`);return n&&!r?-1:!n&&r?1:e.id.localeCompare(t.id)})}var Fr=new Set([wr,Tr,jr,Mr,Nr].map(e=>e.toLowerCase()));function Ir(e){return e?e.filter(e=>!e.startsWith(`\\`)&&!Fr.has(e.toLowerCase())):[]}function Lr(e,t){switch(e.toLowerCase()){case`$label1`:return t?.t(`tags.important`)||`Important`;case`$label2`:return t?.t(`tags.work`)||`Work`;case`$label3`:return t?.t(`tags.personal`)||`Personal`;case`$label4`:return t?.t(`tags.todo`)||`To Do`;case`$label5`:return t?.t(`tags.later`)||`Later`;default:return e}}function Rr(e){switch(e.toLowerCase()){case`$label1`:return`#ef4444`;case`$label2`:return`#f97316`;case`$label3`:return`#22c55e`;case`$label4`:return`#3b82f6`;case`$label5`:return`#a855f7`;default:return zr(e)}}function zr(e){let t=0;for(let n=0;n<e.length;n++)t=e.charCodeAt(n)+((t<<5)-t);return`hsl(${Math.abs(t)%360}, 70%, 45%)`}function Br(e){let t=[];for(let n=0;n<e.length;n+=500)t.push(e.slice(n,n+500));return t}async function Vr(e){try{return await e.json()??{}}catch{return{}}}var B=new class{isAuthError(e){return e.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),!0):!1}async setFlag(e,t,n,r){if(!t||t.length===0)return{ok:!1,reason:`empty`};let i=0;try{for(let a of Br(t)){let t=await T(`/mailboxes/${D(e)}/messages/flag`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:a,flags:n,action:r})});if(this.isAuthError(t))return{ok:!1,reason:`auth`,applied:i};if(!t.ok){let e=await Vr(t),n=e.error===`unsupported_flags`?`unsupported`:`failed`;return b.error(`Failed to set flag`,t.status,e),{ok:!1,reason:n,applied:i,rejected:e.rejected}}i+=a.length}return{ok:!0,applied:i}}catch(e){return b.error(`Failed to set flag`,e),{ok:!1,reason:`failed`,applied:i}}}matchingBody(e,t={}){return JSON.stringify({all:!0,query:e.query||``,except:e.except??[],...t})}countOf(e){return typeof e.count==`number`?e.count:0}async setFlagMatching(e,t,n,r){try{let i=await T(`/mailboxes/${D(e)}/messages/flag`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:this.matchingBody(t,{flags:n,action:r})});if(this.isAuthError(i))return{ok:!1,reason:`auth`};let a=await Vr(i);if(!i.ok){let e=a.error===`unsupported_flags`?`unsupported`:`failed`;return b.error(`Failed to set a flag on a folder`,i.status,a),{ok:!1,reason:e,rejected:a.rejected}}return L.sync(),{ok:!0,applied:this.countOf(a)}}catch(e){return b.error(`Failed to set a flag on a folder`,e),{ok:!1,reason:`failed`}}}async moveMatching(e,t,n){return this.fileMatching(`move`,e,t,n)}async copyMatching(e,t,n){return this.fileMatching(`copy`,e,t,n)}async fileMatching(e,t,n,r){try{let i=await T(`/mailboxes/${D(t)}/messages/${e}`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:this.matchingBody(n,{to:r})});if(this.isAuthError(i))return{success:!1,reason:`auth`};let a=await Vr(i);return i.ok?(L.sync(),{success:!0,uidMapping:a.uidMapping??{},count:this.countOf(a)}):(b.error(`Failed to ${e} a folder's messages`,i.status,a),{success:!1,reason:`failed`})}catch(t){return b.error(`Failed to ${e} a folder's messages`,t),{success:!1,reason:`failed`}}}async deleteMatchingResult(e,t){try{let n=await T(`/mailboxes/${D(e)}/messages`,{method:`DELETE`,headers:{"Content-Type":`application/json`},body:this.matchingBody(t)});if(this.isAuthError(n))return{ok:!1,reason:`auth`};let r=await Vr(n);return n.ok?(L.sync(),{ok:!0,count:this.countOf(r)}):(b.error(`Failed to delete a folder's messages`,n.status,r),{ok:!1,reason:`failed`})}catch(e){return b.error(`Failed to delete a folder's messages`,e),{ok:!1,reason:`failed`}}}async markAsRead(e,t){let n=t?.UID;if(!n||t.Flags?.includes(`\\Seen`))return t;let{ok:r}=await this.setFlag(e,[String(n)],[R],`add`);if(r){let e={...t};return e.Flags=[...e.Flags||[],R],e}return t}async deleteMessagesResult(e,t){if(!t||t.length===0)return{ok:!1,reason:`empty`};let n=0;try{for(let r of Br(t)){let t=await T(`/mailboxes/${D(e)}/messages`,{method:`DELETE`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:r})});if(this.isAuthError(t))return{ok:!1,reason:`auth`};if(!t.ok)return b.error(`Failed to delete messages`,t.status,await Vr(t)),n>0&&L.sync(),{ok:!1,reason:`failed`};n+=r.length}return L.sync(),{ok:!0}}catch(e){return b.error(`Failed to delete messages`,e),n>0&&L.sync(),{ok:!1,reason:`failed`}}}async deleteMessages(e,t){return(await this.deleteMessagesResult(e,t)).ok}async moveMessages(e,t,n){if(!t||t.length===0)return{success:!1,reason:`empty`};let r=0,i={};try{for(let a of Br(t)){let t=await T(`/mailboxes/${D(e)}/messages/move`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:a,to:n})});if(this.isAuthError(t))return{success:!1,reason:`auth`};if(!t.ok)return b.error(`Failed to move messages`,t.status,await Vr(t)),r>0&&L.sync(),{success:!1,reason:`failed`};let o=await Vr(t);Object.assign(i,o.uidMapping??{}),r+=a.length}return L.sync(),{success:!0,uidMapping:i}}catch(e){return b.error(`Failed to move messages`,e),r>0&&L.sync(),{success:!1,reason:`failed`}}}async copyMessages(e,t,n){if(!t||t.length===0)return{success:!1,reason:`empty`};let r=0;try{for(let i of Br(t)){let t=await T(`/mailboxes/${D(e)}/messages/copy`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:i,to:n})});if(this.isAuthError(t))return{success:!1,reason:`auth`};if(!t.ok)return b.error(`Failed to copy messages`,t.status,await Vr(t)),r>0&&L.sync(),{success:!1,reason:`failed`};r+=i.length}return L.sync(),{success:!0}}catch(e){return b.error(`Failed to copy messages`,e),r>0&&L.sync(),{success:!1,reason:`failed`}}}async markMessagesAsRead(e,t){if(!t||t.length===0)return!1;let{ok:n}=await this.setFlag(e,t,[R],`add`);return n}async markMessagesAsUnread(e,t){if(!t||t.length===0)return!1;let{ok:n}=await this.setFlag(e,t,[R],`remove`);return n}async saveDraft(e){try{let t=await T(`/messages`,{method:`POST`,body:e});if(t.status===401)return window.dispatchEvent(new CustomEvent(`auth-error`)),null;if(t.ok){let e=await t.json();return{uid:e.draft_uid,mailbox:e.draft_mailbox,size:e.draft_size,attachments:e.attachments}}return b.error(`Failed to save draft:`,t.status,await Vr(t)),null}catch(e){return b.error(`Failed to save draft:`,e),null}}async sendDraft(e){try{let t=await T(`/messages`,{method:`POST`,body:e});if(t.status===401)return window.dispatchEvent(new CustomEvent(`auth-error`)),!1;if(t.ok)return L.sync(),!0;let n=await Vr(t);throw Error(n.error||`Failed to send message (${t.status})`)}catch(e){throw b.error(`Failed to send message:`,e),e}}},Hr=`Attachments exceed the maximum allowed size.`,Ur=new Map;function Wr(){return globalThis.crypto?.randomUUID?.()??`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}function Gr(e){let t=Ur.get(e);t&&(t.abort(),Ur.delete(e))}function Kr(e){for(let t of e)t.uploading&&t._tempId&&Gr(t._tempId)}async function qr(e){try{await fetch(`/attachments/${e}`,{method:`DELETE`})}catch(e){b.error(`Failed to delete attachment from server:`,e)}}function Jr(e,t,n,r,i,a,o,s){let c=document.createElement(`input`);c.type=`file`,c.multiple=!0,c.onchange=c=>{let l=Array.from(c.target.files||[]);l.length!==0&&Yr(l,e,t,n,r,i,a,o,s)},c.click()}function Yr(e,t,n,r,i,a,o,s,c){let l=0;for(let t of e)l+=t.size;if(n>0&&r+l>n){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:c||Hr,duration:5e3}}));return}for(let n of e){let e=Wr();i(e,n);let r=new FormData;r.append(`attachments`,n);let c=new XMLHttpRequest;Ur.set(e,c),c.open(`POST`,`/attachments?composer_id=${encodeURIComponent(t)}`,!0),c.upload.onprogress=t=>{t.lengthComputable&&a(e,Math.round(t.loaded/t.total*100))},c.onload=()=>{if(Ur.delete(e),c.status>=200&&c.status<300)try{let t=JSON.parse(c.responseText),n=Array.isArray(t)?t:t.uuids||[];n.length>0?o(e,n):s(e,Error(`No UUID returned from server`))}catch(t){s(e,t)}else try{let t=JSON.parse(c.responseText);s(e,Error(t.error||`Unknown error`))}catch{s(e,Error(`Upload failed with status `+c.status))}},c.onerror=()=>{Ur.delete(e),s(e,Error(`Network error during upload`))},c.onabort=()=>{Ur.delete(e)},c.send(r)}}function Xr(e){let t=[],n=(e,r)=>{if(e){if(e.ID){let n=Number(e.Size)||0;t.push({name:e.Extended?.Disposition?.Params?.filename||e.Params?.name||`image`,size:String(e.Encoding).toLowerCase()===`base64`?Math.floor(n*3/4):n,type:e.Type&&e.Subtype?`${e.Type}/${e.Subtype}`.toLowerCase():`application/octet-stream`,partPath:r||`1`,inline:!0})}Array.isArray(e.Children)&&e.Children.forEach((e,t)=>n(e,r?`${r}.${t+1}`:`${t+1}`))}};return n(e,``),t}function Zr(e,t){let n={},r=e?.Envelope?.MessageID||e?.Envelope?.MessageId;return r&&(n.inReplyTo=r,n.references=Array.isArray(e.References)?[...e.References]:[]),e?.UID!==void 0&&e?.UID!==null&&t&&(n.replyMailbox=t,n.replyUid=String(e.UID)),n}function Qr(e,t){t.inReplyTo&&e.append(`in_reply_to`,t.inReplyTo),t.references?.length&&e.append(`references`,t.references.join(` `)),t.replyMailbox&&t.replyUid&&(e.append(`reply_mailbox`,t.replyMailbox),e.append(`reply_uid`,t.replyUid)),t.quoteSource?.mailbox&&t.quoteSource.uid&&(e.append(`source_mailbox`,t.quoteSource.mailbox),e.append(`source_uid`,t.quoteSource.uid))}var $r=e=>`alps_compose_drafts_${e}`,ei=`alps_compose_drafts`,ti=e=>{let t=e.trim();if(t.endsWith(`>`)){let e=t.lastIndexOf(`<`);e!==-1&&(t=t.substring(e+1,t.length-1))}return t.trim().toLowerCase()},ni=e=>{let t=ti(e);return t.startsWith(`noreply`)||t.startsWith(`no-reply`)||t.startsWith(`mailer-daemon`)},ri=e=>e&&e.filter(e=>!ni(e)),ii=class extends EventTarget{constructor(){super(),this.state={activeComposers:[]},this.saveTimeout=null,this.username=null,this.adoptSession=()=>{let e=ke();if(e===this.username)return;let t=this.username===null?this.state.activeComposers:[];this.username=e;let n=e?this.loadDrafts(e):[];this.state.activeComposers=e?[...n,...t]:[],this.notify()},this.handleSessionCleared=e=>{this.saveTimeout!==null&&(window.clearTimeout(this.saveTimeout),this.saveTimeout=null);let t=e?.detail?.reason===`expired`;t&&this.saveDrafts();let n=this.username&&!t?$r(this.username):null;this.username=null;for(let e of this.state.activeComposers)Kr(e.attachments||[]);if(this.state.activeComposers=[],this.notify(),n)try{localStorage.removeItem(n)}catch(e){b.error(`Failed to clear compose drafts`,e)}};try{localStorage.removeItem(ei)}catch{}window.addEventListener(`session-cleared`,this.handleSessionCleared),window.addEventListener(`user-logged-in`,this.adoptSession),window.addEventListener(`alps-active-user-changed`,this.adoptSession),this.adoptSession()}loadDrafts(e){try{let t=localStorage.getItem($r(e));if(t)return JSON.parse(t).map(e=>{let t=e.isSending;return{...e,attachments:e.attachments?.filter(e=>!e.uploading&&e.uuid)||[],isSending:!1,minimized:t?!1:e.minimized}})}catch(e){b.error(`Failed to parse compose drafts from localStorage`,e)}return[]}saveDrafts(){if(this.username)try{localStorage.setItem($r(this.username),JSON.stringify(this.state.activeComposers))}catch(e){b.error(`Failed to save compose drafts to localStorage`,e)}}debouncedSaveDrafts(){this.saveTimeout!==null&&window.clearTimeout(this.saveTimeout),this.saveTimeout=window.setTimeout(()=>{this.saveDrafts(),this.saveTimeout=null},500)}notify(){this.dispatchEvent(new CustomEvent(`change`))}get stateCopy(){return{...this.state}}getComposer(e){return this.state.activeComposers.find(t=>t.id===e)}getState(){return this.state}openComposer(e){if(e?.draftUid){let t=this.state.activeComposers.find(t=>t.draftUid===e.draftUid);if(t){this.bringComposerToFront(t.id),t.minimized&&this.updateComposer(t.id,{minimized:!1});return}}let t=window.innerWidth<=768;if(t&&this.state.activeComposers.length>=1){let e=this.state.activeComposers[0].id;this.bringComposerToFront(e);return}if(!t&&this.state.activeComposers.length>=3)return;let n=`composer_`+Date.now()+`_`+Math.random().toString(36).substr(2,5),r=`html`,i=``,a=Ae();a.composeFormat===`text`&&(r=`text`),a.signature&&(i=a.signature);let o=e?.text||``,s=e?.html||``;if(i&&!e?.draftUid){let t=`-- \n${i}`,n=`<div class="alps-signature">-- <br>${i.replace(/\n/g,`<br>`)}</div>`;o=`\n\n${t}\n${o}`,s=s||e?.text?`<br><br>${n}${s}`:`<br><br>${n}`}let c={id:n,minimized:!1,expanded:!1,dirty:!1,subject:``,format:e?.format||r,attachments:[],zIndex:1e3+this.state.activeComposers.length,...e,to:ri(e?.to)||[],cc:ri(e?.cc)||[],bcc:ri(e?.bcc)||[],text:o,html:s,initialText:o,initialHtml:s};this.state={...this.state,activeComposers:[...this.state.activeComposers,c]},this.saveDrafts(),this.notify()}updateComposer(e,t){t.to&&=ri(t.to),t.cc&&=ri(t.cc),t.bcc&&=ri(t.bcc);let n=this.state.activeComposers.map(n=>{if(n.id!==e)return n;let r=!1;if(`subject`in t&&t.subject!==n.subject&&(r=!0),`to`in t&&JSON.stringify(t.to||[])!==JSON.stringify(n.to||[])&&(r=!0),`cc`in t&&JSON.stringify(t.cc||[])!==JSON.stringify(n.cc||[])&&(r=!0),`bcc`in t&&JSON.stringify(t.bcc||[])!==JSON.stringify(n.bcc||[])&&(r=!0),`attachments`in t&&t.attachments!==n.attachments&&(r=!0),!r&&!n.dirty){if(`text`in t||`html`in t){let e=`text`in t?t.text||``:n.text||``,i=n.initialText||``;e.trim()!==i.trim()&&(r=!0)}}else !r&&n.dirty;let i=`dirty`in t?t.dirty:r?!0:n.dirty;return{...n,...t,dirty:i}});this.state={...this.state,activeComposers:n},this.debouncedSaveDrafts(),this.notify()}closeComposer(e){this.state={...this.state,activeComposers:this.state.activeComposers.filter(t=>t.id!==e)},this.saveDrafts(),this.notify()}clearAllComposers(){this.state={...this.state,activeComposers:[]},this.notify()}async saveAllDirtyDrafts(){let e=0,t=this.state.activeComposers.filter(e=>e.dirty);if(t.length>0)for(let n of t){let t=(n.to?.length||0)>0||(n.cc?.length||0)>0||(n.bcc?.length||0)>0,r=n.text?.trim()!==n.initialText?.trim()||(n.subject?.trim().length||0)>0;if(!t&&!r&&!(n.attachments&&n.attachments.length>0))continue;let i=new FormData,a=[...n.bcc||[]],o=``;{let e=Ae(),t=e.loginUsername;e.bccMyself&&t&&!a.some(e=>ti(e)===ti(t))&&a.push(t),e.replyTo&&(o=e.replyTo)}i.append(`to`,(n.to||[]).join(`, `)),i.append(`cc`,(n.cc||[]).join(`, `)),i.append(`bcc`,a.join(`, `)),o&&i.append(`reply_to`,o),i.append(`subject`,(n.subject||``).trim()),i.append(`text`,n.text||``),n.html&&n.format===`html`&&i.append(`html`,n.html),i.append(`save_as_draft`,`1`);let s=n.attachments||[],c=s.map(e=>e.uuid).filter(Boolean).join(`,`);c&&i.append(`attachment-uuids`,c);let l=s.map(e=>e.partPath).filter(Boolean).join(`,`);l&&i.append(`prev_attachments`,l),n.draftMailbox&&i.append(`draft_mailbox`,n.draftMailbox),n.draftUid&&i.append(`draft_uid`,n.draftUid),Qr(i,n),await B.saveDraft(i)||e++}return this.state={...this.state,activeComposers:[]},this.saveDrafts(),this.notify(),{failed:e}}bringComposerToFront(e){let t=1e3;this.state.activeComposers.forEach(e=>{e.zIndex&&e.zIndex>t&&(t=e.zIndex)}),this.updateComposer(e,{zIndex:t+1})}},ai=u(`compose-store`),oi=`alps-login-notice`;function si(e){try{sessionStorage.setItem(oi,e)}catch{}}function ci(){try{let e=sessionStorage.getItem(oi);return e&&sessionStorage.removeItem(oi),e||null}catch{return null}}var li=new class extends EventTarget{constructor(){super(),this.accounts=[],this.loading=!1,this.initialized=!1}getAccounts(){return this.accounts}isLoading(){return this.loading}isInitialized(){return this.initialized}async fetchAccounts(){this.loading=!0,this.dispatchEvent(new Event(`change`));try{let e=await fetch(`/accounts`);if(e.ok){let t=await e.json();this.accounts=t.accounts||[],this.initialized=!0}else b.error(`Failed to fetch linked accounts`)}catch(e){b.error(`Error fetching linked accounts:`,e)}finally{this.loading=!1,this.dispatchEvent(new Event(`change`))}}async addAccount(e,t,n=``){let r=new URLSearchParams;r.append(`username`,e),r.append(`password`,t),r.append(`display_name`,n);let i=await fetch(`/accounts`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:r.toString()});if(!i.ok){let e=await i.json().catch(()=>({}));throw Error(e.error||`Failed to add linked account`)}await this.fetchAccounts()}async removeAccount(e){let t=await fetch(`/accounts/${encodeURIComponent(e)}`,{method:`DELETE`});if(!t.ok){let e=await t.json().catch(()=>({}));throw Error(e.error||`Failed to remove linked account`)}await this.fetchAccounts()}async switchAccount(e){let t=new URLSearchParams;t.append(`username`,e);let n=await fetch(`/accounts/switch`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:t.toString()});if(!n.ok){let e=await n.json().catch(()=>({}));throw Error(e.error||`Failed to switch account`)}return await n.json()}},ui=u(`alps-linked-accounts`),di=class extends d{constructor(...e){super(...e),this.name=``,this.email=``,this.src=``,this.size=40,this.imageError=!1,this._handleStoreChange=()=>{this.requestUpdate()}}willUpdate(e){e.has(`src`)&&(this.imageError=!1)}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.settingsStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=g`
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
  `}getInitials(e){if(!e)return`U`;let t=e.trim().split(/[\s.@]+/);return t.length>=2?(t[0][0]+t[1][0]).toUpperCase():e.substring(0,2).toUpperCase()}render(){let e=this.settingsStore?.getState()?.loginUsername||``,t=this.settingsStore?.getState()?.name||``,i=!1;(e&&this.email&&this.email.toLowerCase()===e.toLowerCase()||t&&this.name&&this.name.toLowerCase()===t.toLowerCase()||e&&this.name&&this.name.toLowerCase()===e.toLowerCase())&&(i=!0);let a=i?t||e:this.email||this.name,o=i&&(t||e)||this.name,s=Math.round(this.size/2.3);return n`
      <div class="avatar" style="${r({width:`${this.size}px`,height:`${this.size}px`,fontSize:`${s}px`,backgroundColor:nn(a)})}">
        ${this.src&&!this.imageError?n`<img src="${this.src}" alt="${this.name}" @error="${()=>this.imageError=!0}" />`:this.getInitials(o)}
      </div>
    `}};k([h({context:C})],di.prototype,`settingsStore`,void 0),k([o({type:String})],di.prototype,`name`,void 0),k([o({type:String})],di.prototype,`email`,void 0),k([o({type:String})],di.prototype,`src`,void 0),k([o({type:Number})],di.prototype,`size`,void 0),k([a()],di.prototype,`imageError`,void 0),di=k([p(`alps-avatar`)],di);var fi=class extends d{constructor(...e){super(...e),this.username=``,this.isMobile=!1,this.currentTab=`messages`,this._handleStoreChange=()=>{this.requestUpdate()}}static{this.styles=[En,g`
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
  `]}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange),this.settingsStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.addEventListener(`change`,this._handleStoreChange),window.addEventListener(`plugins-updated`,this._handleStoreChange),this.linkedAccountsStore&&!this.linkedAccountsStore.isInitialized()&&this.linkedAccountsStore.fetchAccounts()})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.removeEventListener(`change`,this._handleStoreChange),window.removeEventListener(`plugins-updated`,this._handleStoreChange)}_closePopup(){let e=this.shadowRoot?.querySelector(`alps-popup`);e&&e.close()}_handleSettings(){this._closePopup(),this.dispatchEvent(new CustomEvent(`open-settings`,{bubbles:!0,composed:!0}))}_handleSignOut(){this._closePopup(),this.dispatchEvent(new CustomEvent(`sign-out`,{bubbles:!0,composed:!0}))}_handleTabChange(e){this._closePopup(),e===`messages`?window.location.hash.startsWith(`#/mailbox/`)||(window.location.hash=`#/`):window.location.hash=`#/`+e,this.dispatchEvent(new CustomEvent(`change-tab`,{detail:{tab:e},bubbles:!0,composed:!0}))}async _handleSwitchAccount(e){this._closePopup();let t=document.createElement(`div`);document.body.appendChild(t),s(n`
      <style>
        @keyframes global-spin { to { transform: rotate(360deg); } }
        .switch-overlay svg { width: 100%; height: 100%; fill: currentColor; }
      </style>
      <div id="switch-account-overlay" class="switch-overlay" style="position: fixed; inset: 0; background-color: var(--bg-primary, #ffffff); z-index: 999999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease-in;">
        <div style="display: inline-flex; width: 32px; height: 32px; animation: global-spin 1s linear infinite; color: var(--accent-color, #2563eb);">
          ${O(`edelweiss`)}
        </div>
      </div>
    `,t);let r=t.querySelector(`#switch-account-overlay`);requestAnimationFrame(()=>{requestAnimationFrame(()=>{r&&(r.style.opacity=`1`)})}),await new Promise(e=>setTimeout(e,300));try{(await this.linkedAccountsStore.switchAccount(e)).requires_2fa?(je(!1),sessionStorage.clear(),window.location.hash=`#/login/webauthn`,r&&(r.style.opacity=`0`),setTimeout(()=>t.remove(),300)):(je(!1),sessionStorage.clear(),window.location.reload())}catch(e){r&&(r.style.opacity=`0`),setTimeout(()=>t.remove(),300),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore?.t(`linkedAccounts.switchError`),duration:5e3}}))}}render(){let e=this.settingsStore?.getState().name||this.username;return n`
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
          
          ${(()=>{let e=this.linkedAccountsStore?.getAccounts()||[];return e.length===0?``:n`
              ${e.map(e=>n`
                <button class="dropdown-item" @click="${()=>this._handleSwitchAccount(e.username)}">
                  <alps-avatar .name=${e.display_name||e.username} .size=${16} style="margin-right: 4px;"></alps-avatar>
                  <span class="item-text" style="font-weight: 500;" title="${e.username}">${e.display_name||e.username}</span>
                </button>
              `)}
              <div class="dropdown-divider"></div>
            `})()}
          
          <button class="dropdown-item ${this.currentTab===`messages`?`active`:``}" @click="${()=>this._handleTabChange(`messages`)}">
            ${O(`envelopeSimple`)} <span class="item-text">${this.i18nStore?.t(`navigation.messages`)}</span>
          </button>
          ${v.getNavTabs().map(e=>n`
            <button class="dropdown-item ${this.currentTab===e.id?`active`:``}" @click="${()=>this._handleTabChange(e.id)}">
              ${O(e.icon||`star`)} <span class="item-text">${this.i18nStore?.t(e.labelKey)}</span>
            </button>
          `)}
          <div class="dropdown-divider"></div>
          <button class="dropdown-item ${this.currentTab===`settings`?`active`:``}" @click="${this._handleSettings}">
            ${O(`gear`)} <span class="item-text">${this.i18nStore?.t(`userMenu.settings`)}</span>
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click="${this._handleSignOut}">
            ${O(`signOut`)} <span class="item-text">${this.i18nStore?.t(`userMenu.signOut`)}</span>
          </button>
        </alps-popup>
      </div>
    `}};k([o({type:String})],fi.prototype,`username`,void 0),k([o({type:Boolean})],fi.prototype,`isMobile`,void 0),k([o({type:String})],fi.prototype,`currentTab`,void 0),k([h({context:S})],fi.prototype,`i18nStore`,void 0),k([h({context:C})],fi.prototype,`settingsStore`,void 0),k([h({context:ui})],fi.prototype,`linkedAccountsStore`,void 0),fi=k([p(`user-profile-menu`)],fi);var pi=class extends d{constructor(...e){super(...e),this.username=``,this.currentTab=``,this.isMobile=!1,this.scrolled=!1,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=g`
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

    :host([ismobile]) .center-section {
      margin: 0 8px;
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
  `}handleSettings(){window.location.hash=`/settings`}async handleSignOut(){let e=0;try{this.composeStore&&(e=(await this.composeStore.saveAllDirtyDrafts()).failed)}catch(e){b.error(`Could not save drafts before signing out`,e)}si(e>0?`signedOutDraftsLost`:`signedOut`);try{await fetch(`/session`,{method:`DELETE`})}catch(e){b.error(`Sign-out request failed; ending the session locally anyway`,e)}br.clear(),je(),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`}render(){return n`
      <div class="header-container">
        <div class="left-section">
          ${this.isMobile?n`
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
          ${this.username?n`
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
    `}};k([o({type:String})],pi.prototype,`username`,void 0),k([o({type:String})],pi.prototype,`currentTab`,void 0),k([o({type:Boolean,reflect:!0})],pi.prototype,`isMobile`,void 0),k([o({type:Boolean,reflect:!0})],pi.prototype,`scrolled`,void 0),k([h({context:S})],pi.prototype,`i18nStore`,void 0),k([h({context:ai})],pi.prototype,`composeStore`,void 0),pi=k([p(`alps-header`)],pi);var mi=class extends d{constructor(...e){super(...e),this.username=``,this.currentTab=`messages`,this.isMobile=!1,this.currentMailbox=``,this.currentMailboxDelimiter=``,this.searchQuery=``,this.scrolled=!1,this._handleStoreChange=()=>{this.requestUpdate()},this._handleHashChange=()=>{let e=window.location.hash;if(e.startsWith(`#/contacts`))this.currentTab=`contacts`;else if(e.startsWith(`#/settings`))this.currentTab=`settings`;else{let t=v.getNavTabs().find(t=>e.startsWith(`#/${t.id}`));t?this.currentTab=t.id:this.currentTab=`messages`}}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)}),window.addEventListener(`hashchange`,this._handleHashChange),window.addEventListener(`plugins-updated`,this._handleStoreChange),this._handleHashChange()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),window.removeEventListener(`hashchange`,this._handleHashChange),window.removeEventListener(`plugins-updated`,this._handleStoreChange)}static{this.styles=g`
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
  `}handleTabClick(e){this.currentTab=e,this.dispatchEvent(new CustomEvent(`change-tab`,{detail:{tab:e}})),e===`messages`?window.location.hash.startsWith(`#/mailbox/`)||(window.location.hash=`#/`):window.location.hash=`#/`+e}render(){return n`
      <alps-header 
        .username=${this.username} 
        .isMobile=${this.isMobile} 
        .currentTab=${this.currentTab}
        .scrolled=${this.scrolled}
        @toggle-sidebar=${()=>this.dispatchEvent(new CustomEvent(`toggle-sidebar`))}
      >
        <div slot="left" class="header-left-slot">
          ${this.isMobile?``:n`
            <div class="logo" title="Alps">
              ${O(`edelweiss`)}
            </div>
            <div class="nav-tabs">
              <div 
                class="nav-tab ${this.currentTab===`messages`?`active`:``}"
                @click=${()=>this.handleTabClick(`messages`)}
                title=${this.i18nStore?.t(`navigation.messages`)}
              >
                ${this.i18nStore?.t(`navigation.messages`)}
              </div>
              ${v.getNavTabs().map(e=>n`
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
          .placeholder=${this.currentTab===`contacts`?this.i18nStore?.t(`contacts.title`)||`Contacts`:this.currentTab===`calendar`?this.i18nStore?.t(`calendar.title`)||`Search Calendar`:this.currentTab===`tasks`?this.i18nStore?.t(`tasks.title`):this.currentMailbox?on(this.currentMailbox,this.i18nStore,this.currentMailboxDelimiter):this.i18nStore?.t(`search.placeholder`)}
          @keydown=${e=>{e.key===`Enter`&&(e.preventDefault(),this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:e.target.value},bubbles:!0,composed:!0})))}}
          @clear=${()=>{this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:``},bubbles:!0,composed:!0}))}}
        ></alps-input>

        <div slot="right-actions">
        </div>
      </alps-header>
    `}};k([o({type:String})],mi.prototype,`username`,void 0),k([o({type:String})],mi.prototype,`currentTab`,void 0),k([o({type:Boolean})],mi.prototype,`isMobile`,void 0),k([o({type:String})],mi.prototype,`currentMailbox`,void 0),k([o({type:String})],mi.prototype,`currentMailboxDelimiter`,void 0),k([o({type:String})],mi.prototype,`searchQuery`,void 0),k([o({type:Boolean})],mi.prototype,`scrolled`,void 0),k([h({context:S})],mi.prototype,`i18nStore`,void 0),mi=k([p(`app-header`)],mi);var hi=class extends d{constructor(...e){super(...e),this.hidden=!1}static{this.styles=g`
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
  `}render(){return n`<alps-loader></alps-loader>`}};k([o({type:Boolean,reflect:!0})],hi.prototype,`hidden`,void 0),hi=k([p(`alps-initial-loader`)],hi);var V=class extends d{constructor(...e){super(...e),this.contacts=[],this.uniqueCategories=[],this.selectedCategory=``,this.filterQuery=``,this.sidebarCollapsed=!1,this.isSidebarHovered=!1,this.suppressSidebarHover=!1,this.isMobile=!1,this.activeKebabMenu=null,this.sidebarScrolled=!1}static{this.styles=[En,hn,g`
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
  `]}handleSidebarScroll(e){let t=e.target.scrollTop>0;this.sidebarScrolled!==t&&(this.sidebarScrolled=t)}render(){return n`
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
            ${[gr,_r,...this.uniqueCategories.filter(e=>e!==_r)].map(e=>{let t=e===`All Contacts`?this.contacts.length:this.contacts.filter(t=>t.categories&&t.categories.includes(e)).length,r=e===`All Contacts`||e===`Favorites`;return n`
                <div class="category-item ${e===`All Contacts`?!this.selectedCategory&&!this.filterQuery?`active`:``:this.selectedCategory===e?`active`:``} ${r?``:`has-actions`}"
                  @click=${()=>this.dispatchEvent(new CustomEvent(`select-category`,{detail:{category:e}}))}
                  draggable=${r?`false`:`true`}
                  @dragstart=${t=>{r||(t.dataTransfer?.setData(`text/plain`,e),this.dispatchEvent(new CustomEvent(`drag-start`,{detail:{category:e}})))}}
                  @dragend=${()=>{r||this.dispatchEvent(new CustomEvent(`drag-end`))}}
                >
                  <alps-icon-btn class="category-icon" icon=${e===`All Contacts`?`users`:e===`Favorites`?`starFourFill`:`folderUser`}></alps-icon-btn>
                  <span class="category-name">${e===`All Contacts`?this.i18nStore?.t(`contacts.allContacts`):e===`Favorites`?this.i18nStore?.t(`contacts.favorites`):e}</span>
                  
                  ${r?``:n`
                    <div class="category-actions ${this.activeKebabMenu===e?`popup-open`:``}" @click=${e=>e.stopPropagation()}>
                      <alps-popup 
                        align="right" 
                        position="bottom"
                        @popup-open=${()=>{this.activeKebabMenu=e}}
                        @popup-close=${()=>{this.activeKebabMenu===e&&(this.activeKebabMenu=null)}}
                      >
                        <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical"></alps-icon-btn>
                        <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.dispatchEvent(new CustomEvent(`rename-category`,{detail:{category:e}}))}}>
                          ${O(`pen`)} <span class="item-text">${this.i18nStore?.t(`contacts.rename`)}</span>
                        </button>
                        <button class="dropdown-item text-danger" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.dispatchEvent(new CustomEvent(`delete-category`,{detail:{category:e}}))}}>
                          ${O(`trash`)} <span class="item-text">${this.i18nStore?.t(`contacts.delete`)}</span>
                        </button>
                      </alps-popup>
                    </div>
                  `}

                  ${t>0||e===`Favorites`?n`<div class="category-badge">${t}</div>`:``}
                </div>
              `})}
          </div>
        </div>
      </div>
    `}};k([h({context:S})],V.prototype,`i18nStore`,void 0),k([o({type:Array})],V.prototype,`contacts`,void 0),k([o({type:Array})],V.prototype,`uniqueCategories`,void 0),k([o({type:String})],V.prototype,`selectedCategory`,void 0),k([o({type:String})],V.prototype,`filterQuery`,void 0),k([o({type:Boolean})],V.prototype,`sidebarCollapsed`,void 0),k([o({type:Boolean})],V.prototype,`isSidebarHovered`,void 0),k([o({type:Boolean})],V.prototype,`suppressSidebarHover`,void 0),k([o({type:Boolean})],V.prototype,`isMobile`,void 0),k([a()],V.prototype,`activeKebabMenu`,void 0),k([a()],V.prototype,`sidebarScrolled`,void 0),V=k([p(`alps-contacts-categories`)],V);var gi=600*1e3,_i=new class{async classify(e,t){return e.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),`failed`):e.ok?`ok`:e.status===409?`exists`:(b.error(`Failed to ${t}`,e.status),`failed`)}async createMailbox(e){try{let t=new URLSearchParams;t.append(`name`,e);let n=await T(`/mailboxes`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:t.toString()}),r=await this.classify(n,`create mailbox`);return r===`ok`&&L.syncLabels(),r}catch(e){return b.error(`Failed to create mailbox`,e),`failed`}}async renameMailbox(e,t){try{let n=await T(`/mailboxes/${D(e)}/rename`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({new_name:t})}),r=await this.classify(n,`rename mailbox`);return r===`ok`&&(L.mailboxRenamed(e,t),L.syncLabels()),r}catch(e){return b.error(`Failed to rename mailbox`,e),`failed`}}async deleteMailbox(e){try{let t=await T(`/mailboxes/${D(e)}`,{method:`DELETE`}),n=await this.classify(t,`delete mailbox`);return n===`ok`&&(L.mailboxDeleted(e),L.sync()),n===`ok`}catch(e){return b.error(`Failed to delete mailbox`,e),!1}}async emptyMailbox(e){try{let t=await T(`/mailboxes/${D(e)}/empty`,{method:`POST`},gi);if(t.status===401)return{ok:!1,reason:`auth`};if(t.ok){let e;try{let n=await t.json();typeof n?.discarded==`number`&&(e=n.discarded)}catch{}return L.sync(),{ok:!0,discarded:e}}return b.error(`Failed to empty mailbox`,t.status),{ok:!1,reason:t.status===403?`not_discardable`:`failed`}}catch(e){return b.error(`Failed to empty mailbox`,e),e?.name===`AbortError`?(L.sync(),{ok:!1,reason:`timeout`}):{ok:!1,reason:`failed`}}}async setSubscribed(e,t){let n=t?`subscribe`:`unsubscribe`;try{let t=await T(`/mailboxes/${D(e)}/${n}`,{method:`PUT`});return t.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),{ok:!1,reason:`auth`}):t.ok?(L.syncLabels(),{ok:!0}):(b.error(`Failed to ${n} mailbox`,t.status),{ok:!1,reason:`failed`})}catch(e){return b.error(`Failed to ${n} mailbox`,e),{ok:!1,reason:`failed`}}}};async function vi(e,t){let n=new Map,r=null;for(let i=0;i<t.length;i+=200){let a=t.slice(i,i+200).map(encodeURIComponent).join(`,`),o=await T(`/mailboxes/${D(e)}/verdicts?uids=${a}`);if(!o.ok)throw Error(`verdicts request failed: ${o.status}`);let s=await o.json(),c=typeof s?.Scope==`string`?s.Scope:``;if(r!==null&&c!==r)throw Error(`verdicts were answered under different scopes`);r=c;for(let[e,t]of Object.entries(s?.Verdicts??{})){let r=t??{};n.set(e,{HasBimiPotential:r.HasBimiPotential===!0,HasBimiFailed:r.HasBimiFailed===!0})}}return{verdicts:n,scope:r??``}}function H(e,t){return`${e??``} ${String(t)}`}function yi(e){let t=e.indexOf(`\0`);return t===-1?{mailbox:``,uid:e}:{mailbox:e.slice(0,t),uid:e.slice(t+1)}}function bi(e){let t=new Map;for(let n of e){let{mailbox:e,uid:r}=yi(n),i=t.get(e);i?i.push(r):t.set(e,[r])}return t}function xi(e,t){return typeof e?.Mailbox==`string`&&e.Mailbox?e.Mailbox:t}var Si=class extends d{constructor(...e){super(...e),this.name=``,this.color=``}static{this.styles=g`
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
  `}render(){return n`
      <div class="tag-pill" style="background-color: ${this.color}" title=${this.name}>
        ${this.name}
      </div>
    `}};k([o({type:String})],Si.prototype,`name`,void 0),k([o({type:String})],Si.prototype,`color`,void 0),Si=k([p(`alps-tag`)],Si);var Ci=class extends d{constructor(...e){super(...e),this.currentPage=0,this.totalItems=0,this.itemsPerPage=50,this.currentCount=0,this.isSearch=!1,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=g`
    /* Sized by its content and pushed to the end of the toolbar, rather than
       stretched across whatever room is left. Stretched, the count sat in the
       middle of that space (margin: 0 auto) with the arrows far off at the
       right edge, so the two halves of one control read as unrelated. */
    :host {
      display: inline-flex;
      align-items: center;
      margin-left: auto;
      flex-shrink: 0;
    }

    .pagination-container {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-muted);
      user-select: none;
    }

    .pagination-controls {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .pagination-text {
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
  `}changePage(e){let t=this.currentPage+e;t>=0&&t<Math.ceil(this.totalItems/this.itemsPerPage)&&this.dispatchEvent(new CustomEvent(`change-page`,{detail:{page:t},bubbles:!0,composed:!0}))}get knownTotal(){return this.totalItems>0?this.totalItems:void 0}get hasPrev(){return this.currentPage>0}get hasNext(){let e=this.knownTotal;return e===void 0?!1:(this.currentPage+1)*this.itemsPerPage<e}get rangeText(){let e=this.currentCount>0?this.currentCount:0;if(e===0)return this.i18nStore?.t(`pagination.zeroMessages`)||`0 messages`;if(!this.hasPrev&&!this.hasNext){let t=this.isSearch?e:this.knownTotal??e,n=this.isSearch?`pagination.searchResults`:`pagination.totalCount`,r=this.isSearch?`{total} results`:`{total} total`;return(this.i18nStore?.t(n)||r).replace(`{total}`,String(t))}let t=this.currentPage*this.itemsPerPage+1,n=t+e-1,r=this.knownTotal;return r===void 0?`${t}\u2013${n}`:(this.i18nStore?.t(`pagination.rangeOfTotal`)||`{start}–{end} of {total}`).replace(`{start}`,String(t)).replace(`{end}`,String(n)).replace(`{total}`,String(r))}render(){let e=this.rangeText;return n`
      <div class="pagination-container">
        <div class="pagination-text" title="${e}">${e}</div>
        <div class="pagination-controls">
          <alps-icon-btn 
            title=${this.i18nStore?.t(`pagination.previousPage`)} 
            ?disabled=${!this.hasPrev} 
            @click=${()=>this.changePage(-1)}
            icon="caretLeft"
            style="--icon-size: 16px;"
          ></alps-icon-btn>
          <alps-icon-btn 
            title=${this.i18nStore?.t(`pagination.nextPage`)} 
            ?disabled=${!this.hasNext} 
            @click=${()=>this.changePage(1)}
            icon="caretRight"
            style="--icon-size: 16px;"
          ></alps-icon-btn>
        </div>
      </div>
    `}};k([o({type:Number})],Ci.prototype,`currentPage`,void 0),k([o({type:Number})],Ci.prototype,`totalItems`,void 0),k([o({type:Number})],Ci.prototype,`itemsPerPage`,void 0),k([o({type:Number})],Ci.prototype,`currentCount`,void 0),k([o({type:Boolean})],Ci.prototype,`isSearch`,void 0),k([h({context:S})],Ci.prototype,`i18nStore`,void 0),Ci=k([p(`alps-pagination`)],Ci);var wi=class extends d{constructor(...e){super(...e),this.variant=`info`}static{this.styles=g`
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

    .banner.warning {
      border-left: 3px solid var(--warning, #f59e0b);
      padding-left: 13px;
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
  `}render(){return n`
      <div class="banner ${this.variant}">
        <div class="content">
          <slot></slot>
        </div>
        <div class="actions">
          <slot name="action"></slot>
        </div>
      </div>
    `}};k([o({type:String,reflect:!0})],wi.prototype,`variant`,void 0),wi=k([p(`alps-banner`)],wi);var Ti=new Set([`is:starred`,`is:unread`]),U=class extends d{constructor(...e){super(...e),this.messages=[],this.currentMailbox=``,this.currentMailboxDelimiter=``,this.currentMailboxRole=``,this.loading=!1,this.selectedMessage=null,this.layoutMode=`vertical`,this.isMobile=!1,this.sidebarCollapsed=!1,this.currentPage=0,this.listedPage=0,this.totalMessages=0,this.messagesPerPage=50,this.filterQuery=``,this.sortOrder=`desc`,this.densityMode=`compact`,this.showSenderAvatars=!0,this.selectedMessages=new Set,this.selectAllMatching=!1,this.matchingCount=0,this.syncing=!1,this.loadFailed=!1,this.isSpinning=!1,this.isScrolled=!1,this.isAtBottom=!1,this.focusedIndex=-1,this.showEmptyConfirm=!1,this.emptying=!1,this.expandedThreads=new Set,this.verdicts=new Map,this.verdictScopes=new Map,this.verdictsAsked=new Set,this.verdictGeneration=0,this.verdictsRunning=!1,this.verdictsRerun=!1,this._shouldScrollToTop=!1,this._uidsBeforeCheck=null,this._arrivedIndex=-1,this._handleStoreChange=()=>{this.requestUpdate()},this.handleSyncStart=()=>{this.syncing=!0,this.isSpinning=!0},this.handleSyncEnd=()=>{this.syncing=!1},this.handleSpinIteration=()=>{this.syncing||(this.isSpinning=!1)},this.handleScroll=e=>{this.checkScrollState(e.target)}}static{this.styles=g`
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

    .mailbox-badge {
      display: inline-flex;
      align-items: center;
      background: var(--bg-tertiary, #f3f4f6);
      color: var(--text-secondary, #4b5563);
      font-size: 10px;
      font-weight: 500;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid var(--border-color, #e5e7eb);
      margin-right: 6px;
      flex-shrink: 0;
      text-transform: capitalize;
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
      box-sizing: content-box;
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

    .empty-state.load-error {
      flex-direction: column;
      gap: 12px;
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
  `}get visibleMessages(){let e=[];for(let t of this.messages||[])e.push(t),t.SubMessages&&t.SubMessages.length>0&&this.isThreadExpanded(String(t.UID))&&e.push(...t.SubMessages);return e}resetVerdicts(){this.verdicts=new Map,this.verdictsAsked=new Set,this.verdictScopes=new Map,this.verdictGeneration++}mailboxOf(e){return xi(e,this.currentMailbox)}keyOf(e){return H(this.mailboxOf(e),e?.UID)}async refreshVerdicts(){if(this.verdictsRunning){this.verdictsRerun=!0;return}this.verdictsRunning=!0;try{await this.askVerdicts()}finally{this.verdictsRunning=!1,this.verdictsRerun&&(this.verdictsRerun=!1,this.refreshVerdicts())}}get drawsAvatars(){return this.showSenderAvatars&&this.densityMode!==`ultra-compact`}async askVerdicts(){let e=this.currentMailbox;if(!e||!this.drawsAvatars)return;let t=this.verdictGeneration,n=()=>e===this.currentMailbox&&t===this.verdictGeneration,r=new Map,i=t=>{let n=t?.UID==null?``:String(t.UID),i=this.mailboxOf(t);if(!n||e!==`*`&&i!==e)return;let a=H(i,n);this.verdictsAsked.has(a)||!dn(t)||(this.verdictsAsked.add(a),r.has(i)||r.set(i,[]),r.get(i).push(n))};for(let e of this.messages||[])i(e),e?.SubMessages?.length&&this.isThreadExpanded(String(e.UID))&&e.SubMessages.forEach(i);let a=[];for(let[e,t]of r)for(let n of t)a.push({mailbox:e,uid:n});let o=e=>{for(let t of a.slice(e))this.verdictsAsked.delete(H(t.mailbox,t.uid))},s=0;for(;s<a.length;){if(this.loading){o(s);return}let e=a[s].mailbox,t=s;for(;t<a.length&&t-s<3&&a[t].mailbox===e;)t++;let r=a.slice(s,t).map(e=>e.uid),i;try{i=await vi(e,r)}catch{n()&&o(s);return}if(!n())return;let c=new Map(this.verdicts),l=this.verdictScopes.get(e),u=!1;if(i.scope&&l&&i.scope!==l){let n=H(e,``);for(let e of[...c.keys()])e.startsWith(n)&&c.delete(e);for(let e of[...this.verdictsAsked])e.startsWith(n)&&this.verdictsAsked.delete(e);for(let t of r)this.verdictsAsked.add(H(e,t));o(t),u=!0}i.scope&&this.verdictScopes.set(e,i.scope);for(let[t,n]of i.verdicts)c.set(H(e,t),n);if(this.verdicts=c,u){this.verdictsRerun=!0;return}s=t}}withVerdict(e){let t=this.verdicts.get(H(this.mailboxOf(e),String(e?.UID)));return t?{...e,...t}:e}isThreadExpanded(e){return this.expandedThreads.has(e)}toggleThreadCollapse(e,t){e.stopPropagation();let n=new Set(this.expandedThreads);n.has(t)?n.delete(t):n.add(t),this.expandedThreads=n}rowKeys(e){let t=this.keyOf(e);return!e.SubMessages?.length||this.isThreadExpanded(String(e.UID))?[t]:[t,...e.SubMessages.map(e=>this.keyOf(e))]}rowMessages(e){return!e.SubMessages?.length||this.isThreadExpanded(String(e.UID))?[e]:[e,...e.SubMessages]}rowSelection(e){let t=this.rowKeys(e),n=t.filter(e=>this.selectedMessages.has(e)).length;return n===0?`none`:n===t.length?`all`:`some`}toggleRow(e){let t=this.rowKeys(e),n=this.rowSelection(e)===`all`,r=new Set(this.selectedMessages);for(let e of t)n?r.delete(e):r.add(e);this.setSelection(r)}get pageKeys(){let e=[];for(let t of this.messages||[]){e.push(this.keyOf(t));for(let n of t.SubMessages||[])e.push(this.keyOf(n))}return e}get allOnPageSelected(){let e=this.pageKeys;return e.length>0&&e.every(e=>this.selectedMessages.has(e))}get canSelectAllMatching(){return this.currentMailbox!==`*`&&this.totalMessages>this.pageKeys.length}handleSelectAll(e){let t=e.target.checked;if(!t&&this.selectAllMatching){this.dispatchEvent(new CustomEvent(`clear-selection`));return}this.setSelection(t?new Set(this.pageKeys):new Set)}setSelection(e){this.selectedMessages=e,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedKeys:e}}))}isOpen(e){return!!this.selectedMessage&&this.keyOf(this.selectedMessage)===this.keyOf(e)}connectedCallback(){super.connectedCallback(),L.addEventListener(`sync-start`,this.handleSyncStart),L.addEventListener(`sync-success`,this.handleSyncEnd),L.addEventListener(`sync-error`,this.handleSyncEnd),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),L.removeEventListener(`sync-start`,this.handleSyncStart),L.removeEventListener(`sync-success`,this.handleSyncEnd),L.removeEventListener(`sync-error`,this.handleSyncEnd),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}willUpdate(e){if(super.willUpdate(e),e.has(`currentMailbox`)&&this.resetVerdicts(),(e.has(`currentMailbox`)||e.has(`currentPage`)||e.has(`filterQuery`)||e.has(`sortOrder`))&&(!this.selectAllMatching&&this.selectedMessages.size>0&&this.setSelection(new Set),this._shouldScrollToTop=!0,this._uidsBeforeCheck=null),this._uidsBeforeCheck&&e.has(`syncing`)&&!this.syncing){let t=this._uidsBeforeCheck;if(this._uidsBeforeCheck=null,e.has(`messages`)){let e=(this.messages||[]).findIndex(e=>Number(e.UID)>(t.get(this.mailboxOf(e))??0));e!==-1&&(this._arrivedIndex=this.visibleMessages.indexOf(this.messages[e]))}}if(e.has(`selectedMessage`)||e.has(`messages`)){if(e.has(`messages`)&&this.messages&&!this.selectAllMatching&&this.selectedMessages.size>0){let e=new Set(this.pageKeys),t=new Set([...this.selectedMessages].filter(t=>e.has(t)));t.size!==this.selectedMessages.size&&this.setSelection(t)}if(this.selectedMessage){if(this.messages){let e=!1,t=new Set(this.expandedThreads);for(let n of this.messages)if(n.SubMessages&&n.SubMessages.some(e=>this.isOpen(e))){let r=String(n.UID);t.has(r)||(t.add(r),e=!0)}e&&(this.expandedThreads=t)}let e=this.visibleMessages;if(e.length>0){let t=e.findIndex(e=>this.isOpen(e));t!==-1&&(this.focusedIndex=t)}}}}checkScrollState(e){if(!e)return;let t=e.scrollTop>0;this.isScrolled!==t&&(this.isScrolled=t,this.dispatchEvent(new CustomEvent(`list-scrolled`,{detail:{scrolled:t}})));let n=e.scrollHeight<=e.clientHeight||Math.ceil(e.scrollTop+e.clientHeight)>=e.scrollHeight;this.isAtBottom!==n&&(this.isAtBottom=n)}updated(e){super.updated(e),(e.has(`messages`)||e.has(`expandedThreads`)||e.has(`currentMailbox`)||e.has(`showSenderAvatars`)||e.has(`densityMode`)||e.has(`loading`)&&!this.loading)&&this.refreshVerdicts(),e.has(`densityMode`)&&(this.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),this.classList.add(`density-${this.densityMode}`)),e.has(`syncing`)&&this.syncing&&(this.isSpinning=!0);let t=e.get(`selectedMessage`);if(e.has(`selectedMessage`)&&this.selectedMessage&&!(t&&this.isOpen(t))&&setTimeout(()=>{let e=this.renderRoot.querySelector(`.list-content`)?.querySelector(`.message-item.active`);e&&e.scrollIntoView({behavior:`smooth`,block:`center`})},50),this._shouldScrollToTop&&(e.has(`messages`)||e.has(`loading`)&&!this.loading)){let e=this.renderRoot.querySelector(`.list-content`);e&&(e.scrollTop=0),this._shouldScrollToTop=!1}if(this._arrivedIndex!==-1){let e=this._arrivedIndex;this._arrivedIndex=-1;let t=this.renderRoot.querySelector(`.list-content`);e===0?t&&(t.scrollTop=0):t?.querySelectorAll(`.message-item`)[e]?.scrollIntoView({block:`nearest`})}let n=this.renderRoot.querySelector(`.list-content`);n&&requestAnimationFrame(()=>{this.checkScrollState(n)})}checkForNew(){let e=new Map;for(let t of this.messages||[]){let n=this.mailboxOf(t);e.set(n,Math.max(e.get(n)??0,Number(t.UID)||0))}this._uidsBeforeCheck=e,this.dispatchEvent(new CustomEvent(`refresh`))}selectMessage(e){this.selectedMessages.size>0&&this.setSelection(new Set),this.dispatchEvent(new CustomEvent(`select-message`,{detail:{message:e}}))}handleKeyDown(e){let t=this.visibleMessages;!t||t.length===0||(e.key===`ArrowDown`?(e.preventDefault(),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused()):e.key===`ArrowUp`?(e.preventDefault(),this.focusedIndex=Math.max(0,this.focusedIndex-1),this.scrollToFocused()):e.key===`Enter`?(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length&&this.selectMessage(t[this.focusedIndex])):e.key===` `&&(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length&&(this.toggleRow(t[this.focusedIndex]),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused())))}get countsConversations(){return this.messages.some(e=>(e?.ThreadCount??0)>0)}get emptyConfirmMessage(){let e=this.currentMailbox,t=this.totalMessages,n=this.countsConversations?`messageList.emptyMailboxConfirmConversations`:`messageList.emptyMailboxConfirm`,r=this.i18nStore?.t(n,{folder:e,count:t})||(this.countsConversations?`Are you sure you want to permanently delete all ${t} conversations in ${e}, and every message in them? This action cannot be undone.`:`Are you sure you want to permanently delete all ${t} messages in ${e}? This action cannot be undone.`),i=this.selectedMessages.size;return i===0?r:`${r} ${this.i18nStore?.t(`messageList.emptyMailboxSelectionNote`,{count:i})||`This includes the ${i} messages you have checked.`}`}toast(e,t){this.dispatchEvent(new CustomEvent(`toast`,{detail:{type:e,message:t},bubbles:!0,composed:!0}))}async handleEmptyMailbox(){if(this.emptying)return;this.showEmptyConfirm=!1,this.emptying=!0;let e=this.currentMailbox;this.toast(`info`,this.i18nStore?.t(`messageList.emptyingMailbox`)||`Emptying mailbox...`);try{let t=await _i.emptyMailbox(e);t.ok&&t.discarded===0?this.toast(`info`,this.i18nStore?.t(`messageList.mailboxAlreadyEmpty`,{folder:e})||`${e} was already empty — nothing was deleted.`):t.ok?this.toast(`success`,this.i18nStore?.t(`messageList.mailboxEmptied`)||`Mailbox emptied successfully.`):t.reason===`timeout`?this.toast(`error`,this.i18nStore?.t(`messageList.emptyMailboxSlow`,{folder:e})||`Still emptying ${e}. The server is working on it — check the folder again in a moment.`):t.reason!==`auth`&&this.toast(`error`,this.i18nStore?.t(`messageList.emptyMailboxFailed`)||`Failed to empty mailbox. Make sure it is Trash or Junk.`)}finally{this.emptying=!1}}scrollToFocused(){this.updateComplete.then(()=>{let e=this.renderRoot.querySelector(`.message-item.focused`);e&&e.scrollIntoView({block:`nearest`})})}get isDiscardableFolder(){return this.currentMailboxRole===`trash`||this.currentMailboxRole===`junk`}renderMessageItem(e,t=!1,r=!1,i=!1){let a=this.currentMailboxRole===`drafts`||this.currentMailboxRole===`sent`,o=[];a?(o=[...e.Envelope?.To||[],...e.Envelope?.Cc||[]],o.length||(o=e.Envelope?.From||[])):o=[...e.Envelope?.From||[],...e.Envelope?.To||[],...e.Envelope?.Cc||[]];let s=new Set,c=[];for(let e of o){let t=(e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``)||e.Name||`unknown`;t!==`unknown`&&!s.has(t)?(s.add(t),c.push(e)):t===`unknown`&&c.push(e)}let l=this.settingsStore?.getState()?.loginUsername?.toLowerCase()||``,u=e=>{let t=e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``;return!!(l&&t===l)};if(c.length>1){let e=c.filter(e=>!u(e));e.length>0&&(c=e)}c.length||(c=[{}]);let d=a?`messageReader.noRecipients`:`messageList.unknownSender`,f=c.map(e=>{let t=e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`:``;return e.Name||t||this.i18nStore?.t(d)||this.i18nStore?.t(`messageList.unknown`)}).join(`, `),p=this.isMobile?1:3,m=c.slice(0,p),h=c.length-p,ee=m.length+ +(h>0),g=e.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`),te=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,ne=String(this.settingsStore?.getState()?.hourFormat||`12`),re=e.Envelope?.Date?rn(e.Envelope.Date,te,ne):``,_=e.RFC822Size||e.Size,v=_?cn(_):``,y=e.SubMessages&&e.SubMessages.length>0,ie=this.isThreadExpanded(String(e.UID)),ae=this.rowSelection(e),oe=e=>!e?.Flags||!e.Flags.includes(`\\Seen`),se=oe(e)||!t&&!!y&&!ie&&e.SubMessages.some(oe),ce=this.rowMessages(e).some(e=>e.Flags?.includes(z)),le=e.Flags&&e.Flags.includes(`\\Answered`),ue=e.Flags&&e.Flags.includes(`$Forwarded`),de=Pr(e.Flags,this.i18nStore),fe=this.densityMode===`loose`?48:this.densityMode===`compact`?24:40;return this.densityMode===`ultra-compact`?n`
      <div class="message-item ${t?`sub-message-item`:``} ${r?`first-sub-item`:``} ${i?`last-sub-item`:``} ${this.selectedMessages.size===0&&this.isOpen(e)||ae!==`none`?`active`:``} ${se?`unread`:``} ${ce?`starred`:``} ${this.focusedIndex===this.visibleMessages.indexOf(e)?`focused`:``}" @click=${()=>this.selectMessage(e)}>
        <div class="checkbox-col" @click=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
          <input type="checkbox" class="message-checkbox" 
            .checked=${ae===`all`}
            .indeterminate=${ae===`some`}
            @click=${e=>e.stopPropagation()}
            @change=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
        </div>

        <!-- Caret Toggle Button -->
        ${!t&&y?n`
          <div class="caret-col" @click=${t=>this.toggleThreadCollapse(t,String(e.UID))}>
            ${O(ie?`caretDown`:`caretRight`)}
            <span class="thread-count-caret-badge" title="${e.ThreadCount} messages">${e.ThreadCount}</span>
          </div>
        `:t?n`<div class="caret-col empty"></div>`:``}

        <div class="message-sender">${f}</div>
        <div @click=${t=>this.toggleStar(t,e)} class="star-btn ${ce?`starred`:``} star-btn-wrapper-ultra">
          ${O(ce?`starFourFill`:`starFour`)}
        </div>
        ${le||ue?n`
          <div class="indicators-wrapper-ultra">
            ${le?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.replied`)}>${O(`arrowBendUpLeft`)}</div>`:``}
            ${ue?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.forwarded`)}>${O(`arrowBendUpRight`)}</div>`:``}
          </div>
        `:``}
        ${de.length>0?n`
          <div class="tag-pills">
            ${de.map(e=>n`
              <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
            `)}
          </div>
        `:``}
        ${this.currentMailbox===`*`&&e.Mailbox?n`
          <span class="mailbox-badge" title="Folder: ${e.Mailbox}">${e.Mailbox}</span>
        `:``}
        <div class="message-subject">
          ${g}
        </div>
        <div class="message-indicators">
          <div class="attachment-col">
            ${e.HasAttachments?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.hasAttachments`)}>${O(`paperclipHorizontal`)}</div>`:``}
          </div>
          <div class="message-date">${re}</div>
        </div>
      </div>
      `:n`
    <div class="message-item ${t?`sub-message-item`:``} ${r?`first-sub-item`:``} ${i?`last-sub-item`:``} ${this.selectedMessages.size===0&&this.isOpen(e)||ae!==`none`?`active`:``} ${se?`unread`:``} ${ce?`starred`:``} ${this.focusedIndex===this.visibleMessages.indexOf(e)?`focused`:``}" @click=${()=>this.selectMessage(e)}>
      <div class="checkbox-col" @click=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
        <input type="checkbox" class="message-checkbox" 
          .checked=${ae===`all`}
          .indeterminate=${ae===`some`}
          @click=${e=>e.stopPropagation()}
          @change=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
      </div>

      <!-- Caret Toggle Button -->
      ${!t&&y?n`
        <div class="caret-col" @click=${t=>this.toggleThreadCollapse(t,String(e.UID))}>
          ${O(ie?`caretDown`:`caretRight`)}
          <span class="thread-count-caret-badge" title="${e.ThreadCount} messages">${e.ThreadCount}</span>
        </div>
      `:t?n`<div class="caret-col empty"></div>`:``}

      ${this.showSenderAvatars?n`
        <div class="avatar-stack">
          ${m.map((t,r)=>{let i=t.Mailbox&&t.Host?`${t.Mailbox}@${t.Host}`:``,a=t.Name||i||this.i18nStore?.t(d)||this.i18nStore?.t(`messageList.unknown`),o=fn(this.withVerdict(e),t);return n`
              <div class="avatar-wrapper" style="z-index: ${ee-r};">
                <alps-avatar .name=${a} .email=${i} .size=${fe} .src=${o}></alps-avatar>
              </div>
            `})}
          ${h>0?n`
            <div class="avatar-wrapper extra-count" style="width: ${fe}px; height: ${fe}px; z-index: 0;">
              +${h}
            </div>
          `:``}
        </div>
      `:``}
      <div class="message-details">
        <div class="message-header-row">
          <div class="message-header-inner">
            <div class="message-sender">${f}</div>
            <div @click=${t=>this.toggleStar(t,e)} class="star-btn ${ce?`starred`:``}">
              ${O(ce?`starFourFill`:`starFour`)}
            </div>
          </div>
          <div class="message-indicators">
            <div class="attachment-col">
              ${e.HasAttachments?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.hasAttachments`)}>${O(`paperclipHorizontal`)}</div>`:``}
            </div>
            <div class="message-date">${re}</div>
          </div>
        </div>
        <div class="message-subject-row">
          ${le||ue?n`
            <div class="indicators-wrapper">
              ${le?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.replied`)}>${O(`arrowBendUpLeft`)}</div>`:``}
              ${ue?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.forwarded`)}>${O(`arrowBendUpRight`)}</div>`:``}
            </div>
          `:``}
          ${de.length>0?n`
            <div class="tag-pills">
              ${de.map(e=>n`
                <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
              `)}
            </div>
          `:``}
          ${this.currentMailbox===`*`&&e.Mailbox?n`
            <span class="mailbox-badge" title="Folder: ${e.Mailbox}">${e.Mailbox}</span>
          `:``}
          <div class="message-subject">
            ${g}
          </div>
          ${v?n`<div class="message-size">${v}</div>`:``}
        </div>
      </div>
    </div>
    `}toggleStar(e,t){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-star-message`,{detail:{message:t,messages:this.rowMessages(t)}}))}get isTextSearch(){return this.filterQuery!==``&&!Ti.has(this.filterQuery)}render(){return n`
      ${this.isMobile?``:n`
        <alps-toolbar class="list-header" ?scrolled=${this.isScrolled}>
          <input type="checkbox" class="select-all-checkbox" title=${this.i18nStore?.t(`messageList.selectAll`)}
            .checked=${this.allOnPageSelected}
            @change=${this.handleSelectAll}>
          <alps-icon-btn 
            title=${this.i18nStore?.t(`messageList.checkNew`)}
            @click=${()=>this.checkForNew()}
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
          ${this.sidebarCollapsed?n`
            <div class="current-mailbox-label">
              ${on(this.currentMailbox,this.i18nStore,this.currentMailboxDelimiter)}
            </div>
          `:``}
          <alps-pagination 
            .currentPage=${this.listedPage} 
            .totalItems=${this.totalMessages} 
            .itemsPerPage=${this.messagesPerPage}
            .currentCount=${this.messages.length}
            .isSearch=${this.isTextSearch}>
          </alps-pagination>
        </alps-toolbar>
      `}
      <div class="list-content ${this.loading&&this.messages.length>0?`loading-overlay`:``}" tabindex="0" @scroll=${this.handleScroll} @keydown=${this.handleKeyDown}>
        ${this.filterQuery?n`
          <alps-banner>
            <span>${this.i18nStore?.t(`messageList.searchResultsFor`)} <strong>${this.filterQuery}</strong></span>
            ${this.currentMailbox!==`*`&&this.settingsStore?.getState()?.hasESearchCapability?n`
              <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:this.filterQuery,global:!0},bubbles:!0,composed:!0}))}>
                ${this.i18nStore?.t(`messageList.searchAllMailboxes`)||`Search All Mailboxes`}
              </alps-button>
            `:``}
            <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`clear-search`))}>
              ${this.i18nStore?.t(`messageList.clearSearch`)}
            </alps-button>
          </alps-banner>
        `:``}
        ${this.selectAllMatching?n`
          <alps-banner>
            <span>${this.i18nStore?.t(`messageList.allMatchingSelected`,{count:this.matchingCount,folder:on(this.currentMailbox,this.i18nStore,this.currentMailboxDelimiter)})}</span>
            <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`clear-selection`))}>
              ${this.i18nStore?.t(`messageList.clearSelection`)}
            </alps-button>
          </alps-banner>
        `:this.selectedMessages.size>0&&this.allOnPageSelected&&this.canSelectAllMatching?n`
          <alps-banner>
            <span>${this.i18nStore?.t(`messageList.allOnPageSelected`,{count:this.pageKeys.length})}</span>
            <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`select-all-matching`))}>
              ${this.i18nStore?.t(`messageList.selectAllMatching`,{count:this.totalMessages,folder:on(this.currentMailbox,this.i18nStore,this.currentMailboxDelimiter)})}
            </alps-button>
          </alps-banner>
        `:``}
        ${!this.filterQuery&&this.isDiscardableFolder&&this.totalMessages>0?n`
          <alps-banner variant="warning">
            <span>${this.i18nStore?.t(this.countsConversations?`messageList.totalConversationsIn`:`messageList.totalMessagesIn`,{count:this.totalMessages,folder:this.currentMailbox})||`${this.totalMessages} total ${this.countsConversations?`conversations`:`messages`} in ${this.currentMailbox}`}</span>
            <alps-button slot="action" variant="normal"
              ?spinning=${this.emptying}
              @click=${()=>this.showEmptyConfirm=!0}>
              ${this.i18nStore?.t(`messageList.deleteAllNow`)||`Delete All Now`}
            </alps-button>
          </alps-banner>
        `:``}
        ${this.loading&&this.messages.length===0?n`
          <alps-loader full-height .text=${this.i18nStore?.t(`messageList.loading`)||`Loading...`}></alps-loader>
        `:this.messages.length===0&&this.loadFailed?n`<div class="empty-state load-error">
          <div>${this.i18nStore?.t(`messageList.loadError`)}</div>
          <alps-button variant="normal" @click=${()=>this.checkForNew()}>
            ${this.i18nStore?.t(`messageList.loadErrorRetry`)}
          </alps-button>
        </div>`:this.messages.length===0?n`<div class="empty-state">${this.i18nStore?.t(`messageList.noMessages`)}</div>`:f(this.messages,e=>this.keyOf(e),e=>n`
            ${this.renderMessageItem(e,!1)}
            ${e.SubMessages&&e.SubMessages.length>0&&this.isThreadExpanded(String(e.UID))?e.SubMessages.map((t,n)=>this.renderMessageItem(t,!0,n===0,n===e.SubMessages.length-1)):``}
          `)}
      </div>
      ${this.isMobile&&this.messages.length>0?n`
        <div class="mobile-bottom-header ${this.isAtBottom?`at-bottom`:``}">
          ${this.selectedMessages.size>0?n`
            <slot name="mobile-bulk-actions"></slot>
          `:n`
            <div class="mobile-bottom-actions">
              <input type="checkbox" class="select-all-checkbox" title=${this.i18nStore?.t(`messageList.selectAll`)}
                .checked=${this.allOnPageSelected}
                @change=${this.handleSelectAll}>
              <alps-icon-btn 
                title=${this.i18nStore?.t(`messageList.checkNew`)}
                @click=${()=>this.checkForNew()}
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

            <alps-pagination 
              .currentPage=${this.listedPage} 
              .totalItems=${this.totalMessages} 
              .itemsPerPage=${this.messagesPerPage}
              .currentCount=${this.messages.length}
              .isSearch=${this.isTextSearch}>
            </alps-pagination>
          `}
        </div>
      `:``}
      ${this.showEmptyConfirm?n`
        <ui-confirm
          title=${this.i18nStore?.t(`messageList.emptyMailboxTitle`,{folder:this.currentMailbox})||`Empty ${this.currentMailbox}`}
          message=${this.emptyConfirmMessage}
          confirmText=${this.i18nStore?.t(`messageList.deleteAllNow`)||`Delete All Now`}
          .isDanger=${!0}
          @confirm=${this.handleEmptyMailbox}
          @cancel=${()=>this.showEmptyConfirm=!1}
        ></ui-confirm>
      `:``}
    `}};k([h({context:C})],U.prototype,`settingsStore`,void 0),k([h({context:S})],U.prototype,`i18nStore`,void 0),k([o({type:Array})],U.prototype,`messages`,void 0),k([o({type:String})],U.prototype,`currentMailbox`,void 0),k([o({type:String})],U.prototype,`currentMailboxDelimiter`,void 0),k([o({type:String})],U.prototype,`currentMailboxRole`,void 0),k([o({type:Boolean})],U.prototype,`loading`,void 0),k([o({type:Object})],U.prototype,`selectedMessage`,void 0),k([o({type:String})],U.prototype,`layoutMode`,void 0),k([o({type:Boolean})],U.prototype,`isMobile`,void 0),k([o({type:Boolean})],U.prototype,`sidebarCollapsed`,void 0),k([o({type:Number})],U.prototype,`currentPage`,void 0),k([o({type:Number})],U.prototype,`listedPage`,void 0),k([o({type:Number})],U.prototype,`totalMessages`,void 0),k([o({type:Number})],U.prototype,`messagesPerPage`,void 0),k([o({type:String})],U.prototype,`filterQuery`,void 0),k([o({type:String})],U.prototype,`sortOrder`,void 0),k([o({type:String})],U.prototype,`densityMode`,void 0),k([o({type:Boolean})],U.prototype,`showSenderAvatars`,void 0),k([o({type:Object})],U.prototype,`selectedMessages`,void 0),k([o({type:Boolean})],U.prototype,`selectAllMatching`,void 0),k([o({type:Number})],U.prototype,`matchingCount`,void 0),k([o({type:Boolean})],U.prototype,`syncing`,void 0),k([o({type:Boolean})],U.prototype,`loadFailed`,void 0),k([a()],U.prototype,`isSpinning`,void 0),k([a()],U.prototype,`isScrolled`,void 0),k([a()],U.prototype,`isAtBottom`,void 0),k([a()],U.prototype,`focusedIndex`,void 0),k([a()],U.prototype,`showEmptyConfirm`,void 0),k([a()],U.prototype,`emptying`,void 0),k([a()],U.prototype,`expandedThreads`,void 0),k([a()],U.prototype,`verdicts`,void 0),U=k([p(`alps-message-list`)],U);var W=class extends d{constructor(...e){super(...e),this.contacts=[],this.selectedCategory=``,this.filterQuery=``,this.sortOrder=`asc`,this.showOnlyStarred=!1,this.isMobile=!1,this.densityMode=`compact`,this.selectedContacts=new Set,this.selectedContact=null,this.isSpinning=!1,this.loading=!1,this.listScrolled=!1,this.focusedIndex=-1}getFilteredContacts(){let e=this.contacts.filter(e=>{if(this.selectedCategory&&(!e.categories||!e.categories.includes(this.selectedCategory))||this.showOnlyStarred&&(!e.categories||!e.categories.includes(`Favorites`)))return!1;if(this.filterQuery){let t=this.filterQuery.toLowerCase();if(!(e.name||``).toLowerCase().includes(t)&&!(e.email||``).toLowerCase().includes(t)&&!(e.nickname||``).toLowerCase().includes(t)&&!(e.organization||``).toLowerCase().includes(t))return!1}return!0});return e.sort((e,t)=>{let n=(e.name||e.email||``).toLowerCase(),r=(t.name||t.email||``).toLowerCase();return n<r?this.sortOrder===`asc`?-1:1:n>r?this.sortOrder===`asc`?1:-1:0}),e}willUpdate(e){if(super.willUpdate(e),e.has(`selectedContact`)||e.has(`contacts`)||e.has(`selectedCategory`)||e.has(`filterQuery`)||e.has(`sortOrder`)||e.has(`showOnlyStarred`)){let e=this.getFilteredContacts();if(this.selectedContact&&e.length>0){let t=e.findIndex(e=>e.path===this.selectedContact.path);t===-1?this.focusedIndex=-1:this.focusedIndex=t}else this.focusedIndex=-1}}updated(e){super.updated(e),e.has(`densityMode`)&&(this.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),this.classList.add(`density-${this.densityMode}`))}static{this.styles=[U.styles,g`
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
  `]}formatRevision(e){if(!e)return``;let t=e;t.length===16&&t.indexOf(`-`)===-1&&(t=`${t.slice(0,4)}-${t.slice(4,6)}-${t.slice(6,8)}T${t.slice(9,11)}:${t.slice(11,13)}:${t.slice(13,16)}`);let n=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,r=String(this.settingsStore?.getState()?.hourFormat||`12`);return rn(new Date(t),n,r)}handleKeyDown(e){let t=this.getFilteredContacts();if(t.length!==0){if(e.key===`ArrowDown`)e.preventDefault(),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused();else if(e.key===`ArrowUp`)e.preventDefault(),this.focusedIndex=Math.max(0,this.focusedIndex-1),this.scrollToFocused();else if(e.key===`Enter`)e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length&&this.dispatchEvent(new CustomEvent(`select-contact`,{detail:{contact:t[this.focusedIndex]}}));else if(e.key===` `&&(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length)){let n=t[this.focusedIndex];n.isTemporary||this.dispatchEvent(new CustomEvent(`toggle-selection`,{detail:{path:n.path,event:e}})),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused()}}}scrollToFocused(){this.updateComplete.then(()=>{let e=this.renderRoot.querySelector(`.contact-item.focused`);e&&e.scrollIntoView({block:`nearest`})})}handleListScroll(e){let t=e.target.scrollTop>0;this.listScrolled!==t&&(this.listScrolled=t,this.dispatchEvent(new CustomEvent(`list-scrolled`,{detail:{scrolled:t}})))}render(){return n`
      ${this.isMobile?``:n`
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
        ${this.loading&&this.contacts.length===0?n`<alps-loader full-height .text=${this.i18nStore?.t(`messageList.loading`)}></alps-loader>`:(()=>{let e=this.getFilteredContacts();return n`
              ${this.filterQuery?n`
                <alps-banner>
                  <span>${this.i18nStore?.t(`messageList.searchResultsFor`)} <strong>${this.filterQuery}</strong></span>
                  <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`clear-search`))}>
                    ${this.i18nStore?.t(`messageList.clearSearch`)}
                  </alps-button>
                </alps-banner>
              `:``}
              
              ${e.length===0?n`<div class="empty-state">${this.i18nStore?.t(`contacts.noContacts`)}</div>`:e.map((e,t)=>n`
                  <div class="contact-item ${this.selectedContact?.path===e.path||e.isTemporary&&this.selectedContact?.isTemporary?`active`:``} ${this.selectedContacts.has(e.path)?`selected`:``} ${this.focusedIndex===t?`focused`:``}" @click=${()=>this.dispatchEvent(new CustomEvent(`select-contact`,{detail:{contact:e}}))}>
                    ${this.isMobile?``:n`
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
                            ${O(e.categories?.includes(`Favorites`)?`starFourFill`:`starFour`)}
                          </div>
                        </div>
                        ${e.revision?n`<div class="contact-date">${this.formatRevision(e.revision)}</div>`:``}
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
    `}};k([h({context:S})],W.prototype,`i18nStore`,void 0),k([h({context:C})],W.prototype,`settingsStore`,void 0),k([o({type:Array})],W.prototype,`contacts`,void 0),k([o({type:String})],W.prototype,`selectedCategory`,void 0),k([o({type:String})],W.prototype,`filterQuery`,void 0),k([o({type:String})],W.prototype,`sortOrder`,void 0),k([o({type:Boolean})],W.prototype,`showOnlyStarred`,void 0),k([o({type:Boolean})],W.prototype,`isMobile`,void 0),k([o({type:String})],W.prototype,`densityMode`,void 0),k([o({type:Object})],W.prototype,`selectedContacts`,void 0),k([o({type:Object})],W.prototype,`selectedContact`,void 0),k([o({type:Boolean})],W.prototype,`isSpinning`,void 0),k([o({type:Boolean})],W.prototype,`loading`,void 0),k([o({type:Boolean})],W.prototype,`listScrolled`,void 0),k([a()],W.prototype,`focusedIndex`,void 0),W=k([p(`alps-contacts-list`)],W);var G=class extends d{constructor(...e){super(...e),this.mailboxes=[],this.currentMailbox=``,this.expandedFolders=new Set,this.layoutMode=`vertical`,this.syncing=!1,this.collapsed=!1,this.isScrolled=!1,this.showCreatePrompt=!1,this.promptBusy=!1,this.showRenamePrompt=!1,this.mailboxToRename=``,this.showDeleteConfirm=!1,this.showMoveToTrashConfirm=!1,this.mailboxToDelete=``,this.parentForNewFolder=``,this.activeKebabMenu=null,this.primaryFullNames=new Set,this._handleStoreChange=()=>{this.requestUpdate()},this.handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0}}willUpdate(e){super.willUpdate(e)}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.composeStore&&this.composeStore.addEventListener(`change`,this._handleStoreChange),this.i18nStore&&this.i18nStore.addEventListener(`change`,this._handleStoreChange),this.settingsStore&&this.settingsStore.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.composeStore&&this.composeStore.removeEventListener(`change`,this._handleStoreChange),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=[En,hn,g`
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
      padding: 0 4px;
      box-sizing: border-box;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-color);
      margin-bottom: 2px;
      user-select: none;
      transition: background 0.15s;
      gap: 4px;
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

    /* The lock-up guard, keyed on the menu's own state. A click-triggered
       alps-popup opens with dialog.showModal(), which makes the whole document
       inert until it closes. If the container of that still-open dialog is then
       display: none, the user gets an INVISIBLE modal: nothing on screen, every
       click dead, only Escape gets out. Two routes reached it:

       1. Specificity. .folder-item.active .folder-actions is (0,3,0) and
          .folder-actions.popup-open is (0,2,0), so on the SELECTED folder the
          open rule lost. Hover held the container open until the modal opened,
          but hover does not reach a modal dialog's ancestors.
       2. A desynced marker. .popup-open mirrors activeKebabMenu, and the nested
          Order submenu's popup-close bubbled (composed) to the outer kebab's
          handler and cleared it while the outer menu was still open.

       :has() reads the popup's reflected open attribute, which cannot desync,
       and (0,3,1) outranks every display: none above. */
    .folder-item .folder-actions:has(alps-popup[open]) {
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

    /* Submenu trigger styling inside popup trigger slot */
    .dropdown-item.submenu-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 8px 16px;
      box-sizing: border-box;
    }
    .dropdown-item.submenu-trigger .trigger-label {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    .dropdown-item.submenu-trigger .caret-icon {
      margin-left: auto;
      color: var(--text-muted, #6b7280);
      display: flex;
      align-items: center;
    }
    .dropdown-item.submenu-trigger .caret-icon svg {
      width: 12px;
      height: 12px;
    }
  `]}toggleFolder(e,t){e&&e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-folder`,{detail:{folderName:t}}))}selectMailbox(e){this.dispatchEvent(new CustomEvent(`select-mailbox`,{detail:{name:e}}))}triggerCreateFolder(){this.parentForNewFolder=``,this.showCreatePrompt=!0}async handleCreateSubmit(e){let t=e.detail.name;this.promptBusy=!0;try{if(t){if(this.parentForNewFolder){let e=en(this.mailboxes.find(e=>(e.Name||e.Mailbox)===this.parentForNewFolder))||`.`;t=`${this.parentForNewFolder}${e}${t}`,this.dispatchEvent(new CustomEvent(`expand-folder`,{detail:{folderName:this.parentForNewFolder}}))}let e=await _i.createMailbox(t);e===`exists`?this.toast(this.i18nStore?.t(`toast.folderExists`),`A folder with that name already exists`,{type:`error`}):e===`failed`&&this.toast(this.i18nStore?.t(`toast.folderCreateFailed`),`Could not create the folder`,{type:`error`})}}finally{this.promptBusy=!1,this.showCreatePrompt=!1,this.parentForNewFolder=``}}toast(e,t,n={}){this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:e||t,duration:4e3,...n},bubbles:!0,composed:!0}))}async handleRenameSubmit(e){let t=e.detail.name;if(t&&this.mailboxToRename){let e=this.mailboxToRename;this.showRenamePrompt=!1,this.mailboxToRename=``;let n=await _i.renameMailbox(e,t);n===`exists`?this.toast(this.i18nStore?.t(`toast.folderExists`),`A folder with that name already exists`,{type:`error`}):n===`failed`?this.toast(this.i18nStore?.t(`toast.folderRenameFailed`),`Could not rename the folder`,{type:`error`}):(Qt(this.currentMailbox,e)&&this.selectMailbox(t+this.currentMailbox.slice(e.length)),this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderRenamed`),actionLabel:this.i18nStore?.t(`toast.undo`),actionFn:async()=>{if(await _i.renameMailbox(t,e)!==`ok`){this.toast(this.i18nStore?.t(`toast.folderUndoFailed`),`Could not undo that`,{type:`error`});return}Qt(this.currentMailbox,t)&&this.selectMailbox(e+this.currentMailbox.slice(t.length))},duration:5e3},bubbles:!0,composed:!0})))}else this.showRenamePrompt=!1,this.mailboxToRename=``}async handleDeleteConfirm(){this.mailboxToDelete&&(await _i.deleteMailbox(this.mailboxToDelete)?(Qt(this.currentMailbox,this.mailboxToDelete)&&this.selectMailbox(E),this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderPermanentlyDeleted`),duration:3e3},bubbles:!0,composed:!0}))):this.toast(this.i18nStore?.t(`toast.folderDeleteFailed`),`Could not delete the folder`,{type:`error`})),this.showDeleteConfirm=!1,this.mailboxToDelete=``}async handleMoveToTrashConfirm(){if(this.mailboxToDelete){let e=this.mailboxes.find(e=>(e.Name||e.Mailbox)===this.mailboxToDelete),t=tn(this.mailboxToDelete,en(e,`.`)),n=t[t.length-1],r=en(e,`.`)||`.`,i=Yt(`trash`,this.mailboxes,`Trash`),a=`${i}${r}${n}`,o=1;for(;this.mailboxes.some(e=>(e.Name||e.Mailbox)===a);)a=`${i}${r}${n} (${o})`,o++;let s=a;if(await _i.renameMailbox(this.mailboxToDelete,s)!==`ok`)this.toast(this.i18nStore?.t(`toast.folderRenameFailed`),`Could not rename the folder`,{type:`error`});else{Qt(this.currentMailbox,this.mailboxToDelete,r)&&this.selectMailbox(E);let e=this.mailboxToDelete;this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderMovedToTrash`),actionLabel:this.i18nStore?.t(`toast.undo`),actionFn:async()=>{await _i.renameMailbox(s,e)!==`ok`&&this.toast(this.i18nStore?.t(`toast.folderUndoFailed`),`Could not undo that`,{type:`error`})},duration:5e3},bubbles:!0,composed:!0}))}}this.showMoveToTrashConfirm=!1,this.mailboxToDelete=``}moveFolder(e,t){console.log(`[moveFolder] Start:`,{folderName:e,direction:t});let n=en(this.mailboxes.find(t=>(t.Name||t.Mailbox)===e),`.`),r=tn(e,n),i=r.slice(0,-1).join(n),a=this.mailboxes.map(e=>e.Name||e.Mailbox||``).filter(e=>{if(this.primaryFullNames.has(e))return!1;let t=tn(e,n);return t.slice(0,-1).join(n)===i&&t.length===r.length});console.log(`[moveFolder] Sibling custom folders found:`,a);let o=[...this.settingsStore?.getState()?.customMailboxOrder||[]];a.sort((e,t)=>{let n=o.indexOf(e),r=o.indexOf(t);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.localeCompare(t):1:-1}),console.log(`[moveFolder] Sorted siblings:`,a);let s=a.indexOf(e);if(s===-1){console.error(`[moveFolder] Folder not found in siblings!`);return}let c=s;switch(t){case`top`:c=0;break;case`up`:c=Math.max(0,s-1);break;case`down`:c=Math.min(a.length-1,s+1);break;case`bottom`:c=a.length-1;break}if(console.log(`[moveFolder] Shifting indexes:`,{currentIndex:s,newIndex:c}),c===s){console.log(`[moveFolder] No index change needed.`);return}a.splice(s,1),a.splice(c,0,e),console.log(`[moveFolder] New siblings order:`,a);let l=o.filter(e=>!a.includes(e));l.push(...a),console.log(`[moveFolder] Final updated customMailboxOrder settings state:`,l),this.settingsStore?.updateSettings({customMailboxOrder:l})}render(){let e=[{attr:`\\inbox`,names:[E],display:{icon:`tray`,colorClass:`icon-inbox`,label:this.i18nStore?.t(`folderList.inbox`)}},{attr:`\\drafts`,names:[Rt],display:{icon:`fileText`,colorClass:`icon-drafts`,label:this.i18nStore?.t(`folderList.drafts`)}},{attr:`\\sent`,names:[zt],display:{icon:`paperPlaneTilt`,colorClass:`icon-sent`,label:this.i18nStore?.t(`folderList.sent`)}},{attr:`\\archive`,names:[Bt,Vt],display:{icon:`archiveBox`,colorClass:`icon-archive`,label:this.i18nStore?.t(`folderList.archive`)}},{attr:`\\junk`,names:[Ut,Ht],display:{icon:`warningDiamond`,colorClass:`icon-spam`,label:this.i18nStore?.t(`folderList.junk`)}},{attr:`\\trash`,names:[Wt],display:{icon:`trash`,colorClass:`icon-trash`,label:this.i18nStore?.t(`folderList.trash`)}}],t={[E]:{icon:`tray`,colorClass:`icon-inbox`,label:this.i18nStore?.t(`folderList.inbox`)},[Rt]:{icon:`fileText`,colorClass:`icon-drafts`,label:this.i18nStore?.t(`folderList.drafts`)},[zt]:{icon:`paperPlaneTilt`,colorClass:`icon-sent`,label:this.i18nStore?.t(`folderList.sent`)},[Bt]:{icon:`archiveBox`,colorClass:`icon-archive`,label:this.i18nStore?.t(`folderList.archive`)},[Vt]:{icon:`archiveBox`,colorClass:`icon-archive`,label:this.i18nStore?.t(`folderList.archive`)},[Ht]:{icon:`warningDiamond`,colorClass:`icon-spam`,label:this.i18nStore?.t(`folderList.spam`)},[Ut]:{icon:`warningDiamond`,colorClass:`icon-spam`,label:this.i18nStore?.t(`folderList.junk`)},[Wt]:{icon:`trash`,colorClass:`icon-trash`,label:this.i18nStore?.t(`folderList.trash`)}},r={};this.mailboxes.forEach(e=>{let t=e.Name||e.Mailbox||``,n=en(e,`.`),i=tn(t,n),a=r,o=``;for(let t=0;t<i.length;t++){let r=i[t];o=t===0?r:o+n+r,a[r]||(a[r]={name:r,fullName:o,children:{}}),t===i.length-1&&(a[r].mb=e),a=a[r].children}});let i=e=>(e.mb?.Attrs||[]).map(e=>typeof e==`string`?e.toLowerCase():``),a=(e,t)=>{let n=i(e);return n.includes(t)||n.includes(`\\`+t)},o=t=>{let n=i(t);for(let t=0;t<e.length;t++){let r=e[t];if(n.includes(r.attr)||n.includes(`\\`+r.attr))return t}if(t.mb&&!n.includes(`\\noselect`)&&!n.includes(`\\nonexistent`)){for(let n=0;n<e.length;n++)if(e[n].names.includes(t.name))return n}return-1},s=new Map,c=[];Object.values(r).forEach(t=>{let n=o(t);if(n<0){c.push(t);return}let r=s.get(n);if(!r){s.set(n,t);return}let i=e[n],l=a(t,i.attr),u=a(r,i.attr),d=i.names.indexOf(t.name),f=i.names.indexOf(r.name);l&&!u||l===u&&d!==-1&&(f===-1||d<f)?(s.set(n,t),c.push(r)):c.push(t)});let l=[];for(let n=0;n<e.length;n++){let r=s.get(n);r&&(r.primary=t[r.name]||e[n].display,l.push(r))}this.primaryFullNames=new Set(l.map(e=>e.fullName));let u=this.settingsStore?.getState()?.customMailboxOrder||[];c.sort((e,t)=>{let n=u.indexOf(e.fullName),r=u.indexOf(t.fullName);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.name.localeCompare(t.name):1:-1});let d=(e,t=0)=>e.map(e=>{let r=Object.keys(e.children).length>0,i=this.expandedFolders.has(e.fullName),a=this.currentMailbox===e.fullName,o=t>0||!e.primary,s=!1,c=!1;if(o){let t=en(e.mb,`.`),n=tn(e.fullName,t),r=n.slice(0,-1).join(t),i=this.mailboxes.map(e=>e.Name||e.Mailbox||``).filter(e=>{if(this.primaryFullNames.has(e))return!1;let i=tn(e,t);return i.slice(0,-1).join(t)===r&&i.length===n.length}),a=this.settingsStore?.getState()?.customMailboxOrder||[];i.sort((e,t)=>{let n=a.indexOf(e),r=a.indexOf(t);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.localeCompare(t):1:-1});let o=i.indexOf(e.fullName);s=o<=0,c=o===-1||o===i.length-1}let l=O(`folder`),f=`icon-default`,p=e.name;e.primary&&(l=O(e.primary.icon),f=e.primary.colorClass,p=e.primary.label);let m=e.mb?.Unseen||0,h=(e.mb?.Attrs||[]).some(e=>typeof e==`string`&&e.toLowerCase()===`\\noselect`);return n`
          <div 
            class="folder-item ${a?`active`:``} ${h?`no-select`:``} ${o?`has-actions`:``}"
            title=${p}
            @click=${t=>{h?r&&this.toggleFolder(t,e.fullName):this.selectMailbox(e.fullName)}}
          >
            <alps-icon-btn 
              class="folder-toggle-btn" 
              icon=${i?`caretDown`:`caretRight`}
              style="visibility: ${r?`visible`:`hidden`}; --btn-padding: 2px;" 
              @click=${t=>{t.stopPropagation(),r&&this.toggleFolder(t,e.fullName)}}
            ></alps-icon-btn>
            
            <div class="folder-icon ${f}">${l}</div>
            <div class="folder-name">${p}</div>
            
            ${o?n`
              <div class="folder-actions ${this.activeKebabMenu===e.fullName?`popup-open`:``}" @click=${e=>e.stopPropagation()}>
                <alps-popup 
                  align="right" 
                  position="bottom"
                  @popup-open=${()=>{this.activeKebabMenu=e.fullName}}
                  @popup-close=${()=>{this.activeKebabMenu===e.fullName&&(this.activeKebabMenu=null)}}
                >
                  <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical" style="--btn-padding: 8px;"></alps-icon-btn>
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.parentForNewFolder=e.fullName,this.showCreatePrompt=!0}}>
                    ${O(`folderPlus`)} <span class="item-text">${this.i18nStore?.t(`folderList.createSubfolder`)}</span>
                  </button>
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.mailboxToRename=e.fullName,this.showRenamePrompt=!0}}>
                    ${O(`pen`)} <span class="item-text">${this.i18nStore?.t(`folderList.rename`)}</span>
                  </button>
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=!e.mb?.Subscribed;_i.setSubscribed(e.fullName,r).then(e=>{e.ok||e.reason===`auth`||(r?this.toast(this.i18nStore?.t(`toast.subscribeFailed`),`Could not subscribe`):this.toast(this.i18nStore?.t(`toast.unsubscribeFailed`),`Could not unsubscribe`))})}}>
                    ${O(e.mb?.Subscribed?`eyeSlash`:`eye`)} <span class="item-text">${e.mb?.Subscribed?this.i18nStore?.t(`folderList.unsubscribe`):this.i18nStore?.t(`folderList.subscribe`)}</span>
                  </button>
                  <div class="dropdown-divider"></div>
                  
                  <!-- Natively nested Order submenu via extended alps-popup -->
                  <!--
                    Open and close are stopped as well as the click: they are
                    dispatched {bubbles, composed}, so this submenu's popup-close
                    reached the OUTER kebab's @popup-close and cleared
                    activeKebabMenu while the outer menu was still open.
                  -->
                  <alps-popup
                    position="right"
                    align="top"
                    triggerOn="hover"
                    @click=${e=>e.stopPropagation()}
                    @popup-open=${e=>e.stopPropagation()}
                    @popup-close=${e=>e.stopPropagation()}
                  >
                    <button slot="trigger" class="dropdown-item submenu-trigger">
                      <div class="trigger-label">
                        ${O(`sortAscending`)} <span class="item-text">${this.i18nStore?.t(`folderList.order`)}</span>
                      </div>
                      <div class="caret-icon">${O(`caretRight`)}</div>
                    </button>
                    
                    <button class="dropdown-item" ?disabled=${s} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`top`)}}>
                      ${O(`caretDoubleUp`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveToTop`)}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${s} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`up`)}}>
                      ${O(`caretUp`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveUp`)}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${c} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`down`)}}>
                      ${O(`caretDown`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveDown`)}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${c} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`bottom`)}}>
                      ${O(`caretDoubleDown`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveToBottom`)}</span>
                    </button>
                  </alps-popup>


                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.mailboxToDelete=e.fullName;let r=Yt(`trash`,this.mailboxes,Wt);Jt(e.fullName,this.mailboxes)===`trash`||Qt(e.fullName,r,en(e.mb))?this.showDeleteConfirm=!0:this.showMoveToTrashConfirm=!0}}>
                    ${O(`trash`)} <span class="item-text">${this.i18nStore?.t(`folderList.delete`)}</span>
                  </button>
                </alps-popup>
              </div>
            `:``}

            ${m>0?n`<div class="folder-badge">${m}</div>`:``}
          </div>
          
          ${r&&i?n`
            <div class="folder-children">
              ${d(Object.values(e.children).sort((e,t)=>{let n=u.indexOf(e.fullName),r=u.indexOf(t.fullName);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.name.localeCompare(t.name):1:-1}),t+1)}
            </div>
          `:``}
        `});return n`
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
            ${d(l)}
            ${l.length>0&&c.length>0?n`
              <div class="folder-separator"></div>
            `:``}
            <div class="sidebar-header-title">
              <span>${this.i18nStore?.t(`folderList.title`)}</span>
            </div>
            ${d(c)}
          </div>
        </div>
      </div>

      ${this.showCreatePrompt?n`
        <ui-prompt
          title=${this.parentForNewFolder?this.i18nStore?.t(`folderList.createSubfolderUnder`,{folder:this.parentForNewFolder}):this.i18nStore?.t(`folderList.createFolder`)}
          confirmText=${this.i18nStore?.t(`folderList.createFolder`)}
          .busy=${this.promptBusy}
          .fields=${[{id:`name`,label:this.i18nStore?.t(`folderList.folderName`)||`Folder name`,autofocus:!0}]}
          @submit=${this.handleCreateSubmit}
          @cancel=${()=>{this.showCreatePrompt=!1,this.parentForNewFolder=``}}
        ></ui-prompt>
      `:``}

      ${this.showRenamePrompt?n`
        <ui-prompt
          title="${this.i18nStore?.t(`folderList.renameFolder`)}"
          confirmText=${this.i18nStore?.t(`folderList.rename`)}
          .fields=${[{id:`name`,label:this.i18nStore?.t(`folderList.folderName`)||`Folder name`,autofocus:!0,value:this.mailboxToRename}]}
          @submit=${this.handleRenameSubmit}
          @cancel=${()=>this.showRenamePrompt=!1}
        ></ui-prompt>
      `:``}

      ${this.showMoveToTrashConfirm?n`
        <ui-confirm
          title=${this.i18nStore?.t(`folderList.moveToTrash`)}
          message=${this.i18nStore?.t(`folderList.moveToTrashConfirm`,{folder:this.mailboxToDelete})}
          confirmText=${this.i18nStore?.t(`folderList.moveToTrash`)}
          isDanger=${!1}
          @confirm=${this.handleMoveToTrashConfirm}
          @cancel=${()=>this.showMoveToTrashConfirm=!1}
        ></ui-confirm>
      `:``}

      ${this.showDeleteConfirm?n`
        <ui-confirm
          title="${this.i18nStore?.t(`folderList.deleteFolder`)}"
          message=${this.i18nStore?.t(`folderList.deleteFolderConfirm`,{folder:this.mailboxToDelete})}
          confirmText=${this.i18nStore?.t(`folderList.delete`)}
          isDanger=${!0}
          @confirm=${this.handleDeleteConfirm}
          @cancel=${()=>this.showDeleteConfirm=!1}
        ></ui-confirm>
      `:``}
    `}};k([h({context:ai})],G.prototype,`composeStore`,void 0),k([h({context:S})],G.prototype,`i18nStore`,void 0),k([h({context:C})],G.prototype,`settingsStore`,void 0),k([o({type:Array})],G.prototype,`mailboxes`,void 0),k([o({type:String})],G.prototype,`currentMailbox`,void 0),k([o({type:Object})],G.prototype,`expandedFolders`,void 0),k([o({type:String})],G.prototype,`layoutMode`,void 0),k([o({type:Boolean})],G.prototype,`syncing`,void 0),k([o({type:Boolean,reflect:!0})],G.prototype,`collapsed`,void 0),k([a()],G.prototype,`isScrolled`,void 0),k([a()],G.prototype,`showCreatePrompt`,void 0),k([a()],G.prototype,`promptBusy`,void 0),k([a()],G.prototype,`showRenamePrompt`,void 0),k([a()],G.prototype,`mailboxToRename`,void 0),k([a()],G.prototype,`showDeleteConfirm`,void 0),k([a()],G.prototype,`showMoveToTrashConfirm`,void 0),k([a()],G.prototype,`mailboxToDelete`,void 0),k([a()],G.prototype,`parentForNewFolder`,void 0),k([a()],G.prototype,`activeKebabMenu`,void 0),G=k([p(`alps-folder-list`)],G);var Ei=class extends d{constructor(...e){super(...e),this.name=``,this.address=``}static{this.styles=g`
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
  `}handleClick(){this.composeStore.openComposer({to:[this.address]})}render(){let e=this.name;return e===this.address&&(e=``),e?n`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          <span class="recipient-name">${e}</span>
          <span class="recipient-address">&lt;${this.address}&gt;</span>
        </a>
      `:n`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          ${this.address}
        </a>
      `}};k([h({context:ai})],Ei.prototype,`composeStore`,void 0),k([o({type:String})],Ei.prototype,`name`,void 0),k([o({type:String})],Ei.prototype,`address`,void 0),Ei=k([p(`alps-recipient-pill`)],Ei);function Di(e,t,n){if(!e||t===void 0||t===``||!n)return``;let r=Array.isArray(n.Path)?n.Path.join(`.`):String(n.Path??``);return r?`/mailboxes/${D(e)}/messages/${t}/raw?part=${r}`:``}var Oi=new Set([`png`,`jpg`,`jpeg`,`gif`,`webp`,`svg`,`avif`,`bmp`,`ico`,`tiff`,`tif`,`heic`,`heif`]),ki=new Set([`pdf`]),Ai=new Set([`doc`,`docx`,`odt`,`rtf`,`pages`,`dotx`,`docm`]),ji=new Set([`xls`,`xlsx`,`csv`,`tsv`,`ods`,`numbers`,`xlsm`]),Mi=new Set([`ppt`,`pptx`,`odp`,`key`,`potx`,`ppsx`]),Ni=new Set([`zip`,`tar`,`gz`,`rar`,`7z`,`bz2`,`xz`,`tgz`,`iso`,`dmg`,`pkg`,`deb`,`rpm`]),Pi=new Set(`js.mjs.cjs.ts.mts.cts.jsx.tsx.json.json5.html.htm.css.scss.sass.less.py.go.rs.c.cpp.h.hpp.java.kt.sh.bash.zsh.yml.yaml.sql.xml.md.markdown.toml.ini.env.diff.patch.php.rb.swift.graphql.gql.proto.vue.svelte.rust`.split(`.`)),Fi=new Set([`txt`,`text`,`log`,`nfo`,`sub`,`srt`]),Ii=new Set([`mp3`,`wav`,`ogg`,`m4a`,`flac`,`aac`,`wma`,`aiff`,`opus`,`mid`,`midi`]),Li=new Set([`mp4`,`webm`,`mov`,`mkv`,`avi`,`wmv`,`flv`,`m4v`,`3gp`,`ogv`]),Ri=new Set([`ics`,`ical`,`ifb`]),zi=new Set([`vcf`,`vcard`]);function Bi(e){if(!e)return``;let t=e.lastIndexOf(`.`);return t===-1||t===e.length-1?``:e.slice(t+1).toLowerCase()}function Vi(e,t){let n=(e||``).toLowerCase().trim(),r=Bi(t);if(n===`application/pdf`||ki.has(r))return{category:`pdf`,icon:`filePdf`,themeClass:`type-pdf`,color:`#ef4444`,previewKind:`pdf`,isImage:!1,isPdf:!0,isAudio:!1,isVideo:!1,isPreviewable:!0};if(n.startsWith(`image/`)||Oi.has(r))return{category:`image`,icon:`image`,themeClass:`type-image`,color:`#10b981`,previewKind:`image`,isImage:!0,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0};if(n.startsWith(`audio/`)||Ii.has(r))return{category:`audio`,icon:`fileAudio`,themeClass:`type-audio`,color:`#f59e0b`,previewKind:`audio`,isImage:!1,isPdf:!1,isAudio:!0,isVideo:!1,isPreviewable:!0};if(n.startsWith(`video/`)||Li.has(r))return{category:`video`,icon:`fileVideo`,themeClass:`type-video`,color:`#f43f5e`,previewKind:`video`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!0,isPreviewable:!0};if(Pi.has(r)||n===`application/json`||n===`application/ld+json`||n===`application/xml`||n===`application/javascript`||n===`text/javascript`||n===`text/css`||n===`text/html`||n===`text/markdown`||n===`text/x-python`||n===`text/x-shellscript`)return{category:`code`,icon:`fileCode`,themeClass:`type-code`,color:`#8b5cf6`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0};if(ji.has(r)||n.includes(`spreadsheet`)||n.includes(`excel`)||n===`text/csv`||n===`text/tab-separated-values`){let e=r===`csv`||r===`tsv`||n===`text/csv`||n===`text/tab-separated-values`;return{category:`spreadsheet`,icon:`fileXls`,themeClass:`type-spreadsheet`,color:`#059669`,previewKind:e?`text`:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:e}}return Ai.has(r)||n.includes(`word`)||n.includes(`officedocument.wordprocessingml`)||n===`application/rtf`?{category:`document`,icon:`fileDoc`,themeClass:`type-document`,color:`#3b82f6`,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}:Mi.has(r)||n.includes(`presentation`)||n.includes(`powerpoint`)?{category:`presentation`,icon:`filePpt`,themeClass:`type-presentation`,color:`#f59e0b`,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}:Ni.has(r)||n.includes(`zip`)||n.includes(`tar`)||n.includes(`compressed`)||n.includes(`archive`)?{category:`archive`,icon:`fileArchive`,themeClass:`type-archive`,color:`#64748b`,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}:Ri.has(r)||n===`text/calendar`?{category:`calendar`,icon:`calendarBlank`,themeClass:`type-calendar`,color:`#0ea5e9`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0}:zi.has(r)||n===`text/vcard`||n===`text/x-vcard`?{category:`contact`,icon:`user`,themeClass:`type-contact`,color:`#14b8a6`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0}:Fi.has(r)||n.startsWith(`text/`)?{category:`text`,icon:`fileText`,themeClass:`type-text`,color:`#6b7280`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0}:{category:`generic`,icon:`file`,themeClass:`type-generic`,color:``,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}}var Hi=class extends d{constructor(...e){super(...e),this.attachment=null,this.downloadUrl=``,this.fallbackName=`Unknown attachment`,this.removable=!1,this.compact=!1,this.imgError=!1}willUpdate(e){e.has(`attachment`)&&(this.imgError=!1)}static{this.styles=g`
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

    .attachment-chip { cursor: pointer; }

    .attachment-thumb {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      position: relative;
      z-index: 1;
    }
    .attachment-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .attachment-icon.typed {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    :host([compact]) .attachment-thumb,
    :host([compact]) .attachment-icon.typed {
      width: 18px;
      height: 18px;
    }
    .preview-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3px;
      border-radius: 4px;
      position: relative;
      z-index: 1;
    }
    .preview-btn:hover {
      color: var(--text-primary);
      background: var(--bg-secondary);
    }
    .preview-btn .icon {
      width: 14px;
      height: 14px;
    }
  `}get name(){let e=this.attachment;return e.Filename||e.filename||e.name||this.fallbackName}typeInfo(){let e=this.attachment;return Vi(e.MIMEType||e.contentType||e.type,this.name)}_handlePreview(e){this.removable||!this.downloadUrl||!this.typeInfo().isPreviewable||(e.preventDefault(),e.stopPropagation(),this.dispatchEvent(new CustomEvent(`preview-attachment`,{bubbles:!0,composed:!0,detail:{attachment:this.attachment}})))}_handleRemove(e){e.preventDefault(),e.stopPropagation(),this.dispatchEvent(new CustomEvent(`remove-attachment`,{bubbles:!0,composed:!0,detail:{attachment:this.attachment}}))}render(){if(!this.attachment)return n``;let e=this.name,t=this.attachment.Size||this.attachment.size||0,r=this.attachment.uploading,i=this.attachment.progress||0,a=this.typeInfo(),o=!this.removable&&!!this.downloadUrl&&a.isPreviewable,s=a.isImage&&this.downloadUrl&&!this.imgError,c=n`
      ${r?n`<div class="progress-bar" style="width: ${i}%"></div>`:``}
      ${s?n`
        <div class="attachment-thumb">
          <img src="${this.downloadUrl}" alt="" loading="lazy" @error=${()=>{this.imgError=!0}} />
        </div>
      `:n`
        <div
          class="attachment-icon typed ${a.themeClass}"
          style="${a.color?`color: ${a.color}; background: color-mix(in srgb, ${a.color} 12%, transparent)`:``}"
        >${O(a.icon)}</div>
      `}
      <span class="attachment-name">${e}</span>
      <span class="attachment-size">${r?`${i}% of ${cn(t)}`:cn(t)}</span>
      ${o?n`
        <button class="preview-btn" @click=${this._handlePreview} title="${this.i18nStore?.t(`attachment.preview`)}">
          ${O(`eye`)}
        </button>
      `:``}
      ${this.removable?n`
        <button class="remove-btn" @click=${this._handleRemove} title="${this.i18nStore?.t(`attachment.remove`)}">
          ${O(`x`)}
        </button>
      `:``}
    `;return this.downloadUrl?n`
        <a href="${this.downloadUrl}" download="${e}" class="attachment-chip" title="${e}" @click=${this._handlePreview}>
          ${c}
        </a>
      `:n`
        <div class="attachment-chip" title="${e}">
          ${c}
        </div>
      `}};k([h({context:S})],Hi.prototype,`i18nStore`,void 0),k([o({type:Object})],Hi.prototype,`attachment`,void 0),k([o({type:String})],Hi.prototype,`downloadUrl`,void 0),k([o({type:String})],Hi.prototype,`fallbackName`,void 0),k([o({type:Boolean})],Hi.prototype,`removable`,void 0),k([o({type:Boolean,reflect:!0})],Hi.prototype,`compact`,void 0),k([a()],Hi.prototype,`imgError`,void 0),Hi=k([p(`alps-attachment-pill`)],Hi);var Ui=class extends d{constructor(...e){super(...e),this.attachments=[],this.mailbox=E,this.messageUid=``,this.removable=!1,this.composerMode=!1,this.attachmentsExpanded=!0,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}get resolvedMailbox(){if(this.mailbox)return this.mailbox;let e=window.location.hash.match(/^#\/mailbox\/([^/]+)/);return e?decodeURIComponent(e[1]):E}_openPreview(e){window.dispatchEvent(new CustomEvent(`open-attachment-preview`,{detail:{attachments:this.attachments,mailbox:this.resolvedMailbox,messageUid:this.messageUid,index:e}}))}toggleAttachments(){this.attachmentsExpanded=!this.attachmentsExpanded}_downloadAll(e){if(e.stopPropagation(),!this.attachments||this.attachments.length===0||!this.messageUid)return;let t=this.resolvedMailbox;this.attachments.forEach((e,n)=>{let r=Di(t,this.messageUid,e);r&&setTimeout(()=>{let t=document.createElement(`a`);t.href=r,t.download=e.Filename||this.i18nStore?.t(`messageReader.unknownAttachment`)||`attachment`,document.body.appendChild(t),t.click(),document.body.removeChild(t)},n*200)})}static{this.styles=g`
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
  `}render(){return!this.attachments||this.attachments.length===0?n``:n`
      <div class="attachments-container ${this.attachmentsExpanded?`is-expanded`:`is-closed`}">
        <div class="attachments-header" @click=${this.toggleAttachments}>
          <div class="attachments-title">
            <span>${this.i18nStore?.t(`messageReader.attachments`)} (${this.attachments.length})</span>
          </div>
          <div class="attachments-actions">
            ${this.composerMode?``:n`
              <div 
                class="download-all-btn" 
                title=${this.i18nStore?.t(`messageReader.downloadAllAttachments`)} 
                @click=${this._downloadAll}
              >
                ${O(`downloadSimple`)}
              </div>
            `}
            <div class="icon caret">
              ${O(`caretDown`)}
            </div>
          </div>
        </div>
        <div class="attachments-wrapper ${this.attachmentsExpanded?`expanded`:``}">
          <div class="attachments-list">
            ${this.attachments.map((e,t)=>n`
                <alps-attachment-pill
                  .attachment=${e}
                  .downloadUrl=${this.messageUid?Di(this.resolvedMailbox,this.messageUid,e):``}
                  .fallbackName=${this.i18nStore?.t(`messageReader.unknownAttachment`)}
                  .removable=${this.removable}
                  .compact=${this.composerMode}
                  @preview-attachment=${e=>{e.stopPropagation(),this._openPreview(t)}}
                ></alps-attachment-pill>
              `)}
          </div>
        </div>
      </div>
    `}};k([h({context:S})],Ui.prototype,`i18nStore`,void 0),k([o({type:Array})],Ui.prototype,`attachments`,void 0),k([o({type:String})],Ui.prototype,`mailbox`,void 0),k([o({type:String})],Ui.prototype,`messageUid`,void 0),k([o({type:Boolean})],Ui.prototype,`removable`,void 0),k([o({type:Boolean,reflect:!0})],Ui.prototype,`composerMode`,void 0),k([a()],Ui.prototype,`attachmentsExpanded`,void 0),Ui=k([p(`alps-attachment-list`)],Ui);var Wi=class extends d{constructor(...e){super(...e),this.mailboxes=[],this.currentMailbox=``,this.noActionBox=!1,this.noSearchBox=!1,this.filterQuery=``,this.isMove=!0}static{this.styles=g`
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
  `}_handleFilter(e){let t=e.target;this.filterQuery=t.value.toLowerCase()}_handleSelect(e){this.popup&&this.popup.close(),this.dispatchEvent(new CustomEvent(`folder-selected`,{detail:{folderName:e,isMove:this.isMove},bubbles:!0,composed:!0}))}_handlePopupToggle(){this.filterQuery=``,setTimeout(()=>{this.filterInput&&this.filterInput.focus()},50)}render(){let e=this.mailboxes.map(e=>e.Name||e.Mailbox||``).filter(e=>e!==``&&e!==this.currentMailbox).filter(e=>e.toLowerCase().includes(this.filterQuery));return n`
      <alps-popup align="right" @click=${this._handlePopupToggle}>
        <slot name="trigger" slot="trigger"></slot>
        
        <div class="selector-container" @click=${e=>e.stopPropagation()}>
          ${this.noActionBox?``:n`
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
          
          ${this.noSearchBox?``:n`
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
            ${e.length>0?e.map(e=>n`
              <button class="folder-item" @click=${()=>this._handleSelect(e)}>
                ${O(`folder`)}
                <span class="folder-name">${e}</span>
              </button>
            `):n`
              <div class="no-results">${this.i18nStore?.t(`folderSelector.noResults`)}</div>
            `}
          </div>
        </div>
      </alps-popup>
    `}};k([h({context:S})],Wi.prototype,`i18nStore`,void 0),k([o({type:Array})],Wi.prototype,`mailboxes`,void 0),k([o({type:String})],Wi.prototype,`currentMailbox`,void 0),k([o({type:Boolean})],Wi.prototype,`noActionBox`,void 0),k([o({type:Boolean})],Wi.prototype,`noSearchBox`,void 0),k([a()],Wi.prototype,`filterQuery`,void 0),k([a()],Wi.prototype,`isMove`,void 0),k([ee(`alps-popup`)],Wi.prototype,`popup`,void 0),k([ee(`input`)],Wi.prototype,`filterInput`,void 0),Wi=k([p(`alps-folder-selector-popup`)],Wi);var Gi=class extends d{constructor(...e){super(...e),this.verified=!1,this.failed=!1}static{this.styles=g`
    :host {
      display: inline-flex;
      flex-shrink: 0;
      vertical-align: middle;
    }

    .badge {
      display: inline-flex;
    }

    .verified {
      color: var(--success, #10b981);
    }

    .failed {
      color: var(--error, #ef4444);
    }

    svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
  `}render(){let e=this.verified?`verified`:this.failed?`failed`:``;if(!e)return c;let t=e===`verified`?this.i18nStore?.t(`messageReader.verifiedSender`)||`Verified Sender`:this.i18nStore?.t(`messageReader.unverifiedSender`)||`Unverified Sender`;return n`
      <span class="badge ${e}" role="img" aria-label=${t} title=${t}>
        ${O(e===`verified`?`verifiedBadge`:`authFailedBadge`)}
      </span>
    `}};k([h({context:S})],Gi.prototype,`i18nStore`,void 0),k([o({type:Boolean})],Gi.prototype,`verified`,void 0),k([o({type:Boolean})],Gi.prototype,`failed`,void 0),Gi=k([p(`alps-sender-auth-badge`)],Gi);var Ki=t(te(),1),qi=`data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`;function Ji(e){let t=e.trim().toLowerCase();return t.startsWith(`http://`)||t.startsWith(`https://`)||t.startsWith(`//`)}function Yi(e){return e.toLowerCase().replace(/[^\x21-\x7e]/g,``)}function Xi(e){return Yi(e).startsWith(`cid:`)}function Zi(e){return e.replace(/[^\x21-\x7e]/g,``).substring(4)}var Qi=()=>/url\(\s*(['"]?)((?:https?:)?\/\/[^'"\)]+)\1\s*\)/gi,$i=()=>/@import\s+(?:url\(\s*)?(['"]?)((?:https?:)?\/\/[^'"\)]+)\1\s*\)?\s*;?/gi;function ea(e){return`/proxy?url=${encodeURIComponent(e.trim())}`}function ta(e,t){return Ji(e)?(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?ea(e):qi):null}function na(e,t){let n=e.split(`,`).map(e=>e.trim()).filter(Boolean);if(n.length===0)return null;let r=!1,i=n.map(e=>{let n=e.search(/\s/),i=n===-1?e:e.slice(0,n),a=n===-1?``:e.slice(n);return Ji(i)?(r=!0,t.allowRemoteResources?`${ea(i)}${a}`:qi):e});return r?(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?i.join(`, `):qi):null}function ra(e,t,n=``){if(!e)return null;let r=t.replace(/^<|>$/g,``);if(e.ID&&e.ID.replace(/^<|>$/g,``)===r)return n||`1`;if(e.Children&&Array.isArray(e.Children))for(let r=0;r<e.Children.length;r++){let i=n?`${n}.${r+1}`:`${r+1}`,a=ra(e.Children[r],t,i);if(a)return a}return null}function ia(e,t){if(!e)return e;try{let n=Ki.parse(e,{silent:!0});if(n&&n.stylesheet&&n.stylesheet.rules){let e=Qi(),r=n=>n.replace(e,(e,n,r)=>{if(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources){let e=n||`"`;return`url(${e}${ea(r)}${e})`}else return`url(${qi})`}),i=n=>{for(let a=n.length-1;a>=0;a--){let o=n[a];if([`rule`,`font-face`,`page`,`keyframe`].includes(o.type)&&!o.declarations&&(o.declarations=[]),[`rule`,`page`].includes(o.type)&&!o.selectors&&(o.selectors=[]),o.type===`keyframe`&&!o.values&&(o.values=[]),o.type===`import`){let e=o;if(e.import&&e.import.match(/(?:https?:)?\/\//i)){t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),n.splice(a,1);continue}}else if(o.type===`font-face`){let r=o;if(r.declarations){let i=!1;for(let n of r.declarations)n.type===`declaration`&&n.value?.match(e)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),i=!0);if(i&&!t.allowRemoteResources){n.splice(a,1);continue}}}if(o.declarations)for(let t of o.declarations)t.type===`declaration`&&t.value&&t.value.match(e)&&(t.value=r(t.value));o.rules&&i(o.rules)}};return i(n.stylesheet.rules),Ki.stringify(n)}}catch(e){console.warn(`AST CSS parsing failed, falling back to regex sanitizer`,e)}let n=e,r=$i(),i=Qi();return(n.match(r)||n.match(i))&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),n=n.replace(r,``),t.allowRemoteResources?n=n.replace(i,(e,t,n)=>`url(${t}${ea(n)}${t})`):(n=n.replace(/@font-face\s*\{[^{}]*\}/gi,e=>/url\(\s*['"]?(?:https?:)?\/\//i.test(e)?``:e),n=n.replace(i,`url(${qi})`))),n}function aa(e,t){let n=new DOMParser().parseFromString(e,`text/html`);n.querySelectorAll(`iframe, object, embed, frame, frameset, applet, meta[http-equiv]`).forEach(e=>e.remove()),n.querySelectorAll(`link`).forEach(e=>{(e.getAttribute(`rel`)||``).toLowerCase()!==`stylesheet`&&e.remove()});let r=n.createElement(`base`);r.target=`_blank`,n.head.prepend(r);let i=n.createElement(`meta`);i.httpEquiv=`Content-Security-Policy`,i.content=`default-src 'none'; img-src ${window.location.origin} data: blob: cid:; media-src ${window.location.origin} data: blob: cid:; style-src 'unsafe-inline'; font-src ${window.location.origin} data:; script-src 'none'; object-src 'none'; frame-src 'none'; child-src 'none'; form-action 'none'; base-uri 'none';`,n.head.prepend(i);let a=n.createElement(`style`);a.textContent=`
    body { margin: 0; padding: 24px; box-sizing: border-box; font: 14px -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; overflow-x: auto; word-wrap: break-word; background-color: #ffffff; color: #000000; }
    @media (max-width: 768px) { body { padding: 16px !important; } }
    html:not(.x), body:not(.x) { height: auto !important; }
    p:first-child { margin-top: 0; }
    p:last-child { margin-bottom: 0; }
    a[href] { color: #3781b8; text-decoration: none; }
    a[href]:hover { text-decoration: underline; }
    blockquote[type='cite'] { margin: 0 0 0 0.8ex; border-left: 1px #ccc solid; padding-left: 1ex; }
    img { max-width: 100%; height: auto; }
  `,n.head.prepend(a),n.querySelectorAll(`img`).forEach(e=>{let n=e.getAttribute(`src`);if(n)if(Xi(n)){let r=Zi(n);if(t.messageStructure){let n=ra(t.messageStructure,r);n&&(e.src=`/mailboxes/${D(t.mailbox)}/messages/${t.messageUid}/raw?part=${n}`)}}else Ji(n)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?e.src=ea(n):(e.setAttribute(`data-original-src`,n),e.src=qi,e.style.height=`0`,e.style.width=`0`))});for(let e of Array.from(n.querySelectorAll(`img[srcset], source[srcset], video[poster], source[src]`)))for(let n of[`srcset`,`poster`,`src`]){let r=e.getAttribute(n);if(!r||n===`src`&&e.tagName.toLowerCase()===`img`)continue;let i=n===`srcset`?na(r,t):ta(r,t);i!==null&&e.setAttribute(n,i)}n.querySelectorAll(`link[rel="stylesheet"]`).forEach(e=>{let n=e.getAttribute(`href`);n&&Ji(n)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),e.remove())}),n.querySelectorAll(`a[href]`).forEach(e=>{e.setAttribute(`rel`,`noopener noreferrer`)}),n.querySelectorAll(`style`).forEach(e=>{e.textContent&&=ia(e.textContent,t)});let o=Qi();return n.querySelectorAll(`[style]`).forEach(e=>{let n=e.getAttribute(`style`);n&&n.match(o)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),n=t.allowRemoteResources?n.replace(o,(e,t,n)=>{let r=t||`"`;return`url(${r}${ea(n)}${r})`}):n.replace(o,`url(${qi})`),e.setAttribute(`style`,n))}),n.documentElement.outerHTML}function oa(e){if(!e)return``;let t=new DOMParser().parseFromString(e,`text/html`);t.querySelectorAll(`script, style, link, iframe, object, embed, form, meta, base`).forEach(e=>e.remove());for(let e of Array.from(t.querySelectorAll(`*`))){for(let t of Array.from(e.attributes)){let n=t.name.toLowerCase();if(n.startsWith(`on`)){e.removeAttribute(t.name);continue}if(n===`href`||n===`src`||n===`srcset`||n===`action`){let n=Yi(t.value);(n.startsWith(`javascript:`)||n.startsWith(`vbscript:`)||n.startsWith(`data:text/html`))&&e.removeAttribute(t.name)}}let t=e.getAttribute(`style`);t&&/url\s*\(/i.test(t)&&e.setAttribute(`style`,t.replace(/url\s*\([^)]*\)/gi,``))}return t.body.innerHTML}function sa(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}var ca=`data-alps-quote`;function la(e){return e?e.map(e=>e.Name?`${e.Name} <${e.Mailbox}@${e.Host}>`:`${e.Mailbox}@${e.Host}`):[]}var ua=e=>`${e?.Mailbox??``}@${e?.Host??``}`.toLowerCase(),da=e=>{let t=e.trim(),n=t.lastIndexOf(`<`);return(t.endsWith(`>`)&&n!==-1?t.slice(n+1,-1):t).trim().toLowerCase()};function fa(e,t,n,r,i,a=`YYYY-MM-DD`,o=`12`,s=[]){let c=t?.Envelope?.Subject||``,l=c;l=e===`forward`?l.toLowerCase().startsWith(`fwd:`)?l:`Fwd: ${l}`:l.toLowerCase().startsWith(`re:`)?l:`Re: ${l}`;let u=[],d=[];if(e===`reply`||e===`replyAll`){let n=t?.Envelope??{},r=new Set(s.filter(Boolean).map(da)),i=new Set,a=e=>(e||[]).filter(e=>{let t=ua(e);return r.has(t)||i.has(t)?!1:(i.add(t),!0)}),o=n.ReplyTo?.length>0?n.ReplyTo:n.From,c=a(o);(e===`replyAll`||c.length===0)&&(c=[...c,...a(n.To)]);let l=e===`replyAll`?a(n.Cc):[];c.length===0&&([c,l]=[l,[]]),u=c.length>0?la(c):la(o),d=la(l)}let f=t?.Envelope?.Date?an(t.Envelope.Date,a,o):``,p=t?.Envelope?.From?.[0],m=p?.Mailbox&&p?.Host?`${p.Mailbox}@${p.Host}`:``,h=p?.Name||m||`Unknown Sender`,ee=`On ${f}, ${h} wrote:`;e===`forward`&&(ee=`---------- Forwarded message ---------\nFrom: ${h} <${m}>\nDate: ${f}\nSubject: ${c}\nTo: ${la(t?.Envelope?.To).join(`, `)}\n`);let g=`\n\n${ee}\n`+n.split(`
`).map(e=>`> ${e}`).join(`
`),te=sa(h),ne=sa(m),re=sa(c),_=sa(f),v=i&&r?oa(r):``,y=``;return y=v?e===`forward`?`<br><br><div class="gmail_quote" ${ca}><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>From: ${te} &lt;${ne}&gt;<br>Date: ${_}<br>Subject: ${re}<br>To: ${sa(la(t?.Envelope?.To).join(`, `))}<br></div><br>${v}</div>`:`<br><br><div class="gmail_quote" ${ca}><div dir="ltr" class="gmail_attr">On ${_}, ${te} wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${v}</blockquote></div>`:`<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">${sa(ee).replace(/\n/g,`<br>`)}<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${sa(n).replace(/\n/g,`<br>`)}</blockquote></div>`,{subject:l,to:u,cc:d,quotedText:g,quotedHtml:y}}var pa=`alps_last_active`,ma=3e3;function ha(e){try{return window.localStorage.getItem(e)}catch{return null}}function ga(e,t){try{window.localStorage.setItem(e,t)}catch{}}function _a(e){try{window.localStorage.removeItem(e)}catch{}}var va=new class{constructor(){this.events=[`mousedown`,`mousemove`,`keydown`,`scroll`,`touchstart`,`wheel`,`pointerdown`,`pointermove`,`click`,`input`,`focusin`],this.logoutMinutes=0,this.lastActivity=Date.now(),this.lastSync=0,this.lastPing=Date.now(),this.checkInterval=null,this.recordActivity=()=>{let e=Date.now();this.lastActivity=e,!(window.location.hash===`#/login`||window.location.hash===``)&&e-this.lastSync>=ma&&(this.lastSync=e,ga(pa,String(e)))},this.handleActivity=()=>{this.recordActivity()},this.handleStorage=e=>{if(e.key===pa&&e.newValue){let t=Number(e.newValue);Number.isFinite(t)&&t>this.lastActivity&&(this.lastActivity=t)}}}setLogoutTime(e){let t=this.logoutMinutes>0;this.logoutMinutes=e;let n=this.logoutMinutes>0;n&&!t?(this.attachEvents(),this.startInterval()):!n&&t?(this.detachEvents(),this.clearInterval()):n&&t&&this.recordActivity()}attachEvents(){this.lastSync=0,this.events.forEach(e=>{document.addEventListener(e,this.handleActivity,{capture:!0,passive:!0})}),window.addEventListener(`storage`,this.handleStorage),this.recordActivity()}detachEvents(){this.lastSync=0,this.events.forEach(e=>{document.removeEventListener(e,this.handleActivity,{capture:!0})}),window.removeEventListener(`storage`,this.handleStorage)}trackIframe(e){try{let t=e.contentDocument;if(!t)return;this.events.forEach(e=>{t.addEventListener(e,this.handleActivity,{capture:!0,passive:!0})})}catch{}}startInterval(){this.clearInterval(),this.checkInterval=setInterval(()=>this.checkTimeout(),3e4)}clearInterval(){this.checkInterval&&=(clearInterval(this.checkInterval),null)}checkTimeout(){if(this.logoutMinutes<=0)return;if(window.location.hash===`#/login`||window.location.hash===``){this.recordActivity();return}let e=this.lastActivity,t=Number(ha(pa));Number.isFinite(t)&&t>e&&(e=t,this.lastActivity=t);let n=Date.now()-e;n>=this.logoutMinutes*60*1e3?this.logout():n<300*1e3&&Date.now()-this.lastPing>300*1e3&&this.pingBackend()}async pingBackend(){this.lastPing=Date.now();try{await fetch(`/session`)}catch{}}rearm(){this.lastActivity=Date.now(),this.lastPing=Date.now(),this.lastSync=0,this.logoutMinutes>0&&(this.attachEvents(),this.startInterval())}async logout(){this.clearInterval(),this.detachEvents();let e=0;if(this.onBeforeLogout)try{e=(await this.onBeforeLogout())?.failed??0}catch(e){b.error(`Failed to run onBeforeLogout hook`,e)}try{_a(pa),si(e>0?`inactivitySignedOutDraftsLost`:`inactivitySignedOut`);try{await fetch(`/session`,{method:`DELETE`})}catch(e){b.error(`Sign-out request failed; ending the session locally anyway`,e)}br.clear(),je(),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`}catch(e){b.error(`Failed to auto sign out`,e)}finally{this.rearm()}}};function ya(e,t){if(!e.contentDocument||!e.contentDocument.body)return;let n=e.contentDocument.getElementById(`dark-mode-override`);if(n&&n.remove(),t&&document.body.classList.contains(`theme-dark`)){let t=window.getComputedStyle(document.documentElement).getPropertyValue(`--bg-primary`).trim()||`#1f2937`,n=window.getComputedStyle(document.documentElement).getPropertyValue(`--text-primary`).trim()||`#f9fafb`,r=window.getComputedStyle(document.documentElement).getPropertyValue(`--accent-color`).trim()||`#3b82f6`,i=window.getComputedStyle(document.documentElement).getPropertyValue(`--border-color`).trim()||`#374151`,a=e.contentDocument.createElement(`style`);a.id=`dark-mode-override`,a.textContent=`
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
    `,e.contentDocument.head.appendChild(a)}}function ba(e,t){if(!e.contentDocument||!e.contentDocument.body)return;e.style.width=`100%`,e.contentDocument.addEventListener(`dragover`,e=>e.preventDefault()),e.contentDocument.addEventListener(`drop`,e=>e.preventDefault()),va.trackIframe(e),ya(e,t),e._ro&&e._ro.disconnect();let n=e.contentDocument,r=()=>{if(!e.contentDocument)return;let t=e.contentDocument.documentElement,n=e.contentDocument.body,r=Math.max(t?.scrollHeight||0,n?.scrollHeight||0);if(r>0){let t=parseFloat(e.style.height)||0;Math.abs(t-r)>2&&(e.style.height=`${Math.ceil(r)}px`)}};r();let i=new ResizeObserver(()=>r());i.observe(n.body),i.observe(n.documentElement),e._ro=i}function xa(e){if(!e)return``;let t=new DOMParser().parseFromString(e,`text/html`);t.querySelectorAll(`script, style, noscript, head, template`).forEach(e=>e.remove());let n=new Set([`p`,`div`,`br`,`tr`,`li`,`h1`,`h2`,`h3`,`h4`,`h5`,`h6`,`blockquote`,`section`,`article`,`header`,`footer`,`pre`,`table`,`ul`,`ol`]),r=``,i=e=>{for(let t of Array.from(e.childNodes))if(t.nodeType===Node.TEXT_NODE)r+=t.textContent||``;else if(t.nodeType===Node.ELEMENT_NODE){let e=t,a=e.tagName.toLowerCase();if(a===`br`){r+=`
`;continue}i(e),n.has(a)&&(r+=`
`)}};return t.body&&i(t.body),r.replace(/\n{3,}/g,`

`).trim()}function Sa(e,t,n,r){if(!e)return n||r;let i=e;if(t?.toLowerCase()===`text/html`||e.trim().startsWith(`<`)||/<\/[a-zA-Z]+>/.test(e)||/<[a-zA-Z]+[^>]*>/.test(e))try{let t=new DOMParser().parseFromString(e,`text/html`);t.querySelectorAll(`style, script, head`).forEach(e=>e.remove());let n=e=>{if(e.nodeType===Node.TEXT_NODE)return e.textContent||``;if(e.nodeType===Node.ELEMENT_NODE){let t=e,r=t.tagName.toLowerCase();if(r===`br`)return` `;let i=``;for(let e=0;e<t.childNodes.length;e++)i+=n(t.childNodes[e]);return[`p`,`div`,`td`,`tr`,`th`,`li`,`h1`,`h2`,`h3`,`h4`,`h5`,`h6`,`section`,`article`,`blockquote`,`ol`,`ul`,`header`,`footer`].includes(r)?` `+i+` `:i}return``};i=n(t.body||t)}catch{i=e.replace(/<[^>]*>/g,` `)}else i=e.replace(/[\r\n\t]+/g,` `);let a=i.replace(/\s+/g,` `).trim();if(a){let e=a.substring(0,100);return a.length>100?e+`...`:e}else if(n)return n.replace(/[\r\n\t\s]+/g,` `).trim();else return r}var Ca=class extends d{constructor(...e){super(...e),this.showSenderAvatars=!0,this.canToggleRead=!1}static{this.styles=g`
    :host {
      display: block;
      scroll-margin-top: 32px;
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
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
      max-width: 200px;
      line-height: 1.2;
    }

    .thread-card-sender-heading {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
    }

    .thread-card-sender-name {
      font-weight: 600;
      font-size: 14px;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .thread-card-sender-address {
      font-size: 12px;
      font-weight: 400;
      line-height: 1.2;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .avatar-container {
      display: inline-flex;
      flex-shrink: 0;
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

    .thread-card-sender.unread .thread-card-sender-name {
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

    .mobile-only {
      display: none;
    }

    @media (max-width: 768px) {
      .thread-card.expanded .thread-card-date {
        display: none;
      }
      .mobile-only {
        display: flex;
      }
    }
  `}onIframeLoad(e){let t=e.target;ba(t,this.settingsStore?.getState()?.themeIframeContent??!1)}handleCardHeaderClick(){this.dispatchEvent(new CustomEvent(`toggle-expansion`,{detail:{item:this.item},bubbles:!0,composed:!0}))}_closePopup(){let e=this.shadowRoot?.querySelectorAll(`alps-popup`);e&&e.forEach(e=>e.close())}handleStarClick(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-star`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleActionForItem(e){this._closePopup(),this.dispatchEvent(new CustomEvent(`action-for-item`,{detail:{action:e,item:this.item},bubbles:!0,composed:!0}))}handleDeleteItem(){this._closePopup(),this.dispatchEvent(new CustomEvent(`delete-item`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleLoadRemoteResources(){this.dispatchEvent(new CustomEvent(`load-remote-resources`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleEditDraftClick(){this.dispatchEvent(new CustomEvent(`edit-draft-for-item`,{detail:{item:this.item},bubbles:!0,composed:!0}))}renderItemContent(){if(this.item.loading)return n`
        <div style="padding: 16px; display: flex; justify-content: center; align-items: center;">
          <alps-loader></alps-loader>
        </div>
      `;let e=this.item.message||{},t=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,r=String(this.settingsStore?.getState()?.hourFormat||`12`),i=e.Envelope?.Date?an(e.Envelope.Date,t,r):``;return n`
      <div class="reader-meta">
        <div class="reader-recipients-block">
          <div class="reader-recipients">
            <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.to`)}</span>
            <div class="reader-recipients-list">
              ${e.Envelope?.To&&e.Envelope.To.length>0?e.Envelope.To.map(e=>e.Mailbox&&e.Host?n`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``):n`<span class="undisclosed-recipients">${e.Flags?.includes(`\\Draft`)?this.i18nStore?.t(`messageReader.noRecipients`):this.i18nStore?.t(`messageReader.undisclosed`)}</span>`}
            </div>
          </div>
          ${e.Envelope?.Cc&&e.Envelope.Cc.length>0?n`
            <div class="reader-recipients">
              <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.cc`)}</span>
              <div class="reader-recipients-list">
                ${e.Envelope.Cc.map(e=>e.Mailbox&&e.Host?n`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``)}
              </div>
            </div>
          `:``}
          
          <div class="reader-recipients mobile-only" style="margin-top: 4px;">
            <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.date`)||`Date:`}</span>
            <div class="reader-recipients-list">
              <span style="color: var(--text-primary);">${i}</span>
            </div>
          </div>
        </div>
      </div>

      ${this.item.attachments&&this.item.attachments.length>0?n`
        <alps-attachment-list
          .attachments=${this.item.attachments}
          .mailbox=${this.item.mailbox}
          .messageUid=${e.UID}
        ></alps-attachment-list>
      `:``}

      <div class="message-content">
        ${e.HasBimiFailed?n`
          <alps-banner variant="warning" style="margin-bottom: 12px;">
            <span>${this.i18nStore?.t(`messageReader.senderUnverifiedWarning`)}</span>
          </alps-banner>
        `:``}
        ${this.item.activeBanners&&this.item.activeBanners.length>0?n`
          ${this.item.activeBanners.map(e=>e)}
        `:``}
        ${this.item.hasRemoteResources&&!this.item.allowRemoteResources?n`
          <alps-banner style="margin-bottom: 12px;">
            <span>${this.i18nStore?.t(`messageReader.remoteContentWarning`)}</span>
            <alps-button slot="action" variant="normal" @click=${this.handleLoadRemoteResources}>${this.i18nStore?.t(`messageReader.loadRemoteContent`)}</alps-button>
          </alps-banner>
        `:``}
        ${e.Flags?.includes(`\\Draft`)?n`
          <alps-banner style="margin-bottom: 12px;">
            <span>${this.i18nStore?.t(`messageReader.isDraft`)}</span>
            <alps-button slot="action" variant="normal" @click=${this.handleEditDraftClick}>${this.i18nStore?.t(`messageReader.editDraft`)}</alps-button>
          </alps-banner>
        `:``}
        
        <div class="reader-content-wrapper">
          ${this.item.mimeType?.toLowerCase()===`text/html`?n`
            <iframe 
              class="reader-iframe"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              .srcdoc=${l(this.item.content)}
              @load=${this.onIframeLoad}
            ></iframe>
          `:this.item.mimeType?.toLowerCase().startsWith(`multipart/`)||!this.item.content?n`
            <div class="reader-empty-body">
              ${this.i18nStore?.t(`messageReader.noReadableText`)}
            </div>
          `:n`
            <div class="reader-text-wrapper">
              <pre class="reader-preformatted">${this.item.content}</pre>
            </div>
          `}
        </div>
      </div>
    `}render(){let e=this.item.message||{},t=e.Envelope?.From?.[0]||{},r=t.Mailbox&&t.Host?`${t.Mailbox}@${t.Host}`:``,i=t.Name||r||this.i18nStore?.t(`messageList.unknownSender`),a=!!(r&&t.Name?.trim()&&t.Name.trim()!==r),o=a?`${t.Name} <${r}>`:r||i,s=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,c=String(this.settingsStore?.getState()?.hourFormat||`12`),l=e.Envelope?.Date?an(e.Envelope.Date,s,c):``,u=fn(e,t),d=e.Flags?.includes(z),f=!e.Flags?.includes(R),p=e.Snippet||``,m=window.innerWidth<=768?``:this.i18nStore?.t(`messageReader.clickToExpand`)||`Click to expand message content`,h=this.item.expanded?``:Sa(this.item.content,this.item.mimeType,p,m);return n`
      <div class="thread-card ${this.item.expanded?`expanded`:``} ${f?`unread`:``}">
        <div class="thread-card-header" @click=${this.handleCardHeaderClick}>
          <div class="thread-card-summary">
            ${this.showSenderAvatars?n`
              <div class="avatar-container">
                <alps-avatar .name=${i} .email=${r} .size=${28} .src=${u}></alps-avatar>
              </div>
            `:``}
            <div class="thread-card-sender ${f?`unread`:``}" title=${o}>
              <div class="thread-card-sender-heading">
                <span class="thread-card-sender-name">${i}</span>
                <alps-sender-auth-badge ?verified=${!!e.HasBimiPotential} ?failed=${!!e.HasBimiFailed}></alps-sender-auth-badge>
              </div>
              ${a?n`<span class="thread-card-sender-address">${r}</span>`:``}
            </div>
            ${this.item.expanded?``:n`<div class="thread-card-snippet">${h}</div>`}
          </div>
          <div class="thread-card-meta">
            ${this.item.isSent?n`<span class="thread-card-badge">${this.i18nStore?.t(`folderList.sent`)||`Sent`}</span>`:``}
            ${this.item.mailbox!==this.mailbox&&!this.item.isSent?n`<span class="thread-card-badge">${this.item.mailbox}</span>`:``}
            <div class="thread-card-date">${l}</div>
            
            <alps-icon-btn
              style="--icon-size: 16px; --btn-padding: 4px;"
              title=${this.i18nStore?.t(`messageReader.star`)||`Star`}
              ?active=${d}
              @click=${this.handleStarClick}
              icon=${d?`starFourFill`:`starFour`}
            ></alps-icon-btn>
            
            ${this.item.expanded?n`
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
                  ${O(`arrowBendUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reply`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`replyAll`)}>
                  ${O(`arrowBendDoubleUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.replyAll`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`forward`)}>
                  ${O(`arrowBendUpRight`)} <span class="item-text">${this.i18nStore?.t(`messageReader.forward`)}</span>
                </button>
                <div class="dropdown-divider"></div>
                <!-- Everything below is about THIS message. Over a conversation
                     the toolbar acts on all of it, so these live here. -->
                ${this.canToggleRead?n`
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(f?`markRead`:`markUnread`)}>
                  ${O(f?`envelopeOpen`:`envelopeUnread`)} <span class="item-text">${this.i18nStore?.t(f?`messageReader.markRead`:`messageReader.markUnread`)}</span>
                </button>
                `:``}
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`print`)}>
                  ${O(`printer`)} <span class="item-text">${this.i18nStore?.t(`messageReader.print`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`downloadMessage`)}>
                  ${O(`downloadSimple`)} <span class="item-text">${this.i18nStore?.t(`messageReader.downloadMessage`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`showOriginal`)}>
                  ${O(`codeBlock`)} <span class="item-text">${this.i18nStore?.t(`messageReader.showOriginal`)}</span>
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" @click=${()=>this.handleDeleteItem()}>
                  ${O(`trash`)} <span class="item-text">${this.i18nStore?.t(`messageReader.delete`)}</span>
                </button>
              </alps-popup>
            `:``}
            
            <alps-icon-btn
              style="--icon-size: 16px; --btn-padding: 4px;"
              icon=${this.item.expanded?`caretUp`:`caretDown`}
              title=${this.item.expanded?this.i18nStore?.t(`general.collapse`):this.i18nStore?.t(`general.expand`)}
            ></alps-icon-btn>
          </div>
        </div>
        
        ${this.item.expanded?n`
          <div class="thread-card-body">
            ${this.renderItemContent()}
          </div>
        `:``}
      </div>
    `}};k([h({context:C})],Ca.prototype,`settingsStore`,void 0),k([h({context:S})],Ca.prototype,`i18nStore`,void 0),k([h({context:ai})],Ca.prototype,`composeStore`,void 0),k([o({type:Object})],Ca.prototype,`item`,void 0),k([o({type:String})],Ca.prototype,`mailbox`,void 0),k([o({type:Boolean})],Ca.prototype,`showSenderAvatars`,void 0),k([o({type:Boolean})],Ca.prototype,`canToggleRead`,void 0),Ca=k([p(`alps-thread-card`)],Ca);function wa(e){return!!e?.Flags?.includes(Cr)}var Ta=10,K=class extends d{constructor(...e){super(...e),this.localPreferredView=null,this.hasHtml=!1,this.hasText=!1,this.mailbox=E,this.message=null,this.messages=[],this.selectedKeys=new Set,this.selectedCount=0,this.allSelectedStarred=!1,this.allSelectedUnread=!1,this.commonTags=[],this.bulkProcessing=!1,this.layoutMode=`vertical`,this.mailboxes=[],this.content=``,this.mimeType=``,this.loading=!1,this.activeBanners=[],this.attachments=[],this.allowRemoteResources=!1,this.hasRemoteResources=!1,this.rawMessageHtml=``,this.isScrolled=!1,this.threadItems=[],this._isThread=!1,this._deferPropertySync=!1,this._conversation=null,this.scrolledToKey=null,this.scrollTimer=null,this.readDueAt=new Map,this.readTimer=null,this._handleDraftDiscarded=e=>{let t=e.detail;if(!t?.mailbox||!t.uid||!this.message)return;let n=H(t.mailbox,t.uid);this.threadItems.some(e=>this.itemKey(e)===n)&&this.dropCard(n),this.keyOf(this.message)===n&&this.dispatchEvent(new CustomEvent(`close`))},this._handleExternalFlagsChanged=e=>{let t=e;if(!t.detail)return;let{keys:n,flag:r,action:i}=t.detail;if(!this.threadItems||this.threadItems.length===0)return;let a=new Set(n),o=!1;for(let e=0;e<this.threadItems.length;e++){let t=this.threadItems[e];if(t.message&&a.has(this.itemKey(t))){let n=t.message.Flags||[],a=n.includes(r);i===`add`&&!a?(this.threadItems[e]={...t,message:{...t.message,Flags:[...n,r]}},o=!0):i===`remove`&&a&&(this.threadItems[e]={...t,message:{...t.message,Flags:n.filter(e=>e!==r)}},o=!0)}}if(o&&(this.threadItems=[...this.threadItems],this.requestUpdate(),this.message&&a.has(this.keyOf(this.message)))){let e=this.message.Flags?.includes(r);i===`add`&&!e?this.message.Flags=[...this.message.Flags||[],r]:i===`remove`&&e&&(this.message.Flags=this.message.Flags.filter(e=>e!==r)),this.message={...this.message}}},this.prefetchQueue=[],this.prefetching=!1,this._handleSettingsChange=()=>{this.applyThemeToAllIframes()},this.handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0}}ownAddresses(){let e=this.settingsStore?.getState();return[e?.loginUsername||ke()||``,e?.replyTo||``].filter(Boolean)}_closePopup(){let e=this.shadowRoot?.querySelectorAll(`alps-popup`);e&&e.forEach(e=>e.close())}async _handleAction(e,t){if(e===`reply`||e===`replyAll`||e===`forward`){if(!this.message)return;this._closePopup();let t=``;if(this.mimeType===`text/plain`)t=this.content;else{try{let e=await T(`/mailboxes/${D(this.mailboxOfMessage(this.message))}/messages/${this.message.UID}?view=text`);if(e.ok){let n=await e.json();n.Part&&n.RawText&&(t=n.RawText)}}catch(e){b.error(`Failed to fetch text body for quote`,e)}!t&&this.rawMessageHtml&&(t=xa(this.rawMessageHtml))}let n=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,r=String(this.settingsStore?.getState()?.hourFormat||`12`),{subject:i,to:a,cc:o,quotedText:s,quotedHtml:c}=fa(e,this.message,t,this.rawMessageHtml,this.hasHtml,n,r,this.ownAddresses()),l=e===`forward`?this.attachments.map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})):[],u=[...l,...Xr(this.message.BodyStructure).filter(e=>!l.some(t=>t.partPath===e.partPath))],d=e===`reply`||e===`replyAll`?Zr(this.message,this.message.Mailbox||this.mailbox):{};this.composeStore.openComposer({subject:i,to:a,cc:o,text:s,html:c,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:u,quoteSource:{mailbox:this.message.Mailbox||this.mailbox,uid:String(this.message.UID),structure:this.message.BodyStructure},...d});return}if(e===`showPlaintext`){this.localPreferredView=`text`,this.message&&this.fetchMessageBody(this.message),this._closePopup();return}if(e===`showHtml`){this.localPreferredView=`html`,this.message&&this.fetchMessageBody(this.message),this._closePopup();return}if(e===`print`){let e=this.allowRemoteResources?`&remote=1`:``;window.open(`#/print?mailbox=`+encodeURIComponent(this.mailboxOfMessage(this.message))+`&uid=`+this.message.UID+e,`_blank`),this._closePopup();return}if(this._closePopup(),this.toolbarIsConversation)if(e===`markUnread`){let e=this.unreadKeys;if(e.length>0)return void this.markMembersRead(e)}else{this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,folder:t,uids:this.conversationUids}}));return}this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,folder:t}}))}get openIsUnsent(){return this.message?wa(this.message)||Jt(this.mailbox||``,this.mailboxes)===`drafts`:!1}get toolbarIsConversation(){return!(this.selectedCount>0)&&this.threadItems.length>1&&!this.openIsUnsent&&this.conversationItems.length>0}get conversationItems(){return this.threadItems.filter(e=>e.message&&e.mailbox===this.mailbox)}get conversationUids(){return this.conversationItems.map(e=>String(e.message.UID))}get unreadKeys(){return this.threadItems.filter(e=>e.message&&!e.message.Flags?.includes(`\\Seen`)&&!wa(e.message)).map(e=>this.itemKey(e))}get readToggleMarksRead(){return this.selectedCount>0?this.allSelectedUnread:this.toolbarIsConversation?this.unreadKeys.length>0:!this.message?.Flags?.includes(R)}hasTag(e){let t=e.toLowerCase(),n=e=>!!e?.some(e=>e.toLowerCase()===t);if(this.selectedCount>0)return n(this.commonTags);if(this.toolbarIsConversation){let e=this.conversationItems;return e.length>0&&e.every(e=>n(e.message.Flags))}return n(this.message?.Flags)}_handleTag(e){this._closePopup();let t=this.toolbarIsConversation?this.conversationUids:void 0;this.dispatchEvent(new CustomEvent(`action`,{detail:{action:this.hasTag(e)?`removeTag`:`addTag`,folder:e,uids:t}}))}_handleRemoveAllTags(){this._closePopup();let e=this.selectedCount>0,t;if(e){let e=new Set;for(let t of this.messages)for(let n of[t,...t.SubMessages||[]])if(this.selectedKeys.has(this.keyOf(n)))for(let t of Ir(n.Flags))e.add(t);t=[...e]}else if(this.toolbarIsConversation){let e=new Set;for(let t of this.conversationItems)for(let n of Ir(t.message.Flags))e.add(n);t=[...e]}else t=Ir(this.message?.Flags);if(t.length===0)return;let n=!e&&this.toolbarIsConversation?this.conversationUids:void 0;this.dispatchEvent(new CustomEvent(`action`,{detail:{action:`removeTag`,tags:t,uids:n}}))}keyOf(e){return H(this.mailboxOfMessage(e),e?.UID)}mailboxOfMessage(e){return xi(e,this.mailbox)}itemKey(e){return H(e.mailbox,e.message?.UID)}isOpenItem(e){return!!this.message&&this.itemKey(e)===this.keyOf(this.message)}listedKeys(){let e=new Set;for(let t of this.messages||[]){e.add(this.keyOf(t));for(let n of t.SubMessages||[])e.add(this.keyOf(n))}return e}cardId(e){return`thread-card-${encodeURIComponent(e.mailbox)}-${e.message?.UID}`}connectedCallback(){super.connectedCallback(),window.addEventListener(`external-message-flags-changed`,this._handleExternalFlagsChanged),window.addEventListener(`draft-discarded`,this._handleDraftDiscarded),this.updateComplete.then(()=>{this.settingsStore?.addEventListener(`change`,this._handleSettingsChange)})}disconnectedCallback(){this.settingsStore?.removeEventListener(`change`,this._handleSettingsChange),window.removeEventListener(`external-message-flags-changed`,this._handleExternalFlagsChanged),this.readDueAt.clear(),this.prefetchQueue=[],this.readTimer&&clearTimeout(this.readTimer),this.readTimer=null,this.scrollTimer&&clearTimeout(this.scrollTimer),this.scrollTimer=null,window.removeEventListener(`draft-discarded`,this._handleDraftDiscarded),super.disconnectedCallback()}static{this.styles=[En,g`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .tags-popup .dropdown-item.active svg {
      margin-left: auto;
      color: var(--text-secondary, #9ca3af);
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
      display: inline-flex;
      flex-shrink: 0;
    }

    .reader-sender-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .reader-sender-line {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px 8px;
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

      .reader-recipients.mobile-only {
        display: flex;
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
        margin-top: 4px;
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

    /* Lined up with the cards above it, and wrapping rather than shrinking:
       three labels do not fit a narrow pane in German. */
    .conversation-reply {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 0 16px 24px;
    }
  `]}updated(e){if(!e.has(`message`))return;if(!this.message){this.scrolledToKey=null;return}let t=this.keyOf(this.message);t!==this.scrolledToKey&&(this.scrolledToKey=t,this.scrollToCard(t))}scrollToCard(e){this.scrollTimer&&clearTimeout(this.scrollTimer),this.scrollTimer=setTimeout(()=>{this.scrollTimer=null;let t=this.threadItems.find(t=>this.itemKey(t)===e),n=t?this.shadowRoot?.getElementById(this.cardId(t)):null;n&&n.scrollIntoView({behavior:`smooth`,block:`start`})},50)}willUpdate(e){let t=e.has(`message`),n=e.has(`mailbox`),r=e.has(`messages`);if(t||n){let t=e.get(`message`),n=e.has(`mailbox`)?e.get(`mailbox`):this.mailbox;this.message?!t||this.keyOf(t)!==this.keyOf(this.message)||n!==this.mailbox?(this.localPreferredView=null,this.fetchMessageBody(this.message,this.message._isAutosaveUpdate)):(t&&(t.HasBimiPotential&&!this.message.HasBimiPotential&&(this.message={...this.message,HasBimiPotential:!0}),t.HasBimiFailed&&!this.message.HasBimiFailed&&(this.message={...this.message,HasBimiFailed:!0})),this.resolveThread(this.message),this.message._isAutosaveUpdate&&t&&this.message!==t&&this.fetchMessageBody(this.message,!0)):(this.localPreferredView=null,this.content=``,this.mimeType=``,this.rawMessageHtml=``,this.loading=!1,this.allowRemoteResources=!1,this.hasRemoteResources=!1,this.hasHtml=!1,this.hasText=!1,this.activeBanners=[],this.threadItems=[])}else r&&this.message&&this.resolveThread(this.message);this.syncReadTimers()}syncReadTimers(){let e=this.settingsStore?.getState()?.markReadTimeout??0,t=this.selectedCount>0,n=new Set;if(e>=0&&this.threadItems.length>1&&!t)for(let e of this.threadItems)!e.message||!e.expanded||this.isOpenItem(e)||e.message.Flags?.includes(`\\Seen`)||wa(e.message)||n.add(this.itemKey(e));let r=!1;for(let e of[...this.readDueAt.keys()])n.has(e)||(r=this.readDueAt.delete(e)||r);for(let t of n)this.readDueAt.has(t)||(this.readDueAt.set(t,Date.now()+e*1e3),r=!0);r&&this.armReadTimer()}armReadTimer(){if(this.readTimer&&clearTimeout(this.readTimer),this.readTimer=null,this.readDueAt.size===0)return;let e=Math.max(0,Math.min(...this.readDueAt.values())-Date.now());this.readTimer=setTimeout(()=>this.flushReadDue(),e)}flushReadDue(){this.readTimer=null;let e=Date.now(),t=[...this.readDueAt].filter(([,t])=>t<=e).map(([e])=>e);for(let e of t)this.readDueAt.delete(e);let n=t.filter(e=>{let t=this.threadItems.find(t=>this.itemKey(t)===e);return!!t&&t.expanded&&!t.message?.Flags?.includes(`\\Seen`)});n.length>0&&this.markMembersRead(n),this.armReadTimer()}patchMemberFlag(e,t,n){let r=e=>{let r=e?.Flags||[],i=r.includes(t);return n===`add`===i?e:{...e,Flags:n===`add`?[...r,t]:r.filter(e=>e!==t)}},i=this.threadItems.findIndex(t=>this.itemKey(t)===e);if(i!==-1){let e=this.threadItems[i],t=r(e.message);t!==e.message&&(this.threadItems[i]={...e,message:t},this.threadItems=[...this.threadItems])}this._conversation&&={...this._conversation,messages:this._conversation.messages.map(t=>this.keyOf(t)===e?r(t):t)},this.message&&this.keyOf(this.message)===e&&(this.message.Flags=r(this.message).Flags,this.requestUpdate())}async markMembersRead(e){let t=new Set(e),n=new Map;for(let e of this.threadItems){if(!e.message||!t.has(this.itemKey(e)))continue;let r=n.get(e.mailbox)??[];r.push(String(e.message.UID)),n.set(e.mailbox,r)}let r=this.listedKeys(),i=(e,t,n)=>{for(let i of t){let t=H(e,i);r.has(t)&&this.isConnected&&this.dispatchEvent(new CustomEvent(`message-flags-changed`,{detail:{uid:i,mailbox:e,flag:R,action:n},bubbles:!0,composed:!0})),this.patchMemberFlag(t,R,n)}};await Promise.all([...n].map(async([e,t])=>{i(e,t,`add`);let n=!1;try{n=(await B.setFlag(e,t,[R],`add`)).ok}catch(e){b.error(`Failed to mark conversation messages read`,e)}n||i(e,t,`remove`)}))}expandUnreadOnOpen(){if(this.openIsUnsent)return;let e=this.threadItems.filter(e=>e.message&&!e.message.Flags?.includes(`\\Seen`)&&!wa(e.message)),t=!1;for(let n of e.slice(0,Ta))n.expanded||(n.expanded=!0,t=!0,!n.content&&!n.loading&&(n.loading=!0,this.queueItemBody(n)));return t&&(this.threadItems=[...this.threadItems]),e[0]?this.itemKey(e[0]):void 0}settleOpenedConversation(){if(!this.message||this.threadItems.length<2)return;let e=this.expandUnreadOnOpen();e&&e!==this.keyOf(this.message)&&this.scrollToCard(e)}loadRemoteResources(){if(this.allowRemoteResources=!0,this.message&&this.rawMessageHtml){this.hasRemoteResources=!1,this.content=aa(this.rawMessageHtml,{mailbox:this.mailboxOfMessage(this.message),messageUid:this.message.UID,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}});let e=this.threadItems.find(e=>this.isOpenItem(e));e&&(e.allowRemoteResources=!0,e.content=this.content,e.hasRemoteResources=this.hasRemoteResources,this.updateThreadItemReference(e))}}resolveThread(e){if(!e)return;let t=this.settingsStore?.getState()?.enableThreading??!0,n=[],r=null;if(t&&this.messages&&this.messages.length>0){let t=this.messages.find(t=>this.keyOf(t)===this.keyOf(e));if(t)r=t;else for(let t of this.messages)if(t.SubMessages&&t.SubMessages.find(t=>this.keyOf(t)===this.keyOf(e))){r=t;break}}if(r?(n=[r,...r.SubMessages||[]],n.sort((e,t)=>(e.Envelope?.Date?new Date(e.Envelope.Date).getTime():0)-(t.Envelope?.Date?new Date(t.Envelope.Date).getTime():0))):n=(t&&this.threadItems.length>1&&this.threadItems.some(t=>this.itemKey(t)===this.keyOf(e))?this.threadItems.map(e=>({...e.message,Mailbox:e.mailbox})):null)??[e],t&&this._conversation?.key===this.keyOf(e)){let e=new Set(n.map(e=>this.keyOf(e))),t=this._conversation.messages.filter(t=>!e.has(this.keyOf(t)));t.length>0&&(n=[...n,...t],n.sort((e,t)=>(e.Envelope?.Date?new Date(e.Envelope.Date).getTime():0)-(t.Envelope?.Date?new Date(t.Envelope.Date).getTime():0)))}this._isThread=t&&n.length>1;let i=this.getSentMailboxName(),a=this.threadItems||[];this.threadItems=n.map(t=>{let n=this.keyOf(t)===this.keyOf(e),r=a.find(e=>this.itemKey(e)===this.keyOf(t));if(r){let e={...t,Flags:t.Flags||r.message.Flags||[]};return r.message.HasBimiPotential&&(e.HasBimiPotential=!0),r.message.HasBimiFailed&&(e.HasBimiFailed=!0),{...r,message:e}}return{message:t,content:``,mimeType:``,loading:!1,attachments:[],rawMessageHtml:``,hasHtml:!1,hasText:!1,activeBanners:[],allowRemoteResources:this.allowRemoteResources,hasRemoteResources:!1,isSent:(this.mailbox||``).toLowerCase()===i.toLowerCase()||(t.Mailbox||``).toLowerCase()===i.toLowerCase(),mailbox:t.Mailbox||this.mailbox,expanded:n}})}async fetchMessageBody(e,t=!1){e&&(e._isAutosaveUpdate=!1),this.message&&(this.message._isAutosaveUpdate=!1),t||(this.content=``,this.mimeType=``,this.rawMessageHtml=``,this.loading=!0,this.activeBanners=[],this.allowRemoteResources=this.settingsStore?.getState().showRemoteContent===`always`,this.hasRemoteResources=!1,this.threadItems=[],this._conversation=null),this.resolveThread(e),this.prefetchQueue=[];let n=this.threadItems.find(t=>this.itemKey(t)===this.keyOf(e))||this.threadItems[0];if(n){n.loading=!t,n.expanded=!0,this._deferPropertySync=!1;let r=this.fetchItemBody(n);r.then(()=>{this.isConnected&&(!this.message||this.keyOf(this.message)!==this.keyOf(e)||this.requestUpdate())}),t||r.catch(()=>{}).then(()=>this.loadConversation(e));return}t||this.loadConversation(e)}queueItemBody(e){this.isConnected&&(this.prefetchQueue.push(e),this.drainPrefetch())}async drainPrefetch(){if(!this.prefetching){this.prefetching=!0;try{for(;this.prefetchQueue.length>0;){let e=this.prefetchQueue.shift();e.content||await this.fetchItemBody(e)}}finally{this.prefetching=!1}}}async loadConversation(e,t=!0){if(!(this.settingsStore?.getState()?.enableThreading??!0)||!e?.UID)return;let n=this.keyOf(e),r=e.Mailbox||this.mailbox;try{let t=await T(`/mailboxes/${D(r)}/messages/${e.UID}/thread`);if(t.ok){let e=await t.json(),r=Array.isArray(e?.Messages)?e.Messages:[];if(!this.isConnected||!this.message||this.keyOf(this.message)!==n)return;this._conversation={key:n,messages:r},r.length>1&&(this.resolveThread(this.message),this.requestUpdate())}}catch(e){b.error(`Failed to load the conversation`,e)}t&&this.message&&this.keyOf(this.message)===n&&this.settleOpenedConversation()}updateThreadItemReference(e){if(!e.message||!this.isConnected)return;let t=this.threadItems.findIndex(t=>this.itemKey(t)===this.itemKey(e));t!==-1&&(this.threadItems[t]={...e},this.threadItems=[...this.threadItems])}async fetchItemBody(e){if(!e.message)return;let t=e.message,n=e.mailbox,r=this.localPreferredView||this.settingsStore?.getState()?.preferredView||`html`;try{let i=br.get(n,t.UID.toString(),r);if(i){if(e.attachments=i.Attachments||[],e.hasHtml=i.HasHTML||!1,e.hasText=i.HasText||!1,i.Message&&(e.message={...t,...i.Message}),i.Part)if(e.mimeType=i.Part.MIMEType||i.Part.MimeType||`text/plain`,i.RawHtml===void 0){if(i.RawText!==void 0){e.content=i.RawText;let t={content:e.content,isHtml:!1,message:e.message,mailbox:n,banners:[],i18nStore:this.i18nStore},r=await v.invokeHookAsync(`reader:content`,t);for(let t of r)t&&typeof t==`string`&&(e.content=t);e.activeBanners=t.banners||[],t.isHtml&&(e.mimeType=`text/html`,e.hasHtml=!0,e.content=aa(e.content,{mailbox:n,messageUid:e.message?.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:e.message?.BodyStructure,onRemoteResourceBlocked:()=>{e.hasRemoteResources=!0,this.isOpenItem(e)&&(this.hasRemoteResources=!0)}}))}}else{e.rawMessageHtml=i.RawHtml;let t={content:e.rawMessageHtml,isHtml:!0,message:e.message,mailbox:n,banners:[],i18nStore:this.i18nStore},r=await v.invokeHookAsync(`reader:content`,t);for(let t of r)t&&typeof t==`string`&&(e.rawMessageHtml=t);e.activeBanners=t.banners||[],e.content=aa(e.rawMessageHtml,{mailbox:n,messageUid:e.message?.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:e.message?.BodyStructure,onRemoteResourceBlocked:()=>{e.hasRemoteResources=!0,this.isOpenItem(e)&&(this.hasRemoteResources=!0)}})}e.loading=!1,this.isConnected&&!this._deferPropertySync&&this.isOpenItem(e)&&(this.content=e.content,this.mimeType=e.mimeType,this.rawMessageHtml=e.rawMessageHtml,this.attachments=e.attachments,this.hasHtml=e.hasHtml,this.hasText=e.hasText,this.activeBanners=e.activeBanners,this.allowRemoteResources=e.allowRemoteResources,this.hasRemoteResources=e.hasRemoteResources,this.loading=!1,this.message={...this.message,...e.message}),this.updateThreadItemReference(e);return}let a=await T(`/mailboxes/${D(n)}/messages/${t.UID}?view=${r}`);if(a.status===401){window.location.hash=`/login`;return}if(!a.ok)throw Error(`Failed to fetch metadata`);let o=await a.json();e.attachments=o.Attachments||[],e.hasHtml=!!o.HasHTML,e.hasText=!!o.HasText,o.Message&&(e.message={...e.message,...o.Message});let s,c,l=o.Part;if(l){e.mimeType=l.MIMEType||l.MimeType||`text/plain`;let r=Array.isArray(l.Path)?l.Path.join(`.`):l.Path,i=await T(`/mailboxes/${D(n)}/messages/${t.UID}/raw?part=${r}`);if(i.status===401){window.location.hash=`/login`;return}if(i.ok)if(e.mimeType.toLowerCase()===`text/html`){s=await i.text(),e.rawMessageHtml=s;let t={content:e.rawMessageHtml,isHtml:!0,message:e.message,mailbox:n,banners:[],i18nStore:this.i18nStore},r=await v.invokeHookAsync(`reader:content`,t);for(let t of r)t&&typeof t==`string`&&(e.rawMessageHtml=t);e.activeBanners=t.banners||[],e.content=aa(e.rawMessageHtml,{mailbox:n,messageUid:e.message?.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:e.message?.BodyStructure,onRemoteResourceBlocked:()=>{e.hasRemoteResources=!0,this.isOpenItem(e)&&(this.hasRemoteResources=!0)}})}else{c=await i.text(),e.content=c;let t={content:e.content,isHtml:!1,message:e.message,mailbox:n,banners:[],i18nStore:this.i18nStore},r=await v.invokeHookAsync(`reader:content`,t);for(let t of r)t&&typeof t==`string`&&(e.content=t);e.activeBanners=t.banners||[],t.isHtml&&(e.mimeType=`text/html`,e.hasHtml=!0,e.content=aa(e.content,{mailbox:n,messageUid:e.message?.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:e.message?.BodyStructure,onRemoteResourceBlocked:()=>{e.hasRemoteResources=!0,this.isOpenItem(e)&&(this.hasRemoteResources=!0)}}))}}br.set(n,t.UID.toString(),r,{Message:o.Message,Part:o.Part,Attachments:o.Attachments,RawHtml:s,RawText:c,HasHTML:e.hasHtml,HasText:e.hasText})}catch(t){b.error(`Failed to fetch message:`,t),e.content=`Error loading message.`}finally{e.loading=!1,this.isConnected&&!this._deferPropertySync&&this.isOpenItem(e)&&(this.content=e.content,this.mimeType=e.mimeType,this.rawMessageHtml=e.rawMessageHtml,this.attachments=e.attachments,this.hasHtml=e.hasHtml,this.hasText=e.hasText,this.activeBanners=e.activeBanners,this.allowRemoteResources=e.allowRemoteResources,this.hasRemoteResources=e.hasRemoteResources,this.loading=!1,this.message={...this.message,...e.message}),this.updateThreadItemReference(e)}}getSentMailboxName(){if(this.mailboxes&&Array.isArray(this.mailboxes)){for(let e of this.mailboxes){let t=e.Name||e.Mailbox;if(t&&(e.Attrs||[]).some(e=>typeof e==`string`&&(e.toLowerCase()===`\\sent`||e.toLowerCase()===`\\\\sent`)))return t}let e=[`sent`,`sent messages`,`sent items`,`sent-mail`];for(let t of this.mailboxes){let n=t.Name||t.Mailbox;if(n&&e.includes(n.toLowerCase()))return n}}return zt}async toggleItemExpansion(e){e.expanded=!e.expanded,this.updateThreadItemReference(e),e.expanded&&!e.content&&!e.loading&&(e.loading=!0,this.updateThreadItemReference(e),await this.fetchItemBody(e))}loadRemoteResourcesForItem(e){e.allowRemoteResources=!0,e.message&&e.rawMessageHtml&&(e.hasRemoteResources=!1,e.content=aa(e.rawMessageHtml,{mailbox:e.mailbox,messageUid:e.message.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:e.message.BodyStructure,onRemoteResourceBlocked:()=>{e.hasRemoteResources=!0}}),this.isOpenItem(e)&&(this.content=e.content,this.allowRemoteResources=!0,this.hasRemoteResources=e.hasRemoteResources),this.updateThreadItemReference(e))}async toggleItemStar(e){if(!e.message)return;let t=e.message.Flags?.includes(z),n=t?`remove`:`add`;t?e.message.Flags=e.message.Flags.filter(e=>e!==z):e.message.Flags=[...e.message.Flags||[],z],this.updateThreadItemReference(e);let r=this.listedKeys().has(this.itemKey(e)),i=t=>{r&&this.dispatchEvent(new CustomEvent(`message-flags-changed`,{detail:{uid:String(e.message.UID),mailbox:e.mailbox,flag:z,action:t},bubbles:!0,composed:!0}))};i(n);try{let{ok:r}=await B.setFlag(e.mailbox,[String(e.message.UID)],[z],n);r?this.isOpenItem(e)&&(this.message.Flags=e.message.Flags,this.requestUpdate()):(t?e.message.Flags=[...e.message.Flags||[],z]:e.message.Flags=e.message.Flags.filter(e=>e!==z),this.updateThreadItemReference(e),i(t?`add`:`remove`))}catch(n){b.error(`Failed to toggle star for thread item`,n),t?e.message.Flags=[...e.message.Flags||[],z]:e.message.Flags=e.message.Flags.filter(e=>e!==z),this.updateThreadItemReference(e),i(t?`add`:`remove`)}}deleteItem(e){if(!e.message)return;let t=this.itemKey(e),n=this.isOpenItem(e)?[...this.conversationItems].reverse().find(e=>this.itemKey(e)!==t):void 0;this.dispatchEvent(new CustomEvent(`action`,{detail:{action:`delete`,uid:String(e.message.UID),mailbox:e.mailbox,nextUid:n?String(n.message.UID):void 0,done:e=>{e&&this.dropCard(t)}}}))}dropCard(e){if(this.threadItems=this.threadItems.filter(t=>this.itemKey(t)!==e),this._conversation&&={...this._conversation,messages:this._conversation.messages.filter(t=>this.keyOf(t)!==e)},this.threadItems.length===1&&!this.threadItems[0].expanded){let e=this.threadItems[0];e.expanded=!0,!e.content&&!e.loading&&(e.loading=!0,this.fetchItemBody(e))}this._isThread=this.threadItems.length>1,this.requestUpdate()}reloadConversation(){this.message&&this.loadConversation(this.message,!1)}async _handleActionForItem(e,t){if(e===`reply`||e===`replyAll`||e===`forward`){let n=``;if(t.mimeType===`text/plain`)n=t.content;else{try{let e=await T(`/mailboxes/${D(t.mailbox)}/messages/${t.message.UID}?view=text`);if(e.ok){let t=await e.json();t.Part&&t.RawText&&(n=t.RawText)}}catch(e){b.error(`Failed to fetch text body for quote`,e)}!n&&t.rawMessageHtml&&(n=xa(t.rawMessageHtml))}let r=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,i=String(this.settingsStore?.getState()?.hourFormat||`12`),{subject:a,to:o,cc:s,quotedText:c,quotedHtml:l}=fa(e,t.message,n,t.rawMessageHtml,t.hasHtml,r,i,this.ownAddresses()),u=e===`forward`?t.attachments.map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})):[],d=[...u,...Xr(t.message.BodyStructure).filter(e=>!u.some(t=>t.partPath===e.partPath))],f=e===`reply`||e===`replyAll`?Zr(t.message,t.mailbox):{};this.composeStore.openComposer({subject:a,to:o,cc:s,text:c,html:l,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:d,quoteSource:{mailbox:t.mailbox,uid:String(t.message.UID),structure:t.message.BodyStructure},...f});return}if(e===`markRead`)return void this.markMembersRead([this.itemKey(t)]);if(e===`markUnread`||e===`downloadMessage`||e===`showOriginal`){this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,uid:String(t.message.UID),mailbox:t.mailbox}}));return}if(e===`showPlaintext`){this.localPreferredView=`text`,this.fetchItemBody(t);return}if(e===`showHtml`){this.localPreferredView=`html`,this.fetchItemBody(t);return}if(e===`print`){let e=t.allowRemoteResources?`&remote=1`:``;window.open(`#/print?mailbox=`+encodeURIComponent(t.mailbox)+`&uid=`+t.message.UID+e,`_blank`);return}}applyThemeToIframe(e){ya(e,this.settingsStore?.getState()?.themeIframeContent??!1)}applyThemeToAllIframes(){let e=this.shadowRoot?.querySelectorAll(`iframe.reader-iframe`);e&&e.forEach(e=>this.applyThemeToIframe(e))}onIframeLoad(e){let t=e.target;ba(t,this.settingsStore?.getState()?.themeIframeContent??!1)}async _handleEditDraft(e){let t=e&&!(e instanceof Event),n=t?e.message:this.message,r=t?e.mailbox:this.mailboxOfMessage(n);if(!n)return;t&&e&&!e.content&&!e.loading&&(e.loading=!0,this.updateThreadItemReference(e),await this.fetchItemBody(e));let i=t&&e?e.content:this.content,a=t&&e?e.mimeType:this.mimeType,o=t&&e?e.rawMessageHtml:this.rawMessageHtml,s=t&&e?e.attachments:this.attachments,c=``;if(a===`text/plain`)c=i;else{try{let e=await T(`/mailboxes/${D(r)}/messages/${n.UID}?view=text`);if(e.ok){let t=await e.json();t.Part&&t.RawText&&(c=t.RawText)}}catch(e){b.error(`Failed to fetch text body for draft`,e)}c||=xa(o)}let l=(s||[]).map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})),u=e=>e?e.map(e=>e.Name?`${e.Name} <${e.Mailbox}@${e.Host}>`:`${e.Mailbox}@${e.Host}`):[];this.composeStore.openComposer({draftUid:n.UID.toString(),draftMailbox:r,subject:n.Envelope?.Subject||``,to:u(n.Envelope?.To),cc:u(n.Envelope?.Cc),bcc:u(n.Envelope?.Bcc),text:c,html:o,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:l,quoteSource:{mailbox:r,uid:n.UID.toString(),structure:n.BodyStructure},inReplyTo:n.Envelope?.InReplyTo||void 0,references:Array.isArray(n.References)&&n.References.length?n.References:void 0})}get showSenderAvatars(){return this.settingsStore?.getState()?.showSenderAvatars??!0}canToggleReadFor(e){return!e.message||e.isSent||wa(e.message)||Jt(this.mailbox||``,this.mailboxes)===`trash`?!1:(this.mailbox||``).toLowerCase()!==this.getSentMailboxName().toLowerCase()}get newestAnswerable(){return[...this.threadItems].reverse().find(e=>e.message&&!wa(e.message))}async answerNewest(e){let t=this.newestAnswerable;if(!t)return;let n=this.itemKey(t);!t.content&&!t.loading&&await this.fetchItemBody(t);let r=this.threadItems.find(e=>this.itemKey(e)===n)??t;await this._handleActionForItem(e,r)}renderConversationReply(){return!this.toolbarIsConversation||!this.newestAnswerable?``:n`
      <div class="conversation-reply">
        <alps-button variant="normal" icon="arrowBendUpLeft" @click=${()=>this.answerNewest(`reply`)}>${this.i18nStore?.t(`messageReader.reply`)}</alps-button>
        <alps-button variant="normal" icon="arrowBendDoubleUpLeft" @click=${()=>this.answerNewest(`replyAll`)}>${this.i18nStore?.t(`messageReader.replyAll`)}</alps-button>
        <alps-button variant="normal" icon="arrowBendUpRight" @click=${()=>this.answerNewest(`forward`)}>${this.i18nStore?.t(`messageReader.forward`)}</alps-button>
      </div>
    `}renderThreadCard(e){return n`
      <alps-thread-card
        id=${this.cardId(e)}
        .item=${e}
        .mailbox=${this.mailbox}
        .canToggleRead=${this.canToggleReadFor(e)}
        .showSenderAvatars=${this.showSenderAvatars}
        @toggle-expansion=${e=>this.toggleItemExpansion(e.detail.item)}
        @load-remote-resources=${e=>this.loadRemoteResourcesForItem(e.detail.item)}
        @toggle-star=${e=>this.toggleItemStar(e.detail.item)}
        @delete-item=${e=>this.deleteItem(e.detail.item)}
        @action-for-item=${e=>this._handleActionForItem(e.detail.action,e.detail.item)}
        @edit-draft-for-item=${e=>{this._handleEditDraft(e.detail.item)}}
      ></alps-thread-card>
    `}render(){let e=this.selectedCount>0,t=this.settingsStore?.getState()?.enableThreading??!0;if(!this.message&&!e)return n`
        <div class="empty-reader-state">
          ${this.bulkProcessing?n`
            <!--
              A bulk write is still running, and the rows it is about have
              already left the list — so the selection is empty and this pane
              would otherwise flip back to "select a message" while the server
              is still working. The loader is the one place left that can say
              so, and it needs no words to.
            -->
            <div class="bulk-spinner-container"><alps-loader></alps-loader></div>
          `:this.i18nStore?.t(`messageReader.selectMessage`)}
        </div>
      `;let r=this.localPreferredView||this.settingsStore?.getState()?.preferredView||`html`,i=this.message||{},a=Pr(i.Flags,this.i18nStore),o=new Set([`$label1`,`$label2`,`$label3`,`$label4`,`$label5`]),s=e||!this.message?[]:Ir(i.Flags).filter(e=>!o.has(e.toLowerCase())),c=i.Envelope?.From?.[0]||{},u=c.Mailbox&&c.Host?`${c.Mailbox}@${c.Host}`:``,d=c.Name||u||this.i18nStore?.t(`messageList.unknownSender`),f=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,p=String(this.settingsStore?.getState()?.hourFormat||`12`),m=i.Envelope?.Date?an(i.Envelope.Date,f,p):``,h=fn(i,c),ee=(this.mailbox||``).toLowerCase(),g=Jt(this.mailbox||``,this.mailboxes),te=g===`archive`,ne=g===`junk`,re=g===`trash`,_=g===`drafts`,v=ee===this.getSentMailboxName().toLowerCase(),y=this.toolbarIsConversation,ie=this.readToggleMarksRead,ae=y?this.i18nStore?.t(`messageReader.deleteThread`):this.message?.Flags?.includes(`\\Draft`)||_?this.i18nStore?.t(`messageReader.discardDraft`):this.i18nStore?.t(`messageReader.delete`);return n`
      <alps-toolbar class="toolbar" ?scrolled=${this.isScrolled}>
        ${this.layoutMode===`full`?n`
          <alps-icon-btn @click=${()=>this.dispatchEvent(new CustomEvent(`close`))} title=${this.i18nStore?.t(`messageReader.back`)} icon="arrowLeft"></alps-icon-btn>
          <div class="toolbar-separator desktop-only"></div>
        `:``}
        
        <div class="toolbar-spacer mobile-spacer"></div>
        
        ${!te&&!re&&!_?n`
        <alps-icon-btn title=${this.i18nStore?.t(`messageReader.archive`)} @click=${()=>this._handleAction(`archive`)} icon="archiveBox"></alps-icon-btn>
        `:``}
        ${!ne&&!re&&!_&&!v?n`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t(`messageReader.reportSpam`)} @click=${()=>this._handleAction(`reportSpam`)} icon="warningDiamond"></alps-icon-btn>
        `:``}
        ${ne?n`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t(`messageReader.notSpam`)} @click=${()=>this._handleAction(`notSpam`)} icon="notSpam"></alps-icon-btn>
        `:``}
        <alps-icon-btn title=${ae} @click=${()=>this._handleAction(`delete`)} icon="trash"></alps-icon-btn>
        <alps-folder-selector-popup
          class="desktop-only"
          .mailboxes=${this.mailboxes}
          .currentMailbox=${this.mailbox}
          @folder-selected=${e=>this._handleAction(e.detail.isMove?`moveTo`:`copyTo`,e.detail.folderName)}
        >
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`messageReader.moveTo`)} icon="folderOpen"></alps-icon-btn>
        </alps-folder-selector-popup>
        
        <div class="toolbar-separator"></div>
        
        ${!re&&!v?n`
        <alps-icon-btn title=${ie?this.i18nStore?.t(`messageReader.markRead`):this.i18nStore?.t(`messageReader.markUnread`)} @click=${()=>this._handleAction(`markUnread`)} icon=${ie?`envelopeOpen`:`envelopeUnread`}></alps-icon-btn>
        `:``}
        ${y?``:n`
        <!-- A star is a flag on ONE message, so over a conversation it is each
             card's own star and not a button up here. -->
        <alps-icon-btn class="desktop-only" ?active=${e&&this.allSelectedStarred||!e&&this.message?.Flags?.includes(`\\Flagged`)} title=${this.i18nStore?.t(`messageReader.star`)} @click=${()=>this._handleAction(`star`)} icon=${e&&this.allSelectedStarred||!e&&this.message?.Flags?.includes(`\\Flagged`)?`starFourFill`:`starFour`}></alps-icon-btn>
        `}
        
        <alps-popup align="left" class="tags-popup">
          <alps-icon-btn slot="trigger" class="desktop-only" title=${this.i18nStore?.t(`messageReader.tags`)} icon="tag"></alps-icon-btn>
          ${[`$label1`,`$label2`,`$label3`,`$label4`,`$label5`].map(e=>n`
              <button class="dropdown-item ${this.hasTag(e)?`active`:``}" @click=${()=>this._handleTag(e)}>
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${Rr(e)};margin-right:12px;opacity:0.9;"></span>
                <span class="item-text">${Lr(e,this.i18nStore)}</span>
              </button>
            `)}
          ${s.length?n`
            <div class="dropdown-divider"></div>
            ${s.map(e=>n`
              <button class="dropdown-item active" title=${this.i18nStore?.t(`messageReader.removeTag`)} @click=${()=>this._handleTag(e)}>
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${Rr(e)};margin-right:12px;opacity:0.9;"></span>
                <span class="item-text">${Lr(e,this.i18nStore)}</span>
                ${O(`x`)}
              </button>
            `)}
          `:``}
          <div class="dropdown-divider"></div>
          <button class="dropdown-item text-danger" @click=${()=>this._handleRemoveAllTags()}>
            <span class="item-text">${this.i18nStore?.t(`messageReader.removeAllTags`)}</span>
          </button>
        </alps-popup>

        <div class="toolbar-spacer desktop-spacer"></div>
        <div class="toolbar-separator mobile-only"></div>
          
          ${e?``:n`
            ${this.message?.Flags?.includes(`\\Draft`)||_?n`
              <alps-icon-btn title=${this.i18nStore?.t(`messageReader.editDraft`)} @click=${this._handleEditDraft} icon="pen"></alps-icon-btn>
            `:y?``:n`
              <alps-icon-btn title=${this.i18nStore?.t(`messageReader.reply`)} @click=${()=>this._handleAction(`reply`)} icon="arrowBendUpLeft"></alps-icon-btn>
            `}
            
            <alps-popup align="right" class="more-menu-popup">
              <alps-icon-btn slot="trigger" class="more-btn" title=${this.i18nStore?.t(`messageReader.moreOptions`)} icon="dotsThreeVertical"></alps-icon-btn>
            
            ${this.message?.Flags?.includes(`\\Draft`)||_||y?``:n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`reply`)}>
              ${O(`arrowBendUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reply`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`replyAll`)}>
              ${O(`arrowBendDoubleUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.replyAll`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`forward`)}>
              ${O(`arrowBendUpRight`)} <span class="item-text">${this.i18nStore?.t(`messageReader.forward`)}</span>
            </button>
            <div class="dropdown-divider"></div>
            `}
            ${!te&&!re&&!_?n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`archive`)}>
              ${O(`archiveBox`)} <span class="item-text">${this.i18nStore?.t(`messageReader.archive`)}</span>
            </button>
            `:``}
            ${!ne&&!re&&!_&&!v?n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`reportSpam`)}>
              ${O(`warningDiamond`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reportSpam`)}</span>
            </button>
            `:``}
            ${ne?n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`notSpam`)}>
              ${O(`notSpam`)} <span class="item-text">${this.i18nStore?.t(`messageReader.notSpam`)}</span>
            </button>
            `:``}
            <button class="dropdown-item" @click=${()=>this._handleAction(`delete`)}>
              ${O(`trash`)} <span class="item-text">${ae}</span>
            </button>
            <alps-folder-selector-popup
              class="folder-selector"
              .mailboxes=${this.mailboxes}
              .currentMailbox=${this.mailbox}
              @folder-selected=${e=>this._handleAction(e.detail.isMove?`moveTo`:`copyTo`,e.detail.folderName)}
            >
              <button slot="trigger" class="dropdown-item">
                ${O(`folderOpen`)} <span class="item-text">${this.i18nStore?.t(`messageReader.moveTo`)}</span>
              </button>
            </alps-folder-selector-popup>
            ${!re&&!v||!y?n`
            <div class="dropdown-divider"></div>
            ${!re&&!v?n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`markUnread`)}>
              ${O(ie?`envelopeOpen`:`envelopeUnread`)} <span class="item-text">${ie?this.i18nStore?.t(`messageReader.markRead`):this.i18nStore?.t(`messageReader.markUnread`)}</span>
            </button>
            `:``}
            ${y?``:n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`star`)}>
              ${this.message?.Flags?.includes(`\\Flagged`)?O(`starFourFill`):O(`starFour`)} <span class="item-text">${this.i18nStore?.t(`messageReader.star`)}</span>
            </button>
            `}
            `:``}
            ${y?``:n`
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${()=>this._handleAction(`print`)}>
              ${O(`printer`)} <span class="item-text">${this.i18nStore?.t(`messageReader.print`)}</span>
            </button>
            `}
            <!-- Stays over a conversation: it is a preference about the READER,
                 not a verb on a message. -->
            <div class="dropdown-divider"></div>
            <button class="dropdown-item ${r===`text`?`active`:``}" ?disabled=${!this.hasText} @click=${()=>this.hasText&&this._handleAction(`showPlaintext`)}>
              ${O(`textAlignLeft`)}
              <span class="item-text">${this.i18nStore?.t(`messageReader.showPlaintext`)}</span>
            </button>
            <button class="dropdown-item ${r===`html`?`active`:``}" ?disabled=${!this.hasHtml} @click=${()=>this.hasHtml&&this._handleAction(`showHtml`)}>
              ${O(`code`)}
              <span class="item-text">${this.i18nStore?.t(`messageReader.showHtml`)}</span>
            </button>
            ${y?``:n`
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${()=>this._handleAction(`downloadMessage`)}>
              ${O(`downloadSimple`)} <span class="item-text">${this.i18nStore?.t(`messageReader.downloadMessage`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`showOriginal`)}>
              ${O(`codeBlock`)} <span class="item-text">${this.i18nStore?.t(`messageReader.showOriginal`)}</span>
            </button>
            `}
          </alps-popup>
          `}
      </alps-toolbar>
      
      ${e?n`
        <div class="reader-body">
          <div class="empty-reader-state" style="flex-direction: column; gap: 16px;">
            ${this.bulkProcessing?n`
              <div class="bulk-spinner-container">
                <alps-loader></alps-loader>
              </div>
            `:n`
              <alps-icon-btn icon="envelopeSimple" style="pointer-events: none;"></alps-icon-btn>
            `}
            <span>${this.selectedCount} ${this.i18nStore?.t(`messageReader.messagesSelected`)}</span>
          </div>
        </div>
      `:t&&(this.threadItems.length>1||this._isThread)?n`
        <div class="reader-body" @scroll=${this.handleScroll}>
          <div class="reader-header thread-header-grouped">
            <div class="reader-subject">
              ${a.length>0?n`
                <div class="tag-pills">
                  ${a.map(e=>n`
                    <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
                  `)}
                </div>
              `:``}
              ${i.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`)}
            </div>
          </div>
          <div class="thread-container">
            ${this.threadItems.map(e=>this.renderThreadCard(e))}
          </div>
          ${this.renderConversationReply()}
        </div>
      `:n`
        <div class="reader-body" @scroll=${this.handleScroll}>
          <div class="reader-header">
          <div class="reader-subject">
            ${a.length>0?n`
              <div class="tag-pills">
                ${a.map(e=>n`
                  <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
                `)}
              </div>
            `:``}

            ${i.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`)}
          </div>
          <div class="reader-meta">
            <div class="reader-sender-block">
              <div class="reader-sender-left">
                ${this.showSenderAvatars?n`
                  <div class="avatar-container">
                    <alps-avatar .name=${d} .email=${u} .size=${40} .src=${h}></alps-avatar>
                  </div>
                `:``}
                <div class="reader-sender-info">
                  ${c.Name&&c.Name!==u?n`
                    <div class="reader-sender-line">
                      <span class="reader-sender-name">${c.Name}</span>
                      <alps-sender-auth-badge ?verified=${!!i.HasBimiPotential} ?failed=${!!i.HasBimiFailed}></alps-sender-auth-badge>
                    </div>
                    ${u?n`<alps-recipient-pill address="${u}"></alps-recipient-pill>`:n`<span class="reader-sender-name">${d}</span>`}
                  `:n`
                    <div class="reader-sender-line">
                      ${u?n`<alps-recipient-pill address="${u}"></alps-recipient-pill>`:n`<span class="reader-sender-name">${d}</span>`}
                      <alps-sender-auth-badge ?verified=${!!i.HasBimiPotential} ?failed=${!!i.HasBimiFailed}></alps-sender-auth-badge>
                    </div>
                  `}
                </div>
              </div>
              <div class="desktop-date-container">
                <div class="reader-date desktop-date">${m}</div>
                ${i.RFC822Size?n`<div class="reader-size desktop-only">${cn(i.RFC822Size)}</div>`:``}
              </div>
            </div>
            
            <div class="reader-recipients-block">
              <div class="reader-recipients">
                <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.to`)}</span>
                <div class="reader-recipients-list">
                  ${i.Envelope?.To&&i.Envelope.To.length>0?i.Envelope.To.map(e=>e.Mailbox&&e.Host?n`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``):n`<span class="undisclosed-recipients">${i.Flags?.includes(`\\Draft`)?this.i18nStore?.t(`messageReader.noRecipients`):this.i18nStore?.t(`messageReader.undisclosed`)}</span>`}
                </div>
              </div>
              ${i.Envelope?.Cc&&i.Envelope.Cc.length>0?n`
                <div class="reader-recipients">
                  <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.cc`)}</span>
                  <div class="reader-recipients-list">
                    ${i.Envelope.Cc.map(e=>e.Mailbox&&e.Host?n`<alps-recipient-pill name="${e.Name||``}" address="${e.Mailbox}@${e.Host}"></alps-recipient-pill>`:``)}
                  </div>
                </div>
              `:``}
              
              <div class="reader-recipients mobile-only">
                <span class="reader-recipients-label">${this.i18nStore?.t(`messageReader.date`)||`Date:`}</span>
                <div class="reader-recipients-list mobile-date-container" style="flex-direction: row; align-items: baseline; gap: 8px; margin-top: 0;">
                  <span class="reader-date mobile-date" style="color: var(--text-primary);">${m}</span>
                  ${i.RFC822Size?n`<span class="reader-size mobile-size">(${cn(i.RFC822Size)})</span>`:``}
                </div>
              </div>
            </div>
          </div>
        </div>

        ${!this.loading&&this.attachments&&this.attachments.length>0?n`
          <alps-attachment-list
            class="desktop-attachments"
            .attachments=${this.attachments}
            .mailbox=${this.mailboxOfMessage(i)}
            .messageUid=${i.UID}
          ></alps-attachment-list>
        `:``}

        ${this.loading?n`
          <div class="loading-overlay">
            <div class="loading-state">
              <alps-loader full-height .text=${this.i18nStore?.t(`messageReader.loadingMessage`)||`Loading message...`}></alps-loader>
            </div>
          </div>
        `:n`
          <div class="message-content">
          ${i.HasBimiFailed?n`
            <alps-banner variant="warning">
              <span>${this.i18nStore?.t(`messageReader.senderUnverifiedWarning`)}</span>
            </alps-banner>
          `:``}
          ${this.activeBanners&&this.activeBanners.length>0?n`
            ${this.activeBanners.map(e=>e)}
          `:``}
          ${this.hasRemoteResources&&!this.allowRemoteResources?n`
            <alps-banner>
              <span>${this.i18nStore?.t(`messageReader.remoteContentWarning`)}</span>
              <alps-button slot="action" variant="normal" @click=${this.loadRemoteResources}>${this.i18nStore?.t(`messageReader.loadRemoteContent`)}</alps-button>
            </alps-banner>
          `:``}
          ${this.message?.Flags?.includes(`\\Draft`)?n`
            <alps-banner>
              <span>${this.i18nStore?.t(`messageReader.isDraft`)}</span>
              <alps-button slot="action" variant="normal" @click=${this._handleEditDraft}>${this.i18nStore?.t(`messageReader.editDraft`)}</alps-button>
            </alps-banner>
          `:``}
          
          <div class="reader-content-wrapper">
            ${this.mimeType?.toLowerCase()===`text/html`?n`
              <iframe 
                class="reader-iframe"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                .srcdoc=${l(this.content)}
                @load=${this.onIframeLoad}
              ></iframe>
            `:this.mimeType?.toLowerCase().startsWith(`multipart/`)||!this.content?n`
              <div class="reader-empty-body">
                ${this.i18nStore?.t(`messageReader.noReadableText`)}
              </div>
            `:n`
              <div class="reader-text-wrapper">
                <pre class="reader-preformatted">${this.content}</pre>
              </div>
            `}
          </div>

        `}
      </div>

      ${!this.loading&&this.attachments&&this.attachments.length>0?n`
        <alps-attachment-list
          class="mobile-attachments"
          .attachments=${this.attachments}
          .mailbox=${this.mailboxOfMessage(i)}
          .messageUid=${i.UID}
        ></alps-attachment-list>
      `:``}
      `}
    `}};k([h({context:C})],K.prototype,`settingsStore`,void 0),k([h({context:S})],K.prototype,`i18nStore`,void 0),k([h({context:ai})],K.prototype,`composeStore`,void 0),k([a()],K.prototype,`localPreferredView`,void 0),k([a()],K.prototype,`hasHtml`,void 0),k([a()],K.prototype,`hasText`,void 0),k([o({type:String})],K.prototype,`mailbox`,void 0),k([o({type:Object})],K.prototype,`message`,void 0),k([o({type:Array})],K.prototype,`messages`,void 0),k([o({type:Object})],K.prototype,`selectedKeys`,void 0),k([o({type:Number})],K.prototype,`selectedCount`,void 0),k([o({type:Boolean})],K.prototype,`allSelectedStarred`,void 0),k([o({type:Boolean})],K.prototype,`allSelectedUnread`,void 0),k([o({type:Array})],K.prototype,`commonTags`,void 0),k([o({type:Boolean})],K.prototype,`bulkProcessing`,void 0),k([o({type:String})],K.prototype,`layoutMode`,void 0),k([o({type:Array})],K.prototype,`mailboxes`,void 0),k([a()],K.prototype,`content`,void 0),k([a()],K.prototype,`mimeType`,void 0),k([a()],K.prototype,`loading`,void 0),k([a()],K.prototype,`activeBanners`,void 0),k([a()],K.prototype,`attachments`,void 0),k([a()],K.prototype,`allowRemoteResources`,void 0),k([a()],K.prototype,`hasRemoteResources`,void 0),k([a()],K.prototype,`rawMessageHtml`,void 0),k([a()],K.prototype,`isScrolled`,void 0),k([a()],K.prototype,`threadItems`,void 0),k([a()],K.prototype,`_isThread`,void 0),K=k([p(`alps-message-reader`)],K);var Ea=1e4,Da=e=>!!e?.Flags?.includes(z),Oa=(e,t)=>(e?.length??0)===(t?.length??0)&&(e??[]).every((e,n)=>e===t[n]);function ka(e,t){return e===t?!0:!e||e.length!==t.length?!1:JSON.stringify(e)===JSON.stringify(t)}var Aa=250,ja=150,Ma=500,Na=64,Pa=120,Fa=380,Ia=300,La=57,Ra=150,za=250,q=class extends d{constructor(...e){super(...e),this.showDeleteConfirm=!1,this.listLoadFailed=!1,this.pendingDeleteDetails=null,this.markReadTimer=null,this.notificationSound=null,this.audioUnlocked=!1,this.unlockAudio=()=>{if(this.audioUnlocked||!this.settingsStore.getState().soundNotifications)return;let e=this.chime();e.muted=!0,e.play().then(()=>{e.pause(),e.currentTime=0,this.audioUnlocked=!0}).catch(()=>{}).finally(()=>{e.muted=!1}),document.removeEventListener(`click`,this.unlockAudio),document.removeEventListener(`keydown`,this.unlockAudio)},this.mailboxes=[],this.messages=[],this.currentMailbox=E,this.loadingMessages=!0,this.showInitialLoader=!window.alpsAppLoaded,this.selectedMessage=null,this.selectedKeys=new Set,this.selectAllMatching=!1,this.excludedKeys=new Set,this.layoutMode=`vertical`,this.filterQuery=``,this.expandedFolders=new Set([E]),this.username=``,this.currentPage=0,this.listedPage=0,this.totalMessages=0,this.messagesPerPage=50,this.resizerPositionX=Aa+Math.max(Fa,(window.innerWidth-Aa)*.4),this.listHeight=Math.max(za,(window.innerHeight-La)*.4),this.isSidebarDragging=!1,this.isPaneDragging=!1,this.sidebarWidth=Aa,this.isSidebarHovered=!1,this.hoverTimeout=null,this.densityMode=`compact`,this.showSenderAvatars=!0,this.isSyncing=!1,this.sidebarCollapsed=!1,this.suppressSidebarHover=!1,this.sortOrder=`desc`,this.listScrolled=!1,this.targetUid=null,this.targetMailbox=null,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.bulkProcessing=!1,this.computedMinListWidth=Fa,this._mql=window.matchMedia(`(max-width: 768px)`),this._relayToast=e=>{this.showGlobalToast(e.detail.message,e.detail.actionLabel,e.detail.actionFn,e.detail.duration)},this._handleMediaQuery=e=>{this.isMobile=e.matches,this.isMobile||(this.mobileSidebarOpen=!1)},this.handleDraftAutosaved=e=>{let{oldUid:t,oldMailbox:n,newUid:r,mailbox:i,subject:a,hasAttachments:o,size:s}=e.detail;if(!this.messages)return;let c=String(r),l=!1,u=t?H(n||i,t):null,d=e=>({...e,UID:c,...e.Mailbox?{Mailbox:i}:{},Size:s||e.Size,RFC822Size:s||e.RFC822Size,HasAttachments:o,_isAutosaveUpdate:!0,Envelope:{...e.Envelope,Subject:a||e.Envelope?.Subject||`(No subject)`}});if(u){let e=this.messages.findIndex(e=>this.keyOf(e)===u);if(e!==-1){let t=[...this.messages];t[e]=d(t[e]),this.messages=t,l=!0,this.selectedMessage&&this.keyOf(this.selectedMessage)===u&&this.followAutosavedSelection(t[e])}else for(let e=0;e<this.messages.length;e++){let t=this.messages[e];if(t.SubMessages){let n=t.SubMessages.findIndex(e=>this.keyOf(e)===u);if(n!==-1){let r=[...t.SubMessages];r[n]=d(r[n]);let i=[...this.messages];i[e]={...t,SubMessages:r},this.messages=i,l=!0,this.selectedMessage&&this.keyOf(this.selectedMessage)===u&&this.followAutosavedSelection(r[n]);break}}}!l&&this.selectedMessage&&this.keyOf(this.selectedMessage)===u&&this.followAutosavedSelection(d(this.selectedMessage))}if(!l&&this.currentMailbox===i){let e=this.settingsStore?.getState().name||this.username,n=(this.username||``).split(`@`),i=n[0]||``,l=n[1]||``,u={UID:c,Size:s||0,RFC822Size:s||0,HasAttachments:o,Flags:[R,Cr],_isAutosaveUpdate:!0,Envelope:{Subject:a||`(No subject)`,Date:new Date().toISOString(),From:[{Name:e,Mailbox:i,Host:l}]}},d=this.messages.filter(e=>String(e.UID)!==String(t)&&String(e.UID)!==String(r));this.messages=[u,...d]}},this._handleSettingsChange=()=>{this._syncSettings()},this._handleI18nChange=()=>{this.requestUpdate()},this.handleLabelsSuccess=e=>{let{mailboxes:t}=e.detail;this.mailboxes=t},this.handleSyncStart=e=>{let t=e.detail;this.isSyncing=!0,!t.background&&!t.quiet&&(this.loadingMessages=!0,this.listLoadFailed=!1)},this.handleSyncSuccess=e=>{this.isSyncing=!1,this.listLoadFailed=!1;let{data:t,background:n}=e.detail;t.Username&&(this.username=t.Username,this.settingsStore.getState().loginUsername!==t.Username&&this.settingsStore.updateSettings({loginUsername:t.Username}));let r=this.mailboxes.length===0,i=!1,a=!1,o=0;if(t.Mailboxes){for(let e of t.Mailboxes){let t=e.Name||e.Mailbox,s=this.mailboxes.find(e=>(e.Name||e.Mailbox)===t);if(s&&!r&&n&&e.Total!==void 0&&s.Total!==void 0&&e.Unseen!==void 0&&s.Unseen!==void 0){let n=Math.min(e.Total-s.Total,e.Unseen-s.Unseen);n>0&&(i=!0,t.toUpperCase()===`INBOX`&&(a=!0,o+=n))}}this.mailboxes=t.Mailboxes}if(i&&this.settingsStore.getState().soundNotifications){let e=this.chime();e.currentTime=0,e.play().catch(e=>{e.name!==`NotAllowedError`&&b.error(`Failed to play sound notification:`,e)})}if(a&&this.settingsStore.getState().desktopNotifications&&`Notification`in window&&Notification.permission===`granted`){let e=this.i18nStore?.t(`mailboxPage.newMessages`),t=o===1?this.i18nStore?.t(`mailboxPage.newMessagesSingleBody`):this.i18nStore?.t(`mailboxPage.newMessagesMultiBody`,{count:o});try{let n=new Notification(e,{body:t,icon:`/apple-touch-icon.png`,tag:`alps-new-message`});n.onclick=()=>{window.focus(),n.close(),this.currentMailbox===`INBOX`?(this.currentPage=0,L.fetch(this.currentMailbox,0,this.filterQuery,!1)):this.updateUrl(`INBOX`,0,null,``)}}catch(e){b.error(`Failed to show desktop notification:`,e)}}if(a&&this.currentMailbox!==`INBOX`&&this.showGlobalToast(this.i18nStore?.t(`mailboxPage.newMessagesInInbox`),this.i18nStore?.t(`mailboxPage.open`),()=>{this.updateUrl(`INBOX`,0,null,``)},5e3),n&&this.currentPage>0)t.Total!==void 0&&t.Total!==this.totalMessages&&this.showGlobalToast(this.i18nStore?.t(`mailboxPage.newMessagesAvailable`),this.i18nStore?.t(`mailboxPage.refresh`),()=>{this.currentPage=0,L.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)});else if(t.Page!==void 0&&(this.currentPage=t.Page),this.listedPage=t.Page===void 0?this.currentPage:t.Page,t.Total!==void 0&&(this.totalMessages=t.Total),t.MessagesPerPage!==void 0&&(this.messagesPerPage=t.MessagesPerPage),t.Messages){if(ka(this.messages,t.Messages)||(this.messages=t.Messages,this.selectAllMatching&&(this.selectedKeys=new Set(this.listedKeys().filter(e=>!this.excludedKeys.has(e))))),this.selectedMessage){let e=this.messages.find(e=>this.isOpen(e));e&&e.Flags&&!Oa(this.selectedMessage.Flags,e.Flags)&&(this.selectedMessage={...this.selectedMessage,Flags:e.Flags})}}else this.messages=[];n||(this.loadingMessages=!1,this.applyTargetUid(),this.showInitialLoader&&setTimeout(()=>{this.showInitialLoader=!1,window.alpsAppLoaded=!0},100))},this.handleSyncError=e=>{this.isSyncing=!1;let{background:t}=e.detail;t||(this.loadingMessages=!1,this.listLoadFailed=!0)},this.handleMailboxNotFound=()=>{this.showGlobalToast(this.i18nStore.t(`mailboxPage.mailboxNotFound`),``,void 0,3e3),this.updateUrl(E,0,null,null)},this.handleHashChange=()=>{let e=this.currentMailbox,t=this.currentPage,n=this.targetUid,r=this.targetMailbox,i=this.filterQuery;this.extractMailboxFromHash(),e!==this.currentMailbox||t!==this.currentPage||i!==this.filterQuery?(e===this.currentMailbox?i!==this.filterQuery&&(this.loadingMessages=!0,this.currentPage=0,this.clearSelection()):(this.selectedMessage=null,this.currentPage=0,this.clearSelection(),this.loadingMessages=!0),L.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)):(n!==this.targetUid||r!==this.targetMailbox)&&this.applyTargetUid()},this.startResize=e=>{e.preventDefault(),this.isPaneDragging=!0,this.updateComputedMinWidth();let t=e=>{if(this.layoutMode===`vertical`){let t=this.sidebarCollapsed?Na:this.sidebarWidth,n=Math.max(t+this.computedMinListWidth,Math.min(e.clientX,window.innerWidth-Ia));this.resizerPositionX=n}else this.layoutMode===`horizontal`&&(this.listHeight=Math.max(Ra,Math.min(e.clientY-La,window.innerHeight-Ra)))},n=()=>{this.isPaneDragging=!1,window.removeEventListener(`mousemove`,t),window.removeEventListener(`mouseup`,n)};window.addEventListener(`mousemove`,t),window.addEventListener(`mouseup`,n)},this.rowsAfterTakeOut=null}chime(){return this.notificationSound??=new Audio(`/assets/notify.wav`)}static{this.styles=g`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      width: 100vw;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      overflow: hidden;
      font-size: 14px;
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
    .layout-vertical alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${Aa}px); flex-shrink: 0; }
    .layout-vertical .main-view { flex: 1; display: flex; flex-direction: row; min-width: 0; }
    .layout-vertical .message-list-pane { width: ${Fa}px; flex-shrink: 0; border-right: 1px solid var(--border-color); }
    .layout-vertical .message-reader-pane { flex: 1; min-width: 0; }

    /* Horizontal: Sidebar (250px) | [ Message List (50%) / Reader (50%) ] */
    .layout-horizontal alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${Aa}px); flex-shrink: 0; }
    .layout-horizontal .main-view { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .layout-horizontal .message-list-pane { flex-shrink: 0; border-bottom: 1px solid var(--border-color); }
    .layout-horizontal .message-reader-pane { flex: 1; min-height: 0; }

    /* Full: Sidebar (250px) | Message List OR Reader */
    .layout-full alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${Aa}px); flex-shrink: 0; }
    .layout-full .main-view { flex: 1; display: flex; min-width: 0; }
    .layout-full .message-list-pane { flex: 1; min-width: 0; }
    .layout-full .message-reader-pane { flex: 1; min-width: 0; }
    .layout-full.reading .message-list-pane { display: none; }
    .layout-full:not(.reading) .message-reader-pane { display: none; }

    .desktop-sidebar.open {
      display: flex;
    }

    .mobile-bulk-actions-container {
      display: flex;
      gap: 8px;
      align-items: center;
      width: 100%;
    }

    .header-divider {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 4px;
    }

    .mobile-bulk-actions-count {
      font-weight: 600;
      margin-left: 8px;
      margin-right: auto;
    }

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
      --sidebar-width: ${Na}px;
    }

    .app-container.collapsed .message-list-pane {
      box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
      z-index: 25;
      border-left: 1px solid var(--border-color);
    }



    `}updateComputedMinWidth(){let e=Fa,t=this.shadowRoot?.querySelector(`.message-list-pane alps-message-list`);if(t){let n=t.shadowRoot?.querySelector(`.list-header`);if(n){let t=pn(n);e=Math.max(Fa,t+2)}}if(e!==this.computedMinListWidth){this.computedMinListWidth=e;let t=this.sidebarCollapsed&&!this.isMobile?Na:this.sidebarWidth;this.resizerPositionX-t<e&&(this.resizerPositionX=t+e)}}showGlobalToast(e,t=``,n,r=3e3){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e,actionLabel:t,actionFn:n,duration:r}}))}reportActionFailed(e,t){this.showGlobalToast(this.i18nStore?.t(e)||t,``,void 0,4e3)}reportFlagFailure(e){if(e.reason===`auth`)return;let t=e.reason===`unsupported`?`toast.tagNotSupported`:`toast.flagChangeFailed`,n=e.reason===`unsupported`?`That tag is not supported by this mail server`:`Could not update the messages`;this.showGlobalToast(this.i18nStore?.t(t)||n,``,void 0,4e3)}get canArchiveHere(){let e=Jt(this.currentMailbox,this.mailboxes);return e!==`trash`&&e!==`drafts`&&e!==`archive`}get effectiveListWidth(){let e=this.sidebarCollapsed&&!this.isMobile?Na:this.sidebarWidth;return Math.max(this.computedMinListWidth,this.resizerPositionX-e)}get selectedListed(){if(this.selectedKeys.size===0)return[];let e=[];for(let t of this.messages){this.selectedKeys.has(this.keyOf(t))&&e.push(t);for(let n of t.SubMessages||[])this.selectedKeys.has(this.keyOf(n))&&e.push(n)}return e}get selectedStarRows(){let e=[];for(let t of this.messages){let n=[t,...t.SubMessages||[]],r=n.filter(e=>this.selectedKeys.has(this.keyOf(e)));if(n.length>1&&r.length===n.length)e.push({face:t,messages:n});else for(let t of r)e.push({face:t,messages:[t]})}return e}get allSelectedStarred(){let e=this.selectedStarRows;return e.length>0&&e.every(e=>e.messages.some(Da))}starWrite(e){let t=e.length>0&&e.every(e=>e.messages.some(Da));return{keys:(t?e.flatMap(e=>e.messages.filter(Da)):e.filter(e=>!e.messages.some(Da)).map(e=>e.face)).map(e=>this.keyOf(e)),op:t?`remove`:`add`}}get commonSelectedTags(){let e=this.selectedListed;return e.length===0?[]:[`$label1`,`$label2`,`$label3`,`$label4`,`$label5`].filter(t=>e.every(e=>e.Flags?.some(e=>e.toLowerCase()===t.toLowerCase())))}get allSelectedUnread(){let e=!1;for(let t of this.messages){let n=[t,...t.SubMessages||[]].filter(e=>this.selectedKeys.has(this.keyOf(e)));if(n.length!==0&&(e=!0,n.every(e=>e.Flags?.includes(`\\Seen`))))return!1}return e}get selectionCount(){return this.selectAllMatching?Math.max(0,this.totalMessages-this.excludedKeys.size):this.selectedKeys.size}get matchingScope(){return{query:this.filterQuery,except:[...this.excludedKeys].map(e=>yi(e).uid)}}listedKeys(){let e=[];for(let t of this.messages||[]){e.push(this.keyOf(t));for(let n of t.SubMessages||[])e.push(this.keyOf(n))}return e}takeSelection(e){if(this.selectedKeys=e,!this.selectAllMatching)return;let t=new Set(this.excludedKeys);for(let n of this.listedKeys())e.has(n)?t.delete(n):t.add(n);this.excludedKeys=t,this.selectionCount<=0&&this.clearSelection()}selectAllInFolder(){this.selectAllMatching=!0,this.excludedKeys=new Set,this.selectedKeys=new Set(this.listedKeys())}clearSelection(){this.selectAllMatching=!1,this.excludedKeys=new Set,this.selectedKeys=new Set}mailboxOf(e){return xi(e,this.currentMailbox)}keyOf(e){return H(this.mailboxOf(e),e?.UID)}isOpen(e){return!!this.selectedMessage&&!!e&&this.keyOf(this.selectedMessage)===this.keyOf(e)}connectedCallback(){super.connectedCallback(),this.extractMailboxFromHash(),window.addEventListener(`hashchange`,this.handleHashChange),document.addEventListener(`click`,this.unlockAudio),document.addEventListener(`keydown`,this.unlockAudio),this._mql.addEventListener(`change`,this._handleMediaQuery),this._handleMediaQuery(this._mql),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._syncSettings(),L.addEventListener(`sync-start`,this.handleSyncStart),L.addEventListener(`sync-success`,this.handleSyncSuccess),L.addEventListener(`sync-error`,this.handleSyncError),L.addEventListener(`labels-success`,this.handleLabelsSuccess),L.addEventListener(`mailbox-not-found`,this.handleMailboxNotFound),window.addEventListener(`draft-autosaved`,this.handleDraftAutosaved),L.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`hashchange`,this.handleHashChange),this._mql.removeEventListener(`change`,this._handleMediaQuery),document.removeEventListener(`click`,this.unlockAudio),document.removeEventListener(`keydown`,this.unlockAudio),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),L.removeEventListener(`sync-start`,this.handleSyncStart),L.removeEventListener(`sync-success`,this.handleSyncSuccess),L.removeEventListener(`sync-error`,this.handleSyncError),L.removeEventListener(`labels-success`,this.handleLabelsSuccess),L.removeEventListener(`mailbox-not-found`,this.handleMailboxNotFound),window.removeEventListener(`draft-autosaved`,this.handleDraftAutosaved),L.stop()}updated(e){super.updated(e),(e.has(`sidebarCollapsed`)||e.has(`layoutMode`)||e.has(`currentMailbox`)||e.has(`isMobile`)||e.has(`mailboxes`))&&setTimeout(()=>this.updateComputedMinWidth(),0)}followAutosavedSelection(e){this.selectedMessage=e,this.targetUid=String(e.UID);let t=this.mailboxOf(e);this.targetMailbox=t===this.currentMailbox?null:t,window.history.replaceState(null,``,this.hashFor(this.currentMailbox,this.currentPage,this.targetUid,this.filterQuery,this.targetMailbox))}_syncSettings(){let e=this.settingsStore.getState();this.layoutMode=e.layoutMode,this.densityMode=e.densityMode,this.showSenderAvatars=e.showSenderAvatars??!0,this.sortOrder=e.sortOrder||`desc`,e.loginUsername&&(this.username=e.loginUsername),this.sidebarCollapsed!==e.sidebarCollapsed&&(this.sidebarCollapsed=e.sidebarCollapsed),e.messagesPerPage&&e.messagesPerPage>0&&(this.messagesPerPage=e.messagesPerPage),e.checkMailInterval!==void 0&&L.start(e.checkMailInterval)}openFolderPrompt(){let e=this.shadowRoot?.querySelector(`alps-folder-list`);e&&typeof e.triggerCreateFolder==`function`&&e.triggerCreateFolder()}updateUrl(e,t,n,r=this.filterQuery,i=null){window.location.hash=this.hashFor(e,t,n,r,i)}hashFor(e,t,n,r,i){let a=`#/mailbox/${encodeURIComponent(e)}`,o=new URLSearchParams;t>0&&o.set(`p`,t.toString()),n&&(o.set(`uid`,n),i&&i!==e&&o.set(`in`,i)),r&&o.set(`q`,r);let s=o.toString();return s&&(a+=`?`+s),a}openKeyInUrl(e,t,n){if(!n){this.updateUrl(e,t,null);return}let{mailbox:r,uid:i}=yi(n);this.updateUrl(e,t,i,void 0,r)}extractMailboxFromHash(){let e=window.location.hash;if(e.startsWith(`#/mailbox/`)){let t=e.substring(10),n=t.indexOf(`?`),r=``;n!==-1&&(r=t.substring(n+1),t=t.substring(0,n));let i=t.split(`/`);this.currentMailbox=decodeURIComponent(i[0]);let a=new URLSearchParams(r);i.length>1&&i[1]?(this.targetUid=i[1],this.targetMailbox=null):(this.targetUid=a.get(`uid`)||null,this.targetMailbox=this.targetUid&&a.get(`in`)||null);let o=a.get(`p`);o?this.currentPage=parseInt(o,10)||0:this.currentPage=0,this.filterQuery=a.get(`q`)||``}else this.currentMailbox=E,this.targetUid=null,this.targetMailbox=null,this.currentPage=0}async applyTargetUid(){if(!this.targetUid){this.markReadTimer&&=(clearTimeout(this.markReadTimer),null),this.selectedMessage=null;return}let e=this.targetUid,t=this.targetMailbox,n=t||this.currentMailbox,r=H(n,e),i=this.messages.find(e=>this.keyOf(e)===r);if(!i&&this.messages.length>0)try{let t=await T(`/mailboxes/${D(n)}/messages/${e}`);if(t.ok){let e=await t.json();e.Message&&(i={...e.Message,Mailbox:e.Message.Mailbox||n})}}catch(e){b.error(`Failed to fetch shifted message:`,e)}this.targetUid!==e||this.targetMailbox!==t||(i?this.isOpen(i)||(this.selectedMessage=i,this.layoutMode===`full`&&(this.expandedFolders=new Set),this._scheduleMarkAsRead(i)):this.messages.length>0&&(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)))}async selectMessage(e){this.openKeyInUrl(this.currentMailbox,this.currentPage,this.keyOf(e))}_scheduleMarkAsRead(e){if(this.markReadTimer&&=(clearTimeout(this.markReadTimer),null),e.Flags?.includes(`\\Seen`))return;let t=this.settingsStore?.getState().markReadTimeout??0;t<0||(t===0?this._doMarkAsRead(e):this.markReadTimer=setTimeout(()=>{this._doMarkAsRead(e)},t*1e3))}updateLocalMessageFlags(e,t,n){let r=new Set(e),i=[],a=[...this.messages],o=e=>{let r=!!e.Flags?.includes(t);return n===`add`&&!r?{...e,Flags:[...e.Flags||[],t]}:n===`remove`&&r?{...e,Flags:e.Flags.filter(e=>e!==t)}:e};for(let e=0;e<a.length;e++){let t=a[e];if(r.has(this.keyOf(t))){let n=o(t);n!==t&&(a[e]=t=n,i.push(this.keyOf(t)))}if(t.SubMessages?.some(e=>r.has(this.keyOf(e)))){let n=t.SubMessages.map(e=>r.has(this.keyOf(e))?o(e):e),s=n.filter((e,n)=>e!==t.SubMessages[n]);if(s.length>0){a[e]={...t,SubMessages:n};for(let e of s)i.push(this.keyOf(e))}}}if(i.length>0){if(this.messages=a,this.selectedMessage&&r.has(this.keyOf(this.selectedMessage))){let e=this.selectedMessage.Flags&&this.selectedMessage.Flags.includes(t);n===`add`&&!e?this.selectedMessage.Flags=[...this.selectedMessage.Flags||[],t]:n===`remove`&&e&&(this.selectedMessage.Flags=this.selectedMessage.Flags.filter(e=>e!==t)),this.selectedMessage={...this.selectedMessage}}window.dispatchEvent(new CustomEvent(`external-message-flags-changed`,{detail:{keys:e,flag:t,action:n}}))}return i}async _handleListToggleStar(e){let t=e.detail.message,{keys:n,op:r}=this.starWrite([{face:t,messages:e.detail.messages??[t]}]),i=r===`add`?`remove`:`add`;this.updateLocalMessageFlags(n,z,r);let a=new Set,o;try{o=(await this.eachFolder(n,async(e,t)=>{let n=await B.setFlag(e,t,[z],r);if(n.ok)for(let n of t)a.add(H(e,n));return n})).refused}catch{}let s=n.filter(e=>!a.has(e));s.length>0&&(this.updateLocalMessageFlags(s,z,i),o&&this.reportFlagFailure(o))}async _doMarkAsRead(e){let t=await B.markAsRead(this.mailboxOf(e),e);t?.Flags?.includes(`\\Seen`)&&(this.isOpen(e)&&(this.selectedMessage=t),this.updateLocalMessageFlags([this.keyOf(e)],R,`add`))}async handleNamedMessageAction(e){let t=String(e.uid),n=e.mailbox,r=H(n,t),i=!!this.selectedMessage&&this.keyOf(this.selectedMessage)===r;if(e.action===`downloadMessage`){let e=document.createElement(`a`);e.href=`/mailboxes/${D(n)}/messages/${t}/raw`,e.download=``,document.body.appendChild(e),e.click(),document.body.removeChild(e);return}if(e.action===`showOriginal`){window.open(`#/original?mailbox=${encodeURIComponent(n)}&uid=${t}`,`_blank`);return}if(e.action===`markUnread`){let e=await B.setFlag(n,[t],[R],`remove`);if(!e.ok){this.reportFlagFailure(e);return}this.updateLocalMessageFlags([r],R,`remove`),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null);return}if(e.action!==`delete`)return;if(this.deletesForGood(n)){this.pendingDeleteDetails={isBulk:!1,doomed:[r],toTrash:[],isDrafts:Jt(n,this.mailboxes)===`drafts`,named:{isOpen:i,nextUid:e.nextUid,done:e.done}},this.showDeleteConfirm=!0;return}let a=Yt(`trash`,this.mailboxes,Wt),o=this.currentMailbox,s=await B.moveMessages(n,[t],a);if(!s.success){e.done?.(!1),s.reason!==`auth`&&this.reportActionFailed(`toast.moveFailed`,`Could not move that`);return}e.done?.(!0),i&&this.leaveDeletedMessage(e.nextUid);let c=s.uidMapping?.[t],l=c?async()=>{try{let e=await B.moveMessages(a,[c],n);if(!e.success){e.reason!==`auth`&&this.reportActionFailed(`toast.undoFailed`,`Could not undo that`);return}let t=e.uidMapping?.[c];if(i){let e=this.currentMailbox===o?this.currentPage:0;this.openKeyInUrl(o,e,t?H(n,t):null)}else this.renderRoot.querySelector(`alps-message-reader`)?.reloadConversation()}catch(e){b.error(`Undo failed`,e),this.reportActionFailed(`toast.undoFailed`,`Could not undo that`)}}:void 0;this.showGlobalToast(this.i18nStore?.t(`toast.messageMovedToTrash`),l?this.i18nStore?.t(`mailboxPage.undo`):``,l,Ea)}leaveDeletedMessage(e){if(e){this.updateUrl(this.currentMailbox,this.currentPage,e);return}this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)}async eachFolder(e,t){let n=[],r;for(let[i,a]of bi(e)){let e=await t(i,a);if(e.ok){n.push({mailbox:i,uids:a,result:e});continue}if(r??=e,e.reason===`auth`)break}return{done:n,refused:r}}writtenKeys(e){return e.flatMap(({mailbox:e,uids:t})=>t.map(t=>H(e,t)))}async flagEach(e,t,n){let r=t.map(t=>({flag:t,keys:this.updateLocalMessageFlags(e,t,n)})),i=new Set,{refused:a}=await this.eachFolder(e,async(e,r)=>{let a=await B.setFlag(e,r,t,n);if(a.ok)for(let t of r)i.add(H(e,t));return a});if(i.size<e.length){let e=n===`add`?`remove`:`add`;for(let{flag:t,keys:n}of r){let r=n.filter(e=>!i.has(e));r.length>0&&this.updateLocalMessageFlags(r,t,e)}}return a??{ok:!0}}async flagTargets(e,t,n){if(!this.selectAllMatching)return this.flagEach(e,t,n);let r=await B.setFlagMatching(this.currentMailbox,this.matchingScope,t,n);if(r.ok)for(let r of t)this.updateLocalMessageFlags(e,r,n);return r}async fileWholeFolder(e,t){let n=this.currentMailbox,r=this.matchingScope,i=await B.moveMatching(n,r,e);if(!i.success){i.reason!==`auth`&&this.reportActionFailed(`toast.moveFailed`,`Could not move that`);return}this.clearSelection(),this.selectedMessage=null,this.updateUrl(n,this.currentPage,null);let a=this.undoMoves([{from:n,mapping:i.uidMapping??{}}],e,n,void 0);this.showGlobalToast(t(i.count??0),a?this.i18nStore?.t(`mailboxPage.undo`):``,a,Ea)}takeRowsOut(e){let t=this.messages,n=this.totalMessages,r=e=>this.messages===this.rowsAfterTakeOut?(this.messages=t,this.totalMessages=n,this.takeRowsOut(e),!0):!1;if(e.length===0)return r;let i=new Set(e),a=0,o=[];for(let e of this.messages){let t=e.SubMessages??[],n=t.filter(e=>!i.has(this.keyOf(e)));if(i.has(this.keyOf(e))&&n.length===0){a+=1;continue}o.push(n.length===t.length?e:{...e,SubMessages:n})}return this.messages=o,this.rowsAfterTakeOut=o,a>0&&(this.totalMessages=Math.max(0,this.totalMessages-a)),r}async fileAway(e,t,n,r){if(this.selectAllMatching)return this.fileWholeFolder(t,r);let i=this.currentMailbox,a=this.selectedMessage?this.keyOf(this.selectedMessage):void 0,o=n?e.filter(e=>yi(e).mailbox!==t):[],s=n?this.takeRowsOut(o):void 0,{done:c,refused:l}=await this.eachFolder(e,async(e,n)=>{if(e===t)return{ok:!0,uidMapping:{}};let r=await B.moveMessages(e,n,t);return{ok:r.success,reason:r.reason,uidMapping:r.uidMapping??{}}}),u=this.writtenKeys(c);if(u.length>0){n&&(this.selectedKeys=new Set([...this.selectedKeys].filter(e=>!u.includes(e)))),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null);let e=c.filter(({mailbox:e})=>e!==t).map(({mailbox:e,result:t})=>({from:e,mapping:t.uidMapping})),o=this.undoMoves(e,t,i,n?void 0:a);this.showGlobalToast(r(u.length),o?this.i18nStore?.t(`mailboxPage.undo`):``,o,Ea)}if(l&&l.reason!==`auth`&&(this.reportActionFailed(`toast.moveFailed`,`Could not move that`),s)){let t=new Set(u),n=e.filter(e=>!t.has(e));s(o.filter(e=>t.has(e)))?this.selectedKeys=new Set(n):L.sync()}}undoMoves(e,t,n,r){let i=e.filter(({mapping:e})=>Object.keys(e).length>0);if(i.length!==0)return async()=>{try{let e=[],a=null,o;for(let{from:n,mapping:s}of i){let i=await B.moveMessages(t,Object.values(s),n);if(!i.success){if(o??=i,i.reason===`auth`)break;continue}for(let[t,o]of Object.entries(s)){let s=i.uidMapping?.[o];s&&(e.push(H(n,s)),r===H(n,t)&&(a=H(n,s)))}}if(o&&o.reason!==`auth`&&this.reportActionFailed(`toast.undoFailed`,`Could not undo that`),e.length===0)return;if(r!==void 0){let e=this.currentMailbox===n?this.currentPage:0;this.openKeyInUrl(n,e,a)}else this.currentMailbox===n&&(this.selectedKeys=new Set([...this.selectedKeys,...e]))}catch(e){b.error(`Undo failed`,e),this.reportActionFailed(`toast.undoFailed`,`Could not undo that`)}}}deletesForGood(e){let t=Jt(e,this.mailboxes);return t===`trash`||t===`drafts`||t===`junk`}movedMessage(e,t,n,r=``){let[i,a]={archive:[`toast.messagesMovedToArchive`,`toast.messageMovedToArchive`],reportSpam:[`toast.messagesMovedToSpam`,`toast.messageMovedToSpam`],notSpam:[`toast.messagesMovedToInbox`,`toast.messageMovedToInbox`],moveTo:[`toast.messagesMovedToFolder`,`toast.messageMovedToFolder`]}[e]??[`toast.messagesMovedToTrash`,`toast.messageMovedToTrash`];return t?this.i18nStore?.t(i,{count:n,folder:r}):this.i18nStore?.t(a,{folder:r})}async _handleReaderAction(e){let t=e.detail.action;if(e.detail.uid&&e.detail.mailbox)return this.handleNamedMessageAction(e.detail);let n=this.selectionCount>0,r=this.selectedMessage;if(!n&&!r?.UID)return;let i=n?[]:[this.keyOf(r)],a=n?[...this.selectedKeys]:e.detail.uids?.length?e.detail.uids.map(e=>H(this.currentMailbox,e)):i,o=n||a.length>1;n&&(this.bulkProcessing=!0);try{if(t===`star`){let e=n?this.starWrite(this.selectedStarRows):{keys:i,op:r.Flags?.includes(`\\Flagged`)?`remove`:`add`},t=await this.flagTargets(e.keys,[z],e.op);t.ok||this.reportFlagFailure(t)}else if(t===`addTag`||t===`removeTag`){let n=e.detail.tags||(e.detail.folder?[e.detail.folder]:[]);if(!n||n.length===0)return;let r=t===`addTag`?`add`:`remove`,i=await this.flagTargets(a,n,r);i.ok||this.reportFlagFailure(i),this.requestUpdate()}else if(t===`markUnread`)if(n){let e=await this.flagTargets(a,[R],this.allSelectedUnread?`add`:`remove`);e.ok||this.reportFlagFailure(e)}else{let e=!r.Flags||!r.Flags.includes(`\\Seen`),t=await B.setFlag(this.mailboxOf(r),[String(r.UID)],[R],e?`add`:`remove`);t.ok?e?(this.selectedMessage={...r,Flags:[...r.Flags||[],R]},this.updateLocalMessageFlags(i,R,`add`)):(this.updateLocalMessageFlags(i,R,`remove`),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)):this.reportFlagFailure(t)}else if(t===`delete`||t===`archive`||t===`reportSpam`||t===`notSpam`){let e=Yt(`trash`,this.mailboxes,Wt);if(t===`archive`&&(e=Yt(`archive`,this.mailboxes,Bt)),t===`reportSpam`&&(e=Yt(`junk`,this.mailboxes,Ut)),t===`notSpam`&&(e=E),t===`delete`&&this.selectAllMatching){if(this.deletesForGood(this.currentMailbox)){this.pendingDeleteDetails={isBulk:n,doomed:[],toTrash:[],isDrafts:Jt(this.currentMailbox,this.mailboxes)===`drafts`,matching:{count:this.selectionCount}},this.showDeleteConfirm=!0;return}}else if(t===`delete`){let e=a.filter(e=>this.deletesForGood(yi(e).mailbox));if(e.length>0){this.pendingDeleteDetails={isBulk:n,doomed:e,toTrash:a.filter(t=>!e.includes(t)),isDrafts:e.every(e=>Jt(yi(e).mailbox,this.mailboxes)===`drafts`)},this.showDeleteConfirm=!0;return}}await this.fileAway(a,e,n,e=>this.movedMessage(t,o,e))}else if(t===`moveTo`||t===`copyTo`){let r=e.detail.folder;if(!r)return;if(t===`moveTo`)await this.fileAway(a,r,n,e=>this.movedMessage(t,o,e,r));else if(this.selectAllMatching){let e=await B.copyMatching(this.currentMailbox,this.matchingScope,r);if(e.success){let t=e.count??0;this.showGlobalToast(o?this.i18nStore?.t(`toast.messagesCopiedToFolder`,{count:t,folder:r}):this.i18nStore?.t(`toast.messageCopiedToFolder`,{folder:r}),``,void 0,Ea)}else e.reason!==`auth`&&this.reportActionFailed(`toast.copyFailed`,`Could not copy that`)}else{let{done:e,refused:t}=await this.eachFolder(a,async(e,t)=>{let n=await B.copyMessages(e,t,r);return{ok:n.success,reason:n.reason,uidMapping:{}}}),n=this.writtenKeys(e).length;if(n>0){let e=o?this.i18nStore?.t(`toast.messagesCopiedToFolder`,{count:n,folder:r}):this.i18nStore?.t(`toast.messageCopiedToFolder`,{folder:r});this.showGlobalToast(e,``,void 0,Ea)}t&&t.reason!==`auth`&&this.reportActionFailed(`toast.copyFailed`,`Could not copy that`)}}else if(t===`downloadMessage`&&!n){let e=`/mailboxes/${D(this.mailboxOf(r))}/messages/${r.UID}/raw`,t=document.createElement(`a`);t.href=e,t.download=``,document.body.appendChild(t),t.click(),document.body.removeChild(t)}else if(t===`showOriginal`&&!n){let e=`#/original?mailbox=${encodeURIComponent(this.mailboxOf(r))}&uid=${r.UID}`;window.open(e,`_blank`)}}finally{n&&(this.bulkProcessing=!1)}}async _confirmDelete(){this.showDeleteConfirm=!1;let e=this.pendingDeleteDetails;if(this.pendingDeleteDetails=null,!e)return;let{isBulk:t,doomed:n,toTrash:r,isDrafts:i,named:a,matching:o}=e,s=o?o.count>1:n.length>1;t&&(this.bulkProcessing=!0);try{if(o){let e=await B.deleteMatchingResult(this.currentMailbox,this.matchingScope);if(e.ok){let t=e.count??0;this.clearSelection(),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null);let n=i?s?this.i18nStore?.t(`toast.draftsDiscarded`,{count:t}):this.i18nStore?.t(`toast.draftDiscarded`):s?this.i18nStore?.t(`toast.messagesPermanentlyDeleted`,{count:t}):this.i18nStore?.t(`toast.messagePermanentlyDeleted`);this.showGlobalToast(n,``,void 0,Ea)}else e.reason!==`auth`&&this.reportActionFailed(`toast.messageDeleteFailed`,`The message could not be deleted`);return}let e=t&&!a?this.takeRowsOut(n):void 0,{done:c,refused:l}=await this.eachFolder(n,(e,t)=>B.deleteMessagesResult(e,t));a?.done?.(!l);let u=this.writtenKeys(c);if(u.length>0){a?a.isOpen&&this.leaveDeletedMessage(a.nextUid):(t&&(this.selectedKeys=new Set([...this.selectedKeys].filter(e=>!u.includes(e)))),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null));let e=``;e=i?s?this.i18nStore?.t(`toast.draftsDiscarded`,{count:u.length}):this.i18nStore?.t(`toast.draftDiscarded`):s?this.i18nStore?.t(`toast.messagesPermanentlyDeleted`,{count:u.length}):this.i18nStore?.t(`toast.messagePermanentlyDeleted`),this.showGlobalToast(e,``,void 0,Ea)}if(l&&l.reason!==`auth`&&(this.reportActionFailed(`toast.messageDeleteFailed`,`The message could not be deleted`),e)){let t=new Set(u);e(u)?this.selectedKeys=new Set(n.filter(e=>!t.has(e))):L.sync()}if(r.length>0){let e=Yt(`trash`,this.mailboxes,Wt);await this.fileAway(r,e,t,e=>this.movedMessage(`delete`,t||r.length>1,e))}}finally{t&&(this.bulkProcessing=!1)}}_cancelDelete(){this.showDeleteConfirm=!1,this.pendingDeleteDetails=null}toggleFolder(e,t){t&&(t.stopPropagation(),t.preventDefault());let n=new Set(this.expandedFolders);n.has(e)?n.delete(e):n.add(e),this.expandedFolders=n}render(){let e=this.isMobile?`full`:this.layoutMode,t=e===`full`&&this.selectedMessage!==null;return n`
      <alps-initial-loader ?hidden=${!this.showInitialLoader}></alps-initial-loader>
      <app-header 
        .username=${this.username}
        .isMobile=${this.isMobile}
        .currentMailbox=${this.currentMailbox}
        .currentMailboxDelimiter=${$t(this.currentMailbox,this.mailboxes)}
        .searchQuery=${this.filterQuery}
        .scrolled=${this.listScrolled}
        @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
        @compose=${()=>this.composeStore.openComposer()}
        @search-submit=${e=>{let t=e.detail.value,n=e.detail.global?`*`:this.currentMailbox;this.updateUrl(n,0,null,t)}}
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
          @sidebar-resize=${e=>{let t=e.detail.newWidth;t<Pa?(this.sidebarCollapsed||this.settingsStore.updateSettings({sidebarCollapsed:!0}),this.sidebarWidth=Aa):(this.sidebarCollapsed&&this.settingsStore.updateSettings({sidebarCollapsed:!1}),this.sidebarWidth=Math.min(Math.max(t,ja),Ma),this.resizerPositionX=Math.max(this.resizerPositionX,this.sidebarWidth+Fa))}}
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
            @select-mailbox=${e=>{this.currentMailbox===e.detail.name?(this.currentPage=0,this.selectedMessage=null,this.filterQuery=``,this.loadingMessages=!0,this.updateUrl(e.detail.name,0,null),L.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)):(this.loadingMessages=!0,this.filterQuery=``,this.clearSelection(),this.updateUrl(e.detail.name,0,null)),this.sidebarCollapsed&&!this.isMobile&&(this.suppressSidebarHover=!0),this.isMobile&&(this.mobileSidebarOpen=!1)}}
            @toggle-folder=${e=>this.toggleFolder(e.detail.folderName,null)}
            @expand-folder=${e=>{let t=new Set(this.expandedFolders);t.add(e.detail.folderName),this.expandedFolders=t}}
            @compose=${()=>{this.composeStore.openComposer(),this.isMobile&&(this.mobileSidebarOpen=!1)}}
            @toast=${this._relayToast}
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
              .currentMailboxRole=${Jt(this.currentMailbox,this.mailboxes)||``}
              .currentMailboxDelimiter=${$t(this.currentMailbox,this.mailboxes)}
              .sidebarCollapsed=${this.sidebarCollapsed&&!this.isMobile}
              .loading=${this.loadingMessages}
              .selectedMessage=${this.selectedMessage}
              .selectedMessages=${this.selectedKeys}
              .selectAllMatching=${this.selectAllMatching}
              .matchingCount=${this.selectionCount}
              .layoutMode=${e}
              .isMobile=${this.isMobile}
              .currentPage=${this.currentPage}
              .listedPage=${this.listedPage}
              .totalMessages=${this.totalMessages}
              .messagesPerPage=${this.messagesPerPage}
              .densityMode=${this.densityMode}
              .showSenderAvatars=${this.showSenderAvatars}
              .filterQuery=${this.filterQuery}
              .sortOrder=${this.sortOrder}
              .syncing=${this.isSyncing}
              .loadFailed=${this.listLoadFailed}
              @refresh=${()=>{this.currentPage=0,L.check(this.currentMailbox,this.currentPage,this.filterQuery)}}
              @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
              @compose=${()=>this.composeStore.openComposer()}
              @toast=${this._relayToast}
              @select-message=${e=>this.selectMessage(e.detail.message)}
              @change-page=${e=>this.updateUrl(this.currentMailbox,e.detail.page,this.targetUid,void 0,this.targetMailbox)}
              @list-scrolled=${e=>this.listScrolled=e.detail.scrolled}
              @toggle-sort=${async()=>{let e=this.sortOrder===`asc`?`desc`:`asc`;this.messages=[],this.loadingMessages=!0,await this.settingsStore.updateSettings({sortOrder:e}),this.currentPage=0,L.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)}}
              @toggle-filter-starred=${()=>{let e=this.filterQuery===`is:starred`?``:`is:starred`;this.updateUrl(this.currentMailbox,0,null,e)}}
              @toggle-filter-unread=${()=>{let e=this.filterQuery===`is:unread`?``:`is:unread`;this.updateUrl(this.currentMailbox,0,null,e)}}
              @clear-search=${()=>{let e=this.currentMailbox===`*`?E:this.currentMailbox;this.updateUrl(e,0,null,``)}}
              @search-submit=${e=>{let t=e.detail.value,n=e.detail.global?`*`:this.currentMailbox;this.updateUrl(n,0,null,t)}}
              @selection-changed=${e=>this.takeSelection(e.detail.selectedKeys)}
              @select-all-matching=${()=>this.selectAllInFolder()}
              @clear-selection=${()=>this.clearSelection()}
              @toggle-star-message=${this._handleListToggleStar}
            >
              <div slot="mobile-bulk-actions" class="mobile-bulk-actions-container">
                <alps-icon-btn title=${this.i18nStore?.t(`general.cancel`)||`Cancel`} @click=${()=>this.clearSelection()} icon="arrowLeft"></alps-icon-btn>
                <span class="mobile-bulk-actions-count">${this.selectionCount}</span>
                ${this.canArchiveHere?n`
                  <alps-icon-btn title=${this.i18nStore?.t(`messageReader.archive`)} @click=${()=>this._handleReaderAction(new CustomEvent(`action`,{detail:{action:`archive`}}))} icon="archiveBox"></alps-icon-btn>
                `:``}
                <alps-icon-btn title=${this.i18nStore?.t(`messageReader.delete`)} @click=${()=>this._handleReaderAction(new CustomEvent(`action`,{detail:{action:`delete`}}))} icon="trash"></alps-icon-btn>
                <div class="header-divider"></div>
                <alps-icon-btn title=${this.allSelectedUnread?this.i18nStore?.t(`messageReader.markRead`):this.i18nStore?.t(`messageReader.markUnread`)} @click=${()=>this._handleReaderAction(new CustomEvent(`action`,{detail:{action:`markUnread`}}))} icon=${this.allSelectedUnread?`envelopeOpen`:`envelopeUnread`}></alps-icon-btn>
                <alps-icon-btn title=${this.i18nStore?.t(`messageReader.star`)} @click=${()=>this._handleReaderAction(new CustomEvent(`action`,{detail:{action:`star`}}))} icon=${this.allSelectedStarred?`starFourFill`:`starFour`}></alps-icon-btn>
                <div class="header-divider"></div>
                <alps-folder-selector-popup
                  .mailboxes=${this.mailboxes}
                  .currentMailbox=${this.currentMailbox}
                  @folder-selected=${e=>this._handleReaderAction(new CustomEvent(`action`,{detail:{action:e.detail.isMove?`moveTo`:`copyTo`,folder:e.detail.folderName}}))}
                >
                  <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`messageReader.moveTo`)} icon="folderOpen"></alps-icon-btn>
                </alps-folder-selector-popup>
              </div>
            </alps-message-list>
          </div>
          ${e===`full`?``:n`
            <div class="resizer ${this.isPaneDragging?`dragging`:``}" @mousedown=${this.startResize}></div>
          `}
          <div class="pane message-reader-pane">
            <alps-message-reader
              .mailboxes=${this.mailboxes}
              .mailbox=${this.currentMailbox}
              .message=${this.selectedMessage}
              .messages=${this.messages}
              .layoutMode=${e}
              .selectedKeys=${this.selectedKeys}
              .selectedCount=${this.selectionCount}
              .allSelectedStarred=${this.allSelectedStarred}
              .allSelectedUnread=${this.allSelectedUnread}
              .commonTags=${this.commonSelectedTags}
              .bulkProcessing=${this.bulkProcessing}
              @close=${()=>{this.updateUrl(this.currentMailbox,this.currentPage,null)}}
              @action=${this._handleReaderAction}
              @message-flags-changed=${e=>this.updateLocalMessageFlags([H(e.detail.mailbox??this.currentMailbox,e.detail.uid)],e.detail.flag,e.detail.action)}
            ></alps-message-reader>
          </div>
        </div>
      </div>
      ${this.showDeleteConfirm?n`
        <ui-confirm
          title="${this.i18nStore?.t(`mailboxPage.permanentlyDelete`)}"
          message=${(this.pendingDeleteDetails?.matching?.count??this.pendingDeleteDetails?.doomed.length??0)>1?this.i18nStore?.t(`messageReader.deleteConfirmMultiple`):this.i18nStore?.t(`messageReader.deleteConfirmSingle`)}
          confirmText=${this.i18nStore?.t(`mailboxPage.deletePermanently`)}
          cancelText=${this.i18nStore?.t(`general.cancel`)}
          .isDanger=${!0}
          @confirm=${this._confirmDelete}
          @cancel=${this._cancelDelete}
        ></ui-confirm>
      `:``}
    `}};k([h({context:ai})],q.prototype,`composeStore`,void 0),k([h({context:C})],q.prototype,`settingsStore`,void 0),k([h({context:S})],q.prototype,`i18nStore`,void 0),k([a()],q.prototype,`showDeleteConfirm`,void 0),k([a()],q.prototype,`listLoadFailed`,void 0),k([a()],q.prototype,`pendingDeleteDetails`,void 0),k([a()],q.prototype,`mailboxes`,void 0),k([a()],q.prototype,`messages`,void 0),k([a()],q.prototype,`currentMailbox`,void 0),k([a()],q.prototype,`loadingMessages`,void 0),k([a()],q.prototype,`showInitialLoader`,void 0),k([a()],q.prototype,`selectedMessage`,void 0),k([a()],q.prototype,`selectedKeys`,void 0),k([a()],q.prototype,`selectAllMatching`,void 0),k([a()],q.prototype,`excludedKeys`,void 0),k([a()],q.prototype,`layoutMode`,void 0),k([a()],q.prototype,`filterQuery`,void 0),k([a()],q.prototype,`expandedFolders`,void 0),k([a()],q.prototype,`username`,void 0),k([a()],q.prototype,`currentPage`,void 0),k([a()],q.prototype,`listedPage`,void 0),k([a()],q.prototype,`totalMessages`,void 0),k([a()],q.prototype,`messagesPerPage`,void 0),k([a()],q.prototype,`resizerPositionX`,void 0),k([a()],q.prototype,`listHeight`,void 0),k([a()],q.prototype,`isSidebarDragging`,void 0),k([a()],q.prototype,`isPaneDragging`,void 0),k([a()],q.prototype,`sidebarWidth`,void 0),k([a()],q.prototype,`isSidebarHovered`,void 0),k([a()],q.prototype,`densityMode`,void 0),k([a()],q.prototype,`showSenderAvatars`,void 0),k([a()],q.prototype,`isSyncing`,void 0),k([a()],q.prototype,`sidebarCollapsed`,void 0),k([a()],q.prototype,`suppressSidebarHover`,void 0),k([a()],q.prototype,`sortOrder`,void 0),k([a()],q.prototype,`listScrolled`,void 0),k([a()],q.prototype,`targetUid`,void 0),k([a()],q.prototype,`targetMailbox`,void 0),k([a()],q.prototype,`isMobile`,void 0),k([a()],q.prototype,`mobileSidebarOpen`,void 0),k([a()],q.prototype,`bulkProcessing`,void 0),k([a()],q.prototype,`computedMinListWidth`,void 0),q=k([p(`mailbox-page`)],q);var Ba=e=>`alps_contacts_categories_${e}`,Va=`contacts_categories_cache`,J=class extends d{constructor(...e){super(...e),this.contacts=[],this.sortOrder=`asc`,this.showOnlyStarred=!1,this.loading=!0,this.isSpinning=!1,this.showInitialLoader=!window.alpsAppLoaded,this.selectedContact=null,this.filterQuery=``,this.isEditing=!1,this.saving=!1,this.selectedCategory=``,this.showCreatePrompt=!1,this.showDeleteConfirm=!1,this.addedCategories=[],this.sidebarWidth=250,this.listWidth=380,this.sidebarCollapsed=!1,this.isSidebarHovered=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.hoverTimeout=null,this.suppressSidebarHover=!1,this.isSidebarDragging=!1,this.isPaneDragging=!1,this.densityMode=`compact`,this.selectedContacts=new Set,this.listScrolled=!1,this.categoryToRename=null,this.categoryToDelete=null,this.syncIntervalTimer=null,this._handleSettingsChange=()=>{if(this.settingsStore){let e=this.settingsStore.getState();if(this.sidebarCollapsed=e.sidebarCollapsed,this.densityMode=e.densityMode||`compact`,this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null),e.checkMailInterval&&e.checkMailInterval>0){let t=e.checkMailInterval*60*1e3;this.syncIntervalTimer=setInterval(()=>{this.fetchContacts()},t)}}},this._handleWindowResize=()=>{this.isMobile=window.innerWidth<=768},this.loadAddedCategories=()=>{try{localStorage.removeItem(Va);let e=ke(),t=e?JSON.parse(localStorage.getItem(Ba(e))||`[]`):[];this.addedCategories=Array.isArray(t)?t:[]}catch{this.addedCategories=[]}},this._handleHashChange=()=>{this.contacts=this.contacts.filter(e=>!e.isTemporary);let e=window.location.hash.match(/^#\/contacts\/?([^\/]*)\/?(.*)$/);if(e){let t=e[1]?decodeURIComponent(e[1]):``,n=e[2]?decodeURIComponent(e[2]):``,r=t===`all`||!t?``:t;if(this.selectedCategory!==r&&(this.selectedCategory=r,this.selectedContacts=new Set,this.isMobile&&(this.mobileSidebarOpen=!1)),n){if((this.selectedContact?.uid?.replace(/^urn:uuid:/,``)||this.selectedContact?.path)!==n){if(this.contacts.length===0)return;let e=this.contacts.find(e=>(e.uid?.replace(/^urn:uuid:/,``)||e.path)===n);e&&this.selectContact(e,!1)}}else this.selectedContact=null,this.isEditing=!1}else this.selectedContact=null,this.isEditing=!1},this.queuedSave=null,this.saveRunning=!1,this.conflictedPath=null,this.startResize=e=>{e.preventDefault(),this.isPaneDragging=!0;let t=e.clientX,n=this.listWidth,r=e=>{let r=e.clientX-t;this.listWidth=Math.max(250,Math.min(800,n+r))},i=()=>{this.isPaneDragging=!1,window.removeEventListener(`mousemove`,r),window.removeEventListener(`mouseup`,i)};window.addEventListener(`mousemove`,r),window.addEventListener(`mouseup`,i)}}static{this.styles=[q.styles,U.styles,En,g`
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

  `]}updated(e){if(super.updated(e),e.has(`densityMode`)){let e=this.settingsStore?.getState().densityMode||`normal`;this.dataset.density=e;let t=this.shadowRoot?.querySelector(`.contact-list-pane`);t&&(t.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),t.classList.add(`density-${e}`))}e.has(`loading`)&&this.loading&&(this.isSpinning=!0)}handleSpinIteration(){this.loading||(this.isSpinning=!1)}connectedCallback(){super.connectedCallback(),this.showInitialLoader=!window.alpsAppLoaded,this.classList.add(`density-compact`),this.loadAddedCategories(),window.addEventListener(`alps-active-user-changed`,this.loadAddedCategories),this.fetchContacts(),window.addEventListener(`resize`,this._handleWindowResize),window.addEventListener(`hashchange`,this._handleHashChange),this.settingsStore&&(this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._handleSettingsChange()),setTimeout(()=>this._handleHashChange(),0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this._handleWindowResize),window.removeEventListener(`hashchange`,this._handleHashChange),window.removeEventListener(`alps-active-user-changed`,this.loadAddedCategories),this.settingsStore&&this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null)}saveAddedCategories(){let e=ke();if(e)try{localStorage.setItem(Ba(e),JSON.stringify(this.addedCategories))}catch{}}get uniqueCategories(){let e=new Set(this.addedCategories);for(let t of this.contacts)if(t.categories)for(let n of t.categories)e.add(n);return Array.from(e).sort((e,t)=>e.localeCompare(t))}get username(){return this.settingsStore?.getState().loginUsername||``}async fetchContacts(){this.loading=!0;try{let e=await I.fetchContacts(this.filterQuery);this.contacts=e.contacts||[],this._handleHashChange()}catch(e){console.error(`Failed to fetch contacts`,e)}finally{this.loading=!1,this.showInitialLoader&&setTimeout(()=>{this.showInitialLoader=!1,window.alpsAppLoaded=!0},100)}}async selectContact(e,t=!0){if(e.isTemporary){this.selectedContact=e,this.isEditing=!0;return}if(t){let t=this.selectedCategory?encodeURIComponent(this.selectedCategory):`all`,n=e.uid?.replace(/^urn:uuid:/,``)||e.path;window.location.hash=`/contacts/${t}/${encodeURIComponent(n)}`;return}if(this.selectedContacts.size>0&&(this.selectedContacts=new Set),this.selectedContact?.path!==e.path){this.selectedContact={...e},this.isEditing=!1,this.conflictedPath=null;try{let t=await I.fetchContact(e.path);this.selectedContact?.path===t.path&&(this.selectedContact=t)}catch(e){console.error(`Failed to fetch contact details`,e)}}}get gestureTargets(){return this.selectedContacts.size>0?Array.from(this.selectedContacts):[this.selectedContact?.path].filter(Boolean)}get allSelectedStarred(){if(this.selectedContacts.size===0)return!1;for(let e of this.selectedContacts){let t=this.contacts.find(t=>t.path===e);if(!t||!t.categories?.includes(`Favorites`))return!1}return!0}async handleToggleStar(e,t){if(e.stopPropagation(),t.isTemporary)return;let n=t.categories?[...t.categories]:[];n.includes(`Favorites`)?n=n.filter(e=>e!==_r):n.push(_r),this.contacts=this.contacts.map(e=>e.path===t.path?{...e,categories:n}:e);try{let e=await I.updateCategories(t.path,n);this.applyETags(e.etag?{[t.path]:e.etag}:void 0),this.selectedContact?.path===t.path&&(this.selectedContact={...this.selectedContact,categories:n})}catch(e){console.error(`Failed to toggle star:`,e),this.reportFailure(`contacts.starFailed`);let n=t.categories;this.contacts=this.contacts.map(e=>e.path===t.path?{...e,categories:n}:e)}}handleSelectAll(e){let t=e;if(t.detail?t.detail.checked:e.target.checked){let e=this.contacts.filter(e=>!(this.selectedCategory&&(!e.categories||!e.categories.includes(this.selectedCategory))));this.selectedContacts=new Set(e.map(e=>e.path))}else this.selectedContacts=new Set}handleSelectContact(e,t){e.stopPropagation();let n=new Set(this.selectedContacts);n.has(t)?n.delete(t):n.add(t),this.selectedContacts=n}handleCreateCategorySubmit(e){let t=e.detail.name?.trim();t&&(this.addedCategories.includes(t)||(this.addedCategories=[...this.addedCategories,t],this.saveAddedCategories())),this.showCreatePrompt=!1}handleCreateNew(){this.selectedContacts=new Set;let e={name:this.i18nStore?.t(`contacts.unnamedContact`),categories:this.selectedCategory?[this.selectedCategory]:[],isTemporary:!0};this.contacts=this.contacts.filter(e=>!e.isTemporary),this.contacts=[e,...this.contacts],this.selectedContact=e,this.isEditing=!0}async cardsCarrying(e){return(this.filterQuery?(await I.fetchContacts()).contacts||[]:this.contacts).filter(t=>t.categories?.includes(e))}async handleRenameCategorySubmit(e){let t=e.detail.name?.trim();if(!t||!this.categoryToRename||t===this.categoryToRename){this.categoryToRename=null;return}let n=this.categoryToRename;this.categoryToRename=null,this.addedCategories.includes(n)&&(this.addedCategories=this.addedCategories.map(e=>e===n?t:e),this.saveAddedCategories()),this.selectedCategory===n&&(this.selectedCategory=t,window.location.hash=`/contacts/${encodeURIComponent(t)}`);let r;try{r=await this.cardsCarrying(n)}catch(e){console.error(`Could not read the address book for a category change`,e),this.reportFailure(`contacts.categoryRenameFailed`,{failed:1,total:1});return}if(r.length>0){this.saving=!0;try{let e=r.map(e=>{let r=e.categories.map(e=>e===n?t:e);return{...e,categories:r}}),{total:i,failed:a,etags:o}=await I.bulkUpdateCategories(e);this.applyETags(o),this.fetchContacts(),a>0&&this.reportFailure(`contacts.categoryRenameFailed`,{failed:a,total:i})}catch(e){console.error(`Error renaming category`,e),this.fetchContacts(),this.reportFailure(`contacts.categoryRenameFailed`,{failed:1,total:1})}finally{this.saving=!1}}}async handleDeleteCategorySubmit(){if(!this.categoryToDelete)return;let e=this.categoryToDelete;this.categoryToDelete=null,this.addedCategories.includes(e)&&(this.addedCategories=this.addedCategories.filter(t=>t!==e),this.saveAddedCategories()),this.selectedCategory===e&&(this.selectedCategory=``,window.location.hash=`/contacts/all`);let t;try{t=await this.cardsCarrying(e)}catch(e){console.error(`Could not read the address book for a category change`,e),this.reportFailure(`contacts.categoryDeleteFailed`,{failed:1,total:1});return}if(t.length>0){this.saving=!0;try{let n=t.map(t=>{let n=t.categories.filter(t=>t!==e);return{...t,categories:n}}),{total:r,failed:i,etags:a}=await I.bulkUpdateCategories(n);this.applyETags(a),this.fetchContacts(),i>0&&this.reportFailure(`contacts.categoryDeleteFailed`,{failed:i,total:r})}catch(e){console.error(`Error deleting category`,e),this.fetchContacts(),this.reportFailure(`contacts.categoryDeleteFailed`,{failed:1,total:1})}finally{this.saving=!1}}}handleEdit(){this.isEditing=!0}handleCancelEdit(){this.isEditing=!1,this.selectedContact?.isTemporary?(this.selectedContact=null,this.contacts=this.contacts.filter(e=>!e.isTemporary),this.selectedCategory||(window.location.hash=`/contacts/all`)):this.selectedContact?.path&&this.selectedContact.path===this.conflictedPath&&(this.conflictedPath=null,this.rereadOpenContact())}async rereadOpenContact(){let e=this.selectedContact?.path;if(e){try{let t=await I.fetchContact(e);this.selectedContact?.path===e&&!this.isEditing&&(this.selectedContact=t)}catch(e){console.error(`Failed to re-read the contact`,e)}this.fetchContacts()}}applyETags(e){if(!e||Object.keys(e).length===0)return;this.contacts=this.contacts.map(t=>e[t.path]?{...t,etag:e[t.path]}:t);let t=this.selectedContact?.path;t&&e[t]&&(this.selectedContact={...this.selectedContact,etag:e[t]})}async handleSave(e){if(this.queuedSave=e,!this.saveRunning){this.saveRunning=!0;try{for(;this.queuedSave;){let e=this.queuedSave;this.queuedSave=null,await this.saveOnce(e)}}finally{this.saveRunning=!1}}}async saveOnce(e){let t=!!this.selectedContact&&!this.selectedContact.isTemporary;if(!(t&&this.conflictedPath===this.selectedContact.path)){this.saving=!0;try{e.categories&&typeof e.categories==`string`?e.categories=e.categories.split(`,`).map(e=>e.trim()).filter(e=>e):e.categories=[];let n;n=t?await I.updateContact(this.selectedContact.path,{...e,etag:this.selectedContact.etag}):await I.createContact(e);let r={...e,path:n.path||(t?this.selectedContact.path:``),etag:n.etag},i=this.contacts.findIndex(e=>this.selectedContact&&(e.path===this.selectedContact.path||e.isTemporary&&this.selectedContact.isTemporary));i>-1?(this.contacts[i]={...this.contacts[i],...r},delete this.contacts[i].isTemporary,this.contacts=[...this.contacts]):this.contacts=[r,...this.contacts],this.selectedContact={...this.selectedContact,...r},delete this.selectedContact.isTemporary}catch(e){console.error(`Error saving contact`,e),t&&st(e)?(this.conflictedPath=this.selectedContact.path,this.reportFailure(`contacts.saveConflict`)):this.reportFailure(`contacts.saveFailed`)}finally{this.saving=!1}}}handleSaveEvent(e){this.handleSave(e.detail)}async handleToggleStarEvent(){let e=this.gestureTargets;if(e.length===0)return;let t=e.length>1?this.allSelectedStarred:this.contacts.find(t=>t.path===e[0])?.categories?.includes(`Favorites`)||!1;this.saving=!0;let n=this.contacts.map(e=>({...e})),r=this.selectedContact?{...this.selectedContact}:null;try{let i=e.map(e=>{let n=this.contacts.findIndex(t=>t.path===e);if(n===-1)return;let r=this.contacts[n],i=r.categories?[...r.categories]:[];return t?i=i.filter(e=>e!==_r):i.includes(`Favorites`)||i.push(_r),this.contacts[n]={...r,categories:i},this.selectedContact?.path===e&&(this.selectedContact={...this.selectedContact,categories:i}),{...r,categories:i}}).filter(Boolean);this.contacts=[...this.contacts];let{total:a,done:o,failed:s,etags:c}=await I.bulkUpdateCategories(i);this.applyETags(c),s>0&&(o===0?(this.contacts=n,this.selectedContact=r):this.fetchContacts(),this.reportFailure(`contacts.starFailed`,{failed:s,total:a}))}catch(e){console.error(`Error toggling star`,e),this.reportFailure(`contacts.starFailed`)}finally{this.saving=!1}}reportFailure(e,t){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(e,t),duration:5e3}}))}handleDelete(){this.showDeleteConfirm=!0}async confirmDelete(){this.showDeleteConfirm=!1,this.saving=!0;try{let e=this.gestureTargets,{total:t,done:n,failed:r}=await I.bulkDeleteContacts(e);n>0&&(this.selectedContact=null,this.selectedContacts.size>0&&(this.selectedContacts=new Set),this.isEditing=!1,this.fetchContacts()),r>0&&this.reportFailure(`contacts.deleteFailed`,{failed:r,total:t})}catch(e){console.error(`Error deleting contacts`,e),this.fetchContacts(),this.reportFailure(`contacts.deleteFailed`,{failed:1,total:1})}finally{this.saving=!1}}async handleUpdateCategories(e){let t=e.detail.category;typeof t==`string`&&(t=t.trim()),t&&!this.addedCategories.includes(t)&&(this.addedCategories=[...this.addedCategories,t],this.saveAddedCategories());let n=this.gestureTargets;if(n.length!==0){this.saving=!0;try{let e=n.map(e=>{let n=this.contacts.findIndex(t=>t.path===e);if(n===-1)return;let r=this.contacts[n],i=r.categories?[...r.categories]:[];return t===``?i=[]:i.includes(t)?i=i.filter(e=>e!==t):i.push(t),this.contacts[n]={...r,categories:i},this.selectedContact?.path===e&&(this.selectedContact={...this.selectedContact,categories:i}),{...r,categories:i}}).filter(Boolean),{total:r,failed:i,etags:a}=await I.bulkUpdateCategories(e);if(this.contacts=[...this.contacts],this.applyETags(a),i>0&&(this.fetchContacts(),this.reportFailure(`contacts.categoryUpdateFailed`,{failed:i,total:r})),this.selectedContact&&this.selectedContacts.size<=1&&this.selectedCategory!==``&&!this.selectedContact.categories?.includes(this.selectedCategory)){let e=this.selectedContact.uid?.replace(/^urn:uuid:/,``)||this.selectedContact.path;e&&(window.location.hash=`#/contacts/all/${encodeURIComponent(e)}`)}this.selectedCategory!==``&&this.selectedCategory!==`All Contacts`&&this.fetchContacts()}catch(e){console.error(`Error updating categories`,e),this.reportFailure(`contacts.categoryUpdateFailed`)}finally{this.saving=!1}}}render(){return n`
      ${this.showDeleteConfirm?n`
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
          ${this.isMobile?``:n`<div class="resizer ${this.isPaneDragging?`dragging`:``}" @mousedown=${this.startResize}></div>`}
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
      
      ${this.showCreatePrompt?n`
        <ui-prompt
          title="${this.i18nStore?.t(`contacts.createCategory`)}"
          confirmText="${this.i18nStore?.t(`contacts.create`)}"
          .fields=${[{id:`name`,label:this.i18nStore?.t(`contacts.categoryName`),autofocus:!0}]}
          @submit=${this.handleCreateCategorySubmit}
          @cancel=${()=>this.showCreatePrompt=!1}
        ></ui-prompt>
      `:``}

      ${this.categoryToRename===null?``:n`
        <ui-prompt
          title="${this.i18nStore?.t(`contacts.renameCategory`)}"
          confirmText="${this.i18nStore?.t(`contacts.rename`)}"
          .fields=${[{id:`name`,label:this.i18nStore?.t(`contacts.categoryName`),value:this.categoryToRename,autofocus:!0}]}
          @submit=${this.handleRenameCategorySubmit}
          @cancel=${()=>this.categoryToRename=null}
        ></ui-prompt>
      `}

      ${this.categoryToDelete===null?``:n`
        <ui-confirm
          title="${this.i18nStore?.t(`contacts.deleteCategory`)}"
          message="${this.i18nStore?.t(`contacts.deleteCategoryConfirm`,{category:this.categoryToDelete})}"
          confirmText="${this.i18nStore?.t(`contacts.delete`)}"
          isDanger
          @confirm=${this.handleDeleteCategorySubmit}
          @cancel=${()=>this.categoryToDelete=null}
        ></ui-confirm>
      `}
    `}};k([h({context:S})],J.prototype,`i18nStore`,void 0),k([h({context:C})],J.prototype,`settingsStore`,void 0),k([a()],J.prototype,`contacts`,void 0),k([a()],J.prototype,`sortOrder`,void 0),k([a()],J.prototype,`showOnlyStarred`,void 0),k([a()],J.prototype,`loading`,void 0),k([a()],J.prototype,`isSpinning`,void 0),k([a()],J.prototype,`showInitialLoader`,void 0),k([a()],J.prototype,`selectedContact`,void 0),k([a()],J.prototype,`filterQuery`,void 0),k([a()],J.prototype,`isEditing`,void 0),k([a()],J.prototype,`saving`,void 0),k([a()],J.prototype,`selectedCategory`,void 0),k([a()],J.prototype,`showCreatePrompt`,void 0),k([a()],J.prototype,`showDeleteConfirm`,void 0),k([a()],J.prototype,`addedCategories`,void 0),k([a()],J.prototype,`sidebarWidth`,void 0),k([a()],J.prototype,`listWidth`,void 0),k([a()],J.prototype,`sidebarCollapsed`,void 0),k([a()],J.prototype,`isSidebarHovered`,void 0),k([a()],J.prototype,`isMobile`,void 0),k([a()],J.prototype,`mobileSidebarOpen`,void 0),k([a()],J.prototype,`suppressSidebarHover`,void 0),k([a()],J.prototype,`isSidebarDragging`,void 0),k([a()],J.prototype,`isPaneDragging`,void 0),k([a()],J.prototype,`densityMode`,void 0),k([a()],J.prototype,`selectedContacts`,void 0),k([a()],J.prototype,`listScrolled`,void 0),k([a()],J.prototype,`categoryToRename`,void 0),k([a()],J.prototype,`categoryToDelete`,void 0),J=k([p(`contacts-page`)],J);var Y=class extends d{constructor(...e){super(...e),this.contact=null,this.isEditing=!1,this.saving=!1,this.uniqueCategories=[],this.isMobile=!1,this.selectedCount=0,this.allSelectedStarred=!1,this.scrolled=!1,this.editForm={},this.isDirty=!1,this.newCategoryName=``,this.saveTimeout=null}handleAddCategory(){let e=this.newCategoryName.trim();if(e){this.dispatchEvent(new CustomEvent(`update-categories`,{detail:{category:e},bubbles:!0,composed:!0})),this.newCategoryName=``;let t=this.shadowRoot?.querySelector(`alps-popup`);t&&t.close()}}static{this.styles=[En,g`
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
  `]}updated(e){if(e.has(`contact`)||e.has(`isEditing`)){let t=e.has(`isEditing`)&&this.isEditing;this.contact&&this.isEditing&&(t||!this.editForm||this.editForm.path!==this.contact.path)&&(this.editForm={...this.contact},this.isDirty=!1,Array.isArray(this.editForm.categories)&&(this.editForm.categories=this.editForm.categories.join(`, `)))}}debouncedSave(){this.saveTimeout&&clearTimeout(this.saveTimeout),this.saveTimeout=setTimeout(()=>{this.handleSave()},500)}handleInput(e,t){this.editForm={...this.editForm,[e]:t},this.isDirty=!0,this.debouncedSave()}handleSave(){this.dispatchEvent(new CustomEvent(`save`,{detail:this.editForm,bubbles:!0,composed:!0}))}renderDetailRow(e,t){if(!t)return``;let r=n`${t}`;return e===`Email Address`?r=n`<a href="mailto:${t}" @click=${e=>{e.preventDefault();let n=this.contact?.name?`"${this.contact.name}" <${t}>`:t;this.composeStore?.openComposer({to:[n]})}}>${t}</a>`:e===`Phone`?r=n`<a href="tel:${t}">${t}</a>`:e===`URL`&&(r=n`<a href=${t.startsWith(`http`)?t:`https://${t}`} target="_blank" rel="noopener noreferrer">${t}</a>`),n`
      <div class="detail-group">
        <div class="group-label">${e}</div>
        <div class="group-value">${r}</div>
      </div>
    `}get isStarred(){return this.selectedCount>0?this.allSelectedStarred:this.contact?.categories?.includes(`Favorites`)||!1}get formattedBirthday(){if(!this.contact?.birthday)return``;let e=new Date(this.contact.birthday);return isNaN(e.getTime())?this.contact.birthday:an(e,this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,`24`).split(` `)[0]}render(){return!this.contact&&!this.isEditing&&this.selectedCount===0?n`
        <div class="empty-state">${this.i18nStore?.t(`contacts.selectContact`)}</div>
      `:n`
      <alps-toolbar class="toolbar" ?scrolled=${this.scrolled}>
        ${this.isMobile?n`
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
          
          ${this.contact?.categories&&this.contact.categories.length>0||this.uniqueCategories.length>0?n`<div class="dropdown-divider"></div>`:``}

          ${this.uniqueCategories.map(e=>{let t=this.contact?.categories?.includes(e);return n`
              <button class="dropdown-item ${t?`active`:``}" @click=${t=>{t.stopPropagation(),this.dispatchEvent(new CustomEvent(`update-categories`,{detail:{category:e},bubbles:!0,composed:!0}))}}>
                ${t?O(`check`):n`<div style="width: 16px;"></div>`}
                <span class="item-text">${e}</span>
              </button>
            `})}

          ${this.contact?.categories&&this.contact.categories.length>0?n`
            ${this.uniqueCategories.length>0?n`<div class="dropdown-divider"></div>`:``}
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
        
        ${this.selectedCount>0?``:n`
          <alps-icon-btn 
            title=${this.isEditing?this.i18nStore?.t(`contacts.cancel`):this.i18nStore?.t(`contacts.editContact`)} 
            @click=${()=>{this.isEditing?(this.saveTimeout&&clearTimeout(this.saveTimeout),this.contact?.isTemporary&&!this.isDirty||this.handleSave(),this.dispatchEvent(new CustomEvent(`cancel-edit`))):this.dispatchEvent(new CustomEvent(`edit`))}} 
            icon="pen"
            ?active=${this.isEditing}
          ></alps-icon-btn>
        `}
      </alps-toolbar>

      <div class="content" @scroll=${e=>{let t=e.target.scrollTop>0;this.scrolled!==t&&(this.scrolled=t)}}>
        ${this.selectedCount>0?n`
          <div class="empty-state" style="flex-direction: column; gap: 16px;">
            <alps-icon-btn icon="users" style="pointer-events: none; margin-right: 8px;"></alps-icon-btn>
            <span>${this.i18nStore?.t(`contacts.selectedContacts`,{count:this.selectedCount})}</span>
          </div>
        `:n`
        <div class="view-header">
          <alps-avatar .name=${this.isEditing?this.editForm.name||this.editForm.email||`Unknown`:this.contact?.name||this.contact?.email||`Unknown`} .email=${this.isEditing?this.editForm.email:this.contact?.email} .src=${this.contact?.avatar||``} .size=${100}></alps-avatar>
        </div>

        ${this.isEditing?n`
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
        `:n`
          <div class="view-header" style="margin-top: -32px;">
            <div class="view-name">
              ${this.contact.name||this.contact.email||this.i18nStore?.t(`contacts.unnamedContact`)||`Unnamed Contact`} ${this.contact.nickname?`(${this.contact.nickname})`:``}
            </div>
            ${this.contact.organization||this.contact.title?n`
              <div class="view-organization">
                ${[this.contact.title,this.contact.organization].filter(Boolean).join(`, `)}
              </div>
            `:``}
            ${this.contact.categories&&this.contact.categories.length>0?n`
              <div class="view-categories">
                ${this.contact.categories.map(e=>n`<span class="category-pill">${e}</span>`)}
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
    `}};k([o({type:Object})],Y.prototype,`contact`,void 0),k([o({type:Boolean})],Y.prototype,`isEditing`,void 0),k([o({type:Boolean})],Y.prototype,`saving`,void 0),k([o({type:Array})],Y.prototype,`uniqueCategories`,void 0),k([o({type:Boolean})],Y.prototype,`isMobile`,void 0),k([o({type:Number})],Y.prototype,`selectedCount`,void 0),k([o({type:Boolean})],Y.prototype,`allSelectedStarred`,void 0),k([a()],Y.prototype,`scrolled`,void 0),k([h({context:S})],Y.prototype,`i18nStore`,void 0),k([h({context:ai})],Y.prototype,`composeStore`,void 0),k([h({context:C,subscribe:!0})],Y.prototype,`settingsStore`,void 0),k([a()],Y.prototype,`editForm`,void 0),k([a()],Y.prototype,`isDirty`,void 0),k([a()],Y.prototype,`newCategoryName`,void 0),Y=k([p(`alps-contact-view`)],Y);var Ha=e({});v.registerRoute({path:`/contacts/*`,component:`contacts-page`,pluginId:`carddav`}),v.registerNavTab({id:`contacts`,pluginId:`carddav`,labelKey:`navigation.contacts`,icon:`users`,order:10}),v.registerHook(`composer:send`,async({recipients:e})=>{if(!(!e||!Array.isArray(e)))for(let t of e){let e=t,n=``,r=t.match(/^(.*?)\s*<([^>]+)>$/);r&&r[2]?(n=r[1].replace(/^["']|["']$/g,``).trim(),e=r[2]):e=e.trim();try{await I.createContact({name:n,email:e})}catch(e){console.error(`Failed to auto-save contact`,e)}}},`carddav`),v.registerHook(`composer:suggest`,async({query:e})=>{try{return((await I.fetchContacts(e)).contacts||[]).map(e=>({name:e.name||``,address:e.email||``})).filter(e=>e.address)}catch(e){return console.error(`Failed to fetch contact suggestions`,e),[]}},`carddav`);var Ua=class extends d{constructor(...e){super(...e),this.label=``,this.description=``}static{this.styles=g`
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
  `}render(){return n`
      ${this.label?n`<label class="setting-label">${this.label}</label>`:``}
      ${this.description?n`<div class="setting-description">${this.description}</div>`:``}
      <div class="slot-container">
        <slot></slot>
      </div>
    `}};k([o({type:String})],Ua.prototype,`label`,void 0),k([o({type:String})],Ua.prototype,`description`,void 0),Ua=k([p(`alps-setting-group`)],Ua);function Wa(e,t){return new Promise(n=>{let r=document.createElement(`ui-prompt`);r.title=t?.t(`gpg.passphraseRequired`),r.confirmText=t?.t(`gpg.unlock`),r.cancelText=t?.t(`general.cancel`);let i=t?.t(`gpg.passphrasePrompt`);e&&(i+=` (Error: ${e})`),r.fields=[{id:`passphrase`,label:i,type:`password`,placeholder:t?.t(`gpg.passphrase`),autofocus:!0}];let a=()=>{r.parentNode&&r.parentNode.removeChild(r)};r.addEventListener(`submit`,e=>{n(e.detail.passphrase),a()}),r.addEventListener(`cancel`,()=>{n(null),a()}),document.body.appendChild(r)})}var Ga=null;function Ka(){Ga=null;try{sessionStorage.removeItem(`gpg_private_key`)}catch{}}async function qa(e,t){if(Ga)return Ga;let n=await T(`/gpg/keys`);if(!n.ok)throw Error(`Failed to fetch GPG keyring.`);let r=await n.json();if(!r.encrypted_private_key)throw Error(`No private key found on server. Please generate one in Settings.`);let i=await e.readPrivateKey({armoredKey:r.encrypted_private_key});if(i.isDecrypted())return Ga=i,Ga;{let n,r=await Wa(n,t);for(;r!==null;)try{return Ga=await e.decryptKey({privateKey:i,passphrase:r}),Ga}catch(e){n=`Incorrect passphrase: `+e.message,r=await Wa(n,t)}throw Error(`Passphrase prompt cancelled.`)}}async function Ja(e){let{instance:t,formData:n,composer:r}=e;if(!t.encryptGpg)return n;if(n.get(`attachment-uuids`)||n.get(`prev_attachments`)){let e=r?.i18nStore?.t(`gpg.attachmentsNotEncryptable`);return alert(e||`Attachments cannot be encrypted with inline PGP and would be sent unencrypted. Remove the attachments, or turn off encryption to send them.`),!1}try{let e=await x(()=>import(`./openpgp-BXFLORuu.js`).then(e=>e.t),__vite__mapDeps([0,1])),i=t.to||[],a=t.cc||[],o=t.bcc||[],s=[...i,...a,...o];if(s.length===0)return n;let c=[],l=[],u=[],d=Ae();d.loginUsername&&u.push(d.loginUsername);for(let t of s){let n=t.includes(`<`)?t.split(`<`)[1].split(`>`)[0].trim():t.trim();if(u.includes(n))continue;let r=(await I.fetchContacts(n)).contacts||[],i=!1;for(let t of r)if(t.public_key){let n=await e.readKey({armoredKey:t.public_key});c.push(n),i=!0;break}i||l.push(t)}if(l.length>0){let e=r.i18nStore?.t(`gpg.missingPublicKeys`),t=l.join(`
`);return alert(e?e.replace(`{keys}`,t):`Cannot encrypt: Missing public keys for:\n${t}`),!1}let f=await qa(e,r.i18nStore),p=f.toPublic();c.push(p);let m=n.get(`text`)||``,h=n.get(`html`)||``,ee=``;ee=t.format===`html`&&h?h:m;let g=await e.createMessage({text:ee}),te=await e.encrypt({message:g,encryptionKeys:c,signingKeys:f,format:`armored`});return n.set(`text`,te),n.set(`html`,``),n}catch(e){return alert(`GPG Encryption failed: `+e.message),!1}}async function Ya(e){if(typeof e.content==`string`&&e.content.includes(`-----BEGIN PGP MESSAGE-----`))try{let t=await x(()=>import(`./openpgp-BXFLORuu.js`).then(e=>e.t),__vite__mapDeps([0,1])),r=e.content.indexOf(`-----BEGIN PGP MESSAGE-----`),i=e.content.indexOf(`-----END PGP MESSAGE-----`)+25;if(r===-1||i<=r)return e.content;let a=e.content.substring(r,i),o=await qa(t,e.i18nStore),s=await t.readMessage({armoredMessage:a}),{data:c}=await t.decrypt({message:s,decryptionKeys:o,format:`utf8`}),l=String(c);l.includes(`<html`)||l.includes(`<body`)||l.includes(`<p>`)||l.includes(`<div`)||l.includes(`<br`)||(l=l.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/\n/g,`<br/>`));let u=e.content.substring(0,r)+l+e.content.substring(i);return e.banners=e.banners||[],e.banners.push(n`
              <alps-banner variant="info">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex; width: 16px; height: 16px;">${O(`lock`)}</span>
                  <span>${e.i18nStore?.t(`gpg.decryptedSuccess`)}</span>
                </span>
              </alps-banner>
            `),e.isHtml=!0,u}catch(t){return console.error(`Decryption failed:`,t),e.banners=e.banners||[],e.banners.push(n`
              <alps-banner variant="error">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex; width: 16px; height: 16px;">${O(`lock`)}</span>
                  <span>${e.i18nStore?.t(`gpg.decryptedFailed`)}</span>
                </span>
              </alps-banner>
            `),e.content}return e.content}var X=class extends d{constructor(...e){super(...e),this.loading=!0,this.generating=!1,this.importing=!1,this.importError=``,this.keyring=null,this.pubKeyInput=``,this.privKeyInput=``,this.viewState=`default`,this.showPassphrasePrompt=!1,this.passphrasePromptMode=`lock`,this.showPurgeConfirm=!1,this.resolvePassphrase=null,this.resolveError=null}static{this.styles=g`
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
    `}async connectedCallback(){super.connectedCallback(),await this.fetchKeys()}async fetchKeys(){this.loading=!0;try{let e=await T(`/gpg/keys`);if(e.ok){let t=await e.json();t.public_key?this.keyring=t:this.keyring=null}}catch(e){console.error(e)}finally{this.loading=!1}}promptForPassphrase(e=`lock`){return this.passphrasePromptMode=e,this.showPassphrasePrompt=!0,new Promise(e=>{this.resolvePassphrase=e})}showErrorDialog(e){return this.importError=e,new Promise(e=>{this.resolveError=e})}clearError(){this.importError=``,this.resolveError&&=(this.resolveError(),null)}async getConfirmedPassphrase(){for(;;){let e=await this.promptForPassphrase(`lock`);if(!e)return null;let t=await this.promptForPassphrase(`confirm`);if(!t)return null;if(e===t)return e;await this.showErrorDialog(this.i18nStore?.t(`gpg.passphraseMismatch`))}}handlePassphraseSubmit(e){this.resolvePassphrase&&=(this.resolvePassphrase(e),null),this.showPassphrasePrompt=!1}handlePassphraseCancel(){this.resolvePassphrase&&=(this.resolvePassphrase(null),null),this.showPassphrasePrompt=!1}async generateKeys(){let e=await this.getConfirmedPassphrase();if(e){this.generating=!0;try{let{privateKey:t,publicKey:n}=await(await x(()=>import(`./openpgp-BXFLORuu.js`).then(e=>e.t),__vite__mapDeps([0,1]))).generateKey({type:`ecc`,curve:`curve25519`,userIDs:[{name:`ALPS User`,email:``}],passphrase:e});await T(`/gpg/keys`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({public_key:n,encrypted_private_key:t})}),await this.fetchKeys()}catch(e){alert(this.i18nStore?.t(`gpg.generateFailed`,{error:e.message}))}finally{this.generating=!1}}}async importKeys(){if(!this.pubKeyInput||!this.privKeyInput){this.importError=this.i18nStore?.t(`gpg.importMissing`);return}this.importing=!0;let e,t;try{e=await x(()=>import(`./openpgp-BXFLORuu.js`).then(e=>e.t),__vite__mapDeps([0,1])),await e.readKey({armoredKey:this.pubKeyInput}),t=await e.readPrivateKey({armoredKey:this.privKeyInput})}catch(e){this.importing=!1,this.importError=this.i18nStore?.t(`gpg.importFailed`,{error:e.message});return}if(this.importing=!1,!t.isDecrypted()){let n=await this.promptForPassphrase(`unlock`);for(;n!==null;)try{t=await e.decryptKey({privateKey:t,passphrase:n});break}catch{await this.showErrorDialog(this.i18nStore?.t(`gpg.importIncorrectPassphrase`)),n=await this.promptForPassphrase(`unlock`)}if(!t.isDecrypted())return}let n=await this.getConfirmedPassphrase();if(n){this.importing=!0;try{let r=await e.encryptKey({privateKey:t,passphrase:n});await T(`/gpg/keys`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({public_key:this.pubKeyInput,encrypted_private_key:r})}),this.pubKeyInput=``,this.privKeyInput=``,this.viewState=`default`,await this.fetchKeys()}catch(e){this.importError=this.i18nStore?.t(`gpg.importFailed`,{error:e.message})}finally{this.importing=!1}}}async purgeKeys(){this.loading=!0,this.showPurgeConfirm=!1,await T(`/gpg/keys`,{method:`DELETE`}),this.keyring=null,Ka(),this.loading=!1}render(){return this.loading||this.generating?n`<alps-loader full-height .text=${this.generating?`Generating keypair...`:`Loading...`}></alps-loader>`:n`
            ${this.keyring?n`
                <alps-setting-group label="${this.i18nStore?.t(`settings.gpg`)}" description="${this.i18nStore?.t(`gpg.keyStoredSecurely`)}">
                    <div class="key-info">${this.keyring.public_key}</div>

                    <div class="actions">
                        <alps-button variant="danger" @click=${()=>this.showPurgeConfirm=!0}>${this.i18nStore?.t(`gpg.purgeKeys`)}</alps-button>
                    </div>
                </alps-setting-group>
            `:this.viewState===`import`?n`
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
            `:n`
                <alps-setting-group label="${this.i18nStore?.t(`settings.gpg`)}" description="${this.i18nStore?.t(`gpg.enableEncryptionDesc`)}">
                    <div class="empty-state">${this.i18nStore?.t(`gpg.noKeyPresent`)}</div>
                    <div class="actions">
                        <alps-button variant="primary" @click=${this.generateKeys}>${this.i18nStore?.t(`gpg.generateNewKeypair`)}</alps-button>
                        <alps-button variant="normal" @click=${()=>this.viewState=`import`}>${this.i18nStore?.t(`gpg.importExistingKeys`)}</alps-button>
                    </div>
                </alps-setting-group>
            `}

            ${this.showPassphrasePrompt?n`
                <ui-prompt
                    title="${this.passphrasePromptMode===`unlock`?this.i18nStore?.t(`gpg.passphraseRequired`):this.passphrasePromptMode===`confirm`?this.i18nStore?.t(`gpg.passphraseConfirmTitle`):this.i18nStore?.t(`gpg.passphraseSetTitle`)}"
                    confirmText="${this.passphrasePromptMode===`unlock`?this.i18nStore?.t(`gpg.unlock`):this.passphrasePromptMode===`confirm`?this.i18nStore?.t(`gpg.confirm`):this.i18nStore?.t(`gpg.lock`)}"
                    cancelText="${this.i18nStore?.t(`general.cancel`)}"
                    .fields=${[{id:`passphrase`,label:this.passphrasePromptMode===`unlock`?this.i18nStore?.t(`gpg.passphrasePrompt`):this.passphrasePromptMode===`confirm`?this.i18nStore?.t(`gpg.passphraseConfirmPrompt`):this.i18nStore?.t(`gpg.passphraseLockPrompt`),type:`password`,placeholder:this.i18nStore?.t(`gpg.passphrase`),autofocus:!0}]}
                    @submit=${e=>this.handlePassphraseSubmit(e.detail.passphrase)}
                    @cancel=${this.handlePassphraseCancel}
                ></ui-prompt>
            `:``}
            ${this.importError?n`
                <ui-modal title="${this.i18nStore?.t(`gpg.importFailedTitle`)}" @cancel=${this.clearError}>
                    <div style="padding: 16px; white-space: pre-wrap; font-family: monospace; font-size: 13px;">${this.importError}</div>
                    <alps-button slot="actions" @click=${this.clearError}>OK</alps-button>
                </ui-modal>
            `:``}

            ${this.showPurgeConfirm?n`
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
        `}};k([h({context:S,subscribe:!0})],X.prototype,`i18nStore`,void 0),k([a()],X.prototype,`loading`,void 0),k([a()],X.prototype,`generating`,void 0),k([a()],X.prototype,`importing`,void 0),k([a()],X.prototype,`importError`,void 0),k([a()],X.prototype,`keyring`,void 0),k([a()],X.prototype,`pubKeyInput`,void 0),k([a()],X.prototype,`privKeyInput`,void 0),k([a()],X.prototype,`viewState`,void 0),k([a()],X.prototype,`showPassphrasePrompt`,void 0),k([a()],X.prototype,`passphrasePromptMode`,void 0),k([a()],X.prototype,`showPurgeConfirm`,void 0),X=k([p(`alps-gpg-settings`)],X);var Xa=e({});v.registerSettingsTab({id:`gpg`,labelKey:`settings.gpg`,icon:`key`,component:`alps-gpg-settings`}),v.registerHook(`composer:toolbar`,e=>{let t=e.instance,r=e.composer,i=t.encryptGpg||!1;return n`
        <alps-icon-btn 
            title="${r.i18nStore?.t(`gpg.toggleEncryption`)}" 
            icon="lock"
            ?active=${i}
            @click=${()=>{r.composeStore.updateComposer(t.id,{encryptGpg:!i})}}>
        </alps-icon-btn>
    `},`gpg`),v.registerHook(`composer:presend`,Ja,`gpg`),v.registerHook(`reader:content`,Ya,`gpg`);function Za(e){return`"`+String(e??``).replace(/[\u0000-\u001f\u007f]/g,``).replace(/\\/g,`\\\\`).replace(/"/g,`\\"`)+`"`}function Qa(e){let t=new TextEncoder().encode(JSON.stringify(e)),n=``;for(let e of t)n+=String.fromCharCode(e);return btoa(n)}function $a(e){let t=atob(e),n=Uint8Array.from(t,e=>e.charCodeAt(0));try{return new TextDecoder(`utf-8`,{fatal:!0}).decode(n)}catch{return t}}var eo=class{static extractVisualState(e){let t=e.match(/^# ALPS_VISUAL_STATE: (.*)$/m);if(!t)return null;try{return JSON.parse($a(t[1]))}catch{return null}}static compile(e){if(e.rules.length===0)return``;let t=new Set;for(let n of e.rules){for(let e of n.actions)e.type===`fileinto`&&(t.add(`fileinto`),t.add(`mailbox`));for(let e of n.conditions)e.field.toLowerCase()===`body`&&t.add(`body`)}let n=``;t.size>0&&(n+=`require [${Array.from(t).map(e=>`"${e}"`).join(`, `)}];\n\n`),n+=`# ALPS_VISUAL_STATE: ${Qa(e)}\n\n`;for(let t of e.rules){if(t.conditions.length===0||t.actions.length===0)continue;let e=t.conditions.map(e=>this.compileCondition(e)),r=``;r=e.length===1?`if ${e[0]}`:t.matchType===`all`?`if allof (${e.join(`, `)})`:`if anyof (${e.join(`, `)})`,n+=`${r} {\n`;for(let e of t.actions)n+=`  ${this.compileAction(e)}\n`;n+=`}

`}return n}static compileCondition(e){let t=e.field.toLowerCase();if(t===`size`){let t=String(e.value??``).trim();return/^\d+[KMG]?$/i.test(t)?`size :${e.operator} ${t}`:`size :${e.operator} 0`}if(t===`body`)return`${e.operator===`not_contains`||e.operator===`not_is`?`not `:``}body :text ${e.operator===`is`||e.operator===`not_is`?`:is`:`:contains`} ${Za(e.value)}`;let n=``,r=``;return e.operator===`contains`?(n=``,r=`:contains`):e.operator===`not_contains`?(n=`not `,r=`:contains`):e.operator===`is`?(n=``,r=`:is`):e.operator===`not_is`&&(n=`not `,r=`:is`),`${n}header ${r} ${Za(e.field)} ${Za(e.value)}`}static compileAction(e){switch(e.type){case`fileinto`:return`fileinto :create ${Za(e.value??``)};`;case`discard`:return`discard;`;case`redirect`:return`redirect ${Za(e.value??``)};`;case`stop`:return`stop;`}return``}},to=new class{async fetchScript(){let e=await T(`/managesieve/script`);if(!e.ok)throw Error(`Failed to fetch script: ${e.statusText}`);return e.json()}async saveScript(e,t=`PUT`){let n=await T(`/managesieve/script`,{method:t,headers:{"Content-Type":`application/json`},body:JSON.stringify({content:e})});if(!n.ok){let e=await n.json().catch(()=>({}));throw Error(e.error||`Failed to save script`)}return n.json()}async validateScript(e){let t=await T(`/managesieve/validate`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({content:e})});if(!t.ok){let e=await t.json().catch(()=>({}));throw Error(e.error||`Validation failed`)}return t.json()}async fetchFolders(){let e=await T(`/mailboxes/INBOX`);if(!e.ok)throw Error(`Failed to fetch mailboxes: ${e.statusText}`);return e.json()}},no=class extends d{constructor(...e){super(...e),this.isDirty=!1,this.script=``,this.stored=``,this.isValidating=!1,this.isSaving=!1}static{this.styles=g`
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
	`}willUpdate(e){(e.has(`script`)||e.has(`stored`))&&(this.isDirty=this.script!==this.stored)}highlight(e){if(!e)return``;let t=e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`);return t=t.replace(/(#.*|\/\*[\s\S]*?\*\/)|("[^"\\]*(?:\\.[^"\\]*)*")|\b(require|if|else|elsif|stop|fileinto|keep|discard|redirect)\b|\b(anyof|allof|not|contains|is|matches|over|under)\b/gi,(e,t,n,r,i)=>t?`<span class="sieve-comment">${t}</span>`:n?`<span class="sieve-string">${n}</span>`:r?`<span class="sieve-keyword">${r}</span>`:i?`<span class="sieve-operator">${i}</span>`:e),t.endsWith(`
`)&&(t+=` `),m(t)}handleScroll(e){let t=e.target,n=this.shadowRoot?.querySelector(`.highlight-layer`);n&&(n.scrollTop=t.scrollTop,n.scrollLeft=t.scrollLeft)}handleInput(e){let t=e.target;this.script=t.value,this.dispatchEvent(new CustomEvent(`script-changed`,{detail:{script:this.script}}))}async validate(){this.isValidating=!0;let e=this.script;try{if(await to.validateScript(e),this.script!==e)return;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore.t(`managesieve.toast.valid`),timeout:3e3}}))}catch(t){if(this.script!==e)return;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:t.message||this.i18nStore.t(`managesieve.toast.networkError`),timeout:5e3,type:`error`}}))}finally{this.isValidating=!1}}async save(){this.isSaving=!0;let e=this.script;try{await to.saveScript(e,`PUT`),this.stored=e,this.dispatchEvent(new CustomEvent(`script-saved`,{detail:{script:e}}));let t=e.trim()===``?`managesieve.toast.deactivated`:`managesieve.toast.saved`;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore.t(t),timeout:3e3}}))}catch(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore.t(`managesieve.toast.networkError`),timeout:5e3,type:`error`}}))}finally{this.isSaving=!1}}render(){return n`
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
		`}};k([a()],no.prototype,`isDirty`,void 0),k([h({context:S})],no.prototype,`i18nStore`,void 0),k([o({type:String})],no.prototype,`script`,void 0),k([o({type:String})],no.prototype,`stored`,void 0),k([a()],no.prototype,`isValidating`,void 0),k([a()],no.prototype,`isSaving`,void 0),no=k([p(`alps-raw-editor`)],no);var ro=class extends d{constructor(...e){super(...e),this.isSaving=!1,this.initialSnapshot=``,this.state={rules:[]},this.folders=[]}willUpdate(e){e.has(`state`)&&this.initialSnapshot===``&&(this.initialSnapshot=JSON.stringify(this.state))}get isDirty(){return this.initialSnapshot!==``&&this.initialSnapshot!==JSON.stringify(this.state)}markClean(e=JSON.stringify(this.state)){this.initialSnapshot=e,this.requestUpdate()}static{this.styles=g`
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
	`}addRule(){this.state={...this.state,rules:[...this.state.rules,{id:Math.random().toString(36).substring(7),matchType:`all`,conditions:[{field:`Subject`,operator:`contains`,value:``}],actions:[{type:`fileinto`,value:this.folders[0]||`INBOX`}]}]},this.notifyChange()}deleteRule(e){let t=[...this.state.rules];t.splice(e,1),this.state={...this.state,rules:t},this.notifyChange()}updateRule(e,t){let n=[...this.state.rules];n[e]={...n[e],...t},this.state={...this.state,rules:n},this.notifyChange()}addCondition(e,t){let n=this.state.rules[e],r={field:`Subject`,operator:`contains`,value:``},i=[...n.conditions];t===void 0?i.push(r):i.splice(t,0,r),this.updateRule(e,{conditions:i})}deleteCondition(e,t){let n=[...this.state.rules[e].conditions];n.splice(t,1),this.updateRule(e,{conditions:n})}updateCondition(e,t,n){let r=[...this.state.rules[e].conditions],i=r[t];n.field&&n.field!==i.field&&(n.field===`Size`?i.operator!==`over`&&i.operator!==`under`&&(n.operator=`over`):(i.operator===`over`||i.operator===`under`)&&(n.operator=`contains`)),r[t]={...i,...n},this.updateRule(e,{conditions:r})}addAction(e,t){let n=this.state.rules[e],r={type:`fileinto`,value:this.folders[0]||`INBOX`},i=[...n.actions];t===void 0?i.push(r):i.splice(t,0,r),this.updateRule(e,{actions:i})}deleteAction(e,t){let n=[...this.state.rules[e].actions];n.splice(t,1),this.updateRule(e,{actions:n})}updateAction(e,t,n){let r=[...this.state.rules[e].actions];r[t]={...r[t],...n},this.updateRule(e,{actions:r})}notifyChange(){this.dispatchEvent(new CustomEvent(`state-changed`,{detail:{state:this.state}}))}save(){this.dispatchEvent(new CustomEvent(`save-requested`))}render(){return n`
			<div class="editor-container">
				${this.state.rules.length===0?n`
					<div class="empty-state">${this.i18nStore.t(`managesieve.visual.noRules`)}</div>
				`:this.state.rules.map((e,t)=>n`
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
						

						${e.conditions.map((r,i)=>n`
							<div class="condition-row">
								<div class="row-label"></div>
								<alps-select 
									.value=${r.field}
									.options=${[{value:`Subject`,label:this.i18nStore.t(`managesieve.visual.fields.subject`)},{value:`From`,label:this.i18nStore.t(`managesieve.visual.fields.from`)},{value:`To`,label:this.i18nStore.t(`managesieve.visual.fields.to`)},{value:`Body`,label:this.i18nStore.t(`managesieve.visual.fields.body`)},{value:`Size`,label:this.i18nStore.t(`managesieve.visual.fields.size`)}]}
									@change=${e=>this.updateCondition(t,i,{field:e.target.value})}>
								</alps-select>
								<alps-select 
									.value=${r.operator}
									.options=${r.field===`Size`?[{value:`over`,label:this.i18nStore.t(`managesieve.visual.operators.over`)},{value:`under`,label:this.i18nStore.t(`managesieve.visual.operators.under`)}]:[{value:`contains`,label:this.i18nStore.t(`managesieve.visual.operators.contains`)},{value:`not_contains`,label:this.i18nStore.t(`managesieve.visual.operators.not_contains`)},{value:`is`,label:this.i18nStore.t(`managesieve.visual.operators.is`)},{value:`not_is`,label:this.i18nStore.t(`managesieve.visual.operators.not_is`)}]}
									@change=${e=>this.updateCondition(t,i,{operator:e.target.value})}>
								</alps-select>
								<alps-input class="flex-1" .value=${r.value} @input=${e=>this.updateCondition(t,i,{value:e.target.value})}></alps-input>
								${e.conditions.length>1?n`<alps-icon-btn icon="minus-square" title=${this.i18nStore.t(`managesieve.visual.remove`)} @click=${()=>this.deleteCondition(t,i)}></alps-icon-btn>`:``}
								<alps-icon-btn icon="plus-square" title=${this.i18nStore.t(`managesieve.visual.add`)} @click=${()=>this.addCondition(t,i+1)}></alps-icon-btn>
							</div>
						`)}

						<div class="connector">
							<svg width="24" height="24" class="connector-icon"><use href="/assets/icons/sprite.svg?v=10#arrow-fat-lines-down"></use></svg>
						</div>

						${e.actions.map((r,i)=>n`
							<div class="action-row">
								<div class="row-label">
									${i===0?this.i18nStore.t(`managesieve.visual.then`):``}
								</div>
								<alps-select 
									.value=${r.type}
									.options=${[{value:`fileinto`,label:this.i18nStore.t(`managesieve.visual.actions.fileinto`)},{value:`redirect`,label:this.i18nStore.t(`managesieve.visual.actions.redirect`)},{value:`discard`,label:this.i18nStore.t(`managesieve.visual.actions.discard`)},{value:`stop`,label:this.i18nStore.t(`managesieve.visual.actions.stop`)}]}
									@change=${e=>this.updateAction(t,i,{type:e.target.value,value:``})}>
								</alps-select>
								${r.type===`fileinto`?n`
									<alps-select 
										class="flex-1" 
										.value=${r.value||``}
										.options=${[...this.folders.map(e=>({value:e,label:e}))]}
										@change=${e=>this.updateAction(t,i,{value:e.target.value})}>
									</alps-select>
								`:r.type===`redirect`?n`
									<alps-input type="email" class="flex-1" placeholder=${this.i18nStore.t(`managesieve.visual.fields.emailAddress`)} .value=${r.value||``} @input=${e=>this.updateAction(t,i,{value:e.target.value})}></alps-input>
								`:``}
								${e.actions.length>1?n`<alps-icon-btn icon="minus-square" title=${this.i18nStore.t(`managesieve.visual.remove`)} @click=${()=>this.deleteAction(t,i)}></alps-icon-btn>`:``}
								${r.type===`stop`?``:n`<alps-icon-btn icon="plus-square" title=${this.i18nStore.t(`managesieve.visual.add`)} @click=${()=>this.addAction(t,i+1)}></alps-icon-btn>`}
							</div>
						`)}

					</div>
				`)}
				
				<div class="actions-container" >
					<alps-button variant="normal" @click=${this.addRule}>${this.i18nStore.t(`managesieve.visual.newRule`)}</alps-button>
					${this.state.rules.length>0?n`<alps-button variant="text" @click=${()=>this.dispatchEvent(new CustomEvent(`switch-raw-requested`))}>${this.i18nStore.t(`managesieve.tabs.switchToRaw`)}</alps-button>`:``}
					<div class="flex-1"></div>
					${this.isDirty?n`<alps-button variant="primary" ?spinning=${this.isSaving} ?disabled=${this.isSaving} @click=${this.save}>${this.i18nStore.t(`managesieve.visual.saveFilters`)}</alps-button>`:``}
				</div>
			</div>
		`}};k([o({type:Boolean})],ro.prototype,`isSaving`,void 0),k([a()],ro.prototype,`initialSnapshot`,void 0),k([h({context:S,subscribe:!0})],ro.prototype,`i18nStore`,void 0),k([o({type:Object})],ro.prototype,`state`,void 0),k([o({type:Array})],ro.prototype,`folders`,void 0),ro=k([p(`alps-visual-editor`)],ro);var io=class extends d{constructor(...e){super(...e),this.mode=`visual`,this.script=``,this.storedScript=``,this.visualState={rules:[]},this.folders=[],this.isLoading=!0,this.isSaving=!1,this.showSwitchRawConfirm=!1}static{this.styles=g`
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
	`}connectedCallback(){super.connectedCallback(),this.fetchScript(),this.fetchFolders()}async fetchScript(){try{let e=await to.fetchScript();if(this.script=e.content||``,this.storedScript=this.script,this.script.trim()===``)this.mode=`visual`,this.visualState={rules:[]};else{let e=eo.extractVisualState(this.script);e?(this.visualState=e,this.mode=`visual`):this.mode=`raw`}}catch(e){console.error(`Failed to fetch Sieve script`,e),this.visualState={rules:[]},this.mode=`visual`}finally{this.isLoading=!1}}async fetchFolders(){try{let e=await to.fetchFolders();e&&e.Mailboxes&&(this.folders=e.Mailboxes.map(e=>e.Name||e.Mailbox).filter(Boolean))}catch(e){console.error(`Failed to fetch folders`,e)}}handleVisualStateChange(e){this.visualState=e.detail.state}handleRawScriptChange(e){this.script=e.detail.script}switchToRaw(){this.showSwitchRawConfirm=!0}confirmSwitchToRaw(){this.script=eo.compile(this.visualState),this.mode=`raw`,this.showSwitchRawConfirm=!1}async saveVisual(){this.isSaving=!0;try{let e=eo.compile(this.visualState);this.script=e;let t=JSON.stringify(this.visualState);await to.saveScript(e,`PUT`),this.storedScript=e;let n=e.trim()===``?`managesieve.toast.deactivated`:`managesieve.toast.saved`;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore.t(n),timeout:3e3}}));let r=this.shadowRoot?.querySelector(`alps-visual-editor`);r&&r.markClean&&r.markClean(t)}catch(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore.t(`managesieve.toast.networkError`),timeout:5e3,type:`error`}}))}finally{this.isSaving=!1}}render(){return n`
			<div class="container">
				<alps-setting-group label="${this.i18nStore.t(`managesieve.title`)}" description="${this.i18nStore.t(`managesieve.description`)}">
					${this.isLoading?n`
						<div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
							<alps-loader></alps-loader>
						</div>
					`:this.mode===`visual`?n`
						<alps-visual-editor 
							.isSaving=${this.isSaving} 
							.state=${this.visualState} 
							.folders=${this.folders}
							@state-changed=${this.handleVisualStateChange}
							@save-requested=${this.saveVisual}
							@switch-raw-requested=${this.switchToRaw}
						></alps-visual-editor>
					`:n`
						<alps-raw-editor 
							.script=${this.script}
							.stored=${this.storedScript}
							@script-changed=${this.handleRawScriptChange}
							@script-saved=${e=>{this.storedScript=e.detail.script}}
						></alps-raw-editor>
					`}
				</alps-setting-group>
			</div>

			${this.showSwitchRawConfirm?n`
				<ui-confirm
					title=${this.i18nStore.t(`managesieve.warningRawSwitchTitle`)}
					message="${this.i18nStore.t(`managesieve.warningRawSwitch`)}"
					confirmText=${this.i18nStore.t(`managesieve.warningRawSwitchConfirm`)}
					isDanger=${!0}
					@confirm=${this.confirmSwitchToRaw}
					@cancel=${()=>this.showSwitchRawConfirm=!1}
				></ui-confirm>
			`:``}
		`}};k([h({context:S,subscribe:!0})],io.prototype,`i18nStore`,void 0),k([a()],io.prototype,`mode`,void 0),k([a()],io.prototype,`script`,void 0),k([a()],io.prototype,`storedScript`,void 0),k([a()],io.prototype,`visualState`,void 0),k([a()],io.prototype,`folders`,void 0),k([a()],io.prototype,`isLoading`,void 0),k([a()],io.prototype,`isSaving`,void 0),k([a()],io.prototype,`showSwitchRawConfirm`,void 0),io=k([p(`alps-managesieve-page`)],io);var ao=e({});v.registerSettingsTab({id:`managesieve`,labelKey:`settings.categories.filters`,icon:`sieve`,component:`alps-managesieve-page`});var oo=class extends d{constructor(...e){super(...e),this.passwordForm={old:``,new:``,confirm:``},this.isSubmitting=!1}static{this.styles=g`
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
	`}handlePasswordFormChange(e,t){let n=e.target;this.passwordForm={...this.passwordForm,[t]:n.value}}async submitPasswordChange(){if(!this.passwordForm.old||!this.passwordForm.new||!this.passwordForm.confirm){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`settings.password.fillAllFields`),timeout:3e3}}));return}if(this.passwordForm.new!==this.passwordForm.confirm){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`settings.password.passwordMismatch`),timeout:3e3}}));return}this.isSubmitting=!0;try{let e=await T(`/password/change`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({old_password:this.passwordForm.old,password:this.passwordForm.new})}),t=await e.json();e.ok?(window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:t.message||`Password successfully changed.`,timeout:3e3}})),this.passwordForm={old:``,new:``,confirm:``}):window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:t.error||`Failed to change password.`,timeout:3e3}}))}catch{window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`login.networkError`),timeout:3e3}}))}finally{this.isSubmitting=!1}}render(){return n`
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
	`}};k([h({context:S})],oo.prototype,`i18nStore`,void 0),k([a()],oo.prototype,`passwordForm`,void 0),k([a()],oo.prototype,`isSubmitting`,void 0),oo=k([p(`alps-password-settings`)],oo);var so=e({});v.registerSettingsTab({id:`password`,labelKey:`settings.categories.password`,icon:`password`,component:`alps-password-settings`});var co=class{get currentPath(){return this.getHashPath()}constructor(e,t,n){this.routes=e,this.fallback=t,window.addEventListener(`hashchange`,()=>n())}getHashPath(){let e=window.location.hash;return!e||e===`#`?`/`:e.substring(1).split(`?`)[0]}navigate(e){window.location.hash=e}render(){if(this.routes[this.currentPath])return this.routes[this.currentPath]();for(let e in this.routes)if(e.endsWith(`/*`)&&this.currentPath.startsWith(e.replace(`/*`,``)))return this.routes[e]();return this.fallback()}},lo=class extends d{constructor(...e){super(...e),this.icon=``,this.title=``,this.subtitle=``}static{this.styles=g`
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

    @media (max-width: 640px) {
      :host {
        background: var(--bg-primary, #ffffff);
      }
      
      .card {
        border: none;
        box-shadow: none;
      }
    }
  `}render(){return n`
      <div class="card">
        ${this.icon?n`
          <div class="logo-container">
            ${O(this.icon)}
          </div>
        `:``}
        ${this.title?n`<h1>${this.title}</h1>`:``}
        ${this.subtitle?n`<p class="subtitle">${this.subtitle}</p>`:``}
        
        <slot></slot>
      </div>
    `}};k([o({type:String})],lo.prototype,`icon`,void 0),k([o({type:String})],lo.prototype,`title`,void 0),k([o({type:String})],lo.prototype,`subtitle`,void 0),lo=k([p(`alps-auth-card`)],lo);var uo=class extends d{constructor(...e){super(...e),this.notice=null,this.username=``,this.password=``,this.rememberMe=!1,this.error=``,this.isSubmitting=!1,this.retryAfter=0,this.isRateLimited=!1,this._handleI18nChange=()=>{this.requestUpdate()}}static{this.styles=g`
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

    .notice-container {
      border-radius: var(--radius-md, 6px);
      padding: 8px 12px;
      margin-bottom: 24px;
      background: var(--bg-tertiary, rgba(0, 0, 0, 0.04));
      border: 1px solid var(--border-color, #e5e7eb);
    }

    .notice-text {
      color: var(--text-secondary, #4b5563);
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
  `}connectedCallback(){super.connectedCallback(),this.notice=ci(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),this.composeStore&&this.composeStore.clearAllComposers()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),this.retryCountdownInterval&&clearInterval(this.retryCountdownInterval)}firstUpdated(){this.renderRoot.querySelector(`#username`)?.focus()}startRetryCountdown(e){this.retryAfter=e,this.isRateLimited=!0,this.retryCountdownInterval&&clearInterval(this.retryCountdownInterval),this.retryCountdownInterval=setInterval(()=>{this.retryAfter--,this.retryAfter<=0&&(this.isRateLimited=!1,this.retryCountdownInterval&&=(clearInterval(this.retryCountdownInterval),void 0))},1e3)}formatRetryTime(e){if(e<60)return`${e} second${e===1?``:`s`}`;let t=Math.ceil(e/60);return`${t} minute${t===1?``:`s`}`}async handleSubmit(e){if(e.preventDefault(),this.isSubmitting)return;let t=this.shadowRoot?.querySelector(`form`);if(t&&!t.checkValidity()){t.reportValidity();return}this.error=``,this.isSubmitting=!0;try{await new Promise(e=>setTimeout(e,600));let e={username:this.username,password:this.password,"remember-me":this.rememberMe?`on`:``},t=await fetch(`/session`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)}),n={};try{n=await t.json()??{}}catch{n={}}if(t.ok)n.requires_2fa?(window.location.hash=`/login/webauthn`,this.isSubmitting=!1):(window.dispatchEvent(new CustomEvent(`user-logged-in`,{detail:{username:this.username}})),window.location.hash=`/mailbox/INBOX`);else{if(t.status===429){this.error=n.error||this.i18nStore?.t(`login.tooManyAttempts`);let e=Number(n.retry_after)||Number(t.headers.get(`Retry-After`))||60;this.startRetryCountdown(e)}else this.error=n.error||this.i18nStore?.t(`login.loginFailed`),this.isRateLimited=!1;this.isSubmitting=!1}}catch{this.error=this.i18nStore?.t(`login.networkError`),this.isSubmitting=!1,this.isRateLimited=!1}}render(){return n`
      <alps-auth-card 
        icon="edelweiss" 
        title="Alps" 
        subtitle="${this.i18nStore?.t(`login.subtitle`)}">

        ${this.notice&&!this.error?n`
          <div class="notice-container">
            <p class="notice-text">${this.i18nStore?.t(`login.${this.notice}`)}</p>
          </div>
        `:``}

        ${this.error?n`
          <div class="error-container">
            <p class="error-text">
              ${this.error}
              ${this.isRateLimited&&this.retryAfter>0?n`
                <br><strong>${this.i18nStore?.t(`login.pleaseWait`)} ${this.formatRetryTime(this.retryAfter)}</strong>
              `:``}
            </p>
          </div>
        `:``}

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <div class="input-wrapper has-left-icon">
              <span class="icon-left">${O(`at`)}</span>
              <input 
                type="text" 
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
              <span class="icon-left">${O(`key`)}</span>
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
            ${this.isSubmitting?n`<alps-loader style="--loader-size: 16px;"></alps-loader>`:``}
            <span>${this.isRateLimited?`${this.i18nStore?.t(`login.wait`)} ${this.formatRetryTime(this.retryAfter)}`:this.i18nStore?.t(`login.signIn`)}</span>
          </button>
        </form>
      </alps-auth-card>
    `}};k([h({context:S})],uo.prototype,`i18nStore`,void 0),k([a()],uo.prototype,`notice`,void 0),k([a()],uo.prototype,`username`,void 0),k([a()],uo.prototype,`password`,void 0),k([a()],uo.prototype,`rememberMe`,void 0),k([a()],uo.prototype,`error`,void 0),k([a()],uo.prototype,`isSubmitting`,void 0),k([a()],uo.prototype,`retryAfter`,void 0),k([a()],uo.prototype,`isRateLimited`,void 0),k([h({context:ai,subscribe:!0})],uo.prototype,`composeStore`,void 0),uo=k([p(`login-page`)],uo);var fo=class extends d{constructor(...e){super(...e),this.active=!1,this.icon=``}static{this.styles=g`
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
  `}render(){return n`
      ${this.icon?n`
        <span class="category-icon">${O(this.icon)}</span>
      `:``}
      <span class="label"><slot></slot></span>
    `}};k([o({type:Boolean,reflect:!0})],fo.prototype,`active`,void 0),k([o({type:String})],fo.prototype,`icon`,void 0),fo=k([p(`alps-category-item`)],fo);var po=class extends d{constructor(...e){super(...e),this.newUsername=``,this.newPassword=``,this.newDisplayName=``,this.isSubmitting=!1,this.error=``,this.showAddForm=!1,this._handleStoreChange=()=>{this.requestUpdate()}}static{this.styles=g`
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
    `}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore&&!this.linkedAccountsStore.isInitialized()&&this.linkedAccountsStore.fetchAccounts()})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.removeEventListener(`change`,this._handleStoreChange)}async handleAdd(e){if(e.preventDefault(),!(!this.newUsername||!this.newPassword)){this.isSubmitting=!0,this.error=``;try{await this.linkedAccountsStore.addAccount(this.newUsername,this.newPassword,this.newDisplayName),this.newUsername=``,this.newPassword=``,this.newDisplayName=``,this.showAddForm=!1,window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`linkedAccounts.addedSuccess`)}}))}catch(e){this.error=e.message||this.i18nStore?.t(`linkedAccounts.addError`)}finally{this.isSubmitting=!1}}}async handleRemove(e){if(confirm(this.i18nStore?.t(`linkedAccounts.removeConfirm`)))try{await this.linkedAccountsStore.removeAccount(e),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`linkedAccounts.removedSuccess`)}}))}catch(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore?.t(`linkedAccounts.removeError`)}}))}}render(){let e=this.linkedAccountsStore?.getAccounts()||[],t=this.linkedAccountsStore?.isLoading();return n`
            <alps-setting-group 
                label="${this.i18nStore?.t(`settings.categories.accounts`)}"
                description="${this.i18nStore?.t(`settings.categories.accountsDesc`)}">
                
                <div class="account-list">
                    ${t&&!this.linkedAccountsStore.isInitialized()?n`<div>${this.i18nStore?.t(`settings.loading`)}</div>`:e.length===0?n`<div class="empty-state">${this.i18nStore?.t(`linkedAccounts.noAccounts`)}</div>`:e.map(e=>n`
                        <div class="setting-row">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <alps-avatar .name=${e.display_name||e.username} .size=${24}></alps-avatar>
                                <div style="display: flex; flex-direction: column; gap: 2px;">
                                    <strong>${e.display_name||e.username}</strong>
                                    ${e.display_name?n`<div style="font-size: 13px; color: var(--text-secondary);">${e.username}</div>`:``}
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 16px;">
                                ${e.added_at&&new Date(e.added_at).getFullYear()>1970?n`
                                    <div style="font-size: 13px; color: var(--text-muted);">
                                        ${this.i18nStore?.t(`webauthn.settings.added`)} ${new Date(e.added_at).toLocaleString()}
                                    </div>
                                `:``}
                                <alps-icon-btn icon="trash" @click=${()=>this.handleRemove(e.username)} title="${this.i18nStore?.t(`linkedAccounts.remove`)}"></alps-icon-btn>
                            </div>
                        </div>
                    `)}
                </div>

                ${this.showAddForm?``:n`
                    <alps-button variant="normal" @click=${()=>this.showAddForm=!0}>
                        ${this.i18nStore?.t(`linkedAccounts.addTitle`)}
                    </alps-button>
                `}
            </alps-setting-group>

            ${this.showAddForm?n`
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

                    ${this.error?n`<div class="error-message">${this.error}</div>`:``}

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
        `}};k([h({context:S})],po.prototype,`i18nStore`,void 0),k([h({context:ui})],po.prototype,`linkedAccountsStore`,void 0),k([a()],po.prototype,`newUsername`,void 0),k([a()],po.prototype,`newPassword`,void 0),k([a()],po.prototype,`newDisplayName`,void 0),k([a()],po.prototype,`isSubmitting`,void 0),k([a()],po.prototype,`error`,void 0),k([a()],po.prototype,`showAddForm`,void 0),po=k([p(`settings-accounts`)],po);function mo(e){if(!e)throw Error(`base64url is null or undefined`);let t=e.replace(/-/g,`+`).replace(/_/g,`/`),n=atob(t),r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);return r.buffer}function ho(e){let t=new Uint8Array(e),n=``;for(let e=0;e<t.byteLength;e++)n+=String.fromCharCode(t[e]);return btoa(n).replace(/\+/g,`-`).replace(/\//g,`_`).replace(/=/g,``)}async function go(e){e.publicKey.challenge=mo(e.publicKey.challenge),e.publicKey.user.id=mo(e.publicKey.user.id),e.publicKey.excludeCredentials&&(e.publicKey.excludeCredentials=e.publicKey.excludeCredentials.map(e=>({...e,id:mo(e.id)})));let t=await navigator.credentials.create(e);if(!t)throw Error(`Credential creation failed or was cancelled.`);let n=t.response,r=n.getTransports?n.getTransports():[];return{id:t.id,rawId:ho(t.rawId),type:t.type,response:{attestationObject:ho(n.attestationObject),clientDataJSON:ho(n.clientDataJSON)},transports:r}}async function _o(e){e.publicKey.challenge=mo(e.publicKey.challenge),e.publicKey.allowCredentials&&(e.publicKey.allowCredentials=e.publicKey.allowCredentials.map(e=>({...e,id:mo(e.id)})));let t=await navigator.credentials.get(e);if(!t)throw Error(`Assertion failed or was cancelled.`);let n=t.response;return{id:t.id,rawId:ho(t.rawId),type:t.type,response:{authenticatorData:ho(n.authenticatorData),clientDataJSON:ho(n.clientDataJSON),signature:ho(n.signature),userHandle:n.userHandle?ho(n.userHandle):null}}}function vo(){return window.PublicKeyCredential!==void 0&&navigator.credentials!==void 0}var yo=class extends d{constructor(...e){super(...e),this.data=null,this.error=``,this.loading=!0,this.adding=!1,this.showNamePrompt=!1,this.pendingCredential=null,this.pendingDeleteId=null}static{this.styles=g`
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
        .alert { padding: 12px; border-radius: 6px; background: rgba(220, 38, 38, 0.1); color: var(--error, #ef4444); margin-bottom: 12px; }
        .empty-state {
            color: var(--text-muted);
            font-style: italic;
            padding: 16px 0;
            text-align: left;
        }
    `}connectedCallback(){super.connectedCallback(),this.fetchData()}async fetchData(){try{this.loading=!0;let e=await fetch(`/settings/2fa`);if(!e.ok)throw Error(`Failed to fetch settings`);this.data=await e.json()}catch(e){this.error=e.message}finally{this.loading=!1}}async handleTrustToggle(e){let t=e.target;await fetch(`/settings/2fa/trust-linked-accounts`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({trust:t.checked})}),this.fetchData()}async addCredential(){this.adding=!0,this.error=``;try{let e=await fetch(`/settings/2fa/begin`,{method:`POST`});if(!e.ok)throw Error(await e.text());let t=await go(await e.json());this.pendingCredential=t,this.showNamePrompt=!0,this.adding=!1}catch(e){e.name===`NotAllowedError`||e.message&&e.message.includes(`not allowed`)?this.error=``:this.error=this.i18nStore?.t(`webauthn.errors.register_failed`)||`There was an error registering your security key. Please try again.`,this.adding=!1}}async _handlePromptSubmit(e){let t=e.detail.keyName||`Security Key`;this.showNamePrompt=!1;let n={...this.pendingCredential,name:t};this.adding=!0,this.error=``;try{let e=await fetch(`/settings/2fa/finish`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(n)});if(!e.ok)throw Error(await e.text());this.fetchData()}catch{this.error=this.i18nStore?.t(`webauthn.errors.register_failed`)||`There was an error registering your security key. Please try again.`}finally{this.adding=!1,this.pendingCredential=null}}_handlePromptCancel(){this.showNamePrompt=!1,this.pendingCredential=null}removeCredential(e){this.pendingDeleteId=e}async executeRemoveCredential(){if(!this.pendingDeleteId)return;let e=this.pendingDeleteId;this.pendingDeleteId=null;try{this.error=``;let t=await fetch(`/settings/2fa/credential/${encodeURIComponent(e)}/delete`,{method:`POST`});if(!t.ok)throw Error(await t.text());this.fetchData()}catch(e){this.error=e.message||this.i18nStore?.t(`webauthn.errors.remove_failed`)}}render(){return this.loading?n`<div>${this.i18nStore?.t(`settings.loading`)}</div>`:n`
            ${this.showNamePrompt?n`
                <ui-prompt 
                    title=${this.i18nStore?.t(`webauthn.name_key_title`)}
                    confirmText=${this.i18nStore?.t(`general.save`)}
                    cancelText=${this.i18nStore?.t(`general.cancel`)}
                    .fields=${[{id:`keyName`,label:this.i18nStore?.t(`webauthn.name_key_label`),placeholder:this.i18nStore?.t(`webauthn.key_name_placeholder`),autofocus:!0}]}
                    @submit=${this._handlePromptSubmit}
                    @cancel=${this._handlePromptCancel}
                ></ui-prompt>
            `:``}

            ${this.error?n`
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

            ${this.pendingDeleteId?n`
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
                    ${this.data?.credentialCount&&this.data.credentialCount>0?n`
                        ${this.data?.credentials.map(e=>n`
                            <div class="setting-row">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="icon-container">${O(`fingerprint`)}</div>
                                    <strong>${e.Name||this.i18nStore?.t(`webauthn.settings.unnamed_key`)}</strong>
                                </div>
                                <div style="display: flex; align-items: center; gap: 16px;">
                                    <div style="font-size: 13px; color: var(--text-muted);">${this.i18nStore?.t(`webauthn.settings.added`)} ${new Date(e.AddedAt).toLocaleString()}</div>
                                    <alps-icon-btn icon="trash" @click=${()=>this.removeCredential(e.ID)} title=${this.i18nStore?.t(`webauthn.settings.remove_btn`)||`Remove`}></alps-icon-btn>
                                </div>
                            </div>
                        `)}
                    `:n`<div class="empty-state">${this.i18nStore?.t(`webauthn.settings.noKeys`)}</div>`}
                    <alps-button variant="normal" style="margin-top: 12px;" @click=${this.addCredential} ?disabled=${this.adding} ?spinning=${this.adding}>
                        ${this.i18nStore?.t(`webauthn.add_key`)}
                    </alps-button>
                </div>
            </alps-setting-group>

            ${(this.data?.credentialCount??0)>0?n`
                <alps-setting-group label="${this.i18nStore?.t(`webauthn.trust_linked`)}" description="${this.i18nStore?.t(`webauthn.trust_linked_desc`)}">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
                        <input type="checkbox" .checked=${this.data?.trustLinkedAccounts} @change=${this.handleTrustToggle}>
                        ${this.i18nStore?.t(`webauthn.trust_linked_checkbox`)}
                    </label>
                </alps-setting-group>
            `:``}
        `}};k([h({context:S})],yo.prototype,`i18nStore`,void 0),k([a()],yo.prototype,`data`,void 0),k([a()],yo.prototype,`error`,void 0),k([a()],yo.prototype,`loading`,void 0),k([a()],yo.prototype,`adding`,void 0),k([a()],yo.prototype,`showNamePrompt`,void 0),k([a()],yo.prototype,`pendingCredential`,void 0),k([a()],yo.prototype,`pendingDeleteId`,void 0),yo=k([p(`alps-webauthn-settings`)],yo);var Z=class extends d{constructor(...e){super(...e),this.category=`general`,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.username=``,this.isScrolled=!1,this.sidebarWidth=250,this.sidebarCollapsed=!1,this.isSidebarDragging=!1,this.isSidebarHovered=!1,this.hoverTimeout=null,this.suppressSidebarHover=!1,this._handleResize=()=>{this.isMobile=window.innerWidth<=768,this.isMobile||(this.mobileSidebarOpen=!1)},this._handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0},this._handleSettingsChange=()=>{this._syncState()},this._handleI18nChange=()=>{this.requestUpdate()}}static{this.styles=[hn,g`
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
  `]}async connectedCallback(){super.connectedCallback(),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this.i18nStore?.addEventListener(`change`,this._handleI18nChange),window.addEventListener(`resize`,this._handleResize),this._syncState();try{let e=await fetch(`/session`);if(e.ok){let t=await e.json();t.Username&&(this.username=t.Username)}}catch(e){b.error(`Failed to fetch username in settings`,e)}}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),window.removeEventListener(`resize`,this._handleResize)}_syncState(){this.settingsState={...this.settingsStore.getState()},this.sidebarCollapsed=this.settingsState.sidebarCollapsed||!1}getCategoryLabel(e){switch(e){case`general`:return this.i18nStore?.t(`settings.categories.general`);case`identity`:return this.i18nStore?.t(`settings.categories.identity`);case`webauthn`:return this.i18nStore?.t(`settings.categories.webauthn`);case`accounts`:return this.i18nStore?.t(`settings.categories.accounts`);case`reading`:return this.i18nStore?.t(`settings.categories.reading`);case`appearance`:return this.i18nStore?.t(`settings.categories.appearance`);case`localization`:return this.i18nStore?.t(`settings.categories.localization`);default:let t=v.getSettingsTabs().find(t=>t.id===e);return t?this.i18nStore?.t(t.labelKey):e}}selectCategory(e){window.location.hash=`/settings/${e}`,this.isMobile&&(this.mobileSidebarOpen=!1),this.sidebarCollapsed&&!this.isMobile&&(this.suppressSidebarHover=!0)}async handleUpdate(e,t){let n=e.target,r=n.value;n.type===`checkbox`?(r=n.checked,t===`desktopNotifications`&&r===!0&&(`Notification`in window&&Notification.permission!==`granted`&&Notification.permission!==`denied`?await Notification.requestPermission()!==`granted`&&(r=!1,n.checked=!1):`Notification`in window&&Notification.permission===`denied`&&(r=!1,n.checked=!1))):(n.type===`number`||[`checkMailInterval`,`autoLogout`,`messagesPerPage`,`markReadTimeout`,`undoTimeout`].includes(t))&&(r=parseInt(n.value,10),isNaN(r)&&(r=0)),this.settingsStore.updateSettings({[t]:r})}render(){return n`
      <alps-header 
        .username=${this.username}
        .isMobile=${this.isMobile}
        .scrolled=${this.isScrolled}
        currentTab="settings"
        @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
      >
        <div slot="left" class="header-left">
          ${this.isMobile?``:n`
            <button class="header-icon-btn back-btn" @click=${()=>window.location.hash=``} title=${this.i18nStore?.t(`messageReader.back`)}>
              ${O(`arrowLeft`)} ${this.i18nStore?.t(`messageReader.back`)}
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
          ${v.getSettingsTabs().map(e=>n`
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
          ${this.settingsState?n`
            ${this.category===`general`?this.renderGeneral():``}
            ${this.category===`identity`?this.renderIdentity():``}
            ${this.category===`accounts`?n`<settings-accounts></settings-accounts>`:``}
            ${this.category===`webauthn`?n`<alps-webauthn-settings></alps-webauthn-settings>`:``}
            ${this.category===`reading`?this.renderReading():``}
            ${this.category===`appearance`?this.renderAppearance():``}
            ${this.category===`localization`?this.renderLocalization():``}
            ${v.getSettingsTabs().filter(e=>e.id===this.category).map(e=>n`${m(`<${e.component}></${e.component}>`)}`)}
          `:n`<div>${this.i18nStore?.t(`settings.loading`)}</div>`}
        </div>
      </div>
    `}renderGeneral(){return n`
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
    `}renderIdentity(){return n`
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
    `}renderReading(){return n`
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
            ${this.settingsState.hasThreadCapability===!1?n`
              <span style="font-size: 12px; color: var(--text-muted); font-weight: normal; margin-left: 4px;">
                (${this.i18nStore?.t(`settings.reading.threadingNotSupported`)})
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
    `}renderAppearance(){return n`
        
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

        <alps-setting-group description="${this.i18nStore?.t(`settings.appearance.showSenderAvatarsDesc`)}">
          <label class="checkbox-label">
            <input type="checkbox"
                   ?checked=${this.settingsState.showSenderAvatars}
                   @change=${e=>this.handleUpdate(e,`showSenderAvatars`)}>
            ${this.i18nStore?.t(`settings.appearance.showSenderAvatars`)}
          </label>
        </alps-setting-group>
    `}renderLocalization(){return n`
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.language`)}">
          <alps-select @change=${e=>this.handleUpdate(e,`language`)} .value=${this.settingsState.language}
            .options=${[{value:`en`,label:this.i18nStore?.t(`settings.localization.english`)||`en`},{value:`de`,label:this.i18nStore?.t(`settings.localization.german`)||`de`},{value:`it`,label:this.i18nStore?.t(`settings.localization.italian`)||`it`},{value:`es`,label:this.i18nStore?.t(`settings.localization.spanish`)||`es`},{value:`rs`,label:this.i18nStore?.t(`settings.localization.serbian`)||`rs`},{value:`sr`,label:this.i18nStore?.t(`settings.localization.serbianLatin`)||`sr`},{value:`fr`,label:this.i18nStore?.t(`settings.localization.french`)||`fr`},{value:`pt`,label:this.i18nStore?.t(`settings.localization.portuguese`)||`pt`},{value:`da`,label:this.i18nStore?.t(`settings.localization.danish`)||`da`}]}>
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
    `}};k([h({context:C})],Z.prototype,`settingsStore`,void 0),k([h({context:S})],Z.prototype,`i18nStore`,void 0),k([o({type:String})],Z.prototype,`category`,void 0),k([a()],Z.prototype,`settingsState`,void 0),k([a()],Z.prototype,`isMobile`,void 0),k([a()],Z.prototype,`mobileSidebarOpen`,void 0),k([a()],Z.prototype,`username`,void 0),k([a()],Z.prototype,`isScrolled`,void 0),k([a()],Z.prototype,`sidebarWidth`,void 0),k([a()],Z.prototype,`sidebarCollapsed`,void 0),k([a()],Z.prototype,`isSidebarDragging`,void 0),k([a()],Z.prototype,`isSidebarHovered`,void 0),k([a()],Z.prototype,`suppressSidebarHover`,void 0),Z=k([p(`settings-page`)],Z);async function bo(e){let t=await new re().parse(e),n=`default`,r=t.headers?.find(e=>e.key.toLowerCase()===`bimi-selector`);if(r){let e=r.value.match(/s=([^;\s]+)/i);e&&(n=e[1].trim())}let i=t.from?.address||``,a={messageId:t.messageId||``,date:t.date||``,from:t.from?t.from.name?`${t.from.name} <${t.from.address||``}>`:t.from.address||``:``,fromAddress:i,to:t.to?t.to.map(e=>e.name?`${e.name} <${e.address}>`:e.address).join(`, `):``,subject:t.subject||``,spf:`none`,spfDetail:``,dkim:`none`,dkimDetail:``,dmarc:`none`,dmarcDetail:``,bimiSelector:n,hasBimiPotential:!1},o=t.headers?.filter(e=>e.key.toLowerCase()===`authentication-results`)||[];if(o.length>0){let e=o[0],t=e.value.toLowerCase(),n=``,r=t.match(/smtp\.(?:remote|client)-ip=([0-9a-f\.:]+)/)||t.match(/designates ([0-9a-f\.:]+) as permitted sender/);r&&(n=r[1]);let i=e.value.split(`;`);for(let e of i){let t=e.trim().toLowerCase();if(t.startsWith(`spf=`))if(a.spf=t.split(`=`)[1].split(` `)[0],n)a.spfDetail=`with IP address ${n}`;else{let e=t.match(/smtp\.mailfrom=([^ \t]+)/)||t.match(/smtp\.helo=([^ \t]+)/);e&&(a.spfDetail=`with ${e[1]}`)}else if(t.startsWith(`dkim=`)){a.dkim=t.split(`=`)[1].split(` `)[0];let e=t.match(/header\.d=([^ \t]+)/);e&&(a.dkimDetail=`with domain ${e[1]}`)}else if(t.startsWith(`dmarc=`)){a.dmarc=t.split(`=`)[1].split(` `)[0];let e=t.match(/header\.from=([^ \t]+)/);e&&(a.dmarcDetail=`with domain ${e[1]}`)}}}return a.hasBimiPotential=a.dmarc===`pass`&&!!a.fromAddress,a}var xo=class extends d{constructor(...e){super(...e),this.rawText=``,this.parsedHeaders=null,this.loading=!0,this.error=``,this.mailbox=``,this.uid=``,this.isTruncated=!1,this._handleStoreChange=()=>{this.requestUpdate()},this.MAX_DISPLAY_SIZE=65536}static{this.styles=g`
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
  `}connectedCallback(){super.connectedCallback(),this.extractParams(),this.mailbox&&this.uid?this.fetchOriginal():(this.error=this.i18nStore?.t(`originalMessage.errorMissingParams`),this.loading=!1),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}extractParams(){let e=window.location.hash,t=e.indexOf(`?`);if(t!==-1){let n=new URLSearchParams(e.substring(t+1));this.mailbox=n.get(`mailbox`)||``,this.uid=n.get(`uid`)||``}}async fetchOriginal(){try{this.loading=!0;let e=await T(`/mailboxes/${D(this.mailbox)}/messages/${this.uid}/raw?limit=${this.MAX_DISPLAY_SIZE}`);if(!e.ok){if(e.status===401){window.location.hash=`#/login`;return}throw Error(this.i18nStore?.t(`originalMessage.errorFailedToFetch`))}this.rawText=await e.text(),this.rawText.length>=this.MAX_DISPLAY_SIZE&&(this.isTruncated=!0),this.parsedHeaders=await bo(this.rawText)}catch(e){this.error=e.message}finally{this.loading=!1}}copyToClipboard(){navigator.clipboard.writeText(this.rawText).then(()=>{alert(this.isTruncated?this.i18nStore?.t(`originalMessage.copiedTruncated`):this.i18nStore?.t(`originalMessage.copied`))}).catch(e=>{b.error(`Failed to copy: `,e),alert(this.i18nStore?.t(`originalMessage.copyFailed`))})}renderAuthStatus(e,t){e=e.toLowerCase();let r=n`<span class="auth-none">${this.i18nStore?.t(`originalMessage.none`)}</span>`;return e===`pass`?r=n`<span class="auth-pass">${this.i18nStore?.t(`originalMessage.pass`)}</span>`:e===`fail`&&(r=n`<span class="auth-fail">${this.i18nStore?.t(`originalMessage.fail`)}</span>`),n`
      <div class="auth-status-container">
        ${r}
        ${t?n`<span class="auth-status-detail">${t}</span>`:``}
      </div>
    `}render(){if(this.loading)return n`
        <div class="loading-state">
          <alps-loader></alps-loader>
          <span>${this.i18nStore?.t(`originalMessage.loading`)}</span>
        </div>
      `;if(this.error)return n`
        <div class="container">
          <alps-banner>
            ${this.error}
          </alps-banner>
        </div>
      `;let e=`/mailboxes/${D(this.mailbox)}/messages/${this.uid}/raw`;return n`
      <div class="container">
        <h1>${this.i18nStore?.t(`originalMessage.title`)}</h1>
        
        ${this.parsedHeaders?n`
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

        ${this.isTruncated?n`
          <alps-banner>
            ${this.i18nStore?.t(`originalMessage.truncatedInfo`)}
          </alps-banner>
        `:``}

        <div class="actions">
          <alps-button variant="primary" icon="downloadSimple" @click=${()=>{let t=document.createElement(`a`);t.href=e,t.download=`original_message.eml`,t.click()}}>
            ${this.i18nStore?.t(`originalMessage.downloadOriginal`)}
          </alps-button>
          ${this.isTruncated?``:n`
            <alps-button variant="normal" icon="copy" @click=${this.copyToClipboard}>
              ${this.i18nStore?.t(`originalMessage.copyClipboard`)}
            </alps-button>
          `}
        </div>

        <pre class="raw-content">${this.rawText}</pre>
      </div>
    `}};k([a()],xo.prototype,`rawText`,void 0),k([a()],xo.prototype,`parsedHeaders`,void 0),k([a()],xo.prototype,`loading`,void 0),k([a()],xo.prototype,`error`,void 0),k([a()],xo.prototype,`mailbox`,void 0),k([a()],xo.prototype,`uid`,void 0),k([a()],xo.prototype,`isTruncated`,void 0),k([h({context:S})],xo.prototype,`i18nStore`,void 0),xo=k([p(`original-message-page`)],xo);var Q=class extends d{constructor(...e){super(...e),this.loading=!0,this.error=``,this.mailbox=``,this.uid=``,this.message=null,this.content=``,this.rawMessageHtml=``,this.mimeType=`text/plain`,this.hasRemoteResources=!1,this.allowRemoteResources=!1,this.printTriggered=!1}static{this.styles=g`
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
    .print-iframe {
      width: 100%;
      border: none;
      overflow: visible;
      display: block;
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
  `}connectedCallback(){super.connectedCallback(),this.allowRemoteResources=this.settingsStore.getState().showRemoteContent===`always`,this.extractParams(),this.mailbox&&this.uid?this.fetchMessage():(this.error=`Missing mailbox or uid parameters`,this.loading=!1)}extractParams(){let e=window.location.hash,t=e.indexOf(`?`);if(t!==-1){let n=new URLSearchParams(e.substring(t+1));this.mailbox=n.get(`mailbox`)||``,this.uid=n.get(`uid`)||``,n.get(`remote`)===`1`&&(this.allowRemoteResources=!0)}}async fetchMessage(){try{this.loading=!0;let e=br.get(this.mailbox,this.uid);if(e&&e.Part){this.message=e.Message,this.mimeType=e.Part.MIMEType||e.Part.MimeType||`text/plain`,e.RawHtml===void 0?e.RawText!==void 0&&(this.content=e.RawText):(this.rawMessageHtml=e.RawHtml,this.hasRemoteResources=!1,this.content=aa(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})),this.loading=!1;return}let t=await T(`/mailboxes/${D(this.mailbox)}/messages/${this.uid}`);if(!t.ok){if(t.status===401){window.location.hash=`#/login`;return}throw Error(`Failed to fetch message metadata`)}this.message=await t.json(),await this.fetchMessageBody()}catch(e){this.error=e.message}finally{this.loading=!1}}findDisplayPart(e,t){if(!e)return null;if(e.MIMEType&&e.MIMEType.toLowerCase().startsWith(`multipart/`)){if(e.MIMEType.toLowerCase()===`multipart/alternative`){let n=null,r=null;for(let t of e.Children||[])t.MIMEType?.toLowerCase()===`text/plain`&&(n=t),t.MIMEType?.toLowerCase()===`text/html`&&(r=t);return t===`html`?r||n||e.Children[0]:n||r||e.Children[0]}for(let n of e.Children||[]){let e=this.findDisplayPart(n,t);if(e)return e}}return e.MIMEType?.toLowerCase()===`text/html`||e.MIMEType?.toLowerCase()===`text/plain`?e:null}findPartPath(e,t,n=``){if(!e)return null;if(e===t)return n||`1`;if(e.Children&&Array.isArray(e.Children))for(let r=0;r<e.Children.length;r++){let i=n?`${n}.${r+1}`:`${r+1}`,a=this.findPartPath(e.Children[r],t,i);if(a)return a}return null}async fetchMessageBody(){if(!this.message||!this.message.BodyStructure)return;let e=`1`,t=this.findDisplayPart(this.message.BodyStructure,`html`);if(t?(e=this.findPartPath(this.message.BodyStructure,t)||`1`,this.mimeType=t.MIMEType||`text/plain`):(this.mimeType=this.message.BodyStructure.MIMEType||`text/plain`,this.mimeType.toLowerCase()===`text/plain`||this.mimeType.toLowerCase()===`text/html`?e=`1`:this.mimeType=`multipart/mixed`),this.mimeType.toLowerCase().startsWith(`multipart/`)){this.content=``;return}let n=await T(`/mailboxes/${D(this.mailbox)}/messages/${this.uid}/raw?part=${e}`);if(!n.ok)throw Error(`Failed to fetch message body`);this.mimeType.toLowerCase()===`text/html`?(this.rawMessageHtml=await n.text(),this.hasRemoteResources=!1,this.content=aa(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})):this.content=await n.text()}loadRemoteResources(){this.allowRemoteResources=!0,this.printTriggered=!1,this.rawMessageHtml&&(this.content=aa(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message?.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}}))}updated(e){this.loading||this.error||!this.message||this.mimeType?.toLowerCase()!==`text/html`&&(this.printTriggered||(this.printTriggered=!0,setTimeout(()=>{this.isConnected&&window.print()},500)))}onPrintIframeLoad(e){let t=e.target;try{let e=t.contentDocument;e&&e.body&&(t.style.height=`${e.body.scrollHeight}px`)}catch{}this.printTriggered||(this.printTriggered=!0,setTimeout(()=>{this.isConnected&&window.print()},300))}render(){if(this.loading)return n`
        <div class="loading-state">
          <alps-loader></alps-loader>
          <span>${this.i18nStore?.t(`print.loading`)}</span>
        </div>
      `;if(this.error)return n`
        <div class="error-state">
          <div>${O(`warning`)}</div>
          <span>${this.error}</span>
        </div>
      `;let e=this.message;if(!e)return n``;let t=e.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`),r=e.Envelope?.From?.[0]||{},i=r.Mailbox&&r.Host?`${r.Mailbox}@${r.Host}`:``,a=r.Name||i||this.i18nStore?.t(`messageList.unknownSender`),o=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,s=String(this.settingsStore?.getState()?.hourFormat||`12`),c=e.Envelope?.Date?an(e.Envelope.Date,o,s):``,u=e.Envelope?.To&&e.Envelope.To.length>0?e.Envelope.To.map(e=>e.Name?`${e.Name} &lt;${e.Mailbox}@${e.Host}&gt;`:`${e.Mailbox}@${e.Host}`).join(`, `):this.i18nStore?.t(`messageReader.undisclosed`),d=n``;if(e.Envelope?.Cc&&e.Envelope.Cc.length>0){let t=e.Envelope.Cc.map(e=>e.Name?`${e.Name} &lt;${e.Mailbox}@${e.Host}&gt;`:`${e.Mailbox}@${e.Host}`).join(`, `);d=n`<div class="print-cc"><strong>${this.i18nStore?.t(`messageReader.cc`)}</strong> ${t}</div>`}let f;return f=this.mimeType?.toLowerCase()===`text/html`?n`<iframe
        class="print-iframe"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        .srcdoc=${l(this.content)}
        @load=${this.onPrintIframeLoad}
      ></iframe>`:this.mimeType?.toLowerCase().startsWith(`multipart/`)?n`<div style="font-style: italic; color: #666;">${this.i18nStore?.t(`messageReader.noReadableText`)}</div>`:n`<pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${this.content}</pre>`,n`
      ${this.hasRemoteResources&&!this.allowRemoteResources?n`
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
            <div><strong>${a}</strong> ${i?`<${i}>`:``}</div>
            <div class="print-date">${c}</div>
          </div>
          <div class="print-to-row">
            <strong>${this.i18nStore?.t(`messageReader.to`)}</strong> ${u}
            ${d}
          </div>
          <div class="print-divider-thick"></div>
        </div>
        <div class="print-body">
          ${f}
        </div>
      </div>
    `}};k([h({context:C})],Q.prototype,`settingsStore`,void 0),k([h({context:S})],Q.prototype,`i18nStore`,void 0),k([a()],Q.prototype,`loading`,void 0),k([a()],Q.prototype,`error`,void 0),k([a()],Q.prototype,`mailbox`,void 0),k([a()],Q.prototype,`uid`,void 0),k([a()],Q.prototype,`message`,void 0),k([a()],Q.prototype,`content`,void 0),k([a()],Q.prototype,`rawMessageHtml`,void 0),k([a()],Q.prototype,`mimeType`,void 0),k([a()],Q.prototype,`hasRemoteResources`,void 0),k([a()],Q.prototype,`allowRemoteResources`,void 0),Q=k([p(`print-page`)],Q);var So=class extends d{constructor(...e){super(...e),this.statusMessage=``,this.statusType=`info`,this.isLoading=!1,this.isSuccess=!1,this._handleI18nChange=()=>{this.requestUpdate()}}static{this.styles=g`
    .status {
      margin-bottom: 24px;
      padding: 8px 12px;
      border-radius: var(--radius-md, 6px);
      font-size: 14px;
      text-align: center;
    }
    
    /* The theme defines --error / --success / --accent-color. There has never
       been a --color-* family, nor any -muted variant, so every declaration in
       this block resolved to nothing: the status banner on the second-factor
       screen — the element that tells the user whether their security key
       worked — rendered with no background, no border and inherited text. */
    .status.error {
      background: color-mix(in srgb, var(--error, #ef4444) 12%, transparent);
      color: var(--error, #ef4444);
      border: 1px solid color-mix(in srgb, var(--error, #ef4444) 30%, transparent);
    }
    
    .status.info {
      background: color-mix(in srgb, var(--accent-color, #2563eb) 12%, transparent);
      color: var(--accent-color, #2563eb);
      border: 1px solid color-mix(in srgb, var(--accent-color, #2563eb) 30%, transparent);
    }
    
    .status.success {
      background: color-mix(in srgb, var(--success, #16a34a) 12%, transparent);
      color: var(--success, #16a34a);
      border: 1px solid color-mix(in srgb, var(--success, #16a34a) 30%, transparent);
    }
    

  `}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),vo()?setTimeout(()=>{this._handleVerify()},300):(this.statusMessage=this.i18nStore?.t(`webauthn.not_supported`),this.statusType=`error`)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}async _handleVerify(){this.isLoading=!0,this.statusMessage=this.i18nStore?.t(`webauthn.requesting`),this.statusType=`info`;try{let e=await fetch(`/webauthn/verify/begin`,{method:`POST`});if(!e.ok)throw Error(this.i18nStore?.t(`webauthn.errors.begin_failed`));let t=await e.json();if(!t||!t.publicKey)throw Error(this.i18nStore?.t(`webauthn.errors.invalid_options`));this.statusMessage=this.i18nStore?.t(`webauthn.waiting_for_key`);let n=await _o(t);if(this.statusMessage=this.i18nStore?.t(`webauthn.verifying`),(await(await fetch(`/webauthn/verify/finish`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(n)})).json()).success)this.statusMessage=this.i18nStore?.t(`webauthn.success`),this.statusType=`success`,this.isSuccess=!0,setTimeout(()=>{window.location.href=`/#/mailbox/INBOX`},1e3);else throw Error(this.i18nStore?.t(`webauthn.errors.verification_failed`))}catch(e){this.statusMessage=e.message||this.i18nStore?.t(`webauthn.errors.general`),this.statusType=`error`}finally{this.isLoading=!1}}render(){return n`
      <alps-auth-card
        icon="fingerprint"
        title="${this.i18nStore?.t(`webauthn.title`)}"
        subtitle="${this.i18nStore?.t(`webauthn.instruction`)}"
        style="--auth-card-icon-color: var(--accent-color, #2563eb); --auth-card-icon-size: 64px;"
      >
        ${this.statusMessage?n`
          <div class="status ${this.statusType}">
            ${this.statusMessage}
          </div>
        `:``}
        
        <alps-button 
          variant="primary"
          full-width
          style="height: 36px; margin-top: 4px;"
          @click=${this._handleVerify} 
          ?disabled=${this.isLoading||this.isSuccess||!vo()}
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
    `}};k([h({context:S})],So.prototype,`i18nStore`,void 0),k([a()],So.prototype,`statusMessage`,void 0),k([a()],So.prototype,`statusType`,void 0),k([a()],So.prototype,`isLoading`,void 0),k([a()],So.prototype,`isSuccess`,void 0),So=k([p(`login-webauthn-page`)],So);var Co=class extends d{constructor(...e){super(...e),this.show=!1,this.message=``,this.actionLabel=``,this.timeout=0,this._timer=null}updated(e){e.has(`show`)&&(this.show&&this.timeout>0?(this._timer&&clearTimeout(this._timer),this._timer=setTimeout(()=>{this.dismiss()},this.timeout)):!this.show&&this._timer&&(clearTimeout(this._timer),this._timer=null))}dismiss(){this.onDismiss&&this.onDismiss(),this.close()}close(){this.show=!1,this.dispatchEvent(new CustomEvent(`dismiss`)),this.onAction=void 0,this.onDismiss=void 0}handleAction(){this.onAction?this.onAction():this.dispatchEvent(new CustomEvent(`action`)),this.close()}static{this.styles=g`
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
  `}render(){return n`
      <div class="toast-container">
        <span>${this.message}</span>
        ${this.actionLabel?n`
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
    `}};k([h({context:S})],Co.prototype,`i18nStore`,void 0),k([o({type:Boolean,reflect:!0})],Co.prototype,`show`,void 0),k([o({type:String})],Co.prototype,`message`,void 0),k([o({type:String})],Co.prototype,`actionLabel`,void 0),k([o({type:Object})],Co.prototype,`onAction`,void 0),k([o({type:Object})],Co.prototype,`onDismiss`,void 0),k([o({type:Number})],Co.prototype,`timeout`,void 0),Co=k([p(`alps-toast`)],Co);function wo(){let e=document.activeElement;for(;e?.shadowRoot?.activeElement;)e=e.shadowRoot.activeElement;return e}var $=class extends d{constructor(...e){super(...e),this.attachments=[],this.mailbox=``,this.messageUid=``,this.activeIndex=0,this.zoom=1,this.rotation=0,this.loadedText=null,this.textLoading=!1,this.textError=null,this.copied=!1,this.pdfUrl=null,this.pdfLoading=!1,this.pdfError=null,this.loadToken=0,this.previouslyFocused=null,this.handleKeyDown=e=>{e.key===`Escape`?(e.preventDefault(),e.stopPropagation(),this.close()):(e.key===`ArrowLeft`||e.key===`ArrowRight`)&&(e.preventDefault(),e.stopPropagation(),e.key===`ArrowLeft`?this.prev():this.next())}}connectedCallback(){super.connectedCallback(),this.previouslyFocused=wo(),window.addEventListener(`keydown`,this.handleKeyDown,!0)}firstUpdated(){this.shadowRoot?.querySelector(`.close-btn`)?.focus()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`keydown`,this.handleKeyDown,!0),this.replacePdfUrl(null);let e=this.previouslyFocused;this.previouslyFocused=null,e?.isConnected&&e.focus?.()}updated(e){(e.has(`activeIndex`)||e.has(`attachments`))&&(this.zoom=1,this.rotation=0,this.copied=!1,this.loadContent())}get current(){if(!this.attachments||this.attachments.length===0)return null;let e=Math.max(0,Math.min(this.activeIndex,this.attachments.length-1));return this.attachments[e]}nameOf(e){return e?.Filename||e?.filename||e?.name||this.i18nStore?.t(`messageReader.unknownAttachment`)||``}sizeOf(e){return e?.Size||e?.size||0}infoOf(e){return Vi(e?.MIMEType||e?.contentType,this.nameOf(e))}urlOf(e){return Di(this.mailbox,this.messageUid,e)}replacePdfUrl(e){this.pdfUrl&&URL.revokeObjectURL(this.pdfUrl),this.pdfUrl=e}async loadContent(){let e=this.current;if(!e)return;let t=++this.loadToken;this.replacePdfUrl(null),this.pdfLoading=!1,this.pdfError=null,this.textLoading=!1,this.textError=null,this.loadedText=null;let n=this.infoOf(e),r=this.urlOf(e);if(r){if(n.previewKind===`text`){if(this.sizeOf(e)>2097152)return;this.textLoading=!0;try{let e=await T(r);if(!e.ok)throw Error(String(e.status));let n=await e.text();if(t!==this.loadToken)return;this.loadedText=n}catch(e){if(t!==this.loadToken)return;this.textError=e?.message||`error`}finally{t===this.loadToken&&(this.textLoading=!1)}return}if(n.previewKind===`pdf`){this.pdfLoading=!0;try{let e=await T(r);if(!e.ok)throw Error(String(e.status));let n=await e.blob();if(n.type!==`application/pdf`&&(n=new Blob([n],{type:`application/pdf`})),t!==this.loadToken)return;this.replacePdfUrl(URL.createObjectURL(n))}catch(e){if(t!==this.loadToken)return;this.pdfError=e?.message||`error`}finally{t===this.loadToken&&(this.pdfLoading=!1)}}}}close(){this.dispatchEvent(new CustomEvent(`close`,{bubbles:!0,composed:!0}))}prev(){this.attachments.length<=1||(this.activeIndex=(this.activeIndex-1+this.attachments.length)%this.attachments.length)}next(){this.attachments.length<=1||(this.activeIndex=(this.activeIndex+1)%this.attachments.length)}zoomIn(){this.zoom=Math.min(4,Math.round((this.zoom+.25)*100)/100)}zoomOut(){this.zoom=Math.max(.25,Math.round((this.zoom-.25)*100)/100)}resetZoom(){this.zoom=1,this.rotation=0}rotate(){this.rotation=(this.rotation+90)%360}async copyContent(){if(this.loadedText)try{await navigator.clipboard.writeText(this.loadedText),this.copied=!0,setTimeout(()=>{this.copied=!1},2e3)}catch{}}download(){let e=this.current,t=this.urlOf(e);if(!t)return;let n=document.createElement(`a`);n.href=t,n.download=this.nameOf(e)||`download`,document.body.appendChild(n),n.click(),document.body.removeChild(n)}openPdfInNewTab(){this.pdfUrl&&window.open(this.pdfUrl,`_blank`,`noopener,noreferrer`)}static{this.styles=g`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 30000;
      user-select: none;
    }
    .backdrop {
      position: fixed;
      inset: 0;
      background: var(--modal-backdrop, rgba(255, 255, 255, 0.85));
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
      flex-shrink: 0;
      gap: 16px;
    }
    .meta-info {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1;
    }
    .type-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: var(--bg-secondary);
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    .file-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .file-title {
      font-size: 14px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .file-sub {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      gap: 8px;
    }
    .actions-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .action-btn, .close-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 32px;
      min-width: 32px;
      padding: 0 10px;
      border-radius: 6px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      font-size: 12px;
      cursor: pointer;
      box-sizing: border-box;
    }
    .action-btn.icon-only, .close-btn {
      padding: 0;
      width: 32px;
    }
    .action-btn:hover, .close-btn:hover {
      background: var(--hover-color, var(--bg-secondary));
    }
    .action-btn .icon {
      width: 16px;
      height: 16px;
    }
    .preview-body {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 24px;
      box-sizing: border-box;
    }
    .image-viewport {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .preview-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: transform 0.2s ease;
      border-radius: 4px;
    }
    .pdf-container, .text-container {
      width: 100%;
      height: 100%;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }
    .pdf-container {
      max-width: 1000px;
      overflow: hidden;
    }
    .pdf-frame {
      width: 100%;
      height: 100%;
      border: none;
    }
    .text-container {
      max-width: 900px;
      overflow: auto;
      padding: 16px;
      box-sizing: border-box;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      line-height: 1.6;
      color: var(--text-primary);
      user-select: text;
    }
    .code-line {
      display: flex;
      gap: 16px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .line-num {
      color: var(--text-muted);
      width: 36px;
      text-align: right;
      flex-shrink: 0;
      user-select: none;
    }
    .line-text {
      flex: 1;
    }
    .audio-card, .fallback-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      padding: 32px 40px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
      color: var(--text-primary);
      max-width: 480px;
      width: 100%;
      box-sizing: border-box;
    }
    .card-icon {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      color: var(--text-muted);
    }
    .card-icon .icon {
      width: 32px;
      height: 32px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 600;
      word-break: break-word;
    }
    .card-desc {
      font-size: 13px;
      color: var(--text-muted);
    }
    audio {
      width: 100%;
    }
    .video-container {
      max-width: 1000px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.9);
    }
    video {
      max-width: 100%;
      max-height: 80vh;
    }
    .nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2;
    }
    .nav-arrow.prev { left: 24px; }
    .nav-arrow.next { right: 24px; }
    .loading-state, .error-state {
      color: var(--text-muted);
      font-size: 14px;
    }
    .error-state {
      color: var(--error);
    }
  `}render(){let e=this.current;if(!e)return n``;let t=e=>this.i18nStore?.t(e)??e,r=this.nameOf(e),i=this.sizeOf(e),a=this.infoOf(e),o=this.urlOf(e),s=this.attachments.length,c=e=>{e.target===e.currentTarget&&this.close()};return n`
      <div class="backdrop" @click=${c}>
        <div class="preview-header">
          <div class="meta-info">
            <div
              class="type-badge ${a.themeClass}"
              style="${a.color?`color: ${a.color}; background: color-mix(in srgb, ${a.color} 12%, transparent)`:``}"
            >${O(a.icon)}</div>
            <div class="file-details">
              <span class="file-title" title="${r}">${r}</span>
              <span class="file-sub">
                <span>${cn(i)}</span>
                ${s>1?n`<span>•</span><span>${this.activeIndex+1} / ${s}</span>`:``}
              </span>
            </div>
          </div>
          <div class="actions-bar">
            ${a.isImage?n`
              <button class="action-btn icon-only zoom-out" @click=${this.zoomOut} title="${t(`attachment.zoomOut`)}">${O(`magnifyingGlassMinus`)}</button>
              <button class="action-btn icon-only fit" @click=${this.resetZoom} title="${t(`attachment.fitToScreen`)}">${O(`arrowsInSimple`)}</button>
              <button class="action-btn icon-only zoom-in" @click=${this.zoomIn} title="${t(`attachment.zoomIn`)}">${O(`magnifyingGlassPlus`)}</button>
              <button class="action-btn icon-only rotate" @click=${this.rotate} title="${t(`attachment.rotate`)}">${O(`arrowCounterClockwise`)}</button>
            `:``}
            ${a.previewKind===`text`&&this.loadedText?n`
              <button class="action-btn copy" @click=${this.copyContent} title="${t(`attachment.copyContent`)}">
                ${O(`copy`)}
                <span>${this.copied?t(`attachment.copied`):t(`attachment.copyContent`)}</span>
              </button>
            `:``}
            ${a.isPdf&&this.pdfUrl?n`
              <button class="action-btn icon-only new-tab" @click=${this.openPdfInNewTab} title="${t(`attachment.openInNewTab`)}">${O(`arrowsOutSimple`)}</button>
            `:``}
            ${o?n`
              <button class="action-btn icon-only download" @click=${this.download} title="${t(`attachment.download`)}">${O(`downloadSimple`)}</button>
            `:``}
            <button class="close-btn" @click=${this.close} title="${t(`attachment.close`)}">${O(`x`)}</button>
          </div>
        </div>

        <div class="preview-body" @click=${c}>
          ${s>1?n`
            <button class="nav-arrow prev" @click=${this.prev} title="${t(`attachment.previous`)}">${O(`caretLeft`)}</button>
            <button class="nav-arrow next" @click=${this.next} title="${t(`attachment.next`)}">${O(`caretRight`)}</button>
          `:``}
          ${this.renderContent(a,o,r,i)}
        </div>
      </div>
    `}renderContent(e,t,r,i){let a=e=>this.i18nStore?.t(e)??e;return t?e.isImage?n`
        <div class="image-viewport" @click=${e=>{e.target===e.currentTarget&&this.close()}}>
          <img
            src="${t}"
            alt="${r}"
            class="preview-image"
            style="transform: scale(${this.zoom}) rotate(${this.rotation}deg);"
            @dblclick=${()=>{this.zoom=this.zoom===1?2:1}}
          />
        </div>
      `:e.isPdf?this.pdfLoading?n`<div class="loading-state">${a(`attachment.loadingPreview`)}</div>`:this.pdfError?n`<div class="error-state">${a(`attachment.errorLoading`)}</div>`:this.pdfUrl?n`
        <div class="pdf-container">
          <iframe src="${this.pdfUrl}#toolbar=1" class="pdf-frame" title="${r}"></iframe>
        </div>
      `:this.renderFallback(e,t,r,i):e.previewKind===`text`?i>2097152?this.renderFallback(e,t,r,i):this.textLoading?n`<div class="loading-state">${a(`attachment.loadingPreview`)}</div>`:this.textError?n`<div class="error-state">${a(`attachment.errorLoading`)}</div>`:this.loadedText===null?n``:n`
        <div class="text-container">
          ${this.loadedText.split(`
`).map((e,t)=>n`
            <div class="code-line"><span class="line-num">${t+1}</span><span class="line-text">${e||` `}</span></div>
          `)}
        </div>
      `:e.isAudio?n`
        <div class="audio-card">
          <div class="card-icon" style="${e.color?`color: ${e.color}; background: color-mix(in srgb, ${e.color} 12%, transparent)`:``}">
            ${O(`fileAudio`)}
          </div>
          <div class="card-title">${r}</div>
          <audio controls src="${t}"></audio>
        </div>
      `:e.isVideo?n`
        <div class="video-container">
          <video controls playsinline src="${t}"></video>
        </div>
      `:this.renderFallback(e,t,r,i):this.renderFallback(e,t,r,i)}renderFallback(e,t,r,i){let a=e=>this.i18nStore?.t(e)??e;return n`
      <div class="fallback-card">
        <div class="card-icon">${O(e.icon)}</div>
        <div class="card-title">${r}</div>
        <div class="card-desc">${a(`attachment.cannotPreview`)} (${cn(i)})</div>
        ${t?n`
          <button class="action-btn download" @click=${this.download}>
            ${O(`downloadSimple`)}
            <span>${a(`attachment.download`)}</span>
          </button>
        `:``}
      </div>
    `}};k([h({context:S,subscribe:!0})],$.prototype,`i18nStore`,void 0),k([o({type:Array})],$.prototype,`attachments`,void 0),k([o({type:String})],$.prototype,`mailbox`,void 0),k([o({type:String})],$.prototype,`messageUid`,void 0),k([o({type:Number})],$.prototype,`activeIndex`,void 0),k([a()],$.prototype,`zoom`,void 0),k([a()],$.prototype,`rotation`,void 0),k([a()],$.prototype,`loadedText`,void 0),k([a()],$.prototype,`textLoading`,void 0),k([a()],$.prototype,`textError`,void 0),k([a()],$.prototype,`copied`,void 0),k([a()],$.prototype,`pdfUrl`,void 0),k([a()],$.prototype,`pdfLoading`,void 0),k([a()],$.prototype,`pdfError`,void 0),$=k([p(`alps-attachment-preview`)],$);var To=3e3,Eo=15e3,Do=3e3,Oo=1500,ko=class extends d{constructor(...e){super(...e),this.composeStore=new ii,this.settingsStore=new Oe,this.i18nStore=new xe,this.linkedAccountsStore=li,this.activeComposers=[],this.composerReady=!1,this.toasts=[],this.attachmentPreview=null,this.toastIdCounter=0,this.isOffline=!navigator.onLine,this.offlineCountdown=0,this.offlineInterval=null,this._handleOpenAttachmentPreview=e=>{let{attachments:t,mailbox:n,messageUid:r,index:i}=e.detail??{};!Array.isArray(t)||t.length===0||(this.attachmentPreview={attachments:t,mailbox:n,messageUid:r,index:i??0})},this._handlePluginsUpdated=()=>{this.requestUpdate()},this._handleGlobalDragOver=e=>{e.preventDefault()},this._handleGlobalDrop=e=>{e.preventDefault(),window.dispatchEvent(new CustomEvent(`alps-composer-drop`))},this._handleAuthError=()=>{sessionStorage.clear(),je(),window.dispatchEvent(new CustomEvent(`session-cleared`,{detail:{reason:`expired`}})),si(`sessionExpired`),window.location.hash=`#/login`},this._verifyConnectivity=async()=>{if(!navigator.onLine)return!1;try{let e=await fetch(`/site.webmanifest`,{method:`HEAD`,cache:`no-store`});return!(e.status===502||e.status===503||e.status===504)}catch{return!1}},this._handleOnlineEvent=async()=>{await this._verifyConnectivity()?(this.isOffline=!1,this._stopOfflineCountdown()):this._handleOfflineEvent()},this._verifyingNetworkError=!1,this._handleNetworkError=async()=>{if(!(this.isOffline||this._verifyingNetworkError)){this._verifyingNetworkError=!0;try{await this._verifyConnectivity()||this._handleOfflineEvent()}finally{this._verifyingNetworkError=!1}}},this._handleOfflineEvent=()=>{this.isOffline||(this.isOffline=!0,this.offlineCountdown=10,this._startOfflineCountdown())},this._isPinging=!1,this._handleShowToast=e=>{let t=++this.toastIdCounter,n={id:t,message:e.detail.message??(e.detail.i18nKey?this.i18nStore?.t(e.detail.i18nKey):void 0)??``,actionLabel:e.detail.actionLabel||``,actionFn:e.detail.actionFn,dismissFn:e.detail.dismissFn,timeout:e.detail.duration||To,show:!1};this.toasts=[...this.toasts,n],requestAnimationFrame(()=>{this.toasts=this.toasts.map(e=>e.id===t?{...e,show:!0}:e)})},this._handleBeforeUnload=e=>{if(this.activeComposers.some(e=>e.isSending))return e.preventDefault(),`You have a message currently sending. Are you sure you want to leave?`},this._handleUpdateAvailable=()=>{this._handleShowToast(new CustomEvent(`show-toast`,{detail:{i18nKey:`update.available`,actionLabel:this.i18nStore?.t(`update.reload`),actionFn:it,duration:Eo}}))},this.composerModule=null,this._handleComposeChange=()=>{let e=this.composeStore.getState().activeComposers;e.length>0&&this.ensureComposerLoaded(),this.activeComposers=e},this._handleSettingsChange=()=>{let e=this.settingsStore.getState();va.setLogoutTime(e.autoLogout??0),this.i18nStore.setLanguage(e.language??`en`)},this.mailboxPageTemplate=n`<mailbox-page></mailbox-page>`,this.router=new co(this.getRoutes(),()=>n`<div>404 — ${this.i18nStore.t(`general.notFound`)}</div>`,()=>this.requestUpdate())}static{this.styles=g`
    /* The offline modal's glyph. It was a hand-written <use> pointing at the
       sprite with its OWN cache-busting query — ?v=7, where renderIcon uses
       ?v=11 — so the browser treated it as a second 64 KB resource that nothing
       else in the app ever requests. Which made the one icon shown BECAUSE the
       network is down the one icon guaranteed not to be in cache: a fresh
       fetch, while offline, that cannot succeed. */
    .offline-icon {
      color: var(--text-muted, #9ca3af);
      margin-bottom: 16px;
    }
    .offline-icon .icon {
      width: 48px;
      height: 48px;
      fill: currentColor;
    }

    :host {
      display: block;
      height: 100vh;
      height: 100dvh;
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
  `}connectedCallback(){super.connectedCallback();let e=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`))||document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));!e&&!window.location.hash.startsWith(`#/login`)&&(window.location.hash=`#/login`),this.settingsStore.setI18n(this.i18nStore),this.composeStore.addEventListener(`change`,this._handleComposeChange),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._handleComposeChange();let t=this.settingsStore.getState().autoLogout??0;va.setLogoutTime(t),va.onBeforeLogout=()=>this.composeStore.saveAllDirtyDrafts();let n=this.settingsStore.getState().language??`en`;this.i18nStore.setLanguage(n),window.addEventListener(`auth-error`,this._handleAuthError),window.addEventListener(`show-toast`,this._handleShowToast),window.addEventListener(`beforeunload`,this._handleBeforeUnload),window.addEventListener(`online`,this._handleOnlineEvent),window.addEventListener(`offline`,this._handleOfflineEvent),window.addEventListener(`network-error`,this._handleNetworkError),window.addEventListener(`dragover`,this._handleGlobalDragOver),window.addEventListener(`drop`,this._handleGlobalDrop),window.addEventListener(`plugins-updated`,this._handlePluginsUpdated),window.addEventListener(`open-attachment-preview`,this._handleOpenAttachmentPreview),window.addEventListener(Pe,this._handleUpdateAvailable),et(()=>this.composeStore.getState().activeComposers.length>0),this.isOffline&&this._handleOfflineEvent(),e&&this._fetchSessionData()}async _fetchSessionData(){try{let e=await fetch(`/session`);if(e.ok){let t=await e.json();t.EnabledPlugins&&v.setEnabledPlugins(t.EnabledPlugins)}}catch(e){console.error(`Failed to fetch session data`,e)}}disconnectedCallback(){super.disconnectedCallback(),this.composeStore.removeEventListener(`change`,this._handleComposeChange),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),window.removeEventListener(`auth-error`,this._handleAuthError),window.removeEventListener(`show-toast`,this._handleShowToast),window.removeEventListener(`open-attachment-preview`,this._handleOpenAttachmentPreview),window.removeEventListener(`beforeunload`,this._handleBeforeUnload),window.removeEventListener(`online`,this._handleOnlineEvent),window.removeEventListener(`offline`,this._handleOfflineEvent),window.removeEventListener(`network-error`,this._handleNetworkError),window.removeEventListener(`dragover`,this._handleGlobalDragOver),window.removeEventListener(`drop`,this._handleGlobalDrop),window.removeEventListener(`plugins-updated`,this._handlePluginsUpdated),window.removeEventListener(Pe,this._handleUpdateAvailable),et(null),this._stopOfflineCountdown()}_startOfflineCountdown(){this._stopOfflineCountdown(),this.offlineInterval=window.setInterval(async()=>{if(this.offlineCountdown>1)this.offlineCountdown--;else{if(this.offlineCountdown=10,this._isPinging)return;this._isPinging=!0;try{await this._verifyConnectivity()&&(this.isOffline=!1,this._stopOfflineCountdown())}finally{this._isPinging=!1}}},1e3)}_stopOfflineCountdown(){this.offlineInterval!==null&&(clearInterval(this.offlineInterval),this.offlineInterval=null)}_handleDismissToast(e){this.toasts=this.toasts.map(t=>t.id===e?{...t,show:!1}:t),setTimeout(()=>{this.toasts=this.toasts.filter(t=>t.id!==e)},300)}firstUpdated(){let e=()=>{this.ensureComposerLoaded().catch(()=>{})},t=window.requestIdleCallback;typeof t==`function`?t(e,{timeout:Do}):window.setTimeout(e,Oo)}ensureComposerLoaded(){return this.composerModule||=x(()=>import(`./alps-floating-composer-zfcHv2nF.js`).then(e=>(this.composerReady=!0,e)),__vite__mapDeps([2,3,4,5])).catch(e=>{throw this.composerModule=null,b.error(`Failed to load the composer`,e),e}),this.composerModule}getRoutes(){let e={"/":()=>this.mailboxPageTemplate,"/login":()=>n`<login-page></login-page>`,"/mailbox/*":()=>this.mailboxPageTemplate,"/settings":()=>n`<settings-page category="general"></settings-page>`,"/settings/*":()=>{let e=window.location.hash.match(/^#\/settings\/?(.*)$/);return n`<settings-page .category=${e&&e[1]?e[1].split(`?`)[0]:`general`}></settings-page>`},"/original":()=>n`<original-message-page></original-message-page>`,"/print":()=>n`<print-page></print-page>`,"/login/webauthn":()=>n`<login-webauthn-page></login-webauthn-page>`};return v.getRoutes().forEach(t=>{let n=null;e[t.path]=()=>(n||=document.createElement(t.component),n)}),e}render(){let e=this.activeComposers.filter(e=>!e.minimized).length,t=this.activeComposers.filter(e=>e.minimized).length,r=0,i=0;return n`
      ${this.router.render()}
      
      ${this.composerReady?this.activeComposers.map((a,o)=>{let s=a.minimized;return n`
          <alps-floating-composer
            .instance=${a}
            .index=${o}
            .totalOpen=${e}
            .totalMinimized=${t}
            .openIndex=${s?0:r++}
            .minimizedIndex=${s?i++:0}
          ></alps-floating-composer>
        `}):``}
      
      <div class="toast-stack">
        ${this.toasts.map(e=>n`
          <alps-toast
            .show=${e.show}
            .message=${e.message}
            .actionLabel=${e.actionLabel}
            .onAction=${e.actionFn}
            .onDismiss=${e.dismissFn}
            .timeout=${e.timeout}
            @dismiss=${()=>this._handleDismissToast(e.id)}
          ></alps-toast>
        `)}
      </div>

      ${this.attachmentPreview?n`
        <alps-attachment-preview
          .attachments=${this.attachmentPreview.attachments}
          .mailbox=${this.attachmentPreview.mailbox}
          .messageUid=${this.attachmentPreview.messageUid}
          .activeIndex=${this.attachmentPreview.index}
          @close=${()=>{this.attachmentPreview=null}}
        ></alps-attachment-preview>
      `:``}

      ${this.isOffline?n`
        <ui-modal title=${this.i18nStore.t(`offline.title`)} .dismissible=${!1} width="400px">
          <div style="text-align: center; padding: 16px 0;">
            <div class="offline-icon">${O(`wifiSlash`)}</div>
            <div style="font-weight: 500; font-size: 16px; margin-bottom: 8px; color: var(--text-primary, #111827);">
              ${this.i18nStore.t(`offline.description`)}
            </div>
            <div style="color: var(--text-secondary, #4b5563); font-size: 14px;">
              ${this.i18nStore.t(`offline.tryingAgain`,{seconds:this.offlineCountdown})}
            </div>
          </div>
        </ui-modal>
      `:``}
    `}};k([i({context:ai})],ko.prototype,`composeStore`,void 0),k([i({context:C})],ko.prototype,`settingsStore`,void 0),k([i({context:S})],ko.prototype,`i18nStore`,void 0),k([i({context:ui})],ko.prototype,`linkedAccountsStore`,void 0),k([a()],ko.prototype,`activeComposers`,void 0),k([a()],ko.prototype,`composerReady`,void 0),k([a()],ko.prototype,`toasts`,void 0),k([a()],ko.prototype,`attachmentPreview`,void 0),k([a()],ko.prototype,`isOffline`,void 0),k([a()],ko.prototype,`offlineCountdown`,void 0),ko=k([p(`app-root`)],ko);var Ao=Object.assign({"../../plugins/caldav/frontend/index.ts":mr,"../../plugins/carddav/frontend/index.ts":Ha,"../../plugins/gpg/frontend/index.ts":Xa,"../../plugins/managesieve/frontend/index.ts":ao,"../../plugins/password/frontend/index.ts":so});b.info(`Loaded ${Object.keys(Ao).length} frontend plugins.`),Qe();export{v as C,b as S,k as _,aa as a,C as b,ai as c,qr as d,Jr as f,En as g,L as h,ca as i,Qr as l,B as m,xa as n,oa as o,Yr as p,ba as r,ti as s,ya as t,Gr as u,O as v,S as x,Ae as y};