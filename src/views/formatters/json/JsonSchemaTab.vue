<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Panel from 'primevue/panel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'
import CopyButton from '@/components/display/CopyButton.vue'

import { useJsonFormatter, useJsonSchema } from '@/composables/useJsonFormatter'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { showSuccess, showWarning } = useClipboardToast()

const { state, loadSample } = useJsonFormatter()

const inputRef = computed(() => state.input)

const {
  schemaInput,
  schemaErrors,
  schemaValidationResult,
  schemaParseError,
  validateSchema,
  loadSampleSchema,
  generateSchemaFromData,
} = useJsonSchema(inputRef)

const onLoadSampleSchema = () => {
  loadSampleSchema(loadSample)
}

const onGenerateSchema = () => {
  const result = generateSchemaFromData()
  if (result.success) {
    showSuccess('Generated', 'Schema generated from JSON data')
  } else {
    showWarning('No Data', result.error ?? 'Failed to generate schema')
  }
}
</script>

<template>
  <Panel toggleable class="options-panel">
    <template #header>
      <PanelHeader icon="verified">
        JSON Schema Validator
        <Tag
          v-if="schemaValidationResult"
          :value="schemaValidationResult.valid ? 'Valid' : 'Invalid'"
          :severity="schemaValidationResult.valid ? 'success' : 'danger'"
          :icon="schemaValidationResult.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"
        />
      </PanelHeader>
    </template>

    <small class="hint-text">
      <i class="pi pi-info-circle"></i>
      Validate JSON data against a JSON Schema (Draft-07). Supports format validation (email, uri,
      date, etc.)
    </small>
  </Panel>

  <Message v-if="schemaParseError" severity="error" :closable="false" class="schema-error">
    <i class="pi pi-times-circle"></i>
    {{ schemaParseError }}
  </Message>

  <Message
    v-if="schemaValidationResult?.error"
    severity="warn"
    :closable="false"
    class="schema-error"
  >
    <i class="pi pi-exclamation-triangle"></i>
    {{ schemaValidationResult.error }}
  </Message>

  <div class="editor-grid-2col">
    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file-edit"></i>
        <span>JSON Data</span>
      </div>
      <CodeEditor
        v-model="state.input"
        mode="json"
        height="clamp(250px, calc(100vh - 580px), 500px)"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <Button
            label="Load Sample"
            icon="pi pi-file"
            severity="secondary"
            text
            @click="loadSample"
          />
        </template>
      </Toolbar>
    </div>

    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-cog"></i>
        <span>JSON Schema</span>
      </div>
      <CodeEditor
        v-model="schemaInput"
        mode="json"
        height="clamp(250px, calc(100vh - 580px), 500px)"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <Button
            label="Validate"
            icon="pi pi-check"
            :disabled="!state.input || !schemaInput"
            @click="validateSchema"
          />
        </template>
        <template #end>
          <Button
            v-tooltip.top="'Generate Schema from Data'"
            icon="pi pi-bolt"
            severity="success"
            text
            :disabled="!state.input"
            @click="onGenerateSchema"
          />
          <Button
            v-tooltip.top="'Load Sample'"
            icon="pi pi-file"
            severity="info"
            text
            @click="onLoadSampleSchema"
          />
          <CopyButton
            :value="schemaInput"
            tooltip="Schema copied to clipboard"
            :disabled="!schemaInput"
          />
        </template>
      </Toolbar>
    </div>
  </div>

  <SectionDivider v-if="schemaValidationResult" icon="list"> Validation Result </SectionDivider>

  <Message
    v-if="schemaValidationResult?.valid"
    severity="success"
    :closable="false"
    class="validation-success"
  >
    <i class="pi pi-check-circle"></i>
    JSON is valid against the schema
  </Message>

  <div v-if="schemaErrors.length > 0" class="schema-errors">
    <DataTable :value="schemaErrors" striped-rows size="small">
      <Column field="path" header="Path" style="width: 150px">
        <template #body="slotProps">
          <code class="path-code">{{ slotProps.data.path }}</code>
        </template>
      </Column>
      <Column field="keyword" header="Rule" style="width: 120px">
        <template #body="slotProps">
          <Tag :value="slotProps.data.keyword" severity="warn" />
        </template>
      </Column>
      <Column field="message" header="Message">
        <template #body="slotProps">
          <span>{{ slotProps.data.message }}</span>
        </template>
      </Column>
      <Column header="Details" style="width: 200px">
        <template #body="slotProps">
          <code class="params-code">{{ JSON.stringify(slotProps.data.params) }}</code>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style lang="scss" scoped>
.schema-error {
  margin-bottom: 1rem;

  i {
    margin-right: 0.5rem;
  }
}

.validation-success {
  i {
    margin-right: 0.5rem;
  }
}

.schema-errors {
  margin-top: 1rem;
}

.params-code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  word-break: break-all;
  max-width: 180px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
