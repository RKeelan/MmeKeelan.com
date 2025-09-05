import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Image: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'warn'
    }
  },
  {
    files: ['**/*.test.js', '**/*.test.ts'],
    rules: {
      'no-undef': 'off' // Allow test globals like describe, it, expect
    }
  }
];