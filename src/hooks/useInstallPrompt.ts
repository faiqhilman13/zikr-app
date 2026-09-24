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

/** What an install attempt came to: the browser's own prompt answered, or the manual steps shown instead. */
export type InstallOutcome = 'accepted' | 'dismissed' | 'instructions';

export function useInstallPrompt() {
  const prompt = useSyncExternalStore(subscribe, getPrompt, () => null);
  const [showInstructions, setShowInstructions] = useState(false);
  const standalone = useSyncExternalStore(subscribe, () => isStandalone() || installed, () => false);
  const isIos = isAppleMobile();

  const install = async (): Promise<InstallOutcome> => {
    if (prompt) {
      capturedPrompt = null;
      listeners.forEach((notify) => notify());
      try {
        await prompt.prompt();
        return (await prompt.userChoice).outcome;
      } catch { /* The prompt could not be shown, so fall through to the manual steps. */ }
    }
    setShowInstructions(true);
    return 'instructions';
  };

  return { canInstall: !standalone, canPrompt: prompt !== null, standalone, isIos, showInstructions, setShowInstructions, install };
}
