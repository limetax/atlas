import { defineConfig, globalIgnores } from 'eslint/config';
import nestConfig from '@atlas/eslint-config/nest';
import reactConfig from '@atlas/eslint-config/react';

export default defineConfig([
  globalIgnores([
    '**/dist',
    '**/node_modules',
    '**/supabase',
    '**/supabase-project',
  ]),
  // API (NestJS) files
  { files: ['apps/api/**/*.ts'], extends: nestConfig },
  // Web (React) files
  { files: ['apps/web/**/*.{ts,tsx}'], extends: reactConfig },
  // Shared package files
  { files: ['packages/shared/**/*.ts'], extends: nestConfig },
]);
