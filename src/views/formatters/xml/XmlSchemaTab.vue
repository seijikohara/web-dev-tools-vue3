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

import { useXmlFormatter, useXmlSchema } from '@/composables/useXmlFormatter'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { showSuccess, showWarning } = useClipboardToast()

const { state, loadSample } = useXmlFormatter()

const inputRef = computed(() => state.input)

const {
  schemaInput,
  schemaErrors,
  schemaValidationResult,
  schemaParseError,
  validateXmlSchema,
  loadSampleSchema,
  generateSchemaFromData,
} = useXmlSchema(inputRef)

const onLoadSampleSchema = () => {
  loadSampleSchema(loadSample)
}

const onGenerateSchema = () => {
  const result = generateSchemaFromData()
  if (result.success) {
    showSuccess('Generated', 'Schema rules generated from XML data')
  } else {
    showWarning('Error', result.error ?? 'Failed to generate schema')
  }
}
</script>

<template>
  <Panel toggleable class="schema-panel">
    <template #header>
      <PanelHeader icon="verified">
        XML Structure Validator
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
      Validate XML structure against a JSON schema definition. Define element rules, required
      attributes, and allowed children.
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
        <span>XML Data</span>
      </div>
      <CodeEditor
        v-model="state.input"
        mode="xml"
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
        <span>Schema Rules (JSON)</span>
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
            @click="validateXmlSchema"
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
            v-tooltip.top="'Load Sample Schema'"
            icon="pi pi-file"
            severity="info"
            text
            @click="onLoadSampleSchema"
          />
          <CopyButton
            v-tooltip.top="'Copy Schema'"
            :value="schemaInput"
            icon-only
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
    XML structure is valid against the schema
  </Message>

  <div v-if="schemaErrors.length > 0" class="schema-errors">
    <DataTable :value="schemaErrors" striped-rows size="small">
      <Column field="path" header="Path" style="width: 200px">
        <template #body="slotProps">
          <code class="path-code">{{ slotProps.data.path }}</code>
        </template>
      </Column>
      <Column field="rule" header="Rule" style="width: 150px">
        <template #body="slotProps">
          <Tag :value="slotProps.data.rule" severity="warn" />
        </template>
      </Column>
      <Column field="message" header="Message">
        <template #body="slotProps">
          <span>{{ slotProps.data.message }}</span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style lang="scss" scoped>
.schema-panel {
  margin-bottom: 1rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}

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
</style>
