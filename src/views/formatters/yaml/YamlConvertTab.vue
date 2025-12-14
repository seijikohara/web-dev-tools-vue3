<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import * as YAML from 'yaml'
import xmlFormatter from 'xml-formatter'

import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import CopyButton from '@/components/display/CopyButton.vue'

// Get state from parent (injected by main view)
const formatTabRef = inject<{ state: { input: string } }>('formatTabRef', { state: { input: '' } })

// Convert output
const convertOutput = ref('')
const convertError = ref('')
const convertFormat = ref<'json' | 'xml'>('json')

// Convert mode for editor
const convertOutputMode = computed(() => {
  return convertFormat.value === 'json' ? 'json' : 'xml'
})

// Convert to JSON helper
const jsonToXml = (obj: unknown, rootName = 'root'): string => {
  const convert = (data: unknown, name: string): string => {
    if (data === null || data === undefined) {
      return `<${name}/>`
    }
    if (Array.isArray(data)) {
      return data.map(item => convert(item, name)).join('')
    }
    if (typeof data === 'object') {
      const entries = Object.entries(data as Record<string, unknown>)
      const children = entries.map(([key, value]) => convert(value, key)).join('')
      return `<${name}>${children}</${name}>`
    }
    // Primitive types: string, number, boolean, bigint, symbol
    const primitiveValue = typeof data === 'string' ? data : JSON.stringify(data)
    return `<${name}>${primitiveValue}</${name}>`
  }

  return convert(obj, rootName)
}

// Convert YAML to other formats
const convertTo = (targetFormat: 'json' | 'xml') => {
  convertOutput.value = ''
  convertError.value = ''
  convertFormat.value = targetFormat

  try {
    const parsed: unknown = YAML.parse(formatTabRef.state.input)

    if (targetFormat === 'json') {
      convertOutput.value = JSON.stringify(parsed, null, 2)
    } else {
      // targetFormat === 'xml'
      const parsedObj =
        typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null
      const rootName = parsedObj ? (Object.keys(parsedObj)[0] ?? 'root') : 'root'
      const xmlContent =
        parsedObj && Object.keys(parsedObj).length === 1
          ? jsonToXml(parsedObj[rootName], rootName)
          : jsonToXml(parsed, 'root')
      convertOutput.value = xmlFormatter(xmlContent, { indentation: '  ' })
    }
  } catch (e) {
    convertError.value = e instanceof Error ? e.message : 'Conversion failed'
  }
}
</script>

<template>
  <div class="editor-grid-2col">
    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file-edit"></i>
        <span>YAML Input</span>
      </div>
      <CodeEditor
        v-model="formatTabRef.state.input"
        mode="yaml"
        height="clamp(300px, calc(100vh - 520px), 600px)"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <Button
            label="To JSON"
            icon="pi pi-arrow-right"
            :disabled="!formatTabRef.state.input"
            @click="convertTo('json')"
          />
          <Button
            label="To XML"
            icon="pi pi-arrow-right"
            severity="secondary"
            :disabled="!formatTabRef.state.input"
            @click="convertTo('xml')"
          />
        </template>
      </Toolbar>
    </div>

    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file-export"></i>
        <span>{{ convertFormat.toUpperCase() }} Output</span>
        <Tag
          v-if="convertOutput"
          :value="convertFormat.toUpperCase()"
          :severity="convertFormat === 'json' ? 'info' : 'warn'"
        />
      </div>
      <CodeEditor
        v-model="convertOutput"
        :mode="convertOutputMode"
        height="clamp(300px, calc(100vh - 520px), 600px)"
        :options="{ readOnly: true }"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <CopyButton
            :value="convertOutput"
            label="Copy"
            :tooltip="`${convertFormat.toUpperCase()} copied to clipboard`"
            :disabled="!convertOutput"
          />
        </template>
      </Toolbar>
    </div>
  </div>

  <Message v-if="convertError" severity="error" :closable="false">
    <i class="pi pi-times-circle"></i>
    {{ convertError }}
  </Message>
</template>
