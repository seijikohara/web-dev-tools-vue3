<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Panel from 'primevue/panel'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import InputText from 'primevue/inputtext'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'

import { useJsonFormatter, useJsonQuery } from '@/composables/useJsonFormatter'

const { state } = useJsonFormatter()

const inputRef = computed(() => state.input)

const { jsonPathQuery, jsonPathResult, jsonPathError, commonQueries, executeJsonPath, applyQuery } =
  useJsonQuery(inputRef)
</script>

<template>
  <Panel toggleable class="options-panel">
    <template #header>
      <PanelHeader icon="search">JSON Path Query</PanelHeader>
    </template>

    <div class="query-input">
      <InputGroup>
        <InputGroupAddon>
          <i class="pi pi-search"></i>
        </InputGroupAddon>
        <InputText
          v-model="jsonPathQuery"
          placeholder="e.g., $.address.city or hobbies[0]"
          @keyup.enter="executeJsonPath"
        />
        <Button
          label="Query"
          icon="pi pi-play"
          :disabled="!jsonPathQuery || !state.input"
          @click="executeJsonPath"
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

  <Message v-if="jsonPathError" severity="error" :closable="false" class="query-error">
    <i class="pi pi-times-circle"></i>
    {{ jsonPathError }}
  </Message>

  <div class="editor-grid-2col">
    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file"></i>
        <span>Source JSON</span>
      </div>
      <CodeEditor
        v-model="state.input"
        mode="json"
        height="clamp(300px, calc(100vh - 520px), 600px)"
      />
    </div>

    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-check-square"></i>
        <span>Query Result</span>
        <Tag v-if="jsonPathResult" value="Match found" severity="success" icon="pi pi-check" />
      </div>
      <CodeEditor
        v-model="jsonPathResult"
        mode="json"
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
