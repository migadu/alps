/**
 * jsdom lacks a few browser APIs that components call from their own deferred
 * work — a Lit update, firstUpdated, a timer. A throw there lands outside any
 * await a test holds and is reported against whichever test happens to be
 * running, so the shims are installed once for every file rather than left for
 * each file to remember. Each is guarded on absence.
 */
import {
  installDialogSupport,
  installExecCommand,
  installMatchMedia,
  installResizeObserver,
  installScrollIntoView,
} from './dom';

installScrollIntoView();
installResizeObserver();
installDialogSupport();
installMatchMedia();
installExecCommand();
