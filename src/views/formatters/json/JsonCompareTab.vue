<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'

import { useJsonFormatter, useJsonCompare } from '@/composables/useJsonFormatter'

const { state } = useJsonFormatter()

const inputRef = computed(() => state.input)

const {
  compareJson1,
  compareJson2,
  jsonCompareError,
  compareJsonDiff,
  loadToCompare1,
  loadToCompare2,
} = useJsonCompare(inputRef)
</script>

<template>
  <div class="editor-grid-2col">
    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file"></i>
        <span>JSON 1</span>
      </div>
      <CodeEditor
        v-model="compareJson1"
        mode="json"
        height="clamp(300px, calc(100vh - 520px), 600px)"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <Button
            label="Load Current"
            icon="pi pi-download"
            severity="secondary"
            :disabled="!state.input"
            @click="loadToCompare1"
          />
        </template>
      </Toolbar>
    </div>

    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file"></i>
        <span>JSON 2</span>
      </div>
      <CodeEditor
        v-model="compareJson2"
        mode="json"
        height="clamp(300px, calc(100vh - 520px), 600px)"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <Button
            label="Load Current"
            icon="pi pi-download"
            severity="secondary"
            :disabled="!state.input"
            @click="loadToCompare2"
          />
        </template>
      </Toolbar>
    </div>
  </div>

  <Message v-if="jsonCompareError" severity="error" :closable="false">
    <i class="pi pi-times-circle"></i>
    {{ jsonCompareError }}
  </Message>

  <SectionDivider v-if="compareJson1 && compareJson2 && !jsonCompareError" icon="list">
    Comparison Result
    <Tag
      v-if="compareJsonDiff.length > 0"
      :value="`${compareJsonDiff.length} differences`"
      severity="warn"
    />
    <Tag v-else value="Identical" severity="success" icon="pi pi-check" />
  </SectionDivider>

  <div v-if="compareJsonDiff.length > 0" class="diff-results">
    <DataTable :value="compareJsonDiff" striped-rows size="small">
      <Column field="path" header="Path" style="width: 200px">
        <template #body="slotProps">
          <code class="path-code">{{ slotProps.data.path }}</code>
        </template>
      </Column>
      <Column field="type" header="Type" style="width: 120px">
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.type"
            :severity="
              slotProps.data.type === 'added'
                ? 'success'
                : slotProps.data.type === 'removed'
                  ? 'danger'
                  : 'warn'
            "
          />
        </template>
      </Column>
      <Column header="Old Value">
        <template #body="slotProps">
          <code v-if="slotProps.data.oldValue" class="value-code removed">
            {{ slotProps.data.oldValue }}
          </code>
          <span v-else class="no-value">-</span>
        </template>
      </Column>
      <Column header="New Value">
        <template #body="slotProps">
          <code v-if="slotProps.data.newValue" class="value-code added">
            {{ slotProps.data.newValue }}
          </code>
          <span v-else class="no-value">-</span>
        </template>
      </Column>
    </DataTable>
  </div>

  <Message
    v-else-if="compareJson1 && compareJson2 && !jsonCompareError"
    severity="success"
    :closable="false"
  >
    <i class="pi pi-check-circle"></i>
    No differences found - JSONs are identical
  </Message>
</template>

<style lang="scss" scoped>
.diff-results {
  margin-top: 1rem;
}

.no-value {
  color: var(--text-color-secondary);
}
</style>
