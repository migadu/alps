import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { messageSync } from '../services/message-sync';
import { fetchWithTimeout, foregroundSettled } from '../utils/fetch-utils';
import { isolatedSentence } from '../utils/bidi';
import { formatSize } from '../utils/ui';
import { Logger } from '../utils/logger';
import { motionStyles } from '../utils/motion';

/** How much storage the mailbox's mail takes, and the most it may take, in bytes. */
export interface StorageUsage {
  used: number;
  limit: number;
}

/** How close the mailbox is to its storage limit. */
export type StorageSeverity = '' | 'warn' | 'critical';

/** What `storage-change` tells the account menu around the section. */
export interface StorageChange {
  severity: StorageSeverity;
  /** How full the mailbox is, in whole percent, at most 100. */
  percent: number;
  /** Whether the section has figures to show. */
  shown: boolean;
}

/** From here on the menu warns; below it, storage is nothing to think about. */
const WARN_PERCENT = 80;
const CRITICAL_PERCENT = 95;

/**
 * How old the figures may be before news of mail reads them again. Opening
 * the menu reads them whatever their age.
 */
const READ_TTL_MS = 60 * 1000;

/**
 * How full the mailbox is, in whole percent, rounded down and held at 100: a
 * mailbox shown 95% full is at least that full, and one a lowered limit left
 * over it is full, not 130%. The severity is read from the same figure, so
 * the words and the warning never disagree.
 */
export function storagePercent(usage: StorageUsage): number {
  if (usage.limit === 0) return 100;
  return Math.min(100, Math.max(0, Math.floor((usage.used * 100) / usage.limit)));
}

export function storageSeverity(usage: StorageUsage | null): StorageSeverity {
  if (!usage) return '';
  const percent = storagePercent(usage);
  return percent >= CRITICAL_PERCENT ? 'critical' : percent >= WARN_PERCENT ? 'warn' : '';
}

/**
 * The figures in an answer of GET /quota, or null when it has none to show:
 * the mail server keeps no quotas, or none of them limits storage. A limit of
 * 0 prohibits usage and is shown as full. `unsupported` says that the server keeps no
 * quotas at all, which only an answer that says so outright is taken for.
 */
function usageOf(body: any): { usage: StorageUsage | null; unsupported: boolean } {
  if (body?.supported !== true) return { usage: null, unsupported: body?.supported === false };
  const { used, limit } = body;
  if (typeof used !== 'number' || typeof limit !== 'number' || !(limit >= 0) || !(used >= 0)) {
    return { usage: null, unsupported: false };
  }
  return { usage: { used, limit }, unsupported: false };
}

/**
 * How much of the mailbox's storage is used: a section of the account menu,
 * the figures and a bar, display only.
 *
 * A mailbox without a storage limit shows nothing at all. Unlimited is not
 * zero: a bar filled to 0% against no limit says the mailbox is empty, which
 * is a lie whatever it holds. The same goes for a mail server that keeps no
 * quotas, and for one whose figures have never been read. A failed refresh keeps
 * the last successfully read figures.
 *
 * Urgency leaves the menu. A closed menu is not where a mailbox about to
 * refuse mail may whisper about it: the severity is reflected as `severity`,
 * and `storage-change` announces it with the percentage, for the menu's
 * avatar and button to carry while the menu is closed.
 */
