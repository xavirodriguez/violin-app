// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import tsdocPlugin from 'eslint-plugin-tsdoc'

export default tseslint.config(
  {
    ignores: ['.next/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      tsdoc: tsdocPlugin,
    },
    rules: {
      'tsdoc/syntax': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['dependency-cruiser.js'],
    languageOptions: {
      globals: {
        module: 'writable',
      },
    },
  },
)
