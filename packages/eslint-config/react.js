import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { base } from './base.js';

export default [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.browser },
      ecmaVersion: 2020,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // === React Hooks Best Practices ===

      // Enforce hook dependencies (upgrade from recommended 'warn' to 'error')
      'react-hooks/exhaustive-deps': 'error',

      // Enforce rules of hooks
      'react-hooks/rules-of-hooks': 'error',
    },
  },
];
