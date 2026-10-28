import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    // Global ignores – only include broker portal UI files
    ignores: [
      'src/**',
      '!src/pages/portals/broker/**',
      'dist/',
      'e2e/',
      'public/',
      'node_modules/',
    ],
  },
  {
    // Lint broker UI source files
    files: ['src/pages/portals/broker/**/*.js', 'src/pages/portals/broker/**/*.jsx'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    rules: {
      // Allow the React import when JSX is used but React identifier is not referenced
      'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^React$' }],
      // Turn off strict hook dependency checking during the refactor
      'react-hooks/exhaustive-deps': 'off',
      // Turn off set‑state‑in‑effect warnings which can appear in data‑loading patterns
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // Test files – relax unused‑vars rule completely
    files: ['src/pages/portals/broker/**/*.test.{js,jsx}'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
]);