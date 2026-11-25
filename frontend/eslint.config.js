import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'
import designGuardrails from './eslint-rules/design-guardrails.js'

export default defineConfig([
  {
    ignores: [
      'dist/',
      'e2e/',
      'public/',
      'node_modules/',
    ],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'design-guardrails': designGuardrails,
    },
    rules: {
      'design-guardrails/no-arbitrary-tailwind-values': 'warn',
      'design-guardrails/no-unapproved-hex-colors': 'warn',
      'design-guardrails/no-slash-labels': 'warn',
      'design-guardrails/no-raw-html-controls': 'warn',
      'design-guardrails/no-unpaired-outline-none': 'warn',
      'design-guardrails/require-reduced-motion-safe': 'warn',
    },
  },
  {
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
      'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^React$' }],
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/pages/portals/broker/**/*.test.{js,jsx}'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
]);
