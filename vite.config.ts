import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { localePages } from './scripts/locale-pages';

export default defineConfig({
  plugins: [
    react(),
    // Listed before VitePWA so the generated locale pages exist when the service
    // worker manifest is built, and ship precached like every other page.
    localePages({ site: 'https://myzikr.netlify.app' }),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        // Digital Asset Links is read by Android over the network, never through the
        // service worker. Precaching it would only risk serving a stale signing key.
        globIgnores: ['**/.well-known/**'],
        navigateFallback: '/index.html',
        // Without this a returning visitor navigating to /tr/ gets the English app
        // shell from the cache instead of the Turkish landing page.
        navigateFallbackDenylist: [/^\/(ms|id|tr|ar)(\/|$)/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        importScripts: ['/push-handler.js']
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true
  }
});
