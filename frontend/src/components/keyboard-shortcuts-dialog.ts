import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { modalButtonStyles, UIModal } from './ui-modal';
import { motionStyles } from '../utils/motion';
import './ui-modal';

@customElement('keyboard-shortcuts-dialog')
export class KeyboardShortcutsDialog extends LitElement {
  @consume({ context: i18nContext }) i18nStore!: I18nStore;
  @consume({ context: settingsContext }) settingsStore!: SettingsStore;

  connectedCallback() {
    super.connectedCallback();
    this.settingsStore?.addEventListener('change', this.changed);
    this.i18nStore?.addEventListener('change', this.changed);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.settingsStore?.removeEventListener('change', this.changed);
    this.i18nStore?.removeEventListener('change', this.changed);
  }

  private changed = () => this.requestUpdate();
  private close = () => this.renderRoot.querySelector<UIModal>('ui-modal')?.close();

  static styles = [motionStyles, modalButtonStyles, css`
    ui-modal::part(card) {
      box-sizing: border-box;
      max-inline-size: calc(100vw - 32px);
      max-block-size: calc(100dvh - 32px);
      overflow: auto;
      overscroll-behavior: contain;
    }
    p { margin-block: 0 16px; }
    h4 { font-size: inherit; margin-block: 20px 8px; color: var(--text-primary); }
    dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 10px 20px; margin: 0; }
    dt { text-align: end; }
    dd { margin: 0; overflow-wrap: anywhere; }
    kbd { font: inherit; font-size: 12px; border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 6px; white-space: nowrap; }
    label { display: flex; align-items: center; gap: 8px; min-block-size: 32px; color: var(--text-primary); cursor: pointer; }
    input { accent-color: var(--accent-color); }
    .hint { color: var(--text-muted); font-size: 12px; margin-block: 4px 16px; }
  `];

  render() {
    const t = (key: string) => this.i18nStore?.t(key);
    return html`
      <ui-modal heading=${t('shortcuts.title')} .dismissible=${true} width="560px" @cancel=${this.close}>
        <label for="enabled"><input id="enabled" type="checkbox" autofocus
          aria-describedby="enabled-hint"
          .checked=${this.settingsStore?.getState().keyboardShortcuts !== false}
          @change=${(e: Event) => { void this.settingsStore.updateSettings({ keyboardShortcuts: (e.target as HTMLInputElement).checked }); }}
        >${t('shortcuts.enabled')}</label>
        <p id="enabled-hint" class="hint">${t('shortcuts.enabledHint')}</p>
        <dl><dt><kbd>?</kbd></dt><dd>${t('shortcuts.title')}</dd></dl>
        <h4>${t('shortcuts.mail')}</h4>
        <p>${t('shortcuts.context')}</p>
        <dl>
          <dt><kbd>q</kbd></dt><dd>${t('messageReader.markRead')}</dd>
          <dt><kbd>z</kbd></dt><dd>${t('messageReader.archive')}</dd>
        </dl>
        <h4>${t('shortcuts.navigation')}</h4>
        <dl>
          <dt><kbd>↓</kbd> <kbd>↑</kbd></dt><dd>${t('shortcuts.move')}</dd>
          <dt><kbd>${t('shortcuts.enter')}</kbd></dt><dd>${t('shortcuts.open')}</dd>
          <dt><kbd>${t('shortcuts.space')}</kbd></dt><dd>${t('shortcuts.select')}</dd>
          <dt><kbd>${t('shortcuts.escape')}</kbd></dt><dd>${t('shortcuts.dismiss')}</dd>
        </dl>
        <button slot="actions" class="btn-confirm" type="button" @click=${this.close}>${t('general.close')}</button>
      </ui-modal>
    `;
  }
}
