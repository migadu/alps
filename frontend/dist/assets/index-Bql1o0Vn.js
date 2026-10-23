const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/calendar-page-BoiFJarV.js","assets/alps-address-input-BMmn33xW.js","assets/lit-CB2iQgdU.js","assets/task-modal-B5zTfqbS.js","assets/vendor-Bey7gDeL.js","assets/rolldown-runtime-S-ySWqyJ.js","assets/vendor-CFC-TXhq.css","assets/tasks-page-Dw_MTt1g.js","assets/contacts-page-8yaFiXOi.js","assets/openpgp-CVa1OxL9.js","assets/gpg-settings-D6bIXI7k.js","assets/managesieve-page-0UeFWltk.js","assets/managesieve-service-Dfbypbr_.js","assets/auto-reply-page-iIgyegzF.js","assets/password-settings-BY6dnMxd.js","assets/alps-floating-composer-Cg61R9IJ.js","assets/editor-lPhyAooS.js","assets/emoji-C1rmM34F.js"])))=>i.map(i=>d[i]);
import{n as e,r as t}from"./rolldown-runtime-S-ySWqyJ.js";import{_ as n,a as r,c as i,d as a,f as o,g as s,h as c,i as l,l as u,m as d,o as f,p,r as m,s as h,u as g,v as _,y as v}from"./lit-CB2iQgdU.js";import{n as y,r as b}from"./vendor-Bey7gDeL.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var x={debug:(...e)=>{},info:(...e)=>{console.info(`[INFO]`,...e)},warn:(...e)=>{console.warn(`[WARN]`,...e)},error:(...e)=>{console.error(`[ERROR]`,...e)}},S=`plugin-load-failed`,C=new Set,w=new Set;function ee(){w.clear()}function te(e){let{component:t,load:n}=e;if(!n||customElements.get(t)||C.has(t))return;C.add(t);let r=e=>{customElements.get(t)||w.has(t)||(w.add(t),x.error(`Failed to load <${t}>`,e),window.dispatchEvent(new CustomEvent(S,{detail:{component:t}})))},i;try{i=n.call(e)}catch(e){r(e),C.delete(t);return}Promise.resolve(i).then(()=>{if(!customElements.get(t))throw Error(`The module did not define <${t}>`);w.delete(t)}).catch(r).finally(()=>C.delete(t))}function ne(e,t){if(e===null||t===null)return e===t;if(e.size!==t.size)return!1;for(let n of e)if(!t.has(n))return!1;return!0}var T=new class{constructor(){this.navTabs=[],this.settingsTabs=[],this.routes=[],this.hooks=new Map,this.enabledPlugins=null}setEnabledPlugins(e){let t=new Set(e);ne(this.enabledPlugins,t)||(this.enabledPlugins=t,window.dispatchEvent(new CustomEvent(`plugins-updated`)))}isEnabled(e){return this.enabledPlugins===null||this.enabledPlugins.has(e)}registerHook(e,t,n){this.hooks.has(e)||this.hooks.set(e,[]),this.hooks.get(e).push({handler:t,pluginId:n})}enabledHandlers(e){return(this.hooks.get(e)||[]).filter(e=>!e.pluginId||this.isEnabled(e.pluginId)).map(e=>e.handler)}async invokeHookAsync(e,t){let{results:n}=await this.invokeHookSettled(e,t);return n}async invokeHookSettled(e,t){let n=this.enabledHandlers(e),r=await Promise.allSettled(n.map(e=>e(t))),i=[],a=0;for(let t of r)t.status===`fulfilled`?i.push(t.value):(a+=1,console.error(`Error in async hook ${e}:`,t.reason));return{results:i,failed:a}}invokeHook(e,t){let n=this.enabledHandlers(e),r=[];return n.forEach(n=>{try{r.push(n(t))}catch(t){console.error(`Error in hook ${e}:`,t)}}),r}registerNavTab(e){this.navTabs.find(t=>t.id===e.id)||this.navTabs.push(e)}getNavTabs(){let e=this.navTabs;return this.enabledPlugins!==null&&(e=e.filter(e=>this.isEnabled(e.pluginId||e.id))),e.slice().sort((e,t)=>(e.order||999)-(t.order||999))}registerSettingsTab(e){this.settingsTabs.find(t=>t.id===e.id)||this.settingsTabs.push(e)}getSettingsTabs(){return this.enabledPlugins===null?this.settingsTabs:this.settingsTabs.filter(e=>this.isEnabled(e.pluginId||e.id))}registerRoute(e){this.routes.find(t=>t.path===e.path)||this.routes.push(e)}getRoutes(){return this.enabledPlugins===null?this.routes:this.routes.filter(e=>!e.pluginId||this.isEnabled(e.pluginId))}},re=e({default:()=>ie}),ie={calendar:{deleteCalendarFailed:`The calendar could not be deleted.`,deleteEventFailed:`The event could not be deleted.`,saveCalendarFailed:`The calendar could not be saved.`,saveEventFailed:`The event could not be saved.`,endBeforeStart:`The event cannot end before it starts.`,saveConflict:`This event was changed on another device, so your edit was not saved. Close the editor and open the event again to see the latest version.`,loadFailed:`Could not load your calendar. Check your connection and try again.`,months:{0:`January`,1:`February`,2:`March`,3:`April`,4:`May`,5:`June`,6:`July`,7:`August`,8:`September`,9:`October`,10:`November`,11:`December`},monthsShort:{0:`Jan`,1:`Feb`,2:`Mar`,3:`Apr`,4:`May`,5:`Jun`,6:`Jul`,7:`Aug`,8:`Sep`,9:`Oct`,10:`Nov`,11:`Dec`},days:{0:`Sunday`,1:`Monday`,2:`Tuesday`,3:`Wednesday`,4:`Thursday`,5:`Friday`,6:`Saturday`},daysShort:{0:`Sun`,1:`Mon`,2:`Tue`,3:`Wed`,4:`Thu`,5:`Fri`,6:`Sat`},daysNarrow:{0:`S`,1:`M`,2:`T`,3:`W`,4:`T`,5:`F`,6:`S`},title:`Calendar`,myCalendars:`My Calendars`,addEvent:`Add Event`,rename:`Rename`,delete:`Delete`,addCalendar:`Add Calendar`,previousMonth:`Previous month`,nextMonth:`Next month`,renameCalendar:`Rename Calendar`,deleteCalendar:`Delete Calendar`,deleteCalendarConfirm:`Are you sure you want to delete the calendar "{name}"?`,calendarName:`Calendar Name`,searchResults:`Search Results`,noResults:`No events found matching your search.`,day:`Day`,week:`Week`,month:`Month`,year:`Year`,today:`Today`,allDay:`All Day`,noTitle:`(No title)`,location:`Location`,notes:`Notes`,editEvent:`Edit Event`,deleteEvent:`Delete Event`,deleteEventConfirm:`Are you sure you want to delete this event?`,newEvent:`New Event`,summary:`Summary`,eventTitle:`Event title`,calendar:`Calendar`,startDate:`Start Date`,endDate:`End Date`,time:`Time`,startTime:`Start Time`,endTime:`End Time`,addLocation:`Add location`,addDescription:`Add description`,description:`Description`,moreEvents:`+{count} more`,repeat:`Repeat`,repeatNone:`Do not repeat`,repeatDaily:`Daily`,repeatWeekly:`Weekly`,repeatMonthly:`Monthly`,repeatYearly:`Yearly`,repeatCustom:`Custom`},tasks:{title:`Tasks`,addTask:`Add Task`,newTask:`New Task`,editTask:`Edit Task`,allTasks:`All Tasks`,today:`Today`,upcoming:`Upcoming`,undated:`No Due Date`,completed:`Completed`,searchResults:`Search Results`,lists:`Lists`,newList:`New List`,listName:`List Name`,list:`List`,noTasks:`Nothing to do.`,noResults:`No tasks match your search.`,untitled:`(No title)`,titleField:`Title`,titlePlaceholder:`What needs doing?`,notes:`Notes`,addNotes:`Add notes`,due:`Due`,time:`Time`,allDay:`All Day`,status:`Status`,percentComplete:`Percent Complete`,priority:`Priority`,repeat:`Repeat`,repeatNeedsDue:`Add a due date to repeat this task.`,assignedBy:`Assigned by:`,assignedTo:`Assigned to:`,assigneeAnswer:`{name}: {status}`,delete:`Delete`,deleteTask:`Delete Task`,deleteTaskConfirm:`Are you sure you want to delete this task?`,markDone:`Mark as done`,markNotDone:`Mark as not done`,repeats:`Repeats`,movedToNext:`Done. The task repeats, and is now due {date}.`,loadFailed:`Could not load your tasks. Check your connection and try again.`,someListsFailed:`Some lists could not be loaded, so not every task is shown.`,saveFailed:`The task could not be saved.`,saveConflict:`This task was changed on another device, so your edit was not saved. Close the editor and open the task again to see the latest version.`,completeFailed:`The task could not be updated.`,deleteFailed:`The task could not be deleted.`,createListFailed:`The list could not be created.`,assignTo:`Assign to`,notifyChanges:`The people this task is assigned to can be sent the changes.`,deleteTellAssignees:`The people this task is assigned to can be told it is cancelled.`,deleteTellAssigner:`Whoever assigned this task can be told you will not do it.`,groups:{overdue:`Overdue`,today:`Today`,week:`Next 7 Days`,undated:`No Due Date`,later:`Later`,completed:`Completed`},statuses:{needsAction:`Not Started`,inProcess:`In Progress`,completed:`Completed`,cancelled:`Cancelled`},priorities:{none:`None`,high:`High`,medium:`Medium`,low:`Low`}},invitations:{kinds:{invitation:`Invitation`,updated:`Updated invitation`,cancelled:`Cancelled`,reply:`Answer`,event:`Event`,task:`Task`},accept:`Accept`,maybe:`Maybe`,decline:`Decline`,yourAnswer:`Your answer`,yourAnswerIs:`Your answer: {status}`,organizer:`Organizer`,organizerIs:`Organizer: {name}`,dueOn:`Due: {date}`,guests:`Guests`,calendar:`Calendar`,repeats:`Repeats`,conflictsWith:`Conflicts with {names}`,noConflicts:`No conflicts in your calendar`,statuses:{accepted:`Accepted`,tentative:`Maybe`,declined:`Declined`,needsAction:`Not answered`,delegated:`Delegated`,completed:`Completed`,inProcess:`In progress`},answered:{accepted:`{name} accepted.`,tentative:`{name} might attend.`,declined:`{name} declined.`,needsAction:`{name} has not answered yet.`,delegated:`{name} passed this on to someone else.`,completed:`{name} completed the task.`,inProcess:`{name} is working on the task.`},states:{organizer:`You organize this.`,notInvited:`None of your addresses is on the guest list, so you cannot answer this invitation.`,outdated:`Your calendar already has a newer version.`,update:`This is newer than the version in your calendar.`,cancel:`The organizer has cancelled this.`,cancelled:`The organizer has cancelled this. It is not in your calendar.`,reply:`This answer is not in your calendar yet.`,replied:`Your calendar has this answer.`,unknown:`This answer is about nothing in your calendar.`,add:`This is not in your calendar.`,added:`This is in your calendar.`,ended:`This event is over.`,unsupported:`This calendar message cannot be acted on here.`},unverified:`Sent from {sender}, who is not the organizer.`,unverifiedReply:`Sent from {sender}, not by the guest who answered.`,updateCalendar:`Update calendar`,removeFromCalendar:`Remove from calendar`,recordAnswer:`Record answer`,addToCalendar:`Add to calendar`,saved:`Saved to your calendar.`,sent:`Saved to your calendar, and your answer was sent to the organizer.`,sendFailed:`Saved to your calendar, but your answer could not be sent to the organizer.`,updated:`Your calendar has been updated.`,removed:`Removed from your calendar.`,added:`Added to your calendar.`,answerFailed:`Your answer could not be saved.`,applyFailed:`Your calendar could not be updated.`,organizedBy:`Organized by {name}`,notifyTitle:`Send updates to the guests?`,notifyChanges:`Your guests can be sent the changes to this event.`,send:`Send`,dontSend:`Don't send`,deleteTellGuests:`The guests can be told that this event is cancelled.`,deleteTellOrganizer:`The organizer can be told that you will not attend.`,deleteAndTell:`Delete and tell them`,deleteOnly:`Just delete`,notTold:`Done, but the email about it could not be sent.`,changedElsewhere:`This was changed on another device in the meantime. Open the message again to see where it stands.`}},ae=e({default:()=>oe}),oe={contacts:{deleteFailed:{one:`{count} of {total} contacts could not be deleted.`,other:`{count} of {total} contacts could not be deleted.`},categoryRenameFailed:{one:`{count} of {total} contacts could not be updated, so the category was only partly renamed.`,other:`{count} of {total} contacts could not be updated, so the category was only partly renamed.`},categoryDeleteFailed:{one:`{count} of {total} contacts could not be updated, so the category was only partly removed.`,other:`{count} of {total} contacts could not be updated, so the category was only partly removed.`},categoryUpdateFailed:{one:`{count} of {total} contacts could not be updated.`,other:`{count} of {total} contacts could not be updated.`},deleteOneFailed:`The contact could not be deleted.`,categoryRenameOneFailed:`A contact could not be updated, so the category was only partly renamed.`,categoryDeleteOneFailed:`A contact could not be updated, so the category was only partly removed.`,categoryUpdateOneFailed:`The contact could not be updated.`,saveFailed:`The contact could not be saved.`,loadFailed:`The contact could not be loaded, so it cannot be edited yet.`,saveConflict:`This contact was changed on another device, so your edit was not saved. Cancel the edit to see the latest version.`,starFailed:{one:`{count} of {total} contacts could not be updated.`,other:`{count} of {total} contacts could not be updated.`},starOneFailed:`The contact could not be updated.`,unnamedContact:`Unnamed Contact`,title:`Contacts`,allContacts:`All Contacts`,favorites:`Favorites`,addContact:`Add Contact`,createCategory:`Create Category`,categoryName:`Category Name`,renameCategory:`Rename Category`,deleteCategory:`Delete Category`,deleteCategoryConfirm:`Are you sure you want to delete the category '{category}'? This will remove it from all contacts. No contacts will be deleted.`,rename:`Rename`,delete:`Delete`,create:`Create`,add:`Add`,newCategory:`New Category`,refreshContacts:`Refresh Contacts`,sortZa:`Sort Z-A`,sortAz:`Sort A-Z`,filterStarred:`Filter Starred`,uncategorized:`Uncategorized`,addToCategory:`Add to Category`,deleteContact:`Delete Contact`,deleteContactConfirm:`Are you sure you want to delete this contact?`,editContact:`Edit Contact`,save:`Save`,cancel:`Cancel`,noContacts:`No contacts found`,selectContact:`Select a contact to view details`,selectedContacts:{one:`{count} contact selected`,other:`{count} contacts selected`},clearSelection:`Clear selection`,selectAll:`Select All`,clearSearch:`Clear Search`,searchContacts:`Search contacts...`,details:`Details`,notes:`Notes`,name:`Name`,nickname:`Nickname`,organization:`Organization`,titleField:`Title`,email:`Email`,phone:`Phone`,address:`Address`,url:`URL`,birthday:`Birthday`,birthdayDay:`Day`,birthdayMonth:`Month`,birthdayYear:`Year`,back:`Back`,toggleStar:`Toggle Star`,publicKey:`Public Key`,addEmail:`Add Email`,addPhone:`Add Phone`,typeDefault:`Default`,typeHome:`Home`,typeWork:`Work`,typeOther:`Other`,typeMobile:`Mobile`}},se=e({default:()=>ce}),ce={settings:{gpg:`GPG Keys`},gpg:{toggleEncryption:`Toggle GPG Encryption`,decryptedSuccess:`The content of this message was end-to-end encrypted with GPG.`,decryptedFailed:`This message is encrypted but no matching private key is found on server to decrypt it.`,passphraseRequired:`GPG Passphrase Required`,passphraseSetTitle:`Set GPG Passphrase`,passphraseConfirmTitle:`Confirm GPG Passphrase`,passphrasePrompt:`Please enter your passphrase to unlock your private key.`,passphraseLockPrompt:`Please enter a new passphrase to encrypt your private key.`,passphraseConfirmPrompt:`Please re-enter your passphrase to confirm.`,passphrase:`Passphrase`,cancel:`Cancel`,unlock:`Unlock`,lock:`Set Passphrase`,confirm:`Confirm`,yourGpgKey:`Your GPG Key`,keyStoredSecurely:`You have a GPG keypair stored securely on the server. The private key is encrypted with your passphrase.`,publicKey:`Public Key`,purgeKeys:`Purge Keypair`,generateNewKeypair:`Generate New Keypair`,enableEncryptionDesc:`To enable end-to-end encryption between contacts that support it, you'll need a GPG keypair.`,noKeyPresent:`No key present`,passphraseRequiredLabel:`Passphrase (Required)`,generateKeysBtn:`Generate Keys`,importExistingKeys:`Import Existing GPG Keypair`,publicKeyBlock:`Public Key Block`,privateKeyBlock:`Private Key Block`,importUnencryptedDesc:`Paste your public and private key blocks, e.g. from "gpg --armor --export-secret-keys". If the private key is passphrase-protected, you'll be asked for its current passphrase, then to set a new one.`,importIncorrectPassphrase:`Incorrect passphrase for the private key. Please try again.`,importKeysBtn:`Import Keys`,purgeConfirm:`Are you sure you want to permanently delete your GPG keys from the server? Past encrypted emails will become unreadable.`,passphraseMissing:`Passphrase is required to encrypt your new private key.`,importMissing:`Both public and private blocks are required for import.`,generateFailed:`Failed to generate keys: {error}`,importFailed:`Import failed: {error}`,importFailedTitle:`Import Failed`,passphraseMismatch:`Passphrases do not match. Please try again.`,missingPublicKeys:`Cannot encrypt: Missing public keys for:
{keys}`,attachmentsNotEncryptable:`Attachments cannot be encrypted with inline PGP and would be sent unencrypted. Remove the attachments, or turn off encryption to send them.`}},le=e({default:()=>ue}),ue={settings:{categories:{filters:`Filters`,autoReply:`Auto-reply`}},managesieve:{title:`Filters`,description:`Add custom rules on how messages are processed and filed.`,loadError:`Could not load the filters.`,loadErrorRetry:`Try again`,tabs:{switchToRaw:`Raw Editor`},warningRawSwitchTitle:`Switch to Raw Mode`,warningRawSwitchConfirm:`Switch`,warningRawSwitch:`Switching to raw mode means the script will no longer be editable visually. Continue?`,toast:{saved:`Rules saved and activated.`,deactivated:`Rules deactivated.`,valid:`Script is valid!`,networkError:`Network error occurred.`,autoReplyOn:`The auto-reply is on. Switch it off under Auto-reply before the filters send a vacation reply of their own.`},visual:{newRule:`New Rule`,noRules:`No rules defined.`,saveFilters:`Save`,deleteRule:`Delete Rule`,remove:`Remove`,add:`Add`,if:`IF`,all:`ALL`,any:`ANY`,ofTheFollowing:`of the following conditions match`,then:`THEN`,value:`Value`,actions:{fileinto:`Move to folder`,discard:`Discard (Delete)`,redirect:`Redirect to email`,stop:`Stop evaluating rules`},fields:{subject:`Subject`,from:`From`,to:`To`,body:`Body`,size:`Size`,emailAddress:`Email Address`},operators:{contains:`Contains`,not_contains:`Does not contain`,is:`Is exactly`,not_is:`Is not exactly`,over:`Over`,under:`Under`}},raw:{validate:`Validate`,save:`Save`},autoReply:{title:`Auto-reply`,description:`Reply automatically to people who write to you while you are away.`,enable:`Send an auto-reply`,stateActive:`Replying to senders now.`,stateActiveUntil:`Replying to senders until {date}.`,stateScheduled:`Scheduled to start on {date}.`,stateFinished:`The end date has passed, so nobody is being replied to.`,subject:`Subject`,subjectDesc:`Optional. Left empty, the mail server chooses one.`,subjectPlaceholder:`Out of office`,message:`Message`,messageDesc:`What everyone who writes to you receives.`,messagePlaceholder:`I am away until the 15th and will reply when I am back.`,dates:`Dates`,datesDesc:`Optional. Leave a date empty to leave that end open. A day runs from midnight to midnight in your time zone.`,startDate:`Start date`,endDate:`End date`,interval:`Answer the same sender again after`,intervalDesc:`Someone who writes several times within that time gets one reply. Mailing lists and automated mail never get one.`,days:{one:`{count} day`,other:`{count} days`},save:`Save`,saved:`Auto-reply saved.`,turnedOff:`Auto-reply turned off.`,unsupported:`This mail server does not offer automatic replies.`,ownVacation:`Your filters already send an automatic reply of their own. Remove it in the raw editor under Filters to set one up here.`,errors:{emptyMessage:`Write the message senders will receive, or switch the auto-reply off.`,invalidWindow:`The start date cannot be after the end date.`,loadError:`Could not load the auto-reply.`,saveError:`Could not save the auto-reply.`}}}},de=e({default:()=>fe}),fe={settings:{categories:{password:`Password`},password:{title:`Password`,changePassword:`Change Password`,changePasswordDesc:`Update your account password.`,oldPassword:`Current Password`,newPassword:`New Password`,confirmPassword:`Confirm New Password`,updatePassword:`Update Password`,fillAllFields:`Please fill in all fields.`,passwordMismatch:`New passwords do not match.`}}},pe={tags:{important:`Important`,work:`Work`,personal:`Personal`,todo:`To Do`,later:`Later`},settings:{saveFailed:`Could not save that setting — it may not survive signing out`,title:`Settings`,categories:{general:`General`,identity:`Identity`,reading:`Reading & Composing`,appearance:`Appearance`,localization:`Localization`,accounts:`Linked Accounts`,accountsDesc:`Pre-authorized accounts for quick switching between.`,webauthn:`2FA / WebAuthn`},loading:`Loading...`,placeholderName:`Your Name`,placeholderReplyTo:`reply@example.com`,general:{checkMailInterval:`Check mail interval`,checkMailIntervalDesc:`How often to automatically check for new mail.`,autoLogout:`Auto-logout`,autoLogoutDesc:`Automatically log out after inactivity.`,desktopNotifications:`Enable Desktop Notifications`,soundNotifications:`Play sound notification on new messages`,everyMinute:`Every minute`,every5Minutes:`Every 5 minutes`,every15Minutes:`Every 15 minutes`,every30Minutes:`Every 30 minutes`,never:`Never`,minutes15:`15 minutes`,minutes30:`30 minutes`,hour1:`1 hour`,hours2:`2 hours`,hours6:`6 hours`},identity:{displayName:`Display Name`,displayNameDesc:`The name shown to recipients when you send an email.`,signature:`Signature`,signatureDesc:`Appended to the end of your sent messages.`,replyTo:`Reply-To Address`,replyToDesc:`Optional: specify a different address for replies.`,bccMyself:`Always BCC myself on outgoing mail`},reading:{messagesPerPage:`Messages per page`,preferredView:`Preferred View`,preferredViewDesc:`How to display messages that have both HTML and Plain Text.`,showRemoteContent:`Show Remote Content`,composeFormat:`Compose Format`,html:`HTML`,plainText:`Plain Text`,alwaysAsk:`Always ask`,alwaysLoad:`Always load`,richText:`Rich Text (HTML)`,markReadTimeout:`Mark as Read`,markReadImmediately:`Immediately`,markRead1s:`After 1 second`,markRead3s:`After 3 seconds`,markRead5s:`After 5 seconds`,markRead10s:`After 10 seconds`,markReadNever:`Never mark automatically`,messageSortCriteria:`Message Sort Criteria`,messageSortCriteriaDesc:`Choose whether to sort by the original received date or by folder filing date.`,sortUid:`Folder Filing Date`,sortDate:`Received Date`,enableThreading:`Use threading`,themeIframeContent:`Apply theme to HTML messages content`,threadingNotSupported:`Not supported by your mail server`},appearance:{colorTheme:`Color Theme`,colorThemeDesc:`Select your preferred color palette.`,themeMode:`Theme Mode`,themeModeDesc:`Choose light, dark, or system auto.`,layoutMode:`Layout Mode`,layoutModeDesc:`Choose how you want your mailbox to be laid out.`,listDensity:`List Density`,listDensityDesc:`Adjust the spacing and compactness of the message list.`,light:`Light`,dark:`Dark`,systemAuto:`System Auto`,vertical:`Vertical (3 Panes)`,horizontal:`Horizontal (Top/Bottom)`,fullScreen:`Full Screen (Hide list when reading)`,loose:`Loose`,normal:`Normal`,compact:`Compact`,ultraCompact:`Ultra Compact`,showSenderAvatars:`Show sender avatars`,showSenderAvatarsDesc:`Pictures and initials beside senders in the message list and reader. Whether a sender is verified is shown either way.`},localization:{language:`Language`,timeFormat:`Time Format`,dateFormat:`Date Format`,weekStart:`First Day of the Week`,sunday:`Sunday`,monday:`Monday`,format12h:`12-hour (AM/PM)`,format24h:`24-hour`,english:`English`,german:`Deutsch`,italian:`Italiano`,spanish:`Español`,serbian:`Српски (ћирилица)`,serbianLatin:`Srpski (latinica)`,french:`Français`,portuguese:`Português`,danish:`Dansk`}},linkedAccounts:{description:`Connect another account to quickly switch between them without logging out.`,noAccounts:`No linked accounts.`,remove:`Remove`,addTitle:`Link Account`,linkAccount:`Link Account`,addedSuccess:`Account linked successfully.`,addError:`Failed to add account. Please check the credentials.`,removeConfirm:`Are you sure you want to remove this linked account?`,removedSuccess:`Account removed.`,removeError:`Failed to remove account.`,switchError:`Failed to switch account. The password might have changed.`},webauthn:{title:`Security Key Verification`,instruction:`Please use your security key to complete login.`,not_supported:`WebAuthn is not supported in your browser.`,requesting:`Requesting authentication...`,waiting_for_key:`Waiting for security key...`,verifying:`Verifying...`,success:`Verification successful, redirecting...`,verify_btn:`Verify Identity`,verifying_btn:`Verifying...`,back_to_login:`Back to Login`,key_name_placeholder:`Device name (e.g. YubiKey)`,name_key_title:`Name Security Key`,name_key_label:`Device Name`,add_key:`Add Security Key`,trust_linked:`Trust Linked Accounts`,trust_linked_desc:`If enabled, you can switch to this account from a linked account without providing a 2FA credential again.`,trust_linked_checkbox:`Allow switching to this account without 2FA`,trust_password_label:`Enter your password to confirm`,confirm_remove:`Are you sure you want to remove this security key?`,remove_password_label:`Enter your password to remove this security key`,errors:{begin_failed:`Failed to initiate authentication.`,invalid_options:`Invalid authentication options received.`,verification_failed:`Verification failed. Please try again.`,cancelled:`The security key was not used. Click "Verify Identity" to try again.`,unavailable:`The server could not check your security key just now. Please try again in a moment.`,register_failed:`There was an error registering your security key. Please try again.`,remove_failed:`Failed to remove the security key.`,wrong_password:`That password is not right.`,password_required:`Enter your current password.`,rate_limited:`Too many attempts. Please wait a few minutes and try again.`,two_factor_required:`Sign in with your security key to change this setting.`,no_security_key:`Add a security key first.`,trust_failed:`The setting could not be changed. Please try again.`,remove_unavailable:`The security key could not be removed just now. Please try again in a moment.`,general:`An error occurred.`},settings:{group_desc:`Secure your account with a hardware security key or biometrics.`,keys_title:`Security Keys`,noKeys:`No registered keys.`,added:`Added`,remove_btn:`Remove`,unnamed_key:`Security Key`}},print:{loading:`Loading print view...`},login:{subtitle:`Sign in to your webmail.`,emailPlaceholder:`Email Address`,passwordPlaceholder:`Password`,keepMeSignedIn:`Keep me signed in`,signIn:`Sign In`,tooManyAttempts:`Too many login attempts`,loginFailed:`Login failed. Please check your credentials.`,networkError:`Network error occurred. Please try again.`,pleaseWait:`Please wait`,wait:`Wait`,signedOut:`You have been signed out.`,signedOutDraftsKept:`You have been signed out. Some unsent drafts could not be saved to the server. They are kept on this device and reopen when you sign in again.`,sessionExpired:`Your session has expired. Please sign in again.`,secondFactorExpired:`Your sign-in timed out before the security key was checked. Please sign in again.`,inactivitySignedOut:`You've been signed out due to inactivity.`,inactivitySignedOutDraftsKept:`You've been signed out due to inactivity. Some unsent drafts could not be saved to the server. They are kept on this device and reopen when you sign in again.`},folderList:{compose:`Compose`,inbox:`Inbox`,drafts:`Drafts`,sent:`Sent`,archive:`Archive`,spam:`Spam`,junk:`Junk`,trash:`Trash`,allFolders:`All Folders`,title:`Folders`,rename:`Rename`,delete:`Delete`,createFolder:`Create Folder`,renameFolder:`Rename Folder`,folderName:`Folder name`,deleteFolder:`Delete Folder`,deleteFolderConfirm:`Are you sure you want to delete "{folder}"? All messages inside will be permanently deleted.`,expandSidebar:`Expand sidebar`,collapseSidebar:`Collapse sidebar`,moveToTrash:`Move to Trash`,moveToTrashConfirm:`Are you sure you want to move "{folder}" to the Trash?`,createSubfolder:`Create subfolder`,createSubfolderUnder:`Create Subfolder under "{folder}"`,subscribe:`Subscribe`,unsubscribe:`Unsubscribe`,order:`Order`,moveToTop:`Move to Top`,moveUp:`Move Up`,moveDown:`Move Down`,moveToBottom:`Move to Bottom`,more:`More`,less:`Less`,unsubscribedFolders:`Unsubscribed folders`},search:{placeholder:`Search mail`},messageList:{menu:`Menu`,selectAll:`Select all messages`,allOnPageSelected:{one:`{count} message on this page is selected`,other:`All {count} messages on this page are selected`},selectAllMatching:{one:`Select {count} in {folder}`,other:`Select all {count} in {folder}`},allMatchingSelected:{one:`{count} message in {folder} is selected`,other:`All {count} messages in {folder} are selected`},clearSelection:`Clear selection`,dragCount:{one:`{count} message`,other:`{count} messages`},checkNew:`Check for new messages`,sortDesc:`Sort descending by date`,sortAsc:`Sort ascending by date`,filterStarred:`Filter by starred`,filterUnread:`Filter by unread`,noMessages:`No messages`,loadError:`Could not load this folder.`,loadErrorRetry:`Try again`,loading:`Loading...`,unknownSender:`Unknown Sender`,unknown:`Unknown`,noSubject:`(No Subject)`,hasAttachments:`Has attachments`,replied:`Replied`,forwarded:`Forwarded`,searchResultsFor:`Search results for:`,clearSearch:`Clear search`,searchAllMailboxes:`Search All`,totalMessagesIn:{one:`{count} message in {folder}`,other:`{count} total messages in {folder}`},totalConversationsIn:{one:`{count} conversation in {folder}`,other:`{count} total conversations in {folder}`},deleteAllNow:`Delete All Now`,emptyMailboxTitle:`Empty {folder}`,emptyMailboxConfirm:{one:`Are you sure you want to permanently delete the one message in {folder}? This action cannot be undone.`,other:`Are you sure you want to permanently delete all {count} messages in {folder}? This action cannot be undone.`},emptyMailboxConfirmConversations:{one:`Are you sure you want to permanently delete the one conversation in {folder}, and every message in it? This action cannot be undone.`,other:`Are you sure you want to permanently delete all {count} conversations in {folder}, and every message in them? This action cannot be undone.`},emptyMailboxSelectionNote:{one:`This includes the message you have checked.`,other:`This includes the {count} messages you have checked.`},emptyingMailbox:`Emptying {folder}...`,mailboxEmptied:`{folder} emptied.`,emptyMailboxFailed:`Failed to empty {folder}.`,mailboxAlreadyEmpty:`{folder} was already empty — nothing was deleted.`,emptyMailboxSlow:`Still emptying {folder}. The server is working on it — check the folder again in a moment.`},composer:{discardFailed:`The draft could not be deleted from the server and is still in Drafts.`,attachmentsTooLarge:`Attachments exceed the maximum allowed size.`,draftSaveFailedKeepOpen:`Could not save this draft — the window stays open so nothing is lost`,attachmentsWait:`Please wait for attachments to finish uploading before sending.`,attachmentsGone:{one:`{count} attachment has to be added again: the server no longer has its upload.`,other:`{count} attachments have to be added again: the server no longer has their uploads.`},sending:`Message is being sent...`,undo:`Undo`,sendError:`Failed to send message: {error}`,presendFailed:`A security plugin could not process this message, so it was not sent.`},messageComposer:{fontSize:`Font Size`,small:`Small`,normal:`Normal`,large:`Large`,huge:`Huge`,bold:`Bold`,italic:`Italic`,underline:`Underline`,textColor:`Text Color`,align:`Align`,left:`Left`,center:`Center`,right:`Right`,numberedList:`Numbered List`,bulletedList:`Bulleted List`,indentMore:`Indent More`,indentLess:`Indent Less`,moreFormatting:`More Formatting`,undo:`Undo`,redo:`Redo`,quote:`Quote`,strikethrough:`Strikethrough`,clearFormatting:`Clear Formatting`,goToLink:`Go to link:`,change:`Change`,remove:`Remove`,text:`Text`,link:`Link`,apply:`Apply`,writeMessage:`Write your message...`},floatingComposer:{discardDraftTitle:`Discard Draft?`,discardDraftMessage:`Are you sure you want to discard this draft? This action cannot be undone.`,discard:`Discard`,dropFiles:`Drop files here to attach`,newMessage:`New Message`,saving:`Saving...`,autosaved:`Autosaved`,restore:`Restore`,minimize:`Minimize`,expand:`Expand`,saveAndClose:`Save & close`,to:`To`,cc:`Cc`,bcc:`Bcc`,subject:`Subject`,toggleFormatting:`Toggle Formatting Options`,attachFiles:`Attach Files`,insertLink:`Insert Link`,insertEmoji:`Insert Emoji`,send:`Send`,linkUrl:`Link URL`,linkUrlPlaceholder:`https://example.com`,displayText:`Display Text`,displayTextPlaceholder:`My Website`,apply:`Apply`,uploadFailed:`Failed to upload attachment: {error}`,unknownError:`Unknown error`},messageReader:{moreOptions:`More options`,tags:`Tags`,removeAllTags:`Remove all tags`,removeTag:`Remove tag`,selectMessage:`Select a message to read`,messagesSelected:{one:`{count} message selected`,other:`{count} messages selected`},back:`Back`,reply:`Reply`,replyAll:`Reply All`,forward:`Forward`,to:`To:`,cc:`Cc:`,date:`Date:`,undisclosed:`Undisclosed`,loadingMessage:`Loading message...`,remoteContentWarning:`This message contains remote content. For your privacy, it has been blocked.`,loadRemoteContent:`Load remote content`,isDraft:`This is a draft message.`,editDraft:`Edit Draft`,noRecipients:`(No Recipients)`,discardDraft:`Discard Draft`,noReadableText:`This message contains no readable text, only attachments.`,attachments:`Attachments`,downloadAllAttachments:`Download all attachments`,unknownAttachment:`Unknown attachment`,archive:`Archive`,reportSpam:`Report Spam`,notSpam:`Not Spam`,delete:`Delete`,deleteThread:`Delete conversation`,deleteConfirmSingle:`Are you sure you want to permanently delete this message? This action cannot be undone.`,deleteConfirmMultiple:`Are you sure you want to permanently delete these messages? This action cannot be undone.`,markUnread:`Mark as unread`,markRead:`Mark as read`,star:`Star`,moveTo:`Copy/Move to...`,print:`Print`,showPlaintext:`Show plaintext`,showHtml:`Show HTML`,downloadMessage:`Download message`,showOriginal:`Show original`,verifiedSender:`Verified Sender`,unverifiedSender:`Unverified Sender`,senderUnverifiedWarning:`Your mail server could not verify this sender. The message may not be from who it claims to be, so be careful with its links and attachments.`,clickToExpand:`Click to expand message content`,loadError:`Could not load this message.`,loadErrorRetry:`Try again`},address:{directionalControl:`hidden direction marks`,directionalControlTooltip:`Hidden direction marks can reorder how this address is displayed.`,mixedScript:`address mixes alphabets`,mixedScriptTooltip:`This address mixes letters from different alphabets, which can make it look like an address you know.`,mixedScriptAscii:`In ASCII, the domain {domain} is spelled {ascii}.`,unusualDomain:`unusual domain`,unusualDomainTooltip:`This domain is not a valid internet domain name and has characters outside plain ASCII, so it may not be the domain it looks like.`},originalMessage:{title:`Original Message`,loading:`Loading original message...`,errorMissingParams:`Missing mailbox or uid parameters`,errorFailedToFetch:`Failed to fetch original message`,messageId:`Message ID`,createdAt:`Created at`,from:`From`,to:`To`,subject:`Subject`,spf:`SPF`,dkim:`DKIM`,dmarc:`DMARC`,truncatedInfo:`Message is too large to display fully. Showing the first 64KB. Please use "Download Original" to view the entire message.`,downloadOriginal:`Download Original`,copyClipboard:`Copy to clipboard`,copiedTruncated:`Copied truncated content to clipboard.`,copied:`Copied to clipboard.`,copyFailed:`Failed to copy to clipboard.`,none:`NONE`,pass:`PASS`,fail:`FAIL`},folderSelector:{filter:`Filter folders...`,noResults:`No matching folders`,actionMove:`Move to`,actionCopy:`Copy to`},attachment:{remove:`Remove`,addAgain:`Add again`,preview:`Preview`,download:`Download`,zoomIn:`Zoom in`,zoomOut:`Zoom out`,rotate:`Rotate`,fitToScreen:`Fit to screen`,previous:`Previous`,next:`Next`,copyContent:`Copy content`,copied:`Copied!`,openInNewTab:`Open in new tab`,cannotPreview:`No preview available for this file type`,loadingPreview:`Loading preview...`,errorLoading:`Failed to load preview`,close:`Close`,uploadProgress:`{percent}% of {size}`},sizeUnits:{bytes:`B`,kilobytes:`KB`,megabytes:`MB`,gigabytes:`GB`,terabytes:`TB`,petabytes:`PB`},navigation:{messages:`Messages`,contacts:`Contacts`,calendar:`Calendar`,tasks:`Tasks`},userMenu:{settings:`Settings`,signOut:`Sign Out`,unsavedDraftsTitle:`Sign out with unsaved drafts?`,unsavedDraftsMessage:`A draft could not be saved to the server. If you sign out now, it stays on this device and reopens the next time you sign in to this account.`,signOutAnyway:`Sign out anyway`,profileOptions:`Profile options`},pagination:{previousPage:`Previous page`,nextPage:`Next page`,zeroMessages:`0 messages`,totalCount:`{total} total`,searchResults:{one:`{count} result`,other:`{count} results`},rangeOfTotal:`{start}–{end} of {total}`},toast:{messagePermanentlyDeleted:`Message permanently deleted`,draftDiscarded:`Draft discarded`,folderRenamed:`Folder renamed`,tagNotSupported:`That tag is not supported by this mail server`,flagChangeFailed:`Could not update the messages`,folderCreated:`Folder created`,folderExists:`A folder with that name already exists`,folderCreateFailed:`Could not create the folder`,folderRenameFailed:`Could not rename the folder`,folderDeleteFailed:`Could not delete the folder`,folderUndoFailed:`Could not undo that`,folderMovedToTrash:`Folder moved to Trash`,folderPermanentlyDeleted:`Folder permanently deleted`,undo:`Undo`,dismiss:`Dismiss`,messageMovedToFolder:`Message moved to {folder}`,messagesMovedToFolder:{one:`{count} message moved to {folder}`,other:`{count} messages moved to {folder}`},messageCopiedToFolder:`Message copied to {folder}`,messagesCopiedToFolder:{one:`{count} message copied to {folder}`,other:`{count} messages copied to {folder}`},draftsDiscarded:{one:`{count} draft discarded`,other:`{count} drafts discarded`},messagesPermanentlyDeleted:{one:`{count} message permanently deleted`,other:`{count} messages permanently deleted`},undoFailed:`Could not undo that`,messageDeleteFailed:`The message could not be deleted`,moveFailed:`Could not move that`,copyFailed:`Could not copy that`,subscribeFailed:`Could not subscribe`,unsubscribeFailed:`Could not unsubscribe`},mailboxPage:{mailboxNotFound:`Mailbox not found`,newMessages:`New Messages`,newMessagesSingleBody:`You have 1 new message`,newMessagesMultiBody:{one:`You have {count} new message`,other:`You have {count} new messages`},newMessagesInInbox:`New messages in Inbox`,newMessagesAvailable:`New messages available`,open:`Open`,refresh:`Refresh`,permanentlyDelete:`Permanently Delete?`,deletePermanently:`Delete Permanently`,discardDraftsTitle:`Discard Drafts?`,discardDraftsMessage:`Are you sure you want to discard these drafts? This action cannot be undone.`,undo:`Undo`},offline:{title:`Connection Lost`,description:`Network connectivity lost`,tryingAgain:{one:`Trying again in {count} second...`,other:`Trying again in {count} seconds...`}},update:{available:`A new version is available.`,reload:`Reload`},general:{pageLoadFailed:`This page could not load. Save and close compose windows, then reload the page.`,backToMail:`Back to Mail`,error:`Error`,cancel:`Cancel`,save:`Save`,optional:`Optional`,delete:`Delete`,clear:`Clear`,showPassword:`Show password`,hidePassword:`Hide password`,previous:`Previous`,next:`Next`,expand:`Expand`,collapse:`Collapse`,moreOptions:`More options`,notFound:`Page not found`}},me=`modulepreload`,he=function(e){return`/`+e},ge={},E=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=he(t,n),t in ge)return;ge[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:me,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})};function _e(e,t){if(typeof e!=`object`||!e)return t;if(typeof t!=`object`||!t)return e;let n={...e};return Object.keys(t).forEach(r=>{typeof t[r]==`object`&&t[r]!==null&&!Array.isArray(t[r])&&r in e?n[r]=_e(e[r],t[r]):n[r]=t[r]}),n}var ve=Object.assign({"../../../plugins/caldav/frontend/i18n/en.ts":re,"../../../plugins/carddav/frontend/i18n/en.ts":ae,"../../../plugins/gpg/frontend/i18n/en.ts":se,"../../../plugins/managesieve/frontend/i18n/en.ts":le,"../../../plugins/password/frontend/i18n/en.ts":de}),ye={...pe};for(let e in ve){let t=ve[e],n=t.default||t.en||{};ye=_e(ye,n)}var be=ye;function xe(e){return e===`rs`?`sr-Cyrl`:e===`sr`?`sr-Latn`:e}var Se=class extends EventTarget{constructor(){super(),this.language=`en`,this.dictionary=be,this.pluralRules=null,this.pluralRulesFor=``,this.applyDocumentLanguage()}applyDocumentLanguage(){document.documentElement.lang=this.getIntlLanguage()}async setLanguage(e){if(this.language===e)return;this.language=e;let t=be;try{if(e!==`en`){let n={},r=Object.assign({"../i18n/da.ts":()=>E(()=>import(`./da-0QVQ8zFw.js`),[]),"../i18n/de.ts":()=>E(()=>import(`./de-CbL7Hmob.js`),[]),"../i18n/es.ts":()=>E(()=>import(`./es-DhnMvdu0.js`),[]),"../i18n/fr.ts":()=>E(()=>import(`./fr-BxO4uSiw.js`),[]),"../i18n/it.ts":()=>E(()=>import(`./it-CPp5PVgT.js`),[]),"../i18n/pt.ts":()=>E(()=>import(`./pt-dNVjxK3G.js`),[]),"../i18n/rs.ts":()=>E(()=>import(`./rs-DCMfW59H.js`),[]),"../i18n/sr.ts":()=>E(()=>import(`./sr-DZeZFpwM.js`),[])})[`../i18n/${e}.ts`];if(r){let t=await r();n=t.default||t[e]}else throw Error(`Locale file not found for ${e}`);let i=Object.assign({"../../../plugins/caldav/frontend/i18n/da.ts":()=>E(()=>import(`./da-C--ZDZ8Q.js`),[]),"../../../plugins/caldav/frontend/i18n/de.ts":()=>E(()=>import(`./de-Dsg1NbVe.js`),[]),"../../../plugins/caldav/frontend/i18n/es.ts":()=>E(()=>import(`./es-CwjOZJmQ.js`),[]),"../../../plugins/caldav/frontend/i18n/fr.ts":()=>E(()=>import(`./fr-hLwyG_Zz.js`),[]),"../../../plugins/caldav/frontend/i18n/it.ts":()=>E(()=>import(`./it-CVl37bdB.js`),[]),"../../../plugins/caldav/frontend/i18n/pt.ts":()=>E(()=>import(`./pt-C2TLFz3s.js`),[]),"../../../plugins/caldav/frontend/i18n/rs.ts":()=>E(()=>import(`./rs-DxorC-k9.js`),[]),"../../../plugins/caldav/frontend/i18n/sr.ts":()=>E(()=>import(`./sr-z6aWIs-V.js`),[]),"../../../plugins/carddav/frontend/i18n/da.ts":()=>E(()=>import(`./da-BIFucVnI.js`),[]),"../../../plugins/carddav/frontend/i18n/de.ts":()=>E(()=>import(`./de-BmDIOU65.js`),[]),"../../../plugins/carddav/frontend/i18n/es.ts":()=>E(()=>import(`./es-xUW9cbaY.js`),[]),"../../../plugins/carddav/frontend/i18n/fr.ts":()=>E(()=>import(`./fr-DNwIB2I7.js`),[]),"../../../plugins/carddav/frontend/i18n/it.ts":()=>E(()=>import(`./it-B77arX9I.js`),[]),"../../../plugins/carddav/frontend/i18n/pt.ts":()=>E(()=>import(`./pt-BYe9gYk6.js`),[]),"../../../plugins/carddav/frontend/i18n/rs.ts":()=>E(()=>import(`./rs-DTT1pIRy.js`),[]),"../../../plugins/carddav/frontend/i18n/sr.ts":()=>E(()=>import(`./sr-CzN47Hzt.js`),[]),"../../../plugins/gpg/frontend/i18n/da.ts":()=>E(()=>import(`./da-nTkszH3Q.js`),[]),"../../../plugins/gpg/frontend/i18n/de.ts":()=>E(()=>import(`./de-CZvKm0r_.js`),[]),"../../../plugins/gpg/frontend/i18n/es.ts":()=>E(()=>import(`./es-CiXdQcoO.js`),[]),"../../../plugins/gpg/frontend/i18n/fr.ts":()=>E(()=>import(`./fr-D-Yx5n6Y.js`),[]),"../../../plugins/gpg/frontend/i18n/it.ts":()=>E(()=>import(`./it-DJcfQ9dK.js`),[]),"../../../plugins/gpg/frontend/i18n/pt.ts":()=>E(()=>import(`./pt-A6w0FAqo.js`),[]),"../../../plugins/gpg/frontend/i18n/rs.ts":()=>E(()=>import(`./rs-BzT3QfW8.js`),[]),"../../../plugins/gpg/frontend/i18n/sr.ts":()=>E(()=>import(`./sr-CuQ0FWFt.js`),[]),"../../../plugins/managesieve/frontend/i18n/da.ts":()=>E(()=>import(`./da-1n1cR3rf.js`),[]),"../../../plugins/managesieve/frontend/i18n/de.ts":()=>E(()=>import(`./de-DkEBdtiE.js`),[]),"../../../plugins/managesieve/frontend/i18n/es.ts":()=>E(()=>import(`./es-BMAdriJf.js`),[]),"../../../plugins/managesieve/frontend/i18n/fr.ts":()=>E(()=>import(`./fr-alYLBR8z.js`),[]),"../../../plugins/managesieve/frontend/i18n/it.ts":()=>E(()=>import(`./it-DqGouPzT.js`),[]),"../../../plugins/managesieve/frontend/i18n/pt.ts":()=>E(()=>import(`./pt-CA5YnB_Q.js`),[]),"../../../plugins/managesieve/frontend/i18n/rs.ts":()=>E(()=>import(`./rs-D-sCcXwl.js`),[]),"../../../plugins/managesieve/frontend/i18n/sr.ts":()=>E(()=>import(`./sr-DD5mEUxB.js`),[]),"../../../plugins/password/frontend/i18n/da.ts":()=>E(()=>import(`./da-BhCQfYzD.js`),[]),"../../../plugins/password/frontend/i18n/de.ts":()=>E(()=>import(`./de-CDl9smAH.js`),[]),"../../../plugins/password/frontend/i18n/es.ts":()=>E(()=>import(`./es-CzqF97Gp.js`),[]),"../../../plugins/password/frontend/i18n/fr.ts":()=>E(()=>import(`./fr-f84lco1l.js`),[]),"../../../plugins/password/frontend/i18n/it.ts":()=>E(()=>import(`./it-DmGsSB-3.js`),[]),"../../../plugins/password/frontend/i18n/pt.ts":()=>E(()=>import(`./pt-b739ryea.js`),[]),"../../../plugins/password/frontend/i18n/rs.ts":()=>E(()=>import(`./rs-pcy4zUbC.js`),[]),"../../../plugins/password/frontend/i18n/sr.ts":()=>E(()=>import(`./sr-C044ncJw.js`),[])}),a=[];for(let t in i)t.endsWith(`/${e}.ts`)&&a.push(i[t]());let o=await Promise.allSettled(a);for(let t of o){if(t.status===`rejected`){x.error(`Failed to load a plugin dictionary`,t.reason);continue}let r=t.value,i=r.default||r[e]||{};n=_e(n,i)}t=n}}catch(n){x.error(`Failed to load language module for ${e}`,n),t=be}this.language===e&&(this.dictionary=t,this.applyDocumentLanguage(),this.dispatchEvent(new CustomEvent(`change`)))}getLanguage(){return this.language}getIntlLanguage(){return xe(this.language)}pluralForm(e){let t=this.getIntlLanguage();return(this.pluralRulesFor!==t||!this.pluralRules)&&(this.pluralRules=new Intl.PluralRules(t),this.pluralRulesFor=t),this.pluralRules.select(e)}pickPluralForm(e,t){if(!e||typeof e!=`object`)return e;let n=e[typeof t?.count==`number`?this.pluralForm(t.count):`other`]??e.other;return typeof n==`string`?n:e}t(e,t){let n=e.split(`.`),r=this.dictionary;for(let e of n){if(r==null)break;r=r[e]}if(r=this.pickPluralForm(r,t),typeof r!=`string`){let i=be;for(let e of n){if(i==null)break;i=i[e]}i=this.pickPluralForm(i,t),r=typeof i==`string`?i:e}return typeof r==`string`&&t?r.replace(/\{(\w+)\}/g,(e,n)=>t[n]===void 0?e:String(t[n])):r}},D=u(`i18n-store`),O=`INBOX`,Ce=`Drafts`,we=`Sent`,Te=`Archive`,Ee=`Archives`,De=`Spam`,Oe=`Junk`,ke=`Trash`;function k(e){return encodeURIComponent(encodeURIComponent(e))}var Ae={"\\inbox":`inbox`,"\\drafts":`drafts`,"\\sent":`sent`,"\\archive":`archive`,"\\junk":`junk`,"\\trash":`trash`,"\\all":`all`},je={[O.toLowerCase()]:`inbox`,[Ce.toLowerCase()]:`drafts`,[we.toLowerCase()]:`sent`,[Te.toLowerCase()]:`archive`,[Ee.toLowerCase()]:`archive`,[De.toLowerCase()]:`junk`,[Oe.toLowerCase()]:`junk`,[ke.toLowerCase()]:`trash`,"deleted items":`trash`};function Me(e,t){return Object.hasOwn(e,t)?e[t]:null}function Ne(e,t){if(!e)return null;let n=(Array.isArray(e.Attrs)?e.Attrs:[]).map(e=>typeof e==`string`?e.toLowerCase():``);for(let e of n){let t=Me(Ae,e);if(t)return t}if(n.includes(`\\noselect`)||n.includes(`\\nonexistent`))return null;let r=Me(je,(e.Name||e.Mailbox||``).toLowerCase());return r&&t?.has(r)?null:r}function A(e,t=[]){if(!e)return null;let n=Le(t),r=(t||[]).find(t=>(t?.Name||t?.Mailbox)===e);if(r)return Ne(r,n);let i=Me(je,e.toLowerCase());return i&&n.has(i)?null:i}function Pe(e,t,n){let r=Le(t),i=(t||[]).find(t=>Ne(t,r)===e);return i&&(i.Name||i.Mailbox)||n}function Fe(e,t=[]){let n=Le(t),r=e=>e.Name||e.Mailbox||``,i=(t||[]).filter(t=>Ne(t,n)===e),a=i.find(e=>Ue(r(e),j(e,`.`)).length===1)??i[0];return a?r(a):null}function Ie(e,t=[]){let n=A(e,t);if(!n)return null;let r=Fe(n,t);return r===null||r===e?n:null}function Le(e=[]){let t=new Set;for(let n of e||[]){let e=Array.isArray(n?.Attrs)?n.Attrs:[];for(let n of e){let e=typeof n==`string`?Me(Ae,n.toLowerCase()):null;e&&e!==`inbox`&&t.add(e)}}return t}function Re(e=[]){return(e||[]).some(e=>e?.Subscribed===!0)}function ze(e,t,n){if(!e)return!1;let r=e.Name||e.Mailbox||``;if(!r||r===n)return!1;let i=(Array.isArray(e.Attrs)?e.Attrs:[]).map(e=>typeof e==`string`?e.toLowerCase():``);if(i.includes(`\\noselect`)||i.includes(`\\nonexistent`))return!1;let a=Ne(e,Le(t));return a!==`drafts`&&a!==`sent`}function Be(e,t,n){if(!e||!t||e===t||!e.startsWith(t))return!1;let r=e.slice(t.length);return n?r.startsWith(n):/^[^A-Za-z0-9]/.test(r)}function Ve(e,t,n){return e===t||Be(e,t,n)}function He(e,t=[]){return e?j(t.find(t=>(t.Name||t.Mailbox)===e)):``}function j(e,t=``){let n=e?.Delimiter||e?.Delim;return typeof n==`number`?n>0?String.fromCharCode(n):``:typeof n==`string`&&n?n:t}function Ue(e,t){return t?e.split(t):[e]}function M(e){return n`
    <svg class="icon">
      <use href="/assets/icons/sprite.svg?v=13#${e}"></use>
    </svg>
  `}function We(e){if(!e)return`#78909c`;let t=[`#ef5350`,`#ec407a`,`#ab47bc`,`#7e57c2`,`#5c6bc0`,`#42a5f5`,`#29b6f6`,`#26c6da`,`#26a69a`,`#66bb6a`,`#9ccc65`,`#d4e157`,`#ffca28`,`#ffa726`,`#ff7043`,`#8d6e63`,`#78909c`],n=0;for(let t=0;t<e.length;t++)n=e.charCodeAt(t)+((n<<5)-n);return t[Math.abs(n)%t.length]}function Ge(e,t=`YYYY-MM-DD`,n=`12`){if(!e)return``;let r=typeof e==`string`?new Date(e):e,i=new Date;if(r.getDate()===i.getDate()&&r.getMonth()===i.getMonth()&&r.getFullYear()===i.getFullYear())return r.toLocaleTimeString(void 0,{hour:`2-digit`,minute:`2-digit`,hour12:n===`12`});if(r.getFullYear()!==i.getFullYear()){let e=r.getFullYear(),n=String(r.getMonth()+1).padStart(2,`0`),i=String(r.getDate()).padStart(2,`0`);return t===`YYYY-MM-DD`?`${e}-${n}-${i}`:t===`MM/DD/YYYY`?`${n}/${i}/${e}`:t===`DD.MM.YYYY`?`${i}.${n}.${e}`:r.toLocaleDateString(void 0,{year:`numeric`,month:`short`,day:`numeric`})}return r.toLocaleDateString(void 0,{month:`short`,day:`numeric`})}function Ke(e,t=`YYYY-MM-DD`,n=`12`){if(!e)return``;let r=typeof e==`string`?new Date(e):e,i=r.getFullYear(),a=String(r.getMonth()+1).padStart(2,`0`),o=String(r.getDate()).padStart(2,`0`),s=`${i}-${a}-${o}`;t===`MM/DD/YYYY`?s=`${a}/${o}/${i}`:t===`DD.MM.YYYY`&&(s=`${o}.${a}.${i}`);let c=r.toLocaleTimeString(void 0,{hour:`2-digit`,minute:`2-digit`,hour12:n===`12`});return`${s} ${c}`}function qe(e,t,n=`YYYY-MM-DD`){let r=String(e).padStart(2,`0`),i=String(t).padStart(2,`0`);return n===`MM/DD/YYYY`?`${r}/${i}`:n===`DD.MM.YYYY`?`${i}.${r}.`:`${r}-${i}`}var Je={inbox:`folderList.inbox`,drafts:`folderList.drafts`,sent:`folderList.sent`,archive:`folderList.archive`,junk:`folderList.junk`,trash:`folderList.trash`};function Ye(e,t,n){let r=Ie(e,n),i=r===`junk`&&Xe(e,n)===`Spam`?`folderList.spam`:r?Je[r]:void 0;return i&&t?.t(i)||null}function Xe(e,t){let n=He(e,t),r=n?e.split(n):e.split(/[.\/]/);return r[r.length-1]||e}function Ze(e,t,n=[]){return e?e===`*`?t?.t(`folderList.allFolders`)||`All Folders`:Ye(e,t,n)||Xe(e,n):``}function Qe(e,t,n=[]){return Ye(e,t,n)??e}var $e=[[`sizeUnits.bytes`,`B`],[`sizeUnits.kilobytes`,`KB`],[`sizeUnits.megabytes`,`MB`],[`sizeUnits.gigabytes`,`GB`],[`sizeUnits.terabytes`,`TB`],[`sizeUnits.petabytes`,`PB`]];function et(e,t){let n=e=>t?t.t($e[e][0]):$e[e][1];if(!Number.isFinite(e)||e<=0)return`0 ${n(0)}`;let r=1024,i=Math.floor(Math.log(e)/Math.log(r)),a=Math.min(Math.max(i,0),$e.length-1),o=Math.round(e/r**+a);return o>=r&&a<$e.length-1&&(o=Math.round(o/r),a++),`${o} ${n(a)}`}var tt=new Set([`gmail.com`,`yahoo.com`,`hotmail.com`,`outlook.com`,`icloud.com`,`me.com`,`mac.com`,`aol.com`,`proton.me`,`protonmail.com`,`live.com`,`msn.com`,`pm.me`,`yandex.ru`,`mail.ru`,`gmx.de`,`web.de`,`t-online.de`,`orange.fr`,`free.fr`]);function nt(e){if(!e)return``;let t=e.toLowerCase();return tt.has(t)?``:`/bimi/avatar?domain=${encodeURIComponent(t)}`}function rt(e){let t=e?.Envelope?.From;return Array.isArray(t)&&t.length===1&&!!t[0]?.Mailbox&&nt(t[0]?.Host||``)!==``}function it(e,t){if(!e?.HasBimiPotential)return``;let n=e.Envelope?.From;if(!Array.isArray(n)||n.length!==1)return``;let r=e=>e?.Mailbox&&e?.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``,i=r(n[0]);return!i||i!==r(t)?``:nt(n[0].Host)}function at(e){if(!e)return 0;let t=e.style.width;e.style.width=`0px`;let n=e.scrollWidth;return e.style.width=t,n}var ot=1800*1e3,st=`X-Alps-Build`,ct=`app-update-available`,lt=`alps-update-chunk-reload`,ut=60*1e3,dt=`alps-update-taken`,ft=600*1e3;function pt(e){try{let t=Number(sessionStorage.getItem(e)??0);return Number.isFinite(t)?t:0}catch{return 0}}function mt(e,t){try{sessionStorage.setItem(e,String(t))}catch{}}function ht(e,t){let n=pt(e);return n>0&&Date.now()-n<t}function gt(e){let t=(e.get(`Cache-Control`)??``).toLowerCase();if(t.includes(`no-store`)||t.includes(`no-cache`))return!1;if(t.includes(`immutable`))return!0;let n=/(?:^|[\s,])(?:s-maxage|max-age)\s*=\s*(\d+)/.exec(t);return n!==null&&Number(n[1])>0}var _t=null,vt=!1,yt=!1,bt=!1,xt=!1,St=!1,Ct=null,wt=null;function Tt(e){let t=e.headers.get(st);if(!(!t||gt(e.headers))){if(_t===null){_t=t;return}if(t!==_t&&!yt&&(yt=!0,vt=!0,x.info(`A new build is served (${_t} → ${t}).`)),!(!yt||bt)){if(ht(dt,ft)){xt||(xt=!0,x.warn(`Not offering it yet: this tab already reloaded for an update.`));return}if(bt=!0,document.hidden){St=!0;return}window.dispatchEvent(new CustomEvent(ct))}}}function Et(){document.addEventListener(`visibilitychange`,At),window.addEventListener(`vite:preloadError`,jt),document.hidden&&At()}var Dt=null;function Ot(e){Dt=e}function kt(){return Dt!==null&&Dt()}function At(){if(document.hidden){Ct=Date.now(),wt&&clearTimeout(wt),wt=setTimeout(()=>{vt&&!kt()&&Nt()},ot);return}wt&&clearTimeout(wt),wt=null;let e=Ct===null?0:Date.now()-Ct;if(Ct=null,vt&&e>=ot&&!kt()){Nt();return}St&&(St=!1,window.dispatchEvent(new CustomEvent(ct)))}function jt(e){e.preventDefault(),x.warn(`A lazily loaded chunk is missing; the server was likely upgraded.`),vt=!0,!(kt()||ht(lt,ut))&&(mt(lt,Date.now()),Nt())}function Mt(){mt(dt,Date.now()),Nt()}function Nt(){window.location.reload()}function Pt(e){return encodeURIComponent(encodeURIComponent(e))}var Ft=class extends Error{constructor(e,t){super(t),this.name=`HttpStatusError`,this.status=e}};function It(e){return e instanceof Ft&&e.status===412}function Lt(e){return!(e instanceof Ft)||e.status>=500||e.status===408}function Rt(e){return e instanceof Ft&&e.status===401}var zt={headers:{"X-Alps-Background":`1`}},Bt=new Set([502,503,504]),Vt=[250,1e3],Ht=e=>new Promise(t=>setTimeout(t,e)),Ut=0,Wt=[];function Gt(){Ut--,!(Ut>0||Wt.length===0)&&setTimeout(()=>{if(Ut>0)return;let e=Wt;Wt=[],e.forEach(e=>e())},0)}function Kt(){return Ut===0?Promise.resolve():new Promise(e=>Wt.push(e))}async function N(e,t={},n=25e3,{background:r=!1}={}){if(r)return qt(e,t,n);Ut++;try{return await qt(e,t,n)}finally{Gt()}}async function qt(e,t,n){let r=(t.method??(e instanceof Request?e.method:`GET`)).toUpperCase()===`GET`?Vt.length+1:1,i,a;for(let o=0;o<r;o++){let s=o===r-1,c=new AbortController;a=c;let l=setTimeout(()=>c.abort(),n);try{i=await fetch(e,{...t,signal:c.signal})}catch(e){if(e instanceof TypeError&&!s){await Ht(Vt[o]);continue}throw(e instanceof TypeError||e.name===`AbortError`)&&window.dispatchEvent(new CustomEvent(`network-error`)),e}finally{clearTimeout(l)}if(Bt.has(i.status)&&!s){c.abort(),await Ht(Vt[o]);continue}break}let o=a;return setTimeout(()=>o.abort(),n),Bt.has(i.status)&&window.dispatchEvent(new CustomEvent(`network-error`)),i.status===401&&window.dispatchEvent(new CustomEvent(`auth-error`)),Tt(i),i}function Jt(e){return n`<bdi dir="ltr">${e}</bdi>`}function Yt(e,t){return e?n`<bdi>${e}</bdi>`:Jt(t)}function Xt(e){return e.name?n`<bdi>${e.name}</bdi> &lt;${Jt(e.email)}&gt;`:Jt(e.email)}function Zt(e){return e.map((e,t)=>n`${t?`, `:``}${Xt(e)}`)}function Qt(e,t,n){let r=Object.fromEntries(Object.keys(n).map(e=>[e,`{${e}}`]));return(e?.t(t,r)??t).split(/\{(\w+)\}/).map((e,t)=>t%2==0?e:n[e]??`{${e}}`)}function $t(e){return e.replace(/\p{Bidi_Control}/gu,``)}function P(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var en=class extends d{constructor(...e){super(...e),this.variant=`normal`,this.icon=``,this.disabled=!1,this.spinning=!1,this.type=`button`,this.title=``,this.fullWidth=!1,this.handleClick=e=>{if(this.disabled||this.spinning){e.preventDefault(),e.stopPropagation();return}if(this.type===`submit`){let t=this.closest(`form`);t&&(e.preventDefault(),t.requestSubmit())}else if(this.type===`reset`){let t=this.closest(`form`);t&&(e.preventDefault(),t.reset())}}}connectedCallback(){super.connectedCallback(),this.addEventListener(`click`,this.handleClick)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(`click`,this.handleClick)}static{this.styles=v`
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
      background-color: var(--accent-fill, #3b82f6);
      color: #ffffff;
      border: 1px solid var(--accent-fill-border, transparent);
    }
    
    @media (hover: hover) {
      :host([variant="primary"]) button:hover:not(:disabled) {
        background-color: var(--accent-fill-hover, #2563eb);
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

    /* On the accent fill the logo colour would vanish: the spinner takes the
       button's white text instead. */
    :host([variant="primary"]) .spinner {
      --logo-color: currentColor;
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
            ${M(`edelweiss`)}
          </span>
        `:this.icon?n`
          <span class="icon-container">
            ${M(this.icon)}
          </span>
        `:``}
        <span class="content"><slot></slot></span>
      </button>
    `}};P([o({type:String,reflect:!0})],en.prototype,`variant`,void 0),P([o({type:String})],en.prototype,`icon`,void 0),P([o({type:Boolean,reflect:!0})],en.prototype,`disabled`,void 0),P([o({type:Boolean,reflect:!0})],en.prototype,`spinning`,void 0),P([o({type:String})],en.prototype,`type`,void 0),P([o({type:String})],en.prototype,`title`,void 0),P([o({type:Boolean,attribute:`full-width`,reflect:!0})],en.prototype,`fullWidth`,void 0),en=P([p(`alps-button`)],en);var tn=class extends d{constructor(...e){super(...e),this.value=``,this.options=[],this.label=``}static{this.styles=v`
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
					${M(`caret-down`)}
				</span>
			</div>
		`}};P([o({type:String})],tn.prototype,`value`,void 0),P([o({type:Array})],tn.prototype,`options`,void 0),P([o({type:String})],tn.prototype,`label`,void 0),tn=P([p(`alps-select`)],tn);function nn(e){if(!e||typeof e!=`object`)return!1;if(Array.isArray(e.Children))return e.Children.some(e=>nn(e));let t=`${e.Type||``}/${e.Subtype||``}`.toLowerCase();if(t===`text/calendar`||t===`application/ics`)return!0;let n=e.Extended?.Disposition?.Params?.filename||e.Params?.name||``;return typeof n==`string`&&n.toLowerCase().endsWith(`.ics`)}var rn=new class{async fetchInvitation(e,t){let n=await N(`/calendar/invitation?${new URLSearchParams({mailbox:e,uid:t}).toString()}`);if(n.status===404)return null;if(!n.ok)throw new Ft(n.status,`Failed to read the invitation`);return n.json()}async respond(e){return this.post(`/calendar/invitation/respond`,e,`Failed to answer the invitation`)}async apply(e){return this.post(`/calendar/invitation/apply`,e,`Failed to update the calendar`)}async post(e,t,n){let r=await N(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!r.ok)throw new Ft(r.status,n);return r.json()}},an={accepted:`accepted`,tentative:`tentative`,declined:`declined`,"needs-action":`needsAction`,delegated:`delegated`,completed:`completed`,"in-process":`inProcess`};function on(e){return an[e??``]??`needsAction`}var sn={update:`update`,outdated:`outdated`,organizer:`organizer`,"not-invited":`notInvited`,cancel:`cancel`,cancelled:`cancelled`,reply:`reply`,replied:`replied`,unknown:`unknown`,add:`add`,added:`added`,unsupported:`unsupported`},cn=class extends d{constructor(...e){super(...e),this.mailbox=``,this.uid=``,this.view=null,this.busy=!1,this.notice=null,this.calendarPath=``,this.loadSeq=0,this.visit=0,this.autoApplied=new Set}static{this.styles=v`
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
    `}willUpdate(e){(e.has(`mailbox`)||e.has(`uid`))&&(this.visit++,this.view=null,this.notice=null,this.busy=!1,this.load())}isCurrent(e){return e===this.visit}t(e,t){return this.i18nStore?.t(e,t)??e}async load(){let e=++this.loadSeq,{mailbox:t,uid:n}=this;if(!t||!n)return;let r;try{r=await rn.fetchInvitation(t,n)}catch(t){console.error(`Failed to read the invitation`,t),e===this.loadSeq&&(this.view=null);return}if(e!==this.loadSeq||(this.view=r,!r))return;r.calendars.some(e=>e.path===this.calendarPath)||(this.calendarPath=r.copy?.calendarPath||r.calendars[0]?.path||``);let i=JSON.stringify([t,n]);r.autoApply&&!this.autoApplied.has(i)&&(this.autoApplied.add(i),await this.apply())}async respond(e){let t=this.view;if(!t||this.busy)return;let n=this.visit;this.busy=!0,this.notice=null;try{let r=await rn.respond({mailbox:this.mailbox,uid:this.uid,status:e,calendarPath:t.copy?void 0:this.calendarPath,lang:this.i18nStore?.getLanguage?.()});if(!this.isCurrent(n))return;this.notice=r.sendFailed?{key:`invitations.sendFailed`,tone:`error`}:{key:r.sent?`invitations.sent`:`invitations.saved`,tone:`info`}}catch(e){if(console.error(`Failed to answer the invitation`,e),!this.isCurrent(n))return;this.notice={key:It(e)?`invitations.changedElsewhere`:`invitations.answerFailed`,tone:`error`}}finally{this.isCurrent(n)&&(this.busy=!1)}await this.load()}async apply(){let e=this.view;if(!e||this.busy)return;let t=this.visit;this.busy=!0,this.notice=null;try{let n=await rn.apply({mailbox:this.mailbox,uid:this.uid,calendarPath:this.calendarPath});if(!this.isCurrent(t))return;let r=n.removed?`invitations.removed`:e.state===`add`?`invitations.added`:`invitations.updated`;this.notice={key:r,tone:`info`}}catch(e){if(console.error(`Failed to update the calendar`,e),!this.isCurrent(t))return;this.notice={key:It(e)?`invitations.changedElsewhere`:`invitations.applyFailed`,tone:`error`}}finally{this.isCurrent(t)&&(this.busy=!1)}await this.load()}kindKey(e){switch(e.method){case`cancel`:return`cancelled`;case`reply`:return`reply`;case`request`:return e.kind===`task`?`task`:e.state===`update`?`updated`:`invitation`}return e.kind===`task`?`task`:`event`}when(e){let t=this.i18nStore?.getIntlLanguage?.()||void 0,n=new Intl.DateTimeFormat(t,{weekday:`short`,year:`numeric`,month:`short`,day:`numeric`}),r=e=>new Date(`${e.slice(0,10)}T00:00:00`);if(e.kind===`task`&&!e.start){if(!e.end)return``;let i=e.allDay?n.format(r(e.end)):new Intl.DateTimeFormat(t,{dateStyle:`medium`,timeStyle:`short`}).format(new Date(e.end));return this.t(`invitations.dueOn`,{date:i})}if(!e.start)return``;if(e.allDay){let t=r(e.start);if(!e.end)return n.format(t);let i=r(e.end);return i.setDate(i.getDate()-1),i>t?`${n.format(t)} - ${n.format(i)}`:n.format(t)}let i=new Date(e.start),a=e.end?new Date(e.end):i,o=new Intl.DateTimeFormat(t,{weekday:`short`,year:`numeric`,month:`short`,day:`numeric`,hour:`numeric`,minute:`2-digit`}),s=o.formatRange;return a>i&&s?s.call(o,i,a):o.format(i)}answerLine(e){return this.t(`invitations.yourAnswerIs`,{status:this.t(`invitations.statuses.${on(e)}`)})}renderStateLine(e){if(e.ended)return n`
                <div class="muted state ended">${this.t(`invitations.states.ended`)}</div>
                ${e.status&&e.status!==`needs-action`?n`<div class="muted answer">${this.answerLine(e.status)}</div>`:c}
            `;if(e.state===`answer`)return!e.status||e.status===`needs-action`?c:n`<div class="muted answer">${this.answerLine(e.status)}</div>`;let t=sn[e.state];return t?n`<div class="muted state">${this.t(`invitations.states.${t}`)}</div>`:c}renderClashes(e){if(e.ended||e.kind!==`event`||e.method!==`request`||e.state!==`answer`&&e.state!==`update`||e.status===`declined`)return c;if(!e.clashes.length)return n`<div class="muted clashes">${this.t(`invitations.noConflicts`)}</div>`;let t=n`${e.clashes.map((e,t)=>n`${t?`, `:``}<bdi>${e.summary||this.t(`calendar.noTitle`)}</bdi>`)}`;return n`<div class="clash clashes">${Qt(this.i18nStore,`invitations.conflictsWith`,{names:t})}</div>`}renderSender(e){if(e.ended||e.senderVerified||!e.sender||![`answer`,`update`,`cancel`,`reply`].includes(e.state))return c;let t=e.method===`reply`?`invitations.unverifiedReply`:`invitations.unverified`;return n`<div class="warning sender">${Qt(this.i18nStore,t,{sender:Jt(e.sender)})}</div>`}renderPicker(e){return e.copy||e.calendars.length<2?c:n`
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
                <div class="icon">${M(e.kind===`task`?`checkCircle`:`calendar`)}</div>
                <div class="body">
                    <div class="eyebrow">${r}</div>
                    <div class="title ${t?`struck`:``}">${e.summary||this.t(`calendar.noTitle`)}</div>
                    ${i?n`<div class="when">${i}${e.rrule?n`, ${this.t(`invitations.repeats`)}`:c}</div>`:c}
                    ${e.location?n`<div class="muted where">${e.location}</div>`:c}
                    ${e.method===`reply`&&e.replier?n`<div class="replier">${Qt(this.i18nStore,`invitations.answered.${on(e.replier.status)}`,{name:Yt(e.replier.name,e.replier.email)})}</div>`:e.organizer?n`<div class="muted organizer">${Qt(this.i18nStore,`invitations.organizerIs`,{name:Yt(e.organizer.name,e.organizer.email)})}</div>`:c}
                    ${this.renderClashes(e)}
                    ${this.renderStateLine(e)}
                    ${this.renderSender(e)}
                    ${this.notice?n`<div class="notice ${this.notice.tone}" role="status">${this.t(this.notice.key)}</div>`:c}
                    <div class="actions">${this.renderActions(e)}</div>
                </div>
            </div>
        `}};P([h({context:D})],cn.prototype,`i18nStore`,void 0),P([o()],cn.prototype,`mailbox`,void 0),P([o()],cn.prototype,`uid`,void 0),P([a()],cn.prototype,`view`,void 0),P([a()],cn.prototype,`busy`,void 0),P([a()],cn.prototype,`notice`,void 0),P([a()],cn.prototype,`calendarPath`,void 0),cn=P([p(`calendar-invitation-banner`)],cn);var ln=e({});T.registerRoute({path:`/calendar/*`,component:`calendar-page`,pluginId:`caldav`,load:()=>E(()=>import(`./calendar-page-BoiFJarV.js`),__vite__mapDeps([0,1,2,3,4,5,6]))}),T.registerNavTab({id:`calendar`,pluginId:`caldav`,labelKey:`navigation.calendar`,icon:`calendar`,order:20}),T.registerRoute({path:`/tasks/*`,component:`tasks-page`,pluginId:`caldav`,load:()=>E(()=>import(`./tasks-page-Dw_MTt1g.js`),__vite__mapDeps([7,3,1,2]))}),T.registerNavTab({id:`tasks`,pluginId:`caldav`,labelKey:`navigation.tasks`,icon:`checkCircle`,order:30}),T.registerHook(`reader:content`,e=>{let t=e?.message;if(!t||!nn(t.BodyStructure))return;let r=e.mailbox||t.Mailbox;!r||t.UID===void 0||(e.banners=e.banners||[],e.banners.push(n`<calendar-invitation-banner .mailbox=${r} .uid=${String(t.UID)}></calendar-invitation-banner>`))},`caldav`);function un(e){if(!e||/[\s/\\?#:@%\[\]]/u.test(e))return null;try{let t=new URL(`http://${e}`).hostname.replace(/\.$/,``).toLowerCase();return/^\d+\.\d+\.\d+\.\d+$/.test(t)?null:t.length<=253&&/^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/.test(t)?t:null}catch{return null}}function dn(e){if(!e.startsWith(`xn--`)||e.length>63)return e;let t=e.slice(4),n=t.lastIndexOf(`-`),r=n<0?[]:Array.from(t.slice(0,n),e=>e.charCodeAt(0)),i=n<0?0:n+1,a=128,o=0,s=72;try{for(;i<t.length;){let n=o,c=1;for(let n=36;;n+=36){if(i>=t.length)return e;let r=t.charCodeAt(i++),a=r>=97&&r<=122?r-97:r>=48&&r<=57?r-22:36;if(a>=36||!Number.isSafeInteger(o+a*c))return e;o+=a*c;let l=n<=s?1:n>=s+26?26:n-s;if(a<l)break;c*=36-l}let l=Math.floor((o-n)/(n===0?700:2));l+=Math.floor(l/(r.length+1));let u=0;for(;l>455;)l=Math.floor(l/35),u+=36;if(s=u+Math.floor(36*l/(l+38)),a+=Math.floor(o/(r.length+1)),o%=r.length+1,a>1114111||a>=55296&&a<=57343)return e;r.splice(o++,0,a)}let n=String.fromCodePoint(...r);return un(`${n}.example`)===`${e}.example`?n:e}catch{return e}}var fn=`Latin.Cyrillic.Greek.Han.Hiragana.Katakana.Bopomofo.Hangul.Arabic.Hebrew.Devanagari.Bengali.Thai.Armenian.Georgian.Tamil.Telugu.Gujarati.Gurmukhi.Kannada.Malayalam.Sinhala.Lao.Khmer.Myanmar.Ethiopic`.split(`.`).map(e=>[e,RegExp(`\\p{Script_Extensions=${e}}`,`u`)]);function pn(e){return/[\p{Number}\p{Punctuation}\p{Symbol}]/u.test(e)?null:fn.find(([,t])=>t.test(e))?.[0]??(/\p{Mark}/u.test(e)?null:`other`)}function mn(e){if(/[\p{Cc}\p{Cf}\p{Z}]/u.test(e))return!1;let t=new Set(Array.from(e.normalize(`NFC`),pn).filter(e=>e!==null));return t.has(`other`)?!1:t.size<=1?!0:[[`Latin`,`Han`,`Hiragana`,`Katakana`],[`Latin`,`Han`,`Bopomofo`],[`Latin`,`Han`,`Hangul`]].some(e=>[...t].every(t=>e.includes(t)))}var hn=/[.。．｡]/;function gn(e,t){let n=e.replace(RegExp(`${hn.source}$`),``).split(hn),r=t.split(`.`);return n.length===r.length&&n.every((e,t)=>{let n=e.toLowerCase().normalize(`NFC`);return n===r[t]||n===dn(r[t])})}function _n(e){let t=un(e);if(t===null||!gn(e,t))return{text:e,ascii:e,warning:/^[\x20-\x7e]*$/.test(e)?null:`unusual-domain`};let n=null;return{text:t.split(`.`).map(e=>{let t=dn(e);return mn(t)?t:(n=`mixed-script-domain`,e)}).join(`.`),ascii:t,warning:n}}function vn(e){if(/[\s<>\p{Cc}\p{Cf}]/u.test(e)||e.length>320)return null;let t=e.split(`@`);if(t.length!==2||!t[0])return null;let n=un(t[1]);return n===null||!gn(t[1],n)?null:`${t[0]}@${n}`}var yn=/\p{Bidi_Control}/gu;function bn(e){let t=[];/\p{Bidi_Control}/u.test(e)&&t.push(`directional-control`);let n=e.lastIndexOf(`@`);if(n<0)return t;mn(e.slice(0,n).replace(yn,``))||t.push(`mixed-script-local`);let r=_n(e.slice(n+1).replace(yn,``)).warning;return r&&t.push(r),t}function xn(e){let t=bn(e)[0]??null,n=e.lastIndexOf(`@`);if(n<0)return{text:e,ascii:e,warning:t};let r=e.slice(0,n),i=_n(e.slice(n+1));return{text:`${r}@${i.text}`,ascii:`${r}@${i.ascii}`,warning:t}}function Sn(e){let t=e.trim();if(t.endsWith(`>`)){let e=t.lastIndexOf(`<`);if(e!==-1){let n=t.slice(e+1,-1).trim(),r=t.slice(0,e).trim();return r=/^".*"$/s.test(r)?r.slice(1,-1).replace(/\\(.)/gs,`$1`).trim():r.replace(/^"|"$/g,``).trim(),{name:r,email:n}}}return{name:``,email:t}}var Cn=/[()<>[\]:;@\\,."]|=\?/;function wn(e,t){return e?Cn.test(e)?`"${e.replace(/["\\]/g,`\\$&`)}" <${t}>`:`${e} <${t}>`:t}function Tn(e){let t=e.trim(),n=t.endsWith(`>`)?t.lastIndexOf(`<`):-1,r=n===-1?t:t.slice(n+1,-1).trim(),i=vn(r);return i===null||i===r?t:n===-1?i:`${t.slice(0,n+1)}${i}>`}function En(e){let t=xn(e),r=t.text.lastIndexOf(`@`);return bn(e).includes(`mixed-script-local`)?Jt(n`${Array.from(t.text.slice(0,r),e=>/[^\x00-\x7f]/.test(e)&&!/\p{Bidi_Control}/u.test(e)?n`<mark class="mixed-script">${e}</mark>`:e)}${t.text.slice(r)}`):Jt(t.text)}var Dn=v`
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
`;function On(e,t){return e.replace(/\{(\w+)\}/g,(e,n)=>t[n]??e)}function kn(e,t){switch(e){case`directional-control`:return{label:t?.t(`address.directionalControl`)??pe.address.directionalControl,tooltip:t?.t(`address.directionalControlTooltip`)??pe.address.directionalControlTooltip};case`mixed-script-local`:case`mixed-script-domain`:return{label:t?.t(`address.mixedScript`)??pe.address.mixedScript,tooltip:t?.t(`address.mixedScriptTooltip`)??pe.address.mixedScriptTooltip};case`unusual-domain`:return{label:t?.t(`address.unusualDomain`)??pe.address.unusualDomain,tooltip:t?.t(`address.unusualDomainTooltip`)??pe.address.unusualDomainTooltip}}}function An(e,t){let r=bn(e);if(!r.length)return``;let i=kn(r[0],t).label,a=[...new Set(r.map(e=>kn(e,t).tooltip))],o=e.slice(e.lastIndexOf(`@`)+1).replace(yn,``),s=_n(o);if(s.warning===`mixed-script-domain`&&o.toLowerCase()!==s.ascii){let e={domain:o,ascii:s.ascii};a.push(t?.t(`address.mixedScriptAscii`,e)??On(pe.address.mixedScriptAscii,e))}return n`<span class="address-warning" title=${a.join(`
`)}>⚠ ${i}</span>`}function jn(e){let t=0,n=0;for(let r of e)r.status===`rejected`&&(t+=1,Lt(r.reason)&&(n+=1),console.error(`Bulk contact operation failed for one item`,r.reason));return{total:e.length,done:e.length-t,failed:t,uncertain:n}}var Mn=new class{async fetchContacts(e=``){let t=await N(e?`/contacts?query=${encodeURIComponent(e)}`:`/contacts`);if(!t.ok)throw Error(`Failed to fetch contacts: ${t.statusText}`);return t.json()}async fetchContact(e){let t=await N(`/contacts/${Pt(e)}`);if(!t.ok)throw Error(`Failed to fetch contact: ${t.statusText}`);return t.json()}async createContact(e){let t=await N(`/contacts/create`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(!t.ok)throw new Ft(t.status,`Failed to create contact: ${t.statusText}`);return t.json()}async updateContact(e,t){let n=await N(`/contacts/${Pt(e)}/edit`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(!n.ok)throw new Ft(n.status,`Failed to update contact: ${n.statusText}`);return n.json()}async updateCategories(e,t){let n=await N(`/contacts/${Pt(e)}/categories`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({categories:t})});if(!n.ok)throw new Ft(n.status,`Failed to update contact: ${n.statusText}`);return n.json()}async deleteContact(e){let t=await N(`/contacts/${Pt(e)}`,{method:`DELETE`});if(!t.ok)throw new Ft(t.status,`Failed to delete contact: ${t.statusText}`)}async bulkUpdateCategories(e){let t=e.filter(e=>e.path),n=await Promise.allSettled(t.map(e=>this.updateCategories(e.path,e.categories??[]))),r={};return n.forEach((e,n)=>{e.status===`fulfilled`&&e.value?.etag&&(r[t[n].path]=e.value.etag)}),{...jn(n),etags:r}}async bulkDeleteContacts(e){let t=await Promise.allSettled(e.map(e=>this.deleteContact(e))),n=e.filter((e,n)=>t[n].status===`fulfilled`);return{...jn(t),deletedPaths:n}}},Nn=e({});T.registerRoute({path:`/contacts/*`,component:`contacts-page`,pluginId:`carddav`,load:()=>E(()=>import(`./contacts-page-8yaFiXOi.js`),__vite__mapDeps([8,2]))}),T.registerNavTab({id:`contacts`,pluginId:`carddav`,labelKey:`navigation.contacts`,icon:`users`,order:10}),T.registerHook(`composer:send`,async({recipients:e})=>{if(!(!e||!Array.isArray(e)))for(let t of e){let{name:e,email:n}=Sn(t);try{await Mn.createContact({name:e,email:n})}catch(e){console.error(`Failed to auto-save contact`,e)}}},`carddav`),T.registerHook(`composer:suggest`,async({query:e})=>{try{let t=(await Mn.fetchContacts(e)).contacts||[],n=[],r=new Set;for(let e of t){let t=e.name||``,i=e.emails&&e.emails.length>0?e.emails:e.email?[{value:e.email}]:[];for(let e of i){let i=e.value?.trim();i&&!r.has(i.toLowerCase())&&(r.add(i.toLowerCase()),n.push({name:t,address:i}))}}return n}catch(e){return console.error(`Failed to fetch contact suggestions`,e),[]}},`carddav`);function Pn(e){return document.querySelector(`meta[name="${e}"]`)?.content||null}var Fn=()=>Pn(`alps-default-theme`),In=[`migadu`];function Ln(){let e=Pn(`alps-logo-builtin`);return e&&In.includes(e)?e:`edelweiss`}var Rn=()=>Pn(`alps-logo`);function zn(){let e=Rn();return e?n`<img class="logo" src=${e} alt="">`:M(Ln())}var Bn=v`
  img.logo {
    object-fit: contain;
  }
`;function Vn(e){let t=e===`default`?Fn()??`alps`:e;return Un[`${t}-light`]?t:`alps`}var Hn={"font-base":`-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,"font-heading":`"Source Serif 4", "Iowan Old Style", "Palatino Linotype", Georgia, serif`,"font-mono":`"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`,"font-label":`var(--font-mono)`,"radius-sm":`2px`,"radius-md":`3px`,"radius-lg":`4px`,"input-radius":`3px`,"btn-radius":`3px`,"accent-fill-border":`#60a5fa`},Un={"alps-light":{id:`alps-light`,name:`Alps Light`,isDark:!1,colors:{"bg-primary":`#ffffff`,"bg-secondary":`#f9fafb`,"bg-tertiary":`#f3f4f6`,"bg-selected":`#eff6ff`,"bg-starred":`#2563eb0f`,"text-primary":`#111827`,"text-sender-read":`#202020`,"text-secondary":`#4b5563`,"text-muted":`#9ca3af`,"border-color":`#e5e7eb`,"accent-color":`#2563eb`,"accent-hover":`#1d4ed8`,"accent-light":`#dbeafe`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`#f3f4f6`}},"alps-dark":{id:`alps-dark`,name:`Alps Dark`,isDark:!0,colors:{"bg-primary":`#1f2937`,"bg-secondary":`#111827`,"bg-tertiary":`#374151`,"bg-selected":`#1e3a8a`,"bg-starred":`#3b82f615`,"text-primary":`#f9fafb`,"text-sender-read":`#e5e7eb`,"text-secondary":`#d1d5db`,"text-muted":`#9ca3af`,"border-color":`#374151`,"accent-color":`#3b82f6`,"accent-hover":`#60a5fa`,"accent-light":`#1e3a8a`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(255, 255, 255, 0.1)`}},"nord-light":{id:`nord-light`,name:`Nord Light`,isDark:!1,colors:{"bg-primary":`#eceff4`,"bg-secondary":`#e5e9f0`,"bg-tertiary":`#d8dee9`,"bg-selected":`#81a1c133`,"bg-starred":`#5e81ac15`,"text-primary":`#2e3440`,"text-sender-read":`#3b4252`,"text-secondary":`#3b4252`,"text-muted":`#4c566a`,"border-color":`#d8dee9`,"accent-color":`#5e81ac`,"accent-hover":`#81a1c1`,"accent-light":`#81a1c133`,success:`#a3be8c`,warning:`#ebcb8b`,error:`#bf616a`,"hover-color":`rgba(0, 0, 0, 0.05)`}},"nord-dark":{id:`nord-dark`,name:`Nord Dark`,isDark:!0,colors:{"bg-primary":`#2e3440`,"bg-secondary":`#3b4252`,"bg-tertiary":`#434c5e`,"bg-selected":`#81a1c133`,"bg-starred":`#88c0d015`,"text-primary":`#eceff4`,"text-sender-read":`#e5e9f0`,"text-secondary":`#e5e9f0`,"text-muted":`#d8dee9`,"border-color":`#434c5e`,"accent-color":`#88c0d0`,"accent-hover":`#81a1c1`,"accent-light":`#81a1c133`,success:`#a3be8c`,warning:`#ebcb8b`,error:`#bf616a`,"hover-color":`rgba(255, 255, 255, 0.1)`}},"ocean-light":{id:`ocean-light`,name:`Ocean Light`,isDark:!1,colors:{"bg-primary":`#f8fafc`,"bg-secondary":`#f1f5f9`,"bg-tertiary":`#e2e8f0`,"bg-selected":`#e0f2fe`,"bg-starred":`#0ea5e915`,"text-primary":`#0f172a`,"text-sender-read":`#1e293b`,"text-secondary":`#334155`,"text-muted":`#64748b`,"border-color":`#cbd5e1`,"accent-color":`#0ea5e9`,"accent-hover":`#0284c7`,"accent-light":`#e0f2fe`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(0, 0, 0, 0.05)`}},"ocean-dark":{id:`ocean-dark`,name:`Ocean Dark`,isDark:!0,colors:{"bg-primary":`#0f172a`,"bg-secondary":`#1e293b`,"bg-tertiary":`#334155`,"bg-selected":`#0c4a6e`,"bg-starred":`#38bdf815`,"text-primary":`#f8fafc`,"text-sender-read":`#e2e8f0`,"text-secondary":`#cbd5e1`,"text-muted":`#94a3b8`,"border-color":`#334155`,"accent-color":`#38bdf8`,"accent-hover":`#0ea5e9`,"accent-light":`#0c4a6e`,success:`#10b981`,warning:`#f59e0b`,error:`#ef4444`,"hover-color":`rgba(255, 255, 255, 0.1)`}},"migadu-light":{id:`migadu-light`,name:`Migadu Light`,isDark:!1,colors:{"bg-primary":`#f5f9ff`,"bg-secondary":`#eaf1fb`,"bg-tertiary":`#dce8f8`,"bg-selected":`#d7e4fb`,"bg-starred":`#1d4ed80d`,"text-primary":`#0b1938`,"text-sender-read":`#1c2f57`,"text-secondary":`#284173`,"text-muted":`#4a6595`,"border-color":`#b9ceec`,"accent-color":`#1d4ed8`,"accent-hover":`#1d4ed8`,"accent-light":`#dbe6fd`,success:`#0b7a48`,warning:`#8f4f00`,error:`#c22f16`,"hover-color":`rgba(34, 85, 221, 0.06)`},tokens:{...Hn,"accent-fill":`#1d4ed8`,"accent-fill-hover":`#1e40af`,"bg-unread":`#1d4ed80b`,"bg-unread-hover":`#1d4ed814`,"scrollbar-thumb":`#b9ceec`,"scrollbar-thumb-hover":`#8fb0de`,"icon-inbox":`#1d4ed8`,"icon-sent":`#0b7a48`,"icon-drafts":`#8f4f00`,"icon-spam":`#c22f16`,"icon-trash":`#4a6595`,"icon-archive":`#284173`,"icon-default":`#4a6595`}},"migadu-dark":{id:`migadu-dark`,name:`Migadu Dark`,isDark:!0,colors:{"bg-primary":`#0c1a3b`,"bg-secondary":`#08122b`,"bg-tertiary":`#172e63`,"bg-selected":`#163469`,"bg-starred":`#38bdf812`,"text-primary":`#f4f8ff`,"text-sender-read":`#d6e2f8`,"text-secondary":`#bfd3f5`,"text-muted":`#82a3dc`,"border-color":`#254380`,"accent-color":`#38bdf8`,"accent-hover":`#38bdf8`,"accent-light":`#123a66`,success:`#34d399`,warning:`#fbbf24`,error:`#ff7a59`,"hover-color":`rgba(96, 165, 250, 0.08)`},tokens:{...Hn,"accent-fill":`#2563eb`,"accent-fill-hover":`#1d4ed8`,"bg-unread":`#38bdf80d`,"bg-unread-hover":`#38bdf817`,"scrollbar-thumb":`#254380`,"scrollbar-thumb-hover":`#4d7ad1`,"icon-inbox":`#38bdf8`,"icon-sent":`#34d399`,"icon-drafts":`#fbbf24`,"icon-spam":`#ff7a59`,"icon-trash":`#82a3dc`,"icon-archive":`#bfd3f5`,"icon-default":`#82a3dc`}}},Wn=`alps_active_user`,Gn={themeMode:`auto`,colorFamily:`default`,layoutMode:`vertical`,densityMode:`compact`,sidebarCollapsed:!1,enableThreading:!0,themeIframeContent:!1,showSenderAvatars:!0,checkMailInterval:5,autoLogout:30,desktopNotifications:!1,soundNotifications:!0,name:``,signature:``,replyTo:``,bccMyself:!1,messagesPerPage:50,preferredView:`html`,markReadTimeout:0,showRemoteContent:`ask`,composeFormat:`html`,undoTimeout:0,language:`en`,hourFormat:`24`,dateFormat:`YYYY-MM-DD`,weekStart:1,sortOrder:`desc`,messageSortCriteria:`date`,maxAttachmentMiB:32,customMailboxOrder:[],unsubscribedFolders:[]},Kn={themeMode:{ui:!0,name:`themeMode`,value:e=>e.themeMode},colorFamily:{ui:!0,name:`colorFamily`,value:e=>e.colorFamily},layoutMode:{ui:!0,name:`layoutMode`,value:e=>e.layoutMode},densityMode:{ui:!0,name:`densityMode`,value:e=>e.densityMode},enableThreading:{ui:!0,name:`enableThreading`,value:e=>e.enableThreading},themeIframeContent:{ui:!0,name:`themeIframeContent`,value:e=>e.themeIframeContent},showSenderAvatars:{ui:!0,name:`showSenderAvatars`,value:e=>e.showSenderAvatars},customMailboxOrder:{ui:!0,name:`customMailboxOrder`,value:e=>e.customMailboxOrder},unsubscribedFolders:{ui:!0,name:`unsubscribedFolders`,value:e=>e.unsubscribedFolders},checkMailInterval:{name:`check_mail_interval`,value:e=>Number(e.checkMailInterval)||0},autoLogout:{name:`auto_logout`,value:e=>Number(e.autoLogout)||0},desktopNotifications:{name:`desktop_notifications`,value:e=>!!e.desktopNotifications},soundNotifications:{name:`sound_notifications`,value:e=>!!e.soundNotifications},name:{name:`from`,value:e=>e.name},signature:{name:`signature`,value:e=>e.signature},replyTo:{name:`reply_to`,value:e=>e.replyTo},bccMyself:{name:`bcc_myself`,value:e=>!!e.bccMyself},messagesPerPage:{name:`messages_per_page`,value:e=>Number(e.messagesPerPage)||50},preferredView:{name:`preferred_view`,value:e=>e.preferredView},markReadTimeout:{name:`mark_read_timeout`,value:e=>Number(e.markReadTimeout)||0},showRemoteContent:{name:`show_remote_content`,value:e=>e.showRemoteContent},composeFormat:{name:`compose_format`,value:e=>e.composeFormat},undoTimeout:{name:`undo_timeout`,value:e=>Number(e.undoTimeout)||0},language:{name:`language`,value:e=>e.language},hourFormat:{name:`hour_format`,value:e=>e.hourFormat},dateFormat:{name:`date_format`,value:e=>e.dateFormat},weekStart:{name:`week_start`,value:e=>Number(e.weekStart)===0?0:1},sortOrder:{name:`sort_order`,value:e=>e.sortOrder},messageSortCriteria:{name:`message_sort_criteria`,value:e=>e.messageSortCriteria}},qn=e=>e in Kn;function Jn(e,t){let n={};for(let r of t){let t=Kn[r];if(t.ui){let r=n.ui??={};r[t.name]=t.value(e)}else n[t.name]=t.value(e)}return n}function Yn(e,t){let n=Kn[t];return n.ui?e.ui?.[n.name]:e[n.name]}function Xn(e,t){return JSON.stringify(e??null)===JSON.stringify(t??null)}var Zn=[5e3,3e4,12e4,3e5];function Qn(e){let t=e.headers.get(`Retry-After`);if(!t)return null;let n=Number(t);if(Number.isFinite(n))return Math.max(0,n*1e3);let r=Date.parse(t);return Number.isNaN(r)?null:Math.max(0,r-Date.now())}var $n=e=>`alps_unsaved_settings_${e}`;function er(e){let t=new Map;try{let n=localStorage.getItem($n(e)),r=n?JSON.parse(n):null;if(r&&typeof r==`object`&&!Array.isArray(r))for(let[e,n]of Object.entries(r))qn(e)&&n&&typeof n==`object`&&`value`in n&&t.set(e,n)}catch(e){x.error(`Failed to read unsaved settings`,e)}return t}var tr=class extends EventTarget{constructor(){super(),this.initialFetchCompleted=!1,this.settingsReadFailed=!1,this.rereadInFlight=!1,this.unsaved=new Map,this.record=null,this.retryTimer=null,this.failures=0,this.epoch=0,this.saveInFlight=!1,this.savePending=!1,this.i18n=null,this.themeProperties=[],this.state=this.loadSettings(),this.applyTheme(),window.matchMedia(`(prefers-color-scheme: dark)`).addEventListener(`change`,()=>{this.state.themeMode===`auto`&&(this.applyTheme(),this.notify())}),window.addEventListener(`session-cleared`,()=>{this.epoch++,this.initialFetchCompleted=!1,this.settingsReadFailed=!1,this.unsaved.clear(),this.record=null,this.cancelRetry(),this.failures=0,this.state=this.loadSettings(),this.applyTheme(),this.notify()}),window.addEventListener(`user-logged-in`,e=>{let t=e.detail?.username;this.epoch++,this.cancelRetry(),this.failures=0,this.initializeSession(t)}),window.addEventListener(`online`,()=>{this.unsaved.size===0||!this.initialFetchCompleted||(this.cancelRetry(),this._saveBackendSettings())}),this.initializeSession()}async initializeSession(e){let t=this.epoch;if(this.initialFetchCompleted=!1,this.record=null,e){this.state.loginUsername=e;try{let t=localStorage.getItem(Wn);localStorage.setItem(Wn,e),t!==e&&window.dispatchEvent(new CustomEvent(`alps-active-user-changed`))}catch(e){x.error(`Failed to record the active user`,e)}let t=this.loadSettings(e);this.state={...this.state,...t,loginUsername:e},this.adoptUnsaved(e),this.applyTheme(),this.notify()}let n=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`))||!!this.state.loginUsername||!!rr(),r=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));if(!n&&!r){await this._fetchBackendSettings();return}if(!e)try{let e=await fetch(`/session`);if(t!==this.epoch)return;if(e.ok){let n=await e.json();if(t!==this.epoch)return;let r=n.Username||n.username,i=n.Address||void 0;if(r){this.state.loginUsername=r;try{let e=localStorage.getItem(Wn);localStorage.setItem(Wn,r),e!==r&&window.dispatchEvent(new CustomEvent(`alps-active-user-changed`))}catch(e){x.error(`Failed to record the active user`,e)}let e=this.loadSettings(r);this.state={...this.state,...e,loginUsername:r,loginAddress:i},this.adoptUnsaved(r),this.applyTheme(),this.notify()}}}catch(e){x.error(`Failed to fetch session username during initialization`,e)}await this._fetchBackendSettings()}adoptUnsaved(e){let t=er(e);if(t.size===0)return;let n=this.state;for(let[e,r]of t)this.unsaved.has(e)||(this.unsaved.set(e,r),n[e]=r.value);this.saveSettings()}storeUnsaved(e=[]){let t=this.state.loginUsername;if(!t)return;let n=er(t);for(let t of e)n.delete(t);for(let[e,t]of this.unsaved)n.set(e,t);try{n.size===0?localStorage.removeItem($n(t)):localStorage.setItem($n(t),JSON.stringify(Object.fromEntries(n)))}catch(e){x.error(`Failed to record unsaved settings`,e)}}markUnsaved(e){let t=this.state[e],n=this.unsaved.get(e);n?n.value=t:this.record?this.unsaved.set(e,{value:t,base:Yn(this.record,e)??null}):this.unsaved.set(e,{value:t})}yieldToRecord(e){if(this.unsaved.size===0)return;let t=[];for(let[n,r]of this.unsaved){let i=Yn(e,n)??null;`base`in r&&!Xn(i,r.base)?t.push(n):r.base=i}for(let e of t)this.unsaved.delete(e);this.storeUnsaved(t)}loadSettings(e){let t=e?`alps_settings_${e}`:null,n=t?localStorage.getItem(t):null,r={};if(n)try{r=JSON.parse(n)}catch(e){x.error(`Failed to parse user settings`,e)}let i=localStorage.getItem(`alps_settings`),a={};if(i)try{a=JSON.parse(i)}catch(e){x.error(`Failed to parse global settings`,e)}let o={...Gn,themeMode:r.themeMode??a.themeMode??Gn.themeMode,colorFamily:r.colorFamily??a.colorFamily??Gn.colorFamily,layoutMode:r.layoutMode??a.layoutMode??Gn.layoutMode,densityMode:r.densityMode??a.densityMode??Gn.densityMode,enableThreading:r.enableThreading??a.enableThreading??Gn.enableThreading,themeIframeContent:r.themeIframeContent??a.themeIframeContent??Gn.themeIframeContent,showSenderAvatars:r.showSenderAvatars??a.showSenderAvatars??Gn.showSenderAvatars,customMailboxOrder:r.customMailboxOrder??a.customMailboxOrder??Gn.customMailboxOrder,language:r.language??a.language??Gn.language,loginUsername:e,loginAddress:r.loginAddress};return n&&Object.assign(o,r),o}saveSettings(){let e=this.state.loginUsername||rr();if(e){this.state.loginUsername||(this.state.loginUsername=e),localStorage.setItem(`alps_settings_${e}`,JSON.stringify(this.state));try{let t=localStorage.getItem(Wn);localStorage.setItem(Wn,e),t!==e&&window.dispatchEvent(new CustomEvent(`alps-active-user-changed`))}catch(e){x.error(`Failed to record the active user`,e)}}let t={themeMode:this.state.themeMode,colorFamily:this.state.colorFamily,language:this.state.language,layoutMode:this.state.layoutMode,densityMode:this.state.densityMode,enableThreading:this.state.enableThreading,themeIframeContent:this.state.themeIframeContent,showSenderAvatars:this.state.showSenderAvatars};localStorage.setItem(`alps_settings`,JSON.stringify(t))}notify(){this.dispatchEvent(new CustomEvent(`change`))}getState(){return this.state}get recordRead(){return this.initialFetchCompleted}async updateSettings(e){let t=this.state.loginUsername,n=e.loginUsername,r=n!==void 0&&n!==t?t===void 0?{...this.loadSettings(n),...this.state}:this.loadSettings(n):this.state;this.state={...r,...e},this.saveSettings(),(e.themeMode!==void 0||e.colorFamily!==void 0)&&this.applyTheme(),this.notify();let i=Object.keys(e).filter(e=>qn(e)&&JSON.stringify(r[e])!==JSON.stringify(this.state[e]));if(i.length>0){for(let e of i)this.markUnsaved(e);return this.storeUnsaved(),this._saveBackendSettings()}}async _fetchBackendSettings(){let e=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`))||!!this.state.loginUsername||!!rr(),t=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));if(!e&&!t){window.location.hash.startsWith(`#/login`)||window.dispatchEvent(new CustomEvent(`auth-error`)),this.initialFetchCompleted=!0;return}let n=this.epoch,r=!1,i=!1;try{let e=await fetch(`/settings`);if(n!==this.epoch)return;if(e.status===401){window.dispatchEvent(new CustomEvent(`auth-error`));return}if(e.ok){let t=await e.json();if(n!==this.epoch)return;i=!0;let a={};if(t.MaxAttachmentMiB!==void 0&&(a.maxAttachmentMiB=t.MaxAttachmentMiB),t.HasThreadCapability!==void 0&&(a.hasThreadCapability=t.HasThreadCapability,t.HasThreadCapability===!1&&(a.enableThreading=!1)),t.HasESearchCapability!==void 0&&(a.hasESearchCapability=t.HasESearchCapability),t&&t.Settings){let e=t.Settings;if(e.ui){let t=e.ui;t.themeMode&&(t.themeMode!==`auto`||!this.state.themeMode||this.state.themeMode===`auto`)&&(a.themeMode=t.themeMode),t.colorFamily&&(t.colorFamily!==`default`||!this.state.colorFamily||this.state.colorFamily===`default`)&&(a.colorFamily=t.colorFamily),t.layoutMode&&(a.layoutMode=t.layoutMode),t.densityMode&&(a.densityMode=t.densityMode),t.sidebarCollapsed!==void 0&&(a.sidebarCollapsed=t.sidebarCollapsed),t.enableThreading!==void 0&&(a.enableThreading=t.enableThreading),t.themeIframeContent!==void 0&&(a.themeIframeContent=t.themeIframeContent),t.showSenderAvatars!==void 0&&(a.showSenderAvatars=t.showSenderAvatars),t.customMailboxOrder!==void 0&&(a.customMailboxOrder=t.customMailboxOrder),a.unsubscribedFolders=Array.isArray(t.unsubscribedFolders)?t.unsubscribedFolders.filter(e=>typeof e==`string`):[]}e.check_mail_interval!==void 0&&e.check_mail_interval!==0&&(a.checkMailInterval=e.check_mail_interval),e.auto_logout!==void 0&&(a.autoLogout=e.auto_logout),e.desktop_notifications!==void 0&&(a.desktopNotifications=e.desktop_notifications),e.sound_notifications!==void 0&&(a.soundNotifications=e.sound_notifications),e.from!==void 0&&(a.name=e.from),e.signature!==void 0&&(a.signature=e.signature),e.reply_to!==void 0&&(a.replyTo=e.reply_to),e.bcc_myself!==void 0&&(a.bccMyself=e.bcc_myself),e.messages_per_page!==void 0&&e.messages_per_page!==0&&(a.messagesPerPage=e.messages_per_page),e.preferred_view!==void 0&&e.preferred_view!==``&&(a.preferredView=e.preferred_view),e.mark_read_timeout!==void 0&&(a.markReadTimeout=e.mark_read_timeout),e.show_remote_content!==void 0&&e.show_remote_content!==``&&(a.showRemoteContent=e.show_remote_content),e.compose_format!==void 0&&e.compose_format!==``&&(a.composeFormat=e.compose_format),e.undo_timeout!==void 0&&(a.undoTimeout=e.undo_timeout),e.language!==void 0&&e.language!==``&&(a.language=e.language),e.hour_format!==void 0&&e.hour_format!==``&&(a.hourFormat=e.hour_format),e.date_format!==void 0&&e.date_format!==``&&(a.dateFormat=e.date_format),e.week_start!==void 0&&(a.weekStart=Number(e.week_start)===0?0:1),e.sort_order!==void 0&&e.sort_order!==``&&(a.sortOrder=e.sort_order),e.message_sort_criteria!==void 0&&e.message_sort_criteria!==``&&(a.messageSortCriteria=e.message_sort_criteria),e.language||(r=!0),this.record=e,this.yieldToRecord(e);for(let e of this.unsaved.keys())delete a[e];if(Object.keys(a).length>0){let e=this.state.loginUsername||rr();this.state={...this.state,...a},e&&!this.state.loginUsername&&(this.state.loginUsername=e),this.saveSettings(),this.applyTheme(),this.notify()}}}}catch(e){x.error(`Failed to fetch backend settings`,e)}finally{n===this.epoch&&(this.initialFetchCompleted=i,this.settingsReadFailed=!i)}n===this.epoch&&(r&&!this.unsaved.has(`language`)&&(this.markUnsaved(`language`),this.storeUnsaved()),i&&this.unsaved.size>0&&await this._saveBackendSettings())}async _saveBackendSettings(){if(!this.initialFetchCompleted){if(this.settingsReadFailed&&!this.rereadInFlight){this.rereadInFlight=!0;try{await this._fetchBackendSettings()}finally{this.rereadInFlight=!1}this.initialFetchCompleted||this.reportSaveFailure()}return}if(this.saveInFlight){this.savePending=!0;return}let e=[...this.unsaved.keys()];if(e.length===0)return;let t=this.epoch,n=Jn(this.state,e),r=new Map(e.map(e=>[e,this.state[e]]));this.saveInFlight=!0;try{let i=await this._putBackendSettings(n,t);if(i===`ended`||t!==this.epoch)return;if(i===`saved`)this.failures=0,this.cancelRetry(),this.noteSaved(n);else if(i!==`refused`){this.failures===0&&this.reportSaveFailure(),this.retryLater(i.retryAfterMs);return}else this.reportSaveFailure();let a=[];for(let t of e){let e=this.unsaved.get(t);e&&(Xn(this.state[t],r.get(t))?a.push(t):i===`saved`&&this.record&&(e.base=Yn(this.record,t)??null))}for(let e of a)this.unsaved.delete(e);this.storeUnsaved(a)}finally{this.saveInFlight=!1,this.savePending&&(this.savePending=!1,this._saveBackendSettings())}}retryLater(e){if(this.cancelRetry(),this.unsaved.size===0)return;let t=Zn[Math.min(this.failures,Zn.length-1)];this.failures++,this.retryTimer=setTimeout(()=>{this.retryTimer=null,this._saveBackendSettings()},Math.max(t,e??0))}cancelRetry(){this.retryTimer&&=(clearTimeout(this.retryTimer),null)}noteSaved(e){if(this.record)for(let[t,n]of Object.entries(e))t===`ui`?this.record.ui={...this.record.ui??{},...n}:this.record[t]=n}async _putBackendSettings(e,t){try{let n=await fetch(`/settings`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});return t===this.epoch?n.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),`ended`):n.ok?`saved`:(x.error(`Failed to save backend settings`,n.status),n.status>=500||n.status===408||n.status===429?{retryAfterMs:Qn(n)}:`refused`):`ended`}catch(e){return x.error(`Failed to save backend settings`,e),t===this.epoch?{retryAfterMs:null}:`ended`}}reportSaveFailure(){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.translate(`settings.saveFailed`,`Could not save that setting — it may not survive signing out`),duration:6e3}}))}setI18n(e){this.i18n=e}translate(e,t){return this.i18n?.t(e)||t}applyTheme(){let e=!1;this.state.themeMode===`dark`?e=!0:this.state.themeMode===`auto`&&(e=window.matchMedia(`(prefers-color-scheme: dark)`).matches),e?document.body.classList.add(`theme-dark`):document.body.classList.remove(`theme-dark`);let t=Un[`${Vn(this.state.colorFamily)}-${e?`dark`:`light`}`];if(t){let e=document.documentElement.style;for(let t of this.themeProperties)e.removeProperty(t);let n={...t.colors,...t.tokens};this.themeProperties=Object.keys(n).map(e=>`--${e}`);for(let[t,r]of Object.entries(n))e.setProperty(`--${t}`,r)}}},nr=u(`settings-store`);function rr(){try{return localStorage.getItem(Wn)}catch{return null}}function ir(e){return e?.loginAddress||e?.loginUsername||``}function ar(){let e=(()=>{try{let e=localStorage.getItem(`alps_settings`);return e?JSON.parse(e):{}}catch{return{}}})(),t=rr();if(!t)return e;try{let n=localStorage.getItem(`alps_settings_${t}`);return n?{...e,...JSON.parse(n)}:e}catch{return e}}function or(e=!0){let t=localStorage.getItem(`alps_settings`);if(t)try{let e=JSON.parse(t),n={};e.themeMode&&(n.themeMode=e.themeMode),e.colorFamily&&(n.colorFamily=e.colorFamily),e.language&&(n.language=e.language),e.layoutMode&&(n.layoutMode=e.layoutMode),e.densityMode&&(n.densityMode=e.densityMode),e.enableThreading!==void 0&&(n.enableThreading=e.enableThreading),e.themeIframeContent!==void 0&&(n.themeIframeContent=e.themeIframeContent),e.showSenderAvatars!==void 0&&(n.showSenderAvatars=e.showSenderAvatars),localStorage.setItem(`alps_settings`,JSON.stringify(n))}catch(e){x.error(`Failed to clear and preserve global settings`,e),localStorage.removeItem(`alps_settings`)}try{let e=localStorage.getItem(Wn);e&&localStorage.removeItem(`alps_settings_${e}`),e&&localStorage.removeItem($n(e)),localStorage.removeItem(Wn)}catch(e){x.error(`Failed to clear the per-user settings record`,e)}if(!e)return;let n=`; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`+(window.location.protocol===`https:`?`; Secure`:``);document.cookie=`alps_logged_in=`+n,document.cookie=`alps_has_login_token=`+n}var sr=v`
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
`,cr=class extends d{constructor(...e){super(...e),this.title=``,this.isDanger=!1,this.dismissible=!1,this.width=`400px`,this.bodyDescribes=!1,this.ownHeader=!1,this._handleEscape=e=>{this.dismissible||e.preventDefault()},this._handleDialogClose=()=>{this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}}static{this.styles=v`
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
  `}firstUpdated(){let e=this.shadowRoot?.querySelector(`.modal-dialog`);e&&!e.open&&e.showModal()}_handleOverlayClick(e){this.dismissible?e.target===e.currentTarget&&(e.stopPropagation(),this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))):e.stopPropagation()}_handleHeaderChange(e){this.ownHeader=e.target.assignedElements().length>0}render(){return n`
      <dialog class="modal-dialog"
        aria-labelledby=${this.title&&!this.ownHeader?`modal-title`:c}
        aria-label=${this.title&&this.ownHeader?this.title:c}
        aria-describedby=${this.bodyDescribes?`modal-body`:c}
        @pointerdown=${this._handleOverlayClick} @cancel=${this._handleEscape} @close=${this._handleDialogClose}>
        <div class="modal-card" style="width: ${this.width};" @pointerdown=${e=>e.stopPropagation()}>
          <slot name="header" @slotchange=${this._handleHeaderChange}>
            ${this.title?n`<h3 id="modal-title" class="modal-title ${this.isDanger?`danger`:``}">${this.title}</h3>`:``}
          </slot>
          <div class="modal-body" id="modal-body">
            <slot></slot>
          </div>
          <div class="modal-actions">
            <slot name="actions"></slot>
          </div>
        </div>
      </dialog>
    `}};P([o({type:String})],cr.prototype,`title`,void 0),P([o({type:Boolean})],cr.prototype,`isDanger`,void 0),P([o({type:Boolean})],cr.prototype,`dismissible`,void 0),P([o({type:String})],cr.prototype,`width`,void 0),P([o({type:Boolean})],cr.prototype,`bodyDescribes`,void 0),P([a()],cr.prototype,`ownHeader`,void 0),cr=P([p(`ui-modal`)],cr);var F=class extends d{constructor(...e){super(...e),this._handleI18nChange=()=>this.requestUpdate(),this.type=`text`,this.value=``,this.placeholder=``,this.required=!1,this.autocomplete=``,this.inputId=``,this.label=``,this.icon=``,this.clearable=!1,this.autofocus=!1,this.showPassword=!1}static{this.styles=v`
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
            ${M(r)}
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
            ${M(this.showPassword?`eyeSlash`:`eye`)}
          </button>
        `:this.clearable&&this.value?n`
          <button 
            type="button" 
            class="action-btn" 
            @click=${this.handleClear}
            title=${this.i18nStore?.t(`general.clear`)||`Clear`}
            tabindex="-1"
          >
            ${M(`x`)}
          </button>
        `:``}
      </div>
    `}};P([h({context:D})],F.prototype,`i18nStore`,void 0),P([o({type:String})],F.prototype,`type`,void 0),P([o({type:String})],F.prototype,`value`,void 0),P([o({type:String})],F.prototype,`placeholder`,void 0),P([o({type:Boolean})],F.prototype,`required`,void 0),P([o({type:String})],F.prototype,`autocomplete`,void 0),P([o({type:String})],F.prototype,`inputId`,void 0),P([o({type:String})],F.prototype,`label`,void 0),P([o({type:String})],F.prototype,`icon`,void 0),P([o({type:Boolean})],F.prototype,`clearable`,void 0),P([o({type:Boolean})],F.prototype,`autofocus`,void 0),P([a()],F.prototype,`showPassword`,void 0),F=P([p(`alps-input`)],F);var I=class extends d{constructor(...e){super(...e),this.title=`Prompt`,this.fields=[],this.confirmText=``,this.cancelText=``,this.busy=!1,this.errors={},this.isDanger=!1,this.values={},this.fieldErrors={},this.seededFrom=null,this.submitted=!1}static{this.styles=[sr,v`
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
    `}};P([h({context:D})],I.prototype,`i18nStore`,void 0),P([o({type:String})],I.prototype,`title`,void 0),P([o({type:Array})],I.prototype,`fields`,void 0),P([o({type:String})],I.prototype,`confirmText`,void 0),P([o({type:String})],I.prototype,`cancelText`,void 0),P([o({type:Boolean})],I.prototype,`busy`,void 0),P([o({type:Object})],I.prototype,`errors`,void 0),P([o({type:Boolean})],I.prototype,`isDanger`,void 0),P([a()],I.prototype,`values`,void 0),P([a()],I.prototype,`fieldErrors`,void 0),P([a()],I.prototype,`submitted`,void 0),I=P([p(`ui-prompt`)],I);function lr(e,t){return new Promise(n=>{let r=document.createElement(`ui-prompt`);r.title=t?.t(`gpg.passphraseRequired`),r.confirmText=t?.t(`gpg.unlock`),r.cancelText=t?.t(`general.cancel`);let i=t?.t(`gpg.passphrasePrompt`);e&&(i+=` (Error: ${e})`),r.fields=[{id:`passphrase`,label:i,type:`password`,placeholder:t?.t(`gpg.passphrase`),autofocus:!0}];let a=()=>{r.parentNode&&r.parentNode.removeChild(r)};r.addEventListener(`submit`,e=>{n(e.detail.passphrase),a()}),r.addEventListener(`cancel`,()=>{n(null),a()}),document.body.appendChild(r)})}var ur=null,dr=0;function fr(){ur=null;try{sessionStorage.removeItem(`gpg_private_key`)}catch{}}window.addEventListener(`session-cleared`,()=>{dr++,fr()});function pr(e,t){return t===dr&&(ur=e),e}async function mr(e,t){if(ur)return ur;let n=dr,r=await N(`/gpg/keys`);if(!r.ok)throw Error(`Failed to fetch GPG keyring.`);let i=await r.json();if(n!==dr)throw Error(`The session ended.`);if(!i.encrypted_private_key)throw Error(`No private key found on server. Please generate one in Settings.`);let a=await e.readPrivateKey({armoredKey:i.encrypted_private_key});if(a.isDecrypted())return pr(a,n);{let r,i=await lr(r,t);for(;i!==null;)try{return pr(await e.decryptKey({privateKey:a,passphrase:i}),n)}catch(e){r=`Incorrect passphrase: `+e.message,i=await lr(r,t)}throw Error(`Passphrase prompt cancelled.`)}}async function hr(e){let{instance:t,formData:n,composer:r}=e;if(!t.encryptGpg)return n;if(n.get(`attachment-uuids`)||n.get(`prev_attachments`)){let e=r?.i18nStore?.t(`gpg.attachmentsNotEncryptable`);return alert(e||`Attachments cannot be encrypted with inline PGP and would be sent unencrypted. Remove the attachments, or turn off encryption to send them.`),!1}try{let e=await E(()=>import(`./openpgp-CVa1OxL9.js`).then(e=>e.t),__vite__mapDeps([9,5])),i=t.to||[],a=t.cc||[],o=t.bcc||[],s=[...i,...a,...o];if(s.length===0)return n;let c=[],l=[],u=ir(ar()).trim().toLowerCase();for(let t of s){let n=Sn(t).email||t.trim();if(u&&u===n.toLowerCase())continue;let r=(await Mn.fetchContacts(n)).contacts||[],i=!1;for(let t of r)if(t.public_key){let n=await e.readKey({armoredKey:t.public_key});c.push(n),i=!0;break}i||l.push(t)}if(l.length>0){let e=r.i18nStore?.t(`gpg.missingPublicKeys`),t=l.join(`
`);return alert(e?e.replace(`{keys}`,t):`Cannot encrypt: Missing public keys for:\n${t}`),!1}let d=await mr(e,r.i18nStore),f=d.toPublic();c.push(f);let p=n.get(`text`)||``,m=n.get(`html`)||``,h=``;h=t.format===`html`&&m?m:p;let g=await e.createMessage({text:h}),_=await e.encrypt({message:g,encryptionKeys:c,signingKeys:d,format:`armored`});return n.set(`text`,_),n.set(`html`,``),n}catch(e){return alert(`GPG Encryption failed: `+e.message),!1}}async function gr(e){if(typeof e.content==`string`&&e.content.includes(`-----BEGIN PGP MESSAGE-----`))try{let t=await E(()=>import(`./openpgp-CVa1OxL9.js`).then(e=>e.t),__vite__mapDeps([9,5])),r=e.content.indexOf(`-----BEGIN PGP MESSAGE-----`),i=e.content.indexOf(`-----END PGP MESSAGE-----`)+25;if(r===-1||i<=r)return e.content;let a=e.content.substring(r,i),o=await mr(t,e.i18nStore),s=await t.readMessage({armoredMessage:a}),{data:c}=await t.decrypt({message:s,decryptionKeys:o,format:`utf8`}),l=String(c);l.includes(`<html`)||l.includes(`<body`)||l.includes(`<p>`)||l.includes(`<div`)||l.includes(`<br`)||(l=l.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/\n/g,`<br/>`));let u=e.content.substring(0,r)+l+e.content.substring(i);return e.banners=e.banners||[],e.banners.push(n`
              <alps-banner variant="info">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex; width: 16px; height: 16px;">${M(`lock`)}</span>
                  <span>${e.i18nStore?.t(`gpg.decryptedSuccess`)}</span>
                </span>
              </alps-banner>
            `),e.isHtml=!0,u}catch(t){return console.error(`Decryption failed:`,t),e.banners=e.banners||[],e.banners.push(n`
              <alps-banner variant="error">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex; width: 16px; height: 16px;">${M(`lock`)}</span>
                  <span>${e.i18nStore?.t(`gpg.decryptedFailed`)}</span>
                </span>
              </alps-banner>
            `),e.content}return e.content}var _r=e({});T.registerSettingsTab({id:`gpg`,labelKey:`settings.gpg`,icon:`key`,component:`alps-gpg-settings`,load:()=>E(()=>import(`./gpg-settings-D6bIXI7k.js`),__vite__mapDeps([10,2]))}),T.registerHook(`composer:toolbar`,e=>{let t=e.instance,r=e.composer,i=t.encryptGpg||!1;return n`
        <alps-icon-btn 
            title="${r.i18nStore?.t(`gpg.toggleEncryption`)}" 
            icon="lock"
            ?active=${i}
            @click=${()=>{r.composeStore.updateComposer(t.id,{encryptGpg:!i})}}>
        </alps-icon-btn>
    `},`gpg`),T.registerHook(`composer:presend`,hr,`gpg`),T.registerHook(`reader:content`,gr,`gpg`);var vr=e({});T.registerSettingsTab({id:`managesieve`,labelKey:`settings.categories.filters`,icon:`sieve`,component:`alps-managesieve-page`,load:()=>E(()=>import(`./managesieve-page-0UeFWltk.js`),__vite__mapDeps([11,12,2]))}),T.registerSettingsTab({id:`autoreply`,pluginId:`managesieve`,labelKey:`settings.categories.autoReply`,icon:`arrowBendUpLeft`,component:`alps-auto-reply-page`,load:()=>E(()=>import(`./auto-reply-page-iIgyegzF.js`),__vite__mapDeps([13,12,2]))});var yr=e({});T.registerSettingsTab({id:`password`,labelKey:`settings.categories.password`,icon:`password`,component:`alps-password-settings`,load:()=>E(()=>import(`./password-settings-BY6dnMxd.js`),__vite__mapDeps([14,2]))});var br=class{get currentPath(){return this.getHashPath()}constructor(e,t,n){this.routes=e,this.fallback=t,this.onHashChange=()=>n()}hostConnected(){window.addEventListener(`hashchange`,this.onHashChange),this.onHashChange()}hostDisconnected(){window.removeEventListener(`hashchange`,this.onHashChange)}getHashPath(){let e=window.location.hash;return!e||e===`#`?`/`:e.substring(1).split(`?`)[0]}navigate(e){window.location.hash=e}render(){if(this.routes[this.currentPath])return this.routes[this.currentPath]();for(let e in this.routes)if(e.endsWith(`/*`)&&this.currentPath.startsWith(e.replace(`/*`,``)))return this.routes[e]();return this.fallback()}};function L(e,t){return`${e??``}\0${String(t)}`}function xr(e){let t=e.indexOf(`\0`);return t===-1?{mailbox:``,uid:e}:{mailbox:e.slice(0,t),uid:e.slice(t+1)}}function Sr(e){let t=new Map;for(let n of e){let{mailbox:e,uid:r}=xr(n),i=t.get(e);i?i.push(r):t.set(e,[r])}return t}function Cr(e,t){return typeof e?.Mailbox==`string`&&e.Mailbox?e.Mailbox:t}var wr=`alps-mail-poll`,Tr=`alps-mail-poll-counts`,Er=60*1e3,Dr=600*1e3,Or=30,kr=class extends EventTarget{constructor(){super(),this.interval=null,this.currentMailbox=O,this.currentPage=0,this.currentQuery=``,this.listed=!1,this.heard=null,this.shownCheck=null,this.pollMinutes=0,this.leading=!1,this.releaseLead=null,this.leadRequest=null,this.lockFailed=!1,this.pollGeneration=0,this.pollBusy=!1,this.channel=null,this.peerId=Ar(),this.sessionEpoch=Ar(),this.username=null,this.peers=new Map,this.listings=new Map,this.latestMailboxes=null,this.listingSettingsKey=``,this.listingOut=null,this.changes=[],this.changeSeq=0,this.listingsOut=0,this.watching=!1,this.handleShown=()=>{this.tellView(),!(this.shownCheck||document.hidden||!this.listed||!this.heard)&&(Date.now()-this.heard.at<Er||(this.shownCheck=this.backgroundSync({announce:this.announces}).finally(()=>{this.shownCheck=null})))},this.handlePollMessage=e=>{let t=e.data;if(!(!t||this.pollMinutes<=0)){if(t.type===`leader`||t.type===`hello`){this.tellView();return}if(t.type===`leave`){this.peers.delete(t.peer);return}if(t.type===`watch`&&(this.leading||!navigator.locks||this.lockFailed)){if(typeof t.peer!=`string`||typeof t.epoch!=`string`||typeof t.mailbox!=`string`||t.username!==this.username)return;this.peers.set(t.peer,{...t,seen:Date.now()});return}t.type!==`counts`||this.leading||document.hidden||!this.listed||t.peer!==this.peerId||t.epoch!==this.sessionEpoch||t.username!==this.username||t.mailbox!==this.currentMailbox||(this.tellView(),this.backgroundSync({announce:!1,scheduled:!0,shared:{mailbox:Mr(t.counts),inbox:Mr(t.inbox)}}))}},this.writing=0,this.syncAsked=!1,this.refreshAsked=!1,this.currentFetchId=0,this.currentLabelsId=0,window.addEventListener(`session-cleared`,()=>{this.resetPollSession(),this.currentFetchId++,this.currentLabelsId++,this.listed=!1,this.heard=null,this.forgetListings(),this.latestMailboxes=null}),window.addEventListener(`user-logged-in`,()=>{this.resetPollSession(),this.currentFetchId++,this.currentLabelsId++,this.listed=!1,this.heard=null,this.forgetListings(),this.latestMailboxes=null}),window.addEventListener(`external-message-flags-changed`,e=>{let{keys:t,flag:n,action:r}=e.detail??{};if(!Array.isArray(t)||typeof n!=`string`)return;let i=new Set(t);for(let e of this.listings.values())Pr(e,i,n,r);this.noteChange(e=>Pr(e,i,n,r))}),window.addEventListener(`draft-autosaved`,e=>{let{mailbox:t,oldMailbox:n}=e.detail??{};this.forgetListings(e=>e===t||e===n||e===`*`),this.noteChange()})}rowsTakenOut(e){e.length>0&&this.forgetListings();let t=new Set(e);return this.noteChange(e=>Fr(e,t)),()=>t.clear()}noteChange(e){this.listingsOut!==0&&this.changes.push({seq:++this.changeSeq,replay:e})}listingSent(){return this.listingsOut++,this.changeSeq}listingDone(){this.listingsOut--,this.listingsOut===0&&(this.changes=[])}replayChanges(e,t){let n=!1;for(let r of this.changes)r.seq<=t||(n=!0,r.replay?.(e));return n}setListingSettings(e){e!==this.listingSettingsKey&&(this.listingSettingsKey=e,this.forgetListings(),this.noteChange())}listingKey(e,t,n){return[e,t,n].join(`\0`)}keptListing(e,t,n){let r=this.listingKey(e,t,n),i=this.listings.get(r);if(!i)return;this.listings.delete(r),this.listings.set(r,i);let a=JSON.parse(JSON.stringify(i));return this.latestMailboxes&&(a.Mailboxes=this.latestMailboxes),a}keepListing(e,t,n,r){r.Mailboxes&&(this.latestMailboxes=r.Mailboxes);let i=JSON.parse(JSON.stringify(r));delete i.Mailboxes;let a=this.listingKey(e,t,n);for(this.listings.delete(a),this.listings.set(a,i);this.listings.size>Or;)this.listings.delete(this.listings.keys().next().value)}forgetListings(e){if(!e){this.listings.clear();return}for(let[t,n]of[...this.listings])e(n.ListedMailbox??``)&&this.listings.delete(t)}setContext(e,t,n=``){this.currentMailbox=e,this.currentPage=t,this.currentQuery=n,this.tellView()}start(e=5){if(this.stop(),this.pollMinutes=e,this.lockFailed=!1,e<=0)return;this.watchShown(!0);try{typeof window.BroadcastChannel==`function`&&(this.channel=new window.BroadcastChannel(Tr),this.channel.onmessage=this.handlePollMessage)}catch(e){x.error(`Failed to share poll counts`,e)}this.tellView(),this.postPoll({type:`hello`});let t=typeof navigator<`u`?navigator.locks:void 0;if(!t){this.startTimer();return}this.channel||this.startTimer();let n=this.pollGeneration,r=this.leadRequest=new AbortController;t.request(wr,{signal:r.signal},()=>new Promise(e=>{if(this.pollMinutes<=0||n!==this.pollGeneration){e();return}this.leading=!0,this.releaseLead=()=>{this.leading=!1,this.releaseLead=null,e()},this.postPoll({type:`leader`}),this.startTimer()})).catch(e=>{r.signal.aborted||n!==this.pollGeneration||(x.error(`Failed to take the poll lock`,e),this.lockFailed=!0,this.postPoll({type:`hello`}),this.tellView(),this.pollMinutes>0&&!this.leading&&this.startTimer())})}stop(){this.pollMinutes=0,this.pollGeneration++,this.leadRequest?.abort(),this.leadRequest=null,this.postPoll({type:`leave`,peer:this.peerId}),this.channel?.close(),this.channel=null,this.peers.clear(),this.stopTimer(),this.giveUpLead(),this.watchShown(!1)}startTimer(){this.stopTimer(),this.interval=setInterval(()=>void this.poll(),this.pollMinutes*60*1e3)}stopTimer(){this.interval&&=(clearInterval(this.interval),null)}giveUpLead(){this.releaseLead?.()}get announces(){return this.pollMinutes<=0||this.leading?!0:navigator.locks&&!this.lockFailed?!1:[...this.peers.values()].every(e=>e.username!==this.username||Date.now()-e.seen>Math.max(this.pollMinutes*3*6e4,18e4)||e.peer>this.peerId)}watchShown(e){e===this.watching||typeof document>`u`||(this.watching=e,e?(document.addEventListener(`visibilitychange`,this.handleShown),window.addEventListener(`focus`,this.handleShown)):(document.removeEventListener(`visibilitychange`,this.handleShown),window.removeEventListener(`focus`,this.handleShown)))}postPoll(e){try{this.channel?.postMessage(e)}catch(e){x.error(`Failed to share poll counts`,e),this.channel?.close(),this.channel=null,this.pollMinutes>0&&this.startTimer()}}tellView(){!this.username||this.pollMinutes<=0||this.postPoll({type:`watch`,peer:this.peerId,epoch:this.sessionEpoch,username:this.username,mailbox:this.currentMailbox,visible:!document.hidden})}resetPollSession(){let e=this.pollMinutes;this.stop(),this.sessionEpoch=Ar(),this.username=null,e>0&&this.start(e)}async poll(){if(!(this.pollBusy||this.pollMinutes<=0)){this.pollBusy=!0;try{if(!this.leading||!this.channel||!this.username){if(!this.leading&&navigator.locks&&!this.lockFailed&&document.hidden)return;this.tellView(),await this.backgroundSync({announce:this.announces,scheduled:!0});return}let e=this.pollGeneration,t=this.username,n=[...this.peers.values()].filter(e=>e.visible&&e.username===t&&Date.now()-e.seen<=Math.max(this.pollMinutes*3*6e4,18e4)),r=this.currentMailbox,i=this.currentFetchId,a=new Set([O,r,...n.map(e=>e.mailbox)]),o=new Map;for(let t of a)if(o.set(t,t===`*`?null:await this.askCounts(t).catch(()=>null)),!this.leading||e!==this.pollGeneration)return;for(let e of n)this.postPoll({type:`counts`,peer:e.peer,epoch:e.epoch,username:t,mailbox:e.mailbox,counts:o.get(e.mailbox),inbox:o.get(O)});if(r!==this.currentMailbox||i!==this.currentFetchId)return;await this.backgroundSync({announce:!0,scheduled:!0,shared:{mailbox:o.get(r)??null,inbox:o.get(`INBOX`)??null}})}finally{this.pollBusy=!1}}}mailboxRenamed(e,t){if(this.forgetListings(),this.currentMailbox===e)this.currentMailbox=t;else if(this.currentMailbox.startsWith(e)){let n=this.currentMailbox.slice(e.length);/^[^A-Za-z0-9]/.test(n)&&(this.currentMailbox=t+n)}}mailboxDeleted(e){this.forgetListings(),(this.currentMailbox===e||Be(this.currentMailbox,e))&&(this.currentMailbox=O,this.currentPage=0,this.listed=!1)}sync({refresh:e=!1}={}){if(this.writing>0){this.syncAsked=!0,this.refreshAsked||=e;return}this.forgetListings(),this.fetch(this.currentMailbox,this.currentPage,this.currentQuery,e,!0,{probe:!e})}async afterWrites(e){this.writing++;try{return await e()}finally{if(this.writing--,this.writing===0&&this.syncAsked){let e=this.refreshAsked;this.syncAsked=!1,this.refreshAsked=!1,this.sync({refresh:e})}}}syncIfViewing(e){this.currentMailbox===e&&this.sync()}async syncLabels(){let e=++this.currentLabelsId;try{let t=await N(`/mailboxes`);if(this.currentLabelsId!==e)return;if(t.status===401){window.dispatchEvent(new CustomEvent(`auth-error`));return}if(!t.ok)throw Error(`HTTP ${t.status}`);let n=await t.json();if(this.currentLabelsId!==e||!n.Mailboxes)return;this.latestMailboxes=n.Mailboxes,this.dispatchEvent(new CustomEvent(`labels-success`,{detail:{mailboxes:n.Mailboxes}}))}catch(e){x.error(`Failed to refresh folder list`,e)}}async fetch(e,t,n=``,r=!1,i=!1,{probe:a=!1}={}){this.setContext(e,t,n),this.listed=!1;let o=++this.currentFetchId,s=r?void 0:this.keptListing(e,t,n);s&&(i=!0),this.dispatchEvent(new CustomEvent(`sync-start`,{detail:{background:!1,quiet:i}})),s&&(s.ListedMailbox=e,this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:s,background:!1,quiet:i,kept:!0}})));let c=Date.now(),l=async()=>{if(i)return;let e=Date.now()-c;e<200&&await new Promise(t=>setTimeout(t,200-e))},u=null;try{for(;this.listingOut;)if(await this.listingOut,this.currentFetchId!==o)return;if(a){let t=e=>N(`/mailboxes/${k(e)}/status`).catch(()=>{});if(e!==`INBOX`&&await t(O),this.currentFetchId!==o||(e!==`*`&&await t(e),this.currentFetchId!==o))return}let s=`/mailboxes/${k(e)}?page=${t}`;n&&(s+=`&query=${encodeURIComponent(n)}`),r&&(s+=`&refresh=true`);let c=N(s),d=c.then(()=>{},()=>{});this.listingOut=d,u=this.listingSent();let f;try{f=await c}finally{this.listingOut===d&&(this.listingOut=null)}if(this.currentFetchId!==o)return;if(f.status===401){window.dispatchEvent(new CustomEvent(`auth-error`));return}if(f.status===404){this.forgetListings(t=>t===e),this.dispatchEvent(new CustomEvent(`mailbox-not-found`));return}if(!f.ok)throw Error(`HTTP ${f.status}`);let p=await f.json();if(this.currentFetchId!==o||(await l(),this.currentFetchId!==o))return;this.listed=!0,p.ListedMailbox=e,this.hear(e,t,n,p);let m=this.replayChanges(p,u);f.ok&&!m&&this.keepListing(e,t,n,p),this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:p,background:!1,quiet:i}}))}catch(e){if(this.currentFetchId!==o||(x.error(`Failed to fetch mailbox data`,e),await l(),this.currentFetchId!==o))return;this.dispatchEvent(new CustomEvent(`sync-error`,{detail:{error:e,background:!1,quiet:i}}))}finally{u!==null&&this.listingDone()}}viewKey(e,t,n){return[e,t,n].join(`\0`)}hear(e,t,n,r){let i=Date.now();typeof r.Username==`string`&&r.Username!==this.username&&(this.username=r.Username,this.leading&&this.postPoll({type:`leader`}),this.tellView(),this.postPoll({type:`hello`})),this.heard={view:this.viewKey(e,t,n),inbox:jr(r.Inbox),mailbox:jr(r.Mailbox),read:i,at:i}}relistDue(e,t,n){let r=n?Math.max(this.pollMinutes,0)*60*1e3/2:0;return t-e>=Dr-r}async askCounts(e){let t=await N(`/mailboxes/${k(e)}/status`);if(!t.ok)return null;let n=await t.json().catch(()=>null);return typeof n?.total!=`number`||typeof n?.unseen!=`number`?null:Mr(n)}async check(e,t,n=``){if(!(this.listed&&t===0&&this.currentPage===0&&e===this.currentMailbox&&n===this.currentQuery))return this.fetch(e,t,n,!0);this.dispatchEvent(new CustomEvent(`sync-start`,{detail:{background:!0}})),!await this.backgroundSync({announce:this.announces})&&this.dispatchEvent(new CustomEvent(`sync-error`,{detail:{error:null,background:!0}}))}async backgroundSync({announce:e=!0,scheduled:t=!1,shared:n}={}){let r=++this.currentFetchId,i=this.pollGeneration,a=()=>this.currentFetchId!==r||t&&i!==this.pollGeneration,o=this.currentMailbox,s=this.currentPage,c=this.currentQuery,l=Date.now(),u=null;try{let r=n?.inbox??null;if(!n&&o!==`INBOX`&&(r=await this.askCounts(O).catch(()=>null)),a())return!0;let i=n?n.mailbox:o===`*`?null:await this.askCounts(o);if(a())return!0;let d=this.heard,f=d!==null&&this.listed&&d.view===this.viewKey(o,s,c)&&Nr(i,d.mailbox)&&(o===`INBOX`||Nr(r,d.inbox));if(d&&f&&!this.relistDue(d.read,l,t))return d.at=Date.now(),this.dispatchEvent(new CustomEvent(`sync-unchanged`,{detail:{background:!0}})),!0;let p=`/mailboxes/${k(o)}?page=${s}`;c&&(p+=`&query=${encodeURIComponent(c)}`),f&&(p+=`&refresh=true`),u=this.listingSent();let m=await N(p);if(a())return!0;if(m.status===401)return window.dispatchEvent(new CustomEvent(`auth-error`)),!0;if(m.status===404)return this.forgetListings(e=>e===o),this.dispatchEvent(new CustomEvent(`mailbox-not-found`)),!0;if(!m.ok)throw Error(`HTTP ${m.status}`);let h=await m.json();if(a())return!0;h.ListedMailbox=o,this.hear(o,s,c,h);let g=this.replayChanges(h,u);return m.ok&&!g&&this.keepListing(o,s,c,h),this.dispatchEvent(new CustomEvent(`sync-success`,{detail:{data:h,background:!0,announce:e&&this.announces}})),!0}catch(e){return a()?!0:(x.error(`Background sync failed`,e),!1)}finally{u!==null&&this.listingDone()}}};function Ar(){return globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}-${Math.random()}`}function jr(e){return typeof e?.NumMessages!=`number`||typeof e?.NumUnseen!=`number`?null:{total:e.NumMessages,unseen:e.NumUnseen,uidnext:e.UIDNext,uidvalidity:e.UIDValidity}}function Mr(e){return typeof e?.total!=`number`||typeof e?.unseen!=`number`?null:{total:e.total,unseen:e.unseen,uidnext:typeof e.uidnext==`number`?e.uidnext:void 0,uidvalidity:typeof e.uidvalidity==`number`?e.uidvalidity:void 0}}function Nr(e,t){return!!e&&!!t&&e.total===t.total&&e.unseen===t.unseen&&e.uidnext===t.uidnext&&e.uidvalidity===t.uidvalidity}function Pr(e,t,n,r){let i=e.ListedMailbox??``,a=e=>{if(!t.has(L(Cr(e,i),e?.UID)))return;let a=Array.isArray(e.Flags)?e.Flags:[];r===`add`&&!a.includes(n)&&(e.Flags=[...a,n]),r===`remove`&&(e.Flags=a.filter(e=>e!==n))};for(let t of e.Messages??[])a(t),(t?.SubMessages??[]).forEach(a)}function Fr(e,t){if(t.size===0||!e.Messages)return;let n=e.ListedMailbox??``,r=e=>L(Cr(e,n),e?.UID),i=0;e.Messages=e.Messages.flatMap(e=>{let n=e?.SubMessages??[],a=n.filter(e=>!t.has(r(e)));return t.has(r(e))&&a.length===0?(i++,[]):[a.length===n.length?e:{...e,SubMessages:a}]}),i>0&&typeof e.Total==`number`&&(e.Total=Math.max(0,e.Total-i))}var R=new kr,z=`\\Seen`,B=`\\Flagged`,Ir=`\\Answered`,Lr=`\\Deleted`,Rr=`\\Draft`,zr=`$Forwarded`,Br=`$MDNSent`,Vr=`Junk`,Hr=`NonJunk`,Ur=`NotJunk`,Wr=`$Junk`,Gr=`$NotJunk`,Kr=`$Phishing`,qr=`$SubmitPending`,Jr=`$Submitted`;function Yr(e,t){if(!e)return[];let n=new Set([z,B,Ir,Lr,Rr,zr,Br,Vr,Hr,Ur,Wr,Gr,Kr,qr,Jr].map(e=>e.toLowerCase())),r=[];for(let i of e)i.startsWith(`\\`)||n.has(i.toLowerCase())||r.push({id:i,name:Qr(i,t),color:$r(i)});return r.sort((e,t)=>{let n=e.id.toLowerCase().startsWith(`$label`),r=t.id.toLowerCase().startsWith(`$label`);return n&&!r?-1:!n&&r?1:e.id.localeCompare(t.id)})}var Xr=new Set([zr,Br,Kr,qr,Jr].map(e=>e.toLowerCase()));function Zr(e){return e?e.filter(e=>!e.startsWith(`\\`)&&!Xr.has(e.toLowerCase())):[]}function Qr(e,t){switch(e.toLowerCase()){case`$label1`:return t?.t(`tags.important`)||`Important`;case`$label2`:return t?.t(`tags.work`)||`Work`;case`$label3`:return t?.t(`tags.personal`)||`Personal`;case`$label4`:return t?.t(`tags.todo`)||`To Do`;case`$label5`:return t?.t(`tags.later`)||`Later`;default:return e}}function $r(e){switch(e.toLowerCase()){case`$label1`:return`#ef4444`;case`$label2`:return`#f97316`;case`$label3`:return`#22c55e`;case`$label4`:return`#3b82f6`;case`$label5`:return`#a855f7`;default:return ni(e)}}function ei(e){let t=ti(e);if(!t)return`#fff`;let[n,r,i]=t.map(e=>{let t=e/255;return t<=.03928?t/12.92:((t+.055)/1.055)**2.4});return(.2126*n+.7152*r+.0722*i+.05)**2>.05*1.05?`#000`:`#fff`}function ti(e){let t=/^#([0-9a-f]{6})$/i.exec(e.trim());if(t){let e=parseInt(t[1],16);return[e>>16&255,e>>8&255,e&255]}let n=/^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i.exec(e.trim());if(!n)return null;let[r,i,a]=[Number(n[1]),Number(n[2])/100,Number(n[3])/100],o=i*Math.min(a,1-a),s=e=>{let t=(e+r/30)%12;return 255*(a-o*Math.max(-1,Math.min(t-3,9-t,1)))};return[s(0),s(8),s(4)]}function ni(e){let t=0;for(let n=0;n<e.length;n++)t=e.charCodeAt(n)+((t<<5)-t);return`hsl(${Math.abs(t)%360}, 70%, 45%)`}function ri(e){let t=[];for(let n=0;n<e.length;n+=500)t.push(e.slice(n,n+500));return t}async function ii(e){try{return await e.json()??{}}catch{return{}}}var ai=class extends Error{constructor(e){super(`unable to retrieve message attachment ${e.join(`, `)}`),this.name=`MissingUploadsError`,this.uuids=e}};function oi(e,t){let n=t.missing_attachments;return e.status!==409||!Array.isArray(n)||n.length===0?null:new ai(n.map(String))}var V=new class{isAuthError(e){return e.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),!0):!1}async setFlag(e,t,n,r){if(!t||t.length===0)return{ok:!1,reason:`empty`};let i=0;try{for(let a of ri(t)){let t=await N(`/mailboxes/${k(e)}/messages/flag`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:a,flags:n,action:r})});if(this.isAuthError(t))return{ok:!1,reason:`auth`,applied:i};if(!t.ok){let e=await ii(t),n=e.error===`unsupported_flags`?`unsupported`:`failed`;return x.error(`Failed to set flag`,t.status,e),{ok:!1,reason:n,applied:i,rejected:e.rejected}}i+=a.length}return{ok:!0,applied:i}}catch(e){return x.error(`Failed to set flag`,e),{ok:!1,reason:`failed`,applied:i}}}matchingBody(e,t={}){return JSON.stringify({all:!0,query:e.query||``,except:e.except??[],...t})}countOf(e){return typeof e.count==`number`?e.count:0}async setFlagMatching(e,t,n,r){try{let i=await N(`/mailboxes/${k(e)}/messages/flag`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:this.matchingBody(t,{flags:n,action:r})});if(this.isAuthError(i))return{ok:!1,reason:`auth`};let a=await ii(i);if(!i.ok){let e=a.error===`unsupported_flags`?`unsupported`:`failed`;return x.error(`Failed to set a flag on a folder`,i.status,a),{ok:!1,reason:e,rejected:a.rejected}}return R.sync(),{ok:!0,applied:this.countOf(a)}}catch(e){return x.error(`Failed to set a flag on a folder`,e),{ok:!1,reason:`failed`}}}async moveMatching(e,t,n){return this.fileMatching(`move`,e,t,n)}async copyMatching(e,t,n){return this.fileMatching(`copy`,e,t,n)}async fileMatching(e,t,n,r){try{let i=await N(`/mailboxes/${k(t)}/messages/${e}`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:this.matchingBody(n,{to:r})});if(this.isAuthError(i))return{success:!1,reason:`auth`};let a=await ii(i);return i.ok?(R.sync(),{success:!0,uidMapping:a.uidMapping??{},count:this.countOf(a)}):(x.error(`Failed to ${e} a folder's messages`,i.status,a),{success:!1,reason:`failed`})}catch(t){return x.error(`Failed to ${e} a folder's messages`,t),{success:!1,reason:`failed`}}}async deleteMatchingResult(e,t){try{let n=await N(`/mailboxes/${k(e)}/messages`,{method:`DELETE`,headers:{"Content-Type":`application/json`},body:this.matchingBody(t)});if(this.isAuthError(n))return{ok:!1,reason:`auth`};let r=await ii(n);return n.ok?(R.sync(),{ok:!0,count:this.countOf(r)}):(x.error(`Failed to delete a folder's messages`,n.status,r),{ok:!1,reason:`failed`})}catch(e){return x.error(`Failed to delete a folder's messages`,e),{ok:!1,reason:`failed`}}}async markAsRead(e,t){let n=t?.UID;if(!n||t.Flags?.includes(`\\Seen`))return t;let{ok:r}=await this.setFlag(e,[String(n)],[z],`add`);if(r){let e={...t};return e.Flags=[...e.Flags||[],z],e}return t}async deleteMessagesResult(e,t){if(!t||t.length===0)return{ok:!1,reason:`empty`};let n=0;try{for(let r of ri(t)){let t=await N(`/mailboxes/${k(e)}/messages`,{method:`DELETE`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:r})});if(this.isAuthError(t))return{ok:!1,reason:`auth`};if(!t.ok)return x.error(`Failed to delete messages`,t.status,await ii(t)),n>0&&R.sync({refresh:!0}),{ok:!1,reason:`failed`};n+=r.length}return R.sync(),{ok:!0}}catch(e){return x.error(`Failed to delete messages`,e),n>0&&R.sync({refresh:!0}),{ok:!1,reason:`failed`}}}async deleteMessages(e,t){return(await this.deleteMessagesResult(e,t)).ok}async moveMessages(e,t,n){if(!t||t.length===0)return{success:!1,reason:`empty`};let r=0,i={};try{for(let a of ri(t)){let t=await N(`/mailboxes/${k(e)}/messages/move`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:a,to:n})});if(this.isAuthError(t))return{success:!1,reason:`auth`};if(!t.ok)return x.error(`Failed to move messages`,t.status,await ii(t)),r>0&&R.sync({refresh:!0}),{success:!1,reason:`failed`};let o=await ii(t);Object.assign(i,o.uidMapping??{}),r+=a.length}return R.sync(),{success:!0,uidMapping:i}}catch(e){return x.error(`Failed to move messages`,e),r>0&&R.sync({refresh:!0}),{success:!1,reason:`failed`}}}async copyMessages(e,t,n){if(!t||t.length===0)return{success:!1,reason:`empty`};let r=0;try{for(let i of ri(t)){let t=await N(`/mailboxes/${k(e)}/messages/copy`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({uids:i,to:n})});if(this.isAuthError(t))return{success:!1,reason:`auth`};if(!t.ok)return x.error(`Failed to copy messages`,t.status,await ii(t)),r>0&&R.sync({refresh:!0}),{success:!1,reason:`failed`};r+=i.length}return R.sync(),{success:!0}}catch(e){return x.error(`Failed to copy messages`,e),r>0&&R.sync({refresh:!0}),{success:!1,reason:`failed`}}}async markMessagesAsRead(e,t){if(!t||t.length===0)return!1;let{ok:n}=await this.setFlag(e,t,[z],`add`);return n}async markMessagesAsUnread(e,t){if(!t||t.length===0)return!1;let{ok:n}=await this.setFlag(e,t,[z],`remove`);return n}async saveDraft(e){try{let t=await N(`/messages`,{method:`POST`,body:e});if(t.status===401)return window.dispatchEvent(new CustomEvent(`auth-error`)),null;if(t.ok){let e=await t.json();return{uid:e.draft_uid,mailbox:e.draft_mailbox,size:e.draft_size,attachments:e.attachments,...Array.isArray(e.draft_bcc)?{bcc:e.draft_bcc.map(e=>wn(e.Name,e.Address))}:{}}}let n=await ii(t),r=oi(t,n);if(r)throw r;return x.error(`Failed to save draft:`,t.status,n),null}catch(e){if(e instanceof ai)throw e;return x.error(`Failed to save draft:`,e),null}}async sendDraft(e){try{let t=await N(`/messages`,{method:`POST`,body:e});if(t.status===401)return window.dispatchEvent(new CustomEvent(`auth-error`)),!1;if(t.ok)return R.sync(),!0;let n=await ii(t);throw oi(t,n)||Error(n.error||`Failed to send message (${t.status})`)}catch(e){throw x.error(`Failed to send message:`,e),e}}},si=t(b(),1),ci=new Set([`:`,`;`,`,`,`(`,`)`,`[`,`]`,`{`,`}`]),li=e=>e===`
`||e===`\r`||e===`\f`,ui=e=>e===` `||e===`	`||li(e),di=e=>e>=`0`&&e<=`9`,fi=e=>di(e)||e>=`a`&&e<=`f`||e>=`A`&&e<=`F`,pi=e=>e>=`a`&&e<=`z`||e>=`A`&&e<=`Z`||e===`_`||e===`\0`||e.charCodeAt(0)>=128,mi=e=>pi(e)||di(e)||e===`-`,hi=e=>{let t=e.charCodeAt(0);return t>=1&&t<=8||t===11||t>=14&&t<=31||t===127},gi=e=>e===`\0`?`�`:e,_i=e=>e.replace(/[A-Z]/g,e=>e.toLowerCase()),vi=e=>_i(e).replace(/^-[a-z]+-(?=.)/,``);function yi(e){let t=[],n=0,r=t=>e[t]??``,i=e=>r(e)===`\\`&&!li(r(e+1)),a=e=>r(e)===`-`?pi(r(e+1))||r(e+1)===`-`||i(e+1):pi(r(e))||i(e),o=e=>{let t=r(e);return(t===`+`||t===`-`)&&(t=r(++e)),di(t)||t===`.`&&di(r(e+1))},s=()=>{n++;let t=r(n);if(t===``)return`�`;if(!fi(t))return n++,gi(t);let i=``;for(;i.length<6&&fi(r(n));)i+=e[n++];r(n)===`\r`&&r(n+1)===`
`?n+=2:ui(r(n))&&n++;let a=parseInt(i,16);return a===0||a>=55296&&a<=57343||a>1114111?`�`:String.fromCodePoint(a)},c=()=>{let t=``;for(;;)if(mi(r(n)))t+=gi(e[n++]);else if(i(n))t+=s();else return t},l=e=>{let t=``;for(n++;;){let i=r(n);if(i===``)return[`string`,t];if(i===e)return n++,[`string`,t];if(li(i))return[`bad-string`,t];if(i!==`\\`){t+=gi(i),n++;continue}let a=r(n+1);a===``?n++:li(a)?n+=a===`\r`&&r(n+2)===`
`?3:2:t+=s()}},u=()=>{for(;;){let e=r(n);if(e===``)break;if(e===`)`){n++;break}i(n)?s():n++}return[`bad-url`,``]},d=()=>{let e=``;for(;ui(r(n));)n++;for(;;){let t=r(n);if(t===``)return[`url`,e];if(t===`)`)return n++,[`url`,e];if(ui(t)){for(;ui(r(n));)n++;return r(n)===``?[`url`,e]:r(n)===`)`?(n++,[`url`,e]):u()}if(t===`"`||t===`'`||t===`(`||hi(t))return u();if(t===`\\`){if(!i(n))return u();e+=s();continue}e+=gi(t),n++}},f=()=>{let e=c();if(r(n)!==`(`)return[`ident`,e];if(n++,_i(e)!==`url`)return[`function`,e];for(;ui(r(n))&&ui(r(n+1));)n++;let t=ui(r(n))?r(n+1):r(n);return t===`"`||t===`'`?[`function`,e]:d()},p=()=>{let t=n;for((r(n)===`+`||r(n)===`-`)&&n++;di(r(n));)n++;if(r(n)===`.`&&di(r(n+1)))for(n++;di(r(n));)n++;if((r(n)===`e`||r(n)===`E`)&&(di(r(n+1))||(r(n+1)===`+`||r(n+1)===`-`)&&di(r(n+2))))for(n+=di(r(n+1))?1:2;di(r(n));)n++;let i=e.slice(t,n);return a(n)?i+c():r(n)===`%`?(n++,`${i}%`):i};for(;n<e.length;){if(r(n)===`/`&&r(n+1)===`*`){let t=e.indexOf(`*/`,n+2);n=t===-1?e.length:t+2;continue}let s=n,u=e[n],d,m=u;if(ui(u)){for(;ui(r(n));)n++;d=`whitespace`,m=` `}else u===`"`||u===`'`?[d,m]=l(u):u===`#`&&(mi(r(n+1))||i(n+1))?(n++,d=`hash`,m=c()):o(n)?(d=`number`,m=p()):e.startsWith(`<!--`,n)?(n+=4,d=`cdo`,m=`<!--`):e.startsWith(`-->`,n)?(n+=3,d=`cdc`,m=`-->`):a(n)?[d,m]=f():u===`@`&&a(n+1)?(n++,d=`at-keyword`,m=c()):(n++,d=ci.has(u)?u:`delim`);t.push({type:d,value:m,start:s,end:n})}return t}function bi(e){return e.type===`function`||e.type===`(`?`)`:e.type===`[`?`]`:e.type===`{`?`}`:null}function xi(e){let t=[],n=[],r=0;for(let i of yi(e)){let e=bi(i);e?n.push(e):i.type===n[n.length-1]?n.pop():i.type===`;`&&n.length===0&&(t.push([r,i.start]),r=i.end)}return t.push([r,e.length]),t}var Si=e=>e.replace(/^[ \t\n\r\f]+|[ \t\n\r\f]+$/g,``);function Ci(e,t){let n=[],r=!1;for(let[i,a]of xi(e)){let o=e.slice(i,a);t(o)?r=!0:Si(o)&&n.push(o)}return r?Si(n.join(`;`)):e}var wi=new Set([`image`,`image-set`]);function Ti(e){let t=yi(e).filter(e=>e.type!==`whitespace`),n=[];for(let e=0;e<t.length;e++){let r=t[e],i=t[e+1];if(r.type===`url`)n.push(r.value);else if(r.type===`function`){let a=vi(r.value);if((a===`url`||a===`src`)&&i?.type===`string`)n.push(i.value);else if(wi.has(a)){let r=[`)`];for(let i=e+1;i<t.length&&r.length>0;i++){let e=t[i],a=bi(e);a?r.push(a):e.type===r[r.length-1]?r.pop():e.type===`string`&&r.length===1&&n.push(e.value)}}}else if(r.type===`at-keyword`){let a=_i(r.value);if(a===`import`&&i?.type===`string`)n.push(i.value);else if(a===`namespace`)for(;e+1<t.length&&t[e+1].type!==`;`;)e++}}return n}var Ei=/(?:url|src|image|image-set|cross-fade|element|expression)\s*\(|@import|(?:^|[^\w-])(?:-ms-)?behavior\s*:/i;function Di(e,t){let n=e[t];if(n.type===`url`)return n.value.startsWith(`#`)?t:-1;if(n.type!==`function`||_i(n.value)!==`url`)return-1;let r=t+1;for(;e[r]?.type===`whitespace`;)r++;if(e[r]?.type!==`string`||!e[r].value.startsWith(`#`))return-1;for(r++;e[r]?.type===`whitespace`;)r++;return e[r]?.type===`)`?r:-1}function Oi(e){let t=yi(e),n=``;for(let e=0;e<t.length;e++){let r=Di(t,e);if(r!==-1){n+=` `,e=r;continue}let i=t[e];switch(i.type){case`function`:n+=`${i.value}(`;break;case`at-keyword`:n+=`@${i.value}`;break;case`hash`:n+=`#${i.value}`;break;case`url`:case`bad-url`:n+=`url()`;break;case`string`:case`bad-string`:n+=`""`;break;default:n+=i.value}}return Ei.test(n)}var ki=`data-alps-auto-direction`,Ai=`
  :where(:is(body, div, blockquote, li, ul, ol)[data-alps-auto-direction="rtl"]) { direction: rtl; }
  :where(:is(body, div, blockquote, li, ul, ol)[data-alps-auto-direction="ltr"]) { direction: ltr; }
`;function ji(e){let t=e?.trim().toLowerCase();return t===`ltr`||t===`rtl`||t===`auto`?t:null}function Mi(e){let t=e.getAttribute(ki);return t===`ltr`||t===`rtl`?t:null}function Ni(e){let t=Mi(e);return t!==null&&e.style?.direction.trim().toLowerCase()===t&&e.style?.getPropertyPriority(`direction`)===``}function Pi(e){let t=e.getAttribute(`style`);if(!t||!Ni(e))return t;let n=e.ownerDocument.createElement(`span`);return n.style.cssText=t,n.style.removeProperty(`direction`),n.getAttribute(`style`)?.trim()||null}function Fi(e){if(!e)return null;let t=e.style?.direction;return t&&!Ni(e)?ji(t):ji(e.getAttribute(`dir`))}function Ii(e){let t=new Map,n=new Map,r=document.createElement(`span`);r.dir=`auto`;let i=!0;try{r.matches(`:dir(rtl)`)}catch{i=!1,r.hidden=!0}let a=()=>i?r.matches(`:dir(rtl)`)?`rtl`:`ltr`:getComputedStyle(r).direction===`rtl`?`rtl`:`ltr`,o=e=>{if(n.has(e))return n.get(e);i||document.documentElement.appendChild(r);try{r.textContent=e+`‎`;let t=a();r.textContent=e+`‏`;let i=t===a()?t:null;return n.set(e,i),i}finally{r.remove()}},s=n=>{if(t.has(n))return t.get(n);let r=e(n),i=r.direction===`ltr`||r.direction===`rtl`?r.direction:r.text===void 0?null:o(r.text);if(i===null){for(let e of r.children??[])if(i=s(e),i!==null)break}return t.set(n,i),i};return s}var Li=new Set([`BODY`,`DIV`,`BLOCKQUOTE`,`LI`,`UL`,`OL`]),Ri=new Set([`SCRIPT`,`STYLE`,`TEMPLATE`,`NOSCRIPT`,`BDI`,`BDO`]),zi=new Set([`A`,`ABBR`,`B`,`CITE`,`CODE`,`DATA`,`DEL`,`DFN`,`EM`,`FONT`,`I`,`INS`,`KBD`,`MARK`,`Q`,`S`,`SAMP`,`SMALL`,`SPAN`,`STRONG`,`SUB`,`SUP`,`TIME`,`U`,`VAR`]);function Bi(){return Ii(e=>{if(e.nodeType===3)return{text:e.nodeValue??``};if(e.nodeType!==1)return{children:e.childNodes};let t=e;return Ri.has(t.tagName)||t.hidden||t.classList.contains(`gmail_attr`)?{}:zi.has(t.tagName)?ji(t.getAttribute(`dir`))===null?{children:t.childNodes}:{}:{direction:Fi(t),children:t.childNodes}})}function Vi(e,t=!1){let n=[...e.nodeType===1?[e]:[],...e.querySelectorAll(`*`)];for(let e of n)Ni(e)&&e.style.removeProperty(`direction`),e.removeAttribute(ki);let r=Bi();for(let e of n){if(!Li.has(e.tagName)||Fi(e)!==`auto`||e.style?.direction)continue;let n=r(e);n&&(e.setAttribute(ki,n),t&&(e.style.direction=n))}}var Hi=`data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`;function Ui(e){return e.replace(/^[\x00-\x20]+|[\x00-\x20]+$/g,``).replace(/[\t\n\r]/g,``)}function Wi(e){let t=Ui(e).toLowerCase();return t.startsWith(`http:`)||t.startsWith(`https:`)||/^[\\/]{2}/.test(t)}function Gi(e){return e.toLowerCase().replace(/[^\x21-\x7e]/g,``)}function Ki(e){return Gi(e).startsWith(`cid:`)}function qi(e){return e.replace(/[^\x21-\x7e]/g,``).substring(4)}function Ji(e){let t=new Set;if(!e)return t;let n=new DOMParser().parseFromString(e,`text/html`),r={img:[`src`,`srcset`],source:[`src`,`srcset`],audio:[`src`],video:[`src`,`poster`],track:[`src`],a:[`href`],area:[`href`],body:[`background`],table:[`background`],thead:[`background`],tbody:[`background`],tfoot:[`background`],tr:[`background`],td:[`background`],th:[`background`]};for(let e of Array.from(n.querySelectorAll(`*`))){let n=e.localName.toLowerCase(),i=new Set(r[n]??[]);e.namespaceURI===`http://www.w3.org/2000/svg`&&[`a`,`image`,`use`,`feimage`].includes(n)&&(i.add(`href`),i.add(`xlink:href`)),n===`input`&&e.getAttribute(`type`)?.toLowerCase()===`image`&&i.add(`src`);for(let n of i){let r=e.getAttribute(n);if(r===null)continue;let i=n===`srcset`?ia(r).map(e=>e.url):[r];for(let e of i)Ki(e)&&t.add(qi(e).replace(/^<|>$/g,``))}}return t}var Yi=()=>/url\(\s*(['"]?)((?:https?:)?\/\/[^'"\)]+)\1\s*\)/gi,Xi=()=>/@import\s+(?:url\(\s*)?(['"]?)((?:https?:)?\/\/[^'"\)]+)\1\s*\)?\s*;?/gi;function Zi(e){return Ti(e).some(e=>Wi(Gi(e)))}function Qi(e){let t;try{t=new URL(e,document.baseURI).href}catch{t=Ui(e)}return`/proxy?url=${encodeURIComponent(t)}`}var $i=new Set([`animate`,`animatecolor`,`animatemotion`,`animatetransform`,`discard`,`set`]);function ea(e){for(let t of Array.from(e.querySelectorAll(`*`)))$i.has(t.localName.toLowerCase())&&t.remove()}var ta=new Set([`fill`,`stroke`,`filter`,`mask`,`clip-path`,`marker-start`,`marker-mid`,`marker-end`,`cursor`]);function na(e,t,n){let r=n(e.replace(Yi(),(e,n,r)=>{if(!t.allowRemoteResources)return`url(${Hi})`;let i=n||`"`;return`url(${i}${Qi(r)}${i})`}));return r===e?null:(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),r)}function ra(e,t){return Wi(e)?(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?Qi(e):Hi):null}function ia(e){let t=[],n=e=>e===` `||e===`	`||e===`
`||e===`\r`||e===`\f`,r=0;for(;r<e.length;){for(;r<e.length&&(n(e[r])||e[r]===`,`);)r++;if(r>=e.length)break;let i=r;for(;r<e.length&&!n(e[r]);)r++;let a=e.slice(i,r),o=``;if(a.endsWith(`,`))a=a.replace(/,+$/,``);else{let t=r,n=!1;for(;r<e.length;){let t=e[r];if(t===`(`)n=!0;else if(t===`)`)n=!1;else if(t===`,`&&!n)break;r++}let i=e.slice(t,r).trim();i&&(o=` ${i}`),r++}a&&t.push({url:a,descriptor:o})}return t}function aa(e,t){let n=ia(e);if(n.length===0)return null;let r=!1,i=n.map(({url:e,descriptor:n})=>Wi(e)?(r=!0,t.allowRemoteResources?`${Qi(e)}${n}`:Hi):`${e}${n}`);return r?(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?i.join(`, `):Hi):null}function oa(e,t,n=``){if(!e)return null;let r=t.replace(/^<|>$/g,``);if(e.ID&&e.ID.replace(/^<|>$/g,``)===r)return n||`1`;if(e.Children&&Array.isArray(e.Children))for(let r=0;r<e.Children.length;r++){let i=n?`${n}.${r+1}`:`${r+1}`,a=oa(e.Children[r],t,i);if(a)return a}return null}function sa(e,t){if(!e.includes(`\\`)&&!/prefers-color-scheme/i.test(e))return e;let n=yi(e).filter(e=>e.type!==`whitespace`),r=``,i=0;for(let a=0;a+3<n.length;a++){if(n[a].type!==`(`)continue;let[o,s,c]=[n[a+1],n[a+2],n[a+3]],l=n[a+4],u=_i(c.value);o.type!==`ident`||_i(o.value)!==`prefers-color-scheme`||s.type!==`:`||c.type!==`ident`||u!==`light`&&u!==`dark`||l&&l.type!==`)`||(r+=e.slice(i,n[a].start)+(u===t?`(width >= 0)`:`(width < 0)`),i=l?l.end:c.end,a+=4)}return r+e.slice(i)}function ca(e){let t=yi(e).find(e=>e.type!==`whitespace`);return t?.type===`ident`&&_i(t.value)===`color-scheme`}function la(e){let t=yi(e),n=``,r=0;for(let i=0;i<t.length;i++){if(t[i].type!==`ident`||_i(t[i].value)!==`color-scheme`)continue;let a=i+1;for(;t[a]?.type===`whitespace`;)a++;if(t[a]?.type!==`:`)continue;let o=0;for(a++;a<t.length;a++){let e=t[a].type;if(e===`(`||e===`[`||e===`{`||e===`function`)o++;else if(o>0&&(e===`)`||e===`]`||e===`}`))o--;else if(o===0&&(e===`;`||e===`}`))break}n+=e.slice(r,t[i].start),r=t[a]?.type===`;`?t[a].end:t[a]?.start??e.length,i=a-1}return n+e.slice(r)}var ua={light:`data-alps-css-light`,dark:`data-alps-css-dark`},da={light:`data-alps-media-light`,dark:`data-alps-media-dark`},fa=[...Object.values(ua),...Object.values(da)];function pa(e,t){e.documentElement.style.setProperty(`color-scheme`,t,`important`),e.querySelectorAll(`style[${ua[t]}]`).forEach(e=>{let n=e.getAttribute(ua[t])??``;e.textContent!==n&&(e.textContent=n)}),e.querySelectorAll(`[${da[t]}]`).forEach(e=>{let n=e.getAttribute(da[t]);n?e.setAttribute(`media`,n):e.removeAttribute(`media`)})}function ma(e,t){if(!e)return e;let n=e=>Zi(e)?(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),``):e;try{let r=si.parse(e,{silent:!0});if(r&&r.stylesheet&&r.stylesheet.rules){let e=Yi(),i=n=>n.replace(e,(e,n,r)=>{if(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources){let e=n||`"`;return`url(${e}${Qi(r)}${e})`}else return`url(${Hi})`}),a=n=>{for(let r=n.length-1;r>=0;r--){let o=n[r];if([`rule`,`font-face`,`page`,`keyframe`].includes(o.type)&&!o.declarations&&(o.declarations=[]),[`rule`,`page`].includes(o.type)&&!o.selectors&&(o.selectors=[]),o.type===`keyframe`&&!o.values&&(o.values=[]),o.type===`import`){Zi(`@import ${o.import??``};`)&&t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),n.splice(r,1);continue}else if(o.type===`font-face`){let e=o;if(e.declarations){let i=!1;for(let n of e.declarations)n.type===`declaration`&&Zi(n.value??``)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),i=!0);if(i&&!t.allowRemoteResources){n.splice(r,1);continue}}}if(o.declarations)for(let n=o.declarations.length-1;n>=0;n--){let r=o.declarations[n];if(!(r.type!==`declaration`||!r.value)){if(ca(r.property??``)){o.declarations.splice(n,1);continue}r.value.match(e)&&(r.value=i(r.value)),Zi(r.value)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),o.declarations.splice(n,1))}}o.rules&&a(o.rules),o.keyframes&&a(o.keyframes)}};return a(r.stylesheet.rules),n(si.stringify(r))}}catch(e){console.warn(`AST CSS parsing failed, falling back to regex sanitizer`,e)}let r=la(e),i=Xi(),a=Yi();return(r.match(i)||r.match(a))&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),r=r.replace(i,``),t.allowRemoteResources?r=r.replace(a,(e,t,n)=>`url(${t}${Qi(n)}${t})`):(r=r.replace(/@font-face\s*\{[^{}]*\}/gi,e=>/url\(\s*['"]?(?:https?:)?\/\//i.test(e)?``:e),r=r.replace(a,`url(${Hi})`))),n(r)}function ha(e){let t=t=>{try{return e.documentElement.matches(t)||e.body.matches(t)}catch{return!1}},n=e=>e.some(e=>e.type===`rule`&&e.selectors?.some(t)&&e.declarations?.some(e=>e.property?.toLowerCase()===`direction`)||Array.isArray(e.rules)&&n(e.rules));return[...e.querySelectorAll(`style`)].some(e=>{if(!/\bdirection\s*:/i.test(e.textContent??``))return!1;try{return n(si.parse(e.textContent??``,{silent:!0}).stylesheet?.rules??[])}catch{return!1}})}function ga(e,t){let n=new DOMParser().parseFromString(e,`text/html`);n.documentElement.hasAttribute(`dir`)||n.body.hasAttribute(`dir`)||n.documentElement.style.direction||n.body.style.direction||ha(n)||(n.body.dir=`auto`),n.querySelectorAll(`iframe, object, embed, frame, frameset, applet, meta[http-equiv]`).forEach(e=>e.remove()),ea(n),n.querySelectorAll(`link`).forEach(e=>{(e.getAttribute(`rel`)||``).toLowerCase()!==`stylesheet`&&e.remove()});let r=n.createElement(`base`);r.target=`_blank`,n.head.prepend(r);let i=`/mailboxes/${k(t.mailbox)}/messages/${t.messageUid}/raw`,a=n.createElement(`meta`);a.httpEquiv=`Content-Security-Policy`;let o=[...t.messageUid?[new URL(i,window.location.origin).href]:[],...t.allowRemoteResources?[`${window.location.origin}/proxy`]:[],`data:`,`blob:`,`cid:`].join(` `);a.content=`default-src 'none'; img-src ${o}; media-src ${o}; style-src 'unsafe-inline'; font-src ${o}; script-src 'none'; object-src 'none'; frame-src 'none'; child-src 'none'; form-action 'none'; base-uri 'none';`,n.head.prepend(a);let s=n.createElement(`style`);s.textContent=`
    body { margin: 0; padding: 24px; box-sizing: border-box; font: 14px -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; overflow-x: auto; word-wrap: break-word; background-color: #ffffff; color: #000000; }
    @media (max-width: 768px) { body { padding: 16px !important; } }
    html:not(.x), body:not(.x) { height: auto !important; }
    p:first-child { margin-top: 0; }
    p:last-child { margin-bottom: 0; }
    a[href] { color: #3781b8; text-decoration: none; }
    a[href]:hover { text-decoration: underline; }
    blockquote[type='cite'] { margin: 0; margin-inline-start: 0.8ex; border-inline-start: 1px #ccc solid; padding-inline-start: 1ex; }
    ${Ai}
    img { max-width: 100%; height: auto; }
  `,n.head.prepend(s);let c=e=>{let n=t.messageStructure?oa(t.messageStructure,qi(e)):null;return n?`${i}?part=${n}`:null};n.querySelectorAll(`img`).forEach(e=>{let n=e.getAttribute(`src`);if(n)if(Ki(n)){let t=c(n);t&&(e.src=t)}else Wi(n)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),t.allowRemoteResources?e.src=Qi(n):(e.setAttribute(`data-original-src`,n),e.src=Hi,e.style.height=`0`,e.style.width=`0`))});for(let e of Array.from(n.querySelectorAll(`img[srcset], source[srcset], video[poster], source[src]`)))for(let n of[`srcset`,`poster`,`src`]){let r=e.getAttribute(n);if(!r||n===`src`&&e.tagName.toLowerCase()===`img`)continue;let i=n===`srcset`?aa(r,t):ra(r,t);i!==null&&e.setAttribute(n,i)}n.querySelectorAll(`[background]`).forEach(e=>{let n=e.getAttribute(`background`)??``,r=Ki(n)?c(n):ra(n,t);r!==null&&e.setAttribute(`background`,r)}),n.querySelectorAll(`link[rel="stylesheet"]`).forEach(e=>{let n=e.getAttribute(`href`);n&&Wi(n)&&(t.onRemoteResourceBlocked&&t.onRemoteResourceBlocked(),e.remove())}),n.querySelectorAll(`a[href]`).forEach(e=>{e.setAttribute(`rel`,`noopener noreferrer`)}),n.querySelectorAll(fa.map(e=>`[${e}]`).join(`, `)).forEach(e=>{for(let t of fa)e.removeAttribute(t)}),n.querySelectorAll(`[media]`).forEach(e=>{let t=e.getAttribute(`media`)??``,n=sa(t,`light`);n!==t&&(e.setAttribute(da.light,n),e.setAttribute(da.dark,sa(t,`dark`)))}),n.querySelectorAll(`style`).forEach(e=>{let n=e.textContent;if(!n)return;let r=sa(n,`light`);if(r===n){e.textContent=ma(n,t);return}let i=ma(r,t);e.setAttribute(ua.light,i),e.setAttribute(ua.dark,ma(sa(n,`dark`),t)),e.textContent=i}),n.querySelectorAll(`[style]`).forEach(e=>{let t=e.getAttribute(`style`)??``,n=Ci(t,ca);n!==t&&(n?e.setAttribute(`style`,n):e.removeAttribute(`style`))}),n.querySelectorAll(`[style]`).forEach(e=>{let n=na(e.getAttribute(`style`)??``,t,e=>Ci(e,Zi));n!==null&&(n?e.setAttribute(`style`,n):e.removeAttribute(`style`))});let l=[...ta];return n.querySelectorAll(l.map(e=>`[${e}]`).join(`, `)).forEach(e=>{for(let n of l){let r=e.getAttribute(n);if(!r)continue;let i=na(r,t,e=>Zi(e)?``:e);i!==null&&(i?e.setAttribute(n,i):e.removeAttribute(n))}}),pa(n,`light`),Vi(n),n.documentElement.outerHTML}function _a(e){let t=Gi(e);return t.startsWith(`javascript:`)||t.startsWith(`vbscript:`)||t.startsWith(`data:text/html`)}var va=new Set([`href`,`src`,`action`,`formaction`,`xlink:href`,`poster`]);function ya(e){return Ci(e,Oi)}function ba(e){if(!e)return``;let t=new DOMParser().parseFromString(e,`text/html`);t.querySelectorAll(`script, style, link, iframe, object, embed, frame, frameset, applet, form, meta, base, template`).forEach(e=>e.remove()),ea(t),t.querySelectorAll(`noscript, noembed, noframes`).forEach(e=>e.remove());for(let e of Array.from(t.querySelectorAll(`xmp, plaintext`))){let n=t.createElement(`pre`);n.textContent=e.textContent,e.replaceWith(n)}for(let e of Array.from(t.querySelectorAll(`*`))){for(let t of Array.from(e.attributes)){let n=t.name.toLowerCase();if(n.startsWith(`on`)){e.removeAttribute(t.name);continue}if(n===`srcset`?ia(t.value).some(e=>_a(e.url)):va.has(n)&&_a(t.value)){e.removeAttribute(t.name);continue}if(ta.has(n)&&Oi(t.value)){e.removeAttribute(t.name);continue}n===`background`&&Wi(t.value)&&e.removeAttribute(t.name)}let t=e.getAttribute(`style`),n=t&&ya(t);n!==t&&(n?e.setAttribute(`style`,n):e.removeAttribute(`style`))}if(!t.body)return``;let n=Fi(t.body)??Fi(t.documentElement);if(n){let e=t.createElement(`div`);e.dir=n;let r=t.body.getAttribute(`lang`)??t.documentElement.getAttribute(`lang`);return r&&(e.lang=r),e.innerHTML=t.body.innerHTML,e.outerHTML}return t.body.innerHTML}function xa(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}var Sa=`Attachments exceed the maximum allowed size.`,Ca=new Map;function wa(){return globalThis.crypto?.randomUUID?.()??`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}function Ta(e){let t=Ca.get(e);t&&(t.abort(),Ca.delete(e))}function Ea(e){for(let t of e)t.uploading&&t._tempId&&Ta(t._tempId)}async function Da(e){try{await fetch(`/attachments/${e}`,{method:`DELETE`})}catch(e){x.error(`Failed to delete attachment from server:`,e)}}function Oa(e,t,n,r,i,a,o,s){let c=document.createElement(`input`);c.type=`file`,c.multiple=!0,c.onchange=c=>{let l=Array.from(c.target.files||[]);l.length!==0&&ka(l,e,t,n,r,i,a,o,s)},c.click()}function ka(e,t,n,r,i,a,o,s,c){let l=0;for(let t of e)l+=t.size;if(n>0&&r+l>n){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:c||Sa,duration:5e3}}));return}for(let n of e){let e=wa();i(e,n);let r=new FormData;r.append(`attachments`,n);let c=new XMLHttpRequest;Ca.set(e,c),c.open(`POST`,`/attachments?composer_id=${encodeURIComponent(t)}`,!0),c.upload.onprogress=t=>{t.lengthComputable&&a(e,Math.round(t.loaded/t.total*100))},c.onload=()=>{if(Ca.delete(e),c.status>=200&&c.status<300)try{let t=JSON.parse(c.responseText),n=Array.isArray(t)?t:t.uuids||[];n.length>0?o(e,n):s(e,Error(`No UUID returned from server`))}catch(t){s(e,t)}else try{let t=JSON.parse(c.responseText);s(e,Error(t.error||`Unknown error`))}catch{s(e,Error(`Upload failed with status `+c.status))}},c.onerror=()=>{Ca.delete(e),s(e,Error(`Network error during upload`))},c.onabort=()=>{Ca.delete(e)},c.send(r)}}function Aa(e){let t=e-2*Math.floor(e/78);return t%4!=0&&(t=Math.max(0,e-2*Math.ceil(e/78))),Math.floor(t*3/4)}function ja(e,t){let n=Ji(t),r=[],i=(e,t)=>{if(!e)return;let a=String(e.Extended?.Disposition?.Value??``).toLowerCase()===`inline`;if(e.ID&&(a||n.has(String(e.ID).replace(/^<|>$/g,``)))){let n=Number(e.Size)||0;r.push({name:e.Extended?.Disposition?.Params?.filename||e.Params?.name||`image`,size:String(e.Encoding).toLowerCase()===`base64`?Aa(n):n,type:e.Type&&e.Subtype?`${e.Type}/${e.Subtype}`.toLowerCase():`application/octet-stream`,partPath:t||`1`,inline:!0})}Array.isArray(e.Children)&&e.Children.forEach((e,n)=>i(e,t?`${t}.${n+1}`:`${n+1}`))};return i(e,``),r}function Ma(e,t){let n={},r=e?.Envelope?.MessageID||e?.Envelope?.MessageId;return r&&(n.inReplyTo=r,n.references=Array.isArray(e.References)?[...e.References]:[]),e?.UID!==void 0&&e?.UID!==null&&t&&(n.replyMailbox=t,n.replyUid=String(e.UID)),n}function Na(e,t){t.inReplyTo&&e.append(`in_reply_to`,t.inReplyTo),t.references?.length&&e.append(`references`,t.references.join(` `)),t.replyMailbox&&t.replyUid&&(e.append(`reply_mailbox`,t.replyMailbox),e.append(`reply_uid`,t.replyUid)),t.quoteSource?.mailbox&&t.quoteSource.uid&&(e.append(`source_mailbox`,t.quoteSource.mailbox),e.append(`source_uid`,t.quoteSource.uid))}var Pa=class extends Error{constructor(e){super(`Drafts could not be saved before signing out`),this.name=`DraftFlushError`,this.keep=e}keepRecoveryCopy(){this.keep?.()}},Fa=e=>`alps_compose_drafts_${e}`,Ia=`alps_compose_drafts`,La=e=>{let t=e.trim();if(t.endsWith(`>`)){let e=t.lastIndexOf(`<`);e!==-1&&(t=t.substring(e+1,t.length-1))}return t.trim().toLowerCase()},Ra=e=>(e||[]).map(Tn).join(`, `),za=e=>JSON.stringify([e.subject,e.to,e.cc,e.bcc,e.text,e.format,e.html,(e.attachments||[]).map(e=>[e._tempId,e.uuid,e.partPath,e.filename])]),Ba=e=>{let t={...e,missing:!0};return delete t.uuid,t},Va=(e,t,n)=>{let r=e=>e.uuid?`uuid:${e.uuid}`:e.partPath?`part:${e.partPath}`:void 0,i=new Set(t.map(r)),a=new Map;for(let{source:e,...t}of n){let n=e&&r(e);n&&a.set(n,t)}return e.map(e=>{let t=r(e);return t&&i.has(t)&&a.get(t)||e})},Ha=e=>{let t=La(e);return t.startsWith(`noreply`)||t.startsWith(`no-reply`)||t.startsWith(`mailer-daemon`)},Ua=e=>e&&e.filter(e=>!Ha(e)),Wa=class extends EventTarget{constructor(){super(),this.state={activeComposers:[]},this.saveTimeout=null,this.username=null,this.keepDraftsOnSignOut=!1,this.adoptSession=()=>{let e=rr();if(e===this.username)return;let t=this.username===null?this.state.activeComposers:[];this.username=e;let n=e?this.loadDrafts(e):[];this.state.activeComposers=e?[...n,...t]:[],this.notify()},this.handleSessionCleared=e=>{this.saveTimeout!==null&&(window.clearTimeout(this.saveTimeout),this.saveTimeout=null);let t=e?.detail?.reason===`expired`;t&&this.saveDrafts();let n=t||this.keepDraftsOnSignOut;this.keepDraftsOnSignOut=!1;let r=this.username&&!n?Fa(this.username):null;this.username=null;for(let e of this.state.activeComposers)Ea(e.attachments||[]);if(this.state.activeComposers=[],this.notify(),r)try{localStorage.removeItem(r)}catch(e){x.error(`Failed to clear compose drafts`,e)}};try{localStorage.removeItem(Ia)}catch{}window.addEventListener(`session-cleared`,this.handleSessionCleared),window.addEventListener(`user-logged-in`,this.adoptSession),window.addEventListener(`alps-active-user-changed`,this.adoptSession),this.adoptSession()}loadDrafts(e){try{let t=localStorage.getItem(Fa(e));if(t)return JSON.parse(t).map(e=>{let t=e.isSending;return{...e,attachments:(e.attachments||[]).map(e=>e.uploading&&e._replaces?e._replaces:e).filter(e=>!e.uploading&&(e.uuid||e.partPath||e.missing)).map(e=>e.uuid?Ba(e):e),isSending:!1,isSaving:!1,closing:!1,minimized:t?!1:e.minimized}})}catch(e){x.error(`Failed to parse compose drafts from localStorage`,e)}return[]}saveDrafts(){if(this.username)try{localStorage.setItem(Fa(this.username),JSON.stringify(this.state.activeComposers))}catch(e){x.error(`Failed to save compose drafts to localStorage`,e)}}debouncedSaveDrafts(){this.saveTimeout!==null&&window.clearTimeout(this.saveTimeout),this.saveTimeout=window.setTimeout(()=>{this.saveDrafts(),this.saveTimeout=null},500)}notify(){this.dispatchEvent(new CustomEvent(`change`))}get stateCopy(){return{...this.state}}getComposer(e){return this.state.activeComposers.find(t=>t.id===e)}getState(){return this.state}openComposer(e){if(e?.draftUid){let t=this.state.activeComposers.find(t=>t.draftUid===e.draftUid);if(t){this.bringComposerToFront(t.id),t.minimized&&this.updateComposer(t.id,{minimized:!1});return}}let t=window.innerWidth<=768;if(t&&this.state.activeComposers.length>=1){let e=this.state.activeComposers[0].id;this.bringComposerToFront(e);return}if(!t&&this.state.activeComposers.length>=3)return;let n=`composer_`+Date.now()+`_`+Math.random().toString(36).substr(2,5),r=`html`,i=``,a=ar();a.composeFormat===`text`&&(r=`text`),a.signature&&(i=a.signature);let o=e?.text||``,s=e?.html||``;if(i&&!e?.draftUid){let t=`-- \n${i}`,n=`<div class="alps-signature">-- <br>${xa(i).replace(/\r?\n/g,`<br>`)}</div>`;o=`\n\n${t}\n${o}`,s=s||e?.text?`<br><br>${n}${s}`:`<br><br>${n}`}let c={id:n,minimized:!1,expanded:!1,dirty:!1,subject:``,format:e?.format||r,attachments:[],zIndex:1e3+this.state.activeComposers.length,...e,to:Ua(e?.to)||[],cc:Ua(e?.cc)||[],bcc:Ua(e?.bcc)||[],text:o,html:s,initialText:o,initialHtml:s};this.state={...this.state,activeComposers:[...this.state.activeComposers,c]},this.saveDrafts(),this.notify()}updateComposer(e,t,{edit:n=!0}={}){t.to&&=Ua(t.to),t.cc&&=Ua(t.cc),t.bcc&&=Ua(t.bcc);let r=this.state.activeComposers.map(r=>{if(r.id!==e)return r;let i=!1;`subject`in t&&t.subject!==r.subject&&(i=!0),`to`in t&&JSON.stringify(t.to||[])!==JSON.stringify(r.to||[])&&(i=!0),`cc`in t&&JSON.stringify(t.cc||[])!==JSON.stringify(r.cc||[])&&(i=!0),`bcc`in t&&JSON.stringify(t.bcc||[])!==JSON.stringify(r.bcc||[])&&(i=!0),`attachments`in t&&t.attachments!==r.attachments&&(i=!0);let a=!r.dirty&&!r.draftUid;`text`in t&&(t.text||``)!==(r.text||``)&&!(a&&(t.text||``).trim()===(r.initialText||``).trim())&&(i=!0),`format`in t&&t.format!==r.format&&(i=!0),(t.format??r.format)===`html`&&`html`in t&&(t.html||``)!==(r.html||``)&&(i=!0);let o=`dirty`in t?t.dirty:n&&i?!0:r.dirty;return{...r,...t,dirty:o}});this.state={...this.state,activeComposers:r},this.debouncedSaveDrafts(),this.notify()}closeComposer(e){this.state={...this.state,activeComposers:this.state.activeComposers.filter(t=>t.id!==e)},this.saveDrafts(),this.notify()}clearAllComposers(){this.state.activeComposers.length!==0&&(this.state={...this.state,activeComposers:[]},this.notify())}async saveAllDirtyDrafts(){this.keepDraftsOnSignOut=!1;let e=this.username,t=!1;try{for(let n of this.state.activeComposers.map(e=>e.id)){if(this.username!==e)throw new Pa;let r=this.getComposer(n);if(!r)continue;if(r.isSending||r.isSaving||r.closing||r.attachments?.some(e=>e.uploading||e.missing)){t=!0;continue}if(!r.dirty){this.closeComposer(n);continue}let i=(r.to?.length||0)>0||(r.cc?.length||0)>0||(r.bcc?.length||0)>0,a=r.text?.trim()!==r.initialText?.trim()||(r.subject?.trim().length||0)>0;if(!r.draftUid&&!i&&!a&&!(r.attachments&&r.attachments.length>0)){this.closeComposer(n);continue}let o=za(r);this.updateComposer(n,{isSaving:!0});try{let i;try{i=await V.saveDraft(this.draftForm(r))}catch(e){if(!(e instanceof ai))throw e;let t=new Set(e.uuids),r=this.getComposer(n);r&&this.updateComposer(n,{attachments:(r.attachments||[]).map(e=>e.uuid&&t.has(e.uuid)?Ba(e):e)}),i=null}if(this.username!==e)throw new Pa;if(!i){t=!0;continue}let a=this.getComposer(n);if(a&&za(a)!==o){this.updateComposer(n,{draftUid:i.uid,draftMailbox:i.mailbox,...i.attachments&&{attachments:Va(a.attachments||[],r.attachments||[],i.attachments)}}),t=!0;continue}this.closeComposer(n)}finally{this.getComposer(n)&&this.updateComposer(n,{isSaving:!1})}}if(t||this.state.activeComposers.length>0)throw new Pa}catch(t){throw t instanceof Pa||x.error(`Failed to save drafts before signing out`,t),this.saveDrafts(),new Pa(this.username===e&&e!==null?()=>this.retainDraftsForSignOut(e):void 0)}}retainDraftsForSignOut(e){this.username===e&&(this.saveTimeout!==null&&(window.clearTimeout(this.saveTimeout),this.saveTimeout=null),this.saveDrafts(),this.keepDraftsOnSignOut=!0)}draftForm(e){let t=new FormData,n=[...e.bcc||[]],r=``;{let e=ar(),t=ir(e);e.bccMyself&&t&&!n.some(e=>La(e)===La(t))&&n.push(t),e.replyTo&&(r=e.replyTo)}t.append(`to`,Ra(e.to)),t.append(`cc`,Ra(e.cc)),t.append(`bcc`,Ra(n)),r&&t.append(`reply_to`,r),t.append(`subject`,(e.subject||``).trim()),t.append(`text`,e.text||``),e.html&&e.format===`html`&&t.append(`html`,e.html),t.append(`save_as_draft`,`1`);let i=e.attachments||[],a=i.map(e=>e.uuid).filter(Boolean).join(`,`);a&&t.append(`attachment-uuids`,a);let o=i.map(e=>e.partPath).filter(Boolean).join(`,`);return o&&t.append(`prev_attachments`,o),e.draftMailbox&&t.append(`draft_mailbox`,e.draftMailbox),e.draftUid&&t.append(`draft_uid`,e.draftUid),Na(t,e),t}bringComposerToFront(e){let t=1e3;this.state.activeComposers.forEach(e=>{e.zIndex&&e.zIndex>t&&(t=e.zIndex)}),this.updateComposer(e,{zIndex:t+1})}},Ga=u(`compose-store`),Ka=`alps-login-notice`;function qa(e){try{sessionStorage.setItem(Ka,e)}catch{}}function Ja(){try{let e=sessionStorage.getItem(Ka);return e&&sessionStorage.removeItem(Ka),e||null}catch{return null}}var Ya=class extends d{constructor(...e){super(...e),this.icon=``,this.branded=!1,this.title=``,this.subtitle=``}static{this.styles=[Bn,v`
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

    .logo-container svg,
    .logo-container img.logo {
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
  `]}render(){return n`
      <div class="card">
        ${this.branded||this.icon?n`
          <div class="logo-container">
            ${this.branded?zn():M(this.icon)}
          </div>
        `:``}
        ${this.title?n`<h1>${this.title}</h1>`:``}
        ${this.subtitle?n`<p class="subtitle">${this.subtitle}</p>`:``}
        
        <slot></slot>
      </div>
    `}};P([o({type:String})],Ya.prototype,`icon`,void 0),P([o({type:Boolean})],Ya.prototype,`branded`,void 0),P([o({type:String})],Ya.prototype,`title`,void 0),P([o({type:String})],Ya.prototype,`subtitle`,void 0),Ya=P([p(`alps-auth-card`)],Ya);var Xa=class extends d{constructor(...e){super(...e),this.text=``,this.fullHeight=!1}static{this.styles=v`
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
      <div class="spinner">${M(`edelweiss`)}</div>
      ${this.text?n`<span>${this.text}</span>`:``}
    `}};P([o({type:String})],Xa.prototype,`text`,void 0),P([o({type:Boolean,attribute:`full-height`})],Xa.prototype,`fullHeight`,void 0),Xa=P([p(`alps-loader`)],Xa);var Za=class extends d{constructor(...e){super(...e),this.icon=``,this.title=``,this.disabled=!1,this.active=!1,this.spinning=!1}static{this.styles=v`
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
        ${this.icon?M(this.icon):n`<slot></slot>`}
      </button>
    `}};P([o({type:String})],Za.prototype,`icon`,void 0),P([o({type:String})],Za.prototype,`title`,void 0),P([o({type:Boolean})],Za.prototype,`disabled`,void 0),P([o({type:Boolean,reflect:!0})],Za.prototype,`active`,void 0),P([o({type:Boolean})],Za.prototype,`spinning`,void 0),Za=P([p(`alps-icon-btn`)],Za);var H=class extends d{constructor(...e){super(...e),this.notice=null,this.username=``,this.password=``,this.rememberMe=!1,this.error=``,this.isSubmitting=!1,this.retryAfter=0,this.isRateLimited=!1,this._handleI18nChange=()=>{this.requestUpdate()}}static{this.styles=v`
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
      background-color: var(--accent-fill, #3b82f6);
      color: #ffffff;
      border: 1px solid var(--accent-fill-border, transparent);
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
      background-color: var(--accent-fill-hover, #2563eb);
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
  `}connectedCallback(){super.connectedCallback(),this.notice=Ja(),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),this.composeStore&&this.composeStore.clearAllComposers()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),this.retryCountdownInterval&&clearInterval(this.retryCountdownInterval)}async firstUpdated(){await this.renderRoot.querySelector(`alps-auth-card`)?.updateComplete,this.renderRoot.querySelector(`#username`)?.focus()}startRetryCountdown(e){this.retryAfter=e,this.isRateLimited=!0,this.retryCountdownInterval&&clearInterval(this.retryCountdownInterval),this.retryCountdownInterval=setInterval(()=>{this.retryAfter--,this.retryAfter<=0&&(this.isRateLimited=!1,this.retryCountdownInterval&&=(clearInterval(this.retryCountdownInterval),void 0))},1e3)}formatRetryTime(e){if(e<60)return`${e} second${e===1?``:`s`}`;let t=Math.ceil(e/60);return`${t} minute${t===1?``:`s`}`}async handleSubmit(e){if(e.preventDefault(),this.isSubmitting)return;let t=this.shadowRoot?.querySelector(`form`);if(t&&!t.checkValidity()){t.reportValidity();return}this.error=``,this.isSubmitting=!0;try{await new Promise(e=>setTimeout(e,600));let e={username:this.username,password:this.password,"remember-me":this.rememberMe?`on`:``},t=await fetch(`/session`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)}),n={};try{n=await t.json()??{}}catch{n={}}if(t.ok)if(n.requires_2fa){try{sessionStorage.setItem(`pending_2fa_username`,this.username)}catch{}window.location.hash=`/login/webauthn`,this.isSubmitting=!1}else window.dispatchEvent(new CustomEvent(`user-logged-in`,{detail:{username:this.username}})),window.location.hash=`/mailbox/INBOX`;else{if(t.status===429){this.error=n.error||this.i18nStore?.t(`login.tooManyAttempts`);let e=Number(n.retry_after)||Number(t.headers.get(`Retry-After`))||60;this.startRetryCountdown(e)}else this.error=n.error||this.i18nStore?.t(`login.loginFailed`),this.isRateLimited=!1;this.isSubmitting=!1}}catch{this.error=this.i18nStore?.t(`login.networkError`),this.isSubmitting=!1,this.isRateLimited=!1}}render(){return n`
      <alps-auth-card
        branded
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
              <span class="icon-left">${M(`at`)}</span>
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
              <span class="icon-left">${M(`key`)}</span>
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
    `}};P([h({context:D})],H.prototype,`i18nStore`,void 0),P([a()],H.prototype,`notice`,void 0),P([a()],H.prototype,`username`,void 0),P([a()],H.prototype,`password`,void 0),P([a()],H.prototype,`rememberMe`,void 0),P([a()],H.prototype,`error`,void 0),P([a()],H.prototype,`isSubmitting`,void 0),P([a()],H.prototype,`retryAfter`,void 0),P([a()],H.prototype,`isRateLimited`,void 0),P([h({context:Ga,subscribe:!0})],H.prototype,`composeStore`,void 0),H=P([p(`login-page`)],H);var Qa=600*1e3,$a=new class{async classify(e,t){return e.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),`failed`):e.ok?`ok`:e.status===409?`exists`:(x.error(`Failed to ${t}`,e.status),`failed`)}async createMailbox(e){try{let t=new URLSearchParams;t.append(`name`,e);let n=await N(`/mailboxes`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:t.toString()}),r=await this.classify(n,`create mailbox`);return r===`ok`&&R.syncLabels(),r}catch(e){return x.error(`Failed to create mailbox`,e),`failed`}}async renameMailbox(e,t){try{let n=await N(`/mailboxes/${k(e)}/rename`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({new_name:t})}),r=await this.classify(n,`rename mailbox`);return r===`ok`&&(R.mailboxRenamed(e,t),R.syncLabels()),r}catch(e){return x.error(`Failed to rename mailbox`,e),`failed`}}async deleteMailbox(e){try{let t=await N(`/mailboxes/${k(e)}`,{method:`DELETE`}),n=await this.classify(t,`delete mailbox`);return n===`ok`&&(R.mailboxDeleted(e),R.sync()),n===`ok`}catch(e){return x.error(`Failed to delete mailbox`,e),!1}}async emptyMailbox(e){try{let t=await N(`/mailboxes/${k(e)}/empty`,{method:`POST`},Qa);if(t.status===401)return{ok:!1,reason:`auth`};if(t.ok){let e;try{let n=await t.json();typeof n?.discarded==`number`&&(e=n.discarded)}catch{}return R.sync(),{ok:!0,discarded:e}}return x.error(`Failed to empty mailbox`,t.status),{ok:!1,reason:t.status===403?`not_discardable`:`failed`}}catch(e){return x.error(`Failed to empty mailbox`,e),e?.name===`AbortError`?(R.sync({refresh:!0}),{ok:!1,reason:`timeout`}):{ok:!1,reason:`failed`}}}async setSubscribed(e,t){let n=t?`subscribe`:`unsubscribe`;try{let t=await N(`/mailboxes/${k(e)}/${n}`,{method:`PUT`});return t.status===401?(window.dispatchEvent(new CustomEvent(`auth-error`)),{ok:!1,reason:`auth`}):t.ok?(R.syncLabels(),{ok:!0}):(x.error(`Failed to ${n} mailbox`,t.status),{ok:!1,reason:`failed`})}catch(e){return x.error(`Failed to ${n} mailbox`,e),{ok:!1,reason:`failed`}}}},eo=`application/x-alps-messages`;function to(e){return!!e&&Array.from(e.types??[]).includes(`application/x-alps-messages`)}function no(e){if(!to(e))return null;let t;try{t=JSON.parse(e.getData(eo))}catch{return null}let n=t;return!n||!Array.isArray(n.keys)||!n.keys.every(e=>typeof e==`string`)?null:{keys:n.keys,selection:n.selection===!0}}function ro(e){return e.altKey||e.ctrlKey}var io=new TextEncoder;function ao(e){let t=[],n=new Set,r=0;for(let i=e.length-1;i>=0&&t.length<200;i--){let a=e[i];if(typeof a!=`string`||!a||n.has(a))continue;let o=io.encode(a).length;r+o>16384||(n.add(a),r+=o,t.push(a))}return t.reverse()}function oo(e,t){return ao([...e.filter(e=>e!==t),t])}function so(e,t){return e.filter(e=>e!==t)}function co(e,t,n){return e.filter(e=>!Ve(e,t,n))}function lo(e,t,n,r){return ao(e.map(e=>Ve(e,t,r)?n+e.slice(t.length):e))}var uo=e=>e?.Name||e?.Mailbox||``;function fo(e,t){if(e.size!==0)for(let n of t||[]){let t=uo(n);e.has(t)&&n.Subscribed!==!0&&e.delete(t)}}function po(e,t,n){let r=new Set;for(let e of t||[])e?.Subscribed===!0&&r.add(uo(e));return e.filter(e=>n.has(e)||!r.has(e))}var mo=class extends d{constructor(...e){super(...e),this.scrolled=!1}static{this.styles=v`
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
  `}render(){return n`<slot></slot>`}};P([o({type:Boolean,reflect:!0})],mo.prototype,`scrolled`,void 0),mo=P([p(`alps-toolbar`)],mo);var ho=class extends d{constructor(...e){super(...e),this.title=`Confirm`,this.message=`Are you sure?`,this.confirmText=`Confirm`,this.cancelText=``,this.isDanger=!1,this.dismissible=!1}static{this.styles=[sr]}_handleCancel(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`cancel`,{bubbles:!0,composed:!0}))}_handleSecondary(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`secondary`,{bubbles:!0,composed:!0}))}_handleConfirm(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`confirm`,{bubbles:!0,composed:!0}))}render(){return n`
      <ui-modal 
        .title=${this.title}
        .isDanger=${this.isDanger}
        .dismissible=${this.dismissible}
        .bodyDescribes=${!0}
        @cancel=${this._handleCancel}
      >
        <slot>${this.message}</slot>
        <alps-button slot="actions" variant="text" @click=${this._handleCancel}>${this.cancelText||this.i18nStore?.t(`general.cancel`)||`Cancel`}</alps-button>
        ${this.secondaryText?n`<alps-button slot="actions" variant="text" @click=${this._handleSecondary}>${this.secondaryText}</alps-button>`:``}
        <alps-button slot="actions" variant=${this.isDanger?`danger`:`normal`} @click=${this._handleConfirm}>
          ${this.confirmText}
        </alps-button>
      </ui-modal>
    `}};P([h({context:D})],ho.prototype,`i18nStore`,void 0),P([o({type:String})],ho.prototype,`title`,void 0),P([o({type:String})],ho.prototype,`message`,void 0),P([o({type:String})],ho.prototype,`confirmText`,void 0),P([o({type:String})],ho.prototype,`cancelText`,void 0),P([o({type:String})],ho.prototype,`secondaryText`,void 0),P([o({type:Boolean})],ho.prototype,`isDanger`,void 0),P([o({type:Boolean})],ho.prototype,`dismissible`,void 0),ho=P([p(`ui-confirm`)],ho);var go=new Set([``,`text`,`search`,`url`,`email`,`password`,`tel`,`number`]);function _o(e){if(!e)return!1;if(e.isContentEditable)return!0;let t=e.tagName;if(t===`TEXTAREA`||t===`SELECT`)return!0;if(t===`INPUT`)return go.has((e.type||``).toLowerCase());let n=e.getAttribute(`role`);return n===`textbox`||n===`searchbox`}function vo(e){return e?e.tagName===`TEXTAREA`||e.isContentEditable:!1}var yo=v`
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
`,bo=class extends d{constructor(...e){super(...e),this.align=`right`,this.position=`bottom`,this.triggerOn=`click`,this.openState=!1,this._handleDialogClick=e=>{this.openState&&e.target===e.currentTarget&&(e.stopPropagation(),e.preventDefault(),this.close())},this._handleDialogClose=()=>{this.openState&&this.close()},this._handleDialogKeydown=e=>{if(this.openState){if(e.key===`ArrowDown`||e.key===`ArrowUp`){if(vo(this._getActiveElement()))return;e.preventDefault();let t=this._getFocusableElements();if(t.length===0)return;let n=this._getActiveElement(),r=t.findIndex(e=>e===n);r=e.key===`ArrowDown`?r===-1?0:(r+1)%t.length:r===-1?t.length-1:(r-1+t.length)%t.length,t[r].focus()}else if(e.key===`Enter`||e.key===` `){let t=this._getActiveElement();if(e.key===` `?_o(t):vo(t))return;t&&typeof t.click==`function`&&(e.preventDefault(),t.click())}}},this._closeTimeout=null,this._handleMouseEnter=()=>{this.triggerOn===`hover`&&(this._closeTimeout&&=(clearTimeout(this._closeTimeout),null),this.open())},this._handleMouseLeave=()=>{this.triggerOn===`hover`&&(this._closeTimeout&&clearTimeout(this._closeTimeout),this._closeTimeout=setTimeout(()=>{this.close(),this._closeTimeout=null},300))},this._handleResize=()=>{this.openState&&this._updatePosition()}}static{this.styles=v`
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
    `}};P([o({type:String})],bo.prototype,`align`,void 0),P([o({type:String})],bo.prototype,`position`,void 0),P([o({type:String,reflect:!0})],bo.prototype,`triggerOn`,void 0),P([o({type:Boolean,reflect:!0,attribute:`open`})],bo.prototype,`openState`,void 0),bo=P([p(`alps-popup`)],bo);var xo=u(`sidebar-strip`),So=class extends _{constructor(...e){super(...e),this.strip=!1}createRenderRoot(){return this}update(e){super.update(e),this.follow(this.strip)}};P([h({context:xo,subscribe:!0}),o({attribute:!1})],So.prototype,`strip`,void 0);var Co=class extends So{follow(e){this.classList.toggle(`collapsed`,e)}};Co=P([p(`alps-sidebar-frame`)],Co);var wo=class extends So{follow(e){this.toggleAttribute(`strip`,e),this.toggleAttribute(`inert`,e)}};wo=P([p(`alps-sidebar-content`)],wo);var To=class extends d{constructor(...e){super(...e),this.collapsed=!1,this.icon=`plus`,this.text=``,this.disabled=!1,this.title=``}static{this.styles=v`
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
    `}};P([h({context:xo,subscribe:!0}),o({type:Boolean,reflect:!0})],To.prototype,`collapsed`,void 0),P([o({type:String})],To.prototype,`icon`,void 0),P([o({type:String})],To.prototype,`text`,void 0),P([o({type:Boolean})],To.prototype,`disabled`,void 0),P([o({type:String})],To.prototype,`title`,void 0),To=P([p(`alps-create-button`)],To);var Eo=v`
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
  /* The content follows the strip state alps-sidebar provides
     (alps-sidebar-strip.ts): in the strip it stays exactly as it is, dimmed,
     behind the main view and inert. */
  alps-sidebar-content {
    display: block;
    transition: opacity 0.2s ease;
  }
  alps-sidebar-content[strip] {
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
  .sidebar-wrapper.collapsed .sidebar-header {
    padding: 0 14px !important;
    justify-content: flex-start;
  }
  /* The content keeps at least 215px of width, so a narrow sidebar clips it
     rather than reflowing it. Collapsed into the strip, it also slides behind
     the main view, and what the 64px strip should then show is each row's
     ICON: every sidebar sets --strip-slide, how far its content moves to
     bring its icons 8px inside the strip, the same place on every page. The
     default suits rows padded 8px inside 16px of content padding (Calendar,
     Tasks). Mail's rows lead with the expander column and slide 38px,
     Contacts' 14px, Settings' 20px. One slide for all of them put mail's
     icons half out of the strip and everyone else's under the main view.

     The slide starts only below 120px of content, narrower than any docked
     sidebar's (a drag below 120px snaps to the strip, and the narrowest
     docked sidebar, 150px, keeps 133px inside its border and padding), so a
     sidebar dragged narrow keeps every column in view, the expander carets
     included. On the way into the strip the content moves with the edge
     until it has slid --strip-slide. */
  .sidebar-scroll-content {
    width: calc(max(100%, 215px));
    margin-left: max(0px - var(--strip-slide, 16px), min(0px, 100% - 120px));
  }
`;function Do(e){e?.querySelector(`alps-sidebar`)?.closePeek()}var U=class extends d{static{this.styles=v`
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
  `}constructor(){super(),this.isMobile=!1,this.isOpen=!1,this.collapsed=!1,this.peeking=!1,this.strip=!1,this.width=250,this.hideFooterDivider=!1,this.showMobileBack=!1,this.isDragging=!1,this.openTimer=null,this.closeTimer=null,this.stopResize=null,this.onPointerEnter=()=>{this.closeTimer!==null&&(clearTimeout(this.closeTimer),this.closeTimer=null),!(this.peeking||!this.collapsed||this.isMobile||this.isDragging)&&(this.openTimer??=setTimeout(()=>{this.openTimer=null,this.peeking=!0},300))},this.onPointerLeave=()=>{this.openTimer!==null&&(clearTimeout(this.openTimer),this.openTimer=null),this.peeking&&(this.closeTimer??=setTimeout(()=>{this.closeTimer=null,this.peeking=!1},300))},this.addEventListener(`mouseenter`,this.onPointerEnter),this.addEventListener(`mouseleave`,this.onPointerLeave)}disconnectedCallback(){super.disconnectedCallback(),this.clearPeekTimers(),this.stopResize?.()}closePeek(){this.clearPeekTimers(),this.peeking=!1}willUpdate(e){(e.has(`collapsed`)||e.has(`isMobile`))&&(this.clearPeekTimers(),this.peeking=!1),this.strip=this.collapsed&&!this.peeking&&!this.isMobile}clearPeekTimers(){this.openTimer!==null&&clearTimeout(this.openTimer),this.closeTimer!==null&&clearTimeout(this.closeTimer),this.openTimer=null,this.closeTimer=null}startResize(e){if(this.isMobile||this.collapsed)return;e.preventDefault(),this.stopResize?.(),this.isDragging=!0,this.dispatchEvent(new CustomEvent(`drag-start`));let t=e.clientX,n=this.width,r=e=>{let r=n+(e.clientX-t);this.dispatchEvent(new CustomEvent(`sidebar-resize`,{detail:{newWidth:r,clientX:e.clientX}}))},i=()=>{this.stopResize=null,this.isDragging=!1,window.removeEventListener(`mousemove`,r),window.removeEventListener(`mouseup`,i),this.dispatchEvent(new CustomEvent(`drag-end`))};this.stopResize=i,window.addEventListener(`mousemove`,r),window.addEventListener(`mouseup`,i)}render(){return n`
      <div class="mobile-backdrop" @click=${()=>this.dispatchEvent(new CustomEvent(`close-sidebar`))}></div>
      <aside class="sidebar ${this.isDragging?`dragging`:``}" part="sidebar" style="--sidebar-width-expanded: ${this.width}px">
        <div class="sidebar-content">
          <slot></slot>
        </div>
        <div class="sidebar-footer">
          ${this.isMobile&&this.showMobileBack?n`
            <button class="mobile-return-btn" @click=${()=>window.location.hash=``}>
              ${M(`arrowLeft`)} <span class="return-text">${this.i18nStore?.t(`messageReader.back`)||`Back`}</span>
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
    `}};P([h({context:D})],U.prototype,`i18nStore`,void 0),P([o({type:Boolean})],U.prototype,`isMobile`,void 0),P([o({type:Boolean})],U.prototype,`isOpen`,void 0),P([o({type:Boolean,reflect:!0})],U.prototype,`collapsed`,void 0),P([o({type:Boolean,reflect:!0})],U.prototype,`peeking`,void 0),P([i({context:xo})],U.prototype,`strip`,void 0),P([o({type:Number})],U.prototype,`width`,void 0),P([o({type:Boolean})],U.prototype,`hideFooterDivider`,void 0),P([o({type:Boolean})],U.prototype,`showMobileBack`,void 0),P([a()],U.prototype,`isDragging`,void 0),U=P([p(`alps-sidebar`)],U);var Oo=class extends d{constructor(...e){super(...e),this.heading=``}createRenderRoot(){return this}render(){return n`<h3 class="section-heading">${this.heading}</h3>`}};P([o({type:String})],Oo.prototype,`heading`,void 0),Oo=P([p(`alps-sidebar-heading`)],Oo);var ko=v`
  alps-sidebar-heading {
    display: block;
  }
  /* 32px, the text centred, and 8px in, as the rows below pad theirs. */
  .section-heading {
    display: flex;
    align-items: center;
    min-height: 32px;
    margin: 0;
    padding: 0 8px;
    font-family: var(--font-label);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted, #6b7280);
  }
`,W=class extends d{constructor(...e){super(...e),this.mailboxes=[],this.currentMailbox=``,this.expandedFolders=new Set,this.layoutMode=`vertical`,this.syncing=!1,this.strip=!1,this.isScrolled=!1,this.showCreatePrompt=!1,this.promptBusy=!1,this.showRenamePrompt=!1,this.mailboxToRename=``,this.showDeleteConfirm=!1,this.showMoveToTrashConfirm=!1,this.mailboxToDelete=``,this.parentForNewFolder=``,this.activeKebabMenu=null,this.dropTarget=null,this.dropCopy=!1,this.stopDropWatch=null,this.showUnsubscribed=!1,this.unconfirmedUnsubscribes=new Set,this.primaryFullNames=new Set,this._handleStoreChange=()=>{this.requestUpdate()},this.handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0}}willUpdate(e){super.willUpdate(e)}updated(e){super.updated(e),this.settleUnsubscribed()}get unsubscribedHere(){return this.settingsStore?.getState()?.unsubscribedFolders??[]}saveUnsubscribedHere(e){let t=this.unsubscribedHere;e.length===t.length&&e.every((e,n)=>e===t[n])||this.settingsStore?.updateSettings({unsubscribedFolders:e})}settleUnsubscribed(){!this.settingsStore?.recordRead||this.mailboxes.length===0||this.unsubscribedHere.length===0&&this.unconfirmedUnsubscribes.size===0||(fo(this.unconfirmedUnsubscribes,this.mailboxes),this.saveUnsubscribedHere(po(this.unsubscribedHere,this.mailboxes,this.unconfirmedUnsubscribes)))}subscriptionChanged(e,t){t?(this.unconfirmedUnsubscribes.delete(e),this.saveUnsubscribedHere(so(this.unsubscribedHere,e))):(this.unconfirmedUnsubscribes.add(e),this.saveUnsubscribedHere(oo(this.unsubscribedHere,e)))}renamedHere(e,t,n){for(let r of[...this.unconfirmedUnsubscribes])Ve(r,e,n)&&(this.unconfirmedUnsubscribes.delete(r),this.unconfirmedUnsubscribes.add(t+r.slice(e.length)));this.saveUnsubscribedHere(lo(this.unsubscribedHere,e,t,n))}goneHere(e,t){for(let n of[...this.unconfirmedUnsubscribes])Ve(n,e,t)&&this.unconfirmedUnsubscribes.delete(n);this.saveUnsubscribedHere(co(this.unsubscribedHere,e,t))}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&(this.composeStore&&this.composeStore.addEventListener(`change`,this._handleStoreChange),this.i18nStore&&this.i18nStore.addEventListener(`change`,this._handleStoreChange),this.settingsStore&&this.settingsStore.addEventListener(`change`,this._handleStoreChange))})}disconnectedCallback(){super.disconnectedCallback(),this.composeStore&&this.composeStore.removeEventListener(`change`,this._handleStoreChange),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange),this.clearDropTarget()}static{this.styles=[yo,Eo,ko,v`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
      box-sizing: border-box;
      /* The collapsed strip's slide (sidebarLayoutStyles): a folder's icon
         sits 46px in, after the content's 8px padding, the row's 4px, the
         30px expander and the 4px gap, so it slides 38px to stand 8px inside
         the strip. */
      --strip-slide: 38px;
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
  `]}toggleFolder(e,t){e&&e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-folder`,{detail:{folderName:t}}))}selectMailbox(e){this.dispatchEvent(new CustomEvent(`select-mailbox`,{detail:{name:e}}))}triggerCreateFolder(){this.parentForNewFolder=``,this.showCreatePrompt=!0}async handleCreateSubmit(e){let t=e.detail.name;this.promptBusy=!0;try{if(t){if(this.parentForNewFolder){let e=j(this.mailboxes.find(e=>(e.Name||e.Mailbox)===this.parentForNewFolder))||`.`;t=`${this.parentForNewFolder}${e}${t}`,this.dispatchEvent(new CustomEvent(`expand-folder`,{detail:{folderName:this.parentForNewFolder}}))}let e=await $a.createMailbox(t);e===`ok`?this.saveUnsubscribedHere(so(this.unsubscribedHere,t)):e===`exists`?this.toast(this.i18nStore?.t(`toast.folderExists`),`A folder with that name already exists`,{type:`error`}):e===`failed`&&this.toast(this.i18nStore?.t(`toast.folderCreateFailed`),`Could not create the folder`,{type:`error`})}}finally{this.promptBusy=!1,this.showCreatePrompt=!1,this.parentForNewFolder=``}}toast(e,t,n={}){this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:e||t,duration:4e3,...n},bubbles:!0,composed:!0}))}async handleRenameSubmit(e){let t=e.detail.name;if(t&&this.mailboxToRename){let e=this.mailboxToRename,n=j(this.mailboxes.find(t=>(t.Name||t.Mailbox)===e));this.showRenamePrompt=!1,this.mailboxToRename=``;let r=await $a.renameMailbox(e,t);r===`exists`?this.toast(this.i18nStore?.t(`toast.folderExists`),`A folder with that name already exists`,{type:`error`}):r===`failed`?this.toast(this.i18nStore?.t(`toast.folderRenameFailed`),`Could not rename the folder`,{type:`error`}):(this.renamedHere(e,t,n),Ve(this.currentMailbox,e)&&this.selectMailbox(t+this.currentMailbox.slice(e.length)),this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderRenamed`),actionLabel:this.i18nStore?.t(`toast.undo`),actionFn:async()=>{if(await $a.renameMailbox(t,e)!==`ok`){this.toast(this.i18nStore?.t(`toast.folderUndoFailed`),`Could not undo that`,{type:`error`});return}this.renamedHere(t,e,n),Ve(this.currentMailbox,t)&&this.selectMailbox(e+this.currentMailbox.slice(t.length))},duration:5e3},bubbles:!0,composed:!0})))}else this.showRenamePrompt=!1,this.mailboxToRename=``}async handleDeleteConfirm(){if(this.mailboxToDelete){let e=this.mailboxToDelete,t=j(this.mailboxes.find(t=>(t.Name||t.Mailbox)===e));await $a.deleteMailbox(e)?(this.goneHere(e,t),Ve(this.currentMailbox,this.mailboxToDelete)&&this.selectMailbox(O),this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderPermanentlyDeleted`),duration:3e3},bubbles:!0,composed:!0}))):this.toast(this.i18nStore?.t(`toast.folderDeleteFailed`),`Could not delete the folder`,{type:`error`})}this.showDeleteConfirm=!1,this.mailboxToDelete=``}async handleMoveToTrashConfirm(){if(this.mailboxToDelete){let e=this.mailboxes.find(e=>(e.Name||e.Mailbox)===this.mailboxToDelete),t=Ue(this.mailboxToDelete,j(e,`.`)),n=t[t.length-1],r=j(e,`.`)||`.`,i=Pe(`trash`,this.mailboxes,`Trash`),a=`${i}${r}${n}`,o=1;for(;this.mailboxes.some(e=>(e.Name||e.Mailbox)===a);)a=`${i}${r}${n} (${o})`,o++;let s=a;if(await $a.renameMailbox(this.mailboxToDelete,s)!==`ok`)this.toast(this.i18nStore?.t(`toast.folderRenameFailed`),`Could not rename the folder`,{type:`error`});else{this.goneHere(this.mailboxToDelete,r),Ve(this.currentMailbox,this.mailboxToDelete,r)&&this.selectMailbox(O);let e=this.mailboxToDelete;this.dispatchEvent(new CustomEvent(`toast`,{detail:{message:this.i18nStore?.t(`toast.folderMovedToTrash`),actionLabel:this.i18nStore?.t(`toast.undo`),actionFn:async()=>{await $a.renameMailbox(s,e)!==`ok`&&this.toast(this.i18nStore?.t(`toast.folderUndoFailed`),`Could not undo that`,{type:`error`})},duration:5e3},bubbles:!0,composed:!0}))}}this.showMoveToTrashConfirm=!1,this.mailboxToDelete=``}moveFolder(e,t){console.log(`[moveFolder] Start:`,{folderName:e,direction:t});let n=j(this.mailboxes.find(t=>(t.Name||t.Mailbox)===e),`.`),r=Ue(e,n),i=r.slice(0,-1).join(n),a=this.mailboxes.map(e=>e.Name||e.Mailbox||``).filter(e=>{if(this.primaryFullNames.has(e))return!1;let t=Ue(e,n);return t.slice(0,-1).join(n)===i&&t.length===r.length});console.log(`[moveFolder] Sibling custom folders found:`,a);let o=[...this.settingsStore?.getState()?.customMailboxOrder||[]];a.sort((e,t)=>{let n=o.indexOf(e),r=o.indexOf(t);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.localeCompare(t):1:-1}),console.log(`[moveFolder] Sorted siblings:`,a);let s=a.indexOf(e);if(s===-1){console.error(`[moveFolder] Folder not found in siblings!`);return}let c=s;switch(t){case`top`:c=0;break;case`up`:c=Math.max(0,s-1);break;case`down`:c=Math.min(a.length-1,s+1);break;case`bottom`:c=a.length-1;break}if(console.log(`[moveFolder] Shifting indexes:`,{currentIndex:s,newIndex:c}),c===s){console.log(`[moveFolder] No index change needed.`);return}a.splice(s,1),a.splice(c,0,e),console.log(`[moveFolder] New siblings order:`,a);let l=o.filter(e=>!a.includes(e));l.push(...a),console.log(`[moveFolder] Final updated customMailboxOrder settings state:`,l),this.settingsStore?.updateSettings({customMailboxOrder:l})}takesDrop(e,t){return!this.strip&&to(e.dataTransfer)&&ze(t,this.mailboxes,this.currentMailbox)}handleDragOver(e,t,n){if(!this.takesDrop(e,n)){this.dropTarget===t&&this.clearDropTarget();return}e.preventDefault();let r=ro(e);e.dataTransfer.dropEffect=r?`copy`:`move`,this.dropTarget!==t&&(this.dropTarget=t),this.dropCopy!==r&&(this.dropCopy=r),this.watchDragEnd()}handleDragLeave(e,t){let n=e.currentTarget,r=e.relatedTarget;n&&r&&n.contains(r)||this.dropTarget===t&&this.clearDropTarget()}handleDrop(e,t,n){if(!this.takesDrop(e,n))return;e.preventDefault();let r=ro(e),i=no(e.dataTransfer);this.clearDropTarget(),!(!i||i.keys.length===0)&&this.dispatchEvent(new CustomEvent(`drop-messages`,{detail:{folder:t,copy:r,keys:i.keys,selection:i.selection},bubbles:!0,composed:!0}))}watchDragEnd(){if(this.stopDropWatch)return;let e=()=>this.clearDropTarget(),t=t=>{t.key===`Escape`&&e()};window.addEventListener(`dragend`,e,!0),window.addEventListener(`drop`,e,!0),window.addEventListener(`keydown`,t,!0),this.stopDropWatch=()=>{window.removeEventListener(`dragend`,e,!0),window.removeEventListener(`drop`,e,!0),window.removeEventListener(`keydown`,t,!0)}}clearDropTarget(){this.stopDropWatch?.(),this.stopDropWatch=null,this.dropTarget=null,this.dropCopy=!1}render(){let e=[{role:`inbox`,names:[O],display:{icon:`tray`,label:this.i18nStore?.t(`folderList.inbox`)}},{role:`drafts`,names:[Ce],display:{icon:`fileText`,label:this.i18nStore?.t(`folderList.drafts`)}},{role:`sent`,names:[we],display:{icon:`paperPlaneTilt`,label:this.i18nStore?.t(`folderList.sent`)}},{role:`archive`,names:[Te,Ee],display:{icon:`archiveBox`,label:this.i18nStore?.t(`folderList.archive`)}},{role:`junk`,names:[Oe,De],display:{icon:`warningDiamond`,label:this.i18nStore?.t(`folderList.junk`)}},{role:`trash`,names:[ke],display:{icon:`trash`,label:this.i18nStore?.t(`folderList.trash`)}}],t={[O]:{icon:`tray`,label:this.i18nStore?.t(`folderList.inbox`)},[Ce]:{icon:`fileText`,label:this.i18nStore?.t(`folderList.drafts`)},[we]:{icon:`paperPlaneTilt`,label:this.i18nStore?.t(`folderList.sent`)},[Te]:{icon:`archiveBox`,label:this.i18nStore?.t(`folderList.archive`)},[Ee]:{icon:`archiveBox`,label:this.i18nStore?.t(`folderList.archive`)},[De]:{icon:`warningDiamond`,label:this.i18nStore?.t(`folderList.spam`)},[Oe]:{icon:`warningDiamond`,label:this.i18nStore?.t(`folderList.junk`)},[ke]:{icon:`trash`,label:this.i18nStore?.t(`folderList.trash`)}},r=()=>Object.create(null),i=r();this.mailboxes.forEach(e=>{let t=e.Name||e.Mailbox||``,n=j(e,`.`),a=Ue(t,n),o=i,s=``;for(let t=0;t<a.length;t++){let i=a[t];s=t===0?i:s+n+i,o[i]||(o[i]={name:i,fullName:s,children:r()}),t===a.length-1&&(o[i].mb=e),o=o[i].children}});let a=Le(this.mailboxes),o=new Map;e.forEach((e,t)=>{let n=Fe(e.role,this.mailboxes);n!==null&&o.set(n,t)});let s=new Map,l=[];Object.values(i).forEach(e=>{let t=e.mb?o.get(e.fullName):void 0;t===void 0?l.push(e):s.set(t,e)});let u=(n,r)=>e[r].names.includes(n.name)&&t[n.name]||e[r].display,d=[];for(let t=0;t<e.length;t++){let e=s.get(t);e&&(e.primary=u(e,t),d.push(e))}this.primaryFullNames=new Set(d.map(e=>e.fullName));let f=new Map([...o].filter(([,e])=>!s.has(e))),p=this.settingsStore?.getState()?.customMailboxOrder||[];l.sort((e,t)=>{let n=p.indexOf(e.fullName),r=p.indexOf(t.fullName);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.name.localeCompare(t.name):1:-1});let m=new Set(this.unsubscribedHere),h=e=>Ne(e.mb,a)!==null||Object.values(e.children).some(h),g=Re(this.mailboxes)?l.filter(e=>!!e.mb&&e.mb.Subscribed!==!0&&m.has(e.fullName)&&!h(e)):[],_=l.filter(e=>!g.includes(e)),v=g.some(e=>Ve(this.currentMailbox,e.fullName,j(e.mb))),y=this.showUnsubscribed||v,b=(e,t=0)=>e.map(e=>{let r=Object.keys(e.children).length>0,i=this.expandedFolders.has(e.fullName),a=this.currentMailbox===e.fullName,o=t>0||!e.primary,s=!1,l=!1;if(o){let t=j(e.mb,`.`),n=Ue(e.fullName,t),r=n.slice(0,-1).join(t),i=this.mailboxes.map(e=>e.Name||e.Mailbox||``).filter(e=>{if(this.primaryFullNames.has(e))return!1;let i=Ue(e,t);return i.slice(0,-1).join(t)===r&&i.length===n.length}),a=this.settingsStore?.getState()?.customMailboxOrder||[];i.sort((e,t)=>{let n=a.indexOf(e),r=a.indexOf(t);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.localeCompare(t):1:-1});let o=i.indexOf(e.fullName);s=o<=0,l=o===-1||o===i.length-1}let d=f.get(e.fullName),m=e.primary??(d===void 0?void 0:u(e,d)),h=M(`folder`),g=e.name;m&&(h=M(m.icon),g=m.label);let _=e.mb?.Unseen||0,v=(e.mb?.Attrs||[]).some(e=>typeof e==`string`&&e.toLowerCase()===`\\noselect`),y=this.dropTarget===e.fullName,x=t=>{v?r&&this.toggleFolder(t,e.fullName):this.selectMailbox(e.fullName)},S=!v||r;return n`
          <div 
            class="folder-item ${a?`active`:``} ${v?`no-select`:``} ${o?`has-actions`:``} ${y?`drop-target`:``} ${y&&this.dropCopy?`drop-copy`:``}"
            title=${g}
            @click=${x}
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
              role=${S?`button`:c}
              tabindex=${S?`0`:c}
              aria-current=${a?`true`:c}
              aria-expanded=${v&&r?String(i):c}
              @keydown=${S?e=>{e.key!==`Enter`&&e.key!==` `||(e.preventDefault(),!(e.key===` `&&e.repeat)&&x(e))}:c}
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
                    ${M(`folderPlus`)} <span class="item-text">${this.i18nStore?.t(`folderList.createSubfolder`)}</span>
                  </button>
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.mailboxToRename=e.fullName,this.showRenamePrompt=!0}}>
                    ${M(`pen`)} <span class="item-text">${this.i18nStore?.t(`folderList.rename`)}</span>
                  </button>
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=!e.mb?.Subscribed;$a.setSubscribed(e.fullName,r).then(t=>{t.ok&&this.subscriptionChanged(e.fullName,r),!(t.ok||t.reason===`auth`)&&(r?this.toast(this.i18nStore?.t(`toast.subscribeFailed`),`Could not subscribe`):this.toast(this.i18nStore?.t(`toast.unsubscribeFailed`),`Could not unsubscribe`))})}}>
                    ${M(e.mb?.Subscribed?`eyeSlash`:`eye`)} <span class="item-text">${e.mb?.Subscribed?this.i18nStore?.t(`folderList.unsubscribe`):this.i18nStore?.t(`folderList.subscribe`)}</span>
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
                        ${M(`sortAscending`)} <span class="item-text">${this.i18nStore?.t(`folderList.order`)}</span>
                      </div>
                      <div class="caret-icon">${M(`caretRight`)}</div>
                    </button>
                    
                    <button class="dropdown-item" ?disabled=${s} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`top`)}}>
                      ${M(`caretDoubleUp`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveToTop`)}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${s} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`up`)}}>
                      ${M(`caretUp`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveUp`)}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${l} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`down`)}}>
                      ${M(`caretDown`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveDown`)}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${l} @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close();let r=t.target.closest(`.folder-actions`)?.querySelector(`alps-popup`);r&&r.close(),this.moveFolder(e.fullName,`bottom`)}}>
                      ${M(`caretDoubleDown`)} <span class="item-text">${this.i18nStore?.t(`folderList.moveToBottom`)}</span>
                    </button>
                  </alps-popup>


                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item" @click=${t=>{let n=t.target.closest(`alps-popup`);n&&n.close(),this.mailboxToDelete=e.fullName;let r=Pe(`trash`,this.mailboxes,ke);A(e.fullName,this.mailboxes)===`trash`||Ve(e.fullName,r,j(e.mb))?this.showDeleteConfirm=!0:this.showMoveToTrashConfirm=!0}}>
                    ${M(`trash`)} <span class="item-text">${this.i18nStore?.t(`folderList.delete`)}</span>
                  </button>
                </alps-popup>
              </div>
            `:``}

            ${_>0?n`<div class="folder-badge">${_}</div>`:``}
          </div>
          
          ${r&&i?n`
            <div class="folder-children">
              ${b(Object.values(e.children).sort((e,t)=>{let n=p.indexOf(e.fullName),r=p.indexOf(t.fullName);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.name.localeCompare(t.name):1:-1}),t+1)}
            </div>
          `:``}
        `});return n`
      <!-- Frame and content follow the strip state alps-sidebar provides.
           In the strip the content is inert, not only dimmed:
           sidebarLayoutStyles gives it pointer-events: none, which keeps the
           mouse out; inert keeps the keyboard out too, so Tab cannot walk
           into folder carets clipped past the strip's edge. Compose, above,
           stays live. -->
      <alps-sidebar-frame class="sidebar-wrapper">
        <alps-toolbar class="sidebar-header" ?scrolled=${this.isScrolled}>
          <alps-create-button 
            icon="pen"
            ?disabled=${(this.composeStore?.getState()?.activeComposers?.length||0)>=3}
            title=${this.i18nStore?.t(`folderList.compose`)}
            @click=${()=>this.dispatchEvent(new CustomEvent(`compose`))}
          >${this.i18nStore?.t(`folderList.compose`)}</alps-create-button>
        </alps-toolbar>
        <alps-sidebar-content class="sidebar-content" @scroll=${this.handleScroll}>
          <div class="sidebar-scroll-content">
            ${b(d)}
            ${d.length>0&&l.length>0?n`
              <div class="folder-separator"></div>
            `:``}
            <alps-sidebar-heading heading=${this.i18nStore?.t(`folderList.title`)??``}></alps-sidebar-heading>
            ${b(_)}
            ${g.length>0?n`
              <button
                type="button"
                class="folder-item more-row"
                aria-expanded=${y?`true`:`false`}
                title=${this.i18nStore?.t(`folderList.unsubscribedFolders`)}
                @click=${()=>{this.showUnsubscribed=!y}}
              >
                <div class="more-caret">${M(y?`caretDown`:`caretRight`)}</div>
                <div class="folder-icon">${M(`eyeSlash`)}</div>
                <div class="folder-name">${y?this.i18nStore?.t(`folderList.less`):this.i18nStore?.t(`folderList.more`)}</div>
              </button>
              ${y?b(g):``}
            `:``}
          </div>
        </alps-sidebar-content>
      </alps-sidebar-frame>

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
    `}};P([h({context:Ga})],W.prototype,`composeStore`,void 0),P([h({context:D})],W.prototype,`i18nStore`,void 0),P([h({context:nr})],W.prototype,`settingsStore`,void 0),P([o({type:Array})],W.prototype,`mailboxes`,void 0),P([o({type:String})],W.prototype,`currentMailbox`,void 0),P([o({type:Object})],W.prototype,`expandedFolders`,void 0),P([o({type:String})],W.prototype,`layoutMode`,void 0),P([o({type:Boolean})],W.prototype,`syncing`,void 0),P([h({context:xo,subscribe:!0}),a()],W.prototype,`strip`,void 0),P([a()],W.prototype,`isScrolled`,void 0),P([a()],W.prototype,`showCreatePrompt`,void 0),P([a()],W.prototype,`promptBusy`,void 0),P([a()],W.prototype,`showRenamePrompt`,void 0),P([a()],W.prototype,`mailboxToRename`,void 0),P([a()],W.prototype,`showDeleteConfirm`,void 0),P([a()],W.prototype,`showMoveToTrashConfirm`,void 0),P([a()],W.prototype,`mailboxToDelete`,void 0),P([a()],W.prototype,`parentForNewFolder`,void 0),P([a()],W.prototype,`activeKebabMenu`,void 0),P([a()],W.prototype,`dropTarget`,void 0),P([a()],W.prototype,`dropCopy`,void 0),P([a()],W.prototype,`showUnsubscribed`,void 0),W=P([p(`alps-folder-list`)],W);async function Ao(e,t){let n=new Map,r=null;for(let i=0;i<t.length;i+=200){let a=t.slice(i,i+200).map(encodeURIComponent).join(`,`),o=await N(`/mailboxes/${k(e)}/verdicts?uids=${a}`,{},void 0,{background:!0});if(!o.ok)throw Error(`verdicts request failed: ${o.status}`);let s=await o.json(),c=typeof s?.Scope==`string`?s.Scope:``;if(r!==null&&c!==r)throw Error(`verdicts were answered under different scopes`);r=c;for(let[e,t]of Object.entries(s?.Verdicts??{})){let r=t??{};n.set(e,{HasBimiPotential:r.HasBimiPotential===!0,HasBimiFailed:r.HasBimiFailed===!0})}}return{verdicts:n,scope:r??``}}var jo=class extends d{constructor(...e){super(...e),this.name=``,this.email=``,this.src=``,this.size=40,this.imageError=!1,this._handleStoreChange=()=>{this.requestUpdate()}}willUpdate(e){e.has(`src`)&&(this.imageError=!1)}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.settingsStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=v`
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
      <div class="avatar" style="${r({width:`${this.size}px`,height:`${this.size}px`,fontSize:`${s}px`,backgroundColor:We(a)})}">
        ${this.src&&!this.imageError?n`<img src="${this.src}" alt="${this.name}" @error="${()=>this.imageError=!0}" />`:this.getInitials(o)}
      </div>
    `}};P([h({context:nr})],jo.prototype,`settingsStore`,void 0),P([o({type:String})],jo.prototype,`name`,void 0),P([o({type:String})],jo.prototype,`email`,void 0),P([o({type:String})],jo.prototype,`src`,void 0),P([o({type:Number})],jo.prototype,`size`,void 0),P([a()],jo.prototype,`imageError`,void 0),jo=P([p(`alps-avatar`)],jo);var Mo=class extends d{constructor(...e){super(...e),this.name=``,this.color=``}static{this.styles=v`
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
      <div class="tag-pill" style="background-color: ${this.color}; color: ${ei(this.color)}" title=${this.name}>
        ${this.name}
      </div>
    `}};P([o({type:String})],Mo.prototype,`name`,void 0),P([o({type:String})],Mo.prototype,`color`,void 0),Mo=P([p(`alps-tag`)],Mo);var No=class extends d{constructor(...e){super(...e),this.currentPage=0,this.totalItems=0,this.itemsPerPage=50,this.currentCount=0,this.isSearch=!1,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=v`
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
    `}};P([o({type:Number})],No.prototype,`currentPage`,void 0),P([o({type:Number})],No.prototype,`totalItems`,void 0),P([o({type:Number})],No.prototype,`itemsPerPage`,void 0),P([o({type:Number})],No.prototype,`currentCount`,void 0),P([o({type:Boolean})],No.prototype,`isSearch`,void 0),P([h({context:D})],No.prototype,`i18nStore`,void 0),No=P([p(`alps-pagination`)],No);var Po=class extends d{constructor(...e){super(...e),this.variant=`info`}static{this.styles=v`
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
    `}};P([o({type:String,reflect:!0})],Po.prototype,`variant`,void 0),Po=P([p(`alps-banner`)],Po);var Fo=new Set([`is:starred`,`is:unread`]),Io=5e3,Lo=0;typeof window<`u`&&(window.addEventListener(`session-cleared`,()=>{Lo++}),window.addEventListener(`user-logged-in`,()=>{Lo++}));var G=class extends d{constructor(...e){super(...e),this.messages=[],this.currentMailbox=``,this.mailboxes=[],this.currentMailboxRole=``,this.listedMailbox=``,this.listedMailboxRole=``,this.loading=!1,this.selectedMessage=null,this.layoutMode=`vertical`,this.isMobile=!1,this.sidebarCollapsed=!1,this.currentPage=0,this.listedPage=0,this.totalMessages=0,this.messagesPerPage=50,this.filterQuery=``,this.sortOrder=`desc`,this.densityMode=`compact`,this.showSenderAvatars=!0,this.selectedMessages=new Set,this.selectAllMatching=!1,this.matchingCount=0,this.syncing=!1,this.loadFailed=!1,this.isSpinning=!1,this.isScrolled=!1,this.isAtBottom=!1,this.focusedIndex=-1,this.showEmptyConfirm=!1,this.emptying=!1,this.expandedThreads=new Set,this.draggingKeys=null,this.verdicts=new Map,this.verdictScopes=new Map,this.verdictsAsked=new Set,this.verdictsConfirmed=new Set,this.verdictsSignIn=Lo,this.verdictGeneration=0,this.verdictsRunning=!1,this.verdictsRerun=!1,this._shouldScrollToTop=!1,this._uidsBeforeCheck=null,this._arrivedIndex=-1,this._handleStoreChange=()=>{this.requestUpdate()},this.handleSyncStart=()=>{this.syncing=!0,this.isSpinning=!0},this.handleSyncEnd=()=>{this.syncing=!1},this.handleSpinIteration=()=>{this.syncing||(this.isSpinning=!1)},this.handleScroll=e=>{this.checkScrollState(e.target)},this.endDrag=()=>{this.draggingKeys=null,window.removeEventListener(`drop`,this.endDrag,!0),window.removeEventListener(`dragend`,this.endDrag,!0)}}static{this.styles=[Dn,v`
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
      background: var(--accent-fill, #eab308);
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
  `]}get visibleMessages(){let e=[];for(let t of this.messages||[])e.push(t),t.SubMessages&&t.SubMessages.length>0&&this.isThreadExpanded(String(t.UID))&&e.push(...t.SubMessages);return e}leaveVerdicts(){this.verdictGeneration++,this.verdictsConfirmed=new Set,this.verdicts.size>Io&&(this.verdicts=new Map,this.verdictScopes=new Map),this.verdictsAsked=new Set([...this.verdictsAsked].filter(e=>this.verdicts.has(e)))}forgetVerdicts(){this.verdictGeneration++,this.verdictsSignIn=Lo,this.verdicts=new Map,this.verdictScopes=new Map,this.verdictsAsked=new Set,this.verdictsConfirmed=new Set}mailboxOf(e){return Cr(e,this.currentMailbox)}keyOf(e){return L(this.mailboxOf(e),e?.UID)}async refreshVerdicts(){if(this.verdictsRunning){this.verdictsRerun=!0;return}this.verdictsRunning=!0;try{await this.askVerdicts()}finally{this.verdictsRunning=!1,this.verdictsRerun&&(this.verdictsRerun=!1,this.refreshVerdicts())}}get drawsAvatars(){return this.showSenderAvatars&&this.densityMode!==`ultra-compact`}async askVerdicts(){let e=this.currentMailbox;if(!e||!this.drawsAvatars)return;let t=this.verdictGeneration,n=Lo,r=()=>e===this.currentMailbox&&t===this.verdictGeneration&&n===Lo,i=new Map,a=new Map,o=t=>{let n=t?.UID==null?``:String(t.UID),r=this.mailboxOf(t);if(!n||e!==`*`&&r!==e)return;let o=L(r,n);if(rt(t)){if(this.verdictsAsked.has(o)){!this.verdictsConfirmed.has(r)&&this.verdicts.has(o)&&!a.has(r)&&a.set(r,n);return}this.verdictsAsked.add(o),i.has(r)||i.set(r,[]),i.get(r).push(n)}};for(let e of this.messages||[])o(e),e?.SubMessages?.length&&this.isThreadExpanded(String(e.UID))&&e.SubMessages.forEach(o);for(let[e,t]of a)i.has(e)||i.set(e,[t]);let s=[];for(let[e,t]of i)for(let n of t)s.push({mailbox:e,uid:n});let c=e=>{for(let t of s.slice(e))this.verdictsAsked.delete(L(t.mailbox,t.uid))},l=0;for(;l<s.length;){if(await Kt(),!r())return;if(this.loading){c(l);return}let e=s[l].mailbox,t=l;for(;t<s.length&&t-l<3&&s[t].mailbox===e;)t++;let n=s.slice(l,t).map(e=>e.uid),i;try{i=await Ao(e,n)}catch{r()&&c(l);return}if(!r())return;let a=new Map(this.verdicts),o=this.verdictScopes.get(e),u=!1;if(i.scope&&o&&i.scope!==o){let r=L(e,``);for(let e of[...a.keys()])e.startsWith(r)&&a.delete(e);for(let e of[...this.verdictsAsked])e.startsWith(r)&&this.verdictsAsked.delete(e);for(let t of n)this.verdictsAsked.add(L(e,t));c(t),u=!0}i.scope&&this.verdictScopes.set(e,i.scope),this.verdictsConfirmed.add(e);for(let[t,n]of i.verdicts)a.set(L(e,t),n);if(this.verdicts=a,u){this.verdictsRerun=!0;return}l=t}}withVerdict(e){let t=this.mailboxOf(e);if(!this.verdictsConfirmed.has(t))return e;let n=this.verdicts.get(L(t,String(e?.UID)));return n?{...e,...n}:e}isThreadExpanded(e){return this.expandedThreads.has(e)}toggleThreadCollapse(e,t){e.stopPropagation();let n=new Set(this.expandedThreads);n.has(t)?n.delete(t):n.add(t),this.expandedThreads=n}rowKeys(e){let t=this.keyOf(e);return!e.SubMessages?.length||this.isThreadExpanded(String(e.UID))?[t]:[t,...e.SubMessages.map(e=>this.keyOf(e))]}rowMessages(e){return!e.SubMessages?.length||this.isThreadExpanded(String(e.UID))?[e]:[e,...e.SubMessages]}rowSelection(e){let t=this.rowKeys(e),n=t.filter(e=>this.selectedMessages.has(e)).length;return n===0?`none`:n===t.length?`all`:`some`}toggleRow(e){let t=this.rowKeys(e),n=this.rowSelection(e)===`all`,r=new Set(this.selectedMessages);for(let e of t)n?r.delete(e):r.add(e);this.setSelection(r)}get pageKeys(){let e=[];for(let t of this.messages||[]){e.push(this.keyOf(t));for(let n of t.SubMessages||[])e.push(this.keyOf(n))}return e}get allOnPageSelected(){let e=this.pageKeys;return e.length>0&&e.every(e=>this.selectedMessages.has(e))}get canSelectAllMatching(){return this.currentMailbox!==`*`&&this.totalMessages>this.pageKeys.length}handleSelectAll(e){let t=e.target.checked;if(!t&&this.selectAllMatching){this.dispatchEvent(new CustomEvent(`clear-selection`));return}this.setSelection(t?new Set(this.pageKeys):new Set)}setSelection(e){this.selectedMessages=e,this.dispatchEvent(new CustomEvent(`selection-changed`,{detail:{selectedKeys:e}}))}isOpen(e){return!!this.selectedMessage&&this.keyOf(this.selectedMessage)===this.keyOf(e)}connectedCallback(){super.connectedCallback(),R.addEventListener(`sync-start`,this.handleSyncStart),R.addEventListener(`sync-success`,this.handleSyncEnd),R.addEventListener(`sync-error`,this.handleSyncEnd),R.addEventListener(`sync-unchanged`,this.handleSyncEnd),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.endDrag(),R.removeEventListener(`sync-start`,this.handleSyncStart),R.removeEventListener(`sync-success`,this.handleSyncEnd),R.removeEventListener(`sync-error`,this.handleSyncEnd),R.removeEventListener(`sync-unchanged`,this.handleSyncEnd),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}willUpdate(e){if(super.willUpdate(e),this.verdictsSignIn===Lo?e.has(`currentMailbox`)&&this.leaveVerdicts():this.forgetVerdicts(),(e.has(`currentMailbox`)||e.has(`currentPage`)||e.has(`filterQuery`)||e.has(`sortOrder`))&&(!this.selectAllMatching&&this.selectedMessages.size>0&&this.setSelection(new Set),this.focusedIndex=-1,this._shouldScrollToTop=!0,this._uidsBeforeCheck=null),this._uidsBeforeCheck&&e.has(`syncing`)&&!this.syncing){let t=this._uidsBeforeCheck;if(this._uidsBeforeCheck=null,e.has(`messages`)){let e=(this.messages||[]).findIndex(e=>Number(e.UID)>(t.get(this.mailboxOf(e))??0));e!==-1&&(this._arrivedIndex=this.visibleMessages.indexOf(this.messages[e]))}}if(e.has(`messages`)&&this.draggingKeys){let e=new Set(this.pageKeys);this.draggingKeys.some(t=>e.has(t))||this.endDrag()}if(e.has(`selectedMessage`)||e.has(`messages`)){if(e.has(`messages`)&&this.messages&&!this.selectAllMatching&&this.selectedMessages.size>0){let e=new Set(this.pageKeys),t=new Set([...this.selectedMessages].filter(t=>e.has(t)));t.size!==this.selectedMessages.size&&this.setSelection(t)}if(this.selectedMessage){if(this.messages){let e=!1,t=new Set(this.expandedThreads);for(let n of this.messages)if(n.SubMessages&&n.SubMessages.some(e=>this.isOpen(e))){let r=String(n.UID);t.has(r)||(t.add(r),e=!0)}e&&(this.expandedThreads=t)}let e=this.visibleMessages;if(e.length>0){let t=e.findIndex(e=>this.isOpen(e));t!==-1&&(this.focusedIndex=t)}}}}checkScrollState(e){if(!e)return;let t=e.scrollTop>0;this.isScrolled!==t&&(this.isScrolled=t,this.dispatchEvent(new CustomEvent(`list-scrolled`,{detail:{scrolled:t}})));let n=e.scrollHeight<=e.clientHeight||Math.ceil(e.scrollTop+e.clientHeight)>=e.scrollHeight;this.isAtBottom!==n&&(this.isAtBottom=n)}updated(e){super.updated(e),(e.has(`messages`)||e.has(`expandedThreads`)||e.has(`currentMailbox`)||e.has(`showSenderAvatars`)||e.has(`densityMode`)||e.has(`loading`)&&!this.loading)&&this.refreshVerdicts(),e.has(`densityMode`)&&(this.classList.remove(`density-loose`,`density-normal`,`density-compact`,`density-ultra-compact`),this.classList.add(`density-${this.densityMode}`)),e.has(`syncing`)&&this.syncing&&(this.isSpinning=!0);let t=e.get(`selectedMessage`);if(e.has(`selectedMessage`)&&this.selectedMessage&&!(t&&this.isOpen(t))&&setTimeout(()=>{let e=this.renderRoot.querySelector(`.list-content`)?.querySelector(`.message-item.active`);e&&e.scrollIntoView({behavior:`smooth`,block:`center`})},50),this._shouldScrollToTop&&(e.has(`messages`)||e.has(`loading`)&&!this.loading)){let e=this.renderRoot.querySelector(`.list-content`);e&&(e.scrollTop=0),this._shouldScrollToTop=!1}if(this._arrivedIndex!==-1){let e=this._arrivedIndex;this._arrivedIndex=-1;let t=this.renderRoot.querySelector(`.list-content`);e===0?t&&(t.scrollTop=0):t?.querySelectorAll(`.message-item`)[e]?.scrollIntoView({block:`nearest`})}let n=this.renderRoot.querySelector(`.list-content`);n&&requestAnimationFrame(()=>{this.checkScrollState(n)})}checkForNew(){let e=new Map;for(let t of this.messages||[]){let n=this.mailboxOf(t);e.set(n,Math.max(e.get(n)??0,Number(t.UID)||0))}this._uidsBeforeCheck=e,this.dispatchEvent(new CustomEvent(`refresh`))}selectMessage(e){this.selectedMessages.size>0&&this.setSelection(new Set),this.dispatchEvent(new CustomEvent(`select-message`,{detail:{message:e}}))}moveCursor(e){let t=this.visibleMessages;this.focusedIndex=e>0?Math.min(t.length-1,this.focusedIndex+1):Math.max(0,this.focusedIndex-1),this.scrollToFocused()}step(e){this.visibleMessages.length!==0&&(this.renderRoot.querySelector(`.list-content`)?.focus({preventScroll:!0}),this.moveCursor(e))}handleKeyDown(e){let t=this.visibleMessages;!t||t.length===0||(e.key===`ArrowDown`?(e.preventDefault(),this.moveCursor(1)):e.key===`ArrowUp`?(e.preventDefault(),this.moveCursor(-1)):e.key===`Enter`?(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length&&this.selectMessage(t[this.focusedIndex])):e.key===` `&&(e.preventDefault(),this.focusedIndex>=0&&this.focusedIndex<t.length&&(this.toggleRow(t[this.focusedIndex]),this.focusedIndex=Math.min(t.length-1,this.focusedIndex+1),this.scrollToFocused())))}get countsConversations(){return this.messages.some(e=>(e?.ThreadCount??0)>0)}get folderTitle(){return Ze(this.currentMailbox,this.i18nStore,this.mailboxes)}get emptyConfirmMessage(){let e=this.folderTitle,t=this.totalMessages,n=this.countsConversations?`messageList.emptyMailboxConfirmConversations`:`messageList.emptyMailboxConfirm`,r=this.i18nStore?.t(n,{folder:e,count:t})||(this.countsConversations?`Are you sure you want to permanently delete all ${t} conversations in ${e}, and every message in them? This action cannot be undone.`:`Are you sure you want to permanently delete all ${t} messages in ${e}? This action cannot be undone.`),i=this.selectedMessages.size;return i===0?r:`${r} ${this.i18nStore?.t(`messageList.emptyMailboxSelectionNote`,{count:i})||`This includes the ${i} messages you have checked.`}`}toast(e,t){this.dispatchEvent(new CustomEvent(`toast`,{detail:{type:e,message:t},bubbles:!0,composed:!0}))}async handleEmptyMailbox(){if(this.emptying)return;this.showEmptyConfirm=!1,this.emptying=!0;let e=this.currentMailbox,t=this.folderTitle;this.toast(`info`,this.i18nStore?.t(`messageList.emptyingMailbox`,{folder:t})||`Emptying ${t}...`);try{let n=await $a.emptyMailbox(e);n.ok&&n.discarded===0?this.toast(`info`,this.i18nStore?.t(`messageList.mailboxAlreadyEmpty`,{folder:t})||`${t} was already empty — nothing was deleted.`):n.ok?this.toast(`success`,this.i18nStore?.t(`messageList.mailboxEmptied`,{folder:t})||`${t} emptied.`):n.reason===`timeout`?this.toast(`error`,this.i18nStore?.t(`messageList.emptyMailboxSlow`,{folder:t})||`Still emptying ${t}. The server is working on it — check the folder again in a moment.`):n.reason!==`auth`&&this.toast(`error`,this.i18nStore?.t(`messageList.emptyMailboxFailed`,{folder:t})||`Failed to empty ${t}.`)}finally{this.emptying=!1}}scrollToFocused(){this.updateComplete.then(()=>{let e=this.renderRoot.querySelector(`.message-item.focused`);e&&e.scrollIntoView({block:`nearest`})})}get isDiscardableFolder(){let e=this.currentMailboxRole;return e!==`trash`&&e!==`junk`?!1:(Fe(e,this.mailboxes)??this.currentMailbox)===this.currentMailbox}get rowsAreCurrent(){return!this.listedMailbox||this.listedMailbox===this.currentMailbox}get rowMailbox(){return this.rowsAreCurrent?this.currentMailbox:this.listedMailbox}get rowRole(){return this.rowsAreCurrent?this.currentMailboxRole:this.listedMailboxRole}renderMessageItem(e,t=!1,r=!1,i=!1){let a=this.rowRole,o=a===`drafts`||a===`sent`,s=this.rowMailbox===`*`,l=[];o?(l=[...e.Envelope?.To||[],...e.Envelope?.Cc||[]],l.length||(l=e.Envelope?.From||[])):l=[...e.Envelope?.From||[],...e.Envelope?.To||[],...e.Envelope?.Cc||[]];let u=new Set,d=[];for(let e of l){let t=(e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``)||e.Name||`unknown`;t!==`unknown`&&!u.has(t)?(u.add(t),d.push(e)):t===`unknown`&&d.push(e)}let f=ir(this.settingsStore?.getState()).toLowerCase(),p=e=>{let t=e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`.toLowerCase():``;return!!(f&&t===f)};if(d.length>1){let e=d.filter(e=>!p(e));e.length>0&&(d=e)}d.length||(d=[{}]);let m=o?`messageReader.noRecipients`:`messageList.unknownSender`,h=d.map((e,t)=>{let r=e.Mailbox&&e.Host?`${e.Mailbox}@${e.Host}`:``,i=e.Name?n`<bdi>${e.Name}</bdi>${r&&xn(r).warning?n` &lt;${En(r)}&gt;`:``}`:r?En(r):this.i18nStore?.t(m)||this.i18nStore?.t(`messageList.unknown`);return n`${t?`, `:``}<span title=${r||c}>${i}${An(r,this.i18nStore)}</span>`}),g=this.isMobile?1:3,_=d.slice(0,g),v=d.length-g,y=_.length+ +(v>0),b=e.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`),x=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,S=String(this.settingsStore?.getState()?.hourFormat||`12`),C=e.Envelope?.Date?Ge(e.Envelope.Date,x,S):``,w=e.RFC822Size||e.Size,ee=w?et(w,this.i18nStore):``,te=e.SubMessages&&e.SubMessages.length>0,ne=this.isThreadExpanded(String(e.UID)),T=this.rowSelection(e),re=e=>!e?.Flags||!e.Flags.includes(`\\Seen`),ie=re(e)||!t&&!!te&&!ne&&e.SubMessages.some(re),ae=this.rowMessages(e).some(e=>e.Flags?.includes(B)),oe=e.Flags&&e.Flags.includes(`\\Answered`),se=e.Flags&&e.Flags.includes(`$Forwarded`),ce=Yr(e.Flags,this.i18nStore),le=this.densityMode===`loose`?48:this.densityMode===`compact`?24:40;return this.densityMode===`ultra-compact`?n`
      <div class="message-item ${t?`sub-message-item`:``} ${r?`first-sub-item`:``} ${i?`last-sub-item`:``} ${this.selectedMessages.size===0&&this.isOpen(e)||T!==`none`?`active`:``} ${ie?`unread`:``} ${ae?`starred`:``} ${this.focusedIndex===this.visibleMessages.indexOf(e)?`focused`:``} ${this.isDragged(e)?`is-dragging`:``}"
        draggable=${this.isMobile?`false`:`true`}
        @dragstart=${t=>this.handleDragStart(t,e)}
        @dragend=${this.endDrag}
        @click=${()=>this.selectMessage(e)}>
        <div class="checkbox-col" @click=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
          <input type="checkbox" class="message-checkbox" 
            .checked=${T===`all`}
            .indeterminate=${T===`some`}
            @click=${e=>e.stopPropagation()}
            @change=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
        </div>

        <!-- Caret Toggle Button -->
        ${!t&&te?n`
          <div class="caret-col" @click=${t=>this.toggleThreadCollapse(t,String(e.UID))}>
            ${M(ne?`caretDown`:`caretRight`)}
            <span class="thread-count-caret-badge" title="${e.ThreadCount} messages">${e.ThreadCount}</span>
          </div>
        `:t?n`<div class="caret-col empty"></div>`:``}

        <div class="message-sender">${h}</div>
        <div @click=${t=>this.toggleStar(t,e)} class="star-btn ${ae?`starred`:``} star-btn-wrapper-ultra">
          ${M(ae?`starFourFill`:`starFour`)}
        </div>
        ${oe||se?n`
          <div class="indicators-wrapper-ultra">
            ${oe?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.replied`)}>${M(`arrowBendUpLeft`)}</div>`:``}
            ${se?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.forwarded`)}>${M(`arrowBendUpRight`)}</div>`:``}
          </div>
        `:``}
        ${ce.length>0?n`
          <div class="tag-pills">
            ${ce.map(e=>n`
              <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
            `)}
          </div>
        `:``}
        ${s&&e.Mailbox?n`
          <span class="mailbox-badge" title="Folder: ${e.Mailbox}">${e.Mailbox}</span>
        `:``}
        <div class="message-subject" dir="auto">
          ${b}
        </div>
        <div class="message-indicators">
          <div class="attachment-col">
            ${e.HasAttachments?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.hasAttachments`)}>${M(`paperclipHorizontal`)}</div>`:``}
          </div>
          <div class="message-date">${C}</div>
        </div>
      </div>
      `:n`
    <div class="message-item ${t?`sub-message-item`:``} ${r?`first-sub-item`:``} ${i?`last-sub-item`:``} ${this.selectedMessages.size===0&&this.isOpen(e)||T!==`none`?`active`:``} ${ie?`unread`:``} ${ae?`starred`:``} ${this.focusedIndex===this.visibleMessages.indexOf(e)?`focused`:``} ${this.isDragged(e)?`is-dragging`:``}"
        draggable=${this.isMobile?`false`:`true`}
        @dragstart=${t=>this.handleDragStart(t,e)}
        @dragend=${this.endDrag}
        @click=${()=>this.selectMessage(e)}>
      <div class="checkbox-col" @click=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
        <input type="checkbox" class="message-checkbox" 
          .checked=${T===`all`}
          .indeterminate=${T===`some`}
          @click=${e=>e.stopPropagation()}
          @change=${t=>{t.stopPropagation(),this.toggleRow(e)}}>
      </div>

      <!-- Caret Toggle Button -->
      ${!t&&te?n`
        <div class="caret-col" @click=${t=>this.toggleThreadCollapse(t,String(e.UID))}>
          ${M(ne?`caretDown`:`caretRight`)}
          <span class="thread-count-caret-badge" title="${e.ThreadCount} messages">${e.ThreadCount}</span>
        </div>
      `:t?n`<div class="caret-col empty"></div>`:``}

      ${this.showSenderAvatars?n`
        <div class="avatar-stack">
          ${_.map((t,r)=>{let i=t.Mailbox&&t.Host?`${t.Mailbox}@${t.Host}`:``,a=t.Name||i||this.i18nStore?.t(m)||this.i18nStore?.t(`messageList.unknown`),o=it(this.withVerdict(e),t);return n`
              <div class="avatar-wrapper" style="z-index: ${y-r};">
                <alps-avatar .name=${a} .email=${i} .size=${le} .src=${o}></alps-avatar>
              </div>
            `})}
          ${v>0?n`
            <div class="avatar-wrapper extra-count" style="width: ${le}px; height: ${le}px; z-index: 0;">
              +${v}
            </div>
          `:``}
        </div>
      `:``}
      <div class="message-details">
        <div class="message-header-row">
          <div class="message-header-inner">
            <div class="message-sender">${h}</div>
            <div @click=${t=>this.toggleStar(t,e)} class="star-btn ${ae?`starred`:``}">
              ${M(ae?`starFourFill`:`starFour`)}
            </div>
          </div>
          <div class="message-indicators">
            <div class="attachment-col">
              ${e.HasAttachments?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.hasAttachments`)}>${M(`paperclipHorizontal`)}</div>`:``}
            </div>
            <div class="message-date">${C}</div>
          </div>
        </div>
        <div class="message-subject-row">
          ${oe||se?n`
            <div class="indicators-wrapper">
              ${oe?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.replied`)}>${M(`arrowBendUpLeft`)}</div>`:``}
              ${se?n`<div class="indicator-icon" title=${this.i18nStore?.t(`messageList.forwarded`)}>${M(`arrowBendUpRight`)}</div>`:``}
            </div>
          `:``}
          ${ce.length>0?n`
            <div class="tag-pills">
              ${ce.map(e=>n`
                <alps-tag .name=${e.name} .color=${e.color}></alps-tag>
              `)}
            </div>
          `:``}
          ${s&&e.Mailbox?n`
            <span class="mailbox-badge" title="Folder: ${e.Mailbox}">${e.Mailbox}</span>
          `:``}
          <div class="message-subject" dir="auto">
            ${b}
          </div>
          ${ee?n`<div class="message-size">${ee}</div>`:``}
        </div>
      </div>
    </div>
    `}handleDragStart(e,t){let n=e.dataTransfer;if(!n)return;let r=this.rowKeys(t),i=r.some(e=>this.selectedMessages.has(e)),a=i?[...this.selectedMessages]:r,o={keys:a,selection:i},s=i&&this.selectAllMatching?this.matchingCount:a.length,c=s>1?this.i18nStore?.t(`messageList.dragCount`,{count:s})||`${s}`:t.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`)||``;n.setData(eo,JSON.stringify(o)),n.setData(`text/plain`,c),n.effectAllowed=`copyMove`,this.setDragImage(n,c),this.draggingKeys=a,window.addEventListener(`drop`,this.endDrag,!0),window.addEventListener(`dragend`,this.endDrag,!0)}setDragImage(e,t){if(typeof e.setDragImage!=`function`)return;let n=document.createElement(`div`);n.textContent=t,Object.assign(n.style,{position:`absolute`,top:`-1000px`,left:`-1000px`,maxWidth:`280px`,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`,padding:`6px 12px`,borderRadius:`16px`,background:`var(--accent-fill, #005A9E)`,color:`#fff`,font:`500 13px/1.4 var(--font-base, sans-serif)`,boxShadow:`0 4px 12px rgba(0, 0, 0, 0.18)`,pointerEvents:`none`}),n.dir=`auto`,document.body.appendChild(n),e.setDragImage(n,15,15),setTimeout(()=>n.remove(),0)}isDragged(e){return!!this.draggingKeys&&this.rowKeys(e).some(e=>this.draggingKeys.includes(e))}toggleStar(e,t){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-star-message`,{detail:{message:t,messages:this.rowMessages(t)}}))}get isTextSearch(){return this.filterQuery!==``&&!Fo.has(this.filterQuery)}render(){return n`
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
    `}};P([h({context:nr})],G.prototype,`settingsStore`,void 0),P([h({context:D})],G.prototype,`i18nStore`,void 0),P([o({type:Array})],G.prototype,`messages`,void 0),P([o({type:String})],G.prototype,`currentMailbox`,void 0),P([o({type:Array})],G.prototype,`mailboxes`,void 0),P([o({type:String})],G.prototype,`currentMailboxRole`,void 0),P([o({type:String})],G.prototype,`listedMailbox`,void 0),P([o({type:String})],G.prototype,`listedMailboxRole`,void 0),P([o({type:Boolean})],G.prototype,`loading`,void 0),P([o({type:Object})],G.prototype,`selectedMessage`,void 0),P([o({type:String})],G.prototype,`layoutMode`,void 0),P([o({type:Boolean})],G.prototype,`isMobile`,void 0),P([o({type:Boolean})],G.prototype,`sidebarCollapsed`,void 0),P([o({type:Number})],G.prototype,`currentPage`,void 0),P([o({type:Number})],G.prototype,`listedPage`,void 0),P([o({type:Number})],G.prototype,`totalMessages`,void 0),P([o({type:Number})],G.prototype,`messagesPerPage`,void 0),P([o({type:String})],G.prototype,`filterQuery`,void 0),P([o({type:String})],G.prototype,`sortOrder`,void 0),P([o({type:String})],G.prototype,`densityMode`,void 0),P([o({type:Boolean})],G.prototype,`showSenderAvatars`,void 0),P([o({type:Object})],G.prototype,`selectedMessages`,void 0),P([o({type:Boolean})],G.prototype,`selectAllMatching`,void 0),P([o({type:Number})],G.prototype,`matchingCount`,void 0),P([o({type:Boolean})],G.prototype,`syncing`,void 0),P([o({type:Boolean})],G.prototype,`loadFailed`,void 0),P([a()],G.prototype,`isSpinning`,void 0),P([a()],G.prototype,`isScrolled`,void 0),P([a()],G.prototype,`isAtBottom`,void 0),P([a()],G.prototype,`focusedIndex`,void 0),P([a()],G.prototype,`showEmptyConfirm`,void 0),P([a()],G.prototype,`emptying`,void 0),P([a()],G.prototype,`expandedThreads`,void 0),P([a()],G.prototype,`draggingKeys`,void 0),P([a()],G.prototype,`verdicts`,void 0),G=P([p(`alps-message-list`)],G);var Ro=class extends d{constructor(...e){super(...e),this.name=``,this.address=``,this._handleI18nChange=()=>this.requestUpdate()}connectedCallback(){super.connectedCallback(),this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}static{this.styles=[Dn,v`
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
  `]}handleClick(){this.composeStore.openComposer({to:[this.address]})}render(){let e=this.name;e===this.address&&(e=``);let t=En(this.address),r=An(this.address,this.i18nStore);return e?n`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          <bdi class="recipient-name">${e}</bdi>
          <span class="recipient-address">&lt;${t}&gt;</span>${r}
        </a>
      `:n`
        <a class="recipient-link" title="${this.address}" @click=${this.handleClick}>
          ${t}${r}
        </a>
      `}};P([h({context:Ga})],Ro.prototype,`composeStore`,void 0),P([h({context:D})],Ro.prototype,`i18nStore`,void 0),P([o({type:String})],Ro.prototype,`name`,void 0),P([o({type:String})],Ro.prototype,`address`,void 0),Ro=P([p(`alps-recipient-pill`)],Ro);function zo(e,t,n){if(!e||t===void 0||t===``||!n)return``;let r=Array.isArray(n.Path)?n.Path.join(`.`):String(n.Path??``);return r?`/mailboxes/${k(e)}/messages/${t}/raw?part=${r}`:``}var Bo=new Set([`png`,`jpg`,`jpeg`,`gif`,`webp`,`svg`,`avif`,`bmp`,`ico`,`tiff`,`tif`,`heic`,`heif`]),Vo=new Set([`pdf`]),Ho=new Set([`doc`,`docx`,`odt`,`rtf`,`pages`,`dotx`,`docm`]),Uo=new Set([`xls`,`xlsx`,`csv`,`tsv`,`ods`,`numbers`,`xlsm`]),Wo=new Set([`ppt`,`pptx`,`odp`,`key`,`potx`,`ppsx`]),Go=new Set([`zip`,`tar`,`gz`,`rar`,`7z`,`bz2`,`xz`,`tgz`,`iso`,`dmg`,`pkg`,`deb`,`rpm`]),Ko=new Set(`js.mjs.cjs.ts.mts.cts.jsx.tsx.json.json5.html.htm.css.scss.sass.less.py.go.rs.c.cpp.h.hpp.java.kt.sh.bash.zsh.yml.yaml.sql.xml.md.markdown.toml.ini.env.diff.patch.php.rb.swift.graphql.gql.proto.vue.svelte.rust`.split(`.`)),qo=new Set([`txt`,`text`,`log`,`nfo`,`sub`,`srt`]),Jo=new Set([`mp3`,`wav`,`ogg`,`m4a`,`flac`,`aac`,`wma`,`aiff`,`opus`,`mid`,`midi`]),Yo=new Set([`mp4`,`webm`,`mov`,`mkv`,`avi`,`wmv`,`flv`,`m4v`,`3gp`,`ogv`]),Xo=new Set([`ics`,`ical`,`ifb`]),Zo=new Set([`vcf`,`vcard`]);function Qo(e){if(!e)return``;let t=e.lastIndexOf(`.`);return t===-1||t===e.length-1?``:e.slice(t+1).toLowerCase()}function $o(e,t){let n=(e||``).toLowerCase().trim(),r=Qo(t);if(n===`application/pdf`||Vo.has(r))return{category:`pdf`,icon:`filePdf`,themeClass:`type-pdf`,color:`#ef4444`,previewKind:`pdf`,isImage:!1,isPdf:!0,isAudio:!1,isVideo:!1,isPreviewable:!0};if(n.startsWith(`image/`)||Bo.has(r))return{category:`image`,icon:`image`,themeClass:`type-image`,color:`#10b981`,previewKind:`image`,isImage:!0,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0};if(n.startsWith(`audio/`)||Jo.has(r))return{category:`audio`,icon:`fileAudio`,themeClass:`type-audio`,color:`#f59e0b`,previewKind:`audio`,isImage:!1,isPdf:!1,isAudio:!0,isVideo:!1,isPreviewable:!0};if(n.startsWith(`video/`)||Yo.has(r))return{category:`video`,icon:`fileVideo`,themeClass:`type-video`,color:`#f43f5e`,previewKind:`video`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!0,isPreviewable:!0};if(Ko.has(r)||n===`application/json`||n===`application/ld+json`||n===`application/xml`||n===`application/javascript`||n===`text/javascript`||n===`text/css`||n===`text/html`||n===`text/markdown`||n===`text/x-python`||n===`text/x-shellscript`)return{category:`code`,icon:`fileCode`,themeClass:`type-code`,color:`#8b5cf6`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0};if(Uo.has(r)||n.includes(`spreadsheet`)||n.includes(`excel`)||n===`text/csv`||n===`text/tab-separated-values`){let e=r===`csv`||r===`tsv`||n===`text/csv`||n===`text/tab-separated-values`;return{category:`spreadsheet`,icon:`fileXls`,themeClass:`type-spreadsheet`,color:`#059669`,previewKind:e?`text`:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:e}}return Ho.has(r)||n.includes(`word`)||n.includes(`officedocument.wordprocessingml`)||n===`application/rtf`?{category:`document`,icon:`fileDoc`,themeClass:`type-document`,color:`#3b82f6`,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}:Wo.has(r)||n.includes(`presentation`)||n.includes(`powerpoint`)?{category:`presentation`,icon:`filePpt`,themeClass:`type-presentation`,color:`#f59e0b`,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}:Go.has(r)||n.includes(`zip`)||n.includes(`tar`)||n.includes(`compressed`)||n.includes(`archive`)?{category:`archive`,icon:`fileArchive`,themeClass:`type-archive`,color:`#64748b`,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}:Xo.has(r)||n===`text/calendar`?{category:`calendar`,icon:`calendarBlank`,themeClass:`type-calendar`,color:`#0ea5e9`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0}:Zo.has(r)||n===`text/vcard`||n===`text/x-vcard`?{category:`contact`,icon:`user`,themeClass:`type-contact`,color:`#14b8a6`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0}:qo.has(r)||n.startsWith(`text/`)?{category:`text`,icon:`fileText`,themeClass:`type-text`,color:`#6b7280`,previewKind:`text`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!0}:{category:`generic`,icon:`file`,themeClass:`type-generic`,color:``,previewKind:`none`,isImage:!1,isPdf:!1,isAudio:!1,isVideo:!1,isPreviewable:!1}}var es=class extends d{constructor(...e){super(...e),this.attachment=null,this.downloadUrl=``,this.fallbackName=`Unknown attachment`,this.removable=!1,this.compact=!1,this.imgError=!1}willUpdate(e){e.has(`attachment`)&&(this.imgError=!1)}static{this.styles=v`
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
  `}get name(){let e=this.attachment;return e.Filename||e.filename||e.name||this.fallbackName}typeInfo(){let e=this.attachment;return $o(e.MIMEType||e.contentType||e.type,this.name)}uploadProgress(e,t){return this.i18nStore?.t(`attachment.uploadProgress`,{percent:e,size:et(t,this.i18nStore)})||`${e}% of ${et(t,this.i18nStore)}`}_handlePreview(e){this.removable||!this.downloadUrl||!this.typeInfo().isPreviewable||(e.preventDefault(),e.stopPropagation(),this.dispatchEvent(new CustomEvent(`preview-attachment`,{bubbles:!0,composed:!0,detail:{attachment:this.attachment}})))}_handleRemove(e){e.preventDefault(),e.stopPropagation(),this.dispatchEvent(new CustomEvent(`remove-attachment`,{bubbles:!0,composed:!0,detail:{attachment:this.attachment}}))}render(){if(!this.attachment)return n``;let e=this.name,t=this.attachment.Size||this.attachment.size||0,r=this.attachment.uploading,i=this.attachment.progress||0,a=this.typeInfo(),o=!this.removable&&!!this.downloadUrl&&a.isPreviewable,s=a.isImage&&this.downloadUrl&&!this.imgError,c=n`
      ${r?n`<div class="progress-bar" style="width: ${i}%"></div>`:``}
      ${s?n`
        <div class="attachment-thumb">
          <img src="${this.downloadUrl}" alt="" loading="lazy" @error=${()=>{this.imgError=!0}} />
        </div>
      `:n`
        <div
          class="attachment-icon typed ${a.themeClass}"
          style="${a.color?`color: ${a.color}; background: color-mix(in srgb, ${a.color} 12%, transparent)`:``}"
        >${M(a.icon)}</div>
      `}
      <span class="attachment-name">${e}</span>
      ${this.attachment.missing?n`
        <span class="attachment-size missing">${this.i18nStore?.t(`attachment.addAgain`)}</span>
      `:n`
        <span class="attachment-size">${r?this.uploadProgress(i,t):et(t,this.i18nStore)}</span>
      `}
      ${o?n`
        <button class="preview-btn" @click=${this._handlePreview} title="${this.i18nStore?.t(`attachment.preview`)}">
          ${M(`eye`)}
        </button>
      `:``}
      ${this.removable?n`
        <button class="remove-btn" @click=${this._handleRemove} title="${this.i18nStore?.t(`attachment.remove`)}">
          ${M(`x`)}
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
      `}};P([h({context:D})],es.prototype,`i18nStore`,void 0),P([o({type:Object})],es.prototype,`attachment`,void 0),P([o({type:String})],es.prototype,`downloadUrl`,void 0),P([o({type:String})],es.prototype,`fallbackName`,void 0),P([o({type:Boolean})],es.prototype,`removable`,void 0),P([o({type:Boolean,reflect:!0})],es.prototype,`compact`,void 0),P([a()],es.prototype,`imgError`,void 0),es=P([p(`alps-attachment-pill`)],es);var ts=class extends d{constructor(...e){super(...e),this.attachments=[],this.mailbox=O,this.messageUid=``,this.removable=!1,this.composerMode=!1,this.attachmentsExpanded=!0,this._handleStoreChange=()=>{this.requestUpdate()}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}get resolvedMailbox(){if(this.mailbox)return this.mailbox;let e=window.location.hash.match(/^#\/mailbox\/([^/]+)/);return e?decodeURIComponent(e[1]):O}_openPreview(e){window.dispatchEvent(new CustomEvent(`open-attachment-preview`,{detail:{attachments:this.attachments,mailbox:this.resolvedMailbox,messageUid:this.messageUid,index:e}}))}toggleAttachments(){this.attachmentsExpanded=!this.attachmentsExpanded}_downloadAll(e){if(e.stopPropagation(),!this.attachments||this.attachments.length===0||!this.messageUid)return;let t=this.resolvedMailbox;this.attachments.forEach((e,n)=>{let r=zo(t,this.messageUid,e);r&&setTimeout(()=>{let t=document.createElement(`a`);t.href=r,t.download=e.Filename||this.i18nStore?.t(`messageReader.unknownAttachment`)||`attachment`,document.body.appendChild(t),t.click(),document.body.removeChild(t)},n*200)})}static{this.styles=v`
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
                ${M(`downloadSimple`)}
              </div>
            `}
            <div class="icon caret">
              ${M(`caretDown`)}
            </div>
          </div>
        </div>
        <div class="attachments-wrapper ${this.attachmentsExpanded?`expanded`:``}">
          <div class="attachments-list">
            ${this.attachments.map((e,t)=>n`
                <alps-attachment-pill
                  .attachment=${e}
                  .downloadUrl=${this.messageUid?zo(this.resolvedMailbox,this.messageUid,e):``}
                  .fallbackName=${this.i18nStore?.t(`messageReader.unknownAttachment`)}
                  .removable=${this.removable}
                  .compact=${this.composerMode}
                  @preview-attachment=${e=>{e.stopPropagation(),this._openPreview(t)}}
                ></alps-attachment-pill>
              `)}
          </div>
        </div>
      </div>
    `}};P([h({context:D})],ts.prototype,`i18nStore`,void 0),P([o({type:Array})],ts.prototype,`attachments`,void 0),P([o({type:String})],ts.prototype,`mailbox`,void 0),P([o({type:String})],ts.prototype,`messageUid`,void 0),P([o({type:Boolean})],ts.prototype,`removable`,void 0),P([o({type:Boolean,reflect:!0})],ts.prototype,`composerMode`,void 0),P([a()],ts.prototype,`attachmentsExpanded`,void 0),ts=P([p(`alps-attachment-list`)],ts);var ns=class extends d{constructor(...e){super(...e),this.mailboxes=[],this.currentMailbox=``,this.noActionBox=!1,this.noSearchBox=!1,this.filterQuery=``,this.isMove=!0}static{this.styles=v`
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
  `}_handleFilter(e){let t=e.target;this.filterQuery=t.value.toLowerCase()}_handleSelect(e){this.popup&&this.popup.close(),this.dispatchEvent(new CustomEvent(`folder-selected`,{detail:{folderName:e,isMove:this.isMove},bubbles:!0,composed:!0}))}_handlePopupToggle(){this.filterQuery=``,setTimeout(()=>{this.filterInput&&this.filterInput.focus()},50)}render(){let e=this.mailboxes.map(e=>e.Name||e.Mailbox||``).filter(e=>e!==``&&e!==this.currentMailbox).map(e=>({name:e,caption:Qe(e,this.i18nStore,this.mailboxes)})).filter(({name:e,caption:t})=>e.toLowerCase().includes(this.filterQuery)||t.toLowerCase().includes(this.filterQuery));return n`
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
                ${M(`folder`)}
                <span class="folder-name">${t}</span>
              </button>
            `):n`
              <div class="no-results">${this.i18nStore?.t(`folderSelector.noResults`)}</div>
            `}
          </div>
        </div>
      </alps-popup>
    `}};P([h({context:D})],ns.prototype,`i18nStore`,void 0),P([o({type:Array})],ns.prototype,`mailboxes`,void 0),P([o({type:String})],ns.prototype,`currentMailbox`,void 0),P([o({type:Boolean})],ns.prototype,`noActionBox`,void 0),P([o({type:Boolean})],ns.prototype,`noSearchBox`,void 0),P([a()],ns.prototype,`filterQuery`,void 0),P([a()],ns.prototype,`isMove`,void 0),P([g(`alps-popup`)],ns.prototype,`popup`,void 0),P([g(`input`)],ns.prototype,`filterInput`,void 0),ns=P([p(`alps-folder-selector-popup`)],ns);var rs=class extends d{constructor(...e){super(...e),this.verified=!1,this.failed=!1}static{this.styles=v`
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
        ${M(e===`verified`?`verifiedBadge`:`authFailedBadge`)}
      </span>
    `}};P([h({context:D})],rs.prototype,`i18nStore`,void 0),P([o({type:Boolean})],rs.prototype,`verified`,void 0),P([o({type:Boolean})],rs.prototype,`failed`,void 0),rs=P([p(`alps-sender-auth-badge`)],rs);var is=`alps_msg_`,as=1800*1e3,os=0;typeof window<`u`&&window.addEventListener(`session-cleared`,()=>{os++});function ss(){try{let e=[];for(let t=0;t<sessionStorage.length;t++){let n=sessionStorage.key(t);n&&n.startsWith(is)&&e.push(n)}e.forEach(e=>sessionStorage.removeItem(e))}catch(e){x.error(`Failed to clear message cache`,e)}}var K={generation(){return os},get(e,t,n=`html`){try{let r=`${is}${e}_${t}_${n}`,i=sessionStorage.getItem(r);if(!i)return null;let a=JSON.parse(i);return Date.now()-a.timestamp>as?(sessionStorage.removeItem(r),null):a}catch(e){return x.error(`Failed to read message cache`,e),null}},set(e,t,n,r){try{let i=`${is}${e}_${t}_${n}`,a={...r,timestamp:Date.now()},o=JSON.stringify(a);if(o.length>2*1024*1024){console.warn(`Message ${t} is too large to cache (${Math.round(o.length/1024)}KB)`);return}sessionStorage.setItem(i,o)}catch(i){if(i instanceof DOMException&&(i.name===`QuotaExceededError`||i.code===22)){console.warn(`Session storage quota exceeded, clearing cache and retrying...`),ss();try{let i=`${is}${e}_${t}_${n}`,a={...r,timestamp:Date.now()};sessionStorage.setItem(i,JSON.stringify(a))}catch(e){x.error(`Failed to write message cache even after clearing`,e)}}else x.error(`Failed to write message cache`,i)}},clear(){os++,ss()}},cs=`data-alps-quote`;function ls(e){return e?e.map(e=>wn(e.Name,`${e.Mailbox}@${e.Host}`)):[]}var us=e=>`${e?.Mailbox??``}@${e?.Host??``}`.toLowerCase(),ds=e=>{let t=e.trim(),n=t.lastIndexOf(`<`);return(t.endsWith(`>`)&&n!==-1?t.slice(n+1,-1):t).trim().toLowerCase()};function fs(e,t,n,r,i,a=`YYYY-MM-DD`,o=`12`,s=[]){let c=t?.Envelope?.Subject||``,l=c;l=e===`forward`?l.toLowerCase().startsWith(`fwd:`)?l:`Fwd: ${l}`:l.toLowerCase().startsWith(`re:`)?l:`Re: ${l}`;let u=[],d=[];if(e===`reply`||e===`replyAll`){let n=t?.Envelope??{},r=new Set(s.filter(Boolean).map(ds)),i=new Set,a=e=>(e||[]).filter(e=>{let t=us(e);return r.has(t)||i.has(t)?!1:(i.add(t),!0)}),o=n.ReplyTo?.length>0?n.ReplyTo:n.From,c=a(o);(e===`replyAll`||c.length===0)&&(c=[...c,...a(n.To)]);let l=e===`replyAll`?a(n.Cc):[];c.length===0&&([c,l]=[l,[]]),u=c.length>0?ls(c):ls(o),d=ls(l)}let f=t?.Envelope?.Date?Ke(t.Envelope.Date,a,o):``,p=e=>xn($t(`${e.Mailbox}@${e.Host}`)).text,m=t?.Envelope?.From?.[0],h=m?.Mailbox&&m?.Host?p(m):``,g=$t(m?.Name||h||`Unknown Sender`),_=(t?.Envelope?.To||[]).map(e=>e.Name?`${$t(e.Name)} <${p(e)}>`:p(e)).join(`, `),v=`On ${f}, ${g} wrote:`;e===`forward`&&(v=`---------- Forwarded message ---------\nFrom: ${g} <${h}>\nDate: ${f}\nSubject: ${c}\nTo: ${_}\n`);let y=`\n\n${v}\n`+n.split(`
`).map(e=>`> ${e}`).join(`
`),b=xa(g),x=xa(h),S=xa(c),C=xa(f),w=i&&r?ba(r):``,ee=xa(n).replace(/\n/g,`<br>`),te=Bi()(new DOMParser().parseFromString(w||ee,`text/html`).body)??`ltr`,ne=te===`rtl`?`margin:0px 0.8ex 0px 0px;border-right:1px solid rgb(204,204,204);padding-right:1ex`:`margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex`,T=``;return T=w?e===`forward`?`<br><br><div class="gmail_quote" ${cs} dir="auto"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>From: ${b} &lt;${x}&gt;<br>Date: ${C}<br>Subject: ${S}<br>To: ${xa(_)}<br></div><br>${w}</div>`:`<br><br><div class="gmail_quote" ${cs} dir="auto"><div dir="ltr" class="gmail_attr">On ${C}, ${b} wrote:<br></div><blockquote class="gmail_quote" dir="${te}" style="${ne}">${w}</blockquote></div>`:`<br><br><div class="gmail_quote" dir="auto"><div dir="ltr" class="gmail_attr">${xa(v).replace(/\n/g,`<br>`)}<br></div><blockquote class="gmail_quote" dir="${te}" style="${ne}">${ee}</blockquote></div>`,{subject:l,to:u,cc:d,quotedText:y,quotedHtml:T}}var ps=!1;function ms(){ps=!0}function hs(){return ps}window.addEventListener(`user-logged-in`,()=>{ps=!1});var gs=`alps_last_active`,_s=3e3;function vs(e){try{return window.localStorage.getItem(e)}catch{return null}}function ys(e,t){try{window.localStorage.setItem(e,t)}catch{}}function bs(e){try{window.localStorage.removeItem(e)}catch{}}var xs=new class{constructor(){this.events=[`mousedown`,`mousemove`,`keydown`,`scroll`,`touchstart`,`wheel`,`pointerdown`,`pointermove`,`click`,`input`,`focusin`],this.logoutMinutes=0,this.lastActivity=Date.now(),this.lastSync=0,this.lastPing=Date.now(),this.checkInterval=null,this.recordActivity=()=>{let e=Date.now();this.lastActivity=e,!(window.location.hash===`#/login`||window.location.hash===``)&&e-this.lastSync>=_s&&(this.lastSync=e,ys(gs,String(e)))},this.handleActivity=()=>{this.recordActivity()},this.handleStorage=e=>{if(e.key===gs&&e.newValue){let t=Number(e.newValue);Number.isFinite(t)&&t>this.lastActivity&&(this.lastActivity=t)}}}setLogoutTime(e){let t=this.logoutMinutes>0;this.logoutMinutes=e;let n=this.logoutMinutes>0;n&&!t?(this.attachEvents(),this.startInterval()):!n&&t?(this.detachEvents(),this.clearInterval()):n&&t&&this.recordActivity()}attachEvents(){this.lastSync=0,this.events.forEach(e=>{document.addEventListener(e,this.handleActivity,{capture:!0,passive:!0})}),window.addEventListener(`storage`,this.handleStorage),this.recordActivity()}detachEvents(){this.lastSync=0,this.events.forEach(e=>{document.removeEventListener(e,this.handleActivity,{capture:!0})}),window.removeEventListener(`storage`,this.handleStorage)}trackIframe(e){try{let t=e.contentDocument;if(!t)return;this.events.forEach(e=>{t.addEventListener(e,this.handleActivity,{capture:!0,passive:!0})})}catch{}}startInterval(){this.clearInterval(),this.checkInterval=setInterval(()=>this.checkTimeout(),3e4)}clearInterval(){this.checkInterval&&=(clearInterval(this.checkInterval),null)}checkTimeout(){if(this.logoutMinutes<=0)return;if(window.location.hash===`#/login`||window.location.hash===``){this.recordActivity();return}let e=this.lastActivity,t=Number(vs(gs));Number.isFinite(t)&&t>e&&(e=t,this.lastActivity=t);let n=Date.now()-e;n>=this.logoutMinutes*60*1e3?this.logout():n<300*1e3&&Date.now()-this.lastPing>300*1e3&&this.pingBackend()}async pingBackend(){this.lastPing=Date.now();try{await fetch(`/session`)}catch{}}rearm(){this.lastActivity=Date.now(),this.lastPing=Date.now(),this.lastSync=0,this.logoutMinutes>0&&(this.attachEvents(),this.startInterval())}async logout(){this.clearInterval(),this.detachEvents();let e=!1;if(this.onBeforeLogout)try{await this.onBeforeLogout()}catch(t){t instanceof Pa?(t.keepRecoveryCopy(),e=!0):x.error(`Failed to run onBeforeLogout hook`,t)}try{bs(gs),qa(e?`inactivitySignedOutDraftsKept`:`inactivitySignedOut`),ms();try{await fetch(`/session`,{method:`DELETE`})}catch(e){x.error(`Sign-out request failed; ending the session locally anyway`,e)}K.clear(),or(),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`}catch(e){x.error(`Failed to auto sign out`,e)}finally{this.rearm()}}};function Ss(e,t){if(!e.contentDocument||!e.contentDocument.body)return;let n=e.contentDocument.getElementById(`dark-mode-override`);n&&n.remove();let r=t&&document.body.classList.contains(`theme-dark`);if(pa(e.contentDocument,r?`dark`:`light`),r){let t=window.getComputedStyle(document.documentElement).getPropertyValue(`--bg-primary`).trim()||`#1f2937`,n=window.getComputedStyle(document.documentElement).getPropertyValue(`--text-primary`).trim()||`#f9fafb`,r=window.getComputedStyle(document.documentElement).getPropertyValue(`--accent-color`).trim()||`#3b82f6`,i=window.getComputedStyle(document.documentElement).getPropertyValue(`--border-color`).trim()||`#374151`,a=e.contentDocument.createElement(`style`);a.id=`dark-mode-override`,a.textContent=`
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
    `,e.contentDocument.head.appendChild(a)}}function Cs(e,t){if(!e.contentDocument||!e.contentDocument.body)return;e.style.width=`100%`,e.contentDocument.addEventListener(`dragover`,e=>e.preventDefault()),e.contentDocument.addEventListener(`drop`,e=>e.preventDefault()),xs.trackIframe(e),Ss(e,t),e._ro&&e._ro.disconnect();let n=e.contentDocument,r=()=>{if(!e.contentDocument)return;let t=e.contentDocument.documentElement,n=e.contentDocument.body,r=Math.max(t?.scrollHeight||0,n?.scrollHeight||0);if(r>0){let t=parseFloat(e.style.height)||0;Math.abs(t-r)>2&&(e.style.height=`${Math.ceil(r)}px`)}};r();let i=new ResizeObserver(()=>r());i.observe(n.body),i.observe(n.documentElement),e._ro=i}function ws(e){if(!e)return``;let t=new DOMParser().parseFromString(e,`text/html`);t.querySelectorAll(`script, style, noscript, head, template`).forEach(e=>e.remove());let n=new Set([`p`,`div`,`br`,`tr`,`li`,`h1`,`h2`,`h3`,`h4`,`h5`,`h6`,`blockquote`,`section`,`article`,`header`,`footer`,`pre`,`table`,`ul`,`ol`]),r=``,i=e=>{for(let t of Array.from(e.childNodes))if(t.nodeType===Node.TEXT_NODE)r+=t.textContent||``;else if(t.nodeType===Node.ELEMENT_NODE){let e=t,a=e.tagName.toLowerCase();if(a===`br`){r+=`
`;continue}i(e),n.has(a)&&(r+=`
`)}};return t.body&&i(t.body),r.replace(/\n{3,}/g,`

`).trim()}function Ts(e,t,n,r){if(!e)return n||r;let i=e;if(t?.toLowerCase()===`text/html`||e.trim().startsWith(`<`)||/<\/[a-zA-Z]+>/.test(e)||/<[a-zA-Z]+[^>]*>/.test(e))try{let t=new DOMParser().parseFromString(e,`text/html`);t.querySelectorAll(`style, script, head`).forEach(e=>e.remove());let n=e=>{if(e.nodeType===Node.TEXT_NODE)return e.textContent||``;if(e.nodeType===Node.ELEMENT_NODE){let t=e,r=t.tagName.toLowerCase();if(r===`br`)return` `;let i=``;for(let e=0;e<t.childNodes.length;e++)i+=n(t.childNodes[e]);return[`p`,`div`,`td`,`tr`,`th`,`li`,`h1`,`h2`,`h3`,`h4`,`h5`,`h6`,`section`,`article`,`blockquote`,`ol`,`ul`,`header`,`footer`].includes(r)?` `+i+` `:i}return``};i=n(t.body||t)}catch{i=e.replace(/<[^>]*>/g,` `)}else i=e.replace(/[\r\n\t]+/g,` `);let a=i.replace(/\s+/g,` `).trim();if(a){let e=a.substring(0,100);return a.length>100?e+`...`:e}else if(n)return n.replace(/[\r\n\t\s]+/g,` `).trim();else return r}var Es=class extends d{constructor(...e){super(...e),this.showSenderAvatars=!0,this.canToggleRead=!1,this._handleSettingsChange=()=>{let e=this.settingsStore?.getState()?.themeIframeContent??!1;this.shadowRoot?.querySelectorAll(`iframe.reader-iframe`).forEach(t=>{Ss(t,e)})}}static{this.styles=[Dn,v`
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
  `]}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.settingsStore?.addEventListener(`change`,this._handleSettingsChange)})}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore?.removeEventListener(`change`,this._handleSettingsChange)}onIframeLoad(e){let t=e.target;Cs(t,this.settingsStore?.getState()?.themeIframeContent??!1)}handleCardHeaderClick(){this.dispatchEvent(new CustomEvent(`toggle-expansion`,{detail:{item:this.item},bubbles:!0,composed:!0}))}_closePopup(){let e=this.shadowRoot?.querySelectorAll(`alps-popup`);e&&e.forEach(e=>e.close())}handleStarClick(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent(`toggle-star`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleActionForItem(e){this._closePopup(),this.dispatchEvent(new CustomEvent(`action-for-item`,{detail:{action:e,item:this.item},bubbles:!0,composed:!0}))}handleDeleteItem(){this._closePopup(),this.dispatchEvent(new CustomEvent(`delete-item`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleRetryBody(){this.dispatchEvent(new CustomEvent(`retry-body`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleLoadRemoteResources(){this.dispatchEvent(new CustomEvent(`load-remote-resources`,{detail:{item:this.item},bubbles:!0,composed:!0}))}handleEditDraftClick(){this.dispatchEvent(new CustomEvent(`edit-draft-for-item`,{detail:{item:this.item},bubbles:!0,composed:!0}))}renderItemContent(){if(this.item.loading)return n`
        <div style="padding: 16px; display: flex; justify-content: center; align-items: center;">
          <alps-loader></alps-loader>
        </div>
      `;let e=this.item.message||{},t=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,r=String(this.settingsStore?.getState()?.hourFormat||`12`),i=e.Envelope?.Date?Ke(e.Envelope.Date,t,r):``;return n`
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
    `}render(){let e=this.item.message||{},t=e.Envelope?.From?.[0]||{},r=t.Mailbox&&t.Host?`${t.Mailbox}@${t.Host}`:``,i=t.Name||r||this.i18nStore?.t(`messageList.unknownSender`),a=!!(r&&t.Name?.trim()&&t.Name.trim()!==r),o=a?`${t.Name} <${r}>`:r||i,s=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,c=String(this.settingsStore?.getState()?.hourFormat||`12`),l=e.Envelope?.Date?Ke(e.Envelope.Date,s,c):``,u=it(e,t),d=e.Flags?.includes(B),f=!e.Flags?.includes(z),p=e.Snippet||``,m=window.innerWidth<=768?``:this.i18nStore?.t(`messageReader.clickToExpand`)||`Click to expand message content`,h=this.item.expanded?``:Ts(this.item.content,this.item.mimeType,p,m);return n`
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
                <span class="thread-card-sender-name" dir="auto">${a||!r?i:En(r)}</span>
                <alps-sender-auth-badge ?verified=${!!e.HasBimiPotential} ?failed=${!!e.HasBimiFailed}></alps-sender-auth-badge>
              </div>
              ${a?n`<span class="thread-card-sender-address">${En(r)}</span>`:``}
              <!-- On a line of its own, where the address's ellipsis cannot cut it off. -->
              ${An(r,this.i18nStore)}
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
                  ${M(`arrowBendUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reply`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`replyAll`)}>
                  ${M(`arrowBendDoubleUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.replyAll`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`forward`)}>
                  ${M(`arrowBendUpRight`)} <span class="item-text">${this.i18nStore?.t(`messageReader.forward`)}</span>
                </button>
                <div class="dropdown-divider"></div>
                <!-- Everything below is about THIS message. Over a conversation
                     the toolbar acts on all of it, so these live here. -->
                ${this.canToggleRead?n`
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(f?`markRead`:`markUnread`)}>
                  ${M(f?`envelopeOpen`:`envelopeUnread`)} <span class="item-text">${this.i18nStore?.t(f?`messageReader.markRead`:`messageReader.markUnread`)}</span>
                </button>
                `:``}
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`print`)}>
                  ${M(`printer`)} <span class="item-text">${this.i18nStore?.t(`messageReader.print`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`downloadMessage`)}>
                  ${M(`downloadSimple`)} <span class="item-text">${this.i18nStore?.t(`messageReader.downloadMessage`)}</span>
                </button>
                <button class="dropdown-item" @click=${()=>this.handleActionForItem(`showOriginal`)}>
                  ${M(`codeBlock`)} <span class="item-text">${this.i18nStore?.t(`messageReader.showOriginal`)}</span>
                </button>
                <div class="dropdown-divider"></div>
                <!-- Named for what it does to a draft, as the toolbar's is. -->
                <button class="dropdown-item" @click=${()=>this.handleDeleteItem()}>
                  ${M(`trash`)} <span class="item-text">${this.i18nStore?.t(e.Flags?.includes(`\\Draft`)?`messageReader.discardDraft`:`messageReader.delete`)}</span>
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
    `}};P([h({context:nr})],Es.prototype,`settingsStore`,void 0),P([h({context:D})],Es.prototype,`i18nStore`,void 0),P([h({context:Ga})],Es.prototype,`composeStore`,void 0),P([o({type:Object})],Es.prototype,`item`,void 0),P([o({type:String})],Es.prototype,`mailbox`,void 0),P([o({type:Boolean})],Es.prototype,`showSenderAvatars`,void 0),P([o({type:Boolean})],Es.prototype,`canToggleRead`,void 0),Es=P([p(`alps-thread-card`)],Es);function Ds(e){return!!e?.Flags?.includes(Rr)}var Os=10,q=class extends d{constructor(...e){super(...e),this.localPreferredView=null,this.hasHtml=!1,this.hasText=!1,this.mailbox=O,this.message=null,this.messages=[],this.selectedKeys=new Set,this.selectedCount=0,this.allSelectedStarred=!1,this.allSelectedUnread=!1,this.commonTags=[],this.bulkProcessing=!1,this.layoutMode=`vertical`,this.mailboxes=[],this.content=``,this.mimeType=``,this.loading=!1,this.loadFailed=!1,this.activeBanners=[],this.attachments=[],this.allowRemoteResources=!1,this.hasRemoteResources=!1,this.rawMessageHtml=``,this.isScrolled=!1,this.threadItems=[],this._isThread=!1,this._deferPropertySync=!1,this._conversation=null,this.scrolledToKey=null,this.scrollTimer=null,this.readDueAt=new Map,this.readTimer=null,this._handleDraftDiscarded=e=>{let t=e.detail;if(!t?.mailbox||!t.uid||!this.message)return;let n=L(t.mailbox,t.uid);this.threadItems.some(e=>this.itemKey(e)===n)&&this.dropCard(n),this.keyOf(this.message)===n&&this.dispatchEvent(new CustomEvent(`close`))},this._handleExternalFlagsChanged=e=>{let t=e;if(!t.detail)return;let{keys:n,flag:r,action:i}=t.detail;if(!this.threadItems||this.threadItems.length===0)return;let a=new Set(n),o=!1;for(let e=0;e<this.threadItems.length;e++){let t=this.threadItems[e];if(t.message&&a.has(this.itemKey(t))){let n=t.message.Flags||[],a=n.includes(r);i===`add`&&!a?(this.threadItems[e]={...t,message:{...t.message,Flags:[...n,r]}},o=!0):i===`remove`&&a&&(this.threadItems[e]={...t,message:{...t.message,Flags:n.filter(e=>e!==r)}},o=!0)}}if(o&&(this.threadItems=[...this.threadItems],this.requestUpdate(),this.message&&a.has(this.keyOf(this.message)))){let e=this.message.Flags?.includes(r);i===`add`&&!e?this.message.Flags=[...this.message.Flags||[],r]:i===`remove`&&e&&(this.message.Flags=this.message.Flags.filter(e=>e!==r)),this.message={...this.message}}},this.prefetchQueue=[],this.prefetching=!1,this.bodyReads=new Map,this.bodyLoads=new Map,this._handleSettingsChange=()=>{this.applyThemeToAllIframes()},this.handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0}}ownAddresses(){let e=this.settingsStore?.getState();return[ir(e)||rr()||``,e?.replyTo||``].filter(Boolean)}_closePopup(){let e=this.shadowRoot?.querySelectorAll(`alps-popup`);e&&e.forEach(e=>e.close())}async _handleAction(e,t){if(e===`reply`||e===`replyAll`||e===`forward`){if(!this.message)return;this._closePopup();let t=this.keyOf(this.message);if(this.bodyLoads.has(t)&&(await this.loadedItem(t),!this.message||this.keyOf(this.message)!==t))return;let n=``;this.mimeType===`text/plain`?n=this.content:this.rawMessageHtml&&(n=ws(this.rawMessageHtml));let r=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,i=String(this.settingsStore?.getState()?.hourFormat||`12`),{subject:a,to:o,cc:s,quotedText:c,quotedHtml:l}=fs(e,this.message,n,this.rawMessageHtml,this.hasHtml,r,i,this.ownAddresses()),u=e===`forward`?this.attachments.map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})):[],d=[...u,...ja(this.message.BodyStructure,l).filter(e=>!u.some(t=>t.partPath===e.partPath))],f=e===`reply`||e===`replyAll`?Ma(this.message,this.message.Mailbox||this.mailbox):{};this.composeStore.openComposer({subject:a,to:o,cc:s,text:c,html:l,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:d,quoteSource:{mailbox:this.message.Mailbox||this.mailbox,uid:String(this.message.UID),structure:this.message.BodyStructure},...f});return}if(e===`showPlaintext`||e===`showHtml`){this.localPreferredView=e===`showPlaintext`?`text`:`html`,this._closePopup(),await Promise.all(this.threadItems.filter(e=>e.content||e.loading||e.loadFailed).map(e=>this.fetchItemBody(e)));return}if(e===`print`){let e=this.allowRemoteResources?`&remote=1`:``;window.open(`#/print?mailbox=`+encodeURIComponent(this.mailboxOfMessage(this.message))+`&uid=`+this.message.UID+e,`_blank`),this._closePopup();return}if(this._closePopup(),this.toolbarIsConversation)if(e===`markUnread`){let e=this.unreadKeys;if(e.length>0)return void this.markMembersRead(e)}else{this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,folder:t,uids:this.conversationUids}}));return}this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,folder:t}}))}get openIsUnsent(){return this.message?Ds(this.message)||A(this.mailbox||``,this.mailboxes)===`drafts`:!1}get toolbarIsConversation(){return!(this.selectedCount>0)&&this.threadItems.length>1&&!this.openIsUnsent&&this.conversationItems.length>0}get conversationItems(){return this.threadItems.filter(e=>e.message&&e.mailbox===this.mailbox)}get conversationUids(){return this.conversationItems.map(e=>String(e.message.UID))}get unreadKeys(){return this.threadItems.filter(e=>e.message&&!e.message.Flags?.includes(`\\Seen`)&&!Ds(e.message)).map(e=>this.itemKey(e))}get readToggleMarksRead(){return this.selectedCount>0?this.allSelectedUnread:this.toolbarIsConversation?this.unreadKeys.length>0:!this.message?.Flags?.includes(z)}hasTag(e){let t=e.toLowerCase(),n=e=>!!e?.some(e=>e.toLowerCase()===t);if(this.selectedCount>0)return n(this.commonTags);if(this.toolbarIsConversation){let e=this.conversationItems;return e.length>0&&e.every(e=>n(e.message.Flags))}return n(this.message?.Flags)}_handleTag(e){this._closePopup();let t=this.toolbarIsConversation?this.conversationUids:void 0;this.dispatchEvent(new CustomEvent(`action`,{detail:{action:this.hasTag(e)?`removeTag`:`addTag`,folder:e,uids:t}}))}_handleRemoveAllTags(){this._closePopup();let e=this.selectedCount>0,t;if(e){let e=new Set;for(let t of this.messages)for(let n of[t,...t.SubMessages||[]])if(this.selectedKeys.has(this.keyOf(n)))for(let t of Zr(n.Flags))e.add(t);t=[...e]}else if(this.toolbarIsConversation){let e=new Set;for(let t of this.conversationItems)for(let n of Zr(t.message.Flags))e.add(n);t=[...e]}else t=Zr(this.message?.Flags);if(t.length===0)return;let n=!e&&this.toolbarIsConversation?this.conversationUids:void 0;this.dispatchEvent(new CustomEvent(`action`,{detail:{action:`removeTag`,tags:t,uids:n}}))}keyOf(e){return L(this.mailboxOfMessage(e),e?.UID)}mailboxOfMessage(e){return Cr(e,this.mailbox)}itemKey(e){return L(e.mailbox,e.message?.UID)}isOpenItem(e){return!!this.message&&this.itemKey(e)===this.keyOf(this.message)}listedKeys(){let e=new Set;for(let t of this.messages||[]){e.add(this.keyOf(t));for(let n of t.SubMessages||[])e.add(this.keyOf(n))}return e}cardId(e){return`thread-card-${encodeURIComponent(e.mailbox)}-${e.message?.UID}`}connectedCallback(){super.connectedCallback(),window.addEventListener(`external-message-flags-changed`,this._handleExternalFlagsChanged),window.addEventListener(`draft-discarded`,this._handleDraftDiscarded),this.updateComplete.then(()=>{this.isConnected&&this.settingsStore?.addEventListener(`change`,this._handleSettingsChange)})}disconnectedCallback(){this.settingsStore?.removeEventListener(`change`,this._handleSettingsChange),window.removeEventListener(`external-message-flags-changed`,this._handleExternalFlagsChanged),this.readDueAt.clear(),this.prefetchQueue=[],this.readTimer&&clearTimeout(this.readTimer),this.readTimer=null,this.scrollTimer&&clearTimeout(this.scrollTimer),this.scrollTimer=null,window.removeEventListener(`draft-discarded`,this._handleDraftDiscarded),super.disconnectedCallback()}static{this.styles=[yo,v`
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
  `]}updated(e){if(!e.has(`message`))return;if(!this.message){this.scrolledToKey=null;return}let t=this.keyOf(this.message);t!==this.scrolledToKey&&(this.scrolledToKey=t,this.scrollToCard(t))}scrollToCard(e){this.scrollTimer&&clearTimeout(this.scrollTimer),this.scrollTimer=setTimeout(()=>{this.scrollTimer=null;let t=this.threadItems.find(t=>this.itemKey(t)===e),n=t?this.shadowRoot?.getElementById(this.cardId(t)):null;n&&n.scrollIntoView({behavior:`smooth`,block:`start`})},50)}willUpdate(e){let t=e.has(`message`),n=e.has(`mailbox`),r=e.has(`messages`);if(t||n){let t=e.get(`message`),n=e.has(`mailbox`)?e.get(`mailbox`):this.mailbox;this.message?!t||this.keyOf(t)!==this.keyOf(this.message)||n!==this.mailbox?(this.localPreferredView=null,this.fetchMessageBody(this.message,this.message._isAutosaveUpdate)):(t&&(t.HasBimiPotential&&!this.message.HasBimiPotential&&(this.message={...this.message,HasBimiPotential:!0}),t.HasBimiFailed&&!this.message.HasBimiFailed&&(this.message={...this.message,HasBimiFailed:!0})),this.resolveThread(this.message),this.message._isAutosaveUpdate&&t&&this.message!==t&&this.fetchMessageBody(this.message,!0)):(this.localPreferredView=null,this.content=``,this.mimeType=``,this.rawMessageHtml=``,this.loading=!1,this.loadFailed=!1,this.allowRemoteResources=!1,this.hasRemoteResources=!1,this.hasHtml=!1,this.hasText=!1,this.activeBanners=[],this.threadItems=[])}else r&&this.message&&this.resolveThread(this.message);this.syncReadTimers()}syncReadTimers(){let e=this.settingsStore?.getState()?.markReadTimeout??0,t=this.selectedCount>0,n=new Set;if(e>=0&&this.threadItems.length>1&&!t)for(let e of this.threadItems)!e.message||!e.expanded||this.isOpenItem(e)||e.message.Flags?.includes(`\\Seen`)||Ds(e.message)||n.add(this.itemKey(e));let r=!1;for(let e of[...this.readDueAt.keys()])n.has(e)||(r=this.readDueAt.delete(e)||r);for(let t of n)this.readDueAt.has(t)||(this.readDueAt.set(t,Date.now()+e*1e3),r=!0);r&&this.armReadTimer()}armReadTimer(){if(this.readTimer&&clearTimeout(this.readTimer),this.readTimer=null,this.readDueAt.size===0)return;let e=Math.max(0,Math.min(...this.readDueAt.values())-Date.now());this.readTimer=setTimeout(()=>this.flushReadDue(),e)}flushReadDue(){this.readTimer=null;let e=Date.now(),t=[...this.readDueAt].filter(([,t])=>t<=e).map(([e])=>e);for(let e of t)this.readDueAt.delete(e);let n=t.filter(e=>{let t=this.threadItems.find(t=>this.itemKey(t)===e);return!!t&&t.expanded&&!t.message?.Flags?.includes(`\\Seen`)});n.length>0&&this.markMembersRead(n),this.armReadTimer()}patchMemberFlag(e,t,n){let r=e=>{let r=e?.Flags||[],i=r.includes(t);return n===`add`===i?e:{...e,Flags:n===`add`?[...r,t]:r.filter(e=>e!==t)}},i=this.threadItems.findIndex(t=>this.itemKey(t)===e);if(i!==-1){let e=this.threadItems[i],t=r(e.message);t!==e.message&&(this.threadItems[i]={...e,message:t},this.threadItems=[...this.threadItems])}this._conversation&&={...this._conversation,messages:this._conversation.messages.map(t=>this.keyOf(t)===e?r(t):t)},this.message&&this.keyOf(this.message)===e&&(this.message.Flags=r(this.message).Flags,this.requestUpdate())}async markMembersRead(e){let t=new Set(e),n=new Map;for(let e of this.threadItems){if(!e.message||!t.has(this.itemKey(e)))continue;let r=n.get(e.mailbox)??[];r.push(String(e.message.UID)),n.set(e.mailbox,r)}let r=this.listedKeys(),i=(e,t,n)=>{for(let i of t){let t=L(e,i);r.has(t)&&this.isConnected&&this.dispatchEvent(new CustomEvent(`message-flags-changed`,{detail:{uid:i,mailbox:e,flag:z,action:n},bubbles:!0,composed:!0})),this.patchMemberFlag(t,z,n)}};await Promise.all([...n].map(async([e,t])=>{i(e,t,`add`);let n=!1;try{n=(await V.setFlag(e,t,[z],`add`)).ok}catch(e){x.error(`Failed to mark conversation messages read`,e)}n||i(e,t,`remove`)}))}expandUnreadOnOpen(){if(this.openIsUnsent)return;let e=this.threadItems.filter(e=>e.message&&!e.message.Flags?.includes(`\\Seen`)&&!Ds(e.message)),t=!1;for(let n of e.slice(0,Os))n.expanded||(n.expanded=!0,t=!0,!n.content&&!n.loading&&(n.loading=!0,this.queueItemBody(n)));return t&&(this.threadItems=[...this.threadItems]),e[0]?this.itemKey(e[0]):void 0}settleOpenedConversation(){if(!this.message||this.threadItems.length<2)return;let e=this.expandUnreadOnOpen();e&&e!==this.keyOf(this.message)&&this.scrollToCard(e)}loadRemoteResources(){if(this.allowRemoteResources=!0,this.message&&this.rawMessageHtml){this.hasRemoteResources=!1,this.content=ga(this.rawMessageHtml,{mailbox:this.mailboxOfMessage(this.message),messageUid:this.message.UID,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}});let e=this.threadItems.find(e=>this.isOpenItem(e));e&&(e.allowRemoteResources=!0,e.content=this.content,e.hasRemoteResources=this.hasRemoteResources,this.updateThreadItemReference(e))}}resolveThread(e){if(!e)return;let t=this.settingsStore?.getState()?.enableThreading??!0,n=[],r=null;if(t&&this.messages&&this.messages.length>0){let t=this.messages.find(t=>this.keyOf(t)===this.keyOf(e));if(t)r=t;else for(let t of this.messages)if(t.SubMessages&&t.SubMessages.find(t=>this.keyOf(t)===this.keyOf(e))){r=t;break}}if(r?(n=[r,...r.SubMessages||[]],n.sort((e,t)=>(e.Envelope?.Date?new Date(e.Envelope.Date).getTime():0)-(t.Envelope?.Date?new Date(t.Envelope.Date).getTime():0))):n=(t&&this.threadItems.length>1&&this.threadItems.some(t=>this.itemKey(t)===this.keyOf(e))?this.threadItems.map(e=>({...e.message,Mailbox:e.mailbox})):null)??[e],t&&this._conversation?.key===this.keyOf(e)){let e=new Set(n.map(e=>this.keyOf(e))),t=this._conversation.messages.filter(t=>!e.has(this.keyOf(t)));t.length>0&&(n=[...n,...t],n.sort((e,t)=>(e.Envelope?.Date?new Date(e.Envelope.Date).getTime():0)-(t.Envelope?.Date?new Date(t.Envelope.Date).getTime():0)))}this._isThread=t&&n.length>1;let i=this.getSentMailboxName(),a=this.threadItems||[];this.threadItems=n.map(t=>{let n=this.keyOf(t)===this.keyOf(e),r=a.find(e=>this.itemKey(e)===this.keyOf(t));if(r){let e={...t,Flags:t.Flags||r.message.Flags||[]};return r.message.HasBimiPotential&&(e.HasBimiPotential=!0),r.message.HasBimiFailed&&(e.HasBimiFailed=!0),{...r,message:e}}return{message:t,content:``,mimeType:``,loading:!1,attachments:[],rawMessageHtml:``,hasHtml:!1,hasText:!1,activeBanners:[],allowRemoteResources:this.allowRemoteResources,hasRemoteResources:!1,isSent:(this.mailbox||``).toLowerCase()===i.toLowerCase()||(t.Mailbox||``).toLowerCase()===i.toLowerCase(),mailbox:t.Mailbox||this.mailbox,expanded:n}})}async fetchMessageBody(e,t=!1){e&&(e._isAutosaveUpdate=!1),this.message&&(this.message._isAutosaveUpdate=!1),t||(this.content=``,this.mimeType=``,this.rawMessageHtml=``,this.loading=!0,this.loadFailed=!1,this.activeBanners=[],this.allowRemoteResources=this.settingsStore?.getState().showRemoteContent===`always`,this.hasRemoteResources=!1,this.threadItems=[],this._conversation=null),this.resolveThread(e),this.prefetchQueue=[];let n=this.threadItems.find(t=>this.itemKey(t)===this.keyOf(e))||this.threadItems[0];if(n){n.loading=!t,n.expanded=!0,this._deferPropertySync=!1;let r=this.fetchItemBody(n);r.then(()=>{this.isConnected&&(!this.message||this.keyOf(this.message)!==this.keyOf(e)||this.requestUpdate())}),t||r.catch(()=>{}).then(()=>this.loadConversation(e));return}t||this.loadConversation(e)}queueItemBody(e){this.isConnected&&(this.prefetchQueue.push(e),this.drainPrefetch())}async drainPrefetch(){if(!this.prefetching){this.prefetching=!0;try{for(;this.prefetchQueue.length>0;){let e=this.prefetchQueue.shift();e.content||await this.fetchItemBody(e,!0)}}finally{this.prefetching=!1}}}async loadConversation(e,t=!0){if(!(this.settingsStore?.getState()?.enableThreading??!0)||!e?.UID)return;let n=this.keyOf(e),r=e.Mailbox||this.mailbox;try{let t=await N(`/mailboxes/${k(r)}/messages/${e.UID}/thread`);if(t.ok){let e=await t.json(),r=Array.isArray(e?.Messages)?e.Messages:[];if(!this.isConnected||!this.message||this.keyOf(this.message)!==n)return;this._conversation={key:n,messages:r},r.length>1&&(this.resolveThread(this.message),this.requestUpdate())}}catch(e){x.error(`Failed to load the conversation`,e)}t&&this.message&&this.keyOf(this.message)===n&&this.settleOpenedConversation()}liveFlags(e,t){let n=this.threadItems.find(t=>this.itemKey(t)===e)??t;if(!(!n.message||!(`Flags`in n.message)))return n.message.Flags??[]}updateThreadItemReference(e){if(!e.message||!this.isConnected)return;let t=this.threadItems.findIndex(t=>this.itemKey(t)===this.itemKey(e));t!==-1&&(this.threadItems[t]={...e},this.threadItems=[...this.threadItems])}async loadedItem(e){let t;for(;t=this.bodyLoads.get(e);)await t;return this.threadItems.find(t=>this.itemKey(t)===e)}readWaitingCard(e){if(this.bodyLoads.has(e))return;let t=this.threadItems.find(t=>this.itemKey(t)===e);!t?.loading||t.content||(this.prefetchQueue=this.prefetchQueue.filter(t=>this.itemKey(t)!==e),this.fetchItemBody(t))}async fetchItemBody(e,t=!1){if(!e.message)return;let n=e.message,r=e.mailbox,i=this.itemKey(e),a=(this.bodyReads.get(i)??0)+1;this.bodyReads.set(i,a);let o=()=>this.bodyReads.get(i)===a,s,c=new Promise(e=>{s=e});this.bodyLoads.set(i,c);let l=this.localPreferredView||this.settingsStore?.getState()?.preferredView||`html`,u=K.generation();try{let a=K.get(r,n.UID.toString(),l),s,c=!1;if(a)s=a;else{let e=t?zt:{},i=await N(`/mailboxes/${k(r)}/messages/${n.UID}?view=${l}`,e);if(!o())return;if(i.status===401){window.location.hash=`/login`;return}if(!i.ok)throw Error(`Failed to fetch metadata`);let a=await i.json();if(!o())return;let u,d,f=a.Part;if(f&&typeof a.Body==`string`)(f.MIMEType||f.MimeType||`text/plain`).toLowerCase()===`text/html`?u=a.Body:d=a.Body;else if(f){let t=Array.isArray(f.Path)?f.Path.join(`.`):f.Path,i=await N(`/mailboxes/${k(r)}/messages/${n.UID}/raw?part=${t}`,e).catch(e=>(x.error(`Failed to fetch message body:`,e),null));if(!o())return;if(i?.status===401){window.location.hash=`/login`;return}if(i?.ok){let e=await i.text();if(!o())return;(f.MIMEType||f.MimeType||`text/plain`).toLowerCase()===`text/html`?u=e:d=e}else i&&x.error(`Failed to fetch message body:`,i.status),c=!0}s={Message:a.Message,Part:a.Part,Attachments:a.Attachments,RawHtml:u,RawText:d,HasHTML:!!a.HasHTML,HasText:!!a.HasText}}let d=s.Message?{...n,...s.Message}:n,f=!!s.HasHTML,p=!!s.HasText,m=e.mimeType,h=e.content,g=e.rawMessageHtml,_=e.activeBanners,v=e.hasRemoteResources,y=t=>ga(t,{mailbox:r,messageUid:d?.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:d?.BodyStructure,onRemoteResourceBlocked:()=>{v=!0}});if(s.Part&&!c){if(m=s.Part.MIMEType||s.Part.MimeType||`text/plain`,s.RawHtml!==void 0){v=!1;let e={content:s.RawHtml,isHtml:!0,message:d,mailbox:r,banners:[],i18nStore:this.i18nStore},t=await T.invokeHookAsync(`reader:content`,e);if(!o())return;g=s.RawHtml;for(let e of t)e&&typeof e==`string`&&(g=e);_=e.banners||[],h=y(g)}else if(s.RawText!==void 0){v=!1;let e={content:s.RawText,isHtml:!1,message:d,mailbox:r,banners:[],i18nStore:this.i18nStore},t=await T.invokeHookAsync(`reader:content`,e);if(!o())return;h=s.RawText;for(let e of t)e&&typeof e==`string`&&(h=e);_=e.banners||[],e.isHtml&&(m=`text/html`,f=!0,h=y(h))}}!a&&!c&&K.generation()===u&&K.set(r,n.UID.toString(),l,{...s,HasHTML:f,HasText:p}),e.attachments=s.Attachments||[],e.hasHtml=f,e.hasText=p,e.message={...d,Flags:this.liveFlags(i,e)??d.Flags},e.mimeType=m,e.content=h,e.rawMessageHtml=g,e.activeBanners=_,e.hasRemoteResources=v,e.loadFailed=c}catch(t){if(!o())return;x.error(`Failed to fetch message:`,t),e.loadFailed=!0}finally{this.bodyLoads.get(i)===c&&this.bodyLoads.delete(i),s(),o()&&(e.loading=!1,this.isConnected&&!this._deferPropertySync&&this.isOpenItem(e)&&(this.content=e.content,this.mimeType=e.mimeType,this.rawMessageHtml=e.rawMessageHtml,this.attachments=e.attachments,this.hasHtml=e.hasHtml,this.hasText=e.hasText,this.activeBanners=e.activeBanners,this.allowRemoteResources=e.allowRemoteResources,this.hasRemoteResources=e.hasRemoteResources,this.loadFailed=!!e.loadFailed,this.loading=!1,this.message={...this.message,...e.message}),this.updateThreadItemReference(e))}}getSentMailboxName(){if(this.mailboxes&&Array.isArray(this.mailboxes)){for(let e of this.mailboxes){let t=e.Name||e.Mailbox;if(t&&(e.Attrs||[]).some(e=>typeof e==`string`&&(e.toLowerCase()===`\\sent`||e.toLowerCase()===`\\\\sent`)))return t}let e=[`sent`,`sent messages`,`sent items`,`sent-mail`];for(let t of this.mailboxes){let n=t.Name||t.Mailbox;if(n&&e.includes(n.toLowerCase()))return n}}return we}async toggleItemExpansion(e){e.expanded=!e.expanded,this.updateThreadItemReference(e),e.expanded&&!e.content&&!e.loading&&(e.loading=!0,this.updateThreadItemReference(e),await this.fetchItemBody(e))}async retryItemBody(e){!e||e.loading||(e.loading=!0,e.loadFailed=!1,this.updateThreadItemReference(e),this.isOpenItem(e)&&(this.loading=!0,this.loadFailed=!1),await this.fetchItemBody(e))}loadRemoteResourcesForItem(e){e.allowRemoteResources=!0,e.message&&e.rawMessageHtml&&(e.hasRemoteResources=!1,e.content=ga(e.rawMessageHtml,{mailbox:e.mailbox,messageUid:e.message.UID,allowRemoteResources:e.allowRemoteResources,messageStructure:e.message.BodyStructure,onRemoteResourceBlocked:()=>{e.hasRemoteResources=!0}}),this.isOpenItem(e)&&(this.content=e.content,this.allowRemoteResources=!0,this.hasRemoteResources=e.hasRemoteResources),this.updateThreadItemReference(e))}async toggleItemStar(e){if(!e.message)return;let t=e.message.Flags?.includes(B),n=t?`remove`:`add`;t?e.message.Flags=e.message.Flags.filter(e=>e!==B):e.message.Flags=[...e.message.Flags||[],B],this.updateThreadItemReference(e);let r=this.listedKeys().has(this.itemKey(e)),i=t=>{r&&this.dispatchEvent(new CustomEvent(`message-flags-changed`,{detail:{uid:String(e.message.UID),mailbox:e.mailbox,flag:B,action:t},bubbles:!0,composed:!0}))};i(n);try{let{ok:r}=await V.setFlag(e.mailbox,[String(e.message.UID)],[B],n);r?this.isOpenItem(e)&&(this.message.Flags=e.message.Flags,this.requestUpdate()):(t?e.message.Flags=[...e.message.Flags||[],B]:e.message.Flags=e.message.Flags.filter(e=>e!==B),this.updateThreadItemReference(e),i(t?`add`:`remove`))}catch(n){x.error(`Failed to toggle star for thread item`,n),t?e.message.Flags=[...e.message.Flags||[],B]:e.message.Flags=e.message.Flags.filter(e=>e!==B),this.updateThreadItemReference(e),i(t?`add`:`remove`)}}deleteItem(e){if(!e.message)return;let t=this.itemKey(e),n=this.isOpenItem(e)?[...this.conversationItems].reverse().find(e=>this.itemKey(e)!==t):void 0;this.dispatchEvent(new CustomEvent(`action`,{detail:{action:`delete`,uid:String(e.message.UID),mailbox:e.mailbox,nextUid:n?String(n.message.UID):void 0,done:e=>{e&&this.dropCard(t)}}}))}dropCard(e){if(this.threadItems=this.threadItems.filter(t=>this.itemKey(t)!==e),this._conversation&&={...this._conversation,messages:this._conversation.messages.filter(t=>this.keyOf(t)!==e)},this.threadItems.length===1&&!this.threadItems[0].expanded){let e=this.threadItems[0];e.expanded=!0,!e.content&&!e.loading&&(e.loading=!0,this.fetchItemBody(e))}this._isThread=this.threadItems.length>1,this.requestUpdate()}reloadConversation(){this.message&&this.loadConversation(this.message,!1)}async _handleActionForItem(e,t){if(e===`reply`||e===`replyAll`||e===`forward`){let n=this.itemKey(t);if(this.readWaitingCard(n),this.bodyLoads.has(n)){let e=await this.loadedItem(n);if(!e)return;t=e}let r=``;t.mimeType===`text/plain`?r=t.content:t.rawMessageHtml&&(r=ws(t.rawMessageHtml));let i=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,a=String(this.settingsStore?.getState()?.hourFormat||`12`),{subject:o,to:s,cc:c,quotedText:l,quotedHtml:u}=fs(e,t.message,r,t.rawMessageHtml,t.hasHtml,i,a,this.ownAddresses()),d=e===`forward`?t.attachments.map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0})):[],f=[...d,...ja(t.message.BodyStructure,u).filter(e=>!d.some(t=>t.partPath===e.partPath))],p=e===`reply`||e===`replyAll`?Ma(t.message,t.mailbox):{};this.composeStore.openComposer({subject:o,to:s,cc:c,text:l,html:u,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:f,quoteSource:{mailbox:t.mailbox,uid:String(t.message.UID),structure:t.message.BodyStructure},...p});return}if(e===`markRead`)return void this.markMembersRead([this.itemKey(t)]);if(e===`markUnread`||e===`downloadMessage`||e===`showOriginal`){this.dispatchEvent(new CustomEvent(`action`,{detail:{action:e,uid:String(t.message.UID),mailbox:t.mailbox}}));return}if(e===`showPlaintext`){this.localPreferredView=`text`,this.fetchItemBody(t);return}if(e===`showHtml`){this.localPreferredView=`html`,this.fetchItemBody(t);return}if(e===`print`){let e=t.allowRemoteResources?`&remote=1`:``;window.open(`#/print?mailbox=`+encodeURIComponent(t.mailbox)+`&uid=`+t.message.UID+e,`_blank`);return}}applyThemeToIframe(e){Ss(e,this.settingsStore?.getState()?.themeIframeContent??!1)}applyThemeToAllIframes(){let e=this.shadowRoot?.querySelectorAll(`iframe.reader-iframe`);e&&e.forEach(e=>this.applyThemeToIframe(e))}onIframeLoad(e){let t=e.target;Cs(t,this.settingsStore?.getState()?.themeIframeContent??!1)}async _handleEditDraft(e){let t=e&&!(e instanceof Event),n=t?e.message:this.message,r=t?e.mailbox:this.mailboxOfMessage(n);if(!n)return;let i=t?this.itemKey(e):this.keyOf(n),a=t?e:this.threadItems.find(e=>this.itemKey(e)===i);if(a&&!a.loading&&(a.loadFailed||t&&!a.content)&&this.retryItemBody(a),this.bodyLoads.has(i)){let n=await this.loadedItem(i);if(!n)return;if(t)e=n;else if(!this.message||this.keyOf(this.message)!==i)return}if(n=t?e.message:this.message,t?e.loadFailed:this.loadFailed){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:this.i18nStore?.t(`messageReader.loadError`)}}));return}let o=t&&e?e.content:this.content,s=t&&e?e.mimeType:this.mimeType,c=t&&e?e.rawMessageHtml:this.rawMessageHtml,l=t&&e?e.attachments:this.attachments,u=``;u=s===`text/plain`?o:ws(c);let d=(l||[]).map(e=>({name:e.Filename||`attachment`,size:e.Size||0,type:e.MIMEType||`application/octet-stream`,partPath:e.Path?e.Path.join(`.`):void 0}));this.composeStore.openComposer({draftUid:n.UID.toString(),draftMailbox:r,subject:n.Envelope?.Subject||``,to:ls(n.Envelope?.To),cc:ls(n.Envelope?.Cc),bcc:ls(n.Envelope?.Bcc),text:u,html:c,format:this.settingsStore?.getState()?.composeFormat||`html`,attachments:d,quoteSource:{mailbox:r,uid:n.UID.toString(),structure:n.BodyStructure},inReplyTo:n.Envelope?.InReplyTo||void 0,references:Array.isArray(n.References)&&n.References.length?n.References:void 0})}get showSenderAvatars(){return this.settingsStore?.getState()?.showSenderAvatars??!0}canToggleReadFor(e){return!e.message||e.isSent||Ds(e.message)||A(this.mailbox||``,this.mailboxes)===`trash`?!1:(this.mailbox||``).toLowerCase()!==this.getSentMailboxName().toLowerCase()}get newestAnswerable(){return[...this.threadItems].reverse().find(e=>e.message&&!Ds(e.message))}async answerNewest(e){let t=this.newestAnswerable;if(!t)return;let n=this.itemKey(t);!t.content&&!t.loading&&await this.fetchItemBody(t);let r=this.threadItems.find(e=>this.itemKey(e)===n)??t;await this._handleActionForItem(e,r)}renderConversationReply(){return!this.toolbarIsConversation||!this.newestAnswerable?``:n`
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
      `;let r=this.localPreferredView||this.settingsStore?.getState()?.preferredView||`html`,i=this.message||{},a=Yr(i.Flags,this.i18nStore),o=new Set([`$label1`,`$label2`,`$label3`,`$label4`,`$label5`]),s=e||!this.message?[]:Zr(i.Flags).filter(e=>!o.has(e.toLowerCase())),c=i.Envelope?.From?.[0]||{},u=c.Mailbox&&c.Host?`${c.Mailbox}@${c.Host}`:``,d=c.Name||u||this.i18nStore?.t(`messageList.unknownSender`),p=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,m=String(this.settingsStore?.getState()?.hourFormat||`12`),h=i.Envelope?.Date?Ke(i.Envelope.Date,p,m):``,g=it(i,c),_=(this.mailbox||``).toLowerCase(),v=A(this.mailbox||``,this.mailboxes),y=v===`archive`,b=v===`junk`,x=v===`trash`,S=v===`drafts`,C=_===this.getSentMailboxName().toLowerCase(),w=this.toolbarIsConversation,ee=this.readToggleMarksRead,te=w?this.i18nStore?.t(`messageReader.deleteThread`):this.message?.Flags?.includes(`\\Draft`)||S?this.i18nStore?.t(`messageReader.discardDraft`):this.i18nStore?.t(`messageReader.delete`);return n`
      <alps-toolbar class="toolbar" ?scrolled=${this.isScrolled}>
        ${this.layoutMode===`full`?n`
          <alps-icon-btn @click=${()=>this.dispatchEvent(new CustomEvent(`close`))} title=${this.i18nStore?.t(`messageReader.back`)} icon="arrowLeft"></alps-icon-btn>
          <div class="toolbar-separator desktop-only"></div>
        `:``}
        
        <div class="toolbar-spacer mobile-spacer"></div>
        
        ${!y&&!x&&!S?n`
        <alps-icon-btn title=${this.i18nStore?.t(`messageReader.archive`)} @click=${()=>this._handleAction(`archive`)} icon="archiveBox"></alps-icon-btn>
        `:``}
        ${!b&&!x&&!S&&!C?n`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t(`messageReader.reportSpam`)} @click=${()=>this._handleAction(`reportSpam`)} icon="warningDiamond"></alps-icon-btn>
        `:``}
        ${b?n`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t(`messageReader.notSpam`)} @click=${()=>this._handleAction(`notSpam`)} icon="notSpam"></alps-icon-btn>
        `:``}
        <alps-icon-btn title=${te} @click=${()=>this._handleAction(`delete`)} icon="trash"></alps-icon-btn>
        <alps-folder-selector-popup
          class="desktop-only"
          .mailboxes=${this.mailboxes}
          .currentMailbox=${this.mailbox}
          @folder-selected=${e=>this._handleAction(e.detail.isMove?`moveTo`:`copyTo`,e.detail.folderName)}
        >
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t(`messageReader.moveTo`)} icon="folderOpen"></alps-icon-btn>
        </alps-folder-selector-popup>
        
        <div class="toolbar-separator"></div>
        
        ${!x&&!C?n`
        <alps-icon-btn title=${ee?this.i18nStore?.t(`messageReader.markRead`):this.i18nStore?.t(`messageReader.markUnread`)} @click=${()=>this._handleAction(`markUnread`)} icon=${ee?`envelopeOpen`:`envelopeUnread`}></alps-icon-btn>
        `:``}
        ${w?``:n`
        <!-- A star is a flag on ONE message, so over a conversation it is each
             card's own star and not a button up here. -->
        <alps-icon-btn class="desktop-only" ?active=${e&&this.allSelectedStarred||!e&&this.message?.Flags?.includes(`\\Flagged`)} title=${this.i18nStore?.t(`messageReader.star`)} @click=${()=>this._handleAction(`star`)} icon=${e&&this.allSelectedStarred||!e&&this.message?.Flags?.includes(`\\Flagged`)?`starFourFill`:`starFour`}></alps-icon-btn>
        `}
        
        <alps-popup align="left" class="tags-popup">
          <alps-icon-btn slot="trigger" class="desktop-only" title=${this.i18nStore?.t(`messageReader.tags`)} icon="tag"></alps-icon-btn>
          ${[`$label1`,`$label2`,`$label3`,`$label4`,`$label5`].map(e=>n`
              <button class="dropdown-item ${this.hasTag(e)?`active`:``}" @click=${()=>this._handleTag(e)}>
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${$r(e)};margin-right:12px;opacity:0.9;"></span>
                <span class="item-text">${Qr(e,this.i18nStore)}</span>
              </button>
            `)}
          ${s.length?n`
            <div class="dropdown-divider"></div>
            ${s.map(e=>n`
              <button class="dropdown-item active" title=${this.i18nStore?.t(`messageReader.removeTag`)} @click=${()=>this._handleTag(e)}>
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${$r(e)};margin-right:12px;opacity:0.9;"></span>
                <span class="item-text">${Qr(e,this.i18nStore)}</span>
                ${M(`x`)}
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
            ${this.message?.Flags?.includes(`\\Draft`)||S?n`
              <alps-icon-btn title=${this.i18nStore?.t(`messageReader.editDraft`)} @click=${this._handleEditDraft} icon="pen"></alps-icon-btn>
            `:w?``:n`
              <alps-icon-btn title=${this.i18nStore?.t(`messageReader.reply`)} @click=${()=>this._handleAction(`reply`)} icon="arrowBendUpLeft"></alps-icon-btn>
            `}
            
            <alps-popup align="right" class="more-menu-popup">
              <alps-icon-btn slot="trigger" class="more-btn" title=${this.i18nStore?.t(`messageReader.moreOptions`)} icon="dotsThreeVertical"></alps-icon-btn>
            
            ${this.message?.Flags?.includes(`\\Draft`)||S||w?``:n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`reply`)}>
              ${M(`arrowBendUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reply`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`replyAll`)}>
              ${M(`arrowBendDoubleUpLeft`)} <span class="item-text">${this.i18nStore?.t(`messageReader.replyAll`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`forward`)}>
              ${M(`arrowBendUpRight`)} <span class="item-text">${this.i18nStore?.t(`messageReader.forward`)}</span>
            </button>
            <div class="dropdown-divider"></div>
            `}
            ${!y&&!x&&!S?n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`archive`)}>
              ${M(`archiveBox`)} <span class="item-text">${this.i18nStore?.t(`messageReader.archive`)}</span>
            </button>
            `:``}
            ${!b&&!x&&!S&&!C?n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`reportSpam`)}>
              ${M(`warningDiamond`)} <span class="item-text">${this.i18nStore?.t(`messageReader.reportSpam`)}</span>
            </button>
            `:``}
            ${b?n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`notSpam`)}>
              ${M(`notSpam`)} <span class="item-text">${this.i18nStore?.t(`messageReader.notSpam`)}</span>
            </button>
            `:``}
            <button class="dropdown-item" @click=${()=>this._handleAction(`delete`)}>
              ${M(`trash`)} <span class="item-text">${te}</span>
            </button>
            <alps-folder-selector-popup
              class="folder-selector"
              .mailboxes=${this.mailboxes}
              .currentMailbox=${this.mailbox}
              @folder-selected=${e=>this._handleAction(e.detail.isMove?`moveTo`:`copyTo`,e.detail.folderName)}
            >
              <button slot="trigger" class="dropdown-item">
                ${M(`folderOpen`)} <span class="item-text">${this.i18nStore?.t(`messageReader.moveTo`)}</span>
              </button>
            </alps-folder-selector-popup>
            ${!x&&!C||!w?n`
            <div class="dropdown-divider"></div>
            ${!x&&!C?n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`markUnread`)}>
              ${M(ee?`envelopeOpen`:`envelopeUnread`)} <span class="item-text">${ee?this.i18nStore?.t(`messageReader.markRead`):this.i18nStore?.t(`messageReader.markUnread`)}</span>
            </button>
            `:``}
            ${w?``:n`
            <button class="dropdown-item" @click=${()=>this._handleAction(`star`)}>
              ${this.message?.Flags?.includes(`\\Flagged`)?M(`starFourFill`):M(`starFour`)} <span class="item-text">${this.i18nStore?.t(`messageReader.star`)}</span>
            </button>
            `}
            `:``}
            ${w?``:n`
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${()=>this._handleAction(`print`)}>
              ${M(`printer`)} <span class="item-text">${this.i18nStore?.t(`messageReader.print`)}</span>
            </button>
            `}
            <!-- Stays over a conversation: it is a preference about the READER,
                 not a verb on a message. -->
            <div class="dropdown-divider"></div>
            <button class="dropdown-item ${r===`text`?`active`:``}" ?disabled=${!this.hasText} @click=${()=>this.hasText&&this._handleAction(`showPlaintext`)}>
              ${M(`textAlignLeft`)}
              <span class="item-text">${this.i18nStore?.t(`messageReader.showPlaintext`)}</span>
            </button>
            <button class="dropdown-item ${r===`html`?`active`:``}" ?disabled=${!this.hasHtml} @click=${()=>this.hasHtml&&this._handleAction(`showHtml`)}>
              ${M(`code`)}
              <span class="item-text">${this.i18nStore?.t(`messageReader.showHtml`)}</span>
            </button>
            ${w?``:n`
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${()=>this._handleAction(`downloadMessage`)}>
              ${M(`downloadSimple`)} <span class="item-text">${this.i18nStore?.t(`messageReader.downloadMessage`)}</span>
            </button>
            <button class="dropdown-item" @click=${()=>this._handleAction(`showOriginal`)}>
              ${M(`codeBlock`)} <span class="item-text">${this.i18nStore?.t(`messageReader.showOriginal`)}</span>
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
              <div class="selection-icon">${M(`envelopeSimple`)}</div>
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
                ${i.RFC822Size?n`<div class="reader-size desktop-only">${et(i.RFC822Size,this.i18nStore)}</div>`:``}
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
                  ${i.RFC822Size?n`<span class="reader-size mobile-size">(${et(i.RFC822Size,this.i18nStore)})</span>`:``}
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
    `}};P([h({context:nr})],q.prototype,`settingsStore`,void 0),P([h({context:D})],q.prototype,`i18nStore`,void 0),P([h({context:Ga})],q.prototype,`composeStore`,void 0),P([a()],q.prototype,`localPreferredView`,void 0),P([a()],q.prototype,`hasHtml`,void 0),P([a()],q.prototype,`hasText`,void 0),P([o({type:String})],q.prototype,`mailbox`,void 0),P([o({type:Object})],q.prototype,`message`,void 0),P([o({type:Array})],q.prototype,`messages`,void 0),P([o({type:Object})],q.prototype,`selectedKeys`,void 0),P([o({type:Number})],q.prototype,`selectedCount`,void 0),P([o({type:Boolean})],q.prototype,`allSelectedStarred`,void 0),P([o({type:Boolean})],q.prototype,`allSelectedUnread`,void 0),P([o({type:Array})],q.prototype,`commonTags`,void 0),P([o({type:Boolean})],q.prototype,`bulkProcessing`,void 0),P([o({type:String})],q.prototype,`layoutMode`,void 0),P([o({type:Array})],q.prototype,`mailboxes`,void 0),P([a()],q.prototype,`content`,void 0),P([a()],q.prototype,`mimeType`,void 0),P([a()],q.prototype,`loading`,void 0),P([a()],q.prototype,`loadFailed`,void 0),P([a()],q.prototype,`activeBanners`,void 0),P([a()],q.prototype,`attachments`,void 0),P([a()],q.prototype,`allowRemoteResources`,void 0),P([a()],q.prototype,`hasRemoteResources`,void 0),P([a()],q.prototype,`rawMessageHtml`,void 0),P([a()],q.prototype,`isScrolled`,void 0),P([a()],q.prototype,`threadItems`,void 0),P([a()],q.prototype,`_isThread`,void 0),q=P([p(`alps-message-reader`)],q);function ks(e,t){let n=`#/${t}`;if(!e.startsWith(n))return!1;let r=e.slice(n.length);return r===``||r.startsWith(`/`)||r.startsWith(`?`)}var As=new class extends EventTarget{constructor(){super(),this.accounts=[],this.loading=!1,this.initialized=!1,this.epoch=0,window.addEventListener(`session-cleared`,()=>{this.epoch++,this.accounts=[],this.initialized=!1,this.loading=!1,this.dispatchEvent(new Event(`change`))})}getAccounts(){return this.accounts}isLoading(){return this.loading}isInitialized(){return this.initialized}async fetchAccounts(){let e=this.epoch;this.loading=!0,this.dispatchEvent(new Event(`change`));try{let t=await fetch(`/accounts`);if(t.ok){let n=await t.json();if(e!==this.epoch)return;this.accounts=n.accounts||[],this.initialized=!0}else x.error(`Failed to fetch linked accounts`)}catch(e){x.error(`Error fetching linked accounts:`,e)}finally{e===this.epoch&&(this.loading=!1,this.dispatchEvent(new Event(`change`)))}}async addAccount(e,t,n=``){let r=new URLSearchParams;r.append(`username`,e),r.append(`password`,t),r.append(`display_name`,n);let i=await fetch(`/accounts`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:r.toString()});if(!i.ok){let e=await i.json().catch(()=>({}));throw Error(e.error||`Failed to add linked account`)}await this.fetchAccounts()}async removeAccount(e){let t=await fetch(`/accounts/${encodeURIComponent(e)}`,{method:`DELETE`});if(!t.ok){let e=await t.json().catch(()=>({}));throw Error(e.error||`Failed to remove linked account`)}await this.fetchAccounts()}async switchAccount(e){let t=new URLSearchParams;t.append(`username`,e);let n=await fetch(`/accounts/switch`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:t.toString()});if(!n.ok){let e=await n.json().catch(()=>({}));throw Error(e.error||`Failed to switch account`)}return await n.json()}},js=u(`alps-linked-accounts`),Ms=class extends d{constructor(...e){super(...e),this.username=``,this.isMobile=!1,this.currentTab=`messages`,this._handleStoreChange=()=>{this.requestUpdate()}}static{this.styles=[yo,v`
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
  `]}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&(this.i18nStore?.addEventListener(`change`,this._handleStoreChange),this.settingsStore?.addEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.addEventListener(`change`,this._handleStoreChange),window.addEventListener(`plugins-updated`,this._handleStoreChange),this.linkedAccountsStore&&!this.linkedAccountsStore.isInitialized()&&this.linkedAccountsStore.fetchAccounts())})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),this.settingsStore?.removeEventListener(`change`,this._handleStoreChange),this.linkedAccountsStore?.removeEventListener(`change`,this._handleStoreChange),window.removeEventListener(`plugins-updated`,this._handleStoreChange)}_closePopup(){let e=this.shadowRoot?.querySelector(`alps-popup`);e&&e.close()}_handleSettings(){this._closePopup(),this.dispatchEvent(new CustomEvent(`open-settings`,{bubbles:!0,composed:!0}))}_handleSignOut(){this._closePopup(),this.dispatchEvent(new CustomEvent(`sign-out`,{bubbles:!0,composed:!0}))}_handleTabChange(e){this._closePopup(),e===`messages`?window.location.hash.startsWith(`#/mailbox/`)||(window.location.hash=`#/`):ks(window.location.hash,e)||(window.location.hash=`#/`+e),this.dispatchEvent(new CustomEvent(`change-tab`,{detail:{tab:e},bubbles:!0,composed:!0}))}async _handleSwitchAccount(e){this._closePopup();let t=document.createElement(`div`);document.body.appendChild(t),s(n`
      <style>
        @keyframes global-spin { to { transform: rotate(360deg); } }
        .switch-overlay svg { width: 100%; height: 100%; fill: currentColor; }
      </style>
      <div id="switch-account-overlay" class="switch-overlay" style="position: fixed; inset: 0; background-color: var(--bg-primary, #ffffff); z-index: 999999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease-in;">
        <div style="display: inline-flex; width: 32px; height: 32px; animation: global-spin 1s linear infinite; color: var(--accent-color, #2563eb);">
          ${M(`edelweiss`)}
        </div>
      </div>
    `,t);let r=t.querySelector(`#switch-account-overlay`);requestAnimationFrame(()=>{requestAnimationFrame(()=>{r&&(r.style.opacity=`1`)})}),await new Promise(e=>setTimeout(e,300));try{if((await this.linkedAccountsStore.switchAccount(e)).requires_2fa){or(!1),K.clear(),sessionStorage.clear();try{sessionStorage.setItem(`pending_2fa_username`,e),sessionStorage.setItem(`pending_2fa_is_switch`,`1`)}catch{}window.location.hash=`#/login/webauthn`,r&&(r.style.opacity=`0`),setTimeout(()=>t.remove(),300)}else or(!1),sessionStorage.clear(),window.location.reload()}catch(e){r&&(r.style.opacity=`0`),setTimeout(()=>t.remove(),300),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e.message||this.i18nStore?.t(`linkedAccounts.switchError`),duration:5e3}}))}}render(){let e=this.settingsStore?.getState().name||this.username;return n`
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
            ${M(`envelopeSimple`)} <span class="item-text">${this.i18nStore?.t(`navigation.messages`)}</span>
          </button>
          ${T.getNavTabs().map(e=>n`
            <button class="dropdown-item ${this.currentTab===e.id?`active`:``}" @click="${()=>this._handleTabChange(e.id)}">
              ${M(e.icon||`star`)} <span class="item-text">${this.i18nStore?.t(e.labelKey)}</span>
            </button>
          `)}
          <div class="dropdown-divider"></div>
          <button class="dropdown-item ${this.currentTab===`settings`?`active`:``}" @click="${this._handleSettings}">
            ${M(`gear`)} <span class="item-text">${this.i18nStore?.t(`userMenu.settings`)}</span>
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click="${this._handleSignOut}">
            ${M(`signOut`)} <span class="item-text">${this.i18nStore?.t(`userMenu.signOut`)}</span>
          </button>
        </alps-popup>
      </div>
    `}};P([o({type:String})],Ms.prototype,`username`,void 0),P([o({type:Boolean})],Ms.prototype,`isMobile`,void 0),P([o({type:String})],Ms.prototype,`currentTab`,void 0),P([h({context:D})],Ms.prototype,`i18nStore`,void 0),P([h({context:nr})],Ms.prototype,`settingsStore`,void 0),P([h({context:js})],Ms.prototype,`linkedAccountsStore`,void 0),Ms=P([p(`user-profile-menu`)],Ms);var Ns=class extends d{constructor(...e){super(...e),this.username=``,this.currentTab=``,this.isMobile=!1,this.scrolled=!1,this.unsavedDraftsFailure=null,this._handleStoreChange=()=>{this.requestUpdate()},this.confirmSignOutWithUnsavedDrafts=async()=>{let e=this.unsavedDraftsFailure;this.unsavedDraftsFailure=null,e&&(e.keepRecoveryCopy(),await this.endSession(`signedOutDraftsKept`))},this.cancelSignOutWithUnsavedDrafts=()=>{this.unsavedDraftsFailure=null}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}static{this.styles=v`
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
  `}handleSettings(){window.location.hash=`/settings`}async handleSignOut(){try{await this.composeStore?.saveAllDirtyDrafts()}catch(e){this.unsavedDraftsFailure=e instanceof Pa?e:new Pa;return}await this.endSession(`signedOut`)}async endSession(e){qa(e),ms();try{await fetch(`/session`,{method:`DELETE`})}catch(e){x.error(`Sign-out request failed; ending the session locally anyway`,e)}K.clear(),or(),window.dispatchEvent(new CustomEvent(`session-cleared`)),window.location.hash=`#/login`}render(){return n`
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
    `}};P([o({type:String})],Ns.prototype,`username`,void 0),P([o({type:String})],Ns.prototype,`currentTab`,void 0),P([o({type:Boolean,reflect:!0})],Ns.prototype,`isMobile`,void 0),P([o({type:Boolean,reflect:!0})],Ns.prototype,`scrolled`,void 0),P([h({context:D})],Ns.prototype,`i18nStore`,void 0),P([h({context:Ga})],Ns.prototype,`composeStore`,void 0),P([a()],Ns.prototype,`unsavedDraftsFailure`,void 0),Ns=P([p(`alps-header`)],Ns);var Ps=class extends d{constructor(...e){super(...e),this.username=``,this.currentTab=`messages`,this.isMobile=!1,this.currentMailbox=``,this.mailboxes=[],this.searchQuery=``,this.scrolled=!1,this._handleStoreChange=()=>{this.requestUpdate()},this._handleHashChange=()=>{let e=window.location.hash;if(e.startsWith(`#/contacts`))this.currentTab=`contacts`;else if(e.startsWith(`#/settings`))this.currentTab=`settings`;else{let t=T.getNavTabs().find(t=>e.startsWith(`#/${t.id}`));t?this.currentTab=t.id:this.currentTab=`messages`}}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleStoreChange)}),window.addEventListener(`hashchange`,this._handleHashChange),window.addEventListener(`plugins-updated`,this._handleStoreChange),this._handleHashChange()}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange),window.removeEventListener(`hashchange`,this._handleHashChange),window.removeEventListener(`plugins-updated`,this._handleStoreChange)}static{this.styles=[Bn,v`
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

    .logo svg,
    .logo img.logo {
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
  `]}handleTabClick(e){ks(window.location.hash,e)||(this.currentTab=e,this.dispatchEvent(new CustomEvent(`change-tab`,{detail:{tab:e}})),e===`messages`?window.location.hash.startsWith(`#/mailbox/`)||(window.location.hash=`#/`):window.location.hash=`#/`+e)}render(){return n`
      <alps-header 
        .username=${this.username} 
        .isMobile=${this.isMobile} 
        .currentTab=${this.currentTab}
        .scrolled=${this.scrolled}
        @toggle-sidebar=${()=>this.dispatchEvent(new CustomEvent(`toggle-sidebar`))}
      >
        <div slot="left" class="header-left-slot">
          ${this.isMobile?``:n`
            <div class="logo">
              ${zn()}
            </div>
            <div class="nav-tabs">
              <div 
                class="nav-tab ${this.currentTab===`messages`?`active`:``}"
                @click=${()=>this.handleTabClick(`messages`)}
                title=${this.i18nStore?.t(`navigation.messages`)}
              >
                ${this.i18nStore?.t(`navigation.messages`)}
              </div>
              ${T.getNavTabs().map(e=>n`
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
          .placeholder=${this.currentTab===`contacts`?this.i18nStore?.t(`contacts.title`)||`Contacts`:this.currentTab===`calendar`?this.i18nStore?.t(`calendar.title`)||`Search Calendar`:this.currentTab===`tasks`?this.i18nStore?.t(`tasks.title`):this.currentMailbox?Ze(this.currentMailbox,this.i18nStore,this.mailboxes):this.i18nStore?.t(`search.placeholder`)}
          @keydown=${e=>{e.key===`Enter`&&(e.preventDefault(),this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:e.target.value},bubbles:!0,composed:!0})))}}
          @clear=${()=>{this.dispatchEvent(new CustomEvent(`search-submit`,{detail:{value:``},bubbles:!0,composed:!0}))}}
        ></alps-input>

        <div slot="right-actions">
        </div>
      </alps-header>
    `}};P([o({type:String})],Ps.prototype,`username`,void 0),P([o({type:String})],Ps.prototype,`currentTab`,void 0),P([o({type:Boolean})],Ps.prototype,`isMobile`,void 0),P([o({type:String})],Ps.prototype,`currentMailbox`,void 0),P([o({type:Array})],Ps.prototype,`mailboxes`,void 0),P([o({type:String})],Ps.prototype,`searchQuery`,void 0),P([o({type:Boolean})],Ps.prototype,`scrolled`,void 0),P([h({context:D})],Ps.prototype,`i18nStore`,void 0),Ps=P([p(`app-header`)],Ps);var Fs=class extends d{constructor(...e){super(...e),this.hidden=!1}static{this.styles=v`
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
  `}render(){return n`<alps-loader></alps-loader>`}};P([o({type:Boolean,reflect:!0})],Fs.prototype,`hidden`,void 0),Fs=P([p(`alps-initial-loader`)],Fs);var Is=1e4,Ls=e=>!!e?.Flags?.includes(B),Rs=(e,t)=>(e?.length??0)===(t?.length??0)&&(e??[]).every((e,n)=>e===t[n]);function zs(e,t){return e===t?!0:!e||e.length!==t.length?!1:JSON.stringify(e)===JSON.stringify(t)}function Bs(e){return(e||[]).map(e=>{let{name:t,email:n}=Sn(Tn(e)),r=n.lastIndexOf(`@`);return{Name:t,Mailbox:r===-1?n:n.slice(0,r),Host:r===-1?``:n.slice(r+1)}})}var Vs=250,Hs=150,Us=500,Ws=64,Gs=120,Ks=380,qs=300,Js=57,Ys=150,Xs=250,J=class extends d{constructor(...e){super(...e),this.showDeleteConfirm=!1,this.listLoadFailed=!1,this.pendingDeleteDetails=null,this.markReadTimer=null,this.notificationSound=null,this.audioUnlocked=!1,this.unlockAudio=()=>{if(this.audioUnlocked||!this.settingsStore.getState().soundNotifications)return;let e=this.chime();e.muted=!0,e.play().then(()=>{e.pause(),e.currentTime=0,this.audioUnlocked=!0}).catch(()=>{}).finally(()=>{e.muted=!1}),document.removeEventListener(`click`,this.unlockAudio),document.removeEventListener(`keydown`,this.unlockAudio)},this.mailboxes=[],this.messages=[],this.currentMailbox=O,this.loadingMessages=!0,this.showInitialLoader=!window.alpsAppLoaded,this.selectedMessage=null,this.selectedKeys=new Set,this.selectAllMatching=!1,this.excludedKeys=new Set,this.layoutMode=`vertical`,this.filterQuery=``,this.expandedFolders=new Set([O]),this.username=``,this.currentPage=0,this.listedPage=0,this.listedMailbox=``,this.listedQuery=``,this.totalMessages=0,this.messagesPerPage=50,this.resizerPositionX=Vs+Math.max(Ks,(window.innerWidth-Vs)*.4),this.listHeight=Math.max(Xs,(window.innerHeight-Js)*.4),this.isSidebarDragging=!1,this.isPaneDragging=!1,this.sidebarWidth=Vs,this.densityMode=`compact`,this.showSenderAvatars=!0,this.isSyncing=!1,this.sidebarCollapsed=!1,this.sortOrder=`desc`,this.listScrolled=!1,this.targetUid=null,this.targetMailbox=null,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.bulkProcessing=!1,this.computedMinListWidth=Ks,this._mql=window.matchMedia(`(max-width: 768px)`),this._relayToast=e=>{this.showGlobalToast(e.detail.message,e.detail.actionLabel,e.detail.actionFn,e.detail.duration)},this._handleMediaQuery=e=>{this.isMobile=e.matches,this.isMobile||(this.mobileSidebarOpen=!1)},this.hasConnected=!1,this.handleDraftAutosaved=e=>{let{oldUid:t,oldMailbox:n,newUid:r,mailbox:i,subject:a,to:o,cc:s,bcc:c,hasAttachments:l,size:u}=e.detail;if(!this.messages)return;let d=String(r),f=!1,p=t?L(n||i,t):null,m=Bs(o),h=Bs(s),g=Bs(c),_=e=>({...e,UID:d,...e.Mailbox?{Mailbox:i}:{},Size:u||e.Size,RFC822Size:u||e.RFC822Size,HasAttachments:l,_isAutosaveUpdate:!0,Envelope:{...e.Envelope,Subject:a,To:m,Cc:h,Bcc:g}});if(p){let e=this.messages.findIndex(e=>this.keyOf(e)===p);if(e!==-1){let t=[...this.messages];t[e]=_(t[e]),this.messages=t,f=!0,this.selectedMessage&&this.keyOf(this.selectedMessage)===p&&this.followAutosavedSelection(t[e])}else for(let e=0;e<this.messages.length;e++){let t=this.messages[e];if(t.SubMessages){let n=t.SubMessages.findIndex(e=>this.keyOf(e)===p);if(n!==-1){let r=[...t.SubMessages];r[n]=_(r[n]);let i=[...this.messages];i[e]={...t,SubMessages:r},this.messages=i,f=!0,this.selectedMessage&&this.keyOf(this.selectedMessage)===p&&this.followAutosavedSelection(r[n]);break}}}!f&&this.selectedMessage&&this.keyOf(this.selectedMessage)===p&&this.followAutosavedSelection(_(this.selectedMessage))}if(!f&&this.currentMailbox===i&&!(this.listLoadFailed&&this.messages.length===0)){let e=this.settingsStore?.getState().name||this.username,n=(this.username||``).split(`@`),i=n[0]||``,o=n[1]||``,s={UID:d,Size:u||0,RFC822Size:u||0,HasAttachments:l,Flags:[z,Rr],_isAutosaveUpdate:!0,Envelope:{Subject:a,Date:new Date().toISOString(),From:[{Name:e,Mailbox:i,Host:o}],To:m,Cc:h,Bcc:g}},c=this.messages.filter(e=>String(e.UID)!==String(t)&&String(e.UID)!==String(r));this.messages=[s,...c]}},this._handleSettingsChange=()=>{this._syncSettings()},this._handleI18nChange=()=>{this.requestUpdate()},this.handleLabelsSuccess=e=>{let{mailboxes:t}=e.detail;this.mailboxes=t},this.handleSyncStart=e=>{let t=e.detail;this.isSyncing=!0,!t.background&&!t.quiet&&(this.loadingMessages=!0,this.listLoadFailed=!1)},this.handleSyncSuccess=e=>{this.isSyncing=!1,this.listLoadFailed=!1;let{data:t,background:n}=e.detail,r=e.detail.announce!==!1;if(t.Username){this.username=t.Username;let e=this.settingsStore.getState(),n=t.Address||void 0;(e.loginUsername!==t.Username||e.loginAddress!==n)&&this.settingsStore.updateSettings({loginUsername:t.Username,loginAddress:n})}let i=this.mailboxes.length===0,a=!1,o=!1,s=0;if(t.Mailboxes){for(let e of t.Mailboxes){let t=e.Name||e.Mailbox,r=this.mailboxes.find(e=>(e.Name||e.Mailbox)===t);if(r&&!i&&n&&e.Total!==void 0&&r.Total!==void 0&&e.Unseen!==void 0&&r.Unseen!==void 0){let n=Math.min(e.Total-r.Total,e.Unseen-r.Unseen);n>0&&(a=!0,t.toUpperCase()===`INBOX`&&(o=!0,s+=n))}}this.mailboxes=t.Mailboxes}if(r&&a&&this.settingsStore.getState().soundNotifications){let e=this.chime();e.currentTime=0,e.play().catch(e=>{e.name!==`NotAllowedError`&&x.error(`Failed to play sound notification:`,e)})}if(r&&o&&this.settingsStore.getState().desktopNotifications&&`Notification`in window&&Notification.permission===`granted`){let e=this.i18nStore?.t(`mailboxPage.newMessages`),t=s===1?this.i18nStore?.t(`mailboxPage.newMessagesSingleBody`):this.i18nStore?.t(`mailboxPage.newMessagesMultiBody`,{count:s});try{let n=new Notification(e,{body:t,icon:`/apple-touch-icon.png`,tag:`alps-new-message`});n.onclick=()=>{window.focus(),n.close(),this.currentMailbox===`INBOX`?(this.currentPage=0,R.fetch(this.currentMailbox,0,this.filterQuery,!1)):this.updateUrl(`INBOX`,0,null,``)}}catch(e){x.error(`Failed to show desktop notification:`,e)}}if(o&&this.currentMailbox!==`INBOX`&&this.showGlobalToast(this.i18nStore?.t(`mailboxPage.newMessagesInInbox`),this.i18nStore?.t(`mailboxPage.open`),()=>{this.updateUrl(`INBOX`,0,null,``)},5e3),n&&this.currentPage>0)t.Total!==void 0&&t.Total!==this.totalMessages&&this.showGlobalToast(this.i18nStore?.t(`mailboxPage.newMessagesAvailable`),this.i18nStore?.t(`mailboxPage.refresh`),()=>{this.currentPage=0,R.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)});else if(this.pastTheLastPage(t)){let e=t.MessagesPerPage||this.messagesPerPage,n=Math.max(0,Math.ceil(t.Total/e)-1);this.currentPage=n,window.history.replaceState(null,``,this.hashFor(this.currentMailbox,n,this.targetUid,this.filterQuery,this.targetMailbox)),R.fetch(this.currentMailbox,n,this.filterQuery,!1,!0);return}else if(t.Page!==void 0&&(this.currentPage=t.Page),this.listedPage=t.Page===void 0?this.currentPage:t.Page,this.listedMailbox=t.ListedMailbox||this.currentMailbox,this.listedQuery=this.filterQuery,t.Total!==void 0&&(this.totalMessages=t.Total),t.MessagesPerPage!==void 0&&(this.messagesPerPage=t.MessagesPerPage),t.Messages){if(zs(this.messages,t.Messages)||(this.messages=t.Messages,this.selectAllMatching&&(this.selectedKeys=new Set(this.listedKeys().filter(e=>!this.excludedKeys.has(e))))),this.selectedMessage){let e=this.messages.find(e=>this.isOpen(e));e&&e.Flags&&!Rs(this.selectedMessage.Flags,e.Flags)&&(this.selectedMessage={...this.selectedMessage,Flags:e.Flags})}}else this.messages=[];n||(this.loadingMessages=!1,this.applyTargetUid(),this.showInitialLoader&&setTimeout(()=>{this.showInitialLoader=!1,window.alpsAppLoaded=!0},100))},this.handleSyncUnchanged=()=>{this.isSyncing=!1},this.handleSyncError=e=>{this.isSyncing=!1;let{background:t}=e.detail;t||(this.loadingMessages=!1,this.listLoadFailed=!0,(this.listedMailbox!==this.currentMailbox||this.listedPage!==this.currentPage||this.listedQuery!==this.filterQuery)&&(this.messages=[]))},this.handleStrayArrow=e=>{if(e.key!==`ArrowDown`&&e.key!==`ArrowUp`||e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||this.showDeleteConfirm)return;let t=e.composedPath().filter(e=>e instanceof HTMLElement),n=t[0],r=n?.classList.contains(`folder-name`)&&t.some(e=>e.tagName===`ALPS-FOLDER-LIST`);if(!n||n!==document.body&&n.tagName!==`A`&&!r||t.some(e=>e.tagName===`ALPS-MESSAGE-LIST`||e.tagName===`DIALOG`||[`dialog`,`menu`,`listbox`].includes(e.getAttribute(`role`)??``)))return;let i=this.renderRoot.querySelector(`alps-message-list`);i&&(e.preventDefault(),i.step(e.key===`ArrowDown`?1:-1))},this.handleMailboxNotFound=()=>{this.showGlobalToast(this.i18nStore.t(`mailboxPage.mailboxNotFound`),``,void 0,3e3),this.updateUrl(O,0,null,null)},this.handleHashChange=()=>{let e=this.currentMailbox,t=this.currentPage,n=this.targetUid,r=this.targetMailbox,i=this.filterQuery;this.extractMailboxFromHash(),e!==this.currentMailbox||t!==this.currentPage||i!==this.filterQuery?(e===this.currentMailbox?i!==this.filterQuery&&(this.loadingMessages=!0,this.currentPage=0,this.clearSelection()):(this.selectedMessage=null,this.currentPage=0,this.clearSelection(),this.loadingMessages=!0),R.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)):(n!==this.targetUid||r!==this.targetMailbox)&&this.applyTargetUid()},this.stopResize=null,this.startResize=e=>{e.preventDefault(),this.stopResize?.(),this.isPaneDragging=!0,this.updateComputedMinWidth();let t=e=>{if(this.layoutMode===`vertical`){let t=this.sidebarCollapsed?Ws:this.sidebarWidth,n=Math.max(t+this.computedMinListWidth,Math.min(e.clientX,window.innerWidth-qs));this.resizerPositionX=n}else this.layoutMode===`horizontal`&&(this.listHeight=Math.max(Ys,Math.min(e.clientY-Js,window.innerHeight-Ys)))},n=()=>{this.stopResize=null,this.isPaneDragging=!1,window.removeEventListener(`mousemove`,t),window.removeEventListener(`mouseup`,n)};this.stopResize=n,window.addEventListener(`mousemove`,t),window.addEventListener(`mouseup`,n)},this.rowsAfterTakeOut=null,this.handleDroppedMessages=e=>{let{folder:t,copy:n,keys:r,selection:i}=e.detail;if(!ze(this.mailboxes.find(e=>(e.Name||e.Mailbox)===t),this.mailboxes,this.currentMailbox))return;if(i&&this.selectionCount>0){this._handleReaderAction(new CustomEvent(`action`,{detail:{action:n?`copyTo`:`moveTo`,folder:t}}));return}let a=r.filter(e=>xr(e).mailbox!==t);a.length!==0&&(n?this.copyKeys(a,t,a.length>1):this.fileDropped(a,t))}}chime(){return this.notificationSound??=new Audio(`/assets/notify.wav`)}static{this.styles=v`
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
    .layout-vertical alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${Vs}px); flex-shrink: 0; }
    .layout-vertical .main-view { flex: 1; display: flex; flex-direction: row; min-width: 0; }
    .layout-vertical .message-list-pane { width: ${Ks}px; flex-shrink: 0; border-right: 1px solid var(--border-color); }
    .layout-vertical .message-reader-pane { flex: 1; min-width: 0; }

    /* Horizontal: Sidebar (250px) | [ Message List (50%) / Reader (50%) ] */
    .layout-horizontal alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${Vs}px); flex-shrink: 0; }
    .layout-horizontal .main-view { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .layout-horizontal .message-list-pane { flex-shrink: 0; border-bottom: 1px solid var(--border-color); }
    .layout-horizontal .message-reader-pane { flex: 1; min-height: 0; }

    /* Full: Sidebar (250px) | Message List OR Reader */
    .layout-full alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${Vs}px); flex-shrink: 0; }
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
      --sidebar-width: ${Ws}px;
    }

    .app-container.collapsed .message-list-pane {
      box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
      z-index: 25;
      border-left: 1px solid var(--border-color);
    }



    `}updateComputedMinWidth(){let e=Ks,t=this.shadowRoot?.querySelector(`.message-list-pane alps-message-list`);if(t){let n=t.shadowRoot?.querySelector(`.list-header`);if(n){let t=at(n);e=Math.max(Ks,t+2)}}if(e!==this.computedMinListWidth){this.computedMinListWidth=e;let t=this.sidebarCollapsed&&!this.isMobile?Ws:this.sidebarWidth;this.resizerPositionX-t<e&&(this.resizerPositionX=t+e)}}showGlobalToast(e,t=``,n,r=3e3){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e,actionLabel:t,actionFn:n,duration:r}}))}reportActionFailed(e,t){this.showGlobalToast(this.i18nStore?.t(e)||t,``,void 0,4e3)}reportFlagFailure(e){if(e.reason===`auth`)return;let t=e.reason===`unsupported`?`toast.tagNotSupported`:`toast.flagChangeFailed`,n=e.reason===`unsupported`?`That tag is not supported by this mail server`:`Could not update the messages`;this.showGlobalToast(this.i18nStore?.t(t)||n,``,void 0,4e3)}get canArchiveHere(){let e=A(this.currentMailbox,this.mailboxes);return e!==`trash`&&e!==`drafts`&&e!==`archive`}get effectiveListWidth(){let e=this.sidebarCollapsed&&!this.isMobile?Ws:this.sidebarWidth;return Math.max(this.computedMinListWidth,this.resizerPositionX-e)}get selectedListed(){if(this.selectedKeys.size===0)return[];let e=[];for(let t of this.messages){this.selectedKeys.has(this.keyOf(t))&&e.push(t);for(let n of t.SubMessages||[])this.selectedKeys.has(this.keyOf(n))&&e.push(n)}return e}get selectedStarRows(){let e=[];for(let t of this.messages){let n=[t,...t.SubMessages||[]],r=n.filter(e=>this.selectedKeys.has(this.keyOf(e)));if(n.length>1&&r.length===n.length)e.push({face:t,messages:n});else for(let t of r)e.push({face:t,messages:[t]})}return e}get allSelectedStarred(){let e=this.selectedStarRows;return e.length>0&&e.every(e=>e.messages.some(Ls))}starWrite(e){let t=e.length>0&&e.every(e=>e.messages.some(Ls));return{keys:(t?e.flatMap(e=>e.messages.filter(Ls)):e.filter(e=>!e.messages.some(Ls)).map(e=>e.face)).map(e=>this.keyOf(e)),op:t?`remove`:`add`}}get commonSelectedTags(){let e=this.selectedListed;return e.length===0?[]:[`$label1`,`$label2`,`$label3`,`$label4`,`$label5`].filter(t=>e.every(e=>e.Flags?.some(e=>e.toLowerCase()===t.toLowerCase())))}get allSelectedUnread(){let e=!1;for(let t of this.messages){let n=[t,...t.SubMessages||[]].filter(e=>this.selectedKeys.has(this.keyOf(e)));if(n.length!==0&&(e=!0,n.every(e=>e.Flags?.includes(`\\Seen`))))return!1}return e}get selectionCount(){return this.selectAllMatching?Math.max(0,this.totalMessages-this.excludedKeys.size):this.selectedKeys.size}get matchingScope(){return{query:this.filterQuery,except:[...this.excludedKeys].map(e=>xr(e).uid)}}listedKeys(){let e=[];for(let t of this.messages||[]){e.push(this.keyOf(t));for(let n of t.SubMessages||[])e.push(this.keyOf(n))}return e}takeSelection(e){if(this.selectedKeys=e,!this.selectAllMatching)return;let t=new Set(this.excludedKeys);for(let n of this.listedKeys())e.has(n)?t.delete(n):t.add(n);this.excludedKeys=t,this.selectionCount<=0&&this.clearSelection()}selectAllInFolder(){this.selectAllMatching=!0,this.excludedKeys=new Set,this.selectedKeys=new Set(this.listedKeys())}clearSelection(){this.selectAllMatching=!1,this.excludedKeys=new Set,this.selectedKeys=new Set}mailboxOf(e){return Cr(e,this.currentMailbox)}keyOf(e){return L(this.mailboxOf(e),e?.UID)}isOpen(e){return!!this.selectedMessage&&!!e&&this.keyOf(this.selectedMessage)===this.keyOf(e)}connectedCallback(){super.connectedCallback();let e=this.hasConnected;this.hasConnected=!0,e&&!window.location.hash.startsWith(`#/mailbox/`)&&window.history.replaceState(null,``,this.hashFor(this.currentMailbox,this.currentPage,this.targetUid,this.filterQuery,this.targetMailbox));let t=[this.currentMailbox,this.currentPage,this.filterQuery].join(`
`);e?this.handleHashChange():this.extractMailboxFromHash(),window.addEventListener(`hashchange`,this.handleHashChange),document.addEventListener(`click`,this.unlockAudio),document.addEventListener(`keydown`,this.unlockAudio),document.addEventListener(`keydown`,this.handleStrayArrow),this._mql.addEventListener(`change`,this._handleMediaQuery),this._handleMediaQuery(this._mql),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this.i18nStore?.addEventListener(`change`,this._handleI18nChange),this._syncSettings(),R.addEventListener(`sync-start`,this.handleSyncStart),R.addEventListener(`sync-success`,this.handleSyncSuccess),R.addEventListener(`sync-error`,this.handleSyncError),R.addEventListener(`sync-unchanged`,this.handleSyncUnchanged),R.addEventListener(`labels-success`,this.handleLabelsSuccess),R.addEventListener(`mailbox-not-found`,this.handleMailboxNotFound),window.addEventListener(`draft-autosaved`,this.handleDraftAutosaved),e?t===[this.currentMailbox,this.currentPage,this.filterQuery].join(`
`)&&R.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0,!0):R.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0)}disconnectedCallback(){super.disconnectedCallback(),this.stopResize?.(),window.removeEventListener(`hashchange`,this.handleHashChange),this._mql.removeEventListener(`change`,this._handleMediaQuery),document.removeEventListener(`click`,this.unlockAudio),document.removeEventListener(`keydown`,this.unlockAudio),document.removeEventListener(`keydown`,this.handleStrayArrow),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),R.removeEventListener(`sync-start`,this.handleSyncStart),R.removeEventListener(`sync-success`,this.handleSyncSuccess),R.removeEventListener(`sync-error`,this.handleSyncError),R.removeEventListener(`sync-unchanged`,this.handleSyncUnchanged),R.removeEventListener(`labels-success`,this.handleLabelsSuccess),R.removeEventListener(`mailbox-not-found`,this.handleMailboxNotFound),window.removeEventListener(`draft-autosaved`,this.handleDraftAutosaved),R.stop()}updated(e){super.updated(e),(e.has(`sidebarCollapsed`)||e.has(`layoutMode`)||e.has(`currentMailbox`)||e.has(`isMobile`)||e.has(`mailboxes`))&&setTimeout(()=>this.updateComputedMinWidth(),0)}followAutosavedSelection(e){this.selectedMessage=e,this.targetUid=String(e.UID);let t=this.mailboxOf(e);this.targetMailbox=t===this.currentMailbox?null:t,window.history.replaceState(null,``,this.hashFor(this.currentMailbox,this.currentPage,this.targetUid,this.filterQuery,this.targetMailbox))}_syncSettings(){let e=this.settingsStore.getState();this.layoutMode=e.layoutMode,this.densityMode=e.densityMode,this.showSenderAvatars=e.showSenderAvatars??!0,this.sortOrder=e.sortOrder||`desc`,e.loginUsername&&(this.username=e.loginUsername),this.sidebarCollapsed!==e.sidebarCollapsed&&(this.sidebarCollapsed=e.sidebarCollapsed),e.messagesPerPage&&e.messagesPerPage>0&&(this.messagesPerPage=e.messagesPerPage),R.setListingSettings([e.sortOrder,e.messageSortCriteria,e.messagesPerPage,e.enableThreading].join(` `)),e.checkMailInterval!==void 0&&R.start(e.checkMailInterval)}pastTheLastPage(e){let t=e.Page??this.currentPage,n=e.MessagesPerPage||this.messagesPerPage;return t<=0||(e.Messages?.length??0)>0||e.Total===void 0||e.Total<=0||n<=0?!1:Math.ceil(e.Total/n)-1<t}openFolderPrompt(){let e=this.shadowRoot?.querySelector(`alps-folder-list`);e&&typeof e.triggerCreateFolder==`function`&&e.triggerCreateFolder()}updateUrl(e,t,n,r=this.filterQuery,i=null){window.location.hash=this.hashFor(e,t,n,r,i)}hashFor(e,t,n,r,i){let a=`#/mailbox/${encodeURIComponent(e)}`,o=new URLSearchParams;t>0&&o.set(`p`,t.toString()),n&&(o.set(`uid`,n),i&&i!==e&&o.set(`in`,i)),r&&o.set(`q`,r);let s=o.toString();return s&&(a+=`?`+s),a}openKeyInUrl(e,t,n){if(!n){this.updateUrl(e,t,null);return}let{mailbox:r,uid:i}=xr(n);this.updateUrl(e,t,i,void 0,r)}extractMailboxFromHash(){let e=window.location.hash;if(e.startsWith(`#/mailbox/`)){let t=e.substring(10),n=t.indexOf(`?`),r=``;n!==-1&&(r=t.substring(n+1),t=t.substring(0,n));let i=t.split(`/`);this.currentMailbox=decodeURIComponent(i[0]);let a=new URLSearchParams(r);i.length>1&&i[1]?(this.targetUid=i[1],this.targetMailbox=null):(this.targetUid=a.get(`uid`)||null,this.targetMailbox=this.targetUid&&a.get(`in`)||null);let o=a.get(`p`);o?this.currentPage=parseInt(o,10)||0:this.currentPage=0,this.filterQuery=a.get(`q`)||``}else this.currentMailbox=O,this.targetUid=null,this.targetMailbox=null,this.currentPage=0}async applyTargetUid(){if(!this.targetUid){this.markReadTimer&&=(clearTimeout(this.markReadTimer),null),this.selectedMessage=null;return}let e=this.targetUid,t=this.targetMailbox,n=t||this.currentMailbox,r=L(n,e),i=this.messages.find(e=>this.keyOf(e)===r);if(!i&&this.messages.length>0)try{let t=this.settingsStore?.getState()?.preferredView||`html`,r=K.generation(),a=await N(`/mailboxes/${k(n)}/messages/${e}?view=${t}`);if(a.ok){let e=await a.json();if(e.Message){i={...e.Message,Mailbox:e.Message.Mailbox||n};let a=e.Part;if((!a||typeof e.Body==`string`)&&K.generation()===r){let n=!!a&&(a.MIMEType||a.MimeType||`text/plain`).toLowerCase()===`text/html`;K.set(i.Mailbox,String(i.UID),t,{Message:e.Message,Part:a,Attachments:e.Attachments,RawHtml:a&&n?e.Body:void 0,RawText:a&&!n?e.Body:void 0,HasHTML:!!e.HasHTML,HasText:!!e.HasText})}}}}catch(e){x.error(`Failed to fetch shifted message:`,e)}this.targetUid!==e||this.targetMailbox!==t||(i?this.isOpen(i)||(this.selectedMessage=i,this.layoutMode===`full`&&(this.expandedFolders=new Set),this._scheduleMarkAsRead(i)):this.messages.length>0&&(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)))}async selectMessage(e){this.openKeyInUrl(this.currentMailbox,this.currentPage,this.keyOf(e))}_scheduleMarkAsRead(e){if(this.markReadTimer&&=(clearTimeout(this.markReadTimer),null),e.Flags?.includes(`\\Seen`))return;let t=this.settingsStore?.getState().markReadTimeout??0;t<0||(t===0?this._doMarkAsRead(e):this.markReadTimer=setTimeout(()=>{this._doMarkAsRead(e)},t*1e3))}updateLocalMessageFlags(e,t,n){let r=new Set(e),i=[],a=[...this.messages],o=e=>{let r=!!e.Flags?.includes(t);return n===`add`&&!r?{...e,Flags:[...e.Flags||[],t]}:n===`remove`&&r?{...e,Flags:e.Flags.filter(e=>e!==t)}:e};for(let e=0;e<a.length;e++){let t=a[e];if(r.has(this.keyOf(t))){let n=o(t);n!==t&&(a[e]=t=n,i.push(this.keyOf(t)))}if(t.SubMessages?.some(e=>r.has(this.keyOf(e)))){let n=t.SubMessages.map(e=>r.has(this.keyOf(e))?o(e):e),s=n.filter((e,n)=>e!==t.SubMessages[n]);if(s.length>0){a[e]={...t,SubMessages:n};for(let e of s)i.push(this.keyOf(e))}}}if(i.length>0){if(this.messages=a,this.selectedMessage&&r.has(this.keyOf(this.selectedMessage))){let e=this.selectedMessage.Flags&&this.selectedMessage.Flags.includes(t);n===`add`&&!e?this.selectedMessage.Flags=[...this.selectedMessage.Flags||[],t]:n===`remove`&&e&&(this.selectedMessage.Flags=this.selectedMessage.Flags.filter(e=>e!==t)),this.selectedMessage={...this.selectedMessage}}window.dispatchEvent(new CustomEvent(`external-message-flags-changed`,{detail:{keys:e,flag:t,action:n}}))}return i}async _handleListToggleStar(e){let t=e.detail.message,{keys:n,op:r}=this.starWrite([{face:t,messages:e.detail.messages??[t]}]),i=r===`add`?`remove`:`add`;this.updateLocalMessageFlags(n,B,r);let a=new Set,o;try{o=(await this.eachFolder(n,async(e,t)=>{let n=await V.setFlag(e,t,[B],r);if(n.ok)for(let n of t)a.add(L(e,n));return n})).refused}catch{}let s=n.filter(e=>!a.has(e));s.length>0&&(this.updateLocalMessageFlags(s,B,i),o&&this.reportFlagFailure(o))}async _doMarkAsRead(e){let t=await V.markAsRead(this.mailboxOf(e),e);t?.Flags?.includes(`\\Seen`)&&(this.isOpen(e)&&(this.selectedMessage=t),this.updateLocalMessageFlags([this.keyOf(e)],z,`add`))}async handleNamedMessageAction(e){let t=String(e.uid),n=e.mailbox,r=L(n,t),i=!!this.selectedMessage&&this.keyOf(this.selectedMessage)===r;if(e.action===`downloadMessage`){let e=document.createElement(`a`);e.href=`/mailboxes/${k(n)}/messages/${t}/raw`,e.download=``,document.body.appendChild(e),e.click(),document.body.removeChild(e);return}if(e.action===`showOriginal`){window.open(`#/original?mailbox=${encodeURIComponent(n)}&uid=${t}`,`_blank`);return}if(e.action===`markUnread`){let e=await V.setFlag(n,[t],[z],`remove`);if(!e.ok){this.reportFlagFailure(e);return}this.updateLocalMessageFlags([r],z,`remove`),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null);return}if(e.action!==`delete`)return;if(this.deletesForGood(n)){this.pendingDeleteDetails={isBulk:!1,doomed:[r],toTrash:[],isDrafts:A(n,this.mailboxes)===`drafts`,named:{isOpen:i,nextUid:e.nextUid,done:e.done}},this.showDeleteConfirm=!0;return}let a=Pe(`trash`,this.mailboxes,ke),o=this.currentMailbox,s=await V.moveMessages(n,[t],a);if(!s.success){e.done?.(!1),s.reason!==`auth`&&this.reportActionFailed(`toast.moveFailed`,`Could not move that`);return}e.done?.(!0),i&&this.leaveDeletedMessage(e.nextUid);let c=s.uidMapping?.[t],l=c?async()=>{try{let e=await V.moveMessages(a,[c],n);if(!e.success){e.reason!==`auth`&&this.reportActionFailed(`toast.undoFailed`,`Could not undo that`);return}let t=e.uidMapping?.[c];if(i){let e=this.currentMailbox===o?this.currentPage:0;this.openKeyInUrl(o,e,t?L(n,t):null)}else this.renderRoot.querySelector(`alps-message-reader`)?.reloadConversation()}catch(e){x.error(`Undo failed`,e),this.reportActionFailed(`toast.undoFailed`,`Could not undo that`)}}:void 0;this.showGlobalToast(this.movedMessage(!1,1,a),l?this.i18nStore?.t(`mailboxPage.undo`):``,l,Is)}leaveDeletedMessage(e){if(e){this.updateUrl(this.currentMailbox,this.currentPage,e);return}this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)}async eachFolder(e,t){let n=[],r;return await R.afterWrites(async()=>{for(let[i,a]of Sr(e)){let e=await t(i,a);if(e.ok){n.push({mailbox:i,uids:a,result:e});continue}if(r??=e,e.reason===`auth`)break}}),{done:n,refused:r}}writtenKeys(e){return e.flatMap(({mailbox:e,uids:t})=>t.map(t=>L(e,t)))}async flagEach(e,t,n){let r=t.map(t=>({flag:t,keys:this.updateLocalMessageFlags(e,t,n)})),i=new Set,{refused:a}=await this.eachFolder(e,async(e,r)=>{let a=await V.setFlag(e,r,t,n);if(a.ok)for(let t of r)i.add(L(e,t));return a});if(i.size<e.length){let e=n===`add`?`remove`:`add`;for(let{flag:t,keys:n}of r){let r=n.filter(e=>!i.has(e));r.length>0&&this.updateLocalMessageFlags(r,t,e)}}return a??{ok:!0}}async flagTargets(e,t,n){if(!this.selectAllMatching)return this.flagEach(e,t,n);let r=await V.setFlagMatching(this.currentMailbox,this.matchingScope,t,n);if(r.ok)for(let r of t)this.updateLocalMessageFlags(e,r,n);return r}async fileWholeFolder(e,t){let n=this.currentMailbox,r=this.matchingScope,i=await V.moveMatching(n,r,e);if(!i.success){i.reason!==`auth`&&this.reportActionFailed(`toast.moveFailed`,`Could not move that`);return}this.clearSelection(),this.selectedMessage=null,this.updateUrl(n,this.currentPage,null);let a=this.undoMoves([{from:n,mapping:i.uidMapping??{}}],e,n,void 0);this.showGlobalToast(t(i.count??0),a?this.i18nStore?.t(`mailboxPage.undo`):``,a,Is)}takeRowsOut(e){let t=this.messages,n=this.totalMessages,r=e.length>0?R.rowsTakenOut(e):()=>{},i=e=>this.messages===this.rowsAfterTakeOut?(r(),this.messages=t,this.totalMessages=n,this.takeRowsOut(e),!0):!1;if(e.length===0)return i;let a=new Set(e),o=0,s=[];for(let e of this.messages){let t=e.SubMessages??[],n=t.filter(e=>!a.has(this.keyOf(e)));if(a.has(this.keyOf(e))&&n.length===0){o+=1;continue}s.push(n.length===t.length?e:{...e,SubMessages:n})}return this.messages=s,this.rowsAfterTakeOut=s,o>0&&(this.totalMessages=Math.max(0,this.totalMessages-o)),i}async fileAway(e,t,n,r){if(this.selectAllMatching)return this.fileWholeFolder(t,r);let i=this.currentMailbox,a=this.selectedMessage?this.keyOf(this.selectedMessage):void 0,o=n?e.filter(e=>xr(e).mailbox!==t):[],s=n?this.takeRowsOut(o):void 0;await R.afterWrites(async()=>{let{done:c,refused:l}=await this.eachFolder(e,async(e,n)=>{if(e===t)return{ok:!0,uidMapping:{}};let r=await V.moveMessages(e,n,t);return{ok:r.success,reason:r.reason,uidMapping:r.uidMapping??{}}}),u=this.writtenKeys(c);if(u.length>0){n&&(this.selectedKeys=new Set([...this.selectedKeys].filter(e=>!u.includes(e)))),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null);let e=c.filter(({mailbox:e})=>e!==t).map(({mailbox:e,result:t})=>({from:e,mapping:t.uidMapping})),o=this.undoMoves(e,t,i,n?void 0:a);this.showGlobalToast(r(u.length),o?this.i18nStore?.t(`mailboxPage.undo`):``,o,Is)}if(l&&l.reason!==`auth`&&(this.reportActionFailed(`toast.moveFailed`,`Could not move that`),s)){let t=new Set(u),n=e.filter(e=>!t.has(e));s(o.filter(e=>t.has(e)))?this.selectedKeys=new Set(n):R.sync()}})}undoMoves(e,t,n,r,i=!0){let a=e.filter(({mapping:e})=>Object.keys(e).length>0);if(a.length!==0)return async()=>{try{let e=[],o=null,s;if(await R.afterWrites(async()=>{for(let{from:n,mapping:i}of a){let a=await V.moveMessages(t,Object.values(i),n);if(!a.success){if(s??=a,a.reason===`auth`)break;continue}for(let[t,s]of Object.entries(i)){let i=a.uidMapping?.[s];i&&(e.push(L(n,i)),r===L(n,t)&&(o=L(n,i)))}}}),s&&s.reason!==`auth`&&this.reportActionFailed(`toast.undoFailed`,`Could not undo that`),e.length===0)return;if(r!==void 0){let e=this.currentMailbox===n?this.currentPage:0;this.openKeyInUrl(n,e,o)}else i&&this.currentMailbox===n&&(this.selectedKeys=new Set([...this.selectedKeys,...e]))}catch(e){x.error(`Undo failed`,e),this.reportActionFailed(`toast.undoFailed`,`Could not undo that`)}}}async copyKeys(e,t,n){let{done:r,refused:i}=await this.eachFolder(e,async(e,n)=>{let r=await V.copyMessages(e,n,t);return{ok:r.success,reason:r.reason,uidMapping:{}}}),a=this.writtenKeys(r).length;if(a>0){let e=n?this.i18nStore?.t(`toast.messagesCopiedToFolder`,{count:a,folder:this.folderCaption(t)}):this.i18nStore?.t(`toast.messageCopiedToFolder`,{folder:this.folderCaption(t)});this.showGlobalToast(e,``,void 0,Is)}i&&i.reason!==`auth`&&this.reportActionFailed(`toast.copyFailed`,`Could not copy that`)}async fileDropped(e,t){let n=this.currentMailbox,r=this.selectedMessage?this.keyOf(this.selectedMessage):void 0,i=this.takeRowsOut(e);await R.afterWrites(async()=>{let{done:a,refused:o}=await this.eachFolder(e,async(e,n)=>{let r=await V.moveMessages(e,n,t);return{ok:r.success,reason:r.reason,uidMapping:r.uidMapping??{}}}),s=this.writtenKeys(a);if(s.length>0){let e=r!==void 0&&s.includes(r);e&&(this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null));let i=a.map(({mailbox:e,result:t})=>({from:e,mapping:t.uidMapping})),o=this.undoMoves(i,t,n,e?r:void 0,!1);this.showGlobalToast(this.movedMessage(s.length>1,s.length,t),o?this.i18nStore?.t(`mailboxPage.undo`):``,o,Is)}if(o&&o.reason!==`auth`){this.reportActionFailed(`toast.moveFailed`,`Could not move that`);let t=new Set(s);i(e.filter(e=>t.has(e)))||R.sync()}})}deletesForGood(e){let t=A(e,this.mailboxes);return t===`trash`||t===`drafts`||t===`junk`}folderCaption(e){return Qe(e,this.i18nStore,this.mailboxes)}movedMessage(e,t,n){let r=this.folderCaption(n);return e?this.i18nStore?.t(`toast.messagesMovedToFolder`,{count:t,folder:r}):this.i18nStore?.t(`toast.messageMovedToFolder`,{folder:r})}async _handleReaderAction(e){let t=e.detail.action;if(e.detail.uid&&e.detail.mailbox)return this.handleNamedMessageAction(e.detail);let n=this.selectionCount>0,r=this.selectedMessage;if(!n&&!r?.UID)return;let i=n?[]:[this.keyOf(r)],a=n?[...this.selectedKeys]:e.detail.uids?.length?e.detail.uids.map(e=>L(this.currentMailbox,e)):i,o=n||a.length>1;n&&(this.bulkProcessing=!0);try{if(t===`star`){let e=n?this.starWrite(this.selectedStarRows):{keys:i,op:r.Flags?.includes(`\\Flagged`)?`remove`:`add`},t=await this.flagTargets(e.keys,[B],e.op);t.ok||this.reportFlagFailure(t)}else if(t===`addTag`||t===`removeTag`){let n=e.detail.tags||(e.detail.folder?[e.detail.folder]:[]);if(!n||n.length===0)return;let r=t===`addTag`?`add`:`remove`,i=await this.flagTargets(a,n,r);i.ok||this.reportFlagFailure(i),this.requestUpdate()}else if(t===`markUnread`)if(n){let e=await this.flagTargets(a,[z],this.allSelectedUnread?`add`:`remove`);e.ok||this.reportFlagFailure(e)}else{let e=!r.Flags||!r.Flags.includes(`\\Seen`),t=await V.setFlag(this.mailboxOf(r),[String(r.UID)],[z],e?`add`:`remove`);t.ok?e?(this.selectedMessage={...r,Flags:[...r.Flags||[],z]},this.updateLocalMessageFlags(i,z,`add`)):(this.updateLocalMessageFlags(i,z,`remove`),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null)):this.reportFlagFailure(t)}else if(t===`delete`||t===`archive`||t===`reportSpam`||t===`notSpam`){let e=Pe(`trash`,this.mailboxes,ke);if(t===`archive`&&(e=Pe(`archive`,this.mailboxes,Te)),t===`reportSpam`&&(e=Pe(`junk`,this.mailboxes,Oe)),t===`notSpam`&&(e=O),t===`delete`&&this.selectAllMatching){if(this.deletesForGood(this.currentMailbox)){this.pendingDeleteDetails={isBulk:n,doomed:[],toTrash:[],isDrafts:A(this.currentMailbox,this.mailboxes)===`drafts`,matching:{count:this.selectionCount}},this.showDeleteConfirm=!0;return}}else if(t===`delete`){let e=a.filter(e=>this.deletesForGood(xr(e).mailbox));if(e.length>0){this.pendingDeleteDetails={isBulk:n,doomed:e,toTrash:a.filter(t=>!e.includes(t)),isDrafts:e.every(e=>A(xr(e).mailbox,this.mailboxes)===`drafts`)},this.showDeleteConfirm=!0;return}}await this.fileAway(a,e,n,t=>this.movedMessage(o,t,e))}else if(t===`moveTo`||t===`copyTo`){let r=e.detail.folder;if(!r)return;if(t===`moveTo`)await this.fileAway(a,r,n,e=>this.movedMessage(o,e,r));else if(this.selectAllMatching){let e=await V.copyMatching(this.currentMailbox,this.matchingScope,r);if(e.success){let t=e.count??0;this.showGlobalToast(o?this.i18nStore?.t(`toast.messagesCopiedToFolder`,{count:t,folder:this.folderCaption(r)}):this.i18nStore?.t(`toast.messageCopiedToFolder`,{folder:this.folderCaption(r)}),``,void 0,Is)}else e.reason!==`auth`&&this.reportActionFailed(`toast.copyFailed`,`Could not copy that`)}else await this.copyKeys(a,r,o)}else if(t===`downloadMessage`&&!n){let e=`/mailboxes/${k(this.mailboxOf(r))}/messages/${r.UID}/raw`,t=document.createElement(`a`);t.href=e,t.download=``,document.body.appendChild(t),t.click(),document.body.removeChild(t)}else if(t===`showOriginal`&&!n){let e=`#/original?mailbox=${encodeURIComponent(this.mailboxOf(r))}&uid=${r.UID}`;window.open(e,`_blank`)}}finally{n&&(this.bulkProcessing=!1)}}async _confirmDelete(){this.showDeleteConfirm=!1;let e=this.pendingDeleteDetails;if(this.pendingDeleteDetails=null,!e)return;let{isBulk:t,doomed:n,toTrash:r,isDrafts:i,named:a,matching:o}=e,s=o?o.count>1:n.length>1;t&&(this.bulkProcessing=!0);try{if(o){let e=await V.deleteMatchingResult(this.currentMailbox,this.matchingScope);if(e.ok){let t=e.count??0;this.clearSelection(),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null);let n=i?s?this.i18nStore?.t(`toast.draftsDiscarded`,{count:t}):this.i18nStore?.t(`toast.draftDiscarded`):s?this.i18nStore?.t(`toast.messagesPermanentlyDeleted`,{count:t}):this.i18nStore?.t(`toast.messagePermanentlyDeleted`);this.showGlobalToast(n,``,void 0,Is)}else e.reason!==`auth`&&this.reportActionFailed(`toast.messageDeleteFailed`,`The message could not be deleted`);return}await R.afterWrites(async()=>{let e=t&&!a?this.takeRowsOut(n):void 0,{done:o,refused:c}=await this.eachFolder(n,(e,t)=>V.deleteMessagesResult(e,t));a?.done?.(!c);let l=this.writtenKeys(o);if(l.length>0){a?a.isOpen&&this.leaveDeletedMessage(a.nextUid):(t&&(this.selectedKeys=new Set([...this.selectedKeys].filter(e=>!l.includes(e)))),this.selectedMessage=null,this.updateUrl(this.currentMailbox,this.currentPage,null));let e=``;e=i?s?this.i18nStore?.t(`toast.draftsDiscarded`,{count:l.length}):this.i18nStore?.t(`toast.draftDiscarded`):s?this.i18nStore?.t(`toast.messagesPermanentlyDeleted`,{count:l.length}):this.i18nStore?.t(`toast.messagePermanentlyDeleted`),this.showGlobalToast(e,``,void 0,Is)}if(c&&c.reason!==`auth`&&(this.reportActionFailed(`toast.messageDeleteFailed`,`The message could not be deleted`),e)){let t=new Set(l);e(l)?this.selectedKeys=new Set(n.filter(e=>!t.has(e))):R.sync()}if(r.length>0){let e=Pe(`trash`,this.mailboxes,ke);await this.fileAway(r,e,t,n=>this.movedMessage(t||r.length>1,n,e))}})}finally{t&&(this.bulkProcessing=!1)}}get deleteDialogWords(){let e=e=>this.i18nStore?.t(e),t=this.pendingDeleteDetails,n=(t?.matching?.count??t?.doomed.length??0)>1;return t?.isDrafts?{title:e(n?`mailboxPage.discardDraftsTitle`:`floatingComposer.discardDraftTitle`),message:e(n?`mailboxPage.discardDraftsMessage`:`floatingComposer.discardDraftMessage`),confirm:e(`floatingComposer.discard`)}:{title:e(`mailboxPage.permanentlyDelete`),message:e(n?`messageReader.deleteConfirmMultiple`:`messageReader.deleteConfirmSingle`),confirm:e(`mailboxPage.deletePermanently`)}}_cancelDelete(){this.showDeleteConfirm=!1,this.pendingDeleteDetails=null}toggleFolder(e,t){t&&(t.stopPropagation(),t.preventDefault());let n=new Set(this.expandedFolders);n.has(e)?n.delete(e):n.add(e),this.expandedFolders=n}render(){let e=this.isMobile?`full`:this.layoutMode,t=e===`full`&&this.selectedMessage!==null;return n`
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
          @sidebar-resize=${e=>{let t=e.detail.newWidth;t<Gs?(this.sidebarCollapsed||this.settingsStore.updateSettings({sidebarCollapsed:!0}),this.sidebarWidth=Vs):(this.sidebarCollapsed&&this.settingsStore.updateSettings({sidebarCollapsed:!1}),this.sidebarWidth=Math.min(Math.max(t,Hs),Us),this.resizerPositionX=Math.max(this.resizerPositionX,this.sidebarWidth+Ks))}}
          @drag-start=${()=>this.isSidebarDragging=!0}
          @drag-end=${()=>this.isSidebarDragging=!1}
          @toggle-collapse=${()=>this.settingsStore.updateSettings({sidebarCollapsed:!this.sidebarCollapsed})}
          @close-sidebar=${()=>this.mobileSidebarOpen=!1}
        >
          <alps-folder-list
            .mailboxes=${this.mailboxes}
            .currentMailbox=${this.currentMailbox}
            .expandedFolders=${this.expandedFolders}
            .layoutMode=${e}
            .syncing=${this.isSyncing}
            @select-mailbox=${e=>{this.currentMailbox===e.detail.name?(this.currentPage=0,this.selectedMessage=null,this.filterQuery=``,this.loadingMessages=!0,this.updateUrl(e.detail.name,0,null),R.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)):(this.loadingMessages=!0,this.filterQuery=``,this.clearSelection(),this.updateUrl(e.detail.name,0,null)),Do(this.renderRoot),this.isMobile&&(this.mobileSidebarOpen=!1)}}
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
              .currentMailboxRole=${A(this.currentMailbox,this.mailboxes)||``}
              .listedMailbox=${this.listedMailbox}
              .listedMailboxRole=${A(this.listedMailbox,this.mailboxes)||``}
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
              @refresh=${()=>{if(this.listLoadFailed&&this.messages.length===0){R.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!0);return}this.currentPage=0,R.check(this.currentMailbox,this.currentPage,this.filterQuery)}}
              @toggle-sidebar=${()=>this.mobileSidebarOpen=!this.mobileSidebarOpen}
              @compose=${()=>this.composeStore.openComposer()}
              @toast=${this._relayToast}
              @select-message=${e=>this.selectMessage(e.detail.message)}
              @change-page=${e=>this.updateUrl(this.currentMailbox,e.detail.page,this.targetUid,void 0,this.targetMailbox)}
              @list-scrolled=${e=>this.listScrolled=e.detail.scrolled}
              @toggle-sort=${async()=>{let e=this.sortOrder===`asc`?`desc`:`asc`;this.messages=[],this.loadingMessages=!0,await this.settingsStore.updateSettings({sortOrder:e}),this.currentPage=0,R.fetch(this.currentMailbox,this.currentPage,this.filterQuery,!1)}}
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
              @message-flags-changed=${e=>this.updateLocalMessageFlags([L(e.detail.mailbox??this.currentMailbox,e.detail.uid)],e.detail.flag,e.detail.action)}
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
    `}};P([h({context:Ga})],J.prototype,`composeStore`,void 0),P([h({context:nr})],J.prototype,`settingsStore`,void 0),P([h({context:D})],J.prototype,`i18nStore`,void 0),P([a()],J.prototype,`showDeleteConfirm`,void 0),P([a()],J.prototype,`listLoadFailed`,void 0),P([a()],J.prototype,`pendingDeleteDetails`,void 0),P([a()],J.prototype,`mailboxes`,void 0),P([a()],J.prototype,`messages`,void 0),P([a()],J.prototype,`currentMailbox`,void 0),P([a()],J.prototype,`loadingMessages`,void 0),P([a()],J.prototype,`showInitialLoader`,void 0),P([a()],J.prototype,`selectedMessage`,void 0),P([a()],J.prototype,`selectedKeys`,void 0),P([a()],J.prototype,`selectAllMatching`,void 0),P([a()],J.prototype,`excludedKeys`,void 0),P([a()],J.prototype,`layoutMode`,void 0),P([a()],J.prototype,`filterQuery`,void 0),P([a()],J.prototype,`expandedFolders`,void 0),P([a()],J.prototype,`username`,void 0),P([a()],J.prototype,`currentPage`,void 0),P([a()],J.prototype,`listedPage`,void 0),P([a()],J.prototype,`listedMailbox`,void 0),P([a()],J.prototype,`totalMessages`,void 0),P([a()],J.prototype,`messagesPerPage`,void 0),P([a()],J.prototype,`resizerPositionX`,void 0),P([a()],J.prototype,`listHeight`,void 0),P([a()],J.prototype,`isSidebarDragging`,void 0),P([a()],J.prototype,`isPaneDragging`,void 0),P([a()],J.prototype,`sidebarWidth`,void 0),P([a()],J.prototype,`densityMode`,void 0),P([a()],J.prototype,`showSenderAvatars`,void 0),P([a()],J.prototype,`isSyncing`,void 0),P([a()],J.prototype,`sidebarCollapsed`,void 0),P([a()],J.prototype,`sortOrder`,void 0),P([a()],J.prototype,`listScrolled`,void 0),P([a()],J.prototype,`targetUid`,void 0),P([a()],J.prototype,`targetMailbox`,void 0),P([a()],J.prototype,`isMobile`,void 0),P([a()],J.prototype,`mobileSidebarOpen`,void 0),P([a()],J.prototype,`bulkProcessing`,void 0),P([a()],J.prototype,`computedMinListWidth`,void 0),J=P([p(`mailbox-page`)],J);var Zs=class extends d{constructor(...e){super(...e),this.active=!1,this.icon=``,this.handleKeyDown=e=>{e.key!==`Enter`&&e.key!==` `||(e.preventDefault(),!(e.key===` `&&e.repeat)&&this.click())}}connectedCallback(){super.connectedCallback(),this.hasAttribute(`role`)||this.setAttribute(`role`,`button`),this.hasAttribute(`tabindex`)||(this.tabIndex=0),this.addEventListener(`keydown`,this.handleKeyDown)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(`keydown`,this.handleKeyDown)}updated(e){e.has(`active`)&&(this.active?this.setAttribute(`aria-current`,`true`):this.removeAttribute(`aria-current`))}static{this.styles=v`
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
        <span class="category-icon">${M(this.icon)}</span>
      `:``}
      <span class="label"><slot></slot></span>
    `}};P([o({type:Boolean,reflect:!0})],Zs.prototype,`active`,void 0),P([o({type:String})],Zs.prototype,`icon`,void 0),Zs=P([p(`alps-category-item`)],Zs);var Qs=class extends d{constructor(...e){super(...e),this.label=``,this.description=``}static{this.styles=v`
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
    `}};P([o({type:String})],Qs.prototype,`label`,void 0),P([o({type:String})],Qs.prototype,`description`,void 0),Qs=P([p(`alps-setting-group`)],Qs);var $s=class extends d{constructor(...e){super(...e),this.newUsername=``,this.newPassword=``,this.newDisplayName=``,this.isSubmitting=!1,this.error=``,this.showAddForm=!1,this._handleStoreChange=()=>{this.requestUpdate()}}static{this.styles=v`
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
        `}};P([h({context:D})],$s.prototype,`i18nStore`,void 0),P([h({context:js})],$s.prototype,`linkedAccountsStore`,void 0),P([a()],$s.prototype,`newUsername`,void 0),P([a()],$s.prototype,`newPassword`,void 0),P([a()],$s.prototype,`newDisplayName`,void 0),P([a()],$s.prototype,`isSubmitting`,void 0),P([a()],$s.prototype,`error`,void 0),P([a()],$s.prototype,`showAddForm`,void 0),$s=P([p(`settings-accounts`)],$s);function ec(e){if(!e)throw Error(`base64url is null or undefined`);let t=e.replace(/-/g,`+`).replace(/_/g,`/`),n=atob(t),r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);return r.buffer}function tc(e){let t=new Uint8Array(e),n=``;for(let e=0;e<t.byteLength;e++)n+=String.fromCharCode(t[e]);return btoa(n).replace(/\+/g,`-`).replace(/\//g,`_`).replace(/=/g,``)}async function nc(e){e.publicKey.challenge=ec(e.publicKey.challenge),e.publicKey.user.id=ec(e.publicKey.user.id),e.publicKey.excludeCredentials&&(e.publicKey.excludeCredentials=e.publicKey.excludeCredentials.map(e=>({...e,id:ec(e.id)})));let t=await navigator.credentials.create(e);if(!t)throw Error(`Credential creation failed or was cancelled.`);let n=t.response,r=n.getTransports?n.getTransports():[];return{id:t.id,rawId:tc(t.rawId),type:t.type,response:{attestationObject:tc(n.attestationObject),clientDataJSON:tc(n.clientDataJSON)},transports:r}}var rc=class extends Error{constructor(){super(`The authentication options cannot be used.`),this.name=`InvalidOptionsError`}};function ic(e){if(typeof e!=`string`||!/^[A-Za-z0-9_-]+={0,2}$/.test(e))throw new rc;return ec(e)}async function ac(e){try{e.publicKey.challenge=ic(e.publicKey.challenge),e.publicKey.allowCredentials&&(e.publicKey.allowCredentials=e.publicKey.allowCredentials.map(e=>({...e,id:ic(e.id)})))}catch{throw new rc}let t=await navigator.credentials.get(e);if(!t)throw new DOMException(`No credential was returned.`,`NotAllowedError`);let n=t.response;return{id:t.id,rawId:tc(t.rawId),type:t.type,response:{authenticatorData:tc(n.authenticatorData),clientDataJSON:tc(n.clientDataJSON),signature:tc(n.signature),userHandle:n.userHandle?tc(n.userHandle):null}}}function oc(){return window.PublicKeyCredential!==void 0&&navigator.credentials!==void 0}var Y=class extends d{constructor(...e){super(...e),this.data=null,this.error=``,this.loading=!0,this.adding=!1,this.showNamePrompt=!1,this.pendingCredential=null,this.pendingDeleteId=null,this.showTrustPrompt=!1,this.trustBusy=!1,this.removeBusy=!1,this.removeErrors={}}static{this.styles=v`
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
    `}connectedCallback(){super.connectedCallback(),this.fetchData()}async fetchData(){try{this.loading=!0;let e=await fetch(`/settings/2fa`);if(!e.ok)throw Error(`Failed to fetch settings`);this.data=await e.json()}catch(e){this.error=e.message}finally{this.loading=!1}}async handleTrustToggle(e){let t=e.target,n=t.checked;if(t.checked=!!this.data?.trustLinkedAccounts,!this.trustBusy){if(n){this.showTrustPrompt=!0;return}await this.sendTrust({trust:!1})}}async _handleTrustPromptSubmit(e){let t=typeof e.detail?.password==`string`?e.detail.password:``;if(this.showTrustPrompt=!1,!t){this.showTrustError(`webauthn.errors.password_required`);return}await this.sendTrust({trust:!0,current_password:t})}async sendTrust(e){this.trustBusy=!0,this.error=``;try{let t=await N(`/settings/2fa/trust-linked-accounts`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)});if(t.status===401)return;if(!t.ok){let e=await t.json().then(e=>e?.error,()=>void 0);this.showTrustError(this.trustRefusal(t.status,e))}}catch{this.showTrustError(`webauthn.errors.trust_failed`)}finally{this.trustBusy=!1}await this.fetchData()}trustRefusal(e,t){switch(t){case`wrong_password`:return`webauthn.errors.wrong_password`;case`password_required`:return`webauthn.errors.password_required`;case`two_factor_required`:return`webauthn.errors.two_factor_required`;case`no_security_key`:return`webauthn.errors.no_security_key`}return e===429?`webauthn.errors.rate_limited`:`webauthn.errors.trust_failed`}showTrustError(e){this.error=this.i18nStore?.t(e)??e}async addCredential(){this.adding=!0,this.error=``;try{let e=await fetch(`/settings/2fa/begin`,{method:`POST`});if(!e.ok)throw Error(await e.text());let t=await nc(await e.json());this.pendingCredential=t,this.showNamePrompt=!0,this.adding=!1}catch(e){e.name===`NotAllowedError`||e.message&&e.message.includes(`not allowed`)?this.error=``:this.error=this.i18nStore?.t(`webauthn.errors.register_failed`)||`There was an error registering your security key. Please try again.`,this.adding=!1}}async _handlePromptSubmit(e){let t=e.detail.keyName||`Security Key`;this.showNamePrompt=!1;let n={...this.pendingCredential,name:t};this.adding=!0,this.error=``;try{let e=await fetch(`/settings/2fa/finish`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(n)});if(!e.ok)throw Error(await e.text());this.fetchData()}catch{this.error=this.i18nStore?.t(`webauthn.errors.register_failed`)||`There was an error registering your security key. Please try again.`}finally{this.adding=!1,this.pendingCredential=null}}_handlePromptCancel(){this.showNamePrompt=!1,this.pendingCredential=null}removeCredential(e){this.error=``,this.removeErrors={},this.pendingDeleteId=e}t(e){return this.i18nStore?.t(e)??e}async executeRemoveCredential(e){let t=this.pendingDeleteId;if(!t||this.removeBusy)return;let n=typeof e.detail?.password==`string`?e.detail.password:``;if(!n){this.removeErrors={password:this.t(`webauthn.errors.password_required`)};return}this.removeBusy=!0;try{let e=await N(`/settings/2fa/credential/${encodeURIComponent(t)}/delete`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({current_password:n})});if(e.ok||e.status===404){this.pendingDeleteId=null,this.fetchData();return}if(e.status===401){this.pendingDeleteId=null;return}let r=await e.json().then(e=>e?.error,()=>void 0);this.removeErrors={password:this.removeRefusal(e.status,r)}}catch{this.removeErrors={password:this.t(`webauthn.errors.remove_unavailable`)}}finally{this.removeBusy=!1}}removeRefusal(e,t){return t===`wrong_password`?this.t(`webauthn.errors.wrong_password`):t===`password_required`?this.t(`webauthn.errors.password_required`):t===`two_factor_required`?this.t(`webauthn.errors.two_factor_required`):e===429?this.t(`webauthn.errors.rate_limited`):e>=500?this.t(`webauthn.errors.remove_unavailable`):this.t(`webauthn.errors.remove_failed`)}render(){return this.loading?n`<div>${this.i18nStore?.t(`settings.loading`)}</div>`:n`
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
                                    <div class="icon-container">${M(`fingerprint`)}</div>
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
        `}};P([h({context:D})],Y.prototype,`i18nStore`,void 0),P([a()],Y.prototype,`data`,void 0),P([a()],Y.prototype,`error`,void 0),P([a()],Y.prototype,`loading`,void 0),P([a()],Y.prototype,`adding`,void 0),P([a()],Y.prototype,`showNamePrompt`,void 0),P([a()],Y.prototype,`pendingCredential`,void 0),P([a()],Y.prototype,`pendingDeleteId`,void 0),P([a()],Y.prototype,`showTrustPrompt`,void 0),P([a()],Y.prototype,`trustBusy`,void 0),P([a()],Y.prototype,`removeBusy`,void 0),P([a()],Y.prototype,`removeErrors`,void 0),Y=P([p(`alps-webauthn-settings`)],Y);var X=class extends d{constructor(...e){super(...e),this.category=`general`,this.isMobile=window.innerWidth<=768,this.mobileSidebarOpen=!1,this.username=``,this.isScrolled=!1,this.sidebarWidth=250,this.sidebarCollapsed=!1,this.isSidebarDragging=!1,this._handleResize=()=>{this.isMobile=window.innerWidth<=768,this.isMobile||(this.mobileSidebarOpen=!1)},this._handleScroll=e=>{let t=e.target;this.isScrolled=t.scrollTop>0},this._handleSettingsChange=()=>{this._syncState()},this._handleI18nChange=()=>{this.requestUpdate()}}static{this.styles=[Eo,v`
    :host {
      /* The collapsed strip's slide (sidebarLayoutStyles): a section's icon
         sits 28px in (alps-category-item's 12px margin and 16px padding, with
         no content padding), so 20px brings it 8px inside the strip. */
      --strip-slide: 20px;
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
  `]}async connectedCallback(){super.connectedCallback(),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this.i18nStore?.addEventListener(`change`,this._handleI18nChange),window.addEventListener(`resize`,this._handleResize),this._syncState();try{let e=await fetch(`/session`);if(e.ok){let t=await e.json();t.Username&&(this.username=t.Username)}}catch(e){x.error(`Failed to fetch username in settings`,e)}}disconnectedCallback(){super.disconnectedCallback(),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange),window.removeEventListener(`resize`,this._handleResize)}_syncState(){this.settingsState={...this.settingsStore.getState()},this.sidebarCollapsed=this.settingsState.sidebarCollapsed||!1}getCategoryLabel(e){switch(e){case`general`:return this.i18nStore?.t(`settings.categories.general`);case`identity`:return this.i18nStore?.t(`settings.categories.identity`);case`webauthn`:return this.i18nStore?.t(`settings.categories.webauthn`);case`accounts`:return this.i18nStore?.t(`settings.categories.accounts`);case`reading`:return this.i18nStore?.t(`settings.categories.reading`);case`appearance`:return this.i18nStore?.t(`settings.categories.appearance`);case`localization`:return this.i18nStore?.t(`settings.categories.localization`);default:let t=T.getSettingsTabs().find(t=>t.id===e);return t?this.i18nStore?.t(t.labelKey):e}}selectCategory(e){window.location.hash=`/settings/${e}`,this.isMobile&&(this.mobileSidebarOpen=!1),Do(this.renderRoot)}async handleUpdate(e,t){let n=e.target,r=n.value;n.type===`checkbox`?(r=n.checked,t===`desktopNotifications`&&r===!0&&(`Notification`in window&&Notification.permission!==`granted`&&Notification.permission!==`denied`?await Notification.requestPermission()!==`granted`&&(r=!1,n.checked=!1):`Notification`in window&&Notification.permission===`denied`&&(r=!1,n.checked=!1))):(n.type===`number`||[`checkMailInterval`,`autoLogout`,`messagesPerPage`,`markReadTimeout`,`undoTimeout`,`weekStart`].includes(t))&&(r=parseInt(n.value,10),isNaN(r)&&(r=0)),this.settingsStore.updateSettings({[t]:r})}render(){return n`
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
              ${M(`arrowLeft`)} ${this.i18nStore?.t(`messageReader.back`)}
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
          @close-sidebar=${()=>this.mobileSidebarOpen=!1}
        >
          <!-- Frame and content follow the strip state alps-sidebar
               provides: collapsed, they keep everything, dimmed, inert and
               behind the main view. -->
          <alps-sidebar-frame class="sidebar-wrapper">
            <alps-sidebar-content class="sidebar-content">
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
          ${T.getSettingsTabs().map(e=>n`
            <alps-category-item 
              ?active=${this.category===e.id}
              @click=${()=>this.selectCategory(e.id)}
              .icon=${e.icon}
            >
              ${this.i18nStore?.t(e.labelKey)}
            </alps-category-item>
          `)}
              </div>
            </alps-sidebar-content>
          </alps-sidebar-frame>
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
            ${T.getSettingsTabs().filter(e=>e.id===this.category).map(e=>(te(e),n`${m(`<${e.component}></${e.component}>`)}`))}
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
          <alps-select label="${this.i18nStore?.t(`settings.appearance.colorTheme`)}" @change=${e=>this.handleUpdate(e,`colorFamily`)} .value=${Vn(this.settingsState.colorFamily)}
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
            .options=${[{value:`en`,lang:xe(`en`),label:this.i18nStore?.t(`settings.localization.english`)||`en`},{value:`de`,lang:xe(`de`),label:this.i18nStore?.t(`settings.localization.german`)||`de`},{value:`it`,lang:xe(`it`),label:this.i18nStore?.t(`settings.localization.italian`)||`it`},{value:`es`,lang:xe(`es`),label:this.i18nStore?.t(`settings.localization.spanish`)||`es`},{value:`rs`,lang:xe(`rs`),label:this.i18nStore?.t(`settings.localization.serbian`)||`rs`},{value:`sr`,lang:xe(`sr`),label:this.i18nStore?.t(`settings.localization.serbianLatin`)||`sr`},{value:`fr`,lang:xe(`fr`),label:this.i18nStore?.t(`settings.localization.french`)||`fr`},{value:`pt`,lang:xe(`pt`),label:this.i18nStore?.t(`settings.localization.portuguese`)||`pt`},{value:`da`,lang:xe(`da`),label:this.i18nStore?.t(`settings.localization.danish`)||`da`}]}>
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
    `}};P([h({context:nr})],X.prototype,`settingsStore`,void 0),P([h({context:D})],X.prototype,`i18nStore`,void 0),P([o({type:String})],X.prototype,`category`,void 0),P([a()],X.prototype,`settingsState`,void 0),P([a()],X.prototype,`isMobile`,void 0),P([a()],X.prototype,`mobileSidebarOpen`,void 0),P([a()],X.prototype,`username`,void 0),P([a()],X.prototype,`isScrolled`,void 0),P([a()],X.prototype,`sidebarWidth`,void 0),P([a()],X.prototype,`sidebarCollapsed`,void 0),P([a()],X.prototype,`isSidebarDragging`,void 0),X=P([p(`settings-page`)],X);function sc(e){return(e??[]).flatMap(e=>e.group??[e]).map(e=>({name:e.name,email:e.address}))}async function cc(e){let t=await new y().parse(e),n=`default`,r=t.headers?.find(e=>e.key.toLowerCase()===`bimi-selector`);if(r){let e=r.value.match(/s=([^;\s]+)/i);e&&(n=e[1].trim())}let i=t.from?.address||``,a={messageId:t.messageId||``,date:t.date||``,from:sc(t.from?[t.from]:[]),fromAddress:i,to:sc(t.to),subject:t.subject||``,spf:`none`,spfDetail:``,dkim:`none`,dkimDetail:``,dmarc:`none`,dmarcDetail:``,bimiSelector:n,hasBimiPotential:!1},o=t.headers?.filter(e=>e.key.toLowerCase()===`authentication-results`)||[];if(o.length>0){let e=o[0],t=e.value.toLowerCase(),n=``,r=t.match(/smtp\.(?:remote|client)-ip=([0-9a-f\.:]+)/)||t.match(/designates ([0-9a-f\.:]+) as permitted sender/);r&&(n=r[1]);let i=e.value.split(`;`);for(let e of i){let t=e.trim().toLowerCase();if(t.startsWith(`spf=`))if(a.spf=t.split(`=`)[1].split(` `)[0],n)a.spfDetail=`with IP address ${n}`;else{let e=t.match(/smtp\.mailfrom=([^ \t]+)/)||t.match(/smtp\.helo=([^ \t]+)/);e&&(a.spfDetail=`with ${e[1]}`)}else if(t.startsWith(`dkim=`)){a.dkim=t.split(`=`)[1].split(` `)[0];let e=t.match(/header\.d=([^ \t]+)/);e&&(a.dkimDetail=`with domain ${e[1]}`)}else if(t.startsWith(`dmarc=`)){a.dmarc=t.split(`=`)[1].split(` `)[0];let e=t.match(/header\.from=([^ \t]+)/);e&&(a.dmarcDetail=`with domain ${e[1]}`)}}}return a.hasBimiPotential=a.dmarc===`pass`&&!!a.fromAddress,a}var lc=class extends d{constructor(...e){super(...e),this.rawText=``,this.parsedHeaders=null,this.loading=!0,this.error=``,this.mailbox=``,this.uid=``,this.isTruncated=!1,this._handleStoreChange=()=>{this.requestUpdate()},this.MAX_DISPLAY_SIZE=65536}static{this.styles=v`
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
  `}connectedCallback(){super.connectedCallback(),this.extractParams(),this.mailbox&&this.uid?this.fetchOriginal():(this.error=this.i18nStore?.t(`originalMessage.errorMissingParams`),this.loading=!1),this.updateComplete.then(()=>{this.i18nStore?.addEventListener(`change`,this._handleStoreChange)})}disconnectedCallback(){super.disconnectedCallback(),this.i18nStore?.removeEventListener(`change`,this._handleStoreChange)}extractParams(){let e=window.location.hash,t=e.indexOf(`?`);if(t!==-1){let n=new URLSearchParams(e.substring(t+1));this.mailbox=n.get(`mailbox`)||``,this.uid=n.get(`uid`)||``}}async fetchOriginal(){try{this.loading=!0;let e=await N(`/mailboxes/${k(this.mailbox)}/messages/${this.uid}/raw?limit=${this.MAX_DISPLAY_SIZE}`);if(!e.ok){if(e.status===401){window.location.hash=`#/login`;return}throw Error(this.i18nStore?.t(`originalMessage.errorFailedToFetch`))}this.rawText=await e.text(),this.rawText.length>=this.MAX_DISPLAY_SIZE&&(this.isTruncated=!0),this.parsedHeaders=await cc(this.rawText)}catch(e){this.error=e.message}finally{this.loading=!1}}copyToClipboard(){navigator.clipboard.writeText(this.rawText).then(()=>{alert(this.isTruncated?this.i18nStore?.t(`originalMessage.copiedTruncated`):this.i18nStore?.t(`originalMessage.copied`))}).catch(e=>{x.error(`Failed to copy: `,e),alert(this.i18nStore?.t(`originalMessage.copyFailed`))})}renderAuthStatus(e,t){e=e.toLowerCase();let r=n`<span class="auth-none">${this.i18nStore?.t(`originalMessage.none`)}</span>`;return e===`pass`?r=n`<span class="auth-pass">${this.i18nStore?.t(`originalMessage.pass`)}</span>`:e===`fail`&&(r=n`<span class="auth-fail">${this.i18nStore?.t(`originalMessage.fail`)}</span>`),n`
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
                <td>${Zt(this.parsedHeaders.from)}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t(`originalMessage.to`)}</th>
                <td>${Zt(this.parsedHeaders.to)}</td>
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
    `}};P([a()],lc.prototype,`rawText`,void 0),P([a()],lc.prototype,`parsedHeaders`,void 0),P([a()],lc.prototype,`loading`,void 0),P([a()],lc.prototype,`error`,void 0),P([a()],lc.prototype,`mailbox`,void 0),P([a()],lc.prototype,`uid`,void 0),P([a()],lc.prototype,`isTruncated`,void 0),P([h({context:D})],lc.prototype,`i18nStore`,void 0),lc=P([p(`original-message-page`)],lc);var Z=class extends d{constructor(...e){super(...e),this.loading=!0,this.error=``,this.mailbox=``,this.uid=``,this.message=null,this.content=``,this.rawMessageHtml=``,this.mimeType=`text/plain`,this.hasRemoteResources=!1,this.allowRemoteResources=!1,this.printTriggered=!1}static{this.styles=v`
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
  `}connectedCallback(){super.connectedCallback(),this.allowRemoteResources=this.settingsStore.getState().showRemoteContent===`always`,this.extractParams(),this.mailbox&&this.uid?this.fetchMessage():(this.error=`Missing mailbox or uid parameters`,this.loading=!1)}extractParams(){let e=window.location.hash,t=e.indexOf(`?`);if(t!==-1){let n=new URLSearchParams(e.substring(t+1));this.mailbox=n.get(`mailbox`)||``,this.uid=n.get(`uid`)||``,n.get(`remote`)===`1`&&(this.allowRemoteResources=!0)}}async fetchMessage(){try{this.loading=!0;let e=[K.get(this.mailbox,this.uid,`html`),K.get(this.mailbox,this.uid,`text`)].find(e=>!!e&&!!e.Part&&(e.RawHtml!==void 0||e.RawText!==void 0));if(e){this.message=e.Message,this.mimeType=e.Part.MIMEType||e.Part.MimeType||`text/plain`,e.RawHtml===void 0?e.RawText!==void 0&&(this.content=e.RawText):(this.rawMessageHtml=e.RawHtml,this.hasRemoteResources=!1,this.content=ga(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})),this.loading=!1;return}let t=await N(`/mailboxes/${k(this.mailbox)}/messages/${this.uid}?view=html`);if(!t.ok){if(t.status===401){window.location.hash=`#/login`;return}throw Error(`Failed to fetch message metadata`)}let n=await t.json();this.message=n.Message,await this.fetchMessageBody(n.Part)}catch(e){this.error=e.message}finally{this.loading=!1}}async fetchMessageBody(e){if(!e){this.mimeType=`multipart/mixed`,this.content=``;return}this.mimeType=e.MIMEType||e.MimeType||`text/plain`;let t=Array.isArray(e.Path)&&e.Path.length?e.Path.join(`.`):`1`,n=await N(`/mailboxes/${k(this.mailbox)}/messages/${this.uid}/raw?part=${t}`);if(!n.ok)throw Error(`Failed to fetch message body`);this.mimeType.toLowerCase()===`text/html`?(this.rawMessageHtml=await n.text(),this.hasRemoteResources=!1,this.content=ga(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}})):this.content=await n.text()}loadRemoteResources(){this.allowRemoteResources=!0,this.printTriggered=!1,this.rawMessageHtml&&(this.content=ga(this.rawMessageHtml,{mailbox:this.mailbox,messageUid:this.uid,allowRemoteResources:this.allowRemoteResources,messageStructure:this.message?.BodyStructure,onRemoteResourceBlocked:()=>{this.hasRemoteResources=!0}}))}updated(e){this.loading||this.error||!this.message||this.mimeType?.toLowerCase()!==`text/html`&&(this.printTriggered||(this.printTriggered=!0,setTimeout(()=>{this.isConnected&&window.print()},500)))}onPrintIframeLoad(e){let t=e.target;try{let e=t.contentDocument;e&&e.body&&(t.style.height=`${e.body.scrollHeight}px`)}catch{}this.printTriggered||(this.printTriggered=!0,setTimeout(()=>{this.isConnected&&window.print()},300))}render(){if(this.loading)return n`
        <div class="loading-state">
          <alps-loader></alps-loader>
          <span>${this.i18nStore?.t(`print.loading`)}</span>
        </div>
      `;if(this.error)return n`
        <div class="error-state">
          <div>${M(`warning`)}</div>
          <span>${this.error}</span>
        </div>
      `;let e=this.message;if(!e)return n``;let t=e.Envelope?.Subject||this.i18nStore?.t(`messageList.noSubject`),r=e.Envelope?.From?.[0]||{},i=r.Mailbox&&r.Host?`${r.Mailbox}@${r.Host}`:``,a=r.Name||i?Yt(r.Name,i):this.i18nStore?.t(`messageList.unknownSender`),o=this.settingsStore?.getState()?.dateFormat||`YYYY-MM-DD`,s=String(this.settingsStore?.getState()?.hourFormat||`12`),c=e.Envelope?.Date?Ke(e.Envelope.Date,o,s):``,u=e=>Zt(e.map(e=>({name:e.Name,email:`${e.Mailbox}@${e.Host}`}))),d=e.Envelope?.To&&e.Envelope.To.length>0?u(e.Envelope.To):this.i18nStore?.t(`messageReader.undisclosed`),f=n``;if(e.Envelope?.Cc&&e.Envelope.Cc.length>0){let t=u(e.Envelope.Cc);f=n`<div class="print-cc"><strong>${this.i18nStore?.t(`messageReader.cc`)}</strong> ${t}</div>`}let p;return p=this.mimeType?.toLowerCase()===`text/html`?n`<iframe
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
            <div><strong>${a}</strong> ${r.Name&&i?n`&lt;${Jt(i)}&gt;`:``}</div>
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
    `}};P([h({context:nr})],Z.prototype,`settingsStore`,void 0),P([h({context:D})],Z.prototype,`i18nStore`,void 0),P([a()],Z.prototype,`loading`,void 0),P([a()],Z.prototype,`error`,void 0),P([a()],Z.prototype,`mailbox`,void 0),P([a()],Z.prototype,`uid`,void 0),P([a()],Z.prototype,`message`,void 0),P([a()],Z.prototype,`content`,void 0),P([a()],Z.prototype,`rawMessageHtml`,void 0),P([a()],Z.prototype,`mimeType`,void 0),P([a()],Z.prototype,`hasRemoteResources`,void 0),P([a()],Z.prototype,`allowRemoteResources`,void 0),Z=P([p(`print-page`)],Z);async function uc(e,t={}){let n;try{n=await fetch(e,{...t,method:`POST`})}catch{return null}let r=null;try{r=await n.json()}catch{r=null}return{ok:n.ok,status:n.status,body:r}}var dc=e=>e.status>=500||e.ok&&e.body===null,fc=class extends d{constructor(...e){super(...e),this.statusMessage=``,this.statusType=`info`,this.isLoading=!1,this.isSuccess=!1,this._handleI18nChange=()=>{this.requestUpdate()},this._verification=null}static{this.styles=v`
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
    

  `}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.isConnected&&this.i18nStore?.addEventListener(`change`,this._handleI18nChange)}),oc()?this._autoVerify=setTimeout(()=>{this._handleVerify()},300):(this.statusMessage=this.i18nStore?.t(`webauthn.not_supported`),this.statusType=`error`)}disconnectedCallback(){super.disconnectedCallback(),this._cancelVerification(),this.i18nStore?.removeEventListener(`change`,this._handleI18nChange)}_cancelVerification(){clearTimeout(this._autoVerify),clearTimeout(this._completeLogin),this._verification?.abort(),this._verification=null,this.isLoading=!1,this.isSuccess=!1}_backToLogin(){this._cancelVerification(),window.location.hash=`#/login`}_backToPassword(){try{sessionStorage.removeItem(`pending_2fa_username`),sessionStorage.removeItem(`pending_2fa_is_switch`)}catch{}qa(`secondFactorExpired`),this._backToLogin()}async _handleVerify(){if(clearTimeout(this._autoVerify),!this.isConnected||this.isLoading||this.isSuccess)return;let e=new AbortController;this._verification=e;let t=()=>this.isConnected&&this._verification===e&&!e.signal.aborted;this.isLoading=!0,this.statusMessage=this.i18nStore?.t(`webauthn.requesting`),this.statusType=`info`;try{let n=await uc(`/webauthn/verify/begin`,{signal:e.signal});if(!t())return;if(n===null)throw Error(this.i18nStore?.t(`login.networkError`));if(n.status===401)return this._backToPassword();if(dc(n))throw Error(this.i18nStore?.t(`webauthn.errors.unavailable`));if(!n.ok)throw Error(this.i18nStore?.t(`webauthn.errors.begin_failed`));let r=n.body;if(!r||!r.publicKey)throw Error(this.i18nStore?.t(`webauthn.errors.invalid_options`));this.statusMessage=this.i18nStore?.t(`webauthn.waiting_for_key`);let i=await ac({...r,signal:e.signal});if(!t())return;this.statusMessage=this.i18nStore?.t(`webauthn.verifying`);let a=await uc(`/webauthn/verify/finish`,{signal:e.signal,headers:{"Content-Type":`application/json`},body:JSON.stringify(i)});if(!t())return;if(a===null)throw Error(this.i18nStore?.t(`login.networkError`));if(a.status===401)return this._backToPassword();if(dc(a))throw Error(this.i18nStore?.t(`webauthn.errors.unavailable`));let o=a.body;if(a.ok&&o?.success){this.statusMessage=this.i18nStore?.t(`webauthn.success`),this.statusType=`success`,this.isSuccess=!0;let e=!1;try{e=sessionStorage.getItem(`pending_2fa_is_switch`)===`1`,sessionStorage.removeItem(`pending_2fa_is_switch`)}catch{}let n=o.username;if(n)try{sessionStorage.removeItem(`pending_2fa_username`)}catch{}else try{n=sessionStorage.getItem(`pending_2fa_username`)||``,sessionStorage.removeItem(`pending_2fa_username`)}catch{}this._completeLogin=setTimeout(()=>{if(t()&&(window.dispatchEvent(new CustomEvent(`user-logged-in`,{detail:{username:n}})),window.location.hash=`/mailbox/INBOX`,e&&typeof window.location.reload==`function`))try{window.location.reload()}catch{}},500)}else throw Error(this.i18nStore?.t(`webauthn.errors.verification_failed`))}catch(e){if(!t())return;e?.name===`NotAllowedError`||e?.name===`AbortError`?this.statusMessage=this.i18nStore?.t(`webauthn.errors.cancelled`):e instanceof rc?this.statusMessage=this.i18nStore?.t(`webauthn.errors.invalid_options`):e instanceof DOMException?this.statusMessage=this.i18nStore?.t(`webauthn.errors.general`):this.statusMessage=e.message||this.i18nStore?.t(`webauthn.errors.general`),this.statusType=`error`}finally{t()&&(this.isLoading=!1)}}render(){return n`
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
          ?disabled=${this.isLoading||this.isSuccess||!oc()}
          ?spinning=${this.isLoading}
        >
          ${this.isLoading?this.i18nStore?.t(`webauthn.verifying_btn`):this.i18nStore?.t(`webauthn.verify_btn`)}
        </alps-button>
        
        <alps-button 
          variant="text"
          full-width
          style="height: 36px; margin-top: 8px;"
          @click=${this._backToLogin}
        >
          ← ${this.i18nStore?.t(`webauthn.back_to_login`)}
        </alps-button>
      </alps-auth-card>
    `}};P([h({context:D})],fc.prototype,`i18nStore`,void 0),P([a()],fc.prototype,`statusMessage`,void 0),P([a()],fc.prototype,`statusType`,void 0),P([a()],fc.prototype,`isLoading`,void 0),P([a()],fc.prototype,`isSuccess`,void 0),fc=P([p(`login-webauthn-page`)],fc);var pc=class extends d{constructor(...e){super(...e),this.show=!1,this.message=``,this.actionLabel=``,this.timeout=0,this._timer=null}updated(e){e.has(`show`)&&(this.show&&this.timeout>0?(this._timer&&clearTimeout(this._timer),this._timer=setTimeout(()=>{this.dismiss()},this.timeout)):!this.show&&this._timer&&(clearTimeout(this._timer),this._timer=null))}dismiss(){this.onDismiss&&this.onDismiss(),this.close()}close(){this.show=!1,this.dispatchEvent(new CustomEvent(`dismiss`)),this.onAction=void 0,this.onDismiss=void 0}handleAction(){this.onAction?this.onAction():this.dispatchEvent(new CustomEvent(`action`)),this.close()}static{this.styles=v`
    :host {
      display: block;
      max-width: calc(100vw - 48px);
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
      min-height: 36px;
      box-sizing: border-box;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: normal;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    .toast-container > span {
      min-width: 0;
      padding: 6px 0;
      overflow-wrap: anywhere;
    }

    .toast-container > alps-button,
    .toast-container > alps-icon-btn {
      flex-shrink: 0;
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
    `}};P([h({context:D})],pc.prototype,`i18nStore`,void 0),P([o({type:Boolean,reflect:!0})],pc.prototype,`show`,void 0),P([o({type:String})],pc.prototype,`message`,void 0),P([o({type:String})],pc.prototype,`actionLabel`,void 0),P([o({type:Object})],pc.prototype,`onAction`,void 0),P([o({type:Object})],pc.prototype,`onDismiss`,void 0),P([o({type:Number})],pc.prototype,`timeout`,void 0),pc=P([p(`alps-toast`)],pc);function mc(){let e=document.activeElement;for(;e?.shadowRoot?.activeElement;)e=e.shadowRoot.activeElement;return e}var Q=class extends d{constructor(...e){super(...e),this.attachments=[],this.mailbox=``,this.messageUid=``,this.activeIndex=0,this.zoom=1,this.rotation=0,this.loadedText=null,this.textLoading=!1,this.textError=null,this.copied=!1,this.pdfUrl=null,this.pdfLoading=!1,this.pdfError=null,this.loadToken=0,this.previouslyFocused=null,this.handleKeyDown=e=>{e.key===`Escape`?(e.preventDefault(),e.stopPropagation(),this.close()):e.key===`ArrowLeft`||e.key===`ArrowRight`?(e.preventDefault(),e.stopPropagation(),e.key===`ArrowLeft`?this.prev():this.next()):(e.key===`ArrowUp`||e.key===`ArrowDown`)&&e.stopPropagation()}}connectedCallback(){super.connectedCallback(),this.previouslyFocused=mc(),window.addEventListener(`keydown`,this.handleKeyDown,!0)}firstUpdated(){let e=this.shadowRoot?.querySelector(`dialog.backdrop`);e&&!e.open&&e.showModal(),this.shadowRoot?.querySelector(`.close-btn`)?.focus()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(`keydown`,this.handleKeyDown,!0),this.replacePdfUrl(null);let e=this.previouslyFocused;this.previouslyFocused=null,e?.isConnected&&e.focus?.()}updated(e){(e.has(`activeIndex`)||e.has(`attachments`))&&(this.zoom=1,this.rotation=0,this.copied=!1,this.loadContent())}get current(){if(!this.attachments||this.attachments.length===0)return null;let e=Math.max(0,Math.min(this.activeIndex,this.attachments.length-1));return this.attachments[e]}nameOf(e){return e?.Filename||e?.filename||e?.name||this.i18nStore?.t(`messageReader.unknownAttachment`)||``}sizeOf(e){return e?.Size||e?.size||0}infoOf(e){return $o(e?.MIMEType||e?.contentType,this.nameOf(e))}urlOf(e){return zo(this.mailbox,this.messageUid,e)}replacePdfUrl(e){this.pdfUrl&&URL.revokeObjectURL(this.pdfUrl),this.pdfUrl=e}async loadContent(){let e=this.current;if(!e)return;let t=++this.loadToken;this.replacePdfUrl(null),this.pdfLoading=!1,this.pdfError=null,this.textLoading=!1,this.textError=null,this.loadedText=null;let n=this.infoOf(e),r=this.urlOf(e);if(r){if(n.previewKind===`text`){if(this.sizeOf(e)>2097152)return;this.textLoading=!0;try{let e=await N(r);if(!e.ok)throw Error(String(e.status));let n=await e.text();if(t!==this.loadToken)return;this.loadedText=n}catch(e){if(t!==this.loadToken)return;this.textError=e?.message||`error`}finally{t===this.loadToken&&(this.textLoading=!1)}return}if(n.previewKind===`pdf`){this.pdfLoading=!0;try{let e=await N(r);if(!e.ok)throw Error(String(e.status));let n=await e.blob();if(n.type!==`application/pdf`&&(n=new Blob([n],{type:`application/pdf`})),t!==this.loadToken)return;this.replacePdfUrl(URL.createObjectURL(n))}catch(e){if(t!==this.loadToken)return;this.pdfError=e?.message||`error`}finally{t===this.loadToken&&(this.pdfLoading=!1)}}}}close(){this.dispatchEvent(new CustomEvent(`close`,{bubbles:!0,composed:!0}))}prev(){this.attachments.length<=1||(this.activeIndex=(this.activeIndex-1+this.attachments.length)%this.attachments.length)}next(){this.attachments.length<=1||(this.activeIndex=(this.activeIndex+1)%this.attachments.length)}zoomIn(){this.zoom=Math.min(4,Math.round((this.zoom+.25)*100)/100)}zoomOut(){this.zoom=Math.max(.25,Math.round((this.zoom-.25)*100)/100)}resetZoom(){this.zoom=1,this.rotation=0}rotate(){this.rotation=(this.rotation+90)%360}async copyContent(){if(this.loadedText)try{await navigator.clipboard.writeText(this.loadedText),this.copied=!0,setTimeout(()=>{this.copied=!1},2e3)}catch{}}download(){let e=this.current,t=this.urlOf(e);if(!t)return;let n=document.createElement(`a`);n.href=t,n.download=this.nameOf(e)||`download`,document.body.appendChild(n),n.click(),document.body.removeChild(n)}openPdfInNewTab(){this.pdfUrl&&window.open(this.pdfUrl,`_blank`,`noopener,noreferrer`)}static{this.styles=v`
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
            >${M(a.icon)}</div>
            <div class="file-details">
              <span class="file-title" id="preview-title" title="${r}">${r}</span>
              <span class="file-sub">
                <span>${et(i,this.i18nStore)}</span>
                ${s>1?n`<span>•</span><span>${this.activeIndex+1} / ${s}</span>`:``}
              </span>
            </div>
          </div>
          <div class="actions-bar">
            ${a.isImage?n`
              <button class="action-btn icon-only zoom-out" @click=${this.zoomOut} title="${t(`attachment.zoomOut`)}">${M(`magnifyingGlassMinus`)}</button>
              <button class="action-btn icon-only fit" @click=${this.resetZoom} title="${t(`attachment.fitToScreen`)}">${M(`arrowsInSimple`)}</button>
              <button class="action-btn icon-only zoom-in" @click=${this.zoomIn} title="${t(`attachment.zoomIn`)}">${M(`magnifyingGlassPlus`)}</button>
              <button class="action-btn icon-only rotate" @click=${this.rotate} title="${t(`attachment.rotate`)}">${M(`arrowCounterClockwise`)}</button>
            `:``}
            ${a.previewKind===`text`&&this.loadedText?n`
              <button class="action-btn copy" @click=${this.copyContent} title="${t(`attachment.copyContent`)}">
                ${M(`copy`)}
                <span>${this.copied?t(`attachment.copied`):t(`attachment.copyContent`)}</span>
              </button>
            `:``}
            ${a.isPdf&&this.pdfUrl?n`
              <button class="action-btn icon-only new-tab" @click=${this.openPdfInNewTab} title="${t(`attachment.openInNewTab`)}">${M(`arrowsOutSimple`)}</button>
            `:``}
            ${o?n`
              <button class="action-btn icon-only download" @click=${this.download} title="${t(`attachment.download`)}">${M(`downloadSimple`)}</button>
            `:``}
            <button class="close-btn" @click=${this.close} title="${t(`attachment.close`)}">${M(`x`)}</button>
          </div>
        </div>

        <div class="preview-body" @click=${c}>
          ${s>1?n`
            <button class="nav-arrow prev" @click=${this.prev} title="${t(`attachment.previous`)}">${M(`caretLeft`)}</button>
            <button class="nav-arrow next" @click=${this.next} title="${t(`attachment.next`)}">${M(`caretRight`)}</button>
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
            ${M(`fileAudio`)}
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
        <div class="card-icon">${M(e.icon)}</div>
        <div class="card-title">${r}</div>
        <div class="card-desc">${a(`attachment.cannotPreview`)} (${et(i,this.i18nStore)})</div>
        ${t?n`
          <button class="action-btn download" @click=${this.download}>
            ${M(`downloadSimple`)}
            <span>${a(`attachment.download`)}</span>
          </button>
        `:``}
      </div>
    `}};P([h({context:D,subscribe:!0})],Q.prototype,`i18nStore`,void 0),P([o({type:Array})],Q.prototype,`attachments`,void 0),P([o({type:String})],Q.prototype,`mailbox`,void 0),P([o({type:String})],Q.prototype,`messageUid`,void 0),P([o({type:Number})],Q.prototype,`activeIndex`,void 0),P([a()],Q.prototype,`zoom`,void 0),P([a()],Q.prototype,`rotation`,void 0),P([a()],Q.prototype,`loadedText`,void 0),P([a()],Q.prototype,`textLoading`,void 0),P([a()],Q.prototype,`textError`,void 0),P([a()],Q.prototype,`copied`,void 0),P([a()],Q.prototype,`pdfUrl`,void 0),P([a()],Q.prototype,`pdfLoading`,void 0),P([a()],Q.prototype,`pdfError`,void 0),Q=P([p(`alps-attachment-preview`)],Q);var hc=3e3,gc=15e3,_c=3e3,vc=1500,$=class extends d{static{this.styles=v`
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
  `}constructor(){super(),this.composeStore=new Wa,this.settingsStore=new tr,this.i18nStore=new Se,this.linkedAccountsStore=As,this.activeComposers=[],this.composerReady=!1,this.toasts=[],this.attachmentPreview=null,this.toastIdCounter=0,this.isOffline=!navigator.onLine,this.offlineCountdown=0,this.offlineInterval=null,this._handleOpenAttachmentPreview=e=>{let{attachments:t,mailbox:n,messageUid:r,index:i}=e.detail??{};!Array.isArray(t)||t.length===0||(this.attachmentPreview={attachments:t,mailbox:n,messageUid:r,index:i??0})},this._handlePluginsUpdated=()=>{this.requestUpdate()},this._handleGlobalDragOver=e=>{e.preventDefault()},this._handleGlobalDrop=e=>{e.preventDefault(),window.dispatchEvent(new CustomEvent(`alps-composer-drop`))},this._handleAuthError=()=>{hs()||(sessionStorage.clear(),or(),window.dispatchEvent(new CustomEvent(`session-cleared`,{detail:{reason:`expired`}})),qa(`sessionExpired`),window.location.hash=`#/login`)},this._verifyConnectivity=async()=>{if(!navigator.onLine)return!1;try{let e=await fetch(`/site.webmanifest`,{method:`HEAD`,cache:`no-store`});return!(e.status===502||e.status===503||e.status===504)}catch{return!1}},this._handleOnlineEvent=async()=>{await this._verifyConnectivity()?(this.isOffline=!1,this._stopOfflineCountdown()):this._handleOfflineEvent()},this._verifyingNetworkError=!1,this._handleNetworkError=async()=>{if(!(this.isOffline||this._verifyingNetworkError)){this._verifyingNetworkError=!0;try{await this._verifyConnectivity()||this._handleOfflineEvent()}finally{this._verifyingNetworkError=!1}}},this._handleOfflineEvent=()=>{this.isOffline||(this.isOffline=!0,this.offlineCountdown=10,this._startOfflineCountdown())},this._isPinging=!1,this._handleShowToast=e=>{let t=++this.toastIdCounter,n={id:t,message:e.detail.message??(e.detail.i18nKey?this.i18nStore?.t(e.detail.i18nKey):void 0)??``,actionLabel:e.detail.actionLabel||``,actionFn:e.detail.actionFn,dismissFn:e.detail.dismissFn,timeout:e.detail.duration??hc,show:!1};this.toasts=[...this.toasts,n],requestAnimationFrame(()=>{this.toasts=this.toasts.map(e=>e.id===t?{...e,show:!0}:e)})},this._handleBeforeUnload=e=>{if(this.activeComposers.some(e=>e.isSending))return e.preventDefault(),`You have a message currently sending. Are you sure you want to leave?`},this._handleUpdateAvailable=()=>{this._handleShowToast(new CustomEvent(`show-toast`,{detail:{i18nKey:`update.available`,actionLabel:this.i18nStore?.t(`update.reload`),actionFn:Mt,duration:gc}}))},this._handlePluginLoadFailed=()=>{this._handleShowToast(new CustomEvent(`show-toast`,{detail:{i18nKey:`general.pageLoadFailed`,actionLabel:this.i18nStore.t(`general.backToMail`),actionFn:()=>{window.location.hash=`#/mailbox/INBOX`},duration:0}}))},this.composerModule=null,this._handleComposeChange=()=>{let e=this.composeStore.getState().activeComposers;e.length>0&&this.ensureComposerLoaded(),this._hasStructuralComposeChange(this.activeComposers,e)&&(this.activeComposers=e)},this._handleSettingsChange=()=>{let e=this.settingsStore.getState();xs.setLogoutTime(e.autoLogout??0),this.i18nStore.setLanguage(e.language??`en`)},this.mailboxPage=null,this.pluginPages=new Map,this._handleSessionCleared=()=>{this.mailboxPage=null,this.pluginPages.clear()},this.loadFailurePath=null,this.router=new br(this.getRoutes(),()=>n`<div>404 — ${this.i18nStore.t(`general.notFound`)}</div>`,()=>{let e=this.router.currentPath;e!==this.loadFailurePath&&(this.loadFailurePath=e,ee()),this.requestUpdate()}),this.addController(this.router)}connectedCallback(){super.connectedCallback();let e=document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_logged_in=1`))||document.cookie.split(`;`).some(e=>e.trim().startsWith(`alps_has_login_token=1`));!e&&!window.location.hash.startsWith(`#/login`)&&(window.location.hash=`#/login`),this.settingsStore.setI18n(this.i18nStore),this.composeStore.addEventListener(`change`,this._handleComposeChange),this.settingsStore.addEventListener(`change`,this._handleSettingsChange),this._handleComposeChange();let t=this.settingsStore.getState().autoLogout??0;xs.setLogoutTime(t),xs.onBeforeLogout=()=>this.composeStore.saveAllDirtyDrafts();let n=this.settingsStore.getState().language??`en`;this.i18nStore.setLanguage(n),window.addEventListener(`auth-error`,this._handleAuthError),window.addEventListener(`session-cleared`,this._handleSessionCleared),window.addEventListener(`show-toast`,this._handleShowToast),window.addEventListener(`beforeunload`,this._handleBeforeUnload),window.addEventListener(`online`,this._handleOnlineEvent),window.addEventListener(`offline`,this._handleOfflineEvent),window.addEventListener(`network-error`,this._handleNetworkError),window.addEventListener(`dragover`,this._handleGlobalDragOver),window.addEventListener(`drop`,this._handleGlobalDrop),window.addEventListener(`plugins-updated`,this._handlePluginsUpdated),window.addEventListener(S,this._handlePluginLoadFailed),window.addEventListener(`open-attachment-preview`,this._handleOpenAttachmentPreview),window.addEventListener(ct,this._handleUpdateAvailable),Ot(()=>this.composeStore.getState().activeComposers.length>0),this.isOffline&&this._handleOfflineEvent(),e&&this._fetchSessionData()}async _fetchSessionData(){try{let e=await fetch(`/session`);if(e.ok){let t=await e.json();t.EnabledPlugins&&T.setEnabledPlugins(t.EnabledPlugins)}}catch(e){console.error(`Failed to fetch session data`,e)}}disconnectedCallback(){super.disconnectedCallback(),this.composeStore.removeEventListener(`change`,this._handleComposeChange),this.settingsStore.removeEventListener(`change`,this._handleSettingsChange),window.removeEventListener(`auth-error`,this._handleAuthError),window.removeEventListener(`session-cleared`,this._handleSessionCleared),window.removeEventListener(`show-toast`,this._handleShowToast),window.removeEventListener(`open-attachment-preview`,this._handleOpenAttachmentPreview),window.removeEventListener(`beforeunload`,this._handleBeforeUnload),window.removeEventListener(`online`,this._handleOnlineEvent),window.removeEventListener(`offline`,this._handleOfflineEvent),window.removeEventListener(`network-error`,this._handleNetworkError),window.removeEventListener(`dragover`,this._handleGlobalDragOver),window.removeEventListener(`drop`,this._handleGlobalDrop),window.removeEventListener(`plugins-updated`,this._handlePluginsUpdated),window.removeEventListener(S,this._handlePluginLoadFailed),window.removeEventListener(ct,this._handleUpdateAvailable),Ot(null),this._stopOfflineCountdown()}_startOfflineCountdown(){this._stopOfflineCountdown(),this.offlineInterval=window.setInterval(async()=>{if(this.offlineCountdown>1)this.offlineCountdown--;else{if(this.offlineCountdown=10,this._isPinging)return;this._isPinging=!0;try{await this._verifyConnectivity()&&(this.isOffline=!1,this._stopOfflineCountdown())}finally{this._isPinging=!1}}},1e3)}_stopOfflineCountdown(){this.offlineInterval!==null&&(clearInterval(this.offlineInterval),this.offlineInterval=null)}_handleDismissToast(e){this.toasts=this.toasts.map(t=>t.id===e?{...t,show:!1}:t),setTimeout(()=>{this.toasts=this.toasts.filter(t=>t.id!==e)},300)}firstUpdated(){let e=()=>{this.isConnected&&this.ensureComposerLoaded().catch(()=>{})},t=window.requestIdleCallback;typeof t==`function`?t(e,{timeout:_c}):window.setTimeout(e,vc)}ensureComposerLoaded(){return this.composerModule||=E(()=>import(`./alps-floating-composer-Cg61R9IJ.js`).then(e=>(this.composerReady=!0,e)),__vite__mapDeps([15,1,2,16,17])).catch(e=>{throw this.composerModule=null,x.error(`Failed to load the composer`,e),e}),this.composerModule}_hasStructuralComposeChange(e,t){return e.length===t.length?t.some((t,n)=>{let r=e[n];return r.id!==t.id||!!r.minimized!=!!t.minimized||!!r.isSending!=!!t.isSending||!!r.dirty!=!!t.dirty||!!t.minimized&&(r.subject??``)!==(t.subject??``)}):!0}getMailboxPage(){return this.mailboxPage??=document.createElement(`mailbox-page`)}getRoutes(){let e={"/":()=>this.getMailboxPage(),"/login":()=>n`<login-page></login-page>`,"/mailbox/*":()=>this.getMailboxPage(),"/settings":()=>n`<settings-page category="general"></settings-page>`,"/settings/*":()=>{let e=window.location.hash.match(/^#\/settings\/?(.*)$/);return n`<settings-page .category=${e&&e[1]?e[1].split(`?`)[0]:`general`}></settings-page>`},"/original":()=>n`<original-message-page></original-message-page>`,"/print":()=>n`<print-page></print-page>`,"/login/webauthn":()=>n`<login-webauthn-page></login-webauthn-page>`};return T.getRoutes().forEach(t=>{e[t.path]=()=>{te(t);let e=this.pluginPages.get(t.path);return e||(e=document.createElement(t.component),this.pluginPages.set(t.path,e)),e}}),e}render(){let e=this.activeComposers.filter(e=>!e.minimized).length,t=this.activeComposers.filter(e=>e.minimized).length,r=0,i=0;return n`
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
            <div class="offline-icon">${M(`wifiSlash`)}</div>
            <div style="font-weight: 500; font-size: 16px; margin-bottom: 8px; color: var(--text-primary, #111827);">
              ${this.i18nStore.t(`offline.description`)}
            </div>
            <div style="color: var(--text-secondary, #4b5563); font-size: 14px;">
              ${this.i18nStore.t(`offline.tryingAgain`,{count:this.offlineCountdown})}
            </div>
          </div>
        </ui-modal>
      `:``}
    `}};P([i({context:Ga})],$.prototype,`composeStore`,void 0),P([i({context:nr})],$.prototype,`settingsStore`,void 0),P([i({context:D})],$.prototype,`i18nStore`,void 0),P([i({context:js})],$.prototype,`linkedAccountsStore`,void 0),P([a()],$.prototype,`activeComposers`,void 0),P([a()],$.prototype,`composerReady`,void 0),P([a()],$.prototype,`toasts`,void 0),P([a()],$.prototype,`attachmentPreview`,void 0),P([a()],$.prototype,`isOffline`,void 0),P([a()],$.prototype,`offlineCountdown`,void 0),$=P([p(`app-root`)],$);var yc=Object.assign({"../../plugins/caldav/frontend/index.ts":ln,"../../plugins/carddav/frontend/index.ts":Nn,"../../plugins/gpg/frontend/index.ts":_r,"../../plugins/managesieve/frontend/index.ts":vr,"../../plugins/password/frontend/index.ts":yr});x.info(`Loaded ${Object.keys(yc).length} frontend plugins.`),Et();export{N as $,Fi as A,Mn as B,ga as C,Vi as D,ki as E,sr as F,Sn as G,An as H,rr as I,P as J,wn as K,ir as L,ai as M,V as N,Bi as O,fr as P,Pt as Q,ar as R,xa as S,ya as T,xn as U,En as V,Dn as W,Qt as X,Yt as Y,Ft as Z,Na as _,cs as a,Ke as at,Oa as b,Do as c,E as ct,La as d,Rt as et,Ga as f,Ba as g,Va as h,Cs as i,qe as it,Pi as j,Ii as k,Eo as l,T as lt,Ra as m,Ss as n,Lt as nt,G as o,M as ot,za as p,on as q,ws as r,Ge as rt,ko as s,D as st,J as t,It as tt,yo as u,x as ut,Ta as v,ba as w,ka as x,Da as y,nr as z};