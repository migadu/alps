import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { renderIcon } from '../utils/ui';
import { composeContext } from '../store/compose-store';
import type { ComposeStore } from '../store/compose-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { mailboxOperations } from '../services/mailbox-operations';
import { FOLDER_INBOX, FOLDER_DRAFTS, FOLDER_SENT, FOLDER_ARCHIVE, FOLDER_ARCHIVES, FOLDER_SPAM, FOLDER_JUNK, FOLDER_TRASH, mailboxRoleByName, findMailboxNameByRole, isSelfOrDescendantMailbox, delimiterOf, mailboxLevels, acceptsDroppedMessages, advertisedRoles, mailboxRole, reportsSubscriptions, type MailboxRole } from '../utils/folders';
import { carriesMessages, dropCopies, readMessageDrag } from '../utils/message-drag';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { confirmUnsubscribed, forgetUnsubscribedTree, renameUnsubscribedTree, settleUnsubscribedFolders, withUnsubscribedFolder, withoutUnsubscribedFolder } from '../utils/unsubscribed-folders';
import './alps-icon-btn';
import './ui-prompt';
import './alps-toolbar';
import './alps-button';
import './ui-confirm';
import { popupStyles } from './alps-popup';
import './alps-icon-btn';
import './alps-create-button';
import { sidebarLayoutStyles } from './alps-sidebar';
import './alps-popup';

@customElement('alps-folder-list')
export class FolderList extends LitElement {
  @consume({ context: composeContext })
  composeStore!: ComposeStore;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @property({ type: Array }) mailboxes: any[] = [];
  @property({ type: String }) currentMailbox = '';
  @property({ type: Object }) expandedFolders = new Set<string>();
  @property({ type: String }) layoutMode = 'vertical';
  @property({ type: Boolean }) syncing = false;
  @property({ type: Boolean, reflect: true }) collapsed = false;
  @state() private isScrolled = false;

  @state() private showCreatePrompt = false;
  /** True while the create request is out; disables the prompt's buttons. */
  @state() private promptBusy = false;
  @state() private showRenamePrompt = false;
  @state() private mailboxToRename = '';
  @state() private showDeleteConfirm = false;
  @state() private showMoveToTrashConfirm = false;
  @state() private mailboxToDelete = '';
  @state() private parentForNewFolder = '';
  @state() private activeKebabMenu: string | null = null;
  /** The folder a drag of messages is over and may be dropped on, by name. */
  @state() private dropTarget: string | null = null;
  /** Whether that drop would copy (Alt held) rather than move. */
  @state() private dropCopy = false;
  /** Stops watching the window for the end of the drag that lit a folder;
   * null when no folder is lit. */
  private stopDropWatch: (() => void) | null = null;
  /**
   * Whether the unsubscribed folders are showing under More. Not kept between
   * visits: it is a disclosure, and a sidebar that remembered it open would
   * soon stop putting anything away.
   */
  @state() private showUnsubscribed = false;
  /** Folders just unsubscribed here that no listing has yet shown
   * unsubscribed; see confirmUnsubscribed. */
  private unconfirmedUnsubscribes = new Set<string>();
  private primaryFullNames = new Set<string>();

  willUpdate(changedProperties: Map<string, any>) {
    super.willUpdate(changedProperties);
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    this.settleUnsubscribed();
  }

  /** The folders unsubscribed from here, as the account's settings hold them;
   * see utils/unsubscribed-folders. */
  private get unsubscribedHere(): string[] {
    return this.settingsStore?.getState()?.unsubscribedFolders ?? [];
  }

  private saveUnsubscribedHere(list: string[]) {
    const current = this.unsubscribedHere;
    if (list.length === current.length && list.every((name, i) => name === current[i])) return;
    void this.settingsStore?.updateSettings({ unsubscribedFolders: list });
  }

  /**
   * Drops the entries of folders the listing shows subscribed again, by
   * another client or by this one in another browser.
   *
   * Only once the account's record has been read: before that, the list is
   * this browser's copy, and one worked out from it would be saved over the
   * account's.
   */
  private settleUnsubscribed() {
    if (!this.settingsStore?.recordRead || this.mailboxes.length === 0) return;
    if (this.unsubscribedHere.length === 0 && this.unconfirmedUnsubscribes.size === 0) return;
    confirmUnsubscribed(this.unconfirmedUnsubscribes, this.mailboxes);
    this.saveUnsubscribedHere(settleUnsubscribedFolders(this.unsubscribedHere, this.mailboxes, this.unconfirmedUnsubscribes));
  }

  /** A subscription changed here, and the server took it. */
  private subscriptionChanged(name: string, subscribed: boolean) {
    if (subscribed) {
      this.unconfirmedUnsubscribes.delete(name);
      this.saveUnsubscribedHere(withoutUnsubscribedFolder(this.unsubscribedHere, name));
    } else {
      this.unconfirmedUnsubscribes.add(name);
      this.saveUnsubscribedHere(withUnsubscribedFolder(this.unsubscribedHere, name));
    }
  }

  /** A folder renamed here: what was unsubscribed under the old names is
   * unsubscribed under the new ones. */
  private renamedHere(from: string, to: string, delimiter: string) {
    for (const name of [...this.unconfirmedUnsubscribes]) {
      if (!isSelfOrDescendantMailbox(name, from, delimiter)) continue;
      this.unconfirmedUnsubscribes.delete(name);
      this.unconfirmedUnsubscribes.add(to + name.slice(from.length));
    }
    this.saveUnsubscribedHere(renameUnsubscribedTree(this.unsubscribedHere, from, to, delimiter));
  }

