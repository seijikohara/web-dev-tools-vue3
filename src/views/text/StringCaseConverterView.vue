<script setup lang="ts">
import { useClipboardToast } from '@/composables/useClipboardToast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import { useStringCaseConverter } from '@/composables/useStringCaseConverter'

const { copy } = useClipboardToast()

// Use composable
const {
  inputText,
  conversions,
  inputStats,
  hasInput,
  loadSample,
  clear: clearAll,
} = useStringCaseConverter()

// UI actions with toast notifications
const copyResult = (result: string, name: string) => {
  void copy(result, { detail: `${name} copied to clipboard` })
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-sort-alpha-down"></i>
        <span>String Case Converter</span>
      </div>
    </template>
    <template #subtitle>
      Convert text between camelCase, PascalCase, snake_case, kebab-case, and more
    </template>
    <template #content>
      <Panel toggleable class="input-panel">
        <template #header>
          <div class="panel-header">
            <i class="pi pi-pencil"></i>
            <span>Input Text</span>
            <Tag
              v-if="inputStats"
              :value="`${inputStats.words} words / ${inputStats.chars} chars`"
              severity="info"
            />
          </div>
        </template>

        <CodeEditor v-model="inputText" mode="plain_text" height="100px" />

        <Toolbar class="editor-toolbar">
          <template #start>
            <Button
              v-tooltip.top="'Load Sample'"
              icon="pi pi-file"
              label="Sample"
              severity="info"
              text
              @click="loadSample"
            />
          </template>
          <template #end>
            <Button
              v-tooltip.top="'Clear'"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              :disabled="!hasInput"
              @click="clearAll"
            />
          </template>
        </Toolbar>
      </Panel>

      <Transition name="fade-slide">
        <div v-if="conversions.length > 0" class="results-section">
          <DataTable :value="conversions" striped-rows class="results-table">
            <Column field="name" header="Case Type" style="width: 200px">
              <template #body="slotProps">
                <div class="case-name">
                  <Tag :value="slotProps.data.name" severity="secondary" />
                </div>
              </template>
            </Column>
            <Column field="result" header="Result">
              <template #body="slotProps">
                <code class="result-code">{{ slotProps.data.result }}</code>
              </template>
            </Column>
            <Column field="description" header="Description" style="width: 280px">
              <template #body="slotProps">
                <span class="description-text">{{ slotProps.data.description }}</span>
              </template>
            </Column>
            <Column :header-style="{ width: '80px' }">
              <template #body="slotProps">
                <Button
                  v-tooltip.top="'Copy'"
                  icon="pi pi-copy"
                  severity="secondary"
                  text
                  rounded
                  @click="copyResult(slotProps.data.result, slotProps.data.name)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="conversions.length === 0" class="empty-state">
          <i class="pi pi-sort-alpha-down"></i>
          <span>Enter text above to see all case conversions</span>
        </div>
      </Transition>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: var(--primary-color);
  }
}

.input-panel {
  margin-bottom: 1.5rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;

  i {
    color: var(--primary-color);
  }
}

.editor-toolbar {
  background: transparent;
  border: none;
  padding: 0.5rem 0;

  :deep(.p-toolbar-start),
  :deep(.p-toolbar-end) {
    gap: 0.5rem;
  }
}

.results-section {
  margin-top: 1rem;
}

.results-table {
  :deep(.p-datatable-thead > tr > th) {
    background-color: var(--surface-ground);
    font-weight: 600;
  }
}

.case-name {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.result-code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: var(--primary-color);
  background-color: var(--surface-ground);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  word-break: break-all;
}

.description-text {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: var(--text-color-secondary);

  i {
    font-size: 3rem;
    opacity: 0.3;
  }
}
</style>
