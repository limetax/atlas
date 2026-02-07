import reactConfig from '@atlas/eslint-config/react';

export default [
  {
    ignores: ['dist'],
  },
  // Apply react config to all ts/tsx files
  ...reactConfig.map((config) => ({
    ...config,
    // Add files pattern to configs that don't have one (except the tsx-specific override)
    files: config.files ?? ['**/*.{ts,tsx}'],
  })),
];
