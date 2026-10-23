const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/openpgp-Dr7OTnf5.js","assets/rolldown-runtime-S-ySWqyJ.js","assets/alps-floating-composer-BNzQH-aO.js","assets/editor-C7Wn0a7g.js","assets/lit-Db_Hq7O1.js","assets/emoji-DEmXoDvr.js"])))=>i.map(i=>d[i]);
import{n as e,r as t}from"./rolldown-runtime-S-ySWqyJ.js";import{_ as n,a as r,c as i,d as a,f as o,g as s,h as c,i as l,l as u,m as d,o as f,p,r as m,s as h,u as g,v as _}from"./lit-Db_Hq7O1.js";import{n as v,r as y,t as ee}from"./vendor-CqVKsHuZ.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function te(e,t){if(e===null||t===null)return e===t;if(e.size!==t.size)return!1;for(let n of e)if(!t.has(n))return!1;return!0}var b=new class{constructor(){this.navTabs=[],this.settingsTabs=[],this.routes=[],this.hooks=new Map,this.enabledPlugins=null}setEnabledPlugins(e){let t=new Set(e);te(this.enabledPlugins,t)||(this.enabledPlugins=t,window.dispatchEvent(new CustomEvent(`plugins-updated`)))}isEnabled(e){return this.enabledPlugins===null||this.enabledPlugins.has(e)}registerHook(e,t,n){this.hooks.has(e)||this.hooks.set(e,[]),this.hooks.get(e).push({handler:t,pluginId:n})}enabledHandlers(e){return(this.hooks.get(e)||[]).filter(e=>!e.pluginId||this.isEnabled(e.pluginId)).map(e=>e.handler)}async invokeHookAsync(e,t){let{results:n}=await this.invokeHookSettled(e,t);return n}async invokeHookSettled(e,t){let n=this.enabledHandlers(e),r=await Promise.allSettled(n.map(e=>e(t))),i=[],a=0;for(let t of r)t.status===`fulfilled`?i.push(t.value):(a+=1,console.error(`Error in async hook ${e}:`,t.reason));return{results:i,failed:a}}invokeHook(e,t){let n=this.enabledHandlers(e),r=[];return n.forEach(n=>{try{r.push(n(t))}catch(t){console.error(`Error in hook ${e}:`,t)}}),r}registerNavTab(e){this.navTabs.find(t=>t.id===e.id)||this.navTabs.push(e)}getNavTabs(){let e=this.navTabs;return this.enabledPlugins!==null&&(e=e.filter(e=>this.isEnabled(e.pluginId||e.id))),e.slice().sort((e,t)=>(e.order||999)-(t.order||999))}registerSettingsTab(e){this.settingsTabs.find(t=>t.id===e.id)||this.settingsTabs.push(e)}getSettingsTabs(){return this.enabledPlugins===null?this.settingsTabs:this.settingsTabs.filter(e=>this.isEnabled(e.pluginId||e.id))}registerRoute(e){this.routes.find(t=>t.path===e.path)||this.routes.push(e)}getRoutes(){return this.enabledPlugins===null?this.routes:this.routes.filter(e=>!e.pluginId||this.isEnabled(e.pluginId))}},ne=e({default:()=>x}),x={calendar:{deleteCalendarFailed:`The calendar could not be deleted.`,deleteEventFailed:`The event could not be deleted.`,saveCalendarFailed:`The calendar could not be saved.`,saveEventFailed:`The event could not be saved.`,endBeforeStart:`The event cannot end before it starts.`,saveConflict:`This event was changed on another device, so your edit was not saved. Close the editor and open the event again to see the latest version.`,loadFailed:`Could not load your calendar. Check your connection and try again.`,months:{0:`January`,1:`February`,2:`March`,3:`April`,4:`May`,5:`June`,6:`July`,7:`August`,8:`September`,9:`October`,10:`November`,11:`December`},monthsShort:{0:`Jan`,1:`Feb`,2:`Mar`,3:`Apr`,4:`May`,5:`Jun`,6:`Jul`,7:`Aug`,8:`Sep`,9:`Oct`,10:`Nov`,11:`Dec`},days:{0:`Sunday`,1:`Monday`,2:`Tuesday`,3:`Wednesday`,4:`Thursday`,5:`Friday`,6:`Saturday`},daysShort:{0:`Sun`,1:`Mon`,2:`Tue`,3:`Wed`,4:`Thu`,5:`Fri`,6:`Sat`},daysNarrow:{0:`S`,1:`M`,2:`T`,3:`W`,4:`T`,5:`F`,6:`S`},title:`Calendar`,myCalendars:`My Calendars`,addEvent:`Add Event`,rename:`Rename`,delete:`Delete`,addCalendar:`Add Calendar`,previousMonth:`Previous month`,nextMonth:`Next month`,renameCalendar:`Rename Calendar`,deleteCalendar:`Delete Calendar`,deleteCalendarConfirm:`Are you sure you want to delete the calendar "{name}"?`,calendarName:`Calendar Name`,searchResults:`Search Results`,noResults:`No events found matching your search.`,day:`Day`,week:`Week`,month:`Month`,year:`Year`,today:`Today`,allDay:`All Day`,noTitle:`(No title)`,location:`Location`,notes:`Notes`,editEvent:`Edit Event`,deleteEvent:`Delete Event`,deleteEventConfirm:`Are you sure you want to delete this event?`,newEvent:`New Event`,summary:`Summary`,eventTitle:`Event title`,calendar:`Calendar`,startDate:`Start Date`,endDate:`End Date`,time:`Time`,startTime:`Start Time`,endTime:`End Time`,addLocation:`Add location`,addDescription:`Add description`,description:`Description`,moreEvents:`+{count} more`,repeat:`Repeat`,repeatNone:`Do not repeat`,repeatDaily:`Daily`,repeatWeekly:`Weekly`,repeatMonthly:`Monthly`,repeatYearly:`Yearly`,repeatCustom:`Custom`},tasks:{title:`Tasks`,addTask:`Add Task`,newTask:`New Task`,editTask:`Edit Task`,allTasks:`All Tasks`,today:`Today`,upcoming:`Upcoming`,undated:`No Due Date`,completed:`Completed`,searchResults:`Search Results`,lists:`Lists`,newList:`New List`,listName:`List Name`,list:`List`,noTasks:`Nothing to do.`,noResults:`No tasks match your search.`,untitled:`(No title)`,titleField:`Title`,titlePlaceholder:`What needs doing?`,notes:`Notes`,addNotes:`Add notes`,due:`Due`,time:`Time`,allDay:`All Day`,status:`Status`,percentComplete:`Percent Complete`,priority:`Priority`,repeat:`Repeat`,repeatNeedsDue:`Add a due date to repeat this task.`,assignedBy:`Assigned by`,assignedTo:`Assigned to`,delete:`Delete`,deleteTask:`Delete Task`,deleteTaskConfirm:`Are you sure you want to delete this task?`,markDone:`Mark as done`,markNotDone:`Mark as not done`,repeats:`Repeats`,movedToNext:`Done. The task repeats, and is now due {date}.`,loadFailed:`Could not load your tasks. Check your connection and try again.`,someListsFailed:`Some lists could not be loaded, so not every task is shown.`,saveFailed:`The task could not be saved.`,saveConflict:`This task was changed on another device, so your edit was not saved. Close the editor and open the task again to see the latest version.`,completeFailed:`The task could not be updated.`,deleteFailed:`The task could not be deleted.`,createListFailed:`The list could not be created.`,assignTo:`Assign to`,notifyChanges:`The people this task is assigned to can be sent the changes.`,deleteTellAssignees:`The people this task is assigned to can be told it is cancelled.`,deleteTellAssigner:`Whoever assigned this task can be told you will not do it.`,groups:{overdue:`Overdue`,today:`Today`,week:`Next 7 Days`,undated:`No Due Date`,later:`Later`,completed:`Completed`},statuses:{needsAction:`Not Started`,inProcess:`In Progress`,completed:`Completed`,cancelled:`Cancelled`},priorities:{none:`None`,high:`High`,medium:`Medium`,low:`Low`}},invitations:{kinds:{invitation:`Invitation`,updated:`Updated invitation`,cancelled:`Cancelled`,reply:`Answer`,event:`Event`,task:`Task`},accept:`Accept`,maybe:`Maybe`,decline:`Decline`,yourAnswer:`Your answer`,organizer:`Organizer`,guests:`Guests`,calendar:`Calendar`,repeats:`Repeats`,conflictsWith:`Conflicts with {names}`,noConflicts:`No conflicts in your calendar`,statuses:{accepted:`Accepted`,tentative:`Maybe`,declined:`Declined`,needsAction:`Not answered`,delegated:`Delegated`,completed:`Completed`,inProcess:`In progress`},answered:{accepted:`{name} accepted.`,tentative:`{name} might attend.`,declined:`{name} declined.`,needsAction:`{name} has not answered yet.`,delegated:`{name} passed this on to someone else.`,completed:`{name} completed the task.`,inProcess:`{name} is working on the task.`},states:{organizer:`You organize this.`,notInvited:`None of your addresses is on the guest list, so you cannot answer this invitation.`,outdated:`Your calendar already has a newer version.`,update:`This is newer than the version in your calendar.`,cancel:`The organizer has cancelled this.`,cancelled:`The organizer has cancelled this. It is not in your calendar.`,reply:`This answer is not in your calendar yet.`,replied:`Your calendar has this answer.`,unknown:`This answer is about nothing in your calendar.`,add:`This is not in your calendar.`,added:`This is in your calendar.`,ended:`This event is over.`,unsupported:`This calendar message cannot be acted on here.`},unverified:`Sent from {sender}, who is not the organizer.`,unverifiedReply:`Sent from {sender}, not by the guest who answered.`,updateCalendar:`Update calendar`,removeFromCalendar:`Remove from calendar`,recordAnswer:`Record answer`,addToCalendar:`Add to calendar`,saved:`Saved to your calendar.`,sent:`Saved to your calendar, and your answer was sent to the organizer.`,sendFailed:`Saved to your calendar, but your answer could not be sent to the organizer.`,updated:`Your calendar has been updated.`,removed:`Removed from your calendar.`,added:`Added to your calendar.`,answerFailed:`Your answer could not be saved.`,applyFailed:`Your calendar could not be updated.`,organizedBy:`Organized by {name}`,notifyTitle:`Send updates to the guests?`,notifyChanges:`Your guests can be sent the changes to this event.`,send:`Send`,dontSend:`Don't send`,deleteTellGuests:`The guests can be told that this event is cancelled.`,deleteTellOrganizer:`The organizer can be told that you will not attend.`,deleteAndTell:`Delete and tell them`,deleteOnly:`Just delete`,notTold:`Done, but the email about it could not be sent.`,changedElsewhere:`This was changed on another device in the meantime. Open the message again to see where it stands.`}},re=e({default:()=>ie}),ie={contacts:{deleteFailed:{one:`{count} of {total} contacts could not be deleted.`,other:`{count} of {total} contacts could not be deleted.`},categoryRenameFailed:{one:`{count} of {total} contacts could not be updated, so the category was only partly renamed.`,other:`{count} of {total} contacts could not be updated, so the category was only partly renamed.`},categoryDeleteFailed:{one:`{count} of {total} contacts could not be updated, so the category was only partly removed.`,other:`{count} of {total} contacts could not be updated, so the category was only partly removed.`},categoryUpdateFailed:{one:`{count} of {total} contacts could not be updated.`,other:`{count} of {total} contacts could not be updated.`},deleteOneFailed:`The contact could not be deleted.`,categoryRenameOneFailed:`A contact could not be updated, so the category was only partly renamed.`,categoryDeleteOneFailed:`A contact could not be updated, so the category was only partly removed.`,categoryUpdateOneFailed:`The contact could not be updated.`,saveFailed:`The contact could not be saved.`,saveConflict:`This contact was changed on another device, so your edit was not saved. Cancel the edit to see the latest version.`,starFailed:`The contact could not be updated.`,unnamedContact:`Unnamed Contact`,title:`Contacts`,allContacts:`All Contacts`,favorites:`Favorites`,addContact:`Add Contact`,createCategory:`Create Category`,categoryName:`Category Name`,renameCategory:`Rename Category`,deleteCategory:`Delete Category`,deleteCategoryConfirm:`Are you sure you want to delete the category '{category}'? This will remove it from all contacts. No contacts will be deleted.`,rename:`Rename`,delete:`Delete`,create:`Create`,add:`Add`,newCategory:`New Category`,refreshContacts:`Refresh Contacts`,sortZa:`Sort Z-A`,sortAz:`Sort A-Z`,filterStarred:`Filter Starred`,uncategorized:`Uncategorized`,addToCategory:`Add to Category`,deleteContact:`Delete Contact`,deleteContactConfirm:`Are you sure you want to delete this contact?`,editContact:`Edit Contact`,save:`Save`,cancel:`Cancel`,noContacts:`No contacts found`,selectContact:`Select a contact to view details`,selectedContacts:{one:`{count} contact selected`,other:`{count} contacts selected`},clearSelection:`Clear selection`,selectAll:`Select All`,clearSearch:`Clear Search`,searchContacts:`Search contacts...`,details:`Details`,notes:`Notes`,name:`Name`,nickname:`Nickname`,organization:`Organization`,titleField:`Title`,email:`Email`,phone:`Phone`,address:`Address`,url:`URL`,birthday:`Birthday`,back:`Back`,toggleStar:`Toggle Star`,publicKey:`Public Key`,addEmail:`Add Email`,addPhone:`Add Phone`,typeDefault:`Default`,typeHome:`Home`,typeWork:`Work`,typeOther:`Other`,typeMobile:`Mobile`}},ae=e({default:()=>oe}),oe={settings:{gpg:`GPG Keys`},gpg:{toggleEncryption:`Toggle GPG Encryption`,decryptedSuccess:`The content of this message was end-to-end encrypted with GPG.`,decryptedFailed:`This message is encrypted but no matching private key is found on server to decrypt it.`,passphraseRequired:`GPG Passphrase Required`,passphraseSetTitle:`Set GPG Passphrase`,passphraseConfirmTitle:`Confirm GPG Passphrase`,passphrasePrompt:`Please enter your passphrase to unlock your private key.`,passphraseLockPrompt:`Please enter a new passphrase to encrypt your private key.`,passphraseConfirmPrompt:`Please re-enter your passphrase to confirm.`,passphrase:`Passphrase`,cancel:`Cancel`,unlock:`Unlock`,lock:`Set Passphrase`,confirm:`Confirm`,yourGpgKey:`Your GPG Key`,keyStoredSecurely:`You have a GPG keypair stored securely on the server. The private key is encrypted with your passphrase.`,publicKey:`Public Key`,purgeKeys:`Purge Keypair`,generateNewKeypair:`Generate New Keypair`,enableEncryptionDesc:`To enable end-to-end encryption between contacts that support it, you'll need a GPG keypair.`,noKeyPresent:`No key present`,passphraseRequiredLabel:`Passphrase (Required)`,generateKeysBtn:`Generate Keys`,importExistingKeys:`Import Existing GPG Keypair`,publicKeyBlock:`Public Key Block`,privateKeyBlock:`Private Key Block`,importUnencryptedDesc:`Paste your public and private key blocks, e.g. from "gpg --armor --export-secret-keys". If the private key is passphrase-protected, you'll be asked for its current passphrase, then to set a new one.`,importIncorrectPassphrase:`Incorrect passphrase for the private key. Please try again.`,importKeysBtn:`Import Keys`,purgeConfirm:`Are you sure you want to permanently delete your GPG keys from the server? Past encrypted emails will become unreadable.`,passphraseMissing:`Passphrase is required to encrypt your new private key.`,importMissing:`Both public and private blocks are required for import.`,generateFailed:`Failed to generate keys: {error}`,importFailed:`Import failed: {error}`,importFailedTitle:`Import Failed`,passphraseMismatch:`Passphrases do not match. Please try again.`,missingPublicKeys:`Cannot encrypt: Missing public keys for:
{keys}`,attachmentsNotEncryptable:`Attachments cannot be encrypted with inline PGP and would be sent unencrypted. Remove the attachments, or turn off encryption to send them.`}},se=e({default:()=>ce}),ce={settings:{categories:{filters:`Filters`,autoReply:`Auto-reply`}},managesieve:{title:`Filters`,description:`Add custom rules on how messages are processed and filed.`,loadError:`Could not load the filters.`,loadErrorRetry:`Try again`,tabs:{switchToRaw:`Raw Editor`},warningRawSwitchTitle:`Switch to Raw Mode`,warningRawSwitchConfirm:`Switch`,warningRawSwitch:`Switching to raw mode means the script will no longer be editable visually. Continue?`,toast:{saved:`Rules saved and activated.`,deactivated:`Rules deactivated.`,valid:`Script is valid!`,networkError:`Network error occurred.`,autoReplyOn:`The auto-reply is on. Switch it off under Auto-reply before the filters send a vacation reply of their own.`},visual:{newRule:`New Rule`,noRules:`No rules defined.`,saveFilters:`Save`,deleteRule:`Delete Rule`,remove:`Remove`,add:`Add`,if:`IF`,all:`ALL`,any:`ANY`,ofTheFollowing:`of the following conditions match`,then:`THEN`,value:`Value`,actions:{fileinto:`Move to folder`,discard:`Discard (Delete)`,redirect:`Redirect to email`,stop:`Stop evaluating rules`},fields:{subject:`Subject`,from:`From`,to:`To`,body:`Body`,size:`Size`,emailAddress:`Email Address`},operators:{contains:`Contains`,not_contains:`Does not contain`,is:`Is exactly`,not_is:`Is not exactly`,over:`Over`,under:`Under`}},raw:{validate:`Validate`,save:`Save`},autoReply:{title:`Auto-reply`,description:`Reply automatically to people who write to you while you are away.`,enable:`Send an auto-reply`,stateActive:`Replying to senders now.`,stateActiveUntil:`Replying to senders until {date}.`,stateScheduled:`Scheduled to start on {date}.`,stateFinished:`The end date has passed, so nobody is being replied to.`,subject:`Subject`,subjectDesc:`Optional. Left empty, the mail server chooses one.`,subjectPlaceholder:`Out of office`,message:`Message`,messageDesc:`What everyone who writes to you receives.`,messagePlaceholder:`I am away until the 15th and will reply when I am back.`,dates:`Dates`,datesDesc:`Optional. Leave a date empty to leave that end open. A day runs from midnight to midnight in your time zone.`,startDate:`Start date`,endDate:`End date`,interval:`Answer the same sender again after`,intervalDesc:`Someone who writes several times within that time gets one reply. Mailing lists and automated mail never get one.`,days:{one:`{count} day`,other:`{count} days`},save:`Save`,saved:`Auto-reply saved.`,turnedOff:`Auto-reply turned off.`,unsupported:`This mail server does not offer automatic replies.`,ownVacation:`Your filters already send an automatic reply of their own. Remove it in the raw editor under Filters to set one up here.`,errors:{emptyMessage:`Write the message senders will receive, or switch the auto-reply off.`,invalidWindow:`The start date cannot be after the end date.`,loadError:`Could not load the auto-reply.`,saveError:`Could not save the auto-reply.`}}}},le=e({default:()=>ue}),ue={settings:{categories:{password:`Password`},password:{title:`Password`,changePassword:`Change Password`,changePasswordDesc:`Update your account password.`,oldPassword:`Current Password`,newPassword:`New Password`,confirmPassword:`Confirm New Password`,updatePassword:`Update Password`,fillAllFields:`Please fill in all fields.`,passwordMismatch:`New passwords do not match.`}}},de={tags:{important:`Important`,work:`Work`,personal:`Personal`,todo:`To Do`,later:`Later`},settings:{saveFailed:`Could not save that setting — it may not survive signing out`,title:`Settings`,categories:{general:`General`,identity:`Identity`,reading:`Reading & Composing`,appearance:`Appearance`,localization:`Localization`,accounts:`Linked Accounts`,accountsDesc:`Pre-authorized accounts for quick switching between.`,webauthn:`2FA / WebAuthn`},loading:`Loading...`,placeholderName:`Your Name`,placeholderReplyTo:`reply@example.com`,general:{checkMailInterval:`Check mail interval`,checkMailIntervalDesc:`How often to automatically check for new mail.`,autoLogout:`Auto-logout`,autoLogoutDesc:`Automatically log out after inactivity.`,desktopNotifications:`Enable Desktop Notifications`,soundNotifications:`Play sound notification on new messages`,everyMinute:`Every minute`,every5Minutes:`Every 5 minutes`,every15Minutes:`Every 15 minutes`,every30Minutes:`Every 30 minutes`,never:`Never`,minutes15:`15 minutes`,minutes30:`30 minutes`,hour1:`1 hour`,hours2:`2 hours`,hours6:`6 hours`},identity:{displayName:`Display Name`,displayNameDesc:`The name shown to recipients when you send an email.`,signature:`Signature`,signatureDesc:`Appended to the end of your sent messages.`,replyTo:`Reply-To Address`,replyToDesc:`Optional: specify a different address for replies.`,bccMyself:`Always BCC myself on outgoing mail`},reading:{messagesPerPage:`Messages per page`,preferredView:`Preferred View`,preferredViewDesc:`How to display messages that have both HTML and Plain Text.`,showRemoteContent:`Show Remote Content`,composeFormat:`Compose Format`,html:`HTML`,plainText:`Plain Text`,alwaysAsk:`Always ask`,alwaysLoad:`Always load`,richText:`Rich Text (HTML)`,markReadTimeout:`Mark as Read`,markReadImmediately:`Immediately`,markRead1s:`After 1 second`,markRead3s:`After 3 seconds`,markRead5s:`After 5 seconds`,markRead10s:`After 10 seconds`,markReadNever:`Never mark automatically`,messageSortCriteria:`Message Sort Criteria`,messageSortCriteriaDesc:`Choose whether to sort by the original received date or by folder filing date.`,sortUid:`Folder Filing Date`,sortDate:`Received Date`,enableThreading:`Use threading`,themeIframeContent:`Apply theme to HTML messages content`,threadingNotSupported:`Not supported by your mail server`},appearance:{colorTheme:`Color Theme`,colorThemeDesc:`Select your preferred color palette.`,themeMode:`Theme Mode`,themeModeDesc:`Choose light, dark, or system auto.`,layoutMode:`Layout Mode`,layoutModeDesc:`Choose how you want your mailbox to be laid out.`,listDensity:`List Density`,listDensityDesc:`Adjust the spacing and compactness of the message list.`,light:`Light`,dark:`Dark`,systemAuto:`System Auto`,vertical:`Vertical (3 Panes)`,horizontal:`Horizontal (Top/Bottom)`,fullScreen:`Full Screen (Hide list when reading)`,loose:`Loose`,normal:`Normal`,compact:`Compact`,ultraCompact:`Ultra Compact`,showSenderAvatars:`Show sender avatars`,showSenderAvatarsDesc:`Pictures and initials beside senders in the message list and reader. Whether a sender is verified is shown either way.`},localization:{language:`Language`,timeFormat:`Time Format`,dateFormat:`Date Format`,weekStart:`First Day of the Week`,sunday:`Sunday`,monday:`Monday`,format12h:`12-hour (AM/PM)`,format24h:`24-hour`,english:`English`,german:`Deutsch`,italian:`Italiano`,spanish:`Español`,serbian:`Српски (ћирилица)`,serbianLatin:`Srpski (latinica)`,french:`Français`,portuguese:`Português`,danish:`Dansk`}},linkedAccounts:{description:`Connect another account to quickly switch between them without logging out.`,noAccounts:`No linked accounts.`,remove:`Remove`,addTitle:`Link Account`,linkAccount:`Link Account`,addedSuccess:`Account linked successfully.`,addError:`Failed to add account. Please check the credentials.`,removeConfirm:`Are you sure you want to remove this linked account?`,removedSuccess:`Account removed.`,removeError:`Failed to remove account.`,switchError:`Failed to switch account. The password might have changed.`},webauthn:{title:`Security Key Verification`,instruction:`Please use your security key to complete login.`,not_supported:`WebAuthn is not supported in your browser.`,requesting:`Requesting authentication...`,waiting_for_key:`Waiting for security key...`,verifying:`Verifying...`,success:`Verification successful, redirecting...`,verify_btn:`Verify Identity`,verifying_btn:`Verifying...`,back_to_login:`Back to Login`,key_name_placeholder:`Device name (e.g. YubiKey)`,name_key_title:`Name Security Key`,name_key_label:`Device Name`,add_key:`Add Security Key`,trust_linked:`Trust Linked Accounts`,trust_linked_desc:`If enabled, you can switch to this account from a linked account without providing a 2FA credential again.`,trust_linked_checkbox:`Allow switching to this account without 2FA`,trust_password_label:`Enter your password to confirm`,confirm_remove:`Are you sure you want to remove this security key?`,remove_password_label:`Enter your password to remove this security key`,errors:{begin_failed:`Failed to initiate authentication.`,invalid_options:`Invalid authentication options received.`,verification_failed:`Verification failed. Please try again.`,cancelled:`The security key was not used. Click "Verify Identity" to try again.`,unavailable:`The server could not check your security key just now. Please try again in a moment.`,register_failed:`There was an error registering your security key. Please try again.`,remove_failed:`Failed to remove the security key.`,wrong_password:`That password is not right.`,password_required:`Enter your current password.`,rate_limited:`Too many attempts. Please wait a few minutes and try again.`,two_factor_required:`Sign in with your security key to change this setting.`,no_security_key:`Add a security key first.`,trust_failed:`The setting could not be changed. Please try again.`,remove_unavailable:`The security key could not be removed just now. Please try again in a moment.`,general:`An error occurred.`},settings:{group_desc:`Secure your account with a hardware security key or biometrics.`,keys_title:`Security Keys`,noKeys:`No registered keys.`,added:`Added`,remove_btn:`Remove`,unnamed_key:`Security Key`}},print:{loading:`Loading print view...`},login:{subtitle:`Sign in to your webmail.`,emailPlaceholder:`Email Address`,passwordPlaceholder:`Password`,keepMeSignedIn:`Keep me signed in`,signIn:`Sign In`,tooManyAttempts:`Too many login attempts`,loginFailed:`Login failed. Please check your credentials.`,networkError:`Network error occurred. Please try again.`,pleaseWait:`Please wait`,wait:`Wait`,signedOut:`You have been signed out.`,signedOutDraftsKept:`You have been signed out. Some unsent drafts could not be saved to the server. They are kept on this device and reopen when you sign in again.`,sessionExpired:`Your session has expired. Please sign in again.`,secondFactorExpired:`Your sign-in timed out before the security key was checked. Please sign in again.`,inactivitySignedOut:`You've been signed out due to inactivity.`,inactivitySignedOutDraftsKept:`You've been signed out due to inactivity. Some unsent drafts could not be saved to the server. They are kept on this device and reopen when you sign in again.`},folderList:{compose:`Compose`,inbox:`Inbox`,drafts:`Drafts`,sent:`Sent`,archive:`Archive`,spam:`Spam`,junk:`Junk`,trash:`Trash`,allFolders:`All Folders`,title:`Folders`,rename:`Rename`,delete:`Delete`,createFolder:`Create Folder`,renameFolder:`Rename Folder`,folderName:`Folder name`,deleteFolder:`Delete Folder`,deleteFolderConfirm:`Are you sure you want to delete "{folder}"? All messages inside will be permanently deleted.`,expandSidebar:`Expand sidebar`,collapseSidebar:`Collapse sidebar`,moveToTrash:`Move to Trash`,moveToTrashConfirm:`Are you sure you want to move "{folder}" to the Trash?`,createSubfolder:`Create subfolder`,createSubfolderUnder:`Create Subfolder under "{folder}"`,subscribe:`Subscribe`,unsubscribe:`Unsubscribe`,order:`Order`,moveToTop:`Move to Top`,moveUp:`Move Up`,moveDown:`Move Down`,moveToBottom:`Move to Bottom`,more:`More`,less:`Less`,unsubscribedFolders:`Unsubscribed folders`},search:{placeholder:`Search mail`},messageList:{menu:`Menu`,selectAll:`Select all messages`,allOnPageSelected:{one:`{count} message on this page is selected`,other:`All {count} messages on this page are selected`},selectAllMatching:{one:`Select {count} in {folder}`,other:`Select all {count} in {folder}`},allMatchingSelected:{one:`{count} message in {folder} is selected`,other:`All {count} messages in {folder} are selected`},clearSelection:`Clear selection`,dragCount:{one:`{count} message`,other:`{count} messages`},checkNew:`Check for new messages`,sortDesc:`Sort descending by date`,sortAsc:`Sort ascending by date`,filterStarred:`Filter by starred`,filterUnread:`Filter by unread`,noMessages:`No messages`,loadError:`Could not load this folder.`,loadErrorRetry:`Try again`,loading:`Loading...`,unknownSender:`Unknown Sender`,unknown:`Unknown`,noSubject:`(No Subject)`,hasAttachments:`Has attachments`,replied:`Replied`,forwarded:`Forwarded`,searchResultsFor:`Search results for:`,clearSearch:`Clear search`,searchAllMailboxes:`Search All`,totalMessagesIn:{one:`{count} message in {folder}`,other:`{count} total messages in {folder}`},totalConversationsIn:{one:`{count} conversation in {folder}`,other:`{count} total conversations in {folder}`},deleteAllNow:`Delete All Now`,emptyMailboxTitle:`Empty {folder}`,emptyMailboxConfirm:{one:`Are you sure you want to permanently delete the one message in {folder}? This action cannot be undone.`,other:`Are you sure you want to permanently delete all {count} messages in {folder}? This action cannot be undone.`},emptyMailboxConfirmConversations:{one:`Are you sure you want to permanently delete the one conversation in {folder}, and every message in it? This action cannot be undone.`,other:`Are you sure you want to permanently delete all {count} conversations in {folder}, and every message in them? This action cannot be undone.`},emptyMailboxSelectionNote:{one:`This includes the message you have checked.`,other:`This includes the {count} messages you have checked.`},emptyingMailbox:`Emptying {folder}...`,mailboxEmptied:`{folder} emptied.`,emptyMailboxFailed:`Failed to empty {folder}.`,mailboxAlreadyEmpty:`{folder} was already empty — nothing was deleted.`,emptyMailboxSlow:`Still emptying {folder}. The server is working on it — check the folder again in a moment.`},composer:{discardFailed:`The draft could not be deleted from the server and is still in Drafts.`,attachmentsTooLarge:`Attachments exceed the maximum allowed size.`,draftSaveFailedKeepOpen:`Could not save this draft — the window stays open so nothing is lost`,attachmentsWait:`Please wait for attachments to finish uploading before sending.`,attachmentsGone:{one:`{count} attachment has to be added again: the server no longer has its upload.`,other:`{count} attachments have to be added again: the server no longer has their uploads.`},sending:`Message is being sent...`,undo:`Undo`,sendError:`Failed to send message: {error}`,presendFailed:`A security plugin could not process this message, so it was not sent.`},messageComposer:{fontSize:`Font Size`,small:`Small`,normal:`Normal`,large:`Large`,huge:`Huge`,bold:`Bold`,italic:`Italic`,underline:`Underline`,textColor:`Text Color`,align:`Align`,left:`Left`,center:`Center`,right:`Right`,numberedList:`Numbered List`,bulletedList:`Bulleted List`,indentMore:`Indent More`,indentLess:`Indent Less`,moreFormatting:`More Formatting`,undo:`Undo`,redo:`Redo`,quote:`Quote`,strikethrough:`Strikethrough`,clearFormatting:`Clear Formatting`,goToLink:`Go to link:`,change:`Change`,remove:`Remove`,text:`Text`,link:`Link`,apply:`Apply`,writeMessage:`Write your message...`},floatingComposer:{discardDraftTitle:`Discard Draft?`,discardDraftMessage:`Are you sure you want to discard this draft? This action cannot be undone.`,discard:`Discard`,dropFiles:`Drop files here to attach`,newMessage:`New Message`,saving:`Saving...`,autosaved:`Autosaved`,restore:`Restore`,minimize:`Minimize`,expand:`Expand`,saveAndClose:`Save & close`,to:`To`,cc:`Cc`,bcc:`Bcc`,subject:`Subject`,toggleFormatting:`Toggle Formatting Options`,attachFiles:`Attach Files`,insertLink:`Insert Link`,insertEmoji:`Insert Emoji`,send:`Send`,linkUrl:`Link URL`,linkUrlPlaceholder:`https://example.com`,displayText:`Display Text`,displayTextPlaceholder:`My Website`,apply:`Apply`,uploadFailed:`Failed to upload attachment: {error}`,unknownError:`Unknown error`},messageReader:{moreOptions:`More options`,tags:`Tags`,removeAllTags:`Remove all tags`,removeTag:`Remove tag`,selectMessage:`Select a message to read`,messagesSelected:{one:`{count} message selected`,other:`{count} messages selected`},back:`Back`,reply:`Reply`,replyAll:`Reply All`,forward:`Forward`,to:`To:`,cc:`Cc:`,date:`Date:`,undisclosed:`Undisclosed`,loadingMessage:`Loading message...`,remoteContentWarning:`This message contains remote content. For your privacy, it has been blocked.`,loadRemoteContent:`Load remote content`,isDraft:`This is a draft message.`,editDraft:`Edit Draft`,noRecipients:`(No Recipients)`,discardDraft:`Discard Draft`,noReadableText:`This message contains no readable text, only attachments.`,attachments:`Attachments`,downloadAllAttachments:`Download all attachments`,unknownAttachment:`Unknown attachment`,archive:`Archive`,reportSpam:`Report Spam`,notSpam:`Not Spam`,delete:`Delete`,deleteThread:`Delete conversation`,deleteConfirmSingle:`Are you sure you want to permanently delete this message? This action cannot be undone.`,deleteConfirmMultiple:`Are you sure you want to permanently delete these messages? This action cannot be undone.`,markUnread:`Mark as unread`,markRead:`Mark as read`,star:`Star`,moveTo:`Copy/Move to...`,print:`Print`,showPlaintext:`Show plaintext`,showHtml:`Show HTML`,downloadMessage:`Download message`,showOriginal:`Show original`,verifiedSender:`Verified Sender`,unverifiedSender:`Unverified Sender`,senderUnverifiedWarning:`Your mail server could not verify this sender. The message may not be from who it claims to be, so be careful with its links and attachments.`,clickToExpand:`Click to expand message content`,loadError:`Could not load this message.`,loadErrorRetry:`Try again`},address:{directionalControl:`hidden direction marks`,directionalControlTooltip:`Hidden direction marks can reorder how this address is displayed.`,mixedScript:`address mixes alphabets`,mixedScriptTooltip:`This address mixes letters from different alphabets, which can make it look like an address you know.`,mixedScriptAscii:`In ASCII, the domain {domain} is spelled {ascii}.`,unusualDomain:`unusual domain`,unusualDomainTooltip:`This domain is not a valid internet domain name and has characters outside plain ASCII, so it may not be the domain it looks like.`},originalMessage:{title:`Original Message`,loading:`Loading original message...`,errorMissingParams:`Missing mailbox or uid parameters`,errorFailedToFetch:`Failed to fetch original message`,messageId:`Message ID`,createdAt:`Created at`,from:`From`,to:`To`,subject:`Subject`,spf:`SPF`,dkim:`DKIM`,dmarc:`DMARC`,truncatedInfo:`Message is too large to display fully. Showing the first 64KB. Please use "Download Original" to view the entire message.`,downloadOriginal:`Download Original`,copyClipboard:`Copy to clipboard`,copiedTruncated:`Copied truncated content to clipboard.`,copied:`Copied to clipboard.`,copyFailed:`Failed to copy to clipboard.`,none:`NONE`,pass:`PASS`,fail:`FAIL`},folderSelector:{filter:`Filter folders...`,noResults:`No matching folders`,actionMove:`Move to`,actionCopy:`Copy to`},attachment:{remove:`Remove`,addAgain:`Add again`,preview:`Preview`,download:`Download`,zoomIn:`Zoom in`,zoomOut:`Zoom out`,rotate:`Rotate`,fitToScreen:`Fit to screen`,previous:`Previous`,next:`Next`,copyContent:`Copy content`,copied:`Copied!`,openInNewTab:`Open in new tab`,cannotPreview:`No preview available for this file type`,loadingPreview:`Loading preview...`,errorLoading:`Failed to load preview`,close:`Close`,uploadProgress:`{percent}% of {size}`},navigation:{messages:`Messages`,contacts:`Contacts`,calendar:`Calendar`,tasks:`Tasks`},userMenu:{settings:`Settings`,signOut:`Sign Out`,unsavedDraftsTitle:`Sign out with unsaved drafts?`,unsavedDraftsMessage:`A draft could not be saved to the server. If you sign out now, it stays on this device and reopens the next time you sign in to this account.`,signOutAnyway:`Sign out anyway`,profileOptions:`Profile options`},pagination:{previousPage:`Previous page`,nextPage:`Next page`,zeroMessages:`0 messages`,totalCount:`{total} total`,searchResults:{one:`{count} result`,other:`{count} results`},rangeOfTotal:`{start}–{end} of {total}`},toast:{messagePermanentlyDeleted:`Message permanently deleted`,draftDiscarded:`Draft discarded`,folderRenamed:`Folder renamed`,tagNotSupported:`That tag is not supported by this mail server`,flagChangeFailed:`Could not update the messages`,folderCreated:`Folder created`,folderExists:`A folder with that name already exists`,folderCreateFailed:`Could not create the folder`,folderRenameFailed:`Could not rename the folder`,folderDeleteFailed:`Could not delete the folder`,folderUndoFailed:`Could not undo that`,folderMovedToTrash:`Folder moved to Trash`,folderPermanentlyDeleted:`Folder permanently deleted`,undo:`Undo`,dismiss:`Dismiss`,messageMovedToFolder:`Message moved to {folder}`,messagesMovedToFolder:{one:`{count} message moved to {folder}`,other:`{count} messages moved to {folder}`},messageCopiedToFolder:`Message copied to {folder}`,messagesCopiedToFolder:{one:`{count} message copied to {folder}`,other:`{count} messages copied to {folder}`},draftsDiscarded:{one:`{count} draft discarded`,other:`{count} drafts discarded`},messagesPermanentlyDeleted:{one:`{count} message permanently deleted`,other:`{count} messages permanently deleted`},undoFailed:`Could not undo that`,messageDeleteFailed:`The message could not be deleted`,moveFailed:`Could not move that`,copyFailed:`Could not copy that`,subscribeFailed:`Could not subscribe`,unsubscribeFailed:`Could not unsubscribe`},mailboxPage:{mailboxNotFound:`Mailbox not found`,newMessages:`New Messages`,newMessagesSingleBody:`You have 1 new message`,newMessagesMultiBody:{one:`You have {count} new message`,other:`You have {count} new messages`},newMessagesInInbox:`New messages in Inbox`,newMessagesAvailable:`New messages available`,open:`Open`,refresh:`Refresh`,permanentlyDelete:`Permanently Delete?`,deletePermanently:`Delete Permanently`,discardDraftsTitle:`Discard Drafts?`,discardDraftsMessage:`Are you sure you want to discard these drafts? This action cannot be undone.`,undo:`Undo`},offline:{title:`Connection Lost`,description:`Network connectivity lost`,tryingAgain:{one:`Trying again in {count} second...`,other:`Trying again in {count} seconds...`}},update:{available:`A new version is available.`,reload:`Reload`},general:{error:`Error`,cancel:`Cancel`,save:`Save`,optional:`Optional`,delete:`Delete`,clear:`Clear`,showPassword:`Show password`,hidePassword:`Hide password`,previous:`Previous`,next:`Next`,expand:`Expand`,collapse:`Collapse`,moreOptions:`More options`,notFound:`Page not found`}},S={debug:(...e)=>{},info:(...e)=>{console.info(`[INFO]`,...e)},warn:(...e)=>{console.warn(`[WARN]`,...e)},error:(...e)=>{console.error(`[ERROR]`,...e)}},fe=`modulepreload`,pe=function(e){return`/`+e},me={},C=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=pe(t,n),t in me)return;me[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:fe,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})};function he(e,t){if(typeof e!=`object`||!e)return t;if(typeof t!=`object`||!t)return e;let n={...e};return Object.keys(t).forEach(r=>{typeof t[r]==`object`&&t[r]!==null&&!Array.isArray(t[r])&&r in e?n[r]=he(e[r],t[r]):n[r]=t[r]}),n}var ge=Object.assign({"../../../plugins/caldav/frontend/i18n/en.ts":ne,"../../../plugins/carddav/frontend/i18n/en.ts":re,"../../../plugins/gpg/frontend/i18n/en.ts":ae,"../../../plugins/managesieve/frontend/i18n/en.ts":se,"../../../plugins/password/frontend/i18n/en.ts":le}),_e={...de};for(let e in ge){let t=ge[e],n=t.default||t.en||{};_e=he(_e,n)}var ve=_e;function ye(e){return e===`rs`?`sr-Cyrl`:e===`sr`?`sr-Latn`:e}var be=class extends EventTarget{constructor(){super(),this.language=`en`,this.dictionary=ve,this.pluralRules=null,this.pluralRulesFor=``,this.applyDocumentLanguage()}applyDocumentLanguage(){document.documentElement.lang=this.getIntlLanguage()}async setLanguage(e){if(this.language===e)return;this.language=e;let t=ve;try{if(e!==`en`){let n={},r=Object.assign({"../i18n/da.ts":()=>C(()=>import(`./da-BAow0IbW.js`),[]),"../i18n/de.ts":()=>C(()=>import(`./de-DwLRYwIk.js`),[]),"../i18n/es.ts":()=>C(()=>import(`./es-BfDWvqXv.js`),[]),"../i18n/fr.ts":()=>C(()=>import(`./fr-B7IluI4F.js`),[]),"../i18n/it.ts":()=>C(()=>import(`./it-pI-Ww529.js`),[]),"../i18n/pt.ts":()=>C(()=>import(`./pt-svk-F2Yd.js`),[]),"../i18n/rs.ts":()=>C(()=>import(`./rs-D2x9uKEf.js`),[]),"../i18n/sr.ts":()=>C(()=>import(`./sr-DjqslGIG.js`),[])})[`../i18n/${e}.ts`];if(r){let t=await r();n=t.default||t[e]}else throw Error(`Locale file not found for ${e}`);let i=Object.assign({"../../../plugins/caldav/frontend/i18n/da.ts":()=>C(()=>import(`./da-Cr-DRLBJ.js`),[]),"../../../plugins/caldav/frontend/i18n/de.ts":()=>C(()=>import(`./de-BHco0W68.js`),[]),"../../../plugins/caldav/frontend/i18n/es.ts":()=>C(()=>import(`./es-CYXVbDoA.js`),[]),"../../../plugins/caldav/frontend/i18n/fr.ts":()=>C(()=>import(`./fr-DBIsBwuj.js`),[]),"../../../plugins/caldav/frontend/i18n/it.ts":()=>C(()=>import(`./it-DTjFi3oI.js`),[]),"../../../plugins/caldav/frontend/i18n/pt.ts":()=>C(()=>import(`./pt-C2vmH_uC.js`),[]),"../../../plugins/caldav/frontend/i18n/rs.ts":()=>C(()=>import(`./rs-dd8SdyY1.js`),[]),"../../../plugins/caldav/frontend/i18n/sr.ts":()=>C(()=>import(`./sr-CFl_RkuJ.js`),[]),"../../../plugins/carddav/frontend/i18n/da.ts":()=>C(()=>import(`./da-DiLpqLUX.js`),[]),"../../../plugins/carddav/frontend/i18n/de.ts":()=>C(()=>import(`./de-BilPbucA.js`),[]),"../../../plugins/carddav/frontend/i18n/es.ts":()=>C(()=>import(`./es-B6TdrJPp.js`),[]),"../../../plugins/carddav/frontend/i18n/fr.ts":()=>C(()=>import(`./fr-VqsOjlzZ.js`),[]),"../../../plugins/carddav/frontend/i18n/it.ts":()=>C(()=>import(`./it-BKzab5B5.js`),[]),"../../../plugins/carddav/frontend/i18n/pt.ts":()=>C(()=>import(`./pt-DMRThwQq.js`),[]),"../../../plugins/carddav/frontend/i18n/rs.ts":()=>C(()=>import(`./rs-C6JG_13D.js`),[]),"../../../plugins/carddav/frontend/i18n/sr.ts":()=>C(()=>import(`./sr-CJHvqyv_.js`),[]),"../../../plugins/gpg/frontend/i18n/da.ts":()=>C(()=>import(`./da-VfuZw887.js`),[]),"../../../plugins/gpg/frontend/i18n/de.ts":()=>C(()=>import(`./de-Bv7kiRCL.js`),[]),"../../../plugins/gpg/frontend/i18n/es.ts":()=>C(()=>import(`./es-BlswWhmN.js`),[]),"../../../plugins/gpg/frontend/i18n/fr.ts":()=>C(()=>import(`./fr-B_G5ulBt.js`),[]),"../../../plugins/gpg/frontend/i18n/it.ts":()=>C(()=>import(`./it-BG2yvbQQ.js`),[]),"../../../plugins/gpg/frontend/i18n/pt.ts":()=>C(()=>import(`./pt-COpzQSXV.js`),[]),"../../../plugins/gpg/frontend/i18n/rs.ts":()=>C(()=>import(`./rs-B97e2xom.js`),[]),"../../../plugins/gpg/frontend/i18n/sr.ts":()=>C(()=>import(`./sr-D39roWol.js`),[]),"../../../plugins/managesieve/frontend/i18n/da.ts":()=>C(()=>import(`./da-CbCiUiJ0.js`),[]),"../../../plugins/managesieve/frontend/i18n/de.ts":()=>C(()=>import(`./de-B-P7P5nA.js`),[]),"../../../plugins/managesieve/frontend/i18n/es.ts":()=>C(()=>import(`./es-27LLZM0m.js`),[]),"../../../plugins/managesieve/frontend/i18n/fr.ts":()=>C(()=>import(`./fr-B7d0AUk2.js`),[]),"../../../plugins/managesieve/frontend/i18n/it.ts":()=>C(()=>import(`./it-DzG_B6Fs.js`),[]),"../../../plugins/managesieve/frontend/i18n/pt.ts":()=>C(()=>import(`./pt-CtPhGfIz.js`),[]),"../../../plugins/managesieve/frontend/i18n/rs.ts":()=>C(()=>import(`./rs-CmJIC6qO.js`),[]),"../../../plugins/managesieve/frontend/i18n/sr.ts":()=>C(()=>import(`./sr-DmQ2ihkR.js`),[]),"../../../plugins/password/frontend/i18n/da.ts":()=>C(()=>import(`./da-DTslE69O.js`),[]),"../../../plugins/password/frontend/i18n/de.ts":()=>C(()=>import(`./de-Crx3Iq9j.js`),[]),"../../../plugins/password/frontend/i18n/es.ts":()=>C(()=>import(`./es-S8Jvtkbm.js`),[]),"../../../plugins/password/frontend/i18n/fr.ts":()=>C(()=>import(`./fr-Df_ZLwFe.js`),[]),"../../../plugins/password/frontend/i18n/it.ts":()=>C(()=>import(`./it-zmZvJD_q.js`),[]),"../../../plugins/password/frontend/i18n/pt.ts":()=>C(()=>import(`./pt-BPwMqsge.js`),[]),"../../../plugins/password/frontend/i18n/rs.ts":()=>C(()=>import(`./rs-DxQBgV3R.js`),[]),"../../../plugins/password/frontend/i18n/sr.ts":()=>C(()=>import(`./sr-ZRQnblGB.js`),[])}),a=[];for(let t in i)t.endsWith(`/${e}.ts`)&&a.push(i[t]());let o=await Promise.allSettled(a);for(let t of o){if(t.status===`rejected`){S.error(`Failed to load a plugin dictionary`,t.reason);continue}let r=t.value,i=r.default||r[e]||{};n=he(n,i)}t=n}}catch(n){S.error(`Failed to load language module for ${e}`,n),t=ve}this.language===e&&(this.dictionary=t,this.applyDocumentLanguage(),this.dispatchEvent(new CustomEvent(`change`)))}getLanguage(){return this.language}getIntlLanguage(){return ye(this.language)}pluralForm(e){let t=this.getIntlLanguage();return(this.pluralRulesFor!==t||!this.pluralRules)&&(this.pluralRules=new Intl.PluralRules(t),this.pluralRulesFor=t),this.pluralRules.select(e)}pickPluralForm(e,t){if(!e||typeof e!=`object`)return e;let n=e[typeof t?.count==`number`?this.pluralForm(t.count):`other`]??e.other;return typeof n==`string`?n:e}t(e,t){let n=e.split(`.`),r=this.dictionary;for(let e of n){if(r==null)break;r=r[e]}if(r=this.pickPluralForm(r,t),typeof r!=`string`){let i=ve;for(let e of n){if(i==null)break;i=i[e]}i=this.pickPluralForm(i,t),r=typeof i==`string`?i:e}return typeof r==`string`&&t?r.replace(/\{(\w+)\}/g,(e,n)=>t[n]===void 0?e:String(t[n])):r}},w=u(`i18n-store`);function xe(e){return document.querySelector(`meta[name="${e}"]`)?.content||null}var Se=()=>xe(`alps-default-theme`),Ce={migadu:`0 0 98 24`},we=()=>xe(`alps-login-logo-builtin`),Te=()=>xe(`alps-login-logo`),Ee=()=>xe(`alps-login-logo-dark`);function De(e){let t=e===`default`?Se()??`alps`:e;return ke[`${t}-light`]?t:`alps`}var Oe={"font-base":`-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,"font-heading":`"Source Serif 4", "Iowan Old Style", "Palatino Linotype", Georgia, serif`,"font-mono":`"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`,"font-label":`var(--font-mono)`,"radius-sm":`2px`,"radius-md":`3px`,"radius-lg":`4px`,"input-radius":`3px`,"btn-radius":`3px`},ke={"alps-light":{id:`alps-light`,name:`Alps Light`,isDark:!1,colors:{"bg-primary":`#ffffff`,"bg-secondary":`#f9fafb`,"bg-tertiary":`#f3f4f6`,"bg-selected":`#eff6ff`,"bg-starred":`#2563eb0f`,"text-primary":`#111827`,"text-sender-read":`#202020`,"text-secondary":`#4b5563`,"text-muted":`#9ca3af`,"border-color":`#e5e7eb`,"accent-color":`#2563eb`,"accent-hover":`#1d4ed8`,"accent-light":`#dbeafe`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`#f3f4f6`}},"alps-dark":{id:`alps-dark`,name:`Alps Dark`,isDark:!0,colors:{"bg-primary":`#1f2937`,"bg-secondary":`#111827`,"bg-tertiary":`#374151`,"bg-selected":`#1e3a8a`,"bg-starred":`#3b82f615`,"text-primary":`#f9fafb`,"text-sender-read":`#e5e7eb`,"text-secondary":`#d1d5db`,"text-muted":`#9ca3af`,"border-color":`#374151`,"accent-color":`#3b82f6`,"accent-hover":`#60a5fa`,"accent-light":`#1e3a8a`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(255, 255, 255, 0.1)`}},"nord-light":{id:`nord-light`,name:`Nord Light`,isDark:!1,colors:{"bg-primary":`#eceff4`,"bg-secondary":`#e5e9f0`,"bg-tertiary":`#d8dee9`,"bg-selected":`#81a1c133`,"bg-starred":`#5e81ac15`,"text-primary":`#2e3440`,"text-sender-read":`#3b4252`,"text-secondary":`#3b4252`,"text-muted":`#4c566a`,"border-color":`#d8dee9`,"accent-color":`#5e81ac`,"accent-hover":`#81a1c1`,"accent-light":`#81a1c133`,success:`#a3be8c`,warning:`#ebcb8b`,error:`#bf616a`,"hover-color":`rgba(0, 0, 0, 0.05)`}},"nord-dark":{id:`nord-dark`,name:`Nord Dark`,isDark:!0,colors:{"bg-primary":`#2e3440`,"bg-secondary":`#3b4252`,"bg-tertiary":`#434c5e`,"bg-selected":`#81a1c133`,"bg-starred":`#88c0d015`,"text-primary":`#eceff4`,"text-sender-read":`#e5e9f0`,"text-secondary":`#e5e9f0`,"text-muted":`#d8dee9`,"border-color":`#434c5e`,"accent-color":`#88c0d0`,"accent-hover":`#81a1c1`,"accent-light":`#81a1c133`,success:`#a3be8c`,warning:`#ebcb8b`,error:`#bf616a`,"hover-color":`rgba(255, 255, 255, 0.1)`}},"ocean-light":{id:`ocean-light`,name:`Ocean Light`,isDark:!1,colors:{"bg-primary":`#f8fafc`,"bg-secondary":`#f1f5f9`,"bg-tertiary":`#e2e8f0`,"bg-selected":`#e0f2fe`,"bg-starred":`#0ea5e915`,"text-primary":`#0f172a`,"text-sender-read":`#1e293b`,"text-secondary":`#334155`,"text-muted":`#64748b`,"border-color":`#cbd5e1`,"accent-color":`#0ea5e9`,"accent-hover":`#0284c7`,"accent-light":`#e0f2fe`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(0, 0, 0, 0.05)`}},"ocean-dark":{id:`ocean-dark`,name:`Ocean Dark`,isDark:!0,colors:{"bg-primary":`#0f172a`,"bg-secondary":`#1e293b`,"bg-tertiary":`#334155`,"bg-selected":`#0c4a6e`,"bg-starred":`#38bdf815`,"text-primary":`#f8fafc`,"text-sender-read":`#e2e8f0`,"text-secondary":`#cbd5e1`,"text-muted":`#94a3b8`,"border-color":`#334155`,"accent-color":`#38bdf8`,"accent-hover":`#0ea5e9`,"accent-light":`#0c4a6e`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(255, 255, 255, 0.1)`}},"migadu-light":{id:`migadu-light`,name:`Migadu Light`,isDark:!1,colors:{"bg-primary":`#f5f9ff`,"bg-secondary":`#eaf1fb`,"bg-tertiary":`#dce8f8`,"bg-selected":`#d7e4fb`,"bg-starred":`#1d4ed80d`,"text-primary":`#0b1938`,"text-sender-read":`#1c2f57`,"text-secondary":`#284173`,"text-muted":`#4a6595`,"border-color":`#c5d8f2`,"accent-color":`#1d4ed8`,"accent-hover":`#1e40af`,"accent-light":`#dbe6fd`,success:`#0a6e41`,warning:`#8c5200`,error:`#b82d15`,"hover-color":`rgba(34, 85, 221, 0.06)`},tokens:{...Oe,"accent-contrast":`#ffffff`,"bg-unread":`#1d4ed80b`,"bg-unread-hover":`#1d4ed814`,"scrollbar-thumb":`#b9ceec`,"scrollbar-thumb-hover":`#8fb0de`,"icon-inbox":`#1d4ed8`,"icon-sent":`#0a6e41`,"icon-drafts":`#8c5200`,"icon-spam":`#b82d15`,"icon-trash":`#4a6595`,"icon-archive":`#284173`,"icon-default":`#4a6595`}},"migadu-dark":{id:`migadu-dark`,name:`Migadu Dark`,isDark:!0,colors:{"bg-primary":`#0c1a3b`,"bg-secondary":`#08122b`,"bg-tertiary":`#172e63`,"bg-selected":`#163469`,"bg-starred":`#38bdf812`,"text-primary":`#f4f8ff`,"text-sender-read":`#d6e2f8`,"text-secondary":`#bfd3f5`,"text-muted":`#88a8e0`,"border-color":`#254380`,"accent-color":`#38bdf8`,"accent-hover":`#7dd3fc`,"accent-light":`#123a66`,success:`#34d399`,warning:`#fbbf24`,error:`#ff7a59`,"hover-color":`rgba(96, 165, 250, 0.08)`},tokens:{...Oe,"accent-contrast":`#08122b`,"bg-unread":`#38bdf80d`,"bg-unread-hover":`#38bdf817`,"scrollbar-thumb":`#254380`,"scrollbar-thumb-hover":`#4d7ad1`,"icon-inbox":`#38bdf8`,"icon-sent":`#34d399`,"icon-drafts":`#fbbf24`,"icon-spam":`#ff7a59`,"icon-trash":`#88a8e0`,"icon-archive":`#bfd3f5`,"icon-default":`#88a8e0`}}},Ae=`alps_active_user`,je={themeMode:`auto`,colorFamily:`default`,layoutMode:`vertical`,densityMode:`compact`,sidebarCollapsed:!1,enableThreading:!0,themeIframeContent:!1,showSenderAvatars:!0,checkMailInterval:5,autoLogout:30,desktopNotifications:!1,soundNotifications:!0,name:``,signature:``,replyTo:``,bccMyself:!1,messagesPerPage:50,preferredView:`html`,markReadTimeout:0,showRemoteContent:`ask`,composeFormat:`html`,undoTimeout:0,language:`en`,hourFormat:`24`,dateFormat:`YYYY-MM-DD`,weekStart:1,sortOrder:`desc`,messageSortCriteria:`date`,maxAttachmentMiB:32,customMailboxOrder:[],unsubscribedFolders:[]},Me={themeMode:{ui:!0,name:`themeMode`,value:e=>e.themeMode},colorFamily:{ui:!0,name:`colorFamily`,value:e=>e.colorFamily},layoutMode:{ui:!0,name:`layoutMode`,value:e=>e.layoutMode},densityMode:{ui:!0,name:`densityMode`,value:e=>e.densityMode},enableThreading:{ui:!0,name:`enableThreading`,value:e=>e.enableThreading},themeIframeContent:{ui:!0,name:`themeIframeContent`,value:e=>e.themeIframeContent},showSenderAvatars:{ui:!0,name:`showSenderAvatars`,value:e=>e.showSenderAvatars},customMailboxOrder:{ui:!0,name:`customMailboxOrder`,value:e=>e.customMailboxOrder},unsubscribedFolders:{ui:!0,name:`unsubscribedFolders`,value:e=>e.unsubscribedFolders},checkMailInterval:{name:`check_mail_interval`,value:e=>Number(e.checkMailInterval)||0},autoLogout:{name:`auto_logout`,value:e=>Number(e.autoLogout)||0},desktopNotifications:{name:`desktop_notifications`,value:e=>!!e.desktopNotifications},soundNotifications:{name:`sound_notifications`,value:e=>!!e.soundNotifications},name:{name:`from`,value:e=>e.name},signature:{name:`signature`,value:e=>e.signature},replyTo:{name:`reply_to`,value:e=>e.replyTo},bccMyself:{name:`bcc_myself`,value:e=>!!e.bccMyself},messagesPerPage:{name:`messages_per_page`,value:e=>Number(e.messagesPerPage)||50},preferredView:{name:`preferred_view`,value:e=>e.preferredView},markReadTimeout:{name:`mark_read_timeout`,value:e=>Number(e.markReadTimeout)||0},showRemoteContent:{name:`show_remote_content`,value:e=>e.showRemoteContent},composeFormat:{name:`compose_format`,value:e=>e.composeFormat},undoTimeout:{name:`undo_timeout`,value:e=>Number(e.undoTimeout)||0},language:{name:`language`,value:e=>e.language},hourFormat:{name:`hour_format`,value:e=>e.hourFormat},dateFormat:{name:`date_format`,value:e=>e.dateFormat},weekStart:{name:`week_start`,value:e=>Number(e.weekStart)===0?0:1},sortOrder:{name:`sort_order`,value:e=>e.sortOrder},messageSortCriteria:{name:`message_sort_criteria`,value:e=>e.messageSortCriteria}},Ne=e=>e in Me;function Pe(e,t){let n={};for(let r of t){let t=Me[r];if(t.ui){let r=n.ui??={};r[t.name]=t.value(e)}else n[t.name]=t.value(e)}return n}function Fe(e,t){let n=Me[t];return n.ui?e.ui?.[n.name]:e[n.name]}function Ie(e,t){return JSON.stringify(e??null)===JSON.stringify(t??null)}var Le=[5e3,3e4,12e4,3e5];function Re(e){let t=e.headers.get(`Retry-After`);if(!t)return null;let n=Number(t);if(Number.isFinite(n))return Math.max(0,n*1e3);let r=Date.parse(t);return Number.isNaN(r)?null:Math.max(0,r-Date.now())}var ze=e=>`alps_unsaved_settings_${e}`;function Be(e){let t=new Map;try{let n=localStorage.getItem(ze(e)),r=n?JSON.parse(n):null;if(r&&typeof r==`object`&&!Array.isArray(r))for(let[e,n]of Object.entries(r))Ne(e)&&n&&typeof n==`object`&&`value`in n&&t.set(e,n)}catch(e){S.error(`Failed to read unsaved settings`,e)}return t}var Ve=class extends EventTarget{constructor(){super(),this.initialFetchCompleted=!1,this.settingsReadFailed=!1,this.rereadInFlight=!1,this.unsaved=new Map,this.record=null,this.retryTimer=null,this.failures=0,this.epoch=0,this.saveInFlight=!1,this.savePending=!1,this.i18n=null,this.themeProperties=[],this.state=this.loadSettings(),this.applyTheme(),window.matchMedia(`(prefers-color-scheme: dark)`).addEventListener(`change`,()=>{this.state.themeMode===`auto`&&this.applyTheme()}),window.addEventListener(`session-cleared`,()=>{this.epoch++,this.initialFetchCompleted=!1,this.settingsReadFailed=!1,this.unsaved.clear(),this.record=null,this.cancelRetry(),this.failures=0,this.state=this.loadSettings(),this.applyTheme(),this.notify()}),window.addEventListener(`user-logged-in`,e=>{let t=e.detail?.username;this.epoch++,this.cancelRetry(),this.failures=0,this.initializeSession(t)}),window.addEventListener(`online`,()=>{this.unsaved.size===0||!this.initialFetchCompleted||(this.cancelRetry(),this._saveBackendSettings())}),this.initializeSession()}async initializeSession(e){let t=this.epoch;if(this.initialFetchCompleted=!1,this.record=null,e){this.state.loginUsername=e;try{let t=localStorage.getItem(Ae);localStorage.setItem(Ae,e),t!==e&&window.dispatchEvent(new CustomEvent(`alps-active-user-changed`))}catch(e){S.error(`Failed to record the active user`,e)}let t=this.loadSettings(e);this.state={...this.state,...t,loginUsername:e},this.adoptUnsaved(e),this.applyTheme(),this.notify()}let n=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`))||!!this.state.loginUsername||!!He(),r=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));if(!n&&!r){await this._fetchBackendSettings();return}if(!e)try{let e=await fetch(`/session`);if(t!==this.epoch)return;if(e.ok){let n=await e.json();if(t!==this.epoch)return;let r=n.Username||n.username,i=n.Address||void 0;if(r){this.state.loginUsername=r;try{let e=localStorage.getItem(Ae);localStorage.setItem(Ae,r),e!==r&&window.dispatchEvent(new CustomEvent(`alps-active-user-changed`))}catch(e){S.error(`Failed to record the active user`,e)}let e=this.loadSettings(r);this.state={...this.state,...e,loginUsername:r,loginAddress:i},this.adoptUnsaved(r),this.applyTheme(),this.notify()}}}catch(e){S.error(`Failed to fetch session username during initialization`,e)}await this._fetchBackendSettings()}adoptUnsaved(e){let t=Be(e);if(t.size===0)return;let n=this.state;for(let[e,r]of t)this.unsaved.has(e)||(this.unsaved.set(e,r),n[e]=r.value);this.saveSettings()}storeUnsaved(e=[]){let t=this.state.loginUsername;if(!t)return;let n=Be(t);for(let t of e)n.delete(t);for(let[e,t]of this.unsaved)n.set(e,t);try{n.size===0?localStorage.removeItem(ze(t)):localStorage.setItem(ze(t),JSON.stringify(Object.fromEntries(n)))}catch(e){S.error(`Failed to record unsaved settings`,e)}}markUnsaved(e){let t=this.state[e],n=this.unsaved.get(e);n?n.value=t:this.record?this.unsaved.set(e,{value:t,base:Fe(this.record,e)??null}):this.unsaved.set(e,{value:t})}yieldToRecord(e){if(this.unsaved.size===0)return;let t=[];for(let[n,r]of this.unsaved){let i=Fe(e,n)??null;`base`in r&&!Ie(i,r.base)?t.push(n):r.base=i}for(let e of t)this.unsaved.delete(e);this.storeUnsaved(t)}loadSettings(e){let t=e?`alps_settings_${e}`:null,n=t?localStorage.getItem(t):null,r={};if(n)try{r=JSON.parse(n)}catch(e){S.error(`Failed to parse user settings`,e)}let i=localStorage.getItem(`alps_settings`),a={};if(i)try{a=JSON.parse(i)}catch(e){S.error(`Failed to parse global settings`,e)}let o={...je,themeMode:r.themeMode??a.themeMode??je.themeMode,colorFamily:r.colorFamily??a.colorFamily??je.colorFamily,layoutMode:r.layoutMode??a.layoutMode??je.layoutMode,densityMode:r.densityMode??a.densityMode??je.densityMode,enableThreading:r.enableThreading??a.enableThreading??je.enableThreading,themeIframeContent:r.themeIframeContent??a.themeIframeContent??je.themeIframeContent,showSenderAvatars:r.showSenderAvatars??a.showSenderAvatars??je.showSenderAvatars,customMailboxOrder:r.customMailboxOrder??a.customMailboxOrder??je.customMailboxOrder,language:r.language??a.language??je.language,loginUsername:e,loginAddress:r.loginAddress};return n&&Object.assign(o,r),o}saveSettings(){let e=this.state.loginUsername||He();if(e){this.state.loginUsername||(this.state.loginUsername=e),localStorage.setItem(`alps_settings_${e}`,JSON.stringify(this.state));try{let t=localStorage.getItem(Ae);localStorage.setItem(Ae,e),t!==e&&window.dispatchEvent(new CustomEvent(`alps-active-user-changed`))}catch(e){S.error(`Failed to record the active user`,e)}}let t={themeMode:this.state.themeMode,colorFamily:this.state.colorFamily,language:this.state.language,layoutMode:this.state.layoutMode,densityMode:this.state.densityMode,enableThreading:this.state.enableThreading,themeIframeContent:this.state.themeIframeContent,showSenderAvatars:this.state.showSenderAvatars};localStorage.setItem(`alps_settings`,JSON.stringify(t))}notify(){this.dispatchEvent(new CustomEvent(`change`))}getState(){return this.state}get recordRead(){return this.initialFetchCompleted}async updateSettings(e){let t=this.state.loginUsername,n=e.loginUsername,r=n!==void 0&&n!==t?t===void 0?{...this.loadSettings(n),...this.state}:this.loadSettings(n):this.state;this.state={...r,...e},this.saveSettings(),(e.themeMode!==void 0||e.colorFamily!==void 0)&&this.applyTheme(),this.notify();let i=Object.keys(e).filter(e=>Ne(e)&&JSON.stringify(r[e])!==JSON.stringify(this.state[e]));if(i.length>0){for(let e of i)this.markUnsaved(e);return this.storeUnsaved(),this._saveBackendSettings()}}async _fetchBackendSettings(){let e=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`))||!!this.state.loginUsername||!!He(),t=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));if(!e&&!t){window.location.hash.startsWith(`#/login`)||window.dispatchEvent(new CustomEvent(`auth-error`)),this.initialFetchCompleted=!0;return}let n=this.epoch,r=!1,i=!1;try{let e=await fetch(`/settings`);if(n!==this.epoch)return;if(e.status===401){window.dispatchEvent(new CustomEvent(`auth-error`));return}if(e.ok){let t=await e.json();if(n!==this.epoch)return;i=!0;let a={};if(t.MaxAttachmentMiB!==void 0&&(a.maxAttachmentMiB=t.MaxAttachmentMiB),t.HasThreadCapability!==void 0&&(a.hasThreadCapability=t.HasThreadCapability,t.HasThreadCapability===!1&&(a.enableThreading=!1)),t.HasESearchCapability!==void 0&&(a.hasESearchCapability=t.HasESearchCapability),t&&t.Settings){let e=t.Settings;if(e.ui){let t=e.ui;t.themeMode&&(t.themeMode!==`auto`||!this.state.themeMode||this.state.themeMode===`auto`)&&(a.themeMode=t.themeMode),t.colorFamily&&(t.colorFamily!==`default`||!this.state.colorFamily||this.state.colorFamily===`default`)&&(a.colorFamily=t.colorFamily),t.layoutMode&&(a.layoutMode=t.layoutMode),t.densityMode&&(a.densityMode=t.densityMode),t.sidebarCollapsed!==void 0&&(a.sidebarCollapsed=t.sidebarCollapsed),t.enableThreading!==void 0&&(a.enableThreading=t.enableThreading),t.themeIframeContent!==void 0&&(a.themeIframeContent=t.themeIframeContent),t.showSenderAvatars!==void 0&&(a.showSenderAvatars=t.showSenderAvatars),t.customMailboxOrder!==void 0&&(a.customMailboxOrder=t.customMailboxOrder),a.unsubscribedFolders=Array.isArray(t.unsubscribedFolders)?t.unsubscribedFolders.filter(e=>typeof e==`string`):[]}e.check_mail_interval!==void 0&&e.check_mail_interval!==0&&(a.checkMailInterval=e.check_mail_interval),e.auto_logout!==void 0&&(a.autoLogout=e.auto_logout),e.desktop_notifications!==void 0&&(a.desktopNotifications=e.desktop_notifications),e.sound_notifications!==void 0&&(a.soundNotifications=e.sound_notifications),e.from!==void 0&&(a.name=e.from),e.signature!==void 0&&(a.signature=e.signature),e.reply_to!==void 0&&(a.replyTo=e.reply_to),e.bcc_myself!==void 0&&(a.bccMyself=e.bcc_myself),e.messages_per_page!==void 0&&e.messages_per_page!==0&&(a.messagesPerPage=e.messages_per_page),e.preferred_view!==void 0&&e.preferred_view!==``&&(a.preferredView=e.preferred_view),e.mark_read_timeout!==void 0&&(a.markReadTimeout=e.mark_read_timeout),e.show_remote_content!==void 0&&e.show_remote_content!==``&&(a.showRemoteContent=e.show_remote_content),e.compose_format!==void 0&&e.compose_format!==``&&(a.composeFormat=e.compose_format),e.undo_timeout!==void 0&&(a.undoTimeout=e.undo_timeout),e.language!==void 0&&e.language!==``&&(a.language=e.language),e.hour_format!==void 0&&e.hour_format!==``&&(a.hourFormat=e.hour_format),e.date_format!==void 0&&e.date_format!==``&&(a.dateFormat=e.date_format),e.week_start!==void 0&&(a.weekStart=Number(e.week_start)===0?0:1),e.sort_order!==void 0&&e.sort_order!==``&&(a.sortOrder=e.sort_order),e.message_sort_criteria!==void 0&&e.message_sort_criteria!==``&&(a.messageSortCriteria=e.message_sort_criteria),e.language||(r=!0),this.record=e,this.yieldToRecord(e);for(let e of this.unsaved.keys())delete a[e];if(Object.keys(a).length>0){let e=this.state.loginUsername||He();this.state={...this.state,...a},e&&!this.state.loginUsername&&(this.state.loginUsername=e),this.saveSettings(),this.applyTheme(),this.notify()}}}}catch(e){S.error(`Failed to fetch backend settings`,e)}finally{n===this.epoch&&(this.initialFetchCompleted=i,this.settingsReadFailed=!i)}n===this.epoch&&(r&&!this.unsaved.has(`language`)&&(this.markUnsaved(`language`),this.storeUnsaved()),i&&this.unsaved.size>0&&await this._saveBackendSettings())}async _saveBackendSettings(){if(!this.initialFetchCompleted){if(this.settingsReadFailed&&!this.rereadInFlight){this.rereadInFlight=!0;try{await this._fetchBackendSettings()}finally{this.rereadInFlight=!1}this.initialFetchCompleted||this.reportSaveFailure()}return}if(this.saveInFlight){this.savePending=!0;return}let e=[...this.unsaved.keys()];if(e.length===0)return;let t=this.epoch,n=Pe(this.state,e),r=new Map(e.map(e=>[e,this.state[e]]));this.saveInFlight=!0;try{let i=await this._putBackendSettings(n,t);if(i===`ended`||t!==this.epoch)return;if(i===`saved`)this.failures=0,this.cancelRetry(),this.noteSaved(n);else if(i!==`refused`){this.failures===0&&this.reportSaveFailure(),this.retryLater(i.retryAfterMs);return}else this.reportSaveFailure();let a=[];for(let t of e){let e=this.unsaved.get(t);e&&(Ie(this.state[t],r.get(t))?a.push(t):i===`saved`&&this.record&&(e.base=Fe(this.record,t)??null))}for(let e of a)this.unsaved.delete(e);this.storeUnsaved(a)}finally{this.saveInFlight=!1,this.savePending&&(this.savePending=!1,this._saveBackendSettings())}}retryLater(e){if(this.cancelRetry(),this.unsaved.size===0)return;let t=Le[Math.min(this.failures,Le.length-1)];this.failures++,this.retryTimer=setTimeout(()=>{this.retryTimer=null,this._saveBackendSettings()},Math.max(t,e??0))}cancelRetry(){this.retryTimer&&=(clearTimeout(this.retryTimer),null)}noteSaved(e){if(this.record)for(let[t,n]of Object.entries(e))t===`ui`?this.record.ui={...this.record.ui??{},...n}:this.record[t]=n}async _putBackendSettings(e,t){try{let n=await fetch(`/settings`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});return t===this.epoch?n.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),`ended`):n.ok?`saved`:(S.error(`Failed to save backend settings`,n.status),n.status>=500||n.status===408||n.status===429?{retryAfterMs:Re(n)}:`refused`):`ended`}catch(e){return S.error(`Failed to save backend settings`,e),t===this.epoch?{retryAfterMs:null}:`ended`}}reportSaveFailure(){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.translate(`settings.saveFailed`,`Could not save that setting — it may not survive signing out`),duration:6e3}}))}setI18n(e){this.i18n=e}translate(e,t){return this.i18n?.t(e)||t}applyTheme(){let e=!1;this.state.themeMode===`dark`?e=!0:this.state.themeMode===`auto`&&(e=window.matchMedia(`(prefers-color-scheme: dark)`).matches),e?document.body.classList.add(`theme-dark`):document.body.classList.remove(`theme-dark`);let t=ke[`${De(this.state.colorFamily)}-${e?`dark`:`light`}`];if(t){let e=document.documentElement.style;for(let t of this.themeProperties)e.removeProperty(t);let n={...t.colors,...t.tokens};this.themeProperties=Object.keys(n).map(e=>`--${e}`);for(let[t,r]of Object.entries(n))e.setProperty(`--${t}`,r)}}},T=u(`settings-store`);function He(){try{return localStorage.getItem(Ae)}catch{return null}}function Ue(e){return e?.loginAddress||e?.loginUsername||``}function We(){let e=(()=>{try{let e=localStorage.getItem(`alps_settings`);return e?JSON.parse(e):{}}catch{return{}}})(),t=He();if(!t)return e;try{let n=localStorage.getItem(`alps_settings_${t}`);return n?{...e,...JSON.parse(n)}:e}catch{return e}}function Ge(e=!0){let t=localStorage.getItem(`alps_settings`);if(t)try{let e=JSON.parse(t),n={};e.themeMode&&(n.themeMode=e.themeMode),e.colorFamily&&(n.colorFamily=e.colorFamily),e.language&&(n.language=e.language),e.layoutMode&&(n.layoutMode=e.layoutMode),e.densityMode&&(n.densityMode=e.densityMode),e.enableThreading!==void 0&&(n.enableThreading=e.enableThreading),e.themeIframeContent!==void 0&&(n.themeIframeContent=e.themeIframeContent),e.showSenderAvatars!==void 0&&(n.showSenderAvatars=e.showSenderAvatars),localStorage.setItem(`alps_settings`,JSON.stringify(n))}catch(e){S.error(`Failed to clear and preserve global settings`,e),localStorage.removeItem(`alps_settings`)}try{let e=localStorage.getItem(Ae);e&&localStorage.removeItem(`alps_settings_${e}`),e&&localStorage.removeItem(ze(e)),localStorage.removeItem(Ae)}catch(e){S.error(`Failed to clear the per-user settings record`,e)}if(!e)return;let n=`; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`+(window.location.protocol===`https:`?`; Secure`:``);document.cookie=`alps_logged_in=`+n,document.cookie=`alps_has_login_token=`+n}var Ke=1800*1e3,qe=`X-Alps-Build`,Je=`app-update-available`,Ye=`alps-update-chunk-reload`,Xe=60*1e3,Ze=`alps-update-taken`,Qe=600*1e3;function $e(e){try{let t=Number(sessionStorage.getItem(e)??0);return Number.isFinite(t)?t:0}catch{return 0}}function et(e,t){try{sessionStorage.setItem(e,String(t))}catch{}}function tt(e,t){let n=$e(e);return n>0&&Date.now()-n<t}function nt(e){let t=(e.get(`Cache-Control`)??``).toLowerCase();if(t.includes(`no-store`)||t.includes(`no-cache`))return!1;if(t.includes(`immutable`))return!0;let n=/(?:^|[\s,])(?:s-maxage|max-age)\s*=\s*(\d+)/.exec(t);return n!==null&&Number(n[1])>0}var rt=null,it=!1,at=!1,ot=!1,st=!1,ct=!1,lt=null,ut=null;function dt(e){let t=e.headers.get(qe);if(!(!t||nt(e.headers))){if(rt===null){rt=t;return}if(t!==rt&&!at&&(at=!0,it=!0,S.info(`A new build is served (${rt} → ${t}).`)),!(!at||ot)){if(tt(Ze,Qe)){st||(st=!0,S.warn(`Not offering it yet: this tab already reloaded for an update.`));return}if(ot=!0,document.hidden){ct=!0;return}window.dispatchEvent(new CustomEvent(Je))}}}function ft(){document.addEventListener(`visibilitychange`,gt),window.addEventListener(`vite:preloadError`,_t),document.hidden&&gt()}var pt=null;function mt(e){pt=e}function ht(){return pt!==null&&pt()}function gt(){if(document.hidden){lt=Date.now(),ut&&clearTimeout(ut),ut=setTimeout(()=>{it&&!ht()&&yt()},Ke);return}ut&&clearTimeout(ut),ut=null;let e=lt===null?0:Date.now()-lt;if(lt=null,it&&e>=Ke&&!ht()){yt();return}ct&&(ct=!1,window.dispatchEvent(new CustomEvent(Je)))}function _t(e){e.preventDefault(),S.warn(`A lazily loaded chunk is missing; the server was likely upgraded.`),it=!0,!(ht()||tt(Ye,Xe))&&(et(Ye,Date.now()),yt())}function vt(){et(Ze,Date.now()),yt()}function yt(){window.location.reload()}function bt(e){return encodeURIComponent(encodeURIComponent(e))}var E=class extends Error{constructor(e,t){super(t),this.name=`HttpStatusError`,this.status=e}};function xt(e){return e instanceof E&&e.status===412}function St(e){return!(e instanceof E)||e.status>=500||e.status===408}function Ct(e){return e instanceof E&&e.status===401}var wt={headers:{"X-Alps-Background":`1`}},Tt=new Set([502,503,504]),Et=[250,1e3],Dt=e=>new Promise(t=>setTimeout(t,e)),Ot=0,kt=[];function At(){Ot--,!(Ot>0||kt.length===0)&&setTimeout(()=>{if(Ot>0)return;let e=kt;kt=[],e.forEach(e=>e())},0)}function jt(){return Ot===0?Promise.resolve():new Promise(e=>kt.push(e))}async function D(e,t={},n=25e3,{background:r=!1}={}){if(r)return Mt(e,t,n);Ot++;try{return await Mt(e,t,n)}finally{At()}}async function Mt(e,t,n){let r=(t.method??(e instanceof Request?e.method:`GET`)).toUpperCase()===`GET`?Et.length+1:1,i,a;for(let o=0;o<r;o++){let s=o===r-1,c=new AbortController;a=c;let l=setTimeout(()=>c.abort(),n);try{i=await fetch(e,{...t,signal:c.signal})}catch(e){if(e instanceof TypeError&&!s){await Dt(Et[o]);continue}throw(e instanceof TypeError||e.name===`AbortError`)&&window.dispatchEvent(new CustomEvent(`network-error`)),e}finally{clearTimeout(l)}if(Tt.has(i.status)&&!s){c.abort(),await Dt(Et[o]);continue}break}let o=a;return setTimeout(()=>o.abort(),n),Tt.has(i.status)&&window.dispatchEvent(new CustomEvent(`network-error`)),i.status===401&&window.dispatchEvent(new CustomEvent(`auth-error`)),dt(i),i}function Nt(e){return n`<bdi dir="ltr">${e}</bdi>`}function Pt(e,t){return e?n`<bdi>${e}</bdi>`:Nt(t)}function Ft(e){return e.name?n`<bdi>${e.name}</bdi> &lt;${Nt(e.email)}&gt;`:Nt(e.email)}function It(e){return e.map((e,t)=>n`${t?`, `:``}${Ft(e)}`)}function Lt(e,t,n){let r=Object.fromEntries(Object.keys(n).map(e=>[e,`{${e}}`]));return(e?.t(t,r)??t).split(/\{(\w+)\}/).map((e,t)=>t%2==0?e:n[e]??`{${e}}`)}function Rt(e){return e.replace(/\p{Bidi_Control}/gu,``)}function zt(e){if(!e||/[\s/\\?#:@%\[\]]/u.test(e))return null;try{let t=new URL(`http://${e}`).hostname.replace(/\.$/,``).toLowerCase();return/^\d+\.\d+\.\d+\.\d+$/.test(t)?null:t.length<=253&&/^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/.test(t)?t:null}catch{return null}}function Bt(e){if(!e.startsWith(`xn--`)||e.length>63)return e;let t=e.slice(4),n=t.lastIndexOf(`-`),r=n<0?[]:Array.from(t.slice(0,n),e=>e.charCodeAt(0)),i=n<0?0:n+1,a=128,o=0,s=72;try{for(;i<t.length;){let n=o,c=1;for(let n=36;;n+=36){if(i>=t.length)return e;let r=t.charCodeAt(i++),a=r>=97&&r<=122?r-97:r>=48&&r<=57?r-22:36;if(a>=36||!Number.isSafeInteger(o+a*c))return e;o+=a*c;let l=n<=s?1:n>=s+26?26:n-s;if(a<l)break;c*=36-l}let l=Math.floor((o-n)/(n===0?700:2));l+=Math.floor(l/(r.length+1));let u=0;for(;l>455;)l=Math.floor(l/35),u+=36;if(s=u+Math.floor(36*l/(l+38)),a+=Math.floor(o/(r.length+1)),o%=r.length+1,a>1114111||a>=55296&&a<=57343)return e;r.splice(o++,0,a)}let n=String.fromCodePoint(...r);return zt(`${n}.example`)===`${e}.example`?n:e}catch{return e}}var Vt=`Latin.Cyrillic.Greek.Han.Hiragana.Katakana.Bopomofo.Hangul.Arabic.Hebrew.Devanagari.Bengali.Thai.Armenian.Georgian.Tamil.Telugu.Gujarati.Gurmukhi.Kannada.Malayalam.Sinhala.Lao.Khmer.Myanmar.Ethiopic`.split(`.`).map(e=>[e,RegExp(`\\p{Script_Extensions=${e}}`,`u`)]);function Ht(e){return/[\p{Number}\p{Punctuation}\p{Symbol}]/u.test(e)?null:Vt.find(([,t])=>t.test(e))?.[0]??(/\p{Mark}/u.test(e)?null:`other`)}function Ut(e){if(/[\p{Cc}\p{Cf}\p{Z}]/u.test(e))return!1;let t=new Set(Array.from(e.normalize(`NFC`),Ht).filter(e=>e!==null));return t.has(`other`)?!1:t.size<=1?!0:[[`Latin`,`Han`,`Hiragana`,`Katakana`],[`Latin`,`Han`,`Bopomofo`],[`Latin`,`Han`,`Hangul`]].some(e=>[...t].every(t=>e.includes(t)))}var Wt=/[.。．｡]/;function Gt(e,t){let n=e.replace(RegExp(`${Wt.source}$`),``).split(Wt),r=t.split(`.`);return n.length===r.length&&n.every((e,t)=>{let n=e.toLowerCase().normalize(`NFC`);return n===r[t]||n===Bt(r[t])})}function Kt(e){let t=zt(e);if(t===null||!Gt(e,t))return{text:e,ascii:e,warning:/^[\x20-\x7e]*$/.test(e)?null:`unusual-domain`};let n=null;return{text:t.split(`.`).map(e=>{let t=Bt(e);return Ut(t)?t:(n=`mixed-script-domain`,e)}).join(`.`),ascii:t,warning:n}}function qt(e){if(/[\s<>\p{Cc}\p{Cf}]/u.test(e)||e.length>320)return null;let t=e.split(`@`);if(t.length!==2||!t[0])return null;let n=zt(t[1]);return n===null||!Gt(t[1],n)?null:`${t[0]}@${n}`}var Jt=/\p{Bidi_Control}/gu;function Yt(e){let t=[];/\p{Bidi_Control}/u.test(e)&&t.push(`directional-control`);let n=e.lastIndexOf(`@`);if(n<0)return t;Ut(e.slice(0,n).replace(Jt,``))||t.push(`mixed-script-local`);let r=Kt(e.slice(n+1).replace(Jt,``)).warning;return r&&t.push(r),t}function Xt(e){let t=Yt(e)[0]??null,n=e.lastIndexOf(`@`);if(n<0)return{text:e,ascii:e,warning:t};let r=e.slice(0,n),i=Kt(e.slice(n+1));return{text:`${r}@${i.text}`,ascii:`${r}@${i.ascii}`,warning:t}}function Zt(e){let t=e.trim();if(t.endsWith(`>`)){let e=t.lastIndexOf(`<`);if(e!==-1){let n=t.slice(e+1,-1).trim(),r=t.slice(0,e).trim();return r=/^".*"$/s.test(r)?r.slice(1,-1).replace(/\\(.)/gs,`$1`).trim():r.replace(/^["']|["']$/g,``).trim(),{name:r,email:n}}}return{name:``,email:t}}var Qt=/[()<>[\]:;@\\,."]|=\?/;function $t(e,t){return e?Qt.test(e)?`"${e.replace(/["\\]/g,`\\$&`)}" <${t}>`:`${e} <${t}>`:t}function en(e){let t=e.trim(),n=t.endsWith(`>`)?t.lastIndexOf(`<`):-1,r=n===-1?t:t.slice(n+1,-1).trim(),i=qt(r);return i===null||i===r?t:n===-1?i:`${t.slice(0,n+1)}${i}>`}function tn(e){let t=Xt(e),r=t.text.lastIndexOf(`@`);return Yt(e).includes(`mixed-script-local`)?Nt(n`${Array.from(t.text.slice(0,r),e=>/[^\x00-\x7f]/.test(e)&&!/\p{Bidi_Control}/u.test(e)?n`<mark class="mixed-script">${e}</mark>`:e)}${t.text.slice(r)}`):Nt(t.text)}var nn=_`
  .address-warning {
    unicode-bidi: isolate;
    margin-inline-start: .35em;
    font-size: .85em;
    white-space: nowrap;
  }
  mark.mixed-script {
    background: color-mix(in srgb, var(--warning, #f59e0b) 25%, var(--bg-primary, #ffffff));
    color: inherit;
    text-decoration: underline;
  }
`;function rn(e,t){return e.replace(/\{(\w+)\}/g,(e,n)=>t[n]??e)}function an(e,t){switch(e){case`directional-control`:return{label:t?.t(`address.directionalControl`)??de.address.directionalControl,tooltip:t?.t(`address.directionalControlTooltip`)??de.address.directionalControlTooltip};case`mixed-script-local`:case`mixed-script-domain`:return{label:t?.t(`address.mixedScript`)??de.address.mixedScript,tooltip:t?.t(`address.mixedScriptTooltip`)??de.address.mixedScriptTooltip};case`unusual-domain`:return{label:t?.t(`address.unusualDomain`)??de.address.unusualDomain,tooltip:t?.t(`address.unusualDomainTooltip`)??de.address.unusualDomainTooltip}}}function on(e,t){let r=Yt(e);if(!r.length)return``;let i=an(r[0],t).label,a=[...new Set(r.map(e=>an(e,t).tooltip))],o=e.slice(e.lastIndexOf(`@`)+1).replace(Jt,``),s=Kt(o);if(s.warning===`mixed-script-domain`&&o.toLowerCase()!==s.ascii){let e={domain:o,ascii:s.ascii};a.push(t?.t(`address.mixedScriptAscii`,e)??rn(de.address.mixedScriptAscii,e))}return n`<span class="address-warning" title=${a.join(`
`)}>⚠ ${i}</span>`}function sn(e){return e.status===`completed`||e.status===`cancelled`}function cn(e){if(!e.due)return null;let t=new Date(e.due);return Number.isNaN(t.getTime())?null:e.allDay?new Date(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate()):t}var ln=[`overdue`,`today`,`week`,`undated`,`later`,`completed`];function un(e,t=new Date){if(sn(e))return`completed`;let n=cn(e);if(!n)return`undated`;let r=new Date(t.getFullYear(),t.getMonth(),t.getDate()),i=new Date(t.getFullYear(),t.getMonth(),t.getDate()+1),a=new Date(t.getFullYear(),t.getMonth(),t.getDate()+7);return n<r?`overdue`:n<i?`today`:n<a?`week`:`later`}function dn(e){return e.priority&&e.priority>0?e.priority:10}function fn(e,t){let n=cn(e)?.getTime()??1/0,r=cn(t)?.getTime()??1/0;if(n!==r)return n-r;let i=dn(e)-dn(t);return i===0?e.title.localeCompare(t.title):i}function pn(e,t){let n=cn(e)?.getTime(),r=cn(t)?.getTime();return n===r?e.title.localeCompare(t.title):n===void 0?1:r===void 0?-1:r-n}function mn(e){return!e||e<1?null:e<=4?`high`:e===5?`medium`:`low`}function hn(e){if(e)return e===`rs`?`sr-Cyrl`:e===`sr`?`sr-Latn`:e}function gn(e,t,n,r){let i=cn(e);if(!i)return``;let a=i.getFullYear()===t.getFullYear()&&i.getMonth()===t.getMonth()&&i.getDate()===t.getDate(),o={hour:`2-digit`,minute:`2-digit`},s={month:`short`,day:`numeric`,...i.getFullYear()===t.getFullYear()?{}:{year:`numeric`}};return a?e.allDay?n:i.toLocaleTimeString(r,o):e.allDay?i.toLocaleDateString(r,s):i.toLocaleString(r,{...s,...o})}function _n(e){return e===`completed`?`closed`:`active`}function vn(e,t,n=new Date){let r=un(e,n);switch(t){case`today`:return r===`overdue`||r===`today`;case`upcoming`:return r===`week`||r===`later`;case`undated`:return r===`undated`;case`completed`:return r===`completed`;default:return r!==`completed`}}var yn=new class{async fetchTasks(e){let t=await D(e?`/calendar/tasks?scope=${e}`:`/calendar/tasks`);if(!t.ok)throw new E(t.status,`Failed to fetch tasks`);let n=await t.json();return{tasks:n.tasks??[],calendars:n.calendars??[],failedCalendars:n.failedCalendars??0,scheduling:n.scheduling}}createTask(e){return this.send(`/calendar/tasks`,e,`Failed to create task`)}updateTask(e,t){return this.send(`/calendar/tasks/${bt(e)}/edit`,t,`Failed to update task`)}completeTask(e,t,n){return this.send(`/calendar/tasks/${bt(e)}/complete`,{done:t,lang:n},`Failed to update task`)}async deleteTask(e,t={}){let n=new URLSearchParams;t.notify===!1&&n.set(`notify`,`0`),t.lang&&n.set(`lang`,t.lang);let r=n.toString()?`?${n.toString()}`:``,i=await D(`/calendar/tasks/${bt(e)}${r}`,{method:`DELETE`});if(!i.ok)throw new E(i.status,`Failed to delete task`);return i.json().catch(()=>({}))}async send(e,t,n){let r=await D(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!r.ok)throw new E(r.status,n);return r.json()}};function bn(e){return!e.components?.length||e.components.some(e=>e.toUpperCase()===`VEVENT`)}function xn(e){let t=e.trim(),n=/^(.*)<([^<>\s]+@[^<>\s]+)>$/.exec(t);if(n){let{name:e}=Zt(t);return e?{email:n[2],name:e}:{email:n[2]}}return/^[^\s@<>]+@[^\s@<>]+$/.test(t)?{email:t}:null}function Sn(e){let t=e.name?.replace(/"/g,``).trim();return t?`"${t.replace(/\\/g,`\\\\`)}" <${e.email}>`:e.email}function Cn(e,t){return!!e&&wn({role:e.role,attendees:e.attendees,status:e.answer},t)}function wn(e,t){return!e||t===`server`||e.ended?!1:e.role===`organizer`?(e.attendees?.length??0)>0:e.role===`attendee`&&e.status!==`declined`}var Tn=[`#2563eb`,`#16a34a`,`#d97706`,`#dc2626`,`#9333ea`,`#0891b2`,`#db2777`,`#ea580c`];function En(e){let t=0;for(let n=0;n<e.length;n++)t=e.charCodeAt(n)+((t<<5)-t);return Tn[Math.abs(t)%Tn.length]}function Dn(e){return e.allDay===!0}var On=class{async fetchCalendars(){let e=await D(`/calendar/calendars`);if(!e.ok)throw Error(`Failed to fetch calendars`);return e.json()}async fetchEvents(e,t,n){let r=new URLSearchParams;r.append(`start`,e.toISOString()),r.append(`end`,t.toISOString()),n&&r.append(`query`,n);let i=await D(`/calendar/events?${r.toString()}`);if(!i.ok)throw Error(`Failed to fetch events`);return i.json()}async createCalendar(e,t){let n=await D(`/calendar/calendars`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t?{name:e,components:t}:{name:e})});if(!n.ok)throw new E(n.status,`Failed to create calendar`);return n.json()}async renameCalendar(e,t){let n=await D(`/calendar/calendars/${bt(e)}`,{method:`PATCH`,headers:{"Content-Type":`application/json`},body:JSON.stringify({name:t})});if(!n.ok)throw Error(`Failed to rename calendar`);return n.json()}async deleteCalendar(e){let t=await D(`/calendar/calendars/${bt(e)}`,{method:`DELETE`});if(!t.ok)throw Error(`Failed to delete calendar`);return t.json()}async createEvent(e){let t=await D(`/calendar/events`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(!t.ok)throw new E(t.status,`Failed to create event`);return t.json()}async updateEvent(e,t){let n=await D(`/calendar/events/${bt(e)}/edit`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!n.ok)throw new E(n.status,`Failed to update event`);return n.json()}async respondToEvent(e,t,n){let r=await D(`/calendar/${e.task?`tasks`:`events`}/${bt(e.path)}/respond`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({status:t,etag:e.etag,lang:n})});if(!r.ok)throw new E(r.status,`Failed to answer the invitation`);return r.json()}async deleteEvent(e,t={}){let n=bt(e),r=new URLSearchParams;t.notify===!1&&r.set(`notify`,`0`),t.lang&&r.set(`lang`,t.lang);let i=await D(`/calendar/events/${n}${r.toString()?`?${r.toString()}`:``}`,{method:`DELETE`});if(!i.ok)throw Error(`Failed to delete event`);return i.json()}},kn=e=>`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`;function An(e){let t=[];for(let n of e){let e=cn(n);if(!e||sn(n))continue;let r=new Date(e.getFullYear(),e.getMonth(),e.getDate()+1);t.push({uid:n.uid,summary:n.title,start:`${kn(e)}T00:00:00Z`,end:`${kn(r)}T00:00:00Z`,allDay:!0,path:n.path,calendarPath:n.calendarPath,task:n})}return t}function jn(e,t=1){let n=new Date(e),r=(n.getDay()-t+7)%7;return n.setDate(n.getDate()-r),n.setHours(0,0,0,0),n}var Mn=new On,O=`INBOX`,Nn=`Drafts`,Pn=`Sent`,Fn=`Archive`,In=`Archives`,Ln=`Spam`,Rn=`Junk`,zn=`Trash`;function k(e){return encodeURIComponent(encodeURIComponent(e))}var Bn={"\\inbox":`inbox`,"\\drafts":`drafts`,"\\sent":`sent`,"\\archive":`archive`,"\\junk":`junk`,"\\trash":`trash`,"\\all":`all`},Vn={[O.toLowerCase()]:`inbox`,[Nn.toLowerCase()]:`drafts`,[Pn.toLowerCase()]:`sent`,[Fn.toLowerCase()]:`archive`,[In.toLowerCase()]:`archive`,[Ln.toLowerCase()]:`junk`,[Rn.toLowerCase()]:`junk`,[zn.toLowerCase()]:`trash`,"deleted items":`trash`};function Hn(e,t){return Object.hasOwn(e,t)?e[t]:null}function Un(e,t){if(!e)return null;let n=(Array.isArray(e.Attrs)?e.Attrs:[]).map(e=>typeof e==`string`?e.toLowerCase():``);for(let e of n){let t=Hn(Bn,e);if(t)return t}if(n.includes(`\\noselect`)||n.includes(`\\nonexistent`))return null;let r=Hn(Vn,(e.Name||e.Mailbox||``).toLowerCase());return r&&t?.has(r)?null:r}function Wn(e,t=[]){if(!e)return null;let n=Jn(t),r=(t||[]).find(t=>(t?.Name||t?.Mailbox)===e);if(r)return Un(r,n);let i=Hn(Vn,e.toLowerCase());return i&&n.has(i)?null:i}function Gn(e,t,n){let r=Jn(t),i=(t||[]).find(t=>Un(t,r)===e);return i&&(i.Name||i.Mailbox)||n}function Kn(e,t=[]){let n=Jn(t),r=e=>e.Name||e.Mailbox||``,i=(t||[]).filter(t=>Un(t,n)===e),a=i.find(e=>tr(r(e),er(e,`.`)).length===1)??i[0];return a?r(a):null}function qn(e,t=[]){let n=Wn(e,t);if(!n)return null;let r=Kn(n,t);return r===null||r===e?n:null}function Jn(e=[]){let t=new Set;for(let n of e||[]){let e=Array.isArray(n?.Attrs)?n.Attrs:[];for(let n of e){let e=typeof n==`string`?Hn(Bn,n.toLowerCase()):null;e&&e!==`inbox`&&t.add(e)}}return t}function Yn(e=[]){return(e||[]).some(e=>e?.Subscribed===!0)}function Xn(e,t,n){if(!e)return!1;let r=e.Name||e.Mailbox||``;if(!r||r===n)return!1;let i=(Array.isArray(e.Attrs)?e.Attrs:[]).map(e=>typeof e==`string`?e.toLowerCase():``);if(i.includes(`\\noselect`)||i.includes(`\\nonexistent`))return!1;let a=Un(e,Jn(t));return a!==`drafts`&&a!==`sent`}function Zn(e,t,n){if(!e||!t||e===t||!e.startsWith(t))return!1;let r=e.slice(t.length);return n?r.startsWith(n):/^[^A-Za-z0-9]/.test(r)}function Qn(e,t,n){return e===t||Zn(e,t,n)}function $n(e,t=[]){return e?er(t.find(t=>(t.Name||t.Mailbox)===e)):``}function er(e,t=``){let n=e?.Delimiter||e?.Delim;return typeof n==`number`?n>0?String.fromCharCode(n):``:typeof n==`string`&&n?n:t}function tr(e,t){return t?e.split(t):[e]}var nr=e=>`/assets/icons/sprite.svg?v=13#${e}`;function A(e){return n`
    <svg class="icon">
      <use href=${nr(e)}></use>
    </svg>
  `}function rr(e){if(!e)return`#78909c`;let t=[`#ef5350`,`#ec407a`,`#ab47bc`,`#7e57c2`,`#5c6bc0`,`#42a5f5`,`#29b6f6`,`#26c6da`,`#26a69a`,`#66bb6a`,`#9ccc65`,`#d4e157`,`#ffca28`,`#ffa726`,`#ff7043`,`#8d6e63`,`#78909c`],n=0;for(let t=0;t<e.length;t++)n=e.charCodeAt(t)+((n<<5)-n);return t[Math.abs(n)%t.length]}function ir(e,t=`YYYY-MM-DD`,n=`12`){if(!e)return``;let r=typeof e==`string`?new Date(e):e,i=new Date;if(r.getDate()===i.getDate()&&r.getMonth()===i.getMonth()&&r.getFullYear()===i.getFullYear())return r.toLocaleTimeString(void 0,{hour:`2-digit`,minute:`2-digit`,hour12:n===`12`});if(r.getFullYear()!==i.getFullYear()){let e=r.getFullYear(),n=String(r.getMonth()+1).padStart(2,`0`),i=String(r.getDate()).padStart(2,`0`);return t===`YYYY-MM-DD`?`${e}-${n}-${i}`:t===`MM/DD/YYYY`?`${n}/${i}/${e}`:t===`DD.MM.YYYY`?`${i}.${n}.${e}`:r.toLocaleDateString(void 0,{year:`numeric`,month:`short`,day:`numeric`})}return r.toLocaleDateString(void 0,{month:`short`,day:`numeric`})}function ar(e,t=`YYYY-MM-DD`,n=`12`){if(!e)return``;let r=typeof e==`string`?new Date(e):e,i=r.getFullYear(),a=String(r.getMonth()+1).padStart(2,`0`),o=String(r.getDate()).padStart(2,`0`),s=`${i}-${a}-${o}`;t===`MM/DD/YYYY`?s=`${a}/${o}/${i}`:t===`DD.MM.YYYY`&&(s=`${o}.${a}.${i}`);let c=r.toLocaleTimeString(void 0,{hour:`2-digit`,minute:`2-digit`,hour12:n===`12`});return`${s} ${c}`}function or(e,t,n=`YYYY-MM-DD`){let r=String(e).padStart(2,`0`),i=String(t).padStart(2,`0`);return n===`MM/DD/YYYY`?`${r}/${i}`:n===`DD.MM.YYYY`?`${i}.${r}.`:`${r}-${i}`}var sr={inbox:`folderList.inbox`,drafts:`folderList.drafts`,sent:`folderList.sent`,archive:`folderList.archive`,junk:`folderList.junk`,trash:`folderList.trash`};function cr(e,t,n){let r=qn(e,n),i=r===`junk`&&lr(e,n)===`Spam`?`folderList.spam`:r?sr[r]:void 0;return i&&t?.t(i)||null}function lr(e,t){let n=$n(e,t),r=n?e.split(n):e.split(/[.\/]/);return r[r.length-1]||e}function ur(e,t,n=[]){return e?e===`*`?t?.t(`folderList.allFolders`)||`All Folders`:cr(e,t,n)||lr(e,n):``}function dr(e,t,n=[]){return cr(e,t,n)??e}var fr=[`B`,`KB`,`MB`,`GB`,`TB`,`PB`];function pr(e){if(!Number.isFinite(e)||e<=0)return`0 B`;let t=1024,n=Math.floor(Math.log(e)/Math.log(t)),r=Math.min(Math.max(n,0),fr.length-1),i=Math.round(e/t**+r);return i>=t&&r<fr.length-1&&(i=Math.round(i/t),r++),`${i} ${fr[r]}`}var mr=new Set([`gmail.com`,`yahoo.com`,`hotmail.com`,`outlook.com`,`icloud.com`,`me.com`,`mac.com`,`aol.com`,`proton.me`,`protonmail.com`,`live.com`,`msn.com`,`pm.me`,`yandex.ru`,`mail.ru`,`gmx.de`,`web.de`,`t-online.de`,`orange.fr`,`free.fr`]);function hr(e){if(!e)return``;let t=e.toLowerCase();return mr.has(t)?``:`/bimi/avatar?domain=${encodeURIComponent(t)}`}function gr(e){let t=e?.Envelope?.From;return Array.isArray(t)&&t.length===1&&!!t[0]?.Mailbox&&hr(t[0]?.Host||``)!==``}function _r(e,t){if(!e?.HasBimiPotential)return``;let n=e.Envelope?.From;if(!Array.isArray(n)||n.length!==1)return``;let r=e=>e?.Mailbox&&e?.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``,i=r(n[0]);return!i||i!==r(t)?``:hr(n[0].Host)}function vr(e){if(!e)return 0;let t=e.style.width;e.style.width=`0px`;let n=e.scrollWidth;return e.style.width=t,n}function j(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var yr=class extends d{constructor(...e){super(...e),this.icon=``,this.title=``,this.disabled=!1,this.active=!1,this.spinning=!1}static{this.styles=_`
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
        ${this.icon?A(this.icon):n`<slot></slot>`}
      </button>
    `}};j([o({type:String})],yr.prototype,`icon`,void 0),j([o({type:String})],yr.prototype,`title`,void 0),j([o({type:Boolean})],yr.prototype,`disabled`,void 0),j([o({type:Boolean,reflect:!0})],yr.prototype,`active`,void 0),j([o({type:Boolean})],yr.prototype,`spinning`,void 0),yr=j([p(`alps-icon-btn`)],yr);var br=_`
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
  alps-sidebar.desktop-sidebar[collapsed][peeking] {
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
`;function xr(e){e?.querySelector(`alps-sidebar`)?.closePeek()}var Sr=class extends d{static{this.styles=_`
    :host {
      display: block;
      position: relative;
      height: 100%;
      z-index: 10;
      transition: z-index 0s 0.2s;
    }

    :host([collapsed][peeking]) {
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

    :host([collapsed]:not([peeking])) .sidebar {
      border-right: none;
      width: 100%;
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      box-shadow: rgba(95, 95, 95, 0) 4px 0 4px -2px;
    }

    :host([collapsed][peeking]) .sidebar {
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

    :host([collapsed]:not([peeking])) .footer-divider,
    :host([collapsed]:not([peeking])) ::slotted([slot="footer-actions"]) {
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
  `}constructor(){super(),this.isMobile=!1,this.isOpen=!1,this.collapsed=!1,this.peeking=!1,this.width=250,this.hideFooterDivider=!1,this.showMobileBack=!1,this.isDragging=!1,this.openTimer=null,this.closeTimer=null,this.stopResize=null,this.onPointerEnter=()=>{this.closeTimer!==null&&(clearTimeout(this.closeTimer),this.closeTimer=null),!(this.peeking||!this.collapsed||this.isMobile||this.isDragging)&&(this.openTimer??=setTimeout(()=>{this.openTimer=null,this.peeking=!0},300))},this.onPointerLeave=()=>{this.openTimer!==null&&(clearTimeout(this.openTimer),this.openTimer=null),this.peeking&&(this.closeTimer??=setTimeout(()=>{this.closeTimer=null,this.peeking=!1},300))},this.addEventListener(`mouseenter`,this.onPointerEnter),this.addEventListener(`mouseleave`,this.onPointerLeave)}disconnectedCallback(){super.disconnectedCallback(),this.clearPeekTimers(),this.stopResize?.()}closePeek(){this.clearPeekTimers(),this.peeking=!1}willUpdate(e){(e.has(`collapsed`)||e.has(`isMobile`))&&(this.clearPeekTimers(),this.peeking=!1)}updated(e){e.has(`peeking`)&&e.get(`peeking`)!==void 0&&this.dispatchEvent(new CustomEvent(`peek-change`,{detail:{peeking:this.peeking}}))}clearPeekTimers(){this.openTimer!==null&&clearTimeout(this.openTimer),this.closeTimer!==null&&clearTimeout(this.closeTimer),this.openTimer=null,this.closeTimer=null}startResize(e){if(this.isMobile||this.collapsed)return;e.preventDefault(),this.stopResize?.(),this.isDragging=!0,this.dispatchEvent(new CustomEvent(`drag-start`));let t=e.clientX,n=this.width,r=e=>{let r=n+(e.clientX-t);this.dispatchEvent(new CustomEvent(`sidebar-resize`,{detail:{newWidth:r,clientX:e.clientX}}))},i=()=>{this.stopResize=null,this.isDragging=!1,window.removeEventListener(`mousemove`,r),window.removeEventListener(`mouseup`,i),this.dispatchEvent(new CustomEvent(`drag-end`))};this.stopResize=i,window.addEventListener(`mousemove`,r),window.addEventListener(`mouseup`,i)}render(){return n`
      <div class="mobile-backdrop" @click=${()=>this.dispatchEvent(new CustomEvent(`close-sidebar`))}></div>
      <aside class="sidebar ${this.isDragging?`dragging`:``}" part="sidebar" style="--sidebar-width-expanded: ${this.width}px">
        <div class="sidebar-content">
          <slot></slot>
        </div>
        <div class="sidebar-footer">
          ${this.isMobile&&this.showMobileBack?n`
            <button class="mobile-return-btn" @click=${()=>window.location.hash=``}>
              ${A(`arrowLeft`)} <span class="return-text">${this.i18nStore?.t(`messageReader.back`)||`Back`}</span>
            </button>
          `:this.isMobile?``:n`
            <alps-icon-btn 
              class="collapse-btn"
              icon="sidebar"
              title=${this.collapsed?this.i18nStore?.t(`folderList.expandSidebar`):this.i18nStore?.t(`folderList.collapseSidebar`)}
              @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-collapse`))}
            ></alps-icon-btn>
          `}
          ${!this.hideFooterDivider&&(!this.isMobile||this.showMobileBack)?n`<div class="footer-divider"></div>`:``}
          <div style="display: flex; flex: 1; justify-content: flex-start;">
            <slot name="footer-actions"></slot>
          </div>
        </div>
      </aside>
      <div class="sidebar-resizer ${this.isDragging?`dragging`:``}" @mousedown=${this.startResize}></div>
    `}};j([h({context:w})],Sr.prototype,`i18nStore`,void 0),j([o({type:Boolean})],Sr.prototype,`isMobile`,void 0),j([o({type:Boolean})],Sr.prototype,`isOpen`,void 0),j([o({type:Boolean,reflect:!0})],Sr.prototype,`collapsed`,void 0),j([o({type:Boolean,reflect:!0})],Sr.prototype,`peeking`,void 0),j([o({type:Number})],Sr.prototype,`width`,void 0),j([o({type:Boolean})],Sr.prototype,`hideFooterDivider`,void 0),j([o({type:Boolean})],Sr.prototype,`showMobileBack`,void 0),j([a()],Sr.prototype,`isDragging`,void 0),Sr=j([p(`alps-sidebar`)],Sr);var Cr=class extends d{constructor(...e){super(...e),this.options=[],this.value=``}static{this.styles=_`
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
    `}_select(e){this.value!==e&&(this.value=e,this.dispatchEvent(new CustomEvent(`change`,{detail:{value:e}})))}};j([o({type:Array})],Cr.prototype,`options`,void 0),j([o({type:String})],Cr.prototype,`value`,void 0),Cr=j([p(`alps-toggle`)],Cr);var wr=class extends d{constructor(...e){super(...e),this.variant=`normal`,this.icon=``,this.disabled=!1,this.spinning=!1,this.type=`button`,this.title=``,this.fullWidth=!1,this.handleClick=e=>{if(this.disabled||this.spinning){e.preventDefault(),e.stopPropagation();return}if(this.type===`submit`){let t=this.closest(`form`);t&&(e.preventDefault(),t.requestSubmit())}else if(this.type===`reset`){let t=this.closest(`form`);t&&(e.preventDefault(),t.reset())}}}connectedCallback(){super.connectedCallback(),this.addEventListener(`click`,this.handleClick)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(`click`,this.handleClick)}static{this.styles=_`
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
      color: var(--accent-contrast, #ffffff);
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
            ${A(`edelweiss`)}
          </span>
        `:this.icon?n`
          <span class="icon-container">
            ${A(this.icon)}
          </span>
        `:``}
        <span class="content"><slot></slot></span>
      </button>
    `}};j([o({type:String,reflect:!0})],wr.prototype,`variant`,void 0),j([o({type:String})],wr.prototype,`icon`,void 0),j([o({type:Boolean,reflect:!0})],wr.prototype,`disabled`,void 0),j([o({type:Boolean,reflect:!0})],wr.prototype,`spinning`,void 0),j([o({type:String})],wr.prototype,`type`,void 0),j([o({type:String})],wr.prototype,`title`,void 0),j([o({type:Boolean,attribute:`full-width`,reflect:!0})],wr.prototype,`fullWidth`,void 0),wr=j([p(`alps-button`)],wr);var Tr=class extends d{constructor(...e){super(...e),this.scrolled=!1}static{this.styles=_`
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
  `}render(){return n`<slot></slot>`}};j([o({type:Boolean,reflect:!0})],Tr.prototype,`scrolled`,void 0),Tr=j([p(`alps-toolbar`)],Tr);var Er=class extends d{constructor(...e){super(...e),this.collapsed=!1,this.icon=`plus`,this.text=``,this.disabled=!1,this.title=``}static{this.styles=_`
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
    `}};j([o({type:Boolean})],Er.prototype,`collapsed`,void 0),j([o({type:String})],Er.prototype,`icon`,void 0),j([o({type:String})],Er.prototype,`text`,void 0),j([o({type:Boolean})],Er.prototype,`disabled`,void 0),j([o({type:String})],Er.prototype,`title`,void 0),Er=j([p(`alps-create-button`)],Er);var Dr=_`
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
`,Or=class extends d{constructor(...e){super(...e),this.title=``,this.isDanger=!1,this.dismissible=!1,this.width=`400px`,this._handleEscape=e=>{this.dismissible||e.preventDefault()},this._handleDialogClose=()=>{this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}}static{this.styles=_`
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
    `}};j([o({type:String})],Or.prototype,`title`,void 0),j([o({type:Boolean})],Or.prototype,`isDanger`,void 0),j([o({type:Boolean})],Or.prototype,`dismissible`,void 0),j([o({type:String})],Or.prototype,`width`,void 0),Or=j([p(`ui-modal`)],Or);var M=class extends d{constructor(...e){super(...e),this._handleI18nChange=()=>this.requestUpdate(),this.type=`text`,this.value=``,this.placeholder=``,this.required=!1,this.autocomplete=``,this.inputId=``,this.label=``,this.icon=``,this.clearable=!1,this.autofocus=!1,this.showPassword=!1}static{this.styles=_`
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
            ${A(r)}
          </span>
        `:``}

        <input 
          id=${this.inputId||``}
          type=${t} 
          .value=${this.value}
          placeholder=${this.placeholder}
          aria-label=${this.label||c}
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
            ${A(this.showPassword?`eyeSlash`:`eye`)}
          </button>
        `:this.clearable&&this.value?n`
          <button 
            type="button" 
            class="action-btn" 
            @click=${this.handleClear}
            title=${this.i18nStore?.t(`general.clear`)||`Clear`}
            tabindex="-1"
          >
            ${A(`x`)}
          </button>
        `:``}
      </div>
    `}};j([h({context:w})],M.prototype,`i18nStore`,void 0),j([o({type:String})],M.prototype,`type`,void 0),j([o({type:String})],M.prototype,`value`,void 0),j([o({type:String})],M.prototype,`placeholder`,void 0),j([o({type:Boolean})],M.prototype,`required`,void 0),j([o({type:String})],M.prototype,`autocomplete`,void 0),j([o({type:String})],M.prototype,`inputId`,void 0),j([o({type:String})],M.prototype,`label`,void 0),j([o({type:String})],M.prototype,`icon`,void 0),j([o({type:Boolean})],M.prototype,`clearable`,void 0),j([o({type:Boolean})],M.prototype,`autofocus`,void 0),j([a()],M.prototype,`showPassword`,void 0),M=j([p(`alps-input`)],M);var kr=class extends d{constructor(...e){super(...e),this.value=``,this.options=[],this.label=``}static{this.styles=_`
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
				<select .value=${this.value} aria-label=${this.label||c} @change=${this.handleChange}>
					${this.options.map(e=>n`<option value=${e.value} lang=${e.lang??c} ?selected=${e.value===this.value} ?disabled=${e.disabled}>${e.label}</option>`)}
				</select>
				<span class="caret">
					${A(`caret-down`)}
				</span>
			</div>
		`}};j([o({type:String})],kr.prototype,`value`,void 0),j([o({type:Array})],kr.prototype,`options`,void 0),j([o({type:String})],kr.prototype,`label`,void 0),kr=j([p(`alps-select`)],kr);var Ar=new Set([``,`text`,`search`,`url`,`email`,`password`,`tel`,`number`]);function jr(e){if(!e)return!1;if(e.isContentEditable)return!0;let t=e.tagName;if(t===`TEXTAREA`||t===`SELECT`)return!0;if(t===`INPUT`)return Ar.has((e.type||``).toLowerCase());let n=e.getAttribute(`role`);return n===`textbox`||n===`searchbox`}function Mr(e){return e?e.tagName===`TEXTAREA`||e.isContentEditable:!1}var Nr=_`
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
`,Pr=class extends d{constructor(...e){super(...e),this.align=`right`,this.position=`bottom`,this.triggerOn=`click`,this.openState=!1,this._handleDialogClick=e=>{this.openState&&e.target===e.currentTarget&&(e.stopPropagation(),e.preventDefault(),this.close())},this._handleDialogClose=()=>{this.openState&&this.close()},this._handleDialogKeydown=e=>{if(this.openState){if(e.key===`ArrowDown`||e.key===`ArrowUp`){if(Mr(this._getActiveElement()))return;e.preventDefault();let t=this._getFocusableElements();if(t.length===0)return;let n=this._getActiveElement(),r=t.findIndex(e=>e===n);r=e.key===`ArrowDown`?r===-1?0:(r+1)%t.length:r===-1?t.length-1:(r-1+t.length)%t.length,t[r].focus()}else if(e.key===`Enter`||e.key===` `){let t=this._getActiveElement();if(e.key===` `?jr(t):Mr(t))return;t&&typeof t.click==`function`&&(e.preventDefault(),t.click())}}},this._closeTimeout=null,this._handleMouseEnter=()=>{this.triggerOn===`hover`&&(this._closeTimeout&&=(clearTimeout(this._closeTimeout),null),this.open())},this._handleMouseLeave=()=>{this.triggerOn===`hover`&&(this._closeTimeout&&clearTimeout(this._closeTimeout),this._closeTimeout=setTimeout(()=>{this.close(),this._closeTimeout=null},300))},this._handleResize=()=>{this.openState&&this._updatePosition()}}static{this.styles=_`
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
    `}};j([o({type:String})],Pr.prototype,`align`,void 0),j([o({type:String})],Pr.prototype,`position`,void 0),j([o({type:String,reflect:!0})],Pr.prototype,`triggerOn`,void 0),j([o({type:Boolean,reflect:!0,attribute:`open`})],Pr.prototype,`openState`,void 0),Pr=j([p(`alps-popup`)],Pr);var Fr=class extends d{constructor(...e){super(...e),this.addresses=[],this.disabled=!1,this.label=``,this.inputText=``,this.suggestions=[],this.focusedSuggestionIndex=-1,this._suggestionTimeout=null,this._suggestionSeq=0,this._handleI18nChange=()=>this.requestUpdate()}focus(){let e=this.shadowRoot?.querySelector(`input`);e&&e.focus()}connectedCallback(){super.connectedCallback(),this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}updated(e){if(super.updated(e),e.has(`focusedSuggestionIndex`)&&this.focusedSuggestionIndex>=0){let e=this.shadowRoot?.querySelector(`.dropdown-item.active`);e&&e.scrollIntoView({block:`nearest`})}}_isBlockedAddress(e){let t=e.trim();if(t.endsWith(`>`)){let e=t.lastIndexOf(`<`);e!==-1&&(t=t.substring(e+1,t.length-1))}let n=t.toLowerCase();return n.startsWith(`noreply`)||n.startsWith(`no-reply`)||n.startsWith(`mailer-daemon`)}_isValidEmail(e){if(this._isBlockedAddress(e))return!1;let t=e.trim();return!!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)||/^.*?<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(t))}_displayAddr(e){let{name:t,email:r}=Zt(e);return Xt(r).warning?n`${t?n`<bdi>${t}</bdi> &lt;`:``}${tn(r)}${t?`>`:``}${on(r,this.i18nStore)}`:t?n`<bdi>${t}</bdi>`:tn(r)}_cancelSuggestions(){this._suggestionTimeout!==null&&(window.clearTimeout(this._suggestionTimeout),this._suggestionTimeout=null),this._suggestionSeq++}_handleInput(e){let t=e.target;if(this.inputText=t.value,this._cancelSuggestions(),this.inputText.trim().length>1){let e=this._suggestionSeq,t=this.inputText.trim();this._suggestionTimeout=window.setTimeout(async()=>{this._suggestionTimeout=null;try{let n=await b.invokeHookAsync(`composer:suggest`,{query:t});if(e!==this._suggestionSeq)return;this.suggestions=n.flat(),this.focusedSuggestionIndex=-1}catch(t){if(e!==this._suggestionSeq)return;console.error(`Failed to get suggestions`,t),this.suggestions=[],this.focusedSuggestionIndex=-1}},300)}else this.suggestions=[],this.focusedSuggestionIndex=-1}_handleKeyDown(e){let t=this.inputText.trim();if(this.suggestions.length>0){if(e.key===`ArrowDown`){e.preventDefault(),this._cancelSuggestions(),this.focusedSuggestionIndex=Math.min(this.focusedSuggestionIndex+1,this.suggestions.length-1);return}else if(e.key===`ArrowUp`){e.preventDefault(),this._cancelSuggestions(),this.focusedSuggestionIndex=Math.max(this.focusedSuggestionIndex-1,-1);return}else if(e.key===`Enter`&&this.focusedSuggestionIndex>=0){e.preventDefault(),this._cancelSuggestions();let t=this.suggestions[this.focusedSuggestionIndex],n=$t(t.name,t.address);this._addAddress(n);return}else if(e.key===`Escape`){e.preventDefault(),this._cancelSuggestions(),this.suggestions=[],this.focusedSuggestionIndex=-1;return}}if(e.key===`Enter`&&t)e.preventDefault(),this._isValidEmail(t)&&this._addAddress(t);else if((e.key===` `||e.key===`,`)&&t)this._isValidEmail(t)&&(e.preventDefault(),this._addAddress(t));else if(e.key===`Backspace`&&!this.inputText&&this.addresses.length>0){let e=this.addresses[this.addresses.length-1];this._removeAddress(e),this.inputText=e+` `}}_addAddress(e,t=!0){this.addresses.includes(e)||(this.addresses=[...this.addresses,e],this._notifyChange()),this.inputText=``,this._cancelSuggestions(),this.suggestions=[],this.focusedSuggestionIndex=-1,t&&this.focus()}_removeAddress(e){this.addresses=this.addresses.filter(t=>t!==e),this._notifyChange()}_notifyChange(){this.dispatchEvent(new CustomEvent(`addresses-changed`,{detail:{addresses:this.addresses},bubbles:!0,composed:!0}))}_handleBlur(){setTimeout(()=>{let e=this.inputText.trim();e&&this._isValidEmail(e)&&this._addAddress(e,!1),this.suggestions=[],this.focusedSuggestionIndex=-1},150)}static{this.styles=[Nr,nn,_`
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
              ${A(`x`)}
            </button>
          </div>
        `)}
        
        <div class="input-container ${this.inputText.length>0?`has-value`:``}">
          <div class="input-wrapper">
            <input
              type="text"
              aria-label=${this.label||c}
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
                  @click=${t=>{t.preventDefault(),t.stopPropagation();let n=$t(e.name,e.address);this._addAddress(n)}}>
                  <span class="item-text"><b><bdi>${e.name}</bdi></b> &lt;${tn(e.address)}&gt;${on(e.address,this.i18nStore)}</span>
                </button>
              `)}
            </div>
          `:``}
        </div>
      </div>
    `}};j([h({context:w})],Fr.prototype,`i18nStore`,void 0),j([o({type:Array})],Fr.prototype,`addresses`,void 0),j([o({type:Boolean})],Fr.prototype,`disabled`,void 0),j([o({type:String})],Fr.prototype,`label`,void 0),j([a()],Fr.prototype,`inputText`,void 0),j([a()],Fr.prototype,`suggestions`,void 0),j([a()],Fr.prototype,`focusedSuggestionIndex`,void 0),Fr=j([p(`alps-address-input`)],Fr);var Ir=class extends d{constructor(...e){super(...e),this.title=`Confirm`,this.message=`Are you sure?`,this.confirmText=`Confirm`,this.cancelText=``,this.isDanger=!1,this.dismissible=!1}static{this.styles=[Dr]}_handleCancel(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}_handleSecondary(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`secondary`,{bubbles:!0,composed:!0}))}_handleConfirm(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`confirm`,{bubbles:!0,composed:!0}))}render(){return n`
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
    `}};j([h({context:w})],Ir.prototype,`i18nStore`,void 0),j([o({type:String})],Ir.prototype,`title`,void 0),j([o({type:String})],Ir.prototype,`message`,void 0),j([o({type:String})],Ir.prototype,`confirmText`,void 0),j([o({type:String})],Ir.prototype,`cancelText`,void 0),j([o({type:String})],Ir.prototype,`secondaryText`,void 0),j([o({type:Boolean})],Ir.prototype,`isDanger`,void 0),j([o({type:Boolean})],Ir.prototype,`dismissible`,void 0),Ir=j([p(`ui-confirm`)],Ir);var N=class extends d{constructor(...e){super(...e),this.calendars=[],this.open=!1,this.scheduling=`email`,this.summary=``,this.location=``,this.calendarPath=``,this.description=``,this.startDate=``,this.startTime=``,this.endDate=``,this.endTime=``,this.isAllDay=!1,this.isSaving=!1,this.rruleFreq=``,this.originalRRule=``,this.attendees=[],this.askNotify=!1}static{this.styles=[Dr,_`
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
        `]}updated(e){if(e.has(`open`)&&this.open){let e=e=>e.toString().padStart(2,`0`);if(this.askNotify=!1,this.attendees=(this.event?.attendees??[]).map(Sn),this.event){this.summary=this.event.summary||``,this.location=this.event.location||``,this.description=this.event.description||``,this.calendarPath=this.event.calendarPath||(this.calendars.length>0?this.calendars[0].path:``);let t=Dn(this.event);if(this.isAllDay=t,this.event.rrule?(this.originalRRule=this.event.rrule,this.event.rrule===`FREQ=DAILY`?this.rruleFreq=`DAILY`:this.event.rrule===`FREQ=WEEKLY`?this.rruleFreq=`WEEKLY`:this.event.rrule===`FREQ=MONTHLY`?this.rruleFreq=`MONTHLY`:this.event.rrule===`FREQ=YEARLY`?this.rruleFreq=`YEARLY`:this.rruleFreq=`CUSTOM`):(this.originalRRule=``,this.rruleFreq=``),t){let t=new Date(this.event.start);this.startDate=`${t.getUTCFullYear()}-${e(t.getUTCMonth()+1)}-${e(t.getUTCDate())}`,this.startTime=`00:00`;let n=new Date(this.event.end);n.setUTCDate(n.getUTCDate()-1),this.endDate=`${n.getUTCFullYear()}-${e(n.getUTCMonth()+1)}-${e(n.getUTCDate())}`,this.endDate<this.startDate&&(this.endDate=this.startDate),this.endTime=`00:00`}else{let t=new Date(this.event.start);this.startDate=`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}`,this.startTime=`${e(t.getHours())}:${e(t.getMinutes())}`;let n=new Date(this.event.end);this.endDate=`${n.getFullYear()}-${e(n.getMonth()+1)}-${e(n.getDate())}`,this.endTime=`${e(n.getHours())}:${e(n.getMinutes())}`}}else{this.summary=``,this.location=``,this.description=``,this.originalRRule=``,this.rruleFreq=``,this.calendarPath=this.calendars.length>0?this.calendars[0].path:``;let t=this.initialDate?new Date(this.initialDate):new Date;if(this.initialAllDay===void 0?this.initialDate&&t.getHours()===0&&t.getMinutes()===0:this.initialAllDay)this.isAllDay=!0,this.startDate=`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}`,this.startTime=`00:00`,this.endDate=this.startDate,this.endTime=`00:00`;else{this.isAllDay=!1,this.initialDate||(t.setMinutes(0,0,0),t.setHours(t.getHours()+1)),this.startDate=`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}`,this.startTime=`${e(t.getHours())}:${e(t.getMinutes())}`;let n=new Date(t.getTime()+3600*1e3);this.endDate=`${n.getFullYear()}-${e(n.getMonth()+1)}-${e(n.getDate())}`,this.endTime=`${e(n.getHours())}:${e(n.getMinutes())}`}}}}handleCancel(){this.open=!1,this.dispatchEvent(new CustomEvent(`close`))}formTimes(){if(this.isAllDay){let e=new Date(`${this.endDate}T00:00:00.000Z`);return e.setUTCDate(e.getUTCDate()+1),{startISO:`${this.startDate}T00:00:00.000Z`,endISO:e.toISOString()}}return{startISO:new Date(`${this.startDate}T${this.startTime||`00:00`}`).toISOString(),endISO:new Date(`${this.endDate}T${this.endTime||`00:00`}`).toISOString()}}setStart(e){Object.assign(this,e),this.startDate&&this.endDate<this.startDate&&(this.endDate=this.startDate),!this.isAllDay&&this.startDate&&this.endDate===this.startDate&&this.startTime&&this.endTime&&this.endTime<this.startTime&&(this.endTime=this.startTime)}endsBeforeStart(){if(this.isAllDay)return this.endDate<this.startDate;let{startISO:e,endISO:t}=this.formTimes();return new Date(t).getTime()<new Date(e).getTime()}get othersMeeting(){let e=this.event;return e?.role===`attendee`||!!e?.organizer&&e.role!==`organizer`}async handleSave(){if(!this.summary.trim()||!this.startDate||!this.endDate)return;if(this.endsBeforeStart()){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`calendar.endBeforeStart`),duration:8e3}}));return}let e=!!this.event?.ended&&new Date(this.formTimes().endISO)<=new Date;if(this.event?.path&&!this.othersMeeting&&wn({...this.event,ended:e},this.scheduling)){this.askNotify=!0;return}await this.save()}async save(e){this.askNotify=!1,this.isSaving=!0;try{let{startISO:t,endISO:n}=this.formTimes(),r;this.rruleFreq===`CUSTOM`?r=this.originalRRule:this.rruleFreq&&(r=`FREQ=${this.rruleFreq}`);let i={summary:this.summary,location:this.location,description:this.description,start:t,end:n,allDay:this.isAllDay,calendarPath:this.calendarPath,rrule:r,etag:this.event?.etag,attendees:this.othersMeeting?void 0:this.attendees.map(xn).filter(e=>e!==null),notify:e,lang:this.i18nStore?.getLanguage?.()};(this.event&&this.event.path?await Mn.updateEvent(this.event.path,i):await Mn.createEvent(i))?.sendFailed&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`invitations.notTold`),duration:8e3}})),this.open=!1,this.dispatchEvent(new CustomEvent(`saved`))}catch(e){console.error(`Failed to save event`,e);let t=xt(e);t&&this.dispatchEvent(new CustomEvent(`conflict`)),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(t?`calendar.saveConflict`:`calendar.saveEventFailed`),duration:8e3}}))}finally{this.isSaving=!1}}render(){return this.open?n`
            <ui-modal 
                title="${this.event?this.i18nStore?.t(`calendar.editEvent`):this.i18nStore?.t(`calendar.newEvent`)}" 
                width="450px"
                ?dismissible=${!this.isSaving}
                @cancel=${this.handleCancel}
            >
                <div class="form-group">
                    <label>${this.i18nStore?.t(`calendar.summary`)}</label>
                    <alps-input 
                        label=${this.i18nStore?.t(`calendar.summary`)}
                        .value=${this.summary} 
                        @input=${e=>this.summary=e.target.value}
                        placeholder=${this.i18nStore?.t(`calendar.eventTitle`)}
                    ></alps-input>
                </div>

                ${this.calendars.length>1?n`
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`calendar.calendar`)}</label>
                        <alps-select
                            label=${this.i18nStore?.t(`calendar.calendar`)}
                            .value=${this.calendarPath}
                            .options=${this.calendars.map(e=>({value:e.path,label:e.name}))}
                            @change=${e=>{this.calendarPath=e.target.value}}
                            ?disabled=${!!this.event}
                        ></alps-select>
                    </div>
                `:``}

                ${this.othersMeeting?n`
                    <div class="form-group organized-by">
                        ${Lt(this.i18nStore,`invitations.organizedBy`,{name:this.event?.organizer?Pt(this.event.organizer.name,this.event.organizer.email):``})}
                    </div>
                `:n`
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`invitations.guests`)}</label>
                        <alps-address-input
                            class="guests"
                            label=${this.i18nStore?.t(`invitations.guests`)}
                            .addresses=${this.attendees}
                            @addresses-changed=${e=>{this.attendees=e.detail.addresses}}
                        ></alps-address-input>
                    </div>
                `}

                <div class="form-row">
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`calendar.startDate`)}</label>
                        <alps-input 
                            label=${this.i18nStore?.t(`calendar.startDate`)}
                            type="date"
                            .value=${this.startDate} 
                            @input=${e=>this.setStart({startDate:e.target.value})}
                        ></alps-input>
                    </div>
                    ${this.isAllDay?``:n`
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`calendar.time`)}</label>
                        <!-- Named "Start time", though its label reads "Time": so is the end's. -->
                        <alps-input 
                            label=${this.i18nStore?.t(`calendar.startTime`)}
                            type="time"
                            .value=${this.startTime} 
                            @input=${e=>this.setStart({startTime:e.target.value})}
                        ></alps-input>
                    </div>
                    `}
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`calendar.endDate`)}</label>
                        <alps-input 
                            label=${this.i18nStore?.t(`calendar.endDate`)}
                            type="date"
                            .value=${this.endDate} 
                            @input=${e=>this.endDate=e.target.value}
                        ></alps-input>
                    </div>
                    ${this.isAllDay?``:n`
                    <div class="form-group">
                        <label>${this.i18nStore?.t(`calendar.time`)}</label>
                        <alps-input 
                            label=${this.i18nStore?.t(`calendar.endTime`)}
                            type="time"
                            .value=${this.endTime} 
                            @input=${e=>this.endTime=e.target.value}
                        ></alps-input>
                    </div>
                    `}
                </div>

                <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="allday-checkbox" .checked=${this.isAllDay} @change=${e=>this.setStart({isAllDay:e.target.checked})}>
                    <label for="allday-checkbox" style="margin-bottom: 0; cursor: pointer;">${this.i18nStore?.t(`calendar.allDay`)}</label>
                </div>

                <div class="form-group">
                    <label>${this.i18nStore?.t(`calendar.repeat`)}</label>
                    <alps-select
                        label=${this.i18nStore?.t(`calendar.repeat`)}
                        .value=${this.rruleFreq}
                        .options=${[{value:``,label:this.i18nStore?.t(`calendar.repeatNone`)},{value:`DAILY`,label:this.i18nStore?.t(`calendar.repeatDaily`)},{value:`WEEKLY`,label:this.i18nStore?.t(`calendar.repeatWeekly`)},{value:`MONTHLY`,label:this.i18nStore?.t(`calendar.repeatMonthly`)},{value:`YEARLY`,label:this.i18nStore?.t(`calendar.repeatYearly`)},...this.rruleFreq===`CUSTOM`?[{value:`CUSTOM`,label:this.i18nStore?.t(`calendar.repeatCustom`)}]:[]]}
                        @change=${e=>this.rruleFreq=e.target.value}
                    ></alps-select>
                </div>

                <div class="form-group">
                    <label>${this.i18nStore?.t(`calendar.location`)}</label>
                    <alps-input 
                        label=${this.i18nStore?.t(`calendar.location`)}
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
        `:n``}};j([h({context:w})],N.prototype,`i18nStore`,void 0),j([o({type:Object})],N.prototype,`event`,void 0),j([o({type:Object})],N.prototype,`initialDate`,void 0),j([o({type:Boolean})],N.prototype,`initialAllDay`,void 0),j([o({type:Array})],N.prototype,`calendars`,void 0),j([o({type:Boolean})],N.prototype,`open`,void 0),j([o({type:String})],N.prototype,`scheduling`,void 0),j([a()],N.prototype,`summary`,void 0),j([a()],N.prototype,`location`,void 0),j([a()],N.prototype,`calendarPath`,void 0),j([a()],N.prototype,`description`,void 0),j([a()],N.prototype,`startDate`,void 0),j([a()],N.prototype,`startTime`,void 0),j([a()],N.prototype,`endDate`,void 0),j([a()],N.prototype,`endTime`,void 0),j([a()],N.prototype,`isAllDay`,void 0),j([a()],N.prototype,`isSaving`,void 0),j([a()],N.prototype,`rruleFreq`,void 0),j([a()],N.prototype,`originalRRule`,void 0),j([a()],N.prototype,`attendees`,void 0),j([a()],N.prototype,`askNotify`,void 0),N=j([p(`calendar-event-modal`)],N);function Lr(e){if(!e||typeof e!=`object`)return!1;if(Array.isArray(e.Children))return e.Children.some(e=>Lr(e));let t=`${e.Type||``}/${e.Subtype||``}`.toLowerCase();if(t===`text/calendar`||t===`application/ics`)return!0;let n=e.Extended?.Disposition?.Params?.filename||e.Params?.name||``;return typeof n==`string`&&n.toLowerCase().endsWith(`.ics`)}var Rr=new class{async fetchInvitation(e,t){let n=await D(`/calendar/invitation?${new URLSearchParams({mailbox:e,uid:t}).toString()}`);if(n.status===404)return null;if(!n.ok)throw new E(n.status,`Failed to read the invitation`);return n.json()}async respond(e){return this.post(`/calendar/invitation/respond`,e,`Failed to answer the invitation`)}async apply(e){return this.post(`/calendar/invitation/apply`,e,`Failed to update the calendar`)}async post(e,t,n){let r=await D(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!r.ok)throw new E(r.status,n);return r.json()}},zr={accepted:`accepted`,tentative:`tentative`,declined:`declined`,"needs-action":`needsAction`,delegated:`delegated`,completed:`completed`,"in-process":`inProcess`};function Br(e){return zr[e??``]??`needsAction`}var Vr={update:`update`,outdated:`outdated`,organizer:`organizer`,"not-invited":`notInvited`,cancel:`cancel`,cancelled:`cancelled`,reply:`reply`,replied:`replied`,unknown:`unknown`,add:`add`,added:`added`,unsupported:`unsupported`},Hr=class extends d{constructor(...e){super(...e),this.mailbox=``,this.uid=``,this.view=null,this.busy=!1,this.notice=null,this.calendarPath=``,this.loadSeq=0,this.visit=0,this.autoApplied=new Set}static{this.styles=_`
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
    `}willUpdate(e){(e.has(`mailbox`)||e.has(`uid`))&&(this.visit++,this.view=null,this.notice=null,this.busy=!1,this.load())}isCurrent(e){return e===this.visit}t(e,t){return this.i18nStore?.t(e,t)??e}async load(){let e=++this.loadSeq,{mailbox:t,uid:n}=this;if(!t||!n)return;let r;try{r=await Rr.fetchInvitation(t,n)}catch(t){console.error(`Failed to read the invitation`,t),e===this.loadSeq&&(this.view=null);return}if(e!==this.loadSeq||(this.view=r,!r))return;r.calendars.some(e=>e.path===this.calendarPath)||(this.calendarPath=r.copy?.calendarPath||r.calendars[0]?.path||``);let i=JSON.stringify([t,n]);r.autoApply&&!this.autoApplied.has(i)&&(this.autoApplied.add(i),await this.apply())}async respond(e){let t=this.view;if(!t||this.busy)return;let n=this.visit;this.busy=!0,this.notice=null;try{let r=await Rr.respond({mailbox:this.mailbox,uid:this.uid,status:e,calendarPath:t.copy?void 0:this.calendarPath,lang:this.i18nStore?.getLanguage?.()});if(!this.isCurrent(n))return;this.notice=r.sendFailed?{key:`invitations.sendFailed`,tone:`error`}:{key:r.sent?`invitations.sent`:`invitations.saved`,tone:`info`}}catch(e){if(console.error(`Failed to answer the invitation`,e),!this.isCurrent(n))return;this.notice={key:xt(e)?`invitations.changedElsewhere`:`invitations.answerFailed`,tone:`error`}}finally{this.isCurrent(n)&&(this.busy=!1)}await this.load()}async apply(){let e=this.view;if(!e||this.busy)return;let t=this.visit;this.busy=!0,this.notice=null;try{let n=await Rr.apply({mailbox:this.mailbox,uid:this.uid,calendarPath:this.calendarPath});if(!this.isCurrent(t))return;let r=n.removed?`invitations.removed`:e.state===`add`?`invitations.added`:`invitations.updated`;this.notice={key:r,tone:`info`}}catch(e){if(console.error(`Failed to update the calendar`,e),!this.isCurrent(t))return;this.notice={key:xt(e)?`invitations.changedElsewhere`:`invitations.applyFailed`,tone:`error`}}finally{this.isCurrent(t)&&(this.busy=!1)}await this.load()}kindKey(e){switch(e.method){case`cancel`:return`cancelled`;case`reply`:return`reply`;case`request`:return e.kind===`task`?`task`:e.state===`update`?`updated`:`invitation`}return e.kind===`task`?`task`:`event`}when(e){let t=this.i18nStore?.getIntlLanguage?.()||void 0,n=new Intl.DateTimeFormat(t,{weekday:`short`,year:`numeric`,month:`short`,day:`numeric`}),r=e=>new Date(`${e.slice(0,10)}T00:00:00`);if(e.kind===`task`&&!e.start){if(!e.end)return``;let i=e.allDay?n.format(r(e.end)):new Intl.DateTimeFormat(t,{dateStyle:`medium`,timeStyle:`short`}).format(new Date(e.end));return`${this.t(`tasks.due`)}: ${i}`}if(!e.start)return``;if(e.allDay){let t=r(e.start);if(!e.end)return n.format(t);let i=r(e.end);return i.setDate(i.getDate()-1),i>t?`${n.format(t)} - ${n.format(i)}`:n.format(t)}let i=new Date(e.start),a=e.end?new Date(e.end):i,o=new Intl.DateTimeFormat(t,{weekday:`short`,year:`numeric`,month:`short`,day:`numeric`,hour:`numeric`,minute:`2-digit`}),s=o.formatRange;return a>i&&s?s.call(o,i,a):o.format(i)}renderStateLine(e){if(e.ended)return n`
                <div class="muted state ended">${this.t(`invitations.states.ended`)}</div>
                ${e.status&&e.status!==`needs-action`?n`<div class="muted answer">${this.t(`invitations.yourAnswer`)}: ${this.t(`invitations.statuses.${Br(e.status)}`)}</div>`:c}
            `;if(e.state===`answer`)return!e.status||e.status===`needs-action`?c:n`<div class="muted answer">${this.t(`invitations.yourAnswer`)}: ${this.t(`invitations.statuses.${Br(e.status)}`)}</div>`;let t=Vr[e.state];return t?n`<div class="muted state">${this.t(`invitations.states.${t}`)}</div>`:c}renderClashes(e){if(e.ended||e.kind!==`event`||e.method!==`request`||e.state!==`answer`&&e.state!==`update`||e.status===`declined`)return c;if(!e.clashes.length)return n`<div class="muted clashes">${this.t(`invitations.noConflicts`)}</div>`;let t=e.clashes.map(e=>e.summary||this.t(`calendar.noTitle`)).join(`, `);return n`<div class="clash clashes">${this.t(`invitations.conflictsWith`,{names:t})}</div>`}renderSender(e){if(e.ended||e.senderVerified||!e.sender||![`answer`,`update`,`cancel`,`reply`].includes(e.state))return c;let t=e.method===`reply`?`invitations.unverifiedReply`:`invitations.unverified`;return n`<div class="warning sender">${Lt(this.i18nStore,t,{sender:Nt(e.sender)})}</div>`}renderPicker(e){return e.copy||e.calendars.length<2?c:n`
            <alps-select
                .value=${this.calendarPath}
                .options=${e.calendars.map(e=>({value:e.path,label:e.name}))}
                title=${this.t(`invitations.calendar`)}
                label=${this.t(`invitations.calendar`)}
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
                <div class="icon">${A(e.kind===`task`?`checkCircle`:`calendar`)}</div>
                <div class="body">
                    <div class="eyebrow">${r}</div>
                    <div class="title ${t?`struck`:``}">${e.summary||this.t(`calendar.noTitle`)}</div>
                    ${i?n`<div class="when">${i}${e.rrule?n`, ${this.t(`invitations.repeats`)}`:c}</div>`:c}
                    ${e.location?n`<div class="muted where">${e.location}</div>`:c}
                    ${e.method===`reply`&&e.replier?n`<div class="replier">${Lt(this.i18nStore,`invitations.answered.${Br(e.replier.status)}`,{name:Pt(e.replier.name,e.replier.email)})}</div>`:e.organizer?n`<div class="muted organizer">${this.t(`invitations.organizer`)}: ${Pt(e.organizer.name,e.organizer.email)}</div>`:c}
                    ${this.renderClashes(e)}
                    ${this.renderStateLine(e)}
                    ${this.renderSender(e)}
                    ${this.notice?n`<div class="notice ${this.notice.tone}" role="status">${this.t(this.notice.key)}</div>`:c}
                    <div class="actions">${this.renderActions(e)}</div>
                </div>
            </div>
        `}};j([h({context:w})],Hr.prototype,`i18nStore`,void 0),j([o()],Hr.prototype,`mailbox`,void 0),j([o()],Hr.prototype,`uid`,void 0),j([a()],Hr.prototype,`view`,void 0),j([a()],Hr.prototype,`busy`,void 0),j([a()],Hr.prototype,`notice`,void 0),j([a()],Hr.prototype,`calendarPath`,void 0),Hr=j([p(`calendar-invitation-banner`)],Hr);var Ur=[`DAILY`,`WEEKLY`,`MONTHLY`,`YEARLY`];function Wr(e){return e?Ur.find(t=>e===`FREQ=${t}`)??`CUSTOM`:``}var Gr=e=>String(e).padStart(2,`0`),P=class extends d{constructor(...e){super(...e),this.open=!1,this.lists=[],this.defaultList=``,this.scheduling=`email`,this.title=``,this.description=``,this.dueDate=``,this.dueTime=``,this.allDay=!0,this.status=`needs-action`,this.priority=0,this.percent=0,this.repeat=``,this.calendarPath=``,this.saving=!1,this.attendees=[],this.askNotify=!1,this.originalRRule=``,this.openedDue={date:``,time:``,allDay:!0}}static{this.styles=[Dr,_`
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
        `]}willUpdate(e){e.has(`open`)&&this.open&&this.reset()}reset(){let e=this.task;this.title=e?.title??``,this.description=e?.description??``,this.status=e?.status??`needs-action`,this.priority=e?.priority??0,this.percent=e?.percentComplete??0,this.calendarPath=e?.calendarPath||this.defaultList||this.lists[0]?.path||``,this.originalRRule=e?.rrule??``,this.repeat=Wr(this.originalRRule),this.dueDate=``,this.dueTime=``,this.allDay=e?.due?e.allDay:!0;let t=e?cn(e):null;t&&(this.dueDate=`${t.getFullYear()}-${Gr(t.getMonth()+1)}-${Gr(t.getDate())}`,this.allDay||(this.dueTime=`${Gr(t.getHours())}:${Gr(t.getMinutes())}`)),this.openedDue={date:this.dueDate,time:this.dueTime,allDay:this.allDay},this.attendees=(e?.attendees??[]).map(Sn),this.askNotify=!1}get assignedToUser(){return this.task?.role===`attendee`}input(){let e=``,t=this.dueDate===this.openedDue.date&&this.dueTime===this.openedDue.time&&this.allDay===this.openedDue.allDay;this.task&&t?e=this.task.due??``:this.dueDate&&(e=this.allDay?`${this.dueDate}T00:00:00Z`:new Date(`${this.dueDate}T${this.dueTime||`09:00`}`).toISOString());let n=e?this.repeat===`CUSTOM`?this.originalRRule:this.repeat?`FREQ=${this.repeat}`:``:``;return{title:this.title.trim(),description:this.description,due:e,allDay:this.allDay,status:this.status,percentComplete:this.status===`completed`?100:this.percent,priority:this.priority,rrule:n,calendarPath:this.calendarPath,etag:this.task?.etag}}setStatus(e){this.status===`completed`&&e!==`completed`&&this.percent>=100&&(this.percent=0),this.status=e}close(){this.open=!1,this.dispatchEvent(new CustomEvent(`close`))}requestDelete(){this.dispatchEvent(new CustomEvent(`delete`,{detail:{task:this.task}}))}async handleSave(){if(!(this.saving||!this.title.trim()||!this.calendarPath)){if(this.task?.role===`organizer`&&Cn(this.task,this.scheduling)){this.askNotify=!0;return}await this.save()}}async save(e){this.askNotify=!1,this.saving=!0;try{let t=!this.task,n={...this.input(),attendees:this.assignedToUser?void 0:this.attendees.map(xn).filter(e=>e!==null),notify:e,lang:this.i18nStore?.getLanguage?.()},r=this.task?await yn.updateTask(this.task.path,n):await yn.createTask(n);r?.sendFailed&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`invitations.notTold`),duration:8e3}})),this.open=!1,this.dispatchEvent(new CustomEvent(`saved`,{detail:{task:r,created:t}}))}catch(e){console.error(`Failed to save task`,e);let t=xt(e);t&&this.dispatchEvent(new CustomEvent(`conflict`)),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(t?`tasks.saveConflict`:`tasks.saveFailed`),duration:8e3}}))}finally{this.saving=!1}}priorityOptions(){let e=e=>this.i18nStore?.t(e)??e,t=[{value:`0`,label:e(`tasks.priorities.none`)},{value:`1`,label:e(`tasks.priorities.high`)},{value:`5`,label:e(`tasks.priorities.medium`)},{value:`9`,label:e(`tasks.priorities.low`)}];if(!t.some(e=>e.value===String(this.priority))){let n=this.priority<=4?`tasks.priorities.high`:this.priority===5?`tasks.priorities.medium`:`tasks.priorities.low`;t.push({value:String(this.priority),label:e(n)})}return t}render(){if(!this.open)return n``;let e=e=>this.i18nStore?.t(e)??e,t=!!this.dueDate,r=this.task;return n`
            <ui-modal
                title=${e(r?`tasks.editTask`:`tasks.newTask`)}
                width="460px"
                ?dismissible=${!this.saving}
                @cancel=${this.close}
            >
                <div class="form-group">
                    <label>${e(`tasks.titleField`)}</label>
                    <alps-input
                        label=${e(`tasks.titleField`)}
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
                            label=${e(`tasks.list`)}
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
                            label=${e(`tasks.due`)}
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
                                label=${e(`tasks.time`)}
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
                                label=${e(`tasks.status`)}
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
                            label=${e(`tasks.priority`)}
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
                                label=${e(`tasks.repeat`)}
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
                        <div><span class="label">${e(`tasks.assignedBy`)}:</span> ${r?.organizer?Pt(r.organizer.name,r.organizer.email):``}</div>
                    </div>
                `:n`
                    <div class="form-group">
                        <label>${e(`tasks.assignTo`)}</label>
                        <alps-address-input
                            class="assignees"
                            label=${e(`tasks.assignTo`)}
                            .addresses=${this.attendees}
                            @addresses-changed=${e=>{this.attendees=e.detail.addresses}}
                        ></alps-address-input>
                    </div>
                    ${r?.role===`organizer`&&r.attendees?.length?n`
                        <div class="assigned answers">
                            ${r.attendees.map(t=>n`<div>${Pt(t.name,t.email)}: ${e(`invitations.statuses.${Br(t.status)}`)}</div>`)}
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
        `}};j([h({context:w})],P.prototype,`i18nStore`,void 0),j([o({type:Boolean})],P.prototype,`open`,void 0),j([o({attribute:!1})],P.prototype,`task`,void 0),j([o({type:Array})],P.prototype,`lists`,void 0),j([o({type:String})],P.prototype,`defaultList`,void 0),j([o({type:String})],P.prototype,`scheduling`,void 0),j([a()],P.prototype,`title`,void 0),j([a()],P.prototype,`description`,void 0),j([a()],P.prototype,`dueDate`,void 0),j([a()],P.prototype,`dueTime`,void 0),j([a()],P.prototype,`allDay`,void 0),j([a()],P.prototype,`status`,void 0),j([a()],P.prototype,`priority`,void 0),j([a()],P.prototype,`percent`,void 0),j([a()],P.prototype,`repeat`,void 0),j([a()],P.prototype,`calendarPath`,void 0),j([a()],P.prototype,`saving`,void 0),j([a()],P.prototype,`attendees`,void 0),j([a()],P.prototype,`askNotify`,void 0),P=j([p(`task-modal`)],P);var Kr=class extends d{constructor(...e){super(...e),this.events=[],this.showTitle=!1,this.weekStart=1,this.focusDay=null,this.dayHadFocus=!1}getFirstDayOfWeek(){return this.weekStart??1}static{this.styles=_`
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
    `}getMonthGrid(){let e=this.getFirstDayOfWeek(),t=(new Date(this.year,this.month,1).getDay()-e+7)%7,n=1-t,r=new Date(this.year,this.month+1,0).getDate(),i=Math.ceil((r+t)/7)*7,a=[];for(let e=0;e<i;e++)a.push(new Date(this.year,this.month,n+e));return a}hasEventsForDate(e){if(!this.events||this.events.length===0)return!1;let t=new Date(e);t.setHours(0,0,0,0);let n=new Date(e);return n.setHours(23,59,59,999),this.events.some(e=>{if(Dn(e)){let n=e.start.split(`T`)[0],r=e.end.split(`T`)[0],i=new Date(n+`T00:00:00`),a=new Date(r+`T00:00:00`);return i<=t&&a>t}else{let r=new Date(e.start),i=new Date(e.end);return i.getTime()===t.getTime()&&r.getTime()<i.getTime()?!1:r<=n&&i>=t}})}handleDateClick(e){this.focusDay=e,this.dispatchEvent(new CustomEvent(`date-selected`,{detail:{date:e},bubbles:!0,composed:!0}))}tabStop(e){if((t=>!!t&&e.some(e=>e.getTime()===t.getTime()))(this.focusDay))return this.focusDay;let t=new Date;t.setHours(0,0,0,0);for(let e of[this.currentDate,t])if(e&&e.getFullYear()===this.year&&e.getMonth()===this.month)return new Date(this.year,this.month,e.getDate());return new Date(this.year,this.month,1)}handleDayKeyDown(e,t,n){if(e.key===`Enter`||e.key===` `){if(e.preventDefault(),e.key===` `&&e.repeat)return;this.handleDateClick(t);return}let r=e.key===`ArrowLeft`?-1:e.key===`ArrowRight`?1:e.key===`ArrowUp`?-7:e.key===`ArrowDown`?7:0;if(!r)return;e.preventDefault();let i=new Date(t.getFullYear(),t.getMonth(),t.getDate()+r);n.some(e=>e.getTime()===i.getTime())&&(this.focusDay=i,this.updateComplete.then(()=>this.renderRoot.querySelector(`.mini-day[tabindex="0"]`)?.focus()))}willUpdate(e){let t=e.get(`currentDate`);(e.has(`year`)||e.has(`month`)||e.has(`currentDate`)&&t?.getTime()!==this.currentDate?.getTime())&&(this.focusDay=null),this.dayHadFocus=!!this.renderRoot?.activeElement?.classList.contains(`mini-day`)}updated(e){this.dayHadFocus&&(e.has(`year`)||e.has(`month`))&&this.renderRoot.querySelector(`.mini-day[tabindex="0"]`)?.focus()}render(){let e=this.getMonthGrid(),t=this.getFirstDayOfWeek(),r=Array.from({length:7},(e,n)=>{let r=(t+n)%7;return this.i18nStore?.t(`calendar.daysNarrow.${r}`)}),i=new Date;i.setHours(0,0,0,0);let a=this.tabStop(e).getTime(),o=new Intl.DateTimeFormat(this.i18nStore?.getIntlLanguage?.(),{dateStyle:`full`}),s=this.i18nStore?.t(`calendar.months.${this.month}`);return n`
            ${this.showTitle?n`<div class="year-month-title">${s}</div>`:``}
            <div class="mini-grid">
                ${r.map(e=>n`<div class="mini-day-name">${e}</div>`)}
                ${e.map(t=>{let r=t.getMonth()!==this.month,s=t.getTime()===i.getTime(),l=this.hasEventsForDate(t),u=t.getDay()===0||t.getDay()===6;return n`
                        <div 
                            class="mini-day ${s?`today`:``} ${l?`has-event`:``} ${u?`weekend`:``}" 
                            style="${r?`opacity: 0.3`:``}"
                            role="button"
                            tabindex=${t.getTime()===a?`0`:`-1`}
                            aria-label=${o.format(t)}
                            aria-current=${s?`date`:c}
                            @click=${()=>this.handleDateClick(t)}
                            @keydown=${n=>this.handleDayKeyDown(n,t,e)}
                        >
                            <span class="day-num">${t.getDate()}</span>
                        </div>
                    `})}
            </div>
        `}};j([h({context:w})],Kr.prototype,`i18nStore`,void 0),j([o({type:Number})],Kr.prototype,`year`,void 0),j([o({type:Number})],Kr.prototype,`month`,void 0),j([o({type:Array})],Kr.prototype,`events`,void 0),j([o({type:Boolean})],Kr.prototype,`showTitle`,void 0),j([o({type:Number})],Kr.prototype,`weekStart`,void 0),j([o({type:Object})],Kr.prototype,`currentDate`,void 0),j([a()],Kr.prototype,`focusDay`,void 0),Kr=j([p(`calendar-mini-month`)],Kr);var qr=class extends d{static{this.styles=_`
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
    `}formatEventDate(e){let t=e.start,n=Dn(e),r;return r=n?new Date(t.split(`T`)[0]+`T00:00:00`):new Date(t),`${this.i18nStore?.t(`calendar.days.${r.getDay()}`)}, ${this.i18nStore?.t(`calendar.monthsShort.${r.getMonth()}`)} ${r.getDate()}, ${r.getFullYear()}`}formatEventTimeRange(e){let t=new Date(e.start),n=new Date(e.end);if(Dn(e))return this.i18nStore?.t(`calendar.allDay`);let r={hour:`numeric`,minute:`2-digit`};return t.toDateString()===n.toDateString()?`${t.toLocaleTimeString(void 0,r)} - ${n.toLocaleTimeString(void 0,r)}`:`${t.toLocaleTimeString(void 0,r)} - ${this.i18nStore?.t(`calendar.monthsShort.${n.getMonth()}`)} ${n.getDate()} ${n.toLocaleTimeString(void 0,r)}`}handleEdit(e){e.stopPropagation();let t=this.closest(`alps-popup`);t&&t.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`edit-event`,{detail:{event:this.event},bubbles:!0,composed:!0}))},10)}handleDelete(e){e.stopPropagation();let t=this.closest(`alps-popup`);t&&t.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`delete-event`,{detail:{event:this.event},bubbles:!0,composed:!0}))},10)}handleComplete(e){e.stopPropagation();let t=this.closest(`alps-popup`);t&&t.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`complete-task`,{detail:{task:this.event.task},bubbles:!0,composed:!0}))},10)}handleRespond(e,t){e.stopPropagation();let n=this.closest(`alps-popup`);n&&n.close(),setTimeout(()=>{this.dispatchEvent(new CustomEvent(`respond-event`,{detail:{event:this.event,status:t},bubbles:!0,composed:!0}))},10)}answerable(e){return!e.ended&&new Date(e.end)>new Date}renderMeeting(e){if(!e.organizer&&!e.attendees?.length)return``;let t=e=>this.i18nStore?.t(e),r=e=>Pt(e.name,e.email),i=(r,i)=>n`
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
                        ${e.attendees.map(e=>n`<li><span>${r(e)}</span><span class="status">${t(`invitations.statuses.${Br(e.status)}`)}</span></li>`)}
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
                    `:n`<div class="description-text answer-status">${t(`invitations.statuses.${Br(e.status)}`)}</div>`}
                `:``}
            </div>
        `}renderTask(e){let t=this.event,r=cn(e);return n`
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
        `}};j([h({context:w})],qr.prototype,`i18nStore`,void 0),j([o({type:Object})],qr.prototype,`event`,void 0),qr=j([p(`calendar-event-preview`)],qr);var Jr=class extends d{constructor(...e){super(...e),this.days=[],this.events=[],this.scrolled=!1,this.now=new Date}connectedCallback(){super.connectedCallback(),this.now=new Date,this.nowTimer=window.setInterval(()=>{this.now=new Date},6e4)}disconnectedCallback(){super.disconnectedCallback(),this.nowTimer!==void 0&&(clearInterval(this.nowTimer),this.nowTimer=void 0)}static{this.styles=_`
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
    `}getEventsForDate(e,t){return this.events?this.events.filter(n=>{let r=Dn(n);if(t!==r)return!1;let i=new Date(e);i.setHours(0,0,0,0);let a=new Date(e);if(a.setHours(23,59,59,999),r){let e=n.start.split(`T`)[0],t=n.end.split(`T`)[0],r=new Date(e+`T00:00:00`),a=new Date(t+`T00:00:00`);return r<=i&&a>i}else{let e=new Date(n.start),t=new Date(n.end);return t.getTime()===i.getTime()&&e.getTime()<t.getTime()?!1:e<=a&&t>=i}}):[]}handleColumnClick(e,t){let n=e.currentTarget.getBoundingClientRect(),r=e.clientY-n.top,i=Math.floor(r/48),a=new Date(t);a.setHours(i,0,0,0),this.dispatchEvent(new CustomEvent(`create-event`,{detail:{date:a,allDay:!1},bubbles:!0,composed:!0}))}handleAllDayCellClick(e){let t=new Date(e);t.setHours(0,0,0,0),this.dispatchEvent(new CustomEvent(`create-event`,{detail:{date:t,allDay:!0},bubbles:!0,composed:!0}))}handleScroll(e){let t=e.target;this.scrolled=t.scrollTop>0}render(){let e=Array.from({length:24},(e,t)=>t),t=new Date(this.now);return t.setHours(0,0,0,0),n`
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
                                                        ${e.task?A(`checkCircle`):``}${e.summary||this.i18nStore?.t(`calendar.noTitle`)}
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
                                        ${r.map(e=>{let t=new Date(e.start),r=new Date(e.end),o=t<i?i:t,s=r>a?a:r,c=t<=i?0:o.getHours()*48+o.getMinutes()/60*48,l=r>a?1152:s.getHours()*48+s.getMinutes()/60*48,u=l<=c&&s>o?(s.getTime()-o.getTime())/36e5*48:l-c;return u<20&&(u=20),c+u>1152&&(u=1152-c),n`
                                                <alps-popup 
                                                    class="time-event-popup"
                                                    align="left" position="bottom" 
                                                    style="top: ${c}px; height: ${u}px;"
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
        `}};j([h({context:w})],Jr.prototype,`i18nStore`,void 0),j([o({type:Array})],Jr.prototype,`days`,void 0),j([o({type:Array})],Jr.prototype,`events`,void 0),j([a()],Jr.prototype,`scrolled`,void 0),j([a()],Jr.prototype,`now`,void 0),Jr=j([p(`calendar-time-grid`)],Jr);var Yr=class extends d{constructor(...e){super(...e),this.events=[]}static{this.styles=_`
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
        `}};j([o({type:Object})],Yr.prototype,`date`,void 0),j([o({type:Array})],Yr.prototype,`events`,void 0),Yr=j([p(`calendar-day-view`)],Yr);var Xr=class extends d{constructor(...e){super(...e),this.events=[],this.weekStart=1}getFirstDayOfWeek(){return this.weekStart??1}static{this.styles=_`
        :host {
            display: flex;
            height: 100%;
            width: 100%;
        }
    `}getWeekDays(){let e=jn(this.date,this.getFirstDayOfWeek()),t=e.getFullYear(),n=e.getMonth(),r=e.getDate();return Array.from({length:7},(e,i)=>new Date(t,n,r+i))}render(){return n`
            <calendar-time-grid 
                .days=${this.getWeekDays()} 
                .events=${this.events}
                .i18nStore=${this.i18nStore}
            ></calendar-time-grid>
        `}};j([h({context:w}),o({attribute:!1})],Xr.prototype,`i18nStore`,void 0),j([o({type:Object})],Xr.prototype,`date`,void 0),j([o({type:Array})],Xr.prototype,`events`,void 0),j([o({type:Number})],Xr.prototype,`weekStart`,void 0),Xr=j([p(`calendar-week-view`)],Xr);var Zr=class extends d{constructor(...e){super(...e),this.events=[],this.weekStart=1}getFirstDayOfWeek(){return this.weekStart??1}static{this.styles=_`
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
    `}getMonthGrid(){let e=this.date.getFullYear(),t=this.date.getMonth(),n=this.getFirstDayOfWeek(),r=(new Date(e,t,1).getDay()-n+7)%7,i=1-r,a=new Date(e,t+1,0).getDate(),o=Math.ceil((a+r)/7)*7,s=[];for(let n=0;n<o;n++)s.push(new Date(e,t,i+n));return s}getEventsForDate(e,t){return this.events?this.events.filter(n=>{let r=Dn(n);if(t!==r)return!1;let i=new Date(e);i.setHours(0,0,0,0);let a=new Date(e);if(a.setHours(23,59,59,999),r){let e=n.start.split(`T`)[0],t=n.end.split(`T`)[0],r=new Date(e+`T00:00:00`),a=new Date(t+`T00:00:00`);return r<=i&&a>i}else{let e=new Date(n.start),t=new Date(n.end);return t.getTime()===i.getTime()&&e.getTime()<t.getTime()?!1:e<=a&&t>=i}}):[]}handleCellClick(e){this.dispatchEvent(new CustomEvent(`create-event`,{detail:{date:e,allDay:!0},bubbles:!0,composed:!0}))}render(){let e=this.getMonthGrid(),t=this.getFirstDayOfWeek(),r=Array.from({length:7},(e,n)=>{let r=(t+n)%7;return this.i18nStore?.t(`calendar.daysShort.${r}`)}),i=new Date;return i.setHours(0,0,0,0),n`
            <div class="month-view">
                <div class="month-header">
                    ${r.map(e=>n`<div class="month-header-cell">${e}</div>`)}
                </div>
                <div class="month-grid">
                    ${e.map(e=>{let t=e.getMonth()!==this.date.getMonth(),r=e.getTime()===i.getTime(),a=this.getEventsForDate(e,!0).concat(this.getEventsForDate(e,!1));return n`
                            <div class="month-cell ${t?`other-month`:``}" @click=${()=>this.handleCellClick(e)} style="cursor: pointer;">
                                <div class="date-number ${r?`today`:``}">${e.getDate()}</div>
                                ${a.slice(0,4).map(e=>n`
                                    <alps-popup align="left" position="bottom" style="width: 100%; display: block;" @click=${e=>e.stopPropagation()}>
                                        <div slot="trigger"
                                            class="event-chip ${Dn(e)?`all-day`:``} ${e.task?`task`:``} ${e.status===`declined`?`declined`:``}" 
                                            style=${e.task?`border-color: ${e.color}`:e.color?`background-color: ${e.color}`:``}
                                            title="${e.summary||this.i18nStore?.t(`calendar.noTitle`)}">
                                            ${e.task?A(`checkCircle`):``}${e.summary||this.i18nStore?.t(`calendar.noTitle`)}
                                        </div>
                                        <calendar-event-preview .event=${e}></calendar-event-preview>
                                    </alps-popup>
                                `)}
                                ${a.length>4?n`<div style="font-size: 11px; color: var(--text-muted); padding-left: 4px;">${this.i18nStore?.t(`calendar.moreEvents`,{count:a.length-4})}</div>`:``}
                            </div>
                        `})}
                </div>
            </div>
        `}};j([h({context:w})],Zr.prototype,`i18nStore`,void 0),j([o({type:Object})],Zr.prototype,`date`,void 0),j([o({type:Array})],Zr.prototype,`events`,void 0),j([o({type:Number})],Zr.prototype,`weekStart`,void 0),Zr=j([p(`calendar-month-view`)],Zr);var Qr=class extends d{constructor(...e){super(...e),this.events=[]}static{this.styles=_`
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
                        .weekStart=${this.weekStart}
                    ></calendar-mini-month>
                `)}
            </div>
        `}};j([o({type:Number})],Qr.prototype,`year`,void 0),j([o({type:Array})],Qr.prototype,`events`,void 0),j([o({type:Number})],Qr.prototype,`weekStart`,void 0),Qr=j([p(`calendar-year-view`)],Qr);var $r=class extends d{constructor(...e){super(...e),this.events=[]}static{this.styles=_`
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
                ${[...this.events].sort((e,t)=>new Date(e.start).getTime()-new Date(t.start).getTime()).map(e=>{let t=Dn(e),r=t?new Date(e.start.split(`T`)[0]+`T00:00:00`):new Date(e.start);return n`
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
        `}};j([h({context:w})],$r.prototype,`i18nStore`,void 0),j([o({type:Array})],$r.prototype,`events`,void 0),$r=j([p(`calendar-list-view`)],$r);var ei=class extends d{constructor(...e){super(...e),this.selectedDate=new Date,this.events=[],this.viewDate=new Date}static{this.styles=_`
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
    `}updated(e){e.has(`selectedDate`)&&this.selectedDate&&(this.viewDate=new Date(this.selectedDate))}changeMonth(e){this.viewDate=new Date(this.viewDate.getFullYear(),this.viewDate.getMonth()+e,1)}render(){let e=this.viewDate.getFullYear(),t=this.viewDate.getMonth(),r=this.i18nStore?.t(`calendar.months.${t}`);return n`
            <div class="mini-calendar-wrapper">
                <div class="mini-header">
                    <alps-icon-btn icon="caretLeft" title=${this.i18nStore?.t(`calendar.previousMonth`)} @click=${()=>this.changeMonth(-1)}></alps-icon-btn>
                    <span>${r} ${e}</span>
                    <alps-icon-btn icon="caretRight" title=${this.i18nStore?.t(`calendar.nextMonth`)} @click=${()=>this.changeMonth(1)}></alps-icon-btn>
                </div>
                <calendar-mini-month
                    .year=${e}
                    .month=${t}
                    .events=${this.events}
                    .currentDate=${this.selectedDate}
                    .weekStart=${this.weekStart}
                    @date-selected=${e=>{this.dispatchEvent(new CustomEvent(`date-selected`,{detail:e.detail,bubbles:!0,composed:!0}))}}
                ></calendar-mini-month>
            </div>
        `}};j([h({context:w})],ei.prototype,`i18nStore`,void 0),j([o({type:Object})],ei.prototype,`selectedDate`,void 0),j([o({type:Array})],ei.prototype,`events`,void 0),j([o({type:Number})],ei.prototype,`weekStart`,void 0),j([a()],ei.prototype,`viewDate`,void 0),ei=j([p(`alps-sidebar-calendar`)],ei);var ti=class extends d{constructor(...e){super(...e),this._handleI18nChange=()=>this.requestUpdate(),this.label=`Today`}static{this.styles=_`
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
                    ${A(`caretLeft`)}
                </button>
                <button @click=${this.handleCenter}>
                    ${this.label}
                </button>
                <button @click=${this.handleNext} aria-label=${this.i18nStore?.t(`general.next`)||`Next`}>
                    ${A(`caretRight`)}
                </button>
            </div>
        `}};j([h({context:w})],ti.prototype,`i18nStore`,void 0),j([o({type:String})],ti.prototype,`label`,void 0),ti=j([p(`alps-nav-buttons`)],ti);var ni=class extends d{constructor(...e){super(...e),this.title=`Prompt`,this.fields=[],this.confirmText=``,this.cancelText=``,this.busy=!1,this.errors={},this.isDanger=!1,this.values={},this.fieldErrors={},this.seededFrom=null,this.submitted=!1}static{this.styles=[Dr,_`
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
      .field-error {
        margin-top: 6px;
        font-size: 13px;
        color: var(--error, #ef4444);
      }
    `]}willUpdate(e){if(e.has(`fields`)){let e=this.fields.map(e=>`${e.id}\u0000${e.value??``}`).join(``);if(e!==this.seededFrom){this.seededFrom=e;let t={};for(let e of this.fields)t[e.id]=e.value||``;this.values=t}}e.has(`errors`)&&(this.fieldErrors={...this.fieldErrors,...this.errors||{}})}firstUpdated(){setTimeout(()=>{let e=this.shadowRoot?.querySelector(`alps-input[autofocus]`);if(e&&typeof e.focus==`function`)e.focus();else{let e=this.shadowRoot?.querySelector(`alps-input`);e&&typeof e.focus==`function`&&e.focus()}},50)}_handleInput(e,t){let n=e.target;this.values={...this.values,[t]:n.value},this.fieldErrors[t]&&(this.fieldErrors={...this.fieldErrors,[t]:``})}_focusField(e){Array.from(this.shadowRoot?.querySelectorAll(`alps-input`)??[]).find(t=>t.inputId===e)?.focus()}_handleKeyDown(e){e.key===`Enter`&&(e.preventDefault(),this._handleSubmit())}_handleCancel(){this.busy||this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}_handleSubmit(){if(this.busy||this.submitted)return;let e={};for(let t of this.fields){let n=t.validate?.(this.values[t.id]||``,this.values);n&&(e[t.id]=n)}if(Object.keys(e).length>0){this.fieldErrors={...this.fieldErrors,...e};return}this.submitted=!0,this.dispatchEvent(new CustomEvent(`submit`,{detail:this.values,bubbles:!0,composed:!0}))}updated(e){(e.has(`busy`)&&!this.busy||e.has(`errors`))&&(this.submitted=!1)}render(){return n`
      <ui-modal 
        .title=${this.title}
        .isDanger=${this.isDanger}
        .dismissible=${!this.busy}
        @cancel=${this._handleCancel}>
        
        <div class="prompt-form">
          ${this.fields.map(e=>n`
            <div class="field-group">
              <label class="field-label" @click=${()=>this._focusField(e.id)}>${e.label}</label>
              <alps-input 
                inputId=${e.id}
                label=${e.label}
                class="field-input"
                type=${e.type||`text`}
                placeholder=${e.placeholder||``}
                autocomplete=${e.autocomplete||``}
                .value=${this.values[e.id]||``}
                ?autofocus=${e.autofocus}
                @input=${t=>this._handleInput(t,e.id)}
                @keydown=${this._handleKeyDown}
              ></alps-input>
              ${this.fieldErrors[e.id]?n`<div class="field-error" role="alert">${this.fieldErrors[e.id]}</div>`:``}
            </div>
          `)}
        </div>
        
        <alps-button slot="actions" variant="text" ?disabled=${this.busy} @click=${this._handleCancel}>${this.cancelText||this.i18nStore?.t(`general.cancel`)||`Cancel`}</alps-button>
        <alps-button slot="actions" variant=${this.isDanger?`danger`:`normal`} ?disabled=${this.busy||this.submitted} @click=${this._handleSubmit}>${this.confirmText||this.i18nStore?.t(`general.save`)||`Save`}</alps-button>
      </ui-modal>
    `}};j([h({context:w})],ni.prototype,`i18nStore`,void 0),j([o({type:String})],ni.prototype,`title`,void 0),j([o({type:Array})],ni.prototype,`fields`,void 0),j([o({type:String})],ni.prototype,`confirmText`,void 0),j([o({type:String})],ni.prototype,`cancelText`,void 0),j([o({type:Boolean})],ni.prototype,`busy`,void 0),j([o({type:Object})],ni.prototype,`errors`,void 0),j([o({type:Boolean})],ni.prototype,`isDanger`,void 0),j([a()],ni.prototype,`values`,void 0),j([a()],ni.prototype,`fieldErrors`,void 0),j([a()],ni.prototype,`submitted`,void 0),ni=j([p(`ui-prompt`)],ni);var ri=250,ii=150,ai=500,oi=120,si=`alps.calendar.showTasks`;function ci(){try{return localStorage.getItem(si)!==`false`}catch{return!0}}function li(e){try{localStorage.setItem(si,String(e))}catch{}}var F=class extends d{constructor(...e){super(...e),this.calendars=[],this.events=[],this.currentDate=new Date,this.viewMode=`month`,this.loading=!0,this.isSpinning=!1,this.modalOpen=!1,this.activeCalendars=new Set,this.showTasks=ci(),this.taskModalOpen=!1,this.searchQuery=``,this.sidebarWidth=250,this.sidebarCollapsed=!1,this.sidebarPeeking=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.promptOpen=!1,this.promptFields=[],this.syncIntervalTimer=null,this.fetchSeq=0,this.promptMode=null,this.promptTarget=null,this.calendarToDelete=null,this.eventToDelete=null,this.scheduling=`email`,this.activeKebabMenu=null,this.isSidebarDragging=!1,this._lastWeekStart=1,this._handleSettingsChange=()=>{if(this.settingsStore){let e=this.settingsStore.getState();this.sidebarCollapsed=e.sidebarCollapsed;let t=this.getFirstDayOfWeek(),n=t!==this._lastWeekStart;if(this._lastWeekStart=t,this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null),e.checkMailInterval&&e.checkMailInterval>0){let t=e.checkMailInterval*60*1e3;this.syncIntervalTimer=setInterval(()=>{this.fetchData()},t)}n&&this.viewMode===`week`&&this.fetchData(),this.requestUpdate()}},this.handleHashChange=()=>{this.parseHash()&&this.fetchData()},this.handleResize=()=>{this.isMobile=window.innerWidth<=768},this.handleSpinIteration=()=>{this.loading||(this.isSpinning=!1)}}static{this.styles=[br,Nr,_`
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

        /* The part of the row that is its checkbox: the box and the name. The
           row's menu sits beside it, not in it. */
        .calendar-control {
            display: flex;
            align-items: center;
            flex: 1;
            min-width: 0;
            border-radius: 4px;
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
        /* Shown while the keyboard is in its row, so that Tab reaches the
           menu from the calendar's checkbox: a button inside display: none is
           no Tab stop, and so it could never take the focus that shows it.
           Not while a click has put the focus on the checkbox: a click leaves
           the row as it was. */
        .calendar-item:focus-within:not(:has(.calendar-control:focus:not(:focus-visible))) .calendar-actions {
            display: flex;
        }
        .calendar-actions:focus-within,
        .calendar-actions.popup-open {
            display: flex;
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
    `]}getFirstDayOfWeek(){return this.settingsStore?.getState()?.weekStart??1}async connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this.handleResize),window.addEventListener(`hashchange`,this.handleHashChange),this.settingsStore&&(this._lastWeekStart=this.getFirstDayOfWeek(),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._handleSettingsChange()),this.parseHash(),await this.fetchData()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this.handleResize),window.removeEventListener(`hashchange`,this.handleHashChange),this.settingsStore&&this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null)}reportFailure(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(e),duration:5e3}}))}parseHash(){let e=window.location.hash;if(!e.startsWith(`#/calendar`))return!1;let[t,n]=e.substring(1).split(`?`),r=t.split(`/`),i=!1;if(r.length>=3){let e=r[2];[`day`,`week`,`month`,`year`].includes(e)&&this.viewMode!==e&&(this.viewMode=e,i=!0)}if(r.length>=4){let e=r[3],t=new Date(this.currentDate);if(this.viewMode===`year`){let n=parseInt(e,10);isNaN(n)||t.setFullYear(n)}else if(this.viewMode===`month`){let[n,r]=e.split(`-`);n&&r&&(t=new Date(parseInt(n,10),parseInt(r,10)-1,1))}else{let[n,r,i]=e.split(`-`);n&&r&&i&&(t=new Date(parseInt(n,10),parseInt(r,10)-1,parseInt(i,10)))}(t.getFullYear()!==this.currentDate.getFullYear()||t.getMonth()!==this.currentDate.getMonth()||t.getDate()!==this.currentDate.getDate())&&(this.currentDate=t,i=!0)}let a=``;return n&&(a=new URLSearchParams(`?`+n).get(`q`)||``),this.searchQuery!==a&&(this.searchQuery=a,i=!0),(t===`/calendar`||t===`/calendar/`)&&history.replaceState(null,``,this.hashFor(this.viewMode,this.currentDate,this.searchQuery)),i}hashFor(e,t,n=``){let r=t.getFullYear(),i=String(t.getMonth()+1).padStart(2,`0`),a=String(t.getDate()).padStart(2,`0`),o=`#/calendar/${e}`;return e===`year`?o+=`/${r}`:e===`month`?o+=`/${r}-${i}`:o+=`/${r}-${i}-${a}`,n&&(o+=`?q=${encodeURIComponent(n)}`),o}navigate(e,t,n=``){let r=this.hashFor(e,t,n);window.location.hash===r?this.fetchData():window.location.hash=r}async fetchData(){let e=++this.fetchSeq;this.loading=!0,this.isSpinning=!0;let t=this.showTasks&&!this.searchQuery?yn.fetchTasks(`active`).catch(t=>(console.error(`Failed to load tasks for the calendar`,t),e===this.fetchSeq&&this.reportFailure(`tasks.loadFailed`),null)):Promise.resolve(null);try{let n=await Mn.fetchCalendars();if(e!==this.fetchSeq)return;this.scheduling=n.scheduling===`server`?`server`:`email`;let r,i,a=this.currentDate.getFullYear(),o=this.currentDate.getMonth();this.viewMode===`year`?(r=new Date(a,0,1),i=new Date(a+1,0,1)):this.viewMode===`month`?(r=new Date(a,o,1),i=new Date(a,o+1,0),r.setDate(r.getDate()-14),i.setDate(i.getDate()+14)):this.viewMode===`week`?(r=jn(this.currentDate,this.getFirstDayOfWeek()),i=new Date(r),i.setDate(r.getDate()+7)):(r=new Date(this.currentDate),r.setHours(0,0,0,0),i=new Date(this.currentDate),i.setHours(23,59,59,999));let s=await Mn.fetchEvents(r,i,this.searchQuery);if(e!==this.fetchSeq)return;let c=s.events||[],l=[];for(let e of c)if(e.rrule)try{let t=new Date(e.start),n=new Date(e.end).getTime()-t.getTime(),a=y.parseString(e.rrule);a.dtstart=t;let o=new y(a).between(r,i,!0);for(let t of o)l.push({...e,start:t.toISOString(),end:new Date(t.getTime()+n).toISOString()})}catch(t){console.error(`Failed to parse rrule for event`,e.uid,t),l.push(e)}else l.push(e);let u=(await t)?.tasks??[];if(e!==this.fetchSeq)return;this.events=[...l,...An(u)].map(e=>({...e,color:e.color||En(e.calendarPath||e.path)})),this.calendars=n.calendars.filter(bn).map(e=>({...e,color:e.color||En(e.path)})),this.activeCalendars.size===0&&this.calendars.length>0&&(this.activeCalendars=new Set(this.calendars.map(e=>e.path)))}catch(t){console.error(t),e===this.fetchSeq&&this.reportFailure(`calendar.loadFailed`)}finally{e===this.fetchSeq&&(this.loading=!1)}}changeDate(e,t){let n=new Date(this.currentDate),r=t||this.viewMode;if(r===`year`||r===`month`){let t=r===`year`?e*12:e,i=new Date(n.getFullYear(),n.getMonth()+t+1,0).getDate();n=new Date(n.getFullYear(),n.getMonth()+t,Math.min(n.getDate(),i))}else r===`week`?n.setDate(n.getDate()+e*7):n.setDate(n.getDate()+e);this.navigate(r,n)}openCreateModal(e,t){this.selectedEvent=void 0,this.initialDate=e,this.initialAllDay=t,this.modalOpen=!0}openEditModal(e){if(e.task){this.editingTask=e.task,this.taskModalOpen=!0;return}this.selectedEvent=e,this.initialDate=void 0,this.initialAllDay=void 0,this.modalOpen=!0}handleModalClose(){this.modalOpen=!1,this.selectedEvent=void 0,this.initialDate=void 0,this.initialAllDay=void 0}async handleModalSaved(){this.modalOpen=!1,this.selectedEvent=void 0,this.initialDate=void 0,this.initialAllDay=void 0,await this.fetchData()}viewShows(e){let t=this.currentDate;if(this.viewMode===`year`)return e.getFullYear()===t.getFullYear();if(this.viewMode===`month`)return e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth();if(this.viewMode===`week`){let n=jn(t,this.getFirstDayOfWeek()),r=new Date(n);return r.setDate(n.getDate()+7),e>=n&&e<r}return e.toDateString()===t.toDateString()}dayForViewSwitch(e){if(e===`day`||e===`week`){let e=new Date;if(this.viewShows(e))return e}return this.currentDate}goToToday(){this.navigate(`day`,new Date)}setViewMode(e){this.navigate(e,this.dayForViewSwitch(e))}handleDateSelected(e){this.navigate(`day`,e),xr(this.renderRoot),this.isMobile&&(this.mobileSidebarOpen=!1)}handleAddCalendar(){this.promptFields=[{id:`name`,label:this.i18nStore?.t(`calendar.calendarName`),autofocus:!0}],this.promptMode=`add`,this.promptOpen=!0}handleRenameCalendar(e){this.promptFields=[{id:`name`,label:this.i18nStore?.t(`calendar.calendarName`),value:e.name,autofocus:!0}],this.promptMode=`rename`,this.promptTarget=e,this.promptOpen=!0}handleDeleteCalendar(e){this.calendarToDelete=e}async _executeDeleteCalendar(){if(!this.calendarToDelete)return;let e=this.calendarToDelete;this.calendarToDelete=null;try{if(await Mn.deleteCalendar(e.path),this.calendars=this.calendars.filter(t=>t.path!==e.path),this.activeCalendars.has(e.path)){let t=new Set(this.activeCalendars);t.delete(e.path),this.activeCalendars=t,await this.fetchData()}}catch(e){console.error(`Failed to delete calendar`,e),this.reportFailure(`calendar.deleteCalendarFailed`)}}async _executeDeleteEvent(e=!0){if(!this.eventToDelete)return;let t=this.eventToDelete;this.eventToDelete=null;try{t.task?(await yn.deleteTask(t.task.path,{notify:e,lang:this.i18nStore?.getLanguage?.()}))?.sendFailed&&this.reportFailure(`invitations.notTold`):(await Mn.deleteEvent(t.path,{notify:e,lang:this.i18nStore?.getLanguage?.()}))?.sendFailed&&this.reportFailure(`invitations.notTold`),await this.fetchData()}catch(e){console.error(`Failed to delete event`,e),this.reportFailure(t.task?`tasks.deleteFailed`:`calendar.deleteEventFailed`)}}isShown(e){return e.task?this.showTasks&&(!this.calendars.some(t=>t.path===e.calendarPath)||this.activeCalendars.has(e.calendarPath)):this.activeCalendars.has(e.calendarPath)}toggleTasks(){this.showTasks=!this.showTasks,li(this.showTasks),this.fetchData()}async respondToEvent(e,t){try{(await Mn.respondToEvent(e,t,this.i18nStore?.getLanguage?.())).sendFailed&&this.reportFailure(`invitations.sendFailed`),await this.fetchData()}catch(e){console.error(`Failed to answer the invitation`,e);let t=xt(e);this.reportFailure(t?`invitations.changedElsewhere`:`invitations.answerFailed`),t&&await this.fetchData()}}async completeTask(e){try{(await yn.completeTask(e.path,!0,this.i18nStore?.getLanguage?.()))?.sendFailed&&this.reportFailure(`invitations.notTold`),await this.fetchData()}catch(e){console.error(`Failed to update task`,e),this.reportFailure(`tasks.completeFailed`)}}closeTaskModal(){this.taskModalOpen=!1,this.editingTask=void 0}handleCheckboxKeyDown(e,t){e.key!==` `&&e.key!==`Enter`||(e.preventDefault(),!e.repeat&&t())}toggleCalendar(e){let t=new Set(this.activeCalendars);t.has(e)?t.delete(e):t.add(e),this.activeCalendars=t}async handlePromptSubmit(e){this.promptOpen=!1;let t=e.detail.name;if(t)try{this.promptMode===`add`?await Mn.createCalendar(t):this.promptMode===`rename`&&this.promptTarget&&await Mn.renameCalendar(this.promptTarget.path,t),await this.fetchData()}catch(e){console.error(`Failed to save calendar`,e),this.reportFailure(`calendar.saveCalendarFailed`)}}handlePromptCancel(){this.promptOpen=!1}get username(){return this.settingsStore?.getState().loginUsername||``}render(){let e=this.i18nStore?.t(`calendar.months.${this.currentDate.getMonth()}`),t=this.currentDate.getFullYear(),r=``;r=this.searchQuery?this.i18nStore?.t(`calendar.searchResults`):this.viewMode===`year`?t.toString():this.viewMode===`day`?`${this.currentDate.getDate()} ${e}`:e;let i=this.events.filter(e=>this.isShown(e));return n`
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
                        .width=${this.sidebarWidth}
                        @toggle-collapse=${()=>{let e=!this.sidebarCollapsed;this.sidebarCollapsed=e,this.settingsStore&&this.settingsStore.updateSettings({sidebarCollapsed:e})}}
                        @sidebar-resize=${e=>{let t=e.detail.newWidth;t<oi?(this.sidebarCollapsed||(this.sidebarCollapsed=!0,this.settingsStore&&this.settingsStore.updateSettings({sidebarCollapsed:!0})),this.sidebarWidth=ri):(this.sidebarCollapsed&&(this.sidebarCollapsed=!1,this.settingsStore&&this.settingsStore.updateSettings({sidebarCollapsed:!1})),this.sidebarWidth=Math.min(Math.max(t,ii),ai))}}
                        @drag-start=${()=>this.isSidebarDragging=!0}
                        @drag-end=${()=>this.isSidebarDragging=!1}
                        @close-sidebar=${()=>this.mobileSidebarOpen=!1}
                        @peek-change=${e=>{this.sidebarPeeking=e.detail.peeking}}
                    >
                    <div class="sidebar-wrapper ${this.sidebarCollapsed&&!this.sidebarPeeking&&!this.isMobile?`collapsed`:``}">
                        <alps-toolbar class="sidebar-header">
                            <alps-create-button 
                                icon="calendarPlus" 
                                ?collapsed=${this.sidebarCollapsed&&!this.sidebarPeeking&&!this.isMobile}
                                @click=${()=>this.openCreateModal()}
                            >${this.i18nStore?.t(`calendar.addEvent`)}</alps-create-button>
                        </alps-toolbar>
                        <!-- Inert in the strip, as it is dimmed there: the
                             calendars, their menus and the mini-month. -->
                        <div class="sidebar-content" ?inert=${this.sidebarCollapsed&&!this.sidebarPeeking&&!this.isMobile}>
                            <div class="sidebar-scroll-content">
                                <div class="calendars-list">
                                    <h3>${this.i18nStore?.t(`calendar.myCalendars`)}</h3>
                                    ${this.calendars.map(e=>n`
                                        <div class="calendar-item" @click=${()=>this.toggleCalendar(e.path)}>
                                            <!-- The calendar's checkbox: one Tab stop, named by
                                                 the calendar. Not the whole row, which also
                                                 holds the calendar's menu. -->
                                            <div class="calendar-control"
                                                role="checkbox"
                                                tabindex="0"
                                                aria-checked=${this.activeCalendars.has(e.path)?`true`:`false`}
                                                @keydown=${t=>this.handleCheckboxKeyDown(t,()=>this.toggleCalendar(e.path))}
                                            >
                                                <div class="calendar-checkbox ${this.activeCalendars.has(e.path)?`checked`:``}" style="--cal-color: ${e.color}">
                                                    ${this.activeCalendars.has(e.path)?A(`check`):``}
                                                </div>
                                                <span>${e.name}</span>
                                            </div>

                                            <div class="calendar-actions ${this.activeKebabMenu===e.path?`popup-open`:``}" @click=${e=>e.stopPropagation()}>
                                                <alps-popup 
                                                    align="right" 
                                                    position="bottom"
                                                    @popup-open=${()=>{this.activeKebabMenu=e.path}}
                                                    @popup-close=${()=>{this.activeKebabMenu===e.path&&(this.activeKebabMenu=null)}}
                                                >
                                                    <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical" title=${this.i18nStore?.t(`general.moreOptions`)}></alps-icon-btn>
                                                    <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.handleRenameCalendar(e)}}>
                                                        ${A(`pen`)} <span class="item-text">${this.i18nStore?.t(`calendar.rename`)}</span>
                                                    </button>
                                                    ${this.calendars.length>1&&!(e.path===`default`||e.path.endsWith(`/default`)||e.path.endsWith(`/default/`))?n`
                                                        <button class="dropdown-item text-danger" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.handleDeleteCalendar(e)}}>
                                                            ${A(`trash`)} <span class="item-text">${this.i18nStore?.t(`calendar.delete`)}</span>
                                                        </button>
                                                    `:``}
                                                </alps-popup>
                                            </div>
                                        </div>
                                    `)}
                                    <div class="calendar-item tasks-toggle" @click=${this.toggleTasks}>
                                        <div class="calendar-control"
                                            role="checkbox"
                                            tabindex="0"
                                            aria-checked=${this.showTasks?`true`:`false`}
                                            @keydown=${e=>this.handleCheckboxKeyDown(e,()=>this.toggleTasks())}
                                        >
                                            <div class="calendar-checkbox ${this.showTasks?`checked`:``}" style="--cal-color: var(--text-secondary, #4b5563)">
                                                ${this.showTasks?A(`check`):``}
                                            </div>
                                            <span>${this.i18nStore?.t(`tasks.title`)}</span>
                                        </div>
                                    </div>
                                </div>

                                <alps-sidebar-calendar
                                    .selectedDate=${this.currentDate}
                                    .events=${i}
                                    .weekStart=${this.getFirstDayOfWeek()}
                                    @date-selected=${e=>this.handleDateSelected(e.detail.date)}
                                ></alps-sidebar-calendar>
                            </div>
                        </div>
                    </div>
                    <alps-icon-btn slot="footer-actions" icon="calendarPlus" title=${this.i18nStore?.t(`calendar.addCalendar`)} @click=${this.handleAddCalendar}></alps-icon-btn>
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
                                .weekStart=${this.getFirstDayOfWeek()}
                                @date-selected=${e=>this.handleDateSelected(e.detail.date)}
                            ></calendar-year-view>
                        `:``}
                        ${this.viewMode===`month`?n`
                            <calendar-month-view 
                                .date=${this.currentDate} 
                                .events=${i}
                                .weekStart=${this.getFirstDayOfWeek()}
                                @create-event=${e=>this.openCreateModal(e.detail.date,e.detail.allDay)}
                                @edit-event=${e=>this.openEditModal(e.detail.event)}
                                @delete-event=${e=>this.eventToDelete=e.detail.event}
                            ></calendar-month-view>
                        `:``}
                        ${this.viewMode===`week`?n`
                            <calendar-week-view 
                                .date=${this.currentDate} 
                                .events=${i}
                                .weekStart=${this.getFirstDayOfWeek()}
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
                    .message=${this.i18nStore?.t(`calendar.deleteCalendarConfirm`,{name:this.calendarToDelete.name})??``}
                    confirmText="${this.i18nStore?.t(`calendar.delete`)}"
                    isDanger
                    @confirm=${this._executeDeleteCalendar}
                    @cancel=${()=>this.calendarToDelete=null}
                ></ui-confirm>
            `:``}

            ${this.eventToDelete&&(this.eventToDelete.task?Cn(this.eventToDelete.task,this.scheduling):wn(this.eventToDelete,this.scheduling))?n`
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
                    title="${this.i18nStore?.t(this.eventToDelete.task?`tasks.deleteTask`:`calendar.deleteEvent`)}"
                    .message=${this.i18nStore?.t(this.eventToDelete.task?`tasks.deleteTaskConfirm`:`calendar.deleteEventConfirm`)??``}
                    confirmText="${this.i18nStore?.t(`calendar.delete`)}"
                    isDanger
                    @confirm=${()=>this._executeDeleteEvent()}
                    @cancel=${()=>this.eventToDelete=null}
                ></ui-confirm>
            `:``}
        `}};j([h({context:w})],F.prototype,`i18nStore`,void 0),j([h({context:T})],F.prototype,`settingsStore`,void 0),j([a()],F.prototype,`calendars`,void 0),j([a()],F.prototype,`events`,void 0),j([a()],F.prototype,`currentDate`,void 0),j([a()],F.prototype,`viewMode`,void 0),j([a()],F.prototype,`loading`,void 0),j([a()],F.prototype,`isSpinning`,void 0),j([a()],F.prototype,`modalOpen`,void 0),j([a()],F.prototype,`selectedEvent`,void 0),j([a()],F.prototype,`initialDate`,void 0),j([a()],F.prototype,`initialAllDay`,void 0),j([a()],F.prototype,`activeCalendars`,void 0),j([a()],F.prototype,`showTasks`,void 0),j([a()],F.prototype,`taskModalOpen`,void 0),j([a()],F.prototype,`editingTask`,void 0),j([a()],F.prototype,`searchQuery`,void 0),j([a()],F.prototype,`sidebarWidth`,void 0),j([a()],F.prototype,`sidebarCollapsed`,void 0),j([a()],F.prototype,`sidebarPeeking`,void 0),j([a()],F.prototype,`isMobile`,void 0),j([a()],F.prototype,`mobileSidebarOpen`,void 0),j([a()],F.prototype,`promptOpen`,void 0),j([a()],F.prototype,`promptFields`,void 0),j([a()],F.prototype,`promptMode`,void 0),j([a()],F.prototype,`promptTarget`,void 0),j([a()],F.prototype,`calendarToDelete`,void 0),j([a()],F.prototype,`eventToDelete`,void 0),j([a()],F.prototype,`scheduling`,void 0),j([a()],F.prototype,`activeKebabMenu`,void 0),j([a()],F.prototype,`isSidebarDragging`,void 0),F=j([p(`calendar-page`)],F);var ui=class extends d{constructor(...e){super(...e),this.text=``,this.fullHeight=!1}static{this.styles=_`
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
      <div class="spinner">${A(`edelweiss`)}</div>
      ${this.text?n`<span>${this.text}</span>`:``}
    `}};j([o({type:String})],ui.prototype,`text`,void 0),j([o({type:Boolean,attribute:`full-height`})],ui.prototype,`fullHeight`,void 0),ui=j([p(`alps-loader`)],ui);var di={overdue:`tasks.groups.overdue`,today:`tasks.groups.today`,week:`tasks.groups.week`,undated:`tasks.groups.undated`,later:`tasks.groups.later`,completed:`tasks.groups.completed`},fi={high:`tasks.priorities.high`,medium:`tasks.priorities.medium`,low:`tasks.priorities.low`},pi={high:`!!!`,medium:`!!`,low:`!`},mi=class extends d{constructor(...e){super(...e),this.tasks=[],this.pendingPaths=new Set,this.settling=new Set,this.searching=!1,this.loading=!1,this.focusedIndex=-1}static{this.styles=_`
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
    `}groups(){let e=this.now??new Date,t=new Map;for(let n of this.tasks){let r=this.settling.has(n.path)?un({...n,status:`needs-action`},e):un(n,e),i=t.get(r);i?i.push(n):t.set(r,[n])}for(let[e,n]of t)n.sort(e===`completed`?pn:fn);return ln.filter(e=>t.has(e)).map(e=>[e,t.get(e)])}toggle(e){this.pendingPaths.has(e.path)||this.dispatchEvent(new CustomEvent(`toggle-complete`,{detail:{task:e,done:e.status!==`completed`}}))}open(e){this.dispatchEvent(new CustomEvent(`open-task`,{detail:{task:e}}))}handleKeyDown(e){if(e.target!==e.currentTarget)return;let t=this.groups().flatMap(([,e])=>e);if(t.length===0)return;let n=Math.min(this.focusedIndex,t.length-1);switch(e.key){case`ArrowDown`:this.focusedIndex=Math.min(t.length-1,n+1);break;case`ArrowUp`:this.focusedIndex=Math.max(0,n-1);break;case`Home`:this.focusedIndex=0;break;case`End`:this.focusedIndex=t.length-1;break;case`Enter`:if(n<0)return;e.preventDefault(),this.open(t[n]);return;case` `:if(n<0)return;e.preventDefault(),this.toggle(t[n]);return;default:return}e.preventDefault(),this.updateComplete.then(()=>{this.renderRoot.querySelector(`.row.focused`)?.scrollIntoView?.({block:`nearest`})})}renderRow(e,t,r){let i=e=>this.i18nStore?.t(e)??e,a=e.status===`completed`,o=e.status===`cancelled`,s=mn(e.priority),c=this.now??new Date;return n`
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
                    ${a?A(`check`):``}
                </button>
                <div class="body">
                    <div class="title">${e.title||i(`tasks.untitled`)}</div>
                    <div class="meta">
                        ${e.color?n`<span class="dot" style="background: ${e.color}"></span>`:``}
                        ${o?n`<span class="chip">${i(`tasks.statuses.cancelled`)}</span>`:``}
                        ${e.due?n`<span class="due ${r===`overdue`?`overdue`:``}">${gn(e,c,i(`tasks.today`),hn(this.i18nStore?.getLanguage?.()))}</span>`:``}
                        ${e.rrule?n`<span class="repeats" role="img" aria-label=${i(`tasks.repeats`)} title=${i(`tasks.repeats`)}>${A(`arrowsClockwise`)}</span>`:``}
                        ${e.role===`attendee`&&e.organizer?n`<span class="assigned">${i(`tasks.assignedBy`)}: ${Pt(e.organizer.name,e.organizer.email)}</span>`:e.role===`organizer`&&e.attendees?.length?n`<span class="assigned">${i(`tasks.assignedTo`)}: ${e.attendees.map((e,t)=>n`${t?`, `:``}${Pt(e.name,e.email)}`)}</span>`:``}
                        ${s?n`<span class="priority ${s}" role="img" aria-label=${i(fi[s])} title=${i(fi[s])}>${pi[s]}</span>`:``}
                    </div>
                </div>
            </div>
        `}render(){if(this.loading&&this.tasks.length===0)return n`<div class="empty"><alps-loader></alps-loader></div>`;let e=this.groups();if(e.length===0)return n`<div class="empty">${this.i18nStore?.t(this.searching?`tasks.noResults`:`tasks.noTasks`)}</div>`;let t=-1;return n`
            <div class="scroll" tabindex="0" @keydown=${this.handleKeyDown}>
                ${e.map(([e,r])=>n`
                        <div class="group ${e}">${this.i18nStore?.t(di[e])}</div>
                        ${f(r,e=>e.path,n=>this.renderRow(n,++t,e))}
                    `)}
            </div>
        `}};j([h({context:w})],mi.prototype,`i18nStore`,void 0),j([o({type:Array})],mi.prototype,`tasks`,void 0),j([o({attribute:!1})],mi.prototype,`pendingPaths`,void 0),j([o({attribute:!1})],mi.prototype,`settling`,void 0),j([o({type:Boolean})],mi.prototype,`searching`,void 0),j([o({type:Boolean})],mi.prototype,`loading`,void 0),j([o({attribute:!1})],mi.prototype,`now`,void 0),j([a()],mi.prototype,`focusedIndex`,void 0),mi=j([p(`tasks-list`)],mi);var hi=250,gi=150,_i=500,vi=120,yi=[{id:`all`,icon:`listBullets`,label:`tasks.allTasks`},{id:`today`,icon:`calendarBlank`,label:`tasks.today`},{id:`upcoming`,icon:`calendar`,label:`tasks.upcoming`},{id:`undated`,icon:`tray`,label:`tasks.undated`},{id:`completed`,icon:`checkCircle`,label:`tasks.completed`}],I=class extends d{constructor(...e){super(...e),this.tasks=[],this.lists=[],this.selectedList=`all`,this.selectedCalendar=``,this.searchQuery=``,this.loading=!0,this.loadedScope=``,this.pendingPaths=new Set,this.settling=new Set,this.modalOpen=!1,this.taskToDelete=null,this.scheduling=`email`,this.isSpinning=!1,this.listPromptOpen=!1,this.sidebarWidth=hi,this.sidebarCollapsed=!1,this.sidebarPeeking=!1,this.isSidebarDragging=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.syncTimer=null,this.readEpoch=0,this.mutationEpoch=0,this.handleSettingsChange=()=>{if(!this.settingsStore)return;let e=this.settingsStore.getState();this.sidebarCollapsed=e.sidebarCollapsed,this.syncTimer&&=(clearInterval(this.syncTimer),null),e.checkMailInterval&&e.checkMailInterval>0&&(this.syncTimer=setInterval(()=>void this.fetchTasks(),e.checkMailInterval*60*1e3))},this.handleResize=()=>{this.isMobile=window.innerWidth<=768},this.handleHashChange=()=>{this.parseHash()&&this.fetchTasks()}}static{this.styles=[br,_`
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
        `]}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this.handleResize),window.addEventListener(`hashchange`,this.handleHashChange),this.settingsStore&&(this.settingsStore.addEventListener(`change`,this.handleSettingsChange),this.handleSettingsChange()),this.parseHash(),this.fetchTasks()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`resize`,this.handleResize),window.removeEventListener(`hashchange`,this.handleHashChange),this.settingsStore?.removeEventListener(`change`,this.handleSettingsChange),this.syncTimer&&=(clearInterval(this.syncTimer),null)}get wantedScope(){return this.searchQuery?`all`:_n(this.selectedList)}parseHash(){let e=window.location.hash;if(!e.startsWith(`#/tasks`))return!1;let[t,n=``]=e.slice(1).split(`?`),r=t.split(`/`)[2]??``,i=new URLSearchParams(n),a=i.get(`list`)??``,o=i.get(`q`)??``,s=r;return yi.some(e=>e.id===r)||(s=`all`,history.replaceState(null,``,this.hashFor(s,a,o))),(s!==this.selectedList||a!==this.selectedCalendar||o!==this.searchQuery)&&(this.settling=new Set),this.selectedList=s,this.selectedCalendar=a,this.searchQuery=o,this.wantedScope!==this.loadedScope}hashFor(e,t,n){let r=new URLSearchParams;t&&r.set(`list`,t),n&&r.set(`q`,n);let i=r.toString();return`#/tasks/${e}${i?`?${i}`:``}`}navigate(e,t=this.selectedCalendar,n=this.searchQuery){let r=this.hashFor(e,t,n);window.location.hash!==r&&(window.location.hash=r)}async fetchTasks(){let e=++this.readEpoch,t=this.mutationEpoch,n=this.wantedScope;this.loading=!0,this.isSpinning=!0;try{let r=await yn.fetchTasks(n===`all`?void 0:n);if(e!==this.readEpoch)return;if(t!==this.mutationEpoch){this.fetchTasks();return}this.lists=r.calendars.map(e=>({...e,color:En(e.path)})),this.tasks=r.tasks.map(e=>({...e,color:En(e.calendarPath)})),this.loadedScope=n,this.scheduling=r.scheduling===`server`?`server`:`email`,this.settling=new Set,r.failedCalendars>0&&this.toast(`tasks.someListsFailed`)}catch(t){if(e!==this.readEpoch)return;console.error(`Failed to load tasks`,t),this.failed(`tasks.loadFailed`,t)}finally{e===this.readEpoch&&(this.loading=!1)}}shows(e,t=new Date){if(this.selectedCalendar&&e.calendarPath!==this.selectedCalendar)return!1;let n=this.searchQuery.trim().toLowerCase();return n?e.title.toLowerCase().includes(n)||(e.description??``).toLowerCase().includes(n):vn(e,this.selectedList,t)}get visibleTasks(){let e=new Date;return this.tasks.filter(t=>this.shows(t,e)||this.settling.has(t.path))}countFor(e){if(this.loadedScope!==`all`&&this.loadedScope!==_n(e))return null;let t=new Date;return this.tasks.filter(n=>(!this.selectedCalendar||n.calendarPath===this.selectedCalendar)&&vn(n,e,t)).length}replaceTask(e,t){this.mutationEpoch++;let n={...t,color:En(t.calendarPath)};this.tasks=this.tasks.map(t=>t.path===e?n:t)}async handleToggleComplete(e,t){if(!this.pendingPaths.has(e.path)){this.pendingPaths=new Set(this.pendingPaths).add(e.path),this.settling=new Set(this.settling).add(e.path),this.replaceTask(e.path,{...e,status:t?`completed`:`needs-action`});try{let n=await yn.completeTask(e.path,t,this.i18nStore?.getLanguage?.());this.replaceTask(e.path,n),n.sendFailed&&this.toast(`invitations.notTold`),t&&!sn(n)&&this.toast(`tasks.movedToNext`,{date:this.formatDue(n)})}catch(t){console.error(`Failed to update task`,t),this.replaceTask(e.path,e),this.failed(`tasks.completeFailed`,t)}finally{let t=new Set(this.pendingPaths);t.delete(e.path),this.pendingPaths=t}}}handleSaved(e){let{task:t,created:n}=e.detail;this.closeModal(),this.mutationEpoch++;let r={...t,color:En(t.calendarPath)};if(this.tasks=n?[r,...this.tasks]:this.tasks.map(e=>e.path===r.path?r:e),!this.shows(r))if(n){let e=this.selectedCalendar===r.calendarPath?this.selectedCalendar:``;this.navigate(sn(r)?`completed`:`all`,e,``)}else this.settling=new Set(this.settling).add(r.path)}async confirmDelete(e=!0){let t=this.taskToDelete;if(t){this.taskToDelete=null;try{(await yn.deleteTask(t.path,{notify:e,lang:this.i18nStore?.getLanguage?.()}))?.sendFailed&&this.toast(`invitations.notTold`),this.mutationEpoch++,this.tasks=this.tasks.filter(e=>e.path!==t.path)}catch(e){console.error(`Failed to delete task`,e),this.failed(`tasks.deleteFailed`,e)}}}async handleListPromptSubmit(e){this.listPromptOpen=!1;let t=String(e.detail?.name??``).trim();if(t)try{await Mn.createCalendar(t,[`VTODO`]),await this.fetchTasks()}catch(e){console.error(`Failed to create list`,e),this.failed(`tasks.createListFailed`,e)}}openCreate(){this.editingTask=void 0,this.modalOpen=!0,this.mobileSidebarOpen=!1}openEdit(e){this.editingTask=e,this.modalOpen=!0}closeModal(){this.modalOpen=!1,this.editingTask=void 0}selectList(e){this.mobileSidebarOpen=!1,xr(this.renderRoot),this.navigate(e,this.selectedCalendar,``)}selectCalendar(e){this.mobileSidebarOpen=!1,xr(this.renderRoot),this.navigate(this.selectedList,this.selectedCalendar===e?``:e,this.searchQuery)}formatDue(e){return gn(e,new Date,this.i18nStore?.t(`tasks.today`)??`Today`,hn(this.i18nStore?.getLanguage?.()))}failed(e,t){Ct(t)||this.toast(e)}toast(e,t){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(e,t),duration:5e3}}))}handleSidebarResize(e){let t=e.detail.newWidth,n=t<vi;n!==this.sidebarCollapsed&&(this.sidebarCollapsed=n,this.settingsStore?.updateSettings({sidebarCollapsed:n})),this.sidebarWidth=n?hi:Math.min(Math.max(t,gi),_i)}get username(){return this.settingsStore?.getState().loginUsername||``}render(){let e=e=>this.i18nStore?.t(e)??e,t=this.sidebarCollapsed&&!this.sidebarPeeking&&!this.isMobile,r=yi.find(e=>e.id===this.selectedList)??yi[0],i=this.lists.find(e=>e.path===this.selectedCalendar)?.name??``,a=this.selectedCalendar||this.lists[0]?.path||``;return n`
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
                        .width=${this.sidebarWidth}
                        @toggle-collapse=${()=>{this.sidebarCollapsed=!this.sidebarCollapsed,this.settingsStore?.updateSettings({sidebarCollapsed:this.sidebarCollapsed})}}
                        @sidebar-resize=${this.handleSidebarResize}
                        @drag-start=${()=>{this.isSidebarDragging=!0}}
                        @drag-end=${()=>{this.isSidebarDragging=!1}}
                        @close-sidebar=${()=>{this.mobileSidebarOpen=!1}}
                        @peek-change=${e=>{this.sidebarPeeking=e.detail.peeking}}
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
                            <!-- Inert in the strip, as it is dimmed there. -->
                            <div class="sidebar-content" ?inert=${t}>
                                <div class="sidebar-scroll-content">
                                    <nav class="smart-lists">
                                        ${yi.map(t=>{let r=this.countFor(t.id);return n`
                                                <button
                                                    class="nav-item smart-list ${t.id===this.selectedList&&!this.searchQuery?`active`:``}"
                                                    data-list=${t.id}
                                                    title=${e(t.label)}
                                                    @click=${()=>this.selectList(t.id)}
                                                >
                                                    ${A(t.icon)}
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

            ${this.taskToDelete&&Cn(this.taskToDelete,this.scheduling)?n`
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
        `}};j([h({context:w})],I.prototype,`i18nStore`,void 0),j([h({context:T})],I.prototype,`settingsStore`,void 0),j([a()],I.prototype,`tasks`,void 0),j([a()],I.prototype,`lists`,void 0),j([a()],I.prototype,`selectedList`,void 0),j([a()],I.prototype,`selectedCalendar`,void 0),j([a()],I.prototype,`searchQuery`,void 0),j([a()],I.prototype,`loading`,void 0),j([a()],I.prototype,`loadedScope`,void 0),j([a()],I.prototype,`pendingPaths`,void 0),j([a()],I.prototype,`settling`,void 0),j([a()],I.prototype,`modalOpen`,void 0),j([a()],I.prototype,`editingTask`,void 0),j([a()],I.prototype,`taskToDelete`,void 0),j([a()],I.prototype,`scheduling`,void 0),j([a()],I.prototype,`isSpinning`,void 0),j([a()],I.prototype,`listPromptOpen`,void 0),j([a()],I.prototype,`sidebarWidth`,void 0),j([a()],I.prototype,`sidebarCollapsed`,void 0),j([a()],I.prototype,`sidebarPeeking`,void 0),j([a()],I.prototype,`isSidebarDragging`,void 0),j([a()],I.prototype,`isMobile`,void 0),j([a()],I.prototype,`mobileSidebarOpen`,void 0),I=j([p(`tasks-page`)],I);var bi=e({});b.registerRoute({path:`/calendar/*`,component:`calendar-page`,pluginId:`caldav`}),b.registerNavTab({id:`calendar`,pluginId:`caldav`,labelKey:`navigation.calendar`,icon:`calendar`,order:20}),b.registerRoute({path:`/tasks/*`,component:`tasks-page`,pluginId:`caldav`}),b.registerNavTab({id:`tasks`,pluginId:`caldav`,labelKey:`navigation.tasks`,icon:`checkCircle`,order:30}),b.registerHook(`reader:content`,e=>{let t=e?.message;if(!t||!Lr(t.BodyStructure))return;let r=e.mailbox||t.Mailbox;!r||t.UID===void 0||(e.banners=e.banners||[],e.banners.push(n`<calendar-invitation-banner .mailbox=${r} .uid=${String(t.UID)}></calendar-invitation-banner>`))},`caldav`);function xi(e){let t=0,n=0;for(let r of e)r.status===`rejected`&&(t+=1,St(r.reason)&&(n+=1),console.error(`Bulk contact operation failed for one item`,r.reason));return{total:e.length,done:e.length-t,failed:t,uncertain:n}}var L=new class{async fetchContacts(e=``){let t=await D(e?`/contacts?query=${encodeURIComponent(e)}`:`/contacts`);if(!t.ok)throw Error(`Failed to fetch contacts: ${t.statusText}`);return t.json()}async fetchContact(e){let t=await D(`/contacts/${bt(e)}`);if(!t.ok)throw Error(`Failed to fetch contact: ${t.statusText}`);return t.json()}async createContact(e){let t=await D(`/contacts/create`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(!t.ok)throw new E(t.status,`Failed to create contact: ${t.statusText}`);return t.json()}async updateContact(e,t){let n=await D(`/contacts/${bt(e)}/edit`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!n.ok)throw new E(n.status,`Failed to update contact: ${n.statusText}`);return n.json()}async updateCategories(e,t){let n=await D(`/contacts/${bt(e)}/categories`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({categories:t})});if(!n.ok)throw new E(n.status,`Failed to update contact: ${n.statusText}`);return n.json()}async deleteContact(e){let t=await D(`/contacts/${bt(e)}`,{method:`DELETE`});if(!t.ok)throw new E(t.status,`Failed to delete contact: ${t.statusText}`)}async bulkUpdateCategories(e){let t=e.filter(e=>e.path),n=await Promise.allSettled(t.map(e=>this.updateCategories(e.path,e.categories??[]))),r={};return n.forEach((e,n)=>{e.status===`fulfilled`&&e.value?.etag&&(r[t[n].path]=e.value.etag)}),{...xi(n),etags:r}}async bulkDeleteContacts(e){let t=await Promise.allSettled(e.map(e=>this.deleteContact(e))),n=e.filter((e,n)=>t[n].status===`fulfilled`);return{...xi(t),deletedPaths:n}}},Si=`All Contacts`,Ci=`Favorites`;function wi(e,t){let n=`#/${t}`;if(!e.startsWith(n))return!1;let r=e.slice(n.length);return r===``||r.startsWith(`/`)||r.startsWith(`?`)}var Ti=`alps_msg_`,Ei=1800*1e3,Di=0;typeof window<`u`&&window.addEventListener(`session-cleared`,()=>{Di++});function Oi(){try{let e=[];for(let t=0;t<sessionStorage.length;t++){let n=sessionStorage.key(t);n&&n.startsWith(Ti)&&e.push(n)}e.forEach(e=>sessionStorage.removeItem(e))}catch(e){S.error(`Failed to clear message cache`,e)}}var ki={generation(){return Di},get(e,t,n=`html`){try{let r=`${Ti}${e}_${t}_${n}`,i=sessionStorage.getItem(r);if(!i)return null;let a=JSON.parse(i);return Date.now()-a.timestamp>Ei?(sessionStorage.removeItem(r),null):a}catch(e){return S.error(`Failed to read message cache`,e),null}},set(e,t,n,r){try{let i=`${Ti}${e}_${t}_${n}`,a={...r,timestamp:Date.now()},o=JSON.stringify(a);if(o.length>2*1024*1024){console.warn(`Message ${t} is too large to cache (${Math.round(o.length/1024)}KB)`);return}sessionStorage.setItem(i,o)}catch(i){if(i instanceof DOMException&&(i.name===`QuotaExceededError`||i.code===22)){console.warn(`Session storage quota exceeded, clearing cache and retrying...`),Oi();try{let i=`${Ti}${e}_${t}_${n}`,a={...r,timestamp:Date.now()};sessionStorage.setItem(i,JSON.stringify(a))}catch(e){S.error(`Failed to write message cache even after clearing`,e)}}else S.error(`Failed to write message cache`,i)}},clear(){Di++,Oi()}};function R(e,t){return`${e??``}\0${String(t)}`}function Ai(e){let t=e.indexOf(`\0`);return t===-1?{mailbox:``,uid:e}:{mailbox:e.slice(0,t),uid:e.slice(t+1)}}function ji(e){let t=new Map;for(let n of e){let{mailbox:e,uid:r}=Ai(n),i=t.get(e);i?i.push(r):t.set(e,[r])}return t}function Mi(e,t){return typeof e?.Mailbox==`string`&&e.Mailbox?e.Mailbox:t}var Ni=`alps-mail-poll`,Pi=`alps-mail-poll-counts`,Fi=60*1e3,Ii=600*1e3,Li=30,Ri=class extends EventTarget{constructor(){super(),this.interval=null,this.currentMailbox=O,this.currentPage=0,this.currentQuery=``,this.listed=!1,this.heard=null,this.shownCheck=null,this.pollMinutes=0,this.leading=!1,this.releaseLead=null,this.leadRequest=null,this.lockFailed=!1,this.pollGeneration=0,this.pollBusy=!1,this.channel=null,this.peerId=zi(),this.sessionEpoch=zi(),this.username=null,this.peers=new Map,this.listings=new Map,this.latestMailboxes=null,this.listingSettingsKey=``,this.listingOut=null,this.changes=[],this.changeSeq=0,this.listingsOut=0,this.watching=!1,this.handleShown=()=>{this.tellView(),!(this.shownCheck||document.hidden||!this.listed||!this.heard)&&(Date.now()-this.heard.at<Fi||(this.shownCheck=this.backgroundSync({announce:this.announces}).finally(()=>{this.shownCheck=null})))},this.handlePollMessage=e=>{let t=e.data;if(!(!t||this.pollMinutes<=0)){if(t.type===`leader`||t.type===`hello`){this.tellView();return}if(t.type===`leave`){this.peers.delete(t.peer);return}if(t.type===`watch`&&(this.leading||!navigator.locks||this.lockFailed)){if(typeof t.peer!=`string`||typeof t.epoch!=`string`||typeof t.mailbox!=`string`||t.username!==this.username)return;this.peers.set(t.peer,{...t,seen:Date.now()});return}t.type!==`counts`||this.leading||document.hidden||!this.listed||t.peer!==this.peerId||t.epoch!==this.sessionEpoch||t.username!==this.username||t.mailbox!==this.currentMailbox||(this.tellView(),this.backgroundSync({announce:!1,scheduled:!0,shared:{mailbox:Vi(t.counts),inbox:Vi(t.inbox)}}))}},this.writing=0,this.syncAsked=!1,this.refreshAsked=!1,this.currentFetchId=0,this.currentLabelsId=0,window.addEventListener(`session-cleared`,()=>{this.resetPollSession(),this.currentFetchId++,this.currentLabelsId++,this.listed=!1,this.heard=null,this.forgetListings(),this.latestMailboxes=null}),window.addEventListener(`user-logged-in`,()=>{this.resetPollSession(),this.currentFetchId++,this.currentLabelsId++,this.listed=!1,this.heard=null,this.forgetListings(),this.latestMailboxes=null}),window.addEventListener(`external-message-flags-changed`,e=>{let{keys:t,flag:n,action:r}=e.detail??{};if(!Array.isArray(t)||typeof n!=`string`)return;let i=new Set(t);for(let e of this.listings.values())Ui(e,i,n,r);this.noteChange(e=>Ui(e,i,n,r))}),window.addEventListener(`draft-autosaved`,e=>{let{mailbox:t,oldMailbox:n}=e.detail??{};this.forgetListings(e=>e===t||e===n||e===`*`),this.noteChange()})}rowsTakenOut(e){e.length>0&&this.forgetListings();let t=new Set(e);return this.noteChange(e=>Wi(e,t)),()=>t.clear()}noteChange(e){this.listingsOut!==0&&this.changes.push({seq:++this.changeSeq,replay:e})}listingSent(){return this.listingsOut++,this.changeSeq}listingDone(){this.listingsOut--,this.listingsOut===0&&(this.changes=[])}replayChanges(e,t){let n=!1;for(let r of this.changes)r.seq<=t||(n=!0,r.replay?.(e));return n}setListingSettings(e){e!==this.listingSettingsKey&&(this.listingSettingsKey=e,this.forgetListings(),this.noteChange())}listingKey(e,t,n){return[e,t,n].join(`\0`)}keptListing(e,t,n){let r=this.listingKey(e,t,n),i=this.listings.get(r);if(!i)return;this.listings.delete(r),this.listings.set(r,i);let a=JSON.parse(JSON.stringify(i));return this.latestMailboxes&&(a.Mailboxes=this.latestMailboxes),a}keepListing(e,t,n,r){r.Mailboxes&&(this.latestMailboxes=r.Mailboxes);let i=JSON.parse(JSON.stringify(r));delete i.Mailboxes;let a=this.listingKey(e,t,n);for(this.listings.delete(a),this.listings.set(a,i);this.listings.size>Li;)this.listings.delete(this.listings.keys().next().value)}forgetListings(e){if(!e){this.listings.clear();return}for(let[t,n]of[...this.listings])e(n.ListedMailbox??``)&&this.listings.delete(t)}setContext(e,t,n=``){this.currentMailbox=e,this.currentPage=t,this.currentQuery=n,this.tellView()}start(e=5){if(this.stop(),this.pollMinutes=e,this.lockFailed=!1,e<=0)return;this.watchShown(!0);try{typeof window.BroadcastChannel==`function`&&(this.channel=new window.BroadcastChannel(Pi),this.channel.onmessage=this.handlePollMessage)}catch(e){S.error(`Failed to share poll counts`,e)}this.tellView(),this.postPoll({type:`hello`});let t=typeof navigator<`u`?navigator.locks:void 0;if(!t){this.startTimer();return}this.channel||this.startTimer();let n=this.pollGeneration,r=this.leadRequest=new AbortController;t.request(Ni,{signal:r.signal},()=>new Promise(e=>{if(this.pollMinutes<=0||n!==this.pollGeneration){e();return}this.leading=!0,this.releaseLead=()=>{this.leading=!1,this.releaseLead=null,e()},this.postPoll({type:`leader`}),this.startTimer()})).catch(e=>{r.signal.aborted||n!==this.pollGeneration||(S.error(`Failed to take the poll lock`,e),this.lockFailed=!0,this.postPoll({type:`hello`}),this.tellView(),this.pollMinutes>0&&!this.leading&&this.startTimer())})}stop(){this.pollMinutes=0,this.pollGeneration++,this.leadRequest?.abort(),this.leadRequest=null,this.postPoll({type:`leave`,peer:this.peerId}),this.channel?.close(),this.channel=null,this.peers.clear(),this.stopTimer(),this.giveUpLead(),this.watchShown(!1)}startTimer(){this.stopTimer(),this.interval=setInterval(()=>void this.poll(),this.pollMinutes*60*1e3)}stopTimer(){this.interval&&=(clearInterval(this.interval),null)}giveUpLead(){this.releaseLead?.()}get announces(){return this.pollMinutes<=0||this.leading?!0:navigator.locks&&!this.lockFailed?!1:[...this.peers.values()].every(e=>e.username!==this.username||Date.now()-e.seen>Math.max(this.pollMinutes*3*6e4,18e4)||e.peer>this.peerId)}watchShown(e){e===this.watching||typeof document>`u`||(this.watching=e,e?(document.addEventListener(`visibilitychange`,this.handleShown),window.addEventListener(`focus`,this.handleShown)):(document.removeEventListener(`visibilitychange`,this.handleShown),window.removeEventListener(`focus`,this.handleShown)))}postPoll(e){try{this.channel?.postMessage(e)}catch(e){S.error(`Failed to share poll counts`,e),this.channel?.close(),this.channel=null,this.pollMinutes>0&&this.startTimer()}}tellView(){!this.username||this.pollMinutes<=0||this.postPoll({type:`watch`,peer:this.peerId,epoch:this.sessionEpoch,username:this.username,mailbox:this.currentMailbox,visible:!document.hidden})}resetPollSession(){let e=this.pollMinutes;this.stop(),this.sessionEpoch=zi(),this.username=null,e>0&&this.start(e)}async poll(){if(!(this.pollBusy||this.pollMinutes<=0)){this.pollBusy=!0;try{if(!this.leading||!this.channel||!this.username){if(!this.leading&&navigator.locks&&!this.lockFailed&&document.hidden)return;this.tellView(),await this.backgroundSync({announce:this.announces,scheduled:!0});return}let e=this.pollGeneration,t=this.username,n=[...this.peers.values()].filter(e=>e.visible&&e.username===t&&Date.now()-e.seen<=Math.max(this.pollMinutes*3*6e4,18e4)),r=this.currentMailbox,i=this.currentFetchId,a=new Set([O,r,...n.map(e=>e.mailbox)]),o=new Map;for(let t of a)if(o.set(t,t===`*`?null:await this.askCounts(t).catch(()=>null)),!this.leading||e!==this.pollGeneration)return;for(let e of n)this.postPoll({type:`counts`,peer:e.peer,epoch:e.epoch,username:t,mailbox:e.mailbox,counts:o.get(e.mailbox),inbox:o.get(O)});if(r!==this.currentMailbox||i!==this.currentFetchId)return;await this.backgroundSync({announce:!0,scheduled:!0,shared:{mailbox:o.get(r)??null,inbox:o.get(`INBOX`)??null}})}finally{this.pollBusy=!1}}}mailboxRenamed(e,t){if(this.forgetListings(),this.currentMailbox===e)this.currentMailbox=t;else if(this.currentMailbox.startsWith(e)){let n=this.currentMailbox.slice(e.length);/^[^A-Za-z0-9]/.test(n)&&(this.currentMailbox=t+n)}}mailboxDeleted(e){this.forgetListings(),(this.currentMailbox===e||Zn(this.currentMailbox,e))&&(this.currentMailbox=O,this.currentPage=0,this.listed=!1)}sync({refresh:e=!1}={}){if(this.writing>0){this.syncAsked=!0,this.refreshAsked||=e;return}this.forgetListings(),this.fetch(this.currentMailbox,this.currentPage,this.currentQuery,e,!0,{probe:!e})}async afterWrites(e){this.writing++;try{return await e()}finally{if(this.writing--,this.writing===0&&this.syncAsked){let e=this.refreshAsked;this.syncAsked=!1,this.refreshAsked=!1,this.sync({refresh:e})}}}syncIfViewing(e){this.currentMailbox===e&&this.sync()}async syncLabels(){let e=++this.currentLabelsId;try{let t=await D(`/mailboxes`);if(this.currentLabelsId!==e)return;if(t.status===401){window.dispatchEvent(new CustomEvent(`auth-error`));return}if(!t.ok)throw Error(`HTTP ${t.status}`);let n=await t.json();if(this.currentLabelsId!==e||!n.Mailboxes)return;this.latestMailboxes=n.Mailboxes,this.dispatchEvent(new CustomEvent(`labels-success`,{detail:{mailboxes:n.Mailboxes}}))}catch(e){S.error(`Failed to refresh folder list`,e)}}async fetch(e,t,n=``,r=!1,i=!1,{probe:a=!1}={}){this.setContext(e,t,n),this.listed=!1;let o=++this.currentFetchId,s=r?void 0:this.keptListing(e,t,n);s&&(i=!0),this.dispatchEvent(new CustomEvent(`sync-start`,{detail:{background:!1,quiet:i}})),s&&(s.ListedMailbox=e,this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:s,background:!1,quiet:i,kept:!0}})));let c=Date.now(),l=async()=>{if(i)return;let e=Date.now()-c;e<200&&await new Promise(t=>setTimeout(t,200-e))},u=null;try{for(;this.listingOut;)if(await this.listingOut,this.currentFetchId!==o)return;if(a){let t=e=>D(`/mailboxes/${k(e)}/status`).catch(()=>{});if(e!==`INBOX`&&await t(O),this.currentFetchId!==o||(e!==`*`&&await t(e),this.currentFetchId!==o))return}let s=`/mailboxes/${k(e)}?page=${t}`;n&&(s+=`&query=${encodeURIComponent(n)}`),r&&(s+=`&refresh=true`);let c=D(s),d=c.then(()=>{},()=>{});this.listingOut=d,u=this.listingSent();let f;try{f=await c}finally{this.listingOut===d&&(this.listingOut=null)}if(this.currentFetchId!==o)return;if(f.status===401){window.dispatchEvent(new CustomEvent(`auth-error`));return}if(f.status===404){this.forgetListings(t=>t===e),this.dispatchEvent(new CustomEvent(`mailbox-not-found`));return}if(!f.ok)throw Error(`HTTP ${f.status}`);let p=await f.json();if(this.currentFetchId!==o||(await l(),this.currentFetchId!==o))return;this.listed=!0,p.ListedMailbox=e,this.hear(e,t,n,p);let m=this.replayChanges(p,u);f.ok&&!m&&this.keepListing(e,t,n,p),this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:p,background:!1,quiet:i}}))}catch(e){if(this.currentFetchId!==o||(S.error(`Failed to fetch mailbox data`,e),await l(),this.currentFetchId!==o))return;this.dispatchEvent(new CustomEvent(`sync-error`,{detail:{error:e,background:!1,quiet:i}}))}finally{u!==null&&this.listingDone()}}viewKey(e,t,n){return[e,t,n].join(`\0`)}hear(e,t,n,r){let i=Date.now();typeof r.Username==`string`&&r.Username!==this.username&&(this.username=r.Username,this.leading&&this.postPoll({type:`leader`}),this.tellView(),this.postPoll({type:`hello`})),this.heard={view:this.viewKey(e,t,n),inbox:Bi(r.Inbox),mailbox:Bi(r.Mailbox),read:i,at:i}}relistDue(e,t,n){let r=n?Math.max(this.pollMinutes,0)*60*1e3/2:0;return t-e>=Ii-r}async askCounts(e){let t=await D(`/mailboxes/${k(e)}/status`);if(!t.ok)return null;let n=await t.json().catch(()=>null);return typeof n?.total!=`number`||typeof n?.unseen!=`number`?null:Vi(n)}async check(e,t,n=``){if(!(this.listed&&t===0&&this.currentPage===0&&e===this.currentMailbox&&n===this.currentQuery))return this.fetch(e,t,n,!0);this.dispatchEvent(new CustomEvent(`sync-start`,{detail:{background:!0}})),!await this.backgroundSync({announce:this.announces})&&this.dispatchEvent(new CustomEvent(`sync-error`,{detail:{error:null,background:!0}}))}async backgroundSync({announce:e=!0,scheduled:t=!1,shared:n}={}){let r=++this.currentFetchId,i=this.pollGeneration,a=()=>this.currentFetchId!==r||t&&i!==this.pollGeneration,o=this.currentMailbox,s=this.currentPage,c=this.currentQuery,l=Date.now(),u=null;try{let r=n?.inbox??null;if(!n&&o!==`INBOX`&&(r=await this.askCounts(O).catch(()=>null)),a())return!0;let i=n?n.mailbox:await this.askCounts(o);if(a())return!0;let d=this.heard,f=d!==null&&this.listed&&d.view===this.viewKey(o,s,c)&&Hi(i,d.mailbox)&&(o===`INBOX`||Hi(r,d.inbox));if(d&&f&&!this.relistDue(d.read,l,t))return d.at=Date.now(),this.dispatchEvent(new CustomEvent(`sync-unchanged`,{detail:{background:!0}})),!0;let p=`/mailboxes/${k(o)}?page=${s}`;c&&(p+=`&query=${encodeURIComponent(c)}`),f&&(p+=`&refresh=true`),u=this.listingSent();let m=await D(p);if(a())return!0;if(m.status===401)return window.dispatchEvent(new CustomEvent(`auth-error`)),!0;if(m.status===404)return this.forgetListings(e=>e===o),this.dispatchEvent(new CustomEvent(`mailbox-not-found`)),!0;if(!m.ok)throw Error(`HTTP ${m.status}`);let h=await m.json();if(a())return!0;h.ListedMailbox=o,this.hear(o,s,c,h);let g=this.replayChanges(h,u);return m.ok&&!g&&this.keepListing(o,s,c,h),this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:h,background:!0,announce:e&&this.announces}})),!0}catch(e){return a()?!0:(S.error(`Background sync failed`,e),!1)}finally{u!==null&&this.listingDone()}}};function zi(){return globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}-${Math.random()}`}function Bi(e){return typeof e?.NumMessages!=`number`||typeof e?.NumUnseen!=`number`?null:{total:e.NumMessages,unseen:e.NumUnseen,uidnext:e.UIDNext,uidvalidity:e.UIDValidity}}function Vi(e){return typeof e?.total!=`number`||typeof e?.unseen!=`number`?null:{total:e.total,unseen:e.unseen,uidnext:typeof e.uidnext==`number`?e.uidnext:void 0,uidvalidity:typeof e.uidvalidity==`number`?e.uidvalidity:void 0}}function Hi(e,t){return!!e&&!!t&&e.total===t.total&&e.unseen===t.unseen&&e.uidnext===t.uidnext&&e.uidvalidity===t.uidvalidity}function Ui(e,t,n,r){let i=e.ListedMailbox??``,a=e=>{if(!t.has(R(Mi(e,i),e?.UID)))return;let a=Array.isArray(e.Flags)?e.Flags:[];r===`add`&&!a.includes(n)&&(e.Flags=[...a,n]),r===`remove`&&(e.Flags=a.filter(e=>e!==n))};for(let t of e.Messages??[])a(t),(t?.SubMessages??[]).forEach(a)}function Wi(e,t){if(t.size===0||!e.Messages)return;let n=e.ListedMailbox??``,r=e=>R(Mi(e,n),e?.UID),i=0;e.Messages=e.Messages.flatMap(e=>{let n=e?.SubMessages??[],a=n.filter(e=>!t.has(r(e)));return t.has(r(e))&&a.length===0?(i++,[]):[a.length===n.length?e:{...e,SubMessages:a}]}),i>0&&typeof e.Total==`number`&&(e.Total=Math.max(0,e.Total-i))}var z=new Ri,B=`\\Seen`,V=`\\Flagged`,Gi=`\\Answered`,Ki=`\\Deleted`,qi=`\\Draft`,Ji=`$Forwarded`,Yi=`$MDNSent`,Xi=`Junk`,Zi=`NonJunk`,Qi=`NotJunk`,$i=`$Junk`,ea=`$NotJunk`,ta=`$Phishing`,na=`$SubmitPending`,ra=`$Submitted`;function ia(e,t){if(!e)return[];let n=new Set([B,V,Gi,Ki,qi,Ji,Yi,Xi,Zi,Qi,$i,ea,ta,na,ra].map(e=>e.toLowerCase())),r=[];for(let i of e)i.startsWith(`\\`)||n.has(i.toLowerCase())||r.push({id:i,name:sa(i,t),color:ca(i)});return r.sort((e,t)=>{let n=e.id.toLowerCase().startsWith(`$label`),r=t.id.toLowerCase().startsWith(`$label`);return n&&!r?-1:!n&&r?1:e.id.localeCompare(t.id)})}var aa=new Set([Ji,Yi,ta,na,ra].map(e=>e.toLowerCase()));function oa(e){return e?e.filter(e=>!e.startsWith(`\\`)&&!aa.has(e.toLowerCase())):[]}function sa(e,t){switch(e.toLowerCase()){case`$label1`:return t?.t(`tags.important`)||`Important`;case`$label2`:return t?.t(`tags.work`)||`Work`;case`$label3`:return t?.t(`tags.personal`)||`Personal`;case`$label4`:return t?.t(`tags.todo`)||`To Do`;case`$label5`:return t?.t(`tags.later`)||`Later`;default:return e}}function ca(e){switch(e.toLowerCase()){case`$label1`:return`#ef4444`;case`$label2`:return`#f97316`;case`$label3`:return`#22c55e`;case`$label4`:return`#3b82f6`;case`$label5`:return`#a855f7`;default:return da(e)}}function la(e){let t=ua(e);if(!t)return`#fff`;let[n,r,i]=t.map(e=>{let t=e/255;return t<=.03928?t/12.92:((t+.055)/1.055)**2.4});return(.2126*n+.7152*r+.0722*i+.05)**2>.05*1.05?`#000`:`#fff`}function ua(e){let t=/^#([0-9a-f]{6})$/i.exec(e.trim());if(t){let e=parseInt(t[1],16);return[e>>16&255,e>>8&255,e&255]}let n=/^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i.exec(e.trim());if(!n)return null;let[r,i,a]=[Number(n[1]),Number(n[2])/100,Number(n[3])/100],o=i*Math.min(a,1-a),s=e=>{let t=(e+r/30)%12;return 255*(a-o*Math.max(-1,Math.min(t-3,9-t,1)))};return[s(0),s(8),s(4)]}function da(e){let t=0;for(let n=0;n<e.length;n++)t=e.charCodeAt(n)+((t<<5)-t);return`hsl(${Math.abs(t)%360}, 70%, 45%)`}function fa(e){let t=[];for(let n=0;n<e.length;n+=500)t.push(e.slice(n,n+500));return t}async function pa(e){try{return await e.json()??{}}catch{return{}}}var ma=class extends Error{constructor(e){super(`unable to retrieve message attachment ${e.join(`, `)}`),this.name=`MissingUploadsError`,this.uuids=e}};function ha(e,t){let n=t.missing_attachments;return e.status!==409||!Array.isArray(n)||n.length===0?null:new ma(n.map(String))}var H=new class{isAuthError(e){return e.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),!0):!1}async setFlag(e,t,n,r){if(!t||t.length===0)return{ok:!1,reason:`empty`};let i=0;try{for(let a of fa(t)){let t=await D(`/mailboxes/${k(e)}/messages/flag`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:a,flags:n,action:r})});if(this.isAuthError(t))return{ok:!1,reason:`auth`,applied:i};if(!t.ok){let e=await pa(t),n=e.error===`unsupported_flags`?`unsupported`:`failed`;return S.error(`Failed to set flag`,t.status,e),{ok:!1,reason:n,applied:i,rejected:e.rejected}}i+=a.length}return{ok:!0,applied:i}}catch(e){return S.error(`Failed to set flag`,e),{ok:!1,reason:`failed`,applied:i}}}matchingBody(e,t={}){return JSON.stringify({all:!0,query:e.query||``,except:e.except??[],...t})}countOf(e){return typeof e.count==`number`?e.count:0}async setFlagMatching(e,t,n,r){try{let i=await D(`/mailboxes/${k(e)}/messages/flag`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:this.matchingBody(t,{flags:n,action:r})});if(this.isAuthError(i))return{ok:!1,reason:`auth`};let a=await pa(i);if(!i.ok){let e=a.error===`unsupported_flags`?`unsupported`:`failed`;return S.error(`Failed to set a flag on a folder`,i.status,a),{ok:!1,reason:e,rejected:a.rejected}}return z.sync(),{ok:!0,applied:this.countOf(a)}}catch(e){return S.error(`Failed to set a flag on a folder`,e),{ok:!1,reason:`failed`}}}async moveMatching(e,t,n){return this.fileMatching(`move`,e,t,n)}async copyMatching(e,t,n){return this.fileMatching(`copy`,e,t,n)}async fileMatching(e,t,n,r){try{let i=await D(`/mailboxes/${k(t)}/messages/${e}`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:this.matchingBody(n,{to:r})});if(this.isAuthError(i))return{success:!1,reason:`auth`};let a=await pa(i);return i.ok?(z.sync(),{success:!0,uidMapping:a.uidMapping??{},count:this.countOf(a)}):(S.error(`Failed to ${e} a folder's messages`,i.status,a),{success:!1,reason:`failed`})}catch(t){return S.error(`Failed to ${e} a folder's messages`,t),{success:!1,reason:`failed`}}}async deleteMatchingResult(e,t){try{let n=await D(`/mailboxes/${k(e)}/messages`,{method:`DELETE`,headers:{"Content-Type":`application/json`},body:this.matchingBody(t)});if(this.isAuthError(n))return{ok:!1,reason:`auth`};let r=await pa(n);return n.ok?(z.sync(),{ok:!0,count:this.countOf(r)}):(S.error(`Failed to delete a folder's messages`,n.status,r),{ok:!1,reason:`failed`})}catch(e){return S.error(`Failed to delete a folder's messages`,e),{ok:!1,reason:`failed`}}}async markAsRead(e,t){let n=t?.UID;if(!n||t.Flags?.includes(`\\Seen`))return t;let{ok:r}=await this.setFlag(e,[String(n)],[B],`add`);if(r){let e={...t};return e.Flags=[...e.Flags||[],B],e}return t}async deleteMessagesResult(e,t){if(!t||t.length===0)return{ok:!1,reason:`empty`};let n=0;try{for(let r of fa(t)){let t=await D(`/mailboxes/${k(e)}/messages`,{method:`DELETE`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:r})});if(this.isAuthError(t))return{ok:!1,reason:`auth`};if(!t.ok)return S.error(`Failed to delete messages`,t.status,await pa(t)),n>0&&z.sync({refresh:!0}),{ok:!1,reason:`failed`};n+=r.length}return z.sync(),{ok:!0}}catch(e){return S.error(`Failed to delete messages`,e),n>0&&z.sync({refresh:!0}),{ok:!1,reason:`failed`}}}async deleteMessages(e,t){return(await this.deleteMessagesResult(e,t)).ok}async moveMessages(e,t,n){if(!t||t.length===0)return{success:!1,reason:`empty`};let r=0,i={};try{for(let a of fa(t)){let t=await D(`/mailboxes/${k(e)}/messages/move`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:a,to:n})});if(this.isAuthError(t))return{success:!1,reason:`auth`};if(!t.ok)return S.error(`Failed to move messages`,t.status,await pa(t)),r>0&&z.sync({refresh:!0}),{success:!1,reason:`failed`};let o=await pa(t);Object.assign(i,o.uidMapping??{}),r+=a.length}return z.sync(),{success:!0,uidMapping:i}}catch(e){return S.error(`Failed to move messages`,e),r>0&&z.sync({refresh:!0}),{success:!1,reason:`failed`}}}async copyMessages(e,t,n){if(!t||t.length===0)return{success:!1,reason:`empty`};let r=0;try{for(let i of fa(t)){let t=await D(`/mailboxes/${k(e)}/messages/copy`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:i,to:n})});if(this.isAuthError(t))return{success:!1,reason:`auth`};if(!t.ok)return S.error(`Failed to copy messages`,t.status,await pa(t)),r>0&&z.sync({refresh:!0}),{success:!1,reason:`failed`};r+=i.length}return z.sync(),{success:!0}}catch(e){return S.error(`Failed to copy messages`,e),r>0&&z.sync({refresh:!0}),{success:!1,reason:`failed`}}}async markMessagesAsRead(e,t){if(!t||t.length===0)return!1;let{ok:n}=await this.setFlag(e,t,[B],`add`);return n}async markMessagesAsUnread(e,t){if(!t||t.length===0)return!1;let{ok:n}=await this.setFlag(e,t,[B],`remove`);return n}async saveDraft(e){try{let t=await D(`/messages`,{method:`POST`,body:e});if(t.status===401)return window.dispatchEvent(new CustomEvent(`auth-error`)),null;if(t.ok){let e=await t.json();return{uid:e.draft_uid,mailbox:e.draft_mailbox,size:e.draft_size,attachments:e.attachments}}let n=await pa(t),r=ha(t,n);if(r)throw r;return S.error(`Failed to save draft:`,t.status,n),null}catch(e){if(e instanceof ma)throw e;return S.error(`Failed to save draft:`,e),null}}async sendDraft(e){try{let t=await D(`/messages`,{method:`POST`,body:e});if(t.status===401)return window.dispatchEvent(new CustomEvent(`auth-error`)),!1;if(t.ok)return z.sync(),!0;let n=await pa(t);throw ha(t,n)||Error(n.error||`Failed to send message (${t.status})`)}catch(e){throw S.error(`Failed to send message:`,e),e}}},ga=`Attachments exceed the maximum allowed size.`,_a=new Map;function va(){return globalThis.crypto?.randomUUID?.()??`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}function ya(e){let t=_a.get(e);t&&(t.abort(),_a.delete(e))}function ba(e){for(let t of e)t.uploading&&t._tempId&&ya(t._tempId)}async function xa(e){try{await fetch(`/attachments/${e}`,{method:`DELETE`})}catch(e){S.error(`Failed to delete attachment from server:`,e)}}function Sa(e,t,n,r,i,a,o,s){let c=document.createElement(`input`);c.type=`file`,c.multiple=!0,c.onchange=c=>{let l=Array.from(c.target.files||[]);l.length!==0&&Ca(l,e,t,n,r,i,a,o,s)},c.click()}function Ca(e,t,n,r,i,a,o,s,c){let l=0;for(let t of e)l+=t.size;if(n>0&&r+l>n){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:c||ga,duration:5e3}}));return}for(let n of e){let e=va();i(e,n);let r=new FormData;r.append(`attachments`,n);let c=new XMLHttpRequest;_a.set(e,c),c.open(`POST`,`/attachments?composer_id=${encodeURIComponent(t)}`,!0),c.upload.onprogress=t=>{t.lengthComputable&&a(e,Math.round(t.loaded/t.total*100))},c.onload=()=>{if(_a.delete(e),c.status>=200&&c.status<300)try{let t=JSON.parse(c.responseText),n=Array.isArray(t)?t:t.uuids||[];n.length>0?o(e,n):s(e,Error(`No UUID returned from server`))}catch(t){s(e,t)}else try{let t=JSON.parse(c.responseText);s(e,Error(t.error||`Unknown error`))}catch{s(e,Error(`Upload failed with status `+c.status))}},c.onerror=()=>{_a.delete(e),s(e,Error(`Network error during upload`))},c.onabort=()=>{_a.delete(e)},c.send(r)}}function wa(e){let t=e-2*Math.floor(e/78);return t%4!=0&&(t=Math.max(0,e-2*Math.ceil(e/78))),Math.floor(t*3/4)}function Ta(e){let t=[],n=(e,r)=>{if(e){if(e.ID){let n=Number(e.Size)||0;t.push({name:e.Extended?.Disposition?.Params?.filename||e.Params?.name||`image`,size:String(e.Encoding).toLowerCase()===`base64`?wa(n):n,type:e.Type&&e.Subtype?`${e.Type}/${e.Subtype}`.toLowerCase():`application/octet-stream`,partPath:r||`1`,inline:!0})}Array.isArray(e.Children)&&e.Children.forEach((e,t)=>n(e,r?`${r}.${t+1}`:`${t+1}`))}};return n(e,``),t}function Ea(e,t){let n={},r=e?.Envelope?.MessageID||e?.Envelope?.MessageId;return r&&(n.inReplyTo=r,n.references=Array.isArray(e.References)?[...e.References]:[]),e?.UID!==void 0&&e?.UID!==null&&t&&(n.replyMailbox=t,n.replyUid=String(e.UID)),n}function Da(e,t){t.inReplyTo&&e.append(`in_reply_to`,t.inReplyTo),t.references?.length&&e.append(`references`,t.references.join(` `)),t.replyMailbox&&t.replyUid&&(e.append(`reply_mailbox`,t.replyMailbox),e.append(`reply_uid`,t.replyUid)),t.quoteSource?.mailbox&&t.quoteSource.uid&&(e.append(`source_mailbox`,t.quoteSource.mailbox),e.append(`source_uid`,t.quoteSource.uid))}var Oa=t(v(),1),ka=new Set([`:`,`;`,`,`,`(`,`)`,`[`,`]`,`{`,`}`]),Aa=e=>e===`
`||e===`\r`||e===`\f`,ja=e=>e===` `||e===`	`||Aa(e),Ma=e=>e>=`0`&&e<=`9`,Na=e=>Ma(e)||e>=`a`&&e<=`f`||e>=`A`&&e<=`F`,Pa=e=>e>=`a`&&e<=`z`||e>=`A`&&e<=`Z`||e===`_`||e===`\0`||e.charCodeAt(0)>=128,Fa=e=>Pa(e)||Ma(e)||e===`-`,Ia=e=>{let t=e.charCodeAt(0);return t>=1&&t<=8||t===11||t>=14&&t<=31||t===127},La=e=>e===`\0`?`�`:e,Ra=e=>e.replace(/[A-Z]/g,e=>e.toLowerCase()),za=e=>Ra(e).replace(/^-[a-z]+-(?=.)/,``);function Ba(e){let t=[],n=0,r=t=>e[t]??``,i=e=>r(e)===`\\`&&!Aa(r(e+1)),a=e=>r(e)===`-`?Pa(r(e+1))||r(e+1)===`-`||i(e+1):Pa(r(e))||i(e),o=e=>{let t=r(e);return(t===`+`||t===`-`)&&(t=r(++e)),Ma(t)||t===`.`&&Ma(r(e+1))},s=()=>{n++;let t=r(n);if(t===``)return`�`;if(!Na(t))return n++,La(t);let i=``;for(;i.length<6&&Na(r(n));)i+=e[n++];r(n)===`\r`&&r(n+1)===`
`?n+=2:ja(r(n))&&n++;let a=parseInt(i,16);return a===0||a>=55296&&a<=57343||a>1114111?`�`:String.fromCodePoint(a)},c=()=>{let t=``;for(;;)if(Fa(r(n)))t+=La(e[n++]);else if(i(n))t+=s();else return t},l=e=>{let t=``;for(n++;;){let i=r(n);if(i===``)return[`string`,t];if(i===e)return n++,[`string`,t];if(Aa(i))return[`bad-string`,t];if(i!==`\\`){t+=La(i),n++;continue}let a=r(n+1);a===``?n++:Aa(a)?n+=a===`\r`&&r(n+2)===`
`?3:2:t+=s()}},u=()=>{for(;;){let e=r(n);if(e===``)break;if(e===`)`){n++;break}i(n)?s():n++}return[`bad-url`,``]},d=()=>{let e=``;for(;ja(r(n));)n++;for(;;){let t=r(n);if(t===``)return[`url`,e];if(t===`)`)return n++,[`url`,e];if(ja(t)){for(;ja(r(n));)n++;return r(n)===``?[`url`,e]:r(n)===`)`?(n++,[`url`,e]):u()}if(t===`"`||t===`'`||t===`(`||Ia(t))return u();if(t===`\\`){if(!i(n))return u();e+=s();continue}e+=La(t),n++}},f=()=>{let e=c();if(r(n)!==`(`)return[`ident`,e];if(n++,Ra(e)!==`url`)return[`function`,e];for(;ja(r(n))&&ja(r(n+1));)n++;let t=ja(r(n))?r(n+1):r(n);return t===`"`||t===`'`?[`function`,e]:d()},p=()=>{let t=n;for((r(n)===`+`||r(n)===`-`)&&n++;Ma(r(n));)n++;if(r(n)===`.`&&Ma(r(n+1)))for(n++;Ma(r(n));)n++;if((r(n)===`e`||r(n)===`E`)&&(Ma(r(n+1))||(r(n+1)===`+`||r(n+1)===`-`)&&Ma(r(n+2))))for(n+=Ma(r(n+1))?1:2;Ma(r(n));)n++;let i=e.slice(t,n);return a(n)?i+c():r(n)===`%`?(n++,`${i}%`):i};for(;n<e.length;){if(r(n)===`/`&&r(n+1)===`*`){let t=e.indexOf(`*/`,n+2);n=t===-1?e.length:t+2;continue}let s=n,u=e[n],d,m=u;if(ja(u)){for(;ja(r(n));)n++;d=`whitespace`,m=` `}else u===`"`||u===`'`?[d,m]=l(u):u===`#`&&(Fa(r(n+1))||i(n+1))?(n++,d=`hash`,m=c()):o(n)?(d=`number`,m=p()):e.startsWith(`<!--`,n)?(n+=4,d=`cdo`,m=`<!--`):e.startsWith(`-->`,n)?(n+=3,d=`cdc`,m=`-->`):a(n)?[d,m]=f():u===`@`&&a(n+1)?(n++,d=`at-keyword`,m=c()):(n++,d=ka.has(u)?u:`delim`);t.push({type:d,value:m,start:s,end:n})}return t}function Va(e){return e.type===`function`||e.type===`(`?`)`:e.type===`[`?`]`:e.type===`{`?`}`:null}function Ha(e){let t=[],n=[],r=0;for(let i of Ba(e)){let e=Va(i);e?n.push(e):i.type===n[n.length-1]?n.pop():i.type===`;`&&n.length===0&&(t.push([r,i.start]),r=i.end)}return t.push([r,e.length]),t}var Ua=e=>e.replace(/^[ \t\n\r\f]+|[ \t\n\r\f]+$/g,``);function Wa(e,t){let n=[],r=!1;for(let[i,a]of Ha(e)){let o=e.slice(i,a);t(o)?r=!0:Ua(o)&&n.push(o)}return r?Ua(n.join(`;`)):e}var Ga=new Set([`image`,`image-set`]);function Ka(e){let t=Ba(e).filter(e=>e.type!==`whitespace`),n=[];for(let e=0;e<t.length;e++){let r=t[e],i=t[e+1];if(r.type===`url`)n.push(r.value);else if(r.type===`function`){let a=za(r.value);if((a===`url`||a===`src`)&&i?.type===`string`)n.push(i.value);else if(Ga.has(a)){let r=[`)`];for(let i=e+1;i<t.length&&r.length>0;i++){let e=t[i],a=Va(e);a?r.push(a):e.type===r[r.length-1]?r.pop():e.type===`string`&&r.length===1&&n.push(e.value)}}}else if(r.type===`at-keyword`){let a=Ra(r.value);if(a===`import`&&i?.type===`string`)n.push(i.value);else if(a===`namespace`)for(;e+1<t.length&&t[e+1].type!==`;`;)e++}}return n}var qa=/(?:url|src|image|image-set|cross-fade|element|expression)\s*\(|@import|(?:^|[^\w-])(?:-ms-)?behavior\s*:/i;function Ja(e,t){let n=e[t];if(n.type===`url`)return n.value.startsWith(`#`)?t:-1;if(n.type!==`function`||Ra(n.value)!==`url`)return-1;let r=t+1;for(;e[r]?.type===`whitespace`;)r++;if(e[r]?.type!==`string`||!e[r].value.startsWith(`#`))return-1;for(r++;e[r]?.type===`whitespace`;)r++;return e[r]?.type===`)`?r:-1}function Ya(e){let t=Ba(e),n=``;for(let e=0;e<t.length;e++){let r=Ja(t,e);if(r!==-1){n+=` `,e=r;continue}let i=t[e];switch(i.type){case`function`:n+=`${i.value}(`;break;case`at-keyword`:n+=`@${i.value}`;break;case`hash`:n+=`#${i.value}`;break;case`url`:case`bad-url`:n+=`url()`;break;case`string`:case`bad-string`:n+=`""`;break;default:n+=i.value}}return qa.test(n)}var Xa=`data-alps-auto-direction`,Za=`
  :where(:is(body, div, blockquote, li, ul, ol)[data-alps-auto-direction="rtl"]) { direction: rtl; }
  :where(:is(body, div, blockquote, li, ul, ol)[data-alps-auto-direction="ltr"]) { direction: ltr; }
`;function Qa(e){let t=e?.trim().toLowerCase();return t===`ltr`||t===`rtl`||t===`auto`?t:null}function $a(e){let t=e.getAttribute(Xa);return t===`ltr`||t===`rtl`?t:null}function eo(e){let t=$a(e);return t!==null&&e.style?.direction.trim().toLowerCase()===t&&e.style?.getPropertyPriority(`direction`)===``}function to(e){let t=e.getAttribute(`style`);if(!t||!eo(e))return t;let n=e.ownerDocument.createElement(`span`);return n.style.cssText=t,n.style.removeProperty(`direction`),n.getAttribute(`style`)?.trim()||null}function no(e){if(!e)return null;let t=e.style?.direction;return t&&!eo(e)?Qa(t):Qa(e.getAttribute(`dir`))}function ro(e){let t=new Map,n=new Map,r=document.createElement(`span`);r.dir=`auto`;let i=!0;try{r.matches(`:dir(rtl)`)}catch{i=!1,r.hidden=!0}let a=()=>i?r.matches(`:dir(rtl)`)?`rtl`:`ltr`:getComputedStyle(r).direction===`rtl`?`rtl`:`ltr`,o=e=>{if(n.has(e))return n.get(e);i||document.documentElement.appendChild(r);try{r.textContent=e+`‎`;let t=a();r.textContent=e+`‏`;let i=t===a()?t:null;return n.set(e,i),i}finally{r.remove()}},s=n=>{if(t.has(n))return t.get(n);let r=e(n),i=r.direction===`ltr`||r.direction===`rtl`?r.direction:r.text===void 0?null:o(r.text);if(i===null){for(let e of r.children??[])if(i=s(e),i!==null)break}return t.set(n,i),i};return s}var io=new Set([`BODY`,`DIV`,`BLOCKQUOTE`,`LI`,`UL`,`OL`]),ao=new Set([`SCRIPT`,`STYLE`,`TEMPLATE`,`NOSCRIPT`,`BDI`,`BDO`]),oo=new Set([`A`,`ABBR`,`B`,`CITE`,`CODE`,`DATA`,`DEL`,`DFN`,`EM`,`FONT`,`I`,`INS`,`KBD`,`MARK`,`Q`,`S`,`SAMP`,`SMALL`,`SPAN`,`STRONG`,`SUB`,`SUP`,`TIME`,`U`,`VAR`]);function so(){return ro(e=>{if(e.nodeType===3)return{text:e.nodeValue??``};if(e.nodeType!==1)return{children:e.childNodes};let t=e;return ao.has(t.tagName)||t.hidden||t.classList.contains(`gmail_attr`)?{}:oo.has(t.tagName)?Qa(t.getAttribute(`dir`))===null?{children:t.childNodes}:{}:{direction:no(t),children:t.childNodes}})}function co(e,t=!1){let n=[...e.nodeType===1?[e]:[],...e.querySelectorAll(`*`)];for(let e of n)eo(e)&&e.style.removeProperty(`direction`),e.removeAttribute(Xa);let r=so();for(let e of n){if(!io.has(e.tagName)||no(e)!==`auto`||e.style?.direction)continue;let n=r(e);n&&(e.setAttribute(Xa,n),t&&(e.style.direction=n))}}var lo=`data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`;function uo(e){return e.replace(/^[\x00-\x20]+|[\x00-\x20]+$/g,``).replace(/[\t\n\r]/g,``)}function fo(e){let t=uo(e).toLowerCase();return t.startsWith(`http:`)||t.startsWith(`https:`)||/^[\\/]{2}/.test(t)}function po(e){return e.toLowerCase().replace(/[^\x21-\x7e]/g,``)}function mo(e){return po(e).startsWith(`cid:`)}function ho(e){return e.replace(/[^\x21-\x7e]/g,``).substring(4)}var go=()=>/url\(\s*(['"]?)((?:https?:)?\/\/[^'"\)]+)\1\s*\)/gi,_o=()=>/@import\s+(?:url\(\s*)?(['"]?)((?:https?:)?\/\/[^'"\)]+)\1\s*\)?\s*;?/gi;function vo(e){return Ka(e).some(e=>fo(po(e)))}function yo(e){let t;try{t=new URL(e,document.baseURI).href}catch{t=uo(e)}return`/proxy?url=${encodeURIComponent(t)}`}var bo=new Set([`animate`,`animatecolor`,`animatemotion`,`animatetransform`,`discard`,`set`]);function xo(e){for(let t of Array.from(e.querySelectorAll(`*`)))bo.has(t.localName.toLowerCase())&&t.remove()}var So=new Set([`fill`,`stroke`,`filter`,`mask`,`clip-path`,`marker-start`,`marker-mid`,`marker-end`,`cursor`]);function Co(e,t,n){let r=n(e.replace(go(),(e,n,r)=>{if(!t.allowRemoteResources)return`url(${lo})`;let i=n||`"`;return`url(${i}${yo(r)}${i})`}));return r===e?null:(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),r)}function wo(e,t){return fo(e)?(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?yo(e):lo):null}function To(e){let t=[],n=e=>e===` `||e===`	`||e===`
`||e===`\r`||e===`\f`,r=0;for(;r<e.length;){for(;r<e.length&&(n(e[r])||e[r]===`,`);)r++;if(r>=e.length)break;let i=r;for(;r<e.length&&!n(e[r]);)r++;let a=e.slice(i,r),o=``;if(a.endsWith(`,`))a=a.replace(/,+$/,``);else{let t=r,n=!1;for(;r<e.length;){let t=e[r];if(t===`(`)n=!0;else if(t===`)`)n=!1;else if(t===`,`&&!n)break;r++}let i=e.slice(t,r).trim();i&&(o=` ${i}`),r++}a&&t.push({url:a,descriptor:o})}return t}function Eo(e,t){let n=To(e);if(n.length===0)return null;let r=!1,i=n.map(({url:e,descriptor:n})=>fo(e)?(r=!0,t.allowRemoteResources?`${yo(e)}${n}`:lo):`${e}${n}`);return r?(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?i.join(`, `):lo):null}function Do(e,t,n=``){if(!e)return null;let r=t.replace(/^<|>$/g,``);if(e.ID&&e.ID.replace(/^<|>$/g,``)===r)return n||`1`;if(e.Children&&Array.isArray(e.Children))for(let r=0;r<e.Children.length;r++){let i=n?`${n}.${r+1}`:`${r+1}`,a=Do(e.Children[r],t,i);if(a)return a}return null}function Oo(e,t){if(!e.includes(`\\`)&&!/prefers-color-scheme/i.test(e))return e;let n=Ba(e).filter(e=>e.type!==`whitespace`),r=``,i=0;for(let a=0;a+3<n.length;a++){if(n[a].type!==`(`)continue;let[o,s,c]=[n[a+1],n[a+2],n[a+3]],l=n[a+4],u=Ra(c.value);o.type!==`ident`||Ra(o.value)!==`prefers-color-scheme`||s.type!==`:`||c.type!==`ident`||u!==`light`&&u!==`dark`||l&&l.type!==`)`||(r+=e.slice(i,n[a].start)+(u===t?`(width >= 0)`:`(width < 0)`),i=l?l.end:c.end,a+=4)}return r+e.slice(i)}function ko(e){let t=Ba(e).find(e=>e.type!==`whitespace`);return t?.type===`ident`&&Ra(t.value)===`color-scheme`}function Ao(e){let t=Ba(e),n=``,r=0;for(let i=0;i<t.length;i++){if(t[i].type!==`ident`||Ra(t[i].value)!==`color-scheme`)continue;let a=i+1;for(;t[a]?.type===`whitespace`;)a++;if(t[a]?.type!==`:`)continue;let o=0;for(a++;a<t.length;a++){let e=t[a].type;if(e===`(`||e===`[`||e===`{`||e===`function`)o++;else if(o>0&&(e===`)`||e===`]`||e===`}`))o--;else if(o===0&&(e===`;`||e===`}`))break}n+=e.slice(r,t[i].start),r=t[a]?.type===`;`?t[a].end:t[a]?.start??e.length,i=a-1}return n+e.slice(r)}var jo={light:`data-alps-css-light`,dark:`data-alps-css-dark`},Mo={light:`data-alps-media-light`,dark:`data-alps-media-dark`},No=[...Object.values(jo),...Object.values(Mo)];function Po(e,t){e.documentElement.style.setProperty(`color-scheme`,t,`important`),e.querySelectorAll(`style[${jo[t]}]`).forEach(e=>{let n=e.getAttribute(jo[t])??``;e.textContent!==n&&(e.textContent=n)}),e.querySelectorAll(`[${Mo[t]}]`).forEach(e=>{let n=e.getAttribute(Mo[t]);n?e.setAttribute(`media`,n):e.removeAttribute(`media`)})}function Fo(e,t){if(!e)return e;let n=e=>vo(e)?(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),``):e;try{let r=Oa.parse(e,{silent:!0});if(r&&r.stylesheet&&r.stylesheet.rules){let e=go(),i=n=>n.replace(e,(e,n,r)=>{if(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources){let e=n||`"`;return`url(${e}${yo(r)}${e})`}else return`url(${lo})`}),a=n=>{for(let r=n.length-1;r>=0;r--){let o=n[r];if([`rule`,`font-face`,`page`,`keyframe`].includes(o.type)&&!o.declarations&&(o.declarations=[]),[`rule`,`page`].includes(o.type)&&!o.selectors&&(o.selectors=[]),o.type===`keyframe`&&!o.values&&(o.values=[]),o.type===`import`){vo(`@import ${o.import??``};`)&&t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),n.splice(r,1);continue}else if(o.type===`font-face`){let e=o;if(e.declarations){let i=!1;for(let n of e.declarations)n.type===`declaration`&&vo(n.value??``)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),i=!0);if(i&&!t.allowRemoteResources){n.splice(r,1);continue}}}if(o.declarations)for(let n=o.declarations.length-1;n>=0;n--){let r=o.declarations[n];if(!(r.type!==`declaration`||!r.value)){if(ko(r.property??``)){o.declarations.splice(n,1);continue}r.value.match(e)&&(r.value=i(r.value)),vo(r.value)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),o.declarations.splice(n,1))}}o.rules&&a(o.rules),o.keyframes&&a(o.keyframes)}};return a(r.stylesheet.rules),n(Oa.stringify(r))}}catch(e){console.warn(`AST CSS parsing failed, falling back to regex sanitizer`,e)}let r=Ao(e),i=_o(),a=go();return(r.match(i)||r.match(a))&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),r=r.replace(i,``),t.allowRemoteResources?r=r.replace(a,(e,t,n)=>`url(${t}${yo(n)}${t})`):(r=r.replace(/@font-face\s*\{[^{}]*\}/gi,e=>/url\(\s*['"]?(?:https?:)?\/\//i.test(e)?``:e),r=r.replace(a,`url(${lo})`))),n(r)}function Io(e){let t=t=>{try{return e.documentElement.matches(t)||e.body.matches(t)}catch{return!1}},n=e=>e.some(e=>e.type===`rule`&&e.selectors?.some(t)&&e.declarations?.some(e=>e.property?.toLowerCase()===`direction`)||Array.isArray(e.rules)&&n(e.rules));return[...e.querySelectorAll(`style`)].some(e=>{if(!/\bdirection\s*:/i.test(e.textContent??``))return!1;try{return n(Oa.parse(e.textContent??``,{silent:!0}).stylesheet?.rules??[])}catch{return!1}})}function Lo(e,t){let n=new DOMParser().parseFromString(e,`text/html`);n.documentElement.hasAttribute(`dir`)||n.body.hasAttribute(`dir`)||n.documentElement.style.direction||n.body.style.direction||Io(n)||(n.body.dir=`auto`),n.querySelectorAll(`iframe, object, embed, frame, frameset, applet, meta[http-equiv]`).forEach(e=>e.remove()),xo(n),n.querySelectorAll(`link`).forEach(e=>{(e.getAttribute(`rel`)||``).toLowerCase()!==`stylesheet`&&e.remove()});let r=n.createElement(`base`);r.target=`_blank`,n.head.prepend(r);let i=`/mailboxes/${k(t.mailbox)}/messages/${t.messageUid}/raw`,a=n.createElement(`meta`);a.httpEquiv=`Content-Security-Policy`;let o=[...t.messageUid?[new URL(i,window.location.origin).href]:[],...t.allowRemoteResources?[`${window.location.origin}/proxy`]:[],`data:`,`blob:`,`cid:`].join(` `);a.content=`default-src 'none'; img-src ${o}; media-src ${o}; style-src 'unsafe-inline'; font-src ${o}; script-src 'none'; object-src 'none'; frame-src 'none'; child-src 'none'; form-action 'none'; base-uri 'none';`,n.head.prepend(a);let s=n.createElement(`style`);s.textContent=`
    body { margin: 0; padding: 24px; box-sizing: border-box; font: 14px -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; overflow-x: auto; word-wrap: break-word; background-color: #ffffff; color: #000000; }
    @media (max-width: 768px) { body { padding: 16px !important; } }
    html:not(.x), body:not(.x) { height: auto !important; }
    p:first-child { margin-top: 0; }
    p:last-child { margin-bottom: 0; }
    a[href] { color: #3781b8; text-decoration: none; }
    a[href]:hover { text-decoration: underline; }
    blockquote[type='cite'] { margin: 0; margin-inline-start: 0.8ex; border-inline-start: 1px #ccc solid; padding-inline-start: 1ex; }
    ${Za}
    img { max-width: 100%; height: auto; }
  `,n.head.prepend(s);let c=e=>{let n=t.messageStructure?Do(t.messageStructure,ho(e)):null;return n?`${i}?part=${n}`:null};n.querySelectorAll(`img`).forEach(e=>{let n=e.getAttribute(`src`);if(n)if(mo(n)){let t=c(n);t&&(e.src=t)}else fo(n)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?e.src=yo(n):(e.setAttribute(`data-original-src`,n),e.src=lo,e.style.height=`0`,e.style.width=`0`))});for(let e of Array.from(n.querySelectorAll(`img[srcset], source[srcset], video[poster], source[src]`)))for(let n of[`srcset`,`poster`,`src`]){let r=e.getAttribute(n);if(!r||n===`src`&&e.tagName.toLowerCase()===`img`)continue;let i=n===`srcset`?Eo(r,t):wo(r,t);i!==null&&e.setAttribute(n,i)}n.querySelectorAll(`[background]`).forEach(e=>{let n=e.getAttribute(`background`)??``,r=mo(n)?c(n):wo(n,t);r!==null&&e.setAttribute(`background`,r)}),n.querySelectorAll(`link[rel="stylesheet"]`).forEach(e=>{let n=e.getAttribute(`href`);n&&fo(n)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),e.remove())}),n.querySelectorAll(`a[href]`).forEach(e=>{e.setAttribute(`rel`,`noopener noreferrer`)}),n.querySelectorAll(No.map(e=>`[${e}]`).join(`, `)).forEach(e=>{for(let t of No)e.removeAttribute(t)}),n.querySelectorAll(`[media]`).forEach(e=>{let t=e.getAttribute(`media`)??``,n=Oo(t,`light`);n!==t&&(e.setAttribute(Mo.light,n),e.setAttribute(Mo.dark,Oo(t,`dark`)))}),n.querySelectorAll(`style`).forEach(e=>{let n=e.textContent;if(!n)return;let r=Oo(n,`light`);if(r===n){e.textContent=Fo(n,t);return}let i=Fo(r,t);e.setAttribute(jo.light,i),e.setAttribute(jo.dark,Fo(Oo(n,`dark`),t)),e.textContent=i}),n.querySelectorAll(`[style]`).forEach(e=>{let t=e.getAttribute(`style`)??``,n=Wa(t,ko);n!==t&&(n?e.setAttribute(`style`,n):e.removeAttribute(`style`))}),n.querySelectorAll(`[style]`).forEach(e=>{let n=Co(e.getAttribute(`style`)??``,t,e=>Wa(e,vo));n!==null&&(n?e.setAttribute(`style`,n):e.removeAttribute(`style`))});let l=[...So];return n.querySelectorAll(l.map(e=>`[${e}]`).join(`, `)).forEach(e=>{for(let n of l){let r=e.getAttribute(n);if(!r)continue;let i=Co(r,t,e=>vo(e)?``:e);i!==null&&(i?e.setAttribute(n,i):e.removeAttribute(n))}}),Po(n,`light`),co(n),n.documentElement.outerHTML}function Ro(e){let t=po(e);return t.startsWith(`javascript:`)||t.startsWith(`vbscript:`)||t.startsWith(`data:text/html`)}var zo=new Set([`href`,`src`,`action`,`formaction`,`xlink:href`,`poster`]);function Bo(e){return Wa(e,Ya)}function Vo(e){if(!e)return``;let t=new DOMParser().parseFromString(e,`text/html`);t.querySelectorAll(`script, style, link, iframe, object, embed, frame, frameset, applet, form, meta, base, template`).forEach(e=>e.remove()),xo(t),t.querySelectorAll(`noscript, noembed, noframes`).forEach(e=>e.remove());for(let e of Array.from(t.querySelectorAll(`xmp, plaintext`))){let n=t.createElement(`pre`);n.textContent=e.textContent,e.replaceWith(n)}for(let e of Array.from(t.querySelectorAll(`*`))){for(let t of Array.from(e.attributes)){let n=t.name.toLowerCase();if(n.startsWith(`on`)){e.removeAttribute(t.name);continue}if(n===`srcset`?To(t.value).some(e=>Ro(e.url)):zo.has(n)&&Ro(t.value)){e.removeAttribute(t.name);continue}if(So.has(n)&&Ya(t.value)){e.removeAttribute(t.name);continue}n===`background`&&fo(t.value)&&e.removeAttribute(t.name)}let t=e.getAttribute(`style`),n=t&&Bo(t);n!==t&&(n?e.setAttribute(`style`,n):e.removeAttribute(`style`))}if(!t.body)return``;let n=no(t.body)??no(t.documentElement);if(n){let e=t.createElement(`div`);e.dir=n;let r=t.body.getAttribute(`lang`)??t.documentElement.getAttribute(`lang`);return r&&(e.lang=r),e.innerHTML=t.body.innerHTML,e.outerHTML}return t.body.innerHTML}function Ho(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}var Uo=class extends Error{constructor(e){super(`Drafts could not be saved before signing out`),this.name=`DraftFlushError`,this.keep=e}keepRecoveryCopy(){this.keep?.()}},Wo=e=>`alps_compose_drafts_${e}`,Go=`alps_compose_drafts`,Ko=e=>{let t=e.trim();if(t.endsWith(`>`)){let e=t.lastIndexOf(`<`);e!==-1&&(t=t.substring(e+1,t.length-1))}return t.trim().toLowerCase()},qo=e=>(e||[]).map(en).join(`, `),Jo=e=>JSON.stringify([e.subject,e.to,e.cc,e.bcc,e.text,e.format,e.html,(e.attachments||[]).map(e=>[e._tempId,e.uuid,e.partPath,e.filename])]),Yo=e=>{let t={...e,missing:!0};return delete t.uuid,t},Xo=(e,t,n)=>{let r=e=>e.uuid?`uuid:${e.uuid}`:e.partPath?`part:${e.partPath}`:void 0,i=new Set(t.map(r)),a=new Map;for(let{source:e,...t}of n){let n=e&&r(e);n&&a.set(n,t)}return e.map(e=>{let t=r(e);return t&&i.has(t)&&a.get(t)||e})},Zo=e=>{let t=Ko(e);return t.startsWith(`noreply`)||t.startsWith(`no-reply`)||t.startsWith(`mailer-daemon`)},Qo=e=>e&&e.filter(e=>!Zo(e)),$o=class extends EventTarget{constructor(){super(),this.state={activeComposers:[]},this.saveTimeout=null,this.username=null,this.keepDraftsOnSignOut=!1,this.adoptSession=()=>{let e=He();if(e===this.username)return;let t=this.username===null?this.state.activeComposers:[];this.username=e;let n=e?this.loadDrafts(e):[];this.state.activeComposers=e?[...n,...t]:[],this.notify()},this.handleSessionCleared=e=>{this.saveTimeout!==null&&(window.clearTimeout(this.saveTimeout),this.saveTimeout=null);let t=e?.detail?.reason===`expired`;t&&this.saveDrafts();let n=t||this.keepDraftsOnSignOut;this.keepDraftsOnSignOut=!1;let r=this.username&&!n?Wo(this.username):null;this.username=null;for(let e of this.state.activeComposers)ba(e.attachments||[]);if(this.state.activeComposers=[],this.notify(),r)try{localStorage.removeItem(r)}catch(e){S.error(`Failed to clear compose drafts`,e)}};try{localStorage.removeItem(Go)}catch{}window.addEventListener(`session-cleared`,this.handleSessionCleared),window.addEventListener(`user-logged-in`,this.adoptSession),window.addEventListener(`alps-active-user-changed`,this.adoptSession),this.adoptSession()}loadDrafts(e){try{let t=localStorage.getItem(Wo(e));if(t)return JSON.parse(t).map(e=>{let t=e.isSending;return{...e,attachments:(e.attachments||[]).map(e=>e.uploading&&e._replaces?e._replaces:e).filter(e=>!e.uploading&&(e.uuid||e.partPath||e.missing)).map(e=>e.uuid?Yo(e):e),isSending:!1,isSaving:!1,closing:!1,minimized:t?!1:e.minimized}})}catch(e){S.error(`Failed to parse compose drafts from localStorage`,e)}return[]}saveDrafts(){if(this.username)try{localStorage.setItem(Wo(this.username),JSON.stringify(this.state.activeComposers))}catch(e){S.error(`Failed to save compose drafts to localStorage`,e)}}debouncedSaveDrafts(){this.saveTimeout!==null&&window.clearTimeout(this.saveTimeout),this.saveTimeout=window.setTimeout(()=>{this.saveDrafts(),this.saveTimeout=null},500)}notify(){this.dispatchEvent(new CustomEvent(`change`))}get stateCopy(){return{...this.state}}getComposer(e){return this.state.activeComposers.find(t=>t.id===e)}getState(){return this.state}openComposer(e){if(e?.draftUid){let t=this.state.activeComposers.find(t=>t.draftUid===e.draftUid);if(t){this.bringComposerToFront(t.id),t.minimized&&this.updateComposer(t.id,{minimized:!1});return}}let t=window.innerWidth<=768;if(t&&this.state.activeComposers.length>=1){let e=this.state.activeComposers[0].id;this.bringComposerToFront(e);return}if(!t&&this.state.activeComposers.length>=3)return;let n=`composer_`+Date.now()+`_`+Math.random().toString(36).substr(2,5),r=`html`,i=``,a=We();a.composeFormat===`text`&&(r=`text`),a.signature&&(i=a.signature);let o=e?.text||``,s=e?.html||``;if(i&&!e?.draftUid){let t=`-- \n${i}`,n=`<div class="alps-signature">-- <br>${Ho(i).replace(/\r?\n/g,`<br>`)}</div>`;o=`\n\n${t}\n${o}`,s=s||e?.text?`<br><br>${n}${s}`:`<br><br>${n}`}let c={id:n,minimized:!1,expanded:!1,dirty:!1,subject:``,format:e?.format||r,attachments:[],zIndex:1e3+this.state.activeComposers.length,...e,to:Qo(e?.to)||[],cc:Qo(e?.cc)||[],bcc:Qo(e?.bcc)||[],text:o,html:s,initialText:o,initialHtml:s};this.state={...this.state,activeComposers:[...this.state.activeComposers,c]},this.saveDrafts(),this.notify()}updateComposer(e,t){t.to&&=Qo(t.to),t.cc&&=Qo(t.cc),t.bcc&&=Qo(t.bcc);let n=this.state.activeComposers.map(n=>{if(n.id!==e)return n;let r=!1;`subject`in t&&t.subject!==n.subject&&(r=!0),`to`in t&&JSON.stringify(t.to||[])!==JSON.stringify(n.to||[])&&(r=!0),`cc`in t&&JSON.stringify(t.cc||[])!==JSON.stringify(n.cc||[])&&(r=!0),`bcc`in t&&JSON.stringify(t.bcc||[])!==JSON.stringify(n.bcc||[])&&(r=!0),`attachments`in t&&t.attachments!==n.attachments&&(r=!0);let i=!n.dirty&&!n.draftUid;`text`in t&&(t.text||``)!==(n.text||``)&&!(i&&(t.text||``).trim()===(n.initialText||``).trim())&&(r=!0),`format`in t&&t.format!==n.format&&(r=!0),(t.format??n.format)===`html`&&`html`in t&&(t.html||``)!==(n.html||``)&&(r=!0);let a=`dirty`in t?t.dirty:r?!0:n.dirty;return{...n,...t,dirty:a}});this.state={...this.state,activeComposers:n},this.debouncedSaveDrafts(),this.notify()}closeComposer(e){this.state={...this.state,activeComposers:this.state.activeComposers.filter(t=>t.id!==e)},this.saveDrafts(),this.notify()}clearAllComposers(){this.state.activeComposers.length!==0&&(this.state={...this.state,activeComposers:[]},this.notify())}async saveAllDirtyDrafts(){this.keepDraftsOnSignOut=!1;let e=this.username,t=!1;try{for(let n of this.state.activeComposers.map(e=>e.id)){if(this.username!==e)throw new Uo;let r=this.getComposer(n);if(!r)continue;if(r.isSending||r.isSaving||r.closing||r.attachments?.some(e=>e.uploading||e.missing)){t=!0;continue}if(!r.dirty){this.closeComposer(n);continue}let i=(r.to?.length||0)>0||(r.cc?.length||0)>0||(r.bcc?.length||0)>0,a=r.text?.trim()!==r.initialText?.trim()||(r.subject?.trim().length||0)>0;if(!i&&!a&&!(r.attachments&&r.attachments.length>0)){this.closeComposer(n);continue}let o=Jo(r);this.updateComposer(n,{isSaving:!0});try{let i;try{i=await H.saveDraft(this.draftForm(r))}catch(e){if(!(e instanceof ma))throw e;let t=new Set(e.uuids),r=this.getComposer(n);r&&this.updateComposer(n,{attachments:(r.attachments||[]).map(e=>e.uuid&&t.has(e.uuid)?Yo(e):e)}),i=null}if(this.username!==e)throw new Uo;if(!i){t=!0;continue}let a=this.getComposer(n);if(a&&Jo(a)!==o){this.updateComposer(n,{draftUid:i.uid,draftMailbox:i.mailbox,...i.attachments&&{attachments:Xo(a.attachments||[],r.attachments||[],i.attachments)}}),t=!0;continue}this.closeComposer(n)}finally{this.getComposer(n)&&this.updateComposer(n,{isSaving:!1})}}if(t||this.state.activeComposers.length>0)throw new Uo}catch(t){throw t instanceof Uo||S.error(`Failed to save drafts before signing out`,t),this.saveDrafts(),new Uo(this.username===e&&e!==null?()=>this.retainDraftsForSignOut(e):void 0)}}retainDraftsForSignOut(e){this.username===e&&(this.saveTimeout!==null&&(window.clearTimeout(this.saveTimeout),this.saveTimeout=null),this.saveDrafts(),this.keepDraftsOnSignOut=!0)}draftForm(e){let t=new FormData,n=[...e.bcc||[]],r=``;{let e=We(),t=Ue(e);e.bccMyself&&t&&!n.some(e=>Ko(e)===Ko(t))&&n.push(t),e.replyTo&&(r=e.replyTo)}t.append(`to`,qo(e.to)),t.append(`cc`,qo(e.cc)),t.append(`bcc`,qo(n)),r&&t.append(`reply_to`,r),t.append(`subject`,(e.subject||``).trim()),t.append(`text`,e.text||``),e.html&&e.format===`html`&&t.append(`html`,e.html),t.append(`save_as_draft`,`1`);let i=e.attachments||[],a=i.map(e=>e.uuid).filter(Boolean).join(`,`);a&&t.append(`attachment-uuids`,a);let o=i.map(e=>e.partPath).filter(Boolean).join(`,`);return o&&t.append(`prev_attachments`,o),e.draftMailbox&&t.append(`draft_mailbox`,e.draftMailbox),e.draftUid&&t.append(`draft_uid`,e.draftUid),Da(t,e),t}bringComposerToFront(e){let t=1e3;this.state.activeComposers.forEach(e=>{e.zIndex&&e.zIndex>t&&(t=e.zIndex)}),this.updateComposer(e,{zIndex:t+1})}},es=u(`compose-store`),ts=`alps-login-notice`;function ns(e){try{sessionStorage.setItem(ts,e)}catch{}}function rs(){try{let e=sessionStorage.getItem(ts);return e&&sessionStorage.removeItem(ts),e||null}catch{return null}}var is=!1;function as(){is=!0}function os(){return is}window.addEventListener(`user-logged-in`,()=>{is=!1});var ss=new class extends EventTarget{constructor(){super(),this.accounts=[],this.loading=!1,this.initialized=!1,this.epoch=0,window.addEventListener(`session-cleared`,()=>{this.epoch++,this.accounts=[],this.initialized=!1,this.loading=!1,this.dispatchEvent(new Event(`change`))})}getAccounts(){return this.accounts}isLoading(){return this.loading}isInitialized(){return this.initialized}async fetchAccounts(){let e=this.epoch;this.loading=!0,this.dispatchEvent(new Event(`change`));try{let t=await fetch(`/accounts`);if(t.ok){let n=await t.json();if(e!==this.epoch)return;this.accounts=n.accounts||[],this.initialized=!0}else S.error(`Failed to fetch linked accounts`)}catch(e){S.error(`Error fetching linked accounts:`,e)}finally{e===this.epoch&&(this.loading=!1,this.dispatchEvent(new Event(`change`)))}}async addAccount(e,t,n=``){let r=new URLSearchParams;r.append(`username`,e),r.append(`password`,t),r.append(`display_name`,n);let i=await fetch(`/accounts`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:r.toString()});if(!i.ok){let e=await i.json().catch(()=>({}));throw Error(e.error||`Failed to add linked account`)}await this.fetchAccounts()}async removeAccount(e){let t=await fetch(`/accounts/${encodeURIComponent(e)}`,{method:`DELETE`});if(!t.ok){let e=await t.json().catch(()=>({}));throw Error(e.error||`Failed to remove linked account`)}await this.fetchAccounts()}async switchAccount(e){let t=new URLSearchParams;t.append(`username`,e);let n=await fetch(`/accounts/switch`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:t.toString()});if(!n.ok){let e=await n.json().catch(()=>({}));throw Error(e.error||`Failed to switch account`)}return await n.json()}},cs=u(`alps-linked-accounts`),ls=class extends d{constructor(...e){super(...e),this.name=``,this.email=``,this.src=``,this.size=40,this.imageError=!1,this._handleStoreChange=()=>{this.requestUpdate()}}willUpdate(e){e.has(`src`)&&(this.imageError=!1)}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.settingsStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=_`
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
      <div class="avatar" style="${r({width:`${this.size}px`,height:`${this.size}px`,fontSize:`${s}px`,backgroundColor:rr(a)})}">
        ${this.src&&!this.imageError?n`<img src="${this.src}" alt="${this.name}" @error="${()=>this.imageError=!0}" />`:this.getInitials(o)}
      </div>
    `}};j([h({context:T})],ls.prototype,`settingsStore`,void 0),j([o({type:String})],ls.prototype,`name`,void 0),j([o({type:String})],ls.prototype,`email`,void 0),j([o({type:String})],ls.prototype,`src`,void 0),j([o({type:Number})],ls.prototype,`size`,void 0),j([a()],ls.prototype,`imageError`,void 0),ls=j([p(`alps-avatar`)],ls);var us=class extends d{constructor(...e){super(...e),this.username=``,this.isMobile=!1,this.currentTab=`messages`,this._handleStoreChange=()=>{this.requestUpdate()}}static{this.styles=[Nr,_`
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
  `]}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&(this.i18nStore?.addEventListener(`change`,this._handleStoreChange),this.settingsStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.addEventListener(`change`,this._handleStoreChange),window.addEventListener(`plugins-updated`,this._handleStoreChange),this.linkedAccountsStore&&!this.linkedAccountsStore.isInitialized()&&this.linkedAccountsStore.fetchAccounts())})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.removeEventListener(`change`,this._handleStoreChange),window.removeEventListener(`plugins-updated`,this._handleStoreChange)}_closePopup(){let e=this.shadowRoot?.querySelector(`alps-popup`);e&&e.close()}_handleSettings(){this._closePopup(),this.dispatchEvent(new CustomEvent(`open-settings`,{bubbles:!0,composed:!0}))}_handleSignOut(){this._closePopup(),this.dispatchEvent(new CustomEvent(`sign-out`,{bubbles:!0,composed:!0}))}_handleTabChange(e){this._closePopup(),e===`messages`?window.location.hash.startsWith(`#/mailbox/`)||(window.location.hash=`#/`):wi(window.location.hash,e)||(window.location.hash=`#/`+e),this.dispatchEvent(new CustomEvent(`change-tab`,{detail:{tab:e},bubbles:!0,composed:!0}))}async _handleSwitchAccount(e){this._closePopup();let t=document.createElement(`div`);document.body.appendChild(t),s(n`
      <style>
        @keyframes global-spin { to { transform: rotate(360deg); } }
        .switch-overlay svg { width: 100%; height: 100%; fill: currentColor; }
      </style>
      <div id="switch-account-overlay" class="switch-overlay" style="position: fixed; inset: 0; background-color: var(--bg-primary, #ffffff); z-index: 999999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease-in;">
        <div style="display: inline-flex; width: 32px; height: 32px; animation: global-spin 1s linear infinite; color: var(--accent-color, #2563eb);">
          ${A(`edelweiss`)}
        </div>
      </div>
    `,t);let r=t.querySelector(`#switch-account-overlay`);requestAnimationFrame(()=>{requestAnimationFrame(()=>{r&&(r.style.opacity=`1`)})}),await new Promise(e=>setTimeout(e,300));try{if((await this.linkedAccountsStore.switchAccount(e)).requires_2fa){Ge(!1),ki.clear(),sessionStorage.clear();try{sessionStorage.setItem(`pending_2fa_username`,e),sessionStorage.setItem(`pending_2fa_is_switch`,`1`)}catch{}window.location.hash=`#/login/webauthn`,r&&(r.style.opacity=`0`),setTimeout(()=>t.remove(),300)}else Ge(!1),sessionStorage.clear(),window.location.reload()}catch(e){r&&(r.style.opacity=`0`),setTimeout(()=>t.remove(),300),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore?.t(`linkedAccounts.switchError`),duration:5e3}}))}}render(){let e=this.settingsStore?.getState().name||this.username;return n`
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
            ${A(`envelopeSimple`)} <span class="item-text">${this.i18nStore?.t(`navigation.messages`)}</span>
          </button>
          ${b.getNavTabs().map(e=>n`
            <button class="dropdown-item ${this.currentTab===e.id?`active`:``}" @click="${()=>this._handleTabChange(e.id)}">
              ${A(e.icon||`star`)} <span class="item-text">${this.i18nStore?.t(e.labelKey)}</span>
            </button>
          `)}
          <div class="dropdown-divider"></div>
          <button class="dropdown-item ${this.currentTab===`settings`?`active`:``}" @click="${this._handleSettings}">
            ${A(`gear`)} <span class="item-text">${this.i18nStore?.t(`userMenu.settings`)}</span>
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click="${this._handleSignOut}">
            ${A(`signOut`)} <span class="item-text">${this.i18nStore?.t(`userMenu.signOut`)}</span>
          </button>
        </alps-popup>
      </div>
    `}};j([o({type:String})],us.prototype,`username`,void 0),j([o({type:Boolean})],us.prototype,`isMobile`,void 0),j([o({type:String})],us.prototype,`currentTab`,void 0),j([h({context:w})],us.prototype,`i18nStore`,void 0),j([h({context:T})],us.prototype,`settingsStore`,void 0),j([h({context:cs})],us.prototype,`linkedAccountsStore`,void 0),us=j([p(`user-profile-menu`)],us);var ds=class extends d{constructor(...e){super(...e),this.username=``,this.currentTab=``,this.isMobile=!1,this.scrolled=!1,this.unsavedDraftsFailure=null,this._handleStoreChange=()=>{this.requestUpdate()},this.confirmSignOutWithUnsavedDrafts=async()=>{let e=this.unsavedDraftsFailure;this.unsavedDraftsFailure=null,e&&(e.keepRecoveryCopy(),await this.endSession(`signedOutDraftsKept`))},this.cancelSignOutWithUnsavedDrafts=()=>{this.unsavedDraftsFailure=null}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=_`
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
  `}handleSettings(){window.location.hash=`/settings`}async handleSignOut(){try{await this.composeStore?.saveAllDirtyDrafts()}catch(e){this.unsavedDraftsFailure=e instanceof Uo?e:new Uo;return}await this.endSession(`signedOut`)}async endSession(e){ns(e),as();try{await fetch(`/session`,{method:`DELETE`})}catch(e){S.error(`Sign-out request failed; ending the session locally anyway`,e)}ki.clear(),Ge(),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`}render(){return n`
      ${this.unsavedDraftsFailure?n`
        <ui-confirm
          title=${this.i18nStore?.t(`userMenu.unsavedDraftsTitle`)}
          message=${this.i18nStore?.t(`userMenu.unsavedDraftsMessage`)}
          confirmText=${this.i18nStore?.t(`userMenu.signOutAnyway`)}
          cancelText=${this.i18nStore?.t(`general.cancel`)}
          .isDanger=${!0}
          @confirm=${this.confirmSignOutWithUnsavedDrafts}
          @cancel=${this.cancelSignOutWithUnsavedDrafts}
        ></ui-confirm>
      `:``}
      <div class="header-container">
        <div class="left-section">
          ${this.isMobile?n`
            <alps-icon-btn 
              title=${this.i18nStore?.t(`messageList.menu`)} 
              @click=${()=>this.dispatchEvent(new CustomEvent(`toggle-sidebar`))}
              icon="sidebar"
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
    `}};j([o({type:String})],ds.prototype,`username`,void 0),j([o({type:String})],ds.prototype,`currentTab`,void 0),j([o({type:Boolean,reflect:!0})],ds.prototype,`isMobile`,void 0),j([o({type:Boolean,reflect:!0})],ds.prototype,`scrolled`,void 0),j([h({context:w})],ds.prototype,`i18nStore`,void 0),j([h({context:es})],ds.prototype,`composeStore`,void 0),j([a()],ds.prototype,`unsavedDraftsFailure`,void 0),ds=j([p(`alps-header`)],ds);var fs=class extends d{constructor(...e){super(...e),this.username=``,this.currentTab=`messages`,this.isMobile=!1,this.currentMailbox=``,this.mailboxes=[],this.searchQuery=``,this.scrolled=!1,this._handleStoreChange=()=>{this.requestUpdate()},this._handleHashChange=()=>{let e=window.location.hash;if(e.startsWith(`#/contacts`))this.currentTab=`contacts`;else if(e.startsWith(`#/settings`))this.currentTab=`settings`;else{let t=b.getNavTabs().find(t=>e.startsWith(`#/${t.id}`));t?this.currentTab=t.id:this.currentTab=`messages`}}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)}),window.addEventListener(`hashchange`,this._handleHashChange),window.addEventListener(`plugins-updated`,this._handleStoreChange),this._handleHashChange()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),window.removeEventListener(`hashchange`,this._handleHashChange),window.removeEventListener(`plugins-updated`,this._handleStoreChange)}static{this.styles=_`
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
  `}handleTabClick(e){wi(window.location.hash,e)||(this.currentTab=e,this.dispatchEvent(new CustomEvent(`change-tab`,{detail:{tab:e}})),e===`messages`?window.location.hash.startsWith(`#/mailbox/`)||(window.location.hash=`#/`):window.location.hash=`#/`+e)}render(){return n`
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
              ${A(`edelweiss`)}
            </div>
            <div class="nav-tabs">
              <div 
                class="nav-tab ${this.currentTab===`messages`?`active`:``}"
                @click=${()=>this.handleTabClick(`messages`)}
                title=${this.i18nStore?.t(`navigation.messages`)}
              >
                ${this.i18nStore?.t(`navigation.messages`)}
              </div>
              ${b.getNavTabs().map(e=>n`
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
          .placeholder=${this.currentTab===`contacts`?this.i18nStore?.t(`contacts.title`)||`Contacts`:this.currentTab===`calendar`?this.i18nStore?.t(`calendar.title`)||`Search Calendar`:this.currentTab===`tasks`?this.i18nStore?.t(`tasks.title`):this.currentMailbox?ur(this.currentMailbox,this.i18nStore,this.mailboxes):this.i18nStore?.t(`search.placeholder`)}
          @keydown=${e=>{e.key===`Enter`&&(e.preventDefault(),this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:e.target.value},bubbles:!0,composed:!0})))}}
          @clear=${()=>{this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:``},bubbles:!0,composed:!0}))}}
        ></alps-input>

        <div slot="right-actions">
        </div>
      </alps-header>
    `}};j([o({type:String})],fs.prototype,`username`,void 0),j([o({type:String})],fs.prototype,`currentTab`,void 0),j([o({type:Boolean})],fs.prototype,`isMobile`,void 0),j([o({type:String})],fs.prototype,`currentMailbox`,void 0),j([o({type:Array})],fs.prototype,`mailboxes`,void 0),j([o({type:String})],fs.prototype,`searchQuery`,void 0),j([o({type:Boolean})],fs.prototype,`scrolled`,void 0),j([h({context:w})],fs.prototype,`i18nStore`,void 0),fs=j([p(`app-header`)],fs);var ps=class extends d{constructor(...e){super(...e),this.hidden=!1}static{this.styles=_`
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
  `}render(){return n`<alps-loader></alps-loader>`}};j([o({type:Boolean,reflect:!0})],ps.prototype,`hidden`,void 0),ps=j([p(`alps-initial-loader`)],ps);var ms=class extends d{constructor(...e){super(...e),this.contacts=[],this.uniqueCategories=[],this.selectedCategory=``,this.filterQuery=``,this.sidebarCollapsed=!1,this.sidebarPeeking=!1,this.isMobile=!1,this.activeKebabMenu=null,this.sidebarScrolled=!1}static{this.styles=[Nr,br,_`
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
    /* The menu is shown while the keyboard is in its row, so that Tab
       reaches it from the category's button: a button inside display: none
       is no Tab stop, and so it could never take the focus that shows it.
       Not while a click has put the focus on the button: a click leaves the
       row as it was. */
    .category-item:focus-within:not(:has(.category-control:focus:not(:focus-visible))) .category-actions {
      display: flex;
    }
    .category-item.has-actions:focus-within:not(:has(.category-control:focus:not(:focus-visible))) .category-badge {
      display: none;
    }
    /* The part of the row that is its button: the icon and the name. The
       row's menu and count sit beside it, not in it. */
    .category-control {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      border-radius: 4px;
    }
    /* Drawn as alps-icon-btn draws its icon, without the button. */
    .category-icon {
      display: flex;
      padding: 6px;
      margin-right: 8px;
      color: var(--text-muted);
    }
    .category-icon .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
  `]}selectCategory(e){this.dispatchEvent(new CustomEvent(`select-category`,{detail:{category:e}}))}handleControlKeyDown(e,t){e.key!==`Enter`&&e.key!==` `||(e.preventDefault(),this.selectCategory(t))}handleSidebarScroll(e){let t=e.target.scrollTop>0;this.sidebarScrolled!==t&&(this.sidebarScrolled=t)}render(){return n`
      <div class="sidebar-wrapper ${this.sidebarCollapsed&&!this.isMobile&&!this.sidebarPeeking?`collapsed`:``}">
        <alps-toolbar class="sidebar-header" ?scrolled=${this.sidebarScrolled}>
          <alps-create-button 
            icon="userPlus" 
            ?collapsed=${this.sidebarCollapsed&&!this.isMobile&&!this.sidebarPeeking}
            @click=${()=>this.dispatchEvent(new CustomEvent(`create-contact`))}
          >${this.i18nStore?.t(`contacts.addContact`)}</alps-create-button>
        </alps-toolbar>
        
        <!-- Inert in the strip, as it is dimmed there. -->
        <div class="sidebar-content" ?inert=${this.sidebarCollapsed&&!this.isMobile&&!this.sidebarPeeking} @scroll=${this.handleSidebarScroll}>
          <div class="sidebar-scroll-content">
            ${[Si,Ci,...this.uniqueCategories.filter(e=>e!==Ci)].map((e,t)=>{let r=e===`All Contacts`?this.contacts.length:this.contacts.filter(t=>t.categories&&t.categories.includes(e)).length,i=e===`All Contacts`||e===`Favorites`,a=e===`All Contacts`?this.i18nStore?.t(`contacts.allContacts`):e===`Favorites`?this.i18nStore?.t(`contacts.favorites`):e,o=e===`All Contacts`?!this.selectedCategory&&!this.filterQuery:this.selectedCategory===e,s=r>0||e===`Favorites`,l=`category-count-${t}`;return n`
                <div class="category-item ${o?`active`:``} ${i?``:`has-actions`}"
                  @click=${()=>this.selectCategory(e)}
                  draggable=${i?`false`:`true`}
                  @dragstart=${t=>{i||(t.dataTransfer?.setData(`text/plain`,e),this.dispatchEvent(new CustomEvent(`drag-start`,{detail:{category:e}})))}}
                  @dragend=${()=>{i||this.dispatchEvent(new CustomEvent(`drag-end`))}}
                >
                  <!--
                    The category's button: one Tab stop, named by the category,
                    with its count as the description. Not the whole row, which
                    also holds the category's menu, and a button may not contain
                    other controls. Its icon is decoration.
                  -->
                  <span class="category-control"
                    role="button"
                    tabindex="0"
                    aria-label=${a??e}
                    aria-current=${o?`true`:c}
                    aria-describedby=${s?l:c}
                    @keydown=${t=>this.handleControlKeyDown(t,e)}
                  >
                    <span class="category-icon">${A(e===`All Contacts`?`users`:e===`Favorites`?`starFourFill`:`folderUser`)}</span>
                    <span class="category-name">${a}</span>
                  </span>
                  
                  ${i?``:n`
                    <div class="category-actions ${this.activeKebabMenu===e?`popup-open`:``}" @click=${e=>e.stopPropagation()}>
                      <alps-popup 
                        align="right" 
                        position="bottom"
                        @popup-open=${()=>{this.activeKebabMenu=e}}
                        @popup-close=${()=>{this.activeKebabMenu===e&&(this.activeKebabMenu=null)}}
                      >
                        <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical" title=${this.i18nStore?.t(`general.moreOptions`)}></alps-icon-btn>
                        <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.dispatchEvent(new CustomEvent(`rename-category`,{detail:{category:e}}))}}>
                          ${A(`pen`)} <span class="item-text">${this.i18nStore?.t(`contacts.rename`)}</span>
                        </button>
                        <button class="dropdown-item text-danger" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.dispatchEvent(new CustomEvent(`delete-category`,{detail:{category:e}}))}}>
                          ${A(`trash`)} <span class="item-text">${this.i18nStore?.t(`contacts.delete`)}</span>
                        </button>
                      </alps-popup>
                    </div>
                  `}

                  ${s?n`<div class="category-badge" id=${l}>${r}</div>`:``}
                </div>
              `})}
          </div>
        </div>
      </div>
    `}};j([h({context:w})],ms.prototype,`i18nStore`,void 0),j([o({type:Array})],ms.prototype,`contacts`,void 0),j([o({type:Array})],ms.prototype,`uniqueCategories`,void 0),j([o({type:String})],ms.prototype,`selectedCategory`,void 0),j([o({type:String})],ms.prototype,`filterQuery`,void 0),j([o({type:Boolean})],ms.prototype,`sidebarCollapsed`,void 0),j([o({type:Boolean})],ms.prototype,`sidebarPeeking`,void 0),j([o({type:Boolean})],ms.prototype,`isMobile`,void 0),j([a()],ms.prototype,`activeKebabMenu`,void 0),j([a()],ms.prototype,`sidebarScrolled`,void 0),ms=j([p(`alps-contacts-categories`)],ms);var hs=600*1e3,gs=new class{async classify(e,t){return e.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),`failed`):e.ok?`ok`:e.status===409?`exists`:(S.error(`Failed to ${t}`,e.status),`failed`)}async createMailbox(e){try{let t=new URLSearchParams;t.append(`name`,e);let n=await D(`/mailboxes`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:t.toString()}),r=await this.classify(n,`create mailbox`);return r===`ok`&&z.syncLabels(),r}catch(e){return S.error(`Failed to create mailbox`,e),`failed`}}async renameMailbox(e,t){try{let n=await D(`/mailboxes/${k(e)}/rename`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({new_name:t})}),r=await this.classify(n,`rename mailbox`);return r===`ok`&&(z.mailboxRenamed(e,t),z.syncLabels()),r}catch(e){return S.error(`Failed to rename mailbox`,e),`failed`}}async deleteMailbox(e){try{let t=await D(`/mailboxes/${k(e)}`,{method:`DELETE`}),n=await this.classify(t,`delete mailbox`);return n===`ok`&&(z.mailboxDeleted(e),z.sync()),n===`ok`}catch(e){return S.error(`Failed to delete mailbox`,e),!1}}async emptyMailbox(e){try{let t=await D(`/mailboxes/${k(e)}/empty`,{method:`POST`},hs);if(t.status===401)return{ok:!1,reason:`auth`};if(t.ok){let e;try{let n=await t.json();typeof n?.discarded==`number`&&(e=n.discarded)}catch{}return z.sync(),{ok:!0,discarded:e}}return S.error(`Failed to empty mailbox`,t.status),{ok:!1,reason:t.status===403?`not_discardable`:`failed`}}catch(e){return S.error(`Failed to empty mailbox`,e),e?.name===`AbortError`?(z.sync({refresh:!0}),{ok:!1,reason:`timeout`}):{ok:!1,reason:`failed`}}}async setSubscribed(e,t){let n=t?`subscribe`:`unsubscribe`;try{let t=await D(`/mailboxes/${k(e)}/${n}`,{method:`PUT`});return t.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),{ok:!1,reason:`auth`}):t.ok?(z.syncLabels(),{ok:!0}):(S.error(`Failed to ${n} mailbox`,t.status),{ok:!1,reason:`failed`})}catch(e){return S.error(`Failed to ${n} mailbox`,e),{ok:!1,reason:`failed`}}}};async function _s(e,t){let n=new Map,r=null;for(let i=0;i<t.length;i+=200){let a=t.slice(i,i+200).map(encodeURIComponent).join(`,`),o=await D(`/mailboxes/${k(e)}/verdicts?uids=${a}`,{},void 0,{background:!0});if(!o.ok)throw Error(`verdicts request failed: ${o.status}`);let s=await o.json(),c=typeof s?.Scope==`string`?s.Scope:``;if(r!==null&&c!==r)throw Error(`verdicts were answered under different scopes`);r=c;for(let[e,t]of Object.entries(s?.Verdicts??{})){let r=t??{};n.set(e,{HasBimiPotential:r.HasBimiPotential===!0,HasBimiFailed:r.HasBimiFailed===!0})}}return{verdicts:n,scope:r??``}}var vs=`application/x-alps-messages`;function ys(e){return!!e&&Array.from(e.types??[]).includes(`application/x-alps-messages`)}function bs(e){if(!ys(e))return null;let t;try{t=JSON.parse(e.getData(vs))}catch{return null}let n=t;return!n||!Array.isArray(n.keys)||!n.keys.every(e=>typeof e==`string`)?null:{keys:n.keys,selection:n.selection===!0}}function xs(e){return e.altKey||e.ctrlKey}var Ss=class extends d{constructor(...e){super(...e),this.name=``,this.color=``}static{this.styles=_`
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
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      max-width: 80px;
      line-height: 1;
      clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%);
    }
  `}render(){return n`
      <div class="tag-pill" style="background-color: ${this.color}; color: ${la(this.color)}" title=${this.name}>
        ${this.name}
      </div>
    `}};j([o({type:String})],Ss.prototype,`name`,void 0),j([o({type:String})],Ss.prototype,`color`,void 0),Ss=j([p(`alps-tag`)],Ss);var Cs=class extends d{constructor(...e){super(...e),this.currentPage=0,this.totalItems=0,this.itemsPerPage=50,this.currentCount=0,this.isSearch=!1,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=_`
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
  `}changePage(e){let t=this.currentPage+e;t>=0&&t<Math.ceil(this.totalItems/this.itemsPerPage)&&this.dispatchEvent(new CustomEvent(`change-page`,{detail:{page:t},bubbles:!0,composed:!0}))}get knownTotal(){return this.totalItems>0?this.totalItems:void 0}get hasPrev(){return this.currentPage>0}get hasNext(){let e=this.knownTotal;return e===void 0?!1:(this.currentPage+1)*this.itemsPerPage<e}get rangeText(){let e=this.currentCount>0?this.currentCount:0;if(e===0)return this.i18nStore?.t(`pagination.zeroMessages`)||`0 messages`;if(!this.hasPrev&&!this.hasNext){let t=this.isSearch?e:this.knownTotal??e;return this.isSearch?this.i18nStore?.t(`pagination.searchResults`,{count:t})||`${t} results`:this.i18nStore?.t(`pagination.totalCount`,{total:t})||`${t} total`}let t=this.currentPage*this.itemsPerPage+1,n=t+e-1,r=this.knownTotal;return r===void 0?`${t}\u2013${n}`:(this.i18nStore?.t(`pagination.rangeOfTotal`)||`{start}–{end} of {total}`).replace(`{start}`,String(t)).replace(`{end}`,String(n)).replace(`{total}`,String(r))}render(){let e=this.rangeText;return n`
      <div class="pagination-container">
        <div class="pagination-text" title="${e}">${e}</div>
        <div class="pagination-controls">
          <alps-icon-btn 
            title=${this.i18nStore?.t(`pagination.previousPage`)} 
            ?disabled=${!this.hasPrev} 
            @click=${()=>this.changePage(-1)}
            icon="caretLeft"
          ></alps-icon-btn>
          <alps-icon-btn 
            title=${this.i18nStore?.t(`pagination.nextPage`)} 
            ?disabled=${!this.hasNext} 
            @click=${()=>this.changePage(1)}
            icon="caretRight"
          ></alps-icon-btn>
        </div>
      </div>
    `}};j([o({type:Number})],Cs.prototype,`currentPage`,void 0),j([o({type:Number})],Cs.prototype,`totalItems`,void 0),j([o({type:Number})],Cs.prototype,`itemsPerPage`,void 0),j([o({type:Number})],Cs.prototype,`currentCount`,void 0),j([o({type:Boolean})],Cs.prototype,`isSearch`,void 0),j([h({context:w})],Cs.prototype,`i18nStore`,void 0),Cs=j([p(`alps-pagination`)],Cs);var ws=class extends d{constructor(...e){super(...e),this.variant=`info`}static{this.styles=_`
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
    `}};j([o({type:String,reflect:!0})],ws.prototype,`variant`,void 0),ws=j([p(`alps-banner`)],ws);var Ts=new Set([`is:starred`,`is:unread`]),Es=5e3,Ds=0;typeof window<`u`&&(window.addEventListener(`session-cleared`,()=>{Ds++}),window.addEventListener(`user-logged-in`,()=>{Ds++}));var U=class extends d{constructor(...e){super(...e),this.messages=[],this.currentMailbox=``,this.mailboxes=[],this.currentMailboxRole=``,this.listedMailbox=``,this.listedMailboxRole=``,this.loading=!1,this.selectedMessage=null,this.layoutMode=`vertical`,this.isMobile=!1,this.sidebarCollapsed=!1,this.currentPage=0,this.listedPage=0,this.totalMessages=0,this.messagesPerPage=50,this.filterQuery=``,this.sortOrder=`desc`,this.densityMode=`compact`,this.showSenderAvatars=!0,this.selectedMessages=new Set,this.selectAllMatching=!1,this.matchingCount=0,this.syncing=!1,this.loadFailed=!1,this.isSpinning=!1,this.isScrolled=!1,this.isAtBottom=!1,this.focusedIndex=-1,this.showEmptyConfirm=!1,this.emptying=!1,this.expandedThreads=new Set,this.draggingKeys=null,this.verdicts=new Map,this.verdictScopes=new Map,this.verdictsAsked=new Set,this.verdictsConfirmed=new Set,this.verdictsSignIn=Ds,this.verdictGeneration=0,this.verdictsRunning=!1,this.verdictsRerun=!1,this._shouldScrollToTop=!1,this._uidsBeforeCheck=null,this._arrivedIndex=-1,this._handleStoreChange=()=>{this.requestUpdate()},this.handleSyncStart=()=>{this.syncing=!0,this.isSpinning=!0},this.handleSyncEnd=()=>{this.syncing=!1},this.handleSpinIteration=()=>{this.syncing||(this.isSpinning=!1)},this.handleScroll=e=>{this.checkScrollState(e.target)},this.endDrag=()=>{this.draggingKeys=null,window.removeEventListener(`drop`,this.endDrag,!0),window.removeEventListener(`dragend`,this.endDrag,!0)}}static{this.styles=[nn,_`
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

    /* What a drag is carrying, left in place until the drop files it. */
    .message-item.is-dragging {
      opacity: 0.4;
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
      font-family: var(--font-label);
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      margin-left: 8px;
      text-align: right;
      flex-shrink: 0;
    }

    .message-size {
      font-family: var(--font-label);
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
      color: var(--accent-contrast, #fff);
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
  `]}get visibleMessages(){let e=[];for(let t of this.messages||[])e.push(t),t.SubMessages&&t.SubMessages.length>0&&this.isThreadExpanded(String(t.UID))&&e.push(...t.SubMessages);return e}leaveVerdicts(){this.verdictGeneration++,this.verdictsConfirmed=new Set,this.verdicts.size>Es&&(this.verdicts=new Map,this.verdictScopes=new Map),this.verdictsAsked=new Set([...this.verdictsAsked].filter(e=>this.verdicts.has(e)))}forgetVerdicts(){this.verdictGeneration++,this.verdictsSignIn=Ds,this.verdicts=new Map,this.verdictScopes=new Map,this.verdictsAsked=new Set,this.verdictsConfirmed=new Set}mailboxOf(e){return Mi(e,this.currentMailbox)}keyOf(e){return R(this.mailboxOf(e),e?.UID)}async refreshVerdicts(){if(this.verdictsRunning){this.verdictsRerun=!0;return}this.verdictsRunning=!0;try{await this.askVerdicts()}finally{this.verdictsRunning=!1,this.verdictsRerun&&(this.verdictsRerun=!1,this.refreshVerdicts())}}get drawsAvatars(){return this.showSenderAvatars&&this.densityMode!==`ultra-compact`}async askVerdicts(){let e=this.currentMailbox;if(!e||!this.drawsAvatars)return;let t=this.verdictGeneration,n=Ds,r=()=>e===this.currentMailbox&&t===this.verdictGeneration&&n===Ds,i=new Map,a=new Map,o=t=>{let n=t?.UID==null?``:String(t.UID),r=this.mailboxOf(t);if(!n||e!==`*`&&r!==e)return;let o=R(r,n);if(gr(t)){if(this.verdictsAsked.has(o)){!this.verdictsConfirmed.has(r)&&this.verdicts.has(o)&&!a.has(r)&&a.set(r,n);return}this.verdictsAsked.add(o),i.has(r)||i.set(r,[]),i.get(r).push(n)}};for(let e of this.messages||[])o(e),e?.SubMessages?.length&&this.isThreadExpanded(String(e.UID))&&e.SubMessages.forEach(o);for(let[e,t]of a)i.has(e)||i.set(e,[t]);let s=[];for(let[e,t]of i)for(let n of t)s.push({mailbox:e,uid:n});let c=e=>{for(let t of s.slice(e))this.verdictsAsked.delete(R(t.mailbox,t.uid))},l=0;for(;l<s.length;){if(await jt(),!r())return;if(this.loading){c(l);return}let e=s[l].mailbox,t=l;for(;t<s.length&&t-l<3&&s[t].mailbox===e;)t++;let n=s.slice(l,t).map(e=>e.uid),i;try{i=await _s(e,n)}catch{r()&&c(l);return}if(!r())return;let a=new Map(this.verdicts),o=this.verdictScopes.get(e),u=!1;if(i.scope&&o&&i.scope!==o){let r=R(e,``);for(let e of[...a.keys()])e.startsWith(r)&&a.delete(e);for(let e of[...this.verdictsAsked])e.startsWith(r)&&this.verdictsAsked.delete(e);for(let t of n)this.verdictsAsked.add(R(e,t));c(t),u=!0}i.scope&&this.verdictScopes.set(e,i.scope),this.verdictsConfirmed.add(e);for(let[t,n]of i.verdicts)a.set(R(e,t),n);if(this.verdicts=a,u){this.verdictsRerun=!0;return}l=t}}withVerdict(e){let t=this.mailboxOf(e);if(!this.verdictsConfirmed.has(t))return e;let n=this.verdicts.get(R(t,String(e?.UID)));return n?{...e,...n}:e}isThreadExpanded(e){return this.expandedThreads.has(e)}toggleThreadCollapse(e,t){e.stopPropagation();let n=new Set(this.expandedThreads);n.has(t)?n.delete(t):n.add(t),this.expandedThreads=n}rowKeys(e){let t=this.keyOf(e);return!e.SubMessages?.length||this.isThreadExpanded(String(e.UID))?[t]:[t,...e.SubMessages.map(e=>this.keyOf(e))]}rowMessages(e){return!e.SubMessages?.length||this.isThreadExpanded(String(e.UID))?[e]:[e,...e.SubMessages]}rowSelection(e){let t=this.rowKeys(e),n=t.filter(e=>this.selectedMessages.has(e)).length;return n===0?`none`:n===t.length?`all`:`some`}toggleRow(e){let t=this.rowKeys(e),n=this.rowSelection(e)===`all`,r=new Set(this.selectedMessages);for(let e of t)n?r.delete(e):r.add(e);this.setSelection(r)}get pageKeys(){let e=[];for(let t of this.messages||[]){e.push(this.keyOf(t));for(let n of t.SubMessages||[])e.push(this.keyOf(n))}return e}get allOnPageSelected(){let e=this.pageKeys;return e.length>0&&e.every(e=>this.selectedMessages.has(e))}get canSelectAllMatching(){return this.currentMailbox!==`*`&&this.totalMessages>this.pageKeys.length}handleSelectAll(e){let t=e.target.checked;if(!t&&this.selectAllMatching){this.dispatchEvent(new CustomEvent(`clear-selection`));return}this.setSelection(t?new Set(this.pageKeys):new Set)}setSelection(e){this.selectedMessages=e,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedKeys:e}}))}isOpen(e){return!!this.selectedMessage&&this.keyOf(this.selectedMessage)===this.keyOf(e)}connectedCallback(){super.connectedCallback(),z.addEventListener(`sync-start`,this.handleSyncStart),z.addEventListener(`sync-success`,this.handleSyncEnd),z.addEventListener(`sync-error`,this.handleSyncEnd),z.addEventListener(`sync-unchanged`,this.handleSyncEnd),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.endDrag(),z.removeEventListener(`sync-start`,this.handleSyncStart),z.removeEventListener(`sync-success`,this.handleSyncEnd),z.removeEventListener(`sync-error`,this.handleSyncEnd),z.removeEventListener(`sync-unchanged`,this.handleSyncEnd),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}willUpdate(e){if(super.willUpdate(e),this.verdictsSignIn===Ds?e.has(`currentMailbox`)&&this.leaveVerdicts():this.forgetVerdicts(),(e.has(`currentMailbox`)||e.has(`currentPage`)||e.has(`filterQuery`)||e.has(`sortOrder`))&&(!this.selectAllMatching&&this.selectedMessages.size>0&&this.setSelection(new Set),this.focusedIndex=-1,this._shouldScrollToTop=!0,this._uidsBeforeCheck=null),this._uidsBeforeCheck&&e.has(`syncing`)&&!this.syncing){let t=this._uidsBeforeCheck;if(this._uidsBeforeCheck=null,e.has(`messages`)){let e=(this.messages||[]).findIndex(e=>Number(e.UID)>(t.get(this.mailboxOf(e))??0));e!==-1&&(this._arrivedIndex=this.visibleMessages.indexOf(this.messages[e]))}}if(e.has(`messages`)&&this.draggingKeys){let e=new Set(this.pageKeys);this.draggingKeys.some(t=>e.has(t))||this.endDrag()}if(e.has(`selectedMessage`)||e.has(`messages`)){if(e.has(`messages`)&&this.messages&&!this.selectAllMatching&&this.selectedMessages.size>0){let e=new Set(this.pageKeys),t=new Set([...this.selectedMessages].filter(t=>e.has(t)));t.size!==this.selectedMessages.size&&this.setSelection(t)}if(this.selectedMessage){if(this.messages){let e=!1,t=new Set(this.expandedThreads);for(let n of this.messages)if(n.SubMessages&&n.SubMessages.some(e=>this.isOpen(e))){let r=String(n.UID);t.has(r)||(t.add(r),e=!0)}e&&(this.expandedThreads=t)}let e=this.visibleMessages;if(e.length>0){let t=e.findIndex(e=>this.isOpen(e));t!==-1&&(this.focusedIndex=t)}}}}checkScrollState(e){if(!e)return;let t=e.scrollTop>0;this.isScrolled!==t&&(this.isScrolled=t,this.dispatchEvent(new CustomEvent(`list-scrolled`,{detail:{scrolled:t}})));let n=e.scrollHeight<=e.clientHeight||Math.ceil(e.scrollTop+e.clientHeight)>=e.scrollHeight;this.isAtBottom!==n&&(this.isAtBottom=n)}updated(e){super.updated(e),(e.has(`messages`)||e.has(`expandedThreads`)||e.has(`currentMailbox`)||e.has(`showSenderAvatars`)||e.has(`densityMode`)||e.has(`loading`)&&!this.loading)&&this.refreshVerdicts(),e.has(`densityMode`)&&(this.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),this.classList.add(`density-${this.densityMode}`)),e.has(`syncing`)&&this.syncing&&(this.isSpinning=!0);let t=e.get(`selectedMessage`);if(e.has(`selectedMessage`)&&this.selectedMessage&&!(t&&this.isOpen(t))&&setTimeout(()=>{let e=this.renderRoot.querySelector(`.list-content`)?.querySelector(`.message-item.active`);e&&e.scrollIntoView({behavior:`smooth`,block:`center`})},50),this._shouldScrollToTop&&(e.has(`messages`)||e.has(`loading`)&&!this.loading)){let e=this.renderRoot.querySelector(`.list-content`);e&&(e.scrollTop=0),this._shouldScrollToTop=!1}if(this._arrivedIndex!==-1){let e=this._arrivedIndex;this._arrivedIndex=-1;let t=this.renderRoot.querySelector(`.list-content`);e===0?t&&(t.scrollTop=0):t?.querySelectorAll(`.message-item`)[e]?.scrollIntoView({block:`nearest`})}let n=this.renderRoot.querySelector(`.list-content`);n&&requestAnimationFrame(()=>{this.checkScrollState(n)})}checkForNew(){let e=new Map;for(let t of this.messages||[]){let n=this.mailboxOf(t);e.set(n,Math.max(e.get(n)??0,Number(t.UID)||0))}this._uidsBeforeCheck=e,this.dispatchEvent(new CustomEvent(`refresh`))}selectMessage(e){this.selectedMessages.size>0&&this.setSelection(new Set),this.dispatchEvent(new CustomEvent(`select-message`,{detail:{message:e}}))}moveCursor(e){let t=this.visibleMessages;this.focusedIndex=e>0?Math.min(t.length-1,this.focusedIndex+1):Math.max(0,this.focusedIndex-1),this.scrollToFocused()}step(e){this.visibleMessages.length!==0&&(this.renderRoot.querySelector(`.list-content`)?.focus({preventScroll:!0}),this.moveCursor(e))}handleKeyDown(e){let t=this.visibleMessages;!t||t.length===0||(e.key===`ArrowDown`?(e.preventDefault(),this.moveCursor(1)):e.key===`ArrowUp`?(e.preventDefault(),this.moveCursor(-1)):e.key===`Enter`?(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length&&this.selectMessage(t[this.focusedIndex])):e.key===` `&&(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length&&(this.toggleRow(t[this.focusedIndex]),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused())))}get countsConversations(){return this.messages.some(e=>(e?.ThreadCount??0)>0)}get folderTitle(){return ur(this.currentMailbox,this.i18nStore,this.mailboxes)}get emptyConfirmMessage(){let e=this.folderTitle,t=this.totalMessages,n=this.countsConversations?`messageList.emptyMailboxConfirmConversations`:`messageList.emptyMailboxConfirm`,r=this.i18nStore?.t(n,{folder:e,count:t})||(this.countsConversations?`Are you sure you want to permanently delete all ${t} conversations in ${e}, and every message in them? This action cannot be undone.`:`Are you sure you want to permanently delete all ${t} messages in ${e}? This action cannot be undone.`),i=this.selectedMessages.size;return i===0?r:`${r} ${this.i18nStore?.t(`messageList.emptyMailboxSelectionNote`,{count:i})||`This includes the ${i} messages you have checked.`}`}toast(e,t){this.dispatchEvent(new CustomEvent(`toast`,{detail:{type:e,message:t},bubbles:!0,composed:!0}))}async handleEmptyMailbox(){if(this.emptying)return;this.showEmptyConfirm=!1,this.emptying=!0;let e=this.currentMailbox,t=this.folderTitle;this.toast(`info`,this.i18nStore?.t(`messageList.emptyingMailbox`,{folder:t})||`Emptying ${t}...`);try{let n=await gs.emptyMailbox(e);n.ok&&n.discarded===0?this.toast(`info`,this.i18nStore?.t(`messageList.mailboxAlreadyEmpty`,{folder:t})||`${t} was already empty — nothing was deleted.`):n.ok?this.toast(`success`,this.i18nStore?.t(`messageList.mailboxEmptied`,{folder:t})||`${t} emptied.`):n.reason===`timeout`?this.toast(`error`,this.i18nStore?.t(`messageList.emptyMailboxSlow`,{folder:t})||`Still emptying ${t}. The server is working on it — check the folder again in a moment.`):n.reason!==`auth`&&this.toast(`error`,this.i18nStore?.t(`messageList.emptyMailboxFailed`,{folder:t})||`Failed to empty ${t}.`)}finally{this.emptying=!1}}scrollToFocused(){this.updateComplete.then(()=>{let e=this.renderRoot.querySelector(`.message-item.focused`);e&&e.scrollIntoView({block:`nearest`})})}get isDiscardableFolder(){let e=this.currentMailboxRole;return e!==`trash`&&e!==`junk`?!1:(Kn(e,this.mailboxes)??this.currentMailbox)===this.currentMailbox}get rowsAreCurrent(){return!this.listedMailbox||this.listedMailbox===this.currentMailbox}get rowMailbox(){return this.rowsAreCurrent?this.currentMailbox:this.listedMailbox}get rowRole(){return this.rowsAreCurrent?this.currentMailboxRole:this.listedMailboxRole}renderMessageItem(e,t=!1,r=!1,i=!1){let a=this.rowRole,o=a===`drafts`||a===`sent`,s=this.rowMailbox===`*`,l=[];o?(l=[...e.Envelope?.To||[],...e.Envelope?.Cc||[]],l.length||(l=e.Envelope?.From||[])):l=[...e.Envelope?.From||[],...e.Envelope?.To||[],...e.Envelope?.Cc||[]];let u=new Set,d=[];for(let e of l){let t=(e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``)||e.Name||`unknown`;t!==`unknown`&&!u.has(t)?(u.add(t),d.push(e)):t===`unknown`&&d.push(e)}let f=Ue(this.settingsStore?.getState()).toLowerCase(),p=e=>{let t=e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``;return!!(f&&t===f)};if(d.length>1){let e=d.filter(e=>!p(e));e.length>0&&(d=e)}d.length||(d=[{}]);let m=o?`messageReader.noRecipients`:`messageList.unknownSender`,h=d.map((e,t)=>{let r=e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`:``,i=e.Name?n`<bdi>${e.Name}</bdi>${r&&Xt(r).warning?n` &lt;${tn(r)}&gt;`:``}`:r?tn(r):this.i18nStore?.t(m)||this.i18nStore?.t(`messageList.unknown`);return n`${t?`, `:``}<span title=${r||c}>${i}${on(r,this.i18nStore)}</span>`}),g=this.isMobile?1:3,_=d.slice(0,g),v=d.length-g,y=_.length+ +(v>0),ee=e.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`),te=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,b=String(this.settingsStore?.getState()?.hourFormat||`12`),ne=e.Envelope?.Date?ir(e.Envelope.Date,te,b):``,x=e.RFC822Size||e.Size,re=x?pr(x):``,ie=e.SubMessages&&e.SubMessages.length>0,ae=this.isThreadExpanded(String(e.UID)),oe=this.rowSelection(e),se=e=>!e?.Flags||!e.Flags.includes(`\\Seen`),ce=se(e)||!t&&!!ie&&!ae&&e.SubMessages.some(se),le=this.rowMessages(e).some(e=>e.Flags?.includes(V)),ue=e.Flags&&e.Flags.includes(`\\Answered`),de=e.Flags&&e.Flags.includes(`$Forwarded`),S=ia(e.Flags,this.i18nStore),fe=this.densityMode===`loose`?48:this.densityMode===`compact`?24:40;return this.densityMode===`ultra-compact`?n`
      <div class="message-item ${t?`sub-message-item`:``} ${r?`first-sub-item`:``} ${i?`last-sub-item`:``} ${this.selectedMessages.size===0&&this.isOpen(e)||oe!==`none`?`active`:``} ${ce?`unread`:``} ${le?`starred`:``} ${this.focusedIndex===this.visibleMessages.indexOf(e)?`focused`:``} ${this.isDragged(e)?`is-dragging`:``}"
        draggable=${this.isMobile?`false`:`true`}
        @dragstart=${t=>this.handleDragStart(t,e)}
        @dragend=${this.endDrag}
        @click=${()=>this.selectMessage(e)}>
        <div class="checkbox-col" @click=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
          <input type="checkbox" class="message-checkbox" 
            .checked=${oe===`all`}
            .indeterminate=${oe===`some`}
            @click=${e=>e.stopPropagation()}
            @change=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
        </div>

        <!-- Caret Toggle Button -->
        ${!t&&ie?n`
          <div class="caret-col" @click=${t=>this.toggleThreadCollapse(t,String(e.UID))}>
            ${A(ae?`caretDown`:`caretRight`)}
            <span class="thread-count-caret-badge" title="${e.ThreadCount} messages">${e.ThreadCount}</span>
          </div>
        `:t?n`<div class="caret-col empty"></div>`:``}

        <div class="message-sender">${h}</div>
        <div @click=${t=>this.toggleStar(t,e)} class="star-btn ${le?`starred`:``} star-btn-wrapper-ultra">
          ${A(le?`starFourFill`:`starFour`)}
        </div>
        ${ue||de?n`
          <div class="indicators-wrapper-ultra">
            ${ue?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.replied`)}>${A(`arrowBendUpLeft`)}</div>`:``}
            ${de?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.forwarded`)}>${A(`arrowBendUpRight`)}</div>`:``}
          </div>
        `:``}
        ${S.length>0?n`
          <div class="tag-pills">
            ${S.map(e=>n`
              <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
            `)}
          </div>
        `:``}
        ${s&&e.Mailbox?n`
          <span class="mailbox-badge" title="Folder: ${e.Mailbox}">${e.Mailbox}</span>
        `:``}
        <div class="message-subject" dir="auto">
          ${ee}
        </div>
        <div class="message-indicators">
          <div class="attachment-col">
            ${e.HasAttachments?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.hasAttachments`)}>${A(`paperclipHorizontal`)}</div>`:``}
          </div>
          <div class="message-date">${ne}</div>
        </div>
      </div>
      `:n`
    <div class="message-item ${t?`sub-message-item`:``} ${r?`first-sub-item`:``} ${i?`last-sub-item`:``} ${this.selectedMessages.size===0&&this.isOpen(e)||oe!==`none`?`active`:``} ${ce?`unread`:``} ${le?`starred`:``} ${this.focusedIndex===this.visibleMessages.indexOf(e)?`focused`:``} ${this.isDragged(e)?`is-dragging`:``}"
        draggable=${this.isMobile?`false`:`true`}
        @dragstart=${t=>this.handleDragStart(t,e)}
        @dragend=${this.endDrag}
        @click=${()=>this.selectMessage(e)}>
      <div class="checkbox-col" @click=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
        <input type="checkbox" class="message-checkbox" 
          .checked=${oe===`all`}
          .indeterminate=${oe===`some`}
          @click=${e=>e.stopPropagation()}
          @change=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
      </div>

      <!-- Caret Toggle Button -->
      ${!t&&ie?n`
        <div class="caret-col" @click=${t=>this.toggleThreadCollapse(t,String(e.UID))}>
          ${A(ae?`caretDown`:`caretRight`)}
          <span class="thread-count-caret-badge" title="${e.ThreadCount} messages">${e.ThreadCount}</span>
        </div>
      `:t?n`<div class="caret-col empty"></div>`:``}

      ${this.showSenderAvatars?n`
        <div class="avatar-stack">
          ${_.map((t,r)=>{let i=t.Mailbox&&t.Host?`${t.Mailbox}@${t.Host}`:``,a=t.Name||i||this.i18nStore?.t(m)||this.i18nStore?.t(`messageList.unknown`),o=_r(this.withVerdict(e),t);return n`
              <div class="avatar-wrapper" style="z-index: ${y-r};">
                <alps-avatar .name=${a} .email=${i} .size=${fe} .src=${o}></alps-avatar>
              </div>
            `})}
          ${v>0?n`
            <div class="avatar-wrapper extra-count" style="width: ${fe}px; height: ${fe}px; z-index: 0;">
              +${v}
            </div>
          `:``}
        </div>
      `:``}
      <div class="message-details">
        <div class="message-header-row">
          <div class="message-header-inner">
            <div class="message-sender">${h}</div>
            <div @click=${t=>this.toggleStar(t,e)} class="star-btn ${le?`starred`:``}">
              ${A(le?`starFourFill`:`starFour`)}
            </div>
          </div>
          <div class="message-indicators">
            <div class="attachment-col">
              ${e.HasAttachments?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.hasAttachments`)}>${A(`paperclipHorizontal`)}</div>`:``}
            </div>
            <div class="message-date">${ne}</div>
          </div>
        </div>
        <div class="message-subject-row">
          ${ue||de?n`
            <div class="indicators-wrapper">
              ${ue?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.replied`)}>${A(`arrowBendUpLeft`)}</div>`:``}
              ${de?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.forwarded`)}>${A(`arrowBendUpRight`)}</div>`:``}
            </div>
          `:``}
          ${S.length>0?n`
            <div class="tag-pills">
              ${S.map(e=>n`
                <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
              `)}
            </div>
          `:``}
          ${s&&e.Mailbox?n`
            <span class="mailbox-badge" title="Folder: ${e.Mailbox}">${e.Mailbox}</span>
          `:``}
          <div class="message-subject" dir="auto">
            ${ee}
          </div>
          ${re?n`<div class="message-size">${re}</div>`:``}
        </div>
      </div>
    </div>
    `}handleDragStart(e,t){let n=e.dataTransfer;if(!n)return;let r=this.rowKeys(t),i=r.some(e=>this.selectedMessages.has(e)),a=i?[...this.selectedMessages]:r,o={keys:a,selection:i},s=i&&this.selectAllMatching?this.matchingCount:a.length,c=s>1?this.i18nStore?.t(`messageList.dragCount`,{count:s})||`${s}`:t.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`)||``;n.setData(vs,JSON.stringify(o)),n.setData(`text/plain`,c),n.effectAllowed=`copyMove`,this.setDragImage(n,c),this.draggingKeys=a,window.addEventListener(`drop`,this.endDrag,!0),window.addEventListener(`dragend`,this.endDrag,!0)}setDragImage(e,t){if(typeof e.setDragImage!=`function`)return;let n=document.createElement(`div`);n.textContent=t,Object.assign(n.style,{position:`absolute`,top:`-1000px`,left:`-1000px`,maxWidth:`280px`,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`,padding:`6px 12px`,borderRadius:`16px`,background:`var(--accent-color, #005A9E)`,color:`var(--accent-contrast, #fff)`,font:`500 13px/1.4 var(--font-base, sans-serif)`,boxShadow:`0 4px 12px rgba(0, 0, 0, 0.18)`,pointerEvents:`none`}),n.dir=`auto`,document.body.appendChild(n),e.setDragImage(n,15,15),setTimeout(()=>n.remove(),0)}isDragged(e){return!!this.draggingKeys&&this.rowKeys(e).some(e=>this.draggingKeys.includes(e))}toggleStar(e,t){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-star-message`,{detail:{message:t,messages:this.rowMessages(t)}}))}get isTextSearch(){return this.filterQuery!==``&&!Ts.has(this.filterQuery)}render(){return n`
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
              ${this.folderTitle}
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
            <span>${this.i18nStore?.t(`messageList.allMatchingSelected`,{count:this.matchingCount,folder:this.folderTitle})}</span>
            <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`clear-selection`))}>
              ${this.i18nStore?.t(`messageList.clearSelection`)}
            </alps-button>
          </alps-banner>
        `:this.selectedMessages.size>0&&this.allOnPageSelected&&this.canSelectAllMatching?n`
          <alps-banner>
            <span>${this.i18nStore?.t(`messageList.allOnPageSelected`,{count:this.pageKeys.length})}</span>
            <alps-button slot="action" variant="normal" @click=${()=>this.dispatchEvent(new CustomEvent(`select-all-matching`))}>
              ${this.i18nStore?.t(`messageList.selectAllMatching`,{count:this.totalMessages,folder:this.folderTitle})}
            </alps-button>
          </alps-banner>
        `:``}
        ${!this.filterQuery&&this.isDiscardableFolder&&this.totalMessages>0&&this.rowsAreCurrent?n`
          <alps-banner variant="warning">
            <span>${this.i18nStore?.t(this.countsConversations?`messageList.totalConversationsIn`:`messageList.totalMessagesIn`,{count:this.totalMessages,folder:this.folderTitle})||`${this.totalMessages} total ${this.countsConversations?`conversations`:`messages`} in ${this.folderTitle}`}</span>
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
          title=${this.i18nStore?.t(`messageList.emptyMailboxTitle`,{folder:this.folderTitle})||`Empty ${this.folderTitle}`}
          message=${this.emptyConfirmMessage}
          confirmText=${this.i18nStore?.t(`messageList.deleteAllNow`)||`Delete All Now`}
          .isDanger=${!0}
          @confirm=${this.handleEmptyMailbox}
          @cancel=${()=>this.showEmptyConfirm=!1}
        ></ui-confirm>
      `:``}
    `}};j([h({context:T})],U.prototype,`settingsStore`,void 0),j([h({context:w})],U.prototype,`i18nStore`,void 0),j([o({type:Array})],U.prototype,`messages`,void 0),j([o({type:String})],U.prototype,`currentMailbox`,void 0),j([o({type:Array})],U.prototype,`mailboxes`,void 0),j([o({type:String})],U.prototype,`currentMailboxRole`,void 0),j([o({type:String})],U.prototype,`listedMailbox`,void 0),j([o({type:String})],U.prototype,`listedMailboxRole`,void 0),j([o({type:Boolean})],U.prototype,`loading`,void 0),j([o({type:Object})],U.prototype,`selectedMessage`,void 0),j([o({type:String})],U.prototype,`layoutMode`,void 0),j([o({type:Boolean})],U.prototype,`isMobile`,void 0),j([o({type:Boolean})],U.prototype,`sidebarCollapsed`,void 0),j([o({type:Number})],U.prototype,`currentPage`,void 0),j([o({type:Number})],U.prototype,`listedPage`,void 0),j([o({type:Number})],U.prototype,`totalMessages`,void 0),j([o({type:Number})],U.prototype,`messagesPerPage`,void 0),j([o({type:String})],U.prototype,`filterQuery`,void 0),j([o({type:String})],U.prototype,`sortOrder`,void 0),j([o({type:String})],U.prototype,`densityMode`,void 0),j([o({type:Boolean})],U.prototype,`showSenderAvatars`,void 0),j([o({type:Object})],U.prototype,`selectedMessages`,void 0),j([o({type:Boolean})],U.prototype,`selectAllMatching`,void 0),j([o({type:Number})],U.prototype,`matchingCount`,void 0),j([o({type:Boolean})],U.prototype,`syncing`,void 0),j([o({type:Boolean})],U.prototype,`loadFailed`,void 0),j([a()],U.prototype,`isSpinning`,void 0),j([a()],U.prototype,`isScrolled`,void 0),j([a()],U.prototype,`isAtBottom`,void 0),j([a()],U.prototype,`focusedIndex`,void 0),j([a()],U.prototype,`showEmptyConfirm`,void 0),j([a()],U.prototype,`emptying`,void 0),j([a()],U.prototype,`expandedThreads`,void 0),j([a()],U.prototype,`draggingKeys`,void 0),j([a()],U.prototype,`verdicts`,void 0),U=j([p(`alps-message-list`)],U);var W=class extends d{constructor(...e){super(...e),this.contacts=[],this.selectedCategory=``,this.filterQuery=``,this.sortOrder=`asc`,this.showOnlyStarred=!1,this.isMobile=!1,this.densityMode=`compact`,this.selectedContacts=new Set,this.selectedContact=null,this.isSpinning=!1,this.loading=!1,this.listScrolled=!1,this.focusedIndex=-1}getFilteredContacts(){let e=this.contacts.filter(e=>{if(this.selectedCategory&&(!e.categories||!e.categories.includes(this.selectedCategory))||this.showOnlyStarred&&(!e.categories||!e.categories.includes(`Favorites`)))return!1;if(this.filterQuery){let t=this.filterQuery.toLowerCase(),n=(e.email||``).toLowerCase().includes(t)||e.emails&&e.emails.some(e=>(e.value||``).toLowerCase().includes(t)),r=(e.phone||``).toLowerCase().includes(t)||e.phones&&e.phones.some(e=>(e.value||``).toLowerCase().includes(t));if(!(e.name||``).toLowerCase().includes(t)&&!n&&!r&&!(e.nickname||``).toLowerCase().includes(t)&&!(e.organization||``).toLowerCase().includes(t))return!1}return!0});return e.sort((e,t)=>{let n=(e.name||e.email||``).toLowerCase(),r=(t.name||t.email||``).toLowerCase();return n<r?this.sortOrder===`asc`?-1:1:n>r?this.sortOrder===`asc`?1:-1:0}),e}willUpdate(e){if(super.willUpdate(e),e.has(`selectedContact`)||e.has(`contacts`)||e.has(`selectedCategory`)||e.has(`filterQuery`)||e.has(`sortOrder`)||e.has(`showOnlyStarred`)){let e=this.getFilteredContacts();if(this.selectedContact&&e.length>0){let t=e.findIndex(e=>e.path===this.selectedContact.path);t===-1?this.focusedIndex=-1:this.focusedIndex=t}else this.focusedIndex=-1}}updated(e){super.updated(e),e.has(`densityMode`)&&(this.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),this.classList.add(`density-${this.densityMode}`))}static{this.styles=[U.styles,_`
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
  `]}formatRevision(e){if(!e)return``;let t=e;t.length===16&&t.indexOf(`-`)===-1&&(t=`${t.slice(0,4)}-${t.slice(4,6)}-${t.slice(6,8)}T${t.slice(9,11)}:${t.slice(11,13)}:${t.slice(13,16)}`);let n=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,r=String(this.settingsStore?.getState()?.hourFormat||`12`);return ir(new Date(t),n,r)}handleKeyDown(e){let t=this.getFilteredContacts();if(t.length!==0){if(e.key===`ArrowDown`)e.preventDefault(),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused();else if(e.key===`ArrowUp`)e.preventDefault(),this.focusedIndex=Math.max(0,this.focusedIndex-1),this.scrollToFocused();else if(e.key===`Enter`)e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length&&this.dispatchEvent(new CustomEvent(`select-contact`,{detail:{contact:t[this.focusedIndex]}}));else if(e.key===` `&&(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length)){let n=t[this.focusedIndex];n.isTemporary||this.dispatchEvent(new CustomEvent(`toggle-selection`,{detail:{path:n.path,event:e}})),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused()}}}scrollToFocused(){this.updateComplete.then(()=>{let e=this.renderRoot.querySelector(`.contact-item.focused`);e&&e.scrollIntoView({block:`nearest`})})}handleListScroll(e){let t=e.target.scrollTop>0;this.listScrolled!==t&&(this.listScrolled=t,this.dispatchEvent(new CustomEvent(`list-scrolled`,{detail:{scrolled:t}})))}render(){let e=this.getFilteredContacts(),t=e.filter(e=>e.path&&!e.isTemporary),r=t.length>0&&t.every(e=>this.selectedContacts.has(e.path));return n`
      ${this.isMobile?``:n`
        <alps-toolbar class="list-header" ?scrolled=${this.listScrolled}>
          <input type="checkbox" class="select-all-checkbox" title=${this.i18nStore?.t(`messageList.selectAll`)}
            .checked=${r}
            @change=${e=>this.dispatchEvent(new CustomEvent(`select-all`,{detail:{checked:e.target.checked,paths:t.map(e=>e.path)}}))}>
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
        ${this.loading&&this.contacts.length===0?n`<alps-loader full-height .text=${this.i18nStore?.t(`messageList.loading`)}></alps-loader>`:n`
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
                            ${A(e.categories?.includes(`Favorites`)?`starFourFill`:`starFour`)}
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
            `}
      </div>
    `}};j([h({context:w})],W.prototype,`i18nStore`,void 0),j([h({context:T})],W.prototype,`settingsStore`,void 0),j([o({type:Array})],W.prototype,`contacts`,void 0),j([o({type:String})],W.prototype,`selectedCategory`,void 0),j([o({type:String})],W.prototype,`filterQuery`,void 0),j([o({type:String})],W.prototype,`sortOrder`,void 0),j([o({type:Boolean})],W.prototype,`showOnlyStarred`,void 0),j([o({type:Boolean})],W.prototype,`isMobile`,void 0),j([o({type:String})],W.prototype,`densityMode`,void 0),j([o({type:Object})],W.prototype,`selectedContacts`,void 0),j([o({type:Object})],W.prototype,`selectedContact`,void 0),j([o({type:Boolean})],W.prototype,`isSpinning`,void 0),j([o({type:Boolean})],W.prototype,`loading`,void 0),j([o({type:Boolean})],W.prototype,`listScrolled`,void 0),j([a()],W.prototype,`focusedIndex`,void 0),W=j([p(`alps-contacts-list`)],W);var Os=new TextEncoder;function ks(e){let t=[],n=new Set,r=0;for(let i=e.length-1;i>=0&&t.length<200;i--){let a=e[i];if(typeof a!=`string`||!a||n.has(a))continue;let o=Os.encode(a).length;r+o>16384||(n.add(a),r+=o,t.push(a))}return t.reverse()}function As(e,t){return ks([...e.filter(e=>e!==t),t])}function js(e,t){return e.filter(e=>e!==t)}function Ms(e,t,n){return e.filter(e=>!Qn(e,t,n))}function Ns(e,t,n,r){return ks(e.map(e=>Qn(e,t,r)?n+e.slice(t.length):e))}var Ps=e=>e?.Name||e?.Mailbox||``;function Fs(e,t){if(e.size!==0)for(let n of t||[]){let t=Ps(n);e.has(t)&&n.Subscribed!==!0&&e.delete(t)}}function Is(e,t,n){let r=new Set;for(let e of t||[])e?.Subscribed===!0&&r.add(Ps(e));return e.filter(e=>n.has(e)||!r.has(e))}var G=class extends d{constructor(...e){super(...e),this.mailboxes=[],this.currentMailbox=``,this.expandedFolders=new Set,this.layoutMode=`vertical`,this.syncing=!1,this.collapsed=!1,this.isScrolled=!1,this.showCreatePrompt=!1,this.promptBusy=!1,this.showRenamePrompt=!1,this.mailboxToRename=``,this.showDeleteConfirm=!1,this.showMoveToTrashConfirm=!1,this.mailboxToDelete=``,this.parentForNewFolder=``,this.activeKebabMenu=null,this.dropTarget=null,this.dropCopy=!1,this.stopDropWatch=null,this.showUnsubscribed=!1,this.unconfirmedUnsubscribes=new Set,this.primaryFullNames=new Set,this._handleStoreChange=()=>{this.requestUpdate()},this.handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0}}willUpdate(e){super.willUpdate(e)}updated(e){super.updated(e),this.settleUnsubscribed()}get unsubscribedHere(){return this.settingsStore?.getState()?.unsubscribedFolders??[]}saveUnsubscribedHere(e){let t=this.unsubscribedHere;e.length===t.length&&e.every((e,n)=>e===t[n])||this.settingsStore?.updateSettings({unsubscribedFolders:e})}settleUnsubscribed(){!this.settingsStore?.recordRead||this.mailboxes.length===0||this.unsubscribedHere.length===0&&this.unconfirmedUnsubscribes.size===0||(Fs(this.unconfirmedUnsubscribes,this.mailboxes),this.saveUnsubscribedHere(Is(this.unsubscribedHere,this.mailboxes,this.unconfirmedUnsubscribes)))}subscriptionChanged(e,t){t?(this.unconfirmedUnsubscribes.delete(e),this.saveUnsubscribedHere(js(this.unsubscribedHere,e))):(this.unconfirmedUnsubscribes.add(e),this.saveUnsubscribedHere(As(this.unsubscribedHere,e)))}renamedHere(e,t,n){for(let r of[...this.unconfirmedUnsubscribes])Qn(r,e,n)&&(this.unconfirmedUnsubscribes.delete(r),this.unconfirmedUnsubscribes.add(t+r.slice(e.length)));this.saveUnsubscribedHere(Ns(this.unsubscribedHere,e,t,n))}goneHere(e,t){for(let n of[...this.unconfirmedUnsubscribes])Qn(n,e,t)&&this.unconfirmedUnsubscribes.delete(n);this.saveUnsubscribedHere(Ms(this.unsubscribedHere,e,t))}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&(this.composeStore&&this.composeStore.addEventListener(`change`,this._handleStoreChange),this.i18nStore&&this.i18nStore.addEventListener(`change`,this._handleStoreChange),this.settingsStore&&this.settingsStore.addEventListener(`change`,this._handleStoreChange))})}disconnectedCallback(){super.disconnectedCallback(),this.composeStore&&this.composeStore.removeEventListener(`change`,this._handleStoreChange),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange),this.clearDropTarget()}static{this.styles=[Nr,br,_`
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
      gap: 4px;
    }

    /* The fade belongs to the hover only. On the base rule it also eased the
       row that lost .active down over 150ms while the new one came up, so a
       folder switch showed two rows lit at once, the old one reading as still
       selected. A transition is taken from the state being entered, so the
       base and .active have none, and only entering :hover animates. */
    @media (hover: hover) {
      .folder-item:hover {
        background: var(--hover-color);
        transition: background 0.15s;
      }

      .folder-item.active:hover {
        transition: none;
      }
    }

    .folder-item.active {
      background: var(--bg-selected);
      color: var(--accent-hover);
      font-weight: 600;
    }

    /* The folder a drop would file into. Dashed for a move, and in another
       colour for a copy, so the modifier can be seen to have been taken. */
    .folder-item.drop-target {
      background: var(--hover-color);
      outline: 2px dashed var(--accent-color);
      outline-offset: -2px;
    }

    .folder-item.drop-target.drop-copy {
      outline-color: var(--success);
    }

    /* The More row: a button, so the keyboard reaches it, drawn as a row. */
    button.more-row {
      width: 100%;
      border: none;
      background: none;
      font: inherit;
      color: var(--text-muted);
      text-align: start;
    }

    .more-caret {
      display: flex;
      padding: 2px;
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

    /* The menu is shown while the keyboard is in its row, so that Tab
       reaches it from the folder's name: a button inside display: none is no
       Tab stop, and so it could never take the focus that shows it. Not
       while a click has put the focus on the name, or on the expander, whose
       button a click focuses too: a click leaves the row as it was. Keyed on
       :focus-within, which holds while the focus moves from the name to the
       menu; keyed on the name's :focus-visible alone, the menu was hidden
       again before Tab reached it. */
    .folder-item:focus-within:not(:has(.folder-name:focus:not(:focus-visible), .folder-toggle-btn:focus)) .folder-actions {
      display: flex;
    }

    .folder-item.has-actions:focus-within:not(:has(.folder-name:focus:not(:focus-visible), .folder-toggle-btn:focus)) .folder-badge {
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
      font-family: var(--font-label);
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
  `]}toggleFolder(e,t){e&&e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-folder`,{detail:{folderName:t}}))}selectMailbox(e){this.dispatchEvent(new CustomEvent(`select-mailbox`,{detail:{name:e}}))}triggerCreateFolder(){this.parentForNewFolder=``,this.showCreatePrompt=!0}async handleCreateSubmit(e){let t=e.detail.name;this.promptBusy=!0;try{if(t){if(this.parentForNewFolder){let e=er(this.mailboxes.find(e=>(e.Name||e.Mailbox)===this.parentForNewFolder))||`.`;t=`${this.parentForNewFolder}${e}${t}`,this.dispatchEvent(new CustomEvent(`expand-folder`,{detail:{folderName:this.parentForNewFolder}}))}let e=await gs.createMailbox(t);e===`ok`?this.saveUnsubscribedHere(js(this.unsubscribedHere,t)):e===`exists`?this.toast(this.i18nStore?.t(`toast.folderExists`),`A folder with that name already exists`,{type:`error`}):e===`failed`&&this.toast(this.i18nStore?.t(`toast.folderCreateFailed`),`Could not create the folder`,{type:`error`})}}finally{this.promptBusy=!1,this.showCreatePrompt=!1,this.parentForNewFolder=``}}toast(e,t,n={}){this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:e||t,duration:4e3,...n},bubbles:!0,composed:!0}))}async handleRenameSubmit(e){let t=e.detail.name;if(t&&this.mailboxToRename){let e=this.mailboxToRename,n=er(this.mailboxes.find(t=>(t.Name||t.Mailbox)===e));this.showRenamePrompt=!1,this.mailboxToRename=``;let r=await gs.renameMailbox(e,t);r===`exists`?this.toast(this.i18nStore?.t(`toast.folderExists`),`A folder with that name already exists`,{type:`error`}):r===`failed`?this.toast(this.i18nStore?.t(`toast.folderRenameFailed`),`Could not rename the folder`,{type:`error`}):(this.renamedHere(e,t,n),Qn(this.currentMailbox,e)&&this.selectMailbox(t+this.currentMailbox.slice(e.length)),this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderRenamed`),actionLabel:this.i18nStore?.t(`toast.undo`),actionFn:async()=>{if(await gs.renameMailbox(t,e)!==`ok`){this.toast(this.i18nStore?.t(`toast.folderUndoFailed`),`Could not undo that`,{type:`error`});return}this.renamedHere(t,e,n),Qn(this.currentMailbox,t)&&this.selectMailbox(e+this.currentMailbox.slice(t.length))},duration:5e3},bubbles:!0,composed:!0})))}else this.showRenamePrompt=!1,this.mailboxToRename=``}async handleDeleteConfirm(){if(this.mailboxToDelete){let e=this.mailboxToDelete,t=er(this.mailboxes.find(t=>(t.Name||t.Mailbox)===e));await gs.deleteMailbox(e)?(this.goneHere(e,t),Qn(this.currentMailbox,this.mailboxToDelete)&&this.selectMailbox(O),this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderPermanentlyDeleted`),duration:3e3},bubbles:!0,composed:!0}))):this.toast(this.i18nStore?.t(`toast.folderDeleteFailed`),`Could not delete the folder`,{type:`error`})}this.showDeleteConfirm=!1,this.mailboxToDelete=``}async handleMoveToTrashConfirm(){if(this.mailboxToDelete){let e=this.mailboxes.find(e=>(e.Name||e.Mailbox)===this.mailboxToDelete),t=tr(this.mailboxToDelete,er(e,`.`)),n=t[t.length-1],r=er(e,`.`)||`.`,i=Gn(`trash`,this.mailboxes,`Trash`),a=`${i}${r}${n}`,o=1;for(;this.mailboxes.some(e=>(e.Name||e.Mailbox)===a);)a=`${i}${r}${n} (${o})`,o++;let s=a;if(await gs.renameMailbox(this.mailboxToDelete,s)!==`ok`)this.toast(this.i18nStore?.t(`toast.folderRenameFailed`),`Could not rename the folder`,{type:`error`});else{this.goneHere(this.mailboxToDelete,r),Qn(this.currentMailbox,this.mailboxToDelete,r)&&this.selectMailbox(O);let e=this.mailboxToDelete;this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderMovedToTrash`),actionLabel:this.i18nStore?.t(`toast.undo`),actionFn:async()=>{await gs.renameMailbox(s,e)!==`ok`&&this.toast(this.i18nStore?.t(`toast.folderUndoFailed`),`Could not undo that`,{type:`error`})},duration:5e3},bubbles:!0,composed:!0}))}}this.showMoveToTrashConfirm=!1,this.mailboxToDelete=``}moveFolder(e,t){console.log(`[moveFolder] Start:`,{folderName:e,direction:t});let n=er(this.mailboxes.find(t=>(t.Name||t.Mailbox)===e),`.`),r=tr(e,n),i=r.slice(0,-1).join(n),a=this.mailboxes.map(e=>e.Name||e.Mailbox||``).filter(e=>{if(this.primaryFullNames.has(e))return!1;let t=tr(e,n);return t.slice(0,-1).join(n)===i&&t.length===r.length});console.log(`[moveFolder] Sibling custom folders found:`,a);let o=[...this.settingsStore?.getState()?.customMailboxOrder||[]];a.sort((e,t)=>{let n=o.indexOf(e),r=o.indexOf(t);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.localeCompare(t):1:-1}),console.log(`[moveFolder] Sorted siblings:`,a);let s=a.indexOf(e);if(s===-1){console.error(`[moveFolder] Folder not found in siblings!`);return}let c=s;switch(t){case`top`:c=0;break;case`up`:c=Math.max(0,s-1);break;case`down`:c=Math.min(a.length-1,s+1);break;case`bottom`:c=a.length-1;break}if(console.log(`[moveFolder] Shifting indexes:`,{currentIndex:s,newIndex:c}),c===s){console.log(`[moveFolder] No index change needed.`);return}a.splice(s,1),a.splice(c,0,e),console.log(`[moveFolder] New siblings order:`,a);let l=o.filter(e=>!a.includes(e));l.push(...a),console.log(`[moveFolder] Final updated customMailboxOrder settings state:`,l),this.settingsStore?.updateSettings({customMailboxOrder:l})}takesDrop(e,t){return!this.collapsed&&ys(e.dataTransfer)&&Xn(t,this.mailboxes,this.currentMailbox)}handleDragOver(e,t,n){if(!this.takesDrop(e,n)){this.dropTarget===t&&this.clearDropTarget();return}e.preventDefault();let r=xs(e);e.dataTransfer.dropEffect=r?`copy`:`move`,this.dropTarget!==t&&(this.dropTarget=t),this.dropCopy!==r&&(this.dropCopy=r),this.watchDragEnd()}handleDragLeave(e,t){let n=e.currentTarget,r=e.relatedTarget;n&&r&&n.contains(r)||this.dropTarget===t&&this.clearDropTarget()}handleDrop(e,t,n){if(!this.takesDrop(e,n))return;e.preventDefault();let r=xs(e),i=bs(e.dataTransfer);this.clearDropTarget(),!(!i||i.keys.length===0)&&this.dispatchEvent(new CustomEvent(`drop-messages`,{detail:{folder:t,copy:r,keys:i.keys,selection:i.selection},bubbles:!0,composed:!0}))}watchDragEnd(){if(this.stopDropWatch)return;let e=()=>this.clearDropTarget(),t=t=>{t.key===`Escape`&&e()};window.addEventListener(`dragend`,e,!0),window.addEventListener(`drop`,e,!0),window.addEventListener(`keydown`,t,!0),this.stopDropWatch=()=>{window.removeEventListener(`dragend`,e,!0),window.removeEventListener(`drop`,e,!0),window.removeEventListener(`keydown`,t,!0)}}clearDropTarget(){this.stopDropWatch?.(),this.stopDropWatch=null,this.dropTarget=null,this.dropCopy=!1}render(){let e=[{role:`inbox`,names:[O],display:{icon:`tray`,label:this.i18nStore?.t(`folderList.inbox`)}},{role:`drafts`,names:[Nn],display:{icon:`fileText`,label:this.i18nStore?.t(`folderList.drafts`)}},{role:`sent`,names:[Pn],display:{icon:`paperPlaneTilt`,label:this.i18nStore?.t(`folderList.sent`)}},{role:`archive`,names:[Fn,In],display:{icon:`archiveBox`,label:this.i18nStore?.t(`folderList.archive`)}},{role:`junk`,names:[Rn,Ln],display:{icon:`warningDiamond`,label:this.i18nStore?.t(`folderList.junk`)}},{role:`trash`,names:[zn],display:{icon:`trash`,label:this.i18nStore?.t(`folderList.trash`)}}],t={[O]:{icon:`tray`,label:this.i18nStore?.t(`folderList.inbox`)},[Nn]:{icon:`fileText`,label:this.i18nStore?.t(`folderList.drafts`)},[Pn]:{icon:`paperPlaneTilt`,label:this.i18nStore?.t(`folderList.sent`)},[Fn]:{icon:`archiveBox`,label:this.i18nStore?.t(`folderList.archive`)},[In]:{icon:`archiveBox`,label:this.i18nStore?.t(`folderList.archive`)},[Ln]:{icon:`warningDiamond`,label:this.i18nStore?.t(`folderList.spam`)},[Rn]:{icon:`warningDiamond`,label:this.i18nStore?.t(`folderList.junk`)},[zn]:{icon:`trash`,label:this.i18nStore?.t(`folderList.trash`)}},r=()=>Object.create(null),i=r();this.mailboxes.forEach(e=>{let t=e.Name||e.Mailbox||``,n=er(e,`.`),a=tr(t,n),o=i,s=``;for(let t=0;t<a.length;t++){let i=a[t];s=t===0?i:s+n+i,o[i]||(o[i]={name:i,fullName:s,children:r()}),t===a.length-1&&(o[i].mb=e),o=o[i].children}});let a=Jn(this.mailboxes),o=new Map;e.forEach((e,t)=>{let n=Kn(e.role,this.mailboxes);n!==null&&o.set(n,t)});let s=new Map,l=[];Object.values(i).forEach(e=>{let t=e.mb?o.get(e.fullName):void 0;t===void 0?l.push(e):s.set(t,e)});let u=(n,r)=>e[r].names.includes(n.name)&&t[n.name]||e[r].display,d=[];for(let t=0;t<e.length;t++){let e=s.get(t);e&&(e.primary=u(e,t),d.push(e))}this.primaryFullNames=new Set(d.map(e=>e.fullName));let f=new Map([...o].filter(([,e])=>!s.has(e))),p=this.settingsStore?.getState()?.customMailboxOrder||[];l.sort((e,t)=>{let n=p.indexOf(e.fullName),r=p.indexOf(t.fullName);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.name.localeCompare(t.name):1:-1});let m=new Set(this.unsubscribedHere),h=e=>Un(e.mb,a)!==null||Object.values(e.children).some(h),g=Yn(this.mailboxes)?l.filter(e=>!!e.mb&&e.mb.Subscribed!==!0&&m.has(e.fullName)&&!h(e)):[],_=l.filter(e=>!g.includes(e)),v=g.some(e=>Qn(this.currentMailbox,e.fullName,er(e.mb))),y=this.showUnsubscribed||v,ee=(e,t=0)=>e.map(e=>{let r=Object.keys(e.children).length>0,i=this.expandedFolders.has(e.fullName),a=this.currentMailbox===e.fullName,o=t>0||!e.primary,s=!1,l=!1;if(o){let t=er(e.mb,`.`),n=tr(e.fullName,t),r=n.slice(0,-1).join(t),i=this.mailboxes.map(e=>e.Name||e.Mailbox||``).filter(e=>{if(this.primaryFullNames.has(e))return!1;let i=tr(e,t);return i.slice(0,-1).join(t)===r&&i.length===n.length}),a=this.settingsStore?.getState()?.customMailboxOrder||[];i.sort((e,t)=>{let n=a.indexOf(e),r=a.indexOf(t);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.localeCompare(t):1:-1});let o=i.indexOf(e.fullName);s=o<=0,l=o===-1||o===i.length-1}let d=f.get(e.fullName),m=e.primary??(d===void 0?void 0:u(e,d)),h=A(`folder`),g=e.name;m&&(h=A(m.icon),g=m.label);let _=e.mb?.Unseen||0,v=(e.mb?.Attrs||[]).some(e=>typeof e==`string`&&e.toLowerCase()===`\\noselect`),y=this.dropTarget===e.fullName,te=t=>{v?r&&this.toggleFolder(t,e.fullName):this.selectMailbox(e.fullName)},b=!v||r;return n`
          <div 
            class="folder-item ${a?`active`:``} ${v?`no-select`:``} ${o?`has-actions`:``} ${y?`drop-target`:``} ${y&&this.dropCopy?`drop-copy`:``}"
            title=${g}
            @click=${te}
            @dragenter=${t=>this.handleDragOver(t,e.fullName,e.mb)}
            @dragover=${t=>this.handleDragOver(t,e.fullName,e.mb)}
            @dragleave=${t=>this.handleDragLeave(t,e.fullName)}
            @drop=${t=>this.handleDrop(t,e.fullName,e.mb)}
          >
            <alps-icon-btn 
              class="folder-toggle-btn" 
              title=${this.i18nStore?.t(i?`general.collapse`:`general.expand`)}
              icon=${i?`caretDown`:`caretRight`}
              style="visibility: ${r?`visible`:`hidden`};"
              @click=${t=>{t.stopPropagation(),r&&this.toggleFolder(t,e.fullName)}}
            ></alps-icon-btn>
            
            <div class="folder-icon">${h}</div>
            <div class="folder-name"
              role=${b?`button`:c}
              tabindex=${b?`0`:c}
              aria-current=${a?`true`:c}
              aria-expanded=${v&&r?String(i):c}
              @keydown=${b?e=>{e.key!==`Enter`&&e.key!==` `||(e.preventDefault(),!(e.key===` `&&e.repeat)&&te(e))}:c}
            >${g}</div>
            
            ${o?n`
              <div class="folder-actions ${this.activeKebabMenu===e.fullName?`popup-open`:``}" @click=${e=>e.stopPropagation()}>
                <alps-popup 
                  align="right" 
                  position="bottom"
                  @popup-open=${()=>{this.activeKebabMenu=e.fullName}}
                  @popup-close=${()=>{this.activeKebabMenu===e.fullName&&(this.activeKebabMenu=null)}}
                >
                  <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical" title=${this.i18nStore?.t(`general.moreOptions`)}></alps-icon-btn>
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.parentForNewFolder=e.fullName,this.showCreatePrompt=!0}}>
                    ${A(`folderPlus`)} <span class="item-text">${this.i18nStore?.t(`folderList.createSubfolder`)}</span>
                  </button>
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.mailboxToRename=e.fullName,this.showRenamePrompt=!0}}>
                    ${A(`pen`)} <span class="item-text">${this.i18nStore?.t(`folderList.rename`)}</span>
                  </button>
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=!e.mb?.Subscribed;gs.setSubscribed(e.fullName,r).then(t=>{t.ok&&this.subscriptionChanged(e.fullName,r),!(t.ok||t.reason===`auth`)&&(r?this.toast(this.i18nStore?.t(`toast.subscribeFailed`),`Could not subscribe`):this.toast(this.i18nStore?.t(`toast.unsubscribeFailed`),`Could not unsubscribe`))})}}>
                    ${A(e.mb?.Subscribed?`eyeSlash`:`eye`)} <span class="item-text">${e.mb?.Subscribed?this.i18nStore?.t(`folderList.unsubscribe`):this.i18nStore?.t(`folderList.subscribe`)}</span>
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
                        ${A(`sortAscending`)} <span class="item-text">${this.i18nStore?.t(`folderList.order`)}</span>
                      </div>
                      <div class="caret-icon">${A(`caretRight`)}</div>
                    </button>
                    
                    <button class="dropdown-item" ?disabled=${s} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`top`)}}>
                      ${A(`caretDoubleUp`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveToTop`)}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${s} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`up`)}}>
                      ${A(`caretUp`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveUp`)}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${l} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`down`)}}>
                      ${A(`caretDown`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveDown`)}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${l} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`bottom`)}}>
                      ${A(`caretDoubleDown`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveToBottom`)}</span>
                    </button>
                  </alps-popup>


                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.mailboxToDelete=e.fullName;let r=Gn(`trash`,this.mailboxes,zn);Wn(e.fullName,this.mailboxes)===`trash`||Qn(e.fullName,r,er(e.mb))?this.showDeleteConfirm=!0:this.showMoveToTrashConfirm=!0}}>
                    ${A(`trash`)} <span class="item-text">${this.i18nStore?.t(`folderList.delete`)}</span>
                  </button>
                </alps-popup>
              </div>
            `:``}

            ${_>0?n`<div class="folder-badge">${_}</div>`:``}
          </div>
          
          ${r&&i?n`
            <div class="folder-children">
              ${ee(Object.values(e.children).sort((e,t)=>{let n=p.indexOf(e.fullName),r=p.indexOf(t.fullName);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.name.localeCompare(t.name):1:-1}),t+1)}
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
        <!-- Inert in the strip, not only dimmed. sidebarLayoutStyles gives the
             dimmed content pointer-events: none, which keeps the mouse out;
             inert keeps the keyboard out too, so Tab cannot walk into folder
             carets clipped past the strip's edge. Compose, above, stays live. -->
        <div class="sidebar-content" ?inert=${this.collapsed} @scroll=${this.handleScroll}>
          <div class="sidebar-scroll-content">
            ${ee(d)}
            ${d.length>0&&l.length>0?n`
              <div class="folder-separator"></div>
            `:``}
            <div class="sidebar-header-title">
              <span>${this.i18nStore?.t(`folderList.title`)}</span>
            </div>
            ${ee(_)}
            ${g.length>0?n`
              <button
                type="button"
                class="folder-item more-row"
                aria-expanded=${y?`true`:`false`}
                title=${this.i18nStore?.t(`folderList.unsubscribedFolders`)}
                @click=${()=>{this.showUnsubscribed=!y}}
              >
                <div class="more-caret">${A(y?`caretDown`:`caretRight`)}</div>
                <div class="folder-icon">${A(`eyeSlash`)}</div>
                <div class="folder-name">${y?this.i18nStore?.t(`folderList.less`):this.i18nStore?.t(`folderList.more`)}</div>
              </button>
              ${y?ee(g):``}
            `:``}
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
    `}};j([h({context:es})],G.prototype,`composeStore`,void 0),j([h({context:w})],G.prototype,`i18nStore`,void 0),j([h({context:T})],G.prototype,`settingsStore`,void 0),j([o({type:Array})],G.prototype,`mailboxes`,void 0),j([o({type:String})],G.prototype,`currentMailbox`,void 0),j([o({type:Object})],G.prototype,`expandedFolders`,void 0),j([o({type:String})],G.prototype,`layoutMode`,void 0),j([o({type:Boolean})],G.prototype,`syncing`,void 0),j([o({type:Boolean,reflect:!0})],G.prototype,`collapsed`,void 0),j([a()],G.prototype,`isScrolled`,void 0),j([a()],G.prototype,`showCreatePrompt`,void 0),j([a()],G.prototype,`promptBusy`,void 0),j([a()],G.prototype,`showRenamePrompt`,void 0),j([a()],G.prototype,`mailboxToRename`,void 0),j([a()],G.prototype,`showDeleteConfirm`,void 0),j([a()],G.prototype,`showMoveToTrashConfirm`,void 0),j([a()],G.prototype,`mailboxToDelete`,void 0),j([a()],G.prototype,`parentForNewFolder`,void 0),j([a()],G.prototype,`activeKebabMenu`,void 0),j([a()],G.prototype,`dropTarget`,void 0),j([a()],G.prototype,`dropCopy`,void 0),j([a()],G.prototype,`showUnsubscribed`,void 0),G=j([p(`alps-folder-list`)],G);var Ls=class extends d{constructor(...e){super(...e),this.name=``,this.address=``,this._handleI18nChange=()=>this.requestUpdate()}connectedCallback(){super.connectedCallback(),this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}static{this.styles=[nn,_`
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
  `]}handleClick(){this.composeStore.openComposer({to:[this.address]})}render(){let e=this.name;e===this.address&&(e=``);let t=tn(this.address),r=on(this.address,this.i18nStore);return e?n`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          <bdi class="recipient-name">${e}</bdi>
          <span class="recipient-address">&lt;${t}&gt;</span>${r}
        </a>
      `:n`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          ${t}${r}
        </a>
      `}};j([h({context:es})],Ls.prototype,`composeStore`,void 0),j([h({context:w})],Ls.prototype,`i18nStore`,void 0),j([o({type:String})],Ls.prototype,`name`,void 0),j([o({type:String})],Ls.prototype,`address`,void 0),Ls=j([p(`alps-recipient-pill`)],Ls);function Rs(e,t,n){if(!e||t===void 0||t===``||!n)return``;let r=Array.isArray(n.Path)?n.Path.join(`.`):String(n.Path??``);return r?`/mailboxes/${k(e)}/messages/${t}/raw?part=${r}`:``}var zs=new Set([`png`,`jpg`,`jpeg`,`gif`,`webp`,`svg`,`avif`,`bmp`,`ico`,`tiff`,`tif`,`heic`,`heif`]),Bs=new Set([`pdf`]),Vs=new Set([`doc`,`docx`,`odt`,`rtf`,`pages`,`dotx`,`docm`]),Hs=new Set([`xls`,`xlsx`,`csv`,`tsv`,`ods`,`numbers`,`xlsm`]),Us=new Set([`ppt`,`pptx`,`odp`,`key`,`potx`,`ppsx`]),Ws=new Set([`zip`,`tar`,`gz`,`rar`,`7z`,`bz2`,`xz`,`tgz`,`iso`,`dmg`,`pkg`,`deb`,`rpm`]),Gs=new Set(`js.mjs.cjs.ts.mts.cts.jsx.tsx.json.json5.html.htm.css.scss.sass.less.py.go.rs.c.cpp.h.hpp.java.kt.sh.bash.zsh.yml.yaml.sql.xml.md.markdown.toml.ini.env.diff.patch.php.rb.swift.graphql.gql.proto.vue.svelte.rust`.split(`.`)),Ks=new Set([`txt`,`text`,`log`,`nfo`,`sub`,`srt`]),qs=new Set([`mp3`,`wav`,`ogg`,`m4a`,`flac`,`aac`,`wma`,`aiff`,`opus`,`mid`,`midi`]),Js=new Set([`mp4`,`webm`,`mov`,`mkv`,`avi`,`wmv`,`flv`,`m4v`,`3gp`,`ogv`]),Ys=new Set([`ics`,`ical`,`ifb`]),Xs=new Set([`vcf`,`vcard`]);function Zs(e){if(!e)return``;let t=e.lastIndexOf(`.`);return t===-1||t===e.length-1?``:e.slice(t+1).toLowerCase()}function Qs(e,t){let n=(e||``).toLowerCase().trim(),r=Zs(t);if(n===`application/pdf`||Bs.has(r))return{category:`pdf`,icon:`filePdf`,themeClass:`type-pdf`,color:`#ef4444`,previewKind:`pdf`,isImage:!1,isPdf:!0,isAudio:!1,isVideo:!1,isPreviewable:!0};if(n.startsWith(`image/`)||zs.has(r))return{category:`image`,icon:`image`,themeClass:`type-image`,color:`#10b981`,previewKind:`image`,isImage:!0,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0};if(n.startsWith(`audio/`)||qs.has(r))return{category:`audio`,icon:`fileAudio`,themeClass:`type-audio`,color:`#f59e0b`,previewKind:`audio`,isImage:!1,isPdf:!1,isAudio:!0,isVideo:!1,isPreviewable:!0};if(n.startsWith(`video/`)||Js.has(r))return{category:`video`,icon:`fileVideo`,themeClass:`type-video`,color:`#f43f5e`,previewKind:`video`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!0,isPreviewable:!0};if(Gs.has(r)||n===`application/json`||n===`application/ld+json`||n===`application/xml`||n===`application/javascript`||n===`text/javascript`||n===`text/css`||n===`text/html`||n===`text/markdown`||n===`text/x-python`||n===`text/x-shellscript`)return{category:`code`,icon:`fileCode`,themeClass:`type-code`,color:`#8b5cf6`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0};if(Hs.has(r)||n.includes(`spreadsheet`)||n.includes(`excel`)||n===`text/csv`||n===`text/tab-separated-values`){let e=r===`csv`||r===`tsv`||n===`text/csv`||n===`text/tab-separated-values`;return{category:`spreadsheet`,icon:`fileXls`,themeClass:`type-spreadsheet`,color:`#059669`,previewKind:e?`text`:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:e}}return Vs.has(r)||n.includes(`word`)||n.includes(`officedocument.wordprocessingml`)||n===`application/rtf`?{category:`document`,icon:`fileDoc`,themeClass:`type-document`,color:`#3b82f6`,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}:Us.has(r)||n.includes(`presentation`)||n.includes(`powerpoint`)?{category:`presentation`,icon:`filePpt`,themeClass:`type-presentation`,color:`#f59e0b`,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}:Ws.has(r)||n.includes(`zip`)||n.includes(`tar`)||n.includes(`compressed`)||n.includes(`archive`)?{category:`archive`,icon:`fileArchive`,themeClass:`type-archive`,color:`#64748b`,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}:Ys.has(r)||n===`text/calendar`?{category:`calendar`,icon:`calendarBlank`,themeClass:`type-calendar`,color:`#0ea5e9`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0}:Xs.has(r)||n===`text/vcard`||n===`text/x-vcard`?{category:`contact`,icon:`user`,themeClass:`type-contact`,color:`#14b8a6`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0}:Ks.has(r)||n.startsWith(`text/`)?{category:`text`,icon:`fileText`,themeClass:`type-text`,color:`#6b7280`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0}:{category:`generic`,icon:`file`,themeClass:`type-generic`,color:``,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}}var $s=class extends d{constructor(...e){super(...e),this.attachment=null,this.downloadUrl=``,this.fallbackName=`Unknown attachment`,this.removable=!1,this.compact=!1,this.imgError=!1}willUpdate(e){e.has(`attachment`)&&(this.imgError=!1)}static{this.styles=_`
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
      /* A tint of the theme's accent. It was --bg-selected at 30%: #EFF6FF
         over a white pill, a fill drawn at the right width that nobody could
         see. 18% is what the palest accent, ocean-light's, needs to stand out
         from its pill; attachment-pill-progress.test.ts checks every theme. */
      background: color-mix(in srgb, var(--accent-color, #2563eb) 18%, transparent);
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

    /* A file whose upload the server no longer holds: it has to be added again. */
    .attachment-size.missing {
      color: var(--error, #ef4444);
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
  `}get name(){let e=this.attachment;return e.Filename||e.filename||e.name||this.fallbackName}typeInfo(){let e=this.attachment;return Qs(e.MIMEType||e.contentType||e.type,this.name)}uploadProgress(e,t){return this.i18nStore?.t(`attachment.uploadProgress`,{percent:e,size:pr(t)})||`${e}% of ${pr(t)}`}_handlePreview(e){this.removable||!this.downloadUrl||!this.typeInfo().isPreviewable||(e.preventDefault(),e.stopPropagation(),this.dispatchEvent(new CustomEvent(`preview-attachment`,{bubbles:!0,composed:!0,detail:{attachment:this.attachment}})))}_handleRemove(e){e.preventDefault(),e.stopPropagation(),this.dispatchEvent(new CustomEvent(`remove-attachment`,{bubbles:!0,composed:!0,detail:{attachment:this.attachment}}))}render(){if(!this.attachment)return n``;let e=this.name,t=this.attachment.Size||this.attachment.size||0,r=this.attachment.uploading,i=this.attachment.progress||0,a=this.typeInfo(),o=!this.removable&&!!this.downloadUrl&&a.isPreviewable,s=a.isImage&&this.downloadUrl&&!this.imgError,c=n`
      ${r?n`<div class="progress-bar" style="width: ${i}%"></div>`:``}
      ${s?n`
        <div class="attachment-thumb">
          <img src="${this.downloadUrl}" alt="" loading="lazy" @error=${()=>{this.imgError=!0}} />
        </div>
      `:n`
        <div
          class="attachment-icon typed ${a.themeClass}"
          style="${a.color?`color: ${a.color}; background: color-mix(in srgb, ${a.color} 12%, transparent)`:``}"
        >${A(a.icon)}</div>
      `}
      <span class="attachment-name">${e}</span>
      ${this.attachment.missing?n`
        <span class="attachment-size missing">${this.i18nStore?.t(`attachment.addAgain`)}</span>
      `:n`
        <span class="attachment-size">${r?this.uploadProgress(i,t):pr(t)}</span>
      `}
      ${o?n`
        <button class="preview-btn" @click=${this._handlePreview} title="${this.i18nStore?.t(`attachment.preview`)}">
          ${A(`eye`)}
        </button>
      `:``}
      ${this.removable?n`
        <button class="remove-btn" @click=${this._handleRemove} title="${this.i18nStore?.t(`attachment.remove`)}">
          ${A(`x`)}
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
      `}};j([h({context:w})],$s.prototype,`i18nStore`,void 0),j([o({type:Object})],$s.prototype,`attachment`,void 0),j([o({type:String})],$s.prototype,`downloadUrl`,void 0),j([o({type:String})],$s.prototype,`fallbackName`,void 0),j([o({type:Boolean})],$s.prototype,`removable`,void 0),j([o({type:Boolean,reflect:!0})],$s.prototype,`compact`,void 0),j([a()],$s.prototype,`imgError`,void 0),$s=j([p(`alps-attachment-pill`)],$s);var ec=class extends d{constructor(...e){super(...e),this.attachments=[],this.mailbox=O,this.messageUid=``,this.removable=!1,this.composerMode=!1,this.attachmentsExpanded=!0,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}get resolvedMailbox(){if(this.mailbox)return this.mailbox;let e=window.location.hash.match(/^#\/mailbox\/([^/]+)/);return e?decodeURIComponent(e[1]):O}_openPreview(e){window.dispatchEvent(new CustomEvent(`open-attachment-preview`,{detail:{attachments:this.attachments,mailbox:this.resolvedMailbox,messageUid:this.messageUid,index:e}}))}toggleAttachments(){this.attachmentsExpanded=!this.attachmentsExpanded}_downloadAll(e){if(e.stopPropagation(),!this.attachments||this.attachments.length===0||!this.messageUid)return;let t=this.resolvedMailbox;this.attachments.forEach((e,n)=>{let r=Rs(t,this.messageUid,e);r&&setTimeout(()=>{let t=document.createElement(`a`);t.href=r,t.download=e.Filename||this.i18nStore?.t(`messageReader.unknownAttachment`)||`attachment`,document.body.appendChild(t),t.click(),document.body.removeChild(t)},n*200)})}static{this.styles=_`
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
                ${A(`downloadSimple`)}
              </div>
            `}
            <div class="icon caret">
              ${A(`caretDown`)}
            </div>
          </div>
        </div>
        <div class="attachments-wrapper ${this.attachmentsExpanded?`expanded`:``}">
          <div class="attachments-list">
            ${this.attachments.map((e,t)=>n`
                <alps-attachment-pill
                  .attachment=${e}
                  .downloadUrl=${this.messageUid?Rs(this.resolvedMailbox,this.messageUid,e):``}
                  .fallbackName=${this.i18nStore?.t(`messageReader.unknownAttachment`)}
                  .removable=${this.removable}
                  .compact=${this.composerMode}
                  @preview-attachment=${e=>{e.stopPropagation(),this._openPreview(t)}}
                ></alps-attachment-pill>
              `)}
          </div>
        </div>
      </div>
    `}};j([h({context:w})],ec.prototype,`i18nStore`,void 0),j([o({type:Array})],ec.prototype,`attachments`,void 0),j([o({type:String})],ec.prototype,`mailbox`,void 0),j([o({type:String})],ec.prototype,`messageUid`,void 0),j([o({type:Boolean})],ec.prototype,`removable`,void 0),j([o({type:Boolean,reflect:!0})],ec.prototype,`composerMode`,void 0),j([a()],ec.prototype,`attachmentsExpanded`,void 0),ec=j([p(`alps-attachment-list`)],ec);var tc=class extends d{constructor(...e){super(...e),this.mailboxes=[],this.currentMailbox=``,this.noActionBox=!1,this.noSearchBox=!1,this.filterQuery=``,this.isMove=!0}static{this.styles=_`
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
  `}_handleFilter(e){let t=e.target;this.filterQuery=t.value.toLowerCase()}_handleSelect(e){this.popup&&this.popup.close(),this.dispatchEvent(new CustomEvent(`folder-selected`,{detail:{folderName:e,isMove:this.isMove},bubbles:!0,composed:!0}))}_handlePopupToggle(){this.filterQuery=``,setTimeout(()=>{this.filterInput&&this.filterInput.focus()},50)}render(){let e=this.mailboxes.map(e=>e.Name||e.Mailbox||``).filter(e=>e!==``&&e!==this.currentMailbox).map(e=>({name:e,caption:dr(e,this.i18nStore,this.mailboxes)})).filter(({name:e,caption:t})=>e.toLowerCase().includes(this.filterQuery)||t.toLowerCase().includes(this.filterQuery));return n`
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
            ${e.length>0?e.map(({name:e,caption:t})=>n`
              <button class="folder-item" title=${e} @click=${()=>this._handleSelect(e)}>
                ${A(`folder`)}
                <span class="folder-name">${t}</span>
              </button>
            `):n`
              <div class="no-results">${this.i18nStore?.t(`folderSelector.noResults`)}</div>
            `}
          </div>
        </div>
      </alps-popup>
    `}};j([h({context:w})],tc.prototype,`i18nStore`,void 0),j([o({type:Array})],tc.prototype,`mailboxes`,void 0),j([o({type:String})],tc.prototype,`currentMailbox`,void 0),j([o({type:Boolean})],tc.prototype,`noActionBox`,void 0),j([o({type:Boolean})],tc.prototype,`noSearchBox`,void 0),j([a()],tc.prototype,`filterQuery`,void 0),j([a()],tc.prototype,`isMove`,void 0),j([g(`alps-popup`)],tc.prototype,`popup`,void 0),j([g(`input`)],tc.prototype,`filterInput`,void 0),tc=j([p(`alps-folder-selector-popup`)],tc);var nc=class extends d{constructor(...e){super(...e),this.verified=!1,this.failed=!1}static{this.styles=_`
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
        ${A(e===`verified`?`verifiedBadge`:`authFailedBadge`)}
      </span>
    `}};j([h({context:w})],nc.prototype,`i18nStore`,void 0),j([o({type:Boolean})],nc.prototype,`verified`,void 0),j([o({type:Boolean})],nc.prototype,`failed`,void 0),nc=j([p(`alps-sender-auth-badge`)],nc);var rc=`data-alps-quote`;function ic(e){return e?e.map(e=>$t(e.Name,`${e.Mailbox}@${e.Host}`)):[]}var ac=e=>`${e?.Mailbox??``}@${e?.Host??``}`.toLowerCase(),oc=e=>{let t=e.trim(),n=t.lastIndexOf(`<`);return(t.endsWith(`>`)&&n!==-1?t.slice(n+1,-1):t).trim().toLowerCase()};function sc(e,t,n,r,i,a=`YYYY-MM-DD`,o=`12`,s=[]){let c=t?.Envelope?.Subject||``,l=c;l=e===`forward`?l.toLowerCase().startsWith(`fwd:`)?l:`Fwd: ${l}`:l.toLowerCase().startsWith(`re:`)?l:`Re: ${l}`;let u=[],d=[];if(e===`reply`||e===`replyAll`){let n=t?.Envelope??{},r=new Set(s.filter(Boolean).map(oc)),i=new Set,a=e=>(e||[]).filter(e=>{let t=ac(e);return r.has(t)||i.has(t)?!1:(i.add(t),!0)}),o=n.ReplyTo?.length>0?n.ReplyTo:n.From,c=a(o);(e===`replyAll`||c.length===0)&&(c=[...c,...a(n.To)]);let l=e===`replyAll`?a(n.Cc):[];c.length===0&&([c,l]=[l,[]]),u=c.length>0?ic(c):ic(o),d=ic(l)}let f=t?.Envelope?.Date?ar(t.Envelope.Date,a,o):``,p=e=>Xt(Rt(`${e.Mailbox}@${e.Host}`)).text,m=t?.Envelope?.From?.[0],h=m?.Mailbox&&m?.Host?p(m):``,g=Rt(m?.Name||h||`Unknown Sender`),_=(t?.Envelope?.To||[]).map(e=>e.Name?`${Rt(e.Name)} <${p(e)}>`:p(e)).join(`, `),v=`On ${f}, ${g} wrote:`;e===`forward`&&(v=`---------- Forwarded message ---------\nFrom: ${g} <${h}>\nDate: ${f}\nSubject: ${c}\nTo: ${_}\n`);let y=`\n\n${v}\n`+n.split(`
`).map(e=>`> ${e}`).join(`
`),ee=Ho(g),te=Ho(h),b=Ho(c),ne=Ho(f),x=i&&r?Vo(r):``,re=Ho(n).replace(/\n/g,`<br>`),ie=so()(new DOMParser().parseFromString(x||re,`text/html`).body)??`ltr`,ae=ie===`rtl`?`margin:0px 0.8ex 0px 0px;border-right:1px solid rgb(204,204,204);padding-right:1ex`:`margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex`,oe=``;return oe=x?e===`forward`?`<br><br><div class="gmail_quote" ${rc} dir="auto"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>From: ${ee} &lt;${te}&gt;<br>Date: ${ne}<br>Subject: ${b}<br>To: ${Ho(_)}<br></div><br>${x}</div>`:`<br><br><div class="gmail_quote" ${rc} dir="auto"><div dir="ltr" class="gmail_attr">On ${ne}, ${ee} wrote:<br></div><blockquote class="gmail_quote" dir="${ie}" style="${ae}">${x}</blockquote></div>`:`<br><br><div class="gmail_quote" dir="auto"><div dir="ltr" class="gmail_attr">${Ho(v).replace(/\n/g,`<br>`)}<br></div><blockquote class="gmail_quote" dir="${ie}" style="${ae}">${re}</blockquote></div>`,{subject:l,to:u,cc:d,quotedText:y,quotedHtml:oe}}var cc=`alps_last_active`,lc=3e3;function uc(e){try{return window.localStorage.getItem(e)}catch{return null}}function dc(e,t){try{window.localStorage.setItem(e,t)}catch{}}function fc(e){try{window.localStorage.removeItem(e)}catch{}}var pc=new class{constructor(){this.events=[`mousedown`,`mousemove`,`keydown`,`scroll`,`touchstart`,`wheel`,`pointerdown`,`pointermove`,`click`,`input`,`focusin`],this.logoutMinutes=0,this.lastActivity=Date.now(),this.lastSync=0,this.lastPing=Date.now(),this.checkInterval=null,this.recordActivity=()=>{let e=Date.now();this.lastActivity=e,!(window.location.hash===`#/login`||window.location.hash===``)&&e-this.lastSync>=lc&&(this.lastSync=e,dc(cc,String(e)))},this.handleActivity=()=>{this.recordActivity()},this.handleStorage=e=>{if(e.key===cc&&e.newValue){let t=Number(e.newValue);Number.isFinite(t)&&t>this.lastActivity&&(this.lastActivity=t)}}}setLogoutTime(e){let t=this.logoutMinutes>0;this.logoutMinutes=e;let n=this.logoutMinutes>0;n&&!t?(this.attachEvents(),this.startInterval()):!n&&t?(this.detachEvents(),this.clearInterval()):n&&t&&this.recordActivity()}attachEvents(){this.lastSync=0,this.events.forEach(e=>{document.addEventListener(e,this.handleActivity,{capture:!0,passive:!0})}),window.addEventListener(`storage`,this.handleStorage),this.recordActivity()}detachEvents(){this.lastSync=0,this.events.forEach(e=>{document.removeEventListener(e,this.handleActivity,{capture:!0})}),window.removeEventListener(`storage`,this.handleStorage)}trackIframe(e){try{let t=e.contentDocument;if(!t)return;this.events.forEach(e=>{t.addEventListener(e,this.handleActivity,{capture:!0,passive:!0})})}catch{}}startInterval(){this.clearInterval(),this.checkInterval=setInterval(()=>this.checkTimeout(),3e4)}clearInterval(){this.checkInterval&&=(clearInterval(this.checkInterval),null)}checkTimeout(){if(this.logoutMinutes<=0)return;if(window.location.hash===`#/login`||window.location.hash===``){this.recordActivity();return}let e=this.lastActivity,t=Number(uc(cc));Number.isFinite(t)&&t>e&&(e=t,this.lastActivity=t);let n=Date.now()-e;n>=this.logoutMinutes*60*1e3?this.logout():n<300*1e3&&Date.now()-this.lastPing>300*1e3&&this.pingBackend()}async pingBackend(){this.lastPing=Date.now();try{await fetch(`/session`)}catch{}}rearm(){this.lastActivity=Date.now(),this.lastPing=Date.now(),this.lastSync=0,this.logoutMinutes>0&&(this.attachEvents(),this.startInterval())}async logout(){this.clearInterval(),this.detachEvents();let e=!1;if(this.onBeforeLogout)try{await this.onBeforeLogout()}catch(t){t instanceof Uo?(t.keepRecoveryCopy(),e=!0):S.error(`Failed to run onBeforeLogout hook`,t)}try{fc(cc),ns(e?`inactivitySignedOutDraftsKept`:`inactivitySignedOut`),as();try{await fetch(`/session`,{method:`DELETE`})}catch(e){S.error(`Sign-out request failed; ending the session locally anyway`,e)}ki.clear(),Ge(),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`}catch(e){S.error(`Failed to auto sign out`,e)}finally{this.rearm()}}};function mc(e,t){if(!e.contentDocument||!e.contentDocument.body)return;let n=e.contentDocument.getElementById(`dark-mode-override`);n&&n.remove();let r=t&&document.body.classList.contains(`theme-dark`);if(Po(e.contentDocument,r?`dark`:`light`),r){let t=window.getComputedStyle(document.documentElement).getPropertyValue(`--bg-primary`).trim()||`#1f2937`,n=window.getComputedStyle(document.documentElement).getPropertyValue(`--text-primary`).trim()||`#f9fafb`,r=window.getComputedStyle(document.documentElement).getPropertyValue(`--accent-color`).trim()||`#3b82f6`,i=window.getComputedStyle(document.documentElement).getPropertyValue(`--border-color`).trim()||`#374151`,a=e.contentDocument.createElement(`style`);a.id=`dark-mode-override`,a.textContent=`
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
    `,e.contentDocument.head.appendChild(a)}}function hc(e,t){if(!e.contentDocument||!e.contentDocument.body)return;e.style.width=`100%`,e.contentDocument.addEventListener(`dragover`,e=>e.preventDefault()),e.contentDocument.addEventListener(`drop`,e=>e.preventDefault()),pc.trackIframe(e),mc(e,t),e._ro&&e._ro.disconnect();let n=e.contentDocument,r=()=>{if(!e.contentDocument)return;let t=e.contentDocument.documentElement,n=e.contentDocument.body,r=Math.max(t?.scrollHeight||0,n?.scrollHeight||0);if(r>0){let t=parseFloat(e.style.height)||0;Math.abs(t-r)>2&&(e.style.height=`${Math.ceil(r)}px`)}};r();let i=new ResizeObserver(()=>r());i.observe(n.body),i.observe(n.documentElement),e._ro=i}function gc(e){if(!e)return``;let t=new DOMParser().parseFromString(e,`text/html`);t.querySelectorAll(`script, style, noscript, head, template`).forEach(e=>e.remove());let n=new Set([`p`,`div`,`br`,`tr`,`li`,`h1`,`h2`,`h3`,`h4`,`h5`,`h6`,`blockquote`,`section`,`article`,`header`,`footer`,`pre`,`table`,`ul`,`ol`]),r=``,i=e=>{for(let t of Array.from(e.childNodes))if(t.nodeType===Node.TEXT_NODE)r+=t.textContent||``;else if(t.nodeType===Node.ELEMENT_NODE){let e=t,a=e.tagName.toLowerCase();if(a===`br`){r+=`
`;continue}i(e),n.has(a)&&(r+=`
`)}};return t.body&&i(t.body),r.replace(/\n{3,}/g,`

`).trim()}function _c(e,t,n,r){if(!e)return n||r;let i=e;if(t?.toLowerCase()===`text/html`||e.trim().startsWith(`<`)||/<\/[a-zA-Z]+>/.test(e)||/<[a-zA-Z]+[^>]*>/.test(e))try{let t=new DOMParser().parseFromString(e,`text/html`);t.querySelectorAll(`style, script, head`).forEach(e=>e.remove());let n=e=>{if(e.nodeType===Node.TEXT_NODE)return e.textContent||``;if(e.nodeType===Node.ELEMENT_NODE){let t=e,r=t.tagName.toLowerCase();if(r===`br`)return` `;let i=``;for(let e=0;e<t.childNodes.length;e++)i+=n(t.childNodes[e]);return[`p`,`div`,`td`,`tr`,`th`,`li`,`h1`,`h2`,`h3`,`h4`,`h5`,`h6`,`section`,`article`,`blockquote`,`ol`,`ul`,`header`,`footer`].includes(r)?` `+i+` `:i}return``};i=n(t.body||t)}catch{i=e.replace(/<[^>]*>/g,` `)}else i=e.replace(/[\r\n\t]+/g,` `);let a=i.replace(/\s+/g,` `).trim();if(a){let e=a.substring(0,100);return a.length>100?e+`...`:e}else if(n)return n.replace(/[\r\n\t\s]+/g,` `).trim();else return r}var vc=class extends d{constructor(...e){super(...e),this.showSenderAvatars=!0,this.canToggleRead=!1}static{this.styles=[nn,_`
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

    .reader-load-error {
      padding: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--text-muted);
      text-align: center;
    }

    .reader-text-wrapper {
      border: none;
      border-radius: 0;
      padding: 16px;
      background: transparent;
      overflow-x: auto;
    }

    /* Each paragraph of a plain-text body runs the way its first letter
       does, as in the reader. */
    .reader-preformatted {
      margin: 0;
      white-space: pre-wrap;
      unicode-bidi: plaintext;
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
  `]}onIframeLoad(e){let t=e.target;hc(t,this.settingsStore?.getState()?.themeIframeContent??!1)}handleCardHeaderClick(){this.dispatchEvent(new CustomEvent(`toggle-expansion`,{detail:{item:this.item},bubbles:!0,composed:!0}))}_closePopup(){let e=this.shadowRoot?.querySelectorAll(`alps-popup`);e&&e.forEach(e=>e.close())}handleStarClick(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-star`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleActionForItem(e){this._closePopup(),this.dispatchEvent(new CustomEvent(`action-for-item`,{detail:{action:e,item:this.item},bubbles:!0,composed:!0}))}handleDeleteItem(){this._closePopup(),this.dispatchEvent(new CustomEvent(`delete-item`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleRetryBody(){this.dispatchEvent(new CustomEvent(`retry-body`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleLoadRemoteResources(){this.dispatchEvent(new CustomEvent(`load-remote-resources`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleEditDraftClick(){this.dispatchEvent(new CustomEvent(`edit-draft-for-item`,{detail:{item:this.item},bubbles:!0,composed:!0}))}renderItemContent(){if(this.item.loading)return n`
        <div style="padding: 16px; display: flex; justify-content: center; align-items: center;">
          <alps-loader></alps-loader>
        </div>
      `;let e=this.item.message||{},t=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,r=String(this.settingsStore?.getState()?.hourFormat||`12`),i=e.Envelope?.Date?ar(e.Envelope.Date,t,r):``;return n`
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
            <!-- The menu's Delete is the same gesture. This is where a draft is
                 looked at, and Edit Draft alone left no way to drop one in sight. -->
            <alps-button slot="action" variant="normal" @click=${()=>this.handleDeleteItem()}>${this.i18nStore?.t(`messageReader.discardDraft`)}</alps-button>
          </alps-banner>
        `:``}
        
        <div class="reader-content-wrapper">
          ${this.item.loadFailed?n`
            <div class="reader-load-error">
              <div>${this.i18nStore?.t(`messageReader.loadError`)}</div>
              <alps-button variant="normal" @click=${this.handleRetryBody}>
                ${this.i18nStore?.t(`messageReader.loadErrorRetry`)}
              </alps-button>
            </div>
          `:this.item.mimeType?.toLowerCase()===`text/html`?n`
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
              <pre dir="auto" class="reader-preformatted">${this.item.content}</pre>
            </div>
          `}
        </div>
      </div>
    `}render(){let e=this.item.message||{},t=e.Envelope?.From?.[0]||{},r=t.Mailbox&&t.Host?`${t.Mailbox}@${t.Host}`:``,i=t.Name||r||this.i18nStore?.t(`messageList.unknownSender`),a=!!(r&&t.Name?.trim()&&t.Name.trim()!==r),o=a?`${t.Name} <${r}>`:r||i,s=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,c=String(this.settingsStore?.getState()?.hourFormat||`12`),l=e.Envelope?.Date?ar(e.Envelope.Date,s,c):``,u=_r(e,t),d=e.Flags?.includes(V),f=!e.Flags?.includes(B),p=e.Snippet||``,m=window.innerWidth<=768?``:this.i18nStore?.t(`messageReader.clickToExpand`)||`Click to expand message content`,h=this.item.expanded?``:_c(this.item.content,this.item.mimeType,p,m);return n`
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
                <span class="thread-card-sender-name" dir="auto">${a||!r?i:tn(r)}</span>
                <alps-sender-auth-badge ?verified=${!!e.HasBimiPotential} ?failed=${!!e.HasBimiFailed}></alps-sender-auth-badge>
              </div>
              ${a?n`<span class="thread-card-sender-address">${tn(r)}</span>`:``}
              <!-- On a line of its own, where the address's ellipsis cannot cut it off. -->
              ${on(r,this.i18nStore)}
            </div>
            ${this.item.expanded?``:n`<div class="thread-card-snippet" dir="auto">${h}</div>`}
          </div>
          <div class="thread-card-meta">
            ${this.item.isSent?n`<span class="thread-card-badge">${this.i18nStore?.t(`folderList.sent`)||`Sent`}</span>`:``}
            ${this.item.mailbox!==this.mailbox&&!this.item.isSent?n`<span class="thread-card-badge">${this.item.mailbox}</span>`:``}
            <div class="thread-card-date">${l}</div>
            
            <alps-icon-btn
              title=${this.i18nStore?.t(`messageReader.star`)||`Star`}
              ?active=${d}
              @click=${this.handleStarClick}
              icon=${d?`starFourFill`:`starFour`}
            ></alps-icon-btn>
            
            ${this.item.expanded?n`
              <alps-icon-btn
                title=${this.i18nStore?.t(`messageReader.reply`)||`Reply`}
                @click=${e=>{e.stopPropagation(),this.handleActionForItem(`reply`)}}
                icon="arrowBendUpLeft"
              ></alps-icon-btn>
              
              <alps-popup align="right" class="card-more-menu" @click=${e=>e.stopPropagation()}>
                <alps-icon-btn
                  slot="trigger"
                  title=${this.i18nStore?.t(`messageReader.moreOptions`)}
                  icon="dotsThreeVertical"
                ></alps-icon-btn>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`reply`)}>
                  ${A(`arrowBendUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reply`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`replyAll`)}>
                  ${A(`arrowBendDoubleUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.replyAll`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`forward`)}>
                  ${A(`arrowBendUpRight`)} <span class="item-text">${this.i18nStore?.t(`messageReader.forward`)}</span>
                </button>
                <div class="dropdown-divider"></div>
                <!-- Everything below is about THIS message. Over a conversation
                     the toolbar acts on all of it, so these live here. -->
                ${this.canToggleRead?n`
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(f?`markRead`:`markUnread`)}>
                  ${A(f?`envelopeOpen`:`envelopeUnread`)} <span class="item-text">${this.i18nStore?.t(f?`messageReader.markRead`:`messageReader.markUnread`)}</span>
                </button>
                `:``}
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`print`)}>
                  ${A(`printer`)} <span class="item-text">${this.i18nStore?.t(`messageReader.print`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`downloadMessage`)}>
                  ${A(`downloadSimple`)} <span class="item-text">${this.i18nStore?.t(`messageReader.downloadMessage`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`showOriginal`)}>
                  ${A(`codeBlock`)} <span class="item-text">${this.i18nStore?.t(`messageReader.showOriginal`)}</span>
                </button>
                <div class="dropdown-divider"></div>
                <!-- Named for what it does to a draft, as the toolbar's is. -->
                <button class="dropdown-item" @click=${()=>this.handleDeleteItem()}>
                  ${A(`trash`)} <span class="item-text">${this.i18nStore?.t(e.Flags?.includes(`\\Draft`)?`messageReader.discardDraft`:`messageReader.delete`)}</span>
                </button>
              </alps-popup>
            `:``}
            
            <alps-icon-btn
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
    `}};j([h({context:T})],vc.prototype,`settingsStore`,void 0),j([h({context:w})],vc.prototype,`i18nStore`,void 0),j([h({context:es})],vc.prototype,`composeStore`,void 0),j([o({type:Object})],vc.prototype,`item`,void 0),j([o({type:String})],vc.prototype,`mailbox`,void 0),j([o({type:Boolean})],vc.prototype,`showSenderAvatars`,void 0),j([o({type:Boolean})],vc.prototype,`canToggleRead`,void 0),vc=j([p(`alps-thread-card`)],vc);function yc(e){return!!e?.Flags?.includes(qi)}var bc=10,K=class extends d{constructor(...e){super(...e),this.localPreferredView=null,this.hasHtml=!1,this.hasText=!1,this.mailbox=O,this.message=null,this.messages=[],this.selectedKeys=new Set,this.selectedCount=0,this.allSelectedStarred=!1,this.allSelectedUnread=!1,this.commonTags=[],this.bulkProcessing=!1,this.layoutMode=`vertical`,this.mailboxes=[],this.content=``,this.mimeType=``,this.loading=!1,this.loadFailed=!1,this.activeBanners=[],this.attachments=[],this.allowRemoteResources=!1,this.hasRemoteResources=!1,this.rawMessageHtml=``,this.isScrolled=!1,this.threadItems=[],this._isThread=!1,this._deferPropertySync=!1,this._conversation=null,this.scrolledToKey=null,this.scrollTimer=null,this.readDueAt=new Map,this.readTimer=null,this._handleDraftDiscarded=e=>{let t=e.detail;if(!t?.mailbox||!t.uid||!this.message)return;let n=R(t.mailbox,t.uid);this.threadItems.some(e=>this.itemKey(e)===n)&&this.dropCard(n),this.keyOf(this.message)===n&&this.dispatchEvent(new CustomEvent(`close`))},this._handleExternalFlagsChanged=e=>{let t=e;if(!t.detail)return;let{keys:n,flag:r,action:i}=t.detail;if(!this.threadItems||this.threadItems.length===0)return;let a=new Set(n),o=!1;for(let e=0;e<this.threadItems.length;e++){let t=this.threadItems[e];if(t.message&&a.has(this.itemKey(t))){let n=t.message.Flags||[],a=n.includes(r);i===`add`&&!a?(this.threadItems[e]={...t,message:{...t.message,Flags:[...n,r]}},o=!0):i===`remove`&&a&&(this.threadItems[e]={...t,message:{...t.message,Flags:n.filter(e=>e!==r)}},o=!0)}}if(o&&(this.threadItems=[...this.threadItems],this.requestUpdate(),this.message&&a.has(this.keyOf(this.message)))){let e=this.message.Flags?.includes(r);i===`add`&&!e?this.message.Flags=[...this.message.Flags||[],r]:i===`remove`&&e&&(this.message.Flags=this.message.Flags.filter(e=>e!==r)),this.message={...this.message}}},this.prefetchQueue=[],this.prefetching=!1,this.bodyReads=new Map,this.bodyLoads=new Map,this._handleSettingsChange=()=>{this.applyThemeToAllIframes()},this.handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0}}ownAddresses(){let e=this.settingsStore?.getState();return[Ue(e)||He()||``,e?.replyTo||``].filter(Boolean)}_closePopup(){let e=this.shadowRoot?.querySelectorAll(`alps-popup`);e&&e.forEach(e=>e.close())}async _handleAction(e,t){if(e===`reply`||e===`replyAll`||e===`forward`){if(!this.message)return;this._closePopup();let t=this.keyOf(this.message);if(this.bodyLoads.has(t)&&(await this.loadedItem(t),!this.message||this.keyOf(this.message)!==t))return;let n=``;this.mimeType===`text/plain`?n=this.content:this.rawMessageHtml&&(n=gc(this.rawMessageHtml));let r=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,i=String(this.settingsStore?.getState()?.hourFormat||`12`),{subject:a,to:o,cc:s,quotedText:c,quotedHtml:l}=sc(e,this.message,n,this.rawMessageHtml,this.hasHtml,r,i,this.ownAddresses()),u=e===`forward`?this.attachments.map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})):[],d=[...u,...Ta(this.message.BodyStructure).filter(e=>!u.some(t=>t.partPath===e.partPath))],f=e===`reply`||e===`replyAll`?Ea(this.message,this.message.Mailbox||this.mailbox):{};this.composeStore.openComposer({subject:a,to:o,cc:s,text:c,html:l,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:d,quoteSource:{mailbox:this.message.Mailbox||this.mailbox,uid:String(this.message.UID),structure:this.message.BodyStructure},...f});return}if(e===`showPlaintext`||e===`showHtml`){this.localPreferredView=e===`showPlaintext`?`text`:`html`,this._closePopup(),await Promise.all(this.threadItems.filter(e=>e.content||e.loading||e.loadFailed).map(e=>this.fetchItemBody(e)));return}if(e===`print`){let e=this.allowRemoteResources?`&remote=1`:``;window.open(`#/print?mailbox=`+encodeURIComponent(this.mailboxOfMessage(this.message))+`&uid=`+this.message.UID+e,`_blank`),this._closePopup();return}if(this._closePopup(),this.toolbarIsConversation)if(e===`markUnread`){let e=this.unreadKeys;if(e.length>0)return void this.markMembersRead(e)}else{this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,folder:t,uids:this.conversationUids}}));return}this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,folder:t}}))}get openIsUnsent(){return this.message?yc(this.message)||Wn(this.mailbox||``,this.mailboxes)===`drafts`:!1}get toolbarIsConversation(){return!(this.selectedCount>0)&&this.threadItems.length>1&&!this.openIsUnsent&&this.conversationItems.length>0}get conversationItems(){return this.threadItems.filter(e=>e.message&&e.mailbox===this.mailbox)}get conversationUids(){return this.conversationItems.map(e=>String(e.message.UID))}get unreadKeys(){return this.threadItems.filter(e=>e.message&&!e.message.Flags?.includes(`\\Seen`)&&!yc(e.message)).map(e=>this.itemKey(e))}get readToggleMarksRead(){return this.selectedCount>0?this.allSelectedUnread:this.toolbarIsConversation?this.unreadKeys.length>0:!this.message?.Flags?.includes(B)}hasTag(e){let t=e.toLowerCase(),n=e=>!!e?.some(e=>e.toLowerCase()===t);if(this.selectedCount>0)return n(this.commonTags);if(this.toolbarIsConversation){let e=this.conversationItems;return e.length>0&&e.every(e=>n(e.message.Flags))}return n(this.message?.Flags)}_handleTag(e){this._closePopup();let t=this.toolbarIsConversation?this.conversationUids:void 0;this.dispatchEvent(new CustomEvent(`action`,{detail:{action:this.hasTag(e)?`removeTag`:`addTag`,folder:e,uids:t}}))}_handleRemoveAllTags(){this._closePopup();let e=this.selectedCount>0,t;if(e){let e=new Set;for(let t of this.messages)for(let n of[t,...t.SubMessages||[]])if(this.selectedKeys.has(this.keyOf(n)))for(let t of oa(n.Flags))e.add(t);t=[...e]}else if(this.toolbarIsConversation){let e=new Set;for(let t of this.conversationItems)for(let n of oa(t.message.Flags))e.add(n);t=[...e]}else t=oa(this.message?.Flags);if(t.length===0)return;let n=!e&&this.toolbarIsConversation?this.conversationUids:void 0;this.dispatchEvent(new CustomEvent(`action`,{detail:{action:`removeTag`,tags:t,uids:n}}))}keyOf(e){return R(this.mailboxOfMessage(e),e?.UID)}mailboxOfMessage(e){return Mi(e,this.mailbox)}itemKey(e){return R(e.mailbox,e.message?.UID)}isOpenItem(e){return!!this.message&&this.itemKey(e)===this.keyOf(this.message)}listedKeys(){let e=new Set;for(let t of this.messages||[]){e.add(this.keyOf(t));for(let n of t.SubMessages||[])e.add(this.keyOf(n))}return e}cardId(e){return`thread-card-${encodeURIComponent(e.mailbox)}-${e.message?.UID}`}connectedCallback(){super.connectedCallback(),window.addEventListener(`external-message-flags-changed`,this._handleExternalFlagsChanged),window.addEventListener(`draft-discarded`,this._handleDraftDiscarded),this.updateComplete.then(()=>{this.isConnected&&this.settingsStore?.addEventListener(`change`,this._handleSettingsChange)})}disconnectedCallback(){this.settingsStore?.removeEventListener(`change`,this._handleSettingsChange),window.removeEventListener(`external-message-flags-changed`,this._handleExternalFlagsChanged),this.readDueAt.clear(),this.prefetchQueue=[],this.readTimer&&clearTimeout(this.readTimer),this.readTimer=null,this.scrollTimer&&clearTimeout(this.scrollTimer),this.scrollTimer=null,window.removeEventListener(`draft-discarded`,this._handleDraftDiscarded),super.disconnectedCallback()}static{this.styles=[Nr,_`
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
      font-family: var(--font-heading);
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

    .reader-recipients-list alps-recipient-pill:not(:last-child)::after {
      content: ", ";
      color: var(--text-color);
      white-space: pre;
    }

    .reader-date {
      font-family: var(--font-label);
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
      font-family: var(--font-label);
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

    /* Decoration, drawn as alps-icon-btn draws its icon, without the button. */
    .selection-icon {
      display: flex;
      padding: 6px;
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

    .reader-load-error {
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--text-muted);
      text-align: center;
    }

    /* A plain-text body has no markup to say which way it runs. Each
       paragraph takes the direction of its own first letter, so a Hebrew or
       Arabic line reads right to left beside English ones. */
    .reader-preformatted {
      white-space: pre-wrap;
      unicode-bidi: plaintext;
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
  `]}updated(e){if(!e.has(`message`))return;if(!this.message){this.scrolledToKey=null;return}let t=this.keyOf(this.message);t!==this.scrolledToKey&&(this.scrolledToKey=t,this.scrollToCard(t))}scrollToCard(e){this.scrollTimer&&clearTimeout(this.scrollTimer),this.scrollTimer=setTimeout(()=>{this.scrollTimer=null;let t=this.threadItems.find(t=>this.itemKey(t)===e),n=t?this.shadowRoot?.getElementById(this.cardId(t)):null;n&&n.scrollIntoView({behavior:`smooth`,block:`start`})},50)}willUpdate(e){let t=e.has(`message`),n=e.has(`mailbox`),r=e.has(`messages`);if(t||n){let t=e.get(`message`),n=e.has(`mailbox`)?e.get(`mailbox`):this.mailbox;this.message?!t||this.keyOf(t)!==this.keyOf(this.message)||n!==this.mailbox?(this.localPreferredView=null,this.fetchMessageBody(this.message,this.message._isAutosaveUpdate)):(t&&(t.HasBimiPotential&&!this.message.HasBimiPotential&&(this.message={...this.message,HasBimiPotential:!0}),t.HasBimiFailed&&!this.message.HasBimiFailed&&(this.message={...this.message,HasBimiFailed:!0})),this.resolveThread(this.message),this.message._isAutosaveUpdate&&t&&this.message!==t&&this.fetchMessageBody(this.message,!0)):(this.localPreferredView=null,this.content=``,this.mimeType=``,this.rawMessageHtml=``,this.loading=!1,this.loadFailed=!1,this.allowRemoteResources=!1,this.hasRemoteResources=!1,this.hasHtml=!1,this.hasText=!1,this.activeBanners=[],this.threadItems=[])}else r&&this.message&&this.resolveThread(this.message);this.syncReadTimers()}syncReadTimers(){let e=this.settingsStore?.getState()?.markReadTimeout??0,t=this.selectedCount>0,n=new Set;if(e>=0&&this.threadItems.length>1&&!t)for(let e of this.threadItems)!e.message||!e.expanded||this.isOpenItem(e)||e.message.Flags?.includes(`\\Seen`)||yc(e.message)||n.add(this.itemKey(e));let r=!1;for(let e of[...this.readDueAt.keys()])n.has(e)||(r=this.readDueAt.delete(e)||r);for(let t of n)this.readDueAt.has(t)||(this.readDueAt.set(t,Date.now()+e*1e3),r=!0);r&&this.armReadTimer()}armReadTimer(){if(this.readTimer&&clearTimeout(this.readTimer),this.readTimer=null,this.readDueAt.size===0)return;let e=Math.max(0,Math.min(...this.readDueAt.values())-Date.now());this.readTimer=setTimeout(()=>this.flushReadDue(),e)}flushReadDue(){this.readTimer=null;let e=Date.now(),t=[...this.readDueAt].filter(([,t])=>t<=e).map(([e])=>e);for(let e of t)this.readDueAt.delete(e);let n=t.filter(e=>{let t=this.threadItems.find(t=>this.itemKey(t)===e);return!!t&&t.expanded&&!t.message?.Flags?.includes(`\\Seen`)});n.length>0&&this.markMembersRead(n),this.armReadTimer()}patchMemberFlag(e,t,n){let r=e=>{let r=e?.Flags||[],i=r.includes(t);return n===`add`===i?e:{...e,Flags:n===`add`?[...r,t]:r.filter(e=>e!==t)}},i=this.threadItems.findIndex(t=>this.itemKey(t)===e);if(i!==-1){let e=this.threadItems[i],t=r(e.message);t!==e.message&&(this.threadItems[i]={...e,message:t},this.threadItems=[...this.threadItems])}this._conversation&&={...this._conversation,messages:this._conversation.messages.map(t=>this.keyOf(t)===e?r(t):t)},this.message&&this.keyOf(this.message)===e&&(this.message.Flags=r(this.message).Flags,this.requestUpdate())}async markMembersRead(e){let t=new Set(e),n=new Map;for(let e of this.threadItems){if(!e.message||!t.has(this.itemKey(e)))continue;let r=n.get(e.mailbox)??[];r.push(String(e.message.UID)),n.set(e.mailbox,r)}let r=this.listedKeys(),i=(e,t,n)=>{for(let i of t){let t=R(e,i);r.has(t)&&this.isConnected&&this.dispatchEvent(new CustomEvent(`message-flags-changed`,{detail:{uid:i,mailbox:e,flag:B,action:n},bubbles:!0,composed:!0})),this.patchMemberFlag(t,B,n)}};await Promise.all([...n].map(async([e,t])=>{i(e,t,`add`);let n=!1;try{n=(await H.setFlag(e,t,[B],`add`)).ok}catch(e){S.error(`Failed to mark conversation messages read`,e)}n||i(e,t,`remove`)}))}expandUnreadOnOpen(){if(this.openIsUnsent)return;let e=this.threadItems.filter(e=>e.message&&!e.message.Flags?.includes(`\\Seen`)&&!yc(e.message)),t=!1;for(let n of e.slice(0,bc))n.expanded||(n.expanded=!0,t=!0,!n.content&&!n.loading&&(n.loading=!0,this.queueItemBody(n)));return t&&(this.threadItems=[...this.threadItems]),e[0]?this.itemKey(e[0]):void 0}settleOpenedConversation(){if(!this.message||this.threadItems.length<2)return;let e=this.expandUnreadOnOpen();e&&e!==this.keyOf(this.message)&&this.scrollToCard(e)}loadRemoteResources(){if(this.allowRemoteResources=!0,this.message&&this.rawMessageHtml){this.hasRemoteResources=!1,this.content=Lo(this.rawMessageHtml,{mailbox:this.mailboxOfMessage(this.message),messageUid:this.message.UID,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}});let e=this.threadItems.find(e=>this.isOpenItem(e));e&&(e.allowRemoteResources=!0,e.content=this.content,e.hasRemoteResources=this.hasRemoteResources,this.updateThreadItemReference(e))}}resolveThread(e){if(!e)return;let t=this.settingsStore?.getState()?.enableThreading??!0,n=[],r=null;if(t&&this.messages&&this.messages.length>0){let t=this.messages.find(t=>this.keyOf(t)===this.keyOf(e));if(t)r=t;else for(let t of this.messages)if(t.SubMessages&&t.SubMessages.find(t=>this.keyOf(t)===this.keyOf(e))){r=t;break}}if(r?(n=[r,...r.SubMessages||[]],n.sort((e,t)=>(e.Envelope?.Date?new Date(e.Envelope.Date).getTime():0)-(t.Envelope?.Date?new Date(t.Envelope.Date).getTime():0))):n=(t&&this.threadItems.length>1&&this.threadItems.some(t=>this.itemKey(t)===this.keyOf(e))?this.threadItems.map(e=>({...e.message,Mailbox:e.mailbox})):null)??[e],t&&this._conversation?.key===this.keyOf(e)){let e=new Set(n.map(e=>this.keyOf(e))),t=this._conversation.messages.filter(t=>!e.has(this.keyOf(t)));t.length>0&&(n=[...n,...t],n.sort((e,t)=>(e.Envelope?.Date?new Date(e.Envelope.Date).getTime():0)-(t.Envelope?.Date?new Date(t.Envelope.Date).getTime():0)))}this._isThread=t&&n.length>1;let i=this.getSentMailboxName(),a=this.threadItems||[];this.threadItems=n.map(t=>{let n=this.keyOf(t)===this.keyOf(e),r=a.find(e=>this.itemKey(e)===this.keyOf(t));if(r){let e={...t,Flags:t.Flags||r.message.Flags||[]};return r.message.HasBimiPotential&&(e.HasBimiPotential=!0),r.message.HasBimiFailed&&(e.HasBimiFailed=!0),{...r,message:e}}return{message:t,content:``,mimeType:``,loading:!1,attachments:[],rawMessageHtml:``,hasHtml:!1,hasText:!1,activeBanners:[],allowRemoteResources:this.allowRemoteResources,hasRemoteResources:!1,isSent:(this.mailbox||``).toLowerCase()===i.toLowerCase()||(t.Mailbox||``).toLowerCase()===i.toLowerCase(),mailbox:t.Mailbox||this.mailbox,expanded:n}})}async fetchMessageBody(e,t=!1){e&&(e._isAutosaveUpdate=!1),this.message&&(this.message._isAutosaveUpdate=!1),t||(this.content=``,this.mimeType=``,this.rawMessageHtml=``,this.loading=!0,this.loadFailed=!1,this.activeBanners=[],this.allowRemoteResources=this.settingsStore?.getState().showRemoteContent===`always`,this.hasRemoteResources=!1,this.threadItems=[],this._conversation=null),this.resolveThread(e),this.prefetchQueue=[];let n=this.threadItems.find(t=>this.itemKey(t)===this.keyOf(e))||this.threadItems[0];if(n){n.loading=!t,n.expanded=!0,this._deferPropertySync=!1;let r=this.fetchItemBody(n);r.then(()=>{this.isConnected&&(!this.message||this.keyOf(this.message)!==this.keyOf(e)||this.requestUpdate())}),t||r.catch(()=>{}).then(()=>this.loadConversation(e));return}t||this.loadConversation(e)}queueItemBody(e){this.isConnected&&(this.prefetchQueue.push(e),this.drainPrefetch())}async drainPrefetch(){if(!this.prefetching){this.prefetching=!0;try{for(;this.prefetchQueue.length>0;){let e=this.prefetchQueue.shift();e.content||await this.fetchItemBody(e,!0)}}finally{this.prefetching=!1}}}async loadConversation(e,t=!0){if(!(this.settingsStore?.getState()?.enableThreading??!0)||!e?.UID)return;let n=this.keyOf(e),r=e.Mailbox||this.mailbox;try{let t=await D(`/mailboxes/${k(r)}/messages/${e.UID}/thread`);if(t.ok){let e=await t.json(),r=Array.isArray(e?.Messages)?e.Messages:[];if(!this.isConnected||!this.message||this.keyOf(this.message)!==n)return;this._conversation={key:n,messages:r},r.length>1&&(this.resolveThread(this.message),this.requestUpdate())}}catch(e){S.error(`Failed to load the conversation`,e)}t&&this.message&&this.keyOf(this.message)===n&&this.settleOpenedConversation()}liveFlags(e,t){let n=this.threadItems.find(t=>this.itemKey(t)===e)??t;if(!(!n.message||!(`Flags`in n.message)))return n.message.Flags??[]}updateThreadItemReference(e){if(!e.message||!this.isConnected)return;let t=this.threadItems.findIndex(t=>this.itemKey(t)===this.itemKey(e));t!==-1&&(this.threadItems[t]={...e},this.threadItems=[...this.threadItems])}async loadedItem(e){let t;for(;t=this.bodyLoads.get(e);)await t;return this.threadItems.find(t=>this.itemKey(t)===e)}readWaitingCard(e){if(this.bodyLoads.has(e))return;let t=this.threadItems.find(t=>this.itemKey(t)===e);!t?.loading||t.content||(this.prefetchQueue=this.prefetchQueue.filter(t=>this.itemKey(t)!==e),this.fetchItemBody(t))}async fetchItemBody(e,t=!1){if(!e.message)return;let n=e.message,r=e.mailbox,i=this.itemKey(e),a=(this.bodyReads.get(i)??0)+1;this.bodyReads.set(i,a);let o=()=>this.bodyReads.get(i)===a,s,c=new Promise(e=>{s=e});this.bodyLoads.set(i,c);let l=this.localPreferredView||this.settingsStore?.getState()?.preferredView||`html`,u=ki.generation();try{let a=ki.get(r,n.UID.toString(),l),s,c=!1;if(a)s=a;else{let e=t?wt:{},i=await D(`/mailboxes/${k(r)}/messages/${n.UID}?view=${l}`,e);if(!o())return;if(i.status===401){window.location.hash=`/login`;return}if(!i.ok)throw Error(`Failed to fetch metadata`);let a=await i.json();if(!o())return;let u,d,f=a.Part;if(f&&typeof a.Body==`string`)(f.MIMEType||f.MimeType||`text/plain`).toLowerCase()===`text/html`?u=a.Body:d=a.Body;else if(f){let t=Array.isArray(f.Path)?f.Path.join(`.`):f.Path,i=await D(`/mailboxes/${k(r)}/messages/${n.UID}/raw?part=${t}`,e).catch(e=>(S.error(`Failed to fetch message body:`,e),null));if(!o())return;if(i?.status===401){window.location.hash=`/login`;return}if(i?.ok){let e=await i.text();if(!o())return;(f.MIMEType||f.MimeType||`text/plain`).toLowerCase()===`text/html`?u=e:d=e}else i&&S.error(`Failed to fetch message body:`,i.status),c=!0}s={Message:a.Message,Part:a.Part,Attachments:a.Attachments,RawHtml:u,RawText:d,HasHTML:!!a.HasHTML,HasText:!!a.HasText}}let d=s.Message?{...n,...s.Message}:n,f=!!s.HasHTML,p=!!s.HasText,m=e.mimeType,h=e.content,g=e.rawMessageHtml,_=e.activeBanners,v=e.hasRemoteResources,y=t=>Lo(t,{mailbox:r,messageUid:d?.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:d?.BodyStructure,onRemoteResourceBlocked:()=>{v=!0}});if(s.Part&&!c){if(m=s.Part.MIMEType||s.Part.MimeType||`text/plain`,s.RawHtml!==void 0){v=!1;let e={content:s.RawHtml,isHtml:!0,message:d,mailbox:r,banners:[],i18nStore:this.i18nStore},t=await b.invokeHookAsync(`reader:content`,e);if(!o())return;g=s.RawHtml;for(let e of t)e&&typeof e==`string`&&(g=e);_=e.banners||[],h=y(g)}else if(s.RawText!==void 0){v=!1;let e={content:s.RawText,isHtml:!1,message:d,mailbox:r,banners:[],i18nStore:this.i18nStore},t=await b.invokeHookAsync(`reader:content`,e);if(!o())return;h=s.RawText;for(let e of t)e&&typeof e==`string`&&(h=e);_=e.banners||[],e.isHtml&&(m=`text/html`,f=!0,h=y(h))}}!a&&!c&&ki.generation()===u&&ki.set(r,n.UID.toString(),l,{...s,HasHTML:f,HasText:p}),e.attachments=s.Attachments||[],e.hasHtml=f,e.hasText=p,e.message={...d,Flags:this.liveFlags(i,e)??d.Flags},e.mimeType=m,e.content=h,e.rawMessageHtml=g,e.activeBanners=_,e.hasRemoteResources=v,e.loadFailed=c}catch(t){if(!o())return;S.error(`Failed to fetch message:`,t),e.loadFailed=!0}finally{this.bodyLoads.get(i)===c&&this.bodyLoads.delete(i),s(),o()&&(e.loading=!1,this.isConnected&&!this._deferPropertySync&&this.isOpenItem(e)&&(this.content=e.content,this.mimeType=e.mimeType,this.rawMessageHtml=e.rawMessageHtml,this.attachments=e.attachments,this.hasHtml=e.hasHtml,this.hasText=e.hasText,this.activeBanners=e.activeBanners,this.allowRemoteResources=e.allowRemoteResources,this.hasRemoteResources=e.hasRemoteResources,this.loadFailed=!!e.loadFailed,this.loading=!1,this.message={...this.message,...e.message}),this.updateThreadItemReference(e))}}getSentMailboxName(){if(this.mailboxes&&Array.isArray(this.mailboxes)){for(let e of this.mailboxes){let t=e.Name||e.Mailbox;if(t&&(e.Attrs||[]).some(e=>typeof e==`string`&&(e.toLowerCase()===`\\sent`||e.toLowerCase()===`\\\\sent`)))return t}let e=[`sent`,`sent messages`,`sent items`,`sent-mail`];for(let t of this.mailboxes){let n=t.Name||t.Mailbox;if(n&&e.includes(n.toLowerCase()))return n}}return Pn}async toggleItemExpansion(e){e.expanded=!e.expanded,this.updateThreadItemReference(e),e.expanded&&!e.content&&!e.loading&&(e.loading=!0,this.updateThreadItemReference(e),await this.fetchItemBody(e))}async retryItemBody(e){!e||e.loading||(e.loading=!0,e.loadFailed=!1,this.updateThreadItemReference(e),this.isOpenItem(e)&&(this.loading=!0,this.loadFailed=!1),await this.fetchItemBody(e))}loadRemoteResourcesForItem(e){e.allowRemoteResources=!0,e.message&&e.rawMessageHtml&&(e.hasRemoteResources=!1,e.content=Lo(e.rawMessageHtml,{mailbox:e.mailbox,messageUid:e.message.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:e.message.BodyStructure,onRemoteResourceBlocked:()=>{e.hasRemoteResources=!0}}),this.isOpenItem(e)&&(this.content=e.content,this.allowRemoteResources=!0,this.hasRemoteResources=e.hasRemoteResources),this.updateThreadItemReference(e))}async toggleItemStar(e){if(!e.message)return;let t=e.message.Flags?.includes(V),n=t?`remove`:`add`;t?e.message.Flags=e.message.Flags.filter(e=>e!==V):e.message.Flags=[...e.message.Flags||[],V],this.updateThreadItemReference(e);let r=this.listedKeys().has(this.itemKey(e)),i=t=>{r&&this.dispatchEvent(new CustomEvent(`message-flags-changed`,{detail:{uid:String(e.message.UID),mailbox:e.mailbox,flag:V,action:t},bubbles:!0,composed:!0}))};i(n);try{let{ok:r}=await H.setFlag(e.mailbox,[String(e.message.UID)],[V],n);r?this.isOpenItem(e)&&(this.message.Flags=e.message.Flags,this.requestUpdate()):(t?e.message.Flags=[...e.message.Flags||[],V]:e.message.Flags=e.message.Flags.filter(e=>e!==V),this.updateThreadItemReference(e),i(t?`add`:`remove`))}catch(n){S.error(`Failed to toggle star for thread item`,n),t?e.message.Flags=[...e.message.Flags||[],V]:e.message.Flags=e.message.Flags.filter(e=>e!==V),this.updateThreadItemReference(e),i(t?`add`:`remove`)}}deleteItem(e){if(!e.message)return;let t=this.itemKey(e),n=this.isOpenItem(e)?[...this.conversationItems].reverse().find(e=>this.itemKey(e)!==t):void 0;this.dispatchEvent(new CustomEvent(`action`,{detail:{action:`delete`,uid:String(e.message.UID),mailbox:e.mailbox,nextUid:n?String(n.message.UID):void 0,done:e=>{e&&this.dropCard(t)}}}))}dropCard(e){if(this.threadItems=this.threadItems.filter(t=>this.itemKey(t)!==e),this._conversation&&={...this._conversation,messages:this._conversation.messages.filter(t=>this.keyOf(t)!==e)},this.threadItems.length===1&&!this.threadItems[0].expanded){let e=this.threadItems[0];e.expanded=!0,!e.content&&!e.loading&&(e.loading=!0,this.fetchItemBody(e))}this._isThread=this.threadItems.length>1,this.requestUpdate()}reloadConversation(){this.message&&this.loadConversation(this.message,!1)}async _handleActionForItem(e,t){if(e===`reply`||e===`replyAll`||e===`forward`){let n=this.itemKey(t);if(this.readWaitingCard(n),this.bodyLoads.has(n)){let e=await this.loadedItem(n);if(!e)return;t=e}let r=``;t.mimeType===`text/plain`?r=t.content:t.rawMessageHtml&&(r=gc(t.rawMessageHtml));let i=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,a=String(this.settingsStore?.getState()?.hourFormat||`12`),{subject:o,to:s,cc:c,quotedText:l,quotedHtml:u}=sc(e,t.message,r,t.rawMessageHtml,t.hasHtml,i,a,this.ownAddresses()),d=e===`forward`?t.attachments.map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})):[],f=[...d,...Ta(t.message.BodyStructure).filter(e=>!d.some(t=>t.partPath===e.partPath))],p=e===`reply`||e===`replyAll`?Ea(t.message,t.mailbox):{};this.composeStore.openComposer({subject:o,to:s,cc:c,text:l,html:u,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:f,quoteSource:{mailbox:t.mailbox,uid:String(t.message.UID),structure:t.message.BodyStructure},...p});return}if(e===`markRead`)return void this.markMembersRead([this.itemKey(t)]);if(e===`markUnread`||e===`downloadMessage`||e===`showOriginal`){this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,uid:String(t.message.UID),mailbox:t.mailbox}}));return}if(e===`showPlaintext`){this.localPreferredView=`text`,this.fetchItemBody(t);return}if(e===`showHtml`){this.localPreferredView=`html`,this.fetchItemBody(t);return}if(e===`print`){let e=t.allowRemoteResources?`&remote=1`:``;window.open(`#/print?mailbox=`+encodeURIComponent(t.mailbox)+`&uid=`+t.message.UID+e,`_blank`);return}}applyThemeToIframe(e){mc(e,this.settingsStore?.getState()?.themeIframeContent??!1)}applyThemeToAllIframes(){let e=this.shadowRoot?.querySelectorAll(`iframe.reader-iframe`);e&&e.forEach(e=>this.applyThemeToIframe(e))}onIframeLoad(e){let t=e.target;hc(t,this.settingsStore?.getState()?.themeIframeContent??!1)}async _handleEditDraft(e){let t=e&&!(e instanceof Event),n=t?e.message:this.message,r=t?e.mailbox:this.mailboxOfMessage(n);if(!n)return;t&&e&&!e.content&&!e.loading&&(e.loading=!0,this.updateThreadItemReference(e),await this.fetchItemBody(e));let i=t?this.itemKey(e):this.keyOf(n);if(this.bodyLoads.has(i)){let n=await this.loadedItem(i);if(!n)return;if(t)e=n;else if(!this.message||this.keyOf(this.message)!==i)return}n=t?e.message:this.message;let a=t&&e?e.content:this.content,o=t&&e?e.mimeType:this.mimeType,s=t&&e?e.rawMessageHtml:this.rawMessageHtml,c=t&&e?e.attachments:this.attachments,l=``;l=o===`text/plain`?a:gc(s);let u=(c||[]).map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0}));this.composeStore.openComposer({draftUid:n.UID.toString(),draftMailbox:r,subject:n.Envelope?.Subject||``,to:ic(n.Envelope?.To),cc:ic(n.Envelope?.Cc),bcc:ic(n.Envelope?.Bcc),text:l,html:s,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:u,quoteSource:{mailbox:r,uid:n.UID.toString(),structure:n.BodyStructure},inReplyTo:n.Envelope?.InReplyTo||void 0,references:Array.isArray(n.References)&&n.References.length?n.References:void 0})}get showSenderAvatars(){return this.settingsStore?.getState()?.showSenderAvatars??!0}canToggleReadFor(e){return!e.message||e.isSent||yc(e.message)||Wn(this.mailbox||``,this.mailboxes)===`trash`?!1:(this.mailbox||``).toLowerCase()!==this.getSentMailboxName().toLowerCase()}get newestAnswerable(){return[...this.threadItems].reverse().find(e=>e.message&&!yc(e.message))}async answerNewest(e){let t=this.newestAnswerable;if(!t)return;let n=this.itemKey(t);!t.content&&!t.loading&&await this.fetchItemBody(t);let r=this.threadItems.find(e=>this.itemKey(e)===n)??t;await this._handleActionForItem(e,r)}renderConversationReply(){return!this.toolbarIsConversation||!this.newestAnswerable?``:n`
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
        @retry-body=${e=>this.retryItemBody(e.detail.item)}
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
      `;let r=this.localPreferredView||this.settingsStore?.getState()?.preferredView||`html`,i=this.message||{},a=ia(i.Flags,this.i18nStore),o=new Set([`$label1`,`$label2`,`$label3`,`$label4`,`$label5`]),s=e||!this.message?[]:oa(i.Flags).filter(e=>!o.has(e.toLowerCase())),c=i.Envelope?.From?.[0]||{},u=c.Mailbox&&c.Host?`${c.Mailbox}@${c.Host}`:``,d=c.Name||u||this.i18nStore?.t(`messageList.unknownSender`),p=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,m=String(this.settingsStore?.getState()?.hourFormat||`12`),h=i.Envelope?.Date?ar(i.Envelope.Date,p,m):``,g=_r(i,c),_=(this.mailbox||``).toLowerCase(),v=Wn(this.mailbox||``,this.mailboxes),y=v===`archive`,ee=v===`junk`,te=v===`trash`,b=v===`drafts`,ne=_===this.getSentMailboxName().toLowerCase(),x=this.toolbarIsConversation,re=this.readToggleMarksRead,ie=x?this.i18nStore?.t(`messageReader.deleteThread`):this.message?.Flags?.includes(`\\Draft`)||b?this.i18nStore?.t(`messageReader.discardDraft`):this.i18nStore?.t(`messageReader.delete`);return n`
      <alps-toolbar class="toolbar" ?scrolled=${this.isScrolled}>
        ${this.layoutMode===`full`?n`
          <alps-icon-btn @click=${()=>this.dispatchEvent(new CustomEvent(`close`))} title=${this.i18nStore?.t(`messageReader.back`)} icon="arrowLeft"></alps-icon-btn>
          <div class="toolbar-separator desktop-only"></div>
        `:``}
        
        <div class="toolbar-spacer mobile-spacer"></div>
        
        ${!y&&!te&&!b?n`
        <alps-icon-btn title=${this.i18nStore?.t(`messageReader.archive`)} @click=${()=>this._handleAction(`archive`)} icon="archiveBox"></alps-icon-btn>
        `:``}
        ${!ee&&!te&&!b&&!ne?n`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t(`messageReader.reportSpam`)} @click=${()=>this._handleAction(`reportSpam`)} icon="warningDiamond"></alps-icon-btn>
        `:``}
        ${ee?n`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t(`messageReader.notSpam`)} @click=${()=>this._handleAction(`notSpam`)} icon="notSpam"></alps-icon-btn>
        `:``}
        <alps-icon-btn title=${ie} @click=${()=>this._handleAction(`delete`)} icon="trash"></alps-icon-btn>
        <alps-folder-selector-popup
          class="desktop-only"
          .mailboxes=${this.mailboxes}
          .currentMailbox=${this.mailbox}
          @folder-selected=${e=>this._handleAction(e.detail.isMove?`moveTo`:`copyTo`,e.detail.folderName)}
        >
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`messageReader.moveTo`)} icon="folderOpen"></alps-icon-btn>
        </alps-folder-selector-popup>
        
        <div class="toolbar-separator"></div>
        
        ${!te&&!ne?n`
        <alps-icon-btn title=${re?this.i18nStore?.t(`messageReader.markRead`):this.i18nStore?.t(`messageReader.markUnread`)} @click=${()=>this._handleAction(`markUnread`)} icon=${re?`envelopeOpen`:`envelopeUnread`}></alps-icon-btn>
        `:``}
        ${x?``:n`
        <!-- A star is a flag on ONE message, so over a conversation it is each
             card's own star and not a button up here. -->
        <alps-icon-btn class="desktop-only" ?active=${e&&this.allSelectedStarred||!e&&this.message?.Flags?.includes(`\\Flagged`)} title=${this.i18nStore?.t(`messageReader.star`)} @click=${()=>this._handleAction(`star`)} icon=${e&&this.allSelectedStarred||!e&&this.message?.Flags?.includes(`\\Flagged`)?`starFourFill`:`starFour`}></alps-icon-btn>
        `}
        
        <alps-popup align="left" class="tags-popup">
          <alps-icon-btn slot="trigger" class="desktop-only" title=${this.i18nStore?.t(`messageReader.tags`)} icon="tag"></alps-icon-btn>
          ${[`$label1`,`$label2`,`$label3`,`$label4`,`$label5`].map(e=>n`
              <button class="dropdown-item ${this.hasTag(e)?`active`:``}" @click=${()=>this._handleTag(e)}>
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${ca(e)};margin-right:12px;opacity:0.9;"></span>
                <span class="item-text">${sa(e,this.i18nStore)}</span>
              </button>
            `)}
          ${s.length?n`
            <div class="dropdown-divider"></div>
            ${s.map(e=>n`
              <button class="dropdown-item active" title=${this.i18nStore?.t(`messageReader.removeTag`)} @click=${()=>this._handleTag(e)}>
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${ca(e)};margin-right:12px;opacity:0.9;"></span>
                <span class="item-text">${sa(e,this.i18nStore)}</span>
                ${A(`x`)}
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
            ${this.message?.Flags?.includes(`\\Draft`)||b?n`
              <alps-icon-btn title=${this.i18nStore?.t(`messageReader.editDraft`)} @click=${this._handleEditDraft} icon="pen"></alps-icon-btn>
            `:x?``:n`
              <alps-icon-btn title=${this.i18nStore?.t(`messageReader.reply`)} @click=${()=>this._handleAction(`reply`)} icon="arrowBendUpLeft"></alps-icon-btn>
            `}
            
            <alps-popup align="right" class="more-menu-popup">
              <alps-icon-btn slot="trigger" class="more-btn" title=${this.i18nStore?.t(`messageReader.moreOptions`)} icon="dotsThreeVertical"></alps-icon-btn>
            
            ${this.message?.Flags?.includes(`\\Draft`)||b||x?``:n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`reply`)}>
              ${A(`arrowBendUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reply`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`replyAll`)}>
              ${A(`arrowBendDoubleUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.replyAll`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`forward`)}>
              ${A(`arrowBendUpRight`)} <span class="item-text">${this.i18nStore?.t(`messageReader.forward`)}</span>
            </button>
            <div class="dropdown-divider"></div>
            `}
            ${!y&&!te&&!b?n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`archive`)}>
              ${A(`archiveBox`)} <span class="item-text">${this.i18nStore?.t(`messageReader.archive`)}</span>
            </button>
            `:``}
            ${!ee&&!te&&!b&&!ne?n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`reportSpam`)}>
              ${A(`warningDiamond`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reportSpam`)}</span>
            </button>
            `:``}
            ${ee?n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`notSpam`)}>
              ${A(`notSpam`)} <span class="item-text">${this.i18nStore?.t(`messageReader.notSpam`)}</span>
            </button>
            `:``}
            <button class="dropdown-item" @click=${()=>this._handleAction(`delete`)}>
              ${A(`trash`)} <span class="item-text">${ie}</span>
            </button>
            <alps-folder-selector-popup
              class="folder-selector"
              .mailboxes=${this.mailboxes}
              .currentMailbox=${this.mailbox}
              @folder-selected=${e=>this._handleAction(e.detail.isMove?`moveTo`:`copyTo`,e.detail.folderName)}
            >
              <button slot="trigger" class="dropdown-item">
                ${A(`folderOpen`)} <span class="item-text">${this.i18nStore?.t(`messageReader.moveTo`)}</span>
              </button>
            </alps-folder-selector-popup>
            ${!te&&!ne||!x?n`
            <div class="dropdown-divider"></div>
            ${!te&&!ne?n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`markUnread`)}>
              ${A(re?`envelopeOpen`:`envelopeUnread`)} <span class="item-text">${re?this.i18nStore?.t(`messageReader.markRead`):this.i18nStore?.t(`messageReader.markUnread`)}</span>
            </button>
            `:``}
            ${x?``:n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`star`)}>
              ${this.message?.Flags?.includes(`\\Flagged`)?A(`starFourFill`):A(`starFour`)} <span class="item-text">${this.i18nStore?.t(`messageReader.star`)}</span>
            </button>
            `}
            `:``}
            ${x?``:n`
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${()=>this._handleAction(`print`)}>
              ${A(`printer`)} <span class="item-text">${this.i18nStore?.t(`messageReader.print`)}</span>
            </button>
            `}
            <!-- Stays over a conversation: it is a preference about the READER,
                 not a verb on a message. -->
            <div class="dropdown-divider"></div>
            <button class="dropdown-item ${r===`text`?`active`:``}" ?disabled=${!this.hasText} @click=${()=>this.hasText&&this._handleAction(`showPlaintext`)}>
              ${A(`textAlignLeft`)}
              <span class="item-text">${this.i18nStore?.t(`messageReader.showPlaintext`)}</span>
            </button>
            <button class="dropdown-item ${r===`html`?`active`:``}" ?disabled=${!this.hasHtml} @click=${()=>this.hasHtml&&this._handleAction(`showHtml`)}>
              ${A(`code`)}
              <span class="item-text">${this.i18nStore?.t(`messageReader.showHtml`)}</span>
            </button>
            ${x?``:n`
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${()=>this._handleAction(`downloadMessage`)}>
              ${A(`downloadSimple`)} <span class="item-text">${this.i18nStore?.t(`messageReader.downloadMessage`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`showOriginal`)}>
              ${A(`codeBlock`)} <span class="item-text">${this.i18nStore?.t(`messageReader.showOriginal`)}</span>
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
              <div class="selection-icon">${A(`envelopeSimple`)}</div>
            `}
            <!-- One sentence with the number inside it. The number followed by
                 a bare "messages selected" read "1 messages selected", and a
                 language whose noun changes with the count had no form to
                 agree with a number it never saw. -->
            <span>${this.i18nStore?.t(`messageReader.messagesSelected`,{count:this.selectedCount})}</span>
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
              <bdi>${i.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`)}</bdi>
            </div>
          </div>
          <div class="thread-container">
            ${f(this.threadItems,e=>this.itemKey(e),e=>this.renderThreadCard(e))}
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

            <bdi>${i.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`)}</bdi>
          </div>
          <div class="reader-meta">
            <div class="reader-sender-block">
              <div class="reader-sender-left">
                ${this.showSenderAvatars?n`
                  <div class="avatar-container">
                    <alps-avatar .name=${d} .email=${u} .size=${40} .src=${g}></alps-avatar>
                  </div>
                `:``}
                <div class="reader-sender-info">
                  ${c.Name&&c.Name!==u?n`
                    <div class="reader-sender-line">
                      <span class="reader-sender-name" dir="auto">${c.Name}</span>
                      <alps-sender-auth-badge ?verified=${!!i.HasBimiPotential} ?failed=${!!i.HasBimiFailed}></alps-sender-auth-badge>
                    </div>
                    ${u?n`<alps-recipient-pill address="${u}"></alps-recipient-pill>`:n`<span class="reader-sender-name" dir="auto">${d}</span>`}
                  `:n`
                    <div class="reader-sender-line">
                      ${u?n`<alps-recipient-pill address="${u}"></alps-recipient-pill>`:n`<span class="reader-sender-name" dir="auto">${d}</span>`}
                      <alps-sender-auth-badge ?verified=${!!i.HasBimiPotential} ?failed=${!!i.HasBimiFailed}></alps-sender-auth-badge>
                    </div>
                  `}
                </div>
              </div>
              <div class="desktop-date-container">
                <div class="reader-date desktop-date">${h}</div>
                ${i.RFC822Size?n`<div class="reader-size desktop-only">${pr(i.RFC822Size)}</div>`:``}
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
                  <span class="reader-date mobile-date" style="color: var(--text-primary);">${h}</span>
                  ${i.RFC822Size?n`<span class="reader-size mobile-size">(${pr(i.RFC822Size)})</span>`:``}
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
            ${this.loadFailed?n`
              <div class="reader-load-error">
                <div>${this.i18nStore?.t(`messageReader.loadError`)}</div>
                <alps-button variant="normal" @click=${()=>this.retryItemBody(this.threadItems.find(e=>this.isOpenItem(e)))}>
                  ${this.i18nStore?.t(`messageReader.loadErrorRetry`)}
                </alps-button>
              </div>
            `:this.mimeType?.toLowerCase()===`text/html`?n`
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
                <pre dir="auto" class="reader-preformatted">${this.content}</pre>
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
    `}};j([h({context:T})],K.prototype,`settingsStore`,void 0),j([h({context:w})],K.prototype,`i18nStore`,void 0),j([h({context:es})],K.prototype,`composeStore`,void 0),j([a()],K.prototype,`localPreferredView`,void 0),j([a()],K.prototype,`hasHtml`,void 0),j([a()],K.prototype,`hasText`,void 0),j([o({type:String})],K.prototype,`mailbox`,void 0),j([o({type:Object})],K.prototype,`message`,void 0),j([o({type:Array})],K.prototype,`messages`,void 0),j([o({type:Object})],K.prototype,`selectedKeys`,void 0),j([o({type:Number})],K.prototype,`selectedCount`,void 0),j([o({type:Boolean})],K.prototype,`allSelectedStarred`,void 0),j([o({type:Boolean})],K.prototype,`allSelectedUnread`,void 0),j([o({type:Array})],K.prototype,`commonTags`,void 0),j([o({type:Boolean})],K.prototype,`bulkProcessing`,void 0),j([o({type:String})],K.prototype,`layoutMode`,void 0),j([o({type:Array})],K.prototype,`mailboxes`,void 0),j([a()],K.prototype,`content`,void 0),j([a()],K.prototype,`mimeType`,void 0),j([a()],K.prototype,`loading`,void 0),j([a()],K.prototype,`loadFailed`,void 0),j([a()],K.prototype,`activeBanners`,void 0),j([a()],K.prototype,`attachments`,void 0),j([a()],K.prototype,`allowRemoteResources`,void 0),j([a()],K.prototype,`hasRemoteResources`,void 0),j([a()],K.prototype,`rawMessageHtml`,void 0),j([a()],K.prototype,`isScrolled`,void 0),j([a()],K.prototype,`threadItems`,void 0),j([a()],K.prototype,`_isThread`,void 0),K=j([p(`alps-message-reader`)],K);var xc=1e4,Sc=e=>!!e?.Flags?.includes(V),Cc=(e,t)=>(e?.length??0)===(t?.length??0)&&(e??[]).every((e,n)=>e===t[n]);function wc(e,t){return e===t?!0:!e||e.length!==t.length?!1:JSON.stringify(e)===JSON.stringify(t)}var Tc=250,Ec=150,Dc=500,Oc=64,kc=120,Ac=380,jc=300,Mc=57,Nc=150,Pc=250,q=class extends d{constructor(...e){super(...e),this.showDeleteConfirm=!1,this.listLoadFailed=!1,this.pendingDeleteDetails=null,this.markReadTimer=null,this.notificationSound=null,this.audioUnlocked=!1,this.unlockAudio=()=>{if(this.audioUnlocked||!this.settingsStore.getState().soundNotifications)return;let e=this.chime();e.muted=!0,e.play().then(()=>{e.pause(),e.currentTime=0,this.audioUnlocked=!0}).catch(()=>{}).finally(()=>{e.muted=!1}),document.removeEventListener(`click`,this.unlockAudio),document.removeEventListener(`keydown`,this.unlockAudio)},this.mailboxes=[],this.messages=[],this.currentMailbox=O,this.loadingMessages=!0,this.showInitialLoader=!window.alpsAppLoaded,this.selectedMessage=null,this.selectedKeys=new Set,this.selectAllMatching=!1,this.excludedKeys=new Set,this.layoutMode=`vertical`,this.filterQuery=``,this.expandedFolders=new Set([O]),this.username=``,this.currentPage=0,this.listedPage=0,this.listedMailbox=``,this.listedQuery=``,this.totalMessages=0,this.messagesPerPage=50,this.resizerPositionX=Tc+Math.max(Ac,(window.innerWidth-Tc)*.4),this.listHeight=Math.max(Pc,(window.innerHeight-Mc)*.4),this.isSidebarDragging=!1,this.isPaneDragging=!1,this.sidebarWidth=Tc,this.sidebarPeeking=!1,this.densityMode=`compact`,this.showSenderAvatars=!0,this.isSyncing=!1,this.sidebarCollapsed=!1,this.sortOrder=`desc`,this.listScrolled=!1,this.targetUid=null,this.targetMailbox=null,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.bulkProcessing=!1,this.computedMinListWidth=Ac,this._mql=window.matchMedia(`(max-width: 768px)`),this._relayToast=e=>{this.showGlobalToast(e.detail.message,e.detail.actionLabel,e.detail.actionFn,e.detail.duration)},this._handleMediaQuery=e=>{this.isMobile=e.matches,this.isMobile||(this.mobileSidebarOpen=!1)},this.hasConnected=!1,this.handleDraftAutosaved=e=>{let{oldUid:t,oldMailbox:n,newUid:r,mailbox:i,subject:a,hasAttachments:o,size:s}=e.detail;if(!this.messages)return;let c=String(r),l=!1,u=t?R(n||i,t):null,d=e=>({...e,UID:c,...e.Mailbox?{Mailbox:i}:{},Size:s||e.Size,RFC822Size:s||e.RFC822Size,HasAttachments:o,_isAutosaveUpdate:!0,Envelope:{...e.Envelope,Subject:a||e.Envelope?.Subject||`(No subject)`}});if(u){let e=this.messages.findIndex(e=>this.keyOf(e)===u);if(e!==-1){let t=[...this.messages];t[e]=d(t[e]),this.messages=t,l=!0,this.selectedMessage&&this.keyOf(this.selectedMessage)===u&&this.followAutosavedSelection(t[e])}else for(let e=0;e<this.messages.length;e++){let t=this.messages[e];if(t.SubMessages){let n=t.SubMessages.findIndex(e=>this.keyOf(e)===u);if(n!==-1){let r=[...t.SubMessages];r[n]=d(r[n]);let i=[...this.messages];i[e]={...t,SubMessages:r},this.messages=i,l=!0,this.selectedMessage&&this.keyOf(this.selectedMessage)===u&&this.followAutosavedSelection(r[n]);break}}}!l&&this.selectedMessage&&this.keyOf(this.selectedMessage)===u&&this.followAutosavedSelection(d(this.selectedMessage))}if(!l&&this.currentMailbox===i&&!(this.listLoadFailed&&this.messages.length===0)){let e=this.settingsStore?.getState().name||this.username,n=(this.username||``).split(`@`),i=n[0]||``,l=n[1]||``,u={UID:c,Size:s||0,RFC822Size:s||0,HasAttachments:o,Flags:[B,qi],_isAutosaveUpdate:!0,Envelope:{Subject:a||`(No subject)`,Date:new Date().toISOString(),From:[{Name:e,Mailbox:i,Host:l}]}},d=this.messages.filter(e=>String(e.UID)!==String(t)&&String(e.UID)!==String(r));this.messages=[u,...d]}},this._handleSettingsChange=()=>{this._syncSettings()},this._handleI18nChange=()=>{this.requestUpdate()},this.handleLabelsSuccess=e=>{let{mailboxes:t}=e.detail;this.mailboxes=t},this.handleSyncStart=e=>{let t=e.detail;this.isSyncing=!0,!t.background&&!t.quiet&&(this.loadingMessages=!0,this.listLoadFailed=!1)},this.handleSyncSuccess=e=>{this.isSyncing=!1,this.listLoadFailed=!1;let{data:t,background:n}=e.detail,r=e.detail.announce!==!1;if(t.Username){this.username=t.Username;let e=this.settingsStore.getState(),n=t.Address||void 0;(e.loginUsername!==t.Username||e.loginAddress!==n)&&this.settingsStore.updateSettings({loginUsername:t.Username,loginAddress:n})}let i=this.mailboxes.length===0,a=!1,o=!1,s=0;if(t.Mailboxes){for(let e of t.Mailboxes){let t=e.Name||e.Mailbox,r=this.mailboxes.find(e=>(e.Name||e.Mailbox)===t);if(r&&!i&&n&&e.Total!==void 0&&r.Total!==void 0&&e.Unseen!==void 0&&r.Unseen!==void 0){let n=Math.min(e.Total-r.Total,e.Unseen-r.Unseen);n>0&&(a=!0,t.toUpperCase()===`INBOX`&&(o=!0,s+=n))}}this.mailboxes=t.Mailboxes}if(r&&a&&this.settingsStore.getState().soundNotifications){let e=this.chime();e.currentTime=0,e.play().catch(e=>{e.name!==`NotAllowedError`&&S.error(`Failed to play sound notification:`,e)})}if(r&&o&&this.settingsStore.getState().desktopNotifications&&`Notification`in window&&Notification.permission===`granted`){let e=this.i18nStore?.t(`mailboxPage.newMessages`),t=s===1?this.i18nStore?.t(`mailboxPage.newMessagesSingleBody`):this.i18nStore?.t(`mailboxPage.newMessagesMultiBody`,{count:s});try{let n=new Notification(e,{body:t,icon:`/apple-touch-icon.png`,tag:`alps-new-message`});n.onclick=()=>{window.focus(),n.close(),this.currentMailbox===`INBOX`?(this.currentPage=0,z.fetch(this.currentMailbox,0,this.filterQuery,!1)):this.updateUrl(`INBOX`,0,null,``)}}catch(e){S.error(`Failed to show desktop notification:`,e)}}if(o&&this.currentMailbox!==`INBOX`&&this.showGlobalToast(this.i18nStore?.t(`mailboxPage.newMessagesInInbox`),this.i18nStore?.t(`mailboxPage.open`),()=>{this.updateUrl(`INBOX`,0,null,``)},5e3),n&&this.currentPage>0)t.Total!==void 0&&t.Total!==this.totalMessages&&this.showGlobalToast(this.i18nStore?.t(`mailboxPage.newMessagesAvailable`),this.i18nStore?.t(`mailboxPage.refresh`),()=>{this.currentPage=0,z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)});else if(this.pastTheLastPage(t)){let e=t.MessagesPerPage||this.messagesPerPage,n=Math.max(0,Math.ceil(t.Total/e)-1);this.currentPage=n,window.history.replaceState(null,``,this.hashFor(this.currentMailbox,n,this.targetUid,this.filterQuery,this.targetMailbox)),z.fetch(this.currentMailbox,n,this.filterQuery,!1,!0);return}else if(t.Page!==void 0&&(this.currentPage=t.Page),this.listedPage=t.Page===void 0?this.currentPage:t.Page,this.listedMailbox=t.ListedMailbox||this.currentMailbox,this.listedQuery=this.filterQuery,t.Total!==void 0&&(this.totalMessages=t.Total),t.MessagesPerPage!==void 0&&(this.messagesPerPage=t.MessagesPerPage),t.Messages){if(wc(this.messages,t.Messages)||(this.messages=t.Messages,this.selectAllMatching&&(this.selectedKeys=new Set(this.listedKeys().filter(e=>!this.excludedKeys.has(e))))),this.selectedMessage){let e=this.messages.find(e=>this.isOpen(e));e&&e.Flags&&!Cc(this.selectedMessage.Flags,e.Flags)&&(this.selectedMessage={...this.selectedMessage,Flags:e.Flags})}}else this.messages=[];n||(this.loadingMessages=!1,this.applyTargetUid(),this.showInitialLoader&&setTimeout(()=>{this.showInitialLoader=!1,window.alpsAppLoaded=!0},100))},this.handleSyncUnchanged=()=>{this.isSyncing=!1},this.handleSyncError=e=>{this.isSyncing=!1;let{background:t}=e.detail;t||(this.loadingMessages=!1,this.listLoadFailed=!0,(this.listedMailbox!==this.currentMailbox||this.listedPage!==this.currentPage||this.listedQuery!==this.filterQuery)&&(this.messages=[]))},this.handleStrayArrow=e=>{if(e.key!==`ArrowDown`&&e.key!==`ArrowUp`||e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||this.showDeleteConfirm)return;let t=e.composedPath().filter(e=>e instanceof HTMLElement),n=t[0],r=n?.classList.contains(`folder-name`)&&t.some(e=>e.tagName===`ALPS-FOLDER-LIST`);if(!n||n!==document.body&&n.tagName!==`A`&&!r||t.some(e=>e.tagName===`ALPS-MESSAGE-LIST`||e.tagName===`DIALOG`||[`dialog`,`menu`,`listbox`].includes(e.getAttribute(`role`)??``)))return;let i=this.renderRoot.querySelector(`alps-message-list`);i&&(e.preventDefault(),i.step(e.key===`ArrowDown`?1:-1))},this.handleMailboxNotFound=()=>{this.showGlobalToast(this.i18nStore.t(`mailboxPage.mailboxNotFound`),``,void 0,3e3),this.updateUrl(O,0,null,null)},this.handleHashChange=()=>{let e=this.currentMailbox,t=this.currentPage,n=this.targetUid,r=this.targetMailbox,i=this.filterQuery;this.extractMailboxFromHash(),e!==this.currentMailbox||t!==this.currentPage||i!==this.filterQuery?(e===this.currentMailbox?i!==this.filterQuery&&(this.loadingMessages=!0,this.currentPage=0,this.clearSelection()):(this.selectedMessage=null,this.currentPage=0,this.clearSelection(),this.loadingMessages=!0),z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)):(n!==this.targetUid||r!==this.targetMailbox)&&this.applyTargetUid()},this.stopResize=null,this.startResize=e=>{e.preventDefault(),this.stopResize?.(),this.isPaneDragging=!0,this.updateComputedMinWidth();let t=e=>{if(this.layoutMode===`vertical`){let t=this.sidebarCollapsed?Oc:this.sidebarWidth,n=Math.max(t+this.computedMinListWidth,Math.min(e.clientX,window.innerWidth-jc));this.resizerPositionX=n}else this.layoutMode===`horizontal`&&(this.listHeight=Math.max(Nc,Math.min(e.clientY-Mc,window.innerHeight-Nc)))},n=()=>{this.stopResize=null,this.isPaneDragging=!1,window.removeEventListener(`mousemove`,t),window.removeEventListener(`mouseup`,n)};this.stopResize=n,window.addEventListener(`mousemove`,t),window.addEventListener(`mouseup`,n)},this.rowsAfterTakeOut=null,this.handleDroppedMessages=e=>{let{folder:t,copy:n,keys:r,selection:i}=e.detail;if(!Xn(this.mailboxes.find(e=>(e.Name||e.Mailbox)===t),this.mailboxes,this.currentMailbox))return;if(i&&this.selectionCount>0){this._handleReaderAction(new CustomEvent(`action`,{detail:{action:n?`copyTo`:`moveTo`,folder:t}}));return}let a=r.filter(e=>Ai(e).mailbox!==t);a.length!==0&&(n?this.copyKeys(a,t,a.length>1):this.fileDropped(a,t))}}chime(){return this.notificationSound??=new Audio(`/assets/notify.wav`)}static{this.styles=_`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      width: 100vw;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      overflow: hidden;
      /* Clip, where the browser knows it: a hidden host is still a scroll
         container, so a scrollIntoView() or focus() on anything at its clipped
         edge scrolled the whole page by what overflowed, cutting off the top
         of the header until the next navigation. Clip cuts the same and
         cannot be scrolled at all. */
      overflow: clip;
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
    .layout-vertical alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${Tc}px); flex-shrink: 0; }
    .layout-vertical .main-view { flex: 1; display: flex; flex-direction: row; min-width: 0; }
    .layout-vertical .message-list-pane { width: ${Ac}px; flex-shrink: 0; border-right: 1px solid var(--border-color); }
    .layout-vertical .message-reader-pane { flex: 1; min-width: 0; }

    /* Horizontal: Sidebar (250px) | [ Message List (50%) / Reader (50%) ] */
    .layout-horizontal alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${Tc}px); flex-shrink: 0; }
    .layout-horizontal .main-view { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .layout-horizontal .message-list-pane { flex-shrink: 0; border-bottom: 1px solid var(--border-color); }
    .layout-horizontal .message-reader-pane { flex: 1; min-height: 0; }

    /* Full: Sidebar (250px) | Message List OR Reader */
    .layout-full alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${Tc}px); flex-shrink: 0; }
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

    alps-sidebar.desktop-sidebar[collapsed][peeking] {
      transition: width 0.2s, z-index 0s 0s;
    }

    .app-container.dragging alps-sidebar.desktop-sidebar {
      transition: none;
    }



    .app-container.collapsed {
      --sidebar-width: ${Oc}px;
    }

    .app-container.collapsed .message-list-pane {
      box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
      z-index: 25;
      border-left: 1px solid var(--border-color);
    }



    `}updateComputedMinWidth(){let e=Ac,t=this.shadowRoot?.querySelector(`.message-list-pane alps-message-list`);if(t){let n=t.shadowRoot?.querySelector(`.list-header`);if(n){let t=vr(n);e=Math.max(Ac,t+2)}}if(e!==this.computedMinListWidth){this.computedMinListWidth=e;let t=this.sidebarCollapsed&&!this.isMobile?Oc:this.sidebarWidth;this.resizerPositionX-t<e&&(this.resizerPositionX=t+e)}}showGlobalToast(e,t=``,n,r=3e3){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e,actionLabel:t,actionFn:n,duration:r}}))}reportActionFailed(e,t){this.showGlobalToast(this.i18nStore?.t(e)||t,``,void 0,4e3)}reportFlagFailure(e){if(e.reason===`auth`)return;let t=e.reason===`unsupported`?`toast.tagNotSupported`:`toast.flagChangeFailed`,n=e.reason===`unsupported`?`That tag is not supported by this mail server`:`Could not update the messages`;this.showGlobalToast(this.i18nStore?.t(t)||n,``,void 0,4e3)}get canArchiveHere(){let e=Wn(this.currentMailbox,this.mailboxes);return e!==`trash`&&e!==`drafts`&&e!==`archive`}get effectiveListWidth(){let e=this.sidebarCollapsed&&!this.isMobile?Oc:this.sidebarWidth;return Math.max(this.computedMinListWidth,this.resizerPositionX-e)}get selectedListed(){if(this.selectedKeys.size===0)return[];let e=[];for(let t of this.messages){this.selectedKeys.has(this.keyOf(t))&&e.push(t);for(let n of t.SubMessages||[])this.selectedKeys.has(this.keyOf(n))&&e.push(n)}return e}get selectedStarRows(){let e=[];for(let t of this.messages){let n=[t,...t.SubMessages||[]],r=n.filter(e=>this.selectedKeys.has(this.keyOf(e)));if(n.length>1&&r.length===n.length)e.push({face:t,messages:n});else for(let t of r)e.push({face:t,messages:[t]})}return e}get allSelectedStarred(){let e=this.selectedStarRows;return e.length>0&&e.every(e=>e.messages.some(Sc))}starWrite(e){let t=e.length>0&&e.every(e=>e.messages.some(Sc));return{keys:(t?e.flatMap(e=>e.messages.filter(Sc)):e.filter(e=>!e.messages.some(Sc)).map(e=>e.face)).map(e=>this.keyOf(e)),op:t?`remove`:`add`}}get commonSelectedTags(){let e=this.selectedListed;return e.length===0?[]:[`$label1`,`$label2`,`$label3`,`$label4`,`$label5`].filter(t=>e.every(e=>e.Flags?.some(e=>e.toLowerCase()===t.toLowerCase())))}get allSelectedUnread(){let e=!1;for(let t of this.messages){let n=[t,...t.SubMessages||[]].filter(e=>this.selectedKeys.has(this.keyOf(e)));if(n.length!==0&&(e=!0,n.every(e=>e.Flags?.includes(`\\Seen`))))return!1}return e}get selectionCount(){return this.selectAllMatching?Math.max(0,this.totalMessages-this.excludedKeys.size):this.selectedKeys.size}get matchingScope(){return{query:this.filterQuery,except:[...this.excludedKeys].map(e=>Ai(e).uid)}}listedKeys(){let e=[];for(let t of this.messages||[]){e.push(this.keyOf(t));for(let n of t.SubMessages||[])e.push(this.keyOf(n))}return e}takeSelection(e){if(this.selectedKeys=e,!this.selectAllMatching)return;let t=new Set(this.excludedKeys);for(let n of this.listedKeys())e.has(n)?t.delete(n):t.add(n);this.excludedKeys=t,this.selectionCount<=0&&this.clearSelection()}selectAllInFolder(){this.selectAllMatching=!0,this.excludedKeys=new Set,this.selectedKeys=new Set(this.listedKeys())}clearSelection(){this.selectAllMatching=!1,this.excludedKeys=new Set,this.selectedKeys=new Set}mailboxOf(e){return Mi(e,this.currentMailbox)}keyOf(e){return R(this.mailboxOf(e),e?.UID)}isOpen(e){return!!this.selectedMessage&&!!e&&this.keyOf(this.selectedMessage)===this.keyOf(e)}connectedCallback(){super.connectedCallback();let e=this.hasConnected;this.hasConnected=!0,e&&!window.location.hash.startsWith(`#/mailbox/`)&&window.history.replaceState(null,``,this.hashFor(this.currentMailbox,this.currentPage,this.targetUid,this.filterQuery,this.targetMailbox));let t=[this.currentMailbox,this.currentPage,this.filterQuery].join(`
`);e?this.handleHashChange():this.extractMailboxFromHash(),window.addEventListener(`hashchange`,this.handleHashChange),document.addEventListener(`click`,this.unlockAudio),document.addEventListener(`keydown`,this.unlockAudio),document.addEventListener(`keydown`,this.handleStrayArrow),this._mql.addEventListener(`change`,this._handleMediaQuery),this._handleMediaQuery(this._mql),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this.i18nStore?.addEventListener(`change`,this._handleI18nChange),this._syncSettings(),z.addEventListener(`sync-start`,this.handleSyncStart),z.addEventListener(`sync-success`,this.handleSyncSuccess),z.addEventListener(`sync-error`,this.handleSyncError),z.addEventListener(`sync-unchanged`,this.handleSyncUnchanged),z.addEventListener(`labels-success`,this.handleLabelsSuccess),z.addEventListener(`mailbox-not-found`,this.handleMailboxNotFound),window.addEventListener(`draft-autosaved`,this.handleDraftAutosaved),e?t===[this.currentMailbox,this.currentPage,this.filterQuery].join(`
`)&&z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0,!0):z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0)}disconnectedCallback(){super.disconnectedCallback(),this.stopResize?.(),window.removeEventListener(`hashchange`,this.handleHashChange),this._mql.removeEventListener(`change`,this._handleMediaQuery),document.removeEventListener(`click`,this.unlockAudio),document.removeEventListener(`keydown`,this.unlockAudio),document.removeEventListener(`keydown`,this.handleStrayArrow),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),z.removeEventListener(`sync-start`,this.handleSyncStart),z.removeEventListener(`sync-success`,this.handleSyncSuccess),z.removeEventListener(`sync-error`,this.handleSyncError),z.removeEventListener(`sync-unchanged`,this.handleSyncUnchanged),z.removeEventListener(`labels-success`,this.handleLabelsSuccess),z.removeEventListener(`mailbox-not-found`,this.handleMailboxNotFound),window.removeEventListener(`draft-autosaved`,this.handleDraftAutosaved),z.stop()}updated(e){super.updated(e),(e.has(`sidebarCollapsed`)||e.has(`layoutMode`)||e.has(`currentMailbox`)||e.has(`isMobile`)||e.has(`mailboxes`))&&setTimeout(()=>this.updateComputedMinWidth(),0)}followAutosavedSelection(e){this.selectedMessage=e,this.targetUid=String(e.UID);let t=this.mailboxOf(e);this.targetMailbox=t===this.currentMailbox?null:t,window.history.replaceState(null,``,this.hashFor(this.currentMailbox,this.currentPage,this.targetUid,this.filterQuery,this.targetMailbox))}_syncSettings(){let e=this.settingsStore.getState();this.layoutMode=e.layoutMode,this.densityMode=e.densityMode,this.showSenderAvatars=e.showSenderAvatars??!0,this.sortOrder=e.sortOrder||`desc`,e.loginUsername&&(this.username=e.loginUsername),this.sidebarCollapsed!==e.sidebarCollapsed&&(this.sidebarCollapsed=e.sidebarCollapsed),e.messagesPerPage&&e.messagesPerPage>0&&(this.messagesPerPage=e.messagesPerPage),z.setListingSettings([e.sortOrder,e.messageSortCriteria,e.messagesPerPage,e.enableThreading].join(` `)),e.checkMailInterval!==void 0&&z.start(e.checkMailInterval)}pastTheLastPage(e){let t=e.Page??this.currentPage,n=e.MessagesPerPage||this.messagesPerPage;return t<=0||(e.Messages?.length??0)>0||e.Total===void 0||e.Total<=0||n<=0?!1:Math.ceil(e.Total/n)-1<t}openFolderPrompt(){let e=this.shadowRoot?.querySelector(`alps-folder-list`);e&&typeof e.triggerCreateFolder==`function`&&e.triggerCreateFolder()}updateUrl(e,t,n,r=this.filterQuery,i=null){window.location.hash=this.hashFor(e,t,n,r,i)}hashFor(e,t,n,r,i){let a=`#/mailbox/${encodeURIComponent(e)}`,o=new URLSearchParams;t>0&&o.set(`p`,t.toString()),n&&(o.set(`uid`,n),i&&i!==e&&o.set(`in`,i)),r&&o.set(`q`,r);let s=o.toString();return s&&(a+=`?`+s),a}openKeyInUrl(e,t,n){if(!n){this.updateUrl(e,t,null);return}let{mailbox:r,uid:i}=Ai(n);this.updateUrl(e,t,i,void 0,r)}extractMailboxFromHash(){let e=window.location.hash;if(e.startsWith(`#/mailbox/`)){let t=e.substring(10),n=t.indexOf(`?`),r=``;n!==-1&&(r=t.substring(n+1),t=t.substring(0,n));let i=t.split(`/`);this.currentMailbox=decodeURIComponent(i[0]);let a=new URLSearchParams(r);i.length>1&&i[1]?(this.targetUid=i[1],this.targetMailbox=null):(this.targetUid=a.get(`uid`)||null,this.targetMailbox=this.targetUid&&a.get(`in`)||null);let o=a.get(`p`);o?this.currentPage=parseInt(o,10)||0:this.currentPage=0,this.filterQuery=a.get(`q`)||``}else this.currentMailbox=O,this.targetUid=null,this.targetMailbox=null,this.currentPage=0}async applyTargetUid(){if(!this.targetUid){this.markReadTimer&&=(clearTimeout(this.markReadTimer),null),this.selectedMessage=null;return}let e=this.targetUid,t=this.targetMailbox,n=t||this.currentMailbox,r=R(n,e),i=this.messages.find(e=>this.keyOf(e)===r);if(!i&&this.messages.length>0)try{let t=this.settingsStore?.getState()?.preferredView||`html`,r=ki.generation(),a=await D(`/mailboxes/${k(n)}/messages/${e}?view=${t}`);if(a.ok){let e=await a.json();if(e.Message){i={...e.Message,Mailbox:e.Message.Mailbox||n};let a=e.Part;if((!a||typeof e.Body==`string`)&&ki.generation()===r){let n=!!a&&(a.MIMEType||a.MimeType||`text/plain`).toLowerCase()===`text/html`;ki.set(i.Mailbox,String(i.UID),t,{Message:e.Message,Part:a,Attachments:e.Attachments,RawHtml:a&&n?e.Body:void 0,RawText:a&&!n?e.Body:void 0,HasHTML:!!e.HasHTML,HasText:!!e.HasText})}}}}catch(e){S.error(`Failed to fetch shifted message:`,e)}this.targetUid!==e||this.targetMailbox!==t||(i?this.isOpen(i)||(this.selectedMessage=i,this.layoutMode===`full`&&(this.expandedFolders=new Set),this._scheduleMarkAsRead(i)):this.messages.length>0&&(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)))}async selectMessage(e){this.openKeyInUrl(this.currentMailbox,this.currentPage,this.keyOf(e))}_scheduleMarkAsRead(e){if(this.markReadTimer&&=(clearTimeout(this.markReadTimer),null),e.Flags?.includes(`\\Seen`))return;let t=this.settingsStore?.getState().markReadTimeout??0;t<0||(t===0?this._doMarkAsRead(e):this.markReadTimer=setTimeout(()=>{this._doMarkAsRead(e)},t*1e3))}updateLocalMessageFlags(e,t,n){let r=new Set(e),i=[],a=[...this.messages],o=e=>{let r=!!e.Flags?.includes(t);return n===`add`&&!r?{...e,Flags:[...e.Flags||[],t]}:n===`remove`&&r?{...e,Flags:e.Flags.filter(e=>e!==t)}:e};for(let e=0;e<a.length;e++){let t=a[e];if(r.has(this.keyOf(t))){let n=o(t);n!==t&&(a[e]=t=n,i.push(this.keyOf(t)))}if(t.SubMessages?.some(e=>r.has(this.keyOf(e)))){let n=t.SubMessages.map(e=>r.has(this.keyOf(e))?o(e):e),s=n.filter((e,n)=>e!==t.SubMessages[n]);if(s.length>0){a[e]={...t,SubMessages:n};for(let e of s)i.push(this.keyOf(e))}}}if(i.length>0){if(this.messages=a,this.selectedMessage&&r.has(this.keyOf(this.selectedMessage))){let e=this.selectedMessage.Flags&&this.selectedMessage.Flags.includes(t);n===`add`&&!e?this.selectedMessage.Flags=[...this.selectedMessage.Flags||[],t]:n===`remove`&&e&&(this.selectedMessage.Flags=this.selectedMessage.Flags.filter(e=>e!==t)),this.selectedMessage={...this.selectedMessage}}window.dispatchEvent(new CustomEvent(`external-message-flags-changed`,{detail:{keys:e,flag:t,action:n}}))}return i}async _handleListToggleStar(e){let t=e.detail.message,{keys:n,op:r}=this.starWrite([{face:t,messages:e.detail.messages??[t]}]),i=r===`add`?`remove`:`add`;this.updateLocalMessageFlags(n,V,r);let a=new Set,o;try{o=(await this.eachFolder(n,async(e,t)=>{let n=await H.setFlag(e,t,[V],r);if(n.ok)for(let n of t)a.add(R(e,n));return n})).refused}catch{}let s=n.filter(e=>!a.has(e));s.length>0&&(this.updateLocalMessageFlags(s,V,i),o&&this.reportFlagFailure(o))}async _doMarkAsRead(e){let t=await H.markAsRead(this.mailboxOf(e),e);t?.Flags?.includes(`\\Seen`)&&(this.isOpen(e)&&(this.selectedMessage=t),this.updateLocalMessageFlags([this.keyOf(e)],B,`add`))}async handleNamedMessageAction(e){let t=String(e.uid),n=e.mailbox,r=R(n,t),i=!!this.selectedMessage&&this.keyOf(this.selectedMessage)===r;if(e.action===`downloadMessage`){let e=document.createElement(`a`);e.href=`/mailboxes/${k(n)}/messages/${t}/raw`,e.download=``,document.body.appendChild(e),e.click(),document.body.removeChild(e);return}if(e.action===`showOriginal`){window.open(`#/original?mailbox=${encodeURIComponent(n)}&uid=${t}`,`_blank`);return}if(e.action===`markUnread`){let e=await H.setFlag(n,[t],[B],`remove`);if(!e.ok){this.reportFlagFailure(e);return}this.updateLocalMessageFlags([r],B,`remove`),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null);return}if(e.action!==`delete`)return;if(this.deletesForGood(n)){this.pendingDeleteDetails={isBulk:!1,doomed:[r],toTrash:[],isDrafts:Wn(n,this.mailboxes)===`drafts`,named:{isOpen:i,nextUid:e.nextUid,done:e.done}},this.showDeleteConfirm=!0;return}let a=Gn(`trash`,this.mailboxes,zn),o=this.currentMailbox,s=await H.moveMessages(n,[t],a);if(!s.success){e.done?.(!1),s.reason!==`auth`&&this.reportActionFailed(`toast.moveFailed`,`Could not move that`);return}e.done?.(!0),i&&this.leaveDeletedMessage(e.nextUid);let c=s.uidMapping?.[t],l=c?async()=>{try{let e=await H.moveMessages(a,[c],n);if(!e.success){e.reason!==`auth`&&this.reportActionFailed(`toast.undoFailed`,`Could not undo that`);return}let t=e.uidMapping?.[c];if(i){let e=this.currentMailbox===o?this.currentPage:0;this.openKeyInUrl(o,e,t?R(n,t):null)}else this.renderRoot.querySelector(`alps-message-reader`)?.reloadConversation()}catch(e){S.error(`Undo failed`,e),this.reportActionFailed(`toast.undoFailed`,`Could not undo that`)}}:void 0;this.showGlobalToast(this.movedMessage(!1,1,a),l?this.i18nStore?.t(`mailboxPage.undo`):``,l,xc)}leaveDeletedMessage(e){if(e){this.updateUrl(this.currentMailbox,this.currentPage,e);return}this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)}async eachFolder(e,t){let n=[],r;return await z.afterWrites(async()=>{for(let[i,a]of ji(e)){let e=await t(i,a);if(e.ok){n.push({mailbox:i,uids:a,result:e});continue}if(r??=e,e.reason===`auth`)break}}),{done:n,refused:r}}writtenKeys(e){return e.flatMap(({mailbox:e,uids:t})=>t.map(t=>R(e,t)))}async flagEach(e,t,n){let r=t.map(t=>({flag:t,keys:this.updateLocalMessageFlags(e,t,n)})),i=new Set,{refused:a}=await this.eachFolder(e,async(e,r)=>{let a=await H.setFlag(e,r,t,n);if(a.ok)for(let t of r)i.add(R(e,t));return a});if(i.size<e.length){let e=n===`add`?`remove`:`add`;for(let{flag:t,keys:n}of r){let r=n.filter(e=>!i.has(e));r.length>0&&this.updateLocalMessageFlags(r,t,e)}}return a??{ok:!0}}async flagTargets(e,t,n){if(!this.selectAllMatching)return this.flagEach(e,t,n);let r=await H.setFlagMatching(this.currentMailbox,this.matchingScope,t,n);if(r.ok)for(let r of t)this.updateLocalMessageFlags(e,r,n);return r}async fileWholeFolder(e,t){let n=this.currentMailbox,r=this.matchingScope,i=await H.moveMatching(n,r,e);if(!i.success){i.reason!==`auth`&&this.reportActionFailed(`toast.moveFailed`,`Could not move that`);return}this.clearSelection(),this.selectedMessage=null,this.updateUrl(n,this.currentPage,null);let a=this.undoMoves([{from:n,mapping:i.uidMapping??{}}],e,n,void 0);this.showGlobalToast(t(i.count??0),a?this.i18nStore?.t(`mailboxPage.undo`):``,a,xc)}takeRowsOut(e){let t=this.messages,n=this.totalMessages,r=e.length>0?z.rowsTakenOut(e):()=>{},i=e=>this.messages===this.rowsAfterTakeOut?(r(),this.messages=t,this.totalMessages=n,this.takeRowsOut(e),!0):!1;if(e.length===0)return i;let a=new Set(e),o=0,s=[];for(let e of this.messages){let t=e.SubMessages??[],n=t.filter(e=>!a.has(this.keyOf(e)));if(a.has(this.keyOf(e))&&n.length===0){o+=1;continue}s.push(n.length===t.length?e:{...e,SubMessages:n})}return this.messages=s,this.rowsAfterTakeOut=s,o>0&&(this.totalMessages=Math.max(0,this.totalMessages-o)),i}async fileAway(e,t,n,r){if(this.selectAllMatching)return this.fileWholeFolder(t,r);let i=this.currentMailbox,a=this.selectedMessage?this.keyOf(this.selectedMessage):void 0,o=n?e.filter(e=>Ai(e).mailbox!==t):[],s=n?this.takeRowsOut(o):void 0;await z.afterWrites(async()=>{let{done:c,refused:l}=await this.eachFolder(e,async(e,n)=>{if(e===t)return{ok:!0,uidMapping:{}};let r=await H.moveMessages(e,n,t);return{ok:r.success,reason:r.reason,uidMapping:r.uidMapping??{}}}),u=this.writtenKeys(c);if(u.length>0){n&&(this.selectedKeys=new Set([...this.selectedKeys].filter(e=>!u.includes(e)))),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null);let e=c.filter(({mailbox:e})=>e!==t).map(({mailbox:e,result:t})=>({from:e,mapping:t.uidMapping})),o=this.undoMoves(e,t,i,n?void 0:a);this.showGlobalToast(r(u.length),o?this.i18nStore?.t(`mailboxPage.undo`):``,o,xc)}if(l&&l.reason!==`auth`&&(this.reportActionFailed(`toast.moveFailed`,`Could not move that`),s)){let t=new Set(u),n=e.filter(e=>!t.has(e));s(o.filter(e=>t.has(e)))?this.selectedKeys=new Set(n):z.sync()}})}undoMoves(e,t,n,r,i=!0){let a=e.filter(({mapping:e})=>Object.keys(e).length>0);if(a.length!==0)return async()=>{try{let e=[],o=null,s;if(await z.afterWrites(async()=>{for(let{from:n,mapping:i}of a){let a=await H.moveMessages(t,Object.values(i),n);if(!a.success){if(s??=a,a.reason===`auth`)break;continue}for(let[t,s]of Object.entries(i)){let i=a.uidMapping?.[s];i&&(e.push(R(n,i)),r===R(n,t)&&(o=R(n,i)))}}}),s&&s.reason!==`auth`&&this.reportActionFailed(`toast.undoFailed`,`Could not undo that`),e.length===0)return;if(r!==void 0){let e=this.currentMailbox===n?this.currentPage:0;this.openKeyInUrl(n,e,o)}else i&&this.currentMailbox===n&&(this.selectedKeys=new Set([...this.selectedKeys,...e]))}catch(e){S.error(`Undo failed`,e),this.reportActionFailed(`toast.undoFailed`,`Could not undo that`)}}}async copyKeys(e,t,n){let{done:r,refused:i}=await this.eachFolder(e,async(e,n)=>{let r=await H.copyMessages(e,n,t);return{ok:r.success,reason:r.reason,uidMapping:{}}}),a=this.writtenKeys(r).length;if(a>0){let e=n?this.i18nStore?.t(`toast.messagesCopiedToFolder`,{count:a,folder:this.folderCaption(t)}):this.i18nStore?.t(`toast.messageCopiedToFolder`,{folder:this.folderCaption(t)});this.showGlobalToast(e,``,void 0,xc)}i&&i.reason!==`auth`&&this.reportActionFailed(`toast.copyFailed`,`Could not copy that`)}async fileDropped(e,t){let n=this.currentMailbox,r=this.selectedMessage?this.keyOf(this.selectedMessage):void 0,i=this.takeRowsOut(e);await z.afterWrites(async()=>{let{done:a,refused:o}=await this.eachFolder(e,async(e,n)=>{let r=await H.moveMessages(e,n,t);return{ok:r.success,reason:r.reason,uidMapping:r.uidMapping??{}}}),s=this.writtenKeys(a);if(s.length>0){let e=r!==void 0&&s.includes(r);e&&(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null));let i=a.map(({mailbox:e,result:t})=>({from:e,mapping:t.uidMapping})),o=this.undoMoves(i,t,n,e?r:void 0,!1);this.showGlobalToast(this.movedMessage(s.length>1,s.length,t),o?this.i18nStore?.t(`mailboxPage.undo`):``,o,xc)}if(o&&o.reason!==`auth`){this.reportActionFailed(`toast.moveFailed`,`Could not move that`);let t=new Set(s);i(e.filter(e=>t.has(e)))||z.sync()}})}deletesForGood(e){let t=Wn(e,this.mailboxes);return t===`trash`||t===`drafts`||t===`junk`}folderCaption(e){return dr(e,this.i18nStore,this.mailboxes)}movedMessage(e,t,n){let r=this.folderCaption(n);return e?this.i18nStore?.t(`toast.messagesMovedToFolder`,{count:t,folder:r}):this.i18nStore?.t(`toast.messageMovedToFolder`,{folder:r})}async _handleReaderAction(e){let t=e.detail.action;if(e.detail.uid&&e.detail.mailbox)return this.handleNamedMessageAction(e.detail);let n=this.selectionCount>0,r=this.selectedMessage;if(!n&&!r?.UID)return;let i=n?[]:[this.keyOf(r)],a=n?[...this.selectedKeys]:e.detail.uids?.length?e.detail.uids.map(e=>R(this.currentMailbox,e)):i,o=n||a.length>1;n&&(this.bulkProcessing=!0);try{if(t===`star`){let e=n?this.starWrite(this.selectedStarRows):{keys:i,op:r.Flags?.includes(`\\Flagged`)?`remove`:`add`},t=await this.flagTargets(e.keys,[V],e.op);t.ok||this.reportFlagFailure(t)}else if(t===`addTag`||t===`removeTag`){let n=e.detail.tags||(e.detail.folder?[e.detail.folder]:[]);if(!n||n.length===0)return;let r=t===`addTag`?`add`:`remove`,i=await this.flagTargets(a,n,r);i.ok||this.reportFlagFailure(i),this.requestUpdate()}else if(t===`markUnread`)if(n){let e=await this.flagTargets(a,[B],this.allSelectedUnread?`add`:`remove`);e.ok||this.reportFlagFailure(e)}else{let e=!r.Flags||!r.Flags.includes(`\\Seen`),t=await H.setFlag(this.mailboxOf(r),[String(r.UID)],[B],e?`add`:`remove`);t.ok?e?(this.selectedMessage={...r,Flags:[...r.Flags||[],B]},this.updateLocalMessageFlags(i,B,`add`)):(this.updateLocalMessageFlags(i,B,`remove`),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)):this.reportFlagFailure(t)}else if(t===`delete`||t===`archive`||t===`reportSpam`||t===`notSpam`){let e=Gn(`trash`,this.mailboxes,zn);if(t===`archive`&&(e=Gn(`archive`,this.mailboxes,Fn)),t===`reportSpam`&&(e=Gn(`junk`,this.mailboxes,Rn)),t===`notSpam`&&(e=O),t===`delete`&&this.selectAllMatching){if(this.deletesForGood(this.currentMailbox)){this.pendingDeleteDetails={isBulk:n,doomed:[],toTrash:[],isDrafts:Wn(this.currentMailbox,this.mailboxes)===`drafts`,matching:{count:this.selectionCount}},this.showDeleteConfirm=!0;return}}else if(t===`delete`){let e=a.filter(e=>this.deletesForGood(Ai(e).mailbox));if(e.length>0){this.pendingDeleteDetails={isBulk:n,doomed:e,toTrash:a.filter(t=>!e.includes(t)),isDrafts:e.every(e=>Wn(Ai(e).mailbox,this.mailboxes)===`drafts`)},this.showDeleteConfirm=!0;return}}await this.fileAway(a,e,n,t=>this.movedMessage(o,t,e))}else if(t===`moveTo`||t===`copyTo`){let r=e.detail.folder;if(!r)return;if(t===`moveTo`)await this.fileAway(a,r,n,e=>this.movedMessage(o,e,r));else if(this.selectAllMatching){let e=await H.copyMatching(this.currentMailbox,this.matchingScope,r);if(e.success){let t=e.count??0;this.showGlobalToast(o?this.i18nStore?.t(`toast.messagesCopiedToFolder`,{count:t,folder:this.folderCaption(r)}):this.i18nStore?.t(`toast.messageCopiedToFolder`,{folder:this.folderCaption(r)}),``,void 0,xc)}else e.reason!==`auth`&&this.reportActionFailed(`toast.copyFailed`,`Could not copy that`)}else await this.copyKeys(a,r,o)}else if(t===`downloadMessage`&&!n){let e=`/mailboxes/${k(this.mailboxOf(r))}/messages/${r.UID}/raw`,t=document.createElement(`a`);t.href=e,t.download=``,document.body.appendChild(t),t.click(),document.body.removeChild(t)}else if(t===`showOriginal`&&!n){let e=`#/original?mailbox=${encodeURIComponent(this.mailboxOf(r))}&uid=${r.UID}`;window.open(e,`_blank`)}}finally{n&&(this.bulkProcessing=!1)}}async _confirmDelete(){this.showDeleteConfirm=!1;let e=this.pendingDeleteDetails;if(this.pendingDeleteDetails=null,!e)return;let{isBulk:t,doomed:n,toTrash:r,isDrafts:i,named:a,matching:o}=e,s=o?o.count>1:n.length>1;t&&(this.bulkProcessing=!0);try{if(o){let e=await H.deleteMatchingResult(this.currentMailbox,this.matchingScope);if(e.ok){let t=e.count??0;this.clearSelection(),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null);let n=i?s?this.i18nStore?.t(`toast.draftsDiscarded`,{count:t}):this.i18nStore?.t(`toast.draftDiscarded`):s?this.i18nStore?.t(`toast.messagesPermanentlyDeleted`,{count:t}):this.i18nStore?.t(`toast.messagePermanentlyDeleted`);this.showGlobalToast(n,``,void 0,xc)}else e.reason!==`auth`&&this.reportActionFailed(`toast.messageDeleteFailed`,`The message could not be deleted`);return}await z.afterWrites(async()=>{let e=t&&!a?this.takeRowsOut(n):void 0,{done:o,refused:c}=await this.eachFolder(n,(e,t)=>H.deleteMessagesResult(e,t));a?.done?.(!c);let l=this.writtenKeys(o);if(l.length>0){a?a.isOpen&&this.leaveDeletedMessage(a.nextUid):(t&&(this.selectedKeys=new Set([...this.selectedKeys].filter(e=>!l.includes(e)))),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null));let e=``;e=i?s?this.i18nStore?.t(`toast.draftsDiscarded`,{count:l.length}):this.i18nStore?.t(`toast.draftDiscarded`):s?this.i18nStore?.t(`toast.messagesPermanentlyDeleted`,{count:l.length}):this.i18nStore?.t(`toast.messagePermanentlyDeleted`),this.showGlobalToast(e,``,void 0,xc)}if(c&&c.reason!==`auth`&&(this.reportActionFailed(`toast.messageDeleteFailed`,`The message could not be deleted`),e)){let t=new Set(l);e(l)?this.selectedKeys=new Set(n.filter(e=>!t.has(e))):z.sync()}if(r.length>0){let e=Gn(`trash`,this.mailboxes,zn);await this.fileAway(r,e,t,n=>this.movedMessage(t||r.length>1,n,e))}})}finally{t&&(this.bulkProcessing=!1)}}get deleteDialogWords(){let e=e=>this.i18nStore?.t(e),t=this.pendingDeleteDetails,n=(t?.matching?.count??t?.doomed.length??0)>1;return t?.isDrafts?{title:e(n?`mailboxPage.discardDraftsTitle`:`floatingComposer.discardDraftTitle`),message:e(n?`mailboxPage.discardDraftsMessage`:`floatingComposer.discardDraftMessage`),confirm:e(`floatingComposer.discard`)}:{title:e(`mailboxPage.permanentlyDelete`),message:e(n?`messageReader.deleteConfirmMultiple`:`messageReader.deleteConfirmSingle`),confirm:e(`mailboxPage.deletePermanently`)}}_cancelDelete(){this.showDeleteConfirm=!1,this.pendingDeleteDetails=null}toggleFolder(e,t){t&&(t.stopPropagation(),t.preventDefault());let n=new Set(this.expandedFolders);n.has(e)?n.delete(e):n.add(e),this.expandedFolders=n}render(){let e=this.isMobile?`full`:this.layoutMode,t=e===`full`&&this.selectedMessage!==null;return n`
      <alps-initial-loader ?hidden=${!this.showInitialLoader}></alps-initial-loader>
      <app-header 
        .username=${this.username}
        .isMobile=${this.isMobile}
        .currentMailbox=${this.currentMailbox}
        .mailboxes=${this.mailboxes}
        .searchQuery=${this.filterQuery}
        .scrolled=${this.listScrolled}
        @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
        @compose=${()=>this.composeStore.openComposer()}
        @search-submit=${e=>{let t=e.detail.value,n=e.detail.global?`*`:this.currentMailbox;this.updateUrl(n,0,null,t)}}
      ></app-header>
      <div class="app-container layout-${e} ${t?`reading`:``} ${this.isPaneDragging||this.isSidebarDragging?`dragging`:``} ${this.sidebarCollapsed&&!this.isMobile?`collapsed`:``} ${this.isMobile?`mobile-view`:``}" style="${!this.sidebarCollapsed&&!this.isMobile?`--sidebar-width: ${this.sidebarWidth}px;`:``}">
        <alps-sidebar 
          class="${this.isMobile?`mobile-sidebar`:`desktop-sidebar`} ${this.mobileSidebarOpen?`open`:``}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
          .collapsed=${this.sidebarCollapsed&&!this.isMobile}
          .width=${this.sidebarWidth}
          @sidebar-resize=${e=>{let t=e.detail.newWidth;t<kc?(this.sidebarCollapsed||this.settingsStore.updateSettings({sidebarCollapsed:!0}),this.sidebarWidth=Tc):(this.sidebarCollapsed&&this.settingsStore.updateSettings({sidebarCollapsed:!1}),this.sidebarWidth=Math.min(Math.max(t,Ec),Dc),this.resizerPositionX=Math.max(this.resizerPositionX,this.sidebarWidth+Ac))}}
          @drag-start=${()=>this.isSidebarDragging=!0}
          @drag-end=${()=>this.isSidebarDragging=!1}
          @toggle-collapse=${()=>this.settingsStore.updateSettings({sidebarCollapsed:!this.sidebarCollapsed})}
          @close-sidebar=${()=>this.mobileSidebarOpen=!1}
          @peek-change=${e=>{this.sidebarPeeking=e.detail.peeking}}
        >
          <alps-folder-list
            .mailboxes=${this.mailboxes}
            .currentMailbox=${this.currentMailbox}
            .expandedFolders=${this.expandedFolders}
            .layoutMode=${e}
            .syncing=${this.isSyncing}
            ?collapsed=${this.sidebarCollapsed&&!this.isMobile&&!this.sidebarPeeking}
            @select-mailbox=${e=>{this.currentMailbox===e.detail.name?(this.currentPage=0,this.selectedMessage=null,this.filterQuery=``,this.loadingMessages=!0,this.updateUrl(e.detail.name,0,null),z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)):(this.loadingMessages=!0,this.filterQuery=``,this.clearSelection(),this.updateUrl(e.detail.name,0,null)),xr(this.renderRoot),this.isMobile&&(this.mobileSidebarOpen=!1)}}
            @toggle-folder=${e=>this.toggleFolder(e.detail.folderName,null)}
            @expand-folder=${e=>{let t=new Set(this.expandedFolders);t.add(e.detail.folderName),this.expandedFolders=t}}
            @compose=${()=>{this.composeStore.openComposer(),this.isMobile&&(this.mobileSidebarOpen=!1)}}
            @toast=${this._relayToast}
            @drop-messages=${this.handleDroppedMessages}
          ></alps-folder-list>
          <alps-icon-btn 
            slot="footer-actions"
            class="new-folder-btn"
            icon="folderPlus"
            title="${this.i18nStore?.t(`folderList.createFolder`)}"
            @click=${this.openFolderPrompt}
          ></alps-icon-btn>
        </alps-sidebar>
        <div class="main-view">
          <div class="pane message-list-pane" style="position: relative; ${e===`vertical`?`width: ${this.effectiveListWidth}px; flex: none; ${this.isPaneDragging||this.isSidebarDragging?``:`transition: width 0.2s;`}`:e===`horizontal`?`height: ${this.listHeight}px; flex: none;`:``}">

            <alps-message-list
              .messages=${this.messages}
              .currentMailbox=${this.currentMailbox}
              .currentMailboxRole=${Wn(this.currentMailbox,this.mailboxes)||``}
              .listedMailbox=${this.listedMailbox}
              .listedMailboxRole=${Wn(this.listedMailbox,this.mailboxes)||``}
              .mailboxes=${this.mailboxes}
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
              @refresh=${()=>{if(this.listLoadFailed&&this.messages.length===0){z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0);return}this.currentPage=0,z.check(this.currentMailbox,this.currentPage,this.filterQuery)}}
              @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
              @compose=${()=>this.composeStore.openComposer()}
              @toast=${this._relayToast}
              @select-message=${e=>this.selectMessage(e.detail.message)}
              @change-page=${e=>this.updateUrl(this.currentMailbox,e.detail.page,this.targetUid,void 0,this.targetMailbox)}
              @list-scrolled=${e=>this.listScrolled=e.detail.scrolled}
              @toggle-sort=${async()=>{let e=this.sortOrder===`asc`?`desc`:`asc`;this.messages=[],this.loadingMessages=!0,await this.settingsStore.updateSettings({sortOrder:e}),this.currentPage=0,z.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)}}
              @toggle-filter-starred=${()=>{let e=this.filterQuery===`is:starred`?``:`is:starred`;this.updateUrl(this.currentMailbox,0,null,e)}}
              @toggle-filter-unread=${()=>{let e=this.filterQuery===`is:unread`?``:`is:unread`;this.updateUrl(this.currentMailbox,0,null,e)}}
              @clear-search=${()=>{let e=this.currentMailbox===`*`?O:this.currentMailbox;this.updateUrl(e,0,null,``)}}
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
              @message-flags-changed=${e=>this.updateLocalMessageFlags([R(e.detail.mailbox??this.currentMailbox,e.detail.uid)],e.detail.flag,e.detail.action)}
            ></alps-message-reader>
          </div>
        </div>
      </div>
      ${this.showDeleteConfirm?n`
        <ui-confirm
          title=${this.deleteDialogWords.title}
          message=${this.deleteDialogWords.message}
          confirmText=${this.deleteDialogWords.confirm}
          cancelText=${this.i18nStore?.t(`general.cancel`)}
          .isDanger=${!0}
          @confirm=${this._confirmDelete}
          @cancel=${this._cancelDelete}
        ></ui-confirm>
      `:``}
    `}};j([h({context:es})],q.prototype,`composeStore`,void 0),j([h({context:T})],q.prototype,`settingsStore`,void 0),j([h({context:w})],q.prototype,`i18nStore`,void 0),j([a()],q.prototype,`showDeleteConfirm`,void 0),j([a()],q.prototype,`listLoadFailed`,void 0),j([a()],q.prototype,`pendingDeleteDetails`,void 0),j([a()],q.prototype,`mailboxes`,void 0),j([a()],q.prototype,`messages`,void 0),j([a()],q.prototype,`currentMailbox`,void 0),j([a()],q.prototype,`loadingMessages`,void 0),j([a()],q.prototype,`showInitialLoader`,void 0),j([a()],q.prototype,`selectedMessage`,void 0),j([a()],q.prototype,`selectedKeys`,void 0),j([a()],q.prototype,`selectAllMatching`,void 0),j([a()],q.prototype,`excludedKeys`,void 0),j([a()],q.prototype,`layoutMode`,void 0),j([a()],q.prototype,`filterQuery`,void 0),j([a()],q.prototype,`expandedFolders`,void 0),j([a()],q.prototype,`username`,void 0),j([a()],q.prototype,`currentPage`,void 0),j([a()],q.prototype,`listedPage`,void 0),j([a()],q.prototype,`listedMailbox`,void 0),j([a()],q.prototype,`totalMessages`,void 0),j([a()],q.prototype,`messagesPerPage`,void 0),j([a()],q.prototype,`resizerPositionX`,void 0),j([a()],q.prototype,`listHeight`,void 0),j([a()],q.prototype,`isSidebarDragging`,void 0),j([a()],q.prototype,`isPaneDragging`,void 0),j([a()],q.prototype,`sidebarWidth`,void 0),j([a()],q.prototype,`sidebarPeeking`,void 0),j([a()],q.prototype,`densityMode`,void 0),j([a()],q.prototype,`showSenderAvatars`,void 0),j([a()],q.prototype,`isSyncing`,void 0),j([a()],q.prototype,`sidebarCollapsed`,void 0),j([a()],q.prototype,`sortOrder`,void 0),j([a()],q.prototype,`listScrolled`,void 0),j([a()],q.prototype,`targetUid`,void 0),j([a()],q.prototype,`targetMailbox`,void 0),j([a()],q.prototype,`isMobile`,void 0),j([a()],q.prototype,`mobileSidebarOpen`,void 0),j([a()],q.prototype,`bulkProcessing`,void 0),j([a()],q.prototype,`computedMinListWidth`,void 0),q=j([p(`mailbox-page`)],q);var Fc=e=>`alps_contacts_categories_${e}`,Ic=`contacts_categories_cache`,Lc=/^#\/contacts\/?([^\/]*)\/?(.*)$/,J=class extends d{constructor(...e){super(...e),this.contacts=[],this.sortOrder=`asc`,this.showOnlyStarred=!1,this.loading=!0,this.isSpinning=!1,this.showInitialLoader=!window.alpsAppLoaded,this.selectedContact=null,this.filterQuery=``,this.isEditing=!1,this.saving=!1,this.selectedCategory=``,this.showCreatePrompt=!1,this.showDeleteConfirm=!1,this.addedCategories=[],this.sidebarWidth=250,this.listWidth=380,this.sidebarCollapsed=!1,this.sidebarPeeking=!1,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.isSidebarDragging=!1,this.isPaneDragging=!1,this.densityMode=`compact`,this.selectedContacts=new Set,this.listScrolled=!1,this.categoryToRename=null,this.categoryToDelete=null,this.syncIntervalTimer=null,this.readEpoch=0,this.loadedQuery=``,this.wholeBook=[],this.mergedBook=null,this._handleSettingsChange=()=>{if(this.settingsStore){let e=this.settingsStore.getState();if(this.sidebarCollapsed=e.sidebarCollapsed,this.densityMode=e.densityMode||`compact`,this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null),e.checkMailInterval&&e.checkMailInterval>0){let t=e.checkMailInterval*60*1e3;this.syncIntervalTimer=setInterval(()=>{this.fetchContacts()},t)}}},this._handleWindowResize=()=>{this.isMobile=window.innerWidth<=768},this.loadAddedCategories=()=>{try{localStorage.removeItem(Ic);let e=He(),t=e?JSON.parse(localStorage.getItem(Fc(e))||`[]`):[];this.addedCategories=Array.isArray(t)?t:[]}catch{this.addedCategories=[]}},this._handleHashChange=()=>{this.contacts=this.contacts.filter(e=>!e.isTemporary);let e=window.location.hash.match(Lc);if(e){let t=e[1]?decodeURIComponent(e[1]):``,n=e[2]?decodeURIComponent(e[2]):``,r=t===`all`||!t?``:t;if(this.selectedCategory!==r&&(this.selectedCategory=r,this.selectedContacts=new Set,this.isMobile&&(this.mobileSidebarOpen=!1)),n){if((this.selectedContact?.uid?.replace(/^urn:uuid:/,``)||this.selectedContact?.path)!==n){if(this.contacts.length===0)return;let e=this.contacts.find(e=>(e.uid?.replace(/^urn:uuid:/,``)||e.path)===n);e&&this.selectContact(e,!1)}}else this.selectedContact=null,this.isEditing=!1}else this.selectedContact=null,this.isEditing=!1},this.queuedSave=null,this.saveRunning=!1,this.conflictedPath=null,this.stopResize=null,this.startResize=e=>{e.preventDefault(),this.stopResize?.(),this.isPaneDragging=!0;let t=e.clientX,n=this.listWidth,r=e=>{let r=e.clientX-t;this.listWidth=Math.max(250,Math.min(800,n+r))},i=()=>{this.stopResize=null,this.isPaneDragging=!1,window.removeEventListener(`mousemove`,r),window.removeEventListener(`mouseup`,i)};this.stopResize=i,window.addEventListener(`mousemove`,r),window.addEventListener(`mouseup`,i)}}static{this.styles=[q.styles,U.styles,Nr,_`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary, #ffffff);
      color: var(--text-primary);
      overflow: hidden;
      /* Not a scroll container: see the mailbox page's host. */
      overflow: clip;
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

  `]}updated(e){if(super.updated(e),e.has(`densityMode`)){let e=this.settingsStore?.getState().densityMode||`normal`;this.dataset.density=e;let t=this.shadowRoot?.querySelector(`.contact-list-pane`);t&&(t.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),t.classList.add(`density-${e}`))}}willUpdate(e){super.willUpdate(e),e.has(`loading`)&&this.loading&&(this.isSpinning=!0)}handleSpinIteration(){this.loading||(this.isSpinning=!1)}connectedCallback(){super.connectedCallback(),this.showInitialLoader=!window.alpsAppLoaded,this.classList.add(`density-compact`),this.loadAddedCategories(),window.addEventListener(`alps-active-user-changed`,this.loadAddedCategories),this.fetchContacts(),window.addEventListener(`resize`,this._handleWindowResize),window.addEventListener(`hashchange`,this._handleHashChange),this.settingsStore&&(this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._handleSettingsChange()),setTimeout(()=>this._handleHashChange(),0)}disconnectedCallback(){super.disconnectedCallback(),this.stopResize?.(),window.removeEventListener(`resize`,this._handleWindowResize),window.removeEventListener(`hashchange`,this._handleHashChange),window.removeEventListener(`alps-active-user-changed`,this.loadAddedCategories),this.settingsStore&&this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.syncIntervalTimer&&=(clearInterval(this.syncIntervalTimer),null)}saveAddedCategories(){let e=He();if(e)try{localStorage.setItem(Fc(e),JSON.stringify(this.addedCategories))}catch{}}writeHash(e,t){if(window.location.hash!==e){if(t===`push`){window.location.hash=e;return}history.replaceState(null,``,e),this._handleHashChange()}}listHash(){return`#/contacts/${encodeURIComponent(this.selectedCategory||`all`)}`}leaveDeletedCard(){window.location.hash.match(Lc)?.[2]&&this.writeHash(this.listHash(),`replace`)}get allContacts(){if(!this.loadedQuery)return this.contacts;let e=this.selectedContact,t=this.mergedBook;if(t&&t.contacts===this.contacts&&t.wholeBook===this.wholeBook&&t.open===e)return t.merged;let n=new Map(this.contacts.filter(e=>e.path).map(e=>[e.path,e]));e?.path&&!n.has(e.path)&&n.set(e.path,e);let r=new Set(this.wholeBook.map(e=>e.path)),i=[...this.contacts.filter(e=>!e.path||!r.has(e.path)),...this.wholeBook.map(e=>n.get(e.path)??e)];return this.mergedBook={contacts:this.contacts,wholeBook:this.wholeBook,open:e,merged:i},i}get uniqueCategories(){let e=new Set(this.addedCategories);for(let t of this.allContacts)if(t.categories)for(let n of t.categories)e.add(n);return Array.from(e).sort((e,t)=>e.localeCompare(t))}get username(){return this.settingsStore?.getState().loginUsername||``}async fetchContacts(){let e=++this.readEpoch;this.loading=!0;try{let t=this.filterQuery,[n,r]=await Promise.all([L.fetchContacts(t),t?L.fetchContacts().catch(e=>(console.error(`Failed to read the whole address book beside a search`,e),null)):null]);if(e!==this.readEpoch)return;this.contacts=n.contacts||[],this.loadedQuery=t,t?r&&(this.wholeBook=r.contacts||[]):this.wholeBook=this.contacts,this._handleHashChange()}catch(t){if(e!==this.readEpoch)return;console.error(`Failed to fetch contacts`,t)}finally{e===this.readEpoch&&(this.loading=!1),this.showInitialLoader&&setTimeout(()=>{this.showInitialLoader=!1,window.alpsAppLoaded=!0},100)}}clearSearch(){this.filterQuery&&(this.filterQuery=``,this.fetchContacts())}async selectContact(e,t=!0){if(e.isTemporary){this.selectedContact=e,this.isEditing=!0;return}if(t){let t=this.selectedCategory?encodeURIComponent(this.selectedCategory):`all`,n=e.uid?.replace(/^urn:uuid:/,``)||e.path;this.writeHash(`#/contacts/${t}/${encodeURIComponent(n)}`,`push`);return}if(this.selectedContacts.size>0&&(this.selectedContacts=new Set),this.selectedContact?.path!==e.path){this.selectedContact={...e},this.isEditing=!1,this.conflictedPath=null;try{let t=await L.fetchContact(e.path);this.selectedContact?.path===t.path&&(this.selectedContact=t)}catch(e){console.error(`Failed to fetch contact details`,e)}}}get gestureTargets(){return this.selectedContacts.size>0?Array.from(this.selectedContacts):[this.selectedContact?.path].filter(Boolean)}findContact(e){return this.contacts.find(t=>t.path===e)??this.allContacts.find(t=>t.path===e)??(this.selectedContact?.path===e?this.selectedContact:void 0)}get allSelectedStarred(){if(this.selectedContacts.size===0)return!1;for(let e of this.selectedContacts){let t=this.findContact(e);if(!t||!t.categories?.includes(`Favorites`))return!1}return!0}async handleToggleStar(e,t){if(e.stopPropagation(),t.isTemporary)return;let n=t.categories?[...t.categories]:[];n.includes(`Favorites`)?n=n.filter(e=>e!==Ci):n.push(Ci),this.contacts=this.contacts.map(e=>e.path===t.path?{...e,categories:n}:e);try{let e=await L.updateCategories(t.path,n);this.applyETags(e.etag?{[t.path]:e.etag}:void 0),this.selectedContact?.path===t.path&&(this.selectedContact={...this.selectedContact,categories:n})}catch(e){console.error(`Failed to toggle star:`,e),this.reportFailure(`contacts.starFailed`);let n=t.categories;this.contacts=this.contacts.map(e=>e.path===t.path?{...e,categories:n}:e),St(e)&&this.rereadCategories(t.path)}}async rereadCategories(e){let t=this.contacts.find(t=>t.path===e);try{let n=await L.fetchContact(e);if(!t||this.contacts.find(t=>t.path===e)!==t)return;let r={categories:n.categories??[],...n.etag?{etag:n.etag}:{}};this.contacts=this.contacts.map(t=>t.path===e?{...t,...r}:t),this.selectedContact?.path===e&&(this.selectedContact={...this.selectedContact,...r})}catch(e){console.error(`Failed to re-read a contact after a write that may have landed`,e)}}handleSelectAll(e){let t=e;if(t.detail?t.detail.checked:e.target.checked){if(Array.isArray(t.detail?.paths)){this.selectedContacts=new Set(t.detail.paths);return}let e=this.contacts.filter(e=>!(this.selectedCategory&&(!e.categories||!e.categories.includes(this.selectedCategory))||this.showOnlyStarred&&(!e.categories||!e.categories.includes(`Favorites`))));this.selectedContacts=new Set(e.map(e=>e.path))}else this.selectedContacts=new Set}handleSelectContact(e,t){e.stopPropagation();let n=new Set(this.selectedContacts);n.has(t)?n.delete(t):n.add(t),this.selectedContacts=n}handleCreateCategorySubmit(e){let t=e.detail.name?.trim();t&&(this.addedCategories.includes(t)||(this.addedCategories=[...this.addedCategories,t],this.saveAddedCategories())),this.showCreatePrompt=!1}handleCreateNew(){this.selectedContacts=new Set;let e={name:this.i18nStore?.t(`contacts.unnamedContact`),categories:this.selectedCategory?[this.selectedCategory]:[],isTemporary:!0};this.contacts=this.contacts.filter(e=>!e.isTemporary),this.contacts=[e,...this.contacts],this.selectedContact=e,this.isEditing=!0}async cardsCarrying(e){return(this.filterQuery?(await L.fetchContacts()).contacts||[]:this.contacts).filter(t=>t.path&&t.categories?.includes(e))}categoryHash(e){let t=window.location.hash.match(Lc)?.[2];return`#/contacts/${encodeURIComponent(e||`all`)}${t?`/${t}`:``}`}showWrittenCategories(e,t){let n=this.selectedContact?.path;if(!n||!t?.[n])return;let r=e.find(e=>e.path===n);r&&(this.selectedContact={...this.selectedContact,categories:r.categories})}async handleRenameCategorySubmit(e){let t=e.detail.name?.trim();if(!t||!this.categoryToRename||t===this.categoryToRename){this.categoryToRename=null;return}let n=this.categoryToRename;this.categoryToRename=null;let r;try{r=await this.cardsCarrying(n)}catch(e){console.error(`Could not read the address book for a category change`,e),this.reportFailure(`contacts.categoryRenameOneFailed`);return}if(r.length>0){this.saving=!0;try{let e=r.map(e=>{let r=e.categories.map(e=>e===n?t:e);return{...e,categories:r}}),{total:i,done:a,failed:o,etags:s}=await L.bulkUpdateCategories(e);if(this.applyETags(s),this.showWrittenCategories(e,s),this.fetchContacts(),o>0&&this.reportRefusals(`contacts.categoryRenameFailed`,`contacts.categoryRenameOneFailed`,{count:o,total:i}),a===0)return}catch(e){console.error(`Error renaming category`,e),this.fetchContacts();let t=r.length;this.reportRefusals(`contacts.categoryRenameFailed`,`contacts.categoryRenameOneFailed`,{count:t,total:t});return}finally{this.saving=!1}}this.addedCategories.includes(n)&&(this.addedCategories=this.addedCategories.map(e=>e===n?t:e),this.saveAddedCategories()),this.selectedCategory===n&&(this.selectedCategory=t,this.writeHash(this.categoryHash(t),`replace`))}async handleDeleteCategorySubmit(){if(!this.categoryToDelete)return;let e=this.categoryToDelete;this.categoryToDelete=null;let t;try{t=await this.cardsCarrying(e)}catch(e){console.error(`Could not read the address book for a category change`,e),this.reportFailure(`contacts.categoryDeleteOneFailed`);return}if(t.length>0){this.saving=!0;try{let n=t.map(t=>{let n=t.categories.filter(t=>t!==e);return{...t,categories:n}}),{total:r,done:i,failed:a,etags:o}=await L.bulkUpdateCategories(n);if(this.applyETags(o),this.showWrittenCategories(n,o),this.fetchContacts(),a>0&&this.reportRefusals(`contacts.categoryDeleteFailed`,`contacts.categoryDeleteOneFailed`,{count:a,total:r}),i===0)return}catch(e){console.error(`Error deleting category`,e),this.fetchContacts();let n=t.length;this.reportRefusals(`contacts.categoryDeleteFailed`,`contacts.categoryDeleteOneFailed`,{count:n,total:n});return}finally{this.saving=!1}}this.addedCategories.includes(e)&&(this.addedCategories=this.addedCategories.filter(t=>t!==e),this.saveAddedCategories()),this.selectedCategory===e&&(this.selectedCategory=``,this.writeHash(this.categoryHash(``),`replace`))}handleEdit(){this.isEditing=!0}handleCancelEdit(){this.isEditing=!1,this.selectedContact?.isTemporary?(this.selectedContact=null,this.contacts=this.contacts.filter(e=>!e.isTemporary),this.selectedCategory||this.writeHash(`#/contacts/all`,`push`)):this.selectedContact?.path&&this.selectedContact.path===this.conflictedPath&&(this.conflictedPath=null,this.rereadOpenContact())}async rereadOpenContact(){let e=this.selectedContact?.path;if(e){try{let t=await L.fetchContact(e);this.selectedContact?.path===e&&!this.isEditing&&(this.selectedContact=t)}catch(e){console.error(`Failed to re-read the contact`,e)}this.fetchContacts()}}applyETags(e){if(!e||Object.keys(e).length===0)return;this.contacts=this.contacts.map(t=>e[t.path]?{...t,etag:e[t.path]}:t);let t=this.selectedContact?.path;t&&e[t]&&(this.selectedContact={...this.selectedContact,etag:e[t]})}async handleSave(e){if(this.queuedSave=e,!this.saveRunning){this.saveRunning=!0;try{for(;this.queuedSave;){let e=this.queuedSave;this.queuedSave=null,await this.saveOnce(e)}}finally{this.saveRunning=!1}}}async saveOnce(e){let t=!!this.selectedContact&&!this.selectedContact.isTemporary;if(!(t&&this.conflictedPath===this.selectedContact.path)){this.saving=!0;try{e.categories&&typeof e.categories==`string`?e.categories=e.categories.split(`,`).map(e=>e.trim()).filter(e=>e):e.categories=[];let n;n=t?await L.updateContact(this.selectedContact.path,{...e,etag:this.selectedContact.etag}):await L.createContact(e);let r={...e,path:n.path||(t?this.selectedContact.path:``),etag:n.etag},i=this.contacts.findIndex(e=>this.selectedContact&&(e.path===this.selectedContact.path||e.isTemporary&&this.selectedContact.isTemporary));i>-1?(this.contacts[i]={...this.contacts[i],...r},delete this.contacts[i].isTemporary,this.contacts=[...this.contacts]):this.contacts=[r,...this.contacts],this.selectedContact={...this.selectedContact,...r},delete this.selectedContact.isTemporary}catch(e){console.error(`Error saving contact`,e),t&&xt(e)?(this.conflictedPath=this.selectedContact.path,this.reportFailure(`contacts.saveConflict`)):this.reportFailure(`contacts.saveFailed`)}finally{this.saving=!1}}}handleSaveEvent(e){this.handleSave(e.detail)}async handleToggleStarEvent(){let e=this.gestureTargets;if(e.length===0)return;let t=e.length>1?this.allSelectedStarred:this.findContact(e[0])?.categories?.includes(`Favorites`)||!1;this.saving=!0;let n=this.contacts.map(e=>({...e})),r=this.selectedContact?{...this.selectedContact}:null;try{let i=e.map(e=>{let n=this.findContact(e);if(!n)return;let r=n.categories?[...n.categories]:[];t?r=r.filter(e=>e!==Ci):r.includes(`Favorites`)||r.push(Ci);let i=this.contacts.findIndex(t=>t.path===e);return i!==-1&&(this.contacts[i]={...n,categories:r}),this.selectedContact?.path===e&&(this.selectedContact={...this.selectedContact,categories:r}),{...n,categories:r}}).filter(Boolean);this.contacts=[...this.contacts];let{total:a,done:o,failed:s,uncertain:c,etags:l}=await L.bulkUpdateCategories(i);this.applyETags(l),s>0&&(o===0?(this.contacts=n,this.selectedContact=r,c>0&&this.fetchContacts()):this.fetchContacts(),this.reportFailure(`contacts.starFailed`,{failed:s,total:a}))}catch(e){console.error(`Error toggling star`,e),this.reportFailure(`contacts.starFailed`)}finally{this.saving=!1}}reportFailure(e,t){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(e,t),duration:5e3}}))}reportRefusals(e,t,n){n.total===1?this.reportFailure(t):this.reportFailure(e,n)}handleDelete(){this.showDeleteConfirm=!0}async confirmDelete(){this.showDeleteConfirm=!1,this.saving=!0;let e=this.selectedContact?.path,t=window.location.hash,n=this.selectedContacts,r=this.gestureTargets;try{let{total:i,done:a,failed:o,uncertain:s,deletedPaths:c=[]}=await L.bulkDeleteContacts(r);if(a>0)e&&this.selectedContact?.path===e&&c.includes(e)&&(this.selectedContact=null,this.isEditing=!1,window.location.hash===t&&this.leaveDeletedCard()),this.selectedContacts===n&&n.size>0&&(this.selectedContacts=new Set),this.fetchContacts();else if(s>0){await this.fetchContacts();let i=new Set(this.allContacts.map(e=>e.path)),a=e=>!!e&&r.includes(e)&&!i.has(e);e&&this.selectedContact?.path===e&&a(e)&&(this.selectedContact=null,this.isEditing=!1,window.location.hash===t&&this.leaveDeletedCard()),this.selectedContacts===n&&[...n].some(a)&&(this.selectedContacts=new Set([...n].filter(e=>!a(e))))}o>0&&this.reportRefusals(`contacts.deleteFailed`,`contacts.deleteOneFailed`,{count:o,total:i})}catch(e){console.error(`Error deleting contacts`,e),this.fetchContacts(),this.reportRefusals(`contacts.deleteFailed`,`contacts.deleteOneFailed`,{count:r.length,total:r.length})}finally{this.saving=!1}}async handleUpdateCategories(e){let t=e.detail.category;typeof t==`string`&&(t=t.trim()),t&&!this.addedCategories.includes(t)&&(this.addedCategories=[...this.addedCategories,t],this.saveAddedCategories());let n=this.gestureTargets;if(n.length!==0){this.saving=!0;try{let e=n.map(e=>{let n=this.findContact(e);if(!n)return;let r=n.categories?[...n.categories]:[];t===``?r=[]:r.includes(t)?r=r.filter(e=>e!==t):r.push(t);let i=this.contacts.findIndex(t=>t.path===e);return i!==-1&&(this.contacts[i]={...n,categories:r}),this.selectedContact?.path===e&&(this.selectedContact={...this.selectedContact,categories:r}),{...n,categories:r}}).filter(Boolean),{total:r,failed:i,etags:a}=await L.bulkUpdateCategories(e);if(this.contacts=[...this.contacts],this.applyETags(a),i>0&&(this.fetchContacts(),this.reportRefusals(`contacts.categoryUpdateFailed`,`contacts.categoryUpdateOneFailed`,{count:i,total:r})),this.selectedContact&&this.selectedContacts.size<=1&&this.selectedCategory!==``&&!this.selectedContact.categories?.includes(this.selectedCategory)){let e=this.selectedContact.uid?.replace(/^urn:uuid:/,``)||this.selectedContact.path;e&&this.writeHash(`#/contacts/all/${encodeURIComponent(e)}`,`replace`)}this.selectedCategory!==``&&this.selectedCategory!==`All Contacts`&&this.fetchContacts()}catch(e){console.error(`Error updating categories`,e),this.reportRefusals(`contacts.categoryUpdateFailed`,`contacts.categoryUpdateOneFailed`,{count:n.length,total:n.length})}finally{this.saving=!1}}}render(){return n`
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
      <div class="app-container layout-vertical ${this.sidebarCollapsed&&!this.isMobile?`collapsed`:``} ${this.isPaneDragging||this.isSidebarDragging?`dragging`:``} ${this.isMobile?`mobile-view`:``} ${this.isMobile&&this.selectedContact?`reading`:``}" style="${!this.sidebarCollapsed&&!this.isMobile?`--sidebar-width: ${this.sidebarWidth}px;`:``}">
        <alps-sidebar 
          class="${this.isMobile?`mobile-sidebar`:`desktop-sidebar`} ${this.mobileSidebarOpen?`open`:``}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
          .width=${this.sidebarWidth}
          .collapsed=${this.sidebarCollapsed&&!this.isMobile}
          @sidebar-resize=${e=>{let t=e.detail.newWidth;t<120?(this.sidebarCollapsed||this.settingsStore?.updateSettings({sidebarCollapsed:!0}),this.sidebarWidth=250):(this.sidebarCollapsed&&this.settingsStore?.updateSettings({sidebarCollapsed:!1}),this.sidebarWidth=Math.min(Math.max(t,150),500))}}
          @drag-start=${()=>this.isSidebarDragging=!0}
          @drag-end=${()=>this.isSidebarDragging=!1}
          @toggle-collapse=${()=>this.settingsStore?.updateSettings({sidebarCollapsed:!this.sidebarCollapsed})}
          @close-sidebar=${()=>this.mobileSidebarOpen=!1}
          @peek-change=${e=>{this.sidebarPeeking=e.detail.peeking}}
        >
          <alps-contacts-categories
            .contacts=${this.allContacts}
            .uniqueCategories=${this.uniqueCategories}
            .selectedCategory=${this.selectedCategory}
            .filterQuery=${this.filterQuery}
            .sidebarCollapsed=${this.sidebarCollapsed}
            .sidebarPeeking=${this.sidebarPeeking}
            .isMobile=${this.isMobile}
            @create-contact=${this.handleCreateNew}
            @select-category=${e=>{this.clearSearch();let t=e.detail.category;t===`All Contacts`?this.writeHash(`#/contacts/all`,`push`):this.writeHash(`#/contacts/${encodeURIComponent(t)}`,`push`),xr(this.renderRoot)}}
            @drag-start=${()=>{this.isSidebarDragging=!0,xr(this.renderRoot)}}
            @drag-end=${()=>{this.isSidebarDragging=!1,this.isMobile?this.mobileSidebarOpen=!1:xr(this.renderRoot)}}
            @rename-category=${e=>{this.categoryToRename=e.detail.category}}
            @delete-category=${e=>{this.categoryToDelete=e.detail.category}}
          ></alps-contacts-categories>
          
          <alps-icon-btn 
            slot="footer-actions"
            class="new-folder-btn"
            icon="folderPlus"
            title="${this.i18nStore?.t(`contacts.createCategory`)}"
            @click=${()=>this.showCreatePrompt=!0}
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
              @clear-search=${()=>this.clearSearch()}
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
              @close=${()=>{this.selectedContact=null,this.isEditing=!1,this.writeHash(this.listHash(),`push`)}}
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
    `}};j([h({context:w})],J.prototype,`i18nStore`,void 0),j([h({context:T})],J.prototype,`settingsStore`,void 0),j([a()],J.prototype,`contacts`,void 0),j([a()],J.prototype,`sortOrder`,void 0),j([a()],J.prototype,`showOnlyStarred`,void 0),j([a()],J.prototype,`loading`,void 0),j([a()],J.prototype,`isSpinning`,void 0),j([a()],J.prototype,`showInitialLoader`,void 0),j([a()],J.prototype,`selectedContact`,void 0),j([a()],J.prototype,`filterQuery`,void 0),j([a()],J.prototype,`isEditing`,void 0),j([a()],J.prototype,`saving`,void 0),j([a()],J.prototype,`selectedCategory`,void 0),j([a()],J.prototype,`showCreatePrompt`,void 0),j([a()],J.prototype,`showDeleteConfirm`,void 0),j([a()],J.prototype,`addedCategories`,void 0),j([a()],J.prototype,`sidebarWidth`,void 0),j([a()],J.prototype,`listWidth`,void 0),j([a()],J.prototype,`sidebarCollapsed`,void 0),j([a()],J.prototype,`sidebarPeeking`,void 0),j([a()],J.prototype,`isMobile`,void 0),j([a()],J.prototype,`mobileSidebarOpen`,void 0),j([a()],J.prototype,`isSidebarDragging`,void 0),j([a()],J.prototype,`isPaneDragging`,void 0),j([a()],J.prototype,`densityMode`,void 0),j([a()],J.prototype,`selectedContacts`,void 0),j([a()],J.prototype,`listScrolled`,void 0),j([a()],J.prototype,`categoryToRename`,void 0),j([a()],J.prototype,`categoryToDelete`,void 0),J=j([p(`contacts-page`)],J);var Y=class extends d{constructor(...e){super(...e),this.contact=null,this.isEditing=!1,this.saving=!1,this.uniqueCategories=[],this.isMobile=!1,this.selectedCount=0,this.allSelectedStarred=!1,this.scrolled=!1,this.editForm={},this.isDirty=!1,this.newCategoryName=``,this.saveTimeout=null}handleAddCategory(){let e=this.newCategoryName.trim();if(e){this.dispatchEvent(new CustomEvent(`update-categories`,{detail:{category:e},bubbles:!0,composed:!0})),this.newCategoryName=``;let t=this.shadowRoot?.querySelector(`alps-popup`);t&&t.close()}}static{this.styles=[Nr,_`
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

    /* Decoration, drawn as alps-icon-btn draws its icon, without the button. */
    .selection-icon {
      display: flex;
      padding: 6px;
      margin-right: 8px;
    }

    .selection-icon .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
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
    .multi-field-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .multi-field-row alps-input {
      flex: 1;
    }
    .multi-field-type {
      height: 36px;
      padding: 0 8px;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--input-radius, 6px);
      color: var(--text-primary, #111827);
      font-size: 13px;
      outline: none;
      cursor: pointer;
    }
    .add-field-btn {
      align-self: flex-start;
      background: none;
      border: none;
      color: var(--link-color, var(--primary, #2563eb));
      font-size: 13px;
      cursor: pointer;
      padding: 2px 4px;
      margin-top: -8px;
      margin-bottom: 4px;
    }
    .add-field-btn:hover {
      text-decoration: underline;
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
  `]}updated(e){if(e.has(`contact`)||e.has(`isEditing`)){let t=e.has(`isEditing`)&&this.isEditing;this.contact&&this.isEditing&&(t||!this.editForm||this.editForm.path!==this.contact.path)&&(this.editForm={...this.contact},this.isDirty=!1,Array.isArray(this.editForm.categories)&&(this.editForm.categories=this.editForm.categories.join(`, `)),Array.isArray(this.editForm.emails)&&this.editForm.emails.length>0?this.editForm.emails=this.editForm.emails.map(e=>({...e})):this.editForm.email?this.editForm.emails=[{value:this.editForm.email,type:``}]:this.editForm.emails=[{value:``,type:``}],Array.isArray(this.editForm.phones)&&this.editForm.phones.length>0?this.editForm.phones=this.editForm.phones.map(e=>({...e})):this.editForm.phone?this.editForm.phones=[{value:this.editForm.phone,type:``}]:this.editForm.phones=[{value:``,type:``}])}}debouncedSave(){this.saveTimeout&&clearTimeout(this.saveTimeout),this.saveTimeout=setTimeout(()=>{this.handleSave()},500)}handleInput(e,t){this.editForm={...this.editForm,[e]:t},this.isDirty=!0,this.debouncedSave()}handleMultiInput(e,t,n,r){let i=[...this.editForm[e]||[]];i[t]&&(i[t]={...i[t],[n]:r},this.editForm={...this.editForm,[e]:i,...e===`emails`?{email:i[0]?.value||``}:{phone:i[0]?.value||``}},this.isDirty=!0,this.debouncedSave())}addMultiField(e){let t=[...this.editForm[e]||[]];t.push({value:``,type:``}),this.editForm={...this.editForm,[e]:t},this.requestUpdate()}removeMultiField(e,t){let n=[...this.editForm[e]||[]];n.splice(t,1),this.editForm={...this.editForm,[e]:n,...e===`emails`?{email:n[0]?.value||``}:{phone:n[0]?.value||``}},this.isDirty=!0,this.debouncedSave()}formatTypeLabel(e,t){if(!e)return t;let n=e.toLowerCase();return`${{home:this.i18nStore?.t(`contacts.typeHome`)||`Home`,work:this.i18nStore?.t(`contacts.typeWork`)||`Work`,other:this.i18nStore?.t(`contacts.typeOther`)||`Other`,cell:this.i18nStore?.t(`contacts.typeMobile`)||`Mobile`,mobile:this.i18nStore?.t(`contacts.typeMobile`)||`Mobile`}[n]||e.charAt(0).toUpperCase()+e.slice(1).toLowerCase()} ${t}`}handleSave(){this.dispatchEvent(new CustomEvent(`save`,{detail:this.editForm,bubbles:!0,composed:!0}))}renderDetailRow(e,t,r=!1,i=!1){if(!t)return``;let a=n`${t}`;return r||e===`Email Address`||e===`Email`||e.endsWith(`Email`)||e.endsWith(this.i18nStore?.t(`contacts.email`)||`Email`)?a=n`<a href="mailto:${t}" @click=${e=>{e.preventDefault();let n=$t(this.contact?.name,t);this.composeStore?.openComposer({to:[n]})}}>${t}</a>`:i||e===`Phone`||e.endsWith(`Phone`)||e.endsWith(this.i18nStore?.t(`contacts.phone`)||`Phone`)?a=n`<a href="tel:${t}">${t}</a>`:e===`URL`&&(a=n`<a href=${t.startsWith(`http`)?t:`https://${t}`} target="_blank" rel="noopener noreferrer">${t}</a>`),n`
      <div class="detail-group">
        <div class="group-label">${e}</div>
        <div class="group-value">${a}</div>
      </div>
    `}get isStarred(){return this.selectedCount>0?this.allSelectedStarred:this.contact?.categories?.includes(`Favorites`)||!1}get formattedBirthday(){if(!this.contact?.birthday)return``;let e=String(this.contact.birthday),t=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,n=(e,t,n)=>{let r=new Date(2e3,0,1);return r.setFullYear(e,t-1,n),r.getMonth()===t-1&&r.getDate()===n?r:null},r=/^(?:--|0000-?)(\d{2})-?(\d{2})(?:T.*)?$/.exec(e);if(r){let[i,a]=[Number(r[1]),Number(r[2])];return n(2e3,i,a)?or(i,a,t):e}let i=/^(\d{4})-?(\d{2})-?(\d{2})(?:T.*)?$/.exec(e),a=i&&n(Number(i[1]),Number(i[2]),Number(i[3]));return a?ar(a,t,`24`).split(` `)[0]:e}render(){return!this.contact&&!this.isEditing&&this.selectedCount===0?n`
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
                ${t?A(`check`):n`<div style="width: 16px;"></div>`}
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
            <div class="selection-icon">${A(`users`)}</div>
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

            ${(this.editForm.emails||[]).map((e,t)=>n`
              <div class="multi-field-row">
                <alps-input 
                  placeholder="${this.i18nStore?.t(`contacts.email`)}" 
                  type="email"
                  .value=${e.value||``} 
                  @input=${e=>this.handleMultiInput(`emails`,t,`value`,e.target.value)}>
                </alps-input>
                <select class="multi-field-type" .value=${e.type||``} @change=${e=>this.handleMultiInput(`emails`,t,`type`,e.target.value)}>
                  <option value="" ?selected=${!e.type}>${this.i18nStore?.t(`contacts.typeDefault`)||`Default`}</option>
                  <option value="home" ?selected=${e.type?.toLowerCase()===`home`}>${this.i18nStore?.t(`contacts.typeHome`)||`Home`}</option>
                  <option value="work" ?selected=${e.type?.toLowerCase()===`work`}>${this.i18nStore?.t(`contacts.typeWork`)||`Work`}</option>
                  <option value="other" ?selected=${e.type?.toLowerCase()===`other`}>${this.i18nStore?.t(`contacts.typeOther`)||`Other`}</option>
                </select>
                ${(this.editForm.emails||[]).length>1?n`
                  <alps-icon-btn icon="trash" @click=${()=>this.removeMultiField(`emails`,t)} title="${this.i18nStore?.t(`contacts.delete`)}"></alps-icon-btn>
                `:``}
              </div>
            `)}
            <button type="button" class="add-field-btn" @click=${()=>this.addMultiField(`emails`)}>
              + ${this.i18nStore?.t(`contacts.addEmail`)||`Add Email`}
            </button>

            ${(this.editForm.phones||[]).map((e,t)=>n`
              <div class="multi-field-row">
                <alps-input 
                  placeholder="${this.i18nStore?.t(`contacts.phone`)}" 
                  .value=${e.value||``} 
                  @input=${e=>this.handleMultiInput(`phones`,t,`value`,e.target.value)}>
                </alps-input>
                <select class="multi-field-type" .value=${e.type||``} @change=${e=>this.handleMultiInput(`phones`,t,`type`,e.target.value)}>
                  <option value="" ?selected=${!e.type}>${this.i18nStore?.t(`contacts.typeDefault`)||`Default`}</option>
                  <option value="cell" ?selected=${e.type?.toLowerCase()===`cell`||e.type?.toLowerCase()===`mobile`}>${this.i18nStore?.t(`contacts.typeMobile`)||`Mobile`}</option>
                  <option value="home" ?selected=${e.type?.toLowerCase()===`home`}>${this.i18nStore?.t(`contacts.typeHome`)||`Home`}</option>
                  <option value="work" ?selected=${e.type?.toLowerCase()===`work`}>${this.i18nStore?.t(`contacts.typeWork`)||`Work`}</option>
                  <option value="other" ?selected=${e.type?.toLowerCase()===`other`}>${this.i18nStore?.t(`contacts.typeOther`)||`Other`}</option>
                </select>
                ${(this.editForm.phones||[]).length>1?n`
                  <alps-icon-btn icon="trash" @click=${()=>this.removeMultiField(`phones`,t)} title="${this.i18nStore?.t(`contacts.delete`)}"></alps-icon-btn>
                `:``}
              </div>
            `)}
            <button type="button" class="add-field-btn" @click=${()=>this.addMultiField(`phones`)}>
              + ${this.i18nStore?.t(`contacts.addPhone`)||`Add Phone`}
            </button>

            <alps-input placeholder="${this.i18nStore?.t(`contacts.address`)}" .value=${this.editForm.address||``} @input=${e=>this.handleInput(`address`,e.target.value)}></alps-input>
            <alps-input placeholder="${this.i18nStore?.t(`contacts.url`)}" type="url" .value=${this.editForm.url||``} @input=${e=>this.handleInput(`url`,e.target.value)}></alps-input>
            <!-- A date input shows no placeholder, so the birthday field's name is its label. -->
            <alps-input placeholder="${this.i18nStore?.t(`contacts.birthday`)}" label="${this.i18nStore?.t(`contacts.birthday`)}" type="date" .value=${this.editForm.birthday||``} @input=${e=>this.handleInput(`birthday`,e.target.value)}></alps-input>
            <textarea class="edit-textarea" placeholder="${this.i18nStore?.t(`contacts.notes`)}" .value=${this.editForm.note||``} @input=${e=>this.handleInput(`note`,e.target.value)}></textarea>
            <textarea class="edit-textarea" placeholder="${this.i18nStore?.t(`contacts.publicKey`)||`GPG Public Key Block`}" .value=${this.editForm.public_key||``} @input=${e=>this.handleInput(`public_key`,e.target.value)} style="font-family: monospace; white-space: pre;"></textarea>
          </div>
        `:n`
          <div class="view-header" style="margin-top: -32px;">
            <div class="view-name">
              ${this.contact.name||this.contact.email?Pt(this.contact.name,this.contact.email):this.i18nStore?.t(`contacts.unnamedContact`)||`Unnamed Contact`} ${this.contact.nickname?`(${this.contact.nickname})`:``}
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
            ${this.contact.emails&&this.contact.emails.length>0?this.contact.emails.map(e=>this.renderDetailRow(this.formatTypeLabel(e.type,this.i18nStore?.t(`contacts.email`)||`Email`),e.value,!0)):this.renderDetailRow(this.i18nStore?.t(`contacts.email`)||`Email`,this.contact.email,!0)}
            ${this.contact.phones&&this.contact.phones.length>0?this.contact.phones.map(e=>this.renderDetailRow(this.formatTypeLabel(e.type,this.i18nStore?.t(`contacts.phone`)||`Phone`),e.value,!1,!0)):this.renderDetailRow(this.i18nStore?.t(`contacts.phone`)||`Phone`,this.contact.phone,!1,!0)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.address`),this.contact.address)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.birthday`),this.formattedBirthday)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.url`),this.contact.url)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.notes`),this.contact.note)}
            ${this.renderDetailRow(this.i18nStore?.t(`contacts.publicKey`)||`Public Key`,this.contact.public_key)}
          </div>
        `}
        `}
      </div>
    `}};j([o({type:Object})],Y.prototype,`contact`,void 0),j([o({type:Boolean})],Y.prototype,`isEditing`,void 0),j([o({type:Boolean})],Y.prototype,`saving`,void 0),j([o({type:Array})],Y.prototype,`uniqueCategories`,void 0),j([o({type:Boolean})],Y.prototype,`isMobile`,void 0),j([o({type:Number})],Y.prototype,`selectedCount`,void 0),j([o({type:Boolean})],Y.prototype,`allSelectedStarred`,void 0),j([a()],Y.prototype,`scrolled`,void 0),j([h({context:w})],Y.prototype,`i18nStore`,void 0),j([h({context:es})],Y.prototype,`composeStore`,void 0),j([h({context:T,subscribe:!0})],Y.prototype,`settingsStore`,void 0),j([a()],Y.prototype,`editForm`,void 0),j([a()],Y.prototype,`isDirty`,void 0),j([a()],Y.prototype,`newCategoryName`,void 0),Y=j([p(`alps-contact-view`)],Y);var Rc=e({});b.registerRoute({path:`/contacts/*`,component:`contacts-page`,pluginId:`carddav`}),b.registerNavTab({id:`contacts`,pluginId:`carddav`,labelKey:`navigation.contacts`,icon:`users`,order:10}),b.registerHook(`composer:send`,async({recipients:e})=>{if(!(!e||!Array.isArray(e)))for(let t of e){let{name:e,email:n}=Zt(t);try{await L.createContact({name:e,email:n})}catch(e){console.error(`Failed to auto-save contact`,e)}}},`carddav`),b.registerHook(`composer:suggest`,async({query:e})=>{try{let t=(await L.fetchContacts(e)).contacts||[],n=[],r=new Set;for(let e of t){let t=e.name||``,i=e.emails&&e.emails.length>0?e.emails:e.email?[{value:e.email}]:[];for(let e of i){let i=e.value?.trim();i&&!r.has(i.toLowerCase())&&(r.add(i.toLowerCase()),n.push({name:t,address:i}))}}return n}catch(e){return console.error(`Failed to fetch contact suggestions`,e),[]}},`carddav`);var zc=class extends d{constructor(...e){super(...e),this.label=``,this.description=``}static{this.styles=_`
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
    `}};j([o({type:String})],zc.prototype,`label`,void 0),j([o({type:String})],zc.prototype,`description`,void 0),zc=j([p(`alps-setting-group`)],zc);function Bc(e,t){return new Promise(n=>{let r=document.createElement(`ui-prompt`);r.title=t?.t(`gpg.passphraseRequired`),r.confirmText=t?.t(`gpg.unlock`),r.cancelText=t?.t(`general.cancel`);let i=t?.t(`gpg.passphrasePrompt`);e&&(i+=` (Error: ${e})`),r.fields=[{id:`passphrase`,label:i,type:`password`,placeholder:t?.t(`gpg.passphrase`),autofocus:!0}];let a=()=>{r.parentNode&&r.parentNode.removeChild(r)};r.addEventListener(`submit`,e=>{n(e.detail.passphrase),a()}),r.addEventListener(`cancel`,()=>{n(null),a()}),document.body.appendChild(r)})}var Vc=null,Hc=0;function Uc(){Vc=null;try{sessionStorage.removeItem(`gpg_private_key`)}catch{}}window.addEventListener(`session-cleared`,()=>{Hc++,Uc()});function Wc(e,t){return t===Hc&&(Vc=e),e}async function Gc(e,t){if(Vc)return Vc;let n=Hc,r=await D(`/gpg/keys`);if(!r.ok)throw Error(`Failed to fetch GPG keyring.`);let i=await r.json();if(n!==Hc)throw Error(`The session ended.`);if(!i.encrypted_private_key)throw Error(`No private key found on server. Please generate one in Settings.`);let a=await e.readPrivateKey({armoredKey:i.encrypted_private_key});if(a.isDecrypted())return Wc(a,n);{let r,i=await Bc(r,t);for(;i!==null;)try{return Wc(await e.decryptKey({privateKey:a,passphrase:i}),n)}catch(e){r=`Incorrect passphrase: `+e.message,i=await Bc(r,t)}throw Error(`Passphrase prompt cancelled.`)}}async function Kc(e){let{instance:t,formData:n,composer:r}=e;if(!t.encryptGpg)return n;if(n.get(`attachment-uuids`)||n.get(`prev_attachments`)){let e=r?.i18nStore?.t(`gpg.attachmentsNotEncryptable`);return alert(e||`Attachments cannot be encrypted with inline PGP and would be sent unencrypted. Remove the attachments, or turn off encryption to send them.`),!1}try{let e=await C(()=>import(`./openpgp-Dr7OTnf5.js`).then(e=>e.t),__vite__mapDeps([0,1])),i=t.to||[],a=t.cc||[],o=t.bcc||[],s=[...i,...a,...o];if(s.length===0)return n;let c=[],l=[],u=Ue(We()).trim().toLowerCase();for(let t of s){let n=Zt(t).email||t.trim();if(u&&u===n.toLowerCase())continue;let r=(await L.fetchContacts(n)).contacts||[],i=!1;for(let t of r)if(t.public_key){let n=await e.readKey({armoredKey:t.public_key});c.push(n),i=!0;break}i||l.push(t)}if(l.length>0){let e=r.i18nStore?.t(`gpg.missingPublicKeys`),t=l.join(`
`);return alert(e?e.replace(`{keys}`,t):`Cannot encrypt: Missing public keys for:\n${t}`),!1}let d=await Gc(e,r.i18nStore),f=d.toPublic();c.push(f);let p=n.get(`text`)||``,m=n.get(`html`)||``,h=``;h=t.format===`html`&&m?m:p;let g=await e.createMessage({text:h}),_=await e.encrypt({message:g,encryptionKeys:c,signingKeys:d,format:`armored`});return n.set(`text`,_),n.set(`html`,``),n}catch(e){return alert(`GPG Encryption failed: `+e.message),!1}}async function qc(e){if(typeof e.content==`string`&&e.content.includes(`-----BEGIN PGP MESSAGE-----`))try{let t=await C(()=>import(`./openpgp-Dr7OTnf5.js`).then(e=>e.t),__vite__mapDeps([0,1])),r=e.content.indexOf(`-----BEGIN PGP MESSAGE-----`),i=e.content.indexOf(`-----END PGP MESSAGE-----`)+25;if(r===-1||i<=r)return e.content;let a=e.content.substring(r,i),o=await Gc(t,e.i18nStore),s=await t.readMessage({armoredMessage:a}),{data:c}=await t.decrypt({message:s,decryptionKeys:o,format:`utf8`}),l=String(c);l.includes(`<html`)||l.includes(`<body`)||l.includes(`<p>`)||l.includes(`<div`)||l.includes(`<br`)||(l=l.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/\n/g,`<br/>`));let u=e.content.substring(0,r)+l+e.content.substring(i);return e.banners=e.banners||[],e.banners.push(n`
              <alps-banner variant="info">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex; width: 16px; height: 16px;">${A(`lock`)}</span>
                  <span>${e.i18nStore?.t(`gpg.decryptedSuccess`)}</span>
                </span>
              </alps-banner>
            `),e.isHtml=!0,u}catch(t){return console.error(`Decryption failed:`,t),e.banners=e.banners||[],e.banners.push(n`
              <alps-banner variant="error">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex; width: 16px; height: 16px;">${A(`lock`)}</span>
                  <span>${e.i18nStore?.t(`gpg.decryptedFailed`)}</span>
                </span>
              </alps-banner>
            `),e.content}return e.content}var X=class extends d{constructor(...e){super(...e),this.loading=!0,this.generating=!1,this.importing=!1,this.importError=``,this.keyring=null,this.pubKeyInput=``,this.privKeyInput=``,this.viewState=`default`,this.showPassphrasePrompt=!1,this.passphrasePromptMode=`lock`,this.showPurgeConfirm=!1,this.resolvePassphrase=null,this.resolveError=null}static{this.styles=_`
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
    `}async connectedCallback(){super.connectedCallback(),await this.fetchKeys()}async fetchKeys(){this.loading=!0;try{let e=await D(`/gpg/keys`);if(e.ok){let t=await e.json();t.public_key?this.keyring=t:this.keyring=null}}catch(e){console.error(e)}finally{this.loading=!1}}promptForPassphrase(e=`lock`){return this.passphrasePromptMode=e,this.showPassphrasePrompt=!0,new Promise(e=>{this.resolvePassphrase=e})}showErrorDialog(e){return this.importError=e,new Promise(e=>{this.resolveError=e})}clearError(){this.importError=``,this.resolveError&&=(this.resolveError(),null)}async getConfirmedPassphrase(){for(;;){let e=await this.promptForPassphrase(`lock`);if(!e)return null;let t=await this.promptForPassphrase(`confirm`);if(!t)return null;if(e===t)return e;await this.showErrorDialog(this.i18nStore?.t(`gpg.passphraseMismatch`))}}handlePassphraseSubmit(e){this.resolvePassphrase&&=(this.resolvePassphrase(e),null),this.showPassphrasePrompt=!1}handlePassphraseCancel(){this.resolvePassphrase&&=(this.resolvePassphrase(null),null),this.showPassphrasePrompt=!1}async generateKeys(){let e=await this.getConfirmedPassphrase();if(e){this.generating=!0;try{let{privateKey:t,publicKey:n}=await(await C(()=>import(`./openpgp-Dr7OTnf5.js`).then(e=>e.t),__vite__mapDeps([0,1]))).generateKey({type:`ecc`,curve:`curve25519`,userIDs:[{name:`ALPS User`,email:``}],passphrase:e});await D(`/gpg/keys`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({public_key:n,encrypted_private_key:t})}),await this.fetchKeys()}catch(e){alert(this.i18nStore?.t(`gpg.generateFailed`,{error:e.message}))}finally{this.generating=!1}}}async importKeys(){if(!this.pubKeyInput||!this.privKeyInput){this.importError=this.i18nStore?.t(`gpg.importMissing`);return}this.importing=!0;let e,t;try{e=await C(()=>import(`./openpgp-Dr7OTnf5.js`).then(e=>e.t),__vite__mapDeps([0,1])),await e.readKey({armoredKey:this.pubKeyInput}),t=await e.readPrivateKey({armoredKey:this.privKeyInput})}catch(e){this.importing=!1,this.importError=this.i18nStore?.t(`gpg.importFailed`,{error:e.message});return}if(this.importing=!1,!t.isDecrypted()){let n=await this.promptForPassphrase(`unlock`);for(;n!==null;)try{t=await e.decryptKey({privateKey:t,passphrase:n});break}catch{await this.showErrorDialog(this.i18nStore?.t(`gpg.importIncorrectPassphrase`)),n=await this.promptForPassphrase(`unlock`)}if(!t.isDecrypted())return}let n=await this.getConfirmedPassphrase();if(n){this.importing=!0;try{let r=await e.encryptKey({privateKey:t,passphrase:n});await D(`/gpg/keys`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({public_key:this.pubKeyInput,encrypted_private_key:r})}),this.pubKeyInput=``,this.privKeyInput=``,this.viewState=`default`,await this.fetchKeys()}catch(e){this.importError=this.i18nStore?.t(`gpg.importFailed`,{error:e.message})}finally{this.importing=!1}}}async purgeKeys(){this.loading=!0,this.showPurgeConfirm=!1,await D(`/gpg/keys`,{method:`DELETE`}),this.keyring=null,Uc(),this.loading=!1}render(){return this.loading||this.generating?n`<alps-loader full-height .text=${this.generating?`Generating keypair...`:`Loading...`}></alps-loader>`:n`
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
        `}};j([h({context:w,subscribe:!0})],X.prototype,`i18nStore`,void 0),j([a()],X.prototype,`loading`,void 0),j([a()],X.prototype,`generating`,void 0),j([a()],X.prototype,`importing`,void 0),j([a()],X.prototype,`importError`,void 0),j([a()],X.prototype,`keyring`,void 0),j([a()],X.prototype,`pubKeyInput`,void 0),j([a()],X.prototype,`privKeyInput`,void 0),j([a()],X.prototype,`viewState`,void 0),j([a()],X.prototype,`showPassphrasePrompt`,void 0),j([a()],X.prototype,`passphrasePromptMode`,void 0),j([a()],X.prototype,`showPurgeConfirm`,void 0),X=j([p(`alps-gpg-settings`)],X);var Jc=e({});b.registerSettingsTab({id:`gpg`,labelKey:`settings.gpg`,icon:`key`,component:`alps-gpg-settings`}),b.registerHook(`composer:toolbar`,e=>{let t=e.instance,r=e.composer,i=t.encryptGpg||!1;return n`
        <alps-icon-btn 
            title="${r.i18nStore?.t(`gpg.toggleEncryption`)}" 
            icon="lock"
            ?active=${i}
            @click=${()=>{r.composeStore.updateComposer(t.id,{encryptGpg:!i})}}>
        </alps-icon-btn>
    `},`gpg`),b.registerHook(`composer:presend`,Kc,`gpg`),b.registerHook(`reader:content`,qc,`gpg`);function Yc(e){return`"`+String(e??``).replace(/[\u0000-\u001f\u007f]/g,``).replace(/\\/g,`\\\\`).replace(/"/g,`\\"`)+`"`}function Xc(e){let t=new TextEncoder().encode(JSON.stringify(e)),n=``;for(let e of t)n+=String.fromCharCode(e);return btoa(n)}function Zc(e){let t=atob(e),n=Uint8Array.from(t,e=>e.charCodeAt(0));try{return new TextDecoder(`utf-8`,{fatal:!0}).decode(n)}catch{return t}}var Qc=class{static extractVisualState(e){let t=e.match(/^# ALPS_VISUAL_STATE: (.*)$/m);if(!t)return null;try{return JSON.parse(Zc(t[1]))}catch{return null}}static compile(e){if(e.rules.length===0)return``;let t=new Set;for(let n of e.rules){for(let e of n.actions)e.type===`fileinto`&&(t.add(`fileinto`),t.add(`mailbox`));for(let e of n.conditions)e.field.toLowerCase()===`body`&&t.add(`body`)}let n=``;t.size>0&&(n+=`require [${Array.from(t).map(e=>`"${e}"`).join(`, `)}];\n\n`),n+=`# ALPS_VISUAL_STATE: ${Xc(e)}\n\n`;for(let t of e.rules){if(t.conditions.length===0||t.actions.length===0)continue;let e=t.conditions.map(e=>this.compileCondition(e)),r=``;r=e.length===1?`if ${e[0]}`:t.matchType===`all`?`if allof (${e.join(`, `)})`:`if anyof (${e.join(`, `)})`,n+=`${r} {\n`;for(let e of t.actions)n+=`  ${this.compileAction(e)}\n`;n+=`}

`}return n}static compileCondition(e){let t=e.field.toLowerCase();if(t===`size`){let t=String(e.value??``).trim();return/^\d+[KMG]?$/i.test(t)?`size :${e.operator} ${t}`:`size :${e.operator} 0`}if(t===`body`)return`${e.operator===`not_contains`||e.operator===`not_is`?`not `:``}body :text ${e.operator===`is`||e.operator===`not_is`?`:is`:`:contains`} ${Yc(e.value)}`;let n=``,r=``;return e.operator===`contains`?(n=``,r=`:contains`):e.operator===`not_contains`?(n=`not `,r=`:contains`):e.operator===`is`?(n=``,r=`:is`):e.operator===`not_is`&&(n=`not `,r=`:is`),`${n}header ${r} ${Yc(e.field)} ${Yc(e.value)}`}static compileAction(e){switch(e.type){case`fileinto`:return`fileinto :create ${Yc(e.value??``)};`;case`discard`:return`discard;`;case`redirect`:return`redirect ${Yc(e.value??``)};`;case`stop`:return`stop;`}return``}},$c={enabled:!1,subject:``,message:``,start:``,end:``,days:7},el=[1,3,7,14,30],tl=`# ALPS_AUTOREPLY: `,nl=`# ALPS_AUTOREPLY_END`,rl=/^# ALPS_AUTOREPLY: (\S*)[ \t]*\r?\n(?:[^\n]*\n)*?# ALPS_AUTOREPLY_END[ \t]*(?:\r?\n|$)/m,il=/^\d{4}-\d{2}-\d{2}$/;function al(e){let t=e=>typeof e==`string`&&il.test(e)?e:``,n=e.days;return{enabled:e.enabled===!0,subject:typeof e.subject==`string`?e.subject:``,message:typeof e.message==`string`?e.message:``,start:t(e.start),end:t(e.end),days:typeof n==`number`&&Number.isInteger(n)&&n>=1?n:$c.days}}function ol(e){let t=``;for(let n of new TextEncoder().encode(JSON.stringify(e)))t+=String.fromCharCode(n);return btoa(t)}function sl(e){try{let t=Uint8Array.from(atob(e),e=>e.charCodeAt(0)),n=JSON.parse(new TextDecoder(`utf-8`,{fatal:!0}).decode(t));return n&&typeof n==`object`?al(n):null}catch{return null}}function cl(e){return`"`+e.replace(/\r\n?/g,`
`).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,``).replace(/\\/g,`\\\\`).replace(/"/g,`\\"`).replace(/^#/gm,`\\#`)+`"`}function ll(e){let t=Math.abs(e),n=e=>String(e).padStart(2,`0`);return`${e<0?`-`:`+`}${n(Math.floor(t/60))}${n(t%60)}`}function ul(e,t,n){return ll(-new Date(e,t-1,n).getTimezoneOffset())}function dl(e){let[t,n,r]=e.split(`-`).map(Number);return[t,n,r]}function fl(e){let[t,n,r]=dl(e),i=new Date(Date.UTC(t,n-1,r+1));return[i.getUTCFullYear(),i.getUTCMonth()+1,i.getUTCDate()]}function pl(e,t={}){let n=al(e),r=[tl+ol(n)];if(n.enabled){let e=t.zoneOf??ul,i=[];n.start&&i.push(`currentdate :zone ${Yc(e(...dl(n.start)))} :value "ge" "date" ${Yc(n.start)}`),n.end&&i.push(`currentdate :zone ${Yc(e(...fl(n.end)))} :value "le" "date" ${Yc(n.end)}`);let a=i.length>0?[`vacation`,`date`,`relational`]:[`vacation`];r.push(`require [${a.map(e=>`"${e}"`).join(`, `)}];`);let o=`vacation :days ${n.days}`,s=t.address?.trim();s?.includes(`@`)&&(o+=` :from ${Yc(s)} :addresses [${Yc(s)}]`);let c=n.subject.replace(/[\u0000-\u001f\u007f]/g,``).trim();c&&(o+=` :subject ${Yc(c)}`),o+=` ${cl(n.message)};`,i.length===0?r.push(o):r.push(`if ${i.length===1?i[0]:`allof (${i.join(`, `)})`} {`,`\t${o}`,`}`)}return r.push(nl),r.join(`
`)+`
`}function ml(e){let t=rl.exec(e);return t?{reply:sl(t[1]),block:t[0],filters:e.slice(0,t.index)+e.slice(t.index+t[0].length)}:{reply:null,block:``,filters:e}}function hl(e,t){if(!e)return t;let{at:n,newline:r}=_l(t);return t.slice(0,n)+(r?`
`:``)+e+t.slice(n)}function gl(e){for(let t of vl(e))if(t.kind===`word`&&t.text.toLowerCase()===`vacation`)return!0;return!1}function _l(e){let t=0,n=!1;for(let r of vl(e)){if(n){r.kind===`punct`&&r.text===`;`&&(t=r.end,n=!1);continue}if(r.kind!==`word`||r.text.toLowerCase()!==`require`)break;n=!0}if(t===0)return{at:0,newline:!1};let r=t;for(;;){for(;e[r]===` `||e[r]===`	`;)r++;let t=e.startsWith(`/*`,r)?e.indexOf(`*/`,r+2):-1;if(t<0||e.slice(r,t).includes(`
`))break;r=t+2}if(e[r]===`#`){let t=e.indexOf(`
`,r);r=t<0?e.length:t}return e.startsWith(`\r
`,r)?{at:r+2,newline:!1}:e[r]===`
`?{at:r+1,newline:!1}:r>=e.length?{at:e.length,newline:!0}:{at:t,newline:!0}}function*vl(e){let t=e.length,n=0;for(;n<t;){let r=e[n];if(r===` `||r===`	`||r===`\r`||r===`
`){n++;continue}if(r===`#`){let r=e.indexOf(`
`,n);n=r<0?t:r+1;continue}if(r===`/`&&e[n+1]===`*`){let t=e.indexOf(`*/`,n+2);if(t<0)return;n=t+2;continue}let i=n;if(r===`"`){for(n++;n<t&&e[n]!==`"`;)n+=e[n]===`\\`?2:1;if(n>=t)return;n++,yield{kind:`string`,text:e.slice(i,n),end:n};continue}if(/[A-Za-z_]/.test(r)){for(;n<t&&/\w/.test(e[n]);)n++;let r=e.slice(i,n);if(r.toLowerCase()===`text`&&e[n]===`:`){let r=e.indexOf(`
`,n);for(;;){if(r<0)return;let i=e.indexOf(`
`,r+1);if(e.slice(r+1,i<0?t:i).replace(/\r$/,``)===`.`){n=i<0?t:i+1;break}r=i}yield{kind:`string`,text:e.slice(i,n),end:n};continue}yield{kind:`word`,text:r,end:n};continue}if(r===`:`){for(n++;n<t&&/\w/.test(e[n]);)n++;yield{kind:`tag`,text:e.slice(i,n),end:n};continue}if(/\d/.test(r)){for(;n<t&&/\d/.test(e[n]);)n++;/[KMG]/i.test(e[n]??``)&&n++,yield{kind:`number`,text:e.slice(i,n),end:n};continue}n++,yield{kind:`punct`,text:r,end:n}}}var yl=class extends Error{constructor(){super(`The script would send two vacation replies`),this.name=`TwoVacationsError`}},bl=new class{async fetchStored(){let e=await D(`/managesieve/script`);if(!e.ok)throw Error(`Failed to fetch script: ${e.statusText}`);let t=await e.json();return{content:typeof t.content==`string`?t.content:``,extensions:Array.isArray(t.extensions)?t.extensions:[]}}async fetchScript(){let{content:e}=await this.fetchStored();return{content:ml(e).filters}}async saveScript(e,t=`PUT`){let{content:n}=await this.fetchStored(),{block:r}=ml(n),i=gl(r);if(i&&gl(e))throw new yl;return await this.putScript(hl(r,e),t),{autoReplyOn:i}}async fetchAutoReply(){let{content:e,extensions:t}=await this.fetchStored(),{reply:n,filters:r}=ml(e);return{reply:n,extensions:t,ownVacation:gl(r)}}async saveAutoReply(e,t){let{content:n}=await this.fetchStored(),{filters:r}=ml(n);if(e.enabled&&gl(r))throw new yl;return this.putScript(hl(pl(e,{address:t}),r))}async putScript(e,t=`PUT`){let n=await D(`/managesieve/script`,{method:t,headers:{"Content-Type":`application/json`},body:JSON.stringify({content:e})});if(!n.ok){let e=await n.json().catch(()=>({}));throw Error(e.error||`Failed to save script`)}return n.json()}async validateScript(e){let t=await D(`/managesieve/validate`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({content:e})});if(!t.ok){let e=await t.json().catch(()=>({}));throw Error(e.error||`Validation failed`)}return t.json()}async fetchFolders(){let e=await D(`/mailboxes/INBOX`);if(!e.ok)throw Error(`Failed to fetch mailboxes: ${e.statusText}`);return e.json()}},xl=class extends d{constructor(...e){super(...e),this.isDirty=!1,this.script=``,this.stored=``,this.isValidating=!1,this.isSaving=!1}static{this.styles=_`
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
`)&&(t+=` `),m(t)}handleScroll(e){let t=e.target,n=this.shadowRoot?.querySelector(`.highlight-layer`);n&&(n.scrollTop=t.scrollTop,n.scrollLeft=t.scrollLeft)}handleInput(e){let t=e.target;this.script=t.value,this.dispatchEvent(new CustomEvent(`script-changed`,{detail:{script:this.script}}))}async validate(){this.isValidating=!0;let e=this.script;try{if(await bl.validateScript(e),this.script!==e)return;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore.t(`managesieve.toast.valid`),duration:3e3}}))}catch(t){if(this.script!==e)return;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:t.message||this.i18nStore.t(`managesieve.toast.networkError`),duration:5e3,type:`error`}}))}finally{this.isValidating=!1}}async save(){this.isSaving=!0;let e=this.script;try{let{autoReplyOn:t}=await bl.saveScript(e,`PUT`);this.stored=e,this.dispatchEvent(new CustomEvent(`script-saved`,{detail:{script:e}}));let n=e.trim()===``&&!t?`managesieve.toast.deactivated`:`managesieve.toast.saved`;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore.t(n),duration:3e3}}))}catch(e){let t=e instanceof yl?this.i18nStore.t(`managesieve.toast.autoReplyOn`):e.message||this.i18nStore.t(`managesieve.toast.networkError`);window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:t,duration:5e3,type:`error`}}))}finally{this.isSaving=!1}}render(){return n`
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
		`}};j([a()],xl.prototype,`isDirty`,void 0),j([h({context:w})],xl.prototype,`i18nStore`,void 0),j([o({type:String})],xl.prototype,`script`,void 0),j([o({type:String})],xl.prototype,`stored`,void 0),j([a()],xl.prototype,`isValidating`,void 0),j([a()],xl.prototype,`isSaving`,void 0),xl=j([p(`alps-raw-editor`)],xl);var Sl=class extends d{constructor(...e){super(...e),this.isSaving=!1,this.initialSnapshot=``,this.state={rules:[]},this.folders=[]}willUpdate(e){e.has(`state`)&&this.initialSnapshot===``&&(this.initialSnapshot=JSON.stringify(this.state))}get isDirty(){return this.initialSnapshot!==``&&this.initialSnapshot!==JSON.stringify(this.state)}markClean(e=JSON.stringify(this.state)){this.initialSnapshot=e,this.requestUpdate()}static{this.styles=_`
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
								<alps-input class="flex-1" label=${this.i18nStore.t(`managesieve.visual.value`)} .value=${r.value} @input=${e=>this.updateCondition(t,i,{value:e.target.value})}></alps-input>
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
		`}};j([o({type:Boolean})],Sl.prototype,`isSaving`,void 0),j([a()],Sl.prototype,`initialSnapshot`,void 0),j([h({context:w,subscribe:!0})],Sl.prototype,`i18nStore`,void 0),j([o({type:Object})],Sl.prototype,`state`,void 0),j([o({type:Array})],Sl.prototype,`folders`,void 0),Sl=j([p(`alps-visual-editor`)],Sl);var Cl=class extends d{constructor(...e){super(...e),this.mode=`visual`,this.script=``,this.storedScript=``,this.visualState={rules:[]},this.folders=[],this.isLoading=!0,this.loadFailed=!1,this.isSaving=!1,this.showSwitchRawConfirm=!1}static{this.styles=_`
		.container {
			display: flex;
			flex-direction: column;
			gap: 20px;
			padding-bottom: 32px;
		}
		.load-error {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
			color: var(--text-secondary);
			line-height: 1.4;
		}
		.switch-btn-container {
			margin-top: 16px;
			padding-top: 16px;
			border-top: 1px solid var(--border-color, #eee);
		}
	`}connectedCallback(){super.connectedCallback(),this.fetchScript(),this.fetchFolders()}async fetchScript(){this.isLoading=!0,this.loadFailed=!1;try{let e=await bl.fetchScript();if(this.script=e.content||``,this.storedScript=this.script,this.script.trim()===``)this.mode=`visual`,this.visualState={rules:[]};else{let e=Qc.extractVisualState(this.script);e?(this.visualState=e,this.mode=`visual`):this.mode=`raw`}}catch(e){console.error(`Failed to fetch Sieve script`,e),this.loadFailed=!0}finally{this.isLoading=!1}}async fetchFolders(){try{let e=await bl.fetchFolders();e&&e.Mailboxes&&(this.folders=e.Mailboxes.map(e=>e.Name||e.Mailbox).filter(Boolean))}catch(e){console.error(`Failed to fetch folders`,e)}}handleVisualStateChange(e){this.visualState=e.detail.state}handleRawScriptChange(e){this.script=e.detail.script}switchToRaw(){this.showSwitchRawConfirm=!0}confirmSwitchToRaw(){this.script=Qc.compile(this.visualState),this.mode=`raw`,this.showSwitchRawConfirm=!1}async saveVisual(){this.isSaving=!0;try{let e=Qc.compile(this.visualState);this.script=e;let t=JSON.stringify(this.visualState),{autoReplyOn:n}=await bl.saveScript(e,`PUT`);this.storedScript=e;let r=e.trim()===``&&!n?`managesieve.toast.deactivated`:`managesieve.toast.saved`;window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore.t(r),duration:3e3}}));let i=this.shadowRoot?.querySelector(`alps-visual-editor`);i&&i.markClean&&i.markClean(t)}catch(e){let t=e instanceof yl?this.i18nStore.t(`managesieve.toast.autoReplyOn`):e.message||this.i18nStore.t(`managesieve.toast.networkError`);window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:t,duration:5e3,type:`error`}}))}finally{this.isSaving=!1}}render(){return n`
			<div class="container">
				<alps-setting-group label="${this.i18nStore.t(`managesieve.title`)}" description="${this.i18nStore.t(`managesieve.description`)}">
					${this.isLoading?n`
						<div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
							<alps-loader></alps-loader>
						</div>
					`:this.loadFailed?n`
						<div class="load-error">
							<div role="alert">${this.i18nStore.t(`managesieve.loadError`)}</div>
							<alps-button variant="normal" @click=${()=>this.fetchScript()}>
								${this.i18nStore.t(`managesieve.loadErrorRetry`)}
							</alps-button>
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
		`}};j([h({context:w,subscribe:!0})],Cl.prototype,`i18nStore`,void 0),j([a()],Cl.prototype,`mode`,void 0),j([a()],Cl.prototype,`script`,void 0),j([a()],Cl.prototype,`storedScript`,void 0),j([a()],Cl.prototype,`visualState`,void 0),j([a()],Cl.prototype,`folders`,void 0),j([a()],Cl.prototype,`isLoading`,void 0),j([a()],Cl.prototype,`loadFailed`,void 0),j([a()],Cl.prototype,`isSaving`,void 0),j([a()],Cl.prototype,`showSwitchRawConfirm`,void 0),Cl=j([p(`alps-managesieve-page`)],Cl);function wl(){let e=new Date,t=e=>String(e).padStart(2,`0`);return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}`}var Tl=class extends d{constructor(...e){super(...e),this.loading=!0,this.loadFailed=!1,this.extensions=[],this.ownVacation=!1,this.stored=$c,this.draft=$c,this.saving=!1,this.error=``}static{this.styles=_`
		.loading {
			display: flex;
			justify-content: center;
			align-items: center;
			min-height: 200px;
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
		.state {
			font-size: 13px;
			color: var(--text-muted);
		}
		.state.on {
			color: var(--warning, #f59e0b);
		}
		.notice {
			color: var(--text-secondary);
			line-height: 1.4;
		}
		textarea {
			width: 100%;
			min-height: 140px;
			box-sizing: border-box;
			padding: var(--input-padding, 8px 12px);
			border: 1px solid var(--border-color);
			border-radius: var(--input-radius, 6px);
			background-color: var(--bg-primary);
			color: var(--text-primary);
			font-size: var(--input-font-size, 14px);
			font-family: var(--font-base);
			line-height: 1.5;
			resize: vertical;
			outline: none;
		}
		textarea:focus {
			border-color: var(--accent-color, #2563eb);
			box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
		}
		.dates {
			display: flex;
			gap: 16px;
			flex-wrap: wrap;
		}
		.dates > label {
			display: flex;
			flex-direction: column;
			gap: 6px;
			flex: 1;
			min-width: 160px;
		}
		.field-label {
			font-size: 13px;
			color: var(--text-secondary);
		}
		.actions {
			display: flex;
			align-items: center;
			gap: 12px;
			flex-wrap: wrap;
		}
		.error-message {
			color: var(--danger-color, #dc2626);
			font-size: 13px;
		}
	`}connectedCallback(){super.connectedCallback(),this.load()}async load(){try{let{reply:e,extensions:t,ownVacation:n}=await bl.fetchAutoReply();this.extensions=t,this.ownVacation=n,this.stored=e??$c,this.draft=this.offersDates?this.stored:{...this.stored,start:``,end:``}}catch(e){console.error(`Failed to fetch the auto-reply`,e),this.loadFailed=!0}finally{this.loading=!1}}t(e,t){return this.i18nStore?.t(e,t)??e}get offersDates(){return this.extensions.includes(`date`)&&this.extensions.includes(`relational`)}get dirty(){return JSON.stringify(this.draft)!==JSON.stringify(this.stored)}get address(){let e=this.settingsStore?.getState();return e?.loginAddress||e?.loginUsername||void 0}edit(e){this.draft={...this.draft,...e},this.error=``}problem(e){return e.enabled&&e.message.trim()===``?`managesieve.autoReply.errors.emptyMessage`:e.start&&e.end&&e.start>e.end?`managesieve.autoReply.errors.invalidWindow`:null}async save(){if(this.saving)return;let e=this.draft,t=this.problem(e);if(t){this.error=this.t(t);return}this.saving=!0;let n=this.stored.enabled&&!e.enabled;try{await bl.saveAutoReply(e,this.address),this.stored=e;let t=this.t(n?`managesieve.autoReply.turnedOff`:`managesieve.autoReply.saved`);window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:t,duration:3e3}}))}catch(e){if(e instanceof yl){this.ownVacation=!0;return}console.error(`Failed to save the auto-reply`,e),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.t(`managesieve.autoReply.errors.saveError`),duration:5e3,type:`error`}}))}finally{this.saving=!1}}formatDay(e){let[t,n,r]=e.split(`-`).map(Number);return new Date(t,n-1,r).toLocaleDateString(this.i18nStore?.getIntlLanguage(),{year:`numeric`,month:`short`,day:`numeric`})}renderState(){let{enabled:e,start:t,end:r}=this.stored;if(!e)return c;let i=wl();return t&&t>i?n`<div class="state">${this.t(`managesieve.autoReply.stateScheduled`,{date:this.formatDay(t)})}</div>`:r&&r<i?n`<div class="state">${this.t(`managesieve.autoReply.stateFinished`)}</div>`:n`<div class="state on">${r?this.t(`managesieve.autoReply.stateActiveUntil`,{date:this.formatDay(r)}):this.t(`managesieve.autoReply.stateActive`)}</div>`}renderIntro(e){return n`
			<alps-setting-group label=${this.t(`managesieve.autoReply.title`)} description=${this.t(`managesieve.autoReply.description`)}>
				${e}
			</alps-setting-group>
		`}render(){if(this.loading)return n`<div class="loading"><alps-loader></alps-loader></div>`;if(this.loadFailed)return this.renderIntro(n`<div class="notice">${this.t(`managesieve.autoReply.errors.loadError`)}</div>`);if(!this.extensions.includes(`vacation`))return this.renderIntro(n`<div class="notice">${this.t(`managesieve.autoReply.unsupported`)}</div>`);if(this.ownVacation)return this.renderIntro(n`<div class="notice">${this.t(`managesieve.autoReply.ownVacation`)}</div>`);let e=this.draft,t=el.includes(e.days)?el:[...el,e.days].sort((e,t)=>e-t);return n`
			${this.renderIntro(n`
				<label class="checkbox-label">
					<input type="checkbox" .checked=${e.enabled}
						@change=${e=>this.edit({enabled:e.target.checked})}>
					${this.t(`managesieve.autoReply.enable`)}
				</label>
				${this.renderState()}
			`)}

			<alps-setting-group label=${this.t(`managesieve.autoReply.subject`)} description=${this.t(`managesieve.autoReply.subjectDesc`)}>
				<alps-input class="subject" .value=${e.subject} placeholder=${this.t(`managesieve.autoReply.subjectPlaceholder`)}
					@input=${e=>this.edit({subject:e.target.value})}></alps-input>
			</alps-setting-group>

			<alps-setting-group label=${this.t(`managesieve.autoReply.message`)} description=${this.t(`managesieve.autoReply.messageDesc`)}>
				<textarea dir="auto" .value=${e.message} placeholder=${this.t(`managesieve.autoReply.messagePlaceholder`)}
					@input=${e=>this.edit({message:e.target.value})}></textarea>
			</alps-setting-group>

			${this.offersDates?n`
				<alps-setting-group label=${this.t(`managesieve.autoReply.dates`)} description=${this.t(`managesieve.autoReply.datesDesc`)}>
					<div class="dates">
						<label>
							<span class="field-label">${this.t(`managesieve.autoReply.startDate`)}</span>
							<alps-input class="start" type="date" .value=${e.start}
								@input=${e=>this.edit({start:e.target.value})}></alps-input>
						</label>
						<label>
							<span class="field-label">${this.t(`managesieve.autoReply.endDate`)}</span>
							<alps-input class="end" type="date" .value=${e.end}
								@input=${e=>this.edit({end:e.target.value})}></alps-input>
						</label>
					</div>
				</alps-setting-group>
			`:c}

			<alps-setting-group label=${this.t(`managesieve.autoReply.interval`)} description=${this.t(`managesieve.autoReply.intervalDesc`)}>
				<alps-select .value=${String(e.days)}
					.options=${t.map(e=>({value:String(e),label:this.t(`managesieve.autoReply.days`,{count:e})}))}
					@change=${e=>this.edit({days:Number(e.target.value)})}></alps-select>
			</alps-setting-group>

			<alps-setting-group>
				<div class="actions">
					<alps-button variant="primary" ?spinning=${this.saving} ?disabled=${this.saving||!this.dirty} @click=${this.save}>
						${this.t(`managesieve.autoReply.save`)}
					</alps-button>
					${this.error?n`<div class="error-message" role="alert">${this.error}</div>`:c}
				</div>
			</alps-setting-group>
		`}};j([h({context:w,subscribe:!0})],Tl.prototype,`i18nStore`,void 0),j([h({context:T})],Tl.prototype,`settingsStore`,void 0),j([a()],Tl.prototype,`loading`,void 0),j([a()],Tl.prototype,`loadFailed`,void 0),j([a()],Tl.prototype,`extensions`,void 0),j([a()],Tl.prototype,`ownVacation`,void 0),j([a()],Tl.prototype,`stored`,void 0),j([a()],Tl.prototype,`draft`,void 0),j([a()],Tl.prototype,`saving`,void 0),j([a()],Tl.prototype,`error`,void 0),Tl=j([p(`alps-auto-reply-page`)],Tl);var El=e({});b.registerSettingsTab({id:`managesieve`,labelKey:`settings.categories.filters`,icon:`sieve`,component:`alps-managesieve-page`}),b.registerSettingsTab({id:`autoreply`,pluginId:`managesieve`,labelKey:`settings.categories.autoReply`,icon:`arrowBendUpLeft`,component:`alps-auto-reply-page`});var Dl=class extends d{constructor(...e){super(...e),this.passwordForm={old:``,new:``,confirm:``},this.isSubmitting=!1}static{this.styles=_`
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
	`}handlePasswordFormChange(e,t){let n=e.target;this.passwordForm={...this.passwordForm,[t]:n.value}}async submitPasswordChange(){if(!this.passwordForm.old||!this.passwordForm.new||!this.passwordForm.confirm){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`settings.password.fillAllFields`),timeout:3e3}}));return}if(this.passwordForm.new!==this.passwordForm.confirm){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`settings.password.passwordMismatch`),timeout:3e3}}));return}this.isSubmitting=!0;try{let e=await D(`/password/change`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({old_password:this.passwordForm.old,password:this.passwordForm.new})}),t=await e.json();e.ok?(window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:t.message||`Password successfully changed.`,timeout:3e3}})),this.passwordForm={old:``,new:``,confirm:``}):window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:t.error||`Failed to change password.`,timeout:3e3}}))}catch{window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`login.networkError`),timeout:3e3}}))}finally{this.isSubmitting=!1}}render(){return n`
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
	`}};j([h({context:w})],Dl.prototype,`i18nStore`,void 0),j([a()],Dl.prototype,`passwordForm`,void 0),j([a()],Dl.prototype,`isSubmitting`,void 0),Dl=j([p(`alps-password-settings`)],Dl);var Ol=e({});b.registerSettingsTab({id:`password`,labelKey:`settings.categories.password`,icon:`password`,component:`alps-password-settings`});var kl=class{get currentPath(){return this.getHashPath()}constructor(e,t,n){this.routes=e,this.fallback=t,this.onHashChange=()=>n()}hostConnected(){window.addEventListener(`hashchange`,this.onHashChange),this.onHashChange()}hostDisconnected(){window.removeEventListener(`hashchange`,this.onHashChange)}getHashPath(){let e=window.location.hash;return!e||e===`#`?`/`:e.substring(1).split(`?`)[0]}navigate(e){window.location.hash=e}render(){if(this.routes[this.currentPath])return this.routes[this.currentPath]();for(let e in this.routes)if(e.endsWith(`/*`)&&this.currentPath.startsWith(e.replace(`/*`,``)))return this.routes[e]();return this.fallback()}},Al=class extends d{constructor(...e){super(...e),this.icon=``,this.logo=``,this.logoDark=``,this.builtinLogo=``,this.title=``,this.subtitle=``}static{this.styles=_`
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

    /* A deployment's own logo: any shape, kept within the card. With one for
       each mode, the page's mode picks it: index.css sets the two displays. */
    .logo-container img {
      display: block;
      max-width: 100%;
      max-height: 56px;
    }

    .logo-container img.light-only {
      display: var(--light-only-display, block);
    }

    .logo-container img.dark-only {
      display: var(--dark-only-display, none);
    }

    /* A logo alps ships: as wide as its viewBox makes it at this height. */
    .logo-container svg.builtin-logo {
      width: auto;
      height: 32px;
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
  `}render(){let e=Ce[this.builtinLogo];return n`
      <div class="card">
        ${this.logo?n`
          <div class="logo-container">
            <img class=${this.logoDark?`light-only`:``} src=${this.logo} alt="">
            ${this.logoDark?n`<img class="dark-only" src=${this.logoDark} alt="">`:``}
          </div>
        `:e?n`
          <div class="logo-container">
            <svg class="builtin-logo" viewBox=${e} aria-hidden="true">
              <use href=${nr(this.builtinLogo)}></use>
            </svg>
          </div>
        `:this.icon?n`
          <div class="logo-container">
            ${A(this.icon)}
          </div>
        `:``}
        ${this.title?n`<h1>${this.title}</h1>`:``}
        ${this.subtitle?n`<p class="subtitle">${this.subtitle}</p>`:``}
        
        <slot></slot>
      </div>
    `}};j([o({type:String})],Al.prototype,`icon`,void 0),j([o({type:String})],Al.prototype,`logo`,void 0),j([o({type:String})],Al.prototype,`logoDark`,void 0),j([o({type:String})],Al.prototype,`builtinLogo`,void 0),j([o({type:String})],Al.prototype,`title`,void 0),j([o({type:String})],Al.prototype,`subtitle`,void 0),Al=j([p(`alps-auth-card`)],Al);var jl=class extends d{constructor(...e){super(...e),this.notice=null,this.username=``,this.password=``,this.rememberMe=!1,this.error=``,this.isSubmitting=!1,this.retryAfter=0,this.isRateLimited=!1,this._handleI18nChange=()=>{this.requestUpdate()}}static{this.styles=_`
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
      color: var(--accent-contrast, #ffffff);
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
  `}connectedCallback(){super.connectedCallback(),this.notice=rs(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),this.composeStore&&this.composeStore.clearAllComposers()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),this.retryCountdownInterval&&clearInterval(this.retryCountdownInterval)}async firstUpdated(){await this.renderRoot.querySelector(`alps-auth-card`)?.updateComplete,this.renderRoot.querySelector(`#username`)?.focus()}startRetryCountdown(e){this.retryAfter=e,this.isRateLimited=!0,this.retryCountdownInterval&&clearInterval(this.retryCountdownInterval),this.retryCountdownInterval=setInterval(()=>{this.retryAfter--,this.retryAfter<=0&&(this.isRateLimited=!1,this.retryCountdownInterval&&=(clearInterval(this.retryCountdownInterval),void 0))},1e3)}formatRetryTime(e){if(e<60)return`${e} second${e===1?``:`s`}`;let t=Math.ceil(e/60);return`${t} minute${t===1?``:`s`}`}async handleSubmit(e){if(e.preventDefault(),this.isSubmitting)return;let t=this.shadowRoot?.querySelector(`form`);if(t&&!t.checkValidity()){t.reportValidity();return}this.error=``,this.isSubmitting=!0;try{await new Promise(e=>setTimeout(e,600));let e={username:this.username,password:this.password,"remember-me":this.rememberMe?`on`:``},t=await fetch(`/session`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)}),n={};try{n=await t.json()??{}}catch{n={}}if(t.ok)if(n.requires_2fa){try{sessionStorage.setItem(`pending_2fa_username`,this.username)}catch{}window.location.hash=`/login/webauthn`,this.isSubmitting=!1}else window.dispatchEvent(new CustomEvent(`user-logged-in`,{detail:{username:this.username}})),window.location.hash=`/mailbox/INBOX`;else{if(t.status===429){this.error=n.error||this.i18nStore?.t(`login.tooManyAttempts`);let e=Number(n.retry_after)||Number(t.headers.get(`Retry-After`))||60;this.startRetryCountdown(e)}else this.error=n.error||this.i18nStore?.t(`login.loginFailed`),this.isRateLimited=!1;this.isSubmitting=!1}}catch{this.error=this.i18nStore?.t(`login.networkError`),this.isSubmitting=!1,this.isRateLimited=!1}}render(){return n`
      <alps-auth-card
        icon="edelweiss"
        .builtinLogo=${we()??``}
        .logo=${Te()??``}
        .logoDark=${Ee()??``}
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
              <span class="icon-left">${A(`at`)}</span>
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
              <span class="icon-left">${A(`key`)}</span>
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
    `}};j([h({context:w})],jl.prototype,`i18nStore`,void 0),j([a()],jl.prototype,`notice`,void 0),j([a()],jl.prototype,`username`,void 0),j([a()],jl.prototype,`password`,void 0),j([a()],jl.prototype,`rememberMe`,void 0),j([a()],jl.prototype,`error`,void 0),j([a()],jl.prototype,`isSubmitting`,void 0),j([a()],jl.prototype,`retryAfter`,void 0),j([a()],jl.prototype,`isRateLimited`,void 0),j([h({context:es,subscribe:!0})],jl.prototype,`composeStore`,void 0),jl=j([p(`login-page`)],jl);var Ml=class extends d{constructor(...e){super(...e),this.active=!1,this.icon=``}static{this.styles=_`
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
        <span class="category-icon">${A(this.icon)}</span>
      `:``}
      <span class="label"><slot></slot></span>
    `}};j([o({type:Boolean,reflect:!0})],Ml.prototype,`active`,void 0),j([o({type:String})],Ml.prototype,`icon`,void 0),Ml=j([p(`alps-category-item`)],Ml);var Nl=class extends d{constructor(...e){super(...e),this.newUsername=``,this.newPassword=``,this.newDisplayName=``,this.isSubmitting=!1,this.error=``,this.showAddForm=!1,this._handleStoreChange=()=>{this.requestUpdate()}}static{this.styles=_`
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
    `}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&(this.i18nStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore&&!this.linkedAccountsStore.isInitialized()&&this.linkedAccountsStore.fetchAccounts())})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.removeEventListener(`change`,this._handleStoreChange)}async handleAdd(e){if(e.preventDefault(),!(!this.newUsername||!this.newPassword)){this.isSubmitting=!0,this.error=``;try{await this.linkedAccountsStore.addAccount(this.newUsername,this.newPassword,this.newDisplayName),this.newUsername=``,this.newPassword=``,this.newDisplayName=``,this.showAddForm=!1,window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`linkedAccounts.addedSuccess`)}}))}catch(e){this.error=e.message||this.i18nStore?.t(`linkedAccounts.addError`)}finally{this.isSubmitting=!1}}}async handleRemove(e){if(confirm(this.i18nStore?.t(`linkedAccounts.removeConfirm`)))try{await this.linkedAccountsStore.removeAccount(e),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`linkedAccounts.removedSuccess`)}}))}catch(e){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore?.t(`linkedAccounts.removeError`)}}))}}render(){let e=this.linkedAccountsStore?.getAccounts()||[],t=this.linkedAccountsStore?.isLoading();return n`
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
        `}};j([h({context:w})],Nl.prototype,`i18nStore`,void 0),j([h({context:cs})],Nl.prototype,`linkedAccountsStore`,void 0),j([a()],Nl.prototype,`newUsername`,void 0),j([a()],Nl.prototype,`newPassword`,void 0),j([a()],Nl.prototype,`newDisplayName`,void 0),j([a()],Nl.prototype,`isSubmitting`,void 0),j([a()],Nl.prototype,`error`,void 0),j([a()],Nl.prototype,`showAddForm`,void 0),Nl=j([p(`settings-accounts`)],Nl);function Pl(e){if(!e)throw Error(`base64url is null or undefined`);let t=e.replace(/-/g,`+`).replace(/_/g,`/`),n=atob(t),r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);return r.buffer}function Fl(e){let t=new Uint8Array(e),n=``;for(let e=0;e<t.byteLength;e++)n+=String.fromCharCode(t[e]);return btoa(n).replace(/\+/g,`-`).replace(/\//g,`_`).replace(/=/g,``)}async function Il(e){e.publicKey.challenge=Pl(e.publicKey.challenge),e.publicKey.user.id=Pl(e.publicKey.user.id),e.publicKey.excludeCredentials&&(e.publicKey.excludeCredentials=e.publicKey.excludeCredentials.map(e=>({...e,id:Pl(e.id)})));let t=await navigator.credentials.create(e);if(!t)throw Error(`Credential creation failed or was cancelled.`);let n=t.response,r=n.getTransports?n.getTransports():[];return{id:t.id,rawId:Fl(t.rawId),type:t.type,response:{attestationObject:Fl(n.attestationObject),clientDataJSON:Fl(n.clientDataJSON)},transports:r}}async function Ll(e){e.publicKey.challenge=Pl(e.publicKey.challenge),e.publicKey.allowCredentials&&(e.publicKey.allowCredentials=e.publicKey.allowCredentials.map(e=>({...e,id:Pl(e.id)})));let t=await navigator.credentials.get(e);if(!t)throw new DOMException(`No credential was returned.`,`NotAllowedError`);let n=t.response;return{id:t.id,rawId:Fl(t.rawId),type:t.type,response:{authenticatorData:Fl(n.authenticatorData),clientDataJSON:Fl(n.clientDataJSON),signature:Fl(n.signature),userHandle:n.userHandle?Fl(n.userHandle):null}}}function Rl(){return window.PublicKeyCredential!==void 0&&navigator.credentials!==void 0}var Z=class extends d{constructor(...e){super(...e),this.data=null,this.error=``,this.loading=!0,this.adding=!1,this.showNamePrompt=!1,this.pendingCredential=null,this.pendingDeleteId=null,this.showTrustPrompt=!1,this.trustBusy=!1,this.removeBusy=!1,this.removeErrors={}}static{this.styles=_`
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
    `}connectedCallback(){super.connectedCallback(),this.fetchData()}async fetchData(){try{this.loading=!0;let e=await fetch(`/settings/2fa`);if(!e.ok)throw Error(`Failed to fetch settings`);this.data=await e.json()}catch(e){this.error=e.message}finally{this.loading=!1}}async handleTrustToggle(e){let t=e.target,n=t.checked;if(t.checked=!!this.data?.trustLinkedAccounts,!this.trustBusy){if(n){this.showTrustPrompt=!0;return}await this.sendTrust({trust:!1})}}async _handleTrustPromptSubmit(e){let t=typeof e.detail?.password==`string`?e.detail.password:``;if(this.showTrustPrompt=!1,!t){this.showTrustError(`webauthn.errors.password_required`);return}await this.sendTrust({trust:!0,current_password:t})}async sendTrust(e){this.trustBusy=!0,this.error=``;try{let t=await D(`/settings/2fa/trust-linked-accounts`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(t.status===401)return;if(!t.ok){let e=await t.json().then(e=>e?.error,()=>void 0);this.showTrustError(this.trustRefusal(t.status,e))}}catch{this.showTrustError(`webauthn.errors.trust_failed`)}finally{this.trustBusy=!1}await this.fetchData()}trustRefusal(e,t){switch(t){case`wrong_password`:return`webauthn.errors.wrong_password`;case`password_required`:return`webauthn.errors.password_required`;case`two_factor_required`:return`webauthn.errors.two_factor_required`;case`no_security_key`:return`webauthn.errors.no_security_key`}return e===429?`webauthn.errors.rate_limited`:`webauthn.errors.trust_failed`}showTrustError(e){this.error=this.i18nStore?.t(e)??e}async addCredential(){this.adding=!0,this.error=``;try{let e=await fetch(`/settings/2fa/begin`,{method:`POST`});if(!e.ok)throw Error(await e.text());let t=await Il(await e.json());this.pendingCredential=t,this.showNamePrompt=!0,this.adding=!1}catch(e){e.name===`NotAllowedError`||e.message&&e.message.includes(`not allowed`)?this.error=``:this.error=this.i18nStore?.t(`webauthn.errors.register_failed`)||`There was an error registering your security key. Please try again.`,this.adding=!1}}async _handlePromptSubmit(e){let t=e.detail.keyName||`Security Key`;this.showNamePrompt=!1;let n={...this.pendingCredential,name:t};this.adding=!0,this.error=``;try{let e=await fetch(`/settings/2fa/finish`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(n)});if(!e.ok)throw Error(await e.text());this.fetchData()}catch{this.error=this.i18nStore?.t(`webauthn.errors.register_failed`)||`There was an error registering your security key. Please try again.`}finally{this.adding=!1,this.pendingCredential=null}}_handlePromptCancel(){this.showNamePrompt=!1,this.pendingCredential=null}removeCredential(e){this.error=``,this.removeErrors={},this.pendingDeleteId=e}t(e){return this.i18nStore?.t(e)??e}async executeRemoveCredential(e){let t=this.pendingDeleteId;if(!t||this.removeBusy)return;let n=typeof e.detail?.password==`string`?e.detail.password:``;if(!n){this.removeErrors={password:this.t(`webauthn.errors.password_required`)};return}this.removeBusy=!0;try{let e=await D(`/settings/2fa/credential/${encodeURIComponent(t)}/delete`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({current_password:n})});if(e.ok||e.status===404){this.pendingDeleteId=null,this.fetchData();return}if(e.status===401){this.pendingDeleteId=null;return}let r=await e.json().then(e=>e?.error,()=>void 0);this.removeErrors={password:this.removeRefusal(e.status,r)}}catch{this.removeErrors={password:this.t(`webauthn.errors.remove_unavailable`)}}finally{this.removeBusy=!1}}removeRefusal(e,t){return t===`wrong_password`?this.t(`webauthn.errors.wrong_password`):t===`password_required`?this.t(`webauthn.errors.password_required`):t===`two_factor_required`?this.t(`webauthn.errors.two_factor_required`):e===429?this.t(`webauthn.errors.rate_limited`):e>=500?this.t(`webauthn.errors.remove_unavailable`):this.t(`webauthn.errors.remove_failed`)}render(){return this.loading?n`<div>${this.i18nStore?.t(`settings.loading`)}</div>`:n`
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

            ${this.showTrustPrompt?n`
                <ui-prompt
                    title=${this.i18nStore?.t(`webauthn.trust_linked_checkbox`)}
                    confirmText=${this.i18nStore?.t(`general.save`)}
                    cancelText=${this.i18nStore?.t(`general.cancel`)}
                    .fields=${[{id:`password`,type:`password`,label:this.i18nStore?.t(`webauthn.trust_password_label`),autofocus:!0}]}
                    @submit=${this._handleTrustPromptSubmit}
                    @cancel=${()=>this.showTrustPrompt=!1}
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
                <ui-prompt
                    title="${this.t(`webauthn.confirm_remove`)}"
                    confirmText="${this.t(`webauthn.settings.remove_btn`)}"
                    cancelText="${this.t(`general.cancel`)}"
                    .isDanger=${!0}
                    .busy=${this.removeBusy}
                    .errors=${this.removeErrors}
                    .fields=${[{id:`password`,type:`password`,label:this.t(`webauthn.remove_password_label`),autocomplete:`current-password`,autofocus:!0,validate:e=>e?null:this.t(`webauthn.errors.password_required`)}]}
                    @submit=${this.executeRemoveCredential}
                    @cancel=${()=>{this.removeBusy||(this.pendingDeleteId=null)}}
                ></ui-prompt>
            `:``}

            <alps-setting-group 
                label="${this.i18nStore?.t(`webauthn.settings.keys_title`)}" 
                description="${this.i18nStore?.t(`webauthn.settings.group_desc`)}">

                <div class="cred-list" style="margin-top: 0;">
                    ${this.data?.credentialCount&&this.data.credentialCount>0?n`
                        ${this.data?.credentials.map(e=>n`
                            <div class="setting-row">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="icon-container">${A(`fingerprint`)}</div>
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
                        <input type="checkbox" .checked=${l(!!this.data?.trustLinkedAccounts)} ?disabled=${this.trustBusy} @change=${this.handleTrustToggle}>
                        ${this.i18nStore?.t(`webauthn.trust_linked_checkbox`)}
                    </label>
                </alps-setting-group>
            `:``}
        `}};j([h({context:w})],Z.prototype,`i18nStore`,void 0),j([a()],Z.prototype,`data`,void 0),j([a()],Z.prototype,`error`,void 0),j([a()],Z.prototype,`loading`,void 0),j([a()],Z.prototype,`adding`,void 0),j([a()],Z.prototype,`showNamePrompt`,void 0),j([a()],Z.prototype,`pendingCredential`,void 0),j([a()],Z.prototype,`pendingDeleteId`,void 0),j([a()],Z.prototype,`showTrustPrompt`,void 0),j([a()],Z.prototype,`trustBusy`,void 0),j([a()],Z.prototype,`removeBusy`,void 0),j([a()],Z.prototype,`removeErrors`,void 0),Z=j([p(`alps-webauthn-settings`)],Z);var Q=class extends d{constructor(...e){super(...e),this.category=`general`,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.username=``,this.isScrolled=!1,this.sidebarWidth=250,this.sidebarCollapsed=!1,this.isSidebarDragging=!1,this.sidebarPeeking=!1,this._handleResize=()=>{this.isMobile=window.innerWidth<=768,this.isMobile||(this.mobileSidebarOpen=!1)},this._handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0},this._handleSettingsChange=()=>{this._syncState()},this._handleI18nChange=()=>{this.requestUpdate()}}static{this.styles=[br,_`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      overflow: hidden;
      /* Not a scroll container: see the mailbox page's host. */
      overflow: clip;
      font-size: 14px;
    }

    .settings-title {
      font-family: var(--font-heading);
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
  `]}async connectedCallback(){super.connectedCallback(),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this.i18nStore?.addEventListener(`change`,this._handleI18nChange),window.addEventListener(`resize`,this._handleResize),this._syncState();try{let e=await fetch(`/session`);if(e.ok){let t=await e.json();t.Username&&(this.username=t.Username)}}catch(e){S.error(`Failed to fetch username in settings`,e)}}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),window.removeEventListener(`resize`,this._handleResize)}_syncState(){this.settingsState={...this.settingsStore.getState()},this.sidebarCollapsed=this.settingsState.sidebarCollapsed||!1}getCategoryLabel(e){switch(e){case`general`:return this.i18nStore?.t(`settings.categories.general`);case`identity`:return this.i18nStore?.t(`settings.categories.identity`);case`webauthn`:return this.i18nStore?.t(`settings.categories.webauthn`);case`accounts`:return this.i18nStore?.t(`settings.categories.accounts`);case`reading`:return this.i18nStore?.t(`settings.categories.reading`);case`appearance`:return this.i18nStore?.t(`settings.categories.appearance`);case`localization`:return this.i18nStore?.t(`settings.categories.localization`);default:let t=b.getSettingsTabs().find(t=>t.id===e);return t?this.i18nStore?.t(t.labelKey):e}}selectCategory(e){window.location.hash=`/settings/${e}`,this.isMobile&&(this.mobileSidebarOpen=!1),xr(this.renderRoot)}async handleUpdate(e,t){let n=e.target,r=n.value;n.type===`checkbox`?(r=n.checked,t===`desktopNotifications`&&r===!0&&(`Notification`in window&&Notification.permission!==`granted`&&Notification.permission!==`denied`?await Notification.requestPermission()!==`granted`&&(r=!1,n.checked=!1):`Notification`in window&&Notification.permission===`denied`&&(r=!1,n.checked=!1))):(n.type===`number`||[`checkMailInterval`,`autoLogout`,`messagesPerPage`,`markReadTimeout`,`undoTimeout`,`weekStart`].includes(t))&&(r=parseInt(n.value,10),isNaN(r)&&(r=0)),this.settingsStore.updateSettings({[t]:r})}render(){return n`
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
              ${A(`arrowLeft`)} ${this.i18nStore?.t(`messageReader.back`)}
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
          .width=${this.sidebarWidth}
          .hideFooterDivider=${!0}
          .showMobileBack=${!0}
          .collapsed=${this.sidebarCollapsed&&!this.isMobile}
          @sidebar-resize=${e=>{let t=e.detail.newWidth;t<120?(this.sidebarCollapsed||this.settingsStore.updateSettings({sidebarCollapsed:!0}),this.sidebarWidth=250):(this.sidebarCollapsed&&this.settingsStore.updateSettings({sidebarCollapsed:!1}),this.sidebarWidth=Math.min(Math.max(t,150),500))}}
          @drag-start=${()=>this.isSidebarDragging=!0}
          @drag-end=${()=>this.isSidebarDragging=!1}
          @toggle-collapse=${()=>this.settingsStore.updateSettings({sidebarCollapsed:!this.sidebarCollapsed})}
          @peek-change=${e=>{this.sidebarPeeking=e.detail.peeking}}
          @close-sidebar=${()=>this.mobileSidebarOpen=!1}
        >
          <div class="sidebar-wrapper ${this.sidebarCollapsed&&!this.sidebarPeeking&&!this.isMobile?`collapsed`:``}">
            <!-- Inert in the strip, as it is dimmed there. -->
            <div class="sidebar-content" ?inert=${this.sidebarCollapsed&&!this.sidebarPeeking&&!this.isMobile}>
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
          ${b.getSettingsTabs().map(e=>n`
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
            ${b.getSettingsTabs().filter(e=>e.id===this.category).map(e=>n`${m(`<${e.component}></${e.component}>`)}`)}
          `:n`<div>${this.i18nStore?.t(`settings.loading`)}</div>`}
        </div>
      </div>
    `}renderGeneral(){return n`
        <alps-setting-group label="${this.i18nStore?.t(`settings.general.checkMailInterval`)}" description="${this.i18nStore?.t(`settings.general.checkMailIntervalDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.general.checkMailInterval`)}" @change=${e=>this.handleUpdate(e,`checkMailInterval`)} .value=${this.settingsState.checkMailInterval.toString()}
            .options=${[{value:`1`,label:this.i18nStore?.t(`settings.general.everyMinute`)||`1`},{value:`5`,label:this.i18nStore?.t(`settings.general.every5Minutes`)||`5`},{value:`15`,label:this.i18nStore?.t(`settings.general.every15Minutes`)||`15`},{value:`30`,label:this.i18nStore?.t(`settings.general.every30Minutes`)||`30`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.general.autoLogout`)}" description="${this.i18nStore?.t(`settings.general.autoLogoutDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.general.autoLogout`)}" @change=${e=>this.handleUpdate(e,`autoLogout`)} .value=${this.settingsState.autoLogout.toString()}
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
          <alps-input label="${this.i18nStore?.t(`settings.identity.displayName`)}" type="text" icon="user" .value=${this.settingsState.name||``} @change=${e=>this.handleUpdate(e,`name`)} placeholder="${this.i18nStore?.t(`settings.placeholderName`)}"></alps-input>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.identity.signature`)}" description="${this.i18nStore?.t(`settings.identity.signatureDesc`)}">
          <textarea @change=${e=>this.handleUpdate(e,`signature`)} .value=${this.settingsState.signature||``}></textarea>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.identity.replyTo`)}" description="${this.i18nStore?.t(`settings.identity.replyToDesc`)}">
          <alps-input label="${this.i18nStore?.t(`settings.identity.replyTo`)}" type="email" .value=${this.settingsState.replyTo||``} @change=${e=>this.handleUpdate(e,`replyTo`)} placeholder="${this.i18nStore?.t(`settings.placeholderReplyTo`)}"></alps-input>
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
          <alps-select label="${this.i18nStore?.t(`settings.reading.messagesPerPage`)}" @change=${e=>this.handleUpdate(e,`messagesPerPage`)} .value=${this.settingsState.messagesPerPage.toString()}
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
          <alps-select label="${this.i18nStore?.t(`settings.reading.preferredView`)}" @change=${e=>this.handleUpdate(e,`preferredView`)} .value=${this.settingsState.preferredView}
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
          <alps-select label="${this.i18nStore?.t(`settings.reading.showRemoteContent`)}" @change=${e=>this.handleUpdate(e,`showRemoteContent`)} .value=${this.settingsState.showRemoteContent}
            .options=${[{value:`ask`,label:this.i18nStore?.t(`settings.reading.alwaysAsk`)||`ask`},{value:`always`,label:this.i18nStore?.t(`settings.reading.alwaysLoad`)||`always`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.markReadTimeout`)}">
          <alps-select label="${this.i18nStore?.t(`settings.reading.markReadTimeout`)}" @change=${e=>this.handleUpdate(e,`markReadTimeout`)} .value=${this.settingsState.markReadTimeout.toString()}
            .options=${[{value:`0`,label:this.i18nStore?.t(`settings.reading.markReadImmediately`)||`0`},{value:`1`,label:this.i18nStore?.t(`settings.reading.markRead1s`)||`1`},{value:`3`,label:this.i18nStore?.t(`settings.reading.markRead3s`)||`3`},{value:`5`,label:this.i18nStore?.t(`settings.reading.markRead5s`)||`5`},{value:`10`,label:this.i18nStore?.t(`settings.reading.markRead10s`)||`10`},{value:`-1`,label:this.i18nStore?.t(`settings.reading.markReadNever`)||`-1`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.composeFormat`)}">
          <alps-select label="${this.i18nStore?.t(`settings.reading.composeFormat`)}" @change=${e=>this.handleUpdate(e,`composeFormat`)} .value=${this.settingsState.composeFormat}
            .options=${[{value:`html`,label:this.i18nStore?.t(`settings.reading.richText`)||`html`},{value:`text`,label:this.i18nStore?.t(`settings.reading.plainText`)||`text`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.reading.messageSortCriteria`)}" description="${this.i18nStore?.t(`settings.reading.messageSortCriteriaDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.reading.messageSortCriteria`)}" @change=${e=>this.handleUpdate(e,`messageSortCriteria`)} .value=${this.settingsState.messageSortCriteria}
            .options=${[{value:`date`,label:this.i18nStore?.t(`settings.reading.sortDate`)||`date`},{value:`uid`,label:this.i18nStore?.t(`settings.reading.sortUid`)||`uid`}]}>
          </alps-select>
        </alps-setting-group>
    `}renderAppearance(){return n`
        
        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.colorTheme`)}" description="${this.i18nStore?.t(`settings.appearance.colorThemeDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.appearance.colorTheme`)}" @change=${e=>this.handleUpdate(e,`colorFamily`)} .value=${De(this.settingsState.colorFamily)}
            .options=${[{value:`alps`,label:`Alps`},{value:`migadu`,label:`Migadu`},{value:`nord`,label:`Nord`},{value:`ocean`,label:`Ocean`}]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.themeMode`)}" description="${this.i18nStore?.t(`settings.appearance.themeModeDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.appearance.themeMode`)}" @change=${e=>this.handleUpdate(e,`themeMode`)} .value=${this.settingsState.themeMode}
            .options=${[{value:`light`,label:this.i18nStore?.t(`settings.appearance.light`)||`light`},{value:`dark`,label:this.i18nStore?.t(`settings.appearance.dark`)||`dark`},{value:`auto`,label:this.i18nStore?.t(`settings.appearance.systemAuto`)||`auto`}]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.layoutMode`)}" description="${this.i18nStore?.t(`settings.appearance.layoutModeDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.appearance.layoutMode`)}" @change=${e=>this.handleUpdate(e,`layoutMode`)} .value=${this.settingsState.layoutMode}
            .options=${[{value:`vertical`,label:this.i18nStore?.t(`settings.appearance.vertical`)||`vertical`},{value:`horizontal`,label:this.i18nStore?.t(`settings.appearance.horizontal`)||`horizontal`},{value:`full`,label:this.i18nStore?.t(`settings.appearance.fullScreen`)||`full`}]}>
          </alps-select>
        </alps-setting-group>

        <alps-setting-group label="${this.i18nStore?.t(`settings.appearance.listDensity`)}" description="${this.i18nStore?.t(`settings.appearance.listDensityDesc`)}">
          <alps-select label="${this.i18nStore?.t(`settings.appearance.listDensity`)}" @change=${e=>this.handleUpdate(e,`densityMode`)} .value=${this.settingsState.densityMode}
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
          <!-- Each language is named in its own words and marked with its own
               language, so a screen reader reads "Deutsch" in German rather
               than in the language of the page around it. -->
          <alps-select label="${this.i18nStore?.t(`settings.localization.language`)}" @change=${e=>this.handleUpdate(e,`language`)} .value=${this.settingsState.language}
            .options=${[{value:`en`,lang:ye(`en`),label:this.i18nStore?.t(`settings.localization.english`)||`en`},{value:`de`,lang:ye(`de`),label:this.i18nStore?.t(`settings.localization.german`)||`de`},{value:`it`,lang:ye(`it`),label:this.i18nStore?.t(`settings.localization.italian`)||`it`},{value:`es`,lang:ye(`es`),label:this.i18nStore?.t(`settings.localization.spanish`)||`es`},{value:`rs`,lang:ye(`rs`),label:this.i18nStore?.t(`settings.localization.serbian`)||`rs`},{value:`sr`,lang:ye(`sr`),label:this.i18nStore?.t(`settings.localization.serbianLatin`)||`sr`},{value:`fr`,lang:ye(`fr`),label:this.i18nStore?.t(`settings.localization.french`)||`fr`},{value:`pt`,lang:ye(`pt`),label:this.i18nStore?.t(`settings.localization.portuguese`)||`pt`},{value:`da`,lang:ye(`da`),label:this.i18nStore?.t(`settings.localization.danish`)||`da`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.timeFormat`)}">
          <alps-select label="${this.i18nStore?.t(`settings.localization.timeFormat`)}" @change=${e=>this.handleUpdate(e,`hourFormat`)} .value=${this.settingsState.hourFormat}
            .options=${[{value:`12`,label:this.i18nStore?.t(`settings.localization.format12h`)||`12`},{value:`24`,label:this.i18nStore?.t(`settings.localization.format24h`)||`24`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.dateFormat`)}">
          <alps-select label="${this.i18nStore?.t(`settings.localization.dateFormat`)}" @change=${e=>this.handleUpdate(e,`dateFormat`)} .value=${this.settingsState.dateFormat}
            .options=${[{value:`YYYY-MM-DD`,label:`YYYY-MM-DD`},{value:`MM/DD/YYYY`,label:`MM/DD/YYYY`},{value:`DD.MM.YYYY`,label:`DD.MM.YYYY`}]}>
          </alps-select>
        </alps-setting-group>
        <alps-setting-group label="${this.i18nStore?.t(`settings.localization.weekStart`)}">
          <alps-select label="${this.i18nStore?.t(`settings.localization.weekStart`)}" @change=${e=>this.handleUpdate(e,`weekStart`)} .value=${String(this.settingsState.weekStart??1)}
            .options=${[{value:`1`,label:this.i18nStore?.t(`settings.localization.monday`)||`Monday`},{value:`0`,label:this.i18nStore?.t(`settings.localization.sunday`)||`Sunday`}]}>
          </alps-select>
        </alps-setting-group>
    `}};j([h({context:T})],Q.prototype,`settingsStore`,void 0),j([h({context:w})],Q.prototype,`i18nStore`,void 0),j([o({type:String})],Q.prototype,`category`,void 0),j([a()],Q.prototype,`settingsState`,void 0),j([a()],Q.prototype,`isMobile`,void 0),j([a()],Q.prototype,`mobileSidebarOpen`,void 0),j([a()],Q.prototype,`username`,void 0),j([a()],Q.prototype,`isScrolled`,void 0),j([a()],Q.prototype,`sidebarWidth`,void 0),j([a()],Q.prototype,`sidebarCollapsed`,void 0),j([a()],Q.prototype,`isSidebarDragging`,void 0),j([a()],Q.prototype,`sidebarPeeking`,void 0),Q=j([p(`settings-page`)],Q);function zl(e){return(e??[]).flatMap(e=>e.group??[e]).map(e=>({name:e.name,email:e.address}))}async function Bl(e){let t=await new ee().parse(e),n=`default`,r=t.headers?.find(e=>e.key.toLowerCase()===`bimi-selector`);if(r){let e=r.value.match(/s=([^;\s]+)/i);e&&(n=e[1].trim())}let i=t.from?.address||``,a={messageId:t.messageId||``,date:t.date||``,from:zl(t.from?[t.from]:[]),fromAddress:i,to:zl(t.to),subject:t.subject||``,spf:`none`,spfDetail:``,dkim:`none`,dkimDetail:``,dmarc:`none`,dmarcDetail:``,bimiSelector:n,hasBimiPotential:!1},o=t.headers?.filter(e=>e.key.toLowerCase()===`authentication-results`)||[];if(o.length>0){let e=o[0],t=e.value.toLowerCase(),n=``,r=t.match(/smtp\.(?:remote|client)-ip=([0-9a-f\.:]+)/)||t.match(/designates ([0-9a-f\.:]+) as permitted sender/);r&&(n=r[1]);let i=e.value.split(`;`);for(let e of i){let t=e.trim().toLowerCase();if(t.startsWith(`spf=`))if(a.spf=t.split(`=`)[1].split(` `)[0],n)a.spfDetail=`with IP address ${n}`;else{let e=t.match(/smtp\.mailfrom=([^ \t]+)/)||t.match(/smtp\.helo=([^ \t]+)/);e&&(a.spfDetail=`with ${e[1]}`)}else if(t.startsWith(`dkim=`)){a.dkim=t.split(`=`)[1].split(` `)[0];let e=t.match(/header\.d=([^ \t]+)/);e&&(a.dkimDetail=`with domain ${e[1]}`)}else if(t.startsWith(`dmarc=`)){a.dmarc=t.split(`=`)[1].split(` `)[0];let e=t.match(/header\.from=([^ \t]+)/);e&&(a.dmarcDetail=`with domain ${e[1]}`)}}}return a.hasBimiPotential=a.dmarc===`pass`&&!!a.fromAddress,a}var Vl=class extends d{constructor(...e){super(...e),this.rawText=``,this.parsedHeaders=null,this.loading=!0,this.error=``,this.mailbox=``,this.uid=``,this.isTruncated=!1,this._handleStoreChange=()=>{this.requestUpdate()},this.MAX_DISPLAY_SIZE=65536}static{this.styles=_`
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
      font-family: var(--font-mono);
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
  `}connectedCallback(){super.connectedCallback(),this.extractParams(),this.mailbox&&this.uid?this.fetchOriginal():(this.error=this.i18nStore?.t(`originalMessage.errorMissingParams`),this.loading=!1),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}extractParams(){let e=window.location.hash,t=e.indexOf(`?`);if(t!==-1){let n=new URLSearchParams(e.substring(t+1));this.mailbox=n.get(`mailbox`)||``,this.uid=n.get(`uid`)||``}}async fetchOriginal(){try{this.loading=!0;let e=await D(`/mailboxes/${k(this.mailbox)}/messages/${this.uid}/raw?limit=${this.MAX_DISPLAY_SIZE}`);if(!e.ok){if(e.status===401){window.location.hash=`#/login`;return}throw Error(this.i18nStore?.t(`originalMessage.errorFailedToFetch`))}this.rawText=await e.text(),this.rawText.length>=this.MAX_DISPLAY_SIZE&&(this.isTruncated=!0),this.parsedHeaders=await Bl(this.rawText)}catch(e){this.error=e.message}finally{this.loading=!1}}copyToClipboard(){navigator.clipboard.writeText(this.rawText).then(()=>{alert(this.isTruncated?this.i18nStore?.t(`originalMessage.copiedTruncated`):this.i18nStore?.t(`originalMessage.copied`))}).catch(e=>{S.error(`Failed to copy: `,e),alert(this.i18nStore?.t(`originalMessage.copyFailed`))})}renderAuthStatus(e,t){e=e.toLowerCase();let r=n`<span class="auth-none">${this.i18nStore?.t(`originalMessage.none`)}</span>`;return e===`pass`?r=n`<span class="auth-pass">${this.i18nStore?.t(`originalMessage.pass`)}</span>`:e===`fail`&&(r=n`<span class="auth-fail">${this.i18nStore?.t(`originalMessage.fail`)}</span>`),n`
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
      `;let e=`/mailboxes/${k(this.mailbox)}/messages/${this.uid}/raw`;return n`
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
                <td>${It(this.parsedHeaders.from)}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.to`)}</th>
                <td>${It(this.parsedHeaders.to)}</td>
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
    `}};j([a()],Vl.prototype,`rawText`,void 0),j([a()],Vl.prototype,`parsedHeaders`,void 0),j([a()],Vl.prototype,`loading`,void 0),j([a()],Vl.prototype,`error`,void 0),j([a()],Vl.prototype,`mailbox`,void 0),j([a()],Vl.prototype,`uid`,void 0),j([a()],Vl.prototype,`isTruncated`,void 0),j([h({context:w})],Vl.prototype,`i18nStore`,void 0),Vl=j([p(`original-message-page`)],Vl);var Hl=class extends d{constructor(...e){super(...e),this.loading=!0,this.error=``,this.mailbox=``,this.uid=``,this.message=null,this.content=``,this.rawMessageHtml=``,this.mimeType=`text/plain`,this.hasRemoteResources=!1,this.allowRemoteResources=!1,this.printTriggered=!1}static{this.styles=_`
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
  `}connectedCallback(){super.connectedCallback(),this.allowRemoteResources=this.settingsStore.getState().showRemoteContent===`always`,this.extractParams(),this.mailbox&&this.uid?this.fetchMessage():(this.error=`Missing mailbox or uid parameters`,this.loading=!1)}extractParams(){let e=window.location.hash,t=e.indexOf(`?`);if(t!==-1){let n=new URLSearchParams(e.substring(t+1));this.mailbox=n.get(`mailbox`)||``,this.uid=n.get(`uid`)||``,n.get(`remote`)===`1`&&(this.allowRemoteResources=!0)}}async fetchMessage(){try{this.loading=!0;let e=[ki.get(this.mailbox,this.uid,`html`),ki.get(this.mailbox,this.uid,`text`)].find(e=>!!e&&!!e.Part&&(e.RawHtml!==void 0||e.RawText!==void 0));if(e){this.message=e.Message,this.mimeType=e.Part.MIMEType||e.Part.MimeType||`text/plain`,e.RawHtml===void 0?e.RawText!==void 0&&(this.content=e.RawText):(this.rawMessageHtml=e.RawHtml,this.hasRemoteResources=!1,this.content=Lo(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})),this.loading=!1;return}let t=await D(`/mailboxes/${k(this.mailbox)}/messages/${this.uid}?view=html`);if(!t.ok){if(t.status===401){window.location.hash=`#/login`;return}throw Error(`Failed to fetch message metadata`)}let n=await t.json();this.message=n.Message,await this.fetchMessageBody(n.Part)}catch(e){this.error=e.message}finally{this.loading=!1}}async fetchMessageBody(e){if(!e){this.mimeType=`multipart/mixed`,this.content=``;return}this.mimeType=e.MIMEType||e.MimeType||`text/plain`;let t=Array.isArray(e.Path)&&e.Path.length?e.Path.join(`.`):`1`,n=await D(`/mailboxes/${k(this.mailbox)}/messages/${this.uid}/raw?part=${t}`);if(!n.ok)throw Error(`Failed to fetch message body`);this.mimeType.toLowerCase()===`text/html`?(this.rawMessageHtml=await n.text(),this.hasRemoteResources=!1,this.content=Lo(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})):this.content=await n.text()}loadRemoteResources(){this.allowRemoteResources=!0,this.printTriggered=!1,this.rawMessageHtml&&(this.content=Lo(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message?.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}}))}updated(e){this.loading||this.error||!this.message||this.mimeType?.toLowerCase()!==`text/html`&&(this.printTriggered||(this.printTriggered=!0,setTimeout(()=>{this.isConnected&&window.print()},500)))}onPrintIframeLoad(e){let t=e.target;try{let e=t.contentDocument;e&&e.body&&(t.style.height=`${e.body.scrollHeight}px`)}catch{}this.printTriggered||(this.printTriggered=!0,setTimeout(()=>{this.isConnected&&window.print()},300))}render(){if(this.loading)return n`
        <div class="loading-state">
          <alps-loader></alps-loader>
          <span>${this.i18nStore?.t(`print.loading`)}</span>
        </div>
      `;if(this.error)return n`
        <div class="error-state">
          <div>${A(`warning`)}</div>
          <span>${this.error}</span>
        </div>
      `;let e=this.message;if(!e)return n``;let t=e.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`),r=e.Envelope?.From?.[0]||{},i=r.Mailbox&&r.Host?`${r.Mailbox}@${r.Host}`:``,a=r.Name||i?Pt(r.Name,i):this.i18nStore?.t(`messageList.unknownSender`),o=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,s=String(this.settingsStore?.getState()?.hourFormat||`12`),c=e.Envelope?.Date?ar(e.Envelope.Date,o,s):``,u=e=>It(e.map(e=>({name:e.Name,email:`${e.Mailbox}@${e.Host}`}))),d=e.Envelope?.To&&e.Envelope.To.length>0?u(e.Envelope.To):this.i18nStore?.t(`messageReader.undisclosed`),f=n``;if(e.Envelope?.Cc&&e.Envelope.Cc.length>0){let t=u(e.Envelope.Cc);f=n`<div class="print-cc"><strong>${this.i18nStore?.t(`messageReader.cc`)}</strong> ${t}</div>`}let p;return p=this.mimeType?.toLowerCase()===`text/html`?n`<iframe
        class="print-iframe"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        .srcdoc=${l(this.content)}
        @load=${this.onPrintIframeLoad}
      ></iframe>`:this.mimeType?.toLowerCase().startsWith(`multipart/`)?n`<div style="font-style: italic; color: #666;">${this.i18nStore?.t(`messageReader.noReadableText`)}</div>`:n`<pre dir="auto" style="unicode-bidi: plaintext; white-space: pre-wrap; font-family: inherit; margin: 0;">${this.content}</pre>`,n`
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
          <h2><bdi>${t}</bdi></h2>
          <div class="print-divider"></div>
          <div class="print-meta-row">
            <div><strong>${a}</strong> ${r.Name&&i?n`&lt;${Nt(i)}&gt;`:``}</div>
            <div class="print-date">${c}</div>
          </div>
          <div class="print-to-row">
            <strong>${this.i18nStore?.t(`messageReader.to`)}</strong> ${d}
            ${f}
          </div>
          <div class="print-divider-thick"></div>
        </div>
        <div class="print-body">
          ${p}
        </div>
      </div>
    `}};j([h({context:T})],Hl.prototype,`settingsStore`,void 0),j([h({context:w})],Hl.prototype,`i18nStore`,void 0),j([a()],Hl.prototype,`loading`,void 0),j([a()],Hl.prototype,`error`,void 0),j([a()],Hl.prototype,`mailbox`,void 0),j([a()],Hl.prototype,`uid`,void 0),j([a()],Hl.prototype,`message`,void 0),j([a()],Hl.prototype,`content`,void 0),j([a()],Hl.prototype,`rawMessageHtml`,void 0),j([a()],Hl.prototype,`mimeType`,void 0),j([a()],Hl.prototype,`hasRemoteResources`,void 0),j([a()],Hl.prototype,`allowRemoteResources`,void 0),Hl=j([p(`print-page`)],Hl);async function Ul(e,t={}){let n;try{n=await fetch(e,{...t,method:`POST`})}catch{return null}let r=null;try{r=await n.json()}catch{r=null}return{ok:n.ok,status:n.status,body:r}}var Wl=e=>e.status>=500||e.ok&&e.body===null,Gl=class extends d{constructor(...e){super(...e),this.statusMessage=``,this.statusType=`info`,this.isLoading=!1,this.isSuccess=!1,this._handleI18nChange=()=>{this.requestUpdate()}}static{this.styles=_`
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
    

  `}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),Rl()?setTimeout(()=>{this._handleVerify()},300):(this.statusMessage=this.i18nStore?.t(`webauthn.not_supported`),this.statusType=`error`)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}_backToPassword(){try{sessionStorage.removeItem(`pending_2fa_username`),sessionStorage.removeItem(`pending_2fa_is_switch`)}catch{}ns(`secondFactorExpired`),window.location.hash=`#/login`}async _handleVerify(){this.isLoading=!0,this.statusMessage=this.i18nStore?.t(`webauthn.requesting`),this.statusType=`info`;try{let e=await Ul(`/webauthn/verify/begin`);if(e===null)throw Error(this.i18nStore?.t(`login.networkError`));if(e.status===401)return this._backToPassword();if(Wl(e))throw Error(this.i18nStore?.t(`webauthn.errors.unavailable`));if(!e.ok)throw Error(this.i18nStore?.t(`webauthn.errors.begin_failed`));let t=e.body;if(!t||!t.publicKey)throw Error(this.i18nStore?.t(`webauthn.errors.invalid_options`));this.statusMessage=this.i18nStore?.t(`webauthn.waiting_for_key`);let n=await Ll(t);this.statusMessage=this.i18nStore?.t(`webauthn.verifying`);let r=await Ul(`/webauthn/verify/finish`,{headers:{"Content-Type":`application/json`},body:JSON.stringify(n)});if(r===null)throw Error(this.i18nStore?.t(`login.networkError`));if(r.status===401)return this._backToPassword();if(Wl(r))throw Error(this.i18nStore?.t(`webauthn.errors.unavailable`));let i=r.body;if(r.ok&&i?.success){this.statusMessage=this.i18nStore?.t(`webauthn.success`),this.statusType=`success`,this.isSuccess=!0;let e=!1;try{e=sessionStorage.getItem(`pending_2fa_is_switch`)===`1`,sessionStorage.removeItem(`pending_2fa_is_switch`)}catch{}let t=i.username;if(t)try{sessionStorage.removeItem(`pending_2fa_username`)}catch{}else try{t=sessionStorage.getItem(`pending_2fa_username`)||``,sessionStorage.removeItem(`pending_2fa_username`)}catch{}setTimeout(()=>{if(window.dispatchEvent(new CustomEvent(`user-logged-in`,{detail:{username:t}})),window.location.hash=`/mailbox/INBOX`,e&&typeof window.location.reload==`function`)try{window.location.reload()}catch{}},500)}else throw Error(this.i18nStore?.t(`webauthn.errors.verification_failed`))}catch(e){e?.name===`NotAllowedError`||e?.name===`AbortError`?this.statusMessage=this.i18nStore?.t(`webauthn.errors.cancelled`):e instanceof DOMException?this.statusMessage=this.i18nStore?.t(`webauthn.errors.general`):this.statusMessage=e.message||this.i18nStore?.t(`webauthn.errors.general`),this.statusType=`error`}finally{this.isLoading=!1}}render(){return n`
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
          ?disabled=${this.isLoading||this.isSuccess||!Rl()}
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
    `}};j([h({context:w})],Gl.prototype,`i18nStore`,void 0),j([a()],Gl.prototype,`statusMessage`,void 0),j([a()],Gl.prototype,`statusType`,void 0),j([a()],Gl.prototype,`isLoading`,void 0),j([a()],Gl.prototype,`isSuccess`,void 0),Gl=j([p(`login-webauthn-page`)],Gl);var Kl=class extends d{constructor(...e){super(...e),this.show=!1,this.message=``,this.actionLabel=``,this.timeout=0,this._timer=null}updated(e){e.has(`show`)&&(this.show&&this.timeout>0?(this._timer&&clearTimeout(this._timer),this._timer=setTimeout(()=>{this.dismiss()},this.timeout)):!this.show&&this._timer&&(clearTimeout(this._timer),this._timer=null))}dismiss(){this.onDismiss&&this.onDismiss(),this.close()}close(){this.show=!1,this.dispatchEvent(new CustomEvent(`dismiss`)),this.onAction=void 0,this.onDismiss=void 0}handleAction(){this.onAction?this.onAction():this.dispatchEvent(new CustomEvent(`action`)),this.close()}static{this.styles=_`
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
        <!-- Named by its title, which alps-icon-btn passes on to its button; an
             aria-label would stay on this element, which is no control. -->
        <alps-icon-btn 
          class="dismiss-btn" 
          icon="x" 
          title="${this.i18nStore?.t(`toast.dismiss`)}" 
          @click=${this.dismiss}
          style="--btn-color: var(--toast-fg, rgba(255, 255, 255, 0.7)); --btn-hover-bg: rgba(255, 255, 255, 0.15); --text-primary: var(--toast-fg, #fff); --btn-icon-size: 16px;"
        ></alps-icon-btn>
      </div>
    `}};j([h({context:w})],Kl.prototype,`i18nStore`,void 0),j([o({type:Boolean,reflect:!0})],Kl.prototype,`show`,void 0),j([o({type:String})],Kl.prototype,`message`,void 0),j([o({type:String})],Kl.prototype,`actionLabel`,void 0),j([o({type:Object})],Kl.prototype,`onAction`,void 0),j([o({type:Object})],Kl.prototype,`onDismiss`,void 0),j([o({type:Number})],Kl.prototype,`timeout`,void 0),Kl=j([p(`alps-toast`)],Kl);function ql(){let e=document.activeElement;for(;e?.shadowRoot?.activeElement;)e=e.shadowRoot.activeElement;return e}var $=class extends d{constructor(...e){super(...e),this.attachments=[],this.mailbox=``,this.messageUid=``,this.activeIndex=0,this.zoom=1,this.rotation=0,this.loadedText=null,this.textLoading=!1,this.textError=null,this.copied=!1,this.pdfUrl=null,this.pdfLoading=!1,this.pdfError=null,this.loadToken=0,this.previouslyFocused=null,this.handleKeyDown=e=>{e.key===`Escape`?(e.preventDefault(),e.stopPropagation(),this.close()):e.key===`ArrowLeft`||e.key===`ArrowRight`?(e.preventDefault(),e.stopPropagation(),e.key===`ArrowLeft`?this.prev():this.next()):(e.key===`ArrowUp`||e.key===`ArrowDown`)&&e.stopPropagation()}}connectedCallback(){super.connectedCallback(),this.previouslyFocused=ql(),window.addEventListener(`keydown`,this.handleKeyDown,!0)}firstUpdated(){let e=this.shadowRoot?.querySelector(`dialog.backdrop`);e&&!e.open&&e.showModal(),this.shadowRoot?.querySelector(`.close-btn`)?.focus()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`keydown`,this.handleKeyDown,!0),this.replacePdfUrl(null);let e=this.previouslyFocused;this.previouslyFocused=null,e?.isConnected&&e.focus?.()}updated(e){(e.has(`activeIndex`)||e.has(`attachments`))&&(this.zoom=1,this.rotation=0,this.copied=!1,this.loadContent())}get current(){if(!this.attachments||this.attachments.length===0)return null;let e=Math.max(0,Math.min(this.activeIndex,this.attachments.length-1));return this.attachments[e]}nameOf(e){return e?.Filename||e?.filename||e?.name||this.i18nStore?.t(`messageReader.unknownAttachment`)||``}sizeOf(e){return e?.Size||e?.size||0}infoOf(e){return Qs(e?.MIMEType||e?.contentType,this.nameOf(e))}urlOf(e){return Rs(this.mailbox,this.messageUid,e)}replacePdfUrl(e){this.pdfUrl&&URL.revokeObjectURL(this.pdfUrl),this.pdfUrl=e}async loadContent(){let e=this.current;if(!e)return;let t=++this.loadToken;this.replacePdfUrl(null),this.pdfLoading=!1,this.pdfError=null,this.textLoading=!1,this.textError=null,this.loadedText=null;let n=this.infoOf(e),r=this.urlOf(e);if(r){if(n.previewKind===`text`){if(this.sizeOf(e)>2097152)return;this.textLoading=!0;try{let e=await D(r);if(!e.ok)throw Error(String(e.status));let n=await e.text();if(t!==this.loadToken)return;this.loadedText=n}catch(e){if(t!==this.loadToken)return;this.textError=e?.message||`error`}finally{t===this.loadToken&&(this.textLoading=!1)}return}if(n.previewKind===`pdf`){this.pdfLoading=!0;try{let e=await D(r);if(!e.ok)throw Error(String(e.status));let n=await e.blob();if(n.type!==`application/pdf`&&(n=new Blob([n],{type:`application/pdf`})),t!==this.loadToken)return;this.replacePdfUrl(URL.createObjectURL(n))}catch(e){if(t!==this.loadToken)return;this.pdfError=e?.message||`error`}finally{t===this.loadToken&&(this.pdfLoading=!1)}}}}close(){this.dispatchEvent(new CustomEvent(`close`,{bubbles:!0,composed:!0}))}prev(){this.attachments.length<=1||(this.activeIndex=(this.activeIndex-1+this.attachments.length)%this.attachments.length)}next(){this.attachments.length<=1||(this.activeIndex=(this.activeIndex+1)%this.attachments.length)}zoomIn(){this.zoom=Math.min(4,Math.round((this.zoom+.25)*100)/100)}zoomOut(){this.zoom=Math.max(.25,Math.round((this.zoom-.25)*100)/100)}resetZoom(){this.zoom=1,this.rotation=0}rotate(){this.rotation=(this.rotation+90)%360}async copyContent(){if(this.loadedText)try{await navigator.clipboard.writeText(this.loadedText),this.copied=!0,setTimeout(()=>{this.copied=!1},2e3)}catch{}}download(){let e=this.current,t=this.urlOf(e);if(!t)return;let n=document.createElement(`a`);n.href=t,n.download=this.nameOf(e)||`download`,document.body.appendChild(n),n.click(),document.body.removeChild(n)}openPdfInNewTab(){this.pdfUrl&&window.open(this.pdfUrl,`_blank`,`noopener,noreferrer`)}static{this.styles=_`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 30000;
      user-select: none;
    }
    /* The dialog is the whole window, and paints the overlay itself. */
    .backdrop {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 0;
      border: none;
      color: inherit;
      background: var(--modal-backdrop, rgba(255, 255, 255, 0.85));
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .backdrop::backdrop {
      background: transparent;
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
      font-family: var(--font-mono);
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
      <dialog class="backdrop" aria-labelledby="preview-title" @click=${c} @close=${()=>this.close()}>
        <div class="preview-header">
          <div class="meta-info">
            <div
              class="type-badge ${a.themeClass}"
              style="${a.color?`color: ${a.color}; background: color-mix(in srgb, ${a.color} 12%, transparent)`:``}"
            >${A(a.icon)}</div>
            <div class="file-details">
              <span class="file-title" id="preview-title" title="${r}">${r}</span>
              <span class="file-sub">
                <span>${pr(i)}</span>
                ${s>1?n`<span>•</span><span>${this.activeIndex+1} / ${s}</span>`:``}
              </span>
            </div>
          </div>
          <div class="actions-bar">
            ${a.isImage?n`
              <button class="action-btn icon-only zoom-out" @click=${this.zoomOut} title="${t(`attachment.zoomOut`)}">${A(`magnifyingGlassMinus`)}</button>
              <button class="action-btn icon-only fit" @click=${this.resetZoom} title="${t(`attachment.fitToScreen`)}">${A(`arrowsInSimple`)}</button>
              <button class="action-btn icon-only zoom-in" @click=${this.zoomIn} title="${t(`attachment.zoomIn`)}">${A(`magnifyingGlassPlus`)}</button>
              <button class="action-btn icon-only rotate" @click=${this.rotate} title="${t(`attachment.rotate`)}">${A(`arrowCounterClockwise`)}</button>
            `:``}
            ${a.previewKind===`text`&&this.loadedText?n`
              <button class="action-btn copy" @click=${this.copyContent} title="${t(`attachment.copyContent`)}">
                ${A(`copy`)}
                <span>${this.copied?t(`attachment.copied`):t(`attachment.copyContent`)}</span>
              </button>
            `:``}
            ${a.isPdf&&this.pdfUrl?n`
              <button class="action-btn icon-only new-tab" @click=${this.openPdfInNewTab} title="${t(`attachment.openInNewTab`)}">${A(`arrowsOutSimple`)}</button>
            `:``}
            ${o?n`
              <button class="action-btn icon-only download" @click=${this.download} title="${t(`attachment.download`)}">${A(`downloadSimple`)}</button>
            `:``}
            <button class="close-btn" @click=${this.close} title="${t(`attachment.close`)}">${A(`x`)}</button>
          </div>
        </div>

        <div class="preview-body" @click=${c}>
          ${s>1?n`
            <button class="nav-arrow prev" @click=${this.prev} title="${t(`attachment.previous`)}">${A(`caretLeft`)}</button>
            <button class="nav-arrow next" @click=${this.next} title="${t(`attachment.next`)}">${A(`caretRight`)}</button>
          `:``}
          ${this.renderContent(a,o,r,i)}
        </div>
      </dialog>
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
            ${A(`fileAudio`)}
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
        <div class="card-icon">${A(e.icon)}</div>
        <div class="card-title">${r}</div>
        <div class="card-desc">${a(`attachment.cannotPreview`)} (${pr(i)})</div>
        ${t?n`
          <button class="action-btn download" @click=${this.download}>
            ${A(`downloadSimple`)}
            <span>${a(`attachment.download`)}</span>
          </button>
        `:``}
      </div>
    `}};j([h({context:w,subscribe:!0})],$.prototype,`i18nStore`,void 0),j([o({type:Array})],$.prototype,`attachments`,void 0),j([o({type:String})],$.prototype,`mailbox`,void 0),j([o({type:String})],$.prototype,`messageUid`,void 0),j([o({type:Number})],$.prototype,`activeIndex`,void 0),j([a()],$.prototype,`zoom`,void 0),j([a()],$.prototype,`rotation`,void 0),j([a()],$.prototype,`loadedText`,void 0),j([a()],$.prototype,`textLoading`,void 0),j([a()],$.prototype,`textError`,void 0),j([a()],$.prototype,`copied`,void 0),j([a()],$.prototype,`pdfUrl`,void 0),j([a()],$.prototype,`pdfLoading`,void 0),j([a()],$.prototype,`pdfError`,void 0),$=j([p(`alps-attachment-preview`)],$);var Jl=3e3,Yl=15e3,Xl=3e3,Zl=1500,Ql=class extends d{static{this.styles=_`
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
  `}constructor(){super(),this.composeStore=new $o,this.settingsStore=new Ve,this.i18nStore=new be,this.linkedAccountsStore=ss,this.activeComposers=[],this.composerReady=!1,this.toasts=[],this.attachmentPreview=null,this.toastIdCounter=0,this.isOffline=!navigator.onLine,this.offlineCountdown=0,this.offlineInterval=null,this._handleOpenAttachmentPreview=e=>{let{attachments:t,mailbox:n,messageUid:r,index:i}=e.detail??{};!Array.isArray(t)||t.length===0||(this.attachmentPreview={attachments:t,mailbox:n,messageUid:r,index:i??0})},this._handlePluginsUpdated=()=>{this.requestUpdate()},this._handleGlobalDragOver=e=>{e.preventDefault()},this._handleGlobalDrop=e=>{e.preventDefault(),window.dispatchEvent(new CustomEvent(`alps-composer-drop`))},this._handleAuthError=()=>{os()||(sessionStorage.clear(),Ge(),window.dispatchEvent(new CustomEvent(`session-cleared`,{detail:{reason:`expired`}})),ns(`sessionExpired`),window.location.hash=`#/login`)},this._verifyConnectivity=async()=>{if(!navigator.onLine)return!1;try{let e=await fetch(`/site.webmanifest`,{method:`HEAD`,cache:`no-store`});return!(e.status===502||e.status===503||e.status===504)}catch{return!1}},this._handleOnlineEvent=async()=>{await this._verifyConnectivity()?(this.isOffline=!1,this._stopOfflineCountdown()):this._handleOfflineEvent()},this._verifyingNetworkError=!1,this._handleNetworkError=async()=>{if(!(this.isOffline||this._verifyingNetworkError)){this._verifyingNetworkError=!0;try{await this._verifyConnectivity()||this._handleOfflineEvent()}finally{this._verifyingNetworkError=!1}}},this._handleOfflineEvent=()=>{this.isOffline||(this.isOffline=!0,this.offlineCountdown=10,this._startOfflineCountdown())},this._isPinging=!1,this._handleShowToast=e=>{let t=++this.toastIdCounter,n={id:t,message:e.detail.message??(e.detail.i18nKey?this.i18nStore?.t(e.detail.i18nKey):void 0)??``,actionLabel:e.detail.actionLabel||``,actionFn:e.detail.actionFn,dismissFn:e.detail.dismissFn,timeout:e.detail.duration||Jl,show:!1};this.toasts=[...this.toasts,n],requestAnimationFrame(()=>{this.toasts=this.toasts.map(e=>e.id===t?{...e,show:!0}:e)})},this._handleBeforeUnload=e=>{if(this.activeComposers.some(e=>e.isSending))return e.preventDefault(),`You have a message currently sending. Are you sure you want to leave?`},this._handleUpdateAvailable=()=>{this._handleShowToast(new CustomEvent(`show-toast`,{detail:{i18nKey:`update.available`,actionLabel:this.i18nStore?.t(`update.reload`),actionFn:vt,duration:Yl}}))},this.composerModule=null,this._handleComposeChange=()=>{let e=this.composeStore.getState().activeComposers;e.length>0&&this.ensureComposerLoaded(),this._hasStructuralComposeChange(this.activeComposers,e)&&(this.activeComposers=e)},this._handleSettingsChange=()=>{let e=this.settingsStore.getState();pc.setLogoutTime(e.autoLogout??0),this.i18nStore.setLanguage(e.language??`en`)},this.mailboxPage=null,this.pluginPages=new Map,this._handleSessionCleared=()=>{this.mailboxPage=null,this.pluginPages.clear()},this.router=new kl(this.getRoutes(),()=>n`<div>404 — ${this.i18nStore.t(`general.notFound`)}</div>`,()=>this.requestUpdate()),this.addController(this.router)}connectedCallback(){super.connectedCallback();let e=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`))||document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));!e&&!window.location.hash.startsWith(`#/login`)&&(window.location.hash=`#/login`),this.settingsStore.setI18n(this.i18nStore),this.composeStore.addEventListener(`change`,this._handleComposeChange),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._handleComposeChange();let t=this.settingsStore.getState().autoLogout??0;pc.setLogoutTime(t),pc.onBeforeLogout=()=>this.composeStore.saveAllDirtyDrafts();let n=this.settingsStore.getState().language??`en`;this.i18nStore.setLanguage(n),window.addEventListener(`auth-error`,this._handleAuthError),window.addEventListener(`session-cleared`,this._handleSessionCleared),window.addEventListener(`show-toast`,this._handleShowToast),window.addEventListener(`beforeunload`,this._handleBeforeUnload),window.addEventListener(`online`,this._handleOnlineEvent),window.addEventListener(`offline`,this._handleOfflineEvent),window.addEventListener(`network-error`,this._handleNetworkError),window.addEventListener(`dragover`,this._handleGlobalDragOver),window.addEventListener(`drop`,this._handleGlobalDrop),window.addEventListener(`plugins-updated`,this._handlePluginsUpdated),window.addEventListener(`open-attachment-preview`,this._handleOpenAttachmentPreview),window.addEventListener(Je,this._handleUpdateAvailable),mt(()=>this.composeStore.getState().activeComposers.length>0),this.isOffline&&this._handleOfflineEvent(),e&&this._fetchSessionData()}async _fetchSessionData(){try{let e=await fetch(`/session`);if(e.ok){let t=await e.json();t.EnabledPlugins&&b.setEnabledPlugins(t.EnabledPlugins)}}catch(e){console.error(`Failed to fetch session data`,e)}}disconnectedCallback(){super.disconnectedCallback(),this.composeStore.removeEventListener(`change`,this._handleComposeChange),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),window.removeEventListener(`auth-error`,this._handleAuthError),window.removeEventListener(`session-cleared`,this._handleSessionCleared),window.removeEventListener(`show-toast`,this._handleShowToast),window.removeEventListener(`open-attachment-preview`,this._handleOpenAttachmentPreview),window.removeEventListener(`beforeunload`,this._handleBeforeUnload),window.removeEventListener(`online`,this._handleOnlineEvent),window.removeEventListener(`offline`,this._handleOfflineEvent),window.removeEventListener(`network-error`,this._handleNetworkError),window.removeEventListener(`dragover`,this._handleGlobalDragOver),window.removeEventListener(`drop`,this._handleGlobalDrop),window.removeEventListener(`plugins-updated`,this._handlePluginsUpdated),window.removeEventListener(Je,this._handleUpdateAvailable),mt(null),this._stopOfflineCountdown()}_startOfflineCountdown(){this._stopOfflineCountdown(),this.offlineInterval=window.setInterval(async()=>{if(this.offlineCountdown>1)this.offlineCountdown--;else{if(this.offlineCountdown=10,this._isPinging)return;this._isPinging=!0;try{await this._verifyConnectivity()&&(this.isOffline=!1,this._stopOfflineCountdown())}finally{this._isPinging=!1}}},1e3)}_stopOfflineCountdown(){this.offlineInterval!==null&&(clearInterval(this.offlineInterval),this.offlineInterval=null)}_handleDismissToast(e){this.toasts=this.toasts.map(t=>t.id===e?{...t,show:!1}:t),setTimeout(()=>{this.toasts=this.toasts.filter(t=>t.id!==e)},300)}firstUpdated(){let e=()=>{this.isConnected&&this.ensureComposerLoaded().catch(()=>{})},t=window.requestIdleCallback;typeof t==`function`?t(e,{timeout:Xl}):window.setTimeout(e,Zl)}ensureComposerLoaded(){return this.composerModule||=C(()=>import(`./alps-floating-composer-BNzQH-aO.js`).then(e=>(this.composerReady=!0,e)),__vite__mapDeps([2,3,4,5])).catch(e=>{throw this.composerModule=null,S.error(`Failed to load the composer`,e),e}),this.composerModule}_hasStructuralComposeChange(e,t){return e.length===t.length?t.some((t,n)=>{let r=e[n];return r.id!==t.id||!!r.minimized!=!!t.minimized||!!r.isSending!=!!t.isSending||!!r.dirty!=!!t.dirty||!!t.minimized&&(r.subject??``)!==(t.subject??``)}):!0}getMailboxPage(){return this.mailboxPage??=document.createElement(`mailbox-page`)}getRoutes(){let e={"/":()=>this.getMailboxPage(),"/login":()=>n`<login-page></login-page>`,"/mailbox/*":()=>this.getMailboxPage(),"/settings":()=>n`<settings-page category="general"></settings-page>`,"/settings/*":()=>{let e=window.location.hash.match(/^#\/settings\/?(.*)$/);return n`<settings-page .category=${e&&e[1]?e[1].split(`?`)[0]:`general`}></settings-page>`},"/original":()=>n`<original-message-page></original-message-page>`,"/print":()=>n`<print-page></print-page>`,"/login/webauthn":()=>n`<login-webauthn-page></login-webauthn-page>`};return b.getRoutes().forEach(t=>{e[t.path]=()=>{let e=this.pluginPages.get(t.path);return e||(e=document.createElement(t.component),this.pluginPages.set(t.path,e)),e}}),e}render(){let e=this.activeComposers.filter(e=>!e.minimized).length,t=this.activeComposers.filter(e=>e.minimized).length,r=0,i=0;return n`
      ${this.router.render()}
      
      <!-- Keyed by composer: a window's element is that composer's for its
           whole life. By position, closing the first of three handed the
           second window's element to the third composer, and a send counting
           down in it went on to send the wrong message. -->
      ${this.composerReady?f(this.activeComposers,e=>e.id,(a,o)=>{let s=a.minimized,c=s?0:r++,l=s?i++:0;return n`
          <alps-floating-composer
            .instance=${this.composeStore.getComposer(a.id)??a}
            .index=${o}
            .totalOpen=${e}
            .totalMinimized=${t}
            .openIndex=${c}
            .minimizedIndex=${l}
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
            <div class="offline-icon">${A(`wifiSlash`)}</div>
            <div style="font-weight: 500; font-size: 16px; margin-bottom: 8px; color: var(--text-primary, #111827);">
              ${this.i18nStore.t(`offline.description`)}
            </div>
            <div style="color: var(--text-secondary, #4b5563); font-size: 14px;">
              ${this.i18nStore.t(`offline.tryingAgain`,{count:this.offlineCountdown})}
            </div>
          </div>
        </ui-modal>
      `:``}
    `}};j([i({context:es})],Ql.prototype,`composeStore`,void 0),j([i({context:T})],Ql.prototype,`settingsStore`,void 0),j([i({context:w})],Ql.prototype,`i18nStore`,void 0),j([i({context:cs})],Ql.prototype,`linkedAccountsStore`,void 0),j([a()],Ql.prototype,`activeComposers`,void 0),j([a()],Ql.prototype,`composerReady`,void 0),j([a()],Ql.prototype,`toasts`,void 0),j([a()],Ql.prototype,`attachmentPreview`,void 0),j([a()],Ql.prototype,`isOffline`,void 0),j([a()],Ql.prototype,`offlineCountdown`,void 0),Ql=j([p(`app-root`)],Ql);var $l=Object.assign({"../../plugins/caldav/frontend/index.ts":bi,"../../plugins/carddav/frontend/index.ts":Rc,"../../plugins/gpg/frontend/index.ts":Jc,"../../plugins/managesieve/frontend/index.ts":El,"../../plugins/password/frontend/index.ts":Ol});S.info(`Loaded ${Object.keys($l).length} frontend plugins.`),ft();export{A,xa as C,H as D,ma as E,S as F,b as I,We as M,T as N,Nr as O,w as P,ya as S,Ca as T,so as _,Ko as a,to as b,qo as c,Ho as d,Lo as f,co as g,Xa as h,rc as i,Ue as j,j as k,Xo as l,Bo as m,gc as n,es as o,Vo as p,hc as r,Jo as s,mc as t,Yo as u,ro as v,Sa as w,Da as x,no as y};