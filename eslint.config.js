// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'
import oxlint from 'eslint-plugin-oxlint'

export default defineConfig(
  // Global ignores (must be first)
  globalIgnores(['dist/', 'node_modules/', '.vite/', 'coverage/', 'playwright-report/']),

  // Vue 3 strongly-recommended rules (includes essential + readability improvements)
  pluginVue.configs['flat/strongly-recommended'],

  // Vue files only: parse <script> with @typescript-eslint/parser for syntax
  // (no project/projectService — oxlint, not ESLint, owns type-aware-adjacent
  // linting for every file, including the <script> block of .vue files).
  {
    name: 'vue/typescript',
    files: ['src/**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      // Vue 3 specific overrides (carried over from the previous config)
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
      'vue/define-macros-order': [
        'warn',
        {
          order: ['defineOptions', 'defineModel', 'defineProps', 'defineEmits', 'defineSlots'],
          defineExposeLast: false,
        },
      ],
      'vue/block-order': ['warn', { order: [['script', 'template'], 'style'] }],
      // vue/max-attributes-per-line intentionally dropped: it is
      // count-driven and fights oxfmt's width-driven line wrapping (the
      // same conflict found migrating json-tree-view-vue3 in Wave 2).
    },
  },

  // oxlint already lints <script> content in .vue files (and every .ts/.js
  // file) for the categories/rules configured in .oxlintrc.json; disable
  // the ESLint-side rules it duplicates so the two linters never disagree.
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
)
