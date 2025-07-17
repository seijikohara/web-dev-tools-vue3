import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import prettierConfig from '@vue/eslint-config-prettier'

export default [
  // Base JavaScript rules
  js.configs.recommended,

  // Vue 3 essential rules
  ...pluginVue.configs['flat/essential'],

  // Prettier config (must be last)
  prettierConfig,

  // Source files with TypeScript project
  {
    files: ['src/**/*.{ts,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsparser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.app.json'],
        extraFileExtensions: ['.vue'],
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        crypto: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // TypeScript recommended rules
      ...tseslint.configs.recommended.rules,

      // Vue 3 specific rules
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/no-v-html': 'off',
      'vue/require-default-prop': 'off',
      'vue/prefer-import-from-vue': 'error',
      'vue/no-ref-as-operand': 'error',
      'vue/no-deprecated-v-on-native-modifier': 'error',

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    },
  },

  // Config files without TypeScript project
  {
    files: ['*.{js,mjs,cjs,ts}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        URL: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Basic TypeScript rules without project
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Ignore patterns
  {
    ignores: ['dist/', 'node_modules/', '.vite/', 'coverage/'],
  },
]