@customElement('alps-storage-usage')
export class AlpsStorageUsage extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @state() private usage: StorageUsage | null = null;

  /** Derived from the figures: read it, never set it. */
  @property({ type: String, reflect: true }) severity: StorageSeverity = '';

  /** What was last announced, so that `storage-change` fires on a change only. */
  private announced: StorageChange = { severity: '', percent: 0, shown: false };

  /**
   * The mail server keeps no quotas. Its capabilities do not change under a
   * session, and the menu is drawn again for every page and every session,
   * so the figures are not asked for again here.
   */
  private unsupported = false;
  /** When the figures were last read, or a read of them failed. */
  private readAt = 0;
  /** The read on its way, which a second asker waits for rather than repeating it. */
  private reading: Promise<void> | null = null;

  static styles = [motionStyles, css`
    :host {
      display: block;
    }

    .storage {
      padding: 8px 16px;
      min-width: 200px;
      cursor: default;
    }

    .label {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
      color: var(--text-secondary, #4b5563);
      margin-block-end: 6px;
    }

    .percent {
      flex-shrink: 0;
    }

    .track {
      height: 4px;
      border-radius: 2px;
      overflow: hidden;
      background: var(--border-color, #e5e7eb);
    }

    .fill {
      height: 100%;
      background: var(--accent-color, #2563eb);
      transition: width 0.3s;
    }

    .fill.warn {
      background: var(--warning, #f59e0b);
    }

    .fill.critical {
      background: var(--error, #ef4444);
    }

    /* The bar is drawn by backgrounds alone, which forced colors repaint as
       the page: the track is outlined and the fill takes the text's colour. */
    @media (forced-colors: active) {
      .track {
        border: 1px solid CanvasText;
      }
      .fill,
      .fill.warn,
      .fill.critical {
        forced-color-adjust: none;
        background: CanvasText;
      }
    }
  `];

  private _handleI18nChange = () => this.requestUpdate();

  /** News of mail: mail came, went or was listed, and may have moved the figures. */
  private _handleMailNews = (e: Event) => {
    // A listing shown from memory is no news; the read it stands in for is.
    if ((e as CustomEvent).detail?.kept) return;
    void this.refresh();
  };

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      if (!this.isConnected) return;
      this.i18nStore?.addEventListener('change', this._handleI18nChange);
    });
    // Usage moves when mail arrives, goes or is sent, which is when the mail
    // is listed again or its counts move: the figures ride those, rather than
    // a timer of their own.
    messageSync.addEventListener('sync-success', this._handleMailNews);
    messageSync.addEventListener('inbox-counts', this._handleMailNews);
    messageSync.addEventListener('folder-counts', this._handleMailNews);
    // Read once the page's own requests are answered: the figures are for
    // the avatar, and nobody waits on them.
    void foregroundSettled().then(() => {
      if (this.isConnected) void this.refresh();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);
    messageSync.removeEventListener('sync-success', this._handleMailNews);
    messageSync.removeEventListener('inbox-counts', this._handleMailNews);
    messageSync.removeEventListener('folder-counts', this._handleMailNews);
  }

  /**
   * Reads the figures again when they are older than {@link READ_TTL_MS};
   * `force` reads them whatever their age, as the menu does when it opens.
   */
  async refresh(force = false): Promise<void> {
    if (this.reading) return this.reading;
    if (this.unsupported) return;
    if (!force && Date.now() - this.readAt < READ_TTL_MS) return;
    this.reading = this.read().finally(() => { this.reading = null; });
    return this.reading;
  }

  private async read(): Promise<void> {
    try {
      const response = await fetchWithTimeout('/quota', {}, undefined, { background: true });
      if (!response.ok) throw new Error(`status ${response.status}`);
      const { usage, unsupported } = usageOf(await response.json());
      this.usage = usage;
      this.unsupported = unsupported;
    } catch (error) {
      // The figures are informational: what was shown stays, and nothing is
      // said to the user. The next read is a minute away like any other, so
      // a server that refuses the read is not asked at every folder opened.
      Logger.warn('Failed to read the storage quota', error);
    } finally {
      this.readAt = Date.now();
    }
  }

  protected willUpdate(changed: PropertyValues) {
    if (changed.has('usage')) this.severity = storageSeverity(this.usage);
  }

  protected updated() {
    const now: StorageChange = {
      severity: this.severity,
      percent: this.usage ? storagePercent(this.usage) : 0,
      shown: this.usage !== null,
    };
    const was = this.announced;
    if (now.severity === was.severity && now.percent === was.percent && now.shown === was.shown) return;
    this.announced = now;
    this.dispatchEvent(new CustomEvent<StorageChange>('storage-change', { detail: now }));
  }

  render() {
    const usage = this.usage;
    if (!usage) return nothing;
    const share = usage.limit === 0 ? 1 : Math.min(1, usage.used / usage.limit);
    const percent = storagePercent(usage);
    const used = isolatedSentence(this.i18nStore, 'storage.used', {
      used: html`<bdi>${formatSize(usage.used, this.i18nStore)}</bdi>`,
      quota: html`<bdi>${formatSize(usage.limit, this.i18nStore)}</bdi>`,
    });
    // The percentage beside the sizes, which are rounded to a whole unit: a
    // mailbox at 9.6 of its 10 GB reads "10 GB of 10 GB used".
    return html`
      <div class="storage">
        <div class="label">
          <span class="used">${used}</span>
          <span class="percent"><bdi>${this.i18nStore?.t('storage.percent', { percent }) ?? `${percent}%`}</bdi></span>
        </div>
        <div class="track" aria-hidden="true">
          <div class="fill ${this.severity}" style="width: ${share * 100}%"></div>
        </div>
      </div>
    `;
  }
}
