import { useState, useSyncExternalStore } from 'react';
import { isAppleMobile, isStandalone } from '../services/platform';

// beforeinstallprompt fires once, early in the page lifecycle — usually before any
// component that wants it has mounted. Capture it at module scope and let hook
// instances subscribe, so an install button mounted later still gets the native prompt.
let capturedPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('appinstalled', () => {
    installed = true; capturedPrompt = null;
    listeners.forEach((notify) => notify());
  });
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    capturedPrompt = event as BeforeInstallPromptEvent;
    listeners.forEach((notify) => notify());
  });
}

const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => listeners.delete(notify);
};
const getPrompt = () => capturedPrompt;

export function useInstallPrompt() {
  const prompt = useSyncExternalStore(subscribe, getPrompt, () => null);
  const [showInstructions, setShowInstructions] = useState(false);
  const standalone = useSyncExternalStore(subscribe, () => isStandalone() || installed, () => false);
  const isIos = isAppleMobile();

  const install = async () => {
    if (prompt) {
      capturedPrompt = null;
      listeners.forEach((notify) => notify());
      try { await prompt.prompt(); await prompt.userChoice; }
      catch { setShowInstructions(true); }
    } else {
      setShowInstructions(true);
    }
  };

  return { canInstall: !standalone, standalone, isIos, showInstructions, setShowInstructions, install };
}
