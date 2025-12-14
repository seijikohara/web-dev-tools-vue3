<script lang="ts">
import type { EditorMode } from '@/composables/codeGenerators/types'

/**
 * Available editor themes (CodeMirror compatible)
 */
export const EDITOR_THEMES = [
  'monokai',
  'github',
  'tomorrow',
  'twilight',
  'xcode',
  'solarized_dark',
  'solarized_light',
] as const

/**
 * Available editor modes (language modes)
 * Note: EditorMode type is defined in @/composables/codeGenerators/types.ts
 */
export const EDITOR_MODES = [
  'json',
  'javascript',
  'typescript',
  'html',
  'css',
  'scss',
  'xml',
  'yaml',
  'markdown',
  'sql',
  'python',
  'java',
  'php',
  'ruby',
  'golang',
  'rust',
  'c_cpp',
  'csharp',
  'plain_text',
] as const

export type EditorTheme = (typeof EDITOR_THEMES)[number]
export type { EditorMode }

/**
 * CodeEditor component options
 */
export interface EditorOptions {
  /** Read-only mode (default: false) */
  readOnly?: boolean
  /** Tab size in spaces (default: 2) */
  tabSize?: number
  /** Show line numbers gutter (default: true) */
  lineNumbers?: boolean
  /** Enable line wrapping (default: false) */
  lineWrapping?: boolean
  /** Highlight the active line (default: true) */
  highlightActiveLine?: boolean
  /** Enable bracket matching (default: true) */
  bracketMatching?: boolean
  /** Enable auto-closing brackets (default: true) */
  closeBrackets?: boolean
  /** Enable code folding (default: true) */
  foldGutter?: boolean
  /** Enable search functionality (default: true) */
  search?: boolean
  /** Enable undo/redo history (default: true) */
  history?: boolean
  /** Enable autocompletion (default: true) */
  autocompletion?: boolean
  /** Enable multiple selections (default: true) */
  allowMultipleSelections?: boolean
  /** Enable rectangular selection with Alt key (default: true) */
  rectangularSelection?: boolean
  /** Show crosshair cursor with Alt key (default: true) */
  crosshairCursor?: boolean
  /** Highlight special characters (default: true) */
  highlightSpecialChars?: boolean
  /** Highlight matching selections (default: true) */
  highlightSelectionMatches?: boolean
  /** Enable indent on input (default: true) */
  indentOnInput?: boolean
  /** Show drop cursor indicator (default: true) */
  dropCursor?: boolean
  /** Draw custom selection (default: true) */
  drawSelection?: boolean
  /** Placeholder text when empty */
  placeholder?: string
}

export interface CodeEditorProps {
  mode?: EditorMode
  theme?: EditorTheme
  width?: string
  height?: string
  options?: EditorOptions
}
</script>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import Codemirror from 'vue-codemirror6'
import {
  EditorView,
  lineNumbers as lineNumbersExtension,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  placeholder as placeholderExtension,
} from '@codemirror/view'
import { EditorState, type Extension } from '@codemirror/state'
import { bracketMatching, foldGutter, foldKeymap, indentOnInput } from '@codemirror/language'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { closeBrackets, closeBracketsKeymap, autocompletion } from '@codemirror/autocomplete'
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands'
import { keymap } from '@codemirror/view'

// Language imports
import { json } from '@codemirror/lang-json'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { xml } from '@codemirror/lang-xml'
import { yaml } from '@codemirror/lang-yaml'
import { markdown } from '@codemirror/lang-markdown'
import { sql } from '@codemirror/lang-sql'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { php } from '@codemirror/lang-php'
import { rust } from '@codemirror/lang-rust'
import { cpp } from '@codemirror/lang-cpp'

// Theme imports
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView as ThemeEditorView } from '@codemirror/view'

const modelValue = defineModel<string>({ default: '' })

const {
  mode = 'json',
  theme = 'monokai',
  width = '100%',
  height = '400px',
  options = {},
} = defineProps<CodeEditorProps>()

/**
 * Theme configuration mapping
 * Maps theme names to their corresponding extensions
 */
const DARK_THEMES = new Set(['monokai', 'twilight', 'solarized_dark'])

/**
 * Light theme base styles
 */
const lightTheme = ThemeEditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
  },
  '.cm-content': {
    caretColor: '#000000',
  },
  '.cm-cursor': {
    borderLeftColor: '#000000',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#d7d4f0',
  },
  '.cm-activeLine': {
    backgroundColor: '#f5f5f5',
  },
  '.cm-gutters': {
    backgroundColor: '#f7f7f7',
    color: '#999999',
    borderRight: '1px solid #ddd',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#e8e8e8',
  },
})

// Editor view reference
const editorView = shallowRef<EditorView>()

// Language extension mapping
const languageExtensions: Record<string, ReturnType<typeof json>> = {
  json: json(),
  javascript: javascript(),
  typescript: javascript({ typescript: true }),
  html: html(),
  css: css(),
  scss: css(),
  xml: xml(),
  yaml: yaml(),
  markdown: markdown(),
  sql: sql(),
  python: python(),
  java: java(),
  php: php(),
  rust: rust(),
  c_cpp: cpp(),
  csharp: cpp(),
  golang: javascript(),
  ruby: python(),
  plain_text: json(),
}

