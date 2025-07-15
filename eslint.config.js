import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      // Clean Code: Functions should be small and do one thing
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 4],
      'max-depth': ['error', 3],
      'complexity': ['error', 10],

      // Clean Code: Use descriptive names
      'id-length': ['error', { min: 2, exceptions: ['i', 'j', 'k', 'x', 'y', 'z'] }],
      'camelcase': ['error', { properties: 'always' }],

      // Clean Code: Comments should explain why, not what
      'no-inline-comments': 'error',
      'spaced-comment': ['error', 'always'],

      // Clean Code: Error handling
      'no-console': 'warn',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',

      // Clean Code: Avoid duplication
      'no-duplicate-imports': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',

      // Clean Code: Consistent formatting
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',

      // Clean Code: Variables and constants
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',

      // Clean Code: Function expressions
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'arrow-parens': ['error', 'as-needed'],

      // Clean Code: Objects and arrays
      'object-shorthand': 'error',
      'prefer-destructuring': ['error', { object: true, array: false }],
      'no-array-constructor': 'error',

      // Clean Code: Conditional logic
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'yoda': 'error',

      // Clean Code: Async/await
      'prefer-promise-reject-errors': 'error',
      'no-async-promise-executor': 'error',

      // Clean Code: Code organization
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'padded-blocks': ['error', 'never'],
      'brace-style': ['error', '1tbs', { allowSingleLine: true }],

      // Clean Code: Imports and modules
      'no-duplicate-imports': 'error'
    }
  },
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    rules: {
      'no-console': 'off',
      'max-lines-per-function': 'off'
    }
  }
]; 