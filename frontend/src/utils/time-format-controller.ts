import type { LitElement, ReactiveController } from 'lit';
import { ContextConsumer } from '@lit/context';
import { settingsContext, type SettingsStore } from '../store/settings-store';
import { resolveHourFormat } from './ui';

/** Follow the user's clock, including changes while a calendar or menu stays open. */
export class TimeFormatController implements ReactiveController {
  private store?: SettingsStore;
  private listening?: SettingsStore;
  private changed = () => this.host.requestUpdate();

  private host: LitElement;

  constructor(host: LitElement) {
    this.host = host;
    host.addController(this);
    new ContextConsumer(host, {
      context: settingsContext,
      subscribe: true,
      callback: store => {
        this.store = store;
        this.listen();
        host.requestUpdate();
      },
    });
  }

  get hour12(): boolean { return resolveHourFormat(this.store?.getState().hourFormat) === '12'; }

  private listen() {
    if (this.listening === this.store || !this.host.isConnected) return;
    this.listening?.removeEventListener('change', this.changed);
    this.listening = this.store;
    this.listening?.addEventListener('change', this.changed);
  }

  hostConnected() { this.listen(); }
  hostDisconnected() {
    this.listening?.removeEventListener('change', this.changed);
    this.listening = undefined;
  }
}
