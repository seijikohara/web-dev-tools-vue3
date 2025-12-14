<script setup lang="ts">
import { computed } from 'vue'

import CodeGeneratorPanel from '@/components/code-generator/CodeGeneratorPanel.vue'
import { useJsonFormatter } from '@/composables/useJsonFormatter'
import { useCodeGenerator } from '@/composables/useCodeGenerator'

const { state, loadSample } = useJsonFormatter()

const jsonInputRef = computed(() => state.input)

const {
  language: codeGenLanguage,
  options: codeGenOptions,
  generatedCode,
  selectedLanguageInfo,
  editorMode: codeGenEditorMode,
  error: codeGenError,
  resetOptions: resetCodeGenOptions,
} = useCodeGenerator(jsonInputRef)
</script>

<template>
  <CodeGeneratorPanel
    :json-input="state.input"
    :language="codeGenLanguage"
    :options="codeGenOptions"
    :generated-code="generatedCode"
    :editor-mode="codeGenEditorMode"
    :selected-language-info="selectedLanguageInfo"
    :error="codeGenError"
    input-mode="json"
    input-label="JSON Input"
    @update:language="codeGenLanguage = $event"
    @update:options="Object.assign(codeGenOptions, $event)"
    @reset-options="resetCodeGenOptions"
    @load-sample="loadSample"
  />
</template>
