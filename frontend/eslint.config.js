import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsdoc from 'eslint-plugin-tsdoc'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      // Lints TSDoc (/** */) comment syntax so documentation stays well-formed.
      tsdoc,
    },
    rules: {
      'tsdoc/syntax': 'warn',
    },
    languageOptions: {
      globals: globals.browser,
    },
  },
])
