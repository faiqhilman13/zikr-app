import { useState, useSyncExternalStore } from 'react';

// beforeinstallprompt fires once, early in the page lifecycle — usually before any
// component that wants it has mounted. Capture it at module scope and let hook
// instances subscribe, so an install button mounted later still gets the native prompt.
let capturedPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
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
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const install = async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      capturedPrompt = null;
      listeners.forEach((notify) => notify());
    } else {
      setShowInstructions(true);
    }
  };

  return { canInstall: !standalone, standalone, isIos, showInstructions, setShowInstructions, install };
}
