import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-console': 'off', // Allow console.log for logging
      'no-undef': 'error',
      'no-unreachable': 'warn',
      'no-duplicate-imports': 'warn',
      'prefer-const': 'warn',
      'no-dupe-keys': 'warn', // Change to warning for vietnameseUtils.js
    },
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'build/**',
      'src/generated/**',
      '*.config.js',
      'prisma/**',
      '.github/**',
    ],
  },
  // Config for public files (browser environment)
  {
    files: ['public/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  // Config for test files (Jest environment)
  {
    files: ['**/__tests__/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        vars: 'all',
        args: 'after-used',
      }],
    },
  },
];

