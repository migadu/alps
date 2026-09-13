import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { renderIcon } from '../utils/ui';
import { composeContext } from '../store/compose-store';
import type { ComposeStore } from '../store/compose-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { mailboxOperations } from '../services/mailbox-operations';
import { FOLDER_INBOX, FOLDER_DRAFTS, FOLDER_SENT, FOLDER_ARCHIVE, FOLDER_ARCHIVES, FOLDER_SPAM, FOLDER_JUNK, FOLDER_TRASH, mailboxRoleByName, findMailboxNameByRole, isSelfOrDescendantMailbox } from '../utils/folders';
import { settingsContext, SettingsStore } from '../store/settings-store';
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
  private primaryFullNames = new Set<string>();

  willUpdate(changedProperties: Map<string, any>) {
    super.willUpdate(changedProperties);
  }



  connectedCallback() {
    super.connectedCallback();
    // Use setTimeout or a small delay if composeStore is injected slightly later
    // Actually, context is provided synchronously down the tree.
    // Wait until next tick to ensure context is resolved.
    this.updateComplete.then(() => {
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
        let delimiter = '.';
        if (parentMb) {
          const delim = parentMb.Delimiter || parentMb.Delim;
          delimiter = typeof delim === 'number' ? String.fromCharCode(delim) : (delim || '.');
        }
        name = `${this.parentForNewFolder}${delimiter}${name}`;

        this.dispatchEvent(new CustomEvent('expand-folder', {
          detail: { folderName: this.parentForNewFolder }
        }));
      }
      // The result was discarded entirely: creating a folder that already
      // exists, or any server refusal, closed the prompt and said nothing.
      const outcome = await mailboxOperations.createMailbox(name);
      if (outcome === 'exists') {
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
        if (isSelfOrDescendantMailbox(this.currentMailbox, oldName)) {
          this.selectMailbox(newName + this.currentMailbox.slice(oldName.length));
        }

        const undoFn = async () => {
          const undone = await mailboxOperations.renameMailbox(newName, oldName);
          if (undone !== 'ok') {
            this.toast(this.i18nStore?.t('toast.folderUndoFailed'), 'Could not undo that', { type: 'error' });
            return;
          }
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
      const success = await mailboxOperations.deleteMailbox(this.mailboxToDelete);
      if (success) {
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
      let delimiter = '.';
      if (mb) {
        const delim = mb.Delimiter || mb.Delim;
        delimiter = typeof delim === 'number' ? String.fromCharCode(delim) : (delim || '.');
      }

      const parts = this.mailboxToDelete.split(delimiter);
      const leafName = parts[parts.length - 1];

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
    const delim = mb?.Delimiter || mb?.Delim;
    const delimiter = typeof delim === 'number' ? String.fromCharCode(delim) : (delim || '.');
    const parts = folderName.split(delimiter);
    const parentPath = parts.slice(0, -1).join(delimiter);

    const siblings = this.mailboxes
      .map(m => m.Name || m.Mailbox || '')
      .filter(name => {
        if (this.primaryFullNames.has(name)) return false;
        const sParts = name.split(delimiter);
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


  render() {
    // A special-mailbox "slot" can be claimed by an IMAP special-use attribute
    // (authoritative) or, as a fallback, by a well-known name. Several names map
    // to the same slot (Archive/Archives, Spam/Junk); each slot is collapsed to a
    // single primary entry below so the same special mailbox is never shown twice.
    const specialSlots: { attr: string; names: string[]; display: { icon: string; colorClass: string; label: string } }[] = [
      { attr: '\\inbox', names: [FOLDER_INBOX], display: { icon: 'tray', colorClass: 'icon-inbox', label: this.i18nStore?.t('folderList.inbox') } },
      { attr: '\\drafts', names: [FOLDER_DRAFTS], display: { icon: 'fileText', colorClass: 'icon-drafts', label: this.i18nStore?.t('folderList.drafts') } },
      { attr: '\\sent', names: [FOLDER_SENT], display: { icon: 'paperPlaneTilt', colorClass: 'icon-sent', label: this.i18nStore?.t('folderList.sent') } },
      { attr: '\\archive', names: [FOLDER_ARCHIVE, FOLDER_ARCHIVES], display: { icon: 'archiveBox', colorClass: 'icon-archive', label: this.i18nStore?.t('folderList.archive') } },
      { attr: '\\junk', names: [FOLDER_JUNK, FOLDER_SPAM], display: { icon: 'warningDiamond', colorClass: 'icon-spam', label: this.i18nStore?.t('folderList.junk') } },
      { attr: '\\trash', names: [FOLDER_TRASH], display: { icon: 'trash', colorClass: 'icon-trash', label: this.i18nStore?.t('folderList.trash') } },
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
    const root: Record<string, TreeNode> = {};

    this.mailboxes.forEach(mb => {
      const fullName = mb.Name || mb.Mailbox || '';
      const delim = mb.Delimiter || mb.Delim;
      const delimiter = typeof delim === 'number' ? String.fromCharCode(delim) : (delim || '.');
      const parts = fullName.split(delimiter);

      let currentLevel = root;
      let pathAcc = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        pathAcc = i === 0 ? part : pathAcc + delimiter + part;

        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            fullName: pathAcc,
            children: {}
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
    // Tolerate both single- (\Sent) and double-escaped (\\Sent) attribute forms.
    const hasSlotAttr = (node: TreeNode, attr: string): boolean => {
      const attrs = normalizedAttrs(node);
      return attrs.includes(attr) || attrs.includes('\\' + attr);
    };
    const slotIndexForNode = (node: TreeNode): number => {
      const attrs = normalizedAttrs(node);
      // Special-use attribute is authoritative.
      for (let i = 0; i < specialSlots.length; i++) {
        const s = specialSlots[i];
        if (attrs.includes(s.attr) || attrs.includes('\\' + s.attr)) return i;
      }
      // Name fallback only for real, selectable mailboxes — never for synthetic
      // parents (e.g. "Archives" when only "Archives/2025" exists) or \Noselect
      // placeholders, which must not masquerade as a primary special mailbox.
      const selectable = !!node.mb && !attrs.includes('\\noselect') && !attrs.includes('\\nonexistent');
      if (selectable) {
        for (let i = 0; i < specialSlots.length; i++) {
          if (specialSlots[i].names.includes(node.name)) return i;
        }
      }
      return -1;
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
      // special-use attribute, else the higher-priority name. The loser is
      // demoted to a regular folder rather than duplicating the primary.
      const slotDef = specialSlots[idx];
      const nodeAttr = hasSlotAttr(node, slotDef.attr);
      const existingAttr = hasSlotAttr(existing, slotDef.attr);
      const nodeRank = slotDef.names.indexOf(node.name);
      const existingRank = slotDef.names.indexOf(existing.name);
      const nodeWins =
        (nodeAttr && !existingAttr) ||
        (nodeAttr === existingAttr &&
          nodeRank !== -1 &&
          (existingRank === -1 || nodeRank < existingRank));
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
      node.primary = stdMap[node.name] || specialSlots[i].display;
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

    const renderTree = (nodes: TreeNode[], depth: number = 0): TemplateResult[] => {
      return nodes.map(node => {
        const hasChildren = Object.keys(node.children).length > 0;
        const isExpanded = this.expandedFolders.has(node.fullName);
        const isActive = this.currentMailbox === node.fullName;
        const hasActions = depth > 0 || !node.primary;

        let isFirst = false;
        let isLast = false;
        if (hasActions) {
          const delim = node.mb?.Delimiter || node.mb?.Delim;
          const delimiter = typeof delim === 'number' ? String.fromCharCode(delim) : (delim || '.');
          const parts = node.fullName.split(delimiter);
          const parentPath = parts.slice(0, -1).join(delimiter);

          const siblings = this.mailboxes
            .map(m => m.Name || m.Mailbox || '')
            .filter(name => {
              if (this.primaryFullNames.has(name)) return false;
              const sParts = name.split(delimiter);
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
            class="folder-item ${isActive ? 'active' : ''} ${isNoSelect ? 'no-select' : ''} ${hasActions ? 'has-actions' : ''}"
            title=${label}
            @click=${handleClick}
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
                || isSelfOrDescendantMailbox(node.fullName, trashName, node.mb?.Delimiter || node.mb?.Delim)) {
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
        <div class="sidebar-content" @scroll=${this.handleScroll}>
          <div class="sidebar-scroll-content">
            ${renderTree(standardNodes)}
            ${standardNodes.length > 0 && customNodes.length > 0 ? html`
              <div class="folder-separator"></div>
            ` : ''}
            <div class="sidebar-header-title">
              <span>${this.i18nStore?.t('folderList.title')}</span>
            </div>
            ${renderTree(customNodes)}
          </div>
        </div>
      </div>

      ${this.showCreatePrompt ? html`
        <ui-prompt
          title=${this.parentForNewFolder ?
          (this.i18nStore?.t('folderList.createSubfolderUnder')?.replace('{folder}', this.parentForNewFolder)) :
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
          message=${this.i18nStore?.t('folderList.moveToTrashConfirm')?.replace('{folder}', this.mailboxToDelete)}
          confirmText=${this.i18nStore?.t('folderList.moveToTrash')}
          isDanger=${false}
          @confirm=${this.handleMoveToTrashConfirm}
          @cancel=${() => this.showMoveToTrashConfirm = false}
        ></ui-confirm>
      ` : ''}

      ${this.showDeleteConfirm ? html`
        <ui-confirm
          title="${this.i18nStore?.t('folderList.deleteFolder')}"
          message=${this.i18nStore?.t('folderList.deleteFolderConfirm')?.replace('{folder}', this.mailboxToDelete)}
          confirmText=${this.i18nStore?.t('folderList.delete')}
          isDanger=${true}
          @confirm=${this.handleDeleteConfirm}
          @cancel=${() => this.showDeleteConfirm = false}
        ></ui-confirm>
      ` : ''}
    `;
  }
}
