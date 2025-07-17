<script setup lang="ts">
import { computed, reactive, watch, onMounted } from 'vue'
import { VAceEditor } from 'vue3-ace-editor'

// Import ace base and essential modes/themes
import ace from 'ace-builds'
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

// Import popular themes
import 'ace-builds/src-noconflict/theme-monokai'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/theme-tomorrow'
import 'ace-builds/src-noconflict/theme-twilight'
import 'ace-builds/src-noconflict/theme-xcode'
import 'ace-builds/src-noconflict/theme-solarized_dark'
import 'ace-builds/src-noconflict/theme-solarized_light'

// Import extensions
import 'ace-builds/src-noconflict/ext-language_tools'

// Configure ace worker path for Vite
import workerJsonUrl from 'ace-builds/src-noconflict/worker-json?url'
import workerJavascriptUrl from 'ace-builds/src-noconflict/worker-javascript?url'
import workerHtmlUrl from 'ace-builds/src-noconflict/worker-html?url'
import workerCssUrl from 'ace-builds/src-noconflict/worker-css?url'

ace.config.setModuleUrl('ace/mode/json_worker', workerJsonUrl)
ace.config.setModuleUrl('ace/mode/javascript_worker', workerJavascriptUrl)
ace.config.setModuleUrl('ace/mode/html_worker', workerHtmlUrl)
ace.config.setModuleUrl('ace/mode/css_worker', workerCssUrl)

const props = withDefaults(
  defineProps<{
    mode?: string
    theme?: string
    width?: string
    height?: string
    value?: string
    options?: object
  }>(),
  {
    mode: 'json',
    theme: 'monokai',
    width: '100%',
    height: '400px',
    value: '',
    options: () => ({}),
  },
)

const emit = defineEmits<{
  (e: 'update:value', value: string): void
}>()

const state = reactive({
  code: props.value || '',
  editorReady: false,
})

const editorOptions = computed(() => ({
  fontSize: 14,
  showPrintMargin: false,
  showGutter: true,
  highlightActiveLine: true,
  enableBasicAutocompletion: true,
  enableSnippets: true,
  enableLiveAutocompletion: true,
  tabSize: 2,
  wrap: false,
  ...props.options,
}))

watch(
  () => props.value,
  newValue => {
    if (newValue !== state.code) {
      state.code = newValue || ''
    }
  },
)

watch(
  () => state.code,
  newCode => {
    emit('update:value', newCode)
  },
)

const handleInput = (value: string) => {
  state.code = value
}

const handleEditorReady = () => {
  state.editorReady = true
}

onMounted(() => {
  // Ensure ace is properly initialized
  setTimeout(() => {
    state.editorReady = true
  }, 100)
})
</script>

<template>
  <div class="code-editor-wrapper">
    <VAceEditor
      v-if="state.editorReady"
      v-model:value="state.code"
      :lang="props.mode"
      :theme="props.theme"
      :style="{ width: props.width, height: props.height }"
      :options="editorOptions"
      @update:value="handleInput"
      @init="handleEditorReady"
    />
    <div v-else class="loading-editor" :style="{ width: props.width, height: props.height }">
      Loading editor...
    </div>
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
