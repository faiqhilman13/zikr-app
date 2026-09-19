import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '../i18n';

// jsdom ships no matchMedia, which the theme effect calls on mount. Default to light
// so a test that renders the whole app does not die in an effect.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false
  }) as MediaQueryList;
}

afterEach(() => cleanup());
