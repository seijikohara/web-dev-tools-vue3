<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

import CopyButton from '@/components/display/CopyButton.vue'

import { useTimestampConverter } from '@/composables/useTimestampConverter'

const { commonTimestamps } = useTimestampConverter()
</script>

<template>
  <DataTable :value="commonTimestamps" striped-rows size="small" class="common-table">
    <Column field="label" header="Description" style="width: 150px">
      <template #body="slotProps">
        <Tag :value="slotProps.data.label" severity="secondary" />
      </template>
    </Column>
    <Column field="date" header="Date/Time">
      <template #body="slotProps">
        <code class="value-text">{{ slotProps.data.date }}</code>
      </template>
    </Column>
    <Column header="Timestamp (ms)">
      <template #body="slotProps">
        <code class="value-text">{{ slotProps.data.ts }}</code>
      </template>
    </Column>
    <Column style="width: 100px">
      <template #body="slotProps">
        <CopyButton
          :value="slotProps.data.ts.toString()"
          :tooltip="`${slotProps.data.label} copied to clipboard`"
          icon-only
          rounded
        />
      </template>
    </Column>
  </DataTable>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.common-table {
  .value-text {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
    color: var(--primary-color);
  }
}
</style>
