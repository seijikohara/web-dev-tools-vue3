<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { VAceEditor } from 'vue3-ace-editor'

import '@/config/ace'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/mode-typescript'
import 'ace-builds/src-noconflict/mode-html'
import 'ace-builds/src-noconflict/mode-css'
import 'ace-builds/src-noconflict/mode-scss'
import 'ace-builds/src-noconflict/mode-xml'
import 'ace-builds/src-noconflict/mode-yaml'
import 'ace-builds/src-noconflict/mode-markdown'
import 'ace-builds/src-noconflict/mode-sql'
import 'ace-builds/src-noconflict/mode-python'
import 'ace-builds/src-noconflict/mode-java'
import 'ace-builds/src-noconflict/mode-php'
import 'ace-builds/src-noconflict/mode-ruby'
import 'ace-builds/src-noconflict/mode-golang'
import 'ace-builds/src-noconflict/mode-rust'
import 'ace-builds/src-noconflict/mode-c_cpp'
import 'ace-builds/src-noconflict/mode-csharp'
import 'ace-builds/src-noconflict/mode-plain_text'
import 'ace-builds/src-noconflict/theme-monokai'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/theme-tomorrow'
import 'ace-builds/src-noconflict/theme-twilight'
import 'ace-builds/src-noconflict/theme-xcode'
import 'ace-builds/src-noconflict/theme-solarized_dark'
import 'ace-builds/src-noconflict/theme-solarized_light'
import 'ace-builds/src-noconflict/ext-language_tools'

import { DEFAULT_EDITOR_OPTIONS, type EditorMode, type EditorTheme } from '@/constants/editor'

interface Props {
  mode?: EditorMode
  theme?: EditorTheme
  width?: string
  height?: string
  options?: Record<string, unknown>
}

const modelValue = defineModel<string>({ default: '' })
const {
  mode = 'json',
  theme = 'monokai',
  width = '100%',
  height = '400px',
  options = {},
} = defineProps<Props>()

const editorReady = ref(false)

const editorOptions = computed(() => ({
  ...DEFAULT_EDITOR_OPTIONS,
  ...options,
}))

onMounted(() => {
  // Ensure ace is properly initialized
  setTimeout(() => {
    editorReady.value = true
  }, 100)
})
</script>

<template>
  <div class="code-editor-wrapper">
    <VAceEditor
      v-if="editorReady"
      v-model:value="modelValue"
      :lang="mode"
      :theme="theme"
      :style="{ width, height }"
      :options="editorOptions"
    />
    <div v-else class="loading-editor" :style="{ width, height }">Loading editor...</div>
  </div>
</template>

<style scoped>
.code-editor-wrapper {
  position: relative;
}

.loading-editor {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  color: #666;
}

/* Override ace editor styles */
:deep(.ace_editor) {
  font-family:
    'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace !important;
}
</style>
