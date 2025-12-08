// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'
import prettierConfig from '@vue/eslint-config-prettier'

// Common TypeScript rules for strict type checking
const commonTypeScriptRules = {
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/restrict-template-expressions': [
    'error',
    { allowNumber: true, allowBoolean: true },
  ],
  '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
  '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
}

// Common immutability rules
const immutabilityRules = {
  'no-var': 'error',
  'prefer-const': 'error',
  'no-param-reassign': 'error',
}

export default defineConfig(
  // Global ignores (must be first)
  globalIgnores(['dist/', 'node_modules/', '.vite/', 'coverage/', 'playwright-report/']),

  // Base JavaScript rules
  eslint.configs.recommended,

  // Vue 3 strongly-recommended rules (includes essential + readability improvements)
  pluginVue.configs['flat/strongly-recommended'],

  // Vue files with TypeScript type-aware linting
  {
    name: 'vue/typescript',
    files: ['src/**/*.vue'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parser: vueParser,
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      ...commonTypeScriptRules,

      // Vue 3 specific overrides
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-v-html': 'off',
      'vue/no-setup-props-destructure': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: { void: 'always', normal: 'never', component: 'always' },
          svg: 'always',
          math: 'always',
        },
      ],
      'vue/max-attributes-per-line': ['error', { singleline: { max: 10 }, multiline: { max: 1 } }],
      'vue/define-macros-order': [
        'warn',
        {
          order: ['defineOptions', 'defineModel', 'defineProps', 'defineEmits', 'defineSlots'],
          defineExposeLast: false,
        },
      ],
      'vue/block-order': ['warn', { order: [['script', 'template'], 'style'] }],

      ...immutabilityRules,
    },
  },

  // TypeScript source files (non-Vue)
  {
    name: 'typescript/source-files',
    files: ['src/**/*.ts'],
    ignores: ['src/workers/*.worker.ts', 'src/**/__tests__/**/*.ts'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...commonTypeScriptRules,
      ...immutabilityRules,
    },
  },

  // Web Worker files (separate TypeScript project)
  {
    name: 'typescript/worker-files',
    files: ['src/workers/*.worker.ts'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      globals: {
        ...globals.worker,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
      ...immutabilityRules,
    },
  },

  // Config files (no type checking)
  {
    name: 'config-files',
    files: ['*.{js,mjs,cjs,ts}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Unit test files (Vitest)
  {
    name: 'unit-tests',
    files: ['src/**/__tests__/**/*.ts'],
    extends: [tseslint.configs.recommended, tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // E2E test files
  {
    name: 'e2e-tests',
    files: ['e2e/**/*.ts'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: false,
      },
    },
  },

  // Type declaration files
  {
    name: 'type-declarations',
    files: ['**/*.d.ts'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  // Prettier must be last
  prettierConfig,
)
