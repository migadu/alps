import { render, nothing, type LitElement, type ReactiveController, type TemplateResult } from 'lit';
import { MODAL_LAYERS_CHANGED, topModal } from './modal-layers';

/** Keep notifications inside the top modal's live subtree; z-index cannot escape inertness. */
export class ModalPortal implements ReactiveController {
  private host: LitElement;
  private content: () => TemplateResult;
  private container = document.createElement('div');

  constructor(host: LitElement, content: () => TemplateResult) {
    this.host = host;
    this.content = content;
    this.container.style.display = 'contents';
    host.addController(this);
  }

  private relocate = () => {
    if (!this.host.isConnected) return;
    const target = topModal() ?? this.host.renderRoot;
    if (this.container.parentNode !== target) target.appendChild(this.container);
  };

  hostConnected() { window.addEventListener(MODAL_LAYERS_CHANGED, this.relocate); }
  hostUpdated() {
    render(this.content(), this.container, { host: this.host });
    this.relocate();
  }
  hostDisconnected() {
    window.removeEventListener(MODAL_LAYERS_CHANGED, this.relocate);
    render(nothing, this.container);
    this.container.remove();
  }
}
