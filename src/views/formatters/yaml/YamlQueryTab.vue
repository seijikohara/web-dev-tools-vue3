<script setup lang="ts">
import { ref, inject } from 'vue'
import * as YAML from 'yaml'

import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Panel from 'primevue/panel'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import InputText from 'primevue/inputtext'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'

// Get state from parent (injected by main view)
const formatTabRef = inject<{ state: { input: string } }>('formatTabRef', { state: { input: '' } })

// Query state
const yamlPathQuery = ref('')
const yamlPathResult = ref('')
const yamlPathError = ref('')

// YAML Path query (simple implementation using dot/bracket notation)
const executeYamlPath = () => {
  yamlPathError.value = ''
  yamlPathResult.value = ''

  if (!yamlPathQuery.value.trim()) return

  try {
    const parsed: unknown = YAML.parse(formatTabRef.state.input)
    const path = yamlPathQuery.value.trim()

    // Simple path parser (supports dot notation and array access)
    const parts = path
      .replace(/^\$\.?/, '')
      .split(/\.|\[|\]/)
      .filter(p => p !== '')

    const result = parts.reduce<unknown>((current, part) => {
      if (current === undefined || current === null) {
        throw new Error(`Path not found: ${path}`)
      }

      if (Array.isArray(current)) {
        const index = parseInt(part)
        if (isNaN(index)) {
          throw new Error(`Invalid array index: ${part}`)
        }
        return current[index]
      } else if (typeof current === 'object') {
        return (current as Record<string, unknown>)[part]
      }
      throw new Error(`Cannot access property of non-object: ${part}`)
    }, parsed)

    if (typeof result === 'object' && result !== null) {
      yamlPathResult.value = YAML.stringify(result, { indent: 2 })
    } else if (result === null || result === undefined) {
      yamlPathResult.value = ''
    } else if (typeof result === 'string') {
      yamlPathResult.value = result
    } else {
      yamlPathResult.value = YAML.stringify(result)
    }
  } catch (e) {
    yamlPathError.value = e instanceof Error ? e.message : 'Query failed'
  }
}

// Common YAML path queries
const commonQueries = [
  { label: '$.server', query: '$.server' },
  { label: '$.database', query: '$.database' },
  { label: '$.users[0]', query: '$.users[0]' },
]

const applyQuery = (query: string) => {
  yamlPathQuery.value = query
  executeYamlPath()
}
</script>

<template>
  <Panel toggleable class="options-panel">
    <template #header>
      <PanelHeader icon="search">YAML Path Query</PanelHeader>
    </template>

    <div class="query-input">
      <InputGroup>
        <InputGroupAddon>
          <i class="pi pi-search"></i>
        </InputGroupAddon>
        <InputText
          v-model="yamlPathQuery"
          placeholder="e.g., $.server.host or users[0].name"
          @keyup.enter="executeYamlPath"
        />
        <Button
          label="Query"
          icon="pi pi-play"
          :disabled="!yamlPathQuery || !formatTabRef.state.input"
          @click="executeYamlPath"
        />
      </InputGroup>
      <small class="hint-text">
        <i class="pi pi-info-circle"></i>
        Supports dot notation: $.key.subkey, array access: [0], or simple paths: key.subkey
      </small>
    </div>

    <div class="common-queries">
      <span class="query-label">Common queries:</span>
      <Button
        v-for="q in commonQueries"
        :key="q.query"
        :label="q.label"
        severity="secondary"
        text
        @click="applyQuery(q.query)"
      />
    </div>
  </Panel>

  <Message v-if="yamlPathError" severity="error" :closable="false" class="query-error">
    <i class="pi pi-times-circle"></i>
    {{ yamlPathError }}
  </Message>

  <div class="editor-grid-2col">
    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file"></i>
        <span>Source YAML</span>
      </div>
      <CodeEditor
        v-model="formatTabRef.state.input"
        mode="yaml"
        height="clamp(300px, calc(100vh - 520px), 600px)"
      />
    </div>

    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-check-square"></i>
        <span>Query Result</span>
        <Tag v-if="yamlPathResult" value="Match found" severity="success" icon="pi pi-check" />
      </div>
      <CodeEditor
        v-model="yamlPathResult"
        mode="yaml"
        height="clamp(300px, calc(100vh - 520px), 600px)"
        :options="{ readOnly: true }"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.query-input {
  margin-bottom: 1rem;
}

.common-queries {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  .query-label {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
  }
}

.query-error {
  margin-bottom: 1rem;

  i {
    margin-right: 0.5rem;
  }
}
</style>
