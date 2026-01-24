import { defineConfig, globalIgnores } from 'eslint/config';
import nestConfig from '@atlas/eslint-config/nest';

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  { files: ['**/*.ts'], extends: nestConfig },
]);
