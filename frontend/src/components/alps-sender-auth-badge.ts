import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon } from '../utils/ui';

/**
 * The receiving mail server's verdict on who sent a message: an icon beside the
 * sender's name, its words kept as the tooltip and accessible name.
 *
 * `verified` is a DMARC (or BIMI) pass and `failed` a failing DMARC, DKIM or SPF
 * result with no pass, both read from the receiver's own Authentication-Results
 * as `HasBimiPotential` and `HasBimiFailed`. Without either it draws nothing:
 * most mail carries no verdict worth showing, and an empty space is not a
 * warning.
 *
 * An icon rather than a labelled pill, and the same wherever it is drawn. A pass
 * is the common case, what most legitimate mail gets and what mail from a
 * lookalike domain its sender owns gets too, so words on every such message
 * overstate it and teach the eye to skip them. A failure is the verdict that
 * matters, and the reader says that one in words, above the message body.
 *
 * The verdict used to sit on a corner of the avatar, so turning avatars off
 * would have taken away the one mark a message that failed its checks gets. It
 * belongs to the sender, not the picture.
 */
@customElement('alps-sender-auth-badge')
export class AlpsSenderAuthBadge extends LitElement {
  @consume({ context: i18nContext })
  i18nStore?: I18nStore;

  @property({ type: Boolean }) verified = false;
  @property({ type: Boolean }) failed = false;

  static styles = css`
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
  `;

  render() {
    // The server never reports both; were it to, a pass is what it concluded.
    const state = this.verified ? 'verified' : this.failed ? 'failed' : '';
    if (!state) return nothing;

    const label = state === 'verified'
      ? this.i18nStore?.t('messageReader.verifiedSender') || 'Verified Sender'
      : this.i18nStore?.t('messageReader.unverifiedSender') || 'Unverified Sender';

    return html`
      <span class="badge ${state}" role="img" aria-label=${label} title=${label}>
        ${renderIcon(state === 'verified' ? 'verifiedBadge' : 'authFailedBadge')}
      </span>
    `;
  }
}
