import tseslint from 'typescript-eslint';

import js from '@eslint/js';

export const base = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // === TypeScript Strict Rules ===

      // Unused code detection (upgraded to error)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // Type safety (following frontend-standards.mdc)
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-assertions': [
        'warn',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'never', // Disallow 'as' on object literals (common mistake)
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn', // Warn on '!' operator (use optional chaining instead)

      // === Code Quality Rules ===

      // Prefer const over let for immutability
      'prefer-const': 'error',

      // No var - use const/let
      'no-var': 'error',

      // Consistent return types
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],

      // === Import Rules ===

      // No unused imports (already caught by no-unused-vars but more explicit)
      'no-unused-private-class-members': 'error',

      // === Best Practices ===

      // Prevent console.log in production
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Require default case in switch or explicit comment
      'default-case': 'warn',
    },
  },
];
