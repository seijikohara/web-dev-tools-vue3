<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'
import CopyButton from '@/components/display/CopyButton.vue'

import { useHashGenerator } from '@/composables/useHashGenerator'

const { text, hashedValues, textStats } = useHashGenerator()
</script>

<template>
  <div class="panel-section">
    <PanelHeader icon="file-edit">
      Input Text
      <div class="stats-tags">
        <Tag severity="secondary" :value="`${textStats.chars} chars`" />
        <Tag severity="info" :value="`${textStats.bytes} bytes`" />
      </div>
    </PanelHeader>
    <CodeEditor v-model="text" mode="plain_text" height="180px" />
  </div>

  <SectionDivider icon="lock">Hash Results</SectionDivider>

  <DataTable :value="hashedValues" striped-rows size="small" class="hash-table">
    <Column header="Algorithm" :header-style="{ width: '130px' }">
      <template #body="slotProps">
        <div class="algorithm-cell">
          <Tag :value="slotProps.data.method" :severity="slotProps.data.severity" />
          <span class="bits-label">{{ slotProps.data.bits }} bits</span>
        </div>
      </template>
    </Column>
    <Column field="value" header="Hash Value">
      <template #body="slotProps">
        <code class="hash-value">{{ slotProps.data.value }}</code>
      </template>
    </Column>
    <Column :header-style="{ width: '80px' }">
      <template #body="slotProps">
        <CopyButton :value="slotProps.data.value" :tooltip="`Copy ${slotProps.data.method} hash`" />
      </template>
    </Column>
  </DataTable>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.panel-section {
  margin-bottom: 1rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.hash-table {
  margin-bottom: 1rem;
}

.algorithm-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bits-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.hash-value {
  word-break: break-all;
  font-size: 0.85rem;
  font-family: 'Monaco', 'Menlo', monospace;
  color: var(--primary-color);
}
</style>
