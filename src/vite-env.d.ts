/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface Navigator {
  standalone?: boolean;
  // Global Privacy Control, honoured alongside Do Not Track before any usage report.
  globalPrivacyControl?: boolean;
}
