const js = require('@eslint/js');

module.exports = [
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
        clearInterval: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
        document: 'readonly',
        Notification: 'readonly',
        MouseEvent: 'readonly'
      }
    },
    rules: {
      // ESSENTIAL ERRORS - These can break your code
      'no-undef': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-duplicate-imports': 'error',
      'no-throw-literal': 'error',
      'no-async-promise-executor': 'error',
      'prefer-promise-reject-errors': 'error',
      'no-var': 'error',
      'prefer-const': 'error',

      // WARNINGS - Good practices but not critical
      'no-console': 'warn',
      'max-lines-per-function': [
        'warn',
        { max: 100, skipBlankLines: true, skipComments: true }
      ],
      'max-params': ['warn', 4],
      complexity: ['warn', 10],

      // STYLE RULES - Turned off or made less strict
      'max-depth': 'off',
      'id-length': 'off',
      camelcase: 'off',
      'no-inline-comments': 'off',
      'spaced-comment': 'off',
      indent: 'off',
      quotes: 'off',
      semi: 'off',
      'comma-dangle': 'off',
      'no-trailing-spaces': 'off',
      'eol-last': 'off',
      'prefer-arrow-callback': 'off',
      'arrow-spacing': 'off',
      'arrow-parens': 'off',
      'object-shorthand': 'off',
      'prefer-destructuring': 'off',
      'no-array-constructor': 'off',
      'no-nested-ternary': 'off',
      'no-unneeded-ternary': 'off',
      yoda: 'off',
      'no-multiple-empty-lines': 'off',
      'padded-blocks': 'off',
      'brace-style': 'off',
      'no-unused-expressions': 'off',
      'no-unused-vars': 'off'
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
