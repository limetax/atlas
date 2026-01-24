import { defineConfig, globalIgnores } from 'eslint/config';
import reactConfig from '@atlas/eslint-config/react';

export default defineConfig([
  globalIgnores(['dist']),
  { files: ['**/*.{ts,tsx}'], extends: reactConfig },
]);
