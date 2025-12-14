<script setup lang="ts">
import Tag from 'primevue/tag'
import Panel from 'primevue/panel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import PanelHeader from '@/components/layout/PanelHeader.vue'

import { ENCODING_EXAMPLES } from '@/composables/useUrlEncoder'
</script>

<template>
  <Panel toggleable>
    <template #header>
      <PanelHeader icon="book">
        Common URL Encoding Characters
        <Tag :value="`${ENCODING_EXAMPLES.length} chars`" severity="secondary" />
      </PanelHeader>
    </template>

    <DataTable :value="ENCODING_EXAMPLES" striped-rows size="small">
      <Column field="char" header="Character" style="width: 100px">
        <template #body="slotProps">
          <code class="char-display">{{ slotProps.data.char }}</code>
        </template>
      </Column>
      <Column field="encoded" header="Encoded" style="width: 120px">
        <template #body="slotProps">
          <Tag :value="slotProps.data.encoded" severity="info" />
        </template>
      </Column>
      <Column field="description" header="Description">
        <template #body="slotProps">
          <span class="description-text">{{ slotProps.data.description }}</span>
        </template>
      </Column>
    </DataTable>
  </Panel>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.char-display {
  display: inline-block;
  width: 30px;
  text-align: center;
  background-color: var(--surface-ground);
  padding: 0.25rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.description-text {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}
</style>