  /** A folder deleted here, or moved to Trash: it and what was under it are
   * not unsubscribed folders of this account any more. */
  private goneHere(name: string, delimiter: string) {
    for (const entry of [...this.unconfirmedUnsubscribes]) {
      if (isSelfOrDescendantMailbox(entry, name, delimiter)) this.unconfirmedUnsubscribes.delete(entry);
    }
    this.saveUnsubscribedHere(forgetUnsubscribedTree(this.unsubscribedHere, name, delimiter));
  }



  connectedCallback() {
    super.connectedCallback();
    // Use setTimeout or a small delay if composeStore is injected slightly later
    // Actually, context is provided synchronously down the tree.
    // Wait until next tick to ensure context is resolved.
    this.updateComplete.then(() => {
      if (!this.isConnected) return;
      if (this.composeStore) {
        this.composeStore.addEventListener('change', this._handleStoreChange);
      }
      if (this.i18nStore) {
        this.i18nStore.addEventListener('change', this._handleStoreChange);
      }
      if (this.settingsStore) {
        this.settingsStore.addEventListener('change', this._handleStoreChange);
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.composeStore) {
      this.composeStore.removeEventListener('change', this._handleStoreChange);
    }
    this.i18nStore?.removeEventListener('change', this._handleStoreChange);
    this.settingsStore?.removeEventListener('change', this._handleStoreChange);
    // A list that leaves the page while a folder is lit would otherwise keep
    // its window listeners until some later drag ended.
    this.clearDropTarget();
  }

  private _handleStoreChange = () => {
    this.requestUpdate();
  };

  static styles = [
    popupStyles,
    sidebarLayoutStyles,
    css`
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
  `];

  private toggleFolder(e: Event | null, folderName: string) {
    if (e) e.stopPropagation();
    this.dispatchEvent(new CustomEvent('toggle-folder', {
      detail: { folderName }
    }));
  }

  private handleScroll = (e: Event) => {
    const target = e.target as HTMLElement;
    this.isScrolled = target.scrollTop > 0;
  };

  private selectMailbox(name: string) {
    this.dispatchEvent(new CustomEvent('select-mailbox', {
      detail: { name }
    }));
  }

  public triggerCreateFolder() {
    this.parentForNewFolder = '';
    this.showCreatePrompt = true;
  }

  private async handleCreateSubmit(e: CustomEvent) {
    let name = e.detail.name;
    // The prompt stays mounted across the await below — abdc8bb made this
    // handler async and left the dialog live while the request was out, so the
    // confirm button could be pressed again and create the folder twice.
    this.promptBusy = true;
    try {
    if (name) {
      if (this.parentForNewFolder) {
        const parentMb = this.mailboxes.find(m => (m.Name || m.Mailbox) === this.parentForNewFolder);
        const delimiter = delimiterOf(parentMb) || '.';
        name = `${this.parentForNewFolder}${delimiter}${name}`;

        this.dispatchEvent(new CustomEvent('expand-folder', {
          detail: { folderName: this.parentForNewFolder }
        }));
      }
      // The result was discarded entirely: creating a folder that already
      // exists, or any server refusal, closed the prompt and said nothing.
      const outcome = await mailboxOperations.createMailbox(name);
      if (outcome === 'ok') {
        // An entry left by a folder of the same name deleted elsewhere is not
        // this one's.
        this.saveUnsubscribedHere(withoutUnsubscribedFolder(this.unsubscribedHere, name));
      } else if (outcome === 'exists') {
        this.toast(this.i18nStore?.t('toast.folderExists'), 'A folder with that name already exists', { type: 'error' });
      } else if (outcome === 'failed') {
        this.toast(this.i18nStore?.t('toast.folderCreateFailed'), 'Could not create the folder', { type: 'error' });
      }
    }
    } finally {
      this.promptBusy = false;
      this.showCreatePrompt = false;
      this.parentForNewFolder = '';
    }
  }

  /** One place to raise a toast, so every folder verb can report its outcome
   * instead of only its success. */
  private toast(message: string | undefined, fallback: string, extra: Record<string, unknown> = {}) {
    this.dispatchEvent(new CustomEvent('toast', {
      detail: { message: message || fallback, duration: 4000, ...extra },
      bubbles: true,
      composed: true
    }));
  }

  private async handleRenameSubmit(e: CustomEvent) {
    const newName = e.detail.name;
    if (newName && this.mailboxToRename) {
      const oldName = this.mailboxToRename;
      const delimiter = delimiterOf(this.mailboxes.find(m => (m.Name || m.Mailbox) === oldName));
      // Taken down before the request here, so there is no double-submit window
      // to guard — unlike the create path above.
      this.showRenamePrompt = false;
      this.mailboxToRename = '';
      const outcome = await mailboxOperations.renameMailbox(oldName, newName);
      if (outcome === 'exists') {
        this.toast(this.i18nStore?.t('toast.folderExists'), 'A folder with that name already exists', { type: 'error' });
      } else if (outcome === 'failed') {
        this.toast(this.i18nStore?.t('toast.folderRenameFailed'), 'Could not rename the folder', { type: 'error' });
      } else {
        this.renamedHere(oldName, newName, delimiter);
        if (isSelfOrDescendantMailbox(this.currentMailbox, oldName)) {
          this.selectMailbox(newName + this.currentMailbox.slice(oldName.length));
        }

        const undoFn = async () => {
          const undone = await mailboxOperations.renameMailbox(newName, oldName);
          if (undone !== 'ok') {
            this.toast(this.i18nStore?.t('toast.folderUndoFailed'), 'Could not undo that', { type: 'error' });
            return;
          }
          this.renamedHere(newName, oldName, delimiter);
          if (isSelfOrDescendantMailbox(this.currentMailbox, newName)) {
            this.selectMailbox(oldName + this.currentMailbox.slice(newName.length));
          }
        };

        this.dispatchEvent(new CustomEvent('toast', {
          detail: {
            message: this.i18nStore?.t('toast.folderRenamed'),
            actionLabel: this.i18nStore?.t('toast.undo'),
            actionFn: undoFn,
            duration: 5000
          },
          bubbles: true,
          composed: true
        }));
      }
    } else {
      this.showRenamePrompt = false;
      this.mailboxToRename = '';
    }
  }

  private async handleDeleteConfirm() {
    if (this.mailboxToDelete) {
      const deleted = this.mailboxToDelete;
      const delimiter = delimiterOf(this.mailboxes.find(m => (m.Name || m.Mailbox) === deleted));
      const success = await mailboxOperations.deleteMailbox(deleted);
      if (success) {
        this.goneHere(deleted, delimiter);
        // `startsWith` alone also matched a sibling that merely shares a prefix,
        // so deleting `Arch` navigated away from `Archive`.
        if (isSelfOrDescendantMailbox(this.currentMailbox, this.mailboxToDelete)) {
          this.selectMailbox(FOLDER_INBOX);
        }

        this.dispatchEvent(new CustomEvent('toast', {
          detail: {
            message: this.i18nStore?.t('toast.folderPermanentlyDeleted'),
            duration: 3000
          },
          bubbles: true,
          composed: true
        }));
      } else {
        this.toast(this.i18nStore?.t('toast.folderDeleteFailed'), 'Could not delete the folder', { type: 'error' });
      }
    }
    this.showDeleteConfirm = false;
    this.mailboxToDelete = '';
  }

  private async handleMoveToTrashConfirm() {
    if (this.mailboxToDelete) {
      const mb = this.mailboxes.find(m => (m.Name || m.Mailbox) === this.mailboxToDelete);
      const levels = mailboxLevels(this.mailboxToDelete, delimiterOf(mb, '.'));
      const leafName = levels[levels.length - 1];
      // A server without a hierarchy has no "inside Trash": the name is still
      // built with a dot, as a folder created under a parent is, rather than
      // run together with Trash's.
      const delimiter = delimiterOf(mb, '.') || '.';

      // Resolve the actual Trash mailbox by IMAP special-use attribute (e.g.
      // Gmail's "[Gmail]/Trash"), falling back to a folder named "Trash". See issue #4.
      const trashName = findMailboxNameByRole('trash', this.mailboxes, 'Trash');

      // Resolve name collisions by appending a suffix if needed
      let candidateName = `${trashName}${delimiter}${leafName}`;
      let suffix = 1;
      while (this.mailboxes.some(m => (m.Name || m.Mailbox) === candidateName)) {
        candidateName = `${trashName}${delimiter}${leafName} (${suffix})`;
        suffix++;
      }
      const newName = candidateName;

      const outcome = await mailboxOperations.renameMailbox(this.mailboxToDelete, newName);
      if (outcome !== 'ok') {
        this.toast(this.i18nStore?.t('toast.folderRenameFailed'), 'Could not rename the folder', { type: 'error' });
      } else {
        // The server takes a folder moved into Trash out of the subscriptions,
        // and puts it back when it leaves, by Undo or by hand: there is
        // nothing left for the list to hold.
        this.goneHere(this.mailboxToDelete, delimiter);
        // Same prefix guard as the permanent delete above.
        if (isSelfOrDescendantMailbox(this.currentMailbox, this.mailboxToDelete, delimiter)) {
          this.selectMailbox(FOLDER_INBOX);
        }

        const oldName = this.mailboxToDelete;
        const undoFn = async () => {
          if (await mailboxOperations.renameMailbox(newName, oldName) !== 'ok') {
            this.toast(this.i18nStore?.t('toast.folderUndoFailed'), 'Could not undo that', { type: 'error' });
          }
        };

        this.dispatchEvent(new CustomEvent('toast', {
          detail: {
            message: this.i18nStore?.t('toast.folderMovedToTrash'),
            actionLabel: this.i18nStore?.t('toast.undo'),
            actionFn: undoFn,
            duration: 5000
          },
          bubbles: true,
          composed: true
        }));
      }
    }
    this.showMoveToTrashConfirm = false;
    this.mailboxToDelete = '';
  }

  private moveFolder(folderName: string, direction: 'top' | 'up' | 'down' | 'bottom') {
    console.log('[moveFolder] Start:', { folderName, direction });
    const mb = this.mailboxes.find(m => (m.Name || m.Mailbox) === folderName);
    const delimiter = delimiterOf(mb, '.');
    const parts = mailboxLevels(folderName, delimiter);
    const parentPath = parts.slice(0, -1).join(delimiter);

    const siblings = this.mailboxes
      .map(m => m.Name || m.Mailbox || '')
      .filter(name => {
        if (this.primaryFullNames.has(name)) return false;
        const sParts = mailboxLevels(name, delimiter);
        const sParent = sParts.slice(0, -1).join(delimiter);
        return sParent === parentPath && sParts.length === parts.length;
      });

    console.log('[moveFolder] Sibling custom folders found:', siblings);

    const customOrder = [...(this.settingsStore?.getState()?.customMailboxOrder || [])];
    siblings.sort((a, b) => {
      const idxA = customOrder.indexOf(a);
      const idxB = customOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    console.log('[moveFolder] Sorted siblings:', siblings);

    const currentIndex = siblings.indexOf(folderName);
    if (currentIndex === -1) {
      console.error('[moveFolder] Folder not found in siblings!');
      return;
    }

    let newIndex = currentIndex;
    switch (direction) {
      case 'top':
        newIndex = 0;
        break;
      case 'up':
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'down':
        newIndex = Math.min(siblings.length - 1, currentIndex + 1);
        break;
      case 'bottom':
        newIndex = siblings.length - 1;
        break;
    }

    console.log('[moveFolder] Shifting indexes:', { currentIndex, newIndex });

    if (newIndex === currentIndex) {
      console.log('[moveFolder] No index change needed.');
      return;
    }

    siblings.splice(currentIndex, 1);
    siblings.splice(newIndex, 0, folderName);

    console.log('[moveFolder] New siblings order:', siblings);

    const updatedOrder = customOrder.filter(name => !siblings.includes(name));
    updatedOrder.push(...siblings);

    console.log('[moveFolder] Final updated customMailboxOrder settings state:', updatedOrder);

    this.settingsStore?.updateSettings({ customMailboxOrder: updatedOrder });
  }

  /**
   * Whether the drag over a folder's row is messages that may be filed there.
   * The rules are in {@link acceptsDroppedMessages}; a collapsed strip takes
   * nothing, being inert.
   */
  private takesDrop(e: DragEvent, mb: any): boolean {
    return !this.collapsed && carriesMessages(e.dataTransfer) && acceptsDroppedMessages(mb, this.mailboxes, this.currentMailbox);
  }

  /**
   * dragenter and dragover alike. Refusing to call preventDefault is how a row
   * says no: the browser then shows the no-drop cursor and never sends it the
   * drop. Asked on every dragover, so that letting go of Alt over a row turns
   * a copy back into a move as the pointer rests there.
   */
  private handleDragOver(e: DragEvent, name: string, mb: any) {
    if (!this.takesDrop(e, mb)) {
      if (this.dropTarget === name) this.clearDropTarget();
      return;
    }
    e.preventDefault();
    const copy = dropCopies(e);
    e.dataTransfer!.dropEffect = copy ? 'copy' : 'move';
    if (this.dropTarget !== name) this.dropTarget = name;
    if (this.dropCopy !== copy) this.dropCopy = copy;
    this.watchDragEnd();
  }

  private handleDragLeave(e: DragEvent, name: string) {
    // Into the row's own caret or caption is still over the row.
    const row = e.currentTarget as HTMLElement | null;
    const into = e.relatedTarget as Node | null;
    if (row && into && row.contains(into)) return;
    if (this.dropTarget === name) this.clearDropTarget();
  }

  private handleDrop(e: DragEvent, name: string, mb: any) {
    if (!this.takesDrop(e, mb)) return;
    e.preventDefault();
    const copy = dropCopies(e);
    const drag = readMessageDrag(e.dataTransfer);
    this.clearDropTarget();
    if (!drag || drag.keys.length === 0) return;
    this.dispatchEvent(new CustomEvent('drop-messages', {
      detail: { folder: name, copy, keys: drag.keys, selection: drag.selection },
      bubbles: true,
      composed: true,
    }));
  }

  /**
   * Puts the lit row out however the drag ends without leaving it: dropped
   * somewhere else, or called off with Escape, which the browser reports as a
   * dragend at the row the drag started from. The key itself is watched too,
   * for a browser that lets the page see it. Held only while a row is lit,
   * and let go with it.
   */
  private watchDragEnd() {
    if (this.stopDropWatch) return;
    const end = () => this.clearDropTarget();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') end(); };
    window.addEventListener('dragend', end, true);
    window.addEventListener('drop', end, true);
    window.addEventListener('keydown', onKey, true);
    this.stopDropWatch = () => {
      window.removeEventListener('dragend', end, true);
      window.removeEventListener('drop', end, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }

  private clearDropTarget() {
    this.stopDropWatch?.();
    this.stopDropWatch = null;
    this.dropTarget = null;
    this.dropCopy = false;
  }


  render() {
    // A special-mailbox "slot" is claimed by a mailbox with that role, decided
    // by mailboxRole as every action decides it: by IMAP special-use attribute
    // (authoritative) or, as a fallback, by a well-known name. Several names map
    // to the same slot (Archive/Archives, Spam/Junk); each slot is collapsed to a
    // single primary entry below so the same special mailbox is never shown twice.
    const specialSlots: { role: MailboxRole; names: string[]; display: { icon: string; colorClass: string; label: string } }[] = [
      { role: 'inbox', names: [FOLDER_INBOX], display: { icon: 'tray', colorClass: 'icon-inbox', label: this.i18nStore?.t('folderList.inbox') } },
      { role: 'drafts', names: [FOLDER_DRAFTS], display: { icon: 'fileText', colorClass: 'icon-drafts', label: this.i18nStore?.t('folderList.drafts') } },
      { role: 'sent', names: [FOLDER_SENT], display: { icon: 'paperPlaneTilt', colorClass: 'icon-sent', label: this.i18nStore?.t('folderList.sent') } },
      { role: 'archive', names: [FOLDER_ARCHIVE, FOLDER_ARCHIVES], display: { icon: 'archiveBox', colorClass: 'icon-archive', label: this.i18nStore?.t('folderList.archive') } },
      { role: 'junk', names: [FOLDER_JUNK, FOLDER_SPAM], display: { icon: 'warningDiamond', colorClass: 'icon-spam', label: this.i18nStore?.t('folderList.junk') } },
      { role: 'trash', names: [FOLDER_TRASH], display: { icon: 'trash', colorClass: 'icon-trash', label: this.i18nStore?.t('folderList.trash') } },
    ];
    const stdMap: Record<string, { icon: string, colorClass: string, label: string }> = {
      [FOLDER_INBOX]: { icon: 'tray', colorClass: 'icon-inbox', label: this.i18nStore?.t('folderList.inbox') },
      [FOLDER_DRAFTS]: { icon: 'fileText', colorClass: 'icon-drafts', label: this.i18nStore?.t('folderList.drafts') },
      [FOLDER_SENT]: { icon: 'paperPlaneTilt', colorClass: 'icon-sent', label: this.i18nStore?.t('folderList.sent') },
      [FOLDER_ARCHIVE]: { icon: 'archiveBox', colorClass: 'icon-archive', label: this.i18nStore?.t('folderList.archive') },
      [FOLDER_ARCHIVES]: { icon: 'archiveBox', colorClass: 'icon-archive', label: this.i18nStore?.t('folderList.archive') },
      [FOLDER_SPAM]: { icon: 'warningDiamond', colorClass: 'icon-spam', label: this.i18nStore?.t('folderList.spam') },
      [FOLDER_JUNK]: { icon: 'warningDiamond', colorClass: 'icon-spam', label: this.i18nStore?.t('folderList.junk') },
      [FOLDER_TRASH]: { icon: 'trash', colorClass: 'icon-trash', label: this.i18nStore?.t('folderList.trash') }
    };

    type TreeNode = { name: string; fullName: string; mb?: any; children: Record<string, TreeNode>; primary?: { icon: string; colorClass: string; label: string } };
    // Keyed by name, so without a prototype. On a plain object a folder called
    // "constructor" or "toString" found an inherited function where its node
    // should be and was never drawn, and one called "__proto__" was written onto
    // Object.prototype itself, handing every object in the app its mailbox.
    const level = (): Record<string, TreeNode> => Object.create(null);
    const root = level();

    this.mailboxes.forEach(mb => {
      const fullName = mb.Name || mb.Mailbox || '';
      const delimiter = delimiterOf(mb, '.');
      const parts = mailboxLevels(fullName, delimiter);

      let currentLevel = root;
      let pathAcc = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        pathAcc = i === 0 ? part : pathAcc + delimiter + part;

        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            fullName: pathAcc,
            children: level()
          };
        }
        if (i === parts.length - 1) {
          currentLevel[part].mb = mb;
        }
        currentLevel = currentLevel[part].children;
      }
    });

    const normalizedAttrs = (node: TreeNode): string[] =>
      (node.mb?.Attrs || []).map((a: any) => (typeof a === 'string' ? a.toLowerCase() : ''));
    const hasSlotAttr = (node: TreeNode, attr: string): boolean => normalizedAttrs(node).includes(attr);
    // The roles the server assigns itself: a name stands only for a role no
    // folder carries.
    const advertised = advertisedRoles(this.mailboxes);
    // The role the actions act on. This matched names itself, exactly and case
    // included, and knew no Exchange "Deleted Items", so Delete filed mail into
    // a folder called "trash" that the sidebar listed as an ordinary folder,
    // under its raw name. mailboxRole gives no role to a synthetic parent (e.g.
    // "Archives" when only "Archives/2025" exists) or a \Noselect placeholder,
    // which must not masquerade as a primary special mailbox; a \All folder
    // has a role but no slot.
    const slotIndexForNode = (node: TreeNode): number => {
      const role = mailboxRole(node.mb, advertised);
      return specialSlots.findIndex(s => s.role === role);
    };

    const standardBySlot = new Map<number, TreeNode>();
    const customNodes: TreeNode[] = [];

    Object.values(root).forEach(node => {
      const idx = slotIndexForNode(node);
      if (idx < 0) {
        customNodes.push(node);
        return;
      }
      const existing = standardBySlot.get(idx);
      if (!existing) {
        standardBySlot.set(idx, node);
        return;
      }
      // Two mailboxes claim the same slot: keep the one carrying the real
      // special-use attribute, else the one the actions file into, which is
      // the first of them the server lists. Beside a "Deleted Items" listed
      // first, a folder called "Trash" is not the Trash Delete uses, and is
      // not drawn as it. The loser is demoted to a regular folder rather than
      // duplicating the primary.
      const slotDef = specialSlots[idx];
      const nodeAttr = hasSlotAttr(node, '\\' + slotDef.role);
      const existingAttr = hasSlotAttr(existing, '\\' + slotDef.role);
      const nodeWins =
        (nodeAttr && !existingAttr) ||
        (nodeAttr === existingAttr && node.fullName === findMailboxNameByRole(slotDef.role, this.mailboxes, ''));
      if (nodeWins) {
        standardBySlot.set(idx, node);
        customNodes.push(existing);
      } else {
        customNodes.push(node);
      }
    });

    const standardNodes: TreeNode[] = [];
    for (let i = 0; i < specialSlots.length; i++) {
      const node = standardBySlot.get(i);
      if (!node) continue;
      // The name's own entry only when the name is one of this slot's, which
      // is how a \Junk called Spam keeps that word. Looked up by any name, a
      // \Trash called "constructor" found Object's function in the table and
      // drew a row with no caption and no icon.
      node.primary = (specialSlots[i].names.includes(node.name) && stdMap[node.name]) || specialSlots[i].display;
      standardNodes.push(node);
    }
    this.primaryFullNames = new Set(standardNodes.map(n => n.fullName));

    const customOrder = this.settingsStore?.getState()?.customMailboxOrder || [];

    customNodes.sort((a, b) => {
      const idxA = customOrder.indexOf(a.fullName);
      const idxB = customOrder.indexOf(b.fullName);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    /*
     * UNSUBSCRIBED FOLDERS, and where they go.
     *
     * IMAP keeps a list of the folders the user is subscribed to, and the
     * folder menu's Unsubscribe has always written to it. The sidebar ignored
     * it: the row stayed exactly where it was, and the only sign the gesture
     * had landed was that the menu now said Subscribe. So a folder unsubscribed
     * here goes behind a More row at the end of the list, and Subscribe brings
     * it back.
     *
     * UNSUBSCRIBED HERE, AND STILL UNSUBSCRIBED. The server's list alone would
     * also send behind More every folder unsubscribed in another client, and
     * every folder a server that does not subscribe on CREATE made
     * unsubscribed, which is most folders ever created here. So a folder goes
     * only when alps's own list has it (see utils/unsubscribed-folders) and
     * the server still lists it unsubscribed; subscribed again anywhere, it
     * is back.
     *
     * TOP LEVEL ONLY, with its subfolders. A row is captioned with the last
     * level of its name, and the parent it sits under is what says which
     * folder it is; pulled out to sit flat under More, it would lose that. A
     * nested folder unsubscribed stays under its parent.
     *
     * NEVER ONE WITH A SPECIAL USE, the Inbox included, nor a folder that
     * holds one: Gmail's "[Gmail]" holds Sent and Trash.
     *
     * ONLY ON A LISTING THAT SAYS: see reportsSubscriptions. Without an
     * answer every folder reads as unsubscribed, the one subscribed again
     * elsewhere included.
     *
     * More is open WHILE THE FOLDER ON SCREEN IS UNDER IT. Unsubscribing the
     * folder being read is one menu away, and a sidebar that answered by
     * taking the current row away would read as having lost it.
     */
    const unsubscribedHere = new Set(this.unsubscribedHere);
    const holdsSpecialUse = (node: TreeNode): boolean =>
      mailboxRole(node.mb, advertised) !== null || Object.values(node.children).some(holdsSpecialUse);
    const behindMore = (node: TreeNode): boolean =>
      !!node.mb && node.mb.Subscribed !== true && unsubscribedHere.has(node.fullName) && !holdsSpecialUse(node);
    const unsubscribedNodes = reportsSubscriptions(this.mailboxes) ? customNodes.filter(behindMore) : [];
    const subscribedNodes = customNodes.filter(node => !unsubscribedNodes.includes(node));
    const viewingUnsubscribed = unsubscribedNodes.some(node =>
      isSelfOrDescendantMailbox(this.currentMailbox, node.fullName, delimiterOf(node.mb)));
    const unsubscribedOpen = this.showUnsubscribed || viewingUnsubscribed;

    const renderTree = (nodes: TreeNode[], depth: number = 0): TemplateResult[] => {
      return nodes.map(node => {
        const hasChildren = Object.keys(node.children).length > 0;
        const isExpanded = this.expandedFolders.has(node.fullName);
        const isActive = this.currentMailbox === node.fullName;
        const hasActions = depth > 0 || !node.primary;

        let isFirst = false;
        let isLast = false;
        if (hasActions) {
          const delimiter = delimiterOf(node.mb, '.');
          const parts = mailboxLevels(node.fullName, delimiter);
          const parentPath = parts.slice(0, -1).join(delimiter);

          const siblings = this.mailboxes
            .map(m => m.Name || m.Mailbox || '')
            .filter(name => {
              if (this.primaryFullNames.has(name)) return false;
              const sParts = mailboxLevels(name, delimiter);
              const sParent = sParts.slice(0, -1).join(delimiter);
              return sParent === parentPath && sParts.length === parts.length;
            });

          const customOrder = this.settingsStore?.getState()?.customMailboxOrder || [];
          siblings.sort((a, b) => {
            const idxA = customOrder.indexOf(a);
            const idxB = customOrder.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
          });

          // A row that is not among the real siblings (a path segment with no
          // mailbox of its own, drawn only because a deeper folder is named
          // through it) cannot be reordered: moveFolder finds it at -1 and returns.
          // Its bounds used to come out as neither first nor last, so all four
          // Order items were enabled and did nothing.
          const index = siblings.indexOf(node.fullName);
          isFirst = index <= 0;
          isLast = index === -1 || index === siblings.length - 1;
        }

        let icon = renderIcon('folder');
        let colorClass = 'icon-default';
        let label = node.name;

        if (node.primary) {
          icon = renderIcon(node.primary.icon);
          colorClass = node.primary.colorClass;
          label = node.primary.label;
        }

        const unseenCount = node.mb?.Unseen || 0;
        const attrs: string[] = node.mb?.Attrs || [];
        const isNoSelect = attrs.some(a => typeof a === 'string' && a.toLowerCase() === '\\noselect');
        const isDropTarget = this.dropTarget === node.fullName;

        const handleClick = (e: Event) => {
          if (isNoSelect) {
            if (hasChildren) {
              this.toggleFolder(e, node.fullName);
            }
          } else {
            this.selectMailbox(node.fullName);
          }
        };


        return html`
          <div 
            class="folder-item ${isActive ? 'active' : ''} ${isNoSelect ? 'no-select' : ''} ${hasActions ? 'has-actions' : ''} ${isDropTarget ? 'drop-target' : ''} ${isDropTarget && this.dropCopy ? 'drop-copy' : ''}"
            title=${label}
            @click=${handleClick}
            @dragenter=${(e: DragEvent) => this.handleDragOver(e, node.fullName, node.mb)}
            @dragover=${(e: DragEvent) => this.handleDragOver(e, node.fullName, node.mb)}
            @dragleave=${(e: DragEvent) => this.handleDragLeave(e, node.fullName)}
            @drop=${(e: DragEvent) => this.handleDrop(e, node.fullName, node.mb)}
          >
            <alps-icon-btn 
              class="folder-toggle-btn" 
              icon=${isExpanded ? 'caretDown' : 'caretRight'}
              style="visibility: ${hasChildren ? 'visible' : 'hidden'}; --btn-padding: 2px;" 
              @click=${(e: Event) => {
            e.stopPropagation();
            if (hasChildren) this.toggleFolder(e, node.fullName);
          }}
            ></alps-icon-btn>
            
            <div class="folder-icon ${colorClass}">${icon}</div>
            <div class="folder-name">${label}</div>
            
            ${hasActions ? html`
              <div class="folder-actions ${this.activeKebabMenu === node.fullName ? 'popup-open' : ''}" @click=${(e: Event) => e.stopPropagation()}>
                <alps-popup 
                  align="right" 
                  position="bottom"
                  @popup-open=${() => { this.activeKebabMenu = node.fullName; }}
                  @popup-close=${() => { if (this.activeKebabMenu === node.fullName) this.activeKebabMenu = null; }}
                >
                  <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical" style="--btn-padding: 8px;"></alps-icon-btn>
                  <button class="dropdown-item" @click=${(e: Event) => {
              const popup = (e.target as HTMLElement).closest('alps-popup') as any;
              if (popup) popup.close();
              this.parentForNewFolder = node.fullName;
              this.showCreatePrompt = true;
            }}>
                    ${renderIcon('folderPlus')} <span class="item-text">${this.i18nStore?.t('folderList.createSubfolder')}</span>
                  </button>
                  <button class="dropdown-item" @click=${(e: Event) => {
              const popup = (e.target as HTMLElement).closest('alps-popup') as any;
              if (popup) popup.close();
              this.mailboxToRename = node.fullName;
              this.showRenamePrompt = true;
            }}>
                    ${renderIcon('pen')} <span class="item-text">${this.i18nStore?.t('folderList.rename')}</span>
                  </button>
                  <button class="dropdown-item" @click=${(e: Event) => {
              const popup = (e.target as HTMLElement).closest('alps-popup') as any;
              if (popup) popup.close();
              // The answer used to be discarded: a refused (un)subscribe changed nothing
              // on screen and said nothing. Quiet on `auth`, which the shell answers.
              const subscribing = !node.mb?.Subscribed;
              void mailboxOperations.setSubscribed(node.fullName, subscribing).then(result => {
                if (result.ok) this.subscriptionChanged(node.fullName, subscribing);
                if (result.ok || result.reason === 'auth') return;
                if (subscribing) this.toast(this.i18nStore?.t('toast.subscribeFailed'), 'Could not subscribe');
                else this.toast(this.i18nStore?.t('toast.unsubscribeFailed'), 'Could not unsubscribe');
              });
            }}>
                    ${renderIcon(node.mb?.Subscribed ? 'eyeSlash' : 'eye')} <span class="item-text">${node.mb?.Subscribed ? this.i18nStore?.t('folderList.unsubscribe') : this.i18nStore?.t('folderList.subscribe')}</span>
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
                    @click=${(e: Event) => e.stopPropagation()}
                    @popup-open=${(e: Event) => e.stopPropagation()}
                    @popup-close=${(e: Event) => e.stopPropagation()}
                  >
                    <button slot="trigger" class="dropdown-item submenu-trigger">
                      <div class="trigger-label">
                        ${renderIcon('sortAscending')} <span class="item-text">${this.i18nStore?.t('folderList.order')}</span>
                      </div>
                      <div class="caret-icon">${renderIcon('caretRight')}</div>
                    </button>
                    
                    <button class="dropdown-item" ?disabled=${isFirst} @click=${(e: Event) => {
              const popup = (e.target as HTMLElement).closest('alps-popup') as any;
              if (popup) popup.close();

              const parentPopup = (e.target as HTMLElement).closest('.folder-actions')?.querySelector('alps-popup') as any;
              if (parentPopup) parentPopup.close();

              this.moveFolder(node.fullName, 'top');
            }}>
                      ${renderIcon('caretDoubleUp')} <span class="item-text">${this.i18nStore?.t('folderList.moveToTop')}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${isFirst} @click=${(e: Event) => {
              const popup = (e.target as HTMLElement).closest('alps-popup') as any;
              if (popup) popup.close();

              const parentPopup = (e.target as HTMLElement).closest('.folder-actions')?.querySelector('alps-popup') as any;
              if (parentPopup) parentPopup.close();

              this.moveFolder(node.fullName, 'up');
            }}>
                      ${renderIcon('caretUp')} <span class="item-text">${this.i18nStore?.t('folderList.moveUp')}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${isLast} @click=${(e: Event) => {
              const popup = (e.target as HTMLElement).closest('alps-popup') as any;
              if (popup) popup.close();

              const parentPopup = (e.target as HTMLElement).closest('.folder-actions')?.querySelector('alps-popup') as any;
              if (parentPopup) parentPopup.close();

              this.moveFolder(node.fullName, 'down');
            }}>
                      ${renderIcon('caretDown')} <span class="item-text">${this.i18nStore?.t('folderList.moveDown')}</span>
                    </button>
                    <button class="dropdown-item" ?disabled=${isLast} @click=${(e: Event) => {
              const popup = (e.target as HTMLElement).closest('alps-popup') as any;
              if (popup) popup.close();

              const parentPopup = (e.target as HTMLElement).closest('.folder-actions')?.querySelector('alps-popup') as any;
              if (parentPopup) parentPopup.close();

              this.moveFolder(node.fullName, 'bottom');
            }}>
                      ${renderIcon('caretDoubleDown')} <span class="item-text">${this.i18nStore?.t('folderList.moveToBottom')}</span>
                    </button>
                  </alps-popup>


                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item" @click=${(e: Event) => {
              const popup = (e.target as HTMLElement).closest('alps-popup') as any;
              if (popup) popup.close();
              this.mailboxToDelete = node.fullName;
              // Trash itself, or a folder already inside it, is deleted outright; any
              // other folder is offered move-to-trash. See issue #4.
              //
              // By role and by real location, never by a name prefix. The prefix ran
              // even when the server named its own Trash, so a user's "Trash receipts"
              // or "Trashcan" was treated as Trash: Delete offered only permanent
              // deletion, never the move. It also stood in for "inside Trash", which
              // the resolved Trash name and the server's delimiter answer exactly.
              const trashName = findMailboxNameByRole('trash', this.mailboxes, FOLDER_TRASH);
              if (mailboxRoleByName(node.fullName, this.mailboxes) === 'trash'
                || isSelfOrDescendantMailbox(node.fullName, trashName, delimiterOf(node.mb))) {
                this.showDeleteConfirm = true;
              } else {
                this.showMoveToTrashConfirm = true;
              }
            }}>
                    ${renderIcon('trash')} <span class="item-text">${this.i18nStore?.t('folderList.delete')}</span>
                  </button>
                </alps-popup>
              </div>
            ` : ''}

            ${unseenCount > 0 ? html`<div class="folder-badge">${unseenCount}</div>` : ''}
          </div>
          
          ${hasChildren && isExpanded ? html`
            <div class="folder-children">
              ${renderTree(Object.values(node.children).sort((a, b) => {
              const idxA = customOrder.indexOf(a.fullName);
              const idxB = customOrder.indexOf(b.fullName);
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              if (idxA !== -1) return -1;
              if (idxB !== -1) return 1;
              return a.name.localeCompare(b.name);
            }), depth + 1)}
            </div>
          ` : ''}
        `;
      });
    };

    return html`
      <div class="sidebar-wrapper ${this.collapsed ? 'collapsed' : ''}">
        <alps-toolbar class="sidebar-header" ?scrolled=${this.isScrolled}>
          <alps-create-button 
            icon="pen"
            ?disabled=${(this.composeStore?.getState()?.activeComposers?.length || 0) >= 3}
            title=${this.i18nStore?.t('folderList.compose')}
            ?collapsed=${this.hasAttribute('collapsed')}
            @click=${() => this.dispatchEvent(new CustomEvent('compose'))}
          >${this.i18nStore?.t('folderList.compose')}</alps-create-button>
        </alps-toolbar>
        <!-- Inert in the strip, not only dimmed. sidebarLayoutStyles gives the
             dimmed content pointer-events: none, which keeps the mouse out;
             inert keeps the keyboard out too, so Tab cannot walk into folder
             carets clipped past the strip's edge. Compose, above, stays live. -->
        <div class="sidebar-content" ?inert=${this.collapsed} @scroll=${this.handleScroll}>
          <div class="sidebar-scroll-content">
            ${renderTree(standardNodes)}
            ${standardNodes.length > 0 && customNodes.length > 0 ? html`
              <div class="folder-separator"></div>
            ` : ''}
            <div class="sidebar-header-title">
              <span>${this.i18nStore?.t('folderList.title')}</span>
            </div>
            ${renderTree(subscribedNodes)}
            ${unsubscribedNodes.length > 0 ? html`
              <button
                type="button"
                class="folder-item more-row"
                aria-expanded=${unsubscribedOpen ? 'true' : 'false'}
                title=${this.i18nStore?.t('folderList.unsubscribedFolders')}
                @click=${() => { this.showUnsubscribed = !unsubscribedOpen; }}
              >
                <div class="more-caret">${renderIcon(unsubscribedOpen ? 'caretDown' : 'caretRight')}</div>
                <div class="folder-icon icon-default">${renderIcon('eyeSlash')}</div>
                <div class="folder-name">${unsubscribedOpen ? this.i18nStore?.t('folderList.less') : this.i18nStore?.t('folderList.more')}</div>
              </button>
              ${unsubscribedOpen ? renderTree(unsubscribedNodes) : ''}
            ` : ''}
          </div>
        </div>
      </div>

      ${this.showCreatePrompt ? html`
        <ui-prompt
          title=${this.parentForNewFolder ?
          this.i18nStore?.t('folderList.createSubfolderUnder', { folder: this.parentForNewFolder }) :
          this.i18nStore?.t('folderList.createFolder')}
          confirmText=${this.i18nStore?.t('folderList.createFolder')}
          .busy=${this.promptBusy}
          .fields=${[{ id: 'name', label: this.i18nStore?.t('folderList.folderName') || 'Folder name', autofocus: true }]}
          @submit=${this.handleCreateSubmit}
          @cancel=${() => {
          this.showCreatePrompt = false;
          this.parentForNewFolder = '';
        }}
        ></ui-prompt>
      ` : ''}

      ${this.showRenamePrompt ? html`
        <ui-prompt
          title="${this.i18nStore?.t('folderList.renameFolder')}"
          confirmText=${this.i18nStore?.t('folderList.rename')}
          .fields=${[{ id: 'name', label: this.i18nStore?.t('folderList.folderName') || 'Folder name', autofocus: true, value: this.mailboxToRename }]}
          @submit=${this.handleRenameSubmit}
          @cancel=${() => this.showRenamePrompt = false}
        ></ui-prompt>
      ` : ''}

      ${this.showMoveToTrashConfirm ? html`
        <ui-confirm
          title=${this.i18nStore?.t('folderList.moveToTrash')}
          message=${this.i18nStore?.t('folderList.moveToTrashConfirm', { folder: this.mailboxToDelete })}
          confirmText=${this.i18nStore?.t('folderList.moveToTrash')}
          isDanger=${false}
          @confirm=${this.handleMoveToTrashConfirm}
          @cancel=${() => this.showMoveToTrashConfirm = false}
        ></ui-confirm>
      ` : ''}

      ${this.showDeleteConfirm ? html`
        <ui-confirm
          title="${this.i18nStore?.t('folderList.deleteFolder')}"
          message=${this.i18nStore?.t('folderList.deleteFolderConfirm', { folder: this.mailboxToDelete })}
          confirmText=${this.i18nStore?.t('folderList.delete')}
          isDanger=${true}
          @confirm=${this.handleDeleteConfirm}
          @cancel=${() => this.showDeleteConfirm = false}
        ></ui-confirm>
      ` : ''}
    `;
  }
}