// Get language extension based on mode
const langExtension = computed(() => languageExtensions[mode] ?? json())

// Theme extension based on theme prop
const themeExtension = computed(() => {
  return DARK_THEMES.has(theme) ? oneDark : lightTheme
})

// Build extensions array based on options
const extensions = computed(() => {
  // Extract options with defaults
  const opts = {
    readOnly: options.readOnly ?? false,
    tabSize: options.tabSize ?? 2,
    lineNumbers: options.lineNumbers ?? true,
    lineWrapping: options.lineWrapping ?? true,
    highlightActiveLine: options.highlightActiveLine ?? true,
    bracketMatching: options.bracketMatching ?? true,
    closeBrackets: options.closeBrackets ?? true,
    foldGutter: options.foldGutter ?? true,
    search: options.search ?? true,
    history: options.history ?? true,
    autocompletion: options.autocompletion ?? true,
    allowMultipleSelections: options.allowMultipleSelections ?? true,
    rectangularSelection: options.rectangularSelection ?? true,
    crosshairCursor: options.crosshairCursor ?? true,
    highlightSpecialChars: options.highlightSpecialChars ?? true,
    highlightSelectionMatches: options.highlightSelectionMatches ?? true,
    indentOnInput: options.indentOnInput ?? true,
    dropCursor: options.dropCursor ?? true,
    drawSelection: options.drawSelection ?? true,
    placeholder: options.placeholder,
  }

  return (
    [
      // Core configuration
      langExtension.value,
      themeExtension.value,
      EditorState.tabSize.of(opts.tabSize),
      // Line numbers
      opts.lineNumbers && lineNumbersExtension(),
      // Line wrapping
      opts.lineWrapping && EditorView.lineWrapping,
      // Highlight active line
      ...(opts.highlightActiveLine ? [highlightActiveLine(), highlightActiveLineGutter()] : []),
      // Bracket matching
      opts.bracketMatching && bracketMatching(),
      // Auto-close brackets
      ...(opts.closeBrackets ? [closeBrackets(), keymap.of(closeBracketsKeymap)] : []),
      // Code folding
      ...(opts.foldGutter ? [foldGutter(), keymap.of(foldKeymap)] : []),
      // Search
      opts.search && keymap.of(searchKeymap),
      // History (undo/redo)
      ...(opts.history ? [history(), keymap.of(historyKeymap)] : []),
      // Autocompletion
      opts.autocompletion && autocompletion(),
      // Multiple selections
      opts.allowMultipleSelections && EditorState.allowMultipleSelections.of(true),
      // Rectangular selection
      opts.rectangularSelection && rectangularSelection(),
      // Crosshair cursor
      opts.crosshairCursor && crosshairCursor(),
      // Highlight special characters
      opts.highlightSpecialChars && highlightSpecialChars(),
      // Highlight selection matches
      opts.highlightSelectionMatches && highlightSelectionMatches(),
      // Indent on input
      opts.indentOnInput && indentOnInput(),
      // Drop cursor
      opts.dropCursor && dropCursor(),
      // Draw selection
      opts.drawSelection && drawSelection(),
      // Placeholder
      opts.placeholder && placeholderExtension(opts.placeholder),
      // Default keymap
      keymap.of(defaultKeymap),
      // Read-only mode
      ...(opts.readOnly ? [EditorState.readOnly.of(true), EditorView.editable.of(false)] : []),
    ] as (Extension | false | undefined)[]
  )
    .filter((ext): ext is Extension => Boolean(ext))
    .flat()
})

// Handle editor ready
const handleReady = (payload: { view: EditorView; state: EditorState; container: HTMLElement }) => {
  editorView.value = payload.view
}

// Sync external changes to editor
watch(
  () => modelValue.value,
  newValue => {
    if (editorView.value) {
      const currentValue = editorView.value.state.doc.toString()
      if (currentValue !== newValue) {
        editorView.value.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: newValue,
          },
        })
      }
    }
  },
)
</script>

<template>
  <div class="code-editor-wrapper" :style="{ width, height }">
    <Codemirror
      v-model="modelValue"
      :extensions="extensions"
      :style="{ width: '100%', height: '100%' }"
      @ready="handleReady"
    />
  </div>
</template>

<style scoped>
.code-editor-wrapper {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--surface-border, #ddd);
  border-radius: 6px;
}

.code-editor-wrapper :deep(.cm-editor) {
  height: 100%;
  max-width: 100%;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 14px;
}

.code-editor-wrapper :deep(.cm-scroller) {
  overflow: auto;
}

.code-editor-wrapper :deep(.cm-content) {
  max-width: 100%;
  word-break: break-all;
}

.code-editor-wrapper :deep(.cm-focused) {
  outline: none;
}

.code-editor-wrapper :deep(.cm-gutters) {
  border-right: 1px solid var(--surface-border, #ddd);
}

.code-editor-wrapper :deep(.cm-placeholder) {
  color: var(--text-color-secondary, #999);
  font-style: italic;
}

.code-editor-wrapper :deep(.cm-foldGutter) {
  width: 1em;
}

.code-editor-wrapper :deep(.cm-activeLineGutter) {
  background-color: var(--surface-hover, rgba(0, 0, 0, 0.05));
}
</style>
