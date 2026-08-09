import babelParser from '@babel/eslint-parser'
import eslint from '@eslint/js'
import globals from 'globals'

export default [
  {
    ignores: [
      'dist/**',
      'release/**',
      'node_modules/**',
      'src/library/zhihu_encrypt/lib/zhihu_encrypt.ts',
    ],
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          parserOpts: {
            plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties'],
          },
        },
      },
    },
    rules: {
      ...eslint.configs.recommended.rules,
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
      'no-unused-vars': 'off',
      'no-useless-assignment': 'off',
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Babel parses TypeScript 7 syntax, while tsc remains responsible for
      // type-aware name and declaration checks.
      'no-undef': 'off',
      'no-redeclare': 'off',
      'no-dupe-class-members': 'off',
    },
  },
]
