import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { consume } from '@lit/context';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { getAvatarColor } from '../utils/ui';

@customElement('alps-avatar')
export class AlpsAvatar extends LitElement {
  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;
  @property({ type: String }) name = '';
  @property({ type: String }) email = '';
  @property({ type: String }) src = '';
  @property({ type: Number }) size = 40;

  @state() private imageError = false;

  willUpdate(changedProperties: Map<string, any>) {
    if (changedProperties.has('src')) {
      this.imageError = false;
    }
  }

  private _handleStoreChange = () => {
    this.requestUpdate();
  };

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      this.settingsStore?.addEventListener('change', this._handleStoreChange);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.settingsStore?.removeEventListener('change', this._handleStoreChange);
  }

  static styles = css`
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
  `;

  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/[\s.@]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  render() {
    const loginUser = this.settingsStore?.getState()?.loginUsername || '';
    const loginName = this.settingsStore?.getState()?.name || '';
    
    let isSelf = false;
    if (loginUser && this.email && this.email.toLowerCase() === loginUser.toLowerCase()) {
      isSelf = true;
    } else if (loginName && this.name && this.name.toLowerCase() === loginName.toLowerCase()) {
      isSelf = true;
    } else if (loginUser && this.name && this.name.toLowerCase() === loginUser.toLowerCase()) {
      isSelf = true;
    }

    const effectiveAvatarSeed = isSelf ? (loginName || loginUser) : (this.email || this.name);
    const effectiveInitialsSeed = isSelf ? (loginName || loginUser || this.name) : this.name;

    const fontSize = Math.round(this.size / 2.3);
    const styles = {
      width: `${this.size}px`,
      height: `${this.size}px`,
      fontSize: `${fontSize}px`,
      backgroundColor: getAvatarColor(effectiveAvatarSeed)
    };

    return html`
      <div class="avatar" style="${styleMap(styles)}">
        ${this.src && !this.imageError
          ? html`<img src="${this.src}" alt="${this.name}" @error="${() => this.imageError = true}" />`
          : this.getInitials(effectiveInitialsSeed)
        }
      </div>
    `;
  }
}
