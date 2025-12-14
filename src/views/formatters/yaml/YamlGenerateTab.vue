<script setup lang="ts">
import { computed, inject } from 'vue'
import * as YAML from 'yaml'

import CodeGeneratorPanel from '@/components/code-generator/CodeGeneratorPanel.vue'
import { useCodeGenerator } from '@/composables/useCodeGenerator'

// Get state from parent (injected by main view)
const formatTabRef = inject<{
  state: { input: string }
  loadSample: () => void
}>('formatTabRef', {
  state: { input: '' },
  loadSample: () => {
    // Default implementation - will be overridden by actual ref
  },
})

// Code Generator - convert YAML to JSON for code generation
const yamlAsJson = computed(() => {
  try {
    const parsed = YAML.parse(formatTabRef.state.input) as unknown
    return JSON.stringify(parsed, null, 2)
  } catch {
    return ''
  }
})

const {
  language: codeGenLanguage,
  options: codeGenOptions,
  generatedCode,
  selectedLanguageInfo,
  editorMode: codeGenEditorMode,
  error: codeGenError,
  resetOptions: resetCodeGenOptions,
} = useCodeGenerator(yamlAsJson)
</script>

<template>
  <CodeGeneratorPanel
    :json-input="yamlAsJson"
    :language="codeGenLanguage"
    :options="codeGenOptions"
    :generated-code="generatedCode"
    :editor-mode="codeGenEditorMode"
    :selected-language-info="selectedLanguageInfo"
    :error="codeGenError"
    input-mode="yaml"
    input-label="YAML Input"
    @update:language="codeGenLanguage = $event"
    @update:options="Object.assign(codeGenOptions, $event)"
    @reset-options="resetCodeGenOptions"
    @load-sample="formatTabRef.loadSample"
  />
</template>
