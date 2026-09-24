import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'ZikrApp', 'ZikrWidgetExtension', 'Sources', 'Tests'] },
  {
    extends: [js.configs.recommended],
    files: ['netlify/**/*.mjs'],
    languageOptions: { ecmaVersion: 2022, globals: globals.node }
  },
  {
    // Loaded into the generated service worker with importScripts, so a classic script.
    extends: [js.configs.recommended],
    files: ['public/push-handler.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: globals.serviceworker }
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error'
    }
  }
);
