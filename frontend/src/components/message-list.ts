import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { formatDateList, formatSize, getMailboxLabel, renderIcon, getBimiAvatarUrl } from '../utils/ui';
import { FLAG_SEEN, FLAG_FLAGGED, FLAG_ANSWERED, FLAG_FORWARDED, getMessageTags } from '../utils/flags';
import { FOLDER_DRAFTS, FOLDER_SENT } from '../utils/folders';
import { messageSync } from '../services/message-sync';
import { mailboxOperations } from '../services/mailbox-operations';
import { consume } from '@lit/context';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import './alps-avatar';
import './alps-tag';
import './alps-pagination';
import './alps-icon-btn';
import './alps-toolbar';
import './alps-banner';
import './ui-confirm';
import './alps-loader';
import { repeat } from 'lit/directives/repeat.js';

@customElement('alps-message-list')
export class MessageList extends LitElement {
  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @property({ type: Array }) messages: any[] = [];
  @property({ type: String }) currentMailbox = '';
  // Special-use role of the current mailbox ('drafts'|'sent'|...), resolved by the
  // parent from IMAP attributes so Gmail's "[Gmail]/Sent Mail" etc. are recognized.
  @property({ type: String }) currentMailboxRole = '';
  @property({ type: Boolean }) loading = false;
  @property({ type: Object }) selectedMessage: any = null;
  @property({ type: String }) layoutMode = 'vertical';
  @property({ type: Boolean }) isMobile = false;
  @property({ type: Boolean }) sidebarCollapsed = false;
  @property({ type: Number }) currentPage = 0;
  @property({ type: Number }) totalMessages = 0;
  @property({ type: Number }) messagesPerPage = 50;
  @property({ type: String }) filterQuery = '';
  @property({ type: String }) sortOrder = 'desc';

  @property({ type: String }) densityMode: 'loose' | 'normal' | 'compact' | 'ultra-compact' = 'compact';

  @property({ type: Object }) selectedMessages = new Set<string>();
  @property({ type: Boolean }) syncing = false;
  @state() private isSpinning = false;
  @state() private isScrolled = false;
  @state() private isAtBottom = false;
  @state() private focusedIndex = -1;
  @state() private showEmptyConfirm = false;
  @state() private expandedThreads = new Set<string>();
  private _shouldScrollToTop = false;

  static styles = css`
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

    alps-pagination {
      flex: 1;
      min-width: 0;
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
  `;

  private get visibleMessages(): any[] {
    const list: any[] = [];
    for (const msg of this.messages || []) {
      list.push(msg);
      if (msg.SubMessages && msg.SubMessages.length > 0 && this.isThreadExpanded(String(msg.UID))) {
        list.push(...msg.SubMessages);
      }
    }
    return list;
  }

  private isThreadExpanded(uid: string): boolean {
    return this.expandedThreads.has(uid);
  }

  private toggleThreadCollapse(e: Event, uid: string) {
    e.stopPropagation();
    const newSet = new Set(this.expandedThreads);
    if (newSet.has(uid)) {
      newSet.delete(uid);
    } else {
      newSet.add(uid);
    }
    this.expandedThreads = newSet;
  }

  private handleSelectAll(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    if (checked) {
      const uids = this.visibleMessages.map(m => String(m.UID));
      this.selectedMessages = new Set(uids);
    } else {
      this.selectedMessages = new Set();
    }
    this.dispatchEvent(new CustomEvent('selection-changed', { detail: { selectedUids: this.selectedMessages } }));
  }

  private handleSelectMessage(e: Event, uid: string) {
    e.stopPropagation(); // prevent clicking the message row
    const checked = (e.target as HTMLInputElement).checked;
    const newSet = new Set(this.selectedMessages);
    if (checked) {
      newSet.add(uid);
    } else {
      newSet.delete(uid);
    }
    this.selectedMessages = newSet;
    this.dispatchEvent(new CustomEvent('selection-changed', { detail: { selectedUids: this.selectedMessages } }));
  }



