// Flat ESLint config shared by the whole monorepo.
// Per-package configs can extend this and add framework-specific rules.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/generated/**',
      '**/prisma/migrations/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },
  // NestJS uses `reflect-metadata` to discover constructor parameter types at
  // runtime for dependency injection. If a class is imported with `import type`
  // (or `import { type Foo }`), it gets erased at compile time and DI breaks
  // with "Nest can't resolve dependencies of X" at boot. The
  // `consistent-type-imports` rule autofixes class imports into type-only
  // imports because it can't see the decorator-driven runtime usage, so we
  // disable it for the API.
  //
  // Same applies anywhere else we use class-based DI with reflect-metadata
  // (e.g. future TypeORM/typedi/inversify code).
  {
    files: ['apps/api/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
);