  connectedCallback() {
    super.connectedCallback();
    messageSync.addEventListener('sync-start', this.handleSyncStart);
    messageSync.addEventListener('sync-success', this.handleSyncEnd);
    messageSync.addEventListener('sync-error', this.handleSyncEnd);
    this.updateComplete.then(() => {
      this.i18nStore?.addEventListener('change', this._handleStoreChange);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    messageSync.removeEventListener('sync-start', this.handleSyncStart);
    messageSync.removeEventListener('sync-success', this.handleSyncEnd);
    messageSync.removeEventListener('sync-error', this.handleSyncEnd);
    this.i18nStore?.removeEventListener('change', this._handleStoreChange);
  }

  private _handleStoreChange = () => {
    this.requestUpdate();
  };

  private handleSyncStart = () => {
    this.syncing = true;
    this.isSpinning = true;
  };

  private handleSyncEnd = () => {
    this.syncing = false;
  };

  willUpdate(changedProperties: Map<string, any>) {
    super.willUpdate(changedProperties);
    if (changedProperties.has('currentMailbox') ||
      changedProperties.has('currentPage') ||
      changedProperties.has('filterQuery') ||
      changedProperties.has('sortOrder')) {
      if (this.selectedMessages.size > 0) {
        this.selectedMessages = new Set();
        this.dispatchEvent(new CustomEvent('selection-changed', { detail: { selectedUids: this.selectedMessages } }));
      }
      this._shouldScrollToTop = true;
    }

    if (changedProperties.has('selectedMessage') || changedProperties.has('messages')) {
      if (changedProperties.has('messages') && this.messages) {
        if (this.selectedMessages.size > 0) {
          const availableUids = new Set<string>();
          for (const m of this.messages) {
            availableUids.add(String(m.UID));
            if (m.SubMessages) {
              for (const sub of m.SubMessages) {
                availableUids.add(String(sub.UID));
              }
            }
          }
          let changed = false;
          const newSet = new Set<string>();
          for (const uid of this.selectedMessages) {
            if (availableUids.has(uid)) {
              newSet.add(uid);
            } else {
              changed = true;
            }
          }
          if (changed) {
            this.selectedMessages = newSet;
            this.dispatchEvent(new CustomEvent('selection-changed', { detail: { selectedUids: this.selectedMessages } }));
          }
        }
      }

      if (this.selectedMessage) {
        if (this.messages) {
          let expandedChanged = false;
          const newSet = new Set(this.expandedThreads);
          for (const m of this.messages) {
            if (m.SubMessages && m.SubMessages.some((s: any) => String(s.UID) === String(this.selectedMessage.UID))) {
              const uid = String(m.UID);
              if (!newSet.has(uid)) {
                newSet.add(uid);
                expandedChanged = true;
              }
            }
          }
          if (expandedChanged) {
            this.expandedThreads = newSet;
          }
        }

        const visible = this.visibleMessages;
        if (visible.length > 0) {
          const idx = visible.findIndex(m => String(m.UID) === String(this.selectedMessage.UID));
          if (idx !== -1) {
            this.focusedIndex = idx;
          }
        }
      }
    }
  }

  private handleSpinIteration = () => {
    if (!this.syncing) {
      this.isSpinning = false;
    }
  };

  private checkScrollState(target: HTMLElement) {
    if (!target) return;
    const scrolled = target.scrollTop > 0;
    if (this.isScrolled !== scrolled) {
      this.isScrolled = scrolled;
      this.dispatchEvent(new CustomEvent('list-scrolled', { detail: { scrolled } }));
    }

    const atBottom = target.scrollHeight <= target.clientHeight || Math.ceil(target.scrollTop + target.clientHeight) >= target.scrollHeight;
    if (this.isAtBottom !== atBottom) {
      this.isAtBottom = atBottom;
    }
  }

  private handleScroll = (e: Event) => {
    this.checkScrollState(e.target as HTMLElement);
  };

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    if (changedProperties.has('densityMode')) {
      this.classList.remove('density-loose', 'density-normal', 'density-compact', 'density-ultra-compact');
      this.classList.add(`density-${this.densityMode}`);
    }
    if (changedProperties.has('syncing') && this.syncing) {
      this.isSpinning = true;
    }
    if (changedProperties.has('selectedMessage') && this.selectedMessage) {
      setTimeout(() => {
        const listContent = this.renderRoot.querySelector('.list-content');
        const activeItem = listContent?.querySelector('.message-item.active');
        if (activeItem) {
          activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
    if (this._shouldScrollToTop && (changedProperties.has('messages') || (changedProperties.has('loading') && !this.loading))) {
      const listContent = this.renderRoot.querySelector('.list-content');
      if (listContent) {
        listContent.scrollTop = 0;
      }
      this._shouldScrollToTop = false;
    }
    const listContent = this.renderRoot.querySelector('.list-content') as HTMLElement;
    if (listContent) {
      requestAnimationFrame(() => {
        this.checkScrollState(listContent);
      });
    }
  }

  private selectMessage(msg: any) {
    if (this.selectedMessages.size > 0) {
      this.selectedMessages = new Set();
      this.dispatchEvent(new CustomEvent('selection-changed', { detail: { selectedUids: this.selectedMessages } }));
    }
    this.dispatchEvent(new CustomEvent('select-message', {
      detail: { message: msg }
    }));
  }

  private handleKeyDown(e: KeyboardEvent) {
    const visible = this.visibleMessages;
    if (!visible || visible.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.focusedIndex = Math.min(visible.length - 1, this.focusedIndex + 1);
      this.scrollToFocused();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.focusedIndex = Math.max(0, this.focusedIndex - 1);
      this.scrollToFocused();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.focusedIndex >= 0 && this.focusedIndex < visible.length) {
        this.selectMessage(visible[this.focusedIndex]);
      }
    } else if (e.key === ' ') {
      e.preventDefault();
      if (this.focusedIndex >= 0 && this.focusedIndex < visible.length) {
        const msg = visible[this.focusedIndex];
        const uid = String(msg.UID);
        const newSet = new Set(this.selectedMessages);
        if (newSet.has(uid)) {
          newSet.delete(uid);
        } else {
          newSet.add(uid);
        }
        this.selectedMessages = newSet;
        this.dispatchEvent(new CustomEvent('selection-changed', { detail: { selectedUids: this.selectedMessages } }));

        this.focusedIndex = Math.min(visible.length - 1, this.focusedIndex + 1);
        this.scrollToFocused();
      }
    }
  }

  private async handleEmptyMailbox() {
    this.showEmptyConfirm = false;
    this.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'info', message: this.i18nStore?.t('messageList.emptyingMailbox') || 'Emptying mailbox...' },
      bubbles: true,
      composed: true
    }));

    const success = await mailboxOperations.emptyMailbox(this.currentMailbox);
    if (success) {
      this.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', message: this.i18nStore?.t('messageList.mailboxEmptied') || 'Mailbox emptied successfully.' },
        bubbles: true,
        composed: true
      }));
    } else {
      this.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'error', message: this.i18nStore?.t('messageList.emptyMailboxFailed') || 'Failed to empty mailbox. Make sure it is Trash or Junk.' },
        bubbles: true,
        composed: true
      }));
    }
  }

  private scrollToFocused() {
    this.updateComplete.then(() => {
      const el = this.renderRoot.querySelector('.message-item.focused') as HTMLElement;
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  private renderMessageItem(msg: any, isSubMessage: boolean = false, isFirstSub: boolean = false, isLastSub: boolean = false) {
    const isDraftOrSent = this.currentMailboxRole === 'drafts' || this.currentMailboxRole === 'sent'
      || this.currentMailbox === FOLDER_DRAFTS || this.currentMailbox === FOLDER_SENT;

    let rawContacts: any[] = [];
    if (isDraftOrSent) {
      rawContacts = [...(msg.Envelope?.To || []), ...(msg.Envelope?.Cc || [])];
      if (!rawContacts.length) rawContacts = msg.Envelope?.From || [];
    } else {
      rawContacts = [...(msg.Envelope?.From || []), ...(msg.Envelope?.To || []), ...(msg.Envelope?.Cc || [])];
    }

    const seenEmails = new Set<string>();
    let allContacts: any[] = [];
    for (const c of rawContacts) {
      const email = c.Mailbox && c.Host ? `${c.Mailbox}@${c.Host}`.toLowerCase() : '';
      const key = email || c.Name || 'unknown';
      if (key !== 'unknown' && !seenEmails.has(key)) {
        seenEmails.add(key);
        allContacts.push(c);
      } else if (key === 'unknown') {
        allContacts.push(c);
      }
    }

    const loginUser = this.settingsStore?.getState()?.loginUsername?.toLowerCase() || '';

    const isSelf = (c: any) => {
      const email = c.Mailbox && c.Host ? `${c.Mailbox}@${c.Host}`.toLowerCase() : '';
      if (loginUser && email === loginUser) return true;
      return false;
    };

    if (allContacts.length > 1) {
      const filtered = allContacts.filter(c => !isSelf(c));
      if (filtered.length > 0) {
        allContacts = filtered;
      }
    }

    if (!allContacts.length) allContacts = [{}];

    const fallbackKey = isDraftOrSent ? 'messageList.noRecipient' : 'messageList.unknownSender';

    const displayNames = allContacts.map(c => {
      const addr = c.Mailbox && c.Host ? `${c.Mailbox}@${c.Host}` : '';
      return c.Name || addr || (this.i18nStore?.t(fallbackKey)) || this.i18nStore?.t('messageList.unknown');
    });
    const senderName = displayNames.join(', ');

    const maxAvatars = this.isMobile ? 1 : 3;
    const displayAvatars = allContacts.slice(0, maxAvatars);
    const extraCount = allContacts.length - maxAvatars;
    const totalRendered = displayAvatars.length + (extraCount > 0 ? 1 : 0);

    const subject = msg.Envelope?.Subject || (this.i18nStore?.t('messageList.noSubject'));
    const dateFormat = this.settingsStore?.getState()?.dateFormat || 'YYYY-MM-DD';
    const hourFormat = String(this.settingsStore?.getState()?.hourFormat || '12');
    const dateStr = msg.Envelope?.Date ? formatDateList(msg.Envelope.Date, dateFormat, hourFormat) : '';
    const msgSize = msg.RFC822Size || msg.Size;
    const sizeStr = msgSize ? formatSize(msgSize) : '';

    const isUnseen = !msg.Flags || !msg.Flags.includes(FLAG_SEEN);
    const isStarred = msg.Flags && msg.Flags.includes(FLAG_FLAGGED);
    const isAnswered = msg.Flags && msg.Flags.includes(FLAG_ANSWERED);
    const isForwarded = msg.Flags && msg.Flags.includes(FLAG_FORWARDED);

    const customTags = getMessageTags(msg.Flags, this.i18nStore);
    const avatarSize = this.densityMode === 'loose' ? 48 : this.densityMode === 'compact' ? 24 : 40;

    const hasSubMessages = msg.SubMessages && msg.SubMessages.length > 0;
    const expanded = this.isThreadExpanded(String(msg.UID));

    if (this.densityMode === 'ultra-compact') {
      return html`
      <div class="message-item ${isSubMessage ? 'sub-message-item' : ''} ${isFirstSub ? 'first-sub-item' : ''} ${isLastSub ? 'last-sub-item' : ''} ${(this.selectedMessages.size === 0 && this.selectedMessage?.UID === msg.UID) || this.selectedMessages.has(String(msg.UID)) ? 'active' : ''} ${isUnseen ? 'unread' : ''} ${isStarred ? 'starred' : ''} ${this.focusedIndex === this.visibleMessages.indexOf(msg) ? 'focused' : ''}" @click=${() => this.selectMessage(msg)}>
        <div class="checkbox-col" @click=${(e: Event) => {
          e.stopPropagation();
          const uid = String(msg.UID);
          const newSet = new Set(this.selectedMessages);
          if (newSet.has(uid)) newSet.delete(uid);
          else newSet.add(uid);
          this.selectedMessages = newSet;
          this.dispatchEvent(new CustomEvent('selection-changed', { detail: { selectedUids: this.selectedMessages } }));
        }}>
          <input type="checkbox" class="message-checkbox" 
            .checked=${this.selectedMessages.has(String(msg.UID))}
            @click=${(e: Event) => e.stopPropagation()}
            @change=${(e: Event) => this.handleSelectMessage(e, String(msg.UID))}>
        </div>

        <!-- Caret Toggle Button -->
        ${!isSubMessage && hasSubMessages ? html`
          <div class="caret-col" @click=${(e: Event) => this.toggleThreadCollapse(e, String(msg.UID))}>
            ${renderIcon(expanded ? 'caretDown' : 'caretRight')}
            <span class="thread-count-caret-badge" title="${msg.ThreadCount} messages">${msg.ThreadCount}</span>
          </div>
        ` : isSubMessage ? html`<div class="caret-col empty"></div>` : ''}

        <div class="message-sender">${senderName}</div>
        <div @click=${(e: Event) => this.toggleStar(e, msg)} class="star-btn ${isStarred ? 'starred' : ''} star-btn-wrapper-ultra">
          ${renderIcon(isStarred ? 'starFourFill' : 'starFour')}
        </div>
        ${isAnswered || isForwarded ? html`
          <div class="indicators-wrapper-ultra">
            ${isAnswered ? html`<div class="indicator-icon" title=${this.i18nStore?.t('messageList.replied')}>${renderIcon('arrowBendUpLeft')}</div>` : ''}
            ${isForwarded ? html`<div class="indicator-icon" title=${this.i18nStore?.t('messageList.forwarded')}>${renderIcon('arrowBendUpRight')}</div>` : ''}
          </div>
        ` : ''}
        ${customTags.length > 0 ? html`
          <div class="tag-pills">
            ${customTags.map(tag => html`
              <alps-tag .name=${tag.name} .color=${tag.color}></alps-tag>
            `)}
          </div>
        ` : ''}
        ${this.currentMailbox === '*' && msg.Mailbox ? html`
          <span class="mailbox-badge" title="Folder: ${msg.Mailbox}">${msg.Mailbox}</span>
        ` : ''}
        <div class="message-subject">
          ${subject}
        </div>
        <div class="message-indicators">
          <div class="attachment-col">
            ${msg.HasAttachments ? html`<div class="indicator-icon" title=${this.i18nStore?.t('messageList.hasAttachments')}>${renderIcon('paperclipHorizontal')}</div>` : ''}
          </div>
          <div class="message-date">${dateStr}</div>
        </div>
      </div>
      `;
    }

    return html`
    <div class="message-item ${isSubMessage ? 'sub-message-item' : ''} ${isFirstSub ? 'first-sub-item' : ''} ${isLastSub ? 'last-sub-item' : ''} ${(this.selectedMessages.size === 0 && this.selectedMessage?.UID === msg.UID) || this.selectedMessages.has(String(msg.UID)) ? 'active' : ''} ${isUnseen ? 'unread' : ''} ${isStarred ? 'starred' : ''} ${this.focusedIndex === this.visibleMessages.indexOf(msg) ? 'focused' : ''}" @click=${() => this.selectMessage(msg)}>
      <div class="checkbox-col" @click=${(e: Event) => {
        e.stopPropagation();
        const uid = String(msg.UID);
        const newSet = new Set(this.selectedMessages);
        if (newSet.has(uid)) newSet.delete(uid);
        else newSet.add(uid);
        this.selectedMessages = newSet;
        this.dispatchEvent(new CustomEvent('selection-changed', { detail: { selectedUids: this.selectedMessages } }));
      }}>
        <input type="checkbox" class="message-checkbox" 
          .checked=${this.selectedMessages.has(String(msg.UID))}
          @click=${(e: Event) => e.stopPropagation()}
          @change=${(e: Event) => this.handleSelectMessage(e, String(msg.UID))}>
      </div>

      <!-- Caret Toggle Button -->
      ${!isSubMessage && hasSubMessages ? html`
        <div class="caret-col" @click=${(e: Event) => this.toggleThreadCollapse(e, String(msg.UID))}>
          ${renderIcon(expanded ? 'caretDown' : 'caretRight')}
          <span class="thread-count-caret-badge" title="${msg.ThreadCount} messages">${msg.ThreadCount}</span>
        </div>
      ` : isSubMessage ? html`<div class="caret-col empty"></div>` : ''}

      <div class="avatar-stack">
        ${displayAvatars.map((c, idx) => {
          const addr = c.Mailbox && c.Host ? `${c.Mailbox}@${c.Host}` : '';
          const name = c.Name || addr || (this.i18nStore?.t(fallbackKey)) || this.i18nStore?.t('messageList.unknown');
          const domain = c.Host ? c.Host.toLowerCase() : '';
          const bimiUrl = getBimiAvatarUrl(domain);
          return html`
            <div class="avatar-wrapper" style="z-index: ${totalRendered - idx};">
              <alps-avatar .name=${name} .email=${addr} .size=${avatarSize} .src=${bimiUrl}></alps-avatar>
            </div>
          `;
        })}
        ${extraCount > 0 ? html`
          <div class="avatar-wrapper extra-count" style="width: ${avatarSize}px; height: ${avatarSize}px; z-index: 0;">
            +${extraCount}
          </div>
        ` : ''}
      </div>
      <div class="message-details">
        <div class="message-header-row">
          <div class="message-header-inner">
            <div class="message-sender">${senderName}</div>
            <div @click=${(e: Event) => this.toggleStar(e, msg)} class="star-btn ${isStarred ? 'starred' : ''}">
              ${renderIcon(isStarred ? 'starFourFill' : 'starFour')}
            </div>
          </div>
          <div class="message-indicators">
            <div class="attachment-col">
              ${msg.HasAttachments ? html`<div class="indicator-icon" title=${this.i18nStore?.t('messageList.hasAttachments')}>${renderIcon('paperclipHorizontal')}</div>` : ''}
            </div>
            <div class="message-date">${dateStr}</div>
          </div>
        </div>
        <div class="message-subject-row">
          ${isAnswered || isForwarded ? html`
            <div class="indicators-wrapper">
              ${isAnswered ? html`<div class="indicator-icon" title=${this.i18nStore?.t('messageList.replied')}>${renderIcon('arrowBendUpLeft')}</div>` : ''}
              ${isForwarded ? html`<div class="indicator-icon" title=${this.i18nStore?.t('messageList.forwarded')}>${renderIcon('arrowBendUpRight')}</div>` : ''}
            </div>
          ` : ''}
          ${customTags.length > 0 ? html`
            <div class="tag-pills">
              ${customTags.map(tag => html`
                <alps-tag .name=${tag.name} .color=${tag.color}></alps-tag>
              `)}
            </div>
          ` : ''}
          ${this.currentMailbox === '*' && msg.Mailbox ? html`
            <span class="mailbox-badge" title="Folder: ${msg.Mailbox}">${msg.Mailbox}</span>
          ` : ''}
          <div class="message-subject">
            ${subject}
          </div>
          ${sizeStr ? html`<div class="message-size">${sizeStr}</div>` : ''}
        </div>
      </div>
    </div>
    `;
  }

  private toggleStar(e: Event, msg: any) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('toggle-star-message', { detail: { message: msg } }));
  }

  render() {
    return html`
      ${!this.isMobile ? html`
        <alps-toolbar class="list-header" ?scrolled=${this.isScrolled}>
          <input type="checkbox" class="select-all-checkbox" title=${this.i18nStore?.t('messageList.selectAll')}
            .checked=${this.messages.length > 0 && this.selectedMessages.size === this.visibleMessages.length}
            @change=${this.handleSelectAll}>
          <alps-icon-btn 
            title=${this.i18nStore?.t('messageList.checkNew')}
            @click=${() => this.dispatchEvent(new CustomEvent('refresh'))}
            @animationiteration=${this.handleSpinIteration}
            ?spinning=${this.isSpinning}
            icon="arrowsClockwise"
          ></alps-icon-btn>
          <div class="header-divider"></div>
          <alps-icon-btn 
            title=${this.sortOrder === 'asc' ? (this.i18nStore?.t('messageList.sortDesc')) : (this.i18nStore?.t('messageList.sortAsc'))}
            @click=${() => this.dispatchEvent(new CustomEvent('toggle-sort'))} 
            icon=${this.sortOrder === 'asc' ? 'sortAscending' : 'sortDescending'}
          ></alps-icon-btn>
          <alps-icon-btn 
            @click=${() => this.dispatchEvent(new CustomEvent('toggle-filter-starred'))} 
            title=${this.i18nStore?.t('messageList.filterStarred')}
            icon=${this.filterQuery === 'is:starred' ? 'starFourFill' : 'starFour'}
            ?active=${this.filterQuery === 'is:starred'}
          ></alps-icon-btn>
          <alps-icon-btn 
            @click=${() => this.dispatchEvent(new CustomEvent('toggle-filter-unread'))} 
            title=${this.i18nStore?.t('messageList.filterUnread')}
            icon="envelopeUnread"
            ?active=${this.filterQuery === 'is:unread'}
          ></alps-icon-btn>
          ${this.sidebarCollapsed ? html`
            <div class="current-mailbox-label">
              ${getMailboxLabel(this.currentMailbox, this.i18nStore)}
            </div>
          ` : ''}
          <alps-pagination 
            .currentPage=${this.currentPage} 
            .totalItems=${this.totalMessages} 
            .itemsPerPage=${this.messagesPerPage}>
          </alps-pagination>
        </alps-toolbar>
      ` : ''}
      <div class="list-content ${this.loading && this.messages.length > 0 ? 'loading-overlay' : ''}" tabindex="0" @scroll=${this.handleScroll} @keydown=${this.handleKeyDown}>
        ${this.filterQuery ? html`
          <alps-banner>
            <span>${this.i18nStore?.t('messageList.searchResultsFor')} <strong>${this.filterQuery}</strong></span>
            ${this.currentMailbox !== '*' && this.settingsStore?.getState()?.hasESearchCapability ? html`
              <alps-button slot="action" variant="normal" @click=${() => this.dispatchEvent(new CustomEvent('search-submit', { detail: { value: this.filterQuery, global: true }, bubbles: true, composed: true }))}>
                ${this.i18nStore?.t('messageList.searchAllMailboxes') || 'Search All Mailboxes'}
              </alps-button>
            ` : ''}
            <alps-button slot="action" variant="normal" @click=${() => this.dispatchEvent(new CustomEvent('clear-search'))}>
              ${this.i18nStore?.t('messageList.clearSearch')}
            </alps-button>
          </alps-banner>
        ` : ''}
        ${!this.filterQuery && /^(trash|junk|spam|deleted items)$/i.test(this.currentMailbox) && this.totalMessages > 0 ? html`
          <alps-banner variant="warning">
            <span>${this.i18nStore?.t('messageList.totalMessagesIn')?.replace('{count}', String(this.totalMessages)).replace('{folder}', this.currentMailbox) || `${this.totalMessages} total messages in ${this.currentMailbox}`}</span>
            <alps-button slot="action" variant="normal" ?disabled=${this.selectedMessages.size > 0} @click=${() => this.showEmptyConfirm = true}>
              ${this.i18nStore?.t('messageList.deleteAllNow') || 'Delete All Now'}
            </alps-button>
          </alps-banner>
        ` : ''}
        ${this.loading && this.messages.length === 0 ? html`
          <alps-loader full-height .text=${this.i18nStore?.t('messageList.loading') || 'Loading...'}></alps-loader>
        ` :
        this.messages.length === 0 ? html`<div class="empty-state">${this.i18nStore?.t('messageList.noMessages')}</div>` :
          repeat(this.messages, msg => msg.UID, msg => html`
            ${this.renderMessageItem(msg, false)}
            ${msg.SubMessages && msg.SubMessages.length > 0 && this.isThreadExpanded(String(msg.UID)) ? 
              msg.SubMessages.map((subMsg: any, idx: number) => this.renderMessageItem(subMsg, true, idx === 0, idx === msg.SubMessages.length - 1)) : ''}
          `)}
      </div>
      ${this.isMobile && this.messages.length > 0 ? html`
        <div class="mobile-bottom-header ${this.isAtBottom ? 'at-bottom' : ''}">
          ${this.selectedMessages.size > 0 ? html`
            <slot name="mobile-bulk-actions"></slot>
          ` : html`
            <div class="mobile-bottom-actions">
              <input type="checkbox" class="select-all-checkbox" title=${this.i18nStore?.t('messageList.selectAll')}
                .checked=${this.messages.length > 0 && this.selectedMessages.size === this.visibleMessages.length}
                @change=${this.handleSelectAll}>
              <alps-icon-btn 
                title=${this.i18nStore?.t('messageList.checkNew')}
                @click=${() => this.dispatchEvent(new CustomEvent('refresh'))}
                @animationiteration=${this.handleSpinIteration}
                ?spinning=${this.isSpinning}
                icon="arrowsClockwise"
              ></alps-icon-btn>
              <div class="header-divider"></div>
              <alps-icon-btn 
                title=${this.sortOrder === 'asc' ? (this.i18nStore?.t('messageList.sortDesc')) : (this.i18nStore?.t('messageList.sortAsc'))}
                @click=${() => this.dispatchEvent(new CustomEvent('toggle-sort'))} 
                icon=${this.sortOrder === 'asc' ? 'sortAscending' : 'sortDescending'}
              ></alps-icon-btn>
              <alps-icon-btn 
                @click=${() => this.dispatchEvent(new CustomEvent('toggle-filter-starred'))} 
                title=${this.i18nStore?.t('messageList.filterStarred')}
                icon=${this.filterQuery === 'is:starred' ? 'starFourFill' : 'starFour'}
                ?active=${this.filterQuery === 'is:starred'}
              ></alps-icon-btn>
              <alps-icon-btn 
                @click=${() => this.dispatchEvent(new CustomEvent('toggle-filter-unread'))} 
                title=${this.i18nStore?.t('messageList.filterUnread')}
                icon="envelopeUnread"
                ?active=${this.filterQuery === 'is:unread'}
              ></alps-icon-btn>
            </div>

            <alps-pagination 
              .currentPage=${this.currentPage} 
              .totalItems=${this.totalMessages} 
              .itemsPerPage=${this.messagesPerPage}>
            </alps-pagination>
          `}
        </div>
      ` : ''}
      ${this.showEmptyConfirm ? html`
        <ui-confirm
          title=${this.i18nStore?.t('messageList.emptyMailboxTitle')?.replace('{folder}', this.currentMailbox) || `Empty ${this.currentMailbox}`}
          message=${this.i18nStore?.t('messageList.emptyMailboxConfirm')?.replace('{folder}', this.currentMailbox).replace('{count}', String(this.totalMessages)) || `Are you sure you want to permanently delete all ${this.totalMessages} messages in ${this.currentMailbox}? This action cannot be undone.`}
          confirmText=${this.i18nStore?.t('messageList.deleteAllNow') || 'Delete All Now'}
          .isDanger=${true}
          @confirm=${this.handleEmptyMailbox}
          @cancel=${() => this.showEmptyConfirm = false}
        ></ui-confirm>
      ` : ''}
    `;
  }
}
